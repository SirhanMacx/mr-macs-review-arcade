#!/usr/bin/env node
/**
 * build-public-exam-library.mjs
 *
 * Builds data/public-exam-library.json — a curated list of REAL, publicly-
 * available past-exam PDFs from NYSED Regents (nysedregents.org) and the
 * College Board AP program (apcentral.collegeboard.org).
 *
 * Design:
 *   - We DO NOT host or download any PDFs locally; we LINK to the official
 *     source URLs only.
 *   - For NYSED: the URL convention is
 *       https://www.nysedregents.org/<SubjectSlug>/<MMYY>/<filebase>.<ext>
 *     where <filebase> varies per subject (chem-12026-exam.pdf vs
 *     chem82024-exam.pdf vs phys62025-exam.pdf, etc).  All entries here
 *     were probed live with a HEAD-style range-0-0 GET (since IIS blocks
 *     HEAD) and confirmed to return HTTP 206 + application/pdf.
 *   - For AP: only Free-Response Questions (FRQs) and Course-and-Exam
 *     Description (CED) PDFs are made public for current admins.  Full
 *     released exams are public for a few historical years (e.g. 2017
 *     APUSH).  We link the canonical apcentral.collegeboard.org/courses/
 *     <slug>/exam page + per-year FRQ packets where we verified them.
 *
 * Validate URLs (optional, requires curl):
 *     node scripts/build-public-exam-library.mjs --validate
 * Without --validate, the script just writes the static catalog.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "data", "public-exam-library.json");

const NOW_ISO = new Date().toISOString();
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

/*
 * NYSED REGENTS — verified URL patterns.
 *
 * Subject slug + per-administration filebase.  The slug is case-sensitive
 * (Microsoft IIS).  The exam booklet has variants:
 *   plain       (default): {base}-exam.pdf
 *   watermarked (some admins): {base}-examw.pdf
 *
 * NYSED Regents covered:
 *   - Global History & Geography II (Grade 10)
 *   - U.S. History & Government (Framework)        — Grade 11
 *   - Living Environment
 *   - Earth Science (Physical Setting)
 *   - Chemistry (Physical Setting)
 *   - Physics (Physical Setting)
 *   - Algebra I (Common Core)
 *   - Algebra II (Common Core)
 *   - Geometry (Common Core, current)
 *   - High School ELA (Common Core / Framework)
 *
 * LOTE Comprehensive (French, Spanish, etc.) was last administered June 2011;
 * we link the archive index instead of fabricating recent admins.
 */

function rgents(slug) {
  return `https://www.nysedregents.org/${slug}/`;
}
function rgentsPdf(slug, mmyy, file) {
  return `https://www.nysedregents.org/${slug}/${mmyy}/${file}`;
}

