# Stimulus Document Audit · 2026-05-10

## Headline numbers

| Metric | Count |
|--------|-------|
| Total stimulus references found (all data sources) | 1,714 |
| Unique paths after deduplication | 928 |
| Total stimulus assets on disk (jpg + webp) | 1,253 |
| AP form pages (dynamic `.webp`, not in string refs) | 181 |
| Broken references (file not found on disk) | **0** |
| Gap pages in numeric range (not digitized) | ~110 across 24 admins |
| Any reference pointing to a gap page | **0** |
| `officialPage` metadata → gap page | **0** |
| page-01 (cover/directions) references | **0** |
| page-01 files on disk | **0** (intentional) |
| Orphaned assets (on disk, never referenced) | 31 |
| Gauntlet quarantined questions | 99 / 510 (19.4 %) |

---

## Broken references (priority HIGH — these break the platform)

**None found.**

All 1,714 `stimulusImages[].src` entries across `data/regents-released-practice-exams.json`,
`data/regents-gauntlet-bank.json`, and `data/chrono-defense-bank.json` resolve to files that
physically exist on disk.

All 6 AP forms verified: the `ap-practice-exam` game constructs paths dynamically via
`` `../../assets/ap-released-forms/${formId}/page-${String(page).padStart(3,"0")}.webp` ``
using `questionPageRanges` and `writingPages` from `data/ap-official-practice-exams.json`.
Every page number referenced by any form's ranges is present on disk.

---

## Suspect references (priority MEDIUM — may be instruction/directions pages)

### page-01 (cover page)
No admin folder contains `page-01.jpg` and no question references one. This is correct:
the cover/directions page is intentionally excluded from all digitized sets.

### Early MCQ pages (page-02 through page-05)
228 stimulus entries reference pages 02–05. These are **valid** — all Regents exams start
questions on page 2. No issue.

### Unusual MCQ-range gaps — pages missing within the Part I question zone

| Admin | Gap page(s) in MCQ zone | Any question references it? |
|-------|--------------------------|------------------------------|
| `global-august-2025` | page-06 | No |
| `us-january-2025` | page-07, page-08 | No |

These pages are absent from disk (likely a scan omission) but are never referenced by
any question. Platform is not affected.

### Part II/III directions pages — present on disk, never referenced

For `global-january-2026` and `us-january-2026` only, full-page scans of the writing section
were digitized. These pages are NOT referenced by any question because the writing-section
documents are served instead from the individual doc-crop folders (`global-jan2026/`,
`us-jan2026/`).

| File | Inferred content | Referenced? |
|------|------------------|-------------|
| `regents-released-forms/global-january-2026/page-17.jpg` | Part II directions header | No |
| `regents-released-forms/global-january-2026/page-18.jpg` | CRQ Set 1 Doc 1 (dup of global-jan2026/) | No |
| `regents-released-forms/global-january-2026/page-21.jpg` | CRQ Set 2 Doc 1 (dup) | No |
| `regents-released-forms/global-january-2026/page-22.jpg` | CRQ Set 2 Doc 2 (dup) | No |
| `regents-released-forms/global-january-2026/page-25–29.jpg` | EIE essay docs (dup) | No |
| `regents-released-forms/us-january-2026/page-18–30.jpg` | US writing section pages (dup) | No |

page-17 (Global) is the most likely "instructions page" candidate. It is on disk but
causes no errors because nothing references it.

---

## Gauntlet quarantined questions (priority HIGH — question bank data quality)

These 99 questions carry a `sourceIntegrity` flag that excludes them from gameplay via
`usableRegentsQuestion()`. They represent **lost playable content**, not runtime errors.

### 42 `quarantined-missing-stimulus-asset` — source-based questions with no image

These questions require a primary-source stimulus (passage, cartoon, map) but the image
was never digitized into the gauntlet stimuli folder.

