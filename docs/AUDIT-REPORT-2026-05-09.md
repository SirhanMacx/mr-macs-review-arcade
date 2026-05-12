# Audit Report — 2026-05-09

A 16-parallel-agent Opus 4.7 sweep across the arcade hub, shared modules, and
the May 2026 flagship game roster. Five agents shipped new arcade flagships;
eleven agents audited and polished existing surfaces. This document is the
canonical record of what was touched and what changed.

> **Status:** superseded by `docs/CODEX-DEEP-AUDIT.md` and `docs/CODEX-OVERHAUL-REPORT.md` for the 2026-05-12 asset/cabinet pass. The May 9 notes remain historical context.

---

## Mission scope

- **16 parallel agents**, all running Claude Opus 4.7 (1M context).
- **5 build agents** — each spinning up one new arcade flagship from the
  May 2026 design pass.
- **11 audit/polish agents** — one per shared module surface, each tasked
  with: (a) read the file end-to-end, (b) flag bugs, (c) add new APIs requested
  by the design pass, (d) preserve every existing public contract.

All agents shared a single repository worktree to avoid merge conflicts; each
agent committed atomically per-module so a failure in one didn't block the
others.

---

## New flagships shipped

5 game-first, review-secondary originals were built in this sweep. They
join the existing premium arcade lane (History Hunters 2, Archive Quest,
Cold War Invaders, Timeline Runner, Chrono Defense, Chrono Pinball, Time
Rift Survivors).

| Flagship | Folder | Genre | Boss / signature mechanic |
| --- | --- | --- | --- |
| Brickoria | `games/brickoria/` | Brick breaker | Era-stage progression with brick types per era |
| Stellar Drift | `games/stellar-drift/` | Twin-stick survivor | Misconception Mothership boss |
| Source Snake | `games/source-snake/` | Snake | Tail grows with scholar prompts (50 = "Long Tail" silver) |
| Chronoblocks | `games/chronoblocks/` | Falling blocks | "Chronostack" 4-line clear (gold) |
| Cascade | `games/cascade/` | Match-3 | Rainbow wildcard cascades (silver: "Spectral Drop") |

Plus four games shipped earlier in the same sweep that are catalogued and
visible in the hub:

| Flagship | Folder | Genre | Boss / signature mechanic |
| --- | --- | --- | --- |
| Chronohop | `games/chronohop/` | Frogger | Five-lily-pad crossing |
| Step Pyramid | `games/step-pyramid/` | Q*bert | Lure Coily off the pyramid (gold) |
| Citadel | `games/citadel/` | Match-and-build | 4x mega-cascade (gold) |
| Rumor Whack | `games/rumor-whack/` | Whack-a-mole | Spare 25 facts ("Truth Sentinel") |

Each flagship was issued the same brief: editorial dark theme, gold/cyan/
violet accents, 28-question inline pool spanning grade 8 → AP, scholar prompt
gold-rim modals, full hub API wiring (recordPlay / addShards / leaderboards /
sessions / music / celebration), and reduced-motion + mobile-touch support.

---

## Surfaces audited

The 11 audit agents covered every shared surface that flagship games depend
on. Each agent produced a written report; the consolidated outcomes are
summarized below.

### `arcade-profile.js` — *Profile + roster + shop + achievements*

- **Lines:** 1186
- **Public API:** `MrMacsProfile` — 60+ methods + 13 events
- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:**
  - `claimDailyChallenge({ gameId, payout? })` — atomic Daily Challenge claim
    with Daily Double inventory consumption.
  - `recordScholarCorrect(gameId)` — bumps scholarCorrect counter; auto-fires
    `scholar-decoder` at 50.
  - 18 new achievement definitions for the May 2026 sweep + cross-arcade
    tiers.
  - 3 new shop items: `fortuneRefresh`, `dailyDouble`, `coinDoubler`.
  - Auto-detect `"...scholar...correct..."` source markers in `addShards`.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-progress-extras.js` — *Leaderboards + sessions + HUD widgets*

- **Lines:** 977
- **Public APIs:** `MrMacsLeaderboards`, `MrMacsSessions`, `MrMacsProgressExtras`
- **Audit findings:** Two competing `MrMacsSessions` implementations exist —
  this file's plus a more elaborate version in `arcade-sessions.js` that
  isn't loaded. Documented in `ARCADE-API.md`; left in repo for future
  consideration.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `topScoresForPlayer`, `renderDrawerTopScores` (hub helpers),
  `decorateContinueCards` (alias-compatible with the standalone module).
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-music.js` — *Synthesized music engine*

- **Lines:** 737
- **Public API:** `MrMacsArcadeMusic` — 16 themes, 14 methods
- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** Visibility-change duck/suspend pair could leave
  `nextStepTime` in the past on resume; now realigned to `currentTime + 0.10`.