const REGENTS_LIBRARIES = {
  "regents-global-2": {
    courseLabel: "NYS Global History II Regents (Grade 10)",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("ghg2"),
    exams: [
      mkRegents("glhg2-", "January 2026", "126", "12026", { suffix: "exam" }),
      mkRegents("glhg2-", "August 2025",  "825", "82025", { suffix: "exam" }),
      mkRegents("glhg2-", "June 2025",    "625", "62025", { suffix: "exam" }),
      mkRegents("glhg2-", "January 2025", "125", "12025", { suffix: "exam" }),
      mkRegents("glhg2-", "August 2024",  "824", "82024", { suffix: "examw" }),
      mkRegents("glhg2-", "June 2024",    "624", "62024", { suffix: "examw" }),
    ].map(adapt("ghg2", "Global History II Regents")),
  },

  "regents-us-history": {
    courseLabel: "NYS U.S. History & Government Regents (Grade 11, Framework)",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("us-history-govt/home.html"),
    exams: [
      mkRegents("ushg-", "January 2026", "126", "12026", { suffix: "exam", twoVolRg: false }),
      mkRegents("ushg-", "August 2025",  "825", "82025", { suffix: "exam", twoVolRg: false }),
      mkRegents("ushg-", "June 2025",    "625", "62025", { suffix: "exam", twoVolRg: true }),
      mkRegents("ushg-", "January 2025", "125", "12025", { suffix: "exam", twoVolRg: true }),
      mkRegents("ushg-", "August 2024",  "824", "82024", { suffix: "examw", twoVolRg: true }),
    ].map(adapt("us-history-govt", "U.S. History & Government Regents")),
  },

  "regents-living-environment": {
    courseLabel: "NYS Living Environment Regents",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("LivingEnvironment"),
    exams: [
      mkRegents("lenv-", "January 2026", "126", "12026", { suffix: "exam" }),
      mkRegents("lenv-", "August 2025",  "825", "82025", { suffix: "exam" }),
      mkRegents("lenv-", "June 2025",    "625", "62025", { suffix: "exam" }),
      mkRegents("lenv-", "January 2025", "125", "12025", { suffix: "exam" }),
      mkRegents("lenv-", "August 2024",  "824", "82024", { suffix: "examw" }),
      mkRegents("lenv-", "June 2024",    "624", "62024", { suffix: "examw" }),
    ].map(adapt("LivingEnvironment", "Living Environment Regents")),
  },

  "regents-earth-science": {
    courseLabel: "NYS Physical Setting / Earth Science Regents",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("EarthScience"),
    // Earth Science file convention: esci-XYYYY for new admins (126/825),
    // but esciXYYYY (no dash) for older admins (625/125/824/624).
    exams: [
      mkRegents("esci-",  "January 2026", "126", "12026", { suffix: "exam" }),
      mkRegents("esci-",  "August 2025",  "825", "82025", { suffix: "exam" }),
      mkRegents("esci",   "June 2025",    "625", "62025", { suffix: "exam" }),
      mkRegents("esci",   "January 2025", "125", "12025", { suffix: "exam" }),
      mkRegents("esci",   "August 2024",  "824", "82024", { suffix: "examw" }),
      mkRegents("esci",   "June 2024",    "624", "62024", { suffix: "examw" }),
    ].map(adapt("EarthScience", "Earth Science Regents")),
  },

  "regents-chemistry": {
    courseLabel: "NYS Physical Setting / Chemistry Regents",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("Chemistry"),
    exams: [
      mkRegents("chem-", "January 2026", "126", "12026", { suffix: "exam" }),
      mkRegents("chem-", "August 2025",  "825", "82025", { suffix: "exam" }),
      mkRegents("chem-", "June 2025",    "625", "62025", { suffix: "exam" }),
      mkRegents("chem-", "January 2025", "125", "12025", { suffix: "exam" }),
      mkRegents("chem",  "August 2024",  "824", "82024", { suffix: "exam" }),
      mkRegents("chem",  "June 2024",    "624", "62024", { suffix: "exam" }),
    ].map(adapt("Chemistry", "Chemistry Regents")),
  },

  "regents-physics": {
    courseLabel: "NYS Physical Setting / Physics Regents",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("Physics"),
    // Physics is June-only since 2019 (per NYSED archive).  No Jan/Aug admins.
    exams: [
      mkRegents("phys", "June 2025", "625", "62025", { suffix: "exam" }),
      mkRegents("phys", "June 2024", "624", "62024", { suffix: "exam" }),
      mkRegents("phys", "June 2023", "623", "62023", { suffix: "exam" }),
      mkRegents("phys", "June 2022", "622", "62022", { suffix: "exam" }),
      mkRegents("phys", "June 2019", "619", "62019", { suffix: "exam" }),
    ].map(adapt("Physics", "Physics Regents")),
  },

  "regents-algebra-1": {
    courseLabel: "NYS Algebra I (Common Core) Regents",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("algebraone"),
    exams: [
      mkRegents("algone-", "January 2026", "126", "12026", { suffix: "exam" }),
      mkRegents("algone-", "August 2025",  "825", "82025", { suffix: "exam" }),
      mkRegents("algone-", "June 2025",    "625", "62025", { suffix: "exam" }),
      mkRegents("algone-", "January 2025", "125", "12025", { suffix: "exam" }),
      mkRegents("algone",  "August 2024",  "824", "82024", { suffix: "exam" }),
      mkRegents("algone",  "June 2024",    "624", "62024", { suffix: "exam" }),
    ].map(adapt("algebraone", "Algebra I Regents")),
  },

  "regents-algebra-2": {
    courseLabel: "NYS Algebra II (Common Core) Regents",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("algebratwo"),
    exams: [
      mkRegents("algtwo-", "January 2026", "126", "12026", { suffix: "exam" }),
      mkRegents("algtwo-", "August 2025",  "825", "82025", { suffix: "exam" }),
      mkRegents("algtwo-", "June 2025",    "625", "62025", { suffix: "exam" }),
      mkRegents("algtwo-", "January 2025", "125", "12025", { suffix: "exam" }),
      mkRegents("algtwo",  "August 2024",  "824", "82024", { suffix: "exam" }),
      mkRegents("algtwo",  "June 2024",    "624", "62024", { suffix: "exam" }),
    ].map(adapt("algebratwo", "Algebra II Regents")),
  },

  "regents-geometry": {
    courseLabel: "NYS Geometry (Common Core) Regents",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("geometryre"),
    exams: [
      mkRegents("geom-", "January 2026", "126", "12026", { suffix: "exam" }),
      mkRegents("geom-", "August 2025",  "825", "82025", { suffix: "exam" }),
      mkRegents("geom-", "June 2025",    "625", "62025", { suffix: "exam" }),
      mkRegents("geom-", "January 2025", "125", "12025", { suffix: "exam" }),
      mkRegents("geom-", "August 2024",  "824", "82024", { suffix: "exam" }),
      mkRegents("geom",  "June 2024",    "624", "62024", { suffix: "exam" }),
    ].map(adapt("geometryre", "Geometry Regents")),
  },

  "regents-ela": {
    courseLabel: "NYS English Language Arts (ELA) Regents",
    examFamily: "NYS Regents",
    sourceHomePage: rgents("hsela"),
    // ELA has 3-part rating guides (rga, rgb, rgc).  We link rga as the
    // primary scoring guide URL.
    exams: [
      mkRegents("reela-", "January 2026", "126", "12026", { suffix: "exam", elaRg: true }),
      mkRegents("reela-", "August 2025",  "825", "82025", { suffix: "exam", elaRg: true }),
      mkRegents("reela-", "June 2025",    "625", "62025", { suffix: "exam", elaRg: true }),
      mkRegents("reela-", "January 2025", "125", "12025", { suffix: "exam", elaRg: true }),
      mkRegents("reela-", "August 2024",  "824", "82024", { suffix: "exam", elaRg: true }),
      mkRegents("reela-", "June 2024",    "624", "62024", { suffix: "exam", elaRg: true }),
    ].map(adapt("hsela", "ELA Regents")),
  },
};

// -- NYSED Grade 3-8 Released Items --
// Hosted under /ei/{ela|math|science}/{YYYY}/.  Path conventions per year:
//   ela 2021     : items at /ei/ela/2021/...      scoring NOT POSTED
//   ela 2022-2025: items + scoring at /ei/ela/{Y}/...
//   math 2021    : items at /ei/math/2021/english/   scoring NOT POSTED
//   math 2022    : items at /ei/math/2022/english/   scoring at /ei/math/2022/
//   math 2023+   : items + scoring at /ei/math/{Y}/
//   science 2024-2025: items at /ei/science/{Y}/    (scoring inline)
function mk38(grade, subject, label, year, gKey) {
  const sub = subject; // ela | math | science
  const fileBase = `${year}-released-items-${sub}-${gKey}`;
  const scoreBase = `${year}-scoring-materials-${sub}-${gKey}`;
  // Items path varies for math 2021/2022 and ela has no special.
  let itemsDir = `${year}`;
  if (sub === "math" && (year === "2021" || year === "2022")) itemsDir = `${year}/english`;
  const examUrl = `https://www.nysedregents.org/ei/${sub}/${itemsDir}/${fileBase}.pdf`;
  // Scoring availability:
  let scoringUrl = "";
  if (sub === "science") {
    scoringUrl = "";  // science PDF includes scoring inline
  } else if (sub === "ela" && year === "2021") {
    scoringUrl = "";  // not posted by NYSED
  } else if (sub === "math" && year === "2021") {
    scoringUrl = "";  // not posted by NYSED
  } else {
    // For math 2022 the scoring file sits at /ei/math/2022/<base>.pdf (not /english/).
    scoringUrl = `https://www.nysedregents.org/ei/${sub}/${year}/${scoreBase}.pdf`;
  }
  return {
    id: `${gKey}-${sub}-${year}`,
    year: `${year}`,
    title: `${label} ${year} Released Items`,
    examUrl,
    scoringGuideUrl: scoringUrl,
  };
}

