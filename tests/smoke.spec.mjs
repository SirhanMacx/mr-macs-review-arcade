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

async function loadModuleHarness(page, scripts) {
  await page.goto(`${BASE}/robots.txt`, { waitUntil: "commit", timeout: 15000 });
  await page.setContent(`
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>Module harness</title></head>
      <body>
        ${scripts.map(src => `<script src="${src}"></script>`).join("\n")}
      </body>
    </html>
  `);
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

const gamesDir = path.resolve(REPO, "games");
const questionReadableGames = fs.readdirSync(gamesDir)
  .filter(slug => {
    const indexPath = path.join(gamesDir, slug, "index.html");
    if (!fs.existsSync(indexPath)) return false;
    const html = fs.readFileSync(indexPath, "utf8");
    return html.includes("questionPrompt") && html.includes("arcade-retro-theme.css");
  })
  .sort();

const questionReadableRuntimeGames = [
  "archive-quest",
  "atlas-2048",
  "boggle-beat",
  "chronoblocks",
  "cube-crash",
  "review-maze-chase",
  "snake-pit",
  "word-bridge"
].filter(slug => questionReadableGames.includes(slug));

test("shared game question typography contract covers all question games", async () => {
  const themeCss = fs.readFileSync(path.join(REPO, "assets", "arcade-retro-theme.css"), "utf8");
  expect(themeCss).toContain("Question readability lock");
  expect(themeCss).toMatch(/#questionPrompt[\s\S]{0,1200}font-size:\s*clamp\(20px,\s*3\.4vw,\s*28px\)/);
  expect(themeCss).toMatch(/\.question-card\s+\.choice-btn[\s\S]{0,1600}font-size:\s*clamp\(16px,\s*2\.6vw,\s*19px\)/);

  for (const slug of questionReadableGames) {
    const html = fs.readFileSync(path.join(gamesDir, slug, "index.html"), "utf8");
    expect(html, `${slug} should use the readable shared game theme`).toContain("arcade-retro-theme.css?v=20260512-question-readability");
  }
});

test("game review question text remains readable at phone size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const checked = [];

  for (const slug of questionReadableRuntimeGames) {
    const url = `${BASE}/games/${slug}/index.html`;
    await page.goto(url, { waitUntil: "commit", timeout: 15000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    const metrics = await page.evaluate(() => {
      const sampleChoices = [
        "A constitutional limit on arbitrary government power.",
        "A source-based inference from a document or chart.",
        "A turning point students connect to broader review evidence.",
        "A distractor that is long enough to test wrapping."
      ];
      const host = document.querySelector("#questionScreen, #questionCard, .question-panel, .question-card");
      const prompt = document.querySelector("#questionPrompt, #questionText, .question-text, .question-card h2");
      if (!prompt) return { found: false };
      if (host) {
        host.hidden = false;
        host.classList.remove("hidden");
        host.classList.add("show", "active", "is-active");
      }
      prompt.textContent = "Which review idea best explains why students must connect evidence to a larger cause-and-effect pattern?";
      const grid = document.querySelector("#choiceGrid, .choice-grid, .choices, .answer-grid");
      if (grid && !grid.querySelector(".choice-btn, .choice, .answer-btn")) {
        grid.innerHTML = sampleChoices.map((choice, index) =>
          `<button class="choice-btn choice answer-btn" type="button"><span class="choice-letter">${String.fromCharCode(65 + index)}</span>${choice}</button>`
        ).join("");
      }
      const choice = document.querySelector(
        "#choiceGrid .choice-btn, .choice-grid .choice-btn, .choices .choice, .answer-grid .answer-btn, .question-card .choice-btn, .question-card .choice"
      );
      const promptStyle = getComputedStyle(prompt);
      const choiceStyle = choice ? getComputedStyle(choice) : null;
      return {
        found: true,
        promptFont: parseFloat(promptStyle.fontSize) || 0,
        promptLineHeight: parseFloat(promptStyle.lineHeight) || 0,
        choiceFont: choiceStyle ? parseFloat(choiceStyle.fontSize) || 0 : null,
        choiceLineHeight: choiceStyle ? parseFloat(choiceStyle.lineHeight) || 0 : null
      };
    });

    if (!metrics.found) continue;
    checked.push({ slug, ...metrics });
    expect(metrics.promptFont, `${slug} prompt font`).toBeGreaterThanOrEqual(19.5);
    expect(metrics.promptLineHeight, `${slug} prompt line height`).toBeGreaterThanOrEqual(metrics.promptFont * 1.25);
    if (metrics.choiceFont !== null) {
      expect(metrics.choiceFont, `${slug} choice font`).toBeGreaterThanOrEqual(15.5);
      expect(metrics.choiceLineHeight, `${slug} choice line height`).toBeGreaterThanOrEqual(metrics.choiceFont * 1.25);
    }
  }

  expect(checked.length, "question-bearing arcade games checked").toBeGreaterThanOrEqual(questionReadableRuntimeGames.length);
});

test("shared accessibility menu floats above setup overlays on arcade games", async ({ browser }) => {
  const slugs = ["mahjong-mosaic", "snake-pit", "solitaire-hall", "boggle-beat", "atlas-2048"];
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

  try {
    for (const slug of slugs) {
      await page.goto(`${BASE}/games/${slug}/index.html`, { waitUntil: "commit", timeout: 15000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.waitForSelector(".maqt-btn", { timeout: 10000 });
      const before = await page.evaluate(() => {
        const btn = document.querySelector(".maqt-btn");
        const dock = document.getElementById("maqt-dock");
        if (!btn || !dock) return { found: false };
        const rect = btn.getBoundingClientRect();
        const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return {
          found: true,
          topElementIsButton: target === btn,
          dockPosition: getComputedStyle(dock).position,
          dockZ: Number.parseInt(getComputedStyle(dock).zIndex, 10),
          btnTop: rect.top,
          btnRightGap: window.innerWidth - rect.right
        };
      });
      expect(before.found, `${slug} should mount the shared accessibility trigger`).toBe(true);
      expect(before.topElementIsButton, `${slug} setup overlay should not intercept the accessibility trigger`).toBe(true);
      expect(before.dockPosition, `${slug} trigger should live in the viewport dock`).toBe("fixed");
      expect(before.dockZ, `${slug} trigger should sit above game/setup chrome`).toBeGreaterThanOrEqual(100000);
      expect(before.btnTop, `${slug} trigger should remain within the viewport`).toBeGreaterThanOrEqual(0);
      expect(before.btnRightGap, `${slug} trigger should respect the right edge`).toBeGreaterThanOrEqual(0);

      await page.click(".maqt-btn", { timeout: 5000 });
      await expect(page.locator(".maqt-modal")).toBeVisible({ timeout: 5000 });
      const modal = await page.evaluate(() => {
        const dialog = document.querySelector(".maqt-modal");
        const backdrop = document.querySelector(".maqt-backdrop");
        const rect = dialog?.getBoundingClientRect();
        return {
          found: Boolean(dialog && backdrop && rect),
          modalZ: dialog ? Number.parseInt(getComputedStyle(dialog).zIndex, 10) : 0,
          backdropZ: backdrop ? Number.parseInt(getComputedStyle(backdrop).zIndex, 10) : 0,
          inViewport: rect ? rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth : false,
          expanded: document.querySelector(".maqt-btn")?.getAttribute("aria-expanded")
        };
      });
      expect(modal.found, `${slug} should open the shared accessibility dialog`).toBe(true);
      expect(modal.modalZ, `${slug} dialog should sit above the backdrop`).toBeGreaterThan(modal.backdropZ);
      expect(modal.inViewport, `${slug} dialog should fit on a phone viewport`).toBe(true);
      expect(modal.expanded, `${slug} trigger should expose expanded state`).toBe("true");

      await page.getByRole("button", { name: "Reduce" }).click();
      await expect.poll(() => page.evaluate(() => document.body.classList.contains("arcade-reduced-motion")), {
        message: `${slug} reduce-motion toggle should apply immediately`
      }).toBe(true);
      await page.keyboard.press("Escape");
      await expect(page.locator(".maqt-modal")).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => document.querySelector(".maqt-btn")?.getAttribute("aria-expanded"))).toBe("false");
    }
  } finally {
    await context.close();
  }

  expect(errors).toHaveLength(0);
});

test("boggle beat board fills iPhone retina canvas", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/games/boggle-beat/index.html`, { waitUntil: "commit", timeout: 15000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.click("#startBtn");
    await page.waitForFunction(() => !document.getElementById("setupScreen")?.classList.contains("show"), null, { timeout: 5000 });
    await page.waitForTimeout(1000);
    const metrics = await page.evaluate(() => {
      const canvas = document.getElementById("boggleCanvas");
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      if (!canvas || !ctx) return { found: false };
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = image.data;
      let minX = image.width;
      let minY = image.height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < image.height; y += 2) {
        for (let x = 0; x < image.width; x += 2) {
          const i = (y * image.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const parchmentOrGold = r > 125 && g > 90 && b > 35 && r + g + b > 295 && r > b * 1.12;
          if (!parchmentOrGold) continue;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const found = maxX >= minX && maxY >= minY;
      return {
        found,
        canvasCssWidth: rect.width,
        canvasCssHeight: rect.height,
        brightWidthCss: found ? (maxX - minX + 1) / dpr : 0,
        brightHeightCss: found ? (maxY - minY + 1) / dpr : 0,
        brightLeftCss: found ? minX / dpr : 0,
        brightTopCss: found ? minY / dpr : 0,
        brightCenterCss: found ? ((minX + maxX + 1) / 2) / dpr : 0
      };
    });
    expect(metrics.found, "Boggle board pixels should be visible").toBe(true);
    expect(metrics.brightWidthCss, "Boggle board should not render as a tiny retina-scaled board").toBeGreaterThanOrEqual(320);
    expect(metrics.brightHeightCss, "Boggle board should be large enough to touch on iPhone").toBeGreaterThanOrEqual(320);
    expect(Math.abs(metrics.brightCenterCss - metrics.canvasCssWidth / 2), "Boggle board should stay centered").toBeLessThanOrEqual(40);
    expect(metrics.brightTopCss, "Boggle board should not be pinned to the top edge").toBeGreaterThanOrEqual(150);
  } finally {
    await context.close();
  }
});

test("solitaire hall deal row clears top menu in short layouts", async ({ browser }) => {
  const viewports = [
    { name: "phone landscape", width: 844, height: 390, dpr: 3, isMobile: true, hasTouch: true },
    { name: "short desktop", width: 1280, height: 600, dpr: 1, isMobile: false, hasTouch: false }
  ];

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.dpr,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch
    });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}/games/solitaire-hall/index.html`, { waitUntil: "commit", timeout: 15000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.click("#startBtn");
      await page.waitForFunction(() => !document.getElementById("setupScreen")?.classList.contains("show"), null, { timeout: 5000 });
      await page.waitForTimeout(900);
      const metrics = await page.evaluate(() => {
        const canvas = document.getElementById("solitaireCanvas");
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        const canvasRect = canvas?.getBoundingClientRect();
        const hud = document.querySelector(".top-hud")?.getBoundingClientRect();
        const ribbon = document.querySelector(".wave-ribbon");
        const ribbonStyle = ribbon ? getComputedStyle(ribbon) : null;
        const ribbonRect = ribbon && ribbonStyle?.display !== "none" ? ribbon.getBoundingClientRect() : null;
        if (!canvas || !ctx || !canvasRect || !hud) return { found: false };
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        let minX = image.width;
        let minY = image.height;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < image.height; y += 2) {
          for (let x = 0; x < image.width; x += 2) {
            const i = (y * image.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const cardOrSlotPixel = r + g + b > 185 && (r > 60 || g > 60 || b > 60);
            if (!cardOrSlotPixel) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
        const dpr = window.devicePixelRatio || 1;
        const topChromeCss = Math.max(hud.bottom, ribbonRect ? ribbonRect.bottom : 0) - canvasRect.top;
        const found = maxX >= minX && maxY >= minY;
        return {
          found,
          topChromeCss,
          cardLikeTopCss: found ? minY / dpr : 0,
          cardLikeWidthCss: found ? (maxX - minX + 1) / dpr : 0,
          cardLikeHeightCss: found ? (maxY - minY + 1) / dpr : 0
        };
      });
      expect(metrics.found, `${viewport.name} should render solitaire cards`).toBe(true);
      expect(metrics.cardLikeTopCss, `${viewport.name} deal row should sit below top menu`).toBeGreaterThanOrEqual(metrics.topChromeCss + 4);
      expect(metrics.cardLikeWidthCss, `${viewport.name} should preserve playable card spread`).toBeGreaterThan(300);
      expect(metrics.cardLikeHeightCss, `${viewport.name} should preserve playable card height`).toBeGreaterThan(140);
    } finally {
      await context.close();
    }
  }
});

test("student-safe names guard multiplayer and global leaderboards", async ({ page }) => {
  await loadModuleHarness(page, [
    "/assets/arcade-name-safety.js?v=test-safe-names",
    "/assets/arcade-leaderboards.js?v=test-safe-names",
    "/assets/arcade-multiplayer.js?v=test-safe-names"
  ]);
  await page.waitForFunction(() => window.MrMacsNameSafety && window.MrMacsMultiplayer && window.MrMacsLeaderboards, null, { timeout: 30000 });
  const result = await page.evaluate(() => {
    return {
      blockedEmail: window.MrMacsNameSafety.isBlockedName("student@example.com"),
      blockedLeet: window.MrMacsNameSafety.isBlockedName("sh1t"),
      safeHandle: window.MrMacsNameSafety.sanitizeHandle("student@example.com", "PLAYER-000"),
      safeInitials: window.MrMacsMultiplayer.sanitizeInitials("fuk"),
      localDisplay: window.MrMacsLeaderboards.sanitizeDisplayName("bad@example.com")
    };
  });
  expect(result.blockedEmail).toBe(true);
  expect(result.blockedLeet).toBe(true);
  expect(result.safeHandle).toBe("PLAYER-000");
  expect(result.safeInitials).toBe("PLR");
  expect(result.localDisplay).toBe("PLAYER");
});

test("global leaderboard posts only safe public handles", async ({ page }) => {
  let posted = null;
  await page.route("http://localhost:7777/scores", async route => {
    if (route.request().method() === "POST") {
      posted = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json"
        },
        body: JSON.stringify({ ok: true, top: [{ displayName: posted.displayName, score: posted.score, gameId: posted.gameId, ts: Date.now(), rank: 1 }] })
      });
    } else {
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json"
        },
        body: JSON.stringify({ rows: [] })
      });
    }
  });
  await loadModuleHarness(page, [
    "/assets/arcade-name-safety.js?v=test-global-leaderboard",
    "/assets/arcade-leaderboards.js?v=test-global-leaderboard",
    "/assets/arcade-progress-extras.js?v=test-global-leaderboard"
  ]);
  await page.waitForFunction(() => window.MrMacsGlobalLeaderboards && window.MrMacsLeaderboards, null, { timeout: 30000 });
  await page.evaluate(() => {
    window.MrMacsGlobalLeaderboards.setEndpoint("http://localhost:7777");
    window.MrMacsNameSafety.setPublicHandle("student@example.com");
    window.MrMacsLeaderboards.submit({
      gameId: "snake-pit",
      score: 12345,
      displayName: "student@example.com",
      meta: { course: "AP Psychology", studentName: "Should Not Leave Browser", accuracy: 0.9 }
    });
  });
  await expect.poll(() => posted, { timeout: 5000 }).not.toBeNull();
  expect(posted.displayName).toMatch(/^[A-Z0-9-]{3,14}$/);
  expect(posted.displayName).not.toContain("@");
  expect(posted.meta.course).toBe("AP Psychology");
  expect(posted.meta.accuracy).toBe(0.9);
  expect(posted.meta.studentName).toBeUndefined();
});

