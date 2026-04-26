(function () {
  "use strict";

  var PREFIX = "mr-macs-review-arcade-v1";
  var LOCAL_KEY = PREFIX + ":local-traffic";
  var SESSION_KEY = PREFIX + ":session-id";
  var API = "https://countapi.mileshilliard.com/api/v1";
  var pagePath = location.pathname.replace(/\/+$/, "") || "/";
  var isGamePage = /\/games\//.test(pagePath);

  function slug(value) {
    return String(value || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "unknown";
  }

  function counterKey(name) {
    return PREFIX + "-" + slug(name);
  }

  function readLocal() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeLocal(data) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    } catch (error) {}
  }

  function sessionId() {
    var id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function bumpLocal(type, detail) {
    var now = new Date().toISOString();
    var data = readLocal();
    data.version = 1;
    data.firstSeen = data.firstSeen || now;
    data.lastSeen = now;
    data.sessionId = sessionId();
    data.pageViews = Number(data.pageViews || 0);
    data.gameLaunches = Number(data.gameLaunches || 0);
    data.gameViews = Number(data.gameViews || 0);
    data.completions = Number(data.completions || 0);
    data.games = data.games || {};
    data.recent = Array.isArray(data.recent) ? data.recent : [];

    if (type === "pageview") data.pageViews += 1;
    if (type === "game_launch") data.gameLaunches += 1;
    if (type === "game_view") data.gameViews += 1;
    if (type === "game_complete") data.completions += 1;

    if (detail && detail.gameId) {
      var id = slug(detail.gameId);
      data.games[id] = data.games[id] || { title: detail.title || detail.gameId, opens: 0, completions: 0 };
      if (type === "game_launch" || type === "game_view") data.games[id].opens += 1;
      if (type === "game_complete") data.games[id].completions += 1;
      data.games[id].lastSeen = now;
    }

    data.recent.unshift({ type: type, at: now, title: detail && detail.title || document.title || pagePath });
    data.recent = data.recent.slice(0, 12);
    writeLocal(data);
    return data;
  }

  function requestCounter(method, name) {
    var key = counterKey(name);
    var url = API + "/" + method + "/" + encodeURIComponent(key);
    return fetch(url, { cache: "no-store", mode: "cors" })
      .then(function (response) {
        if (!response.ok) throw new Error("counter " + response.status);
        return response.json();
      })
      .then(function (payload) {
        var value = Number(payload && payload.value);
        if (!Number.isFinite(value)) value = Number(payload && payload.count);
        if (!Number.isFinite(value)) value = 0;
        return value;
      });
  }

  function hitGlobal(name, onceKeyValue) {
    if (onceKeyValue) {
      var onceKey = PREFIX + ":hit:" + slug(onceKeyValue);
      if (sessionStorage.getItem(onceKey)) return requestCounter("get", name).catch(function () { return null; });
      sessionStorage.setItem(onceKey, "1");
    }
    return requestCounter("hit", name).catch(function () { return null; });
  }

  function getGlobal(name) {
    return requestCounter("get", name).catch(function () { return null; });
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function format(value) {
    if (value === null || value === undefined) return "--";
    return Number(value).toLocaleString();
  }

  function render(extra) {
    var local = readLocal();
    var global = Object.assign({}, window.__MR_MACS_GLOBAL_TRAFFIC__ || {}, extra || {});
    setText("[data-traffic='global-visits']", format(global.siteVisits));
    setText("[data-traffic='global-game-opens']", format(global.gameLaunches));
    setText("[data-traffic='global-game-views']", format(global.gameViews));
    setText("[data-traffic='global-completions']", format(global.completions));
    setText("[data-traffic='local-visits']", format(local.pageViews || 0));
    setText("[data-traffic='local-game-opens']", format(local.gameLaunches || 0));
    setText("[data-traffic='traffic-status']", global.connected === false ? "local fallback" : "live counter");
  }

  function refreshGlobal() {
    return Promise.all([
      getGlobal("site-visits"),
      getGlobal("game-launches"),
      getGlobal("game-views"),
      getGlobal("game-completions")
    ]).then(function (values) {
      window.__MR_MACS_GLOBAL_TRAFFIC__ = {
        siteVisits: values[0],
        gameLaunches: values[1],
        gameViews: values[2],
        completions: values[3],
        connected: values.some(function (value) { return value !== null; })
      };
      render(window.__MR_MACS_GLOBAL_TRAFFIC__);
      return window.__MR_MACS_GLOBAL_TRAFFIC__;
    });
  }

  function track(type, detail, options) {
    detail = detail || {};
    options = options || {};
    var local = bumpLocal(type, detail);
    render();

    var counterName = options.counter;
    if (!counterName) {
      if (type === "pageview") counterName = "site-visits";
      if (type === "game_launch") counterName = "game-launches";
      if (type === "game_view") counterName = "game-views";
      if (type === "game_complete") counterName = "game-completions";
    }
    if (!counterName) return Promise.resolve(local);

    var onceKeyValue = options.once === false ? "" : (options.onceKey || counterName + ":" + (detail.gameId || detail.path || "session"));
    return hitGlobal(counterName, onceKeyValue).then(function (value) {
      var global = Object.assign({}, window.__MR_MACS_GLOBAL_TRAFFIC__ || {});
      if (counterName === "site-visits") global.siteVisits = value;
      if (counterName === "game-launches") global.gameLaunches = value;
      if (counterName === "game-views") global.gameViews = value;
      if (counterName === "game-completions") global.completions = value;
      global.connected = value !== null;
      window.__MR_MACS_GLOBAL_TRAFFIC__ = global;
      render(global);
      return local;
    });
  }

  window.MrMacsAnalytics = {
    track: track,
    refresh: refreshGlobal,
    render: render,
    stats: readLocal
  };

  document.addEventListener("DOMContentLoaded", function () {
    track("pageview", { title: document.title, path: pagePath }, { counter: "site-visits" });
    if (isGamePage) {
      track("game_view", {
        title: document.title,
        gameId: pagePath.split("/games/")[1] || pagePath
      }, { counter: "game-views", onceKey: "game-views:" + pagePath });
    }
    refreshGlobal();
  });
})();
