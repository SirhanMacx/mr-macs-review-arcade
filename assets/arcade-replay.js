/* ============================================================================
 * arcade-replay.js
 * Mr. Mac's Review Arcade — Generic input-recording + replay module.
 *
 * Any arcade game can opt into recording its run and replaying/sharing it.
 * Game records timestamped events during play; this module schedules them
 * back at the right intervals on replay so the game can re-apply state.
 *
 * Public surface: window.MrMacsReplay
 *   Recording: startRecording, recordEvent, stopRecording, isRecording
 *   Replay:    startReplay, pauseReplay, resumeReplay, stopReplay,
 *              isReplaying, setSpeed, seekTo, getReplayStatus
 *   Storage:   saveReplay, loadReplay, listReplays, deleteReplay, clearAll
 *   Sharing:   exportReplayJson, importReplayJson
 *   UI:        renderReplayPicker(container), renderReplayBadge(container, id)
 *   Events:    on(name, handler), off(name, handler)
 *
 * Events emitted: "record:start" "record:event" "record:stop"
 *                 "replay:start" "replay:event" "replay:pause" "replay:resume"
 *                 "replay:stop" "replay:end" "replay:speed" "replay:seek"
 *                 "save" "delete" "import" "clear" "error"
 *
 * Storage: localStorage key "mr-macs-arcade-replays-v1".
 * Caps: 20 replays / profile (oldest evicted), 5000 events / replay.
 * Idempotent: re-loading the script does nothing if MrMacsReplay already exists.
 * Self-contained CSS injected once with id "arcade-replay-styles".
 * ==========================================================================*/
