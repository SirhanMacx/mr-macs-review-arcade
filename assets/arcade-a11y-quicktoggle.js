/**
 * arcade-a11y-quicktoggle.js  —  Mr. Mac's Review Arcade
 * --------------------------------------------------------
 * API:  MrMacsA11yQuickToggle.mount(container, opts) -> { unmount }
 *
 * Adds a small "⚙ A11y" button to any HUD container.
 * Clicking it opens a compact modal with four accessibility toggles:
 *   • Motion   — Auto | Reduce
 *   • Contrast — Normal | High
 *   • Font     — Default | Dyslexic-friendly
 *   • Colorblind — Off | Protanopia | Deuteranopia | Tritanopia
 *
 * Each toggle calls MrMacsProfile.setSettings({ …partial }) and applies
 * the corresponding body classes immediately:
 *   body.arcade-reduced-motion  (motion === "reduce")
 *   body.contrast-high          (contrast === "high")
 *   body.font-dyslexic          (fontFamily === "dyslexic")
 *   body.cb-protanope           (colorblind === "protanopia")
 *   body.cb-deuteranope         (colorblind === "deuteranopia")
 *   body.cb-tritanope           (colorblind === "tritanopia")
 *
 * Self-contained CSS, all prefixed "maqt-".
 * z-index 9500 (above gameplay).
 * Idempotent guard: only one instance per container.
 *
 * @version 20260510-a11y
 */
