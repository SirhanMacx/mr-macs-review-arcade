/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Arcade — Read-Aloud engine (Web Speech API)
   ═══════════════════════════════════════════════════════════════════════
   Shared text-to-speech helper for ENL / accessibility support. One engine
   powers every `.read-aloud-btn` on any page that loads this module: the
   hub diagnostic quizzes, the Quiz Gauntlet, the ENL glossary, and the
   Global 9 Regents Skills trainers.

   Design rules:
     - Browser-native speechSynthesis ONLY. No network calls, no third-party
       libraries, nothing leaves the device.
     - Graceful no-op when speechSynthesis is unavailable: buttons hide
       themselves, every API call is safe to make.
     - Battery friendly: no polling, no timers while idle; speech is
       cancelled on pagehide / tab-hide so nothing runs in the background.
     - Zero emoji. The speaker glyph is an inline monoline SVG matching the
       arcade icon system (assets/arcade-icons.js "audio-on").

   Public API: window.MrMacsReadAloud
     .available()             -> bool (speechSynthesis present)
     .isEnabled()             -> bool (persistent user toggle, default ON)
     .setEnabled(bool)        -> persists + shows/hides every speaker button
     .speak(text, opts)       -> speaks text. opts: { lang, rate, button }
     .stop()                  -> cancel current speech
     .buttonHTML(text, opts)  -> string: speaker <button> markup for templates
                                 opts: { lang, extraClass, label }

   Buttons: any element with class `read-aloud-btn` is wired automatically
   via document-level delegation. Attributes:
     data-text  (required) — what to read
     data-lang  (optional) — BCP-47 tag, default "en-US"
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  if (root.MrMacsReadAloud) return;

  var STORE_KEY = "arcade.readAloud";        // "on" | "off"
  var DISABLED_CLASS = "mmra-tts-off";       // on <html> when toggled off
  var DEFAULT_RATE = 0.95;
  var DEFAULT_LANG = "en-US";

  // Speaker glyph — monoline SVG, mirrors MrMacsIcons "audio-on".
  // Inlined (not pulled from arcade-icons.js) so course pages that load
  // only this module still render the button. aria-hidden: the <button>
  // carries the accessible label.
  var SPEAKER_SVG =
    '<svg class="ic" width="14" height="14" viewBox="0 0 24 24" fill="none"' +
    ' stroke="currentColor" stroke-width="1.8" stroke-linecap="round"' +
    ' stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M5 10 H8 L12 6 V18 L8 14 H5 Z"/>' +
    '<path d="M15 9 C16.6 10.4 16.6 13.6 15 15"/>' +
    '<path d="M17.5 6.5 C20.5 9 20.5 15 17.5 17.5"/></svg>';

  function available() {
    return typeof root.speechSynthesis !== "undefined" &&
           typeof root.SpeechSynthesisUtterance !== "undefined";
  }

  // ── Persistent enable toggle (default ON) ────────────────────────────
  function isEnabled() {
    try { return localStorage.getItem(STORE_KEY) !== "off"; } catch (e) { return true; }
  }
  function applyEnabledState() {
    var off = !isEnabled() || !available();
    try {
      document.documentElement.classList.toggle(DISABLED_CLASS, off);
    } catch (e) {}
  }
  function setEnabled(on) {
    try { localStorage.setItem(STORE_KEY, on ? "on" : "off"); } catch (e) {}
    if (!on) stop();
    applyEnabledState();
    return isEnabled();
  }

  // ── Styles (button + hidden state). Self-contained so course pages
  //    without arcade-hub-styles.css still look right; identical rules on
  //    the hub simply cascade to the same values. ──────────────────────
  function injectStyles() {
    if (document.getElementById("mmra-styles")) return;
    var css = [
      ".read-aloud-btn { display: inline-grid; place-items: center;",
      "  width: 26px; height: 26px; margin-left: 8px; vertical-align: middle;",
      "  background: rgba(122,240,255,.10); border: 1px solid rgba(122,240,255,.35);",
      "  border-radius: 50%; color: var(--cyan, #7af0ff); font-size: 12px;",
      "  cursor: pointer; padding: 0;",
      "  transition: background .2s, transform .2s, border-color .2s; }",
      ".read-aloud-btn:hover { background: rgba(122,240,255,.22);",
      "  border-color: rgba(122,240,255,.65); transform: scale(1.05); }",
      ".read-aloud-btn[aria-pressed='true'] {",
      "  background: linear-gradient(135deg, rgba(122,240,255,.55), rgba(184,146,255,.35));",
      "  color: #052614; border-color: rgba(122,240,255,.85);",
      "  animation: readAloudPulse 1.5s ease-in-out infinite; }",
      ".read-aloud-btn .ic { display: block; }",
      "@keyframes readAloudPulse {",
      "  0%, 100% { box-shadow: 0 0 0 0 rgba(122,240,255,.55); }",
      "  50% { box-shadow: 0 0 0 6px rgba(122,240,255,0); } }",
      "@media (prefers-reduced-motion: reduce) {",
      "  .read-aloud-btn[aria-pressed='true'] { animation: none; }",
      "  .read-aloud-btn:hover { transform: none; } }",
      "." + DISABLED_CLASS + " .read-aloud-btn { display: none !important; }"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "mmra-styles";
    s.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(s);
  }

  // ── Voice selection ──────────────────────────────────────────────────
  // Cache the best voice per language; refresh when voiceschanged fires
  // (Chrome populates the list asynchronously).
  var voiceCache = {};
  function pickVoice(lang) {
    if (!available()) return null;
    if (Object.prototype.hasOwnProperty.call(voiceCache, lang)) return voiceCache[lang];
    var voices = [];
    try { voices = root.speechSynthesis.getVoices() || []; } catch (e) {}
    var lower = String(lang || DEFAULT_LANG).toLowerCase();
    var prefix = lower.split("-")[0];
    var exactLocal = null, exact = null, prefixLocal = null, prefixAny = null;
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      var vl = String(v.lang || "").toLowerCase().replace(/_/g, "-");
      if (vl === lower) {
        if (v.localService && !exactLocal) exactLocal = v;
        if (!exact) exact = v;
      } else if (vl.indexOf(prefix + "-") === 0 || vl === prefix) {
        if (v.localService && !prefixLocal) prefixLocal = v;
        if (!prefixAny) prefixAny = v;
      }
    }
    var best = exactLocal || exact || prefixLocal || prefixAny || null;
    voiceCache[lang] = best;
    return best;
  }
  if (available()) {
    try {
      root.speechSynthesis.addEventListener("voiceschanged", function () {
        voiceCache = {};
      });
    } catch (e) {}
  }

  // ── Speak / stop ─────────────────────────────────────────────────────
  var currentBtn = null;

  function stop() {
    if (available()) {
      try { root.speechSynthesis.cancel(); } catch (e) {}
    }
    if (currentBtn) {
      try { currentBtn.setAttribute("aria-pressed", "false"); } catch (e) {}
    }
    currentBtn = null;
  }

  function speak(text, opts) {
    opts = opts || {};
    if (!available() || !isEnabled()) return false;
    text = String(text == null ? "" : text).trim();
    if (!text) return false;
    stop();
    var btn = opts.button || null;
    try {
      var u = new root.SpeechSynthesisUtterance(text);
      var lang = opts.lang || DEFAULT_LANG;
      u.lang = lang;
      var voice = pickVoice(lang);
      if (voice) u.voice = voice;
      u.rate = typeof opts.rate === "number" ? opts.rate : DEFAULT_RATE;
      u.pitch = 1;
      u.volume = 1;
      u.onend = function () {
        if (currentBtn === btn || !btn) stop();
        if (typeof opts.onend === "function") { try { opts.onend(); } catch (e) {} }
      };
      u.onerror = u.onend;
      if (btn) {
        currentBtn = btn;
        try { btn.setAttribute("aria-pressed", "true"); } catch (e) {}
      }
      root.speechSynthesis.speak(u);
      return true;
    } catch (err) {
      stop();
      return false;
    }
  }

  // ── Button factory ───────────────────────────────────────────────────
  function escAttr(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function buttonHTML(text, opts) {
    opts = opts || {};
    if (!available()) return "";
    var lang = opts.lang || DEFAULT_LANG;
    var cls = "read-aloud-btn" + (opts.extraClass ? " " + opts.extraClass : "");
    var label = opts.label || "Read aloud";
    return '<button class="' + cls + '" type="button"' +
           ' aria-label="' + escAttr(label) + '" aria-pressed="false"' +
           ' data-text="' + escAttr(text) + '"' +
           ' data-lang="' + escAttr(lang) + '">' + SPEAKER_SVG + '</button>';
  }

  // ── Document-level wiring ────────────────────────────────────────────
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest(".read-aloud-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (!available()) {
      btn.disabled = true;
      btn.title = "Your browser doesn't support read-aloud.";
      return;
    }
    if (currentBtn === btn) { stop(); return; }
    var text = btn.dataset.text || "";
    if (!text && btn.parentNode) {
      text = (btn.parentNode.textContent || "").trim();
    }
    if (!text) return;
    speak(text, { lang: btn.dataset.lang || DEFAULT_LANG, button: btn });
  });

  // Stop on Escape and on hub modal-close clicks (mirrors the legacy hub
  // behavior so review-modal close still silences speech).
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") stop();
  });
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.id) return;
    if (t.id === "rmClose" || t.id === "rmBackdrop") stop();
  });

  // Battery / sanity: never keep speaking when the page is hidden or gone.
  root.addEventListener("pagehide", stop);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") stop();
  });

  // ── Auto-inject into the Quiz Gauntlet ───────────────────────────────
  // Whenever a gauntlet question prompt (.mmq-prompt) appears, append a
  // speaker button that reads the prompt text. Observation is cheap (one
  // observer, childList only) and a no-op on pages without the gauntlet.
  function enhancePrompts(rootEl) {
    if (!available()) return;
    var prompts = (rootEl || document).querySelectorAll
      ? (rootEl || document).querySelectorAll(".mmq-prompt:not([data-mmra])")
      : [];
    for (var i = 0; i < prompts.length; i++) {
      var p = prompts[i];
      p.setAttribute("data-mmra", "1");
      var text = (p.textContent || "").trim();
      if (!text || text.length < 8) continue;       // skip loading stubs
      var span = document.createElement("span");
      span.innerHTML = buttonHTML(text, { label: "Read this question aloud" });
      if (span.firstChild) p.appendChild(span.firstChild);
    }
  }
  function watchPrompts() {
    if (!available() || typeof MutationObserver === "undefined") return;
    enhancePrompts(document);
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes && muts[i].addedNodes.length) {
          enhancePrompts(document);
          break;
        }
      }
    });
    mo.observe(document.body || document.documentElement,
               { childList: true, subtree: true });
  }

  function boot() {
    injectStyles();
    applyEnabledState();
    watchPrompts();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  root.MrMacsReadAloud = {
    available: available,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    speak: speak,
    stop: stop,
    buttonHTML: buttonHTML
  };
})(typeof window !== "undefined" ? window : globalThis);
