/* Mr. Mac's Arcade — Quick Stats Panel
 *
 * Compact home-page panel: six stat cells + one CTA card. Reads from
 * MrMacsProfile (source of truth) and, when present, MrMacsMastery
 * for weak-topic recommendations. Local-only, no network.
 *
 * API: window.MrMacsQuickStats
 *   mount(container, opts) -> { unmount }
 *   refresh()
 *   getStats() -> { shards, streak, gamesPlayed, achievementsUnlocked,
 *                   masteryAvg, playToday, scholarHits, weakestTopic }
 *   on(event, handler) / off(event, handler)
 *
 * Events: "panel:mount" · "panel:unmount" · "panel:refresh" · "cta:click"
 *
 * Visual: editorial dark + bronze borders, JetBrains Mono numerics,
 * smooth count-up + gold flash on increases (both honor reduced-motion).
 * Idempotent: IIFE no-ops on re-load; multiple mounts auto-sync.
 */
(function (root) {
  "use strict";
  if (root.MrMacsQuickStats) return;

  var STYLE_ID = "quick-stats-styles";
  var ATTR_INSTANCE = "data-mm-qs-id";

  // mount() pushes onto `instances`; refresh() walks them so multiple
  // panels on a page stay in sync. Detached panels are auto-pruned.
  var instances = [];
  var nextId = 1;

  // Tiny event bus for the public on/off contract.
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

  // Profile bridge — every call wrapped, every fallback safe.
  function P() { return root.MrMacsProfile || null; }
  function profileExists() {
    try { return !!(P() && P().exists && P().exists()); } catch (e) { return false; }
  }
  function readProfile() {
    try { if (P() && P().get) return P().get() || {}; } catch (e) {}
    return {};
  }
  function activeCourse() {
    try { if (P() && P().getCourse) return String(P().getCourse() || ""); } catch (e) {}
    return "";
  }
  function totalAchievements() {
    try {
      var list = P() && P().ACHIEVEMENTS;
      return Array.isArray(list) ? list.length : 0;
    } catch (e) { return 0; }
  }
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }

  // Read the profile once, derive every stat the panel needs.
  function computeStats() {
    var p = readProfile();
    var pgs = p.perGameStats || {};
    var totalPlays = 0;
    Object.keys(pgs).forEach(function (k) { totalPlays += Number(pgs[k] && pgs[k].plays) || 0; });

    var streak = (p.streak && typeof p.streak === "object") ? p.streak : {};
    var today = todayKey();
    var earnedToday = Number((p.dailyShards || {})[today]) || 0;

    // Plays today = recentGames entries whose ts is past local midnight.
    // recentGames is capped at 8, so the scan is cheap. Fallback: if
    // playDays includes today we count it as 1.
    var startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    var dayMs = startOfDay.getTime();
    var rg = Array.isArray(p.recentGames) ? p.recentGames : [];
    var playToday = 0;
    for (var i = 0; i < rg.length; i++) {
      if (Number(rg[i] && rg[i].ts) >= dayMs) playToday++;
    }
    if (!playToday && Array.isArray(p.playDays) && p.playDays.indexOf(today) !== -1) playToday = 1;

    // Unweighted mean of per-topic accuracy for the active course —
    // a deep topic shouldn't drown out a shallow one in an at-a-
    // glance number. null when no topic has any attempts yet.
    var course = activeCourse();
    var ts = (p.topicStats && p.topicStats[course]) || {};
    var sum = 0, denom = 0;
    Object.keys(ts).forEach(function (k) {
      var b = ts[k] || {};
      var total = Number(b.total) || 0;
      if (total > 0) { sum += (Number(b.correct) || 0) / total * 100; denom++; }
    });
    var masteryAvg = denom > 0 ? Math.round(sum / denom) : null;

    var weakest = null;
    try {
      var M = root.MrMacsMastery;
      if (M && typeof M.getRecommendation === "function") {
        var rec = M.getRecommendation(course || undefined);
        if (rec && rec.topic) {
          weakest = {
            topic: String(rec.topic),
            course: rec.course ? String(rec.course) : course,
            score: Number(rec.score) || 0,
            mastery: rec.mastery ? String(rec.mastery) : ""
          };
        }
      }
    } catch (e) {}

    return {
      shards: Number(p.shards) || 0,
      shardsEarnedToday: earnedToday,
      streak: Number(streak.current) || 0,
      streakBest: Number(streak.best) || 0,
      gamesPlayed: totalPlays,
      achievementsUnlocked: Object.keys(p.achievements || {}).length,
      achievementsTotal: totalAchievements(),
      masteryAvg: masteryAvg,
      course: course,
      playToday: playToday,
      scholarHits: Number(p.scholarCorrect) || 0,
      weakestTopic: weakest
    };
  }

  // ── Small helpers ────────────────────────────────────────────────
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[<>&"']/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;"
           : c === "\"" ? "&quot;" : "&#39;";
    });
  }
  function fmtNum(n) { return (Number(n) || 0).toLocaleString(); }
  function truncate(s, max) {
    var str = String(s == null ? "" : s);
    return str.length <= max ? str : str.slice(0, Math.max(0, max - 1)) + "…";
  }
  function prefersReducedMotion() {
    try {
      return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) { return false; }
  }

  // Smooth count-up (~600ms easeOutCubic). Skips animation when
  // values match or the user prefers reduced motion.
  function animateNumber(el, fromVal, toVal, formatter) {
    if (!el) return;
    var fmt = formatter || fmtNum;
    if (fromVal === toVal || prefersReducedMotion()) { el.textContent = fmt(toVal); return; }
    var start = (root.performance && root.performance.now) ? root.performance.now() : Date.now();
    var raf = root.requestAnimationFrame;
    if (!raf) { el.textContent = fmt(toVal); return; }
    function tick(now) {
      var t = Math.min(1, (now - start) / 600);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.round(fromVal + (toVal - fromVal) * eased));
      if (t < 1) { try { raf(tick); } catch (e) { el.textContent = fmt(toVal); } }
      else el.textContent = fmt(toVal);
    }
    try { raf(tick); } catch (e) { el.textContent = fmt(toVal); }
  }

  function flashCell(el) {
    if (!el || prefersReducedMotion()) return;
    el.classList.remove("qs-flash");
    try { void el.offsetWidth; } catch (e) {} // restart the animation
    el.classList.add("qs-flash");
    setTimeout(function () { try { el.classList.remove("qs-flash"); } catch (e) {} }, 900);
  }

  // Inject CSS once. All class names are qs- prefixed.
  function injectStyles() {
    try {
      var doc = root.document;
      if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
      var mono = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
      var serif = "'Fraunces','Iowan Old Style',Georgia,serif";
      var css = [
        ".qs-panel{display:flex;flex-wrap:wrap;align-items:stretch;padding:8px;border:1px solid rgba(205,127,50,.42);border-radius:14px;background:linear-gradient(180deg,rgba(18,22,32,.92),rgba(12,14,22,.94));box-shadow:0 6px 22px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.04);color:#e8ecf4;font-family:inherit}",
        ".qs-cells{display:grid;grid-template-columns:repeat(6,minmax(80px,1fr));flex:1 1 480px;min-width:480px}",
        ".qs-cell{position:relative;display:flex;flex-direction:column;justify-content:center;gap:2px;padding:10px 12px;min-height:60px;border-right:1px solid rgba(205,127,50,.26)}",
        ".qs-cell:last-child{border-right:none}",
        ".qs-cell-label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8b94aa;line-height:1.1}",
        ".qs-cell-icon{font-size:13px;line-height:1;opacity:.85}",
        ".qs-cell-value{font-family:" + mono + ";font-variant-numeric:tabular-nums;font-weight:600;font-size:18px;line-height:1.1;color:#f5f7fb}",
        ".qs-cell-sub{font-family:" + mono + ";font-size:10px;color:#cd7f32;letter-spacing:.04em;line-height:1.1}",
        ".qs-delta{color:#f5c451}",
        ".qs-bar{position:relative;width:100%;height:3px;background:rgba(205,127,50,.18);border-radius:2px;margin-top:3px;overflow:hidden}",
        ".qs-bar>span{display:block;height:100%;background:linear-gradient(90deg,#cd7f32,#f5c451);border-radius:2px;transition:width 400ms ease}",
        ".qs-cta{flex:0 1 220px;min-width:200px;display:flex;flex-direction:column;justify-content:center;gap:6px;padding:10px 14px;margin-left:8px;border-left:1px solid rgba(205,127,50,.42)}",
        ".qs-cta-title{font-family:" + serif + ";font-style:italic;font-size:13px;color:#f5f7fb;line-height:1.25}",
        ".qs-cta-meta{font-family:" + mono + ";font-size:10px;color:#8b94aa;letter-spacing:.06em;text-transform:uppercase}",
        ".qs-cta-btn{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid rgba(245,196,81,.55);border-radius:999px;background:linear-gradient(180deg,rgba(245,196,81,.16),rgba(205,127,50,.10));color:#ffd884;font:inherit;font-size:12px;font-weight:600;letter-spacing:.04em;cursor:pointer;transition:transform 120ms ease,box-shadow 120ms ease,background 120ms ease}",
        ".qs-cta-btn:hover,.qs-cta-btn:focus-visible{outline:none;transform:translateY(-1px);box-shadow:0 4px 14px rgba(245,196,81,.18);background:linear-gradient(180deg,rgba(245,196,81,.24),rgba(205,127,50,.14))}",
        ".qs-empty{padding:14px 16px;width:100%;display:flex;justify-content:space-between;align-items:center;gap:12px;font-family:" + serif + ";font-style:italic;color:#cfd6e4;font-size:13.5px}",
        ".qs-flash{animation:qs-flash 900ms ease-out}",
        "@keyframes qs-flash{0%{box-shadow:inset 0 0 0 0 rgba(245,196,81,0);background:transparent}40%{box-shadow:inset 0 0 0 2px rgba(245,196,81,.6);background:rgba(245,196,81,.12)}100%{box-shadow:inset 0 0 0 0 rgba(245,196,81,0);background:transparent}}",
        "@media (max-width:720px){.qs-panel{flex-direction:column}.qs-cells{grid-template-columns:repeat(3,1fr);min-width:0}.qs-cell:nth-child(3n){border-right:none}.qs-cta{margin-left:0;border-left:none;border-top:1px solid rgba(205,127,50,.42);padding-top:12px}}",
        "@media (prefers-reduced-motion:reduce){.qs-flash{animation:none}.qs-bar>span{transition:none}}"
      ].join("\n");
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.appendChild(doc.createTextNode(css));
      doc.head.appendChild(style);
    } catch (e) {}
  }

  // No profile yet — show a single sign-in card.
  function renderEmpty(rootEl) {
    rootEl.innerHTML =
      '<div class="qs-empty">' +
        '<span>Sign in to see your stats.</span>' +
        '<button type="button" class="qs-cta-btn" data-qs-action="create-profile">Create Profile</button>' +
      '</div>';
    var btn = rootEl.querySelector('[data-qs-action="create-profile"]');
    if (!btn) return;
    btn.addEventListener("click", function () {
      emit("cta:click", { kind: "create-profile" });
      // Prefer the existing welcome flow if it's been wired up; fall
      // back to a generic event so the host can handle it.
      try { if (P() && P().openWelcome) { P().openWelcome(); return; } } catch (e) {}
      try {
        var ev = new root.CustomEvent("profile:create-request", { detail: {} });
        (root.document || root).dispatchEvent(ev);
      } catch (e) {}
    });
  }

  // Build the static cell skeleton once. updateValues() then animates
  // the numbers in place so we never flicker between refreshes.
  function buildPanel(rootEl, stats) {
    var bar = stats.achievementsTotal > 0
      ? '<div class="qs-bar" aria-hidden="true"><span style="width:0%"></span></div>'
      : "";
    var cells = [
      ["shards", "💎", "Shards"],
      ["streak", "🔥", "Streak"],
      ["plays", "🎮", "Plays"],
      ["achievements", "🏆", "Trophies", bar],
      ["mastery", "📊", "Mastery"],
      ["today", "📅", "Today"]
    ].map(function (c) {
      return '<div class="qs-cell" data-qs-cell="' + c[0] + '">' +
               '<span class="qs-cell-label"><span class="qs-cell-icon" aria-hidden="true">' +
                 escHtml(c[1]) + '</span> ' + escHtml(c[2]) + '</span>' +
               '<span class="qs-cell-value" data-qs-value>0</span>' +
               '<span class="qs-cell-sub" data-qs-sub></span>' +
               (c[3] || "") +
             '</div>';
    }).join("");
    rootEl.innerHTML =
      '<div class="qs-cells" role="group" aria-label="Player stats">' + cells + '</div>' +
      '<div class="qs-cta" data-qs-cta></div>';
    updateValues(rootEl, stats, /*isFirst=*/true);
    renderCta(rootEl, stats);
  }

  function getCell(rootEl, key) {
    return rootEl.querySelector('[data-qs-cell="' + key + '"]');
  }

  // Diff vs last snapshot, animate counts, flash gold on rewarding
  // increases (shards / streak).
  function updateValues(rootEl, stats, isFirst) {
    var prev = isFirst ? null : (rootEl.__qsPrev || null);

    function setCell(key, prevVal, nextVal, subText, formatter) {
      var cell = getCell(rootEl, key);
      if (!cell) return cell;
      animateNumber(cell.querySelector("[data-qs-value]"),
                    Number(prevVal) || 0, Number(nextVal) || 0, formatter);
      var subEl = cell.querySelector("[data-qs-sub]");
      if (subEl) subEl.textContent = subText == null ? "" : String(subText);
      return cell;
    }

    var shardsSub = (stats.shardsEarnedToday | 0) > 0
      ? '+' + fmtNum(stats.shardsEarnedToday) + ' today' : "";
    var shardsCell = setCell("shards", prev ? prev.shards : 0, stats.shards, shardsSub);
    if (shardsCell) {
      var s = shardsCell.querySelector("[data-qs-sub]");
      if (s) s.classList.toggle("qs-delta", shardsSub.length > 0);
    }

    setCell("streak", prev ? prev.streak : 0, stats.streak,
            stats.streak > 0 ? "best: " + fmtNum(stats.streakBest) : "start one today");
    setCell("plays", prev ? prev.gamesPlayed : 0, stats.gamesPlayed, "");

    var achSub = stats.achievementsTotal > 0 ? "of " + fmtNum(stats.achievementsTotal) : "";
    var achCell = setCell("achievements",
                          prev ? prev.achievementsUnlocked : 0,
                          stats.achievementsUnlocked, achSub);
    if (achCell && stats.achievementsTotal > 0) {
      var fill = achCell.querySelector(".qs-bar > span");
      if (fill) {
        var pct = Math.max(0, Math.min(100,
          Math.round(100 * stats.achievementsUnlocked / stats.achievementsTotal)));
        fill.style.width = pct + "%";
      }
    }

    // Mastery: render "—" with no animation when no data yet, else %.
    var masteryCell = getCell(rootEl, "mastery");
    if (masteryCell) {
      var valEl = masteryCell.querySelector("[data-qs-value]");
      var subEl = masteryCell.querySelector("[data-qs-sub]");
      if (stats.masteryAvg == null) {
        if (valEl) valEl.textContent = "—";
      } else {
        animateNumber(valEl,
                      (prev && prev.masteryAvg != null) ? prev.masteryAvg : 0,
                      stats.masteryAvg, function (v) { return v + "%"; });
      }
      if (subEl) {
        subEl.textContent = stats.course ? truncate(stats.course, 22)
                          : (stats.masteryAvg == null ? "no data yet" : "across topics");
      }
    }

    setCell("today", prev ? prev.playToday : 0, stats.playToday,
            stats.scholarHits > 0 ? fmtNum(stats.scholarHits) + " scholar" : "");

    if (prev) {
      if (stats.shards > prev.shards && shardsCell) flashCell(shardsCell);
      if (stats.streak > prev.streak) flashCell(getCell(rootEl, "streak"));
    }

    rootEl.__qsPrev = {
      shards: stats.shards, streak: stats.streak,
      gamesPlayed: stats.gamesPlayed,
      achievementsUnlocked: stats.achievementsUnlocked,
      masteryAvg: stats.masteryAvg, playToday: stats.playToday
    };
  }

  // CTA picks one of three modes based on profile state.
  function renderCta(rootEl, stats) {
    var slot = rootEl.querySelector("[data-qs-cta]");
    if (!slot) return;

    var kind, title, meta, btnLabel, payload;
    if (stats.gamesPlayed < 3) {
      kind = "new-here"; title = "🆕 New here?";
      meta = "Start with a flagship";
      btnLabel = "Start with Citadel →"; payload = { gameId: "citadel" };
    } else if (stats.weakestTopic && stats.weakestTopic.topic) {
      kind = "drill-weak";
      title = "🎯 Weak spot: <strong>" + escHtml(truncate(stats.weakestTopic.topic, 36)) + "</strong>";
      meta = stats.weakestTopic.score ? stats.weakestTopic.score + "% mastery" : "Drill this next";
      btnLabel = "Drill it →";
      payload = {
        topic: stats.weakestTopic.topic,
        course: stats.weakestTopic.course || stats.course || ""
      };
    } else {
      kind = "random-pick"; title = "🎲 Random pick";
      meta = stats.course ? truncate(stats.course, 22) : "Any flagship";
      btnLabel = "Pick a flagship →"; payload = {};
    }

    slot.innerHTML =
      '<div class="qs-cta-title">' + title + '</div>' +
      '<div class="qs-cta-meta">' + escHtml(meta) + '</div>' +
      '<button type="button" class="qs-cta-btn" data-qs-action="' + escHtml(kind) + '">' +
        escHtml(btnLabel) + '</button>';

    var btn = slot.querySelector('[data-qs-action]');
    if (!btn) return;
    btn.addEventListener("click", function () {
      emit("cta:click", { kind: kind, payload: payload });
      // Hosts can listen on cta:click to override — otherwise we
      // dispatch a bubbling DOM event so a page handler can route.
      try {
        var ev = new root.CustomEvent("mr-macs-quick-stats:cta", {
          detail: { kind: kind, payload: payload }, bubbles: true
        });
        (rootEl || root.document || root).dispatchEvent(ev);
      } catch (e) {}
    });
  }

  function mount(container, opts) {
    opts = opts || {};
    if (!container || typeof container !== "object" || !container.appendChild) {
      return { unmount: function () {} };
    }
    injectStyles();

    var id = nextId++;
    var rootEl = root.document.createElement("div");
    rootEl.className = "qs-panel";
    rootEl.setAttribute(ATTR_INSTANCE, String(id));
    rootEl.setAttribute("role", "region");
    rootEl.setAttribute("aria-label", opts.ariaLabel || "Quick player stats");
    container.appendChild(rootEl);

    function render() {
      try {
        if (!profileExists()) { rootEl.__qsPrev = null; renderEmpty(rootEl); return; }
        var stats = computeStats();
        if (!rootEl.querySelector(".qs-cells")) {
          buildPanel(rootEl, stats);
        } else {
          updateValues(rootEl, stats, /*isFirst=*/false);
          renderCta(rootEl, stats);
        }
      } catch (e) { /* never break the host page */ }
    }

    var instance = { id: id, rootEl: rootEl, render: render };
    instances.push(instance);
    render();
    emit("panel:mount", { container: container });

    return {
      unmount: function () {
        instances = instances.filter(function (it) { return it !== instance; });
        try { if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl); } catch (e) {}
        emit("panel:unmount", { container: container });
      }
    };
  }

  // Re-render every mounted instance. Auto-prunes panels whose root
  // is no longer attached (host swapped HTML out from under us).
  function refresh() {
    var stats = null;
    instances = instances.filter(function (it) {
      try {
        if (!it.rootEl || !root.document.contains(it.rootEl)) return false;
        it.render(); return true;
      } catch (e) { return false; }
    });
    try { stats = computeStats(); } catch (e) {}
    emit("panel:refresh", { stats: stats });
  }

  function getStats() {
    try { return computeStats(); }
    catch (e) {
      return { shards: 0, streak: 0, gamesPlayed: 0, achievementsUnlocked: 0,
               masteryAvg: null, playToday: 0, scholarHits: 0, weakestTopic: null };
    }
  }

  // Subscribe to every profile event that could change a displayed
  // number. MrMacsProfile may not exist at script load (load-order
  // race) — if so, we retry once on DOMContentLoaded.
  function bindProfileEvents() {
    var prof = P();
    if (!prof || typeof prof.on !== "function") return false;
    [
      "profile:update", "profile:create", "profile:import", "profile:wipe",
      "wallet:change", "achievement:unlock", "streak:advance",
      "answer:record", "course:change", "daily:claim", "roster:change"
    ].forEach(function (ev) { try { prof.on(ev, refresh); } catch (e) {} });
    return true;
  }
  if (!bindProfileEvents()) {
    try {
      var doc = root.document;
      if (doc && doc.addEventListener) {
        doc.addEventListener("DOMContentLoaded", function once() {
          doc.removeEventListener("DOMContentLoaded", once);
          bindProfileEvents();
        });
      }
    } catch (e) {}
  }

  root.MrMacsQuickStats = {
    mount: mount, refresh: refresh, getStats: getStats, on: on, off: off
  };
})(typeof window !== "undefined" ? window
   : (typeof globalThis !== "undefined" ? globalThis : this));
