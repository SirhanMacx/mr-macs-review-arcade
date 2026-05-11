/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Review Arcade — Cabinet FX
   Tiny no-deps helper that:
     1. Flashes a "PLAYER 1 READY" banner when the player commits to a
        game (start button, INSERT COIN, mode-button, or first arrow key
        press on a focused canvas).
     2. Adds a one-time CRT power-on flash on a game page first load.
     3. Adds a HIGH SCORE pulse class when score elements grow.

   No DOM dependencies — wires itself up at DOMContentLoaded by selector.
   No-op under prefers-reduced-motion. Idempotent — re-injects safely.
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  if (root.MrMacsCabinetFX) return;

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var bannerCooldown = false;

  // ─── PLAYER 1 READY banner ───────────────────────────────────────────
  function flashP1Ready(label) {
    if (reduceMotion) return;
    if (bannerCooldown) return;
    bannerCooldown = true;
    setTimeout(function () { bannerCooldown = false; }, 3500);

    var existing = document.querySelector(".p1-ready");
    if (existing) existing.remove();
    var el = document.createElement("div");
    el.className = "p1-ready";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.textContent = label || "PLAYER 1 READY";
    document.body.appendChild(el);
    // Match the longest animation in CSS (2.3s) then yank.
    setTimeout(function () { try { el.remove(); } catch (e) {} }, 2400);
  }

  // ─── Auto-wire start triggers ────────────────────────────────────────
  // Any of these clicks counts as "Player 1 starts the game".
  var START_SELECTORS = [
    "#startBtn",
    ".start-btn",
    "button.primary",
    ".mode-button",
    ".attract-text",
    ".insert-coin",
    "[data-cabinet-start]"
  ];

  function isStartTarget(t) {
    if (!t || !t.closest) return false;
    for (var i = 0; i < START_SELECTORS.length; i++) {
      if (t.closest(START_SELECTORS[i])) return true;
    }
    // INSERT COIN / ENTER ARCADE text on buttons or anchors
    var btn = t.closest("button, a");
    if (btn) {
      var txt = (btn.textContent || "").trim().toLowerCase();
      if (/insert coin|enter arcade|start (game|round|level)/i.test(txt)) return true;
    }
    return false;
  }

  function onClickStart(e) {
    if (!isStartTarget(e.target)) return;
    // Skip if this click is on the SFX toggle / pause / fullscreen.
    var btn = e.target.closest("button");
    if (btn) {
      var t = (btn.textContent || "").trim().toLowerCase();
      var id = (btn.id || "").toLowerCase();
      if (/pause|resume|exit|library|help|fullscreen|sound|mute/i.test(t)) return;
      if (/(pause|resume|fullscreen|sound|sfx|mute|help|exit)/.test(id)) return;
    }
    flashP1Ready();
  }

  // ─── CRT power-on flash on each game page load ───────────────────────
  // Subtle white flash that snaps and fades. Skipped on hub (which has
  // its own CRT boot sequence) and under reduced motion.
  function crtPowerOn() {
    if (reduceMotion) return;
    if (!document.body) return;
    if (!document.body.hasAttribute("data-game-page")) return;
    // Don't double-fire if the hub-style CRT boot is already running.
    if (document.querySelector(".crt-boot")) return;
    if (sessionStorage.getItem("arcade.gamePoweredOn." + location.pathname)) return;
    sessionStorage.setItem("arcade.gamePoweredOn." + location.pathname, "1");

    var flash = document.createElement("div");
    flash.style.cssText = [
      "position:fixed", "inset:0", "z-index:9998", "pointer-events:none",
      "background:radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 30%, rgba(0,0,0,0) 75%)",
      "opacity:0", "transition:opacity 80ms ease-out"
    ].join(";");
    document.body.appendChild(flash);
    // Pop on, then snap fade.
    requestAnimationFrame(function () {
      flash.style.opacity = "1";
      setTimeout(function () {
        flash.style.transition = "opacity 380ms ease-out";
        flash.style.opacity = "0";
      }, 80);
      setTimeout(function () { try { flash.remove(); } catch (e) {} }, 520);
    });
  }

  // ─── HIGH SCORE pulse on score increment ────────────────────────────
  // If the page exposes any of these element ids, we add a brief pulse
  // class whenever their numeric text content changes upward.
  var SCORE_IDS = ["score", "scoreVal", "scoreDisplay", "playerScore", "coinScore"];
  var lastScores = {};

  function watchScores() {
    SCORE_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var v = parseInt((el.textContent || "0").replace(/\D/g, ""), 10);
      lastScores[id] = isFinite(v) ? v : 0;
    });
    setInterval(function () {
      SCORE_IDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var v = parseInt((el.textContent || "0").replace(/\D/g, ""), 10);
        if (!isFinite(v)) return;
        var prev = lastScores[id] || 0;
        if (v > prev) {
          el.classList.add("score-pulse");
          setTimeout(function () { el.classList.remove("score-pulse"); }, 350);
        }
        lastScores[id] = v;
      });
    }, 250);
  }

  function init() {
    document.addEventListener("click", onClickStart, true);
    crtPowerOn();
    watchScores();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  root.MrMacsCabinetFX = {
    flashP1Ready: flashP1Ready
  };
})(typeof window !== "undefined" ? window : globalThis);
