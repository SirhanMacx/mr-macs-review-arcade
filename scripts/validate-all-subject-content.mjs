#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const taxonomy = JSON.parse(fs.readFileSync(path.join(root, "data/all-subject-course-taxonomy.json"), "utf8"));
const sourceCatalog = JSON.parse(fs.readFileSync(path.join(root, "data/released-assessment-source-catalog.json"), "utf8"));
const jeopardy = JSON.parse(fs.readFileSync(path.join(root, "data/generated-all-subject-jeopardy-blueprints.json"), "utf8"));
const practice = JSON.parse(fs.readFileSync(path.join(root, "data/generated-practice-exam-blueprints.json"), "utf8"));

const errors = [];
const courses = taxonomy.courses || [];
const byId = new Map(courses.map((course) => [course.id, course]));

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const requiredNysAreas = [
  "ELA",
  "Mathematics",
  "Science",
  "Arts",
  "Computer Science and Digital Fluency",
  "World Languages",
  "Health",
  "Physical Education",
  "CDOS",
  "Family and Consumer Sciences",
  "Technology Education",
  "Personal Finance"
];

for (const area of requiredNysAreas) {
  assert(courses.some((course) => course.subjectArea === area), `Missing NYS standards area: ${area}`);
}

for (const grade of [5, 6, 7, 8]) {
  for (const prefix of ["ela", "math", "science"]) {
    assert(byId.has(`${prefix}-${grade}`), `Missing ${prefix}-${grade}`);
  }
}

for (const id of ["english-9", "english-10", "english-11", "english-12", "algebra-1", "geometry", "algebra-2", "biology", "chemistry", "physics", "earth-science"]) {
  assert(byId.has(id), `Missing high-school course bucket: ${id}`);
}

const apCourses = courses.filter((course) => course.ap);
assert(apCourses.length >= 42, `Expected at least 42 AP courses, found ${apCourses.length}`);
assert(apCourses.some((course) => course.id === "ap-cybersecurity"), "AP Career Kickstart Cybersecurity should be tracked");
assert(apCourses.some((course) => course.id === "ap-business-personal-finance"), "AP Career Kickstart Business with Personal Finance should be tracked");

const fragmentDir = path.join(root, "data/bank-fragments");
for (const course of courses) {
  const file = path.join(fragmentDir, `all-subject-${course.id}.json`);
  assert(fs.existsSync(file), `Missing generated fragment for ${course.id}`);
  if (!fs.existsSync(file)) continue;
  const fragment = JSON.parse(fs.readFileSync(file, "utf8"));
  const questions = fragment.questions || [];
  assert(questions.length >= course.minQuestions, `${course.id} only has ${questions.length}/${course.minQuestions} questions`);
  const topics = new Set(questions.map((question) => question.topic));
  assert(topics.size === course.units.length, `${course.id}: question bank should cover every unit (${topics.size}/${course.units.length})`);
  const byTopic = new Map();
  for (const question of questions) byTopic.set(question.topic, (byTopic.get(question.topic) || 0) + 1);
  for (const unit of course.units) {
    assert((byTopic.get(unit.title) || 0) >= 12, `${course.id}: unit ${unit.title} has too few questions`);
  }
  const answerCounts = [0, 0, 0, 0];
  let streak = 0;
  let lastIndex = -1;
  for (const question of questions) {
    assert(question.course === course.id, `${course.id}: question ${question.id} has wrong course`);
    assert(Array.isArray(question.choices) && question.choices.length === 4, `${course.id}: ${question.id} choices shape`);
    assert(question.choices.includes(question.correctText), `${course.id}: ${question.id} correctText missing from choices`);
    const correctIndex = question.choices.indexOf(question.correctText);
    answerCounts[correctIndex] += 1;
    streak = correctIndex === lastIndex ? streak + 1 : 1;
    lastIndex = correctIndex;
    assert(streak <= 3, `${course.id}: ${question.id} creates an obvious answer-letter streak`);
    assert((question.standardRefs || []).length > 0, `${course.id}: ${question.id} missing standardRefs`);
    assert(question.explanation && question.explanation.split(/\s+/).length >= 12, `${course.id}: ${question.id} explanation too thin`);
  }
  assert(answerCounts.every((count) => count > 0), `${course.id}: answer letters should all appear ${answerCounts.join("/")}`);
}

