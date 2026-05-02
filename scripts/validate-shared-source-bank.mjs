#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chrono = JSON.parse(readFileSync(resolve(root, "data/chrono-defense-bank.json"), "utf8"));
const regents = JSON.parse(readFileSync(resolve(root, "data/regents-gauntlet-bank.json"), "utf8"));
const errors = [];
const SOURCE_RE = /(\bthis\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter|statement|speech|article|quotation|quote|painting|stamp|headline)\b|\bthese\s+(documents|maps|cartoons|graphs|charts|photographs|photos|sources|timelines|images|posters|newspapers|tables|statements|conditions|changes|figures|speeches|articles|quotations|quotes|paintings|stamps|headlines)\b|\bboth\s+(documents|sources|passages|excerpts|statements|headlines|maps|cartoons|charts|graphs|images|photographs|photos)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline|statement|speech|article|quotation|quote|stamp)\b|\bthe\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter|statement|speech|article|quotation|quote|painting|stamp|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\binformation\s+(in|on|from)\s+(the|this)\s+(map|cartoon|chart|graph|table|document|source|image|photograph|photo|poster|article|speech|statement|quotation|quote|newspaper|headline|timeline|painting|stamp)\b)/i;

const sourceBankPath = resolve(root, "assets/source-bank.js");
const sourceBankText = existsSync(sourceBankPath) ? readFileSync(sourceBankPath, "utf8") : "";
if (!sourceBankText) {
  errors.push("assets/source-bank.js is missing");
} else {
  for (const marker of ["MrMacsSourceBank", "usableRegentsQuestion", "trustedSource", "courseMatchesStimulus", "missingSourceReason", "sourceIdentity", "sourceLock", "sourceLockLabel", "playableSharedPrompt", "promptQuality"]) {
    if (!sourceBankText.includes(marker)) errors.push(`assets/source-bank.js missing shared source marker: ${marker}`);
  }
}

const sourceBankConsumers = [
  "assets/mastery-engine.js",
  "games/arcade-duel/game.js",
  "games/source-sprint/game.js",
  "games/regents-gauntlet/game.js",
  "games/archive-cipher/game.js",
  "games/source-audit/game.js",
  "games/source-lab/game.js",
  "games/regents-practice-exam/game.js",
  "games/chrono-pinball/game.js",
  "games/regents-rally-source-circuit/game.js"
];
for (const rel of sourceBankConsumers) {
  const text = readFileSync(resolve(root, rel), "utf8");
  if (!text.includes("MrMacsSourceBank")) errors.push(`${rel}: does not use shared MrMacsSourceBank checks`);
}

for (const rel of ["games/archive-cipher/game.js", "games/vocab-vault/game.js", "games/lightning-review/game.js"]) {
  const text = readFileSync(resolve(root, rel), "utf8");
  if (!text.includes("playableSharedPrompt")) errors.push(`${rel}: does not filter weak shared-bank prompts`);
}

for (const rel of [
  "games/chrono-defense/game.js",
  "games/chrono-pinball/game.js",
  "games/archive-quest/game.js",
  "games/history-hunters/game.js",
  "games/history-hunters-2/game.js",
  "games/timeline-runner/game.js",
  "games/empire-ascendant/game.js",
  "games/time-rift-survivors/game.js",
  "games/cold-war-invaders/game.js"
]) {
  const text = readFileSync(resolve(root, rel), "utf8");
  if (!text.includes("playableSharedPrompt")) errors.push(`${rel}: does not enforce shared prompt quality`);
}