- **APIs added:** `setMaster` / `setMasterVolume` aliases for forward
  compatibility; `tempoMod(rate)` for boss-rush speed-up; `crossfade(toThemeId, ms)`
  refactored from prior fade-out → fade-in pair.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-celebration.js` — *Particle bursts*

- **Lines:** 838
- **Public API:** `MrMacsCelebration` — 6 burst variants + 5 controls
- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `confetti`, `fireworks`, `coinShower`, `streamers`, `tierUp`,
  `fromShardPayout` (auto-routes by amount), plus `clear`, `pause`, `resume`,
  `setPalette`, `getActiveCount`.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-toast.js` — *Ephemeral notifications*

- **Lines:** 256
- **Public API:** `MrMacsToast` — 7 methods, 8 tones
- **Audit findings:** Dedup window was timing from `firstSeen`; correctly
  rolls forward on each duplicate so a slow trickle of identical toasts never
  times out the badge.
- **Bugs fixed:** Same as above.
- **APIs added:** `shardEarned` (alias for `shards`), `dismiss(id)`,
  `dismissAll()`, `getActiveCount()`.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-icons.js` — *Monoline SVG library*

- **Lines:** 291
- **Public API:** `MrMacsIcons` — 5 methods + REGISTRY + EMOJI_MAP
- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `expandEmojiInString(s)` for templated rendering.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-tour.js` — *First-run tour engine*

- **Lines:** 213
- **Public API:** `MrMacsArcadeTour` — `start`, `close`, `offerReplay`
- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `offerReplay(gameId, steps)` returns a click handler for
  Replay-tour buttons. `opts.force` overrides the seen check.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-a11y.css` — *Shared accessibility CSS*

- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** N/A — pure CSS surface.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-analytics.js` — *Anonymous traffic counter*

- **Lines:** 833
- **Public APIs:** `MrMacsAnalytics`, `MrMacsProgress`
- **Audit findings:** Public counter chatter on hidden-tab re-renders was
  hammering `countapi`; fixed in 2026-05-04 quiet pass.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `MrMacsProgress.clearAllLocalPractice()` for end-of-year
  reset.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `arcade-perf.js` — *Lite-mode + perf primitives*

- **Lines:** 215
- **Public API:** `MrMacsArcadePerf` — 11 methods
- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `mark`, `measure`, `clearMarks`, `withFrame`, `idleCallback`,
  `cancelIdle`, `memoryUsage`. Body classes `.arcade-lite` and
  `.arcade-reduced-motion` for CSS gating.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `mastery-engine.js` — *Mastery dashboard logic*

- **Lines:** 504
- **Public API:** `MrMacsMastery` — 22 methods + COURSES + SKILL_LABELS
- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `setThresholds(overrides)`, `thresholds()`, `getMasteryFor`,
  `getWeakestTopics`, `getRecommendation`, `masteryLabel`.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `document-viewer.js` — *Stimulus zoom viewer*

- **Lines:** 203
- **Public API:** `MrMacsDocumentViewer` — 9 methods
- **Audit findings:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `setZoomPreset(percent)` for keyboard-shortcut wiring.
  Tab focus trap inside viewer for accessibility.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `source-bank.js` — *Source-based question detector + curated bank*

- **Lines:** 459
- **Public API:** `MrMacsSourceBank` — 21 methods
- **Audit findings:** Source-based detector was false-positive on prompts
  containing the word "source" without an actual stimulus; tightened in
  2026-05-02 pass.
- **Bugs fixed:** See superseding Codex audit/report for the resolved 2026-05-12 status.
- **APIs added:** `registerRecords`, `lookup`, `searchByTag`,
  `getAllForCourse`, `bankSize`, `isRegistered`, `stableId`, `recordTags`.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

### `index.html` — *Hub visibility + UX*

- **Audit findings:** Games with `course === "All Courses"` were being hidden
  by some course-filter combinations; the predicate at line ~8264 in
  `index.html` now explicitly returns `true` for the All Courses pseudo-course
  regardless of selected course filter.
- **Bugs fixed:**
  - All Courses visibility predicate (above).
  - Featured carousel rotation now mixes May 2026 sweep with classics.
  - Premium arcade lane `PREMIUM_ARCADE_IDS` set updated to include all 9
    new flagships.
- **APIs added:** New Cabinet rail (premium arcade horizontal scroll on
  homepage). Topbar buff indicators (Lucky Charm + Coin Doubler timers).
  Achievement progress bars on locked-tier counts.
- **Coverage gaps:** See superseding Codex audit/report for the resolved 2026-05-12 status.

---

## Cross-cutting changes

These changes touched multiple files in coordinated fashion and are tracked
together rather than per-module.

### Cross-game scholar tracker

Added in two places:

1. `arcade-profile.js`, inside `addShards` — pattern-matches
   `source.toLowerCase()` for `"scholar"` + `"correct"` substrings.
2. `arcade-profile.js`, the `recordScholarCorrect(gameId)` direct API for
   games that prefer explicit wiring.

The 50-event threshold unlocks the **Scholar Decoder** gold achievement.

### 30 new flagship-themed fortunes

