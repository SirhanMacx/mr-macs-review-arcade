# Contributor Guide

For developers and future maintainers. Read end-to-end before your
first PR — the arcade has strong conventions and weak guardrails, so
the rules below replace the linter you don't have.

---

## 1. Overview

| Property | Value |
| --- | --- |
| Tech stack | Vanilla JavaScript (ES2017+), no build, no npm |
| Hosting | Static GitHub Pages, `.nojekyll` flag set |
| Live URL | https://sirhanmacx.github.io/mr-macs-review-arcade |
| Total catalog | 199+ entries in `games.json`, 37+ built `game.js` files |
| Hub assets | ~10 JS modules, ~330 KB raw / 89 KB gz at first paint |
| Per-game budget | < 60 KB gzipped, no exceptions |
| Browser baseline | Safari 14+, Chrome 90+, Firefox 88+, Edge 90+ |

No transpilation. No bundlers. No frameworks. The arcade ships exactly
the source you check in.

```
.
├── index.html                  # Single-page hub: search, filters, embedded player, ~14k LOC
├── games.json                  # Flat array catalog of every game
├── README.md                   # Project overview
├── DESIGN.md                   # Visual + content rules
├── CHANGELOG.md                # Date-based release log
├── .nojekyll                   # Tells GitHub Pages to skip Jekyll
├── assets/                     # Shared JS modules + art
├── games/<id>/                 # Self-contained game folders
├── data/                       # Shared question banks (large JSON)
├── scripts/                    # Validators (Python + .mjs)
└── docs/                       # All documentation, including this file
```

---

## 2. Local development

```bash
# From repo root
python3 -m http.server 8080

# Then open
open http://localhost:8080
```

Any static-file server works (`npx http-server`, `caddy file-server`,
etc.). The arcade detects `localhost` / `127.0.0.1` / `file:` and stays
in local-only mode for the traffic counter.

### Quick smoke test loop

```bash
# 1. Start server
python3 -m http.server 8080 &

# 2. Validate JS syntax across all modules + games
find assets games -name "*.js" -print0 | xargs -0 -n 1 node --check

# 3. Validate every game folder is reachable from games.json
python3 scripts/validate_arcade.py

# 4. Open the hub
open http://localhost:8080
```

If any of those fail, fix before commit.

---

## 3. File organization

### `assets/`

All shared JS modules + visual art. Module naming convention:
`arcade-<purpose>.js` for hub modules, single-word for engines
(`mastery-engine.js`, `source-bank.js`, `document-viewer.js`).

| File | Status | One-liner |
| --- | --- | --- |
| `arcade-profile.js` | live | Player identity, wallet, achievements, settings, multi-profile roster, daily challenge, scholar tracking. |
| `arcade-progress-extras.js` | live | `MrMacsLeaderboards` + `MrMacsSessions` + reusable HUD widgets. |
| `arcade-analytics.js` | live | Anonymous counter + per-game/course rollups. `MrMacsProgress` + `MrMacsAnalytics`. |
| `arcade-perf.js` | live | Lite-mode detection, idle/frame schedulers. |
| `arcade-celebration.js` | live | Particle bursts: confetti, fireworks, coin shower. |
| `arcade-toast.js` | live | Corner notifications, dedup, profile-event auto-listen. |
| `arcade-icons.js` | live | Monoline SVG icon library. |
| `arcade-tour.js` | live | First-run tour engine. |
| `arcade-music.js` | optional | Per-game music engine, 16 themes. Loaded by individual games, not the hub. |
| `mastery-engine.js` | live | Course profiles, diagnostic builder, recommender model. |
| `source-bank.js` | live | Source-question registry + lock validator. |
| `document-viewer.js` | optional | Click-to-expand stimulus zoom. Loaded only by source-heavy games. |
| `arcade-a11y.css` | optional | Shared a11y styles — **on disk but currently NOT linked from `index.html`**. Reference, not active. |
| `arcade-sessions.js` | dev-only | Standalone elaborate sessions module. Not loaded by hub. Live version is in `arcade-progress-extras.js`. |
| `arcade-leaderboards.js` | dev-only | Standalone leaderboards module. Not loaded by hub. Live version is in `arcade-progress-extras.js`. |
| `arcade-cram-mode.js` | live | Cram mode behind Recommender card. |
| `arcade-recommender.js` | live | Today's-Plan recommendation card. |
| `arcade-onboarding-flow.js` | live | First-run profile setup. |
| `arcade-keyboard-remap.js` | live | Settings UI for rebinding shortcuts. |
| `arcade-quick-stats-panel.js` | live | Profile drawer stats panel. |
| `arcade-dev-tools.js` | dev-only | Console helpers; gated behind URL `?devtools=1`. |

