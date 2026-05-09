/* ===========================================================================
   Galaxy Defender — Galaga-style fixed shooter · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x800 logical · Bezier swarm formations · scholar invader
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "galaxy-defender";
  var GAME_TITLE = "Galaxy Defender";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 800;

  // Player
  var PLAYER_Y = LOGICAL_H - 80;
  var PLAYER_W = 36;
  var PLAYER_H = 30;
  var PLAYER_SPEED = 360;             // px / sec keyboard
  var PLAYER_SHOOT_COOLDOWN_MS = 250;
  var PLAYER_SHOOT_COOLDOWN_RAPID_MS = 125;
  var PLAYER_BULLET_SPEED = 700;
  var PLAYER_BULLET_W = 4;
  var PLAYER_BULLET_H = 14;
  var PLAYER_RESPAWN_DELAY_MS = 1300;

  // Enemy formation
  var FORMATION_ROWS = 4;
  var FORMATION_COLS = 5;
  var FORMATION_TOP_Y = 110;
  var FORMATION_LEFT_X_PAD = 110;     // left edge of grid
  var FORMATION_CELL_W = 70;
  var FORMATION_CELL_H = 56;
  var FORMATION_PULSE_RANGE = 30;     // amplitude of left-right idle pulse
  var FORMATION_PULSE_PERIOD = 6.0;   // seconds for full back-and-forth

  // Enemy types — base stats; difficulty scaling applied per stage
  var ENEMY_TYPES = {
    rumor:    { hp: 1, score: 100, w: 36, h: 32, fireChance: 0.0008, diveSpeed: 220 },
    bias:     { hp: 2, score: 200, w: 38, h: 34, fireChance: 0.0012, diveSpeed: 240 },
    captain:  { hp: 3, score: 500, w: 44, h: 40, fireChance: 0.0020, diveSpeed: 200 },
    scholar:  { hp: 1, score: 1500, w: 40, h: 36, fireChance: 0.0,   diveSpeed: 240 }
  };
  var ENEMY_BULLET_SPEED = 280;
  var ENEMY_BULLET_W = 4;
  var ENEMY_BULLET_H = 12;

  // Boss
  var BOSS_HP = 30;
  var BOSS_W = 180;
  var BOSS_H = 110;
  var BOSS_SPEED = 80;
  var BOSS_FIRE_INTERVAL_MIN = 1.4;
  var BOSS_FIRE_INTERVAL_MAX = 2.4;

  // Diving / waves
  var DIVE_INTERVAL_BASE = 4.5;       // seconds between dives at stage 1
  var DIVE_INTERVAL_MIN = 1.6;
  var WAVES_PER_STAGE = 5;
  var WAVE_SPAWN_INTERVAL_MS = 200;   // ms between successive enemy spawn within a wave
  var WAVE_INTAKE_DELAY_MS = 1100;    // pause between waves

  // Difficulty + scoring
  var LIVES_INIT = 3;
  var POWERUP_DROP_RATE = 0.05;
  var POWERUP_LIFETIME = 12.0;
  var POWERUP_FALL_SPEED = 110;
  var POWERUP_DURATION = 12.0;
  var SHARDS_CAP = 200;
  var BONUS_LIFE_THRESHOLD = 10000;
  var DIVE_KILL_MULTIPLIER = 5;        // +5x bonus during a dive

  // -- Inline review bank (28 entries) ---------------------------------------
  var INLINE_BANK = [
    { q: "Which empire fell in 1453?", choices: ["Roman", "Byzantine", "Ottoman", "Russian"], correct: 1, hint: "Capital was Constantinople." },
    { q: "What is the chemical symbol for gold?", choices: ["Gd", "Go", "Au", "Ag"], correct: 2, hint: "From Latin 'aurum'." },
    { q: "Which planet is closest to the Sun?", choices: ["Venus", "Mercury", "Mars", "Earth"], correct: 1, hint: "Smallest of the eight planets." },
    { q: "Who painted the Mona Lisa?", choices: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correct: 2, hint: "Renaissance polymath, c. 1503." },
    { q: "What is the largest ocean?", choices: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, hint: "Covers ~46% of the world's water." },
    { q: "Who wrote 'Romeo and Juliet'?", choices: ["Christopher Marlowe", "William Shakespeare", "Ben Jonson", "John Webster"], correct: 1, hint: "Bard of Avon." },
    { q: "What is the square root of 144?", choices: ["10", "11", "12", "14"], correct: 2, hint: "12 × 12 = 144." },
    { q: "The mitochondria is best known as the:", choices: ["Brain of the cell", "Powerhouse of the cell", "Skeleton of the cell", "Stomach of the cell"], correct: 1, hint: "Generates ATP." },
    { q: "Which country is home to the Great Pyramid of Giza?", choices: ["Mexico", "Sudan", "Egypt", "Iraq"], correct: 2, hint: "Built ~2560 BCE for Pharaoh Khufu." },
    { q: "What is the longest river in the world?", choices: ["Amazon", "Yangtze", "Mississippi", "Nile"], correct: 3, hint: "Flows north through Egypt." },
    { q: "How many continents are there?", choices: ["5", "6", "7", "8"], correct: 2, hint: "Africa, Antarctica, Asia, Australia, Europe, N. America, S. America." },
    { q: "Who composed 'The Four Seasons'?", choices: ["Bach", "Mozart", "Beethoven", "Vivaldi"], correct: 3, hint: "Italian Baroque composer, 1725." },
    { q: "What gas do plants absorb from the atmosphere?", choices: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2, hint: "Used in photosynthesis." },
    { q: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Constitution", "Bill of Rights", "Declaration of Independence", "Federalist No. 10"], correct: 2, hint: "Adopted July 4, 1776." },
    { q: "The speed of light is approximately:", choices: ["3 × 10^5 km/s", "3 × 10^8 m/s", "3 × 10^6 m/s", "3 × 10^10 m/s"], correct: 1, hint: "Roughly 300,000 km/s." },
    { q: "Mount Everest sits on the border between:", choices: ["India and China", "Nepal and China", "Nepal and India", "Bhutan and China"], correct: 1, hint: "Tibet is the Chinese side." },
    { q: "The Berlin Wall fell in:", choices: ["1985", "1987", "1989", "1991"], correct: 2, hint: "November of that year." },
    { q: "Which artist cut off part of his own ear?", choices: ["Monet", "Van Gogh", "Picasso", "Cezanne"], correct: 1, hint: "Post-Impressionist, Dutch." },
    { q: "How many sides does a hexagon have?", choices: ["5", "6", "7", "8"], correct: 1, hint: "Bees know this one." },
    { q: "Which language has the most native speakers?", choices: ["English", "Spanish", "Mandarin Chinese", "Hindi"], correct: 2, hint: "Over a billion speakers." },
    { q: "The Pacific Ring of Fire is famous for:", choices: ["Coral reefs", "Earthquakes and volcanoes", "Hurricanes", "Sand dunes"], correct: 1, hint: "Plate-boundary activity." },
    { q: "Photosynthesis primarily occurs in which organelle?", choices: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"], correct: 2, hint: "Contains chlorophyll." },
    { q: "Who developed the theory of general relativity?", choices: ["Newton", "Einstein", "Hawking", "Bohr"], correct: 1, hint: "Published in 1915." },
    { q: "The Magna Carta was signed in:", choices: ["1066", "1215", "1492", "1620"], correct: 1, hint: "King John, Runnymede." },
    { q: "Which is a noble gas?", choices: ["Oxygen", "Nitrogen", "Neon", "Hydrogen"], correct: 2, hint: "Group 18 of the periodic table." },
    { q: "The Renaissance began in which country?", choices: ["France", "England", "Italy", "Spain"], correct: 2, hint: "Florence was the financial heart." },
    { q: "What is 15% of 200?", choices: ["20", "25", "30", "35"], correct: 2, hint: "10% is 20; add half of that." },
    { q: "Who wrote '1984'?", choices: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"], correct: 1, hint: "Pen name of Eric Blair." }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | dying | waveIntake | bossIntro | stageClear
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;
  var runStartMs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var lastBonusLifeThreshold = 0;

  // Input state
  var keys = { left: false, right: false, fire: false };
  var lastShotMs = 0;
  var touchTilt = null;                // { startX, currentX, baseX } for tilt-drag
  var touchFireHeld = false;

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
    shoot: function () {
      sfxTone(880, 0.06, { type: "square", volume: 0.10, endFreq: 1320 });
    },
    hit: function () {
      sfxTone(540, 0.05, { type: "triangle", volume: 0.10, endFreq: 380 });
    },
    kill_small: function () {
      sfxNoise(0.10, { volume: 0.13, cutoff: 1500 });
      sfxTone(440, 0.10, { type: "square", volume: 0.10, endFreq: 220 });
    },
    kill_captain: function () {
      sfxNoise(0.20, { volume: 0.18, cutoff: 1200 });
      sfxTone(520, 0.20, { type: "sawtooth", volume: 0.14, endFreq: 110 });
      setTimeout(function () { sfxTone(880, 0.10, { type: "triangle", volume: 0.16, endFreq: 1320 }); }, 80);
    },
    dive_warn: function () {
      sfxTone(660, 0.18, { type: "sawtooth", volume: 0.10, endFreq: 220 });
    },
    scholar_kill: function () {
      [988, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.13, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    scholar_correct: function () {
      [784, 1175, 1568, 1976].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong: function () {
      sfxTone(330, 0.16, { type: "sawtooth", volume: 0.14, endFreq: 110 });
      sfxNoise(0.10, { volume: 0.10, cutoff: 700 });
    },
    smart_bomb: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 1800 });
      sfxTone(220, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 1760 });
    },
    shield_hit: function () {
      sfxTone(540, 0.12, { type: "triangle", volume: 0.16, endFreq: 880 });
      sfxNoise(0.06, { volume: 0.10, cutoff: 1200 });
    },
    shield_break: function () {
      sfxNoise(0.18, { volume: 0.18, cutoff: 800 });
      sfxTone(660, 0.20, { type: "sawtooth", volume: 0.14, endFreq: 110 });
    },
    life_lost: function () {
      sfxNoise(0.4, { volume: 0.20, cutoff: 700 });
      sfxTone(330, 0.5, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    level_clear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
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
      sfxTone(1320, 0.10, { type: "square", volume: 0.14 });
      setTimeout(function () { sfxTone(1760, 0.10, { type: "square", volume: 0.14 }); }, 60);
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("galaxyCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudStage = $("hudStage");
    dom.hudWave = $("hudWave");
    dom.hudBest = $("hudBest");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
    dom.waveRibbon = $("waveRibbon");
    dom.popupOverlay = $("popupOverlay");
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
    dom.tcLeft = $("tcLeft");
    dom.tcRight = $("tcRight");
    dom.tcFire = $("tcFire");
  }

  // -- Bezier helper ---------------------------------------------------------
  // cubic bezier returning {x,y}
  function bezier(p0, p1, p2, p3, t) {
    var u = 1 - t;
    var tt = t * t, uu = u * u;
    var uuu = uu * u, ttt = tt * t;
    var x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    var y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
    return { x: x, y: y };
  }
  // tangent angle on a cubic bezier
  function bezierAngle(p0, p1, p2, p3, t) {
    var u = 1 - t;
    var dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    var dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    return Math.atan2(dy, dx);
  }

  // -- Formation slot helpers -----------------------------------------------
  function formationSlot(row, col) {
    return {
      row: row, col: col,
      x: FORMATION_LEFT_X_PAD + col * FORMATION_CELL_W,
      y: FORMATION_TOP_Y + row * FORMATION_CELL_H
    };
  }
  function pulseOffset(time) {
    if (!state || reducedMotion) return 0;
    return Math.sin((time / FORMATION_PULSE_PERIOD) * Math.PI * 2) * FORMATION_PULSE_RANGE;
  }
  function slotWorldPos(row, col, time) {
    var s = formationSlot(row, col);
    return { x: s.x + pulseOffset(time), y: s.y };
  }

  // -- Build wave roster -----------------------------------------------------
  // For each stage/wave: produce an array of { row, col, type, entryPath } for 8-12 enemies.
  function buildWave(stage, wave) {
    var enemies = [];
    // Determine type weights by stage
    var captainChance = Math.min(0.30, 0.10 + stage * 0.04);
    var biasChance = Math.min(0.40, 0.20 + stage * 0.04);
    // Choose number of enemies: 8-12
    var count = 8 + Math.floor(Math.random() * 5);
    // Pick which slots in the formation to fill (avoid duplicates).
    var slotPool = [];
    for (var r = 0; r < FORMATION_ROWS; r++) {
      for (var c = 0; c < FORMATION_COLS; c++) {
        slotPool.push({ row: r, col: c });
      }
    }
    // Already-occupied (from earlier waves this stage) tracked in state.formationSlots
    var occupied = state ? state.formationSlots.slice() : [];
    var filtered = slotPool.filter(function (s) {
      for (var i = 0; i < occupied.length; i++) {
        if (occupied[i].row === s.row && occupied[i].col === s.col) return false;
      }
      return true;
    });
    // shuffle
    for (var i = filtered.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = filtered[i]; filtered[i] = filtered[j]; filtered[j] = tmp;
    }
    if (count > filtered.length) count = filtered.length;
    var entrySide = (wave % 2 === 0) ? "right" : "left";
    var entryFromTop = (wave === 3 || wave === 5);
    for (var k = 0; k < count; k++) {
      var slot = filtered[k];
      var roll = Math.random();
      var type;
      if (roll < captainChance && slot.row <= 1) type = "captain";
      else if (roll < captainChance + biasChance) type = "bias";
      else type = "rumor";
      var path = makeEntryPath(slot.row, slot.col, entrySide, entryFromTop, k);
      enemies.push({
        row: slot.row, col: slot.col,
        type: type,
        path: path,
        delay: k * (WAVE_SPAWN_INTERVAL_MS / 1000)
      });
    }
    return enemies;
  }

  // Bezier entry path: from off-screen edge, curving into the formation slot.
  function makeEntryPath(row, col, side, fromTop, idx) {
    var dest = formationSlot(row, col);
    var p0, p1, p2, p3 = { x: dest.x, y: dest.y };
    if (fromTop) {
      // dive in from above with a curl
      p0 = { x: 80 + Math.random() * (LOGICAL_W - 160), y: -60 };
      p1 = { x: p0.x + (Math.random() < 0.5 ? -180 : 180), y: 100 };
      p2 = { x: dest.x + (Math.random() < 0.5 ? -120 : 120), y: 250 };
    } else if (side === "left") {
      p0 = { x: -50, y: 100 + (idx % 4) * 30 };
      p1 = { x: 200, y: 360 + Math.random() * 60 };
      p2 = { x: dest.x - 220, y: dest.y + 140 };
    } else {
      p0 = { x: LOGICAL_W + 50, y: 100 + (idx % 4) * 30 };
      p1 = { x: LOGICAL_W - 200, y: 360 + Math.random() * 60 };
      p2 = { x: dest.x + 220, y: dest.y + 140 };
    }
    return { p0: p0, p1: p1, p2: p2, p3: p3, duration: 2.4 + Math.random() * 0.5 };
  }

  // -- Dive path -------------------------------------------------------------
  // When an enemy peels off from formation to attack player, build a curved
  // path through the screen ending past the player at bottom; if it survives,
  // it loops back to its slot.
  function buildDivePath(enemy, time, target) {
    var startX = formationSlot(enemy.row, enemy.col).x + pulseOffset(time);
    var startY = formationSlot(enemy.row, enemy.col).y;
    // dive curves toward player then exits below, with a side bias for variety
    var sideBias = (Math.random() < 0.5 ? -1 : 1);
    var p0 = { x: startX, y: startY };
    var p1 = { x: startX + sideBias * (120 + Math.random() * 120), y: startY + 200 };
    var p2 = { x: target.x + sideBias * (60 + Math.random() * 80), y: PLAYER_Y - 60 };
    var p3 = { x: target.x + sideBias * (140 + Math.random() * 160), y: LOGICAL_H + 60 };
    return { p0: p0, p1: p1, p2: p2, p3: p3, duration: 2.4 + Math.random() * 0.6 };
  }

  // -- Make enemy ------------------------------------------------------------
  function makeEnemy(spec) {
    var meta = ENEMY_TYPES[spec.type];
    return {
      row: spec.row,
      col: spec.col,
      type: spec.type,
      hp: meta.hp,
      maxHp: meta.hp,
      w: meta.w,
      h: meta.h,
      score: meta.score,
      mode: "entering",          // entering | formation | diving | dead
      path: spec.path,
      pathT: 0,
      delay: spec.delay,
      x: spec.path ? spec.path.p0.x : 0,
      y: spec.path ? spec.path.p0.y : 0,
      angle: 0,
      pulseOffset: Math.random() * Math.PI * 2,
      diveCooldown: 4 + Math.random() * 6,
      hitFlashT: 0,
      isScholar: spec.type === "scholar",
      droppedPowerup: false
    };
  }

  // -- Boss ------------------------------------------------------------------
  function makeBoss(stage) {
    return {
      type: "boss",
      hp: BOSS_HP + Math.floor((stage - 5) / 5) * 10,
      maxHp: BOSS_HP + Math.floor((stage - 5) / 5) * 10,
      w: BOSS_W, h: BOSS_H,
      score: 5000,
      x: LOGICAL_W / 2,
      y: -BOSS_H,
      vx: BOSS_SPEED,
      vy: 0,
      mode: "entering",
      fireTimer: BOSS_FIRE_INTERVAL_MIN + Math.random() * (BOSS_FIRE_INTERVAL_MAX - BOSS_FIRE_INTERVAL_MIN),
      barrageStep: 0,
      hitFlashT: 0,
      weakSpotsHit: 0
    };
  }

  // -- Powerups --------------------------------------------------------------
  var POWERUP_TYPES = ["twin", "rapid", "shield", "mult", "smart"];
  var POWERUP_META = {
    twin:    { glyph: "🔫", color: "#7ff5ff", glow: "#5de0f0", label: "TWIN CANNON" },
    rapid:   { glyph: "⚡",       color: "#fff8c4", glow: "#f0a800", label: "RAPID FIRE" },
    shield:  { glyph: "🛡", color: "#a8e8ff", glow: "#5de0f0", label: "SHIELD" },
    mult:    { glyph: "⭐",       color: "#fff8c4", glow: "#f0a800", label: "x2 MULT" },
    smart:   { glyph: "💥", color: "#ff86e8", glow: "#f072d4", label: "SMART BOMB" }
  };
  function spawnPowerupAt(x, y, type) {
    var t = type || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.powerups.push({
      type: t,
      x: x, y: y,
      vy: POWERUP_FALL_SPEED,
      life: POWERUP_LIFETIME,
      bob: Math.random() * Math.PI * 2
    });
  }
  function maybeDropPowerupAt(x, y) {
    if (Math.random() < POWERUP_DROP_RATE) spawnPowerupAt(x, y);
  }
  function applyPowerup(p) {
    sfx.powerup_pickup();
    var meta = POWERUP_META[p.type];
    pushPopup(meta.label, p.x, p.y - 24, "is-bonus");
    if (p.type === "twin")   { state.player.twinT = POWERUP_DURATION; }
    else if (p.type === "rapid")  { state.player.rapidT = POWERUP_DURATION; }
    else if (p.type === "shield") {
      state.player.shieldActive = true;
    } else if (p.type === "mult") {
      state.player.multCount = 5;
    } else if (p.type === "smart") {
      smartBomb();
    }
  }

  function smartBomb() {
    sfx.smart_bomb();
    addShake(10, 0.5);
    var killed = 0;
    var bonus = 0;
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (e.mode === "dead") continue;
      // Enemy explosion
      explodeEnemy(e, false);
      bonus += 50;
      killed++;
    }
    state.score += bonus;
    if (killed > 0) {
      pushPopup("SMART BOMB +" + bonus, LOGICAL_W / 2, LOGICAL_H / 2, "is-tetris");
    }
    // Clear enemy bullets too
    state.enemyBullets.length = 0;
  }

  // -- Player ----------------------------------------------------------------
  function makePlayer() {
    return {
      x: LOGICAL_W / 2,
      y: PLAYER_Y,
      w: PLAYER_W,
      h: PLAYER_H,
      twinT: 0,
      rapidT: 0,
      multCount: 0,
      shieldActive: false,
      dying: false,
      dyingT: 0,
      respawnT: 0,
      invuln: 0
    };
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    state = {
      stage: opts.stage || 1,
      maxStage: opts.maxStage || (opts.stage || 1),
      wave: 1,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      enemies: [],
      formationSlots: [],          // occupied {row,col} from prior waves on this stage
      bullets: [],                  // player bullets
      enemyBullets: [],
      powerups: [],
      particles: [],
      stars: opts.stars || generateStars(),
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      time: 0,
      player: makePlayer(),
      diveTimer: DIVE_INTERVAL_BASE,
      waveSpawnTimer: 0,
      pendingWaveEnemies: [],     // enemies waiting to spawn this wave (with delay timers)
      pendingWaveStarted: false,
      waveIntakeTimer: 0,
      bossActive: false,
      boss: null,
      bossKills: opts.bossKills || 0,
      enemiesKilledTotal: opts.enemiesKilledTotal || 0,
      scholarsKilled: opts.scholarsKilled || 0,
      diveKills: opts.diveKills || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      best: opts.best || readBest(),
      scholarSpawnedThisStage: false,
      endReason: ""
    };
    // Start first wave
    startWave();
  }

  function generateStars() {
    var stars = [];
    var layers = [
      { count: 50, speed: 18, size: [1, 2.0],   alpha: [0.18, 0.28] },
      { count: 35, speed: 36, size: [1.2, 2.5], alpha: [0.30, 0.46] },
      { count: 20, speed: 70, size: [1.5, 3.0], alpha: [0.50, 0.75] }
    ];
    for (var li = 0; li < layers.length; li++) {
      var layer = layers[li];
      for (var i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * LOGICAL_W,
          y: Math.random() * LOGICAL_H,
          r: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
          a: layer.alpha[0] + Math.random() * (layer.alpha[1] - layer.alpha[0]),
          speed: layer.speed,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.4 + Math.random() * 1.0
        });
      }
    }
    return stars;
  }

  // -- Start wave ------------------------------------------------------------
  function startWave() {
    var stage = state.stage;
    var wave = state.wave;
    // Boss wave check: every 5th stage, last wave is the boss
    if (stage % 5 === 0 && wave === WAVES_PER_STAGE) {
      // Spawn boss instead of standard wave
      state.bossActive = true;
      state.boss = makeBoss(stage);
      state.pendingWaveEnemies = [];
      state.pendingWaveStarted = true;
      phase = "bossIntro";
      pushPopup("MISINFO MOTHERSHIP", LOGICAL_W / 2, 130, "is-legend");
      sfx.dive_warn();
      addShake(6, 0.4);
      setTimeout(function () { if (phase === "bossIntro") phase = "playing"; }, 1200);
      return;
    }
    var wavelist = buildWave(stage, wave);
    state.pendingWaveEnemies = wavelist;
    state.pendingWaveStarted = true;
    state.waveSpawnTimer = 0;
    // 50% chance per stage to mark one entry as scholar (the rare one) - but only
    // ensure exactly one scholar invader appears per stage
    if (!state.scholarSpawnedThisStage && (wave >= 2 || Math.random() < 0.4)) {
      // Only spawn if we will reach wave 5 or random allows now
      if (wavelist.length > 0) {
        var idx = Math.floor(Math.random() * wavelist.length);
        wavelist[idx].type = "scholar";
        state.scholarSpawnedThisStage = true;
      }
    }
  }

  // -- Update ----------------------------------------------------------------
  function update(dt) {
    if (phase !== "playing" && phase !== "bossIntro" && phase !== "stageClear") return;

    // Spawn pending wave enemies on schedule (delay-based)
    if (state.pendingWaveEnemies.length > 0) {
      state.waveSpawnTimer += dt;
      // Spawn any enemies whose delay has elapsed
      for (var i = state.pendingWaveEnemies.length - 1; i >= 0; i--) {
        var spec = state.pendingWaveEnemies[i];
        if (state.waveSpawnTimer >= spec.delay) {
          var e = makeEnemy(spec);
          state.enemies.push(e);
          state.formationSlots.push({ row: spec.row, col: spec.col });
          state.pendingWaveEnemies.splice(i, 1);
        }
      }
    }

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateEnemyBullets(dt);
    updatePowerups(dt);
    updateParticles(dt);
    updateShake(dt);
    updateStars(dt);

    // Wave/stage progression
    if (phase === "playing" && state.pendingWaveEnemies.length === 0 && !state.bossActive) {
      var anyAlive = false;
      for (var k = 0; k < state.enemies.length; k++) {
        if (state.enemies[k].mode !== "dead") { anyAlive = true; break; }
      }
      if (!anyAlive) onWaveCleared();
    }

    if (state.bossActive && state.boss && state.boss.hp <= 0) {
      onBossDefeated();
    }

    // Player timers
    var pl = state.player;
    if (pl.twinT > 0) pl.twinT = Math.max(0, pl.twinT - dt);
    if (pl.rapidT > 0) pl.rapidT = Math.max(0, pl.rapidT - dt);
    if (pl.invuln > 0) pl.invuln = Math.max(0, pl.invuln - dt);
  }

  function updateStars(dt) {
    if (!state.stars) return;
    for (var i = 0; i < state.stars.length; i++) {
      var s = state.stars[i];
      s.y += s.speed * dt;
      if (s.y > LOGICAL_H + 4) {
        s.y = -4;
        s.x = Math.random() * LOGICAL_W;
      }
    }
  }

  function updatePlayer(dt) {
    var p = state.player;
    if (p.dying) {
      p.dyingT += dt;
      return;
    }
    // Keyboard movement
    var dx = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    p.x += dx * PLAYER_SPEED * dt;
    // Touch tilt overrides keyboard if active
    if (touchTilt && touchTilt.active) {
      p.x = touchTilt.baseX + (touchTilt.currentX - touchTilt.startX);
    }
    if (p.x < 24) p.x = 24;
    if (p.x > LOGICAL_W - 24) p.x = LOGICAL_W - 24;

    // Shooting
    if (keys.fire || touchFireHeld) {
      tryShoot();
    }
  }

  function tryShoot() {
    var p = state.player;
    if (p.dying) return;
    if (phase !== "playing") return;
    var now = performance.now();
    var cd = (p.rapidT > 0) ? PLAYER_SHOOT_COOLDOWN_RAPID_MS : PLAYER_SHOOT_COOLDOWN_MS;
    if (now - lastShotMs < cd) return;
    lastShotMs = now;
    sfx.shoot();
    if (p.twinT > 0) {
      // twin cannon: two parallel bullets
      state.bullets.push({ x: p.x - 10, y: p.y - 12, vy: -PLAYER_BULLET_SPEED });
      state.bullets.push({ x: p.x + 10, y: p.y - 12, vy: -PLAYER_BULLET_SPEED });
    } else {
      state.bullets.push({ x: p.x, y: p.y - 14, vy: -PLAYER_BULLET_SPEED });
    }
  }

  function updateBullets(dt) {
    for (var i = state.bullets.length - 1; i >= 0; i--) {
      var b = state.bullets[i];
      b.y += b.vy * dt;
      if (b.y < -20) { state.bullets.splice(i, 1); continue; }
      // Collide with enemies and boss
      var hit = checkBulletHit(b);
      if (hit) state.bullets.splice(i, 1);
    }
  }

  function checkBulletHit(b) {
    // Enemies
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.mode === "dead") continue;
      if (Math.abs(b.x - e.x) < e.w / 2 && Math.abs(b.y - e.y) < e.h / 2) {
        damageEnemy(e, 1);
        return true;
      }
    }
    // Boss
    if (state.bossActive && state.boss && state.boss.hp > 0) {
      var bo = state.boss;
      if (Math.abs(b.x - bo.x) < bo.w / 2 && Math.abs(b.y - bo.y) < bo.h / 2) {
        damageBoss(b);
        return true;
      }
    }
    return false;
  }

  function damageEnemy(e, dmg) {
    e.hp -= dmg;
    e.hitFlashT = 0.10;
    if (e.hp <= 0) {
      var divKill = (e.mode === "diving");
      explodeEnemy(e, divKill);
    } else {
      sfx.hit();
    }
  }

  function explodeEnemy(e, wasDive) {
    if (e.mode === "dead") return;
    e.mode = "dead";
    state.enemiesKilledTotal++;
    var pts = e.score;
    if (wasDive) {
      pts *= DIVE_KILL_MULTIPLIER;
      state.diveKills++;
    }
    if (state.player.multCount > 0) {
      pts *= 2;
      state.player.multCount--;
    }
    state.score += pts;
    pushPopup("+" + pts, e.x, e.y - 18, "is-score");
    if (e.type === "captain") {
      sfx.kill_captain();
      addShake(3, 0.12);
      // Hit-pause: 3 frames
      state.hitPauseUntil = performance.now() + 50;
    } else {
      sfx.kill_small();
    }
    // Particle burst
    var color = e.isScholar ? "#f5c451" :
                e.type === "captain" ? "#d04848" :
                e.type === "bias" ? "#a991ff" : "#f07bb8";
    burstAt(e.x, e.y, color, e.type === "captain" ? 12 : 6);

    // Scholar: trigger review modal
    if (e.isScholar) {
      sfx.scholar_kill();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 24, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (er) {}
      openScholarQuestion();
    } else {
      maybeDropPowerupAt(e.x, e.y);
    }
    // Free up the formation slot it was holding
    for (var i = state.formationSlots.length - 1; i >= 0; i--) {
      if (state.formationSlots[i].row === e.row && state.formationSlots[i].col === e.col) {
        state.formationSlots.splice(i, 1);
        break;
      }
    }
    checkBonusLife();
  }

  function damageBoss(b) {
    var bo = state.boss;
    bo.hp--;
    bo.hitFlashT = 0.08;
    sfx.hit();
    burstAt(b.x, b.y - 4, "#f072d4", 4);
    addShake(2, 0.08);
    if (bo.hp <= 0) {
      // explode handled elsewhere
    }
  }

  function updateEnemies(dt) {
    var t = state.time;
    var divable = [];
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (e.mode === "dead") {
        // Cleanup
        state.enemies.splice(i, 1);
        continue;
      }
      if (e.hitFlashT > 0) e.hitFlashT = Math.max(0, e.hitFlashT - dt);
      if (e.mode === "entering") {
        e.pathT += dt / e.path.duration;
        if (e.pathT >= 1) {
          e.pathT = 1;
          // snap to formation slot
          var slot = formationSlot(e.row, e.col);
          e.x = slot.x + pulseOffset(t);
          e.y = slot.y;
          e.angle = 0;
          e.mode = "formation";
        } else {
          var pos = bezier(e.path.p0, e.path.p1, e.path.p2, e.path.p3, e.pathT);
          e.x = pos.x;
          e.y = pos.y;
          e.angle = bezierAngle(e.path.p0, e.path.p1, e.path.p2, e.path.p3, e.pathT) - Math.PI / 2;
        }
      } else if (e.mode === "formation") {
        // sit at slot, pulse left/right with formation
        var fs = formationSlot(e.row, e.col);
        e.x = fs.x + pulseOffset(t);
        e.y = fs.y + Math.sin(t * 1.2 + e.pulseOffset) * 2;
        e.angle = 0;
        // accumulate dive cooldown
        e.diveCooldown -= dt;
        if (e.diveCooldown <= 0) divable.push(e);
        // random fire while in formation
        var meta = ENEMY_TYPES[e.type];
        if (meta && Math.random() < meta.fireChance && !state.player.dying) {
          fireEnemyBullet(e);
        }
      } else if (e.mode === "diving") {
        e.pathT += dt / e.path.duration;
        if (e.pathT >= 1) {
          e.pathT = 1;
          e.x = e.path.p3.x;
          e.y = e.path.p3.y;
          // off-screen: return to formation
          if (e.y > LOGICAL_H + 30) {
            // If off bottom, reset path back to slot from above
            var slot2 = formationSlot(e.row, e.col);
            var p0r = { x: slot2.x + (e.x > LOGICAL_W / 2 ? 200 : -200), y: -60 };
            var p1r = { x: slot2.x, y: 80 };
            var p2r = { x: slot2.x, y: slot2.y - 80 };
            var p3r = { x: slot2.x, y: slot2.y };
            e.path = { p0: p0r, p1: p1r, p2: p2r, p3: p3r, duration: 1.6 };
            e.pathT = 0;
            e.mode = "entering"; // re-enter as entering
            e.diveCooldown = 5 + Math.random() * 4;
          }
        } else {
          var pos2 = bezier(e.path.p0, e.path.p1, e.path.p2, e.path.p3, e.pathT);
          e.x = pos2.x;
          e.y = pos2.y;
          e.angle = bezierAngle(e.path.p0, e.path.p1, e.path.p2, e.path.p3, e.pathT) - Math.PI / 2;
          // Diving fire (more often)
          var dmeta = ENEMY_TYPES[e.type];
          if (dmeta && Math.random() < dmeta.fireChance * 3 && !state.player.dying) {
            fireEnemyBullet(e);
          }
          // Collision with player while diving
          checkEnemyPlayerCollision(e);
        }
      }
    }
    // Trigger a dive: pick lowest-tier first, then captain
    if (state.diveTimer > 0) state.diveTimer -= dt;
    if (state.diveTimer <= 0 && divable.length && phase === "playing" && !state.player.dying) {
      // sort: rumor < bias < captain (lower tier first)
      divable.sort(function (a, b) {
        var rank = function (x) { return x.type === "captain" ? 2 : x.type === "bias" ? 1 : 0; };
        return rank(a) - rank(b);
      });
      var pick = divable[0];
      pick.mode = "diving";
      pick.path = buildDivePath(pick, t, { x: state.player.x, y: state.player.y });
      pick.pathT = 0;
      sfx.dive_warn();
      // Compute next dive interval
      var stageMul = Math.max(0.45, 1 - (state.stage - 1) * 0.08);
      state.diveTimer = Math.max(DIVE_INTERVAL_MIN, DIVE_INTERVAL_BASE * stageMul);
    }
  }

  function fireEnemyBullet(e) {
    state.enemyBullets.push({
      x: e.x, y: e.y + e.h / 2,
      vx: 0, vy: ENEMY_BULLET_SPEED,
      from: e.type
    });
  }

  function updateEnemyBullets(dt) {
    for (var i = state.enemyBullets.length - 1; i >= 0; i--) {
      var b = state.enemyBullets[i];
      b.x += (b.vx || 0) * dt;
      b.y += b.vy * dt;
      if (b.y > LOGICAL_H + 20 || b.y < -20 || b.x < -20 || b.x > LOGICAL_W + 20) {
        state.enemyBullets.splice(i, 1);
        continue;
      }
      // Hit player
      var p = state.player;
      if (!p.dying && p.invuln <= 0 && Math.abs(b.x - p.x) < PLAYER_W / 2 && Math.abs(b.y - p.y) < PLAYER_H / 2) {
        playerHit();
        state.enemyBullets.splice(i, 1);
      }
    }
  }

  function checkEnemyPlayerCollision(e) {
    var p = state.player;
    if (p.dying || p.invuln > 0) return;
    if (Math.abs(p.x - e.x) < (p.w + e.w) * 0.4 && Math.abs(p.y - e.y) < (p.h + e.h) * 0.4) {
      playerHit();
      // The enemy also dies on ramming
      explodeEnemy(e, true);
    }
  }

  function playerHit() {
    var p = state.player;
    if (p.shieldActive) {
      p.shieldActive = false;
      p.invuln = 1.0;
      sfx.shield_break();
      addShake(4, 0.2);
      pushPopup("SHIELD BROKEN", p.x, p.y - 30, "is-bonus");
      burstAt(p.x, p.y, "#5de0f0", 14);
      return;
    }
    sfx.life_lost();
    addShake(7, 0.4);
    p.dying = true;
    p.dyingT = 0;
    state.lives--;
    if (state.lives <= 0) {
      phase = "dying";
      setTimeout(function () { gameOver(); }, 1100);
    } else {
      phase = "dying";
      setTimeout(function () {
        respawnPlayer();
        phase = "playing";
      }, PLAYER_RESPAWN_DELAY_MS);
    }
  }

  function respawnPlayer() {
    var prev = {
      twinT: state.player.twinT,
      rapidT: state.player.rapidT,
      multCount: state.player.multCount
    };
    state.player = makePlayer();
    state.player.invuln = 1.6;
    state.player.twinT = prev.twinT;
    state.player.rapidT = prev.rapidT;
    state.player.multCount = prev.multCount;
  }

  // -- Boss ------------------------------------------------------------------
  function updateBoss(dt) {
    if (!state.bossActive || !state.boss) return;
    var b = state.boss;
    if (b.hitFlashT > 0) b.hitFlashT = Math.max(0, b.hitFlashT - dt);
    if (b.mode === "entering") {
      b.y += 50 * dt;
      if (b.y >= 130) {
        b.y = 130;
        b.mode = "active";
      }
    } else if (b.mode === "active") {
      b.x += b.vx * dt;
      if (b.x < BOSS_W / 2 + 30) { b.x = BOSS_W / 2 + 30; b.vx *= -1; }
      if (b.x > LOGICAL_W - BOSS_W / 2 - 30) { b.x = LOGICAL_W - BOSS_W / 2 - 30; b.vx *= -1; }
      b.fireTimer -= dt;
      if (b.fireTimer <= 0) {
        bossFire();
        b.fireTimer = BOSS_FIRE_INTERVAL_MIN + Math.random() * (BOSS_FIRE_INTERVAL_MAX - BOSS_FIRE_INTERVAL_MIN);
      }
      // Collision with player
      checkEnemyPlayerCollision(b);
    }
  }

  function bossFire() {
    var b = state.boss;
    // barrage pattern: fan of 5 bullets
    var cx = b.x, cy = b.y + b.h / 2;
    var spread = 0.5; // radians half-fan
    for (var i = -2; i <= 2; i++) {
      var ang = Math.PI / 2 + (i * spread / 2);
      state.enemyBullets.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * ENEMY_BULLET_SPEED,
        vy: Math.sin(ang) * ENEMY_BULLET_SPEED,
        from: "boss"
      });
    }
  }

  function onBossDefeated() {
    var b = state.boss;
    sfx.kill_captain();
    addShake(14, 0.8);
    burstAt(b.x, b.y, "#f072d4", 30);
    burstAt(b.x - 30, b.y - 10, "#f5c451", 20);
    burstAt(b.x + 30, b.y + 10, "#5de0f0", 20);
    state.score += b.score;
    state.lives++;
    state.bossKills++;
    pushPopup("MOTHERSHIP DOWN! +" + b.score, LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-bonus");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 40, palette: ["#f5c451", "#f072d4", "#5de0f0", "#a991ff"] });
      }
    } catch (e) {}
    state.bossActive = false;
    state.boss = null;
    // Treat boss kill as stage clear
    setTimeout(function () { onStageClear(); }, 900);
  }

  // -- Wave / stage progression ---------------------------------------------
  function onWaveCleared() {
    if (phase === "stageClear") return;
    state.diveTimer = DIVE_INTERVAL_BASE; // reset
    if (state.wave >= WAVES_PER_STAGE) {
      onStageClear();
    } else {
      state.wave++;
      state.formationSlots.length = 0; // reset for next wave
      phase = "waveIntake";
      pushPopup("WAVE " + state.wave + " READY", LOGICAL_W / 2, LOGICAL_H / 2 - 40, "is-bonus");
      setTimeout(function () {
        if (phase !== "waveIntake") return;
        phase = "playing";
        startWave();
      }, WAVE_INTAKE_DELAY_MS);
    }
  }

  function onStageClear() {
    if (phase === "stageClear") return;
    sfx.level_clear();
    addShake(6, 0.5);
    var bonus = 1000 * state.stage + state.lives * 500;
    state.score += bonus;
    state.lives++;
    pushPopup("STAGE " + state.stage + " CLEAR!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopup("+" + bonus + " bonus", LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 + 56, "is-bonus");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#a991ff", "#f072d4"] });
      }
    } catch (e) {}
    phase = "stageClear";
    saveSnapshot();
    setTimeout(function () {
      var nextStage = state.stage + 1;
      var carry = {
        stage: nextStage,
        maxStage: Math.max(state.maxStage, nextStage),
        score: state.score,
        lives: state.lives,
        enemiesKilledTotal: state.enemiesKilledTotal,
        scholarsKilled: state.scholarsKilled,
        diveKills: state.diveKills,
        bossKills: state.bossKills,
        shardsAwarded: state.shardsAwarded,
        questionsAnsweredCorrect: state.questionsAnsweredCorrect,
        questionsAnsweredTotal: state.questionsAnsweredTotal,
        best: state.best,
        stars: state.stars
      };
      initState(carry);
      phase = "playing";
    }, 1700);
  }

  function checkBonusLife() {
    var threshold = Math.floor(state.score / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    if (threshold > lastBonusLifeThreshold && threshold >= BONUS_LIFE_THRESHOLD) {
      lastBonusLifeThreshold = threshold;
      state.lives++;
      pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 - 80, "is-bonus");
      sfx.powerup_pickup();
    }
  }

  // -- Powerups update -------------------------------------------------------
  function updatePowerups(dt) {
    for (var i = state.powerups.length - 1; i >= 0; i--) {
      var pu = state.powerups[i];
      pu.y += pu.vy * dt;
      pu.bob += dt * 3;
      pu.life -= dt;
      if (pu.y > LOGICAL_H + 30 || pu.life <= 0) {
        state.powerups.splice(i, 1);
        continue;
      }
      // pickup by player
      var p = state.player;
      if (!p.dying && Math.abs(pu.x - p.x) < 26 && Math.abs(pu.y - p.y) < 22) {
        applyPowerup(pu);
        state.powerups.splice(i, 1);
      }
    }
  }

  // -- Particles + popups + shake -------------------------------------------
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    count = count || 6;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 140;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.6,
        totalLife: 0.6,
        color: color,
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
  function pushPopup(text, x, y, kls) {
    var div = document.createElement("div");
    div.className = "popup-text " + (kls || "");
    div.textContent = text;
    var rect = canvas.getBoundingClientRect();
    var px = rect.left + offsetX + x * scale;
    var py = rect.top + offsetY + y * scale;
    div.style.left = px + "px";
    div.style.top = py + "px";
    dom.popupOverlay.appendChild(div);
    setTimeout(function () { try { div.remove(); } catch (e) {} }, 1200);
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
    drawStars();
    drawPowerups();
    drawEnemies();
    drawBoss();
    drawEnemyBullets();
    drawPlayer();
    drawBullets();
    drawParticles();

    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#04060f";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    var glow = ctx.createRadialGradient(LOGICAL_W / 2, 220, 60, LOGICAL_W / 2, 220, 460);
    glow.addColorStop(0, "rgba(20,40,80,0.32)");
    glow.addColorStop(0.6, "rgba(8,18,40,0.18)");
    glow.addColorStop(1, "rgba(4,6,15,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // bottom haze
    var grd = ctx.createLinearGradient(0, LOGICAL_H - 200, 0, LOGICAL_H);
    grd.addColorStop(0, "rgba(8,16,40,0)");
    grd.addColorStop(1, "rgba(8,28,80,0.42)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, LOGICAL_H - 200, LOGICAL_W, 200);
  }

  function drawStars() {
    if (!state.stars) return;
    for (var i = 0; i < state.stars.length; i++) {
      var s = state.stars[i];
      var tw = reducedMotion ? 1 : (0.6 + 0.4 * Math.abs(Math.sin(state.time * s.twinkleSpeed + s.twinkle)));
      ctx.fillStyle = "rgba(255,255,255," + (s.a * tw) + ")";
      ctx.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
    }
  }

  function drawPlayer() {
    var p = state.player;
    if (p.dying) { drawDyingPlayer(p); return; }
    if (p.invuln > 0 && Math.floor(state.time * 16) % 2 === 0) return; // blink
    drawShip(p.x, p.y);
    if (p.shieldActive) {
      ctx.save();
      ctx.strokeStyle = "#5de0f0";
      ctx.lineWidth = 2;
      if (!reducedMotion) {
        ctx.shadowColor = "#5de0f0";
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (p.multCount > 0 && !reducedMotion) {
      ctx.save();
      var grad = ctx.createRadialGradient(p.x, p.y, 6, p.x, p.y, 30);
      grad.addColorStop(0, "rgba(245,196,81,0.35)");
      grad.addColorStop(1, "rgba(245,196,81,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5c451";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("x2 (" + p.multCount + ")", p.x, p.y + 32);
      ctx.restore();
    }
  }

  function drawShip(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    // engine glow
    if (!reducedMotion) {
      var eg = ctx.createRadialGradient(0, 12, 0, 0, 12, 14);
      eg.addColorStop(0, "rgba(127,245,255,0.7)");
      eg.addColorStop(1, "rgba(127,245,255,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(0, 12, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    // hull (chrome with cyan trim)
    var hg = ctx.createLinearGradient(0, -16, 0, 14);
    hg.addColorStop(0, "#e8eef8");
    hg.addColorStop(0.5, "#b6c0d0");
    hg.addColorStop(1, "#5e6878");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-16, 8);
    ctx.lineTo(-10, 12);
    ctx.lineTo(-4, 8);
    ctx.lineTo(4, 8);
    ctx.lineTo(10, 12);
    ctx.lineTo(16, 8);
    ctx.closePath();
    ctx.fill();
    // canopy
    ctx.fillStyle = "#5de0f0";
    ctx.beginPath();
    ctx.ellipse(0, -4, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(-1.5, -7, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // wing tips magenta
    ctx.fillStyle = "#f072d4";
    ctx.fillRect(-17, 6, 4, 4);
    ctx.fillRect(13, 6, 4, 4);
    // gun barrel
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(-1, -18, 2, 4);
    ctx.restore();
  }

  function drawDyingPlayer(p) {
    var t = Math.min(1, p.dyingT);
    // expanding ring + scattering chunks
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.scale(1 + t * 0.6, 1 + t * 0.6);
    ctx.rotate(t * 4);
    drawShip(0, 0);
    ctx.restore();
    if (!reducedMotion) {
      ctx.save();
      ctx.strokeStyle = "rgba(245,196,81," + (1 - t) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14 + t * 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBullets() {
    ctx.save();
    for (var i = 0; i < state.bullets.length; i++) {
      var b = state.bullets[i];
      // outer glow
      if (!reducedMotion) {
        ctx.shadowColor = "#7ff5ff";
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = "#7ff5ff";
      ctx.fillRect(b.x - PLAYER_BULLET_W / 2, b.y - PLAYER_BULLET_H / 2, PLAYER_BULLET_W, PLAYER_BULLET_H);
      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x - 1, b.y - PLAYER_BULLET_H / 2, 2, PLAYER_BULLET_H);
    }
    ctx.restore();
  }

  function drawEnemyBullets() {
    ctx.save();
    for (var i = 0; i < state.enemyBullets.length; i++) {
      var b = state.enemyBullets[i];
      if (!reducedMotion) {
        ctx.shadowColor = "#f072d4";
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = "#ff86e8";
      ctx.fillRect(b.x - ENEMY_BULLET_W / 2, b.y - ENEMY_BULLET_H / 2, ENEMY_BULLET_W, ENEMY_BULLET_H);
      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x - 1, b.y - ENEMY_BULLET_H / 2, 2, ENEMY_BULLET_H);
    }
    ctx.restore();
  }

  function drawEnemies() {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.mode === "dead") continue;
      drawEnemy(e);
    }
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.angle) ctx.rotate(e.angle);
    if (e.hitFlashT > 0) {
      ctx.globalAlpha = 0.85;
    }
    if (e.isScholar) drawScholarInvader(e);
    else if (e.type === "captain") drawCaptain(e);
    else if (e.type === "bias") drawBiasBomber(e);
    else drawRumorSaucer(e);
    ctx.restore();
  }

  function drawRumorSaucer(e) {
    // pink saucer with antenna
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    var grad = ctx.createLinearGradient(0, -8, 0, 10);
    grad.addColorStop(0, "#ffd2e8");
    grad.addColorStop(0.5, "#f07bb8");
    grad.addColorStop(1, "#a14080");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // dome
    ctx.fillStyle = "#5de0f0";
    ctx.beginPath();
    ctx.ellipse(0, -5, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.ellipse(-2, -6, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // antenna tips (rumor signal)
    ctx.fillStyle = "#fff";
    ctx.fillRect(-1, -12, 2, 4);
    ctx.beginPath();
    ctx.arc(0, -13, 1.6, 0, Math.PI * 2);
    ctx.fill();
    // rumor whisper marks
    if (!reducedMotion) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      var phase2 = Math.floor(state.time * 4) % 3;
      ctx.fillText(phase2 === 0 ? "?" : phase2 === 1 ? "!" : "~", 0, 4);
    }
  }

  function drawBiasBomber(e) {
    // violet wedge with twin guns
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 16, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    var grad = ctx.createLinearGradient(0, -10, 0, 12);
    grad.addColorStop(0, "#c7b5ff");
    grad.addColorStop(0.5, "#a991ff");
    grad.addColorStop(1, "#5e4a9c");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-18, 8);
    ctx.lineTo(-10, 12);
    ctx.lineTo(10, 12);
    ctx.lineTo(18, 8);
    ctx.closePath();
    ctx.fill();
    // hull line
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, 4);
    ctx.lineTo(12, 4);
    ctx.stroke();
    // guns
    ctx.fillStyle = "#1a1230";
    ctx.fillRect(-12, 8, 3, 5);
    ctx.fillRect(9, 8, 3, 5);
    // cockpit
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.ellipse(0, -2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.arc(0, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCaptain(e) {
    // crimson + gold larger ship — captain class
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 20, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    var grad = ctx.createLinearGradient(0, -16, 0, 14);
    grad.addColorStop(0, "#ff8888");
    grad.addColorStop(0.5, "#d04848");
    grad.addColorStop(1, "#6a1818");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-22, 6);
    ctx.lineTo(-14, 14);
    ctx.lineTo(-4, 10);
    ctx.lineTo(4, 10);
    ctx.lineTo(14, 14);
    ctx.lineTo(22, 6);
    ctx.closePath();
    ctx.fill();
    // gold crown trim
    ctx.fillStyle = "#f5c451";
    ctx.fillRect(-12, -4, 24, 2);
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-2, -8);
    ctx.lineTo(2, -5);
    ctx.lineTo(6, -8);
    ctx.lineTo(10, -5);
    ctx.lineTo(10, -4);
    ctx.closePath();
    ctx.fill();
    // cockpit
    ctx.fillStyle = "#1a1208";
    ctx.beginPath();
    ctx.ellipse(0, 2, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.ellipse(0, 2, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // gun barrels
    ctx.fillStyle = "#1a0808";
    ctx.fillRect(-14, 8, 3, 6);
    ctx.fillRect(11, 8, 3, 6);
    // hp pips
    if (e.hp < e.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(-12, -16, 24, 3);
      ctx.fillStyle = "#f5c451";
      ctx.fillRect(-12, -16, 24 * (e.hp / e.maxHp), 3);
    }
  }

  function drawScholarInvader(e) {
    // gold-rimmed prize saucer with rotating "?" sigil
    ctx.save();
    // gold rim halo
    if (!reducedMotion) {
      ctx.shadowColor = "#f5c451";
      ctx.shadowBlur = 14;
    }
    // body
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    var grad = ctx.createLinearGradient(0, -8, 0, 12);
    grad.addColorStop(0, "#fff2c4");
    grad.addColorStop(0.5, "#f5c451");
    grad.addColorStop(1, "#a8821c");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // gold rim
    ctx.strokeStyle = "#fff2c4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    // dome
    ctx.fillStyle = "#1a2040";
    ctx.beginPath();
    ctx.ellipse(0, -5, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // rotating "?" sigil
    ctx.save();
    ctx.translate(0, -4);
    var rot = reducedMotion ? 0 : state.time * 1.8;
    ctx.rotate(rot);
    var colors = ["#f5c451", "#5de0f0", "#a991ff", "#f072d4"];
    for (var i = 0; i < colors.length; i++) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 5, Math.PI * 0.85 + i * 0.35, Math.PI * 2 + i * 0.35);
      ctx.stroke();
    }
    ctx.restore();
    // center "?"
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, -3);
    ctx.restore();
  }

  function drawBoss() {
    if (!state.bossActive || !state.boss) return;
    var b = state.boss;
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.hitFlashT > 0) ctx.globalAlpha = 0.7;
    // shadow underneath
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(0, b.h / 2 + 12, b.w / 2 + 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // hull
    var grad = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2);
    grad.addColorStop(0, "#5e4068");
    grad.addColorStop(0.5, "#a991ff");
    grad.addColorStop(1, "#3a2a4c");
    ctx.fillStyle = grad;
    ctx.beginPath();
    var w = b.w, h = b.h;
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 3, -h / 2);
    ctx.lineTo(w / 3, -h / 2);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 3, h / 2);
    ctx.lineTo(-w / 3, h / 2);
    ctx.closePath();
    ctx.fill();
    // central core
    ctx.fillStyle = "#1a1030";
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 4, h / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // pulsing core
    var pulse = reducedMotion ? 1 : (0.7 + 0.3 * Math.sin(state.time * 4));
    var coreGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, w / 5);
    coreGrad.addColorStop(0, "rgba(255,134,232," + pulse + ")");
    coreGrad.addColorStop(1, "rgba(240,114,212,0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, w / 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    // weak-spot ports
    ctx.fillStyle = "#f072d4";
    ctx.beginPath();
    ctx.arc(-w / 3, 0, 5, 0, Math.PI * 2);
    ctx.arc(w / 3, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    // gun mounts
    ctx.fillStyle = "#1a0a18";
    ctx.fillRect(-w / 4, h / 2 - 4, 6, 12);
    ctx.fillRect(w / 4 - 6, h / 2 - 4, 6, 12);
    // hp bar above
    ctx.restore();
    // separate hp bar
    var hpW = 200;
    var hpX = b.x - hpW / 2;
    var hpY = b.y - b.h / 2 - 18;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(hpX - 2, hpY - 2, hpW + 4, 8);
    ctx.fillStyle = "#f072d4";
    ctx.fillRect(hpX, hpY, hpW * Math.max(0, b.hp / b.maxHp), 4);
    ctx.fillStyle = "#f5c451";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("MOTHERSHIP", b.x, hpY - 4);
  }

  function drawPowerups() {
    for (var i = 0; i < state.powerups.length; i++) {
      var pu = state.powerups[i];
      var meta = POWERUP_META[pu.type];
      var bob = reducedMotion ? 0 : Math.sin(pu.bob) * 2;
      var x = pu.x;
      var y = pu.y + bob;
      // halo
      if (!reducedMotion) {
        var glow = ctx.createRadialGradient(x, y, 0, x, y, 22);
        glow.addColorStop(0, hexA(meta.glow, 0.5));
        glow.addColorStop(1, hexA(meta.glow, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      // disc
      ctx.fillStyle = "rgba(4,8,18,0.9)";
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = meta.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = meta.color;
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, x, y + 1);
    }
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var a = Math.max(0, p.life / p.totalLife);
      ctx.fillStyle = hexA(p.color || "#fff", a);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
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
    if (dom.hudStage) dom.hudStage.textContent = String(state.stage);
    if (dom.hudWave) {
      if (state.bossActive) dom.hudWave.textContent = "BOSS";
      else dom.hudWave.textContent = state.wave + "/" + WAVES_PER_STAGE;
    }
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      if (state.bossActive) dom.goalName.textContent = "Stage " + state.stage + " · Misinfo Mothership";
      else dom.goalName.textContent = "Stage " + state.stage + " · Wave " + state.wave + "/" + WAVES_PER_STAGE;
    }
    if (dom.waveRibbon) {
      dom.waveRibbon.classList.toggle("is-boss", !!state.bossActive);
    }
    if (dom.goalMeta) {
      var bits = [];
      if (state.player.twinT > 0) bits.push("Twin " + state.player.twinT.toFixed(1) + "s");
      if (state.player.rapidT > 0) bits.push("Rapid " + state.player.rapidT.toFixed(1) + "s");
      if (state.player.shieldActive) bits.push("Shield");
      if (state.player.multCount > 0) bits.push("x2 (" + state.player.multCount + ")");
      if (bits.length === 0) bits.push("Powerups · 0 active");
      dom.goalMeta.textContent = bits.join(" · ");
    }
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Scholar / review modal -----------------------------------------------
  var activeQuestion = null;

  function pickQuestion() {
    return INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
  }

  function openScholarQuestion() {
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Invader · Optional · +1500 + 12 shards";
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
    // Build choices array with their original indices, then shuffle
    var pairs = [];
    for (var i = 0; i < activeQuestion.choices.length && i < 4; i++) {
      pairs.push({ text: activeQuestion.choices[i], originalIdx: i });
    }
    for (var i2 = pairs.length - 1; i2 > 0; i2--) {
      var j = Math.floor(Math.random() * (i2 + 1));
      var tmp = pairs[i2]; pairs[i2] = pairs[j]; pairs[j] = tmp;
    }
    var html = "";
    for (var k = 0; k < pairs.length; k++) {
      var isCorrect = (pairs[k].originalIdx === activeQuestion.correct);
      html += '<button class="choice-btn" data-correct="' + (isCorrect ? "1" : "0") + '">' +
        '<span class="choice-letter">' + letters[k] + '</span>' +
        escapeHtml(pairs[k].text) + '</button>';
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
    if (correct) {
      dom.explanation.textContent = "Decoded! +1500 · +12 shards.";
      dom.explanation.className = "explanation is-correct";
      state.questionsAnsweredCorrect++;
      sfx.scholar_correct();
    } else {
      var correctText = activeQuestion.choices[activeQuestion.correct];
      dom.explanation.textContent = "Answer: " + correctText + (activeQuestion.hint ? " · " + activeQuestion.hint : "");
      dom.explanation.className = "explanation is-wrong";
      sfx.scholar_wrong();
    }
    state.questionsAnsweredTotal++;
    state.scholarsKilled++;
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }

  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += 1500;
      addShards(12, "galaxy-defender-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 26, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+1500 SCHOLAR", LOGICAL_W / 2, 100, "is-bonus");
    }
    activeQuestion = null;
    phase = prevPhase || "playing";
    if (phase === "question") phase = "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function skipQuestion() {
    state.scholarsKilled++;
    activeQuestion = null;
    phase = prevPhase || "playing";
    if (phase === "question") phase = "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
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
    if (shardsToAdd > 0) addShards(shardsToAdd, "galaxy-defender-run-end");
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Archive Overrun" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Galaxy Defender · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Stages Cleared</div><div class="end-cell-value">' + Math.max(0, state.stage - 1) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Invaders Down</div><div class="end-cell-value">' + formatNumber(state.enemiesKilledTotal) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Dive Kills</div><div class="end-cell-value">' + state.diveKills + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    stopMusic();
    var dur = runStartMs ? (Date.now() - runStartMs) : 0;
    recordPlayWithProfile(dur);
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
          stage: state.maxStage,
          enemies: state.enemiesKilledTotal,
          bossKills: state.bossKills
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
          stage: state.stage,
          wave: state.wave,
          lives: state.lives,
          enemiesKilledTotal: state.enemiesKilledTotal,
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
          file: "games/galaxy-defender/index.html",
          score: state ? state.score : 0,
          level: state ? state.stage : 1,
          durationMs: durationMs || 0
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("galaxy-defender:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("galaxy-defender:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("rift-survivors", { volume: 0.5 });
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
      if (phase === "playing" || phase === "bossIntro" || phase === "stageClear" || phase === "waveIntake") {
        if (k === "ArrowLeft" || k === "a" || k === "A") { keys.left = true; e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { keys.right = true; e.preventDefault(); return; }
        if (k === " " || k === "Spacebar") { keys.fire = true; e.preventDefault(); return; }
        if (k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
      }
      if (phase === "paused" && (k === "p" || k === "P")) {
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
    document.addEventListener("keyup", function (e) {
      var k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") { keys.left = false; }
      if (k === "ArrowRight" || k === "d" || k === "D") { keys.right = false; }
      if (k === " " || k === "Spacebar") { keys.fire = false; }
    });
    bindTouch();
    bindTouchControls();
  }

  function bindTouch() {
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (e.touches && e.touches.length >= 1) {
        var t = e.touches[0];
        touchTilt = {
          active: true,
          startX: t.clientX,
          currentX: t.clientX,
          baseX: state.player.x
        };
      }
      // tap-fire on canvas
      touchFireHeld = true;
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (!touchTilt) return;
      var t = e.touches[0];
      if (!t) return;
      // convert client X delta to logical scale
      touchTilt.currentX = touchTilt.startX + (t.clientX - touchTilt.startX) / Math.max(0.01, scale);
    }, { passive: true });
    canvas.addEventListener("touchend", function () {
      if (touchTilt) touchTilt.active = false;
      touchTilt = null;
      touchFireHeld = false;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () {
      if (touchTilt) touchTilt.active = false;
      touchTilt = null;
      touchFireHeld = false;
    }, { passive: true });
  }

  function bindTouchControls() {
    function pressBtn(btn, onDown, onUp) {
      if (!btn) return;
      btn.addEventListener("touchstart", function (e) { e.preventDefault(); onDown(); }, { passive: false });
      btn.addEventListener("touchend",   function (e) { e.preventDefault(); onUp(); }, { passive: false });
      btn.addEventListener("mousedown",  function (e) { e.preventDefault(); onDown(); });
      btn.addEventListener("mouseup",    function (e) { e.preventDefault(); onUp(); });
      btn.addEventListener("mouseleave", function () { onUp(); });
    }
    pressBtn(dom.tcLeft,  function () { keys.left = true; },  function () { keys.left = false; });
    pressBtn(dom.tcRight, function () { keys.right = true; }, function () { keys.right = false; });
    pressBtn(dom.tcFire,  function () { touchFireHeld = true; }, function () { touchFireHeld = false; });
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing" || phase === "bossIntro" || phase === "waveIntake" || phase === "stageClear") {
      prevPhase = phase;
      phase = "paused";
      pauseMusic();
      showScreen("pause");
    } else if (phase === "paused") {
      phase = prevPhase || "playing";
      if (phase === "paused") phase = "playing";
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

  function newRun() {
    lastBonusLifeThreshold = 0;
    runStartMs = Date.now();
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile(0);
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    lastBonusLifeThreshold = Math.floor((s.score || 0) / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    runStartMs = Date.now();
    initState({
      score: s.score || 0,
      stage: s.stage || 1,
      lives: s.lives,
      enemiesKilledTotal: s.enemiesKilledTotal || 0,
      best: readBest()
    });
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile(0);
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.stage > 1) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' · Stage ' + (snap.state.stage || 1) +
        ' · Wave ' + (snap.state.wave || 1) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Galaxy Defender Scores</div>';
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
      state.time += dt;
      if (phase === "playing") {
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
      }
    }
    // Hit-pause check
    var hitPaused = false;
    if (state && state.hitPauseUntil && performance.now() < state.hitPauseUntil) {
      hitPaused = true;
    }
    if (!hitPaused) update(dt);
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "stageClear" || phase === "paused" || phase === "bossIntro" || phase === "waveIntake") {
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
    if (state && phase === "playing") saveSnapshot();
  });
})();
