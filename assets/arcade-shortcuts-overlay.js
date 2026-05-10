/* ─────────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · arcade-shortcuts-overlay.js
   ─────────────────────────────────────────────────────────────────────────
   Power-user keyboard shortcuts modal.  Press "?" anywhere on the hub
   to see every registered shortcut.  Games can add their own via
   window.MrMacsShortcutsOverlay.register(category, shortcut).

   Public API: window.MrMacsShortcutsOverlay
     .show()                              → void
     .hide()                              → void
     .toggle()                            → void
     .register(category, shortcut)        → void
       shortcut: { keys: string[], action: string }
     .mountButton(container)              → { unmount }
     .bindGlobalShortcut()               → void
     .on(event, handler)                 → void
     .off(event, handler)                → void

   Events emitted: "show", "hide"

   z-index: 9500
   CSS prefix: "mso-"
   Self-contained styles.  No external deps.  Idempotent load.
   ───────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";

  if (root.MrMacsShortcutsOverlay) return; // idempotent

  var STYLE_ID   = "arcade-shortcuts-overlay-styles";
  var OVERLAY_ID = "mso-overlay-root";

  // ─── Reduced-motion detection ──────────────────────────────────────────
  var prefersReduced =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ─── Event emitter (tiny) ─────────────────────────────────────────────
  var listeners = {};
  function emit(event) {
    var handlers = listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) handlers[i]();
  }
  function on(event, handler) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }
  function off(event, handler) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (h) { return h !== handler; });
  }

  // ─── Shortcut registry ────────────────────────────────────────────────
  // categoryMap preserves insertion order (ES5-compat: use ordered array too)
  var categoryMap  = {};
  var categoryOrder = [];

  function register(category, shortcut) {
    if (!categoryMap[category]) {
      categoryMap[category] = [];
      categoryOrder.push(category);
    }
    categoryMap[category].push(shortcut);
    // If overlay is already open, re-render it
    if (isVisible()) renderBody();
  }

  // ─── Default shortcuts (auto-registered at load) ──────────────────────
  var DEFAULTS = {
    "Hub Navigation": [
      { keys: ["/"],                                           action: "Focus search" },
      { keys: ["?"],                                           action: "Show shortcuts" },
      { keys: ["Esc"],                                         action: "Close modal / drawer" },
      { keys: ["G", "L"],                                      action: "Jump to library" },
      { keys: ["G", "P"],                                      action: "Jump to profile drawer" },
      { keys: ["G", "D"],                                      action: "Open daily challenge" },
      { keys: ["G", "S"],                                      action: "Open shop" },
      { keys: ["R"],                                           action: "Random game" }
    ],
    "Profile & Settings": [
      { keys: ["P"],  action: "Open profile drawer" },
      { keys: ["S"],  action: "Open settings" }
    ],
    "Easter Eggs": [
      { keys: ["↑","↑","↓","↓","←","→","←","→","B","A"],     action: "Konami code (200 shards)" },
      { keys: ["↑","↑","↓","↓","←","→","←","→","D"],         action: "Open dev tools" }
    ],
    "Common Game Shortcuts": [
      { keys: ["Space", "Enter"],   action: "Primary action / fire" },
      { keys: ["Esc", "P"],         action: "Pause" },
      { keys: ["Arrows", "WASD"],   action: "Move" },
      { keys: ["1-5"],              action: "Activate power-ups" }
    ]
  };

  (function seedDefaults() {
    var cats = Object.keys(DEFAULTS);
    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i];
      var shortcuts = DEFAULTS[cat];
      for (var j = 0; j < shortcuts.length; j++) {
        register(cat, shortcuts[j]);
      }
    }
  }());

  // ─── CSS injection ────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id   = STYLE_ID;
    style.textContent = [
      "/* Mr. Mac's Arcade — Shortcuts Overlay */",

      ".mso-backdrop {",
      "  position: fixed; inset: 0;",
      "  background: rgba(10,8,20,0.72);",
      "  backdrop-filter: blur(3px);",
      "  z-index: 9500;",
      "  display: flex; align-items: center; justify-content: center;",
      "  opacity: 0; transition: opacity 0.18s ease;",
      "  padding: 16px; box-sizing: border-box;",
      "}",
      ".mso-backdrop.mso-visible { opacity: 1; }",

      ".mso-dialog {",
      "  background: #12101e;",
      "  border: 1px solid #5a3f00;",
      "  border-radius: 12px;",
      "  box-shadow: 0 0 0 1px #c89020 inset, 0 24px 60px rgba(0,0,0,0.7);",
      "  width: 100%; max-width: 640px;",
      "  max-height: 85vh; overflow-y: auto;",
      "  display: flex; flex-direction: column;",
      "  transform: translateY(12px); transition: transform 0.18s ease;",
      "}",
      ".mso-backdrop.mso-visible .mso-dialog { transform: translateY(0); }",

      ".mso-header {",
      "  display: flex; align-items: center; justify-content: space-between;",
      "  padding: 18px 22px 14px;",
      "  border-bottom: 1px solid #2e2540;",
      "  position: sticky; top: 0; background: #12101e; z-index: 1;",
      "}",
      ".mso-title {",
      "  margin: 0; font-family: 'Orbitron', 'Share Tech Mono', monospace;",
      "  font-size: 1.1rem; font-weight: 700;",
      "  color: #c89020; letter-spacing: 0.08em; text-transform: uppercase;",
      "}",
      ".mso-close {",
      "  background: none; border: 1px solid #3a3050; border-radius: 6px;",
      "  color: #8b7db0; cursor: pointer; font-size: 1.1rem;",
      "  width: 30px; height: 30px; line-height: 1;",
      "  display: flex; align-items: center; justify-content: center;",
      "  transition: background 0.12s, color 0.12s;",
      "}",
      ".mso-close:hover { background: #2a2040; color: #c89020; }",

      ".mso-body { padding: 14px 22px 22px; }",

      ".mso-category { margin-bottom: 20px; }",
      ".mso-category-title {",
      "  font-family: 'Orbitron', 'Share Tech Mono', monospace;",
      "  font-size: 0.68rem; font-weight: 600; letter-spacing: 0.12em;",
      "  text-transform: uppercase; color: #7a6a9a;",
      "  margin: 0 0 8px; padding-bottom: 4px;",
      "  border-bottom: 1px solid #1e1a30;",
      "}",
      ".mso-table {",
      "  width: 100%; border-collapse: collapse;",
      "}",
      ".mso-table tr:hover td { background: rgba(200,144,32,0.05); }",
      ".mso-table td {",
      "  padding: 5px 6px; vertical-align: middle;",
      "  border-bottom: 1px solid #1a1628;",
      "}",
      ".mso-table td:first-child { width: 45%; }",
      ".mso-table td:last-child  { color: #d0c8ec; font-size: 0.87rem; }",

      ".mso-keys {",
      "  display: flex; flex-wrap: wrap; gap: 4px; align-items: center;",
      "}",
      ".mso-sep { color: #4a3d6a; font-size: 0.72rem; margin: 0 2px; }",

      "kbd.mso-key {",
      "  display: inline-block;",
      "  background: linear-gradient(180deg, #2a2340 0%, #1c1830 100%);",
      "  border: 1px solid #3e355a;",
      "  border-bottom: 2px solid #5a3f00;",
      "  border-radius: 4px;",
      "  color: #c89020; font-family: 'Share Tech Mono', 'Courier New', monospace;",
      "  font-size: 0.75rem; font-style: normal; font-weight: 600;",
      "  line-height: 1; padding: 3px 6px;",
      "  box-shadow: 0 1px 0 #c89020, inset 0 1px 0 rgba(255,255,255,0.06);",
      "  white-space: nowrap;",
      "}",

      /* floating ? button */
      ".mso-fab {",
      "  position: fixed; bottom: 22px; right: 22px;",
      "  width: 40px; height: 40px; border-radius: 50%;",
      "  background: #1c1830;",
      "  border: 1px solid #5a3f00;",
      "  box-shadow: 0 0 0 1px #c89020 inset, 0 4px 12px rgba(0,0,0,0.5);",
      "  color: #c89020;",
      "  font-family: 'Orbitron', monospace; font-size: 1.1rem; font-weight: 700;",
      "  cursor: pointer; z-index: 9400;",
      "  display: flex; align-items: center; justify-content: center;",
      "  transition: transform 0.15s, box-shadow 0.15s;",
      "}",
      ".mso-fab:hover {",
      "  transform: scale(1.1);",
      "  box-shadow: 0 0 0 1px #c89020 inset, 0 0 14px rgba(200,144,32,0.5), 0 4px 14px rgba(0,0,0,0.55);",
      "}",

      /* Scrollbar */
      ".mso-dialog::-webkit-scrollbar { width: 6px; }",
      ".mso-dialog::-webkit-scrollbar-track { background: #0e0c1a; }",
      ".mso-dialog::-webkit-scrollbar-thumb { background: #3e305a; border-radius: 3px; }",

      /* Reduced motion */
      "@media (prefers-reduced-motion: reduce) {",
      "  .mso-backdrop, .mso-dialog, .mso-fab { transition: none !important; }",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  // ─── DOM helpers ──────────────────────────────────────────────────────
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k === "className") node.className = attrs[k];
        else if (k === "textContent") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      for (var j = 0; j < children.length; j++) {
        if (children[j]) node.appendChild(children[j]);
      }
    }
    return node;
  }

  function keycapsRow(keys) {
    var row = el("span", { className: "mso-keys" });
    for (var i = 0; i < keys.length; i++) {
      if (i > 0) row.appendChild(el("span", { className: "mso-sep", textContent: "+" }));
      row.appendChild(el("kbd", { className: "mso-key", textContent: keys[i] }));
    }
    return row;
  }

  // ─── Overlay DOM management ───────────────────────────────────────────
  var backdropEl = null;

  function ensureDOM() {
    if (document.getElementById(OVERLAY_ID)) return;
    injectStyles();

    backdropEl = el("div", { className: "mso-backdrop", id: OVERLAY_ID, role: "dialog",
                              "aria-modal": "true", "aria-labelledby": "mso-title" });

    var dialog = el("div", { className: "mso-dialog" });

    // Header
    var header    = el("div", { className: "mso-header" });
    var titleEl   = el("h2",  { className: "mso-title", id: "mso-title", textContent: "Keyboard Shortcuts" });
    var closeBtn  = el("button", { className: "mso-close", "aria-label": "Close shortcuts", textContent: "✕" });
    closeBtn.addEventListener("click", hide);
    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    var body = el("div", { className: "mso-body", id: "mso-body" });

    dialog.appendChild(header);
    dialog.appendChild(body);
    backdropEl.appendChild(dialog);
    document.body.appendChild(backdropEl);

    // Close on backdrop click (not dialog click)
    backdropEl.addEventListener("click", function (e) {
      if (e.target === backdropEl) hide();
    });
  }

  function renderBody() {
    var body = document.getElementById("mso-body");
    if (!body) return;
    body.innerHTML = "";

    for (var ci = 0; ci < categoryOrder.length; ci++) {
      var cat      = categoryOrder[ci];
      var items    = categoryMap[cat];
      var section  = el("div", { className: "mso-category" });
      var catTitle = el("h3",  { className: "mso-category-title", textContent: cat });
      section.appendChild(catTitle);

      var table = el("table", { className: "mso-table", role: "presentation" });
      var tbody = el("tbody");
      for (var si = 0; si < items.length; si++) {
        var item    = items[si];
        var row     = el("tr");
        var tdKeys  = el("td");
        var tdAct   = el("td", { textContent: item.action });
        tdKeys.appendChild(keycapsRow(item.keys));
        row.appendChild(tdKeys);
        row.appendChild(tdAct);
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      section.appendChild(table);
      body.appendChild(section);
    }
  }

  // ─── Show / hide / toggle ─────────────────────────────────────────────
  function isVisible() {
    var el = document.getElementById(OVERLAY_ID);
    return el ? el.classList.contains("mso-visible") : false;
  }

  function show() {
    ensureDOM();
    renderBody();
    var overlay = document.getElementById(OVERLAY_ID);
    overlay.style.display = "flex";
    // Force reflow for CSS transition
    overlay.offsetHeight; // eslint-disable-line no-unused-expressions
    overlay.classList.add("mso-visible");
    overlay.setAttribute("aria-hidden", "false");
    // Trap focus on close button
    var closeBtn = overlay.querySelector(".mso-close");
    if (closeBtn) closeBtn.focus();
    emit("show");
  }

  function hide() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    overlay.classList.remove("mso-visible");
    overlay.setAttribute("aria-hidden", "true");
    if (prefersReduced) {
      overlay.style.display = "none";
    } else {
      overlay.addEventListener("transitionend", function handler() {
        overlay.style.display = "none";
        overlay.removeEventListener("transitionend", handler);
      }, { once: true });
    }
    emit("hide");
  }

  function toggle() {
    if (isVisible()) hide(); else show();
  }

  // ─── Global "?" keybinding ────────────────────────────────────────────
  var globalBound = false;

  function inputFocused() {
    var active = document.activeElement;
    if (!active) return false;
    var tag = active.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (active.isContentEditable) return true;
    return false;
  }

  function bindGlobalShortcut() {
    if (globalBound) return;
    globalBound = true;
    document.addEventListener("keydown", function (e) {
      if (inputFocused()) return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === "Escape" && isVisible()) {
        e.preventDefault();
        hide();
      }
    });
  }

  // ─── Floating "?" button ──────────────────────────────────────────────
  function mountButton(container) {
    injectStyles();
    var btn = el("button", { className: "mso-fab", "aria-label": "Keyboard shortcuts", textContent: "?" });
    btn.addEventListener("click", toggle);
    container.appendChild(btn);
    return {
      unmount: function () {
        btn.removeEventListener("click", toggle);
        if (btn.parentNode) btn.parentNode.removeChild(btn);
      }
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────
  root.MrMacsShortcutsOverlay = {
    show:              show,
    hide:              hide,
    toggle:            toggle,
    register:          register,
    mountButton:       mountButton,
    bindGlobalShortcut: bindGlobalShortcut,
    on:                on,
    off:               off
  };

}(window));