const GRADE_38_LIBRARIES = {};
for (const grade of [5, 6, 7, 8]) {
  const gKey = `g${grade}`;
  GRADE_38_LIBRARIES[`grade-${grade}-ela-practice`] = {
    courseLabel: `NYS Grade ${grade} ELA State Test`,
    examFamily: "NYS Grade 3-8",
    sourceHomePage: "https://www.nysedregents.org/ei/ei-ela.html",
    exams: [
      mk38(grade, "ela", `NYS Grade ${grade} ELA`, "2025", gKey),
      mk38(grade, "ela", `NYS Grade ${grade} ELA`, "2024", gKey),
      mk38(grade, "ela", `NYS Grade ${grade} ELA`, "2023", gKey),
      mk38(grade, "ela", `NYS Grade ${grade} ELA`, "2022", gKey),
      mk38(grade, "ela", `NYS Grade ${grade} ELA`, "2021", gKey),
    ],
  };
  GRADE_38_LIBRARIES[`grade-${grade}-math-practice`] = {
    courseLabel: `NYS Grade ${grade} Math State Test`,
    examFamily: "NYS Grade 3-8",
    sourceHomePage: "https://www.nysedregents.org/ei/ei-math.html",
    exams: [
      mk38(grade, "math", `NYS Grade ${grade} Math`, "2025", gKey),
      mk38(grade, "math", `NYS Grade ${grade} Math`, "2024", gKey),
      mk38(grade, "math", `NYS Grade ${grade} Math`, "2023", gKey),
      mk38(grade, "math", `NYS Grade ${grade} Math`, "2022", gKey),
      mk38(grade, "math", `NYS Grade ${grade} Math`, "2021", gKey),
    ],
  };
}
// Science only Grade 5 + Grade 8
for (const grade of [5, 8]) {
  const gKey = `g${grade}`;
  GRADE_38_LIBRARIES[`grade-${grade}-science-practice`] = {
    courseLabel: `NYS Grade ${grade} Science State Test`,
    examFamily: "NYS Grade 3-8",
    sourceHomePage: "https://www.nysedregents.org/ei/ei-science.html",
    exams: [
      mk38(grade, "science", `NYS Grade ${grade} Science`, "2025", gKey),
      mk38(grade, "science", `NYS Grade ${grade} Science`, "2024", gKey),
    ],
  };
}
// Note: grade-5-ela-practice and grade-8-science-practice are added.  The
// 5-math/6-math/7-math/grade-7-ela/grade-6-ela/grade-7-ela etc. also exist
// as practice routes — they all key off the grade-{N}-{subj}-practice slug.

// -- AP COLLEGE BOARD --
// Public materials per course on apcentral.collegeboard.org:
//   * Course and Exam Description (CED) PDF
//   * Past exam Free-Response Questions (FRQs) — 3 most recent years per CB policy
//   * Some courses also have a 2012/2017 full Released Practice Exam PDF
// We link the canonical exam page + per-year FRQ packets.
function apMedia(name) {
  return `https://apcentral.collegeboard.org/media/pdf/${name}`;
}
function apPage(slug) {
  return `https://apcentral.collegeboard.org/courses/${slug}/exam/past-exam-questions`;
}
function ced(slug, file) {
  return apMedia(file || `${slug}-course-and-exam-description.pdf`);
}

/**
 * AP FRQ slug map.  Built from live probes — see /tmp/probe_ap*.sh.
 *
 * The College Board file URL convention is:
 *     apYY-frq-<slug>[-set-N].pdf       (free-response questions)
 *     apYY-sg-<slug>[-set-N].pdf        (scoring guidelines)
 *
 * mode values:
 *     "single"   — only one packet per year, no set-N suffix
 *     "two-set"  — emits both set-1 + set-2 entries
 *     "set-1"    — file uses "-set-1" but no set-2 exists (e.g. Env Sci, HUG)
 *
 * Some courses changed mode between years (Physics C went two-set → single for 25,
 * AAS launched in 24 single and went two-set in 25).  mode2025 overrides for >=2025.
 */
// slug = default FRQ + SG slug.  sgSlug = override SG slug if it differs.
// frqSlug = override FRQ slug if it differs.  *2025 variants apply for year >= 2025.
// noSg23/noSg24 = scoring guide not posted publicly for that year.
const AP_FRQ_SLUG = {
  apush: { slug: "us-history", mode: "two-set" },
  // WH: FRQ uses "world-history" for 2024 only; otherwise "world-history-modern". SG always "world-history-modern".
  apwh: { slug: "world-history-modern", sgSlug: "world-history-modern", mode: "two-set", frqSlug2024: "world-history" },
  apeuro: { slug: "european-history", mode: "two-set" },
  apgov: { slug: "us-gov-pol", mode: "two-set", noSg23: true, noSg24: true },
  apcompgov: { slug: "comp-gov-pol", mode: "two-set", noSg23: true, noSg24: true },
  apmacro: { slug: "macroeconomics", mode: "two-set" },
  apmicro: { slug: "microeconomics", mode: "two-set" },
  appsych: { slug: "psychology", mode: "two-set" },
  aphug: { slug: "human-geography", mode: "two-set" },
  apbio: { slug: "biology", mode: "single" },
  apchem: { slug: "chemistry", mode: "single" },
  apenvsci: { slug: "environmental-science", mode: "set-1" },
  apphys1: { slug: "physics-1", mode: "single" },
  apphys2: { slug: "physics-2", mode: "single" },
  // Phys C: FRQ uses long name in 2023 for Mech only (mechanics), abbreviated
  // 2024+ (mech).  E&M always uses abbreviated form.  SG always abbreviated.
  apphyscmech: { slug: "physics-c-mech", sgSlug: "physics-c-mech", mode: "two-set",
                 frqSlug2023: "physics-c-mechanics", mode2025: "single" },
  apphyscem:   { slug: "physics-c-em",   sgSlug: "physics-c-em",   mode: "two-set",
                 mode2025: "single" },
  apcalcab: { slug: "calculus-ab", mode: "single" },
  apcalcbc: { slug: "calculus-bc", mode: "single" },
  // Precalc launched 2024; no 2023 packet.
  appre: { slug: "precalculus", mode: "single", noBefore: 2024 },
  apstats: { slug: "statistics", mode: "single" },
  // CSA: FRQ uses "comp-sci-a" 2023-2024 but reverts to "computer-science-a" 2025.
  // SG always uses "computer-science-a".
  apcsa: { slug: "comp-sci-a", sgSlug: "computer-science-a", mode: "single",
           frqSlug2025: "computer-science-a" },
  apenglang: { slug: "english-language", mode: "two-set" },
  // Eng Lit: FRQ uses "english-lit" 2023-2024, but "english-literature" 2025.
  // SG always uses "english-literature".
  apenglit: { slug: "english-lit", sgSlug: "english-literature", mode: "two-set",
              frqSlug2025: "english-literature" },
  aparthist: { slug: "art-history", mode: "single" },
  apmusic: { slug: "music-theory", mode: "single" },
  aplatin: { slug: "latin", mode: "single" },
  apsplang: { slug: "spanish-language", mode: "single" },
  apsplit: { slug: "spanish-literature", mode: "single" },
  apfrench: { slug: "french-language", mode: "single" },
  apgerman: { slug: "german-language", mode: "single" },
  apitalian: { slug: "italian-language", mode: "single" },
  // AAS launched 2024 single, became two-set in 2025.
  apaas: { slug: "african-american-studies", mode: "single", mode2025: "two-set", noBefore: 2024 },
};

