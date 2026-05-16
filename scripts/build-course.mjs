#!/usr/bin/env node
// Builds a full course (landing page + per-unit Jeopardy HTML +
// games.json manifest shard) from a single course-spec JSON file.
//
// Usage:
//   node scripts/build-course.mjs path/to/course-spec.json
//
// Spec schema:
//   {
//     "slug": "ap-biology",
//     "title": "AP Biology",
//     "courseLabel": "AP Biology",        // used in games.json "course"
//     "subject": "Biology",                // used in games.json "subject"
//     "grade": "AP",                        // used in games.json "grade"
//     "kicker": "AP Bio",                   // landing-page chip text
//     "description": "Nine units...",       // landing-page descr
//     "exam": "AP Biology Exam Review",     // game.exam
//     "examTarget": "AP Biology...",        // game.alignment.examTarget
//     "standardSet": "AP Biology CED 2024",
//     "shortCode": "AP Bio skill",
//     "palette": { "accent": "#22c55e", ... },
//     "courseAccent": "#22c55e",            // landing-page accent
//     "tokens": ["DNA", "Cell", "Evolution"],
//     "units": [
//       {
//         "number": "01",
//         "title": "Chemistry of Life",
//         "day": "Unit 1",
//         "categories": [
//           {
//             "name": "Water + Macromolecules",
//             "clues": [
//               { "value": 100, "clue": "...", "answer": "...",
//                 "aliases": ["..."], "explanation": "..." },
//               ... five clues per category ...
//             ]
//           },
//           ... five categories ...
//         ],
//         "final": { "category": "...", "clue": "...", "answer": "...",
//                    "aliases": ["..."], "explanation": "..." }
//       },
//       ... units ...
//     ],
//     "cumulative": { /* same shape as a unit, number "99", title "Cumulative Yearlong" */ }
//   }

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE_PATH = join(ROOT, "games/global-10-units/01 - World in 1750 Jeopardy Review.html");
const LANDING_TEMPLATE_PATH = join(ROOT, "games/global-10-units/index.html");
const SHARDS_DIR = join(ROOT, "data/manifest-shards");

const VALUE_SKILLS = {
  100: "identify key content",
  200: "match content to unit context",
  300: "explain cause, effect, or turning point",
  400: "connect evidence to a larger context",
  500: "synthesize a high-value exam pattern"
};

function loadSpec(path) {
  const text = readFileSync(path, "utf8");
  const spec = JSON.parse(text);
  // Safety net: derive courseLabel from title if agent forgot it
  if (!spec.courseLabel) spec.courseLabel = spec.title || spec.slug;
  if (!spec.subject) spec.subject = "Review";
  if (!spec.grade) spec.grade = "All";
  return spec;
}

function deriveAlignment(spec) {
  return {
    course: spec.courseLabel,
    standardSet: spec.standardSet || "AP/CED-aligned course standards",
    examTarget: spec.examTarget || `${spec.courseLabel} review aligned to course standards`,
    shortCode: spec.shortCode || "course skill",
    finalFrame: spec.finalFrame || `Answer one difficult ${spec.subject || "course"} concept clue with one correct response`,
    hardeningVersion: "jeopardy-hardening-v4-natural-clues",
    boardShape: "5 categories x 5 clues, values 100-500, Final Jeopardy as one difficult concept-answer clue",
    difficultyLadder: VALUE_SKILLS
  };
}

function deriveRigor(spec, value) {
  return {
    value,
    skill: VALUE_SKILLS[value] || "answer one difficult course concept with one correct response",
    alignment: spec.standardSet || "AP/CED-aligned course standards",
    examTarget: spec.examTarget || `${spec.courseLabel} review aligned to course standards`,
    categoryQuality: "board-specific-category-v1"
  };
}

function deriveFinalRigor(spec) {
  return {
    value: "Final",
    skill: "answer one difficult course concept with one correct response",
    alignment: spec.standardSet || "AP/CED-aligned course standards",
    examTarget: spec.examTarget || `${spec.courseLabel} review aligned to course standards`
  };
}

