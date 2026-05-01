#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gameSource = readFileSync(resolve(root, "games/archive-cipher/game.js"), "utf8");
const bank = JSON.parse(readFileSync(resolve(root, "data/chrono-defense-bank.json"), "utf8"));
const errors = [];

const SOURCE_RE = /(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(documents|statements|headlines|sources|passages|figures|maps|graphs|charts|cartoons)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|similar\s+to\s+this)/i;

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeTerm(value) {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

function promptNeedsStimulus(question) {
  return SOURCE_RE.test(String(question?.prompt || question?.stem || ""));
}

function stimulusImages(question) {
  return (question?.stimulusImages || []).filter((image) => image && image.src);
}

function trustedSource(question) {
  return /trusted|official/i.test(String(question?.sourceIntegrity || ""));
}

function courseMatchesStimulus(question) {
  const srcs = stimulusImages(question).map((image) => String(image.src || ""));
  if (!srcs.length) return false;
  const course = String(question?.course || "");
  if (/U\.S\. History/i.test(course)) {
    return srcs.every((src) => /\/us-day/i.test(src) || /regents-released-forms\/us-/i.test(src));
  }
  if (/Global History/i.test(course)) {
    return srcs.every((src) => /\/global-day/i.test(src) || /regents-released-forms\/global-/i.test(src));
  }
  return true;
}

function verifiedSourceQuestion(question) {
  return Boolean(
    question &&
    !/^quarantined/i.test(String(question.sourceIntegrity || "")) &&
    trustedSource(question) &&
    stimulusImages(question).length &&
    courseMatchesStimulus(question)
  );
}

function displayPrompt(question) {
  return cleanText(question?.prompt || question?.stem || "");
}

function isPlayableTerm(question) {
  if (!question?.answer) return false;
  if (/^quarantined/i.test(String(question.sourceIntegrity || ""))) return false;
  const code = normalizeTerm(question.answer);
  if (code.length < 4 || code.length > 12) return false;
  if (!/^[A-Z]+$/.test(code)) return false;
  if (/^(TRUE|FALSE|NONE|OTHER|ABOVE|BELOW)$/i.test(question.answer)) return false;
  const answer = cleanText(question.answer);
  if (answer.length < 4 || answer.length > 40) return false;
  if (promptNeedsStimulus(question) && !verifiedSourceQuestion(question)) return false;
  if (stimulusImages(question).length && !verifiedSourceQuestion(question)) return false;
  return Boolean(displayPrompt(question));
}

for (const marker of ["verifiedSourceQuestion", "courseMatchesStimulus", "sourceIdentity", "Matched released Regents source", "Used for this clue"]) {
  if (!gameSource.includes(marker)) errors.push(`archive-cipher source lock marker missing: ${marker}`);
}

const playable = [];
const sourcePlayable = [];
const imageOwners = new Map();

for (const question of bank.questions || []) {
  if (!isPlayableTerm(question)) continue;
  playable.push(question);
  const images = stimulusImages(question);
  if (!images.length) continue;
  sourcePlayable.push(question);
  if (!verifiedSourceQuestion(question)) {
    errors.push(`${question.id}: image-backed Archive Cipher term is not verified`);
  }
  for (const image of images) {
    const resolved = resolve(root, "games/archive-cipher", image.src);
    if (!existsSync(resolved)) errors.push(`${question.id}: missing Archive Cipher stimulus ${image.src}`);
    const owner = `${question.course}|${question.source}|${question.officialQuestionNumber || question.number || ""}`;
    if (!imageOwners.has(image.src)) imageOwners.set(image.src, new Set());
    imageOwners.get(image.src).add(owner);
  }
}

for (const [src, owners] of imageOwners.entries()) {
  if (owners.size > 1) {
    errors.push(`${src}: Archive Cipher stimulus assigned to multiple source keys (${[...owners].join(" / ")})`);
  }
}

if (playable.length < 1500) errors.push(`Archive Cipher playable term bank is too small: ${playable.length}`);
if (sourcePlayable.length < 30) errors.push(`Archive Cipher source-backed term bank is too small: ${sourcePlayable.length}`);

if (errors.length) {
  console.error(`Archive Cipher source-lock validation failed (${errors.length} issues):`);
  errors.slice(0, 120).forEach((error) => console.error("-", error));
  if (errors.length > 120) console.error(`...and ${errors.length - 120} more`);
  process.exit(1);
}

console.log(`OK: Archive Cipher source lock passed (${playable.length} playable terms, ${sourcePlayable.length} source-backed).`);
