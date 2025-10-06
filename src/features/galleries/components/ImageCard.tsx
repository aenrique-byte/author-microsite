import { useEffect, useState } from "react";
import type { ImageMeta } from "../types";
import { API_BASE } from "../../../lib/apiBase";

/**
 * Split a single combined prompt string into positive + negative.
 * Handles:
 *  - Explicit "Negative prompt:" label (A1111 style)
 *  - No label: split at first common negative token (lowres, worst quality, etc.)
 */
function splitCombinedPromptsUI(s: string): { pos: string; neg?: string } {
  let text = (s || "").replace(/^\s*prompt:\s*/i, "").trim();
  const cutRe =
    /\n\s*(steps|sampler|cfg\s*scale|seed|size|model|vae|clip\s*skip|denoising\s*strength|hires\s*steps|hires\s*upscale|hires\s*upscaler|version|ensd|scheduler|refiner|tile|loras?)\s*:/i;

  // 1) Explicit label (allow same-line or next-line)
  const labelMatch = text.match(/\bnegative\s*(?:prompt)?\s*:\s*/i);
  if (labelMatch) {
    const parts = text.split(/\bnegative\s*(?:prompt)?\s*:\s*/i, 2);
    const pos = (parts[0] || "").trim();
    let neg = (parts.slice(1).join("\n") || "").replace(/^[\s:\-]+/, "");
    const cut = neg.search(cutRe);
    if (cut >= 0) neg = neg.slice(0, cut);
    return { pos, neg: neg.trim() };
  }

  // 2) No label: detect first negative token and split there
  const lower = text.toLowerCase();
  const tokenRe =
    /(?:^|[\n,;])\s*(lowres|worst quality|bad(?:[-\s]?anatomy|[-\s]?hands)|extra[-\s]?digits|missing[-\s]?fingers|watermark|signature|username|jpeg artifacts)\b/;
  const m2 = tokenRe.exec(lower);
  if (m2 && typeof m2.index === "number") {
    const token = m2[1].toLowerCase();
    // Find the actual token start in the original string
    const idxToken = lower.indexOf(token, m2.index);
    let pos = text.slice(0, idxToken).trim().replace(/[,\s]+$/, "").trim();
    let neg = text.slice(idxToken).replace(/^[\s,;]+/, "");
    const cut = neg.search(cutRe);
    if (cut >= 0) neg = neg.slice(0, cut);
    return { pos, neg: neg.trim() };
  }

  // 3) Fallback: everything is positive
  return { pos: text };
}

// Backend already sanitizes prompts, but add a robust client fallback for legacy data.
function looksJson(s?: string | null): boolean {
  if (!s) return false;
  const t = s.trim();
  return t.startsWith("{") || t.startsWith("[");
}

// Extract positive/negative texts from a Comfy/SDXL workflow JSON string without full parsing.
function parseClipTextsFromJsonString(s: string): { pos?: string; neg?: string } {
  const posTexts: string[] = [];
  const negTexts: string[] = [];
  const re = /"class_type"\s*:\s*"([^"]*cliptextencode[^"]*)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const start = Math.max(0, m.index - 600);
    const chunk = s.slice(start, m.index + 2000);
    const tm = /"text"\s*:\s*"((?:\\\\.|[^"\\\\])*)"/is.exec(chunk);
    if (tm) {
      // Unescape common JSON string escapes
      const raw = tm[1];
      const text = raw
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
      if (text) {
        const isNeg = /"(?:_meta"\s*:\s*\{[^}]*"title"|"label)"\s*:\s*"[^"]*negative[^"]*"/i.test(chunk);
        if (isNeg) negTexts.push(text);
        else posTexts.push(text);
      }
    }
  }
  const chooseLongest = (arr: string[]) => {
    let best: string | undefined;
    let bestLen = -1;
    for (const s2 of arr) {
      if (s2.length > bestLen) { bestLen = s2.length; best = s2; }
    }
    return best;
  };
  return { pos: chooseLongest(posTexts), neg: chooseLongest(negTexts) };
}