### `games/<id>/`

Each game folder is fully self-contained:

```
games/<game-id>/
├── index.html       # Entry HTML — script tags + canvas + minimal markup
├── game.js          # Main game loop, question pool, hub wiring
└── styles.css       # Game-specific CSS (editorial dark)
```

`<game-id>` is a stable kebab-case slug. **Don't rename existing games**
— it orphans local leaderboards and saved sessions.

### `docs/`

Every Markdown spec lives here. Cross-link liberally; don't introduce
a top-level `/docs.html` or wiki.

| File | Purpose |
| --- | --- |
| `USER-GUIDE.md` | Student-facing tour. |
| `CONTRIBUTOR-GUIDE.md` | This file. |
| `ARCADE-API.md` | JS API reference for every `MrMacs*` global. |
| `GAME-SHIPPING-GUIDE.md` | End-to-end game-shipping recipe. |
| `AUDIT-REPORT-2026-05-09.md` | Most recent audit pass. |
| `BROWSER-COMPAT-2026-05-09.md` | Compatibility risk register. |
| `PERF-BUDGET-2026-05-09.md` | Asset weights + budgets. |
| `GAME-INTEGRITY-AUDIT-2026-05-09.md` | Per-game smoke audit. |

### `index.html`

One file. ~14,000 lines. Inline `<style>` (~7,500 LOC), inline
`<script>` (~6,000 LOC), plus markup. Yes it's giant. Yes that's
deliberate — single-file ship lowers cognitive load for non-engineers
who maintain it. **Don't split it without buy-in.**

### `games.json`

A flat JSON array of catalog entries. Loaded once on hub boot and
filtered/searched in memory. Schema covered in section 7.

---

## 4. Adding a new game

Full recipe: [`docs/GAME-SHIPPING-GUIDE.md`](GAME-SHIPPING-GUIDE.md).

Ten-step summary:

1. **Pick a slug.** kebab-case, stable forever. `games/<slug>/`.
2. **Scaffold the folder.** `index.html` + `game.js` + `styles.css`.
3. **Add the script tags** in load order (analytics → profile → perf →
   icons → toast → celebration → progress-extras → game).
4. **Wire `recordPlay`** on game open.
5. **Wire `addShards`** on every payout — use a source string
   containing `"scholar"` + `"correct"` for review prompts.
6. **Wire `MrMacsLeaderboards.submit`** on run end.
7. **Wire `MrMacsSessions.save` / `.load`** for auto-resume.
8. **Append the entry to `games.json`** with the schema in section 7.
9. **Add the id to the right `*_IDS` lists** in `index.html` (section 7).
10. **Run `python3 scripts/validate_arcade.py`** + manual smoke +
    update `CHANGELOG.md`.

---

## 5. Hub module pattern

Every hub module follows the same shape: an IIFE that idempotently
defines its global, defensive try/catch around external dependencies,
and self-contained CSS injection if it needs DOM styling.

### Module skeleton

