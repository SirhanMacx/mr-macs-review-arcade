/*!
 * Mr. Mac's Review Arcade — News Ticker
 * Continuous-scroll editorial strip of arcade events: achievements, big
 * shard payouts, streak milestones, daily claims, and rotating "did you
 * know" factoids. Reduced-motion users get a static 3s rotation instead.
 *
 * API: MrMacsNewsTicker.mount(container, { position }) -> handle
 *      .push(msg, { icon, kind })  .pause()  .resume()  .clear()
 *      .on(evt, fn)  .off(evt, fn)
 *
 * Self-contained styles (id="arcade-news-ticker-styles", classes mnt-*).
 * Idempotent: re-loading is a no-op.
 */
(function (root) {
  "use strict";

  if (root.MrMacsNewsTicker) return; // idempotent

  // -----------------------------------------------------------------------
  // Constants
  // -----------------------------------------------------------------------

  var STYLE_ID = "arcade-news-ticker-styles";
  var SCROLL_PX_PER_SEC = 60;
  var STATIC_ROTATE_MS = 3000;
  var NEWS_INTERVAL_MS = 60000;
  var MOBILE_NEWS_INTERVAL_MS = 35000;
  var BIG_SHARD_THRESHOLD = 100;
  var MAX_BUFFER = 50;

  var KIND_ICONS = {
    achievement: "🏆",
    shard:       "💎",
    milestone:   "🔥",
    fortune:     "📰",
    news:        "📣"
  };

  var NEWS_POOL = [
    "Mr. Mac's Arcade now has 200+ games across every course",
    "Did you know? Lucky Charm + Coin Doubler stack to 4× shards",
    "Top tip: Daily Challenge resets at midnight UTC",
    "Pro move: chain a 7-day streak to unlock the Bronze Medallion",
    "Hidden gem: try the Cram Mode review carousel before exam day",
    "Fortune favors the daring: the daily fortune cookie pays in shards",
    "Trivia: every arcade cabinet skin is hand-tuned for accessibility",
    "Heads up: leaderboard hits update live across all open tabs",
    "Speed tip: keyboard shortcut J/K cycles between arcade games",
    "Curator's note: flagship games rotate weekly—check Mondays",
    "Did you know? Achievements grant a one-time shard payout on unlock",
    "Pro tip: the Lucky Token doubles your next correct-answer payout",
    "New: scholar profile cards now show your top 3 courses by play time",
    "Reminder: streak shields auto-protect one missed day per week",
    "Fun fact: the arcade engine was rebuilt three times before launch",
    "Curator pick: try a flashcard deck if you want shards without combat",
    "Stat: 92% of scholars who hit a 14-day streak pass their first quiz",
    "Easter egg: type \"konami\" anywhere on the arcade page",
    "Heads up: equip a charm before starting a long review session",
    "Shop tip: shard prices drop 20% during weekend flash sales"
  ];

  // CSS (self-contained, scoped to .mnt-)
  var CSS = [
    "#" + STYLE_ID + "-host{display:contents}",
    ".mnt-root{",
      "position:relative;",
      "width:100%;",
      "height:36px;",
      "overflow:hidden;",
      "background:linear-gradient(90deg,#0c0a14 0%,#16122a 50%,#0c0a14 100%);",
      "color:#f4e9c1;",
      "font-family:\"Source Serif Pro\",\"Georgia\",serif;",
      "font-size:14px;",
      "line-height:36px;",
      "border-top:1px solid rgba(212,175,55,0.35);",
      "border-bottom:1px solid rgba(212,175,55,0.35);",
      "box-shadow:0 1px 0 rgba(0,0,0,0.4) inset;",
      "user-select:none;",
      "z-index:50;",
    "}",
    ".mnt-root.mnt-position-top{order:0}",
    ".mnt-root.mnt-position-bottom{order:9999}",
    ".mnt-tag{",
      "position:absolute;left:0;top:0;height:36px;",
      "padding:0 12px;",
      "display:flex;align-items:center;gap:6px;",
      "background:linear-gradient(90deg,#d4af37 0%,#b8902a 100%);",
      "color:#0c0a14;",
      "font-family:\"Inter\",\"Helvetica Neue\",sans-serif;",
      "font-weight:700;letter-spacing:0.08em;font-size:11px;text-transform:uppercase;",
      "z-index:2;",
      "box-shadow:2px 0 6px rgba(0,0,0,0.4);",
      "clip-path:polygon(0 0,100% 0,calc(100% - 12px) 100%,0 100%);",
      "padding-right:24px;",
    "}",
    ".mnt-tag-dot{",
      "width:8px;height:8px;border-radius:50%;background:#cc2936;",
      "box-shadow:0 0 6px rgba(204,41,54,0.9);",
      "animation:mnt-pulse 1.6s ease-in-out infinite;",
    "}",
    "@keyframes mnt-pulse{",
      "0%,100%{opacity:1;transform:scale(1)}",
      "50%{opacity:0.55;transform:scale(0.85)}",
    "}",
    ".mnt-viewport{",
      "position:absolute;left:96px;right:0;top:0;height:36px;",
      "overflow:hidden;",
      "mask-image:linear-gradient(90deg,transparent 0,#000 24px,#000 calc(100% - 24px),transparent 100%);",
      "-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 24px,#000 calc(100% - 24px),transparent 100%);",
    "}",
    ".mnt-track{",
      "position:absolute;left:0;top:0;height:36px;",
      "white-space:nowrap;",
      "will-change:transform;",
      "display:inline-flex;align-items:center;",
    "}",
    ".mnt-item{",
      "display:inline-flex;align-items:center;gap:6px;",
      "padding:0 4px;",
    "}",
    ".mnt-sep{",
      "color:rgba(212,175,55,0.55);",
      "padding:0 8px;",
      "font-weight:700;",
    "}",
    ".mnt-icon{font-size:15px;line-height:1;display:inline-block}",
    ".mnt-text{font-style:italic;color:#f4e9c1}",
    ".mnt-kind-achievement .mnt-text{color:#ffd966;font-weight:600;font-style:normal}",
    ".mnt-kind-shard .mnt-text{color:#7be4ff;font-weight:600;font-style:normal}",
    ".mnt-kind-milestone .mnt-text{color:#ff8c5a;font-weight:600;font-style:normal}",
    ".mnt-kind-fortune .mnt-text{color:#e0c879}",
    ".mnt-kind-news .mnt-text{color:#f4e9c1}",
    /* Static (reduced-motion) variant */
    ".mnt-root.mnt-static .mnt-viewport{",
      "left:96px;right:12px;",
      "mask-image:none;-webkit-mask-image:none;",
    "}",
    ".mnt-root.mnt-static .mnt-track{",
      "position:relative;height:36px;display:block;width:100%;",
      "padding:0 12px;",
      "transition:opacity 280ms ease;",
    "}",
    ".mnt-root.mnt-static .mnt-static-msg{",
      "display:flex;align-items:center;gap:8px;",
      "height:36px;",
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
    "}",
    /* Pause-on-hover */
    ".mnt-root.mnt-paused .mnt-track{animation-play-state:paused}",
    /* Mobile */
    "@media (max-width:640px){",
      ".mnt-root{height:30px;line-height:30px;font-size:12px}",
      ".mnt-tag{height:30px;padding:0 8px;padding-right:20px;font-size:10px}",
      ".mnt-viewport{left:74px;height:30px}",
      ".mnt-track{height:30px}",
      ".mnt-root.mnt-static .mnt-viewport{left:74px}",
    "}"
  ].join("");

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

  // Utilities
  function isMobile() {
    try { return window.matchMedia && window.matchMedia("(max-width:640px)").matches; }
    catch (e) { return false; }
  }

  function prefersReducedMotion() {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches; }
    catch (e) { return false; }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Pub-sub for public on/off API
  function makeBus() {
    var listeners = Object.create(null);
    return {
      on: function (evt, fn) {
        if (!evt || typeof fn !== "function") return;
        (listeners[evt] = listeners[evt] || []).push(fn);
      },
      off: function (evt, fn) {
        var arr = listeners[evt]; if (!arr) return;
        for (var i = arr.length - 1; i >= 0; i--) if (arr[i] === fn) arr.splice(i, 1);
      },
      emit: function (evt, payload) {
        var arr = listeners[evt]; if (!arr) return;
        for (var i = 0; i < arr.length; i++) {
          try { arr[i](payload); } catch (e) { /* swallow */ }
        }
      }
    };
  }

  // Module state
  var bus = makeBus();
  var instances = [];
  var profileSubsBound = false;
  var profileRetryQueued = false;
  // Buffer entries: { id, message, icon, kind, ts }
  var buffer = [];

  function pushBuffer(message, opts) {
    if (!message) return null;
    opts = opts || {};
    var kind = opts.kind || "news";
    var icon = opts.icon || KIND_ICONS[kind] || KIND_ICONS.news;
    var entry = {
      id: "mnt-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36),
      message: String(message),
      icon: icon,
      kind: kind,
      ts: Date.now()
    };
    buffer.push(entry);
    if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
    bus.emit("push", entry);
    for (var i = 0; i < instances.length; i++) {
      try { instances[i]._ingest(entry); } catch (e) {}
    }
    return entry;
  }

  // Profile event subscriptions (deferred + retry-safe)
  function bindProfileSubscriptions() {
    if (profileSubsBound) return true;
    var P = root.MrMacsProfile;
    if (!P || typeof P.on !== "function") return false;
    try {
      P.on("achievement:unlock", function (e) {
        try {
          var d = (e && e.detail) || e || {};
          var def = d.def || {};
          var title = def.title || d.id || "Hidden achievement";
          pushBuffer("Achievement unlocked: " + title, { kind: "achievement" });
        } catch (err) { /* swallow */ }
      });
      P.on("wallet:change", function (e) {
        try {
          var d = (e && e.detail) || e || {};
          var delta = Number(d.delta) || 0;
          if (delta >= BIG_SHARD_THRESHOLD) {
            var note = "Big shard payout: +" + delta;
            if (d.lucky && d.doubler) note += " (lucky + doubler!)";
            else if (d.lucky) note += " (lucky charm)";
            else if (d.doubler) note += " (coin doubler)";
            pushBuffer(note, { kind: "shard" });
          }
        } catch (err) { /* swallow */ }
      });
      P.on("streak:advance", function (e) {
        try {
          var d = (e && e.detail) || e || {};
          var n = Number(d.current) || 0;
          if (n > 0) pushBuffer(n + "-day streak!", { kind: "milestone" });
        } catch (err) { /* swallow */ }
      });
      P.on("daily:claim", function (e) {
        try {
          var d = (e && e.detail) || e || {};
          var payout = Number(d.payout) || 0;
          var msg = "Daily challenge claimed";
          if (payout > 0) msg += " (+" + payout + (d.doubled ? ", doubled!" : "") + ")";
          pushBuffer(msg, { kind: "fortune" });
        } catch (err) { /* swallow */ }
      });
      profileSubsBound = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  function ensureProfileSubscriptions() {
    if (bindProfileSubscriptions()) return;
    if (profileRetryQueued) return;
    profileRetryQueued = true;
    var retry = function () {
      profileRetryQueued = false;
      bindProfileSubscriptions();
    };
    try {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", retry, { once: true });
      } else {
        // The profile module may load async after our mount. Try a few times.
        var tries = 0;
        var iv = setInterval(function () {
          tries++;
          if (bindProfileSubscriptions() || tries > 20) clearInterval(iv);
        }, 250);
      }
    } catch (e) { /* swallow */ }
  }

  // Periodic news pulls
  var newsTimer = null;
  var newsIndex = 0;

  function startNewsTimer() {
    if (newsTimer) return;
    var interval = isMobile() ? MOBILE_NEWS_INTERVAL_MS : NEWS_INTERVAL_MS;
    pushBuffer(NEWS_POOL[newsIndex % NEWS_POOL.length], { kind: "news" });
    newsIndex++;
    newsTimer = setInterval(function () {
      try {
        var msg = (Math.random() < 0.25)
          ? pickRandom(NEWS_POOL)
          : NEWS_POOL[newsIndex % NEWS_POOL.length];
        newsIndex++;
        pushBuffer(msg, { kind: "news" });
      } catch (e) {}
    }, interval);
  }

  function stopNewsTimer() {
    if (newsTimer) { try { clearInterval(newsTimer); } catch (e) {} newsTimer = null; }
  }

  // Instance factory
  function renderItemHtml(entry) {
    return "<span class=\"mnt-item mnt-kind-" + escapeHtml(entry.kind) + "\" data-id=\"" + escapeHtml(entry.id) + "\">" +
             "<span class=\"mnt-icon\" aria-hidden=\"true\">" + escapeHtml(entry.icon) + "</span>" +
             "<span class=\"mnt-text\">" + escapeHtml(entry.message) + "</span>" +
           "</span>" +
           "<span class=\"mnt-sep\" aria-hidden=\"true\">·</span>";
  }

  function createInstance(container, opts) {
    opts = opts || {};
    var position = (opts.position === "bottom") ? "bottom" : "top";
    var pauseOnHover = (opts.pauseOnHover !== false); // default true
    var staticMode = !!prefersReducedMotion();

    injectStyles();

    var root_ = document.createElement("div");
    root_.className = "mnt-root mnt-position-" + position + (staticMode ? " mnt-static" : "");
    root_.setAttribute("role", "marquee");
    root_.setAttribute("aria-live", "polite");
    root_.setAttribute("aria-label", "Mr. Mac's Arcade live news ticker");

    var tag = document.createElement("div");
    tag.className = "mnt-tag";
    tag.innerHTML = "<span class=\"mnt-tag-dot\" aria-hidden=\"true\"></span><span>LIVE</span>";
    root_.appendChild(tag);

    var viewport = document.createElement("div");
    viewport.className = "mnt-viewport";
    root_.appendChild(viewport);

    var track = document.createElement("div");
    track.className = "mnt-track";
    viewport.appendChild(track);

    try { container.appendChild(root_); } catch (e) {}

    // Scroll engine (rAF-driven for clean pause/resume)
    var paused = false;
    var trackOffset = 0;
    var trackWidth = 0;
    var lastTs = 0;
    var rafId = 0;

    // Static-mode (reduced-motion) state
    var staticTimer = null;
    var staticQueue = [];

    function measureTrack() {
      try { trackWidth = track.scrollWidth; } catch (e) { trackWidth = 0; }
    }

    function tick(ts) {
      rafId = 0;
      if (!root_.isConnected) return;
      if (paused) { lastTs = ts; rafId = requestAnimationFrame(tick); return; }
      if (!lastTs) lastTs = ts;
      var dt = Math.max(0, Math.min(100, ts - lastTs));
      lastTs = ts;
      trackOffset -= (SCROLL_PX_PER_SEC * dt) / 1000;
      // Track is rendered as A+A; when first copy scrolls out, recycle.
      if (trackWidth > 0 && Math.abs(trackOffset) >= trackWidth / 2) {
        trackOffset += trackWidth / 2;
        // Recycle first-half items to the end so the seamless loop continues
        try {
          var halfCount = parseInt(track.getAttribute("data-half-count") || "0", 10) || 0;
          for (var i = 0; i < halfCount && track.firstChild; i++) track.appendChild(track.firstChild);
        } catch (e) {}
      }
      track.style.transform = "translate3d(" + trackOffset.toFixed(2) + "px,0,0)";
      rafId = requestAnimationFrame(tick);
    }

    function rebuildTrack() {
      if (staticMode) return rebuildStatic();
      var html = "";
      for (var i = 0; i < buffer.length; i++) html += renderItemHtml(buffer[i]);
      if (!html) {
        var seed = { id: "seed", message: NEWS_POOL[0], icon: KIND_ICONS.news, kind: "news" };
        html = renderItemHtml(seed);
      }
      var halfCount = (buffer.length || 1) * 2;
      track.innerHTML = html + html;
      track.setAttribute("data-half-count", String(halfCount));
      requestAnimationFrame(function () { measureTrack(); });
    }

    function rebuildStatic() {
      staticQueue = buffer.slice(-Math.min(buffer.length, MAX_BUFFER));
      if (!staticQueue.length) {
        staticQueue = [{ id: "seed", message: NEWS_POOL[0], icon: KIND_ICONS.news, kind: "news" }];
      }
      track.innerHTML = "<div class=\"mnt-static-msg mnt-kind-" + escapeHtml(staticQueue[0].kind) + "\">" +
                       "<span class=\"mnt-icon\" aria-hidden=\"true\">" + escapeHtml(staticQueue[0].icon) + "</span>" +
                       "<span class=\"mnt-text\">" + escapeHtml(staticQueue[0].message) + "</span>" +
                       "</div>";
      var idx = 0;
      if (staticTimer) { try { clearInterval(staticTimer); } catch (e) {} }
      staticTimer = setInterval(function () {
        if (paused || !root_.isConnected) return;
        idx = (idx + 1) % staticQueue.length;
        var e = staticQueue[idx];
        try {
          track.style.opacity = "0";
          setTimeout(function () {
            try {
              track.innerHTML = "<div class=\"mnt-static-msg mnt-kind-" + escapeHtml(e.kind) + "\">" +
                                "<span class=\"mnt-icon\" aria-hidden=\"true\">" + escapeHtml(e.icon) + "</span>" +
                                "<span class=\"mnt-text\">" + escapeHtml(e.message) + "</span>" +
                                "</div>";
              track.style.opacity = "1";
            } catch (err) {}
          }, 220);
        } catch (err) {}
      }, STATIC_ROTATE_MS);
    }

    // Pause-on-hover (default true)
    function onEnter() { if (pauseOnHover) { paused = true; root_.classList.add("mnt-paused"); } }
    function onLeave() { if (pauseOnHover) { paused = false; root_.classList.remove("mnt-paused"); } }
    if (pauseOnHover) {
      root_.addEventListener("mouseenter", onEnter);
      root_.addEventListener("mouseleave", onLeave);
      root_.addEventListener("focusin", onEnter);
      root_.addEventListener("focusout", onLeave);
    }

    rebuildTrack();
    if (!staticMode) rafId = requestAnimationFrame(tick);

    var instance = {
      _root: root_,
      _ingest: function (entry) {
        try {
          if (staticMode) {
            staticQueue.push(entry);
            if (staticQueue.length > MAX_BUFFER) staticQueue.shift();
            return;
          }
          // Append to both halves and trim once over budget
          track.insertAdjacentHTML("beforeend", renderItemHtml(entry) + renderItemHtml(entry));
          var maxNodes = MAX_BUFFER * 4;
          while (track.children.length > maxNodes && track.firstChild) {
            track.removeChild(track.firstChild);
          }
          requestAnimationFrame(function () { measureTrack(); });
        } catch (e) {}
      },
      push: function (message, opts2) { pushBuffer(message, opts2); },
      pause: function () { paused = true; root_.classList.add("mnt-paused"); },
      resume: function () { paused = false; lastTs = 0; root_.classList.remove("mnt-paused"); },
      unmount: function () {
        try {
          if (rafId) cancelAnimationFrame(rafId);
          if (staticTimer) clearInterval(staticTimer);
          root_.removeEventListener("mouseenter", onEnter);
          root_.removeEventListener("mouseleave", onLeave);
          root_.removeEventListener("focusin", onEnter);
          root_.removeEventListener("focusout", onLeave);
          if (root_.parentNode) root_.parentNode.removeChild(root_);
        } catch (e) {}
        for (var i = instances.length - 1; i >= 0; i--) {
          if (instances[i] === instance) instances.splice(i, 1);
        }
        if (!instances.length) stopNewsTimer();
      }
    };

    instances.push(instance);
    ensureProfileSubscriptions();
    startNewsTimer();
    bus.emit("mount", { instance: instance });
    return instance;
  }

  // Public API
  var api = {
    mount: function (container, opts) {
      try {
        if (!container) container = document.body;
        return createInstance(container, opts || {});
      } catch (e) {
        return {
          unmount: function () {}, push: function () {},
          pause: function () {}, resume: function () {}
        };
      }
    },
    push: function (message, opts) { return pushBuffer(message, opts); },
    pause: function () { for (var i = 0; i < instances.length; i++) instances[i].pause(); },
    resume: function () { for (var i = 0; i < instances.length; i++) instances[i].resume(); },
    clear: function () {
      buffer.length = 0;
      for (var i = 0; i < instances.length; i++) {
        try { instances[i]._root.querySelector(".mnt-track").innerHTML = ""; } catch (e) {}
      }
      bus.emit("clear", null);
    },
    on: function (evt, fn) { bus.on(evt, fn); },
    off: function (evt, fn) { bus.off(evt, fn); },
    _buffer: buffer,
    _newsPool: NEWS_POOL,
    _kinds: KIND_ICONS
  };

  root.MrMacsNewsTicker = api;
  // Best-effort early bind; mount() will retry if MrMacsProfile isn't ready.
  try { ensureProfileSubscriptions(); } catch (e) {}

})(typeof window !== "undefined" ? window : this);
