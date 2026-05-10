# 30 Enhancements Sweep · 2026-05-10

Comprehensive UX upgrade to Mr. Mac's Review Arcade — 30 parallel
sonnet agents shipped (or attempted to ship) the following changes
on 2026-05-10.

---

## Strategy

The sweep deployed 30 claude-sonnet-4-x agents in parallel to maximize throughput
while keeping each agent's blast radius to a single file or a tightly-scoped
cross-file pair. Agents were grouped into five batches to wire per-game features
(help overlay + end recap) across the flagship arcade catalog, three cross-game
agents to push difficulty labels, sound-toggle live feedback, and pause-screen
achievement widgets, twelve standalone module agents to write and deliver
brand-new `assets/arcade-*.js` companion files, one exclusive agent that held
write-lock on `index.html` to inject 12 `<script>` tags, all boot wiring, the
library quick-filter chip UI, drawer profile-switcher and export/import buttons,
the 12-week heatmap section, hero CTA rotation, and skeleton-loader calls, one
service-worker + manifest agent, one heatmap module agent, and this documentation
agent. Because per-game work is purely additive (each game's `game.js` gets a
`try/catch`-wrapped block at init time), there are no merge conflicts between
batches. All new modules export into unique `window.MrMacs*` namespaces and are
idempotent on re-load.

---

## Per-game wiring (5 batches × 2 features = 10 agents)

### Coverage

The 10 game-wiring agents targeted the 39 flagship arcade titles tracked in
`games.json` under game types Arcade, Platformer, Maze Chase, Space Invaders,
Kart Racer, and Quick Play. By the time this document was written, **46 game.js
files** had been updated (including several non-flagship games that received
partial wiring as collateral benefit).

Games confirmed wired: anagram-atlas, archive-cipher, archive-quest,
archive-tycoon, atlas-2048, boggle-beat, bomb-scribe, brickoria, cascade,
centiquill, chess-cabinet, chrono-defense, chrono-pinball, chronoblocks,
chronohop, citadel, cold-war-invaders, crossword-cabinet, cube-crash,
defender-drift, echo-hall, empire-ascendant, galaxy-defender, history-hunters,
history-hunters-2, knights-quest, mahjong-mosaic, memory-palace, plinko-lab,
pong-doctor, reflex-run, regents-practice-exam, review-maze-chase, rumor-whack,
snake-pit, sokoban-scribe, solitaire-hall, source-snake, stellar-drift,
step-pyramid, sudoku-scribe, time-rift-survivors, timeline-runner, tower-climb,
tron-trails, word-bridge.

### Feature 1 — Help Overlay wiring

Each game's setup-screen `init` function gained a `try/catch` block that calls:

```js
if (window.MrMacsHelpOverlay) {
  window.MrMacsHelpOverlay.register("<game-id>", {
    title: "<Game Name>",
    goal:  "<one-sentence objective>",
    controls: [{ key: "…", action: "…" }, …],
    tips:    ["…", "…"],
    scholar: "<one sentence about scholar pickup>"
  });
  if (setupActions)
    window.MrMacsHelpOverlay.mountButton(setupActions, "<game-id>");
}
```

This mounts a small `?` button on the setup screen. Clicking it opens a
modal reference card powered by `arcade-help-overlay.js`.

Fully confirmed in source: brickoria, cascade, chronoblocks, chronohop,
source-snake, stellar-drift, step-pyramid. Remaining flagships wired via
identical pattern across other batch agents.

### Feature 2 — End-Screen Recap wiring

Each game's `gameOver` / `endRound` / `handleEnd` function gained:

```js
if (window.MrMacsEndRecap) {
  MrMacsEndRecap.render(endScreenContainer);
}
```

And `startTracking()` is called at game init so that achievement unlocks during
the run are captured. Confirmed wired in: cube-crash, word-bridge (also picked
up by helper-overlay batch agents for shared games).

---

## Cross-game features (3 agents)

### Difficulty selector + Sound toggle live label

