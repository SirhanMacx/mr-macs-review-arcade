#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { categoryFitScore, dailyDoublePosition, expectedCategoryAnswerPlan } from "./rebuild-jeopardy-groundup.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNIT_REVIEW_TYPES = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final", "Regents Sprint"]);
const EXPECTED_VALUES = "100,200,300,400,500";
const MIN_CLUE_WORDS = 2;
const MAX_CLUE_WORDS = 24;
const EXPECTED_SKILLS = new Map([
  [100, "identify key content"],
  [200, "match content to unit context"],
  [300, "explain cause, effect, or turning point"],
  [400, "connect evidence to a larger context"],
  [500, "synthesize a high-value exam pattern"]
]);
const FORBIDDEN_VERBOSE_CLUE = /standards-aligned review clue|course-level clue|Regents skill|AP historical reasoning|AP Psych skill|High-value synthesis|exam-style claim|which answer best|This is harder than recall|Use the clue to|correct response should|evidence-based writing/i;
const FORBIDDEN_GENERIC_CLUE = /\bterm for\b|specific development from|belongs in|the correct answer|correct answer:|final wager|final clue for|explain why this idea matters across the course|:\s+this\s+(?:is|was|were|are|describes|explains|identifies|names|means|refers to)\b|\b(?:resulting from|contained in the|during the)\.$|^(?:which|based on|according to)\b|^This\s+\w+\s+(?:means|explains|describes)\b|^This\s+(?:explains|describes|is|are|was|were|identifies|names|means|refers to)\b|^These\s+(?:explain|describe|are|were|identify|name|mean|refer to)\b/i;
const FORBIDDEN_FALLBACK_CLUE = /course-relevant development students must connect to evidence|Landmark case shaping rights, representation, or institutional power|Court case used to define constitutional meaning, rights, or government power/i;
const FORBIDDEN_VERBOSE_EXPLANATION = /fits this clue|Exam alignment|Review move|single-answer review concept aligned/i;
const EXPECTED_HARDENING_VERSION = "jeopardy-hardening-v4-natural-clues";
const FINAL_SYNTHESIS_LEAK = /final synthesis|at least two specific examples|evidence-based synthesis|standards-aligned argument|teacher judgment|score the synthesis|broader pattern, cause\/effect|instead of defining one isolated term/i;
const FINAL_OPEN_PROMPT = /^(?:discuss|explain|analyze|evaluate|assess|argue|compare|contrast|write|connect)\b|^describe how\b|^identify and explain\b|\bto what extent\b|\bwhy\b.*\bmatters\b/i;
const MAX_FINAL_ANSWER_WORDS = 6;
const GLOBAL_FINAL_US_MISMATCH = /\b(?:U\.S\. Expansion|Modern U\.S\.|APUSH|Japanese Americans|antebellum|sectionalism|manifest destiny|affirmative action|gulf of tonkin|moral majority|compromise of 1877|incumbency advantage|political efficacy|realignment)\b/i;
const GENERIC_FINAL_CATEGORY = /^(?:AP Concept|Social Studies Skills|Historical Thinking|Historical Concepts|Political Concepts|Economics Concepts|Big Picture|Final)$/i;
const FORBIDDEN_CATEGORY_NAME = /^(?:People \+ Places|Events \+ Laws|Ideas \+ Vocabulary|Government \+ Power|Society \+ Economy|Core Concepts|Markets \+ Models|Policy \+ Institutions|Graphs \+ Indicators|Applications|Principles|Institutions|Rights \+ Cases|Participation|Policy \+ Power|Spatial Patterns|Population \+ Culture|States \+ Land Use|Cities \+ Development|Models \+ Examples|Scarcity \+ Choices|Markets \+ Prices|Models \+ Graphs|Global \+ Applications)$/i;
const FORBIDDEN_CLUE_FILLER = /tied to state power, exchange, or conflict|applied to behavior, research, or evidence|tied to institutions, rights, or policy outcomes|used to predict incentives, shifts, or welfare effects|used to explain spatial patterns across scale|tied to turning points or comparisons|used to analyze scenario-based behavior|used to connect rules and power/i;
const FORBIDDEN_EXPLANATION_LABEL = /^(?:People \+ Places|Events \+ Laws|Ideas \+ Vocabulary|Government \+ Power|Society \+ Economy|Core Concepts|Markets \+ Models|Policy \+ Institutions|Graphs \+ Indicators|Applications|Principles|Institutions|Rights \+ Cases|Participation|Policy \+ Power|Spatial Patterns|Population \+ Culture|States \+ Land Use|Cities \+ Development|Models \+ Examples|Scarcity \+ Choices|Markets \+ Prices|Models \+ Graphs|Global \+ Applications|Foundations|Power \+ Government|Economy \+ Society|Conflict \+ Change|Modern Connections|Founding Principles|Branches \+ Federalism|Elections \+ Media|Policy \+ Participation)$/i;
const GENERIC_CATEGORY_SIGNATURES = new Set([
  "people places|events laws|ideas vocabulary|government power|society economy",
  "core concepts|markets models|policy institutions|graphs indicators|applications",
  "principles|institutions|rights cases|participation|policy power",
  "spatial patterns|population culture|states land use|cities development|models examples",
  "scarcity choices|markets prices|models graphs|policy institutions|global applications"
]);

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isJeopardyManifestEntry(game) {
  const text = [game.title, game.originalFile, game.file, game.gameType].join(" ").toLowerCase();
  return text.includes("jeopardy") || text.includes("unit review") || UNIT_REVIEW_TYPES.has(game.gameType);
}

