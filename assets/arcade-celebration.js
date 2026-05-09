/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · celebration particle bursts
   ──────────────────────────────────────────────────────────────────────
   Lightweight canvas-based particle effect that fires when a player
   unlocks an achievement, crosses a tier threshold, or hits a streak
   milestone. Particles emit from a configurable origin (defaults to the
   topbar profile pill if present) and fall away under gravity in
   editorial colours (gold / cyan / magenta).

   Public API (backward compatible):
     window.MrMacsCelebration.burst(opts)
        opts: { x, y, count, palette, gravity, life, vScale,
                shapes, spread, upwardBias, withSound }
     window.MrMacsCelebration.burstFromElement(el, opts)
     window.MrMacsCelebration.fromAchievement(def, opts)

   New variants (Polish v2 · May 2026):
     .confetti(opts)               — wide spread, no upward bias, mixed shapes
     .fireworks(x, y, opts)        — multi-stage radial burst w/ secondaries
     .coinShower(opts)             — gold-only shower from top of viewport
     .streamers(opts)              — diagonal ribbon trails from top corners
     .tierUp(tierName, opts)       — tier-named palette + larger burst
     .fromShardPayout(amount, opts) — auto-routes by amount magnitude

   New controls:
     .clear()                      — instantly remove all particles
     .pause() / .resume()          — pause animation w/o removing particles
     .setPalette(arr)              — override default palette
     .getActiveCount()             — current particle count

   Auto-wires to MrMacsProfile events (achievement:unlock + tier-up
   detection via wallet:change). Respects prefers-reduced-motion: in
   reduced mode it falls back to soft pulses (gold pulse / color wash /
   subtle flash / emoji float for confetti).
   ───────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsCelebration) return;

  var canvas = null;
  var ctx = null;
  var particles = [];
  var pool = [];                 // recycled particle objects
  var rafHandle = null;
  var lastTs = 0;
  var initialized = false;
  var prefersReduced = false;
  var paused = false;
  var docHidden = false;

  // Stack-safety queue: bursts that arrive while a recent flurry is firing
  var burstQueue = [];
  var recentBurstTimes = [];     // timestamps within the last 200ms

  var MAX_PARTICLES = 400;
  var QUEUE_WINDOW_MS = 200;
  var QUEUE_THRESHOLD = 5;

  var DEFAULT_PALETTE = [
    "#f5c451", // gold
    "#ffd884", // gold-warm
    "#7af0ff", // cyan
    "#ff7cc8", // magenta
    "#b892ff", // indigo
    "#ff8e6f"  // coral
  ];

  // Palette overrides (setPalette)
  var activePalette = DEFAULT_PALETTE.slice();

  // Tier palettes for tierUp() and fromAchievement()
  var TIER_PALETTES = {
    bronze:    ["#cd7f32", "#e0a060", "#a85a1e", "#ffd884"],
    silver:    ["#d6dcef", "#7af0ff", "#9aa3bb", "#f0f3fa"],
    gold:      ["#f5c451", "#ffd884", "#ff8e6f", "#ffe7a3"],
    legendary: ["#ff7cc8", "#b892ff", "#f5c451", "#ffd884", "#7af0ff"]
  };

  // Web Audio context (lazy)
  var audioCtx = null;
  function getAudioCtx() {
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function playWhoosh(variant) {
    var ac = getAudioCtx();
    if (!ac) return;
    try {
      if (ac.state === "suspended") { try { ac.resume(); } catch (e) {} }
      var now = ac.currentTime;

      // Sparkle: short triangle ping with a cluster of high partials
      if (variant === "sparkle" || variant === "fireworks") {
        for (var i = 0; i < 4; i++) {
          var o = ac.createOscillator();
          var g = ac.createGain();
          o.type = "triangle";
          var f0 = 1200 + i * 540;
          o.frequency.setValueAtTime(f0, now);
          o.frequency.exponentialRampToValueAtTime(Math.max(120, f0 * 0.35), now + 0.55);
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
          o.connect(g).connect(ac.destination);
          o.start(now);
          o.stop(now + 0.6);
        }
        return;
      }

      // Coin: short metallic up-chirp
      if (variant === "coin") {
        var oc = ac.createOscillator();
        var gc = ac.createGain();
        oc.type = "square";
        oc.frequency.setValueAtTime(880, now);
        oc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
        gc.gain.setValueAtTime(0.0001, now);
        gc.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
        gc.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        oc.connect(gc).connect(ac.destination);
        oc.start(now); oc.stop(now + 0.34);
        return;
      }

      // Default whoosh: short noise burst via filtered sawtooth slide
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      var filt = ac.createBiquadFilter();
      filt.type = "bandpass";
      filt.frequency.setValueAtTime(800, now);
      filt.frequency.exponentialRampToValueAtTime(2400, now + 0.35);
      filt.Q.value = 1.2;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(filt).connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch (e) { /* swallow */ }
  }

  function detectReduced() {
    try {
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      prefersReduced = mq.matches;
      var listener = function (e) { prefersReduced = e.matches; };
      if (mq.addEventListener) mq.addEventListener("change", listener);
      else if (mq.addListener) mq.addListener(listener);
    } catch (e) {
      prefersReduced = false;
    }
  }

  function detectVisibility() {
    try {
      docHidden = !!document.hidden;
      document.addEventListener("visibilitychange", function () {
        docHidden = !!document.hidden;
        if (docHidden) {
          // Pause RAF; particles freeze in place until visible again.
          if (rafHandle) {
            cancelAnimationFrame(rafHandle);
            rafHandle = null;
          }
          lastTs = 0;
        } else if (!paused && particles.length) {
          rafHandle = requestAnimationFrame(tick);
        }
      });
    } catch (e) {}
  }

  function ensureCanvas() {
    if (canvas && document.body && document.body.contains(canvas)) return canvas;
    if (!document.body) return null;
    canvas = document.createElement("canvas");
    canvas.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:9700",
      "pointer-events:none",
      "width:100%",
      "height:100%"
    ].join(";");
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize, { passive: true });
    return canvas;
  }

  function resize() {
    if (!canvas) return;
    var dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  // Particle pool — recycle objects to dodge GC during sustained bursts.
  function takeParticle() {
    return pool.length ? pool.pop() : {};
  }
  function returnParticle(p) {
    if (pool.length < 600) pool.push(p);
  }

  function configParticle(p, x, y, palette, opts) {
    opts = opts || {};
    palette = palette || activePalette;

    // Spread/cone configuration
    var spread = (typeof opts.spread === "number") ? opts.spread : Math.PI * 0.7; // ~126 degrees
    var bias = (typeof opts.upwardBias === "number") ? opts.upwardBias : -Math.PI / 2; // upward
    var angle = bias + rand(-spread / 2, spread / 2);

    var speedMin = (typeof opts.speedMin === "number") ? opts.speedMin : 180;
    var speedMax = (typeof opts.speedMax === "number") ? opts.speedMax : 460;
    var speed = rand(speedMin, speedMax) * (opts.vScale || 1);

    var color = palette[Math.floor(Math.random() * palette.length)];
    var life = (typeof opts.life === "number") ? opts.life : rand(0.9, 1.4);

    // Shape selection
    var shapes = opts.shapes || ["rect", "circle"];
    var shape = shapes[Math.floor(Math.random() * shapes.length)];

    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = life;
    p.maxLife = life;
    p.size = (typeof opts.size === "number") ? opts.size : rand(2.6, 4.2);
    p.rot = rand(0, Math.PI * 2);
    p.vRot = rand(-6, 6);
    p.shape = shape;
    p.color = color;
    p.gravity = (typeof opts.gravity === "number") ? opts.gravity : 880;
    p.drag = (typeof opts.drag === "number") ? opts.drag : 0.985;
    return p;
  }

  function spawnParticle(x, y, palette, opts) {
    if (particles.length >= MAX_PARTICLES) return null;
    var p = configParticle(takeParticle(), x, y, palette, opts);
    particles.push(p);
    return p;
  }

  // Squiggle path is rendered as a small sine-wavelet stroke
  function drawShape(p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12 * alpha;

    if (p.shape === "rect") {
      ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
    } else if (p.shape === "star") {
      drawStar(0, 0, 5, p.size * 1.6, p.size * 0.7);
      ctx.fill();
    } else if (p.shape === "squiggle") {
      ctx.lineWidth = Math.max(1.2, p.size * 0.55);
      ctx.lineCap = "round";
      ctx.beginPath();
      var w = p.size * 3.2;
      ctx.moveTo(-w, 0);
      ctx.bezierCurveTo(-w * 0.5, -w * 0.6, w * 0.5, w * 0.6, w, 0);
      ctx.stroke();
    } else if (p.shape === "ribbon") {
      // Long thin rectangle (streamer-style)
      ctx.fillRect(-p.size * 3, -p.size * 0.35, p.size * 6, p.size * 0.7);
    } else if (p.shape === "coin") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.18)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStar(cx, cy, spikes, outer, inner) {
    var rot = Math.PI / 2 * 3;
    var step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outer);
    for (var i = 0; i < spikes; i++) {
      var x = cx + Math.cos(rot) * outer;
      var y = cy + Math.sin(rot) * outer;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * inner;
      y = cy + Math.sin(rot) * inner;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outer);
    ctx.closePath();
  }

  function tick(ts) {
    if (!ctx) return;
    if (paused || docHidden) {
      rafHandle = null;
      return;
    }
    var dt = lastTs ? Math.min(0.04, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var aliveCount = 0;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { returnParticle(p); continue; }
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.rot += p.vRot * dt;
      var alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      drawShape(p, alpha);
      // Compact alive particles in place
      particles[aliveCount++] = p;
    }
    particles.length = aliveCount;
    if (particles.length) {
      rafHandle = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastTs = 0;
      rafHandle = null;
    }
  }

  function startLoop() {
    if (paused || docHidden) return;
    if (!rafHandle) {
      lastTs = 0;
      rafHandle = requestAnimationFrame(tick);
    }
  }

  // ─── Reduced-motion fallbacks ────────────────────────────────────────
  function pulseFlash(x, y, color) {
    if (!ensureCanvas()) return;
    var c = color || "rgba(245,196,81,.55)";
    var grad = ctx.createRadialGradient(x, y, 0, x, y, 90);
    grad.addColorStop(0, c);
    grad.addColorStop(1, "rgba(245,196,81,0)");
    var start = performance.now();
    function step(now) {
      if (docHidden) return;
      var t = Math.min(1, (now - start) / 600);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 80 + t * 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (t < 1) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(step);
  }

  function colorWash(color) {
    if (!ensureCanvas()) return;
    var c = color || "rgba(245,196,81,.18)";
    var start = performance.now();
    function step(now) {
      if (docHidden) return;
      var t = Math.min(1, (now - start) / 700);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.7;
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.restore();
      if (t < 1) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(step);
  }

  function emojiFloat(emoji, x, y) {
    if (!document.body) return;
    var node = document.createElement("div");
    node.textContent = emoji || "🎉";
    node.setAttribute("aria-hidden", "true");
    node.style.cssText = [
      "position:fixed",
      "left:" + (x - 18) + "px",
      "top:" + (y - 18) + "px",
      "font-size:36px",
      "z-index:9701",
      "pointer-events:none",
      "transition:transform 1.4s ease-out, opacity 1.4s ease-out",
      "transform:translateY(0)",
      "opacity:1"
    ].join(";");
    document.body.appendChild(node);
    requestAnimationFrame(function () {
      node.style.transform = "translateY(-80px)";
      node.style.opacity = "0";
    });
    setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 1500);
  }

  function reducedFallback(variant, x, y, opts) {
    opts = opts || {};
    if (variant === "confetti") {
      emojiFloat(opts.emoji || "🎉", x, y);
      return;
    }
    if (variant === "tierUp" || variant === "fireworks") {
      colorWash(opts.washColor);
      return;
    }
    if (variant === "coinShower") {
      emojiFloat("🪙", x, y);
      return;
    }
    if (variant === "streamers") {
      colorWash("rgba(255,124,200,.14)");
      return;
    }
    pulseFlash(x, y, opts.flashColor);
  }

  // ─── Stack-safety queue ──────────────────────────────────────────────
  function noteBurstTime() {
    var now = performance.now();
    recentBurstTimes.push(now);
    // Trim to window
    while (recentBurstTimes.length && (now - recentBurstTimes[0]) > QUEUE_WINDOW_MS) {
      recentBurstTimes.shift();
    }
  }
  function shouldQueue() {
    return recentBurstTimes.length >= QUEUE_THRESHOLD;
  }
  function flushQueue() {
    if (!burstQueue.length) return;
    var item = burstQueue.shift();
    try { item.fn.apply(null, item.args); } catch (e) {}
    if (burstQueue.length) {
      setTimeout(flushQueue, 80);
    }
  }
  function queueOrRun(fn, args) {
    noteBurstTime();
    if (shouldQueue()) {
      burstQueue.push({ fn: fn, args: args });
      // Schedule a delayed drain
      setTimeout(flushQueue, 120);
      return false;
    }
    return true;
  }

  // ─── Public burst variants ───────────────────────────────────────────
  function burst(opts) {
    if (!initialized) initialize();
    opts = opts || {};
    var x = (typeof opts.x === "number") ? opts.x : window.innerWidth / 2;
    var y = (typeof opts.y === "number") ? opts.y : window.innerHeight / 2;
    var palette = opts.palette || activePalette;

    if (prefersReduced) {
      reducedFallback("burst", x, y, opts);
      return;
    }
    if (!queueOrRun(burst, [opts])) return;
    if (!ensureCanvas()) return;

    var count = (typeof opts.count === "number") ? opts.count : 22;
    for (var i = 0; i < count; i++) {
      spawnParticle(x, y, palette, opts);
    }
    if (opts.withSound) playWhoosh("default");
    startLoop();
  }

  function burstFromElement(el, opts) {
    if (!el || !el.getBoundingClientRect) {
      return burst(opts);
    }
    var r = el.getBoundingClientRect();
    burst(Object.assign({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2
    }, opts || {}));
  }

  function confetti(opts) {
    if (!initialized) initialize();
    opts = opts || {};
    var x = (typeof opts.x === "number") ? opts.x : window.innerWidth / 2;
    var y = (typeof opts.y === "number") ? opts.y : window.innerHeight * 0.4;
    if (prefersReduced) { reducedFallback("confetti", x, y, opts); return; }
    if (!queueOrRun(confetti, [opts])) return;
    if (!ensureCanvas()) return;

    var count = (typeof opts.count === "number") ? opts.count : 60;
    var palette = opts.palette || activePalette;
    var spawnOpts = Object.assign({
      shapes: ["rect", "circle", "star", "squiggle"],
      spread: Math.PI * 1.6,    // wide
      upwardBias: 0,            // no upward bias — spray everywhere
      speedMin: 120,
      speedMax: 380,
      life: undefined,
      gravity: 720
    }, opts);
    for (var i = 0; i < count; i++) {
      spawnParticle(x, y, palette, spawnOpts);
    }
    if (opts.withSound) playWhoosh("sparkle");
    startLoop();
  }

  function fireworks(x, y, opts) {
    if (!initialized) initialize();
    opts = opts || {};
    if (typeof x !== "number") x = window.innerWidth / 2;
    if (typeof y !== "number") y = window.innerHeight * 0.4;
    if (prefersReduced) { reducedFallback("fireworks", x, y, opts); return; }
    if (!queueOrRun(fireworks, [x, y, opts])) return;
    if (!ensureCanvas()) return;

    var palette = opts.palette || activePalette;
    var primaryCount = (typeof opts.count === "number") ? opts.count : 40;
    // Stage 1: large radial burst from (x, y)
    var primaryOpts = {
      shapes: ["circle", "star"],
      spread: Math.PI * 2,
      upwardBias: 0,
      speedMin: 240,
      speedMax: 520,
      gravity: 380,
      drag: 0.97
    };
    for (var i = 0; i < primaryCount; i++) {
      spawnParticle(x, y, palette, primaryOpts);
    }
    if (opts.withSound) playWhoosh("fireworks");
    startLoop();

    // Stage 2: 2–3 secondary smaller bursts at offsets, staggered
    var secondaries = 2 + Math.floor(Math.random() * 2);
    for (var s = 0; s < secondaries; s++) {
      (function (idx) {
        var sx = x + rand(-180, 180);
        var sy = y + rand(-120, 120);
        setTimeout(function () {
          if (prefersReduced || docHidden) return;
          if (!ensureCanvas()) return;
          var sCount = 14 + Math.floor(Math.random() * 8);
          var sOpts = {
            shapes: ["circle"],
            spread: Math.PI * 2,
            upwardBias: 0,
            speedMin: 140,
            speedMax: 320,
            gravity: 420,
            drag: 0.965,
            size: 2.2
          };
          for (var k = 0; k < sCount; k++) {
            spawnParticle(sx, sy, palette, sOpts);
          }
          startLoop();
        }, 220 + idx * 180);
      })(s);
    }
  }

  function coinShower(opts) {
    if (!initialized) initialize();
    opts = opts || {};
    if (prefersReduced) {
      reducedFallback("coinShower", window.innerWidth / 2, 80, opts);
      return;
    }
    if (!queueOrRun(coinShower, [opts])) return;
    if (!ensureCanvas()) return;

    var count = (typeof opts.count === "number") ? opts.count : 50;
    var palette = opts.palette || ["#f5c451", "#ffd884", "#ffe7a3", "#e5a92c"];
    var spawnOpts = {
      shapes: ["coin", "circle"],
      spread: Math.PI * 0.4,
      upwardBias: Math.PI / 2,    // downward
      speedMin: 80,
      speedMax: 240,
      gravity: 1100,
      drag: 0.992,
      size: 4.2,
      life: 1.8
    };
    for (var i = 0; i < count; i++) {
      var x = rand(0, window.innerWidth);
      var y = rand(-40, 0);
      spawnParticle(x, y, palette, spawnOpts);
    }
    if (opts.withSound) playWhoosh("coin");
    startLoop();
  }

  function streamers(opts) {
    if (!initialized) initialize();
    opts = opts || {};
    if (prefersReduced) {
      reducedFallback("streamers", window.innerWidth / 2, 60, opts);
      return;
    }
    if (!queueOrRun(streamers, [opts])) return;
    if (!ensureCanvas()) return;

    var palette = opts.palette || activePalette;
    var perCorner = (typeof opts.count === "number") ? opts.count : 22;

    // Left corner: ribbons fly to lower-right
    var leftOpts = {
      shapes: ["ribbon"],
      spread: Math.PI * 0.3,
      upwardBias: Math.PI * 0.18,   // diagonal down-right
      speedMin: 260,
      speedMax: 480,
      gravity: 380,
      drag: 0.992,
      size: 3.2,
      life: 1.6
    };
    for (var i = 0; i < perCorner; i++) {
      spawnParticle(0, rand(0, 60), palette, leftOpts);
    }
    // Right corner: ribbons fly to lower-left
    var rightOpts = Object.assign({}, leftOpts, {
      upwardBias: Math.PI - Math.PI * 0.18
    });
    for (var j = 0; j < perCorner; j++) {
      spawnParticle(window.innerWidth, rand(0, 60), palette, rightOpts);
    }
    if (opts.withSound) playWhoosh("default");
    startLoop();
  }

  function tierUp(tierName, opts) {
    if (!initialized) initialize();
    opts = opts || {};
    var key = (tierName || "").toLowerCase();
    var palette = TIER_PALETTES[key] || TIER_PALETTES.gold;
    if (prefersReduced) {
      reducedFallback("tierUp", window.innerWidth / 2, window.innerHeight / 2, {
        washColor: (key === "legendary")
          ? "rgba(255,124,200,.22)"
          : "rgba(245,196,81,.18)"
      });
      return;
    }
    var origin = document.getElementById("profilePill");
    var originOpts = Object.assign({
      palette: palette,
      count: (key === "legendary") ? 60 : 40,
      vScale: 1.2,
      shapes: (key === "legendary")
        ? ["circle", "star", "squiggle"]
        : ["rect", "circle", "star"]
    }, opts);
    if (origin) {
      burstFromElement(origin, originOpts);
    } else {
      burst(originOpts);
    }
    // Legendary gets an extra fireworks layer
    if (key === "legendary") {
      setTimeout(function () {
        fireworks(window.innerWidth / 2, window.innerHeight * 0.45, {
          palette: palette,
          count: 36,
          withSound: !!opts.withSound
        });
      }, 160);
    }
  }

  function fromAchievement(def, opts) {
    var palette = activePalette;
    if (def && def.tier && TIER_PALETTES[String(def.tier).toLowerCase()]) {
      palette = TIER_PALETTES[String(def.tier).toLowerCase()];
    } else if (def && def.tier === "legendary") {
      palette = TIER_PALETTES.legendary;
    } else if (def && def.tier === "gold") {
      palette = TIER_PALETTES.gold;
    } else if (def && def.tier === "silver") {
      palette = TIER_PALETTES.silver;
    }
    var origin = document.getElementById("profilePill");
    if (origin) {
      burstFromElement(origin, Object.assign({ palette: palette, count: 26 }, opts || {}));
    } else {
      burst(Object.assign({ palette: palette, count: 26 }, opts || {}));
    }
  }

  function fromShardPayout(amount, opts) {
    opts = opts || {};
    var n = Number(amount) || 0;
    if (n <= 0) return;
    if (n >= 100) {
      coinShower(Object.assign({ count: Math.min(80, 40 + Math.floor(n / 5)) }, opts));
    } else if (n >= 25) {
      fireworks(undefined, undefined, Object.assign({ count: 36 }, opts));
    } else {
      var origin = document.getElementById("profilePill");
      var sparkOpts = Object.assign({
        count: Math.max(10, Math.min(22, n + 6)),
        palette: ["#f5c451", "#ffd884", "#7af0ff"]
      }, opts);
      if (origin) burstFromElement(origin, sparkOpts);
      else burst(sparkOpts);
    }
  }

  // ─── Controls ────────────────────────────────────────────────────────
  function clear() {
    // Recycle all live particles into pool, then wipe canvas.
    for (var i = 0; i < particles.length; i++) returnParticle(particles[i]);
    particles.length = 0;
    if (rafHandle) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastTs = 0;
  }

  function pause() {
    paused = true;
    if (rafHandle) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
  }

  function resume() {
    if (!paused) return;
    paused = false;
    lastTs = 0;
    if (particles.length) startLoop();
  }

  function setPalette(arr) {
    if (Array.isArray(arr) && arr.length) {
      activePalette = arr.slice();
    }
  }

  function getActiveCount() { return particles.length; }

  // ─── Initialisation + auto-wiring ────────────────────────────────────
  function initialize() {
    if (initialized) return;
    initialized = true;
    detectReduced();
    detectVisibility();
    if (root.MrMacsProfile && typeof root.MrMacsProfile.on === "function") {
      var P = root.MrMacsProfile;
      P.on("achievement:unlock", function (e) {
        try { fromAchievement(e.detail.def); } catch (err) {}
      });
      P.on("profile:create", function () {
        var origin = document.getElementById("profilePill");
        if (origin) {
          burstFromElement(origin, {
            count: 18,
            palette: ["#f5c451", "#ffd884", "#7af0ff"]
          });
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  root.MrMacsCelebration = {
    // Original API (preserved)
    burst: burst,
    burstFromElement: burstFromElement,
    fromAchievement: fromAchievement,
    // New variants
    confetti: confetti,
    fireworks: fireworks,
    coinShower: coinShower,
    streamers: streamers,
    tierUp: tierUp,
    fromShardPayout: fromShardPayout,
    // Controls
    clear: clear,
    pause: pause,
    resume: resume,
    setPalette: setPalette,
    getActiveCount: getActiveCount
  };
})(typeof window !== "undefined" ? window : this);