const scriptConsumers = [
  "index.html",
  "games/source-sprint/index.html",
  "games/regents-gauntlet/index.html",
  "games/archive-cipher/index.html",
  "games/vocab-vault/index.html",
  "games/lightning-review/index.html",
  "games/chrono-defense/index.html",
  "games/chrono-pinball/index.html",
  "games/archive-quest/index.html",
  "games/history-hunters/index.html",
  "games/history-hunters-2/index.html",
  "games/timeline-runner/index.html",
  "games/empire-ascendant/index.html",
  "games/time-rift-survivors/index.html",
  "games/cold-war-invaders/index.html",
  "games/source-audit/index.html",
  "games/regents-practice-exam/index.html",
  "games/mastery-path/index.html",
  "games/source-lab/index.html",
  "games/writing-coach/index.html",
  "games/arcade-duel/index.html",
  "games/regents-rally-source-circuit/index.html"
];
for (const rel of scriptConsumers) {
  const text = readFileSync(resolve(root, rel), "utf8");
  if (!text.includes("assets/source-bank.js")) errors.push(`${rel}: does not load assets/source-bank.js`);
}
const indexText = readFileSync(resolve(root, "index.html"), "utf8");
if (indexText.indexOf("assets/source-bank.js") > indexText.indexOf("assets/mastery-engine.js")) {
  errors.push("index.html must load source-bank before mastery-engine");
}

let SourceBank = null;
if (sourceBankText) {
  const context = {
    console,
    window: {},
    globalThis: {}
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(sourceBankText, context, { filename: "assets/source-bank.js" });
  SourceBank = context.MrMacsSourceBank;
}

if (!SourceBank) {
  errors.push("assets/source-bank.js did not expose MrMacsSourceBank in validation harness");
} else {
  const sourceFixtures = [
    "This statement best supports which conclusion?",
    "These headlines were most directly caused by which policy?",
    "This speech reflects which constitutional principle?",
    "This article describes which New Deal program?",
    "The quotation is most closely associated with which idea?",
    "Information on the map best supports which conclusion?",
    "Both documents show which historical development?",
    "These stamps were used to promote which policy?"
  ];
  for (const stem of sourceFixtures) {
    if (!SourceBank.sourceBased({ stem })) errors.push(`source-bank regex missed fixture: ${stem}`);
  }
  if (SourceBank.sourceLock({ stem: "This map best supports which conclusion?", stimulusImages: [{ src: "x.jpg" }] }).ok) {
    errors.push("source-bank must not trust source-backed records without explicit provenance");
  }
  for (const question of regents.questions || []) {
    const lock = SourceBank.sourceLock(question);
    if (quarantined(question) && lock.ok) errors.push(`${question.id}: quarantined record has sourceLock.ok`);
    if (quarantined(question) && SourceBank.usableRegentsQuestion(question)) errors.push(`${question.id}: quarantined record is usable`);
    if ((SourceBank.sourceBased(question) || SourceBank.hasStimulusImages(question)) && !quarantined(question) && !/trusted|official|verified/i.test(String(question.sourceIntegrity || ""))) {
      errors.push(`${question.id}: source-backed Regents record lacks explicit trusted provenance`);
    }
  }

  const masteryContext = {
    console,
    window: contextWindow(SourceBank),
    localStorage: { getItem: () => null, setItem: () => {} },
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init && init.detail;
      }
    },
    Date,
    Math
  };
  masteryContext.globalThis = masteryContext.window;
  vm.runInNewContext(readFileSync(resolve(root, "assets/mastery-engine.js"), "utf8"), masteryContext, { filename: "assets/mastery-engine.js" });
  const Mastery = masteryContext.window.MrMacsMastery;
  if (!Mastery) {
    errors.push("assets/mastery-engine.js did not expose MrMacsMastery in validation harness");
  } else {
    for (const course of ["Grade 10 Global History II", "Grade 11 U.S. History"]) {
      const pools = Mastery.questionPool({ regents, review: chrono, games: [] }, course);
      for (const item of pools.regents) {
        if (!item.sourceLock?.ok) errors.push(`Mastery ${course}: blocked Regents item entered pool ${item.sourceId || item.id}`);
        const original = (regents.questions || []).find((question) => question.id === item.sourceId);
        if (original && (quarantined(original) || !SourceBank.usableRegentsQuestion(original))) {
          errors.push(`Mastery ${course}: source-blocked Regents item entered pool ${item.sourceId}`);
        }
      }
    }
  }
}

