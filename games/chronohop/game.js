/* ===========================================================================
   Chronohop — Frogger-style hopper · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 768x640 logical · 13x13 grid · scholar lily pads
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "chronohop";
  var GAME_TITLE = "Chronohop";

  // Logical canvas + grid
  var LOGICAL_W = 768;
  var LOGICAL_H = 640;
  var CELL = 48;
  var COLS = 16;            // 768 / 48 = 16 across (more horizontal room for traffic)
  var ROWS = 13;            // 13 row slots, top->bottom = 13*48 ~ 624; we use 13 with a small top band
  var FIELD_TOP = 16;       // small top band before goal row
  // Actual playfield height = ROWS * CELL = 624 + FIELD_TOP = 640 ✓

  // Row layout indices (top to bottom)
  var ROW_GOAL    = 0;   // goal lily pads
  var ROW_TOP_SAFE = 1;  // top safe row (water-edge grass)
  var ROW_RIVER_1 = 2;  // river right slow
  var ROW_RIVER_2 = 3;  // river left fast
  var ROW_RIVER_3 = 4;  // river right fast
  var ROW_RIVER_4 = 5;  // river left slow
  var ROW_MEDIAN  = 6;   // median safe
  var ROW_ROAD_1  = 7;   // road left slow
  var ROW_ROAD_2  = 8;   // road right fast
  var ROW_ROAD_3  = 9;   // road left fast
  var ROW_ROAD_4  = 10;  // road right slow
  var ROW_BOTTOM_SAFE = 11; // bottom safe (start)
  var ROW_RESERVE  = 12;  // reserve / off-screen baseline

  function rowKind(r) {
    if (r === ROW_GOAL) return "goal";
    if (r === ROW_TOP_SAFE || r === ROW_MEDIAN || r === ROW_BOTTOM_SAFE) return "safe";
    if (r === ROW_RESERVE) return "safe";
    if (r >= ROW_RIVER_1 && r <= ROW_RIVER_4) return "river";
    return "road";
  }

  // 5 lily pads at columns 1, 4, 7, 10, 13 (with x = col*CELL + CELL/2)
  var GOAL_COLS = [1, 4, 7, 10, 13];

  // Player cell = column index in [0, COLS-1] integer; row index 0..12
  // World drift speeds in cells/sec at level 1
  var BASE_LANE_SPEEDS = {
    river_r_slow: 1.4,
    river_l_fast: 2.4,
    river_r_fast: 2.4,
    river_l_slow: 1.7,
    road_l_slow: 1.6,
    road_r_fast: 2.6,
    road_l_fast: 2.8,
    road_r_slow: 1.8
  };
  var LANE_DEFS = [
    { row: ROW_RIVER_1, kind: "river", dir: +1, speedKey: "river_r_slow",
      pieceLen: [3, 4, 5], color: "#9a6438", spacing: 6.5 },
    { row: ROW_RIVER_2, kind: "river", dir: -1, speedKey: "river_l_fast",
      pieceLen: [3, 4],    color: "#7a5028", spacing: 7.0 },
    { row: ROW_RIVER_3, kind: "river", dir: +1, speedKey: "river_r_fast",
      pieceLen: [3, 4],    color: "#a06838", spacing: 7.0 },
    { row: ROW_RIVER_4, kind: "river", dir: -1, speedKey: "river_l_slow",
      pieceLen: [4, 5],    color: "#8a5828", spacing: 7.5 },
    { row: ROW_ROAD_1,  kind: "road",  dir: -1, speedKey: "road_l_slow",
      pieceLen: [1, 2, 3], color: "#e0a050", spacing: 5.0 },
    { row: ROW_ROAD_2,  kind: "road",  dir: +1, speedKey: "road_r_fast",
      pieceLen: [1, 2],    color: "#90c8e8", spacing: 4.5 },
    { row: ROW_ROAD_3,  kind: "road",  dir: -1, speedKey: "road_l_fast",
      pieceLen: [1, 1, 2], color: "#f06080", spacing: 4.5 },
    { row: ROW_ROAD_4,  kind: "road",  dir: +1, speedKey: "road_r_slow",
      pieceLen: [2, 3],    color: "#a8a0e0", spacing: 5.5 }
  ];

  // Difficulty + scoring
  var MAX_LEVEL = 10;
  var LIVES_INIT = 3;
  var TIMER_INIT = 60.0;
  var POWERUP_DROP_RATE = 0.03;        // 3% per goal scored
  var POWERUP_LIFETIME = 14.0;
  var SCORE_HOP_FORWARD = 10;          // points per upward hop
  var SCORE_GOAL = 500;
  var SCORE_LEVEL_BONUS = 100;         // x level
  var SCORE_TIME_BONUS_PER_SEC = 5;
  var SCORE_SCHOLAR_BONUS = 1000;
  var SHARDS_CAP = 200;

  // Player
  var HOP_DURATION_MS = 150;
  var HOP_COOLDOWN_MS = 30;             // tiny cooldown to avoid double-tap accidental queue

  // -- Inline review bank (~28 entries) --------------------------------------
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

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | levelClear | dying
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;

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
    hop:        function () { sfxTone(620, 0.060, { type: "square", volume: 0.10, endFreq: 880 }); },
    splat:      function () { sfxNoise(0.16, { volume: 0.20, cutoff: 700 }); sfxTone(180, 0.18, { type: "sawtooth", volume: 0.15, endFreq: 70 }); },
    splash:     function () { sfxNoise(0.22, { volume: 0.18, cutoff: 1200 }); sfxTone(220, 0.12, { type: "sine", volume: 0.10, endFreq: 90 }); },
    logSlosh:   function () { sfxTone(180, 0.07, { type: "sine", volume: 0.05, endFreq: 140 }); },
    goalScored: function () {
      [659, 988, 1318].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 70);
      });
    },
    levelClear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    powerup: function () {
      sfxTone(784, 0.12, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1175, 0.16, { type: "triangle", volume: 0.16 }); }, 80);
    },
    timeWarn: function () {
      sfxTone(880, 0.08, { type: "square", volume: 0.10 });
    },
    death:    function () {
      sfxNoise(0.4, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 50 });
    },
    scholarLand: function () {
      [988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.15, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("chronohopCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudLevel = $("hudLevel");
    dom.hudTime = $("hudTime");
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
    dom.tcLeft = $("tcLeft");
    dom.tcDown = $("tcDown");
    dom.tcRight = $("tcRight");
  }

  // -- Coordinate helpers ----------------------------------------------------
  function cellCenter(row, col) {
    return {
      x: col * CELL + CELL / 2,
      y: FIELD_TOP + row * CELL + CELL / 2
    };
  }
  function rowY(row) { return FIELD_TOP + row * CELL; }
  function colX(col) { return col * CELL; }

  // -- Lane / piece factories ------------------------------------------------
  function speedFor(laneDef, level) {
    var mult = 1.0 + (level - 1) * 0.10;
    return BASE_LANE_SPEEDS[laneDef.speedKey] * mult;
  }

  function piecesPerLane(laneDef, level) {
    // each successive level: ~1 fewer piece per river lane (harder gaps), capped
    if (laneDef.kind === "river") {
      var base = 4;
      var n = Math.max(2, base - Math.floor((level - 1) / 2));
      return n;
    } else {
      return 4 + Math.min(2, Math.floor(level / 3));
    }
  }

  function buildLanes(level) {
    var lanes = [];
    for (var i = 0; i < LANE_DEFS.length; i++) {
      var def = LANE_DEFS[i];
      var speed = speedFor(def, level);
      var n = piecesPerLane(def, level);
      var pieces = [];
      var totalSpan = COLS + 4; // wraparound buffer
      var spacing = totalSpan / n;
      for (var p = 0; p < n; p++) {
        var len = def.pieceLen[p % def.pieceLen.length];
        // jitter within slot
        var jitter = (Math.random() - 0.5) * 0.6;
        var startCell = (p * spacing + jitter) - 2;
        pieces.push({
          x: startCell,         // left edge in cell units
          len: len,             // length in cells
          color: def.color,
          variant: p % 3        // visual variant
        });
      }
      lanes.push({
        row: def.row,
        kind: def.kind,
        dir: def.dir,
        speed: speed,
        pieces: pieces,
        spacing: spacing
      });
    }
    return lanes;
  }

  function laneAtRow(r) {
    if (!state || !state.lanes) return null;
    for (var i = 0; i < state.lanes.length; i++) {
      if (state.lanes[i].row === r) return state.lanes[i];
    }
    return null;
  }

  // -- Player ----------------------------------------------------------------
  function makePlayer(level) {
    return {
      row: ROW_BOTTOM_SAFE,
      col: 8,
      x: cellCenter(ROW_BOTTOM_SAFE, 8).x,
      y: cellCenter(ROW_BOTTOM_SAFE, 8).y,
      facing: "up",       // up | down | left | right
      hopT: 0,            // 0 = idle, 0..1 = tween
      hopFromX: 0, hopFromY: 0,
      hopToX: 0, hopToY: 0,
      hopDuration: HOP_DURATION_MS / 1000,
      lastHopTs: 0,
      onLog: null,        // { lane, piece } | null
      logOffset: 0,       // sub-cell offset on log
      dying: false,
      dyingT: 0,
      dyingMode: "splat", // splat | splash | washout
      shieldT: 0,         // shield time remaining
      speedT: 0,          // speed boost remaining
      slowT: 0,           // slow time remaining
      multT: 0,           // score multiplier
      multValue: 1
    };
  }

  // -- Goals -----------------------------------------------------------------
  function buildGoals(level) {
    var goals = [];
    for (var i = 0; i < GOAL_COLS.length; i++) {
      goals.push({ col: GOAL_COLS[i], filled: false, scholar: false });
    }
    // pick one as scholar
    var pick = Math.floor(Math.random() * GOAL_COLS.length);
    goals[pick].scholar = true;
    return goals;
  }

  // -- Powerups --------------------------------------------------------------
  var POWERUP_TYPES = ["speed", "shield", "slow", "time", "mult"];
  var POWERUP_META = {
    speed:  { glyph: "⚡", color: "#fef080", glow: "#f5c451", label: "SPEED" },
    shield: { glyph: "🛡", color: "#a8e8ff", glow: "#5de0f0", label: "SHIELD" },
    slow:   { glyph: "❄",  color: "#a8e8ff", glow: "#5de0f0", label: "SLOW" },
    time:   { glyph: "⏱", color: "#fef080", glow: "#f5c451", label: "+TIME" },
    mult:   { glyph: "⭐", color: "#fff8c4", glow: "#f0a800", label: "x3" }
  };

  function spawnPowerup(opts) {
    opts = opts || {};
    // Pick a safe row, random col
    var safeRows = [ROW_TOP_SAFE, ROW_MEDIAN, ROW_BOTTOM_SAFE];
    var row = opts.row != null ? opts.row : safeRows[Math.floor(Math.random() * safeRows.length)];
    var col = opts.col != null ? opts.col : 1 + Math.floor(Math.random() * (COLS - 2));
    var type = opts.type || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.powerups.push({
      type: type,
      row: row,
      col: col,
      life: POWERUP_LIFETIME,
      bob: Math.random() * Math.PI * 2
    });
  }

  function maybeDropPowerup() {
    if (Math.random() < POWERUP_DROP_RATE) spawnPowerup();
  }

  function applyPowerup(p) {
    sfx.powerup();
    var meta = POWERUP_META[p.type];
    pushPopup(meta.label, cellCenter(p.row, p.col).x, cellCenter(p.row, p.col).y - 24, "is-bonus");
    if (p.type === "speed") {
      state.player.speedT = 12.0;
      state.player.hopDuration = (HOP_DURATION_MS / 1000) * 0.6;
    } else if (p.type === "shield") {
      state.player.shieldT = Math.max(state.player.shieldT, 999); // until consumed
      state.shieldActive = true;
      state.usedShieldThisLevel = true;
    } else if (p.type === "slow") {
      state.player.slowT = 10.0;
    } else if (p.type === "time") {
      state.timeLeft = Math.min(99, state.timeLeft + 15);
      pushPopup("+15s", state.player.x, state.player.y - 30, "is-bonus");
    } else if (p.type === "mult") {
      state.player.multT = 15.0;
      state.player.multValue = 3;
    }
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var level = opts.level || 1;
    state = {
      level: level,
      maxLevel: opts.maxLevel || level,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      timeLeft: TIMER_INIT,
      goals: buildGoals(level),
      lanes: buildLanes(level),
      player: makePlayer(level),
      powerups: [],
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      shieldActive: false,
      usedShieldThisLevel: false,
      // stats
      goalsTotal: opts.goalsTotal || 0,
      maxRowReached: ROW_BOTTOM_SAFE,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      best: opts.best || readBest(),
      time: 0,
      consecutiveQuickGoals: 0,
      lastGoalTs: 0,
      timerWarnLast: -1,
      // riverwash flag (death by drift)
      endReason: ""
    };
    // Seed: spawn one early powerup ~50% chance to introduce mechanics
    if (Math.random() < 0.5) spawnPowerup({ row: ROW_BOTTOM_SAFE, col: 4 + Math.floor(Math.random() * 8) });
  }

  // -- Hop logic -------------------------------------------------------------
  function tryHop(dir) {
    if (phase !== "playing") return;
    if (state.player.dying) return;
    if (state.player.hopT > 0) return; // mid-hop
    var now = performance.now();
    if (now - state.player.lastHopTs < HOP_COOLDOWN_MS) return;
    var p = state.player;
    var nr = p.row, nc = p.col;
    if (dir === "up") nr--;
    else if (dir === "down") nr++;
    else if (dir === "left") nc--;
    else if (dir === "right") nc++;
    p.facing = dir;
    if (nr < 0 || nc < 0 || nc >= COLS) return; // off-edge horizontally or above goal row
    if (nr > ROW_BOTTOM_SAFE) return;            // can't go past bottom safe row
    // commit hop
    p.lastHopTs = now;
    var fromCenter = { x: p.x, y: p.y };
    var toCenter = cellCenter(nr, nc);
    p.hopFromX = fromCenter.x;
    p.hopFromY = fromCenter.y;
    p.hopToX = toCenter.x;
    p.hopToY = toCenter.y;
    p.hopT = 0.0001;
    p.row = nr;
    p.col = nc;
    p.onLog = null;
    sfx.hop();
    // hop puff at takeoff
    burstAt(fromCenter.x, fromCenter.y, "#cfdce8", 6);
    // forward score for upward hops
    if (dir === "up" && nr < state.maxRowReached) {
      state.maxRowReached = nr;
      state.score += SCORE_HOP_FORWARD * Math.max(1, state.player.multValue);
    }
    // reduced motion: snap
    if (reducedMotion) {
      p.hopT = 1;
      p.x = toCenter.x;
      p.y = toCenter.y;
      onLandedCell();
    }
  }

  // Update hop tween and on-landing behavior
  function updateHop(dt) {
    var p = state.player;
    if (p.hopT <= 0) {
      // Idle: ride logs if applicable
      var lane = laneAtRow(p.row);
      if (lane && lane.kind === "river") {
        // is there a log under us?
        var pieceUnder = pieceContainingCol(lane, p.col);
        if (pieceUnder) {
          // ride: drift player x with lane speed
          p.onLog = { lane: lane, piece: pieceUnder };
          var speed = effectiveSpeed(lane);
          p.x += lane.dir * speed * CELL * dt;
          // Keep col index aligned for collision lookup
          p.col = Math.round((p.x - CELL / 2) / CELL);
          // log ride sloshes occasionally
          if (Math.floor(state.time * 4) % 4 === 0) sfx.logSlosh();
        } else {
          p.onLog = null;
        }
      } else {
        p.onLog = null;
      }
      return;
    }
    // mid-hop tween
    var dur = p.hopDuration;
    p.hopT += dt / dur;
    if (p.hopT >= 1) {
      p.hopT = 0;
      p.x = p.hopToX;
      p.y = p.hopToY;
      onLandedCell();
    } else {
      // ease-out
      var t = p.hopT;
      var eased = 1 - Math.pow(1 - t, 3);
      p.x = p.hopFromX + (p.hopToX - p.hopFromX) * eased;
      p.y = p.hopFromY + (p.hopToY - p.hopFromY) * eased;
    }
  }

  function pieceContainingCol(lane, col) {
    for (var i = 0; i < lane.pieces.length; i++) {
      var pi = lane.pieces[i];
      // wraparound: render at x..x+len, also x+(COLS+4)
      var leftCells = [pi.x, pi.x + (COLS + 4), pi.x - (COLS + 4)];
      for (var j = 0; j < leftCells.length; j++) {
        var L = leftCells[j];
        if (col >= Math.floor(L) && col < Math.floor(L) + pi.len) return pi;
      }
    }
    return null;
  }

  function effectiveSpeed(lane) {
    var s = lane.speed;
    if (state.player.slowT > 0) s *= 0.5;
    return s;
  }

  function onLandedCell() {
    var p = state.player;
    var r = p.row, c = p.col;
    if (r === ROW_GOAL) {
      // attempt goal slot
      var slot = null;
      for (var i = 0; i < state.goals.length; i++) {
        if (state.goals[i].col === c) { slot = state.goals[i]; break; }
      }
      if (!slot) {
        // landed on top row but not on a lily pad (water at top edge) → death
        die("splash");
        return;
      }
      if (slot.filled) {
        die("splat");
        return;
      }
      // valid goal!
      handleGoalScored(slot);
      return;
    }
    // Otherwise check collision/water for the new cell
    checkCellHazard();
  }

  function handleGoalScored(slot) {
    slot.filled = true;
    state.goalsTotal++;
    var isScholar = slot.scholar;
    // Score: GOAL + level-time bonus
    var timeBonus = Math.floor(state.timeLeft) * SCORE_TIME_BONUS_PER_SEC;
    var mult = state.player.multValue;
    var earned = (SCORE_GOAL + timeBonus) * mult;
    state.score += earned;
    pushPopup("+" + formatNumber(earned), cellCenter(ROW_GOAL, slot.col).x, cellCenter(ROW_GOAL, slot.col).y - 30, "is-score");
    // mult consumed if active (multiplier triples NEXT goal)
    if (state.player.multT > 0 && mult > 1) {
      state.player.multT = 0;
      state.player.multValue = 1;
    }
    // Reset per-life timer on goal
    state.timeLeft = TIMER_INIT;
    state.timerWarnLast = -1;
    // Quick consecutive goals → BONUS!
    var now = performance.now();
    if (state.lastGoalTs && (now - state.lastGoalTs) < 7000) {
      state.consecutiveQuickGoals++;
      if (state.consecutiveQuickGoals === 2) {
        pushPopup("BONUS!", LOGICAL_W / 2, LOGICAL_H / 2, "is-bonus");
        state.score += 250;
      } else if (state.consecutiveQuickGoals >= 3) {
        pushPopup("ARCHIVE LEGEND!", LOGICAL_W / 2, LOGICAL_H / 2, "is-legend");
        state.score += 1000;
        state.consecutiveQuickGoals = 0;
      }
    } else {
      state.consecutiveQuickGoals = 1;
    }
    state.lastGoalTs = now;

    if (isScholar) {
      sfx.scholarLand();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 24, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      openScholarQuestion();
      return;
    } else {
      sfx.goalScored();
      burstAt(cellCenter(ROW_GOAL, slot.col).x, cellCenter(ROW_GOAL, slot.col).y, "#6dc18f", 18);
    }
    // Level cleared?
    if (allGoalsFilled()) {
      onLevelClear();
      return;
    }
    // 3% chance per goal scored → drop a powerup near respawn
    maybeDropPowerup();
    respawnPlayer();
  }

  function allGoalsFilled() {
    for (var i = 0; i < state.goals.length; i++) if (!state.goals[i].filled) return false;
    return true;
  }

  function onLevelClear() {
    try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("chronohop", "chronohop-pads"); } catch (e) {}
    if (!state.usedShieldThisLevel) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("chronohop", "chronohop-no-shield"); } catch (e) {}
    }
    sfx.levelClear();
    addShake(6, 0.5);
    pushPopup("5/5 GOALS!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    state.score += SCORE_LEVEL_BONUS * state.level;
    pushPopup("+" + (SCORE_LEVEL_BONUS * state.level) + " level bonus", LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#6dc18f", "#5de0f0", "#a991ff"] });
      }
    } catch (e) {}
    phase = "levelClear";
    saveSnapshot();
    setTimeout(function () {
      // advance level (capped on difficulty curve)
      var nextLevel = state.level + 1;
      var difficulty = Math.min(MAX_LEVEL, nextLevel);
      var carry = {
        level: nextLevel,
        maxLevel: Math.max(state.maxLevel, nextLevel),
        score: state.score,
        lives: state.lives,
        goalsTotal: state.goalsTotal,
        shardsAwarded: state.shardsAwarded,
        best: state.best
      };
      // Use difficulty for lane build
      initStateAtDifficulty(difficulty, carry);
      phase = "playing";
    }, 1400);
  }

  function initStateAtDifficulty(difficulty, carry) {
    var prevQCorrect = state.questionsAnsweredCorrect;
    var prevQTotal = state.questionsAnsweredTotal;
    initState(carry);
    state.level = carry.level;
    // rebuild lanes at difficulty (may differ from level if we capped)
    state.lanes = buildLanes(difficulty);
    state.maxLevel = carry.maxLevel;
    state.questionsAnsweredCorrect = prevQCorrect;
    state.questionsAnsweredTotal = prevQTotal;
  }

  function respawnPlayer() {
    // Reset player to bottom safe row, center column
    var p = state.player;
    var prev = { speedT: p.speedT, slowT: p.slowT, multT: p.multT, multValue: p.multValue, hopDuration: p.hopDuration, shieldT: p.shieldT };
    state.player = makePlayer(state.level);
    state.player.speedT = prev.speedT;
    state.player.slowT = prev.slowT;
    state.player.multT = prev.multT;
    state.player.multValue = prev.multValue;
    state.player.hopDuration = prev.hopDuration;
    state.player.shieldT = prev.shieldT;
    state.maxRowReached = ROW_BOTTOM_SAFE;
    // Reset per-life timer on respawn
    state.timeLeft = TIMER_INIT;
    state.timerWarnLast = -1;
  }

  // -- Hazard checks ---------------------------------------------------------
  function checkCellHazard() {
    var p = state.player;
    var lane = laneAtRow(p.row);
    if (!lane) return;
    if (lane.kind === "road") {
      // car collision: any car spans player col?
      var car = pieceContainingCol(lane, p.col);
      if (car) {
        // shield absorbs
        if (state.player.shieldT > 0 && state.shieldActive) {
          state.player.shieldT = 0;
          state.shieldActive = false;
          pushPopup("SHIELD", state.player.x, state.player.y - 30, "is-bonus");
          burstAt(state.player.x, state.player.y, "#5de0f0", 22);
          // bump backwards a row to safety
          state.player.row = Math.min(ROW_BOTTOM_SAFE, p.row + 1);
          state.player.x = cellCenter(state.player.row, p.col).x;
          state.player.y = cellCenter(state.player.row, p.col).y;
          return;
        }
        die("splat");
      }
    } else if (lane.kind === "river") {
      // need a log under us
      var log = pieceContainingCol(lane, p.col);
      if (!log) {
        die("splash");
      } else {
        p.onLog = { lane: lane, piece: log };
      }
    }
  }

  function die(mode) {
    var p = state.player;
    if (p.dying) return;
    p.dying = true;
    p.dyingT = 0;
    p.dyingMode = mode || "splat";
    addShake(8, 0.4);
    if (mode === "splash") sfx.splash();
    else if (mode === "washout") sfx.splash();
    else sfx.splat();
    state.lives--;
    if (state.lives <= 0) {
      // pre-game-over
      phase = "dying";
      setTimeout(function () { gameOver(); }, 700);
    } else {
      phase = "dying";
      setTimeout(function () {
        respawnPlayer();
        phase = "playing";
      }, 600);
    }
  }

  // -- Powerup pickup --------------------------------------------------------
  function checkPowerupPickup() {
    var p = state.player;
    if (p.dying) return;
    if (p.hopT > 0) return; // only when settled
    for (var i = state.powerups.length - 1; i >= 0; i--) {
      var pu = state.powerups[i];
      if (pu.row === p.row && pu.col === p.col) {
        applyPowerup(pu);
        state.powerups.splice(i, 1);
      }
    }
  }

  // -- Update lanes ----------------------------------------------------------
  function updateLanes(dt) {
    for (var i = 0; i < state.lanes.length; i++) {
      var lane = state.lanes[i];
      var s = effectiveSpeed(lane);
      for (var j = 0; j < lane.pieces.length; j++) {
        var pi = lane.pieces[j];
        pi.x += lane.dir * s * dt;
        // wraparound: keep x in [-len-2, COLS+2]
        var span = COLS + 4;
        if (lane.dir > 0 && pi.x > COLS + 2) pi.x -= span;
        else if (lane.dir < 0 && pi.x < -pi.len - 2) pi.x += span;
      }
    }
  }

  // -- Particles + popups ----------------------------------------------------
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    count = count || 10;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 120;
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

  // -- Update powerups list (lifetime + bob) --------------------------------
  function updatePowerups(dt) {
    for (var i = state.powerups.length - 1; i >= 0; i--) {
      var p = state.powerups[i];
      p.life -= dt;
      p.bob += dt * 4;
      if (p.life <= 0) state.powerups.splice(i, 1);
    }
    // Powerup timers on player
    var pl = state.player;
    if (pl.speedT > 0) {
      pl.speedT -= dt;
      if (pl.speedT <= 0) { pl.speedT = 0; pl.hopDuration = HOP_DURATION_MS / 1000; }
    }
    if (pl.slowT > 0) { pl.slowT -= dt; if (pl.slowT < 0) pl.slowT = 0; }
    if (pl.multT > 0) { pl.multT -= dt; if (pl.multT <= 0) { pl.multT = 0; pl.multValue = 1; } }
  }

  // -- Timer -----------------------------------------------------------------
  function updateTimer(dt) {
    if (phase !== "playing") return;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      die("splat");
      return;
    }
    var sec = Math.ceil(state.timeLeft);
    if (sec <= 10 && sec !== state.timerWarnLast) {
      state.timerWarnLast = sec;
      if (sec <= 5) sfx.timeWarn();
      else if (sec === 10) sfx.timeWarn();
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
    // shake
    ctx.translate(state.shake.x, state.shake.y);

    drawField();
    drawLanes();
    drawGoals();
    drawPowerups();
    drawPlayer();
    drawParticles();
    drawDeathLineEffects();
    drawGrid();

    ctx.restore();
  }

  function drawField() {
    // sky/letterbox background
    ctx.fillStyle = "#04060f";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);

    // Top water-edge band + goal row backdrop (water row 0 + safe row 1)
    drawWaterBand(rowY(ROW_GOAL), CELL * 2);

    // Top safe row 1
    drawSafeBand(rowY(ROW_TOP_SAFE), CELL);

    // River band rows 2..5
    drawRiverBand(rowY(ROW_RIVER_1), CELL * 4);

    // Median safe
    drawSafeBand(rowY(ROW_MEDIAN), CELL);

    // Road band rows 7..10
    drawRoadBand(rowY(ROW_ROAD_1), CELL * 4);

    // Bottom safe
    drawSafeBand(rowY(ROW_BOTTOM_SAFE), CELL);

    // Reserve row (below)
    ctx.fillStyle = "#0a1424";
    ctx.fillRect(0, rowY(ROW_RESERVE), LOGICAL_W, CELL + 32);
  }

  function drawSafeBand(y, h) {
    // grass green base + faint dot texture
    var grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "#1d3a26");
    grad.addColorStop(0.5, "#1a3422");
    grad.addColorStop(1, "#163020");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, LOGICAL_W, h);
    // dot pattern
    ctx.fillStyle = "rgba(109,193,143,0.10)";
    var step = 16;
    for (var dy = y + 6; dy < y + h - 4; dy += step) {
      for (var dx = 6 + ((dy / step) % 2 === 0 ? 0 : 8); dx < LOGICAL_W; dx += step) {
        ctx.fillRect(dx, dy, 2, 2);
      }
    }
    // top + bottom edge
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, y, LOGICAL_W, 1);
    ctx.fillStyle = "rgba(0,0,0,0.20)";
    ctx.fillRect(0, y + h - 1, LOGICAL_W, 1);
  }

  function drawWaterBand(y, h) {
    // animated rippling cyan-teal
    var t = state.time;
    var grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "#0c2638");
    grad.addColorStop(0.5, "#0f3148");
    grad.addColorStop(1, "#08233a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, LOGICAL_W, h);
    // ripples
    if (!reducedMotion) {
      ctx.strokeStyle = "rgba(93,224,240,0.18)";
      ctx.lineWidth = 1;
      for (var i = 0; i < 5; i++) {
        var ry = y + (i + 1) * (h / 6) + Math.sin(t * 1.8 + i * 1.5) * 2;
        ctx.beginPath();
        for (var x = 0; x <= LOGICAL_W; x += 6) {
          var oy = Math.sin((x * 0.04) + t * 1.5 + i * 0.8) * 1.3;
          if (x === 0) ctx.moveTo(x, ry + oy);
          else ctx.lineTo(x, ry + oy);
        }
        ctx.stroke();
      }
      // faint horizontal highlight strokes
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      for (var k = 0; k < 8; k++) {
        var hx = (state.time * 30 + k * 110) % (LOGICAL_W + 80) - 40;
        var hy = y + 8 + (k % 4) * (h / 4);
        ctx.fillRect(hx, hy, 30, 1);
      }
    }
  }

  function drawRiverBand(y, h) {
    // base water + gentle gradient
    var grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "#0a2a40");
    grad.addColorStop(0.5, "#0d3552");
    grad.addColorStop(1, "#0a2a40");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, LOGICAL_W, h);
    if (!reducedMotion) {
      // moving foam streaks per lane
      for (var li = 0; li < state.lanes.length; li++) {
        var lane = state.lanes[li];
        if (lane.kind !== "river") continue;
        var ly = rowY(lane.row) + CELL / 2;
        ctx.strokeStyle = "rgba(168,232,255,0.10)";
        ctx.lineWidth = 1;
        for (var s = 0; s < 7; s++) {
          var fx = (state.time * lane.dir * lane.speed * 30 + s * 130) % (LOGICAL_W + 200) - 100;
          ctx.beginPath();
          ctx.moveTo(fx, ly + Math.sin(s * 1.7 + state.time * 2) * 6);
          ctx.lineTo(fx + 30, ly + Math.sin((s + 1) * 1.7 + state.time * 2) * 6);
          ctx.stroke();
        }
      }
    }
  }

  function drawRoadBand(y, h) {
    // matte dark asphalt
    var grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "#1a1c22");
    grad.addColorStop(0.5, "#22242c");
    grad.addColorStop(1, "#1a1c22");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, LOGICAL_W, h);
    // dashed white lane lines between road lanes (rows 7|8|9|10 → 3 dividers)
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    for (var i = 1; i < 4; i++) {
      var ly = rowY(ROW_ROAD_1) + i * CELL;
      ctx.setLineDash([18, 14]);
      ctx.lineDashOffset = -((state.time * 60) % 32);
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(LOGICAL_W, ly);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    // top/bottom curb shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, y, LOGICAL_W, 2);
    ctx.fillRect(0, y + h - 2, LOGICAL_W, 2);
  }

  // Soft cyan grid overlay
  function drawGrid() {
    ctx.strokeStyle = "rgba(93,224,240,0.05)";
    ctx.lineWidth = 1;
    for (var c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, FIELD_TOP);
      ctx.lineTo(c * CELL, FIELD_TOP + ROWS * CELL);
      ctx.stroke();
    }
    for (var r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, FIELD_TOP + r * CELL);
      ctx.lineTo(LOGICAL_W, FIELD_TOP + r * CELL);
      ctx.stroke();
    }
  }

  // Lanes: cars + logs
  function drawLanes() {
    for (var i = 0; i < state.lanes.length; i++) {
      var lane = state.lanes[i];
      for (var j = 0; j < lane.pieces.length; j++) {
        drawPiece(lane, lane.pieces[j]);
      }
    }
  }

  function drawPiece(lane, p) {
    // Piece x is in cell units, can be off-screen due to wraparound; render every wrap
    var span = COLS + 4;
    var positions = [p.x, p.x + span, p.x - span];
    for (var k = 0; k < positions.length; k++) {
      var leftCells = positions[k];
      var px = leftCells * CELL;
      if (px + p.len * CELL < -CELL || px > LOGICAL_W + CELL) continue;
      if (lane.kind === "river") drawLog(lane, p, px);
      else drawCar(lane, p, px);
    }
  }

  function drawLog(lane, p, px) {
    var py = rowY(lane.row);
    var w = p.len * CELL;
    // body
    var grad = ctx.createLinearGradient(0, py, 0, py + CELL);
    grad.addColorStop(0, lighten(p.color, 12));
    grad.addColorStop(0.5, p.color);
    grad.addColorStop(1, darken(p.color, 18));
    roundedRect(px + 2, py + 4, w - 4, CELL - 8, 8);
    ctx.fillStyle = grad;
    ctx.fill();
    // edge highlight
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    roundedRect(px + 2, py + 4, w - 4, CELL - 8, 8);
    ctx.stroke();
    // grain strokes
    ctx.strokeStyle = "rgba(0,0,0,0.20)";
    ctx.lineWidth = 1;
    for (var s = 1; s < p.len; s++) {
      var sx = px + s * CELL;
      ctx.beginPath();
      ctx.moveTo(sx, py + 8);
      ctx.lineTo(sx, py + CELL - 8);
      ctx.stroke();
    }
    // highlight stripe
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(px + 6, py + 8, w - 12, 2);
    // end caps - rings
    ctx.fillStyle = darken(p.color, 26);
    ctx.beginPath(); ctx.arc(px + 6, py + CELL / 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + w - 6, py + CELL / 2, 4, 0, Math.PI * 2); ctx.fill();
  }

  function drawCar(lane, p, px) {
    var py = rowY(lane.row);
    var w = p.len * CELL;
    // body gradient
    var grad = ctx.createLinearGradient(0, py + 4, 0, py + CELL - 4);
    grad.addColorStop(0, lighten(p.color, 18));
    grad.addColorStop(0.5, p.color);
    grad.addColorStop(1, darken(p.color, 24));
    var bx = px + 4, by = py + 6, bw = w - 8, bh = CELL - 12;
    roundedRect(bx, by, bw, bh, 8);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1.2;
    roundedRect(bx, by, bw, bh, 8);
    ctx.stroke();
    // window strip (slightly inset)
    var winColor = "rgba(20,30,50,0.7)";
    ctx.fillStyle = winColor;
    if (p.len === 1) {
      // sedan: small window
      roundedRect(bx + 4, by + 4, bw - 8, bh / 2 - 4, 4);
      ctx.fill();
    } else if (p.len === 2) {
      // truck
      roundedRect(bx + 6, by + 5, bw / 2 - 8, bh - 10, 4);
      ctx.fill();
      // cargo lines
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2 + 2, by + bh / 2);
      ctx.lineTo(bx + bw - 4, by + bh / 2);
      ctx.stroke();
    } else {
      // bus
      var nWin = p.len + 1;
      var winW = (bw - 8) / nWin;
      for (var w2 = 0; w2 < nWin; w2++) {
        ctx.fillStyle = winColor;
        roundedRect(bx + 4 + w2 * winW + 2, by + 4, winW - 4, bh / 2 - 2, 3);
        ctx.fill();
      }
    }
    // headlight glow at front
    var frontX = lane.dir > 0 ? bx + bw - 2 : bx + 2;
    ctx.fillStyle = "rgba(255,240,180,0.8)";
    ctx.beginPath();
    ctx.arc(frontX, by + bh / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (!reducedMotion) {
      var glow = ctx.createRadialGradient(frontX, by + bh / 2, 0, frontX, by + bh / 2, 18);
      glow.addColorStop(0, "rgba(255,240,180,0.30)");
      glow.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(frontX - 18, by - 4, 36, bh + 8);
    }
    // rear taillight
    var rearX = lane.dir > 0 ? bx + 2 : bx + bw - 2;
    ctx.fillStyle = "rgba(255,80,40,0.8)";
    ctx.beginPath();
    ctx.arc(rearX, by + bh / 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // wheels (suggested)
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    var wy = by + bh - 1;
    var wn = Math.max(2, p.len + 1);
    for (var iw = 0; iw < wn; iw++) {
      var wx = bx + 6 + iw * ((bw - 12) / Math.max(1, wn - 1));
      ctx.fillRect(wx - 2, wy - 1, 4, 3);
    }
  }

  function drawGoals() {
    for (var i = 0; i < state.goals.length; i++) {
      var g = state.goals[i];
      var center = cellCenter(ROW_GOAL, g.col);
      drawLilyPad(center.x, center.y, g);
    }
    // Top-band water "wrong area" subtle hint between pads
    // (handled by water band already)
  }

  function drawLilyPad(cx, cy, goal) {
    var rOuter = CELL * 0.42;
    var rInner = CELL * 0.32;
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, rOuter, rOuter * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    // pad
    var padGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, rOuter);
    padGrad.addColorStop(0, "#9dd4a8");
    padGrad.addColorStop(0.65, "#5fa872");
    padGrad.addColorStop(1, "#2d6840");
    ctx.fillStyle = padGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.fill();
    // inner ring
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.stroke();
    // notch (lily pad indent)
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - rOuter);
    ctx.lineTo(cx + 2, cy - rOuter);
    ctx.lineTo(cx, cy - 4);
    ctx.closePath();
    ctx.fill();

    if (goal.scholar && !goal.filled) {
      // Gold rim
      ctx.save();
      ctx.strokeStyle = "#f5c451";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#f5c451";
      ctx.shadowBlur = reducedMotion ? 0 : 14;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // rotating rainbow question mark
      var rotation = reducedMotion ? 0 : (state.time * 1.6);
      drawScholarQ(cx, cy, rotation);
    }

    if (goal.filled) {
      // mini-player icon resting
      drawMiniPlayer(cx, cy);
    }
  }

  function drawScholarQ(cx, cy, rotation) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    // rainbow stroke
    var colors = ["#f5c451", "#5de0f0", "#a991ff", "#f07bb8"];
    for (var i = 0; i < colors.length; i++) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, -3, 6, Math.PI * 0.85 + i * 0.4, Math.PI * 2.0 + i * 0.4);
      ctx.stroke();
    }
    ctx.fillStyle = "#f0f5ff";
    ctx.font = "bold 16px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 0);
    ctx.restore();
  }

  function drawMiniPlayer(cx, cy) {
    // small frog icon resting on the pad
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#6dc18f";
    ctx.beginPath();
    ctx.arc(0, 0, CELL * 0.20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-3, -3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0a1424";
    ctx.beginPath(); ctx.arc(-3, -3, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -3, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPowerups() {
    for (var i = 0; i < state.powerups.length; i++) {
      var p = state.powerups[i];
      var c = cellCenter(p.row, p.col);
      var bob = reducedMotion ? 0 : Math.sin(p.bob) * 3;
      var meta = POWERUP_META[p.type];
      // halo
      if (!reducedMotion) {
        var rad = CELL * 0.42;
        var glow = ctx.createRadialGradient(c.x, c.y + bob, 0, c.x, c.y + bob, rad);
        glow.addColorStop(0, hexA(meta.glow, 0.5));
        glow.addColorStop(1, hexA(meta.glow, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(c.x, c.y + bob, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // Disc
      ctx.fillStyle = "rgba(4,8,18,0.85)";
      ctx.beginPath();
      ctx.arc(c.x, c.y + bob, CELL * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = meta.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y + bob, CELL * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      // glyph
      ctx.fillStyle = meta.color;
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, c.x, c.y + bob + 1);

      // fade out at end of life
      if (p.life < 2) {
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    var p = state.player;
    if (p.dying) {
      drawDyingPlayer(p);
      return;
    }
    var hopY = p.hopT > 0 && !reducedMotion
      ? -Math.sin(p.hopT * Math.PI) * 18
      : 0;
    drawFrog(p.x, p.y + hopY, p.facing, p.shieldActive || (p.shieldT > 0 && state.shieldActive));
    // Active mult halo
    if (p.multT > 0 && !reducedMotion) {
      var radM = CELL * 0.6;
      var glowM = ctx.createRadialGradient(p.x, p.y + hopY, 4, p.x, p.y + hopY, radM);
      glowM.addColorStop(0, "rgba(255,200,80,0.25)");
      glowM.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = glowM;
      ctx.beginPath();
      ctx.arc(p.x, p.y + hopY, radM, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.slowT > 0 && !reducedMotion) {
      ctx.strokeStyle = "rgba(168,232,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y + hopY, CELL * 0.46, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawFrog(cx, cy, facing, shielded) {
    var size = CELL * 0.34;
    ctx.save();
    ctx.translate(cx, cy);
    var rot = 0;
    if (facing === "left") rot = -Math.PI / 2;
    else if (facing === "right") rot = Math.PI / 2;
    else if (facing === "down") rot = Math.PI;
    else rot = 0;
    ctx.rotate(rot);
    // body shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.7, size * 0.95, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    var grad = ctx.createRadialGradient(-size * 0.3, -size * 0.3, 2, 0, 0, size);
    grad.addColorStop(0, "#9be4a8");
    grad.addColorStop(0.6, "#5fa872");
    grad.addColorStop(1, "#2d6840");
    ctx.fillStyle = grad;
    // squat oval body
    ctx.beginPath();
    ctx.ellipse(0, 4, size * 0.95, size * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    // legs (back)
    ctx.fillStyle = "#3d7a52";
    ctx.beginPath();
    ctx.ellipse(-size * 0.85, size * 0.55, size * 0.32, size * 0.18, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.85, size * 0.55, size * 0.32, size * 0.18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // front feet
    ctx.fillStyle = "#3d7a52";
    ctx.beginPath();
    ctx.ellipse(-size * 0.55, -size * 0.65, size * 0.18, size * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.55, -size * 0.65, size * 0.18, size * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    // eyes (always toward facing - already rotated)
    var eyeY = -size * 0.45;
    var eyeOff = size * 0.35;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(-eyeOff, eyeY, size * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOff, eyeY, size * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0a1424";
    ctx.beginPath(); ctx.arc(-eyeOff, eyeY + 1, size * 0.10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOff, eyeY + 1, size * 0.10, 0, Math.PI * 2); ctx.fill();
    // small mouth hint
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -size * 0.05, size * 0.32, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // back spots
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath(); ctx.arc(-size * 0.30, size * 0.10, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(size * 0.40, size * 0.20, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // shield ring (outside rotation)
    if (shielded) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "#5de0f0";
      ctx.lineWidth = 2;
      if (!reducedMotion) {
        ctx.shadowColor = "#5de0f0";
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDyingPlayer(p) {
    var t = p.dyingT;
    if (p.dyingMode === "splash") {
      // sinking + splash rings
      var r = 10 + t * 50;
      ctx.strokeStyle = "rgba(168,232,255," + (1 - t * 1.2) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.7, 0, Math.PI * 2); ctx.stroke();
      // body fading
      ctx.globalAlpha = Math.max(0, 1 - t * 1.5);
      drawFrog(p.x, p.y + t * 8, p.facing, false);
      ctx.globalAlpha = 1;
    } else {
      // splat: flatten + descending
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1 + t * 1.4, Math.max(0.1, 1 - t * 1.3));
      ctx.fillStyle = "#3d7a52";
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.ellipse(0, 4, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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

  function drawDeathLineEffects() {
    // nothing extra for now (could add pulse on timer warning)
    if (state.timeLeft <= 5 && phase === "playing") {
      ctx.fillStyle = "rgba(240,72,96," + (0.07 + 0.10 * Math.abs(Math.sin(state.time * 8))) + ")";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
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
  function lighten(hex, amt) { return shade(hex, amt); }
  function darken(hex, amt) { return shade(hex, -amt); }
  function shade(hex, amt) {
    if (!hex) return hex;
    var h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // -- HUD update ------------------------------------------------------------
  function updateHud() {
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudLevel) dom.hudLevel.textContent = String(state.level);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    var sec = Math.max(0, Math.ceil(state.timeLeft));
    if (dom.hudTime) {
      dom.hudTime.textContent = String(sec);
      var cell = dom.hudTime.parentElement;
      if (cell) {
        cell.classList.toggle("is-warning", sec <= 15 && sec > 5);
        cell.classList.toggle("is-danger", sec <= 5);
      }
    }
    if (dom.goalName) {
      var filled = 0;
      for (var i = 0; i < state.goals.length; i++) if (state.goals[i].filled) filled++;
      dom.goalName.textContent = filled + "/5 lily pads";
    }
    if (dom.goalMeta) {
      var bits = [];
      if (state.player.speedT > 0) bits.push("Speed " + state.player.speedT.toFixed(1) + "s");
      if (state.player.slowT > 0) bits.push("Slow " + state.player.slowT.toFixed(1) + "s");
      if (state.player.multT > 0) bits.push("x" + state.player.multValue + " " + state.player.multT.toFixed(1) + "s");
      if (state.shieldActive) bits.push("Shield");
      if (bits.length === 0) bits.push("Powerups · 0 active");
      bits.push("Lvl " + state.level);
      dom.goalMeta.textContent = bits.join(" · ");
    }
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Scholar / review modal -----------------------------------------------
  var activeQuestion = null;

  function pickQuestion() {
    try {
      var bank = window.DIAG_BANK_BY_COURSE;
      if (bank && typeof bank === "object") {
        var pool = [];
        for (var c in bank) {
          if (Array.isArray(bank[c])) pool = pool.concat(bank[c]);
        }
        if (pool.length) {
          var q = pool[Math.floor(Math.random() * pool.length)];
          var norm = normalizeBankQuestion(q);
          if (norm) return norm;
        }
      }
    } catch (e) {}
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

  function openScholarQuestion() {
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Lily Pad · Optional · +" + SCORE_SCHOLAR_BONUS + " · power-up";
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
      dom.explanation.textContent = "Decoded! +" + SCORE_SCHOLAR_BONUS + " · a power-up will spawn near you.";
      dom.explanation.className = "explanation is-correct";
      state.questionsAnsweredCorrect++;
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText;
      dom.explanation.className = "explanation is-wrong";
    }
    state.questionsAnsweredTotal++;
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }

  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += SCORE_SCHOLAR_BONUS;
      addShards(20, GAME_ID + "-scholar-correct");
      sfx.correct();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCORE_SCHOLAR_BONUS + " SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
    }
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    // After scholar prompt, check if level cleared (we awarded the goal already), else respawn
    if (allGoalsFilled()) {
      onLevelClear();
    } else {
      // spawn powerup near respawn point if correct
      if (wasCorrect) {
        spawnPowerup({ row: ROW_BOTTOM_SAFE, col: 6 + Math.floor(Math.random() * 4) });
      }
      respawnPlayer();
    }
    updateHud();
  }

  function skipQuestion() {
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    if (allGoalsFilled()) {
      onLevelClear();
    } else {
      respawnPlayer();
    }
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
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Lives Exhausted" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Chronohop · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Levels Cleared</div><div class="end-cell-value">' + Math.max(0, state.level - 1) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Total Goals</div><div class="end-cell-value">' + formatNumber(state.goalsTotal) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Lives Left</div><div class="end-cell-value">' + state.lives + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    try { var el = document.getElementById("endRecap"); if (el && window.MrMacsEndRecap) { MrMacsEndRecap.render(el); MrMacsEndRecap.stopTracking(); } } catch (e) {}
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

  function clientToLogical(cx, cy) {
    var rect = canvas.getBoundingClientRect();
    var x = (cx - rect.left - offsetX) / scale;
    var y = (cy - rect.top - offsetY) / scale;
    return { x: x, y: y };
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { level: state.maxLevel, goals: state.goalsTotal });
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
          goals: state.goalsTotal,
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
          file: "games/chronohop/index.html"
        });
      }
    } catch (e) {}
  }

  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("chronohop:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("chronohop:best", String(Math.floor(v)));
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
        if (k === "ArrowUp" || k === "w" || k === "W") { tryHop("up"); e.preventDefault(); return; }
        if (k === "ArrowDown" || k === "s" || k === "S") { tryHop("down"); e.preventDefault(); return; }
        if (k === "ArrowLeft" || k === "a" || k === "A") { tryHop("left"); e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { tryHop("right"); e.preventDefault(); return; }
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
        // tap → hop up
        tryHop("up");
      } else if (ax > ay) {
        tryHop(dx > 0 ? "right" : "left");
      } else {
        tryHop(dy > 0 ? "down" : "up");
      }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });
  }

  function bindTouchControls() {
    function pressBtn(btn, dir) {
      if (!btn) return;
      var fire = function (e) { if (e) e.preventDefault(); if (phase === "playing") tryHop(dir); };
      btn.addEventListener("click", fire);
      btn.addEventListener("touchstart", fire, { passive: false });
    }
    pressBtn(dom.tcUp, "up");
    pressBtn(dom.tcDown, "down");
    pressBtn(dom.tcLeft, "left");
    pressBtn(dom.tcRight, "right");
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

    try {
      if (window.MrMacsHelpOverlay) {
        window.MrMacsHelpOverlay.register("chronohop", {
          title: "How to Play Chronohop",
          goal: "Hop your character from the start row to the five lily pads at the top, dodging cars and riding logs to fill every pad before time runs out.",
          controls: [
            { key: "Arrow Keys / WASD", action: "Hop in direction" },
            { key: "Esc / P", action: "Pause" }
          ],
          tips: [
            "Ride logs across the river — if you stand still on water you sink immediately.",
            "Each forward hop earns 10 points; filling all 5 lily pads is worth 500 — don't waste hops going backward.",
            "One lily pad per level shimmers gold; landing on it opens a scholar prompt for +1000 and a power-up."
          ],
          scholar: "Once per level a gold lily pad shimmers — hop onto it to open an optional review prompt worth +1000 score and a power-up pickup."
        });
        var setupActions = document.querySelector("#setupScreen .setup-actions");
        if (setupActions) window.MrMacsHelpOverlay.mountButton(setupActions, "chronohop");
      }
    } catch (e) {}
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("chronohop");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "chronohop", { compact: false });
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
    try { window.MrMacsEndRecap && MrMacsEndRecap.reset(); MrMacsEndRecap && MrMacsEndRecap.startTracking(); } catch (e) {}
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    initState({
      score: s.score || 0,
      level: s.level || 1,
      goalsTotal: s.goals || 0,
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
    if (snap && snap.state && (snap.state.score || snap.state.goals) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Level ' + (snap.state.level || 1) +
        ' &middot; Goals ' + (snap.state.goals || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Chronohop Scores</div>';
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
      // Snapshot every ~10s while playing
      if (phase === "playing") {
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
      }
    }
    if (phase === "playing") {
      updateLanes(dt);
      updateHop(dt);
      updateTimer(dt);
      updatePowerups(dt);
      checkPowerupPickup();
      // After log drift and idle hop update, check washout (player off-screen on river)
      if (state.player.hopT === 0 && !state.player.dying) {
        var px = state.player.x;
        if (px < 4 || px > LOGICAL_W - 4) {
          die("washout");
        } else {
          // continuous hazard for player sitting on a road lane (cars drove into them)
          var lane = laneAtRow(state.player.row);
          if (lane && lane.kind === "road") {
            var car = pieceContainingCol(lane, state.player.col);
            if (car) {
              if (state.player.shieldT > 0 && state.shieldActive) {
                state.player.shieldT = 0;
                state.shieldActive = false;
                pushPopup("SHIELD", state.player.x, state.player.y - 30, "is-bonus");
                burstAt(state.player.x, state.player.y, "#5de0f0", 22);
                state.player.row = Math.min(ROW_BOTTOM_SAFE, state.player.row + 1);
                state.player.x = cellCenter(state.player.row, state.player.col).x;
                state.player.y = cellCenter(state.player.row, state.player.col).y;
              } else {
                die("splat");
              }
            }
          } else if (lane && lane.kind === "river" && !state.player.onLog) {
            die("splash");
          }
        }
      }
    }
    if (phase === "dying" && state && state.player) {
      state.player.dyingT += dt * 1.6;
      if (state.player.dyingT > 1) state.player.dyingT = 1;
    }
    if (state) {
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "levelClear" || phase === "paused") {
      updateHud();
    }
    rafHandle = requestAnimationFrame(loop);
  }

  // -- Boot ------------------------------------------------------------------
  function boot() {
    setupDom();
    initState({}); // makes state available for resize-time render(); will be re-init on newRun
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

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "chronohop";
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
