#!/usr/bin/env node
/**
 * scripts/audit-format-compliance.mjs
 *
 * Hard-failing format gate. Run before any commit that touches games.json
 * or adds new boards/exams. Catches drift from ARCADE_FORMAT_SPEC.md.
 *
 *   node scripts/audit-format-compliance.mjs         → audit + report
 *   node scripts/audit-format-compliance.mjs --fix   → auto-fix safe drift
 *
 * Exit codes: 0 = clean, 1 = drift detected
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const FIX = args.has("--fix");

// ===========================================================================
// Canonical course labels — see ARCADE_FORMAT_SPEC.md §2
// ===========================================================================
const CANONICAL_LABELS = new Set([
  // NYS Regents (HS)
  "Grade 10 Global History II", "Grade 11 U.S. History",
  "Living Environment", "Earth and Space Sciences", "Chemistry", "Physics",
  "Algebra I", "Algebra II", "Geometry", "Grade 9 ELA", "Grade 10 ELA",
  "Grade 11 ELA", "Grade 12 ELA",
  // Other K-12 surfaced courses
  "Grade 5 Math", "Grade 6 Math", "Grade 7 Math", "Grade 8 Math",
  // ELA uses the abbreviated "ELA" form consistently across G5-G12 (matches
  // games.json and the way teachers refer to the course). Don't drift to
  // "English Language Arts" for any single grade — see games-json entries
  // grade-7-ela-* and grade-8-ela-* which use the abbreviated label.
  "Grade 5 ELA", "Grade 6 ELA", "Grade 7 ELA", "Grade 8 ELA",
  "Grade 5 Science", "Grade 6 Science", "Grade 7 Science", "Grade 8 Science",
  "Grade 5 Social Studies", "Grade 6 Social Studies",
  "Grade 7 U.S. History I", "Grade 8 U.S. History II", "Grade 9 Global History I",
  "Life Science: Biology",  // legacy alias kept for backwards compat with old Jeopardy boards
  "Civics and Participation in Government", "Economics", "PreCalculus",
  // Cross-course skill games (sit above any single course).
  "All Social Studies",
  // Cross-course arcade games — compound labels listed verbatim so the
  // audit can recognize them without falling back to a generic "Various".
  "Grade 8 U.S. History II + Grade 10 Global History II + Grade 11 U.S. History",
  // AP exams
  "AP United States History", "AP World History: Modern", "AP European History",
  "AP U.S. Government and Politics", "AP Comparative Government and Politics",
  "AP Macroeconomics", "AP Microeconomics", "AP Psychology", "AP Human Geography",
  "AP African American Studies",
  "AP Biology", "AP Chemistry", "AP Environmental Science",
  "AP Physics 1", "AP Physics 2", "AP Physics C Mechanics", "AP Physics C E&M",
  "AP Calculus AB", "AP Calculus BC", "AP Statistics",
  "AP Computer Science A", "AP Computer Science Principles",
  "AP English Language and Composition", "AP English Literature and Composition",
  "AP Art History", "AP Music Theory", "AP Latin",
  "AP Spanish Language and Culture", "AP Spanish Literature and Culture",
  "AP French Language and Culture", "AP German Language and Culture",
  "AP Italian Language and Culture", "AP Chinese Language and Culture",
  "AP Japanese Language and Culture",
  "AP Cybersecurity", "AP Business with Personal Finance",
  "AP Macro/Micro Combined",
  // Special hub pseudo-courses
  "All Courses", "AP Courses", "Grade 10 Global History II + Grade 11 U.S. History"
]);

// Courses we explicitly do NOT surface (per §1)
const FORBIDDEN_LABELS = new Set([
  "AP 2-D Art and Design", "AP 3-D Art and Design", "AP Drawing",
  "AP Research", "AP Seminar",
  "Career Development and Occupational Studies", "Dance",
  "Family and Consumer Sciences", "High School Health", "High School Music",
  "High School Physical Education", "High School Visual Arts",
  "Media Arts", "Media Literacy and Digital Citizenship",
  "Middle School Health", "Middle School Music", "Middle School Physical Education",
  "Middle School Visual Arts", "Personal Finance", "Statistics and Data Science",
  "Technology Education", "Theater",
  "High School Computer Science and Digital Fluency",
  "Middle School Computer Science and Digital Fluency",
  "World Languages Checkpoint A", "World Languages Checkpoint B",
  "World Languages Checkpoint C",
  // NYS HS graduation requirements without a standardized exam
  "Civics and Participation in Government",
  "Economics",
  // Redundant — superseded by separate AP Macroeconomics + AP Microeconomics
  "AP Macro/Micro Combined"
]);

const ALLOWED_GAME_TYPES = new Set(["Jeopardy", "Practice Exam", "Arcade"]);

const ALLOWED_THUMBS = {
  "Jeopardy": "assets/cabinet/category-tile-jeopardy.webp",
  "Practice Exam": "assets/cabinet/category-tile-practice.webp",
  "Arcade": "assets/cabinet/category-tile-arcade.webp"
};

// ===========================================================================
// Load + audit
// ===========================================================================
const gamesPath = path.join(ROOT, "games.json");
const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));

const issues = [];
function flag(level, entry, msg) {
  issues.push({ level, id: entry?.id || "(no-id)", msg });
}

const seenIds = new Set();
let fixed = 0;

for (const g of games) {
  // Required fields
  if (!g.id) flag("error", g, "missing id");
  if (g.id && seenIds.has(g.id)) flag("error", g, `duplicate id: ${g.id}`);
  if (g.id) seenIds.add(g.id);
  if (!g.title) flag("error", g, "missing title");
  if (!g.course) flag("error", g, "missing course");
  if (!g.file) flag("error", g, "missing file");
  if (!g.gameType) flag("error", g, "missing gameType");

  // gameType must be one of 3 buckets
  if (g.gameType && !ALLOWED_GAME_TYPES.has(g.gameType)) {
    if (FIX) {
      g.gameTypeOriginal = g.gameType;
      g.gameType = "Arcade";  // safest fallback
      fixed++;
    } else {
      flag("error", g, `gameType must be one of {Jeopardy, Practice Exam, Arcade}; got '${g.gameType}'`);
    }
  }

  // Course must be canonical or forbidden
  if (g.course && !CANONICAL_LABELS.has(g.course) && !FORBIDDEN_LABELS.has(g.course)) {
    flag("warn", g, `course label not in canonical set: '${g.course}'`);
  }
  if (g.course && FORBIDDEN_LABELS.has(g.course)) {
    flag("error", g, `course is in the forbidden set (no MCQ exam format fit): '${g.course}'`);
  }

  // Thumbnail consistency
  // POLICY UPDATE 2026-05-22 (Jon's "all thumbnails are mixed up" report):
  // Per-game art in assets/game-thumbnails/<id>.webp + assets/game-card-art/<id>.webp
  // is now PREFERRED. The hub's bootstrap (assets/arcade-hub-bootstrap.js)
  // falls back to per-game art whenever the games.json entry has no
  // explicit thumbnail/cardArt field. Setting an explicit category-tile
  // path SHADOWS the per-game art and makes every Jeopardy / Practice
  // Exam / Arcade tile look identical in the hub — which is what Jon was
  // complaining about. The auto-fix that used to force every entry to
  // the category tile is removed. Category tiles remain the implicit
  // fallback for entries with no per-game art file on disk.
  //
  // The ALLOWED_THUMBS map is kept above for reference (and so any future
  // tooling that needs to know the canonical fallback list can import
  // it), but we no longer auto-mutate the games.json entries.
  if (g.gameType && ALLOWED_THUMBS[g.gameType] && g.thumbnail) {
    // Soft warning ONLY if a manually-set thumbnail points at something
    // outside both the per-game art directory and the canonical tile set.
    const okPrefixes = [
      "assets/game-thumbnails/",
      "assets/game-card-art/",
      "assets/cabinet/category-tile-"
    ];
    if (!okPrefixes.some((p) => g.thumbnail.startsWith(p))) {
      flag("warn", g, `thumbnail in unexpected path: ${g.thumbnail}`);
    }
  }

  // File path existence
  if (g.file && !g.file.startsWith("games/generated-")) {
    const decoded = decodeURIComponent(g.file.split("?")[0]);
    const abs = path.join(ROOT, decoded);
    if (!fs.existsSync(abs)) {
      flag("error", g, `file does not exist: ${decoded}`);
    }
  }
}

// Summary
const errors = issues.filter(i => i.level === "error");
const warns = issues.filter(i => i.level === "warn");

console.log(`\n=== ARCADE FORMAT COMPLIANCE AUDIT ===`);
console.log(`Entries audited: ${games.length}`);
console.log(`Errors:   ${errors.length}`);
console.log(`Warnings: ${warns.length}`);
if (FIX) console.log(`Auto-fixed: ${fixed}`);

if (errors.length) {
  console.log(`\n--- ERRORS (block push) ---`);
  for (const i of errors.slice(0, 50)) console.log(`  ✗ [${i.id}] ${i.msg}`);
  if (errors.length > 50) console.log(`  ... and ${errors.length - 50} more`);
}
if (warns.length && warns.length < 30) {
  console.log(`\n--- WARNINGS ---`);
  for (const i of warns) console.log(`  ⚠ [${i.id}] ${i.msg}`);
}

if (FIX && fixed > 0) {
  fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2) + "\n", "utf8");
  console.log(`\nWrote ${gamesPath} with ${fixed} auto-fixes.`);
}

if (errors.length) {
  console.log(`\nFAIL: ${errors.length} error(s) violate ARCADE_FORMAT_SPEC.md`);
  process.exit(1);
} else {
  console.log(`\nPASS: every entry matches the spec.`);
  process.exit(0);
}
