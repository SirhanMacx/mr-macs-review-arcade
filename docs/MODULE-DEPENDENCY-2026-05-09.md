# Module Dependency Audit · 2026-05-09

Read-only audit of the 27 `assets/arcade-*.js` modules and the script-tag order
in the hub `index.html`. Goal: catalog each module's external dependencies
(other `MrMacs*` globals it touches), confirm load order respects them, and
flag namespace collisions or race conditions.

---

## Module dependency graph

Legend:
- **Hard dep**: module crashes or core feature breaks if dep is absent
- **Soft dep**: defensive `if (root.MrMacsXxx)` guards — feature degrades but
  module still loads
- **Idempotent?**: re-loading the script after the global already exists is a
  no-op (`if (root.MrMacsXxx) return;`)

| # | Module | Hard deps | Soft deps | Provides | Idempotent? |
|---|--------|-----------|-----------|----------|-------------|
| 1 | `arcade-profile.js` | (none) | (none) | `MrMacsProfile` | yes (sentinel inside `API`) |
| 2 | `arcade-icons.js` | (none) | (none) | `MrMacsIcons` | yes |
| 3 | `arcade-perf.js` | (none) | `MrMacsProfile` (settings.motion) | `MrMacsArcadePerf` | yes (overwrites unconditionally) |
| 4 | `arcade-analytics.js` | (none) | (none) | `MrMacsProgress`, `MrMacsAnalytics` | **no guard** — overwrites on every load |
| 5 | `arcade-toast.js` | (none) | `MrMacsProfile`, `MrMacsIcons` | `MrMacsToast` | yes |
| 6 | `arcade-celebration.js` | (none) | `MrMacsProfile` | `MrMacsCelebration` | yes |
| 7 | `arcade-progress-extras.js` | (none) | `MrMacsProfile` | `MrMacsLeaderboards`, `MrMacsSessions`, `MrMacsProgressExtras` | yes (3-way: needs ALL three present to bail) |
| 8 | `arcade-leaderboards.js` | (none) | `MrMacsProfile` | `MrMacsLeaderboards` | yes (single-key guard) |
| 9 | `arcade-sessions.js` | (none) | `MrMacsProfile` | `MrMacsSessions` | yes |
| 10 | `arcade-cram-mode.js` | (none) | `MrMacsProfile`, `MrMacsArcade` | `MrMacsCramMode` | yes |
| 11 | `arcade-onboarding-flow.js` | (none) | `MrMacsProfile` | `MrMacsOnboarding` | yes |
| 12 | `arcade-quick-stats-panel.js` | (none) | `MrMacsProfile`, `MrMacsMastery` | `MrMacsQuickStats` | yes |
| 13 | `arcade-recommender.js` | (none) | `MrMacsProfile`, `MrMacsMastery` | `MrMacsRecommender` | yes |
| 14 | `arcade-keyboard-remap.js` | (none) | `MrMacsToast` | `MrMacsKeyboard` | yes |
| 15 | `arcade-dev-tools.js` | (none) | `MrMacsProfile`, `MrMacsToast`, `MrMacsCelebration` | `MrMacsDevTools` | yes |
| 16 | `arcade-mascot.js` | (none) | `MrMacsProfile`, `MrMacsCelebration` | `MrMacsMascot` | yes |
| 17 | `arcade-replay.js` | (none) | (none) | `MrMacsReplay` | yes |
| 18 | `arcade-classroom.js` | (none) | `MrMacsProfile` | `MrMacsClassroom` | yes |
| 19 | `arcade-tutorial.js` | (none) | `MrMacsProfile`, `MrMacsArcade` | `MrMacsTutorial` | yes |
| 20 | `arcade-difficulty.js` | (none) | (none) | `MrMacsDifficulty` | yes |
| 21 | `arcade-screenshot.js` | (none) | (none) | `MrMacsScreenshot` | yes |
| 22 | `arcade-changelog.js` | (none) | (none) | `MrMacsChangelog` | yes |
| 23 | `arcade-news-ticker.js` | (none) | `MrMacsProfile` | `MrMacsNewsTicker` | yes |
| 24 | `arcade-leaderboard-globe.js` | (none) | `MrMacsLeaderboards`, `MrMacsProfile` | `MrMacsLeaderboardGlobe` | yes |
| 25 | `arcade-deeplinks.js` | (none) | `MrMacsProfile`, `MrMacsCramMode`, `MrMacsDevTools`, `MrMacsOnboarding`, `MrMacsTour`, `MrMacsTutorial` | `MrMacsDeeplinks` | yes |
| 26 | `arcade-tour.js` | (none) | `MrMacsProfile` | `MrMacsTour`, `MrMacsArcadeTour` (alias) | yes (2-key guard: bails only if BOTH already exist) |
| 27 | `arcade-music.js` (not loaded on hub) | (none) | `MrMacsProfile` | `MrMacsArcadeMusic` | **no guard** — overwrites on every load |

