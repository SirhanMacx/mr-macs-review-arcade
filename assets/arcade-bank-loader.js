/* Mr. Mac's Review Arcade - lazy shared-question-bank loader
 *
 * The generated question bank is intentionally rich, but it is also large
 * enough to make the hub and game pages feel sticky if it blocks parsing.
 * This shim keeps the public globals exactly the same while loading the bank
 * after first paint, or immediately when a feature explicitly needs it.
 */
(function (root) {
  "use strict";
  if (!root || root.MrMacsQuestionBank) return;

  var BANK_FILE = "shared-question-bank.js?v=20260518-fast-bank";
  var status = root.DIAG_BANK_BY_COURSE ? "loaded" : "idle";
  var promise = status === "loaded" ? Promise.resolve(root.DIAG_BANK_BY_COURSE) : null;
  var basePath = "";

  try {
    var current = document.currentScript && document.currentScript.src;
    if (current) basePath = current.slice(0, current.lastIndexOf("/") + 1);
  } catch (e) {}

  function bankUrl() {
    return basePath + BANK_FILE;
  }

  function emit(name, detail) {
    try {
      root.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (e) {}
  }

  function isLoaded() {
    return !!(root.DIAG_BANK_BY_COURSE && Object.keys(root.DIAG_BANK_BY_COURSE).length);
  }

  function load(opts) {
    opts = opts || {};
    if (isLoaded()) {
      status = "loaded";
      if (!promise) promise = Promise.resolve(root.DIAG_BANK_BY_COURSE);
      return promise;
    }
    if (promise) return promise;
    status = "loading";
    promise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = bankUrl();
      script.async = true;
      if (opts.priority) {
        try { script.fetchPriority = "high"; } catch (e) {}
      }
      script.onload = function () {
        status = isLoaded() ? "loaded" : "error";
        if (status === "loaded") {
          emit("mrmacs:question-bank-ready", { courses: Object.keys(root.DIAG_BANK_BY_COURSE).length });
          resolve(root.DIAG_BANK_BY_COURSE);
        } else {
          reject(new Error("shared question bank did not expose DIAG_BANK_BY_COURSE"));
        }
      };
      script.onerror = function () {
        status = "error";
        promise = null;
        reject(new Error("failed to load shared question bank"));
      };
      document.head.appendChild(script);
    });
    emit("mrmacs:question-bank-loading", { priority: !!opts.priority });
    return promise;
  }

  function idle(fn, timeout) {
    if (typeof root.requestIdleCallback === "function") {
      return root.requestIdleCallback(fn, { timeout: timeout || 6000 });
    }
    return root.setTimeout(fn, Math.min(timeout || 6000, 2500));
  }

  function warm() {
    if (isLoaded() || status === "loading") return;
    idle(function () { load().catch(function () {}); }, 6500);
  }

  function ready() {
    return isLoaded() ? Promise.resolve(root.DIAG_BANK_BY_COURSE) : load();
  }

  root.MrMacsQuestionBank = {
    load: load,
    ready: ready,
    warm: warm,
    isLoaded: isLoaded,
    status: function () { return status; },
    url: bankUrl
  };

  function warmDelay() {
    var gamePage = false;
    try {
      gamePage = !!(document.body && (
        document.body.hasAttribute("data-game-page") ||
        document.getElementById("gameCanvas") ||
        document.getElementById("startBtn")
      ));
    } catch (e) {}
    return gamePage ? 4500 : 1400;
  }

  if (document.readyState === "complete") {
    root.setTimeout(warm, warmDelay());
  } else {
    root.addEventListener("load", function () {
      root.setTimeout(warm, warmDelay());
    }, { once: true });
  }

  root.addEventListener("pointerdown", function (event) {
    var target = event.target && event.target.closest &&
      event.target.closest("[data-quiz-gauntlet-start], #rcDiagnostic, #rcMastery, #mockStart");
    if (target) load({ priority: true }).catch(function () {});
  }, { capture: true, passive: true });
})(typeof window !== "undefined" ? window : globalThis);
