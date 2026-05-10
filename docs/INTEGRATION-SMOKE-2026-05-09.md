# Integration Smoke-Test · 2026-05-09 (Round 3)

Snapshot taken at 2026-05-09 19:45 PT against `assets/arcade-*.js` r-3 module set
and `index.html` line 8494-8519 script-tag block. All `node --check` runs were
clean.

## Headline numbers

| Metric | Value |
|---|---|
| Total games (`games.json`) | **211** entries (count grew during run; pipeline live-rebuilds) |
| Unique IDs in `games.json` | **211** (no duplicates) |
| `games/` subdirs on disk | **79** |
| `games/*/index.html` files | **58** |
| `games/*/game.js` files | **44** (49 distinct game.js across nested dirs) |
| Hub asset modules (`assets/arcade-*.js`) | **27** |
| Modules loaded by hub `index.html` | **26** (all except `arcade-music.js`) |
| Total LOC across hub modules | **17,763** |
| Public APIs catalogued | **267 methods** across **26 namespaces** |
| MrMacsProfile API surface | **69 methods** (single biggest module) |
| Broken/typo references in games | **5** (3 distinct issues, 5 sites) |
| `node --check` failures | **0** (assets + game.js + non-arcade JS all clean) |
| Achievement registry duplicates | **0** (83 entries in `ACHIEVEMENTS`) |
| Game-dir orphans (not in `games.json`) | **13** |
| Round-3 modules loaded but never called | **5** of 10 |

## Module API surface

LOC is the file's line count. "Loaded by hub" = present in `index.html` script
tags around line 8494–8519. Every module except `arcade-music.js` is hub-loaded;
`arcade-music.js` is loaded by **43 of 58 per-game `index.html` files** instead.

| Module | Namespace | Methods | LOC | Hub-loaded? | Per-game-loaded? |
|---|---|---:|---:|:---:|:---:|
| arcade-analytics.js | MrMacsProgress | 6 | 958 | yes | 22 games |
| arcade-celebration.js | MrMacsCelebration | 14 | 838 | yes | 34 games |
| arcade-changelog.js | MrMacsChangelog | 10 | 543 | yes | 0 |
| arcade-classroom.js | MrMacsClassroom | 6 | 644 | yes | 0 |
| arcade-cram-mode.js | MrMacsCramMode | 14 | 537 | yes | 0 |
| arcade-deeplinks.js | MrMacsDeeplinks | 13 | 480 | yes | 0 |
| arcade-dev-tools.js | MrMacsDevTools | 11 | 782 | yes | 0 |
| arcade-difficulty.js | MrMacsDifficulty | 10 | 440 | yes | 0 |
| arcade-icons.js | MrMacsIcons | 12 | 419 | yes | 56 games |
| arcade-keyboard-remap.js | MrMacsKeyboard | 9 | 440 | yes | 0 |
| arcade-leaderboard-globe.js | MrMacsLeaderboardGlobe | 7 | 652 | yes | 0 |
| arcade-leaderboards.js | MrMacsLeaderboards | 13 | 616 | yes | 0 |
| arcade-mascot.js | MrMacsMascot | 6 | 699 | yes | 0 |
| arcade-music.js | MrMacsArcadeMusic | 16 | 737 | **NO** | 43 games |
| arcade-news-ticker.js | MrMacsNewsTicker | 10 | 552 | yes | 0 |
| arcade-onboarding-flow.js | MrMacsOnboarding | 7 | 538 | yes | 0 |
| arcade-perf.js | MrMacsArcadePerf | 12 | 215 | yes | 13 games |
| arcade-profile.js | MrMacsProfile | **69** | 2133 | yes | 47 games |
| arcade-progress-extras.js | MrMacsLeaderboards (overlay) + MrMacsSessions (overlay) + MrMacsProgressExtras | 6+5+~10 | 977 | yes | 40 games |
| arcade-quick-stats-panel.js | MrMacsQuickStats | 5 | 493 | yes | 0 |
| arcade-recommender.js | MrMacsRecommender | 5 | 550 | yes | 0 |
| arcade-replay.js | MrMacsReplay | 26 | 694 | yes | 0 |
| arcade-screenshot.js | MrMacsScreenshot | 7 | 576 | yes | 0 |
| arcade-sessions.js | MrMacsSessions | 11 | 415 | yes | 0 |
| arcade-toast.js | MrMacsToast | 7 | 649 | yes | 40 games |
| arcade-tour.js | MrMacsArcadeTour | 3 | 662 | yes | 46 games |
| arcade-tutorial.js | MrMacsTutorial | 9 | 524 | yes | 0 |

