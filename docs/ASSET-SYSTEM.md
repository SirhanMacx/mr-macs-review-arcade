# Arcade Asset System

## Goals

Every catalog entry should look intentional in the hub: no blank cards, no mixed
SVG/WebP exceptions, no copied arcade sprites, and no generated art replacing
official Regents/AP source images.

## Generated Asset Directories

- `assets/game-thumbnails/` — 640x360 WebP thumbnails.
- `assets/game-card-art/` — 768x432 WebP card backgrounds.
- `assets/game-marquees/` — 960x300 WebP marquee art.
- `assets/cabinet/` — shared cabinet shell pieces and scanline overlay.
- `assets/generated-game-art-manifest.json` — generated metadata and alt text.

## Generator Script

Run:

```bash
python3 scripts/generate_arcade_assets.py
```

The generator reads `games.json`, derives a deterministic seed from each game
id, chooses course/category palettes, draws original social-studies arcade art,
and writes WebP files plus the manifest.

## Manifest Format

Each `games` entry records `title`, `course`, `gameType`, `category`,
`palette`, `thumbnail`, `cardArt`, `marquee`, and `alt`.

## Thumbnail/Card Dimensions

- Thumbnail: 640x360.
- Card art: 768x432.
- Marquee: 960x300.

## Style Rules

Use the 1989 cabinet palette: near-black cabinet base, CRT glass, cyan light,
warm gold rewards, and limited magenta/violet/coral accents. Motifs should be
maps, globes, documents, timelines, court/civics symbols, economics graphs,
psychology marks, tokens, joysticks, and cabinet lights.

## Accessibility Alt Text

The generated manifest includes meaningful alt text per game. Hub thumbnails
are decorative inside button cards today because the card text already names the
game; use manifest alt text if a future view shows art as standalone content.

## Performance Budgets

Current generated assets are intentionally small: thumbnails average about 27 KB,
card art about 35 KB, and marquees about 31 KB. Keep thumbnails under 150 KB and
card/marquee files under 250 KB unless there is a documented reason.

## How to Regenerate Assets

Run the generator, then run:

```bash
python3 scripts/validate_arcade.py
```

Do not hand-edit generated WebP files. Adjust the generator if the system needs
a new motif, palette, or layout.

## How to Add a New Game Asset

Add the game to `games.json`, run the generator, confirm the three WebP files
and manifest entry exist, then validate. The hub resolves art by game id:
`assets/game-thumbnails/<id>.webp`, `assets/game-card-art/<id>.webp`, and
`assets/game-marquees/<id>.webp`.
