/* ============================================================================
 * arcade-difficulty.js
 * Mr. Mac's Review Arcade — Per-game difficulty selector framework.
 *
 * Public surface: window.MrMacsDifficulty
 *   register(gameId, tiers?), current(gameId), set(gameId, tierId),
 *   tiers(gameId), modifier(gameId, key, fallback?),
 *   mountSelector(container, gameId, opts?),
 *   on(event, handler), off(event, handler).
 *
 * Storage: localStorage key "mr-macs-arcade-difficulty-v1".
 *   Shape: { [gameId]: tierId }  // per-device-shared MVP
 *
 * Idempotent: re-loading the script does nothing if MrMacsDifficulty already exists.
 * Self-contained CSS injected once with id "arcade-difficulty-styles".
 * Visual: editorial dark + bronze borders; class names are "mdiff-*".
 * ==========================================================================*/
(function (root) {
  "use strict";
  if (root.MrMacsDifficulty) return;

  var STORAGE_KEY = "mr-macs-arcade-difficulty-v1";
  var STYLE_ID = "arcade-difficulty-styles";

  /* -- Default tiers ------------------------------------------------------- */
  var DEFAULT_TIERS = [
    {
      id: "casual",
      label: "Casual",
      tag: "Warm-up",
      description: "Slower pace, more lives, lighter scoring.",
      modifiers: { speedMult: 0.7, livesStart: 5, scoreMult: 0.5, enemyHp: 1 }
    },
    {
      id: "normal",
      label: "Normal",
      tag: "Recommended",
      description: "Balanced pace and scoring — the default arcade feel.",
      modifiers: { speedMult: 1.0, livesStart: 3, scoreMult: 1.0, enemyHp: 1 }
    },
    {
      id: "hard",
      label: "Hard",
      tag: "Sweaty",
      description: "Faster, fewer lives, bigger score multiplier.",
      modifiers: { speedMult: 1.3, livesStart: 2, scoreMult: 1.5, enemyHp: 2 }
    },
    {
      id: "nightmare",
      label: "Nightmare",
      tag: "Leaderboard",
      description: "One life. Top speed. Triple score — for the leaderboard.",
      modifiers: { speedMult: 1.7, livesStart: 1, scoreMult: 3.0, enemyHp: 3 }
    }
  ];

  var DEFAULT_TIER_ID = "normal";

  /* -- Internal state ------------------------------------------------------ */
  // registry: gameId -> { tiers: [...], byId: { tierId -> tier }, defaultId }
  var registry = {};
  // selections: gameId -> tierId
  var selections = {};
  var listeners = { change: [], register: [] };
  // Mounted selector instances (for cross-instance refresh on `set`).
  var mounts = [];

  /* -- Helpers ------------------------------------------------------------- */
  function isObject(o) { return o && typeof o === "object" && !isArray(o); }
  function isArray(a) { return Object.prototype.toString.call(a) === "[object Array]"; }
  function isString(s) { return typeof s === "string"; }
  function isNumber(n) { return typeof n === "number" && !isNaN(n); }

  function shallowCloneObj(o) {
    var out = {};
    for (var k in o) if (o.hasOwnProperty(k)) out[k] = o[k];
    return out;
  }
  function cloneTier(t) {
    var out = shallowCloneObj(t);
    out.modifiers = shallowCloneObj(t.modifiers || {});
    return out;
  }
  function cloneTierList(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(cloneTier(list[i]));
    return out;
  }
  function findTier(entry, tierId) {
    if (!entry) return null;
    return entry.byId.hasOwnProperty(tierId) ? entry.byId[tierId] : null;
  }
  function pickDefaultId(tiers) {
    // Prefer "normal" if present, else first tier.
    for (var i = 0; i < tiers.length; i++) {
      if (tiers[i].id === DEFAULT_TIER_ID) return DEFAULT_TIER_ID;
    }
    return tiers.length ? tiers[0].id : DEFAULT_TIER_ID;
  }

  function loadFromStorage() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!isObject(saved)) return;
      for (var k in saved) {
        if (saved.hasOwnProperty(k) && isString(saved[k])) {
          selections[k] = saved[k];
        }
      }
    } catch (e) { /* ignore corrupt storage */ }
  }
  function saveToStorage() {
    try {
      if (root.localStorage) {
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
      }
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
    for (var i = arr.length - 1; i >= 0; i--) {
      if (arr[i] === handler) arr.splice(i, 1);
    }
  }

  /* -- Tier validation ----------------------------------------------------- */
  function validateTier(t, idx) {
    if (!isObject(t)) return null;
    if (!isString(t.id) || !t.id) return null;
    var clean = {
      id: t.id,
      label: isString(t.label) && t.label ? t.label : t.id,
      tag: isString(t.tag) ? t.tag : "",
      description: isString(t.description) ? t.description : "",
      modifiers: isObject(t.modifiers) ? shallowCloneObj(t.modifiers) : {}
    };
    return clean;
  }
  function buildEntry(rawTiers) {
    var list = isArray(rawTiers) && rawTiers.length ? rawTiers : DEFAULT_TIERS;
    var clean = [];
    var byId = {};
    for (var i = 0; i < list.length; i++) {
      var t = validateTier(list[i], i);
      if (!t) continue;
      // De-dupe on id (last write wins for cleaner re-register semantics).
      if (byId[t.id]) {
        for (var j = 0; j < clean.length; j++) {
          if (clean[j].id === t.id) { clean.splice(j, 1); break; }
        }
      }
      byId[t.id] = t;
      clean.push(t);
    }
    if (!clean.length) {
      clean = cloneTierList(DEFAULT_TIERS);
      byId = {};
      for (var k = 0; k < clean.length; k++) byId[clean[k].id] = clean[k];
    }
    return { tiers: clean, byId: byId, defaultId: pickDefaultId(clean) };
  }

  /* -- Public API: register / current / set / tiers / modifier ------------- */
  function register(gameId, rawTiers) {
    if (!isString(gameId) || !gameId) return;
    var entry = buildEntry(rawTiers);
    registry[gameId] = entry;
    // If a stored selection points at a tier that no longer exists, drop it.
    var sel = selections[gameId];
    if (sel && !entry.byId[sel]) {
      delete selections[gameId];
      saveToStorage();
    }
    emit("register", { gameId: gameId, tiers: cloneTierList(entry.tiers) });
    refreshAllMountsFor(gameId);
  }

  function ensureRegistered(gameId) {
    if (!registry[gameId]) register(gameId);
    return registry[gameId];
  }

  function current(gameId) {
    if (!isString(gameId) || !gameId) {
      return cloneTier(findDefaultTier());
    }
    var entry = ensureRegistered(gameId);
    var sel = selections[gameId];
    var tier = sel ? findTier(entry, sel) : null;
    if (!tier) tier = findTier(entry, entry.defaultId);
    if (!tier) tier = entry.tiers[0] || findDefaultTier();
    return cloneTier(tier);
  }

  function findDefaultTier() {
    for (var i = 0; i < DEFAULT_TIERS.length; i++) {
      if (DEFAULT_TIERS[i].id === DEFAULT_TIER_ID) return DEFAULT_TIERS[i];
    }
    return DEFAULT_TIERS[1] || DEFAULT_TIERS[0];
  }

  function set(gameId, tierId) {
    if (!isString(gameId) || !gameId) return;
    var entry = ensureRegistered(gameId);
    if (!isString(tierId) || !entry.byId[tierId]) {
      // Unknown tier — fall back to the entry's default.
      tierId = entry.defaultId;
    }
    var prev = selections[gameId] || null;
    if (prev === tierId) {
      // No-op, but still refresh mounts in case UI is out of sync.
      refreshAllMountsFor(gameId);
      return;
    }
    selections[gameId] = tierId;
    saveToStorage();
    emit("change", {
      gameId: gameId,
      tierId: tierId,
      tier: cloneTier(entry.byId[tierId]),
      previousTierId: prev
    });
    refreshAllMountsFor(gameId);
  }

  function tiers(gameId) {
    var entry = ensureRegistered(gameId);
    return cloneTierList(entry.tiers);
  }

  function modifier(gameId, key, fallback) {
    if (arguments.length < 3) fallback = 1;
    if (!isString(gameId) || !gameId || !isString(key)) return fallback;
    var entry = ensureRegistered(gameId);
    var sel = selections[gameId];
    var tier = sel ? findTier(entry, sel) : findTier(entry, entry.defaultId);
    if (!tier) tier = entry.tiers[0];
    if (!tier || !tier.modifiers) return fallback;
    if (!tier.modifiers.hasOwnProperty(key)) return fallback;
    var v = tier.modifiers[key];
    if (v === null || v === undefined) return fallback;
    return v;
  }

  /* -- Style injection ----------------------------------------------------- */
  function injectStyles() {
    if (!root.document || root.document.getElementById(STYLE_ID)) return;
    var css = ""
      + ".mdiff-root{display:flex;flex-direction:column;gap:8px;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#e8dfc8;}"
      + ".mdiff-label{font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a48d5b;font-weight:600;}"
      + ".mdiff-row{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;}"
      + ".mdiff-chip{appearance:none;background:#1a1410;color:#e8dfc8;border:1px solid #5a4828;padding:8px 14px;border-radius:6px;cursor:pointer;font:inherit;font-size:13px;font-weight:600;letter-spacing:0.02em;transition:background 120ms,border-color 120ms,color 120ms,transform 80ms;display:flex;flex-direction:column;align-items:flex-start;min-width:88px;line-height:1.2;}"
      + ".mdiff-chip:hover{background:#251a12;border-color:#8a6a3a;}"
      + ".mdiff-chip:focus-visible{outline:2px solid #c39a4d;outline-offset:2px;}"
      + ".mdiff-chip:active{transform:translateY(1px);}"
      + ".mdiff-chip[aria-pressed='true']{background:#3a2a16;border-color:#c39a4d;color:#fff5d8;box-shadow:inset 0 0 0 1px #c39a4d;}"
      + ".mdiff-chip-label{font-size:13px;font-weight:700;}"
      + ".mdiff-chip-tag{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#a48d5b;margin-top:2px;}"
      + ".mdiff-chip[aria-pressed='true'] .mdiff-chip-tag{color:#d8b87a;}"
      + ".mdiff-desc{font-size:12px;color:#b8a98a;min-height:1.4em;font-style:italic;line-height:1.4;}"
      + ".mdiff-select{appearance:none;background:#1a1410;color:#e8dfc8;border:1px solid #5a4828;padding:6px 28px 6px 10px;border-radius:6px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;background-image:linear-gradient(45deg,transparent 50%,#a48d5b 50%),linear-gradient(135deg,#a48d5b 50%,transparent 50%);background-position:calc(100% - 14px) center,calc(100% - 9px) center;background-size:5px 5px,5px 5px;background-repeat:no-repeat;}"
      + ".mdiff-select:focus-visible{outline:2px solid #c39a4d;outline-offset:2px;}"
      + ".mdiff-compact{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}"
      + ".mdiff-compact .mdiff-label{margin:0;}"
      + "";
    var el = root.document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    (root.document.head || root.document.documentElement).appendChild(el);
  }

  /* -- DOM helpers --------------------------------------------------------- */
  function el(tag, cls, text) {
    var n = root.document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* -- Selector UI: full (chips) ------------------------------------------ */
  function buildChipSelector(container, gameId, opts) {
    container.innerHTML = "";
    var entry = ensureRegistered(gameId);

    var rootEl = el("div", "mdiff-root");
    if (opts.title !== false) {
      rootEl.appendChild(el("div", "mdiff-label", opts.title || "Difficulty"));
    }
    var row = el("div", "mdiff-row");
    rootEl.appendChild(row);
    var desc = el("div", "mdiff-desc", "");
    rootEl.appendChild(desc);

    var chipMap = {};

    function paint() {
      var sel = current(gameId);
      for (var id in chipMap) {
        if (!chipMap.hasOwnProperty(id)) continue;
        chipMap[id].setAttribute("aria-pressed", id === sel.id ? "true" : "false");
      }
      desc.textContent = sel.description || "";
    }

    for (var i = 0; i < entry.tiers.length; i++) {
      (function (tier) {
        var btn = el("button", "mdiff-chip");
        btn.type = "button";
        btn.setAttribute("data-tier-id", tier.id);
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("title", tier.description || tier.label);
        btn.appendChild(el("span", "mdiff-chip-label", tier.label));
        if (tier.tag) btn.appendChild(el("span", "mdiff-chip-tag", tier.tag));
        btn.addEventListener("click", function () { set(gameId, tier.id); });
        row.appendChild(btn);
        chipMap[tier.id] = btn;
      })(entry.tiers[i]);
    }

    container.appendChild(rootEl);
    paint();

    return {
      el: rootEl,
      paint: paint
    };
  }

  /* -- Selector UI: compact (dropdown) ------------------------------------ */
  function buildCompactSelector(container, gameId, opts) {
    container.innerHTML = "";
    var entry = ensureRegistered(gameId);

    var rootEl = el("div", "mdiff-root mdiff-compact");
    if (opts.title !== false) {
      rootEl.appendChild(el("span", "mdiff-label", opts.title || "Difficulty"));
    }
    var select = root.document.createElement("select");
    select.className = "mdiff-select";
    select.setAttribute("aria-label", opts.title || "Difficulty");

    for (var i = 0; i < entry.tiers.length; i++) {
      var t = entry.tiers[i];
      var opt = root.document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.tag ? t.label + " — " + t.tag : t.label;
      select.appendChild(opt);
    }

    function paint() {
      var sel = current(gameId);
      if (select.value !== sel.id) select.value = sel.id;
    }

    select.addEventListener("change", function () { set(gameId, select.value); });
    rootEl.appendChild(select);
    container.appendChild(rootEl);
    paint();

    return {
      el: rootEl,
      paint: paint
    };
  }

  /* -- mountSelector ------------------------------------------------------- */
  function refreshAllMountsFor(gameId) {
    for (var i = 0; i < mounts.length; i++) {
      if (mounts[i].gameId === gameId) {
        try { mounts[i].instance.paint(); } catch (e) { /* swallow */ }
      }
    }
  }

  function mountSelector(container, gameId, opts) {
    opts = opts || {};
    if (!container || !root.document) {
      return { unmount: function () {}, refresh: function () {} };
    }
    if (!isString(gameId) || !gameId) {
      return { unmount: function () {}, refresh: function () {} };
    }
    injectStyles();
    ensureRegistered(gameId);

    var instance = opts.compact
      ? buildCompactSelector(container, gameId, opts)
      : buildChipSelector(container, gameId, opts);

    var record = { gameId: gameId, instance: instance, container: container };
    mounts.push(record);

    return {
      unmount: function () {
        for (var i = mounts.length - 1; i >= 0; i--) {
          if (mounts[i] === record) mounts.splice(i, 1);
        }
        if (record.container && record.container.contains(instance.el)) {
          try { record.container.removeChild(instance.el); } catch (e) {}
        }
      },
      refresh: function () { try { instance.paint(); } catch (e) {} }
    };
  }

  /* -- Boot ---------------------------------------------------------------- */
  loadFromStorage();

  /* -- Expose -------------------------------------------------------------- */
  root.MrMacsDifficulty = {
    register: register,
    current: current,
    set: set,
    tiers: tiers,
    modifier: modifier,
    mountSelector: mountSelector,
    on: on,
    off: off,
    // Read-only constants for inspection / tests.
    DEFAULT_TIERS: cloneTierList(DEFAULT_TIERS),
    STORAGE_KEY: STORAGE_KEY
  };

})(typeof window !== "undefined" ? window : this);
