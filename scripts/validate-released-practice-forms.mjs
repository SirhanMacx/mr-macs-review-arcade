#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const forms = JSON.parse(readFileSync(resolve(root, "data/regents-released-practice-exams.json"), "utf8"));
const bank = JSON.parse(readFileSync(resolve(root, "data/regents-gauntlet-bank.json"), "utf8"));
const errors = [];

function images(doc) {
  return (doc.stimulusImages || []).filter((image) => image && image.src);
}

function releasedQuestionNumber(question) {
  const sourceMatch = String(question.source || "").match(/Jan(?:uary)?\s+2026.*?Q(?:uestion)?\s*(\d{1,2})\b/i);
  if (sourceMatch) return Number(sourceMatch[1]);
  if (Number.isFinite(Number(question.officialQuestionNumber))) return Number(question.officialQuestionNumber);
  return null;
}

function jan2026Mcq(course) {
  const found = new Set();
  for (const question of bank.questions || []) {
    if (question.course !== course) continue;
    if (!String(question.source || "").includes("Jan 2026")) continue;
    if (/^quarantined/i.test(String(question.sourceIntegrity || ""))) continue;
    if (!images(question).length) continue;
    const n = releasedQuestionNumber(question);
    if (n >= 1 && n <= 28) found.add(n);
  }
  return found;
}

function checkDocs(course, section, docs, expected) {
  if ((docs || []).length !== expected) errors.push(`${course} ${section}: expected ${expected} documents, found ${(docs || []).length}`);
  const seen = new Set();
  for (const doc of docs || []) {
    const srcs = images(doc).map((image) => image.src);
    if (!srcs.length) errors.push(`${course} ${section} doc ${doc.docNumber || "?"}: missing image`);
    for (const src of srcs) {
      if (seen.has(src)) errors.push(`${course} ${section}: repeated document image ${src}`);
      seen.add(src);
      if (!existsSync(resolve(root, "games/regents-practice-exam", src))) {
        errors.push(`${course} ${section}: missing document asset ${src}`);
      }
      if (/U\.S\. History/.test(course) && !/\/us-jan2026\//.test(src)) errors.push(`${course} ${section}: non-U.S. released-form asset ${src}`);
      if (/Global History/.test(course) && !/\/global-jan2026\//.test(src)) errors.push(`${course} ${section}: non-Global released-form asset ${src}`);
    }
  }
}

for (const [course, form] of Object.entries(forms.forms || {})) {
  const found = jan2026Mcq(course);
  const missing = Array.from({ length: 28 }, (_, index) => index + 1).filter((n) => !found.has(n));
  if (missing.length) errors.push(`${course}: missing exact January 2026 MCQ numbers ${missing.join(", ")}`);
  if (form.mode !== "exact-released-form") errors.push(`${course}: form mode is not exact-released-form`);
  if (!form.ratingGuideUrl || !form.scoringKeyUrl || !form.conversionChartUrl) errors.push(`${course}: missing official scoring links`);
  if (/Global History/.test(course)) {
    checkDocs(course, "CRQ short tasks", (form.shortTasks || []).flatMap((task) => task.docs || []), 4);
    checkDocs(course, "Enduring Issues Essay", form.essay?.docs || [], 5);
    if (form.essay?.docMinimum !== 3) errors.push(`${course}: essay doc minimum must be 3`);
  }
  if (/U\.S\. History/.test(course)) {
    checkDocs(course, "Short Essay tasks", (form.shortTasks || []).flatMap((task) => task.docs || []), 4);
    checkDocs(course, "Civic Literacy scaffold", (form.scaffoldTasks || []).flatMap((task) => task.docs || []), 6);
    checkDocs(course, "Civic Literacy Essay", form.essay?.docs || [], 6);
    if (form.essay?.docMinimum !== 4) errors.push(`${course}: civic essay doc minimum must be 4`);
  }
  for (const task of [...(form.shortTasks || []), ...(form.scaffoldTasks || [])]) {
    if (!task.modelAnswer && !(task.answerKey || []).length) errors.push(`${course} ${task.title}: missing answer key/model answer`);
  }
  if (!form.essay?.modelEssay || !form.essay?.answerKey) errors.push(`${course}: missing essay model/answer key`);
}

if (errors.length) {
  console.error(`Released practice form validation failed (${errors.length} issues):`);
  errors.forEach((error) => console.error("-", error));
  process.exit(1);
}

console.log("OK: exact released Regents practice forms passed.");
