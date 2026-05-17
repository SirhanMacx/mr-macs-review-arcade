/* ===========================================================================
   Reflex Run — 3-lane Subway-Surfers/Temple-Run endless runner · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x800 logical · 3 lanes · perspective road · scholar gates
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "reflex-run";
  var GAME_TITLE = "Reflex Run";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 800;

  // Road / lane geometry (perspective)
  var ROAD_HORIZON_Y = 230;             // y where road meets sky
  var ROAD_NEAR_Y = LOGICAL_H - 30;     // y at the bottom of the screen
  var ROAD_NEAR_HALF_W = 290;           // half-width of road at near plane
  var ROAD_FAR_HALF_W = 38;             // half-width of road at horizon
  var VANISHING_X = LOGICAL_W / 2;
  var LANE_COUNT = 3;
  var LANE_X_OFFSETS = [-1, 0, 1];      // logical lane index → x multiplier (-1=left,0=mid,1=right)
  var PLAYER_NEAR_Y = ROAD_NEAR_Y - 100;// player's screen-y position when ground-level

  // Forward speed (m/s) — scales with elapsed run time
  var SPEED_START = 6.0;                // m/s
  var SPEED_MAX = 16.0;                 // m/s after 60s
  var SPEED_RAMP_TIME = 60.0;           // seconds to reach SPEED_MAX

  // Object spawn cadence (in m of travel)
  var OBSTACLE_BASE_GAP = 22;           // meters between obstacle spawns
  var OBSTACLE_MIN_GAP = 10;            // closest gap at high speed
  var COIN_GAP = 6;                     // meters between coin spawns

  // Player movement
  var LANE_CHANGE_MS = 180;
  var JUMP_DURATION_MS = 600;           // total air time for a clean jump
  var JUMP_HEIGHT = 90;                 // peak parabolic height (logical px)
  var SLIDE_DURATION_MS = 600;
  var SHARDS_CAP = 200;
  var LIVES_INIT = 3;
  var BONUS_LIFE_DISTANCE = 1000;       // +1 life per 1km traveled
  var DISTANCE_MILESTONE = 500;         // m between milestone callouts

  // Powerup durations (s)
  var DUR_MAGNET = 6.0;
  var DUR_BOOST = 4.0;
  var BOOST_MULT = 1.5;
  var DUR_DOUBLE = 10.0;
  var DUR_HOVER = 4.0;

  // Visuals
  var ROAD_SEGMENT_LEN = 12;            // meters per painted dash repeat
  var BG_PARALLAX_LAYERS = [
    { z: 0.06, color: "#0c1322", count: 5 },
    { z: 0.14, color: "#172238", count: 6 },
    { z: 0.30, color: "#212f4a", count: 7 }
  ];

  // -- Inline review bank (28 items) ----------------------------------------
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence" },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg" },
    { prompt: "The Protestant Reformation began with:", choices: ["Luther's 95 Theses", "The Council of Trent", "Henry VIII's annulment", "Calvin's Institutes"], correctText: "Luther's 95 Theses" },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, diseases between hemispheres", "A 1492 trade treaty", "Slave trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, diseases between hemispheres" },
    { prompt: "Which technology most enabled European long-distance voyages?", choices: ["The astrolabe and caravel", "The compound microscope", "The cotton gin", "The seed drill"], correctText: "The astrolabe and caravel" },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain" },
    { prompt: "Which invention most powered early factories?", choices: ["The steam engine", "The electric motor", "The internal combustion engine", "The assembly line"], correctText: "The steam engine" },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "German unification", "Russian Revolution"], correctText: "Assassination of Archduke Franz Ferdinand" },
    { prompt: "Trench warfare on the Western Front was characterized by:", choices: ["Stalemate and high casualties", "Rapid cavalry advances", "Aerial bombing of cities", "Naval blockade only"], correctText: "Stalemate and high casualties" },
    { prompt: "The Treaty of Versailles (1919) blamed the war primarily on:", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany" },
    { prompt: "The Cold War was a struggle primarily between:", choices: ["U.S. and Soviet Union", "U.S. and China", "Britain and France", "Germany and Russia"], correctText: "U.S. and Soviet Union" },
    { prompt: "The Marshall Plan (1948) provided:", choices: ["Economic aid to rebuild Western Europe", "Military aid to South Korea", "Nuclear technology to NATO allies", "Loans to Latin America"], correctText: "Economic aid to rebuild Western Europe" },
    { prompt: "The doctrine of containment aimed to:", choices: ["Stop the spread of communism", "Roll back Soviet borders", "Promote free trade in Asia", "End nuclear weapons"], correctText: "Stop the spread of communism" },
    { prompt: "The Cuban Missile Crisis (1962) ended when:", choices: ["The Soviet Union withdrew missiles from Cuba", "Cuba renounced communism", "The U.S. invaded Cuba", "Khrushchev was removed from power"], correctText: "The Soviet Union withdrew missiles from Cuba" },
    { prompt: "Brown v. Board of Education (1954) ruled:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional" },
    { prompt: "The Montgomery Bus Boycott was sparked by:", choices: ["Rosa Parks' arrest", "The March on Washington", "The Voting Rights Act", "Plessy v. Ferguson"], correctText: "Rosa Parks' arrest" },
    { prompt: "The Civil Rights Act of 1964:", choices: ["Banned discrimination in public accommodations", "Created the EPA", "Established Medicare", "Ended the Vietnam War"], correctText: "Banned discrimination in public accommodations" },
    { prompt: "Sputnik (1957), launched by the USSR, triggered:", choices: ["The U.S. space race and NASA's founding", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The U.S. space race and NASA's founding" },
    { prompt: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Declaration of Independence", "Constitution", "Bill of Rights", "Federalist No. 10"], correctText: "Declaration of Independence" },
    { prompt: "Checks and balances divides power among:", choices: ["Three branches of government", "Federal and state", "Senate and House", "Citizens and government"], correctText: "Three branches of government" },
    { prompt: "The 13th Amendment (1865):", choices: ["Abolished slavery", "Granted voting rights to women", "Created income tax", "Gave Black men the vote"], correctText: "Abolished slavery" },
    { prompt: "The 19th Amendment (1920):", choices: ["Granted women the right to vote", "Repealed Prohibition", "Lowered the voting age", "Established direct election of senators"], correctText: "Granted women the right to vote" },
    { prompt: "The New Deal (1930s) was a response to:", choices: ["The Great Depression", "World War I", "The Dust Bowl alone", "The Cold War"], correctText: "The Great Depression" },
    { prompt: "Pearl Harbor (Dec 7, 1941) led directly to:", choices: ["U.S. entry into World War II", "End of WWII", "The Marshall Plan", "Founding of the UN"], correctText: "U.S. entry into World War II" },
    { prompt: "The Magna Carta (1215) is significant because it:", choices: ["Limited the power of the English king", "Established Parliament", "Ended the Hundred Years' War", "Created common law"], correctText: "Limited the power of the English king" },
    { prompt: "Which best describes a primary source?", choices: ["A first-hand record from the time period studied", "A textbook chapter", "A modern documentary", "An encyclopedia entry"], correctText: "A first-hand record from the time period studied" },
    { prompt: "The Berlin Wall fell in:", choices: ["1989", "1991", "1985", "1979"], correctText: "1989" },
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations", "NATO", "The League of Nations", "The European Union"], correctText: "The United Nations" }
  ];

  // -- Powerups --------------------------------------------------------------
  var POWERUP_TYPES = ["magnet", "shield", "boost", "double", "hover"];
  var POWERUP_META = {
    magnet: { glyph: "🧲", color: "#ffd2e0", glow: "#f23dd6", label: "MAGNET" },
    shield: { glyph: "🛡", color: "#a8e8ff", glow: "#5de0f0", label: "SHIELD" },
    boost:  { glyph: "⚡", color: "#fff8c4", glow: "#f5c451", label: "BOOST" },
    double: { glyph: "⭐", color: "#e0ccff", glow: "#a991ff", label: "x2" },
    hover:  { glyph: "🪂", color: "#c8ffd6", glow: "#4dd49b", label: "HOVER" }
  };

  // -- Obstacle types --------------------------------------------------------
  // wall (full lane block — must change lane)
  // pipe (low — jump over)
  // beam (high — slide under)
  // spinner (timing-based; rotates so window opens/closes for jump or slide)
  var OBSTACLE_TYPES = ["wall", "pipe", "beam", "spinner"];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | dying
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var lastBonusLifeDistance = 0;
  var lastMilestoneAnnounced = 0;

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

  // sfx wrapper — bookkeeping for footstep loop streak / coin pitch ramp
  var coinStreakTs = 0;
  var coinStreak = 0;
  var sfx = {
    footstep: function () { sfxTone(220, 0.04, { type: "triangle", volume: 0.06, endFreq: 160 }); },
    laneChange: function () {
      sfxTone(560, 0.07, { type: "triangle", volume: 0.10, endFreq: 720 });
    },
    jump: function () {
      sfxTone(420, 0.08, { type: "triangle", volume: 0.14, endFreq: 720 });
    },
    slide: function () {
      sfxNoise(0.18, { volume: 0.10, cutoff: 1200 });
      sfxTone(280, 0.12, { type: "sawtooth", volume: 0.08, endFreq: 160 });
    },
    coin: function () {
      var now = performance.now();
      if (now - coinStreakTs > 700) coinStreak = 0;
      coinStreakTs = now;
      coinStreak = Math.min(20, coinStreak + 1);
      var basePitch = 880 + coinStreak * 48;
      sfxTone(basePitch, 0.07, { type: "triangle", volume: 0.13 });
      setTimeout(function () { sfxTone(basePitch * 1.5, 0.06, { type: "triangle", volume: 0.10 }); }, 30);
    },
    obstacleHit: function () {
      sfxNoise(0.32, { volume: 0.22, cutoff: 700 });
      sfxTone(220, 0.34, { type: "sawtooth", volume: 0.16, endFreq: 60 });
    },
    scholarPass: function () {
      [880, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.12, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    scholarCorrect: function () {
      [784, 1175, 1568, 1865, 2349].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholarWrong: function () {
      sfxTone(330, 0.16, { type: "sawtooth", volume: 0.12, endFreq: 200 });
      setTimeout(function () { sfxTone(220, 0.20, { type: "sawtooth", volume: 0.10, endFreq: 110 }); }, 100);
    },
    lifeLost: function () {
      sfxNoise(0.38, { volume: 0.20, cutoff: 600 });
      sfxTone(180, 0.42, { type: "sawtooth", volume: 0.16, endFreq: 50 });
    },
    milestone: function () {
      [659, 880, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.14, { type: "triangle", volume: 0.16 }); }, i * 70);
      });
    },
    powerupPickup: function () {
      sfxTone(880, 0.08, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.10, { type: "triangle", volume: 0.16 }); }, 70);
    },
    powerupUse: function () {
      sfxTone(1175, 0.10, { type: "square", volume: 0.12 });
      setTimeout(function () { sfxTone(1760, 0.12, { type: "triangle", volume: 0.14 }); }, 60);
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(220, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("reflexCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudDistance = $("hudDistance");
    dom.hudLives = $("hudLives");
    dom.hudShards = $("hudShards");
    dom.hudBest = $("hudBest");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
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
    dom.tcUp = $("tcUp");
    dom.tcDown = $("tcDown");
    dom.tcLeft = $("tcLeft");
    dom.tcRight = $("tcRight");
  }

  // -- Perspective helpers ---------------------------------------------------
  // World-z is "meters ahead" of player. Bigger z = farther = closer to horizon.
  // A point at world-z is rendered at screen-y interpolating from ROAD_NEAR_Y (z=0)
  // to ROAD_HORIZON_Y (z=Z_HORIZON). Beyond Z_HORIZON it's invisible.
  var Z_HORIZON = 80; // meters of visible road ahead

  function zToScreenY(z) {
    var Zh = Z_HORIZON > 0.001 ? Z_HORIZON : 0.001;
    var t = clamp01(z / Zh);
    return ROAD_NEAR_Y + (ROAD_HORIZON_Y - ROAD_NEAR_Y) * t;
  }
  function zToScale(z) {
    // Perspective scale: 1.0 at near, ~0.13 at horizon
    var Zh = Z_HORIZON > 0.001 ? Z_HORIZON : 0.001;
    var t = clamp01(z / Zh);
    var nearH = ROAD_NEAR_HALF_W > 0.001 ? ROAD_NEAR_HALF_W : 0.001;
    var farH = ROAD_FAR_HALF_W;
    var halfW = nearH + (farH - nearH) * t;
    return halfW / nearH; // 1.0 near, ~0.13 far
  }
  function laneToWorldX(lane) {
    // Lane index 0,1,2 → x offset in lane units (-1, 0, +1)
    var off = LANE_X_OFFSETS[lane];
    // At near plane, the spacing between lanes = ROAD_NEAR_HALF_W * 0.62
    // Lane center: off * spacing
    return off * ROAD_NEAR_HALF_W * 0.62;
  }
  function projectLaneZ(lane, z) {
    // Project a (lane, z) to screen (x, y) and scale.
    var s = zToScale(z);
    var worldX = laneToWorldX(lane);
    var screenX = VANISHING_X + worldX * s;
    var screenY = zToScreenY(z);
    return { x: screenX, y: screenY, scale: s };
  }
  function projectFreeXZ(worldX, z) {
    var s = zToScale(z);
    var screenX = VANISHING_X + worldX * s;
    var screenY = zToScreenY(z);
    return { x: screenX, y: screenY, scale: s };
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // -- Spawn / world ---------------------------------------------------------
  function makeObstacle(opts) {
    opts = opts || {};
    return {
      kind: "obstacle",
      type: opts.type || "wall",
      lane: opts.lane != null ? opts.lane : 1,
      lanes: opts.lanes || null,        // for "wall-row" multi-lane
      z: opts.z || Z_HORIZON,           // start at horizon, advance toward player
      hit: false,
      passed: false,
      // spinner: angular phase
      spinPhase: opts.spinPhase || 0,
      spinSpeed: opts.spinSpeed || 1.6,
      // beam (high) clearance below; pipe (low) clearance above
      // collision-window y in screen space figured at draw / collision time
    };
  }
  function makeCoin(opts) {
    opts = opts || {};
    return {
      kind: "coin",
      lane: opts.lane != null ? opts.lane : 1,
      z: opts.z || Z_HORIZON,
      collected: false,
      bob: Math.random() * Math.PI * 2,
      yOff: opts.yOff || 0
    };
  }
  function makePowerup(opts) {
    opts = opts || {};
    return {
      kind: "powerup",
      type: opts.type || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)],
      lane: opts.lane != null ? opts.lane : 1,
      z: opts.z || Z_HORIZON,
      collected: false,
      bob: Math.random() * Math.PI * 2
    };
  }
  function makeScholarGate(opts) {
    opts = opts || {};
    return {
      kind: "scholar",
      z: opts.z || Z_HORIZON,
      passed: false,
      pulse: 0
    };
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    state = {
      score: opts.score || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      distance: opts.distance || 0,        // meters traveled
      time: 0,
      best: opts.best || readBest(),
      // entities (each has .z; lower z = closer to player)
      obstacles: [],
      coins: [],
      powerups: [],
      gates: [],
      // spawn cursors (next spawn world-z = current distance + this)
      nextObstacleAt: 24,                   // first obstacle ~24m in
      nextCoinAt: 8,                        // first coin near
      nextPowerupAt: 70,                    // first powerup ~70m in
      nextGateAt: 220,                      // first scholar gate ~220m in
      _lastOpenLane: null,                  // remember the dodge lane of the last 2-lane wall
      _lastObstacleD: null,                 // distance at last obstacle spawn
      // active timers (s)
      magnetT: 0,
      boostT: 0,
      doubleT: 0,
      hoverT: 0,
      shieldOn: opts.shieldOn || false,
      // particles + popups + shake
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      // background parallax bands
      bgLayers: opts.bgLayers || generateBgLayers(),
      starfield: opts.starfield || generateStarfield(),
      // stats
      coinsCollected: opts.coinsCollected || 0,
      obstaclesPassed: opts.obstaclesPassed || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      maxSpeed: opts.maxSpeed || SPEED_START,
      // chain (consecutive coins without obstacle hit / miss)
      coinChain: 0,
      maxCoinChain: opts.maxCoinChain || 0,
      // footstep ticker
      footTick: 0,
      // player
      player: makePlayer(),
      // shake / fx
      endReason: ""
    };
    if (opts.lives === 0) state.lives = LIVES_INIT;
  }
  function makePlayer() {
    return {
      lane: 1,                 // current lane (0=L, 1=M, 2=R)
      laneFrom: 1, laneTo: 1,
      laneT: 0,                // 0..1 lane-change tween progress
      laneDuration: LANE_CHANGE_MS / 1000,
      // jumping
      jumping: false,
      jumpT: 0,                // 0..1 progress
      jumpDuration: JUMP_DURATION_MS / 1000,
      // sliding
      sliding: false,
      slideT: 0,
      slideDuration: SLIDE_DURATION_MS / 1000,
      // movement bounce (animation)
      anim: 0,
      // y offset due to jump (screen px)
      yOff: 0,
      // dying
      dying: false,
      dyingT: 0,
      // ghost frames after hit (no-shield collision survives)
      iframes: 0
    };
  }

  function generateBgLayers() {
    // Static silhouettes per parallax layer — generated once per run
    var layers = [];
    for (var li = 0; li < BG_PARALLAX_LAYERS.length; li++) {
      var def = BG_PARALLAX_LAYERS[li];
      var spans = [];
      for (var i = 0; i < def.count; i++) {
        spans.push({
          x: i * (LOGICAL_W / def.count) + Math.random() * 30 - 15,
          h: 60 + Math.random() * 80,
          w: 80 + Math.random() * 90,
          tilt: (Math.random() - 0.5) * 6
        });
      }
      layers.push({ z: def.z, color: def.color, spans: spans });
    }
    return layers;
  }
  function generateStarfield() {
    var stars = [];
    for (var i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * LOGICAL_W,
        y: Math.random() * (ROAD_HORIZON_Y - 20),
        r: 0.4 + Math.random() * 1.4,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.0
      });
    }
    return stars;
  }

  // -- Speed (m/s) -----------------------------------------------------------
  function currentSpeed() {
    var t = clamp01(state.time / SPEED_RAMP_TIME);
    var base = SPEED_START + (SPEED_MAX - SPEED_START) * t;
    if (state.boostT > 0) base *= BOOST_MULT;
    return base;
  }

  // -- Spawn loop ------------------------------------------------------------
  function maybeSpawn() {
    var d = state.distance;
    // Obstacle gap shrinks as speed rises (denominator-safe)
    var spd = currentSpeed();
    var spdRange = (SPEED_MAX - SPEED_START);
    var spdT = spdRange > 0.001 ? clamp01((spd - SPEED_START) / spdRange) : 0;
    var gap = OBSTACLE_BASE_GAP - (OBSTACLE_BASE_GAP - OBSTACLE_MIN_GAP) * spdT;
    // Hard floor so consecutive obstacle sets are always reachable
    if (gap < OBSTACLE_MIN_GAP) gap = OBSTACLE_MIN_GAP;
    if (d >= state.nextObstacleAt) {
      spawnObstacleSet();
      state.nextObstacleAt = d + gap * (0.95 + Math.random() * 0.5);
    }
    if (d >= state.nextCoinAt) {
      spawnCoinPattern();
      state.nextCoinAt = d + COIN_GAP * (0.85 + Math.random() * 0.4);
    }
    if (d >= state.nextPowerupAt) {
      spawnPowerupAtZ();
      state.nextPowerupAt = d + 80 + Math.random() * 80;   // ~80-160m between powerups
    }
    if (d >= state.nextGateAt) {
      spawnScholarGate();
      state.nextGateAt = d + 240 + Math.random() * 160;    // ~240-400m between gates
    }
    // Hard caps so unbounded growth is impossible (defensive)
    if (state.obstacles.length > 80) state.obstacles.length = 80;
    if (state.coins.length > 200)    state.coins.length = 200;
    if (state.powerups.length > 30)  state.powerups.length = 30;
    if (state.gates.length > 8)      state.gates.length = 8;
    if (state.particles.length > 600) state.particles.length = 600;
  }

  function spawnObstacleSet() {
    // Decide whether to spawn a single-lane obstacle or a 2-lane wall
    var roll = Math.random();
    var type;
    if (roll < 0.35) type = "wall";
    else if (roll < 0.60) type = "pipe";
    else if (roll < 0.85) type = "beam";
    else type = "spinner";
    var lane = Math.floor(Math.random() * LANE_COUNT);
    var z = Z_HORIZON + 4;
    if (type === "wall") {
      // 35% chance of double-wall (2 of 3 lanes — must always leave one open)
      if (Math.random() < 0.4) {
        var lanes = pickTwoLanes();
        // Track open lane: the one not in `lanes`
        var openLane = -1;
        for (var ol = 0; ol < LANE_COUNT; ol++) {
          if (lanes.indexOf(ol) < 0) { openLane = ol; break; }
        }
        // If the previous obstacle set forces a different open lane, skip this set
        // to avoid an impossible trap.
        if (state._lastOpenLane != null && openLane !== state._lastOpenLane &&
            state._lastObstacleD != null && (state.distance - state._lastObstacleD) < 14) {
          // Replace with a single-lane wall in the previous open lane
          state.obstacles.push(makeObstacle({ type: "wall", lane: state._lastOpenLane === 0 ? 1 : 0, z: z }));
          state._lastOpenLane = null;
          state._lastObstacleD = state.distance;
          return;
        }
        for (var i = 0; i < lanes.length; i++) {
          state.obstacles.push(makeObstacle({ type: "wall", lane: lanes[i], z: z }));
        }
        state._lastOpenLane = openLane;
        state._lastObstacleD = state.distance;
        return;
      }
      state.obstacles.push(makeObstacle({ type: "wall", lane: lane, z: z }));
      state._lastOpenLane = null;
      state._lastObstacleD = state.distance;
      return;
    }
    // pipe / beam / spinner: usually single lane, occasionally on multiple
    // Cap multi-lane to 2 lanes (never all 3) to keep patterns dodgeable
    if (Math.random() < 0.25) {
      // multi-lane: same type across 2 lanes
      var lanes2 = pickTwoLanes();
      for (var j = 0; j < lanes2.length; j++) {
        state.obstacles.push(makeObstacle({ type: type, lane: lanes2[j], z: z, spinPhase: Math.random() * Math.PI * 2, spinSpeed: 1.3 + Math.random() * 0.8 }));
      }
    } else {
      state.obstacles.push(makeObstacle({ type: type, lane: lane, z: z, spinPhase: Math.random() * Math.PI * 2, spinSpeed: 1.3 + Math.random() * 0.8 }));
    }
    state._lastOpenLane = null;
    state._lastObstacleD = state.distance;
  }
  function pickTwoLanes() {
    // Returns 2 distinct lane indices in [0..LANE_COUNT-1]
    var all = [0, 1, 2];
    var i1 = Math.floor(Math.random() * all.length);
    var pickA = all.splice(i1, 1)[0];
    var i2 = Math.floor(Math.random() * all.length);
    var pickB = all[i2];
    if (pickB === pickA) pickB = all[(i2 + 1) % all.length];
    return [pickA, pickB];
  }
  function spawnCoinPattern() {
    // Patterns: single, line of 3-5 same lane, or a small diagonal that crosses lanes
    var pattern = Math.random();
    var lane = Math.floor(Math.random() * LANE_COUNT);
    var startZ = Z_HORIZON + 6;
    if (pattern < 0.45) {
      // line of 4 in same lane, spaced 2m
      for (var i = 0; i < 4; i++) {
        state.coins.push(makeCoin({ lane: lane, z: startZ + i * 2 }));
      }
    } else if (pattern < 0.75) {
      // arc — 5 coins, gentle bob in y
      for (var j = 0; j < 5; j++) {
        var yOff = -Math.sin(j / 4 * Math.PI) * 24;
        state.coins.push(makeCoin({ lane: lane, z: startZ + j * 1.6, yOff: yOff }));
      }
    } else if (pattern < 0.9) {
      // diagonal across lanes
      var dir = Math.random() < 0.5 ? -1 : 1;
      var startLane = clamp(lane, 0, LANE_COUNT - 1);
      for (var k = 0; k < 5; k++) {
        var cl = clamp(startLane + dir * Math.floor(k / 2), 0, LANE_COUNT - 1);
        state.coins.push(makeCoin({ lane: cl, z: startZ + k * 1.7 }));
      }
    } else {
      // single
      state.coins.push(makeCoin({ lane: lane, z: startZ }));
    }
  }
  function spawnPowerupAtZ() {
    var lane = Math.floor(Math.random() * LANE_COUNT);
    var type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.powerups.push(makePowerup({ lane: lane, z: Z_HORIZON + 6, type: type }));
  }
  function spawnScholarGate() {
    state.gates.push(makeScholarGate({ z: Z_HORIZON + 10 }));
  }

  // -- Update entities -------------------------------------------------------
  function updateEntities(dt) {
    var spd = currentSpeed();
    var dz = spd * dt; // meters traveled this frame
    state.distance += dz;
    if (spd > state.maxSpeed) state.maxSpeed = spd;

    // Move all entities toward camera by reducing z
    advanceArr(state.obstacles, dz);
    advanceArr(state.coins, dz);
    advanceArr(state.powerups, dz);
    advanceArr(state.gates, dz);

    // Cleanup off-screen (z < -2 = behind camera)
    state.obstacles = state.obstacles.filter(function (o) { return o.z > -3 && !o._dead; });
    state.coins     = state.coins.filter(function (o) { return o.z > -3 && !o.collected; });
    state.powerups  = state.powerups.filter(function (o) { return o.z > -3 && !o.collected; });
    state.gates     = state.gates.filter(function (o) { return o.z > -3; });

    // Per-frame state advance
    for (var i = 0; i < state.coins.length; i++)    state.coins[i].bob += dt * 4;
    for (var j = 0; j < state.powerups.length; j++) state.powerups[j].bob += dt * 3;
    for (var k = 0; k < state.gates.length; k++)    state.gates[k].pulse += dt * 2.4;
    for (var m = 0; m < state.obstacles.length; m++) {
      var ob = state.obstacles[m];
      if (ob.type === "spinner") ob.spinPhase += ob.spinSpeed * dt;
    }
  }
  function advanceArr(arr, dz) {
    for (var i = 0; i < arr.length; i++) arr[i].z -= dz;
  }

  // -- Player update ---------------------------------------------------------
  function updatePlayer(dt) {
    var p = state.player;
    if (p.dying) return;

    // Track previous hover state to detect when hover ends
    var hadHover = !!p._hadHover;

    // Lane-change tween
    if (p.laneT > 0 && p.laneT < 1) {
      p.laneT += dt / Math.max(0.001, p.laneDuration);
      if (p.laneT >= 1) {
        p.laneT = 1;
        p.lane = p.laneTo;
        p.laneFrom = p.laneTo;
      }
    }
    // Jump arc
    if (p.jumping) {
      p.jumpT += dt / Math.max(0.001, p.jumpDuration);
      if (p.jumpT >= 1) {
        p.jumping = false;
        p.jumpT = 0;
        p.yOff = 0;
      } else {
        p.yOff = -Math.sin(p.jumpT * Math.PI) * JUMP_HEIGHT;
      }
    } else if (state.hoverT <= 0) {
      // Not jumping and no hover: ensure on ground
      p.yOff = 0;
    }
    // Slide
    if (p.sliding) {
      p.slideT += dt / Math.max(0.001, p.slideDuration);
      if (p.slideT >= 1) {
        p.slideT = 0;
        p.sliding = false;
      }
    }
    // Hover power-up: fly above all obstacles
    if (state.hoverT > 0) {
      p.yOff = -JUMP_HEIGHT * 1.4 - 8;
      // Slight bob so it reads as flight
      if (!reducedMotion) p.yOff += Math.sin(state.time * 4) * 4;
      p._hadHover = true;
    } else if (hadHover) {
      // Hover just ended — drop player to ground and grant brief i-frames
      // so they don't crash mid-air on a freshly-spawned obstacle.
      p._hadHover = false;
      if (!p.jumping) p.yOff = 0;
      p.iframes = Math.max(p.iframes, 0.6);
    }

    // Animation tick
    p.anim += dt * 8;
    // i-frames decay
    if (p.iframes > 0) p.iframes -= dt;

    // Footstep loop on ground
    if (!p.jumping && state.hoverT <= 0) {
      state.footTick += dt * (8 + currentSpeed() * 0.4);
      if (state.footTick >= Math.PI * 2) {
        state.footTick -= Math.PI * 2;
      }
      // emit a footstep tone every ~0.18s scaled by speed
      var footInterval = 0.32 * (SPEED_START / Math.max(1, currentSpeed()));
      if (!p._lastFoot) p._lastFoot = 0;
      p._lastFoot += dt;
      if (p._lastFoot >= footInterval) {
        p._lastFoot = 0;
        sfx.footstep();
      }
    }

    // Power-up timers
    if (state.magnetT > 0) state.magnetT = Math.max(0, state.magnetT - dt);
    if (state.boostT > 0)  state.boostT  = Math.max(0, state.boostT - dt);
    if (state.doubleT > 0) state.doubleT = Math.max(0, state.doubleT - dt);
    if (state.hoverT > 0)  state.hoverT  = Math.max(0, state.hoverT - dt);
  }

  // -- Movement input → actions ---------------------------------------------
  function moveLane(dir) {
    if (phase !== "playing") return;
    if (!state || !state.player) return;
    var p = state.player;
    if (p.dying) return;
    // Mid-jump cannot change lane
    if (p.jumping) return;
    // Mid-lane-change continues via laneTo update? we let it complete first
    if (p.laneT > 0 && p.laneT < 1) return;
    var nextLane = p.lane + dir;
    if (nextLane < 0 || nextLane >= LANE_COUNT) {
      sfxTone(220, 0.05, { type: "square", volume: 0.06 });
      return;
    }
    p.laneFrom = p.lane;
    p.laneTo = nextLane;
    p.laneT = 0.001;
    sfx.laneChange();
  }
  function jump() {
    if (phase !== "playing") return;
    if (!state || !state.player) return;
    var p = state.player;
    if (p.dying) return;
    if (p.jumping) return;
    if (p.sliding) { p.sliding = false; p.slideT = 0; }
    p.jumping = true;
    p.jumpT = 0.001;
    sfx.jump();
    burstAt(playerScreenX(), playerScreenY(), "#5de0f0", 6);
  }
  function slide() {
    if (phase !== "playing") return;
    if (!state || !state.player) return;
    var p = state.player;
    if (p.dying) return;
    if (p.sliding) return;
    if (p.jumping) {
      // cancel jump → drop quickly (half duration)
      p.jumping = false;
      p.jumpT = 0;
      p.yOff = 0;
    }
    p.sliding = true;
    p.slideT = 0.001;
    sfx.slide();
    burstAt(playerScreenX(), playerScreenY() + 6, "#a8e8ff", 5);
  }

  // Get player's current lane-x in world units (interpolated during lane change)
  function playerWorldX() {
    var p = state.player;
    // Clamp from/to to valid lane indices in case of stale state
    var fromIdx = clamp(p.laneFrom, 0, LANE_COUNT - 1);
    var toIdx = clamp(p.laneTo, 0, LANE_COUNT - 1);
    var fromX = laneToWorldX(fromIdx);
    var toX = laneToWorldX(toIdx);
    // Clamp tween progress so easing never overshoots edges
    var rawT = (p.laneT > 0) ? clamp01(p.laneT) : 0;
    var t = rawT > 0 ? easeOutCubic(rawT) : 0;
    return fromX + (toX - fromX) * t;
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function playerScreenX() {
    var wx = playerWorldX();
    var s = zToScale(0);
    return VANISHING_X + wx * s;
  }
  function playerScreenY() {
    return PLAYER_NEAR_Y + state.player.yOff;
  }
  // Effective lane index for collision (rounds at midpoint; during change lock until tween done)
  function playerCurrentLane() {
    var p = state.player;
    if (p.laneT > 0 && p.laneT < 1) {
      // straddling — for collisions, treat as both? Use whichever is closer based on tween > .5
      return p.laneT >= 0.5 ? p.laneTo : p.laneFrom;
    }
    return p.lane;
  }

  // -- Collision -------------------------------------------------------------
  function checkCollisions() {
    var p = state.player;
    if (p.dying) return;
    // Only care about entities within a small z-window around the player (z near 0)
    var hitZNear = -1.0, hitZFar = 1.6;
    var pLane = playerCurrentLane();

    // 1) Coins (with magnet auto-pull)
    for (var i = 0; i < state.coins.length; i++) {
      var c = state.coins[i];
      if (c.collected) continue;
      if (c.z < hitZNear || c.z > hitZFar + 1.2) continue;
      // Magnet pulls coins from any lane to player lane within window
      if (state.magnetT > 0 && c.z < hitZFar + 1.2 && c.z > hitZNear) {
        c.lane = pLane;
      }
      if (c.lane === pLane && c.z < hitZFar && c.z > hitZNear) {
        // Vertical: coins float at player height; if jumping high, can still collect
        c.collected = true;
        onCoinCollected(c);
      }
    }

    // 2) Powerups
    for (var j = 0; j < state.powerups.length; j++) {
      var pu = state.powerups[j];
      if (pu.collected) continue;
      if (pu.z > hitZFar || pu.z < hitZNear) continue;
      if (pu.lane === pLane) {
        pu.collected = true;
        applyPowerup(pu);
      }
    }

    // 3) Scholar gates (full-width — passing one always triggers prompt)
    for (var k = 0; k < state.gates.length; k++) {
      var g = state.gates[k];
      if (g.passed) continue;
      if (g.z <= 0) {
        g.passed = true;
        onScholarGatePassed(g);
      }
    }

    // 4) Obstacles
    if (p.iframes > 0) return;
    if (state.hoverT > 0) {
      // hover skips all obstacle collisions; mark passed for stats
      for (var n = 0; n < state.obstacles.length; n++) {
        var ob1 = state.obstacles[n];
        if (!ob1.passed && ob1.z < 0) { ob1.passed = true; state.obstaclesPassed++; }
      }
      return;
    }
    for (var m = 0; m < state.obstacles.length; m++) {
      var ob = state.obstacles[m];
      if (ob.hit || ob._dead) continue;
      if (ob.z > 0.6 || ob.z < -0.6) {
        if (!ob.passed && ob.z < 0) { ob.passed = true; state.obstaclesPassed++; }
        continue;
      }
      if (ob.lane !== pLane) continue;
      // Check whether player's current pose clears this obstacle
      var clears = obstacleCleared(ob, p);
      if (!clears) {
        ob.hit = true;
        onObstacleHit(ob);
        return;
      } else {
        if (!ob.passed) {
          ob.passed = true;
          state.obstaclesPassed++;
          // small score for narrow miss
          var addPts = Math.floor(20 * scoreMult());
          state.score += addPts;
        }
      }
    }
  }
  function obstacleCleared(ob, p) {
    // returns true if player's current pose clears this obstacle type
    if (ob.type === "wall") {
      return false; // wall fully blocks; only lane-change avoids
    }
    if (ob.type === "pipe") {
      // low pipe: must jump
      return p.jumping || state.hoverT > 0;
    }
    if (ob.type === "beam") {
      // high beam: must slide
      return p.sliding || state.hoverT > 0;
    }
    if (ob.type === "spinner") {
      // timing-based: arms rotate; pass if arms are roughly horizontal (window open)
      // Open if Math.abs(sin(spinPhase)) > 0.65 → arms horizontal-ish
      // Player must EITHER jump OR slide depending on phase parity
      var phaseNorm = ((ob.spinPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      // Open windows: phase near 0 or near PI → arms horizontal → low (slide) clear
      // Open windows: phase near PI/2 or 3PI/2 → arms vertical → high (jump) clear
      var nearHoriz = Math.min(phaseNorm, Math.abs(phaseNorm - Math.PI), Math.abs(phaseNorm - 2 * Math.PI)) < 0.55;
      var nearVert = Math.min(Math.abs(phaseNorm - Math.PI / 2), Math.abs(phaseNorm - 3 * Math.PI / 2)) < 0.55;
      if (nearHoriz && p.sliding) return true;
      if (nearVert && p.jumping) return true;
      if (state.hoverT > 0) return true;
      return false;
    }
    return false;
  }

  function onCoinCollected(coin) {
    state.coinsCollected++;
    state.coinChain++;
    if (state.coinChain > state.maxCoinChain) state.maxCoinChain = state.coinChain;
    // Cap shards at 200/run
    addShards(1, GAME_ID + "-coin");
    var pts = Math.floor(10 * scoreMult());
    state.score += pts;
    sfx.coin();
    var sx = projectLaneZ(coin.lane, Math.max(0, coin.z)).x;
    var sy = zToScreenY(Math.max(0, coin.z)) + (coin.yOff || 0) - 12;
    burstAt(sx, sy, "#f5c451", 8);
    pushPopup("+" + pts, sx, sy - 6, "is-score");
    // Chain milestone
    if (state.coinChain > 0 && state.coinChain % 25 === 0) {
      pushPopup("CHAIN x" + state.coinChain, LOGICAL_W / 2, ROAD_HORIZON_Y + 30, "is-tetris");
      var bonus = Math.floor(state.coinChain * 4 * scoreMult());
      state.score += bonus;
      pushPopup("+" + bonus, LOGICAL_W / 2, ROAD_HORIZON_Y + 56, "is-score");
    }
  }

  function applyPowerup(pu) {
    var meta = POWERUP_META[pu.type];
    sfx.powerupPickup();
    var sx = projectLaneZ(pu.lane, Math.max(0, pu.z)).x;
    var sy = zToScreenY(Math.max(0, pu.z)) - 16;
    pushPopup(meta.label, sx, sy, "is-bonus");
    burstAt(sx, sy, meta.glow, 16);
    if (pu.type === "magnet")  state.magnetT = DUR_MAGNET;
    else if (pu.type === "shield") state.shieldOn = true;
    else if (pu.type === "boost")  { state.boostT = DUR_BOOST; state.player.iframes = Math.max(state.player.iframes, DUR_BOOST); }
    else if (pu.type === "double") state.doubleT = DUR_DOUBLE;
    else if (pu.type === "hover")  state.hoverT = DUR_HOVER;
  }

  function onObstacleHit(ob) {
    if (state.shieldOn) {
      // shield absorbs the hit — set iframes FIRST so simultaneous obstacles
      // in the same z-window are also no-op'd this frame.
      state.player.iframes = 1.2;
      state.shieldOn = false;
      ob._dead = true;
      ob.hit = true;
      // Also clear any other obstacles already overlapping the player
      // (e.g. the second slab of a 2-lane wall) so the absorb feels clean.
      for (var s = 0; s < state.obstacles.length; s++) {
        var so = state.obstacles[s];
        if (!so._dead && so.z < 1.0 && so.z > -1.5) so._dead = true;
      }
      addShake(6, 0.35);
      pushPopup("SHIELD!", playerScreenX(), playerScreenY() - 30, "is-bonus");
      sfx.powerupUse();
      burstAt(playerScreenX(), playerScreenY(), "#5de0f0", 22);
      try {
        if (window.MrMacsToast && window.MrMacsToast.push) {
          window.MrMacsToast.push({ title: "Shield absorbed!", tone: "shards", ms: 1400 });
        }
      } catch (e) {}
      return;
    }
    // Take a life
    addShake(10, 0.5);
    sfx.obstacleHit();
    sfx.lifeLost();
    state.coinChain = 0;
    state.lives--;
    if (state.lives <= 0) {
      die();
    } else {
      // brief i-frames; clear nearby obstacles to give a fair restart window
      state.player.iframes = 1.4;
      for (var i = 0; i < state.obstacles.length; i++) {
        var o = state.obstacles[i];
        if (o.z < 6 && o.z > -2) o._dead = true;
      }
      pushPopup("-1 LIFE", playerScreenX(), playerScreenY() - 30, "is-warn");
    }
  }

  function die() {
    var p = state.player;
    if (p.dying) return;
    p.dying = true;
    p.dyingT = 0;
    addShake(12, 0.6);
    sfx.gameOver();
    phase = "dying";
    setTimeout(function () { gameOver(); }, 1100);
  }

  function onScholarGatePassed(g) {
    sfx.scholarPass();
    // Open review modal (optional — game keeps running visually paused)
    openScholarQuestion(g);
  }

  function checkBonusLifeAndMilestones() {
    var d = Math.floor(state.distance);
    // Bonus life every 1km
    var threshold = Math.floor(d / BONUS_LIFE_DISTANCE) * BONUS_LIFE_DISTANCE;
    if (threshold > lastBonusLifeDistance && threshold >= BONUS_LIFE_DISTANCE) {
      lastBonusLifeDistance = threshold;
      state.lives++;
      pushPopup("+1 LIFE", LOGICAL_W / 2, ROAD_HORIZON_Y + 50, "is-bonus");
      sfx.milestone();
    }
    // Distance milestones every 500m
    var mile = Math.floor(d / DISTANCE_MILESTONE) * DISTANCE_MILESTONE;
    if (mile > lastMilestoneAnnounced && mile >= DISTANCE_MILESTONE) {
      lastMilestoneAnnounced = mile;
      pushPopup("Distance unlocked!", LOGICAL_W / 2, ROAD_HORIZON_Y + 28, "is-milestone");
      pushPopup(mile + "m", LOGICAL_W / 2, ROAD_HORIZON_Y + 56, "is-score");
      sfx.milestone();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 22, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      // bonus on milestone
      var milestoneBonus = 200 * Math.max(1, Math.floor(mile / DISTANCE_MILESTONE));
      state.score += milestoneBonus;
    }
  }

  function scoreMult() {
    return state.doubleT > 0 ? 2 : 1;
  }

  // -- Particles + popups ----------------------------------------------------
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    count = count || 10;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 140;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.55,
        totalLife: 0.55,
        color: color,
        size: 2 + Math.random() * 2.4
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

    drawSky();
    drawStars();
    drawParallax();
    drawRoad();
    // Sort and draw all entities back-to-front (high z first → low z last)
    var ents = [];
    for (var i = 0; i < state.gates.length; i++)     ents.push({ z: state.gates[i].z, kind: "gate", ref: state.gates[i] });
    for (var j = 0; j < state.obstacles.length; j++) ents.push({ z: state.obstacles[j].z, kind: "obstacle", ref: state.obstacles[j] });
    for (var k = 0; k < state.coins.length; k++)     ents.push({ z: state.coins[k].z, kind: "coin", ref: state.coins[k] });
    for (var m = 0; m < state.powerups.length; m++)  ents.push({ z: state.powerups[m].z, kind: "powerup", ref: state.powerups[m] });
    ents.sort(function (a, b) { return b.z - a.z; });
    for (var n = 0; n < ents.length; n++) {
      var e = ents[n];
      if (e.kind === "gate") drawScholarGate(e.ref);
      else if (e.kind === "obstacle") drawObstacle(e.ref);
      else if (e.kind === "coin") drawCoin(e.ref);
      else if (e.kind === "powerup") drawPowerup(e.ref);
    }
    drawSpeedLines();
    drawPlayer();
    drawParticles();
    ctx.restore();
  }

  function drawSky() {
    var sky = ctx.createLinearGradient(0, 0, 0, ROAD_HORIZON_Y + 20);
    sky.addColorStop(0, "#03050d");
    sky.addColorStop(0.4, "#0a1226");
    sky.addColorStop(0.85, "#1a1840");
    sky.addColorStop(1, "#3a1a55");
    ctx.fillStyle = sky;
    ctx.fillRect(-50, -50, LOGICAL_W + 100, ROAD_HORIZON_Y + 50);
    // horizon glow band
    var glow = ctx.createLinearGradient(0, ROAD_HORIZON_Y - 20, 0, ROAD_HORIZON_Y + 30);
    glow.addColorStop(0, "rgba(242,61,214,0)");
    glow.addColorStop(0.5, "rgba(242,61,214,0.18)");
    glow.addColorStop(1, "rgba(93,224,240,0.06)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, ROAD_HORIZON_Y - 20, LOGICAL_W, 50);
  }
  function drawStars() {
    if (!state.starfield || reducedMotion) {
      // no twinkle in reduced motion; still draw a static field
      if (state.starfield) {
        for (var i = 0; i < state.starfield.length; i++) {
          var s = state.starfield[i];
          ctx.fillStyle = "rgba(255,255,255,0.20)";
          ctx.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
        }
      }
      return;
    }
    for (var k = 0; k < state.starfield.length; k++) {
      var st = state.starfield[k];
      var tw = 0.5 + 0.5 * Math.abs(Math.sin(state.time * st.twinkleSpeed + st.twinkle));
      ctx.fillStyle = "rgba(255,255,255," + (0.22 * tw) + ")";
      ctx.fillRect(st.x - st.r / 2, st.y - st.r / 2, st.r, st.r);
    }
  }
  function drawParallax() {
    if (reducedMotion) return;
    // Parallax silhouettes scroll with distance (slowly)
    for (var li = 0; li < state.bgLayers.length; li++) {
      var layer = state.bgLayers[li];
      var scroll = (state.distance * layer.z * 8) % LOGICAL_W;
      ctx.fillStyle = layer.color;
      for (var s = 0; s < layer.spans.length; s++) {
        var sp = layer.spans[s];
        var x = sp.x - scroll;
        // wrap two copies for seamless scrolling
        for (var r = 0; r < 2; r++) {
          var dx = x + r * LOGICAL_W;
          if (dx > LOGICAL_W + 100 || dx < -200) continue;
          ctx.beginPath();
          ctx.moveTo(dx, ROAD_HORIZON_Y - 8);
          ctx.lineTo(dx + sp.w * 0.3, ROAD_HORIZON_Y - sp.h);
          ctx.lineTo(dx + sp.w * 0.6, ROAD_HORIZON_Y - sp.h * 0.8 + sp.tilt);
          ctx.lineTo(dx + sp.w, ROAD_HORIZON_Y - 8);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
  function drawRoad() {
    // Road body — trapezoid from (CX-near, near_y) to (CX-far, horizon_y)
    var nearLX = VANISHING_X - ROAD_NEAR_HALF_W, nearRX = VANISHING_X + ROAD_NEAR_HALF_W;
    var farLX = VANISHING_X - ROAD_FAR_HALF_W, farRX = VANISHING_X + ROAD_FAR_HALF_W;
    // Asphalt fill
    var asphalt = ctx.createLinearGradient(0, ROAD_HORIZON_Y, 0, ROAD_NEAR_Y);
    asphalt.addColorStop(0, "#0d121b");
    asphalt.addColorStop(0.5, "#161c2c");
    asphalt.addColorStop(1, "#1d2638");
    ctx.fillStyle = asphalt;
    ctx.beginPath();
    ctx.moveTo(farLX, ROAD_HORIZON_Y);
    ctx.lineTo(farRX, ROAD_HORIZON_Y);
    ctx.lineTo(nearRX, ROAD_NEAR_Y);
    ctx.lineTo(nearLX, ROAD_NEAR_Y);
    ctx.closePath();
    ctx.fill();
    // Road texture stripes (for parallax road texture feel)
    drawRoadTexture(nearLX, nearRX, farLX, farRX);
    // Lane edges (cyan + magenta glow)
    drawLaneEdges();
    // Lane center dashes — moving forward
    drawLaneDashes();
    // Vignette near horizon (fades to dark)
    var vg = ctx.createLinearGradient(0, ROAD_HORIZON_Y, 0, ROAD_HORIZON_Y + 80);
    vg.addColorStop(0, "rgba(4,6,15,0.7)");
    vg.addColorStop(1, "rgba(4,6,15,0)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, ROAD_HORIZON_Y, LOGICAL_W, 80);
  }
  function drawRoadTexture(nearLX, nearRX, farLX, farRX) {
    // Faint horizontal bands scrolling (gives motion at high speed)
    var scroll = (state.distance * 12) % ROAD_SEGMENT_LEN;
    for (var z = -scroll; z < Z_HORIZON; z += ROAD_SEGMENT_LEN) {
      var y0 = zToScreenY(z), y1 = zToScreenY(z + 0.5);
      var t = clamp01(z / Z_HORIZON);
      var halfW = ROAD_NEAR_HALF_W + (ROAD_FAR_HALF_W - ROAD_NEAR_HALF_W) * t;
      var alpha = 0.04 + (1 - t) * 0.05;
      ctx.fillStyle = "rgba(93,224,240," + alpha + ")";
      ctx.beginPath();
      ctx.moveTo(VANISHING_X - halfW, y0);
      ctx.lineTo(VANISHING_X + halfW, y0);
      ctx.lineTo(VANISHING_X + halfW * 0.99, y1);
      ctx.lineTo(VANISHING_X - halfW * 0.99, y1);
      ctx.closePath();
      ctx.fill();
    }
  }
  function drawLaneEdges() {
    // Outer rails — left magenta, right cyan
    ctx.strokeStyle = "rgba(242,61,214,0.85)";
    ctx.lineWidth = 3;
    if (!reducedMotion) {
      ctx.shadowColor = "#f23dd6";
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.moveTo(VANISHING_X - ROAD_NEAR_HALF_W, ROAD_NEAR_Y);
    ctx.lineTo(VANISHING_X - ROAD_FAR_HALF_W, ROAD_HORIZON_Y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(93,224,240,0.85)";
    if (!reducedMotion) ctx.shadowColor = "#5de0f0";
    ctx.beginPath();
    ctx.moveTo(VANISHING_X + ROAD_NEAR_HALF_W, ROAD_NEAR_Y);
    ctx.lineTo(VANISHING_X + ROAD_FAR_HALF_W, ROAD_HORIZON_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner lane dividers (between lanes 0|1 and 1|2) — converging toward vanishing point
    ctx.strokeStyle = "rgba(245,224,144,0.32)";
    ctx.lineWidth = 1.4;
    for (var i = 1; i < LANE_COUNT; i++) {
      // boundary at x-offset = -1 + 2*i/3 (in lane units: -1, -1/3, +1/3, +1)
      var boundary = -1 + (2 * i / LANE_COUNT);
      var nearX = VANISHING_X + boundary * ROAD_NEAR_HALF_W * 0.95;
      var farX = VANISHING_X + boundary * ROAD_FAR_HALF_W * 0.95;
      ctx.beginPath();
      ctx.moveTo(nearX, ROAD_NEAR_Y);
      ctx.lineTo(farX, ROAD_HORIZON_Y);
      ctx.stroke();
    }
  }
  function drawLaneDashes() {
    // Dashed center yellow line in each inter-lane — moves forward.
    // Each segment of length ROAD_SEGMENT_LEN renders one dash (the first 45%) and
    // an implicit gap (the last 55%); for-step ROAD_SEGMENT_LEN gives natural cadence.
    var dashLen = ROAD_SEGMENT_LEN * 0.45;
    var scroll = (state.distance) % ROAD_SEGMENT_LEN;
    for (var i = 1; i < LANE_COUNT; i++) {
      var boundary = -1 + (2 * i / LANE_COUNT);
      for (var z = -scroll; z < Z_HORIZON; z += ROAD_SEGMENT_LEN) {
        var z0 = z, z1 = z + dashLen;
        if (z1 < 0) continue;
        if (z0 > Z_HORIZON) continue;
        z0 = Math.max(z0, 0);
        z1 = Math.min(z1, Z_HORIZON - 0.1);
        var t0 = clamp01(z0 / Z_HORIZON), t1 = clamp01(z1 / Z_HORIZON);
        var x0 = VANISHING_X + boundary * (ROAD_NEAR_HALF_W + (ROAD_FAR_HALF_W - ROAD_NEAR_HALF_W) * t0) * 0.95;
        var x1 = VANISHING_X + boundary * (ROAD_NEAR_HALF_W + (ROAD_FAR_HALF_W - ROAD_NEAR_HALF_W) * t1) * 0.95;
        var y0 = zToScreenY(z0), y1 = zToScreenY(z1);
        var width0 = 4 * (1 - t0) + 0.5;
        var width1 = 4 * (1 - t1) + 0.5;
        ctx.fillStyle = "rgba(245,224,144,0.85)";
        ctx.beginPath();
        ctx.moveTo(x0 - width0 / 2, y0);
        ctx.lineTo(x0 + width0 / 2, y0);
        ctx.lineTo(x1 + width1 / 2, y1);
        ctx.lineTo(x1 - width1 / 2, y1);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  function drawSpeedLines() {
    if (reducedMotion) return;
    var spd = currentSpeed();
    var density = clamp01((spd - SPEED_START) / (SPEED_MAX - SPEED_START));
    var count = Math.floor(8 + 18 * density);
    if (state.boostT > 0) count += 14;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255," + (0.10 + 0.18 * density) + ")";
    ctx.lineWidth = 1.5;
    var seed = Math.floor(state.time * 30);
    for (var i = 0; i < count; i++) {
      var rx = pseudoRand(seed + i * 7) * LOGICAL_W;
      var ry = pseudoRand(seed + i * 11) * (LOGICAL_H * 0.6) + 60;
      var len = 16 + pseudoRand(seed + i * 13) * 28 * (1 + density);
      // direction: lines fan outward from vanishing point downward
      var dx = rx - VANISHING_X;
      var dy = ry - ROAD_HORIZON_Y * 0.5;
      var mag = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      var nx = dx / mag, ny = dy / mag;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + nx * len, ry + ny * len);
      ctx.stroke();
    }
    ctx.restore();
  }
  function pseudoRand(n) {
    // Stable per-int hash → 0..1
    var x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  // -- Entity drawers --------------------------------------------------------
  function drawCoin(c) {
    if (c.collected || c.z <= -1) return;
    var z = Math.max(0, c.z);
    var pos = projectLaneZ(c.lane, z);
    var s = pos.scale;
    var x = pos.x;
    var bob = reducedMotion ? 0 : Math.sin(c.bob) * 4 * s;
    var y = pos.y - 18 * s + (c.yOff || 0) * s + bob;
    // gold sparkle halo
    if (!reducedMotion) {
      var halo = ctx.createRadialGradient(x, y, 1, x, y, 18 * s);
      halo.addColorStop(0, "rgba(245,196,81,0.55)");
      halo.addColorStop(1, "rgba(245,196,81,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, 18 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Spinning coin (squashed ellipse to imply rotation)
    var spin = (state.time * 6 + c.bob) % (Math.PI * 2);
    var sw = Math.abs(Math.cos(spin));
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.ellipse(x, y, 11 * s * Math.max(0.18, sw), 11 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // edge ring
    ctx.strokeStyle = "#a8780f";
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.ellipse(x, y, 11 * s * Math.max(0.18, sw), 11 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    // shimmer cross
    if (!reducedMotion) {
      ctx.strokeStyle = "rgba(255,250,210,0.7)";
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(x, y - 6 * s);
      ctx.lineTo(x, y + 6 * s);
      ctx.stroke();
    }
  }

  function drawPowerup(p) {
    if (p.collected || p.z <= -1) return;
    var z = Math.max(0, p.z);
    var pos = projectLaneZ(p.lane, z);
    var s = pos.scale;
    var x = pos.x;
    var bob = reducedMotion ? 0 : Math.sin(p.bob) * 4 * s;
    var y = pos.y - 24 * s + bob;
    var meta = POWERUP_META[p.type];
    // halo
    if (!reducedMotion) {
      var halo = ctx.createRadialGradient(x, y, 1, x, y, 22 * s);
      halo.addColorStop(0, hexA(meta.glow, 0.55));
      halo.addColorStop(1, hexA(meta.glow, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // disc
    ctx.fillStyle = "rgba(4,8,18,0.88)";
    ctx.beginPath();
    ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = meta.glow;
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
    ctx.stroke();
    // glyph (emoji-ish — we render text; if browser doesn't support, label still readable)
    ctx.fillStyle = meta.color;
    ctx.font = (16 * s) + "px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meta.glyph, x, y + 1 * s);
  }

  function drawScholarGate(g) {
    if (g.passed || g.z <= -1) return;
    var z = Math.max(0, g.z);
    var pos = projectFreeXZ(0, z);
    var s = pos.scale;
    // Arch spans full road width at this depth
    var halfW = (ROAD_NEAR_HALF_W + (ROAD_FAR_HALF_W - ROAD_NEAR_HALF_W) * clamp01(z / Z_HORIZON));
    var topY = pos.y - 130 * s;
    var baseY = pos.y + 8 * s;
    var leftX = VANISHING_X - halfW;
    var rightX = VANISHING_X + halfW;
    var pulse = reducedMotion ? 0.65 : (0.5 + 0.5 * Math.sin(g.pulse));
    // Posts
    ctx.save();
    ctx.lineWidth = 6 * s;
    ctx.strokeStyle = "#f5c451";
    if (!reducedMotion) {
      ctx.shadowColor = "#f5c451";
      ctx.shadowBlur = 18 * s;
    }
    // Left post
    ctx.beginPath();
    ctx.moveTo(leftX, baseY);
    ctx.lineTo(leftX + 4 * s, topY);
    ctx.stroke();
    // Right post
    ctx.beginPath();
    ctx.moveTo(rightX, baseY);
    ctx.lineTo(rightX - 4 * s, topY);
    ctx.stroke();
    // Arch crossbar (curved)
    ctx.beginPath();
    ctx.moveTo(leftX + 4 * s, topY);
    ctx.quadraticCurveTo(VANISHING_X, topY - 30 * s, rightX - 4 * s, topY);
    ctx.stroke();
    ctx.restore();
    // Inner curtain / shimmer
    if (!reducedMotion) {
      var curtain = ctx.createLinearGradient(0, topY, 0, baseY);
      curtain.addColorStop(0, "rgba(245,196,81,0.20)");
      curtain.addColorStop(0.5, "rgba(169,145,255,0.10)");
      curtain.addColorStop(1, "rgba(93,224,240,0)");
      ctx.fillStyle = curtain;
      ctx.beginPath();
      ctx.moveTo(leftX + 6 * s, topY + 4 * s);
      ctx.quadraticCurveTo(VANISHING_X, topY - 18 * s, rightX - 6 * s, topY + 4 * s);
      ctx.lineTo(rightX, baseY);
      ctx.lineTo(leftX, baseY);
      ctx.closePath();
      ctx.fill();
    }
    // Rotating "?" centered
    var qrot = reducedMotion ? 0 : (state.time * 1.6);
    ctx.save();
    ctx.translate(VANISHING_X, topY + 18 * s);
    ctx.rotate(qrot);
    var colors = ["#f5c451", "#5de0f0", "#a991ff", "#f07bb8"];
    for (var i = 0; i < colors.length; i++) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.arc(0, -2 * s, 12 * s, Math.PI * 0.85 + i * 0.4, Math.PI * 2.0 + i * 0.4);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold " + (24 * s) + "px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 1 * s);
    ctx.restore();
    // SCHOLAR ribbon below
    ctx.save();
    ctx.fillStyle = "rgba(245,196,81," + (0.5 + 0.4 * pulse) + ")";
    ctx.font = "bold " + (12 * s) + "px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCHOLAR · OPTIONAL", VANISHING_X, baseY - 6 * s);
    ctx.restore();
  }

  function drawObstacle(ob) {
    if (ob._dead || ob.z <= -2) return;
    var z = Math.max(0, ob.z);
    var pos = projectLaneZ(ob.lane, z);
    var s = pos.scale;
    var x = pos.x;
    var groundY = pos.y;
    if (ob.type === "wall") {
      drawWall(x, groundY, s);
    } else if (ob.type === "pipe") {
      drawPipe(x, groundY, s);
    } else if (ob.type === "beam") {
      drawBeam(x, groundY, s);
    } else if (ob.type === "spinner") {
      drawSpinner(x, groundY, s, ob.spinPhase);
    }
  }
  function drawWall(x, y, s) {
    // Tall lane-blocking slab: red/orange industrial barricade
    var w = 92 * s, h = 90 * s;
    ctx.save();
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 4 * s, w * 0.55, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // body (gradient)
    var grad = ctx.createLinearGradient(x - w / 2, y - h, x + w / 2, y);
    grad.addColorStop(0, "#7e1c20");
    grad.addColorStop(0.5, "#c1232c");
    grad.addColorStop(1, "#601012");
    ctx.fillStyle = grad;
    ctx.fillRect(x - w / 2, y - h, w, h);
    // diagonal hazard stripes
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - w / 2, y - h, w, h);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,232,128,0.85)";
    ctx.lineWidth = 6 * s;
    var stripeGap = 18 * s;
    for (var i = -h; i < w + h; i += stripeGap) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + i, y);
      ctx.lineTo(x - w / 2 + i + h, y - h);
      ctx.stroke();
    }
    ctx.restore();
    // outline + glow
    ctx.strokeStyle = "#f04860";
    ctx.lineWidth = 2 * s;
    if (!reducedMotion) {
      ctx.shadowColor = "#f04860";
      ctx.shadowBlur = 14 * s;
    }
    ctx.strokeRect(x - w / 2, y - h, w, h);
    ctx.restore();
  }
  function drawPipe(x, y, s) {
    // Low pipe spanning lane: blue-steel cylinder
    var w = 90 * s, h = 28 * s;
    ctx.save();
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.beginPath();
    ctx.ellipse(x, y + 4 * s, w * 0.55, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // pipe body — darker gradient
    var grad = ctx.createLinearGradient(0, y - h, 0, y);
    grad.addColorStop(0, "#2a5570");
    grad.addColorStop(0.5, "#5a8aaa");
    grad.addColorStop(1, "#1a3848");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - w / 2, y - h, w, h, 8 * s) : ctx.rect(x - w / 2, y - h, w, h);
    ctx.fill();
    // top sheen
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.ellipse(x, y - h + 4 * s, w * 0.45, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // glow ring
    ctx.strokeStyle = "#5de0f0";
    ctx.lineWidth = 2 * s;
    if (!reducedMotion) {
      ctx.shadowColor = "#5de0f0";
      ctx.shadowBlur = 12 * s;
    }
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h, w, h, 8 * s);
      ctx.stroke();
    } else {
      ctx.strokeRect(x - w / 2, y - h, w, h);
    }
    // arrow up icon (jump hint)
    ctx.fillStyle = "rgba(168,232,255,0.85)";
    ctx.font = "bold " + (12 * s) + "px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("▲", x, y - h * 0.5);
    ctx.restore();
  }
  function drawBeam(x, y, s) {
    // High beam suspended overhead: must slide
    var w = 100 * s, h = 16 * s;
    var beamY = y - 90 * s; // hang well above ground
    ctx.save();
    // chain/rod suspending it
    ctx.strokeStyle = "rgba(180,180,200,0.65)";
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.35, beamY);
    ctx.lineTo(x - w * 0.35, beamY - 30 * s);
    ctx.moveTo(x + w * 0.35, beamY);
    ctx.lineTo(x + w * 0.35, beamY - 30 * s);
    ctx.stroke();
    // beam body
    var grad = ctx.createLinearGradient(0, beamY - h, 0, beamY);
    grad.addColorStop(0, "#3c2e16");
    grad.addColorStop(0.5, "#7a5a2a");
    grad.addColorStop(1, "#28200e");
    ctx.fillStyle = grad;
    ctx.fillRect(x - w / 2, beamY - h, w, h);
    // hazard stripes (yellow/black)
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - w / 2, beamY - h, w, h);
    ctx.clip();
    var sg = 14 * s;
    for (var i = -h; i < w + h; i += sg) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + i, beamY);
      ctx.lineTo(x - w / 2 + i + sg / 2, beamY);
      ctx.lineTo(x - w / 2 + i + sg / 2 + h, beamY - h);
      ctx.lineTo(x - w / 2 + i + h, beamY - h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // glow
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 2 * s;
    if (!reducedMotion) {
      ctx.shadowColor = "#f5c451";
      ctx.shadowBlur = 12 * s;
    }
    ctx.strokeRect(x - w / 2, beamY - h, w, h);
    // arrow down icon (slide hint)
    ctx.fillStyle = "rgba(245,224,144,0.95)";
    ctx.font = "bold " + (12 * s) + "px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("▼", x, beamY - h * 0.5);
    ctx.restore();
  }
  function drawSpinner(x, y, s, phase) {
    // Spinning hazard: central hub with two rotating arms; player must jump or slide based on arm orientation
    var hubR = 12 * s;
    var armLen = 46 * s;
    var armW = 8 * s;
    var pivotY = y - 50 * s;
    ctx.save();
    // post connecting to ground
    ctx.fillStyle = "#2a3040";
    ctx.fillRect(x - 3 * s, pivotY, 6 * s, 50 * s);
    // arms
    ctx.translate(x, pivotY);
    ctx.rotate(phase);
    // arm gradient
    var grad = ctx.createLinearGradient(-armLen, 0, armLen, 0);
    grad.addColorStop(0, "#7a1c50");
    grad.addColorStop(0.5, "#f04880");
    grad.addColorStop(1, "#7a1c50");
    ctx.fillStyle = grad;
    ctx.fillRect(-armLen, -armW / 2, armLen * 2, armW);
    // hub
    ctx.fillStyle = "#1a1018";
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f04880";
    ctx.lineWidth = 2 * s;
    if (!reducedMotion) {
      ctx.shadowColor = "#f04880";
      ctx.shadowBlur = 14 * s;
    }
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer() {
    var p = state.player;
    if (p.dying) {
      drawDyingPlayer();
      return;
    }
    var x = playerScreenX();
    var groundY = PLAYER_NEAR_Y;
    var y = groundY + p.yOff;
    // Shadow on ground (squashes during jump, scaled with jump height)
    var jumpFactor = p.jumping ? Math.sin(p.jumpT * Math.PI) : 0;
    var shadowSize = 18 * (1 - jumpFactor * 0.6);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(x, groundY + 6, shadowSize, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Hover halo
    if (state.hoverT > 0 && !reducedMotion) {
      var halo = ctx.createRadialGradient(x, y, 4, x, y, 36);
      halo.addColorStop(0, "rgba(77,212,155,0.55)");
      halo.addColorStop(1, "rgba(77,212,155,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, 36, 0, Math.PI * 2);
      ctx.fill();
    }
    // Magnet aura
    if (state.magnetT > 0 && !reducedMotion) {
      ctx.strokeStyle = "rgba(242,61,214,0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y - 18, 30 + Math.sin(state.time * 6) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Boost aura
    if (state.boostT > 0 && !reducedMotion) {
      ctx.strokeStyle = "rgba(245,196,81,0.65)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(x, y - 18, 26 + Math.sin(state.time * 12) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Double-score halo
    if (state.doubleT > 0 && !reducedMotion) {
      var glow2 = ctx.createRadialGradient(x, y - 18, 4, x, y - 18, 30);
      glow2.addColorStop(0, "rgba(169,145,255,0.4)");
      glow2.addColorStop(1, "rgba(169,145,255,0)");
      ctx.fillStyle = glow2;
      ctx.beginPath();
      ctx.arc(x, y - 18, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    drawRunnerSprite(x, y, p);
    // Shield bubble
    if (state.shieldOn) {
      ctx.save();
      ctx.strokeStyle = "#5de0f0";
      ctx.lineWidth = 2.2;
      if (!reducedMotion) {
        ctx.shadowColor = "#5de0f0";
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.arc(x, y - 18, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // i-frames flash
    if (p.iframes > 0 && !reducedMotion) {
      var flick = (Math.floor(state.time * 22) % 2 === 0) ? 1 : 0.4;
      // Override last sprite by drawing an alpha overlay
      ctx.save();
      ctx.globalAlpha = (1 - flick) * 0.5;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y - 18, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawRunnerSprite(cx, cy, p) {
    // Small running figure: head, body, arms swinging, legs cycling
    ctx.save();
    ctx.translate(cx, cy);
    var anim = p.anim;
    var legSwing = Math.sin(anim) * 4;
    var armSwing = Math.sin(anim) * 5;
    var bodyBob = p.jumping ? -2 : Math.sin(anim * 2) * 1.2;
    var slidePose = p.sliding;
    if (slidePose) {
      // slide: rotate and lower
      ctx.rotate(-0.55);
      ctx.translate(0, 8);
    }
    // shadow already drawn above
    // legs
    ctx.fillStyle = "#1a1208";
    if (slidePose) {
      // legs forward
      ctx.fillRect(-2, -2, 14, 5);
      ctx.fillRect(-2, 3, 14, 5);
    } else {
      ctx.fillRect(-6 + legSwing * 0.4, 4 + bodyBob, 4, 10);
      ctx.fillRect(2 - legSwing * 0.4, 4 + bodyBob, 4, 10);
      // boots
      ctx.fillStyle = "#0a0508";
      ctx.fillRect(-6 + legSwing * 0.4, 12 + bodyBob, 5, 3);
      ctx.fillRect(2 - legSwing * 0.4, 12 + bodyBob, 5, 3);
    }
    // body (jacket)
    ctx.fillStyle = "#3050a0";
    if (slidePose) {
      ctx.fillRect(-12, -6, 16, 9);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, -3 + bodyBob, 9, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // chest highlight
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(-3, -5 + bodyBob, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // arms swinging
      ctx.fillStyle = "#3050a0";
      ctx.fillRect(-11, -4 + bodyBob + armSwing * 0.4, 3, 8);
      ctx.fillRect(8, -4 + bodyBob - armSwing * 0.4, 3, 8);
      // hands
      ctx.fillStyle = "#e8c098";
      ctx.fillRect(-11, 2 + bodyBob + armSwing * 0.4, 3, 3);
      ctx.fillRect(8, 2 + bodyBob - armSwing * 0.4, 3, 3);
    }
    // head
    ctx.fillStyle = "#e8c098";
    if (slidePose) {
      ctx.beginPath();
      ctx.arc(-12, -2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -14 + bodyBob, 6, 0, Math.PI * 2);
      ctx.fill();
      // hair
      ctx.fillStyle = "#3a2a1a";
      ctx.beginPath();
      ctx.arc(0, -17 + bodyBob, 5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-5, -17 + bodyBob, 10, 2);
      // eyes (forward)
      ctx.fillStyle = "#1a1208";
      ctx.beginPath();
      ctx.arc(-1.6, -13 + bodyBob, 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1.6, -13 + bodyBob, 1.1, 0, Math.PI * 2);
      ctx.fill();
      // confident grin
      ctx.strokeStyle = "rgba(40,20,10,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -11 + bodyBob, 1.5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    // boost trail (behind the body)
    if (state.boostT > 0 && !reducedMotion) {
      ctx.fillStyle = "rgba(245,196,81,0.55)";
      ctx.beginPath();
      ctx.moveTo(-12, 4 + bodyBob);
      ctx.lineTo(-22, 6 + bodyBob);
      ctx.lineTo(-12, 8 + bodyBob);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  function drawDyingPlayer() {
    var p = state.player;
    var x = playerScreenX();
    var y = PLAYER_NEAR_Y + p.yOff;
    var t = p.dyingT;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 4);
    ctx.scale(1 - t * 0.4, 1 - t * 0.4);
    ctx.globalAlpha = Math.max(0, 1 - t * 0.7);
    drawRunnerSprite(0, 0, { anim: p.anim, jumping: false, sliding: false });
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
    if (dom.hudDistance) dom.hudDistance.textContent = Math.floor(state.distance) + "m";
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudShards) dom.hudShards.textContent = String(state.shardsAwarded);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    var livesCell = dom.hudLives && dom.hudLives.parentElement;
    if (livesCell) livesCell.classList.toggle("is-warning", state.lives === 1);
    var distCell = dom.hudDistance && dom.hudDistance.parentElement;
    if (distCell) distCell.classList.toggle("is-boost", state.boostT > 0);
    if (dom.goalName) {
      var lane = playerCurrentLane();
      var laneName = lane === 0 ? "Left lane" : lane === 1 ? "Mid lane" : "Right lane";
      dom.goalName.textContent = laneName + " · " + currentSpeed().toFixed(1) + " m/s";
    }
    if (dom.goalMeta) {
      var bits = [];
      if (state.magnetT > 0) bits.push("Magnet " + state.magnetT.toFixed(1) + "s");
      if (state.boostT > 0) bits.push("Boost " + state.boostT.toFixed(1) + "s");
      if (state.doubleT > 0) bits.push("x2 " + state.doubleT.toFixed(1) + "s");
      if (state.hoverT > 0) bits.push("Hover " + state.hoverT.toFixed(1) + "s");
      if (state.shieldOn) bits.push("Shield");
      if (bits.length === 0) bits.push("Powerups · 0 active");
      bits.push("Coins " + state.coinsCollected);
      dom.goalMeta.textContent = bits.join(" · ");
    }
  }
  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Scholar / review modal -----------------------------------------------
  var activeQuestion = null;
  var pendingScholarGate = null;

  function pickQuestion() {
    // MRMAC_QUESTION_VALIDATOR_V1 — retry up to 15× for a valid bank question
    var __mrmacBank = (typeof window !== "undefined" && window.MrMacsPickValidQuestion)
      ? window.MrMacsPickValidQuestion(function () {
          var bank = window.DIAG_BANK_BY_COURSE;
          if (!bank || typeof bank !== "object") return null;
          var pool = [];
          for (var c in bank) {
            if (Array.isArray(bank[c])) pool = pool.concat(bank[c]);
          }
          if (!pool.length) return null;
          var q = pool[Math.floor(Math.random() * pool.length)];
          return normalizeBankQuestion(q);
        }, 15)
      : null;
    if (__mrmacBank) return __mrmacBank;
    // Inline-bank fallback — validate before returning so a malformed inline
    // question can't slip through either. If everything is broken, return the
    // first inline question as a last resort (game stays playable).
    var __mrmacInline = (typeof window !== "undefined" && window.MrMacsPickValidQuestion)
      ? window.MrMacsPickValidQuestion(function () {
          return INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
        }, 10)
      : null;
    if (__mrmacInline) return __mrmacInline;
    return INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
  }
  function normalizeBankQuestion(q) {
    if (!q) return null;
    if (q.prompt && q.choices && q.correctText) return q;
    if (q.question && q.options) {
      var ct = null;
      if (typeof q.answer === "number" && q.options[q.answer]) ct = q.options[q.answer];
      else if (typeof q.correct === "number" && q.options[q.correct]) ct = q.options[q.correct];
      else if (q.correctText) ct = q.correctText;
      if (!ct) return null;
      return { prompt: q.question, choices: q.options.slice(), correctText: ct };
    }
    return null;
  }

  function openScholarQuestion(gate) {
    activeQuestion = pickQuestion();
    pendingScholarGate = gate;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Gate · Optional · +1500 + 12 shards";
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
    dom.questionPrompt.textContent = activeQuestion.prompt;
    dom.explanation.textContent = "";
    dom.explanation.className = "explanation";
    var letters = ["A", "B", "C", "D"];
    var choices = activeQuestion.choices.slice();
    for (var i = choices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = choices[i]; choices[i] = choices[j]; choices[j] = t;
    }
    var html = "";
    for (var k = 0; k < choices.length && k < 4; k++) {
      html += '<button class="choice-btn" data-text="' + escapeHtml(choices[k]) + '">' +
        '<span class="choice-letter">' + letters[k] + '</span>' +
        escapeHtml(choices[k]) + '</button>';
    }
    dom.choiceGrid.innerHTML = html;
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    for (var b = 0; b < btns.length; b++) btns[b].addEventListener("click", onChoiceClick);
  }
  function onChoiceClick(e) {
    var btn = e.currentTarget;
    var picked = btn.getAttribute("data-text");
    var correct = picked === activeQuestion.correctText;
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    btns.forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute("data-text") === activeQuestion.correctText) b.classList.add("is-correct");
      else if (b === btn) b.classList.add("is-wrong");
    });
    if (correct) {
      dom.explanation.textContent = "Decoded! +1500 plus a +1 life and 12 bonus shards.";
      dom.explanation.className = "explanation is-correct";
      state.questionsAnsweredCorrect++;
      sfx.scholarCorrect();
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText;
      dom.explanation.className = "explanation is-wrong";
      sfx.scholarWrong();
    }
    state.questionsAnsweredTotal++;
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }
  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += 1500;
      addShards(12, GAME_ID + "-scholar-correct");
      state.lives++;
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+1500 SCHOLAR", LOGICAL_W / 2, ROAD_HORIZON_Y + 30, "is-bonus");
      pushPopup("+1 LIFE", LOGICAL_W / 2, ROAD_HORIZON_Y + 56, "is-score");
    }
    activeQuestion = null;
    pendingScholarGate = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }
  function skipQuestion() {
    activeQuestion = null;
    pendingScholarGate = null;
    phase = prevPhase || "playing";
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
    // Award additional shards from final score (bonus beyond per-coin shards), capped at 200/run total
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 400));
    if (shardsToAdd > 0) addShards(shardsToAdd, GAME_ID + "-final");
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Lane Lost" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Reflex Run · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Distance</div><div class="end-cell-value">' + Math.floor(state.distance) + 'm</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Coins</div><div class="end-cell-value">' + state.coinsCollected + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Obstacles Cleared</div><div class="end-cell-value">' + state.obstaclesPassed + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Top Speed</div><div class="end-cell-value">' + state.maxSpeed.toFixed(1) + ' m/s</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Coin Chain</div><div class="end-cell-value">' + state.maxCoinChain + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.stopTracking(); MrMacsEndRecap.render(document.getElementById("endRecap")); } } catch (e) {}
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
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    // Reflex Run is a vertical-perspective lane runner — the world scrolls
    // toward the camera with a vanishing point at LOGICAL_W/2. On portrait
    // phones we want the world to fill the screen vertically; horizontal
    // clipping is fine because the player runs in a centered 3-lane strip.
    // (May 10 2026 — was 40% canvas fill on phones with old min math.)
    var sx = rect.width / LOGICAL_W;
    var sy = rect.height / LOGICAL_H;
    if (sy > sx * 1.2) {
      // Tall portrait: fit by height, accept horizontal clipping
      scale = sy;
      offsetX = (rect.width - LOGICAL_W * scale) / 2;
      offsetY = 0;
    } else {
      scale = Math.min(sx, sy);
      offsetX = (rect.width - LOGICAL_W * scale) / 2;
      offsetY = (rect.height - LOGICAL_H * scale) / 2;
    }
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          distance: Math.floor(state.distance),
          coins: state.coinsCollected
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
          distance: Math.floor(state.distance),
          lives: state.lives,
          coins: state.coinsCollected,
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
  function recordPlayWithProfile() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/reflex-run/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("reflex-run:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("reflex-run:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("runner-synthwave", { volume: 0.5 });
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
        if (k === "ArrowLeft" || k === "a" || k === "A") { moveLane(-1); e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { moveLane(+1); e.preventDefault(); return; }
        if (k === " " || k === "ArrowUp" || k === "w" || k === "W") { jump(); e.preventDefault(); return; }
        if (k === "ArrowDown" || k === "s" || k === "S") { slide(); e.preventDefault(); return; }
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
    bindTouch();
    bindTouchControls();
  }

  function bindTouch() {
    var touchStart = null;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (e.touches && e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      if (phase !== "playing" || !touchStart) return;
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) { touchStart = null; return; }
      var dx = t.clientX - touchStart.x;
      var dy = t.clientY - touchStart.y;
      var dt = performance.now() - touchStart.t;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      var SWIPE = 24;
      if (ax < SWIPE && ay < SWIPE && dt < 250) {
        // tap → jump (most common reaction)
        jump();
      } else {
        if (ax > ay) {
          // horizontal swipe → lane change
          if (dx > 0) moveLane(+1);
          else moveLane(-1);
        } else {
          // vertical swipe
          if (dy < 0) jump();
          else slide();
        }
      }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });
  }

  function bindTouchControls() {
    function pressBtn(btn, fn) {
      if (!btn) return;
      var fire = function (e) { if (e) e.preventDefault(); if (phase === "playing") fn(); };
      btn.addEventListener("click", fire);
      btn.addEventListener("touchstart", fire, { passive: false });
    }
    pressBtn(dom.tcUp, jump);
    pressBtn(dom.tcDown, slide);
    pressBtn(dom.tcLeft, function () { moveLane(-1); });
    pressBtn(dom.tcRight, function () { moveLane(+1); });
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing") {
      prevPhase = "playing";
      phase = "paused";
      pauseMusic();
      showScreen("pause");
      renderPauseProgress();
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
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("reflex-run");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "reflex-run", { compact: false });
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
  }

  function exitToArcade() {
    stopMusic();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  function newRun() {
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.reset(); MrMacsEndRecap.startTracking(); } } catch (e) {}
    lastBonusLifeDistance = 0;
    lastMilestoneAnnounced = 0;
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }
  function resumeRun(snap) {
    var s = snap.state || {};
    lastBonusLifeDistance = Math.floor((s.distance || 0) / BONUS_LIFE_DISTANCE) * BONUS_LIFE_DISTANCE;
    lastMilestoneAnnounced = Math.floor((s.distance || 0) / DISTANCE_MILESTONE) * DISTANCE_MILESTONE;
    initState({
      score: s.score || 0,
      distance: s.distance || 0,
      coinsCollected: s.coins || 0,
      lives: s.lives != null ? s.lives : LIVES_INIT,
      best: readBest()
    });
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.distance) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Distance ' + (snap.state.distance || 0) + 'm' +
        ' &middot; Coins ' + (snap.state.coins || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Reflex Run Scores</div>';
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
    if (phase === "playing") {
      updatePlayer(dt);
      updateEntities(dt);
      maybeSpawn();
      checkCollisions();
      checkBonusLifeAndMilestones();
    }
    if (phase === "dying" && state && state.player) {
      state.player.dyingT += dt * 1.4;
      if (state.player.dyingT > 1) state.player.dyingT = 1;
    }
    if (state) {
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "paused") {
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

  try {
    if (window.MrMacsA11yQuickToggle) {
      var hudControls = document.querySelector(".hud-controls") || document.querySelector(".top-hud");
      if (hudControls) MrMacsA11yQuickToggle.mount(hudControls);
    }
  } catch (e) {}

  // ── Help overlay ───────────────────────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      MrMacsHelpOverlay.register("reflex-run", {
        title: "How to Play Reflex Run",
        goal: "Sprint through three neon lanes, clearing obstacles and collecting power-ups — the road only gets faster.",
        controls: [
          { key: "← / →  or  A / D", action: "Swap lanes" },
          { key: "Space  or  Up / W", action: "Jump over low pipes" },
          { key: "Down / S", action: "Slide under high beams" },
          { key: "Esc / P", action: "Pause" }
        ],
        tips: [
          "Time your lane swap early — obstacles arrive faster at higher speeds.",
          "Magnets pull nearby shards toward you without a lane change — grab them first.",
          "Shield absorbs one obstacle hit; score multipliers stack with base lane bonuses.",
          "Hover power-up briefly lifts you above low pipes without a jump keystroke.",
          "Scholar gates appear at random intervals — you can dash right through one at full speed."
        ],
        scholar: "Dashing through a Scholar Gate pauses the run and opens an optional review prompt worth +1500 points and 12 bonus shards. The road resumes where you left off."
      });
      var setupActions = document.querySelector("#setupScreen .setup-actions");
      if (setupActions) MrMacsHelpOverlay.mountButton(setupActions, "reflex-run");
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "reflex-run";
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
