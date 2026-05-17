# Mr. Mac's Review Arcade — Canonical Format Spec

**Read this before adding any course, board, exam, or arcade game.** This is the single source of truth. New work that doesn't match this spec gets rejected by `scripts/audit-format-compliance.mjs`.

Last canonical sweep: 2026-05-17. Current state: **713 hub entries · 545 Jeopardy boards · 52 practice exams · 14,063-Q arcade bank · 65 course banks · SW v97**.

---

## 1. Course inclusion criteria

A course is eligible for the hub **only if** it has an MCQ-based standardized exam:

- **NYS Regents** (HS, June/Jan): Global History II, US History & Government, Living Environment, Earth Science, Chemistry, Physics, Algebra I, Algebra II, Geometry, Common Core ELA, LOTE (currently not surfaced)
- **NYS Grade 3-8 State Tests** (spring): ELA + Math (G5-8), Grade 5/8 Science, Grade 8 Social Studies
- **AP exams with Section I MCQ** (May): every AP except portfolio (2-D/3-D Art, Drawing) and Capstone (Research, Seminar)

**Excluded** (do not add): portfolio APs, AP Capstone, NYS non-test electives (Health, PE, Music, Visual Arts, Dance, Theater, Tech Ed, CDOS, FCS, Media Arts, Media Literacy, Personal Finance, Statistics & Data Science non-AP, MS/HS Computer Science + Digital Fluency), generic LOTE Checkpoints A/B/C.

---

## 2. Canonical course label

Every entry's `course` field must match the canonical label (single source of truth — match exactly across Jeopardy, Practice Exam, and bank fragment entries). Examples:

| Use this | NOT this |
|---|---|
| `AP United States History` | APUSH · AP US History |
| `AP World History: Modern` | AP World · AP WH |
| `AP U.S. Government and Politics` | AP US Government · AP USGov |
| `AP Physics 1` | AP Physics 1: Algebra-Based |
| `AP Physics C Mechanics` | AP Physics C: Mechanics |
| `AP Physics C E&M` | AP Physics C: Electricity and Magnetism |
| `PreCalculus` | AP Precalculus · Precalculus |
| `Grade 10 Global History II` | Global 10 · Global History II |
| `Grade N Math` (N=5,6,7,8) | Grade N Mathematics |
| `Grade N ELA` (N=9,10,11,12) | English 9-12 |
| `Living Environment` | Life Science: Biology |
| `Earth and Space Sciences` | Earth Science Regents |

---

## 3. Jeopardy board shape

### File location + naming
`games/<course-slug>/NN - <Unit Title> Jeopardy Review.html`
where `NN` = `01` through `99` (`99` is reserved for "Cumulative Yearlong").

### HTML chrome (clone exactly)
**Source template:** `games/global-10-units/01 - World in 1750 Jeopardy Review.html` (2134 lines).

Required structural elements:
- `<!doctype html>` + `<title>` matching the unit
- Arcade-cabinet CSS (CRT scanlines, marquee, kicker, panel art) — never strip
- `<div class="titleblock"><div class="kicker"><span>Unit N</span><span>{COURSE} Review</span></div><h1>{UNIT TITLE}</h1><p class="subtitle">{SUBTITLE}</p></div>`
- `<span class="pill" id="progressStatus">0 of 0 clues complete</span>` (JS overwrites with dynamic count)
- `const GAME = {...};` JSON object (see schema below)
- `const TOTAL_CLUES = (GAME.categories || []).reduce((n, c) => n + ((c.clues || []).length), 0);` right after GAME

### `const GAME = {...}` schema

```js
const GAME = {
  slug: "<course-slug>-<unit-slug>",          // unique per board
  file: "<NN> - <Unit Title> Jeopardy Review.html",
  day: "Unit N",                              // or "Cumulative"
  title: "<Unit Title>",
  subtitle: "A NYS standards-aligned Jeopardy review game for <Course>, with auto scoring, explanations, Daily Double, and Final Wager.",
  exam: "<Course> Exam Review",               // OR "NYS <Subject> Regents Review"
  palette: { accent, accent2, accent3, glow, tile, tile2 },
  assetSet: "global",
  standards: ["NYS standard refs or AP CED"],
  tokens: ["3-6 quick anchor terms"],
  categories: [
    {
      name: "<Category Name>",                // ≥ 4 chars, no template gibberish like "X Integration"
      clues: [
        { value: 100, clue: "...", answer: "...", aliases: ["..."], explanation: "350-520 chars original prose citing real names/dates/standards", daily: false },
        { value: 200, ... },
        { value: 300, ... },                  // exactly one clue per row 100/200/300/400/500
        { value: 400, ... },
        { value: 500, ... }
      ]
    },
    // exactly 5 categories, each with exactly 5 clues
  ],
  final: {
    category: "<Final category name>",
    clue: "...",                              // ≥ 20 chars
    answer: "...",
    aliases: ["..."],
    explanation: "350-520 chars synthesis"
  }
};
```

