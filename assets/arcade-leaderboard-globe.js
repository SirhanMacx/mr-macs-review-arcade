/* Mr. Mac's Arcade · Leaderboard Globe
 *
 * Animated visualization of the player's standing across every game.
 * A central hex "globe" + orbital rings, one node per game. Ring is
 * chosen by rank: 1-3 gold (innermost), 4-10 cyan, 11+ indigo, unplayed
 * grey halo. Each ring is its own SVG group so we can stagger rotation
 * speeds (60s / 90s / 120s / 150s). `prefers-reduced-motion` disables
 * rotation. Idempotent IIFE; all storage/DOM access try/caught.
 *
 * API: window.MrMacsLeaderboardGlobe
 *   mount(container, opts) -> { unmount, refresh }
 *   getGlobeStats() -> { cabinets:[{gameId,gameName,bestScore,rank,totalPlayers}],
 *                        overall:{topRanks,avgRank,perfectGames} }
 *   refreshAll(); on(event, handler); off(event, handler)
 *
 * Events: "mount" · "unmount" · "refresh" · "node:click" · "node:hover"
 *
 * Sources of truth: window.GAMES + MrMacsLeaderboards.top(id, 50) +
 * MrMacsLeaderboards.personalBest(id).
 */
(function (root) {
  "use strict";
  if (root.MrMacsLeaderboardGlobe) return;

  var STYLE_ID = "arcade-leaderboard-globe-styles";
  var SVG_NS   = "http://www.w3.org/2000/svg";
  var ATTR_ID  = "data-mm-globe-id";

  // Ring radii inside a 320×320 viewBox (centre 160,160).
  var R_GOLD   = 56;
  var R_CYAN   = 88;
  var R_INDIGO = 120;
  var R_GREY   = 142;
  var NODE_R   = 9;

  // Active mounts so refreshAll() can iterate live instances.
  var instances = [];
  var nextId    = 1;

  // ── tiny event bus ───────────────────────────────────────────────
  var listeners = {};
  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (e) {}
    }
  }
  function on(event, handler) {
    if (!event || typeof handler !== "function") return;
    (listeners[event] = listeners[event] || []).push(handler);
  }
  function off(event, handler) {
    var arr = listeners[event];
    if (!arr) return;
    if (!handler) { listeners[event] = []; return; }
    listeners[event] = arr.filter(function (h) { return h !== handler; });
  }

  // ── safe accessors ───────────────────────────────────────────────
  function L() { return root.MrMacsLeaderboards || null; }
  function P() { return root.MrMacsProfile || null; }

  function safeGames() {
    try {
      var g = root.GAMES;
      return Array.isArray(g) ? g : [];
    } catch (e) { return []; }
  }

  function activeProfileId() {
    try {
      var p = P() && P().get && P().get();
      return (p && p.id) ? String(p.id) : "";
    } catch (e) { return ""; }
  }

  function topEntries(gameId) {
    try {
      if (L() && L().top) return L().top(gameId, 50) || [];
    } catch (e) {}
    return [];
  }

  function myBest(gameId) {
    try {
      if (L() && L().personalBest) return L().personalBest(gameId);
    } catch (e) {}
    return null;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Stable hash from a string -> [0, 1). Used to spread nodes around
  // their ring deterministically (so the same gameId always lands at
  // the same angle).
  function hashUnit(s) {
    var h = 2166136261;
    var str = String(s || "");
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return (h % 10000) / 10000;
  }

  // ── stats core ───────────────────────────────────────────────────
  // Compute the player's rank for a given game. Rank = N+1 where
  // N is the number of leaderboard entries strictly above the player's
  // personal best. Returns null when the player has not played.
  function computeCabinet(game) {
    if (!game || !game.id) return null;
    var pb = myBest(game.id);
    var entries = topEntries(game.id);
    var totalPlayers = entries.length;

    if (!pb || !isFinite(pb.score)) {
      return {
        gameId: String(game.id),
        gameName: String(game.title || game.id),
        gameFile: String(game.file || ""),
        bestScore: 0,
        rank: null,
        totalPlayers: totalPlayers,
        played: false
      };
    }
    var above = 0;
    var pid = activeProfileId();
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      // Don't double-count your own profile's own entries when comparing.
      if (pid && e.profileId === pid) continue;
      if (Number(e.score) > Number(pb.score)) above += 1;
    }
    return {
      gameId: String(game.id),
      gameName: String(game.title || game.id),
      gameFile: String(game.file || ""),
      bestScore: Number(pb.score) || 0,
      rank: above + 1,
      totalPlayers: totalPlayers,
      played: true
    };
  }

  function getGlobeStats() {
    var games = safeGames();
    var cabinets = [];
    for (var i = 0; i < games.length; i++) {
      var c = computeCabinet(games[i]);
      if (c) cabinets.push(c);
    }
    // Overall metrics (only for played games).
    var topRanks     = 0;
    var rankSum      = 0;
    var rankCount    = 0;
    var perfectGames = 0;
    for (var k = 0; k < cabinets.length; k++) {
      var cab = cabinets[k];
      if (!cab.played || cab.rank == null) continue;
      if (cab.rank <= 3) topRanks += 1;
      if (cab.rank === 1) perfectGames += 1;
      rankSum += cab.rank;
      rankCount += 1;
    }
    return {
      cabinets: cabinets,
      overall: {
        topRanks: topRanks,
        avgRank: rankCount ? Math.round((rankSum / rankCount) * 10) / 10 : 0,
        perfectGames: perfectGames
      }
    };
  }

  function tierForRank(rank) {
    if (rank == null) return "grey";
    if (rank <= 3)    return "gold";
    if (rank <= 10)   return "cyan";
    return "indigo";
  }
  function radiusForTier(t) {
    if (t === "gold")   return R_GOLD;
    if (t === "cyan")   return R_CYAN;
    if (t === "indigo") return R_INDIGO;
    return R_GREY;
  }

  // ── styles ───────────────────────────────────────────────────────
  var CSS =
    ".mglobe-root{position:relative;display:block;color:#f3ead8;font-family:'Inter','Helvetica Neue',Arial,sans-serif}" +
    ".mglobe-frame{position:relative;width:320px;max-width:100%;margin:0 auto;padding:14px;background:#15110a;border:1px solid #5a4423;border-radius:14px;box-shadow:inset 0 0 24px rgba(193,143,67,.18),0 6px 22px rgba(0,0,0,.45)}" +
    ".mglobe-svg{display:block;width:100%;height:auto}" +
    ".mglobe-rotor{transform-origin:160px 160px;animation:mglobe-spin 60s linear infinite}" +
    ".mglobe-rotor.r-cyan{animation-duration:90s;animation-direction:reverse}" +
    ".mglobe-rotor.r-indigo{animation-duration:120s}" +
    ".mglobe-rotor.r-grey{animation-duration:150s;animation-direction:reverse}" +
    "@keyframes mglobe-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}" +
    ".mglobe-ring{fill:none;stroke-width:1}" +
    ".mglobe-ring.gold{stroke:rgba(212,175,55,.55)}" +
    ".mglobe-ring.cyan{stroke:rgba(95,205,228,.45)}" +
    ".mglobe-ring.indigo{stroke:rgba(133,118,210,.40)}" +
    ".mglobe-ring.grey{stroke:rgba(180,170,150,.22);stroke-dasharray:3 4}" +
    ".mglobe-hex{fill:#1d1709;stroke:#c18f43;stroke-width:1.5}" +
    ".mglobe-hex-inner{fill:none;stroke:rgba(212,175,55,.45);stroke-width:1}" +
    ".mglobe-core-label{fill:#c18f43;font-weight:700;font-size:11px;letter-spacing:.18em;text-anchor:middle;font-family:'JetBrains Mono','Menlo',monospace}" +
    ".mglobe-core-sub{fill:#9b8866;font-size:9px;text-anchor:middle;letter-spacing:.06em}" +
    ".mglobe-node{cursor:pointer;transition:transform .18s ease,filter .18s ease}" +
    ".mglobe-node:focus{outline:none}" +
    ".mglobe-node circle.dot{transition:r .18s ease}" +
    ".mglobe-node:hover circle.dot,.mglobe-node:focus-visible circle.dot{r:12;filter:drop-shadow(0 0 6px currentColor)}" +
    ".mglobe-node.gold{color:#d4af37}.mglobe-node.cyan{color:#5fcde4}.mglobe-node.indigo{color:#8576d2}.mglobe-node.grey{color:#8a7e6a}" +
    ".mglobe-node circle.dot.gold{fill:#d4af37;stroke:#fff5cc;stroke-width:1.5}" +
    ".mglobe-node circle.dot.cyan{fill:#5fcde4;stroke:#cfeef7;stroke-width:1.2}" +
    ".mglobe-node circle.dot.indigo{fill:#8576d2;stroke:#d6cef0;stroke-width:1.2}" +
    ".mglobe-node circle.dot.grey{fill:#8a7e6a;stroke:#bfb39c;stroke-width:1;opacity:.7}" +
    ".mglobe-node text{font-size:8px;font-weight:700;fill:#15110a;text-anchor:middle;dominant-baseline:central;pointer-events:none;font-family:'JetBrains Mono','Menlo',monospace}" +
    ".mglobe-tooltip{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);min-width:180px;max-width:300px;background:#0d0905;border:1px solid #c18f43;border-radius:8px;padding:8px 10px;font-size:12px;line-height:1.35;color:#f3ead8;text-align:left;pointer-events:none;opacity:0;transition:opacity .14s ease;box-shadow:0 4px 16px rgba(0,0,0,.6)}" +
    ".mglobe-tooltip.show{opacity:1}" +
    ".mglobe-tooltip .ttl{color:#c18f43;font-weight:700;letter-spacing:.04em;display:block;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".mglobe-tooltip .row{color:#cfc4ad;display:flex;justify-content:space-between;gap:10px;font-family:'JetBrains Mono','Menlo',monospace;font-size:11px}" +
    ".mglobe-legend{display:flex;flex-wrap:wrap;gap:10px 14px;justify-content:center;margin-top:10px;font-size:11px;color:#cfc4ad;letter-spacing:.04em}" +
    ".mglobe-legend .swatch{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}" +
    ".mglobe-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;font-size:11px;text-align:center;color:#cfc4ad}" +
    ".mglobe-summary .v{display:block;font-family:'JetBrains Mono','Menlo',monospace;font-size:18px;color:#f3ead8;font-weight:700}" +
    ".mglobe-empty{padding:34px 16px;text-align:center;color:#cfc4ad;font-size:13px;line-height:1.5}" +
    ".mglobe-empty a{color:#c18f43;text-decoration:underline;font-weight:600}" +
    "@media (prefers-reduced-motion:reduce){.mglobe-rotor{animation:none!important}.mglobe-node,.mglobe-node circle.dot{transition:none!important}}";

  function injectStyles(doc) {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }

  // ── svg helpers ──────────────────────────────────────────────────
  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          el.setAttribute(k, attrs[k]);
        }
      }
    }
    return el;
  }

  // 6-pointed hex polygon centred at (cx,cy), radius r.
  function hexPoints(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + "," +
               (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(" ");
  }

  // ── render core hex + rings ──────────────────────────────────────
  function renderCore(svg, totalCabinets) {
    var core = svgEl("g", { "class": "mglobe-core" });
    core.appendChild(svgEl("polygon", {
      "class":  "mglobe-hex",
      "points": hexPoints(160, 160, 36)
    }));
    core.appendChild(svgEl("polygon", {
      "class":  "mglobe-hex-inner",
      "points": hexPoints(160, 160, 26)
    }));
    var label = svgEl("text", {
      "class": "mglobe-core-label",
      "x": 160, "y": 158
    });
    label.textContent = "ARCADE";
    core.appendChild(label);
    var sub = svgEl("text", {
      "class": "mglobe-core-sub",
      "x": 160, "y": 172
    });
    sub.textContent = totalCabinets + (totalCabinets === 1 ? " cabinet" : " cabinets");
    core.appendChild(sub);
    svg.appendChild(core);
  }

  function renderRings(svg) {
    var rings = [
      { r: R_GOLD,   cls: "gold"   },
      { r: R_CYAN,   cls: "cyan"   },
      { r: R_INDIGO, cls: "indigo" },
      { r: R_GREY,   cls: "grey"   }
    ];
    for (var i = 0; i < rings.length; i++) {
      svg.appendChild(svgEl("circle", {
        "class": "mglobe-ring " + rings[i].cls,
        "cx": 160, "cy": 160, "r": rings[i].r
      }));
    }
  }

  // ── nodes ────────────────────────────────────────────────────────
  // Group cabinets by tier, drop them onto the matching rotor, spread
  // angles deterministically by hashing gameId.
  function renderNodes(svg, cabinets, instance) {
    var byTier = { gold: [], cyan: [], indigo: [], grey: [] };
    for (var i = 0; i < cabinets.length; i++) {
      var c = cabinets[i];
      byTier[tierForRank(c.rank)].push(c);
    }
    var tiers = ["gold", "cyan", "indigo", "grey"];
    for (var t = 0; t < tiers.length; t++) {
      var tier = tiers[t];
      var list = byTier[tier];
      if (!list.length) continue;
      var rotor = svgEl("g", { "class": "mglobe-rotor r-" + tier });
      var radius = radiusForTier(tier);
      for (var j = 0; j < list.length; j++) {
        rotor.appendChild(buildNode(list[j], radius, tier, instance));
      }
      svg.appendChild(rotor);
    }
  }

  function buildNode(cabinet, radius, tier, instance) {
    // Spread n nodes around the ring; combine a stable hash with the
    // index so that two games with similar hashes don't overlap.
    var base = hashUnit(cabinet.gameId) * Math.PI * 2;
    var angle = base;
    var x = 160 + radius * Math.cos(angle);
    var y = 160 + radius * Math.sin(angle);

    var g = svgEl("g", {
      "class":     "mglobe-node " + tier,
      "tabindex":  "0",
      "role":      "button",
      "aria-label": ariaLabel(cabinet)
    });
    var dot = svgEl("circle", {
      "class": "dot " + tier,
      "cx":    x.toFixed(2),
      "cy":    y.toFixed(2),
      "r":     NODE_R
    });
    g.appendChild(dot);

    // Rank text inside the node (or a dash for unplayed).
    var label = svgEl("text", {
      "x": x.toFixed(2),
      "y": y.toFixed(2)
    });
    label.textContent = (cabinet.rank == null) ? "—" : String(cabinet.rank);
    g.appendChild(label);

    bindNode(g, cabinet, instance);
    return g;
  }

  function ariaLabel(c) {
    var rank = (c.rank == null) ? "unplayed" : ("rank " + c.rank);
    return c.gameName + ", " + rank +
      (c.played ? ", best score " + c.bestScore : "");
  }

  function bindNode(g, cabinet, instance) {
    function showTip() {
      showTooltip(instance, cabinet);
      emit("node:hover", {
        gameId: cabinet.gameId,
        gameName: cabinet.gameName,
        rank: cabinet.rank
      });
    }
    function hideTip() { hideTooltip(instance); }
    function activate() {
      emit("node:click", {
        gameId:   cabinet.gameId,
        gameName: cabinet.gameName,
        rank:     cabinet.rank,
        file:     cabinet.gameFile
      });
      navigateTo(cabinet);
    }
    g.addEventListener("mouseenter", showTip);
    g.addEventListener("mouseleave", hideTip);
    g.addEventListener("focus",      showTip);
    g.addEventListener("blur",       hideTip);
    g.addEventListener("click",      activate);
    g.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        activate();
      }
    });
  }

  function navigateTo(cabinet) {
    // Prefer scroll-to-card in the library if present; otherwise open file.
    try {
      var doc = root.document;
      if (doc) {
        var card = doc.querySelector('[data-game-id="' + cssEscape(cabinet.gameId) + '"]');
        if (card && card.scrollIntoView) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.classList && card.classList.add("mglobe-flash");
          setTimeout(function () {
            card.classList && card.classList.remove("mglobe-flash");
          }, 1200);
          return;
        }
      }
    } catch (e) {}
    if (cabinet.gameFile && root.location) {
      try { root.location.href = cabinet.gameFile; } catch (e) {}
    }
  }

  function cssEscape(s) {
    if (root.CSS && typeof root.CSS.escape === "function") {
      try { return root.CSS.escape(String(s)); } catch (e) {}
    }
    return String(s).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  // ── tooltip ──────────────────────────────────────────────────────
  function showTooltip(instance, cabinet) {
    var tip = instance.tipEl;
    if (!tip) return;
    var rank = (cabinet.rank == null) ? "—" : ("#" + cabinet.rank);
    var score = cabinet.played ? formatScore(cabinet.bestScore) : "—";
    var pool  = cabinet.totalPlayers
      ? (cabinet.totalPlayers + " on board")
      : "no entries yet";
    tip.innerHTML =
      '<span class="ttl">' + escapeHtml(cabinet.gameName) + '</span>' +
      '<span class="row"><span>Your rank</span><span>' + escapeHtml(rank) + '</span></span>' +
      '<span class="row"><span>Best score</span><span>' + escapeHtml(score) + '</span></span>' +
      '<span class="row"><span>Pool</span><span>' + escapeHtml(pool) + '</span></span>';
    tip.classList.add("show");
  }
  function hideTooltip(instance) {
    var tip = instance.tipEl;
    if (tip) tip.classList.remove("show");
  }
  function formatScore(n) {
    var v = Number(n) || 0;
    if (v >= 10000) return v.toLocaleString();
    return String(v);
  }

  // ── legend / summary / empty ─────────────────────────────────────
  function buildLegend(doc) {
    var l = doc.createElement("div");
    l.className = "mglobe-legend";
    l.innerHTML =
      '<span><span class="swatch" style="background:#d4af37"></span>Top 3</span>' +
      '<span><span class="swatch" style="background:#5fcde4"></span>4–10</span>' +
      '<span><span class="swatch" style="background:#8576d2"></span>11+</span>' +
      '<span><span class="swatch" style="background:#8a7e6a"></span>Unplayed</span>';
    return l;
  }
  function buildSummary(doc, overall) {
    var s = doc.createElement("div");
    s.className = "mglobe-summary";
    s.innerHTML =
      '<div><span class="v">' + overall.topRanks + '</span>Top-3 finishes</div>' +
      '<div><span class="v">' + (overall.avgRank || "—") + '</span>Avg. rank</div>' +
      '<div><span class="v">' + overall.perfectGames + '</span>#1 finishes</div>';
    return s;
  }
  function buildEmpty(doc) {
    var e = doc.createElement("div");
    e.className = "mglobe-empty";
    e.innerHTML =
      '<p><strong>No globe yet.</strong></p>' +
      '<p>Play your first game to see your globe ' +
      '<a href="#games" class="mglobe-empty-link">→</a></p>';
    return e;
  }

  // ── mount/unmount/refresh ────────────────────────────────────────
  function mount(container, opts) {
    if (!container || !container.appendChild) {
      return { unmount: function () {}, refresh: function () {} };
    }
    var doc = container.ownerDocument || root.document;
    injectStyles(doc);

    var id = nextId++;
    var instance = {
      id: id,
      container: container,
      opts: opts || {},
      rootEl: null,
      svgEl: null,
      tipEl: null,
      summaryEl: null,
      detached: false
    };
    container.setAttribute(ATTR_ID, String(id));
    instances.push(instance);

    drawInstance(instance);

    emit("mount", { container: container });

    return {
      unmount: function () { unmount(instance); },
      refresh: function () { drawInstance(instance); }
    };
  }

  function unmount(instance) {
    if (!instance || instance.detached) return;
    instance.detached = true;
    try {
      if (instance.rootEl && instance.rootEl.parentNode) {
        instance.rootEl.parentNode.removeChild(instance.rootEl);
      }
    } catch (e) {}
    instances = instances.filter(function (x) { return x !== instance; });
    emit("unmount", { container: instance.container });
  }

  function drawInstance(instance) {
    if (!instance || instance.detached) return;
    var container = instance.container;
    if (!container || !container.appendChild) return;
    var doc = container.ownerDocument || root.document;

    // Clear prior render but keep external content if user added any
    // around the mount point — we own only our previous root.
    if (instance.rootEl && instance.rootEl.parentNode === container) {
      container.removeChild(instance.rootEl);
    }

    var stats = getGlobeStats();
    var anyPlayed = false;
    for (var i = 0; i < stats.cabinets.length; i++) {
      if (stats.cabinets[i].played) { anyPlayed = true; break; }
    }

    var rootEl = doc.createElement("div");
    rootEl.className = "mglobe-root";

    var frame = doc.createElement("div");
    frame.className = "mglobe-frame";
    rootEl.appendChild(frame);

    if (!stats.cabinets.length || !anyPlayed) {
      frame.appendChild(buildEmpty(doc));
      container.appendChild(rootEl);
      instance.rootEl = rootEl;
      instance.svgEl = null;
      instance.tipEl = null;
      emit("refresh", { count: 0 });
      return;
    }

    var svg = svgEl("svg", {
      "class":   "mglobe-svg",
      "viewBox": "0 0 320 320",
      "role":    "img",
      "aria-label": "Your leaderboard globe across " +
        stats.cabinets.length + " arcade cabinets"
    });

    renderRings(svg);
    renderCore(svg, stats.cabinets.length);
    renderNodes(svg, stats.cabinets, instance);

    frame.appendChild(svg);

    var tip = doc.createElement("div");
    tip.className = "mglobe-tooltip";
    frame.appendChild(tip);

    rootEl.appendChild(buildLegend(doc));
    rootEl.appendChild(buildSummary(doc, stats.overall));

    container.appendChild(rootEl);

    instance.rootEl = rootEl;
    instance.svgEl  = svg;
    instance.tipEl  = tip;

    var visible = 0;
    for (var k = 0; k < stats.cabinets.length; k++) {
      if (stats.cabinets[k].played) visible += 1;
    }
    emit("refresh", { count: visible });
  }

  function refreshAll() {
    // Walk a copy because drawInstance can mutate `instances`.
    var snap = instances.slice();
    for (var i = 0; i < snap.length; i++) {
      var inst = snap[i];
      if (!inst || inst.detached) continue;
      // Auto-prune detached panels (container removed from DOM).
      if (inst.container && !inst.container.isConnected) {
        unmount(inst);
        continue;
      }
      drawInstance(inst);
    }
  }

  // ── auto-refresh hooks ───────────────────────────────────────────
  // Wire to leaderboard submit events so the globe updates live as
  // new scores come in. Also redraw when the active profile flips.
  function wireExternalEvents() {
    try {
      if (L() && typeof L().on === "function") {
        L().on("submit", function () { refreshAll(); });
        L().on("reset",  function () { refreshAll(); });
      }
    } catch (e) {}
    try {
      if (P() && typeof P().on === "function") {
        P().on("change",         function () { refreshAll(); });
        P().on("profile:switch", function () { refreshAll(); });
      }
    } catch (e) {}
  }

  if (root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", wireExternalEvents);
    } else {
      wireExternalEvents();
    }
  }

  // ── public surface ───────────────────────────────────────────────
  root.MrMacsLeaderboardGlobe = {
    mount:          mount,
    getGlobeStats:  getGlobeStats,
    refreshAll:     refreshAll,
    on:             on,
    off:            off,
    // Exposed for tests/debugging only — not part of the contract.
    _tierForRank:   tierForRank,
    _radiusForTier: radiusForTier
  };
})(typeof window !== "undefined" ? window : this);
