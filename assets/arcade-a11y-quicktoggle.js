/**
 * arcade-a11y-quicktoggle.js  —  Mr. Mac's Review Arcade
 * --------------------------------------------------------
 * API:  MrMacsA11yQuickToggle.mount(container, opts) -> { unmount }
 *
 * Adds a small accessibility button to a viewport-level dock.
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
 * z-index 100000+ (above setup/gameplay overlays).
 * Idempotent guard: only one global dock/trigger per page.
 *
 * @version 20260514-a11y-menu
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
      ".maqt-dock{",
      "  position:fixed!important;",
      "  top:max(6px,calc(env(safe-area-inset-top,0px) + 6px))!important;",
      "  right:max(10px,calc(env(safe-area-inset-right,0px) + 10px))!important;",
      "  z-index:100000!important;",
      "  display:flex!important;",
      "  align-items:center!important;",
      "  justify-content:center!important;",
      "  pointer-events:none!important;",
      "}",
      ".maqt-btn{",
      "  all:unset;",
      "  box-sizing:border-box!important;",
      "  display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;",
      "  min-width:44px!important;min-height:38px!important;",
      "  padding:7px 10px!important;border-radius:8px!important;",
      "  background:linear-gradient(180deg,rgba(255,208,96,0.22),rgba(8,12,22,0.94))!important;",
      "  border:1px solid rgba(255,216,132,0.72)!important;",
      "  color:#fff6cf!important;font-size:13px!important;line-height:1!important;font-family:inherit!important;",
      "  cursor:pointer!important;white-space:nowrap!important;",
      "  transition:background .15s,transform .15s,box-shadow .15s!important;",
      "  -webkit-user-select:none;user-select:none;",
      "  pointer-events:auto!important;",
      "  box-shadow:0 5px 14px rgba(0,0,0,0.48),0 0 14px rgba(255,208,96,0.18)!important;",
      "}",
      ".maqt-btn:hover{background:linear-gradient(180deg,rgba(255,224,122,0.32),rgba(8,12,22,0.98))!important;transform:translateY(-1px)!important;}",
      ".maqt-btn[aria-expanded='true']{border-color:#7df!important;box-shadow:0 0 0 3px rgba(125,221,255,.24),0 7px 18px rgba(0,0,0,.5)!important;}",
      ".maqt-btn:focus-visible{outline:3px solid #7df!important;outline-offset:3px!important;}",

      /* ── Backdrop ── */
      ".maqt-backdrop{",
      "  position:fixed!important;inset:0!important;",
      "  background:rgba(0,0,0,0.64)!important;",
      "  z-index:100001!important;",
      "  animation:maqt-fade-in .12s ease both!important;",
      "  pointer-events:auto!important;",
      "}",

      /* ── Modal ── */
      ".maqt-modal{",
      "  position:fixed!important;",
      "  top:50%!important;left:50%!important;",
      "  transform:translate(-50%,-50%)!important;",
      "  z-index:100002!important;",
      "  box-sizing:border-box!important;",
      "  background:linear-gradient(180deg,#20213a 0%,#101324 100%)!important;",
      "  border:2px solid rgba(255,216,132,0.54)!important;",
      "  border-radius:10px!important;",
      "  padding:18px 18px 16px!important;",
      "  min-width:min(360px,calc(100vw - 28px))!important;",
      "  max-width:min(440px,calc(100vw - 28px))!important;width:min(440px,calc(100vw - 28px))!important;",
      "  max-height:calc(100dvh - 32px)!important;overflow:auto!important;",
      "  box-shadow:0 18px 54px rgba(0,0,0,0.78),0 0 32px rgba(125,221,255,.16)!important;",
      "  color:#f3f6ff!important;font-family:inherit!important;",
      "  animation:maqt-slide-in .14s ease both!important;",
      "  pointer-events:auto!important;",
      "  -webkit-overflow-scrolling:touch!important;",
      "}",
      ".maqt-modal:hover,.maqt-modal:focus-within{",
      "  transform:translate(-50%,-50%)!important;",
      "}",

      /* ── Modal header ── */
      ".maqt-header{",
      "  display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;",
      "  margin-bottom:14px!important;",
      "}",
      ".maqt-title{",
      "  font-size:18px!important;font-weight:700!important;letter-spacing:.02em!important;",
      "  text-transform:uppercase!important;color:#fff6cf!important;",
      "}",
      ".maqt-close{",
      "  all:unset;box-sizing:border-box!important;cursor:pointer!important;",
      "  min-width:38px!important;min-height:38px!important;",
      "  display:inline-flex!important;align-items:center!important;justify-content:center!important;",
      "  font-size:24px!important;line-height:1!important;color:#f4e7aa!important;",
      "  padding:0!important;border-radius:8px!important;border:1px solid rgba(255,216,132,.38)!important;",
      "  transition:color .12s,background .12s!important;",
      "}",
      ".maqt-close:hover{color:#fff!important;background:rgba(255,255,255,.12)!important;}",
      ".maqt-close:focus-visible{outline:3px solid #7df!important;outline-offset:2px!important;}",

      /* ── Rows ── */
      ".maqt-row{",
      "  display:grid!important;grid-template-columns:minmax(88px,0.65fr) minmax(0,1fr)!important;align-items:center!important;",
      "  gap:10px!important;",
      "  padding:9px 0!important;",
      "  border-bottom:1px solid rgba(255,255,255,0.10)!important;",
      "}",
      ".maqt-row:last-child{border-bottom:none!important;}",
      ".maqt-label{font-size:16px!important;line-height:1.1!important;color:#d9e6ff!important;min-width:0!important;}",

      /* ── Pill toggle strip ── */
      ".maqt-pills{display:flex!important;gap:6px!important;flex-wrap:wrap!important;justify-content:flex-end!important;}",
      ".maqt-pill{",
      "  all:unset;box-sizing:border-box!important;cursor:pointer!important;",
      "  display:inline-flex!important;align-items:center!important;justify-content:center!important;",
      "  min-height:36px!important;min-width:52px!important;",
      "  font-size:15px!important;line-height:1!important;padding:8px 10px!important;border-radius:999px!important;",
      "  border:1px solid rgba(255,255,255,0.24)!important;",
      "  color:#c3c9e2!important;background:rgba(255,255,255,0.045)!important;",
      "  transition:background .12s,color .12s,border-color .12s!important;",
      "  -webkit-user-select:none;user-select:none;",
      "}",
      ".maqt-pill:hover{background:rgba(255,255,255,0.12)!important;color:#fff!important;}",
      ".maqt-pill[aria-pressed='true']{",
      "  background:rgba(125,220,255,0.22)!important;",
      "  border-color:rgba(125,220,255,0.74)!important;",
      "  color:#9ff2ff!important;font-weight:700!important;",
      "}",
      ".maqt-pill:focus-visible{outline:3px solid #7df!important;outline-offset:2px!important;}",
      "@media (max-width:420px){",
      "  .maqt-dock{top:max(4px,calc(env(safe-area-inset-top,0px) + 4px))!important;right:max(6px,calc(env(safe-area-inset-right,0px) + 6px))!important;}",
      "  .maqt-btn{min-height:36px!important;padding:6px 8px!important;font-size:12px!important;}",
      "  .maqt-modal{padding:16px 14px 14px!important;}",
      "  .maqt-row{grid-template-columns:1fr!important;align-items:start!important;gap:7px!important;}",
      "  .maqt-pills{justify-content:flex-start!important;}",
      "  .maqt-pill{min-width:58px!important;}",
      "}",

      /* ── Animations ── */
      "@keyframes maqt-fade-in{from{opacity:0}to{opacity:1}}",
      "@keyframes maqt-slide-in{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}"
    ].join("\n");
    document.head.appendChild(style);
  })();

  var DEFAULT_SETTINGS = {
    motion: "auto",
    contrast: "normal",
    fontFamily: "default",
    colorblind: "off"
  };

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
    var settings = {};
    try {
      if (window.MrMacsProfile && typeof window.MrMacsProfile.getSettings === "function") {
        settings = window.MrMacsProfile.getSettings() || {};
      }
    } catch (e) {}
    return Object.assign({}, DEFAULT_SETTINGS, settings);
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
  function buildModal(onClose, returnFocusEl) {
    var settings = readSettings();
    var closed = false;

    var backdrop = document.createElement("div");
    backdrop.className = "maqt-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    var modal = document.createElement("div");
    modal.className = "maqt-modal";
    modal.id = "maqt-dialog";
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
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKeyDown, true);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      if (returnFocusEl && document.contains(returnFocusEl)) {
        try { returnFocusEl.focus(); } catch (e) {}
      }
      if (onClose) onClose();
    }

    function stopBubble(e) {
      e.stopPropagation();
    }

    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      close();
    });
    backdrop.addEventListener("pointerdown", stopBubble);
    backdrop.addEventListener("touchstart", stopBubble, { passive: true });
    backdrop.addEventListener("click", function (e) {
      e.stopPropagation();
      close();
    });
    modal.addEventListener("pointerdown", stopBubble);
    modal.addEventListener("touchstart", stopBubble, { passive: true });
    modal.addEventListener("click", stopBubble);

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
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
      if (document.querySelector(".maqt-btn")) return { unmount: function () {} };

      // Apply current profile settings to body immediately on mount
      try {
        var current = readSettings();
        if (Object.keys(current).length) applyToBody(current);
      } catch (e) {}

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "maqt-btn";
      btn.setAttribute("aria-label", "Open accessibility settings");
      btn.setAttribute("aria-controls", "maqt-dialog");
      btn.setAttribute("aria-expanded", "false");
      btn.title = "Accessibility settings";
      // Use plain text so no font dependency
      btn.textContent = "Access";

      var currentModal = null;

      function getDock() {
        var dock = document.getElementById("maqt-dock");
        if (dock) return dock;
        dock = document.createElement("div");
        dock.id = "maqt-dock";
        dock.className = "maqt-dock";
        dock.setAttribute("aria-label", "Accessibility tools");
        document.body.appendChild(dock);
        return dock;
      }

      function openModal() {
        currentModal = buildModal(function () {
          currentModal = null;
          btn.setAttribute("aria-expanded", "false");
        }, btn);
        btn.setAttribute("aria-expanded", "true");
      }

      btn.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
      });
      btn.addEventListener("touchstart", function (e) {
        e.stopPropagation();
      }, { passive: true });
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (currentModal) {
          currentModal.close();
          currentModal = null;
          btn.setAttribute("aria-expanded", "false");
          return;
        }
        openModal();
      });

      getDock().appendChild(btn);

      return {
        unmount: function () {
          if (currentModal) { currentModal.close(); currentModal = null; }
          btn.setAttribute("aria-expanded", "false");
          if (btn.parentNode) btn.parentNode.removeChild(btn);
          var dock = document.getElementById("maqt-dock");
          if (dock && !dock.children.length && dock.parentNode) dock.parentNode.removeChild(dock);
        }
      };
    },

    /** Programmatically apply current profile settings to body classes. */
    applyToBody: applyToBody
  };

  window.MrMacsA11yQuickToggle = API;
})();
