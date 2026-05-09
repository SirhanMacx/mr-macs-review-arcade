/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · per-profile, per-game session snapshots
   ──────────────────────────────────────────────────────────────────────
   Local-first auto-resume layer. Every flagship game calls into this
   module to persist a JSON-serializable snapshot of its current run so
   a player can return mid-game (close tab, reload, switch device under
   the same profile, come back hours later — within TTL).

   Public API (window.MrMacsSessions):
     save(gameId, snapshot, opts?)  → boolean  (false on quota failure)
     load(gameId)                   → snapshot | null
     clear(gameId)                  → void
     clearAllForProfile()           → void
     listActive()                   → [{ gameId, savedAt, expiresAt, version }]
     decorateContinueCards(rootEl?) → number   (count of cards decorated)
     on(event, handler) / off(event, handler)

   Snapshot envelope persisted to localStorage:
     {
       v: 1,                  envelope version (this file)
       profileId: "...",      active profile id at save time
       gameId: "...",
       savedAt: <ms>,
       expiresAt: <ms>,       savedAt + ttlMs (default 7 days)
       schemaVersion: <int>,  game-defined; mismatch on load → null
       data: { ... }          arbitrary JSON-serializable game state
     }

   Storage key:    "mr-macs-arcade-sessions-v1"
   Storage shape:  { <profileId>: { <gameId>: <envelope> } }

   TTL: default 7 days. Override via save(gameId, snap, { ttlMs }).
   On load(), expired snapshots are auto-cleared.

   Profile awareness: snapshots are namespaced by the active profile id
   (window.MrMacsProfile.getActiveId() → fallback "anon"). Switching
   profiles silently swaps namespaces; old data stays under the old id.

   Quota safety: if setItem throws QuotaExceededError, the oldest
   snapshots across all profiles are pruned and the write is retried
   once. If still failing, save() returns false.

   Events emitted (subscribe via .on):
     "save"   { gameId, profileId }
     "load"   { gameId, profileId, hit }
     "clear"  { gameId | "all", profileId }

   Defensive: every localStorage call is try/wrapped; malformed entries
   are dropped silently; the module is idempotent on re-load.
   ─────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsSessions) return;

  var STORAGE_KEY = "mr-macs-arcade-sessions-v1";
  var ENVELOPE_VERSION = 1;
  var DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  var ANON_PROFILE = "anon";

  var listeners = Object.create(null);

  // ───────────── helpers ─────────────

  function now() {
    try { return Date.now(); } catch (e) { return 0; }
  }

  function getActiveProfileId() {
    try {
      var p = root.MrMacsProfile;
      if (p && typeof p.getActiveId === "function") {
        var id = p.getActiveId();
        if (id && typeof id === "string") return id;
      }
    } catch (e) {}
    return ANON_PROFILE;
  }

  function safeStorage() {
    try {
      if (typeof localStorage !== "undefined") return localStorage;
    } catch (e) {}
    return null;
  }

  function readAll() {
    var ls = safeStorage();
    if (!ls) return {};
    var raw = null;
    try { raw = ls.getItem(STORAGE_KEY); } catch (e) { return {}; }
    if (!raw) return {};
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // malformed root: drop it
      try { ls.removeItem(STORAGE_KEY); } catch (e2) {}
    }
    return {};
  }

  function writeAll(obj) {
    var ls = safeStorage();
    if (!ls) return false;
    var serialized;
    try { serialized = JSON.stringify(obj); } catch (e) { return false; }
    try {
      ls.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (e) {
      // Likely QuotaExceededError. Try one prune+retry.
      if (pruneOldest(obj)) {
        try {
          ls.setItem(STORAGE_KEY, JSON.stringify(obj));
          return true;
        } catch (e2) {}
      }
      return false;
    }
  }

  /**
   * Remove the oldest snapshot across the entire store. Mutates `obj`
   * in place. Returns true if something was removed, false if there
   * was nothing left to prune.
   */
  function pruneOldest(obj) {
    var oldestProfile = null;
    var oldestGame = null;
    var oldestTime = Infinity;
    for (var profileId in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, profileId)) continue;
      var games = obj[profileId];
      if (!games || typeof games !== "object") continue;
      for (var gameId in games) {
        if (!Object.prototype.hasOwnProperty.call(games, gameId)) continue;
        var env = games[gameId];
        var saved = (env && typeof env.savedAt === "number") ? env.savedAt : 0;
        if (saved < oldestTime) {
          oldestTime = saved;
          oldestProfile = profileId;
          oldestGame = gameId;
        }
      }
    }
    if (oldestProfile === null) return false;
    try {
      delete obj[oldestProfile][oldestGame];
      // clean empty profile bucket
      var bucket = obj[oldestProfile];
      var hasAny = false;
      for (var k in bucket) {
        if (Object.prototype.hasOwnProperty.call(bucket, k)) { hasAny = true; break; }
      }
      if (!hasAny) delete obj[oldestProfile];
    } catch (e) {
      return false;
    }
    return true;
  }

  function isValidEnvelope(env, expectedProfileId, expectedGameId) {
    if (!env || typeof env !== "object") return false;
    if (env.v !== ENVELOPE_VERSION) return false;
    if (typeof env.profileId !== "string") return false;
    if (typeof env.gameId !== "string") return false;
    if (typeof env.savedAt !== "number") return false;
    if (typeof env.expiresAt !== "number") return false;
    if (expectedProfileId && env.profileId !== expectedProfileId) return false;
    if (expectedGameId && env.gameId !== expectedGameId) return false;
    return true;
  }

  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr || !arr.length) return;
    // copy to avoid in-flight mutation
    var copy = arr.slice();
    for (var i = 0; i < copy.length; i++) {
      try { copy[i](payload); } catch (e) {}
    }
  }

  // ───────────── public API ─────────────

  function save(gameId, snapshot, opts) {
    if (typeof gameId !== "string" || !gameId) return false;
    var ttlMs = (opts && typeof opts.ttlMs === "number" && opts.ttlMs > 0)
      ? opts.ttlMs
      : DEFAULT_TTL_MS;
    var schemaVersion = (opts && typeof opts.schemaVersion === "number")
      ? opts.schemaVersion
      : 1;

    var profileId = getActiveProfileId();
    var savedAt = now();
    var envelope = {
      v: ENVELOPE_VERSION,
      profileId: profileId,
      gameId: gameId,
      savedAt: savedAt,
      expiresAt: savedAt + ttlMs,
      schemaVersion: schemaVersion,
      data: (snapshot === undefined) ? null : snapshot
    };

    // Verify it's serializable before mutating store
    try { JSON.stringify(envelope); } catch (e) { return false; }

    var all = readAll();
    if (!all[profileId] || typeof all[profileId] !== "object") {
      all[profileId] = {};
    }
    all[profileId][gameId] = envelope;

    var ok = writeAll(all);
    if (ok) emit("save", { gameId: gameId, profileId: profileId });
    return ok;
  }

  function load(gameId) {
    if (typeof gameId !== "string" || !gameId) return null;
    var profileId = getActiveProfileId();
    var all = readAll();
    var bucket = all[profileId];
    var env = (bucket && typeof bucket === "object") ? bucket[gameId] : null;

    var hit = false;
    var result = null;

    if (!isValidEnvelope(env, profileId, gameId)) {
      // malformed/missing → drop entry if present
      if (bucket && env !== undefined) {
        try { delete bucket[gameId]; writeAll(all); } catch (e) {}
      }
    } else if (env.expiresAt <= now()) {
      // expired → auto-clear
      try { delete bucket[gameId]; writeAll(all); } catch (e) {}
    } else {
      hit = true;
      result = env;
    }

    emit("load", { gameId: gameId, profileId: profileId, hit: hit });
    return hit ? result : null;
  }

  function clear(gameId) {
    if (typeof gameId !== "string" || !gameId) return;
    var profileId = getActiveProfileId();
    var all = readAll();
    var bucket = all[profileId];
    if (bucket && Object.prototype.hasOwnProperty.call(bucket, gameId)) {
      try { delete bucket[gameId]; } catch (e) {}
      // clean empty bucket
      var hasAny = false;
      for (var k in bucket) {
        if (Object.prototype.hasOwnProperty.call(bucket, k)) { hasAny = true; break; }
      }
      if (!hasAny) {
        try { delete all[profileId]; } catch (e) {}
      }
      writeAll(all);
    }
    emit("clear", { gameId: gameId, profileId: profileId });
  }

  function clearAllForProfile() {
    var profileId = getActiveProfileId();
    var all = readAll();
    if (Object.prototype.hasOwnProperty.call(all, profileId)) {
      try { delete all[profileId]; } catch (e) {}
      writeAll(all);
    }
    emit("clear", { gameId: "all", profileId: profileId });
  }

  function listActive() {
    var profileId = getActiveProfileId();
    var all = readAll();
    var bucket = all[profileId];
    var out = [];
    if (!bucket || typeof bucket !== "object") return out;

    var t = now();
    var dirty = false;

    for (var gameId in bucket) {
      if (!Object.prototype.hasOwnProperty.call(bucket, gameId)) continue;
      var env = bucket[gameId];
      if (!isValidEnvelope(env, profileId, gameId)) {
        try { delete bucket[gameId]; dirty = true; } catch (e) {}
        continue;
      }
      if (env.expiresAt <= t) {
        try { delete bucket[gameId]; dirty = true; } catch (e) {}
        continue;
      }
      out.push({
        gameId: env.gameId,
        savedAt: env.savedAt,
        expiresAt: env.expiresAt,
        version: env.schemaVersion
      });
    }

    if (dirty) writeAll(all);

    // newest first
    out.sort(function (a, b) { return b.savedAt - a.savedAt; });
    return out;
  }

  // ───────────── DOM decoration ─────────────

  function ensureBadgeStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("arcade-sessions-styles")) return;
    var style = document.createElement("style");
    style.id = "arcade-sessions-styles";
    style.textContent =
      ".continue-card.has-resume{position:relative;}" +
      ".continue-card .arcade-resume-pill{" +
        "position:absolute;top:8px;right:8px;" +
        "display:inline-flex;align-items:center;gap:4px;" +
        "padding:3px 9px;font:600 11px/1 system-ui,sans-serif;" +
        "letter-spacing:.04em;text-transform:uppercase;" +
        "color:#0b1020;background:linear-gradient(180deg,#ffe7a3,#f5c451);" +
        "border:1px solid rgba(0,0,0,.18);border-radius:999px;" +
        "box-shadow:0 4px 12px rgba(245,196,81,.35);" +
        "pointer-events:none;z-index:2;" +
      "}" +
      ".continue-card .arcade-resume-pill::before{" +
        "content:'';display:inline-block;width:6px;height:6px;border-radius:50%;" +
        "background:#1f8f4a;box-shadow:0 0 6px rgba(31,143,74,.7);" +
      "}";
    try {
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {}
  }

  function decorateContinueCards(rootEl) {
    if (typeof document === "undefined") return 0;
    ensureBadgeStyles();
    var scope = (rootEl && rootEl.querySelectorAll) ? rootEl : document;
    var cards;
    try {
      cards = scope.querySelectorAll(".continue-card[data-id]");
    } catch (e) {
      return 0;
    }
    var decorated = 0;
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var gameId = card.getAttribute("data-id");
      if (!gameId) continue;
      var snap = load(gameId);
      if (!snap) {
        // ensure card is clean if previously decorated
        if (card.classList.contains("has-resume")) {
          card.classList.remove("has-resume");
          var stale = card.querySelector(".arcade-resume-pill");
          if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
        }
        continue;
      }
      card.classList.add("has-resume");
      if (!card.querySelector(".arcade-resume-pill")) {
        var pill = document.createElement("span");
        pill.className = "arcade-resume-pill";
        pill.setAttribute("aria-label", "Saved game in progress — resume available");
        pill.textContent = "Resume";
        try { card.appendChild(pill); } catch (e) {}
      }
      decorated++;
    }
    return decorated;
  }

  // ───────────── event subscription ─────────────

  function on(event, handler) {
    if (typeof event !== "string" || typeof handler !== "function") return;
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }

  function off(event, handler) {
    var arr = listeners[event];
    if (!arr) return;
    if (!handler) { listeners[event] = []; return; }
    for (var i = arr.length - 1; i >= 0; i--) {
      if (arr[i] === handler) arr.splice(i, 1);
    }
  }

  // ───────────── export ─────────────

  root.MrMacsSessions = {
    save: save,
    load: load,
    clear: clear,
    clearAllForProfile: clearAllForProfile,
    listActive: listActive,
    decorateContinueCards: decorateContinueCards,
    on: on,
    off: off,
    // exposed for tests / tooling
    _STORAGE_KEY: STORAGE_KEY,
    _ENVELOPE_VERSION: ENVELOPE_VERSION,
    _DEFAULT_TTL_MS: DEFAULT_TTL_MS
  };
})(typeof window !== "undefined" ? window : this);
