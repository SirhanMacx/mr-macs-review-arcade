#!/usr/bin/env node
/**
 * Harvests the `const QUESTIONS = [...]` array embedded in every
 * games/<slug>/practice-exam.html and emits one JSON bank fragment per
 * practice-exam course at data/bank-fragments/practice-exam-<bank-slug>.json
 * so the shared question bank gets ~2,000 more high-quality MCQs the next
 * time scripts/build-shared-question-bank.mjs runs.
 *
 * Why this exists:
 *   The Jeopardy-derived bank (rebuild-bank-from-jeopardy.mjs) covers
 *   62 courses and ~12,152 questions, but every per-course practice exam
 *   has 30-45 hand-authored MCQs (id, topic, prompt, choices[4],
 *   correctText, explanation) that were never harvested.
 *
 * Behaviour:
 *   - Walks every games/*-practice-exam.html (excluding the generic
 *     games/generated-practice-exam/ shell).
 *   - Brace-walks to extract the QUESTIONS array body and converts the
 *     JS-literal syntax to JSON (quoted keys, no trailing commas,
 *     "smart-escape" double quotes inside strings).
 *   - Maps the practice-exam directory slug → arcade-bank course slug
 *     using DIR_TO_BANK_SLUG (extended from rebuild-bank-from-jeopardy
 *     SLUG_MAP). Practice-exam courses that don't already have a bank
 *     fragment (AP African American Studies, AP Italian) get a brand-new
 *     course id.
 *   - Validates each question against the same rules the merge script
 *     enforces (4 choices ≥3 chars, correctText in choices, no template
 *     gibberish). Skips invalid entries with a warning.
 *   - Writes one file per course: data/bank-fragments/practice-exam-<bank-slug>.json
 *     The merge script will dedupe by prompt with the existing
 *     all-subject-<slug>.json fragment, so re-runs are idempotent.
 *
 * Usage:
 *   node scripts/extract-questions-from-practice-exams.mjs
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GAMES = join(root, "games");
const FRAGMENTS = join(root, "data/bank-fragments");

// Map practice-exam directory slug → bank-fragment course slug.
// Aligned with scripts/rebuild-bank-from-jeopardy.mjs SLUG_MAP so the
// two harvest paths feed the same course buckets.
const DIR_TO_BANK_SLUG = {
  // AP STEM
  "ap-bio-practice": "ap-biology",
  "ap-chem-practice": "ap-chemistry",
  "ap-env-sci-practice": "ap-environmental-science",
  "ap-physics-1-practice": "ap-physics-1-algebra-based",
  "ap-physics-2-practice": "ap-physics-2-algebra-based",
  "ap-physics-c-mech-practice": "ap-physics-c-mechanics",
  "ap-physics-c-em-practice": "ap-physics-c-electricity-and-magnetism",
  "ap-calc-ab-practice": "ap-calculus-ab",
  "ap-calc-bc-practice": "ap-calculus-bc",
  "ap-stats-practice": "ap-statistics",
  "ap-precalc-practice": "precalculus",
  "ap-csa-practice": "ap-computer-science-a",
  "ap-csp-practice": "ap-computer-science-principles",
  // AP History + Geography + Gov + Econ
  "ap-world-practice": "ap-world-history-modern",
  "ap-euro-practice": "ap-european-history",
  "ap-hug-practice": "ap-human-geography",
  "ap-gov-practice": "ap-united-states-government-and-politics",
  "ap-comp-gov-practice": "ap-comparative-government-and-politics",
  "ap-macro-practice": "ap-macroeconomics",
  "ap-micro-practice": "ap-microeconomics",
  "ap-psych-practice": "ap-psychology",
  "ap-aas-practice": "ap-african-american-studies",
  "apush-practice": "ap-united-states-history",
  // AP Arts + English + Languages
  "ap-art-history-practice": "ap-art-history",
  "ap-music-theory-practice": "ap-music-theory",
  "ap-eng-lang-practice": "ap-english-language-and-composition",
  "ap-eng-lit-practice": "ap-english-literature-and-composition",
  "ap-french-practice": "ap-french-language-and-culture",
  "ap-german-practice": "ap-german-language-and-culture",
  "ap-italian-practice": "ap-italian-language-and-culture",
  "ap-latin-practice": "ap-latin",
  "ap-spanish-lang-practice": "ap-spanish-language-and-culture",
  "ap-spanish-lit-practice": "ap-spanish-literature-and-culture",
  // Grades 5-8 ELA / Math / Science
  "grade-5-ela-practice": "ela-5",
  "grade-6-ela-practice": "ela-6",
  "grade-7-ela-practice": "ela-7",
  "grade-8-ela-practice": "ela-8",
  "grade-5-math-practice": "mathematics-5",
  "grade-6-math-practice": "mathematics-6",
  "grade-7-math-practice": "mathematics-7",
  "grade-8-math-practice": "mathematics-8",
  "grade-8-science-practice": "science-8",
  // NYS Regents
  "regents-algebra-1": "algebra-1",
  "regents-algebra-2": "algebra-2",
  "regents-geometry": "geometry",
  "regents-chemistry": "chemistry",
  "regents-physics": "physics",
  "regents-living-environment": "living-environment",
  "regents-earth-science": "earth-and-space-sciences",
  "regents-ela": "ela-11",
  "regents-global-2": "global-10",
  "regents-us-history": "us-history"
};

// Standardized course labels (used when minting a new bank-fragment course
// that doesn't have an existing all-subject-<slug>.json file).
const COURSE_LABEL_OVERRIDE = {
  "ap-african-american-studies": "AP African American Studies",
  "ap-italian-language-and-culture": "AP Italian Language and Culture"
};

// Sane defaults for the per-course subjectArea / gradeBand columns when we
// mint a brand-new course (no existing fragment to copy them from). These
// mirror the values used in the Jeopardy-derived fragments.
const COURSE_DEFAULTS = {
  "ap-african-american-studies": { subjectArea: "Social Studies", gradeBand: "9-12" },
  "ap-italian-language-and-culture": { subjectArea: "World Languages", gradeBand: "9-12" }
};

// ─────────────────────────────────────────────────────────────────────────────
// Parsing: brace-walk the QUESTIONS array out of the practice-exam HTML.
// ─────────────────────────────────────────────────────────────────────────────

function extractQuestionsBlock(text) {
  const startMatch = text.match(/const\s+QUESTIONS\s*=\s*\[/);
  if (!startMatch) return null;
  const arrStart = startMatch.index + startMatch[0].length - 1; // points at '['
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let escape = false;
  for (let i = arrStart; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === stringChar) { inString = false; }
      continue;
    }
    // Skip line comments BEFORE string detection so apostrophes inside
    // `//` comments (e.g. "// Lighthouse Keeper's Daughter") never poison
    // the string-state tracker. Same for block comments.
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i += 1; // outer loop's i++ skips the second /
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inString = true; stringChar = ch; continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        return text.slice(arrStart, i + 1);
      }
    }
  }
  return null;
}

// Some ELA practice exams (grade-6, grade-8) declare passages as separate
// constants and then reference them inside prompts like:
//   prompt: PASSAGE_LIT_1 + "\n\nWhich statement BEST expresses a theme..."
// Collect those `const NAME = \`...\`` declarations so we can substitute the
// identifier with its raw text BEFORE we try to JSON-parse the QUESTIONS
// array. Returns a map { NAME: rawString }.
function collectStringConsts(text) {
  const out = Object.create(null);
  // Match `const NAME = ` followed by either a back-tick template literal
  // (no `${}` interpolations are used in the practice-exam files) OR a
  // double-quoted string.
  const re = /const\s+([A-Z][A-Z0-9_]*)\s*=\s*(`([\s\S]*?)`|"([\s\S]*?)")\s*;/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    if (m[3] !== undefined) out[name] = m[3];
    else out[name] = m[4];
  }
  return out;
}

// Strip /* ... */ and // ... line comments from JS source. Walks the source
// character-by-character so apostrophes inside comments (e.g. "Lighthouse
// Keeper's Daughter") never confuse the string-tracking state.
function stripComments(jsSource) {
  let out = "";
  let inString = false;
  let stringChar = "";
  let escape = false;
  let i = 0;
  while (i < jsSource.length) {
    const ch = jsSource[i];
    const next = jsSource[i + 1];
    if (inString) {
      out += ch;
      if (escape) { escape = false; i++; continue; }
      if (ch === "\\") { escape = true; i++; continue; }
      if (ch === stringChar) inString = false;
      i++; continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inString = true; stringChar = ch; out += ch; i++; continue;
    }
    if (ch === "/" && next === "/") {
      // Skip to end of line.
      while (i < jsSource.length && jsSource[i] !== "\n") i++;
      out += "\n"; if (i < jsSource.length) i++; continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < jsSource.length && !(jsSource[i] === "*" && jsSource[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += ch; i++;
  }
  return out;
}

// Inline `IDENT + "..."` and `"..." + IDENT` and `IDENT` (alone) inside the
// extracted QUESTIONS block. We work on the JS source BEFORE conversion to
// JSON so the concatenation operator (`+`) is still valid syntax.
function inlineStringConsts(jsBlock, consts) {
  if (!Object.keys(consts).length) return jsBlock;
  // Strip comments first so apostrophes inside `//` comments (e.g.
  // "Lighthouse Keeper's Daughter") don't fool the string-state tracker.
  const stripped = stripComments(jsBlock);
  // Walk the source character-by-character. When we hit an identifier that
  // matches a known const and we are NOT inside a string, splice in
  // a double-quoted string with the const's value (with backslash-escaped
  // backslashes, newlines, and double quotes so the result is JSON-safe).
  // Then collapse any adjacent `"a" + "b"` runs into a single `"ab"`.
  let out = "";
  let inString = false;
  let stringChar = "";
  let escape = false;
  let i = 0;
  while (i < stripped.length) {
    const ch = stripped[i];
    if (inString) {
      out += ch;
      if (escape) { escape = false; i++; continue; }
      if (ch === "\\") { escape = true; i++; continue; }
      if (ch === stringChar) inString = false;
      i++; continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true; stringChar = ch; out += ch; i++; continue;
    }
    // Identifier start
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < stripped.length && /[A-Za-z0-9_$]/.test(stripped[j])) j++;
      const ident = stripped.slice(i, j);
      if (Object.prototype.hasOwnProperty.call(consts, ident)) {
        const escaped = JSON.stringify(consts[ident]);
        out += escaped;
        i = j; continue;
      }
      out += ident; i = j; continue;
    }
    out += ch; i++;
  }
  // Collapse adjacent `"..." + "..."` concatenations (one pass per run).
  // Be careful to only collapse outside of strings — but at this point the
  // only `+` operators left are between two adjacent double-quoted JSON
  // strings (we converted singles in singleToDoubleQuoted later, but here
  // we're still pre-JSON; the input only uses doubles).
  let prev;
  do {
    prev = out;
    out = collapseAdjacentStrings(out);
  } while (out !== prev);
  return out;
}

function collapseAdjacentStrings(src) {
  // Replace "...A..." + "...B..." with "...A......B..." (escape-aware on
  // both sides). Implemented as a state-machine scan.
  let out = "";
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch !== '"') { out += ch; i++; continue; }
    // Parse a double-quoted string starting at i.
    const startA = i;
    i++;
    while (i < src.length) {
      if (src[i] === "\\" && i + 1 < src.length) { i += 2; continue; }
      if (src[i] === '"') { i++; break; }
      i++;
    }
    const strA = src.slice(startA, i); // includes both quotes
    // Look ahead for whitespace then '+' then whitespace then '"'.
    let k = i;
    while (k < src.length && /[\s]/.test(src[k])) k++;
    if (src[k] !== "+") { out += strA; continue; }
    k++;
    while (k < src.length && /[\s]/.test(src[k])) k++;
    if (src[k] !== '"') { out += strA; continue; }
    // Parse the second string.
    const startB = k;
    k++;
    while (k < src.length) {
      if (src[k] === "\\" && k + 1 < src.length) { k += 2; continue; }
      if (src[k] === '"') { k++; break; }
      k++;
    }
    const strB = src.slice(startB, k);
    // Concat: strip closing " of A and opening " of B.
    const merged = strA.slice(0, -1) + strB.slice(1);
    out += merged;
    i = k;
  }
  return out;
}