function apFrq(idPrefix, year, _legacySlug, opts) {
  opts = opts || {};
  const yy = String(year).slice(-2);
  const map = AP_FRQ_SLUG[idPrefix];
  if (!map) {
    return {
      id: `${idPrefix}-${year}-frq`,
      year,
      title: `${apIdToTitle(idPrefix)} — ${year} Free-Response Questions`,
      examUrl: "",
      scoringGuideUrl: "",
      status: "needs-verification",
    };
  }
  // Skip years before the course launched.
  if (map.noBefore && Number(year) < map.noBefore) {
    return null;
  }
  // Resolve FRQ slug (per-year override allowed).
  let frqSlug = map.slug;
  if (map[`frqSlug${year}`]) frqSlug = map[`frqSlug${year}`];
  else if (year >= 2025 && map.frqSlug2025) frqSlug = map.frqSlug2025;
  else if (map.frqSlug) frqSlug = map.frqSlug;
  // Resolve SG slug (per-year override allowed).
  let sgSlug = map.sgSlug || frqSlug;
  if (map[`sgSlug${year}`]) sgSlug = map[`sgSlug${year}`];
  // Resolve mode (per-year override).
  let mode = map.mode;
  if (year >= 2025 && map.mode2025) mode = map.mode2025;
  if (opts.singleSet) mode = "single";
  // Decide whether SG is publicly posted.
  const sgPosted = !(
    (year == 2023 && map.noSg23) ||
    (year == 2024 && map.noSg24) ||
    (year == 2025 && map.noSg25)
  );

  if (mode === "single") {
    return {
      id: `${idPrefix}-${year}-frq`,
      year,
      title: `${apIdToTitle(idPrefix)} — ${year} Free-Response Questions`,
      examUrl: apMedia(`ap${yy}-frq-${frqSlug}.pdf`),
      scoringGuideUrl: sgPosted ? apMedia(`ap${yy}-sg-${sgSlug}.pdf`) : "",
      status: opts.status || undefined,
    };
  }
  const set1Frq = apMedia(`ap${yy}-frq-${frqSlug}-set-1.pdf`);
  const set1Sg  = sgPosted ? apMedia(`ap${yy}-sg-${sgSlug}-set-1.pdf`) : "";
  const set2Frq = apMedia(`ap${yy}-frq-${frqSlug}-set-2.pdf`);
  const set2Sg  = sgPosted ? apMedia(`ap${yy}-sg-${sgSlug}-set-2.pdf`) : "";
  const entry = {
    id: `${idPrefix}-${year}-frq`,
    year,
    title: mode === "two-set"
      ? `${apIdToTitle(idPrefix)} — ${year} Free-Response Questions (Set 1)`
      : `${apIdToTitle(idPrefix)} — ${year} Free-Response Questions`,
    examUrl: set1Frq,
    scoringGuideUrl: set1Sg,
  };
  if (mode === "two-set") {
    entry.additionalUrls = [{ label: "Set 2 FRQ", url: set2Frq }];
    if (set2Sg) entry.additionalUrls.push({ label: "Set 2 Scoring Guide", url: set2Sg });
  }
  if (opts.status) entry.status = opts.status;
  return entry;
}

function apIdToTitle(id) {
  return {
    apush: "AP U.S. History",
    apwh: "AP World History: Modern",
    apeuro: "AP European History",
    apgov: "AP U.S. Government",
    apcompgov: "AP Comparative Government",
    apmacro: "AP Macroeconomics",
    apmicro: "AP Microeconomics",
    appsych: "AP Psychology",
    aphug: "AP Human Geography",
    apbio: "AP Biology",
    apchem: "AP Chemistry",
    apenvsci: "AP Environmental Science",
    apphys1: "AP Physics 1",
    apphys2: "AP Physics 2",
    apphyscmech: "AP Physics C: Mechanics",
    apphyscem: "AP Physics C: E&M",
    apcalcab: "AP Calculus AB",
    apcalcbc: "AP Calculus BC",
    appre: "AP Precalculus",
    apstats: "AP Statistics",
    apcsa: "AP Computer Science A",
    apcsp: "AP Computer Science Principles",
    apenglang: "AP English Language",
    apenglit: "AP English Literature",
    aparthist: "AP Art History",
    apmusic: "AP Music Theory",
    aplatin: "AP Latin",
    apsplang: "AP Spanish Language",
    apsplit: "AP Spanish Literature",
    apfrench: "AP French Language",
    apgerman: "AP German Language",
    apitalian: "AP Italian Language",
    apaas: "AP African American Studies",
  }[id] || id;
}