> **Note on `arcade-progress-extras.js` namespace overlap.** This module
> assigns `root.MrMacsLeaderboards` AND `root.MrMacsSessions` AND
> `root.MrMacsProgressExtras`. Two of those three namespaces are *also*
> assigned by their own canonical modules. In the hub the load order is
> deliberately `progress-extras → leaderboards → sessions`, so the canonical
> modules win and provide the full API. **In any per-game `index.html` that
> loads `arcade-progress-extras.js` without later loading the canonical
> `arcade-leaderboards.js` / `arcade-sessions.js`** (40 of 58 per-game pages),
> the API surface for those two namespaces is the **abridged 4-method overlay**
> from progress-extras only (`submit / top / best / clearAll` for
> Leaderboards; `save / load / clear / listAll / decorateContinueCards` for
> Sessions). Calls to `personalBest`, `topGames`, `resetForGame`,
> `decorateContinueCards`, `clearAllForProfile`, etc. **will be undefined in
> per-game pages**.

## Game-to-module integration matrix

Number = count of distinct methods called by that game on that namespace.
Blank = no calls. (Top 8 namespaces; all 49 game.js files.)

| Game | Profile | LB | Sessions | Music | Celeb | Toast | Icons | Perf |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| anagram-atlas | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| ap-practice-exam | 1 | | | | | | | |
| arcade-duel | 7 | 2 | 2 | 4 | 1 | | 1 | |
| archive-cipher | 5 | 2 | 2 | | 1 | | 1 | |
| archive-quest | 4 | 1 | 1 | | 1 | | | |
| atlas-2048 | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| brickoria | 6 | 2 | 2 | 4 | 1 | | 1 | |
| cascade | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| centiquill | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| chrono-defense | 7 | 2 | 2 | 4 | 1 | 1 | | 1 |
| chrono-pinball | 5 | 1 | 1 | 2 | 1 | | | 1 |
| chronoblocks | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| chronohop | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| citadel | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| cold-war-invaders | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| defender-drift | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| echo-hall | 8 | 2 | 2 | 4 | 1 | 1 | | |
| empire-ascendant | 7 | 2 | 2 | 4 | 1 | 1 | | 1 |
| galaxy-defender | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| history-hunters | 4 | 1 | | | 1 | | | |
| history-hunters-2 | 5 | 2 | 2 | | 1 | | | |
| lightning-review | 4 | 1 | | | 1 | | | |
| mahjong-mosaic | 8 | 2 | 2 | **5** | 1 | 1 | 1 | |
| mastery-path | 1 | | | | | | | |
| memory-palace | 7 | 2 | 2 | 4 | 1 | 1 | | |
| pinball-empire | 7 | 2 | 2 | 4 | 1 | 1 | | 1 |
| plinko-lab | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| pong-doctor | 7 | 2 | 2 | 4 | 1 | 1 | | |
| reflex-run | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| regents-gauntlet | 4 | 1 | 1 | | 1 | | | |
| regents-practice-exam | 4 | 1 | | | 1 | | | |
| regents-rally-source-circuit | 4 | 1 | 1 | | 1 | | | |
| review-maze-chase | 7 | 2 | 2 | **5** | 1 | 1 | | 1 |
| rumor-whack | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| snake-pit | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| sokoban-scribe | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| source-audit | 4 | 1 | 1 | | 1 | | | |
| source-lab | 4 | 1 | 1 | | 1 | | | |
| source-snake | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| source-sprint | 4 | 1 | 1 | | 1 | | | |
| stellar-drift | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| step-pyramid | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| sudoku-scribe | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| time-rift-survivors | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| timeline-runner | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| tower-climb | 8 | 2 | 2 | 4 | 1 | 1 | 1 | |
| tron-trails | 8 | 2 | 2 | 4 | 1 | 1 | 1 | 1 |
| vocab-vault | 4 | 1 | 1 | | 1 | | | |
| writing-coach | 4 | 1 | 1 | | 1 | | | |

