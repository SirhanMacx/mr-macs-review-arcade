# Arcade API Reference

Every shared module exposes a single `window.MrMacs*` global. All modules are
local-only — no telemetry, no remote sync, no logins. APIs are stable contracts;
games depend on them by name.

Load order (in `index.html`):

```
arcade-analytics.js   → window.MrMacsAnalytics, window.MrMacsProgress
arcade-profile.js     → window.MrMacsProfile
arcade-perf.js        → window.MrMacsArcadePerf
arcade-tour.js        → window.MrMacsArcadeTour
arcade-icons.js       → window.MrMacsIcons
arcade-toast.js       → window.MrMacsToast
arcade-celebration.js → window.MrMacsCelebration
arcade-progress-extras.js → window.MrMacsLeaderboards, window.MrMacsSessions, window.MrMacsProgressExtras
source-bank.js        → window.MrMacsSourceBank
mastery-engine.js     → window.MrMacsMastery
```

`document-viewer.js` is loaded by individual game pages where stimulus zoom is
needed; it self-installs via a MutationObserver and exposes
`window.MrMacsDocumentViewer`. `arcade-music.js` is loaded by individual games
that opt in to music and exposes `window.MrMacsArcadeMusic`.

---

## `MrMacsProfile`

Player identity, wallet, achievements, settings, multi-profile roster.
Backed by `localStorage` key `mr-macs-arcade-roster-v1`. Emits events through
an `EventTarget` accessed via `.on(name, handler)` / `.off(name, handler)`.

### Identity

| Method | Returns | Description |
| --- | --- | --- |
| `get()` | `Object` | Deep clone of the active profile. |
| `set(partial)` | `Object` | Shallow-merges `partial` into active profile. Emits `profile:update`. |
| `exists()` | `boolean` | True once a name has been set and `createdAt` is non-zero. |
| `reset()` | `Object` | Wipes the active profile to defaults. |
| `getName()` | `string` | |
| `setName(str)` | `string` | First call also stamps `createdAt` and emits `profile:create`. |
| `getAvatar()` | `{ value, kind }` | `kind` is `"emoji"` (default) or `"url"`. |
| `setAvatar(value, kind)` | `string` | |
| `getCourse()` | `string` | Empty string = "all courses". |
| `setCourse(name)` | `string` | Emits `course:change` if value changes. |
| `getTestPrep()` | `{ date, name }` | ISO `YYYY-MM-DD` date in local time. |
| `setTestPrep({ date, name })` | `Object` | Both fields optional. Emits `testprep:change`. |

### Wallet (shards)

| Method | Returns | Description |
| --- | --- | --- |
| `getShards()` | `number` | |
| `addShards(n, source)` | `number` | New total. Lucky Charm and Coin Doubler buffs auto-stack on positive deltas. Source marker `"...scholar...correct..."` (lowercase substring) bumps the cross-game scholar counter. Emits `wallet:change`. |
| `spendShards(n, source)` | `boolean` | False if insufficient. Emits `wallet:change`. |

### Power-up shop

| Method | Returns | Description |
| --- | --- | --- |
| `SHOP_ITEMS` | `Object` | Catalog: `streakShield`, `hintTokens`, `timeBoosts`, `luckyCharm`, `fortuneRefresh`, `dailyDouble`, `coinDoubler`. Each entry: `{ cost, label, icon, desc }`. |
| `getInventory()` | `Object` | `{ streakShield, hintTokens, timeBoosts, fortuneRefresh, dailyDouble, luckyCharmExpiresAt, luckyCharmActive, coinDoublerExpiresAt, coinDoublerActive }`. |
| `buyItem(itemId)` | `{ ok, reason?, inventory? }` | Bypasses lucky-charm doubling on the spend; emits `wallet:change` + `inventory:change`. |
| `consumeItem(itemId)` | `number` | New count for non-timed items. Emits `inventory:change`. |

### Achievements

| Method | Returns | Description |
| --- | --- | --- |
| `ACHIEVEMENTS` | `Array` | 65 definitions. Each: `{ id, title, desc, tier, icon }`. Tiers: `bronze`, `silver`, `gold`, `legendary`. |
| `unlock(id, extra?)` | `{ alreadyUnlocked, newAchievement }` | Idempotent. Emits `achievement:unlock` only on first unlock. |
| `bumpAchievement(id, by?)` | `number` | New count. Used for "play N of X"-style achievements; auto-creates entry if missing. |
| `hasAchievement(id)` | `boolean` | |
| `listAchievements()` | `Array` | All 65 with `{ id, def, unlocked, unlockedAt, count }`. |

