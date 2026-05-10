/* ─────────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · arcade-game-helpers.js
   ─────────────────────────────────────────────────────────────────────────
   Shared helpers for any game's setup screen.

   UX recs implemented:
     #10 — "Exit Arcade" button: mountExitButton()
     #10 — Sound toggle helper:  mountSoundToggle()

   Public API: window.MrMacsGameHelpers
     .mountExitButton(container, opts)   → { unmount }
     .mountSoundToggle(container, opts)  → { unmount, setState }
     .autoMount()                        → void
     .on(event, handler)                 → void
     .off(event, handler)                → void

   Self-contained CSS — all class names prefixed "mgh-".
   Works even if MrMacsToast / MrMacsIcons / MrMacsProfile are absent.
   Idempotent: safe to load multiple times on the same page.
   ───────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";

  if (root.MrMacsGameHelpers) return; // idempotent

  // ─── Reduced-motion detection ──────────────────────────────────────────
  var prefersReduced = false;
  (function () {
    try {
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      prefersReduced = mq.matches;
      var onChange = function (e) { prefersReduced = e.matches; };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (e) { prefersReduced = false; }
  })();

  // ─── Event emitter ────────────────────────────────────────────────────
  var listeners = {};

  function on(event, handler) {
    if (typeof handler !== "function") return;
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }

  function off(event, handler) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (fn) {
      return fn !== handler;
    });
  }

  function emit(event, detail) {
    var fns = listeners[event] || [];
    var payload = { type: event, detail: detail || {} };
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](payload); } catch (e) { /* isolate bad handlers */ }
    }
  }

  // ─── Style injection ──────────────────────────────────────────────────
  var STYLE_ID = "mgh-styles";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      /* Exit button */
      ".mgh-exit-btn {",
      "  display: inline-flex; align-items: center; gap: 7px;",
      "  padding: 9px 18px;",
      "  background: rgba(13, 17, 27, 0.72);",
      "  border: 1px solid rgba(245, 196, 81, 0.30);",
      "  border-radius: 10px;",
      "  color: #c9ad60;",
      "  font-family: 'JetBrains Mono', 'Courier New', monospace;",
      "  font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase;",
      "  text-decoration: none;",
      "  cursor: pointer;",
      "  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;",
      "  white-space: nowrap;",
      "  user-select: none; -webkit-user-select: none;",
      "}",
      ".mgh-exit-btn:hover, .mgh-exit-btn:focus-visible {",
      "  background: rgba(245, 196, 81, 0.10);",
      "  border-color: rgba(245, 196, 81, 0.55);",
      "  color: #ffd884;",
      "  outline: none;",
      "}",
      ".mgh-exit-btn:active {",
      "  background: rgba(245, 196, 81, 0.16);",
      "}",
      ".mgh-exit-icon {",
      "  display: inline-block; width: 14px; height: 14px;",
      "  flex-shrink: 0; opacity: 0.80;",
      "}",

      /* Sound toggle */
      ".mgh-sound-btn {",
      "  display: inline-flex; align-items: center; gap: 7px;",
      "  padding: 9px 18px;",
      "  background: rgba(13, 17, 27, 0.72);",
      "  border: 1px solid rgba(122, 240, 255, 0.24);",
      "  border-radius: 10px;",
      "  color: #7ac8d4;",
      "  font-family: 'JetBrains Mono', 'Courier New', monospace;",
      "  font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase;",
      "  cursor: pointer;",
      "  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;",
      "  white-space: nowrap;",
      "  appearance: none; -webkit-appearance: none;",
      "  user-select: none; -webkit-user-select: none;",
      "}",
      ".mgh-sound-btn:hover, .mgh-sound-btn:focus-visible {",
      "  background: rgba(122, 240, 255, 0.10);",
      "  border-color: rgba(122, 240, 255, 0.45);",
      "  color: #7af0ff;",
      "  outline: none;",
      "}",
      ".mgh-sound-btn:active {",
      "  background: rgba(122, 240, 255, 0.16);",
      "}",
      ".mgh-sound-btn[data-sound-on='false'] {",
      "  border-color: rgba(154, 163, 187, 0.22);",
      "  color: #5e687e;",
      "}",
      ".mgh-sound-btn[data-sound-on='false']:hover, .mgh-sound-btn[data-sound-on='false']:focus-visible {",
      "  border-color: rgba(154, 163, 187, 0.40);",
      "  color: #9aa3bb;",
      "}",
      ".mgh-sound-icon {",
      "  display: inline-block; width: 14px; height: 14px;",
      "  flex-shrink: 0; opacity: 0.85;",
      "}",

      /* Reduced-motion: kill transitions */
      "@media (prefers-reduced-motion: reduce) {",
      "  .mgh-exit-btn, .mgh-sound-btn { transition: none; }",
      "}",

      "@media print { .mgh-exit-btn, .mgh-sound-btn { display: none !important; } }"
    ].join("\n");

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  // ─── SVG icons (inline, no external dep) ─────────────────────────────
  // Door-exit arrow icon (chevron left + rectangle)
  var ICON_EXIT = '<svg class="mgh-exit-icon" viewBox="0 0 14 14" fill="none" '
    + 'aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M5 2H2.5A.5.5 0 0 0 2 2.5v9a.5.5 0 0 0 .5.5H5" '
    + 'stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>'
    + '<path d="M9 4.5 11.5 7 9 9.5M11.5 7H5.5" '
    + 'stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>';

  var ICON_SOUND_ON = '<svg class="mgh-sound-icon" viewBox="0 0 14 14" fill="none" '
    + 'aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M3 5H1.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5H3l3 2.5V2.5L3 5Z" '
    + 'fill="currentColor"/>'
    + '<path d="M9 4.5c.8.5 1.5 1.35 1.5 2.5S9.8 9 9 9.5" '
    + 'stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
    + '<path d="M10.5 2.5C12 3.5 13 5.1 13 7s-1 3.5-2.5 4.5" '
    + 'stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
    + '</svg>';

  var ICON_SOUND_OFF = '<svg class="mgh-sound-icon" viewBox="0 0 14 14" fill="none" '
    + 'aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M3 5H1.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5H3l3 2.5V2.5L3 5Z" '
    + 'fill="currentColor"/>'
    + '<path d="M9 5l3 4M12 5l-3 4" '
    + 'stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
    + '</svg>';

  // ─── mountExitButton ──────────────────────────────────────────────────
  /**
   * Mount an "Exit Arcade" anchor link on the given container element.
   *
   * @param {Element} container  DOM element to append the button into.
   * @param {object}  [opts]
   *   @param {string} [opts.href="../../index.html"]  Link destination.
   *   @param {string} [opts.label="Exit Arcade"]      Button text.
   * @returns {{ unmount: Function }}
   */
  function mountExitButton(container, opts) {
    if (!container || typeof container.appendChild !== "function") {
      console.warn("[MrMacsGameHelpers] mountExitButton: invalid container");
      return { unmount: function () {} };
    }
    injectStyles();

    opts = opts || {};
    var href = (typeof opts.href === "string" && opts.href) ? opts.href : "../../index.html";
    var label = (typeof opts.label === "string" && opts.label) ? opts.label : "Exit Arcade";

    var a = document.createElement("a");
    a.href = href;
    a.className = "mgh-exit-btn";
    a.setAttribute("aria-label", label);
    a.innerHTML = ICON_EXIT + '<span class="mgh-exit-label">' + escapeHtml(label) + "</span>";

    a.addEventListener("click", function () {
      emit("exit-arcade", { href: href, label: label });
    });

    container.appendChild(a);

    function unmount() {
      if (a.parentNode) a.parentNode.removeChild(a);
    }

    return { unmount: unmount };
  }

  // ─── mountSoundToggle ─────────────────────────────────────────────────
  /**
   * Mount a sound-toggle button on the given container.
   * The module tracks label/icon state internally; the game owns actual sound state.
   *
   * @param {Element} container  DOM element to append the button into.
   * @param {object}  [opts]
   *   @param {boolean}  [opts.initialOn=true]  Initial sound state.
   *   @param {Function} [opts.onToggle]         Callback(isOn: bool) on each click.
   * @returns {{ unmount: Function, setState: Function }}
   */
  function mountSoundToggle(container, opts) {
    if (!container || typeof container.appendChild !== "function") {
      console.warn("[MrMacsGameHelpers] mountSoundToggle: invalid container");
      return { unmount: function () {}, setState: function () {} };
    }
    injectStyles();

    opts = opts || {};
    var isOn = opts.initialOn !== false; // default true
    var onToggle = (typeof opts.onToggle === "function") ? opts.onToggle : null;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mgh-sound-btn";

    function syncLabel() {
      btn.setAttribute("data-sound-on", String(isOn));
      btn.setAttribute("aria-pressed", String(isOn));
      btn.setAttribute("aria-label", isOn ? "Sound on — click to mute" : "Sound off — click to unmute");
      btn.innerHTML = (isOn ? ICON_SOUND_ON : ICON_SOUND_OFF)
        + '<span class="mgh-sound-label">' + (isOn ? "Sound On" : "Sound Off") + "</span>";
    }

    syncLabel();

    btn.addEventListener("click", function () {
      isOn = !isOn;
      syncLabel();
      emit("sound-toggle", { isOn: isOn });
      if (onToggle) {
        try { onToggle(isOn); } catch (e) { /* isolate */ }
      }
    });

    container.appendChild(btn);

    /**
     * Programmatically update the toggle state without triggering onToggle.
     * @param {boolean} on
     */
    function setState(on) {
      isOn = !!on;
      syncLabel();
    }

    function unmount() {
      if (btn.parentNode) btn.parentNode.removeChild(btn);
    }

    return { unmount: unmount, setState: setState };
  }

  // ─── autoMount ───────────────────────────────────────────────────────
  /**
   * Scan the document for elements with data attributes and auto-wire them.
   *   [data-arcade-exit]          → converted to Exit Arcade link
   *   [data-arcade-sound-toggle]  → converted to sound toggle button
   *
   * data-arcade-exit may carry optional attrs:
   *   data-arcade-exit-href   — overrides default href
   *   data-arcade-exit-label  — overrides default label
   *
   * data-arcade-sound-toggle may carry:
   *   data-arcade-sound-initial="false" — starts muted
   */
  function autoMount() {
    injectStyles();

    // Exit buttons
    var exitEls = document.querySelectorAll("[data-arcade-exit]");
    for (var i = 0; i < exitEls.length; i++) {
      var el = exitEls[i];
      if (el.getAttribute("data-mgh-wired")) continue;
      el.setAttribute("data-mgh-wired", "1");
      var exitHref = el.getAttribute("data-arcade-exit-href") || "../../index.html";
      var exitLabel = el.getAttribute("data-arcade-exit-label") || "Exit Arcade";
      // Replace the element's text content + href in-place (preserve existing node)
      if (el.tagName === "A") {
        el.href = exitHref;
      }
      el.classList.add("mgh-exit-btn");
      el.setAttribute("aria-label", exitLabel);
      el.innerHTML = ICON_EXIT + '<span class="mgh-exit-label">' + escapeHtml(exitLabel) + "</span>";
      el.addEventListener("click", function () {
        emit("exit-arcade", { href: exitHref, label: exitLabel });
      });
    }

    // Sound toggles
    var soundEls = document.querySelectorAll("[data-arcade-sound-toggle]");
    for (var j = 0; j < soundEls.length; j++) {
      var sel = soundEls[j];
      if (sel.getAttribute("data-mgh-wired")) continue;
      sel.setAttribute("data-mgh-wired", "1");
      var initialAttr = sel.getAttribute("data-arcade-sound-initial");
      var initialOn = initialAttr !== "false";
      (function (btn, on) {
        var isOn = on;
        function syncLabel() {
          btn.setAttribute("data-sound-on", String(isOn));
          btn.setAttribute("aria-pressed", String(isOn));
          btn.setAttribute("aria-label", isOn ? "Sound on — click to mute" : "Sound off — click to unmute");
          btn.innerHTML = (isOn ? ICON_SOUND_ON : ICON_SOUND_OFF)
            + '<span class="mgh-sound-label">' + (isOn ? "Sound On" : "Sound Off") + "</span>";
          btn.className = "mgh-sound-btn";
        }
        syncLabel();
        btn.addEventListener("click", function () {
          isOn = !isOn;
          syncLabel();
          emit("sound-toggle", { isOn: isOn, source: "autoMount" });
        });
      })(sel, initialOn);
    }
  }

  // ─── Utility ─────────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
    });
  }

  // ─── Auto-run autoMount on DOMContentLoaded if any data-attrs present ─
  function domReady(fn) {
    if (document.readyState !== "loading") { fn(); }
    else { document.addEventListener("DOMContentLoaded", fn, { once: true }); }
  }

  domReady(function () {
    // Only auto-scan if any wirable elements exist — avoids needless style injection.
    if (
      document.querySelector("[data-arcade-exit]") ||
      document.querySelector("[data-arcade-sound-toggle]")
    ) {
      autoMount();
    }
  });

  // ─── Public API ───────────────────────────────────────────────────────
  root.MrMacsGameHelpers = {
    mountExitButton: mountExitButton,
    mountSoundToggle: mountSoundToggle,
    autoMount: autoMount,
    on: on,
    off: off
  };

})(typeof window !== "undefined" ? window : this);
