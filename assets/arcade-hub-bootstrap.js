let GAMES = [];
let GENERATED_JEOPARDY_BLUEPRINTS = [];
let GENERATED_PRACTICE_BLUEPRINTS = [];

async function loadGamesManifest() {
  const response = await fetch("games.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load games.json");
  GAMES = await response.json();
}

async function loadGeneratedJeopardyBlueprints() {
  try {
    const response = await fetch("data/generated-jeopardy-index.json", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    GENERATED_JEOPARDY_BLUEPRINTS = Array.isArray(payload.boards) ? payload.boards : [];
  } catch (e) {
    GENERATED_JEOPARDY_BLUEPRINTS = [];
  }
}

async function loadGeneratedPracticeBlueprints() {
  try {
    const response = await fetch("data/generated-practice-exam-blueprints.json", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    GENERATED_PRACTICE_BLUEPRINTS = Array.isArray(payload.exams) ? payload.exams : [];
  } catch (e) {
    GENERATED_PRACTICE_BLUEPRINTS = [];
  }
}

// ============== Live counts ==============
// Single source of truth for every count surfaced in hero/cabinet/meta
// copy. Pulls fresh totals from GAMES + GENERATED_JEOPARDY_BLUEPRINTS so
// the hub never lies about how many boards / arcade games / total entries
// exist on this build. Originally added May 16 2026 because new Wave 4a
// courses landed without refreshing the hand-coded "152 boards" /
// "68 games" / "2967 entries" copy.
function computeLiveCounts() {
  const games = Array.isArray(GAMES) ? GAMES : [];
  const blueprints = Array.isArray(GENERATED_JEOPARDY_BLUEPRINTS) ? GENERATED_JEOPARDY_BLUEPRINTS : [];
  function looksLikeJeopardy(game) {
    const text = [game.title, game.originalFile, game.file, game.gameType].join(" ");
    if (/jeopardy|unit\s+review/i.test(text)) return true;
    const reviewTypes = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final", "Regents Sprint"]);
    return reviewTypes.has(game.gameType);
  }
  const arcadeTypes = new Set([
    "Arcade", "Arcade Duel", "Boss Rush", "Kart Racer", "Maze Chase",
    "Open-World RPG", "Pinball", "Platformer", "Runner", "Skill Lab",
    "Space Invaders", "Strategy", "Survivors", "Tower Defense",
    "Typing Drill", "Word Puzzle", "Chrono Pinball"
  ]);
  const jeopardyManifestCount = games.filter(looksLikeJeopardy).length;
  // Runtime Jeopardy tiles include the generated boards that aren't
  // already cataloged in games.json (per-course HTML stamps a
  // generatedBoardId so the runtime version is filtered out — same logic
  // as generatedJeopardyGames() above).
  const cataloged = new Set(games.map((game) => game.generatedBoardId).filter(Boolean));
  const runtimeOnlyGenerated = blueprints.filter((board) => !cataloged.has(board.id)).length;
  const totalJeopardy = jeopardyManifestCount + runtimeOnlyGenerated;
  const arcadeCount = games.filter((game) => arcadeTypes.has(game.gameType)).length;
  const totalEntries = games.length + runtimeOnlyGenerated;
  return {
    "jeopardy-boards": totalJeopardy + " boards",
    "jeopardy-boards-number": String(totalJeopardy),
    "arcade-games": arcadeCount + " games",
    "arcade-games-number": String(arcadeCount),
    "more-games-label": String(arcadeCount),
    "total-entries": String(totalEntries),
    "total-entries-label": totalEntries + " GAMES READY"
  };
}

function applyLiveCounts() {
  try {
    const counts = computeLiveCounts();
    document.querySelectorAll("[data-live-count]").forEach((node) => {
      const key = node.getAttribute("data-live-count");
      if (counts[key]) node.textContent = counts[key];
    });
    // Attract-mode carousel title (reduced-motion fallback at boot time
    // already substitutes 2967 — keep it in sync with the live total).
    const attractTitle = document.getElementById("acTitle");
    if (attractTitle && attractTitle.dataset.staticFallback === "1") {
      attractTitle.textContent = "OPEN LIBRARY · " + counts["total-entries"] + " GAMES READY";
    }
    // Meta description + og/twitter copy. Use the runtime total so
    // social-share crawlers (re-scraping after sw bump) see fresh copy.
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content",
        "Mr. Mac's Review Arcade — " + counts["total-entries"] +
        " arcade entries, practice tools, and Jeopardy boards covering grades 5-12, NY Regents, and AP courses. Free, no signup, plays offline."
      );
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content",
        "Mr. Mac's Review Arcade — " + counts["total-entries"] + " grades 5-12/AP review entries"
      );
    }
    // Update JSON-LD featureList in place if it's still hand-coded.
    // Schema uses a top-level `@graph` array; rewrite featureList wherever
    // it lives.
    document.querySelectorAll('script[type="application/ld+json"]').forEach((ld) => {
      try {
        const data = JSON.parse(ld.textContent);
        function rewriteFeatureList(node) {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) {
            node.forEach(rewriteFeatureList);
            return;
          }
          if (Array.isArray(node.featureList)) {
            node.featureList = node.featureList.map((item) => {
              if (/cataloged review entries/.test(item)) {
                return counts["total-entries"] + " cataloged review entries and practice tools";
              }
              if (/generated unit Jeopardy boards/.test(item) || /Jeopardy boards plus social studies/.test(item)) {
                return counts["jeopardy-boards-number"] + " Jeopardy boards plus social studies flagship boards";
              }
              return item;
            });
          }
          Object.values(node).forEach(rewriteFeatureList);
        }
        rewriteFeatureList(data);
        ld.textContent = JSON.stringify(data, null, 2);
      } catch (e) { /* malformed JSON-LD is fine to skip */ }
    });
  } catch (e) {
    /* live counts are cosmetic — never block hub render. */
  }
}

// ============== State + utilities ==============
// libraryExpanded defaults to FALSE so the hub renders only a curated
// preview (12 desktop / 6 mobile) instead of dumping all game cards
// into one wall. Filters, search, lane tabs, and the Show All button all
// expand to the full set as soon as the visitor indicates they want it.
// The preference is persisted to localStorage so repeat visitors who
// click Show All stay expanded across sessions.
function readLibraryExpanded() {
  try { return localStorage.getItem("arcade.libraryExpanded") === "1"; } catch (e) { return false; }
}
function writeLibraryExpanded(v) {
  try { localStorage.setItem("arcade.libraryExpanded", v ? "1" : "0"); } catch (e) {}
}
const state = { query: "", lane: "all", course: "All Courses", subject: "All Subjects", type: "All Game Types", sort: "priority", libraryExpanded: readLibraryExpanded() };
const grid = document.getElementById("grid");
const player = document.getElementById("player");
const frame = document.getElementById("gameFrame");
let currentGame = null;
let frameLoadTimer = 0;
let smartMenuLane = "recommended";
let lastPlayerFocus = null;
// Featured carousel — rotates between the May 2026 flagship sweep
// (rounds 1, 1.5, 2) and the existing premium classics so new players
// always land on something fresh.
const FEATURED_GAME_IDS = [
  // Arcade games stay grouped after Jeopardy and exam/source practice.
  "snake-pit", "chess-cabinet", "defender-drift",
  "boggle-beat", "memory-palace", "knights-quest", "crossword-cabinet",
  "pong-doctor", "atlas-2048",
  // Round 2
  "mahjong-mosaic", "reflex-run", "tower-climb", "plinko-lab", "tron-trails",
  // Round 1.5
  "galaxy-defender", "echo-hall", "anagram-atlas", "centiquill",
  // Round 1
  "rumor-whack", "citadel", "step-pyramid", "chronohop",
  // Old classics
  "history-hunters", "archive-quest", "cold-war-invaders",
  // Round 1 continued
  "brickoria", "stellar-drift", "cascade",
  // Round 3 tail (the rest)
  "sudoku-scribe", "bomb-scribe", "solitaire-hall", "archive-tycoon",
  "cube-crash", "word-bridge",
  // Practice exams
  "regents-practice-exam", "ap-practice-exam"
];
const VALIDATION_FEATURED_CORE_IDS = ["history-hunters", "archive-quest", "cold-war-invaders", "timeline-runner", "regents-practice-exam", "ap-practice-exam"];
const SOURCE_LOCKED_GAME_IDS = new Set(["regents-practice-exam", "ap-practice-exam", "source-sprint", "source-lab", "regents-gauntlet", "source-audit", "archive-cipher"]);
const PREMIUM_ARCADE_IDS = new Set([
  "history-hunters", "archive-quest", "cold-war-invaders",
  "timeline-runner", "chrono-defense-infinite", "chrono-pinball",
  "time-rift-survivors",
  // ── May 2026 flagship sweep (round 1) — game-first, review-secondary
  "brickoria", "stellar-drift", "source-snake", "chronoblocks",
  "cascade", "chronohop", "step-pyramid", "citadel", "rumor-whack",
  // ── Round 1.5 sweep
  "galaxy-defender", "echo-hall", "sokoban-scribe", "centiquill", "anagram-atlas",
  // ── Round 2 sweep
  "tron-trails", "plinko-lab", "tower-climb", "mahjong-mosaic", "reflex-run",
  // ── Round 3 mega drop (May 9 2026) — 15 cabinets covering classic genres
  // (pinball-empire removed May 10 — overlapped with existing chrono-pinball)
  "snake-pit", "defender-drift", "boggle-beat",
  "sudoku-scribe", "memory-palace", "knights-quest", "crossword-cabinet",
  "pong-doctor", "atlas-2048", "bomb-scribe", "chess-cabinet",
  "solitaire-hall", "archive-tycoon", "cube-crash", "word-bridge"
]);
const REBUILD_QUEUE_IDS = new Set(["regents-rally-source-circuit", "review-maze-chase", "boss-rush-arena", "empire-ascendant"]);
const PRACTICE_TOOL_IDS = new Set(["regents-practice-exam", "ap-practice-exam", "mastery-path", "source-lab", "writing-coach", "source-audit", "source-sprint", "regents-gauntlet"]);
const PROTOTYPE_IDS = new Set(["arcade-duel", "lightning-review", "vocab-vault"]);

const LANES = [
  { id: "all", label: "All" },
  { id: "mastery", label: "Mastery" },
  { id: "play", label: "Play" },
  { id: "regents", label: "Regents" },
  { id: "jeopardy", label: "Jeopardy" },
  { id: "quick", label: "Quick Play" },
  { id: "grade-5", label: "Grade 5" },
  { id: "grade-6", label: "Grade 6" },
  { id: "grade-7", label: "Grade 7" },
  { id: "grade-8", label: "Grade 8" },
  { id: "global-9", label: "Global 9" },
  { id: "global-10", label: "Global 10" },
  { id: "us-11", label: "U.S. 11" },
  { id: "ap", label: "AP" },
  { id: "electives", label: "Electives" },
  { id: "writing", label: "Writing" }
];

const SMART_MENU_LANES = [
  { id: "recommended", label: "Recommended", libraryLane: "all", summary: "based on your recent practice and good starter picks" },
  { id: "continue", label: "Continue", libraryLane: "all", summary: "recently opened or completed in this browser" },
  { id: "popular", label: "Popular", libraryLane: "play", summary: "most-used here, with proven fallback picks" },
  { id: "exams", label: "Practice Exams", libraryLane: "regents", summary: "full exams, source reps, and writing practice" },
  { id: "arcade", label: "Review Games", libraryLane: "play", summary: "the most game-like polished review modes" },
  { id: "quick", label: "Quick 5-Min", libraryLane: "quick", summary: "short reps for warmups and study hall" },
  { id: "ap", label: "AP", libraryLane: "ap", summary: "released AP practice and AP unit boards" },
  { id: "regents", label: "Regents", libraryLane: "regents", summary: "Global and U.S. Regents prep paths" },
  { id: "jeopardy", label: "Jeopardy", libraryLane: "jeopardy", summary: "unit boards organized by course and topic" }
];

const SMART_TITLE_ALIASES = {
  "timeline-runner": {
    title: "Timeline Turbo",
    kicker: "Timeline Racer",
    subtitle: "Race through order-of-events review with answer gates and full-library questions."
  },
  "source-lab": {
    title: "Source Sleuth",
    kicker: "Source Detective",
    subtitle: "Inspect title, date, speaker, labels, maps, cartoons, and charts before answering."
  },
  "cold-war-invaders": {
    title: "Cold War Invaders",
    kicker: "Space Invaders",
    subtitle: "Defend Earth with containment-era questions, crisis waves, and arcade controls."
  },
  "review-maze-chase": {
    title: "Review Maze Chase",
    kicker: "Maze Chase",
    subtitle: "Collect evidence, grab source scrolls, and answer through gates to power up."
  }
};

function uniq(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// Canonical sort order — only courses with an MCQ exam (NYS Regents, NYS
// Grade 3-8 state test, or AP MCQ exam). See ARCADE_FORMAT_SPEC.md §1.
// Order: Social Studies → ELA → Math → Science (grade-ascending within each).
const BASE_COURSE_ORDER = [
  // Grade 5-8 Social Studies + Grade 8 NYS Social Studies investigation
  "Grade 5 Social Studies",
  "Grade 6 Social Studies",
  "Grade 7 U.S. History I",
  "Grade 8 U.S. History II",
  // HS Social Studies Regents
  "Grade 9 Global History I",
  "Grade 10 Global History II",
  "Grade 11 U.S. History",
  // Grade 5-8 ELA
  "Grade 5 ELA",
  "Grade 6 ELA",
  "Grade 7 ELA",
  "Grade 8 ELA",
  // HS ELA Regents
  "Grade 9 ELA",
  "Grade 10 ELA",
  "Grade 11 ELA",
  "Grade 12 ELA",
  // Grade 5-8 Math
  "Grade 5 Math",
  "Grade 6 Math",
  "Grade 7 Math",
  "Grade 8 Math",
  // HS Math Regents + PreCalc
  "Algebra I",
  "Geometry",
  "Algebra II",
  "PreCalculus",
  // Grade 5-8 Science + HS Science Regents
  "Grade 5 Science",
  "Grade 6 Science",
  "Grade 7 Science",
  "Grade 8 Science",
  "Earth and Space Sciences",
  "Living Environment",
  "Chemistry",
  "Physics"
  // AP courses follow alphabetically after these via courseSortKey
];
const COURSE_LABEL_ALIASES = {
  // ── Display-label variants (human label → canonical human label) ──
  "AP United States Government and Politics": "AP U.S. Government and Politics",
  "Global History 9 (Ancient–Medieval)": "Grade 9 Global History I",
  "Global History 10 (Cold War–Modern)": "Grade 10 Global History II",
  "Grade 7 US History": "Grade 7 U.S. History I",
  "Grade 8 US History": "Grade 8 U.S. History II",
  "US History (Cold War-Modern)": "Grade 11 U.S. History",
  "Grade 7 English Language Arts": "Grade 7 ELA",
  "Grade 8 English Language Arts": "Grade 8 ELA",
  "Grade 5 Mathematics": "Grade 5 Math",
  "Grade 6 Mathematics": "Grade 6 Math",
  "Grade 7 Mathematics": "Grade 7 Math",
  "Grade 8 Mathematics": "Grade 8 Math",
  "English 9": "Grade 9 ELA",
  "English 10": "Grade 10 ELA",
  "English 11": "Grade 11 ELA",
  "English 12": "Grade 12 ELA",
  "Life Science: Biology": "Living Environment",
  "Precalculus": "PreCalculus",
  "AP Precalculus": "PreCalculus",
  "AP Physics 1: Algebra-Based": "AP Physics 1",
  "AP Physics 2: Algebra-Based": "AP Physics 2",
  "AP Physics C: Mechanics": "AP Physics C Mechanics",
  "AP Physics C: Electricity and Magnetism": "AP Physics C E&M",
  // ── Bank fragment slugs (lowercase-hyphenated) → canonical human label ──
  // Without these, search dropdown falls through to slugs like "mathematics-5".
  "mathematics-5": "Grade 5 Math",
  "mathematics-6": "Grade 6 Math",
  "mathematics-7": "Grade 7 Math",
  "mathematics-8": "Grade 8 Math",
  "math-5": "Grade 5 Math",
  "math-6": "Grade 6 Math",
  "math-7": "Grade 7 Math",
  "math-8": "Grade 8 Math",
  "ela-5": "Grade 5 ELA",
  "ela-6": "Grade 6 ELA",
  "ela-7": "Grade 7 ELA",
  "ela-8": "Grade 8 ELA",
  "ela-9": "Grade 9 ELA",
  "ela-10": "Grade 10 ELA",
  "ela-11": "Grade 11 ELA",
  "ela-12": "Grade 12 ELA",
  "science-5": "Grade 5 Science",
  "science-6": "Grade 6 Science",
  "science-7": "Grade 7 Science",
  "science-8": "Grade 8 Science",
  "grade-5": "Grade 5 Social Studies",
  "grade-6": "Grade 6 Social Studies",
  "grade-7": "Grade 7 U.S. History I",
  "grade-8": "Grade 8 U.S. History II",
  "global-9": "Grade 9 Global History I",
  "global-10": "Grade 10 Global History II",
  "us-history": "Grade 11 U.S. History",
  "us-history-units": "Grade 11 U.S. History",
  "apush": "AP United States History",
  "living-environment": "Living Environment",
  "earth-and-space-sciences": "Earth and Space Sciences",
  "earth-science": "Earth and Space Sciences",
  "chemistry": "Chemistry",
  "chemistry-regents": "Chemistry",
  "physics": "Physics",
  "physics-regents": "Physics",
  "algebra-1": "Algebra I",
  "algebra-2": "Algebra II",
  "geometry": "Geometry",
  "precalculus": "PreCalculus",
  "ap-united-states-history": "AP United States History",
  "ap-world-history": "AP World History: Modern",
  "ap-world-history-modern": "AP World History: Modern",
  "ap-european-history": "AP European History",
  "ap-united-states-government-and-politics": "AP U.S. Government and Politics",
  "ap-comparative-government-and-politics": "AP Comparative Government and Politics",
  "ap-comparative-government": "AP Comparative Government and Politics",
  "ap-macroeconomics": "AP Macroeconomics",
  "ap-microeconomics": "AP Microeconomics",
  "ap-psychology": "AP Psychology",
  "ap-human-geography": "AP Human Geography",
  "ap-african-american-studies": "AP African American Studies",
  "ap-biology": "AP Biology",
  "ap-chemistry": "AP Chemistry",
  "ap-environmental-science": "AP Environmental Science",
  "ap-physics-1": "AP Physics 1",
  "ap-physics-1-algebra-based": "AP Physics 1",
  "ap-physics-2": "AP Physics 2",
  "ap-physics-2-algebra-based": "AP Physics 2",
  "ap-physics-c-mechanics": "AP Physics C Mechanics",
  "ap-physics-c-electricity-and-magnetism": "AP Physics C E&M",
  "ap-physics-c-em": "AP Physics C E&M",
  "ap-calculus-ab": "AP Calculus AB",
  "ap-calculus-bc": "AP Calculus BC",
  "ap-statistics": "AP Statistics",
  "ap-precalculus": "PreCalculus",
  "ap-computer-science-a": "AP Computer Science A",
  "ap-computer-science-principles": "AP Computer Science Principles",
  "ap-english-language": "AP English Language and Composition",
  "ap-english-language-and-composition": "AP English Language and Composition",
  "ap-english-literature": "AP English Literature and Composition",
  "ap-english-literature-and-composition": "AP English Literature and Composition",
  "ap-art-history": "AP Art History",
  "ap-music-theory": "AP Music Theory",
  "ap-latin": "AP Latin",
  "ap-spanish-language": "AP Spanish Language and Culture",
  "ap-spanish-language-and-culture": "AP Spanish Language and Culture",
  "ap-spanish-literature": "AP Spanish Literature and Culture",
  "ap-spanish-literature-and-culture": "AP Spanish Literature and Culture",
  "ap-french-language": "AP French Language and Culture",
  "ap-french-language-and-culture": "AP French Language and Culture",
  "ap-german-language": "AP German Language and Culture",
  "ap-german-language-and-culture": "AP German Language and Culture",
  "ap-italian-language": "AP Italian Language and Culture",
  "ap-italian-language-and-culture": "AP Italian Language and Culture",
  "ap-chinese-language": "AP Chinese Language and Culture",
  "ap-chinese-language-and-culture": "AP Chinese Language and Culture",
  "ap-japanese-language": "AP Japanese Language and Culture",
  "ap-japanese-language-and-culture": "AP Japanese Language and Culture",
  "ap-cybersecurity": "AP Cybersecurity",
  "ap-business-personal-finance": "AP Business with Personal Finance",
  // ── Forbidden slugs (course removed per ARCADE_FORMAT_SPEC.md §1) ──
  // Mapped to "" so .filter(Boolean) drops them from any dropdown.
  "economics": "",
  "us-government": "",
  "civics-pig": "",
  "ap-economics-combined": "",
  "ap-business-with-personal-finance": "AP Business with Personal Finance"
};
function displayCourseLabel(course) {
  const value = String(course || "").trim();
  return COURSE_LABEL_ALIASES[value] || value;
}
function courseSortKey(course) {
  const value = displayCourseLabel(course);
  const baseIndex = BASE_COURSE_ORDER.indexOf(value);
  if (baseIndex !== -1) return [0, baseIndex, value];
  if (/^AP\b/.test(value)) return [9, 0, value];
  if (/Mathematics|Algebra|Geometry|Calculus|Statistics/i.test(value)) return [2, 0, value];
  if (/Science|Biology|Chemistry|Physics|Earth|Environmental/i.test(value)) return [3, 0, value];
  if (/English|ELA|Literacy|Languages/i.test(value)) return [4, 0, value];
  if (/Computer|Technology|Career/i.test(value)) return [5, 0, value];
  if (/Art|Music|Dance|Theater|Media/i.test(value)) return [6, 0, value];
  if (/Health|Physical|Family/i.test(value)) return [7, 0, value];
  return [8, 0, value];
}
function courseCompare(a, b) {
  const ak = courseSortKey(a);
  const bk = courseSortKey(b);
  for (let i = 0; i < Math.min(ak.length, bk.length); i++) {
    if (ak[i] < bk[i]) return -1;
    if (ak[i] > bk[i]) return 1;
  }
  return displayCourseLabel(a).localeCompare(displayCourseLabel(b), undefined, { numeric: true });
}
function sharedCourseLabels() {
  const labels = (window.DIAG_BANK_COURSE_LABELS && typeof window.DIAG_BANK_COURSE_LABELS === "object")
    ? Object.values(window.DIAG_BANK_COURSE_LABELS)
    : [];
  return labels.map(displayCourseLabel).filter(Boolean);
}
function allCourseLabels() {
  const labels = [];
  (GAMES || []).forEach((game) => {
    const course = displayCourseLabel(game.course);
    if (!course || course === "All Courses" || course.indexOf(" + ") !== -1) return;
    labels.push(course);
  });
  labels.push(...sharedCourseLabels());
  return uniq(labels.map(displayCourseLabel)).sort(courseCompare);
}
function sharedBankKeysForCourse(courseLabel) {
  const target = displayCourseLabel(courseLabel);
  const bank = window.DIAG_BANK_BY_COURSE || {};
  const labels = window.DIAG_BANK_COURSE_LABELS || {};
  return Object.keys(bank).filter((key) => displayCourseLabel(labels[key] || key) === target);
}
function primarySharedBankKey(courseLabel) {
  return sharedBankKeysForCourse(courseLabel)[0] || courseLabel;
}
function courseQuestionCount(courseLabel) {
  const bank = window.DIAG_BANK_BY_COURSE || {};
  return sharedBankKeysForCourse(courseLabel).reduce((sum, key) => {
    return sum + (Array.isArray(bank[key]) ? bank[key].length : 0);
  }, 0);
}
function courseSpecificGames(courseLabel) {
  return (GAMES || []).filter((game) => {
    if (!game || !game.course || game.course === "All Courses") return false;
    if (String(game.course).indexOf(" + ") !== -1) {
      return game.course.split(" + ").map((part) => displayCourseLabel(part.trim())).includes(displayCourseLabel(courseLabel));
    }
    return displayCourseLabel(game.course) === displayCourseLabel(courseLabel);
  });
}
function courseHasPlayableSurface(courseLabel) {
  return !!courseQuestionCount(courseLabel) || courseSpecificGames(courseLabel).length > 0;
}
function gameMatchesCourseLabel(game, selectedCourse) {
  if (!game || !selectedCourse || selectedCourse === "All Courses") return true;
  if (game.course === "All Courses") return true;
  if (String(game.course || "").indexOf(" + ") !== -1) {
    return game.course.split(" + ").map((part) => displayCourseLabel(part.trim())).includes(displayCourseLabel(selectedCourse));
  }
  return displayCourseLabel(game.course) === displayCourseLabel(selectedCourse);
}
function allJeopardyCourseLabels() {
  const real = (GAMES || []).filter(isJeopardyBoard).map((game) => displayCourseLabel(game.course));
  const generated = (GENERATED_JEOPARDY_BLUEPRINTS || []).map((board) => displayCourseLabel(board.courseLabel));
  return uniq(real.concat(generated)).sort(courseCompare);
}
function generatedJeopardyGames() {
  const cataloged = new Set((GAMES || []).map((game) => game.generatedBoardId).filter(Boolean));
  return (GENERATED_JEOPARDY_BLUEPRINTS || []).map((board) => ({
    id: "generated-jeopardy-" + board.id,
    generatedBoardId: board.id,
    title: board.title || (board.courseLabel + " Jeopardy Review"),
    subtitle: board.subtitle || "Generated unit board from the all-subject NYS/AP blueprint set.",
    course: displayCourseLabel(board.courseLabel),
    subject: board.subjectArea || board.standardsFramework || "Course Review",
    grade: board.gradeBand || "",
    file: "games/generated-jeopardy/index.html?board=" + encodeURIComponent(board.id),
    day: board.unit || "Unit Review",
    gameType: "Jeopardy",
    clueCount: 25,
    hasFinal: true,
    isGeneratedJeopardy: true,
    cardArt: "assets/cabinet/category-tile-jeopardy.webp",
    thumbnail: "assets/game-thumbnails/generated-jeopardy.webp",
    categories: (board.categories || []).map((cat) => cat.name).filter(Boolean)
  })).filter((game) => !cataloged.has(game.generatedBoardId));
}
function generatedJeopardyByRuntimeId(id) {
  const runtimeId = String(id || "");
  return generatedJeopardyGames().find((game) => game.id === runtimeId);
}
function openGeneratedJeopardy(game) {
  if (!game || !game.generatedBoardId) return;
  const target = withMultiplayerRoom("games/generated-jeopardy/?board=" + encodeURIComponent(game.generatedBoardId));
  announceMultiplayerActivity({
    id: game.id || game.generatedBoardId,
    title: game.title || "Generated Jeopardy Review",
    kind: "Jeopardy",
    url: target
  });
  window.location.href = target;
}
function generatedPracticeBlueprintForCourse(courseLabel) {
  const target = displayCourseLabel(courseLabel);
  return (GENERATED_PRACTICE_BLUEPRINTS || []).find((exam) => displayCourseLabel(exam.courseLabel) === target)
    || (GENERATED_PRACTICE_BLUEPRINTS || []).find((exam) => exam.courseId === courseLabel);
}
function openGeneratedPracticeExam(courseLabel) {
  let target;
  if (!courseLabel) {
    target = withMultiplayerRoom("games/generated-practice-exam/");
    announceMultiplayerActivity({
      id: "generated-practice-exam",
      title: "Generated Practice Exam",
      kind: "Practice Exam",
      url: target
    });
    window.location.href = target;
    return;
  }
  const blueprint = generatedPracticeBlueprintForCourse(courseLabel);
  const course = blueprint ? blueprint.courseId : primarySharedBankKey(courseLabel);
  target = withMultiplayerRoom("games/generated-practice-exam/?course=" + encodeURIComponent(course || ""));
  announceMultiplayerActivity({
    id: "generated-practice-exam-" + (course || ""),
    title: displayCourseLabel(courseLabel) + " Practice Exam",
    kind: "Practice Exam",
    url: target
  });
  window.location.href = target;
}

// True when the game's `course` field matches the player's enrolled
// course exactly OR is a compound course tag like
// "Grade 10 Global History II + Grade 11 U.S. History" that includes
// the enrolled course as a token. Used everywhere the platform asks
// "is this game relevant to the student's enrolled course?".
function gameMatchesEnrolledCourse(game, enrolledCourse) {
  if (!game || !enrolledCourse || !game.course) return false;
  // Universal-course games (Arcade flagships, etc.) are relevant to
  // every enrolled student. Without this check the front-page surfaces
  // hide the entire May 2026 flagship sweep from anyone with a course set.
  if (game.course === "All Courses") return true;
  if (displayCourseLabel(game.course) === displayCourseLabel(enrolledCourse)) return true;
  if (game.course.indexOf(" + ") !== -1) {
    return game.course.split(" + ").map(function (s) { return displayCourseLabel(s.trim()); }).indexOf(displayCourseLabel(enrolledCourse)) !== -1;
  }
  return false;
}
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function thumbnailFor(game) {
  if (!game) return "";
  if (game.thumbnail) return game.thumbnail;
  return "assets/game-thumbnails/" + encodeURIComponent(game.id) + ".webp";
}
function cardArtFor(game) {
  if (!game) return "";
  if (game.cardArt) return game.cardArt;
  return "assets/game-card-art/" + encodeURIComponent(game.id) + ".webp";
}
function cardArtFallbackFor(game) {
  const category = game ? categoryForGameArt(game) : "arcade";
  const byCategory = {
    jeopardy: "assets/cabinet/category-tile-jeopardy.webp",
    exam: "assets/cabinet/category-tile-practice.webp",
    arcade: "assets/cabinet/category-tile-arcade.webp",
    daily: "assets/cabinet/category-tile-daily.webp",
    source: "assets/cabinet/game-backdrop-source-desk.webp",
    strategy: "assets/cabinet/game-backdrop-archive.webp"
  };
  return byCategory[category] || byCategory.arcade;
}
function categoryForGameArt(game) {
  const text = [game?.id, game?.title, game?.gameType, game?.subject, game?.file].join(" ").toLowerCase();
  if (/jeopardy/.test(text)) return "jeopardy";
  if (/practice|exam|regents|ap-practice/.test(text)) return "exam";
  if (/source|cipher|document|writing/.test(text)) return "source";
  if (/chess|citadel|empire|sokoban|mahjong|sudoku/.test(text)) return "strategy";
  if (/daily|runner|sprint/.test(text)) return "daily";
  return "arcade";
}
function marqueeFor(game) {
  if (!game) return "";
  if (game.marquee) return game.marquee;
  return "assets/game-marquees/" + encodeURIComponent(game.id) + ".webp";
}
function assetHref(path) {
  try {
    return new URL(path, document.baseURI).href;
  } catch (e) {
    return path;
  }
}
function cssUrlForAttr(path) {
  return "url(&quot;" + escapeHtml(assetHref(path)).replaceAll("(", "%28").replaceAll(")", "%29") + "&quot;)";
}
function gameById(id) {
  return GAMES.find((game) => game.id === id);
}
function uniqueGames(games) {
  return [...new Map((games || []).filter(Boolean).map((game) => [game.id, game])).values()];
}

// ============== Course color + glyph system ==============
const COURSE_PALETTE = {
  "AP Psychology":                       { accent: "#ff7bcc", glyph: "ψ" },
  "AP United States History":            { accent: "#ffb547", glyph: "★" },
  "AP World History: Modern":            { accent: "#7af0ff", glyph: "◐" },
  "AP European History":                 { accent: "#b892ff", glyph: "♛" },
  "AP Human Geography":                  { accent: "#69f0aa", glyph: "◉" },
  "AP Macroeconomics":                   { accent: "#f5c451", glyph: "$" },
  "AP Microeconomics":                   { accent: "#ffd884", glyph: "%" },
  "AP Macro/Micro Combined":             { accent: "#e8a85c", glyph: "Σ" },
  "AP U.S. Government and Politics":     { accent: "#5dc7ff", glyph: "✦" },
  "AP Courses":                          { accent: "#60efff", glyph: "AP" },
  "Grade 5 Social Studies":              { accent: "#74f0aa", glyph: "5" },
  "Grade 6 Social Studies":              { accent: "#7af0ff", glyph: "6" },
  "Grade 7 U.S. History I":              { accent: "#ffd884", glyph: "7" },
  "Grade 8 U.S. History II":             { accent: "#ffb547", glyph: "8" },
  "Grade 9 Global History I":            { accent: "#69f0aa", glyph: "◇" },
  "Grade 10 Global History II":          { accent: "#8fb4ff", glyph: "◆" },
  "Grade 11 U.S. History":               { accent: "#ffd884", glyph: "✪" },
  "Civics and Participation in Government": { accent: "#5dc7ff", glyph: "§" },
  "Economics":                           { accent: "#f5c451", glyph: "¢" },
  "All Courses":                         { accent: "#7af0ff", glyph: "∞" }
};
function paletteFor(course) {
  const label = displayCourseLabel(course);
  if (COURSE_PALETTE[label]) return COURSE_PALETTE[label];
  if (/^AP\b/.test(label)) return { accent: "#60efff", glyph: "AP" };
  if (/Mathematics|Algebra|Geometry|Calculus|Statistics/i.test(label)) return { accent: "#ffd15c", glyph: "Σ" };
  if (/Science|Biology|Chemistry|Physics|Earth|Environmental/i.test(label)) return { accent: "#69f0aa", glyph: "SCI" };
  if (/English|ELA|Literacy|Languages/i.test(label)) return { accent: "#ff7bcc", glyph: "A" };
  if (/Computer|Technology|Career/i.test(label)) return { accent: "#7af0ff", glyph: "CPU" };
  if (/Art|Music|Dance|Theater|Media/i.test(label)) return { accent: "#b892ff", glyph: "ART" };
  if (/Health|Physical|Family/i.test(label)) return { accent: "#ffb547", glyph: "FIT" };
  return { accent: "#b892ff", glyph: "◆" };
}
function accentFor(game) {
  if (game.id === "history-hunters") return "#74f0aa";
  if (game.id === "archive-quest") return "#62e9ff";
  if (game.id === "review-maze-chase") return "#ffd15c";
  if (game.id === "cold-war-invaders") return "#72f3ff";
  if (game.id === "regents-practice-exam") return "#ffd15c";
  if (game.id === "ap-practice-exam") return "#60efff";
  if (game.id === "source-audit") return "#5af0ae";
  if (game.id === "regents-rally-source-circuit") return "#ffd15c";
  if (game.id === "lightning-review") return "#ffd15c";
  if (game.id === "source-sprint") return "#62e9ff";
  if (game.id === "vocab-vault") return "#74f0aa";
  if (game.id === "arcade-duel") return "#ff7bcc";
  if (game.id === "regents-gauntlet") return "#7af0ff";
  if (game.id === "boss-rush-arena") return "#f5c451";
  return paletteFor(game.course).accent;
}
function glyphFor(game) {
  if (game.id === "history-hunters") return "HH";
  if (game.id === "archive-quest") return "AQ";
  if (game.id === "review-maze-chase") return "MC";
  if (game.id === "cold-war-invaders") return "CW";
  if (game.id === "regents-practice-exam") return "✎";
  if (game.id === "ap-practice-exam") return "AP";
  if (game.id === "source-audit") return "OK";
  if (game.id === "regents-rally-source-circuit") return "RR";
  if (game.id === "lightning-review") return "90";
  if (game.id === "source-sprint") return "DBQ";
  if (game.id === "vocab-vault") return "ABC";
  if (game.id === "arcade-duel") return "⚡";
  if (game.id === "regents-gauntlet") return "⚔";
  if (game.id === "boss-rush-arena") return "★";
  return paletteFor(game.course).glyph;
}

const JEOPARDY_ALL_COURSES = "All Course Levels";
const JEOPARDY_ALL_SUBJECTS = "All Subjects";
const JEOPARDY_PREVIEW_LIMIT = 4;
const LIBRARY_PREVIEW_LIMIT = 12;
const MOBILE_LIBRARY_PREVIEW_LIMIT = 6;
const jeopardyState = { course: JEOPARDY_ALL_COURSES, subject: JEOPARDY_ALL_SUBJECTS, query: "" };
const UNIT_REVIEW_TYPES = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final"]);
const SUBJECT_ALIASES = {
  "United States History": "U.S. History",
  "US History": "U.S. History",
  "U.S. History": "U.S. History",
  "Regents Source Integrity": "Regents Review",
  "Regents Writing": "Regents Review"
};

function isJeopardyBoard(game) {
  const text = [game.title, game.originalFile, game.file, game.gameType].join(" ");
  return /jeopardy|unit\s+review/i.test(text) || UNIT_REVIEW_TYPES.has(game.gameType);
}
function displayGameType(game) {
  if (!game) return "Review";
  if (isJeopardyBoard(game)) return "Jeopardy";
  return game.gameType || "Review";
}
function isRegentsLike(game) {
  return /Regents|Gauntlet/i.test(game.gameType || "");
}
function normalizedSubject(subject) {
  const value = String(subject || "").trim();
  if (!value) return "";
  return SUBJECT_ALIASES[value] || value;
}
function subjectOptions(games) {
  return uniq(games.map((game) => normalizedSubject(game.subject)).filter(Boolean))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
function subjectMatches(game, selected, allLabel = "All Subjects") {
  return selected === allLabel || normalizedSubject(game.subject) === selected;
}
function isMobileViewport() {
  return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
}
function libraryPreviewLimit() {
  return isMobileViewport() ? MOBILE_LIBRARY_PREVIEW_LIMIT : LIBRARY_PREVIEW_LIMIT;
}

// ============== Filters ==============
function fillSelect(id, label, values) {
  const select = document.getElementById(id);
  if (!select) return;
  const cleanValues = values.filter((value) => value && value !== label);
  select.innerHTML = [label].concat(cleanValues).map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>').join("");
}
function initFilters() {
  fillSelect("courseFilter", "All Courses", allCourseLabels());
  fillSelect("subjectFilter", "All Subjects", subjectOptions(GAMES));
  fillSelect("typeFilter", "All Game Types", uniq(GAMES.map(displayGameType)));
  fillSelect("jeopardyCourseSelect", JEOPARDY_ALL_COURSES, allJeopardyCourseLabels());
  fillSelect("jeopardySubjectSelect", JEOPARDY_ALL_SUBJECTS, subjectOptions(GAMES.filter(isJeopardyBoard)));
  // Guard each listener so a stripped-down build (e.g. embedded preview)
  // doesn't throw when one of the filter controls is absent.
  document.getElementById("search")?.addEventListener("input", (event) => { state.query = event.target.value; render(); });
  document.getElementById("courseFilter")?.addEventListener("change", (event) => { state.course = event.target.value; render(); });
  document.getElementById("subjectFilter")?.addEventListener("change", (event) => { state.subject = event.target.value; render(); });
  document.getElementById("typeFilter")?.addEventListener("change", (event) => { state.type = event.target.value; render(); });
  document.getElementById("sortFilter")?.addEventListener("change", (event) => { state.sort = event.target.value; render(); });
  document.getElementById("jeopardyCourseSelect")?.addEventListener("change", (event) => { jeopardyState.course = event.target.value; renderJeopardyModes(); });
  document.getElementById("jeopardySubjectSelect")?.addEventListener("change", (event) => { jeopardyState.subject = event.target.value; renderJeopardyModes(); });
  document.getElementById("jeopardySearch")?.addEventListener("input", (event) => { jeopardyState.query = event.target.value; renderJeopardyModes(); });
  document.getElementById("showAllLibraryBtn")?.addEventListener("click", () => {
    state.libraryExpanded = true;
    writeLibraryExpanded(true);
    render();
  });

  // Empty-state CTA delegations: clearing filters when there are no results
  document.addEventListener("click", (event) => {
    const target = event.target.closest && event.target.closest("button, a");
    if (!target) return;
    if (target.id === "jeopardyResetBtn") {
      jeopardyState.course = JEOPARDY_ALL_COURSES;
      jeopardyState.subject = JEOPARDY_ALL_SUBJECTS;
      jeopardyState.query = "";
      const c = document.getElementById("jeopardyCourseSelect");
      const s = document.getElementById("jeopardySubjectSelect");
      const q = document.getElementById("jeopardySearch");
      if (c) c.value = JEOPARDY_ALL_COURSES;
      if (s) s.value = JEOPARDY_ALL_SUBJECTS;
      if (q) q.value = "";
      if (typeof renderJeopardyModes === "function") renderJeopardyModes();
    }
    if (target.id === "libraryResetBtn") {
      state.query = "";
      state.lane = "all";
      state.course = "All Courses";
      state.subject = "All Subjects";
      state.type = "All Game Types";
      const search = document.getElementById("search");
      const cf = document.getElementById("courseFilter");
      const sf = document.getElementById("subjectFilter");
      const tf = document.getElementById("typeFilter");
      if (search) search.value = "";
      if (cf) cf.value = "All Courses";
      if (sf) sf.value = "All Subjects";
      if (tf) tf.value = "All Game Types";
      // Reset lane tab visual state
      document.querySelectorAll("#laneTabs .lane-tab").forEach((b) => {
        b.classList.toggle("active", b.dataset.lane === "all");
      });
      render();
    }
  });
}
function searchable(game) {
  return [game.title, game.subtitle, game.day, game.course, game.subject, normalizedSubject(game.subject), game.grade, game.gameType, displayGameType(game), game.originalFile].concat(game.categories || [], game.tags || []).join(" ").toLowerCase();
}
function quickPlayIds() {
  return ["lightning-review", "source-sprint", "vocab-vault", "archive-cipher"];
}
function isQuickPlay(game) {
  return game.collection === "quick-play" || quickPlayIds().includes(game.id);
}
function qualityTier(game) {
  if (!game) return "library";
  if (PREMIUM_ARCADE_IDS.has(game.id)) return "premium";
  if (REBUILD_QUEUE_IDS.has(game.id)) return "rebuild";
  if (PRACTICE_TOOL_IDS.has(game.id)) return "practice";
  if (PROTOTYPE_IDS.has(game.id)) return "prototype";
  if (isJeopardyBoard(game)) return "jeopardy";
  return "library";
}
function isPremiumArcade(game) {
  return qualityTier(game) === "premium";
}
function laneMatches(game) {
  if (state.lane === "all") return true;
  const text = searchable(game);
  if (state.lane === "mastery") return game.collection === "mastery-path" || ["mastery-path", "source-lab", "writing-coach"].includes(game.id);
  if (state.lane === "play") return isPremiumArcade(game);
  if (state.lane === "quick") return isQuickPlay(game);
  if (state.lane === "regents") return /regents|stimulus|source-based|source based|crq|enduring issue|document writing|ap-style|frq|dbq|saq/i.test(text) || ["regents-practice-exam", "ap-practice-exam", "source-audit", "regents-rally-source-circuit", "regents-gauntlet", "source-sprint"].includes(game.id);
  if (state.lane === "jeopardy") return isJeopardyBoard(game);
  if (state.lane === "ap") return /^AP\b/.test(game.course || "") || /\bAP\b/.test(text);
  if (state.lane.startsWith("grade-")) {
    const grade = state.lane.replace("grade-", "");
    return String(game.grade || "") === grade || new RegExp("\\bgrade\\s+" + grade + "\\b", "i").test(game.course || "");
  }
  if (state.lane === "global-9") return game.course === "Grade 9 Global History I";
  if (state.lane === "global-10") return game.course === "Grade 10 Global History II" || game.course === "Grade 10 Global History II + Grade 11 U.S. History";
  if (state.lane === "us-11") return game.course === "Grade 11 U.S. History" || game.course === "Grade 10 Global History II + Grade 11 U.S. History";
  if (state.lane === "electives") return ["Economics", "Civics and Participation in Government"].includes(game.course || "");
  if (state.lane === "writing") return /essay|writing|short answer|long answer|crq|constructed response|document|enduring issue|frq|dbq|saq/i.test(text) || ["regents-practice-exam", "ap-practice-exam"].includes(game.id);
  return true;
}
function priority(game) {
  if (game.id === "mastery-path") return -9;
  if (game.id === "source-lab") return -8;
  if (game.id === "source-audit") return -7.5;
  if (game.id === "writing-coach") return -7;
  if (game.id === "history-hunters") return -6;
  if (game.id === "archive-quest") return -5;
  if (game.id === "cold-war-invaders") return -4.7;
  if (game.id === "timeline-runner") return -4.55;
  if (game.id === "chrono-defense-infinite") return -4.35;
  if (game.id === "chrono-pinball") return -4.2;
  if (game.id === "time-rift-survivors") return -4.1;
  if (game.id === "regents-practice-exam") return -4;
  if (game.id === "ap-practice-exam") return -3.9;
  if (game.id === "review-maze-chase") return -2.7;
  if (game.id === "regents-rally-source-circuit") return -2.6;
  if (game.id === "source-sprint") return -3;
  if (game.id === "lightning-review") return -2;
  if (game.id === "vocab-vault") return -1;
  if (game.id === "chrono-defense-infinite") return 0;
  if (game.id === "boss-rush-arena") return 1;
  if (game.id === "arcade-duel") return 3;
  if (/AP Psychology Final/i.test(game.title)) return 3;
  if (/Cumulative Yearlong|Yearlong Review/i.test(game.title)) return 4;
  if (isRegentsLike(game)) return 5;
  return 10;
}
function filteredGames() {
  const query = state.query.trim().toLowerCase();
  // Quick-filter helper (uses MrMacsSearchHelpers if available, else built-in fallbacks)
  const qf = state.quickFilter || null;
  const profile = (window.MrMacsProfile && window.MrMacsProfile.get) ? window.MrMacsProfile.get() : null;
  return GAMES.filter((game) => {
    if (!laneMatches(game)) return false;
    // Cross-curricular fix: games tagged "All Courses" pass every
    // course filter. They adapt to the player's enrolled course via
    // the shared question bank, so the audit's "50 games hidden when
    // student picks a specific course" bug is fixed here.
    if (!gameMatchesCourseLabel(game, state.course)) return false;
    if (!subjectMatches(game, state.subject)) return false;
    if (state.type !== "All Game Types" && displayGameType(game) !== state.type) return false;
    if (query && !searchable(game).includes(query)) return false;
    // Quick-filter — delegate to MrMacsSearchHelpers.filters if present, else built-in logic
    if (qf) {
      if (window.MrMacsSearchHelpers && window.MrMacsSearchHelpers.filters && typeof window.MrMacsSearchHelpers.filters[qf] === "function") {
        try { if (!window.MrMacsSearchHelpers.filters[qf](game, profile)) return false; } catch (e) {}
      } else {
        // Built-in fallbacks
        if (qf === "unplayed") {
          var played = profile && profile.history && profile.history.find(function(h) { return h.id === game.id; });
          if (played) return false;
        } else if (qf === "scholar") {
          if (!(game.tags && game.tags.includes("scholar"))) return false;
        } else if (qf === "mobile") {
          if (!(game.tags && game.tags.includes("mobile"))) return false;
        } else if (qf === "quick") {
          if (!isQuickPlay(game)) return false;
        }
      }
    }
    return true;
  }).sort((a, b) => {
    if (state.sort === "title") return a.title.localeCompare(b.title, undefined, { numeric: true });
    if (state.sort === "type") return (displayGameType(a) + a.course + a.title).localeCompare(displayGameType(b) + b.course + b.title, undefined, { numeric: true });
    if (state.sort === "course") return (a.course + a.originalFile).localeCompare(b.course + b.originalFile, undefined, { numeric: true });
    if (state.sort === "newest") {
      // Newest-first uses the position in NEW_FLAGSHIP_IDS (newest at index 0).
      // Anything not in that list sorts to the back, then by title for stability.
      const newIdx = (typeof NEW_FLAGSHIP_IDS !== "undefined") ? NEW_FLAGSHIP_IDS : [];
      const ai = newIdx.indexOf(a.id);
      const bi = newIdx.indexOf(b.id);
      const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      if (aRank !== bRank) return aRank - bRank;
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    }
    return priority(a) - priority(b) || (a.course + a.originalFile).localeCompare(b.course + b.originalFile, undefined, { numeric: true });
  });
}
function featuredGames() {
  // Returns the top 5 featured games for the bento bento layout
  // (which uses fixed nth-child positions for slots 1-4 and overflow
  // for slot 5). FEATURED_GAME_IDS is ordered new-flagships-first so
  // half the bento always reflects the latest sweep.
  const picks = FEATURED_GAME_IDS.map((id) => GAMES.find((game) => game.id === id));
  return [...new Map(picks.filter(Boolean).map((game) => [game.id, game])).values()].slice(0, 5);
}

function openFullYearJeopardyReview() {
  jeopardyState.course = JEOPARDY_ALL_COURSES;
  jeopardyState.subject = JEOPARDY_ALL_SUBJECTS;
  jeopardyState.query = "cumulative";
  const course = document.getElementById("jeopardyCourseSelect");
  const subject = document.getElementById("jeopardySubjectSelect");
  const search = document.getElementById("jeopardySearch");
  if (course) course.value = JEOPARDY_ALL_COURSES;
  if (subject) subject.value = JEOPARDY_ALL_SUBJECTS;
  if (search) search.value = jeopardyState.query;
  renderJeopardyModes();
  if (window.MrMacsOpenCabinetFolder) {
    window.MrMacsOpenCabinetFolder("jeopardy");
  } else {
    document.getElementById("jeopardy")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderLaneTabs() {
  const container = document.getElementById("laneTabs");
  if (!container) return;
  container.setAttribute("role", "tablist");
  container.innerHTML = LANES.map((lane) =>
    '<button class="lane-tab ' + (state.lane === lane.id ? "active" : "") + '" type="button" role="tab" aria-selected="' + (state.lane === lane.id ? "true" : "false") + '" data-lane="' + lane.id + '">' + escapeHtml(lane.label) + '</button>'
  ).join("");
  container.querySelectorAll(".lane-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.lane = button.dataset.lane;
      render();
    });
  });
}

// ============== Quick-filter chip wiring ==============
(function () {
  function wireQfChips() {
    document.querySelectorAll(".qfc-chip").forEach(function (chip) {
      if (chip.dataset.qfWired) return;
      chip.dataset.qfWired = "1";
      chip.addEventListener("click", function () {
        var filterKey = chip.dataset.quickFilter;
        var pressed = chip.getAttribute("aria-pressed") === "true";
        document.querySelectorAll(".qfc-chip").forEach(function (c) {
          c.setAttribute("aria-pressed", "false");
        });
        if (!pressed) {
          chip.setAttribute("aria-pressed", "true");
          if (typeof state !== "undefined" && state) state.quickFilter = filterKey;
        } else {
          if (typeof state !== "undefined" && state) state.quickFilter = null;
        }
        if (typeof render === "function") render();
      });
    });
  }
  // Wire now (chips may be in DOM immediately) and also after DOMContentLoaded
  if (document.readyState !== "loading") {
    wireQfChips();
  } else {
    document.addEventListener("DOMContentLoaded", wireQfChips);
  }
})();

// ============== Status pills + marquee ==============
function renderMetrics() {
  const courseCount = allCourseLabels().length || uniq(GAMES.map((game) => game.course)).length;
  const typeCount = uniq(GAMES.map(displayGameType)).length;
  const clueCount = (window.DIAG_BANK_COVERAGE && window.DIAG_BANK_COVERAGE.questions)
    ? Number(window.DIAG_BANK_COVERAGE.questions)
    : GAMES.reduce((sum, game) => sum + Number(game.clueCount || 0), 0);
  const pills = [
    GAMES.length + " live games",
    courseCount + " courses",
    GAMES.filter(isQuickPlay).length + " quick plays"
  ];
  // statusPills was replaced by the Phase 1 profile pill; guard against null
  // so other consumers can't break if the topbar layout changes again.
  const statusPillsEl = document.getElementById("statusPills");
  if (statusPillsEl) {
    statusPillsEl.innerHTML = pills
      .map((text) => '<span class="pill">' + escapeHtml(text) + '</span>')
      .join("");
  }

  const items = [
    { class: "gold",  pre: "Live games",       big: GAMES.length },
    { class: "",      pre: "Courses on deck",  big: courseCount },
    { class: "rose",  pre: "Premium arcade",   big: GAMES.filter(isPremiumArcade).length },
    { class: "green", pre: "Review prompts",   big: clueCount },
    { class: "gold",  pre: "Practice tools",   big: GAMES.filter((game) => qualityTier(game) === "practice").length },
    { class: "green", pre: "Jeopardy boards", big: GAMES.filter(isJeopardyBoard).length },
    { class: "",      pre: "Regents sprint sets", big: GAMES.filter(g => g.gameType.includes("Regents")).length },
    { class: "rose",  pre: "AP Psych missions",  big: GAMES.filter(g => g.course === "AP Psychology").length },
    { class: "green", pre: "Grade 10 missions",  big: GAMES.filter(g => g.course === "Grade 10 Global History II").length }
  ];
  const marquee = items.concat(items).map((item) =>
    '<span class="hm-item ' + item.class + '"><span class="hm-dot"></span>' +
    escapeHtml(item.pre) + ' <strong>' + escapeHtml(String(item.big)) + '</strong></span>'
  ).join("");
  document.getElementById("marqueeTrack").innerHTML = marquee;
}

function shortHeroTitle(title) {
  return String(title || "")
    .replace("History Hunters 2: Atlas Quest", "History Hunters 2")
    .replace("Archive Quest: Sourcebound", "Archive Quest")
    .replace("Regents Practice Exam", "Regents Exam");
}
function cardSubtitle(game) {
  if (!game) return "";
  if (game.id === "history-hunters") return "Open-world review RPG with battles, party building, rewards, and course quests.";
  if (game.id === "archive-quest") return "Platform levels, double jump, review gates, and question-unlocked powers.";
  if (game.id === "review-maze-chase") return "Prototype under rebuild: evidence maze, source scrolls, chasers, and answer gates.";
  if (game.id === "cold-war-invaders") return "Atari-style Space Invaders with Cold War questions, intel bursts, and mobile controls.";
  if (game.id === "regents-practice-exam") return "Full Regents practice with official questions, writing, pacing, and score estimates.";
  if (game.id === "ap-practice-exam") return "Released AP practice with multiple-choice, writing, pacing, and score estimates.";
  if (game.id === "regents-rally-source-circuit") return "Under rebuild: historical kart drivers, drift, items, and quick review powerups.";
  if (game.id === "source-sprint") return "Fast source-based MCQ reps that sharpen reading, evidence, and accuracy.";
  if (game.id === "regents-gauntlet") return "Mixed Regents MCQ pressure run with explanations after every answer.";
  if (game.id === "writing-coach") return "CRQ, short essay, enduring issue, and Civic Literacy writing practice.";
  if (isJeopardyBoard(game)) {
    // Jon: jeopardy cards should have course as well as unit in description.
    // Compose: "<course> · <unit-or-label> — fast recall, vocabulary,
    // exam concepts." Prefers game.day if it's a clean label (no composite
    // separators). Falls back to extracting "Unit N" from filename/title,
    // but ignores high numbers (>=20) which are file-ordinal sentinels
    // (e.g. "99 - Cumulative Yearlong") not real unit numbers.
    var parts = [];
    if (game.course && game.course !== "All Courses") parts.push(game.course);
    var unitLabel = null;
    if (game.day && !/·/.test(game.day)) {
      unitLabel = game.day;
    } else {
      var src = [game.originalFile, game.file, game.title].filter(Boolean).join(" ");
      var unitMatch = src.match(/\b(?:unit|u)\s*0?(\d{1,2})\b/i);
      if (unitMatch && parseInt(unitMatch[1], 10) < 20) {
        unitLabel = "Unit " + unitMatch[1];
      } else {
        var ordMatch = src.match(/^\s*0?(\d{1,2})\s*[-–]\s*/);
        if (ordMatch && parseInt(ordMatch[1], 10) < 20) {
          unitLabel = "Unit " + ordMatch[1];
        }
      }
    }
    if (unitLabel) parts.push(unitLabel);
    var head = parts.join(" · ");
    var tail = "Fast recall, vocabulary, and exam-style concepts.";
    return head ? head + " — " + tail : tail;
  }
  return game.subtitle || game.course || "";
}
function heroSubtitle(game) {
  if (!game) return "";
  if (game.id === "history-hunters") return "Explore, battle, collect, and earn review XP.";
  if (game.id === "regents-practice-exam") return "Build pacing, source reading, and writing under exam conditions.";
  if (game.id === "ap-practice-exam") return "Practice AP multiple-choice and writing with released questions.";
  if (game.id === "archive-quest") return "Run, jump, and unlock powers with source questions.";
  if (game.id === "review-maze-chase") return "Clear the archive maze and use correct answers to turn chasers vulnerable.";
  if (game.id === "cold-war-invaders") return "Defend Earth with Cold War review questions.";
  if (isJeopardyBoard(game)) return "Fast course review for teams, recall, and tougher concepts.";
  return game.subtitle || game.course || "";
}
function featuredBadges(game) {
  const byId = {
    "history-hunters": ["flagship", "RPG", "course quests"],
    "archive-quest": ["platformer", "double jump", "review gates"],
    "review-maze-chase": ["maze chase", "source scrolls", "answer gates"],
    "regents-practice-exam": ["official exams", "writing", "score estimate"],
    "ap-practice-exam": ["released AP", "PDF sources", "rubric estimate"],
    "cold-war-invaders": ["Atari", "mobile", "questions unlock shots"]
  };
  return byId[game?.id] || [displayGameType(game), game?.course || "review"];
}
function renderHeroConsole() {
  const count = document.getElementById("heroGameCount");
  if (count) {
    // Split the count so it's accurate against Jon's 3-lane structure:
    // jeopardy boards vs arcade/practice surfaces. A single raw "games"
    // count misleads because generated Jeopardy and exam layers are also
    // catalog entries.
    const isJeo = (g) => /jeopardy/i.test(g.gameType || "") || /jeopardy/i.test(g.id || "");
    const boards = GAMES.filter(isJeo).length;
    const games = GAMES.length - boards;
    if (boards && games) {
      count.textContent = games + " games · " + boards + " boards";
    } else {
      count.textContent = GAMES.length + " ready";
    }
  }

  const primaryCard = document.getElementById("heroPrimaryCard");
  if (primaryCard) {
    primaryCard.dataset.id = "full-year-jeopardy";
    primaryCard.style.setProperty("--accent", "#ffd15c");
    primaryCard.style.setProperty("--screen-art", 'url("' + assetHref("assets/cabinet/category-tile-jeopardy.webp").replaceAll('"', "%22") + '")');
    primaryCard.innerHTML =
      '<span class="screen-kicker">Jeopardy Flagship</span>' +
      '<span class="screen-title">Full-Year Course Review</span>' +
      '<span class="screen-sub">Cumulative boards across every course and subject, before exams and arcade games.</span>' +
      '<span class="screen-cta">Open Board</span>';
    primaryCard.onclick = openFullYearJeopardyReview;
  }

  // Hero console fast-launch grid. Two practice exams stay pinned (top
  // priority for exam students) and the other two slots rotate from
  // the May 2026 flagship sweep so the front-page console actually
  // reflects what's "fresh on the floor" right now.
  const slots = [
    GAMES.find((game) => game.id === "regents-practice-exam"),
    GAMES.find((game) => game.id === "ap-practice-exam"),
    GAMES.find((game) => game.id === "source-sprint"),
    GAMES.find((game) => game.id === "source-lab")
  ].filter(Boolean);
  // If a new flagship hasn't loaded (catalog mismatch), fall back to
  // the legacy premium arcade picks so the grid never shrinks.
  while (slots.length < 4) {
    const fallback = ["source-audit", "writing-coach", "regents-gauntlet", "archive-quest"]
      .map((id) => GAMES.find((g) => g.id === id))
      .filter(Boolean)
      .find((g) => !slots.some((s) => s.id === g.id));
    if (!fallback) break;
    slots.push(fallback);
  }
  const grid = document.getElementById("heroConsoleGrid");
  if (!grid) return;
  grid.innerHTML = slots.map((game, index) => {
    const accent = accentFor(game);
    const art = cssUrlForAttr(cardArtFallbackFor(game));
    const label = ["regents-practice-exam", "ap-practice-exam"].includes(game.id) ? "Full exam" : /source/i.test(game.id + " " + game.title + " " + game.gameType) ? "Source practice" : displayGameType(game);
    return '<button class="console-launch" type="button" style="--accent:' + accent + ';--slot-art:' + art + ';--i:' + index + '" data-id="' + escapeHtml(game.id) + '">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<strong>' + escapeHtml(shortHeroTitle(game.title)) + '</strong>' +
    '</button>';
  }).join("");
  grid.querySelectorAll(".console-launch").forEach((button) => {
    button.addEventListener("click", () => openGame(GAMES.find((game) => game.id === button.dataset.id)));
  });
}

// ============== Featured 10 grid (May 11 2026 hub restructure) ==============
// Renders the 10 flagship games up front. Fixed list = 6 master games + 4
// recently-polished GOOD-tier titles. Order preserved as-given. Falls back
// gracefully if any id is missing from GAMES (skips, never crashes).
const FEATURED_10_IDS = [
  "step-pyramid",
  "sokoban-scribe",
  "mahjong-mosaic",
  "chess-cabinet",
  "bomb-scribe",
  "sudoku-scribe",
  "snake-pit",
  "brickoria",
  "atlas-2048",
  "stellar-drift"
];

function renderFeatured10() {
  const host = document.getElementById("featured10Grid");
  if (!host) return;
  const picks = FEATURED_10_IDS
    .map((id) => GAMES.find((g) => g.id === id))
    .filter(Boolean);
  if (picks.length === 0) {
    host.hidden = true;
    return;
  }
  host.innerHTML = picks.map((game, index) => {
    const accent = accentFor(game);
    const art = cssUrlForAttr(cardArtFor(game));
    const stdChip = standardsChip(game);
    const stdLabel = stdChip || (game.course === "All Courses" ? "Cross-Curricular" : game.course);
    const subtitle = cardSubtitle(game) || (game.subtitle || "");
    return '<button class="game-card f10-card" type="button" role="listitem"' +
      ' style="--accent:' + accent + ';--card-art:' + art + ';--i:' + index + '"' +
      ' data-id="' + escapeHtml(game.id) + '"' +
      ' aria-label="Play ' + escapeHtml(game.title) + '">' +
      '<span class="f10-art" aria-hidden="true">' +
        '<img src="' + escapeHtml(cardArtFor(game)) + '" alt="" loading="lazy" decoding="async" onerror="this.src=\'' + escapeHtml(cardArtFallbackFor(game)) + '\';this.onerror=null;">' +
      '</span>' +
      '<span class="f10-rank">' + String(index + 1).padStart(2, '0') + '</span>' +
      '<span class="f10-std" title="Standards alignment">' + escapeHtml(stdLabel) + '</span>' +
      '<div class="f10-body">' +
        '<h3 class="f10-title">' + escapeHtml(game.title) + '</h3>' +
        '<p class="f10-sub">' + escapeHtml(subtitle) + '</p>' +
      '</div>' +
      '<div class="f10-foot">' +
        '<span class="f10-meta">' + escapeHtml(displayGameType(game)) + '</span>' +
        '<span class="f10-cta">&#9654; PLAY</span>' +
      '</div>' +
    '</button>';
  }).join("");
  host.querySelectorAll(".f10-card").forEach((button) => {
    button.addEventListener("click", () => openGame(GAMES.find((g) => g.id === button.dataset.id)));
  });
}

// ============== Featured bento ==============
function renderFeatured() {
  const games = featuredGames();
  document.getElementById("featuredModes").innerHTML = games.map((game, index) => {
    const accent = accentFor(game);
    const art = cssUrlForAttr(cardArtFor(game));
    const thumb = thumbnailFor(game);
    const meta = game.id === "regents-practice-exam" ? "28 MCQs + document writing" : game.id === "ap-practice-exam" ? "MCQ + FRQ score estimate" : (game.clueCount || 0) + (isRegentsLike(game) ? " MCQs" : " review prompts");
    const pills = featuredBadges(game).slice(0, 4).map((c) => '<span class="mb-pill">' + escapeHtml(c) + '</span>').join('');
    return '<button class="mode-button" type="button" style="--accent:' + accent + ';--card-art:' + art + ';--mode-art:' + art + ';--thumb-art:' + cssUrlForAttr(thumb) + ';--i:' + index + '" data-id="' + escapeHtml(game.id) + '">' +
      '<span class="mb-art" aria-hidden="true"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy" decoding="async" onerror="this.src=\'' + escapeHtml(cardArtFor(game)) + '\';this.onerror=null;"></span>' +
      '<span class="featured-rank">0' + (index + 1) + '</span>' +
      '<span class="mb-tag">' + escapeHtml(displayGameType(game)) + '</span>' +
      '<div class="mb-copy">' +
        '<h3 class="mb-title">' + escapeHtml(game.title) + '</h3>' +
        '<p class="mb-sub">' + escapeHtml(cardSubtitle(game)) + '</p>' +
        '<div class="mb-pills">' + pills + '</div>' +
      '</div>' +
      '<div class="mb-foot">' +
        '<span class="mb-meta">' + escapeHtml(game.course) + ' · ' + escapeHtml(meta) + '</span>' +
        '<span class="launch-chip">Play</span>' +
      '</div>' +
    '</button>';
  }).join("");
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => openGame(GAMES.find((game) => game.id === button.dataset.id)));
  });
  // Legacy launchFeatured button was removed when the hero became a
  // cabinet-folder menu. Guard against null so this no-op silently
  // skips instead of killing the rest of the boot inline script.
  var __launchFeatured = document.getElementById("launchFeatured");
  if (__launchFeatured) __launchFeatured.onclick = () => {
    // If the student has an enrolled course and that course has games
    // available, prefer the highest-priority featured game from that
    // course (also matches compound courses like "G10 + G11"). Falls
    // back to the global #1 featured pick when no course is set or
    // there are no course-relevant featured games.
    const enrolled = (window.MrMacsProfile && window.MrMacsProfile.getCourse)
      ? window.MrMacsProfile.getCourse() : "";
    if (enrolled) {
      const courseFeatured = games.find((g) => gameMatchesEnrolledCourse(g, enrolled));
      if (courseFeatured) {
        openGame(courseFeatured);
        return;
      }
    }
    if (games[0]) openGame(games[0]);
  };

  // Hero CTA label rotation based on profile state
  // DISABLED per Jon's "1989 cabinet simple" directive: the third hero
  // CTA is now consistently labelled "Arcade & Learning Games" so the
  // home page priority order (Jeopardy / Practice / Arcade Games) reads
  // cleanly. Daily Challenge claim still works — it lives in the daily-
  // band below the priority lanes. Resume-run nudge moved into the
  // profile drawer where it doesn't interfere with the front-page order.
  (function () {
    return;  // legacy rewrite disabled
    var heroCta = document.getElementById("launchFeatured");
    if (!heroCta) return;
    var span = heroCta.querySelector("span:first-child");
    if (!span) return;
    try {
      var profile = (window.MrMacsProfile && window.MrMacsProfile.get) ? window.MrMacsProfile.get() : null;
      if (profile && profile.activeSession && profile.activeSession.gameId) {
        span.textContent = "🎮 Resume your run →";
        heroCta.title = "Resume " + (profile.activeSession.gameId || "your last game");
        return;
      }
      var todayKey2 = (function () {
        var d = new Date();
        return d.getFullYear() + "-" +
          String(d.getMonth() + 1).padStart(2, "0") + "-" +
          String(d.getDate()).padStart(2, "0");
      })();
      var dailyClaimed = profile && profile.dailyGoalsClaimed &&
        profile.dailyGoalsClaimed[todayKey2];
      if (!dailyClaimed) {
        span.textContent = "📰 Today's Challenge (+60 💎) →";
        heroCta.title = "Claim today's daily challenge for 60 shards";
        return;
      }
    } catch (e) {}
    // Fallback — quick play
    span.textContent = "🎲 Quick Play →";
    heroCta.title = "Launch a random game";
  })();
}

/* Maps a game's `course` field to a short standards-alignment code.
   Teachers love seeing standards on every card — instant trust signal
   that the content aligns with what they're teaching. */
function standardsChip(game) {
  if (!game || !game.course) return "";
  const c = String(game.course).toLowerCase();
  // Multi-course games show the more specific tag
  if (c.includes("ap psychology")) return "AP Psych";
  if (c.includes("ap us history") || c.includes("apush")) return "AP USH";
  if (c.includes("ap world")) return "AP World";
  if (c.includes("ap european")) return "AP Euro";
  if (c.includes("ap human")) return "AP HuG";
  if (c.includes("ap macro")) return "AP Macro";
  if (c.includes("ap micro")) return "AP Micro";
  if (c.includes("ap u.s. government") || c.includes("ap us gov")) return "AP GoPo";
  if (c.includes("ap economics")) return "AP Econ";
  if (c.includes("grade 11 u.s.") || c.includes("us regents")) return "NYS US Regents";
  if (c.includes("grade 10 global") || c.includes("global regents")) return "NYS Global Regents";
  if (c.includes("grade 9 global")) return "NYS 9";
  if (c.includes("grade 8 u.s.")) return "NYS 8";
  if (c.includes("grade 7 u.s.")) return "NYS 7";
  if (c.includes("grade 6")) return "NYS 6";
  if (c.includes("grade 5")) return "NYS 5";
  if (c.includes("civics")) return "NYS Civics";
  if (c.includes("economics")) return "NYS Econ";
  if (c.includes("all courses")) return "Cross-Curricular";
  return null;
}

function buttonCard(game, fallback, className) {
  if (!game && !fallback) return "";
  const item = game || fallback;
  const accent = game ? accentFor(game) : item.accent;
  const glyph = game ? glyphFor(game) : item.glyph;
  const art = game ? ';--card-art:' + cssUrlForAttr(cardArtFor(game)) : "";
  const id = game ? game.id : item.id;
  const title = game ? game.title : item.title;
  const subtitle = game ? cardSubtitle(game) : item.subtitle;
  const kicker = game ? displayGameType(game) : item.kicker;
  const meta = game ? [game.course === "All Courses" ? "" : game.course, game.day || game.grade, game.gameType].filter(Boolean).slice(0, 2).join(" · ") : item.meta;
  const stdChip = game ? standardsChip(game) : null;
  const stdHtml = stdChip ? '<span class="std-chip" title="Standards alignment">' + escapeHtml(stdChip) + '</span>' : '';
  return '<button class="' + className + '" type="button" style="--accent:' + accent + ';--glyph:\'' + glyph + '\'' + art + '" data-id="' + escapeHtml(id) + '">' +
    '<span class="' + (className === "path-card" ? "path-kicker" : "focus-kicker") + '">' + escapeHtml(kicker) + '</span>' +
    stdHtml +
    '<div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(subtitle) + '</p></div>' +
    '<div class="' + (className === "path-card" ? "path-foot" : "focus-foot") + '"><span>' + escapeHtml(meta || "") + '</span><span class="launch-chip">Play</span></div>' +
  '</button>';
}

function renderLaunchPaths() {
  // Jon: home page should push Jeopardy first, Regents/AP practice 2nd,
  // and all arcade/learning games third. Order here drives the visual
  // priority of the three primary CTAs on the hub.
  const paths = [
    {
      id: "jeopardy-lane",
      fallback: { id: "jeopardy-lane", title: "Jeopardy Boards", subtitle: "Run unit and course review rounds that build recall, confidence, and speed.", kicker: "Jeopardy", meta: "all courses", accent: "#ff7bcc", glyph: "J" }
    },
    {
      id: "practice-lane",
      preferFallback: true,
      fallback: { id: "practice-lane", title: "Practice Exams", subtitle: "Train full Regents and AP exams with real questions, writing, and pacing.", kicker: "Exam prep", meta: "Regents + AP", accent: "#ffd15c", glyph: "EXAM" }
    },
    {
      id: "play-lane",
      fallback: (function () {
        var arcadeCount = (typeof computeLiveCounts === "function") ? computeLiveCounts()["arcade-games-number"] : "78";
        return { id: "play-lane", title: "Arcade & Learning Games", subtitle: "Snake Pit, Brickoria, Chess Cabinet, Sokoban Scribe — " + arcadeCount + " games that drill review through play.", kicker: "Game-first", meta: arcadeCount + " games", accent: "#62e9ff", glyph: "PLAY" };
      })()
    }
  ];
  const html = paths.map((path) => {
    let game = path.preferFallback ? null : GAMES.find((g) => g.id === path.id);
    return buttonCard(game, path.fallback, "path-card");
  }).join("");
  const container = document.getElementById("pathCards");
  if (!container) return;
  container.innerHTML = html;
  container.querySelectorAll(".path-card").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.id === "play-lane") {
        state.lane = "play";
        state.course = "All Courses";
        state.subject = "All Subjects";
        state.type = "All Game Types";
        syncFilters();
        render();
        document.getElementById("featured").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (button.dataset.id === "jeopardy-lane") {
        state.lane = "jeopardy";
        state.course = "All Courses";
        state.subject = "All Subjects";
        state.type = "Jeopardy";
        syncFilters();
        render();
        document.getElementById("jeopardy").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (button.dataset.id === "practice-lane") {
        state.lane = "regents";
        state.course = "All Courses";
        state.subject = "All Subjects";
        state.type = "All Game Types";
        syncFilters();
        render();
        document.getElementById("practice").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      openGame(GAMES.find((game) => game.id === button.dataset.id));
    });
  });
}

function renderPracticeModes() {
  const ids = ["regents-practice-exam", "ap-practice-exam", "source-sprint", "regents-gauntlet", "writing-coach", "source-lab", "source-audit", "arcade-duel", "global-regents-sprint-day-1", "us-regents-sprint-day-1"];
  const games = ids.map((id) => GAMES.find((game) => game.id === id)).filter(Boolean);
  const backup = GAMES.filter((game) => laneMatchesWith("regents", game)).slice(0, 6);
  const unique = [...new Map(games.concat(backup).map((game) => [game.id, game])).values()].slice(0, 5);
  const container = document.getElementById("practiceModes");
  if (!container) return;
  const enrolled = (window.MrMacsProfile && window.MrMacsProfile.getCourse)
    ? window.MrMacsProfile.getCourse() : "";
  const examCount = (GENERATED_PRACTICE_BLUEPRINTS || []).length;
  const generatedCard = examCount ? buttonCard(null, {
    id: "generated-practice-exam",
    title: enrolled ? displayCourseLabel(enrolled) + " Practice Exam" : "All-Subject Practice Exams",
    subtitle: "Open generated NYS/AP practice exams for every course, including MCQs, written responses, unit coverage, and released-source metadata.",
    kicker: "All-subject exams",
    meta: examCount + " course exams",
    accent: "#ffd15c",
    glyph: "EXAM"
  }, "focus-card") : "";
  container.innerHTML = generatedCard + unique.map((game) => buttonCard(game, null, "focus-card")).join("");
  container.querySelectorAll(".focus-card").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.id === "generated-practice-exam") {
        openGeneratedPracticeExam(enrolled || "");
        return;
      }
      openGame(GAMES.find((game) => game.id === button.dataset.id));
    });
  });
}

function renderMasteryModes() {
  const ids = ["mastery-path", "source-lab", "writing-coach", "regents-practice-exam", "ap-practice-exam"];
  const games = ids.map((id) => GAMES.find((game) => game.id === id)).filter(Boolean);
  const container = document.getElementById("masteryModes");
  if (!container) return;
  container.innerHTML = games.map((game) => buttonCard(game, null, "focus-card")).join("");
  container.querySelectorAll(".focus-card").forEach((button) => {
    button.addEventListener("click", () => openGame(GAMES.find((game) => game.id === button.dataset.id)));
  });
}

// ============== Smart arcade menu ==============
function smartAlias(game) {
  return SMART_TITLE_ALIASES[game?.id] || {};
}
function smartTitle(game) {
  return smartAlias(game).title || game.title;
}
function smartKicker(game) {
  return smartAlias(game).kicker || displayGameType(game);
}
function smartSubtitle(game) {
  return smartAlias(game).subtitle || cardSubtitle(game);
}
function trustBadgeFor(game) {
  if (!game) return "";
  if (SOURCE_LOCKED_GAME_IDS.has(game.id)) return "Verified sources";
  if (/Jeopardy/i.test(displayGameType(game))) return "Review board";
  if (/AP\b/.test(game.course || "")) return "AP practice";
  return "";
}
function compactCourseLabel(course) {
  return String(course || "")
    .replace("Grade 10 Global History II", "Global 10")
    .replace("Grade 11 U.S. History", "U.S. 11")
    .replace("Grade 9 Global History I", "Global 9")
    .replace("Grade 8 U.S. History II", "Grade 8")
    .replace("Grade 7 U.S. History I", "Grade 7")
    .replace("Grade 6 Social Studies", "Grade 6")
    .replace("Grade 5 Social Studies", "Grade 5")
    .replace("AP U.S. History", "APUSH")
    .replace("AP World History: Modern", "AP World")
    .replace("AP European History", "AP Euro")
    .replace("AP Human Geography", "AP HUG")
    .replace("AP U.S. Government and Politics", "AP Gov")
    .replace("AP Macroeconomics", "AP Macro")
    .replace("AP Microeconomics", "AP Micro")
    .replace(" Exam Review", "");
}
function pickGames(ids) {
  return uniqueGames(ids.map(gameById));
}
function recentProgressGames(summary) {
  const ids = (summary?.recent || []).map((item) => item.gameId).filter(Boolean);
  return pickGames(ids);
}
function localPopularGames(summary) {
  const data = summary?.data || {};
  const rows = Object.values(data.games || {});
  return uniqueGames(rows
    .sort((a, b) => {
      const scoreA = Number(a.completions || 0) * 8 + Number(a.plays || 0) * 4 + Number(a.launches || 0);
      const scoreB = Number(b.completions || 0) * 8 + Number(b.plays || 0) * 4 + Number(b.launches || 0);
      return scoreB - scoreA || String(b.lastSeen || "").localeCompare(String(a.lastSeen || ""));
    })
    .map((row) => gameById(row.id)));
}
function cumulativeJeopardyPicks() {
  const firstByCourse = new Map();
  GAMES.filter(isJeopardyBoard).sort(jeopardyBoardSort).forEach((game) => {
    const isCumulative = /cumulative|yearlong|final exam/i.test([game.title, game.originalFile, game.file].join(" "));
    if (isCumulative && !firstByCourse.has(game.course)) firstByCourse.set(game.course, game);
  });
  return [...firstByCourse.values()];
}
// Master flagship list used by Smart Menu lanes that previously
// hid the May 2026 sweep behind hard-coded old-classics arrays.
// Order matters: newest first so they surface on the front page.
const NEW_FLAGSHIP_IDS = [
  // Round-3 mega drop (May 9 2026) — 15 cabinets (pinball-empire removed: overlapped chrono-pinball)
  "snake-pit", "defender-drift", "boggle-beat",
  "sudoku-scribe", "memory-palace", "knights-quest", "crossword-cabinet",
  "pong-doctor", "atlas-2048", "bomb-scribe", "chess-cabinet",
  "solitaire-hall", "archive-tycoon", "cube-crash", "word-bridge",
  // Round-2 flagships (May 2026 second sweep)
  "mahjong-mosaic", "reflex-run", "tower-climb", "plinko-lab", "tron-trails",
  // Round-1 May 2026 flagships
  "rumor-whack", "citadel", "anagram-atlas", "centiquill", "sokoban-scribe",
  "echo-hall", "galaxy-defender", "step-pyramid", "chronohop",
  "cascade", "chronoblocks", "source-snake", "stellar-drift", "brickoria"
];
function smartMenuGames(laneId) {
  const summary = window.MrMacsProgress?.summary(GAMES) || { recent: [], data: {}, recommendation: {} };
  const recommended = summary.recommendation?.game ? [summary.recommendation.game] : [];
  const recents = recentProgressGames(summary);
  const popular = localPopularGames(summary);
  const featured = featuredGames();
  // Pick the first three new flagships up front so they appear in the
  // generic "recommended" / "popular" lanes for fresh players whose
  // progress signal is empty.
  const newPicks = pickGames(NEW_FLAGSHIP_IDS);
  // Round-3 picks (May 9 2026 mega drop) — surface a few up front in
  // recommended / popular / arcade so a fresh player lands on something
  // brand new even before any progress signal exists.
  const round3Picks = pickGames([
    "snake-pit", "chess-cabinet", "memory-palace",
    "boggle-beat", "knights-quest", "crossword-cabinet", "defender-drift",
    "pong-doctor", "atlas-2048"
  ]);
  if (laneId === "recommended") {
    // Seed with the player's recommendation + recents, then surface 3
    // round-3 cabinets so a fresh player sees something new, then 3
    // earlier flagships, then fall back to popular / featured / tools.
    return uniqueGames(recommended.concat(recents, round3Picks.slice(0, 3), newPicks.slice(0, 3), popular, featured, pickGames(["mastery-path", "source-lab"]))).slice(0, 8);
  }
  if (laneId === "continue") {
    return uniqueGames(recents.concat(recommended, popular, round3Picks.slice(0, 2), newPicks.slice(0, 3), featured)).slice(0, 6);
  }
  if (laneId === "popular") {
    // Mix local-popular + round-3 cabinets + earlier flagships + classic
    // premium picks. Round-3 goes first so it gets visible carousel slots.
    return uniqueGames(popular.concat(round3Picks.slice(0, 4), newPicks.slice(0, 3), pickGames(["history-hunters", "archive-quest", "cold-war-invaders", "regents-practice-exam", "ap-practice-exam", "source-sprint"]))).slice(0, 8);
  }
  if (laneId === "exams") {
    return pickGames(["regents-practice-exam", "ap-practice-exam", "writing-coach", "source-lab", "source-sprint", "regents-gauntlet"]);
  }
  if (laneId === "arcade") {
    // "Review Games" lane — leads with the round-3 mega drop, then
    // earlier flagships, then legacy premium arcade games. Slice 12 so
    // the rail shows three visible rows.
    return uniqueGames(round3Picks.slice(0, 6).concat(newPicks, pickGames(["history-hunters", "archive-quest", "cold-war-invaders", "timeline-runner", "chrono-defense-infinite", "chrono-pinball"]))).slice(0, 12);
  }
  if (laneId === "quick") {
    return pickGames(["source-sprint", "archive-cipher", "lightning-review", "vocab-vault"]);
  }
  if (laneId === "ap") {
    const apBoards = GAMES.filter((game) => laneMatchesWith("ap", game) && isJeopardyBoard(game))
      .filter((game) => /cumulative|final exam|period 8|cold war|unit 8|unit 9|research methods/i.test([game.title, game.originalFile, game.file].join(" ")))
      .sort(jeopardyBoardSort)
      .slice(0, 5);
    return uniqueGames(pickGames(["ap-practice-exam"]).concat(apBoards)).slice(0, 6);
  }
  if (laneId === "regents") {
    const sprints = GAMES.filter((game) => /Regents Sprint/i.test(game.gameType || "")).slice(0, 2);
    return uniqueGames(pickGames(["regents-practice-exam", "source-sprint", "regents-gauntlet", "writing-coach", "source-lab"]).concat(sprints)).slice(0, 6);
  }
  if (laneId === "jeopardy") {
    return uniqueGames(cumulativeJeopardyPicks().concat(filteredJeopardyBoards())).slice(0, 6);
  }
  return featured;
}
function smartCard(game) {
  const accent = accentFor(game);
  const art = cssUrlForAttr(cardArtFor(game));
  const glyph = glyphFor(game);
  const meta = [compactCourseLabel(game.course), displayGameType(game)].filter(Boolean).join(" · ");
  const trustBadge = trustBadgeFor(game);
  return '<button class="smart-card" type="button" style="--accent:' + accent + ';--card-art:' + art + ';--glyph:\'' + glyph + '\'" data-id="' + escapeHtml(game.id) + '">' +
    '<div class="smart-art" aria-hidden="true"></div>' +
    '<div class="smart-body">' +
      '<span class="smart-kicker">' + escapeHtml(smartKicker(game)) + '</span>' +
      (trustBadge ? '<span class="smart-trust">' + escapeHtml(trustBadge) + '</span>' : '') +
      '<h3>' + escapeHtml(smartTitle(game)) + '</h3>' +
      '<p>' + escapeHtml(smartSubtitle(game)) + '</p>' +
    '</div>' +
    '<div class="smart-foot"><span>' + escapeHtml(meta) + '</span><span class="play">Play</span></div>' +
  '</button>';
}
function openSmartLaneInLibrary() {
  const lane = SMART_MENU_LANES.find((item) => item.id === smartMenuLane) || SMART_MENU_LANES[0];
  state.lane = lane.libraryLane || "all";
  state.course = "All Courses";
  state.subject = "All Subjects";
  state.type = state.lane === "jeopardy" ? "Jeopardy" : "All Game Types";
  state.query = "";
  state.libraryExpanded = state.lane === "all";
  const search = document.getElementById("search");
  if (search) search.value = "";
  syncFilters();
  render();
  document.getElementById("library").scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderSmartMenu() {
  const tabs = document.getElementById("smartMenuTabs");
  const grid = document.getElementById("smartMenuGrid");
  const summary = document.getElementById("smartMenuSummary");
  if (!tabs || !grid || !summary) return;
  const lane = SMART_MENU_LANES.find((item) => item.id === smartMenuLane) || SMART_MENU_LANES[0];
  const games = smartMenuGames(lane.id);
  tabs.setAttribute("role", "tablist");
  tabs.innerHTML = SMART_MENU_LANES.map((item) =>
    '<button class="smart-tab ' + (item.id === lane.id ? "active" : "") + '" type="button" role="tab" aria-selected="' + (item.id === lane.id ? "true" : "false") + '" data-smart-lane="' + item.id + '">' + escapeHtml(item.label) + '</button>'
  ).join("");
  summary.innerHTML =
    '<span><strong>' + games.length + '</strong> picks · ' + escapeHtml(lane.summary) + '</span>' +
    '<button class="action compact" type="button" data-smart-more>See More</button>';
  grid.innerHTML = games.length ? games.map(smartCard).join("") : (
    '<div class="empty" role="status">' +
      '<span class="empty-ic" aria-hidden="true">' + ((window.MrMacsIcons && window.MrMacsIcons.svg("compass")) || "") + '</span>' +
      '<p class="empty-title">No picks yet</p>' +
      '<p class="empty-sub">Try clearing a course filter, switching tabs, or hit Recommended on the hero.</p>' +
      '<a class="empty-cta" href="#launch-paths">Start Recommended ' + ((window.MrMacsIcons && window.MrMacsIcons.svg("arrow-right")) || "→") + '</a>' +
    '</div>'
  );
  tabs.querySelectorAll("[data-smart-lane]").forEach((button) => {
    button.addEventListener("click", () => {
      smartMenuLane = button.dataset.smartLane;
      renderSmartMenu();
    });
  });
  summary.querySelector("[data-smart-more]")?.addEventListener("click", openSmartLaneInLibrary);
  grid.querySelectorAll(".smart-card").forEach((button) => {
    button.addEventListener("click", () => openGame(gameById(button.dataset.id)));
  });
}

function jeopardyBoardSort(a, b) {
  const courseA = a.course || "";
  const courseB = b.course || "";
  if (courseA !== courseB) return courseA.localeCompare(courseB, undefined, { numeric: true });
  if (!!a.isGeneratedJeopardy !== !!b.isGeneratedJeopardy) return a.isGeneratedJeopardy ? 1 : -1;
  return (a.originalFile || a.title).localeCompare(b.originalFile || b.title, undefined, { numeric: true });
}

function filteredJeopardyBoards() {
  const query = jeopardyState.query.trim().toLowerCase();
  return GAMES.filter(isJeopardyBoard).concat(generatedJeopardyGames()).filter((game) => {
    if (jeopardyState.course !== JEOPARDY_ALL_COURSES && displayCourseLabel(game.course) !== displayCourseLabel(jeopardyState.course)) return false;
    if (!subjectMatches(game, jeopardyState.subject, JEOPARDY_ALL_SUBJECTS)) return false;
    if (query && !searchable(game).includes(query)) return false;
    return true;
  }).sort(jeopardyBoardSort);
}

function jeopardyBoardMeta(game) {
  const parts = [];
  const subject = normalizedSubject(game.subject);
  if (subject) parts.push(subject);
  const source = [game.originalFile, game.file, game.title].join(" ");
  const unit = source.match(/\b(?:unit|u)\s*0?(\d{1,2})\b/i) || source.match(/\b(\d{1,2})\s*[-–]\s*/);
  if (unit) parts.push("Unit " + unit[1]);
  if (game.hasFinal) parts.push("Final wager");
  return parts.length ? parts.join(" · ") : "Course review board";
}

function renderJeopardyModes() {
  const games = filteredJeopardyBoards();
  const preview = games.slice(0, JEOPARDY_PREVIEW_LIMIT);
  const container = document.getElementById("jeopardyModes");
  if (!container) return;
  const summary = document.getElementById("jeopardySummary");
  if (summary) {
    const course = jeopardyState.course === JEOPARDY_ALL_COURSES ? "all course levels" : jeopardyState.course;
    const subject = jeopardyState.subject === JEOPARDY_ALL_SUBJECTS ? "all subjects" : jeopardyState.subject;
    const showing = Math.min(games.length, JEOPARDY_PREVIEW_LIMIT);
    summary.innerHTML = '<strong>' + games.length + '</strong> Jeopardy boards found for ' + escapeHtml(course) + ' · ' + escapeHtml(subject) + (games.length > showing ? ' · showing first ' + showing : '');
  }
  container.innerHTML = preview.length ? preview.map((game) => {
    const board = { ...game, gameType: "Jeopardy", day: jeopardyBoardMeta(game), subtitle: game.subtitle || game.course };
    return buttonCard(board, null, "focus-card");
  }).join("") : (
    '<div class="empty" role="status">' +
      '<span class="empty-ic" aria-hidden="true">' + ((window.MrMacsIcons && window.MrMacsIcons.svg("mind")) || "") + '</span>' +
      '<p class="empty-title">No Jeopardy boards match</p>' +
      '<p class="empty-sub">Loosen the course or subject filter, or clear the search box to see all boards.</p>' +
      '<button class="empty-cta" type="button" id="jeopardyResetBtn">Reset filters ' + ((window.MrMacsIcons && window.MrMacsIcons.svg("arrow-right")) || "→") + '</button>' +
    '</div>'
  );
  container.querySelectorAll(".focus-card").forEach((button) => {
    button.addEventListener("click", () => {
      const generated = generatedJeopardyByRuntimeId(button.dataset.id);
      if (generated) {
        openGeneratedJeopardy(generated);
      } else {
        openGame(GAMES.find((game) => game.id === button.dataset.id));
      }
    });
  });
  const all = document.getElementById("showAllJeopardyBtn");
  if (all) all.onclick = () => {
    state.lane = "jeopardy";
    state.course = jeopardyState.course === JEOPARDY_ALL_COURSES ? "All Courses" : jeopardyState.course;
    state.subject = jeopardyState.subject === JEOPARDY_ALL_SUBJECTS ? "All Subjects" : jeopardyState.subject;
    state.type = "Jeopardy";
    state.query = jeopardyState.query;
    const search = document.getElementById("search");
    if (search) search.value = state.query;
    syncFilters();
    render();
    document.getElementById("library").scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

function laneMatchesWith(lane, game) {
  const old = state.lane;
  state.lane = lane;
  const ok = laneMatches(game);
  state.lane = old;
  return ok;
}

function syncFilters() {
  const course = document.getElementById("courseFilter");
  const subject = document.getElementById("subjectFilter");
  const type = document.getElementById("typeFilter");
  if (course) course.value = state.course;
  if (subject) subject.value = state.subject;
  if (type) type.value = state.type;
}

function renderProgressReport() {
  const container = document.getElementById("progressReport");
  if (!container || !window.MrMacsProgress) return;
  const summary = window.MrMacsProgress.summary(GAMES);
  const rec = summary.recommendation && summary.recommendation.game;
  const recHtml = rec ? '<button class="action compact" type="button" data-progress-open="' + escapeHtml(rec.id) + '">Start Next</button>' : '<a class="action compact" href="#launch-paths">Choose Path</a>';
  const completed = Number(summary.completed || 0);
  const plays = Number(summary.data?.recent?.filter((item) => item.type === "game_play" || item.type === "game_complete").length || 0);
  const streak = Number(summary.streak || 0);
  const reportStamp = summary.data?.lastUpdated ? new Date(summary.data.lastUpdated).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "not started";
  const focus = summary.courseFocus;
  const focusScore = focus ? (focus.bestAccuracy !== null && focus.bestAccuracy !== undefined ? focus.bestAccuracy + "%" : focus.bestScore !== null && focus.bestScore !== undefined ? String(focus.bestScore) : "active") : "--";
  const courseFocus = focus ? [
    '<div class="progress-item"><span><strong>' + escapeHtml(compactCourseLabel(focus.title)) + '</strong><br>most active course</span><span>focus</span></div>',
    '<div class="progress-item"><span><strong>' + escapeHtml(focusScore) + '</strong><br>best local mark</span><span>best</span></div>',
    '<div class="progress-item"><span><strong>' + Number(focus.completions || 0) + '</strong><br>completed in course</span><span>done</span></div>'
  ].join("") : '<div class="progress-item"><span><strong>No course focus yet</strong><br>Play one course to unlock a focus lane.</span><span>new</span></div>';
  const recent = summary.recent.length ? summary.recent.map((item) =>
    '<div class="progress-item"><span><strong>' + escapeHtml(item.title) + '</strong><br>' + escapeHtml(item.course || "Review") + '</span><span>' + (item.score !== null && item.score !== undefined ? escapeHtml(String(item.score)) : item.accuracy !== null && item.accuracy !== undefined ? escapeHtml(item.accuracy + "%") : "opened") + '</span></div>'
  ).join("") : '<div class="progress-item"><span><strong>No local plays yet</strong><br>Start any game to build this report.</span><span>new</span></div>';
  const weak = summary.weak.length ? summary.weak.map((item) =>
    '<div class="progress-item"><span><strong>' + escapeHtml(item.title) + '</strong><br>review signal</span><span>' + Number(item.count || 0) + '</span></div>'
  ).join("") : '<div class="progress-item"><span><strong>No weak topics yet</strong><br>Complete a game or exam to see targets.</span><span>clear</span></div>';
  const best = summary.best.length ? summary.best.map((item) =>
    '<div class="progress-item"><span><strong>' + escapeHtml(item.title) + '</strong><br>' + escapeHtml(item.course || "Review") + '</span><span>' + escapeHtml(item.bestScore !== null && item.bestScore !== undefined ? String(item.bestScore) : item.bestAccuracy + "%") + '</span></div>'
  ).join("") : '<div class="progress-item"><span><strong>No best scores yet</strong><br>Scores appear after completions.</span><span>--</span></div>';
  const popularGames = localPopularGames(summary).slice(0, 5);
  const popular = popularGames.length ? popularGames.map((game) =>
    '<div class="progress-item"><span><strong>' + escapeHtml(smartTitle(game)) + '</strong><br>' + escapeHtml(displayGameType(game)) + '</span><span>hot</span></div>'
  ).join("") : '<div class="progress-item"><span><strong>Popular picks loading</strong><br>Use the Smart Menu to build local trends.</span><span>new</span></div>';
  container.innerHTML =
    '<article class="progress-card recommendation"><span class="progress-kicker">Recommended next</span><div><h3>' + escapeHtml(rec ? rec.title : "Start with Play") + '</h3><p>' + escapeHtml(summary.recommendation.reason || "Pick a path and start practicing.") + '</p></div><div class="progress-foot"><span>' + escapeHtml(rec ? rec.course + " · " + displayGameType(rec) : "practice report") + '</span>' + recHtml + '</div></article>' +
    '<article class="progress-card"><span class="progress-kicker">Report Snapshot</span><div class="progress-list">' +
      '<div class="progress-item"><span><strong>' + completed + '</strong><br>completed activities</span><span>done</span></div>' +
      '<div class="progress-item"><span><strong>' + plays + '</strong><br>recent practice signals</span><span>local</span></div>' +
      '<div class="progress-item"><span><strong>' + streak + '</strong><br>day streak</span><span>streak</span></div>' +
      '<div class="progress-item"><span><strong>' + escapeHtml(reportStamp) + '</strong><br>last update</span><span>saved</span></div>' +
    '</div></article>' +
    '<article class="progress-card"><span class="progress-kicker">Course Focus</span><div class="progress-list">' + courseFocus + '</div></article>' +
    '<article class="progress-card"><span class="progress-kicker">Recent</span><div class="progress-list">' + recent + '</div></article>' +
    '<article class="progress-card"><span class="progress-kicker">Popular Here</span><div class="progress-list">' + popular + '</div></article>' +
    '<article class="progress-card"><span class="progress-kicker">Weak Topics</span><div class="progress-list">' + weak + '</div></article>' +
    '<article class="progress-card"><span class="progress-kicker">Best Scores</span><div class="progress-list">' + best + '</div></article>';
  container.querySelectorAll("[data-progress-open]").forEach((button) => {
    button.addEventListener("click", () => openGame(GAMES.find((game) => game.id === button.dataset.progressOpen)));
  });
  const heroLaunch = document.getElementById("launchFeatured");
  if (heroLaunch && rec) heroLaunch.onclick = () => openGame(rec);
}

// ============== Quick play ==============
function renderQuickPlay() {
  const games = quickPlayIds().map((id) => GAMES.find((game) => game.id === id)).filter(Boolean);
  const container = document.getElementById("quickPlayModes");
  if (!container) return;
  container.innerHTML = games.map((game, index) => {
    const accent = accentFor(game);
    const glyph = glyphFor(game);
    const timer = game.id === "lightning-review" ? "90 sec"
      : game.id === "source-sprint" ? "3 min"
      : "open";
    const meta = game.id === "source-sprint" ? "source questions"
      : game.id === "vocab-vault" ? "typed answers"
      : "mixed MCQs";
    const art = cssUrlForAttr(cardArtFor(game));
    return '<button class="quick-card" type="button" style="--accent:' + accent + ';--card-art:' + art + ';--quick-glyph:\'' + glyph + '\';--i:' + index + '" data-id="' + escapeHtml(game.id) + '">' +
      '<div class="quick-top"><span class="quick-kicker">' + escapeHtml(displayGameType(game)) + '</span><span class="quick-timer">' + escapeHtml(timer) + '</span></div>' +
      '<div><h3>' + escapeHtml(game.title) + '</h3><p>' + escapeHtml(cardSubtitle(game)) + '</p></div>' +
      '<div class="quick-foot"><span class="quick-meta">' + escapeHtml(meta) + ' · ' + escapeHtml(String(game.clueCount || 0)) + ' prompts</span><span class="play">Play</span></div>' +
    '</button>';
  }).join("");
  container.querySelectorAll(".quick-card").forEach((button) => {
    button.addEventListener("click", () => openGame(GAMES.find((game) => game.id === button.dataset.id)));
  });
}

// ============== Course rail ==============
function renderCourseTiles() {
  const courses = allCourseLabels();
  const enrolledCourse = (window.MrMacsProfile && window.MrMacsProfile.getCourse)
    ? window.MrMacsProfile.getCourse() : "";
  const html = courses.map((course, index) => {
    const games = courseSpecificGames(course);
    const questionCount = courseQuestionCount(course);
    const palette = paletteFor(course);
    const types = uniq(games.map(displayGameType));
    const lead = types[0] || "Review";
    const count = games.length;
    const labelType = course.startsWith("AP") ? "AP Course" : (course.startsWith("Grade") ? "NYS course" : (/Algebra|Geometry|Science|English|ELA|Mathematics/i.test(course) ? "NYS course" : "Elective"));
    const isEnrolled = displayCourseLabel(course) === displayCourseLabel(enrolledCourse);
    const enrolledBadge = isEnrolled ? '<span class="course-tile-mine" aria-label="Your enrolled course">Yours</span>' : '';
    const enrolledClass = isEnrolled ? ' is-enrolled' : '';
    const meta = [
      questionCount ? questionCount + " questions" : "",
      count ? count + " games" : "shared arcade tools"
    ].filter(Boolean).join(" · ");
    return '<button class="course-tile' + enrolledClass + '" type="button" style="--accent:' + palette.accent + ';--course-glyph:\'' + palette.glyph + '\';--i:' + index + '" data-course="' + escapeHtml(course) + '">' +
      enrolledBadge +
      '<small>' + escapeHtml(labelType) + '</small>' +
      '<strong>' + escapeHtml(course) + '</strong>' +
      '<span>' + escapeHtml(meta || lead) + '</span>' +
    '</button>';
  }).join("");
  const container = document.getElementById("courseTiles");
  container.innerHTML = html;
  container.querySelectorAll(".course-tile").forEach((button) => {
    button.addEventListener("click", () => {
      state.lane = "all";
      state.course = button.dataset.course;
      syncFilters();
      render();
      document.getElementById("library").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  // Rail controls
  const prev = document.querySelector(".rail-btn.prev");
  const next = document.querySelector(".rail-btn.next");
  function step(dir) {
    const card = container.querySelector(".course-tile");
    const w = card ? card.offsetWidth + 14 : 320;
    container.scrollBy({ left: dir * w * 2, behavior: "smooth" });
  }
  if (prev) prev.addEventListener("click", () => step(-1));
  if (next) next.addEventListener("click", () => step(1));
}

// ============== Library cards ==============
function card(game) {
  const accent = accentFor(game);
  const glyph = glyphFor(game);
  const thumb = thumbnailFor(game);
  const art = cssUrlForAttr(cardArtFor(game));
  const categoryLine = (game.categories || []).slice(0, 3).join(" · ");
  const meta = game.id === "regents-practice-exam" ? "28 MCQs + writing" : game.id === "ap-practice-exam" ? "MCQ + FRQ practice" : (game.clueCount || 0) + (isRegentsLike(game) ? " MCQs" : " clues") + " · " + (game.hasFinal ? "Final wager" : "Practice");
  // Mark cards for the May 2026 flagship sweep with a gold "New" pill
  // so they pop in the library grid even when filters are wide.
  const isNew = NEW_FLAGSHIP_IDS.indexOf(game.id) !== -1;
  const newBadge = isNew ? '<span class="badge is-new" title="Shipped May 2026">🆕 New</span>' : '';
  return '<button class="game-card" type="button" style="--accent:' + accent + ';--course-glyph:\'' + glyph + '\';--card-art:' + art + '" data-id="' + escapeHtml(game.id) + '">' +
    '<div class="gc-art">' +
      '<img class="gc-thumb" src="' + escapeHtml(thumb) + '" alt="" loading="lazy" decoding="async" onerror="this.hidden=true;this.closest(\'.gc-art\').classList.add(\'missing-thumb\')">' +
      '<div class="gc-stripe">' +
        newBadge +
        '<span class="badge hot">' + escapeHtml(game.day || game.grade) + '</span>' +
        '<span class="badge">' + escapeHtml(displayGameType(game)) + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="gc-body">' +
      '<h3>' + escapeHtml(game.title) + '</h3>' +
      '<p>' + escapeHtml(cardSubtitle(game)) + '</p>' +
    '</div>' +
    '<div class="card-bottom">' +
      '<span class="micro">' + escapeHtml(meta) + (categoryLine ? '<br>' + escapeHtml(categoryLine) : '') + '</span>' +
      '<span class="play">Play</span>' +
    '</div>' +
  '</button>';
}
function openCoursePractice(course) {
  const label = displayCourseLabel(course);
  const key = primarySharedBankKey(label);
  if (window.MrMacsQuizGauntlet && typeof window.MrMacsQuizGauntlet.open === "function") {
    const opts = {
      courseId: key,
      courseLabel: label,
      rounds: 10,
      gameId: key + "-course-practice"
    };
    announceMultiplayerActivity({
      id: opts.gameId,
      title: label + " Practice Run",
      kind: "quiz-gauntlet",
      url: withMultiplayerRoom("#practice"),
      opts
    });
    window.MrMacsQuizGauntlet.open(opts);
    return;
  }
  alert("Course practice is still loading. Try again in a moment.");
}
function courseSurfaceCards(course) {
  if (!course || course === "All Courses") return "";
  const questionCount = courseQuestionCount(course);
  if (!questionCount) return "";
  const label = displayCourseLabel(course);
  const palette = paletteFor(label);
  const exactGames = courseSpecificGames(label).length;
  const art = cssUrlForAttr("assets/cabinet/category-tile-practice.webp");
  const meta = questionCount + " course questions" + (exactGames ? " · " + exactGames + " course games" : " · shared arcade games");
  const exam = generatedPracticeBlueprintForCourse(label);
  const boardCount = (GENERATED_JEOPARDY_BLUEPRINTS || []).filter((board) => displayCourseLabel(board.courseLabel) === label).length;
  return '<button class="game-card course-practice-card" type="button" style="--accent:' + palette.accent + ';--course-glyph:\'' + palette.glyph + '\';--card-art:' + art + '" data-course-practice="' + escapeHtml(label) + '">' +
    '<div class="gc-art">' +
      '<img class="gc-thumb" src="' + escapeHtml(assetHref("assets/cabinet/category-tile-practice.webp")) + '" alt="" loading="lazy" decoding="async">' +
      '<div class="gc-stripe">' +
        '<span class="badge hot">Course Bank</span>' +
        '<span class="badge">All Subjects</span>' +
      '</div>' +
    '</div>' +
    '<div class="gc-body">' +
      '<h3>' + escapeHtml(label) + ' Practice Run</h3>' +
      '<p>Start a playable standards-aligned quick quiz from the expanded NYS/AP course bank.</p>' +
    '</div>' +
    '<div class="card-bottom">' +
      '<span class="micro">' + escapeHtml(meta) + '</span>' +
      '<span class="play">Start</span>' +
    '</div>' +
  '</button>' +
  (exam ? '<button class="game-card course-practice-card" type="button" style="--accent:' + palette.accent + ';--course-glyph:\'' + palette.glyph + '\';--card-art:' + art + '" data-course-exam="' + escapeHtml(label) + '">' +
    '<div class="gc-art">' +
      '<img class="gc-thumb" src="' + escapeHtml(assetHref("assets/cabinet/category-tile-practice.webp")) + '" alt="" loading="lazy" decoding="async">' +
      '<div class="gc-stripe">' +
        '<span class="badge hot">Practice Exam</span>' +
        '<span class="badge">' + escapeHtml(exam.sourceMode || "NYS/AP backed") + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="gc-body">' +
      '<h3>' + escapeHtml(label) + ' Practice Exam</h3>' +
      '<p>Run a course-specific exam shell with MCQs, written responses, unit coverage, and released-source metadata.</p>' +
    '</div>' +
    '<div class="card-bottom">' +
      '<span class="micro">' + escapeHtml((exam.sectionPlan || []).map((s) => s.label).slice(0, 2).join(" · ") || "exam blueprint") + '</span>' +
      '<span class="play">Exam</span>' +
    '</div>' +
  '</button>' : '') +
  (boardCount ? '<button class="game-card course-practice-card" type="button" style="--accent:' + palette.accent + ';--course-glyph:\'' + palette.glyph + '\';--card-art:' + cssUrlForAttr("assets/cabinet/category-tile-jeopardy.webp") + '" data-course-jeopardy="' + escapeHtml(label) + '">' +
    '<div class="gc-art">' +
      '<img class="gc-thumb" src="' + escapeHtml(assetHref("assets/cabinet/category-tile-jeopardy.webp")) + '" alt="" loading="lazy" decoding="async">' +
      '<div class="gc-stripe">' +
        '<span class="badge hot">Unit Jeopardy</span>' +
        '<span class="badge">' + boardCount + ' boards</span>' +
      '</div>' +
    '</div>' +
    '<div class="gc-body">' +
      '<h3>' + escapeHtml(label) + ' Unit Jeopardy</h3>' +
      '<p>Open the generated unit-by-unit Jeopardy board list for this course.</p>' +
    '</div>' +
    '<div class="card-bottom">' +
      '<span class="micro">' + boardCount + ' generated unit boards · Final Jeopardy included</span>' +
      '<span class="play">Boards</span>' +
    '</div>' +
  '</button>' : '');
}
function shouldLimitDefaultLibrary() {
  return !state.libraryExpanded &&
    state.lane === "all" &&
    !String(state.query || "").trim() &&
    state.course === "All Courses" &&
    state.subject === "All Subjects" &&
    state.type === "All Game Types" &&
    state.sort === "priority";
}
function render() {
  renderLaneTabs();
  const games = filteredGames();
  const totalGames = (typeof GAMES !== "undefined" && GAMES) ? GAMES.length : games.length;
  const previewLimit = libraryPreviewLimit();
  const limited = shouldLimitDefaultLibrary() && games.length > previewLimit;
  const visibleGames = limited ? games.slice(0, previewLimit) : games;
  const countLabel = document.getElementById("countLabel");
  // Filter clarity: when filters are active (any non-default), show
  // "X of Y games match" so the player can tell at a glance how many
  // games were filtered out. Otherwise stay concise.
  const filtersActive = state.lane !== "all" ||
    state.course !== "All Courses" ||
    state.subject !== "All Subjects" ||
    state.type !== "All Game Types" ||
    String(state.query || "").trim().length > 0;
  const selectedCourseQuestions = state.course !== "All Courses" ? courseQuestionCount(state.course) : 0;
  if (countLabel) {
    if (limited) {
      countLabel.textContent = visibleGames.length + " of " + totalGames + " games · showing top picks";
    } else if (selectedCourseQuestions) {
      countLabel.textContent = selectedCourseQuestions + " course questions · " + games.length + " compatible games/tools";
    } else if (filtersActive) {
      countLabel.textContent = games.length + " of " + totalGames + " games match";
    } else {
      countLabel.textContent = games.length + (games.length === 1 ? " game showing" : " games showing");
    }
  }
  if (grid) {
    const practiceCard = courseSurfaceCards(state.course);
    const gameCards = visibleGames.map(card).join("");
    grid.innerHTML = (practiceCard || visibleGames.length) ? practiceCard + gameCards : (
      '<div class="empty" role="status">' +
        '<span class="empty-ic" aria-hidden="true">' + ((window.MrMacsIcons && window.MrMacsIcons.svg("explorer")) || "") + '</span>' +
        '<p class="empty-title">No missions match those filters</p>' +
        '<p class="empty-sub">' + (filtersActive
          ? 'Try a broader keyword, clear the lane filter, or hit Reset to see every game in the catalog.'
          : 'Try a broader keyword, clear the lane filter, or open the Random pick on the right.') + '</p>' +
        '<button class="empty-cta" type="button" id="libraryResetBtn">Clear filters ' + ((window.MrMacsIcons && window.MrMacsIcons.svg("arrow-right")) || "→") + '</button>' +
      '</div>'
    );
  }
  const libraryActions = document.getElementById("libraryActions");
  const showAllLibraryBtn = document.getElementById("showAllLibraryBtn");
  if (libraryActions && showAllLibraryBtn) {
    libraryActions.hidden = !limited;
    showAllLibraryBtn.textContent = "Show All " + games.length + " Games";
  }
  if (grid) {
    grid.querySelectorAll("[data-course-practice]").forEach((button) => {
      button.addEventListener("click", () => openCoursePractice(button.dataset.coursePractice));
    });
    grid.querySelectorAll("[data-course-exam]").forEach((button) => {
      button.addEventListener("click", () => openGeneratedPracticeExam(button.dataset.courseExam));
    });
    grid.querySelectorAll("[data-course-jeopardy]").forEach((button) => {
      button.addEventListener("click", () => {
        jeopardyState.course = button.dataset.courseJeopardy;
        jeopardyState.subject = JEOPARDY_ALL_SUBJECTS;
        jeopardyState.query = "";
        syncFilters();
        const jc = document.getElementById("jeopardyCourseSelect");
        const js = document.getElementById("jeopardySubjectSelect");
        const jq = document.getElementById("jeopardySearch");
        if (jc) jc.value = jeopardyState.course;
        if (js) js.value = JEOPARDY_ALL_SUBJECTS;
        if (jq) jq.value = "";
        renderJeopardyModes();
        document.getElementById("jeopardy")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    grid.querySelectorAll(".game-card").forEach((button) => {
      if (button.dataset.coursePractice) return;
      button.addEventListener("click", () => openGame(GAMES.find((game) => game.id === button.dataset.id)));
    });
  }
}

function settleHashTarget() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  const target = document.querySelector(hash);
  if (!target) return;
  [80, 320, 900].forEach((delay) => {
    setTimeout(() => target.scrollIntoView({ behavior: "auto", block: "start" }), delay);
  });
}

// ============== Player ==============
const MOBILE_HEAVY_GAME_IDS = new Set([
  "history-hunters",
  "archive-quest",
  "review-maze-chase",
  "cold-war-invaders",
  "regents-rally-source-circuit",
  "global-quest",
  "us-history-quest"
]);
function isMobilePerfMode() {
  return window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 760px)").matches;
}
function isMobileHeavyGame(game) {
  return isMobilePerfMode() && game && (MOBILE_HEAVY_GAME_IDS.has(game.id) || /hunters|quest|invaders|rally|platform|pokemon/i.test(game.title + " " + game.file));
}
function activeMultiplayerCode() {
  try {
    const room = window.MrMacsMultiplayer?.activeRoom?.();
    if (room?.code) return room.code;
    const desc = window.MrMacsMultiplayer?.activeDescriptor?.();
    if (desc?.code) return desc.code;
  } catch (e) {}
  return "";
}
function withMultiplayerRoom(urlValue) {
  const code = activeMultiplayerCode();
  if (!code) return urlValue;
  try {
    const url = new URL(urlValue, location.href);
    url.hash = "room=" + code;
    return url.href;
  } catch (e) {
    return urlValue;
  }
}
function announceMultiplayerActivity(activity) {
  try {
    if (window.MrMacsMultiplayer?.announceActivity) {
      window.MrMacsMultiplayer.announceActivity(activity);
    }
  } catch (e) {}
}
function launchUrl(file) {
  if (!isMobilePerfMode()) return withMultiplayerRoom(file);
  const url = new URL(file, location.href);
  url.searchParams.set("perf", "lite");
  url.searchParams.set("fx", "lite");
  url.searchParams.set("mobile", "1");
  return withMultiplayerRoom(url.href);
}
function playerFocusables() {
  return Array.from(player.querySelectorAll("button, [href], iframe, [tabindex]:not([tabindex='-1'])"))
    .filter((element) => !element.disabled && element.offsetParent !== null);
}
// ============== One-window navigation ==============
// User feedback May 10 2026: games used to open in an iframe modal (player
// overlay), creating "a window over a window" with scroll bleed-through.
// We now navigate directly to the game URL — the game IS the page. Each game
// has its own back-link to return to the hub.
function openGame(game) {
  if (!game) return;
  currentGame = game;
  window.MrMacsAnalytics?.track("game_launch", {
    gameId: game.id,
    title: game.title,
    course: game.course,
    gameType: game.gameType,
    displayGameType: displayGameType(game)
  }, { counter: "game-launches", once: false });
  // Persist hub state so the back-link can restore filters/scroll on return.
  try {
    sessionStorage.setItem("mrmacs:hub-return", JSON.stringify({
      scrollY: window.scrollY,
      state: state,
      ts: Date.now()
    }));
  } catch (e) { /* storage disabled is fine */ }
  // Modifier-click / middle-click → background tab.
  // Otherwise → full-page navigation in same tab. One window. Always.
  const target = launchUrl(game.file);
  announceMultiplayerActivity({
    id: game.id,
    title: game.title,
    kind: displayGameType(game),
    url: target
  });
  window.location.href = target;
}
function closeGame() {
  // Retained for any legacy callers; navigation back to hub is handled by
  // each game's own back-link or the browser back button.
  if (typeof history !== "undefined" && history.length > 1) {
    history.back();
  } else {
    window.location.href = "index.html";
  }
}

// ============== Attract-Mode Carousel ==============
// Cycles a curated set of flagship/featured games across the marquee
// strip above the hero. Pause-on-hover; respects reduced-motion. Reads
// from state.games once they're loaded.
function initAttractCarousel() {
  var el = document.getElementById("attractCarousel");
  var title = document.getElementById("acTitle");
  if (!el || !title) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var counts = (typeof computeLiveCounts === "function") ? computeLiveCounts() : null;
    var totalLabel = counts ? counts["total-entries"] : "2967";
    title.textContent = "OPEN LIBRARY · " + totalLabel + " GAMES READY";
    return;
  }
  // Curated rotation — flagship + crowd-pleasers + fresh course shells.
  var POOL = [
    { id: "snake-pit",         name: "SNAKE PIT" },
    { id: "brickoria",         name: "BRICKORIA 20-ERA" },
    { id: "stellar-drift",     name: "STELLAR DRIFT" },
    { id: "source-snake",      name: "SOURCE SNAKE" },
    { id: "word-bridge",       name: "WORD BRIDGE" },
    { id: "chess-cabinet",     name: "CHESS CABINET" },
    { id: "sokoban-scribe",    name: "SOKOBAN SCRIBE" },
    { id: "mahjong-mosaic",    name: "MAHJONG MOSAIC" },
    { id: "bomb-scribe",       name: "BOMB SCRIBE" },
    { id: "step-pyramid",      name: "STEP PYRAMID" },
    { id: "sudoku-scribe",     name: "SUDOKU SCRIBE" },
    { id: "atlas-2048",        name: "ATLAS 2048" },
    { id: "knights-quest",     name: "KNIGHT'S QUEST" },
    { id: "galaxy-defender",   name: "GALAXY DEFENDER" },
    { id: "boss-rush",         name: "BOSS RUSH" },
    { id: "ap-psychology",     name: "AP PSYCHOLOGY" },
    { id: "apush",             name: "APUSH GAUNTLET" },
    { id: "global-9",          name: "GLOBAL 9 SPRINT" }
  ];
  var i = 0;
  var paused = false;
  el.addEventListener("mouseenter", function () { paused = true;  });
  el.addEventListener("mouseleave", function () { paused = false; });

  function tick() {
    if (paused) return;
    var g = POOL[i % POOL.length];
    title.classList.add("ac-fade");
    setTimeout(function () {
      title.textContent = g.name;
      title.setAttribute("href", "./games/" + g.id + "/");
      title.classList.remove("ac-fade");
    }, 220);
    i++;
  }
  // Prime first frame immediately, then cycle every 3.6s.
  tick();
  setInterval(tick, 3600);
}

// ============== Cabinet Menu (1989 folder-tile navigation) ==============
// Wires each .cabinet-folder tile in the hero to its target band. Click
// → close any currently-open folder, mark this one as open, reveal the
// matching band, scroll to it, inject a "← Back to Menu" link. Folders
// map to: jeopardy → #jeopardy, practice → #practice, arcade →
// #featured + #library, daily → #daily.
function initCabinetMenu() {
  const folders = document.querySelectorAll(".cabinet-folder");
  if (!folders.length) return;
  // Map of folder key → array of section ids to reveal (in order)
  const SECTIONS = {
    jeopardy: ["jeopardy"],
    practice: ["practice"],
    arcade:   ["featured", "library"],
    daily:    ["daily"]
  };
  function closeAll() {
    folders.forEach(f => f.classList.remove("is-open"));
    document.querySelectorAll("main#main > .section-open").forEach(s => {
      s.classList.remove("section-open");
      const back = s.querySelector(".back-to-menu");
      if (back) back.remove();
    });
  }
  function openFolder(key) {
    closeAll();
    // Cabinet "select" beep when a folder opens — feels like a real
    // arcade cabinet menu selection. SFX library auto-skips if muted.
    try { if (window.MrMacsSFX && window.MrMacsSFX.play) window.MrMacsSFX.play("select"); } catch (e) {}
    folders.forEach(f => { if (f.dataset.cabinetFolder === key) f.classList.add("is-open"); });
    const ids = SECTIONS[key] || [];
    ids.forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      section.classList.add("section-open");
      // Inject Back-to-Menu link inside the first band-head, if there is one
      if (!section.querySelector(".back-to-menu")) {
        const back = document.createElement("button");
        back.type = "button";
        back.className = "back-to-menu";
        back.innerHTML = '<span aria-hidden="true">←</span> Back to Menu';
        back.addEventListener("click", function () {
          try { if (window.MrMacsSFX && window.MrMacsSFX.play) window.MrMacsSFX.play("navigate"); } catch (e) {}
          closeAll();
          const hero = document.getElementById("top");
          if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        const head = section.querySelector(".band-head") || section.firstElementChild;
        if (head && head.parentNode === section) {
          section.insertBefore(back, head);
        } else {
          section.insertBefore(back, section.firstChild);
        }
      }
    });
    // Scroll to first opened section
    if (ids.length) {
      const first = document.getElementById(ids[0]);
      if (first) {
        setTimeout(() => first.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
    }
  }
  window.MrMacsOpenCabinetFolder = openFolder;
  folders.forEach(f => {
    f.addEventListener("click", function () { openFolder(f.dataset.cabinetFolder); });
  });
  // Allow URL hash + anchor links to route through the cabinet menu.
  // Without this, the topnav "Play" / "Library" links and the "Enter
  // Arcade" CTA jumped to anchors that are hidden by default — dead
  // navigation. Now any anchor pointing to a band id opens its folder.
  const HASH_MAP = {
    jeopardy: "jeopardy",
    practice: "practice",
    featured: "arcade",
    library:  "arcade",
    daily:    "daily",
    "launch-paths": "arcade"
  };
  const hash = (location.hash || "").replace(/^#/, "");
  if (HASH_MAP[hash]) {
    setTimeout(() => openFolder(HASH_MAP[hash]), 200);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const target = (a.getAttribute("href") || "").replace(/^#/, "");
    if (HASH_MAP[target]) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        openFolder(HASH_MAP[target]);
      });
    }
  });

  // ─── Keyboard navigation — feels like a real arcade joystick ───
  // Arrow keys move the cursor between folders, Enter opens the
  // selected folder, ESC closes any open folder. The cursor is the
  // .is-cursor class on a single folder.
  const folderList = Array.from(folders);
  let cursorIdx = 0;
  function setCursor(idx) {
    cursorIdx = ((idx % folderList.length) + folderList.length) % folderList.length;
    folderList.forEach((f, i) => f.classList.toggle("is-cursor", i === cursorIdx));
    try { if (window.MrMacsSFX && window.MrMacsSFX.play) window.MrMacsSFX.play("navigate"); } catch (e) {}
  }
  document.addEventListener("keydown", function (e) {
    // Only react when the user is not typing into a field
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/i.test(tag)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(cursorIdx + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(cursorIdx - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      // Only fire Enter on folder open if no folder is currently open
      // (so Enter inside an open section doesn't bounce back)
      const anyOpen = document.querySelector("main#main > .section-open");
      if (!anyOpen && folderList[cursorIdx]) {
        e.preventDefault();
        openFolder(folderList[cursorIdx].dataset.cabinetFolder);
      }
    } else if (e.key === "Escape") {
      const anyOpen = document.querySelector("main#main > .section-open");
      if (anyOpen) {
        try { if (window.MrMacsSFX && window.MrMacsSFX.play) window.MrMacsSFX.play("navigate"); } catch (e) {}
        closeAll();
        const hero = document.getElementById("top");
        if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
}

// ============== Drill Misses card ==============
// Surfaces a "Drill Your Misses" entry-point below the cabinet menu
// whenever the student has ≥1 due wrong-answer card. Routes the
// student to Snake Pit (which has review-mix wired) for retrieval
// practice. Re-polls every 30s so a card retired during the session
// hides the card live.
function initDrillMisses() {
  const card = document.getElementById("drillMissesCard");
  const count = document.getElementById("dmCount");
  if (!card) return;
  function refresh() {
    let dueN = 0;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.getDueWrongAnswers) {
        dueN = window.MrMacsProfile.getDueWrongAnswers(80).length;
      }
    } catch (e) {}
    if (dueN > 0) {
      card.hidden = false;
      if (count) count.textContent = dueN;
    } else {
      card.hidden = true;
    }
  }
  refresh();
  setInterval(refresh, 30000);
  // Also refresh on profile updates (so the card hides as questions retire)
  if (window.MrMacsProfile && typeof window.MrMacsProfile.on === "function") {
    window.MrMacsProfile.on("profile:update", refresh);
    window.MrMacsProfile.on("answer:record", refresh);
  }
}

// ============== Canvas FX ==============
function initFx() {
  const canvas = document.getElementById("fx");
  if (!canvas || isMobilePerfMode() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  let width = 0, height = 0, dpr = 1;
  const particles = Array.from({ length: 64 }, (_, index) => ({
    x: (index * 137.5) % 100,
    y: (index * 61.7) % 100,
    z: .35 + ((index * 29) % 100) / 120,
    hue: index % 4
  }));
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    width = Math.floor(innerWidth * dpr);
    height = Math.floor(innerHeight * dpr);
    canvas.width = width; canvas.height = height;
    canvas.style.width = "100%"; canvas.style.height = "100%";
  }
  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    const t = time * .00018;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i += 1) {
      const y = height * (.18 + i * .085) + Math.sin(t * 3 + i) * 12 * dpr;
      const alpha = .025 + i * .005;
      ctx.strokeStyle = i % 3 === 0 ? "rgba(245,196,81," + alpha + ")" : "rgba(122,240,255," + alpha + ")";
      ctx.lineWidth = Math.max(1, dpr);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * .28, y - 30 * dpr, width * .72, y + 30 * dpr, width, y - 8 * dpr);
      ctx.stroke();
    }
    particles.forEach((particle, index) => {
      const drift = (t * 18 * particle.z + index * 11) % 120;
      const x = ((particle.x + drift) % 120 - 10) * width / 100;
      const y = (particle.y / 100) * height;
      const radius = (1.0 + particle.z * 1.9) * dpr;
      const color = particle.hue === 0 ? "122,240,255"
                  : particle.hue === 1 ? "245,196,81"
                  : particle.hue === 2 ? "184,146,255"
                  : "105,240,170";
      ctx.fillStyle = "rgba(" + color + "," + (.10 + particle.z * .12) + ")";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    requestAnimationFrame(draw);
  }
  resize();
  addEventListener("resize", resize, { passive: true });
  requestAnimationFrame(draw);
}

// ============== Hero parallax ==============
function initParallax() {
  if (isMobilePerfMode() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const bg = document.querySelector(".hero-bg");
  if (!bg) return;
  let target = 0, current = 0;
  function tick() {
    current += (target - current) * .08;
    bg.style.setProperty("--bgY", current.toFixed(2) + "px");
    requestAnimationFrame(tick);
  }
  function onScroll() {
    target = -Math.min(window.scrollY * .18, 120);
  }
  addEventListener("scroll", onScroll, { passive: true });
  tick();
}

// ============== Scroll reveal ==============
function initReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => el.classList.add("in"));
    return;
  }
  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.classList.contains("reveal-stagger")) {
          [...el.children].forEach((child, i) => child.style.setProperty("--i", i));
        }
        el.classList.add("in");
        observer.unobserve(el);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
  targets.forEach((target) => observer.observe(target));
}

// ============== Boot ==============
async function boot() {
  try {
    await Promise.all([loadGamesManifest(), loadGeneratedJeopardyBlueprints(), loadGeneratedPracticeBlueprints()]);
    // Refresh hero/cabinet/meta count copy from the just-loaded manifest
    // BEFORE renderHeroConsole / initAttractCarousel / renderLaunchPaths
    // so they all read accurate values (instead of the hand-coded numbers
    // that drift every time a new course ships).
    applyLiveCounts();
    // Apply enrolled-course default to library + jeopardy filters BEFORE
    // initFilters() so the course-aware default lands on first render.
    try {
      var enrolledCourse = (window.MrMacsProfile && window.MrMacsProfile.getCourse)
        ? window.MrMacsProfile.getCourse() : "";
      if (enrolledCourse) {
        // Confirm the enrolled course actually has games on this build
        // (including compound-course tags) — if not, fall back to
        // "All Courses" so the library doesn't go empty for niche
        // courses without catalog entries.
        if (courseHasPlayableSurface(enrolledCourse)) {
          state.course = enrolledCourse;
          if (typeof jeopardyState !== "undefined") jeopardyState.course = enrolledCourse;
        }
      }
    } catch (e) {}
    initFilters();
    renderMetrics();
    renderLaunchPaths();
    renderMasteryModes();
    renderPracticeModes();
    renderFeatured();
    renderFeatured10();
    renderHeroConsole();
    renderProgressReport();
    renderSmartMenu();
    renderJeopardyModes();
    renderQuickPlay();
    renderCourseTiles();
    initAttractCarousel();
    initCabinetMenu();
    initDrillMisses();
    initFx();
    initParallax();
    render();
    settleHashTarget();
    initReveal();
    // Restore hub state if we just returned from a game (one-window nav).
    // Keeps the user's filters + scroll position on round-trip. Stale state
    // (>30 min) is ignored.
    try {
      var savedRaw = sessionStorage.getItem("mrmacs:hub-return");
      if (savedRaw) {
        var saved = JSON.parse(savedRaw);
        if (saved && (Date.now() - (saved.ts || 0)) < 30 * 60 * 1000) {
          if (saved.state && typeof saved.state === "object") {
            Object.keys(saved.state).forEach(function (k) {
              if (k in state) state[k] = saved.state[k];
            });
            render();
          }
          if (typeof saved.scrollY === "number") {
            // Defer to next frame so the rendered grid has its final height.
            requestAnimationFrame(function () { window.scrollTo(0, saved.scrollY); });
          }
        }
        sessionStorage.removeItem("mrmacs:hub-return");
      }
    } catch (e) { /* storage disabled — silently skip */ }
    // Wire the topbar "Enter Arcade" button. For a brand-new player
    // (no plays in this browser) we point them at #newCabinet so they
    // see the May 2026 sweep. Returning players keep the default
    // #launch-paths target.
    var enterArcadeBtn = document.getElementById("enterArcadeBtn");
    if (enterArcadeBtn) {
      enterArcadeBtn.addEventListener("click", function (event) {
        try {
          var summary = window.MrMacsProgress && window.MrMacsProgress.summary
            ? window.MrMacsProgress.summary(GAMES) : null;
          var totalPlays = summary && summary.data && summary.data.recent
            ? summary.data.recent.length : 0;
          var freshPlayer = !totalPlays;
          var cabinet = document.getElementById("newCabinet");
          if (freshPlayer && cabinet && !cabinet.hidden) {
            event.preventDefault();
            cabinet.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } catch (e) { /* fall through to default href */ }
      });
    }
    // Rotate the library search placeholder through new flagship titles
    // for fresh players (< 3 plays). Draws attention to fresh content
    // that they otherwise might not search for. Stops once the user
    // types or once the player has played a few games.
    (function rotateSearchPlaceholder() {
      var input = document.getElementById("search");
      if (!input) return;
      try {
        var summary = window.MrMacsProgress && window.MrMacsProgress.summary
          ? window.MrMacsProgress.summary(GAMES) : null;
        var totalPlays = summary && summary.data && summary.data.recent
          ? summary.data.recent.length : 0;
        if (totalPlays >= 3) return;
      } catch (e) {}
      var newGameTitles = (typeof NEW_FLAGSHIP_IDS !== "undefined" ? NEW_FLAGSHIP_IDS : [])
        .map(function (id) {
          var g = GAMES.find(function (game) { return game.id === id; });
          return g ? g.title : null;
        })
        .filter(Boolean);
      if (!newGameTitles.length) return;
      var basePlaceholder = "Search civil rights · imperialism · cold war · memory…";
      var prompts = newGameTitles.map(function (t) { return "Try: " + t; });
      prompts.push(basePlaceholder);
      var idx = 0;
      var timer = setInterval(function () {
        if (input.value || document.activeElement === input) {
          clearInterval(timer);
          input.placeholder = basePlaceholder;
          return;
        }
        input.placeholder = prompts[idx % prompts.length];
        idx += 1;
      }, 3500);
      // Stop rotating as soon as the user engages with the input.
      input.addEventListener("input", function () { clearInterval(timer); }, { once: true });
      input.addEventListener("focus", function () {
        clearInterval(timer);
        input.placeholder = basePlaceholder;
      }, { once: true });
    })();
    window.addEventListener("hashchange", settleHashTarget);
    window.matchMedia?.("(max-width: 760px)").addEventListener?.("change", () => render());
    window.addEventListener("mrmacs-progress", () => { renderProgressReport(); renderSmartMenu(); });
    window.addEventListener("storage", (event) => {
      if (!event.key || event.key.includes("student-progress") || event.key.includes("local-traffic")) {
        renderProgressReport();
        renderSmartMenu();
      }
    });
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "mrmacs-progress-updated") {
        renderProgressReport();
        renderSmartMenu();
      }
    });
    window.addEventListener("focus", () => { renderProgressReport(); renderSmartMenu(); });
    // When the user changes their enrolled course, re-default the
    // library + jeopardy filters and re-render the daily challenge.
    // Also reset subject + lane to defaults so the student doesn't land
    // on an empty filter combination (subject from the old course
    // doesn't apply to the new one).
    window.MrMacsProfile?.on("course:change", function (e) {
      var newCourse = (e && e.detail && e.detail.course) || "";
      // Update visible select inputs
      var cf = document.getElementById("courseFilter");
      var sf = document.getElementById("subjectFilter");
      var jc = document.getElementById("jeopardyCourseSelect");
      var jsubj = document.getElementById("jeopardySubjectSelect");
      // Always reset subject + lane to broadest defaults — the new
      // course's subject taxonomy is different.
      state.subject = "All Subjects";
      state.lane = "all";
      if (sf) sf.value = "All Subjects";
      // Reset lane tabs visual state to "all"
      document.querySelectorAll("#laneTabs .lane-tab").forEach(function (b) {
        b.classList.toggle("active", b.dataset.lane === "all");
      });
      if (typeof jeopardyState !== "undefined") {
        jeopardyState.subject = (typeof JEOPARDY_ALL_SUBJECTS !== "undefined") ? JEOPARDY_ALL_SUBJECTS : "All Subjects";
        if (jsubj) jsubj.value = jeopardyState.subject;
      }
      if (newCourse) {
        if (courseHasPlayableSurface(newCourse)) {
          state.course = newCourse;
          if (cf) cf.value = newCourse;
        }
        var hasJeopardy = allJeopardyCourseLabels().map(displayCourseLabel).indexOf(displayCourseLabel(newCourse)) !== -1;
        if (hasJeopardy && typeof jeopardyState !== "undefined") {
          jeopardyState.course = newCourse;
          if (jc) jc.value = newCourse;
        }
      } else {
        state.course = "All Courses";
        if (cf) cf.value = "All Courses";
        if (typeof jeopardyState !== "undefined") jeopardyState.course = (typeof JEOPARDY_ALL_COURSES !== "undefined") ? JEOPARDY_ALL_COURSES : "All Courses";
        if (jc) jc.value = jeopardyState.course;
      }
      render();
      if (typeof renderJeopardyModes === "function") renderJeopardyModes();
      if (typeof renderCourseTiles === "function") renderCourseTiles();
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new Event("mrmacs-course-changed"));
      }
    });
    document.getElementById("printReportBtn")?.addEventListener("click", () => window.print());
    document.getElementById("clearReportBtn")?.addEventListener("click", () => {
      if (confirm("Clear local progress and saved practice drafts stored in this browser?")) {
        if (window.MrMacsProgress?.clearAllLocalPractice) window.MrMacsProgress.clearAllLocalPractice();
        else window.MrMacsProgress?.clear();
        renderProgressReport();
        renderSmartMenu();
      }
    });
  } catch (error) {
    if (window.MrMacsDebug) console.error(error);
    document.getElementById("countLabel").textContent = "Games failed to load";
    grid.innerHTML = (
      '<div class="empty" role="alert">' +
        '<span class="empty-ic" aria-hidden="true">' + ((window.MrMacsIcons && window.MrMacsIcons.svg("warning")) || "") + '</span>' +
        '<p class="empty-title">Game library couldn\'t load</p>' +
        '<p class="empty-sub">Your browser had a hiccup pulling the catalog. A refresh usually fixes it.</p>' +
        '<button class="empty-cta" type="button" onclick="location.reload()">Refresh page ' + ((window.MrMacsIcons && window.MrMacsIcons.svg("arrow-right")) || "→") + '</button>' +
      '</div>'
    );
  }
}

boot();

// FIX-11: Delegated handler for all data-rail rail-btn prev/next buttons.
// The original renderCourseTiles() only wires the first .rail-btn in the DOM
// (querySelector) — this handles continueRail, newCabinetRail, and any others.
(function () {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".rail-btn[data-rail]");
    if (!btn) return;
    var railId = btn.dataset.rail;
    var rail = document.getElementById(railId);
    if (!rail) return;
    var isPrev = btn.classList.contains("prev");
    var card = rail.querySelector("[class*='card']");
    var step = card ? card.offsetWidth + 14 : 280;
    rail.scrollBy({ left: isPrev ? -step * 2 : step * 2, behavior: "smooth" });
  });
})();

// ============================================================================
// PHASE 1 — Player Identity & Cross-Game Loop
// Welcome flow, profile pill, drawer, achievement showcase, settings.
// All data is local to this device (localStorage). Nothing sent off-browser.
// ============================================================================
(function () {
  if (!window.MrMacsProfile) return;
  var P = window.MrMacsProfile;

  // ---- Icon rendering ----
  // We let the browser render native colorful emojis directly. The
  // MrMacsIcons SVG library is still available for places that genuinely
  // need a monoline glyph (topnav, ks-fob, etc.), but emoji-bound things
  // (avatars, achievements, daily-icon, routing icons) just emit the raw
  // emoji char so the OS renders it as a colorful native glyph.
  // Codex-generated image assets will replace these later.
  function renderIcon(emoji /* , opts */) {
    if (!emoji) return "";
    return String(emoji).replace(/[<>&]/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;";
    });
  }

  // ---- Body-class application for settings (font / contrast / colorblind) ----
  function applySettingsToBody(s) {
    s = s || P.getSettings();
    document.body.classList.toggle("font-dyslexic", s.fontFamily === "dyslexic");
    document.body.classList.toggle("contrast-high", s.contrast === "high");
    ["cb-deuteranope", "cb-protanope", "cb-tritanope"].forEach(function (c) {
      document.body.classList.remove(c);
    });
    if (s.colorblind && s.colorblind !== "off") document.body.classList.add("cb-" + s.colorblind);
  }
  applySettingsToBody();

  // ---- Topbar profile pill ----
  var pill = document.getElementById("profilePill");
  var ppAvatar = document.getElementById("ppAvatar");
  var ppName = document.getElementById("ppName");
  var ppShards = document.getElementById("ppShards");
  var ppStreak = document.getElementById("ppStreak");

  function updatePill() {
    if (!pill) return;
    var profile = P.get();
    var hasProfile = P.exists();
    pill.dataset.empty = hasProfile ? "false" : "true";
    var diamondSvg = renderIcon("💎");
    var flameSvg = renderIcon("🔥");
    if (hasProfile) {
      if (ppAvatar) ppAvatar.innerHTML = renderIcon(profile.avatar || "🎓");
      ppName.textContent = profile.name;
      ppShards.innerHTML = diamondSvg + ' <span class="pp-shards-num">' + profile.shards.toLocaleString() + '</span>';
      var streakNum = profile.streak.current || 0;
      ppStreak.innerHTML = flameSvg + ' <span class="pp-streak-num">' + streakNum + '</span>';
      ppStreak.classList.toggle("is-zero", streakNum < 1);
      // Hot streak (>= 7 days) gets a subtle flicker animation on the flame
      ppStreak.classList.toggle("is-hot", streakNum >= 7);
      ppStreak.classList.toggle("is-blazing", streakNum >= 30);
    } else {
      if (ppAvatar) ppAvatar.innerHTML = renderIcon("🎓");
      ppName.textContent = "Sign in";
      ppShards.innerHTML = diamondSvg + ' <span class="pp-shards-num">0</span>';
      ppStreak.innerHTML = flameSvg + ' <span class="pp-streak-num">0</span>';
      ppStreak.classList.remove("is-hot");
      ppStreak.classList.remove("is-blazing");
    }
    // Active boost indicators in topbar pill
    var ppBuffs = document.getElementById("ppBuffs");
    if (ppBuffs && hasProfile && P.getInventory) {
      var inv = P.getInventory();
      var pieces = [];
      if (inv.luckyCharmActive) {
        pieces.push('<span class="pp-buff pp-buff-lucky" title="Lucky Charm active — 2x shards">✨</span>');
      }
      if (inv.coinDoublerActive) {
        pieces.push('<span class="pp-buff pp-buff-coin" title="Coin Doubler active — 2x shards">🪙</span>');
      }
      if ((inv.streakShield || 0) > 0) {
        pieces.push('<span class="pp-buff pp-buff-shield" title="' + inv.streakShield + ' streak shield' + (inv.streakShield > 1 ? 's' : '') + ' ready">🛡<sup>' + inv.streakShield + '</sup></span>');
      }
      ppBuffs.innerHTML = pieces.join("");
      ppBuffs.style.display = pieces.length ? "inline-flex" : "none";
      // Pill gets a glow ring whenever any timed buff is active
      pill.classList.toggle("is-buffed", inv.luckyCharmActive || inv.coinDoublerActive);
    } else if (ppBuffs) {
      ppBuffs.innerHTML = "";
      ppBuffs.style.display = "none";
      pill.classList.remove("is-buffed");
    }
  }
  updatePill();
  P.on("profile:update", updatePill);
  P.on("profile:create", updatePill);
  P.on("inventory:change", updatePill);
  // Buff timers tick down — re-render every minute so the pill clears
  // when a buff expires without requiring an action.
  setInterval(updatePill, 60 * 1000);
  P.on("wallet:change", function (e) {
    updatePill();
    // Brief gold-glow burst on the topbar profile pill when shards are added.
    if (pill && e && e.detail && typeof e.detail.delta === "number" && e.detail.delta > 0) {
      pill.classList.remove("is-burst");
      // Force reflow to restart the animation
      void pill.offsetWidth;
      pill.classList.add("is-burst");
      setTimeout(function () { pill && pill.classList.remove("is-burst"); }, 1300);
    }
    // Live-update tier in drawer (if open) and detect tier-up moments
    if (e && e.detail) {
      var newShards = (typeof e.detail.total === "number") ? e.detail.total : (P.get().shards || 0);
      var delta = (typeof e.detail.delta === "number") ? e.detail.delta : 0;
      var oldShards = Math.max(0, newShards - delta);
      var oldTier = getTier(oldShards);
      var newTier = getTier(newShards);
      if (drawer && !drawer.hidden) refreshTier(P.get());
      if (oldTier.key !== newTier.key && delta > 0) {
        if (window.MrMacsToast) {
          window.MrMacsToast.push({
            icon: "crown",
            title: "Tier up: " + newTier.name,
            sub: "you've climbed to the next rung",
            tone: "achievement",
            ms: 5200
          });
        }
        // Confetti burst from the topbar profile pill on tier-up.
        // Legendary tier gets a bigger, multi-colored celebration.
        if (window.MrMacsCelebration) {
          var tierPalette = newTier.key === "legendary"
            ? ["#ff7cc8", "#b892ff", "#f5c451", "#ffd884"]
            : (newTier.key === "mythic" ? ["#ff7cc8", "#b892ff", "#7af0ff"] : null);
          window.MrMacsCelebration.burstFromElement(pill, {
            count: newTier.key === "legendary" ? 40 : 28,
            palette: tierPalette || undefined,
            life: 1.4
          });
        }
      }
    }
  });
  P.on("streak:advance", updatePill);
  P.on("settings:change", function (e) { applySettingsToBody(e.detail.settings); });

  // ---- Welcome overlay (first visit) ----
  var welcomeOverlay = document.getElementById("welcomeOverlay");
  var welcomeName = document.getElementById("welcomeName");
  var welcomeAvatars = document.getElementById("welcomeAvatars");
  var welcomeCourse = document.getElementById("welcomeCourse");
  var welcomeContinue = document.getElementById("welcomeContinue");
  var welcomeSkip = document.getElementById("welcomeSkip");
  var welcomeAvatar = "🎓";

  // Canonical course list — matches the order used by the course rail
  // and the diagnostic bank. Used to populate both the welcome picker
  // and the drawer's course selector.
  var LEGACY_COURSE_OPTIONS = [
      "Grade 5 Social Studies",
      "Grade 6 Social Studies",
      "Grade 7 U.S. History I",
      "Grade 8 U.S. History II",
      "Grade 9 Global History I",
      "Grade 10 Global History II",
      "Grade 11 U.S. History",
      "AP Psychology",
      "AP United States History",
      "AP World History: Modern",
      "AP European History",
      "AP Human Geography",
      "AP U.S. Government and Politics",
      "AP Macroeconomics",
      "AP Microeconomics",
      "AP Macro/Micro Combined",
      "Civics and Participation in Government",
      "Economics"
    ];
  var COURSE_OPTIONS = (typeof allCourseLabels === "function" && allCourseLabels().length)
    ? uniq(allCourseLabels().concat(LEGACY_COURSE_OPTIONS.map(displayCourseLabel))).sort(courseCompare)
    : LEGACY_COURSE_OPTIONS;

  function populateCourseSelect(sel, currentValue) {
    if (!sel) return;
    var html = '<option value="">— Pick your course —</option>';
    COURSE_OPTIONS.forEach(function (c) {
      var selected = (c === currentValue) ? ' selected' : '';
      html += '<option value="' + c.replace(/"/g, "&quot;") + '"' + selected + '>' +
        c.replace(/[<>&]/g, function (ch) {
          return ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : "&amp;";
        }) + '</option>';
    });
    sel.innerHTML = html;
  }

  function buildWelcomeAvatars() {
    if (!welcomeAvatars) return;
    welcomeAvatars.innerHTML = P.AVATARS.map(function (a, i) {
      return '<button type="button" class="welcome-avatar-btn" role="radio" aria-checked="' +
        (i === 0 ? 'true' : 'false') + '" data-emoji="' + a.emoji +
        '" aria-label="' + a.label + '">' + renderIcon(a.emoji) + '</button>';
    }).join("");
    welcomeAvatars.querySelectorAll(".welcome-avatar-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        welcomeAvatars.querySelectorAll(".welcome-avatar-btn").forEach(function (b) {
          b.setAttribute("aria-checked", "false");
        });
        btn.setAttribute("aria-checked", "true");
        welcomeAvatar = btn.dataset.emoji;
      });
    });
  }

  function openWelcome() {
    if (!welcomeOverlay) return;
    buildWelcomeAvatars();
    populateCourseSelect(welcomeCourse, P.getCourse ? P.getCourse() : "");
    // Time-of-day greeting: morning / afternoon / evening / late night
    var eyebrow = document.getElementById("welcomeEyebrow");
    if (eyebrow) {
      var h = new Date().getHours();
      var greet = "Welcome, hunter";
      if (h >= 5 && h < 12) greet = "Good morning, hunter";
      else if (h >= 12 && h < 17) greet = "Good afternoon, hunter";
      else if (h >= 17 && h < 22) greet = "Good evening, hunter";
      else greet = "Up late, hunter?";
      eyebrow.textContent = greet;
    }
    welcomeOverlay.hidden = false;
    setTimeout(function () { if (welcomeName) welcomeName.focus(); }, 120);
  }
  function closeWelcome() {
    if (welcomeOverlay) welcomeOverlay.hidden = true;
  }

  // Do not auto-block the arcade lobby. First-time players can open this
  // setup from the profile pill, but the launch deck should be the first view.
  if (welcomeName) {
    // Name field is now optional (UX walkthrough rec #3) — CTA always enabled.
    // Pressing Enter from the name field fires the CTA.
    welcomeName.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && welcomeContinue) welcomeContinue.click();
    });
  }
  // First-run hub tour — fires after welcome closes (or on a 2nd visit if
  // user skipped welcome). Uses arcade-tour.js so the seen flag is shared
  // with per-game tours.
  function startHubTour() {
    if (!window.MrMacsArcadeTour) return;
    var steps = [
      {
        target: null,
        title: "Welcome to the Arcade.",
        body: "Quick tour — under 30 seconds. Everything stays on this device. Nothing leaves your browser.",
        placement: "center"
      },
      {
        target: "#daily",
        title: "Today's Challenge",
        body: "A new game pick lands every UTC midnight. Play it for +50 shards and a streak day.",
        placement: "bottom"
      },
      {
        target: "#routing",
        title: "Smart Study Tools",
        body: "Diagnostic finds your weak spots. Mastery shows progress. Wrong-Answer Queue serves the misses you've made. Cram chains 4 games on any unit.",
        placement: "bottom"
      },
      {
        target: "#library",
        title: "Every game, one search.",
        body: "Filter by course, lane, or type. Hit / on a keyboard to jump to search. The Random button rolls something fresh.",
        placement: "top"
      },
      {
        target: "#profilePill",
        title: "Your trainer profile.",
        body: "Click the pill (or press P) to see shards, achievements, settings, and your tier ladder. Press ? any time to see all keyboard shortcuts.",
        placement: "bottom"
      }
    ];
    try { window.MrMacsArcadeTour.start("hub", steps); } catch (e) {}
  }

  if (welcomeContinue) {
    welcomeContinue.addEventListener("click", function () {
      // Name is now optional (UX walkthrough rec #3). If blank, default to
      // "Player" — student can rename any time from the profile drawer.
      var name = (welcomeName.value || "").trim() || "Player";
      // Avatar may also be blank if no chip clicked — keep the default 🎓.
      if (welcomeAvatar) P.setAvatar(welcomeAvatar, "emoji");
      // Save course choice (may be empty — that's fine; student can
      // pick later from the drawer). Save course BEFORE setName so the
      // profile:create event carries the course value.
      var courseChoice = welcomeCourse ? welcomeCourse.value : "";
      if (courseChoice && P.setCourse) P.setCourse(courseChoice);
      P.setName(name);
      closeWelcome();
      // Fire the hub tour right after the welcome dialog has dismissed
      setTimeout(startHubTour, 360);
    });
  }
  if (welcomeSkip) {
    welcomeSkip.addEventListener("click", function () {
      // Allow skipping — they can set up later via the profile pill
      closeWelcome();
      // Skipping the welcome still triggers the hub tour
      setTimeout(startHubTour, 360);
    });
  }
  // For users who already had a profile (skipped welcome on prior visit),
  // also try to surface the hub tour exactly once. Delayed past the
  // CRT boot end (~3000 ms) so the tour overlay doesn't fire while the
  // boot stinger is still mid-animation.
  if (P.exists() && window.MrMacsArcadeTour) {
    setTimeout(function () {
      // Skip if the CRT boot is somehow still showing (e.g. user has
      // a slow device); listen for its hide and fire then.
      var boot = document.getElementById("crtBoot");
      if (boot && getComputedStyle(boot).display !== "none") {
        var deferUntilBoot = function () { startHubTour(); };
        // Poll for boot dismissal up to 4 s, then start anyway.
        var tries = 0;
        var pollIv = setInterval(function () {
          tries++;
          if (getComputedStyle(boot).display === "none" || tries > 20) {
            clearInterval(pollIv);
            deferUntilBoot();
          }
        }, 200);
        return;
      }
      // Only fires if hasSeenTour("hub") returns false in MrMacsProfile
      startHubTour();
    }, 3200);
  }

  // ---- Profile drawer ----
  var drawer = document.getElementById("profileDrawer");
  var pdBackdrop = document.getElementById("pdBackdrop");
  var pdClose = document.getElementById("pdClose");
  var pdAvatar = document.getElementById("pdAvatar");
  var pdNameInput = document.getElementById("pdNameInput");
  var pdNameSave = document.getElementById("pdNameSave");
  var pdShards = document.getElementById("pdShards");
  var pdStreak = document.getElementById("pdStreak");
  var pdStreakBest = document.getElementById("pdStreakBest");
  var pdAchCount = document.getElementById("pdAchCount");
  var pdAchTotal = document.getElementById("pdAchTotal");
  var pdAchSummary = document.getElementById("pdAchSummary");
  var pdAchGrid = document.getElementById("pdAchGrid");
  var pdAvatarGrid = document.getElementById("pdAvatarGrid");
  var pdReset = document.getElementById("pdReset");

  function openDrawer() {
    if (!drawer) return;
    drawer.hidden = false;
    if (pill) pill.setAttribute("aria-expanded", "true");
    refreshDrawer();
    // Focus first interactive element for keyboard users
    setTimeout(function () { if (pdNameInput) pdNameInput.focus(); }, 200);
  }
  function closeDrawer() {
    if (drawer) drawer.hidden = true;
    if (pill) pill.setAttribute("aria-expanded", "false");
  }

  if (pill) pill.addEventListener("click", function () {
    if (!P.exists()) { openWelcome(); return; }
    openDrawer();
  });
  if (pdClose) pdClose.addEventListener("click", closeDrawer);
  if (pdBackdrop) pdBackdrop.addEventListener("click", closeDrawer);

  // Keyboard shortcuts overlay
  var ksOverlay = document.getElementById("ksOverlay");
  var ksClose = document.getElementById("ksClose");
  var ksBackdrop = document.getElementById("ksBackdrop");
  function openKs() { if (ksOverlay) { ksOverlay.hidden = false; setTimeout(function () { if (ksClose) ksClose.focus(); }, 50); } }
  function closeKs() { if (ksOverlay) ksOverlay.hidden = true; }
  if (ksClose) ksClose.addEventListener("click", closeKs);
  if (ksBackdrop) ksBackdrop.addEventListener("click", closeKs);
  var ksFob = document.getElementById("ksFob");
  if (ksFob) ksFob.addEventListener("click", openKs);

  // Scroll progress indicator — thin gradient rule that fills as you scroll
  var progressBar = document.getElementById("scrollProgress");
  if (progressBar) {
    var ticking = false;
    var updateProgress = function () {
      var doc = document.documentElement;
      var max = (doc.scrollHeight || 0) - (window.innerHeight || 0);
      var ratio = max > 0 ? Math.max(0, Math.min(1, (window.scrollY || 0) / max)) : 0;
      progressBar.style.width = (ratio * 100).toFixed(2) + "%";
      progressBar.classList.toggle("is-active", window.scrollY > 60);
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  document.addEventListener("keydown", function (e) {
    // Don't intercept when typing in form fields
    var target = e.target || document.activeElement;
    var isField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);

    if (e.key === "Escape") {
      if (ksOverlay && !ksOverlay.hidden) { closeKs(); return; }
      if (drawer && !drawer.hidden) { closeDrawer(); return; }
      if (welcomeOverlay && !welcomeOverlay.hidden) { closeWelcome(); return; }
    }
    if (isField) return;

    // Power-user shortcuts
    if ((e.key === "?" || (e.key === "/" && e.shiftKey)) && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (ksOverlay && ksOverlay.hidden) openKs(); else closeKs();
      return;
    }
    if (e.key === "/" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      var search = document.getElementById("librarySearch") || document.querySelector('input[type="search"]');
      if (search) { e.preventDefault(); search.scrollIntoView({ block: "center", behavior: "smooth" }); search.focus(); }
      return;
    }
    if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      if (drawer && drawer.hidden) {
        if (P.exists()) openDrawer(); else openWelcome();
      } else { closeDrawer(); }
      return;
    }
    if (e.key === "d" || e.key === "D") {
      var dailyBtn = document.getElementById("dailyPlay");
      if (dailyBtn) { e.preventDefault(); dailyBtn.click(); }
      return;
    }
    if (e.key === "r" || e.key === "R") {
      var rnd = document.getElementById("libraryRandom");
      if (rnd) { e.preventDefault(); rnd.click(); }
      return;
    }
  });

  // Shard-tier ladder. Pure derive — no storage migration needed.
  // Returns { name, key, current, threshold, next, ratio }
  function getTier(shards) {
    var s = Math.max(0, Math.floor(shards || 0));
    var ladder = [
      { key: "apprentice", name: "Apprentice", at: 0,     to: 100 },
      { key: "scholar",    name: "Scholar",    at: 100,   to: 500 },
      { key: "master",     name: "Master",     at: 500,   to: 2000 },
      { key: "sage",       name: "Sage",       at: 2000,  to: 5000 },
      { key: "mythic",     name: "Mythic",     at: 5000,  to: 15000 },
      { key: "legendary",  name: "Legendary",  at: 15000, to: Infinity }
    ];
    for (var i = ladder.length - 1; i >= 0; i--) {
      if (s >= ladder[i].at) {
        var rung = ladder[i];
        var span = (rung.to === Infinity) ? Math.max(1, s - rung.at) : (rung.to - rung.at);
        var into = s - rung.at;
        var ratio = (rung.to === Infinity) ? 1 : Math.min(1, into / span);
        return {
          key: rung.key,
          name: rung.name,
          current: s,
          threshold: rung.at,
          next: rung.to === Infinity ? null : rung.to,
          ratio: ratio
        };
      }
    }
    return { key: "apprentice", name: "Apprentice", current: s, threshold: 0, next: 100, ratio: 0 };
  }

  // Compute trackable progress for achievements that map to a single
  // counter on the profile. Returns null for achievements that don't
  // have a measurable progress signal — those show as plain locked.
  function computeAchievementProgress(def, profile) {
    if (!def || !def.id || !profile) return null;
    var streakNow = (profile.streak && profile.streak.current) || 0;
    var totalShards = profile.totalShardsEarned || profile.shards || 0;
    var perGame = profile.perGameStats || {};
    var distinctGenres = Object.keys(perGame).length;
    var totalPlays = 0;
    Object.keys(perGame).forEach(function (k) { totalPlays += (perGame[k].plays || 0); });
    var dailyDone = (profile.dailyChallenge && profile.dailyChallenge.completedCount) || 0;
    var shopSpent = profile.lifetimeShopSpend || 0;
    var scholarHits = profile.scholarCorrect || 0;
    switch (def.id) {
      case "streak-3":  return { current: Math.min(streakNow, 3), target: 3, unit: "days" };
      case "streak-7":  return { current: Math.min(streakNow, 7), target: 7, unit: "days" };
      case "streak-30": return { current: Math.min(streakNow, 30), target: 30, unit: "days" };
      case "cross-shards-1k":
        return { current: Math.min(totalShards, 1000), target: 1000, unit: "shards" };
      case "cross-shards-10k":
        return { current: Math.min(totalShards, 10000), target: 10000, unit: "shards" };
      case "cross-3-genres":
        return { current: Math.min(distinctGenres, 3), target: 3, unit: "games" };
      case "cross-7-genres":
        return { current: Math.min(distinctGenres, 7), target: 7, unit: "games" };
      case "cross-12-genres":
        return { current: Math.min(distinctGenres, 12), target: 12, unit: "games" };
      case "cross-100-plays":
        return { current: Math.min(totalPlays, 100), target: 100, unit: "plays" };
      case "cross-daily-7":
        return { current: Math.min(dailyDone, 7), target: 7, unit: "claims" };
      case "cross-daily-30":
        return { current: Math.min(dailyDone, 30), target: 30, unit: "claims" };
      case "cross-shop-spender":
        return { current: Math.min(shopSpent, 1000), target: 1000, unit: "shards" };
      case "scholar-decoder":
        return { current: Math.min(scholarHits, 50), target: 50, unit: "scholars" };
      default:
        return null;
    }
  }

  function refreshTier(profile) {
    var tier = getTier(profile.shards);
    var el = document.getElementById("pdTier");
    var bd = document.getElementById("pdTierBadge");
    var fl = document.getElementById("pdTierFill");
    var nx = document.getElementById("pdTierNext");
    if (!el) return;
    el.dataset.tier = tier.key;
    if (bd) bd.textContent = tier.name;
    if (fl) fl.style.width = (tier.ratio * 100).toFixed(1) + "%";
    if (nx) {
      nx.textContent = tier.next == null
        ? "max tier"
        : ((tier.next - tier.current).toLocaleString() + " to next");
    }
  }

  function refreshDrawer() {
    var profile = P.get();
    if (pdAvatar) pdAvatar.innerHTML = renderIcon(profile.avatar || "🎓");
    if (pdNameInput) pdNameInput.value = profile.name || "";
    if (pdShards) pdShards.textContent = profile.shards.toLocaleString();
    if (pdStreak) pdStreak.textContent = profile.streak.current || 0;
    if (pdStreakBest) pdStreakBest.textContent = profile.streak.best || 0;
    refreshTier(profile);
    var pdCourseSelect = document.getElementById("pdCourseSelect");
    if (pdCourseSelect && !pdCourseSelect.dataset.built) {
      populateCourseSelect(pdCourseSelect, profile.course || "");
      pdCourseSelect.dataset.built = "1";
      pdCourseSelect.addEventListener("change", function () {
        if (P.setCourse) P.setCourse(pdCourseSelect.value || "");
      });
    } else if (pdCourseSelect) {
      pdCourseSelect.value = profile.course || "";
    }

    // Aggregate course mastery — sums all topicStats buckets for the
    // enrolled course. Hidden when no course is set or the student
    // hasn't answered any questions for that course yet.
    var courseMasteryEl = document.getElementById("pdCourseMastery");
    if (courseMasteryEl) {
      var enrolledCourse = profile.course || "";
      var topicStats = profile.topicStats || {};
      var courseStats = topicStats[enrolledCourse] || {};
      var aggCorrect = 0, aggTotal = 0;
      Object.keys(courseStats).forEach(function (set) {
        aggCorrect += (courseStats[set].correct || 0);
        aggTotal += (courseStats[set].total || 0);
      });
      if (enrolledCourse && aggTotal > 0) {
        var pct = Math.round((aggCorrect / aggTotal) * 100);
        var pctEl = document.getElementById("pdCourseMasteryPct");
        var labelEl = document.getElementById("pdCourseMasteryLabel");
        var fillEl = document.getElementById("pdCourseMasteryFill");
        if (pctEl) pctEl.textContent = pct + "%";
        if (labelEl) labelEl.textContent = aggCorrect + " / " + aggTotal + " correct";
        if (fillEl) fillEl.style.width = pct + "%";
        courseMasteryEl.hidden = false;
      } else {
        courseMasteryEl.hidden = true;
      }
    }

    // ---- Weekly stats card (rolling 7 days) ----
    var weeklyDaysEl = document.getElementById("pdWeeklyDays");
    if (weeklyDaysEl) {
      var todayDt = new Date();
      var msPerDay = 24 * 3600 * 1000;
      var sevenDaysAgo = todayDt.getTime() - 7 * msPerDay;
      var keyOf = function (d) {
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
      };
      // Days active in last 7 days
      var daysSet = {};
      (profile.playDays || []).forEach(function (d) {
        var dd = new Date(d + "T00:00:00");
        if (dd.getTime() >= sevenDaysAgo) daysSet[d] = true;
      });
      var daysActive = Object.keys(daysSet).length;
      // Questions answered + accuracy
      var weeklyTotal = 0, weeklyCorrect = 0;
      var dailyAns = profile.dailyAnswers || {};
      Object.keys(dailyAns).forEach(function (d) {
        var dd = new Date(d + "T00:00:00");
        if (dd.getTime() >= sevenDaysAgo) {
          weeklyTotal += (dailyAns[d].total || 0);
          weeklyCorrect += (dailyAns[d].correct || 0);
        }
      });
      // Shards earned
      var weeklyShards = 0;
      var dailyShards = profile.dailyShards || {};
      Object.keys(dailyShards).forEach(function (d) {
        var dd = new Date(d + "T00:00:00");
        if (dd.getTime() >= sevenDaysAgo) weeklyShards += (dailyShards[d] || 0);
      });
      // Achievements unlocked this week
      var weeklyAch = (profile.achievements ? Object.keys(profile.achievements) : []).filter(function (id) {
        var ach = profile.achievements[id];
        return ach && ach.unlockedAt && ach.unlockedAt >= sevenDaysAgo;
      }).length;
      // Render
      weeklyDaysEl.textContent = daysActive;
      var daysFill = document.getElementById("pdWeeklyDaysFill");
      if (daysFill) daysFill.style.width = ((daysActive / 7) * 100).toFixed(0) + "%";
      var ansEl = document.getElementById("pdWeeklyAnswers");
      if (ansEl) ansEl.textContent = weeklyTotal.toLocaleString();
      var accEl = document.getElementById("pdWeeklyAccuracy");
      if (accEl) accEl.textContent = weeklyTotal > 0
        ? Math.round((weeklyCorrect / weeklyTotal) * 100) + "% correct"
        : "no answers yet";
      var shardsEl = document.getElementById("pdWeeklyShards");
      if (shardsEl) shardsEl.textContent = weeklyShards.toLocaleString();
      var achEl = document.getElementById("pdWeeklyAch");
      if (achEl) achEl.textContent = weeklyAch.toLocaleString();
    }

    // ---- Power-Up Shop grid ----
    var shopGrid = document.getElementById("pdShopGrid");
    if (shopGrid && P.SHOP_ITEMS && P.getInventory) {
      var inv = P.getInventory();
      var shards = profile.shards || 0;
      var items = P.SHOP_ITEMS;
      var TIMED_BUFFS = { luckyCharm: "luckyCharmExpiresAt", coinDoubler: "coinDoublerExpiresAt" };
      var isTimedActive = function (id) {
        if (id === "luckyCharm") return inv.luckyCharmActive;
        if (id === "coinDoubler") return inv.coinDoublerActive;
        return false;
      };
      var renderCount = function (id) {
        if (TIMED_BUFFS[id]) {
          if (!isTimedActive(id)) return "Owned: 0";
          var stamp = inv[TIMED_BUFFS[id]] || 0;
          var msLeft = Math.max(0, stamp - Date.now());
          var hrsLeft = Math.max(0, Math.round(msLeft / (3600 * 1000)));
          var minLeft = Math.max(0, Math.round(msLeft / 60000));
          return hrsLeft >= 1 ? "Active · " + hrsLeft + "h left" : "Active · " + minLeft + "m left";
        }
        var n = inv[id] || 0;
        return n > 0 ? "Owned: " + n : "Owned: 0";
      };
      shopGrid.innerHTML = Object.keys(items).map(function (id) {
        var spec = items[id];
        var canAfford = shards >= spec.cost;
        var isLuckyActive = id === "luckyCharm" && inv.luckyCharmActive;
        var safe = function (v) { return String(v || "").replace(/[<>&"]/g, function (c) {
          return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
        }); };
        var timedActive = isTimedActive(id);
        // Lucky Charm hard-locks while active. Coin Doubler can stack (extend the timer).
        var hardLocked = id === "luckyCharm" && timedActive;
        var btnLabel;
        if (hardLocked) btnLabel = "Active";
        else if (!canAfford) btnLabel = "Need " + (spec.cost - shards) + " more";
        else if (id === "coinDoubler" && timedActive) btnLabel = "Extend";
        else btnLabel = "Buy";
        return '<div class="pd-shop-card" data-id="' + id + '" data-active="' + (timedActive ? "true" : "false") + '" role="listitem">' +
          '<span class="ps-icon" aria-hidden="true">' + safe(spec.icon) + '</span>' +
          '<span class="ps-name">' + safe(spec.label) + '</span>' +
          '<span class="ps-desc">' + safe(spec.desc) + '</span>' +
          '<div class="ps-foot">' +
            '<span class="ps-cost">💎 ' + spec.cost + '</span>' +
            '<span class="ps-owned">' + renderCount(id) + '</span>' +
            '<button class="ps-buy" data-id="' + id + '" type="button"' + (!canAfford || hardLocked ? ' disabled' : '') + '>' +
              btnLabel +
            '</button>' +
          '</div>' +
        '</div>';
      }).join("");
      // Wire buy buttons (idempotent — re-binds on every refresh)
      shopGrid.querySelectorAll(".ps-buy").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.dataset.id;
          var result = P.buyItem(id);
          if (result.ok) {
            if (window.MrMacsToast) {
              var subMsg;
              switch (id) {
                case "luckyCharm":     subMsg = "2x shards active for the next 24 hours"; break;
                case "coinDoubler":    subMsg = "2x shards active for the next 4 hours · stacks with Lucky Charm"; break;
                case "fortuneRefresh": subMsg = "reroll today's daily fortune from the hub"; break;
                case "dailyDouble":    subMsg = "next Daily Challenge payout is doubled"; break;
                default:               subMsg = "added to your inventory";
              }
              window.MrMacsToast.push({
                icon: "sparkles",
                title: "Purchased: " + (P.SHOP_ITEMS[id] && P.SHOP_ITEMS[id].label),
                sub: subMsg,
                tone: "achievement",
                ms: 4500
              });
            }
            // Re-render the drawer to reflect new shards + inventory
            refreshDrawer();
          } else if (result.reason === "not-enough-shards") {
            if (window.MrMacsToast) {
              window.MrMacsToast.push({
                icon: "warning",
                title: "Not enough shards",
                sub: "need " + result.needed + " more · keep playing",
                tone: "default",
                ms: 3500
              });
            }
          }
        });
      });
      // Active boost banner — shows whichever boosts/inventory are most relevant
      var activeEl = document.getElementById("pdShopActive");
      if (activeEl) {
        var bannerLines = [];
        if (inv.luckyCharmActive) {
          var lcMs = Math.max(0, inv.luckyCharmExpiresAt - Date.now());
          var lcHrs = Math.max(0, Math.round(lcMs / (3600 * 1000)));
          bannerLines.push('✨ <strong>Lucky Charm</strong> active — 2x shards for ' + lcHrs + ' more hours');
        }
        if (inv.coinDoublerActive) {
          var cdMs = Math.max(0, inv.coinDoublerExpiresAt - Date.now());
          var cdHrs = Math.floor(cdMs / (3600 * 1000));
          var cdMin = Math.max(0, Math.round((cdMs - cdHrs * 3600 * 1000) / 60000));
          bannerLines.push('🪙 <strong>Coin Doubler</strong> active — 2x shards for ' + (cdHrs > 0 ? cdHrs + 'h ' + cdMin + 'm' : cdMin + 'm') + ' more');
        }
        if (inv.streakShield > 0) {
          bannerLines.push('🛡 <strong>' + inv.streakShield + ' streak shield' + (inv.streakShield > 1 ? 's' : '') + '</strong> ready · auto-saves your next missed-day streak');
        }
        if (inv.dailyDouble > 0) {
          bannerLines.push('📰 <strong>' + inv.dailyDouble + ' Daily Double</strong> ready · 2x next Daily Challenge payout');
        }
        if (inv.fortuneRefresh > 0) {
          bannerLines.push('🔮 <strong>' + inv.fortuneRefresh + ' fortune reroll</strong> ready · use from the daily fortune card');
        }
        if (bannerLines.length) {
          activeEl.innerHTML = bannerLines.join(" · ");
          activeEl.hidden = false;
        } else {
          activeEl.hidden = true;
        }
      }
    }

    // Streak calendar — last 84 days as a 12×7 grid
    var streakCal = document.getElementById("pdStreakCal");
    if (streakCal) {
      var playSet = {};
      (profile.playDays || []).forEach(function (d) { playSet[d] = true; });
      var todayDate = new Date();
      var todayKey = todayDate.getFullYear() + "-" +
        String(todayDate.getMonth() + 1).padStart(2, "0") + "-" +
        String(todayDate.getDate()).padStart(2, "0");
      var cells = [];
      for (var d = 83; d >= 0; d--) {
        var date = new Date(todayDate);
        date.setDate(todayDate.getDate() - d);
        var dayKey = date.getFullYear() + "-" +
          String(date.getMonth() + 1).padStart(2, "0") + "-" +
          String(date.getDate()).padStart(2, "0");
        var played = !!playSet[dayKey];
        var isToday = dayKey === todayKey;
        var classes = ["pd-streak-cell"];
        if (played) classes.push("pd-streak-played");
        if (isToday) classes.push("pd-streak-today");
        var tooltip = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
          (played ? " · played" : " · no activity");
        cells.push(
          '<div class="' + classes.join(" ") +
          '" data-tooltip="' + tooltip.replace(/"/g, "&quot;") + '">' +
          date.getDate() + '</div>'
        );
      }
      streakCal.innerHTML = cells.join("");
      var meta = document.getElementById("pdStreakCalMeta");
      if (meta) {
        var playedCount = (profile.playDays || []).filter(function (d) {
          // Only count last 84 days
          var dd = new Date(d + "T00:00:00");
          var cutoff = new Date(todayDate);
          cutoff.setDate(todayDate.getDate() - 83);
          return dd >= cutoff;
        }).length;
        meta.textContent = playedCount + " of last 84 days (12 weeks) · current streak " + (profile.streak.current || 0);
      }
    }

    // 12-week heatmap (play count per day)
    var heatmapGrid = document.getElementById("pdHeatmapGrid");
    if (heatmapGrid) {
      var heatPlaySet = {};
      // Build counts from dailyAnswers if available, else binary from playDays
      if (profile.dailyAnswers) {
        Object.keys(profile.dailyAnswers).forEach(function (k) {
          heatPlaySet[k] = (profile.dailyAnswers[k] || {}).total || 0;
        });
      } else {
        (profile.playDays || []).forEach(function (d) { heatPlaySet[d] = 1; });
      }
      var heatTodayDate = new Date();
      var heatTodayKey = heatTodayDate.getFullYear() + "-" +
        String(heatTodayDate.getMonth() + 1).padStart(2, "0") + "-" +
        String(heatTodayDate.getDate()).padStart(2, "0");
      var allCounts = Object.values(heatPlaySet).filter(function (v) { return v > 0; });
      var maxCount = allCounts.length ? Math.max.apply(null, allCounts) : 1;
      var heatCells = [];
      for (var hd = 83; hd >= 0; hd--) {
        var hDate = new Date(heatTodayDate);
        hDate.setDate(heatTodayDate.getDate() - hd);
        var hKey = hDate.getFullYear() + "-" +
          String(hDate.getMonth() + 1).padStart(2, "0") + "-" +
          String(hDate.getDate()).padStart(2, "0");
        var count = heatPlaySet[hKey] || 0;
        var level = count === 0 ? 0 : count < maxCount * 0.25 ? 1 : count < maxCount * 0.55 ? 2 : 3;
        var isHeatToday = hKey === heatTodayKey;
        var hClasses = ["pd-heatmap-cell", "pd-heatmap-" + level];
        if (isHeatToday) hClasses.push("pd-heatmap-today");
        var hTooltip = hDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
          (count ? " · " + count + " answers" : " · no activity");
        heatCells.push(
          '<div class="' + hClasses.join(" ") +
          '" title="' + hTooltip.replace(/"/g, "&quot;") + '" aria-label="' +
          hTooltip.replace(/"/g, "&quot;") + '"></div>'
        );
      }
      heatmapGrid.innerHTML = heatCells.join("");
    }

    // ---- Progress over time chart (last 8 weeks) ----
    var progressChart = document.getElementById("pdProgressChart");
    if (progressChart) {
      var msPerDay = 24 * 3600 * 1000;
      var msPerWeek = 7 * msPerDay;
      // Build 8 weekly buckets — each week starts on Sunday (0) for
      // consistency with browser locale-friendly week display.
      var weekBuckets = [];
      var todayMid = new Date();
      todayMid.setHours(0, 0, 0, 0);
      // Find this Sunday
      var thisSunday = new Date(todayMid);
      thisSunday.setDate(todayMid.getDate() - todayMid.getDay());
      for (var w = 7; w >= 0; w--) {
        var weekStart = new Date(thisSunday);
        weekStart.setDate(thisSunday.getDate() - (w * 7));
        var weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekBuckets.push({
          start: weekStart,
          end: weekEnd,
          isCurrent: w === 0,
          questions: 0,
          correct: 0,
          shards: 0,
          days: 0
        });
      }
      // Aggregate dailyAnswers + dailyShards + playDays into buckets
      var bucketForDate = function (key) {
        var dd = new Date(key + "T00:00:00").getTime();
        for (var i = 0; i < weekBuckets.length; i++) {
          var b = weekBuckets[i];
          if (dd >= b.start.getTime() && dd <= b.end.getTime() + msPerDay - 1) return b;
        }
        return null;
      };
      Object.keys(profile.dailyAnswers || {}).forEach(function (k) {
        var b = bucketForDate(k);
        if (!b) return;
        b.questions += (profile.dailyAnswers[k].total || 0);
        b.correct += (profile.dailyAnswers[k].correct || 0);
      });
      Object.keys(profile.dailyShards || {}).forEach(function (k) {
        var b = bucketForDate(k);
        if (!b) return;
        b.shards += (profile.dailyShards[k] || 0);
      });
      (profile.playDays || []).forEach(function (k) {
        var b = bucketForDate(k);
        if (!b) return;
        b.days += 1;
      });
      // Compute accuracies
      weekBuckets.forEach(function (b) {
        b.accuracy = b.questions > 0 ? Math.round((b.correct / b.questions) * 100) : null;
      });
      // Render
      var maxQ = Math.max.apply(null, weekBuckets.map(function (b) { return b.questions; })).valueOf();
      if (maxQ < 1) maxQ = 1;
      var totalQuestions = weekBuckets.reduce(function (s, b) { return s + b.questions; }, 0);
      if (totalQuestions === 0) {
        progressChart.innerHTML = '<div class="ppc-empty">Play a few games to start tracking your progress over time.</div>';
      } else {
        var W = 320; var H = 140;
        var pad = { left: 26, right: 8, top: 12, bottom: 22 };
        var chartW = W - pad.left - pad.right;
        var chartH = H - pad.top - pad.bottom;
        var barWidth = (chartW / weekBuckets.length) * 0.66;
        var barGap = (chartW / weekBuckets.length) * 0.34;
        // Build bars
        var bars = weekBuckets.map(function (b, i) {
          var x = pad.left + i * (barWidth + barGap) + barGap / 2;
          var h = (b.questions / maxQ) * chartH;
          var y = pad.top + (chartH - h);
          var monthDay = (b.start.getMonth() + 1) + "/" + b.start.getDate();
          var titleText = "Week of " + monthDay + " — " + b.questions + " questions" +
            (b.accuracy !== null ? ", " + b.accuracy + "% correct" : "") +
            ", " + b.shards + " shards";
          return '<rect class="ppc-bar' + (b.isCurrent ? ' is-current' : '') + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
            '" width="' + barWidth.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) +
            '" rx="2"><title>' + titleText + '</title></rect>';
        }).join("");
        // Build accuracy line (only across buckets with data)
        var accLinePoints = [];
        var accDots = [];
        weekBuckets.forEach(function (b, i) {
          if (b.accuracy === null) return;
          var x = pad.left + i * (barWidth + barGap) + barGap / 2 + barWidth / 2;
          var y = pad.top + (chartH - (b.accuracy / 100) * chartH);
          accLinePoints.push(x.toFixed(1) + "," + y.toFixed(1));
          accDots.push('<circle class="ppc-acc-dot" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3"/>');
        });
        var accLine = accLinePoints.length >= 2
          ? '<polyline class="ppc-acc-line" points="' + accLinePoints.join(" ") + '"/>'
          : "";
        // Y-axis labels
        var yLabels = '<text class="ppc-axis" x="' + (pad.left - 6) + '" y="' + (pad.top + 4) + '" text-anchor="end">' + maxQ + '</text>' +
          '<text class="ppc-axis" x="' + (pad.left - 6) + '" y="' + (pad.top + chartH) + '" text-anchor="end">0</text>';
        // X-axis labels (every 2 weeks for clarity)
        var xLabels = weekBuckets.map(function (b, i) {
          if (i % 2 !== 0 && !b.isCurrent) return "";
          var x = pad.left + i * (barWidth + barGap) + barGap / 2 + barWidth / 2;
          var label = (b.start.getMonth() + 1) + "/" + b.start.getDate();
          return '<text class="ppc-axis" x="' + x.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + label + '</text>';
        }).join("");
        // Faint horizontal grid line at midpoint
        var midY = pad.top + chartH / 2;
        var grid = '<line class="ppc-grid" x1="' + pad.left + '" y1="' + midY.toFixed(1) +
          '" x2="' + (pad.left + chartW) + '" y2="' + midY.toFixed(1) + '"/>';
        progressChart.innerHTML =
          '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Weekly progress">' +
            grid + bars + accLine + accDots.join("") + yLabels + xLabels +
          '</svg>';
        var meta = document.getElementById("pdProgressMeta");
        if (meta) meta.textContent = "Last 8 weeks · " + totalQuestions.toLocaleString() + " questions answered";
      }
    }

    var ach = P.listAchievements();
    var unlocked = ach.filter(function (a) { return a.unlocked; }).length;
    if (pdAchCount) pdAchCount.textContent = unlocked;
    if (pdAchTotal) pdAchTotal.textContent = ach.length;
    if (pdAchSummary) pdAchSummary.textContent = unlocked + " of " + ach.length + " unlocked";

    if (pdAchGrid) {
      pdAchGrid.innerHTML = ach.map(function (a) {
        // Compute partial progress on common tier-stretch achievements
        // so the locked tile shows e.g. "4 / 7 days" while the user is
        // working toward streak-7. Only achievements with a clear
        // measurable counter get a progress bar; the rest just show
        // their description.
        var prog = computeAchievementProgress(a.def, profile);
        var progBar = "";
        if (!a.unlocked && prog) {
          var pct = Math.max(0, Math.min(100, (prog.current / prog.target) * 100));
          progBar =
            '<div class="ach-progress" aria-label="' + prog.current + ' of ' + prog.target + '">' +
              '<div class="ach-progress-bar"><div class="ach-progress-fill" style="width:' + pct.toFixed(1) + '%"></div></div>' +
              '<span class="ach-progress-label">' + prog.current.toLocaleString() + ' / ' + prog.target.toLocaleString() + (prog.unit ? ' ' + prog.unit : '') + '</span>' +
            '</div>';
        }
        return '<div class="pd-ach' + (a.unlocked ? '' : ' is-locked') + '" data-tier="' +
          (a.def.tier || 'bronze') + '" role="listitem" title="' +
          (a.unlocked ? 'Unlocked' : 'Locked') + '">' +
          '<span class="ach-icon">' + renderIcon(a.def.icon || '🏆') + '</span>' +
          '<div class="ach-text">' +
            '<div class="ach-title">' + a.def.title + '</div>' +
            '<div class="ach-desc">' + (a.unlocked ? a.def.desc : (a.def.desc || '???')) + '</div>' +
            progBar +
          '</div>' +
        '</div>';
      }).join("");
    }

    if (pdAvatarGrid && !pdAvatarGrid.dataset.built) {
      pdAvatarGrid.innerHTML = P.AVATARS.map(function (a) {
        return '<button type="button" class="pd-avatar-btn" role="radio" aria-checked="' +
          (a.emoji === profile.avatar ? "true" : "false") + '" data-emoji="' + a.emoji +
          '" aria-label="' + a.label + '">' + renderIcon(a.emoji) + '</button>';
      }).join("");
      pdAvatarGrid.dataset.built = "1";
      pdAvatarGrid.querySelectorAll(".pd-avatar-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          pdAvatarGrid.querySelectorAll(".pd-avatar-btn").forEach(function (b) {
            b.setAttribute("aria-checked", "false");
          });
          btn.setAttribute("aria-checked", "true");
          P.setAvatar(btn.dataset.emoji, "emoji");
          if (pdAvatar) pdAvatar.innerHTML = renderIcon(btn.dataset.emoji);
        });
      });
    } else if (pdAvatarGrid) {
      pdAvatarGrid.querySelectorAll(".pd-avatar-btn").forEach(function (btn) {
        btn.setAttribute("aria-checked", btn.dataset.emoji === profile.avatar ? "true" : "false");
      });
    }

    // Top scores section (best-3 across all games for the current player).
    if (window.MrMacsLeaderboards && typeof window.MrMacsLeaderboards.renderDrawerTopScores === "function") {
      window.MrMacsLeaderboards.renderDrawerTopScores(function (gameId) {
        var hit = (typeof GAMES !== "undefined" && Array.isArray(GAMES))
          ? GAMES.find(function (g) { return g.id === gameId; }) : null;
        return hit ? (hit.title || hit.name || gameId) : gameId;
      });
    }

    refreshSettings();
    if (typeof refreshTestPrepInputs === "function") refreshTestPrepInputs();
  }

  if (pdNameSave) pdNameSave.addEventListener("click", function () {
    var v = (pdNameInput.value || "").trim();
    if (!v) return;
    P.setName(v);
  });
  if (pdNameInput) pdNameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); pdNameSave.click(); }
  });

  // ---- Multi-profile roster picker ----
  var pdRosterPill = document.getElementById("pdRosterPill");
  var rosterOverlay = document.getElementById("rosterOverlay");
  var rosterList = document.getElementById("rosterList");
  var rosterAddBtn = document.getElementById("rosterAddBtn");
  var rosterCancelBtn = document.getElementById("rosterCancelBtn");

  function refreshRosterPill() {
    if (!pdRosterPill || !P.roster) return;
    var profiles = P.roster.list();
    var active = profiles.find(function (p) { return p.isActive; });
    var activeText = document.getElementById("pdRosterActive");
    if (activeText) {
      var label = active ? (active.name || "(unnamed)") : "1 profile";
      var count = profiles.length;
      activeText.textContent = label + (count > 1 ? " · " + count + " profiles" : " · 1 profile");
    }
  }
  refreshRosterPill();

  function renderRosterList() {
    if (!rosterList || !P.roster) return;
    var profiles = P.roster.list();
    rosterList.innerHTML = profiles.map(function (p) {
      var when = p.lastVisit
        ? (function () {
            var diff = Date.now() - p.lastVisit;
            var min = Math.floor(diff / 60000);
            var hour = Math.floor(min / 60);
            var day = Math.floor(hour / 24);
            if (day > 0) return day + "d ago";
            if (hour > 0) return hour + "h ago";
            if (min > 0) return min + "m ago";
            return "just now";
          })()
        : "never";
      var avatarStr = p.avatar || "🎓";
      var sub = (p.shards.toLocaleString() + " shards · " + when);
      var safe = function (v) { return String(v || "").replace(/[<>&"]/g, function (c) {
        return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
      }); };
      return '<div class="roster-item' + (p.isActive ? ' is-active' : '') + '" data-id="' + safe(p.id) + '">' +
        '<span class="roster-item-avatar" aria-hidden="true">' + safe(avatarStr) + '</span>' +
        '<span class="roster-item-meta">' +
          '<span class="roster-item-name">' + safe(p.name) + '</span>' +
          '<span class="roster-item-sub">' + safe(sub) + '</span>' +
        '</span>' +
        (p.isActive ? '' : '<button class="roster-switch-btn" type="button" data-action="switch" data-id="' + safe(p.id) + '">Switch</button>') +
        (p.isActive ? '' : '<button class="roster-delete-btn" type="button" data-action="delete" data-id="' + safe(p.id) + '" aria-label="Delete profile">Delete</button>') +
      '</div>';
    }).join("");
  }

  function openRosterPicker() {
    if (!rosterOverlay) return;
    renderRosterList();
    rosterOverlay.hidden = false;
  }
  function closeRosterPicker() {
    if (rosterOverlay) rosterOverlay.hidden = true;
  }
  if (pdRosterPill) pdRosterPill.addEventListener("click", openRosterPicker);
  if (rosterCancelBtn) rosterCancelBtn.addEventListener("click", closeRosterPicker);
  if (rosterOverlay) rosterOverlay.addEventListener("click", function (e) {
    if (e.target === rosterOverlay) closeRosterPicker();
  });
  if (rosterList) rosterList.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    var action = btn.dataset.action;
    var id = btn.dataset.id;
    if (action === "switch") {
      if (P.roster.switch(id)) {
        // Reload so every UI surface picks up the new active profile.
        location.reload();
      }
    } else if (action === "delete") {
      var p = P.roster.list().find(function (x) { return x.id === id; });
      if (!p) return;
      if (confirm("Delete profile '" + (p.name || "(unnamed)") + "'? This cannot be undone.")) {
        P.roster.remove(id);
        renderRosterList();
        refreshRosterPill();
      }
    }
  });
  if (rosterAddBtn) rosterAddBtn.addEventListener("click", function () {
    var name = (prompt("Name for the new trainer profile:") || "").trim();
    if (!name) return;
    P.roster.create({ name: name });
    closeRosterPicker();
    location.reload(); // refresh UI for new active profile
  });
  // Refresh the roster pill any time the active profile changes
  P.on("roster:change", refreshRosterPill);
  P.on("profile:update", refreshRosterPill);

  // Settings inputs
  var setSound = document.getElementById("setSound");
  var setMusic = document.getElementById("setMusic");
  var setMusicVal = document.getElementById("setMusicVal");
  var setSfx = document.getElementById("setSfx");
  var setSfxVal = document.getElementById("setSfxVal");
  var setMotion = document.getElementById("setMotion");
  var setFont = document.getElementById("setFont");
  var setColorblind = document.getElementById("setColorblind");
  var setContrast = document.getElementById("setContrast");

  function refreshSettings() {
    var s = P.getSettings();
    if (setSound) setSound.value = s.sound;
    if (setMusic) { setMusic.value = s.musicVolume; setMusicVal.textContent = Math.round(s.musicVolume * 100) + "%"; }
    if (setSfx)   { setSfx.value = s.sfxVolume;     setSfxVal.textContent   = Math.round(s.sfxVolume * 100)   + "%"; }
    if (setMotion) setMotion.value = s.motion;
    if (setFont) setFont.value = s.fontFamily;
    if (setColorblind) setColorblind.value = s.colorblind;
    if (setContrast) setContrast.value = s.contrast;
  }
  function bindSetting(el, key, transform) {
    if (!el) return;
    el.addEventListener("change", function () {
      var v = transform ? transform(el.value) : el.value;
      var update = {};
      update[key] = v;
      P.setSettings(update);
      refreshSettings();
    });
    if (el.type === "range") {
      el.addEventListener("input", function () {
        var v = Number(el.value);
        if (key === "musicVolume" && setMusicVal) setMusicVal.textContent = Math.round(v * 100) + "%";
        if (key === "sfxVolume" && setSfxVal) setSfxVal.textContent = Math.round(v * 100) + "%";
      });
    }
  }
  bindSetting(setSound, "sound");
  bindSetting(setMusic, "musicVolume", Number);
  bindSetting(setSfx, "sfxVolume", Number);
  bindSetting(setMotion, "motion");
  bindSetting(setFont, "fontFamily");
  bindSetting(setColorblind, "colorblind");
  bindSetting(setContrast, "contrast");

  // Test-prep target inputs
  var setTestDate = document.getElementById("setTestDate");
  var setTestName = document.getElementById("setTestName");
  function refreshTestPrepInputs() {
    if (!P.getTestPrep) return;
    var tp = P.getTestPrep();
    if (setTestDate) setTestDate.value = tp.date || "";
    if (setTestName) setTestName.value = tp.name || "";
    var statusEl = document.getElementById("pdTestPrepStatus");
    if (statusEl) {
      if (tp.date) {
        var d = new Date(tp.date + "T00:00:00");
        var now = new Date();
        var msPerDay = 24 * 3600 * 1000;
        var nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        var daysLeft = Math.ceil((d.getTime() - nowMid) / msPerDay);
        var label = tp.name || "your test";
        if (daysLeft > 0) {
          statusEl.textContent = "T-" + daysLeft + " days until " + label;
        } else if (daysLeft === 0) {
          statusEl.textContent = "Test day — go get it.";
        } else {
          statusEl.textContent = "Past target (" + Math.abs(daysLeft) + " days ago) — pick a new date";
        }
      } else {
        statusEl.textContent = "Set a target test date and we'll show your countdown.";
      }
    }
  }
  if (setTestDate) setTestDate.addEventListener("change", function () {
    P.setTestPrep({ date: setTestDate.value });
    refreshTestPrepInputs();
  });
  if (setTestName) setTestName.addEventListener("input", function () {
    P.setTestPrep({ name: setTestName.value });
    refreshTestPrepInputs();
  });

  if (pdReset) pdReset.addEventListener("click", function () {
    if (confirm("Wipe trainer profile from this device? Shards, achievements, and settings will all reset. Cannot be undone.")) {
      P.reset();
      closeDrawer();
      // Reload to re-trigger welcome flow
      setTimeout(function () { location.reload(); }, 100);
    }
  });

  // ---- Profile export/import (data portability) ----
  // Lets the student save a JSON snapshot to disk and restore it on
  // another device. Local-only, no server. The export bundle is the
  // exact MrMacsProfile.get() blob plus a small wrapper with a
  // schema version + export date for forward compat.
  var pdExport = document.getElementById("pdExport");
  var pdImport = document.getElementById("pdImport");
  var pdImportFile = document.getElementById("pdImportFile");
  if (pdExport) pdExport.addEventListener("click", function () {
    try {
      var profile = P.get();
      var bundle = {
        schema: "mr-macs-arcade-profile-export",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        profile: profile
      };
      var blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      var safeName = (profile.name || "trainer").replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 24) || "trainer";
      var date = new Date().toISOString().slice(0, 10);
      a.download = "mr-macs-arcade-" + safeName + "-" + date + ".json";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(url);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 200);
      if (window.MrMacsToast) {
        window.MrMacsToast.push({
          icon: "trophy",
          title: "Progress exported",
          sub: "saved to your downloads folder",
          tone: "default",
          ms: 3200
        });
      }
    } catch (err) {
      alert("Couldn't export your profile. " + (err && err.message ? err.message : ""));
    }
  });
  if (pdImport && pdImportFile) {
    pdImport.addEventListener("click", function () { pdImportFile.click(); });
    pdImportFile.addEventListener("change", function () {
      var file = pdImportFile.files && pdImportFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var bundle = JSON.parse(String(reader.result || ""));
          var inbound = (bundle && bundle.profile) ? bundle.profile : bundle;
          if (!inbound || typeof inbound !== "object" || !inbound.name) {
            throw new Error("This file doesn't look like a Mr. Mac's Arcade export.");
          }
          var current = P.get();
          var summary = "Replace your local progress with the imported snapshot?\n\n" +
            "Current: " + (current.name || "(empty)") + " · " + (current.shards || 0).toLocaleString() + " shards\n" +
            "Imported: " + inbound.name + " · " + (inbound.shards || 0).toLocaleString() + " shards\n\n" +
            "This cannot be undone.";
          if (!confirm(summary)) {
            pdImportFile.value = "";
            return;
          }
          // Reset then merge — set() shallow-merges so we get every field
          P.reset();
          P.set(inbound);
          closeDrawer();
          if (window.MrMacsToast) {
            window.MrMacsToast.push({
              icon: "sparkles",
              title: "Progress imported",
              sub: "welcome back, " + (inbound.name || "trainer"),
              tone: "default",
              ms: 4200
            });
          }
          setTimeout(function () { location.reload(); }, 600);
        } catch (err) {
          alert("Couldn't import that file. " + (err && err.message ? err.message : ""));
        }
        pdImportFile.value = "";
      };
      reader.onerror = function () { alert("Couldn't read that file."); pdImportFile.value = ""; };
      reader.readAsText(file);
    });
  }

  // ---- Profile switcher select in drawer head ----
  (function () {
    var sel = document.getElementById("pdProfileSwitcherSelect");
    var addBtn = document.getElementById("pdProfileAddBtn");
    function refreshSwitcherSelect() {
      if (!sel || !window.MrMacsProfile) return;
      var profiles = [];
      try { profiles = window.MrMacsProfile.listProfiles ? window.MrMacsProfile.listProfiles() : []; } catch (e) {}
      var activeId = "";
      try { activeId = window.MrMacsProfile.activeId ? window.MrMacsProfile.activeId() : ""; } catch (e) {}
      if (!profiles.length) {
        sel.innerHTML = '<option value="">1 profile</option>';
        return;
      }
      sel.innerHTML = profiles.map(function (p) {
        var label = p.name || ("Profile " + (p.id || ""));
        return '<option value="' + String(p.id || "").replace(/"/g, "&quot;") + '"' +
          (p.id === activeId ? " selected" : "") + '>' +
          label.replace(/[<>&]/g, function (c) { return c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"; }) +
          '</option>';
      }).join("");
    }
    refreshSwitcherSelect();
    if (sel) {
      sel.addEventListener("change", function () {
        var targetId = sel.value;
        if (!targetId || !window.MrMacsProfile) return;
        try {
          if (typeof window.MrMacsProfile.switchProfile === "function") {
            window.MrMacsProfile.switchProfile(targetId);
          }
        } catch (e) {}
      });
    }
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        var rosterBtn = document.getElementById("pdRosterPill");
        if (rosterBtn) rosterBtn.click();
      });
    }
    if (window.MrMacsProfile) {
      window.MrMacsProfile.on("profile:create", refreshSwitcherSelect);
      window.MrMacsProfile.on("profile:switch", refreshSwitcherSelect);
    }
  })();

  // ---- Backup & Share (MrMacsImportExport modal integration) ----
  (function () {
    var exportCodeBtn = document.getElementById("pdExportCode");
    var importCodeBtn = document.getElementById("pdImportCode");
    if (exportCodeBtn) {
      exportCodeBtn.addEventListener("click", function () {
        try {
          if (window.MrMacsImportExport && typeof window.MrMacsImportExport.showExportModal === "function") {
            window.MrMacsImportExport.showExportModal();
          } else {
            // Fallback: trigger legacy export if no modal available
            var legacy = document.getElementById("pdExport");
            if (legacy) legacy.click();
          }
        } catch (e) {}
      });
    }
    if (importCodeBtn) {
      importCodeBtn.addEventListener("click", function () {
        try {
          if (window.MrMacsImportExport && typeof window.MrMacsImportExport.showImportModal === "function") {
            window.MrMacsImportExport.showImportModal();
          } else {
            var legacy = document.getElementById("pdImport");
            if (legacy) legacy.click();
          }
        } catch (e) {}
      });
    }
  })();

  // ---- Print weekly report ----
  // Builds a one-page printable report from the active profile and
  // calls window.print(). Useful for parent-teacher conferences,
  // study group accountability, or just keeping a paper trail.
  function buildPrintReport() {
    var profile = P.get();
    var existing = document.getElementById("printReport");
    if (existing) existing.parentNode.removeChild(existing);
    var node = document.createElement("div");
    node.className = "print-report";
    node.id = "printReport";

    var safe = function (s) { return String(s == null ? "" : s).replace(/[<>&]/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;";
    }); };

    // Header
    var avatar = profile.avatar || "🎓";
    var courseLabel = profile.course || "All courses";
    var nowDate = new Date();
    var dateStr = nowDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    var weekStart = new Date(nowDate); weekStart.setDate(nowDate.getDate() - 6);
    var weekRange = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " – " + nowDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

    // Stats
    var msPerDay = 24 * 3600 * 1000;
    var sevenDaysAgo = nowDate.getTime() - 7 * msPerDay;
    var todayKeyStr = nowDate.getFullYear() + "-" + String(nowDate.getMonth() + 1).padStart(2, "0") + "-" + String(nowDate.getDate()).padStart(2, "0");
    var dailyAns = profile.dailyAnswers || {};
    var weekTotal = 0, weekCorrect = 0;
    Object.keys(dailyAns).forEach(function (d) {
      var dd = new Date(d + "T00:00:00").getTime();
      if (dd >= sevenDaysAgo) {
        weekTotal += (dailyAns[d].total || 0);
        weekCorrect += (dailyAns[d].correct || 0);
      }
    });
    var weekShards = 0;
    var dailyShards = profile.dailyShards || {};
    Object.keys(dailyShards).forEach(function (d) {
      var dd = new Date(d + "T00:00:00").getTime();
      if (dd >= sevenDaysAgo) weekShards += (dailyShards[d] || 0);
    });
    var daysActive = (profile.playDays || []).filter(function (d) {
      var dd = new Date(d + "T00:00:00").getTime();
      return dd >= sevenDaysAgo;
    }).length;
    var accuracy = weekTotal > 0 ? Math.round((weekCorrect / weekTotal) * 100) + "%" : "—";

    // Recent achievements (last 7 days)
    var recentAch = (P.listAchievements() || []).filter(function (a) {
      return a.unlocked && a.unlockedAt && a.unlockedAt >= sevenDaysAgo;
    }).slice(0, 8);

    // Topic mastery (top 5 strongest, top 5 weakest from enrolled course if set)
    var topicStats = profile.topicStats || {};
    var topicRows = [];
    var enrolled = profile.course || "";
    var courseKey = enrolled && topicStats[enrolled] ? enrolled : null;
    Object.keys(topicStats).forEach(function (course) {
      Object.keys(topicStats[course]).forEach(function (set) {
        var b = topicStats[course][set];
        if (!b.total) return;
        topicRows.push({
          course: course, set: set,
          correct: b.correct || 0, total: b.total,
          pct: Math.round((b.correct / b.total) * 100)
        });
      });
    });
    var topicCount = topicRows.length;
    var sortedByPct = topicRows.slice().sort(function (a, b) { return b.pct - a.pct; });
    var strongest = sortedByPct.slice(0, 5);
    var weakest = sortedByPct.slice().reverse().slice(0, 5);

    // Test prep
    var testHTML = "";
    var tp = (P.getTestPrep && P.getTestPrep()) || {};
    if (tp.date) {
      var tpDate = new Date(tp.date + "T00:00:00");
      if (!isNaN(tpDate.getTime())) {
        var nowMid = new Date(); nowMid.setHours(0, 0, 0, 0);
        var daysLeft = Math.ceil((tpDate.getTime() - nowMid.getTime()) / msPerDay);
        testHTML = '<div class="print-report-section"><h3>Test Prep Target</h3>' +
          '<p style="margin:0;font-size:13px;">' +
          (daysLeft > 0 ? '<strong>' + daysLeft + ' days</strong> until ' : '') +
          '<strong>' + safe(tp.name || "your test") + '</strong> — ' +
          tpDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) +
          '</p></div>';
      }
    }

    var statsHTML =
      '<div class="print-report-stats">' +
        '<div class="print-report-stat"><strong>' + daysActive + ' / 7</strong><span>days active</span></div>' +
        '<div class="print-report-stat"><strong>' + weekTotal.toLocaleString() + '</strong><span>questions</span></div>' +
        '<div class="print-report-stat"><strong>' + accuracy + '</strong><span>accuracy</span></div>' +
        '<div class="print-report-stat"><strong>' + weekShards.toLocaleString() + '</strong><span>shards earned</span></div>' +
      '</div>';

    var achHTML = recentAch.length
      ? '<ul class="print-report-list">' + recentAch.map(function (a) {
          return '<li><strong>' + safe((a.def && a.def.icon) ? a.def.icon + " " : "") + safe(a.def && a.def.title) + '</strong>' +
            '<span>' + safe(a.def && a.def.tier) + '</span></li>';
        }).join("") + '</ul>'
      : '<p class="print-report-empty">No new achievements this week — keep playing.</p>';

    var topicListHTML = function (rows, label) {
      if (!rows.length) return '<p class="print-report-empty">' + label + ' will appear once you\'ve answered a few questions.</p>';
      return '<ul class="print-report-list">' + rows.map(function (r) {
        return '<li><strong>' + safe(r.course) + ' · ' + safe(r.set) + '</strong>' +
          '<span>' + r.correct + '/' + r.total + ' · ' + r.pct + '%</span></li>';
      }).join("") + '</ul>';
    };

    node.innerHTML =
      '<div class="print-report-header">' +
        '<div>' +
          '<h1 class="print-report-title">' + avatar + ' ' + safe(profile.name || "Trainer") + '</h1>' +
          '<div class="print-report-sub">' + safe(courseLabel) + ' · Week of ' + weekRange + '</div>' +
        '</div>' +
        '<div class="print-report-stamp">' +
          'Generated ' + dateStr + '<br>' +
          (profile.streak && profile.streak.current ? profile.streak.current + '-day streak · best ' + (profile.streak.best || 0) : 'no active streak') +
          ' · ' + (profile.shards || 0).toLocaleString() + ' total shards' +
        '</div>' +
      '</div>' +
      testHTML +
      '<div class="print-report-section">' +
        '<h3>This Week</h3>' + statsHTML +
      '</div>' +
      '<div class="print-report-section">' +
        '<h3>New Achievements</h3>' + achHTML +
      '</div>' +
      (topicCount ? '<div class="print-report-section">' +
        '<h3>Strongest Topics</h3>' + topicListHTML(strongest, "Strongest topics") +
      '</div>' : '') +
      (topicCount ? '<div class="print-report-section">' +
        '<h3>Topics to Focus On</h3>' + topicListHTML(weakest, "Weakest topics") +
      '</div>' : '') +
      '<div class="print-report-footer">Mr. Mac\'s Review Arcade · sirhanmacx.github.io/mr-macs-review-arcade · all data stays on the student\'s device</div>';
    document.body.appendChild(node);
    return node;
  }

  var pdPrintReport = document.getElementById("pdPrintReport");
  if (pdPrintReport) pdPrintReport.addEventListener("click", function () {
    buildPrintReport();
    setTimeout(function () { window.print(); }, 80);
  });

  // Replay the hub tour — bypasses hasSeenTour via { force: true }
  var pdReplayTour = document.getElementById("pdReplayTour");
  if (pdReplayTour) pdReplayTour.addEventListener("click", function () {
    closeDrawer();
    setTimeout(function () {
      if (!window.MrMacsArcadeTour) return;
      var steps = [
        { target: null,         title: "Welcome back.",          body: "Quick refresher of the hub layout — under 30 seconds.",                                                      placement: "center" },
        { target: "#daily",     title: "Today's Challenge",      body: "A new game pick lands every UTC midnight. Play it for +50 shards and a streak day.",                       placement: "bottom" },
        { target: "#routing",   title: "Smart Study Tools",      body: "Diagnostic finds your weak spots. Mastery shows progress. Wrong-Answer Queue serves the misses you've made.", placement: "bottom" },
        { target: "#library",   title: "Every game, one search.",body: "Filter by course, lane, or type. Hit / on a keyboard to jump to search.",                                   placement: "top"    },
        { target: "#profilePill", title: "Your trainer profile.", body: "Click the pill (or press P) to see shards, achievements, settings, and your tier ladder.",                  placement: "bottom" }
      ];
      try { window.MrMacsArcadeTour.start("hub", steps, { force: true }); } catch (e) {}
    }, 320);
  });

  // ---- Achievement tier filter + hide-locked toggle ----
  // Lives in the drawer alongside the achievement grid. Lets students
  // narrow to a tier (Bronze / Silver / Gold / Legendary) and toggle
  // off locked achievements to celebrate just the unlocked ones.
  var achTierState = "all";
  var achHideLocked = false;
  function applyAchFilter() {
    var grid = document.getElementById("pdAchGrid");
    if (!grid) return;
    var tiles = grid.querySelectorAll(".pd-ach");
    Array.prototype.forEach.call(tiles, function (tile) {
      var tier = tile.dataset.tier || "bronze";
      var locked = tile.classList.contains("is-locked");
      var passTier = (achTierState === "all") || (tier === achTierState);
      var passLocked = (!achHideLocked) || (!locked);
      tile.classList.toggle("is-hidden", !(passTier && passLocked));
    });
  }
  var pdAchTiers = document.getElementById("pdAchTiers");
  if (pdAchTiers) pdAchTiers.addEventListener("click", function (e) {
    var btn = e.target.closest(".pd-ach-tier-pill");
    if (!btn) return;
    achTierState = btn.dataset.tier || "all";
    pdAchTiers.querySelectorAll(".pd-ach-tier-pill").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });
    applyAchFilter();
  });
  var pdAchHideLocked = document.getElementById("pdAchHideLocked");
  if (pdAchHideLocked) pdAchHideLocked.addEventListener("change", function () {
    achHideLocked = !!pdAchHideLocked.checked;
    applyAchFilter();
  });
  // Re-apply filter every time the grid re-renders (refreshDrawer)
  if (window.MrMacsProfile) {
    window.MrMacsProfile.on("achievement:unlock", function () { setTimeout(applyAchFilter, 0); });
    window.MrMacsProfile.on("profile:update", function () { setTimeout(applyAchFilter, 0); });
  }

  // ---- Achievement unlock toast ----
  function showAchToast(def) {
    if (!def) return;
    var toast = document.createElement("div");
    toast.className = "ach-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML =
      '<div class="ach-toast-icon">' + (def.icon || "🏆") + '</div>' +
      '<div class="ach-toast-body"><small>Achievement unlocked</small><strong>' + def.title + '</strong></div>';
    document.body.appendChild(toast);
    setTimeout(function () { try { toast.remove(); } catch (e) {} }, 5400);
  }
  P.on("achievement:unlock", function (e) {
    showAchToast(e.detail.def);
    if (drawer && !drawer.hidden) refreshDrawer();
  });

  // ---- Streak announcement on advance ----
  P.on("streak:advance", function (e) {
    if (drawer && !drawer.hidden) refreshDrawer();
  });

  // Expose drawer open API for other UI to call (e.g., the hero "Sign in" button)
  window.MrMacsProfile.openDrawer = openDrawer;
  window.MrMacsProfile.openWelcome = openWelcome;
})();

// ============================================================================
// PHASE 2 — Smart Discovery
// Daily Challenge, Continue rail, Random button, Topic chips.
// ============================================================================
(function () {
  // Wait for GAMES to populate from boot() before rendering anything
  function whenGamesReady() {
    return new Promise(function (resolve) {
      var attempts = 0;
      var tick = setInterval(function () {
        if (typeof GAMES !== "undefined" && GAMES && GAMES.length) {
          clearInterval(tick); resolve();
        } else if (++attempts > 120) {
          clearInterval(tick); resolve(); // give up after 12s; just no-op
        }
      }, 100);
    });
  }

  // ---- Daily Challenge ----
  function todayUTC() {
    var d = new Date();
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
  }
  function hashSeed(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
    return Math.abs(h);
  }
  function dailyPick(games, seed, enrolledCourse) {
    if (!games || !games.length) return null;
    // Prefer Jeopardy unit reviews + sprints + practice exams (~15-30 min runs)
    // over flagship arcade games for daily challenge.
    var preferred = games.filter(function (g) {
      var t = (g.gameType || "").toLowerCase();
      return /unit|sprint|jeopardy|practice|gauntlet/.test(t);
    });
    var pool = preferred.length ? preferred : games;
    // Course-aware filtering: if the student has an enrolled course
    // and that course has at least 3 candidates in the pool, pick from
    // those; otherwise fall back to the full pool. The 3-candidate
    // floor avoids serving the same single game every day for niche
    // courses. Compound course tags like "G10 + G11" still match.
    if (enrolledCourse) {
      var coursePool = pool.filter(function (g) {
        return gameMatchesEnrolledCourse(g, enrolledCourse);
      });
      if (coursePool.length >= 3) pool = coursePool;
    }
    return pool[seed % pool.length];
  }

  function renderDaily() {
    var band = document.getElementById("daily");
    if (!band) return;
    if (!GAMES || !GAMES.length) return;
    var today = todayUTC();
    // Use window.MrMacsProfile directly; the local `P` alias from another
    // function scope isn't visible here. Was throwing ReferenceError and
    // killing the daily-challenge rail (May 10 2026).
    var Pscope = window.MrMacsProfile;
    var enrolled = (Pscope && Pscope.getCourse) ? Pscope.getCourse() : "";
    var pick = dailyPick(GAMES, hashSeed(today), enrolled);
    if (!pick) return;
    var dateEl = document.getElementById("dailyDate");
    var iconEl = document.getElementById("dailyIcon");
    var titleEl = document.getElementById("dailyTitle");
    var subEl = document.getElementById("dailySub");
    var ctaEl = document.getElementById("dailyPlay");
    var statusEl = document.getElementById("dailyStatus");
    if (dateEl) {
      var nice = new Date(today + "T12:00:00Z").toLocaleDateString(undefined, {
        weekday: "long", month: "short", day: "numeric"
      });
      dateEl.textContent = nice;
    }
    if (iconEl) {
      // Pick an emoji glyph based on game type. Native browser rendering
      // means students see colorful Apple/Google glyphs.
      var gt = (pick.gameType || "").toLowerCase();
      var iconChar = "🎯";
      var iconName = "target";
      if (gt.indexOf("sprint") >= 0)        { iconChar = "⚡";  iconName = "bolt";   }
      else if (gt.indexOf("jeopardy") >= 0) { iconChar = "🧠"; iconName = "mind";   }
      else if (gt.indexOf("practice") >= 0) { iconChar = "📝"; iconName = "memo";   }
      else if (gt.indexOf("gauntlet") >= 0) { iconChar = "⚔";  iconName = "swords"; }
      else if (gt.indexOf("rush") >= 0)     { iconChar = "🔥"; iconName = "flame";  }
      iconEl.setAttribute("data-icon", iconName);
      iconEl.textContent = iconChar;
    }
    if (titleEl) titleEl.textContent = pick.title;
    if (subEl) {
      var bits = [];
      if (pick.course) bits.push(pick.course);
      if (pick.gameType) bits.push(pick.gameType);
      if (pick.day) bits.push(pick.day);
      subEl.textContent = bits.filter(Boolean).join(" · ");
    }

    // Check completion state
    var completed = false;
    try {
      var raw = localStorage.getItem("mr-macs-arcade-daily-v1");
      var dailyData = raw ? JSON.parse(raw) : {};
      completed = !!(dailyData[today] && dailyData[today].completed);
    } catch (e) {}

    if (ctaEl) {
      if (completed) {
        ctaEl.classList.add("is-done");
        ctaEl.querySelector("span").textContent = "★ Played — Replay";
      } else {
        ctaEl.classList.remove("is-done");
        var label = ctaEl.querySelector("span");
        if (label) label.textContent = "Take the Challenge";
      }
      ctaEl.onclick = function () {
        // Mark as played on click (any open counts; reward fires at game completion if game emits it)
        try {
          var data = JSON.parse(localStorage.getItem("mr-macs-arcade-daily-v1") || "{}");
          if (!data[today]) {
            data[today] = { gameId: pick.id, openedAt: Date.now(), completed: false };
            localStorage.setItem("mr-macs-arcade-daily-v1", JSON.stringify(data));
            // Use the new server-of-truth claimDailyChallenge API which:
            // - tracks completion count for cross-daily-7 / cross-daily-30 achievements
            // - honors Daily Double inventory (2x payout)
            // - pays out via addShards (so Lucky Charm + Coin Doubler stack on top)
            if (window.MrMacsProfile && window.MrMacsProfile.claimDailyChallenge) {
              var claim = window.MrMacsProfile.claimDailyChallenge({ gameId: pick.id, payout: 60 });
              if (claim.ok && claim.doubled && window.MrMacsToast) {
                window.MrMacsToast.push({
                  icon: "sparkles",
                  title: "📰 Daily Double consumed!",
                  sub: "Today's payout doubled to " + claim.payout + " shards",
                  tone: "achievement",
                  ms: 4500
                });
              }
            } else if (window.MrMacsProfile) {
              // Fallback for older profile builds
              window.MrMacsProfile.addShards(60, "daily-challenge");
            }
            data[today].completed = true;
            localStorage.setItem("mr-macs-arcade-daily-v1", JSON.stringify(data));
          }
        } catch (e) {}
        // Open the game using the existing openGame() if available
        if (typeof openGame === "function") openGame(pick);
        else if (pick.file) location.href = pick.file;
      };
    }
    if (statusEl) {
      statusEl.classList.toggle("is-done", completed);
      // Show "Daily Double ready" hint when the player owns one
      var hasDouble = false;
      if (window.MrMacsProfile && window.MrMacsProfile.getInventory) {
        hasDouble = (window.MrMacsProfile.getInventory().dailyDouble || 0) > 0;
      }
      if (completed) {
        statusEl.textContent = "Completed today · come back tomorrow";
      } else if (hasDouble) {
        statusEl.textContent = "📰 Daily Double ready · 2x payout on completion";
      } else {
        statusEl.textContent = "Resets at midnight UTC · +60 shards";
      }
    }
    // Toggle .is-done on the card itself so the icon pulse stops once played
    var dailyCard = band.querySelector(".daily-card");
    if (dailyCard) dailyCard.classList.toggle("is-done", completed);
    band.hidden = false;

    // Render Today's top scores leaderboard for this challenge's game
    renderDailyLeaderboard(pick);
  }

  // ── Today's Top Scores ─────────────────────────────────────────────
  // Renders top-5 scoreboard for the daily challenge game directly into
  // the daily-band. Hidden when no scores yet to avoid an empty band.
  // Admin mode (?admin=mrmac-arcade-admin-2026 in URL) surfaces a delete
  // button on each row via MrMacsLeaderboards.renderGameLeaderboard.
  function renderDailyLeaderboard(pick) {
    var slot = document.getElementById("dailyLeaderboard");
    if (!slot || !pick) return;
    if (!window.MrMacsLeaderboards || !window.MrMacsLeaderboards.renderGameLeaderboard) {
      slot.innerHTML = "";
      return;
    }
    slot.innerHTML = '<div id="dailyLocalLeaderboard"></div><div id="dailyGlobalLeaderboard"></div>';
    var localSlot = document.getElementById("dailyLocalLeaderboard");
    var globalSlot = document.getElementById("dailyGlobalLeaderboard");
    var rows = window.MrMacsLeaderboards.top(pick.id, 5);
    if (!rows || rows.length === 0) {
      if (localSlot) localSlot.innerHTML = '<div class="daily-lb-empty">Be the first to post a local score on today\'s challenge.</div>';
    } else {
      window.MrMacsLeaderboards.renderGameLeaderboard(pick.id, localSlot || slot, function () {
        return "Today's Local Scores · " + (pick.title || "");
      });
    }
    if (window.MrMacsGlobalLeaderboards && window.MrMacsGlobalLeaderboards.renderGlobalLeaderboard && globalSlot) {
      window.MrMacsGlobalLeaderboards.renderGlobalLeaderboard(pick.id, globalSlot, function () {
        return "Today's Global Board · " + (pick.title || "");
      });
    }
  }

  // ── Auto-submit Daily Challenge claim to the leaderboard ──────────
  // When the player claims today's challenge, push a leaderboard entry
  // tied to that day's pick game. Re-renders the leaderboard panel so
  // the new score appears live without a page reload.
  (function () {
    if (!window.MrMacsProfile || typeof window.MrMacsProfile.on !== "function") return;
    if (!window.MrMacsLeaderboards || !window.MrMacsLeaderboards.submit) return;
    window.MrMacsProfile.on("daily:claim", function (payload) {
      var gameId = payload && payload.gameId;
      var payout = payload && payload.payout;
      if (!gameId || !payout) return;
      try {
        window.MrMacsLeaderboards.submit({
          gameId: gameId,
          score: payout,
          meta: { source: "daily-challenge", date: (new Date()).toISOString().slice(0,10) }
        });
        // Re-render the daily-band leaderboard if visible
        if (typeof renderDaily === "function") renderDaily();
      } catch (e) {}
    });
  })();

  // ---- Continue rail ----
  function renderContinue() {
    var band = document.getElementById("continue");
    var rail = document.getElementById("continueRail");
    if (!band || !rail || !window.MrMacsProfile) return;
    var recent = window.MrMacsProfile.getRecent(8);
    if (!recent || !recent.length) {
      band.hidden = true;
      return;
    }
    var profile = window.MrMacsProfile.get();
    var perGame = (profile && profile.perGameStats) || {};
    rail.innerHTML = recent.map(function (entry) {
      var when = "";
      if (entry.ts) {
        var diff = Date.now() - entry.ts;
        var min = Math.floor(diff / 60000);
        var hour = Math.floor(min / 60);
        var day = Math.floor(hour / 24);
        if (day > 0) when = day + "d ago";
        else if (hour > 0) when = hour + "h ago";
        else if (min > 0) when = min + "m ago";
        else when = "just now";
      }
      var safe = function (v) { return String(v || "").replace(/[<>&"]/g, function (c) {
        return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
      }); };
      var stats = perGame[entry.id];
      var bestStr = "";
      if (stats && stats.bestScore && stats.bestScore > 0) {
        bestStr = '<span class="cc-best" title="Personal best">🏆 ' +
          stats.bestScore.toLocaleString() + '</span>';
      } else if (stats && stats.plays && stats.plays > 1) {
        bestStr = '<span class="cc-best cc-plays" title="Times played">🎲 ' +
          stats.plays + '×</span>';
      }
      return '<button class="continue-card" type="button" data-id="' + safe(entry.id) +
        '" data-file="' + safe(entry.file) + '" role="listitem">' +
        '<span class="cc-kicker">' + safe(entry.course || "Mr. Mac’s Arcade") + '</span>' +
        '<span class="cc-title">' + safe(entry.title) + '</span>' +
        '<span class="cc-meta"><span class="cc-when">' + when + '</span>' + bestStr + '<span class="cc-arrow">→</span></span>' +
      '</button>';
    }).join("");
    Array.prototype.forEach.call(rail.querySelectorAll(".continue-card"), function (card) {
      card.addEventListener("click", function () {
        var id = card.dataset.id;
        var match = (GAMES || []).find(function (g) { return g.id === id; });
        if (match && typeof openGame === "function") openGame(match);
        else if (card.dataset.file) location.href = card.dataset.file;
      });
    });
    // Decorate any cards that have a saved auto-resume snapshot.
    if (window.MrMacsSessions && typeof window.MrMacsSessions.decorateContinueCards === "function") {
      window.MrMacsSessions.decorateContinueCards(rail);
    }
    band.hidden = false;
  }

  // ---- New Cabinet rail (recent flagships, May 2026) ----
  // Drawn from games.json by ID so it stays in sync as we add games.
  // Order matters — newest first.
  var NEW_FLAGSHIPS = [
    // Round 3 mega drop (May 9 2026) — 15 cabinets (pinball-empire removed: chrono-pinball overlap)
    "snake-pit", "defender-drift", "boggle-beat",
    "sudoku-scribe", "memory-palace", "knights-quest", "crossword-cabinet",
    "pong-doctor", "atlas-2048", "bomb-scribe", "chess-cabinet",
    "solitaire-hall", "archive-tycoon", "cube-crash", "word-bridge",
    // Round 2 sweep (May 9 2026)
    "mahjong-mosaic", "reflex-run", "tower-climb", "plinko-lab", "tron-trails",
    // Round 1.5 sweep
    "anagram-atlas", "centiquill", "sokoban-scribe", "echo-hall", "galaxy-defender",
    // Round 1 sweep
    "rumor-whack", "citadel", "step-pyramid", "chronohop",
    "cascade", "chronoblocks", "source-snake", "stellar-drift", "brickoria"
  ];

  function renderNewCabinet() {
    var band = document.getElementById("newCabinet");
    var rail = document.getElementById("newCabinetRail");
    var callout = document.getElementById("whatsNewCallout");
    var calloutCta = document.getElementById("whatsNewCta");
    if (!band || !rail) return;
    if (!GAMES || !GAMES.length) {
      band.hidden = true;
      if (callout) callout.hidden = true;
      return;
    }
    var lookup = {};
    GAMES.forEach(function (g) { lookup[g.id] = g; });
    var picks = NEW_FLAGSHIPS
      .map(function (id) { return lookup[id]; })
      .filter(Boolean);
    if (!picks.length) {
      band.hidden = true;
      if (callout) callout.hidden = true;
      return;
    }
    // Reveal the "what's new this month" callout band ONLY once the
    // new flagships actually exist in the live catalog. CTA smooth
    // scrolls into the New Cabinet rail (one section below).
    if (callout) {
      callout.hidden = false;
      // Update the count in the kicker + stat to reflect actual loaded
      // flagships (graceful when some haven't shipped yet).
      var statBig = callout.querySelector(".whats-new-stat strong");
      if (statBig) statBig.textContent = String(picks.length);
      var titleEl = callout.querySelector(".whats-new-copy .band-title");
      if (titleEl) {
        var word = picks.length === 1 ? "flagship" : "flagships";
        titleEl.innerHTML = (picks.length === 1 ? "One" : (picks.length === 9 ? "Nine" : String(picks.length))) +
          " fresh <em>" + word + "</em> shipped to the arcade.";
      }
      var ctaSpan = callout.querySelector(".whats-new-cta span:first-child");
      if (ctaSpan) ctaSpan.textContent = "Browse all " + picks.length + " cabinet" + (picks.length === 1 ? "" : "s");
    }
    if (calloutCta && !calloutCta.dataset.wired) {
      calloutCta.dataset.wired = "1";
      calloutCta.addEventListener("click", function () {
        var target = document.getElementById("newCabinet");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    // Footer "Latest games" mini-rail. Lists the top three new
    // flagships as quick-launch chips. Hidden until the catalog has
    // at least one resolved entry.
    var latestNav = document.getElementById("footerLatest");
    var latestList = document.getElementById("footerLatestList");
    if (latestNav && latestList) {
      var safeText = function (v) { return String(v || "").replace(/[<>&"]/g, function (c) {
        return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
      }); };
      latestList.innerHTML = picks.slice(0, 3).map(function (g) {
        return '<button class="footer-latest-game" type="button" data-id="' + safeText(g.id) + '">' +
          '<span aria-hidden="true">🎮</span> ' + safeText(g.title) +
        '</button>';
      }).join("");
      Array.prototype.forEach.call(latestList.querySelectorAll(".footer-latest-game"), function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.dataset.id;
          var match = (GAMES || []).find(function (g) { return g.id === id; });
          if (match && typeof openGame === "function") openGame(match);
          else if (match && match.file) location.href = match.file;
        });
      });
      latestNav.hidden = false;
    }
    var profile = window.MrMacsProfile ? window.MrMacsProfile.get() : { perGameStats: {} };
    var perGame = (profile && profile.perGameStats) || {};
    var safe = function (v) { return String(v || "").replace(/[<>&"]/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
    }); };
    rail.innerHTML = picks.map(function (g, i) {
      var stats = perGame[g.id];
      var statBadge = "";
      if (stats && stats.bestScore && stats.bestScore > 0) {
        statBadge = '<span class="cc-best">🏆 ' + stats.bestScore.toLocaleString() + '</span>';
      } else if (stats && stats.plays) {
        statBadge = '<span class="cc-best cc-plays">🎲 ' + stats.plays + '×</span>';
      } else {
        statBadge = '<span class="cc-best cc-fresh">🆕 New</span>';
      }
      // Pick a glyph based on the game's first non-Arcade category
      var cats = g.categories || [];
      var glyph = "🎮";
      var c = (cats[1] || cats[0] || "").toLowerCase();
      if (c.indexOf("brick") >= 0)        glyph = "🧱";
      else if (c.indexOf("aster") >= 0)   glyph = "🚀";
      else if (c.indexOf("snake") >= 0)   glyph = "🐍";
      else if (c.indexOf("tetri") >= 0)   glyph = "🟦";
      else if (c.indexOf("bubble") >= 0)  glyph = "🫧";
      else if (c.indexOf("frogg") >= 0 || c.indexOf("hopper") >= 0) glyph = "🐸";
      else if (c.indexOf("q*bert") >= 0 || c.indexOf("isometric") >= 0 || c.indexOf("pyramid") >= 0) glyph = "🔺";
      else if (c.indexOf("match-3") >= 0 || c.indexOf("bejeweled") >= 0) glyph = "💎";
      else if (c.indexOf("whac") >= 0)    glyph = "🔨";
      return '<button class="continue-card new-cabinet-card" type="button" data-id="' + safe(g.id) +
        '" data-file="' + safe(g.file) + '" role="listitem" style="--card-i:' + i + '">' +
        '<span class="cc-kicker">' + glyph + ' ' + safe(((g.categories || [])[1]) || "Arcade") + '</span>' +
        '<span class="cc-title">' + safe(g.title) + '</span>' +
        '<span class="cc-sub">' + safe(g.subtitle || "").slice(0, 110) + '</span>' +
        '<span class="cc-meta">' + statBadge + '<span class="cc-arrow">→</span></span>' +
      '</button>';
    }).join("");
    Array.prototype.forEach.call(rail.querySelectorAll(".continue-card"), function (card) {
      card.addEventListener("click", function () {
        var id = card.dataset.id;
        var match = (GAMES || []).find(function (g) { return g.id === id; });
        if (match && typeof openGame === "function") openGame(match);
        else if (card.dataset.file) location.href = card.dataset.file;
      });
    });
    band.hidden = false;
  }

  // ---- Random button ----
  function wireRandom() {
    var btn = document.getElementById("libraryRandom");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!GAMES || !GAMES.length) return;
      // Try to pick from currently filtered games if state is exposed; else any
      var pool = GAMES;
      try {
        if (typeof filteredGames === "function") {
          var f = filteredGames();
          if (f && f.length) pool = f;
        }
      } catch (e) {}
      var pick = pool[Math.floor(Math.random() * pool.length)];
      if (!pick) return;
      // Brief visual feedback
      btn.classList.add("is-rolling");
      setTimeout(function () { btn.classList.remove("is-rolling"); }, 350);
      if (typeof openGame === "function") openGame(pick);
      else if (pick.file) location.href = pick.file;
    });
  }

  // ---- Topic chips ----
  function renderTopicChips() {
    var bar = document.getElementById("topicChips");
    if (!bar || !GAMES || !GAMES.length) return;
    // Pick 7-9 most-common short tags / category fragments across the library
    var counts = {};
    GAMES.forEach(function (g) {
      var tags = (g.tags || []).concat(g.categories || []);
      tags.forEach(function (t) {
        if (!t) return;
        // Keep concise topics (≤ 22 chars), drop the catch-all ones
        var s = String(t).trim();
        if (s.length > 22) return;
        if (/^all|^solo|^team|^practice|^review|^cumulative$/i.test(s)) return;
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    var sorted = Object.keys(counts).map(function (k) { return [k, counts[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 9);
    if (!sorted.length) return;
    bar.innerHTML = sorted.map(function (entry) {
      var label = entry[0];
      var count = entry[1];
      var safe = label.replace(/[<>&"]/g, function (c) {
        return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
      });
      return '<button type="button" class="topic-chip" data-topic="' + safe + '" aria-pressed="false">' +
        '<span>' + safe + '</span><span class="topic-chip-count">' + count + '</span></button>';
    }).join("");
    var searchEl = document.getElementById("search");
    Array.prototype.forEach.call(bar.querySelectorAll(".topic-chip"), function (chip) {
      chip.addEventListener("click", function () {
        // Toggle: pressed chip writes its label into the search box; pressing
        // the active chip clears.
        var pressed = chip.getAttribute("aria-pressed") === "true";
        bar.querySelectorAll(".topic-chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        if (pressed) {
          if (searchEl) { searchEl.value = ""; searchEl.dispatchEvent(new Event("input", { bubbles: true })); }
        } else {
          chip.setAttribute("aria-pressed", "true");
          if (searchEl) {
            searchEl.value = chip.dataset.topic;
            searchEl.dispatchEvent(new Event("input", { bubbles: true }));
            // Smooth scroll to library
            var lib = document.getElementById("library");
            if (lib) lib.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
    bar.hidden = false;
  }

  // ---- Recent achievements strip (Trophy Case) ----
  function renderRecentAchievements() {
    var band = document.getElementById("achievementsStrip");
    var rail = document.getElementById("achStripRail");
    if (!band || !rail || !window.MrMacsProfile) return;
    var ach = window.MrMacsProfile.listAchievements();
    var unlocked = ach
      .filter(function (a) { return a.unlocked; })
      .sort(function (a, b) { return (b.unlockedAt || 0) - (a.unlockedAt || 0); })
      .slice(0, 6);
    if (!unlocked.length) {
      band.hidden = true;
      return;
    }
    var renderIcon = function (emojiOrName) {
      if (!emojiOrName) return "";
      if (window.MrMacsIcons) {
        if (window.MrMacsIcons.has(emojiOrName)) return window.MrMacsIcons.svg(emojiOrName);
        var fromE = window.MrMacsIcons.fromEmoji(emojiOrName);
        if (fromE) return fromE;
      }
      return "";
    };
    rail.innerHTML = unlocked.map(function (a) {
      var def = a.def || {};
      var tier = def.tier || "bronze";
      var when = "";
      if (a.unlockedAt) {
        var diff = Date.now() - a.unlockedAt;
        var min = Math.floor(diff / 60000);
        var hour = Math.floor(min / 60);
        var day = Math.floor(hour / 24);
        if (day > 0) when = day + "d ago";
        else if (hour > 0) when = hour + "h ago";
        else if (min > 0) when = min + "m ago";
        else when = "just now";
      }
      var safe = function (v) { return String(v || "").replace(/[<>&]/g, function (c) {
        return c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;";
      }); };
      return '<div class="ach-strip-card" role="listitem" data-tier="' + safe(tier) + '">' +
        '<span class="as-icon" aria-hidden="true">' + renderIcon(def.icon || "🏆") + '</span>' +
        '<span class="as-text">' +
          '<strong class="as-title">' + safe(def.title || "Achievement") + '</strong>' +
          '<span class="as-meta">' + safe(tier).toUpperCase() + ' · ' + safe(when) + '</span>' +
        '</span>' +
      '</div>';
    }).join("");
    // FIX-12: "See all" button visible only when there are 4+ unlocks
    var moreBtn = document.getElementById("achStripMore");
    if (moreBtn) moreBtn.hidden = (unlocked.length < 4);
    band.hidden = false;
  }

  // Wire "See all" button
  var achStripMore = document.getElementById("achStripMore");
  if (achStripMore) {
    achStripMore.addEventListener("click", function () {
      // Open profile drawer + scroll to achievements section
      var pillBtn = document.getElementById("profilePill");
      if (pillBtn) pillBtn.click();
      // After drawer opens, scroll within drawer to achievements
      setTimeout(function () {
        var sect = document.querySelector(".pd-section-achievements");
        if (sect) sect.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 360);
    });
  }

  // ---- Today's Plan checklist ----
  // 3 daily goals derived from profile state. When all 3 are done,
  // student can claim a +60 shard bonus once per day. Claimed state
  // lives in profile.dailyGoalsClaimed[YYYY-MM-DD] = true.
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }
  function renderDailyPlan() {
    var band = document.getElementById("dailyPlanBand");
    if (!band || !window.MrMacsProfile) return;
    var P2 = window.MrMacsProfile;
    var profile = P2.get();
    if (!profile.createdAt) {
      band.hidden = true;
      return;
    }
    var today = todayKey();
    var dailyAns = profile.dailyAnswers || {};
    var todayCorrect = (dailyAns[today] && dailyAns[today].correct) || 0;
    // Goal 1: daily challenge — read from existing per-day completion log
    var dailyDoneFlag = false;
    try {
      var dailyLog = JSON.parse(localStorage.getItem("mr-macs-arcade-daily-v1") || "{}");
      dailyDoneFlag = !!(dailyLog[today] && dailyLog[today].completed);
    } catch (e) {}
    // Goal 2: 10 correct answers
    var tenCorrect = todayCorrect >= 10;
    // Goal 3: streak — current streak's lastDay is today
    var streakKept = (profile.streak && profile.streak.lastDay === today);
    // Apply done-state to UI
    var setDone = function (id, done, subText) {
      var el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle("is-done", !!done);
      if (subText) {
        var sub = el.querySelector(".dp-sub");
        if (sub) sub.textContent = subText;
      }
    };
    setDone("dpGoalChallenge", dailyDoneFlag, dailyDoneFlag ? "✓ Done · come back tomorrow" : "Play the daily pick");
    setDone("dpGoalAnswers", tenCorrect, todayCorrect >= 10 ? "✓ " + todayCorrect + " correct today" : todayCorrect + " of 10 today");
    setDone("dpGoalStreak", streakKept, streakKept ? "✓ Streak day banked" : "Play any game");
    // Claim button
    var allDone = dailyDoneFlag && tenCorrect && streakKept;
    var claimedMap = (profile.dailyGoalsClaimed || {});
    var alreadyClaimed = !!claimedMap[today];
    var claimBtn = document.getElementById("dailyPlanClaim");
    var claimedBadge = document.getElementById("dailyPlanClaimed");
    if (claimBtn) claimBtn.hidden = !(allDone && !alreadyClaimed);
    if (claimedBadge) claimedBadge.hidden = !alreadyClaimed;
    band.hidden = false;
  }
  // Wire goal click → take action
  function wireDailyPlanActions() {
    var goalChallenge = document.getElementById("dpGoalChallenge");
    var goalAnswers = document.getElementById("dpGoalAnswers");
    var goalStreak = document.getElementById("dpGoalStreak");
    if (goalChallenge) goalChallenge.addEventListener("click", function () {
      // Click → scroll to + click the daily-band play button
      var dailyPlay = document.getElementById("dailyPlay");
      if (dailyPlay) dailyPlay.click();
    });
    if (goalAnswers) goalAnswers.addEventListener("click", function () {
      // Click → start the diagnostic (best place to rack up correct answers)
      var btn = document.getElementById("rcDiagnostic");
      if (btn) btn.click();
    });
    if (goalStreak) goalStreak.addEventListener("click", function () {
      // Click → scroll to library random or daily band
      var dailyPlay = document.getElementById("dailyPlay");
      if (dailyPlay) dailyPlay.click();
    });
    var claimBtn = document.getElementById("dailyPlanClaim");
    if (claimBtn) claimBtn.addEventListener("click", function () {
      // Award +60 shards and mark today's claim. Use shallow set
      // through P.set so we don't lose other fields.
      var profile = window.MrMacsProfile.get();
      var today = todayKey();
      var claimed = Object.assign({}, profile.dailyGoalsClaimed || {});
      claimed[today] = Date.now();
      // Prune entries older than 30 days
      Object.keys(claimed).forEach(function (k) {
        var dd = new Date(k + "T00:00:00").getTime();
        if (Date.now() - dd > 30 * 24 * 3600 * 1000) delete claimed[k];
      });
      window.MrMacsProfile.set({ dailyGoalsClaimed: claimed });
      window.MrMacsProfile.addShards(60, "daily-plan");
      renderDailyPlan();
    });
  }

  // ---- Next Best Action ----
  // Compute the highest-priority recommendation based on profile state
  // and surface it as a single tap-to-act pill above the daily band.
  // Priority order (first match wins):
  //   1. No course set                       → "Set your course"
  //   2. Diagnostic stale > 14 days          → "Take a 2-min diagnostic"
  //   3. Wrong-queue ≥ 5                     → "Drill X misses"
  //   4. Enrolled course has untouched unit  → "Try [unit]"
  //   5. Test date < 30 days                 → "Push toward your test"
  //   6. Default (skip — daily band covers)  → null
  function renderNextBestAction() {
    var band = document.getElementById("nbaBand");
    var pill = document.getElementById("nbaPill");
    var iconEl = document.getElementById("nbaIcon");
    var kickerEl = document.getElementById("nbaKicker");
    var titleEl = document.getElementById("nbaTitle");
    if (!band || !pill || !window.MrMacsProfile) return;
    var P2 = window.MrMacsProfile;
    var profile = P2.get();
    var enrolled = profile.course || "";
    var action = null;

    // 1. No course set
    if (!enrolled) {
      action = {
        kicker: "Set up",
        title: "Pick your course so we drill what counts",
        icon: "🎓",
        tone: "warm",
        run: function () {
          var pillBtn = document.getElementById("profilePill");
          if (pillBtn) pillBtn.click();
          setTimeout(function () {
            var sel = document.getElementById("pdCourseSelect");
            if (sel) { sel.scrollIntoView({ behavior: "smooth", block: "center" }); sel.focus(); }
          }, 360);
        }
      };
    }
    // 2. Stale or never-taken diagnostic
    if (!action) {
      var diag = profile.diagnostic;
      var staleDays = 14;
      var isStale = !diag || !diag.takenAt ||
        ((Date.now() - diag.takenAt) / (24 * 3600 * 1000) > staleDays);
      if (isStale) {
        action = {
          kicker: diag ? "Refresh" : "Find your gaps",
          title: diag ? "Take a fresh 8-question diagnostic" : "Run a quick 2-minute diagnostic",
          icon: "🩺",
          tone: "default",
          run: function () {
            var btn = document.getElementById("rcDiagnostic");
            if (btn) btn.click();
          }
        };
      }
    }
    // 3. Wrong queue >= 5 — surface drill mode
    if (!action) {
      var wq = (profile.wrongAnswers || []).length;
      if (wq >= 5) {
        action = {
          kicker: "Drill",
          title: wq + " missed answers waiting for retrieval practice",
          icon: "🎯",
          tone: "urgent",
          run: function () {
            var btn = document.getElementById("rcWrongQueue");
            if (btn) btn.click();
            // Auto-trigger the drill button after the modal opens
            setTimeout(function () {
              var drillBtn = document.getElementById("wqDrill");
              if (drillBtn) drillBtn.click();
            }, 400);
          }
        };
      }
    }
    // 4. Enrolled-course untouched unit (from diagnostic bank)
    if (!action && enrolled && typeof DIAG_BANK_BY_COURSE !== "undefined" && DIAG_BANK_BY_COURSE[enrolled]) {
      var topicStats = profile.topicStats || {};
      var courseStats = topicStats[enrolled] || {};
      var seenSets = {};
      var untouched = [];
      DIAG_BANK_BY_COURSE[enrolled].forEach(function (q) {
        if (seenSets[q.set]) return;
        seenSets[q.set] = true;
        if (!courseStats[q.set] || !courseStats[q.set].total) {
          untouched.push(q.set);
        }
      });
      if (untouched.length) {
        var nextUnit = untouched[0];
        action = {
          kicker: enrolled,
          title: "Open " + nextUnit,
          icon: "📚",
          tone: "default",
          run: function () {
            // Open Mastery Map and let the student tap the unit
            var btn = document.getElementById("rcMastery");
            if (btn) btn.click();
          }
        };
      }
    }
    // 5. Test date < 30 days
    if (!action) {
      var tp = (P2.getTestPrep && P2.getTestPrep()) || {};
      if (tp.date) {
        var d = new Date(tp.date + "T00:00:00");
        var nowMid = new Date();
        nowMid.setHours(0, 0, 0, 0);
        var daysLeft = Math.ceil((d.getTime() - nowMid.getTime()) / (24 * 3600 * 1000));
        if (daysLeft >= 0 && daysLeft <= 30) {
          action = {
            kicker: "Test prep",
            title: daysLeft === 0 ? "Test day — final review" :
                   daysLeft === 1 ? "1 day to go — last drill" :
                   daysLeft + " days to your test — keep practicing",
            icon: "📅",
            tone: "warm",
            run: function () {
              var btn = document.getElementById("rcMastery");
              if (btn) btn.click();
            }
          };
        }
      }
    }

    if (!action) {
      band.hidden = true;
      return;
    }
    pill.dataset.tone = action.tone || "default";
    if (iconEl) iconEl.textContent = action.icon || "→";
    if (kickerEl) kickerEl.textContent = action.kicker || "Next move";
    if (titleEl) titleEl.textContent = action.title || "";
    if (!pill.dataset.bound) {
      pill.dataset.bound = "1";
      pill.addEventListener("click", function () {
        if (typeof pill._action === "function") pill._action();
      });
    }
    pill._action = action.run;
    band.hidden = false;
  }

  // ---- Test-prep countdown band ----
  function renderTestPrep() {
    var band = document.getElementById("testprepBand");
    var card = document.getElementById("testprepCard");
    if (!band || !card || !window.MrMacsProfile || !window.MrMacsProfile.getTestPrep) return;
    var tp = window.MrMacsProfile.getTestPrep();
    var daysEl = document.getElementById("testprepDays");
    var nameEl = document.getElementById("testprepName");
    var dateEl = document.getElementById("testprepDate");
    var fillEl = document.getElementById("testprepBarFill");
    var editEl = document.getElementById("testprepEdit");
    if (!tp.date) {
      band.hidden = true;
      return;
    }
    var d = new Date(tp.date + "T00:00:00");
    if (isNaN(d.getTime())) {
      band.hidden = true;
      return;
    }
    var now = new Date();
    var nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var msPerDay = 24 * 3600 * 1000;
    var daysLeft = Math.ceil((d.getTime() - nowMid) / msPerDay);
    var label = tp.name || "your test";
    if (nameEl) nameEl.textContent = label;
    var displayDate = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    if (dateEl) dateEl.textContent = displayDate;
    var state = "future";
    if (daysLeft < 0) state = "overdue";
    else if (daysLeft === 0) state = "today";
    else if (daysLeft <= 14) state = "imminent";
    card.dataset.state = state;
    if (daysEl) {
      if (daysLeft > 0) daysEl.textContent = "T-" + daysLeft;
      else if (daysLeft === 0) daysEl.textContent = "Today";
      else daysEl.textContent = "+" + Math.abs(daysLeft);
    }
    // Progress bar: % through a 90-day prep window. Clamps to [0, 100].
    if (fillEl) {
      var prepWindow = 90;
      var pct = Math.max(0, Math.min(100, ((prepWindow - daysLeft) / prepWindow) * 100));
      if (daysLeft <= 0) pct = 100;
      fillEl.style.width = pct.toFixed(1) + "%";
    }
    band.hidden = false;
    if (editEl && !editEl.dataset.bound) {
      editEl.dataset.bound = "1";
      editEl.addEventListener("click", function () {
        var pillBtn = document.getElementById("profilePill");
        if (pillBtn) pillBtn.click();
        // Scroll the drawer down to the test-prep section after open
        setTimeout(function () {
          var section = document.querySelector(".pd-section-testprep");
          if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
          var dateInput = document.getElementById("setTestDate");
          if (dateInput) dateInput.focus();
        }, 360);
      });
    }
  }

  // ---- Wire everything once GAMES is ready ----
  whenGamesReady().then(function () {
    renderDaily();
    renderContinue();
    renderNewCabinet();
    renderRecentAchievements();
    renderTestPrep();
    renderNextBestAction();
    renderDailyPlan();
    wireDailyPlanActions();
    wireRandom();
    renderTopicChips();
    // Keep the continue rail + achievements strip in sync with profile updates
    if (window.MrMacsProfile) {
      window.MrMacsProfile.on("profile:update", renderContinue);
      window.MrMacsProfile.on("profile:update", renderNewCabinet);
      window.MrMacsProfile.on("profile:update", renderNextBestAction);
      window.MrMacsProfile.on("profile:update", renderDailyPlan);
      window.MrMacsProfile.on("achievement:unlock", renderRecentAchievements);
      window.MrMacsProfile.on("profile:create", renderRecentAchievements);
      window.MrMacsProfile.on("testprep:change", renderTestPrep);
      window.MrMacsProfile.on("testprep:change", renderNextBestAction);
      window.MrMacsProfile.on("profile:update", renderTestPrep);
      window.MrMacsProfile.on("answer:record", renderNextBestAction);
      window.MrMacsProfile.on("answer:record", renderDailyPlan);
      window.MrMacsProfile.on("streak:advance", renderDailyPlan);
      window.MrMacsProfile.on("wallet:change", renderDailyPlan);
      // Re-roll the daily challenge when the student changes course so
      // the pick is from their new enrolled course immediately.
      window.MrMacsProfile.on("course:change", function () {
        renderDaily();
        renderNextBestAction();
        renderDailyPlan();
      });
    }

    // ── Round-3 module wiring (May 9 2026) ─────────────────────────
    // Each block is independently try/caught so one missing module
    // never blocks the others. Modules are self-mounting + idempotent
    // so calling .mount() twice is safe.

    // Keep the hub clean: no pinned mascot over the launch deck.

    // Mount news ticker — top of page, above the hero
    try {
      if (window.MrMacsNewsTicker && typeof window.MrMacsNewsTicker.mount === "function") {
        var tickerHost = document.getElementById("newsTicker");
        if (!tickerHost) {
          tickerHost = document.createElement("div");
          tickerHost.id = "newsTicker";
          var hero = document.querySelector(".hero") || document.body;
          hero.insertBefore(tickerHost, hero.firstChild);
        }
        window.MrMacsNewsTicker.mount(tickerHost, { position: "top" });
      }
    } catch (e) {}

    // Mount the persistent What's New badge in the topbar nav, then auto-
    // toast if there are unseen entries. The badge stays visible (and
    // clickable) for the lifetime of the page; the toast self-dismisses
    // after 9s. Both open the same drawer.
    try {
      if (window.MrMacsChangelog) {
        var changelogHost = document.getElementById("topnavChangelogHost");
        if (changelogHost && typeof window.MrMacsChangelog.renderUpdateBadge === "function") {
          window.MrMacsChangelog.renderUpdateBadge(changelogHost);
        }
        if (typeof window.MrMacsChangelog.checkAndShowOnLoad === "function") {
          window.MrMacsChangelog.checkAndShowOnLoad();
        }
      }
    } catch (e) {}

    // Wire SFX toggle: clicking flips on/off, updates the icon, and
    // arms the audio context for future plays. The MrMacsSFX module
    // handles persistence to localStorage internally.
    try {
      var sfxBtn = document.getElementById("sfxToggle");
      if (sfxBtn && window.MrMacsSFX) {
        var setState = function () {
          var on = window.MrMacsSFX.isEnabled();
          sfxBtn.setAttribute("data-state", on ? "on" : "off");
          var lbl = sfxBtn.querySelector(".sfx-label");
          if (lbl) lbl.textContent = on ? "SFX" : "MUTED";
        };
        setState();
        sfxBtn.addEventListener("click", function () {
          var next = !window.MrMacsSFX.isEnabled();
          window.MrMacsSFX.setEnabled(next);
          setState();
          if (next) {
            // Unlock audio context with a user gesture + play a confirmation blip
            window.MrMacsSFX.ensureContext();
            window.MrMacsSFX.play("select");
          }
        });
      }
    } catch (e) {}

    // Apply deeplink routing (e.g. ?game=snake-pit autoplays it)
    try {
      if (window.MrMacsDeeplinks && typeof window.MrMacsDeeplinks.applyFromUrl === "function") {
        window.MrMacsDeeplinks.applyFromUrl();
      }
    } catch (e) {}

    // Mount Quick Insights panels (stats · recommender · leaderboard globe)
    try {
      if (window.MrMacsQuickStats && typeof window.MrMacsQuickStats.mount === "function") {
        var statsHost = document.getElementById("quickInsightsStats");
        if (statsHost) window.MrMacsQuickStats.mount(statsHost);
      }
    } catch (e) {}
    try {
      if (window.MrMacsRecommender && typeof window.MrMacsRecommender.mount === "function") {
        var recHost = document.getElementById("quickInsightsRecommender");
        if (recHost) window.MrMacsRecommender.mount(recHost);
      }
    } catch (e) {}
    try {
      if (window.MrMacsLeaderboardGlobe && typeof window.MrMacsLeaderboardGlobe.mount === "function") {
        var globeHost = document.getElementById("quickInsightsGlobe");
        if (globeHost) window.MrMacsLeaderboardGlobe.mount(globeHost);
      }
    } catch (e) {}

    // Wire the Round 3 callout CTA: smooth-scroll to the Library and
    // pre-set the lane to "Play" + sort=priority so the round-3 games
    // surface near the top. Defensive — works even if state/syncFilters
    // are missing.
    try {
      var r3Cta = document.getElementById("round3CalloutCta");
      if (r3Cta && !r3Cta.dataset.wired) {
        r3Cta.dataset.wired = "1";
        r3Cta.addEventListener("click", function () {
          try {
            if (typeof state !== "undefined" && state) {
              state.lane = "play";
              state.course = "All Courses";
              state.subject = "All Subjects";
              state.type = "All Game Types";
              state.query = "";
              state.libraryExpanded = true;
              var search = document.getElementById("search");
              if (search) search.value = "";
              if (typeof syncFilters === "function") syncFilters();
              if (typeof render === "function") render();
            }
          } catch (err) {}
          var target = document.getElementById("library");
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch (e) {}

    // ── Round-4 module wiring (May 10 2026) ────────────────────────
    // New companion modules: resume chip, quick launcher, session timer,
    // streak indicator, notification center, search helpers, mascot dialog,
    // activity feed, trophy showcase, week summary, and skeleton loader.
    // All blocks are independently try/caught — one missing module never
    // blocks the rest.

    // Resume chip (floating bottom-right)
    try { if (window.MrMacsResumeChip) MrMacsResumeChip.mount(document.body); } catch (e) {}

    // Quick launcher (Cmd+K)
    try { if (window.MrMacsQuickLauncher) MrMacsQuickLauncher.bindGlobalShortcut(); } catch (e) {}

    // Session timer
    try { if (window.MrMacsSessionTimer) MrMacsSessionTimer.start(); } catch (e) {}

    // Streak indicator (hot streak detection)
    try { if (window.MrMacsStreakIndicator) MrMacsStreakIndicator.start(); } catch (e) {}

    // Notification bell (mount in topbar)
    try {
      var topbarRight = document.querySelector(".topbar .topbar-right") || document.querySelector(".topbar");
      if (topbarRight && window.MrMacsNotificationCenter) MrMacsNotificationCenter.mountBell(topbarRight);
    } catch (e) {}

    // Mascot dialog stays manual; automatic first-load speech covers the
    // launch deck and makes the lobby feel busier than it is.

    // Did-you-mean on search input
    try {
      if (window.MrMacsSearchHelpers && window.MrMacsSearchHelpers.mountDidYouMean) {
        var _search = document.getElementById("search");
        if (_search && _search.parentElement) {
          var _vocab = MrMacsSearchHelpers.buildVocabulary(window.GAMES || []);
          MrMacsSearchHelpers.mountDidYouMean(_search, _search.parentElement, _vocab);
        }
      }
    } catch (e) {}

    // Trophy showcase mount (in profile drawer or hub band)
    try {
      if (window.MrMacsTrophyShowcase) {
        var trophyHost = document.getElementById("quickInsightsTrophy") || document.getElementById("achStripRail");
        // Already mounted as part of Quick Insights — no-op if already done
        void trophyHost;
      }
    } catch (e) {}

    // Activity feed mount
    try {
      if (window.MrMacsActivityFeed) {
        var feedHost = document.getElementById("quickInsightsFeed");
        if (feedHost && !feedHost.dataset.mounted) {
          MrMacsActivityFeed.mount(feedHost);
          feedHost.dataset.mounted = "1";
        }
      }
    } catch (e) {}

    // Week summary check + show banner
    try {
      if (window.MrMacsWeekSummary && MrMacsWeekSummary.shouldShow()) {
        var weekHost = document.querySelector(".hero") || document.body;
        MrMacsWeekSummary.showBanner(weekHost);
      }
    } catch (e) {}

    // Skeleton placeholders for Library grid (shown until games render)
    try {
      if (window.MrMacsSkeleton) {
        var _grid = document.getElementById("grid");
        if (_grid && !_grid.children.length) MrMacsSkeleton.cards(_grid, 8);
      }
    } catch (e) {}
  });
})();

// ============================================================================
// PHASE 7 — Smart Content Routing
// Diagnostic mini-quiz, Mastery dashboard, Wrong-Answer queue, Cram playlist.
// All driven from MrMacsProfile + GAMES (no server, no telemetry).
// ============================================================================
(function () {
  if (!window.MrMacsProfile) return;
  var P = window.MrMacsProfile;

  function whenGamesReady() {
    return new Promise(function (resolve) {
      var attempts = 0;
      var tick = setInterval(function () {
        if (typeof GAMES !== "undefined" && GAMES && GAMES.length) { clearInterval(tick); resolve(); }
        else if (++attempts > 120) { clearInterval(tick); resolve(); }
      }, 100);
    });
  }
  function safeHTML(s) {
    return String(s || "").replace(/[<>&"]/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
    });
  }

  var modal = document.getElementById("routingModal");
  var rmTitle = document.getElementById("rmTitle");
  var rmBody = document.getElementById("rmBody");
  var rmClose = document.getElementById("rmClose");
  var rmBackdrop = document.getElementById("rmBackdrop");

  function openModal(title, html) {
    if (!modal || !rmBody) return;
    rmTitle.textContent = title;
    rmBody.innerHTML = html;
    modal.hidden = false;
    rmBody.scrollTop = 0;
  }
  function closeModal() { if (modal) modal.hidden = true; }
  if (rmClose) rmClose.addEventListener("click", closeModal);
  if (rmBackdrop) rmBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });

  // ---- Diagnostic question bank (course-tagged, May 2026) ----
  // Each question stores `correctText` (not an index) so we can shuffle
  // choices on every render. The renderer finds which shuffled index
  // matches `correctText` and uses that for grading. This eliminates
  // the old "always option B" pattern that made the answer look
  // pre-highlighted.
  //
  // The diagnostic prefers questions from the player's enrolled course
  // (profile.course), drawing roughly 5/8 from that course and 3/8 from
  // other major courses for breadth. It also remembers the last 24
  // question IDs asked (profile.diagHistory) and skips those, so the
  // student doesn't see a repeat for at least 3 sessions.
  var DIAG_BANK_BY_COURSE = {
    "Grade 5 Social Studies": [
      { id: "g5-01", set: "Early Peoples", prompt: "Which of these civilizations built terraced farms and stone cities high in the Andes?", choices: ["Aztec", "Inca", "Maya", "Olmec"], correctText: "Inca", explanation: "The Inca built terraced farms and stone cities (like Machu Picchu) high in the Andes. The Aztec and Maya were Mesoamerican (modern Mexico/Central America), not Andean." },
      { id: "g5-02", set: "Geography of the Americas", prompt: "The longest mountain range in the Western Hemisphere is the:", choices: ["Rockies", "Andes", "Sierra Madre", "Appalachians"], correctText: "Andes", explanation: "The Andes run roughly 4,300 miles down South America's western edge — the longest range in the Western Hemisphere. The Rockies are second; the Appalachians are far shorter and older." },
      { id: "g5-03", set: "European Exploration", prompt: "The Columbian Exchange refers to the trade of plants, animals, and diseases between:", choices: ["Asia and Africa", "North and South America", "Europe and the Americas", "Russia and the Pacific"], correctText: "Europe and the Americas", explanation: "The Columbian Exchange (named for Columbus's 1492 voyage) moved crops, animals, and diseases between Europe and the Americas — devastating Indigenous peoples through smallpox while transforming European diets with corn and potatoes." },
      { id: "g5-04", set: "Cultures", prompt: "The Maya, Aztec, and Inca civilizations all developed sophisticated:", choices: ["Iron tools", "Wheel-based transport", "Calendars and writing systems", "Gunpowder weapons"], correctText: "Calendars and writing systems", explanation: "All three civilizations independently developed accurate calendars and writing/glyph systems — the Maya are especially famous for their Long Count calendar and hieroglyphs. None used iron tools or wheels for transport." },
      { id: "g5-05", set: "Government", prompt: "A representative democracy is BEST described as a system in which citizens:", choices: ["Vote on every law directly", "Choose leaders to make laws for them", "Are ruled by a single king", "Are ruled by religious authorities"], correctText: "Choose leaders to make laws for them", explanation: "In a representative (or 'indirect') democracy, citizens elect leaders to make laws on their behalf. Voting on every law directly is a *direct* democracy, like ancient Athens." },
      { id: "g5-06", set: "Economics", prompt: "Scarcity occurs when:", choices: ["A country prints too much money", "Wants exceed available resources", "Goods are imported from abroad", "People save instead of spend"], correctText: "Wants exceed available resources", explanation: "Scarcity is the core economic problem: human wants are unlimited but resources are limited. It's why every economy must make trade-offs about what to produce." }
    ],
    "Grade 6 Social Studies": [
      { id: "g6-01", set: "First Humans", prompt: "The Neolithic Revolution describes the shift from hunting and gathering to:", choices: ["Industrial manufacturing", "Settled agriculture", "Long-distance trade", "Monotheistic religion"], correctText: "Settled agriculture", explanation: "Around 10,000 BCE, humans began domesticating plants and animals and settling in one place — the Neolithic ('New Stone') Revolution. This shift to farming enabled cities, surplus food, and specialized labor." },
      { id: "g6-02", set: "River Valleys", prompt: "Hammurabi's Code is most associated with which river valley civilization?", choices: ["Egyptian", "Mesopotamian", "Indus", "Chinese"], correctText: "Mesopotamian", explanation: "Hammurabi ruled Babylon (in Mesopotamia, between the Tigris and Euphrates rivers) around 1750 BCE. His code — 'an eye for an eye' — is one of the earliest known written legal systems." },
      { id: "g6-03", set: "Belief Systems", prompt: "Buddhism teaches that suffering ends by following the:", choices: ["Five Pillars", "Eightfold Path", "Ten Commandments", "Mandate of Heaven"], correctText: "Eightfold Path", explanation: "Buddha taught that suffering ends by following the Eightfold Path (right view, intention, speech, action, etc.). The Five Pillars are Islam; the Ten Commandments are Judeo-Christian." },
      { id: "g6-04", set: "Classical Civilizations", prompt: "Greek city-states like Athens are credited as early experiments in:", choices: ["Theocracy", "Democracy", "Feudalism", "Communism"], correctText: "Democracy", explanation: "Athens, around 500 BCE, gave (free, male) citizens direct say in lawmaking — the world's first major experiment in democracy. The word itself is Greek: *demos* (people) + *kratos* (rule)." },
      { id: "g6-05", set: "Mediterranean", prompt: "The Pax Romana was a 200-year period of:", choices: ["Constant civil war", "Mongol expansion", "Roman peace and stability", "Greek colonization"], correctText: "Roman peace and stability", explanation: "From roughly 27 BCE to 180 CE, Rome enjoyed two centuries of relative internal peace and stable trade across the Mediterranean — the *Pax Romana* ('Roman Peace'). It allowed massive infrastructure (roads, aqueducts) and the spread of Christianity." },
      { id: "g6-06", set: "Eastern Hemisphere Trade", prompt: "The Silk Road primarily connected:", choices: ["Europe and the Americas", "China and the Mediterranean", "India and Australia", "Russia and Antarctica"], correctText: "China and the Mediterranean", explanation: "The Silk Road was a network of overland routes linking Han China to the Roman/Mediterranean world via Central Asia. Silk, spices, ideas, and disease (later, the plague) all traveled it." }
    ],
    "Grade 7 U.S. History I": [
      { id: "g7-01", set: "Native Americans", prompt: "The Iroquois Confederacy was a political alliance located in:", choices: ["Modern-day New York", "Florida", "California", "Mexico"], correctText: "Modern-day New York", explanation: "The Iroquois (Haudenosaunee) Confederacy of five — later six — nations was based in what is now upstate New York. Its Great Law of Peace is sometimes cited as an influence on U.S. federalism." },
      { id: "g7-02", set: "Colonial Era", prompt: "The Mayflower Compact (1620) is significant because it:", choices: ["Ended the slave trade", "Established self-government among the Pilgrims", "Created a national bank", "Guaranteed religious freedom"], correctText: "Established self-government among the Pilgrims", explanation: "Before landing at Plymouth, the Pilgrims signed the Mayflower Compact agreeing to govern themselves by majority rule. It's an early American example of a written self-government agreement — the seed of consent-based government." },
      { id: "g7-03", set: "American Independence", prompt: "The Declaration of Independence (1776) was primarily authored by:", choices: ["John Adams", "Thomas Jefferson", "George Washington", "Benjamin Franklin"], correctText: "Thomas Jefferson", explanation: "Jefferson drafted the Declaration in June 1776; the committee included Adams and Franklin, but Jefferson did the actual writing. Its Lockean language about 'unalienable Rights' is his." },
      { id: "g7-04", set: "Constitution", prompt: "The Bill of Rights refers to the first ___ amendments to the U.S. Constitution.", choices: ["3", "5", "10", "13"], correctText: "10", explanation: "Ratified in 1791, the first ten amendments make up the Bill of Rights. They were added because Anti-Federalists (Patrick Henry, George Mason) refused to ratify the Constitution without explicit protections of individual liberties." },
      { id: "g7-05", set: "Westward Expansion", prompt: "The Louisiana Purchase (1803) doubled the size of the U.S. and was negotiated with:", choices: ["Britain", "Spain", "France", "Mexico"], correctText: "France", explanation: "Jefferson bought the Louisiana Territory from Napoleon's France for $15 million in 1803 — about 4 cents per acre. Napoleon needed cash for his European wars and had given up on a North American empire after the Haitian Revolution." },
      { id: "g7-06", set: "Reform & Division", prompt: "Which event most directly led to the U.S. Civil War?", choices: ["The War of 1812", "Lincoln's election in 1860", "The Embargo Act", "The XYZ Affair"], correctText: "Lincoln's election in 1860", explanation: "Lincoln won the 1860 election with zero Southern electoral votes, on a platform of stopping slavery's expansion. Within weeks of his victory, South Carolina seceded — the war started months later at Fort Sumter." }
    ],
    "Grade 8 U.S. History II": [
      { id: "g8-01", set: "Reconstruction", prompt: "The 13th, 14th, and 15th Amendments are known collectively as the:", choices: ["Civil War Amendments", "Bill of Rights", "Progressive Amendments", "Reconstruction Amendments"], correctText: "Reconstruction Amendments", explanation: "Passed during Reconstruction (1865-1870), the 13th abolished slavery, the 14th guaranteed citizenship and equal protection, and the 15th barred race-based voting restrictions. Together they reshaped the Constitution after the Civil War." },
      { id: "g8-02", set: "Industrialization", prompt: "Andrew Carnegie made his fortune in which industry?", choices: ["Oil", "Steel", "Railroads", "Banking"], correctText: "Steel", explanation: "Carnegie built U.S. Steel through vertical integration — owning the iron mines, ships, railroads, and mills. By 1901 he sold to J.P. Morgan for $480 million and became one of America's richest men." },
      { id: "g8-03", set: "Imperialism & WWI", prompt: "The U.S. entered World War I in 1917 most directly because of:", choices: ["The sinking of the Lusitania alone", "The Zimmermann Telegram and unrestricted submarine warfare", "The assassination of Archduke Ferdinand", "Pearl Harbor"], correctText: "The Zimmermann Telegram and unrestricted submarine warfare", explanation: "Germany's resumption of unrestricted submarine warfare (sinking neutral ships) and the Zimmermann Telegram (offering Mexico U.S. territory if it joined Germany) together pushed the U.S. into WWI in April 1917." },
      { id: "g8-04", set: "Great Depression", prompt: "FDR's New Deal is BEST described as a program of:", choices: ["Foreign intervention", "Tax cuts for the wealthy", "Federal relief, recovery, and reform", "Strict isolationism"], correctText: "Federal relief, recovery, and reform", explanation: "FDR's New Deal had three goals — *relief* for the unemployed (CCC, WPA), *recovery* for the economy (NRA, AAA), and *reform* to prevent another depression (SEC, Social Security, FDIC). The 'Three R's' are the standard framing." },
      { id: "g8-05", set: "World War II", prompt: "The U.S. entered World War II after which event?", choices: ["The Battle of Britain", "Japan's attack on Pearl Harbor (1941)", "The fall of France", "The invasion of Poland"], correctText: "Japan's attack on Pearl Harbor (1941)", explanation: "Japan's surprise attack on Pearl Harbor on December 7, 1941, killed over 2,400 Americans. FDR's 'date which will live in infamy' speech the next day brought the U.S. into WWII." },
      { id: "g8-06", set: "Civil Rights", prompt: "Brown v. Board of Education (1954) ruled that:", choices: ["Segregated schools are unconstitutional", "Affirmative action is required by law", "Voting rights are a state matter", "Interracial marriage is protected"], correctText: "Segregated schools are unconstitutional", explanation: "Brown unanimously ruled that 'separate educational facilities are inherently unequal,' overturning the *Plessy v. Ferguson* (1896) 'separate but equal' doctrine. It launched the modern civil rights era." }
    ],
    "Grade 9 Global History I": [
      { id: "g9-01", set: "Belief Systems", prompt: "Confucianism is BEST described as a:", choices: ["Polytheistic religion", "Code of social and ethical conduct", "Monastic order", "Trade language"], correctText: "Code of social and ethical conduct", explanation: "Confucius (551-479 BCE) taught a code of social ethics — filial piety, respect for elders, the 'Five Relationships' — not a religion with gods. It became the moral framework of imperial China." },
      { id: "g9-02", set: "Classical Civilizations", prompt: "Hellenistic culture spread across the eastern Mediterranean as a result of the conquests of:", choices: ["Julius Caesar", "Alexander the Great", "Darius I", "Constantine"], correctText: "Alexander the Great", explanation: "Alexander conquered from Greece to the Indus River by 323 BCE, fusing Greek culture with Persian, Egyptian, and Indian traditions — the 'Hellenistic' (Greek-influenced) world that followed." },
      { id: "g9-03", set: "Trade Networks", prompt: "Marco Polo's travels in the 13th century described his journey to the court of:", choices: ["Charlemagne", "Suleiman the Magnificent", "Kublai Khan", "Mansa Musa"], correctText: "Kublai Khan", explanation: "Marco Polo's *Travels* (c. 1300) describes 17 years at the court of Kublai Khan, the Mongol emperor of Yuan China. His book introduced Europeans to the wealth of East Asia." },
      { id: "g9-04", set: "Postclassical Powers", prompt: "Mansa Musa's hajj of 1324 is famous for spreading the wealth and influence of which empire?", choices: ["Songhai", "Ghana", "Mali", "Aksum"], correctText: "Mali", explanation: "Mansa Musa, ruler of the Mali Empire, distributed so much gold on his pilgrimage to Mecca that he reportedly devalued Egypt's currency for years. The hajj put Mali on European maps as legendary wealth." },
      { id: "g9-05", set: "Renaissance", prompt: "The Renaissance is described as a 'rebirth' of interest in:", choices: ["Egyptian religion", "Greco-Roman art and learning", "Confucian ethics", "Hindu philosophy"], correctText: "Greco-Roman art and learning", explanation: "*Renaissance* literally means 'rebirth' in French. Beginning in 14th-century Italy, scholars and artists rediscovered classical Greco-Roman texts, art, and architecture, sparking humanism." },
      { id: "g9-06", set: "Encounters", prompt: "The 1492 voyage of Columbus opened a sustained exchange of crops, animals, and disease known as the:", choices: ["Triangle Trade", "Columbian Exchange", "Mediterranean Exchange", "Silk Road"], correctText: "Columbian Exchange", explanation: "Columbus's 1492 voyage opened a sustained, biological exchange between the Old and New Worlds — corn, potatoes, and tomatoes went east; horses, wheat, and smallpox went west. The trans-Atlantic flow reshaped both hemispheres." }
    ],
    "Grade 10 Global History II": [
      { id: "g10-01", set: "Enlightenment", prompt: "John Locke's idea that government draws its authority from the consent of the governed influenced which document?", choices: ["The Magna Carta", "The Declaration of Independence", "The Treaty of Westphalia", "The Code of Hammurabi"], correctText: "The Declaration of Independence", explanation: "Locke's social contract theory — that government's legitimacy comes from the consent of the governed — is paraphrased almost verbatim in Jefferson's Declaration: 'governments are instituted... deriving their just powers from the consent of the governed.'" },
      { id: "g10-02", set: "Industrial Revolution", prompt: "The Industrial Revolution began in which country in the late 18th century?", choices: ["Germany", "Great Britain", "France", "Russia"], correctText: "Great Britain", explanation: "Britain industrialized first (c. 1760-1830) thanks to coal, iron, colonial markets, capital, and inventions like Watt's steam engine. Continental Europe and the U.S. caught up decades later." },
      { id: "g10-03", set: "Imperialism", prompt: "The 1885 Berlin Conference is BEST known for:", choices: ["Ending the Crimean War", "Partitioning Africa among European powers", "Founding the League of Nations", "Opening Japan to trade"], correctText: "Partitioning Africa among European powers", explanation: "At Bismarck's 1884-85 Berlin Conference, European powers carved Africa into colonies on a map — with no African representatives present. By 1914, only Ethiopia and Liberia remained independent." },
      { id: "g10-04", set: "World War I", prompt: "The immediate trigger of World War I in 1914 was the assassination of:", choices: ["Czar Nicholas II", "Archduke Franz Ferdinand", "Kaiser Wilhelm I", "Tsar Alexander III"], correctText: "Archduke Franz Ferdinand", explanation: "On June 28, 1914, Serbian nationalist Gavrilo Princip shot Franz Ferdinand, heir to Austria-Hungary, in Sarajevo. The alliance system (Triple Entente vs. Triple Alliance) then dragged Europe into a continent-wide war within weeks." },
      { id: "g10-05", set: "Cold War", prompt: "The Marshall Plan (1948) provided U.S. aid to:", choices: ["Latin America", "Postwar Western Europe", "Sub-Saharan Africa", "Southeast Asia"], correctText: "Postwar Western Europe", explanation: "Secretary of State Marshall's plan poured ~$13 billion into rebuilding war-shattered Western Europe. The goal was both humanitarian and strategic — a prosperous Western Europe wouldn't go Communist." },
      { id: "g10-06", set: "Decolonization", prompt: "Mohandas Gandhi led the Indian independence movement using a strategy of:", choices: ["Armed insurrection", "Nonviolent civil disobedience", "Religious conversion", "Diplomatic isolation"], correctText: "Nonviolent civil disobedience", explanation: "Gandhi's *satyagraha* ('truth-force') used boycotts, marches (the 1930 Salt March), and hunger strikes — never armed revolt — to make British rule untenable. India won independence in 1947." },
      { id: "g10-07", set: "Human Rights", prompt: "The 1948 Universal Declaration of Human Rights was issued by the:", choices: ["League of Nations", "United Nations", "International Red Cross", "European Union"], correctText: "United Nations", explanation: "Drafted by a UN commission led by Eleanor Roosevelt, the UDHR (Dec 10, 1948) was a direct response to the atrocities of WWII and the Holocaust. It is the founding document of modern human rights law." },
      { id: "g10-08", set: "Globalization", prompt: "The fall of the Berlin Wall in 1989 marked:", choices: ["The start of the Cold War", "German unification and the Cold War's end", "The collapse of the Soviet Union", "The launch of the Marshall Plan"], correctText: "German unification and the Cold War's end", explanation: "On November 9, 1989, East Germans tore down the Wall that had divided Berlin since 1961. Within a year East and West Germany reunified, and by 1991 the USSR itself dissolved — the Cold War was over." }
    ],
    "Grade 11 U.S. History": [
      { id: "g11-01", set: "Constitution", prompt: "The system of checks and balances is designed to:", choices: ["Speed up lawmaking", "Prevent any one branch from gaining too much power", "Centralize power in the presidency", "Allow states to override federal law"], correctText: "Prevent any one branch from gaining too much power", explanation: "Madison designed checks and balances (in Federalist 51) so 'ambition must be made to counteract ambition' — each branch can block overreach by the others (veto, override, judicial review, impeachment). The goal is preventing tyranny, not efficiency." },
      { id: "g11-02", set: "Civil War & Reconstruction", prompt: "The Emancipation Proclamation (1863):", choices: ["Freed all enslaved people in the U.S. immediately", "Freed enslaved people in Confederate-held territory", "Was overturned by the Supreme Court", "Was signed by President Andrew Johnson"], correctText: "Freed enslaved people in Confederate-held territory", explanation: "Lincoln's Proclamation freed the enslaved only in *Confederate-held* areas — not in border states loyal to the Union — and was a war measure based on his commander-in-chief power. Universal abolition came with the 13th Amendment (1865)." },
      { id: "g11-03", set: "Progressive Era", prompt: "The 19th Amendment (1920) granted:", choices: ["Direct election of senators", "Women's suffrage", "An income tax", "Prohibition of alcohol"], correctText: "Women's suffrage", explanation: "Ratified August 1920 after a 70-year suffrage movement (Seneca Falls 1848 to Susan B. Anthony to Alice Paul), the 19th says the right to vote 'shall not be denied... on account of sex.'" },
      { id: "g11-04", set: "Great Depression & New Deal", prompt: "The Social Security Act (1935) created a federal program of:", choices: ["Universal healthcare", "Old-age insurance and unemployment benefits", "Free public housing", "Direct cash payments to all Americans"], correctText: "Old-age insurance and unemployment benefits", explanation: "Part of FDR's Second New Deal, Social Security created a federal old-age pension and unemployment insurance funded by payroll taxes. It was America's first major social-insurance program." },
      { id: "g11-05", set: "Cold War", prompt: "The Cuban Missile Crisis (1962) was resolved when:", choices: ["Cuba invaded Florida", "The Soviet Union withdrew nuclear missiles from Cuba", "The U.S. dropped a nuclear bomb", "The U.S. occupied Havana"], correctText: "The Soviet Union withdrew nuclear missiles from Cuba", explanation: "After 13 days at the brink of nuclear war (October 1962), Khrushchev agreed to remove Soviet missiles from Cuba in exchange for a U.S. pledge not to invade Cuba and a secret promise to remove U.S. missiles from Turkey." },
      { id: "g11-06", set: "Civil Rights", prompt: "Which 1964 federal law banned discrimination in public accommodations?", choices: ["Voting Rights Act", "Civil Rights Act", "Fair Housing Act", "Equal Pay Act"], correctText: "Civil Rights Act", explanation: "The Civil Rights Act of 1964 (signed by LBJ after JFK's assassination) outlawed discrimination based on race, color, religion, sex, or national origin in public accommodations and employment. Voting protections came in the separate 1965 Voting Rights Act." },
      { id: "g11-07", set: "Modern Era", prompt: "The 9/11 attacks led most directly to U.S. military intervention in:", choices: ["Iran", "Afghanistan", "Syria", "Libya"], correctText: "Afghanistan", explanation: "The 9/11 attacks were planned by al-Qaeda from Taliban-ruled Afghanistan. The U.S. invasion began October 2001 — the start of America's longest war (until 2021)." }
    ],
    "AP Psychology": [
      { id: "appsy-01", set: "Research Methods", prompt: "A double-blind procedure is used primarily to control for:", choices: ["Random sampling error", "Experimenter and participant bias", "Confounding variables", "Sampling bias"], correctText: "Experimenter and participant bias", explanation: "In a double-blind study, neither the participants nor the researchers interacting with them know who's in the experimental vs. control group. This eliminates both placebo effects and unintentional experimenter cues." },
      { id: "appsy-02", set: "Biological Bases", prompt: "The neurotransmitter most associated with mood regulation, often targeted by SSRIs, is:", choices: ["Dopamine", "Serotonin", "Acetylcholine", "GABA"], correctText: "Serotonin", explanation: "Low serotonin is linked to depression. SSRIs (Selective Serotonin Reuptake Inhibitors) — Prozac, Zoloft — block serotonin reuptake so more stays in the synapse, easing symptoms." },
      { id: "appsy-03", set: "Sensation & Perception", prompt: "The just-noticeable difference (JND) demonstrates which principle?", choices: ["Weber's law", "Gestalt grouping", "Top-down processing", "Sensory adaptation"], correctText: "Weber's law", explanation: "Weber's law says the JND is a constant *proportion* of the original stimulus, not a fixed amount. You'll notice a 1-pound change in a 10-pound load, but need a 10-pound change to notice in a 100-pound load." },
      { id: "appsy-04", set: "Cognition", prompt: "Loftus's lost-in-the-mall study challenged the reliability of:", choices: ["Sensation", "Eyewitness memory", "Operant conditioning", "Sleep stages"], correctText: "Eyewitness memory", explanation: "Loftus showed adults could be made to 'remember' a fictional childhood event (being lost in a mall) after suggestion. Her work demonstrated memory is reconstructive, not a recording — eyewitness testimony can be implanted." },
      { id: "appsy-05", set: "Development & Learning", prompt: "Piaget's stage in which children master conservation but struggle with abstract reasoning is the:", choices: ["Sensorimotor stage", "Preoperational stage", "Concrete operational stage", "Formal operational stage"], correctText: "Concrete operational stage", explanation: "In Piaget's concrete operational stage (~7-11 years), children grasp conservation (volume stays the same when poured into a different glass) but can't yet handle hypothetical or abstract reasoning. That requires the formal operational stage." },
      { id: "appsy-06", set: "Social Psychology", prompt: "The fundamental attribution error refers to the tendency to:", choices: ["Overemphasize situational causes for others' behavior", "Overemphasize dispositional causes for others' behavior", "Conform to majority opinion", "Obey authority figures"], correctText: "Overemphasize dispositional causes for others' behavior", explanation: "Fundamental attribution error: blaming someone's *personality* for their behavior while ignoring the situation. ('He's lazy' instead of 'he's exhausted from a 12-hour shift.') We do the opposite for ourselves (self-serving bias)." },
      { id: "appsy-07", set: "Personality & Clinical", prompt: "Cognitive-behavioral therapy is most often used to treat:", choices: ["Schizophrenia", "Depression and anxiety disorders", "Dissociative identity disorder", "Bipolar I"], correctText: "Depression and anxiety disorders", explanation: "CBT — pioneered by Beck and Ellis — targets the maladaptive *thoughts* that drive depression and anxiety, then changes the resulting *behaviors*. It has the strongest evidence base for both disorders." }
    ],
    "AP United States History": [
      { id: "apush-01", set: "Period 2 (1607-1754)", prompt: "The triangular trade primarily exchanged enslaved Africans, sugar, and rum among:", choices: ["Britain, Africa, and the Americas", "China, India, and Russia", "France, Spain, and Italy", "Japan, Korea, and the Philippines"], correctText: "Britain, Africa, and the Americas", explanation: "The triangular trade ran rum/manufactured goods from Britain to Africa, enslaved people from Africa to the Americas (the Middle Passage), and sugar/molasses/tobacco from the Americas back to Britain. The economy of three continents depended on it." },
      { id: "apush-02", set: "Period 3 (1754-1800)", prompt: "The Federalist Papers were written to support ratification of the:", choices: ["Articles of Confederation", "U.S. Constitution", "Declaration of Independence", "Treaty of Paris"], correctText: "U.S. Constitution", explanation: "Hamilton, Madison, and Jay published 85 Federalist essays in 1787-88 (under the pseudonym 'Publius') urging New York to ratify the new Constitution. They remain the canonical interpretation of the framers' intent." },
      { id: "apush-03", set: "Period 5 (1844-1877)", prompt: "Manifest Destiny was the belief that the United States was destined to:", choices: ["Spread democracy worldwide", "Expand from the Atlantic to the Pacific", "Free all enslaved people", "Industrialize the South"], correctText: "Expand from the Atlantic to the Pacific", explanation: "Coined by John O'Sullivan in 1845, *Manifest Destiny* held that the U.S. was divinely destined to spread from the Atlantic to the Pacific. It justified the Mexican-American War, Indian removal, and continental expansion." },
      { id: "apush-04", set: "Period 6 (1865-1898)", prompt: "The Dawes Act (1887) attempted to assimilate Native Americans by:", choices: ["Granting full citizenship rights immediately", "Dividing tribal lands into individual plots", "Establishing reservations in the West", "Funding Indigenous schools"], correctText: "Dividing tribal lands into individual plots", explanation: "The Dawes (General Allotment) Act of 1887 broke up communal tribal lands into 160-acre individual plots, aiming to force Native Americans to farm like white settlers. By 1934, tribes had lost about two-thirds of their land." },
      { id: "apush-05", set: "Period 7 (1890-1945)", prompt: "The Treaty of Versailles (1919) was rejected by the U.S. Senate primarily because of opposition to:", choices: ["War reparations on Germany", "Joining the League of Nations", "Self-determination for Eastern Europe", "Disarmament clauses"], correctText: "Joining the League of Nations", explanation: "Senator Henry Cabot Lodge and the 'Irreconcilables' opposed Article X (collective security) of the League of Nations, fearing it would drag the U.S. into future European wars. The Senate rejected the treaty twice — the U.S. never joined." },
      { id: "apush-06", set: "Period 8 (1945-1980)", prompt: "George Kennan's 'Long Telegram' (1946) advocated:", choices: ["Appeasement", "Containment of Soviet expansion", "Pre-emptive war", "Disengagement from Europe"], correctText: "Containment of Soviet expansion", explanation: "Kennan, a U.S. diplomat in Moscow, argued the Soviets were expansionist but cautious — the West should *contain* their influence patiently rather than fight or appease. Containment became Cold War strategy through Truman, Eisenhower, and beyond." },
      { id: "apush-07", set: "Period 9 (1980-Present)", prompt: "Reaganomics is most associated with which combination of policies?", choices: ["High taxes and high spending", "Tax cuts, deregulation, and military buildup", "Wage and price controls", "Universal healthcare"], correctText: "Tax cuts, deregulation, and military buildup", explanation: "Reagan's 1980s economic program combined major tax cuts (top rate dropped from 70% to 28%), deregulation of industries, and a massive military buildup — 'supply-side' or 'trickle-down' economics. Critics blamed it for tripling the national debt." }
    ],
    "AP World History: Modern": [
      { id: "apwh-01", set: "Unit 1 (c. 1200)", prompt: "The Mongol Empire under Genghis Khan and his successors is best known for:", choices: ["Founding Christianity", "Connecting Eurasia and reviving Silk Road trade", "Inventing gunpowder", "Conquering the Americas"], correctText: "Connecting Eurasia and reviving Silk Road trade", explanation: "By 1279 the Mongols controlled the largest contiguous land empire in history (China to Eastern Europe). The *Pax Mongolica* made the Silk Roads safe and busy again, allowing Marco Polo, the Black Death, and gunpowder to all travel west." },
      { id: "apwh-02", set: "Unit 2 Networks", prompt: "The Black Death (14th c.) traveled along which trade network into Europe?", choices: ["The Trans-Saharan", "The Indian Ocean only", "The Silk Roads", "The Trans-Atlantic"], correctText: "The Silk Roads", explanation: "*Yersinia pestis* spread from Central Asia along the Silk Roads during Mongol-era trade, reaching Black Sea ports and then Italy by 1347. It killed 30-60% of Europe's population in five years." },
      { id: "apwh-03", set: "Unit 3 Land-Based Empires", prompt: "The Ottoman, Safavid, and Mughal empires are often grouped because they were all:", choices: ["Christian theocracies", "Gunpowder empires", "Mediterranean republics", "Chinese tributary states"], correctText: "Gunpowder empires", explanation: "The Ottomans (Anatolia/Middle East), Safavids (Persia), and Mughals (India) all rose around 1500 by mastering early gunpowder weapons — especially cannon and muskets — to dominate vast territories. AP World groups them as the 'gunpowder empires.'" },
      { id: "apwh-04", set: "Unit 5 Revolutions", prompt: "The Haitian Revolution (1791-1804) was unique because it:", choices: ["Restored slavery", "Was a successful slave revolt that founded an independent nation", "Was funded by Spain", "Failed within a year"], correctText: "Was a successful slave revolt that founded an independent nation", explanation: "Toussaint L'Ouverture and Dessalines led enslaved Haitians in the only successful slave revolt to create an independent nation (1804). Haiti was the second republic in the Americas after the U.S. and the first Black-led one." },
      { id: "apwh-05", set: "Unit 6 Industrialization", prompt: "The 1885 Berlin Conference is best known for:", choices: ["Ending the Crimean War", "Partitioning Africa among European powers", "Founding the League of Nations", "Opening Japan"], correctText: "Partitioning Africa among European powers", explanation: "At Bismarck's 1884-85 Berlin Conference, European powers carved Africa into colonies on a map without a single African representative present. The 'Scramble for Africa' followed almost immediately." },
      { id: "apwh-06", set: "Unit 7 Global Conflict", prompt: "The Treaty of Versailles imposed which on Germany after WWI?", choices: ["Disarmament, war guilt, and reparations", "Free trade with Britain", "Joining the Soviet Union", "Adoption of Communism"], correctText: "Disarmament, war guilt, and reparations", explanation: "The 1919 Treaty forced Germany to disarm, accept sole guilt for starting the war (Article 231), and pay massive reparations (~$33 billion). The resulting humiliation and economic collapse fueled Hitler's rise in the 1930s." },
      { id: "apwh-07", set: "Unit 9 Globalization", prompt: "The dissolution of the Soviet Union occurred in:", choices: ["1985", "1989", "1991", "2001"], correctText: "1991", explanation: "Gorbachev's reforms (*glasnost*, *perestroika*) plus the 1989 collapse of Eastern European communism left the USSR unable to hold together. It officially dissolved into 15 republics on December 25, 1991." }
    ],
    "AP European History": [
      { id: "apeuro-01", set: "Renaissance & Exploration", prompt: "Machiavelli's The Prince is best characterized as a treatise on:", choices: ["Christian theology", "Practical political power", "Renaissance painting", "Humanist education"], correctText: "Practical political power", explanation: "Machiavelli's 1513 *The Prince* argued that a successful ruler must use whatever means necessary — fear, deception, force — to keep power. It broke from medieval Christian advice books and is often called the first modern work of political science." },
      { id: "apeuro-02", set: "Reformation", prompt: "Luther's 95 Theses (1517) primarily protested:", choices: ["The sale of indulgences", "Papal taxation of monarchs", "Vernacular Bibles", "Monastic vows"], correctText: "The sale of indulgences", explanation: "Luther's 95 Theses (nailed to Wittenberg's church door, October 31, 1517) attacked the Catholic Church's sale of *indulgences* — paid pardons for sin used to fund St. Peter's Basilica. The protest sparked the Protestant Reformation." },
      { id: "apeuro-03", set: "Absolutism", prompt: "Louis XIV of France famously declared 'L'état, c'est moi' to assert:", choices: ["Constitutional monarchy", "Absolute royal authority", "Religious toleration", "Parliamentary supremacy"], correctText: "Absolute royal authority", explanation: "Louis XIV (r. 1643-1715), the 'Sun King,' centralized French power at Versailles and ruled by divine right. 'L'état, c'est moi' ('I am the state') is the motto of European absolutism." },
      { id: "apeuro-04", set: "Scientific Revolution", prompt: "Newton's Principia Mathematica (1687) is most famous for:", choices: ["Heliocentrism", "Universal laws of motion and gravitation", "Theory of evolution", "Quantum mechanics"], correctText: "Universal laws of motion and gravitation", explanation: "Newton's 1687 *Principia* unified terrestrial and celestial physics with three laws of motion and universal gravitation. It capped the Scientific Revolution and dominated physics for over 200 years until Einstein." },
      { id: "apeuro-05", set: "French Revolution", prompt: "The Reign of Terror (1793-94) is most associated with:", choices: ["Louis XVI", "Maximilien Robespierre", "Napoleon Bonaparte", "Cardinal Richelieu"], correctText: "Maximilien Robespierre", explanation: "Robespierre and the Jacobin-led Committee of Public Safety executed ~17,000 'enemies of the Revolution' by guillotine — including Queen Marie Antoinette and eventually Robespierre himself in July 1794. The Terror discredited radical revolution." },
      { id: "apeuro-06", set: "20th-Century Conflict", prompt: "The Treaty of Versailles is most associated with the end of:", choices: ["The Napoleonic Wars", "World War I", "World War II", "The Cold War"], correctText: "World War I", explanation: "Signed June 28, 1919 (five years to the day after Franz Ferdinand's assassination), the Treaty of Versailles formally ended WWI and imposed harsh terms on Germany. WWII ended with separate treaties decades later." },
      { id: "apeuro-07", set: "Cold War & Contemporary", prompt: "The Marshall Plan was a U.S. program to:", choices: ["Rebuild postwar Western Europe", "Expand NATO into Asia", "Aid the Soviet bloc", "Decolonize Africa"], correctText: "Rebuild postwar Western Europe", explanation: "Secretary of State George Marshall's 1948 plan poured ~$13 billion into rebuilding war-shattered Western Europe — partly humanitarian, partly to keep these nations from going Communist during the Cold War." }
    ],
    "AP Human Geography": [
      { id: "aphug-01", set: "Thinking Geographically", prompt: "Which is an example of a formal region?", choices: ["A neighborhood that feels like home", "A country defined by political borders", "A market area around a shopping mall", "A perceived 'cool' part of town"], correctText: "A country defined by political borders", explanation: "A *formal* (or uniform) region has clear, measurable boundaries — like a country, a state, or a climate zone. *Functional* regions revolve around a node (the mall's market area); *vernacular* regions are based on perception ('the South')." },
      { id: "aphug-02", set: "Population", prompt: "The Demographic Transition Model's Stage 4 is characterized by:", choices: ["High birth and death rates", "Falling death rates and high birth rates", "Low birth and low death rates", "Negative population growth always"], correctText: "Low birth and low death rates", explanation: "Stage 4 of the Demographic Transition Model has both low birth rates and low death rates, producing slow or stable population growth. Most developed nations (U.S., Japan, much of Europe) are in Stage 4 or 5 (declining population)." },
      { id: "aphug-03", set: "Cultural Patterns", prompt: "A relocation diffusion is BEST illustrated by:", choices: ["Pizza spreading from a hearth across Europe", "Immigrants bringing language to a new country", "A new fashion trending on social media", "A local crop variety dominating regionally"], correctText: "Immigrants bringing language to a new country", explanation: "*Relocation* diffusion happens when people physically move and carry their culture with them — like Spanish-speaking immigrants bringing Spanish to the U.S. *Expansion* diffusion (the other answers) spreads an idea without anyone moving." },
      { id: "aphug-04", set: "Political Geography", prompt: "Gerrymandering refers to:", choices: ["Drawing district lines for partisan advantage", "Redrawing international borders after war", "Forming a confederation of states", "Granting universal suffrage"], correctText: "Drawing district lines for partisan advantage", explanation: "Gerrymandering (named for Massachusetts Gov. Elbridge Gerry's 1812 salamander-shaped district) is drawing voting district lines to favor one party — usually by 'packing' opposing voters into one district or 'cracking' them across many." },
      { id: "aphug-05", set: "Agriculture", prompt: "The Green Revolution refers to mid-20th-century innovations in:", choices: ["Renewable energy", "High-yield seeds, fertilizers, and irrigation", "Recycling programs", "Forest conservation"], correctText: "High-yield seeds, fertilizers, and irrigation", explanation: "Norman Borlaug's mid-20th-century Green Revolution introduced high-yield seed varieties, chemical fertilizers, pesticides, and irrigation to developing nations — saving an estimated billion lives from famine, especially in India and Mexico." },
      { id: "aphug-06", set: "Urban Land Use", prompt: "The Concentric Zone Model places the central business district in the:", choices: ["Outer ring", "Center of the city", "Suburb", "Industrial periphery"], correctText: "Center of the city", explanation: "Burgess's 1925 Concentric Zone Model places the Central Business District (CBD) at the center of the city, with rings of progressively wealthier residential zones radiating outward. It was based on 1920s Chicago." }
    ],
    "AP U.S. Government and Politics": [
      { id: "apgov-01", set: "Foundations", prompt: "Federalist No. 10 argues that a large republic protects against:", choices: ["Foreign invasion", "The dangers of factions", "Judicial overreach", "Executive tyranny only"], correctText: "The dangers of factions", explanation: "In Federalist 10, Madison argued that a *large* republic dilutes the danger of factions (special interests) because no single faction can dominate a diverse population. Small republics — pure democracies — fall to majority tyranny." },
      { id: "apgov-02", set: "Branches", prompt: "Marbury v. Madison (1803) established:", choices: ["Federalism", "Judicial review", "Executive privilege", "Habeas corpus"], correctText: "Judicial review", explanation: "Chief Justice Marshall ruled that the Supreme Court can strike down laws that violate the Constitution — establishing *judicial review*. It's not in the Constitution itself; *Marbury* invented it and made the Court a coequal branch." },
      { id: "apgov-03", set: "Civil Liberties", prompt: "Gideon v. Wainwright (1963) guaranteed which right to defendants in state criminal cases?", choices: ["The right to a speedy trial", "The right to remain silent", "The right to court-appointed counsel", "The right to a jury of peers"], correctText: "The right to court-appointed counsel", explanation: "Clarence Earl Gideon, jailed in Florida without a lawyer, hand-wrote his appeal in pencil. The Court ruled the 6th Amendment right to counsel is so fundamental that states must provide a lawyer to defendants who can't afford one." },
      { id: "apgov-04", set: "Civil Rights", prompt: "Brown v. Board of Education (1954) overturned the 'separate but equal' doctrine from:", choices: ["Plessy v. Ferguson", "Dred Scott v. Sandford", "Korematsu v. U.S.", "Lochner v. New York"], correctText: "Plessy v. Ferguson", explanation: "*Plessy v. Ferguson* (1896) had upheld 'separate but equal' segregation for nearly 60 years. *Brown* (1954) overturned it unanimously, ruling that segregated schools 'are inherently unequal' under the 14th Amendment." },
      { id: "apgov-05", set: "Political Beliefs", prompt: "A primary election allows party members to:", choices: ["Pass legislation directly", "Choose their party's nominee", "Override a presidential veto", "Confirm Supreme Court justices"], correctText: "Choose their party's nominee", explanation: "A primary is an *intra-party* election where registered party members (in some states, all voters) pick the candidate who'll represent that party in the general election. The general election is when those nominees compete for the office itself." },
      { id: "apgov-06", set: "Political Participation", prompt: "Citizens United v. FEC (2010) ruled that:", choices: ["Independent corporate political spending is protected speech", "Voter ID laws are unconstitutional", "Gerrymandering is illegal", "Public financing of campaigns is required"], correctText: "Independent corporate political spending is protected speech", explanation: "*Citizens United* ruled 5-4 that corporations and unions have First Amendment rights to spend unlimited money on independent political advertising. The decision unleashed Super PACs and reshaped American campaign finance." }
    ],
    "AP Macroeconomics": [
      { id: "apmacro-01", set: "Basic Concepts", prompt: "GDP measures the market value of:", choices: ["All goods produced anywhere by a country's citizens", "Final goods and services produced within a country in a year", "All transactions in the economy", "Government spending only"], correctText: "Final goods and services produced within a country in a year", explanation: "GDP = the market value of all *final* goods and services produced *within a country's borders* in a year. 'Final' avoids double-counting; 'within borders' (not by citizens) is what distinguishes GDP from GNP." },
      { id: "apmacro-02", set: "Indicators", prompt: "Cyclical unemployment is BEST associated with:", choices: ["Workers between jobs", "Mismatched skills", "Economic recessions", "Permanent layoffs from automation"], correctText: "Economic recessions", explanation: "Cyclical unemployment rises during recessions when aggregate demand falls and firms lay off workers. *Frictional* unemployment is people between jobs; *structural* is mismatched skills." },
      { id: "apmacro-03", set: "AD/AS", prompt: "An expansionary fiscal policy uses which tools?", choices: ["Higher taxes and lower spending", "Lower taxes and higher government spending", "Open market sales by the Fed", "Higher reserve requirements"], correctText: "Lower taxes and higher government spending", explanation: "Expansionary fiscal policy boosts aggregate demand by lowering taxes (more money in consumers' pockets) and increasing government spending. It's used to fight recessions; the trade-off is bigger deficits." },
      { id: "apmacro-04", set: "Financial Sector", prompt: "When the Fed BUYS bonds via open market operations, the federal funds rate:", choices: ["Rises", "Falls", "Stays the same", "Floats freely"], correctText: "Falls", explanation: "When the Fed buys bonds, it pumps money into the banking system, increasing reserves. More reserves chasing the same loan demand pushes the federal funds rate down — that's how the Fed eases monetary policy." },
      { id: "apmacro-05", set: "Stabilization", prompt: "The Phillips curve shows the short-run trade-off between:", choices: ["GDP and unemployment", "Inflation and unemployment", "Taxes and spending", "Imports and exports"], correctText: "Inflation and unemployment", explanation: "The Phillips curve (A.W. Phillips, 1958) shows that in the *short run*, lower unemployment tends to come with higher inflation, and vice versa. In the long run, the trade-off disappears — unemployment returns to its natural rate." },
      { id: "apmacro-06", set: "Open Economy", prompt: "If the U.S. dollar appreciates against the euro:", choices: ["U.S. exports to Europe become more expensive", "U.S. imports from Europe become more expensive", "Both rise in price", "Both fall in price"], correctText: "U.S. exports to Europe become more expensive", explanation: "A stronger dollar buys more euros, so European goods become cheaper for Americans (imports rise) but American goods become *more expensive* for Europeans (exports fall). Currency appreciation hurts exporters." }
    ],
    "AP Microeconomics": [
      { id: "apmicro-01", set: "Basic Concepts", prompt: "Opportunity cost is BEST defined as:", choices: ["The dollar price of a good", "The next-best alternative given up", "Total benefits minus total costs", "A sunk cost"], correctText: "The next-best alternative given up", explanation: "Opportunity cost is the value of the *next-best* alternative you give up when you choose something. If you study instead of working a $15/hour shift, the opportunity cost of studying is $15/hour." },
      { id: "apmicro-02", set: "Supply & Demand", prompt: "If demand for a good is inelastic, a price increase will:", choices: ["Decrease total revenue", "Increase total revenue", "Leave revenue unchanged", "Cause a shortage"], correctText: "Increase total revenue", explanation: "When demand is *inelastic* (necessities like insulin or gasoline), quantity demanded barely drops when prices rise — so total revenue (price x quantity) goes up. Elastic goods lose more in quantity than they gain in price." },
      { id: "apmicro-03", set: "Production & Cost", prompt: "Marginal cost equals marginal revenue at the firm's:", choices: ["Break-even point", "Profit-maximizing output", "Shut-down price", "Average cost minimum"], correctText: "Profit-maximizing output", explanation: "Profit-maximizing firms produce until MC = MR. Past that point, the next unit costs more to make than it earns; below it, they're leaving profit on the table. This rule holds in every market structure." },
      { id: "apmicro-04", set: "Imperfect Competition", prompt: "A monopolist earns long-run economic profit because of:", choices: ["Free entry", "Barriers to entry", "Perfectly elastic demand", "Identical products"], correctText: "Barriers to entry", explanation: "In perfect competition, profits attract new firms until profit disappears. Monopolies *block* this entry — through patents, control of inputs, network effects, or government grant — so they keep earning long-run profit." },
      { id: "apmicro-05", set: "Factor Markets", prompt: "In a competitive labor market, a worker's wage equals their:", choices: ["Total revenue product", "Marginal revenue product", "Average product of labor", "Hourly minimum wage"], correctText: "Marginal revenue product", explanation: "In a competitive labor market, firms hire workers until the cost of the last worker (wage) equals what that worker adds to revenue (MRP). If MRP > wage, firms profit by hiring more; if MRP < wage, they cut back." },
      { id: "apmicro-06", set: "Market Failure", prompt: "A negative externality (e.g., pollution) leads markets to produce:", choices: ["The socially optimal quantity", "Less than the socially optimal quantity", "More than the socially optimal quantity", "No output at all"], correctText: "More than the socially optimal quantity", explanation: "Negative externalities (pollution, secondhand smoke) impose costs on third parties that the producer doesn't pay — so the market produces *more* than is socially optimal. This is the classic case for government taxation or regulation." }
    ],
    "Civics and Participation in Government": [
      { id: "civics-01", set: "Foundations", prompt: "The supreme law of the United States is the:", choices: ["Declaration of Independence", "U.S. Constitution", "Articles of Confederation", "Bill of Rights"], correctText: "U.S. Constitution", explanation: "Article VI's Supremacy Clause makes the U.S. Constitution 'the supreme law of the land.' The Declaration of Independence is a statement of principles; the Bill of Rights is part of the Constitution." },
      { id: "civics-02", set: "Branches", prompt: "Veto power belongs to which branch of the federal government?", choices: ["Executive", "Legislative", "Judicial", "Bureaucratic"], correctText: "Executive", explanation: "The president (executive branch) can veto bills passed by Congress. Congress can override a veto with a 2/3 vote in both chambers — a core check-and-balance." },
      { id: "civics-03", set: "Rights", prompt: "Freedom of speech, press, religion, assembly, and petition are protected by the:", choices: ["1st Amendment", "5th Amendment", "10th Amendment", "14th Amendment"], correctText: "1st Amendment", explanation: "The 1st Amendment protects five freedoms: religion, speech, press, assembly, and petition. Memory hook: 'RAPPS' or 'Speech, Press, Assembly, Petition, Religion.'" },
      { id: "civics-04", set: "Elections", prompt: "U.S. presidential elections are decided by the:", choices: ["Popular vote alone", "Electoral College", "Senate", "Supreme Court"], correctText: "Electoral College", explanation: "The Electoral College — created in Article II — has 538 electors; 270 are needed to win. A candidate can lose the popular vote and still win the presidency (as in 2000 and 2016)." },
      { id: "civics-05", set: "Civic Action", prompt: "A nonprofit organization that advocates for a cause is BEST classified as a(n):", choices: ["Political action committee", "Interest group", "Federal agency", "Political party"], correctText: "Interest group", explanation: "An interest group is an organized group of people who try to influence public policy on a specific issue (NRA, ACLU, Sierra Club). Unlike political parties, they don't run candidates; unlike PACs, they don't primarily exist to fund campaigns." },
      { id: "civics-06", set: "Federalism", prompt: "Powers reserved to the states are protected by the:", choices: ["1st Amendment", "10th Amendment", "Necessary and Proper Clause", "Commerce Clause"], correctText: "10th Amendment", explanation: "The 10th Amendment says any power 'not delegated to the United States... is reserved to the States... or to the people.' It's the constitutional anchor for federalism and states' rights (police, education, marriage)." }
    ],
    "Economics": [
      { id: "econ-01", set: "Decision-Making", prompt: "Scarcity forces individuals and societies to:", choices: ["Print more money", "Make trade-offs", "Eliminate competition", "Stop producing"], correctText: "Make trade-offs", explanation: "Because resources are limited and wants aren't, every choice means giving up something else. Trade-offs (and the opportunity costs they create) are the foundation of economic thinking." },
      { id: "econ-02", set: "Markets & Prices", prompt: "If demand rises and supply stays constant, equilibrium price will:", choices: ["Fall", "Rise", "Stay the same", "Become negative"], correctText: "Rise", explanation: "When demand shifts right (rises) and supply doesn't move, the new equilibrium is at a *higher* price and quantity. More buyers competing for the same goods bid the price up." },
      { id: "econ-03", set: "Personal Finance", prompt: "Compound interest is interest earned on:", choices: ["Principal only", "Principal plus previously earned interest", "Future deposits only", "The bank's costs"], correctText: "Principal plus previously earned interest", explanation: "Compound interest pays interest on your *interest* — not just the original principal. Over decades it produces exponential growth, which is why starting to save early matters far more than saving more later." },
      { id: "econ-04", set: "Macroeconomics", prompt: "GDP per capita is BEST used as a rough indicator of:", choices: ["A nation's average income or standard of living", "Total population", "Inflation rate", "Trade deficit"], correctText: "A nation's average income or standard of living", explanation: "GDP per capita = total economic output / population. It's a rough proxy for average income or living standards, though it ignores inequality, unpaid work, and environmental damage." },
      { id: "econ-05", set: "Government & Global", prompt: "A tariff is a tax placed on:", choices: ["Domestic goods", "Imported goods", "Income", "Stock dividends"], correctText: "Imported goods", explanation: "A tariff is an import tax. It raises the price of foreign goods to protect domestic industries — but also makes consumers pay more and can trigger retaliatory tariffs in trade wars." },
      { id: "econ-06", set: "Money & Banking", prompt: "The primary purpose of the Federal Reserve is to:", choices: ["Print currency only", "Conduct U.S. monetary policy and stabilize the financial system", "Collect federal income taxes", "Set tariffs on imports"], correctText: "Conduct U.S. monetary policy and stabilize the financial system", explanation: "The Federal Reserve (created 1913) sets monetary policy — adjusting interest rates and the money supply to control inflation, support employment, and stabilize banks. Treasury (not the Fed) collects taxes and prints currency." }
    ]
  };

  // Merge the generated all-subject shared bank into the hub diagnostic
  // so a student with no selected course gets true general 5-12/AP trivia.
  // Keep the older hand-curated labels intact and append by human label.
  // The bank now lazy-loads after first paint, so this merge can run once at
  // boot and again when MrMacsQuestionBank finishes warming.
  function mergeSharedBankIntoDiagnostic() {
    if (!window.DIAG_BANK_BY_COURSE || !window.DIAG_BANK_COURSE_LABELS) return;
    Object.keys(window.DIAG_BANK_BY_COURSE).forEach(function (courseId) {
      var label = window.DIAG_BANK_COURSE_LABELS[courseId] || courseId;
      if (!DIAG_BANK_BY_COURSE[label]) DIAG_BANK_BY_COURSE[label] = [];
      var seen = {};
      DIAG_BANK_BY_COURSE[label].forEach(function (q) {
        seen[(q.id || q.prompt || "").toString().toLowerCase()] = true;
      });
      window.DIAG_BANK_BY_COURSE[courseId].forEach(function (q) {
        var key = (q.id || q.prompt || "").toString().toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        DIAG_BANK_BY_COURSE[label].push({
          id: q.id || (courseId + "-" + DIAG_BANK_BY_COURSE[label].length),
          set: q.topic || q.subjectArea || "General Review",
          prompt: q.prompt,
          choices: q.choices,
          correctText: q.correctText,
          explanation: q.explanation || "Review the source, standard, or skill connected to this question.",
          courseId: courseId,
          standardRefs: q.standardRefs || [],
          subjectArea: q.subjectArea || "",
          sourceAuthority: q.sourceAuthority || ""
        });
      });
    });
    if (Array.isArray(DIAG_BANK_FLAT)) {
      DIAG_BANK_FLAT.length = 0;
      Object.keys(DIAG_BANK_BY_COURSE).forEach(function (courseName) {
        DIAG_BANK_BY_COURSE[courseName].forEach(function (q) {
          DIAG_BANK_FLAT.push(Object.assign({ course: courseName }, q));
        });
      });
    }
  }
  mergeSharedBankIntoDiagnostic();
  window.addEventListener("mrmacs:question-bank-ready", mergeSharedBankIntoDiagnostic);

  // Flatten the bank for easy iteration when no course is set, and so
  // the "no enrolled course" path still works on a fresh device.
  var DIAG_BANK_FLAT = [];
  Object.keys(DIAG_BANK_BY_COURSE).forEach(function (courseName) {
    DIAG_BANK_BY_COURSE[courseName].forEach(function (q) {
      DIAG_BANK_FLAT.push(Object.assign({ course: courseName }, q));
    });
  });

  // Pick an 8-question diagnostic biased toward the player's enrolled
  // course. Excludes recently-asked question IDs (last 24, ~3 sessions)
  // so each diagnostic feels fresh.
  // Aliases — courses in COURSE_OPTIONS that don't have a direct
  // bank entry but DO have related course bank entries we can pull from.
  // Lets a student enrolled in "AP Macro/Micro Combined" still get
  // course-relevant questions (~5/8) from the macro + micro banks.
  var COURSE_BANK_ALIASES = {
    "AP Macro/Micro Combined": ["AP Macroeconomics", "AP Microeconomics"]
  };

  function pickDiagnosticSet(profile) {
    var QUESTIONS_PER_SESSION = 8;
    var enrolled = profile && profile.course;
    var history = (profile && profile.diagHistory) ? profile.diagHistory : [];
    var historySet = {};
    history.forEach(function (id) { historySet[id] = true; });

    function fresh(arr) {
      return arr.filter(function (q) { return !historySet[q.id]; });
    }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    }
    function balancedGeneral(arr) {
      var groups = {};
      arr.forEach(function (q) {
        var key = q.subjectArea || q.course || "General";
        if (!groups[key]) groups[key] = [];
        groups[key].push(q);
      });
      var keys = shuffle(Object.keys(groups));
      Object.keys(groups).forEach(function (key) { groups[key] = shuffle(groups[key]); });
      var out = [];
      var index = 0;
      var added = true;
      while (added && out.length < arr.length) {
        added = false;
        keys.forEach(function (key) {
          if (groups[key][index]) {
            out.push(groups[key][index]);
            added = true;
          }
        });
        index++;
      }
      return out;
    }

    // Resolve the course's question pool, honoring aliases.
    function poolForCourse(courseName) {
      if (!courseName) return [];
      if (DIAG_BANK_BY_COURSE[courseName]) {
        return DIAG_BANK_BY_COURSE[courseName].map(function (q) {
          return Object.assign({ course: courseName }, q);
        });
      }
      var aliasList = COURSE_BANK_ALIASES[courseName];
      if (!aliasList) return [];
      var combined = [];
      aliasList.forEach(function (aliasCourse) {
        if (!DIAG_BANK_BY_COURSE[aliasCourse]) return;
        DIAG_BANK_BY_COURSE[aliasCourse].forEach(function (q) {
          combined.push(Object.assign({ course: aliasCourse }, q));
        });
      });
      return combined;
    }

    var picks = [];
    var seenIds = {};

    // Pull from the enrolled course first (target 5/8)
    var courseQs = poolForCourse(enrolled);
    if (courseQs.length) {
      var courseFresh = shuffle(fresh(courseQs));
      // If the entire course bank has been seen recently, fall back to
      // the full set — better to repeat than to stall.
      if (!courseFresh.length) courseFresh = shuffle(courseQs);
      var courseTarget = Math.min(5, courseFresh.length);
      for (var i = 0; i < courseTarget && picks.length < QUESTIONS_PER_SESSION; i++) {
        picks.push(courseFresh[i]);
        seenIds[courseFresh[i].id] = true;
      }
    }

    // Fill the rest with broad-spectrum questions from other courses.
    var others = DIAG_BANK_FLAT.filter(function (q) {
      return !seenIds[q.id] && q.course !== enrolled;
    });
    var othersFresh = enrolled ? shuffle(fresh(others)) : balancedGeneral(fresh(others));
    if (!othersFresh.length) othersFresh = enrolled ? shuffle(others) : balancedGeneral(others);
    for (var k = 0; k < othersFresh.length && picks.length < QUESTIONS_PER_SESSION; k++) {
      picks.push(othersFresh[k]);
      seenIds[othersFresh[k].id] = true;
    }

    // Final safety: shuffle the assembled set so the enrolled-course
    // questions don't all bunch at the front.
    return shuffle(picks);
  }

  function startDiagnostic() {
    // Pull a fresh, course-aware set every time the diagnostic opens.
    // The set is drawn from DIAG_BANK_BY_COURSE, biased toward the
    // student's enrolled course (~5/8) and excluding the last 24
    // question IDs so questions don't repeat across sessions.
    var profile = P.get();
    var sessionQs = pickDiagnosticSet(profile);
    var idx = 0;
    var results = []; // [{course, set, correct}, ...]

    // Per-question state lives in the closure so we can shuffle
    // choices anew every render and still grade by `correctText`.
    var currentQuestion = null;
    var currentChoices = [];   // shuffled choice strings for this render
    var currentCorrectIdx = 0; // shuffled-array index of the correct text

    function shuffleChoices(q) {
      var arr = q.choices.slice();
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      var idxOfCorrect = arr.indexOf(q.correctText);
      // Defensive: if the bank has a typo and correctText isn't in
      // choices, reset to the first item rather than crash.
      if (idxOfCorrect < 0) idxOfCorrect = 0;
      return { order: arr, correctIdx: idxOfCorrect };
    }

    function renderQ() {
      currentQuestion = sessionQs[idx];
      if (!currentQuestion) return showSummary();
      var q = currentQuestion;
      var sh = shuffleChoices(q);
      currentChoices = sh.order;
      currentCorrectIdx = sh.correctIdx;
      var total = sessionQs.length;
      var pct = Math.round((idx / total) * 100);
      var hintTokens = (P.getInventory ? P.getInventory().hintTokens : 0);
      var hintUsedThisQ = false;
      var html =
        '<div class="diag-progress"><span class="diag-progress-fill" style="width:' + pct + '%"></span></div>' +
        '<div class="diag-meta">' + safeHTML(q.course) + ' · ' + safeHTML(q.set) + ' · Question ' + (idx + 1) + ' / ' + total + '</div>' +
        '<p class="diag-stem">' + safeHTML(q.prompt) + ' <button class="read-aloud-btn" type="button" aria-label="Read prompt aloud" aria-pressed="false" data-text="' + safeHTML(q.prompt) + '">🔊</button></p>' +
        (hintTokens > 0
          ? '<div class="quiz-hint-bar">' +
              '<span class="qh-meta">Stuck? Use a hint token to eliminate one wrong choice.</span>' +
              '<button class="quiz-hint-btn" id="diagHint" type="button">💡 Use hint <span class="qh-count">' + hintTokens + '</span></button>' +
            '</div>'
          : '') +
        '<div class="diag-choices">' +
          currentChoices.map(function (c, i) {
            return '<button class="diag-choice" data-i="' + i + '" type="button">' + safeHTML(c) + '</button>';
          }).join("") +
        '</div>' +
        '<div class="diag-explanation" id="diagExplanation" hidden></div>' +
        '<div class="diag-advance" id="diagAdvance" hidden>' +
          '<button class="diag-advance-btn" id="diagAdvanceBtn" type="button">Next question →</button>' +
        '</div>';
      openModal("Diagnostic — find your weak spots", html);
      // Wire hint button — eliminates a random wrong choice + consumes
      // one Hint Token from the player's inventory.
      var hintBtn = document.getElementById("diagHint");
      if (hintBtn) hintBtn.addEventListener("click", function () {
        if (hintUsedThisQ) return;
        var wrongIdxs = [];
        for (var ci = 0; ci < currentChoices.length; ci++) {
          if (ci !== currentCorrectIdx) wrongIdxs.push(ci);
        }
        if (!wrongIdxs.length) return;
        var pickIdx = wrongIdxs[Math.floor(Math.random() * wrongIdxs.length)];
        var btn = rmBody.querySelector('.diag-choice[data-i="' + pickIdx + '"]');
        if (btn) {
          btn.classList.add("is-eliminated");
          btn.disabled = true;
        }
        hintUsedThisQ = true;
        if (P.consumeItem) P.consumeItem("hintTokens");
        hintBtn.disabled = true;
        hintBtn.textContent = "✓ hint used";
      });
      Array.prototype.forEach.call(rmBody.querySelectorAll(".diag-choice"), function (btn) {
        btn.addEventListener("click", function () {
          var pickIdx = Number(btn.dataset.i);
          var correct = pickIdx === currentCorrectIdx;
          results.push({
            id: q.id,
            course: q.course,
            set: q.set,
            correct: correct,
            prompt: q.prompt,
            chosen: currentChoices[pickIdx],
            correctText: q.correctText
          });
          P.recordAnswer({
            course: q.course,
            set: q.set,
            correct: correct,
            prompt: q.prompt,
            answer: q.correctText,
            gameId: "diagnostic"
          });
          // Visual feedback — reveal the correct answer ONLY after the
          // user commits. We never apply .is-correct on initial render,
          // so the answer can't appear pre-highlighted.
          rmBody.querySelectorAll(".diag-choice").forEach(function (b) {
            var bi = Number(b.dataset.i);
            if (bi === currentCorrectIdx) b.classList.add("is-correct");
            else if (bi === pickIdx && !correct) b.classList.add("is-wrong");
            b.disabled = true;
          });
          // Reveal explanation (locks in the concept)
          var expEl = document.getElementById("diagExplanation");
          if (expEl && q.explanation) {
            expEl.innerHTML =
              '<div class="diag-explanation-label">' +
                (correct ? "✓ " + safeHTML(q.correctText) : "Correct answer: " + safeHTML(q.correctText)) +
              '</div>' +
              '<p class="diag-explanation-body">' + safeHTML(q.explanation) + '</p>';
            expEl.dataset.tone = correct ? "correct" : "wrong";
            expEl.hidden = false;
          }
          // Show "Next" advance button (replaces auto-advance so student
          // can read the explanation at their own pace).
          var adv = document.getElementById("diagAdvance");
          var advBtn = document.getElementById("diagAdvanceBtn");
          if (adv) adv.hidden = false;
          if (advBtn) {
            advBtn.textContent = (idx + 1 >= sessionQs.length) ? "See results →" : "Next question →";
            advBtn.addEventListener("click", function () { idx++; renderQ(); });
            advBtn.focus();
          }
        });
      });
    }
    function showSummary() {
      var weakUnits = results.filter(function (r) { return !r.correct; });
      var strongUnits = results.filter(function (r) { return r.correct; });
      var weakCourses = {};
      weakUnits.forEach(function (r) { weakCourses[r.course] = (weakCourses[r.course] || 0) + 1; });

      // Persist the IDs we just asked so the next diagnostic skips
      // them. Cap the ring at 24 (~3 sessions) so the bank stays
      // reachable.
      try {
        var p = P.get();
        var hist = (p.diagHistory || []).slice();
        results.forEach(function (r) { if (r.id) hist.push(r.id); });
        if (hist.length > 24) hist = hist.slice(hist.length - 24);
        P.set({ diagHistory: hist });
      } catch (e) {}

      // Reward: 30 shards for completing + 5 per correct answer (max
      // +40 for a perfect 8). Encourages students to finish the
      // diagnostic instead of bailing mid-way. The completion
      // reward only fires when results > 0 to avoid edge cases.
      try {
        if (results.length) {
          var completionAward = 30;
          var perCorrectAward = strongUnits.length * 5;
          var totalAward = completionAward + perCorrectAward;
          P.addShards(totalAward, "diagnostic");
          // Perfect run — fire a big celebration burst from the topbar
          // profile pill on top of the standard wallet:change cascade.
          if (strongUnits.length === results.length && results.length >= 5 && window.MrMacsCelebration) {
            var pill = document.getElementById("profilePill");
            if (pill) {
              window.MrMacsCelebration.burstFromElement(pill, {
                count: 36,
                palette: ["#69f0aa", "#7af0ff", "#f5c451", "#ff7cc8"],
                life: 1.5
              });
            }
          }
        }
      } catch (e) {}

      var recHTML = "";
      var recommendations = [];
      Object.keys(weakCourses).slice(0, 3).forEach(function (course) {
        var match = (typeof GAMES !== "undefined" ? GAMES : []).filter(function (g) {
          return g.course === course;
        });
        var pick = match[Math.floor(Math.random() * match.length)];
        if (pick) recommendations.push({ course: course, game: pick });
      });
      if (recommendations.length) {
        recHTML += '<h4>Recommended drills</h4>';
        recommendations.forEach(function (r) {
          recHTML += '<button class="diag-rec" data-id="' + safeHTML(r.game.id) + '" type="button">' +
            '<span class="diag-rec-icon" aria-hidden="true">📍</span>' +
            '<span><strong>' + safeHTML(r.game.title) + '</strong>' +
            '<span>' + safeHTML(r.course) + '</span></span></button>';
        });
      } else {
        recHTML += '<p style="color: var(--muted); font-style: italic; text-align: center; padding: 20px 0;">' +
          'You aced the diagnostic — try Boss Rush or Cram Mode for new challenges.</p>';
      }

      var summaryHTML =
        '<div class="diag-summary">' +
          '<h4>Your score: ' + strongUnits.length + ' / ' + results.length + '</h4>' +
          '<p style="color:var(--muted);font-size:13px;line-height:1.5;margin:0 0 12px;">' +
            (weakUnits.length === 0 ? 'Perfect run.' :
             weakUnits.length <= 2 ? 'Strong baseline. Drill the misses to lock it in.' :
             'Plenty of room to grow. Start with the recommendations below.') +
          '</p>' +
          recHTML +
        '</div>';
      openModal("Diagnostic results", summaryHTML);
      P.setDiagnostic({ results: results, weakCourses: Object.keys(weakCourses), recommendations: recommendations.map(function (r) { return r.game.id; }) });
      Array.prototype.forEach.call(rmBody.querySelectorAll(".diag-rec"), function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.dataset.id;
          var match = (typeof GAMES !== "undefined" ? GAMES : []).find(function (g) { return g.id === id; });
          if (match && typeof openGame === "function") { closeModal(); openGame(match); }
        });
      });
    }
    renderQ();
  }

  // ---- Mastery dashboard ----
  function showMastery() {
    var stats = P.getTopicStats();
    var enrolled = (P && P.getCourse) ? P.getCourse() : "";

    // ---- Build the enrolled-course Unit Map ----
    // Lists every unit from the diagnostic bank (canonical course
    // outline) so the student sees ALL units in their course — even
    // ones they haven't touched yet. Played units show real
    // mastery; untouched units show 0/0 with a "Try" affordance.
    var unitRows = [];
    if (enrolled && DIAG_BANK_BY_COURSE[enrolled]) {
      var seenSets = {};
      DIAG_BANK_BY_COURSE[enrolled].forEach(function (q) {
        if (seenSets[q.set]) return;
        seenSets[q.set] = true;
        var bucket = (stats[enrolled] && stats[enrolled][q.set]) || { correct: 0, total: 0 };
        unitRows.push({
          course: enrolled,
          set: q.set,
          correct: bucket.correct || 0,
          total: bucket.total || 0,
          pct: bucket.total ? Math.round((bucket.correct / bucket.total) * 100) : null,
          touched: !!bucket.total
        });
      });
      // Order: untouched units first (so student knows what's open),
      // then touched-weak (so they know what to drill), then strong.
      unitRows.sort(function (a, b) {
        if (a.touched !== b.touched) return a.touched ? 1 : -1;
        if (a.pct === null && b.pct === null) return 0;
        return (a.pct || 0) - (b.pct || 0);
      });
    }

    // ---- Build the topicStats-based "other progress" rows ----
    // (rows the student has actually played, excluding enrolled
    // course's units which are already covered above)
    var otherRows = [];
    Object.keys(stats).forEach(function (course) {
      Object.keys(stats[course]).forEach(function (set) {
        var bucket = stats[course][set];
        if (!bucket.total) return;
        // Skip enrolled-course rows — they're covered by the unit map.
        if (enrolled && course === enrolled && unitRows.some(function (u) { return u.set === set; })) return;
        otherRows.push({
          course: course,
          set: set,
          correct: bucket.correct || 0,
          total: bucket.total,
          pct: Math.round((bucket.correct / bucket.total) * 100)
        });
      });
    });
    otherRows.sort(function (a, b) {
      var aIs = (enrolled && a.course === enrolled) ? 0 : 1;
      var bIs = (enrolled && b.course === enrolled) ? 0 : 1;
      if (aIs !== bIs) return aIs - bIs;
      return a.pct - b.pct;
    });

    var html = "";

    if (unitRows.length) {
      html += '<div class="mastery-list">';
      html += '<div class="mastery-section-head mastery-section-enrolled">' + safeHTML(enrolled) + ' · unit map</div>';
      html += unitRows.map(function (r) {
        var pctStr = (r.pct === null) ? "—" : (r.correct + "/" + r.total + " · " + r.pct + "%");
        var pctWidth = (r.pct === null) ? 0 : r.pct;
        var touchedClass = r.touched ? "" : " mastery-row-untouched";
        return '<button class="mastery-row mastery-row-enrolled mastery-row-clickable' + touchedClass +
          '" type="button" data-course="' + safeHTML(r.course) + '" data-set="' + safeHTML(r.set) + '">' +
          '<div class="mr-name">' + safeHTML(r.set) + '</div>' +
          '<div class="mr-pct">' + pctStr + '</div>' +
          '<div class="mastery-bar"><span class="mastery-bar-fill" style="width:' + pctWidth + '%"></span></div>' +
        '</button>';
      }).join("");
      html += '</div>';
    }

    if (otherRows.length) {
      html += '<div class="mastery-list">';
      html += '<div class="mastery-section-head">' + (unitRows.length ? "From other courses" : "Your progress") + '</div>';
      html += otherRows.map(function (r) {
        var isEnrolled = enrolled && r.course === enrolled;
        return '<div class="mastery-row' + (isEnrolled ? ' mastery-row-enrolled' : '') + '">' +
          '<div class="mr-name">' + safeHTML(r.course) + ' / ' + safeHTML(r.set) + '</div>' +
          '<div class="mr-pct">' + r.correct + '/' + r.total + ' · ' + r.pct + '%</div>' +
          '<div class="mastery-bar"><span class="mastery-bar-fill" style="width:' + r.pct + '%"></span></div>' +
        '</div>';
      }).join("");
      html += '</div>';
    }

    if (!html) {
      html = '<div class="mastery-empty">Play a game (Jeopardy, Boss Rush, the diagnostic, etc.) and your topic mastery will appear here.</div>';
    }

    openModal("Mastery Map", html);

    // Wire clickable unit rows → topic-targeted 5-question drill
    Array.prototype.forEach.call(rmBody.querySelectorAll(".mastery-row-clickable"), function (btn) {
      btn.addEventListener("click", function () {
        startTopicDrill(btn.dataset.course, btn.dataset.set);
      });
    });
  }

  // ---- Topic-targeted drill (5 questions on a single course/set) ----
  // Triggered by clicking a unit row in the Mastery Map. Pulls
  // questions from DIAG_BANK_BY_COURSE filtered by set, shuffles
  // choices per render, awards 5 shards per correct.
  function startTopicDrill(course, set) {
    if (!course || !set) return;
    var bank = DIAG_BANK_BY_COURSE[course];
    if (!bank) return;
    var sessionQs = bank.filter(function (q) { return q.set === set; }).map(function (q) {
      return Object.assign({ course: course }, q);
    });
    if (!sessionQs.length) return;
    // Shuffle session order
    for (var i = sessionQs.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = sessionQs[i]; sessionQs[i] = sessionQs[j]; sessionQs[j] = tmp;
    }
    var idx = 0;
    var correctCount = 0;
    var shuffleChoices = function (q) {
      var arr = q.choices.slice();
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      var idxOfCorrect = arr.indexOf(q.correctText);
      if (idxOfCorrect < 0) idxOfCorrect = 0;
      return { order: arr, correctIdx: idxOfCorrect };
    };
    function render() {
      var q = sessionQs[idx];
      if (!q) return finish();
      var sh = shuffleChoices(q);
      var pct = Math.round((idx / sessionQs.length) * 100);
      var hintTokens = (P.getInventory ? P.getInventory().hintTokens : 0);
      var hintUsedThisQ = false;
      var html =
        '<div class="diag-progress"><span class="diag-progress-fill" style="width:' + pct + '%"></span></div>' +
        '<div class="diag-meta">' + safeHTML(course) + ' · ' + safeHTML(set) + ' · Q ' + (idx + 1) + ' / ' + sessionQs.length + '</div>' +
        '<p class="diag-stem">' + safeHTML(q.prompt) + ' <button class="read-aloud-btn" type="button" aria-label="Read prompt aloud" aria-pressed="false" data-text="' + safeHTML(q.prompt) + '">🔊</button></p>' +
        (hintTokens > 0
          ? '<div class="quiz-hint-bar">' +
              '<span class="qh-meta">Stuck? Use a hint token to eliminate one wrong choice.</span>' +
              '<button class="quiz-hint-btn" id="topicHint" type="button">💡 Use hint <span class="qh-count">' + hintTokens + '</span></button>' +
            '</div>'
          : '') +
        '<div class="diag-choices">' +
          sh.order.map(function (c, i) {
            return '<button class="diag-choice" data-i="' + i + '" type="button">' + safeHTML(c) + '</button>';
          }).join("") +
        '</div>' +
        '<div class="diag-explanation" id="topicDrillExplanation" hidden></div>' +
        '<div class="diag-advance" id="topicDrillAdvance" hidden>' +
          '<button class="diag-advance-btn" id="topicDrillAdvanceBtn" type="button">Next →</button>' +
        '</div>';
      openModal("Topic Drill — " + set, html);
      var hintBtn = document.getElementById("topicHint");
      if (hintBtn) hintBtn.addEventListener("click", function () {
        if (hintUsedThisQ) return;
        var wrongIdxs = [];
        for (var ci = 0; ci < sh.order.length; ci++) {
          if (ci !== sh.correctIdx) wrongIdxs.push(ci);
        }
        if (!wrongIdxs.length) return;
        var pickIdx = wrongIdxs[Math.floor(Math.random() * wrongIdxs.length)];
        var elBtn = rmBody.querySelector('.diag-choice[data-i="' + pickIdx + '"]');
        if (elBtn) {
          elBtn.classList.add("is-eliminated");
          elBtn.disabled = true;
        }
        hintUsedThisQ = true;
        if (P.consumeItem) P.consumeItem("hintTokens");
        hintBtn.disabled = true;
        hintBtn.textContent = "✓ hint used";
      });
      Array.prototype.forEach.call(rmBody.querySelectorAll(".diag-choice"), function (btn) {
        btn.addEventListener("click", function () {
          var pickIdx = Number(btn.dataset.i);
          var correct = pickIdx === sh.correctIdx;
          if (correct) correctCount++;
          P.recordAnswer({ course: course, set: set, correct: correct, prompt: q.prompt, answer: q.correctText, gameId: "topic-drill" });
          rmBody.querySelectorAll(".diag-choice").forEach(function (b) {
            var bi = Number(b.dataset.i);
            if (bi === sh.correctIdx) b.classList.add("is-correct");
            else if (bi === pickIdx && !correct) b.classList.add("is-wrong");
            b.disabled = true;
          });
          var expEl = document.getElementById("topicDrillExplanation");
          if (expEl && q.explanation) {
            expEl.innerHTML =
              '<div class="diag-explanation-label">' +
                (correct ? "✓ " + safeHTML(q.correctText) : "Correct answer: " + safeHTML(q.correctText)) +
              '</div>' +
              '<p class="diag-explanation-body">' + safeHTML(q.explanation) + '</p>';
            expEl.dataset.tone = correct ? "correct" : "wrong";
            expEl.hidden = false;
          }
          var adv = document.getElementById("topicDrillAdvance");
          var advBtn = document.getElementById("topicDrillAdvanceBtn");
          if (adv) adv.hidden = false;
          if (advBtn) {
            advBtn.textContent = (idx + 1 >= sessionQs.length) ? "See results →" : "Next →";
            advBtn.addEventListener("click", function () { idx++; render(); });
            advBtn.focus();
          }
        });
      });
    }
    function finish() {
      var shardAward = correctCount * 5;
      if (shardAward > 0) try { P.addShards(shardAward, "topic-drill"); } catch (e) {}
      var summaryHTML =
        '<div class="diag-summary">' +
          '<h4>Topic drill complete</h4>' +
          '<p style="color:var(--muted);font-size:13px;line-height:1.5;margin:0 0 12px;">' +
            correctCount + ' / ' + sessionQs.length + ' correct on ' + safeHTML(set) +
            (shardAward > 0 ? ' · earned <strong style="color:#f5c451">+' + shardAward + ' shards</strong>' : '') +
          '</p>' +
          '<div class="wq-actions" style="margin-top:14px;">' +
            '<button class="wq-drill-btn" id="topicDrillAgain" type="button">Try this topic again</button>' +
            '<button id="topicDrillDone" type="button">Back to Mastery Map</button>' +
          '</div>' +
        '</div>';
      openModal("Drill complete", summaryHTML);
      var again = document.getElementById("topicDrillAgain");
      var done = document.getElementById("topicDrillDone");
      if (again) again.addEventListener("click", function () { startTopicDrill(course, set); });
      if (done) done.addEventListener("click", function () { showMastery(); });
    }
    render();
  }

  // ---- Wrong-answer queue ----
  function showWrongQueue() {
    var queue = P.getWrongQueue(60);
    var enrolled = (P && P.getCourse) ? P.getCourse() : "";
    var html;
    if (!queue.length) {
      html = '<div class="wq-empty">No misses queued. Get something wrong in Jeopardy or Boss Rush and it lands here.</div>';
    } else {
      // Sort: enrolled-course misses to the top, then by recency.
      // Within each group, newest first.
      var sortedQueue = queue.slice().sort(function (a, b) {
        var aCourse = (enrolled && a.course === enrolled) ? 0 : 1;
        var bCourse = (enrolled && b.course === enrolled) ? 0 : 1;
        if (aCourse !== bCourse) return aCourse - bCourse;
        return (b.ts || 0) - (a.ts || 0);
      });
      // Cap visible to 40 items so the modal scrolls comfortably.
      sortedQueue = sortedQueue.slice(0, 40);
      var courseHeaderInjected = false;
      var inOtherSection = false;
      var rendered = sortedQueue.map(function (w, idx) {
        var when = "";
        if (w.ts) {
          var diff = Date.now() - w.ts;
          var min = Math.floor(diff / 60000);
          var hour = Math.floor(min / 60);
          var day = Math.floor(hour / 24);
          if (day > 0) when = day + "d ago";
          else if (hour > 0) when = hour + "h ago";
          else when = (min || 0) + "m ago";
        }
        var prefix = "";
        var isInEnrolled = enrolled && w.course === enrolled;
        // Inject a section header before the first non-enrolled item
        if (enrolled && !isInEnrolled && !inOtherSection) {
          inOtherSection = true;
          prefix = '<div class="wq-section-head">From other courses</div>';
        }
        if (enrolled && isInEnrolled && !courseHeaderInjected) {
          courseHeaderInjected = true;
          prefix = '<div class="wq-section-head wq-section-enrolled">' + safeHTML(enrolled) + '</div>';
        }
        return prefix +
          '<div class="wq-item' + (isInEnrolled ? ' wq-item-enrolled' : '') + '">' +
            '<p class="wq-prompt">' + safeHTML(w.prompt) + '</p>' +
            '<span class="wq-answer">' + safeHTML(w.answer) + '</span>' +
            '<div class="wq-meta">' + safeHTML(w.course) + ' · ' + safeHTML(w.set) + ' · ' + when + '</div>' +
          '</div>';
      }).join("");
      html = rendered + '<div class="wq-actions">' +
        '<button id="wqDrill" class="wq-drill-btn" type="button">Drill 10</button>' +
        '<button id="wqClear" type="button">Clear queue</button>' +
      '</div>';
    }
    openModal("Wrong-Answer Queue", html);
    var clearBtn = document.getElementById("wqClear");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      if (confirm("Clear all queued wrong answers?")) {
        P.clearWrongQueue();
        showWrongQueue();
        updateRoutingSubs();
      }
    });
    var drillBtn = document.getElementById("wqDrill");
    if (drillBtn) drillBtn.addEventListener("click", function () {
      startWrongAnswerDrill();
    });
  }

  // ---- Wrong-answer DRILL mode (active retrieval practice) ----
  // Flashcard-style retry of queued misses. Student sees the prompt,
  // hits "Show answer", then self-rates as "I remember" (retire from
  // queue + earn 5 shards) or "Need more practice" (keep in queue).
  // Up to 10 cards per session, biased toward enrolled-course misses.
  function startWrongAnswerDrill() {
    // Spaced-repetition: prefer cards whose nextShowAt has elapsed.
    // If nothing is due yet, fall back to recent misses so the student
    // can still drill on demand.
    var dueQueue = (P.getDueWrongAnswers ? P.getDueWrongAnswers(80) : []);
    var queue = dueQueue.length ? dueQueue : P.getWrongQueue(80);
    var enrolled = (P && P.getCourse) ? P.getCourse() : "";
    if (!queue.length) return;

    // Stable shuffle, but bias enrolled-course items to the front.
    var sorted = queue.slice().sort(function (a, b) {
      var aIs = (enrolled && a.course === enrolled) ? 0 : 1;
      var bIs = (enrolled && b.course === enrolled) ? 0 : 1;
      if (aIs !== bIs) return aIs - bIs;
      return Math.random() - 0.5;
    });
    var session = sorted.slice(0, Math.min(10, sorted.length));
    var idx = 0;
    var remembered = 0;
    var stillUnsure = 0;
    var mastered = 0;
    var sessionMode = dueQueue.length ? "spaced" : "all";

    function render() {
      var w = session[idx];
      if (!w) return showSummary();
      var when = "";
      if (w.ts) {
        var diff = Date.now() - w.ts;
        var min = Math.floor(diff / 60000);
        var hour = Math.floor(min / 60);
        var day = Math.floor(hour / 24);
        if (day > 0) when = day + "d ago";
        else if (hour > 0) when = hour + "h ago";
        else when = (min || 0) + "m ago";
      }
      var pct = Math.round((idx / session.length) * 100);
      var html =
        '<div class="diag-progress"><span class="diag-progress-fill" style="width:' + pct + '%"></span></div>' +
        '<div class="diag-meta">' + safeHTML(w.course) + ' · ' + safeHTML(w.set) + ' · Card ' + (idx + 1) + ' / ' + session.length + ' · missed ' + when + '</div>' +
        '<p class="diag-stem wq-drill-stem">' + safeHTML(w.prompt) + ' <button class="read-aloud-btn" type="button" aria-label="Read prompt aloud" aria-pressed="false" data-text="' + safeHTML(w.prompt) + '">🔊</button></p>' +
        '<div class="wq-drill-reveal" id="wqDrillReveal" hidden>' +
          '<div class="wq-drill-answer-label">Correct answer</div>' +
          '<div class="wq-drill-answer">' + safeHTML(w.answer) + '</div>' +
        '</div>' +
        '<div class="wq-drill-actions">' +
          '<button class="wq-drill-show" id="wqDrillShow" type="button">Show answer</button>' +
          '<div class="wq-drill-grade" id="wqDrillGrade" hidden>' +
            '<button class="wq-drill-grade-yes" id="wqDrillYes" type="button">I remember</button>' +
            '<button class="wq-drill-grade-no" id="wqDrillNo" type="button">Need more practice</button>' +
          '</div>' +
        '</div>';
      openModal("Drill — retrieve the missed answer", html);
      var showBtn = document.getElementById("wqDrillShow");
      var reveal = document.getElementById("wqDrillReveal");
      var grade = document.getElementById("wqDrillGrade");
      if (showBtn) showBtn.addEventListener("click", function () {
        showBtn.style.display = "none";
        if (reveal) reveal.hidden = false;
        if (grade) grade.hidden = false;
      });
      var yesBtn = document.getElementById("wqDrillYes");
      var noBtn = document.getElementById("wqDrillNo");
      if (yesBtn) yesBtn.addEventListener("click", function () {
        remembered++;
        try {
          // Spaced repetition: advance the box; mastered (box 5) retires.
          var grade = P.gradeWrongAnswer ? P.gradeWrongAnswer(w.prompt, true) : null;
          if (grade && grade.retired) mastered++;
          P.recordAnswer({ course: w.course, set: w.set, correct: true, prompt: w.prompt, answer: w.answer, gameId: "wrong-drill" });
        } catch (e) {}
        idx++;
        render();
      });
      if (noBtn) noBtn.addEventListener("click", function () {
        stillUnsure++;
        try {
          // Spaced repetition: reset to box 1, schedule for tomorrow.
          if (P.gradeWrongAnswer) P.gradeWrongAnswer(w.prompt, false);
        } catch (e) {}
        idx++;
        render();
      });
    }

    function showSummary() {
      var shardAward = remembered * 5 + mastered * 10; // bonus 10 per mastery
      try { if (shardAward > 0) P.addShards(shardAward, "wrong-drill"); } catch (e) {}
      var stats = remembered + ' remembered · ' + stillUnsure + ' need more practice' +
                  (mastered > 0 ? ' · <strong style="color:#69f0aa">' + mastered + ' mastered</strong>' : '');
      var modeNote = sessionMode === "spaced" ? "Cards re-surface on a 1d → 3d → 7d → 14d ladder. Mastered cards drop off the queue." : "";
      var summaryHTML =
        '<div class="diag-summary">' +
          '<h4>Drill complete</h4>' +
          '<p style="color:var(--muted);font-size:13px;line-height:1.5;margin:0 0 6px;">' + stats +
            (shardAward > 0 ? ' · earned <strong style="color:#f5c451">+' + shardAward + ' shards</strong>' : '') +
          '</p>' +
          (modeNote ? '<p style="color:var(--muted-2);font-size:11.5px;line-height:1.45;margin:0 0 12px;font-style:italic;">' + modeNote + '</p>' : '') +
          '<div class="wq-actions" style="margin-top:14px;">' +
            ((P.getDueWrongAnswers ? P.getDueWrongAnswers(1) : P.getWrongQueue(1)).length ? '<button class="wq-drill-btn" id="wqDrillAgain" type="button">Drill 10 more</button>' : '') +
            '<button id="wqDone" type="button">Done</button>' +
          '</div>' +
        '</div>';
      openModal("Drill complete", summaryHTML);
      var again = document.getElementById("wqDrillAgain");
      if (again) again.addEventListener("click", function () { startWrongAnswerDrill(); });
      var done = document.getElementById("wqDone");
      if (done) done.addEventListener("click", function () { closeModal(); updateRoutingSubs(); });
    }
    render();
  }

  // ---- Cram Mode playlist generator ----
  function showCramForm() {
    var courses = [...new Set(((typeof GAMES !== "undefined") ? GAMES : []).map(function (g) { return g.course; }).filter(Boolean))].sort();
    var enrolled = (P && P.getCourse) ? P.getCourse() : "";
    var enrolledHasGames = enrolled && courses.indexOf(enrolled) !== -1;
    var html =
      '<div class="cram-form">' +
        '<label>Course' +
          '<select id="cramCourse">' +
            '<option value="">— pick a course —</option>' +
            courses.map(function (c) {
              var sel = (enrolledHasGames && c === enrolled) ? ' selected' : '';
              return '<option value="' + safeHTML(c) + '"' + sel + '>' + safeHTML(c) + '</option>';
            }).join("") +
          '</select>' +
        '</label>' +
        '<button class="welcome-cta" id="cramBuild" type="button"' + (enrolledHasGames ? '' : ' disabled') + ' style="margin-top:6px;">' +
          '<span>Build my cram playlist</span><span class="arrow">→</span>' +
        '</button>' +
      '</div>' +
      '<div class="cram-playlist" id="cramPlaylist"></div>';
    openModal("Cram Playlist", html);
    var sel = document.getElementById("cramCourse");
    var build = document.getElementById("cramBuild");
    if (sel && build) {
      sel.addEventListener("change", function () { build.disabled = !sel.value; });
      build.addEventListener("click", function () { renderCramPlaylist(sel.value); });
      // Auto-build if the enrolled course was pre-selected
      if (enrolledHasGames) {
        renderCramPlaylist(enrolled);
      }
    }
  }
  function renderCramPlaylist(course) {
    var pool = (typeof GAMES !== "undefined" ? GAMES : []).filter(function (g) { return g.course === course; });
    if (!pool.length) {
      document.getElementById("cramPlaylist").innerHTML =
        '<div style="padding:14px;color:var(--muted);text-align:center;">No games for that course yet.</div>';
      return;
    }
    // Try to chain 4 different game-types for variety
    var byType = {};
    pool.forEach(function (g) {
      var t = (g.gameType || "Other").toLowerCase();
      byType[t] = byType[t] || [];
      byType[t].push(g);
    });
    var types = Object.keys(byType);
    // Prefer order: sprint → unit jeopardy → boss rush → cumulative/practice
    var preferOrder = ["sprint", "unit", "jeopardy", "boss", "cumulative", "practice", "gauntlet"];
    var picks = [];
    preferOrder.forEach(function (key) {
      types.forEach(function (t) {
        if (picks.length >= 4) return;
        if (t.indexOf(key) >= 0 && byType[t].length) {
          picks.push(byType[t].shift());
          delete byType[t];
        }
      });
    });
    while (picks.length < 4 && pool.length) {
      var any = pool.find(function (g) { return picks.indexOf(g) === -1; });
      if (!any) break;
      picks.push(any);
    }
    var listEl = document.getElementById("cramPlaylist");
    listEl.innerHTML = picks.map(function (g, i) {
      return '<a class="cram-step" data-id="' + safeHTML(g.id) + '" role="button" tabindex="0">' +
        '<span class="cs-num">' + (i + 1) + '</span>' +
        '<span class="cs-title">' + safeHTML(g.title) +
          '<span class="cs-meta">' + safeHTML(g.gameType || "") + (g.day ? ' · ' + safeHTML(g.day) : '') + '</span>' +
        '</span>' +
        '<span class="cs-arrow">→</span>' +
      '</a>';
    }).join("");
    Array.prototype.forEach.call(listEl.querySelectorAll(".cram-step"), function (step) {
      step.addEventListener("click", function () {
        var id = step.dataset.id;
        var match = (typeof GAMES !== "undefined" ? GAMES : []).find(function (g) { return g.id === id; });
        if (match && typeof openGame === "function") { closeModal(); openGame(match); }
      });
    });
    P.recordCramRun({ course: course, picks: picks.map(function (g) { return g.id; }) });
  }

  // ---- Mock Exam ----
  // Full-length, timed, scored MCQ simulation. Pulls from the same
  // DIAG_BANK_BY_COURSE pool as the diagnostic, but draws N questions
  // (10/20/30) from the chosen course (alias-aware) and runs a single
  // timer for the whole session. Each answered question still flows
  // through P.recordAnswer so topic stats + wrong-queue + the
  // first-correct achievement keep updating normally.
  //
  // State lives entirely inside a closure created by startMockExam(opts)
  // — every new attempt allocates fresh state, so re-takes don't
  // inherit the previous run's idx, results, or timer.
  var mockTimerHandle = null;
  function clearMockTimer() {
    if (mockTimerHandle) {
      try { clearInterval(mockTimerHandle); } catch (e) {}
      mockTimerHandle = null;
    }
  }

  function mockShuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function mockPoolForCourse(courseName) {
    if (!courseName) return [];
    if (DIAG_BANK_BY_COURSE[courseName]) {
      return DIAG_BANK_BY_COURSE[courseName].map(function (q) {
        return Object.assign({ course: courseName }, q);
      });
    }
    var aliasList = COURSE_BANK_ALIASES[courseName];
    if (!aliasList) return [];
    var combined = [];
    aliasList.forEach(function (aliasCourse) {
      if (!DIAG_BANK_BY_COURSE[aliasCourse]) return;
      DIAG_BANK_BY_COURSE[aliasCourse].forEach(function (q) {
        combined.push(Object.assign({ course: aliasCourse }, q));
      });
    });
    return combined;
  }

  function formatMMSS(ms) {
    if (ms < 0) ms = 0;
    var totalSec = Math.ceil(ms / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function showMockExamSetup() {
    // Reset any leftover timer from a previously interrupted attempt.
    clearMockTimer();
    var courseKeys = Object.keys(DIAG_BANK_BY_COURSE);
    // Include alias courses (e.g. AP Macro/Micro Combined) too, so
    // students enrolled there can still launch a mock exam.
    Object.keys(COURSE_BANK_ALIASES).forEach(function (aliasName) {
      if (courseKeys.indexOf(aliasName) === -1) courseKeys.push(aliasName);
    });
    courseKeys.sort();
    var enrolled = (P && P.getCourse) ? P.getCourse() : "";
    var defaultCourse = (enrolled && courseKeys.indexOf(enrolled) !== -1) ? enrolled : courseKeys[0];
    var courseOptions = courseKeys.map(function (c) {
      var sel = (c === defaultCourse) ? ' selected' : '';
      return '<option value="' + safeHTML(c) + '"' + sel + '>' + safeHTML(c) + '</option>';
    }).join("");

    var html =
      '<div class="mock-setup">' +
        '<div class="ms-row">' +
          '<span class="ms-label">Course</span>' +
          '<select class="ms-course" id="mockCourse">' + courseOptions + '</select>' +
        '</div>' +
        '<div class="ms-row">' +
          '<span class="ms-label">Question count</span>' +
          '<div class="ms-pills" id="mockCount">' +
            '<button class="ms-pill" data-val="10" type="button">10</button>' +
            '<button class="ms-pill is-active" data-val="20" type="button">20</button>' +
            '<button class="ms-pill" data-val="30" type="button">30</button>' +
          '</div>' +
        '</div>' +
        '<div class="ms-row">' +
          '<span class="ms-label">Timed</span>' +
          '<div class="ms-pills" id="mockTimed">' +
            '<button class="ms-pill" data-val="off" type="button">Off</button>' +
            '<button class="ms-pill is-active" data-val="on" type="button">On</button>' +
          '</div>' +
        '</div>' +
        '<div class="ms-row" id="mockLimitRow">' +
          '<span class="ms-label">Time limit</span>' +
          '<div class="ms-pills" id="mockLimit">' +
            '<button class="ms-pill" data-val="15" type="button">15 min</button>' +
            '<button class="ms-pill is-active" data-val="30" type="button">30 min</button>' +
            '<button class="ms-pill" data-val="45" type="button">45 min</button>' +
            '<button class="ms-pill" data-val="60" type="button">60 min</button>' +
          '</div>' +
          '<span class="ms-help">~1.5 min/question. Auto-submits when the clock hits zero.</span>' +
        '</div>' +
        '<button class="ms-start" id="mockStart" type="button">Start exam</button>' +
      '</div>';
    openModal("Mock Exam — set up your run", html);

    var countGroup = document.getElementById("mockCount");
    var timedGroup = document.getElementById("mockTimed");
    var limitGroup = document.getElementById("mockLimit");
    var limitRow = document.getElementById("mockLimitRow");

    function wirePills(group) {
      Array.prototype.forEach.call(group.querySelectorAll(".ms-pill"), function (b) {
        b.addEventListener("click", function () {
          group.querySelectorAll(".ms-pill").forEach(function (x) { x.classList.remove("is-active"); });
          b.classList.add("is-active");
          // Adapt the default time limit to the chosen question count
          // (1.5 min/q): 10 → 15, 20 → 30, 30 → 45.
          if (group === countGroup) {
            var n = Number(b.dataset.val);
            var defaultLimit = n === 10 ? "15" : n === 30 ? "45" : "30";
            limitGroup.querySelectorAll(".ms-pill").forEach(function (x) {
              x.classList.toggle("is-active", x.dataset.val === defaultLimit);
            });
          }
          // Toggle the time-limit row when Timed=Off
          if (group === timedGroup) {
            limitRow.style.display = (b.dataset.val === "on") ? "" : "none";
          }
        });
      });
    }
    wirePills(countGroup);
    wirePills(timedGroup);
    wirePills(limitGroup);

    var startBtn = document.getElementById("mockStart");
    if (startBtn) {
      startBtn.addEventListener("click", function () {
        var course = document.getElementById("mockCourse").value;
        var countPill = countGroup.querySelector(".ms-pill.is-active");
        var timedPill = timedGroup.querySelector(".ms-pill.is-active");
        var limitPill = limitGroup.querySelector(".ms-pill.is-active");
        var count = countPill ? Number(countPill.dataset.val) : 20;
        var timed = timedPill ? timedPill.dataset.val === "on" : true;
        var limitMin = limitPill ? Number(limitPill.dataset.val) : 30;
        startMockExam({ course: course, count: count, timed: timed, limitMs: limitMin * 60 * 1000 });
      });
    }
  }

  function startMockExam(opts) {
    opts = opts || {};
    // Always wipe any prior timer before allocating fresh state. This
    // guarantees re-takes start clean even if a previous attempt was
    // closed mid-question.
    clearMockTimer();

    var course = opts.course || "";
    var pool = mockPoolForCourse(course);
    if (!pool.length) {
      openModal("Mock Exam", '<p style="color:var(--muted);padding:18px 0;text-align:center;">No questions available for that course yet.</p>');
      return;
    }
    var requested = Math.max(1, Number(opts.count) || 20);
    var sessionQs = mockShuffle(pool).slice(0, Math.min(requested, pool.length));
    var total = sessionQs.length;
    var timed = !!opts.timed;
    var limitMs = Math.max(60 * 1000, Number(opts.limitMs) || 30 * 60 * 1000);

    // Per-attempt state — closure-scoped so re-takes never inherit it.
    var idx = 0;
    var results = []; // [{course, set, correct, prompt, chosenText, correctText, skipped}]
    var startedAt = Date.now();
    var deadlineAt = startedAt + limitMs;
    var endedAt = 0;
    var timedOut = false;
    var finished = false;
    var currentChoices = [];
    var currentCorrectIdx = -1;
    var currentPickIdx = -1;
    var feedbackUntil = 0;

    function shuffleChoices(q) {
      var arr = mockShuffle(q.choices);
      var idxOfCorrect = arr.indexOf(q.correctText);
      if (idxOfCorrect < 0) idxOfCorrect = 0;
      return { order: arr, correctIdx: idxOfCorrect };
    }

    function tickTimer() {
      var el = document.getElementById("mockTimer");
      if (!el) return;
      if (finished) return;
      var remaining = deadlineAt - Date.now();
      if (remaining <= 0) {
        el.textContent = "00:00";
        el.classList.add("is-low");
        clearMockTimer();
        timedOut = true;
        finishExam();
        return;
      }
      el.textContent = formatMMSS(remaining);
      if (remaining < 60 * 1000) el.classList.add("is-low");
      else el.classList.remove("is-low");
    }

    function renderQ() {
      if (idx >= total) return finishExam();
      var q = sessionQs[idx];
      var sh = shuffleChoices(q);
      currentChoices = sh.order;
      currentCorrectIdx = sh.correctIdx;
      currentPickIdx = -1;
      feedbackUntil = 0;
      var pct = Math.round((idx / total) * 100);
      var hudRight = timed
        ? '<span class="mh-timer" id="mockTimer">' + formatMMSS(deadlineAt - Date.now()) + '</span>'
        : '<span class="mh-label">Untimed</span>';
      var inv = (P.getInventory ? P.getInventory() : { hintTokens: 0, timeBoosts: 0 });
      var hintTokens = inv.hintTokens || 0;
      var timeBoosts = inv.timeBoosts || 0;
      var hintUsedThisQ = false;
      var html =
        '<div class="mock-hud">' +
          '<span class="mh-label">Question ' + (idx + 1) + ' / ' + total + '</span>' +
          hudRight +
        '</div>' +
        '<div class="diag-progress"><span class="diag-progress-fill" style="width:' + pct + '%"></span></div>' +
        '<div class="diag-meta">' + safeHTML(q.course) + ' · ' + safeHTML(q.set) + '</div>' +
        '<p class="diag-stem">' + safeHTML(q.prompt) + ' <button class="read-aloud-btn" type="button" aria-label="Read prompt aloud" aria-pressed="false" data-text="' + safeHTML(q.prompt) + '">🔊</button></p>' +
        ((hintTokens > 0 || (timed && timeBoosts > 0))
          ? '<div class="quiz-hint-bar">' +
              '<span class="qh-meta">Power-ups</span>' +
              '<span style="display:inline-flex;gap:6px;flex-wrap:wrap;">' +
                (hintTokens > 0 ? '<button class="quiz-hint-btn" id="mockHint" type="button">💡 Hint <span class="qh-count">' + hintTokens + '</span></button>' : '') +
                (timed && timeBoosts > 0 ? '<button class="quiz-hint-btn" id="mockTimeBoost" type="button" style="border-color:rgba(122,240,255,.55);color:#7af0ff;background:linear-gradient(135deg,rgba(122,240,255,.18),rgba(184,146,255,.08));">⏱ +30s <span class="qh-count">' + timeBoosts + '</span></button>' : '') +
              '</span>' +
            '</div>'
          : '') +
        '<div class="diag-choices">' +
          currentChoices.map(function (c, i) {
            return '<button class="diag-choice" data-i="' + i + '" type="button">' + safeHTML(c) + '</button>';
          }).join("") +
        '</div>' +
        '<button class="mock-submit" id="mockSubmit" type="button" disabled>Submit answer</button>' +
        '<div class="mock-skip"><button id="mockSkip" type="button">Skip / flag for review →</button></div>';
      openModal("Mock Exam — " + safeHTML(course), html);
      // Wire mock-exam hint button
      var mockHintBtn = document.getElementById("mockHint");
      if (mockHintBtn) mockHintBtn.addEventListener("click", function () {
        if (hintUsedThisQ) return;
        var wrongIdxs = [];
        for (var ci = 0; ci < currentChoices.length; ci++) {
          if (ci !== currentCorrectIdx) wrongIdxs.push(ci);
        }
        if (!wrongIdxs.length) return;
        var pickIdx = wrongIdxs[Math.floor(Math.random() * wrongIdxs.length)];
        var elBtn = rmBody.querySelector('.diag-choice[data-i="' + pickIdx + '"]');
        if (elBtn) {
          elBtn.classList.add("is-eliminated");
          elBtn.disabled = true;
        }
        hintUsedThisQ = true;
        if (P.consumeItem) P.consumeItem("hintTokens");
        mockHintBtn.disabled = true;
        mockHintBtn.textContent = "✓ used";
      });
      // Wire time-boost button (extends deadlineAt by 30 seconds)
      var mockTimeBoostBtn = document.getElementById("mockTimeBoost");
      if (mockTimeBoostBtn) mockTimeBoostBtn.addEventListener("click", function () {
        if (!timed) return;
        deadlineAt += 30 * 1000;
        if (P.consumeItem) P.consumeItem("timeBoosts");
        mockTimeBoostBtn.disabled = true;
        mockTimeBoostBtn.textContent = "✓ +30s";
        // Force-tick so the visible timer jumps immediately
        var t = document.getElementById("mockTimer");
        if (t) {
          t.textContent = formatMMSS(deadlineAt - Date.now());
          t.classList.remove("is-low");
        }
      });

      Array.prototype.forEach.call(rmBody.querySelectorAll(".diag-choice"), function (btn) {
        btn.addEventListener("click", function () {
          if (Date.now() < feedbackUntil) return; // ignore clicks during feedback window
          currentPickIdx = Number(btn.dataset.i);
          rmBody.querySelectorAll(".diag-choice").forEach(function (b) {
            b.classList.remove("is-correct");
            b.classList.remove("is-wrong");
          });
          btn.classList.add("is-correct");
          // Tint as a "tentative pick" — reuse the green hover until
          // submission. The actual grading pass below replaces it
          // with the real correct/wrong tint.
          var submitBtn = document.getElementById("mockSubmit");
          if (submitBtn) submitBtn.disabled = false;
        });
      });

      var submitBtn = document.getElementById("mockSubmit");
      if (submitBtn) submitBtn.addEventListener("click", function () { commitAnswer(false); });
      var skipBtn = document.getElementById("mockSkip");
      if (skipBtn) skipBtn.addEventListener("click", function () { commitAnswer(true); });
    }

    function commitAnswer(isSkip) {
      if (Date.now() < feedbackUntil) return;
      var q = sessionQs[idx];
      var pickIdx = isSkip ? -1 : currentPickIdx;
      var correct = !isSkip && pickIdx === currentCorrectIdx;
      var chosenText = (pickIdx >= 0 && pickIdx < currentChoices.length) ? currentChoices[pickIdx] : "";
      results.push({
        id: q.id,
        course: q.course,
        set: q.set,
        correct: correct,
        prompt: q.prompt,
        chosenText: chosenText,
        correctText: q.correctText,
        skipped: !!isSkip
      });
      // Topic stats + wrong-queue + first-correct achievement run
      // through the standard recordAnswer pipeline. Skips count as
      // wrong (so they enter the wrong-queue for retrieval drilling),
      // matching how a Regents skip costs the same as a wrong.
      try {
        P.recordAnswer({
          course: q.course,
          set: q.set,
          correct: correct,
          prompt: q.prompt,
          answer: q.correctText,
          gameId: "mock-exam"
        });
      } catch (e) {}
      // Visual feedback
      rmBody.querySelectorAll(".diag-choice").forEach(function (b) {
        b.classList.remove("is-correct");
        b.classList.remove("is-wrong");
        var bi = Number(b.dataset.i);
        if (bi === currentCorrectIdx) b.classList.add("is-correct");
        else if (!isSkip && bi === pickIdx && !correct) b.classList.add("is-wrong");
        b.disabled = true;
      });
      var submitBtn = document.getElementById("mockSubmit");
      if (submitBtn) submitBtn.disabled = true;
      var fb = document.createElement("div");
      fb.className = "mock-feedback " + (correct ? "is-correct" : "is-wrong");
      fb.textContent = isSkip
        ? "Skipped — correct answer: " + q.correctText
        : (correct ? "Correct." : "Not quite — correct answer: " + q.correctText);
      var submitParent = submitBtn && submitBtn.parentNode ? submitBtn.parentNode : rmBody;
      submitParent.insertBefore(fb, submitBtn);
      // Inject the explanation reveal beneath the feedback. Keeps the
      // student in the loop on WHY the right answer is right rather
      // than just signalling correct/wrong.
      if (q.explanation) {
        var expEl = document.createElement("div");
        expEl.className = "diag-explanation";
        expEl.dataset.tone = correct ? "correct" : "wrong";
        expEl.innerHTML =
          '<div class="diag-explanation-label">Why?</div>' +
          '<p class="diag-explanation-body">' + safeHTML(q.explanation) + '</p>';
        submitParent.insertBefore(expEl, submitBtn);
      }
      feedbackUntil = Date.now() + (q.explanation ? 2400 : 1200);
      setTimeout(function () {
        if (finished) return;
        idx++;
        renderQ();
      }, q.explanation ? 2400 : 1200);
    }

    function finishExam() {
      if (finished) return;
      finished = true;
      clearMockTimer();
      endedAt = Date.now();
      var correctCount = results.filter(function (r) { return r.correct; }).length;
      var skippedCount = results.filter(function (r) { return r.skipped; }).length;
      var answered = results.length;
      // Per-unit accuracy across the questions actually shown
      var unitMap = {};
      results.forEach(function (r) {
        var key = r.course + "::" + r.set;
        var u = unitMap[key] = unitMap[key] || { course: r.course, set: r.set, correct: 0, total: 0 };
        u.total++;
        if (r.correct) u.correct++;
      });
      var unitRows = Object.keys(unitMap).map(function (k) { return unitMap[k]; })
        .sort(function (a, b) {
          var aPct = a.total ? a.correct / a.total : 0;
          var bPct = b.total ? b.correct / b.total : 0;
          if (aPct !== bPct) return aPct - bPct; // weakest first
          return a.set.localeCompare(b.set);
        });
      var weakUnits = unitRows.filter(function (u) {
        return u.total > 0 && (u.correct / u.total) < 0.7;
      }).slice(0, 3);

      // Shard reward: 50 base for completing + 5 per correct
      var shardAward = (answered ? 50 : 0) + correctCount * 5;
      try { if (shardAward > 0) P.addShards(shardAward, "mock-exam"); } catch (e) {}

      var durationMs = endedAt - startedAt;
      try {
        P.recordMockExam({
          course: course,
          total: total,
          correct: correctCount,
          count: answered,
          durationMs: durationMs,
          takenAt: endedAt,
          weakUnits: weakUnits.map(function (u) { return { course: u.course, set: u.set, correct: u.correct, total: u.total }; })
        });
      } catch (e) {}

      var pct = total ? Math.round((correctCount / total) * 100) : 0;
      var unitHTML = unitRows.map(function (u) {
        var p = u.total ? Math.round((u.correct / u.total) * 100) : 0;
        return '<div class="mr-unit-row">' +
          '<span class="u-name">' + safeHTML(u.set) + '</span>' +
          '<span class="u-score">' + u.correct + '/' + u.total + ' · ' + p + '%</span>' +
        '</div>';
      }).join("");

      var weakHTML = "";
      if (weakUnits.length) {
        weakHTML += '<div class="mr-section-head">Drill these ' + weakUnits.length + ' unit' + (weakUnits.length === 1 ? '' : 's') + ' →</div>';
        weakUnits.forEach(function (u) {
          var p = u.total ? Math.round((u.correct / u.total) * 100) : 0;
          weakHTML += '<button class="mr-weak" type="button" data-course="' + safeHTML(u.course) + '" data-set="' + safeHTML(u.set) + '">' +
            '<strong>' + safeHTML(u.set) + '</strong>' +
            '<span>' + safeHTML(u.course) + ' · ' + u.correct + '/' + u.total + ' · ' + p + '% · tap to drill</span>' +
          '</button>';
        });
      }

      var minutes = Math.floor(durationMs / 60000);
      var seconds = Math.floor((durationMs % 60000) / 1000);
      var timeLine = (timedOut ? "Out of time · " : "") + minutes + "m " + (seconds < 10 ? "0" : "") + seconds + "s";
      var skippedLine = skippedCount ? skippedCount + " skipped · " : "";

      var summaryHTML =
        '<div class="mock-report">' +
          '<div class="mr-score">' +
            '<div class="big">' + correctCount + ' / ' + total + '</div>' +
            '<div class="pct">' + pct + '% correct</div>' +
            '<div class="meta">' + skippedLine + timeLine +
              (shardAward > 0 ? ' · earned <strong style="color:#f5c451">+' + shardAward + ' shards</strong>' : '') +
            '</div>' +
          '</div>' +
          (unitRows.length ? '<div><div class="mr-section-head">Course breakdown</div>' + unitHTML + '</div>' : '') +
          (weakHTML ? '<div>' + weakHTML + '</div>' : '') +
          '<div class="mr-actions">' +
            '<button class="mr-again" id="mockAgain" type="button">Take another</button>' +
            '<button class="mr-done" id="mockDone" type="button">Done</button>' +
          '</div>' +
        '</div>';
      openModal("Mock Exam — results", summaryHTML);

      Array.prototype.forEach.call(rmBody.querySelectorAll(".mr-weak"), function (btn) {
        btn.addEventListener("click", function () {
          startTopicDrill(btn.dataset.course, btn.dataset.set);
        });
      });
      var again = document.getElementById("mockAgain");
      var done = document.getElementById("mockDone");
      if (again) again.addEventListener("click", function () { showMockExamSetup(); });
      if (done) done.addEventListener("click", function () { closeModal(); updateRoutingSubs(); });
    }

    if (timed) {
      mockTimerHandle = setInterval(tickTimer, 250);
    }
    renderQ();
  }

  // Cancel any active mock-exam timer if the modal is dismissed
  // mid-attempt (Esc, backdrop click, close button). Otherwise the
  // countdown would keep ticking and could auto-submit a hidden run.
  // We only clear on Escape when the modal is actually open, so
  // pressing Escape elsewhere on the page is a no-op for the timer.
  if (rmClose) rmClose.addEventListener("click", clearMockTimer);
  if (rmBackdrop) rmBackdrop.addEventListener("click", clearMockTimer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hidden) clearMockTimer();
  });

  // ---- Wire the routing card buttons ----
  function updateRoutingSubs() {
    var queue = P.getWrongQueue(80);
    var subQ = document.getElementById("rcWrongSub");
    if (subQ) subQ.textContent = queue.length + " in queue";
    var d = P.getDiagnostic();
    var subD = document.getElementById("rcDiagSub");
    if (subD) {
      if (d && d.takenAt) {
        var days = Math.floor((Date.now() - d.takenAt) / 86400000);
        subD.textContent = days === 0 ? "Taken today · re-take" : "Taken " + days + "d ago · re-take";
      } else {
        subD.textContent = "8 questions, ~2 minutes";
      }
    }
    var stats = P.getTopicStats();
    var topicCount = 0;
    Object.keys(stats).forEach(function (c) { topicCount += Object.keys(stats[c] || {}).length; });
    var subM = document.getElementById("rcMasterySub");
    if (subM) subM.textContent = topicCount ? topicCount + " topics tracked" : "Track every unit";
    var subC = document.getElementById("rcCramSub");
    if (subC) {
      var hist = P.getCramHistory();
      subC.textContent = hist.length ? hist.length + " runs · build another" : "Chain 4 games on a unit";
    }
    var subMx = document.getElementById("rcMockExamSub");
    if (subMx && P.getMockExamHistory) {
      var mxHist = P.getMockExamHistory(1);
      if (mxHist && mxHist.length) {
        var last = mxHist[0];
        var lastPct = last.total ? Math.round((last.correct / last.total) * 100) : 0;
        subMx.textContent = "Last: " + last.correct + "/" + last.total + " · " + lastPct + "%";
      } else {
        subMx.textContent = "Full-length timed run";
      }
    }
  }
  updateRoutingSubs();
  P.on("profile:update", updateRoutingSubs);
  P.on("answer:record", updateRoutingSubs);

  whenGamesReady().then(function () {
    var diagBtn = document.getElementById("rcDiagnostic");
    var masteryBtn = document.getElementById("rcMastery");
    var wqBtn = document.getElementById("rcWrongQueue");
    var cramBtn = document.getElementById("rcCram");
    var mockBtn = document.getElementById("rcMockExam");
    if (diagBtn) diagBtn.addEventListener("click", startDiagnostic);
    if (masteryBtn) masteryBtn.addEventListener("click", showMastery);
    if (wqBtn) wqBtn.addEventListener("click", showWrongQueue);
    if (cramBtn) cramBtn.addEventListener("click", showCramForm);
    if (mockBtn) mockBtn.addEventListener("click", showMockExamSetup);
  });
})();

// ============================================================================
// FUN LAYER — daily fortunes, easter eggs, hidden achievements
// ============================================================================
(function () {
  if (!window.MrMacsProfile) return;
  var P = window.MrMacsProfile;

  // ---- Daily fortunes (50+ social-studies-flavored motivational lines) ----
  var FORTUNES = [
    "The Erie Canal believes in you today.",
    "FDR would be proud of this work ethic.",
    "Even Napoleon had Mondays. Keep going.",
    "The Magna Carta took 800 years to land. Your test is one day.",
    "Caesar studied harder. Look how he turned out.",
    "Lincoln read by candlelight. You have AI tutors. Use them.",
    "Manifest your destiny — by reviewing Westward Expansion.",
    "Confucius say: practice multiple choice make wisdom.",
    "If Rome wasn't built in a day, neither is your study streak.",
    "Hannibal crossed the Alps. You can finish this Jeopardy round.",
    "The Mongols conquered Eurasia without a calculator. No excuses.",
    "Maslow's hierarchy starts with: pass the Regents.",
    "Pavlov's dogs studied. So can you. Drool optional.",
    "Plato thought. So should you. About the Berlin Conference.",
    "Marie Curie won two Nobel Prizes. You can win this drill.",
    "Genghis Khan had 16 million descendants. You have 16 questions.",
    "The Berlin Wall fell in 1989. Your weak topics will too.",
    "Aristotle: 'We are what we repeatedly do.' So drill more.",
    "If Muhammad can climb a mountain, you can climb this study session.",
    "Peace summits last years. Your diagnostic takes two minutes.",
    "Hammurabi wrote his code in stone. You can rewrite yours.",
    "The Silk Road took years. Your Cram playlist? Twenty minutes.",
    "Socrates: 'I know that I know nothing.' Then he wasn't ready for Regents.",
    "Joan of Arc was 19. She did okay.",
    "Spartans trained at age 7. You're already ahead.",
    "The Renaissance was a vibe. Be Renaissance about your test.",
    "Catherine the Great earned her name. Earn yours.",
    "Tubman never lost a passenger. Don't lose a streak day.",
    "Mansa Musa was the richest person ever. Stack your shards.",
    "The Iroquois Confederacy out-democracied Europe. Take notes.",
    "Sun Tzu: 'Know your enemy.' Today the enemy is the AP rubric.",
    "Frederick Douglass taught himself to read. Imagine what you can do.",
    "Galileo got house arrest for being right. You only need to be right enough.",
    "Cleopatra spoke 9 languages. You only need to read 4 choices.",
    "Suffragists waited 72 years for the vote. Be patient with this unit.",
    "The Greeks invented the marathon. You can survive Boss Rush.",
    "Stoicism says: focus on what you control. Like answering this question.",
    "Mendel counted 28,000 pea plants. You only need to count to 100%.",
    "Tesla slept 2 hours a night. Don't be Tesla. Sleep first, drill second.",
    "The Founding Fathers were nervous too. Then they signed.",
    "Constantinople fell in 1453. Don't fall for the wrong choice.",
    "Cyrus respected enemies. Respect this question.",
    "Akhenaten changed religion overnight. You can change one wrong answer.",
    "Eleanor of Aquitaine ran two kingdoms. You're running one drill.",
    "The Maya predicted eclipses without telescopes. You have games.",
    "Cousteau explored the ocean. Explore your Mastery Map.",
    "Florence Nightingale invented stats for nursing. Stats are friends.",
    "Pythagoras had cult vibes about numbers. You can have cult vibes about answers.",
    "The Aztecs played ball with their hips. Your fingers will be fine.",
    "Kublai Khan ruled the largest empire ever. You can rule one unit.",
    "Beethoven kept composing while deaf. Keep drilling while tired.",
    "Aesop wrote in 600 BC. His morals still slap.",
    "Queen Liliʻuokalani fought annexation with poetry. Use what you've got.",
    "The Library of Alexandria burned. Save your work.",
    "Plato wrote 'The Republic.' You wrote a CRQ. Equal energy.",
    "Maya Angelou taught herself 6 languages. Self-teaching is canon.",
    "Ibn Battuta walked 75,000 miles. You only need to walk through this list.",
    "Charlemagne couldn't read until adulthood. Then he ran Europe.",
    "Catherine of Aragon held her ground. So can you.",
    "Anne Frank kept writing. Always keep writing.",
    "Susan B. Anthony got arrested for voting. Voting matters.",
    // ── May 2026 flagship-themed fortunes ──
    "Brickoria says: every wall has a brick that breaks first.",
    "Stellar Drift: even Voyager 1 had to refuel. Stretch first.",
    "Source Snake says: read the document before you bite.",
    "Chronoblocks falls fast. So do bad study habits — let them go.",
    "Cascade is a chain reaction. So is steady practice.",
    "Chronohop: when the river moves, ride the log.",
    "Step Pyramid says: every cube takes a hop. Start hopping.",
    "The Misconception Mothership is bigger than your fear of failing.",
    "Coily chases. You hop. The discs are always there if you need them.",
    "Lured Coily off the pyramid? You can lure procrastination off your weekend.",
    "A scholar gem only appears when you're paying attention.",
    "Whacking a verified fact costs you. So does ignoring real evidence.",
    "Cascades reward setup. So does flashcard rotation.",
    "Tetris taught a generation about gravity. Newton came first.",
    "A bubble cluster is just thesis statements that finally agree.",
    "The maze-cabinet music plays for everyone. Press Start.",
    "Pinball-cabinet wisdom: tilt is a state of mind.",
    "Empire-strategic synth: every empire fell on a Tuesday.",
    "Runner-synthwave knows: the road is always the same. You change.",
    "Power-ups are temporary. Your study habits are forever.",
    "Lucky Charm doubles shards. Showing up doubles outcomes.",
    "Coin Doubler stacks with Lucky Charm. Skills stack with practice.",
    "Streak Shield saves you once. Daily reps save you always.",
    "Daily Double waits in your inventory. Today is its day.",
    "Hint Tokens never run out — at least, not the metaphorical ones.",
    "A scholar prompt is a free shard. So is rereading the question.",
    "192 cabinets in this arcade. One you haven't tried yet.",
    "The cabinet is dark. Press Start anyway.",
    "Press Esc to pause. Press Space to begin again.",
    "Mr. Mac's Arcade was built one game at a time. Like everything good."
  ];

  function pickFortune(profile) {
    // Deterministic per UTC day per profile so the fortune doesn't
    // change on every render — but rotates daily.
    var seedStr = (profile.name || "trainer") + "|" + new Date().toISOString().slice(0, 10);
    var hash = 0;
    for (var i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash + seedStr.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % FORTUNES.length;
  }
  function renderFortune(forceRandom) {
    var body = document.getElementById("fortuneBody");
    if (!body) return;
    var profile = P.get();
    var idx;
    if (forceRandom) {
      idx = Math.floor(Math.random() * FORTUNES.length);
    } else {
      idx = pickFortune(profile);
    }
    body.textContent = FORTUNES[idx];
    // Track unique fortunes seen — once 30 distinct, unlock Fortune Seeker
    try {
      var seen = JSON.parse(localStorage.getItem("mr-macs-arcade-fortunes-seen") || "[]");
      if (seen.indexOf(idx) === -1) seen.push(idx);
      localStorage.setItem("mr-macs-arcade-fortunes-seen", JSON.stringify(seen));
      if (seen.length >= 30) P.unlock("fortune-seeker");
    } catch (e) {}
  }
  var fortuneCard = document.getElementById("fortuneCard");
  if (fortuneCard) {
    renderFortune(false);
    fortuneCard.addEventListener("click", function () {
      // Always reroll on click — but if the player owns a Fortune Refresh
      // token, consume one to log it as an "intentional" reroll. Free
      // rerolls don't deplete inventory.
      var hasToken = false;
      if (window.MrMacsProfile && window.MrMacsProfile.getInventory) {
        hasToken = (window.MrMacsProfile.getInventory().fortuneRefresh || 0) > 0;
      }
      renderFortune(true);
      if (hasToken && window.MrMacsProfile && window.MrMacsProfile.consumeItem) {
        window.MrMacsProfile.consumeItem("fortuneRefresh");
        if (window.MrMacsToast) {
          window.MrMacsToast.push({
            icon: "sparkles",
            title: "🔮 Fortune rerolled",
            sub: "1 refresh token consumed · keep pulling for more wisdom",
            tone: "default",
            ms: 3200
          });
        }
      }
    });
  }

  // ---- Read-aloud helper (Web Speech API) ----
  // Document-level click handler powers every .read-aloud-btn that
  // gets injected next to a question prompt. No external libs — uses
  // the browser's native speechSynthesis. Toggle on/off, with auto-
  // cancel when the modal closes, the user changes question, or
  // they press Escape. Browsers without the API silently disable
  // the button.
  var raCurrentBtn = null;
  function raStop() {
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    if (raCurrentBtn) raCurrentBtn.setAttribute("aria-pressed", "false");
    raCurrentBtn = null;
  }
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest(".read-aloud-btn");
    if (!btn) return;
    e.preventDefault();
    if (typeof window.speechSynthesis === "undefined") {
      btn.disabled = true;
      btn.title = "Your browser doesn't support read-aloud.";
      return;
    }
    if (raCurrentBtn === btn) {
      raStop();
      return;
    }
    raStop();
    var text = btn.dataset.text || "";
    if (!text && btn.parentNode) {
      text = (btn.parentNode.textContent || "").replace(/🔊/g, "").trim();
    }
    if (!text) return;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1;
      u.volume = 1;
      u.onend = function () {
        if (raCurrentBtn === btn) raStop();
      };
      u.onerror = u.onend;
      raCurrentBtn = btn;
      btn.setAttribute("aria-pressed", "true");
      window.speechSynthesis.speak(u);
    } catch (err) { raStop(); }
  });
  // Stop on Escape or modal-close clicks
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") raStop();
  });
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.id) return;
    if (t.id === "rmClose" || t.id === "rmBackdrop") raStop();
  });

  // ---- Konami code easter egg ----
  // Up Up Down Down Left Right Left Right B A → confetti rain + Code Master
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
                "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var konamiBuffer = [];
  document.addEventListener("keydown", function (e) {
    var key = e.key === "B" ? "b" : (e.key === "A" ? "a" : e.key);
    konamiBuffer.push(key);
    if (konamiBuffer.length > KONAMI.length) konamiBuffer.shift();
    var matched = konamiBuffer.length === KONAMI.length &&
      konamiBuffer.every(function (k, i) { return k === KONAMI[i]; });
    if (matched) {
      konamiBuffer = [];
      // Big celebration burst from center of screen
      try {
        if (window.MrMacsCelebration) {
          window.MrMacsCelebration.burst({
            x: window.innerWidth / 2,
            y: window.innerHeight / 3,
            count: 80,
            palette: ["#ff7cc8", "#7af0ff", "#f5c451", "#69f0aa", "#b892ff", "#ff8e6f"],
            life: 1.8,
            vScale: 1.2
          });
        }
      } catch (err) {}
      // Toast
      try {
        if (window.MrMacsToast) {
          window.MrMacsToast.push({
            icon: "controller",
            title: "↑↑↓↓←→←→BA",
            sub: "you found the secret. +200 shards",
            tone: "achievement",
            ms: 6000
          });
        }
      } catch (err) {}
      try { P.unlock("code-master"); } catch (err) {}
      try { P.addShards(200, "konami-code"); } catch (err) {}
    }
  });

  // ---- Brand-mark 7-clicks-in-5-seconds easter egg ----
  // Click Whisperer achievement
  var brandClickTimes = [];
  document.querySelectorAll(".brand-mark").forEach(function (el) {
    el.addEventListener("click", function (e) {
      // Don't interfere with the brand link's normal behavior — just count
      var now = Date.now();
      brandClickTimes = brandClickTimes.filter(function (t) { return now - t < 5000; });
      brandClickTimes.push(now);
      if (brandClickTimes.length >= 7) {
        brandClickTimes = [];
        try {
          if (window.MrMacsCelebration) {
            var rect = el.getBoundingClientRect();
            window.MrMacsCelebration.burst({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
              count: 32,
              palette: ["#f5c451", "#ffd884", "#7af0ff"],
              life: 1.4
            });
          }
        } catch (err) {}
        try {
          if (window.MrMacsToast) {
            window.MrMacsToast.push({
              icon: "sparkles",
              title: "Click Whisperer",
              sub: "you found the brand-click secret. +75 shards",
              tone: "achievement",
              ms: 5000
            });
          }
        } catch (err) {}
        try { P.unlock("click-whisperer"); } catch (err) {}
        try { P.addShards(75, "brand-clicks"); } catch (err) {}
      }
    });
  });
})();
