/**
 * arcade-session-timer.js
 * Mr. Mac's Review Arcade — Session Timer Module
 *
 * Tracks cumulative active time for the current browser tab session.
 * Pauses when the tab is hidden, persists state in sessionStorage.
 * Gently suggests breaks after 60 min of active play.
 *
 * Usage:
 *   <script src="assets/arcade-session-timer.js"></script>
 *   window.MrMacsSessionTimer.start();
 *
 * API:
 *   start(), stop(), reset(), getElapsedMs(),
 *   formatElapsed(ms), mount(container, opts),
 *   shouldSuggestBreak(), showBreakSuggestion(), dismissBreakSuggestion(),
 *   on(event, handler), off(event, handler)
 */
(function (root) {
  'use strict';

  // ── Guard against double-load ──────────────────────────────────────────────
  if (root.MrMacsSessionTimer) return;

  // ── Constants ──────────────────────────────────────────────────────────────
  var SS_KEY          = 'mst_session';
  var TICK_INTERVAL   = 60_000;     // ms between mounted-display refreshes
  var DEFAULT_BREAK   = 60 * 60_000; // 60 min
  var BREAK_DURATION  = 5 * 60_000;  // 5 min

  // ── Internal state ─────────────────────────────────────────────────────────
  var _running         = false;
  var _startedAt       = 0;       // Date.now() when last resume happened
  var _accumulated     = 0;       // ms banked from prior active periods
  var _breakThreshold  = DEFAULT_BREAK;
  var _breakSuggested  = false;   // has break been triggered this session?
  var _tickTimer       = null;
  var _mounts          = [];      // { el, opts, intervalId }
  var _handlers        = {};      // eventName -> [fn, ...]
  var _breakOverlayEl  = null;
  var _breakModalEl    = null;
  var _breakCountTimer = null;

  // ── sessionStorage helpers ─────────────────────────────────────────────────
  function _ssLoad() {
    try {
      var raw = sessionStorage.getItem(SS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function _ssSave() {
    try {
      sessionStorage.setItem(SS_KEY, JSON.stringify({
        accumulated:    _accumulated,
        running:        _running,
        startedAt:      _startedAt,
        breakSuggested: _breakSuggested,
        breakThreshold: _breakThreshold
      }));
    } catch (_) {}
  }

  function _ssLoad_init() {
    var saved = _ssLoad();
    if (!saved) return;
    _accumulated    = saved.accumulated    || 0;
    _breakSuggested = saved.breakSuggested || false;
    _breakThreshold = saved.breakThreshold || DEFAULT_BREAK;
    // If the tab was running when it was hidden, bank the time to startedAt
    if (saved.running && saved.startedAt) {
      _accumulated += Date.now() - saved.startedAt;
    }
  }

  // ── Event emitter ──────────────────────────────────────────────────────────
  function _emit(event, payload) {
    var list = _handlers[event];
    if (!list) return;
    list.slice().forEach(function (fn) { try { fn(payload); } catch (_) {} });
  }

  // ── Core timing ───────────────────────────────────────────────────────────
  function _resume() {
    if (_running) return;
    _running   = true;
    _startedAt = Date.now();
    _ssSave();
    _emit('resume', { elapsed: _getElapsed() });
  }

  function _pause() {
    if (!_running) return;
    _accumulated += Date.now() - _startedAt;
    _running   = false;
    _startedAt = 0;
    _ssSave();
    _emit('pause', { elapsed: _accumulated });
  }

  function _getElapsed() {
    if (!_running) return _accumulated;
    return _accumulated + (Date.now() - _startedAt);
  }

  // ── Visibility handler ────────────────────────────────────────────────────
  function _onVisibilityChange() {
    if (document.hidden) {
      _pause();
    } else {
      _resume();
    }
  }

  // ── Tick: refresh all mounted displays ───────────────────────────────────
  function _tick() {
    var elapsed = _getElapsed();
    _mounts.forEach(function (m) { _refreshMount(m, elapsed); });
    _emit('tick', { elapsed: elapsed });
  }

  // ── Mount display ─────────────────────────────────────────────────────────
  function _refreshMount(m, elapsed) {
    if (!m.chip) return;
    var fmt = _formatElapsed(elapsed);
    m.chip.textContent = '⏱ ' + fmt;
    if (m.tooltip) {
      var ms  = elapsed;
      var sec = Math.floor(ms / 1000) % 60;
      var min = Math.floor(ms / 60_000) % 60;
      var hr  = Math.floor(ms / 3_600_000);
      var exact = (hr ? hr + 'h ' : '') +
                  _pad2(min) + 'm ' + _pad2(sec) + 's';
      m.tooltip.textContent = 'Active time: ' + exact;
    }
  }

  function _mountDisplay(container, opts) {
    opts = opts || {};

    // Wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'mst-mount';

    // Chip
    var chip = document.createElement('button');
    chip.className = 'mst-chip';
    chip.setAttribute('aria-label', 'Session timer');
    chip.setAttribute('type', 'button');

    // Tooltip (hidden by default)
    var tooltip = document.createElement('div');
    tooltip.className = 'mst-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');

    wrapper.appendChild(chip);
    wrapper.appendChild(tooltip);
    container.appendChild(wrapper);

    // Toggle tooltip on chip click
    var expanded = false;
    chip.addEventListener('click', function () {
      expanded = !expanded;
      tooltip.setAttribute('aria-hidden', String(!expanded));
      tooltip.classList.toggle('mst-tooltip--visible', expanded);
    });

    // Close tooltip when clicking outside
    function _docClick(e) {
      if (!wrapper.contains(e.target)) {
        expanded = false;
        tooltip.setAttribute('aria-hidden', 'true');
        tooltip.classList.remove('mst-tooltip--visible');
      }
    }
    document.addEventListener('click', _docClick);

    var mountRecord = { el: container, opts: opts, chip: chip, tooltip: tooltip };
    _mounts.push(mountRecord);
    _refreshMount(mountRecord, _getElapsed());

    return {
      refresh: function () { _refreshMount(mountRecord, _getElapsed()); },
      unmount: function () {
        document.removeEventListener('click', _docClick);
        _mounts = _mounts.filter(function (m) { return m !== mountRecord; });
        if (container.contains(wrapper)) container.removeChild(wrapper);
      }
    };
  }

  // ── Break suggestion ──────────────────────────────────────────────────────
  function _shouldSuggestBreak() {
    if (_breakSuggested) return false;
    return _getElapsed() >= _breakThreshold;
  }

  function _showBreakSuggestion() {
    if (_breakModalEl) return; // already showing
    _ensureStyles();

    var modal = document.createElement('div');
    modal.className = 'mst-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Break suggestion');

    var box = document.createElement('div');
    box.className = 'mst-modal-box';

    var icon = document.createElement('div');
    icon.className = 'mst-modal-icon';
    icon.textContent = '⏰'; // alarm clock

    var msg = document.createElement('p');
    msg.className = 'mst-modal-msg';
    msg.textContent = "You’ve been at it for " +
      _formatElapsedVerbose(_getElapsed()) +
      ". Time for a quick break?";

    var btnRow = document.createElement('div');
    btnRow.className = 'mst-modal-btns';

    var btnBreak = document.createElement('button');
    btnBreak.className = 'mst-btn mst-btn--primary';
    btnBreak.textContent = '5 min break';
    btnBreak.setAttribute('type', 'button');

    var btnKeep = document.createElement('button');
    btnKeep.className = 'mst-btn mst-btn--ghost';
    btnKeep.textContent = 'Keep playing';
    btnKeep.setAttribute('type', 'button');

    btnBreak.addEventListener('click', function () {
      _dismissBreakSuggestion();
      _startBreakCountdown();
    });

    btnKeep.addEventListener('click', function () {
      _dismissBreakSuggestion();
    });

    btnRow.appendChild(btnBreak);
    btnRow.appendChild(btnKeep);
    box.appendChild(icon);
    box.appendChild(msg);
    box.appendChild(btnRow);
    modal.appendChild(box);
    document.body.appendChild(modal);

    _breakModalEl    = modal;
    _breakSuggested  = true;
    _ssSave();
    _emit('breakSuggested', { elapsed: _getElapsed() });
  }

  function _dismissBreakSuggestion() {
    if (_breakModalEl) {
      document.body.removeChild(_breakModalEl);
      _breakModalEl = null;
    }
    _emit('breakDismissed', {});
  }

  // ── 5-min break countdown overlay ────────────────────────────────────────
  function _startBreakCountdown() {
    if (_breakOverlayEl) return;
    _pause(); // stop counting active time during break

    var endAt    = Date.now() + BREAK_DURATION;
    var overlay  = document.createElement('div');
    overlay.className = 'mst-break-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    var inner = document.createElement('div');
    inner.className = 'mst-break-inner';

    var heading = document.createElement('h2');
    heading.className = 'mst-break-heading';
    heading.textContent = 'Take a Break';

    var sub = document.createElement('p');
    sub.className = 'mst-break-sub';
    sub.textContent = 'Step away, stretch, hydrate.';

    var countdown = document.createElement('div');
    countdown.className = 'mst-break-countdown';

    var skipBtn = document.createElement('button');
    skipBtn.className = 'mst-btn mst-btn--ghost mst-break-skip';
    skipBtn.textContent = 'Skip break';
    skipBtn.setAttribute('type', 'button');
    skipBtn.addEventListener('click', _endBreak);

    inner.appendChild(heading);
    inner.appendChild(sub);
    inner.appendChild(countdown);
    inner.appendChild(skipBtn);
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
    _breakOverlayEl = overlay;

    function _tick() {
      var remaining = Math.max(0, endAt - Date.now());
      var min = Math.floor(remaining / 60_000);
      var sec = Math.floor((remaining % 60_000) / 1000);
      countdown.textContent = _pad2(min) + ':' + _pad2(sec);
      if (remaining <= 0) _endBreak();
    }

    _tick();
    _breakCountTimer = setInterval(_tick, 1000);
    _emit('breakStarted', {});
  }

  function _endBreak() {
    if (_breakCountTimer) { clearInterval(_breakCountTimer); _breakCountTimer = null; }
    if (_breakOverlayEl) {
      document.body.removeChild(_breakOverlayEl);
      _breakOverlayEl = null;
    }
    // Resume if tab is visible
    if (!document.hidden) _resume();
    _emit('breakEnded', {});
  }

  // ── Formatting helpers ────────────────────────────────────────────────────
  function _formatElapsed(ms) {
    var totalMin = Math.floor(ms / 60_000);
    var hr       = Math.floor(totalMin / 60);
    var min      = totalMin % 60;
    if (hr > 0) return hr + 'h ' + min + 'm';
    return min + 'm';
  }

  function _formatElapsedVerbose(ms) {
    var totalMin = Math.floor(ms / 60_000);
    var hr       = Math.floor(totalMin / 60);
    var min      = totalMin % 60;
    if (hr > 0) {
      return hr + ' hour' + (hr !== 1 ? 's' : '') +
             (min > 0 ? ' ' + min + ' min' : '');
    }
    return min + ' min';
  }

  function _pad2(n) { return n < 10 ? '0' + n : String(n); }

  // ── CSS injection (self-contained, mst- prefix) ───────────────────────────
  var _stylesInjected = false;
  function _ensureStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;

    var css = [
      /* ── Chip & tooltip ── */
      '.mst-mount { position: relative; display: inline-flex; }',

      '.mst-chip {',
      '  all: unset;',
      '  display: inline-flex; align-items: center;',
      '  gap: 4px; cursor: pointer;',
      '  font-family: ui-monospace, "SF Mono", Menlo, monospace;',
      '  font-size: 11px; font-weight: 600; letter-spacing: .03em;',
      '  color: #c9d1e0;',
      '  background: rgba(255,255,255,.07);',
      '  border: 1px solid rgba(255,255,255,.12);',
      '  border-radius: 999px;',
      '  padding: 3px 10px;',
      '  transition: background .15s;',
      '  white-space: nowrap;',
      '}',
      '.mst-chip:hover { background: rgba(255,255,255,.13); }',
      '.mst-chip:focus-visible {',
      '  outline: 2px solid #5e9cf8; outline-offset: 2px;',
      '}',

      '.mst-tooltip {',
      '  display: none;',
      '  position: absolute; bottom: calc(100% + 6px); left: 50%;',
      '  transform: translateX(-50%);',
      '  background: #1a1e2e; color: #c9d1e0;',
      '  font-size: 11px; font-family: ui-monospace, "SF Mono", Menlo, monospace;',
      '  white-space: nowrap;',
      '  padding: 5px 10px; border-radius: 6px;',
      '  border: 1px solid rgba(255,255,255,.12);',
      '  box-shadow: 0 4px 16px rgba(0,0,0,.45);',
      '  pointer-events: none;',
      '  z-index: 9000;',
      '}',
      '.mst-tooltip--visible { display: block; }',

      /* ── Shared button ── */
      '.mst-btn {',
      '  all: unset; cursor: pointer;',
      '  font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600;',
      '  padding: 10px 22px; border-radius: 8px;',
      '  transition: opacity .15s, background .15s;',
      '  text-align: center;',
      '}',
      '.mst-btn:focus-visible { outline: 2px solid #5e9cf8; outline-offset: 2px; }',
      '.mst-btn--primary {',
      '  background: #3f7cf8; color: #fff;',
      '  border: none;',
      '}',
      '.mst-btn--primary:hover { background: #5e9cf8; }',
      '.mst-btn--ghost {',
      '  background: transparent; color: #8892a8;',
      '  border: 1px solid rgba(255,255,255,.15);',
      '}',
      '.mst-btn--ghost:hover { background: rgba(255,255,255,.07); }',

      /* ── Break suggestion modal ── */
      '.mst-modal-overlay {',
      '  position: fixed; inset: 0;',
      '  background: rgba(5,8,20,.72);',
      '  backdrop-filter: blur(6px);',
      '  display: flex; align-items: center; justify-content: center;',
      '  z-index: 10000;',
      '}',
      '.mst-modal-box {',
      '  background: #111623;',
      '  border: 1px solid rgba(255,255,255,.1);',
      '  border-radius: 16px;',
      '  padding: 36px 40px;',
      '  max-width: 380px; width: 90%;',
      '  text-align: center;',
      '  box-shadow: 0 24px 60px rgba(0,0,0,.7);',
      '}',
      '.mst-modal-icon { font-size: 36px; margin-bottom: 14px; }',
      '.mst-modal-msg {',
      '  font-family: system-ui, sans-serif;',
      '  font-size: 16px; line-height: 1.5; color: #c9d1e0;',
      '  margin: 0 0 24px;',
      '}',
      '.mst-modal-btns {',
      '  display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;',
      '}',

      /* ── Break countdown overlay ── */
      '.mst-break-overlay {',
      '  position: fixed; inset: 0;',
      '  background: linear-gradient(135deg, #0d1321 0%, #1a2540 50%, #0d1321 100%);',
      '  display: flex; align-items: center; justify-content: center;',
      '  z-index: 10001;',
      '}',
      '.mst-break-inner { text-align: center; }',
      '.mst-break-heading {',
      '  font-family: system-ui, sans-serif;',
      '  font-size: 32px; font-weight: 700;',
      '  color: #eef2ff; margin: 0 0 8px;',
      '  letter-spacing: -.01em;',
      '}',
      '.mst-break-sub {',
      '  font-family: system-ui, sans-serif;',
      '  font-size: 15px; color: #7a88aa;',
      '  margin: 0 0 32px;',
      '}',
      '.mst-break-countdown {',
      '  font-family: ui-monospace, "SF Mono", Menlo, monospace;',
      '  font-size: 72px; font-weight: 700;',
      '  color: #3f7cf8; letter-spacing: .04em;',
      '  margin-bottom: 32px;',
      '  text-shadow: 0 0 40px rgba(63,124,248,.4);',
      '}',
      '.mst-break-skip {',
      '  margin-top: 8px;',
      '  font-size: 13px;',
      '}',
    ].join('\n');

    var tag = document.createElement('style');
    tag.id  = 'mst-styles';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  var Timer = {

    start: function (opts) {
      opts = opts || {};
      if (opts.breakThreshold) _breakThreshold = opts.breakThreshold;
      _ssLoad_init();
      _ensureStyles();
      document.addEventListener('visibilitychange', _onVisibilityChange);
      if (!document.hidden) _resume();
      // Global tick for mounted displays
      _tickTimer = setInterval(function () { _tick(); }, TICK_INTERVAL);
      _emit('start', { elapsed: _getElapsed() });
    },

    stop: function () {
      _pause();
      clearInterval(_tickTimer);
      _tickTimer = null;
      document.removeEventListener('visibilitychange', _onVisibilityChange);
      _emit('stop', { elapsed: _accumulated });
    },

    reset: function () {
      this.stop();
      _accumulated   = 0;
      _startedAt     = 0;
      _breakSuggested = false;
      try { sessionStorage.removeItem(SS_KEY); } catch (_) {}
      _mounts.forEach(function (m) { _refreshMount(m, 0); });
      _emit('reset', {});
    },

    getElapsedMs: function () {
      return _getElapsed();
    },

    formatElapsed: function (ms) {
      return _formatElapsed(ms);
    },

    mount: function (container, opts) {
      _ensureStyles();
      if (!container || !container.nodeType) {
        throw new Error('MrMacsSessionTimer.mount: container must be a DOM element');
      }
      return _mountDisplay(container, opts);
    },

    shouldSuggestBreak: function () {
      return _shouldSuggestBreak();
    },

    showBreakSuggestion: function () {
      _showBreakSuggestion();
    },

    dismissBreakSuggestion: function () {
      _dismissBreakSuggestion();
    },

    on: function (event, handler) {
      if (typeof handler !== 'function') return;
      if (!_handlers[event]) _handlers[event] = [];
      _handlers[event].push(handler);
    },

    off: function (event, handler) {
      if (!_handlers[event]) return;
      _handlers[event] = _handlers[event].filter(function (fn) {
        return fn !== handler;
      });
    }
  };

  root.MrMacsSessionTimer = Timer;

}(typeof window !== 'undefined' ? window : this));