### Plays + streak

| Method | Returns | Description |
| --- | --- | --- |
| `recordPlay({ id, title, course, file })` | `Object` | Updates `recentGames` (cap 8), `lastVisit`, streak (with Streak Shield consumption on gap > 1), per-game stats, weekend-warrior tracker, time-of-day Early Bird, distinct-genre achievements (3/7/12), 100-plays achievement. Emits `streak:advance` and `profile:update`. |
| `recordCompletion(gameId, score)` | `Object` | Increments `completions`, raises `bestScore`. |
| `getRecent(limit?)` | `Array` | Default limit 4. |
| `getStreak()` | `{ current, best, lastDay }` | |

### Daily Challenge

| Method | Returns | Description |
| --- | --- | --- |
| `getDailyChallengeState()` | `{ lastClaimedDay, completedCount, claimedToday }` | |
| `claimDailyChallenge({ gameId, payout? })` | `{ ok, payout, doubled, completedCount }` or `{ ok: false, reason: "already-claimed" }` | Default payout 60. Consumes one Daily Double if held (doubles before payout). Triggers Lucky Charm + Coin Doubler stacks. Emits `daily:claim`. |

### Scholar prompts

| Method | Returns | Description |
| --- | --- | --- |
| `recordScholarCorrect(gameId)` | `number` | New scholarCorrect count. Auto-fires `scholar-decoder` achievement at 50. Most games don't need to call this directly — `addShards` auto-detects scholar sources. |

### Topic stats + spaced-repetition wrong-answer queue

| Method | Returns | Description |
| --- | --- | --- |
| `recordAnswer({ course, set, correct, prompt, answer, gameId })` | `{ correct, total }` | Updates per-course, per-unit topic stats; appends to wrong-answer queue (cap 80) with SR fields if `correct === false`. Emits `answer:record`. |
| `getTopicStats(course?)` | `Object` | All courses if no arg, else single course's `{ unit: { correct, total, lastSeen } }`. |
| `getWrongQueue(limit?)` | `Array` | Default 10. |
| `getDueWrongAnswers(limit?)` | `Array` | Only entries with `nextShowAt <= now` (or legacy entries with no `nextShowAt`). |
| `gradeWrongAnswer(prompt, recall)` | `{ boxLevel, retired, lapses }` or `null` | SR Leitner box advance. Box → next-show interval: 1=1d, 2=3d, 3=7d, 4=14d, 5=mastered (retired to `masteredCards` archive, cap 200). |
| `removeWrongAnswer(prompt)` | `number` | New queue length. |
| `clearWrongQueue()` | `void` | |
| `getMasteredCards(limit?)` | `Array` | Default 50. |

### Tour bookkeeping

| Method | Returns | Description |
| --- | --- | --- |
| `hasSeenTour(gameId)` | `boolean` | |
| `markTourSeen(gameId)` | `true` | |
| `resetTour(gameId?)` | `void` | Omit gameId to reset all. |

### Cram + diagnostic + mock exam history

| Method | Returns | Description |
| --- | --- | --- |
| `recordCramRun(entry)` | `void` | Cap 24 entries. |
| `getCramHistory()` | `Array` | |
| `setDiagnostic(results)` | `void` | |
| `getDiagnostic()` | `Object` or `null` | |
| `recordMockExam({ course, total, correct, count, durationMs, takenAt, weakUnits })` | `Object` | Cap 10 entries. |
| `getMockExamHistory(limit?)` | `Array` | Default 10. |

### Settings

| Method | Returns | Description |
| --- | --- | --- |
| `getSettings()` | `Object` | `{ motion, sound, musicVolume, sfxVolume, fontFamily, colorblind, contrast }`. |
| `setSettings(partial)` | `Object` | Emits `settings:change`. First call also unlocks `settings-tuned`. |

### Multi-profile roster

| Method | Returns | Description |
| --- | --- | --- |
| `roster.list()` | `Array` | Compact summaries `{ id, isActive, name, avatar, avatarKind, course, shards, streak, lastVisit, createdAt }`, active first. |
| `roster.getActiveId()` | `string` | |
| `roster.create({ name?, avatar?, course? })` | `string` | New id. Switches to it. Emits `roster:change`. |
| `roster.switch(id)` | `boolean` | |
| `roster.remove(id)` | `boolean` | Refuses to delete active. |
| `roster.rename(id, newName)` | `boolean` | |
| `roster.count()` | `number` | |