```js
/* assets/arcade-mymodule.js
 * One-line description of the module.
 *
 * Public API (lives at window.MrMacsMyModule):
 *   - foo(arg)      → does something
 *   - on(name, h)   → event subscription
 *   - off(name, h)
 *
 * Storage key: mr-macs-mymodule-v1   (only if persisted)
 */
(function () {
  "use strict";

  // Idempotent guard — module may be loaded twice in dev / preview
  if (typeof window === "undefined") return;
  if (window.MrMacsMyModule) return;

  var STORAGE_KEY = "mr-macs-mymodule-v1";

  // EventTarget polyfill for Safari < 14
  var bus;
  try {
    bus = new EventTarget();
  } catch (e) {
    bus = document.createDocumentFragment();
  }

  function emit(name, detail) {
    try {
      bus.dispatchEvent(new CustomEvent(name, { detail: detail }));
    } catch (e) {
      // Swallow — events are best-effort
    }
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function write(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      // QuotaExceeded — silently fail (Safari Private Mode etc.)
    }
  }

  // Optional: inject self-contained CSS so the module ships fully
  // self-contained without requiring an extra <link>.
  function injectCSS() {
    if (document.getElementById("mr-macs-mymodule-styles")) return;
    var style = document.createElement("style");
    style.id = "mr-macs-mymodule-styles";
    style.textContent = ".mm-mymodule { /* ... */ }";
    document.head.appendChild(style);
  }

  var API = {
    foo: function (arg) {
      // ...
    },
    on: function (name, handler) { bus.addEventListener(name, handler); },
    off: function (name, handler) { bus.removeEventListener(name, handler); }
  };

  // Init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectCSS);
  } else {
    injectCSS();
  }

  window.MrMacsMyModule = API;
})();
```

### Why each piece

- **IIFE wrapper** — no top-level scope leaks. Variables stay private.
- **Idempotent guard** — `if (window.MrMacsMyModule) return;` lets the
  hub re-include the same script in dev preview without double-binding.
- **EventTarget polyfill** — Safari < 14 throws on `new EventTarget()`.
  `document.createDocumentFragment()` implements `EventTarget` and is
  supported everywhere.
- **try/catch around `localStorage`** — Safari Private Mode and locked-
  down embedded WebViews throw `QuotaExceededError`. Always wrap.
- **Self-contained CSS injection** — modules can ship visual UI without
  relying on the hub's stylesheet. Use a stable `id` to dedupe.

---

## 6. Public API conventions

### Namespace

Every shared module exposes a single global at `window.MrMacs<Name>`.
Game code reaches for these globals directly (no imports, no DI).

```js
// In game code
window.MrMacsProfile.addShards(20, "source-snake-scholar-correct");
window.MrMacsLeaderboards.submit("source-snake", finalScore, { ... });
window.MrMacsCelebration.fireworks(x, y);
```

### Event subscription

Modules that emit events expose `.on(name, handler)` / `.off(name,
handler)` paired:

```js
// Subscribe
function onWalletChange(e) {
  console.log("shards now:", e.detail.total);
}
window.MrMacsProfile.on("wallet:change", onWalletChange);

// Unsubscribe later
window.MrMacsProfile.off("wallet:change", onWalletChange);
```

Handlers receive a `CustomEvent` with the payload on `event.detail`.

