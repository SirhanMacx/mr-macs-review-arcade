/**
 * arcade-week-summary.js
 * "Your Arcade Week" summary card for Mr. Mac's Review Arcade.
 *
 * Shows email-style stats for the last 7 days (or N days).
 * Appears automatically on Sundays, or when the player's first visit
 * after a 7+ day gap, guarded by a 24-hour "last shown" cooldown.
 *
 * Public API (window.MrMacsWeekSummary):
 *   compute(days=7)   -> { stats, achievements, topGames, accuracy, streakChange }
 *   mount(container, opts={}) -> { unmount, refresh }
 *   shouldShow()      -> bool
 *   showBanner(container) -> { unmount }
 *   on(event, handler)
 *   off(event, handler)
 *
 * Events: "shown" · "dismissed" · "share" · "refresh"
 *
 * CSS prefix: mws-  (week summary)
 * Visual: editorial dark + bronze, same palette as Quick Stats Panel.
 * Idempotent: second load is a no-op.
 */
(function (root) {
  "use strict";

  if (root.MrMacsWeekSummary) return;

  /* ── constants ──────────────────────────────────────────────────── */
  var STYLE_ID        = "mws-styles";
  var LS_LAST_SHOWN   = "mr-macs-week-summary-last-shown";
  var LS_LAST_VISIT   = "mr-macs-week-summary-last-visit";
  var COOLDOWN_MS     = 24 * 60 * 60 * 1000;   // 24 h between auto-shows
  var GAP_TRIGGER_MS  = 7  * 24 * 60 * 60 * 1000; // 7-day gap triggers show
  var P               = "mws-";                // CSS prefix

  /* ── tiny event bus ─────────────────────────────────────────────── */
  var _listeners = {};

  function emit(event, payload) {
    var arr = (_listeners[event] || []).slice();
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (_e) {}
    }
  }
  function on(event, handler) {
    if (typeof handler !== "function") return;
    (_listeners[event] = _listeners[event] || []).push(handler);
  }
  function off(event, handler) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (h) { return h !== handler; });
  }

  /* ── helpers ────────────────────────────────────────────────────── */
  function now() { return Date.now(); }

  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[<>&"']/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;"
           : c === '"' ? "&quot;" : "&#39;";
    });
  }

  function fmtNum(n) {
    return (Number(n) || 0).toLocaleString();
  }

  function fmtPct(n) {
    return Math.round(Number(n) || 0) + "%";
  }

  function truncate(s, max) {
    var str = String(s == null ? "" : s);
    return str.length <= max ? str : str.slice(0, Math.max(0, max - 1)) + "…";
  }

  /** Return array of YYYY-MM-DD strings for the last N days (today inclusive). */
  function lastNDayKeys(n) {
    var keys = [];
    var d = new Date();
    for (var i = 0; i < n; i++) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      keys.push(y + "-" + m + "-" + day);
      d.setDate(d.getDate() - 1);
    }
    return keys;
  }

  function readProfile() {
    try {
      var p = root.MrMacsProfile;
      if (p && typeof p.get === "function") return p.get() || {};
    } catch (_e) {}
    return {};
  }

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (_e) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, String(val)); } catch (_e) {}
  }

  /* ── shouldShow ─────────────────────────────────────────────────── */
  function shouldShow() {
    // 24-hour cooldown
    var lastShown = parseInt(lsGet(LS_LAST_SHOWN), 10) || 0;
    if (!isNaN(lastShown) && now() - lastShown < COOLDOWN_MS) return false;

    // Sunday check
    if (new Date().getDay() === 0) return true;

    // First-visit-after-7-day gap
    var lastVisit = parseInt(lsGet(LS_LAST_VISIT), 10) || 0;
    if (!isNaN(lastVisit) && lastVisit > 0 && now() - lastVisit >= GAP_TRIGGER_MS) return true;

    return false;
  }

  /** Record that the card was shown; also update last-visit stamp. */
  function markShown() {
    lsSet(LS_LAST_SHOWN, now());
    lsSet(LS_LAST_VISIT, now());
  }

  /** Call this on every page load (even when not showing the card). */
  function tickLastVisit() {
    // Only write if no stamp exists yet — subsequent visits update it
    // only when the user actually dismisses or we show the card.
    if (!lsGet(LS_LAST_VISIT)) lsSet(LS_LAST_VISIT, now());
  }

  /* ── compute ────────────────────────────────────────────────────── */
  function compute(days) {
    days = (typeof days === "number" && days > 0) ? Math.floor(days) : 7;
    var p = readProfile();
    var keys = lastNDayKeys(days);
    var keySet = {};
    for (var i = 0; i < keys.length; i++) keySet[keys[i]] = true;

    // -- shards earned --
    var totalShards = 0;
    var dailyShards = p.dailyShards || {};
    Object.keys(dailyShards).forEach(function (k) {
      if (keySet[k]) totalShards += Number(dailyShards[k]) || 0;
    });

    // -- plays: recentGames (capped at 8) + perGameStats fallback --
    // recentGames has ts (millisecond timestamp).
    var windowStart = now() - days * 24 * 60 * 60 * 1000;
    var rg = Array.isArray(p.recentGames) ? p.recentGames : [];
    var plays = 0;
    var gamePlayMap = {};   // gameId -> play count within window
    for (var j = 0; j < rg.length; j++) {
      var entry = rg[j] || {};
      if (Number(entry.ts) >= windowStart) {
        plays++;
        var gid = String(entry.gameId || entry.id || "unknown");
        gamePlayMap[gid] = (gamePlayMap[gid] || 0) + 1;
      }
    }

    // -- achievements unlocked in window --
    var ach = p.achievements || {};
    var newAchievements = [];
    Object.keys(ach).forEach(function (id) {
      var a = ach[id] || {};
      var ts = Number(a.unlockedAt || a.ts) || 0;
      if (ts >= windowStart) newAchievements.push({ id: id, name: a.name || id, ts: ts });
    });
    newAchievements.sort(function (a, b) { return b.ts - a.ts; });

    // -- accuracy --
    var totalCorrect = 0;
    var totalAnswers = 0;
    var dailyAnswers = p.dailyAnswers || {};
    Object.keys(dailyAnswers).forEach(function (k) {
      if (!keySet[k]) return;
      var da = dailyAnswers[k] || {};
      totalCorrect += Number(da.correct) || 0;
      totalAnswers += Number(da.total)   || 0;
    });
    var accuracy = totalAnswers > 0 ? totalCorrect / totalAnswers : null;

    // -- top 3 games --
    var gamePairs = Object.keys(gamePlayMap).map(function (id) {
      return { id: id, plays: gamePlayMap[id] };
    });
    gamePairs.sort(function (a, b) { return b.plays - a.plays; });
    var topGames = gamePairs.slice(0, 3);

    // -- best score --
    var bestScore = 0;
    for (var k2 = 0; k2 < rg.length; k2++) {
      var e2 = rg[k2] || {};
      if (Number(e2.ts) >= windowStart && typeof e2.score === "number") {
        if (e2.score > bestScore) bestScore = e2.score;
      }
    }

    // -- streak change --
    var streak = (p.streak && typeof p.streak === "object") ? p.streak : {};
    var streakNow  = Number(streak.current) || 0;
    var streakHist = Array.isArray(streak.history) ? streak.history : [];
    // history entry: { date, current } — find entry closest to windowStart
    var streakThen = streakNow;
    for (var sh = 0; sh < streakHist.length; sh++) {
      var he = streakHist[sh] || {};
      if (Number(he.ts || he.date) <= windowStart) {
        streakThen = Number(he.current) || 0;
      }
    }

    return {
      stats: {
        plays:       plays,
        shards:      totalShards,
        bestScore:   bestScore,
        answersTotal: totalAnswers,
        answersCorrect: totalCorrect
      },
      achievements:  newAchievements,
      topGames:      topGames,
      accuracy:      accuracy,            // 0-1 or null
      streakChange: { then: streakThen, now: streakNow }
    };
  }

  /* ── stylesheet ─────────────────────────────────────────────────── */
  function injectStyles() {
    if (!root.document || root.document.getElementById(STYLE_ID)) return;
    var mono  = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
    var serif = "'Fraunces','Iowan Old Style',Georgia,serif";
    var bronze = "#cd7f32";
    var gold   = "#f5c451";
    var css = [
      /* card */
      "." + P + "card{position:relative;max-width:680px;width:100%;",
      "  background:linear-gradient(175deg,rgba(20,24,36,.97),rgba(12,14,22,.98));",
      "  border:1px solid rgba(205,127,50,.55);border-radius:16px;",
      "  box-shadow:0 8px 32px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.04);",
      "  color:#e8ecf4;font-family:'Inter','Segoe UI',system-ui,sans-serif;",
      "  font-size:14px;overflow:hidden}",

      /* header bar */
      "." + P + "header{display:flex;align-items:center;justify-content:space-between;",
      "  gap:12px;padding:16px 20px 14px;",
      "  border-bottom:1px solid rgba(205,127,50,.28);",
      "  background:linear-gradient(90deg,rgba(205,127,50,.12),transparent)}",
      "." + P + "header-title{font-family:" + serif + ";font-style:italic;",
      "  font-size:20px;font-weight:700;color:#f5f0e6;letter-spacing:-.01em;",
      "  display:flex;align-items:center;gap:8px}",
      "." + P + "header-icon{font-size:22px;line-height:1}",
      "." + P + "header-range{font-family:" + mono + ";font-size:11px;",
      "  color:#8b94aa;letter-spacing:.06em;text-transform:uppercase;flex-shrink:0}",

      /* stat grid */
      "." + P + "grid{display:grid;grid-template-columns:repeat(3,1fr);",
      "  gap:1px;background:rgba(205,127,50,.18);border-bottom:1px solid rgba(205,127,50,.28)}",
      "." + P + "cell{display:flex;flex-direction:column;gap:3px;padding:14px 16px;",
      "  background:rgba(12,14,22,.98)}",
      "." + P + "cell-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;",
      "  color:#8b94aa;line-height:1.1;display:flex;align-items:center;gap:5px}",
      "." + P + "cell-icon{font-size:12px;opacity:.85}",
      "." + P + "cell-value{font-family:" + mono + ";font-variant-numeric:tabular-nums;",
      "  font-weight:700;font-size:24px;line-height:1;color:#f5f7fb}",
      "." + P + "cell-value.mws-gold{color:" + gold + "}",
      "." + P + "cell-sub{font-family:" + mono + ";font-size:10px;",
      "  color:" + bronze + ";letter-spacing:.03em;line-height:1.1}",

      /* top games section */
      "." + P + "section{padding:14px 20px}",
      "." + P + "section-head{font-size:11px;letter-spacing:.08em;text-transform:uppercase;",
      "  color:#8b94aa;margin-bottom:10px;display:flex;align-items:center;gap:6px}",
      "." + P + "chips{display:flex;flex-wrap:wrap;gap:8px}",
      "." + P + "game-chip{display:inline-flex;align-items:center;gap:8px;",
      "  padding:7px 11px 7px 7px;border:1px solid rgba(205,127,50,.35);",
      "  border-radius:999px;background:rgba(205,127,50,.08);",
      "  font-family:" + mono + ";font-size:12px;color:#dde3ef}",
      "." + P + "game-thumb{width:26px;height:26px;border-radius:50%;object-fit:cover;",
      "  background:#1a1e2e;flex-shrink:0;display:inline-block}",
      "." + P + "game-thumb-fallback{width:26px;height:26px;border-radius:50%;",
      "  background:rgba(205,127,50,.22);display:inline-flex;",
      "  align-items:center;justify-content:center;font-size:13px;flex-shrink:0}",
      "." + P + "game-plays{color:" + gold + ";font-weight:600;margin-left:4px}",

      /* accuracy bar */
      "." + P + "acc-bar{height:5px;border-radius:3px;background:rgba(205,127,50,.18);",
      "  margin-top:6px;overflow:hidden}",
      "." + P + "acc-fill{height:100%;border-radius:3px;",
      "  background:linear-gradient(90deg," + bronze + "," + gold + ");",
      "  transition:width 600ms ease}",

      /* looking ahead */
      "." + P + "ahead{padding:0 20px 14px}",
      "." + P + "ahead-head{font-size:11px;letter-spacing:.08em;text-transform:uppercase;",
      "  color:#8b94aa;margin-bottom:8px;display:flex;align-items:center;gap:6px}",
      "." + P + "rec-list{list-style:none;margin:0;padding:0;",
      "  display:flex;flex-direction:column;gap:5px}",
      "." + P + "rec-item{font-size:13px;color:#cfd6e4;display:flex;align-items:flex-start;gap:7px}",
      "." + P + "rec-bullet{color:" + bronze + ";flex-shrink:0;font-size:11px;margin-top:2px}",

      /* footer */
      "." + P + "footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;",
      "  padding:12px 20px;border-top:1px solid rgba(205,127,50,.22)}",
      "." + P + "btn{display:inline-flex;align-items:center;gap:6px;",
      "  padding:7px 16px;border-radius:999px;font:inherit;font-size:13px;",
      "  font-weight:600;cursor:pointer;transition:transform 120ms ease,box-shadow 120ms ease}",
      "." + P + "btn-share{border:1px solid rgba(245,196,81,.5);",
      "  background:linear-gradient(180deg,rgba(245,196,81,.16),rgba(205,127,50,.10));",
      "  color:#ffd884}",
      "." + P + "btn-share:hover,." + P + "btn-share:focus-visible{",
      "  transform:translateY(-1px);box-shadow:0 4px 14px rgba(245,196,81,.22);outline:none}",
      "." + P + "btn-dismiss{border:1px solid rgba(140,150,170,.28);",
      "  background:transparent;color:#8b94aa}",
      "." + P + "btn-dismiss:hover,." + P + "btn-dismiss:focus-visible{",
      "  color:#e8ecf4;border-color:rgba(140,150,170,.55);outline:none}",

      /* banner (chip variant) */
      "." + P + "banner{display:inline-flex;align-items:center;gap:0;",
      "  border:1px solid rgba(205,127,50,.5);border-radius:40px;",
      "  background:rgba(18,22,32,.95);",
      "  box-shadow:0 3px 14px rgba(205,127,50,.18),0 2px 6px rgba(0,0,0,.45);",
      "  overflow:hidden;opacity:0;transform:translateY(10px);",
      "  transition:opacity .25s ease,transform .25s ease;pointer-events:none;",
      "  font-family:'Inter','Segoe UI',system-ui,sans-serif;font-size:13px;",
      "  font-weight:600;color:#e8ecf4}",
      "." + P + "banner." + P + "visible{opacity:1;transform:translateY(0);pointer-events:auto}",
      "." + P + "banner-label{display:flex;align-items:center;gap:7px;",
      "  padding:9px 14px 9px 16px;cursor:pointer}",
      "." + P + "banner-cta{color:" + bronze + "}",
      "." + P + "banner-divider{width:1px;align-self:stretch;background:rgba(205,127,50,.25);flex-shrink:0}",
      "." + P + "banner-close{display:flex;align-items:center;justify-content:center;",
      "  width:36px;align-self:stretch;background:transparent;border:none;",
      "  cursor:pointer;color:#8b94aa;font-size:14px;font-weight:700;",
      "  padding:0;transition:color .15s}",
      "." + P + "banner-close:hover{color:#e8ecf4}",
      "." + P + "banner-close:focus-visible{outline:2px solid " + bronze + ";outline-offset:-2px}",

      /* responsive */
      "@media(max-width:600px){",
      "  ." + P + "grid{grid-template-columns:repeat(2,1fr)}",
      "  ." + P + "card{border-radius:12px}",
      "}",

      /* reduced motion */
      "@media(prefers-reduced-motion:reduce){",
      "  ." + P + "acc-fill{transition:none}",
      "  ." + P + "banner,." + P + "banner." + P + "visible{transition:none;transform:none}",
      "}"
    ].join("");

    var style = root.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    root.document.head.appendChild(style);
  }

  /* ── date-range label ───────────────────────────────────────────── */
  function dateRangeLabel(days) {
    var end = new Date();
    var start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    var opts = { month: "short", day: "numeric" };
    var s = start.toLocaleDateString(undefined, opts);
    var e = end.toLocaleDateString(undefined, opts);
    return s + " – " + e;
  }

  /* ── resolve game title & thumb ─────────────────────────────────── */
  function resolveGameMeta(gameId) {
    var title = String(gameId || "Game");
    var thumb = null;
    try {
      var games = root.GAMES;
      if (Array.isArray(games)) {
        for (var i = 0; i < games.length; i++) {
          var g = games[i] || {};
          if (g.id === gameId) {
            title = g.title || title;
            thumb = g.thumb || g.thumbnail || null;
            break;
          }
        }
      }
    } catch (_e) {}
    return { title: title, thumb: thumb };
  }

  /* ── looking-ahead recommendations ─────────────────────────────── */
  function buildRecs(summary, p) {
    var recs = [];

    // Achievement hunt: find first locked achievement close to completion
    try {
      var ACHIEVEMENTS = (root.MrMacsProfile && root.MrMacsProfile.ACHIEVEMENTS) || [];
      var unlocked = summary.achievements.map(function (a) { return a.id; });
      var pAch = (p && p.achievements) || {};
      for (var i = 0; i < ACHIEVEMENTS.length && recs.length < 2; i++) {
        var def = ACHIEVEMENTS[i] || {};
        if (pAch[def.id]) continue; // already unlocked
        // bump-based achievements expose a 'target' field
        if (def.target && typeof def.target === "number") {
          var prog = Number((pAch[def.id] && pAch[def.id].progress) || 0);
          var need = def.target - prog;
          if (need > 0 && need <= 5) {
            recs.push("Unlock “" + def.name + "” — need " + need + " more " + (def.unit || "plays"));
          }
        }
      }
    } catch (_e) {}

    // Accuracy nudge
    if (summary.accuracy !== null && summary.accuracy < 0.6 && summary.stats.answersTotal >= 5) {
      recs.push("Your accuracy was " + Math.round(summary.accuracy * 100) + "% — try Cram Mode to drill weak topics");
    }

    // Streak nudge
    if (summary.streakChange.now < summary.streakChange.then) {
      recs.push("Streak dropped from " + summary.streakChange.then + " to " + summary.streakChange.now + " — play today to rebuild");
    }

    // Generic if nothing triggered
    if (!recs.length) {
      if (summary.stats.plays === 0) {
        recs.push("No games this week — jump into any flagship to restart your streak");
      } else {
        recs.push("Great week! Aim to beat " + fmtNum(summary.stats.shards) + " shards next week");
      }
    }

    return recs.slice(0, 3);
  }

  /* ── build card DOM ─────────────────────────────────────────────── */
  function buildCard(summary, days) {
    var p = readProfile();
    var s = summary.stats;
    var sc = summary.streakChange;

    var accText  = summary.accuracy !== null ? fmtPct(summary.accuracy * 100) : "—";
    var accPct   = summary.accuracy !== null ? Math.round(summary.accuracy * 100) : 0;
    var streakDelta = sc.now - sc.then;
    var streakSub = streakDelta > 0 ? "+" + streakDelta + " this week"
                 : streakDelta < 0 ? streakDelta + " this week"
                 : "no change";

    // 6 stat cells
    var cells = [
      { icon: "🎮", label: "Plays",       value: fmtNum(s.plays),       sub: "this week",              gold: false },
      { icon: "💎", label: "Shards Earned", value: fmtNum(s.shards),    sub: "this week",              gold: s.shards > 0 },
      { icon: "🏆", label: "Achievements", value: fmtNum(summary.achievements.length), sub: "unlocked", gold: summary.achievements.length > 0 },
      { icon: "🎯", label: "Best Score",   value: fmtNum(s.bestScore),   sub: "top play",              gold: s.bestScore > 0 },
      { icon: "📊", label: "Accuracy",     value: accText,               sub: fmtNum(s.answersTotal) + " answered", gold: (summary.accuracy !== null && summary.accuracy >= 0.8) },
      { icon: "🔥", label: "Streak",       value: fmtNum(sc.now),        sub: streakSub,               gold: streakDelta > 0 }
    ];

    var cellsHtml = cells.map(function (c) {
      return '<div class="' + P + 'cell">' +
        '<span class="' + P + 'cell-label">' +
          '<span class="' + P + 'cell-icon" aria-hidden="true">' + c.icon + '</span>' +
          escHtml(c.label) +
        '</span>' +
        '<span class="' + P + 'cell-value' + (c.gold ? " " + P + "gold" : "") + '">' + escHtml(c.value) + '</span>' +
        '<span class="' + P + 'cell-sub">' + escHtml(c.sub) + '</span>' +
        (c.label === "Accuracy"
          ? '<div class="' + P + 'acc-bar" aria-hidden="true"><div class="' + P + 'acc-fill" style="width:0%"></div></div>'
          : "") +
      '</div>';
    }).join("");

    // Top-3 games
    var gameChips = "";
    if (summary.topGames.length) {
      gameChips = summary.topGames.map(function (g) {
        var meta = resolveGameMeta(g.id);
        var thumbEl = meta.thumb
          ? '<img class="' + P + 'game-thumb" src="' + escHtml(meta.thumb) + '" alt="" aria-hidden="true" loading="lazy">'
          : '<span class="' + P + 'game-thumb-fallback" aria-hidden="true">🎮</span>';
        return '<span class="' + P + 'game-chip">' +
          thumbEl +
          '<span>' + escHtml(truncate(meta.title, 24)) + '</span>' +
          '<span class="' + P + 'game-plays">\xd7' + escHtml(String(g.plays)) + '</span>' +
        '</span>';
      }).join("");
    } else {
      gameChips = '<span style="font-size:13px;color:#8b94aa;font-style:italic">No games played</span>';
    }

    // Looking-ahead recs
    var recs = buildRecs(summary, p);
    var recItems = recs.map(function (r) {
      return '<li class="' + P + 'rec-item">' +
        '<span class="' + P + 'rec-bullet" aria-hidden="true">▶</span>' +
        '<span>' + escHtml(r) + '</span>' +
      '</li>';
    }).join("");

    var card = root.document.createElement("div");
    card.className = P + "card";
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", "Your Arcade Week summary");

    card.innerHTML =
      '<div class="' + P + 'header">' +
        '<span class="' + P + 'header-title">' +
          '<span class="' + P + 'header-icon" aria-hidden="true">🗓️</span>' +
          'Your Arcade Week' +
        '</span>' +
        '<span class="' + P + 'header-range">' + escHtml(dateRangeLabel(days)) + '</span>' +
      '</div>' +

      '<div class="' + P + 'grid" role="group" aria-label="Week stats">' +
        cellsHtml +
      '</div>' +

      '<div class="' + P + 'section">' +
        '<div class="' + P + 'section-head"><span aria-hidden="true">🏅</span> Top games this week</div>' +
        '<div class="' + P + 'chips">' + gameChips + '</div>' +
      '</div>' +

      '<div class="' + P + 'ahead">' +
        '<div class="' + P + 'ahead-head"><span aria-hidden="true">🔭</span> Looking ahead</div>' +
        '<ul class="' + P + 'rec-list">' + recItems + '</ul>' +
      '</div>' +

      '<div class="' + P + 'footer">' +
        '<button type="button" class="' + P + 'btn ' + P + 'btn-share" data-mws-action="share">' +
          '📤 Share' +
        '</button>' +
        '<button type="button" class="' + P + 'btn ' + P + 'btn-dismiss" data-mws-action="dismiss">' +
          'Dismiss' +
        '</button>' +
      '</div>';

    // Wire accuracy bar width after append via rAF
    var accFill = card.querySelector("." + P + "acc-fill");
    if (accFill) {
      requestAnimationFrame(function () {
        accFill.style.width = accPct + "%";
      });
    }

    return card;
  }

  /* ── mount ──────────────────────────────────────────────────────── */
  var _mountedCard  = null;
  var _mountCont    = null;
  var _mountDays    = 7;

  function _doRefresh() {
    if (!_mountedCard || !_mountCont) return;
    var parent = _mountedCard.parentNode;
    if (!parent) return;
    var summary = compute(_mountDays);
    var newCard = buildCard(summary, _mountDays);
    _wireCardButtons(newCard, summary);
    parent.replaceChild(newCard, _mountedCard);
    _mountedCard = newCard;
    emit("refresh", { summary: summary });
  }

  function _wireCardButtons(card, summary) {
    var shareBtn   = card.querySelector('[data-mws-action="share"]');
    var dismissBtn = card.querySelector('[data-mws-action="dismiss"]');

    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        emit("share", { summary: summary });
        // delegate to MrMacsImportExport if loaded
        try {
          var ie = root.MrMacsImportExport;
          if (ie && typeof ie.shareWeekSummary === "function") {
            ie.shareWeekSummary(summary); return;
          }
        } catch (_e) {}
        // native share API fallback
        try {
          if (root.navigator && root.navigator.share) {
            root.navigator.share({
              title: "My Arcade Week",
              text: "I played " + summary.stats.plays + " games and earned " + fmtNum(summary.stats.shards) + " shards this week on Mr. Mac’s Review Arcade!"
            });
            return;
          }
        } catch (_e) {}
        // last resort: clipboard
        try {
          var text = "My Arcade Week: " + summary.stats.plays + " plays · " +
                     fmtNum(summary.stats.shards) + " shards earned · " +
                     (summary.accuracy !== null ? fmtPct(summary.accuracy * 100) + " accuracy" : "");
          root.navigator.clipboard.writeText(text);
        } catch (_e) {}
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", function () {
        _unmountCard();
        lsSet(LS_LAST_VISIT, now());
        emit("dismissed", {});
      });
    }
  }

  function _unmountCard() {
    if (_mountedCard && _mountedCard.parentNode) {
      _mountedCard.parentNode.removeChild(_mountedCard);
    }
    _mountedCard = null;
    _mountCont   = null;
  }

  function mount(container, opts) {
    opts = opts || {};
    var days = (typeof opts.days === "number" && opts.days > 0) ? opts.days : 7;

    if (!root.document) return { unmount: function () {}, refresh: function () {} };
    var cont = (container instanceof Element) ? container : root.document.body;

    // already mounted in same container: refresh only
    if (_mountedCard && _mountCont === cont) {
      _doRefresh();
      return { unmount: _unmountCard, refresh: _doRefresh };
    }

    // tear down previous mount if in different container
    _unmountCard();

    injectStyles();

    _mountCont  = cont;
    _mountDays  = days;

    var summary = compute(days);
    var card = buildCard(summary, days);
    _wireCardButtons(card, summary);
    _mountedCard = card;
    cont.appendChild(card);
    markShown();
    emit("shown", { summary: summary });

    return { unmount: _unmountCard, refresh: _doRefresh };
  }

  /* ── showBanner (chip CTA variant) ─────────────────────────────── */
  var _activeBanner = null;

  function showBanner(container) {
    if (!root.document) return { unmount: function () {} };
    var cont = (container instanceof Element) ? container : root.document.body;

    // remove stale banner
    if (_activeBanner && _activeBanner.parentNode) {
      _activeBanner.parentNode.removeChild(_activeBanner);
      _activeBanner = null;
    }

    injectStyles();

    var banner = root.document.createElement("div");
    banner.className = P + "banner";
    banner.innerHTML =
      '<div class="' + P + 'banner-label" role="button" tabindex="0" ' +
        'aria-label="View your arcade week summary">' +
        '🗓️ ' +
        '<span class="' + P + 'banner-cta">View week summary →</span>' +
      '</div>' +
      '<div class="' + P + 'banner-divider" aria-hidden="true"></div>' +
      '<button type="button" class="' + P + 'banner-close" aria-label="Dismiss banner">✕</button>';

    cont.appendChild(banner);
    _activeBanner = banner;

    // animate in
    requestAnimationFrame(function () {
      banner.classList.add(P + "visible");
    });

    var labelEl = banner.querySelector("." + P + "banner-label");
    if (labelEl) {
      var openCard = function () {
        removeBanner();
        mount(cont);
      };
      labelEl.addEventListener("click", openCard);
      labelEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCard(); }
      });
    }

    var closeBtn = banner.querySelector("." + P + "banner-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        removeBanner();
        lsSet(LS_LAST_SHOWN, now());
        emit("dismissed", { source: "banner" });
      });
    }

    function removeBanner() {
      if (_activeBanner && _activeBanner.parentNode) {
        _activeBanner.parentNode.removeChild(_activeBanner);
      }
      _activeBanner = null;
    }

    return { unmount: removeBanner };
  }

  /* ── init: update last-visit on every load ──────────────────────── */
  tickLastVisit();

  /* ── public API ─────────────────────────────────────────────────── */
  root.MrMacsWeekSummary = {
    compute:    compute,
    mount:      mount,
    shouldShow: shouldShow,
    showBanner: showBanner,
    on:         on,
    off:        off
  };

}(typeof window !== "undefined" ? window
  : (typeof globalThis !== "undefined" ? globalThis : this)));
