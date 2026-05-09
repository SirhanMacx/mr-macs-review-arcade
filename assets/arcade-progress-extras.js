/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · progress extras (leaderboards + auto-resume + HUD)
   ──────────────────────────────────────────────────────────────────────
   Three complementary client-only modules sharing one file. All persist
   to localStorage where applicable, all fail silently when storage is
   unavailable (private browsing, quota exceeded, disabled cookies).

   ── Feature 1 · Per-game local leaderboard ──
   Stores up to 5 top scores per gameId in a single object keyed by
   game. New entries are decorated with the active MrMacsProfile name
   and avatar at submission time so the leaderboard reads the same
   even if the player later renames or rebrands.

     window.MrMacsLeaderboards.submit(gameId, score, meta = {})
       → { rank, isNewRecord, displaced } | null
         · rank          1-based slot in the top 5 (1 = best)
         · isNewRecord   true if this score takes slot 1
         · displaced     entry that fell off the bottom (or null)
       Returns null when the score does not crack the top 5.
     window.MrMacsLeaderboards.top(gameId, limit = 5)
       → [{ score, name, avatar, ts, meta }, ...]   (highest first)
     window.MrMacsLeaderboards.best(gameId, playerName)
       → { score, ts, meta } | null
     window.MrMacsLeaderboards.clearAll() → void

   ── Feature 2 · Auto-resume sessions ──
   A lightweight snapshot bag for in-progress games. Games call save()
   periodically (every ~10s or on key turn events) with a serializable
   state object; on next visit they call load() to reclaim. Snapshots
   older than 7 days are auto-pruned on load. The store is capped at
   12 most recent snapshots — older ones are dropped on save.

     window.MrMacsSessions.save(gameId, state) → void
     window.MrMacsSessions.load(gameId) → { state, ts } | null
     window.MrMacsSessions.clear(gameId) → void
     window.MrMacsSessions.listAll(maxAgeMs = 7d)
       → [{ gameId, state, ts }, ...]   (most recent first)

   ── Feature 3 · Reusable HUD widgets (MrMacsProgressExtras) ──
   DRY helpers that most games re-implement: mini-HUD, score chip,
   best badge, streak meter, run-summary card. All render into a
   provided container and respect prefers-reduced-motion.

     MrMacsProgressExtras.renderMiniHud(container, opts)
     MrMacsProgressExtras.renderScoreChip(value, prevValue, container, opts)
     MrMacsProgressExtras.renderBestBadge(gameId, container, opts)
     MrMacsProgressExtras.renderStreakMeter(container, opts)
     MrMacsProgressExtras.renderRunSummary(container, payload)

   Storage keys:
     mr-macs-arcade-leaderboards-v1
     mr-macs-arcade-sessions-v1

   This module does NOT modify any per-game code — flagship games will
   call submit()/save() directly. It only provides the shared API +
   hub-side decoration helpers + reusable HUD widgets.
   ───────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsLeaderboards && root.MrMacsSessions && root.MrMacsProgressExtras) return;

  var LB_KEY = "mr-macs-arcade-leaderboards-v1";
  var SS_KEY = "mr-macs-arcade-sessions-v1";
  var LB_LIMIT = 5;
  var SS_LIMIT = 12;
  var SS_MAX_AGE_MS = 7 * 24 * 3600 * 1000;

  var doc = (typeof document !== "undefined") ? document : null;

  // ── Storage helpers ──────────────────────────────────────────────
  function readStore(key) {
    try {
      var raw = root.localStorage && root.localStorage.getItem(key);
      if (!raw) return {};
      var obj = JSON.parse(raw);
      return (obj && typeof obj === "object") ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(key, obj) {
    try {
      if (!root.localStorage) return false;
      root.localStorage.setItem(key, JSON.stringify(obj || {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function safeGameId(gameId) {
    return String(gameId || "").trim().slice(0, 80);
  }

  function nowTs() { return Date.now(); }

  function prefersReducedMotion() {
    try {
      if (root.matchMedia) {
        return !!(root.matchMedia("(prefers-reduced-motion: reduce)").matches);
      }
    } catch (e) {}
    return false;
  }

  function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/[<>&"']/g, function (c) {
      return c === "<" ? "&lt;"
           : c === ">" ? "&gt;"
           : c === "&" ? "&amp;"
           : c === '"' ? "&quot;"
           : "&#39;";
    });
  }

  function resolveContainer(c) {
    if (!c) return null;
    if (typeof c === "string") {
      try { return doc && doc.querySelector(c); } catch (e) { return null; }
    }
    if (c.nodeType === 1) return c;
    return null;
  }

  function formatNumber(n) {
    var v = Number(n);
    if (!isFinite(v)) return "0";
    try { return v.toLocaleString(); } catch (e) { return String(v); }
  }

  function formatDuration(ms) {
    var n = Number(ms);
    if (!isFinite(n) || n < 0) return "0s";
    var total = Math.round(n / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    if (h > 0) return h + "h " + m + "m";
    if (m > 0) return m + "m " + s + "s";
    return s + "s";
  }

  // ── Profile decoration ───────────────────────────────────────────
  function currentName() {
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getName === "function") {
        var n = root.MrMacsProfile.getName();
        if (n) return String(n).slice(0, 24);
      }
    } catch (e) {}
    return "Trainer";
  }

  function currentAvatar() {
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getAvatar === "function") {
        var a = root.MrMacsProfile.getAvatar();
        if (a && a.value) return String(a.value);
      }
    } catch (e) {}
    return "🎓";
  }

  function currentShards() {
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getShards === "function") {
        var s = root.MrMacsProfile.getShards();
        if (isFinite(s)) return Number(s);
      }
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getCoins === "function") {
        var c = root.MrMacsProfile.getCoins();
        if (isFinite(c)) return Number(c);
      }
    } catch (e) {}
    return 0;
  }

  function currentStreak() {
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getStreak === "function") {
        var s = root.MrMacsProfile.getStreak();
        if (s && typeof s === "object") return s;
        if (isFinite(s)) return { current: Number(s), best: Number(s) };
      }
    } catch (e) {}
    return { current: 0, best: 0 };
  }

  // ── Feature 1: Leaderboards ──────────────────────────────────────
  function lbSubmit(gameId, score, meta) {
    var id = safeGameId(gameId);
    if (!id) return null;
    var n = Number(score);
    if (!isFinite(n)) return null;
    var store = readStore(LB_KEY);
    var list = Array.isArray(store[id]) ? store[id].slice() : [];
    var entry = {
      score: n,
      name: currentName(),
      avatar: currentAvatar(),
      ts: nowTs(),
      meta: (meta && typeof meta === "object") ? meta : {}
    };

    // Insert sorted desc by score; ties keep older entry above (stable).
    var insertAt = list.length;
    for (var i = 0; i < list.length; i++) {
      if (n > list[i].score) { insertAt = i; break; }
    }
    if (insertAt >= LB_LIMIT) return null;
    list.splice(insertAt, 0, entry);
    var displaced = null;
    if (list.length > LB_LIMIT) {
      displaced = list.splice(LB_LIMIT, list.length - LB_LIMIT)[0] || null;
    }
    store[id] = list;
    writeStore(LB_KEY, store);
    return {
      rank: insertAt + 1,
      isNewRecord: insertAt === 0,
      displaced: displaced
    };
  }

  function lbTop(gameId, limit) {
    var id = safeGameId(gameId);
    if (!id) return [];
    var store = readStore(LB_KEY);
    var list = Array.isArray(store[id]) ? store[id] : [];
    var lim = Math.max(1, Math.min(LB_LIMIT, Number(limit) || LB_LIMIT));
    return list.slice(0, lim).map(function (e) {
      return {
        score: e.score,
        name: e.name || "Trainer",
        avatar: e.avatar || "🎓",
        ts: e.ts || 0,
        meta: e.meta || {}
      };
    });
  }

  function lbBest(gameId, playerName) {
    var id = safeGameId(gameId);
    if (!id) return null;
    var who = String(playerName || "").trim();
    if (!who) return null;
    var store = readStore(LB_KEY);
    var list = Array.isArray(store[id]) ? store[id] : [];
    var hit = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === who && (!hit || list[i].score > hit.score)) {
        hit = list[i];
      }
    }
    if (!hit) return null;
    return { score: hit.score, ts: hit.ts || 0, meta: hit.meta || {} };
  }

  function lbClearAll() {
    writeStore(LB_KEY, {});
  }

  // ── Feature 2: Sessions ──────────────────────────────────────────
  function ssReadAll() {
    var store = readStore(SS_KEY);
    // Auto-prune expired entries on read so listAll/load stay honest.
    var cutoff = nowTs() - SS_MAX_AGE_MS;
    var changed = false;
    Object.keys(store).forEach(function (k) {
      var rec = store[k];
      if (!rec || typeof rec !== "object" || !rec.ts || rec.ts < cutoff) {
        delete store[k];
        changed = true;
      }
    });
    if (changed) writeStore(SS_KEY, store);
    return store;
  }

  function ssSave(gameId, state) {
    var id = safeGameId(gameId);
    if (!id) return;
    // State must be JSON-serializable. We probe by stringifying once.
    var serialized;
    try {
      serialized = JSON.stringify(state);
      if (typeof serialized !== "string") return;
    } catch (e) {
      return;
    }
    var store = readStore(SS_KEY);
    store[id] = { state: JSON.parse(serialized), ts: nowTs() };

    // Cap at 12 most recent — drop oldest beyond the cap.
    var keys = Object.keys(store);
    if (keys.length > SS_LIMIT) {
      keys.sort(function (a, b) {
        return (store[b].ts || 0) - (store[a].ts || 0);
      });
      var keep = keys.slice(0, SS_LIMIT);
      var trimmed = {};
      keep.forEach(function (k) { trimmed[k] = store[k]; });
      store = trimmed;
    }
    writeStore(SS_KEY, store);
  }

  function ssLoad(gameId) {
    var id = safeGameId(gameId);
    if (!id) return null;
    var store = ssReadAll();
    var rec = store[id];
    if (!rec) return null;
    return { state: rec.state, ts: rec.ts || 0 };
  }

  function ssClear(gameId) {
    var id = safeGameId(gameId);
    if (!id) return;
    var store = readStore(SS_KEY);
    if (Object.prototype.hasOwnProperty.call(store, id)) {
      delete store[id];
      writeStore(SS_KEY, store);
    }
  }

  function ssListAll(maxAgeMs) {
    var max = Number(maxAgeMs);
    if (!isFinite(max) || max <= 0) max = SS_MAX_AGE_MS;
    var store = ssReadAll();
    var cutoff = nowTs() - max;
    var out = [];
    Object.keys(store).forEach(function (k) {
      var rec = store[k];
      if (rec && rec.ts && rec.ts >= cutoff) {
        out.push({ gameId: k, state: rec.state, ts: rec.ts });
      }
    });
    out.sort(function (a, b) { return b.ts - a.ts; });
    return out;
  }

  // ── Hub-side decoration helpers ──────────────────────────────────
  // Add a "Resume" badge to any .continue-card whose data-id has a
  // saved session. Idempotent — safe to call after every renderContinue.
  function decorateContinueCards(scope) {
    try {
      if (!doc) return;
      var resumable = {};
      ssListAll().forEach(function (r) { resumable[r.gameId] = true; });
      var root2 = scope || doc;
      var cards = root2.querySelectorAll && root2.querySelectorAll(".continue-card");
      if (!cards) return;
      Array.prototype.forEach.call(cards, function (card) {
        var id = card.getAttribute("data-id");
        var existing = card.querySelector(".cc-resume");
        if (id && resumable[id]) {
          if (!existing) {
            var badge = doc.createElement("span");
            badge.className = "cc-resume";
            badge.textContent = "Resume";
            badge.setAttribute("aria-label", "Saved session — tap to resume");
            // Slot before the kicker so it floats top-right via CSS.
            card.insertBefore(badge, card.firstChild);
          }
        } else if (existing) {
          existing.parentNode.removeChild(existing);
        }
      });
    } catch (e) {}
  }

  // Compute a player's best-3 across all games. Returns an array of
  // { gameId, score, ts, rank } sorted by score desc, length ≤ 3.
  // `gameTitleLookup` is optional — a function (gameId) → title.
  function topScoresForPlayer(playerName, gameTitleLookup) {
    var who = String(playerName || "").trim();
    if (!who) return [];
    var store = readStore(LB_KEY);
    var rows = [];
    Object.keys(store).forEach(function (gameId) {
      var list = Array.isArray(store[gameId]) ? store[gameId] : [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].name === who) {
          rows.push({
            gameId: gameId,
            title: (typeof gameTitleLookup === "function" ? gameTitleLookup(gameId) : "") || gameId,
            score: list[i].score,
            ts: list[i].ts || 0,
            rank: i + 1
          });
          break; // best entry per game (already sorted)
        }
      }
    });
    rows.sort(function (a, b) { return b.score - a.score; });
    return rows.slice(0, 3);
  }

  // Inject light CSS for the Resume badge + drawer top-scores list +
  // HUD widgets. No-op if already injected.
  function injectStyles() {
    try {
      if (!doc || !doc.head || doc.getElementById("arcade-progress-extras-styles")) return;
      var css = '\
.continue-card .cc-resume {\
  position: absolute; top: 8px; right: 10px;\
  font-family: "JetBrains Mono", monospace;\
  font-size: 9.5px; font-weight: 700;\
  letter-spacing: .12em; text-transform: uppercase;\
  padding: 3px 8px;\
  border-radius: 999px;\
  color: #0b0d14;\
  background: linear-gradient(135deg, #ffd884, #f5c451);\
  border: 1px solid rgba(245, 196, 81, .65);\
  box-shadow: 0 4px 10px rgba(245, 196, 81, .25);\
  pointer-events: none;\
}\
.pd-section-topscores .pd-top-list {\
  display: flex; flex-direction: column; gap: 6px;\
  margin-top: 6px;\
}\
.pd-section-topscores .pd-top-row {\
  display: flex; align-items: center; gap: 10px;\
  padding: 8px 10px;\
  background: rgba(13, 17, 27, .55);\
  border: 1px solid rgba(255, 255, 255, .08);\
  border-radius: 10px;\
}\
.pd-section-topscores .pd-top-rank {\
  font-family: "JetBrains Mono", monospace;\
  font-size: 10.5px; font-weight: 700;\
  letter-spacing: .10em;\
  color: #f5c451;\
  min-width: 22px;\
}\
.pd-section-topscores .pd-top-title {\
  flex: 1; min-width: 0;\
  font-family: "Fraunces", serif;\
  font-style: italic; font-weight: 540;\
  font-size: 14px;\
  color: var(--paper, #f0f3fa);\
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\
}\
.pd-section-topscores .pd-top-score {\
  font-family: "JetBrains Mono", monospace;\
  font-size: 12px; font-weight: 700;\
  font-variant-numeric: tabular-nums;\
  color: #7af0ff;\
}\
.pd-section-topscores .pd-top-empty {\
  font-family: "JetBrains Mono", monospace;\
  font-size: 11px; letter-spacing: .08em;\
  color: var(--muted, #9aa3bb);\
  padding: 8px 4px;\
}\
/* Mini-HUD pill */\
.mr-mini-hud {\
  display: inline-flex; align-items: center; gap: 8px;\
  padding: 5px 10px;\
  background: rgba(13, 17, 27, .72);\
  border: 1px solid rgba(255, 255, 255, .10);\
  border-radius: 999px;\
  font-family: "JetBrains Mono", monospace;\
  font-size: 11px; font-weight: 700;\
  letter-spacing: .06em;\
  color: var(--paper, #f0f3fa);\
  font-variant-numeric: tabular-nums;\
  white-space: nowrap;\
}\
.mr-mini-hud .mh-cell {\
  display: inline-flex; align-items: center; gap: 4px;\
}\
.mr-mini-hud .mh-icon {\
  font-size: 12px;\
}\
.mr-mini-hud .mh-shards { color: #7af0ff; }\
.mr-mini-hud .mh-streak { color: #ffb37a; }\
.mr-mini-hud .mh-sep {\
  width: 1px; height: 11px;\
  background: rgba(255, 255, 255, .14);\
}\
/* Score chip */\
.mr-score-chip {\
  display: inline-flex; align-items: baseline; gap: 6px;\
  padding: 6px 12px;\
  background: linear-gradient(135deg, rgba(122, 240, 255, .08), rgba(122, 240, 255, .02));\
  border: 1px solid rgba(122, 240, 255, .25);\
  border-radius: 10px;\
  font-family: "JetBrains Mono", monospace;\
  font-variant-numeric: tabular-nums;\
}\
.mr-score-chip .sc-label {\
  font-size: 9.5px; letter-spacing: .14em;\
  text-transform: uppercase;\
  color: var(--muted, #9aa3bb);\
}\
.mr-score-chip .sc-value {\
  font-size: 16px; font-weight: 700;\
  color: #7af0ff;\
}\
.mr-score-chip.is-bumping .sc-value {\
  animation: mrScoreBump .6s cubic-bezier(.16,1,.3,1);\
}\
@keyframes mrScoreBump {\
  0% { transform: translateY(0); }\
  50% { transform: translateY(-3px); color: #ffd884; }\
  100% { transform: translateY(0); }\
}\
/* Best badge */\
.mr-best-badge {\
  display: inline-flex; align-items: center; gap: 6px;\
  padding: 4px 10px;\
  background: linear-gradient(135deg, rgba(245, 196, 81, .18), rgba(245, 196, 81, .06));\
  border: 1px solid rgba(245, 196, 81, .55);\
  border-radius: 999px;\
  color: #ffd884;\
  font-family: "JetBrains Mono", monospace;\
  font-size: 11px; font-weight: 700;\
  letter-spacing: .08em;\
  font-variant-numeric: tabular-nums;\
}\
.mr-best-badge .bb-icon { font-size: 12px; }\
.mr-best-badge .bb-label {\
  font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;\
  color: var(--muted, #9aa3bb);\
}\
/* Streak meter */\
.mr-streak-meter {\
  display: flex; flex-direction: column; gap: 6px;\
  padding: 10px 12px;\
  background: rgba(13, 17, 27, .55);\
  border: 1px solid rgba(255, 255, 255, .08);\
  border-radius: 10px;\
  font-family: "JetBrains Mono", monospace;\
  font-variant-numeric: tabular-nums;\
}\
.mr-streak-meter .sm-head {\
  display: flex; align-items: center; justify-content: space-between;\
  font-size: 10px; letter-spacing: .14em; text-transform: uppercase;\
  color: var(--muted, #9aa3bb);\
}\
.mr-streak-meter .sm-head strong {\
  color: #ffb37a; font-weight: 700;\
}\
.mr-streak-meter .sm-bar {\
  display: flex; gap: 4px;\
}\
.mr-streak-meter .sm-cell {\
  flex: 1; height: 8px; border-radius: 3px;\
  background: rgba(255, 255, 255, .08);\
  border: 1px solid rgba(255, 255, 255, .04);\
  transition: background .25s ease-out, transform .25s ease-out;\
}\
.mr-streak-meter .sm-cell.is-on {\
  background: linear-gradient(180deg, #ffd884, #f5c451);\
  border-color: rgba(245, 196, 81, .65);\
  box-shadow: 0 2px 8px rgba(245, 196, 81, .25);\
}\
.mr-streak-meter .sm-cell.is-today {\
  transform: translateY(-1px);\
  box-shadow: 0 4px 14px rgba(245, 196, 81, .35);\
}\
.mr-streak-meter .sm-foot {\
  font-size: 10px; color: var(--muted, #9aa3bb);\
  letter-spacing: .04em;\
}\
/* Run summary card */\
.mr-run-summary {\
  display: grid;\
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));\
  gap: 10px;\
  padding: 14px;\
  background: rgba(13, 17, 27, .55);\
  border: 1px solid rgba(255, 255, 255, .08);\
  border-radius: 12px;\
}\
.mr-run-summary .rs-cell {\
  display: flex; flex-direction: column; gap: 4px;\
  padding: 10px 12px;\
  background: rgba(8, 11, 20, .55);\
  border: 1px solid rgba(255, 255, 255, .06);\
  border-radius: 10px;\
  font-family: "JetBrains Mono", monospace;\
  font-variant-numeric: tabular-nums;\
}\
.mr-run-summary .rs-label {\
  font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase;\
  color: var(--muted, #9aa3bb);\
}\
.mr-run-summary .rs-value {\
  font-size: 18px; font-weight: 700;\
  color: var(--paper, #f0f3fa);\
}\
.mr-run-summary .rs-cell.rs-score .rs-value { color: #7af0ff; }\
.mr-run-summary .rs-cell.rs-best .rs-value { color: #ffd884; }\
.mr-run-summary .rs-cell.rs-scholar .rs-value { color: #b39ddb; }\
@media (prefers-reduced-motion: reduce) {\
  .mr-score-chip.is-bumping .sc-value { animation: none; }\
  .mr-streak-meter .sm-cell { transition: none; }\
}\
';
      var style = doc.createElement("style");
      style.id = "arcade-progress-extras-styles";
      style.textContent = css;
      doc.head.appendChild(style);
    } catch (e) {}
  }

  // Render a "Top scores" panel inside the profile drawer. Looks up
  // the achievements section so the new section sits right above it.
  // Idempotent: replaces existing markup on every call. Pass a title
  // lookup so game IDs become readable names.
  function renderDrawerTopScores(gameTitleLookup) {
    try {
      if (!doc) return;
      var drawer = doc.getElementById("profileDrawer");
      if (!drawer) return;
      var body = drawer.querySelector(".pd-body");
      if (!body) return;
      var section = doc.getElementById("pdTopScoresSection");
      if (!section) {
        section = doc.createElement("section");
        section.id = "pdTopScoresSection";
        section.className = "pd-section pd-section-topscores";
        section.innerHTML =
          '<header class="pd-section-head">' +
            '<h3>Top scores</h3>' +
            '<span class="pd-section-meta">Your best 3 across all games</span>' +
          '</header>' +
          '<div class="pd-top-list" id="pdTopList"></div>';
        var anchor = body.querySelector(".pd-section-achievements");
        if (anchor) body.insertBefore(section, anchor);
        else body.appendChild(section);
      }
      var listEl = section.querySelector("#pdTopList");
      if (!listEl) return;
      var rows = topScoresForPlayer(currentName(), gameTitleLookup);
      if (!rows.length) {
        listEl.innerHTML = '<div class="pd-top-empty">Play a flagship game to land your first top-3.</div>';
        return;
      }
      listEl.innerHTML = rows.map(function (row, i) {
        return '<div class="pd-top-row" role="listitem">' +
          '<span class="pd-top-rank">#' + (i + 1) + '</span>' +
          '<span class="pd-top-title">' + escapeHtml(row.title) + '</span>' +
          '<span class="pd-top-score">' + escapeHtml(formatNumber(row.score)) + '</span>' +
        '</div>';
      }).join("");
    } catch (e) {}
  }

  // ── Feature 3: Reusable HUD widgets ──────────────────────────────
  // All renderers mutate the provided container's innerHTML and return
  // the root element they wrote (or null on error). They are idempotent
  // and safe to call repeatedly with new values.

  function renderMiniHud(container, opts) {
    try {
      var host = resolveContainer(container);
      if (!host || !doc) return null;
      opts = opts || {};
      var shards = (opts.shards != null) ? Number(opts.shards) : currentShards();
      var streakObj = currentStreak();
      var streak = (opts.streak != null) ? Number(opts.streak) : Number(streakObj.current || 0);
      var showShards = opts.showShards !== false;
      var showStreak = opts.showStreak !== false;
      var shardsIcon = opts.shardsIcon || "💎";
      var streakIcon = opts.streakIcon || "🔥";

      var existing = host.querySelector(".mr-mini-hud");
      var pill = existing;
      if (!pill) {
        host.innerHTML = "";
        pill = doc.createElement("div");
        pill.className = "mr-mini-hud";
        pill.setAttribute("role", "status");
        pill.setAttribute("aria-live", "polite");
        host.appendChild(pill);
      }

      var parts = [];
      if (showShards) {
        parts.push('<span class="mh-cell mh-shards" title="Shards">' +
          '<span class="mh-icon" aria-hidden="true">' + escapeHtml(shardsIcon) + '</span>' +
          '<span>' + escapeHtml(formatNumber(shards)) + '</span>' +
        '</span>');
      }
      if (showShards && showStreak) {
        parts.push('<span class="mh-sep" aria-hidden="true"></span>');
      }
      if (showStreak) {
        parts.push('<span class="mh-cell mh-streak" title="Current streak">' +
          '<span class="mh-icon" aria-hidden="true">' + escapeHtml(streakIcon) + '</span>' +
          '<span>' + escapeHtml(formatNumber(streak)) + (streak === 1 ? ' day' : ' days') + '</span>' +
        '</span>');
      }
      pill.innerHTML = parts.join("");
      pill.setAttribute("aria-label",
        (showShards ? formatNumber(shards) + " shards" : "") +
        (showShards && showStreak ? ", " : "") +
        (showStreak ? formatNumber(streak) + " day streak" : "")
      );
      return pill;
    } catch (e) { return null; }
  }

  function tweenNumber(el, from, to, durationMs) {
    if (!el) return;
    var reduced = prefersReducedMotion();
    if (reduced || !root.requestAnimationFrame || durationMs <= 0 || from === to) {
      el.textContent = formatNumber(to);
      return;
    }
    var start = nowTs();
    var dur = Math.max(120, durationMs || 600);
    function frame() {
      var t = Math.min(1, (nowTs() - start) / dur);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - t, 3);
      var v = Math.round(from + (to - from) * eased);
      el.textContent = formatNumber(v);
      if (t < 1) {
        try { root.requestAnimationFrame(frame); } catch (e) { el.textContent = formatNumber(to); }
      }
    }
    try { root.requestAnimationFrame(frame); } catch (e) { el.textContent = formatNumber(to); }
  }

  function renderScoreChip(value, prevValue, container, opts) {
    try {
      var host = resolveContainer(container);
      if (!host || !doc) return null;
      opts = opts || {};
      var to = Number(value); if (!isFinite(to)) to = 0;
      var from = Number(prevValue); if (!isFinite(from)) from = to;
      var label = opts.label || "Score";

      var chip = host.querySelector(".mr-score-chip");
      if (!chip) {
        host.innerHTML = "";
        chip = doc.createElement("div");
        chip.className = "mr-score-chip";
        chip.innerHTML =
          '<span class="sc-label">' + escapeHtml(label) + '</span>' +
          '<span class="sc-value" aria-live="polite">' + escapeHtml(formatNumber(from)) + '</span>';
        host.appendChild(chip);
      } else {
        var labelEl = chip.querySelector(".sc-label");
        if (labelEl) labelEl.textContent = label;
      }
      var valEl = chip.querySelector(".sc-value");
      if (!valEl) return chip;

      // Bump animation only on score increase
      if (to > from) {
        chip.classList.remove("is-bumping");
        // Force reflow so the animation restarts
        // eslint-disable-next-line no-unused-expressions
        chip.offsetWidth;
        chip.classList.add("is-bumping");
        if (!chip._mrChipTimer) {
          chip._mrChipTimer = root.setTimeout(function () {
            chip.classList.remove("is-bumping");
            chip._mrChipTimer = null;
          }, 700);
        } else {
          root.clearTimeout(chip._mrChipTimer);
          chip._mrChipTimer = root.setTimeout(function () {
            chip.classList.remove("is-bumping");
            chip._mrChipTimer = null;
          }, 700);
        }
      }
      tweenNumber(valEl, from, to, opts.durationMs || 600);
      return chip;
    } catch (e) { return null; }
  }

  function renderBestBadge(gameId, container, opts) {
    try {
      var host = resolveContainer(container);
      if (!host || !doc) return null;
      opts = opts || {};
      var who = opts.playerName || currentName();
      var best = lbBest(gameId, who);
      if (!best) {
        // No best yet — clear the host (idempotent)
        var existingEmpty = host.querySelector(".mr-best-badge");
        if (existingEmpty) existingEmpty.parentNode.removeChild(existingEmpty);
        return null;
      }
      var badge = host.querySelector(".mr-best-badge");
      if (!badge) {
        host.innerHTML = "";
        badge = doc.createElement("div");
        badge.className = "mr-best-badge";
        host.appendChild(badge);
      }
      var icon = opts.icon || "🏆";
      badge.innerHTML =
        '<span class="bb-icon" aria-hidden="true">' + escapeHtml(icon) + '</span>' +
        '<span class="bb-label">Best</span>' +
        '<span class="bb-value">' + escapeHtml(formatNumber(best.score)) + '</span>';
      badge.setAttribute("aria-label", "Personal best: " + formatNumber(best.score));
      badge.setAttribute("title", "Personal best: " + formatNumber(best.score));
      return badge;
    } catch (e) { return null; }
  }

  function renderStreakMeter(container, opts) {
    try {
      var host = resolveContainer(container);
      if (!host || !doc) return null;
      opts = opts || {};
      var streakObj = currentStreak();
      var current = (opts.current != null) ? Number(opts.current) : Number(streakObj.current || 0);
      var best = (opts.best != null) ? Number(opts.best) : Number(streakObj.best || current);
      var weekDaysActive = Number(opts.weekDays || Math.min(7, current)); // approx fill for the week
      if (!isFinite(weekDaysActive) || weekDaysActive < 0) weekDaysActive = 0;
      if (weekDaysActive > 7) weekDaysActive = 7;
      // Today's index (0=Mon..6=Sun) — fall back to JS getDay (0=Sun)
      var todayIdx;
      if (opts.todayIdx != null) {
        todayIdx = Math.max(0, Math.min(6, Number(opts.todayIdx)));
      } else {
        var d = new Date();
        // Re-map so Mon=0..Sun=6 (matches most week-streak UIs)
        var js = d.getDay();
        todayIdx = (js === 0) ? 6 : (js - 1);
      }

      var meter = host.querySelector(".mr-streak-meter");
      if (!meter) {
        host.innerHTML = "";
        meter = doc.createElement("div");
        meter.className = "mr-streak-meter";
        host.appendChild(meter);
      }
      var cells = "";
      for (var i = 0; i < 7; i++) {
        var on = i <= weekDaysActive - 1;
        var isToday = i === todayIdx;
        cells += '<span class="sm-cell' +
          (on ? ' is-on' : '') +
          (isToday ? ' is-today' : '') +
          '" aria-hidden="true"></span>';
      }
      meter.innerHTML =
        '<div class="sm-head">' +
          '<span>This week</span>' +
          '<span><strong>' + escapeHtml(formatNumber(current)) + '</strong> · best ' + escapeHtml(formatNumber(best)) + '</span>' +
        '</div>' +
        '<div class="sm-bar" role="img" aria-label="' +
          formatNumber(weekDaysActive) + ' of 7 days active this week">' +
          cells +
        '</div>' +
        '<div class="sm-foot">Keep the chain alive — log in tomorrow to extend.</div>';
      return meter;
    } catch (e) { return null; }
  }

  function renderRunSummary(container, payload) {
    try {
      var host = resolveContainer(container);
      if (!host || !doc) return null;
      payload = payload || {};
      var gameId = safeGameId(payload.gameId);
      var score = Number(payload.score);
      if (!isFinite(score)) score = 0;
      var level = (payload.level != null) ? payload.level : null;
      var durationMs = (payload.durationMs != null) ? Number(payload.durationMs) : null;
      var scholarHits = (payload.scholarHits != null) ? Number(payload.scholarHits) : null;
      var accuracy = (payload.accuracy != null) ? Number(payload.accuracy) : null; // 0..1
      var combo = (payload.combo != null) ? Number(payload.combo) : null;
      var extras = Array.isArray(payload.extras) ? payload.extras : [];

      var bestEntry = gameId ? lbBest(gameId, currentName()) : null;
      var bestScore = bestEntry ? bestEntry.score : null;

      var card = host.querySelector(".mr-run-summary");
      if (!card) {
        host.innerHTML = "";
        card = doc.createElement("div");
        card.className = "mr-run-summary";
        card.setAttribute("role", "group");
        card.setAttribute("aria-label", "Run summary");
        host.appendChild(card);
      }

      function cell(cls, label, value) {
        return '<div class="rs-cell ' + cls + '">' +
          '<span class="rs-label">' + escapeHtml(label) + '</span>' +
          '<span class="rs-value">' + escapeHtml(value) + '</span>' +
        '</div>';
      }

      var html = "";
      html += cell("rs-score", "Score", formatNumber(score));
      if (bestScore != null) {
        html += cell("rs-best", "Best", formatNumber(bestScore));
      }
      if (level != null && level !== "") {
        html += cell("rs-level", "Level", String(level));
      }
      if (durationMs != null && isFinite(durationMs)) {
        html += cell("rs-time", "Time", formatDuration(durationMs));
      }
      if (scholarHits != null && isFinite(scholarHits)) {
        html += cell("rs-scholar", "Scholar hits", formatNumber(scholarHits));
      }
      if (accuracy != null && isFinite(accuracy)) {
        var pct = Math.round(Math.max(0, Math.min(1, accuracy)) * 100);
        html += cell("rs-accuracy", "Accuracy", pct + "%");
      }
      if (combo != null && isFinite(combo)) {
        html += cell("rs-combo", "Best combo", formatNumber(combo));
      }
      // Custom extras: [{label, value, cls}]
      extras.forEach(function (extra) {
        if (!extra || extra.label == null) return;
        var cls = "rs-extra " + (extra.cls ? String(extra.cls).replace(/[^a-z0-9_-]/gi, "") : "");
        html += cell(cls, extra.label, extra.value == null ? "" : String(extra.value));
      });

      card.innerHTML = html;
      return card;
    } catch (e) { return null; }
  }

  // ── Init ─────────────────────────────────────────────────────────
  function initialize() {
    if (doc && doc.head) injectStyles();
    // Prune session entries on first run so listAll/load are clean.
    try { ssReadAll(); } catch (e) {}
  }

  if (doc && doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else if (doc) {
    initialize();
  }

  // ── Public API ───────────────────────────────────────────────────
  root.MrMacsLeaderboards = {
    submit: lbSubmit,
    top: lbTop,
    best: lbBest,
    clearAll: lbClearAll,
    // Hub helper, not strictly part of the contract but handy:
    topScoresForPlayer: topScoresForPlayer,
    renderDrawerTopScores: renderDrawerTopScores
  };

  root.MrMacsSessions = {
    save: ssSave,
    load: ssLoad,
    clear: ssClear,
    listAll: ssListAll,
    // Hub helper:
    decorateContinueCards: decorateContinueCards
  };

  root.MrMacsProgressExtras = {
    renderMiniHud: renderMiniHud,
    renderScoreChip: renderScoreChip,
    renderBestBadge: renderBestBadge,
    renderStreakMeter: renderStreakMeter,
    renderRunSummary: renderRunSummary,
    // Re-exports for convenience inside game code
    formatNumber: formatNumber,
    formatDuration: formatDuration,
    prefersReducedMotion: prefersReducedMotion,
    injectStyles: injectStyles
  };
})(typeof window !== "undefined" ? window : this);