### Events

Subscribe via `MrMacsProfile.on(name, handler)` / unsubscribe via `.off(...)`.
Handlers receive a `CustomEvent` with `event.detail`.

| Event | `detail` |
| --- | --- |
| `profile:update` | `{ profile }` |
| `profile:create` | `{ profile }` (first-time setup only) |
| `wallet:change` | `{ delta, total, source, lucky?, doubler? }` |
| `achievement:unlock` | `{ id, def, unlockedAt }` |
| `settings:change` | `{ settings }` |
| `streak:advance` | `{ current, best, shieldUsed }` |
| `course:change` | `{ course, previous }` |
| `testprep:change` | `{ date, name }` |
| `inventory:change` | `{ item, source, inventory }` |
| `daily:claim` | `{ gameId, payout, doubled }` |
| `answer:record` | `{ course, set, correct }` |
| `roster:change` | `{ activeId, list }` |

### Constants

- `AVATARS` — 24 suggested emoji avatars `{ id, emoji, label }`.
- `DEFAULT_SETTINGS` — `{ motion: "auto", sound: "on", musicVolume: 0.55, sfxVolume: 0.75, fontFamily: "default", colorblind: "off", contrast: "normal" }`.

---

## `MrMacsLeaderboards`

Per-game local top-5 leaderboards. Backed by `localStorage` key
`mr-macs-arcade-leaderboards-v1`. Defined in `arcade-progress-extras.js`.

| Method | Returns | Description |
| --- | --- | --- |
| `submit(gameId, score, meta?)` | `{ rank, isNewRecord, displaced }` or `null` | Returns `null` if score doesn't crack the top 5. Decorated with current profile name + avatar at submit time so renames don't rewrite history. |
| `top(gameId, limit?)` | `Array` | `[{ score, name, avatar, ts, meta }]`. Default limit 5, capped at 5. |
| `best(gameId, playerName)` | `{ score, ts, meta }` or `null` | |
| `clearAll()` | `void` | Wipes every game's board. |
| `topScoresForPlayer(playerName, gameTitleLookup?)` | `Array` | Best-3 across all games with `{ gameId, title, score, ts, rank }`. Hub helper. |
| `renderDrawerTopScores(gameTitleLookup)` | `void` | Renders a Top Scores section into the profile drawer. Hub helper. |

---

## `MrMacsSessions`

Auto-resume snapshots, capped at 12 most-recent across the device, 7-day TTL.
Defined in `arcade-progress-extras.js` (active in the hub). A standalone
elaborate alternative exists in `assets/arcade-sessions.js` but is **not**
loaded by `index.html` — flagship games rely on the progress-extras version.

| Method | Returns | Description |
| --- | --- | --- |
| `save(gameId, state)` | `void` | State must be JSON-serializable. Probed once before write. |
| `load(gameId)` | `{ state, ts }` or `null` | Auto-prunes entries older than 7 days on every read. |
| `clear(gameId)` | `void` | |
| `listAll(maxAgeMs?)` | `Array` | `[{ gameId, state, ts }]`, most recent first. Default max age 7 days. |
| `decorateContinueCards(scope?)` | `void` | Adds a "Resume" pill to any `.continue-card[data-id]` whose game has a saved session. Hub helper, idempotent. |

### Standalone `arcade-sessions.js` (currently unloaded)

This file defines a richer profile-aware envelope (versioned, TTL-configurable,
quota-safe with prune-and-retry) but is **not** wired into `index.html`. If
you need it, add `<script src="assets/arcade-sessions.js"></script>` before
`arcade-progress-extras.js` so its `MrMacsSessions` global wins. Its public
API: `save(gameId, snapshot, opts?)`, `load`, `clear`, `clearAllForProfile`,
`listActive`, `decorateContinueCards`, `on`, `off`. See file header for full
contract.

---

## `MrMacsArcadeMusic`

Web Audio engine. 16 themes registered:
`pinball-cabinet`, `cold-war-mission`, `td-strategic`, `empire-strategic`,
`runner-synthwave`, `rift-survivors`, `duel-arena`, `boss-rush-arena`,
`maze-cabinet`, `archive-dusk`, `quill-runner`, `boss-overture`, plus per-game
variants. No sub-bass drones; every theme is a chord progression + bass +
synthesized drums + melodic motif. Persists user volume to `localStorage`
under `mr-macs-arcade-music-volume`. Suspends on `document.hidden`, resumes
on visibility return.

