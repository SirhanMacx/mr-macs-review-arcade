(function () {
  "use strict";

  var PREFIX = "mr-macs-review-arcade-v1";
  var LOCAL_KEY = PREFIX + ":local-traffic";
  var PUBLIC_CACHE_KEY = PREFIX + ":public-traffic-cache";
  var SESSION_KEY = PREFIX + ":session-id";
  var EVENT_LOG_KEY = PREFIX + ":event-log";
  var API = "https://countapi.mileshilliard.com/api/v1";

  // sessionStorage throws on every access in iOS Safari Private Mode and in
  // some embedded WebViews. Mirror the localStorage try/catch pattern used
  // in arcade-profile.js so a private-mode tab doesn't crash analytics.
  var safeSession = {
    get: function (k) {
      try { return sessionStorage.getItem(k); } catch (e) { return null; }
    },
    set: function (k, v) {
      try { sessionStorage.setItem(k, v); return true; } catch (e) { return false; }
    },
    remove: function (k) {
      try { sessionStorage.removeItem(k); } catch (e) {}
    }
  };

  // Privacy: never persist or transmit these keys. They are stripped before
  // detail payloads enter the local event log or any global counter.
  var PII_KEYS = [
    "name", "firstName", "lastName", "fullName", "studentName", "userName",
    "email", "emailAddress", "phone", "phoneNumber",
    "address", "ip", "ssn", "dob", "birthday"
  ];
  var EVENT_LOG_LIMIT = 200;
  var eventListeners = [];
  var debugMode = false;
  try {
    debugMode = (typeof window !== "undefined" && window.__MR_MACS_DEBUG__ === true) ||
      (typeof localStorage !== "undefined" && localStorage.getItem(PREFIX + ":debug") === "1");
  } catch (error) {}

  function debugLog() {
    if (!debugMode || typeof console === "undefined" || typeof console.log !== "function") return;
    try { console.log.apply(console, ["[mrmacs-analytics]"].concat(Array.prototype.slice.call(arguments))); } catch (error) {}
  }

  function stripPII(detail) {
    if (!detail || typeof detail !== "object") return detail;
    var clean = {};
    Object.keys(detail).forEach(function (key) {
      var lowered = String(key).toLowerCase();
      if (PII_KEYS.indexOf(key) !== -1 || PII_KEYS.indexOf(lowered) !== -1) return;
      var value = detail[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        clean[key] = stripPII(value);
      } else if (Array.isArray(value)) {
        clean[key] = value.map(function (item) {
          return (item && typeof item === "object" && !Array.isArray(item)) ? stripPII(item) : item;
        });
      } else {
        clean[key] = value;
      }
    });
    return clean;
  }
  var pagePath = location.pathname.replace(/\/+$/, "") || "/";
  var isGamePage = /\/games\//.test(pagePath);
  var localOnly = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname || "") || location.protocol === "file:";
  var today = new Date().toISOString().slice(0, 10);
  var TRAFFIC_START_DATE = "2026-04-28";
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
    var id = safeSession.get(SESSION_KEY);
    if (!id) {
      id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
      safeSession.set(SESSION_KEY, id);
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
    try { id = decodeURIComponent(id); } catch (error) {}
    id = id.replace(/\/index\.html$/i, "").replace(/\/+$/g, "");
    if (id.indexOf("history-hunters-2") === 0) return "history-hunters";
    if (id.indexOf("/") > -1) return id.split("/")[0];
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
      data.games[id].engagement = Number(data.games[id].engagement || 0);
      if (type === "game_launch") data.games[id].launches += 1;
      if (type === "game_view") data.games[id].views += 1;
      if (type === "game_play") data.games[id].plays += 1;
      if (type === "game_complete") data.games[id].completions += 1;
      data.games[id].engagement = data.games[id].launches + data.games[id].views + data.games[id].plays + data.games[id].completions;
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
      data.version = 2;
      data.recent = Array.isArray(data.recent) ? data.recent : [];
      data.games = data.games || {};
      data.weakTopics = data.weakTopics || {};
      data.courseTotals = data.courseTotals || {};
      return data;
    } catch (error) {
      return { version: 2, recent: [], games: {}, weakTopics: {}, courseTotals: {} };
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
    data.days = data.days || {};
    data.days[today] = data.days[today] || {};
    data.days[today][type] = Number(data.days[today][type] || 0) + 1;
    game.lastSeen = now;
    data.games[gameId] = game;

    if (course) {
      var c = slug(course);
      data.courseTotals[c] = data.courseTotals[c] || { title: course, launches: 0, plays: 0, completions: 0, bestScore: null, bestAccuracy: null };
      data.courseTotals[c].title = course;
      if (type === "game_launch") data.courseTotals[c].launches += 1;
      if (type === "game_play") data.courseTotals[c].plays = Number(data.courseTotals[c].plays || 0) + 1;
      if (type === "game_complete") data.courseTotals[c].completions += 1;
      if (type === "game_complete" && Number.isFinite(score)) {
        data.courseTotals[c].bestScore = data.courseTotals[c].bestScore === null ? score : Math.max(Number(data.courseTotals[c].bestScore || 0), score);
      }
      if (type === "game_complete" && Number.isFinite(accuracy)) {
        data.courseTotals[c].bestAccuracy = data.courseTotals[c].bestAccuracy === null ? accuracy : Math.max(Number(data.courseTotals[c].bestAccuracy || 0), accuracy);
      }
      data.courseTotals[c].lastSeen = now;
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

  function courseFocus(data) {
    var rows = Object.keys((data && data.courseTotals) || {}).map(function (id) {
      var row = data.courseTotals[id] || {};
      return {
        id: id,
        title: row.title || id,
        launches: Number(row.launches || 0),
        plays: Number(row.plays || 0),
        completions: Number(row.completions || 0),
        bestScore: row.bestScore,
        bestAccuracy: row.bestAccuracy,
        lastSeen: row.lastSeen || ""
      };
    }).filter(function (row) {
      return row.launches || row.plays || row.completions;
    });
    rows.sort(function (a, b) {
      var scoreA = a.completions * 9 + a.plays * 4 + a.launches;
      var scoreB = b.completions * 9 + b.plays * 4 + b.launches;
      return scoreB - scoreA || String(b.lastSeen || "").localeCompare(String(a.lastSeen || ""));
    });
    return rows[0] || null;
  }

  function activeStreak(data) {
    var days = Object.keys((data && data.days) || {}).sort().reverse();
    if (!days.length) return 0;
    var streak = 0;
    for (var i = 0; i < days.length; i += 1) {
      if (days[i] !== dateOffset(streak)) break;
      var row = data.days[days[i]] || {};
      var total = Number(row.gamePlays || 0) + Number(row.completions || 0) + Number(row.gameLaunches || 0);
      if (!total) break;
      streak += 1;
    }
    return streak;
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
      streak: activeStreak(data),
      courseFocus: courseFocus(data),
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

  function sameCourseGames(games, course, matcher) {
    return (games || []).filter(function (game) {
      if (course && game.course !== course) return false;
      return matcher(game);
    });
  }

  function firstCourseMatch(games, course, matcher) {
    return sameCourseGames(games, course, matcher)[0] || null;
  }

  function recommendation(games, data, weak) {
    var recent = data.recent && data.recent[0];
    var lastAccuracy = recent && Number(recent.accuracy);
    var weakText = (weak || []).map(function (item) { return item.title || ""; }).join(" ");
    var recentPractice = recent && /regents|practice/i.test(recent.title || "");
    var recentCourse = recent && String(recent.course || "");
    var apContext = /^AP\b/i.test(recentCourse) || /\bAP\b|advanced placement/i.test([recentCourse, weakText, recent && recent.title].join(" "));
    var focus = courseFocus(data);
    var focusCourse = focus && focus.title || recentCourse;
    var recentGameId = recent && recent.gameId;
    var repeatedRecent = (data.recent || []).filter(function (item) { return item.gameId === recentGameId; }).length >= 3;
    if (!data.recent.length) {
      return { reason: "Start with the strongest game, then the report will personalize the next pick.", game: findGame(games, ["history-hunters", "archive-quest", "cold-war-invaders", "regents-practice-exam", "mastery-path"]) };
    }
    if (repeatedRecent && focusCourse) {
      var diversify = firstCourseMatch(games, focusCourse, function (game) {
        if (game.id === recentGameId) return false;
        return /jeopardy|regents|practice|source|gauntlet|hunter|quest/i.test([game.id, game.title, game.gameType].join(" "));
      });
      if (diversify) {
        return { reason: "Switch formats to keep the same course sharp without repeating the exact same activity.", game: diversify };
      }
    }
    if (apContext && (Number.isFinite(lastAccuracy) && lastAccuracy < 75 || /dbq|leq|saq|frq|argument|evidence|document|analysis|ap/i.test(weakText))) {
      return { reason: "Raise AP rigor with a released exam page and AP-style writing signals.", game: findGame(games, ["ap-practice-exam", "writing-coach", "source-lab"]) };
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
    if (focusCourse) {
      var sameCourseBoard = firstCourseMatch(games, focusCourse, function (game) {
        return /jeopardy|unit review|unit \+|final/i.test([game.title, game.gameType, game.originalFile, game.file].join(" "));
      });
      if (sameCourseBoard && (!Number.isFinite(lastAccuracy) || lastAccuracy < 85)) {
        return { reason: "Stay in your most active course and clean up content gaps with a board review.", game: sameCourseBoard };
      }
    }
    if (weak.length) {
      return { reason: "Target the weak topic list while it is fresh.", game: findGame(games, ["mastery-path", "regents-gauntlet", "source-lab", "vocab-vault"]) };
    }
    if (Number.isFinite(lastAccuracy) && lastAccuracy >= 85) {
      return { reason: "You are ready for a full timed practice run.", game: findGame(games, apContext ? ["ap-practice-exam", "regents-practice-exam", "regents-gauntlet"] : ["regents-practice-exam", "ap-practice-exam", "regents-gauntlet"]) };
    }
    return { reason: "Keep the streak going with a polished arcade mode.", game: findGame(games, ["history-hunters", "archive-quest", "cold-war-invaders", "mastery-path", "lightning-review"]) };
  }

  window.MrMacsProgress = {
    recordEvent: recordProgressEvent,
    read: readProgress,
    summary: progressSummary,
    courseFocus: function () { return courseFocus(readProgress()); },
    clear: function () {
      try { localStorage.removeItem(PROGRESS_KEY); } catch (error) {}
      notifyProgress(readProgress());
    },
    clearAllLocalPractice: function () {
      try {
        Object.keys(localStorage).forEach(function (key) {
          if (
            key === PROGRESS_KEY ||
            key === LOCAL_KEY ||
            key.indexOf("mrmacs-regents-practice") > -1 ||
            key.indexOf("mrmacs-ap-practice") > -1 ||
            key.indexOf("mrmacs-review-arcade") === 0
          ) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {}
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
      if (safeSession.get(onceKey)) return Promise.resolve(null);
      safeSession.set(onceKey, "1");
    }
    return requestCounter("hit", name).catch(function () { return null; });
  }

  function getGlobal(name) {
    return requestCounter("get", name).catch(function () { return null; });
  }

  function runCounterSeries(counters, worker) {
    var results = [];
    var chain = Promise.resolve();
    counters.forEach(function (name, index) {
      chain = chain.then(function () {
        return worker(name, index);
      }).then(function (value) {
        results[index] = value;
      });
    });
    return chain.then(function () { return results; });
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

  function topLaunchTotal(global) {
    var games = Array.isArray(global && global.topGames) ? global.topGames : [];
    var total = games.reduce(function (sum, game) {
      return sum + Number(game.launches || 0);
    }, 0);
    return total > 0 ? total : null;
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
    games = games.map(function (game) {
      return Object.assign({}, game, {
        engagement: Number(game.launches || 0) + Number(game.views || 0) + Number(game.plays || 0) + Number(game.completions || 0)
      });
    }).filter(function (game) { return Number(game.engagement || 0) > 0; }).slice(0, 5);
    if (!games.length) {
      holder.innerHTML = '<span class="traffic-empty">Top games appear as public launches build.</span>';
      return;
    }
    var max = Math.max.apply(null, games.map(function (game) { return Number(game.engagement || 0); }).concat([1]));
    holder.innerHTML = games.map(function (game, index) {
      var width = Math.max(8, Math.round((Number(game.engagement || 0) / max) * 100));
      return '<div class="traffic-game"><span><b>' + (index + 1) + '</b>' + game.label + '</span><strong>' + format(game.engagement) + '</strong><i style="--w:' + width + '%"></i></div>';
    }).join("");
  }

  function render(extra) {
    var local = readLocal();
    var cache = readPublicCache();
    var global = Object.assign({}, cache, window.__MR_MACS_GLOBAL_TRAFFIC__ || {}, extra || {});
    var connected = global.connected === true;
    var launchCount = metricFrom(global, "gameLaunches");
    var playCount = metricFrom(global, "gamePlays");
    var topLaunches = topLaunchTotal(global);
    if (topLaunches !== null && (launchCount === null || launchCount < topLaunches)) launchCount = topLaunches;
    setText("[data-traffic='global-visits']", format(metricFrom(global, "siteVisits")));
    setText("[data-traffic='global-engaged']", format(metricFrom(global, "engagedSessions")));
    setText("[data-traffic='global-game-opens']", format(launchCount));
    setText("[data-traffic='global-game-plays']", format(playCount));
    setText("[data-traffic='global-game-views']", format(metricFrom(global, "gameViews")));
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
    var global = Object.assign({}, readPublicCache(), window.__MR_MACS_GLOBAL_TRAFFIC__ || {});
    if (value === null) {
      global.connected = false;
      window.__MR_MACS_GLOBAL_TRAFFIC__ = global;
      render(global);
      return;
    }
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
    global.connected = true;
    window.__MR_MACS_GLOBAL_TRAFFIC__ = global;
    writePublicCache(Object.assign({}, readPublicCache(), global, { connected: true }));
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
    return runCounterSeries(counters, function (name, index) {
      var once = onceKeyValue === "" ? "" : (index === 0 ? onceKeyValue : onceKeyValue + ":" + name);
      return hitGlobal(name, once).then(function (value) {
        rememberAggregate(name, value);
        return value;
      });
    });
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
    var visitDays = days.filter(function (date) { return date >= TRAFFIC_START_DATE; });
    var dailyVisitCounters = visitDays.map(function (date) { return "daily-" + date + "-site-visits"; });
    var topGameCounters = [];
    var allCounters = counters.concat(dailyVisitCounters, topGameCounters);
    return runCounterSeries(allCounters, function (name) {
      return getGlobal(name);
    }).then(function (values) {
      var existing = Object.assign({}, readPublicCache(), window.__MR_MACS_GLOBAL_TRAFFIC__ || {});
      var visitLookup = {};
      visitDays.forEach(function (date, index) {
        visitLookup[date] = publicMetric(values[counters.length + index]) || 0;
      });
      var dailyVisits = days.map(function (date) {
        return {
          date: date,
          visits: date < TRAFFIC_START_DATE ? 0 : (visitLookup[date] || 0)
        };
      });
      var topOffset = counters.length + dailyVisitCounters.length;
      var topGames = topGameCounters.length ? TOP_GAME_IDS.map(function (id, index) {
        var offset = topOffset + index * 4;
        var launches = publicMetric(values[offset]) || 0;
        var views = publicMetric(values[offset + 1]) || 0;
        var plays = publicMetric(values[offset + 2]) || 0;
        var completions = publicMetric(values[offset + 3]) || 0;
        return {
          id: id,
          label: TOP_GAME_LABELS[id] || id,
          launches: launches,
          views: views,
          plays: plays,
          completions: completions,
          engagement: launches + views + plays + completions
        };
      }).sort(function (a, b) {
        return Number(b.engagement || 0) - Number(a.engagement || 0);
      }) : (Array.isArray(existing.topGames) ? existing.topGames : []);
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
        todayGamePlays: existing.todayGamePlays,
        dailyVisits: dailyVisits,
        topGames: topGames,
        connected: true
      };
      writePublicCache(Object.assign({}, existing, window.__MR_MACS_GLOBAL_TRAFFIC__));
      render(window.__MR_MACS_GLOBAL_TRAFFIC__);
      return window.__MR_MACS_GLOBAL_TRAFFIC__;
    });
  }

  function readEventLog() {
    try {
      var raw = JSON.parse(localStorage.getItem(EVENT_LOG_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (error) {
      return [];
    }
  }

  function writeEventLog(entries) {
    try {
      localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(entries.slice(0, EVENT_LOG_LIMIT)));
    } catch (error) {}
  }

  function appendEvent(type, detail) {
    var entry = {
      type: String(type || "unknown"),
      at: new Date().toISOString(),
      detail: stripPII(detail || {}),
      session: sessionId(),
      device: deviceClass()
    };
    var log = readEventLog();
    log.unshift(entry);
    writeEventLog(log);
    eventListeners.forEach(function (handler) {
      try { handler(entry); } catch (error) {
        debugLog("listener error", error);
      }
    });
    debugLog("event", entry.type, entry.detail);
    return entry;
  }

  function getEventLog(limit) {
    var log = readEventLog();
    var n = Number(limit);
    if (Number.isFinite(n) && n > 0) return log.slice(0, n);
    return log.slice();
  }

  function resetLog() {
    try { localStorage.removeItem(EVENT_LOG_KEY); } catch (error) {}
  }

  function onEvent(handler) {
    if (typeof handler !== "function") return function () {};
    eventListeners.push(handler);
    return function off() {
      var idx = eventListeners.indexOf(handler);
      if (idx >= 0) eventListeners.splice(idx, 1);
    };
  }

  function setDebug(flag) {
    debugMode = !!flag;
    try { localStorage.setItem(PREFIX + ":debug", debugMode ? "1" : "0"); } catch (error) {}
    return debugMode;
  }

  function track(type, detail, options) {
    detail = detail || {};
    options = options || {};
    if (!detail.gameId && isGamePage) detail.gameId = gameIdFromPath();
    if (!detail.title) detail.title = document.title;
    var safeDetail = stripPII(detail);
    var local = bumpLocal(type, safeDetail);
    if (window.MrMacsProgress && window.MrMacsProgress.recordEvent) {
      window.MrMacsProgress.recordEvent(type, safeDetail);
    }
    appendEvent(type, safeDetail);
    render();

    var counterName = options.counter || aggregateCounter(type);
    if (!counterName) return Promise.resolve(local);

    var onceKeyValue = options.once === false ? "" : (options.onceKey || counterName + ":" + (safeDetail.gameId || safeDetail.path || pagePath || "session"));
    var counters = [counterName].concat(detailCounters(type, safeDetail));
    return hitCounters(counters, onceKeyValue).then(function () {
      return local;
    });
  }

  window.MrMacsAnalytics = {
    track: track,
    refresh: refreshGlobal,
    render: render,
    stats: readLocal,
    device: deviceClass,
    getEventLog: getEventLog,
    resetLog: resetLog,
    onEvent: onEvent,
    stripPII: stripPII,
    setDebug: setDebug,
    isDebug: function () { return debugMode; }
  };

  document.addEventListener("DOMContentLoaded", function () {
    var pageTrack = track("pageview", { title: document.title, path: pagePath }, { counter: "site-visits" });
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
    pageTrack.then(function () {
      refreshGlobal();
    }, function () {
      refreshGlobal();
    });
  });
})();
