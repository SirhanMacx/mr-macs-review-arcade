# Global Leaderboard

Mr. Mac's Review Arcade stays local-first by default. Global scores are optional and only turn on when a teacher configures an HTTPS leaderboard endpoint in the Teacher Dashboard.

## Student Name Safety

Global scores never send the local profile name. The client sends a short public arcade handle such as `NOVA-421`. The Worker does not store raw browser/client identifiers; it converts the client key into a one-way hash for per-game dedupe and returns only public rank rows.

The name policy runs in three places:

- `assets/arcade-name-safety.js` blocks profanity, slurs, leet-speak bypasses, emails, phone numbers, dates, and social handles.
- `assets/arcade-progress-extras.js` uses the same policy when queueing or posting scores from game pages.
- `workers/global-leaderboard-worker.js` repeats the same filter server-side before a score can be stored.

If a name fails, it is replaced with `PLAYER-000` or `PLAYER`.

Stored global leaderboard rows contain only:

- `gameId`
- safe public `displayName`
- numeric `score`
- timestamp
- a non-identifying hashed client key used internally for dedupe
- whitelisted gameplay metadata such as course, mode, accuracy, rounds, or game type

## Endpoint Contract

The worker implements:

- `GET /scores?gameId=<id>&limit=10`
- `POST /scores`
- `DELETE /scores?gameId=<id>&entryId=<id>` with `x-arcade-admin-token`

Cloudflare Worker bindings:

- `ARCADE_LEADERBOARD`: KV namespace
- `ADMIN_TOKEN`: secret used for deletion

## Static-Site Behavior

If no endpoint is configured, scores stay local and queue in the browser. When an endpoint is added later, the queue flushes automatically.
