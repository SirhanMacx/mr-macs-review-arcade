/* Mr. Mac's Arcade — Shared Performance Helpers
 *
 * Detects low-end devices (Chromebooks, older iPads) and exposes a unified
 * "lite mode" flag that games can read to gate heavy effects. Also exposes
 * lightweight timing primitives (now/mark/measure), animation-frame and idle
 * scheduling wrappers, and a memory-usage snapshot for performance budgets.
 *
 * Lite mode is true if ANY of:
 *   - prefers-reduced-motion is set
 *   - MrMacsProfile.getSettings().motion === "reduce"
 *   - navigator.deviceMemory < 4
 *   - navigator.hardwareConcurrency <= 2
 *   - The user has manually toggled "Lite mode" via the profile drawer
 *
 * Usage in a game:
 *   if (MrMacsArcadePerf.isLite()) { skipParticleStorm(); }
 *   MrMacsArcadePerf.onChange(handler) // called when lite mode flips
 *   MrMacsArcadePerf.mark("level-load");
 *   const ms = MrMacsArcadePerf.measure("level-load-time", "level-load");
 *   await MrMacsArcadePerf.withFrame(() => render());
 *   MrMacsArcadePerf.idleCallback(() => warmCache());
 *
 * Also: applies body classes for CSS gating: .arcade-lite, .arcade-reduced-motion.
 */
(function () {
  "use strict";

  var listeners = [];
  var liteCache = null;
  var marks = Object.create(null);

  function safeNow() {
    try {
      if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
      }
    } catch (e) {}
    return Date.now();
  }

  function detectLite() {
    if (liteCache !== null) return liteCache;
    var p = (typeof window !== "undefined") ? window.MrMacsProfile : null;
    var settings = (p && typeof p.getSettings === "function") ? p.getSettings() : { motion: "auto" };
    settings = settings || { motion: "auto" };
    var reduced = false;
    try {
      reduced = typeof window !== "undefined" && window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}
    if (settings.motion === "reduce") reduced = true;
    var lowMem = (typeof navigator !== "undefined" && navigator.deviceMemory && navigator.deviceMemory < 4);
    var lowCores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    liteCache = !!(reduced || lowMem || lowCores || settings.lite === true);
    return liteCache;
  }

  function applyBodyClasses() {
    if (typeof document === "undefined" || !document.body) return;
    var lite = detectLite();
    var p = (typeof window !== "undefined") ? window.MrMacsProfile : null;
    var settings = (p && typeof p.getSettings === "function") ? p.getSettings() : {};
    settings = settings || {};
    document.body.classList.toggle("arcade-lite", !!lite);
    document.body.classList.toggle("arcade-reduced-motion", settings.motion === "reduce");
  }

  function refresh() {
    var was = liteCache;
    liteCache = null;
    var nowLite = detectLite();
    applyBodyClasses();
    if (nowLite !== was) {
      listeners.forEach(function (fn) {
        try { fn(nowLite); } catch (e) {}
      });
    }
    return nowLite;
  }

  // Listen for profile settings changes to flip lite mode reactively
  if (typeof window !== "undefined") {
    var bind = function () {
      if (window.MrMacsProfile && typeof window.MrMacsProfile.on === "function") {
        try { window.MrMacsProfile.on("settings:change", refresh); } catch (e) {}
      }
    };
    if (typeof document !== "undefined") {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(function () { bind(); applyBodyClasses(); }, 0);
      } else {
        document.addEventListener("DOMContentLoaded", function () { bind(); applyBodyClasses(); });
      }
    }
    if (window.matchMedia) {
      try {
        window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", refresh);
      } catch (e) {
        try { window.matchMedia("(prefers-reduced-motion: reduce)").addListener(refresh); } catch (e2) {}
      }
    }
  }

  // ---- Timing primitives ----------------------------------------------------

  function mark(label) {
    if (!label) return null;
    var t = safeNow();
    marks[String(label)] = t;
    return t;
  }

  function measure(label, fromMark) {
    var end = safeNow();
    var start = fromMark != null ? marks[String(fromMark)] : null;
    if (start == null) start = end;
    var delta = end - start;
    if (label) marks["measure:" + String(label)] = delta;
    return delta;
  }

  function clearMarks(label) {
    if (label == null) {
      marks = Object.create(null);
      return;
    }
    delete marks[String(label)];
    delete marks["measure:" + String(label)];
  }

  // ---- Frame and idle scheduling -------------------------------------------

  function withFrame(fn) {
    return new Promise(function (resolve, reject) {
      var raf = (typeof window !== "undefined" && window.requestAnimationFrame) ||
        function (cb) { return setTimeout(function () { cb(safeNow()); }, 16); };
      raf(function (t) {
        if (typeof fn !== "function") { resolve(t); return; }
        try {
          var out = fn(t);
          resolve(out);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  function idleCallback(fn, opts) {
    if (typeof fn !== "function") return 0;
    opts = opts || {};
    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      try { return window.requestIdleCallback(fn, opts); } catch (e) {}
    }
    var timeout = Number(opts.timeout) || 1;
    return setTimeout(function () {
      var start = safeNow();
      try {
        fn({
          didTimeout: false,
          timeRemaining: function () { return Math.max(0, 50 - (safeNow() - start)); }
        });
      } catch (e) {}
    }, timeout);
  }

  function cancelIdle(handle) {
    if (handle == null) return;
    if (typeof window !== "undefined" && typeof window.cancelIdleCallback === "function") {
      try { window.cancelIdleCallback(handle); return; } catch (e) {}
    }
    try { clearTimeout(handle); } catch (e) {}
  }

  // ---- Memory snapshot ------------------------------------------------------

  function memoryUsage() {
    try {
      if (typeof performance !== "undefined" && performance.memory) {
        var m = performance.memory;
        return {
          used: Number(m.usedJSHeapSize) || 0,
          total: Number(m.totalJSHeapSize) || 0,
          limit: Number(m.jsHeapSizeLimit) || 0,
          available: true
        };
      }
    } catch (e) {}
    return { used: 0, total: 0, limit: 0, available: false };
  }

  var API = {
    isLite: function () { return detectLite(); },
    refresh: refresh,
    onChange: function (handler) {
      if (typeof handler === "function") listeners.push(handler);
    },
    offChange: function (handler) {
      var i = listeners.indexOf(handler);
      if (i >= 0) listeners.splice(i, 1);
    },
    now: safeNow,
    mark: mark,
    measure: measure,
    clearMarks: clearMarks,
    withFrame: withFrame,
    idleCallback: idleCallback,
    cancelIdle: cancelIdle,
    memoryUsage: memoryUsage
  };

  if (typeof window !== "undefined") {
    window.MrMacsArcadePerf = API;
  }
})();
