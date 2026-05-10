/* ===========================================================================
   Chronoblocks — Tetris with editorial era-shift skin · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 10x20 grid · 7 tetrominoes · SRS-lite · Era palettes
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "chronoblocks";
  var GAME_TITLE = "Chronoblocks";

  // Logical playfield + side panel.
  var COLS = 10;
  var ROWS = 20;
  var CELL = 28;
  var BOARD_W = COLS * CELL;            // 280
  var BOARD_H = ROWS * CELL;            // 560
  var PAD_TOP = 24;
  var PAD_LEFT = 28;
  var SIDE_W = 200;
  var SIDE_GAP = 24;
  var LOGICAL_W = PAD_LEFT + BOARD_W + SIDE_GAP + SIDE_W + PAD_LEFT; // 760
  var LOGICAL_H = PAD_TOP + BOARD_H + 56; // 640

  // Board origin
  var BOARD_X = PAD_LEFT;
  var BOARD_Y = PAD_TOP;
  var SIDE_X = BOARD_X + BOARD_W + SIDE_GAP;

  // Gravity per level (ms per cell)
  var GRAV_BASE = 1000;
  var GRAV_FLOOR = 50;
  var SOFT_DROP_FACTOR = 10;
  var LOCK_DELAY_MS = 500;
  var LOCK_RESET_MAX = 15;
  var SCHOLAR_INTERVAL = 25;            // every Nth piece is golden

  var SCORE_LINES = { 1: 100, 2: 300, 3: 500, 4: 800 };
  var SCORE_SOFT_PER_CELL = 1;
  var SCORE_HARD_PER_CELL = 2;
  var SCORE_SCHOLAR_BONUS = 1500;
  var SHARDS_CAP = 200;

  // -- Tetromino definitions --------------------------------------------------
  // Each shape is given as a list of rotation states. Each state is a list of
  // [col, row] offsets from the piece's pivot anchor. We use the standard SRS
  // bounding boxes for spawn orientations:
  //   I in 4x1, O in 2x2 (single state), others in 3x3 with center pivot.

  var PIECES = {
    I: {
      name: "I",
      rotations: [
        [[0,1],[1,1],[2,1],[3,1]],   // 0 — horizontal, mid row
        [[2,0],[2,1],[2,2],[2,3]],   // R
        [[0,2],[1,2],[2,2],[3,2]],   // 2
        [[1,0],[1,1],[1,2],[1,3]]    // L
      ],
      box: 4
    },
    O: {
      name: "O",
      rotations: [
        [[1,0],[2,0],[1,1],[2,1]]
      ],
      box: 4
    },
    T: {
      name: "T",
      rotations: [
        [[1,0],[0,1],[1,1],[2,1]],
        [[1,0],[1,1],[2,1],[1,2]],
        [[0,1],[1,1],[2,1],[1,2]],
        [[1,0],[0,1],[1,1],[1,2]]
      ],
      box: 3
    },
    S: {
      name: "S",
      rotations: [
        [[1,0],[2,0],[0,1],[1,1]],
        [[1,0],[1,1],[2,1],[2,2]],
        [[1,1],[2,1],[0,2],[1,2]],
        [[0,0],[0,1],[1,1],[1,2]]
      ],
      box: 3
    },
    Z: {
      name: "Z",
      rotations: [
        [[0,0],[1,0],[1,1],[2,1]],
        [[2,0],[1,1],[2,1],[1,2]],
        [[0,1],[1,1],[1,2],[2,2]],
        [[1,0],[0,1],[1,1],[0,2]]
      ],
      box: 3
    },
    L: {
      name: "L",
      rotations: [
        [[2,0],[0,1],[1,1],[2,1]],
        [[1,0],[1,1],[1,2],[2,2]],
        [[0,1],[1,1],[2,1],[0,2]],
        [[0,0],[1,0],[1,1],[1,2]]
      ],
      box: 3
    },
    J: {
      name: "J",
      rotations: [
        [[0,0],[0,1],[1,1],[2,1]],
        [[1,0],[2,0],[1,1],[1,2]],
        [[0,1],[1,1],[2,1],[2,2]],
        [[1,0],[1,1],[0,2],[1,2]]
      ],
      box: 3
    }
  };

  var PIECE_KEYS = ["I", "O", "T", "S", "Z", "L", "J"];

  // -- Era palettes (one per level) ------------------------------------------
  var ERAS = [
    {
      name: "Renaissance",
      grid: "rgba(232,184,75,0.10)",
      border: "rgba(232,184,75,0.42)",
      bg: "rgba(36, 22, 8, 0.40)",
      colors: { I: "#e8b84b", O: "#f0d068", T: "#c8922a", S: "#b07526", Z: "#8a6018", L: "#d49b3a", J: "#a07520" }
    },
    {
      name: "Age of Exploration",
      grid: "rgba(122,168,210,0.10)",
      border: "rgba(122,168,210,0.46)",
      bg: "rgba(8, 18, 36, 0.42)",
      colors: { I: "#5db5e0", O: "#e8d8a8", T: "#3a8ec0", S: "#a89878", Z: "#704b22", L: "#a8c8e0", J: "#3070a0" }
    },
    {
      name: "Industrial",
      grid: "rgba(180,180,200,0.10)",
      border: "rgba(180,180,200,0.42)",
      bg: "rgba(20, 22, 30, 0.46)",
      colors: { I: "#9ea7b8", O: "#c0a064", T: "#6b7385", S: "#5a6070", Z: "#3a3e4c", L: "#b08838", J: "#7a8090" }
    },
    {
      name: "World War I",
      grid: "rgba(124,140,86,0.12)",
      border: "rgba(124,140,86,0.46)",
      bg: "rgba(20, 22, 16, 0.46)",
      colors: { I: "#9aa66c", O: "#c0a868", T: "#7a8458", S: "#5e6a3e", Z: "#3a402a", L: "#a89058", J: "#677050" }
    },
    {
      name: "Cold War",
      grid: "rgba(120,140,200,0.10)",
      border: "rgba(220,90,110,0.46)",
      bg: "rgba(14, 12, 24, 0.46)",
      colors: { I: "#dc5a6e", O: "#5d8ce0", T: "#a82a40", S: "#3060a8", Z: "#7a1e30", L: "#d56078", J: "#3a78c8" }
    },
    {
      name: "Civil Rights",
      grid: "rgba(169,145,255,0.12)",
      border: "rgba(169,145,255,0.50)",
      bg: "rgba(18, 14, 32, 0.46)",
      colors: { I: "#a991ff", O: "#e8b84b", T: "#7d62d4", S: "#bf972e", Z: "#5a40a0", L: "#f0c860", J: "#6c52c8" }
    },
    {
      name: "Space Age",
      grid: "rgba(93,224,240,0.12)",
      border: "rgba(93,224,240,0.50)",
      bg: "rgba(6, 10, 22, 0.50)",
      colors: { I: "#5de0f0", O: "#92eef9", T: "#3aa8c0", S: "#7a92ff", Z: "#4860c0", L: "#a0e0ff", J: "#3070a8" }
    },
    {
      name: "Modern",
      grid: "rgba(240,123,184,0.12)",
      border: "rgba(82,232,160,0.50)",
      bg: "rgba(12, 8, 24, 0.46)",
      colors: { I: "#52e8a0", O: "#e8b84b", T: "#a991ff", S: "#f07bb8", Z: "#dc5a6e", L: "#5de0f0", J: "#7d62d4" }
    }
  ];

  function eraForLevel(level) {
    var idx = ((level - 1) % ERAS.length + ERAS.length) % ERAS.length;
    return ERAS[idx];
  }

  // -- Inline review bank (~28 entries) --------------------------------------
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence" },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg" },
    { prompt: "The Protestant Reformation began with:", choices: ["Luther's 95 Theses", "The Council of Trent", "Henry VIII's annulment", "Calvin's Institutes"], correctText: "Luther's 95 Theses" },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, diseases between hemispheres", "A 1492 trade treaty between Spain and Portugal", "Slave trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, diseases between hemispheres" },
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
    { prompt: "Sputnik (1957) launched by the USSR triggered:", choices: ["The U.S. space race and NASA's founding", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The U.S. space race and NASA's founding" },
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

  // -- State -----------------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;
  var canvasW = LOGICAL_W, canvasH = LOGICAL_H;

  var phase = "setup"; // setup | playing | question | paused | ended
  var prevPhase = null;
  var lastFrame = 0;
  var rafHandle = null;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

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
    move:       function () { sfxTone(180, 0.022, { type: "square", volume: 0.045, endFreq: 220 }); },
    rotate:     function () { sfxTone(280, 0.030, { type: "triangle", volume: 0.06, endFreq: 360 }); },
    softDrop:   function () { sfxTone(140, 0.018, { type: "sine", volume: 0.025, endFreq: 110 }); },
    hardDrop:   function () {
      sfxNoise(0.10, { volume: 0.22, cutoff: 700 });
      sfxTone(110, 0.18, { type: "sawtooth", volume: 0.18, endFreq: 60 });
    },
    lock:       function () { sfxTone(220, 0.06, { type: "square", volume: 0.10, endFreq: 180 }); },
    lineClear:  function (count) {
      var n = Math.max(1, Math.min(4, count | 0));
      var notes = [523, 659, 784, 988];
      for (var i = 0; i < n; i++) {
        (function (idx) {
          setTimeout(function () { sfxTone(notes[idx], 0.14, { type: "triangle", volume: 0.14 }); }, idx * 80);
        })(i);
      }
      if (n === 4) {
        setTimeout(function () { sfxTone(1175, 0.20, { type: "triangle", volume: 0.16 }); }, 400);
        setTimeout(function () { sfxTone(1568, 0.24, { type: "triangle", volume: 0.16 }); }, 520);
      }
    },
    levelUp:    function () {
      [523, 659, 784, 988, 1175].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.13, { type: "triangle", volume: 0.13 }); }, i * 70);
      });
    },
    gameOver:   function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    scholarLock: function () {
      [659, 784, 988, 1175].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 70);
      });
    },
    powerupCorrect: function () {
      [784, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("chronoCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLines = $("hudLines");
    dom.hudLevel = $("hudLevel");
    dom.hudBest = $("hudBest");
    dom.eraName = $("eraName");
    dom.eraMeta = $("eraMeta");
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
    dom.tcRotate = $("tcRotate");
    dom.tcSoft = $("tcSoft");
    dom.tcHard = $("tcHard");
    dom.tcHold = $("tcHold");
  }

  // -- Bag (7-bag randomizer) ------------------------------------------------
  function refillBag(bag) {
    var copy = PIECE_KEYS.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
    }
    for (var k = 0; k < copy.length; k++) bag.push(copy[k]);
  }

  function nextFromBag() {
    if (state.bag.length < 4) refillBag(state.bag);
    return state.bag.shift();
  }

  // -- State init ------------------------------------------------------------
  function makeEmptyGrid() {
    var g = new Array(ROWS);
    for (var r = 0; r < ROWS; r++) {
      g[r] = new Array(COLS);
      for (var c = 0; c < COLS; c++) g[r][c] = null;
    }
    return g;
  }

  function initState(opts) {
    opts = opts || {};
    state = {
      grid: makeEmptyGrid(),
      bag: [],
      score: opts.score || 0,
      lines: opts.lines || 0,
      level: opts.level || 1,
      maxCombo: 0,
      combo: 0,
      backToBack: false,
      pieceCount: 0,
      piecesUntilScholar: SCHOLAR_INTERVAL,
      schedulingScholar: false,
      // Active piece
      piece: null,
      hold: null,
      holdUsed: false,
      gravityAccum: 0,
      gravityInterval: gravityForLevel(opts.level || 1),
      lockTimer: 0,
      lockResets: 0,
      lockArmed: false,
      softDropping: false,
      softDropDistance: 0,
      // Effects
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      particles: [],
      clearAnim: null,            // { rows: [...], life, totalLife }
      eraFade: { life: 0, totalLife: 0, fromIdx: 0 },
      // Stats
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      scholarLines: 0,            // lines cleared via scholar lock
      eraReached: 1,
      time: 0,
      best: opts.best || readBest(),
      ghostFlash: 0,
      tetrisFlash: 0
    };
    refillBag(state.bag);
    spawnNextPiece();
    state.gravityInterval = gravityForLevel(state.level);
  }

  function gravityForLevel(level) {
    // Approx: level 1 = 1000ms, level 10 ~ 100ms, asymptote at 50ms.
    var lv = Math.max(1, level | 0);
    var v = GRAV_BASE * Math.pow(0.83, lv - 1);
    return Math.max(GRAV_FLOOR, v);
  }

  // -- Piece spawn / queue --------------------------------------------------
  function spawnNextPiece() {
    // Determine if this spawn is a scholar piece.
    var isScholar = false;
    if (state.piecesUntilScholar <= 0) {
      // Mark this spawned piece as scholar (forced I).
      isScholar = true;
      state.piecesUntilScholar = SCHOLAR_INTERVAL;
    } else {
      state.piecesUntilScholar--;
    }
    var key = nextFromBag();
    if (isScholar) key = "I"; // Scholar piece is always an I-tetromino.
    var def = PIECES[key];
    state.piece = {
      key: key,
      rot: 0,
      // Spawn position: near top-center. Negative row keeps piece partially above grid.
      // Use box=4 anchor for I, box=3 for others, box=4 also for O (spawn block uses 4 too).
      col: Math.floor((COLS - def.box) / 2),
      row: -1,
      isScholar: isScholar,
      shimmer: 0
    };
    state.lockTimer = 0;
    state.lockResets = 0;
    state.lockArmed = false;
    state.holdUsed = false;
    state.softDropDistance = 0;

    // Game over check: if newly spawned piece overlaps blocks at row 0/1, end.
    if (collides(state.piece, state.piece.col, state.piece.row, state.piece.rot)) {
      // Try one nudge up (room).
      if (!collides(state.piece, state.piece.col, state.piece.row - 1, state.piece.rot)) {
        state.piece.row -= 1;
      } else {
        gameOver();
      }
    }
  }

  // -- Collision / movement ------------------------------------------------
  function pieceBlocks(piece) {
    return PIECES[piece.key].rotations[piece.rot % PIECES[piece.key].rotations.length];
  }

  function collides(piece, col, row, rot) {
    var def = PIECES[piece.key];
    var rotIdx = ((rot % def.rotations.length) + def.rotations.length) % def.rotations.length;
    var blocks = def.rotations[rotIdx];
    for (var i = 0; i < blocks.length; i++) {
      var bc = col + blocks[i][0];
      var br = row + blocks[i][1];
      if (bc < 0 || bc >= COLS) return true;
      if (br >= ROWS) return true;
      if (br >= 0 && state.grid[br][bc]) return true;
    }
    return false;
  }

  function tryMove(dc, dr) {
    if (!state.piece) return false;
    var p = state.piece;
    if (collides(p, p.col + dc, p.row + dr, p.rot)) return false;
    p.col += dc;
    p.row += dr;
    // Reset lock if grounded was touched and we successfully moved.
    if (state.lockArmed && state.lockResets < LOCK_RESET_MAX) {
      state.lockTimer = 0;
      state.lockResets++;
    }
    return true;
  }

  function tryRotate(dir) {
    if (!state.piece) return false;
    var p = state.piece;
    var def = PIECES[p.key];
    var newRot = ((p.rot + dir) % def.rotations.length + def.rotations.length) % def.rotations.length;
    // SRS-lite kicks: prefer center, then 1-col on either side, 2-col on either side
    // (I-piece needs the 2-col kicks at right-wall), then a single up-nudge.
    // We test alternating directions so neither wall is favored.
    var kicks;
    if (p.key === "I") {
      // I-piece needs farther kicks, especially against the right wall.
      kicks = [
        [0, 0],
        [-1, 0], [1, 0],
        [-2, 0], [2, 0],
        [0, -1],
        [-1, -1], [1, -1],
        [-2, -1], [2, -1]
      ];
    } else {
      kicks = [
        [0, 0],
        [-1, 0], [1, 0],
        [0, -1],
        [-1, -1], [1, -1],
        [0, -2],
        [-2, 0], [2, 0]
      ];
    }
    for (var i = 0; i < kicks.length; i++) {
      var dc = kicks[i][0];
      var dr = kicks[i][1];
      if (!collides(p, p.col + dc, p.row + dr, newRot)) {
        p.col += dc;
        p.row += dr;
        p.rot = newRot;
        if (state.lockArmed && state.lockResets < LOCK_RESET_MAX) {
          state.lockTimer = 0;
          state.lockResets++;
        }
        return true;
      }
    }
    return false;
  }

  function softDrop() {
    if (!state.piece) return;
    if (tryMove(0, 1)) {
      state.score += SCORE_SOFT_PER_CELL;
      state.softDropDistance++;
    }
  }

  function hardDrop() {
    if (!state.piece) return;
    var p = state.piece;
    if (typeof p.col !== "number" || typeof p.row !== "number" ||
        isNaN(p.col) || isNaN(p.row)) return;
    var dropped = 0;
    var safety = ROWS + 4;
    while (safety-- > 0 && !collides(p, p.col, p.row + 1, p.rot)) {
      p.row += 1;
      dropped++;
    }
    state.score += dropped * SCORE_HARD_PER_CELL;
    sfx.hardDrop();
    addShake(4, 0.25);
    // Reset gravity counter so next piece doesn't inherit any bank.
    state.gravityAccum = 0;
    lockPiece();
  }

  // -- Lock / line clear ----------------------------------------------------
  function lockPiece() {
    if (!state.piece) return;
    var p = state.piece;
    var def = PIECES[p.key];
    var rotIdx = p.rot % def.rotations.length;
    var blocks = def.rotations[rotIdx];
    var era = eraForLevel(state.level);
    var fillColor = era.colors[p.key] || "#5de0f0";
    var pieceWasScholar = p.isScholar;
    var lockedRows = {};
    for (var i = 0; i < blocks.length; i++) {
      var bc = p.col + blocks[i][0];
      var br = p.row + blocks[i][1];
      if (br < 0) {
        // Locked above the visible grid → game over.
        sfx.lock();
        state.piece = null;
        gameOver();
        return;
      }
      state.grid[br][bc] = {
        color: fillColor,
        scholar: pieceWasScholar,
        key: p.key
      };
      lockedRows[br] = true;
    }
    sfx.lock();
    state.pieceCount++;

    // Find full rows.
    var fullRows = [];
    for (var r = 0; r < ROWS; r++) {
      var allFull = true;
      for (var c = 0; c < COLS; c++) {
        if (!state.grid[r][c]) { allFull = false; break; }
      }
      if (allFull) fullRows.push(r);
    }

    var clearedCount = fullRows.length;

    if (clearedCount > 0) {
      // Score
      var base = SCORE_LINES[clearedCount] || (clearedCount * 100);
      // Combo multiplier
      state.combo = (state.combo || 0) + 1;
      var comboMult = 1.0 + Math.min(0.4, (state.combo - 1) * 0.2);
      // Back-to-back bonus on tetris if previous was tetris
      var isTetris = clearedCount === 4;
      var b2bMult = 1.0;
      if (isTetris && state.backToBack) b2bMult = 1.5;
      var total = Math.round(base * state.level * comboMult * b2bMult);
      state.score += total;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.lines += clearedCount;
      // Combo callouts
      var label = "SINGLE";
      var klass = "";
      if (clearedCount === 2) label = "DOUBLE!";
      else if (clearedCount === 3) label = "TRIPLE!";
      else if (clearedCount === 4) {
        label = state.backToBack ? "BACK-TO-BACK TETRIS!" : "TETRIS!";
        klass = "is-tetris";
      }
      pushPopup(label, BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 - 30, klass);
      pushPopup("+" + total, BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 + 18, "is-score");
      // Archive Legend if combo >= 5
      if (state.combo >= 5) {
        pushPopup("ARCHIVE LEGEND!", BOARD_X + BOARD_W / 2, BOARD_Y + 90, "is-legend");
      }
      sfx.lineClear(clearedCount);
      // Particles
      for (var fri = 0; fri < fullRows.length; fri++) {
        burstRow(fullRows[fri], era);
      }
      if (isTetris) {
        state.tetrisFlash = 1;
        try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("chronoblocks", "chronoblocks-tetris"); } catch (e) {}
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 32, palette: ["#5de0f0", "#e8b84b", "#a991ff"] });
          }
        } catch (e) {}
      }
      if (state.lines >= 100) {
        try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("chronoblocks", "chronoblocks-100-lines"); } catch (e) {}
      }
      // Back-to-back stays true only on consecutive tetrises; any non-tetris clear resets it.
      state.backToBack = isTetris;

      // Mark cleared rows for animation; actual removal happens after anim.
      state.clearAnim = {
        rows: fullRows.slice(),
        life: 0.42,
        totalLife: 0.42,
        cells: collectClearedRowCells(fullRows)
      };
      addShake(isTetris ? 7 : 3, 0.30);

      // Level up?
      var newLevel = Math.floor(state.lines / 10) + 1;
      if (newLevel > state.level) advanceLevel(newLevel);
    } else {
      state.combo = 0;
    }

    // Scholar trigger: locked scholar piece + any clears => modal.
    if (pieceWasScholar && clearedCount > 0) {
      sfx.scholarLock();
      state.scholarLines += clearedCount;
      // Defer opening the modal until the clear animation finishes.
      state.pendingScholarPrompt = true;
    }

    state.piece = null;

    // If no lines were cleared, immediately spawn next.
    if (clearedCount === 0) {
      spawnNextPiece();
    }
    // If lines were cleared, the clear animation will finalize and spawn.

    updateHud();
    saveSnapshot();
  }

  function collectClearedRowCells(rows) {
    var cells = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      for (var c = 0; c < COLS; c++) {
        var b = state.grid[r][c];
        if (b) cells.push({ c: c, r: r, color: b.color });
      }
    }
    return cells;
  }

  function finalizeClearAnim() {
    if (!state.clearAnim) return;
    // Build a fresh grid by skipping every cleared row and prepending empty
    // rows on top. This handles non-contiguous cleared rows (e.g. lines 12 and
    // 16 cleared simultaneously) correctly without the earlier index drift.
    var clearedSet = {};
    for (var ci = 0; ci < state.clearAnim.rows.length; ci++) {
      clearedSet[state.clearAnim.rows[ci]] = true;
    }
    var kept = [];
    for (var rr = 0; rr < ROWS; rr++) {
      if (!clearedSet[rr]) kept.push(state.grid[rr]);
    }
    var emptyTop = [];
    var clearedCount = state.clearAnim.rows.length;
    for (var et = 0; et < clearedCount; et++) {
      var blank = new Array(COLS);
      for (var bc = 0; bc < COLS; bc++) blank[bc] = null;
      emptyTop.push(blank);
    }
    state.grid = emptyTop.concat(kept);
    state.clearAnim = null;

    // If a scholar prompt is pending, open it (paused gameplay).
    if (state.pendingScholarPrompt) {
      state.pendingScholarPrompt = false;
      openScholarQuestion();
      return; // don't spawn next yet — spawn happens after question close
    }

    // Otherwise spawn next piece.
    spawnNextPiece();
  }

  function advanceLevel(newLevel) {
    var prevIdx = ((state.level - 1) % ERAS.length + ERAS.length) % ERAS.length;
    state.level = newLevel;
    state.eraReached = Math.max(state.eraReached, newLevel);
    state.gravityInterval = gravityForLevel(newLevel);
    sfx.levelUp();
    // Trigger era-fade overlay
    state.eraFade.life = 0.6;
    state.eraFade.totalLife = 0.6;
    state.eraFade.fromIdx = prevIdx;
    pushPopup("ERA · " + eraForLevel(newLevel).name.toUpperCase(), BOARD_X + BOARD_W / 2, BOARD_Y + 60, "is-bonus");
    saveSnapshot();
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        var era = eraForLevel(newLevel);
        window.MrMacsCelebration.burst({ count: 18, palette: [era.colors.I, era.colors.O, era.colors.T] });
      }
    } catch (e) {}
  }

  // -- Hold piece -----------------------------------------------------------
  function holdSwap() {
    if (state.holdUsed || !state.piece) return;
    var keyToHold = state.piece.key;
    var prior = state.hold;
    if (prior) {
      // Spawn from hold
      state.piece = {
        key: prior,
        rot: 0,
        col: Math.floor((COLS - PIECES[prior].box) / 2),
        row: -1,
        isScholar: false,
        shimmer: 0
      };
      if (collides(state.piece, state.piece.col, state.piece.row, state.piece.rot)) {
        gameOver();
        return;
      }
    } else {
      // No prior hold: pull next from queue.
      state.piece = null;
      // Need to skip scholar override — direct bag pull only.
      var nk = nextFromBag();
      var pdef = PIECES[nk];
      state.piece = {
        key: nk,
        rot: 0,
        col: Math.floor((COLS - pdef.box) / 2),
        row: -1,
        isScholar: false,
        shimmer: 0
      };
      if (collides(state.piece, state.piece.col, state.piece.row, state.piece.rot)) {
        gameOver();
        return;
      }
    }
    state.hold = keyToHold;
    // Lock the hold for this lifecycle of the new active piece.
    state.holdUsed = true;
    state.lockTimer = 0;
    state.lockResets = 0;
    state.lockArmed = false;
    state.gravityAccum = 0;
    state.softDropDistance = 0;
    sfx.rotate();
  }

  // -- Particles / popups / shake -------------------------------------------
  function burstRow(row, era) {
    if (reducedMotion) return;
    for (var c = 0; c < COLS; c++) {
      var b = state.grid[row] ? state.grid[row][c] : null;
      var color = (b && b.color) || era.colors.I || "#5de0f0";
      var x = BOARD_X + c * CELL + CELL / 2;
      var y = BOARD_Y + row * CELL + CELL / 2;
      for (var i = 0; i < 3; i++) {
        var ang = Math.random() * Math.PI * 2;
        var spd = 80 + Math.random() * 180;
        state.particles.push({
          x: x, y: y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0.6 + Math.random() * 0.4,
          totalLife: 0.7,
          color: color,
          size: 1.6 + Math.random() * 2.2
        });
      }
    }
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

  // -- Update loop -----------------------------------------------------------
  function updateGame(dt) {
    if (!state) return;
    tickDas(dt);
    state.time += dt;

    // Era fade tick
    if (state.eraFade.life > 0) state.eraFade.life = Math.max(0, state.eraFade.life - dt);
    if (state.tetrisFlash > 0) state.tetrisFlash = Math.max(0, state.tetrisFlash - dt * 2);

    // Particles
    var alive = [];
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.vy += 60 * dt;
      p.life -= dt;
      if (p.life > 0) alive.push(p);
    }
    state.particles = alive;

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

    // Clear animation tick
    if (state.clearAnim) {
      state.clearAnim.life -= dt;
      if (state.clearAnim.life <= 0) {
        finalizeClearAnim();
      }
    } else if (phase === "playing" && state.piece) {
      // Gravity / lock
      var gInterval = state.softDropping ? Math.max(20, state.gravityInterval / SOFT_DROP_FACTOR) : state.gravityInterval;
      state.gravityAccum += dt * 1000;
      while (state.gravityAccum >= gInterval && state.piece && phase === "playing") {
        state.gravityAccum -= gInterval;
        // Try to drop one cell
        if (!collides(state.piece, state.piece.col, state.piece.row + 1, state.piece.rot)) {
          state.piece.row += 1;
          if (state.softDropping) state.score += SCORE_SOFT_PER_CELL;
        } else {
          // Grounded: arm lock if not armed; otherwise tick lock timer
          if (!state.lockArmed) {
            state.lockArmed = true;
            state.lockTimer = 0;
          }
          break;
        }
      }
      // Lock timer
      if (state.lockArmed && state.piece) {
        // Check if still grounded (player may have moved off floor)
        if (!collides(state.piece, state.piece.col, state.piece.row + 1, state.piece.rot)) {
          // No longer grounded — disarm
          state.lockArmed = false;
          state.lockTimer = 0;
        } else {
          state.lockTimer += dt * 1000;
          if (state.lockTimer >= LOCK_DELAY_MS) {
            lockPiece();
          }
        }
      }
    }

    // Piece shimmer (scholar)
    if (state.piece && state.piece.isScholar) state.piece.shimmer = (state.piece.shimmer || 0) + dt;

    // HUD periodic refresh
    updateHud();
  }

  // -- Rendering -------------------------------------------------------------
  function clearCanvas() {
    ctx.save();
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.restore();
  }

  function drawBackground() {
    var era = eraForLevel(state.level);
    // Faded transition between previous and current era during eraFade
    var eraColor = era.bg;
    if (state.eraFade.life > 0) {
      // pseudo-fade: just overlay a semi-transparent flash (kept subtle to avoid strobing)
      var t = state.eraFade.life / state.eraFade.totalLife;
      var flashAlpha = reducedMotion ? 0 : t * 0.09;
      ctx.fillStyle = "rgba(255,255,255," + flashAlpha.toFixed(3) + ")";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }
    // Background layers
    var grd = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H * 0.3, LOGICAL_W * 0.05, LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W * 0.7);
    grd.addColorStop(0, "rgba(20, 30, 60, 0.35)");
    grd.addColorStop(1, "rgba(2, 4, 12, 0.0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Board background
    ctx.fillStyle = eraColor;
    ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
    // Tetris flash overlay
    if (state.tetrisFlash > 0) {
      ctx.fillStyle = "rgba(255, 232, 160, " + (state.tetrisFlash * 0.3).toFixed(3) + ")";
      ctx.fillRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
    }
  }

  function drawGridLines() {
    var era = eraForLevel(state.level);
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    ctx.strokeStyle = era.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var c = 0; c <= COLS; c++) {
      var x = BOARD_X + c * CELL + 0.5;
      ctx.moveTo(x, BOARD_Y);
      ctx.lineTo(x, BOARD_Y + BOARD_H);
    }
    for (var r = 0; r <= ROWS; r++) {
      var y = BOARD_Y + r * CELL + 0.5;
      ctx.moveTo(BOARD_X, y);
      ctx.lineTo(BOARD_X + BOARD_W, y);
    }
    ctx.stroke();
    // Outer border
    ctx.strokeStyle = era.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(BOARD_X + 1, BOARD_Y + 1, BOARD_W - 2, BOARD_H - 2);
    ctx.restore();
  }

  function drawLockedBlocks() {
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    var hideRows = {};
    if (state.clearAnim) {
      // During clear animation, hide cleared rows in normal rendering and draw shrinking variant.
      for (var ri = 0; ri < state.clearAnim.rows.length; ri++) {
        hideRows[state.clearAnim.rows[ri]] = true;
      }
    }
    for (var r = 0; r < ROWS; r++) {
      if (hideRows[r]) continue;
      for (var c = 0; c < COLS; c++) {
        var b = state.grid[r][c];
        if (!b) continue;
        drawCell(BOARD_X + c * CELL, BOARD_Y + r * CELL, b.color, { locked: true, scholar: b.scholar });
      }
    }
    ctx.restore();
  }

  function drawClearAnim() {
    if (!state.clearAnim) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    var t = 1 - (state.clearAnim.life / state.clearAnim.totalLife);
    var alpha = Math.max(0, 1 - t);
    var scaleAxis = Math.max(0, 1 - t);
    // Bright flash overlay on rows
    for (var i = 0; i < state.clearAnim.rows.length; i++) {
      var r = state.clearAnim.rows[i];
      var flashAlpha = (1 - t) * 0.65;
      ctx.fillStyle = "rgba(255,255,255," + flashAlpha.toFixed(3) + ")";
      ctx.fillRect(BOARD_X, BOARD_Y + r * CELL, BOARD_W, CELL);
    }
    // Shrink-fade cells
    var cells = state.clearAnim.cells;
    for (var k = 0; k < cells.length; k++) {
      var cell = cells[k];
      var cx = BOARD_X + cell.c * CELL + CELL / 2;
      var cy = BOARD_Y + cell.r * CELL + CELL / 2;
      var size = CELL * scaleAxis;
      ctx.globalAlpha = alpha;
      drawCell(cx - size / 2, cy - size / 2, cell.color, { locked: true, custom: size });
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawGhost() {
    if (!state.piece) return;
    var p = state.piece;
    // Guard against NaN positions or invalid pieces during state transitions.
    if (typeof p.col !== "number" || typeof p.row !== "number" ||
        isNaN(p.col) || isNaN(p.row) || !PIECES[p.key]) return;
    // Compute ghost row by dropping in place. Bound the loop so a corrupted
    // piece can never create an infinite loop.
    var gr = p.row;
    var safety = ROWS + 4;
    while (safety-- > 0 && !collides(p, p.col, gr + 1, p.rot)) gr++;
    if (gr === p.row) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    var def = PIECES[p.key];
    var blocks = def.rotations[p.rot % def.rotations.length];
    var era = eraForLevel(state.level);
    var color = era.colors[p.key] || "#5de0f0";
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    for (var i = 0; i < blocks.length; i++) {
      var bc = p.col + blocks[i][0];
      var br = gr + blocks[i][1];
      if (br < 0) continue;
      var x = BOARD_X + bc * CELL + 1.5;
      var y = BOARD_Y + br * CELL + 1.5;
      ctx.strokeRect(x, y, CELL - 3, CELL - 3);
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawActivePiece() {
    if (!state.piece) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    var p = state.piece;
    var def = PIECES[p.key];
    var blocks = def.rotations[p.rot % def.rotations.length];
    var era = eraForLevel(state.level);
    var color = era.colors[p.key] || "#5de0f0";
    if (p.isScholar) {
      // Shimmer between gold and cyan
      var s = (Math.sin(p.shimmer * 4) + 1) / 2;
      color = lerpColor("#e8b84b", "#5de0f0", s);
    }
    for (var i = 0; i < blocks.length; i++) {
      var bc = p.col + blocks[i][0];
      var br = p.row + blocks[i][1];
      if (br < 0) continue;
      drawCell(BOARD_X + bc * CELL, BOARD_Y + br * CELL, color, { active: true, scholar: p.isScholar });
    }
    ctx.restore();
  }

  function drawCell(x, y, color, opts) {
    opts = opts || {};
    var size = opts.custom != null ? opts.custom : CELL;
    var inner = size - 2;
    if (inner <= 0) return;
    // Body
    ctx.save();
    if (opts.locked) {
      ctx.fillStyle = applyBrightness(color, 0.78);
    } else {
      ctx.fillStyle = color;
    }
    ctx.fillRect(x + 1, y + 1, inner, inner);
    // Inner highlight
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(x + 2, y + 2, inner - 1, Math.max(1, inner * 0.22));
    ctx.fillRect(x + 2, y + 2, Math.max(1, inner * 0.22), inner - 1);
    // Inner shadow
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x + 1, y + size - Math.max(2, size * 0.18) - 1, inner, Math.max(2, size * 0.18));
    ctx.fillRect(x + size - Math.max(2, size * 0.18) - 1, y + 1, Math.max(2, size * 0.18), inner);
    ctx.globalAlpha = 1;
    // Outline
    ctx.strokeStyle = applyBrightness(color, 1.25);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, size - 1.5, size - 1.5);
    if (opts.scholar) {
      // Gold halo
      ctx.strokeStyle = "rgba(255, 232, 160, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 2.5, y + 2.5, size - 5, size - 5);
    }
    ctx.restore();
  }

  function drawSidePanel() {
    var era = eraForLevel(state.level);
    var x = SIDE_X;
    var y = BOARD_Y;
    // Panel container
    ctx.save();
    ctx.translate(state.shake.x * 0.4, state.shake.y * 0.4);
    ctx.fillStyle = "rgba(4, 8, 18, 0.55)";
    ctx.fillRect(x, y, SIDE_W, BOARD_H);
    ctx.strokeStyle = era.border;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(x + 0.5, y + 0.5, SIDE_W - 1, BOARD_H - 1);

    // ERA label
    drawSidePanelText("ERA", x + 16, y + 22, "#8aa0c8", "10px", true);
    drawSidePanelText(era.name.toUpperCase(), x + 16, y + 44, era.colors.I, "16px", false, "Fraunces");

    // NEXT preview
    drawSidePanelText("NEXT", x + 16, y + 80, "#8aa0c8", "10px", true);
    drawPiecePreview(x + 16, y + 96, x + 16 + (SIDE_W - 32), y + 96 + 80, peekNext());

    // HOLD preview
    drawSidePanelText("HOLD", x + 16, y + 196, "#8aa0c8", "10px", true);
    if (state.hold) {
      drawPiecePreview(x + 16, y + 212, x + 16 + (SIDE_W - 32), y + 212 + 80, state.hold);
    } else {
      drawSidePanelText("(empty)", x + 16, y + 240, "#5e6a85", "12px", false);
    }

    // STATS
    drawSidePanelText("LINES", x + 16, y + 320, "#8aa0c8", "10px", true);
    drawSidePanelText(String(state.lines), x + 16, y + 342, "#f0f5ff", "20px", false, "JetBrains Mono");

    drawSidePanelText("LEVEL", x + 16, y + 374, "#8aa0c8", "10px", true);
    drawSidePanelText(String(state.level), x + 16, y + 396, "#f0f5ff", "20px", false, "JetBrains Mono");

    drawSidePanelText("COMBO", x + 16, y + 428, "#8aa0c8", "10px", true);
    drawSidePanelText("x" + state.combo, x + 16, y + 450, state.combo > 0 ? era.colors.I : "#5e6a85", "20px", false, "JetBrains Mono");

    if (state.backToBack) {
      drawSidePanelText("B2B READY", x + 16, y + 484, "#e8b84b", "10px", true);
    }

    // Soft hint about scholar piece
    var until = Math.max(0, state.piecesUntilScholar);
    drawSidePanelText("SCHOLAR IN", x + 16, BOARD_Y + BOARD_H - 36, "#8aa0c8", "9px", true);
    drawSidePanelText(until + " pieces", x + 16, BOARD_Y + BOARD_H - 16, "#e8b84b", "12px", false, "JetBrains Mono");
    ctx.restore();
  }

  function drawSidePanelText(text, x, y, color, size, upper, family) {
    ctx.save();
    ctx.fillStyle = color;
    var fam = family || "Inter";
    var weight = upper ? "700" : "800";
    ctx.font = weight + " " + size + " '" + fam + "', sans-serif";
    if (upper) ctx.font = "700 " + size + " 'JetBrains Mono', monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function peekNext() {
    if (state.bag.length < 1) refillBag(state.bag);
    return state.bag[0];
  }

  function drawPiecePreview(x0, y0, x1, y1, key) {
    if (!key) return;
    var def = PIECES[key];
    var era = eraForLevel(state.level);
    var color = era.colors[key] || "#5de0f0";
    var blocks = def.rotations[0];
    // Compute bbox
    var minC = 99, minR = 99, maxC = -99, maxR = -99;
    for (var i = 0; i < blocks.length; i++) {
      minC = Math.min(minC, blocks[i][0]);
      minR = Math.min(minR, blocks[i][1]);
      maxC = Math.max(maxC, blocks[i][0]);
      maxR = Math.max(maxR, blocks[i][1]);
    }
    var w = (maxC - minC + 1);
    var h = (maxR - minR + 1);
    var availW = x1 - x0;
    var availH = y1 - y0;
    var cs = Math.min(Math.floor(availW / w), Math.floor(availH / h), 22);
    var totalW = cs * w;
    var totalH = cs * h;
    var ox = x0 + Math.floor((availW - totalW) / 2);
    var oy = y0 + Math.floor((availH - totalH) / 2);
    for (var k = 0; k < blocks.length; k++) {
      var bc = blocks[k][0] - minC;
      var br = blocks[k][1] - minR;
      drawPreviewCell(ox + bc * cs, oy + br * cs, cs, color);
    }
  }

  function drawPreviewCell(x, y, size, color) {
    var inner = size - 2;
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, inner, inner);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(x + 2, y + 2, Math.max(1, inner * 0.45), Math.max(1, inner * 0.18));
    ctx.globalAlpha = 1;
    ctx.strokeStyle = applyBrightness(color, 1.3);
    ctx.lineWidth = 1.3;
    ctx.strokeRect(x + 0.75, y + 0.75, size - 1.5, size - 1.5);
    ctx.restore();
  }

  function drawParticles() {
    if (!state.particles.length) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var t = Math.max(0, p.life / Math.max(0.01, p.totalLife));
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // hex like #aabbcc; t in 0..1
  function lerpColor(a, b, t) {
    var ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
    var br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    var r = Math.round(ar + (br - ar) * t);
    var g = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
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
    drawGridLines();
    drawLockedBlocks();
    drawClearAnim();
    drawGhost();
    drawActivePiece();
    drawParticles();
    drawSidePanel();

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
    } else if (phase === "ended" || phase === "paused" || phase === "question") {
      // tick particles + shake decay so animations finish gracefully
      if (state) {
        // partial update: only effects
        var alive = [];
        for (var i = 0; i < state.particles.length; i++) {
          var p = state.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.vy += 60 * dt;
          p.life -= dt;
          if (p.life > 0) alive.push(p);
        }
        state.particles = alive;
        if (state.shake.life > 0) {
          state.shake.life -= dt;
          var k2 = Math.max(0, state.shake.life / Math.max(0.01, state.shake.totalLife));
          var inten = state.shake.intensity * k2;
          state.shake.x = (Math.random() - 0.5) * inten * 2;
          state.shake.y = (Math.random() - 0.5) * inten * 2;
        } else {
          state.shake.x = 0; state.shake.y = 0;
        }
        if (state.tetrisFlash > 0) state.tetrisFlash = Math.max(0, state.tetrisFlash - dt * 2);
        if (state.eraFade.life > 0) state.eraFade.life = Math.max(0, state.eraFade.life - dt);
      }
    }
    render();
    if (ts - lastSnapshotTs > 10000) { lastSnapshotTs = ts; saveSnapshot(); }
  }

  // -- HUD -------------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLines) dom.hudLines.textContent = state.lines;
    if (dom.hudLevel) dom.hudLevel.textContent = state.level;
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.eraName) dom.eraName.textContent = eraForLevel(state.level).name;
    if (dom.eraMeta) dom.eraMeta.textContent = "Gravity · " + Math.round(state.gravityInterval) + " ms";
  }

  function formatNumber(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Piece · Optional · +" + SCORE_SCHOLAR_BONUS + " score · clear bottom 2 rows";
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
      dom.explanation.textContent = "Decoded! +" + SCORE_SCHOLAR_BONUS + " score · bottom 2 rows clearing.";
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
      sfx.powerupCorrect();
      // Clear bottom 2 rows: rows shift down to fill (top shifts down, new empty rows on top).
      var bottomTwo = [ROWS - 1, ROWS - 2];
      // Burst particles
      var era = eraForLevel(state.level);
      for (var bi = 0; bi < bottomTwo.length; bi++) burstRow(bottomTwo[bi], era);
      // Remove rows by shifting everything above each down (process bottom-up from the BOTTOM).
      // Simpler: drop the bottom 2 rows by replacing them with rows from above, then nulling the top 2.
      for (var rr = ROWS - 1; rr >= 2; rr--) {
        state.grid[rr] = state.grid[rr - 2];
      }
      state.grid[0] = new Array(COLS); for (var ca = 0; ca < COLS; ca++) state.grid[0][ca] = null;
      state.grid[1] = new Array(COLS); for (var cb = 0; cb < COLS; cb++) state.grid[1][cb] = null;
      pushPopup("+" + SCORE_SCHOLAR_BONUS, BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2, "is-bonus");
      addShake(5, 0.3);
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#e8b84b", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
    }
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    // Spawn next piece (the scholar piece had locked & cleared).
    if (!state.piece) spawnNextPiece();
    updateHud();
  }

  function skipQuestion() {
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    if (!state.piece) spawnNextPiece();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // -- Game over -------------------------------------------------------------
  function gameOver() {
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
    if (dom.endKicker) dom.endKicker.textContent = "Stack Sealed";
    if (dom.endTitle) dom.endTitle.textContent = "Chronoblocks · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Lines</div><div class="end-cell-value">' + state.lines + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Level</div><div class="end-cell-value">' + state.level + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Combo</div><div class="end-cell-value">x' + state.maxCombo + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Era Reached</div><div class="end-cell-value" style="font-size:14px">' + eraForLevel(state.eraReached).name + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>'
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
    canvasW = LOGICAL_W;
    canvasH = LOGICAL_H;
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { lines: state.lines, level: state.level });
      }
    } catch (e) {}
  }

  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          lines: state.lines,
          level: state.level,
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
          file: "games/chronoblocks/index.html"
        });
      }
    } catch (e) {}
  }

  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("chronoblocks:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("chronoblocks:best", String(v));
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
  // DAS / ARR-lite: when you hold left/right, repeat after a delay.
  var dasTimer = 0;
  var dasDir = 0;
  var dasFirst = false;
  var DAS_DELAY = 170;
  var DAS_REPEAT = 50;

  function tickDas(dt) {
    if (dasDir === 0) return;
    dasTimer += dt * 1000;
    if (dasFirst) {
      if (dasTimer >= DAS_DELAY) {
        dasFirst = false;
        dasTimer = 0;
      }
    } else {
      while (dasTimer >= DAS_REPEAT) {
        dasTimer -= DAS_REPEAT;
        if (tryMove(dasDir, 0)) sfx.move();
      }
    }
  }

  function bindInput() {
    document.addEventListener("keydown", function (e) {
      if (e.repeat) return; // we manage DAS ourselves
      var k = e.key;
      if (phase === "playing") {
        if (k === "ArrowLeft") {
          if (tryMove(-1, 0)) sfx.move();
          dasDir = -1; dasFirst = true; dasTimer = 0;
          e.preventDefault();
          return;
        }
        if (k === "ArrowRight") {
          if (tryMove(1, 0)) sfx.move();
          dasDir = 1; dasFirst = true; dasTimer = 0;
          e.preventDefault();
          return;
        }
        if (k === "ArrowDown") {
          state.softDropping = true;
          softDrop();
          sfx.softDrop();
          e.preventDefault();
          return;
        }
        if (k === "ArrowUp" || k === "x" || k === "X") {
          if (tryRotate(1)) sfx.rotate();
          e.preventDefault();
          return;
        }
        if (k === "z" || k === "Z") {
          if (tryRotate(-1)) sfx.rotate();
          e.preventDefault();
          return;
        }
        if (k === " " || e.code === "Space") {
          hardDrop();
          e.preventDefault();
          return;
        }
        if (k === "Shift" || k === "c" || k === "C") {
          holdSwap();
          e.preventDefault();
          return;
        }
        if (k === "p" || k === "P") {
          togglePause();
          e.preventDefault();
          return;
        }
      }
      if ((phase === "paused") && (k === "p" || k === "P" || k === " ")) {
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
      if (k === "ArrowLeft" && dasDir === -1) { dasDir = 0; dasTimer = 0; }
      if (k === "ArrowRight" && dasDir === 1) { dasDir = 0; dasTimer = 0; }
      if (k === "ArrowDown") { if (state) state.softDropping = false; }
    });

    // Touch + virtual buttons
    bindTouchControls();
  }

  function bindTouchControls() {
    function pressBtn(btn, fn) {
      if (!btn) return;
      btn.addEventListener("click", function (e) { e.preventDefault(); if (phase === "playing") fn(); });
      btn.addEventListener("touchstart", function (e) { e.preventDefault(); if (phase === "playing") fn(); }, { passive: false });
    }
    pressBtn(dom.tcLeft, function () { if (tryMove(-1, 0)) sfx.move(); });
    pressBtn(dom.tcRight, function () { if (tryMove(1, 0)) sfx.move(); });
    pressBtn(dom.tcRotate, function () { if (tryRotate(1)) sfx.rotate(); });
    pressBtn(dom.tcSoft, function () { softDrop(); sfx.softDrop(); });
    pressBtn(dom.tcHard, function () { hardDrop(); });
    pressBtn(dom.tcHold, function () { holdSwap(); });

    // Swipe gestures on canvas
    var touchStart = null;
    canvas.addEventListener("touchstart", function (e) {
      if (e.touches && e.touches.length === 2) {
        // two-finger tap = hold
        if (phase === "playing") holdSwap();
        return;
      }
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY, ts: Date.now() };
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      if (!touchStart) return;
      var t = (e.changedTouches && e.changedTouches[0]) || null;
      if (!t) { touchStart = null; return; }
      var dx = t.clientX - touchStart.x;
      var dy = t.clientY - touchStart.y;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      var elapsed = Date.now() - touchStart.ts;
      if (ax < 24 && ay < 24 && elapsed < 250) {
        // tap to rotate
        if (phase === "playing") { if (tryRotate(1)) sfx.rotate(); }
        touchStart = null;
        return;
      }
      if (phase === "playing") {
        if (ax > ay) {
          if (dx > 0) { if (tryMove(1, 0)) sfx.move(); }
          else { if (tryMove(-1, 0)) sfx.move(); }
        } else if (dy > 0) {
          // swipe down: hard drop
          hardDrop();
        } else {
          if (tryRotate(1)) sfx.rotate();
        }
      }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });
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
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state;
    initState({
      score: s.score || 0,
      lines: s.lines || 0,
      level: s.level || 1,
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
    if (snap && snap.state && (snap.state.score || snap.state.lines) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Lines ' + (snap.state.lines || 0) +
        ' &middot; Level ' + (snap.state.level || 1) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Chronoblocks Scores</div>';
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
})();
