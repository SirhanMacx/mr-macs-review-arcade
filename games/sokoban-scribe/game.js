/* ===========================================================================
   Sokoban Scribe — Box-pushing puzzle · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · 30 hand-crafted levels + endless
   Tile types: # wall · . floor · @ player · o scroll · G goal · ^ trap
              ~ ice · > < v u arrows · * pressure plate · ? scholar scroll
              + scroll-on-goal · & player-on-goal
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "sokoban-scribe";
  var GAME_TITLE = "Sokoban Scribe";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  // Tile renderer
  var TILE_PX = 52;
  var BOARD_PADDING_TOP = 130;       // below HUD ribbon
  var BOARD_PADDING_BOTTOM = 80;

  // Difficulty scaffolds
  var MAX_HAND_LEVELS = 30;
  var LIVES_INIT = 3;
  var UNDO_CAP = 50;
  var SHARDS_CAP = 200;
  var POWERUP_CAP = 3;
  var SCHOLAR_INTERVAL = 3;          // ~once per 3 levels
  var BONUS_LIFE_THRESHOLD = 10000;

  // -- Tile glyph constants -------------------------------------------------
  var T_FLOOR = 0;
  var T_WALL = 1;
  var T_GOAL = 2;
  var T_TRAP = 3;
  var T_ICE = 4;
  var T_ARROW_R = 5;
  var T_ARROW_L = 6;
  var T_ARROW_U = 7;
  var T_ARROW_D = 8;
  var T_BUTTON = 9;

  // -- Inline review bank (28 entries, grade 8 → AP) ------------------------
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence", hint: "Home of the Medici banking family." },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg", hint: "Mainz, ~1450 — Bibles." },
    { prompt: "The Protestant Reformation began with:", choices: ["Luther's 95 Theses", "The Council of Trent", "Henry VIII's annulment", "Calvin's Institutes"], correctText: "Luther's 95 Theses", hint: "Wittenberg, 1517." },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, diseases between hemispheres", "A 1492 trade treaty", "Slave trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, diseases between hemispheres", hint: "Old World ↔ New World biology." },
    { prompt: "Which technology most enabled European long-distance voyages?", choices: ["The astrolabe and caravel", "The compound microscope", "The cotton gin", "The seed drill"], correctText: "The astrolabe and caravel", hint: "Navigation + nimble ship." },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain", hint: "Coal, textiles, late 1700s." },
    { prompt: "Which invention most powered early factories?", choices: ["The steam engine", "The electric motor", "The internal combustion engine", "The assembly line"], correctText: "The steam engine", hint: "Watt, 1769 patent." },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "German unification", "Russian Revolution"], correctText: "Assassination of Archduke Franz Ferdinand", hint: "Sarajevo, June 1914." },
    { prompt: "Trench warfare on the Western Front was characterized by:", choices: ["Stalemate and high casualties", "Rapid cavalry advances", "Aerial bombing of cities", "Naval blockade only"], correctText: "Stalemate and high casualties", hint: "Mud, machine guns, no man's land." },
    { prompt: "The Treaty of Versailles (1919) blamed the war primarily on:", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany", hint: "War-guilt clause, Article 231." },
    { prompt: "The Cold War was a struggle primarily between:", choices: ["U.S. and Soviet Union", "U.S. and China", "Britain and France", "Germany and Russia"], correctText: "U.S. and Soviet Union", hint: "Capitalism vs. communism, 1947–91." },
    { prompt: "The Marshall Plan (1948) provided:", choices: ["Economic aid to rebuild Western Europe", "Military aid to South Korea", "Nuclear technology to NATO allies", "Loans to Latin America"], correctText: "Economic aid to rebuild Western Europe", hint: "$13 billion postwar package." },
    { prompt: "The doctrine of containment aimed to:", choices: ["Stop the spread of communism", "Roll back Soviet borders", "Promote free trade in Asia", "End nuclear weapons"], correctText: "Stop the spread of communism", hint: "Kennan's long telegram." },
    { prompt: "The Cuban Missile Crisis (1962) ended when:", choices: ["The Soviet Union withdrew missiles from Cuba", "Cuba renounced communism", "The U.S. invaded Cuba", "Khrushchev was removed from power"], correctText: "The Soviet Union withdrew missiles from Cuba", hint: "Quid pro quo on Turkey missiles." },
    { prompt: "Brown v. Board of Education (1954) ruled:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional", hint: "Overturned 'separate but equal'." },
    { prompt: "The Montgomery Bus Boycott was sparked by:", choices: ["Rosa Parks' arrest", "The March on Washington", "The Voting Rights Act", "Plessy v. Ferguson"], correctText: "Rosa Parks' arrest", hint: "December 1, 1955." },
    { prompt: "The Civil Rights Act of 1964:", choices: ["Banned discrimination in public accommodations", "Created the EPA", "Established Medicare", "Ended the Vietnam War"], correctText: "Banned discrimination in public accommodations", hint: "Title II covers hotels/restaurants." },
    { prompt: "Sputnik (1957), launched by the USSR, triggered:", choices: ["The U.S. space race and NASA's founding", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The U.S. space race and NASA's founding", hint: "First artificial satellite." },
    { prompt: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Declaration of Independence", "Constitution", "Bill of Rights", "Federalist No. 10"], correctText: "Declaration of Independence", hint: "Jefferson, 1776." },
    { prompt: "Checks and balances divides power among:", choices: ["Three branches of government", "Federal and state", "Senate and House", "Citizens and government"], correctText: "Three branches of government", hint: "Legislative, executive, judicial." },
    { prompt: "The 13th Amendment (1865):", choices: ["Abolished slavery", "Granted voting rights to women", "Created income tax", "Gave Black men the vote"], correctText: "Abolished slavery", hint: "Ratified after the Civil War." },
    { prompt: "The 19th Amendment (1920):", choices: ["Granted women the right to vote", "Repealed Prohibition", "Lowered the voting age", "Established direct election of senators"], correctText: "Granted women the right to vote", hint: "Suffrage movement victory." },
    { prompt: "The New Deal (1930s) was a response to:", choices: ["The Great Depression", "World War I", "The Dust Bowl alone", "The Cold War"], correctText: "The Great Depression", hint: "FDR, relief/recovery/reform." },
    { prompt: "Pearl Harbor (Dec 7, 1941) led directly to:", choices: ["U.S. entry into World War II", "End of WWII", "The Marshall Plan", "Founding of the UN"], correctText: "U.S. entry into World War II", hint: "'A date which will live in infamy.'" },
    { prompt: "The Magna Carta (1215) is significant because it:", choices: ["Limited the power of the English king", "Established Parliament", "Ended the Hundred Years' War", "Created common law"], correctText: "Limited the power of the English king", hint: "King John signed at Runnymede." },
    { prompt: "Which best describes a primary source?", choices: ["A first-hand record from the time period studied", "A textbook chapter", "A modern documentary", "An encyclopedia entry"], correctText: "A first-hand record from the time period studied", hint: "Letters, diaries, photographs." },
    { prompt: "The Berlin Wall fell in:", choices: ["1989", "1991", "1985", "1979"], correctText: "1989", hint: "Just before German reunification." },
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations", "NATO", "The League of Nations", "The European Union"], correctText: "The United Nations", hint: "Eleanor Roosevelt led the drafting." }
  ];

  // -- Hand-crafted 30 levels -----------------------------------------------
  // Symbols: # wall · . floor · @ player · o scroll · G goal · ^ trap
  //          ~ ice · > < v u arrows · * pressure plate · + scroll-on-goal
  //          & player-on-goal · space treated as floor-out-of-bounds (rare)
  // Designed to escalate; ice introduced ~lvl 5, arrows ~lvl 7, buttons ~lvl 9.
  var LEVELS = [
    // Level 1 — gentle opener: 1 scroll, 1 goal
    [
      "########",
      "#......#",
      "#.@....#",
      "#..o.G.#",
      "#......#",
      "########"
    ],
    // Level 2 — 2 scrolls, simple corridor
    [
      "##########",
      "#........#",
      "#.@.o.G..#",
      "#....o.G.#",
      "#........#",
      "##########"
    ],
    // Level 3 — choose order
    [
      "#########",
      "#.......#",
      "#.@.....#",
      "#..o.o..#",
      "#..G.G..#",
      "#.......#",
      "#########"
    ],
    // Level 4 — corner pinch
    [
      "##########",
      "#........#",
      "#.@......#",
      "#.o....G.#",
      "#........#",
      "#.G......#",
      "#......o.#",
      "##########"
    ],
    // Level 5 — first ice
    [
      "##########",
      "#........#",
      "#.@~~~...#",
      "#..o..G..#",
      "#........#",
      "##########"
    ],
    // Level 6 — multi-goal with traps
    [
      "##########",
      "#........#",
      "#.@..^...#",
      "#.o..o.G.#",
      "#..G.....#",
      "#........#",
      "##########"
    ],
    // Level 7 — first arrows
    [
      "##########",
      "#........#",
      "#.@.>....#",
      "#..o..G..#",
      "#........#",
      "#....v...#",
      "#.G..o...#",
      "##########"
    ],
    // Level 8 — square room
    [
      "############",
      "#..........#",
      "#.@..o.....#",
      "#..........#",
      "#..G....o..#",
      "#..........#",
      "#.....G....#",
      "#..........#",
      "############"
    ],
    // Level 9 — first pressure plate (button)
    [
      "##########",
      "#........#",
      "#.@.*..G.#",
      "#........#",
      "#..o.....#",
      "#........#",
      "##########"
    ],
    // Level 10 — congested
    [
      "############",
      "#..........#",
      "#.@.o.o.o..#",
      "#.G.G.G....#",
      "#..........#",
      "############"
    ],
    // Level 11 — diagonal trap belt
    [
      "############",
      "#..........#",
      "#.@........#",
      "#.o..^^^...#",
      "#......G...#",
      "#..o.......#",
      "#......G...#",
      "############"
    ],
    // Level 12 — ice slide chamber
    [
      "############",
      "#..........#",
      "#.@~~~~....#",
      "#......o...#",
      "#..........#",
      "#......G...#",
      "############"
    ],
    // Level 13 — switchback
    [
      "############",
      "#..........#",
      "#.@..#.....#",
      "#.o..#..G..#",
      "#....#.....#",
      "#..o....G..#",
      "############"
    ],
    // Level 14 — multi-arrow
    [
      "############",
      "#..........#",
      "#.@.>.>.>..#",
      "#.....o....#",
      "#..G.......#",
      "#.....v....#",
      "#.....o....#",
      "#.G........#",
      "############"
    ],
    // Level 15 — twin chambers
    [
      "##############",
      "#............#",
      "#.@..o....G..#",
      "#............#",
      "#.G......o...#",
      "#............#",
      "##############"
    ],
    // Level 16 — ice + traps
    [
      "############",
      "#..........#",
      "#.@~~^~~...#",
      "#......G...#",
      "#..o.......#",
      "############"
    ],
    // Level 17 — narrow hall
    [
      "############",
      "#@.........#",
      "#.o.o.o.o..#",
      "#.G.G.G.G..#",
      "############"
    ],
    // Level 18 — central pillar
    [
      "############",
      "#..........#",
      "#.@..#.....#",
      "#.o..#.G...#",
      "#....#.....#",
      "#..G.....o.#",
      "#..........#",
      "############"
    ],
    // Level 19 — buttons + scrolls
    [
      "############",
      "#..........#",
      "#.@..*..G..#",
      "#....o.....#",
      "#....*..G..#",
      "#....o.....#",
      "############"
    ],
    // Level 20 — broad open with traps
    [
      "##############",
      "#............#",
      "#.@..^..^....#",
      "#.o.........G#",
      "#.....^......#",
      "#.G......o...#",
      "##############"
    ],
    // Level 21 — H-shape
    [
      "############",
      "#..........#",
      "#.@.#......#",
      "#.o.#..o...#",
      "#.G.#..G...#",
      "#...#......#",
      "#..........#",
      "############"
    ],
    // Level 22 — ice corridors
    [
      "############",
      "#..........#",
      "#.@~~......#",
      "#..........#",
      "#..o..G....#",
      "#..........#",
      "#~~~....o..#",
      "#......G...#",
      "############"
    ],
    // Level 23 — 4-way arrows
    [
      "############",
      "#....v.....#",
      "#.@..o.....#",
      "#>.....G..<#",
      "#....o.....#",
      "#.G........#",
      "#....u.....#",
      "############"
    ],
    // Level 24 — sandwiched scrolls
    [
      "##############",
      "#............#",
      "#.@.G.o..o.G.#",
      "#............#",
      "#............#",
      "##############"
    ],
    // Level 25 — diamond
    [
      "############",
      "#..........#",
      "#....@.....#",
      "#..o...o...#",
      "#.G.....G..#",
      "#..^...^...#",
      "#..........#",
      "############"
    ],
    // Level 26 — pressure-plate chain
    [
      "##############",
      "#............#",
      "#.@..*..o....#",
      "#.....o.*.G..#",
      "#............#",
      "#......G.....#",
      "##############"
    ],
    // Level 27 — labyrinth
    [
      "##############",
      "#............#",
      "#.@.#......G.#",
      "#.o.#..#.....#",
      "#...#..#..o..#",
      "#......#.....#",
      "#.G..........#",
      "##############"
    ],
    // Level 28 — ice + arrows + traps
    [
      "##############",
      "#............#",
      "#.@>>........#",
      "#......^.....#",
      "#..o..~~~....#",
      "#......G.....#",
      "#..o..^......#",
      "#......G.....#",
      "##############"
    ],
    // Level 29 — big open
    [
      "##############",
      "#............#",
      "#.@..........#",
      "#..o..o..o...#",
      "#............#",
      "#..G..G..G...#",
      "#............#",
      "##############"
    ],
    // Level 30 — final exam
    [
      "##############",
      "#............#",
      "#.@..*.....G.#",
      "#..o..^......#",
      "#......o.....#",
      "#.G....~.....#",
      "#......o..G..#",
      "#............#",
      "##############"
    ]
  ];

  // -- SFX (Web Audio) -------------------------------------------------------
  var sfxCtx = null;
  var soundOn = true;

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
    step:        function () { sfxTone(420, 0.04, { type: "triangle", volume: 0.07, endFreq: 480 }); },
    push:        function () { sfxTone(220, 0.08, { type: "square", volume: 0.10, endFreq: 180 }); },
    push_blocked: function () { sfxTone(180, 0.08, { type: "sawtooth", volume: 0.10, endFreq: 120 }); },
    goal_filled: function () {
      [659, 988, 1318].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.14 }); }, i * 50);
      });
    },
    level_clear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    undo:        function () { sfxTone(660, 0.06, { type: "triangle", volume: 0.10, endFreq: 480 }); },
    reset:       function () {
      sfxTone(440, 0.10, { type: "sawtooth", volume: 0.10, endFreq: 220 });
      sfxNoise(0.10, { volume: 0.06, cutoff: 800 });
    },
    trap_death: function () {
      sfxNoise(0.4, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 50 });
    },
    scholar_match: function () {
      [988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.15, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    scholar_correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong: function () {
      sfxTone(330, 0.18, { type: "sawtooth", volume: 0.14, endFreq: 220 });
    },
    powerup_pickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerup_use: function () {
      [880, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    life_lost: function () {
      sfxTone(440, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 80 });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    hint_use: function () {
      sfxTone(1175, 0.08, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(1568, 0.10, { type: "triangle", volume: 0.14 }); }, 60);
    },
    wall_smash: function () {
      sfxNoise(0.30, { volume: 0.20, cutoff: 400 });
      sfxTone(180, 0.20, { type: "sawtooth", volume: 0.14, endFreq: 60 });
    }
  };

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | levelClear | dying | smashSelect
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("scribeCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudLevel = $("hudLevel");
    dom.hudMoves = $("hudMoves");
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
    dom.undoBtn = $("undoBtn");
    dom.resetBtn = $("resetBtn");
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
    dom.tcUndo = $("tcUndo");
    dom.tcReset = $("tcReset");
    dom.puSlot1 = $("puSlot1");
    dom.puSlot2 = $("puSlot2");
    dom.puSlot3 = $("puSlot3");
  }

  // -- Level parsing ---------------------------------------------------------
  // Parse a level ASCII into a board model:
  //   tiles[y][x] = T_FLOOR/T_WALL/T_GOAL/T_TRAP/T_ICE/T_ARROW_*/T_BUTTON
  //   scrolls = [{x,y,scholar?}]
  //   player = {x,y,facing}
  //   buttons = [{x,y, pressed}]
  function parseLevel(grid, opts) {
    opts = opts || {};
    var rows = grid.length;
    var cols = 0;
    for (var i = 0; i < rows; i++) cols = Math.max(cols, grid[i].length);
    var tiles = [];
    var scrolls = [];
    var buttons = [];
    var player = { x: 0, y: 0, facing: "down" };
    for (var y = 0; y < rows; y++) {
      tiles.push([]);
      for (var x = 0; x < cols; x++) {
        var ch = grid[y].charAt(x);
        var t = T_FLOOR;
        if (ch === "#") t = T_WALL;
        else if (ch === "G") t = T_GOAL;
        else if (ch === "+") { t = T_GOAL; scrolls.push({ x: x, y: y, scholar: false }); }
        else if (ch === "&") { t = T_GOAL; player.x = x; player.y = y; }
        else if (ch === "^") t = T_TRAP;
        else if (ch === "~") t = T_ICE;
        else if (ch === ">") t = T_ARROW_R;
        else if (ch === "<") t = T_ARROW_L;
        else if (ch === "v") t = T_ARROW_D;
        else if (ch === "u") t = T_ARROW_U;
        else if (ch === "*") { t = T_BUTTON; buttons.push({ x: x, y: y, pressed: false }); }
        else if (ch === "@") { player.x = x; player.y = y; }
        else if (ch === "o") { scrolls.push({ x: x, y: y, scholar: false }); }
        else if (ch === "?") { scrolls.push({ x: x, y: y, scholar: true }); }
        // " " (space) and "." treated as floor; anything else also floor
        tiles[y].push(t);
      }
    }
    return {
      cols: cols,
      rows: rows,
      tiles: tiles,
      scrolls: scrolls,
      buttons: buttons,
      player: player
    };
  }

  // Mark scholar scroll if appropriate (~ once per 3 levels) — only if
  // none already explicitly tagged in level. We pick a deterministic-ish scroll.
  function maybeMarkScholar(level, lvlIndex) {
    var hasScholar = false;
    for (var i = 0; i < level.scrolls.length; i++) if (level.scrolls[i].scholar) { hasScholar = true; break; }
    if (hasScholar) return;
    if (lvlIndex % SCHOLAR_INTERVAL !== 0) return; // levels 1,4,7,... if 0-indexed lvlIndex%3==0
    if (level.scrolls.length === 0) return;
    var idx = lvlIndex % level.scrolls.length;
    level.scrolls[idx].scholar = true;
  }

  // -- Endless level generation (after level 30) ----------------------------
  function generateEndlessLevel(seed) {
    var rng = makeRng(seed);
    var w = 8 + Math.floor(rng() * 5);   // 8–12
    var h = 8 + Math.floor(rng() * 5);
    var grid = [];
    var i, j;
    for (i = 0; i < h; i++) {
      var row = "";
      for (j = 0; j < w; j++) {
        if (i === 0 || i === h - 1 || j === 0 || j === w - 1) row += "#";
        else row += ".";
      }
      grid.push(row);
    }
    // Scatter walls
    for (i = 0; i < Math.floor(w * h * 0.06); i++) {
      var x = 2 + Math.floor(rng() * (w - 4));
      var y = 2 + Math.floor(rng() * (h - 4));
      grid[y] = setChar(grid[y], x, "#");
    }
    // Scatter ice/traps
    for (i = 0; i < 2 + Math.floor(rng() * 3); i++) {
      var x2 = 2 + Math.floor(rng() * (w - 4));
      var y2 = 2 + Math.floor(rng() * (h - 4));
      if (grid[y2].charAt(x2) === ".") grid[y2] = setChar(grid[y2], x2, rng() < 0.5 ? "~" : "^");
    }
    // 2-3 scrolls + matching goals
    var pairs = 2 + Math.floor(rng() * 2);
    var placed = 0, attempts = 0;
    var placedScrolls = [], placedGoals = [];
    while (placed < pairs && attempts < 80) {
      attempts++;
      var sx = 2 + Math.floor(rng() * (w - 4));
      var sy = 2 + Math.floor(rng() * (h - 4));
      var gx = 2 + Math.floor(rng() * (w - 4));
      var gy = 2 + Math.floor(rng() * (h - 4));
      if (grid[sy].charAt(sx) !== "." || grid[gy].charAt(gx) !== ".") continue;
      if (sx === gx && sy === gy) continue;
      grid[sy] = setChar(grid[sy], sx, "o");
      grid[gy] = setChar(grid[gy], gx, "G");
      placedScrolls.push({ x: sx, y: sy });
      placedGoals.push({ x: gx, y: gy });
      placed++;
    }
    // Player position
    var pAttempts = 0;
    while (pAttempts < 80) {
      pAttempts++;
      var px = 2 + Math.floor(rng() * (w - 4));
      var py = 2 + Math.floor(rng() * (h - 4));
      if (grid[py].charAt(px) === ".") {
        grid[py] = setChar(grid[py], px, "@");
        break;
      }
    }
    return grid;
  }
  function setChar(s, i, c) { return s.substring(0, i) + c + s.substring(i + 1); }
  function makeRng(seed) {
    var s = (seed || 1) >>> 0;
    return function () {
      s = (s * 1103515245 + 12345) >>> 0;
      return (s & 0x7fffffff) / 0x7fffffff;
    };
  }

  // -- Geometry helpers ------------------------------------------------------
  // Compute board origin so it sits centered in canvas, between hud regions.
  function getBoardOrigin(level) {
    var availableW = LOGICAL_W;
    var availableH = LOGICAL_H - BOARD_PADDING_TOP - BOARD_PADDING_BOTTOM;
    // Auto-shrink tile size if board too big
    var tilePx = Math.min(TILE_PX, Math.floor(Math.min(availableW / level.cols, availableH / level.rows)));
    var bw = level.cols * tilePx;
    var bh = level.rows * tilePx;
    var ox = Math.floor((LOGICAL_W - bw) / 2);
    var oy = BOARD_PADDING_TOP + Math.floor((availableH - bh) / 2);
    return { ox: ox, oy: oy, tilePx: tilePx };
  }

  function tileToPx(level, x, y) {
    var go = state.boardOrigin;
    return { x: go.ox + x * go.tilePx, y: go.oy + y * go.tilePx, size: go.tilePx };
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var levelNum = opts.level || 1;                       // 1-indexed visible level
    var lvlIndex = (levelNum - 1) % MAX_HAND_LEVELS;       // 0-29 hand-crafted
    var grid;
    if (levelNum <= MAX_HAND_LEVELS) {
      grid = LEVELS[lvlIndex];
    } else {
      grid = generateEndlessLevel(levelNum * 9301 + 49297);
    }
    var lvl = parseLevel(grid);
    maybeMarkScholar(lvl, lvlIndex);

    var bestMoves = readLevelBest(levelNum);
    state = {
      level: levelNum,
      maxLevel: opts.maxLevel || levelNum,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      board: lvl,
      moves: 0,
      moveBudget: 200,
      undoStack: [],
      undosLeft: UNDO_CAP,
      usedAnyUndo: false,
      bestMoves: bestMoves,
      // power-ups
      inventory: opts.inventory || [],
      activePowerup: null,           // "speed_boots" left-count, "trap_shield" pending, etc.
      speedBootsLeft: opts.speedBootsLeft || 0,
      trapShieldArmed: !!opts.trapShieldArmed,
      hintCell: null,                // {x,y,age}
      // FX
      particles: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      goalPulse: 0,
      // stats
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      best: opts.best || readBest(),
      time: 0,
      levelsCleared: opts.levelsCleared || 0,
      scrollsShelved: opts.scrollsShelved || 0,
      scrollsShelvedThisLevel: 0,
      maxLevelReached: opts.maxLevelReached || levelNum,
      endReason: ""
    };
    state.boardOrigin = getBoardOrigin(state.board);
  }

  // -- Movement model --------------------------------------------------------
  // Direction vectors
  var DIRS = {
    "up":    { dx: 0, dy: -1 },
    "down":  { dx: 0, dy:  1 },
    "left":  { dx: -1, dy: 0 },
    "right": { dx:  1, dy: 0 }
  };
  function arrowDirOf(t) {
    if (t === T_ARROW_R) return "right";
    if (t === T_ARROW_L) return "left";
    if (t === T_ARROW_U) return "up";
    if (t === T_ARROW_D) return "down";
    return null;
  }

  function inBounds(b, x, y) { return x >= 0 && y >= 0 && x < b.cols && y < b.rows; }
  function tileAt(b, x, y) {
    if (!inBounds(b, x, y)) return T_WALL;
    return b.tiles[y][x];
  }
  function scrollAt(b, x, y) {
    for (var i = 0; i < b.scrolls.length; i++) {
      if (b.scrolls[i].x === x && b.scrolls[i].y === y) return b.scrolls[i];
    }
    return null;
  }
  function buttonAt(b, x, y) {
    for (var i = 0; i < b.buttons.length; i++) {
      if (b.buttons[i].x === x && b.buttons[i].y === y) return b.buttons[i];
    }
    return null;
  }

  // Snapshot board state for undo
  function snapshotForUndo() {
    var b = state.board;
    return {
      px: b.player.x, py: b.player.y, facing: b.player.facing,
      scrolls: b.scrolls.map(function (s) { return { x: s.x, y: s.y, scholar: s.scholar }; }),
      buttons: b.buttons.map(function (bt) { return { x: bt.x, y: bt.y, pressed: bt.pressed }; }),
      moves: state.moves,
      lives: state.lives,
      scrollsShelved: state.scrollsShelved,
      scrollsShelvedThisLevel: state.scrollsShelvedThisLevel,
      trapShieldArmed: state.trapShieldArmed,
      speedBootsLeft: state.speedBootsLeft
    };
  }
  function applyUndoSnapshot(snap) {
    var b = state.board;
    b.player.x = snap.px;
    b.player.y = snap.py;
    b.player.facing = snap.facing;
    b.scrolls = snap.scrolls.map(function (s) { return { x: s.x, y: s.y, scholar: s.scholar }; });
    b.buttons = snap.buttons.map(function (bt) { return { x: bt.x, y: bt.y, pressed: bt.pressed }; });
    state.moves = snap.moves;
    state.lives = snap.lives;
    if (snap.scrollsShelved != null) state.scrollsShelved = snap.scrollsShelved;
    if (snap.scrollsShelvedThisLevel != null) state.scrollsShelvedThisLevel = snap.scrollsShelvedThisLevel;
    if (snap.trapShieldArmed != null) state.trapShieldArmed = snap.trapShieldArmed;
    if (snap.speedBootsLeft != null) state.speedBootsLeft = snap.speedBootsLeft;
  }

  // Try a move in `dir`; returns true if move was applied.
  function tryMove(dir, opts) {
    if (phase !== "playing") return false;
    opts = opts || {};
    var skipUndo = !!opts.skipUndo;
    var b = state.board;
    var hd = DIRS[dir];
    if (!hd) return false;
    var p = b.player;
    var nx = p.x + hd.dx;
    var ny = p.y + hd.dy;
    p.facing = dir;

    var t = tileAt(b, nx, ny);
    if (t === T_WALL) {
      sfx.push_blocked();
      return false;
    }
    var sc = scrollAt(b, nx, ny);
    if (sc) {
      // Try to push scroll one tile in dir
      var bx = nx + hd.dx;
      var by = ny + hd.dy;
      var bt = tileAt(b, bx, by);
      if (bt === T_WALL) { sfx.push_blocked(); return false; }
      if (scrollAt(b, bx, by)) { sfx.push_blocked(); return false; }
      // Check if pushing onto trap — scrolls cannot enter trap (treat as blocked)
      if (bt === T_TRAP) { sfx.push_blocked(); return false; }
      if (bt === T_BUTTON) {
        // ok — scroll lands on button (presses it)
      }
      // Save undo BEFORE mutating
      if (!skipUndo) pushUndo();
      // Move scroll, possibly slide on ice
      sc.x = bx;
      sc.y = by;
      // Arrow tile redirects pushed scroll: if scroll lands on an arrow, change slide direction
      var pushDir = { dx: hd.dx, dy: hd.dy };
      var arrAtScroll = arrowDirOf(tileAt(b, sc.x, sc.y));
      if (arrAtScroll && DIRS[arrAtScroll]) {
        pushDir = { dx: DIRS[arrAtScroll].dx, dy: DIRS[arrAtScroll].dy };
        // attempt one redirected slide step if next cell is open
        var arx = sc.x + pushDir.dx, ary = sc.y + pushDir.dy;
        var art = tileAt(b, arx, ary);
        if (art !== T_WALL && !scrollAt(b, arx, ary) && art !== T_TRAP) {
          sc.x = arx; sc.y = ary;
        }
      }
      // Slide while CURRENTLY on ice; stop on wall/scroll/trap or board edge
      var slideGuard = 0;
      while (tileAt(b, sc.x, sc.y) === T_ICE && slideGuard < 40) {
        slideGuard++;
        var nbx = sc.x + pushDir.dx;
        var nby = sc.y + pushDir.dy;
        if (!inBounds(b, nbx, nby)) break;
        var nbt = tileAt(b, nbx, nby);
        if (nbt === T_WALL) break;
        if (scrollAt(b, nbx, nby)) break;
        if (nbt === T_TRAP) break;
        sc.x = nbx;
        sc.y = nby;
        // Arrow on ice can redirect mid-slide
        var midArr = arrowDirOf(tileAt(b, sc.x, sc.y));
        if (midArr && DIRS[midArr]) {
          pushDir = { dx: DIRS[midArr].dx, dy: DIRS[midArr].dy };
        }
      }
      // Move player
      p.x = nx;
      p.y = ny;
      sfx.push();
      // pressed button update (after scroll has settled)
      updateButtons();
      // Goal-fill check
      if (tileAt(b, sc.x, sc.y) === T_GOAL) {
        sfx.goal_filled();
        state.scrollsShelved++;
        state.scrollsShelvedThisLevel++;
        burstAt(tilePxCenter(sc.x, sc.y).x, tilePxCenter(sc.x, sc.y).y, "#f5c451", 16);
        pushPopup("+SHELVED", tilePxCenter(sc.x, sc.y).x, tilePxCenter(sc.x, sc.y).y - 18, "is-bonus");
        state.goalPulse = 1.0;
        // Scholar reward when scholar-scroll hits goal
        if (sc.scholar) {
          openScholarQuestion(sc);
        }
      }
      state.moves++;
      // Apply ice slide for player too — if player landed on ice, slide further
      handlePlayerLanding(p, hd, true /* didPush */);
    } else {
      if (t === T_TRAP) {
        // Player walks onto trap — die unless trap shield armed
        if (!skipUndo) pushUndo();
        p.x = nx;
        p.y = ny;
        state.moves++;
        if (state.trapShieldArmed) {
          state.trapShieldArmed = false;
          updatePowerupSlots();
          pushPopup("SHIELD!", tilePxCenter(nx, ny).x, tilePxCenter(nx, ny).y - 18, "is-bonus");
          burstAt(tilePxCenter(nx, ny).x, tilePxCenter(nx, ny).y, "#5de0f0", 22);
        } else {
          die();
          return true;
        }
        sfx.step();
        return true;
      }
      // Plain move (could be onto ice, arrow, button, goal, floor)
      if (!skipUndo) pushUndo();
      p.x = nx;
      p.y = ny;
      state.moves++;
      sfx.step();
      handlePlayerLanding(p, hd, false);
      updateButtons();
    }

    // Speed boots: do an extra automatic move in the same dir
    if (state.speedBootsLeft > 0) {
      state.speedBootsLeft--;
      if (state.speedBootsLeft === 0) updatePowerupSlots();
      // If facing same dir, attempt another tryMove without recursion deeper than 1
      if (!opts.fromBoots) {
        setTimeout(function () {
          if (phase === "playing") tryMove(dir, { fromBoots: true });
        }, 110);
      }
    }
    // Hint cell stale after any move
    state.hintCell = null;
    // Save snapshot
    if (allShelved()) {
      onLevelClear();
    }
    return true;
  }

  // After player moves into a tile, handle ice-slide / arrow-redirect.
  // didPush flag indicates we just pushed a scroll; we do not chain new pushes during slide.
  function handlePlayerLanding(p, hd, didPush) {
    var b = state.board;
    var t = tileAt(b, p.x, p.y);
    // Arrow tile redirects: if you step onto an arrow, you continue in arrow's direction
    var arrDir = arrowDirOf(t);
    if (arrDir) {
      var ad = DIRS[arrDir];
      var nx = p.x + ad.dx;
      var ny = p.y + ad.dy;
      var nt = tileAt(b, nx, ny);
      if (nt !== T_WALL && !scrollAt(b, nx, ny) && nt !== T_TRAP) {
        p.x = nx; p.y = ny;
        p.facing = arrDir;
        // Continue chain (cap at 6 steps to avoid infinite loops if arrows form cycle)
        for (var i = 0; i < 6; i++) {
          var t2 = tileAt(b, p.x, p.y);
          if (t2 !== T_ICE) break;
          var nx2 = p.x + ad.dx;
          var ny2 = p.y + ad.dy;
          var nt2 = tileAt(b, nx2, ny2);
          if (nt2 === T_WALL || scrollAt(b, nx2, ny2) || nt2 === T_TRAP) break;
          p.x = nx2; p.y = ny2;
        }
      }
    }
    // Ice slide for player at level >= 5: while standing on ice, continue in hd direction
    if (state.level >= 5 && tileAt(b, p.x, p.y) === T_ICE) {
      for (var s = 0; s < 8; s++) {
        var nx3 = p.x + hd.dx;
        var ny3 = p.y + hd.dy;
        var nt3 = tileAt(b, nx3, ny3);
        if (nt3 === T_WALL) break;
        if (scrollAt(b, nx3, ny3)) break;
        if (nt3 === T_TRAP) {
          // Slide onto trap
          p.x = nx3; p.y = ny3;
          if (state.trapShieldArmed) {
            state.trapShieldArmed = false;
            updatePowerupSlots();
            pushPopup("SHIELD!", tilePxCenter(nx3, ny3).x, tilePxCenter(nx3, ny3).y - 18, "is-bonus");
          } else {
            die();
          }
          return;
        }
        p.x = nx3; p.y = ny3;
        if (tileAt(b, p.x, p.y) !== T_ICE) break;
      }
    }
  }

  function allShelved() {
    var b = state.board;
    for (var i = 0; i < b.scrolls.length; i++) {
      if (tileAt(b, b.scrolls[i].x, b.scrolls[i].y) !== T_GOAL) return false;
    }
    return true;
  }

  function updateButtons() {
    var b = state.board;
    for (var i = 0; i < b.buttons.length; i++) {
      var btn = b.buttons[i];
      btn.pressed = !!scrollAt(b, btn.x, btn.y);
    }
  }

  function tilePxCenter(x, y) {
    var go = state.boardOrigin;
    return { x: go.ox + x * go.tilePx + go.tilePx / 2, y: go.oy + y * go.tilePx + go.tilePx / 2 };
  }

  // -- Undo ------------------------------------------------------------------
  function pushUndo() {
    state.undoStack.push(snapshotForUndo());
    if (state.undoStack.length > UNDO_CAP) state.undoStack.shift();
  }
  function tryUndo() {
    if (phase !== "playing") return;
    if (state.undosLeft <= 0) return;
    var snap = state.undoStack.pop();
    if (!snap) return;
    applyUndoSnapshot(snap);
    state.undosLeft--;
    state.usedAnyUndo = true;
    state.hintCell = null;
    sfx.undo();
    updateHud();
    updatePowerupSlots();
  }
  function tryReset() {
    if (phase !== "playing" && phase !== "paused") return;
    sfx.reset();
    // Re-init the level fresh (preserve overall score, lives, level number, inventory)
    var carry = {
      level: state.level,
      maxLevel: state.maxLevel,
      score: state.score,
      lives: state.lives,
      shardsAwarded: state.shardsAwarded,
      questionsAnsweredCorrect: state.questionsAnsweredCorrect,
      questionsAnsweredTotal: state.questionsAnsweredTotal,
      best: state.best,
      levelsCleared: state.levelsCleared,
      scrollsShelved: state.scrollsShelved - state.scrollsShelvedThisLevel,
      maxLevelReached: state.maxLevelReached,
      inventory: state.inventory.slice(),
      speedBootsLeft: state.speedBootsLeft,
      trapShieldArmed: state.trapShieldArmed
    };
    initState(carry);
    updateHud();
    updatePowerupSlots();
  }

  // -- Power-ups -------------------------------------------------------------
  var POWERUP_TYPES = ["mega_undo", "wall_smash", "speed_boots", "trap_shield", "hint"];
  var POWERUP_META = {
    mega_undo:   { glyph: "↺", label: "Mega Undo",  desc: "+25 undos" },
    wall_smash:  { glyph: "⚒", label: "Wall Smash", desc: "Click a wall to smash" },
    speed_boots: { glyph: "⚡", label: "Speed Boots", desc: "5 double-moves" },
    trap_shield: { glyph: "🛡", label: "Trap Shield", desc: "Survive 1 trap" },
    hint:        { glyph: "💡", label: "Hint",       desc: "Highlight best move" }
  };
  function maybeDropPowerup() {
    // Drop on level-clear ~50% chance, only if inventory has room.
    if (state.inventory.length >= POWERUP_CAP) return;
    if (Math.random() < 0.5) {
      var t = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      state.inventory.push(t);
      sfx.powerup_pickup();
      pushPopup("+" + POWERUP_META[t].label, LOGICAL_W / 2, 110, "is-bonus");
    }
  }
  function usePowerup(slot) {
    if (phase !== "playing") return;
    var idx = slot - 1;
    if (idx < 0 || idx >= state.inventory.length) return;
    var type = state.inventory[idx];
    state.inventory.splice(idx, 1);
    sfx.powerup_use();
    if (type === "mega_undo") {
      state.undosLeft += 25;
      pushPopup("+25 UNDO", LOGICAL_W / 2, 200, "is-emerald");
    } else if (type === "wall_smash") {
      // Enter smashSelect mode — first wall clicked gets destroyed
      prevPhase = phase;
      phase = "smashSelect";
      pushPopup("Click a wall…", LOGICAL_W / 2, 200, "is-bonus");
    } else if (type === "speed_boots") {
      state.speedBootsLeft = 5;
      pushPopup("SPEED BOOTS x5", LOGICAL_W / 2, 200, "is-emerald");
    } else if (type === "trap_shield") {
      state.trapShieldArmed = true;
      pushPopup("TRAP SHIELD", LOGICAL_W / 2, 200, "is-bonus");
    } else if (type === "hint") {
      var hint = computeHint();
      if (hint) {
        state.hintCell = { x: hint.x, y: hint.y, age: 0 };
        sfx.hint_use();
        pushPopup("HINT", LOGICAL_W / 2, 200, "is-emerald");
      } else {
        pushPopup("NO HINT", LOGICAL_W / 2, 200, "is-warn");
      }
    }
    updatePowerupSlots();
  }
  function performWallSmashAt(x, y) {
    var b = state.board;
    if (!inBounds(b, x, y)) return false;
    if (b.tiles[y][x] !== T_WALL) return false;
    // Don't smash outer wall border — stays bounded
    if (x === 0 || y === 0 || x === b.cols - 1 || y === b.rows - 1) return false;
    pushUndo();
    b.tiles[y][x] = T_FLOOR;
    sfx.wall_smash();
    addShake(8, 0.4);
    burstAt(tilePxCenter(x, y).x, tilePxCenter(x, y).y, "#a96e3d", 26);
    pushPopup("SMASH!", tilePxCenter(x, y).x, tilePxCenter(x, y).y - 18, "is-bonus");
    return true;
  }

  // BFS to find next-best-move target (player → tile to push next scroll toward goal)
  function computeHint() {
    var b = state.board;
    // Find unshelved scroll
    var unshelved = null;
    for (var i = 0; i < b.scrolls.length; i++) {
      var s = b.scrolls[i];
      if (tileAt(b, s.x, s.y) !== T_GOAL) { unshelved = s; break; }
    }
    if (!unshelved) return null;
    // Find nearest goal that has no scroll
    var bestGoal = null, bestDist = 1e9;
    for (var y = 0; y < b.rows; y++) {
      for (var x = 0; x < b.cols; x++) {
        if (b.tiles[y][x] === T_GOAL) {
          // ignore goals already filled
          var occ = scrollAt(b, x, y);
          if (occ && occ !== unshelved) continue;
          var d = Math.abs(x - unshelved.x) + Math.abs(y - unshelved.y);
          if (d < bestDist) { bestDist = d; bestGoal = { x: x, y: y }; }
        }
      }
    }
    if (!bestGoal) return null;
    // Direction from scroll → goal (manhattan)
    var dx = Math.sign(bestGoal.x - unshelved.x);
    var dy = Math.sign(bestGoal.y - unshelved.y);
    // Player should be at the opposite side of scroll; suggest the cell the player should reach next.
    var desiredX = unshelved.x - (dx !== 0 ? dx : 0);
    var desiredY = unshelved.y - (dy !== 0 ? dy : 0);
    if (dx === 0 && dy === 0) return null;
    if (!inBounds(b, desiredX, desiredY)) return null;
    if (b.tiles[desiredY][desiredX] === T_WALL) return null;
    return { x: desiredX, y: desiredY };
  }

  // -- FX --------------------------------------------------------------------
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
        life: 0.7,
        totalLife: 0.7,
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

  // -- Death + respawn -------------------------------------------------------
  function die() {
    sfx.trap_death();
    addShake(10, 0.5);
    burstAt(tilePxCenter(state.board.player.x, state.board.player.y).x,
            tilePxCenter(state.board.player.x, state.board.player.y).y, "#f04860", 28);
    state.lives--;
    sfx.life_lost();
    if (state.lives <= 0) {
      phase = "dying";
      setTimeout(function () { gameOver(); }, 900);
    } else {
      // Reset the level (death = soft level reset, keep lives & score)
      phase = "dying";
      setTimeout(function () {
        tryReset();
        phase = "playing";
      }, 700);
    }
  }

  // -- Level clear + scoring -------------------------------------------------
  function onLevelClear() {
    if (phase === "levelClear") return;
    if (state.level >= 10) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("sokoban-scribe", "sokoban-l10"); } catch (e) {}
    }
    if (!state.usedAnyUndo) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("sokoban-scribe", "sokoban-no-undo"); } catch (e) {}
    }
    sfx.level_clear();
    addShake(6, 0.5);
    var par = parMovesForLevel(state.level);
    var saving = Math.max(0, par - state.moves);
    var bonus = saving * 100 + state.level * 200;
    state.score += bonus;
    pushPopup("ARCHIVE SHELVED!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopup("+" + bonus + " bonus", LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    if (state.level >= 10) {
      pushPopup("ARCHIVE LEGEND!", LOGICAL_W / 2, LOGICAL_H / 2 - 70, "is-legend");
    }
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#a96e3d", "#5de0f0", "#a991ff"] });
      }
    } catch (e) {}

    // Personal-best per-level
    var prevBest = readLevelBest(state.level);
    if (prevBest === 0 || state.moves < prevBest) {
      writeLevelBest(state.level, state.moves);
      state.bestMoves = state.moves;
    }
    state.levelsCleared++;
    maybeDropPowerup();

    phase = "levelClear";
    saveSnapshot();
    setTimeout(function () {
      var nextLevel = state.level + 1;
      var carry = {
        level: nextLevel,
        maxLevel: Math.max(state.maxLevel, nextLevel),
        score: state.score,
        lives: state.lives,
        shardsAwarded: state.shardsAwarded,
        questionsAnsweredCorrect: state.questionsAnsweredCorrect,
        questionsAnsweredTotal: state.questionsAnsweredTotal,
        best: state.best,
        levelsCleared: state.levelsCleared,
        scrollsShelved: state.scrollsShelved,
        maxLevelReached: Math.max(state.maxLevelReached, nextLevel),
        inventory: state.inventory.slice(),
        speedBootsLeft: state.speedBootsLeft,
        trapShieldArmed: state.trapShieldArmed
      };
      initState(carry);
      phase = "playing";
      updateHud();
      updatePowerupSlots();
    }, 1500);
  }
  function parMovesForLevel(lvl) {
    return 20 + lvl * 6; // generous par; saving rewards efficiency
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
    drawBoardFloor();
    drawTiles();
    drawHintCell();
    drawScrolls();
    drawPlayer();
    drawParticles();

    ctx.restore();
  }

  function drawBackground() {
    // Dark void
    ctx.fillStyle = "#0c0a05";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    // Soft glow behind board
    var go = state.boardOrigin;
    var cx = go.ox + (state.board.cols * go.tilePx) / 2;
    var cy = go.oy + (state.board.rows * go.tilePx) / 2;
    var rad = Math.max(state.board.cols, state.board.rows) * go.tilePx * 0.7;
    var glow = ctx.createRadialGradient(cx, cy, 60, cx, cy, rad);
    glow.addColorStop(0, "rgba(245, 196, 81, 0.10)");
    glow.addColorStop(0.6, "rgba(40, 28, 12, 0.10)");
    glow.addColorStop(1, "rgba(12, 10, 5, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Decorative stone bricks pattern in background
    ctx.fillStyle = "rgba(120, 90, 50, 0.05)";
    for (var y = 0; y < LOGICAL_H; y += 60) {
      for (var x = 0; x < LOGICAL_W; x += 60) {
        if (((x / 60 + y / 60) | 0) % 2 === 0) ctx.fillRect(x, y, 30, 30);
      }
    }
  }

  function drawBoardFloor() {
    var b = state.board;
    var go = state.boardOrigin;
    // Shadow under board
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(go.ox - 8, go.oy - 8, b.cols * go.tilePx + 16, b.rows * go.tilePx + 16);
    ctx.restore();
  }

  function drawTiles() {
    var b = state.board;
    var go = state.boardOrigin;
    for (var y = 0; y < b.rows; y++) {
      for (var x = 0; x < b.cols; x++) {
        drawTile(x, y, b.tiles[y][x], go);
      }
    }
  }

  function drawTile(x, y, t, go) {
    var px = go.ox + x * go.tilePx;
    var py = go.oy + y * go.tilePx;
    var s = go.tilePx;
    if (t === T_WALL) drawWallTile(px, py, s, x, y);
    else drawFloorTile(px, py, s, t, x, y);
  }

  function drawFloorTile(px, py, s, t, gx, gy) {
    // Parchment beige base
    var grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, "#d8c08a");
    grad.addColorStop(1, "#a37e44");
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, s, s);
    // Inner bevel
    ctx.strokeStyle = "rgba(255, 230, 180, 0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
    // Cell line
    ctx.strokeStyle = "rgba(60, 40, 14, 0.25)";
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);

    if (t === T_GOAL) drawGoalTile(px, py, s, gx, gy);
    else if (t === T_TRAP) drawTrapTile(px, py, s);
    else if (t === T_ICE) drawIceTile(px, py, s);
    else if (t === T_ARROW_R || t === T_ARROW_L || t === T_ARROW_U || t === T_ARROW_D) {
      drawArrowTile(px, py, s, t);
    } else if (t === T_BUTTON) {
      drawButtonTile(px, py, s, gx, gy);
    }
  }

  function drawWallTile(px, py, s, gx, gy) {
    // Stone block
    var grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, "#8a6940");
    grad.addColorStop(0.45, "#5e4424");
    grad.addColorStop(1, "#3b2812");
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, s, s);
    // Top highlight (bevel)
    ctx.fillStyle = "rgba(255, 230, 180, 0.18)";
    ctx.fillRect(px, py, s, 4);
    ctx.fillStyle = "rgba(255, 230, 180, 0.12)";
    ctx.fillRect(px, py, 4, s);
    // Bottom shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.30)";
    ctx.fillRect(px, py + s - 4, s, 4);
    ctx.fillStyle = "rgba(0, 0, 0, 0.20)";
    ctx.fillRect(px + s - 4, py, 4, s);
    // Mortar line
    ctx.strokeStyle = "rgba(20, 12, 4, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
    // Tiny stone speckles for texture
    var seed = (gx * 31 + gy * 17) & 0xff;
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    for (var i = 0; i < 4; i++) {
      var sx = px + ((seed + i * 13) % (s - 4)) + 2;
      var sy = py + ((seed + i * 7) % (s - 4)) + 2;
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  function drawGoalTile(px, py, s, gx, gy) {
    var b = state.board;
    var filled = !!scrollAt(b, gx, gy);
    var pulse = state.goalPulse > 0 ? (Math.sin(state.time * 4) * 0.5 + 0.5) : 0;
    var pad = 6;
    if (filled) {
      // Lit gold square
      var grad = ctx.createRadialGradient(px + s / 2, py + s / 2, 4, px + s / 2, py + s / 2, s / 2 + 4);
      grad.addColorStop(0, "#fff5c0");
      grad.addColorStop(0.4, "#f5c451");
      grad.addColorStop(1, "rgba(245, 196, 81, 0.35)");
      ctx.fillStyle = grad;
      ctx.fillRect(px + pad, py + pad, s - pad * 2, s - pad * 2);
      ctx.strokeStyle = "rgba(255, 246, 200, 0.85)";
      ctx.lineWidth = 2 + pulse * 2;
      ctx.strokeRect(px + pad, py + pad, s - pad * 2, s - pad * 2);
    } else {
      // Outline-only gold shelf with subtle inner glow
      ctx.fillStyle = "rgba(245, 196, 81, 0.12)";
      ctx.fillRect(px + pad, py + pad, s - pad * 2, s - pad * 2);
      ctx.strokeStyle = "#f5c451";
      ctx.lineWidth = 2;
      ctx.strokeRect(px + pad + 0.5, py + pad + 0.5, s - pad * 2 - 1, s - pad * 2 - 1);
      // Inner cross-hatch suggesting bookcase shelves
      ctx.strokeStyle = "rgba(245, 196, 81, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + pad + 4, py + s / 2);
      ctx.lineTo(px + s - pad - 4, py + s / 2);
      ctx.stroke();
    }
  }

  function drawTrapTile(px, py, s) {
    var grad = ctx.createRadialGradient(px + s / 2, py + s / 2, 2, px + s / 2, py + s / 2, s / 2);
    grad.addColorStop(0, "#ff6a3a");
    grad.addColorStop(0.55, "#d63a28");
    grad.addColorStop(1, "#6b1a0c");
    ctx.fillStyle = grad;
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
    // Cracks
    ctx.strokeStyle = "rgba(255, 220, 120, 0.45)";
    ctx.lineWidth = 1.5;
    var pulse = (Math.sin(state.time * 6) * 0.5 + 0.5) * 0.6 + 0.4;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 8); ctx.lineTo(px + s - 8, py + s - 12);
    ctx.moveTo(px + 8, py + s - 6); ctx.lineTo(px + s - 6, py + 10);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Skull-style center dot
    ctx.fillStyle = "#290807";
    ctx.beginPath();
    ctx.arc(px + s / 2, py + s / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawIceTile(px, py, s) {
    var grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, "#a8e8ff");
    grad.addColorStop(1, "#4a7e9e");
    ctx.fillStyle = grad;
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
    // Frosted highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(px + 4, py + 4, s - 8, 4);
    // Crystals
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + s / 2 - 6, py + s / 2);
    ctx.lineTo(px + s / 2 + 6, py + s / 2);
    ctx.moveTo(px + s / 2, py + s / 2 - 6);
    ctx.lineTo(px + s / 2, py + s / 2 + 6);
    ctx.stroke();
  }

  function drawArrowTile(px, py, s, t) {
    // Floor base already drawn; overlay an arrow chevron
    ctx.fillStyle = "rgba(245, 196, 81, 0.25)";
    ctx.fillRect(px + 4, py + 4, s - 8, s - 8);
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 2;
    var cx = px + s / 2, cy = py + s / 2;
    var arrowSize = s * 0.25;
    ctx.beginPath();
    if (t === T_ARROW_R) {
      ctx.moveTo(cx - arrowSize, cy - arrowSize);
      ctx.lineTo(cx + arrowSize, cy);
      ctx.lineTo(cx - arrowSize, cy + arrowSize);
    } else if (t === T_ARROW_L) {
      ctx.moveTo(cx + arrowSize, cy - arrowSize);
      ctx.lineTo(cx - arrowSize, cy);
      ctx.lineTo(cx + arrowSize, cy + arrowSize);
    } else if (t === T_ARROW_U) {
      ctx.moveTo(cx - arrowSize, cy + arrowSize);
      ctx.lineTo(cx, cy - arrowSize);
      ctx.lineTo(cx + arrowSize, cy + arrowSize);
    } else if (t === T_ARROW_D) {
      ctx.moveTo(cx - arrowSize, cy - arrowSize);
      ctx.lineTo(cx, cy + arrowSize);
      ctx.lineTo(cx + arrowSize, cy - arrowSize);
    }
    ctx.stroke();
  }

  function drawButtonTile(px, py, s, gx, gy) {
    var btn = buttonAt(state.board, gx, gy);
    var pressed = btn ? btn.pressed : false;
    var pad = 8;
    var inset = pad + (pressed ? 2 : 0);
    ctx.fillStyle = pressed ? "#5de0f0" : "#2a8090";
    ctx.fillRect(px + inset, py + inset, s - inset * 2, s - inset * 2);
    ctx.strokeStyle = pressed ? "#a8e8ff" : "#5de0f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + inset + 0.5, py + inset + 0.5, s - inset * 2 - 1, s - inset * 2 - 1);
    // Centre dot
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(px + s / 2, py + s / 2, pressed ? 2 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHintCell() {
    if (!state.hintCell) return;
    var ageT = Math.min(1, state.hintCell.age / 4); // fades over 4 sec
    var c = tilePxCenter(state.hintCell.x, state.hintCell.y);
    var go = state.boardOrigin;
    var s = go.tilePx;
    var pulse = (Math.sin(state.time * 6) * 0.5 + 0.5) * 0.6 + 0.4;
    ctx.save();
    ctx.globalAlpha = (1 - ageT) * pulse * 0.85;
    ctx.strokeStyle = "#a991ff";
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x - s / 2 + 4, c.y - s / 2 + 4, s - 8, s - 8);
    ctx.restore();
  }

  function drawScrolls() {
    var b = state.board;
    var go = state.boardOrigin;
    for (var i = 0; i < b.scrolls.length; i++) {
      var sc = b.scrolls[i];
      var px = go.ox + sc.x * go.tilePx;
      var py = go.oy + sc.y * go.tilePx;
      drawScrollAt(px, py, go.tilePx, sc.scholar, tileAt(b, sc.x, sc.y) === T_GOAL);
    }
  }
  function drawScrollAt(px, py, s, isScholar, isOnGoal) {
    var pad = 8;
    var w = s - pad * 2;
    var h = s - pad * 2;
    // Drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(px + pad + 2, py + pad + 2, w, h);
    // Scroll body — parchment cylinder feel
    var grad = ctx.createLinearGradient(px + pad, py + pad, px + pad, py + pad + h);
    if (isOnGoal) {
      grad.addColorStop(0, "#fff0a0");
      grad.addColorStop(0.5, "#f5c451");
      grad.addColorStop(1, "#a96e3d");
    } else {
      grad.addColorStop(0, "#f0d8a4");
      grad.addColorStop(0.5, "#d8b86a");
      grad.addColorStop(1, "#8b6a30");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(px + pad, py + pad, w, h);
    // Top + bottom rim (cylinder ends)
    ctx.fillStyle = "#7a5a28";
    ctx.fillRect(px + pad, py + pad, w, 4);
    ctx.fillRect(px + pad, py + pad + h - 4, w, 4);
    // Center bevel highlight
    ctx.fillStyle = "rgba(255, 240, 200, 0.35)";
    ctx.fillRect(px + pad + 2, py + pad + 4, w - 4, 2);
    // Outer border
    ctx.strokeStyle = "rgba(40, 24, 8, 0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + pad + 0.5, py + pad + 0.5, w - 1, h - 1);

    if (isScholar) {
      // Rainbow rotating sigil + rim
      var cx = px + s / 2, cy = py + s / 2;
      var rotT = state.time * 2;
      var rim = ctx.createConicGradient ? ctx.createConicGradient(rotT, cx, cy) : null;
      if (rim) {
        rim.addColorStop(0, "#f04860");
        rim.addColorStop(0.25, "#f5c451");
        rim.addColorStop(0.5, "#4dd49b");
        rim.addColorStop(0.75, "#5de0f0");
        rim.addColorStop(1, "#a991ff");
        ctx.strokeStyle = rim;
      } else {
        ctx.strokeStyle = "#f5c451";
      }
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, w / 2 - 2, 0, Math.PI * 2);
      ctx.stroke();
      // Question mark center
      ctx.fillStyle = "#1a1208";
      ctx.font = "bold " + Math.floor(s * 0.45) + "px 'Fraunces', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", cx, cy + 1);
    }
  }

  function drawPlayer() {
    var p = state.board.player;
    var c = tilePxCenter(p.x, p.y);
    var go = state.boardOrigin;
    var s = go.tilePx;
    var pad = 6;
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + s / 2 - pad - 2, s / 2 - pad - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Robe (color depends on shield)
    var robeColor = state.trapShieldArmed ? "#5de0f0" : "#5b3a16";
    var robeAccent = state.trapShieldArmed ? "#a8e8ff" : "#8b5a2b";
    ctx.fillStyle = robeColor;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - s / 2 + pad);
    ctx.lineTo(c.x - (s / 2 - pad), c.y + s / 2 - pad);
    ctx.lineTo(c.x + (s / 2 - pad), c.y + s / 2 - pad);
    ctx.closePath();
    ctx.fill();
    // Robe band
    ctx.fillStyle = robeAccent;
    ctx.fillRect(c.x - (s / 2 - pad - 2), c.y + 4, (s - 2 * (pad + 2)), 3);
    // Head — cream/parchment
    ctx.fillStyle = "#f0e0b8";
    ctx.beginPath();
    ctx.arc(c.x, c.y - s / 4, s / 6, 0, Math.PI * 2);
    ctx.fill();
    // Hood/cap
    ctx.fillStyle = "#3a2510";
    ctx.beginPath();
    ctx.arc(c.x, c.y - s / 4 - 2, s / 6 + 2, Math.PI, Math.PI * 2);
    ctx.fill();

    // Facing indicator: small accent dot
    ctx.fillStyle = "#f5c451";
    var fx = c.x, fy = c.y - s / 4;
    if (p.facing === "up") fy -= s / 6 - 2;
    else if (p.facing === "down") fy += s / 6 - 1;
    else if (p.facing === "left") fx -= s / 6 - 2;
    else if (p.facing === "right") fx += s / 6 - 2;
    ctx.beginPath();
    ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var t = p.life / p.totalLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // -- HUD -------------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudLevel) dom.hudLevel.textContent = String(state.level);
    if (dom.hudMoves) dom.hudMoves.textContent = String(state.moves);
    if (dom.hudBest) {
      dom.hudBest.textContent = state.bestMoves > 0 ? String(state.bestMoves) : "—";
    }
    if (dom.goalName) {
      var total = state.board.scrolls.length;
      var done = 0;
      for (var i = 0; i < total; i++) {
        var s = state.board.scrolls[i];
        if (tileAt(state.board, s.x, s.y) === T_GOAL) done++;
      }
      dom.goalName.textContent = done + "/" + total + " scrolls shelved";
    }
    if (dom.goalMeta) {
      var bits = [];
      bits.push("Undos · " + state.undosLeft);
      if (state.speedBootsLeft > 0) bits.push("Boots " + state.speedBootsLeft);
      if (state.trapShieldArmed) bits.push("Shield");
      if (state.hintCell) bits.push("Hint live");
      bits.push("Lvl " + state.level);
      dom.goalMeta.textContent = bits.join(" · ");
    }
    if (dom.hudLives) {
      var cell = dom.hudLives.parentElement;
      if (cell) cell.classList.toggle("is-danger", state.lives <= 1);
    }
  }
  function updatePowerupSlots() {
    var slots = [dom.puSlot1, dom.puSlot2, dom.puSlot3];
    for (var i = 0; i < 3; i++) {
      var slot = slots[i];
      if (!slot) continue;
      var glyphEl = slot.querySelector(".pu-glyph");
      var keyEl = slot.querySelector(".pu-key");
      if (i < state.inventory.length) {
        var t = state.inventory[i];
        var meta = POWERUP_META[t];
        slot.classList.add("has");
        slot.classList.remove("empty");
        if (glyphEl) glyphEl.textContent = meta.glyph;
        slot.title = meta.label + " — " + meta.desc;
      } else {
        slot.classList.remove("has");
        slot.classList.add("empty");
        if (glyphEl) glyphEl.textContent = "·";
        slot.title = "Empty slot";
      }
      if (keyEl) keyEl.textContent = String(i + 1);
    }
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Scholar / review modal -----------------------------------------------
  var activeQuestion = null;
  var pendingScholarScroll = null;

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

  function openScholarQuestion(scroll) {
    activeQuestion = pickQuestion();
    pendingScholarScroll = scroll;
    sfx.scholar_match();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Scroll · Optional · +1500 + 12 shards";
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
      dom.explanation.textContent = "Decoded! +1500 plus 12 shards.";
      dom.explanation.className = "explanation is-correct";
      state.questionsAnsweredCorrect++;
      sfx.scholar_correct();
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText +
        (activeQuestion.hint ? "  ·  Hint: " + activeQuestion.hint : "");
      dom.explanation.className = "explanation is-wrong";
      sfx.scholar_wrong();
    }
    state.questionsAnsweredTotal++;
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }
  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += 1500;
      addShards(12);
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+1500 SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
    }
    activeQuestion = null;
    pendingScholarScroll = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }
  function skipQuestion() {
    activeQuestion = null;
    pendingScholarScroll = null;
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
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 200));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Archive Defeated You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Sokoban Scribe · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Levels Cleared</div><div class="end-cell-value">' + state.levelsCleared + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scrolls Shelved</div><div class="end-cell-value">' + formatNumber(state.scrollsShelved) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Level</div><div class="end-cell-value">' + state.maxLevelReached + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Score</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
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
  function addShards(n) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, GAME_ID + "-scholar-correct");
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          level: state.maxLevelReached,
          scrolls: state.scrollsShelved
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
          level: state.level,
          lives: state.lives,
          scrollsShelved: state.scrollsShelved,
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
  function recordPlayWithProfile(extra) {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        var payload = {
          gameId: GAME_ID,
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/sokoban-scribe/index.html"
        };
        if (extra && typeof extra === "object") {
          if (extra.score != null) payload.score = extra.score;
          if (extra.durationMs != null) payload.durationMs = extra.durationMs;
          if (extra.level != null) payload.level = extra.level;
        }
        window.MrMacsProfile.recordPlay(payload);
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("sokoban-scribe:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("sokoban-scribe:best", String(Math.floor(v)));
    } catch (e) {}
  }
  function readLevelBest(lvl) {
    try {
      var raw = window.localStorage && window.localStorage.getItem("sokoban-scribe:level-best:" + lvl);
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeLevelBest(lvl, moves) {
    try {
      if (window.localStorage) window.localStorage.setItem("sokoban-scribe:level-best:" + lvl, String(Math.floor(moves)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  var runStartTs = 0;
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
        if (k === "ArrowUp" || k === "w" || k === "W")    { tryMove("up"); e.preventDefault(); return; }
        if (k === "ArrowDown" || k === "s" || k === "S")  { tryMove("down"); e.preventDefault(); return; }
        if (k === "ArrowLeft" || k === "a" || k === "A")  { tryMove("left"); e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { tryMove("right"); e.preventDefault(); return; }
        if (k === "u" || k === "U") { tryUndo(); e.preventDefault(); return; }
        if (k === "r" || k === "R") { tryReset(); e.preventDefault(); return; }
        if (k === "1") { usePowerup(1); e.preventDefault(); return; }
        if (k === "2") { usePowerup(2); e.preventDefault(); return; }
        if (k === "3") { usePowerup(3); e.preventDefault(); return; }
        if (k === "4") { usePowerup(4); e.preventDefault(); return; }
        if (k === "5") { usePowerup(5); e.preventDefault(); return; }
        if (k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
      } else if (phase === "smashSelect") {
        if (k === "Escape" || k === "Esc") {
          // Cancel — refund the power-up isn't needed; just exit
          phase = prevPhase || "playing";
          prevPhase = null;
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
    bindCanvasInput();
    bindTouchControls();
  }

  function bindCanvasInput() {
    var touchStart = null;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing" && phase !== "smashSelect") return;
      if (e.touches && e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      if (phase === "smashSelect") {
        var t = e.changedTouches && e.changedTouches[0];
        if (t) {
          var pos = canvasToTile(t.clientX, t.clientY);
          if (pos && performWallSmashAt(pos.x, pos.y)) {
            phase = prevPhase || "playing";
            prevPhase = null;
            updatePowerupSlots();
          }
        }
        touchStart = null;
        return;
      }
      if (phase !== "playing" || !touchStart) return;
      var t2 = e.changedTouches && e.changedTouches[0];
      if (!t2) { touchStart = null; return; }
      var dx = t2.clientX - touchStart.x;
      var dy = t2.clientY - touchStart.y;
      var dt = performance.now() - touchStart.t;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      var SWIPE = 24;
      if (ax < SWIPE && ay < SWIPE && dt < 250) {
        // tap → no movement (user could be resting). For mobile UX, tap on board cells
        // adjacent to player triggers a move.
        var pos = canvasToTile(t2.clientX, t2.clientY);
        if (pos) {
          var p = state.board.player;
          var dxx = pos.x - p.x, dyy = pos.y - p.y;
          if (Math.abs(dxx) + Math.abs(dyy) === 1) {
            if (dxx === 1) tryMove("right");
            else if (dxx === -1) tryMove("left");
            else if (dyy === 1) tryMove("down");
            else if (dyy === -1) tryMove("up");
          }
        }
      } else {
        var dir;
        if (ax > ay) dir = (dx > 0) ? "right" : "left";
        else dir = (dy > 0) ? "down" : "up";
        tryMove(dir);
      }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });

    // Mouse click — used by wall smash select; otherwise click adjacent moves
    canvas.addEventListener("click", function (e) {
      var pos = canvasToTile(e.clientX, e.clientY);
      if (!pos) return;
      if (phase === "smashSelect") {
        if (performWallSmashAt(pos.x, pos.y)) {
          phase = prevPhase || "playing";
          prevPhase = null;
          updatePowerupSlots();
        }
        return;
      }
      if (phase === "playing") {
        var p = state.board.player;
        var dxx = pos.x - p.x, dyy = pos.y - p.y;
        if (Math.abs(dxx) + Math.abs(dyy) === 1) {
          if (dxx === 1) tryMove("right");
          else if (dxx === -1) tryMove("left");
          else if (dyy === 1) tryMove("down");
          else if (dyy === -1) tryMove("up");
        }
      }
    });

    // Power-up slot clicks
    [dom.puSlot1, dom.puSlot2, dom.puSlot3].forEach(function (slot) {
      if (!slot) return;
      slot.addEventListener("click", function () {
        var slotN = parseInt(slot.getAttribute("data-slot"), 10) || 1;
        usePowerup(slotN);
      });
    });
  }
  function canvasToTile(clientX, clientY) {
    if (!state) return null;
    var rect = canvas.getBoundingClientRect();
    var lx = (clientX - rect.left - offsetX) / scale;
    var ly = (clientY - rect.top - offsetY) / scale;
    var go = state.boardOrigin;
    var tx = Math.floor((lx - go.ox) / go.tilePx);
    var ty = Math.floor((ly - go.oy) / go.tilePx);
    if (tx < 0 || ty < 0 || tx >= state.board.cols || ty >= state.board.rows) return null;
    return { x: tx, y: ty };
  }

  function bindTouchControls() {
    function pressBtn(btn, fn) {
      if (!btn) return;
      var fire = function (e) { if (e) e.preventDefault(); fn(); };
      btn.addEventListener("click", fire);
      btn.addEventListener("touchstart", fire, { passive: false });
    }
    pressBtn(dom.tcUp, function () { if (phase === "playing") tryMove("up"); });
    pressBtn(dom.tcDown, function () { if (phase === "playing") tryMove("down"); });
    pressBtn(dom.tcLeft, function () { if (phase === "playing") tryMove("left"); });
    pressBtn(dom.tcRight, function () { if (phase === "playing") tryMove("right"); });
    pressBtn(dom.tcUndo, function () { tryUndo(); });
    pressBtn(dom.tcReset, function () { tryReset(); });
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
        '  <h2>How to Play &mdash; Sokoban Scribe</h2>',
        '  <h3>Goal</h3>',
        '  <p>You are the librarian-scribe of the Great Archive. Push every <strong>parchment scroll</strong> onto a <strong>gold goal-shelf</strong>. Clear all 30 hand-crafted levels to unlock <strong>endless mode</strong>.</p>',
        '  <h3>Controls</h3>',
        '  <table><thead><tr><th>Key</th><th>Action</th></tr></thead><tbody>',
        '  <tr><td><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / Arrows</td><td>Move the scribe (pushes adjacent scroll)</td></tr>',
        '  <tr><td><kbd>U</kbd></td><td>Undo last move (up to 50/level)</td></tr>',
        '  <tr><td><kbd>R</kbd></td><td>Reset current level</td></tr>',
        '  <tr><td><kbd>1</kbd> &ndash; <kbd>5</kbd></td><td>Use power-up in that slot</td></tr>',
        '  <tr><td><kbd>Esc</kbd> / <kbd>P</kbd></td><td>Pause / unpause</td></tr>',
        '  </tbody></table>',
        '  <h3>Tile Types</h3>',
        '  <table><thead><tr><th>Tile</th><th>Behaviour</th></tr></thead><tbody>',
        '  <tr><td>Floor</td><td>Normal walkable ground</td></tr>',
        '  <tr><td>Wall</td><td>Impassable — scrolls and scribe cannot enter</td></tr>',
        '  <tr><td>Scroll</td><td>Push it onto a goal-shelf to score</td></tr>',
        '  <tr><td>Goal-shelf (gold)</td><td>Target destination for scrolls</td></tr>',
        '  <tr><td>Trap (red)</td><td>Stepping on it costs a life</td></tr>',
        '  <tr><td>Ice</td><td>Scribe and scrolls slide until hitting a wall</td></tr>',
        '  <tr><td>Arrow</td><td>One-way passage — movement only in arrow direction</td></tr>',
        '  <tr><td>Pressure plate</td><td>Activates when a scroll rests on it</td></tr>',
        '  <tr><td>Scholar scroll (gold "?")</td><td>Deliver to any goal-shelf to trigger optional review</td></tr>',
        '  </tbody></table>',
        '  <h3>Power-ups</h3>',
        '  <table><thead><tr><th>Power-up</th><th>Effect</th></tr></thead><tbody>',
        '  <tr><td>Mega Undo</td><td>+25 extra undos for this level</td></tr>',
        '  <tr><td>Wall Smash</td><td>Remove one wall tile</td></tr>',
        '  <tr><td>Speed Boots</td><td>Move two tiles per key press for 20 moves</td></tr>',
        '  <tr><td>Trap Shield</td><td>Immune to traps for 15 moves</td></tr>',
        '  <tr><td>Hint</td><td>BFS highlights the best next push</td></tr>',
        '  </tbody></table>',
        '  <div class="scholar-note">&#127979; <strong>Scholar Scroll</strong> &mdash; gold-shimmer scroll. Push it onto any goal-shelf to trigger an optional review question. Correct answers earn bonus shards. Skip any time with no penalty.</div>',
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
    dom.undoBtn.addEventListener("click", function () { tryUndo(); });
    dom.resetBtn.addEventListener("click", function () { tryReset(); });
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
  }

  function exitToArcade() {
    stopMusic();
    saveSnapshot();
    if (state && runStartTs) {
      recordPlayWithProfile({
        score: state.score,
        durationMs: Date.now() - runStartTs,
        level: state.maxLevelReached
      });
    }
    window.location.href = "../../index.html";
  }

  function newRun() {
    initState({});
    showScreen(null);
    phase = "playing";
    runStartTs = Date.now();
    startMusic();
    updateHud();
    updatePowerupSlots();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    initState({
      score: s.score || 0,
      level: s.level || 1,
      lives: s.lives != null ? s.lives : LIVES_INIT,
      scrollsShelved: s.scrollsShelved || 0,
      best: readBest()
    });
    showScreen(null);
    phase = "playing";
    runStartTs = Date.now();
    startMusic();
    updateHud();
    updatePowerupSlots();
    recordPlayWithProfile();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.level > 1) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Level ' + (snap.state.level || 1) +
        ' &middot; Scrolls ' + (snap.state.scrollsShelved || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Sokoban Scribe Scores</div>';
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
      // Goal pulse decay
      if (state.goalPulse > 0) state.goalPulse = Math.max(0, state.goalPulse - dt * 1.4);
      // Hint cell aging
      if (state.hintCell) {
        state.hintCell.age = (state.hintCell.age || 0) + dt;
        if (state.hintCell.age > 4) state.hintCell = null;
      }
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "levelClear" || phase === "paused" || phase === "smashSelect") {
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
    updatePowerupSlots();
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