function contextWindow(sourceBank) {
  return {
    MrMacsSourceBank: sourceBank,
    addEventListener: () => {},
    dispatchEvent: () => {},
    MrMacsAnalytics: null,
    MrMacsProgress: null
  };
}

const chronoSourceConsumers = [
  { file: "games/chrono-defense/game.js", renderMarkers: ["stimulusStrip", "stimulusImagesFor(q)"] },
  { file: "games/chrono-pinball/game.js", renderMarkers: ["renderStimulus(q)", "stimulusImagesFor(q)"] },
  { file: "games/archive-quest/game.js", renderMarkers: ["stimulusRow", "stimulusImagesFor(q)"] },
  { file: "games/history-hunters/game.js", renderMarkers: ["sourcePanel", "sourceTextFor(q)", "stimulusImagesFor(q)"] },
  { file: "games/history-hunters-2/game.js", renderMarkers: ["hasReliableStimulus(q)", "sourceTextFor(q)", "stimulusImagesFor(q)"] },
  { file: "games/timeline-runner/game.js", renderMarkers: ["renderStimulus(q)", "stimulusImagesFor(q)"] },
  { file: "games/empire-ascendant/game.js", renderMarkers: ["renderStimulus(q)", "stimulusImagesFor(q)"] },
  { file: "games/time-rift-survivors/game.js", renderMarkers: ["renderStimulus(q)", "stimulusImagesFor(q)"] },
  { file: "games/cold-war-invaders/game.js", renderMarkers: ["renderQuestionSource", "sourceImages", "sourceText", "questionSource"] }
];

for (const consumer of chronoSourceConsumers) {
  const text = readFileSync(resolve(root, consumer.file), "utf8");
  if (!text.includes("MrMacsSourceBank")) errors.push(`${consumer.file}: does not load the shared source contract`);
  if (!text.includes("SourceBank.sourceBased(q)")) errors.push(`${consumer.file}: does not explicitly gate source-based prompts`);
  if (!text.includes("SourceBank.usableRegentsQuestion(q)")) errors.push(`${consumer.file}: does not apply trusted Regents source lock for source-backed MCQs`);
  for (const marker of consumer.renderMarkers) {
    if (!text.includes(marker)) errors.push(`${consumer.file}: source render contract marker missing: ${marker}`);
  }
  if (/SourceBank\.sourceBased\(q\)\s*&&\s*SourceBank\.hasStimulusImages\(q\)\s*&&\s*!SourceBank\.usableRegentsQuestion\(q\)/.test(text)) {
    errors.push(`${consumer.file}: source gate only protects image-backed items; source-based prompts must require renderable source before play`);
  }
}

