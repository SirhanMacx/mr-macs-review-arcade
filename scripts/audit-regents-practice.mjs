import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const gamePath = resolve(root, "games/regents-practice-exam/game.js");
const bankPath = resolve(root, "data/regents-gauntlet-bank.json");
const formsPath = resolve(root, "data/regents-released-practice-exams.json");
const catalogPath = resolve(root, "data/regents-past-exam-catalog.json");

const gameSource = readFileSync(gamePath, "utf8");
const bank = JSON.parse(readFileSync(bankPath, "utf8"));
const forms = JSON.parse(readFileSync(formsPath, "utf8"));
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const cutoff = gameSource.indexOf("\nPromise.all([");

if (cutoff < 0) {
  throw new Error("Could not locate practice exam runtime bootstrap.");
}

function seededMath(seed) {
  const math = Object.create(Math);
  let value = seed >>> 0;
  math.random = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
  return math;
}

function loadHarness(seed) {
  const context = {
    console,
    Date,
    Math: seededMath(seed),
  };
  const harnessSource = `${gameSource.slice(0, cutoff)}
globalThis.__practiceHarness = { state, PROFILES, ESSAY_COLUMNS, GLOBAL_CONVERSION, US_CONVERSION, assembleExam, docGroupKey, docAssetKeys, trustedDocSource, writingDocAudit };`;
  vm.runInNewContext(harnessSource, context, { filename: gamePath });
  context.__practiceHarness.state.bank = bank;
  context.__practiceHarness.state.forms = forms;
  context.__practiceHarness.state.catalog = catalog;
  return context.__practiceHarness;
}

function docsFromShort(exam) {
  return exam.shortTasks.flatMap((task) => task.docs || []);
}

function scaffoldDocs(exam) {
  return (exam.scaffoldTasks || []).flatMap((task) => task.docs || []);
}

function keys(docs) {
  return docs.map((doc) => doc.docGroupKey);
}