function unitFileName(unitNumber, unitTitle) {
  return `${unitNumber} - ${unitTitle} Jeopardy Review.html`;
}

function buildGameJson(spec, unit, slug) {
  const fileName = unitFileName(unit.number, unit.title);
  const palette = spec.palette || {
    accent: "#ffd166", accent2: "#2ec4b6", accent3: "#ef476f",
    glow: "rgba(255,209,102,.30)", tile: "#12315f", tile2: "#4a1f56"
  };
  // Decorate clues with rigor + ensure values 100..500
  const decoratedCategories = unit.categories.map((cat) => ({
    name: cat.name,
    clues: cat.clues.map((c) => ({
      value: c.value,
      clue: c.clue,
      answer: c.answer,
      aliases: c.aliases || [],
      explanation: c.explanation || `${c.answer}: ${c.clue}`,
      sourceClue: c.clue,
      sourceExplanation: `${c.answer}: ${c.clue}`,
      rigor: deriveRigor(spec, c.value),
      ...(c.daily ? { daily: true } : {})
    }))
  }));
  // Pick a Daily Double position deterministically: row 3, value 400 if not set
  let hasDailyDouble = decoratedCategories.some((cat) => cat.clues.some((c) => c.daily));
  if (!hasDailyDouble && decoratedCategories[2] && decoratedCategories[2].clues[3]) {
    decoratedCategories[2].clues[3].daily = true;
  }
  const final = unit.final || {
    category: `${unit.title} Synthesis`,
    clue: "This high-value concept anchors the unit.",
    answer: "Synthesis",
    aliases: [],
    explanation: "A unit-level synthesis prompt."
  };
  return {
    slug: `${slug}-${unit.number}-${unit.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    file: fileName,
    day: unit.day || `Unit ${parseInt(unit.number, 10) || unit.number}`,
    title: unit.title,
    subtitle: spec.subtitle || `A full Jeopardy-style practice game for ${spec.courseLabel}, with auto scoring, explanations, Daily Double, and Final Wager.`,
    exam: spec.exam || `${spec.courseLabel} Review`,
    palette,
    assetSet: spec.assetSet || "global",
    standards: spec.standards || [spec.standardSet || "AP/CED-aligned"],
    tokens: spec.tokens || [],
    categories: decoratedCategories,
    final: {
      category: final.category,
      clue: final.clue,
      answer: final.answer,
      aliases: final.aliases || [],
      explanation: final.explanation || `${final.answer}: ${final.clue}`,
      rigor: deriveFinalRigor(spec)
    },
    alignment: deriveAlignment(spec),
    hardeningVersion: "jeopardy-hardening-v4-natural-clues",
    categoryHardeningVersion: "board-specific-categories-v1"
  };
}

function buildJeopardyHtml(spec, unit, slug) {
  let template = readFileSync(TEMPLATE_PATH, "utf8");
  const game = buildGameJson(spec, unit, slug);
  // Replace title
  template = template.replace(
    /<title>[^<]*<\/title>/,
    `<title>${unit.day || `Unit ${unit.number}`} - ${unit.title} Review Game</title>`
  );
  // Replace const GAME = {...};
  template = template.replace(
    /const GAME = \{[\s\S]*?\};(?=\s*const\s+STORAGE_KEY)/,
    `const GAME = ${JSON.stringify(game)};`
  );
  return { html: template, game };
}

function buildLandingPage(spec, slug, allUnits) {
  let template = readFileSync(LANDING_TEMPLATE_PATH, "utf8");
  template = template.replace(
    /<title>[^<]*<\/title>/,
    `<title>${spec.title} &mdash; Mr. Mac's Review Arcade</title>`
  );
  template = template.replace(
    /:root \{ --course-accent: #[a-f0-9]+; \}/i,
    `:root { --course-accent: ${spec.courseAccent || spec.palette?.accent || "#a991ff"}; }`
  );
  // Replace kicker
  template = template.replace(
    /<div class="course-kicker">[^<]*<\/div>/,
    `<div class="course-kicker">${spec.kicker || spec.courseLabel}</div>`
  );
  // Replace h1
  template = template.replace(
    /<h1>[^<]*<\/h1>/,
    `<h1>${spec.title}</h1>`
  );
  // Replace descr
  template = template.replace(
    /<p class="course-descr">[^<]*<\/p>/,
    `<p class="course-descr">${spec.description || `Review games for ${spec.courseLabel}.`}</p>`
  );
  // Replace gauntlet data-course + label
  template = template.replace(
    /data-course="global-10-units" data-course-label="[^"]*"/,
    `data-course="${slug}" data-course-label="${spec.courseLabel.replace(/"/g, "")}"`
  );
  template = template.replace(
    /data-game-id="global-10-units-gauntlet"/,
    `data-game-id="${slug}-gauntlet"`
  );
  // Replace the unit-card grid
  const gridHtml = allUnits.map((unit) => {
    const fileName = unitFileName(unit.number, unit.title);
    const encoded = fileName.replace(/ /g, "%20").replace(/,/g, "%2C");
    const kicker = unit.number === "99" ? "Final" : `Unit ${parseInt(unit.number, 10) || unit.number}`;
    const title = unit.number === "99" ? "Cumulative Yearlong" : unit.title;
    return `        <a class="course-unit-card" href="${encoded}">\n          <span class="course-unit-kicker">${kicker}</span>\n          <strong class="course-unit-title">${title}</strong>\n          <span class="course-unit-cta">Open board <span aria-hidden="true">&rarr;</span></span>\n        </a>`;
  }).join("\n");
  template = template.replace(
    /<div class="course-grid">[\s\S]*?<\/div>\n  <\/main>/,
    `<div class="course-grid">\n${gridHtml}\n    </div>\n  </main>`
  );
  return template;
}

