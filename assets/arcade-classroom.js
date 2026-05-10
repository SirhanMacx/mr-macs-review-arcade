/* Mr. Mac's Arcade — Classroom Dashboard
 *
 * Teacher / parent mode aggregator. Rolls every profile in the on-device
 * roster into class-wide stats, a sortable leaderboard, per-game
 * popularity, per-achievement adoption, side-by-side compare, and CSV
 * export. 100% local — never makes a network call.
 *
 * Single global: window.MrMacsClassroom
 *   getClassStats() · compareProfiles(idA, idB) · exportCsv()
 *   mount(container, opts) -> { unmount, refresh } · on/off
 *
 * Events: "panel:mount" · "panel:unmount" · "panel:refresh" ·
 *         "csv:export" · "compare:change"
 *
 * Idempotent: `if (root.MrMacsClassroom) return;` guards re-loads.
 */
(function (root) {
  "use strict";
  if (root.MrMacsClassroom) return;

  var STYLE_ID = "arcade-classroom-styles";
  var ROSTER_KEY = "mr-macs-arcade-roster-v1";
  var instances = [];
  var nextId = 1;

  // ── Tiny event bus ───────────────────────────────────────────────
  var listeners = {};
  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) { try { arr[i](payload); } catch (e) {} }
  }
  function on(event, handler) {
    if (typeof handler !== "function" || !event) return;
    (listeners[event] = listeners[event] || []).push(handler);
  }
  function off(event, handler) {
    var arr = listeners[event];
    if (!arr) return;
    if (!handler) { listeners[event] = []; return; }
    listeners[event] = arr.filter(function (h) { return h !== handler; });
  }

  // ── Profile bridge ───────────────────────────────────────────────
  function P() { return root.MrMacsProfile || null; }

  // Read the roster blob directly — defensive, never throws.
  function readRosterRaw() {
    try {
      if (typeof localStorage === "undefined") return null;
      var raw = localStorage.getItem(ROSTER_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.profiles || typeof parsed.profiles !== "object") return null;
      return parsed;
    } catch (e) { return null; }
  }

  // Roster metadata (active-first, then by lastVisit). Uses the public
  // helper when present, else builds equivalent shape from the raw blob.
  function rosterList() {
    try {
      if (P() && P().roster && typeof P().roster.list === "function") return P().roster.list() || [];
    } catch (e) {}
    var raw = readRosterRaw();
    if (!raw) return [];
    return Object.keys(raw.profiles).map(function (id) {
      var p = raw.profiles[id] || {};
      return {
        id: id, isActive: id === raw.activeId,
        name: p.name || "(unnamed)", avatar: p.avatar || "🎓",
        avatarKind: p.avatarKind || "emoji", course: p.course || "",
        shards: p.shards || 0, streak: (p.streak && p.streak.current) || 0,
        lastVisit: p.lastVisit || 0, createdAt: p.createdAt || 0
      };
    }).sort(function (a, b) {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return (b.lastVisit || 0) - (a.lastVisit || 0);
    });
  }

  // Full profile blob for a given id. Uses roster.read if profile.js
  // exposes it; otherwise falls through to the raw roster blob.
  function readProfile(id) {
    try {
      if (P() && P().roster && typeof P().roster.read === "function") return P().roster.read(id) || null;
    } catch (e) {}
    var raw = readRosterRaw();
    return raw ? (raw.profiles[id] || null) : null;
  }

  function achievementCatalog() {
    try { var L = P() && P().ACHIEVEMENTS; return Array.isArray(L) ? L : []; } catch (e) { return []; }
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }

  // ── Aggregation core ─────────────────────────────────────────────
  function getClassStats() {
    var meta = rosterList();
    var today = todayKey();

    var totalProfiles = meta.length;
    var totalShards = 0;
    var totalGamesPlayed = 0;
    var totalAchievementsUnlocked = 0;
    var totalScholarHits = 0;
    var streakSum = 0;
    var streakDenom = 0;
    var activeToday = 0;

    var perGame = {};        // gameId -> { plays, totalScore, bestScore, profileIdOfBest }
    var perAchievement = {}; // achId  -> count of profiles who have it
    var leaderboard = [];

    var startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    var dayMs = startOfDay.getTime();

    meta.forEach(function (entry) {
      var p = readProfile(entry.id);
      if (!p) {
        // Metadata-only fallback so the row still appears.
        leaderboard.push({
          profileId: entry.id, name: entry.name, avatar: entry.avatar,
          totalShards: entry.shards || 0, achievementsUnlocked: 0,
          gamesPlayed: 0, streak: entry.streak || 0, streakBest: 0, scholarHits: 0
        });
        totalShards += entry.shards || 0;
        return;
      }
      var pgs = (p.perGameStats && typeof p.perGameStats === "object") ? p.perGameStats : {};
      var achs = (p.achievements && typeof p.achievements === "object") ? p.achievements : {};
      var streak = (p.streak && typeof p.streak === "object") ? p.streak : {};

      var profilePlays = 0;
      Object.keys(pgs).forEach(function (gid) {
        var gs = pgs[gid] || {};
        var plays = Number(gs.plays) || 0, bestScore = Number(gs.bestScore) || 0;
        profilePlays += plays;
        var bucket = perGame[gid] || (perGame[gid] = { plays: 0, totalScore: 0, bestScore: 0, profileIdOfBest: null });
        bucket.plays += plays;
        bucket.totalScore += bestScore;
        if (bestScore > bucket.bestScore) { bucket.bestScore = bestScore; bucket.profileIdOfBest = entry.id; }
      });

      var profileAchCount = 0;
      Object.keys(achs).forEach(function (aid) {
        if (!achs[aid]) return;
        profileAchCount++;
        perAchievement[aid] = (perAchievement[aid] || 0) + 1;
      });

      var profileShards = Number(p.totalShardsEarned) || Number(p.shards) || 0;
      var profileScholar = Number(p.scholarCorrect) || 0;
      var profileStreak = Number(streak.current) || 0;
      var profileStreakBest = Number(streak.best) || 0;
      var lastVisit = Number(p.lastVisit) || 0;

      totalShards += profileShards;
      totalGamesPlayed += profilePlays;
      totalAchievementsUnlocked += profileAchCount;
      totalScholarHits += profileScholar;
      streakSum += profileStreak;
      streakDenom += 1;

      // Active-today: any recent play past midnight, or playDays/lastVisit hit.
      var playedToday = false;
      var rg = Array.isArray(p.recentGames) ? p.recentGames : [];
      for (var i = 0; i < rg.length; i++) {
        if (Number(rg[i] && rg[i].ts) >= dayMs) { playedToday = true; break; }
      }
      if (!playedToday && Array.isArray(p.playDays) && p.playDays.indexOf(today) !== -1) playedToday = true;
      if (!playedToday && lastVisit >= dayMs) playedToday = true;
      if (playedToday) activeToday++;

      leaderboard.push({
        profileId: entry.id,
        name: p.name || entry.name || "(unnamed)",
        avatar: p.avatar || entry.avatar || "🎓",
        totalShards: profileShards, achievementsUnlocked: profileAchCount,
        gamesPlayed: profilePlays, streak: profileStreak, streakBest: profileStreakBest,
        scholarHits: profileScholar, lastVisit: lastVisit
      });
    });

    leaderboard.sort(function (a, b) { return b.totalShards - a.totalShards; });

    return {
      totalProfiles: totalProfiles,
      totalShards: totalShards,
      totalGamesPlayed: totalGamesPlayed,
      totalAchievementsUnlocked: totalAchievementsUnlocked,
      totalScholarHits: totalScholarHits,
      avgStreak: streakDenom > 0 ? streakSum / streakDenom : 0,
      activeToday: activeToday,
      perGame: perGame,
      perAchievement: perAchievement,
      leaderboard: leaderboard
    };
  }

  // ── Compare two profiles side-by-side ────────────────────────────
  function summarizeProfile(id) {
    var meta = rosterList().filter(function (m) { return m.id === id; })[0] || null;
    var p = readProfile(id);
    if (!p) {
      if (!meta) return null;
      return {
        profileId: id, name: meta.name, avatar: meta.avatar, course: meta.course,
        totalShards: meta.shards || 0, gamesPlayed: 0, achievementsUnlocked: 0,
        scholarHits: 0, streakCurrent: meta.streak || 0, streakBest: 0,
        lastVisit: meta.lastVisit || 0, createdAt: meta.createdAt || 0
      };
    }
    var pgs = p.perGameStats || {}, streak = p.streak || {}, totalPlays = 0;
    Object.keys(pgs).forEach(function (k) { totalPlays += Number(pgs[k] && pgs[k].plays) || 0; });
    return {
      profileId: id,
      name: p.name || (meta && meta.name) || "(unnamed)",
      avatar: p.avatar || (meta && meta.avatar) || "🎓",
      course: p.course || (meta && meta.course) || "",
      totalShards: Number(p.totalShardsEarned) || Number(p.shards) || 0,
      gamesPlayed: totalPlays,
      achievementsUnlocked: Object.keys(p.achievements || {}).length,
      scholarHits: Number(p.scholarCorrect) || 0,
      streakCurrent: Number(streak.current) || 0,
      streakBest: Number(streak.best) || 0,
      lastVisit: Number(p.lastVisit) || 0,
      createdAt: Number(p.createdAt) || 0
    };
  }

  function compareProfiles(idA, idB) {
    var a = summarizeProfile(idA), b = summarizeProfile(idB);
    var fields = [
      ["Name", "name", "string"], ["Course", "course", "string"],
      ["Total shards", "totalShards", "number"], ["Games played", "gamesPlayed", "number"],
      ["Achievements", "achievementsUnlocked", "number"], ["Scholar hits", "scholarHits", "number"],
      ["Streak (current)", "streakCurrent", "number"], ["Streak (best)", "streakBest", "number"],
      ["Last visit", "lastVisit", "date"], ["Created", "createdAt", "date"]
    ];
    var sideBySide = fields.map(function (f) {
      return { label: f[0], key: f[1], type: f[2], a: a ? a[f[1]] : null, b: b ? b[f[1]] : null };
    });
    return { a: a, b: b, sideBySide: sideBySide };
  }

  // ── CSV export ───────────────────────────────────────────────────
  function csvEscape(value) {
    var s = String(value == null ? "" : value);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function exportCsv() {
    var stats = getClassStats();
    var lines = ['Profile,Shards,Games Played,Achievements,Scholar Hits,Streak Best'];
    stats.leaderboard.forEach(function (row) {
      lines.push([
        csvEscape(row.name),
        Number(row.totalShards) || 0,
        Number(row.gamesPlayed) || 0,
        Number(row.achievementsUnlocked) || 0,
        Number(row.scholarHits) || 0,
        Number(row.streakBest != null ? row.streakBest : row.streak) || 0
      ].join(","));
    });
    return lines.join("\n");
  }
  function downloadCsv() {
    var csv = exportCsv();
    try {
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "classroom-stats-" + todayKey() + ".csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {}
      }, 0);
      emit("csv:export", { rowCount: csv.split("\n").length - 1 });
    } catch (e) {
      // No DOM (or blocked) — emit anyway so callers can still use the string.
      emit("csv:export", { rowCount: csv.split("\n").length - 1, error: "download-blocked" });
    }
    return csv;
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[<>&"']/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;"
           : c === "\"" ? "&quot;" : "&#39;";
    });
  }
  function fmtNum(n) { return (Number(n) || 0).toLocaleString(); }
  function fmtDate(ms) {
    if (!ms) return "—";
    try { return new Date(ms).toLocaleDateString(); } catch (e) { return "—"; }
  }
  function fmtAvatar(meta) {
    var a = meta && meta.avatar;
    if (!a) return "🎓";
    if (typeof a === "string" && /^https?:|^data:|^\//.test(a)) {
      return '<img class="arc-classroom-avatar-img" src="' + escHtml(a) + '" alt="">';
    }
    return escHtml(a);
  }

  // ── CSS injection (bronze + JetBrains Mono editorial dark) ───────
  function injectStyles() {
    try {
      var doc = root.document;
      if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
      var m = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
      var s = "'Fraunces','Iowan Old Style',Georgia,serif";
      var p = ".arc-classroom-";
      var css = [
        p + "panel{padding:14px;border:1px solid rgba(205,127,50,.42);border-radius:14px;background:linear-gradient(180deg,rgba(18,22,32,.92),rgba(12,14,22,.94));box-shadow:0 6px 22px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.04);color:#e8ecf4;font-family:inherit}",
        p + "header{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:12px;padding-bottom:10px;border-bottom:1px solid rgba(205,127,50,.32);margin-bottom:14px}",
        p + "title{font-family:" + s + ";font-size:22px;font-weight:600;color:#f5f7fb;margin:0}",
        p + "meta{font-family:" + m + ";font-size:11px;color:#cd7f32;letter-spacing:.06em;text-transform:uppercase}",
        p + "meta b{color:#f5c451;font-weight:600}",
        p + "stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:18px}",
        p + "stat{padding:10px 12px;border:1px solid rgba(205,127,50,.26);border-radius:10px;background:rgba(8,10,18,.6)}",
        p + "stat-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8b94aa;margin-bottom:4px}",
        p + "stat-value{font-family:" + m + ";font-variant-numeric:tabular-nums;font-weight:600;font-size:22px;color:#f5f7fb;line-height:1.05}",
        p + "section{margin-top:18px}",
        p + "section-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding-bottom:6px;border-bottom:1px solid rgba(205,127,50,.22);margin-bottom:8px}",
        p + "section-title{font-family:" + s + ";font-size:15px;font-weight:600;color:#cd7f32;letter-spacing:.04em;text-transform:uppercase;margin:0}",
        p + "section-hint{font-family:" + m + ";font-size:10px;color:#8b94aa;letter-spacing:.06em;text-transform:uppercase}",
        p + "table{width:100%;border-collapse:collapse;font-size:13px}",
        p + "table th{font-family:" + m + ";font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#cd7f32;text-align:left;padding:6px 8px;border-bottom:1px solid rgba(205,127,50,.32);cursor:pointer;user-select:none;white-space:nowrap}",
        p + "table th[aria-sort=ascending]:after{content:' ▲';color:#f5c451}",
        p + "table th[aria-sort=descending]:after{content:' ▼';color:#f5c451}",
        p + "table td{padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.04);color:#e8ecf4;vertical-align:middle}",
        p + "table tr:hover td{background:rgba(245,196,81,.04)}",
        p + "num{font-family:" + m + ";font-variant-numeric:tabular-nums;text-align:right;color:#f5f7fb}",
        p + "rank{font-family:" + m + ";color:#cd7f32;width:36px;text-align:right}",
        p + "rank-1{color:#f5c451;font-weight:700}",
        p + "rank-2{color:#cfd6e4;font-weight:600}",
        p + "rank-3{color:#cd7f32;font-weight:600}",
        p + "name{display:flex;align-items:center;gap:8px}",
        p + "avatar{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:rgba(205,127,50,.18);border:1px solid rgba(205,127,50,.4);font-size:14px;line-height:1;flex-shrink:0}",
        p + "avatar-img{width:24px;height:24px;border-radius:50%;display:block;object-fit:cover}",
        p + "grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}",
        "@media (max-width:760px){" + p + "grid2{grid-template-columns:1fr}}",
        p + "bar{position:relative;height:6px;background:rgba(205,127,50,.14);border-radius:3px;overflow:hidden;min-width:60px}",
        p + "bar>span{display:block;height:100%;background:linear-gradient(90deg,#cd7f32,#f5c451);border-radius:3px;transition:width 300ms ease}",
        p + "actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding-top:14px;margin-top:14px;border-top:1px solid rgba(205,127,50,.22)}",
        p + "btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid rgba(245,196,81,.55);border-radius:999px;background:linear-gradient(180deg,rgba(245,196,81,.16),rgba(205,127,50,.10));color:#ffd884;font:inherit;font-size:12px;font-weight:600;letter-spacing:.04em;cursor:pointer;transition:transform 120ms ease,box-shadow 120ms ease,background 120ms ease}",
        p + "btn:hover," + p + "btn:focus-visible{outline:none;transform:translateY(-1px);box-shadow:0 4px 14px rgba(245,196,81,.18);background:linear-gradient(180deg,rgba(245,196,81,.24),rgba(205,127,50,.14))}",
        p + "compare{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;margin:8px 0 12px;padding:10px;border:1px dashed rgba(205,127,50,.32);border-radius:10px;background:rgba(8,10,18,.4)}",
        p + "compare select{width:100%;padding:6px 8px;background:rgba(8,10,18,.85);color:#f5f7fb;border:1px solid rgba(205,127,50,.42);border-radius:6px;font:inherit;font-size:12px}",
        p + "compare-out{margin-top:6px;border:1px solid rgba(205,127,50,.22);border-radius:8px;overflow:hidden}",
        p + "compare-out td." + p.slice(1) + "better{color:#f5c451;font-weight:600}",
        p + "empty{padding:24px;text-align:center;font-family:" + s + ";font-style:italic;color:#cfd6e4;font-size:14px}",
        "@media (prefers-reduced-motion:reduce){" + p + "bar>span," + p + "btn{transition:none}}"
      ].join("\n");
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.appendChild(doc.createTextNode(css));
      doc.head.appendChild(style);
    } catch (e) {}
  }

  // ── Render ───────────────────────────────────────────────────────
  function renderHeader(stats) {
    return '<div class="arc-classroom-header"><h2 class="arc-classroom-title">Classroom</h2>' +
      '<span class="arc-classroom-meta"><b>' + fmtNum(stats.totalProfiles) + '</b> profiles · Active today: <b>' +
      fmtNum(stats.activeToday) + '</b></span></div>';
  }

  function renderStatsRow(stats) {
    var cells = [
      ["Total shards earned", fmtNum(stats.totalShards)],
      ["Total games played", fmtNum(stats.totalGamesPlayed)],
      ["Achievements unlocked", fmtNum(stats.totalAchievementsUnlocked)],
      ["Scholar hits", fmtNum(stats.totalScholarHits)],
      ["Avg streak", (Math.round((stats.avgStreak || 0) * 10) / 10).toLocaleString()]
    ];
    return '<div class="arc-classroom-stats">' + cells.map(function (c) {
      return '<div class="arc-classroom-stat"><div class="arc-classroom-stat-label">' +
        escHtml(c[0]) + '</div><div class="arc-classroom-stat-value">' + c[1] + '</div></div>';
    }).join("") + '</div>';
  }

  function renderLeaderboard(stats, sortKey, sortDir) {
    var rows = stats.leaderboard.slice();
    rows.sort(function (a, b) {
      var va = a[sortKey], vb = b[sortKey];
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? (va - vb) : (vb - va);
    });
    var headers = [
      ["rank", "#", false], ["name", "Name", true], ["totalShards", "Shards", true],
      ["achievementsUnlocked", "Trophies", true], ["gamesPlayed", "Plays", true], ["streak", "Streak", true]
    ];
    var thead = headers.map(function (h) {
      var aria = h[0] === sortKey ? ' aria-sort="' + (sortDir === "asc" ? "ascending" : "descending") + '"' : "";
      var attrs = h[2] ? ' data-arc-sort="' + h[0] + '" tabindex="0" role="button"' : "";
      return '<th' + attrs + aria + '>' + escHtml(h[1]) + '</th>';
    }).join("");
    var body = rows.map(function (row, idx) {
      var rank = idx + 1, rk = rank <= 3 ? " arc-classroom-rank-" + rank : "";
      return '<tr><td class="arc-classroom-rank' + rk + '">' + rank + '</td>' +
        '<td><div class="arc-classroom-name"><span class="arc-classroom-avatar">' + fmtAvatar(row) +
        '</span><span>' + escHtml(row.name) + '</span></div></td>' +
        '<td class="arc-classroom-num">' + fmtNum(row.totalShards) + '</td>' +
        '<td class="arc-classroom-num">' + fmtNum(row.achievementsUnlocked) + '</td>' +
        '<td class="arc-classroom-num">' + fmtNum(row.gamesPlayed) + '</td>' +
        '<td class="arc-classroom-num">' + fmtNum(row.streak) + '</td></tr>';
    }).join("");
    return '<div class="arc-classroom-section"><div class="arc-classroom-section-head">' +
      '<h3 class="arc-classroom-section-title">Leaderboard</h3>' +
      '<span class="arc-classroom-section-hint">click a header to sort</span></div>' +
      '<table class="arc-classroom-table" data-arc-table="leaderboard"><thead><tr>' + thead + '</tr></thead>' +
      '<tbody>' + (body || '<tr><td colspan="6" class="arc-classroom-empty">No profiles yet.</td></tr>') +
      '</tbody></table></div>';
  }

  function renderPerGame(stats) {
    var rows = Object.keys(stats.perGame).map(function (gid) {
      var b = stats.perGame[gid];
      return { gameId: gid, plays: b.plays, totalScore: b.totalScore, bestScore: b.bestScore, profileIdOfBest: b.profileIdOfBest };
    });
    rows.sort(function (a, b) { return b.plays - a.plays; });
    if (!rows.length) return "";
    var max = rows[0].plays || 1;
    var body = rows.slice(0, 12).map(function (r) {
      var pct = Math.max(2, Math.round(100 * r.plays / max));
      return '<tr><td>' + escHtml(r.gameId) + '</td>' +
        '<td class="arc-classroom-num">' + fmtNum(r.plays) + '</td>' +
        '<td class="arc-classroom-num">' + fmtNum(r.bestScore) + '</td>' +
        '<td><div class="arc-classroom-bar"><span style="width:' + pct + '%"></span></div></td></tr>';
    }).join("");
    return '<div class="arc-classroom-section"><div class="arc-classroom-section-head">' +
      '<h3 class="arc-classroom-section-title">Game popularity</h3>' +
      '<span class="arc-classroom-section-hint">' + fmtNum(rows.length) + ' games tracked</span></div>' +
      '<table class="arc-classroom-table"><thead><tr><th>Game</th><th>Plays</th><th>Top score</th><th></th></tr></thead>' +
      '<tbody>' + body + '</tbody></table></div>';
  }

  function renderPerAchievement(stats) {
    var totalProfiles = Math.max(1, stats.totalProfiles);
    var catalog = achievementCatalog();
    var byId = {};
    catalog.forEach(function (a) { byId[a.id] = a; });
    var rows = Object.keys(stats.perAchievement).map(function (aid) {
      var def = byId[aid] || {};
      return {
        id: aid, count: stats.perAchievement[aid],
        title: def.title || aid, icon: def.icon || "🏅", tier: def.tier || ""
      };
    });
    rows.sort(function (a, b) { return b.count - a.count; });
    if (!rows.length) return "";
    var body = rows.slice(0, 10).map(function (r) {
      var pct = Math.round(100 * r.count / totalProfiles);
      return '<tr><td><span style="margin-right:6px">' + escHtml(r.icon) + '</span>' + escHtml(r.title) + '</td>' +
        '<td class="arc-classroom-num">' + fmtNum(r.count) + '</td>' +
        '<td class="arc-classroom-num">' + pct + '%</td>' +
        '<td><div class="arc-classroom-bar"><span style="width:' + pct + '%"></span></div></td></tr>';
    }).join("");
    return '<div class="arc-classroom-section"><div class="arc-classroom-section-head">' +
      '<h3 class="arc-classroom-section-title">Achievement adoption</h3>' +
      '<span class="arc-classroom-section-hint">top 10 of ' + fmtNum(rows.length) + '</span></div>' +
      '<table class="arc-classroom-table"><thead><tr><th>Achievement</th><th>Unlocks</th><th>%</th><th></th></tr></thead>' +
      '<tbody>' + body + '</tbody></table></div>';
  }

  function renderCompare(stats, idA, idB) {
    var meta = rosterList();
    if (meta.length < 2) return "";
    function options(selected) {
      return meta.map(function (m) {
        var sel = m.id === selected ? " selected" : "";
        return '<option value="' + escHtml(m.id) + '"' + sel + '>' + escHtml(m.name) + '</option>';
      }).join("");
    }
    if (!idA) idA = meta[0].id;
    if (!idB) idB = meta[1].id;
    var cmp = compareProfiles(idA, idB);
    var rows = cmp.sideBySide.map(function (f) {
      var av = f.a, bv = f.b, aCls = "", bCls = "";
      var aD = (f.type === "date") ? fmtDate(av) : (typeof av === "number" ? fmtNum(av) : escHtml(av || "—"));
      var bD = (f.type === "date") ? fmtDate(bv) : (typeof bv === "number" ? fmtNum(bv) : escHtml(bv || "—"));
      if (f.type === "number" && av !== bv) {
        if (av > bv) aCls = " arc-classroom-better"; else if (bv > av) bCls = " arc-classroom-better";
      }
      return '<tr><td>' + escHtml(f.label) + '</td><td class="arc-classroom-num' + aCls + '">' + aD +
        '</td><td class="arc-classroom-num' + bCls + '">' + bD + '</td></tr>';
    }).join("");
    return '<div class="arc-classroom-section"><div class="arc-classroom-section-head">' +
      '<h3 class="arc-classroom-section-title">Compare students</h3>' +
      '<span class="arc-classroom-section-hint">side by side</span></div>' +
      '<div class="arc-classroom-compare">' +
        '<select data-arc-compare="a" aria-label="Profile A">' + options(idA) + '</select>' +
        '<select data-arc-compare="b" aria-label="Profile B">' + options(idB) + '</select></div>' +
      '<div class="arc-classroom-compare-out"><table class="arc-classroom-table">' +
        '<thead><tr><th>Metric</th><th>' + escHtml((cmp.a && cmp.a.name) || "—") +
        '</th><th>' + escHtml((cmp.b && cmp.b.name) || "—") + '</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
  }

  function renderActions() {
    return '<div class="arc-classroom-actions">' +
      '<button type="button" class="arc-classroom-btn" data-arc-action="export-csv">Export CSV</button>' +
      '<button type="button" class="arc-classroom-btn" data-arc-action="refresh">Refresh</button></div>';
  }

  function renderEmpty(rootEl) {
    rootEl.innerHTML = '<div class="arc-classroom-panel"><div class="arc-classroom-empty">' +
      'No profiles found on this device yet.</div></div>';
  }

  function fullRender(rootEl, state) {
    var stats = getClassStats();
    state.lastStats = stats;
    if (!stats.totalProfiles) {
      renderEmpty(rootEl);
      return;
    }
    rootEl.innerHTML = '<div class="arc-classroom-panel">' +
      renderHeader(stats) +
      renderStatsRow(stats) +
      renderLeaderboard(stats, state.sortKey, state.sortDir) +
      '<div class="arc-classroom-grid2">' +
        renderPerGame(stats) +
        renderPerAchievement(stats) +
      '</div>' +
      renderCompare(stats, state.compareA, state.compareB) +
      renderActions() +
    '</div>';
  }

  // ── Mount ────────────────────────────────────────────────────────
  function mount(container, opts) {
    opts = opts || {};
    if (!container || typeof container.appendChild !== "function") {
      throw new Error("MrMacsClassroom.mount: container must be a DOM element");
    }
    injectStyles();

    var rootEl = container;
    var state = {
      sortKey: opts.sortKey || "totalShards",
      sortDir: opts.sortDir || "desc",
      compareA: opts.compareA || null,
      compareB: opts.compareB || null,
      lastStats: null
    };

    function rerender() { fullRender(rootEl, state); emit("panel:refresh", { stats: state.lastStats }); }

    function onClick(ev) {
      var t = ev.target;
      // Sortable header
      var th = t.closest && t.closest("[data-arc-sort]");
      if (th) {
        var key = th.getAttribute("data-arc-sort");
        if (key === state.sortKey) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDir = "desc";
        }
        rerender();
        return;
      }
      // Action buttons
      var btn = t.closest && t.closest("[data-arc-action]");
      if (btn) {
        var action = btn.getAttribute("data-arc-action");
        if (action === "export-csv") downloadCsv();
        else if (action === "refresh") rerender();
        return;
      }
    }

    function onChange(ev) {
      var sel = ev.target;
      var slot = sel.getAttribute && sel.getAttribute("data-arc-compare");
      if (!slot) return;
      if (slot === "a") state.compareA = sel.value;
      else if (slot === "b") state.compareB = sel.value;
      emit("compare:change", { a: state.compareA, b: state.compareB });
      rerender();
    }

    rootEl.addEventListener("click", onClick);
    rootEl.addEventListener("change", onChange);
    rerender();

    // Auto-refresh when MrMacsProfile broadcasts changes.
    var profOff = null;
    try {
      if (P() && typeof P().on === "function") {
        var evs = ["roster:change", "profile:update", "wallet:change", "achievement:unlock"];
        var handler = function () { rerender(); };
        evs.forEach(function (e) { P().on(e, handler); });
        profOff = function () {
          evs.forEach(function (e) { try { P().off && P().off(e, handler); } catch (er) {} });
        };
      }
    } catch (e) {}

    var instId = nextId++;
    var instance = {
      id: instId,
      root: rootEl,
      refresh: rerender,
      unmount: function () {
        try { rootEl.removeEventListener("click", onClick); } catch (e) {}
        try { rootEl.removeEventListener("change", onChange); } catch (e) {}
        try { rootEl.innerHTML = ""; } catch (e) {}
        if (profOff) { try { profOff(); } catch (e) {} }
        instances = instances.filter(function (x) { return x.id !== instId; });
        emit("panel:unmount", { instanceId: instId });
      }
    };
    instances.push(instance);
    emit("panel:mount", { instanceId: instId });

    return { unmount: instance.unmount, refresh: instance.refresh };
  }

  // ── Public surface ───────────────────────────────────────────────
  root.MrMacsClassroom = {
    getClassStats: getClassStats,
    compareProfiles: compareProfiles,
    exportCsv: exportCsv,
    mount: mount,
    on: on,
    off: off
  };
})(typeof window !== "undefined" ? window : this);