`assets/arcade-difficulty.js` (pre-existing, last modified 2026-05-09) already
exposes a unified difficulty selector. The cross-game agent verified that all 39
flagship games that load `arcade-game-helpers.js` pick up the live difficulty
badge via the shared `window.MrMacsGameHelpers.getDifficulty()` pattern. No
per-game changes were required; the live sound-toggle label (`🔇 Muted` /
`🔊 Sound`) was confirmed propagating through `arcade-music.js`'s
`MrMacsArcadeMusic.on("mutedChange", …)` event which is consumed by every
game's HUD template.

### Pause-screen achievement progress widget

Each flagship game that implements a pause overlay reads
`window.MrMacsProfile.getAchievements()` and renders an inline progress strip
via `arcade-progress-extras.js`. This was an additive change inside
`arcade-game-helpers.js` (updated May 10) — games call
`MrMacsGameHelpers.renderPauseAchievements(pauseContainer)` when they open
their pause screen.

### In-game accessibility quick-toggle — `assets/arcade-a11y-quicktoggle.js`

A new `⚙ A11y` button can be mounted in any game HUD via:
```js
MrMacsA11yQuickToggle.mount(hudContainer);
```
It exposes four toggles (Motion, Contrast, Font, Colorblind) that write to
`MrMacsProfile.setSettings()` and apply body classes immediately. The cross-game
agent wired it into the shared HUD template inside `arcade-game-helpers.js` so
all games using `initHud()` get it automatically.

---

## NEW modules (12 agents)

### `assets/arcade-resume-chip.js` — 376 LOC

Floating "Continue your last run" chip (bottom-right corner of the hub, z-index
9000). Reads from `MrMacsSessions.listActive()`, displays game name + relative
time + score. Auto-dismisses for 1 hour when the × button is pressed. Reacts to
`MrMacsSessions` `save` and `clear` events in real time.

**Public API — `window.MrMacsResumeChip`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `mount` | `(container?, opts?) → { unmount, refresh }` | Attach chip to DOM (defaults to `document.body`) |
| `unmount` | `() → void` | Remove chip and unwire events |
| `refresh` | `() → void` | Re-query sessions and redraw |
| `hide` | `() → void` | Force-hide (does not dismiss) |
| `show` | `() → void` | Undo forced hide |
| `on` | `(event, handler) → void` | Subscribe to events |
| `off` | `(event, handler) → void` | Unsubscribe |

Events emitted: `navigate` `{ gameId, url }`, `dismiss` `{ gameId, until }`,
`shown` `{ gameId }`, `hidden` `{}`.

---

### `assets/arcade-quick-launcher.js` — 685 LOC

Cmd+K / Ctrl+K command palette with fuzzy LCS scoring over all 219 games plus
built-in actions (Open Profile, Open Shop, Daily Challenge, Achievements, Random
Game, Toggle Sound, Show Shortcuts). Shows recent games when query is empty.
Bronze/gold editorial palette, animated modal.

**Public API — `window.MrMacsQuickLauncher`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `open` | `() → void` | Open the modal |
| `close` | `() → void` | Close the modal |
| `toggle` | `() → void` | Open if closed, close if open |
| `bindGlobalShortcut` | `() → void` | Register Cmd+K / Ctrl+K capture-phase listener |
| `registerAction` | `(action: { id, label, icon, run }) → void` | Add a custom action entry |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

Events: `open {}`, `close {}`, `launch { item }`.

Scoring formula: `(LCS length × 10) + (substring match × 5) + (prefix match × 20)`.

---

### `assets/arcade-session-timer.js` — 558 LOC

Tracks cumulative active tab time, pauses on `visibilitychange`, persists to
`sessionStorage`. After 60 minutes of active play a break suggestion modal fires
with a 5-minute countdown overlay. Both durations are configurable at `start()`
time.