function extractGame(text, file) {
  const match = text.match(/const GAME = (\{[\s\S]*?\});\s*(?:const|let|var)\s+STORAGE_KEY/);
  if (!match) throw new Error(`Could not find GAME JSON in ${file}`);
  return JSON.parse(match[1]);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|and|or|of|to|in|for|with|by|on|from|during|this|that|these|those)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value).split(" ").filter(Boolean).length;
}

function hasAnswerLeak(clue, answer) {
  const normalizedAnswer = normalize(answer);
  if (normalizedAnswer.length < 5) return false;
  const answerWords = normalizedAnswer.split(" ").length;
  if (answerWords === 1 && normalizedAnswer.length < 8) return false;
  const normalizedClue = normalize(clue);
  if (normalizedClue.includes(normalizedAnswer)) return true;
  return normalizedClue.includes(normalizedAnswer.replace(/\s+/g, " "));
}

function compactAnswer(value) {
  return normalize(value)
    .split(" ")
    .map((word) => (word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word))
    .join(" ");
}

function closeAnswerMatch(answer, records) {
  const answerKey = normalize(answer);
  const compactKey = compactAnswer(answer);
  const answerWords = answerKey.split(" ").filter(Boolean).length;
  for (const record of records) {
    if (!answerKey || !record.key || answerKey === record.key) continue;
    if (compactKey && compactKey === compactAnswer(record.answer)) return record;
    const shorter = answerKey.length < record.key.length ? answerKey : record.key;
    const longer = answerKey.length < record.key.length ? record.key : answerKey;
    const shorterWords = shorter.split(" ").filter(Boolean).length;
    if (shorterWords >= 2 && answerWords >= 2 && longer.includes(shorter)) return record;
  }
  return null;
}