### Lifecycle

| Method | Returns | Description |
| --- | --- | --- |
| `start(themeId, opts?)` | `void` | Requires user gesture to unlock the AudioContext. If suspended, queued for the next gesture. |
| `stop()` | `void` | Fades + stops. |
| `crossfade(toThemeId, ms?)` | `void` | Smooth cross-fade between themes. |

### Mix

| Method | Returns | Description |
| --- | --- | --- |
| `duck(level, ms?)` | `void` | Attenuate during battles / dialogs. |
| `restore(ms?)` | `void` | Unduck. |
| `setVolume(0..1)` | `void` | Persists across themes. |
| `setMaster(0..1)` | `void` | Alias for `setVolume`. |
| `setMasterVolume(0..1)` | `void` | Legacy alias. |
| `setMuted(bool)` | `void` | Hard mute. |
| `tempoMod(rate)` | `void` | 1.0 default; e.g. 1.5 = 50% faster. |

### Introspection

| Method | Returns |
| --- | --- |
| `isPlaying()` | `boolean` |
| `currentTheme()` | `string` or `null` |
| `themeNames()` | `string[]` |
| `list()` | `string[]` (legacy alias) |
| `THEMES` | `Object` (theme registry) |
| `on(handler)` | Subscribe to `("start" \| "stop" \| "crossfade", themeId)` |

Auto-syncs with `MrMacsProfile.getSettings().musicVolume` and `.sound` on
boot, and listens for `settings:change`.

---

## `MrMacsCelebration`

Canvas particle bursts. Editorial palette (gold / cyan / magenta / indigo /
coral). Auto-listens to `MrMacsProfile.on("achievement:unlock")` and
`profile:create`. Respects `prefers-reduced-motion` (falls back to soft pulses
+ emoji floats).

### Bursts

| Method | Returns | Description |
| --- | --- | --- |
| `burst(opts)` | `void` | `opts: { x, y, count, palette, gravity, life, vScale, shapes, spread, upwardBias, withSound }` |
| `burstFromElement(el, opts?)` | `void` | Origin = element center. |
| `fromAchievement(def, opts?)` | `void` | Tier-themed palette + size. Auto-called on every `achievement:unlock`. |

### Variants (Polish v2)

| Method | Description |
| --- | --- |
| `confetti(opts?)` | Wide spread, no upward bias, mixed shapes. |
| `fireworks(x, y, opts?)` | Multi-stage radial burst with secondaries. |
| `coinShower(opts?)` | Gold-only shower from top of viewport. |
| `streamers(opts?)` | Diagonal ribbon trails from top corners. |
| `tierUp(tierName, opts?)` | Tier-named palette + larger burst. |
| `fromShardPayout(amount, opts?)` | Auto-routes by amount magnitude. |

### Controls

| Method | Returns | Description |
| --- | --- | --- |
| `clear()` | `void` | Instantly remove all particles. |
| `pause()` / `resume()` | `void` | Pause animation w/o removing particles. |
| `setPalette(arr)` | `void` | Override default palette. |
| `getActiveCount()` | `number` | Current particle count. |

---

## `MrMacsToast`

Ephemeral bottom-right notifications. Vanilla DOM, role="status" (or "alert"
for warn/error). Dedup: same title+tone within 2s bumps an `×N` badge. Cap 4
visible, oldest non-sticky shoved off when over.

### Push

| Method | Returns | Description |
| --- | --- | --- |
| `push({ icon, title, sub, tone, ms, action, sticky, withSound })` | `Object` | Returns the toast entry. `action: { label, onClick }` adds a button. |
| `shards(amount, source)` | `Object` | Convenience for `+N shards · source`. |
| `shardEarned(amount, source)` | `Object` | Polish v2 alias. |
| `achievement(def)` | `Object` | Convenience. |
| `dismiss(id)` | `void` | Accepts numeric id or the entry object. |
| `dismissAll()` | `void` | |
| `getActiveCount()` | `number` | |

### Tones

`default | shards | achievement | streak | error | info | warn | levelup`.
`error` and `warn` use `role="alert"` and `aria-live="assertive"`; everything
else uses `role="status"` with `aria-live="polite"`.

