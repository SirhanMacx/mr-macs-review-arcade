# Arcade Analytics — Reference

Mr. Mac's Review Arcade is a static HTML PWA. There's no backend, but we still
need accurate traffic + engagement metrics so Jon can answer two questions:
"Are students actually using this?" and "Which courses are they using it for?"

This doc maps the entire analytics pipeline: every event type, every storage
key, where to view the data, and what's intentionally NOT collected.

---

## 1 · What's tracked

Five canonical event types (defined in `assets/arcade-analytics.js`):

| Event                            | When it fires                                                                                          | Counter API key                                |
|----------------------------------|--------------------------------------------------------------------------------------------------------|------------------------------------------------|
| `pageview`                       | DOMContentLoaded on any HTML page                                                                      | `site-visits`                                  |
| `engaged_session`                | 20s after DOMContentLoaded (one per page, gated by `sessionStorage`)                                   | `engaged-sessions`                             |
| `game_view`                      | DOMContentLoaded on any `/games/...` URL                                                               | `game-views`                                   |
| `game_launch`                    | Hub `openGame()` called (student clicks a card)                                                        | `game-launches`                                |
| `game_play`                      | 25s inside a game page (one-time per session)                                                          | `game-plays`                                   |
| `game_complete`                  | Game finished — fired by per-game JS (`MrMacsAnalytics.track("game_complete", …)`)                     | `game-completions`                             |

Plus three **practice-exam-specific** events emitted by the auto-instrumentation
layer (`assets/arcade-practice-exam-analytics.js`). They fire on every
`practice-exam.html` and on the umbrella regents/AP-practice-exam pages:

| Event                            | When it fires                                                                                         | Counter API key                                |
|----------------------------------|-------------------------------------------------------------------------------------------------------|------------------------------------------------|
| `practice_exam_start`            | Student clicks "Begin Exam" / "Start"                                                                 | `practice-exam-starts`                         |
| `practice_exam_question_answered`| Student clicks any `.exam-choice` button (payload includes topic + correctness + elapsedMs)           | `practice-exam-questions-answered`             |
| `practice_exam_finish`           | `.exam-results .grand-score` appears (results screen rendered)                                        | `practice-exam-finishes`                       |

For every event the counter API ALSO bumps a per-day counter
(`daily-YYYY-MM-DD-<base>`), and for game events it bumps a per-game counter
(`game-<gameId>-<base>`). The full set of counters for a single completion is
roughly: `game-completions`, `daily-YYYY-MM-DD-game-completions`,
`game-<id>-game-completions`, `course-<slug>-game-completions`,
`type-<slug>-game-completions`.

### Coverage

| Surface category                | Count | Has base analytics | Has practice-exam wrapper |
|---------------------------------|-------|--------------------|---------------------------|
| Course landing pages            | 79    | ✓ 79/79            | n/a                       |
| Per-course practice exams       | 52    | ✓ 52/52            | ✓ 52/52                   |
| Jeopardy boards + flagship games| 51    | ✓ 51/51            | n/a                       |
| **Total HTML game surfaces**    | **182** | **✓ 182/182**    | **✓ 52/52**               |

The hub (`index.html`) and the teacher dashboard (`teacher/index.html`) also
load the base analytics module. The new admin dashboard at `analytics/index.html`
loads it explicitly too.

---

## 2 · Where the data lives

### Public counter (lifetime + daily aggregates)

```
https://countapi.mileshilliard.com/api/v1/get/mr-macs-review-arcade-v1-<key>
```

Live as of May 22 2026:

- `mr-macs-review-arcade-v1-site-visits` = 3,811
- `mr-macs-review-arcade-v1-engaged-sessions` = 1,853
- `mr-macs-review-arcade-v1-game-launches` = 1,534
- `mr-macs-review-arcade-v1-game-completions` = 202

You can probe any counter directly: replace `<key>` with the slug from the
table above (e.g. `game-regents-practice-exam-game-completions`).

### Local device storage (per-tab + per-device)

Five `localStorage` keys under the namespace `mr-macs-review-arcade-v1:*`:

| Key                                                | Holds                                                                                                            |
|----------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `mr-macs-review-arcade-v1:local-traffic`           | All-time totals + per-game / per-course / per-day breakdown                                                      |
| `mr-macs-review-arcade-v1:public-traffic-cache`    | Last snapshot of the public counter (so the hub renders numbers offline)                                         |
| `mr-macs-review-arcade-v1:event-log`               | Rolling 200-event log (FIFO). Each entry: `{ type, at, detail, session, device }`                                |
| `mr-macs-review-arcade-v1:student-progress`        | Per-game completions + weak topics + course focus (used by recommender + heatmap)                                |
| `mr-macs-review-arcade-v1:debug`                   | `"1"` if `MrMacsAnalytics.setDebug(true)` was called                                                              |

Plus `sessionStorage` key `mr-macs-review-arcade-v1:session-id` (tab-scoped UUID).

The per-game profile system (`assets/arcade-profile.js`) writes its own keys
under `mr-macs-arcade-profile-v1` / `mr-macs-arcade-roster-v1`. Those are
separate from the analytics state above.

---

## 3 · How Jon views the metrics

### A. Admin dashboard (recommended)

```
https://sirhanmacx.github.io/mr-macs-review-arcade/analytics/?admin=mrmac-arcade-admin-2026
```

Bookmark this URL. It surfaces:

