/* Mr. Mac's Arcade — Shared Music Engine
 *
 * Composes per-game loops via Web Audio. NO sub-bass drones, NO continuous
 * undulating tones (the previous Pokemon attempt produced an "ominous hum"
 * that the user rejected). Every theme has:
 *   - chord progression (4 chords, 2 bars each = 8 bars/loop default)
 *   - bass on chord roots (short staccato, NOT a held drone)
 *   - drum kit (kick + snare + hi-hat, synthesized via noise envelopes)
 *   - melodic motif (triangle/sine waves with proper ADSR)
 *
 * API
 *   MrMacsArcadeMusic.start(themeId, opts)        // begin loop
 *   MrMacsArcadeMusic.stop()                       // fade + stop
 *   MrMacsArcadeMusic.duck(level, ms)              // attenuate during battles
 *   MrMacsArcadeMusic.restore(ms)                  // unduck
 *   MrMacsArcadeMusic.isPlaying()                  // bool
 *   MrMacsArcadeMusic.setMasterVolume(0..1)        // override
 *   MrMacsArcadeMusic.list()                       // theme ids
 *
 * Audio policy: requires user gesture to unlock the AudioContext. Each game
 * must call start() in response to a click / keypress (the engine attempts
 * .resume() automatically). If the context is suspended, start() is queued
 * for the next user gesture.
 *
 * Settings: reads MrMacsProfile.getSettings().musicVolume + .sound at boot
 * and listens for "settings:change" events to live-update.
 */
