#!/usr/bin/env node
// scripts/audit-hub-links.mjs
//
// Audit every entry in games.json:
//   1. file exists on disk (URL-decoded, query-stripped)
//   2. for HTML: substantive (>1KB), <title>, game-body marker present
//   3. for Jeopardy: const GAME = { ... } block parses via brace walker
//   4. for Practice Exam: const QUESTIONS = [ ... ] has >=25 4-choice items
//   5. thumbnail / cardArt asset files exist
//   6. arcade games: file exists + has a <script> tag
//   7. course field non-empty + (best-effort) matches H1
//
// Auto-fix:
//   - missing thumbnail/cardArt -> canonical fallback per gameType
//   - broken file link        -> remove entry (orphan)
//   - course mismatches       -> NOT auto-fixed (require human review)
//
// Outputs:
//   - data/HUB_AUDIT.json
//   - console summary

import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GAMES_PATH = resolve(ROOT, "games.json");
const AUDIT_OUT = resolve(ROOT, "data/HUB_AUDIT.json");

// ---------- canonical fallback thumbnails per gameType ---------- //
const FALLBACK_JEOPARDY = "assets/cabinet/category-tile-jeopardy.webp";
const FALLBACK_PRACTICE = "assets/cabinet/category-tile-practice.webp";
const FALLBACK_ARCADE = "assets/cabinet/category-tile-arcade.webp";

const JEOPARDY_TYPES = new Set([
  "Jeopardy",
  "Unit Review",
  "Unit + Cumulative",
  "Unit + Final",
  "Unit + AP Final",
  "Regents Sprint", // Regents Sprint days are Jeopardy boards, not MC exams
]);
const PRACTICE_TYPES = new Set([
  "Practice Exam",
  "Full Practice Exam",
  "Regents Gauntlet",
  "Regents Quick Play",
]);

function pickFallback(entry) {
  const t = entry.gameType || "";
  if (JEOPARDY_TYPES.has(t)) return FALLBACK_JEOPARDY;
  if (PRACTICE_TYPES.has(t)) return FALLBACK_PRACTICE;
  return FALLBACK_ARCADE;
}

// ---------- url-decode + strip query / hash ---------- //
function normalizeRelPath(raw) {
  if (!raw || typeof raw !== "string") return null;
  let p = raw.split("?")[0].split("#")[0];
  try {
    p = decodeURIComponent(p);
  } catch {
    /* leave as-is if it's already raw */
  }
  return p;
}

function existsOnDisk(rel) {
  if (!rel) return false;
  const full = resolve(ROOT, rel);
  return existsSync(full);
}

function fileSize(rel) {
  try {
    return statSync(resolve(ROOT, rel)).size;
  } catch {
    return -1;
  }
}

function readFile(rel) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

// ---------- brace walker for `const GAME = { ... };` ---------- //
function findBalancedBlock(source, opener, closer) {
  // returns {start, end} of the OUTER block (inclusive), or null
  // ignores opener/closer inside strings + line/block comments
  const len = source.length;
  for (let i = 0; i < len; i++) {
    if (source[i] !== opener) continue;
    let depth = 0;
    let inStr = null; // '"', "'", '`'
    let inLineComment = false;
    let inBlockComment = false;
    for (let j = i; j < len; j++) {
      const c = source[j];
      const next = source[j + 1];
      if (inLineComment) {
        if (c === "\n") inLineComment = false;
        continue;
      }
      if (inBlockComment) {
        if (c === "*" && next === "/") {
          inBlockComment = false;
          j++;
        }
        continue;
      }
      if (inStr) {
        if (c === "\\") {
          j++;
          continue;
        }
        if (c === inStr) inStr = null;
        // template-literal expression boundaries are not strictly tracked here, but
        // `;` inside `${...}` is rare in our hand-authored GAME blocks
        continue;
      }
      if (c === "/" && next === "/") {
        inLineComment = true;
        j++;
        continue;
      }
      if (c === "/" && next === "*") {
        inBlockComment = true;
        j++;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        inStr = c;
        continue;
      }
      if (c === opener) depth++;
      else if (c === closer) {
        depth--;
        if (depth === 0) return { start: i, end: j };
      }
    }
    // unbalanced from this opener — try the next one
  }
  return null;
}

