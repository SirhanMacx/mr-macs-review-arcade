#!/usr/bin/env node
// Replaces pedagogy-gibberish bank fragments with real content extracted
// from per-course Jeopardy HTML files. Each clue in a Jeopardy board
// becomes one arcade-style multiple-choice question: clue → 4 choices
// (1 correct = answer; 3 distractors drawn from other clues in the same
// unit). Distractors are sanitized to be unique strings.

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GAMES = join(root, "games");
const FRAGMENTS = join(root, "data/bank-fragments");

// Map Jeopardy course directory slug → bank fragment slug (Codex's naming)
const SLUG_MAP = {
  "ap-biology": "ap-biology",
  "ap-chemistry": "ap-chemistry",
  "ap-computer-science-principles": "ap-computer-science-principles",
  "ap-french-language": "ap-french-language-and-culture",
  "ap-music-theory": "ap-music-theory",
  "ap-spanish-language": "ap-spanish-language-and-culture",
  "ap-spanish-literature": "ap-spanish-literature-and-culture",
  "ap-calculus-ab": "ap-calculus-ab",
  "ap-calculus-bc": "ap-calculus-bc",
  "ap-statistics": "ap-statistics",
  "ap-english-language": "ap-english-language-and-composition",
  "ap-english-literature": "ap-english-literature-and-composition",
  "ap-environmental-science": "ap-environmental-science",
  "ap-physics-1": "ap-physics-1-algebra-based",
  "ap-physics-2": "ap-physics-2-algebra-based",
  "ap-physics-c-mechanics": "ap-physics-c-mechanics",
  "ap-physics-c-em": "ap-physics-c-electricity-and-magnetism",
  "ap-computer-science-a": "ap-computer-science-a",
  "ap-comparative-government": "ap-comparative-government-and-politics",
  "ap-art-history": "ap-art-history",
  "ap-latin": "ap-latin",
  "ap-german-language": "ap-german-language-and-culture",
  "ap-world-history": "ap-world-history-modern",
  "ap-european-history": "ap-european-history",
  "ap-human-geography": "ap-human-geography",
  "ap-us-government": "ap-united-states-government-and-politics",
  "ap-macroeconomics": "ap-macroeconomics",
  "ap-microeconomics": "ap-microeconomics",
  "ap-psychology": "ap-psychology",
  "apush": "ap-united-states-history",
  "global-10-units": "global-10",
  "global-9": "global-9",
  "us-history-units": "us-history",
  "civics-pig": "us-government",
  "economics": "economics",
  "grade-5": "grade-5",
  "grade-6": "grade-6",
  "grade-7": "grade-7",
  "grade-8": "grade-8",
  "grade-5-ela": "ela-5",
  "grade-6-ela": "ela-6",
  "grade-7-ela": "ela-7",
  "grade-8-ela": "ela-8",
  "grade-9-ela": "ela-9",
  "grade-10-ela": "ela-10",
  "grade-11-ela": "ela-11",
  "grade-12-ela": "ela-12",
  "grade-5-math": "mathematics-5",
  "grade-6-math": "mathematics-6",
  "grade-7-math": "mathematics-7",
  "grade-8-math": "mathematics-8",
  "grade-5-science": "science-5",
  "grade-6-science": "science-6",
  "grade-7-science": "science-7",
  "grade-8-science": "science-8",
  "living-environment": "living-environment",
  "earth-science": "earth-and-space-sciences",
  "chemistry-regents": "chemistry",
  "physics-regents": "physics",
  "algebra-1": "algebra-1",
  "algebra-2": "algebra-2",
  "geometry": "geometry",
  "precalculus": "precalculus"
};

function extractGame(text) {
  const m = text.match(/const GAME = (\{[\s\S]*?\});\s*(?:const|let|var)\s+STORAGE_KEY/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function loadCourseClues(slug) {
  const dir = join(GAMES, slug);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const clues = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".html") || f === "index.html" || f.startsWith("._")) continue;
    try {
      const text = readFileSync(join(dir, f), "utf8");
      const game = extractGame(text);
      if (!game) continue;
      const unitNum = (f.match(/^(\d+)/) || ["", ""])[1];
      const unitTitle = game.title || game.day || "";
      for (const cat of game.categories || []) {
        for (const cl of cat.clues || []) {
          if (!cl.clue || !cl.answer) continue;
          // Skip if clue or answer is template gibberish
          const t = (cl.clue + " " + (cl.explanation||"")).toLowerCase();
          if (t.includes("named anchor") || t.includes("is a core idea") ||
              t.includes("regents-style item") || t.includes("students identify") ||
              t.includes("foundational idea") || t.includes("synthesis response linking")) {
            continue;
          }
          clues.push({
            clue: cl.clue,
            answer: cl.answer,
            explanation: cl.explanation || "",
            value: cl.value,
            topic: cat.name,
            unitNum,
            unitTitle,
            aliases: cl.aliases || []
          });
        }
      }
    } catch (e) { /* skip */ }
  }
  return clues;
}

