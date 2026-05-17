/* ===========================================================================
   Tron Trails — light cycle grid · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · 60x60 grid · scholar gates
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "tron-trails";
  var GAME_TITLE = "Tron Trails";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  // Grid
  var GRID_COLS = 60;
  var GRID_ROWS = 60;
  var CELL_SIZE = 12;             // 60 * 12 = 720
  var GRID_OFFSET_X = 0;
  var GRID_OFFSET_Y = 0;

  // Movement timing
  var BASE_TICK_MS = 90;          // ms per cell at base speed
  var SPEED_BOOST_MULT = 1.5;
  var SLOW_FOES_MULT = 0.5;       // AIs become this much slower (i.e. tick interval grows)

  // Difficulty curve
  function aiTickMsForRound(round) {
    // AI base = 110ms at round 1; speeds up about 6ms/round; floor 64ms.
    return Math.max(64, 110 - (round - 1) * 6);
  }
  function playerTickMsForRound(round) {
    // Player base = BASE_TICK_MS; gradually slightly faster too (floor 70ms)
    return Math.max(70, BASE_TICK_MS - Math.max(0, (round - 2) * 2));
  }

  // Lives / scoring
  var LIVES_INIT = 3;
  var BONUS_LIFE_PER_ROUND = 1;
  var SHARDS_CAP = 200;
  var BONUS_LIFE_THRESHOLD = 12000;

  // Power-up rules
  var INVENTORY_CAP = 3;
  var POWERUP_DURATIONS = {
    speed:   4.0,                 // seconds
    shield:  9999,                // until consumed
    slow:    5.0,                 // slow foes 5s
    reverse: 3.0                  // 3s allows U-turn
    // wallSmash is one-shot, no duration
  };

  // Reverse forbidden during normal play (no instant U-turn) unless reverse pu active.
  // Power-up types
  var POWERUP_TYPES = ["speed", "shield", "smash", "reverse", "slow"];
  var POWERUP_META = {
    speed:    { glyph: "⚡", color: "#fff8c4", glow: "#f5c451", label: "SPEED" },
    shield:   { glyph: "\u{1F6E1}", color: "#a8e8ff", glow: "#5de0f0", label: "SHIELD" },
    smash:    { glyph: "\u{1F4A5}", color: "#ffb88a", glow: "#f78a4a", label: "SMASH" },
    reverse:  { glyph: "\u{1F504}", color: "#d8c8ff", glow: "#a991ff", label: "U-TURN" },
    slow:     { glyph: "\u{1F3AF}", color: "#9bd5ff", glow: "#5e9bd0", label: "SLOW" }
  };
  // Drop drop rate when AI dies = 100% (exactly one drops at the death cell)
  var POWERUP_DROP_LIFETIME = 11.0;

  // Cycle palette
  var CYCLE_COLORS = {
    player: { core: "#5de0f0", trail: "#5de0f0", trailDeep: "#228da0", glow: "rgba(93,224,240,0.55)" },
    foe1:   { core: "#ff5cb8", trail: "#ff5cb8", trailDeep: "#b22878", glow: "rgba(255,92,184,0.55)" },
    foe2:   { core: "#f7d652", trail: "#f7d652", trailDeep: "#b08018", glow: "rgba(247,214,82,0.55)" },
    foe3:   { core: "#8a7cff", trail: "#8a7cff", trailDeep: "#4838b0", glow: "rgba(138,124,255,0.55)" }
  };

  // Trail-cell types stored in grid
  // 0 empty, 1 player trail, 2 foe1, 3 foe2, 4 foe3, 9 scholar gate
  var WALL_TYPES = {
    EMPTY: 0,
    PLAYER: 1,
    FOE1: 2,
    FOE2: 3,
    FOE3: 4,
    GATE: 9
  };

  // -- Inline review bank (28 entries · grade 8 → AP) -----------------------
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence" },
    { prompt: "The Magna Carta (1215) is most significant because it:", choices: ["Limited the power of the English king", "Established Parliament directly", "Ended the Hundred Years' War", "Created common law"], correctText: "Limited the power of the English king" },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, diseases between hemispheres", "A 1492 trade treaty", "Slave trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, diseases between hemispheres" },
    { prompt: "Who wrote The Wealth of Nations (1776), foundational to classical economics?", choices: ["Adam Smith", "Karl Marx", "John Locke", "John Stuart Mill"], correctText: "Adam Smith" },
    { prompt: "An immediate cause of World War I was the assassination of:", choices: ["Archduke Franz Ferdinand", "Tsar Nicholas II", "Kaiser Wilhelm II", "Otto von Bismarck"], correctText: "Archduke Franz Ferdinand" },
    { prompt: "The Treaty of Versailles (1919) primarily blamed which country for WWI?", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany" },
    { prompt: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Declaration of Independence", "U.S. Constitution", "Bill of Rights", "Federalist No. 10"], correctText: "Declaration of Independence" },
    { prompt: "The 13th Amendment (1865) abolished:", choices: ["Slavery", "Poll taxes", "Child labor", "Religious tests for office"], correctText: "Slavery" },
    { prompt: "The Marshall Plan (1948) provided:", choices: ["Economic aid to rebuild Western Europe", "Military aid to South Korea", "Nuclear technology to NATO allies", "Food aid to the Soviet Union"], correctText: "Economic aid to rebuild Western Europe" },
    { prompt: "The Cuban Missile Crisis (1962) ended when:", choices: ["The Soviet Union withdrew missiles from Cuba", "Cuba renounced communism", "The U.S. invaded Cuba", "Khrushchev was removed from power"], correctText: "The Soviet Union withdrew missiles from Cuba" },
    { prompt: "Brown v. Board of Education (1954) ruled that:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional" },
    { prompt: "Which best describes a primary source?", choices: ["A first-hand record from the time period studied", "A textbook chapter", "A modern documentary", "An encyclopedia entry"], correctText: "A first-hand record from the time period studied" },
    { prompt: "The Berlin Wall fell in:", choices: ["1989", "1991", "1985", "1979"], correctText: "1989" },
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations", "NATO", "The League of Nations", "The European Union"], correctText: "The United Nations" },
    { prompt: "Which technology most enabled European long-distance voyages?", choices: ["The astrolabe and caravel", "The compound microscope", "The cotton gin", "The seed drill"], correctText: "The astrolabe and caravel" },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain" },
    { prompt: "Mansa Musa is best known as ruler of which medieval empire?", choices: ["Mali", "Songhai", "Ghana", "Aksum"], correctText: "Mali" },
    { prompt: "The Meiji Restoration (1868) refers primarily to:", choices: ["Rapid modernization and centralization in Japan", "The unification of Italy", "China's Boxer Rebellion", "Korean independence"], correctText: "Rapid modernization and centralization in Japan" },
    { prompt: "The Russian Revolution of October 1917 brought to power the:", choices: ["Bolsheviks", "Mensheviks", "Tsarists", "Kadets"], correctText: "Bolsheviks" },
    { prompt: "The doctrine of containment aimed to:", choices: ["Stop the spread of communism", "Roll back Soviet borders", "Promote free trade in Asia", "End nuclear weapons"], correctText: "Stop the spread of communism" },
    { prompt: "Apartheid in South Africa formally ended with elections in:", choices: ["1994", "1989", "2000", "1976"], correctText: "1994" },
    { prompt: "In economics, opportunity cost is:", choices: ["The next-best alternative given up", "The dollar price of a good", "Total revenue minus profit", "Inflation rate minus interest rate"], correctText: "The next-best alternative given up" },
    { prompt: "Federalist No. 10 (Madison) most concerns:", choices: ["The dangers of factions in a republic", "Judicial review", "Foreign treaties", "The bill of rights"], correctText: "The dangers of factions in a republic" },
    { prompt: "Marbury v. Madison (1803) established:", choices: ["Judicial review", "Executive privilege", "Federal supremacy in commerce", "The right to counsel"], correctText: "Judicial review" },
    { prompt: "Which best explains classical conditioning (Pavlov)?", choices: ["A neutral stimulus comes to elicit a learned response", "Behavior shaped by reward consequences", "Insight learning from problem solving", "Observational learning by imitation"], correctText: "A neutral stimulus comes to elicit a learned response" },
    { prompt: "DNA is composed of nucleotides containing:", choices: ["A sugar, a phosphate, and one of four bases", "An amino acid and a phosphate", "Two amino acids and one base", "A lipid and a base"], correctText: "A sugar, a phosphate, and one of four bases" },
    { prompt: "The Articles of Confederation's main weakness was:", choices: ["Congress could not effectively tax or regulate trade", "Too strong a chief executive", "An overreaching national judiciary", "Direct election of senators"], correctText: "Congress could not effectively tax or regulate trade" },
    { prompt: "The Enlightenment idea most shaping the U.S. Bill of Rights was:", choices: ["Natural rights of life, liberty, and property", "Divine right of kings", "Mercantilism", "Social Darwinism"], correctText: "Natural rights of life, liberty, and property" }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | roundClear | dying
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var lastBonusLifeThreshold = 0;

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
  // Persistent cycle-hum oscillator
  var humOsc = null;
  var humGain = null;
  function startHum() {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    if (humOsc) return;
    try {
      humOsc = ctxA.createOscillator();
      humGain = ctxA.createGain();
      humOsc.type = "sawtooth";
      humOsc.frequency.value = 90;
      humGain.gain.setValueAtTime(0, ctxA.currentTime);
      humGain.gain.linearRampToValueAtTime(0.04, ctxA.currentTime + 0.5);
      var lp = ctxA.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 320;
      humOsc.connect(lp).connect(humGain).connect(ctxA.destination);
      humOsc.start();
    } catch (e) {
      humOsc = null;
      humGain = null;
    }
  }
  function stopHum() {
    if (!humOsc) return;
    try {
      var ctxA = sfxInit();
      if (humGain && ctxA) {
        humGain.gain.cancelScheduledValues(ctxA.currentTime);
        humGain.gain.linearRampToValueAtTime(0, ctxA.currentTime + 0.2);
      }
      setTimeout(function () {
        try { humOsc && humOsc.stop(); } catch (er) {}
        humOsc = null;
        humGain = null;
      }, 240);
    } catch (e) {
      humOsc = null;
      humGain = null;
    }
  }
  function setHumPitch(freq) {
    if (!humOsc) return;
    try { humOsc.frequency.setValueAtTime(freq, sfxCtx.currentTime); } catch (e) {}
  }
  var sfx = {
    cycleHum: function () { startHum(); },
    turn: function () { sfxTone(820, 0.05, { type: "square", volume: 0.08, endFreq: 660 }); },
    trailExtend: function () {
      sfxTone(440 + Math.random() * 80, 0.022, { type: "triangle", volume: 0.045 });
    },
    botDie: function () {
      sfxNoise(0.18, { volume: 0.18, cutoff: 1500 });
      sfxTone(620, 0.22, { type: "sawtooth", volume: 0.16, endFreq: 90 });
    },
    playerDie: function () {
      sfxNoise(0.45, { volume: 0.22, cutoff: 600 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    scholarPass: function () {
      [988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.14, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholarCorrect: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholarWrong: function () {
      sfxTone(330, 0.18, { type: "sawtooth", volume: 0.14, endFreq: 180 });
      sfxNoise(0.1, { volume: 0.1, cutoff: 700 });
    },
    powerupPickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerupUse: function () {
      sfxTone(660, 0.08, { type: "square", volume: 0.14, endFreq: 1100 });
    },
    lifeLost: function () {
      sfxTone(440, 0.4, { type: "sawtooth", volume: 0.16, endFreq: 110 });
    },
    roundClear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    gameOver: function () {
      sfxNoise(0.55, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 40 });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("tronCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudRound = $("hudRound");
    dom.hudKills = $("hudKills");
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
    dom.puSlots = [$("puSlot0"), $("puSlot1"), $("puSlot2")];
  }

  // -- Grid helpers ----------------------------------------------------------
  function makeGrid() {
    var g = new Uint8Array(GRID_COLS * GRID_ROWS);
    return g;
  }
  function gridIndex(c, r) { return r * GRID_COLS + c; }
  function gridGet(g, c, r) {
    if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return -1;
    return g[gridIndex(c, r)];
  }
  function gridSet(g, c, r, v) {
    if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return;
    g[gridIndex(c, r)] = v;
  }
  function cellCenter(c, r) {
    return {
      x: GRID_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2,
      y: GRID_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2
    };
  }

  // -- Direction helpers -----------------------------------------------------
  var DIRS = {
    up:    { dc:  0, dr: -1 },
    down:  { dc:  0, dr:  1 },
    left:  { dc: -1, dr:  0 },
    right: { dc:  1, dr:  0 }
  };
  function opposite(dir) {
    if (dir === "up") return "down";
    if (dir === "down") return "up";
    if (dir === "left") return "right";
    if (dir === "right") return "left";
    return null;
  }

  // -- Cycles ----------------------------------------------------------------
  // A cycle is { id, kind: "player"|"foe", color, c, r, dir, queuedDir, alive,
  //   tickAccum (seconds toward next cell), trailType, slotIdx (foe1/2/3) }
  function makePlayerAt(c, r, dir) {
    return {
      id: "player",
      kind: "player",
      color: CYCLE_COLORS.player,
      c: c, r: r,
      dir: dir,
      queuedDir: dir,
      alive: true,
      tickAccum: 0,
      trailType: WALL_TYPES.PLAYER,
      // visual interpolation
      prevC: c, prevR: r,
      tProgress: 1
    };
  }
  function makeFoe(slot, c, r, dir) {
    var palette = slot === 0 ? CYCLE_COLORS.foe1 : (slot === 1 ? CYCLE_COLORS.foe2 : CYCLE_COLORS.foe3);
    var trailType = slot === 0 ? WALL_TYPES.FOE1 : (slot === 1 ? WALL_TYPES.FOE2 : WALL_TYPES.FOE3);
    return {
      id: "foe" + slot,
      kind: "foe",
      slot: slot,
      color: palette,
      c: c, r: r,
      dir: dir,
      queuedDir: dir,
      alive: true,
      tickAccum: 0,
      trailType: trailType,
      prevC: c, prevR: r,
      tProgress: 1,
      randomness: 0.30
    };
  }

  // -- State -----------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var round = opts.round || 1;
    var grid = makeGrid();
    // Spawn player + 3 foes at quadrant centers, facing inward toward center.
    // Player: middle-left, facing right.
    // Foe1: middle-right, facing left.
    // Foe2: top-middle, facing down.
    // Foe3: bottom-middle, facing up.
    var midR = Math.floor(GRID_ROWS / 2);
    var midC = Math.floor(GRID_COLS / 2);
    var player = makePlayerAt(8, midR, "right");
    var foes = [
      makeFoe(0, GRID_COLS - 9, midR, "left"),
      makeFoe(1, midC, 8, "down"),
      makeFoe(2, midC, GRID_ROWS - 9, "up")
    ];
    // Plant initial trails at start cell so they look connected
    gridSet(grid, player.c, player.r, player.trailType);
    for (var i = 0; i < foes.length; i++) {
      gridSet(grid, foes[i].c, foes[i].r, foes[i].trailType);
    }
    state = {
      round: round,
      maxRound: opts.maxRound || round,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      grid: grid,
      player: player,
      foes: foes,
      inventory: opts.inventory || [],   // array of { type } (max 3)
      activePowerups: {
        speedT: 0,
        shieldActive: !!opts.shieldActive,
        slowT: 0,
        reverseT: 0
      },
      drops: [],     // {c, r, type, life}
      gate: null,    // {c, r, life, triggered}
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      bgStars: opts.bgStars || generateStars(),
      // stats
      kills: opts.kills || 0,
      cellsPainted: opts.cellsPainted || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      gatesPassed: opts.gatesPassed || 0,
      best: opts.best || readBest(),
      time: 0,
      survivalT: 0,
      killStreak: 0,
      maxKillStreak: opts.maxKillStreak || 0,
      endReason: ""
    };
    // Spawn the round's scholar gate after a short delay
    state._gateSpawnT = 2.5 + Math.random() * 4.0;
  }
  function generateStars() {
    var stars = [];
    for (var i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * LOGICAL_W,
        y: Math.random() * LOGICAL_H,
        r: 0.5 + Math.random() * 1.5,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.0
      });
    }
    return stars;
  }

  // -- Input -----------------------------------------------------------------
  // Player turns 90 degrees. Cannot reverse instantly unless reverse pu is active.
  function tryTurn(newDir) {
    if (phase !== "playing") return;
    if (!state.player.alive) return;
    var cur = state.player.dir;
    if (newDir === cur) return;
    // disallow opposite unless reverse active
    if (opposite(cur) === newDir) {
      if (state.activePowerups.reverseT > 0) {
        state.player.queuedDir = newDir;
        sfx.turn();
        return;
      }
      return;
    }
    state.player.queuedDir = newDir;
    sfx.turn();
  }

  // -- Per-cell tick logic ---------------------------------------------------
  function stepCycle(cycle) {
    // Mark current cell as trail (already painted if it's the first tick).
    // Apply queued direction at the moment of stepping (Tron rules: turns commit at cell boundaries).
    if (cycle.queuedDir && cycle.queuedDir !== cycle.dir) {
      // Cannot reverse, except for player with reverse pu (already filtered in tryTurn)
      if (opposite(cycle.dir) !== cycle.queuedDir || (cycle.kind === "player" && state.activePowerups.reverseT > 0)) {
        cycle.dir = cycle.queuedDir;
      }
    }
    var d = DIRS[cycle.dir];
    var nc = cycle.c + d.dc;
    var nr = cycle.r + d.dr;
    cycle.prevC = cycle.c;
    cycle.prevR = cycle.r;
    cycle.tProgress = 0;

    // Edge collision
    if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) {
      handleCollision(cycle, "edge", nc, nr);
      return;
    }
    // Look up cell
    var occ = gridGet(state.grid, nc, nr);
    // Scholar gate
    if (occ === WALL_TYPES.GATE) {
      // Player passes gate → trigger review modal; foe ignores the gate (treats as empty).
      if (cycle.kind === "player") {
        // mark gate consumed immediately
        gridSet(state.grid, nc, nr, WALL_TYPES.EMPTY);
        cycle.c = nc;
        cycle.r = nr;
        gridSet(state.grid, cycle.c, cycle.r, cycle.trailType);
        state.cellsPainted++;
        state.score += 10;
        sfx.scholarPass();
        state.gate = null;
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 18, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
          }
        } catch (e) {}
        pushPopup("SCHOLAR GATE", LOGICAL_W / 2, LOGICAL_H / 2 - 60, "is-bonus");
        openScholarQuestion();
        return;
      } else {
        // foe ignores gate (passes through without triggering review)
        gridSet(state.grid, nc, nr, WALL_TYPES.EMPTY);
        state.gate = null;
      }
    }
    // Power-up drop
    var dropIdx = findDropAt(nc, nr);
    if (dropIdx >= 0) {
      var drop = state.drops[dropIdx];
      if (cycle.kind === "player") {
        if (state.inventory.length < INVENTORY_CAP) {
          state.inventory.push({ type: drop.type });
          sfx.powerupPickup();
          var center = cellCenter(nc, nr);
          pushPopup(POWERUP_META[drop.type].label + " +", center.x, center.y - 14, "is-bonus");
          burstAt(center.x, center.y, POWERUP_META[drop.type].glow, 12);
        } else {
          // inventory full → just convert to score
          state.score += 100;
          var c2 = cellCenter(nc, nr);
          pushPopup("+100 (FULL)", c2.x, c2.y - 14, "is-score");
        }
      }
      state.drops.splice(dropIdx, 1);
    }
    // Re-read occupation after potential gate consumption (now occ is the previously stored value;
    // for collision check, we need the value AFTER gate-consumption. Since gate just became empty,
    // occ is no longer trustworthy if it was a gate; so re-check.)
    occ = gridGet(state.grid, nc, nr);
    // Trail collision: any non-empty wall (not equal to player's own current trail mark? No — own trail = lethal too).
    if (occ !== WALL_TYPES.EMPTY) {
      // Shield absorbs only player trail collisions of any kind
      if (cycle.kind === "player" && state.activePowerups.shieldActive) {
        // Consume shield, smash this trail cell, continue
        state.activePowerups.shieldActive = false;
        gridSet(state.grid, nc, nr, WALL_TYPES.EMPTY);
        burstAt(cellCenter(nc, nr).x, cellCenter(nc, nr).y, "#5de0f0", 16);
        pushPopup("SHIELD", cellCenter(nc, nr).x, cellCenter(nc, nr).y - 14, "is-bonus");
        sfx.powerupUse();
        cycle.c = nc;
        cycle.r = nr;
        gridSet(state.grid, cycle.c, cycle.r, cycle.trailType);
        state.cellsPainted++;
        return;
      }
      handleCollision(cycle, "trail", nc, nr);
      return;
    }
    // Move into the cell, paint it
    cycle.c = nc;
    cycle.r = nr;
    gridSet(state.grid, cycle.c, cycle.r, cycle.trailType);
    if (cycle.kind === "player") {
      state.cellsPainted++;
      state.score += 10;
      // light trail-extend chime, throttled
      if (state.cellsPainted % 4 === 0) sfx.trailExtend();
    }
  }

  function handleCollision(cycle, reason, nc, nr) {
    if (cycle.kind === "player") {
      playerDie(reason);
    } else {
      foeDie(cycle, reason);
    }
  }

  function playerDie(reason) {
    var p = state.player;
    if (!p.alive) return;
    p.alive = false;
    state.killStreak = 0;
    addShake(8, 0.5);
    sfx.lifeLost();
    sfx.playerDie();
    state.lives--;
    burstAt(cellCenter(p.c, p.r).x, cellCenter(p.c, p.r).y, "#5de0f0", 28);
    pushPopup("CRASH", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-warn");
    if (state.lives <= 0) {
      phase = "dying";
      setTimeout(function () { gameOver(); }, 1100);
    } else {
      phase = "dying";
      setTimeout(function () { respawnPlayerSamRound(); }, 1300);
    }
  }

  function foeDie(foe, reason) {
    if (!foe.alive) return;
    foe.alive = false;
    var center = cellCenter(foe.c, foe.r);
    burstAt(center.x, center.y, foe.color.trail, 24);
    sfx.botDie();
    addShake(4, 0.25);
    state.kills++;
    state.killStreak++;
    if (state.killStreak > state.maxKillStreak) state.maxKillStreak = state.killStreak;
    var earned = 500 + (state.round - 1) * 50;
    state.score += earned;
    pushPopup("+" + earned, center.x, center.y - 14, "is-score");
    if (state.killStreak >= 2) {
      pushPopup("STREAK x" + state.killStreak, LOGICAL_W / 2, 100, "is-tetris");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 20, palette: [foe.color.trail, "#5de0f0", "#f5c451"] });
        }
      } catch (e) {}
    }
    // Drop a power-up at the foe's death cell
    spawnDropAt(foe.c, foe.r);
    checkBonusLife();
    // If only player + 1 alive foe (or only player) → round clear
    var aliveFoes = countAliveFoes();
    if (aliveFoes <= 0) {
      onRoundClear();
    } else if (state.player.alive && aliveFoes === 1) {
      // Per spec: "until only player or 1 player + 1 bot remaining"
      // 1 player + 1 bot remaining → also clears, with a bonus for the survivor.
      // Wait briefly so the kill animation completes, then clear.
      setTimeout(function () { onRoundClear(); }, 400);
    }
  }

  function respawnPlayerSamRound() {
    // Respawn player at left middle facing right; do NOT clear the existing trails.
    // To avoid immediate re-crash, scrub a small window of cells around the spawn.
    var c = 8, r = Math.floor(GRID_ROWS / 2);
    for (var dr = -2; dr <= 2; dr++) {
      for (var dc = -1; dc <= 6; dc++) {
        var cc = c + dc;
        var rr = r + dr;
        if (cc < 0 || cc >= GRID_COLS || rr < 0 || rr >= GRID_ROWS) continue;
        var v = gridGet(state.grid, cc, rr);
        // Only clear PLAYER trail in the spawn window so we don't help foes reset their walls.
        if (v === WALL_TYPES.PLAYER) gridSet(state.grid, cc, rr, WALL_TYPES.EMPTY);
      }
    }
    var p = makePlayerAt(c, r, "right");
    state.player = p;
    gridSet(state.grid, c, r, WALL_TYPES.PLAYER);
    phase = "playing";
  }

  function countAliveFoes() {
    var n = 0;
    for (var i = 0; i < state.foes.length; i++) if (state.foes[i].alive) n++;
    return n;
  }

  // -- Drops -----------------------------------------------------------------
  function findDropAt(c, r) {
    for (var i = 0; i < state.drops.length; i++) {
      var d = state.drops[i];
      if (d.c === c && d.r === r) return i;
    }
    return -1;
  }
  function spawnDropAt(c, r) {
    var type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.drops.push({ c: c, r: r, type: type, life: POWERUP_DROP_LIFETIME, bob: Math.random() * Math.PI * 2 });
  }

  // -- Scholar gate ---------------------------------------------------------
  function maybeSpawnGate(dt) {
    if (state.gate) return;
    state._gateSpawnT -= dt;
    if (state._gateSpawnT > 0) return;
    // Find an empty cell not too close to any cycle.
    for (var attempt = 0; attempt < 60; attempt++) {
      var c = 5 + Math.floor(Math.random() * (GRID_COLS - 10));
      var r = 5 + Math.floor(Math.random() * (GRID_ROWS - 10));
      if (gridGet(state.grid, c, r) !== WALL_TYPES.EMPTY) continue;
      // distance from player
      var dC = c - state.player.c;
      var dR = r - state.player.r;
      var dist = Math.abs(dC) + Math.abs(dR);
      if (dist < 8) continue;
      // Place gate
      gridSet(state.grid, c, r, WALL_TYPES.GATE);
      state.gate = { c: c, r: r, life: 30 + Math.random() * 12, age: 0 };
      return;
    }
    // give up; try again later
    state._gateSpawnT = 4.0;
  }

  function updateGate(dt) {
    if (!state.gate) return;
    state.gate.age += dt;
    state.gate.life -= dt;
    if (state.gate.life <= 0) {
      // gate expires (turns into empty cell)
      gridSet(state.grid, state.gate.c, state.gate.r, WALL_TYPES.EMPTY);
      state.gate = null;
      // schedule another later in the round
      state._gateSpawnT = 6 + Math.random() * 6;
    }
  }

  // -- Update timing ---------------------------------------------------------
  function update(dt) {
    state.time += dt;
    state.survivalT += dt;
    // gate spawn
    maybeSpawnGate(dt);
    updateGate(dt);

    // active power-ups
    var ap = state.activePowerups;
    if (ap.speedT > 0) ap.speedT -= dt;
    if (ap.slowT > 0) ap.slowT -= dt;
    if (ap.reverseT > 0) ap.reverseT -= dt;

    // Per-cycle stepping
    var playerInterval = playerTickMsForRound(state.round) / 1000;
    if (ap.speedT > 0) playerInterval /= SPEED_BOOST_MULT;
    var foeInterval = aiTickMsForRound(state.round) / 1000;
    if (ap.slowT > 0) foeInterval /= SLOW_FOES_MULT; // 0.5 → divide → 2x slower

    // step player
    if (state.player.alive) {
      state.player.tickAccum += dt;
      while (state.player.tickAccum >= playerInterval && state.player.alive) {
        state.player.tickAccum -= playerInterval;
        stepCycle(state.player);
      }
      // visual tProgress
      state.player.tProgress = Math.min(1, state.player.tickAccum / playerInterval);
    }

    // step foes
    for (var i = 0; i < state.foes.length; i++) {
      var foe = state.foes[i];
      if (!foe.alive) continue;
      foe.tickAccum += dt;
      while (foe.tickAccum >= foeInterval && foe.alive) {
        foe.tickAccum -= foeInterval;
        decideFoeMove(foe);
        stepCycle(foe);
      }
      foe.tProgress = Math.min(1, foe.tickAccum / foeInterval);
    }

    // drops lifetime
    for (var di = state.drops.length - 1; di >= 0; di--) {
      state.drops[di].life -= dt;
      state.drops[di].bob = (state.drops[di].bob || 0) + dt * 4;
      if (state.drops[di].life <= 0) state.drops.splice(di, 1);
    }

    updateParticles(dt);
    updateShake(dt);

    // hum pitch responds to speed
    if (humOsc) {
      var pitch = ap.speedT > 0 ? 140 : 90;
      setHumPitch(pitch);
    }
  }

  // -- Foe AI ---------------------------------------------------------------
  // Greedy avoidance: if the next cell in current direction is blocked or off-grid,
  // pick a perpendicular direction that has more open space ahead.
  // 30% randomness: occasionally pick a random valid turn even if straight is open.
  function decideFoeMove(foe) {
    // If we'll commit to a queued dir at next step, we predict the outcome based on dir/queued.
    var curDir = foe.queuedDir || foe.dir;
    var d = DIRS[curDir];
    var nc = foe.c + d.dc;
    var nr = foe.r + d.dr;
    var blocked = !cellOpenForFoe(nc, nr);

    // 30% random nudge — try a perpendicular turn if it's open
    if (!blocked && Math.random() < foe.randomness) {
      var sides = perpendicularDirs(curDir);
      // shuffle
      for (var i = sides.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = sides[i]; sides[i] = sides[j]; sides[j] = tmp;
      }
      for (var s = 0; s < sides.length; s++) {
        var sd = DIRS[sides[s]];
        var snc = foe.c + sd.dc;
        var snr = foe.r + sd.dr;
        if (cellOpenForFoe(snc, snr)) {
          // Look-ahead 4 steps for "openness"
          if (openSpaceAhead(snc, snr, sides[s], 5) >= 3) {
            foe.queuedDir = sides[s];
            return;
          }
        }
      }
      // fall through (continue straight)
      return;
    }

    if (!blocked) return;
    // blocked — must turn
    var turnSides = perpendicularDirs(curDir);
    var bestDir = null;
    var bestOpen = -1;
    for (var k = 0; k < turnSides.length; k++) {
      var td = DIRS[turnSides[k]];
      var tnc = foe.c + td.dc;
      var tnr = foe.r + td.dr;
      if (!cellOpenForFoe(tnc, tnr)) continue;
      var open = openSpaceAhead(tnc, tnr, turnSides[k], 8);
      // tiny random tiebreak
      open += Math.random() * 0.2;
      if (open > bestOpen) {
        bestOpen = open;
        bestDir = turnSides[k];
      }
    }
    if (bestDir) {
      foe.queuedDir = bestDir;
    }
    // If neither perpendicular is open, foe will crash next step (intended).
  }

  function perpendicularDirs(dir) {
    if (dir === "up" || dir === "down") return ["left", "right"];
    return ["up", "down"];
  }

  function cellOpenForFoe(c, r) {
    if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return false;
    var v = gridGet(state.grid, c, r);
    // Foes treat scholar gates as empty (just pass through)
    if (v === WALL_TYPES.GATE) return true;
    return v === WALL_TYPES.EMPTY;
  }

  function openSpaceAhead(c, r, dir, depth) {
    // Count how many cells are open in a straight line.
    var d = DIRS[dir];
    var open = 0;
    for (var i = 0; i < depth; i++) {
      var nc = c + d.dc * i;
      var nr = r + d.dr * i;
      if (!cellOpenForFoe(nc, nr)) break;
      open++;
    }
    return open;
  }

  // -- Power-up activation --------------------------------------------------
  function activatePowerup(slotIdx) {
    if (phase !== "playing") return;
    if (slotIdx < 0 || slotIdx >= INVENTORY_CAP) return;
    var item = state.inventory[slotIdx];
    if (!item) return;
    var type = item.type;
    state.inventory.splice(slotIdx, 1);
    sfx.powerupUse();
    var p = state.player;
    var pCenter = cellCenter(p.c, p.r);
    pushPopup(POWERUP_META[type].label + "!", pCenter.x, pCenter.y - 18, "is-bonus");
    if (type === "speed") {
      state.activePowerups.speedT = Math.max(state.activePowerups.speedT, POWERUP_DURATIONS.speed);
    } else if (type === "shield") {
      state.activePowerups.shieldActive = true;
    } else if (type === "smash") {
      // Clear 3 cells in front of player
      var d = DIRS[p.dir];
      for (var i = 1; i <= 3; i++) {
        var sc = p.c + d.dc * i;
        var sr = p.r + d.dr * i;
        if (sc < 0 || sc >= GRID_COLS || sr < 0 || sr >= GRID_ROWS) break;
        var v = gridGet(state.grid, sc, sr);
        if (v !== WALL_TYPES.EMPTY && v !== WALL_TYPES.GATE) {
          gridSet(state.grid, sc, sr, WALL_TYPES.EMPTY);
          var sCenter = cellCenter(sc, sr);
          burstAt(sCenter.x, sCenter.y, "#f78a4a", 8);
        }
      }
    } else if (type === "reverse") {
      state.activePowerups.reverseT = Math.max(state.activePowerups.reverseT, POWERUP_DURATIONS.reverse);
    } else if (type === "slow") {
      state.activePowerups.slowT = Math.max(state.activePowerups.slowT, POWERUP_DURATIONS.slow);
    }
  }

  // -- Bonus life ------------------------------------------------------------
  function checkBonusLife() {
    var threshold = Math.floor(state.score / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    if (threshold > lastBonusLifeThreshold && threshold >= BONUS_LIFE_THRESHOLD) {
      lastBonusLifeThreshold = threshold;
      state.lives++;
      pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 - 80, "is-bonus");
      sfx.scholarPass();
    }
  }

  // -- Round clear -----------------------------------------------------------
  function onRoundClear() {
    if (phase === "roundClear") return;
    phase = "roundClear";
    sfx.roundClear();
    addShake(6, 0.5);
    var bonus = 1500 + state.round * 250 + Math.floor(state.survivalT) * 25;
    state.score += bonus;
    state.lives += BONUS_LIFE_PER_ROUND;
    pushPopup("ROUND " + state.round + " CLEAR", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopup("+" + bonus, LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 + 50, "is-bonus");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#ff5cb8", "#a991ff"] });
      }
    } catch (e) {}
    saveSnapshot();
    setTimeout(function () {
      var nextRound = state.round + 1;
      var carry = {
        round: nextRound,
        maxRound: Math.max(state.maxRound, nextRound),
        score: state.score,
        lives: state.lives,
        kills: state.kills,
        cellsPainted: state.cellsPainted,
        shardsAwarded: state.shardsAwarded,
        questionsAnsweredCorrect: state.questionsAnsweredCorrect,
        questionsAnsweredTotal: state.questionsAnsweredTotal,
        gatesPassed: state.gatesPassed,
        maxKillStreak: state.maxKillStreak,
        best: state.best,
        bgStars: state.bgStars,
        inventory: state.inventory,        // carry inventory across rounds
        shieldActive: state.activePowerups.shieldActive
      };
      initState(carry);
      phase = "playing";
    }, 1700);
  }

  // -- Particles + popups + shake -------------------------------------------
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
        life: 0.6,
        totalLife: 0.6,
        color: color,
        size: 1.5 + Math.random() * 2.5
      });
    }
  }
  function updateParticles(dt) {
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;       // light gravity
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }
  function pushPopup(text, x, y, kls) {
    if (!dom.popupOverlay) return;
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
    drawGridLines();
    drawTrails();
    drawDrops();
    drawGate();
    drawCycles();
    drawParticles();

    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#02040c";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    // Soft cyan/magenta dual glow at ends
    var g1 = ctx.createRadialGradient(LOGICAL_W * 0.18, LOGICAL_H * 0.5, 30, LOGICAL_W * 0.18, LOGICAL_H * 0.5, 380);
    g1.addColorStop(0, "rgba(93,224,240,0.10)");
    g1.addColorStop(1, "rgba(2,4,12,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    var g2 = ctx.createRadialGradient(LOGICAL_W * 0.82, LOGICAL_H * 0.5, 30, LOGICAL_W * 0.82, LOGICAL_H * 0.5, 380);
    g2.addColorStop(0, "rgba(255,92,184,0.08)");
    g2.addColorStop(1, "rgba(2,4,12,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Stars
    if (state.bgStars) {
      for (var i = 0; i < state.bgStars.length; i++) {
        var s = state.bgStars[i];
        var tw = reducedMotion ? 1 : (0.5 + 0.5 * Math.abs(Math.sin(state.time * s.twinkleSpeed + s.twinkle)));
        ctx.fillStyle = "rgba(255,255,255," + (0.16 * tw) + ")";
        ctx.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
      }
    }
  }

  function drawGridLines() {
    // Outer glowing border
    ctx.save();
    ctx.strokeStyle = "rgba(93,224,240,0.55)";
    ctx.lineWidth = 2;
    if (!reducedMotion) {
      ctx.shadowColor = "rgba(93,224,240,0.65)";
      ctx.shadowBlur = 10;
    }
    ctx.strokeRect(0.5, 0.5, LOGICAL_W - 1, LOGICAL_H - 1);
    ctx.restore();

    // Faint grid lines every 4 cells
    ctx.save();
    ctx.strokeStyle = "rgba(64,98,150,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var c = 0; c <= GRID_COLS; c += 4) {
      var x = c * CELL_SIZE + 0.5;
      ctx.moveTo(x, 0); ctx.lineTo(x, LOGICAL_H);
    }
    for (var r = 0; r <= GRID_ROWS; r += 4) {
      var y = r * CELL_SIZE + 0.5;
      ctx.moveTo(0, y); ctx.lineTo(LOGICAL_W, y);
    }
    ctx.stroke();
    // Tighter pattern, very faint
    ctx.strokeStyle = "rgba(48,72,120,0.07)";
    ctx.beginPath();
    for (var c2 = 0; c2 <= GRID_COLS; c2++) {
      var x2 = c2 * CELL_SIZE + 0.5;
      ctx.moveTo(x2, 0); ctx.lineTo(x2, LOGICAL_H);
    }
    for (var r2 = 0; r2 <= GRID_ROWS; r2++) {
      var y2 = r2 * CELL_SIZE + 0.5;
      ctx.moveTo(0, y2); ctx.lineTo(LOGICAL_W, y2);
    }
    ctx.stroke();
    ctx.restore();
  }

  function trailColorFor(type) {
    switch (type) {
      case WALL_TYPES.PLAYER: return CYCLE_COLORS.player;
      case WALL_TYPES.FOE1:   return CYCLE_COLORS.foe1;
      case WALL_TYPES.FOE2:   return CYCLE_COLORS.foe2;
      case WALL_TYPES.FOE3:   return CYCLE_COLORS.foe3;
      default: return null;
    }
  }

  function drawTrails() {
    // Pass 1: draw deep shadow / glow base for each non-empty cell
    // Pass 2: bright neon core
    var g = state.grid;
    // pass 1 — soft shadow
    for (var r = 0; r < GRID_ROWS; r++) {
      for (var c = 0; c < GRID_COLS; c++) {
        var v = g[r * GRID_COLS + c];
        if (v === WALL_TYPES.EMPTY || v === WALL_TYPES.GATE) continue;
        var pal = trailColorFor(v);
        if (!pal) continue;
        var x = c * CELL_SIZE;
        var y = r * CELL_SIZE;
        ctx.fillStyle = pal.trailDeep;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
    // pass 2 — bright neon core
    for (var r2 = 0; r2 < GRID_ROWS; r2++) {
      for (var c2 = 0; c2 < GRID_COLS; c2++) {
        var v2 = g[r2 * GRID_COLS + c2];
        if (v2 === WALL_TYPES.EMPTY || v2 === WALL_TYPES.GATE) continue;
        var pal2 = trailColorFor(v2);
        if (!pal2) continue;
        var x2 = c2 * CELL_SIZE;
        var y2 = r2 * CELL_SIZE;
        // Inner gradient
        var gradY = ctx.createLinearGradient(x2, y2, x2, y2 + CELL_SIZE);
        gradY.addColorStop(0, pal2.trail);
        gradY.addColorStop(1, pal2.trailDeep);
        ctx.fillStyle = gradY;
        ctx.fillRect(x2 + 1, y2 + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        // top highlight
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x2 + 1, y2 + 1, CELL_SIZE - 2, 1);
      }
    }
  }

  function drawDrops() {
    for (var i = 0; i < state.drops.length; i++) {
      var d = state.drops[i];
      var meta = POWERUP_META[d.type];
      var center = cellCenter(d.c, d.r);
      var bob = reducedMotion ? 0 : Math.sin(d.bob || 0) * 2;
      var x = center.x;
      var y = center.y + bob;
      // halo
      if (!reducedMotion) {
        var rad = 14;
        var glow = ctx.createRadialGradient(x, y, 0, x, y, rad);
        glow.addColorStop(0, hexA(meta.glow, 0.55));
        glow.addColorStop(1, hexA(meta.glow, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // disc backing
      ctx.fillStyle = "rgba(2,8,20,0.9)";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = meta.glow;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // glyph
      ctx.fillStyle = meta.color;
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, x, y + 0.5);
      // ttl ring near end
      if (d.life < 3.0) {
        var alpha = 0.4 + 0.5 * Math.abs(Math.sin(state.time * 8));
        ctx.strokeStyle = "rgba(240,72,96," + alpha.toFixed(2) + ")";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawGate() {
    if (!state.gate) return;
    var g = state.gate;
    var center = cellCenter(g.c, g.r);
    var x = center.x, y = center.y;
    var pulse = reducedMotion ? 0 : Math.sin(state.time * 4) * 1.5;
    // Outer ring
    if (!reducedMotion) {
      ctx.save();
      var glow = ctx.createRadialGradient(x, y, 0, x, y, 18);
      glow.addColorStop(0, "rgba(245,196,81,0.5)");
      glow.addColorStop(1, "rgba(245,196,81,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // gate cell — gold square
    ctx.save();
    ctx.fillStyle = "#3a2e10";
    ctx.fillRect(g.c * CELL_SIZE, g.r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 1.4;
    ctx.shadowColor = reducedMotion ? "transparent" : "#f5c451";
    ctx.shadowBlur = reducedMotion ? 0 : 12 + pulse;
    ctx.strokeRect(g.c * CELL_SIZE + 1, g.r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.restore();
    // ?
    ctx.save();
    ctx.fillStyle = "#fff8c4";
    ctx.font = "bold 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", x, y + 0.5);
    ctx.restore();
    // expiry warn
    if (g.life < 5) {
      var alpha = 0.3 + 0.5 * Math.abs(Math.sin(state.time * 8));
      ctx.strokeStyle = "rgba(240,72,96," + alpha.toFixed(2) + ")";
      ctx.lineWidth = 1;
      ctx.strokeRect(g.c * CELL_SIZE, g.r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  function drawCycles() {
    // Order: foes first (so player draws on top during overlapping rare moments)
    for (var i = 0; i < state.foes.length; i++) {
      if (!state.foes[i].alive) continue;
      drawCycle(state.foes[i], state.foes[i].color);
    }
    if (state.player.alive) {
      drawCycle(state.player, state.player.color);
    }
  }

  function drawCycle(cycle, color) {
    // Use prevC/prevR + tProgress for visual interpolation between cells
    var t = Math.min(1, Math.max(0, cycle.tProgress));
    var prev = cellCenter(cycle.prevC, cycle.prevR);
    var cur = cellCenter(cycle.c, cycle.r);
    var x = prev.x + (cur.x - prev.x) * t;
    var y = prev.y + (cur.y - prev.y) * t;

    // halo
    if (!reducedMotion) {
      ctx.save();
      var glow = ctx.createRadialGradient(x, y, 0, x, y, 16);
      glow.addColorStop(0, color.glow);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Cycle body — rectangle aligned to direction
    ctx.save();
    ctx.translate(x, y);
    var rot;
    if (cycle.dir === "right") rot = 0;
    else if (cycle.dir === "down") rot = Math.PI / 2;
    else if (cycle.dir === "left") rot = Math.PI;
    else rot = -Math.PI / 2;
    ctx.rotate(rot);
    // Tron cycle: long body, glowing accent stripe
    var bodyLen = 14, bodyWid = 8;
    // Outer dark hull
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(-bodyLen / 2, -bodyWid / 2, bodyLen, bodyWid);
    // Neon core stripe
    ctx.fillStyle = color.core;
    ctx.fillRect(-bodyLen / 2 + 1, -1.5, bodyLen - 2, 3);
    // top glint
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(-bodyLen / 2 + 1, -bodyWid / 2 + 1, bodyLen - 2, 1);
    // wheels (tiny)
    ctx.fillStyle = color.trailDeep;
    ctx.fillRect(-bodyLen / 2 + 1, -bodyWid / 2 - 1, 3, 1.2);
    ctx.fillRect(bodyLen / 2 - 4, -bodyWid / 2 - 1, 3, 1.2);
    ctx.fillRect(-bodyLen / 2 + 1, bodyWid / 2 - 0.2, 3, 1.2);
    ctx.fillRect(bodyLen / 2 - 4, bodyWid / 2 - 0.2, 3, 1.2);
    // forward beak
    ctx.fillStyle = color.core;
    ctx.beginPath();
    ctx.moveTo(bodyLen / 2, 0);
    ctx.lineTo(bodyLen / 2 + 4, -2);
    ctx.lineTo(bodyLen / 2 + 4, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // shield ring
    if (cycle.kind === "player" && state.activePowerups.shieldActive) {
      ctx.save();
      ctx.strokeStyle = "#5de0f0";
      ctx.lineWidth = 1.5;
      if (!reducedMotion) {
        ctx.shadowColor = "#5de0f0";
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // speed boost streak behind
    if (cycle.kind === "player" && state.activePowerups.speedT > 0 && !reducedMotion) {
      var dirVec = DIRS[cycle.dir];
      var streakX = x - dirVec.dc * 18;
      var streakY = y - dirVec.dr * 18;
      var grad = ctx.createLinearGradient(x, y, streakX, streakY);
      grad.addColorStop(0, "rgba(247,214,82,0.7)");
      grad.addColorStop(1, "rgba(247,214,82,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(streakX, streakY);
      ctx.stroke();
    }
    // reverse-allowed marker
    if (cycle.kind === "player" && state.activePowerups.reverseT > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(169,145,255,0.7)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // slow-foes marker on foes
    if (cycle.kind === "foe" && state.activePowerups.slowT > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(155,213,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
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

  // -- Color helpers ---------------------------------------------------------
  function hexA(hex, a) {
    if (!hex) return "rgba(255,255,255," + a + ")";
    if (hex.charAt(0) !== "#") {
      // assume rgba/rgb already, return blended fallback
      if (hex.indexOf("rgba(") === 0 || hex.indexOf("rgb(") === 0) return hex;
      return hex;
    }
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
    if (dom.hudRound) dom.hudRound.textContent = String(state.round);
    if (dom.hudKills) dom.hudKills.textContent = String(state.kills);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      var aliveFoes = countAliveFoes();
      dom.goalName.textContent = "Round " + state.round + " · " + aliveFoes + " foe" + (aliveFoes === 1 ? "" : "s") + " left";
    }
    if (dom.goalMeta) {
      var bits = [];
      var ap = state.activePowerups;
      if (ap.speedT > 0) bits.push("Speed " + ap.speedT.toFixed(1) + "s");
      if (ap.shieldActive) bits.push("Shield");
      if (ap.slowT > 0) bits.push("Slow " + ap.slowT.toFixed(1) + "s");
      if (ap.reverseT > 0) bits.push("U-turn " + ap.reverseT.toFixed(1) + "s");
      if (state.inventory.length) bits.push("Inv " + state.inventory.length + "/" + INVENTORY_CAP);
      if (bits.length === 0) bits.push("Inventory · empty");
      dom.goalMeta.textContent = bits.join(" · ");
    }
    // Inventory slots
    if (dom.puSlots) {
      for (var i = 0; i < INVENTORY_CAP; i++) {
        var slot = dom.puSlots[i];
        if (!slot) continue;
        var glyph = slot.querySelector(".pu-glyph");
        var item = state.inventory[i];
        if (item) {
          slot.classList.add("is-filled");
          slot.title = POWERUP_META[item.type].label;
          if (glyph) glyph.textContent = POWERUP_META[item.type].glyph;
        } else {
          slot.classList.remove("is-filled");
          slot.title = "Empty";
          if (glyph) glyph.textContent = "";
        }
      }
    }
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Scholar / review modal -----------------------------------------------
  var activeQuestion = null;

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

  function openScholarQuestion() {
    activeQuestion = pickQuestion();
    state.gatesPassed++;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Gate · Optional · +1500 + 12 shards";
    if (dom.questionCloseBtn) dom.questionCloseBtn.textContent = "Skip";
    renderQuestion();
    prevPhase = phase;
    phase = "question";
    pauseMusic();
    // Silence the cycle hum while the review modal is open — physics is paused,
    // so the engine sound shouldn't keep humming over the prompt.
    stopHum();
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
    // Shuffle answer order so correct text isn't always in fixed slot
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
      dom.explanation.textContent = "Decoded! +1500 score, +12 shards.";
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
      // IMPORTANT: source string MUST be exactly "tron-trails-scholar-correct" per spec.
      addShards(12, "tron-trails-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+1500 SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
      pushPopup("+12 shards", LOGICAL_W / 2, 110, "is-score");
    }
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    if (phase === "playing") startHum();
    // schedule next gate later in this round
    state._gateSpawnT = 8 + Math.random() * 8;
    updateHud();
  }

  function skipQuestion() {
    // skipping scholar gate is allowed; no score, no shards
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    if (phase === "playing") startHum();
    state._gateSpawnT = 8 + Math.random() * 8;
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
    stopHum();
    setTimeout(showEndScreen, 700);
  }

  function showEndScreen() {
    if (phase !== "ended") return;
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 250));
    if (shardsToAdd > 0) addShards(shardsToAdd, GAME_ID + "-final");
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Grid Disqualified" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Tron Trails · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Rounds Cleared</div><div class="end-cell-value">' + Math.max(0, state.round - 1) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Bot Kills</div><div class="end-cell-value">' + formatNumber(state.kills) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Trail Cells</div><div class="end-cell-value">' + formatNumber(state.cellsPainted) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholar Gates</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          round: state.maxRound,
          kills: state.kills,
          cells: state.cellsPainted
        });
      }
    } catch (e) {}
  }
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        // Persist the fields needed to faithfully restore a run on resume.
        // Inventory is shallow-cloned to avoid storing live references.
        var invCopy = [];
        for (var ii = 0; ii < state.inventory.length; ii++) {
          invCopy.push({ type: state.inventory[ii].type });
        }
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          round: state.round,
          kills: state.kills,
          cells: state.cellsPainted,
          shardsAwarded: state.shardsAwarded,
          questionsAnsweredCorrect: state.questionsAnsweredCorrect,
          questionsAnsweredTotal: state.questionsAnsweredTotal,
          gatesPassed: state.gatesPassed,
          maxKillStreak: state.maxKillStreak,
          inventory: invCopy,
          shieldActive: !!state.activePowerups.shieldActive,
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
          file: "games/tron-trails/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("tron-trails:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("tron-trails:best", String(Math.floor(v)));
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
        if (k === "ArrowUp" || k === "w" || k === "W") { tryTurn("up"); e.preventDefault(); return; }
        if (k === "ArrowDown" || k === "s" || k === "S") { tryTurn("down"); e.preventDefault(); return; }
        if (k === "ArrowLeft" || k === "a" || k === "A") { tryTurn("left"); e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { tryTurn("right"); e.preventDefault(); return; }
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
      var ax = Math.abs(dx), ay = Math.abs(dy);
      var SWIPE = 22;
      if (ax >= SWIPE || ay >= SWIPE) {
        var dir;
        if (ax > ay) dir = (dx < 0) ? "left" : "right";
        else dir = (dy < 0) ? "up" : "down";
        tryTurn(dir);
      }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });
  }

  function bindTouchControls() {
    function pressBtn(btn, dir) {
      if (!btn) return;
      var fire = function (e) { if (e) e.preventDefault(); if (phase === "playing") tryTurn(dir); };
      btn.addEventListener("click", fire);
      btn.addEventListener("touchstart", fire, { passive: false });
    }
    pressBtn(dom.tcUp, "up");
    pressBtn(dom.tcDown, "down");
    pressBtn(dom.tcLeft, "left");
    pressBtn(dom.tcRight, "right");
    if (dom.puSlots) {
      for (var i = 0; i < INVENTORY_CAP; i++) {
        (function (idx) {
          var slot = dom.puSlots[idx];
          if (!slot) return;
          var fire = function (e) { if (e) e.preventDefault(); activatePowerup(idx); };
          slot.addEventListener("click", fire);
          slot.addEventListener("touchstart", fire, { passive: false });
        })(i);
      }
    }
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing") {
      prevPhase = "playing";
      phase = "paused";
      pauseMusic();
      stopHum();
      showScreen("pause");
      renderPauseProgress();
    } else if (phase === "paused") {
      phase = "playing";
      showScreen(null);
      resumeMusic();
      startHum();
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
      stopHum();
      showScreen("setup");
      renderSetupExtras();
    });
    dom.againBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.questionCloseBtn.addEventListener("click", skipQuestion);
    // Backdrop click on question modal also skips (matches Esc behavior).
    if (dom.questionScreen) {
      dom.questionScreen.addEventListener("click", function (e) {
        if (phase === "question" && e.target === dom.questionScreen) skipQuestion();
      });
    }
    dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) { stopMusic(); stopHum(); }
      else if (phase === "playing") { startMusic(); startHum(); }
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
      MrMacsDifficulty.register("tron-trails");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "tron-trails", { compact: false });
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
    stopHum();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  function newRun() {
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.reset(); MrMacsEndRecap.startTracking(); } } catch (e) {}
    lastBonusLifeThreshold = 0;
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    startHum();
    updateHud();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    lastBonusLifeThreshold = Math.floor((s.score || 0) / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    // Sanitize inventory so corrupted saves don't poison the run
    var inv = [];
    if (Array.isArray(s.inventory)) {
      for (var ii = 0; ii < s.inventory.length && inv.length < INVENTORY_CAP; ii++) {
        var it = s.inventory[ii];
        if (it && POWERUP_META[it.type]) inv.push({ type: it.type });
      }
    }
    initState({
      score: s.score || 0,
      round: s.round || 1,
      kills: s.kills || 0,
      cellsPainted: s.cells || 0,
      shardsAwarded: s.shardsAwarded || 0,
      questionsAnsweredCorrect: s.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: s.questionsAnsweredTotal || 0,
      gatesPassed: s.gatesPassed || 0,
      maxKillStreak: s.maxKillStreak || 0,
      inventory: inv,
      shieldActive: !!s.shieldActive,
      best: readBest()
    });
    showScreen(null);
    phase = "playing";
    startMusic();
    startHum();
    updateHud();
    recordPlayWithProfile();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.kills) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Round ' + (snap.state.round || 1) +
        ' &middot; Kills ' + (snap.state.kills || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Tron Trails Scores</div>';
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
        // Defer the first auto-save by one full interval rather than firing
        // immediately on the first playing frame (lastSnapshotTs starts at 0
        // and ts is a high DOMHighResTimeStamp on first frame).
        if (lastSnapshotTs === 0) lastSnapshotTs = ts;
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
        update(dt);
      } else if (phase === "dying") {
        // Allow particles + shake to keep updating during death sequence
        if (state) {
          updateParticles(dt);
          updateShake(dt);
        }
      } else if (phase === "roundClear" || phase === "paused") {
        if (state) {
          updateParticles(dt);
          updateShake(dt);
        }
      }
    }
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "roundClear" || phase === "paused") {
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
    stopHum();
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
      MrMacsHelpOverlay.register("tron-trails", {
        title: "How to Play Tron Trails",
        goal: "Pilot your light cycle on a 60×60 grid, box in AI opponents to score kills, and survive without crashing into any trail or wall.",
        controls: [
          { key: "↑ / W", action: "Turn up" },
          { key: "↓ / S", action: "Turn down" },
          { key: "← / A", action: "Turn left" },
          { key: "→ / D", action: "Turn right" },
          { key: "1 / 2 / 3", action: "Activate power-up" },
          { key: "Touch D-pad", action: "Turn on mobile" },
          { key: "Esc / P", action: "Pause or unpause" }
        ],
        tips: [
          "Every cell you pass becomes a permanent neon wall — plan your path before committing.",
          "Corner AI bots into small areas by cutting off their escape routes early.",
          "Speed power-up lets you outrun a bot but makes sharp turns harder — use it in open space.",
          "Shield absorbs one collision — save it for desperate recoveries, not offense.",
          "Wall Smash destroys one trail cell in front of you, creating an emergency escape."
        ],
        scholar: "Once per round a gold Scholar Gate opens at a random grid position. Steer your cycle through it to open an optional review prompt and earn bonus shards. The grid is paused while the prompt is open. Skip any time with no penalty."
      });
      var _helpContainer = document.querySelector("#setupScreen .setup-actions");
      if (_helpContainer) MrMacsHelpOverlay.mountButton(_helpContainer, "tron-trails");
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "tron-trails";
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
