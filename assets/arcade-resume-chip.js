/**
 * arcade-resume-chip.js
 * Floating "🎮 Continue your last run" chip for Mr. Mac's Review Arcade hub.
 *
 * Public API (window.MrMacsResumeChip):
 *   mount(container?, opts?) → { unmount, refresh }
 *   refresh()
 *   hide()
 *   show()
 *   on(event, handler)
 *   off(event, handler)
 *
 * Events emitted: "navigate" { gameId, url }
 *                 "dismiss"  { gameId, until }
 *                 "shown"    { gameId }
 *                 "hidden"   {}
 */
(function (root) {
  "use strict";

  if (root.MrMacsResumeChip) return; // idempotent

  /* ── constants ─────────────────────────────────────────────── */
  var DISMISS_STORAGE_KEY = "mr-macs-resume-chip-dismissed";
  var DISMISS_DURATION_MS = 60 * 60 * 1000; // 1 hour
  var P = "mrc-"; // CSS prefix
  var STYLE_ID = "mrc-styles";

  /* ── tiny event bus ─────────────────────────────────────────── */
  var _listeners = {};

  function emit(event, payload) {
    var handlers = (_listeners[event] || []).slice();
    for (var i = 0; i < handlers.length; i++) {
      try { handlers[i](payload); } catch (e) {}
    }
  }

  function on(event, handler) {
    if (typeof handler !== "function") return;
    _listeners[event] = _listeners[event] || [];
    _listeners[event].push(handler);
  }

  function off(event, handler) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (h) { return h !== handler; });
  }

  /* ── helpers ────────────────────────────────────────────────── */
  function now() { return Date.now(); }

  function relativeTime(ms) {
    var diff = Math.max(0, now() - ms);
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    var hrs = Math.floor(mins / 60);
    return hrs < 24 ? hrs + "h ago" : Math.floor(hrs / 24) + "d ago";
  }

  function isDismissed() {
    try {
      var raw = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (!raw) return false;
      var until = parseInt(raw, 10);
      if (isNaN(until)) return false;
      if (now() >= until) { localStorage.removeItem(DISMISS_STORAGE_KEY); return false; }
      return true;
    } catch (e) { return false; }
  }

  function setDismissed() {
    try {
      var until = now() + DISMISS_DURATION_MS;
      localStorage.setItem(DISMISS_STORAGE_KEY, String(until));
      return until;
    } catch (e) { return 0; }
  }

  function getActiveSessions() {
    try {
      var sess = root.MrMacsSessions;
      if (!sess || typeof sess.listActive !== "function") return [];
      return sess.listActive() || [];
    } catch (e) { return []; }
  }

  function getMostRecent() {
    var sessions = getActiveSessions();
    if (!sessions.length) return null;
    sessions.sort(function (a, b) { return b.savedAt - a.savedAt; });
    return sessions[0];
  }

  function resolveGame(gameId) {
    var title = null;
    var url = "games/" + gameId + "/index.html";
    try {
      var games = root.GAMES;
      if (Array.isArray(games)) {
        for (var i = 0; i < games.length; i++) {
          if (games[i] && games[i].id === gameId) {
            title = games[i].title || null;
            if (games[i].file) url = games[i].file;
            break;
          }
        }
      }
    } catch (e) {}
    return { title: title || gameId, url: url };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ── stylesheet injection ───────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      "." + P + "chip{" +
        "position:fixed;bottom:24px;right:24px;z-index:9000;" +
        "display:flex;align-items:center;gap:0;" +
        "background:#0e1117;border:1px solid #00d4d4;border-radius:40px;" +
        "box-shadow:0 4px 18px rgba(0,212,212,.18),0 2px 6px rgba(0,0,0,.55);" +
        "cursor:pointer;" +
        "font-family:'Inter','Segoe UI',system-ui,sans-serif;" +
        "font-size:13px;font-weight:600;color:#e8eaf0;letter-spacing:.01em;" +
        "max-width:380px;overflow:hidden;" +
        "transition:transform .2s ease,box-shadow .2s ease,opacity .25s ease;" +
        "opacity:0;transform:translateY(12px);" +
        "pointer-events:none;user-select:none;-webkit-user-select:none}" +

      "." + P + "chip." + P + "visible{" +
        "opacity:1;transform:translateY(0);pointer-events:auto}" +

      "." + P + "chip:hover,." + P + "chip:focus-visible{" +
        "transform:translateY(-3px);" +
        "box-shadow:0 8px 28px rgba(0,212,212,.32),0 3px 10px rgba(0,0,0,.6);" +
        "outline:none}" +

      "." + P + "label{" +
        "display:flex;align-items:center;gap:7px;" +
        "padding:10px 14px 10px 16px;flex:1;min-width:0}" +

      "." + P + "icon{font-size:16px;line-height:1;flex-shrink:0}" +

      "." + P + "text{" +
        "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" +
        "min-width:0;flex:1}" +

      "." + P + "game-name,." + P + "arrow{color:#00d4d4}" +

      "." + P + "meta{color:#8892a4;font-weight:400;font-size:12px}" +

      "." + P + "divider{" +
        "width:1px;align-self:stretch;" +
        "background:rgba(0,212,212,.2);flex-shrink:0}" +

      "." + P + "dismiss{" +
        "display:flex;align-items:center;justify-content:center;" +
        "width:36px;flex-shrink:0;align-self:stretch;" +
        "background:transparent;border:none;cursor:pointer;" +
        "color:#8892a4;font-size:14px;font-weight:700;line-height:1;" +
        "padding:0;transition:color .15s}" +
      "." + P + "dismiss:hover{color:#e8eaf0}" +
      "." + P + "dismiss:focus-visible{outline:2px solid #00d4d4;outline-offset:-2px}" +

      "@media(max-width:600px){" +
        "." + P + "chip{" +
          "bottom:16px;left:16px;right:16px;max-width:none;border-radius:14px}}" +

      "@media(prefers-reduced-motion:reduce){" +
        "." + P + "chip,." + P + "chip." + P + "visible,." + P + "chip:hover{" +
          "transition:none!important;transform:none!important}}";

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── module state ───────────────────────────────────────────── */
  var _chip = null;
  var _mounted = false;
  var _forcedHidden = false;
  var _currentGameId = null;
  var _container = null;

  /* ── DOM build ──────────────────────────────────────────────── */
  function readScore(gameId) {
    try {
      var sess = root.MrMacsSessions;
      if (sess && typeof sess.load === "function") {
        var snap = sess.load(gameId);
        if (snap && typeof snap.score === "number") return " · score " + snap.score;
      }
    } catch (e) {}
    return "";
  }

  function buildChip(session) {
    var game = resolveGame(session.gameId);
    var scoreText = readScore(session.gameId);
    var timeText = relativeTime(session.savedAt);

    var chip = document.createElement("div");
    chip.className = P + "chip";
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");
    chip.setAttribute("aria-label",
      "Continue " + game.title + " – click to resume");

    chip.innerHTML =
      '<div class="' + P + 'label">' +
        '<span class="' + P + 'icon" aria-hidden="true">🎮</span>' +
        '<span class="' + P + 'text">' +
          'Continue: <span class="' + P + 'game-name">' + escapeHtml(game.title) + '</span>' +
          '<span class="' + P + 'meta">' + escapeHtml(scoreText) + ' · ' + escapeHtml(timeText) + '</span>' +
          ' <span class="' + P + 'arrow" aria-hidden="true">→</span>' +
        '</span>' +
      '</div>' +
      '<div class="' + P + 'divider" aria-hidden="true"></div>' +
      '<button class="' + P + 'dismiss" ' +
        'aria-label="Dismiss resume chip for one hour" title="Dismiss for 1 hour"' +
      '>✕</button>';

    chip.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("." + P + "dismiss")) return;
      doNavigate(session.gameId, game.url);
    });

    chip.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        doNavigate(session.gameId, game.url);
      }
    });

    var dismissBtn = chip.querySelector("." + P + "dismiss");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var until = setDismissed();
        hideChip(chip);
        emit("dismiss", { gameId: session.gameId, until: until });
      });
    }

    return chip;
  }

  function showChip(chip) {
    requestAnimationFrame(function () {
      chip.classList.add(P + "visible");
    });
    emit("shown", { gameId: _currentGameId });
  }

  function hideChip(chip) {
    chip.classList.remove(P + "visible");
    emit("hidden", {});
  }

  function doNavigate(gameId, url) {
    emit("navigate", { gameId: gameId, url: url });
    root.location.href = url;
  }

  /* ── session event wiring ───────────────────────────────────── */
  var _sessionSaveHandler = null;
  var _sessionClearHandler = null;

  function wireSessionEvents() {
    try {
      var sess = root.MrMacsSessions;
      if (!sess || typeof sess.on !== "function") return;
      _sessionSaveHandler = function () { _refresh(); };
      _sessionClearHandler = function () { _refresh(); };
      sess.on("save", _sessionSaveHandler);
      sess.on("clear", _sessionClearHandler);
    } catch (e) {}
  }

  function unwireSessionEvents() {
    try {
      var sess = root.MrMacsSessions;
      if (sess && typeof sess.off === "function") {
        if (_sessionSaveHandler) sess.off("save", _sessionSaveHandler);
        if (_sessionClearHandler) sess.off("clear", _sessionClearHandler);
      }
    } catch (e) {}
    _sessionSaveHandler = null;
    _sessionClearHandler = null;
  }

  /* ── core refresh logic ─────────────────────────────────────── */
  function _refresh() {
    if (!_mounted || !_container) return;

    if (_forcedHidden || isDismissed()) {
      if (_chip) hideChip(_chip);
      return;
    }

    var session = getMostRecent();

    if (!session) {
      if (_chip) hideChip(_chip);
      return;
    }

    /* same game: patch meta text in place, no rebuild */
    if (_chip && _currentGameId === session.gameId) {
      var metaEl = _chip.querySelector("." + P + "meta");
      if (metaEl) {
        metaEl.textContent =
          readScore(session.gameId) + " · " + relativeTime(session.savedAt);
      }
      showChip(_chip);
      return;
    }

    /* different game: replace chip */
    if (_chip && _chip.parentNode) _chip.parentNode.removeChild(_chip);

    _currentGameId = session.gameId;
    _chip = buildChip(session);
    _container.appendChild(_chip);
    showChip(_chip);
  }

  /* ── public mount ───────────────────────────────────────────── */
  function mount(container, opts) {
    if (_mounted) {
      _refresh();
      return { unmount: unmount, refresh: _refresh };
    }
    injectStyles();
    _container = (container instanceof Element) ? container : document.body;
    _forcedHidden = false;
    _mounted = true;
    wireSessionEvents();
    _refresh();
    return { unmount: unmount, refresh: _refresh };
  }

  function unmount() {
    if (!_mounted) return;
    unwireSessionEvents();
    if (_chip && _chip.parentNode) _chip.parentNode.removeChild(_chip);
    _chip = null;
    _currentGameId = null;
    _mounted = false;
    _container = null;
  }

  function hide() { _forcedHidden = true; if (_chip) hideChip(_chip); }

  function show() { _forcedHidden = false; _refresh(); }

  /* ── export ─────────────────────────────────────────────────── */
  root.MrMacsResumeChip = {
    mount: mount,
    unmount: unmount,
    refresh: _refresh,
    hide: hide,
    show: show,
    on: on,
    off: off
  };

}(window));