- All six top-line totals (page views, engaged sessions, launches, plays, completes, completion %)
- Public counter values (lifetime + today's) with a "live / cached" status pill
- Per-game table — sortable by launches, completions, or completion percentage
- Recent event feed (last 80 events that fired in this tab)
- Device + session breakdown (mobile / tablet / desktop hits)
- Raw JSON export (downloads a snapshot)
- Reset / refresh / log-out buttons

The token (`mrmac-arcade-admin-2026`) follows the same pattern as the
leaderboard admin in `assets/arcade-leaderboards.js`. It's intentionally
embedded in client code — this is a teacher-tool gate, not bank-grade auth.
Rotate by editing both files when needed.

### B. Console helper (any page)

Open DevTools on any arcade URL and run:

```js
MrMacsAnalytics.viewMetrics()
```

That prints a per-game `console.table` showing launches / plays / completes / %
plus the totals row. Returns the full summary object for further inspection.

### C. Direct counter probes

```bash
curl -s https://countapi.mileshilliard.com/api/v1/get/mr-macs-review-arcade-v1-site-visits
```

Useful for scripting / health checks.

---

## 4 · How to reset or export

### Console (this device)

```js
MrMacsAnalytics.exportMetrics()     // returns a JSON string
MrMacsAnalytics.resetMetrics()      // wipes the local event log + counters
MrMacsProgress.clearAllLocalPractice()  // wipes per-game progress too
```

### Admin dashboard

- "Download JSON" downloads a full snapshot of local stats + event log + public cache
- "Reset local stats" wipes the local event log + counters (does NOT touch the public counter or student profiles)
- "Refresh public counters" re-hits `countapi.mileshilliard.com` and re-renders

### Public counters

The public counter at `countapi.mileshilliard.com` is append-only — it can't
be reset from the client. Counters increment with every event from every
device. If a counter ever gets visibly polluted (e.g. a bot mass-hitting it),
contact the counterapi maintainer or rotate the namespace prefix (`PREFIX`
constant in `arcade-analytics.js`).

---

## 5 · Privacy boundary — what's intentionally NOT tracked

The `stripPII` helper in `arcade-analytics.js` strips these keys from every
event payload BEFORE it's persisted or transmitted:

```
name, firstName, lastName, fullName, studentName, userName,
email, emailAddress, phone, phoneNumber,
address, ip, ssn, dob, birthday
```

That means:

- **No student names** ever enter the event log. Profile names (set in the
  arcade profile drawer) are stored ONLY in `mr-macs-arcade-roster-v1` on the
  student's own device — they are never serialized into an analytics payload.
- **No IPs.** counterapi.mileshilliard.com sees the IP that hit it, but we
  don't read it back and we don't log it ourselves. We never attribute a
  count to an IP.
- **No exact location.** We coarsely classify the device as `mobile` /
  `tablet` / `desktop` based on UA + pointer media query + screen width.
- **No PII in URLs.** The hub navigates via `openGame()` which fires a
  `game_launch` event with `{ gameId, title, course, gameType }` — no
  student-identifying data.
- **No third-party trackers.** Zero analytics from Google / Meta / TikTok /
  any ad network. The only outbound network call is `countapi.mileshilliard.com`.

What IS tracked per event: event type, ISO timestamp, the `detail` object
(post-strip), a tab-scoped session id, and the device classifier.

What's tracked per game completion: `gameId`, `title`, `course`, `gameType`,
`score`, `questions`, `accuracy`, `percent`, `elapsedMs`, and up to 8 `weakTopics`
(content labels like "Heredity" — not student data).

---

## 6 · Verifying it works

Run the playwright audit script (in repo as `scripts/inject-analytics-coverage.mjs --check`)
to confirm 100% coverage. Spot-check with:

```bash
python3 -m http.server 18950 &
# open http://localhost:18950/games/ap-bio-practice/practice-exam.html
# in DevTools console:
#   MrMacsAnalytics.getEventLog(20)
#   MrMacsPracticeExamAnalytics.state()
```

Click "Begin Exam", answer 2-3 questions, watch the event log fill with
`practice_exam_start`, `practice_exam_question_answered`, etc.

Production check (live counters):

```bash
curl -s https://countapi.mileshilliard.com/api/v1/get/mr-macs-review-arcade-v1-game-launches
```

The number should monotonically increase day-over-day during school weeks.

---

## 7 · What to do if metrics look wrong

| Symptom                                    | Likely cause                                                                                       | Fix                                                                                       |
|--------------------------------------------|----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| All numbers stuck                          | Service worker serving a stale `arcade-analytics.js`                                               | Bump `CACHE_NAME` in `service-worker.js` and ship                                         |
| Public counter doesn't increment           | Browser blocking `countapi.mileshilliard.com` (ad-blocker / corporate DNS)                         | Confirm via `curl` from a non-blocked network                                             |
| `completions` < `launches` (low %)         | Students bouncing before finishing (normal in early school year)                                   | Watch trend, not absolute. If always 0, instrumentation is broken                         |
| `game_play` always 0                       | Students leave before the 25s timer fires (e.g. on a quiz that's faster than that)                 | Lower the threshold in `arcade-analytics.js` (currently `setTimeout(..., 25000)`)         |
| Per-device counts spike unrealistically    | Same student on multiple tabs (each tab has its own session id, but the device counter is shared)  | Filter the public counter by session id in a future iteration                             |
| Dashboard says "MrMacsAnalytics failed to load" | Script tag missing on the page (regression)                                                  | Re-run `node scripts/inject-analytics-coverage.mjs`                                       |
