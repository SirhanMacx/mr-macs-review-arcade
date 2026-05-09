# Shipping a New Arcade Game

End-to-end guide for adding a new flagship arcade game to Mr. Mac's Review
Arcade. Follow every step — visibility flags, validator runs, and CSS
conventions are all load-bearing.

---

## 1. Folder structure

Each game is a self-contained static folder under `games/`:

```
games/
└── <game-id>/
    ├── index.html       # Entry HTML — script tags + canvas + minimal markup
    ├── game.js          # Main game loop + question pool + hub wiring
    └── styles.css       # Game-specific CSS (editorial dark theme)
```

`<game-id>` is a kebab-case slug, e.g. `source-snake`, `chrono-pinball`,
`step-pyramid`. The slug is used as the canonical identifier in `games.json`,
in `localStorage`, and in analytics counters — pick it carefully and don't
rename later (existing leaderboard / session entries would orphan).

---

## 2. Required script tags in `index.html`

Load order matters — analytics first (so `MrMacsProgress` exists), profile
second (so subsequent modules can hook into events), then the rest. The hub's
`index.html` already loads the shared modules at the page-shell level, but
because games run inside an iframe via the embedded player and also load
standalone, every game page must include them itself.

```html
<!-- Required, in order -->
<script src="../../assets/arcade-analytics.js"></script>
<script src="../../assets/arcade-profile.js"></script>
<script src="../../assets/arcade-perf.js"></script>
<script src="../../assets/arcade-icons.js"></script>
<script src="../../assets/arcade-toast.js"></script>
<script src="../../assets/arcade-celebration.js"></script>
<script src="../../assets/arcade-progress-extras.js"></script>

<!-- Optional, in order, only if the game uses them -->
<script src="../../assets/arcade-music.js"></script>
<script src="../../assets/arcade-tour.js"></script>
<script src="../../assets/source-bank.js"></script>
<script src="../../assets/document-viewer.js"></script>

<!-- Game-specific code last -->
<link rel="stylesheet" href="styles.css" />
<script src="game.js" defer></script>
```

Use cache-busting `?v=YYYYMMDD-tag` query strings on every shared module URL;
copy the strings the hub uses verbatim so all pages share the same cache key.

---

## 3. Required hub API calls

Every flagship is expected to wire these. Skipping any of them will quietly
break achievements, the topbar pill, the resume system, the daily challenge,
or analytics rollups.

### 3a. On game open

```js
window.MrMacsProfile.recordPlay({
  id: "source-snake",
  title: "Source Snake",
  course: "All Courses", // or specific course label
  file: "games/source-snake/index.html"
});
```

This updates `recentGames`, advances the streak (with Streak Shield
consumption on a gap), unlocks first-play / distinct-genre / 100-plays
achievements, and bumps the day's play counter.

### 3b. On every shard payout

```js
// Generic
window.MrMacsProfile.addShards(5, "source-snake-correct");

// Scholar prompt — source string MUST contain "scholar" + "correct" lowercase
window.MrMacsProfile.addShards(20, "source-snake-scholar-correct");
```

`addShards` auto-stacks Lucky Charm + Coin Doubler buffs and auto-bumps
the cross-game scholar counter. Don't double-call `recordScholarCorrect` —
the addShards path handles it.

### 3c. On run end

```js
// Submit to local top-5 leaderboard
const result = window.MrMacsLeaderboards.submit("source-snake", finalScore, {
  level: levelReached,
  durationMs: elapsedMs
});
if (result && result.isNewRecord) {
  window.MrMacsCelebration.fireworks(window.innerWidth / 2, 200);
}

// Mark completion (raises bestScore + completions counter)
window.MrMacsProfile.recordCompletion("source-snake", finalScore);

// Optional: claim daily challenge if today's daily was this game
const dailyState = window.MrMacsProfile.getDailyChallengeState();
if (todayDailyGameId === "source-snake" && !dailyState.claimedToday) {
  window.MrMacsProfile.claimDailyChallenge({ gameId: "source-snake", payout: 60 });
}
```

### 3d. Auto-resume sessions

