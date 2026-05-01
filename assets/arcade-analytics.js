(function () {
  "use strict";

  var PREFIX = "mr-macs-review-arcade-v1";
  var LOCAL_KEY = PREFIX + ":local-traffic";
  var PUBLIC_CACHE_KEY = PREFIX + ":public-traffic-cache";
  var SESSION_KEY = PREFIX + ":session-id";
  var API = "https://countapi.mileshilliard.com/api/v1";
  var pagePath = location.pathname.replace(/\/+$/, "") || "/";
  var isGamePage = /\/games\//.test(pagePath);
  var localOnly = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname || "") || location.protocol === "file:";
  var today = new Date().toISOString().slice(0, 10);
  var TOP_GAME_IDS = ["history-hunters", "archive-quest", "regents-practice-exam", "ap-practice-exam", "cold-war-invaders", "source-sprint", "regents-gauntlet"];
  var TOP_GAME_LABELS = {
    "history-hunters": "History Hunters",
    "archive-quest": "Archive Quest",
    "regents-practice-exam": "Regents Exam",
    "ap-practice-exam": "AP Practice",
    "cold-war-invaders": "Cold War Invaders",
    "source-sprint": "Source Sprint",
    "regents-gauntlet": "Regents Gauntlet"
  };

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

  function readPublicCache() {
    try {
      return JSON.parse(localStorage.getItem(PUBLIC_CACHE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function writePublicCache(data) {
    try {
      var clean = Object.assign({}, data || {});
      clean.cachedAt = new Date().toISOString();
      localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(clean));
    } catch (error) {}
  }

  function publicMetric(value) {
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  function publicOr(value, fallback) {
    var next = publicMetric(value);
    return next === null ? fallback : next;
  }

  function dateOffset(daysAgo) {
    var date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
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

  var PROGRESS_KEY = PREFIX + ":student-progress";

  function readProgress() {
    try {
      var data = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
      data.version = 1;
      data.recent = Array.isArray(data.recent) ? data.recent : [];
      data.games = data.games || {};
      data.weakTopics = data.weakTopics || {};
      data.courseTotals = data.courseTotals || {};
      return data;
    } catch (error) {
      return { version: 1, recent: [], games: {}, weakTopics: {}, courseTotals: {} };
    }
  }

  function writeProgress(data) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch (error) {}
  }

  function notifyProgress(data) {
    try {
      window.dispatchEvent(new CustomEvent("mrmacs-progress", { detail: data }));
    } catch (error) {}
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "mrmacs-progress-updated" }, window.location.origin);
      }
    } catch (error) {}
  }

  function normalizeTopics(detail) {
    var values = [];
    if (Array.isArray(detail.weakTopics)) values = values.concat(detail.weakTopics);
    if (Array.isArray(detail.studyTargets)) values = values.concat(detail.studyTargets);
    if (Array.isArray(detail.targets)) values = values.concat(detail.targets);
    if (detail.topic) values.push(detail.topic);
    if (detail.course && Number(detail.accuracy) < 70) values.push(detail.course);
    return values.map(function (value) {
      if (Array.isArray(value)) value = value[0];
      if (value && typeof value === "object") value = value.title || value.label || value.name || value.set || value.topic;
      return String(value || "").trim();
    }).filter(Boolean).slice(0, 8);
  }

  function recordProgressEvent(type, detail) {
    detail = detail || {};
    if (type !== "game_launch" && type !== "game_play" && type !== "game_complete") return readProgress();
    var now = new Date().toISOString();
    var data = readProgress();
    var gameId = slug(detail.gameId || gameIdFromPath() || detail.title || pagePath);
    var score = Number(detail.score);
    var accuracy = Number(detail.accuracy);
    var course = detail.course || "";
    var game = data.games[gameId] || {
      id: gameId,
      title: detail.title || gameId,
      course: course,
      gameType: detail.gameType || "",
      launches: 0,
      plays: 0,
      completions: 0,
      bestScore: null,
      bestAccuracy: null
    };
    game.title = detail.title || game.title;
    game.course = course || game.course;
    game.gameType = detail.gameType || game.gameType;
    if (type === "game_launch") game.launches = Number(game.launches || 0) + 1;
    if (type === "game_play") game.plays = Number(game.plays || 0) + 1;
    if (type === "game_complete") {
      game.completions = Number(game.completions || 0) + 1;
      if (Number.isFinite(score)) game.bestScore = game.bestScore === null ? score : Math.max(Number(game.bestScore || 0), score);
      if (Number.isFinite(accuracy)) game.bestAccuracy = game.bestAccuracy === null ? accuracy : Math.max(Number(game.bestAccuracy || 0), accuracy);
    }
    game.lastSeen = now;
    data.games[gameId] = game;

    if (course) {
      var c = slug(course);
      data.courseTotals[c] = data.courseTotals[c] || { title: course, launches: 0, completions: 0 };
      if (type === "game_launch") data.courseTotals[c].launches += 1;
      if (type === "game_complete") data.courseTotals[c].completions += 1;
    }

    normalizeTopics(detail).forEach(function (topic) {
      var key = slug(topic);
      data.weakTopics[key] = data.weakTopics[key] || { title: topic, count: 0, lastSeen: now };
      data.weakTopics[key].count += 1;
      data.weakTopics[key].lastSeen = now;
    });

    data.recent.unshift({
      type: type,
      at: now,
      gameId: gameId,
      title: game.title,
      course: game.course,
      score: Number.isFinite(score) ? score : null,
      accuracy: Number.isFinite(accuracy) ? accuracy : null
    });
    data.recent = data.recent.slice(0, 18);
    data.lastUpdated = now;
    writeProgress(data);
    notifyProgress(data);
    return data;
  }

  function progressSummary(games) {
    var data = readProgress();
    var gameValues = Object.keys(data.games).map(function (id) { return data.games[id]; });
    var weak = Object.keys(data.weakTopics).map(function (id) { return data.weakTopics[id]; })
      .sort(function (a, b) { return Number(b.count || 0) - Number(a.count || 0) || String(b.lastSeen || "").localeCompare(String(a.lastSeen || "")); })
      .slice(0, 5);
    var completed = gameValues.filter(function (game) { return Number(game.completions || 0) > 0; }).length;
    var best = gameValues
      .filter(function (game) { return game.bestScore !== null || game.bestAccuracy !== null; })
      .sort(function (a, b) { return Number(b.bestScore || b.bestAccuracy || 0) - Number(a.bestScore || a.bestAccuracy || 0); })
      .slice(0, 5);
    return {
      data: data,
      recent: data.recent.slice(0, 6),
      weak: weak,
      best: best,
      completed: completed,
      recommendation: recommendation(games || [], data, weak)
    };
  }

  function findGame(games, ids) {
    for (var i = 0; i < ids.length; i += 1) {
      var found = (games || []).find(function (game) { return game.id === ids[i]; });
      if (found) return found;
    }
    return null;
  }

  function includesAny(value, terms) {
    value = String(value || "").toLowerCase();
    return terms.some(function (term) { return value.indexOf(String(term || "").toLowerCase()) !== -1; });
  }

  function bestTopicMatch(games, weak, recent) {
    if (!weak.length) return null;
    var course = recent && recent.course;
    var terms = weak.map(function (item) { return item.title; }).filter(function (title) {
      if (!title) return false;
      if (course && title === course) return false;
      return !/\b(grade|social studies|history|all courses|ap)\b/i.test(title);
    });
    if (!terms.length) return null;
    var candidates = (games || []).filter(function (game) {
      var text = [game.title, game.subtitle, game.course, game.subject, game.gameType, game.originalFile].join(" ");
      return includesAny(text, terms);
    });
    if (course) {
      var courseCandidates = candidates.filter(function (game) { return game.course === course; });
      if (courseCandidates.length) candidates = courseCandidates;
    }
    candidates.sort(function (a, b) {
      var aj = /jeopardy|unit review|unit \+|final/i.test([a.title, a.gameType, a.originalFile, a.file].join(" ")) ? -2 : 0;
      var bj = /jeopardy|unit review|unit \+|final/i.test([b.title, b.gameType, b.originalFile, b.file].join(" ")) ? -2 : 0;
      var ar = /regents|source|practice|gauntlet/i.test([a.title, a.gameType].join(" ")) ? -1 : 0;
      var br = /regents|source|practice|gauntlet/i.test([b.title, b.gameType].join(" ")) ? -1 : 0;
      return (aj + ar) - (bj + br);
    });
    return candidates[0] || null;
  }

  function recommendation(games, data, weak) {
    var recent = data.recent && data.recent[0];
    var lastAccuracy = recent && Number(recent.accuracy);
    var weakText = (weak || []).map(function (item) { return item.title || ""; }).join(" ");
    var recentPractice = recent && /regents|practice/i.test(recent.title || "");
    if (!data.recent.length) {
      return { reason: "Start with the diagnostic so the arcade can pick the right practice path.", game: findGame(games, ["mastery-path", "archive-quest", "history-hunters", "lightning-review"]) };
    }
    if (recentPractice && /document evidence|context and relationships|outside information|argument and organization|civic scaffold/i.test(weakText)) {
      return { reason: "Rewrite the weakest Regents writing section before a new full exam.", game: findGame(games, ["writing-coach", "regents-practice-exam", "regents-gauntlet"]) };
    }
    if ((recentPractice && /mcq source reading|source|stimulus/i.test(weakText)) || (Number.isFinite(lastAccuracy) && lastAccuracy < 70)) {
      return { reason: "Build source-reading reps before the next full exam.", game: findGame(games, ["source-lab", "source-sprint", "regents-gauntlet", "lightning-review"]) };
    }
    var topicMatch = bestTopicMatch(games, weak, recent);
    if (topicMatch) {
      return { reason: "Review the weakest topic while it is still fresh.", game: topicMatch };
    }
    if (weak.length) {
      return { reason: "Target the weak topic list while it is fresh.", game: findGame(games, ["mastery-path", "regents-gauntlet", "source-lab", "vocab-vault"]) };
    }
    return { reason: "Keep the streak going with a polished arcade mode.", game: findGame(games, ["mastery-path", "archive-quest", "history-hunters", "chrono-defense-infinite", "lightning-review"]) };
  }

  window.MrMacsProgress = {
    recordEvent: recordProgressEvent,
    read: readProgress,
    summary: progressSummary,
    clear: function () {
      try { localStorage.removeItem(PROGRESS_KEY); } catch (error) {}
      notifyProgress(readProgress());
    }
  };

  function requestCounter(method, name) {
    if (localOnly) return Promise.resolve(null);
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

  function metricFrom(global, key) {
    var value = publicMetric(global && global[key]);
    return value === null ? null : value;
  }

  function renderTrafficTrend(global) {
    var holder = document.getElementById("trafficTrend");
    var summary = document.getElementById("trafficTrendSummary");
    if (!holder) return;
    var rows = Array.isArray(global.dailyVisits) ? global.dailyVisits : [];
    if (!rows.length) {
      holder.innerHTML = '<span class="traffic-empty">Trend appears after the public counter connects.</span>';
      if (summary) summary.textContent = "7-day public trend";
      return;
    }
    var max = Math.max.apply(null, rows.map(function (row) { return Number(row.visits || 0); }).concat([1]));
    var total = rows.reduce(function (sum, row) { return sum + Number(row.visits || 0); }, 0);
    holder.innerHTML = rows.map(function (row) {
      var height = Math.max(10, Math.round((Number(row.visits || 0) / max) * 100));
      var label = String(row.date || "").slice(5).replace("-", "/");
      return '<span class="traffic-bar" title="' + label + ': ' + format(row.visits) + ' visits" style="--h:' + height + '%"><i></i><b>' + label + '</b></span>';
    }).join("");
    if (summary) summary.textContent = format(total) + " visits over 7 days";
  }

  function renderTopGames(global) {
    var holder = document.getElementById("trafficTopGames");
    if (!holder) return;
    var games = Array.isArray(global.topGames) ? global.topGames : [];
    games = games.filter(function (game) { return Number(game.launches || 0) > 0; }).slice(0, 5);
    if (!games.length) {
      holder.innerHTML = '<span class="traffic-empty">Top games appear as public launches build.</span>';
      return;
    }
    var max = Math.max.apply(null, games.map(function (game) { return Number(game.launches || 0); }).concat([1]));
    holder.innerHTML = games.map(function (game, index) {
      var width = Math.max(8, Math.round((Number(game.launches || 0) / max) * 100));
      return '<div class="traffic-game"><span><b>' + (index + 1) + '</b>' + game.label + '</span><strong>' + format(game.launches) + '</strong><i style="--w:' + width + '%"></i></div>';
    }).join("");
  }

  function render(extra) {
    var local = readLocal();
    var cache = readPublicCache();
    var global = Object.assign({}, cache, window.__MR_MACS_GLOBAL_TRAFFIC__ || {}, extra || {});
    var connected = global.connected === true;
    setText("[data-traffic='global-visits']", format(metricFrom(global, "siteVisits")));
    setText("[data-traffic='global-engaged']", format(metricFrom(global, "engagedSessions")));
    setText("[data-traffic='global-game-opens']", format(metricFrom(global, "gameLaunches")));
    setText("[data-traffic='global-game-views']", format(metricFrom(global, "gameViews")));
    setText("[data-traffic='global-game-plays']", format(metricFrom(global, "gamePlays")));
    setText("[data-traffic='global-completions']", format(metricFrom(global, "completions")));
    setText("[data-traffic='global-today-visits']", format(metricFrom(global, "todayVisits")));
    setText("[data-traffic='global-today-plays']", format(metricFrom(global, "todayGamePlays")));
    setText("[data-traffic='global-mobile']", format(metricFrom(global, "mobileViews")));
    setText("[data-traffic='global-tablet']", format(metricFrom(global, "tabletViews")));
    setText("[data-traffic='global-desktop']", format(metricFrom(global, "desktopViews")));
    setText("[data-traffic='local-visits']", format(local.pageViews || 0));
    setText("[data-traffic='local-game-opens']", format(local.gameLaunches || 0));
    setText("[data-traffic='local-game-plays']", format(local.gamePlays || 0));
    setText("[data-traffic='traffic-status']", connected ? "live public" : "tracking");
    renderTrafficTrend(global);
    renderTopGames(global);
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
    if (value !== null) writePublicCache(Object.assign({}, readPublicCache(), global, { connected: true }));
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
      "game-completions"
    ];
    var days = [6, 5, 4, 3, 2, 1, 0].map(dateOffset);
    var dailyVisitCounters = days.map(function (date) { return "daily-" + date + "-site-visits"; });
    var dailyPlayCounters = days.map(function (date) { return "daily-" + date + "-game-plays"; });
    var topGameCounters = TOP_GAME_IDS.map(function (id) { return "game-" + id + "-game-launches"; });
    var allCounters = counters.concat(dailyVisitCounters, dailyPlayCounters, topGameCounters);
    return Promise.all(allCounters.map(getGlobal)).then(function (values) {
      var existing = Object.assign({}, readPublicCache(), window.__MR_MACS_GLOBAL_TRAFFIC__ || {});
      var dailyVisits = days.map(function (date, index) {
        return {
          date: date,
          visits: publicMetric(values[counters.length + index]) || 0,
          plays: publicMetric(values[counters.length + dailyVisitCounters.length + index]) || 0
        };
      });
      var topOffset = counters.length + dailyVisitCounters.length + dailyPlayCounters.length;
      var topGames = TOP_GAME_IDS.map(function (id, index) {
        return {
          id: id,
          label: TOP_GAME_LABELS[id] || id,
          launches: publicMetric(values[topOffset + index]) || 0
        };
      }).sort(function (a, b) {
        return Number(b.launches || 0) - Number(a.launches || 0);
      });
      var connected = values.some(function (value) { return value !== null; });
      if (!connected) {
        window.__MR_MACS_GLOBAL_TRAFFIC__ = Object.assign({}, existing, { connected: false });
        render(window.__MR_MACS_GLOBAL_TRAFFIC__);
        return window.__MR_MACS_GLOBAL_TRAFFIC__;
      }
      window.__MR_MACS_GLOBAL_TRAFFIC__ = {
        siteVisits: publicOr(values[0], existing.siteVisits),
        engagedSessions: publicOr(values[1], existing.engagedSessions),
        gameLaunches: publicOr(values[2], existing.gameLaunches),
        gameViews: publicOr(values[3], existing.gameViews),
        gamePlays: publicOr(values[4], existing.gamePlays),
        completions: publicOr(values[5], existing.completions),
        todayVisits: dailyVisits[dailyVisits.length - 1] ? dailyVisits[dailyVisits.length - 1].visits : existing.todayVisits,
        todayGamePlays: dailyVisits[dailyVisits.length - 1] ? dailyVisits[dailyVisits.length - 1].plays : existing.todayGamePlays,
        dailyVisits: dailyVisits,
        topGames: topGames,
        connected: true
      };
      writePublicCache(Object.assign({}, existing, window.__MR_MACS_GLOBAL_TRAFFIC__));
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
    if (window.MrMacsProgress && window.MrMacsProgress.recordEvent) {
      window.MrMacsProgress.recordEvent(type, detail);
    }
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