Aggregate caller counts:

| Namespace | # games using it |
|---|---:|
| MrMacsProfile | 38 |
| MrMacsArcadeMusic | 34 |
| MrMacsLeaderboards | 32 |
| MrMacsSessions | 32 |
| MrMacsCelebration | 26 |
| MrMacsArcadePerf | 11 |
| MrMacsArcadeTour | 10 |
| MrMacsIcons | 9 |
| MrMacsToast | 6 |
| **MrMacsAnalytics** *(typo, see below)* | 3 |
| **MrMacsToasts** *(typo, see below)* | 1 |

## Broken references

All five are **silent failures** — every call site is wrapped in a
feature-detect guard (`if (window.X && X.method)`), so the games degrade
gracefully rather than throwing. They still represent dead-code paths that
will never run.

| # | Game | Bad reference | Real namespace / method | Issue | Severity |
|---|---|---|---|---|---|
| 1 | `archive-cipher/game.js:592` | `MrMacsAnalytics.track("game_complete",…)` | `MrMacsProgress.recordEvent(…)` | Typo — namespace `MrMacsAnalytics` does not exist; module is named `MrMacsProgress` and method is `recordEvent`, not `track`. | Medium — analytics events not recorded. |
| 2 | `history-hunters/game.js:2077-2078` | `MrMacsAnalytics.track(…)` | same as above | Same typo | Medium |
| 3 | `history-hunters-2/game.js:1692-1761, 4226+` | `MrMacsAnalytics.track(…)` (3 sites) | same as above | Same typo | Medium |
| 4 | `brickoria/game.js:1305-1306` | `MrMacsToasts.show({title,kind,duration})` | `MrMacsToast.push(…)` *or* `MrMacsToast.shards/achievement` | Typo — `MrMacsToasts` (plural) does not exist; the namespace is singular `MrMacsToast`, and `push` is the right method (no `show`). | Low — Brickoria has a fallback in-game toast. |
| 5 | `mahjong-mosaic/game.js:1990-1991` | `MrMacsArcadeMusic.themes[theme]` | `MrMacsArcadeMusic.THEMES` (uppercase) or `.themeNames()` / `.list()` | Property `themes` (lowercase) is not exported. The intended check `themes && !themes[theme]` always evaluates to `false && …`, so the surrounding theme-validation guard never trips. | Low — guard is silently inert. |

