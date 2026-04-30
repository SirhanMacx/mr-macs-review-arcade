#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(resolve(root, "data/regents-past-exam-catalog.json"), "utf8"));
const errors = [];

function validUrl(url) {
  return /^https:\/\/www\.nysedregents\.org\//.test(String(url || ""));
}

for (const course of ["Grade 10 Global History II", "Grade 11 U.S. History"]) {
  const data = catalog.courses?.[course];
  if (!data) {
    errors.push(`${course}: missing from past-exam catalog`);
    continue;
  }
  const minimum = /Global/.test(course) ? 12 : 8;
  if ((data.exams || []).length < minimum) errors.push(`${course}: expected at least ${minimum} official past exams, found ${(data.exams || []).length}`);
  const administrations = new Set();
  for (const exam of data.exams || []) {
    if (administrations.has(exam.administration)) errors.push(`${course}: duplicate administration ${exam.administration}`);
    administrations.add(exam.administration);
    if (!validUrl(exam.examUrl)) errors.push(`${course} ${exam.administration}: missing official exam PDF`);
    if (!validUrl(exam.scoringKeyPdfUrl) && !validUrl(exam.scoringKeyExcelUrl)) errors.push(`${course} ${exam.administration}: missing scoring key`);
    if (!validUrl(exam.conversionChartPdfUrl) && !validUrl(exam.conversionChartExcelUrl)) errors.push(`${course} ${exam.administration}: missing conversion chart`);
    if (!(exam.ratingGuideUrls || []).some((guide) => validUrl(guide.url))) errors.push(`${course} ${exam.administration}: missing rating guide`);
    if (!exam.interactive || exam.mode !== "exact-released-form") errors.push(`${course} ${exam.administration}: catalog entry should be interactive exact-released-form`);
  }
}

if (errors.length) {
  console.error(`Regents past-exam catalog validation failed (${errors.length} issues):`);
  errors.forEach((error) => console.error("-", error));
  process.exit(1);
}

console.log("OK: Regents past-exam catalog passed.");
