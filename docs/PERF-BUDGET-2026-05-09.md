# Performance Budget Audit · 2026-05-09

Static analysis of arcade asset sizes and load characteristics. Read-only audit — no code modified. Gzip estimates use Python `gzip.compress(level=6)` on the raw file, which approximates what GitHub Pages serves.

## Headline numbers

- **Hub first-paint payload**: 1,215 KB raw / **267 KB gzipped** (HTML + 10 JS + games.json)
- **Hub asset JS**: 328 KB raw / **89 KB gzipped** across 10 files (10 of 18 hub JS files actually loaded by `index.html`)
- **`index.html`** alone: 571 KB raw / **130 KB gzipped** — 211 KB is one inline `<style>` block, 316 KB is one inline `<script>` block, 44 KB is the rest of the HTML
- **`games.json` manifest**: 315 KB raw / 48 KB gz (199 entries, one network request)
- **Total games shipped**: 199 manifest entries · 37 with built `game.js` · 27 stub directories holding course Jeopardy decks
- **Largest single game (raw)**: `history-hunters-2` at 203 KB / 53 KB gz · all 37 built games fit under the proposed 60 KB-gz per-game budget
- **A11y CSS** (`assets/arcade-a11y.css`, 22 KB) is on disk but **not referenced in `index.html`** — confirm whether intentional
- **Course decks** (Jeopardy HTMLs) total 17.5 MB on disk but each is loaded only when its tile is opened

## Asset inventory

### Hub JS (loaded on first paint via `<script src>`)

| File | Raw KB | Gz KB | LOC | Notes |
|---|---:|---:|---:|---|
| arcade-profile.js | 91.1 | 24.5 | 2,102 | Largest hub script. Settings + drawer + roster |
| arcade-analytics.js | 38.5 | 9.3 | 943 | localStorage-backed event log |
| arcade-progress-extras.js | 35.0 | 9.0 | 977 | 3 RAFs |
| mastery-engine.js | 33.3 | 8.6 | 769 | Diagnostic + recommendation core |
| arcade-icons.js | 29.2 | 9.2 | 419 | Inline SVG icon registry |
| arcade-celebration.js | 27.2 | 7.1 | 838 | 8 RAFs · `visibilitychange` pauses particles |
| arcade-tour.js | 25.8 | 7.6 | 662 | Onboarding tour |
| arcade-toast.js | 23.4 | 6.7 | 649 | Toast notifications |
| source-bank.js | 17.5 | 4.7 | 459 | Source-skill question bank |
| arcade-perf.js | 7.1 | 2.1 | 215 | Lite-mode detection (deviceMemory, hardwareConcurrency, prefers-reduced-motion) |
| **TOTAL** | **328.1** | **88.7** | **8,033** | |

### Hub JS on disk but NOT loaded by index.html

| File | Raw KB | Gz est | Notes |
|---|---:|---:|---|
| arcade-music.js | 30.4 | ~9 | `visibilitychange` suspends AudioContext |
| arcade-leaderboards.js | 23.5 | ~7 | |
| arcade-cram-mode.js | 24.5 | ~7 | |
| arcade-recommender.js | 20.4 | ~6 | |
| arcade-onboarding-flow.js | 20.6 | ~6 | |
| arcade-keyboard-remap.js | 16.6 | ~5 | |
| document-viewer.js | 16.0 | ~5 | |
| arcade-sessions.js | 14.0 | ~4 | |
| arcade-quick-stats-panel.js | (small) | – | |

These ~166 KB are not on the hub critical path — confirm whether they are loaded by individual game pages or are dead code on `gh-pages`. Either way, no first-paint cost.

### CSS

| File | Raw KB | LOC | Loaded? |
|---|---:|---:|---|
| `assets/arcade-a11y.css` | 22.0 | 653 | **No `<link>` to it in `index.html`** — verify |
| Inline `<style>` in `index.html` | 211.3 | ~7,488 | Always loaded (render-blocking) |

### Game folders (lazy-loaded per game)