Full event registry: see
[`docs/ARCADE-API.md`](ARCADE-API.md#mrmacsprofile).

### Defensive try/catch around external deps

Game code touches multiple `MrMacs*` globals, any of which could be
absent (e.g. running standalone for testing). Wrap every cross-module
call:

```js
try {
  window.MrMacsCelebration.fromShardPayout(20);
} catch (err) {
  // celebration unavailable — gameplay continues
}

try {
  if (window.MrMacsLeaderboards) {
    window.MrMacsLeaderboards.submit(gameId, score, meta);
  }
} catch (err) { /* swallow */ }
```

The arcade philosophy: **gameplay never breaks because a hub module is
missing.** Toast can fail. Celebration can fail. Profile can fail. The
game still plays.

---

## 7. Working with `games.json`

### Schema

Each entry is a flat object. Required fields are bolded.

| Field | Type | Notes |
| --- | --- | --- |
| **`id`** | string | kebab-case slug. Must match folder. |
| **`title`** | string | Display title. |
| `subtitle` | string | One-sentence pitch. |
| `day` | string | Badge label ("Day 5", "Arcade Flagship", "Skill Lab", "Final Review"). |
| **`course`** | string | Exact label from `MrMacsMastery.COURSES.label`, or `"All Courses"`. |
| `subject` | string | Topical bucket. |
| `grade` | string | `"5"` … `"AP"`, `"All"`, or hyphenated `"10-11"`. |
| **`gameType`** | string | Drives homepage filter — see allowed values below. |
| **`file`** | string | Path from repo root, e.g. `"games/source-snake/index.html"`. |
| `originalFile` | string | Optional historical name. |
| `collection` | string | Cohort label (e.g. `"may-2026-flagship-sweep"`). |
| `categories` | string[] | Free-text discovery tags shown on cards. |
| `clueCount` | number | Unique questions / scholar prompts shipped. |
| `hasFinal` | boolean | Only true for Jeopardy boards with Final Jeopardy. |
| `tags` | string[] | Lowercase free-text search tokens. Include id, gameType, course, discriminators. |

Allowed `gameType` values (drives filter):

```
Arcade Original, Jeopardy Board, Skill Lab, Mastery Dashboard,
Practice Exam, RPG, Boss Rush, Tower Defense, Pinball, Maze Chase,
Endless Runner, Survivor, Brick Breaker, Falling Block, Match-3,
Q*bert-style, Whack-a-Mole
```

### ID-list constants in `index.html`

These constants decide where each game appears in the hub. Forgetting
any of them leaves your game effectively invisible.

```js
// Around line 8369 — featured carousel
const FEATURED_GAME_IDS = [
  "rumor-whack", "citadel", "step-pyramid", "chronohop",
  "history-hunters", "archive-quest", "cold-war-invaders",
  // ...
];

// Around line 8384 — premium arcade lane (gold border + cabinet rail)
const PREMIUM_ARCADE_IDS = new Set([
  "history-hunters", "archive-quest", "cold-war-invaders",
  // ...
]);

// Around line 9124 — "NEW" badge for two weeks after launch
const NEW_FLAGSHIP_IDS = [
  "brickoria", "stellar-drift", "source-snake",
  // ...
];

// Around line 8397 — practice tools (not arcade)
const PRACTICE_TOOL_IDS = new Set([
  "regents-practice-exam", "ap-practice-exam", "mastery-path",
  "source-lab", "writing-coach", "source-audit", "source-sprint",
  "regents-gauntlet"
]);

// Around line 8398 — weak prototypes (don't add unless yours genuinely is)
const PROTOTYPE_IDS = new Set([
  "arcade-duel", "lightning-review", "vocab-vault"
]);

// Source-locked: requires trusted source images
const SOURCE_LOCKED_GAME_IDS = new Set([
  // ...
]);
```

When adding a new flagship: add to `PREMIUM_ARCADE_IDS` (always) and
`FEATURED_GAME_IDS` + `NEW_FLAGSHIP_IDS` (usually). Don't add to
`PROTOTYPE_IDS`.

### Cross-curricular convention

If your game spans multiple courses, set `"course": "All Courses"` (the
exact string). The hub's filter predicate hardcodes this pseudo-course
to always pass. Don't invent a different cross-curricular label.

---

## 8. Achievement system

The 65-entry `ACHIEVEMENTS` array lives in `assets/arcade-profile.js`.

### Adding a new achievement

1. Append to the `ACHIEVEMENTS` array:

   ```js
   {
     id: "my-flagship-clear",
     title: "First Clear",
     desc: "Beat the first level of My Flagship.",
     tier: "bronze",   // bronze | silver | gold | legendary
     icon: "🎯"
   }
   ```

   `id` is stable forever. Renaming orphans every player who unlocked it.

2. From your game code, fire the unlock when the condition is met:

   ```js
   try {
     window.MrMacsProfile.unlock("my-flagship-clear");
   } catch (err) { /* swallow */ }
   ```

   `unlock()` is idempotent — calling it twice is a no-op. It emits
   `achievement:unlock` on first unlock, which `MrMacsToast` auto-
   listens for and shows a toast.

3. For countable achievements (e.g. "play 100 games"), use
   `bumpAchievement(id, by?)` instead. It auto-creates the entry,
   tracks count, and unlocks at the configured threshold.

### Per-game vs cross-arcade

- **Per-game** — gated by a specific game id. Use a slug like
  `<game-id>-<feat>` (e.g. `source-snake-long-tail`).
- **Cross-arcade** — gated on aggregate stats. Use a slug like
  `cross-<feat>` (e.g. `cross-genre-hopper-3`).

The Profile Drawer auto-groups by tier; ordering inside a tier is by
array index in `ACHIEVEMENTS`.

### Hidden achievements

To make an achievement hidden until unlocked, add `hidden: true` to
the entry. The Profile Drawer renders locked hidden entries as a `?`
glyph until they fire.

---

## 9. Shop items

Shop catalog lives in `MrMacsProfile.SHOP_ITEMS`. Adding a new item
is a 4-touch change:

### Step 1 — Add the spec to `SHOP_ITEMS`

In `assets/arcade-profile.js` around line 941:

```js
SHOP_ITEMS: {
  streakShield:  { cost: 200, label: "Streak Shield",  icon: "🛡", desc: "..." },
  // ...
  myNewItem:     { cost: 100, label: "My New Item",    icon: "🎁", desc: "Does a thing for one quiz." }
}
```

`cost` is in shards. `icon` is one emoji. `desc` is one sentence (shows
on hover and in the buy modal).

### Step 2 — Add behavior to `getInventory` / `buyItem` / `consumeItem`

If the item is **count-based** (use N times then gone), the existing
`buyItem` and `consumeItem` paths handle it automatically — they
increment / decrement `p.inventory[itemId]`.

If the item is **timed** (active for X minutes after purchase), add an
entry to the `TIMED_BUFFS` map and the buff path will extend a deadline:

```js
TIMED_BUFFS: {
  luckyCharm:  { field: "luckyCharmExpiresAt",  durationMs: 24 * 60 * 60 * 1000 },
  coinDoubler: { field: "coinDoublerExpiresAt", durationMs: 4 * 60 * 60 * 1000 },
  myNewBuff:   { field: "myNewBuffExpiresAt",   durationMs: 30 * 60 * 1000 }
}
```

### Step 3 — Wire purchase toast in `index.html`

The shop UI in the Profile Drawer is rendered from `SHOP_ITEMS` — no
manual list to maintain. But on purchase, `index.html` has a switch
that maps `itemId → toast message`. Add your case there (search for
`buyItem` in `index.html`).

### Step 4 — Update CHANGELOG.md

Under **Added** in today's section:

```md
- **My New Item** — 100 shards, does a thing for one quiz.
```

That's it. The Profile Drawer auto-renders the new card.

---

## 10. Validation checklist

Before every commit:

```bash
# 1. JS syntax across all modules + games
find assets games -name "*.js" -print0 | xargs -0 -n 1 node --check

# 2. HTML well-formed
python3 -c "
import html.parser, sys
class P(html.parser.HTMLParser):
    def error(self, m): sys.exit(m)
P().feed(open('index.html').read())
print('ok')
"

# 3. SVG well-formed (if you touched any)
xmllint --noout assets/*.svg 2>/dev/null || echo "no svg files"

# 4. Catalog consistency
python3 scripts/validate_arcade.py
```

Optional, scoped:

```bash
# Premium arcade lane completeness
node scripts/audit-flagship-games.mjs

# Jeopardy boards only
node scripts/validate-jeopardy-boards.mjs

# Source-bank questions
node scripts/validate-shared-source-bank.mjs

# Top-level smoke
node scripts/verify-arcade.mjs
```

---

## 11. Style guide

### Palette (editorial dark)

| Color | Hex | Use |
| --- | --- | --- |
| Bronze | `#f5c451` / `#ffd884` | Reward, score, achievement |
| Cyan | `#7af0ff` | Score values, source/Regents accents |
| Magenta | `#ff7cc8` / `#b892ff` | Achievement / level-up burst |
| Coral | `#ff8e6f` | Streak / warmth |
| Paper | `#f0f3fa` / `#f6f4ee` | Default text |
| Muted | `#9aa3bb` | Secondary text |
| Surface | `rgba(13, 17, 27, 0.94)` | Modal / card background |
| Deep | `#0b0d14` / `#080b14` | Page background |

### Type ladder

- **Fraunces** — display serif, italic, hero titles only
- **Inter** — body text everywhere
- **JetBrains Mono** — labels, tabular numerics, shard counts, score
  chips, leaderboard ranks. Always use mono for numbers that animate.

### Layout

- Card radii: 8px tight, never 16px+
- Density: prefer compact controls + dense type
- Avoid: gradient blobs, generic AI-dashboard cards, one-note
  purple/blue gradients

### Motion

Every CSS animation must have a `prefers-reduced-motion` short-circuit:

```css
@media (prefers-reduced-motion: reduce) {
  .my-pulse, .my-bump, .my-screen-shake {
    animation: none !important;
    transition: none !important;
  }
}
```

In JS, gate optional effects on `MrMacsArcadePerf.isLite()`:

```js
if (!window.MrMacsArcadePerf || !window.MrMacsArcadePerf.isLite()) {
  spawnParticleStorm();
}
```

### Don't

- Don't ship `<audio>` tags or shipped sound files. Use
  `MrMacsArcadeMusic` + Web Audio synthesis only.
- Don't write to `localStorage` directly with a custom key — use
  `MrMacsSessions.save` for run state and `MrMacsProfile.set` for
  player data.
- Don't import any npm package, framework, or transpiler. Vanilla JS only.
- Don't use emoji as primary UI iconography. Use `MrMacsIcons.fromEmoji`
  to swap to monoline SVGs.
- Don't add teacher-facing taxonomy ("Docs + History Skills",
  placeholder stems like "Name this content item"). See
  [`DESIGN.md`](../DESIGN.md) Content Rules.

