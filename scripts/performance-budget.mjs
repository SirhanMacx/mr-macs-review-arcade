#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "test-results", "performance-budget");
const reportPath = path.join(outDir, "report.json");
const gamesPath = path.join(root, "games.json");

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || "1"];
}));

const base = normalizeBase(process.env.ARCADE_BASE || args.get("base") || "http://127.0.0.1:8765");
const budgets = {
  hubInteractiveMs: Number(process.env.ARCADE_BUDGET_HUB_MS || args.get("hub-ms") || 10000),
  gameStartMs: Number(process.env.ARCADE_BUDGET_GAME_MS || args.get("game-ms") || 15000),
  localAssetFailures: Number(process.env.ARCADE_BUDGET_LOCAL_ASSET_FAILURES || args.get("local-asset-failures") || 0),
};

const requiredTargets = [
  { name: "schoolcraft", selectors: ["schoolcraft"], optional: false },
  { name: "block-blast", selectors: ["block-blast"], optional: true },
  { name: "generated-practice-exam", selectors: ["generated-practice-exam", "regents-practice-exam", "ap-practice-exam"], optional: false },
  { name: "word-bridge", selectors: ["word-bridge"], optional: true },
];

const startSelectors = [
  "[data-quiz-gauntlet-start]",
  "#startBtn",
  "#startGame",
  "#playBtn",
  "#beginBtn",
  "#dealBtn",
  ".start-btn",
  ".play-btn",
  ".course-unit-card",
  "canvas",
];

const startTextPatterns = [
  "start",
  "play",
  "begin",
  "launch",
  "deal",
  "new game",
  "continue",
  "practice",
  "open",
];

function normalizeBase(value) {
  return String(value || "").replace(/\/+$/, "");
}

function urlFor(file) {
  return `${base}/${String(file).replace(/^\/+/, "")}`;
}

function readGames() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  if (!Array.isArray(games)) throw new Error("games.json must contain an array");
  return games;
}

function resolveTargets(games) {
  return requiredTargets.map((target) => {
    const entry = target.selectors
      .map((id) => games.find((game) => game.id === id))
      .find(Boolean);
    if (!entry) {
      return {
        name: target.name,
        optional: target.optional,
        skipped: target.optional,
        skipReason: target.optional ? "not present in games.json" : "missing required representative entry",
      };
    }
    return {
      name: target.name,
      actualId: entry.id,
      title: entry.title,
      file: entry.file,
      optional: target.optional,
      mapped: entry.id !== target.name,
      skipped: false,
    };
  });
}

function isLocalRequestFailure(request) {
  try {
    const requestUrl = new URL(request.url());
    const baseUrl = new URL(base);
    return requestUrl.origin === baseUrl.origin && !requestUrl.pathname.endsWith("/favicon.ico");
  } catch {
    return false;
  }
}

async function waitForVisible(page, selectors, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const found = await page.evaluate((candidates) => {
      for (const selector of candidates) {
        const nodes = Array.from(document.querySelectorAll(selector));
        const visible = nodes.some((el) => {
          const style = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return style.visibility !== "hidden" && style.display !== "none" && box.width > 2 && box.height > 2;
        });
        if (visible) return selector;
      }
      return "";
    }, selectors).catch(() => "");
    if (found) return found;
    await page.waitForTimeout(100);
  }
  return "";
}

async function clickFirstVisible(page, selector) {
  const handle = await page.evaluateHandle((candidate) => {
    const nodes = Array.from(document.querySelectorAll(candidate));
    return nodes.find((el) => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && box.width > 2 && box.height > 2;
    }) || null;
  }, selector);
  const element = handle.asElement();
  if (!element) {
    await handle.dispose();
    return false;
  }
  try {
    await element.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
    await element.click({ timeout: 2000 });
    return true;
  } catch {
    return false;
  } finally {
    await handle.dispose();
  }
}

async function clickByText(page, patterns) {
  return await page.evaluate((sources) => {
    const regexes = sources.map((source) => new RegExp(source, "i"));
    const nodes = Array.from(document.querySelectorAll("button, a, [role='button'], input[type='button'], input[type='submit']"));
    for (const el of nodes) {
      const text = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim();
      if (!text || !regexes.some((regex) => regex.test(text))) continue;
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      if (style.visibility === "hidden" || style.display === "none" || box.width < 2 || box.height < 2) continue;
      el.click();
      return text;
    }
    return "";
  }, patterns);
}

async function clickStartSurface(page) {
  await clickByText(page, ["play in portrait anyway", "continue in portrait"]);
  for (const selector of startSelectors) {
    if (await clickFirstVisible(page, selector)) return selector;
  }
  return await clickByText(page, startTextPatterns);
}

async function collectPerf(page) {
  return await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");
    const fcp = paint.find((entry) => entry.name === "first-contentful-paint");
    const resources = performance.getEntriesByType("resource");
    return {
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
      transferBytes: Math.round(resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0)),
      resourceCount: resources.length,
      firstContentfulPaintMs: fcp ? Math.round(fcp.startTime) : null,
    };
  });
}

