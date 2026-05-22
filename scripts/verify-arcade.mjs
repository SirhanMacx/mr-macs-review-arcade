import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const SCANNABLE_EXTS = new Set([".html", ".css", ".js", ".json"]);
const FILE_EXT_RE = /\.(?:html|css|js|json|png|jpe?g|webp|svg|gif|mp3|wav|woff2?|ttf|otf)$/i;

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isInsideRoot(path) {
  const rel = relative(root, path);
  return rel && !rel.startsWith("..") && !rel.includes("..");
}

function normalizeRef(raw) {
  const ref = String(raw || "").trim();
  if (!ref) return null;
  if (ref.startsWith("#")) return null;
  if (ref.startsWith("data:")) return null;
  if (ref.startsWith("blob:")) return null;
  if (ref.startsWith("about:")) return null;
  if (ref.startsWith("http://") || ref.startsWith("https://")) return null;
  return ref.split(/[?#]/)[0];
}

function resolveRef(fromFile, ref) {
  if (!ref) return null;
  if (ref.startsWith("/")) return resolve(root, "." + ref);
  return resolve(dirname(fromFile), ref);
}

function decodeSegments(ref) {
  return String(ref)
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

function resolveRefVariants(fromFile, ref) {
  const raw = resolveRef(fromFile, ref);
  const decoded = ref.includes("%") ? resolveRef(fromFile, decodeSegments(ref)) : null;
  // The May 22 2026 perf pass extracted ~17,000 lines out of index.html
  // into assets/arcade-hub-bootstrap.js. Inline string refs like
  // "games.json" or "data/foo.json" were written relative to index.html
  // (which loads the script), not relative to assets/. When verify-arcade
  // walks those refs from inside assets/*.js, dirname(fromFile) points at
  // assets/ and the script flags false-positive "missing assets/games.json"
  // errors. Also try resolving the ref from repo root as a fallback —
  // we still require the file to exist, so this only loosens the
  // resolution, never makes a real missing file pass.
  const rootRel = (ref.startsWith("./") || ref.startsWith("../") || ref.startsWith("/"))
    ? null
    : resolve(root, ref);
  const rootRelDecoded = (rootRel && ref.includes("%"))
    ? resolve(root, decodeSegments(ref))
    : null;
  return [raw, decoded, rootRel, rootRelDecoded].filter(Boolean);
}

function extractRefs(text) {
  const refs = new Set();

  // HTML attributes.
  for (const match of text.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
    refs.add(match[1]);
  }

  // CSS url(...)
  for (const match of text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)) {
    refs.add(match[1]);
  }

  // Common JS patterns: fetch("..."), import("..."), new Audio("..."), image.src="..."
  for (const match of text.matchAll(/\b(?:fetch|import|Audio|new\s+Audio)\(\s*["']([^"']+)["']/gi)) {
    refs.add(match[1]);
  }
  for (const match of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    refs.add(match[1]);
  }

  // Fallback: quoted local file paths with common extensions.
  for (const match of text.matchAll(/["'](\.{1,2}\/[^"']+\.[a-z0-9]{2,5})["']/gi)) {
    refs.add(match[1]);
  }

  return [...refs].map(normalizeRef).filter(Boolean).filter((ref) => FILE_EXT_RE.test(ref));
}

function readText(file) {
  return readFileSync(file, "utf8");
}

function verify() {
  const errors = [];
  const queued = [];
  const visited = new Set();

  const gamesPath = resolve(root, "games.json");
  if (!existsSync(gamesPath)) {
    console.error("Missing games.json");
    process.exit(2);
  }

  let games;
  try {
    games = JSON.parse(readText(gamesPath));
  } catch (err) {
    console.error("games.json is not valid JSON:", err?.message || err);
    process.exit(2);
  }
  if (!Array.isArray(games)) {
    console.error("games.json must be an array");
    process.exit(2);
  }

  const ids = new Set();
  for (const game of games) {
    if (!game?.id || !game?.file) {
      errors.push(`Bad manifest entry (missing id/file): ${JSON.stringify(game).slice(0, 220)}`);
      continue;
    }
    if (ids.has(game.id)) errors.push(`Duplicate game id: ${game.id}`);
    ids.add(game.id);
    const rawFile = normalizeRef(game.file);
    if (!rawFile) {
      errors.push(`Bad manifest entry (invalid file ref): ${game.id} -> ${game.file}`);
      continue;
    }
    const target = resolve(root, rawFile.includes("%") ? decodeSegments(rawFile) : rawFile);
    if (!isInsideRoot(target)) {
      errors.push(`Game file escapes root: ${game.id} -> ${game.file}`);
      continue;
    }
    queued.push(target);
  }

  // Always validate entrypoints.
  queued.push(resolve(root, "index.html"));
  queued.push(resolve(root, "games.json"));

  while (queued.length) {
    const file = queued.pop();
    if (visited.has(file)) continue;
    visited.add(file);

    if (!isFile(file)) {
      errors.push(`Missing file: ${relative(root, file)}`);
      continue;
    }

    const ext = extname(file).toLowerCase();
    if (!SCANNABLE_EXTS.has(ext)) continue;

    const text = readText(file);
    const refs = extractRefs(text);
    for (const ref of refs) {
      const variants = resolveRefVariants(file, ref);
      let matched = null;
      for (const candidate of variants) {
        if (candidate && isInsideRoot(candidate) && isFile(candidate)) {
          matched = candidate;
          break;
        }
      }
      if (!variants.length) continue;
      if (!matched) {
        const candidate = variants[0];
        if (candidate && isInsideRoot(candidate)) {
          errors.push(`Missing referenced file: ${relative(root, candidate)} (from ${relative(root, file)})`);
        }
        continue;
      }
      if (SCANNABLE_EXTS.has(extname(matched).toLowerCase())) queued.push(matched);
    }
  }

  if (errors.length) {
    console.error(`Arcade integrity check failed (${errors.length} issues):`);
    errors.slice(0, 80).forEach((err) => console.error("-", err));
    if (errors.length > 80) console.error(`...and ${errors.length - 80} more`);
    process.exit(1);
  }

  console.log(`Arcade integrity check OK. Scanned ${visited.size} files.`);
}

verify();
