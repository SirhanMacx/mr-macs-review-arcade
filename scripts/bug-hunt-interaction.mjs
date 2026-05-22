#!/usr/bin/env node
/**
 * Targeted interaction tests on a sample of arcade games.
 * Click start button, answer a question, check for errors during play.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BUG_HUNT_BASE || "http://localhost:18980";

const TARGETS = [
  // Flagship arcade games + key surfaces
  "/index.html",
  "/games/snake-pit/index.html",
  "/games/atlas-2048/index.html",
  "/games/sokoban-scribe/index.html",
  "/games/sudoku-scribe/index.html",
  "/games/knights-quest/index.html",
  "/games/galaxy-defender/index.html",
  "/games/word-bridge/index.html",
  "/games/anagram-atlas/index.html",
  "/games/brickoria/index.html",
  "/games/chronoblocks/index.html",
  "/games/history-hunters-2/index.html",
  "/games/archive-quest/index.html",
  "/games/cold-war-invaders/index.html",
  "/games/cube-crash/index.html",
  "/games/cascade/index.html",
  "/games/regents-rally-source-circuit/index.html",
  "/games/regents-gauntlet/index.html",
  "/games/regents-practice-exam/index.html",
  "/games/ap-practice-exam/index.html",
  "/games/mastery-path/index.html",
  "/games/source-lab/index.html",
  "/games/source-audit/index.html",
  "/games/writing-coach/index.html",
  "/games/timeline-runner/index.html",
  "/games/empire-ascendant/index.html",
  "/games/schoolcraft/index.html",
  "/teacher/",
];

const bugs = [];
let nextId = 1;
function rec(b) { bugs.push({ id: nextId++, ...b, commit: null }); }

const VIEWPORTS = [
  { name: "desktop", config: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile",  config: devices["iPhone 14 Pro"] },
];

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  console.log(`\n=== ${vp.name} ===`);
  const context = await browser.newContext({ ...vp.config });

  for (const target of TARGETS) {
    const url = BASE + target;
    const page = await context.newPage();
    const errs = [];
    const pageErrs = [];
    const nets = [];
    page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    page.on("pageerror", e => pageErrs.push(e.message));
    page.on("response", r => {
      const s = r.status();
      if (s >= 400 && s !== 304) {
        const u = r.url();
        if (/favicon|fonts\.googleapis|gstatic|chrome-extension/.test(u)) return;
        nets.push(`${s} ${u}`);
      }
    });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(1200);

      // Interaction: try to find and click a Start/Play button if it's an arcade game
      if (target.includes("/games/")) {
        const startSelectors = [
          'button:has-text("Start")',
          'button:has-text("Play")',
          'button:has-text("Begin")',
          'button:has-text("PLAY")',
          'button:has-text("START")',
          '#startBtn', '#playBtn', '#beginBtn',
          'button[data-start]',
        ];
        for (const sel of startSelectors) {
          try {
            const loc = page.locator(sel).first();
            if (await loc.count() > 0 && await loc.isVisible({ timeout: 100 })) {
              await loc.click({ timeout: 1500, trial: false });
              await page.waitForTimeout(500);
              break;
            }
          } catch (e) {}
        }
      }

      // Mobile: check overflow + tap target sizes
      if (vp.name === "mobile") {
        try {
          const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth + 10 ?
              { docWidth: document.documentElement.scrollWidth, winWidth: window.innerWidth } : null;
          });
          if (overflow) {
            rec({ file: target, severity: "med", description: `[mobile] H-overflow: ${overflow.docWidth}px on ${overflow.winWidth}px`, repro: `Open ${url} on iPhone 14 Pro`, fix: "skipped" });
          }
          // Check for too-small interactive elements (under 32px is risky on touch)
          const smallTargets = await page.evaluate(() => {
            const targets = document.querySelectorAll('button, a, [role="button"]');
            let tiny = 0;
            for (const t of targets) {
              const r = t.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              if (r.width < 32 && r.height < 32 && t.offsetParent) tiny++;
            }
            return tiny;
          });
          if (smallTargets > 5) {
            rec({ file: target, severity: "low", description: `[mobile] ${smallTargets} tap targets < 32px (a11y concern)`, repro: `Open ${url} mobile`, fix: "skipped" });
          }
        } catch (_) {}
      }
    } catch (e) {
      rec({ file: target, severity: "critical", description: `[${vp.name}] navigation failed: ${e.message}`, repro: `Open ${url}`, fix: "skipped" });
      await page.close();
      continue;
    }

    for (const err of pageErrs) {
      const hard = /ReferenceError|TypeError|SyntaxError|is not defined|is not a function|Cannot read|Cannot access/.test(err);
      rec({ file: target, severity: hard ? "high" : "med", description: `[${vp.name}] PageError: ${err.slice(0,200)}`, repro: `Open ${url}`, fix: "skipped" });
    }
    for (const err of errs) {
      const hard = /ReferenceError|TypeError|SyntaxError|is not defined|is not a function|Cannot read|Cannot access/.test(err);
      if (/Failed to load resource: the server responded with a status of 404/.test(err)) continue; // dup of network
      rec({ file: target, severity: hard ? "high" : "low", description: `[${vp.name}] Console: ${err.slice(0,200)}`, repro: `Open ${url}`, fix: "skipped" });
    }
    for (const net of nets) {
      const sev = /\.(js|json|html)\b/.test(net) ? "high" : /\.(webp|png|jpe?g|svg|css)\b/.test(net) ? "med" : "low";
      rec({ file: target, severity: sev, description: `[${vp.name}] Network: ${net}`, repro: `Open ${url}`, fix: "skipped" });
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
fs.writeFileSync(path.join(ROOT, "data", "BUG_AUDIT_2026_05_INTERACTION.json"), JSON.stringify(out, null, 2));
console.log(`\nTotal interaction bugs: ${out.totalBugs}`);
console.log(`  critical: ${out.bySeverity.critical}`);
console.log(`  high:     ${out.bySeverity.high}`);
console.log(`  med:      ${out.bySeverity.med}`);
console.log(`  low:      ${out.bySeverity.low}`);
