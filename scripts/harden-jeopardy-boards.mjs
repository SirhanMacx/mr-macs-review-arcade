#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HARDENING_VERSION = "jeopardy-hardening-v1";
const UNIT_REVIEW_TYPES = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final"]);
const VALUE_SKILLS = {
  100: "identify key content",
  200: "match content to unit context",
  300: "explain cause, effect, or turning point",
  400: "connect evidence to a larger context",
  500: "synthesize a high-value exam pattern"
};

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

function replaceGame(text, game) {
  return text.replace(
    /const GAME = \{[\s\S]*?\};(?=\s*(?:const|let|var)\s+STORAGE_KEY)/,
    `const GAME = ${JSON.stringify(game)};`
  );
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

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function escRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function answerVariants(answer) {
  const raw = clean(answer);
  const compact = raw.replace(/[^A-Za-z0-9]+/g, " ").trim();
  const variants = new Set([raw, compact]);
  if (raw.endsWith("y")) variants.add(`${raw.slice(0, -1)}ies`);
  if (!raw.endsWith("s")) variants.add(`${raw}s`);
  if (raw.endsWith("ment")) variants.add(`${raw}ary`);
  return [...variants].filter((value) => value && value.length >= 5);
}

function removeAnswerLeak(text, answer, replacement = "the correct answer") {
  let output = clean(text);
  for (const variant of answerVariants(answer)) {
    output = output.replace(new RegExp(`\\b${escRegExp(variant)}\\b`, "gi"), replacement);
    const flexible = variant.split(/\s+/).map(escRegExp).join("\\W+");
    if (flexible !== escRegExp(variant)) {
      output = output.replace(new RegExp(`\\b${flexible}\\b`, "gi"), replacement);
    }
  }
  return clean(output)
    .replace(new RegExp(`\\b${escRegExp(replacement)}\\s+(?:and|or|\\+)\\s+${escRegExp(replacement)}\\b`, "gi"), replacement)
    .replace(new RegExp(`\\b${escRegExp(replacement)}\\s+${escRegExp(replacement)}\\b`, "gi"), replacement);
}

function sentence(value, fallback) {
  let text = clean(value || fallback || "");
  if (!text) text = "a course-relevant development students must connect to evidence";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function safeContext(value, answer, fallback) {
  let text = removeAnswerLeak(value, answer, "this topic");
  if (normalize(text).split(" ").filter(Boolean).length < 2) text = fallback;
  return clean(text || fallback);
}

function courseLane(meta, game) {
  const course = String(meta.course || game.exam || "");
  if (/AP Psychology/i.test(course)) return "ap-psych";
  if (/AP Human Geography/i.test(course)) return "ap-hug";
  if (/AP.*Government|Civics/i.test(course)) return "civics";
  if (/Economics|Microeconomics|Macroeconomics/i.test(course)) return "economics";
  if (/AP.*History|AP World|AP European|AP United States/i.test(course)) return "ap-history";
  return "nys-history";
}

function alignmentFor(meta, game) {
  const lane = courseLane(meta, game);
  const course = meta.course || game.exam || "Social Studies";
  if (lane === "ap-psych") {
    return {
      course,
      standardSet: "AP Psychology course framework",
      examTarget: "AP concept application, research reasoning, and evidence-based explanation",
      shortCode: "AP Psych skill",
      finalFrame: "Use evidence and psychological concepts to explain behavior, methods, or mental processes"
    };
  }
  if (lane === "ap-hug") {
    return {
      course,
      standardSet: "AP Human Geography course framework",
      examTarget: "AP spatial reasoning, scale, pattern, process, and human-environment interaction",
      shortCode: "AP HUG skill",
      finalFrame: "Use spatial evidence to explain a broader geographic pattern or process"
    };
  }
  if (lane === "civics") {
    return {
      course,
      standardSet: /AP/i.test(course) ? "AP U.S. Government and Politics course framework" : "NYS Civic Participation standards",
      examTarget: "constitutional principles, civic participation, institutions, rights, and public-policy analysis",
      shortCode: "civic reasoning",
      finalFrame: "Use evidence to connect institutions, rights, participation, and public policy"
    };
  }
  if (lane === "economics") {
    return {
      course,
      standardSet: /AP/i.test(course) ? "AP Economics course framework" : "NYS Economics and Economic Systems standards",
      examTarget: "economic reasoning with incentives, models, markets, policy, and tradeoffs",
      shortCode: "economic reasoning",
      finalFrame: "Use evidence to explain choices, incentives, market outcomes, and policy tradeoffs"
    };
  }
  if (lane === "ap-history") {
    return {
      course,
      standardSet: "AP history course framework",
      examTarget: "AP historical reasoning: developments/processes, contextualization, comparison, causation, continuity/change, and argumentation",
      shortCode: "AP historical reasoning",
      finalFrame: "Use evidence to build a historical argument about causation, comparison, or continuity and change"
    };
  }
  return {
    course,
    standardSet: "NYS K-12 Social Studies Framework",
    examTarget: "NYS Social Studies Practices and Regents-style reasoning: evidence, chronology/causation, comparison/context, geography, economics, and civic participation",
    shortCode: "Regents skill",
    finalFrame: "Use evidence to connect key ideas, conceptual understandings, and a broader historical or civic pattern"
  };
}

function signalFor(clue, answer, category, game) {
  const base = clue.sourceClue || clue.clue || clue.explanation || "";
  let signal = clean(base)
    .replace(/^identify(?: the)?\s+/i, "")
    .replace(/^which answer best (?:matches|names|explains)\s+/i, "")
    .replace(/^this clue asks for\s+/i, "");
  signal = removeAnswerLeak(signal, answer);
  if (normalize(signal).split(" ").filter(Boolean).length < 3) {
    const safeCategory = safeContext(category, answer, "this category");
    const safeUnit = safeContext(game.title, answer, "this unit");
    signal = `a specific development from ${safeCategory} that belongs in ${safeUnit}`;
  }
  return sentence(signal);
}

function hardenClue(clue, categoryName, game, meta) {
  const value = Number(clue.value);
  const answer = clean(clue.answer);
  const alignment = alignmentFor(meta, game);
  const safeCategory = safeContext(categoryName, answer, "this category");
  const safeUnit = safeContext(game.title, answer, "this unit");
  const signal = signalFor(clue, answer, categoryName, game);
  const skill = VALUE_SKILLS[value] || "review key content";
  const templates = {
    100: `Identify the key term connected to this standards-aligned review clue: ${signal}`,
    200: `Which answer best matches this course-level clue about ${safeCategory}, and how would it fit the unit context? ${signal}`,
    300: `${alignment.shortCode} - cause and effect: which answer explains the relationship, turning point, or development described here? This is harder than recall because students must connect the clue to the unit pattern. ${signal}`,
    400: `${alignment.shortCode} - evidence to context: which answer best names the development shown by this evidence from ${safeCategory}? Use the clue to connect a specific fact to context, chronology, power, geography, economics, or civic life. ${signal}`,
    500: `High-value synthesis: which answer best completes this exam-style claim about ${safeCategory}? The correct response should connect a specific fact to a larger pattern in the unit, explain why it mattered, and prepare students for evidence-based writing. ${signal}`
  };
  clue.sourceClue = clue.sourceClue || clue.clue;
  clue.sourceExplanation = clue.sourceExplanation || clue.explanation || "";
  clue.clue = removeAnswerLeak(templates[value] || templates[300], answer);
  clue.explanation = `${answer} fits this clue because it connects the specific evidence to ${safeCategory}. Exam alignment: ${alignment.examTarget}. Review move: ${skill}.`;
  clue.rigor = {
    value,
    skill,
    alignment: alignment.standardSet,
    examTarget: alignment.examTarget
  };
  return clue;
}

function finalFor(game, meta, answers) {
  const alignment = alignmentFor(meta, game);
  const safeUnit = safeContext(game.title, "", "this unit");
  const answer = `${safeUnit} evidence-based synthesis`;
  const clue = `Final synthesis: Use at least two specific examples from this board to make a standards-aligned argument about ${safeUnit}. ${alignment.finalFrame}. The response should explain a broader pattern, cause/effect relationship, comparison, or continuity/change instead of defining one isolated term.`;
  const aliases = [
    "evidence-based synthesis",
    "historical argument",
    "cause and effect",
    "comparison",
    "continuity and change",
    "contextualization",
    "civic reasoning",
    "economic reasoning",
    "spatial reasoning",
    "psychological explanation"
  ].filter((alias) => !answers.has(normalize(alias)));
  return {
    category: "Final Synthesis",
    clue,
    answer: answers.has(normalize(answer)) ? `${safeUnit} standards-based synthesis` : answer,
    aliases,
    explanation: `A strong final response uses two accurate board examples, connects them with reasoning, and makes a broader claim. Teacher judgment should score the synthesis; auto-score is only a vocabulary signal. This is aligned to ${alignment.examTarget}.`
  };
}

function hardenGame(game, meta) {
  const answers = new Set();
  for (const category of game.categories || []) {
    for (const clue of category.clues || []) answers.add(normalize(clue.answer));
  }
  for (const category of game.categories || []) {
    category.clues = (category.clues || []).map((clue) => hardenClue(clue, category.name, game, meta));
  }
  game.final = {
    sourceFinal: game.final && !game.final.sourceFinal ? { ...game.final } : game.final?.sourceFinal,
    ...finalFor(game, meta, answers)
  };
  game.alignment = {
    ...alignmentFor(meta, game),
    hardeningVersion: HARDENING_VERSION,
    boardShape: "5 categories x 5 clues, values 100-500, Final Synthesis separate from board answers",
    difficultyLadder: VALUE_SKILLS
  };
  game.hardeningVersion = HARDENING_VERSION;
  return game;
}

function main() {
  const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
  const targets = games.filter(isJeopardyManifestEntry);
  const report = {
    version: HARDENING_VERSION,
    boardCount: 0,
    clueCount: 0,
    finalCount: 0,
    files: []
  };

  for (const meta of targets) {
    const file = resolve(root, decodePath(meta.file));
    if (!existsSync(file)) throw new Error(`Missing board file: ${meta.file}`);
    const html = readFileSync(file, "utf8");
    const game = extractGame(html, relative(root, file));
    const hardened = hardenGame(game, meta);
    writeFileSync(file, replaceGame(html, hardened));
    const clueCount = hardened.categories.reduce((sum, category) => sum + category.clues.length, 0);
    report.boardCount += 1;
    report.clueCount += clueCount;
    report.finalCount += hardened.final ? 1 : 0;
    report.files.push({
      file: relative(root, file),
      title: hardened.title,
      course: meta.course,
      clues: clueCount,
      final: hardened.final.category,
      alignment: hardened.alignment.standardSet
    });
  }

  writeFileSync(resolve(root, "data", "jeopardy-hardening-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Hardened ${report.boardCount} Jeopardy boards, ${report.clueCount} clues, and ${report.finalCount} finals.`);
}

main();
