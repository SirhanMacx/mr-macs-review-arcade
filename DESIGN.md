# Mr. Mac's Atlas Arcade Design System

## Product Bar

Mr. Mac's Atlas Arcade should feel like a premium student-facing review platform, not a folder of teacher files. The first screen should communicate: polished arcade hub, serious exam prep, fast student launch, and room for future game types.

The homepage has three primary paths:

- Play: game-forward review with the strongest arcade modes first.
- Practice Regents: full exam simulator and source-based Regents drills.
- Jeopardy Boards: course/unit board launches for classroom projection.

## Content Rules

- Student-facing content only: people, places, laws, events, movements, vocabulary, cases, models, theories, and exam concepts.
- No teacher-planning labels as game categories.
- No generic clue stems such as "Name this content item."
- Every game must include explanations after clues.
- Unit games should cover the tested course material for that unit, not lesson file names.

## Visual System

- Generated bitmap assets are first-class product assets and must be copied into `assets/`.
- Every `games.json` entry needs generated WebP coverage: thumbnail, card art, marquee, and manifest alt text.
- The first read should feel like a glowing 1989 cabinet: black cabinet shell, warm CRT glass, cyan interface light, gold reward states, sparse magenta/violet accents, coin-slot details, and readable marquee cards.
- Core palette: deep black command-center base, cyan interface light, warm gold reward states, limited magenta/green accents.
- Avoid one-note purple/blue gradients, decorative blobs, and generic AI dashboard cards.
- Cards and controls should use tight radii, preferably 8px.
- Typography should be dense and readable, with large type reserved for the true hero and compact type inside controls.
- Use scanlines and boot effects at low opacity only. Motion must respect reduced motion and should never delay a student trying to launch review.
- Generated art should suggest social-studies review: maps, documents, globes, timelines, source pages, court/civics motifs, economics graphs, psychology symbols, tokens, joysticks, and cabinet lights. Do not copy commercial arcade sprites or official source images.

## Interaction Rules

- Every card and featured mode is clickable.
- The homepage player opens games in an embedded modal and supports fullscreen/open-tab.
- Games must support solo play and teams.
- Typed answers should use automatic scoring with manual override.
- Final Jeopardy/wager flows must be available in Jeopardy-style games.

## Performance Rules

- Keep the homepage fast on school Chromebooks and iPads.
- Prefer shared assets for new multi-file games.
- Keep generated thumbnails near 150 KB or less, card art near 250 KB or less, and decorative cabinet assets small enough to lazy-load without blocking first launch.
- Avoid heavy always-on animations on mobile.
- Use canvas effects sparingly and respect reduced-motion settings.
- Large stimulus images are allowed when they directly support Regents/AP-style source questions.
- Local progress reports are browser-only and student-showable; they should stay useful without collecting names or rosters.

## Quality Tiers

- **Premium** means a complete game loop, explanations, recordPlay/completion hooks, leaderboard when score-based, mobile controls, reduced-motion handling, and generated art.
- **Practice** means source/exam integrity, clear approximate-score wording, accessible document expansion, and strong feedback.
- **Prototype / rebuild** games stay out of the primary featured rail until controls, content, and shared-module integration match the premium bar.

## Expansion

The platform is not limited to Jeopardy. Future modes should be built as reusable engines that can load course/unit question banks:

- Regents Gauntlet for stimulus MCQ practice.
- Boss Rush for randomized comprehensive review.
- Future arcade modes should use real course content banks and avoid trivia-only wrappers.
- Experimental modes should be labeled as labs until their controls and visuals match the flagship standard.
