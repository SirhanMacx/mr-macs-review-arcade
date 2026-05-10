/* ===========================================================================
   Defender Drift — Defender-style horizontal-scrolling shooter · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x600 viewport over 4000-wide world · Mini-radar · scholar rescue
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "defender-drift";
  var GAME_TITLE = "Defender Drift";

  // Logical canvas (viewport)
  var LOGICAL_W = 720;
  var LOGICAL_H = 600;

  // World — horizontally looping
  var WORLD_W = 4000;
  var GROUND_Y = LOGICAL_H - 60;       // y-coordinate of planet surface
  var SKY_TOP = 80;                     // ceiling: scholars die here when carried
  var RADAR_H = 48;                     // mini-radar height at top
  var RADAR_TOP = 4;
  var RADAR_INSET = 12;

  // Player
  var PLAYER_W = 44;
  var PLAYER_H = 22;
  var PLAYER_THRUST = 380;              // px/sec horizontal acceleration cap
  var PLAYER_MAX_SPEED_X = 460;
  var PLAYER_VERT_SPEED = 280;
  var PLAYER_FRICTION_X = 1.6;          // per-second decay when no thrust
  var PLAYER_SHOOT_COOLDOWN_MS = 220;
  var PLAYER_SHOOT_COOLDOWN_RAPID_MS = 95;
  var PLAYER_BULLET_SPEED = 880;
  var PLAYER_BULLET_LIFE = 0.9;
  var PLAYER_BULLET_W = 22;
  var PLAYER_BULLET_H = 4;
  var PLAYER_RESPAWN_DELAY_MS = 1300;
  var PLAYER_INVULN_S = 1.6;
  var PLAYER_SCREEN_X = LOGICAL_W * 0.5; // anchored center; world scrolls

  // Scholars
  var SCHOLARS_PER_STAGE = 8;
  var SCHOLAR_WALK_SPEED = 22;
  var SCHOLAR_W = 12;
  var SCHOLAR_H = 18;
  var SCHOLAR_FALL_SPEED_MAX = 320;
  var SCHOLAR_FALL_GRAV = 540;
  var SCHOLAR_LOST_PENALTY = 2000;

  // Aliens (4 types)
  var ENEMY_TYPES = {
    lander:   { hp: 1, score: 150,  w: 26, h: 22, fireChance: 0.0008, color: "#f07bb8" },
    mutant:   { hp: 2, score: 250,  w: 24, h: 22, fireChance: 0.0028, color: "#a991ff" },
    bomber:   { hp: 3, score: 350,  w: 32, h: 24, fireChance: 0.0012, color: "#d04848" },
    pod:      { hp: 2, score: 200,  w: 28, h: 28, fireChance: 0.0004, color: "#4dd49b" },
    swarm:    { hp: 1, score: 100,  w: 14, h: 14, fireChance: 0.0010, color: "#6dffc4" }
  };
  var ENEMY_BULLET_SPEED = 320;
  var ENEMY_BULLET_W = 4;
  var ENEMY_BULLET_H = 4;
  var BOMBER_MINE_LIFE = 6.0;

  // Difficulty + scoring
  var LIVES_INIT = 3;
  var SMART_BOMBS_INIT = 3;
  var POWERUP_DROP_RATE = 0.07;
  var POWERUP_LIFETIME = 12.0;
  var POWERUP_FALL_SPEED = 80;
  var POWERUP_DURATION = 12.0;
  var SHARDS_CAP = 200;
  var BONUS_LIFE_THRESHOLD = 10000;
  var STAGE_CLEAR_BONUS_PER_SCHOLAR = 500;   // +5 alien-clear bonus * 100 base
  var TRACTOR_RANGE = 140;

  // Wave roster scaling
  function rosterForStage(stage) {
    return {
      landers: 6 + Math.min(8, stage),
      bombers: Math.max(0, Math.floor((stage - 1) / 2)) + 1,
      pods:    Math.max(0, Math.floor((stage - 1) / 3)),
      mutants: 0   // mutants are born when scholars are abducted
    };
  }

  // -- Inline review bank (28 entries) ---------------------------------------
  var INLINE_BANK = [
    { q: "Which empire fell when Constantinople was conquered in 1453?", choices: ["Roman", "Byzantine", "Ottoman", "Russian"], correct: 1, hint: "Capital was Constantinople." },
    { q: "What is the chemical symbol for gold?", choices: ["Gd", "Go", "Au", "Ag"], correct: 2, hint: "From Latin 'aurum'." },
    { q: "Which planet is closest to the Sun?", choices: ["Venus", "Mercury", "Mars", "Earth"], correct: 1, hint: "Smallest of the eight planets." },
    { q: "Who painted the Mona Lisa?", choices: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correct: 2, hint: "Renaissance polymath, c. 1503." },
    { q: "What is the largest ocean on Earth?", choices: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, hint: "Covers ~46% of the world's water." },
    { q: "Who wrote 'Romeo and Juliet'?", choices: ["Christopher Marlowe", "William Shakespeare", "Ben Jonson", "John Webster"], correct: 1, hint: "Bard of Avon." },
    { q: "What is the square root of 144?", choices: ["10", "11", "12", "14"], correct: 2, hint: "12 × 12 = 144." },
    { q: "The mitochondria is best known as the:", choices: ["Brain of the cell", "Powerhouse of the cell", "Skeleton of the cell", "Stomach of the cell"], correct: 1, hint: "Generates ATP." },
    { q: "Which country is home to the Great Pyramid of Giza?", choices: ["Mexico", "Sudan", "Egypt", "Iraq"], correct: 2, hint: "Built ~2560 BCE for Pharaoh Khufu." },
    { q: "What is the longest river in the world?", choices: ["Amazon", "Yangtze", "Mississippi", "Nile"], correct: 3, hint: "Flows north through Egypt." },
    { q: "How many continents are there?", choices: ["5", "6", "7", "8"], correct: 2, hint: "Africa, Antarctica, Asia, Australia, Europe, N. America, S. America." },
    { q: "Who composed 'The Four Seasons'?", choices: ["Bach", "Mozart", "Beethoven", "Vivaldi"], correct: 3, hint: "Italian Baroque composer, 1725." },
    { q: "What gas do plants absorb from the atmosphere for photosynthesis?", choices: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2, hint: "Used in photosynthesis." },
    { q: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Constitution", "Bill of Rights", "Declaration of Independence", "Federalist No. 10"], correct: 2, hint: "Adopted July 4, 1776." },
    { q: "The speed of light in a vacuum is approximately:", choices: ["3 × 10^5 km/s", "3 × 10^8 m/s", "3 × 10^6 m/s", "3 × 10^10 m/s"], correct: 1, hint: "Roughly 300,000 km/s." },
    { q: "Mount Everest sits on the border between which two regions?", choices: ["India and China", "Nepal and China", "Nepal and India", "Bhutan and China"], correct: 1, hint: "Tibet is the Chinese side." },
    { q: "The Berlin Wall fell in:", choices: ["1985", "1987", "1989", "1991"], correct: 2, hint: "November of that year." },
    { q: "Which Post-Impressionist artist cut off part of his own ear?", choices: ["Monet", "Van Gogh", "Picasso", "Cezanne"], correct: 1, hint: "Dutch painter." },
    { q: "How many sides does a hexagon have?", choices: ["5", "6", "7", "8"], correct: 1, hint: "Bees know this one." },
    { q: "Which language has the most native speakers worldwide?", choices: ["English", "Spanish", "Mandarin Chinese", "Hindi"], correct: 2, hint: "Over a billion speakers." },
    { q: "The Pacific Ring of Fire is famous for:", choices: ["Coral reefs", "Earthquakes and volcanoes", "Hurricanes", "Sand dunes"], correct: 1, hint: "Plate-boundary activity." },
    { q: "Photosynthesis primarily occurs in which organelle?", choices: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"], correct: 2, hint: "Contains chlorophyll." },
    { q: "Who developed the theory of general relativity?", choices: ["Newton", "Einstein", "Hawking", "Bohr"], correct: 1, hint: "Published in 1915." },
    { q: "The Magna Carta was signed in:", choices: ["1066", "1215", "1492", "1620"], correct: 1, hint: "King John, Runnymede." },
    { q: "Which of these is a noble gas?", choices: ["Oxygen", "Nitrogen", "Neon", "Hydrogen"], correct: 2, hint: "Group 18 of the periodic table." },
    { q: "The Renaissance began in which country?", choices: ["France", "England", "Italy", "Spain"], correct: 2, hint: "Florence was the financial heart." },
    { q: "What is 15% of 200?", choices: ["20", "25", "30", "35"], correct: 2, hint: "10% is 20; add half of that." },
    { q: "Who wrote the dystopian novel '1984'?", choices: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"], correct: 1, hint: "Pen name of Eric Blair." }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | dying | stageClear | stageIntake
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
  var keys = { left: false, right: false, up: false, down: false, fire: false, bomb: false };
  var lastShotMs = 0;
  var touchFireHeld = false;
  var touchBombArmed = false;

  // Track pending setTimeouts that mutate game state, so we can cancel on restart/exit.
  var pendingTimeouts = [];
  function scheduleTimeout(fn, ms) {
    var h = setTimeout(function () {
      // remove self from list before running
      var idx = pendingTimeouts.indexOf(h);
      if (idx >= 0) pendingTimeouts.splice(idx, 1);
      try { fn(); } catch (e) {}
    }, ms);
    pendingTimeouts.push(h);
    return h;
  }
  function clearPendingTimeouts() {
    for (var i = 0; i < pendingTimeouts.length; i++) {
      try { clearTimeout(pendingTimeouts[i]); } catch (e) {}
    }
    pendingTimeouts.length = 0;
  }

  // -- Math/world helpers ----------------------------------------------------
  function wrap(x) {
    // wrap world x-coordinate into [0, WORLD_W)
    if (!isFinite(x)) return 0;
    var m = x % WORLD_W;
    if (m < 0) m += WORLD_W;
    return m;
  }
  // shortest signed difference from a to b on the wrapped world (b - a)
  function worldDelta(a, b) {
    var d = wrap(b) - wrap(a);
    if (d > WORLD_W / 2) d -= WORLD_W;
    if (d < -WORLD_W / 2) d += WORLD_W;
    return d;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

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

  // Thrust loop using a simple oscillator that we periodically retrigger
  var lastThrustMs = 0;
  function sfxThrustLoop() {
    if (!soundOn) return;
    var now = performance.now();
    if (now - lastThrustMs < 90) return;   // limit retrigger rate
    lastThrustMs = now;
    sfxTone(110 + Math.random() * 40, 0.06, { type: "sawtooth", volume: 0.05, endFreq: 80 });
  }

  var sfx = {
    thrust_loop: sfxThrustLoop,
    shoot: function () {
      sfxTone(960, 0.05, { type: "square", volume: 0.09, endFreq: 1480 });
    },
    hit: function () {
      sfxTone(540, 0.05, { type: "triangle", volume: 0.10, endFreq: 380 });
    },
    kill_lander: function () {
      sfxNoise(0.12, { volume: 0.13, cutoff: 1200 });
      sfxTone(440, 0.10, { type: "square", volume: 0.10, endFreq: 220 });
    },
    kill_mutant: function () {
      sfxNoise(0.16, { volume: 0.14, cutoff: 1500 });
      sfxTone(620, 0.14, { type: "sawtooth", volume: 0.12, endFreq: 180 });
    },
    kill_bomber: function () {
      sfxNoise(0.22, { volume: 0.18, cutoff: 900 });
      sfxTone(330, 0.20, { type: "sawtooth", volume: 0.14, endFreq: 80 });
    },
    kill_pod: function () {
      sfxTone(880, 0.06, { type: "square", volume: 0.10 });
      setTimeout(function () { sfxTone(660, 0.06, { type: "square", volume: 0.10 }); }, 50);
      setTimeout(function () { sfxTone(440, 0.10, { type: "square", volume: 0.10, endFreq: 220 }); }, 100);
    },
    scholar_grab: function () {
      // rescued
      [988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    scholar_lost: function () {
      sfxTone(220, 0.18, { type: "sawtooth", volume: 0.18, endFreq: 60 });
      sfxNoise(0.18, { volume: 0.14, cutoff: 700 });
    },
    mutant_birth: function () {
      sfxTone(440, 0.10, { type: "sawtooth", volume: 0.16, endFreq: 80 });
      setTimeout(function () { sfxTone(660, 0.12, { type: "square", volume: 0.14, endFreq: 880 }); }, 80);
    },
    smart_bomb: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 1800 });
      sfxTone(220, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 1760 });
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
    },
    catch_scholar: function () {
      sfxTone(1320, 0.08, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(1760, 0.10, { type: "triangle", volume: 0.16 }); }, 50);
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("defenderCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudStage = $("hudStage");
    dom.hudScholars = $("hudScholars");
    dom.hudBombs = $("hudBombs");
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
    dom.tcUp = $("tcUp");
    dom.tcDown = $("tcDown");
    dom.tcFire = $("tcFire");
    dom.tcBomb = $("tcBomb");
  }

  // -- Powerups --------------------------------------------------------------
  var POWERUP_TYPES = ["shield", "rapid", "nuke", "tractor", "mult"];
  var POWERUP_META = {
    shield:  { glyph: "🛡", color: "#a8e8ff", glow: "#5de0f0", label: "SHIELD" },
    rapid:   { glyph: "⚡", color: "#fff8c4", glow: "#f0a800", label: "RAPID FIRE" },
    nuke:    { glyph: "💥", color: "#ff86e8", glow: "#f072d4", label: "NUKE +3 BOMBS" },
    tractor: { glyph: "🧲", color: "#a8e8ff", glow: "#5de0f0", label: "TRACTOR BEAM" },
    mult:    { glyph: "⭐", color: "#fff8c4", glow: "#f0a800", label: "x2 SCORE" }
  };
  function spawnPowerupAtWorld(worldX, y, type) {
    var t = type || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.powerups.push({
      type: t,
      worldX: wrap(worldX),
      y: y,
      vy: POWERUP_FALL_SPEED,
      life: POWERUP_LIFETIME,
      bob: Math.random() * Math.PI * 2
    });
  }
  function maybeDropPowerupAt(worldX, y) {
    if (Math.random() < POWERUP_DROP_RATE) spawnPowerupAtWorld(worldX, y);
  }
  function applyPowerup(p) {
    sfx.powerup_pickup();
    var meta = POWERUP_META[p.type];
    pushPopupAtScreen(meta.label, LOGICAL_W / 2, LOGICAL_H / 2 - 40, "is-bonus");
    if (p.type === "shield") {
      state.player.shieldActive = true;
    } else if (p.type === "rapid") {
      state.player.rapidT = POWERUP_DURATION;
    } else if (p.type === "nuke") {
      state.smartBombs += 3;
    } else if (p.type === "tractor") {
      state.player.tractorT = POWERUP_DURATION;
    } else if (p.type === "mult") {
      state.player.multT = POWERUP_DURATION;
    }
  }

  function smartBomb() {
    // Only legal during active play — prevents touch/keys from spending bombs
    // while modals are open or during dying/stageClear/setup/ended.
    if (phase !== "playing") return;
    if (!state || state.smartBombs <= 0) return;
    state.smartBombs--;
    if (state.smartBombs < 0) state.smartBombs = 0;   // defensive: never negative
    sfx.smart_bomb();
    addShake(12, 0.6);
    var killed = 0;
    var bonus = 0;
    var pcx = playerWorldX();
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (e.dead) continue;
      // visible-only: within half the screen width on either side
      var dx = worldDelta(pcx, e.worldX);
      if (Math.abs(dx) < LOGICAL_W * 0.55) {
        explodeEnemy(e, false);
        bonus += 50;
        killed++;
      }
    }
    state.score += bonus;
    if (killed > 0) {
      pushPopupAtScreen("SMART BOMB +" + bonus, LOGICAL_W / 2, LOGICAL_H / 2, "is-tetris");
    }
    state.enemyBullets.length = 0;
    state.mines.length = 0;
  }

  // -- Player ----------------------------------------------------------------
  function makePlayer() {
    return {
      worldX: WORLD_W * 0.5,            // world position
      y: LOGICAL_H * 0.5,
      vx: 0,                            // px/sec velocity
      vy: 0,
      facing: 1,                        // 1 = right, -1 = left
      w: PLAYER_W,
      h: PLAYER_H,
      rapidT: 0,
      multT: 0,
      tractorT: 0,
      shieldActive: false,
      dying: false,
      dyingT: 0,
      respawnT: 0,
      invuln: 0,
      thrusterFlame: 0      // 0..1 thruster glow level
    };
  }
  function playerWorldX() { return state.player.worldX; }

  // -- State init ------------------------------------------------------------
  var nextRunId = 1;
  function initState(opts) {
    opts = opts || {};
    state = {
      _runId: opts.runId || nextRunId++,
      stage: opts.stage || 1,
      maxStage: opts.maxStage || (opts.stage || 1),
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      smartBombs: opts.smartBombs != null ? opts.smartBombs : SMART_BOMBS_INIT,
      enemies: [],
      bullets: [],            // player bullets
      enemyBullets: [],
      mines: [],              // bomber mines
      scholars: [],
      powerups: [],
      particles: [],
      stars: opts.stars || generateStars(),
      mountains: opts.mountains || generateMountains(),
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      time: 0,
      player: makePlayer(),
      enemiesKilledTotal: opts.enemiesKilledTotal || 0,
      scholarsRescued: opts.scholarsRescued || 0,
      scholarsLost: opts.scholarsLost || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      best: opts.best || readBest(),
      questionedScholarIds: opts.questionedScholarIds || {},  // scholar ids that already asked a Q this stage
      stageClearTriggered: false,
      hitPauseUntil: 0,
      mutantSpawnQueue: 0,
      endReason: ""
    };
    populateStage();
  }

  function generateStars() {
    var stars = [];
    var layers = [
      { count: 70, speed: 0.05, size: [1, 2.0],   alpha: [0.18, 0.28] },
      { count: 50, speed: 0.18, size: [1.2, 2.5], alpha: [0.30, 0.46] },
      { count: 30, speed: 0.42, size: [1.5, 3.0], alpha: [0.50, 0.75] }
    ];
    for (var li = 0; li < layers.length; li++) {
      var layer = layers[li];
      for (var i = 0; i < layer.count; i++) {
        stars.push({
          worldX: Math.random() * WORLD_W,
          y: Math.random() * (GROUND_Y - RADAR_H - 30) + RADAR_H + 20,
          r: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
          a: layer.alpha[0] + Math.random() * (layer.alpha[1] - layer.alpha[0]),
          parallax: layer.speed,            // 0=fixed, 1=full scroll
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.4 + Math.random() * 1.0
        });
      }
    }
    return stars;
  }

  // Mountain ridge points around the world for parallax and surface decoration
  function generateMountains() {
    var pts = [];
    var step = 80;
    var segments = Math.ceil(WORLD_W / step);
    for (var i = 0; i <= segments; i++) {
      pts.push({
        worldX: i * step,
        h: 30 + Math.random() * 70 + (Math.sin(i * 0.6) * 18)
      });
    }
    return pts;
  }

  function populateStage() {
    var stage = state.stage;
    var roster = rosterForStage(stage);
    // Spawn scholars on surface, evenly spaced around the world
    var scholarSpacing = WORLD_W / SCHOLARS_PER_STAGE;
    for (var s = 0; s < SCHOLARS_PER_STAGE; s++) {
      var sx = wrap(scholarSpacing * s + Math.random() * scholarSpacing * 0.5);
      state.scholars.push({
        id: "s" + state.stage + "_" + s,
        worldX: sx,
        y: GROUND_Y - SCHOLAR_H * 0.5,
        vx: (Math.random() < 0.5 ? -1 : 1) * SCHOLAR_WALK_SPEED,
        state: "walking",     // walking | abducted | falling | rescued | lost | caught
        carrier: null,
        fallVy: 0
      });
    }
    // Spawn landers far from player
    for (var l = 0; l < roster.landers; l++) {
      spawnEnemy("lander", randomFarX(), 100 + Math.random() * 240);
    }
    for (var b = 0; b < roster.bombers; b++) {
      spawnEnemy("bomber", randomFarX(), 80 + Math.random() * 200);
    }
    for (var pp = 0; pp < roster.pods; pp++) {
      spawnEnemy("pod", randomFarX(), 80 + Math.random() * 200);
    }
  }

  function randomFarX() {
    var pcx = state ? playerWorldX() : 0;
    var x = pcx + (LOGICAL_W * 0.6 + Math.random() * (WORLD_W * 0.5 - LOGICAL_W * 0.6));
    if (Math.random() < 0.5) x = pcx - (LOGICAL_W * 0.6 + Math.random() * (WORLD_W * 0.5 - LOGICAL_W * 0.6));
    return wrap(x);
  }

  // -- Enemies ---------------------------------------------------------------
  function spawnEnemy(type, worldX, y) {
    var meta = ENEMY_TYPES[type];
    if (!meta) return null;
    var e = {
      type: type,
      hp: meta.hp,
      maxHp: meta.hp,
      worldX: wrap(worldX),
      y: y == null ? 100 + Math.random() * 200 : y,
      vx: (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 50),
      vy: 0,
      w: meta.w,
      h: meta.h,
      score: meta.score,
      mode: "patrol",     // patrol | seeking | abducting | rising | chasing | dead
      carriedScholar: null,
      hitFlashT: 0,
      ai: { t: 0, target: null, mineCd: 2 + Math.random() * 3, fireCd: 2 + Math.random() * 4 },
      dead: false
    };
    state.enemies.push(e);
    return e;
  }

  function spawnSwarmPodsFrom(parent) {
    // 4 swarm-pods scattering in 4 directions
    var dirs = [[1,-1],[1,1],[-1,-1],[-1,1]];
    for (var i = 0; i < 4; i++) {
      var e = spawnEnemy("swarm", parent.worldX, parent.y);
      if (!e) continue;
      e.vx = dirs[i][0] * (140 + Math.random() * 60);
      e.vy = dirs[i][1] * (60 + Math.random() * 60);
      e.mode = "chasing";
    }
  }

  // -- Update ----------------------------------------------------------------
  function update(dt) {
    if (phase !== "playing" && phase !== "stageClear" && phase !== "stageIntake" && phase !== "dying") return;

    state.time += dt;
    updatePlayer(dt);
    updateBullets(dt);
    updateScholars(dt);
    updateEnemies(dt);
    updateEnemyBullets(dt);
    updateMines(dt);
    updatePowerups(dt);
    updateParticles(dt);
    updateShake(dt);
    updateStars(dt);

    // Stage clear check: all aliens down (excluding swarm-pods? we'll require all enemies dead).
    if (phase === "playing" && !state.stageClearTriggered) {
      var anyAlive = false;
      for (var k = 0; k < state.enemies.length; k++) {
        if (!state.enemies[k].dead) { anyAlive = true; break; }
      }
      if (!anyAlive) {
        // Also require no scholars currently being abducted and rising
        var abductionInProgress = false;
        for (var s = 0; s < state.scholars.length; s++) {
          if (state.scholars[s].state === "abducted") { abductionInProgress = true; break; }
        }
        if (!abductionInProgress) onStageClear();
      }
    }

    // Player timers
    var pl = state.player;
    if (pl.rapidT > 0) pl.rapidT = Math.max(0, pl.rapidT - dt);
    if (pl.multT > 0) pl.multT = Math.max(0, pl.multT - dt);
    if (pl.tractorT > 0) pl.tractorT = Math.max(0, pl.tractorT - dt);
    if (pl.invuln > 0) pl.invuln = Math.max(0, pl.invuln - dt);
  }

  function updateStars(dt) {
    if (!state.stars) return;
    for (var i = 0; i < state.stars.length; i++) {
      var s = state.stars[i];
      s.twinkle += dt * s.twinkleSpeed;
    }
  }

  function updatePlayer(dt) {
    var p = state.player;
    if (p.dying) {
      p.dyingT += dt;
      return;
    }
    // Horizontal thrust
    var ax = 0;
    if (keys.left)  ax -= 1;
    if (keys.right) ax += 1;
    if (ax !== 0) {
      p.vx += ax * PLAYER_THRUST * dt;
      p.vx = clamp(p.vx, -PLAYER_MAX_SPEED_X, PLAYER_MAX_SPEED_X);
      p.facing = ax > 0 ? 1 : -1;
      p.thrusterFlame = Math.min(1, p.thrusterFlame + dt * 4);
      sfx.thrust_loop();
    } else {
      // Decelerate
      var d = Math.exp(-PLAYER_FRICTION_X * dt);
      p.vx *= d;
      p.thrusterFlame = Math.max(0, p.thrusterFlame - dt * 3);
    }

    // Vertical
    var vy = 0;
    if (keys.up)   vy -= PLAYER_VERT_SPEED;
    if (keys.down) vy += PLAYER_VERT_SPEED;
    p.vy = vy;

    p.worldX = wrap(p.worldX + p.vx * dt);
    p.y += p.vy * dt;
    p.y = clamp(p.y, RADAR_H + 20 + PLAYER_H * 0.5, GROUND_Y - PLAYER_H * 0.5 - 4);

    // Shooting
    if (keys.fire || touchFireHeld) {
      tryShoot();
    }
    // Bomb (one-shot per press handled in keydown)
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
    var dir = p.facing;
    state.bullets.push({
      worldX: wrap(p.worldX + dir * 24),
      y: p.y,
      vx: dir * PLAYER_BULLET_SPEED,
      life: PLAYER_BULLET_LIFE
    });
  }

  function updateBullets(dt) {
    for (var i = state.bullets.length - 1; i >= 0; i--) {
      var b = state.bullets[i];
      b.worldX = wrap(b.worldX + b.vx * dt);
      b.life -= dt;
      if (b.life <= 0) { state.bullets.splice(i, 1); continue; }
      // Collide with enemies
      var hit = false;
      for (var j = 0; j < state.enemies.length; j++) {
        var e = state.enemies[j];
        if (e.dead) continue;
        var ddx = worldDelta(b.worldX, e.worldX);
        var ddy = b.y - e.y;
        if (Math.abs(ddx) < e.w / 2 && Math.abs(ddy) < e.h / 2) {
          damageEnemy(e, 1);
          hit = true;
          break;
        }
      }
      if (hit) state.bullets.splice(i, 1);
    }
  }

  function damageEnemy(e, dmg) {
    e.hp -= dmg;
    e.hitFlashT = 0.10;
    if (e.hp <= 0) {
      explodeEnemy(e, false);
    } else {
      sfx.hit();
    }
  }

  function explodeEnemy(e, silent) {
    if (e.dead) return;
    e.dead = true;
    state.enemiesKilledTotal++;
    var pts = e.score;
    if (state.player.multT > 0) pts *= 2;
    state.score += pts;
    pushPopupAtWorld("+" + pts, e.worldX, e.y - 18, "is-score");

    // Type-specific FX
    if (!silent) {
      if (e.type === "lander") sfx.kill_lander();
      else if (e.type === "mutant") sfx.kill_mutant();
      else if (e.type === "bomber") sfx.kill_bomber();
      else if (e.type === "pod" || e.type === "swarm") sfx.kill_pod();
    }
    addShake(e.type === "bomber" ? 4 : 2, 0.12);
    var color = ENEMY_TYPES[e.type].color;
    burstAtWorld(e.worldX, e.y, color, e.type === "bomber" ? 14 : 8);

    // If carrying a scholar, drop them (falling)
    if (e.carriedScholar) {
      var sch = e.carriedScholar;
      sch.state = "falling";
      sch.fallVy = 0;
      sch.carrier = null;
      e.carriedScholar = null;
    }

    // Pod splits into 4 swarm pods
    if (e.type === "pod") {
      spawnSwarmPodsFrom(e);
    }

    // Drop powerup
    if (e.type !== "swarm") maybeDropPowerupAt(e.worldX, e.y);
    checkBonusLife();
  }

  function updateScholars(dt) {
    for (var i = state.scholars.length - 1; i >= 0; i--) {
      var s = state.scholars[i];
      if (s.state === "rescued" || s.state === "lost") {
        // remove from active list
        state.scholars.splice(i, 1);
        continue;
      }
      if (s.state === "walking") {
        s.worldX = wrap(s.worldX + s.vx * dt);
        if (Math.random() < 0.005) s.vx = -s.vx;
        // Tractor beam: if active and near player + scholar is also falling? walking scholars not auto-grabbed.
      } else if (s.state === "abducted" && s.carrier) {
        // Carrier moves us; copy carrier position
        s.worldX = s.carrier.worldX;
        s.y = s.carrier.y + s.carrier.h * 0.5 + SCHOLAR_H * 0.5 + 4;
      } else if (s.state === "falling") {
        s.fallVy += SCHOLAR_FALL_GRAV * dt;
        s.fallVy = Math.min(s.fallVy, SCHOLAR_FALL_SPEED_MAX);
        s.y += s.fallVy * dt;
        // Tractor pulls scholar toward player
        if (state.player.tractorT > 0) {
          var dpx = worldDelta(s.worldX, state.player.worldX);
          var dpy = state.player.y - s.y;
          var dist = Math.hypot(dpx, dpy);
          if (dist < TRACTOR_RANGE) {
            var pullFx = (dpx / Math.max(1, dist)) * 220 * dt;
            var pullFy = (dpy / Math.max(1, dist)) * 220 * dt;
            s.worldX = wrap(s.worldX + pullFx);
            s.y += pullFy;
          }
        }
        // Catch by player
        if (state.player.invuln <= 0) {
          var dx = worldDelta(s.worldX, state.player.worldX);
          var dy = s.y - state.player.y;
          if (Math.abs(dx) < (PLAYER_W / 2 + SCHOLAR_W / 2) && Math.abs(dy) < (PLAYER_H / 2 + SCHOLAR_H / 2)) {
            // Caught!
            sfx.catch_scholar();
            pushPopupAtWorld("+500 CATCH", s.worldX, s.y - 18, "is-score");
            state.score += 500;
            s.state = "caught";
          }
        }
        // Reach ground without catch -> safe walking again
        if (s.y >= GROUND_Y - SCHOLAR_H * 0.5) {
          s.y = GROUND_Y - SCHOLAR_H * 0.5;
          s.vx = (Math.random() < 0.5 ? -1 : 1) * SCHOLAR_WALK_SPEED;
          s.state = "walking";
          s.fallVy = 0;
        }
      } else if (s.state === "caught") {
        // Held briefly then dropped at ground for full rescue
        // Fly with player toward ground if low; immediate trigger of rescue once player is near ground OR after a short delay
        // Implementation: stay attached to player's underside, then trigger rescue on landing or after 1.5s
        s.worldX = state.player.worldX;
        s.y = state.player.y + PLAYER_H * 0.5 + SCHOLAR_H * 0.5;
        s._caughtT = (s._caughtT || 0) + dt;
        // Auto-rescue when player lowers near ground OR after delay
        if (state.player.y > GROUND_Y - 100 || s._caughtT > 1.6) {
          rescueScholar(s);
        }
      }
    }
  }

  function rescueScholar(s) {
    if (!s || s.state === "rescued" || s.state === "lost") return;
    if (state.questionedScholarIds[s.id]) {
      // already triggered earlier — just mark as rescued silently
      s.state = "rescued";
      s.carrier = null;
      sfx.scholar_grab();
      pushPopupAtWorld("RESCUED", s.worldX, s.y - 18, "is-bonus");
      state.scholarsRescued++;
      return;
    }
    state.scholarsRescued++;
    state.questionedScholarIds[s.id] = true;
    s.state = "rescued";
    s.carrier = null;
    sfx.scholar_grab();
    pushPopupAtWorld("SCHOLAR RESCUED", s.worldX, s.y - 18, "is-bonus");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 18, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
      }
    } catch (er) {}
    // Guard: only open the modal if we aren't already showing one (e.g., back-to-back catches).
    if (phase !== "question" && !activeQuestion) openScholarQuestion();
  }

  function loseScholar(s, opts) {
    if (!s || s.state === "lost") return;
    s.state = "lost";
    s.carrier = null;
    state.scholarsLost++;
    state.score = Math.max(0, state.score - SCHOLAR_LOST_PENALTY);
    sfx.scholar_lost();
    addShake(6, 0.3);
    pushPopupAtScreen("SCHOLAR LOST -" + SCHOLAR_LOST_PENALTY, LOGICAL_W / 2, 90, "is-warn");
    // Spawn a Mutant from where the scholar was abducted (Defender canon).
    // Skip the spawn when the lander itself is transmuting into a mutant — otherwise we'd get two.
    var skipMutantSpawn = !!(opts && opts.skipMutantSpawn);
    if (!skipMutantSpawn) {
      var m = spawnEnemy("mutant", s.worldX, RADAR_H + 40);
      if (m) {
        m.mode = "chasing";
        m.vx = (Math.random() < 0.5 ? -1 : 1) * 80;
      }
      sfx.mutant_birth();
    }
  }

  function updateEnemies(dt) {
    var pcx = playerWorldX();
    var pcy = state.player.y;
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (e.dead) {
        state.enemies.splice(i, 1);
        continue;
      }
      if (e.hitFlashT > 0) e.hitFlashT = Math.max(0, e.hitFlashT - dt);
      e.ai.t += dt;
      if (e.type === "lander")  updateLander(e, dt, pcx, pcy);
      else if (e.type === "mutant") updateMutant(e, dt, pcx, pcy);
      else if (e.type === "bomber") updateBomber(e, dt, pcx, pcy);
      else if (e.type === "pod")    updatePod(e, dt, pcx, pcy);
      else if (e.type === "swarm")  updateSwarm(e, dt, pcx, pcy);

      // Player collision (skip if invuln)
      if (!state.player.dying && state.player.invuln <= 0) {
        var ddx = worldDelta(e.worldX, state.player.worldX);
        var ddy = state.player.y - e.y;
        if (Math.abs(ddx) < (PLAYER_W / 2 + e.w / 2) * 0.85 &&
            Math.abs(ddy) < (PLAYER_H / 2 + e.h / 2) * 0.85) {
          // Hit!
          playerHit();
          explodeEnemy(e, false);
        }
      }
    }
  }

  function updateLander(e, dt, pcx, pcy) {
    // Lander: drift, occasionally seek a scholar to abduct.
    // If carrying scholar -> "rising" mode going straight up.
    if (e.mode === "rising" && e.carriedScholar) {
      e.vy = -90;
      e.y += e.vy * dt;
      // Drift slightly horizontal
      e.worldX = wrap(e.worldX + e.vx * 0.3 * dt);
      // If reached top (sky), scholar lost + lander becomes mutant
      if (e.y < SKY_TOP) {
        var sch = e.carriedScholar;
        e.carriedScholar = null;
        // Pass skipMutantSpawn — the lander itself transmutes, so don't double-spawn.
        loseScholar(sch, { skipMutantSpawn: true });
        // The lander itself transmutes into a mutant
        e.type = "mutant";
        var meta = ENEMY_TYPES.mutant;
        e.hp = meta.hp; e.maxHp = meta.hp; e.w = meta.w; e.h = meta.h; e.score = meta.score;
        e.mode = "chasing";
        e.y = SKY_TOP + 4;            // nudge below ceiling so transmuted mutant is visible
        e.vy = 0;
        sfx.mutant_birth();           // still announce the transmute
      }
      return;
    }
    if (e.mode === "abducting" && e.carriedScholar) {
      // Slowly pull scholar up
      var sch2 = e.carriedScholar;
      e.y -= 30 * dt;
      sch2.y = e.y + e.h * 0.5 + SCHOLAR_H * 0.5 + 4;
      sch2.worldX = e.worldX;
      // If we got high enough, switch to rising
      if (e.y < GROUND_Y - 200) {
        e.mode = "rising";
      }
      return;
    }
    // Patrolling: bob, drift, occasionally swoop down to grab a nearby scholar
    e.y += Math.sin(e.ai.t * 1.2) * 8 * dt;
    e.worldX = wrap(e.worldX + e.vx * dt);
    // Reverse occasionally
    if (Math.random() < 0.005) e.vx = -e.vx;

    // Choose target scholar: nearest within range and walking
    if (e.mode !== "seeking" && Math.random() < 0.005) {
      var sch3 = nearestWalkingScholar(e);
      if (sch3) {
        e.mode = "seeking";
        e.ai.target = sch3.id;
      }
    }
    if (e.mode === "seeking") {
      var sch4 = scholarById(e.ai.target);
      if (!sch4 || sch4.state !== "walking") {
        e.mode = "patrol";
        e.ai.target = null;
      } else {
        // Move toward target
        var dx = worldDelta(e.worldX, sch4.worldX);
        e.vx = clamp(dx * 1.2, -120, 120);
        e.worldX = wrap(e.worldX + e.vx * dt);
        e.y += 80 * dt;
        if (e.y > GROUND_Y - 90) {
          // Capture scholar if close
          var dxNow = worldDelta(e.worldX, sch4.worldX);
          if (Math.abs(dxNow) < 20 && Math.abs(e.y - sch4.y) < 90) {
            sch4.state = "abducted";
            sch4.carrier = e;
            e.carriedScholar = sch4;
            e.mode = "abducting";
          }
        }
      }
    }
    // Random fire when in view
    var meta = ENEMY_TYPES.lander;
    var visible = Math.abs(worldDelta(playerWorldX(), e.worldX)) < LOGICAL_W * 0.5 + 60;
    if (visible && Math.random() < meta.fireChance && !state.player.dying) {
      fireEnemyBulletAt(e, state.player.worldX, state.player.y);
    }
  }

  function updateMutant(e, dt, pcx, pcy) {
    // Mutant: erratic chase
    var dx = worldDelta(e.worldX, pcx);
    var dy = pcy - e.y;
    var len = Math.hypot(dx, dy) || 1;
    var ax = (dx / len) * 280;
    var ay = (dy / len) * 220;
    // erratic jitter
    ax += Math.sin(e.ai.t * 4 + 2) * 60;
    ay += Math.cos(e.ai.t * 3.7) * 50;
    e.vx = clamp(e.vx + ax * dt, -260, 260);
    e.vy = clamp(e.vy + ay * dt, -200, 200);
    e.worldX = wrap(e.worldX + e.vx * dt);
    e.y += e.vy * dt;
    e.y = clamp(e.y, RADAR_H + 20, GROUND_Y - 30);
    var meta = ENEMY_TYPES.mutant;
    var visible = Math.abs(worldDelta(playerWorldX(), e.worldX)) < LOGICAL_W * 0.5 + 60;
    if (visible && Math.random() < meta.fireChance && !state.player.dying) {
      fireEnemyBulletAt(e, state.player.worldX, state.player.y);
    }
  }

  function updateBomber(e, dt, pcx, pcy) {
    e.worldX = wrap(e.worldX + e.vx * dt);
    e.y += Math.sin(e.ai.t * 0.6) * 12 * dt;
    if (Math.random() < 0.003) e.vx = -e.vx;
    // Drop mines on a cooldown
    e.ai.mineCd -= dt;
    if (e.ai.mineCd <= 0) {
      e.ai.mineCd = 3 + Math.random() * 3;
      // Only drop in view
      var visible = Math.abs(worldDelta(playerWorldX(), e.worldX)) < LOGICAL_W * 0.6;
      if (visible) {
        state.mines.push({
          worldX: e.worldX,
          y: e.y + e.h * 0.5,
          life: BOMBER_MINE_LIFE,
          radius: 7,
          spin: Math.random() * Math.PI * 2
        });
      }
    }
    // Occasional shot
    var meta = ENEMY_TYPES.bomber;
    var vis = Math.abs(worldDelta(playerWorldX(), e.worldX)) < LOGICAL_W * 0.5 + 60;
    if (vis && Math.random() < meta.fireChance && !state.player.dying) {
      fireEnemyBulletAt(e, state.player.worldX, state.player.y);
    }
  }

  function updatePod(e, dt, pcx, pcy) {
    e.worldX = wrap(e.worldX + e.vx * dt);
    e.y += Math.sin(e.ai.t * 0.9 + e.worldX * 0.001) * 16 * dt;
    if (Math.random() < 0.004) e.vx = -e.vx;
  }

  function updateSwarm(e, dt, pcx, pcy) {
    // Mini swarm-pods chase the player loosely
    var dx = worldDelta(e.worldX, pcx);
    var dy = pcy - e.y;
    var len = Math.hypot(dx, dy) || 1;
    e.vx = clamp(e.vx + (dx / len) * 80 * dt, -180, 180);
    e.vy = clamp(e.vy + (dy / len) * 80 * dt, -160, 160);
    e.worldX = wrap(e.worldX + e.vx * dt);
    e.y += e.vy * dt;
    e.y = clamp(e.y, RADAR_H + 20, GROUND_Y - 14);
  }

  function nearestWalkingScholar(e) {
    var best = null, bestD = Infinity;
    for (var i = 0; i < state.scholars.length; i++) {
      var s = state.scholars[i];
      if (s.state !== "walking") continue;
      var d = Math.abs(worldDelta(e.worldX, s.worldX));
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }
  function scholarById(id) {
    for (var i = 0; i < state.scholars.length; i++) {
      if (state.scholars[i].id === id) return state.scholars[i];
    }
    return null;
  }

  function fireEnemyBulletAt(e, tx, ty) {
    var dx = worldDelta(e.worldX, tx);
    var dy = ty - e.y;
    var len = Math.hypot(dx, dy) || 1;
    state.enemyBullets.push({
      worldX: e.worldX,
      y: e.y,
      vx: (dx / len) * ENEMY_BULLET_SPEED,
      vy: (dy / len) * ENEMY_BULLET_SPEED,
      life: 2.0
    });
  }

  function updateEnemyBullets(dt) {
    var p = state.player;
    for (var i = state.enemyBullets.length - 1; i >= 0; i--) {
      var b = state.enemyBullets[i];
      b.worldX = wrap(b.worldX + b.vx * dt);
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < 0 || b.y > GROUND_Y + 4) {
        state.enemyBullets.splice(i, 1);
        continue;
      }
      if (!p.dying && p.invuln <= 0) {
        var dx = worldDelta(b.worldX, p.worldX);
        var dy = b.y - p.y;
        if (Math.abs(dx) < PLAYER_W / 2 && Math.abs(dy) < PLAYER_H / 2) {
          playerHit();
          state.enemyBullets.splice(i, 1);
        }
      }
    }
  }

  function updateMines(dt) {
    var p = state.player;
    for (var i = state.mines.length - 1; i >= 0; i--) {
      var m = state.mines[i];
      m.life -= dt;
      m.spin += dt * 2;
      if (m.life <= 0) {
        state.mines.splice(i, 1);
        continue;
      }
      // Player collide
      if (!p.dying && p.invuln <= 0) {
        var dx = worldDelta(m.worldX, p.worldX);
        var dy = m.y - p.y;
        if (Math.abs(dx) < PLAYER_W / 2 && Math.abs(dy) < PLAYER_H / 2 + m.radius) {
          playerHit();
          burstAtWorld(m.worldX, m.y, "#d04848", 12);
          state.mines.splice(i, 1);
          continue;
        }
      }
      // Player bullet collide
      for (var j = state.bullets.length - 1; j >= 0; j--) {
        var bl = state.bullets[j];
        var bdx = worldDelta(bl.worldX, m.worldX);
        if (Math.abs(bdx) < m.radius && Math.abs(bl.y - m.y) < m.radius) {
          burstAtWorld(m.worldX, m.y, "#d04848", 8);
          state.bullets.splice(j, 1);
          state.mines.splice(i, 1);
          sfx.kill_lander();
          break;
        }
      }
    }
  }

  function playerHit() {
    var p = state.player;
    if (p.shieldActive) {
      p.shieldActive = false;
      p.invuln = 1.0;
      sfx.kill_lander();
      addShake(4, 0.2);
      pushPopupAtScreen("SHIELD BROKEN", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-bonus");
      burstAtWorld(p.worldX, p.y, "#5de0f0", 14);
      return;
    }
    sfx.life_lost();
    addShake(7, 0.4);
    p.dying = true;
    p.dyingT = 0;
    state.lives--;
    burstAtWorld(p.worldX, p.y, "#7ff5ff", 14);
    burstAtWorld(p.worldX, p.y, "#f5c451", 8);
    if (state.lives <= 0) {
      phase = "dying";
      var runIdGo = state ? state._runId : 0;
      scheduleTimeout(function () {
        if (!state || state._runId !== runIdGo) return;
        gameOver();
      }, 1100);
    } else {
      phase = "dying";
      var runIdResp = state ? state._runId : 0;
      scheduleTimeout(function () {
        if (!state || state._runId !== runIdResp) return;
        if (phase !== "dying") return;
        respawnPlayer();
        phase = "playing";
      }, PLAYER_RESPAWN_DELAY_MS);
    }
  }

  function respawnPlayer() {
    var prev = {
      rapidT: state.player.rapidT,
      multT: state.player.multT,
      tractorT: state.player.tractorT
    };
    var oldX = state.player.worldX;
    state.player = makePlayer();
    state.player.worldX = oldX;
    state.player.y = LOGICAL_H * 0.5;
    state.player.invuln = PLAYER_INVULN_S;
    state.player.rapidT = prev.rapidT;
    state.player.multT = prev.multT;
    state.player.tractorT = prev.tractorT;
  }

  // -- Stage progression -----------------------------------------------------
  function onStageClear() {
    if (state.stageClearTriggered) return;
    state.stageClearTriggered = true;
    sfx.level_clear();
    addShake(6, 0.5);
    // Count surviving scholars (rescued + walking + falling that landed safely + caught are NOT lost)
    // We track scholarsRescued throughout; surviving = SCHOLARS_PER_STAGE - scholarsLost (this stage)
    var startedLost = state._stageStartScholarsLost || 0;
    var thisStageLost = state.scholarsLost - startedLost;
    var surviving = Math.max(0, SCHOLARS_PER_STAGE - thisStageLost);
    var stageBonus = 1000 * state.stage;
    var rescueBonus = surviving * STAGE_CLEAR_BONUS_PER_SCHOLAR;
    state.score += stageBonus + rescueBonus;
    state.lives++;
    state.smartBombs = Math.min(9, state.smartBombs + 1);
    pushPopupAtScreen("STAGE " + state.stage + " CLEAR!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopupAtScreen("+" + (stageBonus + rescueBonus) + " bonus", LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    pushPopupAtScreen("+1 LIFE  +1 BOMB", LOGICAL_W / 2, LOGICAL_H / 2 + 56, "is-bonus");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#a991ff", "#f072d4"] });
      }
    } catch (e) {}
    phase = "stageClear";
    saveSnapshot();
    var runIdSc = state._runId;
    scheduleTimeout(function () {
      if (!state || state._runId !== runIdSc) return;
      if (phase !== "stageClear") return;
      var nextStage = state.stage + 1;
      var carry = {
        runId: state._runId,             // preserve run id across stages
        stage: nextStage,
        maxStage: Math.max(state.maxStage, nextStage),
        score: state.score,
        lives: state.lives,
        smartBombs: state.smartBombs,
        enemiesKilledTotal: state.enemiesKilledTotal,
        scholarsRescued: state.scholarsRescued,
        scholarsLost: state.scholarsLost,
        shardsAwarded: state.shardsAwarded,
        questionsAnsweredCorrect: state.questionsAnsweredCorrect,
        questionsAnsweredTotal: state.questionsAnsweredTotal,
        best: state.best,
        stars: state.stars,
        mountains: state.mountains,
        questionedScholarIds: {}    // reset per stage
      };
      initState(carry);
      state._stageStartScholarsLost = state.scholarsLost;
      phase = "playing";
    }, 1700);
  }

  function checkBonusLife() {
    var threshold = Math.floor(state.score / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    if (threshold > lastBonusLifeThreshold && threshold >= BONUS_LIFE_THRESHOLD) {
      lastBonusLifeThreshold = threshold;
      state.lives++;
      pushPopupAtScreen("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 - 80, "is-bonus");
      sfx.powerup_pickup();
    }
  }

  // -- Powerups update -------------------------------------------------------
  function updatePowerups(dt) {
    var p = state.player;
    for (var i = state.powerups.length - 1; i >= 0; i--) {
      var pu = state.powerups[i];
      pu.y += pu.vy * dt;
      pu.bob += dt * 3;
      pu.life -= dt;
      if (pu.y > GROUND_Y - 10) { pu.y = GROUND_Y - 10; pu.vy = 0; }
      if (pu.life <= 0) {
        state.powerups.splice(i, 1);
        continue;
      }
      if (!p.dying) {
        var dx = worldDelta(pu.worldX, p.worldX);
        var dy = pu.y - p.y;
        if (Math.abs(dx) < (PLAYER_W / 2 + 16) && Math.abs(dy) < (PLAYER_H / 2 + 16)) {
          applyPowerup(pu);
          state.powerups.splice(i, 1);
        }
      }
    }
  }

  // -- Particles + popups + shake -------------------------------------------
  function burstAtWorld(worldX, y, color, count) {
    if (reducedMotion) return;
    count = count || 6;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 140;
      state.particles.push({
        worldX: worldX,
        y: y,
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
      p.worldX = wrap(p.worldX + p.vx * dt);
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }
  function pushPopupAtScreen(text, x, y, kls) {
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
  function pushPopupAtWorld(text, worldX, y, kls) {
    // Convert world coordinates to screen coordinates
    var pcx = playerWorldX();
    var dx = worldDelta(pcx, worldX);
    var sx = PLAYER_SCREEN_X + dx;
    if (sx < 0 || sx > LOGICAL_W) return; // off-screen
    pushPopupAtScreen(text, sx, y, kls);
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
    drawMountains();
    drawGround();
    drawScholars();
    drawPowerups();
    drawMines();
    drawEnemies();
    drawEnemyBullets();
    drawPlayer();
    drawBullets();
    drawParticles();
    drawHUDOverlays();    // mini-radar and other overlays in canvas-space

    ctx.restore();
  }

  function drawBackground() {
    // Editorial planet sky with magenta haze near horizon
    ctx.fillStyle = "#040912";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    var glow = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    glow.addColorStop(0, "rgba(8,18,40,0.55)");
    glow.addColorStop(0.65, "rgba(20,18,52,0.30)");
    glow.addColorStop(1, "rgba(60,30,80,0.55)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, GROUND_Y);
  }

  function drawStars() {
    if (!state.stars) return;
    var pcx = playerWorldX();
    for (var i = 0; i < state.stars.length; i++) {
      var s = state.stars[i];
      // Parallax: stars at parallax=0 don't scroll; parallax=1 = full scroll.
      // Convert world position to viewport coord, accounting for parallax-scaled camera.
      var rel = worldDelta(pcx * s.parallax, s.worldX);
      var screenX = PLAYER_SCREEN_X + rel;
      if (!isFinite(screenX) || screenX < -2 || screenX > LOGICAL_W + 2) continue;
      var tw = reducedMotion ? 1 : (0.6 + 0.4 * Math.abs(Math.sin(s.twinkle)));
      ctx.fillStyle = "rgba(255,255,255," + (s.a * tw) + ")";
      ctx.fillRect(screenX - s.r / 2, s.y - s.r / 2, s.r, s.r);
    }
  }

  function drawMountains() {
    // Far ridge: parallax ~0.3
    drawRidge(0.3, GROUND_Y - 10, 0.5, "#1a1638");
    drawRidge(0.6, GROUND_Y - 5, 0.7, "#2a2050");
  }
  function drawRidge(parallax, baseY, scale2, color) {
    var pcx = playerWorldX();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-10, GROUND_Y);
    var pts = state.mountains;
    var step = LOGICAL_W / 6;
    for (var i = -1; i < 8; i++) {
      // Sample mountain at world position (pcx + (i*step - LOGICAL_W*0.5))
      var wx = pcx * parallax + (i * step) - LOGICAL_W * 0.5;
      // pick nearest mountain point
      var idx = Math.floor(wrap(wx) / 80) % pts.length;
      var pt = pts[idx];
      var sx = (i * step) - LOGICAL_W * 0.5 * 0;
      ctx.lineTo(sx, baseY - pt.h * scale2);
    }
    ctx.lineTo(LOGICAL_W + 10, GROUND_Y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawGround() {
    // The planet surface
    var ggrad = ctx.createLinearGradient(0, GROUND_Y - 4, 0, LOGICAL_H);
    ggrad.addColorStop(0, "#3a2050");
    ggrad.addColorStop(0.4, "#1a1030");
    ggrad.addColorStop(1, "#0a0618");
    ctx.fillStyle = ggrad;
    ctx.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H - GROUND_Y);
    // Gold horizon line
    ctx.strokeStyle = "rgba(245,196,81,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(LOGICAL_W, GROUND_Y);
    ctx.stroke();
    // Brick-like terrain pattern
    var pcx = playerWorldX();
    ctx.fillStyle = "rgba(245,196,81,0.10)";
    for (var bx = -((pcx * 1) % 28) - 28; bx < LOGICAL_W + 28; bx += 28) {
      ctx.fillRect(bx, GROUND_Y + 2, 14, 2);
    }
  }

  function drawScholars() {
    var pcx = playerWorldX();
    for (var i = 0; i < state.scholars.length; i++) {
      var s = state.scholars[i];
      var rel = worldDelta(pcx, s.worldX);
      var sx = PLAYER_SCREEN_X + rel;
      if (sx < -20 || sx > LOGICAL_W + 20) continue;
      drawScholar(s, sx);
    }
  }

  function drawScholar(s, sx) {
    var sy = s.y;
    ctx.save();
    ctx.translate(sx, sy);
    // Body — small cyan-and-gold figure
    ctx.fillStyle = "#f5c451";
    ctx.fillRect(-3, -SCHOLAR_H / 2, 6, 4);   // head (gold)
    ctx.fillStyle = "#5de0f0";
    ctx.fillRect(-4, -SCHOLAR_H / 2 + 4, 8, 8);  // body (cyan robe)
    ctx.fillStyle = "#1a1630";
    ctx.fillRect(-3, -SCHOLAR_H / 2 + 12, 2, 6); // leg
    ctx.fillRect(1, -SCHOLAR_H / 2 + 12, 2, 6);  // leg
    // glow when not abducted
    if (s.state === "walking" && !reducedMotion) {
      ctx.shadowColor = "#5de0f0";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#7ff5ff";
      ctx.fillRect(-4, -SCHOLAR_H / 2 + 4, 8, 1);
    }
    if (s.state === "abducted" && !reducedMotion) {
      // tractor beam from carrier going up
      ctx.strokeStyle = "rgba(240,114,212,0.45)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -40);
      ctx.stroke();
    }
    if (s.state === "falling" && !reducedMotion) {
      ctx.fillStyle = "rgba(245,196,81,0.4)";
      ctx.beginPath();
      ctx.arc(0, -2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemies() {
    var pcx = playerWorldX();
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.dead) continue;
      var rel = worldDelta(pcx, e.worldX);
      var sx = PLAYER_SCREEN_X + rel;
      if (sx < -40 || sx > LOGICAL_W + 40) continue;
      ctx.save();
      ctx.translate(sx, e.y);
      if (e.hitFlashT > 0) ctx.globalAlpha = 0.85;
      if (e.type === "lander") drawLander(e);
      else if (e.type === "mutant") drawMutant(e);
      else if (e.type === "bomber") drawBomber(e);
      else if (e.type === "pod") drawPod(e);
      else if (e.type === "swarm") drawSwarm(e);
      ctx.restore();
    }
  }

  function drawLander(e) {
    // Pink wedge with twin landing prongs
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 14, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    var grad = ctx.createLinearGradient(0, -10, 0, 10);
    grad.addColorStop(0, "#ffd2e8");
    grad.addColorStop(0.5, "#f07bb8");
    grad.addColorStop(1, "#a14080");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(-13, 4);
    ctx.lineTo(-7, 8);
    ctx.lineTo(7, 8);
    ctx.lineTo(13, 4);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = "#1a2040";
    ctx.beginPath();
    ctx.ellipse(0, -2, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5de0f0";
    ctx.beginPath();
    ctx.ellipse(0, -2, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Landing prongs
    ctx.strokeStyle = "#7ff5ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-9, 8); ctx.lineTo(-12, 11);
    ctx.moveTo(9, 8);  ctx.lineTo(12, 11);
    ctx.stroke();
    // Carried-scholar tractor beam
    if (e.carriedScholar) {
      ctx.fillStyle = "rgba(240,114,212,0.30)";
      ctx.beginPath();
      ctx.moveTo(-7, 8);
      ctx.lineTo(-12, 30);
      ctx.lineTo(12, 30);
      ctx.lineTo(7, 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawMutant(e) {
    // Erratic violet zigzag
    var t = state.time * 6 + e.ai.t * 2;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    var grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    grad.addColorStop(0, "#dccfff");
    grad.addColorStop(0.6, "#a991ff");
    grad.addColorStop(1, "#5e4a9c");
    ctx.fillStyle = grad;
    // 6-point wobble shape
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var ang = i / 6 * Math.PI * 2 + t * 0.3;
      var rad = 11 + Math.sin(t + i) * 2;
      var px = Math.cos(ang) * rad;
      var py = Math.sin(ang) * rad * 0.9;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = "#1a1232";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff86e8";
    ctx.beginPath();
    ctx.arc(0.5, -0.5, 2, 0, Math.PI * 2);
    ctx.fill();
    if (e.hp < e.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(-10, -16, 20, 2);
      ctx.fillStyle = "#a991ff";
      ctx.fillRect(-10, -16, 20 * (e.hp / e.maxHp), 2);
    }
  }

  function drawBomber(e) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 18, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    var grad = ctx.createLinearGradient(0, -14, 0, 14);
    grad.addColorStop(0, "#ff8888");
    grad.addColorStop(0.5, "#d04848");
    grad.addColorStop(1, "#6a1818");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-16, 2);
    ctx.lineTo(-12, 8);
    ctx.lineTo(-4, 4);
    ctx.lineTo(4, 4);
    ctx.lineTo(12, 8);
    ctx.lineTo(16, 2);
    ctx.closePath();
    ctx.fill();
    // Bomb bay
    ctx.fillStyle = "#1a0a0a";
    ctx.fillRect(-5, 6, 10, 4);
    // Cockpit
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.ellipse(0, -3, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (e.hp < e.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(-12, -18, 24, 2);
      ctx.fillStyle = "#d04848";
      ctx.fillRect(-12, -18, 24 * (e.hp / e.maxHp), 2);
    }
  }

  function drawPod(e) {
    // Emerald oval that pulses
    var pulse = reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(state.time * 4);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    var grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 16);
    grad.addColorStop(0, "#a8ffd4");
    grad.addColorStop(0.6, "#4dd49b");
    grad.addColorStop(1, "#1f6648");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 * pulse, 14 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    // Center "egg"
    ctx.fillStyle = "#1a3024";
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6dffc4";
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (e.hp < e.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(-12, -18, 24, 2);
      ctx.fillStyle = "#4dd49b";
      ctx.fillRect(-12, -18, 24 * (e.hp / e.maxHp), 2);
    }
  }

  function drawSwarm(e) {
    // Tiny green darts
    ctx.fillStyle = "#6dffc4";
    if (!reducedMotion) {
      ctx.shadowColor = "#6dffc4";
      ctx.shadowBlur = 6;
    }
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#1a3a28";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMines() {
    var pcx = playerWorldX();
    for (var i = 0; i < state.mines.length; i++) {
      var m = state.mines[i];
      var rel = worldDelta(pcx, m.worldX);
      var sx = PLAYER_SCREEN_X + rel;
      if (sx < -10 || sx > LOGICAL_W + 10) continue;
      ctx.save();
      ctx.translate(sx, m.y);
      ctx.rotate(m.spin);
      // pulsing red
      var p = 0.7 + 0.3 * Math.abs(Math.sin(state.time * 8));
      if (!reducedMotion) {
        ctx.shadowColor = "#d04848";
        ctx.shadowBlur = 10 * p;
      }
      ctx.fillStyle = "#d04848";
      ctx.beginPath();
      ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff8c4";
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      // Spikes
      ctx.strokeStyle = "#1a0808";
      ctx.lineWidth = 1.5;
      for (var j = 0; j < 6; j++) {
        var ang = j / 6 * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * m.radius, Math.sin(ang) * m.radius);
        ctx.lineTo(Math.cos(ang) * (m.radius + 4), Math.sin(ang) * (m.radius + 4));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawPlayer() {
    var p = state.player;
    if (p.dying) { drawDyingPlayer(p); return; }
    if (p.invuln > 0 && Math.floor(state.time * 16) % 2 === 0) return;
    var sx = PLAYER_SCREEN_X;
    drawShip(sx, p.y, p.facing, p.thrusterFlame);
    if (p.shieldActive) {
      ctx.save();
      ctx.strokeStyle = "#5de0f0";
      ctx.lineWidth = 2;
      if (!reducedMotion) {
        ctx.shadowColor = "#5de0f0";
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.arc(sx, p.y, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Tractor beam visualization
    if (p.tractorT > 0 && !reducedMotion) {
      ctx.save();
      ctx.strokeStyle = "rgba(93,224,240,0.20)";
      ctx.fillStyle = "rgba(93,224,240,0.10)";
      ctx.beginPath();
      ctx.arc(sx, p.y, TRACTOR_RANGE, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, p.y, TRACTOR_RANGE, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Score multiplier badge
    if (p.multT > 0 && !reducedMotion) {
      ctx.save();
      ctx.fillStyle = "#f5c451";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("x2", sx, p.y + 32);
      ctx.restore();
    }
  }

  function drawShip(cx, cy, facing, flameLevel) {
    ctx.save();
    ctx.translate(cx, cy);
    if (facing < 0) ctx.scale(-1, 1);
    // engine glow at tail
    var flame = clamp(flameLevel || 0, 0, 1);
    if (!reducedMotion) {
      var eg = ctx.createRadialGradient(-22, 0, 0, -22, 0, 14 + flame * 8);
      eg.addColorStop(0, "rgba(127,245,255," + (0.55 + flame * 0.4) + ")");
      eg.addColorStop(1, "rgba(127,245,255,0)");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(-22, 0, 14 + flame * 8, 0, Math.PI * 2);
      ctx.fill();
      // hot core
      ctx.fillStyle = "rgba(255,255,255," + (0.5 + flame * 0.4) + ")";
      ctx.beginPath();
      ctx.ellipse(-22, 0, 5 + flame * 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // hull (chrome with cyan trim)
    var hg = ctx.createLinearGradient(0, -10, 0, 10);
    hg.addColorStop(0, "#e8eef8");
    hg.addColorStop(0.5, "#b6c0d0");
    hg.addColorStop(1, "#5e6878");
    ctx.fillStyle = hg;
    // arrow shape pointing right
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(8, -8);
    ctx.lineTo(-16, -8);
    ctx.lineTo(-20, -4);
    ctx.lineTo(-20, 4);
    ctx.lineTo(-16, 8);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();
    // canopy
    ctx.fillStyle = "#5de0f0";
    ctx.beginPath();
    ctx.ellipse(4, 0, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(2, -1.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // wing tips magenta
    ctx.fillStyle = "#f072d4";
    ctx.fillRect(-14, -10, 4, 3);
    ctx.fillRect(-14, 7, 4, 3);
    // gun barrel
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(18, -1, 4, 2);
    ctx.restore();
  }

  function drawDyingPlayer(p) {
    var t = Math.min(1, p.dyingT);
    var sx = PLAYER_SCREEN_X;
    ctx.save();
    ctx.translate(sx, p.y);
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.scale(1 + t * 0.6, 1 + t * 0.6);
    ctx.rotate(t * 4);
    drawShip(0, 0, p.facing, 0);
    ctx.restore();
    if (!reducedMotion) {
      ctx.save();
      ctx.strokeStyle = "rgba(245,196,81," + (1 - t) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, p.y, 14 + t * 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBullets() {
    ctx.save();
    var pcx = playerWorldX();
    for (var i = 0; i < state.bullets.length; i++) {
      var b = state.bullets[i];
      var rel = worldDelta(pcx, b.worldX);
      var sx = PLAYER_SCREEN_X + rel;
      if (sx < -PLAYER_BULLET_W || sx > LOGICAL_W + PLAYER_BULLET_W) continue;
      // outer glow
      if (!reducedMotion) {
        ctx.shadowColor = "#7ff5ff";
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = "#7ff5ff";
      ctx.fillRect(sx - PLAYER_BULLET_W / 2, b.y - PLAYER_BULLET_H / 2, PLAYER_BULLET_W, PLAYER_BULLET_H);
      ctx.fillStyle = "#fff";
      ctx.fillRect(sx - PLAYER_BULLET_W / 2, b.y - 1, PLAYER_BULLET_W, 2);
    }
    ctx.restore();
  }

  function drawEnemyBullets() {
    ctx.save();
    var pcx = playerWorldX();
    for (var i = 0; i < state.enemyBullets.length; i++) {
      var b = state.enemyBullets[i];
      var rel = worldDelta(pcx, b.worldX);
      var sx = PLAYER_SCREEN_X + rel;
      if (sx < -8 || sx > LOGICAL_W + 8) continue;
      if (!reducedMotion) {
        ctx.shadowColor = "#f072d4";
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = "#ff86e8";
      ctx.fillRect(sx - ENEMY_BULLET_W / 2, b.y - ENEMY_BULLET_H / 2, ENEMY_BULLET_W, ENEMY_BULLET_H);
    }
    ctx.restore();
  }

  function drawPowerups() {
    var pcx = playerWorldX();
    for (var i = 0; i < state.powerups.length; i++) {
      var pu = state.powerups[i];
      var rel = worldDelta(pcx, pu.worldX);
      var sx = PLAYER_SCREEN_X + rel;
      if (sx < -22 || sx > LOGICAL_W + 22) continue;
      var meta = POWERUP_META[pu.type];
      var bob = reducedMotion ? 0 : Math.sin(pu.bob) * 2;
      var y = pu.y + bob;
      if (!reducedMotion) {
        var glow = ctx.createRadialGradient(sx, y, 0, sx, y, 22);
        glow.addColorStop(0, hexA(meta.glow, 0.5));
        glow.addColorStop(1, hexA(meta.glow, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, y, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(4,8,18,0.9)";
      ctx.beginPath();
      ctx.arc(sx, y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = meta.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, y, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = meta.color;
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, sx, y + 1);
    }
  }

  function drawParticles() {
    var pcx = playerWorldX();
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var rel = worldDelta(pcx, p.worldX);
      var sx = PLAYER_SCREEN_X + rel;
      if (sx < -8 || sx > LOGICAL_W + 8) continue;
      var a = Math.max(0, p.life / p.totalLife);
      ctx.fillStyle = hexA(p.color || "#fff", a);
      ctx.fillRect(sx - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  function drawHUDOverlays() {
    drawRadar();
  }

  function drawRadar() {
    // Mini-radar at top of canvas, showing world-wrap with player at center
    var rx = RADAR_INSET;
    var ry = RADAR_TOP + 32;            // below the top-HUD bar (DOM HUD is on top, but we still leave room)
    var rw = LOGICAL_W - RADAR_INSET * 2;
    var rh = RADAR_H * 0.6;
    // bg
    ctx.fillStyle = "rgba(4,8,18,0.5)";
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = "rgba(245,196,81,0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
    // center marker (player)
    var cx = rx + rw / 2;
    ctx.strokeStyle = "rgba(245,196,81,0.25)";
    ctx.beginPath();
    ctx.moveTo(cx, ry + 1);
    ctx.lineTo(cx, ry + rh - 1);
    ctx.stroke();
    var pcx = playerWorldX();
    function plot(worldX, y) {
      var d = worldDelta(pcx, worldX);
      // Radar shows the entire world width
      var nx = cx + (d / WORLD_W) * rw;
      // wrap into [rx, rx+rw)
      while (nx < rx) nx += rw;
      while (nx > rx + rw) nx -= rw;
      var nyNorm = clamp((y - RADAR_H - 20) / (GROUND_Y - RADAR_H - 20), 0, 1);
      var ny = ry + 2 + nyNorm * (rh - 4);
      return [nx, ny];
    }
    // Draw scholars (gold)
    ctx.fillStyle = "#f5c451";
    for (var i = 0; i < state.scholars.length; i++) {
      var s = state.scholars[i];
      var pp = plot(s.worldX, s.y);
      ctx.fillRect(pp[0] - 1, pp[1] - 1, 2, 2);
    }
    // Draw enemies
    for (var j = 0; j < state.enemies.length; j++) {
      var e = state.enemies[j];
      if (e.dead) continue;
      var col = ENEMY_TYPES[e.type].color;
      ctx.fillStyle = col;
      var ep = plot(e.worldX, e.y);
      ctx.fillRect(ep[0] - 1, ep[1] - 1, 2, 2);
    }
    // Player blip (cyan square)
    ctx.fillStyle = "#5de0f0";
    var p = state.player;
    var pp2 = plot(p.worldX, p.y);
    ctx.fillRect(pp2[0] - 2, pp2[1] - 2, 4, 4);
    // Label
    ctx.fillStyle = "rgba(245,196,81,0.7)";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("RADAR", rx + 4, ry - 2);
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
    if (dom.hudScholars) {
      var walking = 0;
      for (var i = 0; i < state.scholars.length; i++) {
        if (state.scholars[i].state === "walking" || state.scholars[i].state === "abducted" || state.scholars[i].state === "falling" || state.scholars[i].state === "caught") walking++;
      }
      dom.hudScholars.textContent = String(walking);
    }
    if (dom.hudBombs) dom.hudBombs.textContent = String(state.smartBombs);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      dom.goalName.textContent = "Stage " + state.stage + " · Patrol";
    }
    if (dom.waveRibbon) {
      // Highlight when mutants are present
      var mutantPresent = false;
      for (var k = 0; k < state.enemies.length; k++) {
        if (!state.enemies[k].dead && state.enemies[k].type === "mutant") { mutantPresent = true; break; }
      }
      dom.waveRibbon.classList.toggle("is-mutant", mutantPresent);
    }
    if (dom.goalMeta) {
      var bits = [];
      if (state.player.shieldActive) bits.push("Shield");
      if (state.player.rapidT > 0) bits.push("Rapid " + state.player.rapidT.toFixed(1) + "s");
      if (state.player.tractorT > 0) bits.push("Tractor " + state.player.tractorT.toFixed(1) + "s");
      if (state.player.multT > 0) bits.push("x2 " + state.player.multT.toFixed(1) + "s");
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
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Rescued · Optional · +1500 + 12 shards";
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
    var runIdQ = state ? state._runId : 0;
    scheduleTimeout(function () {
      if (!state || state._runId !== runIdQ) return;
      closeQuestion(correct);
    }, 1100);
  }

  function closeQuestion(wasCorrect) {
    if (wasCorrect && state) {
      state.score += 1500;
      addShards(12, "defender-drift-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 26, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopupAtScreen("+1500 SCHOLAR", LOGICAL_W / 2, 100, "is-bonus");
    }
    activeQuestion = null;
    if (phase !== "question") {
      // Phase already changed (e.g., player ran out of lives during the modal) — don't override.
      showScreen(null);
      updateHud();
      return;
    }
    phase = (prevPhase && prevPhase !== "question") ? prevPhase : "playing";
    prevPhase = null;
    showScreen(null);
    if (phase === "playing") resumeMusic();
    updateHud();
  }

  function skipQuestion() {
    activeQuestion = null;
    if (phase !== "question") {
      showScreen(null);
      updateHud();
      return;
    }
    phase = (prevPhase && prevPhase !== "question") ? prevPhase : "playing";
    prevPhase = null;
    showScreen(null);
    if (phase === "playing") resumeMusic();
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
    var runIdEnd = state ? state._runId : 0;
    scheduleTimeout(function () {
      if (!state || state._runId !== runIdEnd) return;
      showEndScreen();
    }, 700);
  }

  function showEndScreen() {
    if (phase !== "ended") return;
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 200));
    if (shardsToAdd > 0) addShards(shardsToAdd, "defender-drift-run-end");
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Patrol Down" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Defender Drift · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Stages Cleared</div><div class="end-cell-value">' + Math.max(0, state.stage - 1) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Aliens Down</div><div class="end-cell-value">' + formatNumber(state.enemiesKilledTotal) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Rescued</div><div class="end-cell-value">' + state.scholarsRescued + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Lost</div><div class="end-cell-value">' + state.scholarsLost + '</div></div>',
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
          scholarsRescued: state.scholarsRescued
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
          lives: state.lives,
          smartBombs: state.smartBombs,
          enemiesKilledTotal: state.enemiesKilledTotal,
          scholarsRescued: state.scholarsRescued,
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
          file: "games/defender-drift/index.html",
          score: state ? state.score : 0,
          level: state ? state.stage : 1,
          durationMs: durationMs || 0
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("defender-drift:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("defender-drift:best", String(Math.floor(v)));
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
      if (phase === "playing" || phase === "stageClear" || phase === "stageIntake") {
        if (k === "ArrowLeft" || k === "a" || k === "A") { keys.left = true; e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { keys.right = true; e.preventDefault(); return; }
        if (k === "ArrowUp" || k === "w" || k === "W") { keys.up = true; e.preventDefault(); return; }
        if (k === "ArrowDown" || k === "s" || k === "S") { keys.down = true; e.preventDefault(); return; }
        if (k === " " || k === "Spacebar") { keys.fire = true; e.preventDefault(); return; }
        if (k === "x" || k === "X") {
          if (e.repeat) return;
          smartBomb();
          e.preventDefault();
          return;
        }
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
      if (k === "ArrowUp" || k === "w" || k === "W") { keys.up = false; }
      if (k === "ArrowDown" || k === "s" || k === "S") { keys.down = false; }
      if (k === " " || k === "Spacebar") { keys.fire = false; }
    });
    bindTouchControls();
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
    pressBtn(dom.tcUp,    function () { keys.up = true; },    function () { keys.up = false; });
    pressBtn(dom.tcDown,  function () { keys.down = true; },  function () { keys.down = false; });
    pressBtn(dom.tcFire,  function () { touchFireHeld = true; }, function () { touchFireHeld = false; });
    pressBtn(dom.tcBomb,  function () { if (!touchBombArmed) { touchBombArmed = true; smartBomb(); } }, function () { touchBombArmed = false; });
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing" || phase === "stageClear" || phase === "stageIntake") {
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
      clearPendingTimeouts();
      resetTransientInput();
      activeQuestion = null;
      prevPhase = null;
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
    clearPendingTimeouts();
    stopMusic();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  function newRun() {
    clearPendingTimeouts();
    resetTransientInput();
    activeQuestion = null;
    prevPhase = null;
    lastBonusLifeThreshold = 0;
    runStartMs = Date.now();
    initState({});
    state._stageStartScholarsLost = 0;
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile(0);
  }

  function resumeRun(snap) {
    clearPendingTimeouts();
    resetTransientInput();
    activeQuestion = null;
    prevPhase = null;
    var s = snap.state || {};
    lastBonusLifeThreshold = Math.floor((s.score || 0) / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    runStartMs = Date.now();
    initState({
      score: s.score || 0,
      stage: s.stage || 1,
      lives: s.lives,
      smartBombs: s.smartBombs,
      enemiesKilledTotal: s.enemiesKilledTotal || 0,
      scholarsRescued: s.scholarsRescued || 0,
      best: readBest()
    });
    state._stageStartScholarsLost = state.scholarsLost;
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile(0);
  }

  // Clear any held keys so a new run doesn't start with phantom thrust/fire.
  function resetTransientInput() {
    keys.left = keys.right = keys.up = keys.down = keys.fire = keys.bomb = false;
    touchFireHeld = false;
    touchBombArmed = false;
    lastShotMs = 0;
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.stage > 1) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' · Stage ' + (snap.state.stage || 1) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Defender Drift Scores</div>';
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
      }
    }
    var hitPaused = false;
    if (state && state.hitPauseUntil && performance.now() < state.hitPauseUntil) {
      hitPaused = true;
    }
    if (!hitPaused) update(dt);
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "stageClear" || phase === "paused" || phase === "stageIntake") {
      updateHud();
    }
    rafHandle = requestAnimationFrame(loop);
  }

  // -- Boot ------------------------------------------------------------------
  function boot() {
    setupDom();
    initState({});
    state._stageStartScholarsLost = 0;
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
