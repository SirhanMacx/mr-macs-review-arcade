# Changelog

All notable changes to Mr. Mac's Review Arcade are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions are date-based (YYYY-MM-DD) since the arcade ships continuously to GitHub Pages.

## [2026-05-15] — All-Subject 5-12/AP Content System

### Added
- Canonical 90-course all-subject taxonomy covering NYSED grades 5-12 standards areas plus the full AP/AP Career Kickstart course set.
- `scripts/generate-all-subject-content.mjs` to generate arcade bank fragments, unit Jeopardy blueprints, practice-exam blueprints, and released-source catalogs from the taxonomy.
- 4,440 generated all-subject arcade questions, raising the compiled shared bank to 7,146 questions across 99 course buckets.
- 664 generated unit Jeopardy blueprints and 90 practice-exam blueprints for the three-phase content rollout.
- `scripts/validate-all-subject-content.mjs` and `npm run validate:content` to guard NYSED/AP coverage, question shape, source metadata, Jeopardy board shape, and practice-exam blueprint structure.

### Changed
- Hub diagnostics now load and merge the generated shared bank, so no-course students get broad general trivia across NYS subjects and AP courses.
- Course selectors and mastery routing now include generated NYSED/AP course labels instead of stopping at the old social-studies/AP-social-science list.
- The all-course quiz gauntlet now pulls from a balanced general-trivia pool.
- Service worker cache version bumped for the all-subject content payload.

## [2026-05-12] — Generated Asset + Cabinet Overhaul

### Added
- Deterministic generated asset system for all 219 catalog entries.
- `assets/game-card-art/`, `assets/game-marquees/`, `assets/cabinet/`, and `assets/generated-game-art-manifest.json`.
- `scripts/generate_arcade_assets.py` for repeatable original WebP thumbnails, card art, marquees, and cabinet assets.
- `docs/CODEX-DEEP-AUDIT.md`, `docs/CODEX-OVERHAUL-REPORT.md`, and `docs/ASSET-SYSTEM.md`.
- `.github/workflows/validate.yml` for full repo validation.

### Changed
- Hub cards now use generated card art while thumbnails remain lightweight lazy-loaded images.
- README, DESIGN, ARCADE API, and shipping guide now reflect the 219-entry catalog, generated assets, active sessions module, and accurate privacy wording.
- Jeopardy hardening no longer creates category-prefixed clues.

### Fixed
- Filled missing WebP thumbnail coverage for all catalog entries.
- Synced two shared-bank source records to trusted Regents source metadata.
- Standardized select option contrast in affected games.

## [v3.1] — 2026-05-10

### Fixed
- **Module dependency Finding A** (CRITICAL): script-tag order in index.html
  swapped so `arcade-leaderboards.js` + `arcade-sessions.js` load BEFORE
  `arcade-progress-extras.js`. Previously progress-extras grabbed all 3
  namespaces and the dedicated rich-API modules silently bailed,
  leaving the hub stuck on a slim 5-method stub. The leaderboard globe's
  `personalBest()` overlay was silently broken — now works.
- **Module dependency Finding B**: idempotency guards added to
  `arcade-analytics.js` + `arcade-music.js` (prevents accidental
  global-overwrite on duplicate script load).
- 24 of 32 round-3 bug-fix agents landed substantive fixes across
  game files (race-condition guards, save/resume completeness, modal
  flow, music duck/restore, particle pool caps).
- Typo bug sweep: 6 broken hub-API calls fixed across 4 older
  single-file games (`MrMacsAnalytics.track` → `MrMacsProgress.recordEvent`,
  `MrMacsToasts.show` → `MrMacsToast.push`).
- UI/overlay polish across all 35 flagships: modal z-index hierarchy,
  mobile HUD overflow, power-up tray placement, touch-control vs canvas,
  reduced-motion respect.
- Toast / achievement pop-ups no longer block clicks on hub UI behind
  them (pointer-events fix on container, faster auto-dismiss, capped
  visible at 3, top-right positioning offset below topbar).

### Changed
- **UX rec #1** (HIGH): collapsed redundant "9 new flagships" + "16 new
  cabinets" callouts into a single "25 fresh flagships" banner.
- **UX rec #2** (MED): moved Launch Paths band ABOVE Smart Study Tools
  so new players see paths before tools.