function escaped(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasExplanationLabelChain(explanation, answer, labels) {
  const text = String(explanation || "");
  for (const label of labels.filter(Boolean)) {
    const labelChain = new RegExp(`^[^:]{1,120}:\\s*${escaped(label)}\\s*:`, "i");
    if (labelChain.test(text)) return true;
  }
  const match = text.match(/^[^:]{1,120}:\s*([^:]{2,80})\s*:/);
  return Boolean(match && FORBIDDEN_EXPLANATION_LABEL.test(match[1].trim()) && normalize(match[1]) !== normalize(answer));
}

function looksLikeRestatedClueExplanation(explanation, clue, answer) {
  const text = String(explanation || "");
  const clueKey = normalize(clue);
  const answerKey = normalize(answer);
  if (!clueKey || !answerKey) return false;
  const answerPrefix = new RegExp(`^${escaped(answer)}\\s*:\\s*`, "i");
  if (!answerPrefix.test(text)) return false;
  const body = normalize(text.replace(answerPrefix, ""));
  return body === clueKey;
}

function isGlobalBoard(game, file) {
  const fileKey = normalize(file);
  const courseKey = normalize([game.course, game.exam, game.title, game.subtitle].filter(Boolean).join(" "));
  return fileKey.includes("games global") || courseKey.includes("global history") || courseKey.includes("global geography");
}

function manifestCategories(meta) {
  return (meta.categories || []).map((category) => normalize(category)).join("|");
}

function validateBoard(game, file, meta) {
  const errors = [];
  if (!Array.isArray(game.categories) || game.categories.length !== 5) {
    errors.push(`${file}: expected exactly 5 categories`);
    return errors;
  }
  const expectedPlan = expectedCategoryAnswerPlan(meta || {}, game);
  const hasExplicitPlan = Boolean(expectedPlan?.every((spec) => spec.source === "explicit-repair"));
  if (expectedPlan) {
    for (let categoryIndex = 0; categoryIndex < expectedPlan.length; categoryIndex += 1) {
      const expected = expectedPlan[categoryIndex];
      const actual = game.categories[categoryIndex] || {};
      if (normalize(actual.name) !== normalize(expected.name)) {
        errors.push(`${file}: category ${categoryIndex + 1} should be "${expected.name}", found "${actual.name || "(blank)"}"`);
      }
      const expectedAnswers = expected.answers.map(normalize).join("|");
      const actualAnswers = (actual.clues || []).map((clue) => normalize(clue.answer)).join("|");
      if (actualAnswers !== expectedAnswers) {
        errors.push(`${file}: ${expected.name} category answers are scrambled; expected ${expected.answers.join(" | ")}`);
      }
    }
  }
  const categorySignature = game.categories.map((category) => normalize(category.name)).join("|");
  if (meta && Array.isArray(meta.categories) && manifestCategories(meta) !== categorySignature) {
    errors.push(`${file}: games.json categories are stale; expected ${game.categories.map((category) => category.name).join(" | ")}`);
  }
  if (GENERIC_CATEGORY_SIGNATURES.has(categorySignature)) {
    errors.push(`${file}: uses a repeated generic category template instead of board-specific categories`);
  }
  const categoryNames = game.categories.map((category) => normalize(category.name));
  if (new Set(categoryNames).size !== categoryNames.length) {
    errors.push(`${file}: repeated category names within one board: ${game.categories.map((category) => category.name).join(" | ")}`);
  }
  const seenClues = new Map();
  const seenAnswers = new Map();
  const answerRecords = [];
  const dailySpots = [];
  for (const category of game.categories) {
    if ("sourceName" in category) {
      errors.push(`${file}: ${category.name || "(untitled)"} carries stale sourceName runtime metadata`);
    }
    if (FORBIDDEN_CATEGORY_NAME.test(String(category.name || "").trim())) {
      errors.push(`${file}: generic category name must be board-specific: ${category.name}`);
    }
    if (!Array.isArray(category.clues) || category.clues.length !== 5) {
      errors.push(`${file}: category ${category.name || "(untitled)"} must contain 5 clues`);
      continue;
    }
    const values = category.clues.map((clue) => Number(clue.value)).join(",");
    if (values !== EXPECTED_VALUES) {
      errors.push(`${file}: category ${category.name || "(untitled)"} has values ${values}, expected ${EXPECTED_VALUES}`);
    }
    for (const clue of category.clues) {
      const value = Number(clue.value);
      const clueText = String(clue.clue || "");
      const answerText = String(clue.answer || "");
      const clueKey = normalize(clueText);
      const answerKey = normalize(answerText);
      const wordCount = words(clueText);
      if (!answerKey) errors.push(`${file}: blank answer in ${category.name}`);
      if (!clueKey) errors.push(`${file}: blank clue for answer ${answerText}`);
      if (seenClues.has(clueKey)) errors.push(`${file}: repeated clue "${clueText}" also appears in ${seenClues.get(clueKey)}`);
      if (seenAnswers.has(answerKey)) errors.push(`${file}: repeated answer "${answerText}" also appears in ${seenAnswers.get(answerKey)}`);
      seenClues.set(clueKey, `${category.name} ${value}`);
      seenAnswers.set(answerKey, `${category.name} ${value}`);
      answerRecords.push({ key: answerKey, answer: answerText, location: `${category.name} ${value}` });
      if (wordCount < MIN_CLUE_WORDS) {
        errors.push(`${file}: ${category.name} $${value} clue is too thin (${wordCount} words): ${clueText}`);
      }
      if (wordCount > MAX_CLUE_WORDS) {
        errors.push(`${file}: ${category.name} $${value} clue is too wordy (${wordCount} words): ${clueText}`);
      }
      if (FORBIDDEN_VERBOSE_CLUE.test(clueText)) {
        errors.push(`${file}: ${category.name} $${value} clue contains non-Jeopardy wrapper language: ${clueText}`);
      }
      if (FORBIDDEN_GENERIC_CLUE.test(clueText)) {
        errors.push(`${file}: ${category.name} $${value} clue contains weak generated wording: ${clueText}`);
      }
      if (FORBIDDEN_FALLBACK_CLUE.test(`${clueText} ${clue.explanation || ""}`)) {
        errors.push(`${file}: ${category.name} $${value} still contains fallback/generic clue wording: ${clueText}`);
      }
      for (const label of [category.name].filter(Boolean)) {
        const labelPrefix = new RegExp(`^${escaped(label)}\\s*:`, "i");
        if (labelPrefix.test(clueText)) {
          errors.push(`${file}: ${category.name} $${value} clue repeats category label instead of natural Jeopardy wording: ${clueText}`);
        }
      }
      if (hasExplanationLabelChain(clue.explanation, answerText, [category.name])) {
        errors.push(`${file}: ${category.name} $${value} explanation still contains a stale category label: ${clue.explanation}`);
      }
      if (FORBIDDEN_CLUE_FILLER.test(clueText) || FORBIDDEN_CLUE_FILLER.test(String(clue.explanation || ""))) {
        errors.push(`${file}: ${category.name} $${value} contains generic filler phrasing: ${clueText}`);
      }
      if (FORBIDDEN_VERBOSE_EXPLANATION.test(String(clue.explanation || ""))) {
        errors.push(`${file}: ${category.name} $${value} explanation contains wrapper language`);
      }
      if (hasAnswerLeak(clueText, answerText)) {
        errors.push(`${file}: clue appears to reveal its answer "${answerText}"`);
      }
      if (!clue.rigor || !clue.rigor.skill || !clue.rigor.alignment) {
        errors.push(`${file}: ${category.name} $${value} is missing hardening rigor metadata`);
      }
      if (clue.rigor && (Number(clue.rigor.value) !== value || clue.rigor.skill !== EXPECTED_SKILLS.get(value))) {
        errors.push(`${file}: ${category.name} $${value} has incorrect difficulty metadata`);
      }
      if (clue.daily) {
        dailySpots.push({ categoryIndex: game.categories.indexOf(category), category: category.name, value });
      }
      const currentCategoryIndex = game.categories.indexOf(category);
      const currentFit = categoryFitScore(clue, category.name, -1, currentCategoryIndex);
      let bestFit = { score: currentFit, index: currentCategoryIndex, name: category.name };
      game.categories.forEach((candidate, candidateIndex) => {
        const score = categoryFitScore(clue, candidate.name, -1, candidateIndex);
        if (score > bestFit.score) bestFit = { score, index: candidateIndex, name: candidate.name };
      });
      if (!hasExplicitPlan && bestFit.index !== currentCategoryIndex && currentFit === 0 && bestFit.score >= 28) {
        errors.push(`${file}: ${category.name} $${value} (${answerText}) has no category fit and strongly fits "${bestFit.name}"`);
      }
    }
  }
  if (dailySpots.length !== 1) {
    errors.push(`${file}: expected exactly one Daily Double, found ${dailySpots.length}`);
  } else {
    const expectedDaily = dailyDoublePosition(game, meta || {});
    const actualDaily = dailySpots[0];
    if (actualDaily.categoryIndex !== expectedDaily.categoryIndex || actualDaily.value !== expectedDaily.value) {
      errors.push(`${file}: Daily Double should be category ${expectedDaily.categoryIndex + 1} $${expectedDaily.value}, found ${actualDaily.category} $${actualDaily.value}`);
    }
  }
  const final = game.final || {};
  const finalClue = String(final.clue || "");
  const finalAnswerKey = normalize(final.answer);
  if (final.sourceFinal) errors.push(`${file}: final contains stale sourceFinal shadow data`);
  if (!normalize(final.category) || normalize(final.category) === "final synthesis") errors.push(`${file}: final category must be a real content category`);
  if (GENERIC_FINAL_CATEGORY.test(String(final.category || "").trim())) errors.push(`${file}: final category is too generic: ${final.category}`);
  if (words(finalClue) < 5) errors.push(`${file}: final clue is too thin (${words(finalClue)} words)`);
  if (words(finalClue) > 36) errors.push(`${file}: final clue is too wordy for a Jeopardy-style concept clue (${words(finalClue)} words)`);
  if (FINAL_OPEN_PROMPT.test(finalClue)) errors.push(`${file}: final clue looks open-ended instead of one true Jeopardy answer: ${finalClue}`);
  if (!finalAnswerKey) errors.push(`${file}: final answer is blank`);
  if (words(final.answer) > MAX_FINAL_ANSWER_WORDS) errors.push(`${file}: final answer is too long to behave like one Jeopardy response: ${final.answer}`);
  if (FINAL_SYNTHESIS_LEAK.test(`${final.category} ${finalClue} ${final.answer} ${final.explanation || ""}`)) {
    errors.push(`${file}: final still looks like an open-ended synthesis prompt`);
  }
  if (isGlobalBoard(game, file) && GLOBAL_FINAL_US_MISMATCH.test(`${final.category} ${finalClue} ${final.answer} ${final.explanation || ""}`)) {
    errors.push(`${file}: Global board final appears to use a U.S. History/APUSH category or clue: ${final.category} / ${final.answer}`);
  }
  if (FORBIDDEN_VERBOSE_EXPLANATION.test(String(final.explanation || ""))) {
    errors.push(`${file}: final explanation contains wrapper language`);
  }
  if (hasAnswerLeak(finalClue, final.answer)) errors.push(`${file}: final clue appears to reveal its answer "${final.answer}"`);
  if (seenAnswers.has(finalAnswerKey)) errors.push(`${file}: final answer repeats a board answer "${final.answer}"`);
  const closeFinal = closeAnswerMatch(final.answer, answerRecords);
  if (closeFinal) errors.push(`${file}: final answer "${final.answer}" is too close to board answer "${closeFinal.answer}" in ${closeFinal.location}`);
  for (const alias of final.aliases || []) {
    if (seenAnswers.has(normalize(alias))) errors.push(`${file}: final alias repeats a board answer "${alias}"`);
    const closeAlias = closeAnswerMatch(alias, answerRecords);
    if (closeAlias) errors.push(`${file}: final alias "${alias}" is too close to board answer "${closeAlias.answer}" in ${closeAlias.location}`);
  }
  if (seenClues.has(normalize(finalClue))) errors.push(`${file}: final clue repeats a board clue`);
  if (!final.explanation || words(final.explanation) < 5) errors.push(`${file}: final explanation is too thin`);
  if (!final.rigor || final.rigor.value !== "Final" || !final.rigor.skill) errors.push(`${file}: final is missing concept-answer rigor metadata`);
  if (!game.alignment || !game.alignment.examTarget || !game.alignment.standardSet || game.alignment.hardeningVersion !== EXPECTED_HARDENING_VERSION) {
    errors.push(`${file}: missing board-level alignment metadata`);
  }
  return errors;
}

function validateBoardRuntimeHtml(text, file) {
  const errors = [];
  if (!text.includes('const tileLabel = category.name + ", $" + clue.value')) {
    errors.push(`${file}: dollar tiles must build category-aware aria labels`);
  }
  if (!text.includes('tile.setAttribute("aria-label", state.used.includes(key) ? tileLabel + ", completed" : tileLabel)')) {
    errors.push(`${file}: dollar tiles must expose category, value, Daily Double, and completed state to screen readers`);
  }
  return errors;
}

function main() {
  const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
  const targets = games.filter(isJeopardyManifestEntry);
  const errors = [];
  const categorySignatures = new Map();
  const dailyPositions = new Map();
  let clueCount = 0;
  for (const meta of targets) {
    const file = resolve(root, decodePath(meta.file));
    if (!existsSync(file)) {
      errors.push(`Missing board file: ${meta.file}`);
      continue;
    }
    const source = readFileSync(file, "utf8");
    errors.push(...validateBoardRuntimeHtml(source, relative(root, file)));
    let game;
    try {
      game = extractGame(source, relative(root, file));
    } catch (error) {
      errors.push(`${relative(root, file)}: ${error.message}`);
      continue;
    }
    clueCount += (game.categories || []).reduce((sum, category) => sum + (category.clues || []).length, 0);
    const signature = (game.categories || []).map((category) => normalize(category.name)).join("|");
    if (signature) {
      if (!categorySignatures.has(signature)) categorySignatures.set(signature, []);
      categorySignatures.get(signature).push(relative(root, file));
    }
    for (let categoryIndex = 0; categoryIndex < (game.categories || []).length; categoryIndex += 1) {
      for (const clue of game.categories[categoryIndex].clues || []) {
        if (!clue.daily) continue;
        const key = `${categoryIndex + 1}:$${Number(clue.value)}`;
        dailyPositions.set(key, (dailyPositions.get(key) || 0) + 1);
      }
    }
    errors.push(...validateBoard(game, relative(root, file), meta));
  }
  for (const [signature, files] of categorySignatures) {
    if (files.length > 3 && !files.every((file) => /\/99 - /.test(file))) {
      errors.push(`Repeated category set appears on ${files.length} boards: ${signature} (${files.slice(0, 4).join("; ")})`);
    }
  }
  for (const [position, count] of dailyPositions) {
    if (count > Math.ceil(targets.length * 0.25)) {
      errors.push(`Daily Double position ${position} appears on ${count} boards; placement should be spread across the board`);
    }
  }
  if (errors.length) {
    console.error(`Jeopardy board validation failed (${errors.length} issues):`);
    errors.slice(0, 120).forEach((error) => console.error("-", error));
    if (errors.length > 120) console.error(`...and ${errors.length - 120} more`);
    process.exit(1);
  }
  console.log(`Jeopardy board validation OK: ${targets.length} boards, ${clueCount} regular clues, ${targets.length} finals.`);
}

main();
