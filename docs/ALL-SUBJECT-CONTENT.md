# All-Subject Content System

The arcade now treats content as a generated system with three layers:

1. **Arcade questions** generated into `data/bank-fragments/all-subject-*.json` and compiled into `assets/shared-question-bank.js`.
2. **Unit Jeopardy blueprints** generated into `data/generated-all-subject-jeopardy-blueprints.json`.
3. **Practice-exam blueprints** generated into `data/generated-practice-exam-blueprints.json`.

The source of truth is `scripts/generate-all-subject-content.mjs`. Run:

```bash
npm run content:all-subjects
npm run validate:content
```

## Coverage Boundary

V1 uses NYSED P-12 standards content areas for non-AP courses and the College Board AP Courses and Exams catalog for AP courses. This avoids inventing local district elective titles while still covering the subjects students are likely to encounter from grades 5-12.

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
- minimum question counts: 40 per NYS bucket, 60 per AP bucket
- answer shape and explanation quality
- standards/source metadata on every generated question
- Jeopardy blueprint shape: 5 categories x 5 clues + Final
- practice blueprint sections, units, and released-source mode
