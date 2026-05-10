/**
 * arcade-heatmap.js — 12-week × 7-day activity heatmap.
 * Exposes window.MrMacsHeatmap: { mount, computeData, refreshAll, on, off }
 */

(function (global) {
  "use strict";

  // ─── Guard against double-load ─────────────────────────────────────────────
  if (global.MrMacsHeatmap) return;

  // ─── Constants ─────────────────────────────────────────────────────────────
  var DAYS = 84; // 12 weeks × 7 days
  var WEEKS = 12;
  var DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var COLORS = [
    "rgba(255,255,255,0.05)",  // level 0 – no activity
    "rgba(245,196,81,0.20)",   // level 1 – 1 play
    "rgba(245,196,81,0.45)",   // level 2 – 2-3 plays
    "rgba(245,196,81,0.70)",   // level 3 – 4-6 plays
    "rgba(245,196,81,1.0)",    // level 4 – 7+ plays (legendary)
  ];

  // ─── Styles (injected once) ─────────────────────────────────────────────────
  var STYLE_ID = "mhm-styles";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ".mhm-wrap{display:inline-block;font-family:inherit;}",
      ".mhm-grid-area{display:flex;gap:0;}",
      ".mhm-day-labels{display:flex;flex-direction:column;justify-content:space-around;",
      "  padding-top:20px;margin-right:6px;}",
      ".mhm-day-label{font-size:10px;color:rgba(255,255,255,0.45);line-height:12px;",
      "  height:12px;display:flex;align-items:center;}",
      ".mhm-weeks{display:flex;flex-direction:row;gap:3px;}",
      ".mhm-week{display:flex;flex-direction:column;gap:3px;}",
      ".mhm-week-header{height:16px;font-size:9px;color:rgba(255,255,255,0.35);",
      "  white-space:nowrap;text-align:center;margin-bottom:2px;}",
      ".mhm-cell{width:12px;height:12px;border-radius:2px;cursor:pointer;",
      "  transition:opacity 0.15s,transform 0.1s;box-sizing:border-box;}",
      ".mhm-cell:hover{opacity:0.85;transform:scale(1.2);}",
      ".mhm-cell--today{border:1.5px solid rgba(0,229,255,0.9);}",
      ".mhm-cell--level4{box-shadow:0 0 5px 1px rgba(245,196,81,0.55);}",
      /* Tooltip */
      ".mhm-tooltip{position:fixed;z-index:9999;background:rgba(20,20,30,0.97);",
      "  border:1px solid rgba(245,196,81,0.35);border-radius:6px;padding:5px 9px;",
      "  font-size:11px;color:#eee;pointer-events:none;white-space:nowrap;",
      "  transform:translate(-50%,-110%);opacity:0;transition:opacity 0.12s;}",
      ".mhm-tooltip--visible{opacity:1;}",
      /* Fade-in animation for mount */
      "@keyframes mhm-fadein{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:none;}}",
      ".mhm-fadein{animation:mhm-fadein 0.35s ease both;}",
      /* Reduced-motion override */
      "@media(prefers-reduced-motion:reduce){.mhm-cell{transition:none;}",
      ".mhm-fadein{animation:none;}.mhm-tooltip{transition:none;}}",
      /* Mobile: shrink cells */
      "@media(max-width:520px){.mhm-cell{width:10px;height:10px;}",
      ".mhm-day-label{height:10px;line-height:10px;font-size:9px;}.mhm-weeks{gap:2px;}.mhm-week{gap:2px;}}",
    ].join("");
    var el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }

  // ─── Event bus ─────────────────────────────────────────────────────────────
  var _listeners = {};

  function emit(name, data) {
    var arr = _listeners[name];
    if (!arr) return;
    arr.slice().forEach(function (fn) { try { fn(data); } catch (e) {} });
  }

  function on(name, fn) {
    if (!_listeners[name]) _listeners[name] = [];
    _listeners[name].push(fn);
  }

  function off(name, fn) {
    if (!_listeners[name]) return;
    _listeners[name] = _listeners[name].filter(function (h) { return h !== fn; });
  }

  // ─── Date helpers ───────────────────────────────────────────────────────────
  function toISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function todayISO() {
    return toISO(new Date());
  }

  /** Return Date object for N days ago (relative to today). */
  function daysAgo(n) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d;
  }

  /** Short month label for a Date, e.g. "May 3". */
  function shortDate(d) {
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[d.getMonth()] + " " + d.getDate();
  }

  // ─── Core data computation ──────────────────────────────────────────────────
  // Returns [{date, count, level, shards}] oldest→newest (84 entries).
  // count inferred from dailyShards (≈30 shards/session); falls back to 1 if
  // the day is in playDays but shards are absent.
  function computeData(profile, days) {
    days = (typeof days === "number" && days > 0) ? days : DAYS;
    var playSet = {}, dailyShards = {};
    try {
      var prof = profile || {};
      (prof.playDays || []).forEach(function (d) { playSet[d] = true; });
      dailyShards = prof.dailyShards || {};
    } catch (e) {}

    var result = [];
    for (var i = days - 1; i >= 0; i--) {
      var iso = toISO(daysAgo(i));
      var shards = typeof dailyShards[iso] === "number" ? dailyShards[iso] : 0;
      var count = playSet[iso] ? (shards > 0 ? Math.max(1, Math.round(shards / 30)) : 1) : 0;
      result.push({ date: iso, count: count, level: countToLevel(count), shards: shards });
    }
    return result;
  }

  function countToLevel(count) {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
  }

  // ─── Tooltip singleton ──────────────────────────────────────────────────────
  var _tooltipEl = null;

  function getTooltip() {
    if (!_tooltipEl) {
      _tooltipEl = document.createElement("div");
      _tooltipEl.className = "mhm-tooltip";
      document.body.appendChild(_tooltipEl);
    }
    return _tooltipEl;
  }

  function showTooltip(cell, text) {
    var tip = getTooltip();
    tip.textContent = text;
    var rect = cell.getBoundingClientRect();
    tip.style.left = (rect.left + rect.width / 2) + "px";
    tip.style.top = rect.top + "px";
    tip.classList.add("mhm-tooltip--visible");
  }

  function hideTooltip() {
    if (_tooltipEl) _tooltipEl.classList.remove("mhm-tooltip--visible");
  }

  // ─── Week label helpers ─────────────────────────────────────────────────────
  function weekLabel(weekIndex) {
    var d = daysAgo((WEEKS - 1 - weekIndex) * 7 + 6);
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[d.getMonth()] + " " + d.getDate();
  }

  // ─── Mount ─────────────────────────────────────────────────────────────────
  var _mounts = []; // { container, render }

  function mount(container, opts) {
    opts = opts || {};
    injectStyles();
    container.innerHTML = "";
    getTooltip(); // ensure singleton exists in DOM

    var wrap = document.createElement("div");
    wrap.className = "mhm-wrap mhm-fadein";
    var gridArea = document.createElement("div");
    gridArea.className = "mhm-grid-area";

    // Day labels (left column — show alternating labels to avoid crowding)
    var dayLabelsCol = document.createElement("div");
    dayLabelsCol.className = "mhm-day-labels";
    var SHOW_LABELS = { Sun: 1, Tue: 1, Thu: 1, Sat: 1 };
    DAY_LABELS.forEach(function (name) {
      var span = document.createElement("div");
      span.className = "mhm-day-label";
      span.textContent = SHOW_LABELS[name] ? name : "";
      dayLabelsCol.appendChild(span);
    });
    gridArea.appendChild(dayLabelsCol);

    var weeksEl = document.createElement("div");
    weeksEl.className = "mhm-weeks";
    gridArea.appendChild(weeksEl);
    wrap.appendChild(gridArea);
    container.appendChild(wrap);

    function render() {
      var profile = null;
      try {
        if (global.MrMacsProfile && typeof global.MrMacsProfile.get === "function") {
          profile = global.MrMacsProfile.get();
        }
      } catch (e) {}
      var data = computeData(profile, DAYS);
      var today = todayISO();
      weeksEl.innerHTML = "";

      for (var w = 0; w < WEEKS; w++) {
        var weekEl = document.createElement("div");
        weekEl.className = "mhm-week";

        // Week header label
        var header = document.createElement("div");
        header.className = "mhm-week-header";
        header.textContent = weekLabel(w);
        weekEl.appendChild(header);

        for (var d = 0; d < 7; d++) {
          var idx = w * 7 + d;
          var item = data[idx] || { date: "", count: 0, level: 0, shards: 0 };

          var cell = document.createElement("div");
          cell.className = "mhm-cell";
          if (item.level === 4) cell.classList.add("mhm-cell--level4");
          if (item.date === today) cell.classList.add("mhm-cell--today");

          cell.style.background = COLORS[item.level] || COLORS[0];

          (function (cellEl, cellItem) {
            cellEl.addEventListener("mouseenter", function () {
              if (!cellItem.date) return;
              var label = shortDate(new Date(cellItem.date + "T00:00:00"));
              var text = label + " · " + cellItem.count + (cellItem.count === 1 ? " play" : " plays");
              if (cellItem.shards > 0) text += " · +" + cellItem.shards + " shards";
              showTooltip(cellEl, text);
            });
            cellEl.addEventListener("mouseleave", hideTooltip);
          })(cell, item);

          weekEl.appendChild(cell);
        }

        weeksEl.appendChild(weekEl);
      }
    }

    render();
    var mountEntry = { container: container, render: render };
    _mounts.push(mountEntry);
    emit("heatmap:mounted", { container: container });

    return {
      unmount: function () {
        var idx = _mounts.indexOf(mountEntry);
        if (idx !== -1) _mounts.splice(idx, 1);
        container.innerHTML = "";
        hideTooltip();
      },
      refresh: function () { render(); emit("heatmap:refreshed", { count: 1 }); },
    };
  }

  function refreshAll() {
    _mounts.forEach(function (m) { try { m.render(); } catch (e) {} });
    emit("heatmap:refreshed", { count: _mounts.length });
  }

  function hookProfileEvents() {
    try {
      if (!global.MrMacsProfile || typeof global.MrMacsProfile.on !== "function") return;
      global.MrMacsProfile.on("profile:update", refreshAll);
      global.MrMacsProfile.on("streak:advance", refreshAll);
    } catch (e) {}
  }

  // Hook immediately if profile is already loaded; otherwise poll via rAF.
  if (global.MrMacsProfile) {
    hookProfileEvents();
  } else {
    var _hookAttempts = 0;
    function _tryHook() {
      if (global.MrMacsProfile) { hookProfileEvents(); return; }
      if (++_hookAttempts < 30) {
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame(_tryHook)
          : setTimeout(_tryHook, 100);
      }
    }
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame(_tryHook)
      : setTimeout(_tryHook, 50);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────
  global.MrMacsHeatmap = {
    mount: mount,
    computeData: computeData,
    refreshAll: refreshAll,
    on: on,
    off: off,
  };

})(typeof window !== "undefined" ? window : global);