(function () {
  "use strict";

  // ============== Theme registry ==============

  // Each theme is keyed by a string id. Notes are MIDI; bpm sets tempo.
  // progression is an array of chord-root offsets (semitones) from the key.
  // motif is an array of {step, note, dur} where step is in 16th-notes and
  // note is in semitones above the chord root, dur is in beats.
  // drums is per-16th-note: 1 = hit on that step, 0 = rest.

  var THEMES = {
    /* === Pinball: brass + chrome major-key cabinet anthem === */
    "pinball-cabinet": {
      bpm: 122, key: 60, // C4 root
      progression: [0, -3, 5, 7], // C - Am - F - G  (4 bars each = 16 bars/loop)
      barsPerChord: 1,
      lead: [
        { step: 0,  note: 7, dur: 0.5 }, { step: 2, note: 9, dur: 0.5 },
        { step: 4,  note: 12, dur: 0.5 }, { step: 6, note: 9, dur: 0.5 },
        { step: 8,  note: 11, dur: 0.5 }, { step: 10, note: 7, dur: 0.5 },
        { step: 12, note: 9,  dur: 1.0 }
      ],
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      mood: { lead: "triangle", bass: "sawtooth", filter: 1700 }
    },
    /* === Cold War Invaders: tense espionage march === */
    "cold-war-mission": {
      bpm: 108, key: 57, // A3
      progression: [0, 3, 5, 7], // Am - C - D - E (suspenseful)
      barsPerChord: 1,
      lead: [
        { step: 0,  note: 0,  dur: 0.5 }, { step: 4, note: 3, dur: 0.5 },
        { step: 8,  note: 5,  dur: 0.5 }, { step: 12, note: 7, dur: 1.0 }
      ],
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
      mood: { lead: "triangle", bass: "square", filter: 1400 }
    },
    /* === Tower Defense: tension that builds by wave === */
    "td-strategic": {
      bpm: 96, key: 62, // D4
      progression: [0, 5, -2, 3], // D - G - C - F (pleasant rotation)
      barsPerChord: 1,
      lead: [
        { step: 0, note: 7, dur: 1.0 }, { step: 4, note: 12, dur: 0.5 },
        { step: 6, note: 9, dur: 0.5 }, { step: 8, note: 7, dur: 1.0 },
        { step: 12, note: 4, dur: 1.0 }
      ],
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
      mood: { lead: "sine", bass: "triangle", filter: 1800 }
    },
    /* === Empire Ascendant: orchestral civ-like 4X theme === */
    "empire-strategic": {
      bpm: 88, key: 55, // G3
      progression: [0, 5, -2, 7], // G - C - F - D
      barsPerChord: 2, // slow, contemplative
      lead: [
        { step: 0, note: 7, dur: 2.0 }, { step: 8, note: 12, dur: 1.0 },
        { step: 12, note: 11, dur: 1.0 }
      ],
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      mood: { lead: "triangle", bass: "sine", filter: 1500 }
    },
    /* === Endless Runner: synthwave urgency === */
    "runner-synthwave": {
      bpm: 138, key: 64, // E4
      progression: [0, -5, -3, 2], // E - B - C#m - F#m (modal)
      barsPerChord: 1,
      lead: [
        { step: 0,  note: 7,  dur: 0.5 }, { step: 2, note: 5,  dur: 0.5 },
        { step: 4,  note: 7,  dur: 0.5 }, { step: 6, note: 9,  dur: 0.5 },
        { step: 8,  note: 12, dur: 0.5 }, { step: 10, note: 9, dur: 0.5 },
        { step: 12, note: 7,  dur: 1.0 }
      ],
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
      mood: { lead: "triangle", bass: "sawtooth", filter: 2200 }
    },
    /* === Time Rift Survivors: intensifying horde drone-but-with-melody === */
    "rift-survivors": {
      bpm: 132, key: 60, // C4
      progression: [0, -3, -7, 7], // C - Am - F - G (driving)
      barsPerChord: 1,
      lead: [
        { step: 0,  note: 7,  dur: 0.5 }, { step: 4,  note: 9,  dur: 0.5 },
        { step: 8,  note: 12, dur: 0.5 }, { step: 12, note: 9,  dur: 0.5 },
        { step: 14, note: 7,  dur: 0.5 }
      ],
      kick:  [1,0,1,0, 0,0,0,0, 1,0,1,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
      mood: { lead: "square", bass: "sawtooth", filter: 1900 }
    },
    /* === Arcade Duel: red-round shounen anthem === */
    "duel-arena": {
      bpm: 130, key: 62, // D4
      progression: [0, -2, 5, 7], // D - C - G - A (heroic)
      barsPerChord: 1,
      lead: [
        { step: 0, note: 0, dur: 1.0 }, { step: 4, note: 7, dur: 0.5 },
        { step: 6, note: 5, dur: 0.5 }, { step: 8, note: 4, dur: 1.0 },
        { step: 12, note: 7, dur: 1.0 }
      ],
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      mood: { lead: "triangle", bass: "sawtooth", filter: 2000 }
    },
    /* === Boss Rush: cinematic 6/8 boss theme === */
    "boss-rush-arena": {
      bpm: 100, key: 57, // A3
      progression: [0, 3, 5, -2], // Am - C - D - F (cinematic)
      barsPerChord: 2,
      lead: [
        { step: 0, note: 7, dur: 1.0 }, { step: 4, note: 12, dur: 1.0 },
        { step: 8, note: 10, dur: 1.0 }, { step: 12, note: 7, dur: 1.0 }
      ],
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1],
      mood: { lead: "triangle", bass: "sine", filter: 1500 }
    },
    /* === Pacman: bright chip-tune route theme === */
    "maze-cabinet": {
      bpm: 144, key: 65, // F4 — bright + arcade-y
      progression: [0, -5, -7, 5], // F - C - Bb - Eb (bright)
      barsPerChord: 1,
      lead: [
        { step: 0,  note: 0, dur: 0.25 }, { step: 1, note: 4, dur: 0.25 },
        { step: 2,  note: 7, dur: 0.25 }, { step: 3, note: 12, dur: 0.25 },
        { step: 4,  note: 9, dur: 0.5 },  { step: 6, note: 7, dur: 0.5 },
        { step: 8,  note: 4, dur: 0.5 },  { step: 10, note: 0, dur: 0.5 },
        { step: 12, note: 7, dur: 1.0 }
      ],
      kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
      mood: { lead: "square", bass: "square", filter: 2400 }
    }
  };

  // ============== Engine ==============

  var ctx = null;
  var masterGain = null;
  var duckGain = null;
  var current = null;       // active theme state
  var schedulerTimer = null;
  var SCHEDULE_AHEAD_S = 0.12;
  var TICK_MS = 25;
  var listeners = [];
  var globalUserVolume = 0.55;
  var muted = false;

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    duckGain = ctx.createGain();
    duckGain.gain.value = 1.0;
    masterGain.gain.value = globalUserVolume;
    masterGain.connect(duckGain);
    duckGain.connect(ctx.destination);
    return ctx;
  }
  function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function playTone(freq, when, dur, type, peakVol, filterHz) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = type || "triangle";
    osc.frequency.value = freq;
    var env = ctx.createGain();
    var attack = 0.012;
    var release = Math.max(0.06, dur * 0.15);
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(peakVol, when + attack);
    env.gain.setValueAtTime(peakVol, when + Math.max(attack, dur - release));
    env.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.01);
    if (filterHz) {
      var filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = filterHz;
      filter.Q.value = 0.7;
      osc.connect(filter); filter.connect(env);
    } else {
      osc.connect(env);
    }
    env.connect(masterGain);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  function playKick(when, peak) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, when);
    osc.frequency.exponentialRampToValueAtTime(40, when + 0.18);
    var env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(peak * 1.6, when + 0.005);
    env.gain.exponentialRampToValueAtTime(0.001, when + 0.20);
    osc.connect(env); env.connect(masterGain);
    osc.start(when); osc.stop(when + 0.22);
  }
  function playSnare(when, peak) {
    if (!ctx) return;
    var bufferSize = Math.floor(ctx.sampleRate * 0.18);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 0.6;
    var env = ctx.createGain();
    env.gain.setValueAtTime(peak, when);
    env.gain.exponentialRampToValueAtTime(0.001, when + 0.15);
    src.connect(bp); bp.connect(env); env.connect(masterGain);
    src.start(when); src.stop(when + 0.18);
  }
  function playHat(when, peak) {
    if (!ctx) return;
    var bufferSize = Math.floor(ctx.sampleRate * 0.05);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 6500;
    var env = ctx.createGain();
    env.gain.setValueAtTime(peak * 0.7, when);
    env.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
    src.connect(hp); hp.connect(env); env.connect(masterGain);
    src.start(when); src.stop(when + 0.05);
  }

  function startScheduler() {
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = setInterval(scheduleTick, TICK_MS);
  }
  function stopScheduler() {
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  function scheduleTick() {
    if (!current || !ctx) return;
    var horizon = ctx.currentTime + SCHEDULE_AHEAD_S;
    while (current.nextStepTime < horizon) {
      scheduleStep(current.stepIndex, current.nextStepTime);
      current.nextStepTime += current.stepDur;
      current.stepIndex = (current.stepIndex + 1) % current.totalSteps;
    }
  }
  function scheduleStep(stepIndex, when) {
    var t = current.theme;
    var stepInBar = stepIndex % 16;        // 0..15 within current bar of 16 steps
    var bar = Math.floor(stepIndex / 16);  // current bar number
    var chordIdx = Math.floor(bar / t.barsPerChord) % t.progression.length;
    var chordRoot = t.key + t.progression[chordIdx];
    // Bass — staccato on every quarter (steps 0, 4, 8, 12)
    if (stepInBar % 4 === 0) {
      playTone(midiToHz(chordRoot - 12), when, 0.18, t.mood.bass, 0.07, t.mood.filter);
    }
    // Drums
    if (t.kick[stepInBar]) playKick(when, 0.30);
    if (t.snare[stepInBar]) playSnare(when, 0.18);
    if (t.hat[stepInBar]) playHat(when, 0.07);
    // Chord pad — held for 1 bar, triggered on bar start
    if (stepInBar === 0) {
      var thirds = (t.progression[chordIdx] >= 0 ? 4 : 3); // major/minor heuristic
      var fifth = 7;
      var barLen = 16 * current.stepDur;
      playTone(midiToHz(chordRoot + thirds), when, barLen * 0.95, "triangle", 0.018, t.mood.filter);
      playTone(midiToHz(chordRoot + fifth), when, barLen * 0.95, "triangle", 0.014, t.mood.filter);
    }
    // Lead motif — only on the first bar of each chord (so it lines up cleanly)
    var motifStartStep = (chordIdx * t.barsPerChord) * 16;
    var stepRelativeToChord = stepIndex - motifStartStep;
    if (bar % t.barsPerChord === 0) {
      t.lead.forEach(function (note) {
        if (note.step === stepInBar) {
          playTone(midiToHz(chordRoot + note.note),
                   when, note.dur * (60 / t.bpm),
                   t.mood.lead, 0.045, null);
        }
      });
    }
  }

  function start(themeId, opts) {
    var theme = THEMES[themeId];
    if (!theme) { console.warn("[arcade-music] unknown theme", themeId); return false; }
    if (muted) return false;
    if (!ensureCtx()) return false;
    if (ctx.state === "suspended") {
      ctx.resume().then(function () { actuallyStart(theme, themeId, opts); }).catch(function () {});
    } else {
      actuallyStart(theme, themeId, opts);
    }
    return true;
  }
  function actuallyStart(theme, themeId, opts) {
    if (current) stop();
    var stepDur = (60 / theme.bpm) / 4; // 16th-note in seconds
    current = {
      themeId: themeId,
      theme: theme,
      stepDur: stepDur,
      stepIndex: 0,
      nextStepTime: ctx.currentTime + 0.10,
      totalSteps: theme.progression.length * theme.barsPerChord * 16
    };
    // Smooth fade-in
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(globalUserVolume, ctx.currentTime + 1.4);
    }
    startScheduler();
    listeners.forEach(function (fn) { try { fn("start", themeId); } catch(e){} });
  }
  function stop(opts) {
    if (!current) return;
    var fadeMs = (opts && opts.fadeMs) ? opts.fadeMs : 600;
    if (masterGain && ctx) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeMs / 1000);
    }
    setTimeout(function () {
      stopScheduler();
      var was = current ? current.themeId : null;
      current = null;
      listeners.forEach(function (fn) { try { fn("stop", was); } catch(e){} });
    }, fadeMs + 30);
  }
  function duck(level, ms) {
    if (!duckGain || !ctx) return;
    duckGain.gain.cancelScheduledValues(ctx.currentTime);
    duckGain.gain.setValueAtTime(duckGain.gain.value, ctx.currentTime);
    duckGain.gain.linearRampToValueAtTime(typeof level === "number" ? level : 0.4, ctx.currentTime + (ms || 250) / 1000);
  }
  function restore(ms) {
    if (!duckGain || !ctx) return;
    duckGain.gain.cancelScheduledValues(ctx.currentTime);
    duckGain.gain.setValueAtTime(duckGain.gain.value, ctx.currentTime);
    duckGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + (ms || 400) / 1000);
  }
  function setMasterVolume(v) {
    globalUserVolume = Math.max(0, Math.min(1, Number(v) || 0));
    if (masterGain && ctx && current) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(globalUserVolume, ctx.currentTime + 0.2);
    }
  }
  function setMuted(m) {
    muted = !!m;
    if (muted && current) stop({ fadeMs: 300 });
  }
  function isPlaying() { return !!current; }
  function list() { return Object.keys(THEMES); }
  function on(handler) { listeners.push(handler); }

  // Sync with profile settings on init + on change
  function syncSettings() {
    if (!window.MrMacsProfile) return;
    var s = window.MrMacsProfile.getSettings();
    setMasterVolume(s.musicVolume == null ? 0.55 : s.musicVolume);
    setMuted(s.sound === "off");
  }
  if (typeof window !== "undefined") {
    var bindWhenReady = function () {
      if (!window.MrMacsProfile) {
        setTimeout(bindWhenReady, 50);
        return;
      }
      syncSettings();
      window.MrMacsProfile.on("settings:change", syncSettings);
    };
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(bindWhenReady, 0);
    } else {
      document.addEventListener("DOMContentLoaded", function () { setTimeout(bindWhenReady, 0); });
    }

    // Auto-pause on tab hidden, auto-resume on visible (less battery use)
    document.addEventListener("visibilitychange", function () {
      if (!current) return;
      if (document.hidden) duck(0.0, 200);
      else restore(400);
    });
  }

  if (typeof window !== "undefined") {
    window.MrMacsArcadeMusic = {
      start: start,
      stop: stop,
      duck: duck,
      restore: restore,
      isPlaying: isPlaying,
      setMasterVolume: setMasterVolume,
      setMuted: setMuted,
      list: list,
      on: on,
      THEMES: THEMES
    };
  }
})();