function buildFragment(slug, bankSlug, clues) {
  if (!clues.length) return null;
  // Group by topic for distractor selection
  const byTopic = new Map();
  for (const c of clues) {
    if (!byTopic.has(c.topic)) byTopic.set(c.topic, []);
    byTopic.get(c.topic).push(c);
  }
  // Reject answers that make bad distractors: empty, too short, pure-digit,
  // or duplicate the correct answer (case-insensitive). Without this filter
  // the MCQ shows things like "1 / 2 / 28 / (empty)" which looks broken
  // even when each value was a legitimate Jeopardy answer somewhere.
  const isUsableDistractor = (s, correct) => {
    if (typeof s !== "string") return false;
    const t = s.trim();
    if (!t) return false;
    if (t.length < 4) return false;
    if (/^\d{1,2}$/.test(t)) return false;
    if (t.toLowerCase() === String(correct || "").toLowerCase()) return false;
    return true;
  };
  const allAnswers = clues.map(c => c.answer);
  function distractors(correct, topic, n=3) {
    const sameTopic = (byTopic.get(topic) || []).map(c => c.answer)
      .filter(a => isUsableDistractor(a, correct));
    const others = allAnswers
      .filter(a => isUsableDistractor(a, correct) && !sameTopic.includes(a));
    // Shuffle
    function pick(arr, k) {
      const out = []; const used = new Set();
      while (out.length < k && used.size < arr.length) {
        const i = Math.floor(Math.random() * arr.length);
        if (!used.has(i)) { used.add(i); out.push(arr[i]); }
      }
      return out;
    }
    const fromSame = pick(sameTopic, Math.min(2, n));
    const remaining = n - fromSame.length;
    const fromOthers = pick(others, remaining);
    return [...fromSame, ...fromOthers].slice(0, n);
  }
  const questions = clues.map((c, idx) => {
    const dists = distractors(c.answer, c.topic, 3);
    const choices = [c.answer, ...dists];
    // Shuffle choices but track correct
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return {
      id: `${bankSlug}-${String(idx+1).padStart(3,'0')}`,
      course: bankSlug,
      courseLabel: bankSlug,
      topic: c.topic,
      domain: "Review",
      subjectArea: "Review",
      gradeBand: "Multi",
      standardRefs: [],
      sourceAuthority: "mr-macs-jeopardy",
      assessmentSourceId: `jeopardy-${slug}`,
      itemMode: "real-content-from-jeopardy",
      prompt: c.clue,
      choices,
      correctText: c.answer,
      explanation: c.explanation || `${c.answer} is correct for: ${c.clue}`
    };
  });
  return {
    course: bankSlug,
    courseLabel: bankSlug,
    generatedBy: "scripts/rebuild-bank-from-jeopardy.mjs",
    version: "20260516-real-content-from-jeopardy",
    questions
  };
}

let rebuilt = 0;
let totalQuestions = 0;
const skipped = [];
for (const [slug, bankSlug] of Object.entries(SLUG_MAP)) {
  const clues = loadCourseClues(slug);
  if (clues.length < 10) {
    skipped.push(`${slug} (only ${clues.length} clean clues)`);
    continue;
  }
  const fragment = buildFragment(slug, bankSlug, clues);
  if (!fragment) continue;
  const out = join(FRAGMENTS, `all-subject-${bankSlug}.json`);
  writeFileSync(out, JSON.stringify(fragment, null, 2));
  console.log(`wrote ${out}: ${clues.length} real questions from games/${slug}/`);
  rebuilt += 1;
  totalQuestions += clues.length;
}
console.log(`\nRebuilt ${rebuilt} bank fragments with ${totalQuestions} real questions from Jeopardy boards.`);
if (skipped.length) {
  console.log(`Skipped ${skipped.length} courses with too few clean clues:`);
  skipped.forEach(s => console.log(`  - ${s}`));
}
