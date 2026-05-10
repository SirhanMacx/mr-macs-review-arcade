/* ===========================================================================
   Citadel — Bejeweled match-3 · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x800 outer, 640x640 board (8x8, 64px cells)
   Cascades · special gems · scholar gems · power-ups
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "citadel";
  var GAME_TITLE = "Citadel";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 800;

  // Grid geometry
  var GRID = 8;
  var CELL = 64;
  var BOARD_W = GRID * CELL;          // 512? No — 8*64 = 512. Reset to fit.
  // Reset: 8*72 = 576, 8*64 = 512. We want 640. Use CELL = 80.
  // Re-correct: spec says 8x8 grid each cell ~64px, board 640x640.
  // Wait — 10 cells of 64 = 640. Spec literally says "8×8, each cell ~64px.
  // Logical canvas 640×640 (board) inside 720×800 outer."
  // 8*64 = 512, not 640. Use 80px cells to fit 640.
  // Going with CELL = 80 to match the 640 board (more comfortable),
  // and grid 8x8.
  var CELL_PX = 80;
  var BOARD_PX = GRID * CELL_PX;       // 640
  var BOARD_X0 = (LOGICAL_W - BOARD_PX) / 2;  // 40
  var BOARD_Y0 = 132;                          // leaves room for HUD + ribbon
  var GEM_PADDING = 6;                         // gap between gem edge and cell

  // Gem types (6 disciplines)
  var TYPE_HISTORY   = 0;   // scroll
  var TYPE_SCIENCE   = 1;   // atom
  var TYPE_ART       = 2;   // palette
  var TYPE_LANGUAGE  = 3;   // quill
  var TYPE_MATH      = 4;   // compass
  var TYPE_GEOGRAPHY = 5;   // globe
  var TYPE_COUNT = 6;

  var TYPE_NAMES = ["History", "Science", "Art", "Language", "Math", "Geography"];
  var TYPE_GLYPHS = ["scroll", "atom", "palette", "quill", "compass", "globe"];

  // Discipline colors (must match :root vars in styles.css)
  var GEM_COLORS = [
    { base: "#d04848", light: "#ff7c7c", dark: "#7a2424", rim: "#ffb0b0" }, // history (ember-red)
    { base: "#5de0f0", light: "#a8f4ff", dark: "#22808c", rim: "#bff5ff" }, // science (cyan)
    { base: "#a991ff", light: "#d4c5ff", dark: "#5a4fa0", rim: "#e0d4ff" }, // art (violet)
    { base: "#4dd49b", light: "#9af2c3", dark: "#1a805a", rim: "#b8f5d8" }, // language (emerald)
    { base: "#f5c451", light: "#ffe091", dark: "#a8821c", rim: "#ffe6a8" }, // math (gold)
    { base: "#6a7ee0", light: "#a8b4f5", dark: "#3a4288", rim: "#c8d0fa" }  // geography (indigo)
  ];

  // Special gem subtypes (negative gem.special > 0 = special)
  var SPEC_NONE = 0;
  var SPEC_STRIKER_H = 1;   // clears row
  var SPEC_STRIKER_V = 2;   // clears column
  var SPEC_BOMB = 3;        // 3x3 around it
  var SPEC_CODEX = 4;       // rainbow — clears all of swapped color
  var SPEC_OBSTACLE = 5;    // 2-hit chained gem (level 5+)

  // Scoring
  var SCORE_3   = 50;
  var SCORE_4   = 100;
  var SCORE_5   = 200;
  var SCORE_LT  = 300;
  var SCORE_SPECIAL_CLEAR = 30; // per gem cleared by a special trigger

  // Level config
  var LIVES_INIT = 3;
  var SHARDS_CAP = 200;
  var BONUS_LIFE_THRESHOLD = 12000;
  var SCHOLAR_EVERY_N_MATCHES = 25;
  var POWERUP_DROP_RATE = 0.04;       // ~4% per cascade event
  var POWERUP_MAX = 3;
  var OBSTACLE_LEVEL = 5;
  var RESHUFFLE_LEVEL = 4;

  // Animation
  var SWAP_MS = 200;
  var POP_MS = 200;
  var FALL_MS_PER_CELL = 60;
  var REVERT_MS = 200;
  var HITPAUSE_FRAMES = 3;

  // Timing
  var SNAPSHOT_INTERVAL_MS = 10000;

  // -- Question pool (scholar gem prompts) -----------------------------------
  var QUESTIONS = [
    { q: "Which empire built the Colosseum?", choices: ["Roman", "Greek", "Persian", "Egyptian"], correct: 0, hint: "Capital was Rome." },
    { q: "Photosynthesis converts what into glucose?", choices: ["CO2 and water", "Nitrogen and oxygen", "Methane and water", "Sulfur and hydrogen"], correct: 0, hint: "Plants pull this from air and soil." },
    { q: "Mona Lisa was painted by:", choices: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], correct: 0, hint: "Italian polymath, also designed flying machines." },
    { q: "The longest river in South America is the:", choices: ["Amazon", "Nile", "Yangtze", "Mississippi"], correct: 0, hint: "Flows through Brazil into the Atlantic." },
    { q: "What is the square root of 144?", choices: ["12", "14", "10", "16"], correct: 0, hint: "12 x 12 = 144." },
    { q: "A noun is a word that names a:", choices: ["Person, place, thing, or idea", "Action", "Description", "Connection"], correct: 0, hint: "Verbs are actions; this is the subject." },
    { q: "The Magna Carta (1215) limited the power of the:", choices: ["English king", "Pope", "Holy Roman Emperor", "Sultan"], correct: 0, hint: "King John signed it under baron pressure." },
    { q: "Which planet is closest to the sun?", choices: ["Mercury", "Venus", "Earth", "Mars"], correct: 0, hint: "Smallest planet too." },
    { q: "Beethoven's Symphony No. 9 famously includes a vocal:", choices: ["'Ode to Joy'", "'Ave Maria'", "'Hallelujah'", "'Te Deum'"], correct: 0, hint: "Sets a Schiller poem." },
    { q: "Mount Everest is in which mountain range?", choices: ["Himalayas", "Andes", "Alps", "Rockies"], correct: 0, hint: "Border of Nepal and China." },
    { q: "What is 7 x 8?", choices: ["56", "54", "64", "48"], correct: 0, hint: "Memorize this one." },
    { q: "'Et tu, Brute?' is from:", choices: ["Shakespeare's Julius Caesar", "Homer's Odyssey", "Dante's Inferno", "Virgil's Aeneid"], correct: 0, hint: "Caesar's last words on stage." },
    { q: "The Black Death of the 1340s was caused by:", choices: ["A bacterial plague", "Cholera", "Smallpox", "Influenza"], correct: 0, hint: "Spread by fleas on rats." },
    { q: "DNA's structure is a:", choices: ["Double helix", "Single strand", "Ring", "Cube lattice"], correct: 0, hint: "Watson and Crick, 1953." },
    { q: "Picasso's 'Guernica' protested:", choices: ["The bombing of a Spanish town", "World War I trenches", "The French Revolution", "The Holocaust"], correct: 0, hint: "Spanish Civil War, 1937." },
    { q: "Which country has the largest population?", choices: ["India", "China", "United States", "Indonesia"], correct: 0, hint: "Surpassed China in 2023." },
    { q: "The slope-intercept form of a line is:", choices: ["y = mx + b", "ax^2 + bx + c", "y = a/x", "x^2 + y^2 = r^2"], correct: 0, hint: "m is slope, b is y-intercept." },
    { q: "A 'pronoun' replaces a:", choices: ["Noun", "Verb", "Adjective", "Adverb"], correct: 0, hint: "Like 'she' or 'they'." },
    { q: "The 13th Amendment to the U.S. Constitution:", choices: ["Abolished slavery", "Granted women's suffrage", "Ended Prohibition", "Established income tax"], correct: 0, hint: "Ratified December 1865." },
    { q: "Newton's third law states that:", choices: ["For every action there's an equal and opposite reaction", "Force equals mass times acceleration", "An object at rest stays at rest", "Energy is conserved"], correct: 0, hint: "Action–reaction pairs." },
    { q: "Impressionist painters worked primarily in:", choices: ["19th-century France", "Renaissance Italy", "Edo Japan", "Mughal India"], correct: 0, hint: "Monet, Renoir, Degas." },
    { q: "The Sahara desert is in:", choices: ["North Africa", "South America", "Central Asia", "Australia"], correct: 0, hint: "Stretches across multiple countries." },
    { q: "If a triangle has angles 60-60-60 it is:", choices: ["Equilateral", "Right", "Scalene", "Obtuse"], correct: 0, hint: "All sides equal." },
    { q: "Which Shakespeare play features the 'star-crossed lovers'?", choices: ["Romeo and Juliet", "Hamlet", "Macbeth", "Othello"], correct: 0, hint: "Verona, Italy setting." },
    { q: "The Berlin Wall fell in:", choices: ["1989", "1979", "1961", "1991"], correct: 0, hint: "Same year as the Velvet Revolution." },
    { q: "Which gas is most abundant in Earth's atmosphere?", choices: ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"], correct: 0, hint: "About 78%." },
    { q: "Cubism was co-founded by Picasso and:", choices: ["Georges Braque", "Salvador Dali", "Henri Matisse", "Edgar Degas"], correct: 0, hint: "French painter from Le Havre." },
    { q: "Pi (π) is approximately:", choices: ["3.14159", "2.71828", "1.41421", "1.61803"], correct: 0, hint: "Ratio of circumference to diameter." }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | swapping | matching | falling | refilling | reverting | levelClear | paused | question | colorPick | activating | ended
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var lastBonusLifeThreshold = 0;

  // Hit-pause flag — frames left to skip update
  var hitPauseFrames = 0;

  // Screen shake
  var shakeT = 0;
  var shakeAmp = 0;

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
    var vol = opts.volume == null ? 0.14 : opts.volume;
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
      src.connect(gain).connect(ctxA.destination);
      src.start();
    } catch (e) {}
  }

  var sfx = {
    select:           function () { sfxTone(620, 0.06, { type: "sine", volume: 0.10 }); },
    swap:             function () { sfxTone(440, 0.08, { type: "triangle", volume: 0.13, endFreq: 660 }); },
    swapInvalid:      function () { sfxTone(220, 0.18, { type: "sawtooth", volume: 0.13, endFreq: 110 }); },
    match3:           function () { sfxTone(540, 0.10, { type: "square", volume: 0.14, endFreq: 760 }); },
    match4:           function () { sfxTone(680, 0.13, { type: "square", volume: 0.16, endFreq: 920 }); sfxTone(420, 0.11, { type: "triangle", volume: 0.12, endFreq: 600 }); },
    match5:           function () { sfxTone(820, 0.18, { type: "square", volume: 0.18, endFreq: 1180 }); sfxTone(540, 0.16, { type: "triangle", volume: 0.13, endFreq: 720 }); },
    cascadeChime:     function (n) {
      var base = 440 + Math.min(n, 6) * 110;
      sfxTone(base, 0.18, { type: "triangle", volume: 0.14, endFreq: base * 1.6 });
    },
    specialCreate:    function () { sfxTone(720, 0.22, { type: "sine", volume: 0.16, endFreq: 1280 }); sfxTone(500, 0.18, { type: "triangle", volume: 0.10, endFreq: 880 }); },
    scholarMatch:     function () { sfxTone(880, 0.20, { type: "sine", volume: 0.16, endFreq: 1320 }); sfxTone(660, 0.18, { type: "triangle", volume: 0.10, endFreq: 990 }); },
    scholarCorrect:   function () { sfxTone(660, 0.10, { type: "sine", volume: 0.16, endFreq: 880 }); setTimeout(function () { sfxTone(880, 0.10, { type: "sine", volume: 0.14, endFreq: 1100 }); }, 100); setTimeout(function () { sfxTone(1100, 0.20, { type: "sine", volume: 0.13, endFreq: 1320 }); }, 200); },
    scholarWrong:     function () { sfxTone(330, 0.22, { type: "triangle", volume: 0.14, endFreq: 220 }); },
    levelClear:       function () { sfxTone(660, 0.10, { type: "square", volume: 0.16, endFreq: 880 }); setTimeout(function () { sfxTone(880, 0.10, { type: "square", volume: 0.14, endFreq: 1100 }); }, 100); setTimeout(function () { sfxTone(1100, 0.18, { type: "square", volume: 0.12, endFreq: 1320 }); }, 200); setTimeout(function () { sfxTone(1320, 0.32, { type: "square", volume: 0.14 }); }, 320); },
    lifeLost:         function () { sfxTone(440, 0.18, { type: "sawtooth", volume: 0.16, endFreq: 220 }); sfxTone(330, 0.20, { type: "triangle", volume: 0.12, endFreq: 110 }); },
    gameOver:         function () { sfxTone(330, 0.18, { type: "sawtooth", volume: 0.16, endFreq: 220 }); setTimeout(function () { sfxTone(220, 0.32, { type: "sawtooth", volume: 0.14, endFreq: 88 }); }, 200); },
    powerupPickup:    function () { sfxTone(880, 0.10, { type: "sine", volume: 0.16, endFreq: 1320 }); sfxTone(1100, 0.10, { type: "triangle", volume: 0.10, endFreq: 1500 }); },
    powerupUse:       function () { sfxTone(560, 0.12, { type: "square", volume: 0.16, endFreq: 1100 }); sfxNoise(0.08, { volume: 0.06 }); },
    bombExplode:      function () { sfxNoise(0.30, { volume: 0.20 }); sfxTone(180, 0.32, { type: "sawtooth", volume: 0.14, endFreq: 60 }); }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("citadelCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudTarget = $("hudTarget");
    dom.hudMoves = $("hudMoves");
    dom.hudLevel = $("hudLevel");
    dom.hudLives = $("hudLives");
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
    dom.powerupSlots = [$("powerupSlot0"), $("powerupSlot1"), $("powerupSlot2")];
    dom.activationHint = $("activationHint");
    dom.activationHintText = $("activationHintText");
    dom.colorPicker = $("colorPicker");
    dom.colorPickerGrid = $("colorPickerGrid");
    dom.colorPickerCancel = $("colorPickerCancel");
  }

  // -- State / level ---------------------------------------------------------
  function targetForLevel(level) { return 1500 + (level - 1) * 800; }
  function movesForLevel(level) { return Math.max(18, 25 - (level - 1)); }

  function initState(opts) {
    opts = opts || {};
    var level = opts.level || 1;
    state = {
      time: 0,
      score: opts.score || 0,
      level: level,
      maxLevel: opts.maxLevel || level,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      moves: movesForLevel(level),
      target: targetForLevel(level),
      best: opts.best != null ? opts.best : readBest(),

      // Board + animation state
      grid: null,        // grid[r][c] = gem or null
      animations: [],    // active animations
      selected: null,    // {r,c} of selected gem for swap
      swapPair: null,    // {a:{r,c}, b:{r,c}, t} during swap anim
      cursor: { r: 0, c: 0 },

      // Match / cascade state
      cascadeLevel: 0,
      matchedThisLevel: 0,        // total gems matched (toward scholar)
      cascadesThisRun: 0,
      pendingScoreFlashes: [],

      // Power-ups
      powerups: [],               // array of type-strings, max POWERUP_MAX
      activePowerup: null,        // string or null — which one is currently being aimed
      multiplierActive: 0,        // number of matches remaining at 2x

      // Scholar
      scholarSlot: null,          // {r, c} or null
      scholarPending: null,       // when matched, pause and ask
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      questionIdx: -1,

      // Game progress
      shardsAwarded: 0,
      gameStartedAt: Date.now(),
      durationMs: 0,
      cumulativeMatches: 0,
      level1MovesAtStart: movesForLevel(level),

      // Particles
      particles: [],

      // Tally
      stats: {
        threes: 0, fours: 0, fives: 0, lts: 0, specials: 0, scholars: 0
      }
    };
    // Build a fresh board with no initial matches
    state.grid = buildBoard(level);
    placeScholarMaybe();
  }

  function makeGem(type) {
    return { type: type, special: SPEC_NONE, scholar: false, hp: 1, fadeT: 0, popT: 0, x: 0, y: 0, scale: 1, born: state ? state.time : 0 };
  }

  function buildBoard(level) {
    var grid = [];
    for (var r = 0; r < GRID; r++) {
      grid[r] = [];
      for (var c = 0; c < GRID; c++) grid[r][c] = null;
    }
    // Fill while avoiding initial 3-in-a-rows
    for (var r2 = 0; r2 < GRID; r2++) {
      for (var c2 = 0; c2 < GRID; c2++) {
        var avoid = {};
        if (c2 >= 2 && grid[r2][c2-1] && grid[r2][c2-2] && grid[r2][c2-1].type === grid[r2][c2-2].type) {
          avoid[grid[r2][c2-1].type] = true;
        }
        if (r2 >= 2 && grid[r2-1][c2] && grid[r2-2][c2] && grid[r2-1][c2].type === grid[r2-2][c2].type) {
          avoid[grid[r2-1][c2].type] = true;
        }
        var t;
        var safety = 0;
        do {
          t = Math.floor(Math.random() * TYPE_COUNT);
          safety++;
        } while (avoid[t] && safety < 12);
        grid[r2][c2] = makeGem(t);
      }
    }
    // Sparse obstacle gems on level 5+ (3-6 of them, never adjacent to each other)
    if (level >= OBSTACLE_LEVEL) {
      var obstacles = 3 + Math.min(3, level - OBSTACLE_LEVEL);
      var attempts = 0;
      var placed = 0;
      while (placed < obstacles && attempts < 80) {
        attempts++;
        var or = Math.floor(Math.random() * GRID);
        var oc = Math.floor(Math.random() * GRID);
        // Don't put obstacles in top rows (so player can clear them)
        if (or < 2) continue;
        if (grid[or][oc].special === SPEC_OBSTACLE) continue;
        // Avoid neighbors who are also obstacles
        var bad = false;
        if (or > 0 && grid[or-1][oc].special === SPEC_OBSTACLE) bad = true;
        if (oc > 0 && grid[or][oc-1].special === SPEC_OBSTACLE) bad = true;
        if (bad) continue;
        grid[or][oc].special = SPEC_OBSTACLE;
        grid[or][oc].hp = 2;
        placed++;
      }
    }
    return grid;
  }

  // Place a scholar gem on a random non-special, non-edge gem
  function placeScholarMaybe() {
    if (!state) return;
    if (state.scholarSlot) return;
    var candidates = [];
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var g = state.grid[r][c];
        if (!g || g.special !== SPEC_NONE) continue;
        candidates.push({ r: r, c: c });
      }
    }
    if (!candidates.length) return;
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    state.grid[pick.r][pick.c].scholar = true;
    state.scholarSlot = { r: pick.r, c: pick.c };
  }

  function clearScholar() {
    if (!state || !state.scholarSlot) return;
    var s = state.scholarSlot;
    if (state.grid[s.r] && state.grid[s.r][s.c]) {
      state.grid[s.r][s.c].scholar = false;
    }
    state.scholarSlot = null;
  }

  // -- Coordinate helpers ----------------------------------------------------
  function cellCenter(r, c) {
    return {
      x: BOARD_X0 + c * CELL_PX + CELL_PX / 2,
      y: BOARD_Y0 + r * CELL_PX + CELL_PX / 2
    };
  }
  function pointToCell(px, py) {
    var c = Math.floor((px - BOARD_X0) / CELL_PX);
    var r = Math.floor((py - BOARD_Y0) / CELL_PX);
    if (r < 0 || r >= GRID || c < 0 || c >= GRID) return null;
    return { r: r, c: c };
  }
  function inBounds(r, c) { return r >= 0 && r < GRID && c >= 0 && c < GRID; }
  function adjacent(a, b) {
    if (!a || !b) return false;
    var dr = Math.abs(a.r - b.r), dc = Math.abs(a.c - b.c);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  // -- Match detection -------------------------------------------------------
  // Find all matches on the current grid. Returns { matchSet: Set("r,c"), groups: [...] }
  function findMatches() {
    var matchSet = {};
    var groups = [];

    // Horizontal runs
    for (var r = 0; r < GRID; r++) {
      var c = 0;
      while (c < GRID) {
        var g = state.grid[r][c];
        if (!g || g.special === SPEC_OBSTACLE) { c++; continue; }
        var t = g.type;
        var run = 1;
        while (c + run < GRID && state.grid[r][c + run] && state.grid[r][c + run].type === t && state.grid[r][c + run].special !== SPEC_OBSTACLE) run++;
        if (run >= 3) {
          var grp = { type: t, cells: [], orientation: "h", length: run };
          for (var k = 0; k < run; k++) {
            var key = r + "," + (c + k);
            grp.cells.push({ r: r, c: c + k });
            matchSet[key] = true;
          }
          groups.push(grp);
        }
        c += run;
      }
    }

    // Vertical runs
    for (var col = 0; col < GRID; col++) {
      var rr = 0;
      while (rr < GRID) {
        var g2 = state.grid[rr][col];
        if (!g2 || g2.special === SPEC_OBSTACLE) { rr++; continue; }
        var t2 = g2.type;
        var run2 = 1;
        while (rr + run2 < GRID && state.grid[rr + run2][col] && state.grid[rr + run2][col].type === t2 && state.grid[rr + run2][col].special !== SPEC_OBSTACLE) run2++;
        if (run2 >= 3) {
          var grp2 = { type: t2, cells: [], orientation: "v", length: run2 };
          for (var k2 = 0; k2 < run2; k2++) {
            var key2 = (rr + k2) + "," + col;
            grp2.cells.push({ r: rr + k2, c: col });
            matchSet[key2] = true;
          }
          groups.push(grp2);
        }
        rr += run2;
      }
    }

    // Detect L/T shapes — when a horizontal group and vertical group share a cell
    // Mark the shared groups as cross-type for special-gem creation.
    for (var i = 0; i < groups.length; i++) {
      var gi = groups[i];
      if (gi.orientation !== "h") continue;
      for (var j = 0; j < groups.length; j++) {
        var gj = groups[j];
        if (gj.orientation !== "v") continue;
        if (gi.type !== gj.type) continue;
        // Check intersection
        for (var ki = 0; ki < gi.cells.length; ki++) {
          for (var kj = 0; kj < gj.cells.length; kj++) {
            if (gi.cells[ki].r === gj.cells[kj].r && gi.cells[ki].c === gj.cells[kj].c) {
              gi.cross = true;
              gj.cross = true;
              gi.crossWith = gj;
              gj.crossWith = gi;
              gi.intersection = { r: gi.cells[ki].r, c: gi.cells[ki].c };
              gj.intersection = gi.intersection;
              break;
            }
          }
        }
      }
    }

    return { matchSet: matchSet, groups: groups };
  }

  // Check whether ANY swap on the board can produce a match.
  function anyValidMove() {
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        // try right
        if (c + 1 < GRID) {
          swapInGrid(r, c, r, c + 1);
          var has = matchesPresent();
          swapInGrid(r, c, r, c + 1);
          if (has) return true;
        }
        // try down
        if (r + 1 < GRID) {
          swapInGrid(r, c, r + 1, c);
          var has2 = matchesPresent();
          swapInGrid(r, c, r + 1, c);
          if (has2) return true;
        }
      }
    }
    return false;
  }

  function matchesPresent() {
    // Quick scan: 3-in-a-row horizontally OR vertically of matching type, ignoring obstacles
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c <= GRID - 3; c++) {
        var a = state.grid[r][c], b = state.grid[r][c + 1], d = state.grid[r][c + 2];
        if (!a || !b || !d) continue;
        if (a.special === SPEC_OBSTACLE || b.special === SPEC_OBSTACLE || d.special === SPEC_OBSTACLE) continue;
        if (a.type === b.type && b.type === d.type) return true;
      }
    }
    for (var col = 0; col < GRID; col++) {
      for (var rr = 0; rr <= GRID - 3; rr++) {
        var a2 = state.grid[rr][col], b2 = state.grid[rr + 1][col], d2 = state.grid[rr + 2][col];
        if (!a2 || !b2 || !d2) continue;
        if (a2.special === SPEC_OBSTACLE || b2.special === SPEC_OBSTACLE || d2.special === SPEC_OBSTACLE) continue;
        if (a2.type === b2.type && b2.type === d2.type) return true;
      }
    }
    return false;
  }

  function swapInGrid(ra, ca, rb, cb) {
    var tmp = state.grid[ra][ca];
    state.grid[ra][ca] = state.grid[rb][cb];
    state.grid[rb][cb] = tmp;
  }

  // -- Swap mechanic ---------------------------------------------------------
  function trySwap(a, b) {
    if (!adjacent(a, b)) return false;
    if (phase !== "playing") return false;
    var ga = state.grid[a.r][a.c];
    var gb = state.grid[b.r][b.c];
    if (!ga || !gb) return false;
    if (ga.special === SPEC_OBSTACLE || gb.special === SPEC_OBSTACLE) {
      // Obstacles can't be swapped
      sfx.swapInvalid();
      return false;
    }

    sfx.swap();

    // Codex (rainbow) swap: If either is codex, clear all of the OTHER's color.
    if (ga.special === SPEC_CODEX || gb.special === SPEC_CODEX) {
      var codexCell = ga.special === SPEC_CODEX ? a : b;
      var targetCell = ga.special === SPEC_CODEX ? b : a;
      var targetType = state.grid[targetCell.r][targetCell.c].type;
      // Consume the move
      consumeMove();
      activateCodex(codexCell, targetType);
      return true;
    }

    // Animate swap
    state.swapPair = {
      a: { r: a.r, c: a.c },
      b: { r: b.r, c: b.c },
      t: 0,
      tries: 1
    };
    swapInGrid(a.r, a.c, b.r, b.c);
    phase = "swapping";
    return true;
  }

  function commitSwap() {
    var pair = state.swapPair;
    state.swapPair = null;
    // Check matches
    var found = findMatches();
    var hasMatch = false;
    for (var k in found.matchSet) { hasMatch = true; break; }
    // Any specials at the two positions? They count as a "match" (auto-trigger)
    var ga = state.grid[pair.a.r][pair.a.c];
    var gb = state.grid[pair.b.r][pair.b.c];
    if (ga && ga.special !== SPEC_NONE && ga.special !== SPEC_OBSTACLE) hasMatch = true;
    if (gb && gb.special !== SPEC_NONE && gb.special !== SPEC_OBSTACLE) hasMatch = true;

    if (hasMatch) {
      consumeMove();
      state.cascadeLevel = 0;
      processCascade(found, pair);
    } else {
      // Revert
      sfx.swapInvalid();
      state.swapPair = {
        a: { r: pair.a.r, c: pair.a.c },
        b: { r: pair.b.r, c: pair.b.c },
        t: 0,
        tries: 2,
        reverting: true
      };
      swapInGrid(pair.a.r, pair.a.c, pair.b.r, pair.b.c);
      phase = "reverting";
    }
  }

  function consumeMove() {
    state.moves--;
    if (state.moves < 0) state.moves = 0;
  }

  // -- Cascade engine --------------------------------------------------------
  // Process one round of matches. Mark gems, animate pop, then gravity, then re-scan.
  function processCascade(found, fromSwap) {
    var matched = collectMatchedSet(found, fromSwap);
    if (!matched.cells.length && !matched.specialsTriggered.length) {
      // Nothing happened — clear scholar pending and resume playing
      finalizeCascade();
      return;
    }

    state.cascadeLevel++;
    state.cascadesThisRun++;

    // Special gem creations: detect 4-, 5-, L/T match patterns from `found.groups`
    var specialsToCreate = computeSpecialsFromGroups(found.groups, fromSwap);

    // Score the matches
    var multiplier = state.cascadeLevel + (state.multiplierActive > 0 ? 1 : 0);
    var roundScore = 0;
    var groupsForScore = found.groups || [];
    for (var i = 0; i < groupsForScore.length; i++) {
      var grp = groupsForScore[i];
      var s = SCORE_3;
      if (grp.cross) s = SCORE_LT;
      else if (grp.length === 4) s = SCORE_4;
      else if (grp.length >= 5) s = SCORE_5;
      roundScore += s;
      if (grp.cross && !grp._counted) {
        state.stats.lts++;
        grp._counted = true;
        if (grp.crossWith) grp.crossWith._counted = true;
      } else if (grp.length === 3) state.stats.threes++;
      else if (grp.length === 4) state.stats.fours++;
      else if (grp.length >= 5) state.stats.fives++;
    }
    // Specials triggered also score per cell cleared
    roundScore += matched.specialClearCount * SCORE_SPECIAL_CLEAR;
    var totalScore = roundScore * Math.max(1, multiplier);
    addScore(totalScore);

    // Decrement multiplier counter: each scoring round eats one
    if (state.multiplierActive > 0) state.multiplierActive--;

    // Cascade callouts
    if (state.cascadeLevel === 2) pushPopupAtBoard("COMBO!", "is-bonus");
    else if (state.cascadeLevel === 3) {
      pushPopupAtBoard("SUPER COMBO!", "is-tetris");
      hitPause(HITPAUSE_FRAMES);
    } else if (state.cascadeLevel >= 4) {
      pushPopupAtBoard("MEGA CASCADE!", "is-legend");
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("citadel", "citadel-cascade"); } catch (e) {}
      hitPause(HITPAUSE_FRAMES);
    }

    // Score popup near the centroid of matched cells
    if (matched.cells.length) {
      var cx = 0, cy = 0;
      for (var cmi = 0; cmi < matched.cells.length; cmi++) {
        var cc = cellCenter(matched.cells[cmi].r, matched.cells[cmi].c);
        cx += cc.x; cy += cc.y;
      }
      cx /= matched.cells.length;
      cy /= matched.cells.length;
      pushPopup("+" + formatNumber(totalScore), cx, cy - 14, "is-score");
    }

    // SFX based on biggest group
    var biggestLen = 3;
    for (var bi = 0; bi < groupsForScore.length; bi++) {
      if (groupsForScore[bi].cross && biggestLen < 5) biggestLen = 5;
      if (groupsForScore[bi].length > biggestLen) biggestLen = groupsForScore[bi].length;
    }
    if (biggestLen >= 5) sfx.match5();
    else if (biggestLen === 4) sfx.match4();
    else sfx.match3();
    if (state.cascadeLevel >= 2) sfx.cascadeChime(state.cascadeLevel);

    // Bonus life threshold check
    var newThr = Math.floor(state.score / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    if (newThr > lastBonusLifeThreshold) {
      lastBonusLifeThreshold = newThr;
      state.lives++;
      pushPopupAtBoard("EXTRA LIFE!", "is-emerald");
      sfx.levelClear();
    }

    // Power-up drops (small chance per cascade)
    if (state.cascadeLevel >= 1 && Math.random() < POWERUP_DROP_RATE && state.powerups.length < POWERUP_MAX) {
      dropPowerup();
    }

    // Track matched count (toward scholar)
    state.cumulativeMatches += matched.cells.length;
    state.matchedThisLevel += matched.cells.length;

    // If a scholar gem was matched this round, queue a question after pop animation
    if (matched.scholarHit) {
      state.scholarPending = { wasHit: true };
    }

    // Pop animation: each cell starts a "popping" anim; after POP_MS we proceed to specials/gravity
    phase = "matching";
    var popAnimT = 0;
    var totalCells = matched.cells.length;
    // Mark popT on each
    for (var pi = 0; pi < matched.cells.length; pi++) {
      var pc = matched.cells[pi];
      if (state.grid[pc.r][pc.c]) {
        state.grid[pc.r][pc.c].popT = 0.001; // tiny non-zero so render starts
        // Particle burst
        var cc2 = cellCenter(pc.r, pc.c);
        burstAt(cc2.x, cc2.y, GEM_COLORS[state.grid[pc.r][pc.c].type].base, 5);
      }
    }

    // After POP_MS, remove matched gems, place specials (for groups), trigger specials chain, then gravity
    var matchedRef = matched;
    var specialsRef = specialsToCreate;
    var foundRef = found;
    setTimeout(function () {
      // Place special gems FIRST (before clearing). The "anchor" is preserved.
      for (var si = 0; si < specialsRef.length; si++) {
        var sp = specialsRef[si];
        // Skip if anchor was overwritten by an obstacle break or already-cleared (shouldn't happen but safe)
        if (state.grid[sp.r] && state.grid[sp.r][sp.c]) {
          state.grid[sp.r][sp.c].special = sp.special;
          state.grid[sp.r][sp.c].type = sp.type;
          state.grid[sp.r][sp.c].popT = 0;
          state.grid[sp.r][sp.c].born = state.time;
          // Mark this cell as "preserved" so we DON'T null it during clearing
          matchedRef.preserved = matchedRef.preserved || {};
          matchedRef.preserved[sp.r + "," + sp.c] = true;
        }
        sfx.specialCreate();
        var ccs = cellCenter(sp.r, sp.c);
        pushPopup("FORGED!", ccs.x, ccs.y - 8, "is-bonus");
        burstAt(ccs.x, ccs.y, "#f5c451", 14);
        state.stats.specials++;
      }

      // Now actually null matched cells (except preserved + obstacles which got hp-1 already)
      for (var ci = 0; ci < matchedRef.cells.length; ci++) {
        var mc = matchedRef.cells[ci];
        var key = mc.r + "," + mc.c;
        if (matchedRef.preserved && matchedRef.preserved[key]) continue;
        // Nearby obstacles should crack (not full-clear)
        // Already handled in collectMatchedSet via hpDecremented
        if (state.grid[mc.r][mc.c]) {
          state.grid[mc.r][mc.c] = null;
        }
      }

      // Clear specialsTriggered cells (specials that fired, drop their gems)
      for (var sti = 0; sti < matchedRef.specialsTriggered.length; sti++) {
        var sc = matchedRef.specialsTriggered[sti];
        var skey = sc.r + "," + sc.c;
        if (matchedRef.preserved && matchedRef.preserved[skey]) continue;
        if (state.grid[sc.r][sc.c]) state.grid[sc.r][sc.c] = null;
      }

      // If scholar was hit, pause music and queue review modal
      if (state.scholarPending && state.scholarPending.wasHit) {
        state.scholarSlot = null; // already cleared visually
        state.scholarPending = null;
        state.stats.scholars++;
        sfx.scholarMatch();
        showScholarModal();
        return; // halt the cascade until they resolve modal; gravity continues after dismiss
      }

      // Now run gravity and refill, then re-scan
      runGravityAndRefill(function () {
        // Continue cascade
        var found2 = findMatches();
        var has2 = false;
        for (var k in found2.matchSet) { has2 = true; break; }
        if (has2) {
          processCascade(found2, null);
        } else {
          // Maybe drop a power-up if we cascaded a lot
          if (state.cascadeLevel >= 3 && state.powerups.length < POWERUP_MAX && Math.random() < 0.5) {
            dropPowerup();
          }
          finalizeCascade();
        }
      });
    }, reducedMotion ? 30 : POP_MS);
  }

  // From the matched cells, collect the full set including specials triggered.
  // Decrement obstacle HP; track scholar hits.
  function collectMatchedSet(found, fromSwap) {
    var cells = [];
    var keys = {};
    var specialsTriggered = [];
    var specialClearCount = 0;
    var scholarHit = false;

    function pushCell(r, c) {
      if (!inBounds(r, c)) return;
      var key = r + "," + c;
      if (keys[key]) return;
      var g = state.grid[r][c];
      if (!g) return;
      if (g.special === SPEC_OBSTACLE) {
        // Obstacles aren't matched directly; only cracked when adjacent matches occur
        return;
      }
      keys[key] = true;
      cells.push({ r: r, c: c, type: g.type });
      if (g.scholar) scholarHit = true;
    }

    // Expand match cells; trigger specials they touch
    for (var key in found.matchSet) {
      var parts = key.split(",");
      var r = parseInt(parts[0], 10), c = parseInt(parts[1], 10);
      pushCell(r, c);
      var g = state.grid[r][c];
      if (g && g.special !== SPEC_NONE && g.special !== SPEC_OBSTACLE) {
        // chain: specials within match group fire
        var triggered = triggerSpecialAt(r, c, keys, specialsTriggered);
        specialClearCount += triggered;
      }
      // Crack adjacent obstacles by 1 HP each (only once per match round per obstacle)
      crackAdjacentObstacles(r, c, keys);
    }

    // If swap involved a special directly, trigger it
    if (fromSwap) {
      var pa = state.grid[fromSwap.a.r][fromSwap.a.c];
      var pb = state.grid[fromSwap.b.r][fromSwap.b.c];
      if (pa && pa.special !== SPEC_NONE && pa.special !== SPEC_OBSTACLE) {
        keys[fromSwap.a.r + "," + fromSwap.a.c] = true;
        cells.push({ r: fromSwap.a.r, c: fromSwap.a.c, type: pa.type });
        var t1 = triggerSpecialAt(fromSwap.a.r, fromSwap.a.c, keys, specialsTriggered);
        specialClearCount += t1;
      }
      if (pb && pb.special !== SPEC_NONE && pb.special !== SPEC_OBSTACLE) {
        keys[fromSwap.b.r + "," + fromSwap.b.c] = true;
        cells.push({ r: fromSwap.b.r, c: fromSwap.b.c, type: pb.type });
        var t2 = triggerSpecialAt(fromSwap.b.r, fromSwap.b.c, keys, specialsTriggered);
        specialClearCount += t2;
      }
    }

    return { cells: cells, specialsTriggered: specialsTriggered, specialClearCount: specialClearCount, scholarHit: scholarHit };
  }

  function crackAdjacentObstacles(r, c, keys) {
    var dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (var i = 0; i < dirs.length; i++) {
      var nr = r + dirs[i][0], nc = c + dirs[i][1];
      if (!inBounds(nr, nc)) continue;
      var g = state.grid[nr][nc];
      if (!g || g.special !== SPEC_OBSTACLE) continue;
      if (g._crackedThisRound) continue;
      g._crackedThisRound = true;
      g.hp--;
      if (g.hp <= 0) {
        // Obstacle breaks — convert to nothing
        keys[nr + "," + nc] = true;
        state.grid[nr][nc] = null;
        // small particle
        var cc = cellCenter(nr, nc);
        burstAt(cc.x, cc.y, "#aaaaaa", 6);
      } else {
        // Visual crack — handled in render via hp value
      }
    }
  }

  // Trigger a special at (r,c). Returns count of cells cleared.
  function triggerSpecialAt(r, c, keys, specialsTriggered) {
    var g = state.grid[r][c];
    if (!g) return 0;
    var special = g.special;
    if (special === SPEC_NONE || special === SPEC_OBSTACLE) return 0;
    var cleared = 0;
    var cc;

    if (special === SPEC_STRIKER_H) {
      cc = cellCenter(r, c);
      pushPopup("STRIKER!", cc.x, cc.y - 8, "is-bonus");
      // Clear entire row
      for (var cc2 = 0; cc2 < GRID; cc2++) {
        var key = r + "," + cc2;
        if (keys[key]) continue;
        var nb = state.grid[r][cc2];
        if (!nb) continue;
        if (nb.special === SPEC_OBSTACLE) {
          // Damage obstacle
          if (!nb._crackedThisRound) {
            nb._crackedThisRound = true;
            nb.hp--;
            if (nb.hp <= 0) { keys[key] = true; state.grid[r][cc2] = null; cleared++; }
          }
          continue;
        }
        // Chain triggers
        if (nb.special !== SPEC_NONE) {
          keys[key] = true;
          specialsTriggered.push({ r: r, c: cc2 });
          cleared++;
          cleared += triggerSpecialAt(r, cc2, keys, specialsTriggered);
          continue;
        }
        keys[key] = true;
        specialsTriggered.push({ r: r, c: cc2 });
        if (nb.scholar) {
          // Scholar caught in striker line — fire it
          state.scholarPending = { wasHit: true };
        }
        cleared++;
      }
      // Visual line burst
      drawLineBurst(r, c, "h");
      sfx.specialCreate();
    } else if (special === SPEC_STRIKER_V) {
      cc = cellCenter(r, c);
      pushPopup("STRIKER!", cc.x, cc.y - 8, "is-bonus");
      for (var rr2 = 0; rr2 < GRID; rr2++) {
        var key2 = rr2 + "," + c;
        if (keys[key2]) continue;
        var nb2 = state.grid[rr2][c];
        if (!nb2) continue;
        if (nb2.special === SPEC_OBSTACLE) {
          if (!nb2._crackedThisRound) {
            nb2._crackedThisRound = true;
            nb2.hp--;
            if (nb2.hp <= 0) { keys[key2] = true; state.grid[rr2][c] = null; cleared++; }
          }
          continue;
        }
        if (nb2.special !== SPEC_NONE) {
          keys[key2] = true;
          specialsTriggered.push({ r: rr2, c: c });
          cleared++;
          cleared += triggerSpecialAt(rr2, c, keys, specialsTriggered);
          continue;
        }
        keys[key2] = true;
        specialsTriggered.push({ r: rr2, c: c });
        if (nb2.scholar) state.scholarPending = { wasHit: true };
        cleared++;
      }
      drawLineBurst(r, c, "v");
      sfx.specialCreate();
    } else if (special === SPEC_BOMB) {
      cc = cellCenter(r, c);
      pushPopup("BOOM!", cc.x, cc.y - 8, "is-tetris");
      sfx.bombExplode();
      shake(0.4, 14);
      // 3x3 around (r,c)
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          var nr = r + dr, nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          var key3 = nr + "," + nc;
          if (keys[key3]) continue;
          var nb3 = state.grid[nr][nc];
          if (!nb3) continue;
          if (nb3.special === SPEC_OBSTACLE) {
            // Bomb hits obstacles for 2 damage
            keys[key3] = true;
            state.grid[nr][nc] = null;
            cleared++;
            continue;
          }
          if (nb3.special !== SPEC_NONE) {
            keys[key3] = true;
            specialsTriggered.push({ r: nr, c: nc });
            cleared++;
            cleared += triggerSpecialAt(nr, nc, keys, specialsTriggered);
            continue;
          }
          keys[key3] = true;
          specialsTriggered.push({ r: nr, c: nc });
          if (nb3.scholar) state.scholarPending = { wasHit: true };
          cleared++;
          var cb = cellCenter(nr, nc);
          burstAt(cb.x, cb.y, "#f5c451", 8);
        }
      }
      // Big center burst
      burstAt(cc.x, cc.y, "#ff7c4a", 24);
    } else if (special === SPEC_CODEX) {
      // Codex when matched normally: clear all of its own type
      var t = g.type;
      cc = cellCenter(r, c);
      pushPopup("CODEX!", cc.x, cc.y - 8, "is-legend");
      sfx.specialCreate();
      for (var rr3 = 0; rr3 < GRID; rr3++) {
        for (var cc3 = 0; cc3 < GRID; cc3++) {
          var key4 = rr3 + "," + cc3;
          if (keys[key4]) continue;
          var nb4 = state.grid[rr3][cc3];
          if (!nb4) continue;
          if (nb4.type !== t) continue;
          if (nb4.special === SPEC_OBSTACLE) continue;
          keys[key4] = true;
          specialsTriggered.push({ r: rr3, c: cc3 });
          if (nb4.scholar) state.scholarPending = { wasHit: true };
          cleared++;
        }
      }
    }
    return cleared;
  }

  // When a Codex is swapped with a non-special gem of color X, clear all X.
  function activateCodex(codexCell, targetType) {
    phase = "matching";
    var keys = {};
    keys[codexCell.r + "," + codexCell.c] = true; // codex itself goes
    var cells = [{ r: codexCell.r, c: codexCell.c }];
    var clearedTypes = 0;
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var g = state.grid[r][c];
        if (!g) continue;
        if (g.type === targetType && g.special !== SPEC_OBSTACLE) {
          var key = r + "," + c;
          if (keys[key]) continue;
          keys[key] = true;
          cells.push({ r: r, c: c });
          if (g.scholar) state.scholarPending = { wasHit: true };
          clearedTypes++;
        }
      }
    }
    var cc = cellCenter(codexCell.r, codexCell.c);
    pushPopup("CODEX!", cc.x, cc.y - 14, "is-legend");
    sfx.specialCreate();
    sfx.cascadeChime(3);
    burstAt(cc.x, cc.y, GEM_COLORS[targetType].base, 30);
    shake(0.3, 10);
    addScore((clearedTypes * SCORE_SPECIAL_CLEAR + 200) * Math.max(1, state.cascadeLevel + 1));
    state.stats.specials++;
    state.cumulativeMatches += clearedTypes;
    state.matchedThisLevel += clearedTypes;
    state.cascadeLevel = 1;

    // Pop animation
    for (var pi = 0; pi < cells.length; pi++) {
      var pcc = cellCenter(cells[pi].r, cells[pi].c);
      burstAt(pcc.x, pcc.y, "#f5c451", 6);
    }

    setTimeout(function () {
      for (var ci = 0; ci < cells.length; ci++) {
        var mc = cells[ci];
        if (state.grid[mc.r][mc.c]) state.grid[mc.r][mc.c] = null;
      }
      if (state.scholarPending && state.scholarPending.wasHit) {
        state.scholarPending = null;
        state.scholarSlot = null;
        state.stats.scholars++;
        sfx.scholarMatch();
        showScholarModal();
        return;
      }
      runGravityAndRefill(function () {
        var found2 = findMatches();
        var has2 = false;
        for (var k in found2.matchSet) { has2 = true; break; }
        if (has2) {
          processCascade(found2, null);
        } else {
          finalizeCascade();
        }
      });
    }, reducedMotion ? 30 : POP_MS);
  }

  // Compute special creations based on group sizes/orientations
  // Returns an array of { r, c, special, type } entries.
  function computeSpecialsFromGroups(groups, fromSwap) {
    var out = [];
    var taken = {}; // cells already used as anchors
    function anchorFor(grp) {
      // Prefer a fromSwap cell inside the group if available
      if (fromSwap) {
        for (var i = 0; i < grp.cells.length; i++) {
          var cc = grp.cells[i];
          if (fromSwap.a && cc.r === fromSwap.a.r && cc.c === fromSwap.a.c) return cc;
          if (fromSwap.b && cc.r === fromSwap.b.r && cc.c === fromSwap.b.c) return cc;
        }
      }
      // Otherwise the middle cell
      return grp.cells[Math.floor(grp.cells.length / 2)];
    }
    var crossedHandled = {};
    for (var i = 0; i < groups.length; i++) {
      var grp = groups[i];
      if (grp.cross) {
        var key = grp.intersection.r + "," + grp.intersection.c;
        if (crossedHandled[key]) continue;
        crossedHandled[key] = true;
        if (taken[key]) continue;
        taken[key] = true;
        out.push({ r: grp.intersection.r, c: grp.intersection.c, special: SPEC_BOMB, type: grp.type });
        continue;
      }
      var anchor = anchorFor(grp);
      var akey = anchor.r + "," + anchor.c;
      if (taken[akey]) continue;
      if (grp.length >= 5) {
        taken[akey] = true;
        out.push({ r: anchor.r, c: anchor.c, special: SPEC_CODEX, type: grp.type });
        try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("citadel", "citadel-codex"); } catch (e) {}
      } else if (grp.length === 4) {
        taken[akey] = true;
        // Spec: 4-match in line → Striker that clears row OR column based on match orientation.
        // Horizontal 4 → STRIKER_H (clears its row when triggered); vertical 4 → STRIKER_V (clears column).
        out.push({ r: anchor.r, c: anchor.c, special: grp.orientation === "h" ? SPEC_STRIKER_H : SPEC_STRIKER_V, type: grp.type });
      }
    }
    return out;
  }

  function finalizeCascade() {
    // Reset per-round flags
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        if (state.grid[r][c]) state.grid[r][c]._crackedThisRound = false;
      }
    }
    // Place scholar gem if enough matches accumulated
    if (state.matchedThisLevel >= SCHOLAR_EVERY_N_MATCHES) {
      state.matchedThisLevel = 0;
      placeScholarMaybe();
    } else if (!state.scholarSlot && Math.random() < 0.05) {
      // Small floor chance to seed one
      placeScholarMaybe();
    }

    // Check level clear
    if (state.score >= state.target) {
      enterLevelClear();
      return;
    }

    // Check moves out
    if (state.moves <= 0) {
      loseLifeAndContinue();
      return;
    }

    // Auto-reshuffle if no valid move (level 4+)
    if (state.level >= RESHUFFLE_LEVEL && !anyValidMove()) {
      pushPopupAtBoard("RESHUFFLE", "is-bonus");
      reshuffleBoard();
    }

    state.cascadeLevel = 0;
    phase = "playing";
  }

  function loseLifeAndContinue() {
    state.lives--;
    sfx.lifeLost();
    pushPopupAtBoard("LIFE LOST", "is-warn");
    shake(0.4, 12);
    if (state.lives <= 0) {
      gameOver();
      return;
    }
    // Reset moves for replay of this level (no score reset)
    state.moves = movesForLevel(state.level);
    state.cascadeLevel = 0;
    phase = "playing";
  }

  function gameOver() {
    phase = "ended";
    sfx.gameOver();
    state.durationMs = Date.now() - state.gameStartedAt;
    if (state.score > state.best) { state.best = state.score; writeBest(state.score); }
    finalizeRunStats();
    try { recordRunCompletion(); } catch (e) {}
    showEndScreen();
  }

  function enterLevelClear() {
    phase = "levelClear";
    sfx.levelClear();
    var bonus = (state.moves > 0 ? state.moves * 100 : 0) + state.level * 500;
    addScore(bonus);
    pushPopupAtBoard("CITADEL CLEARED!", "is-legend");
    if (window.MrMacsCelebration && !reducedMotion) {
      try { window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#a991ff", "#4dd49b", "#5de0f0"] }); } catch (e) {}
    }
    state.lives++;
    pushPopupAtBoard("+1 LIFE", "is-emerald");
    setTimeout(function () {
      state.level++;
      state.maxLevel = Math.max(state.maxLevel, state.level);
      state.target = targetForLevel(state.level);
      state.moves = movesForLevel(state.level);
      state.cascadeLevel = 0;
      state.matchedThisLevel = 0;
      // Rebuild board for new level (preserves score)
      state.grid = buildBoard(state.level);
      placeScholarMaybe();
      phase = "playing";
    }, 1600);
  }

  // Reshuffle: preserve gems but randomize positions until we have a valid-move board.
  function reshuffleBoard() {
    var attempts = 0;
    do {
      attempts++;
      // Collect all gems
      var bag = [];
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var g = state.grid[r][c];
          if (g && g.special !== SPEC_OBSTACLE) {
            bag.push({ type: g.type, special: g.special, scholar: g.scholar });
            state.grid[r][c] = null;
          }
        }
      }
      // Shuffle
      for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = bag[i]; bag[i] = bag[j]; bag[j] = tmp;
      }
      // Re-place in empty (non-obstacle) cells
      var idx = 0;
      for (var r2 = 0; r2 < GRID; r2++) {
        for (var c2 = 0; c2 < GRID; c2++) {
          if (state.grid[r2][c2]) continue; // skip obstacles
          if (idx >= bag.length) continue;
          var b = bag[idx++];
          var ng = makeGem(b.type);
          ng.special = b.special;
          ng.scholar = b.scholar;
          state.grid[r2][c2] = ng;
        }
      }
      // Re-find scholar slot
      state.scholarSlot = null;
      for (var rr = 0; rr < GRID; rr++) {
        for (var cc = 0; cc < GRID; cc++) {
          if (state.grid[rr][cc] && state.grid[rr][cc].scholar) {
            state.scholarSlot = { r: rr, c: cc };
            break;
          }
        }
      }
    } while (matchesPresent() && attempts < 6);
    // If we still have matches after 6 reshuffles, just allow it; cascade will handle.
  }

  // -- Gravity and refill ----------------------------------------------------
  function runGravityAndRefill(onDone) {
    phase = "falling";
    // For each column, drop existing gems down past nulls; obstacles stay in place (anchors)
    // and gems fall until they hit either bottom, another gem, or an obstacle.
    for (var c = 0; c < GRID; c++) {
      var writeRow = GRID - 1;
      // Walk bottom-up, pulling gems down
      for (var r = GRID - 1; r >= 0; r--) {
        var g = state.grid[r][c];
        if (g && g.special === SPEC_OBSTACLE) {
          // Obstacle fixes the writeRow above it
          writeRow = r - 1;
        } else if (g) {
          if (writeRow !== r) {
            state.grid[writeRow][c] = g;
            state.grid[r][c] = null;
            // Update scholar slot pointer if needed
            if (state.scholarSlot && state.scholarSlot.r === r && state.scholarSlot.c === c) {
              state.scholarSlot.r = writeRow;
            }
          }
          writeRow--;
        }
      }
      // Refill any nulls above writeRow with new gems (random types, no scholar)
      for (var r2 = 0; r2 <= writeRow; r2++) {
        if (!state.grid[r2][c]) {
          state.grid[r2][c] = makeGem(Math.floor(Math.random() * TYPE_COUNT));
          state.grid[r2][c].born = state.time;
        }
      }
    }
    // Brief animation pause
    setTimeout(function () {
      phase = "matching";
      onDone();
    }, reducedMotion ? 30 : 220);
  }

  // -- Specials chain visual -------------------------------------------------
  function drawLineBurst(r, c, axis) {
    if (axis === "h") {
      var y = BOARD_Y0 + r * CELL_PX + CELL_PX / 2;
      for (var i = 0; i < GRID; i++) {
        var x = BOARD_X0 + i * CELL_PX + CELL_PX / 2;
        burstAt(x, y, "#fff7d8", 5);
      }
    } else {
      var x2 = BOARD_X0 + c * CELL_PX + CELL_PX / 2;
      for (var j = 0; j < GRID; j++) {
        var y2 = BOARD_Y0 + j * CELL_PX + CELL_PX / 2;
        burstAt(x2, y2, "#fff7d8", 5);
      }
    }
  }

  // -- Power-ups -------------------------------------------------------------
  var POWERUPS = {
    hammer:    { icon: "🔨", label: "Hammer",   needsTarget: "gem", desc: "Click any gem to destroy it." },
    reshuffle: { icon: "🔄", label: "Reshuffle", needsTarget: null,  desc: "Randomize the board." },
    moves:     { icon: "⏱", label: "+5 Moves",  needsTarget: null,  desc: "Add 5 moves." },
    multi:     { icon: "⭐", label: "2x Score",  needsTarget: null,  desc: "Next 5 matches double-score." },
    colorBomb: { icon: "🎯", label: "Color Bomb", needsTarget: "color", desc: "Pick a color to clear all of it." }
  };
  var POWERUP_KEYS = ["hammer", "reshuffle", "moves", "multi", "colorBomb"];

  function dropPowerup() {
    var k = POWERUP_KEYS[Math.floor(Math.random() * POWERUP_KEYS.length)];
    state.powerups.push(k);
    if (state.powerups.length > POWERUP_MAX) state.powerups.length = POWERUP_MAX;
    sfx.powerupPickup();
    pushPopupAtBoard("POWER-UP " + POWERUPS[k].label.toUpperCase(), "is-bonus");
    updatePowerupUi();
  }

  function activatePowerup(slotIdx) {
    if (phase !== "playing") return;
    if (slotIdx >= state.powerups.length) return;
    var k = state.powerups[slotIdx];
    var def = POWERUPS[k];
    if (!def) return;
    if (def.needsTarget === null) {
      // Self-fire
      consumePowerup(slotIdx);
      applyPowerupNoTarget(k);
      return;
    }
    if (def.needsTarget === "gem") {
      state.activePowerup = { kind: k, slot: slotIdx };
      phase = "activating";
      showActivationHint("Hammer: click a gem");
      updatePowerupUi();
      return;
    }
    if (def.needsTarget === "color") {
      state.activePowerup = { kind: k, slot: slotIdx };
      phase = "colorPick";
      showColorPicker();
      updatePowerupUi();
      return;
    }
  }

  function applyPowerupNoTarget(k) {
    if (k === "reshuffle") {
      sfx.powerupUse();
      reshuffleBoard();
      pushPopupAtBoard("RESHUFFLED", "is-bonus");
    } else if (k === "moves") {
      sfx.powerupUse();
      state.moves += 5;
      pushPopupAtBoard("+5 MOVES", "is-emerald");
    } else if (k === "multi") {
      sfx.powerupUse();
      state.multiplierActive = 5;
      pushPopupAtBoard("2x ACTIVE", "is-tetris");
    }
    updatePowerupUi();
  }

  function consumePowerup(slotIdx) {
    state.powerups.splice(slotIdx, 1);
    state.activePowerup = null;
    hideActivationHint();
    hideColorPicker();
    updatePowerupUi();
  }

  function applyHammerAt(r, c) {
    var g = state.grid[r][c];
    if (!g) return false;
    if (g.special === SPEC_OBSTACLE) {
      // Hammer breaks obstacles in one hit
      state.grid[r][c] = null;
      var cc = cellCenter(r, c);
      burstAt(cc.x, cc.y, "#aaaaaa", 12);
      sfx.powerupUse();
    } else {
      state.grid[r][c] = null;
      var cc2 = cellCenter(r, c);
      burstAt(cc2.x, cc2.y, GEM_COLORS[g.type].base, 12);
      sfx.powerupUse();
      if (g.scholar) state.scholarSlot = null;
    }
    addScore(40);
    phase = "matching";
    runGravityAndRefill(function () {
      var found = findMatches();
      var has = false;
      for (var k in found.matchSet) { has = true; break; }
      if (has) {
        state.cascadeLevel = 0;
        processCascade(found, null);
      } else {
        finalizeCascade();
      }
    });
    return true;
  }

  function applyColorBomb(targetType) {
    var keys = {};
    var cells = [];
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var g = state.grid[r][c];
        if (!g) continue;
        if (g.type === targetType && g.special !== SPEC_OBSTACLE) {
          var key = r + "," + c;
          keys[key] = true;
          cells.push({ r: r, c: c });
          if (g.scholar) state.scholarSlot = null;
        }
      }
    }
    if (!cells.length) return;
    sfx.powerupUse();
    sfx.specialCreate();
    addScore(cells.length * 60);
    pushPopupAtBoard("COLOR BOMB", "is-legend");
    for (var i = 0; i < cells.length; i++) {
      var cc = cellCenter(cells[i].r, cells[i].c);
      burstAt(cc.x, cc.y, GEM_COLORS[targetType].base, 8);
    }
    shake(0.3, 10);
    phase = "matching";
    setTimeout(function () {
      for (var ci = 0; ci < cells.length; ci++) {
        var mc = cells[ci];
        if (state.grid[mc.r][mc.c]) state.grid[mc.r][mc.c] = null;
      }
      runGravityAndRefill(function () {
        var found = findMatches();
        var has = false;
        for (var k in found.matchSet) { has = true; break; }
        if (has) {
          state.cascadeLevel = 0;
          processCascade(found, null);
        } else {
          finalizeCascade();
        }
      });
    }, reducedMotion ? 30 : 200);
  }

  function updatePowerupUi() {
    if (!dom.powerupSlots) return;
    for (var i = 0; i < dom.powerupSlots.length; i++) {
      var slot = dom.powerupSlots[i];
      if (!slot) continue;
      var iconEl = slot.querySelector(".pu-icon");
      var k = state.powerups[i];
      if (k && POWERUPS[k]) {
        slot.classList.add("is-filled");
        if (iconEl) iconEl.textContent = POWERUPS[k].icon;
        slot.title = POWERUPS[k].label + " — " + POWERUPS[k].desc;
        if (state.activePowerup && state.activePowerup.slot === i) slot.classList.add("is-active");
        else slot.classList.remove("is-active");
      } else {
        slot.classList.remove("is-filled");
        slot.classList.remove("is-active");
        if (iconEl) iconEl.textContent = "";
        slot.title = "Empty slot";
      }
    }
    // Also refresh goal meta
    if (dom.goalMeta) {
      dom.goalMeta.textContent = "Combo x" + Math.max(1, state.cascadeLevel) + " · Power-ups: " + state.powerups.length + (state.multiplierActive > 0 ? " · 2x ON" : "");
    }
  }

  function showActivationHint(text) {
    if (!dom.activationHint) return;
    dom.activationHint.classList.add("show");
    if (dom.activationHintText) dom.activationHintText.textContent = text;
  }
  function hideActivationHint() {
    if (!dom.activationHint) return;
    dom.activationHint.classList.remove("show");
  }

  function showColorPicker() {
    if (!dom.colorPicker || !dom.colorPickerGrid) return;
    var html = "";
    for (var i = 0; i < TYPE_COUNT; i++) {
      var col = GEM_COLORS[i];
      html += '<button class="cp-swatch" type="button" data-type="' + i + '" style="background:linear-gradient(135deg,' + col.light + ',' + col.base + ' 60%,' + col.dark + ');">' + glyphShort(i) + '</button>';
    }
    dom.colorPickerGrid.innerHTML = html;
    var swatches = dom.colorPickerGrid.querySelectorAll(".cp-swatch");
    swatches.forEach(function (sw) {
      sw.addEventListener("click", function () {
        var t = parseInt(sw.getAttribute("data-type"), 10);
        if (state.activePowerup) {
          var slot = state.activePowerup.slot;
          consumePowerup(slot);
          phase = "playing";
          hideColorPicker();
          applyColorBomb(t);
        }
      });
    });
    dom.colorPicker.classList.add("show");
  }
  function hideColorPicker() {
    if (!dom.colorPicker) return;
    dom.colorPicker.classList.remove("show");
  }
  function glyphShort(t) {
    var s = ["S","A","P","Q","C","G"];
    return s[t] || "?";
  }

  // -- Scholar review modal --------------------------------------------------
  function showScholarModal() {
    pauseMusic();
    state.questionsAnsweredTotal++;
    var idx = Math.floor(Math.random() * QUESTIONS.length);
    state.questionIdx = idx;
    var q = QUESTIONS[idx];
    if (dom.questionPrompt) dom.questionPrompt.textContent = q.q;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Gem · " + (q.hint ? q.hint : "Bonus prompt");
    if (dom.explanation) {
      dom.explanation.textContent = "";
      dom.explanation.className = "explanation";
    }
    if (dom.choiceGrid) {
      dom.choiceGrid.innerHTML = "";
      // Render choices in random order, but track correct
      var letters = ["A","B","C","D"];
      var indices = [0,1,2,3];
      // Shuffle
      for (var s = indices.length - 1; s > 0; s--) {
        var j = Math.floor(Math.random() * (s + 1));
        var t = indices[s]; indices[s] = indices[j]; indices[j] = t;
      }
      for (var i = 0; i < indices.length; i++) {
        var origIdx = indices[i];
        var btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.type = "button";
        btn.innerHTML = '<span class="choice-letter">' + letters[i] + '.</span>' + escapeHtml(q.choices[origIdx]);
        (function (oi, b) {
          b.addEventListener("click", function () { handleScholarAnswer(oi, b); });
        })(origIdx, btn);
        dom.choiceGrid.appendChild(btn);
      }
    }
    phase = "question";
    showScreen("question");
  }

  function handleScholarAnswer(chosenIdx, btn) {
    if (phase !== "question") return;
    var q = QUESTIONS[state.questionIdx];
    var correct = chosenIdx === q.correct;
    if (correct) {
      btn.classList.add("is-correct");
      if (dom.explanation) {
        dom.explanation.className = "explanation is-correct";
        dom.explanation.textContent = "Correct! +1500 pts · +12 shards.";
      }
      state.questionsAnsweredCorrect++;
      addScore(1500);
      addShards(12, GAME_ID + "-scholar-correct");
      sfx.scholarCorrect();
      if (window.MrMacsCelebration && !reducedMotion) {
        try { window.MrMacsCelebration.burst({ count: 24, palette: ["#f5c451", "#a991ff", "#4dd49b"] }); } catch (e) {}
      }
    } else {
      btn.classList.add("is-wrong");
      if (dom.explanation) {
        dom.explanation.className = "explanation is-wrong";
        dom.explanation.textContent = "Not quite — but no penalty. Back to the cascade!";
      }
      sfx.scholarWrong();
    }
    setTimeout(resumeFromScholar, correct ? 900 : 700);
  }

  function skipQuestion() {
    if (phase !== "question") return;
    resumeFromScholar();
  }

  function resumeFromScholar() {
    showScreen(null);
    resumeMusic();
    // Continue cascade — gravity + refill on the cleared board
    phase = "matching";
    runGravityAndRefill(function () {
      var found2 = findMatches();
      var has2 = false;
      for (var k in found2.matchSet) { has2 = true; break; }
      if (has2) {
        processCascade(found2, null);
      } else {
        finalizeCascade();
      }
    });
  }

  // -- Score / shards --------------------------------------------------------
  function addScore(n) {
    if (n <= 0) return;
    state.score += Math.floor(n);
    if (state.score > state.best) {
      state.best = state.score;
      writeBest(state.best);
    }
  }

  // -- Particles + screen shake ---------------------------------------------
  function burstAt(x, y, color, count) {
    if (!state) return;
    if (reducedMotion) count = Math.min(count, 4);
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = 60 + Math.random() * 180;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 20,
        life: 0.6 + Math.random() * 0.4,
        ageT: 0,
        color: color || "#f5c451",
        size: 2 + Math.random() * 3,
        gravity: 360
      });
    }
  }
  function updateParticles(dt) {
    if (!state || !state.particles) return;
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];
      p.ageT += dt;
      if (p.ageT >= p.life) { state.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
  }
  function shake(duration, amp) {
    if (reducedMotion) return;
    shakeT = Math.max(shakeT, duration);
    shakeAmp = Math.max(shakeAmp, amp);
  }
  function updateShake(dt) {
    if (shakeT > 0) {
      shakeT -= dt;
      if (shakeT <= 0) { shakeT = 0; shakeAmp = 0; }
    }
  }
  function hitPause(frames) {
    hitPauseFrames = Math.max(hitPauseFrames, frames);
  }

  // -- Popups ----------------------------------------------------------------
  function pushPopup(text, lx, ly, cls) {
    if (!dom.popupOverlay) return;
    var el = document.createElement("div");
    el.className = "popup-text" + (cls ? " " + cls : "");
    el.textContent = text;
    // Convert logical coords to overlay coords
    var rect = canvas.getBoundingClientRect();
    var sx = rect.width / LOGICAL_W;
    var sy = rect.height / LOGICAL_H;
    var sUse = Math.min(sx, sy);
    var ofx = (rect.width - LOGICAL_W * sUse) / 2;
    var ofy = (rect.height - LOGICAL_H * sUse) / 2;
    var px = ofx + lx * sUse;
    var py = ofy + ly * sUse;
    el.style.left = px + "px";
    el.style.top = py + "px";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () { try { dom.popupOverlay.removeChild(el); } catch (e) {} }, reducedMotion ? 380 : 1200);
  }
  function pushPopupAtBoard(text, cls) {
    pushPopup(text, LOGICAL_W / 2, BOARD_Y0 + BOARD_PX / 2, cls);
  }

  // -- Render ----------------------------------------------------------------
  function render() {
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    var sx = rect.width / LOGICAL_W;
    var sy = rect.height / LOGICAL_H;
    var sUse = Math.min(sx, sy);
    var ofx = (rect.width - LOGICAL_W * sUse) / 2;
    var ofy = (rect.height - LOGICAL_H * sUse) / 2;
    scale = sUse;
    offsetX = ofx;
    offsetY = ofy;

    // Apply screen shake
    var shx = 0, shy = 0;
    if (shakeT > 0 && shakeAmp > 0) {
      shx = (Math.random() * 2 - 1) * shakeAmp;
      shy = (Math.random() * 2 - 1) * shakeAmp;
    }
    ctx.save();
    ctx.translate(ofx + shx, ofy + shy);
    ctx.scale(sUse, sUse);

    drawBackground();
    drawBoardFrame();
    drawGrid();
    drawGems();
    drawCursor();
    drawParticles();

    ctx.restore();
  }

  function drawBackground() {
    // Dark editorial backdrop with subtle radial vignette
    var grd = ctx.createRadialGradient(LOGICAL_W / 2, BOARD_Y0 + BOARD_PX / 2, 60, LOGICAL_W / 2, BOARD_Y0 + BOARD_PX / 2, 720);
    grd.addColorStop(0, "rgba(28,18,52,0.4)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }

  function drawBoardFrame() {
    var x = BOARD_X0 - 12, y = BOARD_Y0 - 12, w = BOARD_PX + 24, h = BOARD_PX + 24;
    // Outer bronze frame
    ctx.fillStyle = "#1c1208";
    ctx.fillRect(x, y, w, h);
    // Bronze border highlights
    var grd = ctx.createLinearGradient(x, y, x, y + h);
    grd.addColorStop(0, "#a96e3d");
    grd.addColorStop(0.5, "#5a3818");
    grd.addColorStop(1, "#7a4f23");
    ctx.strokeStyle = grd;
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);

    // Inner deep panel
    ctx.fillStyle = "#070a18";
    ctx.fillRect(BOARD_X0, BOARD_Y0, BOARD_PX, BOARD_PX);
    // Inner highlight
    ctx.strokeStyle = "rgba(169,145,255,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(BOARD_X0 + 0.5, BOARD_Y0 + 0.5, BOARD_PX - 1, BOARD_PX - 1);
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (var i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X0 + i * CELL_PX + 0.5, BOARD_Y0);
      ctx.lineTo(BOARD_X0 + i * CELL_PX + 0.5, BOARD_Y0 + BOARD_PX);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(BOARD_X0, BOARD_Y0 + i * CELL_PX + 0.5);
      ctx.lineTo(BOARD_X0 + BOARD_PX, BOARD_Y0 + i * CELL_PX + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGems() {
    if (!state || !state.grid) return;
    // Calculate swap-pair offsets
    var swap = state.swapPair;
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var g = state.grid[r][c];
        if (!g) continue;
        var cc = cellCenter(r, c);
        var dx = 0, dy = 0;
        var t = state.time;

        // Swap animation offset
        if (swap) {
          var SWAP_S = SWAP_MS / 1000;
          var prog = Math.min(1, swap.t / SWAP_S);
          var ease = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
          if (swap.a.r === r && swap.a.c === c) {
            // visually moving from b -> a (since we already swapped in grid)
            var bcc = cellCenter(swap.b.r, swap.b.c);
            dx = (bcc.x - cc.x) * (1 - ease);
            dy = (bcc.y - cc.y) * (1 - ease);
          } else if (swap.b.r === r && swap.b.c === c) {
            var acc = cellCenter(swap.a.r, swap.a.c);
            dx = (acc.x - cc.x) * (1 - ease);
            dy = (acc.y - cc.y) * (1 - ease);
          }
        }

        var x = cc.x + dx, y = cc.y + dy;

        // Pop (shatter) animation
        var scaleMult = 1;
        var alpha = 1;
        if (g.popT > 0) {
          var pP = Math.min(1, g.popT / (POP_MS / 1000));
          scaleMult = 1 + pP * 0.4;
          alpha = 1 - pP;
        }
        // Birth grow-in
        var bAge = state.time - (g.born || 0);
        if (bAge < 0.18) {
          var bp = bAge / 0.18;
          scaleMult *= (0.5 + bp * 0.5);
        }
        // Subtle breath pulse
        var pulse = 1 + Math.sin(t * 3 + (r + c) * 0.7) * 0.015;
        scaleMult *= pulse;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.scale(scaleMult, scaleMult);

        // Highlight selected
        var isSelected = state.selected && state.selected.r === r && state.selected.c === c;

        if (g.special === SPEC_OBSTACLE) {
          drawObstacle(g);
        } else {
          drawGemBody(g, isSelected);
          if (g.special === SPEC_STRIKER_H || g.special === SPEC_STRIKER_V) drawStrikerHalo(g);
          else if (g.special === SPEC_BOMB) drawBombHalo(g);
          else if (g.special === SPEC_CODEX) drawCodexHalo(g);
          if (g.scholar) drawScholarHalo(g);
        }

        ctx.restore();
      }
    }
  }

  function drawGemBody(g, isSelected) {
    var size = CELL_PX - GEM_PADDING * 2;
    var half = size / 2;
    var col = GEM_COLORS[g.type];
    // Rounded square base
    var radius = 12;

    // Outer rim
    ctx.save();
    var rim = isSelected ? "#fff7d8" : col.rim;
    ctx.fillStyle = rim;
    roundedRect(ctx, -half - 2, -half - 2, size + 4, size + 4, radius + 2);
    ctx.fill();

    // Main body gradient
    var grd = ctx.createLinearGradient(0, -half, 0, half);
    grd.addColorStop(0, col.light);
    grd.addColorStop(0.55, col.base);
    grd.addColorStop(1, col.dark);
    ctx.fillStyle = grd;
    roundedRect(ctx, -half, -half, size, size, radius);
    ctx.fill();

    // Specular highlight on top-left
    ctx.beginPath();
    ctx.moveTo(-half + 6, -half + 6);
    ctx.quadraticCurveTo(0, -half + 4, half - 6, -half + 8);
    ctx.lineTo(half - 12, -half + 14);
    ctx.quadraticCurveTo(0, -half + 14, -half + 10, -half + 18);
    ctx.closePath();
    var hg = ctx.createLinearGradient(0, -half, 0, -half + 20);
    hg.addColorStop(0, "rgba(255,255,255,0.6)");
    hg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hg;
    ctx.fill();

    // Discipline sigil glyph in center (white with shadow)
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    drawSigil(g.type);
    ctx.restore();

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = "#fff7d8";
      ctx.lineWidth = 3;
      roundedRect(ctx, -half - 4, -half - 4, size + 8, size + 8, radius + 4);
      ctx.stroke();
      // Pulsing glow
      ctx.strokeStyle = "rgba(245,196,81," + (0.4 + 0.4 * Math.sin(state.time * 6)) + ")";
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    ctx.restore();
  }

  function roundedRect(c, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr);
    c.quadraticCurveTo(x, y, x + rr, y);
    c.closePath();
  }

  function drawSigil(type) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (type === TYPE_HISTORY) {
      // Scroll: rounded rect with two side curls
      ctx.beginPath();
      ctx.moveTo(-16, -10);
      ctx.lineTo(16, -10);
      ctx.lineTo(16, 10);
      ctx.lineTo(-16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-16, 0, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(16, 0, 6, Math.PI / 2, -Math.PI / 2);
      ctx.stroke();
      // Two horizontal text lines
      ctx.fillStyle = GEM_COLORS[TYPE_HISTORY].dark;
      ctx.fillRect(-12, -4, 18, 1.5);
      ctx.fillRect(-12, 1, 14, 1.5);
    } else if (type === TYPE_SCIENCE) {
      // Atom: nucleus + 3 ellipses
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      for (var i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    } else if (type === TYPE_ART) {
      // Palette: kidney shape with thumb hole and dabs
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      // Thumb hole
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(7, 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Paint dabs in different colors
      var dabs = ["#d04848", "#f5c451", "#5de0f0"];
      for (var d = 0; d < dabs.length; d++) {
        ctx.fillStyle = dabs[d];
        ctx.beginPath();
        ctx.arc(-10 + d * 5, -6 + d * 1.4, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === TYPE_LANGUAGE) {
      // Quill: feather + nib
      ctx.beginPath();
      ctx.moveTo(-12, 14);
      ctx.lineTo(0, 0);
      ctx.lineTo(14, -14);
      ctx.lineTo(10, -10);
      ctx.lineTo(8, -4);
      ctx.lineTo(2, 0);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();
      // Nib
      ctx.fillStyle = GEM_COLORS[TYPE_LANGUAGE].dark;
      ctx.beginPath();
      ctx.moveTo(-12, 14);
      ctx.lineTo(-8, 18);
      ctx.lineTo(-15, 11);
      ctx.closePath();
      ctx.fill();
    } else if (type === TYPE_MATH) {
      // Compass: V shape opening down with two legs
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(-12, 12);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 12);
      ctx.stroke();
      // Hinge dot
      ctx.beginPath();
      ctx.arc(0, -14, 3, 0, Math.PI * 2);
      ctx.fill();
      // Pencil tip
      ctx.beginPath();
      ctx.arc(12, 12, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-12, 12, 2, 0, Math.PI * 2);
      ctx.fill();
      // Arc connecting (compass leg)
      ctx.beginPath();
      ctx.arc(0, -2, 12, 0.6, Math.PI - 0.6);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else if (type === TYPE_GEOGRAPHY) {
      // Globe: sphere with meridian + equator
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GEM_COLORS[TYPE_GEOGRAPHY].dark;
      ctx.lineWidth = 1.5;
      // Equator
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.stroke();
      // Meridians
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawStrikerHalo(g) {
    var t = state.time;
    var size = CELL_PX - GEM_PADDING * 2;
    var half = size / 2;
    ctx.save();
    ctx.strokeStyle = "rgba(245,196,81," + (0.4 + 0.4 * Math.sin(t * 5)) + ")";
    ctx.lineWidth = 3;
    if (g.special === SPEC_STRIKER_H) {
      ctx.beginPath();
      ctx.moveTo(-half - 4, 0);
      ctx.lineTo(half + 4, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -half - 4);
      ctx.lineTo(0, half + 4);
      ctx.stroke();
    }
    // Two arrows at ends
    ctx.fillStyle = "rgba(255,247,216,0.85)";
    if (g.special === SPEC_STRIKER_H) {
      ctx.beginPath();
      ctx.moveTo(half + 4, -4); ctx.lineTo(half + 10, 0); ctx.lineTo(half + 4, 4); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-half - 4, -4); ctx.lineTo(-half - 10, 0); ctx.lineTo(-half - 4, 4); ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-4, half + 4); ctx.lineTo(0, half + 10); ctx.lineTo(4, half + 4); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, -half - 4); ctx.lineTo(0, -half - 10); ctx.lineTo(4, -half - 4); ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBombHalo(g) {
    var t = state.time;
    var size = CELL_PX - GEM_PADDING * 2;
    var half = size / 2;
    ctx.save();
    ctx.strokeStyle = "rgba(255,124,74," + (0.5 + 0.4 * Math.sin(t * 6)) + ")";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, half + 4 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
    // Inner dashed glow
    ctx.fillStyle = "rgba(245,196,81,0.45)";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCodexHalo(g) {
    var t = state.time;
    var size = CELL_PX - GEM_PADDING * 2;
    var half = size / 2;
    ctx.save();
    // Rainbow ring
    var spokes = 6;
    for (var i = 0; i < spokes; i++) {
      ctx.strokeStyle = GEM_COLORS[i].base;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, half + 4 + Math.sin(t * 4 + i) * 2, (i / spokes) * Math.PI * 2 + t * 0.6, ((i + 0.7) / spokes) * Math.PI * 2 + t * 0.6);
      ctx.stroke();
    }
    // Center prism
    ctx.fillStyle = "rgba(255,247,216,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, -8); ctx.lineTo(7, 4); ctx.lineTo(-7, 4); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawScholarHalo(g) {
    var t = state.time;
    var size = CELL_PX - GEM_PADDING * 2;
    var half = size / 2;
    ctx.save();
    // Gold rim
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#f5c451";
    ctx.shadowBlur = 8;
    roundedRect(ctx, -half - 5, -half - 5, size + 10, size + 10, 14);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Rotating "?" in corner
    ctx.translate(half - 10, -half + 10);
    ctx.rotate(t * 1.5);
    ctx.fillStyle = "#fff7d8";
    ctx.strokeStyle = "#a96e3d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // ? glyph
    ctx.fillStyle = "#1a1208";
    ctx.font = "bold 12px 'Fraunces', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 1);
    ctx.restore();
  }

  function drawObstacle(g) {
    var size = CELL_PX - GEM_PADDING * 2;
    var half = size / 2;
    ctx.save();
    // Stone-gray crackled tile
    var grd = ctx.createLinearGradient(0, -half, 0, half);
    grd.addColorStop(0, "#666");
    grd.addColorStop(0.55, "#333");
    grd.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = grd;
    roundedRect(ctx, -half, -half, size, size, 10);
    ctx.fill();
    // Cracks
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.2;
    if (g.hp <= 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
    }
    ctx.beginPath();
    ctx.moveTo(-half + 8, -half + 12); ctx.lineTo(2, -4); ctx.lineTo(half - 6, -half + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-half + 12, half - 8); ctx.lineTo(0, 4); ctx.lineTo(half - 14, half - 6);
    ctx.stroke();
    if (g.hp <= 1) {
      // Extra cracks when nearly broken
      ctx.beginPath();
      ctx.moveTo(-4, -half + 6); ctx.lineTo(2, half - 4);
      ctx.stroke();
    }
    // Lock icon center
    ctx.strokeStyle = "rgba(255,180,140," + (g.hp <= 1 ? 0.85 : 0.55) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -2); ctx.lineTo(0, 2); ctx.lineTo(4, -2);
    ctx.stroke();
    ctx.restore();
  }

  function drawCursor() {
    if (!state || phase === "ended" || phase === "setup") return;
    var c = cellCenter(state.cursor.r, state.cursor.c);
    ctx.save();
    ctx.strokeStyle = "rgba(245,196,81," + (0.5 + 0.3 * Math.sin(state.time * 4)) + ")";
    ctx.lineWidth = 2;
    var half = CELL_PX / 2 - 2;
    roundedRect(ctx, c.x - half, c.y - half, half * 2, half * 2, 12);
    ctx.stroke();
    // Power-up activation cursor cue
    if (phase === "activating" && state.activePowerup && state.activePowerup.kind === "hammer") {
      ctx.fillStyle = "rgba(169,145,255,0.18)";
      roundedRect(ctx, c.x - half, c.y - half, half * 2, half * 2, 12);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    if (!state || !state.particles) return;
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var fade = 1 - (p.ageT / p.life);
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * fade, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // -- Update loop -----------------------------------------------------------
  function update(dt) {
    // Hit-pause: when frames > 0 do not advance time-bound animations
    if (hitPauseFrames > 0) {
      hitPauseFrames--;
      return;
    }

    // Advance pop timers
    if (state && state.grid) {
      for (var r = 0; r < GRID; r++) {
        for (var c = 0; c < GRID; c++) {
          var g = state.grid[r][c];
          if (!g) continue;
          if (g.popT > 0) g.popT += dt;
        }
      }
    }

    // Swap animation
    if (state && state.swapPair) {
      state.swapPair.t += dt;
      var SWAP_S = SWAP_MS / 1000;
      var REV_S = REVERT_MS / 1000;
      var lim = state.swapPair.reverting ? REV_S : SWAP_S;
      if (state.swapPair.t >= lim) {
        if (state.swapPair.reverting) {
          state.swapPair = null;
          phase = "playing";
        } else {
          // Commit
          commitSwap();
        }
      }
    }
  }

  // -- HUD update ------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudTarget) dom.hudTarget.textContent = formatNumber(state.target);
    if (dom.hudMoves) {
      dom.hudMoves.textContent = formatNumber(state.moves);
      var mc = dom.hudMoves.parentElement;
      if (mc) {
        mc.classList.toggle("is-warning", state.moves <= 5 && state.moves > 2);
        mc.classList.toggle("is-danger", state.moves <= 2);
      }
    }
    if (dom.hudLevel) dom.hudLevel.textContent = formatNumber(state.level);
    if (dom.hudLives) {
      dom.hudLives.textContent = formatNumber(state.lives);
      var lc = dom.hudLives.parentElement;
      if (lc) {
        lc.classList.toggle("is-warning", state.lives === 1);
        lc.classList.toggle("is-danger", state.lives === 0);
      }
    }
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best, state.score));
    if (dom.goalName) {
      dom.goalName.textContent = "Reach " + formatNumber(state.target) + " in " + state.moves + " move" + (state.moves === 1 ? "" : "s");
    }
    if (dom.goalMeta) {
      var mult = state.multiplierActive > 0 ? " · 2x ON" : "";
      dom.goalMeta.textContent = "Combo x" + Math.max(1, state.cascadeLevel) + " · Power-ups: " + state.powerups.length + mult;
    }
  }

  // -- Run summary -----------------------------------------------------------
  function finalizeRunStats() {
    // Cap shards based on score (already added incrementally)
    var leftover = Math.max(0, Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 250)));
    if (leftover > 0) addShards(leftover);
  }

  function showEndScreen() {
    if (phase !== "ended") return;
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Citadel Toppled You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Citadel · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Levels Cleared</div><div class="end-cell-value">' + Math.max(0, state.level - 1) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Cascades</div><div class="end-cell-value">' + formatNumber(state.cascadesThisRun) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Specials Forged</div><div class="end-cell-value">' + formatNumber(state.stats.specials) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.listAchievements) {
        var _ach = window.MrMacsProfile.listAchievements();
        var _startSet = {};
        (state.achievementsAtRunStart || []).forEach(function (id) { _startSet[id] = true; });
        var _newly = _ach.filter(function (a) { return a.unlocked && !_startSet[a.id]; });
        if (_newly.length > 0) {
          var _recapEl = document.getElementById("endRecap");
          if (!_recapEl) {
            _recapEl = document.createElement("div");
            _recapEl.id = "endRecap";
            _recapEl.className = "end-recap";
            var _endGrid = document.getElementById("endGrid");
            if (_endGrid && _endGrid.parentNode) { _endGrid.parentNode.insertBefore(_recapEl, _endGrid); }
          }
          _recapEl.innerHTML = '<h3 class="end-recap-title">🏆 Unlocked This Run</h3>' +
            '<ul class="end-recap-list">' +
            _newly.slice(0, 5).map(function (a) {
              return '<li class="end-recap-item" data-tier="' + ((a.def && a.def.tier) || "bronze") + '">' +
                '<span class="end-recap-icon">' + ((a.def && a.def.icon) || "🏆") + '</span>' +
                '<span class="end-recap-name">' + ((a.def && a.def.title) || a.id) + '</span>' +
                '</li>';
            }).join('') +
            '</ul>';
          _recapEl.hidden = false;
        }
      }
    } catch (e) {}
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { level: state.maxLevel, cascades: state.cascadesThisRun });
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
          cascades: state.cascadesThisRun,
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
          file: "games/citadel/index.html"
        });
      }
    } catch (e) {}
  }
  function recordRunCompletion() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordCompletion) {
        window.MrMacsProfile.recordCompletion(GAME_ID, state.score);
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("citadel:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("citadel:best", String(Math.floor(v)));
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
  var dragStart = null;
  var dragGem = null;

  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
        if (k === "ArrowUp")    { moveCursor(0, -1); e.preventDefault(); return; }
        if (k === "ArrowDown")  { moveCursor(0, 1);  e.preventDefault(); return; }
        if (k === "ArrowLeft")  { moveCursor(-1, 0); e.preventDefault(); return; }
        if (k === "ArrowRight") { moveCursor(1, 0);  e.preventDefault(); return; }
        if (k === "Enter" || k === " ") { selectAtCursor(); e.preventDefault(); return; }
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
      if (phase === "activating" || phase === "colorPick") {
        if (k === "Escape" || k === "Esc") {
          state.activePowerup = null;
          phase = "playing";
          hideActivationHint();
          hideColorPicker();
          updatePowerupUi();
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
    bindMouse();
    bindTouch();
  }

  function moveCursor(dx, dy) {
    state.cursor.r = Math.max(0, Math.min(GRID - 1, state.cursor.r + dy));
    state.cursor.c = Math.max(0, Math.min(GRID - 1, state.cursor.c + dx));
    sfx.select();
  }

  function selectAtCursor() {
    var pos = { r: state.cursor.r, c: state.cursor.c };
    handleCellTap(pos.r, pos.c);
  }

  function bindMouse() {
    canvas.addEventListener("mousedown", function (e) {
      var pos = canvasToCell(e.clientX, e.clientY);
      if (!pos) return;
      dragStart = { x: e.clientX, y: e.clientY };
      dragGem = pos;
    });
    canvas.addEventListener("mousemove", function (e) {
      if (!dragStart || !dragGem) return;
      var dx = e.clientX - dragStart.x;
      var dy = e.clientY - dragStart.y;
      var SWIPE = 22;
      if (Math.abs(dx) > SWIPE || Math.abs(dy) > SWIPE) {
        var dir = null;
        if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? { dr: 0, dc: 1 } : { dr: 0, dc: -1 };
        else dir = dy > 0 ? { dr: 1, dc: 0 } : { dr: -1, dc: 0 };
        var target = { r: dragGem.r + dir.dr, c: dragGem.c + dir.dc };
        if (inBounds(target.r, target.c)) {
          handleSwipe(dragGem, target);
        }
        dragStart = null;
        dragGem = null;
      }
    });
    canvas.addEventListener("mouseup", function (e) {
      if (!dragStart) return;
      var dx = e.clientX - dragStart.x;
      var dy = e.clientY - dragStart.y;
      var moved = Math.abs(dx) + Math.abs(dy);
      if (moved < 8 && dragGem) {
        // Treat as a tap
        handleCellTap(dragGem.r, dragGem.c);
      }
      dragStart = null;
      dragGem = null;
    });
    canvas.addEventListener("mouseleave", function () {
      dragStart = null; dragGem = null;
    });
  }

  function bindTouch() {
    var touchStart = null;
    var touchGem = null;
    canvas.addEventListener("touchstart", function (e) {
      if (!e.touches || !e.touches.length) return;
      var t = e.touches[0];
      var pos = canvasToCell(t.clientX, t.clientY);
      if (!pos) return;
      touchStart = { x: t.clientX, y: t.clientY };
      touchGem = pos;
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (!touchStart || !touchGem) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - touchStart.x;
      var dy = t.clientY - touchStart.y;
      var SWIPE = 22;
      if (Math.abs(dx) > SWIPE || Math.abs(dy) > SWIPE) {
        var dir = null;
        if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? { dr: 0, dc: 1 } : { dr: 0, dc: -1 };
        else dir = dy > 0 ? { dr: 1, dc: 0 } : { dr: -1, dc: 0 };
        var target = { r: touchGem.r + dir.dr, c: touchGem.c + dir.dc };
        if (inBounds(target.r, target.c)) {
          handleSwipe(touchGem, target);
        }
        touchStart = null;
        touchGem = null;
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      if (!touchStart || !touchGem) { touchStart = null; touchGem = null; return; }
      var t = e.changedTouches[0];
      var dx = t.clientX - touchStart.x;
      var dy = t.clientY - touchStart.y;
      var moved = Math.abs(dx) + Math.abs(dy);
      if (moved < 8) {
        handleCellTap(touchGem.r, touchGem.c);
      }
      touchStart = null;
      touchGem = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; touchGem = null; }, { passive: true });
  }

  function canvasToCell(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var sx = rect.width / LOGICAL_W;
    var sy = rect.height / LOGICAL_H;
    var sUse = Math.min(sx, sy);
    var ofx = (rect.width - LOGICAL_W * sUse) / 2;
    var ofy = (rect.height - LOGICAL_H * sUse) / 2;
    var lx = (clientX - rect.left - ofx) / sUse;
    var ly = (clientY - rect.top - ofy) / sUse;
    return pointToCell(lx, ly);
  }

  function handleSwipe(from, to) {
    if (phase === "playing") {
      state.cursor.r = from.r; state.cursor.c = from.c;
      trySwap(from, to);
    }
  }

  function handleCellTap(r, c) {
    if (phase === "activating" && state.activePowerup && state.activePowerup.kind === "hammer") {
      var slot = state.activePowerup.slot;
      consumePowerup(slot);
      phase = "playing";
      hideActivationHint();
      applyHammerAt(r, c);
      return;
    }
    if (phase !== "playing") return;
    state.cursor.r = r;
    state.cursor.c = c;
    if (!state.selected) {
      state.selected = { r: r, c: c };
      sfx.select();
      return;
    }
    if (state.selected.r === r && state.selected.c === c) {
      state.selected = null;
      return;
    }
    if (adjacent(state.selected, { r: r, c: c })) {
      var ok = trySwap(state.selected, { r: r, c: c });
      state.selected = null;
      if (!ok) sfx.swapInvalid();
      return;
    }
    // Not adjacent — re-select
    state.selected = { r: r, c: c };
    sfx.select();
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
    // Power-up slots
    for (var i = 0; i < dom.powerupSlots.length; i++) {
      (function (idx) {
        var s = dom.powerupSlots[idx];
        if (!s) return;
        s.addEventListener("click", function () { activatePowerup(idx); });
      })(i);
    }
    if (dom.colorPickerCancel) {
      dom.colorPickerCancel.addEventListener("click", function () {
        state.activePowerup = null;
        phase = "playing";
        hideColorPicker();
        updatePowerupUi();
      });
    }
  }

  function exitToArcade() {
    stopMusic();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  function newRun() {
    lastBonusLifeThreshold = 0;
    try {
      var _p = window.MrMacsProfile && window.MrMacsProfile.get();
      state.achievementsAtRunStart = _p && _p.achievements ? Object.keys(_p.achievements) : [];
    } catch (e) { state.achievementsAtRunStart = []; }
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    updatePowerupUi();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state || snap || {};
    lastBonusLifeThreshold = Math.floor((s.score || 0) / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    initState({
      score: s.score || 0,
      level: s.level || 1,
      maxLevel: s.level || 1,
      lives: s.lives != null ? s.lives : LIVES_INIT,
      best: readBest()
    });
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    updatePowerupUi();
    recordPlayWithProfile();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    var snapState = snap && snap.state ? snap.state : snap;
    if (snapState && (snapState.score || snapState.level) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snapState.score || 0) +
        ' &middot; Level ' + (snapState.level || 1) +
        ' &middot; Lives ' + (snapState.lives != null ? snapState.lives : LIVES_INIT) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Citadel Scores</div>';
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

  // -- Utilities -------------------------------------------------------------
  function formatNumber(n) {
    if (n == null) return "0";
    return Math.floor(n).toLocaleString();
  }
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  // -- Main loop -------------------------------------------------------------
  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    if (state) {
      state.time += dt;
      if (phase === "playing") {
        if (ts - lastSnapshotTs > SNAPSHOT_INTERVAL_MS) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
      }
    }
    update(dt);
    if (state) {
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase !== "setup" && phase !== "ended") {
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
