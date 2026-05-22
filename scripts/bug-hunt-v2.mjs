#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BUG_HUNT_BASE || "http://localhost:18980";

const games = JSON.parse(fs.readFileSync(path.join(ROOT, "games.json"), "utf8"));

function shuffleAndTake(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const args = process.argv.slice(2);
const allArcade = args.includes("--all-arcade");
const jeopardySample = parseInt(args[args.indexOf("--jeopardy-sample") + 1] || "12", 10);
const practiceSample = parseInt(args[args.indexOf("--practice-sample") + 1] || "10", 10);
const arcadeSample = parseInt(args[args.indexOf("--arcade-sample") + 1] || (allArcade ? "999" : "15"), 10);

const arcadeGames = games.filter(g => g.gameType === "Arcade");
const jeopardyGames = games.filter(g => g.gameType === "Jeopardy");
const practiceGames = games.filter(g => g.gameType === "Practice Exam");

const arcadeSelected = allArcade ? arcadeGames : shuffleAndTake(arcadeGames, arcadeSample);
const jeopardySelected = shuffleAndTake(jeopardyGames, jeopardySample);
const practiceSelected = shuffleAndTake(practiceGames, practiceSample);

const sample = [
  { url: "/index.html", id: "hub", gameType: "Hub", file: "index.html" },
  ...arcadeSelected, ...jeopardySelected, ...practiceSelected,
];

const VIEWPORTS = [
  { name: "desktop", config: { viewport: { width: 1440, height: 900 }, userAgent: "Mozilla/5.0 BugHunt Desktop" } },
  { name: "mobile",  config: devices["iPhone 14 Pro"] },
];

const bugs = [];
let bugIdCounter = 1;
function rec(b) { bugs.push({ id: bugIdCounter++, ...b, commit: null }); }

const browser = await chromium.launch({ headless: true });
console.log(`Bug hunt v2 — ${sample.length} surfaces × ${VIEWPORTS.length} viewports`);

for (const vp of VIEWPORTS) {
  console.log(`\n=== ${vp.name} ===`);
  const context = await browser.newContext({ ...vp.config });

  for (const entry of sample) {
    const target = entry.url || ("/" + (entry.file || "").replace(/^\//, ""));
    const targetEncoded = target.split("/").map(s => encodeURIComponent(decodeURIComponent(s))).join("/");
    const url = BASE + targetEncoded;
    const fileId = entry.file || entry.id || "unknown";

    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const networkErrors = [];

    page.on("console", msg => {
      if (msg.type() === "error") {
        const t = msg.text();
        if (/favicon\.ico|manifest\.json|service-worker registration|chrome-extension:/i.test(t)) return;
        // Skip the obvious noise from playwright shell
        if (/Failed to load resource: the server responded with a status of 404/.test(t)) return;
        consoleErrors.push(t);
      }
    });
    page.on("pageerror", err => pageErrors.push(err.message));
    page.on("response", resp => {
      const status = resp.status();
      if (status >= 400 && status !== 304) {
        const ru = resp.url();
        if (/favicon\.ico|google.*fonts|gstatic|chrome-extension/.test(ru)) return;
        networkErrors.push(`${status} ${ru}`);
      }
    });
    page.on("requestfailed", req => {
      const ru = req.url();
      if (/favicon\.ico|google.*fonts|gstatic|chrome-extension/.test(ru)) return;
      networkErrors.push(`REQFAIL ${req.failure()?.errorText} ${ru}`);
    });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1500); // late scripts + image loading
    } catch (e) {
      rec({ file: fileId, severity: "critical", description: `[${vp.name}] Page failed to load: ${e.message}`, repro: `Open ${url} (${vp.name})`, fix: "skipped" });
      await page.close();
      continue;
    }

    for (const err of pageErrors) {
      const isHard = /ReferenceError|TypeError|SyntaxError|is not defined|is not a function|Cannot read|Cannot access/.test(err);
      rec({ file: fileId, severity: isHard ? "high" : "med", description: `[${vp.name}] PageError: ${err.slice(0, 240)}`, repro: `Open ${url} (${vp.name})`, fix: "skipped" });
    }
    for (const err of consoleErrors) {
      const isSerious = /ReferenceError|TypeError|SyntaxError|is not defined|is not a function|Cannot read|Cannot access|Failed to fetch|NetworkError/.test(err);
      rec({ file: fileId, severity: isSerious ? "high" : "low", description: `[${vp.name}] Console: ${err.slice(0, 240)}`, repro: `Open ${url} (${vp.name})`, fix: "skipped" });
    }
    for (const err of networkErrors) {
      const sev = /\.js\b|\.json\b|\.html\b/.test(err) ? "high" : /\.(png|jpg|jpeg|webp|svg|webm|ogg|mp3|css)\b/.test(err) ? "med" : "low";
      rec({ file: fileId, severity: sev, description: `[${vp.name}] Network: ${err}`, repro: `Open ${url} (${vp.name})`, fix: "skipped" });
    }

    if (vp.name === "mobile") {
      try {
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          return docWidth > winWidth + 10 ? { docWidth, winWidth } : null;
        });
        if (overflow) {
          rec({ file: fileId, severity: "med", description: `[mobile] Horizontal overflow: ${overflow.docWidth}px on ${overflow.winWidth}px viewport`, repro: `Open ${url} on iPhone 14 Pro`, fix: "skipped" });
        }
      } catch (_) {}
    }

    await page.close();
  }

  await context.close();
}

await browser.close();

const out = {
  generatedAt: new Date().toISOString(),
  totalBugs: bugs.length,
  bySeverity: {
    critical: bugs.filter(b => b.severity === "critical").length,
    high: bugs.filter(b => b.severity === "high").length,
    med: bugs.filter(b => b.severity === "med").length,
    low: bugs.filter(b => b.severity === "low").length,
  },
  bugs,
};
fs.writeFileSync(path.join(ROOT, "data", "BUG_AUDIT_2026_05.json"), JSON.stringify(out, null, 2));
console.log(`\nTotal bugs: ${out.totalBugs}`);
console.log(`  critical: ${out.bySeverity.critical}`);
console.log(`  high:     ${out.bySeverity.high}`);
console.log(`  med:      ${out.bySeverity.med}`);
console.log(`  low:      ${out.bySeverity.low}`);
