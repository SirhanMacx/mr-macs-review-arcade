# Mr. Mac's Review Arcade — Test Harnesses

Two complementary smoke layers.

## 1. Page-load smoke (legacy)

`smoke.spec.mjs` — fast Playwright Test runner that loads every game's page and
asserts no JS errors on initial mount.

```sh
cd <repo root>
npm test
```

This is fast and broad (all 78 games) but does NOT verify playability.

## 2. Playable smoke (this layer)

`playable-smoke.spec.mjs` — actually plays the 10 featured games for ~30s
each, captures screenshots, and asserts:

- `#startBtn` exists and dismisses the setup screen on click
- A `<canvas>` is mounted that fills `>=95%` of the iPhone 14 viewport width
- Computed font on `.brand-title`, `.stat-value`, `h1`, `.stat-label` matches
  the arcade typography (`Press Start 2P` / `VT323`) — rejects `Fraunces`,
  `Inter`, `Rajdhani`, `JetBrains Mono`
- `.arcade-toast-container`, when present, does NOT overlap the canvas or HUD
- Zero console errors during gameplay (load-time errors are reported but
  non-blocking; play-time errors fail the run)

### Run locally

```sh
# 1. Start the static server (any port; default is 8765)
cd /Volumes/CURRICULA/00_ACTIVE_CURRENT_PROJECTS/Review_Arcade/mr-macs-review-arcade-live
python3 -m http.server 8765 &

# 2. Run the harness from the directory that has playwright installed
cd /Users/mind_uploaded_crustacean/.hermes/hermes-agent
node /Volumes/CURRICULA/00_ACTIVE_CURRENT_PROJECTS/Review_Arcade/mr-macs-review-arcade-live/tests/playable-smoke.spec.mjs
```

Outputs:

- `tests/screenshots/<game>-setup.png`
- `tests/screenshots/<game>-play-5s.png`
- `tests/screenshots/<game>-play-15s.png`
- `tests/screenshots/<game>-end.png`
- `tests/playable-smoke-report.json` (structured per-game pass/fail)

Exit code is non-zero if any game fails. CI uploads artifacts on failure (see
`.github/workflows/playable-smoke.yml`).

### Tweak inputs

`per-game-inputs.json` maps each game ID to its input strategy:

- `keyboard` — fires `KeyboardEvent` for the given key list, cycling at
  `intervalMs`
- `canvas-click` — issues `mouse.click()` at varied positions inside the named
  canvas selector, again cycling at `intervalMs`

If a game starts requiring a different input modality (e.g. touch swipe),
extend the harness `driveInput()` switch and add a new `type` here.

### Override knobs

- `ARCADE_BASE` — override the server URL (default `http://localhost:8765`)
- `ARCADE_PLAY_MS` — total per-game play duration in ms (default `30000`)

### Featured games covered

1. step-pyramid
2. sokoban-scribe
3. mahjong-mosaic
4. chess-cabinet
5. bomb-scribe
6. sudoku-scribe
7. snake-pit
8. brickoria
9. atlas-2048
10. stellar-drift
