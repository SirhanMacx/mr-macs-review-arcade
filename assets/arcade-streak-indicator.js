(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var SESSION_KEY     = "mr-macs-streak-indicator-v1:unlocks";
  var WINDOW_MS       = 10 * 60 * 1000;   // 10 minutes
  var HIDDEN_ACHIEVE  = "streak-master";

  // Milestones: { count, bonusShards, message, level }
  //   level: "base" | "big" | "legendary"
  var MILESTONES = [
    { count: 3,  bonusShards: 50,  level: "base",      message: "🔥 Hot Streak! 3 unlocks in 10 minutes (+50 shards)" },
    { count: 5,  bonusShards: 100, level: "big",        message: "🔥🔥 Super Streak! 5 unlocks in 10 minutes (+100 shards)" },
    { count: 10, bonusShards: 200, level: "legendary",  message: "🏆 Streak Master! 10 unlocks in a session (+200 shards)" }
  ];

  // ---------------------------------------------------------------------------
  // EventEmitter (tiny, no deps)
  // ---------------------------------------------------------------------------

  function EventEmitter() {
    this._handlers = {};
  }

  EventEmitter.prototype.on = function (event, handler) {
    if (typeof handler !== "function") return;
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
  };

  EventEmitter.prototype.off = function (event, handler) {
    var list = this._handlers[event];
    if (!list) return;
    this._handlers[event] = list.filter(function (h) { return h !== handler; });
  };

  EventEmitter.prototype.emit = function (event, data) {
    var list = this._handlers[event] || [];
    list.forEach(function (h) {
      try { h(data); } catch (e) {}
    });
  };

  // ---------------------------------------------------------------------------
  // SessionStorage helpers (defensive: falls back silently)
  // ---------------------------------------------------------------------------

  function readSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { unlocks: [] };
    } catch (e) {
      return { unlocks: [] };
    }
  }

  function writeSession(data) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // Core logic
  // ---------------------------------------------------------------------------

  var emitter  = new EventEmitter();
  var started  = false;
  var _handler = null; // reference kept for cleanup

  // Fire bonusShards via MrMacsProfile if available
  function grantShards(amount, source) {
    try {
      var profile = window.MrMacsProfile;
      if (profile && typeof profile.addShards === "function") {
        profile.addShards(amount, source || "streak-bonus");
      }
    } catch (e) {}
  }

  // Unlock hidden achievement defensively (only if registry knows it)
  function tryUnlockStreakMaster() {
    try {
      var profile = window.MrMacsProfile;
      if (!profile) return;
      // Check whether the achievement exists in the registry before unlocking
      if (typeof profile.hasAchievement === "function" && !profile.hasAchievement(HIDDEN_ACHIEVE)) {
        return;
      }
      if (typeof profile.unlockAchievement === "function") {
        profile.unlockAchievement(HIDDEN_ACHIEVE);
      }
    } catch (e) {}
  }

  // Fire celebration effects for a given milestone level
  function celebrate(level, message) {
    // Toast always
    try {
      var c = window.MrMacsCelebration;
      if (c && typeof c.showToast === "function") {
        c.showToast(message, { size: "large", duration: 4200 });
      }
    } catch (e) {}

    if (level === "base") {
      // Modest fireworks
      try {
        var c2 = window.MrMacsCelebration;
        if (c2 && typeof c2.fireworks === "function") {
          c2.fireworks({ shells: 3, duration: 2200 });
        }
      } catch (e) {}
    } else if (level === "big") {
      // More fireworks
      try {
        var c3 = window.MrMacsCelebration;
        if (c3 && typeof c3.fireworks === "function") {
          c3.fireworks({ shells: 5, duration: 3000 });
        }
      } catch (e) {}
    } else if (level === "legendary") {
      // Full legendary celebration
      try {
        var c4 = window.MrMacsCelebration;
        if (c4) {
          if (typeof c4.fireworks === "function") {
            c4.fireworks({ shells: 8, duration: 4000 });
          }
          if (typeof c4.confetti === "function") {
            c4.confetti({ count: 120, duration: 4000 });
          }
        }
      } catch (e) {}
    }
  }

  // Prune unlocks outside the sliding 10-minute window
  function pruneWindow(unlocks) {
    var cutoff = Date.now() - WINDOW_MS;
    return unlocks.filter(function (ts) { return ts >= cutoff; });
  }

  // Return the milestone object if count crosses a threshold (exact crossing only)
  function milestoneFor(prevCount, newCount) {
    var hit = null;
    MILESTONES.forEach(function (m) {
      if (prevCount < m.count && newCount >= m.count) {
        hit = m;
      }
    });
    return hit;
  }

  // Called every time an achievement:unlock event fires
  function onUnlock(detail) {
    var data = readSession();
    var unlocks = pruneWindow(data.unlocks || []);
    var prevCount = unlocks.length;
    unlocks.push(Date.now());
    data.unlocks = unlocks;
    writeSession(data);

    var newCount = unlocks.length;

    // Emit our own event so consumers can react
    emitter.emit("unlock", { count: newCount, detail: detail });

    // Check milestones
    var milestone = milestoneFor(prevCount, newCount);
    if (milestone) {
      celebrate(milestone.level, milestone.message);
      grantShards(milestone.bonusShards, "streak-bonus");

      if (milestone.level === "legendary") {
        tryUnlockStreakMaster();
      }

      emitter.emit("milestone", {
        count:       newCount,
        bonusShards: milestone.bonusShards,
        level:       milestone.level,
        message:     milestone.message
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Subscribe to MrMacsProfile events
  // ---------------------------------------------------------------------------

  function subscribeToProfile() {
    try {
      var profile = window.MrMacsProfile;
      if (profile && typeof profile.on === "function") {
        _handler = function (detail) { onUnlock(detail); };
        profile.on("achievement:unlock", _handler);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function unsubscribeFromProfile() {
    try {
      var profile = window.MrMacsProfile;
      if (profile && typeof profile.off === "function" && _handler) {
        profile.off("achievement:unlock", _handler);
      }
    } catch (e) {}
    _handler = null;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * window.MrMacsStreakIndicator
   *
   * start()          — Call once on hub/game load to begin tracking.
   * stop()           — Detach listener and stop tracking (does not clear data).
   * getCount()       — Current session unlock count (within last 10 min window).
   * reset()          — Clear session unlock history.
   * on(event, fn)    — Subscribe to "unlock" or "milestone" events.
   * off(event, fn)   — Unsubscribe.
   *
   * Events:
   *   "unlock"    — { count: number, detail: any }
   *   "milestone" — { count: number, bonusShards: number, level: string, message: string }
   */
  window.MrMacsStreakIndicator = {
    start: function () {
      if (started) return; // idempotent
      started = true;
      // If MrMacsProfile is already loaded, subscribe immediately;
      // otherwise wait for it to announce itself (defensive late-load).
      if (!subscribeToProfile()) {
        var MAX_WAIT = 12000; // ms
        var interval = 400;   // ms
        var elapsed  = 0;
        var timer = window.setInterval(function () {
          elapsed += interval;
          if (subscribeToProfile()) {
            window.clearInterval(timer);
          } else if (elapsed >= MAX_WAIT) {
            window.clearInterval(timer);
            // Could not attach — silent graceful degradation
          }
        }, interval);
      }
    },

    stop: function () {
      if (!started) return;
      started = false;
      unsubscribeFromProfile();
    },

    getCount: function () {
      var data = readSession();
      return pruneWindow(data.unlocks || []).length;
    },

    reset: function () {
      clearSession();
      emitter.emit("reset", {});
    },

    on: function (event, handler) {
      emitter.on(event, handler);
    },

    off: function (event, handler) {
      emitter.off(event, handler);
    }
  };

})();