```js
// Save periodically (every ~10s, or on key turn events)
window.MrMacsSessions.save("source-snake", {
  level, score, snakeBody, foodPositions, currentQuestionId, ts: Date.now()
});

// Load on boot, before the user tap-to-start
const saved = window.MrMacsSessions.load("source-snake");
if (saved) {
  showResumePrompt(saved.state, () => {
    // user accepted — restore
  }, () => {
    // user declined — clear
    window.MrMacsSessions.clear("source-snake");
  });
}
```

The hub's continue rail auto-decorates these via
`MrMacsSessions.decorateContinueCards()`.

### 3e. Music + ducking

```js
// Start theme on first user gesture (click / keypress)
const startBtn = document.getElementById("startBtn");
startBtn.addEventListener("click", () => {
  window.MrMacsArcadeMusic.start("rift-survivors");
});

// Duck during boss / quiz interludes
function showQuestionModal() {
  window.MrMacsArcadeMusic.duck(0.25, 200);
  // ...show modal...
}
function closeQuestionModal() {
  window.MrMacsArcadeMusic.restore(360);
}
```

### 3f. Celebration bursts

```js
import { /* nothing — globals */ } from "_"; // not a module — use window globals

// On scholar-correct
window.MrMacsCelebration.fromShardPayout(20);

// On level clear
window.MrMacsCelebration.confetti({ count: 60 });

// On boss defeat
window.MrMacsCelebration.fireworks(canvas.width / 2, canvas.height / 3);
```

---

## 4. Scholar prompt convention

Scholar prompts are the rotating review questions that interrupt arcade
gameplay with a stimulus + 4 choices. They are how every game earns its keep
as a *review* arcade.

### Visual contract

- **Gold rim** around the prompt modal — `border: 2px solid #f5c451;` plus
  a soft `box-shadow: 0 0 36px rgba(245, 196, 81, 0.32);`.
- **Rotating `?` glyph** in the modal header — small JetBrains Mono `?` with
  `animation: scholarPulse 1.6s ease-in-out infinite alternate;` (subtle
  gold glow pulse).
- **Optional review modal** on incorrect — show the explanation + a
  "Show stimulus" affordance; do not block long-game flow with a forced
  re-read.

### Source string format

The source argument to `MrMacsProfile.addShards` MUST contain the substring
`"scholar"` AND `"correct"` (lowercase) for cross-game tracking to fire.
Convention: `"<game-id>-scholar-correct"`.

```js
// Correct
window.MrMacsProfile.addShards(20, "source-snake-scholar-correct");

// Wrong — won't bump the cross-game counter
window.MrMacsProfile.addShards(20, "snake-correct"); // missing "scholar"
window.MrMacsProfile.addShards(20, "source-snake-scholar"); // missing "correct"
window.MrMacsProfile.addShards(20, "Source-Snake-Scholar-Correct"); // not lowercase
```

The 50th lifetime scholar-correct unlocks the **Scholar Decoder** gold
achievement.

---

## 5. `games.json` entry

Append your game to `games.json` (it's a flat JSON array; no commas to fix
inside an entry). Required fields plus the visibility-relevant ones:

```json
{
  "id": "source-snake",
  "title": "Source Snake",
  "subtitle": "Classic snake — answer scholar prompts to grow your tail past 50 segments. Full-library review across all courses.",
  "day": "Arcade Flagship",
  "course": "All Courses",
  "subject": "Cross-Curricular Review",
  "grade": "All",
  "gameType": "Arcade Original",
  "file": "games/source-snake/index.html",
  "originalFile": "Source Snake.html",
  "collection": "may-2026-flagship-sweep",
  "categories": [
    "Arcade Original",
    "Scholar Prompts",
    "Full Library Review",
    "Cross-Curricular"
  ],
  "clueCount": 4529,
  "hasFinal": false,
  "tags": [
    "source snake",
    "snake",
    "arcade",
    "scholar prompts",
    "all courses",
    "full library"
  ]
}
```

Field notes:

