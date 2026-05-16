#!/usr/bin/env node
// Fixes Jeopardy categories where rebuild left duplicate values
// (e.g. 100, 300, 300, 400, 500). Renumbers in order so each category
// is exactly [100, 200, 300, 400, 500] without duplicates.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GAMES_ROOT = join(root, "games");
const TARGET_VALUES = [100, 200, 300, 400, 500];
const VALUE_SKILLS = {
  100: "identify key content",
  200: "match content to unit context",
  300: "explain cause, effect, or turning point",
  400: "connect evidence to a larger context",
  500: "synthesize a high-value exam pattern"
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

function dedupeByAnswer(clues) {
  const seen = new Map();
  const result = [];
  for (const c of clues) {
    const key = String(c.answer || "").toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.set(key, true);
      result.push(c);
    }
  }
  return result;
}

function fixCategory(category) {
  if (!Array.isArray(category.clues)) return false;
  const values = category.clues.map((c) => Number(c.value));
  const ok = values.length === 5 && TARGET_VALUES.every((v, i) => v === values[i]);
  if (ok) return false;
  // Dedupe by answer
  let clues = dedupeByAnswer(category.clues);
  // Sort by current value
  clues.sort((a, b) => Number(a.value) - Number(b.value));
  // Pad/trim to 5
  while (clues.length < 5) {
    const last = clues[clues.length - 1] || category.clues[0];
    clues.push(JSON.parse(JSON.stringify(last)));
  }
  clues = clues.slice(0, 5);
  // Renumber 100..500
  for (let i = 0; i < clues.length; i += 1) {
    const value = TARGET_VALUES[i];
    clues[i].value = value;
    if (clues[i].rigor) {
      clues[i].rigor.value = value;
      clues[i].rigor.skill = VALUE_SKILLS[value] || clues[i].rigor.skill;
    }
  }
  category.clues = clues;
  return true;
}

function fixGame(game) {
  let changed = false;
  for (const category of game.categories || []) {
    if (fixCategory(category)) changed = true;
  }
  return changed;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      out.push(...walk(p));
    } else if (entry.endsWith(".html") && entry !== "index.html" && !entry.startsWith("._")) {
      out.push(p);
    }
  }
  return out;
}

let touched = 0;
let scanned = 0;
for (const file of walk(GAMES_ROOT)) {
  const text = readFileSync(file, "utf8");
  const extracted = extractGame(text);
  if (!extracted) continue;
  scanned += 1;
  if (fixGame(extracted.game)) {
    writeFileSync(file, replaceGame(text, extracted.game));
    touched += 1;
    console.log("fixed:", relative(root, file));
  }
}
console.log(`Scanned ${scanned} boards; fixed scrambled categories on ${touched}.`);