function findConstBlock(source, name, openChar, closeChar) {
  // Look for `const NAME =` then walk braces/brackets
  const re = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*`, "g");
  let m;
  while ((m = re.exec(source)) !== null) {
    const afterEq = m.index + m[0].length;
    // skip whitespace
    let k = afterEq;
    while (k < source.length && /\s/.test(source[k])) k++;
    if (source[k] !== openChar) continue;
    const block = findBalancedBlock(source.slice(k), openChar, closeChar);
    if (block) {
      return {
        start: k + block.start,
        end: k + block.end,
        body: source.slice(k + block.start, k + block.end + 1),
      };
    }
  }
  return null;
}

// ---------- per-type validators ---------- //
function validateJeopardyFile(rel) {
  const issues = [];
  const src = readFile(rel);
  // GAME block via brace walker (regex would trip on `};` inside strings)
  const block = findConstBlock(src, "GAME", "{", "}");
  if (!block) {
    // Some Jeopardy boards use `window.GAME =` or `var GAME =` patterns we don't cover,
    // but the audit asks for `const GAME = {...}` shape; flag absence.
    issues.push("no parseable `const GAME = { ... }` block");
    return issues;
  }
  // sanity: body should mention `categories` or `clues`
  if (!/categories|clues/i.test(block.body)) {
    issues.push("GAME block missing categories/clues keys");
  }
  return issues;
}

function validatePracticeExamFile(rel) {
  const issues = [];
  const src = readFile(rel);

  // Externalized bank: pulls questions from a sibling .js or from shared banks.
  // If we see any of the canonical loaders, treat as valid and skip inline checks.
  const externalLoaders = [
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*game\.js/i,
    /shared-question-bank\.js/i,
    /source-bank\.js/i,
    /chrono-defense-bank\.json/i,
    /regents-gauntlet-bank\.json/i,
    /regents-released-practice-exams\.json/i,
    /window\.SHARED_QUESTION_BANK|globalThis\.SHARED_QUESTION_BANK/i,
    /window\.QUESTION_BANK|globalThis\.QUESTION_BANK/i,
    /INLINE_BANK|DIAG_BANK_BY_COURSE/i,
  ];
  if (externalLoaders.some((re) => re.test(src))) {
    return issues; // externally sourced bank — out of scope for this check
  }

  const block = findConstBlock(src, "QUESTIONS", "[", "]");
  if (!block) {
    issues.push("no parseable `const QUESTIONS = [ ... ]` block");
    return issues;
  }
  const arr = block.body;
  // Items may use `question:`, `prompt:`, or `stem:` as their text field
  const itemKeys = (arr.match(/(?:^|[\s,{])(?:question|prompt|stem)\s*:/g) || []).length;
  // Fall back to counting top-level `{` opens at depth 1 inside the array
  let topLevelObjects = 0;
  {
    let depth = 0;
    let inStr = null;
    for (let i = 1; i < arr.length - 1; i++) {
      const c = arr[i];
      if (inStr) {
        if (c === "\\") { i++; continue; }
        if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === "{") { if (depth === 0) topLevelObjects++; depth++; }
      else if (c === "}") depth--;
    }
  }
  const itemCount = Math.max(itemKeys, topLevelObjects);
  if (itemCount < 25) {
    issues.push(`QUESTIONS array has ${itemCount} items (expected >= 25)`);
  }
  // shape: at least one choices/options array per item
  const choiceMarkers = (arr.match(/choices\s*:\s*\[/g) || []).length +
                        (arr.match(/options\s*:\s*\[/g) || []).length +
                        (arr.match(/answers\s*:\s*\[/g) || []).length;
  if (itemCount && choiceMarkers < Math.min(itemCount, 25)) {
    issues.push(
      `only ${choiceMarkers} of ${itemCount} items appear to have choices/options arrays`
    );
  }
  return issues;
}

function validateArcadeHtmlFile(rel) {
  const issues = [];
  const src = readFile(rel);
  if (!/<script\b/i.test(src)) issues.push("no <script> tag found");
  return issues;
}

function validateHtmlGeneral(rel) {
  const issues = [];
  const sz = fileSize(rel);
  if (sz < 1024) issues.push(`file is ${sz} bytes (expected >1KB)`);
  const src = readFile(rel);
  if (!/<title\b[^>]*>[\s\S]*?<\/title>/i.test(src)) {
    issues.push("no <title> tag");
  }
  return issues;
}

// ---------- h1 cross-check for course consistency ---------- //
function extractH1(rel) {
  try {
    const src = readFile(rel);
    const m = src.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (!m) return null;
    return m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  } catch {
    return null;
  }
}

function courseMismatch(entry, rel) {
  // Best-effort heuristic. Returns a string describing the mismatch, or null
  // if no concern detected. Designed to FALSE-POSITIVE as little as possible —
  // anything we flag should be worth a human eyeballing.
  if (!entry.course || !String(entry.course).trim()) return null;
  if (entry.course === "All Courses") return null;
  // Multi-course entries (dashboards/source labs) legitimately don't repeat
  // every course in their H1.
  if (/[+/]/.test(entry.course)) return null;
  if (!rel.toLowerCase().endsWith(".html")) return null;

  let src;
  try {
    src = readFile(rel);
  } catch {
    return null;
  }

  // Rescue: URL path contains any distinctive course token.
  // We compare against the path WITH separators-as-spaces so "global-9" matches "global 9".
  const pathNormalized = rel.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const courseTokens = entry.course
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  // distinctive = not stop-words. "global", "apush", "regents", "precalculus" all qualify.
  const stopForPath = new Set([
    "the", "and", "for",
    "grade", "course", "review", "history", "studies",
    "exam", "practice", "unit", "topic",
    "i", "ii", "iii", "iv",
  ]);
  const distinctivePathTokens = courseTokens.filter(
    (w) => w.length >= 3 && !stopForPath.has(w)
  );
  if (distinctivePathTokens.length > 0) {
    // any distinctive course token appears in the path?
    if (distinctivePathTokens.some((tok) => pathNormalized.includes(` ${tok} `))) {
      return null;
    }
    // also accept course-name-as-single-slug match (e.g. "apush", "precalculus")
    const compactCourse = entry.course.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const compactPath = rel.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (compactCourse.length >= 6 && compactPath.includes(compactCourse)) return null;
  }
  // grade-in-path rescue: course "Grade 9 ..." -> path contains " 9 "
  if (entry.grade) {
    const g = String(entry.grade).toLowerCase();
    if (/^\d+$/.test(g) && new RegExp(`(^|\\s)${g}(\\s|$)`).test(pathNormalized)) {
      // grade-in-path alone is weak; also require subject token to land in title/h1 below
      // (we fall through; if subject hits hay we'll bail out there)
    }
  }

  // pull title, h1, meta tags, body data-* attrs
  const titleMatch = src.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const h1Match = src.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title = (titleMatch?.[1] || "").replace(/<[^>]+>/g, "").trim();
  const h1 = (h1Match?.[1] || "").replace(/<[^>]+>/g, "").trim();
  const head = src.slice(0, 4000);

  const course = entry.course;
  const subject = entry.subject || "";
  const grade = entry.grade || "";

  // tokenize: words >= 3 chars, lowercased
  const wordsFromCourse = course
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const hay = `${title} ${h1} ${head}`.toLowerCase();

  // Drop stop-words AND extremely common curricular words that match everything
  const stop = new Set([
    "the", "and", "for", "with", "from", "into",
    "grade", "course", "review", "history", "studies",
    "regents", "exam", "practice", "unit", "topic",
  ]);
  const distinctive = wordsFromCourse.filter((w) => !stop.has(w));
  if (distinctive.length === 0) return null;
  if (distinctive.some((w) => hay.includes(w))) return null;
  if (subject) {
    const subjTokens = subject
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stop.has(w));
    if (subjTokens.some((w) => hay.includes(w))) return null;
  }
  // grade rescue: bare digit or "AP" present
  if (grade) {
    const g = String(grade).toLowerCase();
    if (/^ap$/i.test(g) && /\bap\b/i.test(hay)) return null;
    if (/^\d+$/.test(g) && new RegExp(`\\b${g}\\b`).test(hay)) return null;
  }
  return `course "${course}" not referenced in title/h1/header/path (title="${title.slice(0, 80)}", h1="${h1.slice(0, 80)}")`;
}

// ---------- main ---------- //
function main() {
  const raw = readFileSync(GAMES_PATH, "utf8");
  const games = JSON.parse(raw);
  if (!Array.isArray(games)) {
    console.error("games.json is not an array");
    process.exit(1);
  }

  const auditRows = [];
  const keepers = [];
  let brokenLinks = 0;
  let thumbsFixed = 0;
  let contentIssues = 0;
  let courseMismatches = 0;
  let mutationsMade = 0;

  for (const entry of games) {
    const issues = [];
    let status = "ok";
    let removed = false;
    let thumbChanged = false;
    let cardArtChanged = false;

    const rawFile = entry.file;
    const rel = normalizeRelPath(rawFile);

    // (1) file existence
    if (!rel || !existsOnDisk(rel)) {
      issues.push(`broken file link: "${rawFile}"`);
      status = "broken";
      brokenLinks++;
      mutationsMade++;
      removed = true;
      auditRows.push({
        id: entry.id,
        file: rawFile,
        status,
        removed: true,
        issues,
      });
      continue;
    }

    // (2) HTML general checks
    const isHtml = rel.toLowerCase().endsWith(".html");
    if (isHtml) {
      const generalIssues = validateHtmlGeneral(rel);
      if (generalIssues.length) {
        issues.push(...generalIssues);
        contentIssues++;
      }
    }

    // (3) Jeopardy / (4) Practice Exam / (6) arcade per-type checks
    if (isHtml) {
      const t = entry.gameType || "";
      let typeIssues = [];
      if (JEOPARDY_TYPES.has(t)) {
        typeIssues = validateJeopardyFile(rel);
      } else if (PRACTICE_TYPES.has(t)) {
        typeIssues = validatePracticeExamFile(rel);
      } else {
        // arcade / dashboard / etc.
        typeIssues = validateArcadeHtmlFile(rel);
      }
      if (typeIssues.length) {
        issues.push(...typeIssues);
        contentIssues++;
      }
    }

    // (5) thumbnail + cardArt
    for (const fld of ["thumbnail", "cardArt"]) {
      if (!entry[fld]) continue;
      const tRel = normalizeRelPath(entry[fld]);
      if (!tRel || !existsOnDisk(tRel)) {
        const fb = pickFallback(entry);
        issues.push(`${fld} missing ("${entry[fld]}") -> fallback ${fb}`);
        entry[fld] = fb;
        if (fld === "thumbnail") thumbChanged = true;
        else cardArtChanged = true;
        thumbsFixed++;
        mutationsMade++;
      }
    }

    // (7) course consistency
    if (!entry.course || !String(entry.course).trim()) {
      issues.push("course field empty");
      courseMismatches++;
      if (status === "ok") status = "review";
    } else if (isHtml) {
      const mm = courseMismatch(entry, rel);
      if (mm) {
        issues.push(mm);
        courseMismatches++;
        if (status === "ok") status = "review";
      }
    }

    if (issues.length && status === "ok") status = "warn";

    auditRows.push({
      id: entry.id,
      file: rel,
      status,
      thumbChanged,
      cardArtChanged,
      issues,
    });
    keepers.push(entry);
  }

  // write audit
  writeFileSync(
    AUDIT_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totals: {
          audited: games.length,
          kept: keepers.length,
          brokenRemoved: brokenLinks,
          thumbnailsFixed: thumbsFixed,
          contentIssues,
          courseMismatches,
        },
        entries: auditRows,
      },
      null,
      2
    )
  );

  // write updated games.json only if mutations happened
  let wroteGames = false;
  if (mutationsMade > 0) {
    writeFileSync(GAMES_PATH, JSON.stringify(keepers, null, 2));
    wroteGames = true;
  }

  // console summary
  const finalSize = statSync(GAMES_PATH).size;
  console.log("===== games.json audit =====");
  console.log("Total entries audited:    ", games.length);
  console.log("Broken links (removed):   ", brokenLinks);
  console.log("Thumbnail/cardArt fixed:  ", thumbsFixed);
  console.log("Content issues flagged:   ", contentIssues);
  console.log("Course-mismatch flags:    ", courseMismatches);
  console.log("Entries kept:             ", keepers.length);
  console.log("games.json mutated:       ", wroteGames);
  console.log(`games.json size now:       ${finalSize} bytes`);
  console.log(`Audit report -> ${AUDIT_OUT}`);
}

main();
