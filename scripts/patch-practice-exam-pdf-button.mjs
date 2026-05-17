#!/usr/bin/env node
/**
 * patch-practice-exam-pdf-button.mjs
 *
 * In every games/*\/practice-exam.html, replace the auto-generated
 * "📄 Download PDF Study Guide" button (which prints generated questions)
 * with a "📚 View Past Exams (PDFs)" button that opens a modal listing
 * REAL curated PDF links from data/public-exam-library.json.
 *
 * The replacement:
 *   - Swaps the button label + onclick handler.
 *   - Adds <script src="../../assets/arcade-past-exam-library.js"> if absent.
 *
 * The print-mode CSS + buildPrintableExam() helper stays in place (harmless
 * dead code — it's only invoked from the now-removed downloadPDF() click
 * handler).  We intentionally leave it so anyone wanting to print can still
 * call window.print() manually.
 *
 * Idempotent.  Run multiple times safely.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GAMES_DIR = path.join(ROOT, "games");

const OLD_BTN_INTRO = /<button class="btn" type="button" id="downloadPdfBtn" onclick="downloadPDF\(\)" style="[^"]*">📄 Download PDF Study Guide<\/button>/g;
const OLD_BTN_RESULTS = /<button class="btn" type="button" id="downloadPdfBtnResults" onclick="downloadPDF\(\)" style="[^"]*">📄 Download PDF Study Guide<\/button>/g;
const SCRIPT_TAG = '<script src="../../assets/arcade-past-exam-library.js?v=20260516-public-exam-library"></script>';

function newButtonHtml(idAttr, courseKey) {
  // Inline onclick — easier to audit + no need to wire listeners post-render.
  return `<button class="btn" type="button" id="${idAttr}" onclick="window.MrMacPastExams && MrMacPastExams.open('${courseKey}')" style="background:rgba(0,0,0,.2); border:1px solid rgba(255,255,255,.15);">📚 View Past Exams (PDFs)</button>`;
}

let patched = 0;
let unchanged = 0;
let missingButton = [];

const entries = fs.readdirSync(GAMES_DIR, { withFileTypes: true });
for (const ent of entries) {
  if (!ent.isDirectory()) continue;
  const peFile = path.join(GAMES_DIR, ent.name, "practice-exam.html");
  if (!fs.existsSync(peFile)) continue;
  const courseKey = ent.name;
  let html = fs.readFileSync(peFile, "utf8");
  const before = html;
  // Replace both buttons.
  html = html.replace(OLD_BTN_INTRO, newButtonHtml("downloadPdfBtn", courseKey));
  html = html.replace(OLD_BTN_RESULTS, newButtonHtml("downloadPdfBtnResults", courseKey));
  // Inject script tag if not already present.
  if (!html.includes("arcade-past-exam-library.js")) {
    // Append before </body> (every practice-exam.html ends with </body></html>).
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${SCRIPT_TAG}\n</body>`);
    } else {
      html += `\n${SCRIPT_TAG}\n`;
    }
  }
  if (html === before) {
    unchanged++;
    // If we never saw the old button anywhere, flag for human review.
    if (!/📄 Download PDF Study Guide/.test(before)
        && !/📚 View Past Exams \(PDFs\)/.test(before)) {
      missingButton.push(peFile);
    }
    continue;
  }
  fs.writeFileSync(peFile, html);
  patched++;
}

console.log(`[patch] patched ${patched} practice-exam.html files`);
if (unchanged) console.log(`[patch] ${unchanged} unchanged (already migrated or no match)`);
if (missingButton.length) {
  console.log(`[patch] WARNING: ${missingButton.length} files lacked both old + new buttons:`);
  for (const f of missingButton.slice(0, 10)) console.log(`  - ${f}`);
}
