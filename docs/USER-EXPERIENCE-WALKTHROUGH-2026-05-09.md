# User Experience Walkthrough · 2026-05-09

Read-only audit simulating a fresh-visit player. Hub home page traced via `index.html`; ten flagship games sampled (Snake Pit, Citadel, Sokoban Scribe, Atlas 2048, Knight's Quest, Mahjong Mosaic, Archive Tycoon, Plinko Lab, Chess Cabinet, Anagram Atlas).

Severity scale per finding: **HIGH** = blocks or confuses a meaningful fraction of players · **MED** = noticeable friction, fixable polish · **LOW** = nit, not on the critical path.

---

## Hub home page (first-visit player perspective)

### Step 1 · Page load → welcome dialog

A `welcomeOverlay` modal pops 320 ms after first paint when no profile exists (`P.exists()` false, line 10415). Three required-feeling steps:

1. Trainer name (text, required — `welcomeContinue` button is `disabled` until `name.value.trim().length >= 1`).
2. Course dropdown (optional but visually mandatory — same row weight as name).
3. Avatar grid (radiogroup, no default-selected → `welcomeAvatar` is undefined unless clicked).

A `Skip` link is in the top-right of the welcome card. Skipping closes the dialog and triggers the same five-step hub tour.

**Findings**:
- **MED · "Set up your trainer" reads like a hard wall.** Three input rows, a CTA disabled by default, and a small Skip pill in the corner. A casual student arriving from a TPT preview link may bounce here. Recommendation: change the disabled-CTA-until-name behavior to "Enter the Arcade" (active, defaulting name to "Player" or anonymous) and demote name/avatar/course to optional polish.
- **LOW · No default avatar selected.** If a player types a name, ignores avatar, and hits Continue, `welcomeAvatar` is `undefined` (only set on click, line 10388). Players will get a blank `pp-avatar` until they revisit profile. The `🎓` fallback in the topbar covers it visually but the profile drawer may still show empty.
- **LOW · Time-of-day eyebrow ("Good morning, hunter") is fun.** No issue — just nice.
- **LOW · `placeholder="e.g. Avi, Ms. Chen, JoanDarcFan42"`** is on-tone for the audience.

### Step 2 · Topbar + nav

Five-link primary nav (Play / Practice Exams / Jeopardy / Games / Library) with inline SVG icons. Profile pill on the right shows avatar + shards + streak. "Enter Arcade" link separately on the far right.

**Findings**:
- **LOW · "Enter Arcade" CTA next to the profile pill duplicates the in-hero "Start Recommended" button.** Two equivalent calls-to-action visible at once. Not a bug but redundant; could be removed on hub since visitors are already inside the arcade.

### Step 3 · Hero section

Big "MR. MAC'S REVIEW ARCADE" wordmark, tagline "Play a game, take a full practice exam, or jump into a Jeopardy board," and three actions: **Start Recommended** (primary), Practice Exams, Jeopardy Boards. Right-side console widget shows a featured game ("History Hunters 2"), a fast-launch grid, and "28 MCQs / Full Exams / Local Progress" status pillars.

**Findings**:
- **GOOD.** Three distinct CTAs prevent decision paralysis. Hero console doubles as a usable launcher.
- **LOW · "28 MCQs" is opaque.** A first-visit player has no idea what this number means. Either drop it or add a tooltip — currently it just looks like a stat for the sake of a stat.
- **LOW · `id="heroGameCount"` initially shows "Loading games"** for a beat. If the catalog fails to load, this stays. Consider a fallback after 3 s.

### Step 4 · Bands cascade (top to bottom)

The hub stacks ~14 bands. In document order:

1. **Next Best Action pill** (`#nbaBand`, hidden until populated) — small dynamic pill.
2. **Daily fortune** (`#fortuneBand`) — rotating motivational message, clickable for new fortune.
3. **Today's Plan** (`#dailyPlanBand`, hidden by default) — three goals with a +60 shard claim button.
4. **Test-prep countdown** (`#testprepBand`, hidden until target date set).
5. **Today's Challenge** (`#daily`, hidden until populated) — daily pick with "Take the Challenge" CTA.
6. **Achievements strip** (`#achievementsStrip`, hidden until unlocks exist).
7. **Smart Study Tools** (`#routing`) — five cards: Diagnostic, Mastery Map, Wrong-Answer Queue, Cram Playlist, Mock Exam.
8. **Continue where you left off** (`#continue`, hidden until saves exist).
9. **What's New callout** (`#whatsNewCallout`) — "Nine fresh flagships shipped" with a Browse CTA.
10. **New Cabinet rail** (`#newCabinet`) — horizontal scroller of new flagships.
11. **Launch paths** (`#launch-paths`) — three big "Choose your path" cards.
12. **Mastery System** (`#mastery`) — focus grid.
13. **Practice Report** (`#progress`) — print/clear actions.
14. **Arcade Games** (`#arcade-menu`) — smart tabs + grid.
15. **Practice Exams** (`#practice`).
16. **Featured Missions** (`#featured`) — bento grid.
17. **Jeopardy boards** (`#jeopardy`) — course/subject/search filters.
18. **Quick Play** (`#quickplay`).
19. **Course Portals** (`#courses`) — horizontal rail.
20. **Round 3 Mega Drop callout** (`#round3Callout`) — "16 New Cabinets" with a Browse CTA.
21. **Quick Insights** (`#quickInsights`) — three panels (stats / recommender / globe).
22. **Game library** (`#library`) — search, course/subject/type filters, lane tabs, topic chips, grid.

**Findings**:
- **HIGH · Two near-redundant "what's new this month" callouts** (`#whatsNewCallout` says "9 new flagships, May 2026" and `#round3Callout` says "16 new cabinets, May 2026"). Stacked within ~10 sections of each other, both with identical visual rhythm: eyebrow → big title → CTA → big number stat. A first-time visitor will read both and assume one is stale or the count is wrong. Recommendation: collapse to one banner ("25 New Cabinets · May 2026") or make the second one a sub-rail of the first.
- **MED · Twenty-two stacked bands is a long scroll.** First-time players have to scroll through Today's Plan, Test-prep, Today's Challenge, Achievements, Smart Study, Continue, What's-New, New Cabinet, Launch Paths, Mastery, Progress, Arcade-menu, Practice, Featured, Jeopardy, Quick Play, Course Portals, Round 3, Quick Insights — before reaching the Library. Many of these correctly hide-when-empty for fresh visitors, but the order **Routing → Continue → New Cabinet → Launch Paths** still places "Smart Study Tools" before "Choose your path." A new player should see *paths* first.
- **MED · Daily Challenge band's `+50 shards` from the tour copy doesn't appear in the band's own visible UI.** The button just says "Take the Challenge → " with no dollar/shard call-out. The hub tour mentions the payout, but a player who skipped the tour sees no reward incentive on the band. Add `+50 💎` to the CTA pill.
- **LOW · "Today's Plan" only shows when populated, but the placeholder behavior mid-load is unclear.** The `<section>` has `hidden` attr; if the JS fails it stays hidden silently. No fallback state.
- **GOOD · Quick Insights three-panel layout** is genuinely useful (stats / recommender / live activity globe).

### Step 5 · Library (the star section)

Filters row: search input, course select, subject select, type select, sort select. Lane tabs above. Topic chips (hidden by default). Random button + count pill. Grid below.

**Findings**:
- **LOW · The search placeholder is content-rich** ("Search civil rights · imperialism · cold war · memory…") which is great. But there's no visible "Search examples" or topic-chip seed visible by default — `topic-chips` is `hidden` until populated.
- **LOW · Sort defaults to "Featured"** which is fine, but the four sort options (Featured / Course / Title / Game Type) lack a "Newest" option — would be the obvious player-question for a hub that just shipped 25 new cabinets.
- **GOOD · `Random` button (🎲)** is a delightful affordance for low-decision-cost browsing.

### Step 6 · Footer

Brand block, public traffic counter (`visits / plays / views / today`), a 7-day visit trend mini-chart, top-cabinets list, footer-jump nav, latest-games card.

**Findings**:
- **LOW · Public traffic counter on a fresh-build site might show "--" for several seconds.** The placeholder dashes look like broken markup until they resolve. Add a "loading…" state or hide entirely until data arrives.
- **GOOD · Footer has six jump links** to the high-traffic bands. Solid info architecture.

---

## Sampled games (10 flagships)

Every flagship in the sample follows a consistent five-screen structure:

1. **Setup screen** (`.setup-screen.show`) — kicker, title, badge palette, subhead description, optional resume card / leaderboard, primary "Insert Coin" CTA, sound + fullscreen secondary buttons, `key-hints` keyboard cheat-sheet.
2. **Top HUD** — score, lives, game-specific stats (length, kills, era, floor, etc.), best, plus right-side `Pause` and `Exit` buttons.
3. **Goal/wave ribbon** — current objective + meta info.
4. **Question screen** — scholar pickup → review prompt with Skip button.
5. **Pause screen** + **End screen** — both have Resume/Restart/Exit and Setup/Play Again respectively.

This consistency is a real strength — once a player learns one cabinet, every other cabinet is instantly readable.

### 1. Snake Pit (slither.io battle royale)

**Setup**: Strong subhead explains slither, devour, boost mechanic, and scholar orbs. Six badges show palette. Keyboard hints visible (Mouse / Arrows / Shift+Space / Esc+P). Mobile virtual joystick + boost present.
**HUD**: score, lives, length, kills, best — five metrics, all live-updated with `aria-live="polite"`.
**End screen**: kicker, title, end-grid, retry hint, Setup + Play Again.
**Findings**:
- **GOOD.** Keyboard hints up front; mobile controls included; resume card hosted but `hidden` until save exists; clear Exit button.
- **LOW · `Sound On` button is unconditionally labelled "Sound On"** even when sound is currently on (it's a toggle). Should reflect current state ("Sound Off" once off).

### 2. Citadel (match-3 Bejeweled)

**Setup**: Match-3 mechanic explained with cascade/Striker/Codex/Bomb mechanics. Six discipline badges (scroll, atom, palette, quill, compass, globe). Power-up tray (3 slots) bottom-right.
**HUD**: score, target, moves, level, lives, best — six cells.
**Findings**:
- **GOOD · Color picker overlay** for Color Bomb power-up shows pre-game mechanics nicely.
- **LOW · Same "Sound On" static-label bug.**

### 3. Sokoban Scribe (box-pushing puzzle)

**Setup**: 30 hand-crafted levels + endless mode explained. Six tile-type badges (wall, shelf, filled, ice, trap, scholar). Mobile D-pad with Undo/Reset.
**HUD**: score, lives, level, moves, best.
**Controls**: HUD has dedicated `Undo` and `Reset` buttons in addition to keyboard `U` / `R`.
**Findings**:
- **GOOD.** Undo/Reset surfaced as visible HUD buttons (very Sokoban-correct UX).
- **LOW · Mobile D-pad uses 6 buttons (4 directions + U + R)** but no visual separator between movement and action keys. May be small on phone screens.

### 4. Atlas 2048 (sliding-merge across history eras)

**Setup**: Slide arrows or swipe; eras range from Stone Age → Singularity. Five power-ups (undo/smash/2x/hint/spawn-4) each with letter shortcuts (Z/X/C/V/B). 9 era badges. 5×5 grid unlock at 100k.
**HUD**: score, lives, era, grid, best.
**Findings**:
- **GOOD · Power-up tray with count + label + glyph** is the most polished tray of the sample — players can see at a glance how many of each they have.
- **LOW · The single-letter Z/X/C/V/B shortcuts** are hard to remember (5 different keys for 5 power-ups). Consider showing the letter in the tray icon for muscle-memory.

### 5. Knight's Quest (rogue-lite dungeon crawler)

**Setup**: Five-floor procedural dungeon, four enemy types + boss ("Misconception Lord"). Mobile D-pad + SLASH + BLOCK action buttons.
**HUD**: score, lives, hp, floor (1/5), keys, best.
**Findings**:
- **GOOD · Floor counter `1/5`** answers the "how long is a run?" question instantly.
- **MED · `lives` and `hp` shown side-by-side** with no visible explanation of the difference. A new player won't know if they have 3 lives × 3 HP each = 9 hits or something else. Setup copy clarifies "Three lives. Game first — review optional." but doesn't explain HP. The HUD label "hp 3" alone is ambiguous.

### 6. Mahjong Mosaic (mahjong solitaire)

**Setup**: 4 stages (Turtle / Dragon / Pyramid / Castle), 144 tiles, hint/shuffle/undo with explicit costs visible on HUD buttons (`Hint -3 / Shuffle -2 / Undo -5`).
**HUD**: score, lives, stage, time (8:00), tiles left (144), best.
**Findings**:
- **GOOD · Round-cost chips on Hint/Shuffle/Undo buttons** are a great UX touch — players see the cost before clicking.
- **LOW · No mobile virtual touch controls section visible** in the markup (this is a click/tap game). On phone, native touch should work but no fallback if events don't fire.

### 7. Archive Tycoon (idle clicker)

**Setup**: Click → produce → automate → publish (prestige) loop. Seven producer chain (Apprentice → Knowledge Engine). Both producer panel (right rail) and upgrade panel (left rail).
**HUD**: knowledge, per sec, volumes, lives, per click, global multiplier.
**Findings**:
- **MED · `lives` on an idle clicker is unintuitive.** Idle/clicker games usually don't have lives. The setup copy says "3 lives per run" but no clear explanation of how a life is lost (timer? scholar challenge fail?). This will confuse genre-fluent players.
- **GOOD · Six HUD stats** is a lot but they're idle-clicker-essential (knowledge, per-sec, prestige count, click power, multiplier).
- **LOW · `1`–`7` for buying producers and `Q`–`U` for upgrades** is a lot of shortcuts. On-screen tray hints would help.

### 8. Plinko Lab (peg drop)

**Setup**: 12 balls × 3 rounds. 9 slots (100/200/500/1000/5000-jackpot). Power-ups dropped on jackpots.
**HUD**: score, lives, round, balls, best.
**Findings**:
- **GOOD.** Setup screen is the cleanest of the sample — drop mechanics explained in two sentences.
- **LOW · `lives` on Plinko** is also unintuitive (Plinko doesn't typically lose lives — you lose balls). Same genre-fluency mismatch as Archive Tycoon.

### 9. Chess Cabinet (chess vs AI)

**Setup**: Four difficulty tiers (Easy / Normal / Hard / Expert) with explicit minimax depth + opening book metadata. Difficulty selector row pre-Insert-Coin. Gold scholar square rotates every 8 moves. Win 3 matches to claim cabinet.
**HUD**: score, matches, match-number, wins, best.
**Findings**:
- **GOOD · Difficulty tier selector before Insert Coin** is the right pattern; explicit "Depth 3 + PST" tooltip is honest about what each tier means.
- **GOOD · `Resign` button on HUD** lets players bail a losing match without exiting the whole run.
- **LOW · No visible explanation of what "score" means in chess** (capture-points? win-points?). Setup says "Capture pieces for points" but score formula isn't visible.

### 10. Anagram Atlas (anagram unscramble)

**Setup**: Scrambled history/science/geography/civics/art terms. Three lives, multiplier, streak. Hint/shuffle/skip controls in a dedicated `roundControls` row.
**HUD**: score, lives, mult (1x), timer (30), streak, best.
**Findings**:
- **GOOD · Round-control row separate from HUD** keeps the play surface uncluttered.
- **LOW · `Hint -50` cost is shown** on the button, which is great. But shuffle and skip have no cost shown — players will assume they're free.

---

## Universal friction points (across all flagships)

1. **MED · Static "Sound On" button label.** All ten games show "Sound On" regardless of current state. Should reflect actual state and update on click. (Ten files, ten fixes.)

2. **MED · No "How to Play" / Tutorial CTA on setup screens.** Setup subheads are dense paragraph descriptions ("You are a luminous serpent in a continuous neon pit. Devour energy orbs..."). For non-strong-readers, this is a wall of text. None of the ten flagships offer a "Show me how" interactive walkthrough or annotated first level. The ones that need it most (Knight's Quest, Atlas 2048, Sokoban Scribe) load straight into gameplay.

3. **MED · "Lives" semantic ambiguity in 4+ flagships.** Genres that don't traditionally use lives (Archive Tycoon, Plinko Lab, Atlas 2048, Citadel) all show a `lives` HUD cell. Each game's lives mean something different (no shared mental model). Either rename per-game ("attempts," "balls left," "moves") or explain inline.

4. **MED · Resume card / leaderboard placeholder is rendered hidden.** All ten games have `<div class="resume-card" id="resumeCard" hidden></div>` and `<div class="leaderboard-panel" id="leaderboardPanel" hidden></div>`. If JS fails to populate them, players never see "you have a save in progress." Validate that these are actually populated reliably across browsers (especially when localStorage is locked down in school networks).

5. **MED · End screen lacks share-this-run / celebration burst affordance.** All ten games end with a generic `setup-card` showing kicker + title + grid + retry hint + Setup + Play Again. None has a "Share this run" / "Tweet your score" / "Copy a screenshot" CTA. Achievement unlocks during play fire `arcade-celebration.js` (per script include) but the end screen doesn't recap "you unlocked X today" — players have to remember. Add a recap line like "🏆 Unlocked: First Cascade · Streak 5" at the top of `end-grid`.

6. **LOW · Pause screens all read "[Game] Held"** ("Pit Held," "Cabinet Held," "Archive Held," "Lab Held"). Cute but inconsistent enough that some sound like errors ("Atlas Closed" → did the game crash?). Consider a single shared verb like "Game Paused — Resume?"

7. **LOW · Skip button on scholar review modal** is a `glass-pill` in the corner, label "Skip." For an *optional* educational layer, "Skip" reads like "I give up." Consider "Back to game" or "Maybe later" — softer, more inviting to come back.

8. **LOW · No "Back to Arcade" link on the setup screen itself.** All ten games have `Exit` in the HUD (post-Insert-Coin) and `pauseExitBtn` in the pause screen. But on the setup screen *before* clicking Insert Coin, the only way back to the hub is the browser back button. Add an `Exit Arcade` button to the setup-actions row, or rely on the `<a href>` mode (each game.js may handle this).

9. **LOW · Keyboard hints are bottom-of-card and small.** On a 4K screen these are visible; on a Chromebook 1366×768 they may fall below the fold of the setup card. Consider a permanent "?" fob on the gameplay screen (matching the hub's `ksFob`) for in-game shortcut help.

10. **LOW · No visible accessibility / settings link on the game shells.** The hub has a comprehensive a11y settings panel (motion, font, colorblind, contrast). Inside a game cabinet, the only settings exposure is `Sound On` and `Fullscreen` — no font-size, no high-contrast, no motion-reduce toggle. Players relying on those settings have to back out to the hub and back into the game.

---

## Recommendations (priority-ordered)

1. **HIGH · Collapse the two May-2026 callouts** (`#whatsNewCallout` "9 new" + `#round3Callout` "16 new") into a single banner. Two near-identical bands with different counts read as a CMS bug. **Effort**: 30 min · 1 file (`index.html`).

2. **MED · Move "Launch paths" higher** in the band cascade, above Smart Study Tools. New players need pathways before optimization tools. **Effort**: 15 min · 1 file.

3. **MED · Soften the welcome dialog.** Default-active "Enter the Arcade" button (no required name) with a soft "Want to save your progress? Tell us your name" sub-prompt. Skip flow becomes the primary path for casuals; full setup becomes opt-in. **Effort**: 1 hr · `index.html` + welcome JS.

4. **MED · Fix static "Sound On" labels across 10 games.** Should reflect current state. **Effort**: 1 hr · 10 game `index.html` files (or one shared script).

5. **MED · Rename `lives` in non-traditional games** (Archive Tycoon, Plinko Lab, Atlas 2048, Citadel) to genre-correct terms ("attempts," "balls," "tries," etc.). **Effort**: 30 min · 4 game `index.html` files.

6. **MED · Add `+50 💎` payout chip to Daily Challenge CTA.** Currently no reward visible without taking the hub tour. **Effort**: 10 min · 1 file.

7. **MED · Add "How to Play" interactive overlay** for Knight's Quest, Atlas 2048, and Sokoban Scribe (the three highest-mechanic-density games). Reuse `arcade-tour.js` infrastructure. **Effort**: 4 hr · 3 files.

8. **LOW · Add achievement-unlock recap to the end screen.** "🏆 Unlocked this run: [list]" at the top of `end-grid`. **Effort**: 2 hr · per-game `game.js` plus shared template.

9. **LOW · Add "Newest" sort option to library.** Players who land after a "Round 3 Mega Drop" callout will want to see the new stuff first. **Effort**: 30 min · 1 file.

10. **LOW · Add a "Back to Arcade" button to game setup screens** so first-time players who land on a game by mistake have an obvious escape hatch before clicking Insert Coin. **Effort**: 30 min · 10 game files (or template).

---

## Summary

**Total friction points found**: 30 across 11 surfaces (1 hub + 10 games).
**Severity distribution**: 1 HIGH · 11 MED · 18 LOW.
**Headline**: The arcade is exceptionally polished — consistent five-screen game template, accessibility settings, keyboard shortcuts, profile persistence, and resume cards across all 10 flagships. The biggest single UX miss is the **double "May 2026 new releases" banner** (one says 9, one says 16) which reads as a content bug and is fixable in 30 minutes. Second-biggest is **the welcome dialog gating new visitors behind a name input** — a casual TPT preview visitor will bounce. Third tier is **genre-mismatched HUD vocabulary** (lives on idle clickers, lives on Plinko) and **dense paragraph setup copy with no interactive tutorial**. Everything else is polish — and the polish baseline is already very high.
