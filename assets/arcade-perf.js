/* Mr. Mac's Arcade — Shared Performance Helpers
 *
 * Detects low-end devices (Chromebooks, older iPads) and exposes a unified
 * "lite mode" flag that games can read to gate heavy effects.
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
 *
 * Also: applies body classes for CSS gating: .arcade-lite, .arcade-reduced-motion.
 */
(function () {
  "use strict";

  var listeners = [];
  var liteCache = null;

  function detectLite() {
    if (liteCache !== null) return liteCache;
    var p = window.MrMacsProfile;
    var settings = p && p.getSettings ? p.getSettings() : { motion: "auto" };
    var reduced = false;
    try {
      reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}
    if (settings.motion === "reduce") reduced = true;
    var lowMem = (typeof navigator !== "undefined" && navigator.deviceMemory && navigator.deviceMemory < 4);
    var lowCores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    liteCache = !!(reduced || lowMem || lowCores || settings.lite === true);
    return liteCache;
  }

  function applyBodyClasses() {
    if (!document.body) return;
    var lite = detectLite();
    var p = window.MrMacsProfile;
    var settings = p && p.getSettings ? p.getSettings() : {};
    document.body.classList.toggle("arcade-lite", !!lite);
    document.body.classList.toggle("arcade-reduced-motion", settings.motion === "reduce");
  }

  function refresh() {
    var was = liteCache;
    liteCache = null;
    var nowLite = detectLite();
    applyBodyClasses();
    if (nowLite !== was) {
      listeners.forEach(function (fn) { try { fn(nowLite); } catch (e) {} });
    }
    return nowLite;
  }

  // Listen for profile settings changes to flip lite mode reactively
  if (typeof window !== "undefined") {
    var bind = function () {
      if (window.MrMacsProfile && window.MrMacsProfile.on) {
        window.MrMacsProfile.on("settings:change", refresh);
      }
    };
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(function () { bind(); applyBodyClasses(); }, 0);
    } else {
      document.addEventListener("DOMContentLoaded", function () { bind(); applyBodyClasses(); });
    }
    if (window.matchMedia) {
      try {
        window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", refresh);
      } catch (e) {
        try { window.matchMedia("(prefers-reduced-motion: reduce)").addListener(refresh); } catch (e2) {}
      }
    }
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
    }
  };

  if (typeof window !== "undefined") {
    window.MrMacsArcadePerf = API;
  }
})();
