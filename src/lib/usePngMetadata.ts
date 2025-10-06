import extract from "png-chunks-extract";
import text from "png-chunk-text";

// Heuristic splitter for combined prompts like:
// "masterpiece, ...\nNegative prompt: lowres, ...\nSteps: 20, Sampler: ...".
function splitCombinedPrompts(s: string): { pos: string; neg?: string } {
  let pos = s || "";
  let neg: string | undefined;

  const lower = s.toLowerCase();
  const label = "negative prompt:";
  const i = lower.indexOf(label);
  if (i >= 0) {
    pos = s.slice(0, i).replace(/^\s*prompt:\s*/i, "").trim();
    let rest = s.slice(i + label.length);
    // Trim leading separators/spaces/newlines
    rest = rest.replace(/^[\s:\-]+/i, "");

    // Cut off trailing settings like "Steps:", "Sampler:", etc.
    const cut = rest.search(/\n\s*(steps|sampler|cfg\s*scale|seed|size|model|vae|clip\s*skip|denoising\s*strength)\s*:/i);
    neg = (cut >= 0 ? rest.slice(0, cut) : rest).trim();
  } else {
    // If no explicit label, also remove a leading "Prompt:" if present
    pos = pos.replace(/^\s*prompt:\s*/i, "").trim();
  }

  return { pos, neg };
}

/**
 * Extracts and enriches PNG metadata for ComfyUI outputs.
 * - prompt: prefers CLIPTextEncode positive prompt text from workflow nodes.
 * - parameters: keeps original parameters text if present (or may include negative prompt if parsed).
 * - checkpoint, loras: inferred from workflow nodes.
 */
