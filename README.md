# Mr. Mac's Review Arcade

**2,967 review games, boards, and generated practice surfaces backed by a standards-aligned 5-12/AP question system — playable in the browser, no install required.**

A student-facing arcade for NYS grades 5-12 standards areas, all AP courses tracked in the AP Central course catalog, and full Regents/AP practice systems. Premium arcade flagships (History Hunters, Archive Quest, Cold War Invaders, Brickoria, Stellar Drift, Source Snake, Chronoblocks, Cascade, Chronohop, Step Pyramid, Citadel, Rumor Whack, and more) sit beside Jeopardy boards, source-reading labs, writing coaches, and full timed practice exams.

## Live site

https://sirhanmacx.github.io/mr-macs-review-arcade

## Stats

- **2,967 catalog entries** in `games.json`, including the original arcade/social-studies surfaces plus generated all-subject Jeopardy and practice entries
- **65 achievements** across onboarding, streaks, per-flagship feats, cross-arcade tiers, and hidden Easter eggs
- **7 power-up shop items** — Streak Shield, Hint Token, Time Boost, Lucky Charm (24h 2x), Fortune Refresh, Daily Double, Coin Doubler (4h 2x)
- **Multi-profile roster** — multiple students can share a Chromebook with isolated shards, achievements, settings, course, and streaks
- **Persistent + offline-capable** — student profiles, rosters, answers, shards, achievements, sessions, and settings live in `localStorage`; no backend, no logins, no PII by default
- **Optional global leaderboards** — teachers can configure a vetted HTTPS endpoint; public arcade handles are filtered client-side and server-side before any score is stored
- **Generated arcade art** — every catalog entry has original WebP thumbnail, card, and marquee art produced by `scripts/generate_arcade_assets.py`
- **22,042-prompt** shared review library across 99 course buckets, including 42 AP/AP Career Kickstart courses and 3,926 social-studies prompts derived from the mature named Jeopardy boards
- **90-course all-subject taxonomy** aligned to NYSED P-12 standards areas plus College Board AP CED course structures
- **101 visible course labels** in the hub/course pickers after canonicalizing generated NYS/AP labels with existing social-studies labels
- **1,992 generated unit Jeopardy boards**: Review, Challenge, and Final Sprint variants for each generated unit, playable through `games/generated-jeopardy/`
- **90 generated course practice exams**, hundreds of unit practice entries, and **360 zoomable practice source packet pages** playable through `games/generated-practice-exam/`
- **Course-depth guardrails** require every generated course to cover every unit, every generated unit to carry at least 18 arcade questions, every generated practice exam to sample each unit, and every generated board to use the 5x5 + Final Jeopardy shape.

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
│   ├── arcade-sessions.js       # Rich per-profile sessions module loaded before progress-extras
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
│   ├── game-thumbnails/         # Generated 640x360 WebP thumbnails for every game
│   ├── game-card-art/           # Generated 768x432 WebP card backgrounds for every game
│   ├── game-marquees/           # Generated 960x300 WebP marquees for original catalog games
│   ├── generated-practice-pages/# Generated SVG source pages used by all-subject practice exams
│   └── generated-game-art-manifest.json
├── games/                       # 50+ game folders (each: index.html, game.js, styles.css)
├── data/                        # Shared question banks, released-source catalogs, all-subject blueprints
├── scripts/                     # Build/import/validation utilities (Python + .mjs)
└── docs/
    ├── ARCADE-API.md            # Public JS API reference for all hub modules
    ├── GAME-SHIPPING-GUIDE.md   # How to ship a new arcade game
    └── AUDIT-REPORT-2026-05-09.md # Most recent audit + remediation pass
