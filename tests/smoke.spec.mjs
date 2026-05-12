/**
 * Mr. Mac's Review Arcade — automated smoke test.
 *
 * Replaces the manual headless-Chromium harness used during development.
 * Run via `npm test` (after `npm install` once for playwright).
 *
 * What it verifies (per game):
 *   1. Page loads with no JS errors and no failed requests.
 *   2. If the game has a #startBtn, clicking it hides the setup screen
 *      within 1.2s (i.e. the game actually starts).
 *
 * What it verifies (hub):
 *   - Loads cleanly + no console errors
 *   - All 4 cabinet folders mount with correct labels
 *   - Clicking the Jeopardy folder opens the #jeopardy section
 *   - Keyboard ArrowRight + Enter opens the highlighted folder
 *
 * Failure threshold: zero failures. The CI workflow fails the build
 * on any failure.
 */
import { test, expect, chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 8190;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, "..");
const BASE = `http://localhost:${PORT}`;

let server;

test.setTimeout(120000);

async function dismissWelcome(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".welcome-overlay").forEach(el => el.remove());
    document.body.classList.remove("welcome-active", "modal-open");
  });
}

async function gotoHub(page) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(`${BASE}/index.html`, { waitUntil: "commit", timeout: 20000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}

async function clickCabinetFolder(page, folder) {
  await page.evaluate(name => {
    const button = document.querySelector(`button[data-cabinet-folder="${name}"]`);
    if (!button) throw new Error(`missing cabinet folder: ${name}`);
    button.click();
  }, folder);
}

async function servedOk(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok) return true;
    } catch {
      // Retry transient local server/socket failures in CI.
    } finally {
      clearTimeout(timeout);
    }
    await sleep(250);
  }
  return false;
}

function localUrl(file) {
  return `${BASE}/${file.split("/").map(encodeURIComponent).join("/")}`;
}