### Auto-wired listeners

- `profile:create` → "Welcome, `<name>`"
- `wallet:change` (delta > 0) → "+N shards · source"
- `achievement:unlock` → "`<title>` unlocked"
- `streak:advance` (n ≥ 2) → "n-day streak — keep it going tomorrow"

---

## `MrMacsIcons`

Monoline 24×24 SVG icon library. Inherits color via `currentColor`. 1.6px
stroke, square caps, miter joins. Pairs with the editorial Fraunces / Inter /
JetBrains Mono ladder.

| Method | Returns | Description |
| --- | --- | --- |
| `svg(name)` | `string` | Full `<svg>…</svg>` string. |
| `fromEmoji(emoji)` | `string` | Same string for any mapped emoji (`🔥` → flame, etc.). |
| `has(name)` | `boolean` | |
| `list()` | `string[]` | All registered icon names. |
| `listEmoji()` | `string[]` | All mapped emoji. |
| `expandEmojiInString(s)` | `string` | Replaces every mapped emoji in a string with its SVG. |
| `REGISTRY` | `Object` | `{ name: innerPathMarkup }`. |
| `EMOJI_MAP` | `Object` | `{ emoji: name }`. |

Common icons: `cap, target, shuffle, trophy, diamond, bars, pin, books, memo,
flame, mind, pulse, bolt, swords, spark, crown, rocket, library, atom,
explorer, sage, compass, phoenix, bookworm, heart-pulse, help, close,
arrow-right, star, globe, calendar, scroll, wizard, owl, fox, lion, dragon,
sparkles, plus more`.

---

## `MrMacsProgressExtras`

Reusable HUD widgets. Defined alongside `MrMacsLeaderboards` /
`MrMacsSessions` in `arcade-progress-extras.js`. All renderers mutate the
provided container's `innerHTML` and return the root element they wrote.
Idempotent and safe to re-call with new values.

| Method | Returns | Description |
| --- | --- | --- |
| `renderMiniHud(container, opts?)` | `Element` or `null` | Pill with shards + streak. `opts: { shards, streak, showShards, showStreak, shardsIcon, streakIcon }`. |
| `renderScoreChip(value, prevValue, container, opts?)` | `Element` or `null` | Tweens from `prevValue` to `value` over `opts.durationMs` (default 600). Bumps on increase. |
| `renderBestBadge(gameId, container, opts?)` | `Element` or `null` | Reads from `MrMacsLeaderboards.best`. `opts: { playerName, icon }`. |
| `renderStreakMeter(container, opts?)` | `Element` or `null` | 7-cell weekly grid with current + best counts. `opts: { current, best, weekDays, todayIdx }`. |
| `renderRunSummary(container, payload)` | `Element` or `null` | Grid card. `payload: { gameId, score, level, durationMs, scholarHits, accuracy, combo, extras }`. |
| `formatNumber(n)` | `string` | Locale-aware. |
| `formatDuration(ms)` | `string` | `Hh Mm` / `Mm Ss` / `Ss` |
| `prefersReducedMotion()` | `boolean` | |
| `injectStyles()` | `void` | Idempotent. Auto-called on init. |

---

## `MrMacsArcadeTour`

First-run tour. Reads `MrMacsProfile.hasSeenTour` / `markTourSeen`. Each game
calls `start(gameId, steps)` once on boot — if the user has seen this
gameId's tour or has `prefers-reduced-motion`, the call is a no-op.

| Method | Returns | Description |
| --- | --- | --- |
| `start(gameId, steps, opts?)` | `boolean` | False if no-op (already seen, no steps). `opts.force = true` overrides the seen check (used by Replay-tour buttons). |
| `close(markSeen?)` | `void` | |
| `offerReplay(gameId, steps)` | `Function` | Returns a click handler the host can wire into a "Replay tour" button. |

### Step shape

```js
{
  target: "#elementId" | DOMElement | null, // null = centered modal
  title: "Heading",
  body: "1-2 sentence explanation",
  placement: "auto" | "top" | "bottom" | "left" | "right" | "center"
}
```

Skip / × dismisses the tour and marks it seen. Got it / Next advances. Last
step button reads "Finish".

---

## `MrMacsAnalytics`

Anonymous traffic counter. **No names, no answers, no rosters.** Backs to
`localStorage` for local fallback and `countapi.mileshilliard.com` for
anonymous public totals. Detects `localhost` / `127.0.0.1` / `file:` and
disables remote calls automatically.

