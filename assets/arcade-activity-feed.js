/*!
 * Mr. Mac's Review Arcade — Activity Feed
 * Personal chronological log of the player's arcade life: achievements
 * unlocked, games played, streak milestones, daily-challenge claims, and
 * shop purchases. Distinct from the news ticker (broadcast) — this is a
 * private, per-player timeline.
 *
 * API: window.MrMacsActivityFeed
 *   .mount(container, opts={ limit:20, days:7 }) -> { unmount, refresh }
 *   .refresh()
 *   .getActivity(opts={})  -> [{ ts, type, icon, title, desc, gameId? }]
 *   .log(event)
 *   .on(event, handler) / .off(event, handler)
 *
 * Self-contained styles (id="maf-styles", classes maf-*).
 * Idempotent: re-loading the script is a no-op.
 */
(function (root) {
  "use strict";

  if (root.MrMacsActivityFeed) return; // idempotent

  // -------------------------------------------------------------------------
  // Constants
  // -------------------------------------------------------------------------

  var STYLE_ID   = "maf-styles";
  var DEFAULT_LIMIT = 20;
  var DEFAULT_DAYS  = 7;
  var PAGE_SIZE     = 10; // items loaded per "Load more" press
  var MAX_LOG       = 200; // internal cap on the in-memory log

  /** ms in one day */
  var MS_DAY = 86400000;

  var TYPE_COLORS = {
    achievement:  "#d4af37", // gold
    play:         "#3dd6f5", // cyan
    streak:       "#cc2936", // red
    "daily-claim":"#9b59b6", // violet
    shop:         "#5dde85", // green
    custom:       "#a0a0c0"  // grey-blue
  };

  var TYPE_ICONS = {
    achievement:  "🏆",
    play:         "🎮",
    streak:       "🔥",
    "daily-claim":"⭐",
    shop:         "🛒",
    custom:       "📌"
  };

  // -------------------------------------------------------------------------
  // CSS (scoped to .maf-)
  // -------------------------------------------------------------------------

  var CSS = [
    "#" + STYLE_ID + "{display:none}",

    ".maf-feed{",
      "font-family:\"Inter\",\"Helvetica Neue\",sans-serif;",
      "background:#0f0c1a;",
      "color:#f4e9c1;",
      "border:1px solid rgba(212,175,55,0.25);",
      "border-radius:10px;",
      "overflow:hidden;",
      "max-width:560px;",
      "width:100%;",
    "}",

    /* Header */
    ".maf-header{",
      "padding:18px 22px 14px;",
      "border-bottom:1px solid rgba(212,175,55,0.18);",
      "background:linear-gradient(135deg,#130f24 0%,#1a1430 100%);",
    "}",
    ".maf-eyebrow{",
      "display:block;",
      "font-size:10px;",
      "font-weight:700;",
      "letter-spacing:0.13em;",
      "text-transform:uppercase;",
      "color:#d4af37;",
      "margin-bottom:4px;",
    "}",
    ".maf-title{",
      "margin:0;",
      "font-size:20px;",
      "font-weight:700;",
      "color:#f4e9c1;",
      "font-family:\"Source Serif Pro\",\"Georgia\",serif;",
      "line-height:1.2;",
    "}",
    ".maf-title em{",
      "font-style:italic;",
      "color:#d4af37;",
    "}",

    /* List */
    ".maf-list{",
      "list-style:none;",
      "margin:0;padding:0;",
    "}",

    /* Item */
    ".maf-item{",
      "display:flex;",
      "align-items:flex-start;",
      "gap:12px;",
      "padding:13px 18px;",
      "border-bottom:1px solid rgba(255,255,255,0.06);",
      "border-left:3px solid transparent;",
      "transition:background 180ms ease, transform 160ms ease, border-left-color 160ms ease;",
      "cursor:default;",
    "}",
    ".maf-item:last-child{border-bottom:none}",

    /* Type border colours */
    ".maf-item[data-type=\"achievement\"]{border-left-color:" + TYPE_COLORS.achievement + "}",
    ".maf-item[data-type=\"play\"]{border-left-color:" + TYPE_COLORS.play + "}",
    ".maf-item[data-type=\"streak\"]{border-left-color:" + TYPE_COLORS.streak + "}",
    ".maf-item[data-type=\"daily-claim\"]{border-left-color:" + TYPE_COLORS["daily-claim"] + "}",
    ".maf-item[data-type=\"shop\"]{border-left-color:" + TYPE_COLORS.shop + "}",
    ".maf-item[data-type=\"custom\"]{border-left-color:" + TYPE_COLORS.custom + "}",

    /* Hover lift */
    "@media (hover:hover){",
      ".maf-item:hover{",
        "background:rgba(212,175,55,0.06);",
        "transform:translateY(-1px);",
      "}",
    "}",

    /* Icon */
    ".maf-icon{",
      "font-size:20px;",
      "line-height:1;",
      "flex-shrink:0;",
      "margin-top:1px;",
    "}",

    /* Text block */
    ".maf-text{",
      "flex:1 1 0;",
      "min-width:0;",
    "}",
    ".maf-text strong{",
      "display:block;",
      "font-size:14px;",
      "font-weight:600;",
      "color:#f4e9c1;",
      "white-space:nowrap;",
      "overflow:hidden;",
      "text-overflow:ellipsis;",
    "}",
    ".maf-desc{",
      "display:block;",
      "font-size:12px;",
      "color:rgba(244,233,193,0.6);",
      "margin-top:2px;",
      "white-space:nowrap;",
      "overflow:hidden;",
      "text-overflow:ellipsis;",
    "}",

    /* Timestamp */
    ".maf-when{",
      "flex-shrink:0;",
      "font-size:11px;",
      "font-family:\"JetBrains Mono\",\"Courier New\",monospace;",
      "color:rgba(244,233,193,0.4);",
      "white-space:nowrap;",
      "text-align:right;",
      "padding-top:2px;",
    "}",

    /* Load more */
    ".maf-load-more{",
      "display:block;",
      "width:100%;",
      "padding:12px 0;",
      "background:none;",
      "border:none;",
      "border-top:1px solid rgba(212,175,55,0.14);",
      "color:#d4af37;",
      "font-family:\"Inter\",\"Helvetica Neue\",sans-serif;",
      "font-size:13px;",
      "font-weight:600;",
      "cursor:pointer;",
      "transition:background 150ms ease, color 150ms ease;",
    "}",
    ".maf-load-more:hover{background:rgba(212,175,55,0.08);color:#f4e9c1}",
    ".maf-load-more:focus-visible{outline:2px solid #d4af37;outline-offset:-2px}",
    ".maf-load-more[hidden]{display:none}",

    /* Empty state */
    ".maf-empty{",
      "padding:40px 22px;",
      "text-align:center;",
      "color:rgba(244,233,193,0.45);",
      "font-size:14px;",
      "line-height:1.6;",
    "}",
    ".maf-empty a{",
      "color:#d4af37;",
      "text-decoration:none;",
      "font-weight:600;",
    "}",
    ".maf-empty a:hover{text-decoration:underline}",

    /* Reduced-motion: kill all transitions */
    "@media (prefers-reduced-motion:reduce){",
      ".maf-item,.maf-load-more{transition:none!important;transform:none!important}",
    "}"
  ].join("");

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  function injectStyles() {
    try {
      if (document.getElementById(STYLE_ID)) return;
      var s = document.createElement("style");
      s.id = STYLE_ID;
      s.type = "text/css";
      s.appendChild(document.createTextNode(CSS));
      (document.head || document.documentElement).appendChild(s);
    } catch (e) { /* swallow */ }
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Human-readable relative time label. */
  function relativeTime(ts) {
    try {
      var diff = Date.now() - Number(ts);
      if (diff < 0) diff = 0;
      var secs = Math.floor(diff / 1000);
      if (secs < 60)  return "just now";
      var mins = Math.floor(secs / 60);
      if (mins < 60)  return mins + "m ago";
      var hrs = Math.floor(mins / 60);
      if (hrs < 24)   return hrs + "h ago";
      var days = Math.floor(hrs / 24);
      if (days === 1) return "yesterday";
      if (days < 7)   return days + "d ago";
      var wks = Math.floor(days / 7);
      if (wks === 1)  return "1 week ago";
      return wks + " weeks ago";
    } catch (e) { return ""; }
  }

  /** ISO date string → midnight UTC timestamp. */
  function isoToTs(isoStr) {
    try {
      var d = new Date(isoStr + (isoStr.length === 10 ? "T00:00:00Z" : ""));
      return isNaN(d.getTime()) ? 0 : d.getTime();
    } catch (e) { return 0; }
  }

  /** Clamp-then-sort array of events newest-first. */
  function sortEvents(arr) {
    return arr.slice().sort(function (a, b) { return b.ts - a.ts; });
  }

  // -------------------------------------------------------------------------
  // Pub-sub bus
  // -------------------------------------------------------------------------

  function makeBus() {
    var L = Object.create(null);
    return {
      on:  function (ev, fn) { if (ev && typeof fn === "function") (L[ev] = L[ev] || []).push(fn); },
      off: function (ev, fn) {
        var a = L[ev]; if (!a) return;
        for (var i = a.length - 1; i >= 0; i--) if (a[i] === fn) a.splice(i, 1);
      },
      emit: function (ev, payload) {
        var a = L[ev]; if (!a) return;
        var copy = a.slice();
        for (var i = 0; i < copy.length; i++) { try { copy[i](payload); } catch (e) {} }
      }
    };
  }

  // -------------------------------------------------------------------------
  // Module state
  // -------------------------------------------------------------------------

  var bus = makeBus();
  /** In-memory event log: [{ ts, type, icon, title, desc, gameId? }] */
  var log = [];
  /** Live mount handles. */
  var instances = [];
  var profileBound = false;
  var profileRetryQueued = false;

  // -------------------------------------------------------------------------
  // Log helpers
  // -------------------------------------------------------------------------

  function pushLog(ev) {
    if (!ev || !ev.ts || !ev.type) return;
    // Deduplicate by ts+type+title
    var key = ev.ts + "|" + ev.type + "|" + (ev.title || "");
    for (var i = 0; i < log.length; i++) {
      var e = log[i];
      if (e.ts + "|" + e.type + "|" + (e.title || "") === key) return;
    }
    log.push(ev);
    if (log.length > MAX_LOG) log.splice(0, log.length - MAX_LOG);
    bus.emit("log", ev);
    for (var j = 0; j < instances.length; j++) {
      try { instances[j]._onNewEvent(ev); } catch (e2) {}
    }
  }

  /** Convert a number-shard desc. */
  function shardsStr(n) {
    return n ? " · +" + n + " ◆" : "";
  }

  // -------------------------------------------------------------------------
  // Event synthesis from MrMacsProfile snapshot
  // -------------------------------------------------------------------------

  function synthFromProfile() {
    var P;
    try { P = root.MrMacsProfile; } catch (e) { return; }
    if (!P) return;

    var now = Date.now();
    var cutoff7 = now - 7 * MS_DAY;

    // 1. Achievements
    try {
      var achievements = P.listAchievements();
      for (var i = 0; i < achievements.length; i++) {
        var a = achievements[i];
        if (!a.unlocked || !a.unlockedAt) continue;
        if (a.unlockedAt < cutoff7) continue;
        pushLog({
          ts:    a.unlockedAt,
          type:  "achievement",
          icon:  (a.def && a.def.icon) || TYPE_ICONS.achievement,
          title: (a.def && a.def.title) || a.id,
          desc:  (a.def && a.def.desc)  || "Achievement unlocked.",
          gameId: null
        });
      }
    } catch (e) { /* swallow */ }

    // 2. Recent games
    try {
      var profile = P.get ? P.get() : null;
      var recentGames = (profile && profile.recentGames) ? profile.recentGames : [];
      for (var k = 0; k < recentGames.length; k++) {
        var g = recentGames[k];
        if (!g.ts || g.ts < cutoff7) continue;
        var bestKey = g.id && profile.perGameStats && profile.perGameStats[g.id];
        var best = bestKey ? (bestKey.bestScore || 0) : 0;
        var desc = g.course ? "Course: " + g.course : "Arcade game";
        if (best) desc += " · Best: " + best.toLocaleString();
        pushLog({
          ts:    g.ts,
          type:  "play",
          icon:  TYPE_ICONS.play,
          title: "Played " + (g.title || g.id || "a game"),
          desc:  desc,
          gameId: g.id || null
        });
      }
    } catch (e) { /* swallow */ }

    // 3. Streak advancements — synthesised from playDays
    try {
      var prof2 = P.get ? P.get() : null;
      var playDays = (prof2 && Array.isArray(prof2.playDays)) ? prof2.playDays : [];
      // Each unique day that falls in the window is a "played" event (already covered
      // by recentGames). We look for consecutive-day runs and emit streak milestones
      // at the milestone marks (3, 7, 14, 30, …).
      var STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100];
      var sorted = playDays.slice().sort();
      var streak = 0;
      var lastDay = null;
      for (var d = 0; d < sorted.length; d++) {
        var dayStr = sorted[d];
        if (lastDay === null) {
          streak = 1;
        } else {
          // Compute gap
          var prev = isoToTs(lastDay);
          var curr = isoToTs(dayStr);
          var gap = Math.round((curr - prev) / MS_DAY);
          streak = (gap === 1) ? streak + 1 : 1;
        }
        lastDay = dayStr;
        // Emit milestone if this day caused us to hit one
        if (STREAK_MILESTONES.indexOf(streak) !== -1) {
          var milestoneTs = isoToTs(dayStr);
          if (milestoneTs >= cutoff7) {
            pushLog({
              ts:    milestoneTs,
              type:  "streak",
              icon:  TYPE_ICONS.streak,
              title: streak + "-Day Streak!",
              desc:  "You played " + streak + " days in a row. Keep it going!",
              gameId: null
            });
          }
        }
      }
    } catch (e) { /* swallow */ }

    // 4. Daily challenge claims
    try {
      var prof3 = P.get ? P.get() : null;
      var dc = prof3 && prof3.dailyChallenge;
      var claimDays = (dc && Array.isArray(dc.claimDays)) ? dc.claimDays : [];
      for (var c = 0; c < claimDays.length; c++) {
        var dayTs = isoToTs(claimDays[c]);
        if (!dayTs || dayTs < cutoff7) continue;
        pushLog({
          ts:    dayTs,
          type:  "daily-claim",
          icon:  TYPE_ICONS["daily-claim"],
          title: "Daily Challenge Claimed",
          desc:  "You completed the daily challenge for " + claimDays[c] + ".",
          gameId: null
        });
      }
    } catch (e) { /* swallow */ }

    // 5. Shop spend (tracked via lifetimeShopSpend delta — no per-purchase log
    //    exists in the profile schema, so we synthesise a single summary entry
    //    if the player has ever spent shards in the shop, anchored to today.)
    try {
      var prof4 = P.get ? P.get() : null;
      var spent = prof4 && Number(prof4.lifetimeShopSpend);
      if (spent && spent > 0) {
        // Only add once; deduplicated by key
        var shopTs = now - 1000; // slightly before now so it sorts after real events
        pushLog({
          ts:    shopTs,
          type:  "shop",
          icon:  TYPE_ICONS.shop,
          title: "Shop Purchase",
          desc:  spent.toLocaleString() + " ◆ spent in the shop (lifetime).",
          gameId: null
        });
      }
    } catch (e) { /* swallow */ }
  }

  // -------------------------------------------------------------------------
  // Profile live event subscriptions
  // -------------------------------------------------------------------------

  function bindProfile() {
    if (profileBound) return true;
    var P;
    try { P = root.MrMacsProfile; } catch (e) { return false; }
    if (!P || typeof P.on !== "function") return false;
    try {
      P.on("achievement:unlock", function (ev) {
        try {
          var d = (ev && ev.detail) || ev || {};
          var def = d.def || {};
          pushLog({
            ts:    d.unlockedAt || Date.now(),
            type:  "achievement",
            icon:  def.icon || TYPE_ICONS.achievement,
            title: def.title || d.id || "Achievement",
            desc:  def.desc  || "Achievement unlocked.",
            gameId: null
          });
        } catch (e) {}
      });

      P.on("profile:update", function () {
        // Re-synthesize plays from the updated profile snapshot.
        try { synthFromProfile(); } catch (e) {}
      });

      P.on("streak:advance", function (ev) {
        try {
          var d = (ev && ev.detail) || ev || {};
          var n = Number(d.current) || 0;
          if (!n) return;
          var MILESTONES = [3, 7, 14, 21, 30, 60, 100];
          if (MILESTONES.indexOf(n) !== -1) {
            pushLog({
              ts:    Date.now(),
              type:  "streak",
              icon:  TYPE_ICONS.streak,
              title: n + "-Day Streak!",
              desc:  "You played " + n + " days in a row. Keep it going!",
              gameId: null
            });
          }
        } catch (e) {}
      });

      P.on("daily:claim", function (ev) {
        try {
          var d = (ev && ev.detail) || ev || {};
          var payout = Number(d.payout) || 0;
          pushLog({
            ts:    Date.now(),
            type:  "daily-claim",
            icon:  TYPE_ICONS["daily-claim"],
            title: "Daily Challenge Claimed",
            desc:  "Great work!" + shardsStr(payout) + (d.doubled ? " (doubled!)" : ""),
            gameId: d.gameId || null
          });
        } catch (e) {}
      });

      P.on("inventory:change", function (ev) {
        try {
          var d = (ev && ev.detail) || ev || {};
          if (d.source !== "purchase") return;
          pushLog({
            ts:    Date.now(),
            type:  "shop",
            icon:  TYPE_ICONS.shop,
            title: "Shop Purchase",
            desc:  d.item ? "Bought: " + d.item + "." : "Item purchased from shop.",
            gameId: null
          });
        } catch (e) {}
      });

      profileBound = true;
      return true;
    } catch (e) { return false; }
  }

  function ensureProfile() {
    if (bindProfile()) return;
    if (profileRetryQueued) return;
    profileRetryQueued = true;
    var tries = 0;
    try {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
          profileRetryQueued = false;
          bindProfile();
          synthFromProfile();
        }, { once: true });
      } else {
        var iv = setInterval(function () {
          tries++;
          if (bindProfile() || tries > 30) {
            clearInterval(iv);
            profileRetryQueued = false;
            try { synthFromProfile(); } catch (e) {}
          }
        }, 300);
      }
    } catch (e) { profileRetryQueued = false; }
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  function filterLog(opts) {
    opts = opts || {};
    var limit = opts.limit != null ? Number(opts.limit) : DEFAULT_LIMIT;
    var days  = opts.days  != null ? Number(opts.days)  : DEFAULT_DAYS;
    var cutoff = Date.now() - days * MS_DAY;
    var filtered = [];
    for (var i = 0; i < log.length; i++) {
      if (log[i].ts >= cutoff) filtered.push(log[i]);
    }
    filtered = sortEvents(filtered);
    if (limit > 0) filtered = filtered.slice(0, limit);
    return filtered;
  }

  function renderItem(ev) {
    var type = esc(ev.type || "custom");
    var icon = esc(ev.icon || TYPE_ICONS[ev.type] || TYPE_ICONS.custom);
    var title = esc(ev.title || "Activity");
    var desc  = esc(ev.desc  || "");
    var when  = esc(relativeTime(ev.ts));
    return "<li class=\"maf-item\" data-type=\"" + type + "\">" +
             "<span class=\"maf-icon\" aria-hidden=\"true\">" + icon + "</span>" +
             "<div class=\"maf-text\">" +
               "<strong>" + title + "</strong>" +
               (desc ? "<span class=\"maf-desc\">" + desc + "</span>" : "") +
             "</div>" +
             "<span class=\"maf-when\">" + when + "</span>" +
           "</li>";
  }

  function renderEmpty() {
    return "<li class=\"maf-empty\">" +
             "Play a game to start your activity log" +
             " <a href=\"#arcade\">→</a>" +
           "</li>";
  }

  // -------------------------------------------------------------------------
  // Instance factory
  // -------------------------------------------------------------------------

  function createInstance(container, opts) {
    opts = opts || {};
    var limit = opts.limit != null ? Number(opts.limit) : DEFAULT_LIMIT;
    var days  = opts.days  != null ? Number(opts.days)  : DEFAULT_DAYS;
    var shown = PAGE_SIZE; // how many items are currently visible

    injectStyles();

    // Outer wrapper
    var feed = document.createElement("div");
    feed.className = "maf-feed";
    feed.setAttribute("role", "log");
    feed.setAttribute("aria-label", "Your arcade activity feed");
    feed.setAttribute("aria-live", "polite");

    // Header
    feed.innerHTML =
      "<div class=\"maf-header\">" +
        "<span class=\"maf-eyebrow\">Recent Activity</span>" +
        "<h2 class=\"maf-title\">Your <em>arcade life</em>.</h2>" +
      "</div>";

    var list = document.createElement("ul");
    list.className = "maf-list";
    feed.appendChild(list);

    var loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "maf-load-more";
    loadMoreBtn.type = "button";
    loadMoreBtn.textContent = "Load more →";
    feed.appendChild(loadMoreBtn);

    try { container.appendChild(feed); } catch (e) {}

    function renderList() {
      try {
        var allItems = filterLog({ days: days });
        var visible  = allItems.slice(0, shown);
        var html = "";
        if (visible.length === 0) {
          html = renderEmpty();
          loadMoreBtn.hidden = true;
        } else {
          for (var i = 0; i < visible.length; i++) html += renderItem(visible[i]);
          loadMoreBtn.hidden = (shown >= allItems.length);
        }
        list.innerHTML = html;
      } catch (e) { /* swallow */ }
    }

    loadMoreBtn.addEventListener("click", function () {
      shown += PAGE_SIZE;
      renderList();
    });

    // Initial render
    renderList();

    var inst = {
      _onNewEvent: function (ev) {
        // If the new event falls within our window, re-render top
        try {
          var cutoff = Date.now() - days * MS_DAY;
          if (ev.ts >= cutoff) renderList();
        } catch (e) {}
      },
      refresh: function () {
        try { synthFromProfile(); } catch (e) {}
        shown = PAGE_SIZE;
        renderList();
      },
      unmount: function () {
        try {
          loadMoreBtn.removeEventListener("click", arguments.callee);
        } catch (e) {}
        try { if (feed.parentNode) feed.parentNode.removeChild(feed); } catch (e) {}
        for (var i = instances.length - 1; i >= 0; i--) {
          if (instances[i] === inst) instances.splice(i, 1);
        }
        bus.emit("unmount", null);
      }
    };

    instances.push(inst);
    return inst;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  var api = {
    mount: function (container, opts) {
      try {
        if (!container) container = document.body;
        var inst = createInstance(container, opts || {});
        ensureProfile();
        try { synthFromProfile(); } catch (e) {}
        inst.refresh();
        return {
          unmount: function () { inst.unmount(); },
          refresh: function () { inst.refresh(); }
        };
      } catch (e) {
        return { unmount: function () {}, refresh: function () {} };
      }
    },

    refresh: function () {
      try { synthFromProfile(); } catch (e) {}
      for (var i = 0; i < instances.length; i++) {
        try { instances[i].refresh(); } catch (e) {}
      }
    },

    getActivity: function (opts) {
      return filterLog(opts || {});
    },

    log: function (ev) {
      if (!ev || typeof ev !== "object") return;
      pushLog({
        ts:    ev.ts    || Date.now(),
        type:  ev.type  || "custom",
        icon:  ev.icon  || TYPE_ICONS[ev.type] || TYPE_ICONS.custom,
        title: ev.title || "Event",
        desc:  ev.desc  || "",
        gameId: ev.gameId || null
      });
    },

    on:  function (ev, fn) { bus.on(ev, fn); },
    off: function (ev, fn) { bus.off(ev, fn); }
  };

  root.MrMacsActivityFeed = api;

  // Best-effort early bind
  try { ensureProfile(); } catch (e) {}

})(typeof window !== "undefined" ? window : this);
