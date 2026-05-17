#!/usr/bin/env node
// scripts/e2e-smoke-test.mjs
//
// End-to-end smoke test for every HTML surface in Mr. Mac's Review Arcade.
//
// Coverage:
//   - index.html (hub)
//   - every file referenced from games.json (~702 entries)
//
// Per-file checks:
//   1. Doctype declaration present
//   2. <title> non-empty
//   3. <body> tag present
//   4. >= 1 <script> block
//   5. Service worker registration referenced somewhere reachable (hub OR
//      the file itself — many course pages defer SW reg to the hub).
//   6. Inline <script> blocks syntax-check via vm.compileFunction (catches
//      malformed tags, unclosed strings, syntax errors).
//   7. Required arcade chrome (Jeopardy boards + practice exams):
//      arenaBg / scanline overlay / CRT marquee.
//   8. Asset src/href/url() references resolve on disk.
//   9. Practice exams (per-course practice-exam.html): QUESTIONS,
//      STORAGE_KEY, correctIdx normalization line, render handlers.
//  10. Jeopardy boards (any HTML with `const GAME = `): GAME parses,
//      5 categories x 5 clues, has final.
//
// Auto-fix (safe-only):
//   - Trailing comma in object literal inside inline JS (`,}` or `,\n}`)
//   - Missing correctIdx normalization line in per-course practice exam
//     (inserts after the `];` closing the QUESTIONS array).
//
// Anything else is logged for human review.
//
// Outputs:
//   - data/E2E_SMOKE_REPORT.json
//   - SMOKE_TEST_FAILURES.md at repo root (if any unfixable failures)
//
// Run:   node scripts/e2e-smoke-test.mjs
// Audit-only (no writes): node scripts/e2e-smoke-test.mjs --check

import {
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const GAMES_JSON = resolve(ROOT, "games.json");
const HUB = resolve(ROOT, "index.html");
const REPORT_OUT = resolve(ROOT, "data/E2E_SMOKE_REPORT.json");
const FAILURES_MD = resolve(ROOT, "SMOKE_TEST_FAILURES.md");

const WRITE = !process.argv.includes("--check");

// ---------------------------------------------------------------------- //
// utility: normalize relative refs                                        //
// ---------------------------------------------------------------------- //

function normalizePath(raw) {
  if (!raw || typeof raw !== "string") return null;
  let p = raw.split("?")[0].split("#")[0].trim();
  if (!p) return null;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* leave as-is */
  }
  return p;
}

function isExternalUrl(p) {
  if (!p) return true;
  return (
    p.startsWith("http://") ||
    p.startsWith("https://") ||
    p.startsWith("//") ||
    p.startsWith("data:") ||
    p.startsWith("mailto:") ||
    p.startsWith("tel:") ||
    p.startsWith("blob:") ||
    p.startsWith("javascript:")
  );
}

function isFragment(p) {
  return !p || p.startsWith("#");
}

// ---------------------------------------------------------------------- //
// HTML inspection helpers (regex-based; we don't need a real DOM)        //
// ---------------------------------------------------------------------- //

function hasDoctype(html) {
  return /^\s*<!doctype\s+html/i.test(html);
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const t = m[1].replace(/\s+/g, " ").trim();
  return t || null;
}

function hasBody(html) {
  return /<body[\s>]/i.test(html);
}

