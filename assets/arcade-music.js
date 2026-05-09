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
 * Public API
 *   MrMacsArcadeMusic.start(themeId, opts)        // begin loop
 *   MrMacsArcadeMusic.stop()                       // fade + stop
 *   MrMacsArcadeMusic.duck(level, ms)              // attenuate during battles
 *   MrMacsArcadeMusic.restore(ms)                  // unduck
 *   MrMacsArcadeMusic.isPlaying()                  // bool
 *   MrMacsArcadeMusic.currentTheme()               // string | null
 *   MrMacsArcadeMusic.setVolume(0..1)              // user volume + persists
 *   MrMacsArcadeMusic.setMaster(0..1)              // alias for setVolume (persists across themes)
 *   MrMacsArcadeMusic.setMasterVolume(0..1)        // legacy alias
 *   MrMacsArcadeMusic.setMuted(bool)               // hard mute
 *   MrMacsArcadeMusic.themeNames()                 // string[] (alias: list())
 *   MrMacsArcadeMusic.list()                       // legacy alias for themeNames()
 *   MrMacsArcadeMusic.crossfade(toThemeId, ms)     // smooth cross-fade between themes
 *   MrMacsArcadeMusic.tempoMod(rate)               // 1.0 default; e.g. 1.5 = 50% faster
 *   MrMacsArcadeMusic.on(handler)                  // ("start"|"stop"|"crossfade", themeId)
 *
 * Audio policy: requires user gesture to unlock the AudioContext. Each game
 * must call start() in response to a click / keypress (the engine attempts
 * .resume() automatically). If the context is suspended, start() is queued
 * for the next user gesture.
 *
 * Persistence: user volume is stored under localStorage key
 *   "mr-macs-arcade-music-volume" (0..1). It is read on first start() and
 *   re-applied whenever setVolume / setMaster is called.
 *
 * Performance:
 *   - When document.hidden, the audio context is suspended (battery save) and
 *     resumed automatically on visibility return.
 *   - A simultaneous-oscillator cap protects against runaway theme layering.
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
  // Optional: "pad" (true) layers a held pad chord on bar 1 of each chord.
  // Optional: "bell" (true) adds gentle bell hits on bar starts.
  // Optional: "swing" (0..0.3) shifts off-beat steps for groove.
  // Optional: "leadGain" (default 0.045) scales lead volume per-theme.
  // Optional: "padGain" (default 0.018) scales pad volume per-theme.
  // Optional: "bassGain" (default 0.07) scales bass volume per-theme.

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
    },
    /* === Archive Dusk: ambient library-after-hours === */
    /* Slow tempo, sparse drums, gentle bell motif over a low pad. */
    "archive-dusk": {
      bpm: 64, key: 53, // F3 — low pad register
      progression: [0, -5, 3, -2], // F - C - Ab - Eb (warm/melancholic)
      barsPerChord: 2,
      lead: [
        { step: 0,  note: 12, dur: 2.0 },
        { step: 8,  note: 14, dur: 2.0 },
        { step: 16, note: 17, dur: 1.5 },
        { step: 24, note: 14, dur: 1.5 }
      ],
      kick:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      hat:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      bell:  true,
      pad:   true,
      mood: { lead: "sine", bass: "sine", filter: 900 },
      leadGain: 0.030,
      padGain:  0.024,
      bassGain: 0.045
    },
    /* === Quill Runner: brighter, faster synthwave variant === */
    /* Distinct from runner-synthwave: higher key, syncopated kick + offbeat
       hat pattern, chromatic motif, square-lead character. */
    "quill-runner": {
      bpm: 152, key: 67, // G4 — bright register
      progression: [0, -2, -4, 5], // G - F - Eb - C (driving descent + cadence)
      barsPerChord: 1,
      lead: [
        { step: 0,  note: 0,  dur: 0.25 }, { step: 1,  note: 5, dur: 0.25 },
        { step: 2,  note: 7,  dur: 0.5 },  { step: 4,  note: 10, dur: 0.5 },
        { step: 6,  note: 7,  dur: 0.5 },  { step: 8,  note: 12, dur: 0.5 },
        { step: 10, note: 14, dur: 0.5 },  { step: 12, note: 12, dur: 0.5 },
        { step: 14, note: 7,  dur: 0.5 }
      ],
      kick:  [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,0,1,0],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
      hat:   [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,1,1],
      mood: { lead: "square", bass: "sawtooth", filter: 2600 },
      leadGain: 0.040
    },
    /* === Boss Overture: layered cinematic boss-fight === */
    /* Distinct from boss-rush-arena: minor-key heavy progression, pad layer,
       bell ornament, dramatic 4-bar resolution. */
    "boss-overture": {
      bpm: 92, key: 50, // D3 — deeper than boss-rush-arena (A3)
      progression: [0, -2, 5, -5], // Dm - C - G - A (heroic minor)
      barsPerChord: 2,
      lead: [
        { step: 0,  note: 0,  dur: 1.0 },  { step: 4,  note: 7,  dur: 1.0 },
        { step: 8,  note: 12, dur: 1.5 },  { step: 16, note: 10, dur: 1.0 },
        { step: 20, note: 7,  dur: 1.0 },  { step: 24, note: 12, dur: 2.0 }
      ],
      kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1],
      snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
      hat:   [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,1],
      bell:  true,
      pad:   true,
      mood: { lead: "triangle", bass: "sawtooth", filter: 1300 },
      leadGain: 0.050,
      padGain:  0.025
    }
  };

  // ============== Engine ==============

  var ctx = null;
  var masterGain = null;       // user volume bus
  var duckGain = null;         // duck/restore bus (independent of user volume)
  var current = null;          // active theme state
  var schedulerTimer = null;
  var SCHEDULE_AHEAD_S = 0.12;
  var TICK_MS = 25;
  var listeners = [];
  var globalUserVolume = 0.55;
  var muted = false;
  var tempoMultiplier = 1.0;
  var liveOscCount = 0;        // simultaneous oscillator cap counter
  var MAX_OSCS = 24;           // cap to protect mobile / low-power devices

  // Persistence ---------------------------------------------------------
  var STORAGE_KEY = "mr-macs-arcade-music-volume";
  function loadStoredVolume() {
    try {
      if (typeof localStorage === "undefined") return null;
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw == null) return null;
      var v = parseFloat(raw);
      if (!isFinite(v)) return null;
      return Math.max(0, Math.min(1, v));
    } catch (e) { return null; }
  }
  function persistVolume(v) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch (e) { /* private mode / quota — fail silent */ }
  }

  // Apply stored volume early so it's the boot default if nothing else sets it
  (function bootVolume() {
    var stored = loadStoredVolume();
    if (stored != null) globalUserVolume = stored;
  })();

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

  // Track oscillator lifetime so we can enforce a simultaneous cap.
  function trackOsc(osc, when, dur) {
    liveOscCount++;
    var stopAt = when + dur + 0.06;
    var ms = Math.max(50, (stopAt - ctx.currentTime) * 1000 + 30);
    setTimeout(function () { liveOscCount = Math.max(0, liveOscCount - 1); }, ms);
  }

  function playTone(freq, when, dur, type, peakVol, filterHz) {
    if (!ctx) return;
    if (liveOscCount >= MAX_OSCS) return; // soft cap
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
    trackOsc(osc, when, dur);
  }

  // Bell timbre — short FM-flavored sine ping with long-ish decay.
  // Used by archive-dusk + boss-overture for chime ornaments.
  function playBell(freq, when, peakVol) {
    if (!ctx) return;
    if (liveOscCount >= MAX_OSCS) return;
    var dur = 1.2;
    var carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = freq;
    var harmonic = ctx.createOscillator();
    harmonic.type = "sine";
    harmonic.frequency.value = freq * 2.76; // bell-like inharmonic ratio
    var hGain = ctx.createGain();
    hGain.gain.setValueAtTime(peakVol * 0.35, when);
    hGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.6);
    var env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(peakVol, when + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    carrier.connect(env);
    harmonic.connect(hGain); hGain.connect(env);
    env.connect(masterGain);
    carrier.start(when); carrier.stop(when + dur + 0.05);
    harmonic.start(when); harmonic.stop(when + dur + 0.05);
    trackOsc(carrier, when, dur);
    trackOsc(harmonic, when, dur);
  }

  function playKick(when, peak) {
    if (!ctx) return;
    if (liveOscCount >= MAX_OSCS) return;
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
    trackOsc(osc, when, 0.22);
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
      current.nextStepTime += currentStepDur();
      current.stepIndex = (current.stepIndex + 1) % current.totalSteps;
    }
  }
  // Effective per-step duration honors live tempo modulation
  function currentStepDur() {
    if (!current) return 0;
    var rate = tempoMultiplier > 0 ? tempoMultiplier : 1.0;
    return current.stepDur / rate;
  }
  function scheduleStep(stepIndex, when) {
    var t = current.theme;
    var stepInBar = stepIndex % 16;        // 0..15 within current bar of 16 steps
    var bar = Math.floor(stepIndex / 16);  // current bar number
    var chordIdx = Math.floor(bar / t.barsPerChord) % t.progression.length;
    var chordRoot = t.key + t.progression[chordIdx];
    var bassGain = (typeof t.bassGain === "number") ? t.bassGain : 0.07;
    var leadGain = (typeof t.leadGain === "number") ? t.leadGain : 0.045;
    var padGain  = (typeof t.padGain  === "number") ? t.padGain  : 0.018;
    // Bass — staccato on every quarter (steps 0, 4, 8, 12)
    if (stepInBar % 4 === 0) {
      playTone(midiToHz(chordRoot - 12), when, 0.18, t.mood.bass, bassGain, t.mood.filter);
    }
    // Drums
    if (t.kick[stepInBar])  playKick(when, 0.30);
    if (t.snare[stepInBar]) playSnare(when, 0.18);
    if (t.hat[stepInBar])   playHat(when, 0.07);
    // Chord pad — held for 1 bar, triggered on bar start
    if (stepInBar === 0) {
      var thirds = (t.progression[chordIdx] >= 0 ? 4 : 3); // major/minor heuristic
      var fifth = 7;
      var barLen = 16 * currentStepDur();
      playTone(midiToHz(chordRoot + thirds), when, barLen * 0.95, "triangle", padGain, t.mood.filter);
      playTone(midiToHz(chordRoot + fifth),  when, barLen * 0.95, "triangle", padGain * 0.78, t.mood.filter);
      // Optional sustained pad layer for ambient themes
      if (t.pad) {
        playTone(midiToHz(chordRoot + 12), when, barLen * 0.95, "sine", padGain * 1.3, t.mood.filter);
      }
      // Optional bell on bar starts (every other bar, for sparseness)
      if (t.bell && bar % 2 === 0) {
        playBell(midiToHz(chordRoot + 19), when + 0.04, leadGain * 0.6);
      }
    }
    // Lead motif — only on the first bar of each chord (so it lines up cleanly)
    if (bar % t.barsPerChord === 0) {
      t.lead.forEach(function (note) {
        if (note.step === stepInBar) {
          playTone(midiToHz(chordRoot + note.note),
                   when, note.dur * (60 / t.bpm) / (tempoMultiplier > 0 ? tempoMultiplier : 1),
                   t.mood.lead, leadGain, null);
        }
      });
    }
  }

  function start(themeId, opts) {
    var theme = THEMES[themeId];
    if (!theme) { console.warn("[arcade-music] unknown theme", themeId); return false; }
    if (muted) return false;
    if (!ensureCtx()) return false;
    // Apply any newly-loaded localStorage volume (e.g. set before ctx existed)
    var stored = loadStoredVolume();
    if (stored != null) globalUserVolume = stored;
    if (ctx.state === "suspended") {
      ctx.resume().then(function () { actuallyStart(theme, themeId, opts); }).catch(function () {});
    } else {
      actuallyStart(theme, themeId, opts);
    }
    return true;
  }
  function actuallyStart(theme, themeId, opts) {
    if (current) immediateStop();
    var stepDur = (60 / theme.bpm) / 4; // 16th-note in seconds (base, before tempoMod)
    current = {
      themeId: themeId,
      theme: theme,
      stepDur: stepDur,
      stepIndex: 0,
      nextStepTime: ctx.currentTime + 0.10,
      totalSteps: theme.progression.length * theme.barsPerChord * 16
    };
    // Smooth fade-in from 0 to user volume
    if (masterGain) {
      var fadeMs = (opts && typeof opts.fadeInMs === "number") ? opts.fadeInMs : 1400;
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(globalUserVolume, ctx.currentTime + fadeMs / 1000);
    }
    startScheduler();
    listeners.forEach(function (fn) { try { fn("start", themeId); } catch(e){} });
  }
  // Internal: kill current scheduler/state without ramp (used by crossfade /
  // restart paths where the caller has already orchestrated a fade).
  function immediateStop() {
    stopScheduler();
    current = null;
  }
  function stop(opts) {
    if (!current) return;
    var fadeMs = (opts && typeof opts.fadeMs === "number") ? opts.fadeMs : 600;
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

  // Smooth crossfade: fade current theme out while new theme fades in.
  // If nothing is currently playing, behaves like a faded start().
  function crossfade(toThemeId, durationMs) {
    var dur = (typeof durationMs === "number" && durationMs >= 0) ? durationMs : 800;
    if (!THEMES[toThemeId]) {
      console.warn("[arcade-music] crossfade: unknown theme", toThemeId);
      return false;
    }
    if (muted) return false;
    if (!ensureCtx()) return false;
    if (ctx.state === "suspended") {
      ctx.resume().catch(function(){});
    }
    var fromId = current ? current.themeId : null;
    if (!current) {
      // Nothing playing — start with custom fade-in length
      start(toThemeId, { fadeInMs: dur });
      listeners.forEach(function (fn) { try { fn("crossfade", toThemeId); } catch(e){} });
      return true;
    }
    // Fade master down to 0 over half the duration, then start new theme with
    // the remaining half as its fade-in. This avoids running two schedulers
    // (which would risk doubling oscillator load on weak devices).
    var halfMs = Math.max(80, Math.floor(dur / 2));
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + halfMs / 1000);
    }
    setTimeout(function () {
      immediateStop();
      var theme = THEMES[toThemeId];
      actuallyStart(theme, toThemeId, { fadeInMs: dur - halfMs });
      listeners.forEach(function (fn) { try { fn("crossfade", toThemeId, fromId); } catch(e){} });
    }, halfMs + 10);
    return true;
  }

  // Smooth duck — ramps duckGain (independent of user volume) to target.
  function duck(level, ms) {
    if (!duckGain || !ctx) return;
    var target = (typeof level === "number") ? Math.max(0, Math.min(1, level)) : 0.2;
    var dur = (typeof ms === "number" && ms >= 0) ? ms : 240;
    duckGain.gain.cancelScheduledValues(ctx.currentTime);
    duckGain.gain.setValueAtTime(duckGain.gain.value, ctx.currentTime);
    duckGain.gain.linearRampToValueAtTime(target, ctx.currentTime + dur / 1000);
  }
  function restore(ms) {
    if (!duckGain || !ctx) return;
    var dur = (typeof ms === "number" && ms >= 0) ? ms : 320;
    duckGain.gain.cancelScheduledValues(ctx.currentTime);
    duckGain.gain.setValueAtTime(duckGain.gain.value, ctx.currentTime);
    duckGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + dur / 1000);
  }

  // setVolume: user-facing volume. Persists across themes + reloads.
  function setVolume(v) {
    var clamped = Math.max(0, Math.min(1, Number(v) || 0));
    globalUserVolume = clamped;
    persistVolume(clamped);
    if (masterGain && ctx && current) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(globalUserVolume, ctx.currentTime + 0.2);
    }
  }
  // setMaster: alias requested in API additions — same persistence semantics.
  function setMaster(v) { setVolume(v); }
  // Legacy alias preserved for back-compat with existing call sites.
  function setMasterVolume(v) { setVolume(v); }

  function setMuted(m) {
    muted = !!m;
    if (muted && current) stop({ fadeMs: 300 });
  }
  function isPlaying() { return !!current; }
  function currentTheme() { return current ? current.themeId : null; }
  function themeNames() { return Object.keys(THEMES); }
  function list() { return themeNames(); } // legacy alias
  function on(handler) { listeners.push(handler); }

  // tempoMod: live tempo multiplier. 1.0 = native, 1.5 = 50% faster, 0.5 = half-speed.
  // Implemented by scaling step duration on the fly so loops re-time gracefully.
  function tempoMod(rate) {
    var n = Number(rate);
    if (!isFinite(n) || n <= 0) n = 1.0;
    // Clamp to a sane range so we don't grind the scheduler to a halt.
    tempoMultiplier = Math.max(0.25, Math.min(3.0, n));
  }

  // Sync with profile settings on init + on change
  function syncSettings() {
    if (!window.MrMacsProfile) return;
    var s = window.MrMacsProfile.getSettings();
    // Only let profile override volume if user hasn't already stored one OR if
    // the profile setting has changed; either way, persist whatever wins.
    if (s.musicVolume != null) setVolume(s.musicVolume);
    setMuted(s.sound === "off");
  }
  if (typeof window !== "undefined") {
    var bindWhenReady = function () {
      if (!window.MrMacsProfile) {
        setTimeout(bindWhenReady, 50);
        return;
      }
      // If a stored volume exists, prefer that over the profile default.
      var stored = loadStoredVolume();
      if (stored == null) syncSettings();
      else {
        // Stored wins for volume, but still observe sound on/off.
        var s = window.MrMacsProfile.getSettings();
        setMuted(s.sound === "off");
      }
      window.MrMacsProfile.on("settings:change", syncSettings);
    };
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(bindWhenReady, 0);
    } else {
      document.addEventListener("DOMContentLoaded", function () { setTimeout(bindWhenReady, 0); });
    }

    // Visibility: fully suspend the audio context when tab hidden (battery
    // save), and resume + restore on return. We do NOT teardown current state,
    // so the same theme picks up where it left off when the user comes back.
    document.addEventListener("visibilitychange", function () {
      if (!ctx) return;
      if (document.hidden) {
        // Brief duck for graceful pause perception, then suspend.
        duck(0.0, 180);
        setTimeout(function () {
          try { if (ctx && ctx.state === "running") ctx.suspend(); } catch(e){}
        }, 220);
      } else {
        try { if (ctx && ctx.state === "suspended") ctx.resume(); } catch(e){}
        // Realign nextStepTime so playback resumes cleanly
        if (current && ctx) current.nextStepTime = ctx.currentTime + 0.10;
        restore(360);
      }
    });

    // Mobile audio unlock — first user gesture initializes the AudioContext
    // even if start() hasn't been called yet, so subsequent start()s are
    // free of unlock latency.
    var unlockHandler = function () {
      if (!ctx) ensureCtx();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(function(){});
      }
      window.removeEventListener("touchend", unlockHandler, true);
      window.removeEventListener("mousedown", unlockHandler, true);
      window.removeEventListener("keydown", unlockHandler, true);
    };
    window.addEventListener("touchend", unlockHandler, true);
    window.addEventListener("mousedown", unlockHandler, true);
    window.addEventListener("keydown", unlockHandler, true);
  }

  if (typeof window !== "undefined") {
    window.MrMacsArcadeMusic = {
      // Lifecycle
      start: start,
      stop: stop,
      crossfade: crossfade,
      // Mix
      duck: duck,
      restore: restore,
      setVolume: setVolume,
      setMaster: setMaster,
      setMasterVolume: setMasterVolume,  // legacy
      setMuted: setMuted,
      tempoMod: tempoMod,
      // Introspection
      isPlaying: isPlaying,
      currentTheme: currentTheme,
      themeNames: themeNames,
      list: list,                         // legacy alias for themeNames
      on: on,
      THEMES: THEMES
    };
  }
})();
