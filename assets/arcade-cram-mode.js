/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · Cram Mode (game playlist sessions)
   ──────────────────────────────────────────────────────────────────────
   Cram Mode chains 3–5 review games into a single focused study
   session. The achievement registry already reserves the `cross-cram`
   "Cram Sesh" badge for completing a 4-game playlist; this module is
   what actually builds, runs, and tracks one.

   Public API (window.MrMacsCramMode):
     buildPlaylist({ course, topic, length=4, includeArcade=true })
       → { id, games:[{gameId,title,course,subject,reason}], createdAt }
     startSession(playlist) → { sessionId, currentIdx, completed:[] }
     getActiveSession()     → session | null
     advance()              → { sessionId, currentIdx, completed, finished }
     abandon()              → void
     getCompletedCount()    → number  (lifetime cram playlists finished)
     renderBuilder(container, opts) → void   playlist-config UI
     renderActiveBadge(container)   → void   floating "🎯 Cram · 2/4" pill
     on(event, handler) / off(event, handler)

   Storage key: "mr-macs-arcade-cram-v1" — { active, completedCount }
   Events: "build", "start", "advance", "finish", "abandon"

   Defensive throughout: MrMacsProfile, MrMacsArcade, GAMES, document,
   and localStorage are all guarded. Failures degrade silently.
   ───────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsCramMode) return;

  var STORAGE_KEY = "mr-macs-arcade-cram-v1";
  var SCHEMA_VERSION = 1;
  var MIN_LENGTH = 3;
  var MAX_LENGTH = 5;
  var DEFAULT_LENGTH = 4;

  var listeners = Object.create(null);

  // ───────────── helpers ─────────────

  function now() { try { return Date.now(); } catch (e) { return 0; } }

  function uid(prefix) {
    return (prefix || "id") + "-" + now().toString(36) + "-" +
      Math.floor(Math.random() * 0xffffff).toString(36);
  }

  function safeStorage() {
    try { if (typeof localStorage !== "undefined") return localStorage; } catch (e) {}
    return null;
  }

  function readStore() {
    var ls = safeStorage();
    var fallback = { active: null, completedCount: 0, v: SCHEMA_VERSION };
    if (!ls) return fallback;
    var raw = null;
    try { raw = ls.getItem(STORAGE_KEY); } catch (e) { return fallback; }
    if (!raw) return fallback;
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        if (typeof parsed.completedCount !== "number") parsed.completedCount = 0;
        if (parsed.active && typeof parsed.active !== "object") parsed.active = null;
        return parsed;
      }
    } catch (e) {
      try { ls.removeItem(STORAGE_KEY); } catch (e2) {}
    }
    return fallback;
  }

  function writeStore(obj) {
    var ls = safeStorage();
    if (!ls) return false;
    try { ls.setItem(STORAGE_KEY, JSON.stringify(obj)); return true; } catch (e) { return false; }
  }

  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr || !arr.length) return;
    var copy = arr.slice();
    for (var i = 0; i < copy.length; i++) { try { copy[i](payload); } catch (e) {} }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function prefersReducedMotion() {
    try { return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch (e) { return false; }
  }

  // ───────────── catalog access ─────────────

  function getGameCatalog() {
    try { if (Array.isArray(root.GAMES)) return root.GAMES; } catch (e) {}
    try {
      if (root.MrMacsArcade && Array.isArray(root.MrMacsArcade.games)) return root.MrMacsArcade.games;
    } catch (e) {}
    return [];
  }

  function matchesCourse(game, course) {
    if (!game || !course) return true;
    try {
      if (typeof root.gameMatchesEnrolledCourse === "function") {
        return !!root.gameMatchesEnrolledCourse(game, course);
      }
    } catch (e) {}
    if (!game.course) return false;
    if (game.course === "All Courses" || game.course === course) return true;
    if (typeof game.course === "string" && game.course.indexOf(" + ") !== -1) {
      var parts = game.course.split(" + ");
      for (var i = 0; i < parts.length; i++) if (parts[i].trim() === course) return true;
    }
    return false;
  }

  function matchesTopic(game, topic) {
    if (!topic) return true;
    var needle = String(topic).toLowerCase().trim();
    if (!needle) return true;
    var bits = [game.title, game.subject, game.unit, game.gameType];
    if (Array.isArray(game.tags)) bits.push(game.tags.join(" "));
    if (Array.isArray(game.categories)) bits.push(game.categories.join(" "));
    return bits.filter(Boolean).join(" ").toLowerCase().indexOf(needle) !== -1;
  }

  function gameTypeOf(game) { return String(game && game.gameType || "").toLowerCase(); }
  function titleOf(game) { return String(game && game.title || "").toLowerCase(); }

  function isJeopardy(g) { return /jeopardy/.test(gameTypeOf(g)); }
  function isSprint(g)   { return /(sprint|quick|rapid|flash)/.test(gameTypeOf(g) + " " + titleOf(g)); }
  function isSource(g)   { return /(source|document|primary)/.test(gameTypeOf(g) + " " + titleOf(g)); }
  function isArcadeFlagship(g) {
    if (!g) return false;
    if (g.course === "All Courses" || g.flagship === true) return true;
    return /(arcade|flagship|boss)/.test(gameTypeOf(g));
  }

  var SLOT_REASONS = {
    warmup: "Quick warmup",
    source: "Source-based reps",
    boss: "Boss-style review",
    arcade: "Cooldown arcade flagship",
    jeopardy: "Jeopardy round",
    "default": "Playlist pick"
  };

  function pickFirst(pool, used, predicate) {
    for (var i = 0; i < pool.length; i++) {
      var g = pool[i];
      if (!used[g.id] && predicate(g)) return g;
    }
    return null;
  }

  // ───────────── buildPlaylist ─────────────

  function buildPlaylist(opts) {
    opts = opts || {};
    var course = opts.course || null;
    var topic = opts.topic || null;
    var length = parseInt(opts.length, 10);
    if (!isFinite(length)) length = DEFAULT_LENGTH;
    if (length < MIN_LENGTH) length = MIN_LENGTH;
    if (length > MAX_LENGTH) length = MAX_LENGTH;
    var includeArcade = opts.includeArcade !== false;

    var catalog = getGameCatalog();
    var pool = [];
    for (var i = 0; i < catalog.length; i++) {
      var g = catalog[i];
      if (!g || !g.id) continue;
      if (course && !matchesCourse(g, course)) continue;
      if (topic && !matchesTopic(g, topic)) continue;
      pool.push(g);
    }

    pool.sort(function (a, b) {
      var at = topic ? (matchesTopic(a, topic) ? 0 : 1) : 0;
      var bt = topic ? (matchesTopic(b, topic) ? 0 : 1) : 0;
      if (at !== bt) return at - bt;
      return String(a.title || a.id).localeCompare(String(b.title || b.id));
    });

    var picked = [];
    var used = Object.create(null);

    function take(slot, predicate) {
      var g = pickFirst(pool, used, predicate);
      if (!g) return;
      used[g.id] = true;
      picked.push({
        gameId: g.id,
        title: g.title || g.id,
        course: g.course || "",
        subject: g.subject || g.unit || "",
        reason: SLOT_REASONS[slot] || SLOT_REASONS["default"]
      });
    }

    take("jeopardy", isJeopardy);
    take("warmup",   isSprint);
    take("source",   isSource);
    if (includeArcade) take("arcade", isArcadeFlagship);

    for (var j = 0; j < pool.length && picked.length < length; j++) {
      var cand = pool[j];
      if (used[cand.id]) continue;
      used[cand.id] = true;
      picked.push({
        gameId: cand.id,
        title: cand.title || cand.id,
        course: cand.course || "",
        subject: cand.subject || cand.unit || "",
        reason: SLOT_REASONS["default"]
      });
    }
    if (picked.length > length) picked = picked.slice(0, length);

    var playlist = {
      id: uid("cram"),
      games: picked,
      createdAt: now(),
      course: course || null,
      topic: topic || null
    };
    emit("build", { playlist: playlist });
    return playlist;
  }

  // ───────────── session API ─────────────

  function startSession(playlist) {
    if (!playlist || !Array.isArray(playlist.games) || !playlist.games.length) return null;
    var session = {
      sessionId: uid("cram-sess"),
      playlist: playlist,
      currentIdx: 0,
      completedGameIds: [],
      startedAt: now()
    };
    var store = readStore();
    store.active = session;
    writeStore(store);
    emit("start", { session: session });
    return { sessionId: session.sessionId, currentIdx: 0, completed: [] };
  }

  function getActiveSession() {
    var store = readStore();
    var s = store.active;
    if (!s) return null;
    if (!s.playlist || !Array.isArray(s.playlist.games)) {
      store.active = null; writeStore(store); return null;
    }
    return {
      sessionId: s.sessionId,
      currentIdx: s.currentIdx | 0,
      completed: (s.completedGameIds || []).slice(),
      playlist: s.playlist,
      startedAt: s.startedAt
    };
  }

  function advance() {
    var store = readStore();
    var s = store.active;
    if (!s || !s.playlist || !Array.isArray(s.playlist.games)) return null;

    var games = s.playlist.games;
    var idx = s.currentIdx | 0; if (idx < 0) idx = 0;
    var finishedGameId = null;
    if (idx < games.length) {
      finishedGameId = games[idx].gameId;
      if (!s.completedGameIds) s.completedGameIds = [];
      if (s.completedGameIds.indexOf(finishedGameId) === -1) s.completedGameIds.push(finishedGameId);
      s.currentIdx = idx + 1;
    }

    var finished = s.currentIdx >= games.length;
    var result = {
      sessionId: s.sessionId,
      currentIdx: s.currentIdx,
      completed: s.completedGameIds.slice(),
      finished: finished
    };

    if (finished) {
      store.completedCount = (store.completedCount | 0) + 1;
      var snap = {
        sessionId: s.sessionId,
        playlist: s.playlist,
        completed: s.completedGameIds.slice(),
        startedAt: s.startedAt,
        finishedAt: now()
      };
      store.active = null;
      writeStore(store);
      try {
        if (root.MrMacsProfile && typeof root.MrMacsProfile.unlock === "function" &&
            s.playlist.games.length >= 4) {
          root.MrMacsProfile.unlock("cross-cram");
        }
      } catch (e) {}
      emit("advance", { session: result, finishedGameId: finishedGameId });
      emit("finish", { session: snap });
    } else {
      store.active = s;
      writeStore(store);
      emit("advance", { session: result, finishedGameId: finishedGameId });
    }
    return result;
  }

  function abandon() {
    var store = readStore();
    var sessionId = store.active && store.active.sessionId;
    if (!store.active) return;
    store.active = null;
    writeStore(store);
    emit("abandon", { sessionId: sessionId });
  }

  function getCompletedCount() {
    return readStore().completedCount | 0;
  }

  // ───────────── styles ─────────────

  function ensureStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("arcade-cram-styles")) return;
    var pulse = prefersReducedMotion() ? "" :
      "@keyframes mmCramPulse{0%,100%{box-shadow:0 4px 14px rgba(255,140,60,.35);}50%{box-shadow:0 6px 22px rgba(255,140,60,.65);}}.mm-cram-badge{animation:mmCramPulse 2.4s ease-in-out infinite;}";
    var style = document.createElement("style");
    style.id = "arcade-cram-styles";
    style.textContent =
      ".mm-cram-builder{display:flex;flex-direction:column;gap:12px;color:#0b1020;font:14px/1.4 system-ui,sans-serif;}.mm-cram-builder h3{margin:0;font:700 18px/1.2 system-ui,sans-serif;letter-spacing:.01em;}.mm-cram-builder label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#384060;}.mm-cram-builder input,.mm-cram-builder select{padding:8px 10px;border:1px solid #c8cee2;border-radius:8px;font:14px system-ui,sans-serif;background:#fff;color:#0b1020;}.mm-cram-builder input[type=range]{padding:0;}.mm-cram-builder .mm-cram-row{display:flex;gap:8px;flex-wrap:wrap;}.mm-cram-builder button{padding:9px 14px;border:0;border-radius:999px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;}.mm-cram-builder .mm-cram-build{background:linear-gradient(180deg,#ffe7a3,#f5c451);color:#0b1020;}.mm-cram-builder .mm-cram-start{background:linear-gradient(180deg,#ff8c3c,#e95f1c);color:#fff;}.mm-cram-builder .mm-cram-start[disabled]{opacity:.4;cursor:not-allowed;}.mm-cram-preview{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;}.mm-cram-preview li{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#f5f6fb;border:1px solid #e1e4f0;border-radius:8px;font-size:13px;}.mm-cram-preview .mm-cram-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#0b1020;color:#fff;font:700 11px/1 system-ui,sans-serif;flex-shrink:0;}.mm-cram-preview .mm-cram-title{font-weight:600;color:#0b1020;}.mm-cram-preview .mm-cram-reason{margin-left:auto;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#5a6280;}.mm-cram-empty{padding:10px;border:1px dashed #c8cee2;border-radius:8px;font-size:13px;color:#5a6280;text-align:center;}.mm-cram-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:linear-gradient(180deg,#fff1d6,#ffd089);border:1px solid rgba(0,0,0,.18);color:#0b1020;font:700 13px/1 system-ui,sans-serif;letter-spacing:.04em;text-decoration:none;cursor:pointer;}.mm-cram-badge .mm-cram-badge-progress{font-weight:600;color:#5a3300;}.mm-cram-badge .mm-cram-badge-cta{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#7a3a00;}" + pulse;
    try { (document.head || document.documentElement).appendChild(style); } catch (e) {}
  }

  // ───────────── builder UI ─────────────

  function renderBuilder(container, opts) {
    if (typeof document === "undefined" || !container) return;
    ensureStyles();
    opts = opts || {};

    var defaultCourse = opts.course || "";
    if (!defaultCourse) {
      try {
        if (root.MrMacsProfile && typeof root.MrMacsProfile.get === "function") {
          var p = root.MrMacsProfile.get();
          if (p && typeof p.enrolledCourse === "string") defaultCourse = p.enrolledCourse;
        }
      } catch (e) {}
    }

    var catalog = getGameCatalog();
    var courseSet = Object.create(null);
    for (var i = 0; i < catalog.length; i++) {
      var c = catalog[i] && catalog[i].course;
      if (typeof c !== "string" || !c || c === "All Courses") continue;
      if (c.indexOf(" + ") !== -1) {
        var parts = c.split(" + ");
        for (var k = 0; k < parts.length; k++) courseSet[parts[k].trim()] = true;
      } else {
        courseSet[c] = true;
      }
    }
    var aliases = {
      "AP United States Government and Politics": "AP U.S. Government and Politics",
      "Global History 9 (Ancient–Medieval)": "Grade 9 Global History I",
      "Global History 10 (Cold War–Modern)": "Grade 10 Global History II",
      "Grade 7 US History": "Grade 7 U.S. History I",
      "Grade 8 US History": "Grade 8 U.S. History II",
      "US Government & Civics": "Civics and Participation in Government",
      "US History (Cold War-Modern)": "Grade 11 U.S. History"
    };
    function displayCourseLabel(name) {
      name = String(name || "").trim();
      return aliases[name] || name;
    }
    if (root.DIAG_BANK_COURSE_LABELS) {
      Object.keys(root.DIAG_BANK_COURSE_LABELS).forEach(function (key) {
        var label = displayCourseLabel(root.DIAG_BANK_COURSE_LABELS[key]);
        if (label) courseSet[label] = true;
      });
    }
    var courses = Object.keys(courseSet).map(displayCourseLabel).filter(function (name, index, arr) {
      return name && arr.indexOf(name) === index;
    }).sort(function (a, b) {
      var apA = /^AP\b/.test(a);
      var apB = /^AP\b/.test(b);
      if (apA !== apB) return apA ? 1 : -1;
      return a.localeCompare(b, undefined, { numeric: true });
    });

    var courseOptions = '<option value="">Any course</option>';
    for (var ci = 0; ci < courses.length; ci++) {
      var name = courses[ci];
      courseOptions += '<option value="' + escapeHtml(name) + '"' +
        (name === defaultCourse ? " selected" : "") + ">" + escapeHtml(name) + "</option>";
    }

    var defaultLength = DEFAULT_LENGTH;
    if (opts.length && opts.length >= MIN_LENGTH && opts.length <= MAX_LENGTH) defaultLength = opts.length;

    container.innerHTML =
      '<div class="mm-cram-builder" role="region" aria-label="Build a Cram Mode playlist">' +
        '<h3>Build a Cram</h3>' +
        '<label>Course<select class="mm-cram-course">' + courseOptions + '</select></label>' +
        '<label>Topic (optional)<input type="text" class="mm-cram-topic" placeholder="e.g. Cold War, neurons" maxlength="60"></label>' +
        '<label>Length: <span class="mm-cram-length-out">' + defaultLength + '</span> games' +
          '<input type="range" class="mm-cram-length" min="' + MIN_LENGTH + '" max="' + MAX_LENGTH + '" value="' + defaultLength + '" step="1"></label>' +
        '<div class="mm-cram-row">' +
          '<button type="button" class="mm-cram-build">Build playlist</button>' +
          '<button type="button" class="mm-cram-start" disabled>Start cram</button>' +
        '</div>' +
        '<div class="mm-cram-preview-wrap" aria-live="polite"><div class="mm-cram-empty">Build a playlist to preview your cram session.</div></div>' +
      '</div>';

    var courseEl = container.querySelector(".mm-cram-course");
    var topicEl = container.querySelector(".mm-cram-topic");
    var lenEl = container.querySelector(".mm-cram-length");
    var lenOut = container.querySelector(".mm-cram-length-out");
    var buildBtn = container.querySelector(".mm-cram-build");
    var startBtn = container.querySelector(".mm-cram-start");
    var previewWrap = container.querySelector(".mm-cram-preview-wrap");

    if (lenEl && lenOut) lenEl.addEventListener("input", function () { lenOut.textContent = lenEl.value; });

    var lastPlaylist = null;

    function renderPreview(pl) {
      if (!previewWrap) return;
      if (!pl || !pl.games || !pl.games.length) {
        previewWrap.innerHTML = '<div class="mm-cram-empty">No matching games found. Try a broader course or topic.</div>';
        if (startBtn) startBtn.disabled = true;
        return;
      }
      var html = '<ol class="mm-cram-preview">';
      for (var i = 0; i < pl.games.length; i++) {
        var g = pl.games[i];
        html += '<li><span class="mm-cram-num">' + (i + 1) + '</span>' +
          '<span class="mm-cram-title">' + escapeHtml(g.title) + '</span>' +
          '<span class="mm-cram-reason">' + escapeHtml(g.reason || "") + '</span></li>';
      }
      previewWrap.innerHTML = html + '</ol>';
      if (startBtn) startBtn.disabled = false;
    }

    if (buildBtn) {
      buildBtn.addEventListener("click", function () {
        lastPlaylist = buildPlaylist({
          course: courseEl ? courseEl.value || null : null,
          topic: topicEl ? topicEl.value || null : null,
          length: lenEl ? parseInt(lenEl.value, 10) : DEFAULT_LENGTH,
          includeArcade: opts.includeArcade !== false
        });
        renderPreview(lastPlaylist);
      });
    }

    if (startBtn) {
      startBtn.addEventListener("click", function () {
        if (!lastPlaylist) return;
        var session = startSession(lastPlaylist);
        if (typeof opts.onStart === "function") {
          try { opts.onStart(session, lastPlaylist); } catch (e) {}
        }
      });
    }
  }

  // ───────────── active badge ─────────────

  function gameUrlFor(gameId) {
    if (!gameId) return null;
    var catalog = getGameCatalog();
    for (var i = 0; i < catalog.length; i++) {
      var g = catalog[i];
      if (!g || g.id !== gameId) continue;
      if (typeof g.file === "string" && g.file) return g.file;
      if (typeof g.url === "string" && g.url) return g.url;
      break;
    }
    return "games/" + encodeURIComponent(gameId) + ".html";
  }

  function renderActiveBadge(container) {
    if (typeof document === "undefined" || !container) return;
    ensureStyles();
    var session = getActiveSession();
    if (!session) { container.innerHTML = ""; return; }
    var total = session.playlist.games.length;
    var done = session.currentIdx | 0; if (done > total) done = total;
    var nextGame = session.playlist.games[done] || null;

    container.innerHTML =
      '<a class="mm-cram-badge" role="button" tabindex="0" aria-label="Cram in progress, ' +
        done + ' of ' + total + ' games done. Continue.">' +
        '<span aria-hidden="true">🎯</span><span>Cram</span>' +
        '<span class="mm-cram-badge-progress">' + done + '/' + total + '</span>' +
        '<span class="mm-cram-badge-cta">Continue →</span>' +
      '</a>';

    var el = container.querySelector(".mm-cram-badge");
    if (!el) return;

    function go() {
      if (!nextGame) return;
      var url = gameUrlFor(nextGame.gameId);
      if (!url) return;
      try { root.location.href = url; } catch (e) {}
    }

    el.addEventListener("click", function (ev) { ev.preventDefault(); go(); });
    el.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); }
    });
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
    for (var i = arr.length - 1; i >= 0; i--) if (arr[i] === handler) arr.splice(i, 1);
  }

  // ───────────── export ─────────────

  root.MrMacsCramMode = {
    buildPlaylist: buildPlaylist,
    startSession: startSession,
    getActiveSession: getActiveSession,
    advance: advance,
    abandon: abandon,
    getCompletedCount: getCompletedCount,
    renderBuilder: renderBuilder,
    renderActiveBadge: renderActiveBadge,
    on: on,
    off: off,
    _STORAGE_KEY: STORAGE_KEY,
    _SCHEMA_VERSION: SCHEMA_VERSION,
    _MIN_LENGTH: MIN_LENGTH,
    _MAX_LENGTH: MAX_LENGTH
  };
})(typeof window !== "undefined" ? window : this);