export async function enrichPngMeta(src: string) {
  // Only parse PNGs
  if (!src.toLowerCase().endsWith(".png")) return { src };

  const res = await fetch(src, { cache: "no-cache" });
  const buf = await res.arrayBuffer();
  const chunks = extract(new Uint8Array(buf));

  // Collect tEXt/iTXt/zTXt chunks into a map
  const map: Record<string, string> = {};
  for (const c of chunks) {
    if (c.name === "tEXt" || c.name === "iTXt" || c.name === "zTXt") {
      try {
        const t = text.decode(c.data);
        if (t?.keyword) map[t.keyword] = t.text || "";
      } catch {
        // ignore decode errors
      }
    }
  }

  // Defaults from common fields
  let prompt: string | undefined =
    map.prompt || map.Prompt || map.parameters || undefined;
  let parameters: string | undefined = map.parameters || map.Parameters || undefined;

  let checkpoint: string | null = null;
  let loras: string[] = [];

  const wfStr =
    map.workflow || map["sd-metadata"] || map["comfyui.workflow"] || null;

  // Consider multiple candidates that might contain JSON workflow
  const jsonCandidates = [wfStr, map.prompt, map.Prompt, map.parameters].filter(
    (v): v is string => typeof v === "string" && /^\s*[\{\[]/.test(v)
  );

  if (jsonCandidates.length) {
    try {
      const names = new Set<string>();
      const positiveTexts: string[] = [];
      const negativeTexts: string[] = [];

      const getNodes = (wf: any): any[] => {
        if (!wf || typeof wf !== "object") return [];
        if (Array.isArray(wf.nodes)) return wf.nodes;
        try {
          return Object.values(wf).filter(
            (v: any) =>
              v && typeof v === "object" && (("class_type" in v) || ("inputs" in v))
          );
        } catch {
          return [];
        }
      };

      for (const cand of jsonCandidates) {
        try {
          const wf = JSON.parse(cand);
          const nodes = getNodes(wf);

          // Build quick index by id (ids may be numbers or strings)
          const byId = new Map<string, any>();
          for (const n of nodes) {
            const id = (n as any)?.id;
            if (id !== undefined && id !== null) byId.set(String(id), n);
          }

          const readText = (ref: any): string | undefined => {
            // ref may be [nodeId, outputIndex] or a node id
            const nid = Array.isArray(ref) ? ref[0] : ref;
            const node = byId.get(String(nid));
            const t = node?.inputs?.text;
            if (typeof t === "string") return t;
            if (Array.isArray(t) && t.length > 0) return String(t[0]);
            return undefined;
          };

          const trySamplerExtraction = () => {
            for (const n of nodes) {
              const ins = (n as any)?.inputs || {};
              // Common sampler input names in ComfyUI graphs
              const posRef = ins.positive ?? ins["positive_conditioning"] ?? ins["positive_cond"];
              const negRef = ins.negative ?? ins["negative_conditioning"] ?? ins["negative_cond"];
              if (posRef !== undefined || negRef !== undefined) {
                const p = readText(posRef);
                const ng = readText(negRef);
                if (p) positiveTexts.push(p);
                if (ng) negativeTexts.push(ng);
                if (p || ng) return true;
              }
            }
            return false;
          };

          // Prefer direct extraction from sampler links (most reliable)
          trySamplerExtraction();

          for (const node of nodes) {
            const s = JSON.stringify(node).toLowerCase();

            if (!checkpoint) {
              const m =
                /"ckpt_name"\s*:\s*"([^"]+)"/.exec(s) ||
                /"model"\s*:\s*"([^"]+)"/.exec(s) ||
                /"checkpoint"\s*:\s*"([^"]+)"/.exec(s) ||
                /"model_name"\s*:\s*"([^"]+)"/.exec(s);
              if (m) checkpoint = m[1];
            }

            const l1 = s.match(/"lora[_\s]?name"\s*:\s*"([^"]+)"/g) || [];
            for (const hit of l1) {
              const mm = /"lora[_\s]?name"\s*:\s*"([^"]+)"/.exec(hit);
              if (mm?.[1]) names.add(mm[1]);
            }
            const l2 = s.match(/"lora"\s*:\s*"([^"]+)"/g) || [];
            for (const hit of l2) {
              const mm = /"lora"\s*:\s*"([^"]+)"/.exec(hit);
              if (mm?.[1]) names.add(mm[1]);
            }

            if (node?.class_type === "CLIPTextEncode") {
              const txt: unknown = node?.inputs?.text;
              const textStr =
                typeof txt === "string"
                  ? txt
                  : Array.isArray(txt) && txt.length > 0
                  ? String(txt[0])
                  : "";

              const title = String(node?._meta?.title || "").toLowerCase();

              // Heuristic: some workflows label both nodes as "Prompt".
              // Treat strings that look like standard negatives as negative even if not labeled.
              const looksNegative =
                title.includes("negative") ||
                /(^|[,;\n])\s*(lowres|worst quality|low quality|bad anatomy|bad proportions|signature|watermark|jpeg artifacts|text|logo|simple background|borders)\b/i.test(
                  textStr
                );

              if (textStr) {
                if (looksNegative) negativeTexts.push(textStr);
                else positiveTexts.push(textStr);
              }
            }
          }

          // Stop after first candidate that yields any positive text
          if (positiveTexts.length) break;
        } catch {
          // ignore malformed JSON candidate
        }
      }

      loras = Array.from(names);

      const positive = positiveTexts.join(", ").trim();
      if (positive) prompt = positive;

      const negative = negativeTexts.join(", ").trim();
      if (!parameters && negative) parameters = negative;

      // If prompt/parameters looked like JSON blobs and we didn't extract anything useful, hide them
      if (prompt && /^\s*[\{\[]/.test(prompt)) prompt = undefined;
      if (parameters && /^\s*[\{\[]/.test(parameters)) parameters = undefined;
    } catch {
      // ignore errors entirely
    }
  }

  // Normalize any A1111-style combined "Negative prompt:" strings
  if (prompt && (!parameters || /negative\s*prompt:/i.test(prompt))) {
    const { pos, neg } = splitCombinedPrompts(prompt);
    prompt = pos;
    if (!parameters && neg) parameters = neg;
  }
  if (parameters && /negative\s*prompt:/i.test(parameters)) {
    const { neg } = splitCombinedPrompts(parameters);
    parameters = neg || parameters;
  }

  return { src, prompt, parameters, checkpoint, loras };
}