---

## 12. Browser compatibility

Full register: [`docs/BROWSER-COMPAT-2026-05-09.md`](BROWSER-COMPAT-2026-05-09.md).

### Targets

Safari iOS 14+, Safari macOS 14+, Chrome 90+ (desktop + Android),
Firefox 88+, Edge 90+.

### Required shims

Every module must include these mitigations:

#### EventTarget polyfill (Safari < 14)

```js
var bus;
try {
  bus = new EventTarget();
} catch (e) {
  bus = document.createDocumentFragment();
}
```

#### `webkitAudioContext` fallback

```js
var AC = window.AudioContext || window.webkitAudioContext;
var ctx = null;
function ensureCtx() {
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
```

Defer `new AC()` until first user gesture (Safari iOS requires it).

#### `matchMedia.addListener` legacy fallback

```js
var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
var onChange = function () { /* ... */ };
if (mq.addEventListener) {
  mq.addEventListener("change", onChange);
} else if (mq.addListener) {
  mq.addListener(onChange);  // Safari < 14
}
```

#### `localStorage` / `sessionStorage` try/catch

Wrap every read AND every write:

```js
function readLS(key) {
  try { return localStorage.getItem(key); }
  catch (e) { return null; }
}

function writeLS(key, value) {
  try { localStorage.setItem(key, value); }
  catch (e) { /* QuotaExceeded — silently fail */ }
}
```

