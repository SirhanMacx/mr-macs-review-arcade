#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bank = JSON.parse(readFileSync(resolve(root, "data/regents-gauntlet-bank.json"), "utf8"));
const SOURCE_PATTERN = /based on|according to|document|map|cartoon|graph|chart|excerpt|passage|photograph|source|timeline|image|poster|newspaper|table/i;
const MIN_IMAGE_BACKED = {
  "Grade 10 Global History II": 28 + 9,
  "Grade 11 U.S. History": 28 + 10
};
const JAN_2026_REQUIRED = {
  "Grade 10 Global History II": new Set(Array.from({ length: 28 }, (_, index) => index + 1)),
  "Grade 11 U.S. History": new Set(Array.from({ length: 28 }, (_, index) => index + 1))
};

function quarantined(question) {
  return /^quarantined/i.test(String(question.sourceIntegrity || ""));
}

function images(question) {
  return (question.stimulusImages || []).filter((image) => image && image.src);
}

function sourceDependent(question) {
  return question.stimulusRequired || SOURCE_PATTERN.test(question.stem || "");
}

function sourceKey(question) {
  return [question.course || "", question.source || "", question.id || ""].join("|");
}

function officialQuestionNumber(question) {
  if (Number.isFinite(Number(question.officialQuestionNumber))) return Number(question.officialQuestionNumber);
  const sourceMatch = String(question.source || "").match(/Q(?:uestion)?\s*(\d{1,2})\b/i);
  if (sourceMatch) return Number(sourceMatch[1]);
  if (String(question.source || "").includes("Jan 2026") && Number.isFinite(Number(question.number))) return Number(question.number);
  return null;
}

const errors = [];
const imageUsers = new Map();
const imageBackedByCourse = new Map();
const jan2026ByCourse = new Map();
let quarantinedCount = 0;

for (const question of bank.questions || []) {
  const qImages = images(question);
  if (quarantined(question)) {
    quarantinedCount += 1;
    if (question.stimulusRequired) {
      errors.push(`${question.id}: quarantined source question must not require a stimulus`);
    }
    if (qImages.length) {
      errors.push(`${question.id}: quarantined source question must not expose stimulus images`);
    }
    continue;
  }

  if (sourceDependent(question) && !qImages.length) {
    errors.push(`${question.id}: source-dependent question has no verified stimulus image`);
  }

  for (const image of qImages) {
    const src = String(image.src);
    const resolved = resolve(root, "games/regents-gauntlet", src);
    if (!existsSync(resolved)) errors.push(`${question.id}: missing stimulus image ${src}`);
    if (/U\.S\. History/.test(question.course || "") && !/\/us-day/i.test(src)) {
      errors.push(`${question.id}: U.S. question uses non-U.S. stimulus path ${src}`);
    }
    if (/Global History/.test(question.course || "") && !/\/global-day/i.test(src)) {
      errors.push(`${question.id}: Global question uses non-Global stimulus path ${src}`);
    }
    if (!imageUsers.has(src)) imageUsers.set(src, []);
    imageUsers.get(src).push(question);
  }

  if (qImages.length) {
    imageBackedByCourse.set(question.course, (imageBackedByCourse.get(question.course) || 0) + 1);
  }

  if (String(question.source || "").includes("Jan 2026") && qImages.length) {
    const number = officialQuestionNumber(question);
    if (number >= 1 && number <= 28) {
      if (!jan2026ByCourse.has(question.course)) jan2026ByCourse.set(question.course, new Set());
      jan2026ByCourse.get(question.course).add(number);
    }
  }
}

for (const [src, users] of imageUsers.entries()) {
  const sourceKeys = new Set(users.map(sourceKey));
  if (sourceKeys.size > 1) {
    errors.push(`${src}: one stimulus image is assigned to multiple released sources (${users.map((q) => `${q.id} ${q.source}`).join(" / ")})`);
  }
}

for (const [course, minimum] of Object.entries(MIN_IMAGE_BACKED)) {
  const count = imageBackedByCourse.get(course) || 0;
  if (count < minimum) {
    errors.push(`${course}: needs at least ${minimum} trusted image-backed questions for practice assembly; found ${count}`);
  }
}

for (const [course, expected] of Object.entries(JAN_2026_REQUIRED)) {
  const found = jan2026ByCourse.get(course) || new Set();
  const missing = [...expected].filter((number) => !found.has(number));
  if (missing.length) {
    errors.push(`${course}: missing trusted January 2026 official MCQ numbers ${missing.join(", ")}`);
  }
}

for (const file of ["games/source-audit/index.html", "games/source-audit/styles.css", "games/source-audit/game.js", "assets/game-thumbnails/source-audit.webp"]) {
  if (!existsSync(resolve(root, file))) errors.push(`source audit asset missing: ${file}`);
}

if ((bank.summary?.totalQuarantinedSourceQuestions || 0) !== quarantinedCount) {
  errors.push(`summary totalQuarantinedSourceQuestions is ${bank.summary?.totalQuarantinedSourceQuestions || 0}, expected ${quarantinedCount}`);
}

if (errors.length) {
  console.error(`Regents source integrity validation failed (${errors.length} issues):`);
  errors.slice(0, 120).forEach((error) => console.error("-", error));
  if (errors.length > 120) console.error(`...and ${errors.length - 120} more`);
  process.exit(1);
}

console.log(`OK: Regents source integrity passed (${imageUsers.size} trusted stimulus assets, ${quarantinedCount} quarantined source questions).`);