function manifestEntry(spec, unit, slug, gameType) {
  const fileName = unitFileName(unit.number, unit.title);
  const game = buildGameJson(spec, unit, slug);
  return {
    id: game.slug,
    title: unit.number === "99" ? `${spec.courseLabel} Cumulative Yearlong Review` : `${unit.day || `Unit ${unit.number}`}: ${unit.title}`,
    subtitle: spec.subtitle || `${spec.courseLabel} review for ${unit.title}`,
    day: unit.day || `Unit ${parseInt(unit.number, 10) || unit.number}`,
    course: spec.courseLabel,
    subject: spec.subject,
    grade: spec.grade,
    gameType,
    file: `games/${slug}/${fileName}`,
    originalFile: fileName,
    collection: spec.collection || slug,
    categories: game.categories.map((c) => c.name),
    clueCount: game.categories.reduce((s, c) => s + c.clues.length, 0),
    hasFinal: Boolean(game.final),
    tags: spec.tags || []
  };
}

function main() {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error("Usage: build-course.mjs <spec.json>");
    process.exit(1);
  }
  const spec = loadSpec(specPath);
  const slug = spec.slug;
  const courseDir = join(ROOT, "games", slug);
  mkdirSync(courseDir, { recursive: true });

  const allUnits = [...spec.units];
  if (spec.cumulative) {
    allUnits.push({ ...spec.cumulative, number: "99", title: spec.cumulative.title || "Cumulative Yearlong", day: spec.cumulative.day || "Cumulative" });
  }

  const manifest = [];
  for (const unit of allUnits) {
    const { html } = buildJeopardyHtml(spec, unit, slug);
    const fileName = unitFileName(unit.number, unit.title);
    writeFileSync(join(courseDir, fileName), html);
    const gameType = unit.number === "99" ? (spec.cumulativeGameType || "Unit + Cumulative") : (spec.unitGameType || "Unit Review");
    manifest.push(manifestEntry(spec, unit, slug, gameType));
  }

  // Landing page
  writeFileSync(join(courseDir, "index.html"), buildLandingPage(spec, slug, allUnits));

  // Write shard
  mkdirSync(SHARDS_DIR, { recursive: true });
  const shardPath = join(SHARDS_DIR, `${slug}.json`);
  writeFileSync(shardPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Built ${slug}: ${allUnits.length} boards + landing page; manifest shard at ${shardPath}`);
}

main();
