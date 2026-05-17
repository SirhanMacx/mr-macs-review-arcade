#!/usr/bin/env node
// Audit + auto-fix sweep across every games/<course>/practice-exam.html.
// - Validates each QUESTIONS entry (id/topic/prompt/choices/correctText/explanation)
// - Drops malformed questions (empty/too-short choices, numeric-distractor traps, broken correctText)
// - Drops duplicate prompts (keeps first)
// - Renumbers ids sequentially after deletions
// - Ensures the correctIdx normalization helper line is present right after the closing `];`
// - Flags Global History II remnants in non-flagship files for human review
// - Confirms STORAGE_KEY matches the course slug
//
// Run:  node scripts/audit-practice-exams.mjs
// Use --check to suppress writes (audit-only).

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const gamesDir = resolve(root, "games");

const FLAGSHIP_GLOBAL_2_DIR = "regents-global-2";
const NORMALIZE_LINE = "QUESTIONS.forEach((q) => { q.correctIdx = q.choices.indexOf(q.correctText); });";

const CODEX_PHRASES = [
  "In an AP CED-aligned exam task",
  "ignoring the source or data in the prompt",
  "describing a topic without explaining",
  "Specific evidence that proves a claim",
  "Which review target belongs",
  "named anchor",
  "is a core idea in",
];

const writeMode = !process.argv.includes("--check");

function listPracticeExamFiles() {
  const files = [];
  for (const entry of readdirSync(gamesDir)) {
    if (entry === "generated-practice-exam") continue;
    const examPath = resolve(gamesDir, entry, "practice-exam.html");
    try {
      const stat = statSync(examPath);
      if (stat.isFile()) files.push({ slug: entry, path: examPath });
    } catch {
      /* not every game folder has a practice exam — fine */
    }
  }
  files.sort((a, b) => a.slug.localeCompare(b.slug));
  return files;
}

function splitFile(source) {
  const startMatch = source.match(/^const QUESTIONS = \[\s*\n/m);
  if (!startMatch) throw new Error("missing `const QUESTIONS = [` opener");
  const startIndex = startMatch.index;
  const headEnd = startIndex + startMatch[0].length;
  // Search for closing `];` followed by either the normalize line or `const STORAGE_KEY`.
  const tailMatch = source.slice(headEnd).match(/^\];\s*\n/m);
  if (!tailMatch) throw new Error("missing closing `];` after QUESTIONS");
  const tailIndex = headEnd + tailMatch.index;
  const tailEnd = tailIndex + tailMatch[0].length;
  // Capture any module-level preamble between the opening <script> and the QUESTIONS declaration.
  // We look for the most recent <script> tag before startIndex.
  const head = source.slice(0, startIndex);
  const scriptOpenIdx = head.lastIndexOf("<script>");
  const preamble = scriptOpenIdx >= 0 ? head.slice(scriptOpenIdx + "<script>".length) : "";
  return {
    head, // everything up to (not including) `const QUESTIONS = [`
    preamble, // JS between opening <script> tag and `const QUESTIONS` (passages, helpers, etc.)
    arrayPrefix: source.slice(startIndex, headEnd), // `const QUESTIONS = [\n`
    body: source.slice(headEnd, tailIndex), // raw question entries
    arraySuffix: source.slice(tailIndex, tailEnd), // `];\n`
    tail: source.slice(tailEnd), // everything after, may already start with NORMALIZE_LINE
  };
}