### Known unfixed risks

- `color-mix()` is used 48× in `index.html` without `@supports` — Safari
  16.0/16.1 silently drops these. Adding fallbacks is a known TODO.
- `aspect-ratio: 1` — Safari 14.5+. Acceptable degradation in current targets.
- `:has()` in `arcade-a11y.css` — Firefox < 121. Acceptable a11y polish loss.

Don't introduce new uses of any feature without a fallback unless
the affected browser is below baseline.

---

## 13. Performance

Full audit: [`docs/PERF-BUDGET-2026-05-09.md`](PERF-BUDGET-2026-05-09.md).

### Budgets

| Layer | Budget | Current |
| --- | --- | --- |
| Hub first paint (HTML + JS + games.json) | 350 KB gz | 267 KB gz |
| Hub asset JS only (10 files) | 100 KB gz | 89 KB gz |
| Per-game `game.js` | **60 KB gz** | All 37 built games are under |
| Hub first paint (Time-to-Interactive on 4G) | < 1.5 s | ~1.1 s on a Chromebook |
| `games.json` manifest | 100 KB gz | 48 KB gz |

### Per-game enforcement

Run before shipping a new game:

```bash
gzip -c games/<id>/game.js | wc -c
# Should be < 61440 (60 KB)
```

If a game is over budget, the usual suspects are:
1. Inline question banks too large — move to `data/<id>-bank.json` and
   fetch on enter.
