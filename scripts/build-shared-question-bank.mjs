#!/usr/bin/env node
/**
 * Merges every JSON fragment in data/bank-fragments/ into a single
 * browser-loadable script at assets/shared-question-bank.js. The script
 * exposes `window.DIAG_BANK_BY_COURSE`, which every arcade game's
 * pickQuestion() already checks for.
 *
 * Validation:
 *   - Every question has prompt, choices (length 4), correctText, topic
 *   - correctText appears verbatim in choices
 *   - No duplicate prompts within a single course
 *   - Multi-fragment courses (global-10 split across 3 files) merge cleanly
 *
 * Usage:
 *   node scripts/build-shared-question-bank.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FRAG_DIR = path.join(ROOT, "data", "bank-fragments");
const OUT = path.join(ROOT, "assets", "shared-question-bank.js");

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "question";
}

function main() {
  const files = fs.readdirSync(FRAG_DIR)
    .filter(f => f.endsWith(".json") && !f.startsWith("._"))
    .sort();
  if (!files.length) {
    console.error("No fragment files found in", FRAG_DIR);
    process.exit(1);
  }

  const bank = Object.create(null); // course → questions[]
  const labels = Object.create(null);
  const seenPromptsPerCourse = Object.create(null);
  const reports = [];
  let badTotal = 0;
  let dupTotal = 0;

  for (const file of files) {
    const fullPath = path.join(FRAG_DIR, file);
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (e) {
      console.error(`SKIP ${file}: bad JSON — ${e.message}`);
      continue;
    }
    if (!raw.course || !Array.isArray(raw.questions)) {
      console.error(`SKIP ${file}: missing course or questions`);
      continue;
    }
    const course = raw.course;
    if (!bank[course]) bank[course] = [];
    if (!seenPromptsPerCourse[course]) seenPromptsPerCourse[course] = new Set();
    if (raw.courseLabel && !labels[course]) labels[course] = raw.courseLabel;

    let added = 0, bad = 0, dups = 0;
    for (const q of raw.questions) {
      if (!q || typeof q !== "object") { bad++; continue; }
      if (!q.prompt || !q.correctText || !Array.isArray(q.choices)) { bad++; continue; }
      if (q.choices.length !== 4) { bad++; continue; }
      if (!q.choices.includes(q.correctText)) { bad++; continue; }
      // Reject broken-distractor patterns the user has caught in screenshots:
      // empty option, choice < 4 chars (looks like a typo), more than one pure
      // 1-2 digit choice (the "Dispersion / Caravan / / 28" pattern), or any
      // remaining Codex template phrase that slipped through fragment cleanup.
      const choiceStrings = q.choices.map(c => (typeof c === "string" ? c.trim() : ""));
      if (choiceStrings.some(c => !c)) { bad++; continue; }
      if (choiceStrings.some(c => c.length < 3)) { bad++; continue; }
      const numericChoices = choiceStrings.filter(c => /^-?\d{1,2}$/.test(c)).length;
      if (numericChoices > 1 && q.correctText && !/^-?\d{1,2}$/.test(String(q.correctText).trim())) { bad++; continue; }
      const templatePhrases = [
        "Specific evidence that proves a claim",
        "ignoring the source or data in the prompt",
        "describing a topic without explaining why it matters",
        "choosing an answer because it uses familiar words",
        "A fact from a different course",
        "In an AP CED-aligned exam task",
        "In a NYS Framework-aligned exam task",
        "which concept is the best anchor for a NYS standards-aligned",
        "best avoids a common mistake about",
      ];
      const promptText = String(q.prompt || "");
      const correctTextStr = String(q.correctText || "");
      if (templatePhrases.some(p => promptText.includes(p) || correctTextStr.includes(p) ||
                                    choiceStrings.some(c => c.includes(p)))) { bad++; continue; }
      // Dedup within course by prompt
      const key = q.prompt.trim().toLowerCase();
      if (seenPromptsPerCourse[course].has(key)) { dups++; continue; }
      seenPromptsPerCourse[course].add(key);
      // Normalize shape
      bank[course].push({
        id: q.id ? String(q.id).trim() : `${course}-${slug(q.prompt)}`,
        prompt: String(q.prompt).trim(),
        choices: q.choices.map(c => String(c).trim()),
        correctText: String(q.correctText).trim(),
        topic: q.topic ? String(q.topic).trim() : "General",
        explanation: q.explanation ? String(q.explanation).trim() : "",
        domain: q.domain ? String(q.domain).trim() : "",
        gradeBand: q.gradeBand ? String(q.gradeBand).trim() : "",
        subjectArea: q.subjectArea ? String(q.subjectArea).trim() : "",
        standardRefs: Array.isArray(q.standardRefs) ? q.standardRefs.map(ref => String(ref).trim()).filter(Boolean) : [],
        sourceAuthority: q.sourceAuthority ? String(q.sourceAuthority).trim() : "",
        assessmentSourceId: q.assessmentSourceId ? String(q.assessmentSourceId).trim() : "",
        itemMode: q.itemMode ? String(q.itemMode).trim() : "",
        course
      });
      added++;
    }
    badTotal += bad;
    dupTotal += dups;
    reports.push({ file, course, added, bad, dups });
  }

  // Sort courses for deterministic output, and questions within each course by topic then prompt
  const sortedCourses = Object.keys(bank).sort();
  const orderedBank = {};
  for (const c of sortedCourses) {
    orderedBank[c] = bank[c].slice().sort((a, b) => {
      if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
      return a.prompt.localeCompare(b.prompt);
    });
  }

  // Emit script
  const header = `/* ============================================================================
   Mr. Mac's Review Arcade — Shared Question Bank
   Auto-generated by scripts/build-shared-question-bank.mjs

   Exposes \`window.DIAG_BANK_BY_COURSE\` as an object of course-id → questions[].
   Every question shape:
     { prompt, choices[4], correctText (∈ choices), topic, course }

   Games read this object via:
     var bank = window.DIAG_BANK_BY_COURSE;
     if (bank && typeof bank === "object") { ... }

   Course labels: window.DIAG_BANK_COURSE_LABELS = { courseId: humanLabel }

   Built: ${new Date().toISOString()}
   Courses: ${sortedCourses.length}
   Total questions: ${sortedCourses.reduce((s, c) => s + orderedBank[c].length, 0)}
   ============================================================================ */