| Method | Returns | Description |
| --- | --- | --- |
| `track(type, detail?, options?)` | `Promise` | Types: `pageview`, `engaged_session`, `game_view`, `game_play`, `game_launch`, `game_complete`. Auto-extracts `gameId` from path on `/games/<id>/` pages. |
| `refresh()` | `Promise` | Refreshes global cached counts; renders into any DOM elements with `[data-counter]`. |
| `render()` | `void` | Re-renders cached counts only. |
| `stats()` | `Object` | Local-only stats shape. |
| `device()` | `string` | `"desktop" \| "tablet" \| "mobile"`. |

Counter prefix: `mr-macs-review-arcade-v1`. Sample keys:

- `site-visits`, `engaged-sessions`, `game-launches`, `game-plays`, `game-views`, `game-completions`
- `daily-YYYY-MM-DD-site-visits`
- `game-history-hunters-game-plays`
- `course-grade-10-global-history-ii-game-plays`

The hub also defines `window.MrMacsProgress` (in `arcade-analytics.js`) for
per-event progress tracking + course-focus / weakest-topic recommendations:
`recordEvent`, `read`, `summary`, `courseFocus`, `clear`, `clearAllLocalPractice`.

---

## `MrMacsArcadePerf`

Lite-mode detection + perf primitives.

| Method | Returns | Description |
| --- | --- | --- |
| `isLite()` | `boolean` | True if any of: `prefers-reduced-motion`, profile motion=`"reduce"`, `deviceMemory < 4`, `hardwareConcurrency <= 2`, manual lite toggle. |
| `refresh()` | `boolean` | Re-evaluates and notifies `onChange` listeners. |
| `onChange(handler)` | `void` | `handler(isLite)` called when lite-mode flips. |
| `offChange(handler)` | `void` | |
| `now()` | `number` | `performance.now()` with safe fallback. |
| `mark(label)` | `number` | Records a timestamp. |
| `measure(label, fromMark)` | `number` | Returns ms since `fromMark`. |
| `clearMarks(label?)` | `void` | Omit label to clear all. |
| `withFrame(fn)` | `Promise` | Runs `fn` inside `requestAnimationFrame` and resolves with its return. |
| `idleCallback(fn, opts?)` | `handle` | `requestIdleCallback` with `setTimeout` fallback. |
| `cancelIdle(handle)` | `void` | |
| `memoryUsage()` | `Object` | `{ used, total, limit, available }` from `performance.memory` if exposed. |

Applies body classes `.arcade-lite` and `.arcade-reduced-motion` for CSS gating.

---

## `MrMacsMastery`

Mastery dashboard logic. Course profiles, diagnostic builder, weakest-topic
recommender. Backed by `localStorage` key `mr-macs-review-arcade-v1:mastery-path`.

| Method | Returns | Description |
| --- | --- | --- |
| `COURSES` | `Array` | 17 course profiles `{ id, label, short, level, family, exam, writing, regents?, skills }`. |
| `SKILL_LABELS` | `Object` | Slug → display label. |
| `slug(value)`, `norm(value)`, `esc(value)`, `shuffle(arr)`, `uniq(arr)` | various | Utilities. |
| `courseProfile(courseName)` | `Object` | Falls back to Global 10 if no match. |
| `courseOptions()` | `Array` | `[{ value, label }]` for `<select>` population. |
| `loadArcadeData()` | `Promise<Object>` | Fetches games.json + question bank. |
| `questionPool(data, courseLabel)` | `{ regents, review, all }` | |
| `buildDiagnostic(data, course, count?)` | `Object` | 12-question by default. |
| `evaluateDiagnostic(diagnostic, responses)` | `Object` | Per-skill / weak-unit results. |
| `sourceLabQuestions(data, course)` | `Array` | Source-bound questions only. |
| `writingDocs(data, course)` | `Array` | |
| `nextActions(data, course, mastery)` | `Array` | |
| `readMastery()` / `writeMastery(data)` | `Object` / `void` | |
| `recordSession(detail)` | `Object` | Forwards to `MrMacsAnalytics.track("game_complete")` if available. |
| `courseSummary(games, data, course)` | `Object` | `{ profile, games, jeopardy, sourceQuestions, reviewQuestions, fullPractice }`. |
| `getMasteryFor(course, set)` | `Object` | `{ score, attempts, mastery, ... }`. |
| `getWeakestTopics(course, count?)` | `Array` | Lowest-scoring topics first. |
| `getRecommendation(course)` | `{ topic, course, score, mastery, reason }` | |
| `masteryLabel(score, attempts)` | `string` | `novice \| practicing \| proficient \| mastered`. |
| `setThresholds(overrides)` | `Object` | Defaults: novice 40, practicing 70, proficient 90, masteryAttempts 10, recentWindow 12. |
| `thresholds()` | `Object` | Current thresholds. |