**Forbidden keys** on clue objects: `sourceClue`, `sourceExplanation`, `rigor` (auto-stripped by `scripts/audit-jeopardy-boards.mjs`).

### Content rules
- All clue text, answers, and explanations must be **original prose** authored from curriculum knowledge of public-domain facts (named figures, dates, scientific/mathematical concepts, classical literature pre-1929).
- **NEVER** reproduce or paraphrase items from copyrighted AP exams, state-test materials, or commercial textbooks.
- Explanations should be 350-520 chars, cite specific real-world anchors (scientists, dates, NYS ESRT pages, AP CED skills), end with a Regents/AP pedagogy hook.
- Forbidden template phrases (auto-detected): `named anchor`, `is a core idea`, `Synthesis response linking`, `Foundational idea students identify`, `regents-style item`, `For [Subject], this term describes`, `Use the [Subject] unit "X" to answer`, `this term describes the structure`, `Which review target belongs`, `is the right term because it describes`, `one-response target rather than an open essay`, `distractors that use the right words in the wrong scale`.

---

## 4. Practice Exam shape

### File location
`games/<course-slug>-practice/practice-exam.html`
(or `games/regents-<subject>/practice-exam.html` for NYS Regents)

### HTML chrome (clone exactly)
**Source template:** `games/regents-global-2/practice-exam.html` (2526 lines, "Practice Exam · NYS Global History II" flagship).

Required:
- Title block with `Practice Exam · <Course>` kicker, `<Course> Practice Exam` h1, course-appropriate subtitle
- `const QUESTIONS = [...]` with 30-45 items
- `QUESTIONS.forEach((q) => { q.correctIdx = q.choices.indexOf(q.correctText); });` immediately after the array
- `const STORAGE_KEY = "<course-slug>-practice-exam-state-v1";` (unique per course)
- `📚 View Past Exams (PDFs)` button on both intro + results screens (wired to `MrMacPastExams.open('<course-key>')` from `assets/arcade-past-exam-library.js`)
- `@media print` block + `<section id="printableExam" class="print-only"></section>` (the printable study guide layer is preserved but not user-promoted)

### Question shape

```js
{
  id: "<prefix>-001",          // unique sequential; prefix matches course (e.g. apush-001, alg1-001, es-001)
  topic: "Unit X: <topic name>",  // groups results by topic on the mastery screen
  prompt: "...",                // ≥ 10 chars
  choices: ["A", "B", "C", "D"], // exactly 4 strings; each ≥ 4 chars (or numeric for calc Qs)
  correctText: "...",           // must match one of choices exactly
  explanation: "..."            // ≥ 10 chars, 1-2 sentences citing the rule/concept/standard
}
```

### Content rules
- Original wording only — NO reproduction of AP exam or NYSED Regents items
- For ELA: reading passages must be your own original prose OR pre-1929 public-domain works
- Distribution must match the real exam's unit weights (per CED for AP, per Regents framework for NYS)

---

## 5. games.json entry shape

```json
{
  "id": "<unique-slug>",
  "title": "<short display title>",
  "course": "<canonical course label — see §2>",
  "subject": "<Social Studies | Science | Mathematics | English | Computer Science | World Languages | Music | Art History | ...>",
  "grade": "<5-12 | AP>",
  "file": "games/<dir>/<filename>",
  "day": "<Unit N | Cumulative | Practice Exam>",
  "gameType": "<Jeopardy | Practice Exam | Arcade>",   // EXACTLY one of these three
  "clueCount": <int>,
  "hasFinal": <bool>,
  "thumbnail": "assets/cabinet/category-tile-jeopardy.webp",   // or category-tile-practice.webp for exams, category-tile-arcade.webp for arcade
  "cardArt": "<same as thumbnail>"
}
```

Optional: `gameTypeOriginal` preserves the pre-normalization label (e.g. "Unit + AP Final") for backwards compat.

---

## 6. Bank fragment shape

For arcade question pool. File: `data/bank-fragments/all-subject-<course-slug>.json`

```json
{
  "course": "<course-slug>",
  "courseLabel": "<canonical course label>",
  "generatedBy": "scripts/<source-script>.mjs",
  "version": "<date-source>",
  "questions": [
    {
      "id": "<slug>-001",
      "course": "<course-slug>",
      "courseLabel": "...",
      "topic": "...",
      "domain": "Review",
      "subjectArea": "Review",
      "gradeBand": "Multi",
      "standardRefs": [],
      "sourceAuthority": "mr-macs-jeopardy",     // or "mr-macs-practice-exam"
      "assessmentSourceId": "jeopardy-<slug>",   // or "practice-exam-<slug>"
      "itemMode": "real-content-from-jeopardy",  // or "from-practice-exam"
      "prompt": "...",
      "choices": ["A","B","C","D"],
      "correctText": "...",
      "explanation": "..."
    }
  ]
}
```

