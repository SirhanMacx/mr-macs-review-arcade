#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNIT_REVIEW_TYPES = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final"]);
const EXPECTED_VALUES = "100,200,300,400,500";
const MIN_WORDS = new Map([[100, 11], [200, 14], [300, 15], [400, 17], [500, 20]]);
const EXPECTED_SKILLS = new Map([
  [100, "identify key content"],
  [200, "match content to unit context"],
  [300, "explain cause, effect, or turning point"],
  [400, "connect evidence to a larger context"],
  [500, "synthesize a high-value exam pattern"]
]);
const REQUIRED_HIGH_VALUE = /exam-style|evidence to context|High-value synthesis|connect a specific fact|larger pattern/i;

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|and|or|of|to|in|for|with|by|on|from|during|this|that|these|those)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value).split(" ").filter(Boolean).length;
}

function hasAnswerLeak(clue, answer) {
  const normalizedAnswer = normalize(answer);
  if (normalizedAnswer.length < 5) return false;
  const answerWords = normalizedAnswer.split(" ").length;
  if (answerWords === 1 && normalizedAnswer.length < 8) return false;
  const normalizedClue = normalize(clue);
  if (normalizedClue.includes(normalizedAnswer)) return true;
  return normalizedClue.includes(normalizedAnswer.replace(/\s+/g, " "));
}

function validateBoard(game, file) {
  const errors = [];
  if (!Array.isArray(game.categories) || game.categories.length !== 5) {
    errors.push(`${file}: expected exactly 5 categories`);
    return errors;
  }
  const seenClues = new Map();
  const seenAnswers = new Map();
  for (const category of game.categories) {
    if (!Array.isArray(category.clues) || category.clues.length !== 5) {
      errors.push(`${file}: category ${category.name || "(untitled)"} must contain 5 clues`);
      continue;
    }
    const values = category.clues.map((clue) => Number(clue.value)).join(",");
    if (values !== EXPECTED_VALUES) {
      errors.push(`${file}: category ${category.name || "(untitled)"} has values ${values}, expected ${EXPECTED_VALUES}`);
    }
    for (const clue of category.clues) {
      const value = Number(clue.value);
      const clueText = String(clue.clue || "");
      const answerText = String(clue.answer || "");
      const clueKey = normalize(clueText);
      const answerKey = normalize(answerText);
      const wordCount = words(clueText);
      if (!answerKey) errors.push(`${file}: blank answer in ${category.name}`);
      if (!clueKey) errors.push(`${file}: blank clue for answer ${answerText}`);
      if (seenClues.has(clueKey)) errors.push(`${file}: repeated clue "${clueText}" also appears in ${seenClues.get(clueKey)}`);
      if (seenAnswers.has(answerKey)) errors.push(`${file}: repeated answer "${answerText}" also appears in ${seenAnswers.get(answerKey)}`);
      seenClues.set(clueKey, `${category.name} ${value}`);
      seenAnswers.set(answerKey, `${category.name} ${value}`);
      if (wordCount < (MIN_WORDS.get(value) || 12)) {
        errors.push(`${file}: ${category.name} $${value} clue is too thin (${wordCount} words): ${clueText}`);
      }
      if (value >= 400 && !REQUIRED_HIGH_VALUE.test(clueText)) {
        errors.push(`${file}: ${category.name} $${value} lacks explicit exam/synthesis rigor`);
      }
      if (hasAnswerLeak(clueText, answerText)) {
        errors.push(`${file}: clue appears to reveal its answer "${answerText}"`);
      }
      if (!clue.rigor || !clue.rigor.skill || !clue.rigor.alignment) {
        errors.push(`${file}: ${category.name} $${value} is missing hardening rigor metadata`);
      }
      if (clue.rigor && (Number(clue.rigor.value) !== value || clue.rigor.skill !== EXPECTED_SKILLS.get(value))) {
        errors.push(`${file}: ${category.name} $${value} has incorrect difficulty metadata`);
      }
    }
  }
  const final = game.final || {};
  const finalClue = String(final.clue || "");
  const finalAnswerKey = normalize(final.answer);
  if (normalize(final.category) !== "final synthesis") errors.push(`${file}: final category should be Final Synthesis`);
  if (words(finalClue) < 34) errors.push(`${file}: final clue is not rigorous enough (${words(finalClue)} words)`);
  if (!/at least two specific examples/i.test(finalClue)) errors.push(`${file}: final must require at least two specific board examples`);
  if (!/broader pattern|cause\/effect|comparison|continuity\/change|evidence/i.test(finalClue)) {
    errors.push(`${file}: final must demand reasoning beyond recall`);
  }
  if (seenAnswers.has(finalAnswerKey)) errors.push(`${file}: final answer repeats a board answer "${final.answer}"`);
  if (seenClues.has(normalize(finalClue))) errors.push(`${file}: final clue repeats a board clue`);
  if (!final.explanation || words(final.explanation) < 18) errors.push(`${file}: final explanation is too thin`);
  if (!game.alignment || !game.alignment.examTarget || !game.alignment.standardSet || game.alignment.hardeningVersion !== "jeopardy-hardening-v1") {
    errors.push(`${file}: missing board-level alignment metadata`);
  }
  return errors;
}

function main() {
  const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
  const targets = games.filter(isJeopardyManifestEntry);
  const errors = [];
  let clueCount = 0;
  for (const meta of targets) {
    const file = resolve(root, decodePath(meta.file));
    if (!existsSync(file)) {
      errors.push(`Missing board file: ${meta.file}`);
      continue;
    }
    let game;
    try {
      game = extractGame(readFileSync(file, "utf8"), relative(root, file));
    } catch (error) {
      errors.push(`${relative(root, file)}: ${error.message}`);
      continue;
    }
    clueCount += (game.categories || []).reduce((sum, category) => sum + (category.clues || []).length, 0);
    errors.push(...validateBoard(game, relative(root, file)));
  }
  if (errors.length) {
    console.error(`Jeopardy board validation failed (${errors.length} issues):`);
    errors.slice(0, 120).forEach((error) => console.error("-", error));
    if (errors.length > 120) console.error(`...and ${errors.length - 120} more`);
    process.exit(1);
  }
  console.log(`Jeopardy board validation OK: ${targets.length} boards, ${clueCount} regular clues, ${targets.length} finals.`);
}

main();