| Course | Day | Count | Sample question IDs |
|--------|-----|-------|---------------------|
| Grade 11 U.S. History | Day 1 | 6 | us-day1-3, us-day1-5, us-day1-9, us-day1-10, us-day1-21, us-day1-25 |
| Grade 11 U.S. History | Day 2 | 8 | us-day2-6, us-day2-12, us-day2-16, us-day2-19, us-day2-21, us-day2-22, us-day2-24, us-day2-40 |
| Grade 11 U.S. History | Day 3 | 10 | us-day3-3, us-day3-5, us-day3-11, us-day3-18, us-day3-19, us-day3-22, us-day3-25, us-day3-42, us-day3-45, us-day3-46 |
| Grade 11 U.S. History | Day 4 | 12 | us-day4-5, us-day4-11, us-day4-19, us-day4-21, us-day4-22, us-day4-24, us-day4-26, us-day4-30, us-day4-32, us-day4-38, us-day4-45, us-day4-49 |
| Grade 11 U.S. History | Day 5 | 5 | us-day5-14, us-day5-28, us-day5-34, us-day5-40, us-day5-49 |
| Grade 10 Global History II | Day 5 | 1 | global-day5-43 |

Stem patterns reveal the expected stimulus type:

- "Which document includes this **passage**?" → missing text extract
- "What is the most accurate title for this **map**?" → missing map image
- "What is the main idea of the **cartoon**?" → missing political cartoon
- "The **court case discussed in this passage** was important…" → missing passage

US History is disproportionately affected (41 of 42). The stimuli for these questions
exist in released exam PDFs but were never individually cropped and added to
`assets/regents-gauntlet-stimuli/us-day1/` through `us-day5/`.

### 57 `quarantined-duplicate-stimulus-asset` — same image used by multiple questions

| Course | Day | Count | Sample question IDs |
|--------|-----|-------|---------------------|
| Grade 10 Global History II | Day 1 | 2 | global-day1-46, global-day1-47 |
| Grade 10 Global History II | Day 2 | 6 | global-day2-4, global-day2-5, global-day2-31, global-day2-32, global-day2-43, global-day2-44 |
| Grade 10 Global History II | Day 3 | 6 | global-day3-7, global-day3-8, global-day3-18, global-day3-19, global-day3-44, global-day3-45 |
| Grade 10 Global History II | Day 4 | 4 | global-day4-26, global-day4-27, global-day4-34, global-day4-35 |
| Grade 10 Global History II | Day 5 | 2 | global-day5-24, global-day5-25 |
| Grade 11 U.S. History | Day 1 | 6 | us-day1-18, us-day1-23, us-day1-26, us-day1-28, us-day1-35, us-day1-40 |
| Grade 11 U.S. History | Day 2 | 2 | us-day2-25, us-day2-29 |
| Grade 11 U.S. History | Day 3 | 15 | us-day3-1, us-day3-13, us-day3-17, us-day3-29, us-day3-31, us-day3-34, us-day3-35, us-day3-36, us-day3-39, us-day3-41, us-day3-43, us-day3-47, us-day3-48, us-day3-50, us-day3-51 |
| Grade 11 U.S. History | Day 4 | 10 | us-day4-1, us-day4-9, us-day4-13, us-day4-28, us-day4-37, us-day4-39, us-day4-41, us-day4-42, us-day4-46, us-day4-47 |
| Grade 11 U.S. History | Day 5 | 4 | us-day5-1, us-day5-2, us-day5-46, us-day5-48 |

These questions have a valid image in a gauntlet stimulus folder, but the same physical
image file is shared with another question. The quarantine prevents presenting the same
document to a student twice in a single session.

---

## Orphaned assets (priority LOW — wasted storage, no runtime impact)

### Released-forms: 19 orphaned page scans

Full-page scans of the writing section exist for the two most recent exams only.
They are superseded by individually-cropped document images in the `*-jan2026/` special folders.

