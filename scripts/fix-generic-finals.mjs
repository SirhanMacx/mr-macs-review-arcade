#!/usr/bin/env node
// Replaces generic final categories (AP Concept, Historical Thinking, etc.)
// with board-specific synthesis labels derived from the board title or unit.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GAMES_ROOT = join(root, "games");

const GENERIC = new Set([
  "ap concept", "social studies skills", "historical thinking",
  "historical concepts", "political concepts", "economics concepts",
  "big picture", "final"
]);

// Per-course default synthesis-category template, used when title-derived
// label collides with the validator's generic blocklist.
const COURSE_SUFFIX = {
  "ap-psychology": "Synthesis",
  "ap-world-history": "Period Synthesis",
  "ap-european-history": "European Synthesis",
  "ap-human-geography": "Spatial Synthesis",
  "ap-us-government": "Government Synthesis",
  "ap-macroeconomics": "Macro Synthesis",
  "ap-microeconomics": "Micro Synthesis",
  "ap-economics-combined": "Econ Synthesis",
  "apush": "Period Synthesis",
  "global-9": "Era Synthesis",
  "global-10-units": "Era Synthesis",
  "us-history-units": "Era Synthesis",
  "global-regents-sprint": "Regents Synthesis",
  "us-regents-sprint": "Regents Synthesis",
  "grade-5": "Big Theme",
  "grade-6": "Big Theme",
  "grade-7": "Big Theme",
  "grade-8": "Big Theme",
  "civics-pig": "Civics Big Picture",
  "economics": "Economic Big Picture"
};

function extractGame(text) {
  const match = text.match(/const GAME = (\{[\s\S]*?\});\s*(?:const|let|var)\s+STORAGE_KEY/);
  if (!match) return null;
  return { json: match[1], game: JSON.parse(match[1]) };
}

function replaceGame(text, game) {
  return text.replace(
    /const GAME = \{[\s\S]*?\};(?=\s*(?:const|let|var)\s+STORAGE_KEY)/,
    `const GAME = ${JSON.stringify(game)};`
  );
}

function deriveFinalCategory(game, courseDir) {
  const titleParts = [];
  if (game.day && /unit|period|day/i.test(game.day)) titleParts.push(game.day);
  if (game.title) titleParts.push(game.title);
  const titleStem = (game.title || "").replace(/Review$/i, "").trim();
  const suffix = COURSE_SUFFIX[courseDir] || "Synthesis";
  // Build candidate
  let candidate = titleStem ? `${titleStem} ${suffix}` : suffix;
  candidate = candidate.replace(/\s+/g, " ").trim();
  // Fall back if still generic
  if (!candidate || GENERIC.has(candidate.toLowerCase())) {
    candidate = `${game.day || "Unit"} ${suffix}`;
  }
  return candidate;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      out.push({ dir: entry, files: walk(p) });
    } else if (entry.endsWith(".html") && entry !== "index.html" && !entry.startsWith("._")) {
      // returned via parent
    }
  }
  return out;
}

let touched = 0;
const courses = readdirSync(GAMES_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const courseDir of courses) {
  const dirPath = join(GAMES_ROOT, courseDir);
  for (const entry of readdirSync(dirPath)) {
    if (!entry.endsWith(".html") || entry === "index.html" || entry.startsWith("._")) continue;
    const file = join(dirPath, entry);
    const text = readFileSync(file, "utf8");
    const extracted = extractGame(text);
    if (!extracted) continue;
    const game = extracted.game;
    if (!game.final) continue;
    const currentCat = (game.final.category || "").trim();
    if (!currentCat || GENERIC.has(currentCat.toLowerCase())) {
      game.final.category = deriveFinalCategory(game, courseDir);
      writeFileSync(file, replaceGame(text, game));
      touched += 1;
      console.log(`fixed: ${relative(root, file)} -> ${game.final.category}`);
    }
  }
}
console.log(`Fixed generic final categories on ${touched} boards.`);
