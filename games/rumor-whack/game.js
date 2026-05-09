/* ===========================================================================
   Rumor Whack — Whac-a-Mole fact-check newsroom · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x640 logical · 5x4 podium grid · scholar pop-ups
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "rumor-whack";
  var GAME_TITLE = "Rumor Whack";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 640;

  // Grid geometry
  var GRID_COLS = 5;
  var GRID_ROWS = 4;
  var CELL_W = 120;
  var CELL_H = 100;
  var GRID_OFFSET_X = (LOGICAL_W - GRID_COLS * CELL_W) / 2;     // = 60
  var GRID_OFFSET_Y = 130;                                        // top margin under HUD
  var PODIUM_TOP_W = 78;        // top-rim ellipse width
  var PODIUM_TOP_H = 22;        // top-rim ellipse height
  var PODIUM_BODY_W = 86;       // pedestal trapezoid base width
  var PODIUM_BODY_H = 56;       // pedestal trapezoid height
  var POP_RISE_MS = 200;
  var POP_SINK_MS = 200;
  var DEFAULT_LINGER_MS = 1300;

  // Scoring
  var RUMOR_WHACK_PTS = 100;
  var FACT_WHACK_PEN = -200;
  var FACT_LET_LIVE_PTS = 50;
  var RUMOR_MISS_PEN = -50;
  var SCHOLAR_BONUS_PTS = 1500;
  var SCHOLAR_SHARDS = 15;
  var SHARDS_CAP = 200;

  // Combos
  var COMBO_FIRE = 5;
  var COMBO_BLAZE = 10;
  var COMBO_LEGEND = 20;

  // Round + level threshold
  var ROUND_LENGTH_S = 60.0;
  var LIVES_INIT = 3;
  var MISS_STREAK_DEATH = 5;

  // Pacing
  var POP_INTERVAL_START = 1.20;     // seconds between pop-up spawns at start of round
  var POP_INTERVAL_END = 0.30;       // seconds at end of round
  var LINGER_START = 1.60;           // pop-up hold duration at start of round
  var LINGER_END = 0.60;             // pop-up hold duration at end of round

  // Pop probability weights
  var POP_WEIGHTS_BASE = { rumor: 60, fact: 30, scholar: 5, power: 5 };

  // Power-up types
  var POWERUP_TYPES = ["mega", "slow", "shield", "mult", "sweep"];
  var POWERUP_META = {
    mega:    { glyph: "🔨", label: "MEGA",   color: "#f5c451", glow: "#f5c451" },
    slow:    { glyph: "⏱", label: "SLOW",   color: "#9bd5ff", glow: "#5e9bd0" },
    shield:  { glyph: "🛡", label: "SHIELD", color: "#a8e8ff", glow: "#5de0f0" },
    mult:    { glyph: "⭐", label: "x2",     color: "#fff8c4", glow: "#f0a800" },
    sweep:   { glyph: "💥", label: "SWEEP",  color: "#ffb070", glow: "#f07060" }
  };

  // Power-up effects + windows
  var MEGA_WHACKS_REMAINING = 5;
  var MEGA_DURATION_S = 5.0;
  var SLOW_DURATION_S = 5.0;
  var SHIELD_FACT_HITS = 3;
  var MULT_RUMOR_HITS = 10;

  // Difficulty thresholds
  function levelScoreThreshold(level) {
    // Level 1 -> 2000; 2 -> 5000; 3 -> 9000; 4 -> 14000; 5+ adds 6000 each
    if (level <= 0) return 0;
    if (level === 1) return 2000;
    if (level === 2) return 5000;
    if (level === 3) return 9000;
    if (level === 4) return 14000;
    return 14000 + (level - 4) * 6000;
  }

  // Simultaneous pop-up cap = ceil(2 + level/2)
  function maxSimultaneous(level) {
    return Math.ceil(2 + level / 2);
  }

  // -- Inline review bank (28 entries — history/science/geography/art/music/math/language)
  var QUESTIONS = [
    { q: "Which river runs through Cairo?", choices: ["Nile", "Tigris", "Danube", "Niger"], correct: 0, hint: "Longest in Africa." },
    { q: "Who painted the Sistine Chapel ceiling?", choices: ["Raphael", "Michelangelo", "Donatello", "Bernini"], correct: 1, hint: "1508–1512, Vatican." },
    { q: "What is the chemical symbol for gold?", choices: ["Go", "Gd", "Au", "Ag"], correct: 2, hint: "From Latin aurum." },
    { q: "What's 7 × 8?", choices: ["54", "56", "58", "64"], correct: 1, hint: "A common multiplication checkpoint." },
    { q: "Who wrote 'Romeo and Juliet'?", choices: ["Marlowe", "Shakespeare", "Chaucer", "Jonson"], correct: 1, hint: "First Folio author." },
    { q: "Which planet is known as the Red Planet?", choices: ["Venus", "Mars", "Jupiter", "Mercury"], correct: 1, hint: "Iron oxide gives the color." },
    { q: "Who composed the Fifth Symphony with the 'da-da-da-DUM' motif?", choices: ["Mozart", "Bach", "Beethoven", "Brahms"], correct: 2, hint: "1808 premiere." },
    { q: "Which year did the Berlin Wall fall?", choices: ["1989", "1991", "1985", "1979"], correct: 0, hint: "Late Cold War turning point." },
    { q: "What's the past tense of 'sing'?", choices: ["singed", "sang", "sung", "singd"], correct: 1, hint: "Strong verb pattern: sing/sang/sung." },
    { q: "Which gas do plants absorb during photosynthesis?", choices: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2, hint: "CO₂ in, O₂ out." },
    { q: "Who painted 'The Starry Night'?", choices: ["Monet", "Van Gogh", "Picasso", "Dali"], correct: 1, hint: "Saint-Rémy asylum, 1889." },
    { q: "What's the area of a triangle with base 10 and height 6?", choices: ["60", "30", "16", "120"], correct: 1, hint: "½ × b × h." },
    { q: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Constitution", "Bill of Rights", "Declaration of Independence", "Federalist 10"], correct: 2, hint: "Drafted by Jefferson, 1776." },
    { q: "What's the capital of Australia?", choices: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2, hint: "Not the biggest city — the planned one." },
    { q: "Mitochondria primarily produce:", choices: ["Proteins", "ATP energy", "DNA", "Glucose"], correct: 1, hint: "The powerhouse of the cell." },
    { q: "Who wrote 'Pride and Prejudice'?", choices: ["Brontë", "Austen", "Eliot", "Woolf"], correct: 1, hint: "Regency-era novelist." },
    { q: "Which musical interval is C to G?", choices: ["Third", "Fourth", "Fifth", "Octave"], correct: 2, hint: "Seven semitones." },
    { q: "Solve: 3x + 6 = 21. x = ?", choices: ["3", "5", "6", "7"], correct: 1, hint: "Subtract 6, divide by 3." },
    { q: "Which civilization built Machu Picchu?", choices: ["Aztec", "Maya", "Inca", "Olmec"], correct: 2, hint: "Andean empire centered on Cusco." },
    { q: "Pi (π) is approximately:", choices: ["2.71", "3.14", "1.41", "1.62"], correct: 1, hint: "Circle's circumference / diameter." },
    { q: "Which is a noble gas?", choices: ["Oxygen", "Nitrogen", "Argon", "Hydrogen"], correct: 2, hint: "Group 18 of the periodic table." },
    { q: "The Treaty of Versailles (1919) ended:", choices: ["WWII", "WWI", "Cold War", "Korean War"], correct: 1, hint: "Punished Germany; Wilson's 14 Points." },
    { q: "Which artist co-founded Cubism?", choices: ["Matisse", "Picasso", "Klee", "Warhol"], correct: 1, hint: "With Georges Braque, c. 1907." },
    { q: "Which mountain range borders Tibet and India?", choices: ["Andes", "Alps", "Rockies", "Himalayas"], correct: 3, hint: "Home to Everest." },
    { q: "Who developed the theory of general relativity?", choices: ["Newton", "Einstein", "Bohr", "Curie"], correct: 1, hint: "Published 1915." },
    { q: "Which word is a synonym for 'ephemeral'?", choices: ["lasting", "fleeting", "ancient", "noisy"], correct: 1, hint: "Lasting only a short time." },
    { q: "The U.S. Bill of Rights consists of how many amendments?", choices: ["7", "10", "12", "27"], correct: 1, hint: "Ratified 1791." },
    { q: "What's 15% of 80?", choices: ["8", "10", "12", "15"], correct: 2, hint: "10% = 8, 5% = 4, sum = 12." }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | roundEnd
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var lastBonusLifeThreshold = 0;
  var hitPauseTimer = 0; // freezes update tick briefly on milestones

  // -- SFX (Web Audio) -------------------------------------------------------
  var sfxCtx = null;
  function sfxInit() {
    if (sfxCtx || !soundOn) return sfxCtx;
    try { sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { sfxCtx = null; }
    return sfxCtx;
  }
  function sfxTone(freq, duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var type = opts.type || "square";
    var vol = opts.volume == null ? 0.16 : opts.volume;
    var attack = opts.attack || 0.005;
    var decay = opts.decay == null ? duration : opts.decay;
    var now = ctxA.currentTime;
    try {
      var osc = ctxA.createOscillator();
      var gain = ctxA.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (opts.endFreq != null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain).connect(ctxA.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {}
  }
  function sfxNoise(duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var vol = opts.volume == null ? 0.16 : opts.volume;
    var bufferSize = Math.floor(ctxA.sampleRate * duration);
    try {
      var buffer = ctxA.createBuffer(1, bufferSize, ctxA.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      var src = ctxA.createBufferSource();
      src.buffer = buffer;
      var gain = ctxA.createGain();
      gain.gain.setValueAtTime(vol, ctxA.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctxA.currentTime + duration);
      var filter = ctxA.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = opts.cutoff || 1200;
      src.connect(filter).connect(gain).connect(ctxA.destination);
      src.start();
    } catch (e) {}
  }
  var sfx = {
    pop_rise: function () { sfxTone(220, 0.08, { type: "triangle", volume: 0.10, endFreq: 380 }); },
    pop_sink: function () { sfxTone(380, 0.08, { type: "triangle", volume: 0.08, endFreq: 220 }); },
    whack_rumor: function () {
      sfxNoise(0.10, { volume: 0.16, cutoff: 1600 });
      sfxTone(640, 0.08, { type: "square", volume: 0.14, endFreq: 220 });
    },
    whack_fact: function () {
      sfxTone(180, 0.30, { type: "sawtooth", volume: 0.18, endFreq: 80 });
      sfxNoise(0.16, { volume: 0.12, cutoff: 600 });
    },
    whack_scholar: function () {
      [660, 880, 1175].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 50);
      });
    },
    scholar_correct: function () {
      [784, 988, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.14, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong: function () {
      sfxTone(330, 0.18, { type: "triangle", volume: 0.12, endFreq: 220 });
    },
    miss: function () { sfxTone(180, 0.12, { type: "sawtooth", volume: 0.10, endFreq: 80 }); },
    combo_5: function () { sfxTone(880, 0.10, { type: "square", volume: 0.14 }); },
    combo_10: function () {
      [880, 1175].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "square", volume: 0.16 }); }, i * 60);
      });
    },
    combo_20: function () {
      [988, 1175, 1568, 1865, 2349].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.12, { type: "triangle", volume: 0.18 }); }, i * 60);
      });
    },
    level_up: function () {
      [523, 659, 784, 988].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    life_lost: function () {
      sfxNoise(0.18, { volume: 0.14, cutoff: 700 });
      sfxTone(220, 0.34, { type: "sawtooth", volume: 0.14, endFreq: 80 });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    powerup_pickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerup_use: function () {
      [988, 1320, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 40);
      });
    },
    sweep_blast: function () {
      sfxNoise(0.45, { volume: 0.22, cutoff: 1200 });
      sfxTone(440, 0.40, { type: "sawtooth", volume: 0.16, endFreq: 110 });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("rumorCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudLevel = $("hudLevel");
    dom.hudTime = $("hudTime");
    dom.hudCombo = $("hudCombo");
    dom.hudBest = $("hudBest");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
    dom.popupOverlay = $("popupOverlay");
    dom.powerupDock = $("powerupDock");
    dom.setupScreen = $("setupScreen");
    dom.questionScreen = $("questionScreen");
    dom.pauseScreen = $("pauseScreen");
    dom.endScreen = $("endScreen");
    dom.questionPrompt = $("questionPrompt");
    dom.choiceGrid = $("choiceGrid");
    dom.questionMeta = $("questionMeta");
    dom.questionCloseBtn = $("questionCloseBtn");
    dom.explanation = $("explanation");
    dom.startBtn = $("startBtn");
    dom.soundBtn = $("soundBtn");
    dom.fullscreenBtn = $("fullscreenBtn");
    dom.resumeBtn = $("resumeBtn");
    dom.restartBtn = $("restartBtn");
    dom.pauseExitBtn = $("pauseExitBtn");
    dom.exitBtn = $("exitBtn");
    dom.pauseBtn = $("pauseBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");
    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.retryHint = $("retryHint");
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
    dom.slots = dom.powerupDock ? dom.powerupDock.querySelectorAll(".powerup-slot") : [];
  }

  // -- Cell helpers ----------------------------------------------------------
  function cellCenter(row, col) {
    var x = GRID_OFFSET_X + col * CELL_W + CELL_W / 2;
    var y = GRID_OFFSET_Y + row * CELL_H + CELL_H / 2;
    return { x: x, y: y };
  }
  function cellAt(px, py) {
    if (px < GRID_OFFSET_X || px >= GRID_OFFSET_X + GRID_COLS * CELL_W) return null;
    if (py < GRID_OFFSET_Y || py >= GRID_OFFSET_Y + GRID_ROWS * CELL_H) return null;
    var col = Math.floor((px - GRID_OFFSET_X) / CELL_W);
    var row = Math.floor((py - GRID_OFFSET_Y) / CELL_H);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return { row: row, col: col };
  }
  function cellKey(row, col) { return row * GRID_COLS + col; }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    state = {
      level: opts.level || 1,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      time: 0,                         // total elapsed game time
      roundT: 0,                       // current round elapsed
      roundLength: ROUND_LENGTH_S,
      pops: [],                        // active pop-ups: { row, col, type, t, lifeMs, lingerMs, sinking }
      cellsLocked: {},                 // map of cellKey -> 1 (one pop per cell at a time)
      particles: [],
      callouts: [],                    // floating "+100" strings drawn on canvas
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      crosshairs: [],                  // recent click markers
      inventory: [null, null, null],   // 3-slot powerup inventory
      activePowerups: {                // active timed effects
        mega:   { active: false, hitsLeft: 0, timer: 0 },
        slow:   { active: false, timer: 0 },
        shield: { active: false, hitsLeft: 0 },
        mult:   { active: false, hitsLeft: 0 },
        sweep:  { active: false }       // sweep is instant; no timer
      },
      combo: opts.combo || 0,
      maxCombo: opts.maxCombo || 0,
      missStreak: 0,
      // round/run stats
      rumorsHit: opts.rumorsHit || 0,
      factsSpared: opts.factsSpared || 0,
      factsHit: opts.factsHit || 0,
      missedRumors: opts.missedRumors || 0,
      scholarsCorrect: opts.scholarsCorrect || 0,
      scholarsTotal: opts.scholarsTotal || 0,
      powerupsUsed: opts.powerupsUsed || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      // pacing
      nextPopTimer: 0.6,
      best: opts.best || readBest(),
      bgFlecks: opts.bgFlecks || generateFlecks(),
      endReason: ""
    };
  }

  function generateFlecks() {
    var flecks = [];
    for (var i = 0; i < 60; i++) {
      flecks.push({
        x: Math.random() * LOGICAL_W,
        y: Math.random() * LOGICAL_H,
        r: 0.5 + Math.random() * 1.4,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.0
      });
    }
    return flecks;
  }

  // -- Round pacing ---------------------------------------------------------
  function popInterval() {
    // linear fade from POP_INTERVAL_START to POP_INTERVAL_END across the round
    var t = Math.max(0, Math.min(1, state.roundT / state.roundLength));
    var base = POP_INTERVAL_START + (POP_INTERVAL_END - POP_INTERVAL_START) * t;
    // slow powerup halves cadence
    if (state.activePowerups.slow.active) base *= 2.0;
    return base;
  }
  function popLinger() {
    var t = Math.max(0, Math.min(1, state.roundT / state.roundLength));
    var base = LINGER_START + (LINGER_END - LINGER_START) * t;
    if (state.activePowerups.slow.active) base *= 1.5;
    return base * 1000; // ms
  }

  function pickPopType() {
    // Weighted roll. Rumor 60, Fact 30, Scholar 5, Power 5.
    // Slightly increase Fact weight at higher levels to ramp risk.
    var w = {
      rumor: POP_WEIGHTS_BASE.rumor,
      fact: POP_WEIGHTS_BASE.fact + Math.min(8, state.level),
      scholar: POP_WEIGHTS_BASE.scholar,
      power: POP_WEIGHTS_BASE.power
    };
    var total = w.rumor + w.fact + w.scholar + w.power;
    var r = Math.random() * total;
    if (r < w.rumor) return "rumor";
    r -= w.rumor;
    if (r < w.fact) return "fact";
    r -= w.fact;
    if (r < w.scholar) return "scholar";
    return "power";
  }

  function spawnPop() {
    if (state.pops.length >= maxSimultaneous(state.level)) return;
    // pick a free cell
    var tries = 0, row, col, key;
    while (tries < 30) {
      row = Math.floor(Math.random() * GRID_ROWS);
      col = Math.floor(Math.random() * GRID_COLS);
      key = cellKey(row, col);
      if (state.cellsLocked[key] === undefined) break;
      tries++;
    }
    if (state.cellsLocked[key] !== undefined) return;
    var type = pickPopType();
    var pop = {
      row: row, col: col,
      type: type,
      // animation: t goes from 0 -> 1 (rising), holds at 1, then sinking falls 1 -> 0
      t: 0,
      rising: true,
      sinking: false,
      lingerMs: DEFAULT_LINGER_MS,
      riseMs: POP_RISE_MS,
      sinkMs: POP_SINK_MS,
      ageMs: 0,
      stoodMs: 0,
      hit: false,
      // power-up sub-type (only relevant for "power" pops)
      powerKind: type === "power" ? POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)] : null,
      // visual flair
      seed: Math.random()
    };
    pop.lingerMs = popLinger();
    if (reducedMotion) {
      // skip rise animation
      pop.t = 1;
      pop.rising = false;
    }
    state.pops.push(pop);
    state.cellsLocked[key] = 1;
    sfx.pop_rise();
  }

  function findPopAtCell(row, col) {
    for (var i = 0; i < state.pops.length; i++) {
      var p = state.pops[i];
      if (p.row === row && p.col === col) return p;
    }
    return null;
  }

  // -- Update loop -----------------------------------------------------------
  function tick(dt) {
    if (hitPauseTimer > 0) {
      hitPauseTimer -= dt;
      if (hitPauseTimer < 0) hitPauseTimer = 0;
      return; // freeze updates briefly
    }
    state.time += dt;
    state.roundT += dt;
    // Round timer ends → round end
    if (state.roundT >= state.roundLength) {
      onRoundEnd();
      return;
    }

    // Pop spawn
    state.nextPopTimer -= dt;
    if (state.nextPopTimer <= 0) {
      spawnPop();
      state.nextPopTimer = popInterval() * (0.85 + Math.random() * 0.30);
    }

    // Update pops (rise/linger/sink)
    var dtMs = dt * 1000;
    for (var i = state.pops.length - 1; i >= 0; i--) {
      var pop = state.pops[i];
      pop.ageMs += dtMs;
      if (pop.hit) {
        // shrinking-out animation
        pop.t -= dt / 0.18;
        if (pop.t <= 0) {
          delete state.cellsLocked[cellKey(pop.row, pop.col)];
          state.pops.splice(i, 1);
        }
        continue;
      }
      if (pop.rising) {
        pop.t += dtMs / pop.riseMs;
        if (pop.t >= 1) {
          pop.t = 1;
          pop.rising = false;
        }
      } else if (!pop.sinking) {
        pop.stoodMs += dtMs;
        if (pop.stoodMs >= pop.lingerMs) {
          pop.sinking = true;
        }
      } else {
        pop.t -= dtMs / pop.sinkMs;
        if (pop.t <= 0) {
          // sunk without being whacked → resolve
          handleSink(pop);
          delete state.cellsLocked[cellKey(pop.row, pop.col)];
          state.pops.splice(i, 1);
          sfx.pop_sink();
        }
      }
    }

    // Tick powerup timers
    var ap = state.activePowerups;
    if (ap.mega.active) {
      ap.mega.timer -= dt;
      if (ap.mega.timer <= 0 || ap.mega.hitsLeft <= 0) {
        ap.mega.active = false; ap.mega.timer = 0; ap.mega.hitsLeft = 0;
      }
    }
    if (ap.slow.active) {
      ap.slow.timer -= dt;
      if (ap.slow.timer <= 0) { ap.slow.active = false; ap.slow.timer = 0; }
    }
    // shield + mult are hit-based (no timer)

    // Particles + crosshairs decay
    updateParticles(dt);
    updateCrosshairs(dt);
    updateShake(dt);
    // Callouts
    for (var c = state.callouts.length - 1; c >= 0; c--) {
      var co = state.callouts[c];
      co.life -= dt;
      co.y -= 36 * dt;
      if (co.life <= 0) state.callouts.splice(c, 1);
    }
  }

  function handleSink(pop) {
    // Pop sank without being whacked
    if (pop.type === "rumor") {
      // missed a rumor — penalty
      state.score = Math.max(0, state.score + RUMOR_MISS_PEN);
      state.missedRumors++;
      state.combo = 0;
      state.missStreak++;
      pushCallout("MISSED!", cellCenter(pop.row, pop.col).x, cellCenter(pop.row, pop.col).y - 30, "is-warn");
      pushCallout("-50", cellCenter(pop.row, pop.col).x, cellCenter(pop.row, pop.col).y, "is-score-bad");
      sfx.miss();
      if (state.missStreak >= MISS_STREAK_DEATH) {
        loseLife("missed too many rumors");
      }
    } else if (pop.type === "fact") {
      // letting a verified fact stand → +50 (reward for restraint)
      state.score += FACT_LET_LIVE_PTS;
      state.factsSpared++;
      var c = cellCenter(pop.row, pop.col);
      pushCallout("+50 SPARED", c.x, c.y - 30, "is-good");
      burstAt(c.x, c.y, "#6dc18f", 6);
    } else if (pop.type === "scholar") {
      // scholar sank without being clicked — silent
    } else if (pop.type === "power") {
      // power-up not picked up — gone, no penalty
    }
  }

  // -- Click / whack ---------------------------------------------------------
  function handleWhackAt(px, py) {
    if (phase !== "playing") return;
    // Always show a visual crosshair at the click
    state.crosshairs.push({
      x: px, y: py, life: 0.35, totalLife: 0.35
    });
    // Check if a pop-up exists at this cell and is currently visible
    var cell = cellAt(px, py);
    if (!cell) {
      // Off-grid click — whiff
      return;
    }
    var pop = findPopAtCell(cell.row, cell.col);
    if (!pop) return;
    if (pop.hit) return;
    // must be at least partially visible (t > 0.05)
    if (pop.t < 0.10) return;
    whackPop(pop);
  }

  function whackPop(pop) {
    pop.hit = true;
    var center = cellCenter(pop.row, pop.col);
    if (pop.type === "rumor") {
      var pts = RUMOR_WHACK_PTS;
      // mega: 3x score on next 5 whacks
      if (state.activePowerups.mega.active) {
        pts *= 3;
        state.activePowerups.mega.hitsLeft--;
        if (state.activePowerups.mega.hitsLeft <= 0) state.activePowerups.mega.active = false;
      }
      // mult: 2x on next 10 rumors
      if (state.activePowerups.mult.active) {
        pts *= 2;
        state.activePowerups.mult.hitsLeft--;
        if (state.activePowerups.mult.hitsLeft <= 0) state.activePowerups.mult.active = false;
      }
      state.score += pts;
      state.rumorsHit++;
      state.combo++;
      state.missStreak = 0;
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
      pushCallout("+" + pts, center.x, center.y - 30, "is-score-good");
      burstAt(center.x, center.y, "#d8483a", 14);
      addShake(2.5, 0.10);
      sfx.whack_rumor();
      // Combo milestones
      if (state.combo === COMBO_FIRE) {
        state.score += 50;
        pushCallout("ON FIRE!", LOGICAL_W / 2, 100, "is-tetris");
        sfx.combo_5();
        hitPauseTimer = 0.05;
      } else if (state.combo === COMBO_BLAZE) {
        pushCallout("BLAZING!", LOGICAL_W / 2, 100, "is-tetris");
        // Auto-grant a 2x mult on next match
        state.activePowerups.mult.active = true;
        state.activePowerups.mult.hitsLeft = MULT_RUMOR_HITS;
        sfx.combo_10();
        hitPauseTimer = 0.07;
      } else if (state.combo === COMBO_LEGEND) {
        state.score += 500;
        pushCallout("ARCHIVE LEGEND!", LOGICAL_W / 2, 100, "is-legend");
        sfx.combo_20();
        hitPauseTimer = 0.10;
        // Drop a power-up into inventory
        addRandomPowerupToInventory();
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 32, palette: ["#f5c451", "#d8483a", "#5de0f0"] });
          }
        } catch (e) {}
      }
      checkBonusLife();
    } else if (pop.type === "fact") {
      // verified fact whacked — penalty
      // shield: absorb up to 3 fact whacks without penalty
      var shielded = false;
      if (state.activePowerups.shield.active && state.activePowerups.shield.hitsLeft > 0) {
        state.activePowerups.shield.hitsLeft--;
        if (state.activePowerups.shield.hitsLeft <= 0) state.activePowerups.shield.active = false;
        shielded = true;
      }
      if (!shielded) {
        state.score = Math.max(0, state.score + FACT_WHACK_PEN);
        state.factsHit++;
        state.combo = 0;
        pushCallout("FACT! -200", center.x, center.y - 30, "is-warn");
        // Lose life on Level 3+
        if (state.level >= 3) {
          loseLife("whacked a fact");
        }
      } else {
        pushCallout("SHIELDED!", center.x, center.y - 30, "is-bonus");
        burstAt(center.x, center.y, "#5de0f0", 14);
      }
      addShake(4, 0.18);
      sfx.whack_fact();
    } else if (pop.type === "scholar") {
      // Scholar — open review modal
      sfx.whack_scholar();
      addShake(2, 0.10);
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 18, palette: ["#f5c451", "#a991ff", "#5de0f0"] });
        }
      } catch (e) {}
      openScholarQuestion();
    } else if (pop.type === "power") {
      // Power-up — pickup
      if (addPowerupToInventory(pop.powerKind)) {
        burstAt(center.x, center.y, "#a991ff", 14);
        sfx.powerup_pickup();
        pushCallout(POWERUP_META[pop.powerKind].label, center.x, center.y - 30, "is-bonus");
      } else {
        // inventory full — fizzle
        pushCallout("INV FULL", center.x, center.y - 30, "is-warn");
        sfx.miss();
      }
    }
  }

  function loseLife(reason) {
    state.lives--;
    state.combo = 0;
    state.missStreak = 0;
    addShake(8, 0.45);
    sfx.life_lost();
    pushCallout("-1 LIFE · " + (reason || ""), LOGICAL_W / 2, 130, "is-warn");
    if (state.lives <= 0) {
      gameOver();
    }
  }

  function checkBonusLife() {
    var threshold = Math.floor(state.score / 10000) * 10000;
    if (threshold > lastBonusLifeThreshold && threshold >= 10000) {
      lastBonusLifeThreshold = threshold;
      state.lives++;
      pushCallout("+1 LIFE", LOGICAL_W / 2, 130, "is-bonus");
      sfx.combo_5();
    }
  }

  // -- Power-up inventory ----------------------------------------------------
  function addPowerupToInventory(kind) {
    for (var i = 0; i < state.inventory.length; i++) {
      if (state.inventory[i] === null) {
        state.inventory[i] = kind;
        return true;
      }
    }
    return false;
  }
  function addRandomPowerupToInventory() {
    var kind = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    addPowerupToInventory(kind);
  }
  function activatePowerup(slotIdx) {
    if (phase !== "playing") return;
    var kind = state.inventory[slotIdx];
    if (!kind) return;
    state.inventory[slotIdx] = null;
    state.powerupsUsed++;
    sfx.powerup_use();
    var ap = state.activePowerups;
    if (kind === "mega") {
      ap.mega.active = true;
      ap.mega.hitsLeft = MEGA_WHACKS_REMAINING;
      ap.mega.timer = MEGA_DURATION_S;
      pushCallout("MEGA WHACK!", LOGICAL_W / 2, 130, "is-bonus");
    } else if (kind === "slow") {
      ap.slow.active = true;
      ap.slow.timer = SLOW_DURATION_S;
      pushCallout("SLOW TIME!", LOGICAL_W / 2, 130, "is-bonus");
    } else if (kind === "shield") {
      ap.shield.active = true;
      ap.shield.hitsLeft = SHIELD_FACT_HITS;
      pushCallout("FACT SHIELD!", LOGICAL_W / 2, 130, "is-bonus");
    } else if (kind === "mult") {
      ap.mult.active = true;
      ap.mult.hitsLeft = MULT_RUMOR_HITS;
      pushCallout("x2 MULTIPLIER!", LOGICAL_W / 2, 130, "is-bonus");
    } else if (kind === "sweep") {
      // clear all currently visible rumors instantly
      var swept = 0;
      for (var i = state.pops.length - 1; i >= 0; i--) {
        var p = state.pops[i];
        if (p.type === "rumor" && !p.hit && p.t > 0.05) {
          p.hit = true;
          state.score += 50;
          state.rumorsHit++;
          var c = cellCenter(p.row, p.col);
          burstAt(c.x, c.y, "#f07060", 12);
          swept++;
        }
      }
      pushCallout("SWEEP! +" + swept * 50, LOGICAL_W / 2, 130, "is-bonus");
      addShake(6, 0.30);
      sfx.sweep_blast();
    }
  }

  // -- Round end + level up --------------------------------------------------
  function onRoundEnd() {
    if (phase === "roundEnd") return;
    phase = "roundEnd";
    // Summary callout
    pushCallout("ROUND COMPLETE", LOGICAL_W / 2, 100, "is-tetris");
    sfx.level_up();
    // Check if level up
    var threshold = levelScoreThreshold(state.level);
    var leveled = state.score >= threshold;
    setTimeout(function () {
      if (leveled) {
        state.level++;
        pushCallout("LEVEL " + state.level + "!", LOGICAL_W / 2, 130, "is-legend");
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 32, palette: ["#f5c451", "#d8483a", "#5de0f0", "#a991ff"] });
          }
        } catch (e) {}
        // Bonus life on level up
        state.lives++;
      } else {
        pushCallout("Need " + formatNumber(threshold) + " for next level", LOGICAL_W / 2, 130, "is-warn");
      }
      // Reset round
      state.roundT = 0;
      // Clear pops
      state.pops = [];
      state.cellsLocked = {};
      state.nextPopTimer = 0.6;
      state.combo = 0;
      state.missStreak = 0;
      saveSnapshot();
      phase = "playing";
    }, 1300);
  }

  // -- Scholar review modal --------------------------------------------------
  var activeQuestion = null;

  function pickQuestion() {
    return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  }

  function openScholarQuestion() {
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Pop-up · Optional · +1500 + 15 shards";
    if (dom.questionCloseBtn) dom.questionCloseBtn.textContent = "Skip";
    renderQuestion();
    prevPhase = phase;
    phase = "question";
    pauseMusic();
    showScreen("question");
    saveSnapshot();
  }

  function renderQuestion() {
    if (!activeQuestion) return;
    dom.questionPrompt.textContent = activeQuestion.q;
    dom.explanation.textContent = "";
    dom.explanation.className = "explanation";
    var letters = ["A", "B", "C", "D"];
    // Build shuffled choice list
    var indexedChoices = activeQuestion.choices.map(function (c, i) {
      return { text: c, isCorrect: i === activeQuestion.correct };
    });
    for (var i = indexedChoices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = indexedChoices[i]; indexedChoices[i] = indexedChoices[j]; indexedChoices[j] = tmp;
    }
    var html = "";
    for (var k = 0; k < indexedChoices.length && k < 4; k++) {
      html += '<button class="choice-btn" data-correct="' + (indexedChoices[k].isCorrect ? "1" : "0") +
              '" data-text="' + escapeHtml(indexedChoices[k].text) + '">' +
              '<span class="choice-letter">' + letters[k] + '</span>' +
              escapeHtml(indexedChoices[k].text) + '</button>';
    }
    dom.choiceGrid.innerHTML = html;
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    for (var b = 0; b < btns.length; b++) btns[b].addEventListener("click", onChoiceClick);
  }

  function onChoiceClick(e) {
    var btn = e.currentTarget;
    var correct = btn.getAttribute("data-correct") === "1";
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    btns.forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute("data-correct") === "1") b.classList.add("is-correct");
      else if (b === btn) b.classList.add("is-wrong");
    });
    state.scholarsTotal++;
    if (correct) {
      dom.explanation.textContent = "Decoded! +" + SCHOLAR_BONUS_PTS + " and +" + SCHOLAR_SHARDS + " shards.";
      dom.explanation.className = "explanation is-correct";
      state.scholarsCorrect++;
    } else {
      var corText = "";
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains("is-correct")) corText = btns[i].getAttribute("data-text");
      }
      dom.explanation.textContent = "Not quite. Answer: " + corText + ". " + (activeQuestion.hint || "");
      dom.explanation.className = "explanation is-wrong";
    }
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }

  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += SCHOLAR_BONUS_PTS;
      addShards(SCHOLAR_SHARDS);
      sfx.scholar_correct();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushCallout("+" + SCHOLAR_BONUS_PTS + " SCHOLAR", LOGICAL_W / 2, 100, "is-bonus");
    } else {
      // soft "not quite" callout, no penalty
      sfx.scholar_wrong();
      pushCallout("Not quite", LOGICAL_W / 2, 100, "is-warn");
    }
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function skipQuestion() {
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // -- Particles + callouts --------------------------------------------------
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    count = count || 10;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 130;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.55 + Math.random() * 0.20,
        totalLife: 0.65,
        color: color || "#fff",
        size: 2 + Math.random() * 2.5
      });
    }
  }
  function updateParticles(dt) {
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }
  function pushCallout(text, x, y, kls) {
    state.callouts.push({
      text: text, x: x, y: y, kls: kls || "is-score",
      life: 1.1, totalLife: 1.1
    });
  }
  function updateCrosshairs(dt) {
    for (var i = state.crosshairs.length - 1; i >= 0; i--) {
      var c = state.crosshairs[i];
      c.life -= dt;
      if (c.life <= 0) state.crosshairs.splice(i, 1);
    }
  }
  function addShake(intensity, life) {
    if (reducedMotion) return;
    state.shake.intensity = Math.max(state.shake.intensity, intensity);
    state.shake.life = Math.max(state.shake.life, life);
    state.shake.totalLife = Math.max(state.shake.totalLife, life);
  }
  function updateShake(dt) {
    if (state.shake.life > 0) {
      state.shake.life -= dt;
      var t = state.shake.life / state.shake.totalLife;
      var i = state.shake.intensity * Math.max(0, t);
      state.shake.x = (Math.random() - 0.5) * 2 * i;
      state.shake.y = (Math.random() - 0.5) * 2 * i;
    } else {
      state.shake.x = 0;
      state.shake.y = 0;
    }
  }

  // -- Render ----------------------------------------------------------------
  function render() {
    var W = canvas.width, H = canvas.height;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(offsetX * dpr, offsetY * dpr);
    ctx.scale(scale * dpr, scale * dpr);
    ctx.translate(state.shake.x, state.shake.y);

    drawBackground();
    drawNewsroomDesk();
    drawGridGuides();
    drawPodiums();
    drawPops();
    drawParticles();
    drawCrosshairs();
    drawCallouts();

    ctx.restore();
  }

  function drawBackground() {
    // Letterbox void
    ctx.fillStyle = "#04060f";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    // warm radial behind grid
    var cx = LOGICAL_W / 2, cy = LOGICAL_H / 2 + 20;
    var glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 380);
    glow.addColorStop(0, "rgba(216,72,58,0.10)");
    glow.addColorStop(0.5, "rgba(80,30,20,0.10)");
    glow.addColorStop(1, "rgba(4,6,15,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Background flecks (newsroom dust motes)
    if (state.bgFlecks) {
      for (var i = 0; i < state.bgFlecks.length; i++) {
        var s = state.bgFlecks[i];
        var tw = reducedMotion ? 1 : (0.5 + 0.5 * Math.abs(Math.sin(state.time * s.twinkleSpeed + s.twinkle)));
        ctx.fillStyle = "rgba(245,196,81," + (0.10 * tw) + ")";
        ctx.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
      }
    }
  }

  function drawNewsroomDesk() {
    // Bottom band — dark wood desk with bronze trim
    var deskTop = GRID_OFFSET_Y + GRID_ROWS * CELL_H + 10;
    // Wood gradient
    var grad = ctx.createLinearGradient(0, deskTop, 0, LOGICAL_H);
    grad.addColorStop(0, "#3a2510");
    grad.addColorStop(0.4, "#2a1808");
    grad.addColorStop(1, "#180a04");
    ctx.fillStyle = grad;
    ctx.fillRect(0, deskTop, LOGICAL_W, LOGICAL_H - deskTop);
    // Bronze trim line
    ctx.fillStyle = "#a96e3d";
    ctx.fillRect(0, deskTop, LOGICAL_W, 2);
    ctx.fillStyle = "#6a3f22";
    ctx.fillRect(0, deskTop + 2, LOGICAL_W, 1);
    // Wood grain hints
    for (var i = 0; i < 6; i++) {
      ctx.fillStyle = "rgba(255,200,120,0.04)";
      var gy = deskTop + 8 + i * 14;
      ctx.fillRect(20 + (i % 2) * 60, gy, LOGICAL_W - 40 - (i % 2) * 60, 1);
    }
    // Top band — dark "headline frame" above grid
    var topBand = GRID_OFFSET_Y - 16;
    ctx.fillStyle = "rgba(24,14,6,0.65)";
    ctx.fillRect(0, 100, LOGICAL_W, topBand - 100);
    ctx.fillStyle = "#a96e3d";
    ctx.fillRect(0, topBand - 1, LOGICAL_W, 1);
  }

  function drawGridGuides() {
    // Subtle grid lines for the 5x4 desk layout
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (var c = 0; c <= GRID_COLS; c++) {
      var x = GRID_OFFSET_X + c * CELL_W;
      ctx.beginPath();
      ctx.moveTo(x, GRID_OFFSET_Y);
      ctx.lineTo(x, GRID_OFFSET_Y + GRID_ROWS * CELL_H);
      ctx.stroke();
    }
    for (var r = 0; r <= GRID_ROWS; r++) {
      var y = GRID_OFFSET_Y + r * CELL_H;
      ctx.beginPath();
      ctx.moveTo(GRID_OFFSET_X, y);
      ctx.lineTo(GRID_OFFSET_X + GRID_COLS * CELL_W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPodiums() {
    // Each cell hosts a pedestal + hole at its center
    for (var r = 0; r < GRID_ROWS; r++) {
      for (var c = 0; c < GRID_COLS; c++) {
        drawPodium(r, c);
      }
    }
  }

  function drawPodium(row, col) {
    var center = cellCenter(row, col);
    var cx = center.x, cy = center.y + 14;     // shift down a bit so figures rise above center
    // Side shadow trapezoid (back)
    ctx.fillStyle = "#1a0e06";
    ctx.beginPath();
    ctx.moveTo(cx - PODIUM_BODY_W / 2 - 4, cy - 4);
    ctx.lineTo(cx + PODIUM_BODY_W / 2 + 4, cy - 4);
    ctx.lineTo(cx + PODIUM_BODY_W / 2 - 8, cy + PODIUM_BODY_H);
    ctx.lineTo(cx - PODIUM_BODY_W / 2 + 8, cy + PODIUM_BODY_H);
    ctx.closePath();
    ctx.fill();
    // Front face trapezoid
    var grad = ctx.createLinearGradient(0, cy, 0, cy + PODIUM_BODY_H);
    grad.addColorStop(0, "#5a3a22");
    grad.addColorStop(1, "#2c1808");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - PODIUM_BODY_W / 2, cy);
    ctx.lineTo(cx + PODIUM_BODY_W / 2, cy);
    ctx.lineTo(cx + PODIUM_BODY_W / 2 - 12, cy + PODIUM_BODY_H);
    ctx.lineTo(cx - PODIUM_BODY_W / 2 + 12, cy + PODIUM_BODY_H);
    ctx.closePath();
    ctx.fill();
    // Bronze pinstripe trim
    ctx.strokeStyle = "rgba(168,110,61,0.65)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - PODIUM_BODY_W / 2 + 4, cy + 6);
    ctx.lineTo(cx + PODIUM_BODY_W / 2 - 4, cy + 6);
    ctx.stroke();
    // Top rim ellipse (the hole frame)
    ctx.fillStyle = "#1a1208";
    ctx.beginPath();
    ctx.ellipse(cx, cy, PODIUM_TOP_W / 2, PODIUM_TOP_H / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Top rim highlight
    ctx.strokeStyle = "rgba(168,110,61,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, PODIUM_TOP_W / 2, PODIUM_TOP_H / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Inner shadow ring (the hole itself)
    var inner = ctx.createRadialGradient(cx, cy, 4, cx, cy, PODIUM_TOP_W / 2);
    inner.addColorStop(0, "rgba(0,0,0,0.95)");
    inner.addColorStop(0.7, "rgba(0,0,0,0.65)");
    inner.addColorStop(1, "rgba(0,0,0,0.0)");
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.ellipse(cx, cy, PODIUM_TOP_W / 2 - 2, PODIUM_TOP_H / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPops() {
    // Sort by row so lower-row pops draw last (in front)
    var sorted = state.pops.slice().sort(function (a, b) { return a.row - b.row; });
    for (var i = 0; i < sorted.length; i++) {
      drawPop(sorted[i]);
    }
  }

  function drawPop(pop) {
    var center = cellCenter(pop.row, pop.col);
    // The figure rises from the hole. At t=0 it's hidden inside the podium; t=1 it's fully out.
    var t = Math.max(0, Math.min(1, pop.t));
    // Eased rise (overshoot slightly when landing)
    var eased;
    if (pop.rising) {
      eased = 1 - Math.pow(1 - t, 2.5);
    } else if (pop.sinking) {
      eased = t;
    } else {
      // idle: tiny bounce when first arrived (within 100ms of arrival)
      var bounce = 0;
      if (!reducedMotion && pop.stoodMs < 200) {
        var bt = pop.stoodMs / 200;
        bounce = Math.sin(bt * Math.PI) * 0.06;
      }
      eased = 1 + bounce;
    }
    var cx = center.x;
    var baseY = center.y + 14;        // top of podium (matches drawPodium cy)
    // figure y-offset: rise from baseY+10 (hidden in hole) up to baseY-FIG_RISE
    var FIG_RISE = 36;
    var y = baseY + 10 - eased * FIG_RISE;

    // Clip to top half of podium so figures appear to emerge from hole
    ctx.save();
    ctx.beginPath();
    // Clip rect: from row top down to baseY (rim line), so anything drawn below rim is hidden
    var clipTop = GRID_OFFSET_Y + pop.row * CELL_H - 16;
    var clipBottom = baseY;
    ctx.rect(cx - 60, clipTop, 120, clipBottom - clipTop);
    ctx.clip();

    // Draw figure based on type
    if (pop.type === "rumor") drawRumor(cx, y, pop);
    else if (pop.type === "fact") drawFact(cx, y, pop);
    else if (pop.type === "scholar") drawScholar(cx, y, pop);
    else if (pop.type === "power") drawPower(cx, y, pop);
    ctx.restore();

    // Tag label below figure (above rim)
    if (eased > 0.6) drawTag(cx, baseY - 4, pop.type, pop);

    // Sinking warning: if a rumor has only ~25% linger time left, flash a bit
    if (!pop.sinking && !pop.hit && pop.type === "rumor") {
      var remaining = pop.lingerMs - pop.stoodMs;
      if (remaining < 350 && remaining > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6 * Math.abs(Math.sin(state.time * 14));
        ctx.fillStyle = "rgba(216,72,58,0.5)";
        ctx.beginPath();
        ctx.ellipse(cx, baseY, PODIUM_TOP_W / 2 + 4, PODIUM_TOP_H / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawTag(cx, y, type, pop) {
    var label, fill, stroke;
    if (type === "rumor")    { label = "RUMOR";   fill = "#d8483a"; stroke = "#802620"; }
    else if (type === "fact"){ label = "FACT";    fill = "#6dc18f"; stroke = "#2d8053"; }
    else if (type === "scholar"){ label = "SCHOLAR"; fill = "#f5c451"; stroke = "#a8821c"; }
    else                     { label = (POWERUP_META[pop.powerKind] || {}).label || "POWER"; fill = "#a991ff"; stroke = "#5a3a90"; }
    ctx.save();
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var w = ctx.measureText(label).width + 12;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(cx - w / 2, y - 6, w, 12);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - w / 2, y - 6, w, 12);
    ctx.fillStyle = fill;
    ctx.fillText(label, cx, y);
    ctx.restore();
  }

  function drawRumor(cx, y, pop) {
    // Red-cracked face with steam puff
    ctx.save();
    ctx.translate(cx, y);
    // Steam puff above head
    if (!reducedMotion) {
      var smokeT = state.time * 1.5 + pop.seed * 6;
      for (var s = 0; s < 3; s++) {
        var sx = Math.sin(smokeT + s * 1.2) * 6 - 8 + s * 6;
        var sy = -22 - s * 5 - (Math.sin(smokeT * 0.8 + s) * 1.5);
        var sa = 0.18 - s * 0.04;
        ctx.fillStyle = "rgba(216,200,176," + sa + ")";
        ctx.beginPath();
        ctx.arc(sx, sy, 4 + s * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Body shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Suit body — dark crimson
    var grad = ctx.createLinearGradient(0, -8, 0, 14);
    grad.addColorStop(0, "#a8362a");
    grad.addColorStop(1, "#5a1810");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Crack lines
    ctx.strokeStyle = "#3a0808";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-6, 1); ctx.lineTo(-2, 6); ctx.lineTo(-4, 9);
    ctx.moveTo(4, 0); ctx.lineTo(7, 5);
    ctx.stroke();
    // Head — pale w/ red tint
    ctx.fillStyle = "#e8b8a8";
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.fill();
    // Crack lines on face
    ctx.strokeStyle = "#5a1810";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, -12); ctx.lineTo(-2, -7);
    ctx.moveTo(4, -14); ctx.lineTo(2, -10);
    ctx.stroke();
    // Eyes — wide, red-rimmed
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-3, -11, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -11, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a0a0a";
    ctx.beginPath(); ctx.arc(-3, -11, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -11, 1.1, 0, Math.PI * 2); ctx.fill();
    // Frowny mouth
    ctx.strokeStyle = "#5a1810";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -5, 2.5, Math.PI + 0.4, 2 * Math.PI - 0.4);
    ctx.stroke();
    // Microphone (small)
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(-2, 3, 4, 5);
    ctx.fillStyle = "#a96e3d";
    ctx.beginPath();
    ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFact(cx, y, pop) {
    // Green laurel-wreath face, calm composure
    ctx.save();
    ctx.translate(cx, y);
    // Body shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Suit body — sage
    var grad = ctx.createLinearGradient(0, -8, 0, 14);
    grad.addColorStop(0, "#7ed4a0");
    grad.addColorStop(1, "#2d8053");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tie / collar accent
    ctx.fillStyle = "#1a4030";
    ctx.beginPath();
    ctx.moveTo(-2, -2); ctx.lineTo(2, -2); ctx.lineTo(0, 6); ctx.closePath();
    ctx.fill();
    // Head
    ctx.fillStyle = "#e8c098";
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.fill();
    // Laurel wreath — two leafy arcs around head
    ctx.strokeStyle = "#2d8053";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -10, 9, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    // Leaves on left arc
    var leafColor = "#3a9060";
    for (var i = 0; i < 5; i++) {
      var ang = Math.PI * 1.10 + i * 0.18;
      var lx = Math.cos(ang) * 9.5;
      var ly = -10 + Math.sin(ang) * 9.5;
      ctx.fillStyle = leafColor;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 2.5, 1.3, ang + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Leaves on right arc
    for (var j = 0; j < 5; j++) {
      var ang2 = Math.PI * 1.90 - j * 0.18;
      var lx2 = Math.cos(ang2) * 9.5;
      var ly2 = -10 + Math.sin(ang2) * 9.5;
      ctx.fillStyle = leafColor;
      ctx.beginPath();
      ctx.ellipse(lx2, ly2, 2.5, 1.3, ang2 + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Calm eyes (closed-ish, content)
    ctx.strokeStyle = "#1a3020";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-3, -11, 1.4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, -11, 1.4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Soft smile
    ctx.beginPath();
    ctx.arc(0, -7, 2.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Verified seal on suit
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.arc(7, 2, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a3020";
    ctx.font = "bold 4px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("V", 7, 2);
    ctx.restore();
  }

  function drawScholar(cx, y, pop) {
    // Gold-rim podium pop with rotating rainbow "?"
    ctx.save();
    ctx.translate(cx, y);
    // Body shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Robed body — deep purple
    var grad = ctx.createLinearGradient(0, -8, 0, 14);
    grad.addColorStop(0, "#5a3a90");
    grad.addColorStop(1, "#2a1450");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Gold trim
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, -1); ctx.lineTo(9, -1);
    ctx.stroke();
    // Head — neutral
    ctx.fillStyle = "#d8b89a";
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.fill();
    // Mortarboard cap (square)
    ctx.fillStyle = "#1a0a18";
    ctx.fillRect(-9, -19, 18, 3);
    ctx.fillStyle = "#2a1830";
    ctx.beginPath();
    ctx.ellipse(0, -16, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.arc(0, -19, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // tassel
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -19); ctx.lineTo(7, -16);
    ctx.stroke();
    // Eyes
    ctx.fillStyle = "#1a0a20";
    ctx.beginPath(); ctx.arc(-3, -11, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -11, 1.2, 0, Math.PI * 2); ctx.fill();
    // Rotating "?" — rainbow strokes
    var rotation = reducedMotion ? 0 : (state.time * 1.8 + pop.seed * 4);
    ctx.save();
    ctx.translate(0, -2);
    ctx.rotate(rotation);
    var colors = ["#f5c451", "#5de0f0", "#a991ff", "#f07bb8"];
    for (var i = 0; i < colors.length; i++) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 7, Math.PI * 0.85 + i * 0.4, Math.PI * 2.0 + i * 0.4);
      ctx.stroke();
    }
    ctx.restore();
    // Add gold rim highlight on the rim ellipse
    ctx.strokeStyle = "rgba(245,196,81,0.85)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 11, 14, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPower(cx, y, pop) {
    var meta = POWERUP_META[pop.powerKind] || POWERUP_META.mega;
    ctx.save();
    ctx.translate(cx, y);
    // Halo
    if (!reducedMotion) {
      var rad = 22;
      var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
      glow.addColorStop(0, hexA(meta.glow, 0.55));
      glow.addColorStop(1, hexA(meta.glow, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -2, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    // Body shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Disc backplate
    ctx.fillStyle = "rgba(4,8,18,0.85)";
    ctx.beginPath();
    ctx.arc(0, -2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = meta.glow;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -2, 13, 0, Math.PI * 2);
    ctx.stroke();
    // Glyph
    ctx.fillStyle = meta.color;
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meta.glyph, 0, -1);
    ctx.restore();
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var a = Math.max(0, p.life / p.totalLife);
      ctx.fillStyle = hexA(p.color || "#fff", a);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  function drawCrosshairs() {
    for (var i = 0; i < state.crosshairs.length; i++) {
      var c = state.crosshairs[i];
      var t = c.life / c.totalLife;
      var alpha = Math.max(0, t);
      // crosshair
      ctx.save();
      ctx.strokeStyle = "rgba(245,196,81," + alpha + ")";
      ctx.lineWidth = 1.5;
      var s = 10 + (1 - t) * 6;
      ctx.beginPath();
      ctx.moveTo(c.x - s, c.y); ctx.lineTo(c.x - 2, c.y);
      ctx.moveTo(c.x + 2, c.y); ctx.lineTo(c.x + s, c.y);
      ctx.moveTo(c.x, c.y - s); ctx.lineTo(c.x, c.y - 2);
      ctx.moveTo(c.x, c.y + 2); ctx.lineTo(c.x, c.y + s);
      ctx.stroke();
      // expanding ring
      ctx.strokeStyle = "rgba(245,196,81," + (alpha * 0.6) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6 + (1 - t) * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCallouts() {
    for (var i = 0; i < state.callouts.length; i++) {
      var co = state.callouts[i];
      var t = co.life / co.totalLife;
      var alpha = Math.max(0, t);
      var color = "#f5c451";
      var size = 18;
      var fontStyle = "italic 800 22px Fraunces, serif";
      if (co.kls === "is-tetris") { color = "#f07060"; size = 28; fontStyle = "italic 900 32px Fraunces, serif"; }
      else if (co.kls === "is-legend") { color = "#f07bb8"; size = 30; fontStyle = "italic 900 34px Fraunces, serif"; }
      else if (co.kls === "is-bonus") { color = "#a991ff"; fontStyle = "italic 800 22px Fraunces, serif"; }
      else if (co.kls === "is-warn") { color = "#f04860"; fontStyle = "italic 800 20px Fraunces, serif"; }
      else if (co.kls === "is-good") { color = "#6dc18f"; fontStyle = "italic 800 20px Fraunces, serif"; }
      else if (co.kls === "is-score-good") { color = "#f5c451"; fontStyle = "bold 18px JetBrains Mono, monospace"; }
      else if (co.kls === "is-score-bad") { color = "#f04860"; fontStyle = "bold 18px JetBrains Mono, monospace"; }
      ctx.save();
      ctx.font = fontStyle;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = alpha;
      // Text shadow
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillText(co.text, co.x + 1, co.y + 1);
      ctx.fillStyle = color;
      ctx.fillText(co.text, co.x, co.y);
      ctx.restore();
    }
  }

  // -- Color helpers ---------------------------------------------------------
  function hexA(hex, a) {
    if (!hex) return "rgba(255,255,255," + a + ")";
    if (hex.charAt(0) !== "#") return hex;
    var h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  // -- HUD update ------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudLevel) dom.hudLevel.textContent = String(state.level);
    if (dom.hudCombo) {
      dom.hudCombo.textContent = String(state.combo);
      var combocell = dom.hudCombo.parentElement;
      if (combocell) combocell.classList.toggle("is-combo", state.combo >= COMBO_FIRE);
    }
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.hudTime) {
      var rem = Math.max(0, state.roundLength - state.roundT);
      dom.hudTime.textContent = String(Math.ceil(rem));
      var cell = dom.hudTime.parentElement;
      if (cell) {
        cell.classList.toggle("is-warning", rem < 15 && rem >= 5);
        cell.classList.toggle("is-danger", rem < 5);
      }
    }
    if (dom.goalName) {
      dom.goalName.textContent = "Newsroom Desk · Lvl " + state.level + " · " +
        Math.ceil(state.roundLength - state.roundT) + "s";
    }
    if (dom.goalMeta) {
      var bits = [];
      var ap = state.activePowerups;
      if (ap.mega.active) bits.push("Mega " + ap.mega.timer.toFixed(1) + "s");
      if (ap.slow.active) bits.push("Slow " + ap.slow.timer.toFixed(1) + "s");
      if (ap.shield.active) bits.push("Shield " + ap.shield.hitsLeft + "x");
      if (ap.mult.active) bits.push("x2 " + ap.mult.hitsLeft + "x");
      if (bits.length === 0) bits.push("Combo · " + state.combo);
      bits.push("Threshold " + formatNumber(levelScoreThreshold(state.level)));
      dom.goalMeta.textContent = bits.join(" · ");
    }
    updatePowerupDock();
  }

  function updatePowerupDock() {
    if (!dom.slots || !dom.slots.length) return;
    for (var i = 0; i < dom.slots.length; i++) {
      var slot = dom.slots[i];
      var kind = state.inventory[i];
      var glyphEl = slot.querySelector(".slot-glyph");
      var labelEl = slot.querySelector(".slot-label");
      if (!kind) {
        slot.classList.add("is-empty");
        slot.classList.remove("is-armed", "is-active");
        if (glyphEl) glyphEl.textContent = "";
        if (labelEl) labelEl.textContent = "";
      } else {
        slot.classList.remove("is-empty");
        slot.classList.add("is-armed");
        slot.classList.remove("is-active");
        var meta = POWERUP_META[kind];
        if (glyphEl) glyphEl.textContent = meta.glyph;
        if (labelEl) labelEl.textContent = meta.label;
      }
    }
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Game over -------------------------------------------------------------
  function gameOver() {
    if (phase === "ended") return;
    sfx.gameOver();
    addShake(8, 0.5);
    phase = "ended";
    var prevBest = readBest();
    if (state.score > prevBest) writeBest(state.score);
    saveSnapshot();
    setTimeout(showEndScreen, 700);
  }

  function showEndScreen() {
    if (phase !== "ended") return;
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 200));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Newsroom Overrun" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Rumor Whack · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Level Reached</div><div class="end-cell-value">' + state.level + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Rumors Whacked</div><div class="end-cell-value">' + formatNumber(state.rumorsHit) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Facts Spared</div><div class="end-cell-value">' + formatNumber(state.factsSpared) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Combo</div><div class="end-cell-value">' + state.maxCombo + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.scholarsCorrect + '/' + state.scholarsTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Powerups Used</div><div class="end-cell-value">' + state.powerupsUsed + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    stopMusic();
  }

  // -- Screens ---------------------------------------------------------------
  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
  }

  // -- Resize / scaling ------------------------------------------------------
  function resize() {
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    var sx = rect.width / LOGICAL_W;
    var sy = rect.height / LOGICAL_H;
    scale = Math.min(sx, sy);
    offsetX = (rect.width - LOGICAL_W * scale) / 2;
    offsetY = (rect.height - LOGICAL_H * scale) / 2;
  }

  // -- Hub integration -------------------------------------------------------
  function addShards(n) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, GAME_ID + "-scholar");
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit({
          gameId: GAME_ID,
          score: state.score,
          displayName: window.MrMacsProfile && window.MrMacsProfile.getName ? window.MrMacsProfile.getName() : "",
          level: state.level,
          rumors: state.rumorsHit,
          combo: state.maxCombo
        });
      }
    } catch (e) {}
  }
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          level: state.level,
          lives: state.lives,
          rumorsHit: state.rumorsHit,
          maxCombo: state.maxCombo,
          ts: Date.now()
        });
      }
    } catch (e) {}
  }
  function loadSnapshot() {
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.load) {
        return window.MrMacsSessions.load(GAME_ID);
      }
    } catch (e) {}
    return null;
  }
  function clearSnapshot() {
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.clear) {
        window.MrMacsSessions.clear(GAME_ID);
      }
    } catch (e) {}
  }
  function recordPlayWithProfile(durationMs) {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          gameId: GAME_ID,
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/rumor-whack/index.html",
          score: state ? state.score : 0,
          level: state ? state.level : 1,
          durationMs: durationMs || 0
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("rumor-whack:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("rumor-whack:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("pinball-cabinet", { volume: 0.5 });
      }
    } catch (e) {}
  }
  function pauseMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck) window.MrMacsArcadeMusic.duck(0.1, 200); } catch (e) {}
  }
  function resumeMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore) window.MrMacsArcadeMusic.restore(200); } catch (e) {}
  }
  function stopMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop) window.MrMacsArcadeMusic.stop(); } catch (e) {}
  }

  // -- Input -----------------------------------------------------------------
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
        // 1-5 to use power-up slots (only 3 slots, so 1-3 active; 4-5 noop)
        if (k === "1") { activatePowerup(0); e.preventDefault(); return; }
        if (k === "2") { activatePowerup(1); e.preventDefault(); return; }
        if (k === "3") { activatePowerup(2); e.preventDefault(); return; }
        if (k === "4" || k === "5") { e.preventDefault(); return; }
        if (k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
      }
      if (phase === "paused" && (k === "p" || k === "P" || k === " ")) {
        togglePause();
        e.preventDefault();
        return;
      }
      if (k === "Escape" || k === "Esc") {
        if (phase === "playing" || phase === "paused") togglePause();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
      }
    });
    bindCanvasClick();
    bindPowerupSlots();
  }

  function canvasToLogical(cx, cy) {
    var rect = canvas.getBoundingClientRect();
    var px = (cx - rect.left - offsetX) / scale - state.shake.x;
    var py = (cy - rect.top - offsetY) / scale - state.shake.y;
    return { x: px, y: py };
  }

  function bindCanvasClick() {
    canvas.addEventListener("click", function (e) {
      if (phase !== "playing") return;
      var p = canvasToLogical(e.clientX, e.clientY);
      handleWhackAt(p.x, p.y);
    });
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        var p = canvasToLogical(t.clientX, t.clientY);
        handleWhackAt(p.x, p.y);
        e.preventDefault();
      }
    }, { passive: false });
  }

  function bindPowerupSlots() {
    if (!dom.slots || !dom.slots.length) return;
    for (var i = 0; i < dom.slots.length; i++) {
      (function (idx) {
        var slot = dom.slots[idx];
        slot.addEventListener("click", function () { activatePowerup(idx); });
        slot.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activatePowerup(idx);
          }
        });
      })(i);
    }
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing") {
      prevPhase = "playing";
      phase = "paused";
      pauseMusic();
      showScreen("pause");
    } else if (phase === "paused") {
      phase = "playing";
      showScreen(null);
      resumeMusic();
    }
  }

  // -- UI bindings -----------------------------------------------------------
  function bindUi() {
    dom.startBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.resumeBtn.addEventListener("click", togglePause);
    dom.restartBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.pauseExitBtn.addEventListener("click", exitToArcade);
    dom.exitBtn.addEventListener("click", exitToArcade);
    dom.pauseBtn.addEventListener("click", togglePause);
    dom.setupBtn.addEventListener("click", function () {
      clearSnapshot();
      phase = "setup";
      stopMusic();
      showScreen("setup");
      renderSetupExtras();
    });
    dom.againBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.questionCloseBtn.addEventListener("click", skipQuestion);
    dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) stopMusic();
      else if (phase === "playing") startMusic();
    });
    dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      } catch (e) {}
    });
  }

  function exitToArcade() {
    stopMusic();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  var runStartTs = 0;

  function newRun() {
    lastBonusLifeThreshold = 0;
    initState({});
    showScreen(null);
    phase = "playing";
    runStartTs = Date.now();
    startMusic();
    updateHud();
    recordPlayWithProfile(0);
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    lastBonusLifeThreshold = Math.floor((s.score || 0) / 10000) * 10000;
    initState({
      score: s.score || 0,
      level: s.level || 1,
      lives: s.lives != null ? s.lives : LIVES_INIT,
      rumorsHit: s.rumorsHit || 0,
      maxCombo: s.maxCombo || 0,
      best: readBest()
    });
    showScreen(null);
    phase = "playing";
    runStartTs = Date.now();
    startMusic();
    updateHud();
    recordPlayWithProfile(0);
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.rumorsHit) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Level ' + (snap.state.level || 1) +
        ' &middot; Rumors ' + (snap.state.rumorsHit || 0) + '</div>' +
        '<div class="resume-actions">' +
          '<button class="btn glass-pill" id="resumeRunBtn">Resume Run</button>' +
          '<button class="btn glass-pill" id="discardRunBtn">New Run</button>' +
        '</div>';
      var rb = $("resumeRunBtn");
      if (rb) rb.addEventListener("click", function () { resumeRun(snap); });
      var db = $("discardRunBtn");
      if (db) db.addEventListener("click", function () { clearSnapshot(); newRun(); });
    } else if (dom.resumeCard) {
      dom.resumeCard.hidden = true;
      dom.resumeCard.innerHTML = "";
    }
    if (dom.leaderboardPanel && window.MrMacsLeaderboards && window.MrMacsLeaderboards.top) {
      try {
        var top = window.MrMacsLeaderboards.top(GAME_ID, 5);
        if (top && top.length) {
          var html = '<div class="leaderboard-title">Top 5 Rumor Whack Scores</div>';
          for (var r = 0; r < top.length; r++) {
            html += '<div class="leaderboard-row"><span class="lb-rank">' + (r + 1) + '</span>' +
              '<span class="lb-name">' + escapeHtml(top[r].name || "Unknown") + '</span>' +
              '<span class="lb-score">' + formatNumber(top[r].score) + '</span></div>';
          }
          dom.leaderboardPanel.hidden = false;
          dom.leaderboardPanel.innerHTML = html;
        } else {
          dom.leaderboardPanel.hidden = true;
        }
      } catch (e) {
        dom.leaderboardPanel.hidden = true;
      }
    }
  }

  // -- Main loop -------------------------------------------------------------
  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    if (state) {
      if (phase === "playing") {
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
        tick(dt);
      } else if (phase === "roundEnd") {
        // Just keep ticking particles + callouts during transition
        updateParticles(dt);
        updateCrosshairs(dt);
        updateShake(dt);
        for (var c = state.callouts.length - 1; c >= 0; c--) {
          var co = state.callouts[c];
          co.life -= dt;
          co.y -= 36 * dt;
          if (co.life <= 0) state.callouts.splice(c, 1);
        }
      }
    }
    if (state) render();
    if (phase === "playing" || phase === "paused" || phase === "roundEnd") {
      updateHud();
    }
    rafHandle = requestAnimationFrame(loop);
  }

  // -- Boot ------------------------------------------------------------------
  function boot() {
    setupDom();
    initState({});
    resize();
    window.addEventListener("resize", resize, { passive: true });
    bindInput();
    bindUi();
    showScreen("setup");
    renderSetupExtras();
    rafHandle = requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("pagehide", function () {
    if (state && phase === "playing") {
      saveSnapshot();
      // Record play with duration on page hide
      try { recordPlayWithProfile(Date.now() - runStartTs); } catch (e) {}
    }
  });
})();
