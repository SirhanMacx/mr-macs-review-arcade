/* Mr. Mac's Arcade — In-App Changelog Widget
 *
 * Surfaces new content/features since the player's last visit. Drawer-style
 * panel with editorial-card entries, plus an "update badge" pill that pulses
 * when unseen entries exist, plus an auto-show toast on first load after a
 * new release.
 *
 * Public API: window.MrMacsChangelog
 *   register(entries)            — add one or many entries
 *   markAllSeen()                — clears the unseen badge
 *   getUnseen()                  — entries newer than lastSeenTs
 *   mount(container, opts)       — { unmount }; renders the drawer panel
 *   renderUpdateBadge(container) — small "🆕 N new updates" pill
 *   checkAndShowOnLoad()         — bool; auto-toast if unseen exist
 *   on(event, handler) / off(event, handler)
 *
 * Events: "register" · "seen" · "panel:mount" · "panel:unmount" ·
 *         "panel:open" · "panel:close" · "badge:click"
 *
 * Storage: mr-macs-arcade-changelog-v1 → { lastSeenTs }
 *
 * Visual: editorial cards, JetBrains Mono for version pills, color-coded
 * item bullets (gold/cyan/violet/bronze). Reduced-motion: instant
 * transitions, no pulse.
 *
 * Idempotent: IIFE no-ops on re-load.
 */