| File | Why orphaned |
|------|--------------|
| `regents-released-forms/global-january-2026/page-17.jpg` | Part II header; no question uses it |
| `regents-released-forms/global-january-2026/page-18.jpg` | Same content as `global-jan2026/global-crq-set1-doc1.jpg` |
| `regents-released-forms/global-january-2026/page-21.jpg` | Same content as `global-jan2026/global-crq-set2-doc1.jpg` |
| `regents-released-forms/global-january-2026/page-22.jpg` | Same content as `global-jan2026/global-crq-set2-doc2.jpg` |
| `regents-released-forms/global-january-2026/page-25.jpg` | Same content as `global-jan2026/global-eie-doc1.jpg` |
| `regents-released-forms/global-january-2026/page-26.jpg` | Same content as `global-jan2026/global-eie-doc2.jpg` |
| `regents-released-forms/global-january-2026/page-27.jpg` | Same content as `global-jan2026/global-eie-doc3.jpg` |
| `regents-released-forms/global-january-2026/page-28.jpg` | Same content as `global-jan2026/global-eie-doc4.jpg` |
| `regents-released-forms/global-january-2026/page-29.jpg` | Same content as `global-jan2026/global-eie-doc5.jpg` |
| `regents-released-forms/us-january-2026/page-18.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-19.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-21.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-22.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-25.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-26.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-27.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-28.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-29.jpg` | Same content as `us-jan2026/` doc crops |
| `regents-released-forms/us-january-2026/page-30.jpg` | Same content as `us-jan2026/` doc crops |

### Gauntlet: 12 orphaned stimulus image files

These are second-page crops (`-02.jpg`) or partial images that are neither referenced by
any question's `stimulusImages` array nor listed in any manifest `.json` file.

| File | Note |
|------|------|
| `regents-gauntlet-stimuli/us-day1/stimulus-09-02.jpg` | stimulus-09 not used by any question |
| `regents-gauntlet-stimuli/us-day1/stimulus-15-02.jpg` | stimulus-15 not used by any question |
| `regents-gauntlet-stimuli/us-day1/stimulus-16-02.jpg` | stimulus-16 used by us-day1-34 (page-01 only) |
| `regents-gauntlet-stimuli/us-day2/stimulus-09-02.jpg` | stimulus-09 used by us-day2-20 (page-01 only) |
| `regents-gauntlet-stimuli/us-day2/stimulus-11-02.jpg` | stimulus-11 not used by any question |
| `regents-gauntlet-stimuli/us-day2/stimulus-13-01.jpg` | stimulus-13 not used by any question |
| `regents-gauntlet-stimuli/us-day3/stimulus-21-02.jpg` | stimulus-21 not used by any question |
| `regents-gauntlet-stimuli/us-day4/stimulus-19-02.jpg` | stimulus-19 not used by any question |
| `regents-gauntlet-stimuli/us-day4/stimulus-24-02.jpg` | stimulus-24 not used by any question |
| `regents-gauntlet-stimuli/us-day5/stimulus-04-02.jpg` | stimulus-04 used by us-day5-7 (page-01 only) |
| `regents-gauntlet-stimuli/us-day5/stimulus-07-01.jpg` | stimulus-07 not used by any question |
| `regents-gauntlet-stimuli/us-day5/stimulus-12-02.jpg` | stimulus-12 used by us-day5-30 (page-01 only) |

---

## Stimulus availability per administration

### Regents Released Forms (`assets/regents-released-forms/`)