**Observations:**
- Every module is **soft-dependent only**. No module hard-imports another —
  every dependency is wrapped in `if (root.MrMacsXxx)` checks. So the hub
  cannot crash purely from script-order issues; the worst case is silent
  feature degradation.
- `MrMacsArcade` (referenced by `arcade-cram-mode.js` and
  `arcade-tutorial.js`) is **not produced by any module in `assets/`**. It is
  apparently a hub-page global set inline in `index.html` (or never set,
  in which case those branches simply skip).
- `MrMacsMastery` is produced by `assets/mastery-engine.js` (loaded later in
  `index.html`, after the deeplinks tag).
- `MrMacsSourceBank` is produced by `assets/source-bank.js`.

---

## Hub script-tag order analysis (`index.html` lines 8494-8519)

```
 1. arcade-analytics.js
 2. arcade-profile.js
 3. arcade-perf.js
 4. arcade-tour.js
 5. arcade-icons.js
 6. arcade-toast.js
 7. arcade-celebration.js
 8. arcade-progress-extras.js     ← exports {Leaderboards, Sessions, ProgressExtras}
 9. arcade-leaderboards.js        ← single-key guard, BAILS (see Finding A)
10. arcade-sessions.js            ← single-key guard, BAILS (see Finding A)
11. arcade-cram-mode.js
12. arcade-onboarding-flow.js
13. arcade-quick-stats-panel.js
14. arcade-recommender.js
15. arcade-keyboard-remap.js
16. arcade-dev-tools.js
17. arcade-mascot.js
18. arcade-replay.js
19. arcade-classroom.js
20. arcade-tutorial.js
21. arcade-difficulty.js
22. arcade-screenshot.js
23. arcade-changelog.js
24. arcade-news-ticker.js
25. arcade-leaderboard-globe.js
26. arcade-deeplinks.js
─── below this line, source-bank + mastery-engine ───
27. source-bank.js
28. mastery-engine.js
```

`arcade-music.js` is **not loaded on the hub** at all (only in flagship game
shells). All hub modules load via plain `<script src>` (no `defer`/`async`),
so they execute synchronously in document order — relevant because every
module attaches via simple `if (root.MrMacsXxx)` patterns rather than waiting
on `DOMContentLoaded`.

