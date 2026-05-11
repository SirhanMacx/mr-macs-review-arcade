/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · per-game leaderboards (local-first, multi-profile)
   ──────────────────────────────────────────────────────────────────────
   A self-contained leaderboard module that persists scores to
   localStorage. No network. Works offline. Multi-profile aware:
   each entry is stamped with the active MrMacsProfile id, name, and
   avatar at submission time so the board reads the same even if a
   player later renames or rebrands.

   "Personal best" = best score for the active profile.
   "Device best"   = best score across every profile on this browser.
   The top-N "device leaderboard" merges all profiles on this device.

   Public API
   ──────────
     window.MrMacsLeaderboards.submit(arg1, arg2, arg3)
        Two calling conventions are supported (existing games use the
        positional form; new code may prefer the object form):

          // object form (preferred)
          submit({ gameId, score, displayName, meta })
            -> { isPersonalBest, isDeviceBest, rank, top5,
                 isNewRecord,                       // alias for isDeviceBest
                 displaced                          // entry that fell off cap, if any
               }

          // positional form (legacy)
          submit(gameId, score, meta)
            -> same shape

        If no profile exists, returns null (skips, does not create
        an entry).

     window.MrMacsLeaderboards.top(gameId, n=5)
        -> [{ profileId, displayName, name, avatar, score, ts, meta }]
           Sorted high → low. `name` is kept as an alias of
           `displayName` so existing renderers keep working.

     window.MrMacsLeaderboards.personalBest(gameId)
        -> { score, ts, meta } | null  (active profile only)

     window.MrMacsLeaderboards.best(gameId, displayName)
        -> { score, ts, meta } | null  (legacy lookup by name)

     window.MrMacsLeaderboards.allEntries(gameId)
        -> [...]  every entry stored for this gameId, sorted high → low

     window.MrMacsLeaderboards.topGames(n=5)
        -> [{ gameId, plays, bestScore }]  active profile only

     window.MrMacsLeaderboards.renderDrawerTopScores(titleResolver)
        Writes top-3 cross-game best scores for the active profile into
        a section in #profileDrawer. titleResolver(gameId) -> string.

     window.MrMacsLeaderboards.renderGameLeaderboard(gameId, containerEl, titleResolver)
        Writes the device top-5 for the given game into containerEl.

     window.MrMacsLeaderboards.resetForGame(gameId)
     window.MrMacsLeaderboards.resetAll({ confirm: true })
     window.MrMacsLeaderboards.clearAll()                  // alias for resetAll({confirm:true})

     window.MrMacsLeaderboards.on(event, handler)
     window.MrMacsLeaderboards.off(event, handler)
        Events: "submit" -> { gameId, score, isPB, isDB }
                "reset"  -> { gameId } | { gameId: "all" }

   Storage
   ───────
     LocalStorage key: mr-macs-arcade-leaderboards-v1
     Shape: { <gameId>: [ { profileId, displayName, avatar, score, ts, meta } ] }
     Sorted desc by score. Capped at 50 entries per game.

   A11y / motion
   ─────────────
     Renders semantic markup (ordered list with role + aria-label).
     No animations on insertion — static rendering only.

   Defensive
   ─────────
     · IIFE, idempotent: if MrMacsLeaderboards is already defined the
       module is a no-op (won't overwrite a sibling implementation).
     · All localStorage and DOM access is wrapped in try/catch.
     · Safe to load multiple times.
   ───────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsLeaderboards) return;

  var STORAGE_KEY  = "mr-macs-arcade-leaderboards-v1";
  var PER_GAME_CAP = 50;
  var TOP_N        = 5;
  var STYLE_ID     = "arcade-leaderboards-styles";

  // ── Storage ──────────────────────────────────────────────────────
  // ── Content filter — protects shared leaderboards from inappropriate
  //    names. Pattern: normalize the candidate (strip non-alpha, fold
  //    leet-speak digits to letters, lowercase), then test against a
  //    curated word-stem blocklist. If any stem matches as a substring,
  //    the name is rejected. We're strict by design: false positives are
  //    fine (the player gets "PLAYER") but false negatives are bad
  //    (an inappropriate name reaches teachers + students).
  //
  //    The list is intentionally compact: just stems, no plurals or
  //    variants needed (substring match handles those). Teachers can
  //    extend at runtime via MrMacsLeaderboards.addBlockedTerm("xxx").
  var BLOCKED_STEMS = [
    // sexual / explicit
    "fuck","fck","fuk","shit","sht","piss","cunt","cnt","dick","cock","cok",
    "pussy","pusy","penis","vagina","boob","tit","tts","anal","anus","ass",
    "arse","sex","porn","prn","cum","jizz","slut","whore","hoe","bitch",
    "btch","bastrd","bastard","blowjob","handjob","jerk","wank","masturb",
    // slurs (race / orientation / disability / religious)
    "nigg","ngr","fag","fgt","retard","retrd","rtrd","spic","chink","kike",
    "wetback","trann","tranny","gook","jap","beaner","cracker","honky",
    "dyke","queer","homo",
    // violence / extremist
    "kill","hitler","heil","nazi","isis","kkk","lynch","rape","rpe","jihad",
    // common substitutions
    "azz","azs","arsh","biotch","b1tch","b!tch"
  ];
  // Leet-fold map. Digits + symbols → likely letter.
  var LEET_MAP = { "0":"o","1":"i","!":"i","|":"i","3":"e","4":"a","@":"a","5":"s","$":"s","7":"t","+":"t","8":"b","9":"g" };
  function normalizeForFilter(s) {
    if (!s) return "";
    var out = "";
    var lower = String(s).toLowerCase();
    for (var i = 0; i < lower.length; i++) {
      var ch = lower[i];
      if (LEET_MAP[ch]) { out += LEET_MAP[ch]; continue; }
      if (ch >= "a" && ch <= "z") out += ch;
    }
    return out;
  }
  function isBlockedName(s) {
    var norm = normalizeForFilter(s);
    if (!norm) return false;
    for (var i = 0; i < BLOCKED_STEMS.length; i++) {
      if (norm.indexOf(BLOCKED_STEMS[i]) !== -1) return true;
    }
    return false;
  }
  function sanitizeDisplayName(s) {
    var trimmed = String(s || "").trim().slice(0, 24);
    if (!trimmed) return "PLAYER";
    if (isBlockedName(trimmed)) return "PLAYER";
    return trimmed;
  }
  function addBlockedTerm(stem) {
    var norm = normalizeForFilter(stem);
    if (!norm) return false;
    if (BLOCKED_STEMS.indexOf(norm) !== -1) return false;
    BLOCKED_STEMS.push(norm);
    // Persist custom adds so teachers' extensions survive reloads
    try {
      var raw = localStorage.getItem("arcade.lb.customBlocklist") || "[]";
      var custom = JSON.parse(raw);
      if (custom.indexOf(norm) === -1) custom.push(norm);
      localStorage.setItem("arcade.lb.customBlocklist", JSON.stringify(custom));
    } catch (e) {}
    return true;
  }
  // Load any persisted custom blocklist extensions on init
  try {
    var savedRaw = localStorage.getItem("arcade.lb.customBlocklist");
    if (savedRaw) {
      var savedCustom = JSON.parse(savedRaw);
      if (Array.isArray(savedCustom)) {
        for (var bi = 0; bi < savedCustom.length; bi++) {
          if (BLOCKED_STEMS.indexOf(savedCustom[bi]) === -1) {
            BLOCKED_STEMS.push(savedCustom[bi]);
          }
        }
      }
    }
  } catch (e) {}

  // ── Admin mode — visible iff URL param matches token, OR a previous
  //    visit set the admin flag in sessionStorage. Admin sees a delete
  //    button on every leaderboard row. The token is intentionally
  //    embedded in client code — this is a teacher-tool privacy model,
  //    not bank-grade auth. Change the token here when needed.
  var ADMIN_TOKEN = "mrmac-arcade-admin-2026";
  function isAdmin() {
    try {
      if (sessionStorage.getItem("arcade.lb.admin") === "1") return true;
    } catch (e) {}
    try {
      var params = new URLSearchParams(location.search);
      var t = params.get("admin");
      if (t && t === ADMIN_TOKEN) {
        try { sessionStorage.setItem("arcade.lb.admin", "1"); } catch (e) {}
        return true;
      }
    } catch (e) {}
    return false;
  }
  function adminLogout() {
    try { sessionStorage.removeItem("arcade.lb.admin"); } catch (e) {}
  }

  function readStore() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var obj = JSON.parse(raw);
      return (obj && typeof obj === "object" && !Array.isArray(obj)) ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(obj) {
    try {
      if (!root.localStorage) return false;
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj || {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function safeGameId(gameId) {
    return String(gameId == null ? "" : gameId).trim().slice(0, 80);
  }

  function nowTs() { return Date.now(); }

  // ── Profile bridge (read-only, all wrapped) ──────────────────────
  function activeProfileId() {
    try {
      if (root.MrMacsProfile && root.MrMacsProfile.roster &&
          typeof root.MrMacsProfile.roster.getActiveId === "function") {
        var id = root.MrMacsProfile.roster.getActiveId();
        if (id) return String(id);
      }
    } catch (e) {}
    return "";
  }

  function activeProfileName() {
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getName === "function") {
        var n = root.MrMacsProfile.getName();
        if (n) return String(n).slice(0, 24);
      }
    } catch (e) {}
    return "";
  }

  function activeProfileAvatar() {
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getAvatar === "function") {
        var a = root.MrMacsProfile.getAvatar();
        if (a && a.value) return String(a.value);
      }
    } catch (e) {}
    return "🎓";
  }

  function profileExists() {
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.exists === "function") {
        return !!root.MrMacsProfile.exists();
      }
    } catch (e) {}
    return !!activeProfileId();
  }

  // ── Event bus ────────────────────────────────────────────────────
  var listeners = {};

  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr || !arr.length) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (e) {}
    }
  }

  function on(event, handler) {
    if (typeof handler !== "function" || !event) return;
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }

  function off(event, handler) {
    var arr = listeners[event];
    if (!arr) return;
    if (!handler) { listeners[event] = []; return; }
    listeners[event] = arr.filter(function (h) { return h !== handler; });
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function sortDesc(list) {
    list.sort(function (a, b) {
      var sa = Number(a && a.score) || 0;
      var sb = Number(b && b.score) || 0;
      if (sb !== sa) return sb - sa;
      // Stable-ish tiebreak: older ts wins (preserves "first to score").
      return (Number(a && a.ts) || 0) - (Number(b && b.ts) || 0);
    });
    return list;
  }

  function readEntries(gameId) {
    var store = readStore();
    var list = store[gameId];
    if (!Array.isArray(list)) return [];
    // Defensive copy + filter malformed.
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e || typeof e !== "object") continue;
      var n = Number(e.score);
      if (!isFinite(n)) continue;
      out.push({
        profileId:   String(e.profileId || ""),
        displayName: String(e.displayName || e.name || "Trainer"),
        avatar:      String(e.avatar || "🎓"),
        score:       n,
        ts:          Number(e.ts) || 0,
        meta:        (e.meta && typeof e.meta === "object") ? e.meta : {}
      });
    }
    return sortDesc(out);
  }

  function writeEntries(gameId, list) {
    var store = readStore();
    store[gameId] = sortDesc(list).slice(0, PER_GAME_CAP);
    writeStore(store);
    return store[gameId];
  }

  function bestEntryForProfile(list, profileId) {
    if (!profileId) return null;
    var hit = null;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e && e.profileId === profileId) {
        if (!hit || e.score > hit.score) hit = e;
      }
    }
    return hit;
  }

  // Decorate top-N entries with a `name` alias so legacy renderers
  // (they read row.name + row.avatar) keep working unchanged.
  function decorateForLegacy(list) {
    return list.map(function (e) {
      return {
        profileId:   e.profileId,
        displayName: e.displayName,
        name:        e.displayName,        // legacy alias
        avatar:      e.avatar,
        score:       e.score,
        ts:          e.ts,
        meta:        e.meta
      };
    });
  }

  // ── submit() ─────────────────────────────────────────────────────
  // Supports both calling conventions:
  //   submit({ gameId, score, displayName, meta })
  //   submit(gameId, score, meta)
  function submit(arg1, arg2, arg3) {
    var gameId, score, displayName, meta;
    if (arg1 && typeof arg1 === "object" && !Array.isArray(arg1)) {
      gameId      = arg1.gameId;
      score       = arg1.score;
      displayName = arg1.displayName;
      meta        = arg1.meta;
    } else {
      gameId      = arg1;
      score       = arg2;
      displayName = undefined;
      meta        = arg3;
    }

    var id = safeGameId(gameId);
    if (!id) return null;
    var n = Number(score);
    if (!isFinite(n)) return null;

    if (!profileExists()) return null;

    var profileId = activeProfileId();
    if (!profileId) return null;

    var rawName = (displayName ? String(displayName) : "") || activeProfileName() || "Trainer";
    // Sanitize against content-filter blocklist + leet-speak normalization.
    // If the name is judged inappropriate, replace with "PLAYER" so the
    // score still posts (denying credit to the player creates worse UX
    // than silently scrubbing the name). Limit to 24 chars after sanitize.
    var name = sanitizeDisplayName(rawName);
    var avatar = activeProfileAvatar();

    var list = readEntries(id);
    var prevPB = bestEntryForProfile(list, profileId);
    var prevDB = list.length ? list[0] : null;

    var entry = {
      profileId:   profileId,
      displayName: name,
      avatar:      avatar,
      score:       n,
      ts:          nowTs(),
      meta:        (meta && typeof meta === "object") ? meta : {}
    };

    list.push(entry);
    sortDesc(list);

    var displaced = null;
    if (list.length > PER_GAME_CAP) {
      displaced = list.splice(PER_GAME_CAP, list.length - PER_GAME_CAP)[0] || null;
    }

    writeEntries(id, list);

    var rank = list.indexOf(entry) + 1;          // 1-based across all profiles
    var isPersonalBest = !prevPB || n > Number(prevPB.score || 0);
    var isDeviceBest   = !prevDB || n > Number(prevDB.score || 0);

    var top5 = decorateForLegacy(list.slice(0, TOP_N));

    var result = {
      isPersonalBest: isPersonalBest,
      isDeviceBest:   isDeviceBest,
      isNewRecord:    isDeviceBest,                  // legacy alias
      rank:           rank,
      top5:           top5,
      displaced:      displaced
    };

    emit("submit", { gameId: id, score: n, isPB: isPersonalBest, isDB: isDeviceBest });
    return result;
  }

  // ── Read API ─────────────────────────────────────────────────────
  function top(gameId, n) {
    var id = safeGameId(gameId);
    if (!id) return [];
    var lim = Math.max(1, Math.min(PER_GAME_CAP, Number(n) || TOP_N));
    return decorateForLegacy(readEntries(id).slice(0, lim));
  }

  function personalBest(gameId) {
    var id = safeGameId(gameId);
    if (!id) return null;
    var pid = activeProfileId();
    if (!pid) return null;
    var hit = bestEntryForProfile(readEntries(id), pid);
    if (!hit) return null;
    return { score: hit.score, ts: hit.ts || 0, meta: hit.meta || {} };
  }

  // Legacy lookup-by-name (preserves arcade-progress-extras.js contract).
  function bestByName(gameId, displayName) {
    var id = safeGameId(gameId);
    if (!id) return null;
    var who = String(displayName || "").trim();
    if (!who) return null;
    var list = readEntries(id);
    var hit = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].displayName === who && (!hit || list[i].score > hit.score)) {
        hit = list[i];
      }
    }
    if (!hit) return null;
    return { score: hit.score, ts: hit.ts || 0, meta: hit.meta || {} };
  }

  function allEntries(gameId) {
    var id = safeGameId(gameId);
    if (!id) return [];
    return decorateForLegacy(readEntries(id));
  }

  // Top games by play-count for the active profile. "plays" counts
  // every submitted entry (a proxy for plays); "bestScore" is that
  // profile's PB for the game.
  function topGames(n) {
    var pid = activeProfileId();
    if (!pid) return [];
    var lim = Math.max(1, Math.min(50, Number(n) || TOP_N));
    var store = readStore();
    var rows = [];
    Object.keys(store).forEach(function (gameId) {
      var list = Array.isArray(store[gameId]) ? store[gameId] : [];
      var plays = 0;
      var bestScore = 0;
      var seenAny = false;
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (!e || e.profileId !== pid) continue;
        plays += 1;
        var s = Number(e.score) || 0;
        if (!seenAny || s > bestScore) bestScore = s;
        seenAny = true;
      }
      if (seenAny) rows.push({ gameId: gameId, plays: plays, bestScore: bestScore });
    });
    rows.sort(function (a, b) {
      if (b.plays !== a.plays) return b.plays - a.plays;
      return b.bestScore - a.bestScore;
    });
    return rows.slice(0, lim);
  }

  // ── Reset ────────────────────────────────────────────────────────
  function resetForGame(gameId) {
    var id = safeGameId(gameId);
    if (!id) return;
    var store = readStore();
    if (Object.prototype.hasOwnProperty.call(store, id)) {
      delete store[id];
      writeStore(store);
      emit("reset", { gameId: id });
    }
  }

  // ── deleteEntry() — admin-only surgical removal of a single row.
  //    Identifies by profileId + ts (timestamp), which together are
  //    unique within a gameId's list. Returns true on success.
  function deleteEntry(gameId, profileId, ts) {
    if (!isAdmin()) return false;
    var id = safeGameId(gameId);
    if (!id) return false;
    var list = readEntries(id);
    var before = list.length;
    var filtered = list.filter(function (e) {
      return !(e.profileId === profileId && e.ts === ts);
    });
    if (filtered.length === before) return false;
    writeEntries(id, filtered);
    emit("deleteEntry", { gameId: id, profileId: profileId, ts: ts });
    return true;
  }

  function resetAll(opts) {
    if (!opts || opts.confirm !== true) return false;
    writeStore({});
    emit("reset", { gameId: "all" });
    return true;
  }

  // ── Render styling ───────────────────────────────────────────────
  function injectStyles() {
    try {
      if (!document || !document.head) return;
      if (document.getElementById(STYLE_ID)) return;
      var css =
        ".mml-board{font-family:inherit;color:inherit;}\n" +
        ".mml-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}\n" +
        ".mml-row{display:grid;grid-template-columns:auto auto 1fr auto auto;align-items:center;gap:10px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);}\n" +
        ".mml-row.is-self{background:rgba(245,196,81,.10);border-color:rgba(245,196,81,.34);}\n" +
        ".mml-rank{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;font-weight:600;font-size:12px;letter-spacing:.05em;min-width:1.8em;text-align:right;color:#aab2c6;}\n" +
        ".mml-rank.is-1{color:#f5c451;text-shadow:0 0 8px rgba(245,196,81,.45);}\n" +
        ".mml-rank.is-2{color:#cfd6e4;}\n" +
        ".mml-rank.is-3{color:#cd7f32;}\n" +
        ".mml-avatar{width:1.4em;height:1.4em;display:inline-grid;place-items:center;font-size:14px;line-height:1;}\n" +
        ".mml-name{font-size:13px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\n" +
        ".mml-row.is-self .mml-name{color:#ffd884;font-weight:600;}\n" +
        ".mml-score{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;font-weight:600;font-size:13px;color:#f0f3fa;}\n" +
        ".mml-when{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#7d869b;font-variant-numeric:tabular-nums;}\n" +
        ".mml-empty{padding:10px 12px;color:#9aa3bb;font-size:12.5px;font-style:italic;}\n" +
        ".mml-head{font-family:'Fraunces',serif;font-style:italic;font-size:14px;color:#f5f7fb;margin:0 0 8px 0;}\n" +
        ".mml-admin-flag{display:inline-block;margin-left:8px;padding:2px 6px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.18em;font-weight:700;color:#ff8a8a;background:rgba(255,56,88,.12);border:1px solid rgba(255,56,88,.5);border-radius:3px;vertical-align:middle;font-style:normal;}\n" +
        ".mml-admin-del{appearance:none;border:1px solid rgba(255,56,88,.55);background:rgba(255,56,88,.10);color:#ff9aa8;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;width:24px;height:24px;line-height:1;border-radius:5px;cursor:pointer;display:inline-grid;place-items:center;transition:background 120ms,transform 120ms;}\n" +
        ".mml-admin-del:hover,.mml-admin-del:focus-visible{background:rgba(255,56,88,.28);outline:none;transform:scale(1.08);}\n";
      var style = document.createElement("style");
      style.id = STYLE_ID;
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    } catch (e) {}
  }

  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[<>&"']/g, function (c) {
      return c === "<" ? "&lt;" :
             c === ">" ? "&gt;" :
             c === "&" ? "&amp;" :
             c === "\"" ? "&quot;" : "&#39;";
    });
  }

  function relTime(ts) {
    var t = Number(ts) || 0;
    if (!t) return "";
    var diff = Math.max(0, nowTs() - t);
    var s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    var m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    var d = Math.floor(h / 24);
    if (d < 7) return d + "d ago";
    var w = Math.floor(d / 7);
    if (w < 5) return w + "w ago";
    var mo = Math.floor(d / 30);
    if (mo < 12) return mo + "mo ago";
    return Math.floor(d / 365) + "y ago";
  }

  function rowHtml(row, idx, activeId, gameIdForDelete) {
    var isSelf = activeId && row.profileId === activeId;
    var rankClass = "mml-rank";
    if (idx === 0) rankClass += " is-1";
    else if (idx === 1) rankClass += " is-2";
    else if (idx === 2) rankClass += " is-3";
    var rowClass = "mml-row" + (isSelf ? " is-self" : "");
    var adminBtn = "";
    if (gameIdForDelete && isAdmin()) {
      adminBtn = '<button type="button" class="mml-admin-del" ' +
                  'data-game-id="' + escHtml(gameIdForDelete) + '" ' +
                  'data-profile-id="' + escHtml(row.profileId || "") + '" ' +
                  'data-ts="' + Number(row.ts || 0) + '" ' +
                  'aria-label="Delete this entry (admin)" title="Delete entry">×</button>';
    }
    return '<li class="' + rowClass + '" role="listitem">' +
             '<span class="' + rankClass + '" aria-label="Rank ' + (idx + 1) + '">#' + (idx + 1) + '</span>' +
             '<span class="mml-avatar" aria-hidden="true">' + escHtml(row.avatar || "🎓") + '</span>' +
             '<span class="mml-name">' + escHtml(row.displayName || row.name || "Trainer") +
               (isSelf ? ' <span class="visually-hidden"> (you)</span>' : '') +
             '</span>' +
             '<span class="mml-score">' + Number(row.score || 0).toLocaleString() + '</span>' +
             '<span class="mml-when">' + escHtml(relTime(row.ts)) + '</span>' +
             adminBtn +
           '</li>';
  }

  // Render top-3 cross-game best scores into the profile drawer's
  // #pdTopScores slot, if it exists. Idempotent.
  function renderDrawerTopScores(titleResolver) {
    try {
      if (!document) return;
      injectStyles();
      var slot = document.getElementById("pdTopScores");
      if (!slot) return;
      var pid = activeProfileId();
      if (!pid) {
        slot.innerHTML = '<div class="mml-empty">Sign in or create a profile to track your scores.</div>';
        return;
      }
      var resolve = (typeof titleResolver === "function") ? titleResolver : function (g) { return g; };
      var store = readStore();
      var rows = [];
      Object.keys(store).forEach(function (gameId) {
        var list = Array.isArray(store[gameId]) ? store[gameId] : [];
        var best = null;
        for (var i = 0; i < list.length; i++) {
          var e = list[i];
          if (!e || e.profileId !== pid) continue;
          if (!best || Number(e.score || 0) > Number(best.score || 0)) best = e;
        }
        if (best) {
          rows.push({
            gameId: gameId,
            title: String(resolve(gameId) || gameId),
            score: Number(best.score) || 0,
            ts:    Number(best.ts) || 0,
            meta:  best.meta || {}
          });
        }
      });
      rows.sort(function (a, b) { return b.score - a.score; });
      rows = rows.slice(0, 3);

      if (!rows.length) {
        slot.innerHTML = '<div class="mml-empty">Play a flagship game to land your first top score.</div>';
        return;
      }

      var html = '<ol class="mml-list" role="list" aria-label="Your top scores">';
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var rankClass = "mml-rank" + (i === 0 ? " is-1" : i === 1 ? " is-2" : i === 2 ? " is-3" : "");
        html += '<li class="mml-row" role="listitem">' +
                  '<span class="' + rankClass + '" aria-label="Rank ' + (i + 1) + '">#' + (i + 1) + '</span>' +
                  '<span class="mml-avatar" aria-hidden="true">🏆</span>' +
                  '<span class="mml-name">' + escHtml(r.title) + '</span>' +
                  '<span class="mml-score">' + r.score.toLocaleString() + '</span>' +
                  '<span class="mml-when">' + escHtml(relTime(r.ts)) + '</span>' +
                '</li>';
      }
      html += '</ol>';
      slot.innerHTML = html;
    } catch (e) {}
  }

  // Render the device top-5 for one game into a container element.
  function renderGameLeaderboard(gameId, containerEl, titleResolver) {
    try {
      if (!containerEl || !containerEl.nodeType) return;
      injectStyles();
      var id = safeGameId(gameId);
      if (!id) { containerEl.innerHTML = ""; return; }
      var rows = top(id, TOP_N);
      var resolve = (typeof titleResolver === "function") ? titleResolver : function (g) { return g; };
      var title = String(resolve(id) || "Top scores");
      var pid = activeProfileId();

      if (!rows.length) {
        containerEl.innerHTML =
          '<section class="mml-board" aria-label="' + escHtml(title) + ' leaderboard">' +
            '<h3 class="mml-head">' + escHtml(title) + '</h3>' +
            '<div class="mml-empty">No high scores yet — set the first one!</div>' +
          '</section>';
        return;
      }

      var html =
        '<section class="mml-board" aria-label="' + escHtml(title) + ' leaderboard">' +
          '<h3 class="mml-head">' + escHtml(title) +
          (isAdmin() ? ' <span class="mml-admin-flag" title="Admin mode — delete buttons enabled">ADMIN</span>' : '') +
          '</h3>' +
          '<ol class="mml-list" role="list">';
      for (var i = 0; i < rows.length; i++) {
        html += rowHtml(rows[i], i, pid, id);
      }
      html += '</ol></section>';
      containerEl.innerHTML = html;

      // Wire admin delete clicks if any rendered
      if (isAdmin()) {
        var delBtns = containerEl.querySelectorAll(".mml-admin-del");
        for (var d = 0; d < delBtns.length; d++) {
          delBtns[d].addEventListener("click", function (e) {
            e.preventDefault(); e.stopPropagation();
            var btn = e.currentTarget;
            var ok = deleteEntry(btn.dataset.gameId, btn.dataset.profileId, Number(btn.dataset.ts));
            if (ok) {
              // Re-render the board so the row vanishes immediately
              renderGameLeaderboard(btn.dataset.gameId, containerEl, resolve);
            }
          });
        }
      }
    } catch (e) {}
  }

  // ── Init ─────────────────────────────────────────────────────────
  function initialize() {
    try { injectStyles(); } catch (e) {}
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
      initialize();
    }
  }

  // ── Public API ───────────────────────────────────────────────────
  root.MrMacsLeaderboards = {
    submit:                  submit,
    top:                     top,
    personalBest:            personalBest,
    best:                    bestByName,            // legacy lookup-by-name
    allEntries:              allEntries,
    topGames:                topGames,
    renderDrawerTopScores:   renderDrawerTopScores,
    renderGameLeaderboard:   renderGameLeaderboard,
    resetForGame:            resetForGame,
    resetAll:                resetAll,
    clearAll:                function () { return resetAll({ confirm: true }); },
    on:                      on,
    off:                     off,
    // Content-filter + admin (new)
    deleteEntry:             deleteEntry,
    isAdmin:                 isAdmin,
    adminLogout:             adminLogout,
    isBlockedName:           isBlockedName,
    sanitizeDisplayName:     sanitizeDisplayName,
    addBlockedTerm:          addBlockedTerm
  };
})(typeof window !== "undefined" ? window : this);
