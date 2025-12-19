import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

async function copyDir(src, dest) {
  if (!(await pathExists(src))) return;
  await ensureDir(dest);
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await copyDir(s, d);
    } else if (e.isFile()) {
      await copyFile(s, d);
    } // ignore symlinks and others
  }
}

async function main() {
  const hasDist = await pathExists(DIST);
  if (!hasDist) {
    console.log("[postbuild] dist/ not found. Skipping copy.");
    return;
  }

  const srcApi = path.join(ROOT, "api");
  const destApi = path.join(DIST, "api");

  const srcDeployment = path.join(ROOT, "DEPLOYMENT.md");
  const destDeployment = path.join(DIST, "DEPLOYMENT.md");

  const srcHtaccess = path.join(ROOT, "public", ".htaccess");
  const destHtaccess = path.join(DIST, ".htaccess");

  const srcBotEntry = path.join(ROOT, "public", "bot-entry.php");
  const destBotEntry = path.join(DIST, "bot-entry.php");

  const srcPrerender = path.join(ROOT, "public", "prerender");
  const destPrerender = path.join(DIST, "prerender");

  // Copy API folder (for hosts with PHP support)
  if (await pathExists(srcApi)) {
    await copyDir(srcApi, destApi);
    console.log("[postbuild] Copied api/ to dist/api");
  } else {
    console.log("[postbuild] api/ not found, skipping.");
  }

  // Copy deployment guide
  if (await pathExists(srcDeployment)) {
    await copyFile(srcDeployment, destDeployment);
    console.log("[postbuild] Copied DEPLOYMENT.md to dist/");
  }

  // Copy .htaccess for SPA routing
  if (await pathExists(srcHtaccess)) {
    await copyFile(srcHtaccess, destHtaccess);
    console.log("[postbuild] Copied .htaccess to dist/");
  }

  // Copy bot-entry.php for SEO bot detection
  if (await pathExists(srcBotEntry)) {
    await copyFile(srcBotEntry, destBotEntry);
    console.log("[postbuild] Copied bot-entry.php to dist/");
  }

  // Copy prerender directory for SEO static pages
  if (await pathExists(srcPrerender)) {
    await copyDir(srcPrerender, destPrerender);
    console.log("[postbuild] Copied prerender/ to dist/prerender");
  }

  console.log("[postbuild] Author CMS build complete.");
}

main().catch((err) => {
  console.error("[postbuild] Failed:", err);
  // Do not hard-fail the build on copy issues
});
