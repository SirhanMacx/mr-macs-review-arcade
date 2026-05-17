# Agent contributor guide

**Read [`ARCADE_FORMAT_SPEC.md`](ARCADE_FORMAT_SPEC.md) first. Always.**

Every new course, board, exam, or arcade game added to this repo must match the format described there. The spec is the single source of truth. Drift from the spec gets rejected by `scripts/audit-format-compliance.mjs`.

## Quick rules

1. **Course inclusion** — only add courses that have an MCQ-based standardized exam (NYS Regents, NYS Grade 3-8 State Test, AP MCQ exam). Portfolio APs, Capstone APs, and non-test electives stay out.
2. **Canonical course label** — match exactly across Jeopardy, Practice Exam, and bank fragment entries. See spec §2 for the list.
3. **`gameType` is exactly one of three** — `Jeopardy`, `Practice Exam`, `Arcade`. Nothing else.
4. **Clone the gold-standard templates**:
   - Jeopardy: `games/global-10-units/01 - World in 1750 Jeopardy Review.html`
   - Practice exam: `games/regents-global-2/practice-exam.html`
5. **Original content only** — never reproduce copyrighted exam items, textbook passages, or commercial materials. Reference public-domain facts (named figures, dates, scientific/mathematical concepts, classical literature pre-1929).
6. **Required scaffolding** in every practice exam: `QUESTIONS.forEach((q) => { q.correctIdx = q.choices.indexOf(q.correctText); });` immediately after the `QUESTIONS` array.
7. **Required scaffolding** in every Jeopardy board: `const TOTAL_CLUES = (GAME.categories || []).reduce((n, c) => n + ((c.clues || []).length), 0);` right after `const GAME`.
8. **No `sourceClue`/`sourceExplanation`/`rigor` keys** on clue objects — these are template-build leftovers and get auto-stripped.
9. **Thumbnails** — exactly one per bucket (Jeopardy → `category-tile-jeopardy.webp`, Practice Exam → `category-tile-practice.webp`, Arcade → `category-tile-arcade.webp`). No per-board generated thumbnails.
10. **Bump `service-worker.js` `CACHE_NAME`** on every commit that touches user-facing files. Otherwise students keep seeing stale content forever.

## Pre-commit checklist

Run all six and confirm clean before pushing:

```bash
node scripts/audit-format-compliance.mjs    # blocks push on errors
node scripts/audit-jeopardy-boards.mjs       # board structural integrity
node scripts/audit-practice-exams.mjs        # practice exam integrity
node scripts/audit-hub-links.mjs             # broken refs / thumbnails
node scripts/e2e-smoke-test.mjs              # parse + chrome + assets
node scripts/build-shared-question-bank.mjs  # rebuild bank if fragments changed
```

## What NOT to do

- Don't add a 4th cabinet folder. Don't add a "Daily Run" or "Flagship" or "Featured" or "Premium" lobby section. The three folders are fixed.
- Don't generate PDF study guides from our own practice exams — the `📚 View Past Exams (PDFs)` button surfaces real public NYSED + College Board PDFs from `data/public-exam-library.json` instead.
- Don't ship a per-board thumbnail file. Unified thumbnails are intentional (set 2026-05-16).
- Don't call the raw shared bank directly in a render path. Every arcade game routes through `window.MrMacsPickValidQuestion()` in `assets/arcade-question-validator.js` for defense-in-depth + session dedup.
- Don't bypass the audit scripts. If they flag a real problem, fix the source — don't loosen the check.

## When to update the spec itself

Only when the platform direction genuinely changes (e.g. a new course-inclusion rule, a new content shape, a fourth bucket). Update `ARCADE_FORMAT_SPEC.md` AND the corresponding section of `scripts/audit-format-compliance.mjs` in the same commit so they stay in lockstep.
