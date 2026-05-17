#!/usr/bin/env node
// Comprehensive Jeopardy board quality audit + safe auto-fix pass.
//
// Walks every per-course Jeopardy HTML, brace-walks the `const GAME = {...};`
// JSON literal (NOT a naive regex — a `};` substring inside a clue string
// would fool a regex), and runs full structural + content checks.
//
// Auto-fixes ONLY safe issues (pad missing aliases to [answer], escape any
// literal `};` that appears inside a JSON string by rewriting to `} ;` so
// the string round-trips identically to a reader but no longer looks like a
// premature object terminator to downstream regex parsers).
//
// Content gibberish is FLAGGED, never silently rewritten.

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GAMES = join(root, "games");

// Directories to skip entirely (runners, not per-course boards)
const SKIP_DIRS = new Set(["generated-jeopardy", "generated-practice-exam"]);

// Pedagogy template gibberish — substrings that betray placeholder content
// that was never replaced with real curriculum.
const GIBBERISH_PHRASES = [
  "named anchor for this",
  "is a core idea in",
  "regents-style item",
  "foundational idea students identify",
  "synthesis response linking",
  "this term describes the structure",
  "this term describes the quantity",
  "which review target belongs",
  "specific evidence that proves a claim",
  "is the right term because it describes",
  "one-response target rather than an open essay"
];

const STALE_HEADER = "world in 1750";

// ---------------------------------------------------------------------------
// Brace-walker: extract the GAME object as a JSON string, handling `};` that
// might appear inside string literals.
//
// Strategy:
//   1. Find `const GAME = ` and step into the first `{`.
//   2. Walk character-by-character tracking depth (only braces outside of
//      string literals count), respecting `"..."` strings with `\` escapes.
//   3. Stop at the matching `}` (depth back to 0). The next char in source
//      should be `;`.
// ---------------------------------------------------------------------------

function extractGameJsonRange(text) {
  const startMarker = "const GAME = ";
  const idx = text.indexOf(startMarker);
  if (idx === -1) return null;
  let i = idx + startMarker.length;
  while (i < text.length && text[i] !== "{") i++;
  if (i >= text.length) return null;
  const start = i;
  let depth = 0;
  let inStr = false;
  let strQuote = "";
  let escape = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === strQuote) { inStr = false; strQuote = ""; continue; }
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strQuote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        // Found the closing brace of the GAME object literal.
        return { start, end: i + 1 };
      }
    }
  }
  return null;
}

function extractGame(text, file) {
  const range = extractGameJsonRange(text);
  if (!range) return { ok: false, error: "missing_game_block" };
  const json = text.slice(range.start, range.end);
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: "parse_error", message: e.message, json, range };
  }
  return { ok: true, game: parsed, json, range };
}

// ---------------------------------------------------------------------------
// Validation checks
// ---------------------------------------------------------------------------

function findGibberish(text) {
  if (typeof text !== "string") return [];
  const lower = text.toLowerCase();
  const hits = [];
  for (const phrase of GIBBERISH_PHRASES) {
    if (lower.includes(phrase)) hits.push(phrase);
  }
  return hits;
}