// Convert the JS-literal QUESTIONS array source into JSON-parsable text.
// Practice-exam files use:
//   - unquoted object keys (id:, topic:, prompt:, ...)
//   - double-quoted string values (with the occasional unescaped apostrophe)
//   - trailing commas after the last array element
//   - rare embedded back-tick template literals (none observed across all
//     52 files, but we guard against them by leaving back-tick strings alone)
function jsArrayToJson(jsSource) {
  // 1) Strip /* ... */ and // ... comments OUTSIDE strings.
  let out = "";
  let inString = false;
  let stringChar = "";
  let escape = false;
  for (let i = 0; i < jsSource.length; i++) {
    const ch = jsSource[i];
    const next = jsSource[i + 1];
    if (inString) {
      out += ch;
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === stringChar) { inString = false; }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inString = true; stringChar = ch; out += ch; continue;
    }
    if (ch === "/" && next === "/") {
      // skip to EOL
      while (i < jsSource.length && jsSource[i] !== "\n") i++;
      out += "\n"; continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < jsSource.length && !(jsSource[i] === "*" && jsSource[i + 1] === "/")) i++;
      i += 1; // skip the '/'
      continue;
    }
    out += ch;
  }

  // 2) Convert back-tick template literals to double-quoted JSON strings.
  //    Grade-8 ELA uses `prompt: PASSAGE + \`<p>...\`` — the trailing
  //    template needs to be a JSON string before downstream steps run.
  out = backtickToDoubleQuoted(out);

  // 3) Quote unquoted object keys: {  id: "x"  → {  "id": "x"
  //    Match a key-shape word followed by ':' that is preceded by '{' or ','
  //    (allowing whitespace between). Run outside strings only by scanning
  //    character-by-character.
  out = quoteUnquotedKeys(out);

  // 4) Convert single-quoted strings → double-quoted JSON strings (escape
  //    any internal double quotes / backslashes). Almost never used in the
  //    practice-exam files, but be safe.
  out = singleToDoubleQuoted(out);

  // 5) Collapse adjacent `"a" + "b"` runs into `"ab"` (left over after the
  //    backtick conversion above turned the second operand into a JSON
  //    string but left the `+` in place).
  let prev;
  do {
    prev = out;
    out = collapseAdjacentStrings(out);
  } while (out !== prev);

  // 6) Strip trailing commas before ] or }.
  out = out.replace(/,(\s*[\]}])/g, "$1");

  return out;
}