function guardKeys(harness, docs) {
  return docs.flatMap((doc) => [doc.docGroupKey, ...harness.docAssetKeys(doc)]);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function uniqueCount(values) {
  return new Set(values).size;
}

function imageSrcs(docs) {
  return docs.flatMap((doc) => (doc.stimulusImages || []).map((img) => img.src));
}

function answerLabels(exam) {
  return exam.mcq.map((q) => String(q.correct || ""));
}

function longestRun(values) {
  let run = 0;
  let best = 0;
  let previous = "";
  for (const value of values) {
    run = value === previous ? run + 1 : 1;
    best = Math.max(best, run);
    previous = value;
  }
  return best;
}

function answerSpread(labels) {
  const counts = new Map();
  labels.forEach((label) => counts.set(label, (counts.get(label) || 0) + 1));
  const values = [...counts.values()];
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function sameArray(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function auditProfileShapes(harness, errors) {
  const global = harness.PROFILES["Grade 10 Global History II"];
  const us = harness.PROFILES["Grade 11 U.S. History"];
  assert(!!global, "Global History II profile is missing", errors);
  assert(!!us, "U.S. History profile is missing", errors);
  if (global) {
    assert(global.shortTasks.length === 2, "Global must have two CRQ sets", errors);
    assert(sameArray(global.shortTasks.map((task) => task.points), [3, 4]), "Global CRQ sets must be worth 3 and 4 points", errors);
    assert(global.shortMax === 7, "Global Part II writing max must be 7", errors);
    assert(global.essayMax === 5, "Global Enduring Issues essay max must be 5", errors);
    assert(global.essayDocMinimum === 3, "Global Enduring Issues essay must require 3 of 5 documents", errors);
    assert(/five|5/i.test(global.essayTitle + " " + global.essayPrompt), "Global Enduring Issues text must name the five-document set", errors);
  }
  if (us) {
    assert(us.shortTasks.length === 2, "U.S. History must have two short essay sets", errors);
    assert(sameArray(us.shortTasks.map((task) => task.points), [5, 5]), "U.S. History short essays must be worth 5 and 5 points", errors);
    assert(us.shortMax === 10, "U.S. History Part II writing max must be 10", errors);
    assert((us.scaffoldPrompts || []).length === 6, "U.S. History Part IIIA must have six scaffold prompts", errors);
    assert(us.scaffoldMax === 6, "U.S. History scaffold max must be 6", errors);
    assert(us.essayMax === 5, "U.S. History Civic Literacy essay max must be 5", errors);
    assert(us.essayDocMinimum === 4, "U.S. History Civic Literacy essay must require at least four documents", errors);
  }
}

function auditConversionTables(harness, errors) {
  const expectedEssayColumns = [0, .5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  assert(sameArray(harness.ESSAY_COLUMNS, expectedEssayColumns), "Essay conversion columns must support 0.5-point steps from 0 to 5", errors);
  assert(harness.GLOBAL_CONVERSION.length === 36, `Global conversion chart should have 36 base-score rows, found ${harness.GLOBAL_CONVERSION.length}`, errors);
  assert(harness.US_CONVERSION.length === 45, `U.S. conversion chart should have 45 base-score rows, found ${harness.US_CONVERSION.length}`, errors);
  harness.GLOBAL_CONVERSION.forEach((row, index) => assert(row.length === 11, `Global conversion row ${index} should have 11 essay columns`, errors));
  harness.US_CONVERSION.forEach((row, index) => assert(row.length === 11, `U.S. conversion row ${index} should have 11 essay columns`, errors));
  assert(harness.GLOBAL_CONVERSION[27]?.[6] === 80, "Global January 2026 chart example should map base 27 + essay 3 to scale 80", errors);
  assert(harness.GLOBAL_CONVERSION[35]?.[10] === 100, "Global January 2026 chart top cell should be 100", errors);
  assert(harness.US_CONVERSION[31]?.[7] === 80, "U.S. January 2026 chart example should map base 31 + essay 3.5 to scale 80", errors);
  assert(harness.US_CONVERSION[44]?.[10] === 100, "U.S. January 2026 chart top cell should be 100", errors);
}

function auditPracticeUi(errors) {
  const indexSource = readFileSync(resolve(root, "games/regents-practice-exam/index.html"), "utf8");
  const styleSource = readFileSync(resolve(root, "games/regents-practice-exam/styles.css"), "utf8");
  for (const id of ["stimulusViewer", "viewerPrev", "viewerNext", "viewerFit", "viewerActual", "viewerZoom", "viewerClose"]) {
    assert(indexSource.includes(`id="${id}"`), `practice exam UI missing ${id}`, errors);
  }
  assert(styleSource.includes(".stimulus-missing"), "practice exam UI must visibly flag missing stimulus images", errors);
  assert(styleSource.includes("select option, select optgroup"), "practice exam select menus must force legible option colors", errors);
}

function auditExam(harness, course, seed, errors) {
  const exam = harness.assembleExam(course, 180);
  const profile = harness.PROFILES[course];
  const shortDocs = docsFromShort(exam);
  const scaffold = scaffoldDocs(exam);
  const essayDocs = exam.essay.docs || [];
  const shortKeys = keys(shortDocs);
  const scaffoldKeys = keys(scaffold);
  const essayKeys = keys(essayDocs);
  const mcqKeys = new Set(exam.mcq.flatMap((q) => [harness.docGroupKey(q), ...harness.docAssetKeys(q)]));
  const writingKeys = new Set(guardKeys(harness, profile.id === "us-history" ? [...shortDocs, ...scaffold] : [...shortDocs, ...essayDocs]));
  const imageDirectory = profile.id === "us-history" ? "/us-day" : "/global-day";
  const releasedImageDirectory = profile.id === "us-history" ? "/us-jan2026/" : "/global-jan2026/";
  const allWritingDocs = profile.id === "us-history" ? [...shortDocs, ...scaffold] : [...shortDocs, ...essayDocs];
  const labels = answerLabels(exam);
  const exactReleased = exam.mode === "exact-released-form";

  assert(exam.mcq.length === 28, `${course} seed ${seed}: expected 28 MCQs, found ${exam.mcq.length}`, errors);
  if (exactReleased) {
    assert(exam.administration === "January 2026", `${course} seed ${seed}: expected January 2026 exact form, found ${exam.administration}`, errors);
    assert(exam.mcq.every((q, index) => {
      const sourceMatch = String(q.source || "").match(/Q(?:uestion)?\s*(\d{1,2})\b/i);
      return Number(q.officialQuestionNumber || sourceMatch?.[1] || q.number) === index + 1;
    }), `${course} seed ${seed}: exact form MCQs are not in official order`, errors);
  } else {
    assert(uniqueCount(exam.mcq.map((q) => q.set || q.day || q.source)) >= 5, `${course} seed ${seed}: MCQs do not span enough released sets`, errors);
  }
  assert(exam.audit?.mcqDocGroups === 28, `${course} seed ${seed}: MCQ source groups should be unique`, errors);
  assert(uniqueCount(labels) >= 4, `${course} seed ${seed}: answer labels do not use four choices`, errors);
  assert(longestRun(labels) <= 8, `${course} seed ${seed}: answer labels have an excessive run (${labels.join(",")})`, errors);
  assert(answerSpread(labels) <= 14, `${course} seed ${seed}: answer label distribution is too imbalanced (${labels.join(",")})`, errors);
  assert(exam.mcq.every((q) => (q.stimulusImages || []).length), `${course} seed ${seed}: MCQ without stimulus image`, errors);
  assert(exam.audit?.writingIntegrityOk, `${course} seed ${seed}: audit failed ${JSON.stringify(exam.audit)}`, errors);
  assert(exam.audit?.assemblyAttempts <= 12, `${course} seed ${seed}: assembly retry budget exceeded`, errors);
  assert(typeof exam.audit?.requiredDocCountsOk === "boolean", `${course} seed ${seed}: audit missing requiredDocCountsOk`, errors);
  assert(typeof exam.audit?.courseStimulusMismatches === "number", `${course} seed ${seed}: audit missing courseStimulusMismatches`, errors);
  assert([...writingKeys].every((key) => !mcqKeys.has(key)), `${course} seed ${seed}: writing doc overlaps an MCQ stimulus group or image`, errors);
  assert(imageSrcs(allWritingDocs).every((src) => src.includes(imageDirectory) || src.includes(releasedImageDirectory)), `${course} seed ${seed}: writing stimulus uses wrong course image directory`, errors);
  assert(allWritingDocs.every((doc) => (doc.stimulusImages || []).length), `${course} seed ${seed}: writing doc missing image`, errors);
  assert(!allWritingDocs.some((doc) => (doc.questionIds || []).length > 1 && String(doc.source || "").includes(" / ")), `${course} seed ${seed}: writing doc merged multiple released sources`, errors);
  assert(allWritingDocs.every((doc) => harness.trustedDocSource(doc)), `${course} seed ${seed}: writing doc has unknown source`, errors);

  if (profile.id === "global-history-ii") {
    assert(shortDocs.length === 4, `${course} seed ${seed}: expected 4 CRQ docs, found ${shortDocs.length}`, errors);
    assert(essayDocs.length === 5, `${course} seed ${seed}: expected 5 Enduring Issues docs, found ${essayDocs.length}`, errors);
    assert(exam.scaffoldTasks.length === 0, `${course} seed ${seed}: Global exam should not have scaffold tasks`, errors);
    assert(profile.essayDocMinimum === 3, `${course} seed ${seed}: Global essay must require 3 of 5 docs`, errors);
    assert(uniqueCount([...shortKeys, ...essayKeys]) === 9, `${course} seed ${seed}: repeated CRQ/essay document key`, errors);
    assert(!duplicateValues(guardKeys(harness, [...shortDocs, ...essayDocs])).length, `${course} seed ${seed}: repeated CRQ/essay document image`, errors);
  } else {
    assert(shortDocs.length === 4, `${course} seed ${seed}: expected 4 short-essay docs, found ${shortDocs.length}`, errors);
    assert(scaffold.length === 6, `${course} seed ${seed}: expected 6 scaffold docs, found ${scaffold.length}`, errors);
    assert(essayDocs.length === 6, `${course} seed ${seed}: expected 6 Civic Literacy essay docs, found ${essayDocs.length}`, errors);
    assert(exam.scaffoldTasks.length === 6, `${course} seed ${seed}: expected 6 scaffold tasks, found ${exam.scaffoldTasks.length}`, errors);
    assert(profile.essayDocMinimum === 4, `${course} seed ${seed}: Civic Literacy essay must require 4 docs`, errors);
    assert(uniqueCount(scaffoldKeys) === 6, `${course} seed ${seed}: repeated Civic Literacy scaffold doc`, errors);
    assert(uniqueCount(essayKeys) === 6, `${course} seed ${seed}: repeated Civic Literacy essay doc`, errors);
    assert(scaffoldKeys.every((key, index) => key === essayKeys[index]), `${course} seed ${seed}: Part IIIA and IIIB should share the same ordered civic docs`, errors);
    assert(!shortKeys.some((key) => scaffoldKeys.includes(key)), `${course} seed ${seed}: short essay docs overlap Civic Literacy docs`, errors);
    assert(!duplicateValues(guardKeys(harness, [...shortDocs, ...scaffold])).length, `${course} seed ${seed}: repeated short/scaffold document image`, errors);
  }
}

const courses = ["Grade 10 Global History II", "Grade 11 U.S. History"];
const errors = [];
const harness = loadHarness(1);

auditProfileShapes(harness, errors);
auditConversionTables(harness, errors);
auditPracticeUi(errors);

for (let seed = 1; seed <= 300; seed += 1) {
  const seededHarness = loadHarness(seed);
  for (const course of courses) auditExam(seededHarness, course, seed, errors);
}

if (errors.length) {
  console.error(`Regents practice audit failed (${errors.length} issues):`);
  errors.slice(0, 60).forEach((error) => console.error("-", error));
  if (errors.length > 60) console.error(`...and ${errors.length - 60} more`);
  process.exit(1);
}

console.log("OK: Regents practice assembly audit passed.");
