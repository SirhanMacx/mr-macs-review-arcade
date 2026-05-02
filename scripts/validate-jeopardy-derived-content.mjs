#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNIT_REVIEW_TYPES = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final", "Regents Sprint"]);
const errors = [];

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isJeopardyManifestEntry(game) {
  const text = [game.title, game.originalFile, game.file, game.gameType].join(" ").toLowerCase();
  return text.includes("jeopardy") || text.includes("unit review") || UNIT_REVIEW_TYPES.has(game.gameType);
}

function extractGame(text, file) {
  const match = text.match(/const GAME = (\{[\s\S]*?\});\s*(?:const|let|var)\s+STORAGE_KEY/);
  if (!match) throw new Error(`Could not find GAME JSON in ${file}`);
  return JSON.parse(match[1]);
}

function clueKey(course, title, category, value, answer) {
  return [course, title, category, Number(value), answer].map(normalize).join("|");
}

function finalKey(course, title, answer) {
  return [course, title, "final", 700, answer].map(normalize).join("|");
}

const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
const clueIndex = new Map();
const clueIdIndex = new Map();
const finalIndex = new Map();
const finalIdIndex = new Map();
let boardCount = 0;

for (const meta of games.filter(isJeopardyManifestEntry)) {
  const file = resolve(root, decodePath(meta.file));
  if (!existsSync(file)) {
    errors.push(`Missing board file ${meta.file}`);
    continue;
  }
  const game = extractGame(readFileSync(file, "utf8"), meta.file);
  const title = game.title || meta.title;
  const courses = [meta.course, game.exam, game.course, ""].filter((value, index, arr) => arr.indexOf(value) === index);
  for (const category of game.categories || []) {
    for (const clue of category.clues || []) {
      const indexedClue = { ...clue, category: category.name };
      for (const course of courses) {
        clueIndex.set(clueKey(course, title, category.name, clue.value, clue.answer), indexedClue);
      }
      if (game.slug) clueIdIndex.set(`jeopardy-${game.slug}-${normalize(category.name).replace(/\s+/g, "-")}-${Number(clue.value)}`, indexedClue);
    }
  }
  if (game.final?.answer) {
    for (const course of courses) {
      finalIndex.set(finalKey(course, title, game.final.answer), game.final);
    }
    if (game.slug) finalIdIndex.set(`jeopardy-${game.slug}-final`, game.final);
  }
  boardCount += 1;
}

const chrono = JSON.parse(readFileSync(resolve(root, "data/chrono-defense-bank.json"), "utf8"));
let checked = 0;

for (const question of chrono.questions || []) {
  if (!String(question.type || "").startsWith("jeopardy")) continue;
  const isFinal = String(question.type || "") === "jeopardy-final" || Number(question.value) === 700;
  const keys = isFinal ? [
    finalKey(question.course, question.set, question.answer),
    finalKey(question.subject, question.set, question.answer),
    finalKey("", question.set, question.answer)
  ] : [
    clueKey(question.course, question.set, question.category, question.value, question.answer),
    clueKey(question.subject, question.set, question.category, question.value, question.answer),
    clueKey("", question.set, question.category, question.value, question.answer)
  ];
  const source = (isFinal && question.id ? finalIdIndex.get(question.id) : null) ||
    (!isFinal && question.id ? clueIdIndex.get(question.id) : null) ||
    keys.map((key) => (isFinal ? finalIndex : clueIndex).get(key)).find(Boolean);
  if (!source) {
    errors.push(`${question.id || question.set}: no source board match for ${isFinal ? "final" : "regular"} Jeopardy item`);
    continue;
  }
  if (question.prompt !== source.clue) errors.push(`${question.id || question.set}: stale prompt`);
  if (question.explanation !== source.explanation) errors.push(`${question.id || question.set}: stale explanation`);
  if (source.category && question.category !== source.category) errors.push(`${question.id || question.set}: stale category`);
  checked += 1;
}

if (errors.length) {
  console.error(`Jeopardy derived-content validation failed (${errors.length} issues):`);
  errors.slice(0, 120).forEach((error) => console.error("-", error));
  if (errors.length > 120) console.error(`...and ${errors.length - 120} more`);
  process.exit(1);
}

console.log(`Jeopardy derived-content validation OK: ${boardCount} boards, ${checked} derived items.`);