```

## Key shared modules

Every flagship game wires into the same handful of globals:

- **`MrMacsProfile`** — player identity, shards wallet, achievements, settings, multi-profile roster, daily challenge, spaced-repetition wrong-answer queue, mastery thresholds. Local/browser-only; not sent to analytics.
- **`MrMacsLeaderboards`** — per-game top-5 local leaderboards (decorated with profile name + avatar at submit time).
- **`MrMacsSessions`** — auto-resume snapshots, capped at 12 most-recent across the device, 7-day TTL.
- **`MrMacsArcadeMusic`** — Web Audio engine with 16 themes (`pinball-cabinet`, `cold-war-mission`, `td-strategic`, `empire-strategic`, `runner-synthwave`, `rift-survivors`, `duel-arena`, `boss-rush-arena`, `maze-cabinet`, `archive-dusk`, `quill-runner`, `boss-overture`, ...). `start` / `stop` / `duck` / `crossfade` / `setVolume`.
- **`MrMacsCelebration`** — canvas particle bursts (`burst`, `confetti`, `fireworks`, `coinShower`, `streamers`, `tierUp`, `fromShardPayout`).
- **`MrMacsToast`** — corner notifications with tones (`shards`, `achievement`, `streak`, `levelup`, `warn`, `error`); auto-listens to profile events.
- **`MrMacsIcons`** — 40+ monoline SVG icons, drop-in replacement for emoji.
- **`MrMacsArcadeTour`** — one-time first-run tour with spotlight + step card.
- **`MrMacsProgressExtras`** — reusable HUD widgets (mini-HUD pill, score chip, best badge, streak meter, run-summary card).
- **`MrMacsAnalytics`** — anonymous public traffic counters only (no names, rosters, answers, or profile data); disabled/harmless on local development.
- **`MrMacsArcadePerf`** — lite-mode detection on Chromebooks / older iPads, idle/frame schedulers.
- **`MrMacsMastery`** — course profiles, diagnostic builder, weakest-topic recommender.
- **`MrMacsSourceBank`** — source-based-question detector, curated bank registry, source-lock validator.
- **`MrMacsDocumentViewer`** — click-to-expand zoomable image viewer for stimulus documents.

Full API reference: [`docs/ARCADE-API.md`](docs/ARCADE-API.md).

## All-subject content pipeline

```bash
npm run content:all-subjects
npm run validate:content
```

The all-subject pipeline generates NYSED standards-aligned arcade questions, unit Jeopardy blueprints, and practice-exam blueprints from `scripts/generate-all-subject-content.mjs`. Released NYSED Regents and Grades 3-8 test sources are tracked in `data/released-assessment-source-catalog.json`; exact released forms stay separated from general trivia and feed the dedicated practice-exam runners.

The hub exposes the generated catalog in the library course filter, profile/onboarding course pickers, Cram Mode, the horizontal course rail, and the Jeopardy course selector. Courses that do not yet have dedicated game cards still get a visible course-practice launch card backed by `assets/shared-question-bank.js`.

## How to add a new game

See [`docs/GAME-SHIPPING-GUIDE.md`](docs/GAME-SHIPPING-GUIDE.md) for the full step-by-step.

Short version:

1. `mkdir games/<id>` with `index.html`, `game.js`, `styles.css`.
2. Add the required script tags (analytics → profile → progress-extras → music → celebration → toast).
3. Wire `recordPlay`, `addShards`, `submit` (leaderboard), `save` / `load` (sessions).
4. Append a new entry to `games.json`.
5. Run `python3 scripts/generate_arcade_assets.py` so the new game gets generated art and manifest metadata.
6. Add the id to `PREMIUM_ARCADE_IDS` and/or `FEATURED_GAME_IDS` in `index.html` if it's flagship-tier.
7. Run `python3 scripts/validate_arcade.py`.
7. Commit + push to `main`. GitHub Pages republishes automatically.

## License + acknowledgments

- Public-source classroom project, all rights reserved unless a separate license is added. The public repository is for Mr. Mac's classroom workflow and review-site deployment, not an open-content asset pack.
- Question banks, stimulus crops, and Regents source images are derived from publicly-released NYS Regents and AP exam materials.
- Generated arcade hub art, thumbnails, card art, marquees, and cabinet assets are project-original.
- Repo: https://github.com/SirhanMacx/mr-macs-review-arcade
