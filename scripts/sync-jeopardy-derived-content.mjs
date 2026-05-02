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

function categoryNames(category) {
  return [category.name]
    .map((value) => String(value || "").trim())
    .filter((value, index, arr) => value && arr.indexOf(value) === index);
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
    isFinal ? "Final Wager" : `${Number(source.value || question.value)} points`,
    source.answer,
    question.source
  ]);
}

function updateSummary(bank) {
  const questions = bank.questions || [];
  const typeCounts = questions.reduce((counts, question) => {
    const type = question.type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
  bank.summary = {
    ...(bank.summary || {}),
    totalQuestions: questions.length,
    courses: new Set(questions.map((question) => question.course).filter(Boolean)).size,
    jeopardy: (typeCounts.jeopardy || 0) + (typeCounts["jeopardy-final"] || 0),
    mcq: typeCounts.mcq || 0,
    generatedAt: new Date().toISOString()
  };
  bank.courses = [...new Set(questions.map((question) => question.course).filter(Boolean))].sort();
  const setsByCourse = {};
  for (const question of questions) {
    if (!question.course || !question.set) continue;
    if (!setsByCourse[question.course]) setsByCourse[question.course] = [];
    if (!setsByCourse[question.course].includes(question.set)) setsByCourse[question.course].push(question.set);
  }
  for (const sets of Object.values(setsByCourse)) sets.sort();
  bank.setsByCourse = setsByCourse;
}

function dedupeQuestions(bank) {
  const seen = new Map();
  const next = [];
  let removed = 0;
  for (const question of bank.questions || []) {
    if (!question.id) {
      next.push(question);
      continue;
    }
    const previous = seen.get(question.id);
    if (!previous) {
      seen.set(question.id, question);
      next.push(question);
      continue;
    }
    const samePayload = [
      "type",
      "course",
      "set",
      "category",
      "value",
      "prompt",
      "answer",
      "explanation"
    ].every((field) => JSON.stringify(previous[field] || "") === JSON.stringify(question[field] || ""));
    if (!samePayload) {
      throw new Error(`Duplicate Jeopardy-derived id has conflicting content: ${question.id}`);
    }
    removed += 1;
  }
  bank.questions = next;
  return removed;
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

function collectJeopardyBoards() {
  const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
  const boards = [];
  const clueIndex = new Map();
  const clueIdIndex = new Map();
  const clueAnswerIndex = new Map();
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
        const indexedClue = {
          ...clue,
          category: category.name,
          id: bank.slug ? `jeopardy-${bank.slug}-${slug(category.name)}-${Number(clue.value)}` : `jeopardy-${bank.id}-${slug(category.name)}-${Number(clue.value)}`
        };
        for (const course of courseOptions) {
          clueAnswerIndex.set(answerKey(course, bank.title, clue.answer), indexedClue);
        }
        clueAnswerIndex.set(answerKey("", bank.title, clue.answer), indexedClue);
        if (bank.slug) clueAnswerIndex.set(answerKey("", bank.slug, clue.answer), indexedClue);
        for (const categoryName of categoryNames(category)) {
          for (const course of courseOptions) {
            clueIndex.set(clueKey(course, bank.title, categoryName, clue.value, clue.answer), indexedClue);
          }
          clueIndex.set(clueKey("", bank.title, categoryName, clue.value, clue.answer), indexedClue);
          if (bank.slug) clueIdIndex.set(`jeopardy-${bank.slug}-${slug(categoryName)}-${Number(clue.value)}`, indexedClue);
          clueIdIndex.set(`jeopardy-${bank.id}-${slug(categoryName)}-${Number(clue.value)}`, indexedClue);
        }
      }
    }
    for (const course of courseOptions) {
      finalIndex.set(finalKey(course, bank.title, bank.final.answer), bank.final);
    }
    finalIndex.set(finalKey("", bank.title, bank.final.answer), bank.final);
    if (bank.slug) finalIdIndex.set(`jeopardy-${bank.slug}-final`, bank.final);
    finalIdIndex.set(`jeopardy-${bank.id}-final`, bank.final);
  }
  return { boards, clueIndex, clueIdIndex, clueAnswerIndex, finalIndex, finalIdIndex };
}

function syncChronoBank(clueIndex, clueIdIndex, clueAnswerIndex, finalIndex, finalIdIndex) {
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
    const source = (isFinal && question.id ? finalIdIndex.get(question.id) : null) ||
      (!isFinal && question.id ? clueIdIndex.get(question.id) : null) ||
      keys.map((key) => index.get(key)).find(Boolean) ||
      (!isFinal ? [
        answerKey(question.course, question.set, question.answer),
        answerKey(question.subject, question.set, question.answer),
        answerKey("", question.set, question.answer)
      ].map((key) => clueAnswerIndex.get(key)).find(Boolean) : null);
    if (!source) {
      throw new Error(`No source board match for ${question.id || `${question.course} ${question.set} ${question.answer}`}`);
    }
    const nextTags = buildTags(question, source, isFinal);
    if (
      question.prompt !== source.clue ||
      question.explanation !== source.explanation ||
      question.category !== source.category ||
      Number(question.value) !== Number(source.value || question.value) ||
      (!isFinal && source.id && question.id !== source.id) ||
      JSON.stringify(question.tags || []) !== JSON.stringify(nextTags)
    ) updated += 1;
    if (source.category) question.category = source.category;
    if (!isFinal && source.value) question.value = Number(source.value);
    if (!isFinal && source.id) question.id = source.id;
    question.prompt = source.clue;
    question.answer = source.answer;
    question.aliases = source.aliases;
    question.explanation = source.explanation;
    question.tags = nextTags;
    question.search = buildSearch(question);
  }
  const removed = dedupeQuestions(bank);
  updateSummary(bank);
  writeFileSync(file, `${JSON.stringify(bank, null, 2)}\n`);
  return { updated, removed };
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
  const { boards, clueIndex, clueIdIndex, clueAnswerIndex, finalIndex, finalIdIndex } = collectJeopardyBoards();
  const { updated: bankUpdates, removed: removedDuplicates } = syncChronoBank(clueIndex, clueIdIndex, clueAnswerIndex, finalIndex, finalIdIndex);
  syncBossRush(boards);
  console.log(`Synced ${boards.length} Jeopardy boards into Boss Rush, refreshed ${bankUpdates} shared-bank prompts, removed ${removedDuplicates} duplicate derived records.`);
}

main();