const AP_LIBRARIES = {
  "apush-practice": {
    courseLabel: "AP United States History",
    examFamily: "AP",
    sourceHomePage: apPage("ap-united-states-history"),
    exams: [
      {
        id: "apush-2017-released",
        year: "2017",
        title: "AP U.S. History — 2017 Released Practice Exam (full)",
        examUrl: apMedia("ap-united-states-history-ced-practice-exam.pdf"),
        scoringGuideUrl: "",
      },
      {
        id: "apush-ced",
        year: "Course Description",
        title: "AP U.S. History — Course and Exam Description (CED)",
        examUrl: ced("ap-us-history"),
        scoringGuideUrl: "",
      },
      apFrq("apush", "2025", "us-history"),
      apFrq("apush", "2024", "us-history"),
      apFrq("apush", "2023", "us-history"),
    ],
  },

  "ap-world-practice": {
    courseLabel: "AP World History: Modern",
    examFamily: "AP",
    sourceHomePage: apPage("ap-world-history"),
    exams: [
      {
        id: "apwh-2017-released",
        year: "2017",
        title: "AP World History: Modern — 2017 Released Practice Exam (full)",
        examUrl: "https://secure-media.collegeboard.org/digitalServices/pdf/ap/ap-world-history-ced-practice-exam.pdf",
        scoringGuideUrl: "",
      },
      {
        id: "apwh-ced",
        year: "Course Description",
        title: "AP World History: Modern — Course and Exam Description (CED)",
        examUrl: ced("ap-world-history-modern"),
        scoringGuideUrl: "",
      },
      apFrq("apwh", "2025", "world-history-modern"),
      apFrq("apwh", "2024", "world-history-modern"),
      apFrq("apwh", "2023", "world-history-modern"),
    ],
  },

  "ap-euro-practice": {
    courseLabel: "AP European History",
    examFamily: "AP",
    sourceHomePage: apPage("ap-european-history"),
    exams: [
      {
        id: "apeuro-2017-released",
        year: "2017",
        title: "AP European History — 2017 Released Practice Exam (full)",
        examUrl: "https://secure-media.collegeboard.org/digitalServices/pdf/ap/ap-european-history-ced-practice-exam.pdf",
        scoringGuideUrl: "",
      },
      {
        id: "apeuro-ced",
        year: "Course Description",
        title: "AP European History — Course and Exam Description (CED)",
        examUrl: ced("ap-european-history"),
        scoringGuideUrl: "",
      },
      apFrq("apeuro", "2025", "european-history"),
      apFrq("apeuro", "2024", "european-history"),
      apFrq("apeuro", "2023", "european-history"),
    ],
  },

  "ap-gov-practice": {
    courseLabel: "AP U.S. Government and Politics",
    examFamily: "AP",
    sourceHomePage: apPage("ap-united-states-government-and-politics"),
    exams: [
      {
        id: "apgov-ced",
        year: "Course Description",
        title: "AP U.S. Government — Course and Exam Description (CED)",
        examUrl: ced("ap-us-government-and-politics"),
        scoringGuideUrl: "",
      },
      apFrq("apgov", "2025", "us-government-and-politics"),
      apFrq("apgov", "2024", "us-government-and-politics"),
      apFrq("apgov", "2023", "us-government-and-politics"),
    ],
  },

  "ap-comp-gov-practice": {
    courseLabel: "AP Comparative Government and Politics",
    examFamily: "AP",
    sourceHomePage: apPage("ap-comparative-government-and-politics"),
    exams: [
      {
        id: "apcompgov-ced",
        year: "Course Description",
        title: "AP Comparative Government — Course and Exam Description (CED)",
        examUrl: ced("ap-comparative-government-and-politics"),
        scoringGuideUrl: "",
      },
      apFrq("apcompgov", "2025", "comparative-government-and-politics"),
      apFrq("apcompgov", "2024", "comparative-government-and-politics"),
      apFrq("apcompgov", "2023", "comparative-government-and-politics"),
    ],
  },

  "ap-macro-practice": {
    courseLabel: "AP Macroeconomics",
    examFamily: "AP",
    sourceHomePage: apPage("ap-macroeconomics"),
    exams: [
      {
        id: "apmacro-2012-released",
        year: "2012",
        title: "AP Macroeconomics — 2012 Released Practice Exam (full)",
        examUrl: apMedia("ap-macroeconomics-practice-exam-2012.pdf"),
        scoringGuideUrl: "",
      },
      {
        id: "apmacro-ced",
        year: "Course Description",
        title: "AP Macroeconomics — Course and Exam Description (CED)",
        examUrl: ced("ap-macroeconomics"),
        scoringGuideUrl: "",
      },
      apFrq("apmacro", "2025", "macroeconomics"),
      apFrq("apmacro", "2024", "macroeconomics"),
      apFrq("apmacro", "2023", "macroeconomics"),
    ],
  },

  "ap-micro-practice": {
    courseLabel: "AP Microeconomics",
    examFamily: "AP",
    sourceHomePage: apPage("ap-microeconomics"),
    exams: [
      {
        id: "apmicro-2012-released",
        year: "2012",
        title: "AP Microeconomics — 2012 Released Practice Exam (full)",
        examUrl: apMedia("ap-microeconomics-practice-exam-2012.pdf"),
        scoringGuideUrl: "",
      },
      {
        id: "apmicro-ced",
        year: "Course Description",
        title: "AP Microeconomics — Course and Exam Description (CED)",
        examUrl: ced("ap-microeconomics"),
        scoringGuideUrl: "",
      },
      apFrq("apmicro", "2025", "microeconomics"),
      apFrq("apmicro", "2024", "microeconomics"),
      apFrq("apmicro", "2023", "microeconomics"),
    ],
  },

  "ap-psych-practice": {
    courseLabel: "AP Psychology",
    examFamily: "AP",
    sourceHomePage: apPage("ap-psychology"),
    exams: [
      {
        id: "appsych-2012-released",
        year: "2012",
        title: "AP Psychology — 2012 Released Practice Exam (full, prior framework)",
        examUrl: apMedia("ap-psychology-practice-exam-2012.pdf"),
        scoringGuideUrl: "",
      },
      {
        id: "appsych-ced",
        year: "Course Description",
        title: "AP Psychology — Course and Exam Description (CED)",
        examUrl: ced("ap-psychology"),
        scoringGuideUrl: "",
      },
      apFrq("appsych", "2025", "psychology"),
      apFrq("appsych", "2024", "psychology"),
      apFrq("appsych", "2023", "psychology"),
    ],
  },

  "ap-hug-practice": {
    courseLabel: "AP Human Geography",
    examFamily: "AP",
    sourceHomePage: apPage("ap-human-geography"),
    exams: [
      {
        id: "aphug-ced",
        year: "Course Description",
        title: "AP Human Geography — Course and Exam Description (CED)",
        examUrl: ced("ap-human-geography"),
        scoringGuideUrl: "",
      },
      apFrq("aphug", "2025", "human-geography"),
      apFrq("aphug", "2024", "human-geography"),
      apFrq("aphug", "2023", "human-geography"),
    ],
  },

  "ap-bio-practice": {
    courseLabel: "AP Biology",
    examFamily: "AP",
    sourceHomePage: apPage("ap-biology"),
    exams: [
      {
        id: "apbio-ced",
        year: "Course Description",
        title: "AP Biology — Course and Exam Description (CED)",
        examUrl: ced("ap-biology"),
        scoringGuideUrl: "",
      },
      apFrq("apbio", "2025", "biology"),
      apFrq("apbio", "2024", "biology"),
      apFrq("apbio", "2023", "biology"),
    ],
  },

  "ap-chem-practice": {
    courseLabel: "AP Chemistry",
    examFamily: "AP",
    sourceHomePage: apPage("ap-chemistry"),
    exams: [
      {
        id: "apchem-ced",
        year: "Course Description",
        title: "AP Chemistry — Course and Exam Description (CED)",
        examUrl: ced("ap-chemistry"),
        scoringGuideUrl: "",
      },
      apFrq("apchem", "2025", "chemistry"),
      apFrq("apchem", "2024", "chemistry"),
      apFrq("apchem", "2023", "chemistry"),
    ],
  },

  "ap-env-sci-practice": {
    courseLabel: "AP Environmental Science",
    examFamily: "AP",
    sourceHomePage: apPage("ap-environmental-science"),
    exams: [
      {
        id: "apenvsci-ced",
        year: "Course Description",
        title: "AP Environmental Science — Course and Exam Description (CED)",
        examUrl: ced("ap-environmental-science"),
        scoringGuideUrl: "",
      },
      apFrq("apenvsci", "2025", "environmental-science"),
      apFrq("apenvsci", "2024", "environmental-science"),
      apFrq("apenvsci", "2023", "environmental-science"),
    ],
  },

  "ap-physics-1-practice": {
    courseLabel: "AP Physics 1: Algebra-Based",
    examFamily: "AP",
    sourceHomePage: apPage("ap-physics-1"),
    exams: [
      {
        id: "apphys1-ced",
        year: "Course Description",
        title: "AP Physics 1 — Course and Exam Description (CED)",
        examUrl: ced("ap-physics-1"),
        scoringGuideUrl: "",
      },
      apFrq("apphys1", "2025", "physics-1"),
      apFrq("apphys1", "2024", "physics-1"),
      apFrq("apphys1", "2023", "physics-1"),
    ],
  },

  "ap-physics-2-practice": {
    courseLabel: "AP Physics 2: Algebra-Based",
    examFamily: "AP",
    sourceHomePage: apPage("ap-physics-2"),
    exams: [
      {
        id: "apphys2-ced",
        year: "Course Description",
        title: "AP Physics 2 — Course and Exam Description (CED)",
        examUrl: ced("ap-physics-2"),
        scoringGuideUrl: "",
      },
      apFrq("apphys2", "2025", "physics-2"),
      apFrq("apphys2", "2024", "physics-2"),
      apFrq("apphys2", "2023", "physics-2"),
    ],
  },

  "ap-physics-c-mech-practice": {
    courseLabel: "AP Physics C: Mechanics",
    examFamily: "AP",
    sourceHomePage: apPage("ap-physics-c-mechanics"),
    exams: [
      {
        id: "apphyscmech-ced",
        year: "Course Description",
        title: "AP Physics C: Mechanics — Course and Exam Description (CED)",
        examUrl: ced("ap-physics-c-mechanics"),
        scoringGuideUrl: "",
      },
      apFrq("apphyscmech", "2025", "physics-c-mechanics"),
      apFrq("apphyscmech", "2024", "physics-c-mechanics"),
      apFrq("apphyscmech", "2023", "physics-c-mechanics"),
    ],
  },

  "ap-physics-c-em-practice": {
    courseLabel: "AP Physics C: Electricity and Magnetism",
    examFamily: "AP",
    sourceHomePage: apPage("ap-physics-c-electricity-and-magnetism"),
    exams: [
      {
        id: "apphyscem-ced",
        year: "Course Description",
        title: "AP Physics C: E&M — Course and Exam Description (CED)",
        examUrl: ced("ap-physics-c-electricity-and-magnetism"),
        scoringGuideUrl: "",
      },
      apFrq("apphyscem", "2025", "physics-c-electricity-and-magnetism"),
      apFrq("apphyscem", "2024", "physics-c-electricity-and-magnetism"),
      apFrq("apphyscem", "2023", "physics-c-electricity-and-magnetism"),
    ],
  },

  "ap-calc-ab-practice": {
    courseLabel: "AP Calculus AB",
    examFamily: "AP",
    sourceHomePage: apPage("ap-calculus-ab"),
    exams: [
      {
        id: "apcalcab-ced",
        year: "Course Description",
        title: "AP Calculus AB/BC — Course and Exam Description (CED)",
        examUrl: ced("ap-calculus-ab", "ap-calculus-ab-and-bc-course-and-exam-description.pdf"),
        scoringGuideUrl: "",
      },
      apFrq("apcalcab", "2025", "calculus-ab"),
      apFrq("apcalcab", "2024", "calculus-ab"),
      apFrq("apcalcab", "2023", "calculus-ab"),
    ],
  },

  "ap-calc-bc-practice": {
    courseLabel: "AP Calculus BC",
    examFamily: "AP",
    sourceHomePage: apPage("ap-calculus-bc"),
    exams: [
      {
        id: "apcalcbc-ced",
        year: "Course Description",
        title: "AP Calculus AB/BC — Course and Exam Description (CED)",
        examUrl: ced("ap-calculus-bc", "ap-calculus-ab-and-bc-course-and-exam-description.pdf"),
        scoringGuideUrl: "",
      },
      apFrq("apcalcbc", "2025", "calculus-bc"),
      apFrq("apcalcbc", "2024", "calculus-bc"),
      apFrq("apcalcbc", "2023", "calculus-bc"),
    ],
  },

  "ap-precalc-practice": {
    courseLabel: "AP Precalculus",
    examFamily: "AP",
    sourceHomePage: apPage("ap-precalculus"),
    exams: [
      {
        id: "appre-ced",
        year: "Course Description",
        title: "AP Precalculus — Course and Exam Description (CED)",
        examUrl: ced("ap-precalculus"),
        scoringGuideUrl: "",
      },
      apFrq("appre", "2025", "precalculus"),
      apFrq("appre", "2024", "precalculus"),
      apFrq("appre", "2023", "precalculus"),
    ],
  },

  "ap-stats-practice": {
    courseLabel: "AP Statistics",
    examFamily: "AP",
    sourceHomePage: apPage("ap-statistics"),
    exams: [
      {
        id: "apstats-ced",
        year: "Course Description",
        title: "AP Statistics — Course and Exam Description (CED)",
        examUrl: ced("ap-statistics"),
        scoringGuideUrl: "",
      },
      apFrq("apstats", "2025", "statistics"),
      apFrq("apstats", "2024", "statistics"),
      apFrq("apstats", "2023", "statistics"),
    ],
  },

  "ap-csa-practice": {
    courseLabel: "AP Computer Science A",
    examFamily: "AP",
    sourceHomePage: apPage("ap-computer-science-a"),
    exams: [
      {
        id: "apcsa-ced",
        year: "Course Description",
        title: "AP Computer Science A — Course and Exam Description (CED)",
        examUrl: ced("ap-computer-science-a"),
        scoringGuideUrl: "",
      },
      apFrq("apcsa", "2025", "computer-science-a"),
      apFrq("apcsa", "2024", "computer-science-a"),
      apFrq("apcsa", "2023", "computer-science-a"),
    ],
  },

  "ap-csp-practice": {
    courseLabel: "AP Computer Science Principles",
    examFamily: "AP",
    sourceHomePage: apPage("ap-computer-science-principles"),
    exams: [
      {
        id: "apcsp-ced",
        year: "Course Description",
        title: "AP Computer Science Principles — Course and Exam Description (CED)",
        examUrl: ced("ap-computer-science-principles"),
        scoringGuideUrl: "",
      },
    ],
  },

  "ap-eng-lang-practice": {
    courseLabel: "AP English Language and Composition",
    examFamily: "AP",
    sourceHomePage: apPage("ap-english-language-and-composition"),
    exams: [
      {
        id: "apenglang-ced",
        year: "Course Description",
        title: "AP English Language — Course and Exam Description (CED)",
        examUrl: ced("ap-english-language-and-composition"),
        scoringGuideUrl: "",
      },
      apFrq("apenglang", "2025", "english-language-and-composition"),
      apFrq("apenglang", "2024", "english-language-and-composition"),
      apFrq("apenglang", "2023", "english-language-and-composition"),
    ],
  },

  "ap-eng-lit-practice": {
    courseLabel: "AP English Literature and Composition",
    examFamily: "AP",
    sourceHomePage: apPage("ap-english-literature-and-composition"),
    exams: [
      {
        id: "apenglit-ced",
        year: "Course Description",
        title: "AP English Literature — Course and Exam Description (CED)",
        examUrl: ced("ap-english-literature-and-composition"),
        scoringGuideUrl: "",
      },
      apFrq("apenglit", "2025", "english-literature-and-composition"),
      apFrq("apenglit", "2024", "english-literature-and-composition"),
      apFrq("apenglit", "2023", "english-literature-and-composition"),
    ],
  },

  "ap-art-history-practice": {
    courseLabel: "AP Art History",
    examFamily: "AP",
    sourceHomePage: apPage("ap-art-history"),
    exams: [
      {
        id: "aparthist-ced",
        year: "Course Description",
        title: "AP Art History — Course and Exam Description (CED)",
        examUrl: ced("ap-art-history"),
        scoringGuideUrl: "",
      },
      apFrq("aparthist", "2025", "art-history"),
      apFrq("aparthist", "2024", "art-history"),
      apFrq("aparthist", "2023", "art-history"),
    ],
  },

  "ap-music-theory-practice": {
    courseLabel: "AP Music Theory",
    examFamily: "AP",
    sourceHomePage: apPage("ap-music-theory"),
    exams: [
      {
        id: "apmusic-ced",
        year: "Course Description",
        title: "AP Music Theory — Course and Exam Description (CED)",
        examUrl: ced("ap-music-theory"),
        scoringGuideUrl: "",
      },
      apFrq("apmusic", "2025", "music-theory"),
      apFrq("apmusic", "2024", "music-theory"),
      apFrq("apmusic", "2023", "music-theory"),
    ],
  },

  "ap-latin-practice": {
    courseLabel: "AP Latin",
    examFamily: "AP",
    sourceHomePage: apPage("ap-latin"),
    exams: [
      {
        id: "aplatin-ced",
        year: "Course Description",
        title: "AP Latin — Course and Exam Description (CED)",
        examUrl: ced("ap-latin"),
        scoringGuideUrl: "",
      },
      apFrq("aplatin", "2025", "latin"),
      apFrq("aplatin", "2024", "latin"),
      apFrq("aplatin", "2023", "latin"),
    ],
  },

  "ap-spanish-lang-practice": {
    courseLabel: "AP Spanish Language and Culture",
    examFamily: "AP",
    sourceHomePage: apPage("ap-spanish-language-and-culture"),
    exams: [
      {
        id: "apsplang-ced",
        year: "Course Description",
        title: "AP Spanish Language — Course and Exam Description (CED)",
        examUrl: ced("ap-spanish-language-and-culture"),
        scoringGuideUrl: "",
      },
      apFrq("apsplang", "2025", "spanish-language-and-culture"),
      apFrq("apsplang", "2024", "spanish-language-and-culture"),
      apFrq("apsplang", "2023", "spanish-language-and-culture"),
    ],
  },

  "ap-spanish-lit-practice": {
    courseLabel: "AP Spanish Literature and Culture",
    examFamily: "AP",
    sourceHomePage: apPage("ap-spanish-literature-and-culture"),
    exams: [
      {
        id: "apsplit-ced",
        year: "Course Description",
        title: "AP Spanish Literature — Course and Exam Description (CED)",
        examUrl: ced("ap-spanish-literature-and-culture"),
        scoringGuideUrl: "",
      },
      apFrq("apsplit", "2025", "spanish-literature-and-culture"),
      apFrq("apsplit", "2024", "spanish-literature-and-culture"),
      apFrq("apsplit", "2023", "spanish-literature-and-culture"),
    ],
  },

  "ap-french-practice": {
    courseLabel: "AP French Language and Culture",
    examFamily: "AP",
    sourceHomePage: apPage("ap-french-language-and-culture"),
    exams: [
      {
        id: "apfrench-ced",
        year: "Course Description",
        title: "AP French Language — Course and Exam Description (CED)",
        examUrl: ced("ap-french-language-and-culture"),
        scoringGuideUrl: "",
      },
      apFrq("apfrench", "2025", "french-language-and-culture"),
      apFrq("apfrench", "2024", "french-language-and-culture"),
      apFrq("apfrench", "2023", "french-language-and-culture"),
    ],
  },

  "ap-german-practice": {
    courseLabel: "AP German Language and Culture",
    examFamily: "AP",
    sourceHomePage: apPage("ap-german-language-and-culture"),
    exams: [
      {
        id: "apgerman-ced",
        year: "Course Description",
        title: "AP German Language — Course and Exam Description (CED)",
        examUrl: ced("ap-german-language-and-culture"),
        scoringGuideUrl: "",
      },
      apFrq("apgerman", "2025", "german-language-and-culture"),
      apFrq("apgerman", "2024", "german-language-and-culture"),
      apFrq("apgerman", "2023", "german-language-and-culture"),
    ],
  },

  "ap-italian-practice": {
    courseLabel: "AP Italian Language and Culture",
    examFamily: "AP",
    sourceHomePage: apPage("ap-italian-language-and-culture"),
    exams: [
      {
        id: "apitalian-ced",
        year: "Course Description",
        title: "AP Italian Language — Course and Exam Description (CED)",
        examUrl: ced("ap-italian-language-and-culture"),
        scoringGuideUrl: "",
      },
      apFrq("apitalian", "2025", "italian-language-and-culture"),
      apFrq("apitalian", "2024", "italian-language-and-culture"),
      apFrq("apitalian", "2023", "italian-language-and-culture"),
    ],
  },

  "ap-aas-practice": {
    courseLabel: "AP African American Studies",
    examFamily: "AP",
    sourceHomePage: apPage("ap-african-american-studies"),
    exams: [
      {
        id: "apaas-ced",
        year: "Course Description",
        title: "AP African American Studies — Course and Exam Description (CED)",
        examUrl: ced("ap-african-american-studies"),
        scoringGuideUrl: "",
      },
      apFrq("apaas", "2025", "african-american-studies"),
      apFrq("apaas", "2024", "african-american-studies"),
    ],
  },
};