const coldWarText = readFileSync(resolve(root, "games/cold-war-invaders/game.js"), "utf8");
const coldWarIndex = readFileSync(resolve(root, "games/cold-war-invaders/index.html"), "utf8");
if (!coldWarIndex.includes('id="questionSource"')) errors.push("Cold War Invaders intel modal must include a source container");
for (const marker of ["hasRenderableSource(q)", "sourceBasedQuestion(q)", "renderQuestionSource(state.current)", "sourceImages", "sourceText"]) {
  if (!coldWarText.includes(marker)) errors.push(`Cold War Invaders must preserve/render source-backed intel prompts: missing ${marker}`);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function images(question) {
  return (question.stimulusImages || []).filter((image) => image && image.src);
}

function sourceDependent(question) {
  return question.stimulusRequired || SOURCE_RE.test(question.prompt || question.stem || "");
}

function quarantined(question) {
  return /^quarantined/i.test(String(question.sourceIntegrity || ""));
}

function answerText(question) {
  return question.answer || (question.choices || []).find((choice) => String(choice.label) === String(question.correct))?.text || "";
}

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function promptQuality(question) {
  const prompt = String(question.prompt || question.stem || "").trim();
  const answer = String(answerText(question) || "").trim();
  const directResponse = !(question.choices || []).length && !!answer;
  const jeopardyStyle = /^jeopardy/i.test(String(question.type || "")) || /jeopardy/i.test(String(question.source || ""));
  const tooShort = directResponse && wordCount(prompt) < (jeopardyStyle ? 3 : 8);
  const synthesis = /use one specific example to explain why it matters/i.test(prompt);
  const weakLead = /^this\s+(explains|is|was|describes|refers to)\b/i.test(prompt);
  const answerLeak = directResponse && answer.length >= 4
    ? new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(prompt)
    : false;
  return {
    ok: Boolean(prompt) && (!directResponse || (!tooShort && !synthesis && !weakLead && !answerLeak)),
    tooShort,
    synthesis,
    weakLead,
    answerLeak,
    jeopardyStyle
  };
}

function key(question) {
  return [
    question.course,
    question.source,
    question.officialQuestionNumber || question.number || "",
    normalize(question.prompt || question.stem),
    normalize(answerText(question))
  ].join("|");
}

function srcList(question) {
  return images(question).map((image) => image.src).sort().join("||");
}

const trustedRegents = new Map();
for (const question of regents.questions || []) {
  if (quarantined(question)) continue;
  if (sourceDependent(question) && !images(question).length) continue;
  trustedRegents.set(key(question), question);
}

const imageOwners = new Map();
let mcqCount = 0;
let imageBacked = 0;
let weakDirectResponse = 0;
for (const question of chrono.questions || []) {
  if (!promptQuality(question).ok) weakDirectResponse += 1;
  if (question.type !== "mcq") continue;
  mcqCount += 1;
  if (quarantined(question)) errors.push(`${question.id}: quarantined source is exposed in shared arcade bank`);
  const qImages = images(question);
  if (qImages.length) imageBacked += 1;
  if (sourceDependent(question) && !qImages.length) {
    errors.push(`${question.id}: source-dependent arcade MCQ has no stimulus image`);
  }

  const match = trustedRegents.get(key(question));
  if (!match) {
    errors.push(`${question.id}: arcade MCQ is not synced to a trusted Regents-bank item (${question.source})`);
    continue;
  }

  if (srcList(question) !== srcList(match)) {
    errors.push(`${question.id}: stimulus images differ from trusted Regents item ${match.id}`);
  }

  for (const image of qImages) {
    const resolved = resolve(root, "games/archive-cipher", image.src);
    if (!existsSync(resolved)) errors.push(`${question.id}: missing shared-bank stimulus asset ${image.src}`);
    if (/U\.S\. History/.test(question.course || "") && !/\/us-day/i.test(image.src)) {
      errors.push(`${question.id}: U.S. History item uses non-U.S. stimulus ${image.src}`);
    }
    if (/Global History/.test(question.course || "") && !/\/global-day/i.test(image.src)) {
      errors.push(`${question.id}: Global item uses non-Global stimulus ${image.src}`);
    }
    const owner = `${question.course}|${question.source}|${question.officialQuestionNumber || ""}`;
    if (!imageOwners.has(image.src)) imageOwners.set(image.src, new Set());
    imageOwners.get(image.src).add(owner);
  }
}

for (const [src, owners] of imageOwners.entries()) {
  if (owners.size > 1) {
    errors.push(`${src}: shared-bank stimulus assigned to multiple released-source keys (${[...owners].join(" / ")})`);
  }
}

if (mcqCount < 400) errors.push(`shared arcade bank should contain at least 400 trusted MCQs; found ${mcqCount}`);
if (imageBacked < 300) errors.push(`shared arcade bank should contain at least 300 image-backed MCQs; found ${imageBacked}`);
if (weakDirectResponse > 1200) errors.push(`shared arcade bank contains too many weak direct-response prompts for reuse (${weakDirectResponse})`);

if (errors.length) {
  console.error(`Shared source bank validation failed (${errors.length} issues):`);
  errors.slice(0, 140).forEach((error) => console.error("-", error));
  if (errors.length > 140) console.error(`...and ${errors.length - 140} more`);
  process.exit(1);
}

console.log(`OK: shared source bank passed (${mcqCount} trusted MCQs, ${imageBacked} image-backed, ${weakDirectResponse} filtered direct-response prompts).`);