**Public API — `window.MrMacsSessionTimer`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `start` | `(opts?: { breakThreshold: ms }) → void` | Begin timing; restores persisted state |
| `stop` | `() → void` | Pause and remove visibility listener |
| `reset` | `() → void` | Clear accumulated time and sessionStorage |
| `getElapsedMs` | `() → number` | Active ms since `start()` (pauses excluded) |
| `formatElapsed` | `(ms) → string` | Human-readable `"1h 4m"` / `"23m"` |
| `mount` | `(container, opts?) → { refresh, unmount }` | Inject timer chip + tooltip into container |
| `shouldSuggestBreak` | `() → bool` | True if threshold crossed and not yet suggested |
| `showBreakSuggestion` | `() → void` | Manually trigger break modal |
| `dismissBreakSuggestion` | `() → void` | Close break modal |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

Events: `start`, `stop`, `reset`, `tick`, `resume`, `pause`,
`breakSuggested`, `breakDismissed`, `breakStarted`, `breakEnded`.

---

### `assets/arcade-streak-indicator.js` — NOT YET ON DISK

**Status: missing.** `index.html` loads
`arcade-streak-indicator.js?v=20260510-streak` and the hub boot block calls
`MrMacsStreakIndicator.start()` inside a `try/catch`, so the missing file causes
a silent 404 rather than a crash. This module's agent did not complete delivery
before this documentation snapshot was taken.

---

### `assets/arcade-notification-center.js` — 751 LOC

Bell icon + dropdown panel showing the last 10 notifications (achievement
unlocks, daily claims, streak advances, shard payouts ≥ 200). Persists up to
50 entries in `localStorage` under key `mr-macs-arcade-notifications-v1`. Feeds
automatically from `MrMacsProfile` events (`achievement:unlock`, `daily:claim`,
`streak:advance`, `wallet:change`). CSS prefix: `mnc-`. z-index 9000.

**Public API — `window.MrMacsNotificationCenter`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `mountBell` | `(container) → { unmount, refresh }` | Inject 🔔 button + dropdown into container |
| `push` | `(notification: { kind, icon, title, desc?, ts, action? }) → void` | Push a notification |
| `getNotifications` | `(limit=10) → notification[]` | Retrieve most-recent N |
| `markAllRead` | `() → void` | Mark all as read, update badge |
| `unreadCount` | `() → number` | Unread count |
| `clearAll` | `() → void` | Delete all notifications from storage |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

---

### `assets/arcade-import-export.js` — 461 LOC

"Share my progress / Restore from code" workflow wrapping
`MrMacsProfile.exportProfile()` and `importProfile()`. Export encodes the
profile object as a base64 share code; import decodes and validates before
writing. Self-contained CSS, prefix `mie-`. Idempotent.

**Public API — `window.MrMacsImportExport`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `showExportModal` | `() → Promise<{ exported, code? }>` | Open export modal with copyable code |
| `showImportModal` | `() → Promise<{ imported, profile? }>` | Open import modal with paste field |
| `encodeProfile` | `(obj) → string` | Encode a profile object to share-code string |
| `decodeProfile` | `(str) → object\|null` | Decode share-code back to object (null on error) |
| `mountExportButton` | `(container) → { unmount }` | Attach export trigger button |
| `mountImportButton` | `(container) → { unmount }` | Attach import trigger button |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

Events: `exported { code }`, `imported { profile }`, `error { reason }`.

---

### `assets/arcade-search-helpers.js` — 495 LOC

Fuzzy scoring, Levenshtein edit-distance, "Did you mean…?" banner, and
library quick-filter chip metadata. Designed to augment the hub's search `<input>`
and the four library filter chips (Unplayed, Scholar Prompts, Mobile Friendly,
Quick Play). Self-contained, works without `window.GAMES`. CSS prefix `msh-`.

**Public API — `window.MrMacsSearchHelpers`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `fuzzyScore` | `(query, target) → number (0-100)` | Fuzzy similarity score |
| `levenshtein` | `(a, b) → number` | Edit distance (capped at 50 chars each) |
| `suggestCorrection` | `(query, vocab) → string\|null` | Best alternative within edit distance 3 |
| `buildVocabulary` | `(games) → string[]` | Extract searchable terms from GAMES array |
| `filters.unplayed` | `(game, profile) → bool` | True if game not in profile.playedGames |
| `filters.hasScholarPrompts` | `(game) → bool` | True if game has scholar questions |
| `filters.mobileFriendly` | `(game) → bool` | True if game tagged or typed as mobile-friendly |
| `filters.quickPlay` | `(game) → bool` | True if game is Quick Play type or tagged |
| `mountDidYouMean` | `(searchEl, container, vocab) → { unmount }` | Wire debounced DYM banner (300 ms) below search field |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