| Admin folder | Format | Pages present | Gaps in range |
|---|---|---|---|
| global-august-2019 | page-NN.jpg | 22 (02–29) | page-16, 18–20, 23–24 |
| global-august-2022 | page-NN.jpg | 23 (02–30) | page-14, 19–21, 23, 25 |
| global-august-2023 | page-NN.jpg | 24 (02–30) | page-19–21, 24–25 |
| global-august-2024 | page-NN.jpg | 23 (02–30) | page-16, 19–21, 24–25 |
| global-august-2025 | page-NN.jpg | 22 (02–29) | **page-06**, 16, 19–20, 23–24 |
| global-jan2026 | doc-named .jpg | 9 files | n/a (doc crops, no page numbering) |
| global-january-2020 | page-NN.jpg | 22 (02–29) | page-16, 18–20, 23–24 |
| global-january-2023 | page-NN.jpg | 19 (02–24) | page-12, 15–16, 19 |
| global-january-2024 | page-NN.jpg | 24 (02–29) | page-19–20, 23–24 |
| global-january-2025 | page-NN.jpg | 25 (02–30) | page-18, 21–22, 25 |
| global-january-2026 | page-NN.jpg | 24 (02–29) | page-19–20, 23–24 |
| global-june-2019 | page-NN.jpg | 22 (02–29) | page-16, 18–20, 23–24 |
| global-june-2022 | page-NN.jpg | 23 (02–30) | page-16, 19–22, 25 |
| global-june-2023 | page-NN.jpg | 24 (02–30) | page-14, 20–22, 25 |
| global-june-2024 | page-NN.jpg | 20 (02–25) | page-15–16, 19–20 |
| global-june-2025 | page-NN.jpg | 24 (02–29) | page-19–20, 23–24 |
| us-august-2023 | page-NN.jpg | 25 (02–30) | page-17, 20, 23–24 |
| us-august-2024 | page-NN.jpg | 24 (02–27) | page-16, 21 |
| us-august-2025 | page-NN.jpg | 23 (02–29) | page-15, 18, 21–23 |
| us-jan2026 | doc-named .jpg | 10 files | n/a |
| us-january-2024 | page-NN.jpg | 24 (02–28) | page-16, 21–22 |
| us-january-2025 | page-NN.jpg | 22 (02–30) | **page-07–08**, 16–17, 20, 23–24 |
| us-january-2026 | page-NN.jpg | 25 (02–30) | page-17, 20, 23–24 |
| us-june-2023 | page-NN.jpg | 23 (02–28) | page-15, 18, 21–22 |
| us-june-2024 | page-NN.jpg | 23 (02–28) | page-15, 18, 21–22 |
| us-june-2025 | page-NN.jpg | 22 (02–29) | page-14–15, 18, 21–22, 27 |

**Bold** gaps are in the MCQ zone (pages 2–16) and unusual; all others are in the
writing/essay section (pages 17+). No question references any gap page.

### Regents Gauntlet Stimuli (`assets/regents-gauntlet-stimuli/`)

| Folder | JPG files | Manifest JSONs | Day 6 note |
|--------|-----------|---------------|------------|
| global-day1 | 60 | 28 | — |
| global-day2 | 53 | 27 | — |
| global-day3 | 59 | 27 | — |
| global-day4 | 51 | 27 | — |
| global-day5 | 51 | 26 | — |
| global-day6 | 11 | 0 | Jan 2026 official import; no manifest needed |
| us-day1 | 34 | 20 | — |
| us-day2 | 35 | 21 | — |
| us-day3 | 51 | 28 | — |
| us-day4 | 49 | 25 | — |
| us-day5 | 19 | 17 | — |
| us-day6 | 28 | 0 | Jan 2026 official import; no manifest needed |

### AP Released Forms (`assets/ap-released-forms/`)

| Folder | Format | Pages | Range |
|--------|--------|-------|-------|
| apush-2017-ced-practice | .webp | 30 | 008–037 |
| ap-world-ced-practice | .webp | 37 | 008–044 |
| ap-euro-ced-practice | .webp | 37 | 008–044 |
| ap-psych-2012-practice | .webp | 25 | 019–043 |
| ap-macro-2012-practice | .webp | 23 | 020–042 |
| ap-micro-2012-practice | .webp | 29 | 020–048 |

All 181 pages are loaded dynamically; all verified present.

---

