import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const gamePath = resolve(root, "games/regents-practice-exam/game.js");
const bankPath = resolve(root, "data/regents-gauntlet-bank.json");

const gameSource = readFileSync(gamePath, "utf8");
const bank = JSON.parse(readFileSync(bankPath, "utf8"));
const cutoff = gameSource.indexOf('\nfetch("../../data/regents-gauntlet-bank.json');

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
globalThis.__practiceHarness = { state, PROFILES, assembleExam, docGroupKey, docAssetKeys, trustedDocSource, writingDocAudit };`;
  vm.runInNewContext(harnessSource, context, { filename: gamePath });
  context.__practiceHarness.state.bank = bank;
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

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
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
  const allWritingDocs = profile.id === "us-history" ? [...shortDocs, ...scaffold] : [...shortDocs, ...essayDocs];

  assert(exam.mcq.length === 28, `${course} seed ${seed}: expected 28 MCQs, found ${exam.mcq.length}`, errors);
  assert(exam.mcq.every((q) => (q.stimulusImages || []).length), `${course} seed ${seed}: MCQ without stimulus image`, errors);
  assert(exam.audit?.writingIntegrityOk, `${course} seed ${seed}: audit failed ${JSON.stringify(exam.audit)}`, errors);
  assert([...writingKeys].every((key) => !mcqKeys.has(key)), `${course} seed ${seed}: writing doc overlaps an MCQ stimulus group or image`, errors);
  assert(imageSrcs(allWritingDocs).every((src) => src.includes(imageDirectory)), `${course} seed ${seed}: writing stimulus uses wrong course image directory`, errors);
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

for (let seed = 1; seed <= 120; seed += 1) {
  const harness = loadHarness(seed);
  for (const course of courses) auditExam(harness, course, seed, errors);
}

if (errors.length) {
  console.error(`Regents practice audit failed (${errors.length} issues):`);
  errors.slice(0, 60).forEach((error) => console.error("-", error));
  if (errors.length > 60) console.error(`...and ${errors.length - 60} more`);
  process.exit(1);
}

console.log("OK: Regents practice assembly audit passed.");
