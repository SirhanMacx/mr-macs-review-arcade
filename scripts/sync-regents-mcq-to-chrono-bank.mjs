#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chronoPath = resolve(root, "data/chrono-defense-bank.json");
const regentsPath = resolve(root, "data/regents-gauntlet-bank.json");

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDisplayText(value) {
  return String(value || "")
    .replace(/\bfi\s+([a-z])/gi, "fi$1")
    .replace(/\bfl\s+([a-z])/gi, "fl$1");
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

function choiceText(question, label) {
  return (question.choices || []).find((choice) => String(choice.label) === String(label))?.text || "";
}

function quarantined(question) {
  return /^quarantined/i.test(String(question.sourceIntegrity || ""));
}

function sourceDependent(question) {
  return question.stimulusRequired || /(\bthis\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter|statement|speech|article|quotation|quote|painting|stamp|headline)\b|\bthese\s+(documents|maps|cartoons|graphs|charts|photographs|photos|sources|timelines|images|posters|newspapers|tables|statements|conditions|changes|figures|speeches|articles|quotations|quotes|paintings|stamps|headlines)\b|\bboth\s+(documents|sources|passages|excerpts|statements|headlines|maps|cartoons|charts|graphs|images|photographs|photos)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline|statement|speech|article|quotation|quote|stamp)\b|\bthe\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter|statement|speech|article|quotation|quote|painting|stamp|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\binformation\s+(in|on|from)\s+(the|this)\s+(map|cartoon|chart|graph|table|document|source|image|photograph|photo|poster|article|speech|statement|quotation|quote|newspaper|headline|timeline|painting|stamp)\b)/i.test(question.stem || "");
}

function usable(question) {
  if (quarantined(question)) return false;
  if (sourceDependent(question) && !(question.stimulusImages || []).some((image) => image && image.src)) return false;
  if ((sourceDependent(question) || (question.stimulusImages || []).some((image) => image && image.src)) && !/trusted|official|verified/i.test(String(question.sourceIntegrity || ""))) return false;
  return true;
}

function valueFor(question) {
  const n = Number(question.number || question.officialQuestionNumber || 0);
  if (n >= 23) return 500;
  if (n >= 15) return 400;
  if (n >= 8) return 300;
  return 200;
}

function toChrono(question, index) {
  const answer = choiceText(question, question.correct);
  const tags = [
    question.set,
    question.day,
    ...(question.tags || []),
    question.source
  ].filter(Boolean);
  return {
    type: "mcq",
    source: question.source || "Released Regents",
    course: question.course,
    subject: question.subject || (/U\.S\. History/.test(question.course) ? "U.S. History" : "Global History"),
    set: question.set || question.day || "Regents Review",
    day: question.day || "",
    category: question.set || question.subject || "Regents Review",
    value: valueFor(question),
    prompt: cleanDisplayText(question.stem),
    answer: cleanDisplayText(answer),
    choices: (question.choices || []).map((choice) => ({ label: String(choice.label), text: cleanDisplayText(choice.text) })),
    correct: String(question.correct),
    explanation: cleanDisplayText(question.explanation || `Correct answer: ${answer}.`),
    stimulusRequired: Boolean(question.stimulusRequired),
    stimulusImages: (question.stimulusImages || []).filter((image) => image && image.src),
    sourceIntegrity: question.sourceIntegrity || "",
    sourceIssue: question.sourceIssue || "",
    officialExam: question.officialExam || "",
    officialQuestionNumber: question.officialQuestionNumber || question.number || "",
    officialPdf: question.officialPdf || "",
    tags,
    id: `chrono-regents-${question.id || index}`,
    search: ""
  };
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
    courses: new Set(questions.map((q) => q.course).filter(Boolean)).size,
    jeopardy: (typeCounts.jeopardy || 0) + (typeCounts["jeopardy-final"] || 0),
    mcq: typeCounts.mcq || 0,
    generatedAt: new Date().toISOString()
  };
  bank.courses = [...new Set(questions.map((q) => q.course).filter(Boolean))].sort();
  const setsByCourse = {};
  for (const question of questions) {
    if (!question.course || !question.set) continue;
    if (!setsByCourse[question.course]) setsByCourse[question.course] = [];
    if (!setsByCourse[question.course].includes(question.set)) setsByCourse[question.course].push(question.set);
  }
  for (const sets of Object.values(setsByCourse)) sets.sort();
  bank.setsByCourse = setsByCourse;
}

const chrono = JSON.parse(readFileSync(chronoPath, "utf8"));
const regents = JSON.parse(readFileSync(regentsPath, "utf8"));
const previousMcq = (chrono.questions || []).filter((question) => question.type === "mcq").length;
const nonMcq = (chrono.questions || []).filter((question) => question.type !== "mcq");
const mcq = (regents.questions || []).filter(usable).map(toChrono);
for (const question of mcq) question.search = buildSearch(question);
chrono.questions = [...nonMcq, ...mcq];
updateSummary(chrono);
writeFileSync(chronoPath, `${JSON.stringify(chrono, null, 2)}\n`);
console.log(`Synced ${mcq.length} trusted Regents MCQs into chrono-defense-bank.json; replaced ${previousMcq} stale MCQs.`);