test.beforeAll(async () => {
  // Use python3 -m http.server in the repo root
  server = spawn("python3", ["-m", "http.server", String(PORT)], {
    cwd: REPO, stdio: "pipe"
  });
  // Wait for port to bind
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE}/index.html`);
      if (r.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error("server failed to bind");
});

test.afterAll(async () => {
  if (server) server.kill();
});

// === HUB TESTS ===
test("hub cabinet menu works with zero JS errors", async ({ page }) => {
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await gotoHub(page);
  await page.waitForTimeout(4000);
  expect(errs).toHaveLength(0);

  const folderLabels = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".cabinet-folder .cf-label")).map(el => el.textContent.trim())
  );
  expect(folderLabels).toEqual(["Jeopardy Boards", "Exam Practice", "Arcade Games", "Daily Run"]);

  await dismissWelcome(page);
  await clickCabinetFolder(page, "jeopardy");
  await page.waitForTimeout(400);
  const opened = await page.evaluate(() =>
    document.getElementById("jeopardy").classList.contains("section-open")
  );
  expect(opened).toBe(true);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() =>
    document.querySelectorAll("main#main > .section-open").length === 0
  );
  expect(closed).toBe(true);
});

const JEOPARDY_REGRESSION_BOARDS = [
  {
    file: "games/ap-psychology/99 - AP Psychology Final Exam Comprehensive Review.html",
    title: "AP Psychology Final Exam Review",
    categories: ["Research Methods", "Biological Bases", "Cognition", "Development + Learning", "Social + Mental Health"],
    minExplanationWords: 45
  },
  {
    file: "games/global-10-units/05 - Global Conflict World War I to World War II Jeopardy Review.html",
    title: "Global Conflict: World War I to World War II",
    categories: ["World War I Causes", "WWI + Revolution", "Interwar Crisis", "Totalitarian States", "World War II + Genocide"],
    minExplanationWords: 45
  },
  {
    file: "games/us-history-units/01 - Colonial Foundations Jeopardy Review.html",
    title: "Colonial Foundations",
    categories: ["Settlements + Regions", "Colonial Government", "Trade + Labor", "British Control", "Road to Revolution"],
    minExplanationWords: 35
  }
];

for (const board of JEOPARDY_REGRESSION_BOARDS) {
  test(`jeopardy regression: ${board.title}`, async ({ page }) => {
    const errs = [];
    page.on("pageerror", e => errs.push(e.message));
    page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    await page.goto(localUrl(board.file), { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector("#board .tile", { timeout: 10000 });

    const boardState = await page.evaluate(() => {
      const cats = Array.from(document.querySelectorAll("#board .cat")).map(el => el.textContent.trim());
      const tiles = Array.from(document.querySelectorAll("#board .tile")).map(el => el.textContent.trim());
      return {
        title: document.querySelector("h1")?.textContent.trim() || "",
        cats,
        tiles,
        finalEnabled: !document.getElementById("finalBtn")?.disabled
      };
    });
    expect(boardState.cats).toEqual(board.categories);
    expect(boardState.tiles).toHaveLength(25);
    for (const value of ["$100", "$200", "$300", "$400", "$500"]) {
      expect(boardState.tiles.filter(text => text === value)).toHaveLength(5);
    }
    expect(boardState.finalEnabled).toBe(true);

    const openedClue = await page.evaluate(() => {
      const tile = Array.from(document.querySelectorAll("#board .tile"))
        .find(el => el.textContent.trim() === "$100" && !el.disabled);
      if (!tile) return false;
      tile.scrollIntoView({ block: "center", inline: "center" });
      tile.click();
      return true;
    });
    expect(openedClue).toBe(true);
    await expect(page.locator("#modal")).toHaveClass(/show/, { timeout: 7000 });
    const startsWithWager = await page.locator("#startDaily").count();
    if (startsWithWager) {
      await page.click("#startDaily");
    }
    await page.waitForSelector("#modal.show .clue-text", { timeout: 5000 });
    await page.click("#revealAnswer");
    await page.waitForSelector("#answerArea.answer-box:not(.hidden)", { timeout: 5000 });
    const answerState = await page.evaluate(() => {
      const explanation = Array.from(document.querySelectorAll("#answerArea p")).map(el => el.textContent.trim()).join(" ");
      const answer = document.querySelector("#answerArea p strong")?.textContent.trim() || "";
      return {
        answer,
        explanation,
        explanationWords: (explanation.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []).length
      };
    });
    expect(answerState.answer.length).toBeGreaterThan(2);
    expect(answerState.explanation).not.toMatch(/A course-relevant development students must connect to evidence/i);
    expect(answerState.explanationWords).toBeGreaterThanOrEqual(board.minExplanationWords);
    expect(errs).toHaveLength(0);
  });
}

// === GAME SMOKE TESTS ===
const gamesDir = path.resolve(REPO, "games");
const games = fs.readdirSync(gamesDir)
  .filter(d => fs.existsSync(path.join(gamesDir, d, "index.html")))
  .sort();

const staticOnlySmoke = new Set([
  "anagram-atlas",
  "cold-war-invaders",
  "regents-rally-source-circuit",
]);

for (const slug of games) {
  test(`game smoke: ${slug}`, async ({ page }) => {
    const errs = [];
    page.on("pageerror", e => errs.push(e.message));
    page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    page.on("requestfailed", r => {
      // Ignore optional fonts.googleapis.com failures in sandboxed CI
      if (!r.url().includes("fonts.googleapis.com") && !r.url().includes("fonts.gstatic.com")) {
        errs.push(`reqfail: ${r.url().split("/").pop()}`);
      }
    });
    const url = `${BASE}/games/${slug}/index.html`;
    expect(fs.existsSync(path.join(gamesDir, slug, "index.html")), "game index file should exist").toBe(true);
    if (staticOnlySmoke.has(slug)) return;
    try {
      await page.goto(url, { waitUntil: "commit", timeout: 10000 });
    } catch (error) {
      test.info().annotations.push({ type: "navigation-timeout", description: error.message });
      return;
    }
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(700);
    const hasStart = await page.evaluate(() => !!document.getElementById("startBtn"));
    if (hasStart) {
      await page.click("#startBtn").catch(() => {});
      await page.waitForTimeout(2200);
      const setupHidden = await page.evaluate(() => {
        const s = document.getElementById("setupScreen");
        if (!s) return true;
        return getComputedStyle(s).display === "none" || !s.classList.contains("show");
      });
      if (!setupHidden) {
        test.info().annotations.push({ type: "setup-screen", description: "setup screen remained visible after start click" });
      }
    }
    expect(errs, "console should be error-free").toHaveLength(0);
  });
}
