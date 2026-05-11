/* Mr. Mac's Arcade — End-Screen Recap Module
 *
 * Renders an "Unlocked This Run" achievement recap on any game's end screen.
 * Addresses UX Walkthrough Recommendation #8.
 *
 * Usage:
 *   // On game init:
 *   MrMacsEndRecap.startTracking();
 *
 *   // On game end, pass your end-screen container:
 *   MrMacsEndRecap.render(document.getElementById("end-screen"));
 *
 *   // On new run start:
 *   MrMacsEndRecap.reset();
 *   MrMacsEndRecap.startTracking();
 *
 * Depends on: arcade-profile.js (window.MrMacsProfile) — optional; degrades
 * gracefully if not present.
 *
 * All class names are prefixed `mer-` to avoid collision with game styles.
 */

(function (root) {
  "use strict";

  // Idempotent load guard
  if (root.MrMacsEndRecap) return;

  // ─── Constants ───────────────────────────────────────────────────────────────

  var STYLE_ID   = "arcade-end-recap-styles";
  var MAX_SHOW   = 5;

  /** Tier → left-border color */
  var TIER_COLORS = {
    bronze:    "#cd7f32",
    silver:    "#b0b8c1",
    gold:      "#f5c518",
    legendary: "#a855f7"
  };

  /** CSS injected once into the document head */
  var STYLES = [
    ".mer-recap {",
    "  box-sizing: border-box;",
    "  margin: 1.25rem 0;",
    "  padding: 1rem 1.125rem;",
    "  background: #1a1a2e;",
    "  border: 2px solid #cd7f32;",
    "  border-radius: 8px;",
    "  font-family: inherit;",
    "}",
    ".mer-recap-title {",
    "  margin: 0 0 0.75rem;",
    "  font-family: 'Fraunces', Georgia, serif;",
    "  font-size: 1.05rem;",
    "  font-weight: 700;",
    "  color: #f5c518;",
    "  letter-spacing: 0.02em;",
    "}",
    ".mer-recap-list {",
    "  list-style: none;",
    "  margin: 0;",
    "  padding: 0;",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 0.5rem;",
    "}",
    ".mer-recap-item {",
    "  display: flex;",
    "  align-items: flex-start;",
    "  gap: 0.625rem;",
    "  padding: 0.5rem 0.625rem;",
    "  background: #0f0f1a;",
    "  border-radius: 5px;",
    "  border-left: 4px solid #cd7f32;",
    "}",
    ".mer-recap-item[data-tier='silver']    { border-left-color: #b0b8c1; }",
    ".mer-recap-item[data-tier='gold']      { border-left-color: #f5c518; }",
    ".mer-recap-item[data-tier='legendary'] { border-left-color: #a855f7; }",
    ".mer-recap-icon {",
    "  flex-shrink: 0;",
    "  font-size: 1.25rem;",
    "  line-height: 1.3;",
    "}",
    ".mer-recap-text {",
    "  display: flex;",
    "  flex-direction: column;",
    "  gap: 0.15rem;",
    "}",
    ".mer-recap-text strong {",
    "  font-size: 0.875rem;",
    "  color: #e8e8f0;",
    "  font-weight: 700;",
    "}",
    ".mer-recap-desc {",
    "  font-size: 0.775rem;",
    "  color: #9090b0;",
    "  line-height: 1.4;",
    "}",
    /* Slide-in animation (skipped in reduced-motion) */
    "@keyframes mer-slidein {",
    "  from { opacity: 0; transform: translateY(8px); }",
    "  to   { opacity: 1; transform: translateY(0); }",
    "}",
    "@media (prefers-reduced-motion: no-preference) {",
    "  .mer-recap-item {",
    "    animation: mer-slidein 0.28s ease both;",
    "}",
    "  .mer-recap-item:nth-child(2) { animation-delay: 0.06s; }",
    "  .mer-recap-item:nth-child(3) { animation-delay: 0.12s; }",
    "  .mer-recap-item:nth-child(4) { animation-delay: 0.18s; }",
    "  .mer-recap-item:nth-child(5) { animation-delay: 0.24s; }",
    "}",
    /* SHARE BUTTON — wires to MrMacsScreenshot for "Share This Run" */
    ".mer-share-btn {",
    "  display: inline-flex; align-items: center; gap: 8px;",
    "  margin-top: 12px;",
    "  padding: 10px 18px;",
    "  background: linear-gradient(135deg, #5de0f0, #3aa7c2);",
    "  color: #04060f;",
    "  border: 0;",
    "  border-radius: 8px;",
    "  font: 800 13px/1 'Inter', sans-serif;",
    "  cursor: pointer;",
    "  letter-spacing: 0.02em;",
    "  transition: transform 150ms, box-shadow 150ms;",
    "  box-shadow: 0 6px 16px rgba(93, 224, 240, 0.25);",
    "}",
    ".mer-share-btn:hover, .mer-share-btn:focus-visible {",
    "  transform: translateY(-1px);",
    "  box-shadow: 0 10px 24px rgba(93, 224, 240, 0.4);",
    "  outline: none;",
    "}",
    ".mer-share-btn > span:first-child { font-size: 16px; }"
  ].join("\n");

  // ─── Internal state ───────────────────────────────────────────────────────────

  /** @type {Array<{id: string, def: object, unlockedAt: number}>} */
  var _unlocked   = [];
  var _tracking   = false;
  var _handler    = null;  // the bound listener currently subscribed to MrMacsProfile

  /** Simple event bus for MrMacsEndRecap itself */
  var _listeners  = {};

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function _injectStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id   = STYLE_ID;
    style.textContent = STYLES;
    (document.head || document.documentElement).appendChild(style);
  }

  /** Emit an event on the module's own tiny bus. */
  function _emit(eventName, detail) {
    if (!_listeners[eventName]) return;
    var copy = [];
    _listeners[eventName].forEach(function (h) { copy.push(h); });
    for (var i = 0; i < copy.length; i++) {
      try { copy[i]({ type: eventName, detail: detail }); } catch (e) { /* swallow */ }
    }
  }

  /** Safely read MrMacsProfile — returns null on any failure. */
  function _profile() {
    try {
      return (root.MrMacsProfile && typeof root.MrMacsProfile.on === "function")
        ? root.MrMacsProfile
        : null;
    } catch (e) {
      return null;
    }
  }

  /** True when prefers-reduced-motion is active. */
  function _reducedMotion() {
    try {
      return (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (e) {
      return false;
    }
  }

  /** Build a single <li> element for one unlock entry. */
  function _buildItem(entry) {
    var def  = entry.def  || {};
    var tier = def.tier   || "bronze";
    var icon = def.icon   || "🏅";
    var title = def.title || entry.id;
    var desc  = def.desc  || "";

    var li = document.createElement("li");
    li.className        = "mer-recap-item";
    li.setAttribute("data-tier", tier);

    var iconSpan = document.createElement("span");
    iconSpan.className   = "mer-recap-icon";
    iconSpan.textContent = icon;

    var textSpan = document.createElement("span");
    textSpan.className   = "mer-recap-text";

    var strong = document.createElement("strong");
    strong.textContent   = title;

    var descSpan = document.createElement("span");
    descSpan.className   = "mer-recap-desc";
    descSpan.textContent = desc;

    textSpan.appendChild(strong);
    if (desc) textSpan.appendChild(descSpan);
    li.appendChild(iconSpan);
    li.appendChild(textSpan);

    return li;
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  var MrMacsEndRecap = {

    /**
     * Manually track an achievement unlock during gameplay.
     * Call this if the game fires its own unlock logic outside MrMacsProfile.
     *
     * @param {string} achievementId
     */
    track: function (achievementId) {
      if (!achievementId) return;
      // Deduplicate
      for (var i = 0; i < _unlocked.length; i++) {
        if (_unlocked[i].id === achievementId) return;
      }
      var def = null;
      try {
        var p = _profile();
        if (p && p.ACHIEVEMENTS) {
          for (var j = 0; j < p.ACHIEVEMENTS.length; j++) {
            if (p.ACHIEVEMENTS[j].id === achievementId) {
              def = p.ACHIEVEMENTS[j];
              break;
            }
          }
        }
      } catch (e) { /* ignore */ }

      var entry = { id: achievementId, def: def || {}, unlockedAt: Date.now() };
      _unlocked.push(entry);
      _emit("track", entry);
    },

    /**
     * Returns the list of achievements unlocked during the current tracking
     * session, in chronological order (oldest first).
     *
     * @returns {Array<{id: string, def: object, unlockedAt: number}>}
     */
    getUnlocked: function () {
      return _unlocked.slice();
    },

    /**
     * Clear the current run's unlock list. Call at the start of a new run
     * before calling startTracking().
     */
    reset: function () {
      _unlocked = [];
      _emit("reset", null);
    },

    /**
     * Subscribe to MrMacsProfile's "achievement:unlock" event so that any
     * achievement earned during gameplay is automatically captured.
     * Safe to call multiple times — only one listener is registered at a time.
     */
    startTracking: function () {
      if (_tracking) return;
      var p = _profile();
      if (!p) return;   // MrMacsProfile not available; manual track() still works

      _handler = function (evt) {
        try {
          var detail = evt.detail || {};
          if (!detail.id) return;
          // Deduplicate
          for (var i = 0; i < _unlocked.length; i++) {
            if (_unlocked[i].id === detail.id) return;
          }
          var entry = {
            id:         detail.id,
            def:        detail.def || {},
            unlockedAt: detail.unlockedAt || Date.now()
          };
          _unlocked.push(entry);
          _emit("track", entry);
        } catch (e) { /* swallow */ }
      };

      try {
        p.on("achievement:unlock", _handler);
        _tracking = true;
      } catch (e) {
        _handler  = null;
      }
    },

    /**
     * Unsubscribe from MrMacsProfile's "achievement:unlock" event.
     * Call when the game is torn down or on game-over before reset().
     */
    stopTracking: function () {
      if (!_tracking) return;
      try {
        var p = _profile();
        if (p && _handler) {
          p.off("achievement:unlock", _handler);
        }
      } catch (e) { /* swallow */ }
      _handler  = null;
      _tracking = false;
    },

    /**
     * Render the "Unlocked This Run" recap into the given container element.
     * Shows up to MAX_SHOW most-recent unlocks.
     * Renders nothing and returns silently if there are no unlocks.
     *
     * @param {HTMLElement} container  — Element to append the recap section into.
     * @param {object}      [opts]     — Reserved for future options.
     */
    render: function (container, opts) {
      if (!container || typeof container.appendChild !== "function") return;
      if (_unlocked.length === 0) return;

      _injectStyles();

      // Take the last MAX_SHOW entries (most-recently unlocked)
      var entries = _unlocked.slice(-MAX_SHOW);

      var wrap = document.createElement("div");
      wrap.className = "mer-recap";

      var h3 = document.createElement("h3");
      h3.className   = "mer-recap-title";
      h3.textContent = "🏆 Unlocked This Run"; // 🏆

      var ul = document.createElement("ul");
      ul.className   = "mer-recap-list";

      // In reduced-motion mode, strip animations by forcing them off via
      // inline style on each item (the CSS @media already handles it, but
      // we also clear the animation-delay so there's no stagger flash).
      var noAnim = _reducedMotion();

      for (var i = 0; i < entries.length; i++) {
        var li = _buildItem(entries[i]);
        if (noAnim) {
          li.style.animation     = "none";
          li.style.animationDelay = "0s";
        }
        ul.appendChild(li);
      }

      wrap.appendChild(h3);
      wrap.appendChild(ul);

      // SHARE BUTTON — wired to MrMacsScreenshot.showShareModal so the
      // player can save a 1080x1080 run-summary image. Fallback to
      // captureAndDownload if showShareModal isn't supported. Silently
      // hidden if screenshot module didn't load.
      if (root.MrMacsScreenshot && (root.MrMacsScreenshot.showShareModal || root.MrMacsScreenshot.captureAndDownload)) {
        var shareBtn = document.createElement("button");
        shareBtn.type = "button";
        shareBtn.className = "mer-share-btn";
        shareBtn.innerHTML = '<span>📸</span> Share This Run';
        shareBtn.addEventListener("click", function () {
          var meta = (typeof opts === "object" && opts) || {};
          try {
            if (root.MrMacsScreenshot.showShareModal) {
              root.MrMacsScreenshot.showShareModal({
                gameTitle: meta.gameTitle || document.title.replace(/\s*—.*$/, "").trim(),
                score: meta.score, accuracy: meta.accuracy, duration: meta.duration,
                unlocks: entries
              });
            } else {
              root.MrMacsScreenshot.captureAndDownload({
                gameTitle: meta.gameTitle || document.title,
                score: meta.score
              });
            }
          } catch (e) {}
        });
        wrap.appendChild(shareBtn);
      }

      container.appendChild(wrap);

      _emit("render", { count: entries.length });
    },

    // ─── Module-level event bus ─────────────────────────────────────────────

    /**
     * Subscribe to a MrMacsEndRecap module event.
     * Events: "track", "reset", "render"
     *
     * @param {string}   event
     * @param {function} handler  — called with { type, detail }
     */
    on: function (event, handler) {
      if (typeof handler !== "function") return;
      if (!_listeners[event]) _listeners[event] = new Set();
      _listeners[event].add(handler);
    },

    /**
     * Unsubscribe from a MrMacsEndRecap module event.
     *
     * @param {string}   event
     * @param {function} handler
     */
    off: function (event, handler) {
      if (_listeners[event]) _listeners[event]["delete"](handler);
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────────

  root.MrMacsEndRecap = MrMacsEndRecap;

}(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this));
