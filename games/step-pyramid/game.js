/* ===========================================================================
   Step Pyramid — Q*bert isometric hopper · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 768x720 logical · 7-row pyramid (28 cubes) · scholar cubes
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "step-pyramid";
  var GAME_TITLE = "Step Pyramid";

  // Logical canvas
  var LOGICAL_W = 768;
  var LOGICAL_H = 720;

  // Pyramid geometry
  var PYRAMID_ROWS = 7;
  var CUBE_W = 64;            // top-face width (full diamond width)
  var CUBE_H = 32;             // top-face height (diamond half-height = 16)
  var CUBE_SIDE_H = 36;       // height of side faces below the top diamond
  // Pyramid origin (apex top center)
  var PYRAMID_TOP_Y = 100;
  // Each row is offset down by (CUBE_H/2 + CUBE_SIDE_H * 0.6)? No — Q*bert classic stacks
  // cubes so each lower-row cube top sits at apex_top + row * (CUBE_SIDE_H + CUBE_H/2)
  // We'll use ROW_VSTEP = CUBE_H/2 + CUBE_SIDE_H = 16 + 36 = 52
  var ROW_VSTEP = (CUBE_H / 2) + CUBE_SIDE_H;
  // Horizontal offset per column within a row = CUBE_W (cube widths interlock)
  var COL_HSTEP = CUBE_W;
  // Within a row, neighbors share an edge at the row's vertical midpoint;
  // each successive col shifts +COL_HSTEP.
  // Row starts at: cx = LOGICAL_W/2 - (row * COL_HSTEP / 2)
  function cubeTopCenter(row, col) {
    var rowStartX = LOGICAL_W / 2 - (row * COL_HSTEP / 2);
    var x = rowStartX + col * COL_HSTEP;
    var y = PYRAMID_TOP_Y + row * ROW_VSTEP;
    return { x: x, y: y };
  }

  function cubeExists(row, col) {
    if (row < 0 || row >= PYRAMID_ROWS) return false;
    if (col < 0 || col > row) return false;
    return true;
  }

  // 4 hop directions; map (row, col) → (row+dr, col+dc)
  // up-left: row-1, col-1 ; up-right: row-1, col   ; down-left: row+1, col   ; down-right: row+1, col+1
  var HOP_DIRS = {
    "up-left":    { dr: -1, dc: -1 },
    "up-right":   { dr: -1, dc:  0 },
    "down-left":  { dr: +1, dc:  0 },
    "down-right": { dr: +1, dc: +1 }
  };

  // Difficulty + scoring
  var MAX_LEVEL = 12;
  var LIVES_INIT = 3;
  var POWERUP_DROP_RATE = 0.05;       // 5% per cube completion
  var POWERUP_LIFETIME = 12.0;
  var SHARDS_CAP = 200;
  var BONUS_LIFE_THRESHOLD = 10000;

  // Stage progression: # color-cycle stages per cube to reach target.
  // Level 1 = 1 stage (one hop completes). Level 2 = 2 stages. Cap at 3.
  function stagesForLevel(level) {
    return Math.min(3, level);
  }
  // Reverse-cycle (Q*bert later levels): when true, hopping ALSO can revert
  // a previously-completed cube. We turn this on at level >= 4.
  function reverseAtLevel(level) { return level >= 4; }

  // Player
  var HOP_DURATION_MS = 280;
  var HOP_COOLDOWN_MS = 40;
  var DEATH_DELAY_MS = 1500;

  // Enemy spawn
  var ENEMY_SPAWN_BASE = 7.5;          // seconds between spawns at L1
  var ENEMY_CAP = 3;                    // max simultaneous enemies on board
  function enemySpawnInterval(level) {
    return Math.max(2.5, ENEMY_SPAWN_BASE - level * 0.5);
  }

  // Disc spawn
  var DISC_RESPAWN_BASE = 14.0;
  var DISC_MAX = 2;

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

  // -- Cube colors -----------------------------------------------------------
  // We use a 4-color palette where stage 0 = stone, stage 1 = gilt (gold), stage 2 = emerald,
  // and stage 3 = locked-emerald (only used when stages>2 to differ visually).
  // Visually: stage targets vary with level. Target stage = stagesForLevel(level).
  var STAGE_PALETTE = [
    // stone (base)
    { topLight: "#cfa57c", topMid: "#b07a45", topDark: "#7c4f24", left: "#7a4f23", right: "#5b3914" },
    // gilt
    { topLight: "#f7da72", topMid: "#e6b738", topDark: "#a8821c", left: "#9a7416", right: "#6a4e0a" },
    // emerald (target)
    { topLight: "#9af2c3", topMid: "#3fc28a", topDark: "#1a805a", left: "#177a4f", right: "#0c5236" },
    // deep-emerald (stage 3 / target when level >= 3)
    { topLight: "#5cd9b0", topMid: "#19a87a", topDark: "#0b6b4c", left: "#0a6045", right: "#053a2d" }
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
  var sfx = {
    hop:        function () { sfxTone(540, 0.060, { type: "square", volume: 0.10, endFreq: 760 }); },
    land:       function () { sfxTone(420, 0.045, { type: "triangle", volume: 0.08, endFreq: 320 }); },
    colorChange: function () {
      sfxTone(660, 0.060, { type: "triangle", volume: 0.10 });
      setTimeout(function () { sfxTone(880, 0.075, { type: "triangle", volume: 0.10 }); }, 50);
    },
    cubeComplete: function () {
      [659, 988, 1318].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.14 }); }, i * 50);
      });
    },
    enemyDrop: function () {
      sfxTone(820, 0.34, { type: "sawtooth", volume: 0.12, endFreq: 110 });
      sfxNoise(0.18, { volume: 0.10, cutoff: 600 });
    },
    enemyDie: function () {
      sfxNoise(0.16, { volume: 0.18, cutoff: 1400 });
      sfxTone(440, 0.16, { type: "square", volume: 0.12, endFreq: 880 });
    },
    discGrab: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.13, { type: "triangle", volume: 0.18 }); }, i * 60);
      });
    },
    coilyLured: function () {
      [1320, 990, 660, 440, 220].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "sawtooth", volume: 0.14 }); }, i * 70);
      });
    },
    death: function () {
      sfxNoise(0.4, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 50 });
    },
    levelClear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    scholarLand: function () {
      [988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.15, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    powerup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    fall: function () {
      sfxTone(440, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 80 });
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
    canvas = $("steppyCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudLevel = $("hudLevel");
    dom.hudCubes = $("hudCubes");
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
    dom.tcUL = $("tcUL");
    dom.tcUR = $("tcUR");
    dom.tcDL = $("tcDL");
    dom.tcDR = $("tcDR");
  }

  // -- Cube grid -------------------------------------------------------------
  function buildCubes(level) {
    var cubes = []; // flat array of {row, col, stage, fadeT}
    for (var r = 0; r < PYRAMID_ROWS; r++) {
      for (var c = 0; c <= r; c++) {
        cubes.push({ row: r, col: c, stage: 0, prevStage: 0, fadeT: 0 });
      }
    }
    return cubes;
  }
  function findCube(cubes, row, col) {
    for (var i = 0; i < cubes.length; i++) {
      if (cubes[i].row === row && cubes[i].col === col) return cubes[i];
    }
    return null;
  }
  function pickScholarCube(cubes) {
    var idx = Math.floor(Math.random() * cubes.length);
    cubes[idx].scholar = true;
    return cubes[idx];
  }
  function targetStage(level) { return stagesForLevel(level); }
  function isComplete(cube, level) { return cube.stage >= targetStage(level); }
  function cubesRemaining(cubes, level) {
    var n = 0;
    for (var i = 0; i < cubes.length; i++) if (!isComplete(cubes[i], level)) n++;
    return n;
  }
  function cubesCompleted(cubes, level) {
    return cubes.length - cubesRemaining(cubes, level);
  }

  // -- Player ----------------------------------------------------------------
  function makePlayer() {
    var c = cubeTopCenter(0, 0);
    return {
      row: 0, col: 0,
      x: c.x, y: c.y - 8,             // sit slightly above the cube top
      facing: "down-right",
      hopT: 0,
      hopFromX: 0, hopFromY: 0,
      hopToX: 0, hopToY: 0,
      hopFromRow: 0, hopFromCol: 0,
      hopToRow: 0, hopToCol: 0,
      hopDuration: HOP_DURATION_MS / 1000,
      lastHopTs: 0,
      dying: false,
      dyingT: 0,
      dyingMode: "fall",            // fall | squish
      onDisc: null,                  // disc currently riding to apex
      shieldT: 0,
      slowT: 0,
      multT: 0, multValue: 1,
      freezeT: 0,                    // freeze enemies (player has freeze active = enemies frozen)
      chainCount: 0
    };
  }

  // -- Enemies ---------------------------------------------------------------
  // Types: "coily", "slick", "wrong"
  // coily — drops on apex, chases player one cube per move; lethal.
  // slick — drops on apex, hops random down-direction; reverts cube it lands on.
  // wrong — descends in a straight diagonal line (down-left or down-right) along virtual cubes;
  //         lethal on contact, falls off pyramid edge → despawn.
  function makeEnemy(type, level) {
    return {
      type: type,
      row: 0, col: 0,
      x: cubeTopCenter(0, 0).x,
      y: cubeTopCenter(0, 0).y - 6,
      hopT: 0,
      hopFromX: 0, hopFromY: 0,
      hopToX: 0, hopToY: 0,
      hopFromRow: 0, hopFromCol: 0,
      hopToRow: 0, hopToCol: 0,
      hopDuration: 0.34,             // slightly slower than player by default
      moveTimer: 0.6 + Math.random() * 0.4, // wait before first hop
      moveCadence: 0.5 + Math.random() * 0.4,
      dying: false,
      dyingT: 0,
      falling: false,                // true if hopping off pyramid → fall to lure
      level: level,
      direction: type === "wrong" ? (Math.random() < 0.5 ? "down-left" : "down-right") : null,
      spawnGraceT: 0.6                // time after spawn during which they ignore player on apex
    };
  }

  // -- Discs -----------------------------------------------------------------
  // Discs spawn at the 2 outer-bottom corners of the pyramid, off the side.
  // Position: row 6 (last), but offset OUTSIDE the pyramid — left of col 0, right of col 6.
  function makeDisc(side) {
    // side: "left" | "right"
    // Visual position: roughly at the height of row 5-6, off to the side
    var anchorRow = 5 + Math.floor(Math.random() * 2);
    var c;
    if (side === "left") {
      c = cubeTopCenter(anchorRow, 0);
      c.x -= CUBE_W * 0.7;
    } else {
      c = cubeTopCenter(anchorRow, anchorRow);
      c.x += CUBE_W * 0.7;
    }
    return {
      side: side,
      row: anchorRow,
      x: c.x,
      y: c.y + CUBE_H * 0.3,
      bob: Math.random() * Math.PI * 2,
      rot: 0,
      life: 26.0
    };
  }

  // -- Powerups --------------------------------------------------------------
  var POWERUP_TYPES = ["freeze", "shield", "slow", "mult", "colorJump"];
  var POWERUP_META = {
    freeze:    { glyph: "❄", color: "#a8e8ff", glow: "#5de0f0", label: "FREEZE" },
    shield:    { glyph: "🛡", color: "#a8e8ff", glow: "#5de0f0", label: "SHIELD" },
    slow:      { glyph: "⏱", color: "#9bd5ff", glow: "#5e9bd0", label: "SLOW" },
    mult:      { glyph: "⭐", color: "#fff8c4", glow: "#f0a800", label: "x2" },
    colorJump: { glyph: "🎯", color: "#ffd2e0", glow: "#f07bb8", label: "COLOR" }
  };
  function spawnPowerup(opts) {
    opts = opts || {};
    // pick a non-completed cube (or any cube if all complete)
    var pool = [];
    for (var i = 0; i < state.cubes.length; i++) {
      var c = state.cubes[i];
      if (!isComplete(c, state.level)) pool.push(c);
    }
    if (!pool.length) pool = state.cubes.slice();
    var cube = pool[Math.floor(Math.random() * pool.length)];
    var type = opts.type || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.powerups.push({
      type: type,
      row: cube.row,
      col: cube.col,
      life: POWERUP_LIFETIME,
      bob: Math.random() * Math.PI * 2,
      orbit: 0
    });
  }
  function maybeDropPowerup() {
    if (Math.random() < POWERUP_DROP_RATE) spawnPowerup();
  }
  function applyPowerup(p) {
    sfx.powerup();
    var meta = POWERUP_META[p.type];
    var center = cubeTopCenter(p.row, p.col);
    pushPopup(meta.label, center.x, center.y - 24, "is-bonus");
    if (p.type === "freeze") {
      state.player.freezeT = 5.0;
    } else if (p.type === "shield") {
      state.player.shieldT = 999;
      state.shieldActive = true;
    } else if (p.type === "slow") {
      state.player.slowT = 10.0;
    } else if (p.type === "mult") {
      state.player.multT = 10.0;
      state.player.multValue = 2;
    } else if (p.type === "colorJump") {
      // Complete one random remaining cube
      var remaining = [];
      for (var i = 0; i < state.cubes.length; i++) if (!isComplete(state.cubes[i], state.level)) remaining.push(state.cubes[i]);
      if (remaining.length > 0) {
        var c = remaining[Math.floor(Math.random() * remaining.length)];
        forceCompleteCube(c);
      }
    }
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var level = opts.level || 1;
    var cubes = buildCubes(level);
    pickScholarCube(cubes);
    state = {
      level: level,
      maxLevel: opts.maxLevel || level,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      cubes: cubes,
      enemies: [],
      discs: [makeDisc("left"), makeDisc("right")],
      discCooldownT: 0,
      enemySpawnTimer: 2.0,
      powerups: [],
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      shieldActive: opts.shieldActive || false,
      bgStars: opts.bgStars || generateStars(),
      // stats
      cubesCompletedTotal: opts.cubesCompletedTotal || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      best: opts.best || readBest(),
      time: 0,
      coilyLured: opts.coilyLured || 0,
      maxChain: opts.maxChain || 0,
      player: makePlayer(),
      endReason: ""
    };
  }

  function generateStars() {
    var stars = [];
    for (var i = 0; i < 60; i++) {
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

  // -- Hop logic -------------------------------------------------------------
  function tryHop(dir) {
    if (phase !== "playing") return;
    if (state.player.dying) return;
    if (state.player.hopT > 0) return;
    if (state.player.onDisc) return;
    var now = performance.now();
    if (now - state.player.lastHopTs < HOP_COOLDOWN_MS) return;
    var hd = HOP_DIRS[dir];
    if (!hd) return;
    var p = state.player;
    var nr = p.row + hd.dr;
    var nc = p.col + hd.dc;
    p.facing = dir;
    p.lastHopTs = now;
    var fromCenter = cubeTopCenter(p.row, p.col);
    fromCenter.y -= 8;
    p.hopFromX = fromCenter.x;
    p.hopFromY = fromCenter.y;
    p.hopFromRow = p.row;
    p.hopFromCol = p.col;
    if (cubeExists(nr, nc)) {
      var toCenter = cubeTopCenter(nr, nc);
      toCenter.y -= 8;
      p.hopToX = toCenter.x;
      p.hopToY = toCenter.y;
      p.hopToRow = nr;
      p.hopToCol = nc;
      p.row = nr;
      p.col = nc;
      p.hopT = 0.0001;
      sfx.hop();
      burstAt(fromCenter.x, fromCenter.y + 14, "#cfa57c", 5);
      if (reducedMotion) {
        p.hopT = 1;
        p.x = toCenter.x;
        p.y = toCenter.y;
        onPlayerLanded();
      }
    } else {
      // Check disc pickup at this direction (down-left from row 0..R-1 col 0; down-right from row 0..R-1 col == row)
      var disc = checkDiscAtHop(p.row, p.col, dir);
      if (disc) {
        // ride disc to apex
        startDiscRide(disc);
        return;
      }
      // off the pyramid → fall
      var fallTarget = computeFallTarget(p.row, p.col, dir);
      p.hopToX = fallTarget.x;
      p.hopToY = fallTarget.y;
      p.hopToRow = -99; p.hopToCol = -99;
      p.hopT = 0.0001;
      p.dyingMode = "fall";
      sfx.hop();
      // Falling — dying once tween ends.
      // Mark intent to die
      p._fallingOff = true;
      if (reducedMotion) {
        p.hopT = 1;
        p.x = fallTarget.x;
        p.y = fallTarget.y;
        die("fall");
      }
    }
  }

  function computeFallTarget(row, col, dir) {
    // Project off-pyramid in the hop direction by ~CUBE_W*1.2 horizontally and CUBE_H*2 down
    var hd = HOP_DIRS[dir];
    var from = cubeTopCenter(row, col);
    from.y -= 8;
    var dx = (hd.dc - hd.dr * 0.5) * CUBE_W * 0.6;  // approximate isometric direction
    if (dir === "up-left")    { dx = -CUBE_W * 0.8; }
    if (dir === "up-right")   { dx =  CUBE_W * 0.8; }
    if (dir === "down-left")  { dx = -CUBE_W * 0.8; }
    if (dir === "down-right") { dx =  CUBE_W * 0.8; }
    var dy = (dir === "up-left" || dir === "up-right") ? -ROW_VSTEP * 0.8 : ROW_VSTEP * 1.4;
    return { x: from.x + dx, y: from.y + dy };
  }

  function checkDiscAtHop(row, col, dir) {
    // Disc grab: hopping outward from the side of the pyramid in the direction of a disc
    // Outer-left edge: col == 0; outward via "down-left" or "up-left"
    // Outer-right edge: col == row; outward via "down-right" or "up-right"
    if (!state.discs || !state.discs.length) return null;
    var leftEdge = (col === 0);
    var rightEdge = (col === row);
    for (var i = 0; i < state.discs.length; i++) {
      var d = state.discs[i];
      if (d.side === "left" && leftEdge && (dir === "down-left" || dir === "up-left")) return d;
      if (d.side === "right" && rightEdge && (dir === "down-right" || dir === "up-right")) return d;
    }
    return null;
  }

  function startDiscRide(disc) {
    var p = state.player;
    p.onDisc = disc;
    p.hopT = 0;
    // Remove this disc from the list
    var idx = state.discs.indexOf(disc);
    if (idx >= 0) state.discs.splice(idx, 1);
    state.discsUsedThisLevel = (state.discsUsedThisLevel || 0) + 1;
    if (state.discsUsedThisLevel >= 2) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("step-pyramid", "step-pyramid-disc-double"); } catch (e) {}
    }
    // Schedule respawn
    state.discCooldownT = DISC_RESPAWN_BASE - state.level;
    sfx.discGrab();
    pushPopup("ESCAPE!", LOGICAL_W / 2, LOGICAL_H / 2 - 60, "is-bonus");
    // Score
    var earned = 100 * state.level;
    state.score += earned;
    pushPopup("+" + earned, p.x, p.y - 20, "is-score");
    // Clear all enemies on the pyramid (mark them as dying)
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.dying) {
        e.dying = true;
        e.dyingT = 0;
      }
    }
    // Disc ride animation: parabolic to apex over 1.0s
    p._discAnim = {
      fromX: p.x, fromY: p.y,
      toX: cubeTopCenter(0, 0).x,
      toY: cubeTopCenter(0, 0).y - 8,
      t: 0,
      duration: reducedMotion ? 0.001 : 1.0
    };
    if (!reducedMotion) {
      try {
        if (window.MrMacsCelebration) {
          window.MrMacsCelebration.burst({ count: 18, palette: ["#5de0f0", "#f5c451"] });
        }
      } catch (e2) {}
    }
  }

  function updateDiscRide(dt) {
    var p = state.player;
    if (!p.onDisc || !p._discAnim) return;
    var a = p._discAnim;
    a.t += dt / a.duration;
    if (a.t >= 1) {
      a.t = 1;
      p.x = a.toX;
      p.y = a.toY;
      p.row = 0;
      p.col = 0;
      p.onDisc = null;
      p._discAnim = null;
      sfx.land();
      onPlayerLanded();
      return;
    }
    // parabolic arc
    var t = a.t;
    var ease = 1 - Math.pow(1 - t, 2);
    p.x = a.fromX + (a.toX - a.fromX) * ease;
    var dy = a.toY - a.fromY;
    p.y = a.fromY + dy * ease - Math.sin(t * Math.PI) * 90;
  }

  function updateHop(dt) {
    var p = state.player;
    if (p.onDisc) { updateDiscRide(dt); return; }
    if (p.hopT <= 0) return;
    var dur = p.hopDuration;
    p.hopT += dt / dur;
    if (p.hopT >= 1) {
      p.hopT = 0;
      p.x = p.hopToX;
      p.y = p.hopToY;
      if (p._fallingOff) {
        p._fallingOff = false;
        die("fall");
        return;
      }
      sfx.land();
      onPlayerLanded();
    } else {
      // ease-out + parabolic arc
      var t = p.hopT;
      var eased = 1 - Math.pow(1 - t, 3);
      var arc = reducedMotion ? 0 : Math.sin(t * Math.PI) * 26;
      p.x = p.hopFromX + (p.hopToX - p.hopFromX) * eased;
      p.y = p.hopFromY + (p.hopToY - p.hopFromY) * eased - arc;
    }
  }

  function onPlayerLanded() {
    var p = state.player;
    if (p.dying) return;
    var cube = findCube(state.cubes, p.row, p.col);
    if (!cube) {
      // Can't happen normally; fail safe
      die("fall");
      return;
    }
    // Powerup pickup if standing on one
    checkPowerupPickup();
    // Check enemy collision (lethal)
    var hit = enemyAtCube(p.row, p.col);
    if (hit && hit.type !== "slick" && !hit.dying && hit.spawnGraceT <= 0) {
      die("squish");
      return;
    }
    // Cycle cube color
    cycleCube(cube);
  }

  function cycleCube(cube) {
    var level = state.level;
    var target = targetStage(level);
    if (cube.scholar && !cube._scholarTriggered && cube.stage < target) {
      cube._scholarTriggered = true;
      sfx.scholarLand();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 22, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      openScholarQuestion(cube);
      return;
    }
    var prev = cube.stage;
    if (reverseAtLevel(level) && cube.stage >= target) {
      // Reverse cycle: completed cube → revert one step
      cube.stage = Math.max(0, cube.stage - 1);
    } else {
      cube.stage = Math.min(target, cube.stage + 1);
    }
    if (cube.stage !== prev) {
      cube.prevStage = prev;
      cube.fadeT = 0.001;
      sfx.colorChange();
      var center = cubeTopCenter(cube.row, cube.col);
      // Score: +25 per change; +50 if newly complete
      var mult = state.player.multValue;
      var pts;
      if (cube.stage >= target && prev < target) {
        pts = 50 * state.level * mult;
        sfx.cubeComplete();
        state.cubesCompletedTotal++;
        // Chain logic
        state.player.chainCount++;
        if (state.player.chainCount >= 10) {
          pushPopup("CHAIN!", LOGICAL_W / 2, 110, "is-tetris");
          state.score += 500 * state.level;
          state.player.chainCount = 0;
        }
        if (state.player.chainCount > state.maxChain) state.maxChain = state.player.chainCount;
        burstAt(center.x, center.y, "#3fc28a", 14);
        maybeDropPowerup();
      } else {
        pts = 25 * state.level * mult;
        burstAt(center.x, center.y - 4, "#f5c451", 6);
      }
      state.score += pts;
      pushPopup("+" + pts, center.x, center.y - 20, "is-score");
      checkBonusLife();
    }
    // Check level clear
    if (cubesRemaining(state.cubes, level) === 0) {
      onLevelClear();
    }
  }

  function forceCompleteCube(cube) {
    var level = state.level;
    var target = targetStage(level);
    if (cube.stage >= target) return;
    cube.prevStage = cube.stage;
    cube.stage = target;
    cube.fadeT = 0.001;
    state.cubesCompletedTotal++;
    sfx.cubeComplete();
    var center = cubeTopCenter(cube.row, cube.col);
    burstAt(center.x, center.y, "#a991ff", 14);
  }

  // -- Enemy AI --------------------------------------------------------------
  function spawnEnemyMaybe(dt) {
    if (state.enemies.length >= ENEMY_CAP) return;
    state.enemySpawnTimer -= dt;
    if (state.enemySpawnTimer > 0) return;
    state.enemySpawnTimer = enemySpawnInterval(state.level);
    // Choose type weighted by level
    var roll = Math.random();
    var type;
    if (state.level >= 3 && roll < 0.45) type = "coily";
    else if (state.level >= 2 && roll < 0.75) type = "wrong";
    else if (state.level >= 2 && roll < 0.92) type = "slick";
    else type = (Math.random() < 0.6 ? "coily" : "slick");
    // For wrong-way bird, spawn at apex but moves diagonally one direction continuously
    var e = makeEnemy(type, state.level);
    if (type === "wrong") {
      // start at top, off-side slightly toward corner
      e.row = 0; e.col = 0;
      var c = cubeTopCenter(0, 0);
      e.x = c.x; e.y = c.y - 32;
    }
    state.enemies.push(e);
    sfx.enemyDrop();
  }

  function updateEnemies(dt) {
    if (state.player.freezeT > 0) {
      // frozen: timer doesn't advance, just sit
      return;
    }
    var slowMul = (state.player.slowT > 0) ? 0.5 : 1.0;
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (e.spawnGraceT > 0) e.spawnGraceT -= dt;
      if (e.dying) {
        e.dyingT += dt * 1.6;
        if (e.dyingT >= 1) state.enemies.splice(i, 1);
        continue;
      }
      if (e.hopT > 0) {
        e.hopT += dt / e.hopDuration;
        if (e.hopT >= 1) {
          e.hopT = 0;
          e.x = e.hopToX;
          e.y = e.hopToY;
          // Check if landed off pyramid → fall
          if (!cubeExists(e.hopToRow, e.hopToCol)) {
            e.falling = true;
          } else {
            e.row = e.hopToRow;
            e.col = e.hopToCol;
            // slick: revert cube
            if (e.type === "slick") {
              var cube = findCube(state.cubes, e.row, e.col);
              if (cube && cube.stage > 0) {
                cube.prevStage = cube.stage;
                cube.stage = 0;
                cube.fadeT = 0.001;
                if (cube === state.cubes[0] || true) {
                  // reset chain on revert
                  state.player.chainCount = 0;
                }
              }
            }
            // collision with player (e.g., land on player's cube)
            checkEnemyPlayerCollision(e);
          }
        } else {
          // ease-out + arc
          var t = e.hopT;
          var eased = 1 - Math.pow(1 - t, 3);
          var arc = reducedMotion ? 0 : Math.sin(t * Math.PI) * 18;
          e.x = e.hopFromX + (e.hopToX - e.hopFromX) * eased;
          e.y = e.hopFromY + (e.hopToY - e.hopFromY) * eased - arc;
        }
      } else if (e.falling) {
        // continue falling off-pyramid (visual + lure detection done already)
        e.x += (e.col === 0 ? -1 : 1) * 100 * dt;
        e.y += 240 * dt;
        if (e.y > LOGICAL_H + 40) {
          // If it was Coily and it fell because of disc-lure (mid-fall), credit "LURED"
          if (e.type === "coily" && e._luredByDisc) {
            // already credited at disc grab; nothing more
          }
          state.enemies.splice(i, 1);
          continue;
        }
      } else {
        e.moveTimer -= dt * slowMul;
        if (e.moveTimer <= 0) {
          decideEnemyMove(e);
          e.moveTimer = e.moveCadence;
        }
      }
    }
  }

  function decideEnemyMove(e) {
    if (e.type === "wrong") {
      // continuously hop in chosen direction
      var hd = HOP_DIRS[e.direction];
      var nr = e.row + hd.dr;
      var nc = e.col + hd.dc;
      startEnemyHop(e, nr, nc);
      return;
    }
    if (e.type === "slick") {
      // hop randomly downward (never off-pyramid intentionally)
      var dirs = ["down-left", "down-right"];
      var picks = dirs.slice();
      // shuffle
      for (var i = picks.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = picks[i]; picks[i] = picks[j]; picks[j] = tmp;
      }
      for (var k = 0; k < picks.length; k++) {
        var hd2 = HOP_DIRS[picks[k]];
        var nr2 = e.row + hd2.dr;
        var nc2 = e.col + hd2.dc;
        if (cubeExists(nr2, nc2)) {
          startEnemyHop(e, nr2, nc2);
          return;
        }
      }
      // no down option — fall off
      var fallDir = picks[0];
      var fhd = HOP_DIRS[fallDir];
      startEnemyHop(e, e.row + fhd.dr, e.col + fhd.dc);
      return;
    }
    // coily: chase player
    var p = state.player;
    var dr = (p.row > e.row) ? +1 : (p.row < e.row ? -1 : 0);
    // Pick a hop direction biased toward the player
    var candidates = [];
    if (dr >= 0) candidates.push("down-left", "down-right");
    if (dr <= 0) candidates.push("up-left", "up-right");
    if (dr === 0) candidates = ["down-left", "down-right", "up-left", "up-right"];
    // Sort by which gets closer to player col
    var best = null, bestScore = 1e9;
    for (var ci = 0; ci < candidates.length; ci++) {
      var hdC = HOP_DIRS[candidates[ci]];
      var ncR = e.row + hdC.dr;
      var ncC = e.col + hdC.dc;
      if (!cubeExists(ncR, ncC)) continue;
      var dist = Math.abs(ncR - p.row) + Math.abs(ncC - p.col);
      if (dist < bestScore) { bestScore = dist; best = candidates[ci]; }
    }
    if (best) {
      var hdF = HOP_DIRS[best];
      startEnemyHop(e, e.row + hdF.dr, e.col + hdF.dc);
    } else {
      // stuck — pick random
      var rdir = candidates[Math.floor(Math.random() * candidates.length)];
      var hdR = HOP_DIRS[rdir];
      startEnemyHop(e, e.row + hdR.dr, e.col + hdR.dc);
    }
  }

  function startEnemyHop(e, nr, nc) {
    var from = cubeTopCenter(e.row, e.col);
    from.y -= 6;
    e.hopFromX = from.x;
    e.hopFromY = from.y;
    e.hopFromRow = e.row;
    e.hopFromCol = e.col;
    e.hopToRow = nr;
    e.hopToCol = nc;
    if (cubeExists(nr, nc)) {
      var to = cubeTopCenter(nr, nc);
      to.y -= 6;
      e.hopToX = to.x;
      e.hopToY = to.y;
    } else {
      // fall off
      var fallDir;
      if (nr - e.row > 0 && nc - e.col > 0) fallDir = "down-right";
      else if (nr - e.row > 0) fallDir = "down-left";
      else if (nc - e.col > 0) fallDir = "up-right";
      else fallDir = "up-left";
      var ft = computeFallTarget(e.row, e.col, fallDir);
      e.hopToX = ft.x;
      e.hopToY = ft.y;
    }
    e.hopT = 0.0001;
  }

  function checkEnemyPlayerCollision(e) {
    var p = state.player;
    if (p.dying) return;
    if (p.row === e.row && p.col === e.col) {
      if (e.type === "slick") {
        // slick is non-lethal; the collision just means it's on us → they revert and move on
        return;
      }
      // shield absorbs
      if (state.player.shieldT > 0 && state.shieldActive) {
        state.player.shieldT = 0;
        state.shieldActive = false;
        e.dying = true; e.dyingT = 0;
        burstAt(p.x, p.y, "#5de0f0", 22);
        pushPopup("SHIELD", p.x, p.y - 30, "is-bonus");
        sfx.enemyDie();
        return;
      }
      die("squish");
    }
  }

  function enemyAtCube(row, col) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.dying) continue;
      if (e.hopT > 0) continue; // mid-hop don't count
      if (e.row === row && e.col === col) return e;
    }
    return null;
  }

  // -- Discs update ----------------------------------------------------------
  function updateDiscs(dt) {
    // bob + rotate; lifetime
    for (var i = state.discs.length - 1; i >= 0; i--) {
      var d = state.discs[i];
      d.bob += dt * 3;
      d.rot += dt * (reducedMotion ? 0 : 2.4);
      d.life -= dt;
      if (d.life <= 0) state.discs.splice(i, 1);
    }
    // respawn cooldown
    if (state.discs.length < DISC_MAX) {
      state.discCooldownT -= dt;
      if (state.discCooldownT <= 0) {
        // pick a side that doesn't have a disc currently
        var hasLeft = false, hasRight = false;
        for (var j = 0; j < state.discs.length; j++) {
          if (state.discs[j].side === "left") hasLeft = true;
          else hasRight = true;
        }
        if (!hasLeft) state.discs.push(makeDisc("left"));
        else if (!hasRight) state.discs.push(makeDisc("right"));
        state.discCooldownT = DISC_RESPAWN_BASE;
      }
    }

    // Detect Coily falling off via disc-edge — already handled in spawn lure; here we
    // give bonus when a coily ends up falling. We'll credit when an enemy is "falling" and
    // first off the side.
    for (var ki = 0; ki < state.enemies.length; ki++) {
      var e = state.enemies[ki];
      if (e.type === "coily" && e.falling && !e._luredCounted) {
        e._luredCounted = true;
        state.coilyLured++;
        try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("step-pyramid", "step-pyramid-lured"); } catch (e2) {}
        sfx.coilyLured();
        var earned = 500 * state.level;
        state.score += earned;
        pushPopup("LURED!", LOGICAL_W / 2, LOGICAL_H / 2, "is-legend");
        pushPopup("+" + earned, LOGICAL_W / 2, LOGICAL_H / 2 + 36, "is-score");
        checkBonusLife();
      }
    }
  }

  // -- Player powerup pickup -------------------------------------------------
  function checkPowerupPickup() {
    var p = state.player;
    if (p.dying) return;
    if (p.hopT > 0) return;
    for (var i = state.powerups.length - 1; i >= 0; i--) {
      var pu = state.powerups[i];
      if (pu.row === p.row && pu.col === p.col) {
        applyPowerup(pu);
        state.powerups.splice(i, 1);
      }
    }
  }

  // -- Bonus life ------------------------------------------------------------
  function checkBonusLife() {
    var threshold = Math.floor(state.score / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    if (threshold > lastBonusLifeThreshold && threshold >= BONUS_LIFE_THRESHOLD) {
      lastBonusLifeThreshold = threshold;
      state.lives++;
      pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 - 80, "is-bonus");
      sfx.cubeComplete();
    }
  }

  // -- Level clear -----------------------------------------------------------
  function onLevelClear() {
    if (phase === "levelClear") return;
    try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("step-pyramid", "step-pyramid-clear"); } catch (e) {}
    sfx.levelClear();
    addShake(6, 0.5);
    var bonus = state.cubes.length * 100 * state.level + state.lives * 1000;
    state.score += bonus;
    pushPopup("PYRAMID CLEARED!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopup("+" + bonus + " bonus", LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    if (state.level >= 5) {
      pushPopup("ARCHIVE LEGEND!", LOGICAL_W / 2, LOGICAL_H / 2 - 70, "is-legend");
    }
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#3fc28a", "#5de0f0", "#a991ff"] });
      }
    } catch (e) {}
    phase = "levelClear";
    saveSnapshot();
    setTimeout(function () {
      var nextLevel = state.level + 1;
      if (nextLevel > MAX_LEVEL) nextLevel = MAX_LEVEL; // cap difficulty curve, keep playing
      var carry = {
        level: nextLevel,
        maxLevel: Math.max(state.maxLevel, nextLevel),
        score: state.score,
        lives: state.lives,
        cubesCompletedTotal: state.cubesCompletedTotal,
        shardsAwarded: state.shardsAwarded,
        coilyLured: state.coilyLured,
        questionsAnsweredCorrect: state.questionsAnsweredCorrect,
        questionsAnsweredTotal: state.questionsAnsweredTotal,
        maxChain: state.maxChain,
        best: state.best,
        bgStars: state.bgStars,
        shieldActive: state.shieldActive
      };
      initState(carry);
      phase = "playing";
    }, 1500);
  }

  // -- Death + respawn -------------------------------------------------------
  function die(mode) {
    var p = state.player;
    if (p.dying) return;
    p.dying = true;
    p.dyingT = 0;
    p.dyingMode = mode || "squish";
    p.chainCount = 0;
    addShake(8, 0.4);
    if (mode === "fall") sfx.fall();
    else sfx.death();
    state.lives--;
    if (state.lives <= 0) {
      phase = "dying";
      setTimeout(function () { gameOver(); }, 900);
    } else {
      phase = "dying";
      setTimeout(function () {
        respawnPlayer();
        phase = "playing";
      }, DEATH_DELAY_MS);
    }
  }

  function respawnPlayer() {
    var prev = {
      shieldT: state.player.shieldT,
      slowT: state.player.slowT,
      multT: state.player.multT,
      multValue: state.player.multValue,
      freezeT: state.player.freezeT
    };
    state.player = makePlayer();
    state.player.shieldT = prev.shieldT;
    state.player.slowT = prev.slowT;
    state.player.multT = prev.multT;
    state.player.multValue = prev.multValue;
    state.player.freezeT = prev.freezeT;
    // remove any enemies sitting on apex
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (e.row === 0 && e.col === 0) state.enemies.splice(i, 1);
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

  // -- Powerup tick ----------------------------------------------------------
  function updatePowerups(dt) {
    for (var i = state.powerups.length - 1; i >= 0; i--) {
      var p = state.powerups[i];
      p.life -= dt;
      p.bob += dt * 3;
      p.orbit += dt * 1.4;
      if (p.life <= 0) state.powerups.splice(i, 1);
    }
    // player timers
    var pl = state.player;
    if (pl.freezeT > 0) { pl.freezeT -= dt; if (pl.freezeT < 0) pl.freezeT = 0; }
    if (pl.slowT > 0) { pl.slowT -= dt; if (pl.slowT < 0) pl.slowT = 0; }
    if (pl.multT > 0) { pl.multT -= dt; if (pl.multT <= 0) { pl.multT = 0; pl.multValue = 1; } }
    // cube fade transitions
    for (var ci = 0; ci < state.cubes.length; ci++) {
      var c = state.cubes[ci];
      if (c.fadeT > 0) {
        c.fadeT += dt / 0.20;
        if (c.fadeT >= 1) { c.fadeT = 0; c.prevStage = c.stage; }
      }
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
    drawPyramidShadow();
    drawCubes();
    drawDiscs();
    drawPowerups();
    drawEnemies(false);   // non-falling first
    drawPlayer();
    drawEnemies(true);    // falling enemies on top
    drawParticles();

    ctx.restore();
  }

  function drawBackground() {
    // Letterbox void
    ctx.fillStyle = "#04060f";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    // Soft glow behind pyramid
    var pyramidCenterX = LOGICAL_W / 2;
    var pyramidCenterY = PYRAMID_TOP_Y + (PYRAMID_ROWS / 2) * ROW_VSTEP;
    var glow = ctx.createRadialGradient(pyramidCenterX, pyramidCenterY, 40, pyramidCenterX, pyramidCenterY, 380);
    glow.addColorStop(0, "rgba(63,194,138,0.10)");
    glow.addColorStop(0.5, "rgba(20,40,80,0.10)");
    glow.addColorStop(1, "rgba(4,6,15,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Stars
    if (state.bgStars) {
      for (var i = 0; i < state.bgStars.length; i++) {
        var s = state.bgStars[i];
        var tw = reducedMotion ? 1 : (0.5 + 0.5 * Math.abs(Math.sin(state.time * s.twinkleSpeed + s.twinkle)));
        ctx.fillStyle = "rgba(255,255,255," + (0.18 * tw) + ")";
        ctx.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
      }
    }
    // bottom band — sand horizon line
    var horizon = PYRAMID_TOP_Y + PYRAMID_ROWS * ROW_VSTEP + 60;
    var hg = ctx.createLinearGradient(0, horizon - 10, 0, LOGICAL_H);
    hg.addColorStop(0, "rgba(40,28,18,0)");
    hg.addColorStop(1, "rgba(60,40,20,0.3)");
    ctx.fillStyle = hg;
    ctx.fillRect(0, horizon - 10, LOGICAL_W, LOGICAL_H - horizon + 10);
  }

  function drawPyramidShadow() {
    // big soft shadow under the pyramid (elliptical)
    var cx = LOGICAL_W / 2;
    var cy = PYRAMID_TOP_Y + PYRAMID_ROWS * ROW_VSTEP + 50;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, COL_HSTEP * (PYRAMID_ROWS - 1) * 0.6, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCubes() {
    // Render bottom row first so stacking looks right (lower row in front)
    // But also we want the visible faces to layer correctly. Q*bert classic
    // renders top-down. Let's render top-down (row 0 first → row 6 last) so
    // lower rows visually sit in front (their cubes are taller and overlap).
    for (var r = 0; r < PYRAMID_ROWS; r++) {
      for (var c = 0; c <= r; c++) {
        var cube = findCube(state.cubes, r, c);
        drawCube(cube);
      }
    }
    // Scholar shimmer overlay (so it pulses on top)
    for (var r2 = 0; r2 < PYRAMID_ROWS; r2++) {
      for (var c2 = 0; c2 <= r2; c2++) {
        var cube2 = findCube(state.cubes, r2, c2);
        if (cube2.scholar && !isComplete(cube2, state.level) && !cube2._scholarTriggered) {
          drawScholarOverlay(cube2);
        }
      }
    }
  }

  function drawCube(cube) {
    var center = cubeTopCenter(cube.row, cube.col);
    var cx = center.x, cy = center.y;
    var halfW = CUBE_W / 2, halfH = CUBE_H / 2;
    // Determine current palette (with cross-fade if fadeT in progress)
    var stage = cube.stage;
    var palette = STAGE_PALETTE[Math.min(stage, STAGE_PALETTE.length - 1)];
    if (cube.fadeT > 0 && cube.prevStage !== cube.stage) {
      // we'll cross-fade by drawing prev palette underneath then top with alpha
      var prevPalette = STAGE_PALETTE[Math.min(cube.prevStage, STAGE_PALETTE.length - 1)];
      drawCubeWithPalette(cube, prevPalette, 1);
      drawCubeWithPalette(cube, palette, Math.min(1, cube.fadeT));
      return;
    }
    drawCubeWithPalette(cube, palette, 1);
  }

  function drawCubeWithPalette(cube, palette, alpha) {
    var center = cubeTopCenter(cube.row, cube.col);
    var cx = center.x, cy = center.y;
    var halfW = CUBE_W / 2, halfH = CUBE_H / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    // LEFT FACE: parallelogram from (cx-halfW, cy) -> (cx, cy+halfH) -> (cx, cy+halfH+CUBE_SIDE_H) -> (cx-halfW, cy+CUBE_SIDE_H)
    ctx.fillStyle = palette.left;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, cy);
    ctx.lineTo(cx,           cy + halfH);
    ctx.lineTo(cx,           cy + halfH + CUBE_SIDE_H);
    ctx.lineTo(cx - halfW,   cy + CUBE_SIDE_H);
    ctx.closePath();
    ctx.fill();
    // left-face vertical highlight stripe near top edge
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(cx - halfW + 2, cy + 2, 2, CUBE_SIDE_H - 6);

    // RIGHT FACE: from (cx, cy+halfH) -> (cx+halfW, cy) -> (cx+halfW, cy+CUBE_SIDE_H) -> (cx, cy+halfH+CUBE_SIDE_H)
    ctx.fillStyle = palette.right;
    ctx.beginPath();
    ctx.moveTo(cx,            cy + halfH);
    ctx.lineTo(cx + halfW,    cy);
    ctx.lineTo(cx + halfW,    cy + CUBE_SIDE_H);
    ctx.lineTo(cx,            cy + halfH + CUBE_SIDE_H);
    ctx.closePath();
    ctx.fill();
    // right edge shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(cx + halfW - 2, cy + 2, 2, CUBE_SIDE_H - 6);

    // TOP FACE (parallelogram diamond): (cx-halfW, cy) -> (cx, cy-halfH) -> (cx+halfW, cy) -> (cx, cy+halfH)
    var topGrad = ctx.createLinearGradient(cx - halfW, cy - halfH, cx + halfW, cy + halfH);
    topGrad.addColorStop(0, palette.topLight);
    topGrad.addColorStop(0.5, palette.topMid);
    topGrad.addColorStop(1, palette.topDark);
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, cy);
    ctx.lineTo(cx,         cy - halfH);
    ctx.lineTo(cx + halfW, cy);
    ctx.lineTo(cx,         cy + halfH);
    ctx.closePath();
    ctx.fill();

    // Top face edges
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, cy);
    ctx.lineTo(cx,         cy - halfH);
    ctx.lineTo(cx + halfW, cy);
    ctx.stroke();
    // Bottom edges of cube (where left/right faces meet ground)
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(cx - halfW, cy + CUBE_SIDE_H);
    ctx.lineTo(cx,         cy + halfH + CUBE_SIDE_H);
    ctx.lineTo(cx + halfW, cy + CUBE_SIDE_H);
    ctx.stroke();
    // Vertical center seam (where left/right meet)
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.moveTo(cx, cy + halfH);
    ctx.lineTo(cx, cy + halfH + CUBE_SIDE_H);
    ctx.stroke();
    ctx.restore();
  }

  function drawScholarOverlay(cube) {
    var center = cubeTopCenter(cube.row, cube.col);
    var cx = center.x, cy = center.y;
    var halfW = CUBE_W / 2, halfH = CUBE_H / 2;
    // Gold rim around top diamond
    ctx.save();
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 2.5;
    if (!reducedMotion) {
      ctx.shadowColor = "#f5c451";
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.moveTo(cx - halfW, cy);
    ctx.lineTo(cx,         cy - halfH);
    ctx.lineTo(cx + halfW, cy);
    ctx.lineTo(cx,         cy + halfH);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // rotating multi-color question mark
    var rotation = reducedMotion ? 0 : (state.time * 1.6);
    ctx.save();
    ctx.translate(cx, cy + 2);
    ctx.rotate(rotation);
    var colors = ["#f5c451", "#5de0f0", "#a991ff", "#f07bb8"];
    for (var i = 0; i < colors.length; i++) {
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, -3, 6, Math.PI * 0.85 + i * 0.4, Math.PI * 2.0 + i * 0.4);
      ctx.stroke();
    }
    ctx.fillStyle = "#f0f5ff";
    ctx.font = "bold 16px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 1);
    ctx.restore();
  }

  function drawDiscs() {
    for (var i = 0; i < state.discs.length; i++) {
      var d = state.discs[i];
      var bob = reducedMotion ? 0 : Math.sin(d.bob) * 4;
      drawDisc(d.x, d.y + bob, d.rot);
    }
  }
  function drawDisc(x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    // outer glow
    if (!reducedMotion) {
      var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      glow.addColorStop(0, "rgba(245,196,81,0.5)");
      glow.addColorStop(1, "rgba(245,196,81,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
    }
    // outer ring (gold)
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    // inner ring (cyan)
    ctx.strokeStyle = "#5de0f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // center dot
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPowerups() {
    for (var i = 0; i < state.powerups.length; i++) {
      var p = state.powerups[i];
      var center = cubeTopCenter(p.row, p.col);
      var bob = reducedMotion ? 0 : Math.sin(p.bob) * 3;
      var meta = POWERUP_META[p.type];
      var ox = reducedMotion ? 0 : Math.cos(p.orbit) * 14;
      var oy = reducedMotion ? 0 : Math.sin(p.orbit) * 4;
      var px = center.x + ox;
      var py = center.y - 22 + bob + oy;
      // halo
      if (!reducedMotion) {
        var rad = 20;
        var glow = ctx.createRadialGradient(px, py, 0, px, py, rad);
        glow.addColorStop(0, hexA(meta.glow, 0.5));
        glow.addColorStop(1, hexA(meta.glow, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // disc
      ctx.fillStyle = "rgba(4,8,18,0.85)";
      ctx.beginPath();
      ctx.arc(px, py, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = meta.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 13, 0, Math.PI * 2);
      ctx.stroke();
      // glyph
      ctx.fillStyle = meta.color;
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, px, py + 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    var p = state.player;
    if (p.dying) {
      drawDyingPlayer(p);
      return;
    }
    // small character with face
    drawExplorer(p.x, p.y, p.facing, state.shieldActive || (p.shieldT > 0 && state.shieldActive));
    // mult halo
    if (p.multT > 0 && !reducedMotion) {
      var radM = 28;
      var glowM = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, radM);
      glowM.addColorStop(0, "rgba(255,200,80,0.25)");
      glowM.addColorStop(1, "rgba(255,200,80,0)");
      ctx.fillStyle = glowM;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radM, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.slowT > 0 && !reducedMotion) {
      ctx.strokeStyle = "rgba(168,232,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.freezeT > 0 && !reducedMotion) {
      // ice ring
      ctx.strokeStyle = "rgba(168,232,255,0.7)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 4, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawExplorer(cx, cy, facing, shielded) {
    ctx.save();
    ctx.translate(cx, cy);
    // shadow on cube
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.fillStyle = "#4a3a26";
    ctx.fillRect(-6, 4, 4, 8);
    ctx.fillRect(2, 4, 4, 8);
    // boots
    ctx.fillStyle = "#1a1208";
    ctx.fillRect(-6, 10, 5, 3);
    ctx.fillRect(1, 10, 5, 3);
    // body (jacket)
    ctx.fillStyle = "#a05030";
    ctx.beginPath();
    ctx.ellipse(0, -2, 9, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // body highlight
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.ellipse(-3, -4, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // arms (sides)
    ctx.fillStyle = "#a05030";
    ctx.fillRect(-10, -4, 3, 7);
    ctx.fillRect(7, -4, 3, 7);
    // head (skin)
    ctx.fillStyle = "#e8c098";
    ctx.beginPath();
    ctx.arc(0, -13, 6, 0, Math.PI * 2);
    ctx.fill();
    // hat (explorer pith helmet, tan)
    ctx.fillStyle = "#c8a062";
    ctx.beginPath();
    ctx.arc(0, -17, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-7, -17, 14, 3);
    // brim shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(-7, -14, 14, 1.5);
    // face — eyes based on facing
    ctx.fillStyle = "#1a1208";
    var eyeOffX = 0, eyeOffY = 0;
    if (facing === "down-left")  { eyeOffX = -1; eyeOffY = 1; }
    if (facing === "down-right") { eyeOffX =  1; eyeOffY = 1; }
    if (facing === "up-left")    { eyeOffX = -1; eyeOffY = -1; }
    if (facing === "up-right")   { eyeOffX =  1; eyeOffY = -1; }
    ctx.beginPath();
    ctx.arc(-2 + eyeOffX, -13 + eyeOffY, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2 + eyeOffX, -13 + eyeOffY, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // small smile
    ctx.strokeStyle = "rgba(40,20,10,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -11, 1.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
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
      ctx.arc(0, -2, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDyingPlayer(p) {
    var t = p.dyingT;
    if (p.dyingMode === "fall") {
      // falling off-pyramid: descend with rotation
      ctx.save();
      ctx.translate(p.x, p.y + t * 80);
      ctx.rotate(t * 4);
      ctx.globalAlpha = Math.max(0, 1 - t * 0.6);
      drawExplorer(0, 0, p.facing, false);
      ctx.restore();
    } else {
      // squish: flatten + descend
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(Math.min(1.6, 1 + t * 0.9), Math.max(0.15, 1 - t * 1.1));
      ctx.globalAlpha = Math.max(0, 1 - t * 0.4);
      drawExplorer(0, 0, p.facing, false);
      ctx.restore();
    }
  }

  function drawEnemies(fallingOnly) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (fallingOnly !== !!e.falling) continue;
      drawEnemy(e);
    }
  }
  function drawEnemy(e) {
    var x = e.x, y = e.y;
    if (e.dying) {
      // pop fade
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = Math.max(0, 1 - e.dyingT);
      ctx.scale(1 + e.dyingT * 0.6, 1 + e.dyingT * 0.6);
      drawEnemyBody(e, 0, 0);
      ctx.restore();
      return;
    }
    drawEnemyBody(e, x, y);
  }
  function drawEnemyBody(e, x, y) {
    if (e.type === "coily") drawCoily(x, y);
    else if (e.type === "slick") drawSlick(x, y);
    else drawWrong(x, y, e.direction);
  }

  function drawCoily(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // body coils (3 stacked, decreasing size)
    var purple = "#a23dd6";
    var purpleHi = "#d27df0";
    var purpleLo = "#5e1d80";
    for (var i = 2; i >= 0; i--) {
      var py = 4 - i * 5;
      var rad = 10 - i * 2;
      var grad = ctx.createRadialGradient(-rad * 0.4, py - rad * 0.4, 1, 0, py, rad);
      grad.addColorStop(0, purpleHi);
      grad.addColorStop(0.6, purple);
      grad.addColorStop(1, purpleLo);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, py, rad, rad * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // head
    ctx.fillStyle = purple;
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();
    // tongue
    ctx.fillStyle = "#d04848";
    ctx.fillRect(-1, -6, 2, 4);
    // eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-2.5, -11, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.5, -11, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0a20";
    ctx.beginPath();
    ctx.arc(-2.5, -11, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.5, -11, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSlick(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // pink blob body
    var grad = ctx.createRadialGradient(-3, -4, 1, 0, 0, 11);
    grad.addColorStop(0, "#ffd7e8");
    grad.addColorStop(0.6, "#f07bb8");
    grad.addColorStop(1, "#a14080");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // little drip
    ctx.beginPath();
    ctx.arc(-7, 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // top hat (signature Sam style)
    ctx.fillStyle = "#1a1208";
    ctx.fillRect(-5, -10, 10, 4);
    ctx.fillRect(-7, -7, 14, 1.5);
    // eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0a20";
    ctx.beginPath();
    ctx.arc(-3, -2, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -2, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawWrong(cx, cy, dir) {
    ctx.save();
    ctx.translate(cx, cy);
    // direction flip
    var flip = (dir === "down-left" || dir === "up-left") ? -1 : 1;
    ctx.scale(flip, 1);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // body (white bird)
    ctx.fillStyle = "#f0f5ff";
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // head
    ctx.fillStyle = "#e0e6f0";
    ctx.beginPath();
    ctx.arc(7, -3, 5, 0, Math.PI * 2);
    ctx.fill();
    // wing
    var wflap = reducedMotion ? 0 : Math.sin(state.time * 14) * 3;
    ctx.fillStyle = "#c8d0e0";
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(-10, -5 + wflap);
    ctx.lineTo(-3, 4);
    ctx.closePath();
    ctx.fill();
    // beak
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.moveTo(11, -3);
    ctx.lineTo(15, -2);
    ctx.lineTo(11, -1);
    ctx.closePath();
    ctx.fill();
    // eye
    ctx.fillStyle = "#1a1208";
    ctx.beginPath();
    ctx.arc(8, -4, 1, 0, Math.PI * 2);
    ctx.fill();
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
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudLevel) dom.hudLevel.textContent = String(state.level);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.hudCubes) {
      var rem = cubesRemaining(state.cubes, state.level);
      dom.hudCubes.textContent = String(rem);
      var cell = dom.hudCubes.parentElement;
      if (cell) {
        cell.classList.toggle("is-warning", rem <= 5 && rem > 0);
      }
    }
    if (dom.goalName) {
      var done = cubesCompleted(state.cubes, state.level);
      dom.goalName.textContent = done + "/" + state.cubes.length + " stones verified";
    }
    if (dom.goalMeta) {
      var bits = [];
      if (state.player.freezeT > 0) bits.push("Freeze " + state.player.freezeT.toFixed(1) + "s");
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
  var pendingScholarCube = null;

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

  function openScholarQuestion(cube) {
    activeQuestion = pickQuestion();
    pendingScholarCube = cube;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Cube · Optional · +1000 + 3 stones";
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
      dom.explanation.textContent = "Decoded! +1000 plus three random stones complete instantly.";
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
    var cube = pendingScholarCube;
    if (cube) {
      // Always complete the scholar cube
      forceCompleteCube(cube);
    }
    if (wasCorrect) {
      state.score += 1000;
      addShards(20, GAME_ID + "-scholar-correct");
      sfx.correct();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+1000 SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
      // Auto-complete 3 random remaining cubes
      for (var n = 0; n < 3; n++) {
        var pool = [];
        for (var i = 0; i < state.cubes.length; i++) if (!isComplete(state.cubes[i], state.level)) pool.push(state.cubes[i]);
        if (!pool.length) break;
        forceCompleteCube(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    activeQuestion = null;
    pendingScholarCube = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    if (cubesRemaining(state.cubes, state.level) === 0) {
      onLevelClear();
    }
    updateHud();
  }

  function skipQuestion() {
    var cube = pendingScholarCube;
    if (cube) {
      // No penalty: still completes the cube
      forceCompleteCube(cube);
    }
    activeQuestion = null;
    pendingScholarCube = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    if (cubesRemaining(state.cubes, state.level) === 0) {
      onLevelClear();
    }
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
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Pyramid Defeated You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Step Pyramid · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Levels Cleared</div><div class="end-cell-value">' + Math.max(0, state.level - 1) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Stones Verified</div><div class="end-cell-value">' + formatNumber(state.cubesCompletedTotal) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Coilys Lured</div><div class="end-cell-value">' + state.coilyLured + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { level: state.maxLevel, cubes: state.cubesCompletedTotal });
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
          cubes: state.cubesCompletedTotal,
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
          file: "games/step-pyramid/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("step-pyramid:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("step-pyramid:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("empire-strategic", { volume: 0.5 });
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
        // WASD / E for diagonals — Q*bert convention:
        // W = up-left, E = up-right, A = down-left, D = down-right
        if (k === "w" || k === "W") { tryHop("up-left"); e.preventDefault(); return; }
        if (k === "e" || k === "E") { tryHop("up-right"); e.preventDefault(); return; }
        if (k === "a" || k === "A") { tryHop("down-left"); e.preventDefault(); return; }
        if (k === "d" || k === "D") { tryHop("down-right"); e.preventDefault(); return; }
        // Arrow keys: ↑ = up-right, ← = up-left, ↓ = down-left, → = down-right
        if (k === "ArrowUp")    { tryHop("up-right"); e.preventDefault(); return; }
        if (k === "ArrowLeft")  { tryHop("up-left"); e.preventDefault(); return; }
        if (k === "ArrowDown")  { tryHop("down-left"); e.preventDefault(); return; }
        if (k === "ArrowRight") { tryHop("down-right"); e.preventDefault(); return; }
        // Q on keypad row works as up-left fallback for non-QWERTY users
        if (k === "q" || k === "Q") { tryHop("up-left"); e.preventDefault(); return; }
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
        // tap → guess based on tap position relative to player
        try {
          var rect = canvas.getBoundingClientRect();
          var tx = (t.clientX - rect.left - offsetX) / scale;
          var ty = (t.clientY - rect.top - offsetY) / scale;
          var pCenter = cubeTopCenter(state.player.row, state.player.col);
          var px = pCenter.x, py = pCenter.y;
          var ddx = tx - px, ddy = ty - py;
          var dir;
          if (ddy < 0) dir = (ddx < 0) ? "up-left" : "up-right";
          else dir = (ddx < 0) ? "down-left" : "down-right";
          tryHop(dir);
        } catch (er) {
          tryHop("down-right");
        }
      } else {
        // swipe — map quadrant directly
        var dir2;
        if (dy < 0) dir2 = (dx < 0) ? "up-left" : "up-right";
        else dir2 = (dx < 0) ? "down-left" : "down-right";
        tryHop(dir2);
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
    pressBtn(dom.tcUL, "up-left");
    pressBtn(dom.tcUR, "up-right");
    pressBtn(dom.tcDL, "down-left");
    pressBtn(dom.tcDR, "down-right");
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

  function newRun() {
    lastBonusLifeThreshold = 0;
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    lastBonusLifeThreshold = Math.floor((s.score || 0) / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    initState({
      score: s.score || 0,
      level: s.level || 1,
      cubesCompletedTotal: s.cubes || 0,
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
    if (snap && snap.state && (snap.state.score || snap.state.cubes) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Level ' + (snap.state.level || 1) +
        ' &middot; Stones ' + (snap.state.cubes || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Step Pyramid Scores</div>';
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
      updateHop(dt);
      updateEnemies(dt);
      spawnEnemyMaybe(dt);
      updateDiscs(dt);
      updatePowerups(dt);
      // Check enemy ↔ player collision when standing on same cube (for moving enemies that slid into us)
      if (state.player.hopT === 0 && !state.player.dying && !state.player.onDisc) {
        for (var i = 0; i < state.enemies.length; i++) {
          var e = state.enemies[i];
          if (e.dying) continue;
          if (e.hopT > 0) continue;
          if (e.row === state.player.row && e.col === state.player.col) {
            if (e.type !== "slick" && e.spawnGraceT <= 0) {
              if (state.player.shieldT > 0 && state.shieldActive) {
                state.player.shieldT = 0;
                state.shieldActive = false;
                e.dying = true; e.dyingT = 0;
                burstAt(state.player.x, state.player.y, "#5de0f0", 22);
                pushPopup("SHIELD", state.player.x, state.player.y - 30, "is-bonus");
                sfx.enemyDie();
              } else {
                die("squish");
              }
            }
            break;
          }
        }
      }
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
    if (phase === "playing" || phase === "dying" || phase === "levelClear" || phase === "paused") {
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