async function inspectPage(page) {
  return await page.evaluate(() => {
    const textLength = (document.body?.innerText || "").trim().length;
    const canvas = Array.from(document.querySelectorAll("canvas")).find((node) => {
      const box = node.getBoundingClientRect();
      return box.width > 10 && box.height > 10;
    });
    return {
      title: document.title,
      textLength,
      canvas: canvas ? {
        width: Math.round(canvas.getBoundingClientRect().width),
        height: Math.round(canvas.getBoundingClientRect().height),
      } : null,
      readyState: document.readyState,
    };
  });
}

async function runWithPage(browser, task) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const localRequestFailures = [];
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (isLocalRequestFailure(request)) localRequestFailures.push(request.url());
  });
  try {
    const result = await task(page);
    return { ...result, pageErrors, consoleErrors, localRequestFailures };
  } finally {
    await context.close();
  }
}

async function runHub(browser) {
  return await runWithPage(browser, async (page) => {
    const startedAt = Date.now();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: budgets.hubInteractiveMs + 5000 });
    const marker = await waitForVisible(page, [
      "[data-game-id]",
      ".game-card",
      "a[href*='games/']",
      "main",
    ], budgets.hubInteractiveMs);
    const interactiveMs = Date.now() - startedAt;
    const perf = await collectPerf(page);
    const inspect = await inspectPage(page);
    const failures = [];
    if (!marker) failures.push("hub did not expose an interactive marker");
    if (interactiveMs > budgets.hubInteractiveMs) failures.push(`hub interactive ${interactiveMs}ms exceeded ${budgets.hubInteractiveMs}ms`);
    return {
      kind: "hub",
      url: `${base}/`,
      pass: failures.length === 0,
      interactiveMs,
      marker,
      budgetMs: budgets.hubInteractiveMs,
      perf,
      inspect,
      failures,
    };
  });
}

async function runGame(browser, target) {
  if (target.skipped) return { kind: "game", ...target, pass: true };
  return await runWithPage(browser, async (page) => {
    const targetUrl = urlFor(target.file);
    const startedAt = Date.now();
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: budgets.gameStartMs + 5000 });
    const mountedSelector = await waitForVisible(page, [
      "#setupScreen",
      "main",
      "[data-game-page]",
      "canvas",
      "body",
    ], 5000);
    const action = await clickStartSurface(page);
    await page.waitForTimeout(750);
    const startMs = Date.now() - startedAt;
    const perf = await collectPerf(page);
    const inspect = await inspectPage(page);
    const failures = [];
    if (!mountedSelector) failures.push("game did not render a visible mount");
    if (startMs > budgets.gameStartMs) failures.push(`${target.name} start ${startMs}ms exceeded ${budgets.gameStartMs}ms`);
    if (!inspect.canvas && inspect.textLength < 40) failures.push("page looked blank after start attempt");
    return {
      kind: "game",
      ...target,
      url: targetUrl,
      pass: failures.length === 0,
      startMs,
      mountedSelector,
      action: action || "",
      budgetMs: budgets.gameStartMs,
      perf,
      inspect,
      failures,
    };
  });
}

function applyClearRegressionFailures(result) {
  const failures = [...(result.failures || [])];
  if ((result.pageErrors || []).length) failures.push(`page errors: ${result.pageErrors.length}`);
  if ((result.localRequestFailures || []).length > budgets.localAssetFailures) {
    failures.push(`local request failures: ${result.localRequestFailures.length}`);
  }
  return { ...result, failures, pass: result.pass && failures.length === 0 };
}

fs.mkdirSync(outDir, { recursive: true });

const games = readGames();
const targets = resolveTargets(games);
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  console.log(`[performance-budget] base=${base}`);
  const hub = applyClearRegressionFailures(await runHub(browser));
  results.push(hub);
  console.log(`${hub.pass ? "PASS" : "FAIL"} hub interactive=${hub.interactiveMs}ms budget=${hub.budgetMs}ms`);

  for (const target of targets) {
    const result = applyClearRegressionFailures(await runGame(browser, target));
    results.push(result);
    if (result.skipped) {
      console.log(`SKIP ${result.name}: ${result.skipReason}`);
    } else {
      const mapped = result.mapped ? ` actual=${result.actualId}` : "";
      console.log(`${result.pass ? "PASS" : "FAIL"} ${result.name}${mapped} start=${result.startMs}ms budget=${result.budgetMs}ms`);
    }
  }
} finally {
  await browser.close();
}

const failures = results.filter((result) => !result.pass);
const report = {
  generatedAt: new Date().toISOString(),
  base,
  budgets,
  summary: {
    runCount: results.filter((result) => !result.skipped).length,
    skipCount: results.filter((result) => result.skipped).length,
    passCount: results.filter((result) => result.pass && !result.skipped).length,
    failCount: failures.length,
  },
  targets: targets.map((target) => ({
    name: target.name,
    actualId: target.actualId || "",
    file: target.file || "",
    optional: target.optional,
    skipped: target.skipped,
    skipReason: target.skipReason || "",
  })),
  failures: failures.map((result) => ({
    kind: result.kind,
    name: result.name || "hub",
    actualId: result.actualId || "",
    failures: result.failures,
    pageErrors: result.pageErrors || [],
    localRequestFailures: result.localRequestFailures || [],
  })),
  results,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(`[performance-budget] report: ${path.relative(root, reportPath)}`);

if (failures.length) {
  console.error(`[performance-budget] ${failures.length} clear regression(s) exceeded the generous budget.`);
  process.exit(1);
}
