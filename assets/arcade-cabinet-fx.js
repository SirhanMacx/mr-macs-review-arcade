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

  // ─── HIGH SCORE pulse + "+NN" coin-pop on score increment ───────────
  // If the page exposes any of these element ids, we add a brief pulse
  // class whenever their numeric text content changes upward AND we
  // float a "+NN" arcade coin-pop label rising from the score element.
  var SCORE_IDS = ["score", "scoreVal", "scoreDisplay", "playerScore", "coinScore"];
  var lastScores = {};

  function spawnPop(anchor, delta) {
    if (reduceMotion) return;
    if (!anchor) return;
    var rect = anchor.getBoundingClientRect();
    if (!rect || !rect.width) return;
    var pop = document.createElement("div");
    pop.className = "score-pop";
    pop.textContent = "+" + delta;
    pop.style.left = (rect.left + rect.width / 2) + "px";
    pop.style.top  = (rect.top - 4) + "px";
    document.body.appendChild(pop);
    setTimeout(function () { try { pop.remove(); } catch (e) {} }, 1100);
  }

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
          var delta = v - prev;
          if (delta > 0 && delta < 10000) spawnPop(el, delta);
        }
        lastScores[id] = v;
      });
    }, 250);
  }

  // ─── GAME OVER overlay watcher ───────────────────────────────────────
  // If the page exposes an end-screen / game-over container that becomes
  // visible, we briefly overlay a cabinet-style GAME OVER stinger with
  // a 9-second CONTINUE countdown. Auto-dismisses or yields to a click.
  var END_SELECTORS = ["#endScreen", ".end-screen", ".game-over", "#gameOver", "#endRecap"];
  var endShown = false;

  function isEndVisible(el) {
    if (!el) return false;
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    if (el.hasAttribute("hidden")) return false;
    if (el.classList.contains("hidden") || el.classList.contains("is-hidden")) return false;
    var rect = el.getBoundingClientRect();
    return rect.height > 30;
  }

  function flashGameOver() {
    if (reduceMotion) return;
    if (endShown) return;
    endShown = true;
    setTimeout(function () { endShown = false; }, 15000);

    var stinger = document.createElement("div");
    stinger.className = "cabinet-gameover-stinger";
    stinger.innerHTML =
      '<div class="cgo-line cgo-headline">GAME OVER</div>' +
      '<div class="cgo-line cgo-sub">CONTINUE? <span class="cgo-count">9</span></div>';
    document.body.appendChild(stinger);
    var n = 9;
    var iv = setInterval(function () {
      n--;
      var c = stinger.querySelector(".cgo-count");
      if (c) c.textContent = String(Math.max(0, n));
      if (n <= 0) {
        clearInterval(iv);
        stinger.classList.add("cgo-out");
        setTimeout(function () { try { stinger.remove(); } catch (e) {} }, 800);
      }
    }, 600);
    // Click anywhere on the stinger dismisses.
    stinger.addEventListener("click", function () {
      clearInterval(iv);
      stinger.classList.add("cgo-out");
      setTimeout(function () { try { stinger.remove(); } catch (e) {} }, 320);
    });
  }

  function watchEndState() {
    setInterval(function () {
      for (var i = 0; i < END_SELECTORS.length; i++) {
        var el = document.querySelector(END_SELECTORS[i]);
        if (el && isEndVisible(el) && !endShown) { flashGameOver(); return; }
      }
    }, 400);
  }

  // ─── Cabinet status ribbon (POWER · CREDITS · 1P) at bottom ─────────
  function mountStatusRibbon() {
    if (!document.body) return;
    if (!document.body.hasAttribute("data-game-page")) return;
    if (document.querySelector(".cabinet-status-ribbon")) return;
    var ribbon = document.createElement("div");
    ribbon.className = "cabinet-status-ribbon";
    ribbon.setAttribute("role", "presentation");
    ribbon.setAttribute("aria-hidden", "true");
    ribbon.innerHTML =
      '<span class="csr-cell csr-power"><span class="csr-dot"></span>POWER</span>' +
      '<span class="csr-cell">CREDITS: <span class="csr-val">99</span></span>' +
      '<span class="csr-cell csr-player">1P</span>' +
      '<span class="csr-cell csr-version">v6.7</span>';
    document.body.appendChild(ribbon);
  }

  function init() {
    document.addEventListener("click", onClickStart, true);
    crtPowerOn();
    watchScores();
    watchEndState();
    mountStatusRibbon();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  root.MrMacsCabinetFX = {
    flashP1Ready: flashP1Ready,
    flashGameOver: flashGameOver,
    spawnPop: spawnPop
  };
})(typeof window !== "undefined" ? window : globalThis);
