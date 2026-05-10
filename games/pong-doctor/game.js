/* ===========================================================================
   Pong Doctor — Pong with physics modifiers + 5 AI tiers · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x600 logical · Editorial duel arena
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "pong-doctor";
  var GAME_TITLE = "Pong Doctor";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 600;

  // Court inset (HUD/marquee bands)
  var COURT_TOP = 110;
  var COURT_BOTTOM = LOGICAL_H - 30;
  var COURT_LEFT = 0;
  var COURT_RIGHT = LOGICAL_W;
  var NET_X = LOGICAL_W / 2;

  // Paddle dimensions
  var PADDLE_W = 14;
  var PADDLE_H_NORMAL = 80;
  var PADDLE_H_WIDE = 120;
  var PADDLE_H_SHRINK = 50;
  var PADDLE_X_PLAYER = 30;
  var PADDLE_X_AI = LOGICAL_W - 30 - PADDLE_W;
  var PADDLE_SPEED_BASE = 460;       // px/sec — player speed cap
  var PADDLE_SPEED_FAST = 920;       // px/sec — speed-paddle powerup

  // Ball physics
  var BALL_R = 8;
  var BALL_SPEED_INIT = 360;         // px/sec
  var BALL_SPEED_INC = 18;           // per paddle hit
  var BALL_SPEED_MAX = 760;
  var BALL_SPIN_MAX = 0.55;          // curveball spin coefficient (px/sec^2 lateral)
  var BALL_TRAIL_LEN = 14;

  // Match + round structure
  var POINTS_TO_WIN = 11;
  var MATCH_BEST_OF = 3;             // first to 2 of 3 = match (best of 3)
  var LIVES_INIT = 3;                // 3 match losses = game over
  var SCHOLAR_RALLY_INTERVAL = 5;    // every 5th rally a scholar ball appears
  var POWERUP_RALLY_STREAK = 5;      // power-up drop on 5-rally player win streak

  // Scoring (run total)
  var POINT_WIN_PTS = 100;
  var MATCH_WIN_PTS = 800;
  var ROUND_WIN_PTS = 2500;
  var SCHOLAR_BONUS_PTS = 1500;
  var SCHOLAR_SHARDS = 12;
  var SHARDS_CAP = 200;

  // AI tier names + ladder
  var TIERS = ["easy", "normal", "hard", "expert", "nightmare"];
  var TIER_META = {
    easy:      { label: "Easy",      color: "#6dc18f", reactionMs: 320, predictAccuracy: 0.45, paddleSpeed: 280, jitter: 70  },
    normal:    { label: "Normal",    color: "#5de0f0", reactionMs: 220, predictAccuracy: 0.62, paddleSpeed: 360, jitter: 50  },
    hard:      { label: "Hard",      color: "#f5c451", reactionMs: 140, predictAccuracy: 0.78, paddleSpeed: 440, jitter: 30  },
    expert:    { label: "Expert",    color: "#f07060", reactionMs:  80, predictAccuracy: 0.90, paddleSpeed: 540, jitter: 16  },
    nightmare: { label: "Nightmare", color: "#a991ff", reactionMs:  35, predictAccuracy: 0.98, paddleSpeed: 660, jitter:  6  }
  };

  // Physics modifier rotation order
  var MODS = ["standard", "curveball", "power", "multiball", "wide", "shrink", "blocks"];
  var MOD_META = {
    standard:  { label: "Standard",       desc: "Classic rules — pure pong", color: "#5de0f0" },
    curveball: { label: "Curveball",      desc: "Spin from paddle angle",     color: "#a991ff" },
    power:     { label: "Power Shot",     desc: "Every 3rd hit speeds 1.5x",  color: "#f07060" },
    multiball: { label: "Multiball",      desc: "Two balls in play",          color: "#f5c451" },
    wide:      { label: "Wide Paddles",   desc: "Both paddles 1.5x tall",     color: "#6dc18f" },
    shrink:    { label: "Shrink Paddles", desc: "Both paddles smaller",       color: "#d8483a" },
    blocks:    { label: "Block Field",    desc: "3 destructible center blocks", color: "#f0d068" }
  };

  // Power-up types
  var POWERUP_TYPES = ["speed", "wide", "reverse", "x2", "trick"];
  var POWERUP_META = {
    speed:   { glyph: "⚡", label: "SPEED",   color: "#5de0f0", desc: "2x paddle speed for 8s" },
    wide:    { glyph: "🛡", label: "WIDE",    color: "#6dc18f", desc: "Wider paddle for 8s" },
    reverse: { glyph: "🔄", label: "REVERSE", color: "#a991ff", desc: "Next ball curves opposite" },
    x2:      { glyph: "⭐", label: "x2",      color: "#f5c451", desc: "2x score on next point" },
    trick:   { glyph: "💥", label: "TRICK",   color: "#f07060", desc: "Next ball — chaos curve" }
  };
  var POWERUP_DURATION_S = 8.0;

  // -- Inline review bank (28 entries — history/science/geography/art/music/math/language)
  var QUESTIONS = [
    { q: "Which river runs through Cairo?", choices: ["Nile", "Tigris", "Danube", "Niger"], correct: 0, hint: "Longest in Africa." },
    { q: "Who painted the Sistine Chapel ceiling?", choices: ["Raphael", "Michelangelo", "Donatello", "Bernini"], correct: 1, hint: "1508–1512, Vatican." },
    { q: "What is the chemical symbol for gold?", choices: ["Go", "Gd", "Au", "Ag"], correct: 2, hint: "From Latin aurum." },
    { q: "What is 7 × 8?", choices: ["54", "56", "58", "64"], correct: 1, hint: "A common multiplication checkpoint." },
    { q: "Who wrote 'Romeo and Juliet'?", choices: ["Marlowe", "Shakespeare", "Chaucer", "Jonson"], correct: 1, hint: "First Folio author." },
    { q: "Which planet is known as the Red Planet?", choices: ["Venus", "Mars", "Jupiter", "Mercury"], correct: 1, hint: "Iron oxide gives the color." },
    { q: "Who composed the Fifth Symphony with the 'da-da-da-DUM' motif?", choices: ["Mozart", "Bach", "Beethoven", "Brahms"], correct: 2, hint: "1808 premiere." },
    { q: "Which year did the Berlin Wall fall?", choices: ["1989", "1991", "1985", "1979"], correct: 0, hint: "Late Cold War turning point." },
    { q: "What is the past tense of 'sing'?", choices: ["singed", "sang", "sung", "singd"], correct: 1, hint: "Strong verb pattern: sing/sang/sung." },
    { q: "Which gas do plants absorb during photosynthesis?", choices: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2, hint: "CO₂ in, O₂ out." },
    { q: "Who painted 'The Starry Night'?", choices: ["Monet", "Van Gogh", "Picasso", "Dali"], correct: 1, hint: "Saint-Rémy asylum, 1889." },
    { q: "What is the area of a triangle with base 10 and height 6?", choices: ["60", "30", "16", "120"], correct: 1, hint: "½ × b × h." },
    { q: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Constitution", "Bill of Rights", "Declaration of Independence", "Federalist 10"], correct: 2, hint: "Drafted by Jefferson, 1776." },
    { q: "What is the capital of Australia?", choices: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2, hint: "Not the biggest city — the planned one." },
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
    { q: "What is 15% of 80?", choices: ["8", "10", "12", "15"], correct: 2, hint: "10% = 8, 5% = 4, sum = 12." }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | serving | playing | question | paused | ended | matchEnd | roundEnd
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var hitPauseTimer = 0;

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
    paddle_hit: function () { sfxTone(540, 0.06, { type: "square", volume: 0.12, endFreq: 360 }); },
    wall_bounce: function () { sfxTone(280, 0.05, { type: "triangle", volume: 0.10, endFreq: 240 }); },
    point: function () { sfxTone(220, 0.16, { type: "sawtooth", volume: 0.14, endFreq: 90 }); },
    scholar_appear: function () {
      [660, 880, 1175].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.08, { type: "triangle", volume: 0.13 }); }, i * 60);
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
    match_won: function () {
      [523, 659, 784, 988, 1175].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    match_lost: function () {
      sfxNoise(0.30, { volume: 0.18, cutoff: 700 });
      sfxTone(220, 0.45, { type: "sawtooth", volume: 0.14, endFreq: 80 });
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
    ball_speed_up: function () {
      sfxTone(440, 0.08, { type: "sawtooth", volume: 0.10, endFreq: 880 });
    },
    block_break: function () {
      sfxNoise(0.10, { volume: 0.14, cutoff: 1400 });
      sfxTone(640, 0.07, { type: "square", volume: 0.10, endFreq: 220 });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("pongCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudMatches = $("hudMatches");
    dom.hudDuel = $("hudDuel");
    dom.hudRallies = $("hudRallies");
    dom.hudBest = $("hudBest");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
    dom.brandSub = $("brandSub");
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
    dom.tierFilter = $("tierFilter");
    dom.modFilter = $("modFilter");
    dom.slots = dom.powerupDock ? dom.powerupDock.querySelectorAll(".powerup-slot") : [];
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var startTier = opts.tier || (dom.tierFilter && dom.tierFilter.value) || "easy";
    var startMod = opts.mod || (dom.modFilter && dom.modFilter.value) || "standard";
    state = {
      // run-level
      tier: startTier,
      tierIdx: TIERS.indexOf(startTier),
      mod: startMod,
      modIdx: MODS.indexOf(startMod),
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      matchesWon: opts.matchesWon || 0,
      matchesLost: opts.matchesLost || 0,

      // current match
      pPoints: 0,
      aPoints: 0,
      pMatchWins: 0,
      aMatchWins: 0,
      rallyCount: opts.rallyCount || 0,
      rallyStreak: 0,

      // physics objects
      paddleP: makePaddle("player"),
      paddleA: makePaddle("ai"),
      balls: [],
      blocks: [],

      // serve state
      serveSide: 1, // +1 toward AI, -1 toward player
      serveTimer: 0,

      // power-ups (dropped in court — picked by player paddle area)
      drops: [],
      inventory: [null, null, null],
      activePowerups: {
        speed:   { active: false, timer: 0 },
        wide:    { active: false, timer: 0 },
        reverse: { active: false },
        x2:      { active: false },
        trick:   { active: false }
      },

      // AI runtime
      aiTarget: LOGICAL_H / 2,
      aiTargetTimer: 0,

      // FX
      particles: [],
      callouts: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },

      // stats
      time: 0,
      runTime: 0,
      pointsWon: opts.pointsWon || 0,
      pointsLost: opts.pointsLost || 0,
      maxRally: opts.maxRally || 0,
      scholarsCorrect: opts.scholarsCorrect || 0,
      scholarsTotal: opts.scholarsTotal || 0,
      scholarsAppeared: opts.scholarsAppeared || 0,
      powerupsUsed: opts.powerupsUsed || 0,
      blocksBusted: opts.blocksBusted || 0,
      shardsAwarded: opts.shardsAwarded || 0,

      // bg
      bgFlecks: opts.bgFlecks || generateFlecks(),
      best: opts.best != null ? opts.best : readBest(),
      endReason: ""
    };
    rebuildBlocks();
    applyModifierGeometry();
    serveBall(state.serveSide, true);
  }

  function makePaddle(owner) {
    return {
      owner: owner,
      x: owner === "player" ? PADDLE_X_PLAYER : PADDLE_X_AI,
      y: LOGICAL_H / 2 - PADDLE_H_NORMAL / 2,
      w: PADDLE_W,
      h: PADDLE_H_NORMAL,
      vy: 0,
      hits: 0
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

  // -- Modifier geometry (paddle heights, blocks) ----------------------------
  function applyModifierGeometry() {
    var hPlayer = PADDLE_H_NORMAL;
    var hAi = PADDLE_H_NORMAL;
    if (state.mod === "wide") {
      hPlayer = PADDLE_H_WIDE;
      hAi = PADDLE_H_WIDE;
    } else if (state.mod === "shrink") {
      hPlayer = PADDLE_H_SHRINK;
      hAi = PADDLE_H_SHRINK;
    }
    // wide power-up overrides shrink/standard for the player only
    if (state.activePowerups.wide.active) {
      hPlayer = PADDLE_H_WIDE;
    }
    state.paddleP.h = hPlayer;
    state.paddleA.h = hAi;
    // clamp y so paddles aren't off-court
    state.paddleP.y = clamp(state.paddleP.y, COURT_TOP + 4, COURT_BOTTOM - 4 - hPlayer);
    state.paddleA.y = clamp(state.paddleA.y, COURT_TOP + 4, COURT_BOTTOM - 4 - hAi);
  }

  function rebuildBlocks() {
    state.blocks = [];
    if (state.mod !== "blocks") return;
    var bw = 28, bh = 60;
    var cx = NET_X;
    var cy = (COURT_TOP + COURT_BOTTOM) / 2;
    for (var i = 0; i < 3; i++) {
      state.blocks.push({
        x: cx - bw / 2,
        y: cy - bh * 1.5 + i * (bh + 6) - 6,
        w: bw,
        h: bh,
        hp: 1,
        flash: 0
      });
    }
  }

  // -- Ball helpers ----------------------------------------------------------
  function makeBall(opts) {
    opts = opts || {};
    return {
      x: opts.x != null ? opts.x : NET_X,
      y: opts.y != null ? opts.y : (COURT_TOP + COURT_BOTTOM) / 2,
      vx: opts.vx != null ? opts.vx : BALL_SPEED_INIT,
      vy: opts.vy != null ? opts.vy : (Math.random() - 0.5) * 200,
      r: BALL_R,
      speed: opts.speed != null ? opts.speed : BALL_SPEED_INIT,
      spin: 0,
      hitCount: 0,
      tag: opts.tag || "main",
      isScholar: !!opts.isScholar,
      isTrick: !!opts.isTrick,
      curveDir: opts.curveDir != null ? opts.curveDir : 1, // +1 normal, -1 reversed
      trail: [],
      lastHitter: null
    };
  }

  function serveBall(direction, suppressSfx) {
    state.balls = [];
    var b1 = makeBall({
      x: NET_X,
      y: (COURT_TOP + COURT_BOTTOM) / 2,
      vx: direction * BALL_SPEED_INIT,
      vy: (Math.random() - 0.5) * 240,
      speed: BALL_SPEED_INIT,
      isScholar: shouldSpawnScholarThisRally()
    });
    if (state.activePowerups.trick.active) {
      b1.isTrick = true;
      b1.spin = (Math.random() - 0.5) * BALL_SPIN_MAX * 1.6;
      state.activePowerups.trick.active = false;
    }
    if (state.activePowerups.reverse.active) {
      b1.curveDir = -1;
      state.activePowerups.reverse.active = false;
    }
    state.balls.push(b1);
    if (state.mod === "multiball") {
      var dir2 = direction * (Math.random() < 0.5 ? 1 : -1);
      // Clamp spawn y so second ball always starts inside court
      var courtMid = (COURT_TOP + COURT_BOTTOM) / 2;
      var b2Y = clamp(
        courtMid + (Math.random() < 0.5 ? -50 : 50),
        COURT_TOP + BALL_R + 6,
        COURT_BOTTOM - BALL_R - 6
      );
      var b2 = makeBall({
        x: NET_X,
        y: b2Y,
        vx: dir2 * BALL_SPEED_INIT * 0.92,
        vy: (Math.random() - 0.5) * 220,
        speed: BALL_SPEED_INIT * 0.92,
        tag: "second"
      });
      state.balls.push(b2);
    }
    // Brief serve pause to let players see the spawn
    state.serveTimer = 0.55;
    phase = "serving";
    if (!suppressSfx) {
      // soft cue
      sfxTone(620, 0.06, { type: "triangle", volume: 0.10 });
    }
    if (b1.isScholar) {
      state.scholarsAppeared++;
      sfx.scholar_appear();
      pushCallout("SCHOLAR BALL!", LOGICAL_W / 2, COURT_TOP + 30, "is-bonus");
    }
  }

  function shouldSpawnScholarThisRally() {
    // Every 5th rally → scholar
    return ((state.rallyCount + 1) % SCHOLAR_RALLY_INTERVAL) === 0;
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  // -- Update loop -----------------------------------------------------------
  function tick(dt) {
    if (hitPauseTimer > 0) {
      hitPauseTimer -= dt;
      if (hitPauseTimer < 0) hitPauseTimer = 0;
      return;
    }
    state.time += dt;
    state.runTime += dt;

    // Serve countdown
    if (phase === "serving") {
      state.serveTimer -= dt;
      if (state.serveTimer <= 0) {
        phase = "playing";
      }
    }

    // Update paddles
    updatePlayerPaddle(dt);
    updateAiPaddle(dt);

    if (phase === "playing") {
      // Update balls
      for (var i = state.balls.length - 1; i >= 0; i--) {
        var b = state.balls[i];
        updateBall(b, dt);
        // Trail
        if (!reducedMotion) {
          b.trail.push({ x: b.x, y: b.y, life: 1.0 });
          if (b.trail.length > BALL_TRAIL_LEN) b.trail.shift();
          for (var t = 0; t < b.trail.length; t++) b.trail[t].life -= dt * 4;
        }
      }
    }

    // Power-up timers
    var ap = state.activePowerups;
    if (ap.speed.active) {
      ap.speed.timer -= dt;
      if (ap.speed.timer <= 0) { ap.speed.active = false; ap.speed.timer = 0; }
    }
    if (ap.wide.active) {
      ap.wide.timer -= dt;
      if (ap.wide.timer <= 0) {
        ap.wide.active = false;
        ap.wide.timer = 0;
        applyModifierGeometry();
      }
    }

    // Drops (power-up icons floating in court)
    for (var d = state.drops.length - 1; d >= 0; d--) {
      var drop = state.drops[d];
      drop.y += drop.vy * dt;
      drop.life -= dt;
      drop.bob = (drop.bob || 0) + dt * 4;
      // pickup by player paddle box
      var paddle = state.paddleP;
      if (drop.x + drop.r > paddle.x &&
          drop.x - drop.r < paddle.x + paddle.w &&
          drop.y + drop.r > paddle.y &&
          drop.y - drop.r < paddle.y + paddle.h) {
        if (addPowerupToInventory(drop.kind)) {
          burstAt(drop.x, drop.y, POWERUP_META[drop.kind].color, 14);
          sfx.powerup_pickup();
          pushCallout("+" + POWERUP_META[drop.kind].label, drop.x, drop.y - 18, "is-bonus");
        }
        state.drops.splice(d, 1);
        continue;
      }
      // expire
      if (drop.life <= 0 || drop.y > COURT_BOTTOM + 40) {
        state.drops.splice(d, 1);
      }
    }

    // FX decay
    updateParticles(dt);
    updateShake(dt);
    for (var c = state.callouts.length - 1; c >= 0; c--) {
      var co = state.callouts[c];
      co.life -= dt;
      co.y -= 32 * dt;
      if (co.life <= 0) state.callouts.splice(c, 1);
    }

    // Block flashes
    for (var k = 0; k < state.blocks.length; k++) {
      if (state.blocks[k].flash > 0) state.blocks[k].flash -= dt;
    }
  }

  function updatePlayerPaddle(dt) {
    var p = state.paddleP;
    var spd = playerSpeedCap();
    // Keyboard direction overrides mouse if pressed
    var wantY = null;
    if (input.keyUp) wantY = -1;
    else if (input.keyDown) wantY = 1;

    if (wantY !== null) {
      p.vy = wantY * spd;
    } else if (input.mouseY != null) {
      // glide toward mouse Y
      var target = input.mouseY - p.h / 2;
      var diff = target - p.y;
      var maxStep = spd * dt;
      if (Math.abs(diff) <= maxStep) {
        p.y = target;
        p.vy = 0;
      } else {
        var dy = Math.sign(diff) * maxStep;
        p.y += dy;
        p.vy = dy / dt;
      }
      // clamp + skip below since we already moved
      p.y = clamp(p.y, COURT_TOP + 4, COURT_BOTTOM - 4 - p.h);
      return;
    } else {
      p.vy = 0;
    }
    p.y += p.vy * dt;
    p.y = clamp(p.y, COURT_TOP + 4, COURT_BOTTOM - 4 - p.h);
  }

  function playerSpeedCap() {
    return state.activePowerups.speed.active ? PADDLE_SPEED_FAST : PADDLE_SPEED_BASE;
  }

  function updateAiPaddle(dt) {
    var meta = TIER_META[state.tier];
    var p = state.paddleA;
    // Pick the ball that is moving toward AI (vx > 0); fall back to nearest x
    var target = null;
    var bestX = -Infinity;
    for (var i = 0; i < state.balls.length; i++) {
      var b = state.balls[i];
      if (b.vx > 0 && b.x > bestX) { target = b; bestX = b.x; }
    }
    if (!target) {
      // Drift toward center
      var center = (COURT_TOP + COURT_BOTTOM) / 2 - p.h / 2;
      var diff = center - p.y;
      var step = Math.sign(diff) * Math.min(Math.abs(diff), meta.paddleSpeed * dt * 0.5);
      p.y += step;
      p.y = clamp(p.y, COURT_TOP + 4, COURT_BOTTOM - 4 - p.h);
      return;
    }

    // Refresh target prediction at reaction interval
    state.aiTargetTimer -= dt;
    if (state.aiTargetTimer <= 0) {
      var predicted = predictBallY(target, p.x);
      // Inject inaccuracy: a wider spread on lower tiers
      var spread = meta.jitter / Math.max(0.0001, meta.predictAccuracy);
      var noise = (Math.random() * 2 - 1) * spread * (1 - meta.predictAccuracy);
      state.aiTarget = predicted + noise;
      state.aiTargetTimer = meta.reactionMs / 1000;
    }

    var desired = state.aiTarget - p.h / 2;
    var diff2 = desired - p.y;
    var maxStep = meta.paddleSpeed * dt;
    if (Math.abs(diff2) <= maxStep) p.y = desired;
    else p.y += Math.sign(diff2) * maxStep;
    p.y = clamp(p.y, COURT_TOP + 4, COURT_BOTTOM - 4 - p.h);
  }

  function predictBallY(ball, targetX) {
    // Simulate forward ignoring spin / blocks (cheap forecast)
    var x = ball.x;
    var y = ball.y;
    var vx = ball.vx;
    var vy = ball.vy;
    var top = COURT_TOP + ball.r;
    var bot = COURT_BOTTOM - ball.r;
    if (vx === 0) return y;
    var maxIter = 600;
    var step = 1 / 360; // ~one frame
    while (((vx > 0 && x < targetX) || (vx < 0 && x > targetX)) && maxIter-- > 0) {
      x += vx * step;
      y += vy * step;
      if (y < top) { y = top + (top - y); vy = -vy; }
      if (y > bot) { y = bot - (y - bot); vy = -vy; }
    }
    return y;
  }

  function updateBall(b, dt) {
    // Apply spin (curveball)
    if (state.mod === "curveball" && b.spin !== 0) {
      // Curve adjusts vy over time scaled by curveDir (reverse-curve flips)
      b.vy += b.spin * b.curveDir * dt * 200;
      // Clamp vy to prevent unbounded spin flicker at high speeds
      b.vy = clamp(b.vy, -b.speed * 0.92, b.speed * 0.92);
    }
    if (b.isTrick) {
      // Trick shot — chaotic curves
      b.spin += (Math.random() - 0.5) * 0.6 * dt;
      b.spin = clamp(b.spin, -BALL_SPIN_MAX * 1.8, BALL_SPIN_MAX * 1.8);
      b.vy += b.spin * b.curveDir * dt * 280;
      b.vy = clamp(b.vy, -b.speed * 0.92, b.speed * 0.92);
    }
    // Move
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Wall bounces (top/bottom)
    if (b.y - b.r < COURT_TOP) {
      b.y = COURT_TOP + b.r;
      b.vy = Math.abs(b.vy);
      sfx.wall_bounce();
      addShake(1.4, 0.06);
    } else if (b.y + b.r > COURT_BOTTOM) {
      b.y = COURT_BOTTOM - b.r;
      b.vy = -Math.abs(b.vy);
      sfx.wall_bounce();
      addShake(1.4, 0.06);
    }

    // Block field collision
    if (state.mod === "blocks" && state.blocks.length) {
      handleBlockCollision(b);
    }

    // Paddle collisions
    var pp = state.paddleP;
    var pa = state.paddleA;
    // Player paddle (left)
    if (b.vx < 0 &&
        b.x - b.r <= pp.x + pp.w &&
        b.x - b.r > pp.x - 6 &&
        b.y + b.r >= pp.y &&
        b.y - b.r <= pp.y + pp.h) {
      onPaddleHit(b, pp, +1);
    }
    // AI paddle (right)
    if (b.vx > 0 &&
        b.x + b.r >= pa.x &&
        b.x + b.r < pa.x + pa.w + 6 &&
        b.y + b.r >= pa.y &&
        b.y - b.r <= pa.y + pa.h) {
      onPaddleHit(b, pa, -1);
    }

    // Out of court (point)
    if (b.x + b.r < COURT_LEFT - 10) {
      // AI scored
      onPointScored("ai", b);
      removeBall(b);
    } else if (b.x - b.r > COURT_RIGHT + 10) {
      // Player scored
      onPointScored("player", b);
      removeBall(b);
    }
  }

  function handleBlockCollision(b) {
    for (var i = 0; i < state.blocks.length; i++) {
      var blk = state.blocks[i];
      if (blk.hp <= 0) continue;
      if (b.x + b.r > blk.x &&
          b.x - b.r < blk.x + blk.w &&
          b.y + b.r > blk.y &&
          b.y - b.r < blk.y + blk.h) {
        // Determine bounce side (closest face)
        var dxL = Math.abs((b.x + b.r) - blk.x);
        var dxR = Math.abs((blk.x + blk.w) - (b.x - b.r));
        var dyT = Math.abs((b.y + b.r) - blk.y);
        var dyB = Math.abs((blk.y + blk.h) - (b.y - b.r));
        var min = Math.min(dxL, dxR, dyT, dyB);
        if (min === dxL) { b.x = blk.x - b.r; b.vx = -Math.abs(b.vx); }
        else if (min === dxR) { b.x = blk.x + blk.w + b.r; b.vx = Math.abs(b.vx); }
        else if (min === dyT) { b.y = blk.y - b.r; b.vy = -Math.abs(b.vy); }
        else { b.y = blk.y + blk.h + b.r; b.vy = Math.abs(b.vy); }
        blk.hp--;
        blk.flash = 0.30;
        if (blk.hp <= 0) {
          burstAt(blk.x + blk.w / 2, blk.y + blk.h / 2, "#f0d068", 18);
          state.blocksBusted++;
          sfx.block_break();
        } else {
          burstAt(blk.x + blk.w / 2, blk.y + blk.h / 2, "#a0a8b8", 8);
        }
        addShake(2, 0.10);
        break;
      }
    }
  }

  function onPaddleHit(b, paddle, dirSign) {
    // Snap ball just outside paddle face to avoid sticking
    if (dirSign === +1) {
      b.x = paddle.x + paddle.w + b.r + 0.2;
    } else {
      b.x = paddle.x - b.r - 0.2;
    }
    // Compute bounce angle from offset on paddle
    var hitOffset = (b.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2); // -1..+1
    hitOffset = clamp(hitOffset, -1, 1);
    var maxAngle = Math.PI / 3.2; // ~56°
    var angle = hitOffset * maxAngle;
    b.hitCount++;
    paddle.hits = (paddle.hits || 0) + 1;
    b.lastHitter = paddle.owner;

    // Speed up
    var speed = b.speed + BALL_SPEED_INC;
    // Power-shot mod: every 3rd hit speeds 1.5x
    if (state.mod === "power" && (b.hitCount % 3 === 0)) {
      speed = Math.min(BALL_SPEED_MAX, speed * 1.5);
      sfx.ball_speed_up();
      pushCallout("POWER SHOT!", b.x, b.y - 24, "is-bonus");
    } else {
      speed = Math.min(BALL_SPEED_MAX, speed);
    }
    b.speed = speed;
    b.vx = Math.cos(angle) * speed * dirSign;
    b.vy = Math.sin(angle) * speed;

    // Curveball spin: derived from paddle motion + offset
    if (state.mod === "curveball") {
      b.spin = clamp((paddle.vy || 0) / 600 + hitOffset * 0.20, -BALL_SPIN_MAX, BALL_SPIN_MAX);
    }

    sfx.paddle_hit();
    burstAt(b.x, b.y, paddle.owner === "player" ? "#5de0f0" : "#f07060", 8);
    addShake(1.8, 0.08);
  }

  function removeBall(b) {
    var idx = state.balls.indexOf(b);
    if (idx >= 0) state.balls.splice(idx, 1);
  }

  function onPointScored(winner, b) {
    var pCenter = b.x;
    var pY = b.y;
    if (state.balls.length > 1) {
      // Multiball: only end the rally when ALL balls are out — track score, but
      // don't reset rally yet.
      if (winner === "player") state.pPoints++;
      else state.aPoints++;
      pushCallout(winner === "player" ? "+1 YOU" : "+1 AI", pCenter, pY, winner === "player" ? "is-good" : "is-warn");
      sfx.point();
      return;
    }
    // Last ball → resolve the rally
    state.rallyCount++;
    if (state.rallyCount > state.maxRally) state.maxRally = state.rallyCount;
    var wasScholar = b.isScholar;
    var x2 = state.activePowerups.x2.active;

    if (winner === "player") {
      var pts = POINT_WIN_PTS;
      if (x2) { pts *= 2; state.activePowerups.x2.active = false; }
      state.pPoints++;
      state.score += pts;
      state.pointsWon++;
      state.rallyStreak++;
      pushCallout("+" + pts, pCenter, pY - 20, "is-score-good");
      sfx.point();
      // Power-up drop on streak
      if (state.rallyStreak >= POWERUP_RALLY_STREAK) {
        state.rallyStreak = 0;
        spawnPowerupDrop();
      }
    } else {
      state.aPoints++;
      state.pointsLost++;
      state.rallyStreak = 0;
      pushCallout("AI POINT", pCenter, pY - 20, "is-warn");
      sfx.point();
    }

    // Match end check
    if (state.pPoints >= POINTS_TO_WIN || state.aPoints >= POINTS_TO_WIN) {
      onMatchEnd(state.pPoints > state.aPoints ? "player" : "ai");
      return;
    }

    // Scholar bonus path — open the review modal BEFORE next serve
    // (only when player won the scholar point; loss is silent).
    if (wasScholar && winner === "player") {
      openScholarQuestion();
      return; // closeQuestion / skipQuestion will serve the next ball.
    }

    // Otherwise serve next
    var dir = winner === "player" ? +1 : -1;
    serveBall(dir, false);
  }

  function onMatchEnd(winner) {
    if (winner === "player") {
      state.pMatchWins++;
      state.score += MATCH_WIN_PTS;
      pushCallout("MATCH!", LOGICAL_W / 2, COURT_TOP + 30, "is-tetris");
      sfx.match_won();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 36, palette: ["#5de0f0", "#f5c451", "#a991ff"] });
        }
      } catch (e) {}
      // Best-of-3 round won?
      if (state.pMatchWins >= Math.ceil(MATCH_BEST_OF / 2)) {
        state.matchesWon++;
        state.score += ROUND_WIN_PTS;
        pushCallout("ROUND CLEARED!", LOGICAL_W / 2, COURT_TOP + 60, "is-legend");
        // Advance modifier (rotate) and tier
        advanceStage();
        resetMatchScoreboard(true);
      } else {
        // Just clear the inner match score and continue
        resetMatchScoreboard(false);
      }
    } else {
      state.aMatchWins++;
      sfx.match_lost();
      pushCallout("MATCH LOST", LOGICAL_W / 2, COURT_TOP + 30, "is-warn");
      // Best-of-3 round lost?
      if (state.aMatchWins >= Math.ceil(MATCH_BEST_OF / 2)) {
        state.matchesLost++;
        state.lives--;
        sfx.life_lost();
        pushCallout("-1 LIFE", LOGICAL_W / 2, COURT_TOP + 60, "is-warn");
        if (state.lives <= 0) {
          gameOver();
          return;
        }
        // reset match scoreboard
        resetMatchScoreboard(true);
      } else {
        resetMatchScoreboard(false);
      }
    }
    saveSnapshot();
    // Wait a beat then serve the next match
    phase = "matchEnd";
    setTimeout(function () {
      if (phase !== "matchEnd") return;
      phase = "serving";
      serveBall(state.pMatchWins + state.aMatchWins > 0 ? (Math.random() < 0.5 ? -1 : 1) : 1, false);
    }, 1400);
  }

  function resetMatchScoreboard(fullRoundReset) {
    state.pPoints = 0;
    state.aPoints = 0;
    if (fullRoundReset) {
      state.pMatchWins = 0;
      state.aMatchWins = 0;
    }
  }

  function advanceStage() {
    // Rotate modifier; bump tier if cycled back to "standard"
    state.modIdx = (state.modIdx + 1) % MODS.length;
    state.mod = MODS[state.modIdx];
    if (state.modIdx === 0 && state.tierIdx < TIERS.length - 1) {
      state.tierIdx++;
      state.tier = TIERS[state.tierIdx];
      pushCallout("AI TIER UP — " + TIER_META[state.tier].label.toUpperCase() + "!", LOGICAL_W / 2, COURT_TOP + 90, "is-legend");
    } else {
      pushCallout("MOD: " + MOD_META[state.mod].label.toUpperCase(), LOGICAL_W / 2, COURT_TOP + 90, "is-bonus");
    }
    rebuildBlocks();
    applyModifierGeometry();
  }

  // -- Power-ups -------------------------------------------------------------
  function spawnPowerupDrop() {
    var kind = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    var drop = {
      kind: kind,
      x: NET_X + (Math.random() - 0.5) * 200,
      y: COURT_TOP + 30,
      vy: 60 + Math.random() * 40,
      r: 14,
      life: 8.0,
      bob: 0
    };
    state.drops.push(drop);
    pushCallout("POWER-UP DROPPED!", drop.x, drop.y - 24, "is-bonus");
  }

  function addPowerupToInventory(kind) {
    for (var i = 0; i < state.inventory.length; i++) {
      if (state.inventory[i] === null) {
        state.inventory[i] = kind;
        return true;
      }
    }
    return false;
  }
  function activatePowerup(slotIdx) {
    if (phase !== "playing" && phase !== "serving") return;
    var kind = state.inventory[slotIdx];
    if (!kind) return;
    state.inventory[slotIdx] = null;
    state.powerupsUsed++;
    sfx.powerup_use();
    var ap = state.activePowerups;
    if (kind === "speed") {
      ap.speed.active = true;
      ap.speed.timer = POWERUP_DURATION_S;
      pushCallout("SPEED PADDLE!", LOGICAL_W / 2, COURT_TOP + 40, "is-bonus");
    } else if (kind === "wide") {
      ap.wide.active = true;
      ap.wide.timer = POWERUP_DURATION_S;
      applyModifierGeometry();
      pushCallout("WIDE PADDLE!", LOGICAL_W / 2, COURT_TOP + 40, "is-bonus");
    } else if (kind === "reverse") {
      ap.reverse.active = true;
      pushCallout("REVERSE CURVE ARMED!", LOGICAL_W / 2, COURT_TOP + 40, "is-bonus");
    } else if (kind === "x2") {
      ap.x2.active = true;
      pushCallout("x2 SCORE ARMED!", LOGICAL_W / 2, COURT_TOP + 40, "is-bonus");
    } else if (kind === "trick") {
      ap.trick.active = true;
      pushCallout("TRICK SHOT ARMED!", LOGICAL_W / 2, COURT_TOP + 40, "is-bonus");
    }
  }

  // -- Scholar review modal --------------------------------------------------
  var activeQuestion = null;
  function pickQuestion() {
    return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  }
  function openScholarQuestion() {
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Ball · Optional · +" + SCHOLAR_BONUS_PTS + " + " + SCHOLAR_SHARDS + " shards";
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
      addShards(SCHOLAR_SHARDS, GAME_ID + "-scholar-correct");
      sfx.scholar_correct();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushCallout("+" + SCHOLAR_BONUS_PTS + " SCHOLAR", LOGICAL_W / 2, COURT_TOP + 50, "is-bonus");
    } else {
      sfx.scholar_wrong();
      pushCallout("Not quite", LOGICAL_W / 2, COURT_TOP + 50, "is-warn");
    }
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
    // After a scholar resolution we may already be in a serving state — let it advance naturally.
    if (state.balls.length === 0) {
      // Need next serve (point already counted before the modal)
      serveBall(+1, false);
    }
  }
  function skipQuestion() {
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    if (state && state.balls.length === 0 && phase !== "ended") {
      serveBall(+1, false);
    }
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
    drawCourt();
    drawNet();
    drawBlocks();
    drawDrops();
    drawBallTrails();
    drawPaddles();
    drawBalls();
    drawParticles();
    drawCallouts();
    drawServeOverlay();

    ctx.restore();
  }

  function drawBackground() {
    // Letterbox void
    ctx.fillStyle = "#04060f";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    // Tier-tinted radial behind court
    var tierColor = TIER_META[state.tier].color;
    var cx = LOGICAL_W / 2, cy = LOGICAL_H / 2 + 20;
    var glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, 380);
    glow.addColorStop(0, hexA(tierColor, 0.10));
    glow.addColorStop(0.5, hexA(tierColor, 0.05));
    glow.addColorStop(1, "rgba(4,6,15,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Background flecks
    if (state.bgFlecks) {
      for (var i = 0; i < state.bgFlecks.length; i++) {
        var s = state.bgFlecks[i];
        var tw = reducedMotion ? 1 : (0.5 + 0.5 * Math.abs(Math.sin(state.time * s.twinkleSpeed + s.twinkle)));
        ctx.fillStyle = hexA(tierColor, 0.10 * tw);
        ctx.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
      }
    }
  }

  function drawCourt() {
    // Court frame
    var grad = ctx.createLinearGradient(0, COURT_TOP, 0, COURT_BOTTOM);
    grad.addColorStop(0, "#08111f");
    grad.addColorStop(0.5, "#122236");
    grad.addColorStop(1, "#08111f");
    ctx.fillStyle = grad;
    ctx.fillRect(COURT_LEFT, COURT_TOP, COURT_RIGHT - COURT_LEFT, COURT_BOTTOM - COURT_TOP);
    // Top + bottom rails
    ctx.fillStyle = "#5de0f0";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(COURT_LEFT, COURT_TOP - 2, COURT_RIGHT - COURT_LEFT, 2);
    ctx.fillRect(COURT_LEFT, COURT_BOTTOM, COURT_RIGHT - COURT_LEFT, 2);
    ctx.globalAlpha = 1;
    // Mid-line dashed net (handled in drawNet)
    // Player + AI side highlight
    var playerColor = "#5de0f0";
    var aiColor = TIER_META[state.tier].color;
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = playerColor;
    ctx.fillRect(COURT_LEFT, COURT_TOP, NET_X - COURT_LEFT, COURT_BOTTOM - COURT_TOP);
    ctx.fillStyle = aiColor;
    ctx.fillRect(NET_X, COURT_TOP, COURT_RIGHT - NET_X, COURT_BOTTOM - COURT_TOP);
    ctx.globalAlpha = 1;
    // Match scoreboard text on top of court
    ctx.save();
    ctx.font = "italic 900 48px Fraunces, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillText(state.pPoints + "  -  " + state.aPoints, NET_X, COURT_TOP + 6);
    ctx.restore();
  }

  function drawNet() {
    ctx.save();
    ctx.fillStyle = "rgba(245,196,81,0.45)";
    var dashH = 14, gap = 8;
    var y = COURT_TOP + 6;
    while (y < COURT_BOTTOM) {
      ctx.fillRect(NET_X - 2, y, 4, dashH);
      y += dashH + gap;
    }
    ctx.restore();
  }

  function drawBlocks() {
    if (state.mod !== "blocks") return;
    for (var i = 0; i < state.blocks.length; i++) {
      var blk = state.blocks[i];
      if (blk.hp <= 0) continue;
      var flashAlpha = clamp(blk.flash / 0.30, 0, 1);
      // Body
      var grad = ctx.createLinearGradient(0, blk.y, 0, blk.y + blk.h);
      grad.addColorStop(0, "#6a3f22");
      grad.addColorStop(1, "#2a1808");
      ctx.fillStyle = grad;
      ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
      // Outline
      ctx.strokeStyle = "rgba(245,196,81,0.7)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(blk.x + 0.5, blk.y + 0.5, blk.w - 1, blk.h - 1);
      // Flash
      if (flashAlpha > 0) {
        ctx.fillStyle = "rgba(255,255,255," + (0.5 * flashAlpha) + ")";
        ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
      }
    }
  }

  function drawDrops() {
    for (var i = 0; i < state.drops.length; i++) {
      var d = state.drops[i];
      var meta = POWERUP_META[d.kind];
      var bobY = Math.sin(d.bob || 0) * 3;
      var pulse = 0.85 + 0.15 * Math.sin((d.bob || 0) * 2);
      var col = meta.color;
      // Outer ring
      ctx.save();
      ctx.translate(d.x, d.y + bobY);
      ctx.beginPath();
      ctx.arc(0, 0, d.r * (1.0 + 0.10 * pulse), 0, Math.PI * 2);
      ctx.fillStyle = hexA(col, 0.20);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, d.r, 0, Math.PI * 2);
      ctx.fillStyle = hexA(col, 0.55);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Glyph
      ctx.font = "16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(meta.glyph, 0, 1);
      ctx.restore();
    }
  }

  function drawBallTrails() {
    if (reducedMotion) return;
    for (var i = 0; i < state.balls.length; i++) {
      var b = state.balls[i];
      for (var t = 0; t < b.trail.length; t++) {
        var pt = b.trail[t];
        var alpha = Math.max(0, pt.life) * 0.45;
        var col = b.isScholar ? "#f5c451" : (b.isTrick ? "#f07060" : "#5de0f0");
        ctx.fillStyle = hexA(col, alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, b.r * (0.4 + pt.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPaddles() {
    drawPaddle(state.paddleP, "#5de0f0");
    var aiCol = TIER_META[state.tier].color;
    drawPaddle(state.paddleA, aiCol);
  }

  function drawPaddle(p, color) {
    // Glow halo
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    var grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
    grad.addColorStop(0, hexA(color, 0.5));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, hexA(color, 0.5));
    ctx.fillStyle = grad;
    var radius = 4;
    ctx.beginPath();
    ctx.moveTo(p.x + radius, p.y);
    ctx.lineTo(p.x + p.w - radius, p.y);
    ctx.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w, p.y + radius);
    ctx.lineTo(p.x + p.w, p.y + p.h - radius);
    ctx.quadraticCurveTo(p.x + p.w, p.y + p.h, p.x + p.w - radius, p.y + p.h);
    ctx.lineTo(p.x + radius, p.y + p.h);
    ctx.quadraticCurveTo(p.x, p.y + p.h, p.x, p.y + p.h - radius);
    ctx.lineTo(p.x, p.y + radius);
    ctx.quadraticCurveTo(p.x, p.y, p.x + radius, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Core highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 3);
    // Center mark
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(p.x + 2, p.y + p.h / 2 - 1, p.w - 4, 2);
  }

  function drawBalls() {
    for (var i = 0; i < state.balls.length; i++) {
      var b = state.balls[i];
      drawBall(b);
    }
  }

  function drawBall(b) {
    ctx.save();
    if (b.isScholar) {
      // Glowing gold scholar
      var pulse = 0.85 + 0.15 * Math.sin(state.time * 6);
      ctx.shadowColor = "#f5c451";
      ctx.shadowBlur = 18 * pulse;
      ctx.fillStyle = "#fff8c4";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5c451";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      // ? mark
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1a1208";
      ctx.fillText("?", b.x, b.y + 1);
    } else if (b.isTrick) {
      ctx.shadowColor = "#f07060";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#f07060";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.shadowColor = "#5de0f0";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(93,224,240,0.6)";
      ctx.beginPath();
      ctx.arc(b.x - 2, b.y - 2, b.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var t = p.life / p.totalLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + 0.4 * t), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCallouts() {
    for (var i = 0; i < state.callouts.length; i++) {
      var co = state.callouts[i];
      var t = co.life / co.totalLife;
      var alpha = Math.max(0, t);
      var color = "#5de0f0";
      var fontStyle = "italic 800 22px Fraunces, serif";
      if (co.kls === "is-tetris") { color = "#f5c451"; fontStyle = "italic 900 32px Fraunces, serif"; }
      else if (co.kls === "is-legend") { color = "#a991ff"; fontStyle = "italic 900 30px Fraunces, serif"; }
      else if (co.kls === "is-bonus") { color = "#a991ff"; fontStyle = "italic 800 22px Fraunces, serif"; }
      else if (co.kls === "is-warn") { color = "#f04860"; fontStyle = "italic 800 20px Fraunces, serif"; }
      else if (co.kls === "is-good") { color = "#6dc18f"; fontStyle = "italic 800 20px Fraunces, serif"; }
      else if (co.kls === "is-score-good") { color = "#5de0f0"; fontStyle = "bold 18px JetBrains Mono, monospace"; }
      ctx.save();
      ctx.font = fontStyle;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillText(co.text, co.x + 1, co.y + 1);
      ctx.fillStyle = color;
      ctx.fillText(co.text, co.x, co.y);
      ctx.restore();
    }
  }

  function drawServeOverlay() {
    if (phase !== "serving") return;
    ctx.save();
    ctx.font = "italic 800 22px Fraunces, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText("Serving…", NET_X + 1, COURT_TOP + 65);
    ctx.fillStyle = "#5de0f0";
    ctx.fillText("Serving…", NET_X, COURT_TOP + 64);
    ctx.restore();
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
    if (dom.hudLives) dom.hudLives.textContent = String(Math.max(0, state.lives));
    if (dom.hudMatches) dom.hudMatches.textContent = String(state.matchesWon);
    if (dom.hudDuel) dom.hudDuel.textContent = state.pPoints + "–" + state.aPoints;
    if (dom.hudRallies) {
      dom.hudRallies.textContent = String(state.rallyCount);
      var cell = dom.hudRallies.parentElement;
      if (cell) cell.classList.toggle("is-active", state.rallyStreak >= 3);
    }
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      dom.goalName.textContent = MOD_META[state.mod].label + " · " + TIER_META[state.tier].label;
    }
    if (dom.goalMeta) {
      var bits = [];
      bits.push("First to " + POINTS_TO_WIN);
      bits.push("Match " + (state.pMatchWins + 1) + "/" + MATCH_BEST_OF);
      var ap = state.activePowerups;
      if (ap.speed.active) bits.push("Speed " + ap.speed.timer.toFixed(1) + "s");
      if (ap.wide.active) bits.push("Wide " + ap.wide.timer.toFixed(1) + "s");
      if (ap.x2.active) bits.push("x2 ARMED");
      if (ap.reverse.active) bits.push("Reverse ARMED");
      if (ap.trick.active) bits.push("Trick ARMED");
      dom.goalMeta.textContent = bits.join(" · ");
    }
    if (dom.brandSub) {
      dom.brandSub.textContent = TIER_META[state.tier].label.toUpperCase() + " · " + MOD_META[state.mod].label.toUpperCase();
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
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Cabinet Defeated" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Pong Doctor · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Highest Tier</div><div class="end-cell-value">' + TIER_META[state.tier].label + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Matches Won</div><div class="end-cell-value">' + state.matchesWon + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Points Won</div><div class="end-cell-value">' + state.pointsWon + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Rally</div><div class="end-cell-value">' + state.maxRally + '</div></div>',
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
  function addShards(n, source) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, source || GAME_ID);
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
          matchesWon: state.matchesWon,
          maxRally: state.maxRally,
          tier: state.tier
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
          tier: state.tier,
          mod: state.mod,
          lives: state.lives,
          matchesWon: state.matchesWon,
          maxRally: state.maxRally,
          rallyCount: state.rallyCount,
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
          file: "games/pong-doctor/index.html",
          score: state ? state.score : 0,
          level: state ? state.tierIdx + 1 : 1,
          durationMs: durationMs || 0
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("pong-doctor:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("pong-doctor:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        // Prefer "duel-arena", fall back to "boss-rush-arena"
        try {
          window.MrMacsArcadeMusic.start("duel-arena", { volume: 0.5 });
        } catch (e) {
          window.MrMacsArcadeMusic.start("boss-rush-arena", { volume: 0.5 });
        }
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
  var input = { keyUp: false, keyDown: false, mouseY: null };
  var lastInputWasTouch = false; // suppress synthetic mouse events after touch

  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      // Movement
      if (phase === "playing" || phase === "serving") {
        if (k === "ArrowUp" || k === "w" || k === "W") { input.keyUp = true; e.preventDefault(); return; }
        if (k === "ArrowDown" || k === "s" || k === "S") { input.keyDown = true; e.preventDefault(); return; }
        if (k === " ") {
          // Space — fast-forward serve
          if (phase === "serving") {
            state.serveTimer = 0;
          }
          e.preventDefault();
          return;
        }
        if (k === "1") { activatePowerup(0); e.preventDefault(); return; }
        if (k === "2") { activatePowerup(1); e.preventDefault(); return; }
        if (k === "3") { activatePowerup(2); e.preventDefault(); return; }
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
        if (phase === "playing" || phase === "paused" || phase === "serving") togglePause();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
      }
    });
    document.addEventListener("keyup", function (e) {
      var k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") { input.keyUp = false; }
      if (k === "ArrowDown" || k === "s" || k === "S") { input.keyDown = false; }
    });
    bindCanvasMouse();
    bindPowerupSlots();
  }

  function canvasToLogical(cx, cy) {
    var rect = canvas.getBoundingClientRect();
    var px = (cx - rect.left - offsetX) / scale - state.shake.x;
    var py = (cy - rect.top - offsetY) / scale - state.shake.y;
    return { x: px, y: py };
  }

  function bindCanvasMouse() {
    canvas.addEventListener("mousemove", function (e) {
      // Ignore synthetic mouse events fired right after touch on mobile
      if (lastInputWasTouch) return;
      if (!state) return;
      var p = canvasToLogical(e.clientX, e.clientY);
      input.mouseY = clamp(p.y, COURT_TOP + 4, COURT_BOTTOM - 4);
    });
    canvas.addEventListener("mouseleave", function () {
      // On touch devices this fires on tap-outside; only null if not in touch mode
      if (!lastInputWasTouch) input.mouseY = null;
    });
    canvas.addEventListener("touchstart", function (e) {
      if (!state) return;
      lastInputWasTouch = true;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        var p = canvasToLogical(t.clientX, t.clientY);
        input.mouseY = clamp(p.y, COURT_TOP + 4, COURT_BOTTOM - 4);
        // Tap to fast-forward serve
        if (phase === "serving") state.serveTimer = 0;
        e.preventDefault();
      }
    }, { passive: false });
    canvas.addEventListener("touchmove", function (e) {
      if (!state) return;
      lastInputWasTouch = true;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        var p = canvasToLogical(t.clientX, t.clientY);
        input.mouseY = clamp(p.y, COURT_TOP + 4, COURT_BOTTOM - 4);
        e.preventDefault();
      }
    }, { passive: false });
    canvas.addEventListener("touchend", function () {
      // Keep last position; clear touch flag after brief delay so real mouse
      // users on desktop aren't permanently locked out.
      setTimeout(function () { lastInputWasTouch = false; }, 500);
    });
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
    if (phase === "playing" || phase === "serving") {
      prevPhase = phase;
      phase = "paused";
      pauseMusic();
      showScreen("pause");
      renderPauseProgress();
    } else if (phase === "paused") {
      phase = prevPhase || "playing";
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
      else if (phase === "playing" || phase === "serving") startMusic();
    });
    dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      } catch (e) {}
    });
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("pong-doctor");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "pong-doctor", { compact: false });
      }
    }
  } catch (e) {}


  // ── Sound toggle live label ────────────────────────────────
  try {
    var _soundBtn = document.getElementById("soundBtn");
    if (_soundBtn && window.MrMacsProfile && window.MrMacsProfile.getSettings) {
      var _snd = MrMacsProfile.getSettings().sound;
      _soundBtn.textContent = (_snd === "off") ? "Sound Off" : "Sound On";
    }
  } catch (e) {}

  // ── Help overlay ───────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      window.MrMacsHelpOverlay.register("pong-doctor", {
        title: "How to Play Pong Doctor",
        goal: "Defeat the AI opponent in a best-of-match rally by scoring more points — answer scholar challenges to earn power-ups.",
        controls: [
          { key: "↑ / W",          action: "Move paddle up" },
          { key: "↓ / S",          action: "Move paddle down" },
          { key: "Mouse / Touch",   action: "Glide paddle to cursor position" },
          { key: "Esc / P",         action: "Pause" }
        ],
        tips: [
          "Hit the ball near the paddle edge to add spin — Curveball mode amplifies this.",
          "Power-ups fall in court after a rally milestone: SPEED, WIDE, REVERSE, x2, and TRICK.",
          "In Multiball mode both balls are live simultaneously — missing either one scores for the AI."
        ],
        scholar: "Every 5th rally a glowing Scholar ball appears. Let it pass your paddle or return it to trigger a review challenge — answer correctly for a power-up drop."
      });
      var _helpSetupActions = document.querySelector("#setupScreen .setup-actions");
      if (_helpSetupActions) window.MrMacsHelpOverlay.mountButton(_helpSetupActions, "pong-doctor");
    }
  } catch (e) {}
  }

  function exitToArcade() {
    stopMusic();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  var runStartTs = 0;

  function newRun() {
    initState({});
    showScreen(null);
    phase = "serving";
    runStartTs = Date.now();
    startMusic();
    updateHud();
    recordPlayWithProfile(0);
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    initState({
      score: s.score || 0,
      tier: s.tier || "easy",
      mod: s.mod || "standard",
      lives: s.lives != null ? s.lives : LIVES_INIT,
      matchesWon: s.matchesWon || 0,
      maxRally: s.maxRally || 0,
      rallyCount: s.rallyCount || 0,
      best: readBest()
    });
    showScreen(null);
    phase = "serving";
    runStartTs = Date.now();
    startMusic();
    updateHud();
    recordPlayWithProfile(0);
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.matchesWon) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Tier ' + (TIER_META[snap.state.tier || "easy"].label) +
        ' &middot; Matches ' + (snap.state.matchesWon || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Pong Doctor Scores</div>';
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
      if (phase === "playing" || phase === "serving") {
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
        tick(dt);
      } else if (phase === "matchEnd") {
        // Keep ticking particles + callouts during transition
        updateParticles(dt);
        updateShake(dt);
        for (var c = state.callouts.length - 1; c >= 0; c--) {
          var co = state.callouts[c];
          co.life -= dt;
          co.y -= 32 * dt;
          if (co.life <= 0) state.callouts.splice(c, 1);
        }
      }
    }
    if (state) render();
    if (phase === "playing" || phase === "paused" || phase === "serving" || phase === "matchEnd") {
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
    if (state && (phase === "playing" || phase === "serving")) {
      saveSnapshot();
      try { recordPlayWithProfile(Date.now() - runStartTs); } catch (e) {}
    }
  });

  try {
    if (window.MrMacsA11yQuickToggle) {
      var hudControls = document.querySelector(".hud-controls") || document.querySelector(".top-hud");
      if (hudControls) MrMacsA11yQuickToggle.mount(hudControls);
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "pong-doctor";
    var candidates = ach.filter(function(a) {
      if (a.unlocked) return false;
      return a.id.indexOf(GAME_ID_LOCAL) !== -1 || a.id.indexOf("cross-") === 0;
    });
    if (!candidates.length) return;
    var pick = candidates[0];
    var el = document.getElementById("pauseProgress");
    var title = document.getElementById("pauseProgressTitle");
    var meta = document.getElementById("pauseProgressMeta");
    var fill = document.getElementById("pauseProgressFill");
    if (!el || !title || !meta || !fill) return;
    title.textContent = pick.def.title || pick.id;
    meta.textContent = pick.def.desc || "";
    var pct = 0;
    if (window.MrMacsProfile.computeAchievementProgress) {
      var p = MrMacsProfile.computeAchievementProgress(pick.def, MrMacsProfile.get());
      if (p && p.target) pct = Math.min(100, (p.current / p.target) * 100);
    }
    fill.style.width = pct + "%";
    el.hidden = false;
  } catch (e) {}
}
