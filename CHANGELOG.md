# Changelog

All notable changes to Mr. Mac's Review Arcade are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions are date-based (YYYY-MM-DD) since the arcade ships continuously to GitHub Pages.

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