After modifying any fragment: rebuild compiled bank with `node scripts/build-shared-question-bank.mjs`.

---

## 7. UI/UX rules

### Hub cabinet menu — **exactly 3 folders**
1. **Jeopardy Boards** (`data-cabinet-folder="jeopardy"`)
2. **Exam Practice** (`data-cabinet-folder="practice"`)
3. **Arcade Games** (`data-cabinet-folder="arcade"`)

No Daily Run, Featured Carousel, Flagship Lobby, or 4th-bucket. Anything non-Jeopardy / non-Practice-Exam is `gameType: "Arcade"`.

### Thumbnails — exactly one per bucket
- Jeopardy → `assets/cabinet/category-tile-jeopardy.webp`
- Practice Exam → `assets/cabinet/category-tile-practice.webp`
- Arcade → `assets/cabinet/category-tile-arcade.webp`

Don't generate per-board thumbnails. The unified-thumbnail rule was set 2026-05-16 (commit `b92e5ebb`).

### Service Worker
Every commit that changes user-facing content **must bump** `service-worker.js` `CACHE_NAME` (e.g. `vNN-short-tag`). The version is what clients use to invalidate stale caches. Skipping the bump = students keep seeing the old version forever.

---

## 8. Arcade defense-in-depth

Every arcade game's `pickQuestion()` must route through `window.MrMacsPickValidQuestion(pickFn, maxTries)` from `assets/arcade-question-validator.js`. This:
- Rejects template-leaked items (12 fingerprint phrases)
- Rejects structurally broken Qs (missing choices, empty, mismatched correctText)
- Tracks the last 80 prompts per session and prefers fresh Qs
- Falls back to allow-repeat after 25 retries

Never call the raw bank directly in a render path. The validator is the choke point.

---

## 9. Past-exam library

`data/public-exam-library.json` holds 487 validated PDF URLs (NYSED Regents + College Board AP CED + released items). Every practice exam's intro/results screen surfaces these via the `📚 View Past Exams (PDFs)` button.

When adding a new course: append its NYSED or College Board URL set to the library JSON. Verify every URL with a byte-range GET before committing.

---

## 10. Scripts that enforce the format

| Script | Runs | What it catches |
|---|---|---|
| `scripts/audit-jeopardy-boards.mjs` | manual or CI | template phrases, structural defects, stripped boilerplate keys, JSON parse errors |
| `scripts/audit-practice-exams.mjs` | manual or CI | missing correctIdx normalization, duplicate prompts, empty/broken choices, template needles |
| `scripts/audit-hub-links.mjs` | manual or CI | broken file refs, missing thumbnails, content-shape issues |
| `scripts/e2e-smoke-test.mjs` | manual or CI | HTML parse, inline JS syntax, required chrome, asset resolution |
| `scripts/audit-format-compliance.mjs` | **pre-commit** | THIS SPEC: course canonical labels, 3-bucket gameType, required fields, file location convention |
| `scripts/build-shared-question-bank.mjs` | after fragment changes | rebuilds compiled bank with build-time + runtime validators |

**Run all six before any "big drop" commit.** Failing audits block the push.

---

## 11. How to add a new course (the cement)

1. **Confirm eligibility** — does it have an MCQ-based exam (NYS Regents, Grade 3-8 State Test, AP MCQ)? If no, **STOP** — don't add it.
2. **Pick the canonical course label** (see §2). Match exactly across all entries.
3. **Generate Jeopardy boards**: clone `games/global-10-units/01 - World in 1750 Jeopardy Review.html` for each unit + cumulative. Replace const GAME, titleblock, page `<title>`. Write 5 cats × 5 clues + Final per board with 350-520-char original explanations.
4. **Generate practice exam**: clone `games/regents-global-2/practice-exam.html`. Replace const QUESTIONS with 30-45 items. Update STORAGE_KEY, kicker, h1, subtitle.
5. **Wire games.json**: append entries with `gameType` in `{Jeopardy, Practice Exam, Arcade}`, canonical course label, correct thumbnail.
6. **Extract to bank**: run `node scripts/rebuild-bank-from-jeopardy.mjs` (or `scripts/extract-questions-from-practice-exams.mjs`). Rebuild compiled bank: `node scripts/build-shared-question-bank.mjs`.
7. **Append PDF library entry** in `data/public-exam-library.json` with validated URLs to past exams.
8. **Bump SW** version in `service-worker.js`. Tag identifies the change.
9. **Run all 6 audit scripts** (§10). All must pass.
10. **Commit + push**. One course = one commit (or one commit per unit for huge courses). Conventional message: `Add <Course> Jeopardy + Practice Exam · SW vNN`.

That's the format. Anything that doesn't match this gets rejected.