## Per-game stimulus health summary

| Game | Data source | Total stim refs | Broken | Quarantined |
|------|-------------|-----------------|--------|-------------|
| `regents-practice-exam` | `regents-released-practice-exams.json` | 1,032 | 0 | n/a |
| `regents-gauntlet` | `regents-gauntlet-bank.json` | 341 | 0 | 99 Qs excluded |
| `chrono-defense` | `chrono-defense-bank.json` | 341 (shared w/ gauntlet) | 0 | 99 Qs excluded |
| `ap-practice-exam` | `ap-official-practice-exams.json` | 181 webp (dynamic) | 0 | n/a |
| All other games | (no stimulus refs found) | 0 | 0 | n/a |

No game.js file contains inline (hard-coded) stimulus paths.
All paths originate in the data JSON files or are constructed dynamically.

---

## Recommendations

### Priority 1 — Data quality: restore quarantined gauntlet questions

**42 questions** (`quarantined-missing-stimulus-asset`) are permanently excluded from gameplay
because their primary-source image was never digitized. These are real Regents questions that
students cannot see.

Recommended fix: crop the source image from the corresponding released exam PDF for each
quarantined question and save to the appropriate `assets/regents-gauntlet-stimuli/us-dayN/`
folder, then set `sourceIntegrity` to `trusted-official-stimulus-verified` and add the
`stimulusImages` entry pointing to the new file.

US History Days 1–5 have the most impact (41 questions). Prioritize US History Day 3 (10 Qs)
and Day 4 (12 Qs) first for greatest per-session coverage gain.

### Priority 2 — Data quality: resolve quarantined duplicate stimuli

**57 questions** (`quarantined-duplicate-stimulus-asset`) are excluded because they share an
image with another question. Resolution options:
- If the questions genuinely share the same source document, re-crop each as a distinct named
  file (e.g. `stimulus-16-doc1.jpg` vs `stimulus-16-doc2.jpg`) and update `stimulusImages`.
- If the questions are truly independent and the shared image is just a scan coincidence,
  verify and re-flag as `trusted-official-stimulus-verified`.

### Priority 3 — MCQ-range gap pages: scan verification

Three pages are missing from within the expected MCQ scan range:
- `global-august-2025/page-06.jpg`
- `us-january-2025/page-07.jpg`
- `us-january-2025/page-08.jpg`

No question references them today, but this suggests a missed scan. Pull the original PDF
and verify whether those pages carry MCQ content. If they do, digitize them and add any
covered questions to the bank.

### Priority 4 — Orphaned page scans: cleanup (optional)

The 19 orphaned full-page scans in `global-january-2026/` and `us-january-2026/` (pages 17+)
are superseded by the individual doc crops. They can be deleted to reduce repo size by ~3–5 MB.
Not urgent — zero runtime impact.

The 12 orphaned gauntlet stimulus files are second-page crops that were never wired up.
Verify whether any should be added to a question's `stimulusImages` array (e.g. as a
second page of a two-page document); delete the rest.

### Priority 5 — AP forms: no action required

All 181 AP `.webp` pages are present and all `questionPageRanges` are satisfied.

---

## Methodology notes

- Scanned: `data/regents-released-practice-exams.json` (1,947 KB), `data/regents-gauntlet-bank.json`
  (930 KB), `data/chrono-defense-bank.json`, `data/ap-official-practice-exams.json`
- Disk walk: `assets/regents-released-forms/` (571 jpg), `assets/regents-gauntlet-stimuli/`
  (501 jpg + manifest json), `assets/ap-released-forms/` (181 webp)
- AP dynamic paths reconstructed from `questionPageRanges` and `writingPages` in every form
- All 1,714 `stimulusImages[].src` paths normalized and checked against `os.walk` of `assets/`
- `officialPage` field on all 1,373 entries verified: 0 mismatches vs filename page number
- Generated 2026-05-10 via automated Python scan
