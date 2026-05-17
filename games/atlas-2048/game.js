/* ===========================================================================
   Atlas 2048 — Sliding merge puzzle · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · Era tiles (Stone Age → Singularity → Omega)
   4x4 grid (5x5 unlock at score 100k) · 3 lives per run · 5 power-ups
   Scholar tiles recur every 6-14 merges; each merge opens an optional review prompt.
   Game first; review optional.
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "atlas-2048";
  var GAME_TITLE = "Atlas 2048";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 800;

  // Board geometry — we render to logical coords and let the canvas scale.
  var BOARD_PAD_TOP = 168;          // leave room for HUD + ribbon
  var BOARD_PAD_BOTTOM = 60;
  var BOARD_PAD_SIDE = 110;         // leave room for powerup tray on left
  var TILE_GAP = 12;                // px between tiles
  var TILE_RADIUS = 12;

  // Lives & game shape
  var LIVES_INIT = 3;
  var GRID_UNLOCK_SCORE = 100000;
  var SHARDS_CAP = 200;

  // Scholar tile drop — RECURRING throughout the game.
  // Initial scholar appears at SCHOLAR_FIRST_MERGE_*; subsequent scholars
  // re-arm at SCHOLAR_MERGE_* merges after the previous one resolves.
  // This gives 4-8 review opportunities per ~70-merge game, vs. the old 1.
  var SCHOLAR_FIRST_MERGE_MIN = 4;      // first scholar appears early to teach the mechanic
  var SCHOLAR_FIRST_MERGE_MAX = 8;
  var SCHOLAR_MERGE_MIN = 6;            // each subsequent scholar
  var SCHOLAR_MERGE_MAX = 12;

  // Powerup default counts at run start
  var POWERUP_INIT = {
    undo: 5,
    smash: 2,
    doubleScore: 1,
    hint: 3,
    spawnFour: 1
  };
  var UNDO_MAX = 5;
  var DOUBLE_SCORE_DURATION_MERGES = 10;

  // Scoring
  var SCORE_SCHOLAR_CORRECT = 1500;
  var SHARDS_PER_SCHOLAR = 12;

  // Era table — index = log2(value) - 1 (so value 2 => index 0)
  // Each entry has name, glyph (period symbol), tile-fill, tile-stroke, tile-text.
  // Higher tiers go more luminous and saturated.
  var ERAS = [
    /*  2   */ { v:    2, name: "Stone Age",        glyph: "▲",  fill: "#3a342a", stroke: "#8c7a68", text: "#f4eede", glow: "rgba(140,122,104,0.35)" },
    /*  4   */ { v:    4, name: "Bronze Age",       glyph: "⚫",  fill: "#3d2c18", stroke: "#b08a4a", text: "#fde9c4", glow: "rgba(176,138,74,0.4)" },
    /*  8   */ { v:    8, name: "Iron Age",         glyph: "⚒",  fill: "#1f2a32", stroke: "#6a7280", text: "#dde6f0", glow: "rgba(106,114,128,0.4)" },
    /* 16   */ { v:   16, name: "Classical",        glyph: "⚱",  fill: "#3a3018", stroke: "#c8b770", text: "#fff5d2", glow: "rgba(200,183,112,0.45)" },
    /* 32   */ { v:   32, name: "Medieval",         glyph: "✝",  fill: "#2a1c38", stroke: "#6f5680", text: "#ecd7ff", glow: "rgba(111,86,128,0.45)" },
    /* 64   */ { v:   64, name: "Renaissance",      glyph: "⚜",  fill: "#3a1a08", stroke: "#d96f2f", text: "#ffe2c2", glow: "rgba(217,111,47,0.55)" },
    /*128   */ { v:  128, name: "Enlightenment",    glyph: "✎",  fill: "#0e2738", stroke: "#5db8e0", text: "#d6eef9", glow: "rgba(93,184,224,0.55)" },
    /*256   */ { v:  256, name: "Industrial",       glyph: "⚙",  fill: "#3a1a0a", stroke: "#b85a26", text: "#ffe0c0", glow: "rgba(184,90,38,0.55)" },
    /*512   */ { v:  512, name: "Modern",           glyph: "✈",  fill: "#1a2030", stroke: "#d0d8ee", text: "#ffffff", glow: "rgba(208,216,238,0.55)" },
    /*1024  */ { v: 1024, name: "Atomic",           glyph: "☢",  fill: "#0e2a1c", stroke: "#4dd49b", text: "#cdf6e2", glow: "rgba(77,212,155,0.6)" },
    /*2048  */ { v: 2048, name: "Information",      glyph: "⚙",  fill: "#0a2c34", stroke: "#5de0f0", text: "#dffaff", glow: "rgba(93,224,240,0.65)" },
    /*4096  */ { v: 4096, name: "Singularity",      glyph: "⚛",  fill: "#3a2c0a", stroke: "#f5c451", text: "#fff3cf", glow: "rgba(245,196,81,0.7)" },
    /*8192  */ { v: 8192, name: "Omega",            glyph: "∞",  fill: "#3a0c2a", stroke: "#f07bb8", text: "#ffd6ec", glow: "rgba(240,123,184,0.8)" }
  ];
  // Cap at 8192 = "Omega" (label-only); story-wise the listed top is 4096 Singularity.
  function eraForValue(v) {
    var i = Math.round(Math.log(v) / Math.log(2)) - 1;
    if (i < 0) i = 0;
    if (i >= ERAS.length) i = ERAS.length - 1;
    return ERAS[i];
  }
  function eraIndexForValue(v) {
    var i = Math.round(Math.log(v) / Math.log(2)) - 1;
    if (i < 0) i = 0;
    if (i >= ERAS.length) i = ERAS.length - 1;
    return i;
  }

  // -- Inline review bank (28 entries) --------------------------------------
  // History-themed sweep across the era arc (matches tile palette + curriculum).
  var INLINE_BANK = [
    { prompt: "The earliest human-made stone tools are associated with which archaeological period?", choices: ["The Paleolithic (Stone Age)", "The Bronze Age", "The Iron Age", "The Classical Age"], correctText: "The Paleolithic (Stone Age)" },
    { prompt: "The Bronze Age is defined by widespread use of:", choices: ["An alloy of copper and tin", "Pure copper only", "Iron weapons", "Steel plows"], correctText: "An alloy of copper and tin" },
    { prompt: "Iron weapons gave a decisive military edge to which early empire?", choices: ["The Hittites", "The Ancient Egyptians of the Old Kingdom", "The Sumerians", "The Olmec"], correctText: "The Hittites" },
    { prompt: "Which civilization's law code (c. 1754 BCE) is among the earliest written legal systems?", choices: ["Hammurabi's Code (Babylon)", "The Twelve Tables (Rome)", "Justinian's Code", "The Code Napoleon"], correctText: "Hammurabi's Code (Babylon)" },
    { prompt: "Athenian democracy in the Classical period limited voting to:", choices: ["Free adult male citizens", "All adult residents", "Only landowners over 40", "Free women and men alike"], correctText: "Free adult male citizens" },
    { prompt: "The Roman Republic transitioned to an empire under:", choices: ["Augustus (Octavian)", "Julius Caesar", "Cicero", "Constantine"], correctText: "Augustus (Octavian)" },
    { prompt: "The fall of the Western Roman Empire is conventionally dated to:", choices: ["476 CE", "313 CE", "800 CE", "1066 CE"], correctText: "476 CE" },
    { prompt: "The medieval European feudal system was based primarily on exchanges of:", choices: ["Land for military service and labor", "Cash for taxes", "Trade goods for spices", "Crops for guild membership"], correctText: "Land for military service and labor" },
    { prompt: "The Black Death of the 14th century killed approximately what fraction of Europe's population?", choices: ["About one-third", "About one-tenth", "About two-thirds", "About one-twentieth"], correctText: "About one-third" },
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence" },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg" },
    { prompt: "The Protestant Reformation began with:", choices: ["Luther's 95 Theses", "The Council of Trent", "Henry VIII's annulment", "Calvin's Institutes"], correctText: "Luther's 95 Theses" },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, and diseases between hemispheres", "A 1492 trade treaty", "African slave routes only", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, and diseases between hemispheres" },
    { prompt: "Which Enlightenment thinker argued for separation of powers in 'The Spirit of the Laws'?", choices: ["Montesquieu", "Voltaire", "Rousseau", "Adam Smith"], correctText: "Montesquieu" },
    { prompt: "The American Declaration of Independence (1776) was primarily authored by:", choices: ["Thomas Jefferson", "Benjamin Franklin", "James Madison", "George Washington"], correctText: "Thomas Jefferson" },
    { prompt: "The French Revolution's slogan 'Liberty, Equality, Fraternity' arose during which decade?", choices: ["The 1790s", "The 1750s", "The 1820s", "The 1860s"], correctText: "The 1790s" },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain" },
    { prompt: "Which invention most powered early factories?", choices: ["The steam engine", "The electric motor", "The internal combustion engine", "The assembly line"], correctText: "The steam engine" },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "German unification", "Russian Revolution"], correctText: "Assassination of Archduke Franz Ferdinand" },
    { prompt: "The Bolshevik Revolution (1917) brought to power:", choices: ["Vladimir Lenin and the Communists", "Tsar Nicholas II", "Alexander Kerensky permanently", "Joseph Stalin's son"], correctText: "Vladimir Lenin and the Communists" },
    { prompt: "The Treaty of Versailles (1919) blamed the war primarily on:", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany" },
    { prompt: "The Cold War was a struggle primarily between:", choices: ["U.S. and Soviet Union", "U.S. and China", "Britain and France", "Germany and Russia"], correctText: "U.S. and Soviet Union" },
    { prompt: "The Atomic Age opened with the bombings of which two cities (1945)?", choices: ["Hiroshima and Nagasaki", "Tokyo and Osaka", "Berlin and Munich", "Moscow and Stalingrad"], correctText: "Hiroshima and Nagasaki" },
    { prompt: "Sputnik (1957), launched by the USSR, triggered:", choices: ["The space race and U.S. founding of NASA", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The space race and U.S. founding of NASA" },
    { prompt: "The Berlin Wall fell in:", choices: ["1989", "1991", "1985", "1979"], correctText: "1989" },
    { prompt: "The World Wide Web was invented at CERN in 1989 by:", choices: ["Tim Berners-Lee", "Bill Gates", "Steve Jobs", "Vint Cerf"], correctText: "Tim Berners-Lee" },
    { prompt: "The Information Age is most closely associated with the rise of:", choices: ["Personal computing and the internet", "Steam-powered factories", "Coal-fired railroads", "Telegraphy as primary communication"], correctText: "Personal computing and the internet" },
    { prompt: "The technological 'Singularity', as popularized by Ray Kurzweil, refers to:", choices: ["A predicted point when AI surpasses human general intelligence", "The end of Moore's Law", "The first transistor's invention", "The discovery of nuclear fission"], correctText: "A predicted point when AI surpasses human general intelligence" }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | dying | smashing
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var lastBonusLifeThreshold = 0;

  var activeQuestion = null;
  var pendingScholarMerge = null; // { row, col, value }

  // Powerup arming state
  var smashArmed = false;
  var hintShownDir = null;        // string "up" | "down" | "left" | "right" | null
  var hintShownT = 0;             // seconds remaining

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

  // Pitch up the merge tone with era index — gives a satisfying staircase.
  function mergePitchForEra(eraIdx) {
    var base = 480;
    var step = 1.122; // ~quarter-tone
    return base * Math.pow(step, Math.min(eraIdx, ERAS.length - 1));
  }

  var sfx = {
    tileSlide: function () {
      sfxTone(360, 0.06, { type: "triangle", volume: 0.07, endFreq: 280 });
    },
    tileMerge: function (eraIdx) {
      var f = mergePitchForEra(eraIdx);
      sfxTone(f, 0.10, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(f * 1.5, 0.08, { type: "triangle", volume: 0.10 }); }, 50);
    },
    eraUnlock: function (eraIdx) {
      var f = mergePitchForEra(eraIdx);
      [f, f * 1.25, f * 1.5, f * 2.0].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    scholarMerge: function () {
      [988, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.12, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    scholarCorrect: function () {
      [784, 1175, 1568, 1865, 2349].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.14, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholarWrong: function () {
      sfxTone(440, 0.20, { type: "sawtooth", volume: 0.12, endFreq: 220 });
    },
    gameOver: function () {
      sfxNoise(0.6, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.7, { type: "sawtooth", volume: 0.18, endFreq: 40 });
    },
    milestone: function () {
      // 2048 reached
      [523, 659, 784, 988, 1175, 1568, 2093, 2637].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.22, { type: "triangle", volume: 0.20 }); }, i * 90);
      });
    },
    undo: function () {
      sfxTone(660, 0.08, { type: "triangle", volume: 0.10, endFreq: 880 });
    },
    lifeLost: function () {
      sfxNoise(0.30, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.4, { type: "sawtooth", volume: 0.14, endFreq: 50 });
    },
    powerupPickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerupUse: function () {
      sfxTone(740, 0.10, { type: "square", volume: 0.14 });
      setTimeout(function () { sfxTone(1100, 0.10, { type: "square", volume: 0.14 }); }, 60);
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("atlasCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudEra = $("hudEra");
    dom.hudGrid = $("hudGrid");
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
    dom.tcLeft = $("tcLeft");
    dom.tcRight = $("tcRight");
    dom.tcUp = $("tcUp");
    dom.tcDown = $("tcDown");
    // Powerup buttons + counts
    dom.puUndo = $("puUndo");
    dom.puUndoCount = $("puUndoCount");
    dom.puSmash = $("puSmash");
    dom.puSmashCount = $("puSmashCount");
    dom.puDouble = $("puDouble");
    dom.puDoubleCount = $("puDoubleCount");
    dom.puHint = $("puHint");
    dom.puHintCount = $("puHintCount");
    dom.puFour = $("puFour");
    dom.puFourCount = $("puFourCount");
  }

  // -- Grid model ------------------------------------------------------------
  // grid = 2D array, grid[row][col] = tile or null.
  // tile = { value, row, col, scholar, justSpawned, justMerged, mergedFromValue, animT }
  function makeEmptyGrid(size) {
    var g = [];
    for (var r = 0; r < size; r++) {
      var row = [];
      for (var c = 0; c < size; c++) row.push(null);
      g.push(row);
    }
    return g;
  }
  function cloneGrid(g) {
    var size = g.length;
    var out = makeEmptyGrid(size);
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var t = g[r][c];
        if (t) out[r][c] = { value: t.value, row: r, col: c, scholar: !!t.scholar, justSpawned: false, justMerged: false, mergedFromValue: 0, animT: 0 };
      }
    }
    return out;
  }

  function findEmptyCells(g) {
    var size = g.length;
    var out = [];
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (!g[r][c]) out.push({ row: r, col: c });
      }
    }
    return out;
  }

  function spawnTile(opts) {
    opts = opts || {};
    var g = state.grid;
    var empties = findEmptyCells(g);
    if (!empties.length) return null;
    var pick = empties[Math.floor(Math.random() * empties.length)];
    var value;
    if (opts.value) {
      value = opts.value;
    } else if (state.spawnFourArmed) {
      value = 4;
      state.spawnFourArmed = false;
      pushPopup("SPAWN 4!", LOGICAL_W / 2, 130, "is-bonus");
    } else {
      // Standard 2048: 90% chance of 2, 10% of 4
      value = Math.random() < 0.9 ? 2 : 4;
    }
    var scholar = false;
    // Scholar tile: spawn it once per game lifetime when merge count hits the target.
    if (!state.scholarSpawned && !opts.value && state.totalMerges >= state.scholarTargetMerges) {
      scholar = true;
      state.scholarSpawned = true;
      pushPopup("SCHOLAR APPEARS", LOGICAL_W / 2, 130, "is-bonus");
    }
    var t = {
      value: value,
      row: pick.row,
      col: pick.col,
      scholar: scholar,
      justSpawned: true,
      justMerged: false,
      mergedFromValue: 0,
      animT: 0
    };
    g[pick.row][pick.col] = t;
    return t;
  }

  // -- Slide engine ----------------------------------------------------------
  // direction: "left" | "right" | "up" | "down"
  // Returns object { moved: bool, score: number, scholarMerged: tile-or-null, mergesThisMove: count, highestMerge: value }
  function slide(dir) {
    var size = state.grid.length;
    var moved = false;
    var earned = 0;
    var scholarMergedTile = null;
    var merges = 0;
    var highestMerge = 0;

    // Build traversal order so tiles slide toward edge.
    var rows = []; for (var r = 0; r < size; r++) rows.push(r);
    var cols = []; for (var c = 0; c < size; c++) cols.push(c);
    var traversalRows = rows.slice();
    var traversalCols = cols.slice();
    if (dir === "down") traversalRows.reverse();
    if (dir === "right") traversalCols.reverse();

    // Reset per-move flags
    for (var rr = 0; rr < size; rr++) {
      for (var cc = 0; cc < size; cc++) {
        var tt = state.grid[rr][cc];
        if (tt) { tt.justSpawned = false; tt.justMerged = false; tt.mergedFromValue = 0; tt.animT = 0; }
      }
    }
    // Track which tiles in the current grid have already merged this move (cannot merge twice).
    var mergedAt = makeEmptyGrid(size); // boolean grid

    for (var i = 0; i < traversalRows.length; i++) {
      for (var j = 0; j < traversalCols.length; j++) {
        var r = traversalRows[i];
        var c = traversalCols[j];
        var tile = state.grid[r][c];
        if (!tile) continue;

        var nr = r, nc = c;
        var dRow = 0, dCol = 0;
        if (dir === "left") dCol = -1;
        else if (dir === "right") dCol = 1;
        else if (dir === "up") dRow = -1;
        else if (dir === "down") dRow = 1;

        // Find farthest position
        while (true) {
          var tr = nr + dRow;
          var tc = nc + dCol;
          if (tr < 0 || tr >= size || tc < 0 || tc >= size) break;
          if (state.grid[tr][tc]) break;
          nr = tr; nc = tc;
        }
        // Now check merge with neighbor in direction
        var ar = nr + dRow;
        var ac = nc + dCol;
        if (ar >= 0 && ar < size && ac >= 0 && ac < size) {
          var neighbor = state.grid[ar][ac];
          if (neighbor && neighbor.value === tile.value && !mergedAt[ar][ac]) {
            // Merge!
            var newValue = tile.value * 2;
            var bothScholar = tile.scholar && neighbor.scholar;
            // Scholar merge requires merging two scholar tiles. In practice we only
            // ever spawn ONE scholar tile per game lifetime; instead, scholar prompt
            // triggers when a scholar tile merges with ANY equal-value tile.
            var scholarInvolved = tile.scholar || neighbor.scholar;

            var merged = {
              value: newValue,
              row: ar, col: ac,
              scholar: false, // merged result is normal
              justSpawned: false,
              justMerged: true,
              mergedFromValue: tile.value,
              animT: 0
            };
            state.grid[ar][ac] = merged;
            state.grid[r][c] = null;
            mergedAt[ar][ac] = true;
            moved = true;
            merges++;
            highestMerge = Math.max(highestMerge, newValue);

            var doubleMult = state.doubleScoreMergesLeft > 0 ? 2 : 1;
            earned += newValue * doubleMult;
            if (state.doubleScoreMergesLeft > 0) state.doubleScoreMergesLeft--;

            if (scholarInvolved) scholarMergedTile = merged;
            continue;
          }
        }
        // Otherwise just move
        if (nr !== r || nc !== c) {
          state.grid[nr][nc] = tile;
          state.grid[r][c] = null;
          tile.row = nr;
          tile.col = nc;
          moved = true;
        }
      }
    }

    return { moved: moved, score: earned, scholarMerged: scholarMergedTile, mergesThisMove: merges, highestMerge: highestMerge };
  }

  // Pure-function variant for hint computation: simulates a move on a fresh copy.
  function simulateSlide(g, dir) {
    var size = g.length;
    var moved = false;
    var earned = 0;
    var merges = 0;
    var working = cloneGrid(g);
    var mergedAt = makeEmptyGrid(size);

    var traversalRows = []; for (var r = 0; r < size; r++) traversalRows.push(r);
    var traversalCols = []; for (var c = 0; c < size; c++) traversalCols.push(c);
    if (dir === "down") traversalRows.reverse();
    if (dir === "right") traversalCols.reverse();

    for (var i = 0; i < traversalRows.length; i++) {
      for (var j = 0; j < traversalCols.length; j++) {
        var rr = traversalRows[i];
        var cc = traversalCols[j];
        var tile = working[rr][cc];
        if (!tile) continue;
        var nr = rr, nc = cc;
        var dRow = 0, dCol = 0;
        if (dir === "left") dCol = -1;
        else if (dir === "right") dCol = 1;
        else if (dir === "up") dRow = -1;
        else if (dir === "down") dRow = 1;
        while (true) {
          var tr = nr + dRow;
          var tc = nc + dCol;
          if (tr < 0 || tr >= size || tc < 0 || tc >= size) break;
          if (working[tr][tc]) break;
          nr = tr; nc = tc;
        }
        var ar = nr + dRow;
        var ac = nc + dCol;
        if (ar >= 0 && ar < size && ac >= 0 && ac < size) {
          var neigh = working[ar][ac];
          if (neigh && neigh.value === tile.value && !mergedAt[ar][ac]) {
            working[ar][ac] = { value: tile.value * 2, row: ar, col: ac, scholar: false };
            working[rr][cc] = null;
            mergedAt[ar][ac] = true;
            moved = true;
            merges++;
            earned += tile.value * 2;
            continue;
          }
        }
        if (nr !== rr || nc !== cc) {
          working[nr][nc] = tile;
          working[rr][cc] = null;
          tile.row = nr;
          tile.col = nc;
          moved = true;
        }
      }
    }

    return { moved: moved, score: earned, merges: merges, grid: working };
  }

  function anyMovesLeft() {
    var dirs = ["left", "right", "up", "down"];
    for (var i = 0; i < dirs.length; i++) {
      var sim = simulateSlide(state.grid, dirs[i]);
      if (sim.moved) return true;
    }
    return false;
  }

  // -- Snapshot / undo -------------------------------------------------------
  function makeSnapshot() {
    return {
      grid: cloneGrid(state.grid),
      score: state.score,
      doubleScoreMergesLeft: state.doubleScoreMergesLeft,
      spawnFourArmed: state.spawnFourArmed,
      totalMerges: state.totalMerges,
      scholarSpawned: state.scholarSpawned,
      mergesThisLife: state.mergesThisLife,
      gridSize: state.gridSize
    };
  }
  function pushHistory() {
    if (!state.history) state.history = [];
    state.history.push(makeSnapshot());
    while (state.history.length > UNDO_MAX + 1) state.history.shift();
  }
  function popHistoryAndRestore() {
    if (!state.history || state.history.length === 0) return false;
    // Discard the current state's snapshot (top), then restore the previous one.
    var snap = state.history.pop();
    if (!snap) return false;
    state.grid = snap.grid;
    state.score = snap.score;
    state.doubleScoreMergesLeft = snap.doubleScoreMergesLeft;
    state.spawnFourArmed = snap.spawnFourArmed;
    state.totalMerges = snap.totalMerges;
    state.scholarSpawned = snap.scholarSpawned;
    state.mergesThisLife = snap.mergesThisLife;
    state.gridSize = snap.gridSize;
    return true;
  }

  // -- Lives & progression ---------------------------------------------------
  function loseLife(reason) {
    if (state.lives <= 0) return gameOver();
    state.lives -= 1;
    sfx.lifeLost();
    addShake(6, 0.45);
    pushPopup("LIFE LOST", LOGICAL_W / 2, LOGICAL_H / 2 - 40, "is-warn");
    pushPopup("Lives: " + state.lives, LOGICAL_W / 2, LOGICAL_H / 2, "is-warn");
    if (state.lives <= 0) {
      setTimeout(gameOver, 1100);
      return;
    }
    setTimeout(function () {
      // Reset board for fresh life, keep score + best
      state.grid = makeEmptyGrid(state.gridSize);
      state.history = [];
      state.mergesThisLife = 0;
      // Keep totalMerges so scholar spawn target remains coherent across lives.
      // If a scholar tile was on the board (now wiped), re-arm so the next life
      // can still spawn one — otherwise players who die holding a scholar lose
      // all review opportunities for the rest of the run.
      if (state.scholarSpawned) {
        rearmScholar();
      }
      // Two starting tiles per fresh life.
      spawnTile({ value: 2 });
      spawnTile({ value: 2 });
      pushPopup("NEW BOARD", LOGICAL_W / 2, LOGICAL_H / 2 - 20, "is-bonus");
      updateHud();
    }, 1000);
  }

  // -- Lifecycle: game over --------------------------------------------------
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
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 600));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Time's Up" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Atlas 2048 · Run complete";
    if (dom.endGrid) {
      var topEra = ERAS[state.highestEraIdx] || ERAS[0];
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Top Era</div><div class="end-cell-value">' + escapeHtml(topEra.name) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Merges</div><div class="end-cell-value">' + formatNumber(state.totalMerges) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Highest Tile</div><div class="end-cell-value">' + formatNumber(topEra.v) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    stopMusic();
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var gridSize = opts.gridSize || 4;
    state = {
      gridSize: gridSize,
      grid: makeEmptyGrid(gridSize),
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      best: opts.best || readBest(),
      highestEraIdx: opts.highestEraIdx || 0,
      // Powerup counts (consumable)
      pu: {
        undo: opts.pu && opts.pu.undo != null ? opts.pu.undo : POWERUP_INIT.undo,
        smash: opts.pu && opts.pu.smash != null ? opts.pu.smash : POWERUP_INIT.smash,
        doubleScore: opts.pu && opts.pu.doubleScore != null ? opts.pu.doubleScore : POWERUP_INIT.doubleScore,
        hint: opts.pu && opts.pu.hint != null ? opts.pu.hint : POWERUP_INIT.hint,
        spawnFour: opts.pu && opts.pu.spawnFour != null ? opts.pu.spawnFour : POWERUP_INIT.spawnFour
      },
      // Active power-up effects
      doubleScoreMergesLeft: opts.doubleScoreMergesLeft || 0,
      spawnFourArmed: !!opts.spawnFourArmed,
      // Scholar lifetime
      totalMerges: opts.totalMerges || 0,
      mergesThisLife: opts.mergesThisLife || 0,
      scholarTargetMerges: opts.scholarTargetMerges || (SCHOLAR_FIRST_MERGE_MIN + Math.floor(Math.random() * (SCHOLAR_FIRST_MERGE_MAX - SCHOLAR_FIRST_MERGE_MIN + 1))),
      scholarSpawned: !!opts.scholarSpawned,
      // Stats
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      milestonesReached: opts.milestonesReached || { reachedTwo048: false, gridUnlocked5: false },
      // FX
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      embers: [],
      bgStars: opts.bgStars || generateStars(),
      time: 0,
      // Undo history
      history: []
    };
    // Two starting tiles
    spawnTile({ value: 2 });
    spawnTile({ value: 2 });
    smashArmed = false;
    hintShownDir = null;
    hintShownT = 0;
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

  // -- Move flow -------------------------------------------------------------
  function tryMove(dir) {
    if (phase !== "playing") return;
    if (smashArmed) return; // movement disabled while smash is armed
    if (state.doubleScoreMergesLeft > 0) {
      // armed indicator already on UI
    }
    var pre = makeSnapshot();
    var result = slide(dir);
    if (!result.moved) {
      sfx.tileSlide();
      return;
    }
    sfx.tileSlide();
    state.history.push(pre);
    while (state.history.length > UNDO_MAX) state.history.shift();
    if (result.score > 0) {
      state.score += result.score;
      pushPopup("+" + formatNumber(result.score), LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-score");
    }
    if (result.mergesThisMove > 0) {
      state.totalMerges += result.mergesThisMove;
      state.mergesThisLife += result.mergesThisMove;
      var topEraIdx = eraIndexForValue(result.highestMerge);
      if (topEraIdx > state.highestEraIdx) {
        state.highestEraIdx = topEraIdx;
        sfx.eraUnlock(topEraIdx);
        pushPopup("ERA: " + ERAS[topEraIdx].name.toUpperCase(), LOGICAL_W / 2, 110, "is-legend");
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 24, palette: [ERAS[topEraIdx].stroke, "#f5c451", "#5db8e0"] });
          }
        } catch (e) {}
      } else {
        sfx.tileMerge(topEraIdx);
      }
      // Milestone: 2048 reached
      if (!state.milestonesReached.reachedTwo048 && result.highestMerge >= 2048) {
        state.milestonesReached.reachedTwo048 = true;
        sfx.milestone();
        pushPopup("INFORMATION AGE!", LOGICAL_W / 2, LOGICAL_H / 2 - 40, "is-tetris");
        pushPopup("YOU REACHED 2048", LOGICAL_W / 2, LOGICAL_H / 2 + 6, "is-bonus");
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 60, palette: ["#5de0f0", "#f5c451", "#a991ff", "#4dd49b"] });
          }
        } catch (e) {}
      }
      // Milestone: 5x5 unlock at 100k
      if (!state.milestonesReached.gridUnlocked5 && state.score >= GRID_UNLOCK_SCORE && state.gridSize === 4) {
        state.milestonesReached.gridUnlocked5 = true;
        sfx.milestone();
        pushPopup("5x5 GRID UNLOCKED!", LOGICAL_W / 2, LOGICAL_H / 2 - 40, "is-tetris");
        // Expand the grid: copy tiles into a 5x5 grid centered at top-left.
        expandGridTo5();
      }
    }
    // Spawn new tile (unless scholar prompt is opening)
    if (result.scholarMerged) {
      pendingScholarMerge = result.scholarMerged;
      sfx.scholarMerge();
      // We still spawn a new tile so the board doesn't stall after the prompt.
      spawnTile();
      hintShownDir = null;
      openQuestion();
      checkEndOfMoveState();
      return;
    }
    spawnTile();
    hintShownDir = null;
    checkEndOfMoveState();
  }

  function expandGridTo5() {
    var oldGrid = state.grid;
    var newGrid = makeEmptyGrid(5);
    // Center the old 4x4 inside the new 5x5: offset (0,0) so 4x4 occupies rows 0..3, cols 0..3
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var t = oldGrid[r][c];
        if (t) {
          newGrid[r][c] = t;
          t.row = r; t.col = c;
        }
      }
    }
    state.gridSize = 5;
    state.grid = newGrid;
    // Reset history (board changed shape)
    state.history = [];
  }

  function checkEndOfMoveState() {
    updateHud();
    if (!anyMovesLeft()) {
      // No moves left = lose a life
      loseLife("nomoves");
    }
  }

  // -- Powerups: actions -----------------------------------------------------
  function usePuUndo() {
    if (state.pu.undo <= 0) return;
    if (!state.history || state.history.length === 0) {
      pushPopup("NOTHING TO UNDO", LOGICAL_W / 2, LOGICAL_H / 2, "is-warn");
      return;
    }
    var snap = state.history.pop();
    if (!snap) return;
    state.grid = snap.grid;
    state.score = snap.score;
    state.doubleScoreMergesLeft = snap.doubleScoreMergesLeft;
    state.spawnFourArmed = snap.spawnFourArmed;
    state.totalMerges = snap.totalMerges;
    state.scholarSpawned = snap.scholarSpawned;
    state.mergesThisLife = snap.mergesThisLife;
    state.gridSize = snap.gridSize;
    state.pu.undo--;
    sfx.undo();
    pushPopup("UNDO", LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-bonus");
    updateHud();
  }
  function armPuSmash() {
    if (state.pu.smash <= 0) return;
    smashArmed = !smashArmed;
    // Update canvas cursor so the user sees the crosshair "pick a tile" hint
    if (canvas) canvas.classList.toggle("smash-armed", smashArmed);
    if (smashArmed) {
      pushPopup("TAP A TILE TO SMASH", LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-bonus");
    } else {
      pushPopup("SMASH CANCELED", LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-warn");
    }
    updatePowerupUI();
  }
  function performPuSmashAt(row, col) {
    if (!smashArmed) return false;
    var t = state.grid[row][col];
    if (!t) return false;
    pushHistory();
    state.grid[row][col] = null;
    state.pu.smash--;
    smashArmed = false;
    if (canvas) canvas.classList.remove("smash-armed");
    sfx.powerupUse();
    spawnEmber(boardCenterX(col), boardCenterY(row), 16, "#f5c451");
    pushPopup("SMASHED " + eraForValue(t.value).name.toUpperCase(), LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-warn");
    updateHud();
    return true;
  }
  function usePuDoubleScore() {
    if (state.pu.doubleScore <= 0) return;
    state.pu.doubleScore--;
    state.doubleScoreMergesLeft = DOUBLE_SCORE_DURATION_MERGES;
    sfx.powerupUse();
    pushPopup("2x SCORE: NEXT 10 MERGES", LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-bonus");
    updatePowerupUI();
  }
  function usePuHint() {
    if (state.pu.hint <= 0) return;
    var dirs = ["up", "down", "left", "right"];
    var bestDir = null, bestScore = -1, bestMerges = -1;
    for (var i = 0; i < dirs.length; i++) {
      var sim = simulateSlide(state.grid, dirs[i]);
      if (!sim.moved) continue;
      // Prefer moves with more merges; tiebreak by score
      if (sim.merges > bestMerges || (sim.merges === bestMerges && sim.score > bestScore)) {
        bestMerges = sim.merges;
        bestScore = sim.score;
        bestDir = dirs[i];
      }
    }
    if (!bestDir) {
      pushPopup("NO MOVES — TRY UNDO", LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-warn");
      return;
    }
    state.pu.hint--;
    hintShownDir = bestDir;
    hintShownT = 3.0;
    sfx.powerupUse();
    pushPopup("HINT: " + bestDir.toUpperCase(), LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-bonus");
    updatePowerupUI();
  }
  function usePuSpawnFour() {
    if (state.pu.spawnFour <= 0) return;
    if (state.spawnFourArmed) {
      pushPopup("ALREADY ARMED", LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-warn");
      return;
    }
    state.pu.spawnFour--;
    state.spawnFourArmed = true;
    sfx.powerupUse();
    pushPopup("NEXT SPAWN = 4", LOGICAL_W / 2, BOARD_PAD_TOP - 12, "is-bonus");
    updatePowerupUI();
  }

  // -- Board geometry helpers (logical coords) ------------------------------
  function boardSizePx() {
    // square board within logical area
    var maxW = LOGICAL_W - BOARD_PAD_SIDE * 2 + 30; // a touch wider since tray is on left only
    var maxH = LOGICAL_H - BOARD_PAD_TOP - BOARD_PAD_BOTTOM;
    return Math.min(maxW, maxH);
  }
  function boardLeftPx() {
    var bs = boardSizePx();
    // Center horizontally but biased a bit right because of left tray.
    return Math.max(BOARD_PAD_SIDE, (LOGICAL_W - bs) / 2 + 12);
  }
  function boardTopPx() {
    return BOARD_PAD_TOP;
  }
  function tileSizePx() {
    var bs = boardSizePx();
    return (bs - TILE_GAP * (state.gridSize + 1)) / state.gridSize;
  }
  function boardCenterX(col) {
    return boardLeftPx() + TILE_GAP + col * (tileSizePx() + TILE_GAP) + tileSizePx() / 2;
  }
  function boardCenterY(row) {
    return boardTopPx() + TILE_GAP + row * (tileSizePx() + TILE_GAP) + tileSizePx() / 2;
  }
  function pixelToCell(px, py) {
    // Convert logical-coord pixel to cell row/col (or null).
    var bl = boardLeftPx();
    var bt = boardTopPx();
    var ts = tileSizePx();
    var rx = px - bl - TILE_GAP;
    var ry = py - bt - TILE_GAP;
    if (rx < 0 || ry < 0) return null;
    var col = Math.floor(rx / (ts + TILE_GAP));
    var row = Math.floor(ry / (ts + TILE_GAP));
    if (row < 0 || col < 0 || row >= state.gridSize || col >= state.gridSize) return null;
    // Reject if click was in the gap rather than the cell.
    var withinX = rx - col * (ts + TILE_GAP);
    var withinY = ry - row * (ts + TILE_GAP);
    if (withinX > ts || withinY > ts) return null;
    return { row: row, col: col };
  }

  // -- Render ---------------------------------------------------------------
  function render() {
    if (!ctx || !canvas) return;
    var rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background fill (cabinet wood / void)
    ctx.fillStyle = "#0a0612";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if (state && state.shake) {
      ctx.translate(state.shake.x, state.shake.y);
    }

    // Cabinet panel inside logical area
    ctx.save();
    var grad = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 3, 0, LOGICAL_W / 2, LOGICAL_H / 3, LOGICAL_W * 0.7);
    grad.addColorStop(0, "rgba(36,18,54,0.95)");
    grad.addColorStop(1, "rgba(8,4,18,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.restore();

    // Stars
    drawStars();

    // Board frame
    drawBoardFrame();

    // Tiles
    drawTiles();

    // Embers
    drawEmbers();

    // Hint arrow overlay
    drawHintArrow();

    ctx.restore();
  }

  function drawStars() {
    if (!state) return;
    ctx.save();
    for (var i = 0; i < state.bgStars.length; i++) {
      var s = state.bgStars[i];
      var t = state.time * s.twinkleSpeed + s.twinkle;
      var alpha = 0.18 + Math.abs(Math.sin(t)) * 0.42;
      ctx.fillStyle = "rgba(220, 230, 255, " + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBoardFrame() {
    if (!state) return;
    var bl = boardLeftPx();
    var bt = boardTopPx();
    var bs = boardSizePx();
    ctx.save();
    // Outer board panel
    ctx.beginPath();
    var rad = 18;
    rrect(ctx, bl - 8, bt - 8, bs + 16, bs + 16, rad);
    ctx.fillStyle = "rgba(28, 18, 44, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner cells (empty)
    var ts = tileSizePx();
    for (var r = 0; r < state.gridSize; r++) {
      for (var c = 0; c < state.gridSize; c++) {
        var x = bl + TILE_GAP + c * (ts + TILE_GAP);
        var y = bt + TILE_GAP + r * (ts + TILE_GAP);
        rrect(ctx, x, y, ts, ts, TILE_RADIUS);
        ctx.fillStyle = "rgba(8, 4, 18, 0.55)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawTiles() {
    if (!state) return;
    var ts = tileSizePx();
    var bl = boardLeftPx();
    var bt = boardTopPx();
    for (var r = 0; r < state.gridSize; r++) {
      for (var c = 0; c < state.gridSize; c++) {
        var t = state.grid[r][c];
        if (!t) continue;
        // animT is incremented properly in updateTiles(dt) — do NOT also add 1/60 here
        // to avoid double-increment causing animation stacking at high frame rates.
        var era = eraForValue(t.value);
        var x = bl + TILE_GAP + c * (ts + TILE_GAP);
        var y = bt + TILE_GAP + r * (ts + TILE_GAP);
        var sclK = 1.0;
        if (t.justSpawned && t.animT < 0.22) {
          sclK = 0.6 + 0.4 * (t.animT / 0.22);
        }
        if (t.justMerged && t.animT < 0.18) {
          sclK = 1.0 + 0.16 * (1 - t.animT / 0.18);
        }
        var pad = (1 - sclK) * ts / 2;
        drawTileBox(x + pad, y + pad, ts - pad * 2, era, t);
      }
    }
  }

  function drawTileBox(x, y, ts, era, tile) {
    ctx.save();
    // Glow halo
    if (tile.justMerged) {
      ctx.shadowColor = era.glow;
      ctx.shadowBlur = 22;
    } else {
      ctx.shadowColor = era.glow;
      ctx.shadowBlur = 8;
    }
    rrect(ctx, x, y, ts, ts, TILE_RADIUS);
    var tg = ctx.createLinearGradient(x, y, x, y + ts);
    tg.addColorStop(0, lighten(era.fill, 0.16));
    tg.addColorStop(1, era.fill);
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = era.stroke;
    ctx.stroke();

    // Scholar gold rim if scholar tile
    if (tile.scholar) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#f5c451";
      ctx.shadowColor = "rgba(245,196,81,0.6)";
      ctx.shadowBlur = 12;
      rrect(ctx, x + 3, y + 3, ts - 6, ts - 6, TILE_RADIUS - 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Era name (small, top) — clipped to tile width so long names don't overflow
    ctx.fillStyle = era.text;
    var eraFontSize = Math.max(9, Math.floor(ts * 0.10));
    ctx.font = "700 " + eraFontSize + "px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // Measure and truncate if wider than tile (with 4px side padding each side)
    var eraLabel = era.name.toUpperCase();
    var maxLabelW = ts - 8;
    while (eraLabel.length > 3 && ctx.measureText(eraLabel).width > maxLabelW) {
      eraLabel = eraLabel.slice(0, -1);
    }
    if (eraLabel.length < era.name.length) eraLabel = eraLabel.trimRight();
    ctx.fillText(eraLabel, x + ts / 2, y + 6);

    // Glyph (centered, mid)
    ctx.font = "900 " + Math.floor(ts * 0.40) + "px 'Fraunces', serif";
    ctx.textBaseline = "middle";
    ctx.fillText(tile.scholar ? "?" : era.glyph, x + ts / 2, y + ts / 2 + 4);

    // Value (bottom)
    ctx.font = "800 " + Math.max(11, Math.floor(ts * 0.16)) + "px 'JetBrains Mono', monospace";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = era.text;
    ctx.fillText(formatNumber(tile.value), x + ts / 2, y + ts - 6);

    ctx.restore();
  }

  // Slight color lighten helper (hex -> hex)
  function lighten(hex, amt) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substr(0, 2), 16);
    var g = parseInt(h.substr(2, 2), 16);
    var b = parseInt(h.substr(4, 2), 16);
    r = Math.min(255, Math.floor(r + (255 - r) * amt));
    g = Math.min(255, Math.floor(g + (255 - g) * amt));
    b = Math.min(255, Math.floor(b + (255 - b) * amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  // Rounded rect path
  function rrect(c, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function drawHintArrow() {
    if (!state) return;
    if (!hintShownDir || hintShownT <= 0) return;
    var bl = boardLeftPx();
    var bt = boardTopPx();
    var bs = boardSizePx();
    var cx = bl + bs / 2;
    var cy = bt + bs / 2;
    ctx.save();
    var pulse = 0.5 + 0.5 * Math.abs(Math.sin(state.time * 4));
    ctx.fillStyle = "rgba(245, 196, 81, " + (0.55 + 0.35 * pulse).toFixed(3) + ")";
    ctx.strokeStyle = "rgba(245, 196, 81, 0.92)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    var size = 60 + pulse * 18;
    if (hintShownDir === "up") {
      ctx.moveTo(cx, cy - size);
      ctx.lineTo(cx + size * 0.6, cy);
      ctx.lineTo(cx + size * 0.25, cy);
      ctx.lineTo(cx + size * 0.25, cy + size * 0.6);
      ctx.lineTo(cx - size * 0.25, cy + size * 0.6);
      ctx.lineTo(cx - size * 0.25, cy);
      ctx.lineTo(cx - size * 0.6, cy);
    } else if (hintShownDir === "down") {
      ctx.moveTo(cx, cy + size);
      ctx.lineTo(cx + size * 0.6, cy);
      ctx.lineTo(cx + size * 0.25, cy);
      ctx.lineTo(cx + size * 0.25, cy - size * 0.6);
      ctx.lineTo(cx - size * 0.25, cy - size * 0.6);
      ctx.lineTo(cx - size * 0.25, cy);
      ctx.lineTo(cx - size * 0.6, cy);
    } else if (hintShownDir === "left") {
      ctx.moveTo(cx - size, cy);
      ctx.lineTo(cx, cy + size * 0.6);
      ctx.lineTo(cx, cy + size * 0.25);
      ctx.lineTo(cx + size * 0.6, cy + size * 0.25);
      ctx.lineTo(cx + size * 0.6, cy - size * 0.25);
      ctx.lineTo(cx, cy - size * 0.25);
      ctx.lineTo(cx, cy - size * 0.6);
    } else if (hintShownDir === "right") {
      ctx.moveTo(cx + size, cy);
      ctx.lineTo(cx, cy + size * 0.6);
      ctx.lineTo(cx, cy + size * 0.25);
      ctx.lineTo(cx - size * 0.6, cy + size * 0.25);
      ctx.lineTo(cx - size * 0.6, cy - size * 0.25);
      ctx.lineTo(cx, cy - size * 0.25);
      ctx.lineTo(cx, cy - size * 0.6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // -- HUD update -----------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = state.lives;
    if (dom.hudEra) {
      var era = ERAS[state.highestEraIdx] || ERAS[0];
      dom.hudEra.textContent = formatNumber(era.v);
    }
    if (dom.hudGrid) dom.hudGrid.textContent = state.gridSize + "x" + state.gridSize;
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      var topEra = ERAS[state.highestEraIdx] || ERAS[0];
      dom.goalName.textContent = topEra.name;
    }
    if (dom.goalMeta) {
      var bits = [];
      if (state.doubleScoreMergesLeft > 0) bits.push("2x x" + state.doubleScoreMergesLeft);
      if (state.spawnFourArmed) bits.push("SPAWN 4");
      if (smashArmed) bits.push("SMASH ARMED");
      if (hintShownDir) bits.push("HINT: " + hintShownDir.toUpperCase());
      dom.goalMeta.textContent = bits.length ? bits.join(" · ") : "Powerups · ready";
    }
    updatePowerupUI();
  }
  function updatePowerupUI() {
    if (!state) return;
    if (dom.puUndoCount) dom.puUndoCount.textContent = state.pu.undo;
    if (dom.puSmashCount) dom.puSmashCount.textContent = state.pu.smash;
    if (dom.puDoubleCount) dom.puDoubleCount.textContent = state.pu.doubleScore;
    if (dom.puHintCount) dom.puHintCount.textContent = state.pu.hint;
    if (dom.puFourCount) dom.puFourCount.textContent = state.pu.spawnFour;
    setDisabled(dom.puUndo, state.pu.undo <= 0 || (state.history && state.history.length === 0));
    setDisabled(dom.puSmash, state.pu.smash <= 0);
    setDisabled(dom.puDouble, state.pu.doubleScore <= 0);
    setDisabled(dom.puHint, state.pu.hint <= 0);
    setDisabled(dom.puFour, state.pu.spawnFour <= 0 || state.spawnFourArmed);
    if (dom.puSmash) dom.puSmash.classList.toggle("is-armed", smashArmed);
    if (dom.puFour) dom.puFour.classList.toggle("is-armed", state.spawnFourArmed);
    if (dom.puDouble) dom.puDouble.classList.toggle("is-armed", state.doubleScoreMergesLeft > 0);
  }
  function setDisabled(btn, on) {
    if (!btn) return;
    if (on) btn.setAttribute("disabled", "true");
    else btn.removeAttribute("disabled");
  }

  function formatNumber(n) {
    return Math.floor(n).toLocaleString("en-US");
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
          highestEra: ERAS[state.highestEraIdx] && ERAS[state.highestEraIdx].name,
          highestTile: ERAS[state.highestEraIdx] && ERAS[state.highestEraIdx].v,
          merges: state.totalMerges
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
          gridSize: state.gridSize,
          highestEraIdx: state.highestEraIdx,
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
          file: "games/atlas-2048/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("atlas-2048:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("atlas-2048:best", String(Math.floor(v)));
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
        if (k === "a" || k === "A" || k === "ArrowLeft")  { tryMove("left");  e.preventDefault(); return; }
        if (k === "d" || k === "D" || k === "ArrowRight") { tryMove("right"); e.preventDefault(); return; }
        if (k === "w" || k === "W" || k === "ArrowUp")    { tryMove("up");    e.preventDefault(); return; }
        if (k === "s" || k === "S" || k === "ArrowDown")  { tryMove("down");  e.preventDefault(); return; }
        // Powerup hotkeys
        if (k === "z" || k === "Z") { usePuUndo(); e.preventDefault(); return; }
        if (k === "x" || k === "X") { armPuSmash(); e.preventDefault(); return; }
        if (k === "c" || k === "C") { usePuDoubleScore(); e.preventDefault(); return; }
        if (k === "v" || k === "V") { usePuHint(); e.preventDefault(); return; }
        if (k === "b" || k === "B") { usePuSpawnFour(); e.preventDefault(); return; }
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
        var hm = document.getElementById("helpModal");
        if (hm && hm.classList.contains("show")) { closeHelp(); e.preventDefault(); return; }
        if (phase === "playing" || phase === "paused") togglePause();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
      }
    });
    bindTouch();
    bindTouchControls();
    bindBoardClick();
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
      var SWIPE = 28;
      if (ax < SWIPE && ay < SWIPE && dt < 280) {
        // Tap on a tile (smash if armed)
        if (smashArmed) {
          var rect = canvas.getBoundingClientRect();
          var px = (touchStart.x - rect.left - offsetX) / scale;
          var py = (touchStart.y - rect.top - offsetY) / scale;
          var cell = pixelToCell(px, py);
          if (cell) performPuSmashAt(cell.row, cell.col);
        }
      } else {
        var dir;
        if (ay > ax) dir = (dy < 0) ? "up" : "down";
        else dir = (dx < 0) ? "left" : "right";
        tryMove(dir);
      }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });
  }

  function bindBoardClick() {
    canvas.addEventListener("click", function (e) {
      if (phase !== "playing") return;
      if (!smashArmed) return;
      var rect = canvas.getBoundingClientRect();
      var px = (e.clientX - rect.left - offsetX) / scale;
      var py = (e.clientY - rect.top - offsetY) / scale;
      var cell = pixelToCell(px, py);
      if (cell) performPuSmashAt(cell.row, cell.col);
    });
  }

  function bindTouchControls() {
    function bindDir(btn, dir) {
      if (!btn) return;
      var fire = function (e) {
        if (e) e.preventDefault();
        tryMove(dir);
      };
      btn.addEventListener("click", fire);
      // Must be non-passive so preventDefault() suppresses scroll on touch devices
      btn.addEventListener("touchstart", fire, { passive: false });
      // touchend fires after touchstart; prevent ghost click that would fire twice
      btn.addEventListener("touchend", function (e) { if (e) e.preventDefault(); }, { passive: false });
    }
    bindDir(dom.tcLeft, "left");
    bindDir(dom.tcRight, "right");
    bindDir(dom.tcUp, "up");
    bindDir(dom.tcDown, "down");
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
  // ── How to Play modal ───────────────────────────────────────────────────────
  function openHelp() {
    var modal = document.getElementById("helpModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "helpModal";
      modal.className = "modal-overlay help-overlay";
      modal.innerHTML = [
        '<div class="modal-card help-card">',
        '  <button class="modal-close" aria-label="Close how to play">×</button>',
        '  <h2>How to Play &mdash; Atlas 2048</h2>',
        '  <h3>Goal</h3>',
        '  <p>Slide era tiles so equal tiles collide and <strong>merge</strong> into the next era. Reach <strong>2048 (Information Age)</strong> to ascend, then push toward the <strong>Singularity</strong> and beyond. You lose a board when no moves remain; three boards per run.</p>',
        '  <h3>Controls</h3>',
        '  <table><thead><tr><th>Key</th><th>Action</th></tr></thead><tbody>',
        '  <tr><td><kbd>W</kbd>/<kbd>A</kbd>/<kbd>S</kbd>/<kbd>D</kbd> or Arrows</td><td>Slide all tiles in that direction</td></tr>',
        '  <tr><td><kbd>Z</kbd></td><td>Undo last move</td></tr>',
        '  <tr><td><kbd>X</kbd></td><td>Smash one tile off the board</td></tr>',
        '  <tr><td><kbd>C</kbd></td><td>2× score for next 10 merges</td></tr>',
        '  <tr><td><kbd>V</kbd></td><td>Hint &mdash; highlights the best slide direction</td></tr>',
        '  <tr><td><kbd>B</kbd></td><td>Spawn a tile of value 4 next turn</td></tr>',
        '  <tr><td><kbd>Esc</kbd> / <kbd>P</kbd></td><td>Pause / unpause</td></tr>',
        '  </tbody></table>',
        '  <h3>Boards (Lives)</h3>',
        '  <p>You have <strong>3 boards</strong>. When no valid slide exists, that board ends and a fresh grid begins. Reaching <strong>100 000 points</strong> upgrades your grid to <strong>5×5</strong>.</p>',
        '  <h3>Era Tier System</h3>',
        '  <table><thead><tr><th>Tile value</th><th>Era</th></tr></thead><tbody>',
        '  <tr><td>2</td><td>Stone Age</td></tr>',
        '  <tr><td>4</td><td>Bronze Age</td></tr>',
        '  <tr><td>8</td><td>Iron Age</td></tr>',
        '  <tr><td>16</td><td>Classical</td></tr>',
        '  <tr><td>32</td><td>Medieval</td></tr>',
        '  <tr><td>64</td><td>Renaissance</td></tr>',
        '  <tr><td>128</td><td>Enlightenment</td></tr>',
        '  <tr><td>256</td><td>Industrial</td></tr>',
        '  <tr><td>512</td><td>Modern</td></tr>',
        '  <tr><td>1024</td><td>Atomic</td></tr>',
        '  <tr><td>2048</td><td>Information Age &#9733;</td></tr>',
        '  <tr><td>4096+</td><td>Singularity &amp; beyond</td></tr>',
        '  </tbody></table>',
        '  <div class="scholar-note">&#127979; <strong>Scholar Tile</strong> &mdash; rare gold-rimmed tile. Merge a scholar tile with another tile to trigger an optional review question. Correct answers earn <strong>+1500 pts</strong> and 12 shards. Skip any time with no penalty.</div>',
        '</div>'
      ].join("\n");
      document.body.appendChild(modal);
      modal.addEventListener("click", function (e) { if (e.target === modal) closeHelp(); });
      var closeBtn = modal.querySelector(".modal-close");
      if (closeBtn) closeBtn.addEventListener("click", closeHelp);
    }
    modal.classList.add("show");
  }
  function closeHelp() {
    var modal = document.getElementById("helpModal");
    if (modal) modal.classList.remove("show");
  }

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
    var helpBtn = document.getElementById("helpBtn");
    if (helpBtn) helpBtn.addEventListener("click", openHelp);
    // Powerup buttons
    if (dom.puUndo) dom.puUndo.addEventListener("click", usePuUndo);
    if (dom.puSmash) dom.puSmash.addEventListener("click", armPuSmash);
    if (dom.puDouble) dom.puDouble.addEventListener("click", usePuDoubleScore);
    if (dom.puHint) dom.puHint.addEventListener("click", usePuHint);
    if (dom.puFour) dom.puFour.addEventListener("click", usePuSpawnFour);
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("atlas-2048");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "atlas-2048", { compact: false });
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

  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
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
    initState({
      score: s.score || 0,
      gridSize: s.gridSize || 4,
      highestEraIdx: s.highestEraIdx || 0,
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
    if (snap && snap.state && snap.state.score && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      var topName = (ERAS[snap.state.highestEraIdx] && ERAS[snap.state.highestEraIdx].name) || "Stone Age";
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Top Era ' + escapeHtml(topName) +
        ' &middot; Grid ' + (snap.state.gridSize || 4) + 'x' + (snap.state.gridSize || 4) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Atlas 2048 Scores</div>';
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

  // -- Scholar question modal ------------------------------------------------
  function openQuestion() {
    // _MMRM_PATCHED_ — review-mix resurfaces wrong-answer queue

    // MRMAC_QUESTION_VALIDATOR_V1 — validate every candidate; retry up to 10× via inline bank
    var __mrmacIsValid = (typeof window !== "undefined" && window.MrMacsValidQuestion) || function () { return true; };
    activeQuestion = null;
    try {
      var __mmrm = window.MrMacsReviewMix && window.MrMacsReviewMix.maybeDue();
      if (__mmrm && __mrmacIsValid(__mmrm)) activeQuestion = __mmrm;
    } catch (__e) {}
    if (!activeQuestion && window.MrMacsPickValidQuestion) {
      activeQuestion = window.MrMacsPickValidQuestion(function () {
        return INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
      }, 10);
    }
    if (!activeQuestion) activeQuestion = INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
    prevPhase = phase;
    phase = "question";
    renderQuestion();
    pauseMusic();
    showScreen("question");
    saveSnapshot();
  }

  function renderQuestion() {
    if (!activeQuestion) return;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Tile";
    dom.questionPrompt.textContent = activeQuestion.prompt;
    dom.explanation.textContent = "";
    dom.explanation.className = "explanation";
    var letters = ["A", "B", "C", "D"];
    var choices = activeQuestion.choices.slice();
    // Shuffle (Fisher-Yates)
    for (var i = choices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = choices[i]; choices[i] = choices[j]; choices[j] = tmp;
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

    // _MMRM_GRADED_ — feed result to spaced-repetition Leitner system

    try { if (window.MrMacsReviewMix) window.MrMacsReviewMix.gradeIfResurfaced(activeQuestion, correct); } catch (e) {}
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    btns.forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute("data-text") === activeQuestion.correctText) b.classList.add("is-correct");
      else if (b === btn) b.classList.add("is-wrong");
    });
    if (correct) {
      dom.explanation.textContent = "Decoded! +" + SCORE_SCHOLAR_CORRECT + " plus " + SHARDS_PER_SCHOLAR + " shards.";
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

  function rearmScholar() {
    // Re-arm so another scholar tile will spawn in 6-12 more merges.
    // This keeps the review opportunities flowing throughout a game.
    state.scholarSpawned = false;
    state.scholarTargetMerges = state.totalMerges +
      SCHOLAR_MERGE_MIN +
      Math.floor(Math.random() * (SCHOLAR_MERGE_MAX - SCHOLAR_MERGE_MIN + 1));
  }

  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += SCORE_SCHOLAR_CORRECT;
      addShards(SHARDS_PER_SCHOLAR, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5db8e0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCORE_SCHOLAR_CORRECT + " SCHOLAR", LOGICAL_W / 2, 90, "is-bonus");
    }
    rearmScholar();
    activeQuestion = null;
    pendingScholarMerge = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    if (phase === "question") phase = "playing";
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function skipQuestion() {
    rearmScholar();
    activeQuestion = null;
    pendingScholarMerge = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    if (phase === "question") phase = "playing";
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // -- Particles / FX --------------------------------------------------------
  function spawnEmber(x, y, n, color) {
    n = n || 6;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 30 + Math.random() * 90;
      state.embers.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        life: 0.6 + Math.random() * 0.4,
        totalLife: 0.6 + Math.random() * 0.4,
        color: color || "#f0a070",
        r: 1 + Math.random() * 2
      });
    }
  }
  function updateEmbers(dt) {
    for (var i = state.embers.length - 1; i >= 0; i--) {
      var e = state.embers[i];
      e.life -= dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += 200 * dt;
      e.vx *= (1 - dt * 1.2);
      if (e.life <= 0) state.embers.splice(i, 1);
    }
  }
  function drawEmbers() {
    if (!state) return;
    ctx.save();
    for (var i = 0; i < state.embers.length; i++) {
      var e = state.embers[i];
      var k = Math.max(0, e.life / e.totalLife);
      ctx.globalAlpha = k;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function pushPopup(text, x, y, klass) {
    if (dom.popupOverlay) {
      var d = document.createElement("div");
      d.className = "popup-text " + (klass || "");
      d.textContent = text;
      var rect = canvas.getBoundingClientRect();
      var cx = rect.left + offsetX + x * scale;
      var cy = rect.top + offsetY + y * scale;
      d.style.left = (cx - rect.left) + "px";
      d.style.top = (cy - rect.top) + "px";
      dom.popupOverlay.appendChild(d);
      setTimeout(function () { try { d.remove(); } catch (e) {} }, 1100);
    }
  }

  function addShake(intensity, duration) {
    if (reducedMotion) return;
    state.shake.intensity = Math.max(state.shake.intensity, intensity);
    state.shake.life = Math.max(state.shake.life, duration);
    state.shake.totalLife = Math.max(state.shake.totalLife, duration);
  }
  function updateShake(dt) {
    var s = state.shake;
    if (s.life > 0) {
      s.life -= dt;
      var k = Math.max(0, s.life / Math.max(0.001, s.totalLife));
      s.x = (Math.random() - 0.5) * 2 * s.intensity * k;
      s.y = (Math.random() - 0.5) * 2 * s.intensity * k;
    } else {
      s.x = 0; s.y = 0; s.intensity = 0;
    }
  }

  function updateTiles(dt) {
    if (!state) return;
    for (var r = 0; r < state.gridSize; r++) {
      for (var c = 0; c < state.gridSize; c++) {
        var t = state.grid[r][c];
        if (t) t.animT += dt;
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
      updateTiles(dt);
      if (hintShownT > 0) hintShownT = Math.max(0, hintShownT - dt);
      if (hintShownT === 0) hintShownDir = null;
      updateEmbers(dt);
      updateShake(dt);
      render();
      if (phase === "playing" || phase === "paused") updateHud();
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

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "atlas-2048";
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