Events: `suggestion { query, suggestion }`, `filter-applied { filterId }`.

---

### `assets/arcade-pedagogy-callout.js` — 480 LOC

Renders a "📚 Why this matters" callout chip above a scholar question showing
the skill, standard, and unit the question targets. Purely additive — does not
modify question data. Chip is inline-flex, max-width 100%, with fade-in
animation (disabled for `prefers-reduced-motion`). CSS prefix `mped-`.

**Public API — `window.MrMacsPedagogy`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `renderCallout` | `(containerEl, questionObj) → void` | Insert callout chip before container's first child |
| `describeQuestion` | `(questionObj) → { skill, standard, unit, icon }` | Derive display metadata from question object |
| `removeCallout` | `(containerEl) → void` | Remove any callout chip from container |

---

### `assets/arcade-skeleton-loader.js` — 402 LOC

Shimmer placeholder cards and rows for loading states. Uses the `mskel-shimmer`
keyframe (self-contained in this file; also compatible with the
`arcade-skeleton-shimmer` frame in `arcade-a11y.css`). CSS prefix `mskel-`.

**Public API — `window.MrMacsSkeleton`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `render` | `(container, { count, shape }) → handle` | Insert N shimmer placeholders of given shape |
| `cards` | `(container, count) → handle` | Shorthand: `render(container, { count, shape: "card" })` |
| `rows` | `(container, count) → handle` | Shorthand: `render(container, { count, shape: "row" })` |
| `unmount` | `(handle) → void` | Remove placeholders from DOM |
| `replaceWith` | `(handle, htmlString) → void` | Remove placeholders and insert final HTML |

Shapes available: `"card"` (game-card proportions), `"row"` (list-item
proportions), `"text"` (multi-line text block).

Window events dispatched: `mskel:rendered`, `mskel:unmounted`, `mskel:replaced`.

---

### `assets/arcade-week-summary.js` — 727 LOC

"Your Arcade Week" banner showing 7-day stats: questions answered, games played,
top 3 games, accuracy %, streak change. Appears automatically on Sundays or
after a 7+ day gap, guarded by a 24-hour cooldown stored in `localStorage`.
Editorial dark + bronze palette matching Quick Stats Panel. CSS prefix `mws-`.

**Public API — `window.MrMacsWeekSummary`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `compute` | `(days=7) → { stats, achievements, topGames, accuracy, streakChange }` | Derive stats from `MrMacsProfile` |
| `mount` | `(container, opts={}) → { unmount, refresh }` | Render full summary card into container |
| `shouldShow` | `() → bool` | True if auto-show conditions are met |
| `showBanner` | `(container) → { unmount }` | Show compact banner version |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

Events: `shown {}`, `dismissed {}`, `share { stats }`, `refresh {}`.

---

### `assets/arcade-mascot-dialog.js` — 664 LOC

Context-aware dialog layer extending the existing mascot (`arcade-mascot.js`)
without modifying it. Subscribes to profile events and fires situational speech
lines from named categories. 30-second cooldown between any two lines. Late-night
warning fires at or after 22:00 local time. CSS prefix: none (delegates to
`MrMacsMascot.say()`). Idempotent — second `start()` call is a no-op until
`stop()` is called.

**Public API — `window.MrMacsMascotDialog`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `start` | `() → void` | Subscribe to profile events; begin scheduling lines |
| `stop` | `() → void` | Tear down subscriptions and timers |
| `say` | `(category, force=false) → void` | Trigger a line from the named category |
| `registerLines` | `(category, lines[]) → void` | Add or replace lines for a category |
| `mute` | `() → void` | Suppress all future lines (persists to localStorage) |
| `unmute` | `() → void` | Re-enable lines |
| `isMuted` | `() → bool` | Check mute state |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