// --------- Helper factories ---------
function mkRegents(prefix, label, mmyy, mmyyyy, opts) {
  return { prefix, label, mmyy, mmyyyy, opts: opts || {} };
}
function adapt(slug, courseName) {
  return ({ prefix, label, mmyy, mmyyyy, opts }) => {
    const sfx = opts.suffix || "exam";
    const fileBase = `${prefix}${mmyyyy}-${sfx}.pdf`;
    const examUrl = rgentsPdf(slug, mmyy, fileBase);
    let scoringGuideUrl;
    if (opts.elaRg) {
      scoringGuideUrl = rgentsPdf(slug, mmyy, `${prefix}${mmyyyy}-rga.pdf`);
    } else if (opts.twoVolRg) {
      scoringGuideUrl = rgentsPdf(slug, mmyy, `${prefix}${mmyyyy}-rg1.pdf`);
    } else {
      scoringGuideUrl = rgentsPdf(slug, mmyy, `${prefix}${mmyyyy}-rg.pdf`);
    }
    const id = `${slug.toLowerCase()}-${mmyyyy}`.replace(/[^a-z0-9-]/g, "-");
    return {
      id,
      year: label,
      title: `${courseName} — ${label}`,
      examUrl,
      scoringGuideUrl,
    };
  };
}
// --------- Compose final payload ---------
const libraries = {
  ...REGENTS_LIBRARIES,
  ...GRADE_38_LIBRARIES,
  ...AP_LIBRARIES,
};