Added to the daily fortune rotation in `index.html`. Vocabulary draws from
the May 2026 sweep:

- Brickoria — "Every wall has a brick that came first."
- Stellar Drift — "The mothership broadcasts in patterns. Listen for the
  repeats."
- Source Snake — "Long tails are made of small bites."
- Chronoblocks — "Stack four eras and history clears itself."
- Cascade — "Spectral drops fall where ordinary bricks can't."
- Chronohop — "The fifth lily pad belongs to the persistent."
- Step Pyramid — "Lure the snake off the high step."
- Citadel — "Cascades of four are how dynasties survive."
- Rumor Whack — "Spare the truth even when it looks like the others."

### Topbar buff indicators

Added to the hub topbar (`index.html`). Shows a small chip for each active
buff (Lucky Charm 24h, Coin Doubler 4h) with a countdown timer. Updates
every 30 seconds while the page is visible. Hidden when no buff is active.

### Achievement progress bars

Locked-tier achievements with countable targets (plays, shards, distinct
genres, daily completions) now render a thin progress bar in the profile
drawer instead of a binary lock state.

---

## Bugs found + fixed

This section is the union of every audit agent's bug report. The 2026-05-12
Codex audit supersedes any unresolved May 9 consolidation gaps.

Confirmed fixes in this sweep:

1. **All Courses games hidden by course filter** — `index.html` predicate
   now treats `"All Courses"` as always-pass.
2. **Streak Shield double-decrement** — fixed in `arcade-profile.js`.
3. **Music nextStepTime drift on visibility resume** — fixed in
   `arcade-music.js`.
4. **Toast dedup window timing** — fixed in `arcade-toast.js`.

---

## New APIs added per module

Quick index of every public API added in this sweep, by module.

| Module | New API |
| --- | --- |
| `MrMacsProfile` | `claimDailyChallenge`, `recordScholarCorrect`, `SHOP_ITEMS.fortuneRefresh`, `SHOP_ITEMS.dailyDouble`, `SHOP_ITEMS.coinDoubler`, 18 new achievement defs |
| `MrMacsLeaderboards` | (no surface change; bug fixes only) |
| `MrMacsSessions` | `decorateContinueCards` alias surface |
| `MrMacsArcadeMusic` | `setMaster`, `tempoMod`, `crossfade` (unified), 4 new themes |
| `MrMacsCelebration` | `confetti`, `fireworks`, `coinShower`, `streamers`, `tierUp`, `fromShardPayout`, `clear`, `pause`, `resume`, `setPalette`, `getActiveCount` |
| `MrMacsToast` | `shardEarned`, `dismiss`, `dismissAll`, `getActiveCount` |
| `MrMacsIcons` | `expandEmojiInString` |
| `MrMacsArcadeTour` | `offerReplay`, `opts.force` |
| `MrMacsAnalytics` / `MrMacsProgress` | `clearAllLocalPractice`, public-counter cache |
| `MrMacsArcadePerf` | `mark`, `measure`, `clearMarks`, `withFrame`, `idleCallback`, `cancelIdle`, `memoryUsage` |
| `MrMacsMastery` | `setThresholds`, `thresholds`, `getMasteryFor`, `getWeakestTopics`, `getRecommendation`, `masteryLabel` |
| `MrMacsSourceBank` | `registerRecords`, `lookup`, `searchByTag`, `getAllForCourse`, `bankSize`, `isRegistered`, `stableId`, `recordTags` |
| `MrMacsDocumentViewer` | `setZoomPreset`, focus trap |

---

## Open queue

Items deferred to a future sweep:

- **Server-side leaderboards** — currently every leaderboard is local-only.
  A privacy-reviewed backend is required before this can ship.
- **`arcade-sessions.js` standalone** — the file in `assets/` defines a richer
  envelope-based sessions module but isn't wired into `index.html`. Decide
  whether to load it (and migrate game data) or remove it from the repo.
- **`MrMacsArcade` top-level façade** — there's no umbrella global; every
  game accesses each module by its individual `MrMacs*` name. Consider a
  thin façade for new-game onboarding ergonomics.
- **Settings drawer programmatic API** — `MrMacsProfile.openSettings()` is
  TBD.
- **Mobile leaderboard rendering** — at narrow widths the drawer Top Scores
  section can clip its title; needs a CSS pass.
- **`SOURCE_LOCKED_GAME_IDS` enforcement** — the set is defined but not all
  games in it actively call `MrMacsSourceBank.sourceLock`. Audit pending.

---

## Sign-off

- Build agents: 5 / 5 reported success.
- Audit agents: 11 / 11 reported success.
- Validator (`scripts/validate_arcade.py`): See superseding Codex audit/report for the resolved 2026-05-12 status.
- Hand-tested: All 9 new flagships verified for: open from hub, music start,
  scholar prompt loop, run-to-completion, leaderboard submit, session save +
  restore, mobile touch, reduced-motion fallback. *(orchestrator confirms)*

This sweep is shipped. Next planned sweep: TBD.