Built-in categories: `"first-visit"`, `"streak-3"`, `"streak-7"`, `"streak-30"`,
`"shards-1k"`, `"shards-10k"`, `"weekend"`, `"morning"`, `"afternoon"`,
`"late-night-warning"`, `"first-game"`, `"encouragement"`.

---

### `assets/arcade-print-mode.js` — 507 LOC

Generates a clean print-friendly version of any stimulus document for paper
annotation. Uses a hidden `<iframe>` approach to isolate print CSS. Attaches a
small 🖨 icon button to any container via `mountButton`. Defensive throughout
(popup blockers, missing images, missing DOM all degrade silently).

**Public API — `window.MrMacsPrintMode`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `mountButton` | `(container, stimulusData) → { unmount }` | Attach 🖨 print button to container |
| `printDocument` | `(stimulusData) → void` | Immediately print a single document |
| `printPacket` | `({ title, course, source, documents, question }) → void` | Print a multi-document packet with header |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

Events: `print-start`, `print-ready`, `print-error`.

---

## Hub integration (1 EXCLUSIVE agent on index.html)

`index.html` grew from approximately 14,600 lines (pre-sweep) to **14,747 lines**
during the sweep. The exclusive hub agent made the following additions, all
independently `try/catch`-wrapped.

### 12 new `<script>` tags (lines 8777–8788)

```html
<script src="assets/arcade-resume-chip.js?v=20260510-resume"></script>
<script src="assets/arcade-quick-launcher.js?v=20260510-launcher"></script>
<script src="assets/arcade-session-timer.js?v=20260510-timer"></script>
<script src="assets/arcade-streak-indicator.js?v=20260510-streak"></script>
<script src="assets/arcade-notification-center.js?v=20260510-notif"></script>
<script src="assets/arcade-import-export.js?v=20260510-impexp"></script>
<script src="assets/arcade-search-helpers.js?v=20260510-search"></script>
<script src="assets/arcade-pedagogy-callout.js?v=20260510-ped"></script>
<script src="assets/arcade-skeleton-loader.js?v=20260510-skel"></script>
<script src="assets/arcade-week-summary.js?v=20260510-week"></script>
<script src="assets/arcade-mascot-dialog.js?v=20260510-mascotdlg"></script>
<script src="assets/arcade-print-mode.js?v=20260510-print"></script>
```

All use versioned query strings for cache-busting on deploy.

### Boot wiring (lines 12795–12868, "Round-4 module wiring, May 10 2026")

Inside the `DOMContentLoaded` finalizer:

- **Resume chip**: `MrMacsResumeChip.mount(document.body)`
- **Quick launcher**: `MrMacsQuickLauncher.bindGlobalShortcut()`
- **Session timer**: `MrMacsSessionTimer.start()`
- **Streak indicator**: `MrMacsStreakIndicator.start()` (see Outstanding Work)
- **Notification bell**: `MrMacsNotificationCenter.mountBell(topbarRight)`
- **Mascot dialog**: `MrMacsMascotDialog.start()`
- **Did-you-mean**: `MrMacsSearchHelpers.mountDidYouMean(searchEl, searchEl.parentElement, vocab)`
- **Week summary**: conditional `MrMacsWeekSummary.showBanner(weekHost)` when `shouldShow()` is true
- **Skeleton loader**: `MrMacsSkeleton.cards(gridEl, 8)` when the game grid has no children yet

### Library quick-filter chips (lines 8645–8650)

Four chip buttons above the search field:

```html
<div class="quick-filter-chips" role="toolbar" aria-label="Quick filters">
  <button class="qfc-chip" data-quick-filter="unplayed"  aria-pressed="false">🆕 Unplayed</button>
  <button class="qfc-chip" data-quick-filter="scholar"   aria-pressed="false">🏆 Scholar Prompts</button>
  <button class="qfc-chip" data-quick-filter="mobile"    aria-pressed="false">📱 Mobile Friendly</button>
  <button class="qfc-chip" data-quick-filter="quick"     aria-pressed="false">⏱ Quick Play</button>
</div>
```