function evalQuestions(preamble, arrayPrefix, body, arraySuffix) {
  // The body uses unquoted property keys (id:, topic:, etc.) — must run as JS, not JSON.
  // We run any module-level constants from the preamble (passages, helper text) first so the
  // QUESTIONS array can reference them. If the preamble references DOM globals (document, etc.)
  // we stub them as harmless noops.
  const wrapped = `${preamble}\nglobalThis.__QUESTIONS = ${arrayPrefix.slice("const QUESTIONS = ".length)}${body}${arraySuffix.replace(/;\s*$/, ";")}`;
  const noopProxy = new Proxy(function () {}, {
    get: () => noopProxy,
    apply: () => noopProxy,
    construct: () => ({}),
  });
  const sandbox = {
    document: noopProxy,
    window: noopProxy,
    navigator: { language: "en-US", languages: ["en-US"] },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(wrapped, sandbox, { filename: "QUESTIONS.eval.js" });
  if (!Array.isArray(sandbox.__QUESTIONS)) throw new Error("eval did not yield array");
  return sandbox.__QUESTIONS;
}

function isPureNumericChoice(str) {
  // Pure 1-2 digit numeric (no units, no symbols).
  return /^\s*-?\d{1,2}\s*$/.test(str);
}

function looksLikeNonMathProse(text) {
  // Returns true if `text` reads as natural-language English (not a math/symbolic answer).
  // We only fire the screenshot-bug rule when the correct answer is clearly NOT a math answer
  // but at least one distractor is a bare 1-2 digit number — the actual bug pattern Jon screenshotted.
  if (typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 12) return false;
  // No equals/operator/fraction characters that would suggest a math expression.
  if (/[=<>≤≥±]/.test(trimmed)) return false;
  if (/\d\s*\/\s*\d/.test(trimmed)) return false; // looks like 3/4
  if (/\^/.test(trimmed)) return false; // exponent
  // Must contain at least one space and at least one alphabetical word ≥3 chars.
  if (!/\b[A-Za-z]{3,}\b/.test(trimmed)) return false;
  if (!/\s/.test(trimmed)) return false;
  // Letter density ≥45% (rules out things like "(3t^2 - 1)/(2t)").
  const letters = (trimmed.match(/[A-Za-z]/g) || []).length;
  if (letters / trimmed.length < 0.45) return false;
  return true;
}

function hasCodexPhrase(text) {
  if (!text) return false;
  for (const phrase of CODEX_PHRASES) {
    if (text.includes(phrase)) return phrase;
  }
  return false;
}

function validateChoices(choices, correctText) {
  // Returns { ok, reason }.
  if (!Array.isArray(choices) || choices.length !== 4) {
    return { ok: false, reason: `choices not array of 4 (got ${Array.isArray(choices) ? choices.length : typeof choices})` };
  }
  // Only fire the screenshot-bug rule when the correct answer is clearly non-math prose.
  // Math/science exams legitimately use short symbolic answers ("F", "1/2", "6t", "vi", "2.5")
  // paired with similarly short distractors, including bare numerics.
  const correctIsProse = looksLikeNonMathProse(correctText);
  for (let i = 0; i < choices.length; i += 1) {
    const c = choices[i];
    if (typeof c !== "string") return { ok: false, reason: `choice ${i} not a string` };
    if (c.trim() === "") return { ok: false, reason: `choice ${i} empty` };
    // Screenshot bug: distractors are bare 1-2 digit numerics, but the correct answer is prose.
    if (correctIsProse && isPureNumericChoice(c)) {
      return { ok: false, reason: `choice ${i} bare numeric distractor (${JSON.stringify(c)}) under a prose correct answer` };
    }
  }
  // Confirm correctText is one of the choices.
  if (!choices.includes(correctText)) return { ok: false, reason: `correctText not in choices` };
  // Confirm choices are unique strings.
  const seen = new Set();
  for (const c of choices) {
    if (seen.has(c)) return { ok: false, reason: `duplicate choice (${JSON.stringify(c)})` };
    seen.add(c);
  }
  return { ok: true };
}

function validateQuestion(q) {
  // Returns list of failure reasons (drop the Q if any fatal).
  const issues = [];
  if (!q || typeof q !== "object") return ["not an object"];
  if (typeof q.id !== "string" || q.id.trim() === "") issues.push("missing id");
  if (typeof q.topic !== "string" || q.topic.trim() === "") issues.push("missing topic");
  if (typeof q.prompt !== "string" || q.prompt.length < 10) issues.push("prompt missing or <10 chars");
  if (typeof q.correctText !== "string" || q.correctText.trim() === "") issues.push("missing correctText");
  if (typeof q.explanation !== "string" || q.explanation.length < 10) issues.push("explanation missing or <10 chars");
  const choiceCheck = validateChoices(q.choices, q.correctText);
  if (!choiceCheck.ok) issues.push(`choices invalid (${choiceCheck.reason})`);
  // Codex phrase scan.
  for (const field of ["prompt", "explanation"]) {
    const phrase = hasCodexPhrase(q[field]);
    if (phrase) issues.push(`${field} contains codex phrase "${phrase}"`);
  }
  if (Array.isArray(q.choices)) {
    for (let i = 0; i < q.choices.length; i += 1) {
      const phrase = hasCodexPhrase(q.choices[i]);
      if (phrase) issues.push(`choice ${i} contains codex phrase "${phrase}"`);
    }
  }
  return issues;
}

function escapeStringForJs(str) {
  // Match style used elsewhere in repo: double quotes, escape " and backslash, leave smart-quotes intact.
  return `"${String(str)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
  }"`;
}

function serializeQuestion(q, indent = "  ") {
  // Mirror the existing format: object literal with unquoted keys, double-quoted strings, 4-space inner indent.
  const inner = indent + "  ";
  const choicesBlock = q.choices.map((c) => `${inner}  ${escapeStringForJs(c)},`).join("\n");
  return [
    `${indent}{`,
    `${inner}id: ${escapeStringForJs(q.id)},`,
    `${inner}topic: ${escapeStringForJs(q.topic)},`,
    `${inner}prompt: ${escapeStringForJs(q.prompt)},`,
    `${inner}choices: [`,
    choicesBlock,
    `${inner}],`,
    `${inner}correctText: ${escapeStringForJs(q.correctText)},`,
    `${inner}explanation: ${escapeStringForJs(q.explanation)}`,
    `${indent}}`,
  ].join("\n");
}

function renumberIds(questions, slug) {
  // Detect the existing id prefix from the first survivor. If they vary, fall back to a slug-derived prefix.
  if (questions.length === 0) return;
  const prefixes = new Set();
  for (const q of questions) {
    const m = String(q.id || "").match(/^([a-z0-9]+)-\d+$/i);
    if (m) prefixes.add(m[1]);
  }
  let prefix;
  if (prefixes.size === 1) {
    prefix = [...prefixes][0];
  } else {
    // Pick the most common one, or derive from slug.
    const counts = new Map();
    for (const q of questions) {
      const m = String(q.id || "").match(/^([a-z0-9]+)-\d+$/i);
      if (m) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
    }
    if (counts.size) {
      prefix = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    } else {
      prefix = slug.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "q";
    }
  }
  questions.forEach((q, idx) => {
    q.id = `${prefix}-${String(idx + 1).padStart(3, "0")}`;
  });
}

function detectGlobalIIRemnants(slug, source) {
  if (slug === FLAGSHIP_GLOBAL_2_DIR) return [];
  const issues = [];
  if (/\bghii-\d+\b/.test(source)) issues.push('contains "ghii-NNN" IDs');
  if (/"World in 1750"/.test(source) || /'World in 1750'/.test(source)) issues.push('contains "World in 1750" topic');
  if (/regents-global-2-practice-exam-state-v1/.test(source)) issues.push("uses regents-global-2 STORAGE_KEY");
  return issues;
}

function storageKeyMatchesSlug(slug, key) {
  // Existing repo convention: STORAGE_KEY starts with the slug, then `-state-vN` or `-practice-exam-state-vN`.
  // We treat any key whose prefix equals the slug as correctly-scoped.
  if (typeof key !== "string") return false;
  return key === slug || key.startsWith(`${slug}-`);
}

function findDuplicatePrompts(questions) {
  const seen = new Map();
  const indicesToDrop = [];
  for (let i = 0; i < questions.length; i += 1) {
    const key = String(questions[i].prompt || "").trim();
    if (key === "") continue;
    if (seen.has(key)) {
      indicesToDrop.push(i);
    } else {
      seen.set(key, i);
    }
  }
  return indicesToDrop;
}

// Patterns that already do the correctIdx normalization. We strip every match anywhere in the
// trailing script so we always end up with exactly one canonical line placed immediately after
// the QUESTIONS array close.
const NORMALIZE_PATTERNS = [
  // Canonical one-liner.
  /^[ \t]*QUESTIONS\.forEach\(\(q\) => \{ q\.correctIdx = q\.choices\.indexOf\(q\.correctText\); \}\);[ \t]*\n/m,
  // Older multi-line guarded variant (also with optional leading comment).
  /^(?:\/\/[^\n]*\n)?[ \t]*QUESTIONS\.forEach\(\(q\) => \{[\s\S]{0,200}?q\.correctIdx = q\.choices\.indexOf\(q\.correctText\);[\s\S]{0,80}?\}\);[ \t]*\n/m,
];

function ensureNormalizeLine(arraySuffix, tail) {
  // Count + strip every pre-existing occurrence so we can decide whether to declare an "insertion".
  let cleanedTail = tail;
  let strippedCount = 0;
  // Strip every pattern until nothing matches.
  let progress = true;
  while (progress) {
    progress = false;
    for (const pattern of NORMALIZE_PATTERNS) {
      if (pattern.test(cleanedTail)) {
        cleanedTail = cleanedTail.replace(pattern, "");
        strippedCount += 1;
        progress = true;
      }
    }
  }
  // Canonical layout: arraySuffix already ends with at least one blank line after `];`.
  // We want tail to begin with: NORMALIZE_LINE + "\n" + restOfTail (where restOfTail has no leading
  // blank lines, since arraySuffix already provides the separator).
  const restOfTail = cleanedTail.replace(/^\n+/, "");
  // Ensure arraySuffix has exactly one trailing blank line (i.e. `];\n\n`).
  let nextArraySuffix = arraySuffix.replace(/\n+$/, "\n\n");
  const nextTail = `${NORMALIZE_LINE}\n${restOfTail}`;
  const fullBefore = arraySuffix + tail;
  const fullAfter = nextArraySuffix + nextTail;
  const changed = fullBefore !== fullAfter;
  return { arraySuffix: nextArraySuffix, tail: nextTail, inserted: changed, strippedDuplicates: strippedCount > 1 };
}

function checkStorageKey(slug, source) {
  const match = source.match(/const STORAGE_KEY\s*=\s*"([^"]+)"/);
  if (!match) return { ok: false, found: null };
  return { ok: storageKeyMatchesSlug(slug, match[1]), found: match[1] };
}

