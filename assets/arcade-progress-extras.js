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
  var scriptSrc = (doc && doc.currentScript && doc.currentScript.src) ? doc.currentScript.src : "";

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
    var Safety = ensureNameSafety();
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getName === "function") {
        var n = root.MrMacsProfile.getName();
        if (n) return Safety.sanitizeDisplayName(n, "PLAYER");
      }
    } catch (e) {}
    return "PLAYER";
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

  function ensureNameSafety() {
    if (root.MrMacsNameSafety) return root.MrMacsNameSafety;
    var blocked = [
      "fuck","fck","fuk","shit","sht","piss","cunt","cnt","dick","cock","cok",
      "pussy","pusy","penis","vagina","boob","tit","tts","anal","anus","ass",
      "arse","sex","porn","prn","cum","jizz","slut","whore","hoe","bitch",
      "btch","bastrd","bastard","blowjob","handjob","jerk","wank","masturb",
      "nigg","ngr","fag","fgt","retard","retrd","rtrd","spic","chink","kike",
      "wetback","trann","tranny","gook","jap","beaner","cracker","honky",
      "dyke","queer","homo","kill","hitler","heil","nazi","isis","kkk",
      "lynch","rape","rpe","jihad","azz","azs","biotch","b1tch","b!tch"
    ];
    var leet = { "0":"o","1":"i","!":"i","|":"i","3":"e","4":"a","@":"a","5":"s","$":"s","7":"t","+":"t","8":"b","9":"g" };
    function norm(value) {
      var input = String(value == null ? "" : value).toLowerCase();
      var out = "";
      for (var i = 0; i < input.length; i++) {
        var ch = input[i];
        if (leet[ch]) out += leet[ch];
        else if (ch >= "a" && ch <= "z") out += ch;
      }
      return out;
    }
    function pii(value) {
      var s = String(value == null ? "" : value).trim();
      return /@/.test(s) ||
        /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(s) ||
        /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(s) ||
        /\b(?:19|20)\d{2}\b/.test(s) ||
        /\b(?:snap|tiktok|insta|discord|gmail|email|phone|address)\b/i.test(s);
    }
    function blockedName(value) {
      var n = norm(value);
      if (!n) return false;
      for (var i = 0; i < blocked.length; i++) {
        if (n.indexOf(blocked[i]) !== -1) return true;
      }
      return pii(value);
    }
    function hash(value) {
      var h = 2166136261;
      var s = String(value == null ? "" : value);
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h >>> 0;
    }
    function profileSeed() {
      try {
        if (root.MrMacsProfile && root.MrMacsProfile.get) {
          var p = root.MrMacsProfile.get();
          if (p && p.id) return "profile:" + p.id;
        }
      } catch (e) {}
      try {
        var sid = root.localStorage && root.localStorage.getItem("arcade.nameSafety.seed");
        if (!sid) {
          sid = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
          root.localStorage.setItem("arcade.nameSafety.seed", sid);
        }
        return "browser:" + sid;
      } catch (e) {}
      return "session:" + Math.random();
    }
    function sanitizeDisplayName(value, fallback) {
      if (blockedName(value)) return fallback || "PLAYER";
      var clean = String(value == null ? "" : value).replace(/[^\w .'-]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
      return (!clean || blockedName(clean)) ? (fallback || "PLAYER") : clean;
    }
    function sanitizeInitials(value, fallback) {
      var clean = String(value == null ? "" : value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
      return (!clean || blockedName(clean)) ? (fallback || "PLR") : clean;
    }
    function sanitizeHandle(value, fallback) {
      if (blockedName(value)) return fallback || "PLAYER-000";
      var clean = String(value == null ? "" : value).toUpperCase().replace(/[^A-Z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 14);
      return (clean.length < 3 || !/\d/.test(clean) || blockedName(clean)) ? (fallback || "PLAYER-000") : clean;
    }
    function generatedHandle(seed) {
      var words = ["NOVA","PIXEL","QUEST","ATLAS","ORBIT","LASER","TURBO","VOLT","COMET","NEON","VECTOR","ARCADE"];
      var h = hash(seed || profileSeed());
      return sanitizeHandle(words[h % words.length] + "-" + String((h % 900) + 100), "PLAYER-000");
    }
    function publicHandle() {
      try {
        var raw = root.localStorage && root.localStorage.getItem("arcade.globalLeaderboard.publicHandle.v1");
        if (raw) return sanitizeHandle(raw, "");
        var made = generatedHandle(profileSeed());
        root.localStorage.setItem("arcade.globalLeaderboard.publicHandle.v1", made);
        return made;
      } catch (e) {
        return generatedHandle(profileSeed());
      }
    }
    function publicClientId() {
      return "c" + hash(profileSeed() + ":public-leaderboard").toString(36);
    }
    root.MrMacsNameSafety = {
      normalizeForFilter: norm,
      isBlockedName: blockedName,
      sanitizeDisplayName: sanitizeDisplayName,
      sanitizeInitials: sanitizeInitials,
      sanitizeHandle: sanitizeHandle,
      generatedHandle: generatedHandle,
      publicHandle: publicHandle,
      publicClientId: publicClientId,
      setPublicHandle: function (handle) {
        var clean = sanitizeHandle(handle, "");
        if (!clean) return "";
        try { root.localStorage.setItem("arcade.globalLeaderboard.publicHandle.v1", clean); } catch (e) {}
        return clean;
      },
      addBlockedTerm: function (term) {
        var clean = norm(term);
        if (!clean || blocked.indexOf(clean) !== -1) return false;
        blocked.push(clean);
        return true;
      },
      hasPiiShape: pii
    };
    return root.MrMacsNameSafety;
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

  // ── Feature 4: Optional global leaderboard bridge ─────────────────
  // Static GitHub Pages cannot store cross-device high scores by itself.
  // This bridge is endpoint-driven: when a teacher sets a vetted HTTPS
  // endpoint, scores post there; otherwise they are queued locally and all
  // existing local leaderboards keep working offline.
  function installGlobalLeaderboards() {
    var Safety = ensureNameSafety();
    var CONFIG_KEY = "arcade.globalLeaderboard.config.v1";
    var QUEUE_KEY = "arcade.globalLeaderboard.queue.v1";
    var CACHE_KEY = "arcade.globalLeaderboard.cache.v1";
    var STYLE_ID = "arcade-global-leaderboard-styles";
    var QUEUE_LIMIT = 40;
    var CACHE_TTL = 5 * 60 * 1000;

    function readJson(key, fallback) {
      try {
        var raw = root.localStorage && root.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    }

    function writeJson(key, value) {
      try {
        if (!root.localStorage) return false;
        root.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    }

    function endpointFromConfig() {
      var fromGlobal = "";
      try { fromGlobal = String(root.MR_MACS_GLOBAL_LEADERBOARD_ENDPOINT || ""); } catch (e) {}
      var cfg = readJson(CONFIG_KEY, {});
      var raw = fromGlobal || (cfg && cfg.endpoint) || "";
      var endpoint = String(raw || "").trim().replace(/\/+$/, "");
      if (!/^https:\/\//i.test(endpoint) && !/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(endpoint)) return "";
      return endpoint;
    }

    function setEndpoint(endpoint) {
      var clean = String(endpoint || "").trim().replace(/\/+$/, "");
      if (clean && !/^https:\/\//i.test(clean) && !/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(clean)) return false;
      writeJson(CONFIG_KEY, { endpoint: clean, updatedAt: Date.now() });
      if (clean) flushQueue();
      return true;
    }

    function scoresUrl(gameId, limit) {
      var base = endpointFromConfig();
      if (!base) return "";
      var q = "?gameId=" + encodeURIComponent(safeGameId(gameId)) +
        "&limit=" + encodeURIComponent(Math.max(1, Math.min(25, Number(limit) || 10)));
      return (/\/scores$/i.test(base) ? base : base + "/scores") + q;
    }

    function submitUrl() {
      var base = endpointFromConfig();
      if (!base) return "";
      return /\/scores$/i.test(base) ? base : base + "/scores";
    }

    function safeMeta(meta) {
      var allowed = ["course","mode","accuracy","durationMs","rounds","wave","level","source","date","gameType"];
      var out = {};
      if (!meta || typeof meta !== "object") return out;
      allowed.forEach(function (key) {
        var value = meta[key];
        if (value == null) return;
        if (typeof value === "number" && isFinite(value)) out[key] = value;
        else if (typeof value === "boolean") out[key] = value;
        else if (typeof value === "string") out[key] = Safety.sanitizeDisplayName(value, "").slice(0, 40);
      });
      return out;
    }

    function normalizeScorePayload(arg1, arg2, arg3) {
      var gameId, score, meta;
      if (arg1 && typeof arg1 === "object" && !Array.isArray(arg1)) {
        gameId = arg1.gameId;
        score = arg1.score;
        meta = arg1.meta;
      } else {
        gameId = arg1;
        score = arg2;
        meta = arg3;
      }
      var id = safeGameId(gameId);
      var n = Number(score);
      if (!id || !isFinite(n)) return null;
      return {
        gameId: id,
        score: Math.round(n),
        displayName: Safety.publicHandle(),
        clientId: Safety.publicClientId(),
        meta: safeMeta(meta),
        submittedAt: Date.now()
      };
    }

    function readQueue() {
      var q = readJson(QUEUE_KEY, []);
      return Array.isArray(q) ? q : [];
    }

    function writeQueue(q) {
      writeJson(QUEUE_KEY, (Array.isArray(q) ? q : []).slice(-QUEUE_LIMIT));
    }

    function queueEntry(entry) {
      var q = readQueue();
      q.push(entry);
      writeQueue(q);
      return q.length;
    }

    function cacheKey(gameId) {
      return safeGameId(gameId) || "unknown";
    }

    function sanitizeRows(rows) {
      if (!Array.isArray(rows)) return [];
      return rows.map(function (row) {
        return {
          rank: Number(row.rank) || 0,
          displayName: Safety.sanitizeHandle(row.displayName || row.name, "PLAYER-000"),
          score: Math.round(Number(row.score) || 0),
          ts: Number(row.ts || row.submittedAt || 0) || 0,
          gameId: safeGameId(row.gameId || "")
        };
      }).filter(function (row) {
        return row.displayName && isFinite(row.score);
      }).slice(0, 25);
    }

    function readCache(gameId) {
      var cache = readJson(CACHE_KEY, {});
      var hit = cache[cacheKey(gameId)];
      if (!hit || !Array.isArray(hit.rows)) return [];
      return hit.rows;
    }

    function writeCache(gameId, rows) {
      var cache = readJson(CACHE_KEY, {});
      cache[cacheKey(gameId)] = { ts: Date.now(), rows: sanitizeRows(rows) };
      writeJson(CACHE_KEY, cache);
    }

    function cacheFresh(gameId) {
      var cache = readJson(CACHE_KEY, {});
      var hit = cache[cacheKey(gameId)];
      return !!(hit && hit.ts && Date.now() - hit.ts < CACHE_TTL);
    }

    function fallbackRows(gameId, limit) {
      var rows = [];
      try {
        if (root.MrMacsLeaderboards && root.MrMacsLeaderboards.top) {
          rows = root.MrMacsLeaderboards.top(gameId, limit || 10) || [];
        }
      } catch (e) { rows = []; }
      return rows.map(function (row, idx) {
        return {
          rank: idx + 1,
          displayName: Safety.sanitizeHandle(row.displayName || row.name || Safety.publicHandle(), Safety.publicHandle()),
          score: Math.round(Number(row.score) || 0),
          ts: Number(row.ts || 0) || 0,
          gameId: safeGameId(gameId)
        };
      });
    }

    function postEntry(entry) {
      var url = submitUrl();
      if (!url || !root.fetch) {
        queueEntry(entry);
        return Promise.resolve({ ok: false, queued: true, reason: "no-endpoint" });
      }
      return root.fetch(url, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry)
      }).then(function (response) {
        if (!response.ok) throw new Error("global leaderboard " + response.status);
        return response.json();
      }).then(function (payload) {
        if (payload && Array.isArray(payload.top)) writeCache(entry.gameId, payload.top);
        return { ok: true, payload: payload };
      }).catch(function () {
        queueEntry(entry);
        return { ok: false, queued: true, reason: "network" };
      });
    }

    function submit(arg1, arg2, arg3) {
      var entry = normalizeScorePayload(arg1, arg2, arg3);
      if (!entry) return Promise.resolve({ ok: false, reason: "invalid" });
      return postEntry(entry);
    }

    function flushQueue() {
      var q = readQueue();
      var url = submitUrl();
      if (!q.length || !url || !root.fetch) return Promise.resolve({ ok: false, remaining: q.length });
      var remaining = [];
      var chain = Promise.resolve();
      q.forEach(function (entry) {
        chain = chain.then(function () {
          return root.fetch(url, {
            method: "POST",
            mode: "cors",
            cache: "no-store",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(entry)
          }).then(function (response) {
            if (!response.ok) throw new Error("global leaderboard " + response.status);
            return response.json();
          }).then(function (payload) {
            if (payload && Array.isArray(payload.top)) writeCache(entry.gameId, payload.top);
          }).catch(function () {
            remaining.push(entry);
          });
        });
      });
      return chain.then(function () {
        writeQueue(remaining);
        return { ok: remaining.length === 0, remaining: remaining.length };
      });
    }

    function top(gameId, limit) {
      var id = safeGameId(gameId);
      if (!id) return Promise.resolve([]);
      var url = scoresUrl(id, limit || 10);
      if (!url || !root.fetch) return Promise.resolve(readCache(id).concat(fallbackRows(id, limit)).slice(0, limit || 10));
      if (cacheFresh(id)) return Promise.resolve(readCache(id).slice(0, limit || 10));
      return root.fetch(url, { cache: "no-store", mode: "cors" })
        .then(function (response) {
          if (!response.ok) throw new Error("global leaderboard " + response.status);
          return response.json();
        })
        .then(function (payload) {
          var rows = sanitizeRows((payload && (payload.rows || payload.top)) || []);
          writeCache(id, rows);
          return rows.slice(0, limit || 10);
        })
        .catch(function () {
          var cached = readCache(id);
          return (cached.length ? cached : fallbackRows(id, limit)).slice(0, limit || 10);
        });
    }

    function injectGlobalStyles() {
      if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
      var css =
        ".mglb-board{margin-top:10px;color:inherit;font-family:inherit;}\n" +
        ".mglb-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 8px;font-family:'Fraunces',serif;font-style:italic;font-size:14px;color:#f5f7fb;}\n" +
        ".mglb-status{font:700 9px/1 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#7af0ff;}\n" +
        ".mglb-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}\n" +
        ".mglb-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:7px 10px;border:1px solid rgba(122,240,255,.12);background:rgba(0,0,0,.22);border-radius:8px;}\n" +
        ".mglb-rank{font:800 12px/1 'JetBrains Mono',monospace;color:#ffd060;min-width:28px;}\n" +
        ".mglb-name{font:800 12px/1.15 'JetBrains Mono',monospace;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#f0f5ff;}\n" +
        ".mglb-score{font:800 12px/1 'JetBrains Mono',monospace;color:#7af0ff;font-variant-numeric:tabular-nums;}\n" +
        ".mglb-empty{padding:10px 12px;border:1px dashed rgba(122,240,255,.22);border-radius:8px;color:rgba(216,220,235,.72);font:600 12px/1.4 'Inter',sans-serif;}\n";
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.appendChild(doc.createTextNode(css));
      doc.head.appendChild(style);
    }

    function renderGlobalLeaderboard(gameId, container, titleResolver) {
      var target = resolveContainer(container);
      if (!target) return Promise.resolve([]);
      injectGlobalStyles();
      var id = safeGameId(gameId);
      var title = (typeof titleResolver === "function") ? titleResolver(id) : "Global Leaderboard";
      target.innerHTML = '<section class="mglb-board"><h3 class="mglb-head"><span>' + escapeHtml(title || "Global Leaderboard") + '</span><span class="mglb-status">loading</span></h3><div class="mglb-empty">Checking global scores...</div></section>';
      return top(id, 5).then(function (rows) {
        var connected = !!endpointFromConfig();
        var status = connected ? "global" : "local queue";
        if (!rows.length) {
          target.innerHTML = '<section class="mglb-board"><h3 class="mglb-head"><span>' + escapeHtml(title || "Global Leaderboard") + '</span><span class="mglb-status">' + status + '</span></h3><div class="mglb-empty">' +
            (connected ? "No global scores yet." : "Global endpoint is not configured yet. Scores stay local and queue safely.") +
            '</div></section>';
          return rows;
        }
        var html = '<section class="mglb-board"><h3 class="mglb-head"><span>' + escapeHtml(title || "Global Leaderboard") + '</span><span class="mglb-status">' + status + '</span></h3><ol class="mglb-list">';
        rows.slice(0, 5).forEach(function (row, idx) {
          html += '<li class="mglb-row"><span class="mglb-rank">#' + (idx + 1) + '</span><span class="mglb-name">' +
            escapeHtml(row.displayName || "PLAYER-000") + '</span><span class="mglb-score">' + formatNumber(row.score) + '</span></li>';
        });
        html += '</ol></section>';
        target.innerHTML = html;
        return rows;
      });
    }

    function dispatchScore(detail) {
      try {
        if (root.dispatchEvent && root.CustomEvent) {
          root.dispatchEvent(new root.CustomEvent("mrmacs:score-submit", { detail: detail }));
        }
      } catch (e) {}
    }

    function installSubmitHook() {
      var L = root.MrMacsLeaderboards;
      if (!L || typeof L.submit !== "function" || L.__mrMacsGlobalHook) return false;
      var original = L.submit;
      L.submit = function () {
        var payload = normalizeScorePayload(arguments[0], arguments[1], arguments[2]);
        var result = original.apply(this, arguments);
        if (payload) {
          dispatchScore({ gameId: payload.gameId, score: payload.score, meta: payload.meta, result: result || null });
          submit(payload);
        }
        return result;
      };
      L.__mrMacsGlobalHook = true;
      return true;
    }

    root.MrMacsGlobalLeaderboards = root.MrMacsGlobalLeaderboards || {
      configured: function () { return !!endpointFromConfig(); },
      endpoint: endpointFromConfig,
      setEndpoint: setEndpoint,
      submit: submit,
      top: top,
      flushQueue: flushQueue,
      queueSize: function () { return readQueue().length; },
      publicHandle: function () { return Safety.publicHandle(); },
      setPublicHandle: function (handle) { return Safety.setPublicHandle(handle); },
      renderGlobalLeaderboard: renderGlobalLeaderboard,
      installSubmitHook: installSubmitHook
    };
    root.MrMacsGlobalLeaderboards.installSubmitHook();
    return root.MrMacsGlobalLeaderboards;
  }

  function bootstrapActiveMultiplayerRoom() {
    if (!doc || !doc.body || !doc.body.hasAttribute("data-game-page")) return;
    if (root.MrMacsMultiplayer) {
      try { root.MrMacsMultiplayer.mountGameRoomStrip(); } catch (e) {}
      return;
    }
    var active = null;
    try { active = sessionStorage.getItem("arcade.mp.activeRoom.v1"); } catch (e) { active = null; }
    if (!active) return;
    var base = scriptSrc ? scriptSrc.replace(/arcade-progress-extras\.js(?:\?.*)?$/i, "") : "../../assets/";
    var peerSrc = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
    function loadScript(src, done) {
      var existing = Array.prototype.slice.call(doc.scripts || []).some(function (s) {
        return s && s.src && s.src.indexOf(src.replace(/\?.*$/, "")) !== -1;
      });
      if (existing) { done(); return; }
      var script = doc.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = done;
      script.onerror = function () {};
      (doc.head || doc.documentElement).appendChild(script);
    }
    loadScript(peerSrc, function () {
      loadScript(base + "arcade-multiplayer.js?v=20260516-hash-digits", function () {
        try {
          if (root.MrMacsMultiplayer && root.MrMacsMultiplayer.mountGameRoomStrip) {
            root.MrMacsMultiplayer.mountGameRoomStrip();
          }
        } catch (e) {}
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────
  function initialize() {
    if (doc && doc.head) injectStyles();
    // Prune session entries on first run so listAll/load are clean.
    try { ssReadAll(); } catch (e) {}
    try { bootstrapActiveMultiplayerRoom(); } catch (e) {}
  }

  if (doc && doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else if (doc) {
    initialize();
  }

  // ── Public API ───────────────────────────────────────────────────
  // IMPORTANT: only assign MrMacsLeaderboards if the canonical
  // arcade-leaderboards.js hasn't already populated it. The canonical
  // module is far richer (admin mode, content filter, deleteEntry, etc.).
  // Previously this file's slim 6-method stub was unconditionally
  // overwriting the canonical module — which silently stripped the
  // delete/filter/admin APIs from the platform.
  if (!root.MrMacsLeaderboards) {
    root.MrMacsLeaderboards = {
      submit: lbSubmit,
      top: lbTop,
      best: lbBest,
      clearAll: lbClearAll,
      // Hub helper, not strictly part of the contract but handy:
      topScoresForPlayer: topScoresForPlayer,
      renderDrawerTopScores: renderDrawerTopScores
    };
  } else {
    // Canonical module already loaded — augment with the hub helper
    // (which only this file defines) but DO NOT touch the rest.
    if (typeof root.MrMacsLeaderboards.topScoresForPlayer !== "function") {
      root.MrMacsLeaderboards.topScoresForPlayer = topScoresForPlayer;
    }
  }

  installGlobalLeaderboards();

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
