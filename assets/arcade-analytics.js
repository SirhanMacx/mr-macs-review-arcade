(function () {
  "use strict";

  var PREFIX = "mr-macs-review-arcade-v1";
  var LOCAL_KEY = PREFIX + ":local-traffic";
  var SESSION_KEY = PREFIX + ":session-id";
  var API = "https://countapi.mileshilliard.com/api/v1";
  var pagePath = location.pathname.replace(/\/+$/, "") || "/";
  var isGamePage = /\/games\//.test(pagePath);
  var today = new Date().toISOString().slice(0, 10);

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

  function deviceClass() {
    var ua = navigator.userAgent || "";
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var width = Math.min(window.innerWidth || 9999, window.screen && window.screen.width || 9999);
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (coarse && width >= 700)) return "tablet";
    if (/Mobi|Android|iPhone|iPod/i.test(ua) || (coarse && width < 700)) return "mobile";
    return "desktop";
  }

  function gameIdFromPath() {
    if (!isGamePage) return "";
    var id = pagePath.split("/games/")[1] || pagePath;
    if (id.indexOf("history-hunters-2") === 0) return "history-hunters";
    return id;
  }

  function metricFor(type) {
    if (type === "pageview") return "pageViews";
    if (type === "game_launch") return "gameLaunches";
    if (type === "game_view") return "gameViews";
    if (type === "game_play") return "gamePlays";
    if (type === "game_complete") return "completions";
    if (type === "engaged_session") return "engagedSessions";
    return "events";
  }

  function bumpLocal(type, detail) {
    var now = new Date().toISOString();
    var data = readLocal();
    var metric = metricFor(type);
    var device = deviceClass();
    data.version = 2;
    data.firstSeen = data.firstSeen || now;
    data.lastSeen = now;
    data.sessionId = sessionId();
    data.pageViews = Number(data.pageViews || 0);
    data.gameLaunches = Number(data.gameLaunches || 0);
    data.gameViews = Number(data.gameViews || 0);
    data.gamePlays = Number(data.gamePlays || 0);
    data.completions = Number(data.completions || 0);
    data.engagedSessions = Number(data.engagedSessions || 0);
    data.events = Number(data.events || 0);
    data.games = data.games || {};
    data.courses = data.courses || {};
    data.gameTypes = data.gameTypes || {};
    data.devices = data.devices || {};
    data.days = data.days || {};
    data.recent = Array.isArray(data.recent) ? data.recent : [];

    data[metric] = Number(data[metric] || 0) + 1;
    data.devices[device] = Number(data.devices[device] || 0) + 1;
    data.days[today] = data.days[today] || {};
    data.days[today][metric] = Number(data.days[today][metric] || 0) + 1;

    if (detail && detail.course) {
      var course = slug(detail.course);
      data.courses[course] = data.courses[course] || { title: detail.course, launches: 0, plays: 0 };
      if (type === "game_launch") data.courses[course].launches += 1;
      if (type === "game_play") data.courses[course].plays += 1;
    }

    if (detail && detail.gameType) {
      var gameType = slug(detail.gameType);
      data.gameTypes[gameType] = data.gameTypes[gameType] || { title: detail.gameType, launches: 0, plays: 0 };
      if (type === "game_launch") data.gameTypes[gameType].launches += 1;
      if (type === "game_play") data.gameTypes[gameType].plays += 1;
    }

    if (detail && detail.gameId) {
      var id = slug(detail.gameId);
      data.games[id] = data.games[id] || { title: detail.title || detail.gameId, launches: 0, views: 0, plays: 0, completions: 0 };
      data.games[id].launches = Number(data.games[id].launches || 0);
      data.games[id].views = Number(data.games[id].views || 0);
      data.games[id].plays = Number(data.games[id].plays || 0);
      data.games[id].completions = Number(data.games[id].completions || 0);
      if (type === "game_launch") data.games[id].launches += 1;
      if (type === "game_view") data.games[id].views += 1;
      if (type === "game_play") data.games[id].plays += 1;
      if (type === "game_complete") data.games[id].completions += 1;
      data.games[id].lastSeen = now;
    }

    data.recent.unshift({
      type: type,
      at: now,
      title: detail && detail.title || document.title || pagePath,
      gameId: detail && detail.gameId || ""
    });
    data.recent = data.recent.slice(0, 20);
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
      if (sessionStorage.getItem(onceKey)) return Promise.resolve(null);
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
    setText("[data-traffic='global-engaged']", format(global.engagedSessions));
    setText("[data-traffic='global-game-opens']", format(global.gameLaunches));
    setText("[data-traffic='global-game-views']", format(global.gameViews));
    setText("[data-traffic='global-game-plays']", format(global.gamePlays));
    setText("[data-traffic='global-completions']", format(global.completions));
    setText("[data-traffic='global-today-visits']", format(global.todayVisits));
    setText("[data-traffic='global-today-plays']", format(global.todayGamePlays));
    setText("[data-traffic='global-mobile']", format(global.mobileViews));
    setText("[data-traffic='global-tablet']", format(global.tabletViews));
    setText("[data-traffic='global-desktop']", format(global.desktopViews));
    setText("[data-traffic='local-visits']", format(local.pageViews || 0));
    setText("[data-traffic='local-game-opens']", format(local.gameLaunches || 0));
    setText("[data-traffic='local-game-plays']", format(local.gamePlays || 0));
    setText("[data-traffic='traffic-status']", global.connected === false ? "local fallback" : "live counter");
  }

  function aggregateCounter(type) {
    if (type === "pageview") return "site-visits";
    if (type === "game_launch") return "game-launches";
    if (type === "game_view") return "game-views";
    if (type === "game_play") return "game-plays";
    if (type === "game_complete") return "game-completions";
    if (type === "engaged_session") return "engaged-sessions";
    return "events";
  }

  function detailCounters(type, detail) {
    var counters = [];
    var device = deviceClass();
    var gameId = detail && detail.gameId ? slug(detail.gameId) : "";
    counters.push("daily-" + today + "-" + aggregateCounter(type));
    if (type === "pageview") counters.push("device-" + device + "-views");
    if (gameId && (type === "game_launch" || type === "game_view" || type === "game_play" || type === "game_complete")) {
      counters.push("game-" + gameId + "-" + aggregateCounter(type));
    }
    if (detail && detail.course && (type === "game_launch" || type === "game_play")) {
      counters.push("course-" + slug(detail.course) + "-" + aggregateCounter(type));
    }
    if (detail && detail.gameType && (type === "game_launch" || type === "game_play")) {
      counters.push("type-" + slug(detail.gameType) + "-" + aggregateCounter(type));
    }
    return counters;
  }

  function rememberAggregate(counterName, value) {
    var global = Object.assign({}, window.__MR_MACS_GLOBAL_TRAFFIC__ || {});
    if (counterName === "site-visits") global.siteVisits = value;
    if (counterName === "game-launches") global.gameLaunches = value;
    if (counterName === "game-views") global.gameViews = value;
    if (counterName === "game-plays") global.gamePlays = value;
    if (counterName === "game-completions") global.completions = value;
    if (counterName === "engaged-sessions") global.engagedSessions = value;
    if (counterName === "daily-" + today + "-site-visits") global.todayVisits = value;
    if (counterName === "daily-" + today + "-game-plays") global.todayGamePlays = value;
    if (counterName === "device-mobile-views") global.mobileViews = value;
    if (counterName === "device-tablet-views") global.tabletViews = value;
    if (counterName === "device-desktop-views") global.desktopViews = value;
    global.connected = value !== null;
    window.__MR_MACS_GLOBAL_TRAFFIC__ = global;
    render(global);
  }

  function hitCounters(counterNames, onceKeyValue) {
    var seen = {};
    var counters = counterNames.filter(function (name) {
      var key = slug(name);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
    return Promise.all(counters.map(function (name, index) {
      var once = onceKeyValue === "" ? "" : (index === 0 ? onceKeyValue : onceKeyValue + ":" + name);
      return hitGlobal(name, once).then(function (value) {
        rememberAggregate(name, value);
        return value;
      });
    }));
  }

  function refreshGlobal() {
    var counters = [
      "site-visits",
      "engaged-sessions",
      "game-launches",
      "game-views",
      "game-plays",
      "game-completions",
      "daily-" + today + "-site-visits",
      "daily-" + today + "-game-plays"
    ];
    return Promise.all(counters.map(getGlobal)).then(function (values) {
      window.__MR_MACS_GLOBAL_TRAFFIC__ = {
        siteVisits: values[0],
        engagedSessions: values[1],
        gameLaunches: values[2],
        gameViews: values[3],
        gamePlays: values[4],
        completions: values[5],
        todayVisits: values[6],
        todayGamePlays: values[7],
        connected: values.some(function (value) { return value !== null; })
      };
      render(window.__MR_MACS_GLOBAL_TRAFFIC__);
      return window.__MR_MACS_GLOBAL_TRAFFIC__;
    });
  }

  function track(type, detail, options) {
    detail = detail || {};
    options = options || {};
    if (!detail.gameId && isGamePage) detail.gameId = gameIdFromPath();
    if (!detail.title) detail.title = document.title;
    var local = bumpLocal(type, detail);
    render();

    var counterName = options.counter || aggregateCounter(type);
    if (!counterName) return Promise.resolve(local);

    var onceKeyValue = options.once === false ? "" : (options.onceKey || counterName + ":" + (detail.gameId || detail.path || pagePath || "session"));
    var counters = [counterName].concat(detailCounters(type, detail));
    return hitCounters(counters, onceKeyValue).then(function () {
      return local;
    });
  }

  window.MrMacsAnalytics = {
    track: track,
    refresh: refreshGlobal,
    render: render,
    stats: readLocal,
    device: deviceClass
  };

  document.addEventListener("DOMContentLoaded", function () {
    track("pageview", { title: document.title, path: pagePath }, { counter: "site-visits" });
    window.setTimeout(function () {
      track("engaged_session", { title: document.title, path: pagePath }, { counter: "engaged-sessions", onceKey: "engaged:" + pagePath });
    }, 20000);
    if (isGamePage) {
      var gameId = gameIdFromPath();
      track("game_view", {
        title: document.title,
        gameId: gameId
      }, { counter: "game-views", onceKey: "game-views:" + pagePath });
      window.setTimeout(function () {
        track("game_play", {
          title: document.title,
          gameId: gameId
        }, { counter: "game-plays", onceKey: "game-play:" + pagePath });
      }, 25000);
    }
    refreshGlobal();
  });
})();