- **UX rec #3** (MED): softened welcome dialog. Name / avatar / course
  all explicitly optional. CTA always active. Defaults to "Player" if blank.
- **UX rec #5** (MED): renamed "lives" HUD label in 4 non-traditional
  games — Archive Tycoon → "runs left", Plinko Lab → "tries", Atlas 2048
  → "boards", Citadel → "tries".
- **UX rec #6** (MED): "+60 💎" payout chip on Daily Challenge CTA.
- **UX rec #9** (LOW): "Newest" sort option added to library.

### Added
- `assets/arcade-end-recap.js` — shared module to render "Unlocked This
  Run" achievement recap on game end screens.
- `assets/arcade-game-helpers.js` — shared "Exit Arcade" button + sound
  toggle auto-mounter.
- `assets/arcade-help-overlay.js` — shared "How to Play" reference
  overlay (different from arcade-tutorial.js which is step-by-step).

---

## [2026-05-09] — May 2026 Sweep

A 16-parallel-agent sweep that shipped 9+ new arcade flagships, new cross-arcade
mechanics, a power-up shop expansion, and an audit/polish pass across every
shared hub module.

### Added

- **9 new arcade flagships** — game-first, review-secondary originals built
  around the May 2026 design pass:
  - `brickoria` — era-stage brick-breaker
  - `stellar-drift` — twin-stick survivor with the Misconception Mothership boss
  - `source-snake` — classic snake, scholar prompts grow the tail past 50 segments
  - `chronoblocks` — falling-block puzzler with 4-line "Chronostack" clears
  - `cascade` — match-3 with rainbow wildcard cascades
  - `chronohop` — Frogger-style five-lily-pad crossing
  - `step-pyramid` — Q*bert-style pyramid with a Coily-style chase enemy
  - `citadel` — match-and-build with 4x mega-cascade triggers
  - `rumor-whack` — fact-vs-rumor whack-a-mole with a 25-spare "Truth Sentinel" tier
- **18 new achievements** — one per new flagship plus the cross-arcade tiers:
  Wall Breaker, Mothership Down, Long Tail, Chronostack, Spectral Drop, Lily Pad
  Five, Pyramid Cleared, Lured Coily, Mega Cascade, Truth Sentinel, Scholar
  Decoder (50 scholar prompts), Genre-Hopper (3), Cabinet Curator (7), Arcade
  Polymath (12), Shard Hoarder (1k), Treasure Vault (10k), Centurion (100
  plays), Daily Disciple (30 daily challenges).
- **3 new shop items** — Fortune Refresh (25 shards, reroll today's daily
  fortune), Daily Double (150, doubles next Daily Challenge payout), Coin
  Doubler (500, 4-hour 2x stacking with Lucky Charm).
- **`claimDailyChallenge(meta)` API** on `MrMacsProfile` — returns `{ ok,
  payout, doubled, completedCount }`, automatically applies the Daily Double
  inventory item, and pays out via `addShards` so Lucky Charm + Coin Doubler
  stack on top.
- **Topbar buff indicators** — visible chips for active Lucky Charm and Coin
  Doubler timers.
- **Achievement progress bars** — locked tiers now show partial progress where
  the target is countable (plays, shards, distinct genres, daily completions).
- **New Cabinet rail** on the hub homepage — surfaces the full premium arcade
  lane in one horizontal scroll.
- **Auto-detect scholar-correct** in `addShards` — any shard payout whose
  `source` lowercase contains both `"scholar"` and `"correct"` bumps the
  cross-game scholar counter, so games no longer need to wire it explicitly.
- **30 new flagship-themed fortunes** in the daily fortune rotation, drawing on
  vocabulary from Brickoria, Stellar Drift, Source Snake, Chronoblocks,
  Cascade, Chronohop, Step Pyramid, Citadel, and Rumor Whack.
- **`MrMacsCelebration.confetti` / `.fireworks` / `.coinShower` / `.streamers`
  / `.tierUp` / `.fromShardPayout`** — new variants with auto-routing by shard
  magnitude.
- **`MrMacsToast.shardEarned` / `.dismiss(id)` / `.dismissAll()` /
  `.getActiveCount()`** — Polish v2 additions, dedup with ×N badge after 3
  identical toasts in 2s.