function quoteUnquotedKeys(src) {
  let out = "";
  let inString = false;
  let stringChar = "";
  let escape = false;
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (inString) {
      out += ch;
      if (escape) { escape = false; i++; continue; }
      if (ch === "\\") { escape = true; i++; continue; }
      if (ch === stringChar) { inString = false; }
      i++; continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true; stringChar = ch; out += ch; i++; continue;
    }
    // Look for a key-shape: optional whitespace after { or ,, then [A-Za-z_$][A-Za-z0-9_$]*, then optional whitespace, then ':'
    // We only need to handle the simple cases that practice-exam files use:
    //   id:, topic:, prompt:, choices:, correctText:, explanation:
    // but the matcher works for any identifier.
    if (ch === "{" || ch === ",") {
      out += ch; i++;
      // Eat whitespace, recording it
      let ws = "";
      while (i < src.length && /\s/.test(src[i])) { ws += src[i]; i++; }
      out += ws;
      // Match identifier
      const idMatch = src.slice(i).match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*:/);
      if (idMatch) {
        out += `"${idMatch[1]}":`;
        i += idMatch[0].length;
      }
      continue;
    }
    out += ch; i++;
  }
  return out;
}

// Convert back-tick template literals (no `${}` interpolation supported —
// none observed across the 52 practice-exam files; throws if found) to
// double-quoted JSON strings. Internal double quotes, newlines, and
// backslashes get JSON-escaped via JSON.stringify.
function backtickToDoubleQuoted(src) {
  let out = "";
  let inDQ = false; // tracks double-quoted JS string
  let inSQ = false; // single-quoted JS string
  let escape = false;
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (inDQ) {
      out += ch;
      if (escape) { escape = false; i++; continue; }
      if (ch === "\\") { escape = true; i++; continue; }
      if (ch === '"') inDQ = false;
      i++; continue;
    }
    if (inSQ) {
      out += ch;
      if (escape) { escape = false; i++; continue; }
      if (ch === "\\") { escape = true; i++; continue; }
      if (ch === "'") inSQ = false;
      i++; continue;
    }
    if (ch === '"') { inDQ = true; out += ch; i++; continue; }
    if (ch === "'") { inSQ = true; out += ch; i++; continue; }
    if (ch === "`") {
      // Parse template literal up to matching back-tick. Escape sequences
      // recognized: \`, \\, \n, \t, \r, \", \' — preserve everything else
      // raw and let JSON.stringify handle it.
      i++;
      let buf = "";
      while (i < src.length) {
        const c = src[i];
        if (c === "\\" && i + 1 < src.length) {
          const e = src[i + 1];
          if (e === "`") { buf += "`"; i += 2; continue; }
          if (e === "\\") { buf += "\\"; i += 2; continue; }
          if (e === "n") { buf += "\n"; i += 2; continue; }
          if (e === "t") { buf += "\t"; i += 2; continue; }
          if (e === "r") { buf += "\r"; i += 2; continue; }
          if (e === '"') { buf += '"'; i += 2; continue; }
          if (e === "'") { buf += "'"; i += 2; continue; }
          buf += e; i += 2; continue;
        }
        if (c === "$" && src[i + 1] === "{") {
          throw new Error("Template literal contains `${}` interpolation — extractor does not support this");
        }
        if (c === "`") { i++; break; }
        buf += c; i++;
      }
      out += JSON.stringify(buf);
      continue;
    }
    out += ch; i++;
  }
  return out;
}

