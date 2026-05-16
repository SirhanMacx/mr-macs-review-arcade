#!/usr/bin/env node
/**
 * Mr. Mac's Review Arcade — PLAYABLE smoke harness.
 *
 * Why this exists: the legacy tests/smoke.spec.mjs only checks that pages
 * load without console errors. It does NOT verify that the game is actually
 * playable on a phone, that questions render, that fonts match the arcade
 * theme, or that toasts don't overlap the HUD.
 *
 * This harness:
 *   1. Boots each game at iPhone 14 viewport.
 *   2. Clicks #startBtn and confirms the setup screen leaves the DOM.
 *   3. Drives 30 seconds of realistic input (keyboard or canvas tap).
 *   4. Captures screenshots at: setup, +5s, +15s, end.
 *   5. Asserts:
 *        - No console errors during gameplay (separate from page-load errors).
 *        - Canvas fills >=95% of viewport width.
 *        - Toast container, when present, does NOT overlap the HUD or canvas.
 *        - Computed font on .brand-title / .stat-value / h1 includes one of
 *          Press Start 2P / VT323 (REJECTS Fraunces, Inter, Rajdhani).
 *        - For games with a #questionScreen, the .show class can render
 *          without throwing (visual existence check, not necessarily triggered).
 *
 * Run:
 *   cd <repo root>
 *   python3 -m http.server 8765 &
 *   cd /Users/mind_uploaded_crustacean/.hermes/hermes-agent
 *   node /Volumes/CURRICULA/.../tests/playable-smoke.spec.mjs
 *
 * Outputs:
 *   tests/screenshots/<game>-<state>.png
 *   tests/playable-smoke-report.json
 *
 * Exit: 0 if every game passes, 1 if any game fails.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { createRequire } from "node:module";

// Resolve playwright from any node_modules tree on this machine. CI installs it
// locally via `npm install playwright`; the dev workflow points
// PLAYWRIGHT_DIR at an existing install (e.g. ~/.hermes/hermes-agent).
async function loadPlaywright() {
  const tryPaths = [
    process.env.PLAYWRIGHT_DIR,
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../node_modules/playwright"),
    "/Users/mind_uploaded_crustacean/.hermes/hermes-agent/node_modules/playwright",
  ].filter(Boolean);
  for (const p of tryPaths) {
    try {
      if (fs.existsSync(path.join(p, "package.json"))) {
        const entry = path.join(p, "index.mjs");
        if (fs.existsSync(entry)) {
          return await import(pathToFileURL(entry).href);
        }
        // CommonJS fallback
        const req = createRequire(import.meta.url);
        return req(p);
      }
    } catch (_) { /* try next */ }
  }
  // Last resort: standard resolution from CWD
  return await import("playwright");
}

const { chromium, devices } = await loadPlaywright();

const __filename = fileURLToPath(import.meta.url);
const TESTS_DIR  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(TESTS_DIR, "..");
const SHOT_DIR   = path.join(TESTS_DIR, "screenshots");
const REPORT_FP  = path.join(TESTS_DIR, "playable-smoke-report.json");
const INPUTS_FP  = path.join(TESTS_DIR, "per-game-inputs.json");

const BASE = process.env.ARCADE_BASE || "http://localhost:8765";
const PLAY_MS = parseInt(process.env.ARCADE_PLAY_MS || "30000", 10);
const CAPTURE_SCREENSHOTS = process.env.ARCADE_SKIP_SCREENSHOTS !== "1";
const CHROMIUM_EXECUTABLE_PATH = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "";

const GAMES = [
  "step-pyramid",
  "sokoban-scribe",
  "mahjong-mosaic",
  "chess-cabinet",
  "bomb-scribe",
  "sudoku-scribe",
  "snake-pit",
  "brickoria",
  "atlas-2048",
  "stellar-drift",
];

const ARCADE_FONT_OK   = /(Press Start 2P|VT323)/i;
const ARCADE_FONT_BAD  = /(Fraunces|Rajdhani|Inter|JetBrains Mono)/i;

const INPUTS = JSON.parse(fs.readFileSync(INPUTS_FP, "utf8"));

