/* Mr. Mac's Arcade — Trophy Showcase
 *
 * Hub-home component: marquee-style horizontal scroller surfacing the player's
 * most impressive recent achievement unlocks. Increases engagement by making
 * wins visible on the home screen.
 *
 * API: window.MrMacsTrophyShowcase
 *   mount(container, opts={limit:5, tier:"all"}) -> { unmount, refresh }
 *   refresh() -> void
 *   getShowcase(opts={}) -> [{ id, def, unlockedAt }]
 *   on(event, handler) / off(event, handler)
 *
 * Events emitted:
 *   "showcase:mount" · "showcase:unmount" · "showcase:refresh" · "trophy:click"
 *
 * Tiers:  bronze · silver · gold · legendary
 * Tier colors: bronze #cd7f32 · silver #c0c0c0 · gold #f5c451 ·
 *              legendary gradient gold→magenta (with pulsing glow)
 *
 * Self-contained — CSS injected once under <style id="arcade-trophy-showcase-styles">.
 * All class names prefixed mts-.
 * Idempotent: IIFE no-ops on re-load.
 */
(function (root) {
  "use strict";
  if (root.MrMacsTrophyShowcase) return;

  // ── Constants ────────────────────────────────────────────────────
  var STYLE_ID  = "arcade-trophy-showcase-styles";
  var ATTR_ID   = "data-mts-id";
  var VALID_TIERS = { gold: true, legendary: true, all: true, bronze: true, silver: true };
  var TOTAL_ACHIEVEMENTS = 85; // approximate; refreshed from profile if available

  var instances = [];
  var nextId = 1;

  // ── Tiny event bus ───────────────────────────────────────────────
  var listeners = {};
  function emit(event, payload) {
    var arr = listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) { try { arr[i](payload); } catch (e) {} }
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

  // ── Profile bridge ───────────────────────────────────────────────
  function P() { return root.MrMacsProfile || null; }

  function listAchievements() {
    try {
      var prof = P();
      if (prof && typeof prof.listAchievements === "function") {
        return prof.listAchievements() || [];
      }
    } catch (e) {}
    return [];
  }

  function totalAchievementsCount() {
    try {
      var prof = P();
      if (prof && Array.isArray(prof.ACHIEVEMENTS)) return prof.ACHIEVEMENTS.length;
    } catch (e) {}
    return TOTAL_ACHIEVEMENTS;
  }

  // ── Helpers ──────────────────────────────────────────────────────
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[<>&"']/g, function (c) {
      return c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;"
           : c === '"' ? "&quot;" : "&#39;";
    });
  }

  function prefersReducedMotion() {
    try {
      return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) { return false; }
  }

  function relativeTime(ts) {
    if (!ts) return "";
    var diff = Date.now() - ts;
    var mins  = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days  = Math.floor(diff / 86400000);
    if (mins < 2)  return "just now";
    if (mins < 60) return mins + " min ago";
    if (hours < 24) return hours + " hr ago";
    if (days === 1) return "yesterday";
    if (days < 7)  return days + " days ago";
    var d = new Date(ts);
    return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
  }

  function tierLabel(tier) {
    var map = { bronze: "Bronze", silver: "Silver", gold: "Gold", legendary: "Legendary" };
    return map[tier] || tier || "";
  }

  // ── Core data logic ──────────────────────────────────────────────
  // Returns curated showcase list: unlocked only, sorted by unlockedAt DESC.
  // opts.tier  = "all" | "gold" | "legendary" | "silver" | "bronze"
  // opts.limit = number (default 5)
  function getShowcase(opts) {
    opts = opts || {};
    var tier  = (opts.tier && VALID_TIERS[opts.tier]) ? opts.tier : "all";
    var limit = Math.max(1, Math.min(50, Number(opts.limit) || 5));

    var all = listAchievements();
    var unlocked = [];
    for (var i = 0; i < all.length; i++) {
      var item = all[i];
      if (!item || !item.unlocked || !item.unlockedAt) continue;
      if (tier !== "all" && item.def && item.def.tier !== tier) continue;
      unlocked.push({ id: item.id, def: item.def || {}, unlockedAt: item.unlockedAt });
    }

    // Sort by unlockedAt DESC, then boost gold + legendary to front
    // by placing them before silver/bronze when timestamps are tied.
    var tierWeight = { legendary: 0, gold: 1, silver: 2, bronze: 3 };
    unlocked.sort(function (a, b) {
      var tDiff = b.unlockedAt - a.unlockedAt;
      if (tDiff !== 0) return tDiff;
      var wa = tierWeight[a.def.tier] != null ? tierWeight[a.def.tier] : 4;
      var wb = tierWeight[b.def.tier] != null ? tierWeight[b.def.tier] : 4;
      return wa - wb;
    });

    return unlocked.slice(0, limit);
  }

  // ── CSS injection ────────────────────────────────────────────────
  function injectStyles() {
    try {
      var doc = root.document;
      if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;

      var mono  = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
      var serif = "'Fraunces','Iowan Old Style',Georgia,serif";

      var css = [
        /* ── Showcase wrapper ── */
        ".mts-showcase{display:flex;flex-direction:column;gap:12px;padding:16px 0 12px;color:#e8ecf4;font-family:inherit}",

        /* ── Header row ── */
        ".mts-header{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;padding:0 16px}",
        ".mts-eyebrow{font-family:" + mono + ";font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8b94aa;margin-right:auto}",
        ".mts-title{font-family:" + serif + ";font-size:20px;font-weight:700;line-height:1.15;color:#f5f7fb;margin:0}",
        ".mts-title em{font-style:italic;color:#f5c451}",
        ".mts-count{font-family:" + mono + ";font-size:11px;color:#8b94aa;white-space:nowrap}",

        /* ── Horizontal rail (scroll snap) ── */
        ".mts-rail{display:flex;gap:12px;padding:4px 16px 12px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
        ".mts-rail::-webkit-scrollbar{display:none}",

        /* ── Trophy card base ── */
        ".mts-trophy{flex:0 0 180px;width:180px;min-height:140px;display:flex;flex-direction:column;gap:5px;padding:12px 14px 10px;border-radius:12px;border:1.5px solid rgba(205,127,50,.4);background:linear-gradient(160deg,rgba(22,26,38,.96),rgba(14,16,28,.97));scroll-snap-align:start;cursor:default;transition:transform 140ms ease,box-shadow 140ms ease}",
        ".mts-trophy:hover,.mts-trophy:focus-visible{outline:none;transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.5)}",

        /* ── Tier border colors ── */
        ".mts-trophy[data-tier='bronze']{border-color:#cd7f32}",
        ".mts-trophy[data-tier='silver']{border-color:#c0c0c0}",
        ".mts-trophy[data-tier='gold']{border-color:#f5c451}",
        ".mts-trophy[data-tier='legendary']{border-image:linear-gradient(135deg,#f5c451,#c026d3) 1;border-style:solid}",

        /* ── Legendary glow pulse ── */
        ".mts-trophy[data-tier='legendary']{animation:mts-legendary-glow 2.8s ease-in-out infinite}",
        "@keyframes mts-legendary-glow{0%,100%{box-shadow:0 0 0 0 rgba(245,196,81,0)}50%{box-shadow:0 0 14px 3px rgba(192,38,211,.38),0 0 8px 1px rgba(245,196,81,.28)}}",

        /* ── Card internals ── */
        ".mts-icon{font-size:22px;line-height:1;margin-bottom:1px}",
        ".mts-tier-badge{display:inline-block;font-family:" + mono + ";font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:1px 6px;border-radius:20px;font-weight:600;opacity:.85;align-self:flex-start}",
        ".mts-trophy[data-tier='bronze'] .mts-tier-badge{background:rgba(205,127,50,.18);color:#cd7f32}",
        ".mts-trophy[data-tier='silver'] .mts-tier-badge{background:rgba(192,192,192,.14);color:#c0c0c0}",
        ".mts-trophy[data-tier='gold'] .mts-tier-badge{background:rgba(245,196,81,.16);color:#f5c451}",
        ".mts-trophy[data-tier='legendary'] .mts-tier-badge{background:linear-gradient(90deg,rgba(245,196,81,.18),rgba(192,38,211,.18));color:#ffd884}",
        ".mts-name{font-family:" + serif + ";font-size:13.5px;font-weight:700;line-height:1.2;color:#f0f3fa;margin-top:2px}",
        ".mts-desc{font-size:11px;color:#8b94aa;line-height:1.35;flex:1}",
        ".mts-when{font-family:" + mono + ";font-size:10px;color:#5a6279;letter-spacing:.04em;margin-top:4px}",

        /* ── Empty state ── */
        ".mts-empty{display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:14px 16px;border:1px dashed rgba(205,127,50,.32);border-radius:12px;margin:0 16px;background:rgba(18,22,32,.6)}",
        ".mts-empty-text{font-family:" + serif + ";font-style:italic;color:#8b94aa;font-size:14px;line-height:1.4}",
        ".mts-empty-link{display:inline-flex;align-items:center;gap:5px;font-family:" + mono + ";font-size:11px;font-weight:600;color:#f5c451;text-decoration:none;letter-spacing:.04em;padding:5px 11px;border:1px solid rgba(245,196,81,.4);border-radius:999px;background:rgba(245,196,81,.08);cursor:pointer;transition:background 120ms,transform 120ms}",
        ".mts-empty-link:hover,.mts-empty-link:focus-visible{outline:none;background:rgba(245,196,81,.16);transform:translateX(2px)}",

        /* ── Reduced-motion overrides ── */
        "@media (prefers-reduced-motion:reduce){" +
          ".mts-trophy{transition:none}" +
          ".mts-trophy:hover,.mts-trophy:focus-visible{transform:none}" +
          ".mts-trophy[data-tier='legendary']{animation:none}" +
        "}"
      ].join("\n");

      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.appendChild(doc.createTextNode(css));
      doc.head.appendChild(style);
    } catch (e) {}
  }

  // ── HTML rendering ───────────────────────────────────────────────
  function buildTrophyCard(item) {
    var def  = item.def || {};
    var tier = escHtml(def.tier || "bronze");
    var icon = escHtml(def.icon || "🏆");
    var name = escHtml(def.title || item.id || "Achievement");
    var desc = escHtml(def.desc || "");
    var when = escHtml(relativeTime(item.unlockedAt));
    var badge = escHtml(tierLabel(def.tier || "bronze"));

    return '<div class="mts-trophy" data-tier="' + tier + '" tabindex="0" ' +
             'role="article" aria-label="' + name + ', ' + badge + ' tier, unlocked ' + when + '">' +
             '<div class="mts-icon" aria-hidden="true">' + icon + '</div>' +
             '<span class="mts-tier-badge">' + badge + '</span>' +
             '<div class="mts-name">' + name + '</div>' +
             '<div class="mts-desc">' + desc + '</div>' +
             '<div class="mts-when">' + when + '</div>' +
           '</div>';
  }

  function buildEmpty(rootEl) {
    rootEl.innerHTML =
      '<div class="mts-header">' +
        '<span class="mts-eyebrow">Trophy Case</span>' +
        '<h2 class="mts-title">Your <em>achievements</em>.</h2>' +
      '</div>' +
      '<div class="mts-empty">' +
        '<p class="mts-empty-text">Unlock your first achievement to see your trophy case.</p>' +
        '<button type="button" class="mts-empty-link" data-mts-action="open-achievements">' +
          'Go earn one →' +
        '</button>' +
      '</div>';

    var btn = rootEl.querySelector('[data-mts-action="open-achievements"]');
    if (!btn) return;
    btn.addEventListener("click", function () {
      emit("trophy:click", { kind: "empty-cta" });
      try {
        var ev = new root.CustomEvent("mr-macs-trophy-showcase:open-achievements", {
          detail: {}, bubbles: true
        });
        (rootEl || root.document || root).dispatchEvent(ev);
      } catch (e) {}
    });
  }

  function buildShowcase(rootEl, items, unlockedCount, totalCount) {
    var countText = escHtml(unlockedCount + " of " + totalCount + " unlocked");
    var cardsHtml = items.map(buildTrophyCard).join("");

    rootEl.innerHTML =
      '<div class="mts-header">' +
        '<span class="mts-eyebrow">Trophy Case</span>' +
        '<h2 class="mts-title">Your <em>achievements</em>.</h2>' +
        '<span class="mts-count">' + countText + '</span>' +
      '</div>' +
      '<div class="mts-rail" role="list" aria-label="Recent achievements">' +
        cardsHtml +
      '</div>';

    // Wire click events on each card for external routing.
    var cards = rootEl.querySelectorAll(".mts-trophy");
    for (var i = 0; i < cards.length; i++) {
      (function (card, item) {
        card.addEventListener("click", function () {
          emit("trophy:click", { kind: "card", item: item });
          try {
            var ev = new root.CustomEvent("mr-macs-trophy-showcase:trophy-click", {
              detail: { item: item }, bubbles: true
            });
            (rootEl || root.document || root).dispatchEvent(ev);
          } catch (e) {}
        });
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            card.click();
          }
        });
      })(cards[i], items[i]);
    }
  }

  // ── Per-instance render ──────────────────────────────────────────
  function renderInstance(inst) {
    try {
      var opts  = inst.opts || {};
      var items = getShowcase(opts);
      var all   = listAchievements();
      var unlockedCount = 0;
      for (var i = 0; i < all.length; i++) { if (all[i] && all[i].unlocked) unlockedCount++; }
      var totalCount = Math.max(unlockedCount, totalAchievementsCount());

      if (items.length === 0) {
        buildEmpty(inst.rootEl);
      } else {
        buildShowcase(inst.rootEl, items, unlockedCount, totalCount);
      }
    } catch (e) { /* never break the host page */ }
  }

  // ── Public mount ─────────────────────────────────────────────────
  function mount(container, opts) {
    opts = opts || {};
    if (!container || typeof container !== "object" || !container.appendChild) {
      return { unmount: function () {}, refresh: function () {} };
    }

    injectStyles();

    var id = nextId++;
    var rootEl = root.document.createElement("div");
    rootEl.className = "mts-showcase";
    rootEl.setAttribute(ATTR_ID, String(id));
    rootEl.setAttribute("role", "region");
    rootEl.setAttribute("aria-label", "Trophy Case");
    container.appendChild(rootEl);

    var inst = {
      id: id,
      rootEl: rootEl,
      opts: {
        limit: Math.max(1, Math.min(50, Number(opts.limit) || 5)),
        tier:  (opts.tier && VALID_TIERS[opts.tier]) ? opts.tier : "all"
      }
    };

    instances.push(inst);
    renderInstance(inst);
    emit("showcase:mount", { container: container, id: id });

    return {
      unmount: function () {
        instances = instances.filter(function (it) { return it !== inst; });
        try { if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl); } catch (e) {}
        emit("showcase:unmount", { container: container, id: id });
      },
      refresh: function () {
        try {
          if (!rootEl || !root.document.contains(rootEl)) return;
          renderInstance(inst);
        } catch (e) {}
      }
    };
  }

  // ── Public refresh — re-renders every live instance ──────────────
  function refresh() {
    instances = instances.filter(function (inst) {
      try {
        if (!inst.rootEl || !root.document.contains(inst.rootEl)) return false;
        renderInstance(inst);
        return true;
      } catch (e) { return false; }
    });
    emit("showcase:refresh", {});
  }

  // ── Profile event subscription ───────────────────────────────────
  function bindProfileEvents() {
    var prof = P();
    if (!prof || typeof prof.on !== "function") return false;
    ["achievement:unlock", "profile:update", "profile:create",
     "profile:import", "profile:wipe"].forEach(function (ev) {
      try { prof.on(ev, refresh); } catch (e) {}
    });
    return true;
  }

  // Retry once on DOMContentLoaded if profile isn't available at load time.
  if (!bindProfileEvents()) {
    try {
      var doc = root.document;
      if (doc && doc.addEventListener) {
        doc.addEventListener("DOMContentLoaded", function once() {
          doc.removeEventListener("DOMContentLoaded", once);
          bindProfileEvents();
        });
      }
    } catch (e) {}
  }

  // ── Expose public API ────────────────────────────────────────────
  root.MrMacsTrophyShowcase = {
    mount: mount,
    refresh: refresh,
    getShowcase: getShowcase,
    on: on,
    off: off
  };

})(typeof window !== "undefined" ? window
   : (typeof globalThis !== "undefined" ? globalThis : this));