// === Run sweep ===

const files = listPracticeExamFiles();
const results = [];
let totalQuestionsBefore = 0;
let totalQuestionsAfter = 0;
let filesModified = 0;
let questionsDropped = 0;
let normalizeLinesAdded = 0;

for (const { slug, path } of files) {
  const fileResult = {
    slug,
    path,
    questionsBefore: 0,
    questionsAfter: 0,
    drops: [], // { id, reason }
    flags: [], // human-review warnings
    insertedNormalize: false,
    modified: false,
  };

  const source = readFileSync(path, "utf8");

  // Storage key check.
  const keyCheck = checkStorageKey(slug, source);
  if (!keyCheck.ok) {
    if (keyCheck.found == null) {
      fileResult.flags.push(`missing STORAGE_KEY declaration`);
    } else {
      fileResult.flags.push(`STORAGE_KEY "${keyCheck.found}" is not scoped to slug "${slug}"`);
    }
  }

  // Global II remnant scan (excludes flagship).
  for (const issue of detectGlobalIIRemnants(slug, source)) {
    fileResult.flags.push(`Global II remnant: ${issue}`);
  }

  // Split + eval.
  let parts;
  try {
    parts = splitFile(source);
  } catch (err) {
    fileResult.flags.push(`could not split QUESTIONS: ${err.message}`);
    results.push(fileResult);
    continue;
  }

  let questions;
  try {
    questions = evalQuestions(parts.preamble, parts.arrayPrefix, parts.body, parts.arraySuffix);
  } catch (err) {
    fileResult.flags.push(`could not eval QUESTIONS array: ${err.message}`);
    results.push(fileResult);
    continue;
  }

  fileResult.questionsBefore = questions.length;
  totalQuestionsBefore += questions.length;

  // 1) Validate each question; drop fatal failures.
  const surviving = [];
  for (const q of questions) {
    const issues = validateQuestion(q);
    if (issues.length === 0) {
      surviving.push(q);
    } else {
      fileResult.drops.push({ id: q?.id || "(no-id)", reason: issues.join("; ") });
      questionsDropped += 1;
    }
  }

  // 2) Drop duplicate prompts (keep first).
  const dupIndices = findDuplicatePrompts(surviving);
  const dupSet = new Set(dupIndices);
  const deduped = surviving.filter((q, idx) => {
    if (dupSet.has(idx)) {
      fileResult.drops.push({ id: q.id || "(no-id)", reason: `duplicate prompt of earlier question` });
      questionsDropped += 1;
      return false;
    }
    return true;
  });

  // 3) Flag if Q count < 30 after pruning.
  if (deduped.length < 30) {
    fileResult.flags.push(`only ${deduped.length} questions (target ≥30)`);
  }

  fileResult.questionsAfter = deduped.length;
  totalQuestionsAfter += deduped.length;

  // 4) Renumber IDs sequentially.
  renumberIds(deduped, slug);

  // 5) Decide whether body must be rewritten.
  const droppedAny = fileResult.drops.length > 0;

  // Build the new body if we modified anything in the questions list.
  let nextBody = parts.body;
  if (droppedAny) {
    const serialized = deduped.map((q) => serializeQuestion(q, "  ")).join(",\n") + (deduped.length ? ",\n" : "");
    nextBody = serialized;
  }

  // 6) Ensure normalize line.
  const ensured = ensureNormalizeLine(parts.arraySuffix, parts.tail);
  if (ensured.inserted) {
    fileResult.insertedNormalize = true;
    normalizeLinesAdded += 1;
  }
  if (ensured.strippedDuplicates) {
    fileResult.flags.push("removed duplicate correctIdx normalize line(s)");
  }

  // Reassemble if anything changed.
  const wouldChange = droppedAny || ensured.inserted;
  if (wouldChange) {
    const nextSource = `${parts.head}${parts.arrayPrefix}${nextBody}${ensured.arraySuffix}${ensured.tail}`;
    if (writeMode) {
      writeFileSync(path, nextSource);
    }
    fileResult.modified = true;
    filesModified += 1;
  }

  results.push(fileResult);
}