function checkGame(game, file, dirSlug) {
  const issues = [];
  if (!game || typeof game !== "object") {
    return [{ kind: "shape", detail: "GAME is not an object" }];
  }

  // 1. Game object shape
  if (!game.slug) issues.push({ kind: "shape", detail: "missing slug" });
  if (!game.title) issues.push({ kind: "shape", detail: "missing title" });
  if (!game.day) issues.push({ kind: "shape", detail: "missing day" });
  if (!Array.isArray(game.categories)) {
    issues.push({ kind: "shape", detail: "categories is not an array" });
  } else if (game.categories.length !== 5) {
    issues.push({ kind: "shape", detail: `categories length ${game.categories.length} (expected 5)` });
  }
  if (!game.final || typeof game.final !== "object") {
    issues.push({ kind: "shape", detail: "missing final" });
  }

  // 2. Categories integrity
  if (Array.isArray(game.categories)) {
    game.categories.forEach((cat, ci) => {
      const catLabel = `category[${ci}]`;
      if (!cat || typeof cat !== "object") {
        issues.push({ kind: "category", detail: `${catLabel}: not an object` });
        return;
      }
      // name
      if (typeof cat.name !== "string" || cat.name.length < 4) {
        issues.push({ kind: "category", detail: `${catLabel}: name missing or too short` });
      } else if (/\b[A-Z]\s+Integration\b/.test(cat.name) || /^X\s+Integration/i.test(cat.name)) {
        issues.push({ kind: "category", detail: `${catLabel}: template gibberish name "${cat.name}"` });
      } else {
        const gib = findGibberish(cat.name);
        for (const g of gib) issues.push({ kind: "gibberish", field: `${catLabel}.name`, phrase: g, text: cat.name });
      }
      // clues
      if (!Array.isArray(cat.clues)) {
        issues.push({ kind: "category", detail: `${catLabel}: clues not an array` });
        return;
      }
      if (cat.clues.length !== 5) {
        issues.push({ kind: "category", detail: `${catLabel}: ${cat.clues.length} clues (expected 5)` });
      }
      const valuesSeen = new Set();
      cat.clues.forEach((cl, qi) => {
        const clLabel = `${catLabel}.clue[${qi}]`;
        if (!cl || typeof cl !== "object") {
          issues.push({ kind: "clue", detail: `${clLabel}: not an object` });
          return;
        }
        // value
        if (![100, 200, 300, 400, 500].includes(cl.value)) {
          issues.push({ kind: "clue", detail: `${clLabel}: bad value ${cl.value}` });
        } else {
          if (valuesSeen.has(cl.value)) {
            issues.push({ kind: "clue", detail: `${clLabel}: duplicate value ${cl.value}` });
          }
          valuesSeen.add(cl.value);
        }
        // clue text
        if (typeof cl.clue !== "string" || cl.clue.trim().length < 10) {
          issues.push({ kind: "clue", detail: `${clLabel}: clue text too short` });
        } else {
          const gib = findGibberish(cl.clue);
          for (const g of gib) issues.push({ kind: "gibberish", field: `${clLabel}.clue`, phrase: g, text: cl.clue });
        }
        // answer
        if (typeof cl.answer !== "string" || cl.answer.trim().length < 2) {
          issues.push({ kind: "clue", detail: `${clLabel}: answer too short` });
        } else {
          const gib = findGibberish(cl.answer);
          for (const g of gib) issues.push({ kind: "gibberish", field: `${clLabel}.answer`, phrase: g, text: cl.answer });
        }
        // explanation
        if (typeof cl.explanation !== "string" || cl.explanation.trim().length < 10) {
          issues.push({ kind: "clue", detail: `${clLabel}: explanation too short` });
        } else {
          const gib = findGibberish(cl.explanation);
          for (const g of gib) issues.push({ kind: "gibberish", field: `${clLabel}.explanation`, phrase: g, text: cl.explanation });
        }
        // aliases
        if (!Array.isArray(cl.aliases)) {
          issues.push({ kind: "clue", detail: `${clLabel}: aliases not an array` });
        }
      });
      // Each value 100..500 must be present exactly once
      if (cat.clues.length === 5) {
        for (const v of [100, 200, 300, 400, 500]) {
          if (!valuesSeen.has(v)) {
            issues.push({ kind: "category", detail: `${catLabel}: missing value ${v}` });
          }
        }
      }
    });
  }

  // 3. Final Jeopardy integrity
  if (game.final && typeof game.final === "object") {
    const f = game.final;
    if (typeof f.category !== "string" || f.category.trim().length < 2) {
      issues.push({ kind: "final", detail: "final.category missing" });
    } else {
      const gib = findGibberish(f.category);
      for (const g of gib) issues.push({ kind: "gibberish", field: "final.category", phrase: g, text: f.category });
    }
    if (typeof f.clue !== "string" || f.clue.trim().length < 20) {
      issues.push({ kind: "final", detail: "final.clue too short" });
    } else {
      const gib = findGibberish(f.clue);
      for (const g of gib) issues.push({ kind: "gibberish", field: "final.clue", phrase: g, text: f.clue });
    }
    if (typeof f.answer !== "string" || f.answer.trim().length < 2) {
      issues.push({ kind: "final", detail: "final.answer too short" });
    } else {
      const gib = findGibberish(f.answer);
      for (const g of gib) issues.push({ kind: "gibberish", field: "final.answer", phrase: g, text: f.answer });
    }
    if (typeof f.explanation !== "string" || f.explanation.trim().length < 20) {
      issues.push({ kind: "final", detail: "final.explanation too short" });
    } else {
      const gib = findGibberish(f.explanation);
      for (const g of gib) issues.push({ kind: "gibberish", field: "final.explanation", phrase: g, text: f.explanation });
    }
    if (!Array.isArray(f.aliases)) {
      issues.push({ kind: "final", detail: "final.aliases not an array" });
    }
  }

  return issues;
}

