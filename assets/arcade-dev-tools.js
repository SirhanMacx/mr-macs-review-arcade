/* Mr. Mac's Arcade — Developer / QA Tools Panel
 *
 * Hidden inspector for profile state, achievements, shop, and live events.
 * Session-only (no persistence). Locked behind activation sequences so it
 * never shows up for ordinary players.
 *
 * Activation:
 *   1. Konami-variant: ArrowUp ArrowUp ArrowDown ArrowDown
 *                      ArrowLeft ArrowRight ArrowLeft ArrowRight  D
 *      (Note: distinct from the main hub's "...ba" Konami so the two
 *       easter eggs don't collide.)
 *   2. Type "/dev" anywhere on the page (case-insensitive, no input focused)
 *   3. Triple-click any element with class "brand-mark" while holding Shift
 *   4. Console: window.MrMacsDevTools.open()
 *
 * Public API (window.MrMacsDevTools):
 *   open(), close(), toggle(), isOpen()
 *   forceUnlock(achievementId) -> bool
 *   giveShards(amount) -> number   (returns new total)
 *   resetProfile(confirm=false) -> bool
 *   exportSnapshot() -> string (JSON)
 *   importSnapshot(jsonStr) -> bool
 *   on(event, handler), off(event, handler)
 *
 * Internal events emitted by DevTools (independent of MrMacsProfile):
 *   "devtools:open"        {}
 *   "devtools:close"       {}
 *   "devtools:tab"         { tab }
 *   "devtools:action"      { action, payload? }
 *
 * Dependencies (all optional — every call is wrapped in try/catch):
 *   window.MrMacsProfile      — primary data source
 *   window.MrMacsToast        — soft confirmations (push/shards/achievement)
 *   window.MrMacsCelebration  — not directly invoked, but referenced safely
 */