(function () {
  "use strict";

  // ── Idempotency guard ──────────────────────────────────────────────────────
  if (window.MrMacsA11yQuickToggle && window.MrMacsA11yQuickToggle._loaded) return;

  // ── Inject self-contained CSS once ─────────────────────────────────────────
  (function injectStyles() {
    if (document.getElementById("maqt-styles")) return;
    var style = document.createElement("style");
    style.id = "maqt-styles";
    style.textContent = [
      /* ── Trigger button ── */
      ".maqt-btn{",
      "  all:unset;",
      "  display:inline-flex;align-items:center;gap:4px;",
      "  padding:3px 8px;border-radius:6px;",
      "  background:rgba(255,255,255,0.12);",
      "  border:1px solid rgba(255,255,255,0.22);",
      "  color:#fff;font-size:11px;font-family:inherit;",
      "  cursor:pointer;white-space:nowrap;",
      "  transition:background .15s;",
      "  -webkit-user-select:none;user-select:none;",
      "}",
      ".maqt-btn:hover{background:rgba(255,255,255,0.22);}",
      ".maqt-btn:focus-visible{outline:2px solid #7df;outline-offset:2px;}",

      /* ── Backdrop ── */
      ".maqt-backdrop{",
      "  position:fixed;inset:0;",
      "  background:rgba(0,0,0,0.55);",
      "  z-index:9499;",
      "  animation:maqt-fade-in .12s ease both;",
      "}",

      /* ── Modal ── */
      ".maqt-modal{",
      "  position:fixed;",
      "  top:50%;left:50%;",
      "  transform:translate(-50%,-50%);",
      "  z-index:9500;",
      "  background:#1a1a2e;",
      "  border:1px solid rgba(255,255,255,0.18);",
      "  border-radius:12px;",
      "  padding:20px 22px 18px;",
      "  min-width:270px;max-width:320px;width:calc(100vw - 32px);",
      "  box-shadow:0 8px 32px rgba(0,0,0,0.7);",
      "  color:#e8e8f0;font-family:inherit;",
      "  animation:maqt-slide-in .14s ease both;",
      "}",

      /* ── Modal header ── */
      ".maqt-header{",
      "  display:flex;align-items:center;justify-content:space-between;",
      "  margin-bottom:14px;",
      "}",
      ".maqt-title{",
      "  font-size:13px;font-weight:700;letter-spacing:.04em;",
      "  text-transform:uppercase;color:#aab;",
      "}",
      ".maqt-close{",
      "  all:unset;cursor:pointer;",
      "  font-size:18px;line-height:1;color:#889;",
      "  padding:2px 5px;border-radius:4px;",
      "  transition:color .12s;",
      "}",
      ".maqt-close:hover{color:#eef;}",
      ".maqt-close:focus-visible{outline:2px solid #7df;outline-offset:2px;}",

      /* ── Rows ── */
      ".maqt-row{",
      "  display:flex;align-items:center;",
      "  justify-content:space-between;",
      "  padding:7px 0;",
      "  border-bottom:1px solid rgba(255,255,255,0.07);",
      "}",
      ".maqt-row:last-child{border-bottom:none;}",
      ".maqt-label{font-size:12px;color:#c8c8d8;min-width:70px;}",

      /* ── Pill toggle strip ── */
      ".maqt-pills{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;}",
      ".maqt-pill{",
      "  all:unset;cursor:pointer;",
      "  font-size:11px;padding:3px 9px;border-radius:20px;",
      "  border:1px solid rgba(255,255,255,0.18);",
      "  color:#9a9ab8;",
      "  transition:background .12s,color .12s,border-color .12s;",
      "  -webkit-user-select:none;user-select:none;",
      "}",
      ".maqt-pill:hover{background:rgba(255,255,255,0.1);color:#dde;}",
      ".maqt-pill[aria-pressed='true']{",
      "  background:rgba(125,220,255,0.2);",
      "  border-color:rgba(125,220,255,0.6);",
      "  color:#7df;font-weight:600;",
      "}",
      ".maqt-pill:focus-visible{outline:2px solid #7df;outline-offset:2px;}",

      /* ── Animations ── */
      "@keyframes maqt-fade-in{from{opacity:0}to{opacity:1}}",
      "@keyframes maqt-slide-in{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}"
    ].join("\n");
    document.head.appendChild(style);
  })();

  // ── Body-class helper ───────────────────────────────────────────────────────
  function applyToBody(settings) {
    var b = document.body;
    if (!b) return;
    b.classList.toggle("arcade-reduced-motion", settings.motion === "reduce");
    b.classList.toggle("contrast-high",         settings.contrast === "high");
    b.classList.toggle("font-dyslexic",         settings.fontFamily === "dyslexic");
    var cbClasses = ["cb-protanope", "cb-deuteranope", "cb-tritanope"];
    cbClasses.forEach(function (c) { b.classList.remove(c); });
    var cbMap = {
      protanopia:   "cb-protanope",
      deuteranopia: "cb-deuteranope",
      tritanopia:   "cb-tritanope"
    };
    if (settings.colorblind && settings.colorblind !== "off") {
      var cls = cbMap[settings.colorblind];
      if (cls) b.classList.add(cls);
    }
  }

  // ── Read current settings (safe, no throws) ────────────────────────────────
  function readSettings() {
    try {
      if (window.MrMacsProfile && typeof window.MrMacsProfile.getSettings === "function") {
        return window.MrMacsProfile.getSettings() || {};
      }
    } catch (e) {}
    return {};
  }

  // ── Persist + apply (safe) ─────────────────────────────────────────────────
  function saveSettings(partial) {
    try {
      if (window.MrMacsProfile && typeof window.MrMacsProfile.setSettings === "function") {
        var full = window.MrMacsProfile.setSettings(partial);
        applyToBody(full);
        return full;
      }
    } catch (e) {}
    // Fallback: apply body classes even if profile not available
    var current = readSettings();
    var merged = Object.assign({}, current, partial);
    applyToBody(merged);
    return merged;
  }

  // ── Build modal DOM ────────────────────────────────────────────────────────
  function buildModal(onClose) {
    var settings = readSettings();

    var backdrop = document.createElement("div");
    backdrop.className = "maqt-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    var modal = document.createElement("div");
    modal.className = "maqt-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Accessibility settings");

    // Header
    var header = document.createElement("div");
    header.className = "maqt-header";

    var title = document.createElement("div");
    title.className = "maqt-title";
    title.textContent = "Accessibility";

    var closeBtn = document.createElement("button");
    closeBtn.className = "maqt-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close accessibility settings");
    closeBtn.textContent = "×"; // ×

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // ── Row builder ──────────────────────────────────────────────────────────
    function addRow(labelText, options, currentKey, onChange) {
      var row = document.createElement("div");
      row.className = "maqt-row";

      var label = document.createElement("span");
      label.className = "maqt-label";
      label.textContent = labelText;
      row.appendChild(label);

      var pills = document.createElement("div");
      pills.className = "maqt-pills";

      options.forEach(function (opt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "maqt-pill";
        btn.textContent = opt.label;
        btn.setAttribute("aria-pressed", String(settings[currentKey] === opt.value));
        btn.dataset.value = opt.value;

        btn.addEventListener("click", function () {
          var newSettings = {};
          newSettings[currentKey] = opt.value;
          var full = saveSettings(newSettings);
          // Update aria-pressed on all pills in this row
          pills.querySelectorAll(".maqt-pill").forEach(function (p) {
            p.setAttribute("aria-pressed", String(full[currentKey] === p.dataset.value));
          });
          if (onChange) onChange(opt.value, full);
        });

        pills.appendChild(btn);
      });

      row.appendChild(pills);
      modal.appendChild(row);
    }

    // Motion
    addRow("Motion", [
      { label: "Auto",   value: "auto"   },
      { label: "Reduce", value: "reduce" }
    ], "motion");

    // Contrast
    addRow("Contrast", [
      { label: "Normal", value: "normal" },
      { label: "High",   value: "high"   }
    ], "contrast");

    // Font
    addRow("Font", [
      { label: "Default",   value: "default"  },
      { label: "Dyslexic",  value: "dyslexic" }
    ], "fontFamily");

    // Colorblind
    addRow("Colorblind", [
      { label: "Off",   value: "off"          },
      { label: "Prot.", value: "protanopia"   },
      { label: "Deut.", value: "deuteranopia" },
      { label: "Trit.", value: "tritanopia"   }
    ], "colorblind");

    // Close handlers
    function close() {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      if (onClose) onClose();
    }

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        document.removeEventListener("keydown", onKeyDown, true);
      }
    }
    document.addEventListener("keydown", onKeyDown, true);

    // Focus trap: keep focus inside modal
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusable = modal.querySelectorAll("button");
      if (!focusable.length) return;
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Auto-focus close button
    closeBtn.focus();

    return { backdrop: backdrop, modal: modal, close: close };
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  var API = {
    _loaded: true,

    /**
     * Mount the A11y quick-toggle button into `container`.
     * Returns an { unmount } handle.
     *
     * @param {Element} container  – e.g. document.querySelector(".hud-controls")
     * @param {Object}  [opts]     – reserved for future options
     * @returns {{ unmount: function }}
     */
    mount: function (container, opts) {
      if (!container) return { unmount: function () {} };

      // Idempotency: only one button per container
      if (container.querySelector(".maqt-btn")) return { unmount: function () {} };

      // Apply current profile settings to body immediately on mount
      try {
        var current = readSettings();
        if (Object.keys(current).length) applyToBody(current);
      } catch (e) {}

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "maqt-btn";
      btn.setAttribute("aria-label", "Open accessibility settings");
      btn.title = "Accessibility settings";
      // Use plain text so no font dependency
      btn.textContent = "⚙ A11y"; // ⚙ A11y

      var currentModal = null;

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (currentModal) {
          currentModal.close();
          currentModal = null;
          return;
        }
        currentModal = buildModal(function () {
          currentModal = null;
        });
      });

      container.appendChild(btn);

      return {
        unmount: function () {
          if (currentModal) { currentModal.close(); currentModal = null; }
          if (btn.parentNode) btn.parentNode.removeChild(btn);
        }
      };
    },

    /** Programmatically apply current profile settings to body classes. */
    applyToBody: applyToBody
  };

  window.MrMacsA11yQuickToggle = API;
})();
