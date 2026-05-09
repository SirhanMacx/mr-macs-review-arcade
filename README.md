# Mr. Mac's Review Arcade

**199+ social-studies review games for AP, Regents, and middle-school prep — playable in the browser, no install required.**

A student-facing arcade for grades 5-12, AP courses (Psychology, World, Euro, Human Geo, US Gov, Macro, Micro, USH), and full Regents exam simulators (Global II, U.S. History). Premium arcade flagships (History Hunters, Archive Quest, Cold War Invaders, Brickoria, Stellar Drift, Source Snake, Chronoblocks, Cascade, Chronohop, Step Pyramid, Citadel, Rumor Whack, and more) sit beside Jeopardy boards, source-reading labs, writing coaches, and full timed practice exams.

## Live site

https://sirhanmacx.github.io/mr-macs-review-arcade

## Stats

- **194 games** in the catalog (`games.json`)
- **65 achievements** across onboarding, streaks, per-flagship feats, cross-arcade tiers, and hidden Easter eggs
- **7 power-up shop items** — Streak Shield, Hint Token, Time Boost, Lucky Charm (24h 2x), Fortune Refresh, Daily Double, Coin Doubler (4h 2x)
- **Multi-profile roster** — multiple students can share a Chromebook with isolated shards, achievements, settings, course, and streaks
- **Persistent + offline-capable** — all progress lives in `localStorage`, no backend, no logins, no PII
- **4,529-prompt** shared review library powering full-library flagships

## Tech stack

- Vanilla JavaScript, zero build step, zero npm dependencies
- Static GitHub Pages hosting (`.nojekyll`)
- ES2017+ JS, no transpilation
- Web Audio API for synthesized music + SFX (no audio file shipping)
- Canvas 2D for arcade games + particle effects
- `localStorage` for profile, sessions, leaderboards, daily challenge state

## Local development

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static-file server works. The traffic counter detects `localhost` / `127.0.0.1` / `file:` and stays in local-only mode.

## Folder structure

```
.
├── index.html                   # Hub: search, filters, smart menus, embedded player
├── games.json                   # Catalog of all games (id, title, course, file, ...)
├── DESIGN.md                    # Product/visual design rules
├── README.md                    # This file
├── CHANGELOG.md                 # Reverse-chronological release log
├── assets/                      # Shared modules + art
│   ├── arcade-profile.js        # Player profile + multi-profile roster + shop + achievements
│   ├── arcade-progress-extras.js# Leaderboards, sessions, mini-HUD widgets
│   ├── arcade-sessions.js       # (Standalone elaborate sessions module — not loaded by hub)
│   ├── arcade-music.js          # Synthesized per-game music engine (16 themes)
│   ├── arcade-celebration.js    # Particle bursts, confetti, fireworks, coin shower
│   ├── arcade-toast.js          # Ephemeral notifications + auto-wires to profile events
│   ├── arcade-icons.js          # Monoline SVG icon library + emoji map
│   ├── arcade-tour.js           # First-run tour engine (one-time per game)
│   ├── arcade-analytics.js      # Anonymous traffic counter + per-game/course rollups
│   ├── arcade-perf.js           # Lite-mode detection + perf primitives (mark/measure/idle)
│   ├── mastery-engine.js        # Mastery dashboard logic + course profiles + diagnostic
│   ├── source-bank.js           # Source-based question detection + curated bank registry
│   ├── document-viewer.js       # Click-to-expand zoomable source document viewer
│   ├── arcade-a11y.css          # Shared accessibility styles
│   └── *.webp / *.jpg / *.png   # Generated arcade hub artwork
├── games/                       # 50+ game folders (each: index.html, game.js, styles.css)
├── data/                        # Shared question banks (regents-gauntlet, chrono-defense, ...)
├── scripts/                     # Build/import/validation utilities (Python + .mjs)
└── docs/
    ├── ARCADE-API.md            # Public JS API reference for all hub modules
    ├── GAME-SHIPPING-GUIDE.md   # How to ship a new arcade game
    └── AUDIT-REPORT-2026-05-09.md # Most recent audit + remediation pass
```

## Key shared modules

Every flagship game wires into the same handful of globals:

- **`MrMacsProfile`** — player identity, shards wallet, achievements, settings, multi-profile roster, daily challenge, spaced-repetition wrong-answer queue, mastery thresholds. Local-only, no telemetry.
- **`MrMacsLeaderboards`** — per-game top-5 local leaderboards (decorated with profile name + avatar at submit time).
- **`MrMacsSessions`** — auto-resume snapshots, capped at 12 most-recent across the device, 7-day TTL.
- **`MrMacsArcadeMusic`** — Web Audio engine with 16 themes (`pinball-cabinet`, `cold-war-mission`, `td-strategic`, `empire-strategic`, `runner-synthwave`, `rift-survivors`, `duel-arena`, `boss-rush-arena`, `maze-cabinet`, `archive-dusk`, `quill-runner`, `boss-overture`, ...). `start` / `stop` / `duck` / `crossfade` / `setVolume`.
- **`MrMacsCelebration`** — canvas particle bursts (`burst`, `confetti`, `fireworks`, `coinShower`, `streamers`, `tierUp`, `fromShardPayout`).
- **`MrMacsToast`** — corner notifications with tones (`shards`, `achievement`, `streak`, `levelup`, `warn`, `error`); auto-listens to profile events.
- **`MrMacsIcons`** — 40+ monoline SVG icons, drop-in replacement for emoji.
- **`MrMacsArcadeTour`** — one-time first-run tour with spotlight + step card.
- **`MrMacsProgressExtras`** — reusable HUD widgets (mini-HUD pill, score chip, best badge, streak meter, run-summary card).
- **`MrMacsAnalytics`** — anonymous-only counters (no names, no answers); per-game / per-course / per-day rollups.
- **`MrMacsArcadePerf`** — lite-mode detection on Chromebooks / older iPads, idle/frame schedulers.
- **`MrMacsMastery`** — course profiles, diagnostic builder, weakest-topic recommender.
- **`MrMacsSourceBank`** — source-based-question detector, curated bank registry, source-lock validator.
- **`MrMacsDocumentViewer`** — click-to-expand zoomable image viewer for stimulus documents.

Full API reference: [`docs/ARCADE-API.md`](docs/ARCADE-API.md).

## How to add a new game

See [`docs/GAME-SHIPPING-GUIDE.md`](docs/GAME-SHIPPING-GUIDE.md) for the full step-by-step.

Short version:

1. `mkdir games/<id>` with `index.html`, `game.js`, `styles.css`.
2. Add the required script tags (analytics → profile → progress-extras → music → celebration → toast).
3. Wire `recordPlay`, `addShards`, `submit` (leaderboard), `save` / `load` (sessions).
4. Append a new entry to `games.json`.
5. Add the id to `PREMIUM_ARCADE_IDS` and/or `FEATURED_GAME_IDS` in `index.html` if it's flagship-tier.
6. Run `python3 scripts/validate_arcade.py`.
7. Commit + push to `main`. GitHub Pages republishes automatically.

## License + acknowledgments

- All code in this repository is private to the Mr. Mac classroom workflow.
- Question banks, stimulus crops, and Regents source images are derived from publicly-released NYS Regents and AP exam materials.
- Generated arcade hub art (lobby, marquee, tokens, scanlines) is project-original.
- Repo: https://github.com/SirhanMacx/mr-macs-review-arcade