(function (root) {
  "use strict";

  if (root.MrMacsDevTools) return;

  // ============================================================
  // Safe wrappers around external APIs
  // ============================================================
  function safeProfile(method) {
    try {
      var P = root.MrMacsProfile;
      if (!P || typeof P[method] !== "function") return undefined;
      var args = Array.prototype.slice.call(arguments, 1);
      return P[method].apply(P, args);
    } catch (e) {
      return undefined;
    }
  }

  function safeToast(kind, msg) {
    try {
      var T = root.MrMacsToast;
      if (!T) return;
      if (kind === "shards" && typeof T.shards === "function") { T.shards(msg); return; }
      if (kind === "achievement" && typeof T.achievement === "function") { T.achievement(msg); return; }
      if (typeof T.push === "function") T.push(msg);
    } catch (e) { /* swallow */ }
  }

  // ============================================================
  // Internal event bus (lightweight, no DOM dependency)
  // ============================================================
  var listeners = {};
  function emit(event, detail) {
    var arr = listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](detail || {}); } catch (e) { /* swallow */ }
    }
  }
  function on(event, handler) {
    if (typeof handler !== "function") return;
    listeners[event] = listeners[event] || [];
    listeners[event].push(handler);
  }
  function off(event, handler) {
    var arr = listeners[event];
    if (!arr) return;
    var idx = arr.indexOf(handler);
    if (idx !== -1) arr.splice(idx, 1);
  }

  // ============================================================
  // CSS — injected once, scoped under .arcade-devtools
  // ============================================================
  var STYLE_ID = "arcade-dev-tools-styles";
  var CSS = [
    ".arcade-devtools{position:fixed;top:16px;right:16px;width:380px;height:600px;",
    "background:#0c0e14;color:#e8e6da;font-family:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;",
    "font-size:12px;line-height:1.45;border:1px solid #c69850;border-radius:6px;",
    "box-shadow:0 18px 48px rgba(0,0,0,.65),0 0 0 1px rgba(198,152,80,.25);",
    "z-index:2147483600;display:flex;flex-direction:column;overflow:hidden;}",
    ".arcade-devtools[hidden]{display:none!important;}",
    ".arcade-devtools__hdr{display:flex;align-items:center;gap:8px;padding:8px 10px;",
    "background:linear-gradient(180deg,#1a1d29,#10131c);border-bottom:1px solid #2a2e3c;}",
    ".arcade-devtools__title{flex:1;font-weight:700;color:#f3d28d;letter-spacing:.5px;}",
    ".arcade-devtools__hint{color:#7a7868;font-size:10px;}",
    ".arcade-devtools__close{appearance:none;background:#2a1a16;color:#f3d28d;border:1px solid #5a3a30;",
    "border-radius:4px;width:22px;height:22px;cursor:pointer;font-family:inherit;font-size:13px;line-height:1;}",
    ".arcade-devtools__close:hover{background:#5a2a22;color:#fff;}",
    ".arcade-devtools__tabs{display:flex;border-bottom:1px solid #2a2e3c;background:#0e1119;}",
    ".arcade-devtools__tab{flex:1;appearance:none;background:transparent;color:#8a8878;border:0;",
    "border-bottom:2px solid transparent;padding:7px 4px;cursor:pointer;font-family:inherit;",
    "font-size:11px;letter-spacing:.4px;text-transform:uppercase;}",
    ".arcade-devtools__tab:hover{color:#e8e6da;background:rgba(198,152,80,.06);}",
    ".arcade-devtools__tab[aria-selected='true']{color:#f3d28d;border-bottom-color:#c69850;",
    "background:rgba(198,152,80,.08);}",
    ".arcade-devtools__body{flex:1;overflow:auto;padding:10px;}",
    ".arcade-devtools__section{margin-bottom:12px;}",
    ".arcade-devtools__section h4{margin:0 0 6px 0;font-size:11px;color:#c69850;",
    "letter-spacing:.6px;text-transform:uppercase;}",
    ".arcade-devtools__row{display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap;}",
    ".arcade-devtools__btn{appearance:none;background:#1a1d29;color:#e8e6da;border:1px solid #3a3e4c;",
    "border-radius:4px;padding:5px 9px;cursor:pointer;font-family:inherit;font-size:11px;}",
    ".arcade-devtools__btn:hover{background:#252836;border-color:#c69850;color:#f3d28d;}",
    ".arcade-devtools__btn:active{background:#0e1119;}",
    ".arcade-devtools__btn--primary{background:#3a2a14;border-color:#c69850;color:#f3d28d;}",
    ".arcade-devtools__btn--primary:hover{background:#5a3a20;}",
    ".arcade-devtools__btn--danger{background:#2a1410;border-color:#a04030;color:#ff9080;}",
    ".arcade-devtools__btn--danger:hover{background:#5a1a14;color:#fff;}",
    ".arcade-devtools__btn--unlocked{background:#0e2418;border-color:#3a8050;color:#80d090;}",
    ".arcade-devtools__btn[disabled]{opacity:.5;cursor:not-allowed;}",
    ".arcade-devtools__input{background:#0e1119;color:#e8e6da;border:1px solid #3a3e4c;",
    "border-radius:4px;padding:4px 6px;font-family:inherit;font-size:11px;width:90px;}",
    ".arcade-devtools__input:focus{outline:0;border-color:#c69850;}",
    ".arcade-devtools__code{background:#06080d;border:1px solid #1a1d29;border-radius:4px;",
    "padding:8px;font-size:10.5px;line-height:1.5;color:#cfcdb8;white-space:pre-wrap;",
    "word-break:break-word;max-height:340px;overflow:auto;}",
    ".arcade-devtools__code .k{color:#7eb6d6;}",  // key
    ".arcade-devtools__code .s{color:#c69850;}",  // string
    ".arcade-devtools__code .n{color:#80d090;}",  // number
    ".arcade-devtools__code .b{color:#d098c8;}",  // bool/null
    ".arcade-devtools__log{font-size:10.5px;background:#06080d;border:1px solid #1a1d29;",
    "border-radius:4px;padding:6px;max-height:480px;overflow:auto;}",
    ".arcade-devtools__log-entry{padding:3px 4px;border-bottom:1px solid #14171f;display:flex;gap:6px;}",
    ".arcade-devtools__log-entry:last-child{border-bottom:0;}",
    ".arcade-devtools__log-entry time{color:#7a7868;flex:0 0 50px;}",
    ".arcade-devtools__log-entry .ev{color:#c69850;flex:0 0 130px;overflow:hidden;text-overflow:ellipsis;}",
    ".arcade-devtools__log-entry .pl{color:#cfcdb8;flex:1;overflow:hidden;text-overflow:ellipsis;",
    "white-space:nowrap;}",
    ".arcade-devtools__empty{color:#7a7868;font-style:italic;padding:8px 4px;}",
    ".arcade-devtools__grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;}"
  ].join("");

  function injectStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // ============================================================
  // JSON syntax highlighter (plain regex; no external dep)
  // ============================================================
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function highlightJson(obj) {
    var raw;
    try { raw = JSON.stringify(obj, null, 2); } catch (e) { return escapeHtml(String(obj)); }
    if (raw === undefined) return "<em>undefined</em>";
    var html = escapeHtml(raw);
    // strings (incl. keys), numbers, bool/null
    return html.replace(
      /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        if (/^"/.test(match)) {
          return /:\s*$/.test(match)
            ? '<span class="k">' + match + '</span>'
            : '<span class="s">' + match + '</span>';
        }
        if (/true|false|null/.test(match)) return '<span class="b">' + match + '</span>';
        return '<span class="n">' + match + '</span>';
      }
    );
  }

  // ============================================================
  // DOM construction
  // ============================================================
  var panel = null;
  var bodyEl = null;
  var tabBtns = {};
  var currentTab = "profile";
  var eventLog = [];   // { ts, name, payload }
  var MAX_LOG = 200;
  var subscribed = false;
  var subscribedNames = [];

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "on" && attrs[k]) {
          for (var ev in attrs[k]) {
            if (Object.prototype.hasOwnProperty.call(attrs[k], ev)) {
              node.addEventListener(ev, attrs[k][ev]);
            }
          }
        } else if (k.indexOf("data-") === 0 || k === "id" || k === "type" ||
                   k === "placeholder" || k === "title" || k === "aria-label" ||
                   k === "aria-selected" || k === "aria-hidden" || k === "role") {
          node.setAttribute(k, attrs[k]);
        } else if (k === "className") node.className = attrs[k];
        else if (k === "disabled" && attrs[k]) node.setAttribute("disabled", "");
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        if (children[i]) node.appendChild(children[i]);
      }
    }
    return node;
  }

  function build() {
    if (panel) return;
    injectStyles();

    panel = el("div", {
      className: "arcade-devtools",
      role: "dialog",
      "aria-label": "Mr. Mac's Arcade developer tools",
      "aria-hidden": "true"
    });
    panel.hidden = true;

    var hdr = el("div", { className: "arcade-devtools__hdr" }, [
      el("div", { className: "arcade-devtools__title", text: "🛠 Dev Tools" }),
      el("div", { className: "arcade-devtools__hint", text: "type /dev" }),
      el("button", {
        className: "arcade-devtools__close",
        "aria-label": "Close dev tools",
        text: "×",
        on: { click: function () { close(); } }
      })
    ]);

    var tabs = el("div", { className: "arcade-devtools__tabs", role: "tablist" });
    var tabSpec = [
      { id: "profile",      label: "Profile" },
      { id: "achievements", label: "Achv" },
      { id: "shop",         label: "Shop" },
      { id: "events",       label: "Events" }
    ];
    tabBtns = {};
    tabSpec.forEach(function (t) {
      var btn = el("button", {
        className: "arcade-devtools__tab",
        role: "tab",
        "aria-selected": t.id === currentTab ? "true" : "false",
        text: t.label,
        on: { click: function () { selectTab(t.id); } }
      });
      tabBtns[t.id] = btn;
      tabs.appendChild(btn);
    });

    bodyEl = el("div", { className: "arcade-devtools__body" });

    panel.appendChild(hdr);
    panel.appendChild(tabs);
    panel.appendChild(bodyEl);
    document.body.appendChild(panel);
  }

  function selectTab(id) {
    currentTab = id;
    for (var k in tabBtns) {
      if (Object.prototype.hasOwnProperty.call(tabBtns, k)) {
        tabBtns[k].setAttribute("aria-selected", k === id ? "true" : "false");
      }
    }
    render();
    emit("devtools:tab", { tab: id });
  }

  // ============================================================
  // Tab renderers
  // ============================================================
  function renderProfile() {
    var snapshot = safeProfile("get") || {};
    var lifetime = safeProfile("getLifetimeStats") || {};
    var section = el("div", { className: "arcade-devtools__section" }, [
      el("h4", { text: "Lifetime Stats" }),
      el("pre", { className: "arcade-devtools__code", html: highlightJson(lifetime) })
    ]);
    var actions = el("div", { className: "arcade-devtools__row" }, [
      el("button", {
        className: "arcade-devtools__btn arcade-devtools__btn--primary",
        text: "Copy JSON",
        on: { click: function () { copyToClipboard(JSON.stringify(snapshot, null, 2)); } }
      }),
      el("button", {
        className: "arcade-devtools__btn",
        text: "Refresh",
        on: { click: render }
      }),
      el("button", {
        className: "arcade-devtools__btn arcade-devtools__btn--danger",
        text: "Wipe Profile",
        on: { click: function () {
          if (typeof root.confirm !== "function") return;
          if (root.confirm("Wipe ALL profile data? This cannot be undone.")) {
            api.resetProfile(true);
            render();
          }
        } }
      })
    ]);
    var jsonSection = el("div", { className: "arcade-devtools__section" }, [
      el("h4", { text: "Profile Snapshot" }),
      el("pre", { className: "arcade-devtools__code", html: highlightJson(snapshot) })
    ]);
    bodyEl.innerHTML = "";
    bodyEl.appendChild(actions);
    bodyEl.appendChild(section);
    bodyEl.appendChild(jsonSection);
  }

  function renderAchievements() {
    bodyEl.innerHTML = "";
    var list = safeProfile("listAchievements") || [];
    var unlocked = {};
    list.forEach(function (a) { if (a && a.unlocked) unlocked[a.id] = true; });

    var P = root.MrMacsProfile;
    var allDefs = (P && P.ACHIEVEMENTS) ? P.ACHIEVEMENTS : list;
    if (!allDefs.length) {
      bodyEl.appendChild(el("div", { className: "arcade-devtools__empty",
        text: "No achievements available (MrMacsProfile not loaded)." }));
      return;
    }

    var heading = el("div", { className: "arcade-devtools__section" }, [
      el("h4", { text: "Force Unlock (" +
        Object.keys(unlocked).length + " / " + allDefs.length + ")" })
    ]);
    bodyEl.appendChild(heading);

    var grid = el("div", { className: "arcade-devtools__grid" });
    allDefs.forEach(function (def) {
      var isUnlocked = !!unlocked[def.id];
      var btn = el("button", {
        className: "arcade-devtools__btn" + (isUnlocked ? " arcade-devtools__btn--unlocked" : ""),
        title: (def.title || def.id) + " — " + (def.desc || ""),
        text: (isUnlocked ? "✓ " : "") + (def.icon ? def.icon + " " : "") + (def.title || def.id),
        on: { click: function () {
          api.forceUnlock(def.id);
          render();
        } }
      });
      grid.appendChild(btn);
    });
    bodyEl.appendChild(grid);
  }

  function renderShop() {
    bodyEl.innerHTML = "";
    var P = root.MrMacsProfile;
    var items = (P && P.SHOP_ITEMS) ? P.SHOP_ITEMS : {};
    var current = safeProfile("getShards");
    var inv = safeProfile("getInventory") || {};

    bodyEl.appendChild(el("div", { className: "arcade-devtools__section" }, [
      el("h4", { text: "Wallet (" + (current === undefined ? "—" : current) + " shards)" }),
      (function () {
        var input = el("input", {
          className: "arcade-devtools__input",
          type: "number",
          placeholder: "Amount",
          "aria-label": "Shard amount"
        });
        input.value = "100";
        return el("div", { className: "arcade-devtools__row" }, [
          input,
          el("button", {
            className: "arcade-devtools__btn arcade-devtools__btn--primary",
            text: "Give",
            on: { click: function () {
              var n = parseInt(input.value, 10);
              if (!isNaN(n) && n !== 0) api.giveShards(n);
              render();
            } }
          }),
          el("button", {
            className: "arcade-devtools__btn",
            text: "+50",
            on: { click: function () { api.giveShards(50); render(); } }
          }),
          el("button", {
            className: "arcade-devtools__btn",
            text: "+1000",
            on: { click: function () { api.giveShards(1000); render(); } }
          })
        ]);
      })()
    ]));

    var grantSection = el("div", { className: "arcade-devtools__section" }, [
      el("h4", { text: "Grant Items (free)" })
    ]);
    bodyEl.appendChild(grantSection);
    var grid = el("div", { className: "arcade-devtools__grid" });
    Object.keys(items).forEach(function (id) {
      var spec = items[id] || {};
      var owned = inv[id];
      var label = (spec.icon ? spec.icon + " " : "") + (spec.label || id);
      if (typeof owned === "number" && owned > 0) label += " (" + owned + ")";
      grid.appendChild(el("button", {
        className: "arcade-devtools__btn",
        title: (spec.label || id) + " — " + (spec.desc || ""),
        text: label,
        on: { click: function () {
          giveItemViaTopUp(id);
          render();
        } }
      }));
    });
    grantSection.appendChild(grid);

    var dispelSection = el("div", { className: "arcade-devtools__section" }, [
      el("h4", { text: "Dispel Buffs" })
    ]);
    bodyEl.appendChild(dispelSection);
    dispelSection.appendChild(el("div", { className: "arcade-devtools__row" }, [
      el("button", {
        className: "arcade-devtools__btn",
        text: "Dispel Lucky Charm",
        on: { click: function () {
          safeProfile("dispelBuff", "luckyCharm");
          emit("devtools:action", { action: "dispelBuff", payload: { itemId: "luckyCharm" } });
          render();
        } }
      }),
      el("button", {
        className: "arcade-devtools__btn",
        text: "Dispel Coin Doubler",
        on: { click: function () {
          safeProfile("dispelBuff", "coinDoubler");
          emit("devtools:action", { action: "dispelBuff", payload: { itemId: "coinDoubler" } });
          render();
        } }
      })
    ]));
  }

  function renderEvents() {
    bodyEl.innerHTML = "";
    var head = el("div", { className: "arcade-devtools__section" }, [
      el("h4", { text: "Live Event Log (" + eventLog.length + ")" }),
      el("div", { className: "arcade-devtools__row" }, [
        el("button", {
          className: "arcade-devtools__btn",
          text: "Clear",
          on: { click: function () { eventLog = []; render(); } }
        }),
        el("button", {
          className: "arcade-devtools__btn",
          text: "Copy",
          on: { click: function () { copyToClipboard(JSON.stringify(eventLog, null, 2)); } }
        })
      ])
    ]);
    bodyEl.appendChild(head);

    var log = el("div", { className: "arcade-devtools__log" });
    if (!eventLog.length) {
      log.appendChild(el("div", { className: "arcade-devtools__empty",
        text: "No events captured yet. Trigger gameplay to populate." }));
    } else {
      // Show newest first, capped to most recent 100 visible
      var visible = eventLog.slice(-100).reverse();
      visible.forEach(function (entry) {
        var time = new Date(entry.ts);
        var hh = String(time.getHours()).padStart(2, "0");
        var mm = String(time.getMinutes()).padStart(2, "0");
        var ss = String(time.getSeconds()).padStart(2, "0");
        var preview;
        try {
          preview = JSON.stringify(entry.payload);
          if (preview && preview.length > 80) preview = preview.slice(0, 77) + "...";
        } catch (e) { preview = "[unserializable]"; }
        log.appendChild(el("div", { className: "arcade-devtools__log-entry" }, [
          el("time", { text: hh + ":" + mm + ":" + ss }),
          el("span", { className: "ev", text: entry.name }),
          el("span", { className: "pl", text: preview || "" })
        ]));
      });
    }
    bodyEl.appendChild(log);
  }

  function render() {
    if (!bodyEl) return;
    if (currentTab === "achievements") return renderAchievements();
    if (currentTab === "shop")         return renderShop();
    if (currentTab === "events")       return renderEvents();
    return renderProfile();
  }

  // ============================================================
  // Profile event subscription (for the Events tab log)
  // ============================================================
  function recordEvent(name) {
    return function (detail) {
      eventLog.push({ ts: Date.now(), name: name, payload: detail });
      if (eventLog.length > MAX_LOG) eventLog.splice(0, eventLog.length - MAX_LOG);
      if (panel && !panel.hidden && currentTab === "events") render();
    };
  }
  function subscribeEvents() {
    if (subscribed) return;
    var P = root.MrMacsProfile;
    if (!P || typeof P.on !== "function") return;
    var names;
    try {
      names = (typeof P.eventNames === "function") ? P.eventNames() : null;
    } catch (e) { names = null; }
    if (!names || !names.length) {
      names = [
        "profile:update", "profile:create", "profile:wipe", "profile:import",
        "wallet:change", "achievement:unlock", "settings:change",
        "streak:advance", "course:change", "testprep:change",
        "inventory:change", "answer:record", "daily:claim", "roster:change"
      ];
    }
    subscribedNames = names.slice();
    subscribedNames.forEach(function (n) {
      try {
        var handler = recordEvent(n);
        P.on(n, handler);
        // store handler so we could unbind if ever needed
        subscribedHandlers[n] = handler;
      } catch (e) { /* swallow */ }
    });
    subscribed = true;
  }
  var subscribedHandlers = {};

  // ============================================================
  // Helpers
  // ============================================================
  function copyToClipboard(text) {
    try {
      if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
        root.navigator.clipboard.writeText(text);
        safeToast("push", "Copied to clipboard");
        return;
      }
    } catch (e) { /* fall through */ }
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      safeToast("push", "Copied to clipboard");
    } catch (e) { /* swallow */ }
  }

  // Grant a shop item without the cost gate by topping up shards then buying.
  function giveItemViaTopUp(id) {
    var P = root.MrMacsProfile;
    if (!P) return false;
    try {
      var spec = (P.SHOP_ITEMS || {})[id];
      if (!spec) return false;
      var have = (typeof P.getShards === "function") ? P.getShards() : 0;
      if (have < spec.cost) {
        safeProfile("addShards", spec.cost - have, "dev-tools");
      }
      var result = safeProfile("buyItem", id);
      emit("devtools:action", { action: "grantItem", payload: { id: id, result: result } });
      return !!(result && result.ok);
    } catch (e) {
      return false;
    }
  }

  // ============================================================
  // Activation triggers
  // ============================================================
  var KONAMI_DEV = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
                    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "d"];
  var konamiBuf = [];
  var typedBuf = "";
  var TYPED_TRIGGER = "/dev";
  var brandClickStreak = 0;
  var brandClickResetTimer = null;

  function isInputFocused() {
    var ae = document.activeElement;
    if (!ae) return false;
    var tag = (ae.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (ae.isContentEditable) return true;
    return false;
  }

  function onKeyDown(e) {
    if (isInputFocused()) {
      // Allow typed trigger only when no input is focused; reset to prevent leakage.
      typedBuf = "";
      konamiBuf = [];
      return;
    }

    // Konami buffer (compare arrow key codes verbatim, last char case-insensitive)
    var k = e.key;
    var expected = KONAMI_DEV[konamiBuf.length];
    var matches = (expected === k) ||
                  (expected && expected.length === 1 && k && k.length === 1 &&
                   expected.toLowerCase() === k.toLowerCase());
    if (matches) {
      konamiBuf.push(expected);
      if (konamiBuf.length === KONAMI_DEV.length) {
        konamiBuf = [];
        api.toggle();
      }
    } else {
      // try to restart on first key
      if (k === KONAMI_DEV[0]) konamiBuf = [k];
      else konamiBuf = [];
    }

    // Typed "/dev" trigger
    if (k && k.length === 1) {
      typedBuf = (typedBuf + k).slice(-TYPED_TRIGGER.length).toLowerCase();
      if (typedBuf === TYPED_TRIGGER.toLowerCase()) {
        typedBuf = "";
        api.toggle();
      }
    } else if (k === "Escape" && api.isOpen()) {
      // Convenience close
      close();
    }
  }

  function onClick(e) {
    var target = e.target;
    if (!target || typeof target.closest !== "function") return;
    var brand = target.closest(".brand-mark");
    if (!brand || !e.shiftKey) {
      brandClickStreak = 0;
      return;
    }
    brandClickStreak += 1;
    if (brandClickResetTimer) clearTimeout(brandClickResetTimer);
    brandClickResetTimer = setTimeout(function () { brandClickStreak = 0; }, 800);
    if (brandClickStreak >= 3) {
      brandClickStreak = 0;
      api.toggle();
    }
  }

  function bindActivation() {
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("click", onClick, true);
  }

  // ============================================================
  // Public API
  // ============================================================
  function open() {
    if (typeof document === "undefined") return false;
    build();
    subscribeEvents();
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    render();
    emit("devtools:open", {});
    return true;
  }
  function close() {
    if (!panel) return false;
    panel.hidden = true;
    panel.setAttribute("aria-hidden", "true");
    emit("devtools:close", {});
    return true;
  }
  function toggle() { return isOpen() ? close() : open(); }
  function isOpen() { return !!(panel && !panel.hidden); }

  function forceUnlock(achievementId) {
    if (!achievementId) return false;
    var result = safeProfile("unlock", achievementId);
    emit("devtools:action", { action: "forceUnlock",
      payload: { id: achievementId, result: !!result } });
    return !!result;
  }

  function giveShards(amount) {
    var n = parseInt(amount, 10);
    if (isNaN(n) || n === 0) return safeProfile("getShards") || 0;
    if (n > 0) safeProfile("addShards", n, "dev-tools");
    else       safeProfile("spendShards", -n, "dev-tools");
    var total = safeProfile("getShards") || 0;
    emit("devtools:action", { action: "giveShards", payload: { amount: n, total: total } });
    return total;
  }

  function resetProfile(confirmFlag) {
    if (confirmFlag !== true) return false;
    try {
      var P = root.MrMacsProfile;
      if (P && typeof P.resetProfile === "function") {
        P.resetProfile({ confirm: true });
      } else {
        safeProfile("reset");
      }
      emit("devtools:action", { action: "resetProfile" });
      return true;
    } catch (e) {
      return false;
    }
  }

  function exportSnapshot() {
    try {
      var P = root.MrMacsProfile;
      if (P && typeof P.exportProfile === "function") return P.exportProfile();
      return JSON.stringify(safeProfile("get") || {}, null, 2);
    } catch (e) {
      return "";
    }
  }

  function importSnapshot(jsonStr) {
    try {
      var P = root.MrMacsProfile;
      if (P && typeof P.importProfile === "function") {
        var result = P.importProfile(jsonStr);
        emit("devtools:action", { action: "importSnapshot", payload: { ok: !!result } });
        return !!result;
      }
    } catch (e) { /* swallow */ }
    return false;
  }

  var api = {
    open: open,
    close: close,
    toggle: toggle,
    isOpen: isOpen,
    forceUnlock: forceUnlock,
    giveShards: giveShards,
    resetProfile: resetProfile,
    exportSnapshot: exportSnapshot,
    importSnapshot: importSnapshot,
    on: on,
    off: off
  };

  // Bind global activation listeners on next microtask if document is ready,
  // otherwise wait for DOMContentLoaded.
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindActivation, { once: true });
    } else {
      bindActivation();
    }
  }

  root.MrMacsDevTools = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : this);