2. Large vendored library — replace with vanilla.
3. Sprite sheets as base64 — move to a separate `.webp` file.

### RAF / setInterval discipline

Every game's `game.js` should:

- Use a single `requestAnimationFrame` loop, not multiple competing
  loops.
- Listen for `visibilitychange` and pause the loop when the tab is
  hidden.
- Suspend audio contexts on hidden, resume on visible.

`MrMacsArcadeMusic` and `MrMacsCelebration` already do this — follow
the same pattern in your game.

### Image rules

- Hero / lobby art: `.webp` always
- Thumbnails: `.webp` ≤ 30 KB or `.svg` if monoline
- Per-game stimulus images: `.webp` for photographs, `.svg` for diagrams
- Always include `loading="lazy" decoding="async"` on `<img>` tags
  below the fold

---

## 14. Testing

There is no automated test harness. Validation is procedural.

### Game integrity audit

```bash
node scripts/audit-flagship-games.mjs
```

Loads every entry in `games.json` matching `PREMIUM_ARCADE_IDS`,
verifies the file resolves, the entry has all required fields, and
basic `game.js` smell tests pass.

### Validation pass before commit

1. `python3 scripts/validate_arcade.py`
2. `node --check assets/*.js games/*/game.js`
3. Manual: open the hub, play your new game to completion, verify
   shards bank, verify leaderboard updates.
4. Toggle reduced motion in OS settings, re-verify.
5. Open in mobile emulation (DevTools narrow width), verify touch
   input + canvas sizing.

### Lite-mode test

Append `?lite=1` to any URL or call `MrMacsArcadePerf.setLite(true)`
in the console. The arcade should still be fully playable with
particles short-circuited.

---

## 15. Commit conventions

### Style

- One commit per logical change.
- Imperative mood: "Add Source Snake flagship", not "Added".
- Subject ≤ 72 chars; wrap body at 72.
- Reference the cohort / collection in the subject when relevant.

Example:

```
Add Source Snake flagship to May 2026 sweep

- New game folder games/source-snake/ with index, game, styles
- Adds id to PREMIUM_ARCADE_IDS, FEATURED_GAME_IDS, NEW_FLAGSHIP_IDS
- Adds entry to games.json with 4,529 cross-arcade scholar prompts
- Wires recordPlay, addShards, leaderboard submit, sessions save/load
- Updates CHANGELOG.md under 2026-05-09
```

