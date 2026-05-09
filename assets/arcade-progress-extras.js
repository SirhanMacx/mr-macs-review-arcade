/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · progress extras (leaderboards + auto-resume)
   ──────────────────────────────────────────────────────────────────────
   Two complementary client-only modules sharing one file. Both persist
   to localStorage, both fail silently when storage is unavailable
   (private browsing, quota exceeded, disabled cookies).

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

   Storage keys:
     mr-macs-arcade-leaderboards-v1
     mr-macs-arcade-sessions-v1

   This module does NOT modify any per-game code — flagship games will
   call submit()/save() directly (Wave 5). It only provides the shared
   API + hub-side decoration helpers.
   ───────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsLeaderboards && root.MrMacsSessions) return;

  var LB_KEY = "mr-macs-arcade-leaderboards-v1";
  var SS_KEY = "mr-macs-arcade-sessions-v1";
  var LB_LIMIT = 5;
  var SS_LIMIT = 12;
  var SS_MAX_AGE_MS = 7 * 24 * 3600 * 1000;

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
      var resumable = {};
      ssListAll().forEach(function (r) { resumable[r.gameId] = true; });
      var root2 = scope || document;
      var cards = root2.querySelectorAll && root2.querySelectorAll(".continue-card");
      if (!cards) return;
      Array.prototype.forEach.call(cards, function (card) {
        var id = card.getAttribute("data-id");
        var existing = card.querySelector(".cc-resume");
        if (id && resumable[id]) {
          if (!existing) {
            var badge = document.createElement("span");
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

  // Inject light CSS for the Resume badge + drawer top-scores list.
  // No-op if already injected. Kept inline so the module is drop-in.
  function injectStyles() {
    try {
      if (document.getElementById("arcade-progress-extras-styles")) return;
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
';
      var style = document.createElement("style");
      style.id = "arcade-progress-extras-styles";
      style.textContent = css;
      document.head.appendChild(style);
    } catch (e) {}
  }

  // Render a "Top scores" panel inside the profile drawer. Looks up
  // the achievements section so the new section sits right above it.
  // Idempotent: replaces existing markup on every call. Pass a title
  // lookup so game IDs become readable names.
  function renderDrawerTopScores(gameTitleLookup) {
    try {
      var drawer = document.getElementById("profileDrawer");
      if (!drawer) return;
      var body = drawer.querySelector(".pd-body");
      if (!body) return;
      var section = document.getElementById("pdTopScoresSection");
      if (!section) {
        section = document.createElement("section");
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
      var safe = function (v) {
        return String(v || "").replace(/[<>&"]/g, function (c) {
          return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
        });
      };
      listEl.innerHTML = rows.map(function (row, i) {
        return '<div class="pd-top-row" role="listitem">' +
          '<span class="pd-top-rank">#' + (i + 1) + '</span>' +
          '<span class="pd-top-title">' + safe(row.title) + '</span>' +
          '<span class="pd-top-score">' + Number(row.score).toLocaleString() + '</span>' +
        '</div>';
      }).join("");
    } catch (e) {}
  }

  // ── Init ─────────────────────────────────────────────────────────
  function initialize() {
    if (document.head) injectStyles();
    // Prune session entries on first run so listAll/load are clean.
    try { ssReadAll(); } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  // ── Public API ───────────────────────────────────────────────────
  root.MrMacsLeaderboards = {
    submit: lbSubmit,
    top: lbTop,
    best: lbBest,
    clearAll: lbClearAll,
    // Hub helper, not strictly part of the contract but handy:
    topScoresForPlayer: topScoresForPlayer
  };

  root.MrMacsSessions = {
    save: ssSave,
    load: ssLoad,
    clear: ssClear,
    listAll: ssListAll,
    // Hub helper:
    decorateContinueCards: decorateContinueCards
  };

  // Drawer helper exposed under both namespaces for discoverability.
  root.MrMacsLeaderboards.renderDrawerTopScores = renderDrawerTopScores;
})(typeof window !== "undefined" ? window : this);
