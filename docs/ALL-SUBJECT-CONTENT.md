# All-Subject Content System

The arcade now treats content as a generated system with three layers:

1. **Arcade questions** generated into `data/bank-fragments/all-subject-*.json`, plus social-studies Jeopardy-derived fragments in `data/bank-fragments/jeopardy-derived-*.json`, and compiled into `assets/shared-question-bank.js`.
2. **Cataloged unit Jeopardy boards** generated into `data/generated-jeopardy-index.json` plus course shards under `data/generated-jeopardy-boards/`, with the full `data/generated-all-subject-jeopardy-blueprints.json` kept as a validation artifact.
3. **Practice-exam blueprints and source packets** generated into `data/generated-practice-exam-blueprints.json` plus zoomable page assets in `assets/generated-practice-pages/`.

The generated catalog is now exposed in the actual hub UI, not just in data files:

- Library course filter
- Jeopardy course selector
- Profile and first-run course pickers
- Cram Mode course picker
- Horizontal course rail
- Course-specific practice launch cards for generated courses
- `games/generated-jeopardy/` board runner for generated unit-board entries with typed responses, answer checking, Daily Double, and Final Jeopardy
- `games/generated-practice-exam/` practice runner for generated course and unit practice entries with zoomable source pages

The source of truth is `scripts/generate-all-subject-content.mjs`. Run:

```bash
npm run content:all-subjects
npm run validate:content
```

## Coverage Boundary

V1 uses NYSED P-12 standards content areas for non-AP courses and the College Board AP Courses and Exams catalog for AP courses. This avoids inventing local district elective titles while still covering the subjects students are likely to encounter from grades 5-12.

The current course-depth pass adds a stronger V2 floor:

- 90 generated non-social-studies/NYS/AP course blueprints
- 1,992 generated unit-by-unit Jeopardy boards: Review, Challenge, and Final Sprint variants for each generated unit
- 90 generated course practice-exam blueprints plus unit-level practice entries in the main catalog
- 360 generated zoomable course source packet pages
- 2,967 catalog entries in `games.json`
- 22,042 compiled arcade questions across 99 total course buckets after merging existing social-studies banks and Jeopardy-derived social-studies prompts
- 3,926 social-studies arcade prompts generated from the mature named Jeopardy boards, preserving their explanations and unit/category fit
- At least 18 generated questions per unit for every generated course
- Generally 160+ questions for NYS/non-AP courses and 180+ questions for AP/AP Career Kickstart courses

## Released Assessment Policy

Released NYSED Regents and Grades 3-8 tests are authoritative sources for practice-exam structure and metadata. General arcade trivia may use released-test patterns, but exact released exam items and source images should stay separated in the dedicated practice-exam systems.

Current released-source lanes:

- NYSED Grades 3-8 ELA, Mathematics, and Science released questions
- NYSED Regents Algebra I, Geometry, Algebra II, ELA, Earth Science, Living Environment, Chemistry, Physics, Global History and Geography II, and U.S. History and Government
- Existing exact released-form runners for Global II and U.S. History
- Existing public AP practice-form runner for AP courses with public College Board PDFs registered in `data/ap-official-practice-exams.json`

## Quality Gates

`npm run validate:content` checks:

- NYSED standards-area coverage
- grade 5-8 ELA/math/science coverage
- high-school ELA/math/science coverage
- at least 42 AP/AP Career Kickstart course buckets
- minimum question counts: 144+ per generated NYS bucket, 180+ per generated AP bucket, and at least 18 questions per generated unit
- answer-letter distribution and no obvious answer-key streaks
- answer shape and explanation quality
- standards/source metadata on every generated question
- Jeopardy board shape: 5 categories x 5 clues + exactly one Daily Double + Final, with no old answer-leaking clue frame
- practice blueprint sections, units, released-source mode, unit-level sampling, written-response tasks, and generated source page assets
- thousands-scale `games.json` catalog exposure so generated boards and practice forms are visible surfaces, not hidden blueprints
- social-studies Jeopardy-derived arcade-bank fragments, with source-board explanations and course mapping intact