Also re-exports `trustedSource`, `sourceLock`, `sourceBased` from `MrMacsSourceBank`.

---

## `MrMacsSourceBank`

Source-based question detector + curated bank registry. Used by every flagship
that surfaces stimulus images.

| Method | Returns | Description |
| --- | --- | --- |
| `sourceBased(question)` | `boolean` | True if has stimulus image, `stimulusRequired === true`, or text matches the source-reference regex. |
| `hasStimulusImages(question)` | `boolean` | |
| `trustedSource(question)` | `boolean` | All of: not quarantined, has stimulus image, course matches stimulus path, has trusted integrity flag. |
| `usableRegentsQuestion(question)` | `boolean` | True if not quarantined and (not source-based OR is trusted source). |
| `missingSourceReason(question)` | `string` | Human reason a source-based question can't be used; empty string if usable. |
| `sourceLock(question)` | `{ ok, reason? }` | |
| `sourceLockLabel(question)` | `string` | |
| `sourceIdentity(question)` | `string` | |
| `answerText(question)` | `string` | |
| `promptQuality(question)` | `string` | |
| `playableSharedPrompt(question)` | `boolean` | |
| `displayPrompt(question)`, `displaySource(question)`, `displayStimulusLabel(question)` | `string` | |
| `registerRecords(records)` | `void` | Curated bank registration. |
| `lookup(id)` | `Object` or `null` | |
| `searchByTag(tag)` | `Array` | |
| `getAllForCourse(course)` | `Array` | |
| `bankSize()` | `number` | |
| `isRegistered(id)` | `boolean` | |
| `stableId(question)` | `string` | |
| `recordTags(record)` | `string[]` | |

---

## `MrMacsDocumentViewer`

Click-to-expand zoomable image viewer for stimulus documents. Self-installs
via a `MutationObserver` and adds an "Expand Source" button next to every
matching `<img>`. Loaded by individual game pages, not the hub.

Selectors auto-enhanced:
`img[src*='regents-gauntlet-stimuli']`, `img[src*='regents-released-forms']`,
`img[src*='ap-released-forms']`, `img[data-source-img]`, `img[data-source-page-img]`,
`.official-page-image`, `.source-image`, `.source-panel img`, `.quest-source img`,
`.doc-card img`, `.stimulus-grid img`, `.stimulus-row img`, `.stimulus-strip img`,
`.stimulus-box img`, `.intel-source-thumb img`, `#sourceImage`.

| Method | Returns | Description |
| --- | --- | --- |
| `enhance()` | `void` | Re-scan + add Expand buttons. Idempotent. |
| `openForImage(img)` | `void` | Open the viewer focused on this image. |
| `close()` | `void` | |
| `setZoom(value)` | `void` | Clamped 0.5..3.0. |
| `setZoomPreset(percent)` | `void` | E.g. `setZoomPreset(150)` for 1.5x. |
| `toggleFullscreen()` | `void` | |
| `next()` / `prev()` | `void` | Cycles through all enhanced images on the page. |
| `state()` | `Object` | `{ open, index, zoom, fullscreen, total }`. |
| `zoomPresets` | `number[]` | `[0.5, 0.75, 1, 1.25, 1.5]`. |

Keyboard inside viewer: `+/-` zoom, arrows nav, `F` fullscreen, `0` fit, `Esc` close.
Tab focus is trapped inside the viewer for accessibility.

---

## TBD

- **Server-side leaderboards** — currently every leaderboard is local-only.
  Hosted leaderboards would need a privacy-reviewed backend.
- **`MrMacsArcade` global** — there is no top-level wrapper; games access each
  module by its own global. A façade could be added later if useful.
- **Settings drawer programmatic API** — settings are currently only
  modifiable via the profile drawer UI; a `MrMacsProfile.openSettings()`
  helper is TBD.
