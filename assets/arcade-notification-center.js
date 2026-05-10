/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · Notification Center
   ──────────────────────────────────────────────────────────────────────
   Mounts a 🔔 bell icon in any topbar container. Clicking it opens a
   dropdown panel showing the last 10 notifications (achievements, daily
   claims, streak advances, big shard payouts). Full notification log is
   persisted to LocalStorage (last 50 entries, key
   mr-macs-arcade-notifications-v1).

   Auto-feeds from MrMacsProfile events:
     achievement:unlock  → 🏆 Unlocked: <title>
     daily:claim         → 📰 Daily challenge claimed (+N shards)
     streak:advance      → 🔥 N-day streak!
     wallet:change (≥200)→ 💎 Big shard payout: +N

   Public API:  window.MrMacsNotificationCenter
     .mountBell(container)  → { unmount, refresh }
     .push(notification)    // { kind, icon, title, desc?, ts, action? }
     .getNotifications(limit=10) → [...]
     .markAllRead()
     .unreadCount()
     .clearAll()
     .on(event, handler)
     .off(event, handler)

   CSS prefix: mnc-
   z-index: 9000 (below modals + toasts)
   Idempotent load.
   ─────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsNotificationCenter) return;

  // ─── Constants ───────────────────────────────────────────────────────
  var STORAGE_KEY   = "mr-macs-arcade-notifications-v1";
  var MAX_STORED    = 50;
  var DROPDOWN_SHOW = 10;
  var STYLE_ID      = "mnc-styles";
  var BIG_SHARD_THRESHOLD = 200;

  // ─── Module state ─────────────────────────────────────────────────────
  var notifications  = [];   // [{id,kind,icon,title,desc,ts,read,action?}]
  var profileBound   = false;
  var profileRetryQ  = false;
  var idSeq          = 0;
  var mounts         = [];   // live bell instances
  var prefersReduced = false;

  // ─── Pub-sub bus ──────────────────────────────────────────────────────
  function makeBus() {
    var L = Object.create(null);
    return {
      on:  function (ev, fn) {
        if (ev && typeof fn === "function") (L[ev] = L[ev] || []).push(fn);
      },
      off: function (ev, fn) {
        var a = L[ev]; if (!a) return;
        for (var i = a.length - 1; i >= 0; i--) if (a[i] === fn) a.splice(i, 1);
      },
      emit: function (ev, payload) {
        var a = L[ev]; if (!a) return;
        var copy = a.slice();
        for (var i = 0; i < copy.length; i++) { try { copy[i](payload); } catch (e) {} }
      }
    };
  }
  var bus = makeBus();

  // ─── Reduced-motion ──────────────────────────────────────────────────
  try {
    var _mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReduced = _mq.matches;
    var _mqFn = function (e) { prefersReduced = e.matches; };
    if (_mq.addEventListener) _mq.addEventListener("change", _mqFn);
    else if (_mq.addListener) _mq.addListener(_mqFn);
  } catch (e) { prefersReduced = false; }

  // ─── LocalStorage helpers ─────────────────────────────────────────────
  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) { return []; }
  }

  function saveToStorage() {
    try {
      // Prune to newest MAX_STORED
      var toSave = notifications.slice().sort(function (a, b) { return b.ts - a.ts; });
      if (toSave.length > MAX_STORED) toSave = toSave.slice(0, MAX_STORED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) { /* swallow */ }
  }

  function initStorage() {
    var stored = loadFromStorage();
    if (stored.length) {
      notifications = stored;
      // Ensure idSeq is beyond any stored id
      for (var i = 0; i < notifications.length; i++) {
        var n = notifications[i];
        if (n.id && typeof n.id === "number" && n.id > idSeq) idSeq = n.id;
      }
    }
  }

  // ─── Core notification management ────────────────────────────────────
  function push(opts) {
    if (!opts || typeof opts !== "object") return;
    var notif = {
      id:    ++idSeq,
      kind:  opts.kind  || "info",
      icon:  opts.icon  || "🔔",
      title: opts.title || "Notification",
      desc:  opts.desc  || null,
      ts:    opts.ts    || Date.now(),
      read:  false,
      action: (opts.action && typeof opts.action.onClick === "function")
              ? opts.action : null
    };
    notifications.unshift(notif);
    // Prune in-memory to MAX_STORED
    if (notifications.length > MAX_STORED) notifications = notifications.slice(0, MAX_STORED);
    saveToStorage();
    refreshAllMounts();
    bus.emit("push", notif);
  }

  function getNotifications(limit) {
    var lim = (typeof limit === "number" && limit > 0) ? limit : DROPDOWN_SHOW;
    return notifications.slice(0, lim);
  }

  function markAllRead() {
    for (var i = 0; i < notifications.length; i++) notifications[i].read = true;
    saveToStorage();
    refreshAllMounts();
    bus.emit("mark-all-read", null);
  }

  function unreadCount() {
    var n = 0;
    for (var i = 0; i < notifications.length; i++) if (!notifications[i].read) n++;
    return n;
  }

  function clearAll() {
    notifications = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    refreshAllMounts();
    bus.emit("clear", null);
  }

  // ─── MrMacsProfile event wiring ──────────────────────────────────────
  function bindProfile() {
    if (profileBound) return true;
    var P;
    try { P = root.MrMacsProfile; } catch (e) { return false; }
    if (!P || typeof P.on !== "function") return false;

    try {
      P.on("achievement:unlock", function (ev) {
        try {
          var d = (ev && ev.detail) || ev || {};
          var def = d.def || {};
          var title = def.title || d.id || "Achievement";
          push({
            kind:  "achievement",
            icon:  "🏆",
            title: "Unlocked: " + title,
            desc:  def.desc || null,
            ts:    d.unlockedAt || Date.now()
          });
        } catch (e) {}
      });

      P.on("daily:claim", function (ev) {
        try {
          var d = (ev && ev.detail) || ev || {};
          var payout = Number(d.payout) || 0;
          push({
            kind:  "daily",
            icon:  "📰",
            title: "Daily challenge claimed" + (payout ? " (+" + payout + " shards)" : ""),
            desc:  d.doubled ? "Payout doubled!" : null
          });
        } catch (e) {}
      });

      P.on("streak:advance", function (ev) {
        try {
          var d  = (ev && ev.detail) || ev || {};
          var streak = d.streak || d;
          var n = Number((streak && streak.current) || d.current) || 0;
          if (!n || n < 2) return;
          push({
            kind:  "streak",
            icon:  "🔥",
            title: n + "-day streak!"
          });
        } catch (e) {}
      });

      P.on("wallet:change", function (ev) {
        try {
          var d = (ev && ev.detail) || ev || {};
          var delta = Number(d.delta);
          if (!delta || delta < BIG_SHARD_THRESHOLD) return;
          push({
            kind:  "shards",
            icon:  "💎",
            title: "Big shard payout: +" + delta,
            desc:  d.source ? d.source.replace(/[-_]/g, " ") : null
          });
        } catch (e) {}
      });

      profileBound = true;
      return true;
    } catch (e) { return false; }
  }

  function ensureProfile() {
    if (bindProfile()) return;
    if (profileRetryQ) return;
    profileRetryQ = true;
    var tries = 0;
    try {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
          profileRetryQ = false;
          bindProfile();
        }, { once: true });
      } else {
        var iv = setInterval(function () {
          tries++;
          if (bindProfile() || tries > 30) {
            clearInterval(iv);
            profileRetryQ = false;
          }
        }, 300);
      }
    } catch (e) { profileRetryQ = false; }
  }

  // ─── CSS ─────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var reduced = "@media (prefers-reduced-motion:reduce){";
    var css = [
      /* Bell wrapper */
      ".mnc-bell-wrap{",
        "position:relative;",
        "display:inline-flex;",
        "align-items:center;",
        "justify-content:center;",
        "vertical-align:middle;",
      "}",

      /* Bell button */
      ".mnc-bell{",
        "appearance:none;-webkit-appearance:none;",
        "display:grid;place-items:center;",
        "width:32px;height:32px;",
        "padding:0;",
        "background:rgba(255,255,255,0.05);",
        "border:1px solid rgba(196,156,68,0.25);",
        "border-radius:8px;",
        "color:#d4a843;",
        "font-size:16px;line-height:1;",
        "cursor:pointer;",
        "transition:background 140ms ease,border-color 140ms ease,color 140ms ease;",
        "position:relative;",
        "flex-shrink:0;",
      "}",
      ".mnc-bell:hover{background:rgba(196,156,68,0.14);border-color:rgba(196,156,68,0.5);color:#f5c842;}",
      ".mnc-bell:focus-visible{outline:2px solid #d4a843;outline-offset:2px;}",
      ".mnc-bell[aria-expanded='true']{background:rgba(196,156,68,0.18);border-color:rgba(196,156,68,0.55);}",

      /* Unread badge */
      ".mnc-badge{",
        "position:absolute;",
        "top:-5px;right:-5px;",
        "min-width:16px;height:16px;",
        "padding:0 4px;",
        "background:#c4323a;",
        "color:#fff;",
        "font-family:'JetBrains Mono','Courier New',monospace;",
        "font-size:10px;font-weight:700;line-height:16px;",
        "border-radius:8px;",
        "text-align:center;",
        "pointer-events:none;",
        "display:none;",
        "box-sizing:border-box;",
      "}",
      ".mnc-badge.is-visible{display:block;}",

      /* Dropdown panel */
      ".mnc-panel{",
        "position:absolute;",
        "top:calc(100% + 8px);",
        "right:0;",
        "width:320px;",
        "max-width:calc(100vw - 16px);",
        "background:linear-gradient(160deg,#14111f 0%,#0e0b1b 100%);",
        "border:1px solid rgba(196,156,68,0.28);",
        "border-radius:12px;",
        "box-shadow:0 20px 48px rgba(0,0,0,0.55),0 0 28px rgba(196,156,68,0.08);",
        "z-index:9000;",
        "overflow:hidden;",
        "opacity:0;",
        "transform:translateY(-6px) scale(0.97);",
        "pointer-events:none;",
        "transition:opacity 200ms ease,transform 200ms cubic-bezier(.18,.89,.32,1.16);",
      "}",
      ".mnc-panel.is-open{",
        "opacity:1;",
        "transform:translateY(0) scale(1);",
        "pointer-events:auto;",
      "}",
      reduced +
        ".mnc-panel{transition:opacity 80ms ease;transform:none!important;}" +
      "}",

      /* Panel header */
      ".mnc-header{",
        "display:flex;align-items:center;justify-content:space-between;",
        "padding:12px 14px 10px;",
        "border-bottom:1px solid rgba(196,156,68,0.16);",
        "background:rgba(0,0,0,0.18);",
      "}",
      ".mnc-header-title{",
        "font-family:'Fraunces',serif;",
        "font-size:14px;font-weight:600;font-style:italic;",
        "color:#f0e6c8;",
        "margin:0;",
      "}",
      ".mnc-mark-read{",
        "appearance:none;-webkit-appearance:none;",
        "background:transparent;",
        "border:1px solid rgba(196,156,68,0.3);",
        "border-radius:6px;",
        "color:#d4a843;",
        "font-family:'JetBrains Mono','Courier New',monospace;",
        "font-size:10px;letter-spacing:0.06em;text-transform:uppercase;",
        "padding:4px 8px;",
        "cursor:pointer;",
        "transition:background 130ms ease,border-color 130ms ease;",
        "white-space:nowrap;",
      "}",
      ".mnc-mark-read:hover{background:rgba(196,156,68,0.14);border-color:rgba(196,156,68,0.55);}",
      ".mnc-mark-read:focus-visible{outline:2px solid #d4a843;outline-offset:2px;}",

      /* Notification list */
      ".mnc-list{",
        "list-style:none;margin:0;padding:0;",
        "max-height:360px;",
        "overflow-y:auto;",
        "scrollbar-width:thin;",
        "scrollbar-color:rgba(196,156,68,0.3) transparent;",
      "}",
      ".mnc-list::-webkit-scrollbar{width:4px;}",
      ".mnc-list::-webkit-scrollbar-track{background:transparent;}",
      ".mnc-list::-webkit-scrollbar-thumb{background:rgba(196,156,68,0.3);border-radius:2px;}",

      /* Notification item — May 10 2026 legibility fix:
         - cursor:pointer (was default — looked non-interactive)
         - bumped read-state opacity 0.65 → 0.92
         - touch min-height 56px tap target */
      ".mnc-item{",
        "display:flex;align-items:flex-start;gap:10px;",
        "padding:12px 14px;",
        "min-height:56px;",
        "border-bottom:1px solid rgba(255,255,255,0.06);",
        "border-left:3px solid transparent;",
        "transition:background 130ms ease;",
        "cursor:pointer;",
        "-webkit-tap-highlight-color:transparent;",
      "}",
      ".mnc-item:last-child{border-bottom:none;}",
      /* Unread state: gold border + tint */
      ".mnc-item.is-unread{",
        "border-left-color:#c4943a;",
        "background:rgba(196,156,68,0.10);",
      "}",
      /* Read state: still legible (was 0.65 — hard to read on dark bg) */
      ".mnc-item:not(.is-unread){opacity:0.92;}",
      ".mnc-item:hover,.mnc-item:active{background:rgba(196,156,68,0.16);opacity:1;}",

      /* Item icon */
      ".mnc-item-icon{",
        "flex-shrink:0;",
        "font-size:18px;line-height:1;",
        "margin-top:1px;",
      "}",

      /* Item body — let text wrap so descriptions are actually readable
         (May 10 2026 fix; was nowrap+ellipsis truncating content). */
      ".mnc-item-body{flex:1 1 0;min-width:0;}",
      ".mnc-item-title{",
        "display:block;",
        "font-size:14px;font-weight:700;",
        "color:#f5ecd0;",
        "line-height:1.3;",
        "word-break:break-word;",
      "}",
      ".mnc-item-desc{",
        "display:block;",
        "font-size:12px;",
        "color:rgba(245,236,208,0.85);",
        "margin-top:3px;",
        "line-height:1.4;",
        "word-break:break-word;",
      "}",
      ".mnc-item-action{",
        "display:inline-block;",
        "margin-top:4px;",
        "appearance:none;-webkit-appearance:none;",
        "background:rgba(196,156,68,0.14);",
        "border:1px solid rgba(196,156,68,0.35);",
        "border-radius:5px;",
        "color:#d4a843;",
        "font-family:'JetBrains Mono','Courier New',monospace;",
        "font-size:10px;letter-spacing:0.05em;text-transform:uppercase;",
        "padding:3px 7px;",
        "cursor:pointer;",
        "transition:background 120ms ease;",
      "}",
      ".mnc-item-action:hover{background:rgba(196,156,68,0.26);}",

      /* Item timestamp */
      ".mnc-item-when{",
        "flex-shrink:0;",
        "font-family:'JetBrains Mono','Courier New',monospace;",
        "font-size:10px;",
        "color:rgba(240,230,200,0.38);",
        "white-space:nowrap;",
        "padding-top:2px;",
      "}",

      /* Empty state */
      ".mnc-empty{",
        "padding:32px 14px;",
        "text-align:center;",
        "color:rgba(240,230,200,0.38);",
        "font-size:13px;",
        "line-height:1.55;",
      "}",

      /* Footer */
      ".mnc-footer{",
        "border-top:1px solid rgba(196,156,68,0.14);",
        "padding:10px 14px;",
        "text-align:center;",
        "background:rgba(0,0,0,0.12);",
      "}",
      ".mnc-view-all{",
        "appearance:none;-webkit-appearance:none;",
        "background:transparent;border:none;",
        "color:#d4a843;",
        "font-family:'JetBrains Mono','Courier New',monospace;",
        "font-size:11px;letter-spacing:0.06em;text-transform:uppercase;",
        "cursor:pointer;",
        "padding:4px 8px;",
        "border-radius:5px;",
        "transition:background 130ms ease,color 130ms ease;",
      "}",
      ".mnc-view-all:hover{background:rgba(196,156,68,0.1);color:#f5c842;}",
      ".mnc-view-all:focus-visible{outline:2px solid #d4a843;outline-offset:2px;}",
      ".mnc-view-all[hidden]{display:none;}",

      "@media print{.mnc-bell-wrap{display:none!important;}}"
    ].join("");

    try {
      var s = document.createElement("style");
      s.id = STYLE_ID;
      s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    } catch (e) { /* swallow */ }
  }

  // ─── Utility ─────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function relTime(ts) {
    try {
      var diff = Date.now() - Number(ts);
      if (diff < 0) diff = 0;
      var secs = Math.floor(diff / 1000);
      if (secs < 60)  return "just now";
      var mins = Math.floor(secs / 60);
      if (mins < 60)  return mins + "m ago";
      var hrs = Math.floor(mins / 60);
      if (hrs < 24)   return hrs + "h ago";
      var days = Math.floor(hrs / 24);
      if (days === 1) return "yesterday";
      if (days < 7)   return days + "d ago";
      return Math.floor(days / 7) + "w ago";
    } catch (e) { return ""; }
  }

  // ─── Bell instance factory ────────────────────────────────────────────
  function createBellInstance(container) {
    injectStyles();

    // Wrap
    var wrap = document.createElement("div");
    wrap.className = "mnc-bell-wrap";

    // Bell button
    var bell = document.createElement("button");
    bell.type = "button";
    bell.className = "mnc-bell";
    bell.setAttribute("aria-label", "Notifications");
    bell.setAttribute("aria-haspopup", "true");
    bell.setAttribute("aria-expanded", "false");
    bell.textContent = "🔔";
    wrap.appendChild(bell);

    // Badge
    var badge = document.createElement("span");
    badge.className = "mnc-badge";
    badge.setAttribute("aria-hidden", "true");
    bell.appendChild(badge);

    // Dropdown panel
    var panel = document.createElement("div");
    panel.className = "mnc-panel";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Notification log");
    wrap.appendChild(panel);

    var isOpen = false;

    // ─ Render helpers ─────────────────────────────────────────────────
    function renderBadge() {
      var count = unreadCount();
      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.classList.add("is-visible");
        bell.setAttribute("aria-label", "Notifications (" + count + " unread)");
      } else {
        badge.classList.remove("is-visible");
        bell.setAttribute("aria-label", "Notifications");
      }
    }

    function renderPanel() {
      var items = getNotifications(DROPDOWN_SHOW);
      var all   = notifications.length;

      var headerHtml =
        "<div class='mnc-header'>" +
          "<span class='mnc-header-title'>Notifications</span>" +
          "<button type='button' class='mnc-mark-read'>Mark all read</button>" +
        "</div>";

      var listHtml;
      if (items.length === 0) {
        listHtml = "<ul class='mnc-list'><li class='mnc-empty'>No notifications yet.</li></ul>";
      } else {
        listHtml = "<ul class='mnc-list'>";
        for (var i = 0; i < items.length; i++) {
          var n = items[i];
          var unreadClass = n.read ? "" : " is-unread";
          var descHtml = n.desc
            ? "<span class='mnc-item-desc'>" + esc(n.desc) + "</span>"
            : "";
          var actionHtml = n.action && n.action.label
            ? "<button type='button' class='mnc-item-action'" +
              " data-notif-id='" + n.id + "'>" +
              esc(n.action.label) + "</button>"
            : "";
          listHtml +=
            "<li class='mnc-item" + unreadClass + "'" +
                " data-id='" + n.id + "'>" +
              "<span class='mnc-item-icon' aria-hidden='true'>" + esc(n.icon) + "</span>" +
              "<div class='mnc-item-body'>" +
                "<span class='mnc-item-title'>" + esc(n.title) + "</span>" +
                descHtml +
                actionHtml +
              "</div>" +
              "<span class='mnc-item-when'>" + esc(relTime(n.ts)) + "</span>" +
            "</li>";
        }
        listHtml += "</ul>";
      }

      var footerHtml = "";
      if (all > DROPDOWN_SHOW) {
        footerHtml =
          "<div class='mnc-footer'>" +
            "<button type='button' class='mnc-view-all'>View all " + all + "</button>" +
          "</div>";
      }

      panel.innerHTML = headerHtml + listHtml + footerHtml;

      // Wire "Mark all read"
      var markBtn = panel.querySelector(".mnc-mark-read");
      if (markBtn) {
        markBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          markAllRead();
        });
      }

      // Wire action buttons
      var actionBtns = panel.querySelectorAll(".mnc-item-action");
      for (var j = 0; j < actionBtns.length; j++) {
        (function (btn) {
          btn.addEventListener("click", function (e) {
            e.stopPropagation();
            var nid = Number(btn.getAttribute("data-notif-id"));
            var found = null;
            for (var k = 0; k < notifications.length; k++) {
              if (notifications[k].id === nid) { found = notifications[k]; break; }
            }
            if (found && found.action && typeof found.action.onClick === "function") {
              try { found.action.onClick(e, found); } catch (e2) {}
            }
          });
        })(actionBtns[j]);
      }

      // Wire "View all" (emits event — consumers may open a full log panel)
      var viewAllBtn = panel.querySelector(".mnc-view-all");
      if (viewAllBtn) {
        viewAllBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          bus.emit("view-all", notifications.slice());
          closePanel();
        });
      }

      // Wire whole-item click: mark read + fire item.action.onClick if present.
      // Inner buttons (.mnc-mark-read, .mnc-item-action, .mnc-view-all) all
      // use stopPropagation so they don't double-trigger this handler.
      // (May 10 2026 — items showed cursor:pointer but had no click target.)
      var itemEls = panel.querySelectorAll(".mnc-item");
      for (var li = 0; li < itemEls.length; li++) {
        (function (itemEl) {
          itemEl.addEventListener("click", function () {
            var id = Number(itemEl.getAttribute("data-id"));
            var found = null;
            for (var m = 0; m < notifications.length; m++) {
              if (notifications[m].id === id) { found = notifications[m]; break; }
            }
            if (found) {
              if (!found.read) {
                found.read = true;
                bus.emit("read", found);
                renderPanel();
                renderBadge();
              }
              if (found.action && typeof found.action.onClick === "function") {
                try { found.action.onClick({}, found); } catch (e) {}
              }
            }
          });
        })(itemEls[li]);
      }
    }

    function openPanel() {
      renderPanel();
      panel.classList.add("is-open");
      bell.setAttribute("aria-expanded", "true");
      isOpen = true;
      bus.emit("open", null);
    }

    function closePanel() {
      panel.classList.remove("is-open");
      bell.setAttribute("aria-expanded", "false");
      isOpen = false;
      bus.emit("close", null);
    }

    function togglePanel() {
      if (isOpen) closePanel(); else openPanel();
    }

    // Bell click
    bell.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePanel();
    });

    // Close on outside click
    function onDocClick(e) {
      if (!isOpen) return;
      if (wrap.contains(e.target)) return;
      closePanel();
    }
    document.addEventListener("click", onDocClick);

    // Escape closes
    function onKeydown(e) {
      if (isOpen && (e.key === "Escape" || e.keyCode === 27)) {
        closePanel();
        bell.focus();
      }
    }
    document.addEventListener("keydown", onKeydown);

    // Mount into container
    try { container.appendChild(wrap); } catch (e) {}

    // Initial render of badge
    renderBadge();

    var inst = {
      _refresh: function () {
        renderBadge();
        if (isOpen) renderPanel();
      },
      unmount: function () {
        document.removeEventListener("click", onDocClick);
        document.removeEventListener("keydown", onKeydown);
        try { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); } catch (e) {}
        for (var i = mounts.length - 1; i >= 0; i--) {
          if (mounts[i] === inst) mounts.splice(i, 1);
        }
      },
      refresh: function () { inst._refresh(); }
    };

    mounts.push(inst);
    return inst;
  }

  function refreshAllMounts() {
    for (var i = 0; i < mounts.length; i++) {
      try { mounts[i]._refresh(); } catch (e) {}
    }
  }

  // ─── Initialise ───────────────────────────────────────────────────────
  function init() {
    initStorage();
    ensureProfile();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // ─── Public API ───────────────────────────────────────────────────────
  root.MrMacsNotificationCenter = {
    mountBell: function (container) {
      try {
        if (!container) container = document.body;
        var inst = createBellInstance(container);
        return {
          unmount: function () { inst.unmount(); },
          refresh: function () { inst.refresh(); }
        };
      } catch (e) {
        return { unmount: function () {}, refresh: function () {} };
      }
    },
    push:             push,
    getNotifications: getNotifications,
    markAllRead:      markAllRead,
    unreadCount:      unreadCount,
    clearAll:         clearAll,
    on:  function (ev, fn) { bus.on(ev, fn); },
    off: function (ev, fn) { bus.off(ev, fn); }
  };

})(typeof window !== "undefined" ? window : this);
