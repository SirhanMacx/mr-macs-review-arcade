/* ============================================================================
 * arcade-keyboard-remap.js
 * Mr. Mac's Review Arcade — Keyboard customization layer + settings UI.
 *
 * Public surface: window.MrMacsKeyboard
 *   DEFAULTS, getBinding(action), bind(action, key), unbind(action, key),
 *   resetToDefaults(), matches(action, event), mountSettingsUi(container),
 *   on(event, handler), off(event, handler).
 *
 * Storage: localStorage key "mr-macs-arcade-keybindings-v1".
 * Idempotent: re-loading the script does nothing if MrMacsKeyboard already exists.
 * Self-contained CSS injected once with id "arcade-keyboard-remap-styles".
 * ==========================================================================*/
(function (root) {
  "use strict";
  if (root.MrMacsKeyboard) return;

  /* -- Defaults ------------------------------------------------------------ */
  var DEFAULTS = {
    "move-left":  ["ArrowLeft", "a"],
    "move-right": ["ArrowRight", "d"],
    "move-up":    ["ArrowUp", "w"],
    "move-down":  ["ArrowDown", "s"],
    "fire":       [" ", "Enter"],
    "pause":      ["Escape", "p"],
    "undo":       ["u"],
    "reset":      ["r"],
    "powerup-1":  ["1"],
    "powerup-2":  ["2"],
    "powerup-3":  ["3"],
    "powerup-4":  ["4"],
    "powerup-5":  ["5"]
  };

  var ACTION_LABELS = {
    "move-left":  "Move Left",
    "move-right": "Move Right",
    "move-up":    "Move Up",
    "move-down":  "Move Down",
    "fire":       "Fire / Confirm",
    "pause":      "Pause",
    "undo":       "Undo",
    "reset":      "Reset",
    "powerup-1":  "Power-up 1",
    "powerup-2":  "Power-up 2",
    "powerup-3":  "Power-up 3",
    "powerup-4":  "Power-up 4",
    "powerup-5":  "Power-up 5"
  };

  var STORAGE_KEY = "mr-macs-arcade-keybindings-v1";
  var STYLE_ID = "arcade-keyboard-remap-styles";

  // Reserved / browser-protected / modifier keys — cannot be bound.
  var RESERVED_KEYS = {
    "Shift": 1, "Control": 1, "Alt": 1, "Meta": 1,
    "OS": 1, "ContextMenu": 1, "CapsLock": 1, "NumLock": 1, "ScrollLock": 1,
    "Tab": 1
  };
  function isFunctionKey(k) {
    if (typeof k !== "string") return false;
    if (k.length < 2 || k.length > 3) return false;
    if (k.charAt(0) !== "F") return false;
    var n = parseInt(k.slice(1), 10);
    return !isNaN(n) && n >= 1 && n <= 24;
  }
  function isReservedKey(k) {
    if (k == null) return true;
    if (typeof k !== "string") return true;
    if (RESERVED_KEYS.hasOwnProperty(k)) return true;
    if (isFunctionKey(k)) return true;
    return false;
  }

  /* -- Helpers ------------------------------------------------------------- */
  function shallowCloneArr(a) {
    var out = [];
    for (var i = 0; i < a.length; i++) out.push(a[i]);
    return out;
  }
  function cloneDefaults() {
    var out = {};
    for (var k in DEFAULTS) {
      if (DEFAULTS.hasOwnProperty(k)) out[k] = shallowCloneArr(DEFAULTS[k]);
    }
    return out;
  }
  function normalizeKey(k) {
    // Letter keys are matched case-insensitively; everything else exact.
    if (typeof k !== "string") return k;
    if (k.length === 1 && /[a-zA-Z]/.test(k)) return k.toLowerCase();
    return k;
  }
  function keyDisplay(k) {
    if (k === " ") return "Space";
    if (k === "ArrowLeft") return "←";
    if (k === "ArrowRight") return "→";
    if (k === "ArrowUp") return "↑";
    if (k === "ArrowDown") return "↓";
    if (k === "Escape") return "Esc";
    if (k === "Enter") return "Enter";
    if (typeof k === "string" && k.length === 1) return k.toUpperCase();
    return String(k);
  }

  /* -- State + storage ----------------------------------------------------- */
  var bindings = cloneDefaults();
  var listeners = { bind: [], unbind: [], reset: [] };

  function loadFromStorage() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;
      // Merge over defaults so newly-added actions still get defaults.
      var merged = cloneDefaults();
      for (var action in saved) {
        if (saved.hasOwnProperty(action) && Object.prototype.toString.call(saved[action]) === "[object Array]") {
          // Filter reserved keys (defensive against older saves).
          var clean = [];
          for (var i = 0; i < saved[action].length; i++) {
            if (!isReservedKey(saved[action][i])) clean.push(saved[action][i]);
          }
          merged[action] = clean;
        }
      }
      bindings = merged;
    } catch (e) { /* ignore corrupt storage */ }
  }
  function saveToStorage() {
    try {
      if (root.localStorage) root.localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
    } catch (e) { /* quota / private mode — ignore */ }
  }

  /* -- Event emitter ------------------------------------------------------- */
  function emit(name, payload) {
    var arr = listeners[name];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (e) { /* swallow handler errors */ }
    }
  }
  function on(name, handler) {
    if (!listeners[name]) listeners[name] = [];
    listeners[name].push(handler);
  }
  function off(name, handler) {
    var arr = listeners[name];
    if (!arr) return;
    for (var i = arr.length - 1; i >= 0; i--) if (arr[i] === handler) arr.splice(i, 1);
  }

  /* -- Toast helper -------------------------------------------------------- */
  function toast(msg, kind) {
    if (root.MrMacsToast && typeof root.MrMacsToast.push === "function") {
      try { root.MrMacsToast.push({ title: msg, tone: kind || "info", ms: 2400 }); return; } catch (e) {}
    }
    // No toast lib — silent fallback (the UI message is still visible inline).
  }

  /* -- Public API ---------------------------------------------------------- */
  function getBinding(action) {
    var arr = bindings[action];
    return arr ? shallowCloneArr(arr) : [];
  }

  function bind(action, key) {
    if (!action || !DEFAULTS.hasOwnProperty(action)) return false;
    if (isReservedKey(key)) {
      toast("Key not allowed: " + keyDisplay(key), "warn");
      return false;
    }
    var n = normalizeKey(key);
    // Strip this key from any other action (one key per action).
    var stolenFrom = null;
    for (var other in bindings) {
      if (!bindings.hasOwnProperty(other) || other === action) continue;
      var otherArr = bindings[other];
      for (var j = otherArr.length - 1; j >= 0; j--) {
        if (normalizeKey(otherArr[j]) === n) {
          otherArr.splice(j, 1);
          stolenFrom = other;
        }
      }
    }
    if (!bindings[action]) bindings[action] = [];
    // Avoid duplicate within same action.
    var already = false;
    for (var i = 0; i < bindings[action].length; i++) {
      if (normalizeKey(bindings[action][i]) === n) { already = true; break; }
    }
    if (!already) bindings[action].push(key);
    saveToStorage();
    if (stolenFrom) toast(keyDisplay(key) + " moved from " + (ACTION_LABELS[stolenFrom] || stolenFrom), "info");
    emit("bind", { action: action, key: key, stolenFrom: stolenFrom });
    return true;
  }

  function unbind(action, key) {
    if (!bindings[action]) return false;
    var n = normalizeKey(key);
    var arr = bindings[action];
    var removed = false;
    for (var i = arr.length - 1; i >= 0; i--) {
      if (normalizeKey(arr[i]) === n) { arr.splice(i, 1); removed = true; }
    }
    if (removed) {
      saveToStorage();
      emit("unbind", { action: action, key: key });
    }
    return removed;
  }

  function resetToDefaults() {
    bindings = cloneDefaults();
    saveToStorage();
    emit("reset", {});
  }

  function matches(action, event) {
    if (!event || !bindings[action]) return false;
    var arr = bindings[action];
    var ek = normalizeKey(event.key);
    var ec = event.code; // fallback for layout-specific cases
    for (var i = 0; i < arr.length; i++) {
      var bk = normalizeKey(arr[i]);
      if (bk === ek) return true;
      if (ec && bk === ec) return true;
    }
    return false;
  }

  /* -- Settings UI --------------------------------------------------------- */
  function injectStyles() {
    if (root.document.getElementById(STYLE_ID)) return;
    var style = root.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".kbr-root{font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#e8e2d5;background:#1a1815;border:1px solid #8b6f3a;border-radius:10px;padding:18px;max-width:560px;}",
      ".kbr-title{font-family:Inter,sans-serif;font-weight:700;font-size:18px;letter-spacing:.02em;margin:0 0 4px;color:#f4ecdb;}",
      ".kbr-sub{font-size:12px;color:#a89b80;margin:0 0 14px;}",
      ".kbr-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #3a322a;}",
      ".kbr-row:first-of-type{border-top:none;}",
      ".kbr-label{flex:0 0 130px;font-size:13px;color:#e8e2d5;}",
      ".kbr-chips{flex:1;display:flex;flex-wrap:wrap;gap:6px;align-items:center;}",
      ".kbr-chip{display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;background:#2a241d;color:#f4ecdb;border:1px solid #8b6f3a;border-radius:5px;padding:3px 8px;line-height:1.4;}",
      ".kbr-chip-x{cursor:pointer;color:#a89b80;font-size:11px;border:none;background:transparent;padding:0 0 0 2px;}",
      ".kbr-chip-x:hover{color:#f4ecdb;}",
      ".kbr-empty{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#6b6354;font-style:italic;}",
      ".kbr-btn{font-family:Inter,sans-serif;font-size:12px;background:#2a241d;color:#e8e2d5;border:1px solid #8b6f3a;border-radius:5px;padding:4px 10px;cursor:pointer;transition:background .12s linear,color .12s linear;}",
      ".kbr-btn:hover{background:#3a322a;color:#f4ecdb;}",
      ".kbr-btn-add{padding:3px 8px;font-size:14px;line-height:1;}",
      ".kbr-btn-rebind{margin-left:auto;}",
      ".kbr-footer{display:flex;justify-content:flex-end;margin-top:14px;padding-top:12px;border-top:1px solid #3a322a;}",
      ".kbr-listening{position:fixed;inset:0;background:rgba(10,8,6,0.82);display:flex;align-items:center;justify-content:center;z-index:9999;}",
      ".kbr-listening-card{background:#1a1815;border:1px solid #8b6f3a;border-radius:10px;padding:24px 32px;text-align:center;color:#f4ecdb;font-family:Inter,sans-serif;}",
      ".kbr-listening-title{font-size:14px;color:#a89b80;margin:0 0 8px;letter-spacing:.04em;text-transform:uppercase;}",
      ".kbr-listening-msg{font-size:20px;margin:0 0 6px;color:#f4ecdb;}",
      ".kbr-listening-hint{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#6b6354;margin-top:14px;}",
      "@media (prefers-reduced-motion: reduce){.kbr-btn{transition:none;}}"
    ].join("");
    root.document.head.appendChild(style);
  }

  function mountSettingsUi(container) {
    if (!container || !root.document) return { unmount: function () {}, refresh: function () {} };
    injectStyles();

    var doc = root.document;
    var wrap = doc.createElement("div");
    wrap.className = "kbr-root";

    var listeningOverlay = null;
    var unmounted = false;

    function clear() { while (wrap.firstChild) wrap.removeChild(wrap.firstChild); }

    function buildChip(action, key) {
      var chip = doc.createElement("span");
      chip.className = "kbr-chip";
      chip.appendChild(doc.createTextNode(keyDisplay(key)));
      var x = doc.createElement("button");
      x.type = "button";
      x.className = "kbr-chip-x";
      x.setAttribute("aria-label", "Remove " + keyDisplay(key));
      x.appendChild(doc.createTextNode("✕"));
      x.onclick = function () { unbind(action, key); render(); };
      chip.appendChild(x);
      return chip;
    }

    function startListening(action, mode /* "replace" | "add" */) {
      if (listeningOverlay) return;
      listeningOverlay = doc.createElement("div");
      listeningOverlay.className = "kbr-listening";
      var card = doc.createElement("div");
      card.className = "kbr-listening-card";
      var t = doc.createElement("p");
      t.className = "kbr-listening-title";
      t.appendChild(doc.createTextNode("Rebinding " + (ACTION_LABELS[action] || action)));
      var m = doc.createElement("p");
      m.className = "kbr-listening-msg";
      m.appendChild(doc.createTextNode("Press a key…"));
      var h = doc.createElement("p");
      h.className = "kbr-listening-hint";
      h.appendChild(doc.createTextNode("Press Esc to cancel"));
      card.appendChild(t); card.appendChild(m); card.appendChild(h);
      listeningOverlay.appendChild(card);
      doc.body.appendChild(listeningOverlay);

      function done() {
        doc.removeEventListener("keydown", onKey, true);
        if (listeningOverlay && listeningOverlay.parentNode) {
          listeningOverlay.parentNode.removeChild(listeningOverlay);
        }
        listeningOverlay = null;
      }
      function onKey(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var k = ev.key;
        if (k === "Escape") { done(); render(); return; }
        if (isReservedKey(k)) {
          toast("Key not allowed: " + keyDisplay(k), "warn");
          return; // keep listening
        }
        if (mode === "replace") {
          // Replace the FIRST binding of the action.
          var arr = bindings[action] || [];
          if (arr.length > 0) unbind(action, arr[0]);
          bind(action, k);
        } else {
          bind(action, k);
        }
        done();
        render();
      }
      doc.addEventListener("keydown", onKey, true);
    }

    function render() {
      if (unmounted) return;
      clear();

      var title = doc.createElement("h2");
      title.className = "kbr-title";
      title.appendChild(doc.createTextNode("Keyboard Controls"));
      wrap.appendChild(title);

      var sub = doc.createElement("p");
      sub.className = "kbr-sub";
      sub.appendChild(doc.createTextNode("Customize how you control every game in the arcade."));
      wrap.appendChild(sub);

      var actions = Object.keys(DEFAULTS);
      for (var i = 0; i < actions.length; i++) {
        (function (action) {
          var row = doc.createElement("div");
          row.className = "kbr-row";

          var label = doc.createElement("div");
          label.className = "kbr-label";
          label.appendChild(doc.createTextNode(ACTION_LABELS[action] || action));
          row.appendChild(label);

          var chips = doc.createElement("div");
          chips.className = "kbr-chips";
          var arr = bindings[action] || [];
          if (arr.length === 0) {
            var empty = doc.createElement("span");
            empty.className = "kbr-empty";
            empty.appendChild(doc.createTextNode("(unbound)"));
            chips.appendChild(empty);
          } else {
            for (var j = 0; j < arr.length; j++) chips.appendChild(buildChip(action, arr[j]));
          }
          var addBtn = doc.createElement("button");
          addBtn.type = "button";
          addBtn.className = "kbr-btn kbr-btn-add";
          addBtn.setAttribute("aria-label", "Add binding for " + (ACTION_LABELS[action] || action));
          addBtn.appendChild(doc.createTextNode("+"));
          addBtn.onclick = function () { startListening(action, "add"); };
          chips.appendChild(addBtn);
          row.appendChild(chips);

          var rebind = doc.createElement("button");
          rebind.type = "button";
          rebind.className = "kbr-btn kbr-btn-rebind";
          rebind.appendChild(doc.createTextNode("Rebind"));
          rebind.onclick = function () { startListening(action, "replace"); };
          row.appendChild(rebind);

          wrap.appendChild(row);
        })(actions[i]);
      }

      var footer = doc.createElement("div");
      footer.className = "kbr-footer";
      var resetBtn = doc.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "kbr-btn";
      resetBtn.appendChild(doc.createTextNode("Reset to defaults"));
      resetBtn.onclick = function () { resetToDefaults(); render(); };
      footer.appendChild(resetBtn);
      wrap.appendChild(footer);
    }

    container.appendChild(wrap);
    render();

    return {
      unmount: function () {
        unmounted = true;
        if (listeningOverlay && listeningOverlay.parentNode) {
          listeningOverlay.parentNode.removeChild(listeningOverlay);
          listeningOverlay = null;
        }
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      },
      refresh: render
    };
  }

  /* -- Boot ---------------------------------------------------------------- */
  loadFromStorage();

  root.MrMacsKeyboard = {
    DEFAULTS: DEFAULTS,
    getBinding: getBinding,
    bind: bind,
    unbind: unbind,
    resetToDefaults: resetToDefaults,
    matches: matches,
    mountSettingsUi: mountSettingsUi,
    on: on,
    off: off
  };
})(typeof window !== "undefined" ? window : this);