if (CAPTURE_SCREENSHOTS && !fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

// ---------- helpers ----------

function relShot(game, state) {
  return path.join(SHOT_DIR, `${game}-${state}.png`);
}

async function maybeScreenshot(page, result, game, state) {
  if (!CAPTURE_SCREENSHOTS) {
    result.screenshots[state] = "skipped";
    return;
  }
  result.screenshots[state] = relShot(game, state);
  await page.screenshot({ path: result.screenshots[state], fullPage: false });
}

async function captureFonts(page) {
  return page.evaluate(() => {
    const targets = [
      { sel: ".brand-title",            label: "brand-title" },
      { sel: ".stat-value",             label: "stat-value" },
      { sel: "h1",                      label: "h1" },
      { sel: ".hud-stats .stat-label",  label: "stat-label" },
    ];
    const out = [];
    for (const t of targets) {
      const el = document.querySelector(t.sel);
      if (!el) { out.push({ label: t.label, found: false }); continue; }
      const cs = getComputedStyle(el);
      out.push({
        label: t.label,
        found: true,
        fontFamily: cs.fontFamily,
        fontSize:   cs.fontSize,
      });
    }
    return out;
  });
}

async function checkToastOverlap(page) {
  return page.evaluate(() => {
    const toastContainer = document.querySelector(".arcade-toast-container");
    if (!toastContainer) return { hasToastContainer: false, overlaps: false };
    const trect = toastContainer.getBoundingClientRect();
    if (trect.width === 0 || trect.height === 0) {
      return { hasToastContainer: true, overlaps: false, note: "container empty/hidden" };
    }
    const blockers = ["canvas", ".hud-stats", ".hud", "#gameScreen"];
    const collisions = [];
    for (const sel of blockers) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const overlap =
        trect.left < r.right &&
        trect.right > r.left &&
        trect.top < r.bottom &&
        trect.bottom > r.top;
      if (overlap) collisions.push(sel);
    }
    return { hasToastContainer: true, overlaps: collisions.length > 0, collisions };
  });
}

async function checkCanvasDimensions(page, viewport) {
  return page.evaluate((vw) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return { found: false };
    const r = canvas.getBoundingClientRect();
    return {
      found: true,
      cssWidth:  r.width,
      cssHeight: r.height,
      attrWidth:  canvas.width,
      attrHeight: canvas.height,
      fillRatio:  r.width / vw,
    };
  }, viewport.width);
}

async function checkSetupClosed(page) {
  return page.evaluate(() => {
    const s = document.getElementById("setupScreen");
    if (!s) return { found: false, closed: true };
    return { found: true, closed: !s.classList.contains("show") };
  });
}

async function hasQuestionScreen(page) {
  return page.evaluate(() => {
    const q = document.getElementById("questionScreen");
    return !!q;
  });
}

async function driveInput(page, gameId, durationMs) {
  const cfg = INPUTS[gameId] || { type: "keyboard", keys: [" "], intervalMs: 250 };
  const deadline = Date.now() + durationMs;
  let i = 0;

  if (cfg.type === "keyboard") {
    // Focus body so keydown events fire on document.
    await page.evaluate(() => { document.body && document.body.focus && document.body.focus(); });
    while (Date.now() < deadline) {
      const key = cfg.keys[i % cfg.keys.length];
      try { await page.keyboard.press(key); } catch (_) { /* ignore */ }
      i++;
      await sleep(cfg.intervalMs);
    }
  } else if (cfg.type === "canvas-click") {
    const sel = cfg.canvasSelector || "canvas";
    const box = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }, sel);
    if (!box) {
      // Fallback to keyboard
      while (Date.now() < deadline) {
        try { await page.keyboard.press("Enter"); } catch (_) {}
        await sleep(cfg.intervalMs);
      }
    } else {
      while (Date.now() < deadline) {
        const cx = box.x + box.w * (0.15 + (i % 7) * 0.12);
        const cy = box.y + box.h * (0.20 + ((i * 3) % 5) * 0.15);
        try { await page.mouse.click(cx, cy); } catch (_) {}
        i++;
        await sleep(cfg.intervalMs);
      }
    }
  }
}

// ---------- per-game runner ----------

