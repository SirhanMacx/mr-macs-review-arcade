#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "data/ap-official-practice-exams.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const gameSource = readFileSync(resolve(root, "games/ap-practice-exam/game.js"), "utf8");
const errors = [];

for (const marker of ["data-source-page-img", "source-health", "Page match verified", "Expand Source"]) {
  if (!gameSource.includes(marker)) errors.push(`AP practice source viewer marker missing: ${marker}`);
}

function positiveInt(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function pageSpan(startPage, endPage) {
  const pages = [];
  for (let page = Number(startPage); page <= Number(endPage); page += 1) {
    pages.push(page);
  }
  return pages;
}

function firstPageValue(map) {
  const values = Object.values(map || {}).map(Number).filter(Number.isFinite);
  return values.length ? Math.min(...values) : 0;
}

function pageAsset(formId, page) {
  return resolve(root, "assets/ap-released-forms", formId, `page-${String(page).padStart(3, "0")}.webp`);
}

function assertPageAsset(formId, page, context) {
  const asset = pageAsset(formId, page);
  if (!existsSync(asset)) {
    errors.push(`${formId}: missing rendered official PDF page ${page} for ${context}`);
    return;
  }
  if (statSync(asset).size < 10_000) {
    errors.push(`${formId}: rendered official PDF page ${page} looks corrupt or empty for ${context}`);
  }
}

function orderedWritingEntries(form) {
  return Object.entries(form.writingPages || {})
    .map(([id, page]) => ({ id, page: Number(page) }))
    .filter((entry) => Number.isFinite(entry.page))
    .sort((a, b) => a.page - b.page || a.id.localeCompare(b.id));
}

function questionPagesFor(form, questionNumber) {
  const ranges = form.questionPageRanges || [];
  const rangeIndex = ranges.findIndex((range) => questionNumber >= Number(range[0]) && questionNumber <= Number(range[1]));
  if (rangeIndex < 0) return [Number(form.pdfStartPage) || 1];
  const startPage = Number(ranges[rangeIndex][2]) || Number(form.pdfStartPage) || 1;
  const firstWritingPage = firstPageValue(form.writingPages);
  const nextRangePage = ranges[rangeIndex + 1] ? Number(ranges[rangeIndex + 1][2]) : firstWritingPage;
  const endPage = Math.max(startPage, (nextRangePage || startPage + 1) - 1);
  return usablePageSpan(form, startPage, endPage);
}

function writingPagesFor(form, taskId) {
  const entries = orderedWritingEntries(form);
  const index = entries.findIndex((entry) => entry.id === taskId);
  if (index < 0) return [Number((form.writingPages || {})[taskId]) || Number(form.pdfStartPage) || 1];
  const startPage = entries[index].page;
  const nextPage = entries[index + 1]?.page;
  const endPage = Math.max(startPage, Math.min(nextPage ? nextPage - 1 : startPage, startPage + 5));
  return usablePageSpan(form, startPage, endPage);
}

function usablePageSpan(form, startPage, endPage) {
  const skipPages = new Set((form.skipPages || []).map(Number));
  const pages = pageSpan(startPage, endPage).filter((page) => !skipPages.has(page));
  return pages.length ? pages : pageSpan(startPage, endPage);
}

function validateQuestionRanges(form) {
  const ranges = form.questionPageRanges || [];
  const covered = new Set();
  let expectedStart = 1;
  let previousPage = 0;

  if (!Array.isArray(ranges) || !ranges.length) {
    errors.push(`${form.id}: missing questionPageRanges`);
    return;
  }

  for (const range of ranges) {
    if (!Array.isArray(range) || range.length !== 3) {
      errors.push(`${form.id}: every questionPageRanges entry must be [start, end, page]`);
      continue;
    }
    const [rawStart, rawEnd, rawPage] = range;
    const start = Number(rawStart);
    const end = Number(rawEnd);
    const page = Number(rawPage);

    if (!positiveInt(start) || !positiveInt(end) || !positiveInt(page)) {
      errors.push(`${form.id}: invalid question range values ${JSON.stringify(range)}`);
      continue;
    }
    if (start !== expectedStart) {
      errors.push(`${form.id}: MCQ ranges must be contiguous; expected question ${expectedStart}, found ${start}`);
    }
    if (end < start) {
      errors.push(`${form.id}: MCQ range ends before it starts (${start}-${end})`);
    }
    if (page < previousPage) {
      errors.push(`${form.id}: MCQ source pages must not move backward (${previousPage} to ${page})`);
    }
    for (let question = start; question <= end; question += 1) {
      if (covered.has(question)) errors.push(`${form.id}: MCQ ${question} is covered by more than one page range`);
      covered.add(question);
    }
    expectedStart = end + 1;
    previousPage = page;
  }

  const count = Number(form.mcqCount);
  if (!positiveInt(count)) {
    errors.push(`${form.id}: invalid mcqCount`);
    return;
  }
  for (let question = 1; question <= count; question += 1) {
    if (!covered.has(question)) errors.push(`${form.id}: MCQ ${question} is not covered by questionPageRanges`);
  }
  for (const question of covered) {
    if (question > count) errors.push(`${form.id}: questionPageRanges include MCQ ${question}, beyond mcqCount ${count}`);
  }

  const firstWritingPage = firstPageValue(form.writingPages);
  const lastRangePage = Number(ranges[ranges.length - 1]?.[2]);
  if (firstWritingPage && lastRangePage >= firstWritingPage) {
    errors.push(`${form.id}: last MCQ source page ${lastRangePage} overlaps first writing page ${firstWritingPage}`);
  }
}

function validateWriting(form) {
  const tasks = form.writingTasks || [];
  const pages = form.writingPages || {};
  if (!Array.isArray(tasks) || !tasks.length) {
    errors.push(`${form.id}: missing writingTasks`);
    return;
  }
  const seen = new Set();
  for (const task of tasks) {
    if (!task?.id) {
      errors.push(`${form.id}: writing task missing id`);
      continue;
    }
    if (seen.has(task.id)) errors.push(`${form.id}: duplicate writing task id ${task.id}`);
    seen.add(task.id);
    if (!positiveInt(task.max)) errors.push(`${form.id}: writing task ${task.id} has invalid max points`);
    if (!positiveInt(pages[task.id])) errors.push(`${form.id}: writing task ${task.id} has no rendered page anchor`);
  }
  for (const key of Object.keys(pages)) {
    if (!seen.has(key)) errors.push(`${form.id}: writingPages has no matching task for ${key}`);
  }
}

function validateForm(form) {
  if (!form?.id) {
    errors.push("AP form is missing id");
    return;
  }
  const requiredStrings = ["course", "label", "title", "sourceLabel", "pdfUrl", "officialPageUrl"];
  for (const key of requiredStrings) {
    if (!String(form[key] || "").trim()) errors.push(`${form.id}: missing ${key}`);
  }
  if (!/^https:\/\/(apcentral|secure-media)\.collegeboard\.org\//.test(String(form.pdfUrl || ""))) {
    errors.push(`${form.id}: pdfUrl must be an official College Board URL`);
  }
  if (String(form.answerKey || "").trim().length !== Number(form.mcqCount)) {
    errors.push(`${form.id}: answerKey length must match mcqCount`);
  }
  if (!Array.isArray(form.options) || form.options.length < 4) {
    errors.push(`${form.id}: answer options are missing`);
  }
  if (!form.scoring?.ranges?.length) {
    errors.push(`${form.id}: missing scoring conversion ranges`);
  }
  for (const page of form.skipPages || []) {
    if (!positiveInt(page)) errors.push(`${form.id}: skipPages contains invalid page ${page}`);
    if (!existsSync(pageAsset(form.id, page))) errors.push(`${form.id}: skipPages references a missing page ${page}`);
  }

  validateQuestionRanges(form);
  validateWriting(form);

  const firstWritingPage = firstPageValue(form.writingPages);
  for (let question = 1; question <= Number(form.mcqCount || 0); question += 1) {
    const pages = questionPagesFor(form, question);
    if (!pages.length) errors.push(`${form.id}: MCQ ${question} resolves to no official PDF pages`);
    for (const page of pages) {
      if (!positiveInt(page)) errors.push(`${form.id}: MCQ ${question} resolves to invalid page ${page}`);
      if (firstWritingPage && page >= firstWritingPage) {
        errors.push(`${form.id}: MCQ ${question} resolves into writing section page ${page}`);
      }
      assertPageAsset(form.id, page, `MCQ ${question}`);
    }
  }

  for (const task of form.writingTasks || []) {
    const pages = writingPagesFor(form, task.id);
    if (!pages.length) errors.push(`${form.id}: writing task ${task.id} resolves to no official PDF pages`);
    for (const page of pages) {
      if (!positiveInt(page)) errors.push(`${form.id}: writing task ${task.id} resolves to invalid page ${page}`);
      if (firstWritingPage && page < firstWritingPage) {
        errors.push(`${form.id}: writing task ${task.id} resolves into MCQ section page ${page}`);
      }
      assertPageAsset(form.id, page, `writing task ${task.id}`);
    }
  }
}

if (manifest.version !== "official-ap-public-practice-v1") {
  errors.push(`Unexpected AP practice manifest version: ${manifest.version || "missing"}`);
}

const forms = manifest.forms || [];
if (!Array.isArray(forms) || forms.length < 6) {
  errors.push(`AP practice manifest should include at least 6 public forms; found ${forms.length || 0}`);
}

const seenForms = new Set();
for (const form of forms) {
  if (seenForms.has(form?.id)) errors.push(`Duplicate AP form id: ${form.id}`);
  seenForms.add(form?.id);
  validateForm(form);
}

if (errors.length) {
  console.error(`AP practice source/page validation failed (${errors.length} issues):`);
  errors.slice(0, 180).forEach((error) => console.error("-", error));
  if (errors.length > 180) console.error(`...and ${errors.length - 180} more`);
  process.exit(1);
}

const pageCount = forms.reduce((total, form) => {
  const pages = new Set();
  for (let question = 1; question <= Number(form.mcqCount || 0); question += 1) {
    questionPagesFor(form, question).forEach((page) => pages.add(page));
  }
  for (const task of form.writingTasks || []) {
    writingPagesFor(form, task.id).forEach((page) => pages.add(page));
  }
  return total + pages.size;
}, 0);

console.log(`OK: AP practice sources passed (${forms.length} forms, ${pageCount} rendered page links).`);
