#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNIT_REVIEW_TYPES = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final", "Regents Sprint"]);

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

function slug(value) {
  return normalize(value).replace(/\s+/g, "-");
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

function bankId(meta) {
  return slug(decodePath(String(meta.file || meta.title || "")).replace(/^games\//, ""));
}

function cleanClue(clue) {
  const output = {
    value: Number(clue.value),
    clue: String(clue.clue || ""),
    answer: String(clue.answer || ""),
    aliases: Array.isArray(clue.aliases) ? clue.aliases : [],
    explanation: String(clue.explanation || "")
  };
  if (clue.daily) output.daily = true;
  return output;
}

function cleanFinal(final) {
  return {
    category: String(final?.category || "Final"),
    clue: String(final?.clue || ""),
    answer: String(final?.answer || ""),
    aliases: Array.isArray(final?.aliases) ? final.aliases : [],
    explanation: String(final?.explanation || ""),
    value: 700
  };
}

function buildSearch(question) {
  return [
    question.course,
    question.subject,
    question.set,
    question.category,
    question.prompt,
    question.answer,
    question.explanation,
    ...(question.tags || [])
  ].map(normalize).filter(Boolean).join(" ");
}

function clueKey(course, title, category, value, answer) {
  return [course, title, category, Number(value), answer].map(normalize).join("|");
}

function finalKey(course, title, answer) {
  return [course, title, "final", 700, answer].map(normalize).join("|");
}

function collectJeopardyBoards() {
  const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
  const boards = [];
  const clueIndex = new Map();
  const finalIndex = new Map();
  const finalIdIndex = new Map();
  for (const meta of games.filter(isJeopardyManifestEntry)) {
    const file = resolve(root, decodePath(meta.file));
    if (!existsSync(file)) throw new Error(`Missing board file: ${meta.file}`);
    const game = extractGame(readFileSync(file, "utf8"), relative(root, file));
    const courseOptions = [meta.course, game.exam, game.course].filter(Boolean);
    const bank = {
      id: bankId(meta),
      slug: game.slug || "",
      title: game.title || meta.title,
      subtitle: game.subtitle || meta.subtitle || "",
      day: game.day || meta.day || "",
      course: meta.course || game.exam || game.course || "Social Studies",
      subject: meta.subject || "",
      grade: meta.grade || "",
      gameType: meta.gameType || "",
      collection: meta.collection || "",
      categories: (game.categories || []).map((category) => ({
        name: category.name || "Review",
        clues: (category.clues || []).map(cleanClue)
      })),
      final: cleanFinal(game.final)
    };
    boards.push(bank);
    for (const category of bank.categories) {
      for (const clue of category.clues) {
        for (const course of courseOptions) {
          clueIndex.set(clueKey(course, bank.title, category.name, clue.value, clue.answer), clue);
        }
        clueIndex.set(clueKey("", bank.title, category.name, clue.value, clue.answer), clue);
      }
    }
    for (const course of courseOptions) {
      finalIndex.set(finalKey(course, bank.title, bank.final.answer), bank.final);
    }
    finalIndex.set(finalKey("", bank.title, bank.final.answer), bank.final);
    if (bank.slug) finalIdIndex.set(`jeopardy-${bank.slug}-final`, bank.final);
    finalIdIndex.set(`jeopardy-${bank.id}-final`, bank.final);
  }
  return { boards, clueIndex, finalIndex, finalIdIndex };
}

function syncChronoBank(clueIndex, finalIndex, finalIdIndex) {
  const file = resolve(root, "data", "chrono-defense-bank.json");
  const bank = JSON.parse(readFileSync(file, "utf8"));
  let updated = 0;
  for (const question of bank.questions || []) {
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
    const index = isFinal ? finalIndex : clueIndex;
    const source = (isFinal && question.id ? finalIdIndex.get(question.id) : null) || keys.map((key) => index.get(key)).find(Boolean);
    if (!source) continue;
    if (question.prompt !== source.clue || question.explanation !== source.explanation || question.category !== source.category) updated += 1;
    if (isFinal) question.category = source.category;
    question.prompt = source.clue;
    question.answer = source.answer;
    question.aliases = source.aliases;
    question.explanation = source.explanation;
    question.search = buildSearch(question);
  }
  writeFileSync(file, `${JSON.stringify(bank, null, 2)}\n`);
  return updated;
}

function syncBossRush(boards) {
  const file = resolve(root, "games", "boss-rush", "index.html");
  const html = readFileSync(file, "utf8");
  const bankPattern = /const BANKS = \[[\s\S]*?\];(?=\r?\nconst LENGTHS\s*=)/;
  if (!bankPattern.test(html)) throw new Error("Could not locate Boss Rush BANKS data");
  const next = html.replace(bankPattern, `const BANKS = ${JSON.stringify(boards)};`);
  writeFileSync(file, next);
}

function main() {
  const { boards, clueIndex, finalIndex, finalIdIndex } = collectJeopardyBoards();
  const bankUpdates = syncChronoBank(clueIndex, finalIndex, finalIdIndex);
  syncBossRush(boards);
  console.log(`Synced ${boards.length} Jeopardy boards into Boss Rush and refreshed ${bankUpdates} shared-bank prompts.`);
}

main();
