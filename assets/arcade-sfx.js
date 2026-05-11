/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Review Arcade — 8-bit SFX Library
   Procedural Web Audio API sound effects. No files, no network — all
   synthesized on the client at zero KB cost. Inspired by 1989 arcade
   cabinet UX cues: hover blips, click clacks, coin drops, power-on
   chimes, error buzzers, success fanfares.

   Public API: window.MrMacsSFX
     .play(name)              — play a one-shot effect
     .setEnabled(bool)        — mute / unmute (persisted to localStorage)
     .isEnabled()             — current state
     .ensureContext()         — call after user gesture to unlock audio

   Available cues:
     hover, click, coinDrop, gameStart, success, error, navigate, select,
     pause, unpause

   Auto-wires to:
     - any element with [data-sfx="<name>"]
     - any .game-card / .mode-button / .smart-card / button.primary
     - any .insert-coin / .attract-text click → coinDrop
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  if (root.MrMacsSFX) return;

  var STORAGE_KEY = "arcade.sfxEnabled";
  var ctx = null;
  var masterGain = null;
  var enabled = (function () {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === null ? true : v === "1";
    } catch (e) { return true; }
  })();

  // ─── Reduce volume under prefers-reduced-motion (users on that
  //     setting often want quieter audio too) ───────────────────────────
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  function ensureContext() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = reducedMotion ? 0.18 : 0.28;
      masterGain.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  // ─── Core oscillator helper ──────────────────────────────────────────
  // Plays a tone with frequency envelope + amplitude envelope.
  function tone(opts) {
    if (!enabled) return;
    var c = ensureContext();
    if (!c) return;
    if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
    opts = opts || {};
    var freq = opts.freq || 440;
    var endFreq = opts.endFreq;
    var dur = opts.dur || 0.08;
    var type = opts.type || "square";
    var vol = opts.vol == null ? 0.22 : opts.vol;
    var attack = opts.attack || 0.003;
    var decay = opts.decay == null ? dur : opts.decay;

    var now = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
    }
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(gain).connect(masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  // Short noise burst (used for coin clack, error)
  function noise(opts) {
    if (!enabled) return;
    var c = ensureContext();
    if (!c) return;
    if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
    opts = opts || {};
    var dur = opts.dur || 0.10;
    var vol = opts.vol == null ? 0.20 : opts.vol;
    var hp = opts.hp || 600;

    var now = c.currentTime;
    var bufferSize = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, bufferSize, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
    var src = c.createBufferSource();
    src.buffer = buf;
    var filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    var gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter).connect(gain).connect(masterGain);
    src.start(now);
  }

  // ─── Cue library — recognizable arcade sounds ───────────────────────
  var cues = {
    // Soft blip when hovering an interactive card. Quick, low-volume.
    hover: function () {
      tone({ freq: 740, endFreq: 880, dur: 0.045, type: "square", vol: 0.08 });
    },
    // Sharper blip on click — classic UI confirm.
    click: function () {
      tone({ freq: 980, endFreq: 660, dur: 0.06, type: "square", vol: 0.18 });
    },
    // Two-note ascending coin sound — the iconic Mario coin (but pitched
    // slightly down so it's unique).
    coinDrop: function () {
      tone({ freq: 988, dur: 0.07,  type: "square", vol: 0.20 });
      setTimeout(function () {
        tone({ freq: 1318, dur: 0.18, type: "square", vol: 0.18 });
      }, 70);
    },
    // Game-start ascending arpeggio C-E-G-C
    gameStart: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        setTimeout(function () {
          tone({ freq: f, dur: 0.10, type: "square", vol: 0.18 });
        }, i * 80);
      });
    },
    // Success — bright two-note major-third up
    success: function () {
      tone({ freq: 880, dur: 0.10, type: "square", vol: 0.20 });
      setTimeout(function () {
        tone({ freq: 1175, dur: 0.16, type: "square", vol: 0.20 });
      }, 80);
    },
    // Error — descending buzz
    error: function () {
      tone({ freq: 280, endFreq: 110, dur: 0.20, type: "sawtooth", vol: 0.16 });
    },
    // Navigation tick — quiet click for arrow-key cycling
    navigate: function () {
      tone({ freq: 660, dur: 0.03, type: "square", vol: 0.10 });
    },
    // Select — chunkier blip for confirming a selection
    select: function () {
      tone({ freq: 1320, dur: 0.05, type: "square", vol: 0.16 });
      setTimeout(function () {
        tone({ freq: 1760, dur: 0.08, type: "square", vol: 0.14 });
      }, 40);
    },
    // Pause — descending two-note
    pause: function () {
      tone({ freq: 660, dur: 0.10, type: "triangle", vol: 0.16 });
      setTimeout(function () { tone({ freq: 440, dur: 0.14, type: "triangle", vol: 0.14 }); }, 90);
    },
    // Unpause — ascending two-note (mirror of pause)
    unpause: function () {
      tone({ freq: 440, dur: 0.10, type: "triangle", vol: 0.16 });
      setTimeout(function () { tone({ freq: 660, dur: 0.14, type: "triangle", vol: 0.14 }); }, 90);
    }
  };

  // ─── Public play() ──────────────────────────────────────────────────
  function play(name) {
    if (!enabled) return;
    var fn = cues[name];
    if (typeof fn === "function") fn();
  }

  // ─── Mute / unmute ──────────────────────────────────────────────────
  function setEnabled(v) {
    enabled = !!v;
    try { localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0"); } catch (e) {}
  }
  function isEnabled() { return enabled; }

  // ─── Auto-wire DOM interactions ─────────────────────────────────────
  // Throttle hover blips so dragging across many cards doesn't blast.
  var lastHover = 0;
  function onHover(e) {
    var now = Date.now();
    if (now - lastHover < 60) return;
    lastHover = now;
    if (e.target.closest("[data-sfx-skip]")) return;
    play("hover");
  }
  function onClick(e) {
    var t = e.target;
    if (!t || t.closest("[data-sfx-skip]")) return;
    // INSERT COIN / Enter Arcade / Insert Coin · Start X → coin sound
    if (t.closest(".attract-text, .insert-coin, [data-sfx=\"coin\"]") ||
        /insert coin|enter arcade/i.test((t.closest("button, a")?.textContent || "").trim())) {
      play("coinDrop"); return;
    }
    if (t.closest(".game-card, .mode-button, .smart-card, .quick-card, .focus-card, .continue-card")) {
      play("gameStart"); return;
    }
    // Pause buttons
    if (/^pause$/i.test((t.textContent || "").trim()) || t.id === "pauseBtn") {
      play("pause"); return;
    }
    if (/^resume$/i.test((t.textContent || "").trim()) || t.id === "resumeBtn") {
      play("unpause"); return;
    }
    // Primary buttons
    if (t.closest("button.primary, .btn.primary, .action.primary")) {
      play("click"); return;
    }
    // Generic buttons / nav links
    if (t.closest("button, a.nav-link, .topnav a")) {
      play("navigate"); return;
    }
  }

  function wire() {
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(".game-card, .mode-button, .smart-card, .quick-card, .focus-card, .continue-card, .topnav a, .btn.primary")) {
        onHover(e);
      }
    }, true);
    document.addEventListener("click", onClick, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  root.MrMacsSFX = {
    play: play,
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    ensureContext: ensureContext
  };
})(typeof window !== "undefined" ? window : globalThis);