37 built games · sum of `game.js` is 2,787 KB raw / ~700 KB gz · avg 75 KB raw / 19 KB gz · median 78 KB raw.

Top 10 games by raw size:

| Game | Raw KB | Gz KB | LOC | RAF | sIv | sTo | hidden? |
|---|---:|---:|---:|---:|---:|---:|---|
| history-hunters-2 | 202.5 | 53.3 | 4,536 | 2 | 1 | 22 | yes |
| regents-rally-source-circuit | 146.1 | 39.1 | 3,812 | 4 | 0 | 8 | no |
| history-hunters | 144.9 | 37.1 | – | – | – | – | – |
| timeline-runner | 130.1 | 33.0 | 3,095 | 5 | 1 | 1 | yes |
| empire-ascendant | 128.6 | 35.8 | 2,887 | 5 | 1 | 10 | no |
| time-rift-survivors | 128.2 | 32.7 | 2,980 | 5 | 1 | 11 | yes |
| chrono-defense | 118.0 | 29.5 | 2,880 | 4 | 1 | 10 | yes |
| chrono-pinball | 118.0 | 30.3 | 2,942 | 2 | 1 | 19 | **no** |
| anagram-atlas | 106.4 | 27.6 | – | – | – | – | – |
| citadel | 103.4 | 26.0 | – | – | – | – | – |

All 37 built games fit comfortably under a 60 KB-gz per-game budget.

### Static images

192 game thumbnails (mix of `.webp` + `.svg`) totalling 1.4 MB · avg 7 KB · max 137 KB. Lazy-loaded via `<img loading="lazy" decoding="async">` plus `IntersectionObserver` and `content-visibility: auto` (already in place — see `index.html:1788-1794`, `9473`, `9752`).

