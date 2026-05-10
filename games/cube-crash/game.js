/* ===========================================================================
   Cube Crash — sliding 5x5 cube puzzle · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · 6 disciplines · 5 power-ups · scholar
   Rotate rows + columns to align colored crests, chain cascade clears,
   decode scholar tiles for bonus shards.
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "cube-crash";
  var GAME_TITLE = "Cube Crash";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  // Grid
  var GRID_N = 5;                       // 5x5
  var TILE = 96;                        // 96 px tile
  var GAP = 8;                          // gap between tiles
  var BOARD_W = GRID_N * TILE + (GRID_N + 1) * GAP;     // ~528
  var BOARD_X = (LOGICAL_W - BOARD_W) / 2;              // centered
  var BOARD_Y = 110;                                    // below ribbon
  var ARROW_SIZE = 44;                  // hit-area for row/column arrows (≥44 for mobile tap targets)

  // Round / pacing
  var ROUND_BASE_GOAL = 25;             // tiles to clear in round 1
  var ROUND_GOAL_STEP = 5;              // +5 per round
  var ROUND_BASE_TIME = 60.0;           // seconds round 1
  var ROUND_TIME_STEP = 3.0;            // -3s per round (floor 30)
  var ROUND_TIME_FLOOR = 30.0;
  var STARTING_LIVES = 3;
  var SCHOLAR_PER_ROUND = 5;            // ~5 scholar tiles per round
  var TIME_LOW_THRESHOLD = 10.0;        // last 10s = warning

  // Scoring
  var SCORE_PER_TILE = 50;
  var SCORE_DIAGONAL_BONUS = 25;        // per tile, when from diagonal line
  var SCHOLAR_BONUS = 1500;
  var SCHOLAR_SHARDS = 12;
  var SHARDS_CAP = 200;
  var ADD_TIME_SECONDS = 20.0;

  // Combo
  var COMBO_MAX_DISPLAY = 8;
  var POWERUP_DROP_COMBO = 3;           // combo×3+ drops a powerup
  var MULTIPLIER_DURATION_CLEARS = 5;   // 2x mult for next 5 clears

  // Tile color palette: 6 disciplines (corresponding to crests).
  var COLORS = [
    { id: "scroll",   main: "#d04848", outline: "#7a2424", glyph: "scroll",  pitch: 392, label: "SCROLL" },
    { id: "atom",     main: "#5de0f0", outline: "#1f7a8a", glyph: "atom",    pitch: 523, label: "ATOM" },
    { id: "compass",  main: "#f5c451", outline: "#bd8a1a", glyph: "compass", pitch: 587, label: "COMPASS" },
    { id: "palette",  main: "#a991ff", outline: "#5a40a0", glyph: "palette", pitch: 659, label: "PALETTE" },
    { id: "quill",    main: "#52e8a0", outline: "#2c6b48", glyph: "quill",   pitch: 740, label: "QUILL" },
    { id: "globe",    main: "#6a8fff", outline: "#2a4a9a", glyph: "globe",   pitch: 880, label: "GLOBE" }
  ];

  var POWERUPS = ["hammer", "reshuffle", "multiplier", "colorbomb", "addtime"];
  var POWERUP_LABELS = {
    hammer:     { glyph: "🔨", label: "HAMMER",   sub: "Smash one tile" },
    reshuffle:  { glyph: "🔄", label: "RESHUFFLE", sub: "New random board" },
    multiplier: { glyph: "⭐", label: "2X MULT",  sub: "Next 5 clears" },
    colorbomb:  { glyph: "🎯", label: "COLOR BOMB", sub: "Clear all of a color" },
    addtime:    { glyph: "⏱", label: "+20s",     sub: "Add 20 seconds" }
  };

  // -- Inline review bank — 28 entries ---------------------------------------
  var INLINE_BANK = [
    { prompt: "The Renaissance began primarily in:", choices: ["Italy", "France", "England", "Germany"], correctText: "Italy" },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg" },
    { prompt: "The Protestant Reformation was started by:", choices: ["Martin Luther", "John Calvin", "Henry VIII", "Pope Leo X"], correctText: "Martin Luther" },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, and diseases between hemispheres", "A 1492 trade treaty", "The slave trade alone", "Tax policy in colonies"], correctText: "Transfer of plants, animals, and diseases between hemispheres" },
    { prompt: "Which technology most enabled European long-distance voyages?", choices: ["The astrolabe and caravel", "The compound microscope", "The cotton gin", "The seed drill"], correctText: "The astrolabe and caravel" },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain" },
    { prompt: "Which invention powered early factories?", choices: ["The steam engine", "The electric motor", "The internal combustion engine", "The assembly line"], correctText: "The steam engine" },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "German unification", "Russian Revolution"], correctText: "Assassination of Archduke Franz Ferdinand" },
    { prompt: "Trench warfare on the Western Front was characterized by:", choices: ["Stalemate and high casualties", "Rapid cavalry advances", "Aerial bombing of cities", "Naval blockade only"], correctText: "Stalemate and high casualties" },
    { prompt: "The Treaty of Versailles (1919) blamed the war primarily on:", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany" },
    { prompt: "The Cold War was a struggle primarily between:", choices: ["United States and Soviet Union", "U.S. and China", "Britain and France", "Germany and Russia"], correctText: "United States and Soviet Union" },
    { prompt: "The Marshall Plan (1948) provided:", choices: ["Economic aid to rebuild Western Europe", "Military aid to South Korea", "Nuclear technology to NATO allies", "Loans to Latin America"], correctText: "Economic aid to rebuild Western Europe" },
    { prompt: "The doctrine of containment aimed to:", choices: ["Stop the spread of communism", "Roll back Soviet borders", "Promote free trade in Asia", "End nuclear weapons"], correctText: "Stop the spread of communism" },
    { prompt: "The Cuban Missile Crisis (1962) ended when:", choices: ["The Soviet Union withdrew missiles from Cuba", "Cuba renounced communism", "The U.S. invaded Cuba", "Khrushchev was removed from power"], correctText: "The Soviet Union withdrew missiles from Cuba" },
    { prompt: "Brown v. Board of Education (1954) ruled:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional" },
    { prompt: "The Montgomery Bus Boycott was sparked by:", choices: ["Rosa Parks' arrest", "The March on Washington", "The Voting Rights Act", "Plessy v. Ferguson"], correctText: "Rosa Parks' arrest" },
    { prompt: "The Civil Rights Act of 1964 banned discrimination based on:", choices: ["Race, color, religion, sex, or national origin", "Income alone", "Voter registration alone", "Marital status only"], correctText: "Race, color, religion, sex, or national origin" },
    { prompt: "Sputnik (1957) triggered:", choices: ["The U.S. space race and NASA's founding", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The U.S. space race and NASA's founding" },
    { prompt: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Declaration of Independence", "Constitution", "Bill of Rights", "Federalist No. 10"], correctText: "Declaration of Independence" },
    { prompt: "Checks and balances divides power among:", choices: ["Three branches of government", "Federal and state", "Senate and House", "Citizens and government"], correctText: "Three branches of government" },
    { prompt: "The 13th Amendment (1865):", choices: ["Abolished slavery", "Granted voting rights to women", "Created income tax", "Lowered voting age"], correctText: "Abolished slavery" },
    { prompt: "The 19th Amendment (1920):", choices: ["Granted women the right to vote", "Repealed Prohibition", "Lowered the voting age", "Established direct election of senators"], correctText: "Granted women the right to vote" },
    { prompt: "The New Deal (1930s) was a response to:", choices: ["The Great Depression", "World War I", "The Dust Bowl alone", "The Cold War"], correctText: "The Great Depression" },
    { prompt: "Pearl Harbor (Dec 7, 1941) led directly to:", choices: ["U.S. entry into World War II", "The end of WWII", "The Marshall Plan", "Founding of the UN"], correctText: "U.S. entry into World War II" },
    { prompt: "The Magna Carta (1215) is significant because it:", choices: ["Limited the power of the English king", "Established Parliament", "Ended the Hundred Years' War", "Created common law"], correctText: "Limited the power of the English king" },
    { prompt: "Which best describes a primary source?", choices: ["A first-hand record from the time period studied", "A textbook chapter", "A modern documentary", "An encyclopedia entry"], correctText: "A first-hand record from the time period studied" },
    { prompt: "The Berlin Wall fell in:", choices: ["1989", "1991", "1985", "1979"], correctText: "1989" },
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations", "NATO", "The League of Nations", "The European Union"], correctText: "The United Nations" }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | round
  var prevPhase = null;
  var lastFrame = 0;
  var rafHandle = null;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var armedPowerup = null;     // string id when player has armed a targetable powerup

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
    rowShift:    function () { sfxTone(440, 0.060, { type: "triangle", volume: 0.10, endFreq: 360 }); },
    colShift:    function () { sfxTone(520, 0.060, { type: "triangle", volume: 0.10, endFreq: 420 }); },
    lineClear:   function (cIdx) {
      var c = COLORS[cIdx] || COLORS[0];
      sfxTone(c.pitch, 0.13, { type: "triangle", volume: 0.16, endFreq: c.pitch * 1.5 });
    },
    cascade: function (n) {
      var notes = [392, 494, 587, 659, 784, 988, 1175, 1397, 1568];
      var k = Math.min(notes.length, Math.max(2, n));
      for (var i = 0; i < k; i++) {
        (function (idx) {
          setTimeout(function () { sfxTone(notes[idx], 0.10, { type: "triangle", volume: 0.13 }); }, idx * 55);
        })(i);
      }
    },
    scholarClear:   function () {
      [659, 988, 1397].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 80);
      });
    },
    scholarCorrect: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholarWrong: function () {
      sfxTone(220, 0.32, { type: "sawtooth", volume: 0.18, endFreq: 110 });
    },
    roundClear: function () {
      [523, 659, 784, 988, 1318].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 95);
      });
    },
    lifeLost: function () {
      sfxNoise(0.26, { volume: 0.20, cutoff: 480 });
      sfxTone(280, 0.32, { type: "sawtooth", volume: 0.18, endFreq: 120 });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    timeLow: function () {
      sfxTone(880, 0.10, { type: "square", volume: 0.10 });
    },
    powerupPickup: function () {
      sfxTone(784, 0.10, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(1175, 0.14, { type: "triangle", volume: 0.14 }); }, 70);
    },
    powerupUse: function () {
      [988, 1318, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 50);
      });
    },
    comboMilestone: function (n) {
      var base = 660;
      for (var i = 0; i < Math.min(4, n); i++) {
        (function (idx) {
          setTimeout(function () {
            sfxTone(base * Math.pow(1.122, idx), 0.10, { type: "triangle", volume: 0.16 });
          }, idx * 60);
        })(i);
      }
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("cubeCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudCleared = $("hudCleared");
    dom.hudCombo = $("hudCombo");
    dom.hudLives = $("hudLives");
    dom.hudBest = $("hudBest");
    dom.roundName = $("roundName");
    dom.roundMeta = $("roundMeta");
    dom.waveRibbon = $("waveRibbon");
    dom.popupOverlay = $("popupOverlay");
    dom.setupScreen = $("setupScreen");
    dom.questionScreen = $("questionScreen");
    dom.pauseScreen = $("pauseScreen");
    dom.endScreen = $("endScreen");
    dom.roundScreen = $("roundScreen");
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
    dom.roundKicker = $("roundKicker");
    dom.roundTitle = $("roundTitle");
    dom.roundGrid = $("roundGrid");
    dom.roundHint = $("roundHint");
    dom.roundNextBtn = $("roundNextBtn");
    dom.powerupTray = $("powerupTray");
    dom.puCount = {
      hammer: $("puCountHammer"),
      reshuffle: $("puCountReshuffle"),
      multiplier: $("puCountMultiplier"),
      colorbomb: $("puCountColorbomb"),
      addtime: $("puCountAddtime")
    };
  }

  // -- Tile factory ----------------------------------------------------------
  function newTile(colorIdx, opts) {
    opts = opts || {};
    return {
      colorIdx: colorIdx,
      scholar: !!opts.scholar,
      shimmer: 0,
      // animation state for slide/cascade/clear
      ax: 0, ay: 0,         // animation offset px (used during shifts/falls)
      av: 0,                // animation velocity (cascade)
      clearProg: 0,         // 0..1 clear animation
      clearing: false
    };
  }

  function randColorIdx() { return Math.floor(Math.random() * COLORS.length); }

  // -- Grid creation ---------------------------------------------------------
  function makeBoard(opts) {
    opts = opts || {};
    var grid = [];
    for (var r = 0; r < GRID_N; r++) {
      var row = [];
      for (var c = 0; c < GRID_N; c++) row.push(newTile(randColorIdx()));
      grid.push(row);
    }
    // De-clump: if we accidentally build a 3-in-a-row at start, perturb.
    for (var pass = 0; pass < 3; pass++) {
      for (var rr = 0; rr < GRID_N; rr++) {
        for (var cc = 0; cc < GRID_N - 2; cc++) {
          if (grid[rr][cc].colorIdx === grid[rr][cc + 1].colorIdx &&
              grid[rr][cc].colorIdx === grid[rr][cc + 2].colorIdx) {
            grid[rr][cc + 1].colorIdx = (grid[rr][cc + 1].colorIdx + 1 + Math.floor(Math.random() * 5)) % COLORS.length;
            if (grid[rr][cc + 1].colorIdx === grid[rr][cc].colorIdx) {
              grid[rr][cc + 1].colorIdx = (grid[rr][cc + 1].colorIdx + 1) % COLORS.length;
            }
          }
        }
      }
      for (var cx = 0; cx < GRID_N; cx++) {
        for (var rx = 0; rx < GRID_N - 2; rx++) {
          if (grid[rx][cx].colorIdx === grid[rx + 1][cx].colorIdx &&
              grid[rx][cx].colorIdx === grid[rx + 2][cx].colorIdx) {
            grid[rx + 1][cx].colorIdx = (grid[rx + 1][cx].colorIdx + 1 + Math.floor(Math.random() * 5)) % COLORS.length;
            if (grid[rx + 1][cx].colorIdx === grid[rx][cx].colorIdx) {
              grid[rx + 1][cx].colorIdx = (grid[rx + 1][cx].colorIdx + 1) % COLORS.length;
            }
          }
        }
      }
    }
    if (opts.scholarCount && opts.scholarCount > 0) plantScholars(grid, opts.scholarCount);
    return grid;
  }

  function plantScholars(grid, n) {
    var picks = [];
    for (var r = 0; r < GRID_N; r++) for (var c = 0; c < GRID_N; c++) picks.push({ r: r, c: c });
    // shuffle
    for (var i = picks.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = picks[i]; picks[i] = picks[j]; picks[j] = t;
    }
    var k = Math.min(n, picks.length);
    for (var p = 0; p < k; p++) {
      var pp = picks[p];
      var tile = grid[pp.r][pp.c];
      if (tile && !tile.scholar) tile.scholar = true;
    }
  }

  function makeEmptyPowerupBag() {
    return { hammer: 0, reshuffle: 0, multiplier: 0, colorbomb: 0, addtime: 0 };
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var scholars = SCHOLAR_PER_ROUND;
    state = {
      grid: makeBoard({ scholarCount: scholars }),
      lives: opts.lives != null ? opts.lives : STARTING_LIVES,
      round: opts.round || 1,
      roundGoal: ROUND_BASE_GOAL + ((opts.round || 1) - 1) * ROUND_GOAL_STEP,
      roundClearedThisRound: 0,
      roundTime: Math.max(ROUND_TIME_FLOOR, ROUND_BASE_TIME - ((opts.round || 1) - 1) * ROUND_TIME_STEP),
      timeLeft: 0,           // set below
      roundsCompleted: opts.roundsCompleted || 0,
      // Powerups
      powerups: opts.powerups || makeEmptyPowerupBag(),
      multCharges: 0,                 // active 2x multiplier remaining clears
      // Cursor for keyboard input
      cursor: { r: 2, c: 2, edge: null },  // edge: 'left' | 'right' | 'top' | 'bottom' | null
      // Particles & shake
      particles: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      // Stats
      score: opts.score || 0,
      cleared: opts.cleared || 0,
      maxCombo: 0,
      currentCombo: 0,                // resets when no clear from a single shift action
      // Cascade-cycle running state
      cascading: false,
      cascadeTimer: 0,
      cascadeCombo: 0,                // multiplier within a single shift's cascade chain
      pendingClear: null,
      // Animation: row/col shift visual lock so we can ease the swap
      shiftAnim: null,                // { kind: 'row'|'col', index, dir, t: 0..1 }
      // Game-over scholar pending
      pendingScholarPrompt: false,
      pendingScholarLine: null,
      // Combos / flash
      flash: 0,
      timeLowBeep: 0,
      // Stats
      shotsTotal: 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      best: opts.best || readBest(),
      time: 0,
      endReason: ""
    };
    state.timeLeft = state.roundTime;
  }

  // -- Geometry helpers ------------------------------------------------------
  function tileXY(r, c) {
    return {
      x: BOARD_X + GAP + c * (TILE + GAP),
      y: BOARD_Y + GAP + r * (TILE + GAP)
    };
  }

  function getTile(r, c) {
    if (r < 0 || r >= GRID_N) return null;
    if (c < 0 || c >= GRID_N) return null;
    return state.grid[r][c];
  }

  // -- Rotation / shift logic ------------------------------------------------
  // Shift entire row by +1 (right) or -1 (left) with wraparound.
  function shiftRow(r, dir) {
    if (state.shiftAnim || state.cascading) return false;
    var row = state.grid[r];
    if (!row) return false;
    var newRow = new Array(GRID_N);
    for (var c = 0; c < GRID_N; c++) {
      var src = ((c - dir) % GRID_N + GRID_N) % GRID_N;
      newRow[c] = row[src];
    }
    state.grid[r] = newRow;
    state.shiftAnim = { kind: "row", index: r, dir: dir, t: 0 };
    state.shotsTotal++;
    sfx.rowShift();
    return true;
  }

  function shiftCol(c, dir) {
    if (state.shiftAnim || state.cascading) return false;
    if (c < 0 || c >= GRID_N) return false;
    var newCol = new Array(GRID_N);
    for (var r = 0; r < GRID_N; r++) {
      var src = ((r - dir) % GRID_N + GRID_N) % GRID_N;
      newCol[r] = state.grid[src][c];
    }
    for (var r2 = 0; r2 < GRID_N; r2++) state.grid[r2][c] = newCol[r2];
    state.shiftAnim = { kind: "col", index: c, dir: dir, t: 0 };
    state.shotsTotal++;
    sfx.colShift();
    return true;
  }

  // -- Match detection -------------------------------------------------------
  // Find every line of 3+ same-color tiles in rows, columns, and diagonals.
  // Returns an array of { cells: [{r,c,...}], colorIdx, kind: 'row'|'col'|'diagL'|'diagR' }.
  function findAllLines() {
    var lines = [];
    function collect(streak, kind) {
      if (streak.length >= 3) {
        // grab colorIdx from first non-null tile
        var color = -1;
        for (var i = 0; i < streak.length; i++) {
          var t = getTile(streak[i].r, streak[i].c);
          if (t && t.colorIdx >= 0) { color = t.colorIdx; break; }
        }
        if (color >= 0) lines.push({ cells: streak.slice(), colorIdx: color, kind: kind });
      }
    }
    // Rows
    for (var r = 0; r < GRID_N; r++) {
      var streak = [];
      var lastColor = -2;
      for (var c = 0; c < GRID_N; c++) {
        var t = getTile(r, c);
        if (t && !t.clearing && t.colorIdx === lastColor) {
          streak.push({ r: r, c: c });
        } else {
          collect(streak, "row");
          streak = (t && !t.clearing) ? [{ r: r, c: c }] : [];
          lastColor = (t && !t.clearing) ? t.colorIdx : -2;
        }
      }
      collect(streak, "row");
    }
    // Cols
    for (var c2 = 0; c2 < GRID_N; c2++) {
      var streakC = [];
      var lastColorC = -2;
      for (var r2 = 0; r2 < GRID_N; r2++) {
        var t2 = getTile(r2, c2);
        if (t2 && !t2.clearing && t2.colorIdx === lastColorC) {
          streakC.push({ r: r2, c: c2 });
        } else {
          collect(streakC, "col");
          streakC = (t2 && !t2.clearing) ? [{ r: r2, c: c2 }] : [];
          lastColorC = (t2 && !t2.clearing) ? t2.colorIdx : -2;
        }
      }
      collect(streakC, "col");
    }
    // Diagonals — both \ and /
    // For \ (top-left to bottom-right): iterate starts on top row and left col
    var diagStartsL = [];
    for (var c3 = 0; c3 < GRID_N; c3++) diagStartsL.push({ r: 0, c: c3 });
    for (var r3 = 1; r3 < GRID_N; r3++) diagStartsL.push({ r: r3, c: 0 });
    for (var d = 0; d < diagStartsL.length; d++) {
      var rr = diagStartsL[d].r, cc = diagStartsL[d].c;
      var streakD = [], lastColorD = -2;
      while (rr < GRID_N && cc < GRID_N) {
        var td = getTile(rr, cc);
        if (td && !td.clearing && td.colorIdx === lastColorD) streakD.push({ r: rr, c: cc });
        else {
          collect(streakD, "diagL");
          streakD = (td && !td.clearing) ? [{ r: rr, c: cc }] : [];
          lastColorD = (td && !td.clearing) ? td.colorIdx : -2;
        }
        rr++; cc++;
      }
      collect(streakD, "diagL");
    }
    // For / (top-right to bottom-left)
    var diagStartsR = [];
    for (var c4 = 0; c4 < GRID_N; c4++) diagStartsR.push({ r: 0, c: c4 });
    for (var r4 = 1; r4 < GRID_N; r4++) diagStartsR.push({ r: r4, c: GRID_N - 1 });
    for (var dr = 0; dr < diagStartsR.length; dr++) {
      var rr2 = diagStartsR[dr].r, cc2 = diagStartsR[dr].c;
      var streakDR = [], lastColorDR = -2;
      while (rr2 < GRID_N && cc2 >= 0) {
        var tdr = getTile(rr2, cc2);
        if (tdr && !tdr.clearing && tdr.colorIdx === lastColorDR) streakDR.push({ r: rr2, c: cc2 });
        else {
          collect(streakDR, "diagR");
          streakDR = (tdr && !tdr.clearing) ? [{ r: rr2, c: cc2 }] : [];
          lastColorDR = (tdr && !tdr.clearing) ? tdr.colorIdx : -2;
        }
        rr2++; cc2--;
      }
      collect(streakDR, "diagR");
    }
    return lines;
  }

  // After a shift completes, scan and resolve clears + cascade chain.
  function scanAndResolveClears() {
    if (state.cascading) return;
    var lines = findAllLines();
    if (!lines.length) {
      state.currentCombo = 0;
      state.cascadeCombo = 0;
      return;
    }
    state.cascading = true;
    state.cascadeCombo = state.cascadeCombo + 1;
    state.currentCombo = state.cascadeCombo;
    state.maxCombo = Math.max(state.maxCombo, state.cascadeCombo);
    handleClears(lines);
  }

  function handleClears(lines) {
    // Dedupe cells (a tile may be in multiple lines — count once).
    var cellMap = {};
    var cellList = [];
    var anyDiag = false;
    var anyScholar = false;
    var firstColor = -1;
    var totalLineCells = 0;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (l.kind === "diagL" || l.kind === "diagR") anyDiag = true;
      for (var j = 0; j < l.cells.length; j++) {
        var k = l.cells[j].r + "," + l.cells[j].c;
        totalLineCells++;
        if (!cellMap[k]) {
          cellMap[k] = true;
          cellList.push({ r: l.cells[j].r, c: l.cells[j].c });
          var t = getTile(l.cells[j].r, l.cells[j].c);
          if (t && t.scholar) anyScholar = true;
          if (firstColor < 0 && t) firstColor = t.colorIdx;
        }
      }
    }
    if (!cellList.length) {
      state.cascading = false;
      return;
    }

    // Score
    var multiplier = state.multCharges > 0 ? 2 : 1;
    var diagBonus = anyDiag ? SCORE_DIAGONAL_BONUS : 0;
    var basePts = cellList.length * (SCORE_PER_TILE + diagBonus);
    var comboMult = Math.min(COMBO_MAX_DISPLAY, state.cascadeCombo);
    var pts = Math.round(basePts * comboMult * multiplier);
    state.score += pts;
    state.cleared += cellList.length;
    state.roundClearedThisRound += cellList.length;

    // Mark tiles as clearing (clearProg animation), bursts at center.
    for (var k2 = 0; k2 < cellList.length; k2++) {
      var rr = cellList[k2].r, cc = cellList[k2].c;
      var tile = getTile(rr, cc);
      if (!tile) continue;
      tile.clearing = true;
      tile.clearProg = 0;
      var p = tileXY(rr, cc);
      burstAt(p.x + TILE / 2, p.y + TILE / 2, COLORS[tile.colorIdx].main, anyScholar && tile.scholar);
    }

    // Audio + popup
    sfx.lineClear(firstColor >= 0 ? firstColor : 0);
    if (state.cascadeCombo >= 2) {
      sfx.cascade(state.cascadeCombo);
    }
    if (state.cascadeCombo === 2 || state.cascadeCombo === 4 || state.cascadeCombo === 6) {
      sfx.comboMilestone(state.cascadeCombo);
    }
    var popupText = "+" + pts;
    pushPopup(popupText, BOARD_X + BOARD_W / 2, BOARD_Y - 30, "is-score");
    if (state.cascadeCombo >= 2) {
      var label = "CASCADE x" + state.cascadeCombo;
      if (state.cascadeCombo >= 4) label = "ARCHIVE PURGE x" + state.cascadeCombo;
      pushPopup(label, BOARD_X + BOARD_W / 2, BOARD_Y - 60, "is-tetris");
      state.flash = 1;
    } else if (cellList.length >= 4) {
      pushPopup("CRASH!", BOARD_X + BOARD_W / 2, BOARD_Y - 60, "is-bonus");
    }

    if (multiplier > 1) {
      pushPopup("2X MULT", BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_W / 2, "is-bonus");
    }

    addShake(Math.min(8, 3 + state.cascadeCombo * 1.4), 0.30);

    // Decrement multiplier charges by 1 per clear event (not per tile)
    if (state.multCharges > 0) state.multCharges -= 1;

    // Powerup drop?
    if (state.cascadeCombo >= POWERUP_DROP_COMBO) {
      maybeDropPowerup();
    }

    // Track scholar — open prompt after cascade settles.
    if (anyScholar) state.pendingScholarPrompt = true;

    // Begin clear animation. After animation, gravity/refill, then re-scan (cascade).
    state.pendingClear = { cells: cellList, t: 0, durMs: 250 };
  }

  function tickClearAnimation(dt) {
    if (!state.pendingClear) return;
    state.pendingClear.t += dt * 1000;
    var prog = Math.min(1, state.pendingClear.t / state.pendingClear.durMs);
    for (var i = 0; i < state.pendingClear.cells.length; i++) {
      var p = state.pendingClear.cells[i];
      var t = getTile(p.r, p.c);
      if (t) t.clearProg = prog;
    }
    if (prog >= 1) finishClear();
  }

  function finishClear() {
    if (!state.pendingClear) return;
    var cells = state.pendingClear.cells;
    state.pendingClear = null;
    // Remove cleared tiles from grid (set null)
    for (var i = 0; i < cells.length; i++) {
      state.grid[cells[i].r][cells[i].c] = null;
    }
    // Cascade fall: in each column, drop tiles down to fill empties; refill top with random.
    for (var c = 0; c < GRID_N; c++) {
      var stack = [];
      for (var r = GRID_N - 1; r >= 0; r--) {
        var t = state.grid[r][c];
        if (t) stack.push(t);
      }
      // Fill column from bottom with stack values, top with new tiles.
      for (var r2 = GRID_N - 1; r2 >= 0; r2--) {
        var idx = (GRID_N - 1) - r2;
        if (idx < stack.length) {
          state.grid[r2][c] = stack[idx];
          // animate drop visually: set ay so tile slides into place
          var origY = (idx + (GRID_N - 1 - r2 - idx)) * (TILE + GAP);
          state.grid[r2][c].ay = -((GRID_N - 1 - r2 - idx) + 1) * (TILE + GAP) * 0.6;
          state.grid[r2][c].av = 0;
        } else {
          // Top refill — keep colors weighted to round palette (avoid creating immediate 3-in-a-row when possible).
          var fresh = newTile(randColorIdx());
          // Bias against immediate triple by checking r2+1, r2+2 same color.
          var below1 = (r2 + 1 < GRID_N) ? state.grid[r2 + 1][c] : null;
          var below2 = (r2 + 2 < GRID_N) ? state.grid[r2 + 2][c] : null;
          var attempts = 0;
          while (below1 && below2 && fresh.colorIdx === below1.colorIdx && fresh.colorIdx === below2.colorIdx && attempts < 6) {
            fresh.colorIdx = randColorIdx();
            attempts++;
          }
          state.grid[r2][c] = fresh;
          // Animate from above
          state.grid[r2][c].ay = -(GRID_N - r2) * (TILE + GAP);
          state.grid[r2][c].av = 0;
        }
      }
    }
    // Plant a fresh scholar tile occasionally to keep ~SCHOLAR_PER_ROUND density.
    var totalScholars = countScholars();
    if (totalScholars < SCHOLAR_PER_ROUND) {
      // 35% chance per cascade tick
      if (Math.random() < 0.35) plantScholars(state.grid, 1);
    }
    // Re-scan for further matches (cascade chain).
    state.cascading = false;
    setTimeout(function () {
      // small delay so the gravity animation has frames to play
      var lines = findAllLines();
      if (lines.length) {
        state.cascading = true;
        state.cascadeCombo += 1;
        state.maxCombo = Math.max(state.maxCombo, state.cascadeCombo);
        handleClears(lines);
      } else {
        state.cascadeCombo = 0;
        state.currentCombo = 0;
        // Check round goal completion (only after cascade has fully resolved).
        if (state.roundClearedThisRound >= state.roundGoal) {
          completeRound();
        }
      }
    }, 90);
  }

  function countScholars() {
    var n = 0;
    for (var r = 0; r < GRID_N; r++) {
      for (var c = 0; c < GRID_N; c++) {
        var t = state.grid[r][c];
        if (t && t.scholar) n++;
      }
    }
    return n;
  }

  // -- Powerup pickup / use --------------------------------------------------
  function maybeDropPowerup() {
    // 60% chance to drop a powerup on combo×3+, weighted by current combo.
    var p = Math.min(0.95, 0.45 + state.cascadeCombo * 0.08);
    if (Math.random() > p) return;
    var pick = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    state.powerups[pick] = (state.powerups[pick] || 0) + 1;
    sfx.powerupPickup();
    pushPopup("+" + POWERUP_LABELS[pick].label, BOARD_X + BOARD_W / 2, BOARD_Y + 30, "is-bonus");
  }

  function activatePowerup(pu) {
    if (!state.powerups || (state.powerups[pu] || 0) <= 0) return false;
    if (pu === "reshuffle") {
      state.powerups.reshuffle -= 1;
      doReshuffle();
      return true;
    }
    if (pu === "multiplier") {
      state.powerups.multiplier -= 1;
      state.multCharges = MULTIPLIER_DURATION_CLEARS;
      sfx.powerupUse();
      pushPopup("2X MULT · " + MULTIPLIER_DURATION_CLEARS, BOARD_X + BOARD_W / 2, BOARD_Y - 30, "is-bonus");
      return true;
    }
    if (pu === "addtime") {
      state.powerups.addtime -= 1;
      state.timeLeft = Math.min(state.roundTime + 30, state.timeLeft + ADD_TIME_SECONDS);
      sfx.powerupUse();
      pushPopup("+" + ADD_TIME_SECONDS + "s", BOARD_X + BOARD_W / 2, BOARD_Y - 30, "is-legend");
      return true;
    }
    // Targetable powerups need an arming step.
    if (pu === "hammer" || pu === "colorbomb") {
      armedPowerup = (armedPowerup === pu) ? null : pu;
      // Reflect armed state on <body> so CSS can switch cursor on canvas for touch clarity
      if (armedPowerup) document.body.classList.add("armed-powerup");
      else document.body.classList.remove("armed-powerup");
      sfx.powerupUse();
      updatePowerupTrayUi();
      return true;
    }
    return false;
  }

  function doReshuffle() {
    // Carry over scholar tiles where possible — flatten, shuffle, redistribute keeping scholars.
    var flat = [];
    for (var r = 0; r < GRID_N; r++) {
      for (var c = 0; c < GRID_N; c++) {
        var t = state.grid[r][c];
        if (t) flat.push(t);
      }
    }
    for (var i = flat.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = flat[i]; flat[i] = flat[j]; flat[j] = temp;
    }
    var idx = 0;
    for (var rr = 0; rr < GRID_N; rr++) {
      for (var cc = 0; cc < GRID_N; cc++) {
        var nt = flat[idx++];
        if (!nt) nt = newTile(randColorIdx());
        nt.ax = 0; nt.ay = 0; nt.av = 0; nt.clearing = false; nt.clearProg = 0;
        state.grid[rr][cc] = nt;
      }
    }
    sfx.powerupUse();
    pushPopup("RESHUFFLE", BOARD_X + BOARD_W / 2, BOARD_Y - 30, "is-bonus");
    addShake(5, 0.3);
    // After a reshuffle, scan for any free clears (rare but possible).
    setTimeout(scanAndResolveClears, 60);
  }

  function useHammerOn(r, c) {
    if (!state.powerups || (state.powerups.hammer || 0) <= 0) return;
    var t = getTile(r, c);
    if (!t || t.clearing) return;
    state.powerups.hammer -= 1;
    armedPowerup = null;
    document.body.classList.remove("armed-powerup");
    sfx.powerupUse();
    var p = tileXY(r, c);
    burstAt(p.x + TILE / 2, p.y + TILE / 2, "#fff", t.scholar);
    if (t.scholar) state.pendingScholarPrompt = true;
    state.grid[r][c] = null;
    // Drop tiles in this column to fill empty.
    for (var r2 = r; r2 > 0; r2--) {
      state.grid[r2][c] = state.grid[r2 - 1][c];
      if (state.grid[r2][c]) {
        state.grid[r2][c].ay = -(TILE + GAP);
      }
    }
    // Refill top
    state.grid[0][c] = newTile(randColorIdx());
    state.grid[0][c].ay = -(TILE + GAP);
    state.cleared += 1;
    state.roundClearedThisRound += 1;
    state.score += SCORE_PER_TILE;
    addShake(4, 0.25);
    pushPopup("HAMMER", p.x + TILE / 2, p.y + TILE / 2, "is-bonus");
    setTimeout(scanAndResolveClears, 90);
    updatePowerupTrayUi();
  }

  function useColorBombOn(r, c) {
    if (!state.powerups || (state.powerups.colorbomb || 0) <= 0) return;
    var pivotTile = getTile(r, c);
    if (!pivotTile) return;
    var color = pivotTile.colorIdx;
    state.powerups.colorbomb -= 1;
    armedPowerup = null;
    document.body.classList.remove("armed-powerup");
    sfx.powerupUse();
    var hits = [];
    for (var rr = 0; rr < GRID_N; rr++) {
      for (var cc = 0; cc < GRID_N; cc++) {
        var t = state.grid[rr][cc];
        if (t && t.colorIdx === color && !t.clearing) hits.push({ r: rr, c: cc });
      }
    }
    var anyScholar = false;
    var multiplier = state.multCharges > 0 ? 2 : 1;
    var pts = Math.round(hits.length * SCORE_PER_TILE * 1.4 * multiplier);
    state.score += pts;
    state.cleared += hits.length;
    state.roundClearedThisRound += hits.length;
    for (var i = 0; i < hits.length; i++) {
      var hp = tileXY(hits[i].r, hits[i].c);
      var ht = getTile(hits[i].r, hits[i].c);
      if (ht && ht.scholar) anyScholar = true;
      burstAt(hp.x + TILE / 2, hp.y + TILE / 2, COLORS[color].main, anyScholar);
      state.grid[hits[i].r][hits[i].c] = null;
    }
    addShake(6, 0.34);
    if (anyScholar) state.pendingScholarPrompt = true;
    pushPopup("COLOR BOMB · " + COLORS[color].label, BOARD_X + BOARD_W / 2, BOARD_Y - 30, "is-legend");
    pushPopup("+" + pts, BOARD_X + BOARD_W / 2, BOARD_Y, "is-score");
    if (state.multCharges > 0) state.multCharges -= 1;
    // Cascade fall, then re-scan
    setTimeout(function () {
      for (var c2 = 0; c2 < GRID_N; c2++) {
        var stack = [];
        for (var rr2 = GRID_N - 1; rr2 >= 0; rr2--) {
          if (state.grid[rr2][c2]) stack.push(state.grid[rr2][c2]);
        }
        for (var rr3 = GRID_N - 1; rr3 >= 0; rr3--) {
          var idx = (GRID_N - 1) - rr3;
          if (idx < stack.length) {
            state.grid[rr3][c2] = stack[idx];
            state.grid[rr3][c2].ay = -((GRID_N - 1 - rr3 - idx) + 1) * (TILE + GAP) * 0.5;
          } else {
            var fresh = newTile(randColorIdx());
            fresh.ay = -(GRID_N - rr3) * (TILE + GAP);
            state.grid[rr3][c2] = fresh;
          }
        }
      }
      setTimeout(scanAndResolveClears, 60);
    }, 80);
    updatePowerupTrayUi();
  }

  // -- Round / lives flow ----------------------------------------------------
  function completeRound() {
    if (phase !== "playing") return;
    state.roundsCompleted += 1;
    sfx.roundClear();
    pushPopup("ROUND " + state.round + " CLEARED!", BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_W / 2, "is-tetris");
    addShake(6, 0.4);
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#a991ff", "#52e8a0"] });
      }
    } catch (e) {}
    // Bonus: 5 shards + score for time remaining
    var timeBonus = Math.round(state.timeLeft) * 20;
    state.score += timeBonus;
    addShards(5, GAME_ID + "-round-clear");
    prevPhase = phase;
    phase = "round";
    showRoundScreen(timeBonus);
    pauseMusic();
    saveSnapshot();
  }

  function showRoundScreen(timeBonus) {
    if (dom.roundKicker) dom.roundKicker.textContent = "Round " + state.round + " Cleared";
    if (dom.roundTitle) dom.roundTitle.textContent = "Round " + state.round + " · Cleared";
    if (dom.roundGrid) {
      dom.roundGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Time Bonus</div><div class="end-cell-value">+' + formatNumber(timeBonus) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Cleared</div><div class="end-cell-value">' + formatNumber(state.roundClearedThisRound) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Combo</div><div class="end-cell-value">x' + state.maxCombo + '</div></div>'
      ].join("");
    }
    if (dom.roundHint) {
      var nextRound = state.round + 1;
      var nextGoal = ROUND_BASE_GOAL + (nextRound - 1) * ROUND_GOAL_STEP;
      var nextTime = Math.max(ROUND_TIME_FLOOR, ROUND_BASE_TIME - (nextRound - 1) * ROUND_TIME_STEP);
      dom.roundHint.textContent = "Next: Round " + nextRound + " · Goal " + nextGoal + " · " + nextTime + "s · " + state.lives + " lives";
    }
    showScreen("round");
  }

  function startNextRound() {
    state.round += 1;
    state.roundGoal = ROUND_BASE_GOAL + (state.round - 1) * ROUND_GOAL_STEP;
    state.roundTime = Math.max(ROUND_TIME_FLOOR, ROUND_BASE_TIME - (state.round - 1) * ROUND_TIME_STEP);
    state.timeLeft = state.roundTime;
    state.roundClearedThisRound = 0;
    state.maxCombo = 0;       // best combo tracked per round
    state.cascadeCombo = 0;
    state.currentCombo = 0;
    state.grid = makeBoard({ scholarCount: SCHOLAR_PER_ROUND });
    showScreen(null);
    phase = "playing";
    resumeMusic();
    saveSnapshot();
  }

  function failRound() {
    state.lives -= 1;
    sfx.lifeLost();
    addShake(8, 0.5);
    pushPopup("LIFE LOST · " + state.lives + " LEFT", BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_W / 2, "is-legend");
    if (state.lives <= 0) {
      state.endReason = "Out of lives";
      gameOver();
      return;
    }
    // Otherwise, restart current round (refresh board + timer).
    state.timeLeft = state.roundTime;
    state.roundClearedThisRound = 0;
    state.cascadeCombo = 0;
    state.currentCombo = 0;
    state.grid = makeBoard({ scholarCount: SCHOLAR_PER_ROUND });
    saveSnapshot();
  }

  // -- Update loop -----------------------------------------------------------
  function updateGame(dt) {
    if (!state) return;
    state.time += dt;
    state.timeLeft = Math.max(0, state.timeLeft - dt);

    // Shift animation
    if (state.shiftAnim) {
      state.shiftAnim.t = Math.min(1, state.shiftAnim.t + dt * 6);
      if (state.shiftAnim.t >= 1) {
        state.shiftAnim = null;
        // Resolve clears + cascade after each shift completes.
        scanAndResolveClears();
      }
    }

    // Cascade clear animation (drop + clearProg)
    tickClearAnimation(dt);

    // Tile gravity-spring (eases ay back to 0)
    for (var r = 0; r < GRID_N; r++) {
      for (var c = 0; c < GRID_N; c++) {
        var t = state.grid[r][c];
        if (!t) continue;
        if (t.ay !== 0) {
          t.av += 1500 * dt;
          t.ay += t.av * dt;
          if (t.ay >= 0) {
            t.ay = 0;
            t.av = 0;
          }
        }
        if (t.scholar) t.shimmer = (t.shimmer || 0) + dt;
      }
    }

    // Particles
    var aliveP = [];
    for (var pi = 0; pi < state.particles.length; pi++) {
      var p = state.particles[pi];
      if (p.startDelay && p.startDelay > 0) {
        p.startDelay -= dt;
        aliveP.push(p);
        continue;
      }
      p.life -= dt;
      if (p.kind === "ripple") {
        p.radius += dt * 110;
        if (p.life > 0) aliveP.push(p);
      } else {
        p.x += (p.vx || 0) * dt;
        p.y += (p.vy || 0) * dt;
        if (p.vx) p.vx *= 0.92;
        if (p.vy) {
          p.vy *= 0.92;
          p.vy += 80 * dt;
        }
        if (p.life > 0) aliveP.push(p);
      }
    }
    state.particles = aliveP;

    // Flash decay
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.6);

    // Shake decay
    if (state.shake.life > 0) {
      state.shake.life -= dt;
      var k2 = Math.max(0, state.shake.life / Math.max(0.01, state.shake.totalLife));
      var inten = state.shake.intensity * k2;
      state.shake.x = (Math.random() - 0.5) * inten * 2;
      state.shake.y = (Math.random() - 0.5) * inten * 2;
    } else {
      state.shake.x = 0; state.shake.y = 0;
    }

    // Time-low warning beeps
    if (state.timeLeft > 0 && state.timeLeft <= TIME_LOW_THRESHOLD) {
      state.timeLowBeep += dt;
      if (state.timeLowBeep >= 1.0) {
        state.timeLowBeep = 0;
        sfx.timeLow();
      }
    } else {
      state.timeLowBeep = 0;
    }

    // Open scholar modal if pending and no animation in flight.
    if (state.pendingScholarPrompt && !state.cascading && !state.pendingClear && !state.shiftAnim) {
      state.pendingScholarPrompt = false;
      openScholarQuestion();
    }

    // Round time-out
    if (state.timeLeft <= 0 && phase === "playing" && !state.pendingClear && !state.cascading && !state.shiftAnim) {
      failRound();
    }

    updateHud();
  }

  // -- Particles / shake / popups -------------------------------------------
  function burstAt(x, y, color, scholarBurst) {
    if (reducedMotion) {
      state.particles.push({ kind: "spark", x: x, y: y, vx: 0, vy: -20, life: 0.18, totalLife: 0.18, color: color, size: 2 });
      return;
    }
    var n = scholarBurst ? 14 : 10;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 90 + Math.random() * 240;
      state.particles.push({
        kind: "spark",
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.5 + Math.random() * 0.4,
        totalLife: 0.7,
        color: scholarBurst && i % 3 === 0 ? "#f5c451" : color,
        size: 1.6 + Math.random() * 2.6
      });
    }
    // Add a single ripple from cell center
    state.particles.push({
      kind: "ripple", x: x, y: y, life: 0.32, totalLife: 0.32, color: "rgba(255,255,255,0.85)", radius: 6
    });
  }

  function pushPopup(text, x, y, klass) {
    if (!dom.popupOverlay) return;
    var el = document.createElement("div");
    el.className = "popup-text " + (klass || "");
    el.textContent = text;
    var cx = offsetX + x * scale;
    var cy = offsetY + y * scale;
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1200);
  }

  function addShake(intensity, life) {
    if (reducedMotion) return;
    var s = state.shake;
    s.intensity = Math.max(s.intensity, intensity);
    s.life = Math.max(s.life, life);
    s.totalLife = Math.max(s.totalLife, life);
  }

  // -- Rendering -------------------------------------------------------------
  function clearCanvas() {
    ctx.save();
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.restore();
  }

  function drawBackground() {
    var grd = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H * 0.3, 60, LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W);
    grd.addColorStop(0, "rgba(20, 30, 60, 0.55)");
    grd.addColorStop(0.55, "rgba(8, 10, 22, 0.5)");
    grd.addColorStop(1, "rgba(2, 4, 12, 0.95)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    if (state.flash > 0) {
      ctx.fillStyle = "rgba(245, 196, 81, " + (state.flash * 0.18).toFixed(3) + ")";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }
  }

  function drawBoardBacking() {
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    // Outer brass frame
    ctx.strokeStyle = "rgba(245, 196, 81, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(BOARD_X - 6, BOARD_Y - 6, BOARD_W + 12, BOARD_W + 12);
    ctx.fillStyle = "rgba(8, 14, 28, 0.85)";
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_W);
    // Cell sockets
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (var r = 0; r < GRID_N; r++) {
      for (var c = 0; c < GRID_N; c++) {
        var p = tileXY(r, c);
        ctx.fillRect(p.x, p.y, TILE, TILE);
      }
    }
    ctx.restore();
  }

  function drawArrows() {
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    ctx.fillStyle = "rgba(93, 224, 240, 0.65)";
    ctx.strokeStyle = "rgba(93, 224, 240, 0.95)";
    ctx.lineWidth = 1.5;
    // Row arrows: left + right of each row
    for (var r = 0; r < GRID_N; r++) {
      var p = tileXY(r, 0);
      var midY = p.y + TILE / 2;
      // Left arrow at BOARD_X - ARROW_SIZE - 4, points left
      drawArrow(BOARD_X - ARROW_SIZE - 4, midY, "left");
      drawArrow(BOARD_X + BOARD_W + 4, midY, "right");
    }
    // Column arrows: top + bottom of each column
    for (var c = 0; c < GRID_N; c++) {
      var pp = tileXY(0, c);
      var midX = pp.x + TILE / 2;
      drawArrow(midX, BOARD_Y - ARROW_SIZE - 4, "up");
      drawArrow(midX, BOARD_Y + BOARD_W + 4, "down");
    }
    ctx.restore();
  }

  // Draw a small triangular arrow centered at (x, y), pointing direction.
  function drawArrow(x, y, dir) {
    ctx.save();
    ctx.translate(x, y);
    var s = ARROW_SIZE * 0.45;
    ctx.beginPath();
    if (dir === "left") {
      ctx.moveTo(-s, 0);
      ctx.lineTo(s * 0.7, -s * 0.7);
      ctx.lineTo(s * 0.7, s * 0.7);
    } else if (dir === "right") {
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.7, -s * 0.7);
      ctx.lineTo(-s * 0.7, s * 0.7);
    } else if (dir === "up") {
      ctx.moveTo(0, -s);
      ctx.lineTo(-s * 0.7, s * 0.7);
      ctx.lineTo(s * 0.7, s * 0.7);
    } else {
      ctx.moveTo(0, s);
      ctx.lineTo(-s * 0.7, -s * 0.7);
      ctx.lineTo(s * 0.7, -s * 0.7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawTiles() {
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    // Apply shift animation offset to specific row/col
    for (var r = 0; r < GRID_N; r++) {
      for (var c = 0; c < GRID_N; c++) {
        var t = state.grid[r][c];
        if (!t) continue;
        var p = tileXY(r, c);
        var ox = 0, oy = 0;
        if (state.shiftAnim) {
          var sa = state.shiftAnim;
          // We slide the *new* arrangement from old to new — the grid is already updated post-shift,
          // so we render a directional offset that decays with t.
          var slide = (1 - sa.t);
          if (sa.kind === "row" && sa.index === r) {
            ox = sa.dir * (TILE + GAP) * slide;
          } else if (sa.kind === "col" && sa.index === c) {
            oy = sa.dir * (TILE + GAP) * slide;
          }
        }
        // Tile gravity offset
        oy += t.ay || 0;
        // Clearing animation: scale down + fade
        var alpha = 1;
        var scaleK = 1;
        if (t.clearing && t.clearProg !== undefined) {
          alpha = 1 - t.clearProg;
          scaleK = 1 - 0.6 * t.clearProg;
        }
        drawTile(p.x + ox, p.y + oy, t, { alpha: alpha, scaleK: scaleK });
      }
    }
    ctx.restore();
  }

  function drawTile(x, y, tile, opts) {
    opts = opts || {};
    var alpha = opts.alpha == null ? 1 : opts.alpha;
    var scaleK = opts.scaleK == null ? 1 : opts.scaleK;
    var color = COLORS[tile.colorIdx] || COLORS[0];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + TILE / 2, y + TILE / 2);
    ctx.scale(scaleK, scaleK);
    // Drop shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRectPath(ctx, -TILE / 2 + 1, -TILE / 2 + 2, TILE, TILE, 12);
    ctx.fill();
    // Body gradient
    var grd = ctx.createLinearGradient(-TILE / 2, -TILE / 2, TILE / 2, TILE / 2);
    grd.addColorStop(0, applyBrightness(color.main, 1.3));
    grd.addColorStop(0.45, color.main);
    grd.addColorStop(1, applyBrightness(color.main, 0.62));
    ctx.fillStyle = grd;
    roundRectPath(ctx, -TILE / 2, -TILE / 2, TILE, TILE, 12);
    ctx.fill();
    // Inner highlight
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = "#fff";
    roundRectPath(ctx, -TILE / 2 + 6, -TILE / 2 + 6, TILE - 12, TILE * 0.35, 8);
    ctx.fill();
    ctx.globalAlpha = alpha;
    // Outline
    ctx.strokeStyle = color.outline;
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, -TILE / 2, -TILE / 2, TILE, TILE, 12);
    ctx.stroke();
    // Crest glyph in center
    drawCrestGlyph(0, 0, TILE * 0.42, color);
    // Scholar overlay — rotating multi-color outline ring + question sigil
    if (tile.scholar) {
      var rot = (tile.shimmer || 0) * 1.6;
      ctx.save();
      ctx.rotate(rot);
      var hueColors = ["#f5c451", "#5de0f0", "#a991ff", "#f07bb8", "#52e8a0", "#f04860"];
      ctx.lineWidth = 3;
      for (var hi = 0; hi < 6; hi++) {
        ctx.strokeStyle = hueColors[hi];
        ctx.beginPath();
        ctx.arc(0, 0, TILE * 0.46, hi * Math.PI / 3, hi * Math.PI / 3 + Math.PI / 4);
        ctx.stroke();
      }
      ctx.restore();
      // Gold rim
      ctx.strokeStyle = "rgba(245, 196, 81, 0.95)";
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, -TILE / 2 + 2, -TILE / 2 + 2, TILE - 4, TILE - 4, 11);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draw a stylized crest glyph for each discipline at (cx, cy) with size r.
  function drawCrestGlyph(cx, cy, r, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(20, 14, 8, 0.78)";
    ctx.strokeStyle = "rgba(20, 14, 8, 0.78)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    var g = color.glyph;
    if (g === "scroll") {
      // SCROLL: rolled-paper rectangle with two horizontal lines
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.4);
      ctx.lineTo(r * 0.7, -r * 0.4);
      ctx.lineTo(r * 0.7, r * 0.4);
      ctx.lineTo(-r * 0.7, r * 0.4);
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 255, 240, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 14, 8, 0.78)";
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.1); ctx.lineTo(r * 0.45, -r * 0.1);
      ctx.moveTo(-r * 0.45, r * 0.15);  ctx.lineTo(r * 0.45, r * 0.15);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (g === "atom") {
      // ATOM: nucleus + 3 elliptical orbits
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(20, 14, 8, 0.85)";
      ctx.save();
      for (var k = 0; k < 3; k++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.8, r * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.fillStyle = "rgba(20, 14, 8, 0.92)";
      ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else if (g === "compass") {
      // COMPASS: 4-point N star inside circle
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "rgba(20, 14, 8, 0.85)";
      ctx.moveTo(0, -r * 0.7);
      ctx.lineTo(r * 0.18, 0);
      ctx.lineTo(0, r * 0.7);
      ctx.lineTo(-r * 0.18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, 0);
      ctx.lineTo(0, -r * 0.18);
      ctx.lineTo(r * 0.7, 0);
      ctx.lineTo(0, r * 0.18);
      ctx.closePath();
      ctx.fillStyle = "rgba(20, 14, 8, 0.55)";
      ctx.fill();
    } else if (g === "palette") {
      // PALETTE: rounded blob with thumb hole + 3 paint dots
      ctx.beginPath();
      ctx.fillStyle = "rgba(255, 255, 240, 0.92)";
      ctx.ellipse(0, 0, r * 0.78, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 14, 8, 0.78)";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Thumb hole
      ctx.beginPath();
      ctx.fillStyle = "rgba(8, 6, 16, 0.85)";
      ctx.ellipse(r * 0.35, r * 0.05, r * 0.16, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Paint dots
      var dots = [
        { x: -r * 0.4, y: -r * 0.18, c: "#f04860" },
        { x: -r * 0.05, y: -r * 0.32, c: "#5de0f0" },
        { x: -r * 0.35, y: r * 0.22,  c: "#f5c451" }
      ];
      for (var d = 0; d < dots.length; d++) {
        ctx.beginPath();
        ctx.fillStyle = dots[d].c;
        ctx.arc(dots[d].x, dots[d].y, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (g === "quill") {
      // QUILL: feather quill stroke
      ctx.save();
      ctx.rotate(-Math.PI / 4);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(20, 14, 8, 0.85)";
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, r * 0.5);
      ctx.lineTo(r * 0.5, -r * 0.55);
      ctx.stroke();
      // Vanes
      ctx.lineWidth = 1.5;
      for (var v = 0; v < 5; v++) {
        var t = v / 5;
        var qx = -r * 0.6 + (r * 1.1) * t;
        var qy = r * 0.5 - (r * 1.05) * t;
        ctx.beginPath();
        ctx.moveTo(qx, qy);
        ctx.lineTo(qx - r * 0.16 - t * r * 0.05, qy - r * 0.22 - t * r * 0.05);
        ctx.stroke();
      }
      // Tip dot (ink)
      ctx.beginPath();
      ctx.fillStyle = "rgba(8, 6, 16, 0.95)";
      ctx.arc(-r * 0.55, r * 0.55, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (g === "globe") {
      // GLOBE: circle + meridians + equator
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(20, 14, 8, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.lineWidth = 1.5;
      // Equator
      ctx.beginPath();
      ctx.moveTo(-r * 0.78, 0); ctx.lineTo(r * 0.78, 0);
      ctx.stroke();
      // Meridian curves. The mc=-1 iteration produced a negative ellipse
      // radius (r*0.22 - r*0.28 = -r*0.06) which fired hundreds of
      // IndexSizeError exceptions in the browser console. Wrap in Math.abs
      // so the inner meridian renders at a small positive radius. (May 10 2026)
      for (var mc = -1; mc <= 1; mc++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.abs(r * 0.22 + mc * r * 0.28), r * 0.78, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCursor() {
    if (!state.cursor) return;
    var cur = state.cursor;
    if (cur.r < 0 || cur.r >= GRID_N || cur.c < 0 || cur.c >= GRID_N) return;
    var p = tileXY(cur.r, cur.c);
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    ctx.strokeStyle = armedPowerup ? "rgba(245, 196, 81, 0.95)" : "rgba(255,255,255,0.55)";
    ctx.lineWidth = armedPowerup ? 3 : 2;
    var pad = 4;
    roundRectPath(ctx, p.x - pad, p.y - pad, TILE + pad * 2, TILE + pad * 2, 14);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    if (!state.particles.length) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      if (p.startDelay && p.startDelay > 0) continue;
      var t = Math.max(0, p.life / Math.max(0.01, p.totalLife));
      if (p.kind === "ripple") {
        ctx.globalAlpha = t * 0.85;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function applyBrightness(color, b) {
    var r, g, bl;
    if (color.indexOf("#") === 0) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      bl = parseInt(color.slice(5, 7), 16);
    } else {
      var m = /rgb\((\d+),(\d+),(\d+)\)/.exec(color.replace(/\s/g, ""));
      if (!m) return color;
      r = +m[1]; g = +m[2]; bl = +m[3];
    }
    r = Math.round(Math.max(0, Math.min(255, r * b)));
    g = Math.round(Math.max(0, Math.min(255, g * b)));
    bl = Math.round(Math.max(0, Math.min(255, bl * b)));
    return "rgb(" + r + "," + g + "," + bl + ")";
  }

  // -- Main render -----------------------------------------------------------
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawBackground();
    drawBoardBacking();
    drawArrows();
    drawTiles();
    drawCursor();
    drawParticles();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // -- Game loop -------------------------------------------------------------
  function loop(ts) {
    rafHandle = requestAnimationFrame(loop);
    if (!state) return;
    var dt = lastFrame ? Math.min(0.05, (ts - lastFrame) / 1000) : 0;
    lastFrame = ts;
    if (phase === "playing") {
      updateGame(dt);
    } else if (phase === "ended" || phase === "paused" || phase === "question" || phase === "round") {
      // tick particles + shake + clear animations so anims finish
      if (state) {
        var aliveP = [];
        for (var pi = 0; pi < state.particles.length; pi++) {
          var p = state.particles[pi];
          if (p.startDelay && p.startDelay > 0) { p.startDelay -= dt; aliveP.push(p); continue; }
          p.life -= dt;
          if (p.kind === "ripple") {
            p.radius += dt * 110;
            if (p.life > 0) aliveP.push(p);
          } else {
            p.x += (p.vx || 0) * dt;
            p.y += (p.vy || 0) * dt;
            if (p.vx) p.vx *= 0.92;
            if (p.vy) { p.vy *= 0.92; p.vy += 80 * dt; }
            if (p.life > 0) aliveP.push(p);
          }
        }
        state.particles = aliveP;
        if (state.shake.life > 0) {
          state.shake.life -= dt;
          var k2 = Math.max(0, state.shake.life / Math.max(0.01, state.shake.totalLife));
          var inten = state.shake.intensity * k2;
          state.shake.x = (Math.random() - 0.5) * inten * 2;
          state.shake.y = (Math.random() - 0.5) * inten * 2;
        } else {
          state.shake.x = 0; state.shake.y = 0;
        }
        if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 1.6);
      }
    }
    render();
    if (ts - lastSnapshotTs > 10000) { lastSnapshotTs = ts; saveSnapshot(); }
  }

  // -- HUD -------------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudCleared) dom.hudCleared.textContent = formatNumber(state.cleared);
    if (dom.hudCombo) dom.hudCombo.textContent = "x" + (state.cascadeCombo > 0 ? state.cascadeCombo : 1);
    if (dom.hudLives) dom.hudLives.textContent = state.lives;
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.roundName) {
      dom.roundName.textContent = "Round " + state.round + " · " + state.roundClearedThisRound + "/" + state.roundGoal;
    }
    if (dom.roundMeta) {
      var bits = [];
      bits.push(state.timeLeft.toFixed(1) + "s");
      if (state.multCharges > 0) bits.push("2X·" + state.multCharges);
      var puCount = (state.powerups.hammer || 0) + (state.powerups.reshuffle || 0) +
                    (state.powerups.multiplier || 0) + (state.powerups.colorbomb || 0) +
                    (state.powerups.addtime || 0);
      bits.push("PU " + puCount);
      dom.roundMeta.textContent = bits.join(" · ");
    }
    if (dom.waveRibbon) {
      if (state.timeLeft <= TIME_LOW_THRESHOLD && state.timeLeft > 0) {
        dom.waveRibbon.classList.add("is-warn");
      } else {
        dom.waveRibbon.classList.remove("is-warn");
      }
    }
    updatePowerupTrayUi();
  }

  function updatePowerupTrayUi() {
    if (!dom.powerupTray) return;
    var slots = dom.powerupTray.querySelectorAll(".pu-slot");
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      var pu = s.getAttribute("data-pu");
      var cnt = (state && state.powerups) ? (state.powerups[pu] || 0) : 0;
      if (dom.puCount[pu]) dom.puCount[pu].textContent = String(cnt);
      if (cnt <= 0) s.classList.add("is-empty"); else s.classList.remove("is-empty");
      if (armedPowerup === pu) s.classList.add("is-armed"); else s.classList.remove("is-armed");
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
    sfx.scholarClear();
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Tile · Optional · +" + SCHOLAR_BONUS + " · +" + SCHOLAR_SHARDS + " shards";
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
      dom.explanation.textContent = "Decoded! +" + SCHOLAR_BONUS + " score · +" + SCHOLAR_SHARDS + " shards.";
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
      state.score += SCHOLAR_BONUS;
      addShards(SCHOLAR_SHARDS, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
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
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 250));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.endReason ? state.endReason : "Cube Locked";
    if (dom.endTitle) dom.endTitle.textContent = "Cube Crash · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Tiles Cleared</div><div class="end-cell-value">' + formatNumber(state.cleared) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Rounds</div><div class="end-cell-value">' + state.roundsCompleted + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Combo</div><div class="end-cell-value">x' + state.maxCombo + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Shifts</div><div class="end-cell-value">' + formatNumber(state.shotsTotal) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    if (window.MrMacsEndRecap) {
      MrMacsEndRecap.stopTracking();
      MrMacsEndRecap.render(document.getElementById("endRecap"));
    }
    showScreen("end");
    stopMusic();
  }

  // -- Screens ---------------------------------------------------------------
  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen, dom.roundScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
    else if (name === "round") dom.roundScreen.classList.add("show");
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { cleared: state.cleared, rounds: state.roundsCompleted });
      }
    } catch (e) {}
  }

  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          cleared: state.cleared,
          round: state.round,
          lives: state.lives,
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
          file: "games/cube-crash/index.html"
        });
      }
    } catch (e) {}
  }

  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("cube-crash:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("cube-crash:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("td-strategic", { volume: 0.5 });
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
        var cur = state.cursor;
        // Movement: WASD moves cursor (selecting target row/col); arrows perform shift on cursor's row/col
        if (k === "w" || k === "W") { if (cur.r > 0) cur.r--; e.preventDefault(); return; }
        if (k === "s" || k === "S") { if (cur.r < GRID_N - 1) cur.r++; e.preventDefault(); return; }
        if (k === "a" || k === "A") { if (cur.c > 0) cur.c--; e.preventDefault(); return; }
        if (k === "d" || k === "D") { if (cur.c < GRID_N - 1) cur.c++; e.preventDefault(); return; }
        if (k === "ArrowLeft") { shiftRow(cur.r, -1); e.preventDefault(); return; }
        if (k === "ArrowRight") { shiftRow(cur.r, +1); e.preventDefault(); return; }
        if (k === "ArrowUp") { shiftCol(cur.c, -1); e.preventDefault(); return; }
        if (k === "ArrowDown") { shiftCol(cur.c, +1); e.preventDefault(); return; }
        // Powerup hotkeys 1..5
        if (k === "1") { activatePowerup("hammer"); e.preventDefault(); return; }
        if (k === "2") { activatePowerup("reshuffle"); e.preventDefault(); return; }
        if (k === "3") { activatePowerup("multiplier"); e.preventDefault(); return; }
        if (k === "4") { activatePowerup("colorbomb"); e.preventDefault(); return; }
        if (k === "5") { activatePowerup("addtime"); e.preventDefault(); return; }
        // Confirm targetable powerup at cursor
        if (k === "Enter" || k === " ") {
          if (e.repeat) return;
          if (armedPowerup === "hammer") { useHammerOn(cur.r, cur.c); e.preventDefault(); return; }
          if (armedPowerup === "colorbomb") { useColorBombOn(cur.r, cur.c); e.preventDefault(); return; }
        }
        if (k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause(); e.preventDefault(); return;
        }
      }
      if (phase === "paused" && (k === "p" || k === "P" || k === " ")) {
        togglePause(); e.preventDefault(); return;
      }
      if (k === "Escape" || k === "Esc") {
        if (phase === "playing" || phase === "paused") togglePause();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
      }
    });

    bindMouse();
    bindTouch();
    bindPowerupTray();
  }

  // Mouse/click: translate click position into row arrow / col arrow / tile.
  function bindMouse() {
    canvas.addEventListener("mousemove", function (e) {
      if (phase !== "playing") return;
      var p = clientToLogical(e.clientX, e.clientY);
      // Update cursor position to nearest tile under mouse (visual feedback for armed powerup).
      var hit = clickToTile(p.x, p.y);
      if (hit) {
        state.cursor.r = hit.r; state.cursor.c = hit.c;
      }
    });
    canvas.addEventListener("click", function (e) {
      if (phase !== "playing") return;
      var p = clientToLogical(e.clientX, e.clientY);
      handleBoardClick(p.x, p.y);
    });
  }

  function clickToTile(x, y) {
    if (x < BOARD_X || x > BOARD_X + BOARD_W) return null;
    if (y < BOARD_Y || y > BOARD_Y + BOARD_W) return null;
    var localX = x - BOARD_X - GAP;
    var localY = y - BOARD_Y - GAP;
    var c = Math.floor(localX / (TILE + GAP));
    var r = Math.floor(localY / (TILE + GAP));
    if (r < 0 || r >= GRID_N || c < 0 || c >= GRID_N) return null;
    // Snap inside the tile body, ignore gap clicks.
    var tx = BOARD_X + GAP + c * (TILE + GAP);
    var ty = BOARD_Y + GAP + r * (TILE + GAP);
    if (x < tx || x > tx + TILE || y < ty || y > ty + TILE) return null;
    return { r: r, c: c };
  }

  function handleBoardClick(x, y) {
    // 1) Targetable powerup?
    var hit = clickToTile(x, y);
    if (hit) {
      if (armedPowerup === "hammer") { useHammerOn(hit.r, hit.c); return; }
      if (armedPowerup === "colorbomb") { useColorBombOn(hit.r, hit.c); return; }
      // Tile click without armed powerup just selects cursor (no shift).
      state.cursor.r = hit.r; state.cursor.c = hit.c;
      return;
    }
    // 2) Row arrows?
    // Left arrow: x in [BOARD_X - ARROW_SIZE - 4 - ARROW_SIZE/2, BOARD_X] roughly
    var leftAX1 = BOARD_X - ARROW_SIZE - 4 - ARROW_SIZE * 0.5;
    var leftAX2 = BOARD_X - 4;
    var rightAX1 = BOARD_X + BOARD_W + 4;
    var rightAX2 = BOARD_X + BOARD_W + 4 + ARROW_SIZE * 1.0;
    if (x >= leftAX1 && x <= leftAX2) {
      // figure out row
      for (var r = 0; r < GRID_N; r++) {
        var p = tileXY(r, 0);
        if (y >= p.y && y <= p.y + TILE) {
          shiftRow(r, -1);
          return;
        }
      }
    }
    if (x >= rightAX1 && x <= rightAX2) {
      for (var r2 = 0; r2 < GRID_N; r2++) {
        var p2 = tileXY(r2, 0);
        if (y >= p2.y && y <= p2.y + TILE) {
          shiftRow(r2, +1);
          return;
        }
      }
    }
    // 3) Column arrows?
    var topAY1 = BOARD_Y - ARROW_SIZE - 4 - ARROW_SIZE * 0.5;
    var topAY2 = BOARD_Y - 4;
    var bottomAY1 = BOARD_Y + BOARD_W + 4;
    var bottomAY2 = BOARD_Y + BOARD_W + 4 + ARROW_SIZE * 1.0;
    if (y >= topAY1 && y <= topAY2) {
      for (var c = 0; c < GRID_N; c++) {
        var pc = tileXY(0, c);
        if (x >= pc.x && x <= pc.x + TILE) {
          shiftCol(c, -1);
          return;
        }
      }
    }
    if (y >= bottomAY1 && y <= bottomAY2) {
      for (var c2 = 0; c2 < GRID_N; c2++) {
        var pc2 = tileXY(0, c2);
        if (x >= pc2.x && x <= pc2.x + TILE) {
          shiftCol(c2, +1);
          return;
        }
      }
    }
  }

  // Touch: tap = same as click. Drag inside a tile = direction shift.
  function bindTouch() {
    var dragStart = null;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (!e.touches || e.touches.length !== 1) return;
      var t = e.touches[0];
      var p = clientToLogical(t.clientX, t.clientY);
      dragStart = { x: p.x, y: p.y, t: Date.now() };
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchmove", function (e) {
      // We allow drag-shift; commit the shift on touchend. Throttle: only update cursor.
      if (!dragStart) return;
      if (!e.touches || e.touches.length !== 1) return;
      var t = e.touches[0];
      var p = clientToLogical(t.clientX, t.clientY);
      var hit = clickToTile(p.x, p.y);
      if (hit) {
        state.cursor.r = hit.r; state.cursor.c = hit.c;
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchend", function (e) {
      if (!dragStart) return;
      var endTouch = (e.changedTouches && e.changedTouches[0]) || null;
      if (!endTouch) { dragStart = null; return; }
      var p = clientToLogical(endTouch.clientX, endTouch.clientY);
      var dx = p.x - dragStart.x;
      var dy = p.y - dragStart.y;
      var dist = Math.hypot(dx, dy);
      if (dist < 24) {
        // Tap — treat as click
        handleBoardClick(p.x, p.y);
        dragStart = null;
        return;
      }
      // Swipe inside a tile: row or column shift
      var startHit = clickToTile(dragStart.x, dragStart.y);
      if (!startHit) {
        // Outside grid — fall back to click handler
        handleBoardClick(p.x, p.y);
        dragStart = null;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        shiftRow(startHit.r, dx > 0 ? +1 : -1);
      } else {
        shiftCol(startHit.c, dy > 0 ? +1 : -1);
      }
      dragStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { dragStart = null; }, { passive: true });
  }

  function bindPowerupTray() {
    if (!dom.powerupTray) return;
    var slots = dom.powerupTray.querySelectorAll(".pu-slot");
    for (var i = 0; i < slots.length; i++) {
      (function (s) {
        s.addEventListener("click", function (e) {
          e.preventDefault();
          if (phase !== "playing") return;
          var pu = s.getAttribute("data-pu");
          activatePowerup(pu);
        });
      })(slots[i]);
    }
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
    if (dom.roundNextBtn) dom.roundNextBtn.addEventListener("click", function () { startNextRound(); });
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
      MrMacsDifficulty.register("cube-crash");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "cube-crash", { compact: false });
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
    if (window.MrMacsEndRecap) { MrMacsEndRecap.reset(); MrMacsEndRecap.startTracking(); }
    var recapEl = document.getElementById("endRecap");
    if (recapEl) recapEl.innerHTML = "";
    initState({});
    showScreen(null);
    phase = "playing";
    armedPowerup = null;
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state;
    initState({
      score: s.score || 0,
      cleared: s.cleared || 0,
      round: s.round || 1,
      lives: s.lives != null ? s.lives : STARTING_LIVES,
      best: readBest()
    });
    showScreen(null);
    phase = "playing";
    armedPowerup = null;
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.cleared) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Round ' + (snap.state.round || 1) + ' &middot; Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Cleared ' + (snap.state.cleared || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Cube Crash Scores</div>';
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

  // -- Boot ------------------------------------------------------------------
  function boot() {
    setupDom();
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
    var GAME_ID_LOCAL = "cube-crash";
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
