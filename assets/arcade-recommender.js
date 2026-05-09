/* Mr. Mac's Arcade · "Play This Next" smart recommender
 * Computes a best-fit recommendation from window.GAMES given the active
 * MrMacsProfile (history, weak topics, course, recents) and renders an
 * editorial card with a one-line reason and a gold CTA. 100% local.
 *
 * Public API:
 *   MrMacsRecommender.recommend({limit?, excludeIds?})
 *     -> { game, reason, alternatives: [{ game, reason }] } | null
 *   MrMacsRecommender.mount(containerOrSelector, { onPlay?, compact? })
 *     -> { unmount(), refresh() }
 *   MrMacsRecommender.refreshAll()
 *   MrMacsRecommender.on(event, handler) / off(event, handler)
 *     events: "recommend" | "mount" | "unmount" | "play"
 */
(function () {
  "use strict";

  var root = (typeof window !== "undefined") ? window : {};
  if (root.MrMacsRecommender) return;  // idempotent

  // Hardcoded fallback if window.PREMIUM_ARCADE_IDS isn't exposed.
  // Mirrors the canonical set in index.html.
  var FALLBACK_PREMIUM_IDS = [
    "history-hunters", "archive-quest", "cold-war-invaders",
    "timeline-runner", "chrono-defense-infinite", "chrono-pinball",
    "time-rift-survivors",
    "brickoria", "stellar-drift", "source-snake", "chronoblocks",
    "cascade", "chronohop", "step-pyramid", "citadel", "rumor-whack"
  ];

  // May 2026 flagship sweep + round-2 originals.
  var FLAGSHIP_FRESH_IDS = [
    "rumor-whack", "citadel", "step-pyramid", "chronohop",
    "brickoria", "stellar-drift", "cascade", "source-snake", "chronoblocks"
  ];

  var GENRE_WINDOW = 5;
  var RECENT_PENALTY_MS = 24 * 60 * 60 * 1000;

  var W = {
    weakTopic: 50, courseMatch: 20, courseAll: 8, genreVariety: 15,
    premium: 10, flagship: 25, recentPenalty: -30, masteredPenalty: -15
  };

  var ACCENT_BY_TYPE = {
    "default": "#d4af37", "Mastery Dashboard": "#5cc8c2",
    "Skill Lab": "#7aa6ff", "Jeopardy": "#3a6fd8", "Regents": "#d68a3a",
    "Match-3": "#c95caa", "Arcade": "#d4af37"
  };

  // tiny event bus
  var bus = {
    handlers: {},
    on: function (evt, fn) {
      if (typeof fn !== "function") return;
      (this.handlers[evt] = this.handlers[evt] || []).push(fn);
    },
    off: function (evt, fn) {
      var arr = this.handlers[evt];
      if (!arr) return;
      this.handlers[evt] = arr.filter(function (h) { return h !== fn; });
    },
    emit: function (evt, payload) {
      var arr = this.handlers[evt];
      if (!arr) return;
      for (var i = 0; i < arr.length; i++) {
        try { arr[i](payload); } catch (_) { /* swallow */ }
      }
    }
  };

  // helpers
  function safeArray(x) { return Array.isArray(x) ? x : []; }

  function getGames() {
    return safeArray(root.GAMES);
  }

  function getProfile() {
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.get === "function") {
        return root.MrMacsProfile.get() || null;
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  function getPremiumSet() {
    var src = root.PREMIUM_ARCADE_IDS;
    if (src && typeof src.has === "function") return src;
    if (Array.isArray(src)) return new Set(src);
    return new Set(FALLBACK_PREMIUM_IDS);
  }

  function lc(s) { return (s == null ? "" : String(s)).toLowerCase(); }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function gameTypeBucket(game) {
    var t = lc(game && game.gameType);
    if (!t) return "default";
    if (/match|cascade|brickoria/.test(t)) return "Match-3";
    if (/jeopardy/.test(t)) return "Jeopardy";
    if (/regents|gauntlet/.test(t)) return "Regents";
    if (/skill\s+lab|source/.test(t)) return "Skill Lab";
    if (/mastery|dashboard/.test(t)) return "Mastery Dashboard";
    return "Arcade";
  }

  function accentFor(game) {
    return ACCENT_BY_TYPE[gameTypeBucket(game)] || ACCENT_BY_TYPE["default"];
  }

  // Weakest topic from MrMacsMastery (preferred) or profile.topicStats.
  function weakestTopic(profile) {
    if (!profile) return null;
    try {
      if (root.MrMacsMastery && typeof root.MrMacsMastery.getWeakestTopic === "function") {
        var hit = root.MrMacsMastery.getWeakestTopic();
        if (hit && hit.set) return hit;
      }
    } catch (_) { /* ignore */ }

    var ts = profile.topicStats || {};
    var worst = null;
    Object.keys(ts).forEach(function (course) {
      var sets = ts[course] || {};
      Object.keys(sets).forEach(function (setName) {
        var b = sets[setName] || {};
        var total = +b.total || 0;
        if (total < 3) return;  // need attempts to be meaningful
        var acc = (+b.correct || 0) / total;
        if (!worst || acc < worst.accuracy) {
          worst = { course: course, set: setName, accuracy: acc };
        }
      });
    });
    return worst;
  }

  // Mastery for a topic-ish key. Returns 0..100 or null.
  function masteryFor(profile, course, topicKey) {
    if (!profile || !course || !topicKey) return null;
    try {
      if (root.MrMacsMastery && typeof root.MrMacsMastery.getTopicMastery === "function") {
        var m = root.MrMacsMastery.getTopicMastery(course, topicKey);
        if (typeof m === "number") return m;
      }
    } catch (_) { /* ignore */ }
    var b = ((profile.topicStats || {})[course] || {})[topicKey];
    if (!b || !b.total) return null;
    return Math.round(100 * (b.correct || 0) / b.total);
  }

  function gameTagsLower(game) {
    var bag = []
      .concat(safeArray(game.tags))
      .concat(safeArray(game.categories))
      .concat([game.subject, game.gameType, game.title])
      .filter(Boolean)
      .map(lc);
    return bag;
  }

  function gameMatchesTopic(game, topicSet) {
    if (!topicSet) return false;
    var key = lc(topicSet);
    if (!key) return false;
    var bag = gameTagsLower(game);
    for (var i = 0; i < bag.length; i++) {
      if (bag[i].indexOf(key) !== -1 || key.indexOf(bag[i]) !== -1) return true;
    }
    return false;
  }

  function recentBuckets(profile) {
    var recent = safeArray(profile && profile.recentGames).slice(0, GENRE_WINDOW);
    var seen = {};
    recent.forEach(function (entry) {
      var bucket = gameTypeBucket(entry);
      seen[bucket] = (seen[bucket] || 0) + 1;
    });
    return { list: recent, types: seen };
  }

  function playedRecentlyAt(profile, gameId) {
    var recent = safeArray(profile && profile.recentGames);
    for (var i = 0; i < recent.length; i++) {
      if (recent[i] && recent[i].id === gameId) {
        return +recent[i].ts || 0;
      }
    }
    return 0;
  }

  // scoring
  function scoreGame(game, ctx) {
    if (!game || !game.id) return null;
    var contributors = [];
    var score = 0;

    // 1. weak-topic match
    if (ctx.weak && gameMatchesTopic(game, ctx.weak.set)) {
      score += W.weakTopic;
      contributors.push({ key: "weakTopic", w: W.weakTopic, label: ctx.weak.set });
    }

    // 2. course match
    var courseLc = lc(game.course);
    if (ctx.profileCourse && courseLc === lc(ctx.profileCourse)) {
      score += W.courseMatch;
      contributors.push({ key: "courseMatch", w: W.courseMatch, label: game.course });
    } else if (/all\s+courses/.test(courseLc)) {
      score += W.courseAll;
      contributors.push({ key: "courseAll", w: W.courseAll, label: "All Courses" });
    }

    // 3. genre variety
    var bucket = gameTypeBucket(game);
    if (!ctx.recent.types[bucket]) {
      score += W.genreVariety;
      contributors.push({ key: "genreVariety", w: W.genreVariety, label: bucket });
    }

    // 4. premium tier
    if (ctx.premium.has(game.id)) {
      score += W.premium;
      contributors.push({ key: "premium", w: W.premium, label: "premium" });
    }

    // 5. flagship freshness
    if (ctx.flagshipSet.has(game.id)) {
      score += W.flagship;
      contributors.push({ key: "flagship", w: W.flagship, label: "fresh" });
    }

    // 6. recently-played penalty
    var lastTs = playedRecentlyAt(ctx.profile, game.id);
    if (lastTs && (Date.now() - lastTs) < RECENT_PENALTY_MS) {
      score += W.recentPenalty;
      contributors.push({ key: "recentPenalty", w: W.recentPenalty, label: "played today" });
    }

    // 7. already mastered penalty
    if (ctx.weak) {
      var m = masteryFor(ctx.profile, game.course, ctx.weak.set);
      if (m != null && m > 90 && gameMatchesTopic(game, ctx.weak.set)) {
        score += W.masteredPenalty;
        contributors.push({ key: "masteredPenalty", w: W.masteredPenalty, label: "mastered" });
      }
    }

    // Tiny tie-breaker so identical scores don't oscillate:
    // prefer games with more clueCount (more content per session).
    var contentBoost = Math.min(2, Math.log10((+game.clueCount || 0) + 10));
    score += contentBoost;

    return { game: game, score: score, contributors: contributors };
  }

  function reasonFor(scored, ctx) {
    if (!scored) return "";
    var positives = scored.contributors.filter(function (c) { return c.w > 0; });
    if (!positives.length) {
      return "A solid pick when you don't know where to start.";
    }
    // Top contributor wins the headline reason.
    positives.sort(function (a, b) { return b.w - a.w; });
    var top = positives[0];
    var g = scored.game;
    var subtitle = g.gameType ? (" — " + g.gameType + (g.course && !/all\s+courses/i.test(g.course) ? " · " + g.course : "")) : "";

    switch (top.key) {
      case "weakTopic":
        return "Strong match for your weak spot in " + top.label + ".";
      case "flagship":
        return "Fresh release — try " + g.title + subtitle + ".";
      case "courseMatch":
        return "Lined up with your " + top.label + " course.";
      case "genreVariety":
        return "Fresh genre — you haven't played " + top.label + " recently.";
      case "premium":
        return "Premium pick from the arcade — " + g.title + subtitle + ".";
      case "courseAll":
        return "All-courses warm-up — " + g.title + subtitle + ".";
      default:
        return "Try " + g.title + subtitle + ".";
    }
  }

  // recommend
  function recommend(opts) {
    opts = opts || {};
    var limit = Number.isInteger(opts.limit) ? opts.limit : 2;
    var excludeIds = new Set(safeArray(opts.excludeIds));

    var games = getGames();
    if (!games.length) return null;

    var profile = getProfile();
    var ctx = {
      profile: profile,
      profileCourse: profile && profile.course,
      weak: weakestTopic(profile),
      recent: recentBuckets(profile),
      premium: getPremiumSet(),
      flagshipSet: new Set(FLAGSHIP_FRESH_IDS)
    };

    var scored = [];
    for (var i = 0; i < games.length; i++) {
      var g = games[i];
      if (!g || !g.id || excludeIds.has(g.id)) continue;
      var s = scoreGame(g, ctx);
      if (s) scored.push(s);
    }
    if (!scored.length) return null;

    scored.sort(function (a, b) { return b.score - a.score; });

    var topScored = scored[0];
    var alts = scored.slice(1, 1 + Math.max(0, limit)).map(function (s) {
      return { game: s.game, reason: reasonFor(s, ctx) };
    });

    var payload = {
      game: topScored.game,
      reason: reasonFor(topScored, ctx),
      alternatives: alts
    };
    bus.emit("recommend", payload);
    return payload;
  }

  // styles (injected once)
  var STYLE_ID = "arcade-recommender-styles";

  var CSS = [
    ".mrec-card{position:relative;display:flex;flex-direction:column;gap:.4rem;min-width:288px;max-width:360px;width:100%;padding:14px 16px 12px;border-radius:14px;background:linear-gradient(180deg,#1b1730 0%,#15122a 100%);color:#f4eee0;font-family:inherit;box-shadow:0 6px 20px rgba(0,0,0,.35);border:1px solid rgba(212,175,55,.15)}",
    ".mrec-card::before{content:'';position:absolute;inset:0;border-radius:14px;padding:1px;background:linear-gradient(135deg,var(--mrec-accent,#d4af37),transparent 60%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}",
    ".mrec-eyebrow{font-size:.68rem;text-transform:uppercase;letter-spacing:.16em;color:var(--mrec-accent,#d4af37);font-weight:600}",
    ".mrec-title{font-size:1.12rem;font-weight:700;line-height:1.2;color:#fff}",
    ".mrec-sub{font-size:.78rem;color:#c8bda6;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
    ".mrec-reason{font-size:.82rem;font-style:italic;color:#a59c8a;margin-top:2px}",
    ".mrec-actions{display:flex;align-items:center;gap:10px;margin-top:6px}",
    ".mrec-cta{flex:0 0 auto;padding:8px 14px;border:0;border-radius:999px;background:#d4af37;color:#1b1730;font-weight:700;font-size:.84rem;cursor:pointer}",
    ".mrec-cta:hover{background:#e8c45a}.mrec-cta:focus{outline:2px solid #fff;outline-offset:2px}",
    ".mrec-more{background:transparent;border:0;color:#c8bda6;font-size:.74rem;cursor:pointer;text-decoration:underline;padding:4px 0}.mrec-more:hover{color:#fff}",
    ".mrec-alts{margin-top:6px;display:none;flex-direction:column;gap:6px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.1)}.mrec-alts.is-open{display:flex}",
    ".mrec-alt{display:flex;justify-content:space-between;gap:8px;font-size:.78rem;color:#c8bda6;text-align:left;background:transparent;border:0;cursor:pointer;padding:4px 0}.mrec-alt:hover .mrec-alt-title{color:#fff}",
    ".mrec-alt-title{font-weight:600;color:#e8dec0}",
    ".mrec-alt-reason{color:#8d8472;font-style:italic;flex:1;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".mrec-empty{padding:14px 16px;border-radius:14px;background:#1b1730;color:#c8bda6;font-size:.85rem}.mrec-empty a{color:#d4af37;text-decoration:none;font-weight:600}",
    ".mrec-card.is-compact{min-width:240px;padding:10px 12px}.mrec-card.is-compact .mrec-title{font-size:.98rem}",
    "@media (prefers-reduced-motion: reduce){.mrec-card,.mrec-alts{transition:none!important;animation:none!important}}"
  ].join("");

  function injectStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    var el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  // card render + mount
  var instances = [];  // { container, opts, render() }

  function defaultPlay(game) {
    if (!game) return;
    if (typeof root.openGame === "function") {
      try { root.openGame(game); return; } catch (_) { /* fall through */ }
    }
    if (game.file && typeof root.location !== "undefined") {
      root.location.href = game.file;
    }
  }

  function altButton(alt, onPlay) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mrec-alt";
    btn.innerHTML = ""
      + "<span class='mrec-alt-title'>" + escapeHtml(alt.game.title) + "</span>"
      + "<span class='mrec-alt-reason'>" + escapeHtml(alt.reason) + "</span>";
    btn.addEventListener("click", function () {
      bus.emit("play", { game: alt.game, source: "alternative" });
      onPlay(alt.game);
    });
    return btn;
  }

  function renderCard(container, opts) {
    if (!container) return;
    injectStyles();

    var pick = recommend({ limit: 2 });
    container.innerHTML = "";

    if (!pick) {
      var empty = document.createElement("div");
      empty.className = "mrec-empty";
      var profile = getProfile();
      if (!profile || !getGames().length) {
        empty.innerHTML = profile
          ? ""  // games library empty: silent no-op
          : "Pick any game to get started. <a href='#grid'>Browse arcade →</a>";
      }
      // Silent no-op when library is empty
      if (empty.innerHTML) container.appendChild(empty);
      return;
    }

    var card = document.createElement("div");
    card.className = "mrec-card" + (opts.compact ? " is-compact" : "");
    card.style.setProperty("--mrec-accent", accentFor(pick.game));
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", "Recommended game: " + pick.game.title);

    var eyebrow = document.createElement("div");
    eyebrow.className = "mrec-eyebrow";
    eyebrow.textContent = "Play This Next";

    var title = document.createElement("div");
    title.className = "mrec-title";
    title.textContent = pick.game.title;

    var sub = document.createElement("div");
    sub.className = "mrec-sub";
    sub.textContent = pick.game.subtitle || pick.game.gameType || "";

    var reason = document.createElement("div");
    reason.className = "mrec-reason";
    reason.textContent = pick.reason;

    var actions = document.createElement("div");
    actions.className = "mrec-actions";

    var cta = document.createElement("button");
    cta.type = "button";
    cta.className = "mrec-cta";
    cta.textContent = "Play now";
    var onPlay = (opts && typeof opts.onPlay === "function") ? opts.onPlay : defaultPlay;
    cta.addEventListener("click", function () {
      bus.emit("play", { game: pick.game, source: "primary" });
      onPlay(pick.game);
    });

    actions.appendChild(cta);

    var altsWrap = null;
    if (pick.alternatives && pick.alternatives.length) {
      var more = document.createElement("button");
      more.type = "button";
      more.className = "mrec-more";
      more.setAttribute("aria-expanded", "false");
      more.textContent = "More picks";

      altsWrap = document.createElement("div");
      altsWrap.className = "mrec-alts";

      pick.alternatives.forEach(function (alt) {
        altsWrap.appendChild(altButton(alt, onPlay));
      });

      more.addEventListener("click", function () {
        var open = altsWrap.classList.toggle("is-open");
        more.setAttribute("aria-expanded", open ? "true" : "false");
      });

      actions.appendChild(more);
    }

    card.appendChild(eyebrow);
    card.appendChild(title);
    if (sub.textContent) card.appendChild(sub);
    card.appendChild(reason);
    card.appendChild(actions);
    if (altsWrap) card.appendChild(altsWrap);

    container.appendChild(card);
  }

  function mount(container, opts) {
    if (typeof container === "string" && typeof document !== "undefined") {
      container = document.querySelector(container);
    }
    if (!container) {
      return { unmount: function () {}, refresh: function () {} };
    }
    opts = opts || {};
    var inst = {
      container: container,
      opts: opts,
      render: function () { renderCard(container, opts); }
    };
    inst.render();
    instances.push(inst);
    bus.emit("mount", { container: container });

    return {
      unmount: function () {
        var idx = instances.indexOf(inst);
        if (idx >= 0) instances.splice(idx, 1);
        try { container.innerHTML = ""; } catch (_) { /* ignore */ }
        bus.emit("unmount", { container: container });
      },
      refresh: inst.render
    };
  }

  function refreshAll() {
    for (var i = 0; i < instances.length; i++) {
      try { instances[i].render(); } catch (_) { /* ignore */ }
    }
  }

  // auto-refresh subscriptions
  function wireProfileEvents() {
    if (!root.MrMacsProfile || typeof root.MrMacsProfile.on !== "function") return;
    var triggers = ["profile:update", "achievement:unlock", "wallet:change", "course:change"];
    triggers.forEach(function (evt) {
      try {
        root.MrMacsProfile.on(evt, function () { refreshAll(); });
      } catch (_) { /* ignore */ }
    });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", wireProfileEvents, { once: true });
    } else {
      wireProfileEvents();
    }
  }

  // public surface
  root.MrMacsRecommender = {
    recommend: recommend,
    mount: mount,
    refreshAll: refreshAll,
    on: function (e, fn) { bus.on(e, fn); },
    off: function (e, fn) { bus.off(e, fn); }
  };
})();
