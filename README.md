# Mr. Mac's Review Arcade

Student-facing review arcade for social studies and AP Psychology games.

Live site: https://sirhanmacx.github.io/mr-macs-review-arcade/

## What Is Included

- 51 browser-playable review games
- Regents Gauntlet, a multi-file MCQ game with 300 answer-keyed Regents questions and embedded original stimulus pages
- Boss Rush Arena, a master game that can switch courses, units, and comprehensive review runs
- Grade 9 Global History I
- Grade 10 Global History II
- Grade 11 U.S. History
- AP Psychology
- Unit games, cumulative games, and final review games
- Search, filters, featured games, and embedded in-page player
- Solo and team play options
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

## Performance Rule

The arcade should run smoothly on student Chromebooks and iPads.

Current performance choices:

- mobile particle animation is disabled
- desktop particle counts are capped
- animation loops are throttled
- card tilt effects are disabled on smaller screens
- games remain static HTML files with no backend required
- stimulus pages are compressed JPG assets and loaded only when a Gauntlet question appears

## Updating Games

The live site is built from static files:

- `index.html`
- `games.json`
- `data/`
- `assets/`
- `games/`

When new games are added, rebuild the arcade package, sync the updated files into this repo, commit, and push to `main`. GitHub Pages republishes automatically.

## Analytics

GitHub Pages does not provide a good student-facing analytics dashboard by itself.

Recommended free option: Cloudflare Web Analytics. It is free, privacy-focused, and does not use cookies or localStorage. It can count page views and show which game URLs students open.

Other options:

- Google Analytics 4: free and more detailed, but heavier and less privacy-friendly.
- GoatCounter: lightweight and free for reasonable public usage.

Best first tracking goal:

- total visits
- visits by game page
- top referrers
- countries/devices at a broad level

Avoid student-name tracking unless the arcade later gets a real login system and a school-approved privacy plan.

## Repo

GitHub repository: https://github.com/SirhanMacx/mr-macs-review-arcade
