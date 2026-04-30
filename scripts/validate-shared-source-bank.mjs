#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chrono = JSON.parse(readFileSync(resolve(root, "data/chrono-defense-bank.json"), "utf8"));
const regents = JSON.parse(readFileSync(resolve(root, "data/regents-gauntlet-bank.json"), "utf8"));
const errors = [];
const SOURCE_RE = /\b(this|these)\s+(law|act|amendment|address|speech|message|excerpt|passage|document|map|cartoon|graph|chart|photograph|source|timeline|image|poster|newspaper|table)\b|based on|according to|document|map|cartoon|graph|chart|excerpt|passage|photograph|source|timeline|image|poster|newspaper|table/i;

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function images(question) {
  return (question.stimulusImages || []).filter((image) => image && image.src);
}

function sourceDependent(question) {
  return question.stimulusRequired || SOURCE_RE.test(question.prompt || question.stem || "");
}

function quarantined(question) {
  return /^quarantined/i.test(String(question.sourceIntegrity || ""));
}

function answerText(question) {
  return question.answer || (question.choices || []).find((choice) => String(choice.label) === String(question.correct))?.text || "";
}

function key(question) {
  return [
    question.course,
    question.source,
    question.officialQuestionNumber || question.number || "",
    normalize(question.prompt || question.stem),
    normalize(answerText(question))
  ].join("|");
}

function srcList(question) {
  return images(question).map((image) => image.src).sort().join("||");
}

const trustedRegents = new Map();
for (const question of regents.questions || []) {
  if (quarantined(question)) continue;
  if (sourceDependent(question) && !images(question).length) continue;
  trustedRegents.set(key(question), question);
}

const imageOwners = new Map();
let mcqCount = 0;
let imageBacked = 0;
for (const question of chrono.questions || []) {
  if (question.type !== "mcq") continue;
  mcqCount += 1;
  if (quarantined(question)) errors.push(`${question.id}: quarantined source is exposed in shared arcade bank`);
  const qImages = images(question);
  if (qImages.length) imageBacked += 1;
  if (sourceDependent(question) && !qImages.length) {
    errors.push(`${question.id}: source-dependent arcade MCQ has no stimulus image`);
  }

  const match = trustedRegents.get(key(question));
  if (!match) {
    errors.push(`${question.id}: arcade MCQ is not synced to a trusted Regents-bank item (${question.source})`);
    continue;
  }

  if (srcList(question) !== srcList(match)) {
    errors.push(`${question.id}: stimulus images differ from trusted Regents item ${match.id}`);
  }

  for (const image of qImages) {
    const resolved = resolve(root, "games/archive-cipher", image.src);
    if (!existsSync(resolved)) errors.push(`${question.id}: missing shared-bank stimulus asset ${image.src}`);
    if (/U\.S\. History/.test(question.course || "") && !/\/us-day/i.test(image.src)) {
      errors.push(`${question.id}: U.S. History item uses non-U.S. stimulus ${image.src}`);
    }
    if (/Global History/.test(question.course || "") && !/\/global-day/i.test(image.src)) {
      errors.push(`${question.id}: Global item uses non-Global stimulus ${image.src}`);
    }
    const owner = `${question.course}|${question.source}|${question.officialQuestionNumber || ""}`;
    if (!imageOwners.has(image.src)) imageOwners.set(image.src, new Set());
    imageOwners.get(image.src).add(owner);
  }
}

for (const [src, owners] of imageOwners.entries()) {
  if (owners.size > 1) {
    errors.push(`${src}: shared-bank stimulus assigned to multiple released-source keys (${[...owners].join(" / ")})`);
  }
}

if (mcqCount < 400) errors.push(`shared arcade bank should contain at least 400 trusted MCQs; found ${mcqCount}`);
if (imageBacked < 300) errors.push(`shared arcade bank should contain at least 300 image-backed MCQs; found ${imageBacked}`);

if (errors.length) {
  console.error(`Shared source bank validation failed (${errors.length} issues):`);
  errors.slice(0, 140).forEach((error) => console.error("-", error));
  if (errors.length > 140) console.error(`...and ${errors.length - 140} more`);
  process.exit(1);
}

console.log(`OK: shared source bank passed (${mcqCount} trusted MCQs, ${imageBacked} image-backed).`);
