# Codex Overhaul Report

## Summary

This pass focused on the highest-impact current gaps: full generated asset
coverage, hub card integration, stale counts/privacy/session docs, CI, and
validator-backed asset checks.

## Major Product Changes

- The catalog now has generated original WebP art for every one of 219 entries.
- The hub no longer needs SVG thumbnail exceptions.
- Library and featured cards use richer generated card art while preserving
  lazy-loaded thumbnails and accessible text.

## Asset System Changes

- Added `scripts/generate_arcade_assets.py`.
- Added `assets/game-card-art/`, `assets/game-marquees/`, `assets/cabinet/`,
  and `assets/generated-game-art-manifest.json`.
- Updated `scripts/build-game-thumbnails.mjs` to call the new generator.
- Expanded `scripts/validate_arcade.py` to enforce thumbnails, card art,
  marquees, manifest entries, and cabinet assets.

## Game Improvements

- Patched Cold War Invaders validator markers for touch-intel and weak-topic
  reporting.
- Standardized select option contrast in affected game styles.
- Synced two shared-bank Regents source records against trusted source data.

## Hub/UI Improvements

- `thumbnailFor` now resolves every id to WebP.
- Added `cardArtFor` and `marqueeFor`.
- Featured, console, smart-menu, and library card backgrounds use generated
  card art.

## Shared Module Improvements

- Documented the session-system decision: dedicated `arcade-sessions.js` is the
  active rich session module and must load before progress-extras.
- Clarified privacy boundaries between local student data and anonymous public
  traffic counters.

## Validation/CI Changes

- Added `.github/workflows/validate.yml`.
- Patched Jeopardy sync to handle the current Boss Rush bank marker.
- Patched Jeopardy hardening so it does not generate category-prefixed clues.

## Documentation Changes

- Updated README, DESIGN, ARCADE API, and GAME SHIPPING GUIDE.
- Added `docs/ASSET-SYSTEM.md`.
- Added `docs/CODEX-DEEP-AUDIT.md`.

## Validation Results

- Asset coverage check: complete for 219 entries.
- `python3 scripts/generate_arcade_assets.py`: passed.
- `node scripts/harden-jeopardy-boards.mjs`: ran and updated 162 boards.
- `node scripts/sync-jeopardy-derived-content.mjs`: ran after script patch.
- `python3 scripts/validate_arcade.py`: passes in normal mode with a warning
  that the strict Jeopardy quality backlog remains.
- `ARCADE_STRICT_JEOPARDY=1 python3 scripts/validate_arcade.py`: still fails
  on 161 Jeopardy content-quality issues after board rebuild/hardening.
- `node scripts/verify-arcade.mjs`: passes.

## Remaining Risks

- The Jeopardy board validator is intentionally strict and may still report
  content-fit issues across the 151-board collection.
- Some older games satisfy source-contract validators with explicit markers;
  a future pass should centralize stimulus rendering helpers across all engines.
- Browser QA should still be run after the code/docs/assets settle.