### Order verification per soft-dep
- ✅ `arcade-perf.js` reads `MrMacsProfile` — profile loads at #2, before perf at #3.
- ✅ `arcade-toast.js` reads `MrMacsProfile`, `MrMacsIcons` — both load before #6.
- ✅ `arcade-celebration.js` reads `MrMacsProfile` — loads before #7.
- ⚠️ `arcade-progress-extras.js` (#8) reads `MrMacsProfile` — fine, but see **Finding A** below for the deeper issue.
- ✅ `arcade-cram-mode.js` reads `MrMacsProfile` — fine.
- ✅ `arcade-quick-stats-panel.js` reads `MrMacsMastery` — `mastery-engine.js` loads at #28 (after quick-stats #13). `MrMacsMastery` will be undefined at script-execution time, but quick-stats reads it lazily inside `render()` so the read happens after both have loaded. ✅ no issue in practice.
- ✅ `arcade-recommender.js` same lazy `MrMacsMastery` pattern.
- ✅ `arcade-keyboard-remap.js` reads `MrMacsToast` — toast loads before keyboard.
- ✅ `arcade-dev-tools.js` reads several deps — all load before #16.
- ✅ `arcade-mascot.js` reads `MrMacsProfile`, `MrMacsCelebration` — both before #17.
- ✅ `arcade-leaderboard-globe.js` (#25) reads `MrMacsLeaderboards` — exists by #8 / #9, fine.
- ✅ `arcade-deeplinks.js` (#26) reads many — every dep exists by then.
- ✅ `arcade-tour.js` (#4) loads before deeplinks (#26).

**Verdict:** every soft-dep is satisfied by load order. There are no broken
ordering dependencies. The one substantive bug is the namespace overlap
between progress-extras and the dedicated leaderboards/sessions modules.

---

## Namespace overlaps (where 2+ modules export the same global)

### Finding A · CRITICAL · `MrMacsLeaderboards` + `MrMacsSessions` are double-exported

`arcade-progress-extras.js` (line 60) bundles three exports together:

```js
if (root.MrMacsLeaderboards && root.MrMacsSessions && root.MrMacsProgressExtras) return;
…
root.MrMacsLeaderboards = { submit, top, best, clearAll, … };  // 5 methods
root.MrMacsSessions      = { save, load, clear, listAll, … };  // 5 methods
root.MrMacsProgressExtras = { renderMiniHud, renderScoreChip, … };
```

Since this loads at #8 — **before** the dedicated `arcade-leaderboards.js`
(#9, single-key guard `if (root.MrMacsLeaderboards) return;`) and
`arcade-sessions.js` (#10, single-key guard `if (root.MrMacsSessions) return;`)
— the dedicated modules detect their namespace already taken and **bail
immediately**. The hub runs with only the slim progress-extras stubs.

The richer dedicated APIs are silently lost:

| API method | progress-extras stub | dedicated module |
|------------|---------------------|------------------|
| `MrMacsLeaderboards.personalBest` | ❌ absent | ✅ present |
| `MrMacsLeaderboards.allEntries`   | ❌ absent | ✅ present |
| `MrMacsLeaderboards.topGames`     | ❌ absent | ✅ present |
| `MrMacsLeaderboards.renderGameLeaderboard` | ❌ absent | ✅ present |
| `MrMacsLeaderboards.resetForGame` | ❌ absent | ✅ present |
| `MrMacsLeaderboards.on` / `off`   | ❌ absent | ✅ present |
| `MrMacsSessions.clearAllForProfile` | ❌ absent | ✅ present |
| `MrMacsSessions.listActive`       | ❌ absent | ✅ present (richer than `listAll`) |
| `MrMacsSessions.on` / `off`       | ❌ absent | ✅ present |

Both modules use the same `localStorage` keys
(`mr-macs-arcade-leaderboards-v1`, `mr-macs-arcade-sessions-v1`), so data
persists across either implementation — but anything relying on
`MrMacsLeaderboards.personalBest()` or the event-emitter API (`on`/`off`)
will hit `TypeError: ... is not a function`.

`arcade-leaderboard-globe.js` calls `L().top(id, 50)` and
`L().personalBest(id)` (line 18-19 of its docstring) — `personalBest` does
**not exist** on the progress-extras stub, so the globe's personal-best
overlay is broken on the hub.

### Finding B · MEDIUM · `arcade-analytics.js` has no idempotency guard

```js
window.MrMacsProgress = { … };  // line 532
window.MrMacsAnalytics = { … }; // line 920
```

Neither write is gated. If the script is included twice (or if a future
module tries the same trick), the later definition silently wipes the prior
one. Same flaw on `arcade-music.js` (line 715, `window.MrMacsArcadeMusic =`).
For the hub today this is benign — analytics loads exactly once — but it is
brittle.

### Finding C · LOW · `arcade-tour.js` two-key guard

```js
if (window.MrMacsArcadeTour && window.MrMacsTour) return;
```

Tour is the new canonical name; `MrMacsArcadeTour` is preserved as a back-
compat alias. Both are exported. The guard requires both to exist before
bailing, mirroring the progress-extras pattern. No conflict in practice
(no other module exports either name), but the pattern is unusual.

### Finding D · LOW · `MrMacsArcade` referenced but never defined in `assets/`

`arcade-cram-mode.js` (line 102) and `arcade-tutorial.js` (line 241) both
read `root.MrMacsArcade.games` and `root.MrMacsArcade.getScore()` defensively.
No module in `assets/arcade-*.js` exports `MrMacsArcade`. Either the hub's
inline `<script>` blocks set it, or the references are dead — worth
confirming.

---

## Recommendations

1. **Fix Finding A** (highest priority). Three options:
   - **Preferred:** strip the leaderboard + sessions stubs out of
     `arcade-progress-extras.js` entirely. Rename the file to
     `arcade-progress-hud.js` (or just `arcade-progress.js`) and have it
     export only `MrMacsProgressExtras`. The dedicated `arcade-leaderboards.js`
     and `arcade-sessions.js` then own their namespaces uncontested. This is
     the cleanest fix and matches what the richer modules clearly intend.
   - **Alternative:** swap script-tag order so `arcade-leaderboards.js` and
     `arcade-sessions.js` load BEFORE `arcade-progress-extras.js`. The
     progress-extras 3-way guard would then see the dedicated modules
     already present, skip those exports, and still install
     `MrMacsProgressExtras`. Requires no code change but couples ordering
     correctness to a non-obvious invariant.
   - **Worst:** delete `arcade-leaderboards.js` and `arcade-sessions.js`
     and live with the slim API. Drops features.

2. **Fix Finding B**. Add idempotency guards to `arcade-analytics.js` and
   `arcade-music.js`:

   ```js
   if (window.MrMacsAnalytics && window.MrMacsProgress) return;
   ```

3. **Confirm Finding D**. Search `index.html` and any hub-init code for
   `window.MrMacsArcade =`. If the global is genuinely set there, document
   the contract; if not, remove the dead branches in cram-mode and tutorial.

4. **Document the canonical load order** in a comment block at the top of
   `index.html` so future contributors don't break it. Example:

   ```html
   <!-- Load order is significant. See docs/MODULE-DEPENDENCY-2026-05-09.md
        for the full graph. Profile must come before perf/toast/celebration;
        leaderboards.js + sessions.js must come before progress-extras.js;
        deeplinks.js must come last. -->
   ```

5. **Consider eliminating the single-file three-namespace pattern.** The
   progress-extras file mixing leaderboards + sessions + HUD widgets in one
   IIFE is the root cause of every issue in this audit. Splitting it
   removes a class of bugs.

---

## Per-game flagship script-tag inventory

Sampled 5 representative game shells. None of the games re-load
`arcade-progress-extras.js`, so the `MrMacsLeaderboards` namespace inside a
game (when running standalone in `games/<id>/index.html`) comes only from
the dedicated `arcade-leaderboards.js` if that game loads it — which none
of these 5 do. Practical impact: flagship games only see the dedicated
leaderboards API if they call from inside the hub iframe (where progress-
extras has already poisoned the namespace).

| Game shell | Modules loaded | Missing from hub-set |
|------------|----------------|---------------------|
| `games/timeline-runner/index.html` | profile, analytics, source-bank, perf, tour, toast, progress-extras, music, icons | celebration, leaderboards (dedicated), sessions (dedicated), recommender, replay, deeplinks, mascot |
| `games/history-hunters/index.html` | perf, tour, profile, analytics, source-bank | toast, icons, celebration, progress-extras, leaderboards, sessions, music |
| `games/review-maze-chase/index.html` | analytics, profile, perf, tour, music, source-bank, icons | toast, celebration, progress-extras, leaderboards, sessions |
| `games/chrono-defense/index.html` | analytics, source-bank, profile, perf, tour, toast, progress-extras, music, icons | celebration, leaderboards (dedicated), sessions (dedicated), replay |
| `games/boss-rush/index.html` | icons, profile, perf, tour, music | analytics, toast, celebration, progress-extras, leaderboards, sessions, source-bank |

**Observations:**
- No flagship loads `arcade-celebration.js`, even though several games likely
  trigger achievement-unlock celebrations through `MrMacsProfile` events.
  Those celebrations only fire when the game runs **inside** the hub
  (where `arcade-celebration.js` is loaded). Standalone game pages skip the
  fanfare.
- No flagship loads `arcade-leaderboards.js` (the dedicated module). Games
  that want top-5 submission rely on the slim `submit/top/best/clearAll` API
  available either from progress-extras (when in hub) or… nothing
  (standalone). Standalone game pages have **no leaderboard back-end** unless
  the game itself ships its own.
- Load order inside flagships is inconsistent: timeline-runner has
  `profile → analytics → source-bank → perf → tour → toast → progress-extras
  → music → icons`, while history-hunters has `perf → tour → profile`. Both
  work because deps are soft, but enforcing one canonical order would be
  cleaner.

---

## Summary

- **27 hub modules audited**, 26 loaded by `index.html`, 1
  (`arcade-music.js`) loaded only by flagship games.
- **No hard dependencies** between modules — every cross-module reference
  is defensive (`if (root.MrMacsXxx)`). Load order can degrade features
  but cannot crash the hub.
- **One blocking issue (Finding A):** `arcade-progress-extras.js` loads
  before `arcade-leaderboards.js` and `arcade-sessions.js` and grabs all
  three namespaces, causing the dedicated modules to short-circuit on
  their idempotency guards. The hub runs with the slim 5-method
  leaderboard API instead of the rich 12-method API the dedicated module
  defines. **`arcade-leaderboard-globe.js` calls `personalBest()` which
  does not exist on the slim stub — the globe's personal-best overlay is
  silently broken on the hub today.**
- **Two style issues:** `arcade-analytics.js` and `arcade-music.js` lack
  idempotency guards (Finding B); `arcade-tour.js` uses an unusual 2-key
  guard for the canonical/legacy alias pair (Finding C, benign).
- **One reference-without-source:** `MrMacsArcade` (Finding D) is read by
  cram-mode and tutorial but produced by no `assets/arcade-*.js` module —
  presumably set by hub inline JS; worth confirming.
- **Recommended next step:** strip the leaderboards/sessions exports out
  of `arcade-progress-extras.js` so the dedicated modules win their
  namespaces. Single-file three-namespace IIFEs cause every subtle bug in
  this audit.
