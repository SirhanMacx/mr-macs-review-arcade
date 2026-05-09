# Game Integrity Audit · 2026-05-09

Read-only sweep of every `games.json` entry to verify file presence, parse correctness, and hub-API integration coverage. No code was modified.

## Summary

- Total games registered in `games.json`: **199**
- **Healthy:** 23 (all index-style flagship games with substantial hub integration)
- **Warnings:** 176 (162 single-file Jeopardy-style templates + 14 index-style games with thin hub integration)
- **Errors:** 0 (every referenced file exists; every HTML/JS file parses cleanly)

Headline takeaway: the arcade is structurally sound. There are no broken `entry.file` references, no parse failures in any HTML or `game.js`, and the 23 flagship games are well-integrated. The warning population is dominated by Jeopardy review templates that were never expected to consume the standardized hub APIs, plus a small tier of older index-style games (mastery-path, source-lab, archive-cipher, etc.) that pre-date the hub stack.

## Methodology

A small Python harness walked all 199 entries from `games.json`, URL-decoding each `file` value to a filesystem path. For every entry the harness:

1. Verified the file existed on disk.
2. Parsed the HTML via Python's `html.parser` (`HTMLParser.feed`/`close`) and captured any malformed-token errors.
3. If the entry was an `index.html` inside a folder, located any sibling `game.js` and ran `node --check` against it (Node v25.9.0).
4. Concatenated the HTML and `game.js` text and grep-counted occurrences of the six standardized hub APIs: `MrMacsProfile`, `MrMacsLeaderboards`, `MrMacsSessions`, `MrMacsArcadeMusic`, `MrMacsCelebration`, `MrMacsToast`.
5. Extracted every `<script src="...">` reference from the HTML to confirm shared `assets/*.js` modules are loaded.

Categorization rules:

- **Error** — file missing, HTML parse error, or `node --check` failure on `game.js`.
- **Warning (index-style)** — fewer than 2 hub APIs found, or no `<script src=".../assets/*.js">` reference.
- **Warning (single-file template)** — zero hub APIs found (informational; these templates intentionally use only `arcade-analytics.js`).
- **Healthy** — passes all checks.

## Healthy games (no issues) — 23

All have parse-clean HTML + `game.js`, load shared `assets/*.js` modules, and reference at least 2 hub APIs (most reference 5).

`anagram-atlas, arcade-duel, boss-rush-arena, brickoria, cascade, centiquill, chrono-defense-infinite, chrono-pinball, chronoblocks, chronohop, citadel, cold-war-invaders, echo-hall, empire-ascendant, galaxy-defender, review-maze-chase, rumor-whack, sokoban-scribe, source-snake, stellar-drift, step-pyramid, time-rift-survivors, timeline-runner`

## Warnings

### Index-style games with thin hub integration (14)

These are folder games (`index.html` + `game.js` + `styles.css`) that parse cleanly and run, but do not call enough hub APIs to provide standardized leaderboards, sessions, music, celebration, or toast UX. They are functional but feel disconnected from the rest of the arcade.

| Game ID | Hub APIs present | Notes |
|---------|------------------|-------|
| ap-practice-exam | MrMacsProfile | Loads `arcade-profile.js`; no leaderboards/sessions/music/celebration/toast |
| archive-cipher | none | No hub integration; pre-dates standardized stack |
| archive-quest | none | Same as above |
| history-hunters | MrMacsProfile | Loads `arcade-profile.js`; missing 5 of 6 hub APIs |
| lightning-review | none | No hub integration |
| mastery-path | none | The personal dashboard; surprising it does not call MrMacsProfile/MrMacsSessions |
| regents-gauntlet | none | Boss-encounter shell; no celebration / toast wiring |
| regents-practice-exam | none | No hub integration |
| regents-rally-source-circuit | MrMacsProfile | Big game (~150 KB game.js, plus rally art); only profile API wired |
| source-audit | none | No hub integration |
| source-lab | none | No hub integration |
| source-sprint | none | No hub integration |
| vocab-vault | none | No hub integration |
| writing-coach | none | No hub integration |

### Single-file Jeopardy / review templates (162)

Every game living directly under `games/<collection>/<NN - Topic>.html` (no surrounding folder) — i.e. the family of pre-built Jeopardy review boards — has zero hub-API references. They do load `assets/arcade-analytics.js` for play-counting, so they integrate with the arcade catalog at the analytics layer; they simply do not participate in the profile / leaderboards / sessions / music / celebration / toast hub.

Distribution by collection:

| Collection | Games |
|------------|-------|
| global-9 | 11 |
| us-history-units | 11 |
| global-10-units | 10 |
| apush | 10 |
| ap-world-history | 10 |
| ap-european-history | 10 |
| grade-8 | 10 |
| grade-7 | 9 |
| ap-human-geography | 8 |
| ap-economics-combined | 8 |
| grade-5 | 8 |
| grade-6 | 8 |
| ap-psychology | 7 |
| ap-macroeconomics | 7 |
| ap-microeconomics | 7 |
| ap-us-government | 6 |
| economics | 6 |
| civics-pig | 6 |
| global-regents-sprint | 5 |
| us-regents-sprint | 5 |
| (others) | 1 each |

These are flagged as warnings only because they share the deferred-tool list with the index-style games; in practice they should be considered "by-design templates" until/unless we decide to roll the hub stack into the Jeopardy template too.

## Errors

