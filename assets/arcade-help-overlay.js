/* ─────────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · arcade-help-overlay.js
   ─────────────────────────────────────────────────────────────────────────
   Shared "How to Play" static reference overlay for any game's setup screen.

   UX rec #7 — distinct from arcade-tutorial.js (interactive step-by-step).
   This is a modal reference card: goal, controls table, tips, scholar note.

   Public API: window.MrMacsHelpOverlay
     .register(gameId, helpData)         → void
     .show(gameId)                       → void
     .hide()                             → void
     .mountButton(container, gameId, opts) → { unmount }
     .on(event, handler)                 → void
     .off(event, handler)                → void

   helpData shape:
     {
       title:    string,           // defaults to "How to Play"
       goal:     string,           // one-sentence objective
       controls: [{ key, action }],
       tips:     string[],
       scholar:  string            // one sentence about scholar pickups
     }

   z-index: 9500 (above gameplay, same level as scholar review modal).
   CSS prefix: "mho-".
   Self-contained styles. Works without MrMacsToast / MrMacsProfile.
   Idempotent module load.
   ───────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";

  if (root.MrMacsHelpOverlay) return; // idempotent

  var STYLE_ID = "mho-styles";
  var OVERLAY_ID = "mho-overlay-root";

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

  // ─── Registry ─────────────────────────────────────────────────────────
  var registry = {}; // { [gameId]: helpData }

  // ─── Event emitter ────────────────────────────────────────────────────
  var listeners = {};

  function on(event, handler) {
    if (typeof handler !== "function") return;
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }

  function off(event, handler) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (fn) { return fn !== handler; });
  }

  function emit(event, detail) {
    var fns = listeners[event] || [];
    var payload = { type: event, detail: detail || {} };
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](payload); } catch (e) { /* isolate */ }
    }
  }

  // ─── Style injection ──────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var css = [
      /* Backdrop */
      ".mho-backdrop {",
      "  position: fixed; inset: 0;",
      "  z-index: 9500;",
      "  background: rgba(4, 6, 14, 0.82);",
      "  display: flex; align-items: center; justify-content: center;",
      "  padding: 16px;",
      "  opacity: 0;",
      "  transition: opacity 0.22s ease;",
      "  -webkit-backdrop-filter: blur(4px) saturate(1.1);",
      "  backdrop-filter: blur(4px) saturate(1.1);",
      "}",
      ".mho-backdrop.mho-visible { opacity: 1; }",

      /* Dialog */
      ".mho-dialog {",
      "  position: relative;",
      "  width: 100%; max-width: 540px;",
      "  max-height: 85vh; overflow-y: auto;",
      "  background: linear-gradient(170deg, rgba(13, 17, 27, 0.97), rgba(8, 11, 20, 0.99));",
      "  border: 1px solid rgba(245, 196, 81, 0.32);",
      "  border-top: 3px solid rgba(245, 196, 81, 0.75);",
      "  border-radius: 18px;",
      "  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.60), 0 0 40px rgba(245, 196, 81, 0.08);",
      "  color: #e8ecf5;",
      "  font-family: inherit;",
      "  padding: 0 0 28px;",
      "  transform: translateY(14px) scale(0.97);",
      "  transition: transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.12), opacity 0.22s ease;",
      "  opacity: 0;",
      "}",
      ".mho-backdrop.mho-visible .mho-dialog {",
      "  transform: translateY(0) scale(1);",
      "  opacity: 1;",
      "}",

      /* Scrollbar styling (webkit) */
      ".mho-dialog::-webkit-scrollbar { width: 6px; }",
      ".mho-dialog::-webkit-scrollbar-track { background: transparent; }",
      ".mho-dialog::-webkit-scrollbar-thumb {",
      "  background: rgba(245, 196, 81, 0.22);",
      "  border-radius: 999px;",
      "}",

      /* Header */
      ".mho-header {",
      "  display: flex; align-items: center; justify-content: space-between;",
      "  padding: 20px 24px 0;",
      "  border-bottom: 1px solid rgba(245, 196, 81, 0.14);",
      "  padding-bottom: 16px;",
      "  position: sticky; top: 0;",
      "  background: linear-gradient(170deg, rgba(13, 17, 27, 0.99), rgba(8, 11, 20, 0.99));",
      "  border-radius: 18px 18px 0 0;",
      "  z-index: 2;",
      "}",
      ".mho-title {",
      "  font-family: 'Fraunces', 'Georgia', serif;",
      "  font-weight: 600; font-style: italic;",
      "  font-size: 20px;",
      "  color: #f5c451;",
      "  line-height: 1.2;",
      "  letter-spacing: -0.01em;",
      "}",
      ".mho-close-btn {",
      "  appearance: none; -webkit-appearance: none;",
      "  background: rgba(255, 255, 255, 0.05);",
      "  border: 1px solid rgba(255, 255, 255, 0.10);",
      "  border-radius: 9px;",
      "  color: #7a88a3;",
      "  width: 34px; height: 34px;",
      "  display: grid; place-items: center;",
      "  font-size: 20px; line-height: 1;",
      "  cursor: pointer;",
      "  flex-shrink: 0;",
      "  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;",
      "}",
      ".mho-close-btn:hover, .mho-close-btn:focus-visible {",
      "  background: rgba(255, 255, 255, 0.09);",
      "  border-color: rgba(255, 255, 255, 0.22);",
      "  color: #e8ecf5;",
      "  outline: none;",
      "}",

      /* Body sections */
      ".mho-body { padding: 20px 24px 0; display: flex; flex-direction: column; gap: 20px; }",

      /* Goal callout */
      ".mho-goal {",
      "  padding: 12px 16px;",
      "  background: rgba(245, 196, 81, 0.07);",
      "  border-left: 3px solid rgba(245, 196, 81, 0.70);",
      "  border-radius: 0 10px 10px 0;",
      "  color: #dcc96e;",
      "  font-size: 14px; line-height: 1.5;",
      "  font-style: italic;",
      "}",
      ".mho-goal-label {",
      "  display: block;",
      "  font-family: 'JetBrains Mono', 'Courier New', monospace;",
      "  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;",
      "  color: rgba(245, 196, 81, 0.60);",
      "  margin-bottom: 5px;",
      "  font-style: normal;",
      "}",

      /* Section headings */
      ".mho-section-heading {",
      "  font-family: 'JetBrains Mono', 'Courier New', monospace;",
      "  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;",
      "  color: rgba(245, 196, 81, 0.55);",
      "  margin: 0 0 10px;",
      "}",

      /* Controls table */
      ".mho-controls-table {",
      "  width: 100%; border-collapse: collapse;",
      "}",
      ".mho-controls-table tr + tr td { border-top: 1px solid rgba(255, 255, 255, 0.055); }",
      ".mho-controls-table td {",
      "  padding: 8px 6px;",
      "  font-size: 13px; line-height: 1.4;",
      "  vertical-align: middle;",
      "}",
      ".mho-controls-table td:first-child {",
      "  white-space: nowrap; width: 46%;",
      "}",
      ".mho-key {",
      "  display: inline-block;",
      "  padding: 3px 8px;",
      "  background: rgba(255, 255, 255, 0.07);",
      "  border: 1px solid rgba(255, 255, 255, 0.14);",
      "  border-radius: 6px;",
      "  font-family: 'JetBrains Mono', 'Courier New', monospace;",
      "  font-size: 11px; letter-spacing: 0.04em;",
      "  color: #c6cfe6;",
      "}",
      ".mho-action { color: #9aa3bb; font-size: 13px; }",

      /* Tips */
      ".mho-tips-list {",
      "  list-style: none; margin: 0; padding: 0;",
      "  display: flex; flex-direction: column; gap: 8px;",
      "}",
      ".mho-tips-list li {",
      "  display: flex; gap: 10px;",
      "  font-size: 13px; line-height: 1.5; color: #9aa3bb;",
      "}",
      ".mho-tip-bullet {",
      "  flex-shrink: 0; margin-top: 2px;",
      "  width: 16px; height: 16px;",
      "  background: rgba(122, 240, 255, 0.12);",
      "  border-radius: 50%;",
      "  display: grid; place-items: center;",
      "  color: #7af0ff;",
      "  font-size: 9px; font-weight: 700;",
      "}",

      /* Scholar note */
      ".mho-scholar {",
      "  padding: 12px 16px;",
      "  background: rgba(122, 240, 255, 0.06);",
      "  border-left: 3px solid rgba(122, 240, 255, 0.50);",
      "  border-radius: 0 10px 10px 0;",
      "  color: #7ac8d4;",
      "  font-size: 13px; line-height: 1.5;",
      "}",
      ".mho-scholar-label {",
      "  display: block;",
      "  font-family: 'JetBrains Mono', 'Courier New', monospace;",
      "  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;",
      "  color: rgba(122, 240, 255, 0.55);",
      "  margin-bottom: 5px;",
      "}",

      /* How to Play trigger button */
      ".mho-how-btn {",
      "  display: inline-flex; align-items: center; gap: 7px;",
      "  padding: 9px 18px;",
      "  background: rgba(13, 17, 27, 0.72);",
      "  border: 1px solid rgba(184, 146, 255, 0.28);",
      "  border-radius: 10px;",
      "  color: #b892ff;",
      "  font-family: 'JetBrains Mono', 'Courier New', monospace;",
      "  font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase;",
      "  cursor: pointer;",
      "  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;",
      "  white-space: nowrap;",
      "  appearance: none; -webkit-appearance: none;",
      "  user-select: none; -webkit-user-select: none;",
      "}",
      ".mho-how-btn:hover, .mho-how-btn:focus-visible {",
      "  background: rgba(184, 146, 255, 0.10);",
      "  border-color: rgba(184, 146, 255, 0.50);",
      "  color: #d4b8ff;",
      "  outline: none;",
      "}",
      ".mho-how-btn:active { background: rgba(184, 146, 255, 0.16); }",
      ".mho-how-icon { width: 14px; height: 14px; flex-shrink: 0; opacity: 0.85; }",

      /* Reduced-motion overrides */
      "@media (prefers-reduced-motion: reduce) {",
      "  .mho-backdrop { transition: opacity 0.10s ease; }",
      "  .mho-dialog { transition: opacity 0.10s ease; transform: none !important; }",
      "  .mho-how-btn { transition: none; }",
      "  .mho-close-btn { transition: none; }",
      "}",

      "@media (max-width: 600px) {",
      "  .mho-dialog { border-radius: 14px; }",
      "  .mho-header { padding: 16px 18px 14px; }",
      "  .mho-body { padding: 16px 18px 0; gap: 16px; }",
      "  .mho-title { font-size: 17px; }",
      "}",

      "@media print { .mho-backdrop { display: none !important; } }"
    ].join("\n");

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  // ─── DOM helpers ──────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;";
    });
  }

  var ICON_HELP = '<svg class="mho-how-icon" viewBox="0 0 14 14" fill="none" '
    + 'aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
    + '<circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/>'
    + '<path d="M5.5 5.5a1.5 1.5 0 0 1 2.9.5c0 1-1.4 1.5-1.4 2.5" '
    + 'stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
    + '<circle cx="7" cy="10.5" r="0.6" fill="currentColor"/>'
    + '</svg>';

  // ─── Overlay DOM management ───────────────────────────────────────────
  var backdropEl = null;
  var activeGameId = null;
  var keydownHandler = null;

  function getOrCreateBackdrop() {
    if (backdropEl && document.body && document.body.contains(backdropEl)) return backdropEl;
    backdropEl = document.createElement("div");
    backdropEl.id = OVERLAY_ID;
    backdropEl.className = "mho-backdrop";
    backdropEl.setAttribute("role", "dialog");
    backdropEl.setAttribute("aria-modal", "true");
    backdropEl.setAttribute("aria-label", "How to Play");

    // Backdrop click closes
    backdropEl.addEventListener("click", function (e) {
      if (e.target === backdropEl) hide();
    });

    document.body.appendChild(backdropEl);
    return backdropEl;
  }

  function buildDialogContent(helpData) {
    var title = (helpData && helpData.title) ? helpData.title : "How to Play";
    var goal = (helpData && helpData.goal) ? helpData.goal : "";
    var controls = (helpData && Array.isArray(helpData.controls)) ? helpData.controls : [];
    var tips = (helpData && Array.isArray(helpData.tips)) ? helpData.tips : [];
    var scholar = (helpData && helpData.scholar) ? helpData.scholar : "";

    // Header
    var header = document.createElement("div");
    header.className = "mho-header";
    var titleEl = document.createElement("h2");
    titleEl.className = "mho-title";
    titleEl.textContent = title;
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "mho-close-btn";
    closeBtn.setAttribute("aria-label", "Close how to play");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", hide);
    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // Body
    var body = document.createElement("div");
    body.className = "mho-body";

    // Goal
    if (goal) {
      var goalDiv = document.createElement("div");
      goalDiv.className = "mho-goal";
      goalDiv.innerHTML = '<span class="mho-goal-label">Objective</span>'
        + escapeHtml(goal);
      body.appendChild(goalDiv);
    }

    // Controls table
    if (controls.length) {
      var controlsSection = document.createElement("div");
      var controlsHeading = document.createElement("p");
      controlsHeading.className = "mho-section-heading";
      controlsHeading.textContent = "Controls";
      controlsSection.appendChild(controlsHeading);

      var table = document.createElement("table");
      table.className = "mho-controls-table";
      table.setAttribute("role", "table");
      table.setAttribute("aria-label", "Game controls");

      for (var i = 0; i < controls.length; i++) {
        var row = controls[i];
        var tr = document.createElement("tr");
        var tdKey = document.createElement("td");
        tdKey.innerHTML = '<span class="mho-key">' + escapeHtml(row.key || "") + "</span>";
        var tdAction = document.createElement("td");
        tdAction.className = "mho-action";
        tdAction.textContent = row.action || "";
        tr.appendChild(tdKey);
        tr.appendChild(tdAction);
        table.appendChild(tr);
      }
      controlsSection.appendChild(table);
      body.appendChild(controlsSection);
    }

    // Tips
    if (tips.length) {
      var tipsSection = document.createElement("div");
      var tipsHeading = document.createElement("p");
      tipsHeading.className = "mho-section-heading";
      tipsHeading.textContent = "Tips";
      tipsSection.appendChild(tipsHeading);

      var ul = document.createElement("ul");
      ul.className = "mho-tips-list";
      for (var j = 0; j < tips.length; j++) {
        var li = document.createElement("li");
        li.innerHTML = '<span class="mho-tip-bullet" aria-hidden="true">'
          + (j + 1)
          + '</span><span>'
          + escapeHtml(tips[j])
          + '</span>';
        ul.appendChild(li);
      }
      tipsSection.appendChild(ul);
      body.appendChild(tipsSection);
    }

    // Scholar explainer
    if (scholar) {
      var scholarDiv = document.createElement("div");
      scholarDiv.className = "mho-scholar";
      scholarDiv.innerHTML = '<span class="mho-scholar-label">Scholar Pickup</span>'
        + escapeHtml(scholar);
      body.appendChild(scholarDiv);
    }

    // Assemble dialog
    var dialog = document.createElement("div");
    dialog.className = "mho-dialog";
    dialog.setAttribute("tabindex", "-1");
    dialog.appendChild(header);
    dialog.appendChild(body);

    return { dialog: dialog, closeBtn: closeBtn };
  }

  // ─── Public: register ─────────────────────────────────────────────────
  /**
   * Register help content for a game.
   * @param {string} gameId
   * @param {object} helpData  { title, goal, controls, tips, scholar }
   */
  function register(gameId, helpData) {
    if (!gameId || typeof gameId !== "string") {
      console.warn("[MrMacsHelpOverlay] register: gameId must be a non-empty string");
      return;
    }
    registry[gameId] = helpData || {};
    emit("register", { gameId: gameId });
  }

  // ─── Public: show ─────────────────────────────────────────────────────
  /**
   * Show the help overlay for the given gameId.
   * @param {string} gameId
   */
  function show(gameId) {
    if (!gameId || !registry[gameId]) {
      console.warn("[MrMacsHelpOverlay] show: gameId not registered:", gameId);
      return;
    }
    // Try to read player name for a11y label (defensive)
    var playerName = "";
    try {
      if (root.MrMacsProfile && typeof root.MrMacsProfile.getName === "function") {
        playerName = root.MrMacsProfile.getName() || "";
      }
    } catch (e) { /* MrMacsProfile absent or erroring — ignore */ }

    injectStyles();
    var backdrop = getOrCreateBackdrop();

    // Clear prior content
    backdrop.innerHTML = "";
    activeGameId = gameId;

    var built = buildDialogContent(registry[gameId]);
    backdrop.appendChild(built.dialog);

    // Update a11y label
    var ariaLabel = "How to Play";
    if (playerName) ariaLabel += " — " + playerName;
    backdrop.setAttribute("aria-label", ariaLabel);

    // Keyboard: Escape closes
    if (keydownHandler) document.removeEventListener("keydown", keydownHandler);
    keydownHandler = function (e) {
      if (e.key === "Escape" || e.key === "Esc") hide();
    };
    document.addEventListener("keydown", keydownHandler);

    // Show (next frame so transition fires)
    requestAnimationFrame(function () {
      backdrop.classList.add("mho-visible");
      // Focus the dialog for keyboard users
      try { built.dialog.focus(); } catch (ex) {}
    });

    emit("show", { gameId: gameId });
  }

  // ─── Public: hide ─────────────────────────────────────────────────────
  /**
   * Hide the help overlay.
   */
  function hide() {
    if (!backdropEl) return;
    backdropEl.classList.remove("mho-visible");
    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
    }
    var closedId = activeGameId;
    activeGameId = null;

    // Remove from DOM after transition
    var delay = prefersReduced ? 120 : 260;
    var capturedBackdrop = backdropEl;
    setTimeout(function () {
      if (capturedBackdrop && capturedBackdrop.parentNode) {
        capturedBackdrop.parentNode.removeChild(capturedBackdrop);
      }
      if (backdropEl === capturedBackdrop) backdropEl = null;
    }, delay);

    emit("hide", { gameId: closedId });
  }

  // ─── Public: mountButton ──────────────────────────────────────────────
  /**
   * Mount a "How to Play" button on a container that opens the overlay on click.
   *
   * @param {Element} container  DOM element to append the button into.
   * @param {string}  gameId     Must match a registered gameId.
   * @param {object}  [opts]
   *   @param {string} [opts.label="How to Play"]  Button label.
   * @returns {{ unmount: Function }}
   */
  function mountButton(container, gameId, opts) {
    if (!container || typeof container.appendChild !== "function") {
      console.warn("[MrMacsHelpOverlay] mountButton: invalid container");
      return { unmount: function () {} };
    }
    if (!gameId || typeof gameId !== "string") {
      console.warn("[MrMacsHelpOverlay] mountButton: gameId must be a non-empty string");
      return { unmount: function () {} };
    }
    injectStyles();

    opts = opts || {};
    var label = (typeof opts.label === "string" && opts.label) ? opts.label : "How to Play";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mho-how-btn";
    btn.setAttribute("aria-label", label);
    btn.innerHTML = ICON_HELP + '<span class="mho-how-label">' + escapeHtml(label) + "</span>";

    btn.addEventListener("click", function () {
      show(gameId);
    });

    container.appendChild(btn);

    function unmount() {
      if (btn.parentNode) btn.parentNode.removeChild(btn);
    }

    return { unmount: unmount };
  }

  // ─── Public API ───────────────────────────────────────────────────────
  root.MrMacsHelpOverlay = {
    register: register,
    show: show,
    hide: hide,
    mountButton: mountButton,
    on: on,
    off: off
  };

})(typeof window !== "undefined" ? window : this);
