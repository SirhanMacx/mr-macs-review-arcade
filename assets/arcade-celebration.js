/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · celebration particle bursts
   ──────────────────────────────────────────────────────────────────────
   Lightweight canvas-based particle effect that fires when a player
   unlocks an achievement, crosses a tier threshold, or hits a streak
   milestone. Particles emit from a configurable origin (defaults to the
   topbar profile pill if present) and fall away under gravity in
   editorial colours (gold / cyan / magenta).

   Public API:
     window.MrMacsCelebration.burst(opts)
        opts: { x, y, count, palette, gravity, life }
     window.MrMacsCelebration.burstFromElement(el, opts)
     window.MrMacsCelebration.fromAchievement(def, opts)

   Auto-wires to MrMacsProfile events (achievement:unlock + tier-up
   detection via wallet:change). Respects prefers-reduced-motion: in
   reduced mode it falls back to a single soft pulse instead of
   particles.
   ───────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsCelebration) return;

  var canvas = null;
  var ctx = null;
  var particles = [];
  var rafHandle = null;
  var lastTs = 0;
  var initialized = false;
  var prefersReduced = false;

  var DEFAULT_PALETTE = [
    "#f5c451", // gold
    "#ffd884", // gold-warm
    "#7af0ff", // cyan
    "#ff7cc8", // magenta
    "#b892ff", // indigo
    "#ff8e6f"  // coral
  ];

  function detectReduced() {
    try {
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      prefersReduced = mq.matches;
      mq.addEventListener("change", function (e) { prefersReduced = e.matches; });
    } catch (e) {
      prefersReduced = false;
    }
  }

  function ensureCanvas() {
    if (canvas && document.body.contains(canvas)) return canvas;
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
    ctx && ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  function spawnParticle(x, y, palette, life, vScale) {
    // Bias upward (top-half cone). Velocity scales with life.
    var angle = rand(-Math.PI * 0.85, -Math.PI * 0.15);
    var speed = rand(180, 460) * (vScale || 1);
    var color = palette[Math.floor(Math.random() * palette.length)];
    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life || rand(0.9, 1.4),
      maxLife: life || rand(0.9, 1.4),
      size: rand(2.6, 4.2),
      rot: rand(0, Math.PI * 2),
      vRot: rand(-6, 6),
      shape: Math.random() > 0.55 ? "rect" : "circle",
      color: color
    };
  }

  function tick(ts) {
    if (!ctx) return;
    var dt = lastTs ? Math.min(0.04, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    var gravity = 880;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var alive = [];
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy += gravity * dt;
      p.vx *= 0.985;     // mild drag
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      p.rot += p.vRot * dt;
      var alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12 * alpha;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      alive.push(p);
    }
    particles = alive;
    if (particles.length) {
      rafHandle = requestAnimationFrame(tick);
    } else {
      // Final clear so we don't leave shadowy ghosts on next paint
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastTs = 0;
      rafHandle = null;
    }
  }

  function pulseFlash(x, y, color) {
    // prefers-reduced-motion fallback: single radial flash, no motion.
    ensureCanvas();
    var grad = ctx.createRadialGradient(x, y, 0, x, y, 90);
    grad.addColorStop(0, (color || "rgba(245,196,81,.55)"));
    grad.addColorStop(1, "rgba(245,196,81,0)");
    var start = performance.now();
    function step(now) {
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

  function burst(opts) {
    if (!initialized) initialize();
    opts = opts || {};
    var x = (typeof opts.x === "number") ? opts.x : window.innerWidth / 2;
    var y = (typeof opts.y === "number") ? opts.y : window.innerHeight / 2;
    var palette = opts.palette || DEFAULT_PALETTE;
    if (prefersReduced) {
      pulseFlash(x, y);
      return;
    }
    ensureCanvas();
    var count = (typeof opts.count === "number") ? opts.count : 22;
    for (var i = 0; i < count; i++) {
      particles.push(spawnParticle(x, y, palette, opts.life, opts.vScale));
    }
    if (!rafHandle) {
      lastTs = 0;
      rafHandle = requestAnimationFrame(tick);
    }
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

  function fromAchievement(def, opts) {
    var palette = DEFAULT_PALETTE;
    if (def && def.tier === "legendary") {
      palette = ["#ff7cc8", "#b892ff", "#f5c451", "#ffd884"];
    } else if (def && def.tier === "gold") {
      palette = ["#f5c451", "#ffd884", "#ff8e6f"];
    } else if (def && def.tier === "silver") {
      palette = ["#d6dcef", "#7af0ff", "#9aa3bb"];
    }
    var origin = document.getElementById("profilePill");
    if (origin) {
      burstFromElement(origin, Object.assign({ palette: palette, count: 26 }, opts || {}));
    } else {
      burst(Object.assign({ palette: palette, count: 26 }, opts || {}));
    }
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    detectReduced();
    if (root.MrMacsProfile && typeof root.MrMacsProfile.on === "function") {
      var P = root.MrMacsProfile;
      P.on("achievement:unlock", function (e) {
        try { fromAchievement(e.detail.def); } catch (err) {}
      });
      P.on("profile:create", function () {
        var origin = document.getElementById("profilePill");
        if (origin) burstFromElement(origin, { count: 18, palette: ["#f5c451", "#ffd884", "#7af0ff"] });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  root.MrMacsCelebration = {
    burst: burst,
    burstFromElement: burstFromElement,
    fromAchievement: fromAchievement
  };
})(typeof window !== "undefined" ? window : this);