// Drop null entries (years before the course launched) and strip undefined statuses.
for (const lib of Object.values(libraries)) {
  lib.exams = lib.exams.filter(Boolean);
  for (const ex of lib.exams) {
    if (ex.status == null) delete ex.status;
  }
}

const payload = {
  generatedAt: NOW_ISO,
  version: "1.0",
  notice: "Curated links to PUBLIC past-exam PDFs hosted by their original publishers. The arcade does NOT host or redistribute these PDFs — every entry is a direct link to NYSED (nysedregents.org) or College Board (apcentral.collegeboard.org). If a link 404s, the publisher rotated the URL; please report so we can update.",
  sources: {
    regents: "https://www.nysedregents.org/",
    grade38: "https://www.nysedregents.org/elementary-intermediate.html",
    ap: "https://apcentral.collegeboard.org/",
  },
  libraries,
};

// --------- Optional URL validation ---------
async function validate() {
  console.log("[validate] probing URLs via curl -r 0-0 …");
  let total = 0, ok = 0, fail = 0;
  for (const [key, lib] of Object.entries(libraries)) {
    for (const ex of lib.exams) {
      const urls = [ex.examUrl, ex.scoringGuideUrl].filter(Boolean);
      for (const u of urls) {
        total++;
        try {
          const out = execSync(
            `curl -s -L -A '${UA}' -r 0-0 -o /dev/null -w '%{http_code} %{content_type}' '${u}'`,
            { stdio: ["ignore", "pipe", "ignore"], timeout: 12000 }
          ).toString();
          const isPdf = /^(200|206) .*application\/pdf/.test(out);
          const isHtml = /^200 .*text\/html/.test(out);   // CB pages
          if (isPdf || isHtml) ok++;
          else { fail++; console.log(`  FAIL ${out.trim()}  [${key}] ${u}`); }
        } catch (e) {
          fail++;
          console.log(`  FAIL (network) [${key}] ${u}`);
        }
      }
    }
  }
  console.log(`[validate] ${ok}/${total} OK (${fail} failures)`);
}

// --------- Main ---------
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2) + "\n");
const courseCount = Object.keys(libraries).length;
let entryCount = 0;
for (const lib of Object.values(libraries)) entryCount += lib.exams.length;
console.log(`[build] wrote ${OUTPUT}`);
console.log(`[build] ${courseCount} courses · ${entryCount} exam entries`);

if (process.argv.includes("--validate")) {
  await validate();
}