function singleToDoubleQuoted(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"') {
      // Pass-through double-quoted string verbatim.
      out += ch; i++;
      while (i < src.length) {
        const c = src[i];
        out += c;
        if (c === "\\" && i + 1 < src.length) { out += src[i + 1]; i += 2; continue; }
        if (c === '"') { i++; break; }
        i++;
      }
      continue;
    }
    if (ch === "'") {
      // Convert to double-quoted, escaping any " or \ inside.
      out += '"';
      i++;
      while (i < src.length) {
        const c = src[i];
        if (c === "\\" && i + 1 < src.length) {
          out += "\\" + src[i + 1]; i += 2; continue;
        }
        if (c === "'") { out += '"'; i++; break; }
        if (c === '"') { out += '\\"'; i++; continue; }
        out += c; i++;
      }
      continue;
    }
    out += ch; i++;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validators (mirror build-shared-question-bank.mjs so we don't write a
// fragment that the merge step would silently drop).
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_PHRASES = [
  "Specific evidence that proves a claim",
  "ignoring the source or data in the prompt",
  "describing a topic without explaining why it matters",
  "choosing an answer because it uses familiar words",
  "A fact from a different course",
  "In an AP CED-aligned exam task",
  "In a NYS Framework-aligned exam task",
  "which concept is the best anchor for a NYS standards-aligned",
  "best avoids a common mistake about"
];

function isValidQuestion(q) {
  if (!q || typeof q !== "object") return { ok: false, why: "not-object" };
  if (!q.prompt || !q.correctText || !Array.isArray(q.choices)) return { ok: false, why: "missing-required" };
  if (q.choices.length !== 4) return { ok: false, why: "choices-not-4" };
  const strs = q.choices.map(c => (typeof c === "string" ? c.trim() : ""));
  if (strs.some(s => !s)) return { ok: false, why: "empty-choice" };
  if (strs.some(s => s.length < 3)) return { ok: false, why: "short-choice" };
  if (!strs.includes(String(q.correctText).trim())) return { ok: false, why: "correct-not-in-choices" };
  const numericCount = strs.filter(s => /^-?\d{1,2}$/.test(s)).length;
  const correctIsNum = /^-?\d{1,2}$/.test(String(q.correctText).trim());
  if (numericCount > 1 && !correctIsNum) return { ok: false, why: "multi-numeric-pattern" };
  const blob = (q.prompt || "") + " " + (q.correctText || "") + " " + strs.join(" ");
  if (TEMPLATE_PHRASES.some(p => blob.includes(p))) return { ok: false, why: "template-gibberish" };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML helpers: pull <h1> for the courseLabel, and derive a stable id slug
// from the practice-exam directory.
// ─────────────────────────────────────────────────────────────────────────────

function extractCourseLabel(html, fallback) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1) return fallback;
  // Strip HTML tags inside the h1 and decode the two entities we hit
  // ("&amp;" in regents-us-history). Keep the result tight.
  const stripped = h1[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  // Strip the trailing " Practice Exam" / " Practice Test" if present so
  // the courseLabel matches the conventions used elsewhere (just the
  // course name, no "Practice Exam" suffix).
  return stripped.replace(/\s+(Practice\s+(?:Exam|Test))$/i, "");
}

function idSlug(bankSlug) {
  // Use a short, stable prefix derived from the bank slug for the
  // per-question id. Falls back to the bank slug itself.
  return bankSlug;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(FRAGMENTS)) mkdirSync(FRAGMENTS, { recursive: true });

  const practiceDirs = readdirSync(GAMES, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => name !== "generated-practice-exam")
    .filter(name => existsSync(join(GAMES, name, "practice-exam.html")))
    .sort();

  // Group by bank-slug so multiple dirs that map to the same course (rare
  // but possible) merge into one fragment file.
  const byBankSlug = Object.create(null);
  const unmapped = [];

  for (const dir of practiceDirs) {
    const bankSlug = DIR_TO_BANK_SLUG[dir];
    if (!bankSlug) { unmapped.push(dir); continue; }
    const filePath = join(GAMES, dir, "practice-exam.html");
    const html = readFileSync(filePath, "utf8");
    const block = extractQuestionsBlock(html);
    if (!block) {
      console.warn(`SKIP ${dir}: could not find QUESTIONS array`);
      continue;
    }
    // Some practice-exam files declare passage text in `const PASSAGE_* = \`...\``
    // and then reference those constants inside prompts via `+` concatenation.
    // Inline those references BEFORE we convert to JSON.
    const stringConsts = collectStringConsts(html);
    const inlinedBlock = inlineStringConsts(block, stringConsts);
    const jsonText = jsArrayToJson(inlinedBlock);
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.warn(`SKIP ${dir}: JSON parse failed — ${e.message}`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      console.warn(`SKIP ${dir}: parsed value is not an array`);
      continue;
    }
    const courseLabel = COURSE_LABEL_OVERRIDE[bankSlug] || extractCourseLabel(html, bankSlug);
    if (!byBankSlug[bankSlug]) {
      byBankSlug[bankSlug] = {
        bankSlug,
        courseLabel,
        questions: []
      };
    }
    let kept = 0, dropped = 0;
    let idx = 1;
    for (const q of parsed) {
      const check = isValidQuestion(q);
      if (!check.ok) { dropped++; continue; }
      const defaults = COURSE_DEFAULTS[bankSlug] || { subjectArea: "Review", gradeBand: "Multi" };
      byBankSlug[bankSlug].questions.push({
        id: `${idSlug(bankSlug)}-pe-${String(idx).padStart(3, "0")}`,
        course: bankSlug,
        courseLabel,
        topic: q.topic ? String(q.topic).trim() : "Practice Exam",
        domain: "Practice Exam",
        subjectArea: defaults.subjectArea,
        gradeBand: defaults.gradeBand,
        standardRefs: [],
        sourceAuthority: "mr-macs-practice-exam",
        assessmentSourceId: `practice-exam-${dir}`,
        itemMode: "from-practice-exam",
        prompt: String(q.prompt).trim(),
        choices: q.choices.map(c => String(c).trim()),
        correctText: String(q.correctText).trim(),
        explanation: q.explanation ? String(q.explanation).trim() : ""
      });
      idx++;
      kept++;
    }
    console.log(`  ${dir.padEnd(34)} → ${bankSlug.padEnd(48)} kept ${kept}/${parsed.length}${dropped ? ` (dropped ${dropped})` : ""}`);
  }

  if (unmapped.length) {
    console.warn(`\nUnmapped practice-exam directories (add to DIR_TO_BANK_SLUG): ${unmapped.join(", ")}`);
  }

  // Re-index ids per course after deduping in this script (we don't dedupe
  // across the existing all-subject fragment — the merge step handles that
  // by prompt key).
  let totalQs = 0;
  let filesWritten = 0;
  const out = [];
  for (const bankSlug of Object.keys(byBankSlug).sort()) {
    const entry = byBankSlug[bankSlug];
    // Re-key ids so duplicates from a merged-multiple-dirs case (none today)
    // get unique numbers.
    entry.questions.forEach((q, i) => {
      q.id = `${idSlug(bankSlug)}-pe-${String(i + 1).padStart(3, "0")}`;
    });
    const fragPath = join(FRAGMENTS, `practice-exam-${bankSlug}.json`);
    const payload = {
      course: bankSlug,
      courseLabel: entry.courseLabel,
      generatedBy: "scripts/extract-questions-from-practice-exams.mjs",
      version: `${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-practice-exam-harvest`,
      questions: entry.questions
    };
    writeFileSync(fragPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    totalQs += entry.questions.length;
    filesWritten++;
    out.push({ bankSlug, count: entry.questions.length, path: fragPath });
  }

  console.log("─".repeat(72));
  console.log(`Wrote ${filesWritten} fragment files, ${totalQs} questions total.`);
  console.log("─".repeat(72));
  out.forEach(o => console.log(`  ${basename(o.path).padEnd(64)} ${o.count} Qs`));
}

main();
