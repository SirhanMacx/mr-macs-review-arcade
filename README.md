# Mr. Mac's Review Arcade

Student-facing review arcade for Social Studies 5-12, AP courses, Regents prep, and AP Psychology games.

Live site: https://sirhanmacx.github.io/mr-macs-review-arcade/

## What Is Included

- 172 browser-playable review games
- Archive Cipher, a generated-art review Wordle-style term decoder with course filters, unit filters, animated tile feedback, hints, and explanations from the full review library
- History Hunters, an original all-courses retro handheld social studies RPG with route walking, course-type battles, historical figure companion lines, answer-powered moves, capture capsules, and evolution stages
- Chrono Pinball, a full-library arcade pinball table with course filters, review lock missions, bumpers, lanes, multipliers, ball save, and multiball
- Empire Ascendant, a full-library rise-and-fall strategy game with province expansion, city founding, research paths, unlock-gated buildings, wonders, diplomacy, rival relations, era advancement, stability collapse, and review councils
- Timeline Runner, a generated-art endless runner where students dodge archive hazards, collect evidence, and answer by steering through course-filtered answer gates from the full 4,683-prompt review library
- Time Rift Survivors, a full-library survival arcade game with generated arena art, animated combat, relic upgrades, course filters, stimulus access, and 4,683 review prompts
- Chrono Defense Infinite, an original endless social-studies tower defense game using the full 4,683-prompt review library
- Regents Gauntlet, a multi-file MCQ game with 471 answer-keyed Regents questions and cropped original stimulus images
- Arcade Duel, a wave-based MCQ combat mode that uses the same Regents MCQ bank (energy powerups + study targets)
- Boss Rush Arena, a master game with generated arena/boss art, animated attacks, HP/shield/combo scoring, course switching, unit review, and comprehensive review runs
- Grade 5 Social Studies, aligned to the NYS K-8 Social Studies Framework
- Grade 6 Social Studies, aligned to the NYS K-8 Social Studies Framework
- Grade 7 U.S. History I, aligned to the NYS K-8 Social Studies Framework
- Grade 8 U.S. History II, aligned to the NYS K-8 Social Studies Framework
- Grade 9 Global History I
- Grade 10 Global History II
- Grade 11 U.S. History
- AP Psychology
- AP United States History
- AP World History: Modern
- AP European History
- AP Human Geography
- AP U.S. Government and Politics
- AP Macroeconomics
- AP Microeconomics
- AP Macro/Micro Combined
- Economics
- Civics and Participation in Government
- Unit games, cumulative games, and final review games
- Generated arcade hub artwork, search, filters, featured missions, and embedded in-page player
- Generated History Hunters RPG assets: ten figure/evolution avatar atlases, retro tile/sprite atlas, retro title/battle sheet, retro item/action sheet, structured character/evolution codex atlas, type-effect atlas, overworld map art, key art, and recruit seal
- Solo and team play options
- Jeopardy boards are normalized during publishing so each category ramps from lower-value recall clues to higher-value challenge clues
- Anonymous traffic counter for visits, engaged sessions, game opens, game views, game plays, completions, daily activity, device class, per-game counters, per-course counters, and per-game-type counters
- Shared data and source-image files for newer game modes, starting with `data/regents-gauntlet-bank.json` and `assets/regents-gauntlet-stimuli/`

## Content Rule

Games should use student-study content only:

- people
- events
- laws
- places
- empires
- movements
- vocabulary
- historical examples
- psychology terms and concepts

Do not add teacher-facing test-skill columns such as:

- Docs + History Skills
- Regents Skills
- Cause and Effect
- Synthesis
- Enduring Issues
- Essay Power Moves
- broad essential-question prompts
- placeholder clue stems such as "Name this content item"

## Performance Rule

The arcade should run smoothly on student Chromebooks and iPads.

Current performance choices:

- mobile particle animation is disabled
- desktop particle counts are capped
- animation loops are throttled
- card tilt effects are disabled on smaller screens
- games remain static HTML files with no backend required
- stimulus images are cropped compressed JPG assets and reused by Gauntlet and newer game modes
- future game modes should use shared assets instead of repeating large art inside each game file

## Updating Games

The live site is built from static files:

- `index.html`
- `games.json`
- `data/`
- `assets/`
- `games/`

The flagship RPG entry currently launches `games/history-hunters-2/`, a canvas-based History Hunters rebuild with tile movement, NPCs and buildings, course filters, turn-based historical figure battles, party/items/save, and review contracts powered by the shared question library.

When new games are added or curriculum folders change, rebuild the arcade package, sync the updated files into this repo, commit, and push to `main`. GitHub Pages republishes automatically.

Recommended quality gate before publishing:

- Run `python3 scripts/validate_arcade.py`
- Open `index.html` locally (or via GitHub Pages) and sanity-check:
  - History Hunters 2: Atlas Quest
  - Boss Rush Arena
  - Chrono Defense Infinite
  - Regents Gauntlet
  - Arcade Duel

Question-bank maintenance:

- Import new Regents MCQ answer-key packets into the shared Gauntlet bank:
  - `python3 scripts/import_regents_mcq_answerkey.py --help`
  - This appends only missing question ids and extracts stimulus crops into `assets/regents-gauntlet-stimuli/`.

## Traffic Counter

The current static site includes a lightweight anonymous traffic counter. It tracks:

- total site visits
- engaged sessions after a short dwell time
- game launches from the arcade hub
- direct game page views
- meaningful game plays
- game completions for newer modes that support completion events
- daily visit and play counts
- broad device class counts: desktop, tablet, mobile
- per-game launch/view/play/completion counters
- per-course and per-game-type launch/play counters

The counter does not collect student names, logins, typed answers, or class rosters. It uses browser local storage for a local fallback and a public counter endpoint for anonymous totals.

Current public counter groups use the prefix `mr-macs-review-arcade-v1`, for example:

- `site-visits`
- `game-launches`
- `game-plays`
- `daily-YYYY-MM-DD-site-visits`
- `game-history-hunters-game-plays`
- `course-grade-10-global-history-ii-game-plays`

If the arcade gets real student traction, move tracking to a hosted privacy-focused analytics service or a small private backend.

Good next options:

- Cloudflare Web Analytics: free, privacy-focused, and good for public traffic trends.
- GoatCounter: lightweight public web analytics.
- Supabase or Cloudflare Workers: better if the arcade later needs private game-level events, leaderboards, or class-safe progress tracking.

Avoid student-name tracking unless the arcade later gets a real login system and a school-approved privacy plan.

## Repo

GitHub repository: https://github.com/SirhanMacx/mr-macs-review-arcade
