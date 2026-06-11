/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Arcade — ENL Glossary panel
   ═══════════════════════════════════════════════════════════════════════
   A searchable multilingual key-term glossary for ENL students.
   English → Pinyin → 简体中文 → Español, with a simplified English
   definition per term, and tap-to-hear on every term (via the shared
   MrMacsReadAloud engine, when present).

   Design rules (house):
     - 100% static + on-device. Data is a local JSON file; no network
       beyond same-origin fetch; nothing leaves the device.
     - Zero emoji. Inline monoline SVG only.
     - Self-contained styles; safe on any page (hub or course pages).
     - Graceful: no JSON → friendly error; no speechSynthesis → the
       speaker buttons simply don't render (MrMacsReadAloud handles it).

   Usage: any element with [data-enl-glossary] opens the panel on click.
     data-glossary-src  (required) — path to the glossary JSON
     data-glossary-title (optional) — panel title override
   JSON shape: { version, course, title, languages,
                 categories: [ { name, terms: [ { en, pinyin, zh, es,
                                                  definition_en_simple } ] } ] }
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  if (root.MrMacsEnlGlossary) return;

  var LANG_KEY = "arcade.enlGlossary.lang";   // "zh" | "es" | "both"
  var cache = {};                              // src -> parsed JSON

  var BOOK_SVG =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"' +
    ' stroke="currentColor" stroke-width="1.8" stroke-linecap="round"' +
    ' stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M4 5 C7 3.8 10 3.8 12 5 C14 3.8 17 3.8 20 5 V18.5' +
    ' C17 17.3 14 17.3 12 18.5 C10 17.3 7 17.3 4 18.5 Z"/>' +
    '<path d="M12 5 V18.5"/></svg>';

  function getLang() {
    try { return localStorage.getItem(LANG_KEY) || "zh"; } catch (e) { return "zh"; }
  }
  function setLang(v) {
    try { localStorage.setItem(LANG_KEY, v); } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById("enlg-styles")) return;
    var css = [
      ".enlg-backdrop{position:fixed;inset:0;background:rgba(2,4,12,.78);",
      "  backdrop-filter:blur(3px);z-index:11000;}",
      ".enlg-modal{position:fixed;z-index:11001;top:4vh;left:50%;transform:translateX(-50%);",
      "  width:min(860px,94vw);height:92vh;display:flex;flex-direction:column;",
      "  background:linear-gradient(180deg,#0b1226 0%,#070b18 100%);",
      "  border:1px solid rgba(122,240,255,.35);border-radius:16px;",
      "  box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 40px rgba(122,240,255,.08);",
      "  color:#d8dceb;font-family:'Inter',system-ui,sans-serif;}",
      ".enlg-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;",
      "  padding:14px 18px 10px;border-bottom:1px solid rgba(122,240,255,.18);}",
      ".enlg-title{font-family:'JetBrains Mono',monospace;font-weight:800;",
      "  font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:#7af0ff;",
      "  display:flex;align-items:center;gap:8px;margin-right:auto;}",
      ".enlg-close{width:32px;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.25);",
      "  background:rgba(255,255,255,.06);color:#fff;font-size:18px;line-height:1;cursor:pointer;}",
      ".enlg-close:hover{background:rgba(255,90,120,.25);border-color:rgba(255,90,120,.6);}",
      ".enlg-pills{display:flex;gap:6px;}",
      ".enlg-pill{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.06em;",
      "  padding:5px 12px;border-radius:999px;border:1px solid rgba(122,240,255,.30);",
      "  background:rgba(122,240,255,.06);color:#bfeaf2;cursor:pointer;}",
      ".enlg-pill[aria-pressed='true']{background:linear-gradient(135deg,rgba(122,240,255,.45),rgba(184,146,255,.30));",
      "  color:#06121a;border-color:rgba(122,240,255,.85);font-weight:700;}",
      ".enlg-tools{display:flex;align-items:center;gap:10px;padding:10px 18px;",
      "  border-bottom:1px solid rgba(122,240,255,.12);flex-wrap:wrap;}",
      ".enlg-search{flex:1;min-width:200px;padding:9px 14px;border-radius:10px;",
      "  border:1px solid rgba(122,240,255,.30);background:rgba(255,255,255,.05);",
      "  color:#eaf6ff;font-size:14px;outline:none;}",
      ".enlg-search:focus{border-color:rgba(122,240,255,.7);}",
      ".enlg-ttsrow{display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;",
      "  font-size:10.5px;letter-spacing:.05em;color:rgba(216,220,235,.75);}",
      ".enlg-body{flex:1;overflow-y:auto;padding:8px 18px 24px;-webkit-overflow-scrolling:touch;}",
      ".enlg-cat{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;",
      "  text-transform:uppercase;color:#f5c451;margin:18px 0 6px;padding-bottom:4px;",
      "  border-bottom:1px dashed rgba(245,196,81,.30);}",
      ".enlg-term{display:grid;grid-template-columns:minmax(150px,1.1fr) minmax(140px,1fr) 1.6fr;",
      "  gap:6px 14px;align-items:start;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.05);}",
      ".enlg-term:hover{background:rgba(122,240,255,.04);}",
      ".enlg-en{font-weight:700;color:#eaf6ff;font-size:14.5px;}",
      ".enlg-l1 .zh{font-size:16px;color:#ffd9a0;}",
      ".enlg-l1 .py{display:block;font-size:11px;color:rgba(216,220,235,.6);font-style:italic;}",
      ".enlg-l1 .es{font-size:14px;color:#b8ffc9;}",
      ".enlg-def{font-size:12.5px;line-height:1.45;color:rgba(216,220,235,.82);}",
      ".enlg-count{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:rgba(216,220,235,.55);}",
      ".enlg-empty{text-align:center;padding:40px 10px;color:rgba(216,220,235,.6);}",
      "@media (max-width:620px){",
      "  .enlg-modal{inset:0;width:100vw;height:100dvh;border-radius:0;transform:none;}",
      "  .enlg-term{grid-template-columns:1fr 1fr;}",
      "  .enlg-def{grid-column:1 / -1;} }"
    ].join("\n");
    var s = document.createElement("style");
    s.id = "enlg-styles";
    s.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(s);
  }

  function ttsBtn(text, lang, label) {
    var ra = root.MrMacsReadAloud;
    if (!ra || !ra.available()) return "";
    return ra.buttonHTML(text, { lang: lang, label: label });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function termRow(t, lang) {
    var l1 = "";
    if (lang === "zh" || lang === "both") {
      l1 += '<div><span class="zh">' + esc(t.zh) + '</span> ' +
            ttsBtn(t.zh, "zh-CN", "Read in Chinese") +
            '<span class="py">' + esc(t.pinyin) + "</span></div>";
    }
    if (lang === "es" || lang === "both") {
      l1 += '<div><span class="es">' + esc(t.es) + '</span> ' +
            ttsBtn(t.es, "es-ES", "Read in Spanish") + "</div>";
    }
    return '<div class="enlg-term" data-search="' +
      esc((t.en + " " + t.zh + " " + t.pinyin + " " + t.es).toLowerCase()) + '">' +
      '<div class="enlg-en">' + esc(t.en) + " " + ttsBtn(t.en, "en-US", "Read in English") + "</div>" +
      '<div class="enlg-l1">' + l1 + "</div>" +
      '<div class="enlg-def">' + esc(t.definition_en_simple || "") + " " +
        (t.definition_en_simple ? ttsBtn(t.definition_en_simple, "en-US", "Read the definition") : "") +
      "</div></div>";
  }

  function render(bodyEl, data, lang, query) {
    var q = (query || "").trim().toLowerCase();
    var html = "", shown = 0;
    (data.categories || []).forEach(function (cat) {
      var rows = (cat.terms || []).filter(function (t) {
        if (!q) return true;
        return (t.en + " " + t.zh + " " + t.pinyin + " " + t.es)
          .toLowerCase().indexOf(q) !== -1;
      });
      if (!rows.length) return;
      shown += rows.length;
      html += '<div class="enlg-cat">' + esc(cat.name) + ' <span class="enlg-count">· ' +
              rows.length + " terms</span></div>";
      rows.forEach(function (t) { html += termRow(t, lang); });
    });
    bodyEl.innerHTML = shown ? html :
      '<div class="enlg-empty">No terms match. Try the English word, 中文, pinyin, or español.</div>';
  }

  function open(src, title) {
    injectStyles();
    var prevFocus = document.activeElement;

    var backdrop = document.createElement("div");
    backdrop.className = "enlg-backdrop";
    var modal = document.createElement("div");
    modal.className = "enlg-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", title || "ENL Glossary");

    var lang = getLang();
    modal.innerHTML =
      '<div class="enlg-head">' +
        '<span class="enlg-title">' + BOOK_SVG + " " + esc(title || "ENL Glossary") + "</span>" +
        '<div class="enlg-pills" role="group" aria-label="Language">' +
          '<button class="enlg-pill" data-lang="zh" aria-pressed="' + (lang === "zh") + '">中文</button>' +
          '<button class="enlg-pill" data-lang="es" aria-pressed="' + (lang === "es") + '">Español</button>' +
          '<button class="enlg-pill" data-lang="both" aria-pressed="' + (lang === "both") + '">Both</button>' +
        "</div>" +
        '<button class="enlg-close" aria-label="Close glossary">&times;</button>' +
      "</div>" +
      '<div class="enlg-tools">' +
        '<input class="enlg-search" type="search" placeholder="Search… (English · 中文 · pinyin · español)"' +
        ' aria-label="Search glossary">' +
        '<span class="enlg-ttsrow"></span>' +
      "</div>" +
      '<div class="enlg-body"><div class="enlg-empty">Loading…</div></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    var bodyEl = modal.querySelector(".enlg-body");
    var searchEl = modal.querySelector(".enlg-search");
    var data = null;

    // TTS on/off toggle (only when the read-aloud engine is on the page)
    var ra = root.MrMacsReadAloud;
    var ttsRow = modal.querySelector(".enlg-ttsrow");
    if (ra && ra.available()) {
      var ttsBtnEl = document.createElement("button");
      ttsBtnEl.className = "enlg-pill";
      ttsBtnEl.type = "button";
      function paintTts() {
        var on = ra.isEnabled();
        ttsBtnEl.textContent = on ? "Read-aloud: ON" : "Read-aloud: OFF";
        ttsBtnEl.setAttribute("aria-pressed", String(on));
      }
      ttsBtnEl.addEventListener("click", function () {
        ra.setEnabled(!ra.isEnabled());
        paintTts();
      });
      paintTts();
      ttsRow.appendChild(ttsBtnEl);
    }

    function rerender() {
      if (data) render(bodyEl, data, getLang(), searchEl.value);
    }

    modal.querySelectorAll(".enlg-pill[data-lang]").forEach(function (p) {
      p.addEventListener("click", function () {
        setLang(p.dataset.lang);
        modal.querySelectorAll(".enlg-pill[data-lang]").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x.dataset.lang === p.dataset.lang));
        });
        rerender();
      });
    });
    searchEl.addEventListener("input", rerender);

    function close() {
      if (ra) { try { ra.stop(); } catch (e) {} }
      document.removeEventListener("keydown", onKey, true);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      if (prevFocus && document.contains(prevFocus)) {
        try { prevFocus.focus(); } catch (e) {}
      }
    }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    document.addEventListener("keydown", onKey, true);
    backdrop.addEventListener("click", close);
    modal.querySelector(".enlg-close").addEventListener("click", close);

    if (cache[src]) {
      data = cache[src];
      rerender();
    } else {
      fetch(src).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }).then(function (json) {
        cache[src] = json;
        data = json;
        rerender();
      }).catch(function () {
        bodyEl.innerHTML = '<div class="enlg-empty">Could not load the glossary right now.</div>';
      });
    }
    try { searchEl.focus(); } catch (e) {}
  }

  // Triggers: any [data-enl-glossary] element.
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest("[data-enl-glossary]");
    if (!btn) return;
    e.preventDefault();
    open(btn.getAttribute("data-glossary-src") || "assets/data/enl-glossary-global9.json",
         btn.getAttribute("data-glossary-title") || "ENL Glossary — Global 9");
  });

  root.MrMacsEnlGlossary = { open: open };
})(typeof window !== "undefined" ? window : globalThis);