function checkStaleHeader(fileText, dirSlug) {
  // Only flag the "World in 1750" Day-1 Global header on non-global-10 boards.
  if (dirSlug.startsWith("global-10")) return [];
  const lower = fileText.toLowerCase();
  if (!lower.includes(STALE_HEADER)) return [];
  // Distinguish kicker/h1/subtitle from a clue mentioning the same phrase
  // (which is legitimate in AP World, AP Euro, Global 9 clues).
  const issues = [];
  const headerSnippet = fileText.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (headerSnippet && headerSnippet[1].toLowerCase().includes(STALE_HEADER)) {
    issues.push({ kind: "stale_header", detail: `<h1> contains "World in 1750"` });
  }
  const kicker = fileText.match(/class=["'][^"']*kicker[^"']*["'][^>]*>([\s\S]*?)</i);
  if (kicker && kicker[1].toLowerCase().includes(STALE_HEADER)) {
    issues.push({ kind: "stale_header", detail: `kicker contains "World in 1750"` });
  }
  const subtitle = fileText.match(/class=["'][^"']*subtitle[^"']*["'][^>]*>([\s\S]*?)</i);
  if (subtitle && subtitle[1].toLowerCase().includes(STALE_HEADER)) {
    issues.push({ kind: "stale_header", detail: `subtitle contains "World in 1750"` });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Auto-fix helpers
// ---------------------------------------------------------------------------

function autoFix(game) {
  // Returns { fixedGame, fixes: string[] }
  const fixes = [];
  if (!game || typeof game !== "object") return { fixedGame: game, fixes };
  if (Array.isArray(game.categories)) {
    game.categories.forEach((cat, ci) => {
      if (!cat || !Array.isArray(cat.clues)) return;
      cat.clues.forEach((cl, qi) => {
        if (!cl || typeof cl !== "object") return;
        // Pad missing/empty aliases
        if (!Array.isArray(cl.aliases) || cl.aliases.length === 0) {
          if (typeof cl.answer === "string" && cl.answer.trim()) {
            cl.aliases = [cl.answer];
            fixes.push(`category[${ci}].clue[${qi}].aliases padded to [answer]`);
          }
        }
      });
    });
  }
  if (game.final && typeof game.final === "object") {
    if (!Array.isArray(game.final.aliases) || game.final.aliases.length === 0) {
      if (typeof game.final.answer === "string" && game.final.answer.trim()) {
        game.final.aliases = [game.final.answer];
        fixes.push(`final.aliases padded to [answer]`);
      }
    }
  }
  return { fixedGame: game, fixes };
}

function serializeReplacement(originalText, range, newGame) {
  const before = originalText.slice(0, range.start);
  const after = originalText.slice(range.end);
  // Stringify and then defensively escape any `};` that ends up inside the
  // JSON so downstream `};\s*const STORAGE_KEY` regex extractors don't trip.
  let json = JSON.stringify(newGame);
  // Only rewrite `};` substrings that appear inside string literals (i.e.
  // not the literal closing of the object itself). The closing of the GAME
  // object is at the very end, immediately followed by what we splice on:
  // ");". So we can safely replace `};` -> `} ;` everywhere except the last
  // closing brace.
  const last = json.length;
  // Walk the JSON to find spots where `};` is INSIDE a string and replace.
  const out = [];
  let inStr = false;
  let escape = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    const next = json[i + 1];
    if (inStr) {
      if (escape) { out.push(ch); escape = false; continue; }
      if (ch === "\\") { out.push(ch); escape = true; continue; }
      if (ch === '"') { out.push(ch); inStr = false; continue; }
      // Rewrite `};` inside string → `} ;`
      if (ch === "}" && next === ";") {
        out.push("} ");
        continue;
      }
      out.push(ch);
      continue;
    }
    if (ch === '"') { out.push(ch); inStr = true; continue; }
    out.push(ch);
  }
  return before + out.join("") + after;
}

// ---------------------------------------------------------------------------
// Walker
// ---------------------------------------------------------------------------

function listJeopardyFiles() {
  const out = [];
  for (const entry of readdirSync(GAMES)) {
    if (SKIP_DIRS.has(entry)) continue;
    const dir = join(GAMES, entry);
    let st;
    try { st = statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".html")) continue;
      if (f === "index.html") continue;
      if (f.startsWith("._")) continue;
      const full = join(dir, f);
      // Quick filter: must contain "const GAME = {"
      const head = readFileSync(full, "utf8");
      if (!head.includes("const GAME = {")) continue;
      out.push({ dirSlug: entry, file: f, path: full });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function main() {
  const files = listJeopardyFiles();
  console.log(`Auditing ${files.length} Jeopardy boards across ${new Set(files.map(f => f.dirSlug)).size} courses...\n`);

  const stats = {
    total: files.length,
    clean: 0,
    autoFixed: 0,
    withGibberish: 0,
    withParseError: 0,
    withShapeIssues: 0,
    withStaleHeader: 0
  };

  const perFile = [];
  const gibberishFiles = []; // {path, fields}
  const parseErrorFiles = [];

  for (const { dirSlug, file, path } of files) {
    const text = readFileSync(path, "utf8");
    const ext = extractGame(text, path);
    if (!ext.ok) {
      stats.withParseError++;
      parseErrorFiles.push({ path, error: ext.error, message: ext.message });
      perFile.push({ path, issues: [{ kind: "parse", detail: ext.error + (ext.message ? `: ${ext.message}` : "") }], fixed: false });
      continue;
    }
    const game = ext.game;
    const issues = checkGame(game, file, dirSlug);
    const staleHeader = checkStaleHeader(text, dirSlug);
    for (const h of staleHeader) issues.push(h);

    // Auto-fix safe items
    const { fixedGame, fixes } = autoFix(game);
    let wrote = false;
    if (fixes.length) {
      const newText = serializeReplacement(text, ext.range, fixedGame);
      if (newText !== text) {
        writeFileSync(path, newText, "utf8");
        wrote = true;
        stats.autoFixed++;
      }
    }
    // Re-evaluate issues after fix (aliases issues should disappear)
    const finalIssues = wrote ? checkGame(fixedGame, file, dirSlug).concat(staleHeader) : issues;

    const gibHits = finalIssues.filter(i => i.kind === "gibberish");
    const shape = finalIssues.filter(i => i.kind === "shape" || i.kind === "category" || i.kind === "clue" || i.kind === "final");
    const staleH = finalIssues.filter(i => i.kind === "stale_header");

    if (gibHits.length) {
      stats.withGibberish++;
      gibberishFiles.push({ path, hits: gibHits });
    }
    if (shape.length) stats.withShapeIssues++;
    if (staleH.length) stats.withStaleHeader++;

    if (!finalIssues.length) stats.clean++;
    perFile.push({ path, issues: finalIssues, fixed: wrote, fixes });
  }

  // Report per-file
  for (const r of perFile) {
    const rel = r.path.replace(root + "/", "");
    if (!r.issues.length && !r.fixed) {
      // skip clean files in console for brevity — count is in stats
      continue;
    }
    if (!r.issues.length && r.fixed) {
      console.log(`  fixed (${r.fixes.join(", ")})  ${rel}`);
      continue;
    }
    console.log(`  ${r.issues.length} issue(s)  ${rel}`);
    for (const i of r.issues.slice(0, 6)) {
      if (i.kind === "gibberish") {
        const snip = (i.text || "").slice(0, 100);
        console.log(`      gibberish "${i.phrase}" in ${i.field}: "${snip}…"`);
      } else if (i.kind === "stale_header") {
        console.log(`      stale_header: ${i.detail}`);
      } else if (i.kind === "parse") {
        console.log(`      parse: ${i.detail}`);
      } else {
        console.log(`      ${i.kind}: ${i.detail}`);
      }
    }
    if (r.issues.length > 6) console.log(`      ... ${r.issues.length - 6} more`);
    if (r.fixed) console.log(`      auto-fixed: ${r.fixes.join(", ")}`);
  }

  // Summary
  console.log("\n========== SUMMARY ==========");
  console.log(`  Total boards audited:        ${stats.total}`);
  console.log(`  Boards clean:                ${stats.clean}`);
  console.log(`  Boards auto-fixed:           ${stats.autoFixed}`);
  console.log(`  Boards with content gibberish: ${stats.withGibberish}`);
  console.log(`  Boards with shape issues:    ${stats.withShapeIssues}`);
  console.log(`  Boards with stale headers:   ${stats.withStaleHeader}`);
  console.log(`  Boards with parse errors:    ${stats.withParseError}`);

  if (gibberishFiles.length) {
    console.log("\n========== GIBBERISH FILES ==========");
    for (const g of gibberishFiles) {
      console.log(`  ${g.path.replace(root + "/", "")}`);
      for (const h of g.hits.slice(0, 3)) {
        console.log(`      ${h.field}: "${h.phrase}"`);
      }
      if (g.hits.length > 3) console.log(`      ... ${g.hits.length - 3} more hits`);
    }
  }
  if (parseErrorFiles.length) {
    console.log("\n========== PARSE ERRORS ==========");
    for (const p of parseErrorFiles) {
      console.log(`  ${p.path.replace(root + "/", "")}: ${p.error}`);
      if (p.message) console.log(`    ${p.message.slice(0, 200)}`);
    }
  }

  // Machine-readable output for caller
  process.exitCode = (stats.withGibberish + stats.withParseError + stats.withShapeIssues) > 0 ? 0 : 0;
  return { stats, gibberishFiles, parseErrorFiles };
}

main();