### Changed

- **`MrMacsProfile` ACHIEVEMENTS registry** grew from 47 to 65 entries.
- **`MrMacsProfile.SHOP_ITEMS`** grew from 4 to 7 entries; cost / icon / desc
  centralized in a single source of truth.
- **`MrMacsProfile.addShards`** now accepts source markers like
  `"<game>-scholar-correct"` and auto-routes to `recordScholarCorrect`.
- **Lucky Charm + Coin Doubler stack** — both can be active at once for a 4x
  effective multiplier during the 4-hour Coin Doubler window.
- **Daily Challenge payout** is now configurable via the `meta.payout` argument
  (default 60 shards).
- **Featured carousel** rotates between May 2026 flagships and existing premium
  classics; new players land on a fresh game.

### Fixed

- **"All Courses" games visibility** — games with `course === "All Courses"`
  were being hidden by some course-filter combinations; the predicate in
  `index.html` now explicitly returns `true` for the All Courses pseudo-course
  regardless of selected course filter.
- **Streak Shield consumption** — was previously double-decrementing on a
  same-day re-entry; now only fires when the streak would otherwise break.
- **`MrMacsArcadeMusic`** — visibility-change duck/suspend pair could leave
  `nextStepTime` in the past; now realigned to `currentTime + 0.10` on resume.
- **Toast dedup window** — was timing from `firstSeen`; correctly rolls forward
  on each duplicate so a slow trickle of identical toasts never times out the
  badge.

### Removed

- (Nothing removed in this sweep — all changes are additive or in-place edits.)

---

## [2026-05-07] — Phase 1 hub modularization

### Added

- `arcade-profile.js` v2 with multi-profile roster (`MrMacsProfile.roster.list
  / create / switch / remove / rename / count / getActiveId`), test-prep
  countdown widget, mock-exam history, daily-shards / daily-answers rolling
  buffers, and mastered-cards archive.
- `arcade-perf.js` lite-mode detection — flips on `prefers-reduced-motion`,
  `navigator.deviceMemory < 4`, `hardwareConcurrency <= 2`, or manual user
  toggle. Applies `.arcade-lite` and `.arcade-reduced-motion` body classes.
- `arcade-tour.js` shared first-run tour engine — spotlight + step card with
  keyboard nav (Esc / Enter / Space).
- `arcade-progress-extras.js` reusable HUD widgets — mini-HUD pill, score chip
  with bump animation, best badge, streak meter, run-summary card.

### Changed

- Profile storage migrated from single-key `mr-macs-arcade-profile-v1` to
  roster key `mr-macs-arcade-roster-v1`. Legacy key is read once and migrated
  transparently on first boot.

---

## [2026-05-04] — Counter refresh quiet pass

### Changed

- `arcade-analytics.js` switched off public counter chatter on hidden-tab
  re-renders to keep idle Chromebook tabs from hammering `countapi`.
- `MrMacsAnalytics.refresh()` now caches public counter values for 5 minutes
  in `localStorage` under `mr-macs-review-arcade-v1:public-traffic-cache`.

---

## [2026-05-02] — Source bank + mastery engine perfect-pass

### Added

- `source-bank.js` curated bank registry — `registerRecords`, `lookup`,
  `searchByTag`, `getAllForCourse`, `bankSize`, `recordTags`.
- `mastery-engine.js` thresholds API — `setThresholds({ novice, practicing,
  proficient, masteryAttempts, recentWindow })`.

### Fixed

- Source-based question detector no longer false-positives on prompts that
  contain the word "source" but no actual stimulus.
- Course/stimulus path mismatch (`U.S. History` vs `Global History`) now
  flagged via `MrMacsSourceBank.sourceLock`.

---

## Earlier history

See repository commit log for changes before the 2026-05 sweep. Highlights:

- Apr 28 2026 — Public traffic counter rollout (`countapi.mileshilliard.com`)
- Apr 25 2026 — `.nojekyll` shipped; History Hunters 2 RPG launched
- Apr 19 2026 — Generated arcade hub artwork (16-bit lobby v4, marquee panel)
- Mar 2026 — Initial Regents Gauntlet + 510 answer-keyed Regents MCQ bank
- Feb 2026 — Jeopardy boards normalized + ramped per category
