/* ============================================================================
 * arcade-deeplinks.js
 * URL fragment-based routing for Mr. Mac's Review Arcade.
 * Lets players bookmark filter combos, share game links, or auto-navigate.
 *
 * Fragment grammar:
 *   #/game/<gameId>
 *   #/filter?course=AP+Psychology&lane=play&search=civil+rights
 *   #/shop  #/achievements  #/daily  #/cram  #/dev  #/onboarding
 *   #/tour/start
 *
 * Public surface: window.MrMacsDeeplinks
 * ==========================================================================*/
(function (root) {
  "use strict";

  if (root.MrMacsDeeplinks) return;

  // ---- internal state -----------------------------------------------------
  var listeners = Object.create(null);
  var changeHandlers = [];
  var lastRoute = null;
  var booted = false;
  var TOAST_LIFETIME_MS = 2400;

  // ---- event bus ----------------------------------------------------------
  function on(event, handler) {
    if (typeof handler !== "function") return;
    (listeners[event] = listeners[event] || []).push(handler);
  }
  function off(event, handler) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (h) { return h !== handler; });
  }
  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (err) {
        if (root.console && root.console.warn) {
          root.console.warn("[deeplinks] listener error for " + event, err);
        }
      }
    }
  }

  // ---- encoding helpers ---------------------------------------------------
  function encodeKv(obj) {
    if (!obj || typeof obj !== "object") return "";
    var parts = [];
    Object.keys(obj).forEach(function (key) {
      var val = obj[key];
      if (val === undefined || val === null || val === "") return;
      parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(val)));
    });
    return parts.join("&");
  }
  function decodeKv(qs) {
    var out = {};
    if (!qs) return out;
    String(qs).replace(/^\?/, "").split("&").forEach(function (pair) {
      if (!pair) return;
      var eq = pair.indexOf("=");
      var key = eq === -1 ? decodeURIComponent(pair) : decodeURIComponent(pair.slice(0, eq));
      var val = eq === -1 ? "" : decodeURIComponent(pair.slice(eq + 1));
      if (key) out[key] = val;
    });
    return out;
  }

  // ---- fragment builders --------------------------------------------------
  function toGame(gameId) {
    return gameId ? "#/game/" + encodeURIComponent(String(gameId)) : "#/";
  }
  function toFilter(opts) {
    var qs = encodeKv({
      course: opts && opts.course,
      lane: opts && opts.lane,
      search: opts && opts.search
    });
    return qs ? "#/filter?" + qs : "#/filter";
  }
  function toAction(actionName) {
    if (!actionName) return "#/";
    var safe = String(actionName).replace(/[^a-z0-9_-]/gi, "").toLowerCase();
    return "#/" + safe;
  }
  function serializeState(state) {
    state = state || {};
    if (state.gameId) return toGame(state.gameId);
    if (state.action) return toAction(state.action);
    if (state.course || state.lane || state.search) {
      return toFilter({ course: state.course, lane: state.lane, search: state.search });
    }
    return "#/";
  }

  // ---- fragment parser ----------------------------------------------------
  function parseHash(hash) {
    var raw = String(hash || "");
    if (!raw || raw === "#" || raw === "#/") return { kind: "home", raw: raw };
    var stripped = raw.replace(/^#\/?/, "");
    if (!stripped) return { kind: "home", raw: raw };

    var qIdx = stripped.indexOf("?");
    var pathPart = qIdx === -1 ? stripped : stripped.slice(0, qIdx);
    var queryPart = qIdx === -1 ? "" : stripped.slice(qIdx + 1);
    var params = decodeKv(queryPart);
    var segments = pathPart.split("/").filter(Boolean);
    if (!segments.length) return { kind: "home", raw: raw, params: params };

    var head = segments[0].toLowerCase();
    switch (head) {
      case "game":
        return {
          kind: "game",
          gameId: segments[1] ? decodeURIComponent(segments[1]) : null,
          params: params, raw: raw
        };
      case "filter":
        return {
          kind: "filter",
          course: params.course || "",
          lane: params.lane || "",
          search: params.search || "",
          params: params, raw: raw
        };
      case "shop":
      case "achievements":
      case "daily":
      case "cram":
      case "dev":
      case "onboarding":
        return { kind: "action", action: head, params: params, raw: raw };
      case "tour":
        return {
          kind: "tour",
          step: segments[1] ? decodeURIComponent(segments[1]) : "start",
          params: params, raw: raw
        };
      default:
        return { kind: "unknown", head: head, segments: segments, params: params, raw: raw };
    }
  }

  // ---- DOM helpers --------------------------------------------------------
  function $(sel, scope) {
    try { return (scope || root.document).querySelector(sel); } catch (e) { return null; }
  }
  function scrollIntoViewSafe(el) {
    if (!el || !el.scrollIntoView) return;
    try { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    catch (e) { try { el.scrollIntoView(); } catch (_) {} }
  }
  function tryRender() {
    if (typeof root.render === "function") { try { root.render(); } catch (e) {} }
  }

  // ---- dispatchers --------------------------------------------------------
  function findGameById(gameId) {
    if (!gameId) return null;
    var pools = [];
    if (Array.isArray(root.GAMES)) pools.push(root.GAMES);
    if (root.state && Array.isArray(root.state.games)) pools.push(root.state.games);
    if (Array.isArray(root.ALL_GAMES)) pools.push(root.ALL_GAMES);
    for (var i = 0; i < pools.length; i++) {
      for (var j = 0; j < pools[i].length; j++) {
        var g = pools[i][j];
        if (!g) continue;
        if (g.id === gameId || g.slug === gameId || g.gameId === gameId) return g;
      }
    }
    return null;
  }

  function dispatchGame(route) {
    var game = findGameById(route.gameId);
    if (!game) { emit("game:missing", { gameId: route.gameId }); return false; }
    emit("game:open", { game: game, gameId: route.gameId });
    if (typeof root.openGame === "function") {
      try { root.openGame(game); return true; } catch (e) {}
    }
    if (game.file) {
      try { root.location.href = game.file; return true; } catch (e) {}
    }
    return false;
  }

  function dispatchFilter(route) {
    var changed = false;
    if (root.state && typeof root.state === "object") {
      if ("course" in root.state || route.course !== undefined) {
        root.state.course = route.course || ""; changed = true;
      }
      if ("lane" in root.state || route.lane !== undefined) {
        root.state.lane = route.lane || ""; changed = true;
      }
      if ("search" in root.state || route.search !== undefined) {
        root.state.search = route.search || ""; changed = true;
      }
    }
    var courseSel = $("#course-filter") || $('[data-filter="course"]');
    if (courseSel && route.course !== undefined) { try { courseSel.value = route.course; } catch (e) {} }
    var laneSel = $("#lane-filter") || $('[data-filter="lane"]');
    if (laneSel && route.lane !== undefined) { try { laneSel.value = route.lane; } catch (e) {} }
    var searchInp = $("#arcade-search") || $('[data-filter="search"]');
    if (searchInp && route.search !== undefined) { try { searchInp.value = route.search; } catch (e) {} }
    if (changed) tryRender();
    emit("filter:applied", { course: route.course, lane: route.lane, search: route.search });
    return true;
  }

  function openProfileDrawer(tabName) {
    var drawer = $("#profile-drawer") || $('[data-drawer="profile"]');
    if (drawer) {
      try {
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
      } catch (e) {}
    }
    if (root.MrMacsProfile && typeof root.MrMacsProfile.open === "function") {
      try { root.MrMacsProfile.open(tabName); } catch (e) {}
    }
    if (tabName) {
      var tabBtn = $('[data-profile-tab="' + tabName + '"]');
      if (tabBtn && typeof tabBtn.click === "function") {
        try { tabBtn.click(); } catch (e) {}
      }
    }
  }

  function dispatchAction(route) {
    switch (route.action) {
      case "shop":
        openProfileDrawer("shop");
        scrollIntoViewSafe($("#shop-section") || $('[data-section="shop"]'));
        emit("action:shop", {}); return true;
      case "achievements":
        openProfileDrawer("achievements");
        emit("action:achievements", {}); return true;
      case "daily":
        scrollIntoViewSafe($("#daily-challenge") || $('[data-section="daily"]'));
        emit("action:daily", {}); return true;
      case "cram":
        if (root.MrMacsCramMode && typeof root.MrMacsCramMode.open === "function") {
          try { root.MrMacsCramMode.open(); } catch (e) {}
        }
        emit("action:cram", {}); return true;
      case "dev":
        if (root.MrMacsDevTools && typeof root.MrMacsDevTools.open === "function") {
          try { root.MrMacsDevTools.open(); } catch (e) {}
        }
        emit("action:dev", {}); return true;
      case "onboarding":
        if (root.MrMacsOnboarding) {
          var fn = root.MrMacsOnboarding.replay || root.MrMacsOnboarding.start;
          if (typeof fn === "function") { try { fn.call(root.MrMacsOnboarding); } catch (e) {} }
        }
        emit("action:onboarding", {}); return true;
      default:
        return false;
    }
  }

  function dispatchTour(route) {
    var host = root.MrMacsTour || root.MrMacsTutorial;
    if (host && typeof host.start === "function") {
      try { host.start(route.step); } catch (e) {}
    }
    emit("tour:start", { step: route.step });
    return true;
  }

  // ---- apply route from URL ----------------------------------------------
  function applyFromUrl() {
    var route;
    try { route = parseHash(root.location && root.location.hash); }
    catch (e) { return { applied: false, route: null, error: String(e) }; }

    var applied = false;
    try {
      switch (route.kind) {
        case "game":   applied = dispatchGame(route); break;
        case "filter": applied = dispatchFilter(route); break;
        case "action": applied = dispatchAction(route); break;
        case "tour":   applied = dispatchTour(route); break;
        case "home":   emit("home:enter", {}); applied = true; break;
        default:       applied = false;
      }
    } catch (e) { applied = false; }

    lastRoute = route;
    emit("change", { route: route, applied: applied });
    for (var i = 0; i < changeHandlers.length; i++) {
      try { changeHandlers[i]({ route: route, applied: applied }); } catch (_) {}
    }
    return { applied: applied, route: route };
  }

  // ---- manual navigate ----------------------------------------------------
  function navigate(routeObj) {
    var fragment = typeof routeObj === "string"
      ? (routeObj.charAt(0) === "#" ? routeObj : "#" + routeObj)
      : serializeState(routeObj || {});
    try {
      if (root.history && typeof root.history.replaceState === "function") {
        var url = root.location.pathname + root.location.search + fragment;
        root.history.replaceState(null, "", url);
        applyFromUrl();
      } else {
        root.location.hash = fragment;
      }
    } catch (e) {
      try { root.location.hash = fragment; } catch (_) {}
    }
  }

  // ---- subscribe API ------------------------------------------------------
  function onChange(handler) {
    if (typeof handler !== "function") return function () {};
    changeHandlers.push(handler);
    return function unsubscribe() {
      changeHandlers = changeHandlers.filter(function (h) { return h !== handler; });
    };
  }

  // ---- snapshot current state --------------------------------------------
  function snapshotCurrentState() {
    var snap = {};
    if (root.state && typeof root.state === "object") {
      if (root.state.course) snap.course = root.state.course;
      if (root.state.lane) snap.lane = root.state.lane;
      if (root.state.search) snap.search = root.state.search;
    }
    var courseSel = $("#course-filter") || $('[data-filter="course"]');
    if (courseSel && courseSel.value && !snap.course) snap.course = courseSel.value;
    var laneSel = $("#lane-filter") || $('[data-filter="lane"]');
    if (laneSel && laneSel.value && !snap.lane) snap.lane = laneSel.value;
    var searchInp = $("#arcade-search") || $('[data-filter="search"]');
    if (searchInp && searchInp.value && !snap.search) snap.search = searchInp.value;
    return snap;
  }

  // ---- toast + fallback modal --------------------------------------------
  function showToast(msg) {
    if (!root.document || !root.document.body) return;
    var toast = root.document.createElement("div");
    toast.className = "mrmacs-deeplinks-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = msg;
    toast.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
      "background:#1f2937;color:#fff;padding:10px 18px;border-radius:10px;" +
      "font:600 14px/1.3 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);" +
      "z-index:99999;opacity:0;transition:opacity .2s ease";
    root.document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = "1"; });
    setTimeout(function () {
      toast.style.opacity = "0";
      setTimeout(function () {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 240);
    }, TOAST_LIFETIME_MS);
  }

  function fallbackCopyModal(url) {
    if (!root.document || !root.document.body) return;
    var overlay = root.document.createElement("div");
    overlay.className = "mrmacs-deeplinks-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.7);" +
      "display:flex;align-items:center;justify-content:center;z-index:99998;padding:24px";
    var box = root.document.createElement("div");
    box.style.cssText = "background:#fff;border-radius:14px;padding:24px;max-width:560px;width:100%;" +
      "box-shadow:0 20px 60px rgba(0,0,0,.35);font:14px/1.5 system-ui,sans-serif;color:#0f172a";
    box.innerHTML = '<div style="font-size:18px;font-weight:700;margin-bottom:10px">Share this view</div>';
    var input = root.document.createElement("input");
    input.type = "text"; input.value = url; input.readOnly = true;
    input.style.cssText = "width:100%;padding:10px 12px;border:1px solid #cbd5e1;" +
      "border-radius:8px;font:13px monospace;margin-bottom:14px";
    var closeBtn = root.document.createElement("button");
    closeBtn.type = "button"; closeBtn.textContent = "Close";
    closeBtn.style.cssText = "background:#0f172a;color:#fff;border:0;padding:8px 18px;" +
      "border-radius:8px;font-weight:600;cursor:pointer";
    closeBtn.addEventListener("click", function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
    box.appendChild(input); box.appendChild(closeBtn); overlay.appendChild(box);
    root.document.body.appendChild(overlay);
    setTimeout(function () { try { input.select(); } catch (e) {} }, 0);
  }

  // ---- shareable URL helpers ---------------------------------------------
  function buildShareableUrl(fragment) {
    var loc = root.location || { origin: "", pathname: "" };
    var hash = fragment || "#/";
    if (hash.charAt(0) !== "#") hash = "#" + hash;
    return (loc.origin || "") + (loc.pathname || "/") + hash;
  }
  function copyToClipboard(text) {
    if (!root.navigator || !root.navigator.clipboard || !root.navigator.clipboard.writeText) {
      return Promise.reject(new Error("clipboard-unavailable"));
    }
    try { return root.navigator.clipboard.writeText(text); }
    catch (e) { return Promise.reject(e); }
  }
  function safeCall(fn, fallback) {
    try { var v = fn(); return v == null ? fallback : v; } catch (e) { return fallback; }
  }

  // ---- share button -------------------------------------------------------
  function renderShareButton(container, opts) {
    opts = opts || {};
    if (!container || !root.document) return { unmount: function () {} };
    var btn = root.document.createElement("button");
    btn.type = "button";
    btn.className = "mrmacs-deeplinks-share " + (opts.className || "");
    btn.setAttribute("aria-label", "Share this view");
    btn.setAttribute("title", "Copy a shareable link to this view");
    btn.textContent = opts.label || "🔗 Share";
    if (opts.style !== false) {
      btn.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:8px 14px;" +
        "border-radius:8px;border:1px solid #cbd5e1;background:#f8fafc;color:#0f172a;" +
        "font:600 13px/1 system-ui,sans-serif;cursor:pointer";
    }
    function handleClick() {
      var stateOverride = typeof opts.getState === "function"
        ? safeCall(opts.getState, snapshotCurrentState())
        : snapshotCurrentState();
      var fragment = serializeState(stateOverride || {});
      var url = buildShareableUrl(fragment);
      copyToClipboard(url).then(
        function () { showToast("Copied link"); emit("share:copied", { url: url, fragment: fragment }); },
        function () { fallbackCopyModal(url); emit("share:fallback", { url: url, fragment: fragment }); }
      );
    }
    btn.addEventListener("click", handleClick);
    container.appendChild(btn);
    return {
      unmount: function () {
        try { btn.removeEventListener("click", handleClick); } catch (e) {}
        if (btn.parentNode) btn.parentNode.removeChild(btn);
      },
      element: btn
    };
  }

  // ---- boot ---------------------------------------------------------------
  function boot() {
    if (booted) return;
    booted = true;
    try { root.addEventListener("hashchange", function () { applyFromUrl(); }); } catch (e) {}
    var doInitialApply = function () { try { applyFromUrl(); } catch (e) {} };
    if (root.document && root.document.readyState === "loading") {
      try { root.document.addEventListener("DOMContentLoaded", doInitialApply, { once: true }); }
      catch (e) { root.document.addEventListener("DOMContentLoaded", doInitialApply); }
    } else {
      setTimeout(doInitialApply, 0);
    }
  }

  // ---- public API ---------------------------------------------------------
  root.MrMacsDeeplinks = {
    applyFromUrl: applyFromUrl,
    serializeState: serializeState,
    navigate: navigate,
    onChange: onChange,
    toGame: toGame,
    toFilter: toFilter,
    toAction: toAction,
    renderShareButton: renderShareButton,
    on: on,
    off: off,
    _parseHash: parseHash,
    _snapshot: snapshotCurrentState,
    _buildUrl: buildShareableUrl,
    get lastRoute() { return lastRoute; }
  };

  boot();
})(typeof window !== "undefined" ? window : this);
