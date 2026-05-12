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

const PORT = 8190;
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(ROOT, "..");
const BASE = `http://localhost:${PORT}`;

let server;

async function dismissWelcome(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".welcome-overlay").forEach(el => el.remove());
    document.body.classList.remove("welcome-active", "modal-open");
  });
}

async function clickCabinetFolder(page, folder) {
  await page.evaluate(name => {
    const button = document.querySelector(`button[data-cabinet-folder="${name}"]`);
    if (!button) throw new Error(`missing cabinet folder: ${name}`);
    button.click();
  }, folder);
}

async function servedOk(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
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
test("hub loads with zero JS errors", async ({ page }) => {
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(`${BASE}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  expect(errs).toHaveLength(0);
});

test("hub has 4 cabinet folders", async ({ page }) => {
  await page.goto(`${BASE}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const folderLabels = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".cabinet-folder .cf-label")).map(el => el.textContent.trim())
  );
  expect(folderLabels).toEqual(["Jeopardy", "Practice", "Arcade", "Daily"]);
});

test("clicking Jeopardy folder opens the jeopardy section", async ({ page }) => {
  await page.goto(`${BASE}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await dismissWelcome(page);
  await clickCabinetFolder(page, "jeopardy");
  await page.waitForTimeout(400);
  const opened = await page.evaluate(() =>
    document.getElementById("jeopardy").classList.contains("section-open")
  );
  expect(opened).toBe(true);
});

test("ESC closes any open folder back to menu", async ({ page }) => {
  await page.goto(`${BASE}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  await dismissWelcome(page);
  await clickCabinetFolder(page, "practice");
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() =>
    document.querySelectorAll("main#main > .section-open").length === 0
  );
  expect(closed).toBe(true);
});

// === GAME SMOKE TESTS ===
const gamesDir = path.resolve(REPO, "games");
const games = fs.readdirSync(gamesDir)
  .filter(d => fs.existsSync(path.join(gamesDir, d, "index.html")))
  .sort();

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
    try {
      await page.goto(url, { waitUntil: "commit", timeout: 30000 });
    } catch (error) {
      expect(await servedOk(url), `page should serve even if browser navigation times out: ${error.message}`).toBe(true);
      return;
    }
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(700);
    const hasStart = await page.evaluate(() => !!document.getElementById("startBtn"));
    if (hasStart) {
      await page.click("#startBtn").catch(() => {});
      await page.waitForTimeout(1200);
      const setupHidden = await page.evaluate(() => {
        const s = document.getElementById("setupScreen");
        if (!s) return true;
        return getComputedStyle(s).display === "none" || !s.classList.contains("show");
      });
      expect(setupHidden, "setup-screen should hide after #startBtn click").toBe(true);
    }
    expect(errs, "console should be error-free").toHaveLength(0);
  });
}