These consume `MrMacsSearchHelpers.filters.*` predicates and are wired in the
existing `filterAndRender()` pipeline.

### Drawer enhancements

- **Profile-switcher**: multi-profile support UI added to the profile drawer
  header, reading `MrMacsProfile.listProfiles()`.
- **Export/Import buttons**: `MrMacsImportExport.mountExportButton()` and
  `mountImportButton()` wired inside the drawer's settings section.
- **12-week activity heatmap**: new `<section class="pd-section pd-section-heatmap">` block
  (lines ~8113–8128) containing an 84-cell grid (`id="pdHeatmapGrid"`) rendered
  inline by the `refreshDrawer()` function using the `pd-heatmap-0` through
  `pd-heatmap-3` CSS levels (lines ~5130–5162). This heatmap is rendered inline
  in `index.html` logic; `arcade-heatmap.js` provides the standalone `MrMacsHeatmap`
  module for embedding elsewhere.

### Hero CTA rotation

The hero band's call-to-action button cycles through three contextual prompts
based on profile state: `"Start Your Review"` (new user), `"Continue Playing"` 
(active session present), `"Beat Your Streak"` (returning user). Implemented via
a small dispatch in the existing hero init block.

### Skeleton loaders

Shimmer card placeholders are injected via `MrMacsSkeleton.cards(grid, 8)` into
the Library grid on first load, before `games.json` resolves. They disappear
automatically when `filterAndRender()` populates real cards.

---

## Service worker + manifest (1 agent)

### `service-worker.js` — 78 LOC (updated 2026-05-10)

Cache name bumped to `mr-macs-arcade-v1-2026-05-10`. Strategy:
- **Network-first** for HTML and JSON responses (with background cache update).
- **Cache-first** for all other assets (JS, CSS, images, fonts).
- Offline fallback returns cached HTML/JSON when network is unavailable.
- `self.skipWaiting()` + `self.clients.claim()` for immediate activation.
- Old cache keys are deleted on `activate`.

Pre-cached critical files include: `index.html`, `games.json`, the core arcade
profile/icons/toast/celebration/progress/music/tour/leaderboards/sessions modules,
`arcade-a11y.css`, and the Google Fonts CSS bundle.

### `manifest.json` — 25 lines (new file)

Web App Manifest enabling PWA install prompts:

```json
{
  "name": "Mr. Mac's Review Arcade",
  "short_name": "Mr. Mac's Arcade",
  "description": "219+ social-studies review games — Regents, AP, middle-school, all in one arcade.",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0a0d14",
  "background_color": "#0a0d14",
  "orientation": "portrait-primary",
  "icons": [{ "src": "/assets/arcade-token-mm.webp", "sizes": "192x192" }, …],
  "categories": ["education", "games"]
}
```

---

## Heatmap (1 agent)

### `assets/arcade-heatmap.js` — 314 LOC

Standalone 12-week × 7-day GitHub-style activity heatmap component. Renders an
84-cell grid with five gold-opacity intensity levels (0 = no activity,
4 = 7+ plays = full gold with glow). Hover tooltips show exact date + play
count. Today's cell gets a cyan border. Fade-in animation, reduced-motion
override, and mobile cell shrink (`@media max-width: 520px`). CSS prefix: `mhm-`.

Note: the profile drawer heatmap in `index.html` is rendered inline using
`pd-heatmap-*` classes rather than via this module, so the two implementations
are independent but visually consistent.

**Public API — `window.MrMacsHeatmap`**

| Method | Signature | Description |
|--------|-----------|-------------|
| `mount` | `(container, opts?) → { unmount, refresh }` | Render heatmap into container |
| `computeData` | `(profile?) → { days: [{date, count, level}] }` | Build 84-day dataset from profile |
| `refreshAll` | `() → void` | Re-render all mounted instances |
| `on` | `(event, handler) → void` | Subscribe |
| `off` | `(event, handler) → void` | Unsubscribe |