(function (root) {
  "use strict";
  if (root.MrMacsReplay) return;

  /* -- Constants ----------------------------------------------------------- */
  var STORAGE_KEY = "mr-macs-arcade-replays-v1";
  var STYLE_ID = "arcade-replay-styles";
  var SCHEMA_VERSION = 1;
  var MAX_REPLAYS = 20;
  var MAX_EVENTS_PER_REPLAY = 5000;
  var DEFAULT_SPEED = 1;
  var SPEED_CHOICES = [0.5, 1, 2, 4];

  /* -- Helpers ------------------------------------------------------------- */
  function nowMs() {
    if (typeof performance !== "undefined" && performance.now) {
      return performance.now();
    }
    return Date.now();
  }

  function genId(prefix) {
    var s = (prefix || "rpl") + "-" + Date.now().toString(36) + "-";
    for (var i = 0; i < 6; i++) {
      s += Math.floor(Math.random() * 36).toString(36);
    }
    return s;
  }

  function clamp(n, lo, hi) {
    if (n < lo) return lo;
    if (n > hi) return hi;
    return n;
  }

  function safeJsonParse(s) {
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  function safeJsonStringify(v) {
    try { return JSON.stringify(v); } catch (e) { return null; }
  }

  function clone(v) {
    var s = safeJsonStringify(v);
    if (s == null) return null;
    return safeJsonParse(s);
  }

  function fmtDuration(ms) {
    if (typeof ms !== "number" || !isFinite(ms) || ms < 0) ms = 0;
    var totalSec = Math.floor(ms / 1000);
    var m = Math.floor(totalSec / 60);
    var s = totalSec - m * 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function fmtTimestamp(ts) {
    if (!ts) return "—";
    try {
      var d = new Date(ts);
      var hr = d.getHours();
      var ampm = hr >= 12 ? "p" : "a";
      hr = hr % 12; if (hr === 0) hr = 12;
      var mn = d.getMinutes();
      return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear()
        + " " + hr + ":" + (mn < 10 ? "0" : "") + mn + ampm;
    } catch (e) { return String(ts); }
  }

  /* -- Event emitter ------------------------------------------------------- */
  var listeners = {};

  function emit(name, payload) {
    var arr = listeners[name];
    if (!arr || !arr.length) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (e) { /* best-effort */ }
    }
  }

  function on(name, handler) {
    if (typeof handler !== "function") return;
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

  /* -- Storage ------------------------------------------------------------- */
  function readStore() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { v: SCHEMA_VERSION, replays: [] };
      var parsed = safeJsonParse(raw);
      if (!parsed || typeof parsed !== "object") {
        return { v: SCHEMA_VERSION, replays: [] };
      }
      if (!Array.isArray(parsed.replays)) parsed.replays = [];
      return parsed;
    } catch (e) {
      return { v: SCHEMA_VERSION, replays: [] };
    }
  }

  function writeStore(store) {
    try {
      var s = safeJsonStringify(store);
      if (s == null) return false;
      root.localStorage.setItem(STORAGE_KEY, s);
      return true;
    } catch (e) {
      emit("error", { where: "writeStore", error: String(e) });
      return false;
    }
  }

  function metaOf(replay) {
    return {
      id: replay.id,
      gameId: replay.gameId,
      ts: replay.ts,
      durationMs: replay.durationMs,
      score: typeof replay.score === "number" ? replay.score : null,
      eventCount: Array.isArray(replay.events) ? replay.events.length : 0
    };
  }

  /* -- Recording state ----------------------------------------------------- */
  // recordingState: { sessionId, gameId, startedAt, startedAtPerf, events, opts }
  var recordingState = null;

  function startRecording(gameId, opts) {
    // Auto-stop any prior recording defensively rather than throw.
    if (recordingState) { try { stopRecording(); } catch (e) {} }
    var sessionId = genId("rec");
    recordingState = {
      sessionId: sessionId,
      gameId: String(gameId || "unknown"),
      startedAt: Date.now(),
      startedAtPerf: nowMs(),
      events: [],
      opts: opts || {}
    };
    emit("record:start", { sessionId: sessionId, gameId: recordingState.gameId });
    return { sessionId: sessionId };
  }

  function recordEvent(name, payload) {
    if (!recordingState) return;
    if (recordingState.events.length >= MAX_EVENTS_PER_REPLAY) return;
    var t = nowMs() - recordingState.startedAtPerf;
    var ev = {
      t: Math.round(t < 0 ? 0 : t),
      name: String(name || "event"),
      payload: payload != null ? clone(payload) : null
    };
    recordingState.events.push(ev);
    emit("record:event", { sessionId: recordingState.sessionId, event: ev });
  }

  function stopRecording(finalState) {
    if (!recordingState) return null;
    var durationMs = Math.max(0, Math.round(nowMs() - recordingState.startedAtPerf));
    var result = {
      id: recordingState.sessionId,
      sessionId: recordingState.sessionId,
      gameId: recordingState.gameId,
      ts: recordingState.startedAt,
      durationMs: durationMs,
      events: recordingState.events.slice(0),
      finalState: finalState != null ? clone(finalState) : null,
      score: (finalState && typeof finalState.score === "number") ? finalState.score : null,
      v: SCHEMA_VERSION
    };
    recordingState = null;
    emit("record:stop", { sessionId: result.sessionId, durationMs: durationMs, events: result.events.length });
    return result;
  }

  function isRecording() {
    return !!recordingState;
  }

  /* -- Storage operations -------------------------------------------------- */
  function saveReplay(replayObj) {
    if (!replayObj || typeof replayObj !== "object") return null;
    var copy = clone(replayObj);
    if (!copy) return null;
    if (!copy.id) copy.id = genId("rpl");
    if (!copy.ts) copy.ts = Date.now();
    if (!copy.gameId) copy.gameId = "unknown";
    if (!Array.isArray(copy.events)) copy.events = [];
    if (copy.events.length > MAX_EVENTS_PER_REPLAY) {
      copy.events = copy.events.slice(0, MAX_EVENTS_PER_REPLAY);
    }
    copy.v = SCHEMA_VERSION;

    var store = readStore();
    // Replace existing by id, else append.
    var replaced = false;
    for (var i = 0; i < store.replays.length; i++) {
      if (store.replays[i].id === copy.id) { store.replays[i] = copy; replaced = true; break; }
    }
    if (!replaced) store.replays.push(copy);

    // Cap: keep newest MAX_REPLAYS by ts.
    if (store.replays.length > MAX_REPLAYS) {
      store.replays.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
      store.replays = store.replays.slice(0, MAX_REPLAYS);
    }
    if (!writeStore(store)) return null;
    emit("save", { id: copy.id, gameId: copy.gameId });
    return copy.id;
  }

  function loadReplay(id) {
    if (!id) return null;
    var store = readStore();
    for (var i = 0; i < store.replays.length; i++) {
      if (store.replays[i].id === id) return clone(store.replays[i]);
    }
    return null;
  }

  function listReplays(filterGameId) {
    var store = readStore();
    var out = [];
    for (var i = 0; i < store.replays.length; i++) {
      var r = store.replays[i];
      if (filterGameId && r.gameId !== filterGameId) continue;
      out.push(metaOf(r));
    }
    out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    return out;
  }

  function deleteReplay(id) {
    if (!id) return false;
    var store = readStore();
    var before = store.replays.length;
    store.replays = store.replays.filter(function (r) { return r.id !== id; });
    if (store.replays.length === before) return false;
    if (!writeStore(store)) return false;
    emit("delete", { id: id });
    return true;
  }

  function clearAll() {
    var store = { v: SCHEMA_VERSION, replays: [] };
    if (writeStore(store)) {
      emit("clear", {});
    }
  }

  /* -- Sharing (export / import) ------------------------------------------ */
  function exportReplayJson(id) {
    var r = loadReplay(id);
    if (!r) return null;
    var pkg = { kind: "mr-macs-arcade-replay", v: SCHEMA_VERSION, replay: r };
    return safeJsonStringify(pkg);
  }

  function importReplayJson(jsonStr) {
    var parsed = safeJsonParse(jsonStr);
    if (!parsed || parsed.kind !== "mr-macs-arcade-replay" || !parsed.replay) {
      emit("error", { where: "importReplayJson", error: "invalid envelope" });
      return null;
    }
    var r = parsed.replay;
    if (!r.events || !Array.isArray(r.events)) {
      emit("error", { where: "importReplayJson", error: "missing events" });
      return null;
    }
    // Re-id on import to avoid overwriting an existing replay accidentally.
    r.id = genId("rpl");
    var savedId = saveReplay(r);
    if (savedId) emit("import", { id: savedId, gameId: r.gameId });
    return savedId;
  }

  /* -- Replay engine ------------------------------------------------------- */
  // replayState: { sessionId, gameId, events, speed,
  //   currentMs (virtual playhead, ms), nextIdx, timer,
  //   timerScheduledAt (perf ms), timerForT (event t targeted),
  //   paused, finished, totalDurationMs }
  var replayState = null;

  function clearActiveTimer() {
    if (replayState && replayState.timer) {
      try { root.clearTimeout(replayState.timer); } catch (e) { /* ignore */ }
      replayState.timer = null;
      replayState.timerScheduledAt = 0;
      replayState.timerForT = -1;
    }
  }

  function scheduleNext() {
    if (!replayState || replayState.paused || replayState.finished) return;
    if (replayState.nextIdx >= replayState.events.length) {
      finishReplay();
      return;
    }
    var ev = replayState.events[replayState.nextIdx];
    var deltaVirtual = ev.t - replayState.currentMs;
    if (deltaVirtual < 0) deltaVirtual = 0;
    var deltaWall = deltaVirtual / (replayState.speed || 1);
    if (deltaWall < 0) deltaWall = 0;
    if (deltaWall > 0x7fffffff) deltaWall = 0x7fffffff; // setTimeout cap

    replayState.timerScheduledAt = nowMs();
    replayState.timerForT = ev.t;
    replayState.timer = root.setTimeout(function () {
      if (!replayState || replayState.paused || replayState.finished) return;
      // Advance virtual playhead to this event's t.
      replayState.currentMs = ev.t;
      replayState.nextIdx += 1;
      try {
        emit("replay:event", {
          sessionId: replayState.sessionId,
          gameId: replayState.gameId,
          name: ev.name,
          payload: ev.payload,
          t: ev.t,
          index: replayState.nextIdx - 1,
          total: replayState.events.length
        });
      } catch (e) { /* best-effort */ }
      replayState.timer = null;
      scheduleNext();
    }, deltaWall);
  }

  function finishReplay() {
    if (!replayState) return;
    replayState.finished = true;
    clearActiveTimer();
    var sid = replayState.sessionId;
    var gid = replayState.gameId;
    emit("replay:end", { sessionId: sid, gameId: gid });
    replayState = null;
  }

  function startReplay(sessionId, opts) {
    if (replayState) stopReplay();
    var rec = loadReplay(sessionId);
    if (!rec) {
      emit("error", { where: "startReplay", error: "not-found", id: sessionId });
      return null;
    }
    var o = opts || {};
    replayState = {
      sessionId: rec.id,
      gameId: rec.gameId,
      events: rec.events || [],
      speed: typeof o.speed === "number" && o.speed > 0 ? o.speed : DEFAULT_SPEED,
      currentMs: typeof o.startMs === "number" ? Math.max(0, o.startMs) : 0,
      nextIdx: 0,
      timer: null,
      timerScheduledAt: 0,
      timerForT: -1,
      paused: false,
      finished: false,
      totalDurationMs: rec.durationMs || 0
    };
    // If a startMs was supplied, advance nextIdx past events before it.
    while (replayState.nextIdx < replayState.events.length &&
           replayState.events[replayState.nextIdx].t < replayState.currentMs) {
      replayState.nextIdx += 1;
    }
    emit("replay:start", {
      sessionId: replayState.sessionId,
      gameId: replayState.gameId,
      totalEvents: replayState.events.length,
      durationMs: replayState.totalDurationMs,
      speed: replayState.speed
    });
    scheduleNext();
    return {
      sessionId: replayState.sessionId,
      totalEvents: replayState.events.length,
      durationMs: replayState.totalDurationMs
    };
  }

  function pauseReplay() {
    if (!replayState || replayState.paused || replayState.finished) return;
    // Compute virtual progress within the currently-pending interval.
    if (replayState.timer && replayState.timerForT >= 0) {
      var virtualElapsed = (nowMs() - replayState.timerScheduledAt) * (replayState.speed || 1);
      var newCurrent = replayState.currentMs + virtualElapsed;
      if (newCurrent > replayState.timerForT) newCurrent = replayState.timerForT;
      replayState.currentMs = newCurrent;
    }
    clearActiveTimer();
    replayState.paused = true;
    emit("replay:pause", { sessionId: replayState.sessionId, currentMs: replayState.currentMs });
  }

  function resumeReplay() {
    if (!replayState || !replayState.paused || replayState.finished) return;
    replayState.paused = false;
    emit("replay:resume", { sessionId: replayState.sessionId, currentMs: replayState.currentMs });
    scheduleNext();
  }

  function stopReplay() {
    if (!replayState) return;
    clearActiveTimer();
    replayState.finished = true;
    emit("replay:stop", { sessionId: replayState.sessionId });
    replayState = null;
  }

  function isReplaying() {
    return !!replayState && !replayState.finished;
  }

  function setSpeed(rate) {
    if (typeof rate !== "number" || !isFinite(rate) || rate <= 0) {
      return replayState ? replayState.speed : DEFAULT_SPEED;
    }
    if (!replayState) return rate;
    var wasPaused = replayState.paused;
    if (!wasPaused) pauseReplay();
    replayState.speed = rate;
    emit("replay:speed", { sessionId: replayState.sessionId, speed: rate });
    if (!wasPaused) resumeReplay();
    return rate;
  }

  function seekTo(ms) {
    if (!replayState) return;
    if (typeof ms !== "number" || !isFinite(ms)) return;
    var target = clamp(ms, 0, replayState.totalDurationMs || ms);
    var wasPaused = replayState.paused;
    if (!wasPaused) pauseReplay();
    replayState.currentMs = target;
    replayState.nextIdx = 0;
    while (replayState.nextIdx < replayState.events.length &&
           replayState.events[replayState.nextIdx].t < target) {
      replayState.nextIdx += 1;
    }
    emit("replay:seek", { sessionId: replayState.sessionId, currentMs: target, nextIdx: replayState.nextIdx });
    if (!wasPaused) resumeReplay();
  }

  function getReplayStatus() {
    if (!replayState) return { active: false };
    return {
      active: true,
      sessionId: replayState.sessionId,
      gameId: replayState.gameId,
      currentMs: replayState.currentMs,
      durationMs: replayState.totalDurationMs,
      nextIdx: replayState.nextIdx,
      total: replayState.events.length,
      paused: replayState.paused,
      speed: replayState.speed
    };
  }

  /* -- Styles -------------------------------------------------------------- */
  function injectStyles() {
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(STYLE_ID)) return;
    var css = ".arpl-picker{font-family:Inter,system-ui,sans-serif;color:#e8e2d5;background:#1a1612;border:1px solid #8b6f3a;border-radius:8px;padding:10px;max-width:520px;}"
      + ".arpl-picker h3{margin:0 0 8px 0;font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:#f3c969;}"
      + ".arpl-empty{font-size:12px;color:#a89a82;padding:8px 4px;}"
      + ".arpl-list{list-style:none;margin:0;padding:0;max-height:280px;overflow-y:auto;}"
      + ".arpl-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;border-radius:6px;}"
      + ".arpl-row + .arpl-row{margin-top:4px;}.arpl-row:hover{background:#241d16;}"
      + ".arpl-meta{flex:1;min-width:0;font-size:12px;line-height:1.3;}"
      + ".arpl-game{font-weight:600;color:#f3c969;}.arpl-sub{color:#a89a82;font-size:11px;}"
      + ".arpl-btn{font-family:inherit;font-size:11px;background:#2a241d;color:#e8e2d5;border:1px solid #8b6f3a;border-radius:5px;padding:4px 10px;cursor:pointer;transition:background .12s linear;}"
      + ".arpl-btn:hover{background:#3a3024;}.arpl-btn:focus-visible{outline:2px solid #f3c969;outline-offset:1px;}"
      + ".arpl-btn.danger{border-color:#8b3a3a;color:#f0c0c0;}.arpl-btn.danger:hover{background:#3a2424;}"
      + ".arpl-badge{display:inline-flex;align-items:center;gap:6px;font-family:Inter,system-ui,sans-serif;font-size:12px;background:linear-gradient(180deg,#2a241d,#1a1612);color:#f3c969;border:1px solid #8b6f3a;border-radius:999px;padding:4px 12px;cursor:pointer;transition:transform .1s linear,background .12s linear;}"
      + ".arpl-badge:hover{background:linear-gradient(180deg,#3a3024,#241d16);transform:translateY(-1px);}"
      + ".arpl-badge:focus-visible{outline:2px solid #f3c969;outline-offset:2px;}.arpl-badge .arpl-tri{font-size:10px;}"
      + "@media (prefers-reduced-motion: reduce){.arpl-btn,.arpl-badge{transition:none;}.arpl-badge:hover{transform:none;}}";
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* -- UI: replay picker --------------------------------------------------- */
  function renderReplayPicker(container, options) {
    if (!container || typeof container.appendChild !== "function") {
      return { unmount: function () {} };
    }
    injectStyles();
    var opts = options || {};
    var filterGameId = opts.gameId || null;

    var wrap = document.createElement("div");
    wrap.className = "arpl-picker";

    var heading = document.createElement("h3");
    heading.textContent = opts.title || "Saved Replays";
    wrap.appendChild(heading);

    var listEl = document.createElement("ul");
    listEl.className = "arpl-list";
    wrap.appendChild(listEl);

    function rebuild() {
      while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
      var rows = listReplays(filterGameId);
      if (!rows.length) {
        var empty = document.createElement("div");
        empty.className = "arpl-empty";
        empty.textContent = "No replays saved yet. Finish a run to capture one.";
        listEl.appendChild(empty);
        return;
      }
      for (var i = 0; i < rows.length; i++) {
        listEl.appendChild(buildRow(rows[i]));
      }
    }

    function makeBtn(cls, text, label, handler) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = cls;
      b.textContent = text;
      b.setAttribute("aria-label", label);
      b.addEventListener("click", handler);
      return b;
    }

    function buildRow(meta) {
      var li = document.createElement("li");
      li.className = "arpl-row";
      li.setAttribute("data-replay-id", meta.id);

      var info = document.createElement("div");
      info.className = "arpl-meta";
      var gameLine = document.createElement("div");
      gameLine.className = "arpl-game";
      gameLine.textContent = meta.gameId || "unknown";
      var subLine = document.createElement("div");
      subLine.className = "arpl-sub";
      var scoreTxt = (typeof meta.score === "number") ? (" · " + meta.score + " pts") : "";
      subLine.textContent = fmtTimestamp(meta.ts) + " · " + fmtDuration(meta.durationMs) + scoreTxt;
      info.appendChild(gameLine);
      info.appendChild(subLine);
      li.appendChild(info);

      li.appendChild(makeBtn("arpl-btn", "Replay", "Replay " + (meta.gameId || "run"), function () {
        try {
          startReplay(meta.id);
          if (typeof opts.onPlay === "function") opts.onPlay(meta.id);
        } catch (e) { emit("error", { where: "picker.play", error: String(e) }); }
      }));

      li.appendChild(makeBtn("arpl-btn danger", "X", "Delete replay", function () {
        deleteReplay(meta.id);
        rebuild();
        if (typeof opts.onDelete === "function") opts.onDelete(meta.id);
      }));

      return li;
    }

    rebuild();
    container.appendChild(wrap);

    var refreshHandler = function () { rebuild(); };
    var subscribed = ["save", "delete", "import", "clear"];
    for (var s = 0; s < subscribed.length; s++) on(subscribed[s], refreshHandler);

    return {
      unmount: function () {
        for (var s = 0; s < subscribed.length; s++) off(subscribed[s], refreshHandler);
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      },
      refresh: rebuild
    };
  }

  /* -- UI: replay badge ---------------------------------------------------- */
  function renderReplayBadge(container, replayId, options) {
    if (!container || typeof container.appendChild !== "function") {
      return { unmount: function () {} };
    }
    injectStyles();
    var opts = options || {};
    var meta = null;
    var rec = loadReplay(replayId);
    if (rec) {
      meta = metaOf(rec);
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "arpl-badge";
    btn.setAttribute("aria-label", "Replay best run");

    var tri = document.createElement("span");
    tri.className = "arpl-tri";
    tri.textContent = "▶"; // ▶
    btn.appendChild(tri);

    var label = document.createElement("span");
    if (meta) {
      var labelText = (opts.label || "Replay best run") + " · " + fmtDuration(meta.durationMs);
      label.textContent = labelText;
    } else {
      label.textContent = opts.label || "Replay unavailable";
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    }
    btn.appendChild(label);

    btn.addEventListener("click", function () {
      if (!meta) return;
      try {
        startReplay(replayId);
        if (typeof opts.onPlay === "function") opts.onPlay(replayId);
      } catch (e) { emit("error", { where: "badge.play", error: String(e) }); }
    });

    container.appendChild(btn);

    return {
      unmount: function () {
        if (btn.parentNode) btn.parentNode.removeChild(btn);
      }
    };
  }

  /* -- Public surface ------------------------------------------------------ */
  root.MrMacsReplay = {
    // recording
    startRecording: startRecording, recordEvent: recordEvent,
    stopRecording: stopRecording, isRecording: isRecording,
    // replay
    startReplay: startReplay, pauseReplay: pauseReplay,
    resumeReplay: resumeReplay, stopReplay: stopReplay,
    isReplaying: isReplaying, setSpeed: setSpeed,
    seekTo: seekTo, getReplayStatus: getReplayStatus,
    // storage
    saveReplay: saveReplay, loadReplay: loadReplay,
    listReplays: listReplays, deleteReplay: deleteReplay,
    clearAll: clearAll,
    // sharing
    exportReplayJson: exportReplayJson, importReplayJson: importReplayJson,
    // UI helpers
    renderReplayPicker: renderReplayPicker, renderReplayBadge: renderReplayBadge,
    // events
    on: on, off: off,
    // constants
    SPEED_CHOICES: SPEED_CHOICES.slice(0),
    MAX_REPLAYS: MAX_REPLAYS,
    MAX_EVENTS_PER_REPLAY: MAX_EVENTS_PER_REPLAY
  };

})(typeof window !== "undefined" ? window : this);