**None.** All 199 referenced files exist; every HTML file parses cleanly via Python's `html.parser`; every `game.js` passes `node --check`.

## Recommendations

Roughly in priority order:

1. **Wire the 14 thin index-style games to the hub stack.** The biggest user-visible gap is `mastery-path`, `source-lab`, `regents-gauntlet`, `regents-practice-exam`, and `vocab-vault` — these are visible "skill lab" / "boss" features but skip leaderboards, sessions, music, celebration, and toast. Each retrofit follows the same pattern already used by `brickoria` (the only game with all 6 APIs): add the six `<script src=".../assets/arcade-*.js">` tags and call `MrMacsProfile.recordPlay`, `MrMacsSessions.start/end`, `MrMacsLeaderboards.submit`, etc. at appropriate lifecycle points.
   - Estimated effort: ~30-60 minutes per game, ~7-14 hours total for all 14.

2. **Decide on Jeopardy-template integration.** If we want every play of a Jeopardy review board to count toward streaks, fill leaderboards, and trigger celebration screens, we should template the hub-API hookups into the Jeopardy generator and re-emit all 162 boards. If we are content to leave Jeopardy as a lightweight catalog-analytics-only template, keep the warning list as informational only.
   - If pursued: ~1 day to update the generator + regenerate. Otherwise: zero work.

3. **Harden the audit into CI.** This same harness (199 entries × file-exists + html.parser + `node --check` + grep) finishes in ~20 seconds. Adding it as a pre-deploy GitHub Action would catch a missing file or a `game.js` syntax error before it reaches GitHub Pages, where the only signal today is a blank screen.
   - Estimated effort: ~1 hour to wire up.

4. **Two stylistic outliers worth a glance.** `arcade-duel`, `boss-rush-arena`, and `review-maze-chase` are healthy but only call 2 of 6 hub APIs (Profile + ArcadeMusic). They could be promoted to full integration alongside the bigger flagship batch in (1).

## Appendix · Per-flagship hub-API integration table

All 37 index-style games (the union of the 23 healthy flagships + the 14 thin index-style warnings). `Y` = API string is referenced in HTML or `game.js`; `-` = not referenced. The "shards-cap" column is unscored — it does not correspond to one of the six standardized hub APIs and was not part of the harness pattern set; it is left blank for the human reviewer to fill in if needed.

| Game | recordPlay (Profile) | leaderboards | sessions | music | celebration | toast | shards-cap |
|------|----|----|----|----|----|----|----|
| anagram-atlas | Y | Y | Y | Y | Y | - | |
| ap-practice-exam | Y | - | - | - | - | - | |
| arcade-duel | Y | - | - | Y | - | - | |
| archive-cipher | - | - | - | - | - | - | |
| archive-quest | - | - | - | - | - | - | |
| boss-rush-arena | Y | - | - | Y | - | - | |
| brickoria | Y | Y | Y | Y | Y | Y | |
| cascade | Y | Y | Y | Y | Y | - | |
| centiquill | Y | Y | Y | Y | Y | - | |
| chrono-defense-infinite | Y | Y | Y | Y | - | Y | |
| chrono-pinball | Y | Y | Y | Y | - | Y | |
| chronoblocks | Y | Y | Y | Y | Y | - | |
| chronohop | Y | Y | Y | Y | Y | - | |
| citadel | Y | Y | Y | Y | Y | - | |
| cold-war-invaders | Y | Y | Y | Y | - | Y | |
| echo-hall | Y | Y | Y | Y | Y | - | |
| empire-ascendant | Y | Y | Y | Y | - | Y | |
| galaxy-defender | Y | Y | Y | Y | Y | - | |
| history-hunters | Y | - | - | - | - | - | |
| lightning-review | - | - | - | - | - | - | |
| mastery-path | - | - | - | - | - | - | |
| regents-gauntlet | - | - | - | - | - | - | |
| regents-practice-exam | - | - | - | - | - | - | |
| regents-rally-source-circuit | Y | - | - | - | - | - | |
| review-maze-chase | Y | - | - | Y | - | - | |
| rumor-whack | Y | Y | Y | Y | Y | - | |
| sokoban-scribe | Y | Y | Y | Y | Y | - | |
| source-audit | - | - | - | - | - | - | |
| source-lab | - | - | - | - | - | - | |
| source-snake | Y | Y | Y | Y | Y | - | |
| source-sprint | - | - | - | - | - | - | |
| stellar-drift | Y | Y | Y | Y | Y | - | |
| step-pyramid | Y | Y | Y | Y | Y | - | |
| time-rift-survivors | Y | Y | Y | Y | - | Y | |
| timeline-runner | Y | Y | Y | Y | - | Y | |
| vocab-vault | - | - | - | - | - | - | |
| writing-coach | - | - | - | - | - | - | |

Of the 23 healthy flagships, only `brickoria` carries all six hub APIs. Five other healthy games are missing only `MrMacsToast` (anagram-atlas, cascade, centiquill, chronoblocks, chronohop, echo-hall, citadel, galaxy-defender, rumor-whack, sokoban-scribe, source-snake, stellar-drift, step-pyramid). Five healthy games are missing only `MrMacsCelebration` (chrono-defense-infinite, chrono-pinball, cold-war-invaders, empire-ascendant, time-rift-survivors, timeline-runner). Bringing the entire flagship line to the brickoria-level "all six" baseline would be a relatively small, mechanical retrofit.
