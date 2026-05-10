/*!
 * arcade-tutorial.js — Per-game tutorial overlay system for Mr. Mac's Review Arcade.
 *
 * Distinct from arcade-tour.js (which is hub-focused). This module is designed
 * for individual games to drive a step-by-step first-play tutorial: tooltip
 * cards, element spotlights, modal callouts, and "wait-for-action" steps that
 * pause until the player presses a key, clicks a target, reaches a score, or a
 * timer elapses.
 *
 * Public API: window.MrMacsTutorial
 *   register(gameId, steps)              -> void (idempotent per gameId)
 *   start(gameId, opts={})               -> { stop }
 *   markComplete(gameId)                 -> void
 *   isComplete(gameId)                   -> bool
 *   reset(gameId)                        -> void  (QA + replay)
 *   setAutoShow(gameId, enabled)         -> void
 *   on(event, handler), off(event, handler)
 *
 * Events emitted: "register", "start", "step", "complete", "skip", "reset".
 *
 * Storage key: "mr-macs-arcade-tutorials-v1"
 *   { [gameId]: { completed: bool, lastShownTs: number, autoShow: bool } }
 *
 * Hub integration is defensive: window.MrMacsProfile is consulted only via a
 * truthy guard, never required.
 */
(function (root) {
  "use strict";

  if (root.MrMacsTutorial) return; // idempotent

  var STORAGE_KEY = "mr-macs-arcade-tutorials-v1";
  var STYLE_ID = "arcade-tutorial-styles";
  var ROOT_ID = "mt-tutor-root";
  var Z_BASE = 99000;

  // ---------- storage ----------
  function loadStore() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === "object") ? parsed : {};
    } catch (e) { return {}; }
  }
  function saveStore(obj) {
    try {
      if (root.localStorage) root.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) { /* private mode / quota — ignore */ }
  }
  function getEntry(gameId) {
    var s = loadStore();
    return s[gameId] || { completed: false, lastShownTs: 0, autoShow: true };
  }
  function setEntry(gameId, patch) {
    var s = loadStore();
    s[gameId] = Object.assign({ completed: false, lastShownTs: 0, autoShow: true }, s[gameId] || {}, patch);
    saveStore(s);
  }

  // ---------- event bus ----------
  var listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function off(evt, fn) {
    var arr = listeners[evt]; if (!arr) return;
    listeners[evt] = arr.filter(function (h) { return h !== fn; });
  }
  function emit(evt, payload) {
    var arr = listeners[evt]; if (!arr) return;
    arr.slice().forEach(function (fn) { try { fn(payload); } catch (e) { /* swallow */ } });
  }

  // ---------- registry ----------
  var registry = {}; // gameId -> steps[]
  function register(gameId, steps) {
    if (!gameId || !Array.isArray(steps) || !steps.length) return;
    registry[gameId] = steps.slice();
    emit("register", { gameId: gameId, count: steps.length });
  }

  // ---------- styles ----------
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      "#" + ROOT_ID + "{position:fixed;inset:0;z-index:" + Z_BASE + ";pointer-events:none;font-family:'Press Start 2P','VT323',system-ui,sans-serif;}",
      ".mt-tutor-scrim{position:absolute;inset:0;background:rgba(8,10,24,.72);pointer-events:auto;animation:mt-tutor-fade .25s ease-out;}",
      ".mt-tutor-spotlight{position:absolute;border-radius:10px;box-shadow:0 0 0 9999px rgba(8,10,24,.78),0 0 0 3px #ffd54a,0 0 26px 6px rgba(255,213,74,.55);transition:all .35s cubic-bezier(.2,.8,.2,1);pointer-events:none;}",
      ".mt-tutor-card{position:absolute;max-width:380px;min-width:240px;background:linear-gradient(180deg,#1a1f3a 0%,#0d1024 100%);color:#fff;border:2px solid #ffd54a;border-radius:14px;padding:18px 20px 16px;box-shadow:0 18px 50px rgba(0,0,0,.55);pointer-events:auto;animation:mt-tutor-pop .28s cubic-bezier(.2,.9,.3,1.2);}",
      ".mt-tutor-card.mt-center{left:50%;top:50%;transform:translate(-50%,-50%);}",
      ".mt-tutor-card h3{margin:0 0 8px;font-size:14px;letter-spacing:.5px;color:#ffd54a;line-height:1.3;}",
      ".mt-tutor-card p{margin:0 0 14px;font-size:12px;line-height:1.6;color:#e8ecff;font-family:'VT323',monospace;font-size:16px;}",
      ".mt-tutor-card .mt-tutor-img{display:block;max-width:100%;border-radius:8px;margin:0 0 12px;border:1px solid rgba(255,213,74,.4);}",
      ".mt-tutor-row{display:flex;align-items:center;justify-content:space-between;gap:8px;}",
      ".mt-tutor-prog{font-size:10px;letter-spacing:1px;color:rgba(255,255,255,.55);font-family:'Press Start 2P',monospace;}",
      ".mt-tutor-actions{display:flex;gap:8px;align-items:center;}",
      ".mt-tutor-btn{appearance:none;background:#ffd54a;color:#1a1f3a;border:0;border-radius:6px;padding:8px 14px;font-family:'Press Start 2P',monospace;font-size:10px;letter-spacing:.5px;cursor:pointer;box-shadow:0 3px 0 #b88a00;transition:transform .08s,box-shadow .08s;}",
      ".mt-tutor-btn:hover{transform:translateY(-1px);}",
      ".mt-tutor-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #b88a00;}",
      ".mt-tutor-btn.ghost{background:transparent;color:rgba(255,255,255,.7);box-shadow:none;border:1px solid rgba(255,255,255,.25);}",
      ".mt-tutor-btn.ghost:hover{color:#fff;border-color:#ffd54a;}",
      ".mt-tutor-skip{position:absolute;top:14px;right:18px;background:transparent;border:0;color:rgba(255,255,255,.6);font-family:'Press Start 2P',monospace;font-size:9px;cursor:pointer;letter-spacing:.6px;pointer-events:auto;}",
      ".mt-tutor-skip:hover{color:#ffd54a;}",
      ".mt-tutor-arrow{position:absolute;width:0;height:0;border:10px solid transparent;}",
      ".mt-tutor-arrow.up{border-bottom-color:#ffd54a;top:-20px;left:32px;}",
      ".mt-tutor-arrow.down{border-top-color:#ffd54a;bottom:-20px;left:32px;}",
      ".mt-tutor-arrow.left{border-right-color:#ffd54a;left:-20px;top:32px;}",
      ".mt-tutor-arrow.right{border-left-color:#ffd54a;right:-20px;top:32px;}",
      ".mt-tutor-pulse{position:absolute;border:3px solid #ffd54a;border-radius:10px;animation:mt-tutor-pulse 1.4s ease-out infinite;pointer-events:none;}",
      ".mt-tutor-action-hint{display:inline-block;background:rgba(255,213,74,.15);color:#ffd54a;border:1px solid rgba(255,213,74,.45);border-radius:4px;padding:3px 8px;font-family:'Press Start 2P',monospace;font-size:9px;letter-spacing:.5px;margin-top:4px;}",
      "@keyframes mt-tutor-fade{from{opacity:0;}to{opacity:1;}}",
      "@keyframes mt-tutor-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.9);}100%{opacity:1;transform:translate(-50%,-50%) scale(1);}}",
      ".mt-tutor-card:not(.mt-center){animation:mt-tutor-slide .28s cubic-bezier(.2,.9,.3,1.2);}",
      "@keyframes mt-tutor-slide{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}",
      "@keyframes mt-tutor-pulse{0%{transform:scale(1);opacity:.9;}100%{transform:scale(1.18);opacity:0;}}",
      "@media (prefers-reduced-motion: reduce){.mt-tutor-scrim,.mt-tutor-card,.mt-tutor-spotlight{animation:none!important;transition:none!important;}.mt-tutor-pulse{animation:none!important;}}"
    ].join("\n");
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // ---------- DOM helpers ----------
  function resolveTarget(t) {
    if (!t) return null;
    if (typeof t === "string") {
      try { return document.querySelector(t); } catch (e) { return null; }
    }
    if (t && t.nodeType === 1) return t;
    return null;
  }
  function rectOf(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ---------- runner ----------
  var active = null; // current run state

  function buildRoot() {
    var existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();
    var node = document.createElement("div");
    node.id = ROOT_ID;
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-live", "polite");
    node.setAttribute("aria-label", "Game tutorial");
    document.body.appendChild(node);
    return node;
  }

  function placeCard(card, targetRect) {
    if (!targetRect) {
      card.classList.add("mt-center");
      return;
    }
    card.classList.remove("mt-center");
    var vw = root.innerWidth || document.documentElement.clientWidth;
    var vh = root.innerHeight || document.documentElement.clientHeight;
    var cardW = 360, cardH = 180; // estimate; actual measurement below
    // measure after a frame
    var rect = card.getBoundingClientRect();
    if (rect.width) cardW = rect.width;
    if (rect.height) cardH = rect.height;

    var pad = 20;
    var x, y, arrow;
    // try below
    if (targetRect.y + targetRect.h + cardH + pad < vh) {
      x = targetRect.x;
      y = targetRect.y + targetRect.h + pad;
      arrow = "up";
    } else if (targetRect.y - cardH - pad > 0) {
      x = targetRect.x;
      y = targetRect.y - cardH - pad;
      arrow = "down";
    } else if (targetRect.x + targetRect.w + cardW + pad < vw) {
      x = targetRect.x + targetRect.w + pad;
      y = targetRect.y;
      arrow = "left";
    } else {
      x = Math.max(pad, targetRect.x - cardW - pad);
      y = targetRect.y;
      arrow = "right";
    }
    x = clamp(x, pad, vw - cardW - pad);
    y = clamp(y, pad, vh - cardH - pad);
    card.style.left = x + "px";
    card.style.top = y + "px";

    // arrow
    var existingArrow = card.querySelector(".mt-tutor-arrow");
    if (existingArrow) existingArrow.remove();
    var arr = document.createElement("div");
    arr.className = "mt-tutor-arrow " + arrow;
    card.appendChild(arr);
  }

  function actionHintLabel(action) {
    if (!action || !action.type) return "";
    if (action.type === "key-press") return "Press " + (action.target || "any key");
    if (action.type === "click") return "Click the highlighted spot";
    if (action.type === "score-reaches") {
      var s = (action.target && action.target.score) || action.target;
      return "Reach score: " + s;
    }
    if (action.type === "wait-ms") return "Auto-advances in " + Math.round((action.target || 0) / 1000) + "s";
    return "";
  }

  function attachAction(step, advance) {
    var act = step.action;
    if (!act || !act.type) return function () {};
    if (act.type === "key-press") {
      var keys = Array.isArray(act.target) ? act.target : [act.target];
      var keyHandler = function (ev) {
        if (keys.indexOf(ev.key) !== -1 || keys.indexOf(ev.code) !== -1) advance();
      };
      window.addEventListener("keydown", keyHandler, true);
      return function () { window.removeEventListener("keydown", keyHandler, true); };
    }
    if (act.type === "click") {
      var sel = act.target;
      var clickHandler = function (ev) {
        var el = resolveTarget(sel);
        if (!el) { advance(); return; }
        if (el === ev.target || el.contains(ev.target)) advance();
      };
      window.addEventListener("click", clickHandler, true);
      return function () { window.removeEventListener("click", clickHandler, true); };
    }
    if (act.type === "score-reaches") {
      var threshold = (act.target && act.target.score != null) ? act.target.score : Number(act.target) || 0;
      var poll = setInterval(function () {
        var s = 0;
        try {
          if (typeof active.opts.getScore === "function") s = Number(active.opts.getScore()) || 0;
          else if (root.MrMacsArcade && typeof root.MrMacsArcade.getScore === "function") s = Number(root.MrMacsArcade.getScore()) || 0;
          else if (root.gameState && typeof root.gameState.score === "number") s = root.gameState.score;
        } catch (e) { s = 0; }
        if (s >= threshold) { clearInterval(poll); advance(); }
      }, 200);
      return function () { clearInterval(poll); };
    }
    if (act.type === "wait-ms") {
      var ms = Number(act.target) || 1000;
      var t = setTimeout(advance, ms);
      return function () { clearTimeout(t); };
    }
    return function () {};
  }

  function renderStep(state, idx) {
    var step = state.steps[idx];
    if (!step) { finish(state, false); return; }
    state.idx = idx;
    state.cleanupAction && state.cleanupAction();
    state.cleanupAction = null;
    state.root.innerHTML = "";

    // scrim
    var scrim = document.createElement("div");
    scrim.className = "mt-tutor-scrim";
    state.root.appendChild(scrim);

    // spotlight
    var targetEl = resolveTarget(step.target);
    var rect = rectOf(targetEl);
    if (rect && (step.type === "highlight" || step.type === "tooltip" || step.type === "wait-for-action")) {
      var spot = document.createElement("div");
      spot.className = "mt-tutor-spotlight";
      var pad = 6;
      spot.style.left = (rect.x - pad) + "px";
      spot.style.top = (rect.y - pad) + "px";
      spot.style.width = (rect.w + pad * 2) + "px";
      spot.style.height = (rect.h + pad * 2) + "px";
      state.root.appendChild(spot);
      if (step.type === "wait-for-action") {
        var pulse = document.createElement("div");
        pulse.className = "mt-tutor-pulse";
        pulse.style.left = (rect.x - pad) + "px";
        pulse.style.top = (rect.y - pad) + "px";
        pulse.style.width = (rect.w + pad * 2) + "px";
        pulse.style.height = (rect.h + pad * 2) + "px";
        state.root.appendChild(pulse);
      }
    }

    // card
    var card = document.createElement("div");
    card.className = "mt-tutor-card";
    if (!rect || step.type === "modal") card.classList.add("mt-center");

    var skip = document.createElement("button");
    skip.className = "mt-tutor-skip";
    skip.type = "button";
    skip.textContent = "SKIP [ESC]";
    skip.addEventListener("click", function () { confirmSkip(state); });
    card.appendChild(skip);

    if (step.title) {
      var h = document.createElement("h3");
      h.textContent = step.title;
      card.appendChild(h);
    }
    if (step.imageSrc) {
      var img = document.createElement("img");
      img.className = "mt-tutor-img";
      img.alt = "";
      img.src = step.imageSrc;
      card.appendChild(img);
    }
    if (step.body) {
      var p = document.createElement("p");
      p.textContent = step.body;
      card.appendChild(p);
    }

    var hint = actionHintLabel(step.action);
    if (hint) {
      var hintEl = document.createElement("span");
      hintEl.className = "mt-tutor-action-hint";
      hintEl.textContent = hint;
      card.appendChild(hintEl);
    }

    var row = document.createElement("div");
    row.className = "mt-tutor-row";
    row.style.marginTop = "12px";
    var prog = document.createElement("span");
    prog.className = "mt-tutor-prog";
    prog.textContent = "STEP " + (idx + 1) + " / " + state.steps.length;
    row.appendChild(prog);

    var actions = document.createElement("div");
    actions.className = "mt-tutor-actions";
    if (idx > 0) {
      var back = document.createElement("button");
      back.type = "button";
      back.className = "mt-tutor-btn ghost";
      back.textContent = "BACK";
      back.addEventListener("click", function () { renderStep(state, idx - 1); });
      actions.appendChild(back);
    }
    var isLast = idx === state.steps.length - 1;
    var isWaitForAction = step.type === "wait-for-action";
    var hasAutoAdvance = step.action && (step.action.type === "wait-ms");
    var showNextButton = !(isWaitForAction && step.next === null) && !(hasAutoAdvance && step.next === null);
    if (showNextButton) {
      var next = document.createElement("button");
      next.type = "button";
      next.className = "mt-tutor-btn";
      next.textContent = step.next || (isLast ? "GOT IT! START PLAYING >" : "CONTINUE");
      next.addEventListener("click", function () { advance(state); });
      actions.appendChild(next);
    }
    row.appendChild(actions);
    card.appendChild(row);
    state.root.appendChild(card);

    if (rect && !card.classList.contains("mt-center")) {
      // place after attach so we can measure
      requestAnimationFrame(function () { placeCard(card, rect); });
    }

    // attach action handlers (for wait-for-action and auto-advance steps)
    if (step.action) {
      state.cleanupAction = attachAction(step, function () {
        if (step.next == null || isWaitForAction) advance(state);
        // else: action recorded, but user must press button to continue
      });
    }

    emit("step", { gameId: state.gameId, index: idx, step: step });
  }

  function advance(state) {
    var nextIdx = state.idx + 1;
    if (nextIdx >= state.steps.length) finish(state, true);
    else renderStep(state, nextIdx);
  }

  function confirmSkip(state) {
    var ok = root.confirm("Skip the tutorial? You can replay it anytime from the help menu.");
    if (!ok) return;
    finish(state, false, true);
  }

  function finish(state, completed, skipped) {
    if (!state || state.finished) return;
    state.finished = true;
    state.cleanupAction && state.cleanupAction();
    window.removeEventListener("keydown", state.keyHandler, true);
    window.removeEventListener("resize", state.resizeHandler);
    if (state.root && state.root.parentNode) state.root.parentNode.removeChild(state.root);
    if (completed) {
      setEntry(state.gameId, { completed: true, lastShownTs: Date.now() });
      emit("complete", { gameId: state.gameId });
    } else if (skipped) {
      setEntry(state.gameId, { lastShownTs: Date.now() });
      emit("skip", { gameId: state.gameId });
    }
    if (active === state) active = null;
  }

  function start(gameId, opts) {
    opts = opts || {};
    var steps = registry[gameId];
    if (!steps || !steps.length) return { stop: function () {} };
    if (active) finish(active, false, true);

    injectStyles();
    var state = {
      gameId: gameId,
      steps: steps,
      idx: 0,
      opts: opts,
      root: buildRoot(),
      cleanupAction: null,
      finished: false
    };

    state.keyHandler = function (ev) {
      if (state.finished) return;
      if (ev.key === "Escape") { ev.preventDefault(); confirmSkip(state); return; }
      if (ev.key === "ArrowRight" || ev.key === " " || ev.code === "Space") {
        // only if current step is not waiting on a different key action
        var s = state.steps[state.idx];
        if (s && s.type === "wait-for-action" && s.action && s.action.type === "key-press") return;
        ev.preventDefault();
        advance(state);
      } else if (ev.key === "ArrowLeft") {
        if (state.idx > 0) { ev.preventDefault(); renderStep(state, state.idx - 1); }
      }
    };
    window.addEventListener("keydown", state.keyHandler, true);

    state.resizeHandler = function () {
      // re-render current step to recompute card position relative to target
      if (!state.finished) renderStep(state, state.idx);
    };
    window.addEventListener("resize", state.resizeHandler);

    active = state;
    setEntry(gameId, { lastShownTs: Date.now() });
    emit("start", { gameId: gameId });
    renderStep(state, 0);

    return {
      stop: function () { finish(state, false, true); }
    };
  }

  // ---------- public helpers ----------
  function markComplete(gameId) {
    if (!gameId) return;
    setEntry(gameId, { completed: true, lastShownTs: Date.now() });
    emit("complete", { gameId: gameId });
  }
  function isComplete(gameId) {
    if (!gameId) return false;
    return !!getEntry(gameId).completed;
  }
  function reset(gameId) {
    if (!gameId) return;
    var s = loadStore();
    delete s[gameId];
    saveStore(s);
    emit("reset", { gameId: gameId });
  }
  function setAutoShow(gameId, enabled) {
    if (!gameId) return;
    setEntry(gameId, { autoShow: !!enabled });
  }

  // ---------- auto-show on first launch ----------
  // Games can opt in by calling MrMacsTutorial.start() themselves OR by setting
  // a data attribute and registering steps before this script runs.
  function maybeAutoStart() {
    // defensive profile peek (e.g. skip auto-show if profile flagged tutorials off)
    var profileSkip = false;
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getPreference === "function") {
        profileSkip = root.MrMacsProfile.getPreference("skipTutorials") === true;
      }
    } catch (e) { profileSkip = false; }
    if (profileSkip) return;

    var body = document.body;
    if (!body) return;
    var gameId = body.getAttribute("data-arcade-game");
    var auto = body.getAttribute("data-arcade-tutorial-auto");
    if (!gameId || auto === "off") return;
    var entry = getEntry(gameId);
    if (entry.completed || entry.autoShow === false) return;
    if (!registry[gameId]) return; // game hasn't registered yet
    // small delay so the game's own bootstrap can finish first
    setTimeout(function () {
      if (!active && registry[gameId] && !getEntry(gameId).completed) start(gameId, {});
    }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeAutoStart);
  } else {
    maybeAutoStart();
  }

  // ---------- export ----------
  root.MrMacsTutorial = {
    register: register,
    start: start,
    markComplete: markComplete,
    isComplete: isComplete,
    reset: reset,
    setAutoShow: setAutoShow,
    on: on,
    off: off,
    _version: "1.0.0"
  };
})(typeof window !== "undefined" ? window : this);