const boardCourses = new Set((jeopardy.boards || []).map((board) => board.courseId));
for (const course of courses) {
  assert(boardCourses.has(course.id), `Missing Jeopardy blueprint for ${course.id}`);
}
for (const board of jeopardy.boards || []) {
  assert((board.categories || []).length === 5, `${board.id}: expected 5 categories`);
  for (const category of board.categories || []) {
    assert((category.clues || []).length === 5, `${board.id}: ${category.name} expected 5 clues`);
    assert(JSON.stringify(category.clues.map((clue) => clue.value)) === JSON.stringify([100, 200, 300, 400, 500]), `${board.id}: ${category.name} values are not 100-500`);
    for (const clue of category.clues) {
      assert(!/This .* idea helps students handle/.test(clue.clue || ""), `${board.id}: ${category.name} has old generic clue copy`);
      assert((clue.explanation || "").split(/\s+/).length >= 14, `${board.id}: ${category.name} ${clue.value} explanation too thin`);
    }
  }
  assert(board.final?.answer, `${board.id}: missing final`);
}

const practiceByCourse = new Map((practice.exams || []).map((exam) => [exam.courseId, exam]));
for (const course of courses) {
  const exam = practiceByCourse.get(course.id);
  assert(exam, `Missing practice blueprint for ${course.id}`);
  if (!exam) continue;
  assert((exam.sectionPlan || []).length >= 2, `${course.id}: practice blueprint needs at least two sections`);
  assert((exam.units || []).length === course.units.length, `${course.id}: practice units mismatch`);
  assert((exam.writtenTasks || []).length >= 3, `${course.id}: practice blueprint needs written tasks`);
  for (const unit of exam.units || []) {
    assert((unit.sampledQuestionIds || []).length >= 6, `${course.id}: ${unit.unit} needs more sampled questions for practice exams`);
  }
  if ((course.assessmentSourceIds || []).length) {
    assert(exam.sourceMode !== "standards-aligned-original", `${course.id}: released-backed course lost source mode`);
  }
}

const releasedCourses = courses.filter((course) => (course.assessmentSourceIds || []).some((id) => /nysed|regents/.test(id)));
assert(releasedCourses.length >= 15, `Expected broad NYSED released-source coverage, found ${releasedCourses.length}`);
for (const course of releasedCourses) {
  for (const id of course.assessmentSourceIds) {
    assert(sourceCatalog.sources[id] || sourceCatalog.courseSourceMap[course.id]?.assessmentSourceIds?.includes(id), `${course.id}: unknown released source id ${id}`);
  }
}

const context = { window: {}, globalThis: {} };
context.globalThis = context.window;
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/shared-question-bank.js"), "utf8"), context, { filename: "assets/shared-question-bank.js" });
const sharedBank = context.window.DIAG_BANK_BY_COURSE || {};
let generatedQuestionTotal = 0;
for (const course of courses) {
  assert((sharedBank[course.id] || []).length >= course.minQuestions, `shared bank missing ${course.id}`);
  generatedQuestionTotal += (sharedBank[course.id] || []).length;
}
assert(generatedQuestionTotal >= 10000, `generated all-subject bank is too small: ${generatedQuestionTotal}`);
assert(context.window.DIAG_BANK_COVERAGE?.apCourses >= 42, "shared bank AP coverage metadata too low");
assert(context.window.DIAG_BANK_COVERAGE?.coreGeneralCourses >= 25, "shared bank core-general coverage metadata too low");

if (errors.length) {
  console.error(`All-subject content validation failed (${errors.length} issues):`);
  for (const error of errors.slice(0, 80)) console.error(`- ${error}`);
  if (errors.length > 80) console.error(`... ${errors.length - 80} more`);
  process.exit(1);
}

console.log(`All-subject content validation OK: ${courses.length} courses, ${apCourses.length} AP/Career AP courses, ${(jeopardy.boards || []).length} Jeopardy blueprints, ${(practice.exams || []).length} practice blueprints.`);
