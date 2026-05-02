#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceBankSource = readFileSync(resolve(root, "assets/source-bank.js"), "utf8");
const gameSource = readFileSync(resolve(root, "games/cold-war-invaders/game.js"), "utf8");
const chrono = JSON.parse(readFileSync(resolve(root, "data/chrono-defense-bank.json"), "utf8"));
const cutoff = gameSource.indexOf('\ndocument.addEventListener("keydown"');
const errors = [];

if (cutoff < 0) {
  errors.push("Could not locate Cold War Invaders event-binding cutoff.");
}

function makeClassList() {
  const classes = new Set(["hidden"]);
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    contains: (name) => classes.has(name),
    toggle: (name, force) => {
      if (force === undefined ? !classes.has(name) : force) classes.add(name);
      else classes.delete(name);
    },
    toString: () => [...classes].join(" ")
  };
}

function element(id) {
  return {
    id,
    value: id === "theaterSelect" ? "cold" : id === "difficultySelect" ? "regents" : "",
    textContent: "",
    innerHTML: "",
    hidden: false,
    disabled: false,
    style: {},
    dataset: {},
    classList: makeClassList(),
    getContext: () => ({}),
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    focus: () => {}
  };
}

const elements = new Map();
const context = {
  console,
  URLSearchParams,
  performance: { now: () => 0 },
  location: { search: "" },
  innerWidth: 1280,
  innerHeight: 800,
  devicePixelRatio: 1,
  document: {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, element(selector.replace(/^#/, "")));
      return elements.get(selector);
    },
    createElement() {
      return { innerHTML: "", textContent: "" };
    }
  },
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  Image: class {
    set src(value) { this._src = value; }
    get src() { return this._src || ""; }
  }
};
context.window = context;
context.globalThis = context;

if (!errors.length) {
  vm.runInNewContext(sourceBankSource, context, { filename: "assets/source-bank.js" });
  vm.runInNewContext(`${gameSource.slice(0, cutoff)}
globalThis.__coldWarHarness = { isPlayableQuestion, normalizeQuestion, renderQuestionSource, sourceBasedQuestion, hasRenderableSource, state, els };`, context, { filename: "games/cold-war-invaders/game.js" });

  const harness = context.__coldWarHarness;
  const sourceQuestion = (chrono.questions || []).find((question) =>
    /cold war|containment|korea|vietnam|soviet|communis|nuclear|berlin|cuban|nato|warsaw|iron curtain|truman doctrine|marshall plan|space race|proxy|arms race|brinkmanship|ussr/i.test([
      question.course,
      question.set,
      question.prompt,
      question.stem,
      question.answer,
      question.explanation,
      ...(question.tags || [])
    ].join(" ")) &&
    harness.sourceBasedQuestion(question) &&
    harness.hasRenderableSource(question)
  );

  if (!sourceQuestion) {
    errors.push("No source-backed Cold War question found for render-contract test.");
  } else {
    harness.state.bank = chrono.questions || [];
    const normalized = harness.normalizeQuestion(sourceQuestion);
    if (!normalized?.sourceImages?.length && !normalized?.sourceText) {
      errors.push(`${sourceQuestion.id}: normalizeQuestion did not preserve source images/text.`);
    }
    harness.renderQuestionSource(normalized);
    const sourceBox = harness.els.questionSource;
    if (sourceBox.classList.contains("hidden")) errors.push(`${sourceQuestion.id}: source panel stayed hidden.`);
    if (!/<img\b|<p>/.test(sourceBox.innerHTML)) errors.push(`${sourceQuestion.id}: source panel did not render source content.`);
  }

  const unsafe = {
    id: "synthetic-source-without-asset",
    type: "mcq",
    course: "Cold War Core",
    set: "Source Contract",
    prompt: "Based on this passage, which conclusion is best supported?",
    stimulusRequired: true,
    choices: [
      { label: "A", text: "Containment" },
      { label: "B", text: "Isolationism" },
      { label: "C", text: "Appeasement" },
      { label: "D", text: "Neutrality" }
    ],
    correct: "A"
  };
  if (harness.isPlayableQuestion(unsafe)) {
    errors.push("Cold War Invaders accepted a source-dependent prompt with no renderable source.");
  }
}

if (errors.length) {
  console.error(`Cold War Invaders source render validation failed (${errors.length} issues):`);
  errors.forEach((error) => console.error("-", error));
  process.exit(1);
}

console.log("OK: Cold War Invaders source render contract passed.");