- **`id`** — the kebab-case slug. Must match the folder name.
- **`title`** — display title. Distinct from `id`.
- **`subtitle`** — student-facing one-sentence pitch. Single line, no markup.
- **`day`** — short label that appears as a badge ("Day 5", "Arcade
  Flagship", "Skill Lab", "Final Review", etc.).
- **`course`** — exact label string. Use `"All Courses"` for cross-curricular
  flagships; otherwise pick from `MrMacsMastery.COURSES.label` (e.g.
  `"Grade 10 Global History II"`, `"AP United States History"`).
- **`subject`** — broader topical bucket ("Source Reading", "Cross-Curricular
  Review", "Personalized Review").
- **`grade`** — `"5"`, `"6"`, ..., `"AP"`, `"All"`, or hyphenated range
  `"10-11"`.
- **`gameType`** — one of: `"Arcade Original"`, `"Jeopardy Board"`, `"Skill
  Lab"`, `"Mastery Dashboard"`, `"Practice Exam"`, `"RPG"`, `"Boss Rush"`,
  `"Tower Defense"`, `"Pinball"`, `"Maze Chase"`, `"Endless Runner"`,
  `"Survivor"`, `"Brick Breaker"`, `"Falling Block"`, `"Match-3"`,
  `"Q*bert-style"`, `"Whack-a-Mole"`. Drives the homepage filter.
- **`file`** — path from repo root to the game's `index.html`.
- **`clueCount`** — number of unique questions / scholar prompts the game
  ships with.
- **`hasFinal`** — only true for Jeopardy boards with a Final Jeopardy round.
- **`tags`** — lowercase free-text search tokens. Include both the game-id
  slug, the `gameType` slug, the course slug, and a few discriminator words.

---

## 6. Visibility checklist

There are three constants in `index.html` that decide where a game appears.
**Forgetting any of these will leave your game effectively invisible.**

### `PREMIUM_ARCADE_IDS`

Set in `index.html` (~line 8184). Add your `id` here so the game appears in
the premium arcade lane with the gold border + cabinet rail.

```js
const PREMIUM_ARCADE_IDS = new Set([
  "history-hunters", "archive-quest", "cold-war-invaders",
  // ...
  "source-snake"   // ← add yours
]);
```

### `FEATURED_GAME_IDS`

Set in `index.html` (~line 8177). The hub's featured carousel rotates
through these. Add yours if you want new players to see it on first load.

```js
const FEATURED_GAME_IDS = [
  "rumor-whack", "citadel", "step-pyramid", "chronohop",
  "history-hunters", "archive-quest", "cold-war-invaders",
  "brickoria", "stellar-drift", "cascade",
  "regents-practice-exam", "ap-practice-exam",
  "source-snake"   // ← optional
];
```

### `course === "All Courses"`

If your game is cross-curricular, set `"course": "All Courses"` in
`games.json`. The hub treats this as a pseudo-course that always passes the
course filter — so the game appears under every course view as well as the
"All" view. Don't invent a different cross-curricular label; the predicate
in `index.html` is hardcoded to `"All Courses"`.

### Other relevant sets

- `SOURCE_LOCKED_GAME_IDS` — games that require trusted source images. Add
  here if your game enforces `MrMacsSourceBank.sourceLock`.
- `REBUILD_QUEUE_IDS` — games marked as rebuild candidates. Don't add a fresh
  game here.
- `PRACTICE_TOOL_IDS` — practice tools, not arcade. Don't mix.
- `PROTOTYPE_IDS` — weak prototypes. Don't add unless your game genuinely is.

---

## 7. Validation steps before commit

Run the validator from the repo root:

```bash
python3 scripts/validate_arcade.py
```

It checks:

- Every entry in `games.json` has a corresponding `games/<id>/index.html`.
- Every `games/<id>/` has an entry in `games.json`.
- Every `file` path resolves.
- No id collisions.
- `course` values match a known course profile or `"All Courses"`.

Other targeted validators (run only if relevant to your game):

- `node scripts/audit-flagship-games.mjs` — premium arcade lane completeness.
- `node scripts/validate-jeopardy-boards.mjs` — Jeopardy boards only.
- `node scripts/validate-shared-source-bank.mjs` — source-bank questions.
- `node scripts/verify-arcade.mjs` — top-level smoke test.

Before shipping, also manually sanity-check:

- Open `index.html` locally (`python3 -m http.server 8080`) — verify your
  game shows in the All / premium / course / featured views as expected.
- Open the game directly — verify scholar prompt loop, score-up animations,
  music start, session save+load, and at least one full run-to-completion.
- Toggle reduced motion in OS settings — verify particle bursts fall back to
  pulses and CSS animations short-circuit.
- Open in mobile emulation (DevTools, narrow width) — verify touch input
  works and the canvas isn't oversized.

---

## 8. CSS / visual conventions

The arcade is **editorial dark**. Anchor every new game to this palette:

| Color | Hex | Use |
| --- | --- | --- |
| Bronze (gold) | `#f5c451` / `#ffd884` | Reward, score, achievement. |
| Cyan | `#7af0ff` | Score values, source/Regents accents. |
| Magenta | `#ff7cc8` / `#b892ff` | Achievement / level-up burst. |
| Coral | `#ff8e6f` | Streak / warmth. |
| Paper | `#f0f3fa` / `#f6f4ee` | Default text. |
| Muted | `#9aa3bb` | Secondary text. |
| Surface | `rgba(13, 17, 27, 0.94)` | Modal / card background. |
| Deep | `#0b0d14` / `#080b14` | Page background. |

Type ladder: **Fraunces** (display serif, italic) for hero titles, **Inter**
for body, **JetBrains Mono** for labels / tabular nums / shard counts.

### Reduced motion

Always wrap heavy CSS animations in:

```css
@media (prefers-reduced-motion: reduce) {
  .my-particle, .my-bump, .my-screen-shake {
    animation: none !important;
    transition: none !important;
  }
}
```

In JS, gate optional effects on `MrMacsArcadePerf.isLite()`:

```js
if (!window.MrMacsArcadePerf.isLite()) {
  spawnParticleStorm();
}
```

### Don't

- Don't ship `<audio>` tags or shipped sound files. Use `MrMacsArcadeMusic` +
  Web Audio synthesis only.
- Don't write to `localStorage` directly with a custom key — use
  `MrMacsSessions.save` for run state and `MrMacsProfile.set` for player
  data.
- Don't import any npm package, framework, or transpiler. Vanilla JS only.
- Don't use emoji as primary UI iconography — use `MrMacsIcons.fromEmoji`
  to swap them for monoline SVGs.
- Don't add a teacher-facing column ("Docs + History Skills", "Cause and
  Effect", "Synthesis", placeholder stems like "Name this content item").
  See `DESIGN.md` Content Rules.

---

## 9. Question pool guidance

The arcade ships **194 games** and a 4,529-prompt shared review library.
Per-game, follow this template unless the game-type explicitly diverges:

- **28 inline questions** as the in-cabinet pool (Regents Day-1 cohort
  size). Keeps file size sane and gives the player ~3-4 distinct sessions
  before repetition starts.
- **7 disciplines** represented: Geography, Civics, Economics, Belief
  Systems, Source Reading, Comparison/Causation, Vocabulary. Mix so a single
  run touches at least 3.
- **Grade band 8 → AP**, in roughly this distribution:
  - Grade 8 / U.S. History I: 4
  - Grade 9 Global I: 4
  - Grade 10 Global II: 6
  - Grade 11 U.S. History: 5
  - AP-level (any AP course): 5
  - Cross-grade vocabulary / civics: 4
- **Answer choice randomization** — every MC question must have its choice
  letters randomized at runtime so the same correct answer doesn't always
  sit on B. Target a 25/25/25/25 A/B/C/D distribution; never run more than
  3 of the same letter. (See `~/Desktop/AP_Psychology_2026-27/Skills/randomize_assessments.py`
  for the canonical retrofit pattern.)
- **Explanations** required after every answer, correct or wrong.
- **No teacher-facing planning labels** as categories. Student-content only:
  people, events, laws, places, empires, movements, vocabulary, historical
  examples, psychology terms.

For full-library flagships (those that surface the 4,529-prompt library),
filter by course at runtime via `MrMacsMastery.questionPool(data, courseLabel)`
or pull a hand-curated subset and register it via
`MrMacsSourceBank.registerRecords`.

---

## 10. Wrapping up

Once your game is built, validated, and visible in the local hub:

1. Update `CHANGELOG.md` with an entry under today's date in the **Added**
   section.
2. Commit with a descriptive message:
   `Add <game id> flagship to May 2026 arcade sweep`.
3. Push to `main`. GitHub Pages republishes automatically (~30 seconds).
4. Verify on the live site.
5. Optionally ping the hub orchestrator to add your game to the next
   featured carousel rotation.

Welcome to the cabinet rail.
