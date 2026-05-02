#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bankFile = resolve(root, "data", "chrono-defense-bank.json");
const TARGET_RE = /AP Psychology Review|Civics and PIG Course Review|Grade [678] NYS Social Studies Standards Review|Grade 9 Global History I Year Review|NYS Global History Regents 2026 Review|NYS U\.S\. History Regents 2026 Review/i;

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentence(value) {
  const text = clean(value).replace(/^([a-z])/, (match) => match.toUpperCase());
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function wordCount(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length || 0;
}

function familyFor(course) {
  if (/AP Psychology Review/i.test(course)) return "ap-psych";
  if (/Grade [678] NYS Social Studies Standards Review/i.test(course)) return "middle";
  return "civics-year";
}

function contextLabel(question, prompt = "") {
  const category = clean(question.category);
  const set = clean(question.set);
  const generic = /\b(review|concepts?|ideas?|thinking|skills?|documents?|sources?|principles?|institutions?|participation|effects|big picture|variables|therapies)\b/i;
  if (set && category && normalize(prompt).startsWith(normalize(category))) return set;
  if (category && !generic.test(category)) return category;
  if (set && !generic.test(set)) return set;
  return category || set || "Course Review";
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

function stripEssayTail(prompt) {
  return clean(prompt).replace(/\s*Use one specific example to explain why it matters for[\s\S]*$/i, "");
}

function clueNeedsHardening(question, prompt) {
  if (/use one specific example to explain why it matters/i.test(prompt)) return true;
  if (!TARGET_RE.test(question.course || "")) return false;
  if (question.choices?.length) return false;
  return wordCount(prompt) <= 12 || /^this\s+(explains|is|was|describes|refers to)\b/i.test(prompt);
}

function contextualize(question, prompt) {
  const family = familyFor(question.course || "");
  const context = contextLabel(question, prompt);
  const body = stripEssayTail(prompt).replace(/\.$/, "");
  if (question.type === "jeopardy-final") return sentence(body);
  const lower = body.charAt(0).toLowerCase() + body.slice(1);
  const safeContext = normalize(context) === normalize(question.answer) ? "Course Review" : context;

  if (/^the branch that\b/i.test(body)) return sentence(`${safeContext} branch that ${body.replace(/^The branch that\s+/i, "")}`);
  if (/^the principle that\b/i.test(body)) return sentence(`${safeContext} principle that ${body.replace(/^The principle that\s+/i, "")}`);
  if (/^the process of\b/i.test(body)) return sentence(`${safeContext} process for ${body.replace(/^The process of\s+/i, "")}`);
  if (/^the factor\b/i.test(body)) return sentence(`${safeContext} term for ${lower}`);
  if (/^the (two|three|large|high|major)\b/i.test(body)) return sentence(`${safeContext} term for ${lower}`);
  if (/^a system for\b/i.test(lower)) return sentence(`${safeContext} system for ${body.replace(/^A system for\s+/i, "")}`);
  if (/^system where\b/i.test(lower)) return sentence(`${safeContext} system in which ${body.replace(/^System where\s+/i, "")}`);
  if (/^belief in\b/i.test(lower)) return sentence(`${safeContext} term for ${lower}`);
  if (/^basic rights\b/i.test(lower)) return sentence(`${safeContext} term for ${lower}`);
  if (/^powers?\b/i.test(lower)) return sentence(`${safeContext} term for ${lower}`);
  if (/^citizens'? attitudes\b/i.test(lower)) return sentence(`${safeContext} term for ${lower}`);
  if (/^a difference over time\b/i.test(lower)) return sentence(`${safeContext} concept for ${lower}`);
  if (/^something that stays the same over time\b/i.test(lower)) return sentence(`${safeContext} concept for ${lower}`);
  if (/^earlier events, cultures, or ideas\b/i.test(lower)) return sentence(`${safeContext} concept for ${lower}`);
  if (/^exact position on earth\b/i.test(lower)) return sentence(`${safeContext} term for ${lower}`);

  if (family === "ap-psych") return sentence(`${safeContext} term for ${lower}`);
  if (family === "middle" && wordCount(body) <= 9) return sentence(`${safeContext} term for ${lower}`);
  if (family === "civics-year") return sentence(`${safeContext} term for ${lower}`);
  return sentence(body);
}

function main() {
  const bank = JSON.parse(readFileSync(bankFile, "utf8"));
  let updated = 0;
  for (const question of bank.questions || []) {
    if (!TARGET_RE.test(question.course || "")) continue;
    if (question.choices?.length) continue;
    const prompt = clean(question.prompt || question.stem || "");
    if (!clueNeedsHardening(question, prompt)) continue;
    const nextPrompt = contextualize(question, prompt);
    if (!nextPrompt || nextPrompt === prompt) continue;
    question.prompt = nextPrompt;
    question.search = buildSearch(question);
    updated += 1;
  }
  writeFileSync(bankFile, `${JSON.stringify(bank, null, 2)}\n`);
  console.log(`Hardened ${updated} shared-bank prompts in chrono-defense-bank.json.`);
}

main();
