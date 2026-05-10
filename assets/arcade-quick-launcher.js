/*!
 * Mr. Mac's Arcade · arcade-quick-launcher.js
 * Cmd+K / Ctrl+K command palette with fuzzy-search over games and built-in actions.
 *
 * Public API: window.MrMacsQuickLauncher
 *   open()                         – open the modal
 *   close()                        – close the modal
 *   toggle()                       – open if closed, close if open
 *   bindGlobalShortcut()           – register Cmd+K / Ctrl+K keydown listener
 *   registerAction(action)         – { id, label, icon, run }
 *   on(event, handler)             – events: "open", "close", "launch"
 *   off(event, handler)
 *
 * No external dependencies. Works idempotently if the script is loaded more
 * than once.
 */
;(function (root) {
  "use strict";

  if (root.MrMacsQuickLauncher) return; // idempotent

  /* ─────────────────────────────────────────────
     Constants
  ───────────────────────────────────────────── */
  var STYLE_ID       = "mql-styles";
  var OVERLAY_ID     = "mql-overlay";
  var MAX_RESULTS    = 8;
  var RECENT_LIMIT   = 5;

  /* ─────────────────────────────────────────────
     Styles
  ───────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    /* editorial dark + bronze palette; cyan accent on hover; gold on selected */
    s.textContent =
      ".mql-backdrop{position:fixed;inset:0;z-index:9500;background:rgba(10,8,18,.78);" +
        "display:flex;align-items:flex-start;justify-content:center;padding-top:12vh;" +
        "animation:mql-fade-in 120ms ease}" +
      "@keyframes mql-fade-in{from{opacity:0}to{opacity:1}}" +
      "@media(prefers-reduced-motion:reduce){.mql-backdrop,.mql-modal{animation:none}}" +
      ".mql-modal{width:520px;max-width:calc(100vw - 24px);max-height:60vh;" +
        "background:#17141f;border:1.5px solid #8b6914;border-radius:12px;" +
        "box-shadow:0 8px 40px rgba(0,0,0,.7),0 0 0 1px rgba(205,163,60,.10);" +
        "overflow:hidden;display:flex;flex-direction:column;" +
        "animation:mql-slide-in 140ms cubic-bezier(.22,.68,0,1.2)}" +
      "@keyframes mql-slide-in{from{transform:translateY(-18px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}" +
      ".mql-search-wrap{display:flex;align-items:center;gap:10px;padding:14px 16px;" +
        "border-bottom:1px solid rgba(139,105,20,.30)}" +
      ".mql-search-icon{flex-shrink:0;color:#cd9f28;width:18px;height:18px;opacity:.75}" +
      ".mql-input{flex:1;background:none;border:none;outline:none;color:#f0e8cc;" +
        "font-size:15px;font-family:inherit;caret-color:#00e5ff}" +
      ".mql-input::placeholder{color:rgba(240,232,204,.38)}" +
      ".mql-hint{font-size:11px;color:rgba(240,232,204,.35);font-family:inherit;white-space:nowrap}" +
      ".mql-results{flex:1;overflow-y:auto;padding:6px 0 8px;scroll-behavior:smooth}" +
      ".mql-results::-webkit-scrollbar{width:5px}" +
      ".mql-results::-webkit-scrollbar-track{background:transparent}" +
      ".mql-results::-webkit-scrollbar-thumb{background:rgba(139,105,20,.4);border-radius:3px}" +
      ".mql-section-label{font-size:10px;font-weight:700;letter-spacing:.08em;" +
        "color:rgba(205,163,60,.55);text-transform:uppercase;padding:8px 16px 3px;font-family:inherit}" +
      ".mql-result-row{display:flex;align-items:center;gap:11px;padding:8px 14px;" +
        "cursor:pointer;border:1.5px solid transparent;border-radius:7px;margin:1px 6px;" +
        "transition:background 80ms,border-color 80ms;user-select:none}" +
      ".mql-result-row:hover{background:rgba(0,229,255,.07);border-color:rgba(0,229,255,.18)}" +
      ".mql-result-row.mql-selected{background:rgba(205,163,60,.10);border-color:rgba(205,163,60,.55)}" +
      ".mql-row-icon{flex-shrink:0;width:30px;height:30px;border-radius:6px;" +
        "background:rgba(139,105,20,.18);display:flex;align-items:center;justify-content:center;" +
        "font-size:15px;line-height:1}" +
      ".mql-row-body{flex:1;min-width:0}" +
      ".mql-row-title{font-size:13px;font-weight:600;color:#f0e8cc;font-family:inherit;" +
        "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".mql-row-sub{font-size:11px;color:rgba(240,232,204,.45);font-family:inherit;" +
        "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".mql-row-badge{flex-shrink:0;font-size:10px;padding:2px 7px;" +
        "background:rgba(139,105,20,.22);color:#cd9f28;border-radius:20px;font-family:inherit}" +
      ".mql-empty{padding:28px 16px;text-align:center;font-size:13px;" +
        "color:rgba(240,232,204,.38);font-family:inherit}" +
      "@media(max-width:540px){" +
        ".mql-backdrop{padding-top:0;align-items:stretch}" +
        ".mql-modal{width:100%;max-width:100%;border-radius:0;max-height:100vh;" +
          "border-left:none;border-right:none;border-top:none}}";
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────
     Event bus
  ───────────────────────────────────────────── */
  var _listeners = {};
  function emit(event, data) {
    var handlers = _listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) {
      try { handlers[i](data); } catch (e) { /* swallow */ }
    }
  }
  function on(event, handler) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(handler);
  }
  function off(event, handler) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (h) { return h !== handler; });
  }

  /* ─────────────────────────────────────────────
     Extra registered actions store
  ───────────────────────────────────────────── */
  var _extraActions = [];
  function registerAction(action) {
    if (!action || !action.id || !action.label || typeof action.run !== "function") return;
    // deduplicate by id
    _extraActions = _extraActions.filter(function (a) { return a.id !== action.id; });
    _extraActions.push(action);
  }

  /* ─────────────────────────────────────────────
     Built-in actions
  ───────────────────────────────────────────── */
  var BUILTIN_ACTIONS = [
    {
      id: "action-profile",
      label: "Open Profile Drawer",
      icon: "👤",
      badge: "Action",
      run: function () {
        try {
          var pill = document.getElementById("profilePill");
          if (pill) pill.click();
        } catch (e) { /* swallow */ }
      }
    },
    {
      id: "action-shop",
      label: "Open Shop",
      icon: "🛒",
      badge: "Action",
      run: function () {
        try {
          var btn = document.querySelector("[data-action='shop'], #shopBtn, #shopTrigger, .shop-btn");
          if (btn) btn.click();
        } catch (e) { /* swallow */ }
      }
    },
    {
      id: "action-daily",
      label: "Open Daily Challenge",
      icon: "🗓️",
      badge: "Action",
      run: function () {
        try {
          var btn = document.querySelector("[data-action='daily-challenge'], #dailyChallengeBtn, .daily-challenge-btn");
          if (btn) btn.click();
        } catch (e) { /* swallow */ }
      }
    },
    {
      id: "action-achievements",
      label: "Open Achievements",
      icon: "🏆",
      badge: "Action",
      run: function () {
        try {
          var btn = document.querySelector("[data-action='achievements'], #achievementsBtn, .ach-strip-more");
          if (btn) { btn.click(); return; }
          // fallback: open profile drawer to achievements tab
          var pill = document.getElementById("profilePill");
          if (pill) pill.click();
        } catch (e) { /* swallow */ }
      }
    },
    {
      id: "action-random",
      label: "Random Game",
      icon: "🎲",
      badge: "Action",
      run: function () {
        try {
          var games = root.GAMES;
          if (!games || !games.length) return;
          var pick = games[Math.floor(Math.random() * games.length)];
          launchGame(pick);
        } catch (e) { /* swallow */ }
      }
    },
    {
      id: "action-sound",
      label: "Toggle Sound",
      icon: "🔊",
      badge: "Action",
      run: function () {
        try {
          var music = root.MrMacsArcadeMusic;
          if (music && typeof music.setMuted === "function") {
            var muted = !music.isPlaying();
            music.setMuted(muted);
          }
        } catch (e) { /* swallow */ }
      }
    },
    {
      id: "action-shortcuts",
      label: "Show Shortcuts",
      icon: "⌨️",
      badge: "Action",
      run: function () {
        try {
          var o = root.MrMacsShortcutsOverlay;
          if (o && typeof o.show === "function") o.show();
        } catch (e) { /* swallow */ }
      }
    }
  ];

  /* ─────────────────────────────────────────────
     Fuzzy match algorithm
     Score = (LCS length × 10) + (substring × 5) + (prefix × 20)
  ───────────────────────────────────────────── */
  function lcsLength(a, b) {
    // Fast path: both short
    var la = a.length, lb = b.length;
    if (!la || !lb) return 0;
    var prev = new Array(lb + 1).fill(0);
    var curr = new Array(lb + 1).fill(0);
    for (var i = 1; i <= la; i++) {
      for (var j = 1; j <= lb; j++) {
        curr[j] = (a[i - 1] === b[j - 1]) ? prev[j - 1] + 1 : Math.max(curr[j - 1], prev[j]);
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[lb];
  }

  function fuzzyScore(query, target) {
    if (!query) return 0;
    var q = query.toLowerCase();
    var t = target.toLowerCase();
    var score = lcsLength(q, t) * 10;
    if (t.indexOf(q) !== -1) score += 5;
    if (t.indexOf(q) === 0) score += 20;
    return score;
  }

  function scoreItem(query, item) {
    // item: { _searchText, ... }
    return fuzzyScore(query, item._searchText);
  }

  /* ─────────────────────────────────────────────
     Build searchable item list
  ───────────────────────────────────────────── */
  function buildSearchText(game) {
    return [
      game.title || "",
      game.course || "",
      (game.tags || []).join(" "),
      game.subject || "",
      game.gameType || ""
    ].join(" ").toLowerCase();
  }

  function getGameItems() {
    try {
      var games = root.GAMES;
      if (!Array.isArray(games)) return [];
      return games.map(function (g) {
        return {
          _type: "game",
          _searchText: buildSearchText(g),
          _game: g,
          id: "game-" + g.id,
          label: g.title || g.id,
          icon: iconForGameType(g.gameType),
          badge: g.course || g.subject || "",
          sub: g.subtitle || (g.day ? "Day " + g.day : ""),
          run: function () { launchGame(g); }
        };
      });
    } catch (e) { return []; }
  }

  function getActionItems(extras) {
    var all = BUILTIN_ACTIONS.concat(extras || []);
    return all.map(function (a) {
      return {
        _type: "action",
        _searchText: (a.label || "").toLowerCase(),
        id: a.id,
        label: a.label,
        icon: a.icon || "⚡",
        badge: a.badge || "Action",
        sub: "",
        run: a.run
      };
    });
  }

  function getRecentItems() {
    try {
      var profile = root.MrMacsProfile;
      if (!profile || typeof profile.getRecent !== "function") return [];
      var recent = profile.getRecent(RECENT_LIMIT);
      if (!Array.isArray(recent)) return [];
      var games = root.GAMES;
      if (!Array.isArray(games)) return [];
      var map = {};
      games.forEach(function (g) { map[g.id] = g; });
      var out = [];
      recent.forEach(function (r) {
        var id = (typeof r === "string") ? r : (r && r.id);
        var g = id && map[id];
        if (!g) return;
        out.push({
          _type: "recent",
          _searchText: buildSearchText(g),
          id: "recent-" + g.id,
          label: g.title || g.id,
          icon: iconForGameType(g.gameType),
          badge: "Recent",
          sub: g.course || g.subject || "",
          run: function () { launchGame(g); }
        });
      });
      return out;
    } catch (e) { return []; }
  }

  function iconForGameType(type) {
    if (!type) return "🎮";
    var t = type.toLowerCase();
    if (t.indexOf("jeopardy") !== -1) return "📺";
    if (t.indexOf("maze") !== -1 || t.indexOf("chase") !== -1) return "🌀";
    if (t.indexOf("quiz") !== -1 || t.indexOf("trivia") !== -1) return "❓";
    if (t.indexOf("timeline") !== -1) return "⏱️";
    if (t.indexOf("tower") !== -1 || t.indexOf("defense") !== -1) return "🗼";
    if (t.indexOf("boss") !== -1 || t.indexOf("rush") !== -1) return "⚔️";
    if (t.indexOf("regents") !== -1) return "📋";
    if (t.indexOf("source") !== -1 || t.indexOf("document") !== -1) return "📜";
    if (t.indexOf("mastery") !== -1 || t.indexOf("dashboard") !== -1) return "📊";
    if (t.indexOf("cipher") !== -1) return "🔐";
    return "🎮";
  }

  /* ─────────────────────────────────────────────
     Launch a game
  ───────────────────────────────────────────── */
  function launchGame(game) {
    try {
      // Try calling the global launcher if it exists
      if (typeof root.launchGame === "function") {
        root.launchGame(game);
        return;
      }
      // Fallback: navigate to game file
      if (game.file) {
        var a = document.createElement("a");
        a.href = game.file;
        a.click();
      }
    } catch (e) { /* swallow */ }
  }

  /* ─────────────────────────────────────────────
     Filter + rank results
  ───────────────────────────────────────────── */
  function computeResults(query, extras) {
    var q = (query || "").trim();
    if (!q) {
      // Show recents then built-in actions (no games flood)
      var recents = getRecentItems();
      var actions = getActionItems(extras);
      return { sections: buildSections(recents, actions, q) };
    }
    var games   = getGameItems();
    var actions = getActionItems(extras);
    var allItems = games.concat(actions);
    var scored = allItems
      .map(function (item) {
        return { item: item, score: scoreItem(q, item) };
      })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, MAX_RESULTS)
      .map(function (r) { return r.item; });
    return { sections: [{ label: null, items: scored }] };
  }

  function buildSections(recents, actions, q) {
    var sections = [];
    if (recents.length) {
      sections.push({ label: "Recent Games", items: recents });
    }
    sections.push({ label: "Actions", items: actions.slice(0, MAX_RESULTS - recents.length) });
    return sections;
  }

  /* ─────────────────────────────────────────────
     DOM state
  ───────────────────────────────────────────── */
  var _open    = false;
  var _el      = null;   // backdrop element
  var _input   = null;
  var _list    = null;
  var _selectedIdx = 0;
  var _flatItems = [];   // flattened result rows (for keyboard nav)

  /* ─────────────────────────────────────────────
     Render modal
  ───────────────────────────────────────────── */
  function createModal() {
    var backdrop = document.createElement("div");
    backdrop.className = "mql-backdrop";
    backdrop.id = OVERLAY_ID;
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Quick Launcher");

    var modal = document.createElement("div");
    modal.className = "mql-modal";

    // Search bar
    var searchWrap = document.createElement("div");
    searchWrap.className = "mql-search-wrap";

    var iconWrap = document.createElement("span");
    iconWrap.className = "mql-search-icon";
    iconWrap.setAttribute("aria-hidden", "true");
    iconWrap.innerHTML =
      '<svg viewBox="0 0 20 20" fill="none" width="18" height="18">' +
      '<circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="12.5" y1="12.5" x2="17" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg>';
    var searchIcon = iconWrap;

    var input = document.createElement("input");
    input.type = "text";
    input.className = "mql-input";
    input.placeholder = "Search games and actions…";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "Search");
    input.setAttribute("aria-autocomplete", "list");

    var hint = document.createElement("span");
    hint.className = "mql-hint";
    hint.textContent = "Esc to close";

    searchWrap.appendChild(searchIcon);
    searchWrap.appendChild(input);
    searchWrap.appendChild(hint);

    // Results
    var results = document.createElement("div");
    results.className = "mql-results";
    results.setAttribute("role", "listbox");

    modal.appendChild(searchWrap);
    modal.appendChild(results);
    backdrop.appendChild(modal);

    // Backdrop click closes
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) close();
    });

    // Input events
    input.addEventListener("input", function () {
      renderResults(input.value);
    });
    input.addEventListener("keydown", handleKeydown);

    _input = input;
    _list  = results;
    return backdrop;
  }

  function renderResults(query) {
    _selectedIdx = 0;
    var result = computeResults(query, _extraActions);
    var sections = result.sections;

    _flatItems = sections.reduce(function (acc, sec) { return acc.concat(sec.items); }, []);

    _list.innerHTML = "";

    if (!_flatItems.length) {
      var empty = document.createElement("div");
      empty.className = "mql-empty";
      empty.textContent = query.trim() ? "No matches for ‘" + query.trim() + "’" : "No recent games found.";
      _list.appendChild(empty);
      return;
    }

    sections.forEach(function (sec) {
      if (!sec.items.length) return;

      if (sec.label) {
        var label = document.createElement("div");
        label.className = "mql-section-label";
        label.textContent = sec.label;
        _list.appendChild(label);
      }

      sec.items.forEach(function (item) {
        _list.appendChild(buildRow(item, _flatItems.indexOf(item)));
      });
    });

    highlightSelected();
  }

  function buildRow(item, idx) {
    var row = document.createElement("div");
    row.className = "mql-result-row";
    row.setAttribute("role", "option");
    row.dataset.idx = idx;

    var iconEl = document.createElement("div");
    iconEl.className = "mql-row-icon";
    iconEl.textContent = item.icon || "🎮";

    var body = document.createElement("div");
    body.className = "mql-row-body";

    var title = document.createElement("div");
    title.className = "mql-row-title";
    title.textContent = item.label;

    body.appendChild(title);

    if (item.sub) {
      var sub = document.createElement("div");
      sub.className = "mql-row-sub";
      sub.textContent = item.sub;
      body.appendChild(sub);
    }

    row.appendChild(iconEl);
    row.appendChild(body);
    if (item.badge) {
      var badge = document.createElement("div");
      badge.className = "mql-row-badge";
      badge.textContent = item.badge;
      row.appendChild(badge);
    }

    row.addEventListener("mouseenter", function () { _selectedIdx = idx; highlightSelected(); });
    row.addEventListener("click", launchSelected);

    return row;
  }

  function highlightSelected() {
    var rows = _list.querySelectorAll(".mql-result-row");
    rows.forEach(function (r, i) {
      r.classList.toggle("mql-selected", i === _selectedIdx);
    });
    // Scroll into view
    var sel = _list.querySelector(".mql-selected");
    if (sel) sel.scrollIntoView({ block: "nearest" });
  }

  function handleKeydown(e) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        _selectedIdx = Math.min(_selectedIdx + 1, _flatItems.length - 1);
        highlightSelected();
        break;
      case "ArrowUp":
        e.preventDefault();
        _selectedIdx = Math.max(_selectedIdx - 1, 0);
        highlightSelected();
        break;
      case "Enter":
        e.preventDefault();
        launchSelected();
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  }

  function launchSelected() {
    var item = _flatItems[_selectedIdx];
    if (!item) return;
    close();
    try {
      item.run();
      emit("launch", { item: item });
    } catch (e) { /* swallow */ }
  }

  /* ─────────────────────────────────────────────
     Open / close
  ───────────────────────────────────────────── */
  function open() {
    if (_open) {
      // Already open — refocus input
      if (_input) _input.focus();
      return;
    }
    injectStyles();
    _el = createModal();
    document.body.appendChild(_el);
    _open = true;

    // Render initial state (recents / actions)
    renderResults("");

    // Auto-focus input after animation frame so browsers don't swallow focus
    requestAnimationFrame(function () {
      if (_input) {
        _input.focus();
        _input.select();
      }
    });

    emit("open", {});
  }

  function close() {
    if (!_open) return;
    _open = false;
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el    = null;
    _input = null;
    _list  = null;
    _flatItems = [];
    emit("close", {});
  }

  function toggle() {
    _open ? close() : open();
  }

  /* ─────────────────────────────────────────────
     Global shortcut binding
  ───────────────────────────────────────────── */
  function bindGlobalShortcut() {
    document.addEventListener("keydown", function (e) {
      var isK = (e.key === "k" || e.key === "K");
      if (!isK) return;

      var isMac = navigator.platform.indexOf("Mac") !== -1;
      var modHeld = isMac ? e.metaKey : e.ctrlKey;
      if (!modHeld) return;

      // If a text-editable element is focused, allow Cmd+K through but do NOT
      // block the default — instead we open the launcher alongside. Only skip
      // for plain Ctrl+K on non-Mac where it could be a browser address bar
      // shortcut, and target is an input/textarea without metaKey.
      var active = document.activeElement;
      var isEditable = active && (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable
      );

      // On non-Mac, skip only when Ctrl+K and field is focused (avoid clobbering)
      if (!isMac && isEditable && !e.metaKey) return;

      e.preventDefault();
      e.stopPropagation();
      toggle();
    }, true /* capture phase for priority */);
  }

  /* ─────────────────────────────────────────────
     Public API
  ───────────────────────────────────────────── */
  root.MrMacsQuickLauncher = {
    open:               open,
    close:              close,
    toggle:             toggle,
    bindGlobalShortcut: bindGlobalShortcut,
    registerAction:     registerAction,
    on:                 on,
    off:                off
  };

}(window));
