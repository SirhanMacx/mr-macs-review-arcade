# Mr. Mac's Atlas Arcade Design System

## Product Bar

Mr. Mac's Atlas Arcade should feel like a premium student-facing review platform, not a folder of teacher files. The first screen should communicate: polished arcade hub, serious exam prep, fast student launch, and room for future game types.

## Content Rules

- Student-facing content only: people, places, laws, events, movements, vocabulary, cases, models, theories, and exam concepts.
- No teacher-planning labels as game categories.
- No generic clue stems such as "Name this content item."
- Every game must include explanations after clues.
- Unit games should cover the tested course material for that unit, not lesson file names.

## Visual System

- Generated bitmap assets are first-class product assets and must be copied into `assets/`.
- Core palette: deep black command-center base, cyan interface light, warm gold reward states, limited magenta/green accents.
- Avoid one-note purple/blue gradients, decorative blobs, and generic AI dashboard cards.
- Cards and controls should use tight radii, preferably 8px.
- Typography should be dense and readable, with large type reserved for the true hero and compact type inside controls.

## Interaction Rules

- Every card and featured mode is clickable.
- The homepage player opens games in an embedded modal and supports fullscreen/open-tab.
- Games must support solo play and teams.
- Typed answers should use automatic scoring with manual override.
- Final Jeopardy/wager flows must be available in Jeopardy-style games.

## Performance Rules

- Keep the homepage fast on school Chromebooks and iPads.
- Prefer shared assets for new multi-file games.
- Avoid heavy always-on animations on mobile.
- Use canvas effects sparingly and respect reduced-motion settings.
- Large stimulus images are allowed when they directly support Regents/AP-style source questions.

## Expansion

The platform is not limited to Jeopardy. Future modes should be built as reusable engines that can load course/unit question banks:

- Regents Gauntlet for stimulus MCQ practice.
- Boss Rush for randomized comprehensive review.
- Future arcade modes should use real course content banks and avoid trivia-only wrappers.
