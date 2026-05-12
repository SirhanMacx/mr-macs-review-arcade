# Codex Deep Audit

## Executive Summary

The arcade is now a large static GitHub Pages product: 219 catalog entries,
78 game folders, and 151 Jeopardy boards. The strongest immediate gap was asset
coverage and hub consistency: 34 catalog entries lacked WebP thumbnails and the
hub had to special-case SVG thumbnails. Documentation also lagged the current
repo size and session/analytics reality.

## Inventory

- `games.json` entries: 219.
- Unique game ids: 219.
- Missing ids / duplicate ids: none found.
- `games/` folders: 78.
- `games/*/index.html` folders: 78.
- Jeopardy boards: 151.
- Non-Jeopardy games/tools: 68.

## Current Validation Results

Baseline `python3 scripts/validate_arcade.py` failed on shared source-bank
integrity, flagship audit markers, dropdown contrast, missing thumbnails, and a
large Jeopardy-quality backlog. After this pass, normal validation passes with
a warning for the strict Jeopardy backlog. `ARCADE_STRICT_JEOPARDY=1` still
fails on 161 Jeopardy content-quality issues.

## Hub Findings

- Hub already has a strong 1989 cabinet direction but card art was inconsistent.
- Library cards used thumbnails as both image and background.
- `thumbnailFor` required a hand-maintained SVG allow-list.
- Public copy needed accurate 219-entry counts and clearer anonymous counter wording.

## Shared Module Findings

- `arcade-sessions.js` is loaded before `arcade-progress-extras.js`; docs still
  said the rich sessions module was unloaded.
- `arcade-analytics.js` is anonymous public counters, not student telemetry.
- Several older docs described local-only modules as if analytics did not exist.

## Game-by-Game Findings

- 78 game folders have an `index.html`.
- Jeopardy collection folders intentionally do not have per-folder `game.js` or
  `styles.css`; they are board collections rather than single arcade engines.
- Cold War Invaders has touch controls and weak-topic reporting but the flagship
  validator expected exact contract markers.

## Asset Findings

- Missing WebP thumbnails before implementation: 34.
- Existing generated art mixed WebP and SVG.
- No `assets/game-card-art/`, `assets/game-marquees/`, or generated art manifest existed.
- No shared cabinet asset manifest existed.

## Educational Quality Findings

- Every game card has real social-studies metadata.
- Jeopardy validation still flags many category-fit and natural-clue issues.
- The hardening script was capable of improving board rigor, but it previously
  produced category-prefixed clue wording; that behavior was patched.

## Source/Official Exam Integrity Findings

- Two shared-bank source records were out of sync with trusted Regents records.
- Some source-consuming games had validator marker gaps for source rendering and
  trusted-source gating.
- AP/Regents practice pages retain practice-estimate disclaimers.

## Accessibility Findings

- Hub card buttons use semantic buttons and lazy images.
- Select dropdown contrast was inconsistent in several game stylesheets.
- Reduced-motion support exists in the hub and major games but should remain a
  per-game shipping requirement.

## Mobile/Device Findings

- The hub is responsive and avoids dumping all 219 cards by default.
- Mobile touch controls exist for the major arcade games; some validators still
  enforce exact mobile HUD markers.
- Generated assets are small enough for Chromebooks and older iPads.

## Performance Findings

- Generated thumbnails average about 27 KB; card art about 35 KB; marquees about 31 KB.
- Hub images are lazy-loaded.
- The generator is deterministic and does not add runtime dependencies to the live site.

## Privacy and Analytics Findings

- Student identity, rosters, answers, shards, achievements, settings, sessions,
  and leaderboards remain local/browser-only.
- Anonymous traffic counters are separate public totals and do not collect names,
  rosters, answers, or profile records.

## Documentation Findings

- README counts were stale: headline said 199+, stats said 194.
- License wording said private even though the repository is public.
- `docs/AUDIT-REPORT-2026-05-09.md` still contained placeholder text.
- Asset generation and quality-tier rules were underdocumented.

## Prioritized Fix List

| severity | area | path | problem | student/classroom impact | recommended fix | implemented? |
| --- | --- | --- | --- | --- | --- | --- |
| Critical | Assets | `assets/game-thumbnails/` | 34 missing WebP thumbnails | Broken/weak cards | Generate WebP art for every id | yes |
| High | Hub | `index.html` | SVG thumbnail allow-list | 404 risk and brittle cards | Standardize all ids to WebP | yes |
| High | Docs | `README.md` | Wrong catalog count | Trust issue | Reconcile with 219 entries | yes |
| High | Privacy | `docs/ARCADE-API.md` | Local-only wording contradicted public counters | Confusing privacy story | Clarify profile local-only vs anonymous counters | yes |
| High | Sessions | `docs/ARCADE-API.md` | Rich sessions module documented as unloaded | Integration confusion | Document dedicated session module as active | yes |
| Medium | CI | `.github/workflows/validate.yml` | No comprehensive validate workflow | Regressions can land | Add workflow | yes |
| Medium | Jeopardy | `games/**/*.html` | Generated/category-prefixed clues | Boards feel less natural | Patch hardener and clean board text | partial |
| Medium | Source bank | `data/chrono-defense-bank.json` | Two source records out of sync | Source integrity risk | Sync trusted images/source labels | yes |
| Medium | A11y | game CSS | Select option contrast drift | Hard-to-read dropdowns | Standardize option backgrounds | yes |

## What Was Implemented

- Deterministic generated asset system for all 219 catalog entries.
- Hub card art integration using `assets/game-card-art/<id>.webp`.
- Cabinet assets and generated art manifest.
- README, DESIGN, ARCADE API, and shipping guide updates.
- CI validation workflow.
- Jeopardy hardener patch and board sync pass.

## Remaining Queue

- Continue Jeopardy category-fit cleanup until `validate-jeopardy-boards.mjs` is fully clean.
- Replace marker-only source-contract fixes with deeper source-render helper unification in older games.
- Run browser/device QA across desktop and mobile after final validator stabilization.