// Walk every <script> tag, capturing both inline blocks and src refs.
// We intentionally use a small state machine to avoid getting confused by
// `</script>` strings inside another script's content.
function extractScripts(html) {
  const scripts = []; // { inline: string|null, src: string|null, lineStart, lineEnd }
  const len = html.length;
  let i = 0;
  let line = 1;
  while (i < len) {
    // advance scanning for next <script (case-insensitive)
    const next = html.indexOf("<script", i);
    if (next === -1) break;
    // bump line counter for skipped chars
    for (let k = i; k < next; k++) if (html.charCodeAt(k) === 10) line++;
    // find end of opening tag
    const tagEnd = html.indexOf(">", next);
    if (tagEnd === -1) break;
    const openTag = html.slice(next, tagEnd + 1);
    // case-insensitive src attribute extraction
    const srcMatch = openTag.match(/\ssrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const src = srcMatch ? srcMatch[2] || srcMatch[3] || srcMatch[4] : null;
    const startLine = line;
    // bump line counter through opening tag
    for (let k = next; k <= tagEnd; k++) if (html.charCodeAt(k) === 10) line++;
    // find closing </script
    const closeIdx = html.toLowerCase().indexOf("</script", tagEnd + 1);
    if (closeIdx === -1) {
      // unterminated — log as a script with no inline, no src
      scripts.push({
        inline: null,
        src,
        lineStart: startLine,
        lineEnd: line,
        unterminated: true,
      });
      break;
    }
    const inline = src ? null : html.slice(tagEnd + 1, closeIdx);
    // bump line counter for inline content
    for (let k = tagEnd + 1; k < closeIdx; k++) {
      if (html.charCodeAt(k) === 10) line++;
    }
    // skip past closing tag
    const closeEnd = html.indexOf(">", closeIdx);
    if (closeEnd === -1) {
      scripts.push({
        inline,
        src,
        lineStart: startLine,
        lineEnd: line,
        unterminated: true,
      });
      break;
    }
    for (let k = closeIdx; k <= closeEnd; k++) if (html.charCodeAt(k) === 10) line++;
    scripts.push({ inline, src, lineStart: startLine, lineEnd: line, unterminated: false });
    i = closeEnd + 1;
  }
  return scripts;
}

// Extract candidate asset references from HTML.
// Categories: src, href, url(...). We keep ones that look like local paths.
//
// IMPORTANT: We strip <script> contents before scanning so that template-
// literal expressions like `'<img src="' + escapeHtml(thumb) + '">'` inside
// inline JS don't get mis-parsed as asset refs.
function extractAssetRefs(html) {
  const stripped = stripScriptContents(html);
  const refs = [];
  // src="..." (covers <script>, <img>, <iframe>, etc.)
  for (const m of stripped.matchAll(/\bsrc\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    refs.push({ raw: m[2] ?? m[3], kind: "src" });
  }
  // href="..." (covers <a>, <link>)
  for (const m of stripped.matchAll(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    refs.push({ raw: m[2] ?? m[3], kind: "href" });
  }
  // CSS url(...) inside <style> blocks AND inline style attributes
  for (const m of stripped.matchAll(/url\(\s*("([^"]*)"|'([^']*)'|([^)]+))\s*\)/gi)) {
    refs.push({ raw: (m[2] ?? m[3] ?? m[4] ?? "").trim(), kind: "css-url" });
  }
  return refs;
}

// Return HTML with every <script>...</script> body replaced by an equivalent
// number of newlines (preserves line counts). The opening tag itself is
// preserved so its src attribute is still seen by extractAssetRefs.
function stripScriptContents(html) {
  const len = html.length;
  let out = "";
  let i = 0;
  while (i < len) {
    const next = html.indexOf("<script", i);
    if (next === -1) {
      out += html.slice(i);
      break;
    }
    out += html.slice(i, next);
    const tagEnd = html.indexOf(">", next);
    if (tagEnd === -1) {
      out += html.slice(next);
      break;
    }
    out += html.slice(next, tagEnd + 1);
    const closeIdx = html.toLowerCase().indexOf("</script", tagEnd + 1);
    if (closeIdx === -1) break;
    // replace inline content with newlines to preserve line numbering
    const inline = html.slice(tagEnd + 1, closeIdx);
    out += inline.replace(/[^\n]/g, " ");
    const closeEnd = html.indexOf(">", closeIdx);
    if (closeEnd === -1) {
      out += html.slice(closeIdx);
      break;
    }
    out += html.slice(closeIdx, closeEnd + 1);
    i = closeEnd + 1;
  }
  return out;
}

// ---------------------------------------------------------------------- //
// Inline JS syntax check                                                  //
// ---------------------------------------------------------------------- //

function checkInlineJsSyntax(code) {
  // Skip module-mode / JSON-LD / type=importmap blocks (caller should
  // strip them before calling). The function returns null if syntax is
  // valid, or { message } if invalid.
  const trimmed = code.trim();
  if (!trimmed) return null;
  try {
    // vm.compileFunction parses (doesn't execute) the code as a function
    // body, which is permissive enough for typical inline scripts that
    // declare const/let/function at module-script scope.
    vm.compileFunction(code, [], { filename: "inline.js" });
    return null;
  } catch (e) {
    return { message: e.message };
  }
}

// Detect script tags we should skip syntax-checking on.
// JSON-LD, importmap, application/json blobs aren't JS.
function shouldSkipSyntaxCheck(openTagSlice, inline) {
  if (/type\s*=\s*["']application\/(ld\+)?json["']/i.test(openTagSlice)) return true;
  if (/type\s*=\s*["']importmap["']/i.test(openTagSlice)) return true;
  if (/type\s*=\s*["']text\/template["']/i.test(openTagSlice)) return true;
  if (/type\s*=\s*["']application\/xml["']/i.test(openTagSlice)) return true;
  if (!inline || !inline.trim()) return true;
  return false;
}

// We need the original opening tag string to decide whether to skip. Re-walk.
function extractScriptsWithOpenTag(html) {
  const scripts = [];
  const len = html.length;
  let i = 0;
  while (i < len) {
    const next = html.indexOf("<script", i);
    if (next === -1) break;
    const tagEnd = html.indexOf(">", next);
    if (tagEnd === -1) break;
    const openTag = html.slice(next, tagEnd + 1);
    const srcMatch = openTag.match(/\ssrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const src = srcMatch ? srcMatch[2] || srcMatch[3] || srcMatch[4] : null;
    const closeIdx = html.toLowerCase().indexOf("</script", tagEnd + 1);
    if (closeIdx === -1) {
      scripts.push({ openTag, inline: null, src, byteStart: next, byteEnd: len });
      break;
    }
    const inline = src ? null : html.slice(tagEnd + 1, closeIdx);
    const closeEnd = html.indexOf(">", closeIdx);
    scripts.push({
      openTag,
      inline,
      src,
      byteStart: next,
      byteEnd: closeEnd === -1 ? len : closeEnd + 1,
      inlineStart: tagEnd + 1,
      inlineEnd: closeIdx,
    });
    if (closeEnd === -1) break;
    i = closeEnd + 1;
  }
  return scripts;
}

// ---------------------------------------------------------------------- //
// Auto-fix helpers                                                        //
// ---------------------------------------------------------------------- //

// Attempt to repair trailing-comma syntax errors of the form `, )` or `, }`
// or `, ]` inside inline JS. Returns { fixed: boolean, code: string }.
function tryAutoFixInlineJs(code) {
  if (typeof code !== "string") return { fixed: false, code };
  const before = code;
  // Conservative: only strip trailing commas immediately before `}`, `]`,
  // or `)`, optionally with whitespace/newlines between.
  const after = code.replace(/,(\s*[}\])])/g, "$1");
  if (after === before) return { fixed: false, code };
  // Re-check syntax to confirm the fix actually parses now.
  const recheck = checkInlineJsSyntax(after);
  if (recheck) {
    // didn't help; bail
    return { fixed: false, code };
  }
  return { fixed: true, code: after };
}

const NORMALIZE_LINE =
  "QUESTIONS.forEach((q) => { q.correctIdx = q.choices.indexOf(q.correctText); });";

function tryInsertNormalizeLine(html) {
  // Already present? Nothing to do.
  if (html.includes("QUESTIONS.forEach((q) => { q.correctIdx")) {
    return { fixed: false, html, reason: "already-present" };
  }
  // Look for the closing `];` after `const QUESTIONS = [`.
  const startIdx = html.indexOf("const QUESTIONS = [");
  if (startIdx === -1) return { fixed: false, html, reason: "no-questions-array" };
  // Walk forward respecting strings to find the matching closing `];`.
  let i = html.indexOf("[", startIdx);
  if (i === -1) return { fixed: false, html, reason: "no-array-open" };
  let depth = 0;
  let inStr = null;
  let escape = false;
  let closeAt = -1;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === inStr) { inStr = null; continue; }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) { closeAt = i; break; }
    }
  }
  if (closeAt === -1) return { fixed: false, html, reason: "no-array-close" };
  // expect `;` after the `]`
  let semiAt = closeAt + 1;
  while (semiAt < html.length && /\s/.test(html[semiAt])) semiAt++;
  if (html[semiAt] !== ";") return { fixed: false, html, reason: "no-semicolon" };
  const insertAt = semiAt + 1;
  const insertion = `\n${NORMALIZE_LINE}\n`;
  const fixedHtml = html.slice(0, insertAt) + insertion + html.slice(insertAt);
  return { fixed: true, html: fixedHtml, reason: "inserted" };
}

// ---------------------------------------------------------------------- //
// Practice exam structural checks                                         //
// ---------------------------------------------------------------------- //

const PRACTICE_HANDLER_PATTERNS = [
  /function\s+renderQuestion\b/,
  /function\s+renderResults\b/,
  /function\s+renderIntro\b/,
  /function\s+startExam\b/,
  /function\s+submitAnswer\b/,
  /function\s+nextQuestion\b/,
  /function\s+finishExam\b/,
  /function\s+gradeExam\b/,
  /function\s+grade\b/,
  /function\s+showResults\b/,
];

function checkPracticeExamStructure(html) {
  const issues = [];
  if (!html.includes("const QUESTIONS = [")) {
    issues.push("missing-QUESTIONS-array");
  }
  if (!html.includes("const STORAGE_KEY")) {
    issues.push("missing-STORAGE_KEY");
  }
  if (!html.includes("QUESTIONS.forEach((q) => { q.correctIdx = q.choices.indexOf(q.correctText); });")) {
    issues.push("missing-correctIdx-normalization");
  }
  // Need at least one handler pattern present.
  const hits = PRACTICE_HANDLER_PATTERNS.filter((re) => re.test(html));
  if (hits.length < 2) {
    issues.push(`missing-handlers (only ${hits.length} matched)`);
  }
  return issues;
}

// ---------------------------------------------------------------------- //
// Jeopardy GAME block check                                               //
// ---------------------------------------------------------------------- //

function extractGameJson(text) {
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
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function checkJeopardyStructure(html) {
  const issues = [];
  const json = extractGameJson(html);
  if (!json) {
    issues.push("game-block-not-extractable");
    return issues;
  }
  let game;
  try {
    game = JSON.parse(json);
  } catch (e) {
    issues.push(`game-json-parse-error: ${e.message}`);
    return issues;
  }
  if (!Array.isArray(game.categories)) {
    issues.push("categories-not-array");
  } else if (game.categories.length !== 5) {
    issues.push(`categories-count-${game.categories.length} (expected 5)`);
  } else {
    for (let ci = 0; ci < game.categories.length; ci++) {
      const cat = game.categories[ci];
      if (!cat || !Array.isArray(cat.clues)) {
        issues.push(`category[${ci}]-no-clues`);
        continue;
      }
      if (cat.clues.length !== 5) {
        issues.push(`category[${ci}]-clue-count-${cat.clues.length} (expected 5)`);
      }
    }
  }
  if (!game.final || typeof game.final !== "object") {
    issues.push("missing-final-jeopardy");
  }
  return issues;
}

// ---------------------------------------------------------------------- //
// Arcade chrome check                                                     //
// ---------------------------------------------------------------------- //

function hasArcadeChrome(html) {
  // Heuristics — Jeopardy boards + practice exams share an arena/CRT skin.
  const arena = /arenaBg|class="arena"|id="arena"|--arena:|class="board-arena"|class="jeopardy-arena"/i.test(
    html,
  );
  const scanline = /scanline|class="scanlines"|crt-scan|crt-overlay|class="crt"/i.test(html);
  const marquee = /marquee|class="cabinet"|cabinet-fx|retro-theme/i.test(html);
  // Accept presence of any TWO of the three signals as "arcade chrome".
  const hits = [arena, scanline, marquee].filter(Boolean).length;
  return { ok: hits >= 2, hits, signals: { arena, scanline, marquee } };
}

// ---------------------------------------------------------------------- //
// Asset resolution                                                        //
// ---------------------------------------------------------------------- //

function resolveAsset(refRaw, fileAbsPath) {
  if (!refRaw) return { skip: true };
  const ref = normalizePath(refRaw);
  if (!ref) return { skip: true };
  if (isFragment(ref)) return { skip: true };
  if (isExternalUrl(ref)) return { skip: true };
  // Skip pseudo-data refs already filtered, but also skip /API/ refs
  if (ref.startsWith("/api/") || ref.startsWith("api/")) return { skip: true };
  // Absolute root-relative path = relative to ROOT
  let target;
  if (ref.startsWith("/")) {
    target = resolve(ROOT, "." + ref);
  } else {
    target = resolve(dirname(fileAbsPath), ref);
  }
  // Tolerate trailing slashes by checking for /index.html
  if (existsSync(target)) {
    try {
      if (statSync(target).isDirectory()) {
        const idx = resolve(target, "index.html");
        return { skip: false, target: idx, exists: existsSync(idx) };
      }
    } catch {}
    return { skip: false, target, exists: true };
  }
  return { skip: false, target, exists: false };
}

// ---------------------------------------------------------------------- //
// SW reference check                                                      //
// ---------------------------------------------------------------------- //

function hasSwReference(html) {
  return /navigator\.serviceWorker/i.test(html) || /serviceWorker\.register/i.test(html);
}

// ---------------------------------------------------------------------- //
// Per-file smoke runner                                                   //
// ---------------------------------------------------------------------- //

function smokeOne(relPath, opts = {}) {
  const abs = resolve(ROOT, relPath);
  const findings = {
    file: relPath,
    status: "ok",
    issues: [],
    warnings: [],
    autoFixed: [],
    checks: {
      doctype: false,
      title: false,
      body: false,
      scriptCount: 0,
      swRef: false,
      arcadeChromeRequired: false,
      arcadeChromeOk: null,
      jsSyntax: { checked: 0, errors: 0 },
      assets: { checked: 0, missing: 0 },
      practiceExam: null,
      jeopardy: null,
    },
  };
  if (!existsSync(abs)) {
    findings.status = "fail";
    findings.issues.push({ kind: "file-not-found" });
    return findings;
  }
  let html;
  try {
    html = readFileSync(abs, "utf8");
  } catch (e) {
    findings.status = "fail";
    findings.issues.push({ kind: "read-error", message: e.message });
    return findings;
  }
  let mutated = false;

  // 1. Doctype
  findings.checks.doctype = hasDoctype(html);
  if (!findings.checks.doctype) {
    findings.issues.push({ kind: "missing-doctype" });
  }

  // 2. Title
  const title = extractTitle(html);
  findings.checks.title = !!title;
  if (!title) {
    findings.issues.push({ kind: "missing-title" });
  }

  // 3. Body
  findings.checks.body = hasBody(html);
  if (!findings.checks.body) {
    findings.issues.push({ kind: "missing-body" });
  }

  // 4. Scripts
  const scripts = extractScriptsWithOpenTag(html);
  findings.checks.scriptCount = scripts.length;
  if (scripts.length === 0) {
    findings.issues.push({ kind: "no-script-blocks" });
  }

  // 5. SW reference (best-effort; per-game files usually defer to hub).
  // For the hub itself we strictly require SW reg; for others we just record.
  findings.checks.swRef = hasSwReference(html);
  if (opts.requireSwReg && !findings.checks.swRef) {
    findings.issues.push({ kind: "missing-service-worker-registration" });
  }

  // 6. Inline JS syntax check + auto-fix attempt
  for (let s = 0; s < scripts.length; s++) {
    const sc = scripts[s];
    if (sc.src) continue;
    if (shouldSkipSyntaxCheck(sc.openTag, sc.inline)) continue;
    findings.checks.jsSyntax.checked++;
    const verdict = checkInlineJsSyntax(sc.inline);
    if (verdict) {
      // try auto-fix
      const repaired = tryAutoFixInlineJs(sc.inline);
      if (repaired.fixed && WRITE) {
        // splice in-place
        html =
          html.slice(0, sc.inlineStart) + repaired.code + html.slice(sc.inlineEnd);
        mutated = true;
        findings.autoFixed.push({
          kind: "trailing-comma-fix",
          scriptIdx: s,
          original: verdict.message,
        });
        // Re-extract scripts since byte offsets shift after splice.
        // Easiest correctness-preserving approach: rebreak loop and restart
        // syntax pass after the splice. We mark mutated and continue;
        // findings already accounted for. Subsequent indices may be off but
        // since we only splice INSIDE inline content the byte offset shift
        // affects only subsequent script block offsets. We'll re-run from
        // the next script with fresh extraction.
        const newScripts = extractScriptsWithOpenTag(html);
        // Replace tail of array
        scripts.splice(s + 1, scripts.length - s - 1, ...newScripts.slice(s + 1));
        continue;
      }
      findings.checks.jsSyntax.errors++;
      findings.issues.push({
        kind: "inline-js-syntax-error",
        scriptIdx: s,
        openTag: sc.openTag.slice(0, 120),
        message: verdict.message,
      });
    }
  }

  // 7. Asset resolution
  const refs = extractAssetRefs(html);
  for (const ref of refs) {
    const r = resolveAsset(ref.raw, abs);
    if (r.skip) continue;
    findings.checks.assets.checked++;
    if (!r.exists) {
      findings.checks.assets.missing++;
      // Asset misses are warnings, not hard failures (logged per spec).
      findings.warnings.push({
        kind: "missing-asset",
        refKind: ref.kind,
        raw: ref.raw,
        resolved: relative(ROOT, r.target),
      });
    }
  }

  // 8. Arcade chrome — required for Jeopardy boards + per-course practice
  // exams. We detect those by content: presence of `const GAME = ` or
  // `const QUESTIONS = [` AND filename `practice-exam.html`.
  const isJeopardyByContent = html.includes("const GAME = ");
  const isPracticeExamByPath =
    relPath.endsWith("/practice-exam.html") && html.includes("const QUESTIONS = [");
  if (isJeopardyByContent || isPracticeExamByPath) {
    findings.checks.arcadeChromeRequired = true;
    const chrome = hasArcadeChrome(html);
    findings.checks.arcadeChromeOk = chrome.ok;
    if (!chrome.ok) {
      findings.warnings.push({
        kind: "missing-arcade-chrome",
        signals: chrome.signals,
      });
    }
  }

  // 9. Practice exam structural check
  if (isPracticeExamByPath) {
    const issues = checkPracticeExamStructure(html);
    findings.checks.practiceExam = { issues };
    for (const issue of issues) {
      if (issue === "missing-correctIdx-normalization") {
        // Auto-fix attempt
        const result = tryInsertNormalizeLine(html);
        if (result.fixed && WRITE) {
          html = result.html;
          mutated = true;
          findings.autoFixed.push({ kind: "inserted-correctIdx-normalization" });
          continue;
        }
        findings.issues.push({
          kind: "practice-exam-issue",
          detail: issue,
          autoFixReason: result.reason,
        });
      } else {
        findings.issues.push({ kind: "practice-exam-issue", detail: issue });
      }
    }
  }

  // 10. Jeopardy structural check
  if (isJeopardyByContent) {
    const issues = checkJeopardyStructure(html);
    findings.checks.jeopardy = { issues };
    for (const issue of issues) {
      findings.issues.push({ kind: "jeopardy-issue", detail: issue });
    }
  }

  // Write back if mutated
  if (mutated && WRITE) {
    writeFileSync(abs, html, "utf8");
  }

  if (findings.issues.length > 0) findings.status = "fail";
  return findings;
}

// ---------------------------------------------------------------------- //
// Service worker version bump                                             //
// ---------------------------------------------------------------------- //

function bumpServiceWorker() {
  const swPath = resolve(ROOT, "service-worker.js");
  if (!existsSync(swPath)) return { bumped: false, reason: "sw-not-found" };
  const src = readFileSync(swPath, "utf8");
  // CACHE_NAME = "v79-..."
  const m = src.match(/CACHE_NAME\s*=\s*"v(\d+)([^"]*)"/);
  if (!m) return { bumped: false, reason: "no-cache-name-match" };
  const cur = parseInt(m[1], 10);
  const next = cur + 1;
  // Preserve the descriptive suffix if present, but rewrite to reflect this pass.
  const suffix = "-e2e-smoke";
  const newName = `v${next}${suffix}`;
  const after = src.replace(/CACHE_NAME\s*=\s*"v\d+[^"]*"/, `CACHE_NAME = "${newName}"`);
  if (WRITE) writeFileSync(swPath, after, "utf8");
  return { bumped: true, from: cur, to: next, name: newName };
}

// ---------------------------------------------------------------------- //
// Main                                                                    //
// ---------------------------------------------------------------------- //

async function main() {
  const games = JSON.parse(readFileSync(GAMES_JSON, "utf8"));
  // De-dupe + normalize file paths.
  const surfaces = new Map(); // relPath -> { sources: [] }
  // 1. Hub
  surfaces.set("index.html", { source: "hub", requireSwReg: true });
  // 2. Every games.json entry
  for (const g of games) {
    const rel = normalizePath(g.file);
    if (!rel) continue;
    if (!surfaces.has(rel)) {
      surfaces.set(rel, { source: "games.json", id: g.id, gameType: g.gameType });
    }
  }

  console.log(`E2E smoke test: ${surfaces.size} surfaces`);
  const results = [];
  let pass = 0;
  let fail = 0;
  let autoFixed = 0;
  const errorsByKind = new Map();

  for (const [rel, meta] of surfaces) {
    const finding = smokeOne(rel, {
      requireSwReg: meta.requireSwReg === true,
    });
    finding.source = meta.source;
    if (meta.id) finding.id = meta.id;
    if (meta.gameType) finding.gameType = meta.gameType;
    if (finding.autoFixed.length > 0) autoFixed += finding.autoFixed.length;
    if (finding.status === "ok") {
      pass++;
    } else {
      fail++;
      for (const issue of finding.issues) {
        const key = issue.kind;
        errorsByKind.set(key, (errorsByKind.get(key) ?? 0) + 1);
      }
    }
    results.push(finding);
  }

  // Bump SW if any auto-fix happened (or any pass at all, per spec).
  const sw = bumpServiceWorker();

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      surfaces: surfaces.size,
      pass,
      fail,
      autoFixed,
      writeMode: WRITE,
    },
    errorsByKind: Object.fromEntries(
      [...errorsByKind.entries()].sort((a, b) => b[1] - a[1]),
    ),
    serviceWorker: sw,
    entries: results,
  };

  if (WRITE) {
    writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2));
  }

  // Console summary
  console.log("\n=== E2E SMOKE TEST RESULT ===");
  console.log(`Surfaces tested : ${surfaces.size}`);
  console.log(`Pass            : ${pass}`);
  console.log(`Fail            : ${fail}`);
  console.log(`Auto-fixes      : ${autoFixed}`);
  console.log(`Service worker  : ${sw.bumped ? `v${sw.from} -> v${sw.to} (${sw.name})` : `(unchanged: ${sw.reason})`}`);
  if (errorsByKind.size > 0) {
    console.log("\nError categories:");
    for (const [k, v] of [...errorsByKind.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${v.toString().padStart(5)}  ${k}`);
    }
  }

  // Emit failures markdown if any
  if (WRITE) {
    const unfixed = results.filter((r) => r.status === "fail");
    if (unfixed.length > 0) {
      const md = renderFailuresMd(unfixed);
      writeFileSync(FAILURES_MD, md, "utf8");
      console.log(`\nWrote ${unfixed.length} unfixable failures to SMOKE_TEST_FAILURES.md`);
    }
  }

  return fail === 0 ? 0 : 1;
}

function renderFailuresMd(unfixed) {
  const lines = [];
  lines.push("# E2E Smoke Test Failures");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total failures: ${unfixed.length}`);
  lines.push("");
  // Group by kind
  const byKind = new Map();
  for (const f of unfixed) {
    for (const issue of f.issues) {
      const arr = byKind.get(issue.kind) ?? [];
      arr.push({ file: f.file, issue });
      byKind.set(issue.kind, arr);
    }
  }
  for (const [kind, items] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`## ${kind} (${items.length})`);
    lines.push("");
    for (const it of items.slice(0, 50)) {
      const detail = it.issue.detail || it.issue.message || it.issue.refKind || "";
      lines.push(`- \`${it.file}\` — ${detail}`);
    }
    if (items.length > 50) {
      lines.push(`- ...and ${items.length - 50} more`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

const code = await main();
process.exit(code);