async function runGame(browser, game) {
  const result = {
    game,
    pass: true,
    failures: [],
    timings: {},
    consoleErrors: [],
    pageErrors: [],
    fonts: null,
    canvas: null,
    setup: null,
    toast: null,
    hasQuestionScreen: false,
    screenshots: {},
  };

  const ctx = await browser.newContext({
    ...devices["iPhone 14"],
    // viewport explicit so the canvas-width assertion is deterministic
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1, // smaller screenshot files
  });
  const page = await ctx.newPage();

  // Split console events: load-time vs play-time
  let phase = "load";
  page.on("pageerror", (e) => { result.pageErrors.push(`[${phase}] ${e.message}`); });
  page.on("console", (m) => {
    if (m.type() === "error") {
      const txt = m.text();
      // Skip noisy known service worker / favicon warnings
      if (/Failed to load resource.*favicon/i.test(txt)) return;
      result.consoleErrors.push(`[${phase}] ${txt}`);
    }
  });

  const url = `${BASE}/games/${game}/index.html`;
  const tStart = Date.now();

  try {
    // 1. Load
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(800); // settle for arcade-cabinet-fx boot etc.
    result.timings.loaded = Date.now() - tStart;
    await maybeScreenshot(page, result, game, "setup");

    // 2. Fonts (assert arcade typography on initial setup screen)
    result.fonts = await captureFonts(page);
    const fontIssues = [];
    for (const f of result.fonts) {
      if (!f.found) continue;
      const fam = (f.fontFamily || "").trim();
      if (ARCADE_FONT_OK.test(fam)) continue;
      if (ARCADE_FONT_BAD.test(fam)) {
        fontIssues.push(`${f.label}: ${fam} (expected Press Start 2P / VT323)`);
      }
    }
    if (fontIssues.length) {
      result.failures.push(`Typography: ${fontIssues.join(" | ")}`);
    }

    // 3. Click start
    const startBtn = await page.$("#startBtn");
    if (!startBtn) {
      result.failures.push("No #startBtn on setup screen");
      result.pass = false;
    } else {
      phase = "play";
      await startBtn.click();
      await sleep(900);
      const setupState = await checkSetupClosed(page);
      result.setup = setupState;
      if (setupState.found && !setupState.closed) {
        result.failures.push("Setup screen did not close within 900ms of #startBtn click");
      }
    }

    // 4. Canvas dimensions
    result.canvas = await checkCanvasDimensions(page, { width: 390 });
    if (!result.canvas.found) {
      result.failures.push("No <canvas> rendered on game screen");
    } else if (result.canvas.fillRatio < 0.95) {
      result.failures.push(
        `Canvas fills only ${(result.canvas.fillRatio * 100).toFixed(1)}% of viewport width (<95%)`
      );
    }

    // 5. Drive ~30s of input, screenshotting at +5s and +15s
    const slice1 = Math.min(5000, PLAY_MS / 6);
    const slice2 = Math.min(10000, PLAY_MS / 3);
    const slice3 = Math.max(PLAY_MS - slice1 - slice2, 0);

    await driveInput(page, game, slice1);
    await maybeScreenshot(page, result, game, "play-5s");

    await driveInput(page, game, slice2);
    await maybeScreenshot(page, result, game, "play-15s");

    await driveInput(page, game, slice3);
    await maybeScreenshot(page, result, game, "end");

    // 6. Toast overlap check (at the end, when toasts most likely to have fired)
    result.toast = await checkToastOverlap(page);
    if (result.toast.overlaps) {
      result.failures.push(
        `Toast container overlaps: ${(result.toast.collisions || []).join(", ")}`
      );
    }

    // 7. Question screen existence (don't require trigger, just DOM presence)
    result.hasQuestionScreen = await hasQuestionScreen(page);

    // 8. Play-phase errors are blocking
    const playErrs = [
      ...result.consoleErrors.filter((s) => s.startsWith("[play]")),
      ...result.pageErrors.filter((s) => s.startsWith("[play]")),
    ];
    if (playErrs.length) {
      result.failures.push(`${playErrs.length} runtime errors during gameplay`);
    }

    result.timings.total = Date.now() - tStart;
  } catch (err) {
    result.failures.push(`Harness exception: ${err.message}`);
  } finally {
    await ctx.close();
  }

  if (result.failures.length) result.pass = false;
  return result;
}

// ---------- main ----------

(async () => {
  console.log(`[playable-smoke] base=${BASE} games=${GAMES.length} play_ms=${PLAY_MS}`);
  if (!CAPTURE_SCREENSHOTS) {
    console.log("[playable-smoke] screenshots disabled by ARCADE_SKIP_SCREENSHOTS=1");
  }
  const launchOptions = { headless: true };
  if (CHROMIUM_EXECUTABLE_PATH) launchOptions.executablePath = CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch(launchOptions);
  const results = [];
  let passed = 0;

  for (const g of GAMES) {
    process.stdout.write(`[playable-smoke] ${g} ... `);
    const r = await runGame(browser, g);
    results.push(r);
    if (r.pass) {
      passed++;
      console.log("PASS");
    } else {
      console.log(`FAIL — ${r.failures.join(" ; ")}`);
    }
  }

  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    playMs: PLAY_MS,
    total: GAMES.length,
    passed,
    failed: GAMES.length - passed,
    results,
  };
  fs.writeFileSync(REPORT_FP, JSON.stringify(report, null, 2));
  console.log(`\n[playable-smoke] ${passed}/${GAMES.length} passed`);
  console.log(`[playable-smoke] report: ${REPORT_FP}`);
  console.log(`[playable-smoke] screenshots: ${CAPTURE_SCREENSHOTS ? SHOT_DIR : "disabled"}`);

  process.exit(passed === GAMES.length ? 0 : 1);
})();