(function (root) {
  "use strict";
  if (root.MrMacsChangelog) return;

  var STORAGE_KEY = "mr-macs-arcade-changelog-v1";
  var STYLE_ID = "arcade-changelog-styles";
  var ATTR_INSTANCE = "data-mclog-id";

  var entries = [];                 // [{ date, version, headline, items, ts }]
  var instances = [];               // mounted panels
  var nextId = 1;

  // ─── Tiny event bus ─────────────────────────────────────────────────
  var listeners = {};
  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (e) {}
    }
  }
  function on(event, handler) {
    if (typeof handler !== "function" || !event) return;
    (listeners[event] = listeners[event] || []).push(handler);
  }
  function off(event, handler) {
    var arr = listeners[event];
    if (!arr) return;
    if (!handler) { listeners[event] = []; return; }
    listeners[event] = arr.filter(function (h) { return h !== handler; });
  }

  // ─── Storage (safe on iOS Private Mode / disabled storage) ──────────
  function readStore() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { lastSeenTs: 0 };
      var obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : { lastSeenTs: 0 };
    } catch (e) { return { lastSeenTs: 0 }; }
  }
  function writeStore(obj) {
    try {
      if (root.localStorage) {
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj || {}));
      }
    } catch (e) {}
  }

  // ─── Reduced motion + small DOM helpers ─────────────────────────────
  function prefersReduced() {
    try {
      return root.matchMedia &&
             root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { return false; }
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function parseDateToTs(d) {
    if (!d) return 0;
    var t = Date.parse(d);
    return isNaN(t) ? 0 : t;
  }

  // ─── Entry registration ─────────────────────────────────────────────
  function normalizeEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    var date = String(raw.date || "").trim();
    var version = String(raw.version || "").trim();
    var headline = String(raw.headline || "").trim();
    var rawItems = Array.isArray(raw.items) ? raw.items : [];
    var items = [];
    for (var i = 0; i < rawItems.length; i++) {
      var it = rawItems[i];
      if (!it) continue;
      var kind = String(it.kind || "new").toLowerCase();
      if (kind !== "new" && kind !== "fix" && kind !== "perf" && kind !== "doc") {
        kind = "new";
      }
      var text = String(it.text || "").trim();
      if (!text) continue;
      items.push({ kind: kind, text: text });
    }
    if (!date && !version && !headline && !items.length) return null;
    return {
      date: date,
      version: version,
      headline: headline,
      items: items,
      ts: parseDateToTs(date)
    };
  }
  function entryKey(e) {
    return (e.date || "") + "|" + (e.version || "") + "|" + (e.headline || "");
  }
  function register(input) {
    if (!input) return;
    var arr = Array.isArray(input) ? input : [input];
    var seen = {};
    for (var i = 0; i < entries.length; i++) seen[entryKey(entries[i])] = true;
    var added = [];
    for (var j = 0; j < arr.length; j++) {
      var n = normalizeEntry(arr[j]);
      if (!n) continue;
      var k = entryKey(n);
      if (seen[k]) continue;
      seen[k] = true;
      entries.push(n);
      added.push(n);
    }
    // Reverse-chronological order; ties broken by version string.
    entries.sort(function (a, b) {
      if (b.ts !== a.ts) return b.ts - a.ts;
      return String(b.version).localeCompare(String(a.version));
    });
    if (added.length) {
      emit("register", { added: added, total: entries.length });
      refreshAllInstances();
    }
  }

  // ─── Public read helpers ────────────────────────────────────────────
  function getEntries() { return entries.slice(); }
  function getUnseen() {
    var ts = readStore().lastSeenTs || 0;
    return entries.filter(function (e) { return e.ts > ts; });
  }
  function unseenCount() { return getUnseen().length; }
  function markAllSeen() {
    writeStore({ lastSeenTs: Date.now() });
    emit("seen", { count: 0 });
    refreshAllInstances();
  }

  // ─── CSS (one-shot inject) ──────────────────────────────────────────
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = [
      ".mclog-badge{display:inline-flex;align-items:center;gap:6px;",
      "padding:5px 11px;border-radius:999px;border:1px solid #c89a4a;",
      "background:linear-gradient(180deg,#3b2a1a,#241710);color:#f6e3b8;",
      "font:600 12px/1 'JetBrains Mono',ui-monospace,monospace;",
      "cursor:pointer;letter-spacing:.04em;user-select:none;",
      "transition:transform .15s ease,box-shadow .15s ease;}",
      ".mclog-badge:hover{transform:translateY(-1px);",
      "box-shadow:0 4px 12px rgba(200,154,74,.35);}",
      ".mclog-badge[data-pulse='1']{animation:mclog-pulse 2.4s ease-in-out infinite;}",
      ".mclog-badge[data-empty='1']{opacity:.55;cursor:default;}",
      ".mclog-badge .mclog-dot{width:7px;height:7px;border-radius:50%;",
      "background:#ffd87a;box-shadow:0 0 8px #ffd87a;}",
      "@keyframes mclog-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,216,122,.55);}",
      "50%{box-shadow:0 0 0 8px rgba(255,216,122,0);}}",
      ".mclog-overlay{position:fixed;inset:0;background:rgba(8,5,3,.66);",
      "backdrop-filter:blur(2px);z-index:9998;opacity:0;",
      "transition:opacity .2s ease;}",
      ".mclog-overlay[data-open='1']{opacity:1;}",
      ".mclog-drawer{position:fixed;top:0;right:0;bottom:0;width:min(440px,92vw);",
      "background:#1a110a;border-left:1px solid #3a2a18;color:#f3e7cf;",
      "z-index:9999;display:flex;flex-direction:column;",
      "transform:translateX(100%);transition:transform .25s ease;",
      "box-shadow:-12px 0 40px rgba(0,0,0,.55);}",
      ".mclog-drawer[data-open='1']{transform:translateX(0);}",
      ".mclog-head{padding:18px 20px 12px;border-bottom:1px solid #3a2a18;",
      "background:linear-gradient(180deg,#241710,#1a110a);",
      "position:sticky;top:0;z-index:1;}",
      ".mclog-title{font:700 18px/1.2 Georgia,'Times New Roman',serif;",
      "color:#f6e3b8;letter-spacing:.02em;margin:0 0 4px;}",
      ".mclog-subtitle{font:500 12px/1.4 system-ui,sans-serif;",
      "color:#b89c70;margin:0 0 10px;}",
      ".mclog-actions{display:flex;gap:8px;}",
      ".mclog-btn{flex:1;padding:7px 11px;border-radius:6px;",
      "border:1px solid #5a3f22;background:#2a1c10;color:#f3e7cf;",
      "font:600 12px/1 'JetBrains Mono',ui-monospace,monospace;",
      "cursor:pointer;letter-spacing:.03em;",
      "transition:background .15s ease,border-color .15s ease;}",
      ".mclog-btn:hover{background:#3a2818;border-color:#c89a4a;}",
      ".mclog-btn[data-disabled='1']{opacity:.45;cursor:default;}",
      ".mclog-btn-close{flex:0 0 auto;padding:7px 10px;}",
      ".mclog-body{flex:1;overflow-y:auto;padding:14px 16px 24px;",
      "scrollbar-width:thin;scrollbar-color:#5a3f22 transparent;}",
      ".mclog-empty{padding:32px 12px;text-align:center;color:#8a7150;",
      "font:500 13px/1.5 system-ui,sans-serif;}",
      ".mclog-card{background:#241710;border:1px solid #3a2a18;",
      "border-radius:8px;padding:14px 14px 12px;margin:0 0 12px;",
      "position:relative;}",
      ".mclog-card[data-unseen='1']{border-color:#c89a4a;",
      "box-shadow:0 0 0 1px rgba(200,154,74,.35);}",
      ".mclog-card[data-unseen='1']::before{content:'NEW';position:absolute;",
      "top:-8px;right:10px;padding:2px 7px;border-radius:3px;",
      "background:#c89a4a;color:#1a110a;",
      "font:700 9px/1 'JetBrains Mono',ui-monospace,monospace;",
      "letter-spacing:.12em;}",
      ".mclog-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;",
      "margin:0 0 6px;}",
      ".mclog-date{font:500 11px/1 'JetBrains Mono',ui-monospace,monospace;",
      "color:#8a7150;letter-spacing:.04em;}",
      ".mclog-pill{padding:2px 7px;border-radius:3px;background:#3a2818;",
      "border:1px solid #5a3f22;color:#f6e3b8;",
      "font:700 10px/1 'JetBrains Mono',ui-monospace,monospace;",
      "letter-spacing:.06em;}",
      ".mclog-headline{font:700 14px/1.35 Georgia,'Times New Roman',serif;",
      "color:#f6e3b8;margin:0 0 8px;}",
      ".mclog-items{list-style:none;margin:0;padding:0;}",
      ".mclog-item{display:flex;gap:8px;padding:5px 0;",
      "font:500 12.5px/1.45 system-ui,sans-serif;color:#dcc99c;",
      "border-top:1px dashed rgba(90,63,34,.5);}",
      ".mclog-item:first-child{border-top:none;}",
      ".mclog-icon{flex:0 0 auto;width:22px;text-align:center;",
      "font-size:13px;line-height:1.4;}",
      ".mclog-text{flex:1;}",
      ".mclog-kind-new .mclog-icon{color:#ffd87a;}",
      ".mclog-kind-fix .mclog-icon{color:#7adcc9;}",
      ".mclog-kind-perf .mclog-icon{color:#c4a5ff;}",
      ".mclog-kind-doc .mclog-icon{color:#c89a4a;}",
      ".mclog-toast{position:fixed;bottom:20px;left:50%;",
      "transform:translateX(-50%) translateY(20px);",
      "background:#241710;border:1px solid #c89a4a;border-radius:8px;",
      "padding:10px 14px;color:#f6e3b8;display:flex;align-items:center;gap:10px;",
      "font:600 12.5px/1.3 system-ui,sans-serif;z-index:9997;",
      "box-shadow:0 8px 24px rgba(0,0,0,.5);opacity:0;",
      "transition:opacity .25s ease,transform .25s ease;cursor:pointer;}",
      ".mclog-toast[data-open='1']{opacity:1;transform:translateX(-50%) translateY(0);}",
      ".mclog-toast .mclog-toast-cta{color:#ffd87a;",
      "font:700 12px/1 'JetBrains Mono',ui-monospace,monospace;",
      "letter-spacing:.04em;}",
      "@media (prefers-reduced-motion: reduce){",
      ".mclog-badge[data-pulse='1']{animation:none;}",
      ".mclog-overlay,.mclog-drawer,.mclog-toast{transition:none!important;}",
      "}"
    ].join("");
    document.head.appendChild(s);
  }

  // ─── Render: a single entry card ────────────────────────────────────
  var KIND_ICON = { "new": "🆕", "fix": "🔧", "perf": "🚀", "doc": "📝" };
  function renderCard(entry, lastSeenTs) {
    var card = el("article", "mclog-card");
    if (entry.ts > (lastSeenTs || 0)) card.setAttribute("data-unseen", "1");
    var meta = el("div", "mclog-meta");
    if (entry.date) meta.appendChild(el("span", "mclog-date", entry.date));
    if (entry.version) meta.appendChild(el("span", "mclog-pill", entry.version));
    card.appendChild(meta);
    if (entry.headline) {
      card.appendChild(el("h3", "mclog-headline", entry.headline));
    }
    if (entry.items && entry.items.length) {
      var ul = el("ul", "mclog-items");
      for (var i = 0; i < entry.items.length; i++) {
        var it = entry.items[i];
        var li = el("li", "mclog-item mclog-kind-" + it.kind);
        var ic = el("span", "mclog-icon", KIND_ICON[it.kind] || "•");
        var tx = el("span", "mclog-text", it.text);
        li.appendChild(ic);
        li.appendChild(tx);
        ul.appendChild(li);
      }
      card.appendChild(ul);
    }
    return card;
  }

  // ─── Mount: render the drawer ───────────────────────────────────────
  function refreshAllInstances() {
    for (var i = instances.length - 1; i >= 0; i--) {
      var inst = instances[i];
      if (!inst.root || !inst.root.isConnected) {
        instances.splice(i, 1);
        continue;
      }
      try { inst.refresh(); } catch (e) {}
    }
    refreshAllBadges();
  }

  function buildDrawer(opts) {
    opts = opts || {};
    var overlay = el("div", "mclog-overlay");
    var drawer = el("aside", "mclog-drawer");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-label", "Changelog");

    var head = el("header", "mclog-head");
    head.appendChild(el("h2", "mclog-title", "What's New"));
    head.appendChild(el("p", "mclog-subtitle",
      "Recent updates to Mr. Mac's Arcade"));
    var actions = el("div", "mclog-actions");
    var btnSeen = el("button", "mclog-btn", "Mark all read");
    btnSeen.type = "button";
    var btnClose = el("button", "mclog-btn mclog-btn-close", "Close");
    btnClose.type = "button";
    actions.appendChild(btnSeen);
    actions.appendChild(btnClose);
    head.appendChild(actions);

    var body = el("div", "mclog-body");

    drawer.appendChild(head);
    drawer.appendChild(body);

    function refresh() {
      body.innerHTML = "";
      var lastSeen = readStore().lastSeenTs || 0;
      if (!entries.length) {
        body.appendChild(el("div", "mclog-empty",
          "No updates yet — check back soon."));
      } else {
        for (var i = 0; i < entries.length; i++) {
          body.appendChild(renderCard(entries[i], lastSeen));
        }
      }
      var unseen = unseenCount();
      btnSeen.textContent = unseen
        ? "Mark all read (" + unseen + ")"
        : "All caught up";
      btnSeen.setAttribute("data-disabled", unseen ? "0" : "1");
    }

    btnSeen.addEventListener("click", function () {
      if (unseenCount() === 0) return;
      markAllSeen();
    });
    btnClose.addEventListener("click", function () { close(); });
    overlay.addEventListener("click", function () { close(); });

    function open() {
      // Force a layout flush so the transition fires.
      overlay.getBoundingClientRect();
      drawer.getBoundingClientRect();
      overlay.setAttribute("data-open", "1");
      drawer.setAttribute("data-open", "1");
      emit("panel:open", null);
    }
    function close() {
      overlay.removeAttribute("data-open");
      drawer.removeAttribute("data-open");
      emit("panel:close", null);
      var ms = prefersReduced() ? 0 : 250;
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (drawer.parentNode) drawer.parentNode.removeChild(drawer);
      }, ms);
    }

    return {
      overlay: overlay,
      drawer: drawer,
      refresh: refresh,
      open: open,
      close: close
    };
  }

  function mount(container, opts) {
    ensureStyles();
    opts = opts || {};
    var host = container || document.body;
    if (!host) return { unmount: function () {} };
    var id = nextId++;
    var built = buildDrawer(opts);
    built.overlay.setAttribute(ATTR_INSTANCE, String(id));
    built.drawer.setAttribute(ATTR_INSTANCE, String(id));
    host.appendChild(built.overlay);
    host.appendChild(built.drawer);
    built.refresh();
    requestAnimationFrame(function () { built.open(); });

    var inst = {
      id: id,
      root: built.drawer,
      refresh: built.refresh,
      close: built.close
    };
    instances.push(inst);
    emit("panel:mount", { id: id });

    return {
      unmount: function () {
        built.close();
        for (var i = instances.length - 1; i >= 0; i--) {
          if (instances[i].id === id) instances.splice(i, 1);
        }
        emit("panel:unmount", { id: id });
      }
    };
  }

  // ─── Update badge ───────────────────────────────────────────────────
  var badges = []; // { el, host }
  function refreshAllBadges() {
    var n = unseenCount();
    for (var i = badges.length - 1; i >= 0; i--) {
      var b = badges[i];
      if (!b.el || !b.el.isConnected) { badges.splice(i, 1); continue; }
      paintBadge(b.el, n);
    }
  }
  function paintBadge(node, n) {
    var label = n > 0
      ? "🆕 " + n + " new update" + (n === 1 ? "" : "s")
      : "Up to date";
    node.innerHTML = "";
    if (n > 0) node.appendChild(el("span", "mclog-dot"));
    node.appendChild(document.createTextNode(label));
    node.setAttribute("data-count", String(n));
    node.setAttribute("data-empty", n > 0 ? "0" : "1");
    node.setAttribute("data-pulse", (n > 0 && !prefersReduced()) ? "1" : "0");
    node.setAttribute("aria-label",
      n > 0 ? n + " unread changelog updates" : "Changelog up to date");
  }
  function renderUpdateBadge(container) {
    ensureStyles();
    if (!container) return null;
    var node = el("button", "mclog-badge");
    node.type = "button";
    paintBadge(node, unseenCount());
    node.addEventListener("click", function () {
      emit("badge:click", { count: unseenCount() });
      if (node.getAttribute("data-empty") === "1" && unseenCount() === 0) {
        // Still allow opening even if up-to-date — useful for re-reading.
      }
      mount(document.body);
    });
    container.appendChild(node);
    badges.push({ el: node, host: container });
    return node;
  }

  // ─── Auto-show on load ──────────────────────────────────────────────
  function checkAndShowOnLoad() {
    // The topbar badge is persistent; do not cover the launch deck with
    // an automatic toast on page load.
    return false;
    var n = unseenCount();
    if (n <= 0) return false;
    ensureStyles();
    var toast = el("div", "mclog-toast");
    toast.setAttribute("role", "status");
    toast.appendChild(document.createTextNode(
      "🆕 " + n + " new update" + (n === 1 ? "" : "s") + " · "));
    toast.appendChild(el("span", "mclog-toast-cta", "See what's new"));
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.setAttribute("data-open", "1"); });

    var dismissed = false;
    function dismiss(openPanel) {
      if (dismissed) return;
      dismissed = true;
      toast.removeAttribute("data-open");
      var ms = prefersReduced() ? 0 : 250;
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, ms);
      if (openPanel) mount(document.body);
    }
    toast.addEventListener("click", function () { dismiss(true); });
    setTimeout(function () { dismiss(false); }, 9000);
    return true;
  }

  // ─── Public surface ─────────────────────────────────────────────────
  root.MrMacsChangelog = {
    register: register,
    markAllSeen: markAllSeen,
    getUnseen: getUnseen,
    getEntries: getEntries,
    mount: mount,
    renderUpdateBadge: renderUpdateBadge,
    checkAndShowOnLoad: checkAndShowOnLoad,
    on: on,
    off: off,
    STORAGE_KEY: STORAGE_KEY
  };

  // ─── Built-in entries (self-contained) ──────────────────────────────
  register([
    {
      date: "2026-05-10",
      version: "v3.1",
      headline: "Polish sweep — UI/overlay fixes + audit-report follow-through",
      items: [
        { kind: "fix", text: "Module dependency Finding A: leaderboards + sessions modules now win their namespaces (globe.personalBest() works again)" },
        { kind: "fix", text: "24 round-3 games got runtime bug fixes (modal flow, save/resume, particle caps, race-condition guards)" },
        { kind: "fix", text: "6 typo bugs swept across 4 older games (MrMacsAnalytics.track / MrMacsToasts.show)" },
        { kind: "fix", text: "Achievement pop-ups no longer block hub UI behind them" },
        { kind: "fix", text: "Modal z-index hierarchy + mobile HUD overflow across all 35 flagships" },
        { kind: "new", text: "Collapsed two May-2026 callouts into single 25-cabinet banner" },
        { kind: "new", text: "Welcome dialog softened — all fields optional, CTA always active" },
        { kind: "new", text: "+60 💎 payout chip on Daily Challenge CTA" },
        { kind: "new", text: "Newest sort option added to library" },
        { kind: "new", text: "End-of-run achievement recap module (arcade-end-recap.js)" },
        { kind: "new", text: "Exit Arcade button + How to Play overlay shared helpers" }
      ]
    },
    {
      date: "2026-05-09",
      version: "v3.0",
      headline: "Round-3 Mega Sweep — 16 new flagships + 16 polish modules",
      items: [
        { kind: "new", text: "16 new arcade games shipped (Snake Pit, Pinball Empire, Defender Drift, Boggle Beat, Sudoku Scribe, Memory Palace, Knight's Quest, Crossword Cabinet, Pong Doctor, Atlas 2048, Bomb Scribe, Chess Cabinet, Solitaire Hall, Archive Tycoon, Cube Crash, Word Bridge)" },
        { kind: "new", text: "Mascot module — Mr. Mac wanders the hub" },
        { kind: "new", text: "Replay module — record + replay your best runs" },
        { kind: "new", text: "Classroom mode — teachers can see aggregate stats across multiple device profiles" },
        { kind: "new", text: "Per-game tutorials, difficulty selectors, screenshot capture, deep-link routing" },
        { kind: "fix", text: "Safari iOS ≤13 / macOS ≤13 EventTarget crash" },
        { kind: "fix", text: "iOS Private Mode sessionStorage crash" }
      ]
    },
    {
      date: "2026-05-09",
      version: "v2.5",
      headline: "Round-2 Sweep — 5 more flagships + 6 modules",
      items: [
        { kind: "new", text: "Tron Trails, Plinko Lab, Tower Climb, Mahjong Mosaic, Reflex Run" },
        { kind: "new", text: "Cram Mode, Onboarding Flow, Quick Stats Panel, Recommender, Keyboard Remap, Dev Tools" },
        { kind: "new", text: "20 new flagship-tier achievements" },
        { kind: "new", text: "19 hand-crafted SVG game-card thumbnails" }
      ]
    },
    {
      date: "2026-05-08",
      version: "v2.0",
      headline: "May 2026 First Sweep — 9 new flagships",
      items: [
        { kind: "new", text: "Brickoria, Stellar Drift, Source Snake, Chronoblocks, Cascade, Chronohop, Step Pyramid, Citadel, Rumor Whack" },
        { kind: "new", text: "Galaxy Defender, Echo Hall, Sokoban Scribe, Centiquill, Anagram Atlas" },
        { kind: "new", text: "Achievement system, Power-up shop, Daily Challenge claim API, New Cabinet rail" },
        { kind: "fix", text: "Visibility fix — All Courses games now show for all enrolled students" }
      ]
    }
  ]);
})(typeof window !== "undefined" ? window : this);
