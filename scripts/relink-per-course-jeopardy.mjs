#!/usr/bin/env node
/**
 * relink-per-course-jeopardy.mjs
 *
 * Purpose: Fix the UI regression where new courses (algebra-1, ap-biology,
 * precalculus, etc.) had hand-crafted per-course Jeopardy HTML files built
 * AND a duplicate generated-jeopardy-runner entry, causing two tiles per
 * unit on the hub - one routing to the rich gold-standard template, the
 * other to the stripped 687-line generic runner.
 *
 * Strategy:
 *   1. For each course directory under games/<course>/ that contains
 *      "NN - Title Jeopardy Review.html" files, record the per-course
 *      Jeopardy HTML manifest entries and their unit numbers.
 *   2. For each generated-jeopardy manifest entry whose generatedBoardId is
 *      "<course>-unit-<NN>" (Review variant only, NOT challenge/sprint),
 *      check if a per-course HTML exists for that unit.
 *      - If yes: REMOVE the duplicate generated manifest entry. Stamp the
 *        per-course entry with generatedBoardId = "<course>-unit-<NN>" so
 *        the runtime generatedJeopardyGames() dedup filter in index.html
 *        (line 10493) also hides the runtime-generated Review tile.
 *      - If no: leave the generated entry alone (no per-course replacement
 *        available).
 *   3. Keep Challenge ("-challenge") and Sprint ("-sprint") variants -
 *      these are additional generated review modes with different content,
 *      not duplicates of the per-course Review board.
 *
 * Output:
 *   - games.json rewritten in place with the fixes applied.
 *   - Prints a summary of relinked + removed entries.
 *
 * Idempotent: re-running detects already-stamped entries and is a no-op.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestFile = resolve(root, "games.json");

if (!existsSync(manifestFile)) {
  console.error("games.json not found at", manifestFile);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));

// Step 1: Build a map of course -> unit number -> per-course manifest entry.
const perCourseByUnit = new Map();

function recordPerCourseEntry(entry) {
  const file = entry.file || "";
  const match = file.match(/^games\/([^/]+)\/(\d{2})\s+-\s+.+Jeopardy Review\.html$/);
  if (!match) return;
  const courseId = match[1];
  const unitNumber = match[2];
  if (!perCourseByUnit.has(courseId)) perCourseByUnit.set(courseId, new Map());
  perCourseByUnit.get(courseId).set(unitNumber, entry);
}

for (const entry of manifest) {
  if (!entry || typeof entry !== "object") continue;
  recordPerCourseEntry(entry);
}

// Step 2: Walk the manifest and decide what to remove + what to stamp.
const removedEntries = [];
const stampedEntries = [];
const survivors = [];

const reviewVariantRe = /^generated-jeopardy-([a-z0-9-]+)-unit-(\d{2})$/;

for (const entry of manifest) {
  if (!entry || typeof entry !== "object") {
    survivors.push(entry);
    continue;
  }
  const id = String(entry.id || "");
  const match = id.match(reviewVariantRe);
  if (!match) {
    survivors.push(entry);
    continue;
  }
  const [, courseId, unitNumber] = match;
  const perCourse = perCourseByUnit.get(courseId)?.get(unitNumber);
  if (!perCourse) {
    // No per-course replacement -> keep generated entry as-is.
    survivors.push(entry);
    continue;
  }
  // Duplicate found -> drop the generated entry.
  removedEntries.push({ id, file: entry.file, replacedBy: perCourse.id, perCourseFile: perCourse.file });
}

// Step 3: Stamp surviving per-course entries with generatedBoardId so the
// runtime dedup filter in index.html (line 10493) also hides the runtime
// Review variant.
for (const entry of survivors) {
  if (!entry || typeof entry !== "object") continue;
  const file = entry.file || "";
  const match = file.match(/^games\/([^/]+)\/(\d{2})\s+-\s+.+Jeopardy Review\.html$/);
  if (!match) continue;
  const courseId = match[1];
  const unitNumber = match[2];
  const generatedBoardId = `${courseId}-unit-${unitNumber}`;
  if (entry.generatedBoardId === generatedBoardId) continue;
  if (entry.generatedBoardId && entry.generatedBoardId !== generatedBoardId) continue;
  entry.generatedBoardId = generatedBoardId;
  stampedEntries.push({ id: entry.id, generatedBoardId });
}

// Step 4: Persist. Match the existing file's non-ASCII convention so the
// diff stays focused on intent. If the current file uses \uXXXX escapes,
// preserve them; if it uses raw UTF-8 (Codex's preferred format), pass
// through Node's default JSON.stringify output.
const existingRaw = readFileSync(manifestFile, "utf8");
const useEscaped = /\\u00[a-f0-9]{2}/.test(existingRaw);
function escapeNonAscii(json) {
  let out = "";
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    if (code >= 0x7f) {
      out += "\\u" + code.toString(16).padStart(4, "0");
    } else {
      out += json[i];
    }
  }
  return out;
}
const stringified = JSON.stringify(survivors, null, 2);
const json = useEscaped ? escapeNonAscii(stringified) : stringified;
writeFileSync(manifestFile, json + "\n", "utf8");

console.log("relink-per-course-jeopardy summary:");
console.log(`  manifest entries before: ${manifest.length}`);
console.log(`  manifest entries after : ${survivors.length}`);
console.log(`  generated duplicates removed: ${removedEntries.length}`);
console.log(`  per-course entries stamped : ${stampedEntries.length}`);
if (removedEntries.length) {
  const byCourse = new Map();
  for (const r of removedEntries) {
    const c = r.id.replace(/^generated-jeopardy-/, "").replace(/-unit-\d{2}$/, "");
    byCourse.set(c, (byCourse.get(c) || 0) + 1);
  }
  console.log("  removals by course:");
  for (const [c, n] of Array.from(byCourse).sort()) {
    console.log(`    ${c}: ${n}`);
  }
}