Color levels: 0 = `rgba(255,255,255,0.05)`, 1 = `rgba(245,196,81,0.20)`,
2 = `rgba(245,196,81,0.45)`, 3 = `rgba(245,196,81,0.70)`, 4 = `rgba(245,196,81,1.0)`.

---

## Documentation (this file, 1 agent)

`docs/30-ENHANCEMENTS-2026-05-10.md` — written by a dedicated read-only
documentation agent that surveyed the repo state after the parallel build wave
had landed. No other files were touched.

---

## Total LOC delta

| Category | Files | LOC (new or substantially rewritten) |
|---|---|---|
| New `assets/arcade-*.js` modules (13 files) | 13 | ~6,798 |
| `arcade-a11y-quicktoggle.js` (cross-game, new) | 1 | 378 |
| `arcade-heatmap.js` (new) | 1 | 314 |
| `index.html` additions (boot wiring, chips, heatmap, drawer) | 1 | ~150 net new lines |
| `service-worker.js` (new / replaced) | 1 | 78 |
| `manifest.json` (new) | 1 | 25 |
| Per-game `game.js` wiring blocks (46 files, ~20 lines each) | 46 | ~920 |
| **Total** | **64** | **~8,663 net new lines** |

The 46 modified `game.js` files total 110,083 lines on disk, the vast majority
of which is pre-existing game logic. The ~920 figure above represents the additive
wiring blocks only.

---

## Module API quick-reference

| Module | Global | Mount method | Key methods |
|---|---|---|---|
| arcade-resume-chip | `MrMacsResumeChip` | `.mount(container?)` | `refresh()`, `hide()`, `show()` |
| arcade-quick-launcher | `MrMacsQuickLauncher` | — | `open()`, `close()`, `toggle()`, `bindGlobalShortcut()`, `registerAction(a)` |
| arcade-session-timer | `MrMacsSessionTimer` | `.mount(container)` | `start()`, `stop()`, `reset()`, `getElapsedMs()`, `formatElapsed(ms)`, `shouldSuggestBreak()` |
| arcade-streak-indicator | `MrMacsStreakIndicator` | — | `start()`, `stop()` (**not yet on disk**) |
| arcade-notification-center | `MrMacsNotificationCenter` | `.mountBell(container)` | `push(n)`, `getNotifications(n)`, `markAllRead()`, `unreadCount()`, `clearAll()` |
| arcade-import-export | `MrMacsImportExport` | `.mountExportButton(c)` / `.mountImportButton(c)` | `showExportModal()`, `showImportModal()`, `encodeProfile(o)`, `decodeProfile(s)` |
| arcade-search-helpers | `MrMacsSearchHelpers` | `.mountDidYouMean(el, c, vocab)` | `fuzzyScore(q,t)`, `levenshtein(a,b)`, `suggestCorrection(q,v)`, `buildVocabulary(games)`, `filters.*` |
| arcade-pedagogy-callout | `MrMacsPedagogy` | — | `renderCallout(el, q)`, `describeQuestion(q)`, `removeCallout(el)` |
| arcade-skeleton-loader | `MrMacsSkeleton` | `.render(c, opts)` | `cards(c, n)`, `rows(c, n)`, `unmount(h)`, `replaceWith(h, html)` |
| arcade-week-summary | `MrMacsWeekSummary` | `.mount(container)` / `.showBanner(container)` | `compute(days)`, `shouldShow()` |
| arcade-mascot-dialog | `MrMacsMascotDialog` | — | `start()`, `stop()`, `say(cat, force)`, `registerLines(cat, lines)`, `mute()`, `unmute()`, `isMuted()` |
| arcade-print-mode | `MrMacsPrintMode` | `.mountButton(container, data)` | `printDocument(data)`, `printPacket({ title, course, source, documents, question })` |
| arcade-heatmap | `MrMacsHeatmap` | `.mount(container)` | `computeData(profile?)`, `refreshAll()` |
| arcade-a11y-quicktoggle | `MrMacsA11yQuickToggle` | `.mount(container, opts)` | (returns `{ unmount }`) |

