/* Mr. Mac's Arcade — Import/Export UI Module
 *
 * Wraps MrMacsProfile.exportProfile() + importProfile() in a friendly
 * "Share my progress" / "Restore from code" workflow.
 *
 * Exposes a single global: window.MrMacsImportExport
 *
 * No external dependencies. Self-contained CSS (prefix: mie-).
 * Respects prefers-reduced-motion. Idempotent load.
 *
 * Public API:
 *   showExportModal()  -> Promise<{exported, code?}>
 *   showImportModal()  -> Promise<{imported, profile?}>
 *   encodeProfile(obj) -> string
 *   decodeProfile(str) -> object | null
 *   mountExportButton(container) -> { unmount }
 *   mountImportButton(container) -> { unmount }
 *   on(event, handler), off(event, handler)
 */

(function (root) {
  "use strict";

  // ─── Idempotent guard ────────────────────────────────────────────────────────
  if (root.MrMacsImportExport) return;

  // ─── Tiny event bus ──────────────────────────────────────────────────────────
  var _listeners = {};
  function emit(name, detail) {
    var handlers = _listeners[name];
    if (!handlers) return;
    handlers.slice().forEach(function (fn) { try { fn(detail); } catch (_) {} });
  }

  // ─── CSS injection (self-contained, prefixed mie-) ───────────────────────────
  var STYLE_ID = "mie-styles";
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      /* Overlay */
      ".mie-overlay{position:fixed;inset:0;z-index:9990;display:flex;align-items:center;" +
        "justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);}",
      /* Modal */
      ".mie-modal{position:relative;background:#0f1117;border:1px solid #1e2535;" +
        "border-radius:12px;padding:28px 28px 24px;width:min(520px,92vw);" +
        "max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.6);" +
        "color:#d6e0f0;font-family:system-ui,sans-serif;animation:mie-in .18s ease;}",
      /* Reduced-motion */
      "@media(prefers-reduced-motion:reduce){.mie-modal{animation:none;}}",
      "@keyframes mie-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
      /* Close button */
      ".mie-close{position:absolute;top:14px;right:16px;background:none;border:none;" +
        "color:#6b7a99;font-size:1.25rem;cursor:pointer;line-height:1;padding:2px 6px;" +
        "border-radius:4px;}",
      ".mie-close:hover{color:#d6e0f0;background:#1e2535;}",
      /* Typography */
      ".mie-title{margin:0 0 6px;font-size:1.15rem;font-weight:700;color:#e8edf5;}",
      ".mie-sub{margin:0 0 18px;font-size:.85rem;color:#7a8ba8;line-height:1.45;}",
      /* Textarea */
      ".mie-textarea{display:block;width:100%;box-sizing:border-box;min-height:110px;" +
        "background:#080c12;border:1px solid #1e2535;border-radius:8px;color:#a0e8d0;" +
        "font-family:'Courier New',monospace;font-size:.78rem;padding:10px 12px;" +
        "resize:vertical;outline:none;word-break:break-all;line-height:1.5;}",
      ".mie-textarea:focus{border-color:#00c8a0;}",
      ".mie-textarea[readonly]{cursor:default;opacity:.9;}",
      /* Button row */
      ".mie-btn-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;}",
      ".mie-btn{padding:9px 16px;border-radius:8px;border:none;cursor:pointer;" +
        "font-size:.85rem;font-weight:600;transition:filter .12s,opacity .12s;}",
      ".mie-btn:disabled{opacity:.45;cursor:not-allowed;}",
      /* Primary (cyan) */
      ".mie-btn-primary{background:#00c8a0;color:#0a0f18;}",
      ".mie-btn-primary:not(:disabled):hover{filter:brightness(1.12);}",
      /* Secondary */
      ".mie-btn-secondary{background:#1e2535;color:#d6e0f0;border:1px solid #2d3a52;}",
      ".mie-btn-secondary:not(:disabled):hover{background:#263044;}",
      /* Warning banner */
      ".mie-warn{display:flex;align-items:flex-start;gap:8px;background:#1e1608;" +
        "border:1px solid #5a3a00;border-radius:8px;padding:10px 12px;font-size:.82rem;" +
        "color:#e0b860;margin-bottom:14px;line-height:1.45;}",
      ".mie-warn svg{flex-shrink:0;margin-top:2px;}",
      /* Toast */
      ".mie-toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);" +
        "z-index:9999;background:#0f1117;border:1px solid #1e2535;border-radius:8px;" +
        "padding:10px 18px;font-size:.85rem;color:#d6e0f0;box-shadow:0 4px 20px rgba(0,0,0,.5);" +
        "pointer-events:none;animation:mie-toast-in .18s ease,mie-toast-out .3s ease 2.2s forwards;}",
      ".mie-toast.mie-toast-ok{border-color:#00c8a0;color:#a0e8d0;}",
      ".mie-toast.mie-toast-err{border-color:#e05060;color:#f0a0a8;}",
      "@keyframes mie-toast-in{from{opacity:0;transform:translateX(-50%) translateY(8px)}" +
        "to{opacity:1;transform:translateX(-50%) translateY(0)}}",
      "@keyframes mie-toast-out{to{opacity:0;transform:translateX(-50%) translateY(8px)}}",
    ].join("\n");
    document.head.appendChild(style);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function showToast(msg, kind) {
    var el = document.createElement("div");
    el.className = "mie-toast" + (kind === "ok" ? " mie-toast-ok" : kind === "err" ? " mie-toast-err" : "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2600);
  }

  function trapFocus(modal) {
    var focusable = modal.querySelectorAll(
      'button,textarea,input,[tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return function () {};
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    function onKey(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    modal.addEventListener("keydown", onKey);
    return function () { modal.removeEventListener("keydown", onKey); };
  }

  function warnIcon() {
    return '<svg width="14" height="14" viewBox="0 0 16 16" fill="#e0b860">' +
      '<path d="M8 1l7 13H1L8 1zm0 4v4m0 2v1" stroke="#e0b860" stroke-width="1.5" fill="none"/>' +
      "</svg>";
  }

  // ─── Encoding ────────────────────────────────────────────────────────────────
  function encodeProfile(profileObj) {
    try {
      var json = JSON.stringify(profileObj);
      // Safe unicode-aware base64
      return btoa(unescape(encodeURIComponent(json)));
    } catch (e) {
      return "";
    }
  }

  function decodeProfile(code) {
    if (typeof code !== "string" || !code.trim()) return null;
    try {
      var json = decodeURIComponent(escape(atob(code.trim())));
      var obj = JSON.parse(json);
      if (!obj || typeof obj !== "object") return null;
      // Minimal shape validation
      var hasName = typeof obj.name === "string" || (obj.profile && typeof obj.profile.name === "string");
      var hasShards = obj.shards !== undefined || (obj.profile && obj.profile.shards !== undefined);
      var hasAchievements = obj.achievements !== undefined || (obj.profile && obj.profile.achievements !== undefined);
      if (!hasName && !hasShards && !hasAchievements) return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  // ─── Modal factory ───────────────────────────────────────────────────────────
  function openModal(buildFn) {
    return new Promise(function (resolve) {
      var overlay = document.createElement("div");
      overlay.className = "mie-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");

      var modal = document.createElement("div");
      modal.className = "mie-modal";

      var closeBtn = document.createElement("button");
      closeBtn.className = "mie-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.textContent = "×";

      modal.appendChild(closeBtn);
      overlay.appendChild(modal);

      var settled = false;
      function settle(result) {
        if (settled) return;
        settled = true;
        releaseFocus();
        document.removeEventListener("keydown", onKeyDown);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }

      closeBtn.addEventListener("click", function () { settle({ _closed: true }); });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) settle({ _closed: true });
      });
      function onKeyDown(e) {
        if (e.key === "Escape") settle({ _closed: true });
      }
      document.addEventListener("keydown", onKeyDown);

      buildFn(modal, settle);

      document.body.appendChild(overlay);
      var releaseFocus = trapFocus(modal);
      // Focus first interactive element
      var first = modal.querySelector("button,textarea,input");
      if (first) setTimeout(function () { first.focus(); }, 0);
    });
  }

  // ─── Export modal ────────────────────────────────────────────────────────────
  function showExportModal() {
    return openModal(function (modal, settle) {
      var code = "";
      try {
        var jsonStr = window.MrMacsProfile.exportProfile();
        var parsed = JSON.parse(jsonStr);
        code = encodeProfile(parsed);
      } catch (e) {
        code = "";
      }

      var title = document.createElement("h2");
      title.className = "mie-title";
      title.textContent = "Share Your Progress";

      var sub = document.createElement("p");
      sub.className = "mie-sub";
      sub.textContent = "Copy this code to share or back up your profile. Anyone with this code can import a copy.";

      var textarea = document.createElement("textarea");
      textarea.className = "mie-textarea";
      textarea.readOnly = true;
      textarea.value = code || "(no profile found)";
      textarea.setAttribute("aria-label", "Profile export code");
      textarea.addEventListener("click", function () { textarea.select(); });

      var btnRow = document.createElement("div");
      btnRow.className = "mie-btn-row";

      var copyBtn = document.createElement("button");
      copyBtn.className = "mie-btn mie-btn-primary";
      copyBtn.innerHTML = "📋 Copy to Clipboard";
      copyBtn.disabled = !code;
      copyBtn.addEventListener("click", function () {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(function () {
              showToast("Copied to clipboard!", "ok");
              emit("export", { code: code });
            }).catch(function () { fallbackCopy(); });
          } else {
            fallbackCopy();
          }
        } catch (e) {
          fallbackCopy();
        }
        function fallbackCopy() {
          textarea.select();
          try {
            document.execCommand("copy");
            showToast("Copied to clipboard!", "ok");
            emit("export", { code: code });
          } catch (_) {
            showToast("Select the code above and copy manually.", "");
          }
        }
      });

      var dlBtn = document.createElement("button");
      dlBtn.className = "mie-btn mie-btn-secondary";
      dlBtn.innerHTML = "📥 Download as .txt";
      dlBtn.disabled = !code;
      dlBtn.addEventListener("click", function () {
        try {
          var blob = new Blob([code], { type: "text/plain;charset=utf-8" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "mrmacs-profile-backup.txt";
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 1000);
          showToast("Download started.", "ok");
          emit("export", { code: code });
        } catch (e) {
          showToast("Download failed — copy the code manually.", "err");
        }
      });

      btnRow.appendChild(copyBtn);
      btnRow.appendChild(dlBtn);

      modal.appendChild(title);
      modal.appendChild(sub);
      modal.appendChild(textarea);
      modal.appendChild(btnRow);

      // Override settle so we can return structured result
      var origSettle = settle;
      // Patch close button + overlay to use our own result shape
      var closeOverride = function () { origSettle({ exported: false }); };
      modal.querySelector(".mie-close").addEventListener("click", closeOverride);
      // Export happened — track it so we can return exported:true
      var exported = false;
      copyBtn.addEventListener("click", function () { if (code) exported = true; });
      dlBtn.addEventListener("click", function () { if (code) exported = true; });
      // resolve on backdrop/esc is already wired; wrap settle
      settle = function (r) {
        if (r && r._closed) { origSettle({ exported: exported, code: exported ? code : undefined }); }
        else { origSettle(r); }
      };
    }).then(function (r) {
      if (r && r._closed) return { exported: false };
      return r || { exported: false };
    });
  }

  // ─── Import modal ────────────────────────────────────────────────────────────
  function showImportModal() {
    return openModal(function (modal, settle) {
      var title = document.createElement("h2");
      title.className = "mie-title";
      title.textContent = "Restore Profile";

      var sub = document.createElement("p");
      sub.className = "mie-sub";
      sub.textContent = "Paste a profile code below to import.";

      // Warning banner if a profile already exists
      var hasExisting = false;
      try {
        hasExisting = window.MrMacsProfile.exists();
      } catch (_) {}
      if (hasExisting) {
        var warn = document.createElement("div");
        warn.className = "mie-warn";
        warn.innerHTML = warnIcon() + "<span>You already have a profile saved. Importing will <strong>overwrite</strong> your current progress. Back it up first if needed.</span>";
        modal.appendChild(warn);
      }

      var textarea = document.createElement("textarea");
      textarea.className = "mie-textarea";
      textarea.placeholder = "Paste your profile code here…";
      textarea.setAttribute("aria-label", "Paste profile code");

      var btnRow = document.createElement("div");
      btnRow.className = "mie-btn-row";

      var importBtn = document.createElement("button");
      importBtn.className = "mie-btn mie-btn-primary";
      importBtn.innerHTML = "📥 Import";
      importBtn.addEventListener("click", function () {
        var rawCode = textarea.value.trim();
        if (!rawCode) {
          showToast("Please paste a profile code first.", "err");
          return;
        }

        // Decode the base64 code back to the profile object/envelope
        var decoded = decodeProfile(rawCode);
        if (!decoded) {
          showToast("Invalid code — couldn't decode profile.", "err");
          return;
        }

        // MrMacsProfile.importProfile expects the original JSON string (the envelope)
        var jsonStr;
        try {
          jsonStr = JSON.stringify(decoded);
        } catch (e) {
          showToast("Profile data is corrupt.", "err");
          return;
        }

        var result;
        try {
          result = window.MrMacsProfile.importProfile(jsonStr);
        } catch (e) {
          showToast("Import failed unexpectedly. Try again.", "err");
          return;
        }

        if (!result || !result.ok) {
          var reason = (result && result.reason) || "unknown error";
          showToast("Import failed: " + reason + ".", "err");
          return;
        }

        showToast("Profile imported successfully!", "ok");
        emit("import", { profile: result.profile });
        settle({ imported: true, profile: result.profile });
      });

      var cancelBtn = document.createElement("button");
      cancelBtn.className = "mie-btn mie-btn-secondary";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", function () { settle({ imported: false }); });

      btnRow.appendChild(importBtn);
      btnRow.appendChild(cancelBtn);

      modal.appendChild(title);
      modal.appendChild(sub);
      modal.appendChild(textarea);
      modal.appendChild(btnRow);
    }).then(function (r) {
      if (r && r._closed) return { imported: false };
      return r || { imported: false };
    });
  }

  // ─── Mount helpers ───────────────────────────────────────────────────────────
  function mountExportButton(container) {
    var btn = document.createElement("button");
    btn.className = "mie-btn mie-btn-secondary";
    btn.innerHTML = "📤 Share Progress";
    function onClick() { showExportModal(); }
    btn.addEventListener("click", onClick);
    container.appendChild(btn);
    return {
      unmount: function () {
        btn.removeEventListener("click", onClick);
        if (btn.parentNode) btn.parentNode.removeChild(btn);
      }
    };
  }

  function mountImportButton(container) {
    var btn = document.createElement("button");
    btn.className = "mie-btn mie-btn-secondary";
    btn.innerHTML = "📥 Restore Profile";
    function onClick() { showImportModal(); }
    btn.addEventListener("click", onClick);
    container.appendChild(btn);
    return {
      unmount: function () {
        btn.removeEventListener("click", onClick);
        if (btn.parentNode) btn.parentNode.removeChild(btn);
      }
    };
  }

  // ─── Public API ──────────────────────────────────────────────────────────────
  root.MrMacsImportExport = {
    showExportModal: showExportModal,
    showImportModal: showImportModal,
    encodeProfile: encodeProfile,
    decodeProfile: decodeProfile,
    mountExportButton: mountExportButton,
    mountImportButton: mountImportButton,
    on: function (event, handler) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(handler);
    },
    off: function (event, handler) {
      if (!_listeners[event]) return;
      _listeners[event] = _listeners[event].filter(function (fn) { return fn !== handler; });
    }
  };

}(window));