### CHANGELOG.md

Every shipped change must have a CHANGELOG entry under today's date in
the appropriate section:

- **Added** — new functionality
- **Changed** — changes to existing behavior
- **Fixed** — bug fixes
- **Removed** — deprecations

If the date doesn't exist yet, add a new section header with today's
ISO date and a sweep label. See existing entries in
[`CHANGELOG.md`](../CHANGELOG.md) for tone.

### Don't

- Don't commit `node_modules/`, `.env`, or any secrets. (There aren't
  any in this repo, but don't introduce some.)
- Don't push to `main` without running validators locally.
- Don't squash unrelated work into a single commit — small focused
  commits make rollback trivial when something breaks.

---

## 16. Module quick-reference

| Module | Global | Status | One-line summary |
| --- | --- | --- | --- |
| `arcade-profile.js` | `MrMacsProfile` | live | Identity, wallet, achievements, settings, roster, daily challenge, scholar tracking |
| `arcade-progress-extras.js` | `MrMacsLeaderboards`, `MrMacsSessions`, `MrMacsProgressExtras` | live | Top-5 boards + 12-cap session snapshots + reusable HUD widgets |
| `arcade-analytics.js` | `MrMacsAnalytics`, `MrMacsProgress` | live | Anonymous traffic counter + per-game/course rollups |
| `arcade-perf.js` | `MrMacsArcadePerf` | live | Lite-mode detection, idle/frame schedulers |
| `arcade-celebration.js` | `MrMacsCelebration` | live | Particle bursts: confetti, fireworks, coin shower, tier-up |
| `arcade-toast.js` | `MrMacsToast` | live | Corner notifications with dedup + profile-event auto-listen |
| `arcade-icons.js` | `MrMacsIcons` | live | 40+ monoline SVG icons, drop-in replacement for emoji |
| `arcade-tour.js` | `MrMacsArcadeTour` | live | First-run tour engine with spotlight + step card |
| `arcade-music.js` | `MrMacsArcadeMusic` | optional | Web Audio engine with 16 themes, start/stop/duck/crossfade |
| `mastery-engine.js` | `MrMacsMastery` | live | Course profiles, diagnostic builder, weakest-topic recommender |
| `source-bank.js` | `MrMacsSourceBank` | live | Source-question registry + lock validator |
| `document-viewer.js` | `MrMacsDocumentViewer` | optional | Click-to-expand zoomable stimulus viewer |
| `arcade-a11y.css` | n/a | optional | Shared a11y styles (currently NOT linked from index) |
| `arcade-cram-mode.js` | `MrMacsCramMode` | live | Cram mode behind Recommender card |
| `arcade-recommender.js` | `MrMacsRecommender` | live | Today's-Plan recommendation card |
| `arcade-onboarding-flow.js` | `MrMacsOnboarding` | live | First-run profile setup wizard |
| `arcade-keyboard-remap.js` | `MrMacsKeybinds` | live | Settings UI for rebinding game shortcuts |
| `arcade-quick-stats-panel.js` | `MrMacsQuickStats` | live | Profile drawer stats panel |
| `arcade-leaderboards.js` | n/a | dev-only | Standalone leaderboards module — superseded by progress-extras |
| `arcade-sessions.js` | n/a | dev-only | Standalone elaborate sessions module — superseded by progress-extras |
| `arcade-dev-tools.js` | `MrMacsDevTools` | dev-only | Console helpers, gated behind `?devtools=1` |

Full per-method reference: [`docs/ARCADE-API.md`](ARCADE-API.md).

---

Welcome to the cabinet rail. Read [`USER-GUIDE.md`](USER-GUIDE.md) too —
nothing teaches you the product faster than playing it the way students do.