// === Report ===

console.log("=".repeat(72));
console.log("PRACTICE EXAM AUDIT + FIX SWEEP");
console.log("=".repeat(72));
console.log(`Mode:               ${writeMode ? "WRITE (auto-fixing)" : "CHECK (read-only)"}`);
console.log(`Files audited:      ${files.length}`);
console.log(`Files modified:     ${filesModified}`);
console.log(`Questions before:   ${totalQuestionsBefore}`);
console.log(`Questions after:    ${totalQuestionsAfter}`);
console.log(`Questions dropped:  ${questionsDropped}`);
console.log(`Normalize lines added: ${normalizeLinesAdded}`);
console.log("");

const filesWithDrops = results.filter((r) => r.drops.length);
const filesWithFlags = results.filter((r) => r.flags.length);

if (filesWithDrops.length) {
  console.log("-- Per-file drops --");
  for (const r of filesWithDrops) {
    console.log(`  ${r.slug}: dropped ${r.drops.length}`);
    for (const d of r.drops) {
      console.log(`    - [${d.id}] ${d.reason}`);
    }
  }
  console.log("");
}

if (filesWithFlags.length) {
  // Separate informational (already fixed) vs review-required flags for cleaner reporting.
  const isInfo = (f) => f.startsWith("removed duplicate");
  const reviewFiles = filesWithFlags.filter((r) => r.flags.some((f) => !isInfo(f)));
  const infoFiles = filesWithFlags.filter((r) => r.flags.every(isInfo));
  if (reviewFiles.length) {
    console.log("-- Files with flags (human review) --");
    for (const r of reviewFiles) {
      console.log(`  ${r.slug}:`);
      for (const flag of r.flags) {
        if (!isInfo(flag)) console.log(`    ! ${flag}`);
      }
    }
    console.log("");
  }
  if (infoFiles.length) {
    console.log(`-- Cosmetic auto-fixes applied (${infoFiles.length} file${infoFiles.length === 1 ? "" : "s"}) --`);
    for (const r of infoFiles) {
      console.log(`  ${r.slug}: ${r.flags.filter(isInfo).join("; ")}`);
    }
    console.log("");
  }
}

if (!filesWithDrops.length && !filesWithFlags.length && filesModified === 0) {
  console.log("OK: every practice exam already passes the audit.");
}

// Exit non-zero only if we have human-review flags that auto-fix could not handle.
const unrecoverable = results.some((r) => r.flags.some((f) =>
  f.startsWith("Global II remnant") ||
  f.startsWith("could not split") ||
  f.startsWith("could not eval")
));
if (unrecoverable) {
  console.error("FAIL: unrecoverable issues require human review (see flags above).");
  process.exit(1);
}
console.log("DONE.");
