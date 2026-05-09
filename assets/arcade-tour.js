/* Mr. Mac's Arcade — Shared First-Run Tour Engine
 *
 * Local-only. Reads MrMacsProfile.hasSeenTour / markTourSeen when available,
 * and ALSO mirrors completion to localStorage so micro-tours track state
 * without depending on the profile module.
 *
 *   steps = [
 *     {
 *       type:   "highlight" (default) | "tooltip" | "modal",
 *       target: "#elementId" | DOMElement | null  (null = centered modal),
 *       title:  "Heading",
 *       body:   "1-2 sentence explanation",
 *       icon:   "🏆"   (modal only — optional)
 *       image:  "url"  (modal only — optional)
 *       placement: "auto" | "top" | "bottom" | "left" | "right" | "center"
 *     },
 *     ...
 *   ]
 *
 * Public APIs (both namespaces work; MrMacsTour is the new canonical name,
 * MrMacsArcadeTour is preserved for backward compatibility):
 *
 *   MrMacsArcadeTour.start(gameId, steps, opts)
 *   MrMacsArcadeTour.close()
 *   MrMacsArcadeTour.offerReplay(gameId, steps)
 *
 *   MrMacsTour.start(gameIdOrOpts, steps?, opts?)
 *     · If first arg is an object, fields { gameId, steps, force, ... }
 *     · opts.force=true overrides hasSeenTour and replays the tour
 *   MrMacsTour.skip()                  — dismiss + mark complete
 *   MrMacsTour.reset(gameId?)          — clear "seen" flag (all if omitted)
 *   MrMacsTour.startMicroTour(name, opts?)
 *     · Built-in micro-tours: "shop", "achievements", "daily"
 *   MrMacsTour.registerMicroTour(name, steps)  — extend with your own
 *   MrMacsTour.getCompletedTours()     — array of tour IDs
 *   MrMacsTour.isCompleted(tourId)     — boolean
 *
 * Keyboard:
 *   ←/↑      previous step (clamped at 0)
 *   →/↓/Enter/Space  next step / finish
 *   Esc      skip + mark seen
 *
 * Reduced motion: when (prefers-reduced-motion: reduce) is set, transitions
 * are disabled via CSS and step changes are instant.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;
  if (window.MrMacsArcadeTour && window.MrMacsTour) return;

  var STYLE_ID = "mr-macs-tour-styles";
  var COMPLETED_KEY = "mr-macs-tour-completed-v1";

  var STYLE_CONTENT =
    ".mt-overlay{position:fixed;inset:0;z-index:9700;pointer-events:none;}\n" +
    ".mt-overlay.is-open{pointer-events:auto;}\n" +
    ".mt-scrim{position:absolute;inset:0;background:rgba(6,8,15,.62);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);opacity:0;transition:opacity .25s ease-out;}\n" +
    ".mt-overlay.is-open .mt-scrim{opacity:1;}\n" +
    ".mt-overlay.mt-mode-tooltip .mt-scrim{background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;}\n" +
    ".mt-spotlight{position:absolute;border-radius:14px;box-shadow:0 0 0 9999px rgba(6,8,15,.66);transition:all .35s cubic-bezier(.16,1,.3,1);pointer-events:none;}\n" +
    ".mt-overlay.mt-mode-tooltip .mt-spotlight,.mt-overlay.mt-mode-modal .mt-spotlight{display:none;}\n" +
    ".mt-card{position:absolute;width:min(360px,calc(100vw - 28px));padding:18px 20px;background:linear-gradient(180deg,rgba(13,17,27,.96),rgba(8,11,20,.98));color:#f6f4ee;border:1px solid rgba(255,255,255,.14);border-radius:16px;box-shadow:0 28px 70px rgba(0,0,0,.55),0 1px 0 rgba(255,255,255,.06) inset;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .25s;outline:none;}\n" +
    ".mt-card[hidden]{display:none;}\n" +
    ".mt-card.mt-card-modal{width:min(440px,calc(100vw - 28px));padding:24px;}\n" +
    ".mt-card.mt-card-modal .mt-modal-icon{font-size:42px;line-height:1;display:block;margin:0 0 12px;}\n" +
    ".mt-card.mt-card-modal .mt-modal-image{display:block;width:100%;max-height:180px;object-fit:cover;border-radius:10px;margin:0 0 14px;border:1px solid rgba(255,255,255,.10);}\n" +
    ".mt-card .mt-step{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#7af0ff;margin-bottom:6px;}\n" +
    ".mt-card .mt-title{margin:0 0 6px;font-family:'Fraunces',serif;font-weight:540;font-size:20px;line-height:1.15;letter-spacing:-.012em;}\n" +
    ".mt-card.mt-card-modal .mt-title{font-size:24px;}\n" +
    ".mt-card .mt-body{margin:0 0 16px;font-family:'Inter',sans-serif;font-size:14px;line-height:1.5;color:#e2e6ee;}\n" +
    ".mt-card .mt-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;}\n" +
    ".mt-card .mt-skip{background:none;border:0;color:#9aa3bb;font:600 12px/1 'Inter',sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;padding:8px 0;}\n" +
    ".mt-card .mt-skip:hover{color:#f6f4ee;}\n" +
    ".mt-card .mt-prev{background:none;border:1px solid rgba(255,255,255,.14);color:#e2e6ee;font:600 12px/1 'Inter',sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;padding:9px 12px;border-radius:999px;transition:background .2s,border-color .2s;}\n" +
    ".mt-card .mt-prev:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.24);}\n" +
    ".mt-card .mt-prev[disabled]{opacity:.35;cursor:not-allowed;}\n" +
    ".mt-card .mt-next{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;background:linear-gradient(135deg,#f5c451,#ffd884);color:#14100a;border:1px solid rgba(245,196,81,.55);border-radius:999px;font:800 12.5px/1 'Inter',sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;box-shadow:0 12px 28px rgba(245,196,81,.22),0 1px 0 rgba(255,255,255,.45) inset;transition:transform .2s,box-shadow .2s;}\n" +
    ".mt-card .mt-next:hover{transform:translateY(-2px);}\n" +
    ".mt-card .mt-progress{display:inline-flex;gap:4px;}\n" +
    ".mt-card .mt-progress-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.18);transition:background .2s,width .2s;}\n" +
    ".mt-card .mt-progress-dot.is-active{background:#f5c451;width:18px;}\n" +
    "@media (prefers-reduced-motion: reduce){.mt-card,.mt-spotlight,.mt-scrim,.mt-card .mt-progress-dot,.mt-card .mt-prev,.mt-card .mt-next{transition:none;}.mt-card .mt-next:hover{transform:none;}}\n";

  function injectStyles() {
    if (!document.head) return;
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = STYLE_CONTENT;
    document.head.appendChild(s);
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function prefersReducedMotion() {
    try {
      if (window.matchMedia) {
        return !!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      }
    } catch (e) {}
    return false;
  }

  function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/[<>&"']/g, function (c) {
      return c === "<" ? "&lt;"
           : c === ">" ? "&gt;"
           : c === "&" ? "&amp;"
           : c === '"' ? "&quot;"
           : "&#39;";
    });
  }

  function getRect(target) {
    if (!target) return null;
    var el = typeof target === "string"
      ? (function () { try { return document.querySelector(target); } catch (e) { return null; } })()
      : target;
    if (!el || !el.getBoundingClientRect) return null;
    var r = el.getBoundingClientRect();
    if (!r) return null;
    // Skip elements with zero size (display:none / detached etc.)
    if (r.width <= 0 && r.height <= 0) return null;
    return { left: r.left, top: r.top, width: r.width, height: r.height, el: el };
  }

  // Resolve a step's target: either a real rect or null (centered/no target).
  // Skipped steps (target string with no match) become centered modals so the
  // tour gracefully degrades when DOM is partly missing.
  function resolveStep(step) {
    if (!step) return null;
    var copy = {};
    for (var k in step) if (Object.prototype.hasOwnProperty.call(step, k)) copy[k] = step[k];
    if (copy.type === "modal" || copy.type === "tooltip" || copy.type === "highlight") {
      // Already typed — leave it.
    } else {
      copy.type = copy.target == null ? "modal" : "highlight";
    }
    return copy;
  }

  // ── Completion tracking (localStorage mirror) ────────────────────
  function readCompleted() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(COMPLETED_KEY);
      if (!raw) return {};
      var obj = JSON.parse(raw);
      return (obj && typeof obj === "object") ? obj : {};
    } catch (e) { return {}; }
  }

  function writeCompleted(obj) {
    try {
      if (!window.localStorage) return false;
      window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(obj || {}));
      return true;
    } catch (e) { return false; }
  }

  function markCompleted(tourId) {
    var id = String(tourId || "").trim();
    if (!id) return;
    var store = readCompleted();
    store[id] = Date.now();
    writeCompleted(store);
    // Mirror to MrMacsProfile so existing hasSeenTour callers work.
    try {
      var profile = window.MrMacsProfile;
      if (profile && typeof profile.markTourSeen === "function") {
        profile.markTourSeen(id);
      }
    } catch (e) {}
  }

  function isCompleted(tourId) {
    var id = String(tourId || "").trim();
    if (!id) return false;
    // Profile is authoritative if it knows; otherwise fall back to mirror.
    try {
      var profile = window.MrMacsProfile;
      if (profile && typeof profile.hasSeenTour === "function") {
        if (profile.hasSeenTour(id)) return true;
      }
    } catch (e) {}
    var store = readCompleted();
    return Object.prototype.hasOwnProperty.call(store, id);
  }

  function getCompletedTours() {
    var ids = {};
    var store = readCompleted();
    Object.keys(store).forEach(function (k) { ids[k] = true; });
    // Try to enrich with profile entries when accessible. Profile typically
    // exposes hasSeenTour() per-id but not a list — we just keep our mirror.
    return Object.keys(ids);
  }

  function clearCompleted(tourId) {
    if (tourId == null) {
      writeCompleted({});
    } else {
      var id = String(tourId).trim();
      if (!id) return;
      var store = readCompleted();
      if (Object.prototype.hasOwnProperty.call(store, id)) {
        delete store[id];
        writeCompleted(store);
      }
    }
    // Best-effort: clear profile flag too if the API supports it.
    try {
      var profile = window.MrMacsProfile;
      if (profile && typeof profile.clearTourSeen === "function") {
        profile.clearTourSeen(tourId == null ? undefined : tourId);
      } else if (profile && typeof profile.resetTour === "function") {
        profile.resetTour(tourId == null ? undefined : tourId);
      }
    } catch (e) {}
  }

  // ── Engine ───────────────────────────────────────────────────────
  function api() {
    var state = null;

    function close(markSeen) {
      if (!state) return;
      if (markSeen && state.gameId) markCompleted(state.gameId);
      // Clean up any pending throttled handlers
      try {
        if (state.overlay && state.overlay.parentNode) state.overlay.parentNode.removeChild(state.overlay);
      } catch (e) {}
      try { window.removeEventListener("keydown", onKey); } catch (e) {}
      try { window.removeEventListener("resize", onResize); } catch (e) {}
      // Restore focus to the previously-focused element if we tracked it.
      try {
        if (state._returnFocus && typeof state._returnFocus.focus === "function") {
          state._returnFocus.focus();
        }
      } catch (e) {}
      state = null;
    }

    function skip() { close(true); }

    function onKey(e) {
      if (!state) return;
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          close(true);
          break;
        case "Enter":
        case " ":
        case "Spacebar": // legacy IE/Edge
          e.preventDefault();
          next();
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          prev();
          break;
        default:
          break;
      }
    }

    var resizeRaf = 0;
    function onResize() {
      if (!state) return;
      if (resizeRaf) {
        try { window.cancelAnimationFrame(resizeRaf); } catch (e) {}
      }
      try {
        resizeRaf = window.requestAnimationFrame(function () {
          resizeRaf = 0;
          if (state) renderStep();
        });
      } catch (e) {
        renderStep();
      }
    }

    function next() {
      if (!state) return;
      if (state.idx >= state.steps.length - 1) close(true);
      else { state.idx++; renderStep(); }
    }

    function prev() {
      if (!state) return;
      if (state.idx > 0) { state.idx--; renderStep(); }
    }

    function renderStep() {
      if (!state) return;
      var step = resolveStep(state.steps[state.idx]) || {};
      var stepType = step.type || "highlight";
      var rect = (stepType === "highlight") ? getRect(step.target) : null;
      // If a highlight target is missing, gracefully degrade to a centered tooltip.
      var effectiveType = stepType;
      if (stepType === "highlight" && !rect) effectiveType = "tooltip";

      var overlay = state.overlay;
      var spotlight = state.spotlight;
      var card = state.card;
      var pad = 10;
      var vw = window.innerWidth, vh = window.innerHeight;

      // Reflect the effective type on the overlay for CSS hooks
      overlay.classList.remove("mt-mode-highlight", "mt-mode-tooltip", "mt-mode-modal");
      overlay.classList.add("mt-mode-" + effectiveType);

      // Spotlight position
      if (effectiveType === "highlight" && rect) {
        spotlight.style.left = (rect.left - pad) + "px";
        spotlight.style.top = (rect.top - pad) + "px";
        spotlight.style.width = (rect.width + pad * 2) + "px";
        spotlight.style.height = (rect.height + pad * 2) + "px";
        spotlight.hidden = false;
      } else {
        spotlight.hidden = true;
      }

      // Card variant
      if (effectiveType === "modal") card.classList.add("mt-card-modal");
      else card.classList.remove("mt-card-modal");

      // Card content
      var stepLabel = "Step " + (state.idx + 1) + " of " + state.steps.length;
      var dots = state.steps.map(function (_, i) {
        return '<span class="mt-progress-dot' + (i === state.idx ? ' is-active' : '') + '"></span>';
      }).join("");
      var nextLabel = state.idx >= state.steps.length - 1 ? "Finish" : "Next";
      var prevDisabled = state.idx === 0;

      var modalHeader = "";
      if (effectiveType === "modal") {
        if (step.image) {
          modalHeader += '<img class="mt-modal-image" alt="" src="' + escapeHtml(step.image) + '">';
        }
        if (step.icon) {
          modalHeader += '<span class="mt-modal-icon" aria-hidden="true">' + escapeHtml(step.icon) + '</span>';
        }
      }

      card.innerHTML =
        modalHeader +
        '<div class="mt-step">' + escapeHtml(stepLabel) + '</div>' +
        '<h3 class="mt-title">' + escapeHtml(step.title || "") + '</h3>' +
        '<p class="mt-body">' + escapeHtml(step.body || "") + '</p>' +
        '<div class="mt-actions">' +
          '<button type="button" class="mt-skip" data-mt-action="skip">Skip tour</button>' +
          '<button type="button" class="mt-prev" data-mt-action="prev"' + (prevDisabled ? ' disabled' : '') + '>Back</button>' +
          '<div class="mt-progress" aria-hidden="true">' + dots + '</div>' +
          '<button type="button" class="mt-next" data-mt-action="next">' + escapeHtml(nextLabel) + '</button>' +
        '</div>';

      var skipBtn = card.querySelector('[data-mt-action="skip"]');
      var prevBtn = card.querySelector('[data-mt-action="prev"]');
      var nextBtn = card.querySelector('[data-mt-action="next"]');
      if (skipBtn) skipBtn.addEventListener("click", function () { close(true); });
      if (prevBtn) prevBtn.addEventListener("click", function () { if (!prevDisabled) prev(); });
      if (nextBtn) nextBtn.addEventListener("click", next);

      // Card position
      var cardW = Math.min(card.classList.contains("mt-card-modal") ? 440 : 360, vw - 28);
      var cardH = card.offsetHeight || 200;
      var cx, cy;

      if (effectiveType === "modal" || !rect || step.placement === "center") {
        cx = (vw - cardW) / 2;
        cy = (vh - cardH) / 2;
      } else if (effectiveType === "tooltip") {
        cx = (vw - cardW) / 2;
        cy = clamp(vh - cardH - 32, 14, vh - cardH - 14);
      } else {
        var place = step.placement || "auto";
        if (place === "auto") {
          // Pick the side with the most room
          var rooms = {
            bottom: vh - (rect.top + rect.height + pad),
            top: rect.top - pad,
            right: vw - (rect.left + rect.width + pad),
            left: rect.left - pad
          };
          place = Object.keys(rooms).reduce(function (best, k) {
            return rooms[k] > rooms[best] ? k : best;
          }, "bottom");
        }
        if (place === "bottom") {
          cx = clamp(rect.left + rect.width / 2 - cardW / 2, 14, vw - cardW - 14);
          cy = clamp(rect.top + rect.height + 18, 14, vh - cardH - 14);
        } else if (place === "top") {
          cx = clamp(rect.left + rect.width / 2 - cardW / 2, 14, vw - cardW - 14);
          cy = clamp(rect.top - cardH - 18, 14, vh - cardH - 14);
        } else if (place === "right") {
          cx = clamp(rect.left + rect.width + 18, 14, vw - cardW - 14);
          cy = clamp(rect.top + rect.height / 2 - cardH / 2, 14, vh - cardH - 14);
        } else {
          cx = clamp(rect.left - cardW - 18, 14, vw - cardW - 14);
          cy = clamp(rect.top + rect.height / 2 - cardH / 2, 14, vh - cardH - 14);
        }
      }
      card.style.left = cx + "px";
      card.style.top = cy + "px";

      // Move focus to the primary action so keyboard users can drive immediately.
      try { if (nextBtn && typeof nextBtn.focus === "function") nextBtn.focus({ preventScroll: true }); } catch (e) {}
    }

    // Normalize first-arg overload for MrMacsTour.start():
    //   start("gameId", steps, opts)
    //   start({ gameId, steps, force, ... })
    function normalizeStartArgs(a, b, c) {
      if (a && typeof a === "object" && !Array.isArray(a) && a.steps) {
        var opts = {};
        for (var k in a) if (Object.prototype.hasOwnProperty.call(a, k)) opts[k] = a[k];
        if (b && typeof b === "object" && !opts.opts) {
          // start({...}, opts) → merge
          for (var j in b) if (Object.prototype.hasOwnProperty.call(b, j)) opts[j] = b[j];
        }
        return { gameId: opts.gameId || opts.id || "tour", steps: opts.steps || [], opts: opts };
      }
      return { gameId: a, steps: b || [], opts: c || {} };
    }

    function start(gameId, steps, opts) {
      var n = normalizeStartArgs(gameId, steps, opts);
      gameId = n.gameId;
      steps = n.steps;
      opts = n.opts || {};

      // Always close any in-flight tour first.
      if (state) close(false);
      injectStyles();
      if (!Array.isArray(steps) || !steps.length) return false;
      if (!document.body) return false;

      var force = !!opts.force;
      if (!force && isCompleted(gameId)) return false;

      var overlay = document.createElement("div");
      overlay.className = "mt-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", opts.ariaLabel || "Game tour");

      var scrim = document.createElement("div");
      scrim.className = "mt-scrim";
      var dismissOnScrim = opts.dismissOnScrim !== false;
      if (dismissOnScrim) scrim.addEventListener("click", function () { close(true); });

      var spotlight = document.createElement("div");
      spotlight.className = "mt-spotlight";
      spotlight.hidden = true;

      var card = document.createElement("div");
      card.className = "mt-card";
      card.setAttribute("tabindex", "-1");

      overlay.appendChild(scrim);
      overlay.appendChild(spotlight);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      var returnFocus = null;
      try { returnFocus = document.activeElement; } catch (e) {}

      // Trigger transition (skip when reduced motion is preferred — instant)
      if (prefersReducedMotion()) {
        overlay.classList.add("is-open");
      } else {
        try {
          window.requestAnimationFrame(function () { overlay.classList.add("is-open"); });
        } catch (e) {
          overlay.classList.add("is-open");
        }
      }

      state = {
        gameId: gameId,
        steps: steps,
        idx: 0,
        overlay: overlay,
        scrim: scrim,
        spotlight: spotlight,
        card: card,
        _returnFocus: returnFocus
      };
      window.addEventListener("keydown", onKey);
      try {
        window.addEventListener("resize", onResize, { passive: true });
      } catch (e) {
        window.addEventListener("resize", onResize);
      }
      renderStep();
      return true;
    }

    function offerReplay(gameId, steps) {
      // Returns a function the host can call from a "Help" or "Replay tour" button
      return function () { start(gameId, steps, { force: true }); };
    }

    return {
      start: start,
      close: close,
      skip: skip,
      next: next,
      prev: prev,
      offerReplay: offerReplay,
      _isOpen: function () { return !!state; }
    };
  }

  var engine = api();

  // ── Built-in micro-tours ─────────────────────────────────────────
  // Selectors are best-effort — if the elements aren't on the page,
  // steps gracefully degrade to centered tooltips.
  var BUILTIN_MICRO_TOURS = {
    shop: [
      {
        type: "modal",
        icon: "🛒",
        title: "The Shop",
        body: "Spend the shards you earn from games on cosmetic upgrades, hint packs, and special items."
      },
      {
        type: "highlight",
        target: "[data-shop-tab], .shop-tabs, #shopTabs",
        title: "Browse categories",
        body: "Switch between Cosmetics, Boosts, and Bundles. Each tab shows what's currently available.",
        placement: "auto"
      },
      {
        type: "highlight",
        target: "[data-shop-balance], .shop-balance, #shopBalance",
        title: "Your shards",
        body: "This is your spendable balance. Earn more by playing flagship games and keeping your daily streak.",
        placement: "auto"
      }
    ],
    achievements: [
      {
        type: "modal",
        icon: "🏆",
        title: "The Trophy Case",
        body: "Track your progress across the arcade. Each game has its own ladder of achievements to unlock."
      },
      {
        type: "highlight",
        target: "[data-achievements-grid], .achievements-grid, #achievementsGrid",
        title: "Your unlocked feats",
        body: "Earned trophies show in full color. Locked ones are silhouetted — hover any tile to see how to unlock it.",
        placement: "auto"
      },
      {
        type: "highlight",
        target: "[data-achievements-progress], .achievements-progress, #achievementsProgress",
        title: "Overall progress",
        body: "Your completion percentage across every game. Replay your favorites to chase the last few.",
        placement: "auto"
      }
    ],
    daily: [
      {
        type: "modal",
        icon: "📅",
        title: "Daily Challenge",
        body: "A new prompt every day. Finish it before midnight for bonus shards and to extend your streak."
      },
      {
        type: "highlight",
        target: "[data-daily-card], .daily-card, #dailyCard",
        title: "Today's challenge",
        body: "Your current daily lives here. The countdown shows how long until it rotates.",
        placement: "auto"
      },
      {
        type: "highlight",
        target: "[data-daily-streak], .daily-streak, #dailyStreak",
        title: "Streak tracker",
        body: "Don't break the chain — each consecutive day boosts your shard reward up to a weekly cap.",
        placement: "auto"
      }
    ]
  };

  var customMicroTours = {};

  function startMicroTour(name, opts) {
    var key = String(name || "").trim().toLowerCase();
    if (!key) return false;
    var steps = customMicroTours[key] || BUILTIN_MICRO_TOURS[key];
    if (!steps || !steps.length) return false;
    var tourId = (opts && opts.tourId) || ("micro-" + key);
    return engine.start(tourId, steps, opts || {});
  }

  function registerMicroTour(name, steps) {
    var key = String(name || "").trim().toLowerCase();
    if (!key || !Array.isArray(steps) || !steps.length) return false;
    customMicroTours[key] = steps.slice();
    return true;
  }

  // ── Public APIs (legacy + new) ───────────────────────────────────
  // Legacy namespace — preserved exactly as before.
  window.MrMacsArcadeTour = {
    start: engine.start,
    close: engine.close,
    offerReplay: engine.offerReplay
  };

  // New canonical namespace per the polish brief.
  window.MrMacsTour = {
    // Direct engine surface
    start: engine.start,
    close: engine.close,
    skip: engine.skip,
    next: engine.next,
    prev: engine.prev,
    offerReplay: engine.offerReplay,
    isOpen: engine._isOpen,

    // Replay / reset helpers
    reset: function (gameId) { clearCompleted(gameId); },
    replay: function (gameId, steps, opts) {
      var merged = {};
      if (opts && typeof opts === "object") {
        for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) merged[k] = opts[k];
      }
      merged.force = true;
      return engine.start(gameId, steps, merged);
    },

    // Micro-tours
    startMicroTour: startMicroTour,
    registerMicroTour: registerMicroTour,
    listMicroTours: function () {
      var keys = {};
      Object.keys(BUILTIN_MICRO_TOURS).forEach(function (k) { keys[k] = true; });
      Object.keys(customMicroTours).forEach(function (k) { keys[k] = true; });
      return Object.keys(keys);
    },

    // Completion tracking
    getCompletedTours: getCompletedTours,
    isCompleted: isCompleted,

    // Style hook (mostly internal, exposed for embed scenarios)
    injectStyles: injectStyles
  };
})();
