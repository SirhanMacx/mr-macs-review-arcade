/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · ephemeral toast notification system
   ──────────────────────────────────────────────────────────────────────
   Listens to MrMacsProfile events and surfaces lightweight, dismissible
   toasts at the bottom-right of the viewport. Zero dependencies, vanilla
   DOM, works on every page that loads arcade-profile.js + this script.

   Public API:
     window.MrMacsToast.push({ icon, title, sub, tone, ms })
     window.MrMacsToast.shards(amount, source)         // convenience
     window.MrMacsToast.achievement(def)               // convenience

   Auto-wires to:
     - profile:create           → "Welcome, <name>"
     - wallet:change (delta>0)  → "+N shards · <source>"
     - achievement:unlock       → "<title> unlocked"
     - streak:advance (>1)      → "<n>-day streak — keep it going"
   ─────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsToast) return;

  var stack = [];
  var container = null;
  var initialized = false;

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
}\
.arcade-toast .at-icon .ic { width: 20px; height: 20px; vertical-align: 0; }\
.arcade-toast .at-text { flex: 1; min-width: 0; line-height: 1.2; }\
.arcade-toast .at-title {\
  font-family: "Fraunces", serif;\
  font-weight: 540; font-style: italic;\
  font-size: 14.5px;\
  color: #f5f7fb;\
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\
}\
.arcade-toast .at-sub {\
  margin-top: 2px;\
  font-family: "JetBrains Mono", monospace;\
  font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase;\
  color: #9aa3bb;\
  font-variant-numeric: tabular-nums;\
}\
.arcade-toast[data-tone="shards"] { border-color: rgba(122, 240, 255, .35); box-shadow: 0 18px 44px rgba(0,0,0,.45), 0 0 24px rgba(122, 240, 255, .14); }\
.arcade-toast[data-tone="shards"] .at-icon { color: #7af0ff; background: linear-gradient(135deg, rgba(122,240,255,.18), rgba(122,240,255,.06)); }\
.arcade-toast[data-tone="achievement"] { border-color: rgba(255, 124, 200, .55); box-shadow: 0 18px 44px rgba(0,0,0,.45), 0 0 28px rgba(255, 124, 200, .18); }\
.arcade-toast[data-tone="achievement"] .at-icon { color: #ff7cc8; background: linear-gradient(135deg, rgba(255,124,200,.24), rgba(184,146,255,.10)); }\
.arcade-toast[data-tone="streak"] { border-color: rgba(255, 142, 111, .45); }\
.arcade-toast[data-tone="streak"] .at-icon { color: #ff8e6f; }\
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
    if (container && document.body.contains(container)) return container;
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

  function iconMarkup(spec) {
    if (!spec) return "";
    if (typeof spec !== "string") return "";
    if (root.MrMacsIcons) {
      // Treat spec as a name if it matches; otherwise as an emoji
      if (root.MrMacsIcons.has && root.MrMacsIcons.has(spec)) return root.MrMacsIcons.svg(spec);
      var fromE = root.MrMacsIcons.fromEmoji && root.MrMacsIcons.fromEmoji(spec);
      if (fromE) return fromE;
    }
    // Fallback: textual spec, escape minimally
    return spec.replace(/[<>&]/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;";
    });
  }

  function push(opts) {
    if (!initialized) initialize();
    if (!container) ensureContainer();
    opts = opts || {};
    var ms = typeof opts.ms === "number" ? opts.ms : 3200;
    var tone = opts.tone || "default";
    var el = document.createElement("button");
    el.type = "button";
    el.className = "arcade-toast";
    el.setAttribute("data-tone", tone);
    el.setAttribute("aria-label", (opts.title || "") + " — " + (opts.sub || "") + " — tap to dismiss");
    el.innerHTML =
      '<span class="at-icon" aria-hidden="true">' + iconMarkup(opts.icon || "sparkles") + '</span>' +
      '<span class="at-text">' +
        '<span class="at-title"></span>' +
        (opts.sub ? '<span class="at-sub"></span>' : "") +
      '</span>';
    // textContent for safety
    var titleEl = el.querySelector(".at-title");
    if (titleEl) titleEl.textContent = opts.title || "";
    var subEl = el.querySelector(".at-sub");
    if (subEl) subEl.textContent = opts.sub || "";
    container.appendChild(el);
    stack.push(el);
    // Animate in
    requestAnimationFrame(function () { el.classList.add("is-in"); });
    var dismiss = function () {
      el.classList.add("is-out");
      el.classList.remove("is-in");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        var ix = stack.indexOf(el);
        if (ix !== -1) stack.splice(ix, 1);
      }, 380);
    };
    el.addEventListener("click", dismiss);
    setTimeout(dismiss, ms);
    // Cap stack at 4 visible
    while (stack.length > 4) {
      var oldest = stack.shift();
      if (oldest && oldest.parentNode) oldest.parentNode.removeChild(oldest);
    }
    return el;
  }

  function shards(amount, source) {
    return push({
      icon: "diamond",
      title: "+" + amount + " shards",
      sub: source || "earned",
      tone: "shards",
      ms: 2800
    });
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

  // Defer until DOM ready so document.body exists
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }

  root.MrMacsToast = {
    push: push,
    shards: shards,
    achievement: achievement
  };
})(typeof window !== "undefined" ? window : this);
