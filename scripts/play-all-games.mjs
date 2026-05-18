#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gamesDir = path.join(root, "games");
const outDir = path.join(root, "test-results", "play-all-games");
const reportPath = path.join(outDir, "report.json");

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || "1"];
}));

const base = process.env.ARCADE_BASE || args.get("base") || "http://127.0.0.1:8765";
const playMs = Number(process.env.ARCADE_PLAY_MS || args.get("play-ms") || 2200);
const filter = args.get("filter") || "";
const viewportMode = args.get("viewport") || "both";
const maxGames = Number(args.get("limit") || 0);
const saveScreenshots = args.get("screenshots") === "1";

const viewports = viewportMode === "both"
  ? [
      { name: "desktop", viewport: { width: 1280, height: 800 }, isMobile: false },
      { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true },
    ]
  : [viewportMode === "desktop"
      ? { name: "desktop", viewport: { width: 1280, height: 800 }, isMobile: false }
      : { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true }];

const gameSlugs = fs.readdirSync(gamesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => fs.existsSync(path.join(gamesDir, slug, "index.html")))
  .filter((slug) => !filter || slug.includes(filter))
  .sort()
  .slice(0, maxGames || undefined);

const ignoredRequestFragments = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "favicon.ico",
];

function visibleSelector(selector) {
  return Array.from(document.querySelectorAll(selector)).find((el) => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return style.visibility !== "hidden" && style.display !== "none" && box.width > 2 && box.height > 2;
  });
}

async function maybeClick(page, selector) {
  const handle = await page.evaluateHandle(visibleSelector, selector);
  const element = handle.asElement();
  if (!element) return false;
  let clicked = true;
  try {
    await element.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {});
    await element.click({ timeout: 2500 });
  } catch (error) {
    clicked = false;
  }
  await handle.dispose();
  return clicked;
}

async function clickByText(page, patterns) {
  const clicked = await page.evaluate((sources) => {
    const regexes = sources.map((source) => new RegExp(source, "i"));
    const candidates = Array.from(document.querySelectorAll("button, a, [role='button'], input[type='button'], input[type='submit']"));
    for (const el of candidates) {
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
  if (clicked) await page.waitForTimeout(450);
  return clicked;
}

async function clickStartSurface(page) {
  await clickByText(page, ["play in portrait anyway", "continue in portrait"]);
  const selectors = [
    "[data-quiz-gauntlet-start]",
    "#startBtn",
    "#startGame",
    "#playBtn",
    "#dealBtn",
    "#beginBtn",
    ".start-btn",
    ".play-btn",
    ".course-unit-card",
    "canvas",
  ];
  for (const selector of selectors) {
    if (await maybeClick(page, selector)) {
      await page.waitForTimeout(650);
      return selector;
    }
  }
  return await clickByText(page, ["start", "play", "begin", "launch", "deal", "new game", "continue", "open"]);
}

async function answerVisibleQuestion(page) {
  const selectors = [
    ".mmq-choice",
    ".answer-option",
    ".choice",
    ".option",
    "[data-answer]",
    "[data-choice]",
    "#choices button",
    "#answers button",
    "#questionScreen button",
  ];
  for (const selector of selectors) {
    if (await maybeClick(page, selector)) {
      await page.waitForTimeout(350);
      await maybeClick(page, ".mmq-next");
      await clickByText(page, ["next", "continue", "close", "resume", "ok"]);
      return selector;
    }
  }
  return "";
}

async function openJeopardyClue(page) {
  const opened = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll("button, [role='button'], .clue-card, .clue, td, a"));
    for (const el of candidates) {
      const text = (el.innerText || el.textContent || "").trim();
      if (!/^(100|200|300|400|500)$/.test(text)) continue;
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      if (style.visibility === "hidden" || style.display === "none" || box.width < 8 || box.height < 8) continue;
      el.click();
      return text;
    }
    return "";
  });
  if (opened) {
    await page.waitForTimeout(500);
    await answerVisibleQuestion(page);
  }
  return opened;
}