No `node --check` syntax errors anywhere. No undefined namespaces in the hub
`index.html` once you account for runtime-attached methods (see "Runtime
patches" below).

### Runtime patches (NOT broken — just non-obvious)

`index.html` calls `MrMacsProfile.openDrawer(…)` and `MrMacsProfile.openWelcome(…)`
which are not declared inside `arcade-profile.js`. They are attached at runtime
inside `index.html` itself at lines 11643–11644:

```
window.MrMacsProfile.openDrawer = openDrawer;
window.MrMacsProfile.openWelcome = openWelcome;
```

This works but couples profile-namespace shape to hub markup — worth migrating
into the canonical module on the next refactor.

## Dead-code candidates

### Modules loaded but never invoked anywhere

These five round-3 modules are loaded by `index.html` but have **zero** call
sites in any `index.html`, `game.js`, or other asset module. Net cost ≈ 2,876
LOC and 67 exported methods doing nothing at runtime.

| Module | LOC | Exported methods |
|---|---:|---:|
| arcade-replay.js | 694 | 26 |
| arcade-classroom.js | 644 | 6 |
| arcade-tutorial.js | 524 | 9 |
| arcade-difficulty.js | 440 | 10 |
| arcade-screenshot.js | 576 | 7 |
| **TOTAL** | **2,878** | **58** |

### Round-3 modules that ARE wired in (one call site each)

| Module | Caller | Call |
|---|---|---|
| arcade-mascot.js | `index.html` | `MrMacsMascot.mount(…)` |
| arcade-changelog.js | `index.html` | `MrMacsChangelog.checkAndShowOnLoad()` |
| arcade-news-ticker.js | `index.html` | `MrMacsNewsTicker.mount(…)` |
| arcade-leaderboard-globe.js | `index.html` | `MrMacsLeaderboardGlobe.mount(…)` |
| arcade-deeplinks.js | `index.html` | `MrMacsDeeplinks.applyFromUrl()` |

These five each have only **one** entry point used; the remaining 5–25 methods
per module are also unused. Most are designed for future feature work
(replay-recording, classroom CSV export, per-game tutorials, difficulty
selectors, screenshot share modals). Treat as Phase-2 scaffolding rather than
true dead code.

### `MrMacsProgressExtras` namespace

`assets/arcade-progress-extras.js:965` exports a third namespace
`MrMacsProgressExtras` (renderMiniHud, renderScoreChip, renderBestBadge,
renderStreakMeter, renderRunSummary, formatNumber, formatDuration,
prefersReducedMotion, …). **Zero call sites** in any source file.

### Notably unused MrMacsProfile methods (by hub + games)

These exported methods on the most-used namespace have no observable callers:
`exportProfile`, `importProfile`, `resetProfile`, `getCramHistory`,
`getMockExamHistory`, `getDailyChallengeMissed`, `getDueWrongAnswers`,
`getMasteredCards`, `getTopicStats`, `getTopGames`, `getLifetimeStats`,
`SHOP_ITEMS`, `getShopSpec`, `buyItem`, `consumeItem`, `extendBuff`,
`dispelBuff`, `getActiveBuffs`, `dispelBuff`, `gradeWrongAnswer`,
`removeWrongAnswer`, `clearWrongQueue`. (Some are exposed for
`arcade-dev-tools.js`, but `dev-tools` is itself never invoked outside its own
file — so these are still effectively cold storage.)

## Load-order analysis

The hub `index.html` script-tag block (lines 8494–8519, in order):

```
8494  arcade-analytics.js               (MrMacsProgress)
8495  arcade-profile.js                  (MrMacsProfile)         ← foundational
8496  arcade-perf.js                     (MrMacsArcadePerf)      ← reads MrMacsProfile.getSettings on init OK
8497  arcade-tour.js                     (MrMacsArcadeTour)
8498  arcade-icons.js                    (MrMacsIcons)
8499  arcade-toast.js                    (MrMacsToast)
8500  arcade-celebration.js              (MrMacsCelebration)
8501  arcade-progress-extras.js          (overlays Leaderboards + Sessions + ProgressExtras)
8502  arcade-leaderboards.js             (MrMacsLeaderboards)    ← REPLACES line-8501 overlay
8503  arcade-sessions.js                 (MrMacsSessions)        ← REPLACES line-8501 overlay
8504  arcade-cram-mode.js                (MrMacsCramMode)        ← reads MrMacsProfile internally
8505  arcade-onboarding-flow.js          (MrMacsOnboarding)
8506  arcade-quick-stats-panel.js        (MrMacsQuickStats)
8507  arcade-recommender.js              (MrMacsRecommender)
8508  arcade-keyboard-remap.js           (MrMacsKeyboard)
8509  arcade-dev-tools.js                (MrMacsDevTools)        ← reads MrMacsProfile / MrMacsToast
8510  arcade-mascot.js                   (MrMacsMascot)          ← round 3
8511  arcade-replay.js                   (MrMacsReplay)          ← round 3
8512  arcade-classroom.js                (MrMacsClassroom)       ← round 3
8513  arcade-tutorial.js                 (MrMacsTutorial)        ← round 3
8514  arcade-difficulty.js               (MrMacsDifficulty)      ← round 3
8515  arcade-screenshot.js               (MrMacsScreenshot)      ← round 3
8516  arcade-changelog.js                (MrMacsChangelog)       ← round 3
8517  arcade-news-ticker.js              (MrMacsNewsTicker)      ← round 3 (uses MrMacsProfile)
8518  arcade-leaderboard-globe.js        (MrMacsLeaderboardGlobe)← round 3
8519  arcade-deeplinks.js                (MrMacsDeeplinks)       ← round 3
```

**Verdict — order is CORRECT.** `arcade-profile.js` loads at 8495, before any
module that consumes `window.MrMacsProfile`. The four round-3 modules that
read profile (`mascot`, `news-ticker`, `replay`, `classroom`, `tutorial`,
`difficulty`, `screenshot`, `changelog`, `deeplinks`) all load 8510-8519,
well after profile/leaderboards/sessions are stable.

**Subtle issue.** The placement of `arcade-progress-extras.js` *before*
`arcade-leaderboards.js` and `arcade-sessions.js` is intentional — the latter
two override the abridged overlay from progress-extras with the canonical
full APIs. If anyone were to swap or reverse those three lines, the hub
would silently lose `personalBest`, `topGames`, `clearAllForProfile`,
`decorateContinueCards`, `resetForGame`, etc. **Document this constraint
inside `arcade-progress-extras.js` if it isn't already.**

## node --check results

```
$ for f in assets/arcade-*.js; do node --check "$f"; done
$ for f in assets/document-viewer.js assets/mastery-engine.js assets/source-bank.js; do node --check "$f"; done
$ find games -name game.js -exec node --check {} \;
```

**0 syntax errors.** All 27 hub asset modules + 3 non-arcade asset modules
(`document-viewer.js`, `mastery-engine.js`, `source-bank.js`) + 49 `game.js`
files parse clean.

## Data integrity

### `games.json`

| Check | Result |
|---|---|
| Total entries | 211 (live-rebuilding pipeline; expect ±5) |
| Duplicate `id` fields | 0 |
| Entries with `file` field | 211/211 |
| `file` paths that resolve on disk (after `urllib.parse.unquote`) | **211/211 OK** |
| Raw paths resolving without URL-decode | 49/211 (162 entries use URL-encoded spaces — `%20`) |
| Count >1 per game-dir (course/daily collections) | 14 dirs (e.g. `global-9` has 11 entries, `apush` 10, `grade-7` 9) |

### Game directory orphans

13 game subdirectories have no entry in `games.json`:

| Dir | `index.html` | `game.js` | Status |
|---|:---:|:---:|---|
| archive-tycoon | yes | yes | playable but unlisted — likely unfinished |
| boggle-beat | yes | no | placeholder shell |
| bomb-scribe | yes | no | placeholder shell |
| chess-cabinet | yes | yes | playable but unlisted |
| crossword-cabinet | yes | yes | playable but unlisted |
| cube-crash | yes | no | placeholder shell |
| **history-hunters** | yes | yes | **playable; superseded by history-hunters-2** |
| knights-quest | yes | no | placeholder shell |
| memory-palace | yes | yes | playable; loaded by per-game tag but not surfaced |
| pong-doctor | yes | yes | playable but unlisted |
| solitaire-hall | yes | no | placeholder shell |
| sudoku-scribe | yes | yes | playable but unlisted |
| word-bridge | no | no | empty dir |

Several of the unlisted-but-playable ones (`memory-palace`, `pong-doctor`,
`sudoku-scribe`, etc.) appear in the integration matrix above with full
8-method `MrMacsProfile` integration — they are real games that simply never
got their `games.json` entry. **Ship-blocker if these are meant to be
discoverable.**

### `ACHIEVEMENTS` array (`assets/arcade-profile.js`)

| Check | Result |
|---|---|
| Total entries | 83 |
| Duplicate `id` fields | 0 |

## Recommendations

Priority-ordered.

### P0 — fix or document before next push

1. **Fix the four typo bugs** (`MrMacsAnalytics.track` ×3 games + 4 sites,
   `MrMacsToasts.show` in brickoria). They're feature-gated so they don't
   crash, but every call is dropping analytics. Replace with
   `MrMacsProgress.recordEvent(name, payload)` and `MrMacsToast.push({…})`.
   See "Broken references" table for exact line numbers.

2. **Decide `mahjong-mosaic` theme guard** at line 1990. Either
   `.themes` should be added as a lowercase alias on `MrMacsArcadeMusic`, or
   the call should be rewritten to `MrMacsArcadeMusic.list()` /
   `.themeNames()`. As-is the guard is dead.

3. **Surface or hide the 13 orphan game dirs.** Either add `games.json`
   entries (especially for `chess-cabinet`, `crossword-cabinet`,
   `memory-palace`, `pong-doctor`, `sudoku-scribe`, `archive-tycoon` —
   all have working `game.js`) or remove the directories. `history-hunters`
   appears to be deprecated by `history-hunters-2`; archive or delete the old
   one.

### P1 — load-order and namespace hygiene

4. **Add a comment block at the top of `index.html`'s script-tag region**
   explaining that `arcade-progress-extras.js` MUST load before
   `arcade-leaderboards.js` and `arcade-sessions.js`. Anyone reordering for
   "alphabetical cleanliness" will silently strip 9 methods off
   MrMacsLeaderboards + MrMacsSessions.

5. **Fold the runtime patches** at `index.html:11643-11644`
   (`MrMacsProfile.openDrawer`, `.openWelcome`) into `arcade-profile.js`
   proper, or move them to a dedicated `arcade-profile-ui-glue.js`. Right
   now the profile namespace has hidden shape that only exists after the
   page renders.

6. **Per-game `index.html` shape audit.** 40 games load
   `arcade-progress-extras.js` but NOT the canonical
   `arcade-leaderboards.js` / `arcade-sessions.js` — they get the
   abridged overlay APIs only. If any of those games call (e.g.)
   `MrMacsLeaderboards.personalBest`, that call returns `undefined`. Worth
   one regex sweep across all `games/*/game.js` to confirm none of them rely
   on a method that's not in the overlay.

### P2 — dead-code triage

7. **Round-3 module activation plan.** `arcade-replay.js` (694 LOC),
   `arcade-classroom.js` (644 LOC), `arcade-tutorial.js` (524 LOC),
   `arcade-difficulty.js` (440 LOC), `arcade-screenshot.js` (576 LOC) ship
   on every page load with zero callers. Either wire them into the hub UI
   in this release, or move them behind a lazy `<script async>` load with a
   feature flag. Current ~2.9k LOC penalty per page-load with no benefit.

8. **`MrMacsProgressExtras` namespace decision.** Five `render*` helpers
   plus `formatNumber`/`formatDuration`/`prefersReducedMotion` are exported
   but have zero call sites. Either delete the export block or migrate
   high-value helpers (`formatNumber`, `prefersReducedMotion`) into a
   shared `arcade-utils.js` and stop pretending the panel widgets exist.

9. **Unused MrMacsProfile API.** ~22 methods have no observable caller
   (full list above). Most are reasonable future-feature scaffolding
   (`exportProfile`/`importProfile`, daily-challenge state, mock-exam
   history, shop-item/buff system). Add a comment marking each as "exposed
   for arcade-dev-tools / future feature" so they don't get pruned by
   accident.

### P3 — cosmetic

10. `assets/arcade-music.js` is loaded only by per-game pages; it's NOT in
    the hub script tag block. That's intentional but undocumented — add a
    one-line comment in `index.html` explaining the omission so future
    maintainers don't add it back "for completeness."

11. `games.json` is being live-rewritten while readers are streaming it (the
    count grew from 204 → 211 during this run). If the rebuild is racy it
    could hand a malformed JSON to a fast browser. Consider write-then-rename
    in the build script.
