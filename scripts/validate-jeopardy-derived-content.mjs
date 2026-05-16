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
  if (game.generatedBy === "scripts/generate-all-subject-content.mjs") return false;
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

function answerKey(course, title, answer) {
  return [course, title, answer].map(normalize).join("|");
}

function uniqueList(values) {
  const seen = new Set();
  const output = [];
  for (const value of values.map((item) => String(item || "").trim()).filter(Boolean)) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }
  return output;
}

function buildTags(question, source, isFinal) {
  return uniqueList([
    question.day,
    question.set,
    source.category,
    isFinal ? "Final Wager" : `${Number(question.value)} points`,
    source.answer,
    question.source
  ]);
}

function categoryNames(category) {
  return [category.name]
    .map((value) => String(value || "").trim())
    .filter((value, index, arr) => value && arr.indexOf(value) === index);
}

const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
const clueIndex = new Map();
const clueIdIndex = new Map();
const clueAnswerIndex = new Map();
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
      const indexedClue = {
        ...clue,
        category: category.name,
        id: game.slug ? `jeopardy-${game.slug}-${normalize(category.name).replace(/\s+/g, "-")}-${Number(clue.value)}` : ""
      };
      for (const course of courses) {
        clueAnswerIndex.set(answerKey(course, title, clue.answer), indexedClue);
      }
      if (game.slug) clueAnswerIndex.set(answerKey("", game.slug, clue.answer), indexedClue);
      for (const categoryName of categoryNames(category)) {
        for (const course of courses) {
          clueIndex.set(clueKey(course, title, categoryName, clue.value, clue.answer), indexedClue);
        }
        if (game.slug) clueIdIndex.set(`jeopardy-${game.slug}-${normalize(categoryName).replace(/\s+/g, "-")}-${Number(clue.value)}`, indexedClue);
      }
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
const idOwners = new Map();
const typeCounts = {};

for (const question of chrono.questions || []) {
  const type = question.type || "unknown";
  typeCounts[type] = (typeCounts[type] || 0) + 1;
  if (question.id) {
    if (idOwners.has(question.id)) errors.push(`${question.id}: duplicate question id also used by ${idOwners.get(question.id)}`);
    else idOwners.set(question.id, `${question.course || ""} / ${question.set || ""}`);
  }
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
    keys.map((key) => (isFinal ? finalIndex : clueIndex).get(key)).find(Boolean) ||
    (!isFinal ? [
      answerKey(question.course, question.set, question.answer),
      answerKey(question.subject, question.set, question.answer),
      answerKey("", question.set, question.answer)
    ].map((key) => clueAnswerIndex.get(key)).find(Boolean) : null);
  if (!source) {
    errors.push(`${question.id || question.set}: no source board match for ${isFinal ? "final" : "regular"} Jeopardy item`);
    continue;
  }
  if (question.prompt !== source.clue) errors.push(`${question.id || question.set}: stale prompt`);
  if (question.explanation !== source.explanation) errors.push(`${question.id || question.set}: stale explanation`);
  if (source.category && question.category !== source.category) errors.push(`${question.id || question.set}: stale category`);
  if (!isFinal && Number(question.value) !== Number(source.value)) errors.push(`${question.id || question.set}: stale value`);
  if (!isFinal && source.id && question.id !== source.id) errors.push(`${question.id || question.set}: stale id`);
  const expectedTags = buildTags(question, source, isFinal);
  if (JSON.stringify(question.tags || []) !== JSON.stringify(expectedTags)) errors.push(`${question.id || question.set}: stale tags`);
  checked += 1;
}

const expectedSummary = {
  totalQuestions: (chrono.questions || []).length,
  courses: new Set((chrono.questions || []).map((question) => question.course).filter(Boolean)).size,
  jeopardy: (typeCounts.jeopardy || 0) + (typeCounts["jeopardy-final"] || 0),
  mcq: typeCounts.mcq || 0
};
for (const [field, expected] of Object.entries(expectedSummary)) {
  if (Number(chrono.summary?.[field] || 0) !== expected) {
    errors.push(`data/chrono-defense-bank.json: summary.${field} is ${chrono.summary?.[field] || 0}, expected ${expected}`);
  }
}

if (errors.length) {
  console.error(`Jeopardy derived-content validation failed (${errors.length} issues):`);
  errors.slice(0, 120).forEach((error) => console.error("-", error));
  if (errors.length > 120) console.error(`...and ${errors.length - 120} more`);
  process.exit(1);
}

console.log(`Jeopardy derived-content validation OK: ${boardCount} boards, ${checked} derived items.`);