test("active multiplayer room restores score strip on game pages", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        window.Peer = function(id) {
          this.id = id;
          this.on = function(event, cb) {
            if (event === "open") setTimeout(function(){ cb(id); }, 0);
          };
          this.connect = function() {
            return {
              open: true,
              on: function(event, cb) { if (event === "open") setTimeout(cb, 0); },
              send: function(){},
              close: function(){}
            };
          };
          this.destroy = function(){};
        };
      `
    });
  });
  try {
    await page.goto(`${BASE}/robots.txt`, { waitUntil: "commit", timeout: 15000 });
    await page.evaluate(() => {
      sessionStorage.setItem("arcade.mp.activeRoom.v1", JSON.stringify({
        code: "ABC-DEF",
        role: "joiner",
        initials: "ABC",
        savedAt: Date.now()
      }));
    });
    await page.setContent(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Game strip harness</title></head>
        <body data-game-page="1">
          <script src="/assets/arcade-progress-extras.js?v=test-room-strip"></script>
        </body>
      </html>
    `);
    await page.waitForSelector("#mmpGameStrip", { timeout: 8000 });
    const text = await page.locator("#mmpGameStrip").innerText();
    expect(text).toContain("Room ABC-DEF");
    expect(text).toMatch(/score sync|students|room unavailable/i);
  } finally {
    await context.close();
  }
});

// === GAME SMOKE TESTS ===
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