`;

  const body = `(function (w) {
  "use strict";
  w.DIAG_BANK_COURSE_LABELS = ${JSON.stringify(labels, null, 2)};
  w.DIAG_BANK_BY_COURSE = ${JSON.stringify(orderedBank, null, 2)};
  // Runtime self-clean: drop any question that doesn't pass the same
  // structural checks the build applied. Protects against stale service-worker
  // caches serving an older shared-question-bank.js — even on a stale cache
  // the bad questions are filtered before any arcade game sees them.
  (function selfClean() {
    var bank = w.DIAG_BANK_BY_COURSE || {};
    var TEMPLATE_NEEDLES = [
      "Specific evidence that proves a claim",
      "ignoring the source or data in the prompt",
      "describing a topic without explaining why it matters",
      "choosing an answer because it uses familiar words",
      "In an AP CED-aligned exam task",
      "In a NYS Framework-aligned exam task",
      "which concept is the best anchor for a NYS standards-aligned",
      "best avoids a common mistake about"
    ];
    function isValid(q) {
      if (!q || typeof q !== "object") return false;
      if (!q.prompt || !q.correctText || !Array.isArray(q.choices)) return false;
      if (q.choices.length !== 4) return false;
      if (q.choices.indexOf(q.correctText) === -1) return false;
      var strs = q.choices.map(function (c) { return typeof c === "string" ? c.trim() : ""; });
      if (strs.some(function (s) { return !s || s.length < 3; })) return false;
      var numericChoices = strs.filter(function (s) { return /^-?\\d{1,2}$/.test(s); }).length;
      var correctIsNumeric = /^-?\\d{1,2}$/.test(String(q.correctText).trim());
      if (numericChoices > 1 && !correctIsNumeric) return false;
      var blob = (q.prompt || "") + " " + (q.correctText || "") + " " + strs.join(" ");
      for (var i = 0; i < TEMPLATE_NEEDLES.length; i++) {
        if (blob.indexOf(TEMPLATE_NEEDLES[i]) !== -1) return false;
      }
      return true;
    }
    var droppedCount = 0;
    for (var course in bank) {
      if (!Object.prototype.hasOwnProperty.call(bank, course)) continue;
      var rows = bank[course] || [];
      var clean = [];
      for (var i = 0; i < rows.length; i++) {
        if (isValid(rows[i])) clean.push(rows[i]);
        else droppedCount += 1;
      }
      bank[course] = clean;
    }
    if (droppedCount > 0 && w.console && w.console.warn) {
      w.console.warn("[shared-bank] runtime self-clean dropped " + droppedCount + " malformed questions (stale cache likely)");
    }
  })();
  // Convenience: flat pool of ALL questions, used by games that want
  // a deep universal pool without course filtering.
  w.DIAG_BANK_ALL = [];
  for (var c in w.DIAG_BANK_BY_COURSE) {
    if (Object.prototype.hasOwnProperty.call(w.DIAG_BANK_BY_COURSE, c)) {
      w.DIAG_BANK_ALL = w.DIAG_BANK_ALL.concat(w.DIAG_BANK_BY_COURSE[c]);
    }
  }
  function balancedGeneralPool(bank) {
    var groups = {};
    Object.keys(bank).forEach(function (courseId) {
      var rows = bank[courseId] || [];
      rows.forEach(function (q) {
        var key = q.subjectArea || q.domain || courseId;
        if (!groups[key]) groups[key] = [];
        groups[key].push(q);
      });
    });
    var keys = Object.keys(groups).sort();
    var out = [];
    var index = 0;
    var added = true;
    while (added) {
      added = false;
      keys.forEach(function (key) {
        if (groups[key][index]) {
          out.push(groups[key][index]);
          added = true;
        }
      });
      index += 1;
    }
    return out;
  }
  w.DIAG_BANK_GENERAL_TRIVIA = balancedGeneralPool(w.DIAG_BANK_BY_COURSE);
  w.DIAG_BANK_AP_COURSES = Object.keys(w.DIAG_BANK_BY_COURSE)
    .filter(function (courseId) { return courseId.indexOf("ap-") === 0; })
    .sort();
  w.DIAG_BANK_CORE_5_12_COURSES = Object.keys(w.DIAG_BANK_BY_COURSE)
    .filter(function (courseId) {
      return /^(ela|english|math|science)-|^(algebra|geometry|precalculus|calculus|statistics|earth-science|biology|chemistry|physics|environmental-science|computer-science|health|physical-education|visual-arts|music|world-languages|career-readiness|personal-finance|media-literacy)$/.test(courseId);
    })
    .sort();
  w.DIAG_BANK_COVERAGE = {
    courses: Object.keys(w.DIAG_BANK_BY_COURSE).length,
    questions: w.DIAG_BANK_ALL.length,
    apCourses: w.DIAG_BANK_AP_COURSES.length,
    coreGeneralCourses: w.DIAG_BANK_CORE_5_12_COURSES.length
  };
})(typeof window !== "undefined" ? window : globalThis);
`;
  fs.writeFileSync(OUT, header + body, "utf8");

  // Summary
  console.log("─".repeat(72));
  console.log("Bank merge summary");
  console.log("─".repeat(72));
  for (const r of reports) {
    console.log(`  ${r.file.padEnd(44)} → ${r.course.padEnd(20)} +${r.added.toString().padStart(3)} added · ${r.bad} bad · ${r.dups} dups`);
  }
  console.log("─".repeat(72));
  for (const c of sortedCourses) {
    console.log(`  ${c.padEnd(28)} ${labels[c] || "(no label)"}`.padEnd(60) + ` · ${orderedBank[c].length} questions`);
  }
  const totalQ = sortedCourses.reduce((s, c) => s + orderedBank[c].length, 0);
  console.log("─".repeat(72));
  console.log(`  TOTAL: ${totalQ} questions across ${sortedCourses.length} courses · ${badTotal} dropped (bad) · ${dupTotal} dropped (dup)`);
  console.log(`  Output: ${OUT}`);
}

main();
