#!/usr/bin/env node
/**
 * scripts/inject-analytics-coverage.mjs
 *
 * Idempotent one-shot script that walks every game HTML surface and
 * inserts the analytics script tag where it's missing. Two distinct
 * passes:
 *
 *   PASS A — base analytics (assets/arcade-analytics.js)
 *     Injected on every games/<dir>/index.html and games/<dir>/practice-exam.html
 *     that doesn't already reference "arcade-analytics".
 *     Inserted immediately before </body>.
 *
 *   PASS B — practice-exam auto-instrumentation (arcade-practice-exam-analytics.js)
 *     Injected on every games/(*-practice|regents-practice-exam|
 *     ap-practice-exam|generated-practice-exam|apush-practice)/<file>.html
 *     that already has arcade-analytics but is missing the practice
 *     exam wrapper. Placed AFTER arcade-analytics so it can read the
 *     window.MrMacsAnalytics global.
 *
 *   PASS C — analytics/index.html is exempt (admin dashboard is its
 *     own surface and explicitly loads the script in its own <head>).
 *
 * Run:    node scripts/inject-analytics-coverage.mjs
 * Audit:  node scripts/inject-analytics-coverage.mjs --check  (no writes)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const CHECK = process.argv.includes("--check");

const VERSION = "20260522-coverage";

function find(pattern) {
  // Use find(1) — POSIX-y, no extra deps.
  const out = execSync(
    `find "${ROOT}/games" -type f \\( -name "${pattern}" \\)`,
    { encoding: "utf8" }
  );
  return out.split("\n").map((s) => s.trim()).filter(Boolean);
}

function relpath(abs) {
  return relative(ROOT, abs);
}

function isPracticeExamPath(abs) {
  // Mirror the runtime matcher in assets/arcade-practice-exam-analytics.js.
  return /\/practice-exam\.html$/.test(abs) ||
    /\/games\/(.*-practice|regents-[^/]+|ap-practice-exam|regents-practice-exam|generated-practice-exam|apush-practice)\//.test(abs);
}

function depthFromGamesDir(abs) {
  // games/<dir>/<file>.html -> ../../assets/...
  // games/<dir>/<sub>/<file>.html -> ../../../assets/...
  const rel = relative(resolve(ROOT, "games"), abs);
  const parts = rel.split("/").filter(Boolean);
  // parts.length = 2 → file is games/<dir>/<file>.html → depth-up = 2
  // parts.length = 3 → file is games/<dir>/<sub>/<file>.html → depth-up = 3
  const upCount = parts.length;
  return "../".repeat(upCount);
}

function inject(filePath) {
  const html = readFileSync(filePath, "utf8");
  const isPE = isPracticeExamPath(filePath);
  const hasBase = /arcade-analytics\.js(\?[^"']*)?["']/.test(html);
  const hasPracticeWrapper = /arcade-practice-exam-analytics\.js(\?[^"']*)?["']/.test(html);
  const needBase = !hasBase;
  const needPracticeWrapper = isPE && !hasPracticeWrapper;
  if (!needBase && !needPracticeWrapper) return { changed: false, reason: "ok" };

  const up = depthFromGamesDir(filePath);
  const baseTag = `<script src="${up}assets/arcade-analytics.js?v=${VERSION}"></script>`;
  const peTag = `<script src="${up}assets/arcade-practice-exam-analytics.js?v=${VERSION}"></script>`;

  let next = html;
  const inserts = [];
  if (needBase) inserts.push(baseTag);
  if (needPracticeWrapper) inserts.push(peTag);
  if (!inserts.length) return { changed: false, reason: "ok" };

  // Insert right before </body>. If there's no </body>, append at end-of-file.
  const block = inserts.join("\n");
  if (/<\/body>/i.test(next)) {
    next = next.replace(/<\/body>/i, `${block}\n</body>`);
  } else {
    next = next + "\n" + block + "\n";
  }
  if (CHECK) return { changed: false, would: true, inserts: inserts.length };
  writeFileSync(filePath, next, "utf8");
  return { changed: true, inserts: inserts.length };
}

const files = [
  ...find("index.html"),
  ...find("practice-exam.html")
];

let baseAdded = 0;
let peAdded = 0;
let skipped = 0;
const wouldAdds = [];

for (const f of files) {
  // Skip generated-jeopardy / generated-practice-exam if they have
  // dynamic banks (they include their own script chain). We still
  // probe in case they're missing analytics.
  const result = inject(f);
  if (result.changed) {
    if (result.inserts === 2) { baseAdded++; peAdded++; }
    else if (result.inserts === 1) {
      // Determine which was added based on path
      if (isPracticeExamPath(f) && !readFileSync(f, "utf8").includes("arcade-analytics.js")) peAdded++;
      else baseAdded++;
    }
    console.log(`  ✓ ${relpath(f)} (+${result.inserts})`);
  } else if (result.would) {
    wouldAdds.push(f);
  } else {
    skipped++;
  }
}

if (CHECK) {
  console.log(`\nCHECK MODE — would add to ${wouldAdds.length} file(s):`);
  for (const f of wouldAdds.slice(0, 20)) console.log(`  ${relpath(f)}`);
  if (wouldAdds.length > 20) console.log(`  ... and ${wouldAdds.length - 20} more`);
} else {
  console.log(`\n=== Analytics coverage injection ===`);
  console.log(`Files scanned        : ${files.length}`);
  console.log(`Base analytics added : ${baseAdded}`);
  console.log(`Practice wrapper add : ${peAdded}`);
  console.log(`Already covered      : ${skipped}`);
}