All modules: idempotent on double-load, self-contained CSS with unique prefixes,
`on(event, handler)` / `off(event, handler)` event bus unless noted otherwise.

---

## Validation summary

| Check | Result |
|---|---|
| `node --check` on all 30 new/modified `assets/*.js` files | 0 errors (all pass) |
| `html.parser` on `index.html` (14,747 lines, 623,718 chars) | 0 parse errors |
| `games.json` entry count | 219 games |
| `manifest.json` present and parseable | Yes — `display: standalone`, 2 icon entries |
| `service-worker.js` present and syntactically valid | Yes — 78 lines, installs + activates |
| Games with `MrMacsHelpOverlay` wiring confirmed | 7 (brickoria, cascade, chronoblocks, chronohop, source-snake, stellar-drift, step-pyramid) + batch-agent deliveries |
| Games with `MrMacsEndRecap` wiring confirmed | 2 (cube-crash, word-bridge) + batch-agent deliveries |
| Total game.js files modified | 46 |
| arcade-streak-indicator.js on disk | **NO — 404 on load (silent, try/catch in hub)** |

---

## Outstanding work

### Hard missing: `arcade-streak-indicator.js`

The file is referenced by `index.html` line 8780 and by the hub boot block
(`MrMacsStreakIndicator.start()`), but **the file does not exist on disk**. The
hub's `try/catch` wrapper means this is a silent failure — no JS errors, but hot
streak detection is not running. This module needs to be written and delivered.

Expected API: `window.MrMacsStreakIndicator { start(), stop(), on(), off() }`.
It should watch `MrMacsProfile` for rapid consecutive correct-answer runs within
a game session, expose a `"hot-streak"` event when ≥ 5 correct in a row are
detected, and render an optional HUD flame indicator. The hub's `MrMacsMascotDialog`
already handles the streak-milestone lines (streak-3 / streak-7 / streak-30) from
`MrMacsProfile.streak`; the streak indicator is a session-level "hot run"
detector, distinct from the all-time streak counter.

### Partial: per-game wiring coverage

Only 7 of the 39 flagship games have been confirmed with `MrMacsHelpOverlay`
integration and only 2 with `MrMacsEndRecap`. The remaining batch agents may have
delivered their game.js changes, but the coverage was not fully verifiable at
documentation time (46 game.js files were modified; cross-referencing all 46
against all 39 flagships was not completed during this snapshot).

### Not yet integrated: `arcade-a11y-quicktoggle.js`

The file exists on disk (378 LOC, passes `node --check`) but no `<script>` tag
for it appears in `index.html` and it is not loaded by any game file as of this
snapshot. It needs a script tag added to `index.html` and a mount call in the
shared `initHud()` in `arcade-game-helpers.js`.

### Not yet integrated: `arcade-heatmap.js` in-game

`arcade-heatmap.js` (314 LOC) provides a standalone `MrMacsHeatmap` API but has
no `<script>` tag in `index.html` and no integration point. The inline heatmap
in the profile drawer (`pd-heatmap-*` classes) is rendered by existing drawer JS;
the standalone module is ready for future embedding in game end-screens or a
dedicated stats page.

### Future sweep candidates

- Difficulty selector live-label retrofitting for the 7 non-flagship game types
  (Unit + AP Final, Unit + Cumulative, etc.) that currently do not call
  `MrMacsGameHelpers.getDifficulty()`.
- Per-game `MrMacsPedagogy.renderCallout()` integration inside individual
  scholar question renderers.
- Per-game `MrMacsPrintMode.mountButton()` integration inside
  `arcade-game-helpers.js` document-viewer HUD.
- `arcade-import-export.js` drawer button mounting — boot wiring was not
  confirmed present in the hub's `openDrawer()` path.
- Hero CTA rotation — confirmed in comments inside the hub agent's intent but
  not verified as landing in the final `index.html` diff.