export function ImageCard({ im }: { im: ImageMeta }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"pos" | "neg" | null>(null);

  const doCopy = async (text: string, kind: "pos" | "neg") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1000);
    } catch {
      // ignore
    }
  };

  // Compute display prompts from available metadata with UI-side split fallback
  const rawPos = im.prompt || "";
  const rawNeg = im.parameters || undefined;

  // Always attempt to split the positive text, even if there's no explicit label,
  // to catch cases where negatives are appended without "Negative prompt:".
  let posPrompt: string | undefined;
  let negPrompt: string | undefined = rawNeg;

  if (rawPos) {
    const { pos, neg } = splitCombinedPromptsUI(rawPos);
    posPrompt = pos;
    if (!negPrompt && neg) negPrompt = neg;
  }

  // If a separate negative field exists, normalize it (strip label if present)
  if (negPrompt) {
    const { neg } = splitCombinedPromptsUI(negPrompt);
    negPrompt = neg || negPrompt;
  }

  // Fallback: if the server sent JSON-like prompt (legacy rows), try to extract texts client-side
  if ((!posPrompt || looksJson(posPrompt)) && looksJson(rawPos)) {
    const pp = parseClipTextsFromJsonString(rawPos);
    if (!posPrompt && pp.pos) posPrompt = pp.pos;
    if (!negPrompt && pp.neg) negPrompt = pp.neg;
  }
  // Final guard: never render raw JSON blobs in the UI as the positive prompt
  if (posPrompt && looksJson(posPrompt)) {
    posPrompt = undefined;
  }

  // Measure natural image size as a fallback when width/height are missing from API
  const [meas, setMeas] = useState<{ w?: number; h?: number }>({});
  const dw = im.width ?? meas.w;
  const dh = im.height ?? meas.h;

  // Mark ultra-wide (cinematic) images so they can span more grid columns
  const isUltra = !!(dw && dh && dw / dh >= 2.2);

  // Likes/Comments stats (fetched lazily)
  const [stats, setStats] = useState<{ likes: number; comments: number; liked: boolean }>({
    likes: 0,
    comments: 0,
    liked: false,
  });

  useEffect(() => {
    let ignore = false;
    if (im.id) {
      fetch(`${API_BASE}/images/gallery-stats.php?image_id=${im.id}`, { cache: "no-cache", credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!ignore && j && j.ok) {
            setStats({
              likes: j.likes ?? 0,
              comments: j.comments ?? 0,
              liked: !!j.liked,
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      ignore = true;
    };
  }, [im.id]);

  const toggleLike = async () => {
    if (!im.id) return;
    try {
      const r = await fetch(`${API_BASE}/images/gallery-like.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ image_id: im.id }),
      });
      if (r.ok) {
        const j = await r.json();
        setStats((s) => ({
          likes: j.like_count ?? s.likes,
          comments: j.comments ?? s.comments,
          liked: !!j.user_liked,
        }));
      }
    } catch {
      // ignore
    }
  };

  // Comments UI state
  type CommentRow = { id: number; author_name: string; content: string; created_at: string };
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [contentInput, setContentInput] = useState("");

  const loadComments = async () => {
    if (!im.id) return;
    setLoadingComments(true);
    try {
      const r = await fetch(`${API_BASE}/images/gallery-comment-list.php?image_id=${im.id}`, { cache: "no-cache", credentials: "same-origin" });
      if (r.ok) {
        const j = await r.json();
        setComments(j.comments || []);
        if (j.comments && Array.isArray(j.comments)) {
          setStats((s) => ({ ...s, comments: j.comments.length }));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (open && comments.length === 0 && !loadingComments) {
      loadComments();
    }
  }, [open]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!im.id) return;
    const content = contentInput.trim();
    if (!content) return;
    try {
      const r = await fetch(`${API_BASE}/images/gallery-comment-create.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          image_id: im.id,
          author_name: nameInput.trim() || "Anonymous",
          content,
        }),
      });
      if (r.ok) {
        await r.json(); // Consume the response
        // Create a comment object from the response
        const newComment: CommentRow = {
          id: Date.now(), // temporary ID
          author_name: nameInput.trim() || "Anonymous",
          content,
          created_at: new Date().toISOString()
        };
        setComments((prev) => [newComment, ...prev]);
        setContentInput("");
        setStats((s) => ({ ...s, comments: (s.comments ?? 0) + 1 }));
      } else {
        const t = await r.text().catch(() => "");
        alert(`Failed to submit comment: [${r.status}] ${t}`);
        console.error("Comment create failed", r.status, t);
      }
    } catch (e: any) {
      alert("Failed to submit comment: " + (e?.message || "error"));
    }
  };

  // Choose display name: title or filename (basename without extension)
  const displayName =
    (im.title && im.title.trim()) ||
    (() => {
      try {
        const pathOnly = (im.src || '').split('?')[0].split('#')[0];
        const base = pathOnly.split('/').pop() || 'Image';
        const noExt = base.replace(/\.[^./\\?#]+$/, '');
        return decodeURIComponent(noExt);
      } catch {
        return 'Image';
      }
    })();

  return (
    <div className={`rounded-2xl overflow-hidden border bg-white border-neutral-200 shadow-sm transition hover:shadow-md dark:bg-neutral-900 dark:border-neutral-800 ${isUltra ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <button
        className={`block w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 ${dw && dh ? '' : 'aspect-[4/5]'}`}
        style={{ aspectRatio: dw && dh ? `${dw}/${dh}` : undefined }}
        onClick={() => setOpen(true)}
        aria-label="Open image"
      >
        <img
          src={im.thumb ?? im.src}
          alt={im.prompt?.slice(0, 120) || "image"}
          loading="lazy"
          className="h-full w-full object-contain"
          onLoad={(e) => {
            if (!im.width || !im.height) {
              const el = e.currentTarget as HTMLImageElement;
              const nw = el.naturalWidth || undefined;
              const nh = el.naturalHeight || undefined;
              if (nw && nh && (meas.w !== nw || meas.h !== nh)) {
                setMeas({ w: nw, h: nh });
              }
            }
          }}
        />
      </button>

      <div className="p-3 space-y-3 text-sm">
        <div className="flex items-center gap-3 text-xs opacity-80">
          <span title="Likes">❤️ {stats.likes || 0}</span>
          <span>·</span>
          <span title="Comments">💬 {stats.comments || 0}</span>
        </div>
        {im.checkpoint && (
          <p className="opacity-80">
            <span className="opacity-60">Checkpoint:</span> {im.checkpoint}
          </p>
        )}
        {im.loras && im.loras.length > 0 && (
          <div className="opacity-90">
            <div className="opacity-60 mb-1">LoRAs</div>
            <div className="flex flex-wrap gap-1">
              {im.loras.map((l) => (
                <span
                  key={l}
                  className="inline-block rounded-md bg-neutral-100 px-2 py-0.5 text-xs border border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {posPrompt && (
          <div className="rounded-lg border bg-neutral-50 border-neutral-200 p-3 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="font-medium opacity-90">Positive Prompt</span>
              <button
                onClick={() => doCopy(posPrompt || "", "pos")}
                className="ml-auto rounded-md border border-neutral-300 bg-white text-neutral-700 px-2 py-1 text-xs hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600"
              >
                {copied === "pos" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap opacity-90">{posPrompt}</p>
          </div>
        )}

        {negPrompt && (
          <div className="rounded-lg border bg-neutral-50 border-neutral-200 p-3 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="font-medium opacity-90">Negative Prompt</span>
              <button
                onClick={() => doCopy(negPrompt || "", "neg")}
                className="ml-auto rounded-md border border-neutral-300 bg-white text-neutral-700 px-2 py-1 text-xs hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600"
              >
                {copied === "neg" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap opacity-90">{negPrompt}</p>
          </div>
        )}

        <a
          href={im.src}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs opacity-70 hover:opacity-100 underline"
          title={`${displayName} - Open original`}
        >
          {displayName} - Open original
        </a>

        
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 p-4 overflow-auto"
          onClick={() => setOpen(false)}
        >
          <div className="mx-auto max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md bg-white/90 px-2 py-1 text-sm text-neutral-900 hover:bg-white"
              >
                ✕ Close
              </button>
            </div>
            <img src={im.src} className="max-h-[70vh] w-full object-contain rounded-md" />
            <div className="mt-3 rounded-lg border bg-white border-neutral-200 p-3 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="mb-3 flex items-center gap-3">
                <button
                  onClick={toggleLike}
                  disabled={!im.id}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm ${
                    stats.liked
                      ? "border-pink-400 text-pink-700 dark:text-pink-300"
                      : "border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-neutral-600"
                  }`}
                  title={stats.liked ? "Unlike" : "Like"}
                >
                  <span>{stats.liked ? "❤️" : "🤍"}</span>
                  <span className="text-xs">{stats.likes || 0}</span>
                </button>
                <span className="text-xs opacity-80">💬 {stats.comments || 0}</span>
              </div>

              <h4 className="font-medium opacity-90 mb-2">Comments</h4>
              <form onSubmit={submitComment} className="space-y-2 mb-3">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="Name (optional)"
                />
                <textarea
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  rows={3}
                  placeholder="Share your thoughts..."
                  maxLength={1000}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                  >
                    Submit Comment
                  </button>
                  <span className="text-xs opacity-60">{contentInput.length}/1000</span>
                </div>
              </form>

              {loadingComments ? (
                <p className="text-sm opacity-70">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm opacity-70">No comments yet. Be the first to comment!</p>
              ) : (
                <ul className="space-y-2">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800"
                    >
                      <div className="text-xs opacity-60 mb-1">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 opacity-90">
                          {c.author_name || "Anonymous"}
                        </span>
                        {" • " + new Date(c.created_at).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap text-sm opacity-90">{c.content}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
