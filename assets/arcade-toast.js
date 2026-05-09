/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · ephemeral toast notification system
   ──────────────────────────────────────────────────────────────────────
   Listens to MrMacsProfile events and surfaces lightweight, dismissible
   toasts at the bottom-right of the viewport. Zero dependencies, vanilla
   DOM, works on every page that loads arcade-profile.js + this script.

   Public API (backward compatible):
     window.MrMacsToast.push({ icon, title, sub, tone, ms,
                                action, sticky, withSound })
        action:  { label, onClick }   — small button on the toast
        sticky:  true                 — never auto-dismiss; X button shown
        withSound: true               — play a short ping per tone
     window.MrMacsToast.shards(amount, source)         // convenience
     window.MrMacsToast.achievement(def)               // convenience

   Polish v2 (May 2026) additions:
     .shardEarned(amount, source)     — alias for the very common shards()
     .dismiss(id)                     — manually dismiss a specific toast
     .dismissAll()                    — clear every visible toast
     .getActiveCount()                — number of toasts currently visible

   Tones: default | shards | achievement | streak | error | info |
          warn | levelup
   - error/warn use role="alert"; everything else uses role="status".
   - prefers-reduced-motion: instant fade instead of slide.

   Dedup: if the same title arrives 3+ times within 2s, the existing
   toast gains an "×N" badge instead of stacking new copies.

   Auto-wires to:
     - profile:create           → "Welcome, <name>"
     - wallet:change (delta>0)  → "+N shards · <source>"
     - achievement:unlock       → "<title> unlocked"
     - streak:advance (>1)      → "<n>-day streak — keep it going"
   ─────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsToast) return;

  var stack = [];                  // array of { id, el, opts, dismiss, count, lastSeen }
  var container = null;
  var initialized = false;
  var idSeq = 0;
  var MAX_VISIBLE = 4;
  var DEDUP_WINDOW_MS = 2000;
  var DEDUP_THRESHOLD = 3;
  var prefersReduced = false;

  // ─── Web Audio (lazy, per-tone pings) ────────────────────────────────
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

  // Tone → small ping recipe
  var TONE_SOUNDS = {
    "default":     { freq: 880,  type: "triangle", dur: 0.12, slide: 1.0  },
    "info":        { freq: 660,  type: "sine",     dur: 0.14, slide: 1.0  },
    "shards":      { freq: 1240, type: "triangle", dur: 0.12, slide: 1.5  },
    "achievement": { freq: 760,  type: "triangle", dur: 0.22, slide: 1.6  },
    "streak":      { freq: 540,  type: "sine",     dur: 0.18, slide: 1.25 },
    "levelup":     { freq: 660,  type: "triangle", dur: 0.28, slide: 2.0  },
    "warn":        { freq: 380,  type: "square",   dur: 0.16, slide: 0.85 },
    "error":       { freq: 220,  type: "square",   dur: 0.22, slide: 0.7  }
  };
  function playPing(tone) {
    var ac = getAudioCtx();
    if (!ac) return;
    var spec = TONE_SOUNDS[tone] || TONE_SOUNDS["default"];
    try {
      if (ac.state === "suspended") { try { ac.resume(); } catch (e) {} }
      var now = ac.currentTime;
      var o = ac.createOscillator();
      var g = ac.createGain();
      o.type = spec.type;
      o.frequency.setValueAtTime(spec.freq, now);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(80, spec.freq * spec.slide), now + spec.dur
      );
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.04, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + spec.dur + 0.04);
      o.connect(g).connect(ac.destination);
      o.start(now);
      o.stop(now + spec.dur + 0.06);
    } catch (e) { /* swallow */ }
  }

  // ─── Reduced motion ──────────────────────────────────────────────────
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

  function injectStyles() {
    if (document.getElementById("arcade-toast-styles")) return;
    var css = '\
.arcade-toast-container {\
  position: fixed; z-index: 9000;\
  right: clamp(14px, 2vw, 28px); bottom: clamp(14px, 2vh, 28px);\
  display: flex; flex-direction: column; align-items: flex-end;\
  gap: 10px;\
  pointer-events: none;\
  max-width: min(360px, calc(100vw - 28px));\
}\
.arcade-toast {\
  pointer-events: auto;\
  display: flex; align-items: center; gap: 12px;\
  padding: 12px 16px;\
  background: linear-gradient(180deg, rgba(13, 17, 27, .94), rgba(8, 11, 20, .98));\
  border: 1px solid rgba(245, 196, 81, .35);\
  border-left: 3px solid rgba(245, 196, 81, .8);\
  border-radius: 14px;\
  box-shadow: 0 18px 44px rgba(0,0,0,.45), 0 0 24px rgba(245, 196, 81, .14);\
  -webkit-backdrop-filter: blur(14px) saturate(1.2);\
  backdrop-filter: blur(14px) saturate(1.2);\
  color: #f0f3fa;\
  min-width: 220px; max-width: 100%;\
  transform: translateX(120%);\
  opacity: 0;\
  transition: transform .35s cubic-bezier(.18, .89, .32, 1.18), opacity .35s ease;\
  cursor: pointer;\
  font: inherit;\
  text-align: left;\
  position: relative;\
}\
.arcade-toast.is-in { transform: translateX(0); opacity: 1; }\
.arcade-toast.is-out { transform: translateX(120%); opacity: 0; }\
.arcade-toast .at-icon {\
  flex-shrink: 0;\
  display: grid; place-items: center;\
  width: 36px; height: 36px;\
  border-radius: 10px;\
  background: linear-gradient(135deg, rgba(245,196,81,.22), rgba(122,240,255,.14));\
  color: #ffd884;\
  position: relative;\
}\
.arcade-toast .at-icon .ic { width: 20px; height: 20px; vertical-align: 0; }\
.arcade-toast .at-text { flex: 1; min-width: 0; line-height: 1.2; }\
.arcade-toast .at-title {\
  font-family: "Fraunces", serif;\
  font-weight: 540; font-style: italic;\
  font-size: 14.5px;\
  color: #f5f7fb;\
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\
  display: flex; align-items: center; gap: 6px;\
}\
.arcade-toast .at-sub {\
  margin-top: 2px;\
  font-family: "JetBrains Mono", monospace;\
  font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase;\
  color: #9aa3bb;\
  font-variant-numeric: tabular-nums;\
}\
.arcade-toast .at-count {\
  display: inline-block;\
  font-family: "JetBrains Mono", monospace;\
  font-size: 10px; letter-spacing: .04em;\
  padding: 1px 6px; border-radius: 999px;\
  background: rgba(245, 196, 81, .16);\
  color: #ffd884;\
  font-style: normal; font-weight: 600;\
}\
.arcade-toast .at-actions {\
  display: flex; align-items: center; gap: 6px;\
  margin-left: 8px;\
  flex-shrink: 0;\
}\
.arcade-toast .at-action {\
  appearance: none; -webkit-appearance: none;\
  background: rgba(245, 196, 81, .14);\
  border: 1px solid rgba(245, 196, 81, .35);\
  color: #ffd884;\
  font: inherit;\
  font-family: "JetBrains Mono", monospace;\
  font-size: 11px; letter-spacing: .05em; text-transform: uppercase;\
  padding: 5px 9px;\
  border-radius: 8px;\
  cursor: pointer;\
  transition: background .15s ease, border-color .15s ease, color .15s ease;\
}\
.arcade-toast .at-action:hover { background: rgba(245, 196, 81, .24); }\
.arcade-toast .at-close {\
  appearance: none; -webkit-appearance: none;\
  background: transparent; border: 0;\
  color: #9aa3bb;\
  font: inherit; font-size: 18px; line-height: 1;\
  width: 24px; height: 24px;\
  display: grid; place-items: center;\
  border-radius: 6px;\
  cursor: pointer;\
  transition: color .15s ease, background .15s ease;\
}\
.arcade-toast .at-close:hover { color: #f5f7fb; background: rgba(255,255,255,.06); }\
\
/* Tones */\
.arcade-toast[data-tone="default"] { border-left-color: rgba(245, 196, 81, .85); }\
\
.arcade-toast[data-tone="shards"] {\
  border-color: rgba(122, 240, 255, .35);\
  border-left: 3px solid rgba(122, 240, 255, .85);\
  box-shadow: 0 18px 44px rgba(0,0,0,.45), 0 0 24px rgba(122, 240, 255, .14);\
}\
.arcade-toast[data-tone="shards"] .at-icon { color: #7af0ff; background: linear-gradient(135deg, rgba(122,240,255,.18), rgba(122,240,255,.06)); }\
.arcade-toast[data-tone="shards"] .at-action { background: rgba(122,240,255,.14); border-color: rgba(122,240,255,.35); color: #7af0ff; }\
.arcade-toast[data-tone="shards"] .at-action:hover { background: rgba(122,240,255,.22); }\
\
.arcade-toast[data-tone="achievement"] {\
  border-color: rgba(255, 124, 200, .55);\
  border-left: 3px solid rgba(255, 124, 200, .9);\
  box-shadow: 0 18px 44px rgba(0,0,0,.45), 0 0 28px rgba(255, 124, 200, .18);\
}\
.arcade-toast[data-tone="achievement"] .at-icon { color: #ff7cc8; background: linear-gradient(135deg, rgba(255,124,200,.24), rgba(184,146,255,.10)); }\
.arcade-toast[data-tone="achievement"] .at-action { background: rgba(255,124,200,.14); border-color: rgba(255,124,200,.4); color: #ff7cc8; }\
\
.arcade-toast[data-tone="streak"] {\
  border-color: rgba(255, 142, 111, .45);\
  border-left: 3px solid rgba(255, 142, 111, .85);\
}\
.arcade-toast[data-tone="streak"] .at-icon { color: #ff8e6f; }\
.arcade-toast[data-tone="streak"] .at-action { background: rgba(255,142,111,.14); border-color: rgba(255,142,111,.4); color: #ff8e6f; }\
\
.arcade-toast[data-tone="info"] {\
  border-color: rgba(154, 163, 187, .45);\
  border-left: 3px solid rgba(184, 146, 255, .85);\
}\
.arcade-toast[data-tone="info"] .at-icon { color: #b892ff; background: linear-gradient(135deg, rgba(184,146,255,.18), rgba(122,240,255,.06)); }\
\
.arcade-toast[data-tone="warn"] {\
  border-color: rgba(245, 196, 81, .55);\
  border-left: 3px solid rgba(255, 196, 81, .95);\
  box-shadow: 0 18px 44px rgba(0,0,0,.45), 0 0 24px rgba(245, 196, 81, .22);\
}\
.arcade-toast[data-tone="warn"] .at-icon { color: #ffd884; background: linear-gradient(135deg, rgba(245,196,81,.32), rgba(255,142,111,.10)); }\
\
.arcade-toast[data-tone="error"] {\
  border-color: rgba(255, 99, 99, .6);\
  border-left: 3px solid rgba(255, 99, 99, .95);\
  box-shadow: 0 18px 44px rgba(0,0,0,.45), 0 0 24px rgba(255, 99, 99, .18);\
}\
.arcade-toast[data-tone="error"] .at-icon { color: #ff8b8b; background: linear-gradient(135deg, rgba(255,99,99,.22), rgba(255,142,111,.10)); }\
.arcade-toast[data-tone="error"] .at-action { background: rgba(255,99,99,.16); border-color: rgba(255,99,99,.4); color: #ff8b8b; }\
\
.arcade-toast[data-tone="levelup"] {\
  border-color: rgba(184, 146, 255, .55);\
  border-left: 3px solid rgba(184, 146, 255, .9);\
  box-shadow: 0 18px 44px rgba(0,0,0,.45), 0 0 28px rgba(184, 146, 255, .22);\
}\
.arcade-toast[data-tone="levelup"] .at-icon { color: #b892ff; background: linear-gradient(135deg, rgba(184,146,255,.30), rgba(245,196,81,.12)); }\
\
.arcade-toast.is-sticky { cursor: default; }\
\
@media (prefers-reduced-motion: reduce) {\
  .arcade-toast { transition: opacity .2s ease; transform: none; }\
  .arcade-toast.is-in, .arcade-toast.is-out { transform: none; }\
}\
@media print { .arcade-toast-container { display: none !important; } }\
';
    var style = document.createElement("style");
    style.id = "arcade-toast-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function ensureContainer() {
    if (container && document.body && document.body.contains(container)) return container;
    if (!document.body) return null;
    container = document.createElement("div");
    container.className = "arcade-toast-container";
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Arcade notifications");
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
    return container;
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    detectReduced();
    injectStyles();
    ensureContainer();
    if (root.MrMacsProfile && typeof root.MrMacsProfile.on === "function") {
      var P = root.MrMacsProfile;
      P.on("profile:create", function (e) {
        var name = (e && e.detail && e.detail.profile && e.detail.profile.name) || "trainer";
        push({
          icon: "sparkles",
          title: "Welcome, " + name,
          sub: "Profile saved on this device",
          tone: "default",
          ms: 4200
        });
      });
      P.on("wallet:change", function (e) {
        if (!e || !e.detail) return;
        var delta = e.detail.delta;
        if (typeof delta !== "number" || delta <= 0) return;
        var src = (e.detail.source || "").replace(/[-_]/g, " ");
        push({
          icon: "diamond",
          title: "+" + delta + " shards",
          sub: src ? src : "earned",
          tone: "shards",
          ms: 2800
        });
      });
      P.on("achievement:unlock", function (e) {
        var def = e && e.detail && e.detail.def;
        if (!def) return;
        push({
          icon: def.icon || "trophy",
          title: def.title || "Achievement unlocked",
          sub: (def.tier || "").toUpperCase() + " · " + (def.desc || ""),
          tone: "achievement",
          ms: 4800
        });
      });
      P.on("streak:advance", function (e) {
        var n = e && e.detail && e.detail.streak && e.detail.streak.current;
        if (!n || n < 2) return;
        push({
          icon: "flame",
          title: n + "-day streak",
          sub: "keep it going tomorrow",
          tone: "streak",
          ms: 3600
        });
      });
    }
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[<>&]/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;";
    });
  }

  function iconMarkup(spec) {
    if (!spec) return "";
    if (typeof spec !== "string") return "";
    if (root.MrMacsIcons) {
      if (root.MrMacsIcons.has && root.MrMacsIcons.has(spec)) return root.MrMacsIcons.svg(spec);
      var fromE = root.MrMacsIcons.fromEmoji && root.MrMacsIcons.fromEmoji(spec);
      if (fromE) return fromE;
    }
    return escapeHtml(spec);
  }

  // ─── Dedup lookup ────────────────────────────────────────────────────
  function findRecentDuplicate(title, tone) {
    if (!title) return null;
    var now = Date.now();
    for (var i = stack.length - 1; i >= 0; i--) {
      var entry = stack[i];
      if (!entry || !entry.opts) continue;
      if (entry.opts.title !== title) continue;
      if (entry.opts.tone !== tone) continue;
      if ((now - (entry.firstSeen || 0)) > DEDUP_WINDOW_MS) continue;
      return entry;
    }
    return null;
  }

  function updateCountBadge(entry) {
    var titleEl = entry.el.querySelector(".at-title");
    if (!titleEl) return;
    var badge = titleEl.querySelector(".at-count");
    if (entry.count >= DEDUP_THRESHOLD) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "at-count";
        titleEl.appendChild(badge);
      }
      badge.textContent = "×" + entry.count;
    }
  }

  function buildToast(opts, id) {
    var tone = opts.tone || "default";
    var sticky = !!opts.sticky;
    var el = document.createElement("div");
    el.className = "arcade-toast" + (sticky ? " is-sticky" : "");
    el.setAttribute("data-tone", tone);
    el.setAttribute("data-toast-id", String(id));
    // a11y: alert role for warn/error, status otherwise
    var alertish = (tone === "error" || tone === "warn");
    el.setAttribute("role", alertish ? "alert" : "status");
    el.setAttribute("aria-live", alertish ? "assertive" : "polite");

    // Build inner structure
    var icon = opts.icon || "sparkles";
    var hasAction = !!(opts.action && typeof opts.action.onClick === "function");
    var actionLabel = hasAction
      ? (opts.action.label || "→")
      : null;

    var html = ''
      + '<span class="at-icon" aria-hidden="true">' + iconMarkup(icon) + '</span>'
      + '<span class="at-text">'
      +   '<span class="at-title"></span>'
      +   (opts.sub ? '<span class="at-sub"></span>' : "")
      + '</span>';

    if (hasAction || sticky) {
      html += '<span class="at-actions">';
      if (hasAction) {
        html += '<button type="button" class="at-action" data-role="action">'
              + escapeHtml(actionLabel)
              + '</button>';
      }
      if (sticky) {
        html += '<button type="button" class="at-close" aria-label="Dismiss" data-role="close">×</button>';
      }
      html += '</span>';
    }

    el.innerHTML = html;
    var titleEl = el.querySelector(".at-title");
    if (titleEl) titleEl.textContent = opts.title || "";
    var subEl = el.querySelector(".at-sub");
    if (subEl) subEl.textContent = opts.sub || "";

    // Build a friendly aria-label
    var aria = (opts.title || "");
    if (opts.sub) aria += " — " + opts.sub;
    if (!sticky) aria += " — tap to dismiss";
    el.setAttribute("aria-label", aria);

    return el;
  }

  function makeDismiss(entry) {
    return function () {
      if (entry._dismissed) return;
      entry._dismissed = true;
      var el = entry.el;
      el.classList.add("is-out");
      el.classList.remove("is-in");
      var removeNow = function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        var ix = stack.indexOf(entry);
        if (ix !== -1) stack.splice(ix, 1);
      };
      if (prefersReduced) {
        // Skip transition wait — reduced motion users want it gone
        setTimeout(removeNow, 200);
      } else {
        setTimeout(removeNow, 380);
      }
      if (entry._timer) {
        clearTimeout(entry._timer);
        entry._timer = null;
      }
    };
  }

  function push(opts) {
    if (!initialized) initialize();
    if (!container) ensureContainer();
    if (!container) return null;
    opts = opts || {};
    var tone = opts.tone || "default";

    // Dedup: if same title+tone within window, bump count instead of stacking
    var dup = findRecentDuplicate(opts.title, tone);
    if (dup && !dup.opts.sticky) {
      dup.count = (dup.count || 1) + 1;
      dup.lastSeen = Date.now();
      updateCountBadge(dup);
      // Refresh auto-dismiss timer for non-sticky dups
      if (dup._timer) {
        clearTimeout(dup._timer);
        dup._timer = setTimeout(dup.dismiss, dup.ms);
      }
      // Light bump animation: re-trigger is-in
      try {
        dup.el.classList.remove("is-in");
        // Force reflow so transition replays
        // eslint-disable-next-line no-unused-expressions
        dup.el.offsetHeight;
        dup.el.classList.add("is-in");
      } catch (e) {}
      if (opts.withSound) playPing(tone);
      return dup;
    }

    var id = ++idSeq;
    var ms = typeof opts.ms === "number" ? opts.ms : 3200;
    var sticky = !!opts.sticky;
    var el = buildToast(opts, id);

    var entry = {
      id: id,
      el: el,
      opts: opts,
      count: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      ms: ms,
      _dismissed: false,
      _timer: null
    };
    entry.dismiss = makeDismiss(entry);

    container.appendChild(el);
    stack.push(entry);

    // Animate in
    requestAnimationFrame(function () {
      el.classList.add("is-in");
    });

    // Click handlers
    var actionBtn = el.querySelector('[data-role="action"]');
    var closeBtn = el.querySelector('[data-role="close"]');
    if (actionBtn && opts.action && typeof opts.action.onClick === "function") {
      actionBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        try { opts.action.onClick(ev, entry); } catch (e) {}
        entry.dismiss();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        entry.dismiss();
      });
    }
    // Whole-toast click dismisses non-sticky toasts (but skip clicks on inner buttons)
    if (!sticky) {
      el.addEventListener("click", function (ev) {
        // If user clicked the inner action button, its own handler already fired and stopped propagation.
        if (ev.target && ev.target.closest && ev.target.closest('button[data-role]')) return;
        entry.dismiss();
      });
    }

    // Auto-dismiss
    if (!sticky) {
      entry._timer = setTimeout(entry.dismiss, ms);
    }

    if (opts.withSound) playPing(tone);

    // Cap visible at MAX_VISIBLE — slide off the oldest non-sticky.
    enforceCap();

    return entry;
  }

  function enforceCap() {
    if (stack.length <= MAX_VISIBLE) return;
    // Prefer to drop the oldest non-sticky first
    for (var i = 0; i < stack.length && stack.length > MAX_VISIBLE; i++) {
      var entry = stack[i];
      if (!entry.opts.sticky && !entry._dismissed) {
        entry.dismiss();
      }
    }
    // If still over (all sticky), force-drop the oldest sticky.
    while (stack.length > MAX_VISIBLE) {
      var oldest = stack.shift();
      if (oldest && oldest.el && oldest.el.parentNode) {
        oldest.el.parentNode.removeChild(oldest.el);
      }
    }
  }

  // ─── Convenience helpers ─────────────────────────────────────────────
  function shards(amount, source) {
    return push({
      icon: "diamond",
      title: "+" + amount + " shards",
      sub: source || "earned",
      tone: "shards",
      ms: 2800
    });
  }
  function shardEarned(amount, source) {
    return shards(amount, source);
  }
  function achievement(def) {
    return push({
      icon: (def && def.icon) || "trophy",
      title: (def && def.title) || "Achievement unlocked",
      sub: ((def && def.tier) || "").toUpperCase() + " · " + ((def && def.desc) || ""),
      tone: "achievement",
      ms: 4800
    });
  }

  function dismiss(id) {
    var target = null;
    if (id && typeof id === "object" && id.dismiss) {
      // Allow callers to pass the entry returned by push()
      target = id;
    } else {
      var nid = Number(id);
      for (var i = 0; i < stack.length; i++) {
        if (stack[i].id === nid) { target = stack[i]; break; }
      }
    }
    if (target && !target._dismissed) target.dismiss();
  }

  function dismissAll() {
    // Snapshot — dismiss() splices stack
    var snap = stack.slice();
    for (var i = 0; i < snap.length; i++) {
      try { snap[i].dismiss(); } catch (e) {}
    }
  }

  function getActiveCount() { return stack.length; }

  // Defer until DOM ready so document.body exists
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  root.MrMacsToast = {
    // Original API (preserved)
    push: push,
    shards: shards,
    achievement: achievement,
    // New API
    shardEarned: shardEarned,
    dismiss: dismiss,
    dismissAll: dismissAll,
    getActiveCount: getActiveCount
  };
})(typeof window !== "undefined" ? window : this);
