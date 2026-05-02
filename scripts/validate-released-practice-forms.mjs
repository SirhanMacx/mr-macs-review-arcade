#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const formsData = JSON.parse(readFileSync(resolve(root, "data/regents-released-practice-exams.json"), "utf8"));
const catalog = JSON.parse(readFileSync(resolve(root, "data/regents-past-exam-catalog.json"), "utf8"));
const errors = [];

function images(doc) {
  return (doc.stimulusImages || []).filter((image) => image && image.src);
}

function allForms(course) {
  const forms = formsData.formsByCourse?.[course];
  if (Array.isArray(forms)) return forms;
  const legacy = formsData.forms?.[course];
  return legacy ? [legacy] : [];
}

function assetExists(src) {
  return existsSync(resolve(root, "games/regents-practice-exam", src));
}

function pageNumberFromSrc(src) {
  const match = String(src || "").match(/\/page-(\d{2})\./i);
  return match ? Number(match[1]) : null;
}

function officialPage(doc, image) {
  const value = image?.officialPage ?? doc?.officialPage;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function validOfficialUrl(url) {
  return /^https:\/\/www\.nysedregents\.org\//.test(String(url || ""));
}

function checkDocs(course, form, section, docs, expected, { allowRepeats = false } = {}) {
  if ((docs || []).length !== expected) errors.push(`${course} ${form.administration} ${section}: expected ${expected} documents, found ${(docs || []).length}`);
  const seen = new Set();
  for (const doc of docs || []) {
    const srcs = images(doc).map((image) => image.src);
    if (!srcs.length) errors.push(`${course} ${form.administration} ${section} doc ${doc.docNumber || "?"}: missing image`);
    for (const image of images(doc)) {
      const src = image.src;
      if (!allowRepeats && seen.has(src)) errors.push(`${course} ${form.administration} ${section}: repeated document image ${src}`);
      seen.add(src);
      if (!assetExists(src)) errors.push(`${course} ${form.administration} ${section}: missing document asset ${src}`);
      if (/U\.S\. History/.test(course) && !/regents-released-forms\/us-/.test(src)) errors.push(`${course} ${form.administration} ${section}: non-U.S. released-form asset ${src}`);
      if (/Global History/.test(course) && !/regents-released-forms\/global-/.test(src)) errors.push(`${course} ${form.administration} ${section}: non-Global released-form asset ${src}`);
      const srcPage = pageNumberFromSrc(src);
      const expectedPage = officialPage(doc, image);
      if (srcPage && expectedPage && srcPage !== expectedPage) errors.push(`${course} ${form.administration} ${section}: ${src} is page ${srcPage}, expected official page ${expectedPage}`);
    }
  }
}

function checkWritingLabels(course, form) {
  if (/Global History/.test(course)) {
    for (const task of form.shortTasks || []) {
      for (const doc of task.docs || []) {
        const text = `${doc.title || ""} ${doc.source || ""}`;
        if (!new RegExp(task.title.replace(/\s+/g, "\\s+"), "i").test(text)) errors.push(`${course} ${form.administration} ${task.title}: document source is not labeled for this CRQ set (${doc.source || "blank"})`);
      }
    }
    for (const doc of form.essay?.docs || []) {
      const text = `${doc.title || ""} ${doc.source || ""}`;
      if (!/Enduring Issues/i.test(text)) errors.push(`${course} ${form.administration} Enduring Issues Essay: document source is not labeled as an Enduring Issues document (${doc.source || "blank"})`);
    }
  }
  if (/U\.S\. History/.test(course)) {
    for (const doc of (form.scaffoldTasks || []).flatMap((task) => task.docs || [])) {
      const text = `${doc.title || ""} ${doc.source || ""}`;
      if (!/Civic Literacy|Civic/i.test(text)) errors.push(`${course} ${form.administration} Civic Literacy SAQ: document source is not labeled civic literacy (${doc.source || "blank"})`);
    }
    for (const doc of form.essay?.docs || []) {
      const text = `${doc.title || ""} ${doc.source || ""}`;
      if (!/Civic Literacy|Civic/i.test(text)) errors.push(`${course} ${form.administration} Civic Literacy Essay: document source is not labeled civic literacy (${doc.source || "blank"})`);
    }
  }
}

function checkConversion(course, form) {
  const table = form.conversionTable;
  if (!table?.rows || !Array.isArray(table.essayColumns)) {
    errors.push(`${course} ${form.administration}: missing parsed conversion chart`);
    return;
  }
  const expectedRows = /Global/.test(course) ? 36 : 45;
  const rowCount = Object.keys(table.rows).length;
  if (rowCount < expectedRows) errors.push(`${course} ${form.administration}: conversion chart has ${rowCount} rows, expected at least ${expectedRows}`);
  const expectedColumns = "0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5";
  if (table.essayColumns.map(Number).join(",") !== expectedColumns) errors.push(`${course} ${form.administration}: conversion chart essay columns are wrong`);
}

function checkMcq(course, form) {
  if ((form.mcq || []).length !== 28) errors.push(`${course} ${form.administration}: expected 28 interactive MCQs, found ${(form.mcq || []).length}`);
  const seen = new Set();
  for (const [index, question] of (form.mcq || []).entries()) {
    const number = index + 1;
    if (seen.has(question.id)) errors.push(`${course} ${form.administration}: duplicate MCQ id ${question.id}`);
    seen.add(question.id);
    if (question.officialQuestionNumber !== number) errors.push(`${course} ${form.administration}: MCQ ${number} has wrong official question number ${question.officialQuestionNumber}`);
    if (!["1", "2", "3", "4"].includes(String(question.correct))) errors.push(`${course} ${form.administration}: MCQ ${number} missing official key`);
    if ((question.choices || []).length !== 4) errors.push(`${course} ${form.administration}: MCQ ${number} does not have four choices`);
    if (/^Question\s+\d+$|read the official|official NYSED exam page/i.test(String(question.stem || ""))) errors.push(`${course} ${form.administration}: MCQ ${number} has placeholder stem text`);
    if ((question.choices || []).some((choice) => /^Choice\s+[1-4]$/i.test(String(choice.text || "")))) errors.push(`${course} ${form.administration}: MCQ ${number} has placeholder choice text`);
    if (String(question.stem || "").trim().length < 12) errors.push(`${course} ${form.administration}: MCQ ${number} stem is too short to be digitized`);
    if (!images(question).length) errors.push(`${course} ${form.administration}: MCQ ${number} missing official page image`);
    for (const image of images(question)) {
      if (!assetExists(image.src)) errors.push(`${course} ${form.administration}: MCQ ${number} missing image asset ${image.src}`);
      if (/U\.S\. History/.test(course) && !/regents-released-forms\/us-/.test(image.src)) errors.push(`${course} ${form.administration}: MCQ ${number} non-U.S. image ${image.src}`);
      if (/Global History/.test(course) && !/regents-released-forms\/global-/.test(image.src)) errors.push(`${course} ${form.administration}: MCQ ${number} non-Global image ${image.src}`);
    }
  }
}

for (const course of ["Grade 10 Global History II", "Grade 11 U.S. History"]) {
  const forms = allForms(course);
  const catalogCount = catalog.courses?.[course]?.exams?.length || 0;
  if (forms.length !== catalogCount) errors.push(`${course}: expected ${catalogCount} interactive forms from catalog, found ${forms.length}`);
  const administrations = new Set();
  for (const form of forms) {
    if (administrations.has(form.administration)) errors.push(`${course}: duplicate form administration ${form.administration}`);
    administrations.add(form.administration);
    if (form.mode !== "exact-released-form") errors.push(`${course} ${form.administration}: form mode is not exact-released-form`);
    if (!validOfficialUrl(form.officialExamUrl)) errors.push(`${course} ${form.administration}: missing official exam link`);
    if (!validOfficialUrl(form.ratingGuideUrl)) errors.push(`${course} ${form.administration}: missing official rating guide`);
    if (!validOfficialUrl(form.scoringKeyUrl)) errors.push(`${course} ${form.administration}: missing official scoring key`);
    if (!validOfficialUrl(form.conversionChartUrl)) errors.push(`${course} ${form.administration}: missing official conversion chart`);
    checkMcq(course, form);
    checkConversion(course, form);
    checkWritingLabels(course, form);
    if (/Global History/.test(course)) {
      checkDocs(course, form, "CRQ short tasks", (form.shortTasks || []).flatMap((task) => task.docs || []), 4);
      checkDocs(course, form, "Enduring Issues Essay", form.essay?.docs || [], 5);
      if (form.essay?.docMinimum !== 3) errors.push(`${course} ${form.administration}: essay doc minimum must be 3`);
    }
    if (/U\.S\. History/.test(course)) {
      checkDocs(course, form, "Short Essay tasks", (form.shortTasks || []).flatMap((task) => task.docs || []), 4);
      checkDocs(course, form, "Civic Literacy SAQ", (form.scaffoldTasks || []).flatMap((task) => task.docs || []), 6);
      checkDocs(course, form, "Civic Literacy Essay", form.essay?.docs || [], 6, { allowRepeats: true });
      if (form.essay?.docMinimum !== 4) errors.push(`${course} ${form.administration}: civic essay doc minimum must be 4`);
    }
    for (const task of [...(form.shortTasks || []), ...(form.scaffoldTasks || [])]) {
      if (/scaffold/i.test(String(task.title || ""))) errors.push(`${course} ${form.administration} ${task.title}: student-facing task title should use Civic SAQ language`);
      const prompts = task.prompts || [task.prompt];
      for (const prompt of prompts) {
        const text = String(prompt || "").trim();
        if (text.length < 25 || /^Question\s+\d+:\s+Analyze$/i.test(text)) errors.push(`${course} ${form.administration} ${task.title}: prompt appears clipped or generic`);
        if (/official document|official documents|Write Short Essay Question \d+ using/i.test(text)) errors.push(`${course} ${form.administration} ${task.title}: prompt still contains generic source placeholder text`);
      }
      if (!task.modelAnswer && !(task.answerKey || []).length) errors.push(`${course} ${form.administration} ${task.title}: missing answer key/model answer`);
    }
    if (!form.essay?.modelEssay || !form.essay?.answerKey) errors.push(`${course} ${form.administration}: missing essay model/answer key`);
  }
}

if (errors.length) {
  console.error(`Released practice form validation failed (${errors.length} issues):`);
  errors.forEach((error) => console.error("-", error));
  process.exit(1);
}

console.log("OK: interactive released Regents practice forms passed.");