First-paint hub images (referenced in `index.html`'s inline CSS via fixed URLs, not lazy):

| Image | KB | Notes |
|---|---:|---|
| boss-rush-arena-v2.webp | 276.2 | Hero art for "Boss Rush" lane |
| regents-gauntlet-arena-lite.jpg | 192.7 | Hero art for "Regents Gauntlet" lane |
| arcade-lobby-16bit-v4.webp | 168.2 | Background lobby art |
| arcade-card-cabinet-16bit-v4.webp | 125.5 | Cabinet card frame |
| arcade-ui-panels-16bit-v4.webp | 124.1 | UI panels |
| history-hunters.webp (default `--screen-art`) | 30.4 | CSS variable fallback |
| arcade-scanline-tile.webp | 22.1 | CRT overlay |
| 4 small icons + token | ~25 | |
| **First-paint image total** | **~965 KB** | Decoupled from JS; browsers fetch in parallel |

### Heavy per-game payloads (only loaded when game opens)

| Path | KB | Loaded by |
|---|---:|---|
| `data/chrono-defense-bank.json` | 5,854 | `games/chrono-defense/game.js:2725` async fetch on enter — **does not bloat the hub** |
| `data/regents-released-practice-exams.json` | 1,901 | regents games |
| `data/regents-gauntlet-bank.json` | 909 | regents-gauntlet |
| `assets/history-hunters/*.png` (87 files) | 65,159 | only when history-hunters loads |
| `assets/regents-released-forms/` (571 files) | 64,272 | only when relevant game loads |
| Course HTML decks (162 standalone Jeopardy pages) | 17,940 | only when tile clicked |

The repo has ~190 MB of game-specific assets. None hit the hub.

## Performance risk register

| # | Risk | Location | Severity | Mitigation |
|---|---|---|---|---|
| 1 | **Render-blocking inline `<style>` (211 KB / 7,488 LOC)** in `index.html` | `index.html:11-7500` (one block) | High | Extract to external `arcade-hub.css`. Browsers parallelize external CSS, and a 211 KB inline blob is parsed every load before first paint |
| 2 | **315 KB inline `<script>` block** in `index.html` (5,847 LOC) — single function-bag with 5 setIntervals, 24 setTimeouts, no `visibilitychange` handling | `index.html:8340-end` | High | Extract to `assets/arcade-hub.js` so it (a) gets cached separately from HTML, (b) gets compressed once, (c) doesn't invalidate a 130 KB gz HTML on every line edit. Add `visibilitychange` to pause hub timers when tab hidden |
| 3 | **`arcade-profile.js` is 91 KB raw / 25 KB gz** — the biggest hub script, loaded synchronously before HTML parsing finishes | `assets/arcade-profile.js` (2,102 LOC) | Medium | Add `defer` to all hub `<script>` tags (none currently have `defer`/`async`) so parsing isn't blocked. Profile drawer is not needed for first paint |
| 4 | **All 10 hub `<script>` tags load synchronously** with no `defer`/`async`/`type=module` | `index.html:<head>` | Medium | Same as above. `defer` is a one-character change per tag with measurable TTI improvement |
| 5 | **No `visibilitychange` handling in inline hub JS** (5 setIntervals tick while tab is hidden) | inline `<script>` block | Medium | Add a single `document.addEventListener("visibilitychange", …)` that pauses the hub's intervals. `arcade-music.js` and `arcade-celebration.js` already do this — copy the pattern |
| 6 | **Several flagship games don't pause on `document.hidden`**: `chrono-pinball`, `rumor-whack`, `galaxy-defender`, `centiquill`, `chronoblocks`, `chronohop`, `sokoban-scribe`, `brickoria` | per-game `game.js` | Medium | Wrap the per-frame `requestAnimationFrame` callback with a `if (document.hidden) return scheduleNext();` guard, or add a single `visibilitychange` listener that flips a `paused` flag. Costs ~5 lines per game |
| 7 | **Big first-paint hero images: 276 KB + 193 KB** (`boss-rush-arena-v2.webp`, `regents-gauntlet-arena-lite.jpg`) | `index.html` inline CSS `background-image:` | Medium | Compress further (these are display-time decorative). 276 KB → ~80 KB target with WebP at quality 70-75. Or load via `IntersectionObserver` so they only download when the lane is scrolled into view |
| 8 | **`arcade-a11y.css` is 22 KB on disk but not `<link>`-loaded** in `index.html` | `assets/arcade-a11y.css` | Low | Verify whether this is dead code (delete) or accidentally unlinked (add `<link rel="stylesheet">` and reduce inline CSS) |
| 9 | **`games.json` is 315 KB raw / 48 KB gz** and is fetched on every hub load with `cache: "no-store"` | inline `<script>` `loadGamesManifest()` | Low | Switch to `cache: "default"` plus a versioned URL parameter (e.g. `games.json?v=20260509`). Saves 48 KB gz on warm loads |
| 10 | **8 hub asset files exist on disk but are not loaded by `index.html`** (`arcade-music.js`, `arcade-leaderboards.js`, `arcade-cram-mode.js`, `arcade-recommender.js`, `arcade-onboarding-flow.js`, `arcade-keyboard-remap.js`, `document-viewer.js`, `arcade-sessions.js`) | `assets/` | Low | Verify each is loaded by the per-game pages it's intended for. Otherwise delete to keep the surface clean |
| 11 | **`localStorage.setItem` count in `arcade-analytics.js`: 5** — risk if any are inside hot loops | `assets/arcade-analytics.js` | Low | Static analysis only — none flagged as RAF-adjacent. Re-check if a future game pushes events per frame; batch with a debounce or `requestIdleCallback` |
| 12 | **`history-hunters-2/game.js` has 22 setTimeouts** (most of any game) | `games/history-hunters-2/game.js` | Low | Audit for nested timer leaks or missed `clearTimeout` on level transitions |

## Already-mitigated patterns (good things to keep)

- `arcade-perf.js` provides a unified **lite-mode** flag based on `prefers-reduced-motion`, `navigator.deviceMemory < 4`, `navigator.hardwareConcurrency <= 2`, or a manual toggle. Games can call `MrMacsArcadePerf.isLite()` to skip particle storms on Chromebooks.
- `arcade-celebration.js` reads `document.hidden` and exits the RAF loop while hidden (`assets/arcade-celebration.js:166-168`).
- `arcade-music.js` suspends the AudioContext on `visibilitychange` (`assets/arcade-music.js:38, 681-683`).
- `<img loading="lazy" decoding="async">` + `IntersectionObserver` + `content-visibility: auto` cover the long tail of game-card thumbnails (`index.html:1788-1794, 9473, 9752`).
- `chrono-defense-bank.json` (5.8 MB) is fetched async only when entering the game (`games/chrono-defense/game.js:2725`) — not a hub-paint concern.
- All 37 built games fit under the proposed 60 KB-gz per-game budget. Largest is `history-hunters-2` at 53 KB gz.
- Per-game `index.html` files do not pull in the entire hub — game pages are independent.
- `index.html` has `<link rel="preconnect">` to `fonts.googleapis.com` and `fonts.gstatic.com`.

## Budget recommendations

Proposed budgets and current state on the hub home page:

| Metric | Current | Proposed Budget | Status |
|---|---:|---:|:---:|
| First Paint (4G mobile, est.) | est. 1.8-2.4 s | < 1.5 s | Yellow |
| Time to Interactive (4G mobile, est.) | est. 3.5-4.5 s | < 3 s | Yellow |
| Hub JS payload (gz) | 89 KB external + 78 KB inline = 167 KB gz | < 150 KB gz | Yellow |
| Hub HTML (gz, after extraction) | 130 KB gz today | < 25 KB gz target | Red |
| Hub CSS (gz) | ~30 KB inline (no external) | < 30 KB gz | Green |
| Per-game JS (gz, max) | 53 KB gz (history-hunters-2) | < 60 KB gz | Green |
| Network requests on hub first paint | ~14 (1 HTML + 10 JS + 1 fonts CSS + 1 games.json + ~12 fixed-URL images) ≈ 25 | < 25 | At-budget |
| `localStorage` writes per minute (active play, est.) | < 30 (analytics batches; profile writes only on settings change) | < 30 | Green |
| Hub critical-path images (KB) | ~965 KB | < 500 KB | Yellow |

The hub HTML is "Red" purely because of the inlined CSS+JS — splitting them moves it to "Green" without any code logic change.

## Recommendations (priority-ordered)

1. **Extract inline `<script>` from `index.html`** into `assets/arcade-hub.js` (~316 KB raw / ~78 KB gz). One change, with 4 wins:
   - HTML drops from 130 KB gz to ~25 KB gz
   - The hub JS gets a long-cache header on warm loads
   - Future edits to hub logic don't bust the HTML cache
   - Easier to add `defer` and split further later
2. **Extract inline `<style>` from `index.html`** into `assets/arcade-hub.css` (~211 KB raw / ~30 KB gz). Same 4 wins as above. Combined with #1, the HTML shell drops below 25 KB gz.
3. **Add `defer` to all 10+ hub `<script>` tags** in `index.html`. None currently use `defer`/`async`. This alone unblocks the parser without changing semantics for any of the existing scripts (all are register-and-wait-for-DOMContentLoaded today).
4. **Add a hub `visibilitychange` listener** that pauses the 5 hub `setInterval`s when the tab is hidden. Mirror the pattern already used in `arcade-music.js:681` and `arcade-celebration.js:167`.
5. **Add `document.hidden` guards to flagship games missing them**: `chrono-pinball`, `rumor-whack`, `galaxy-defender`, `centiquill`, `chronoblocks`, `chronohop`, `sokoban-scribe`, `brickoria`. ~5 LOC each. Big battery win on Chromebooks.
6. **Recompress the two largest first-paint hero images**:
   - `boss-rush-arena-v2.webp`: 276 KB → target ~80 KB
   - `regents-gauntlet-arena-lite.jpg`: 193 KB → target ~60 KB
   These are CSS `background-image:` decorations — quality can drop to 70-75 with no perceptible loss.
7. **Switch `games.json` fetch from `cache: "no-store"` to a versioned URL with default cache**. Saves 48 KB gz on every warm hub load.
8. **Audit the 8 unloaded hub JS files**: confirm each is referenced by per-game pages, otherwise delete. Also confirm `arcade-a11y.css` — link it or delete it.
9. **(Stretch) Code-split the hub script** into critical (rendering the lobby) vs. lazy (drawer, tour, leaderboards). The drawer + tour together are ~50 KB of the inline block; move them behind `requestIdleCallback`.

## Appendix: top files by size in repo

| KB | File |
|---:|---|
| 5,854 | `data/chrono-defense-bank.json` (loaded only by chrono-defense) |
| 3,222 | `assets/history-hunters/overworld-map.png` (only history-hunters) |
| 2,843 | `games/regents-rally-source-circuit/rally-tracks.png` |
| 2,735 | `assets/timeline-runner/runner-track.png` |
| 2,609 | `games/regents-rally-source-circuit/rally-key-art.png` |
| 2,489 | `assets/archive-quest/background.png` |
| 2,452 | `games/regents-rally-source-circuit/rally-racers.png` |
| 2,442 | `assets/regents-gauntlet-arena.png` |
| 2,438 | `assets/review-maze-chase/key-art.png` |
| 2,425 | `assets/history-hunters/character-evolution-atlas-v2.png` |
| 2,266 | `games/regents-rally-source-circuit/rally-64-tracks.png` |
| 2,222 | `games/regents-rally-source-circuit/rally-items.png` |
| 2,215 | `assets/archive-cipher/archive-cipher-atlas.png` |
| 2,173 | `games/regents-rally-source-circuit/rally-64-key-art.png` |
| 2,152 | `assets/history-hunters/type-effects-atlas.png` |
| 2,062 | `assets/history-hunters/retro-title-battle-sheet.png` |
| 2,035 | `assets/history-hunters/character-evolution-atlas.png` |
| 2,014 | `assets/history-hunters/generated/landmark-sprite-sheet-v1.png` |
| 1,982 | `assets/archive-quest/tiles.png` |
| 1,969 | `assets/history-hunters/retro-tile-sprite-atlas.png` |

Every file in this top-20 is per-game and lazy. The hub itself is dominated by `index.html` (571 KB raw) and `arcade-profile.js` (91 KB raw).

## Methodology

- File sizes via `stat -f%z` (exact bytes).
- Gzipped sizes via Python `gzip.compress(data, compresslevel=6)`.
- Pattern counts via `re.findall` on raw source: `requestAnimationFrame`, `setInterval`, `setTimeout`, `localStorage.getItem`, `localStorage.setItem`, `document.hidden|visibilitychange`.
- Inline `<style>` / `<script>` extracted via `re.findall(r'<style[^>]*>(.*?)</style>', ..., re.DOTALL)` against `index.html`.
- "First-paint hub JS" = the 10 files referenced via `<script src="assets/...">` in `index.html`.
- "First-paint images" = images referenced inside the inline `<style>` block (CSS `background-image: url(...)`) — these load alongside the HTML; thumbnails inside the lazy-loaded `<img>` cards are excluded.
- 4G mobile timings are estimates from raw + gz totals against a 1.5 Mbps effective bandwidth and 100ms RTT — for actual numbers, run Lighthouse against the deployed `gh-pages` URL.

## Reproducing this audit

```bash
cd /Volumes/CURRICULA/00_ACTIVE_CURRENT_PROJECTS/Review_Arcade/mr-macs-review-arcade-live
# byte sizes
for f in assets/*.js assets/*.css; do printf '%s\t%d\n' "$f" "$(stat -f%z "$f")"; done | sort -k2,2 -nr
# per-game totals
for d in games/*/; do
  name=$(basename "$d")
  js=$([ -f "$d/game.js" ] && stat -f%z "$d/game.js" || echo 0)
  html=$([ -f "$d/index.html" ] && stat -f%z "$d/index.html" || echo 0)
  css=$([ -f "$d/styles.css" ] && stat -f%z "$d/styles.css" || echo 0)
  printf '%d\t%s\n' "$((js+html+css))" "$name"
done | sort -nr
# gzipped sizes
python3 -c "import gzip; print(len(gzip.compress(open('index.html','rb').read(), 6)))"
```