async function driveInput(page, durationMs) {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter", "a", "d", "w", "s"];
  const deadline = Date.now() + durationMs;
  let i = 0;
  await page.evaluate(() => document.body && document.body.focus && document.body.focus()).catch(() => {});
  while (Date.now() < deadline) {
    const key = keys[i % keys.length];
    await page.keyboard.press(key).catch(() => {});
    if (i % 3 === 0) {
      await page.evaluate((step) => {
        const canvases = Array.from(document.querySelectorAll("canvas"))
          .map((canvas) => {
            const box = canvas.getBoundingClientRect();
            const style = getComputedStyle(canvas);
            return { canvas, box, visible: style.visibility !== "hidden" && style.display !== "none" && box.width > 8 && box.height > 8 };
          })
          .filter((entry) => entry.visible)
          .sort((a, b) => (b.box.width * b.box.height) - (a.box.width * a.box.height));
        const target = canvases[0];
        if (!target) return false;
        const x = target.box.left + target.box.width * (0.3 + ((step % 5) * 0.1));
        const y = target.box.top + target.box.height * (0.35 + ((step % 4) * 0.1));
        target.canvas.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
        return true;
      }, i).catch(() => {});
    }
    if (i % 5 === 0) {
      await answerVisibleQuestion(page).catch(() => {});
      await openJeopardyClue(page).catch(() => {});
    }
    i += 1;
    await sleep(120);
  }
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const text = document.body ? document.body.innerText.trim() : "";
    const canvases = Array.from(document.querySelectorAll("canvas")).map((canvas) => {
      const box = canvas.getBoundingClientRect();
      const style = getComputedStyle(canvas);
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        visible: style.visibility !== "hidden" && style.display !== "none" && box.width > 4 && box.height > 4,
      };
    });
    const visibleCanvases = canvases.filter((canvas) => canvas.visible)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const largestCanvas = visibleCanvases[0] || null;
    const setup = document.getElementById("setupScreen");
    const overlay = document.querySelector(".mmq-overlay, #questionScreen.show, .modal.show, dialog[open]");
    const buttons = Array.from(document.querySelectorAll("button, a, [role='button']")).filter((el) => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return style.visibility !== "hidden" && style.display !== "none" && box.width > 2 && box.height > 2;
    }).length;
    return {
      title: document.title,
      textLength: text.length,
      buttons,
      hasCanvas: canvases.length > 0,
      canvasCount: canvases.length,
      visibleCanvasCount: visibleCanvases.length,
      canvas: largestCanvas,
      canvases,
      setupVisible: !!setup && setup.classList.contains("show") && getComputedStyle(setup).display !== "none",
      overlayVisible: !!overlay,
      url: location.href,
    };
  });
}

async function runOne(browser, slug, viewportSpec) {
  const context = await browser.newContext({
    viewport: viewportSpec.viewport,
    isMobile: viewportSpec.isMobile,
    hasTouch: viewportSpec.isMobile,
    deviceScaleFactor: viewportSpec.isMobile ? 3 : 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const result = {
    slug,
    viewport: viewportSpec.name,
    pass: true,
    action: "",
    errors: [],
    requestFailures: [],
    before: null,
    after: null,
  };
  page.on("pageerror", (error) => result.errors.push(String(error.message || error)));
  page.on("console", (message) => {
    if (message.type() === "error") result.errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!ignoredRequestFragments.some((fragment) => url.includes(fragment))) {
      result.requestFailures.push(url);
    }
  });
  try {
    await page.goto(`${base}/games/${slug}/index.html`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(500);
    result.before = await inspectPage(page);
    result.action = await clickStartSurface(page);
    await page.waitForTimeout(700);
    await answerVisibleQuestion(page);
    await openJeopardyClue(page);
    await driveInput(page, playMs);
    result.after = await inspectPage(page);
    if (saveScreenshots || result.errors.length || result.requestFailures.length) {
      const shotPath = path.join(outDir, `${slug}-${viewportSpec.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false }).catch(() => {});
      result.screenshot = path.relative(root, shotPath);
    }
    if (result.errors.length) result.pass = false;
    if (result.requestFailures.length) result.pass = false;
    if (!result.after || result.after.textLength < 40) {
      result.pass = false;
      result.errors.push("page text too sparse after interaction");
    }
    if (result.after?.setupVisible && result.action && result.action !== "canvas") {
      result.pass = false;
      result.errors.push("setup screen still visible after start action");
    }
    if (result.after?.canvas && (result.after.canvas.width < 120 || result.after.canvas.height < 120) && result.after.textLength < 600) {
      result.pass = false;
      result.errors.push(`canvas too small: ${result.after.canvas.width}x${result.after.canvas.height}`);
    }
  } catch (error) {
    result.pass = false;
    result.errors.push(String(error.message || error));
  } finally {
    await context.close();
  }
  return result;
}

if (!gameSlugs.length) {
  console.error("No game directories matched.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
console.log(`[play-all-games] base=${base} games=${gameSlugs.length} viewports=${viewports.map((v) => v.name).join(",")} play_ms=${playMs}`);

const browser = await chromium.launch({ headless: true });
const results = [];
for (const slug of gameSlugs) {
  for (const viewport of viewports) {
    const result = await runOne(browser, slug, viewport);
    results.push(result);
    console.log(`${result.pass ? "PASS" : "FAIL"} ${slug} ${viewport.name} action=${result.action || "none"} errors=${result.errors.length} req=${result.requestFailures.length}`);
  }
}
await browser.close();

const failures = results.filter((result) => !result.pass);
const report = {
  generatedAt: new Date().toISOString(),
  base,
  playMs,
  gameCount: gameSlugs.length,
  viewportCount: viewports.length,
  runCount: results.length,
  passCount: results.length - failures.length,
  failCount: failures.length,
  failures: failures.map((result) => ({
    slug: result.slug,
    viewport: result.viewport,
    action: result.action,
    errors: result.errors,
    requestFailures: result.requestFailures,
    after: result.after,
    screenshot: result.screenshot || "",
  })),
  results,
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(`[play-all-games] ${report.passCount}/${report.runCount} passed`);
console.log(`[play-all-games] report: ${path.relative(root, reportPath)}`);
if (failures.length) process.exit(1);
