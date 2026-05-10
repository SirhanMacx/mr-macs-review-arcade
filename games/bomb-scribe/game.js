/* ===========================================================================
   Bomb Scribe — Bomberman variant · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x600 logical · 13x11 grid · Endless maps
   Tile types: 0 floor · 1 solid wall · 2 soft wall · 3 scholar wall · 4 exit
   Mechanics: bombs (3s fuse), cross explosions, enemies, power-ups, scholar walls
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "bomb-scribe";
  var GAME_TITLE = "Bomb Scribe";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 600;

  // Grid
  var COLS = 13;
  var ROWS = 11;
  var TILE_PX = 44;                    // 13 * 44 = 572 wide; centered with HUD ribbons
  var BOARD_PADDING_TOP = 110;
  var BOARD_PADDING_BOTTOM = 14;

  // Bomb / explosion timing
  var BOMB_FUSE_MS = 3000;
  var EXPLOSION_LIFE_MS = 480;
  var FUSE_TICK_INTERVAL_MS = 1000;

  // Difficulty constants
  var LIVES_INIT = 3;
  var SHARDS_CAP = 200;
  var BONUS_LIFE_INTERVAL = 5;          // every 5 maps → +1 life
  var SCHOLAR_PROB = 1.0;                // 1 scholar wall per map (deterministic)
  var POWERUP_DROP_PROB = 0.30;         // 30% on soft wall destruction
  var BOSS_INTERVAL = 5;                // every 5 maps a boss appears
  var INITIAL_TIME_BUDGET = 90;         // seconds per map
  var EXPLOSION_RANGE_INIT = 1;
  var EXPLOSION_RANGE_MAX = 6;
  var BOMB_LIMIT_INIT = 1;
  var BOMB_LIMIT_MAX = 8;
  var SPEED_INIT = 4.5;                 // tiles/sec
  var SPEED_MAX = 9.0;
  var SPEED_BONUS_PER_PICKUP = 0.5;

  // -- Tile constants --------------------------------------------------------
  var T_FLOOR = 0;
  var T_SOLID = 1;
  var T_SOFT = 2;
  var T_SCHOLAR = 3;
  var T_EXIT = 4;

  // Enemy types
  var E_WANDERER = "wanderer";
  var E_HUNTER = "hunter";
  var E_GHOST = "ghost";
  var E_BOSS = "boss";
  var E_MINION = "minion";

  // Power-up types
  var PU_BOMB = "bomb-up";
  var PU_RANGE = "range-up";
  var PU_SPEED = "speed-up";
  var PU_SHIELD = "shield";
  var PU_KICK = "kick";
  var POWERUP_TYPES = [PU_BOMB, PU_RANGE, PU_SPEED, PU_SHIELD, PU_KICK];

  // -- Inline review bank (28 entries, grade 8 → AP) ------------------------
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence", hint: "Home of the Medici banking family." },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg", hint: "Mainz, ~1450 — Bibles." },
    { prompt: "The Protestant Reformation began with:", choices: ["Luther's 95 Theses", "The Council of Trent", "Henry VIII's annulment", "Calvin's Institutes"], correctText: "Luther's 95 Theses", hint: "Wittenberg, 1517." },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, diseases between hemispheres", "A 1492 trade treaty", "Slave trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, diseases between hemispheres", hint: "Old World <-> New World biology." },
    { prompt: "Which technology most enabled European long-distance voyages?", choices: ["The astrolabe and caravel", "The compound microscope", "The cotton gin", "The seed drill"], correctText: "The astrolabe and caravel", hint: "Navigation + nimble ship." },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain", hint: "Coal, textiles, late 1700s." },
    { prompt: "Which invention most powered early factories?", choices: ["The steam engine", "The electric motor", "The internal combustion engine", "The assembly line"], correctText: "The steam engine", hint: "Watt, 1769 patent." },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "German unification", "Russian Revolution"], correctText: "Assassination of Archduke Franz Ferdinand", hint: "Sarajevo, June 1914." },
    { prompt: "Trench warfare on the Western Front was characterized by:", choices: ["Stalemate and high casualties", "Rapid cavalry advances", "Aerial bombing of cities", "Naval blockade only"], correctText: "Stalemate and high casualties", hint: "Mud, machine guns, no man's land." },
    { prompt: "The Treaty of Versailles (1919) blamed the war primarily on:", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany", hint: "War-guilt clause, Article 231." },
    { prompt: "The Cold War was a struggle primarily between:", choices: ["U.S. and Soviet Union", "U.S. and China", "Britain and France", "Germany and Russia"], correctText: "U.S. and Soviet Union", hint: "Capitalism vs. communism, 1947-91." },
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
    footstep:        function () { sfxTone(380, 0.04, { type: "triangle", volume: 0.05, endFreq: 320 }); },
    bomb_drop:       function () { sfxTone(180, 0.10, { type: "sine", volume: 0.12, endFreq: 90 }); },
    bomb_fuse_tick:  function () { sfxTone(880, 0.04, { type: "triangle", volume: 0.08 }); },
    bomb_explode:    function () {
      sfxNoise(0.42, { volume: 0.24, cutoff: 700 });
      sfxTone(120, 0.30, { type: "sawtooth", volume: 0.18, endFreq: 40 });
    },
    wall_break:      function () {
      sfxNoise(0.18, { volume: 0.16, cutoff: 1100 });
      sfxTone(220, 0.10, { type: "square", volume: 0.10, endFreq: 130 });
    },
    enemy_die:       function () {
      sfxTone(440, 0.18, { type: "sawtooth", volume: 0.14, endFreq: 110 });
      sfxNoise(0.10, { volume: 0.08, cutoff: 1400 });
    },
    scholar_break:   function () {
      [659, 988, 1318].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.12, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    scholar_correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong:   function () { sfxTone(330, 0.18, { type: "sawtooth", volume: 0.14, endFreq: 220 }); },
    power_up_grab:   function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    exit_open:       function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 70);
      });
    },
    life_lost:       function () { sfxTone(440, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 80 }); },
    gameOver:        function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    boss_intro:      function () {
      [110, 165, 220].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.40, { type: "sawtooth", volume: 0.20 }); }, i * 200);
      });
    },
    blocked:         function () { sfxTone(180, 0.05, { type: "sawtooth", volume: 0.06, endFreq: 110 }); }
  };

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | mapClear | dying | bossIntro
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
    dom.hudBombs = $("hudBombs");
    dom.hudRange = $("hudRange");
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
    dom.bombBtn = $("bombBtn");
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
    dom.tcBomb = $("tcBomb");
    dom.tcReset = $("tcReset");
    dom.puBombs = $("puBombs");
    dom.puRange = $("puRange");
    dom.puSpeed = $("puSpeed");
    dom.puShield = $("puShield");
    dom.puKick = $("puKick");
  }

  // -- RNG -------------------------------------------------------------------
  function makeRng(seed) {
    var s = (seed || 1) >>> 0;
    return function () {
      s = (s * 1103515245 + 12345) >>> 0;
      return (s & 0x7fffffff) / 0x7fffffff;
    };
  }

  // -- Map generation --------------------------------------------------------
  // 13x11 grid: solid checkerboard pillars at odd/odd interiors,
  // outer ring is solid wall. Soft walls scattered on remaining floors,
  // exit hidden under one random soft wall, scholar wall takes one soft slot,
  // player spawn corner kept open, enemies placed in the interior.
  function generateMap(mapNum) {
    var rng = makeRng(mapNum * 9301 + 49297);
    var tiles = [];
    var y, x;
    for (y = 0; y < ROWS; y++) {
      tiles.push([]);
      for (x = 0; x < COLS; x++) {
        var t = T_FLOOR;
        if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) t = T_SOLID;
        else if (x % 2 === 0 && y % 2 === 0) t = T_SOLID;
        tiles[y].push(t);
      }
    }
    // Reserve player spawn corner (1,1) and adjacent tiles open
    var spawnSafe = [[1,1],[2,1],[1,2]];
    function isSafe(x, y) {
      for (var k = 0; k < spawnSafe.length; k++) if (spawnSafe[k][0] === x && spawnSafe[k][1] === y) return true;
      return false;
    }

    // Scatter soft walls on floor tiles (excluding spawn safe tiles)
    var softList = [];
    for (y = 1; y < ROWS - 1; y++) {
      for (x = 1; x < COLS - 1; x++) {
        if (tiles[y][x] !== T_FLOOR) continue;
        if (isSafe(x, y)) continue;
        // Density scales with map number — 60% to 75%
        var dens = Math.min(0.78, 0.60 + (mapNum - 1) * 0.015);
        if (rng() < dens) {
          tiles[y][x] = T_SOFT;
          softList.push({ x: x, y: y });
        }
      }
    }

    // Place scholar wall on one of the soft tiles (random)
    var scholarPos = null;
    if (softList.length > 0) {
      var sIdx = Math.floor(rng() * softList.length);
      var sPos = softList[sIdx];
      tiles[sPos.y][sPos.x] = T_SCHOLAR;
      scholarPos = { x: sPos.x, y: sPos.y };
      softList.splice(sIdx, 1);
    }

    // Place exit under a random remaining soft wall (the *tile* type stays T_SOFT;
    // we track exit position separately and reveal it once that soft wall is destroyed
    // or scholar is answered correctly).
    var exitPos = null;
    if (softList.length > 0) {
      var eIdx = Math.floor(rng() * softList.length);
      exitPos = { x: softList[eIdx].x, y: softList[eIdx].y };
    } else {
      // Fallback: place exit on furthest floor tile
      exitPos = { x: COLS - 2, y: ROWS - 2 };
    }

    return {
      tiles: tiles,
      scholarPos: scholarPos,
      exitPos: exitPos,
      spawn: { x: 1, y: 1 }
    };
  }

  // Plan enemies for given map — counts and types ramp by mapNum.
  function planEnemies(mapNum, board) {
    var rng = makeRng(mapNum * 7919 + 12347);
    var list = [];
    var isBossMap = mapNum % BOSS_INTERVAL === 0;
    if (isBossMap) {
      // 1 boss + 2 wanderer minions
      var bossPos = findFarSpawnTile(board, 6, rng);
      list.push({ type: E_BOSS, x: bossPos.x, y: bossPos.y, hp: 5, dir: "left", moveCd: 0, summonCd: 4.0, isBoss: true });
      // Two wanderer minions
      for (var k = 0; k < 2; k++) {
        var p = findFarSpawnTile(board, 4, rng);
        list.push({ type: E_WANDERER, x: p.x, y: p.y, hp: 1, dir: "left", moveCd: 0 });
      }
    } else {
      // Counts scale with map number
      var nWanderer = 1 + Math.floor((mapNum - 1) / 2);
      var nHunter = mapNum >= 2 ? 1 + Math.floor((mapNum - 2) / 4) : 0;
      var nGhost = mapNum >= 4 ? 1 + Math.floor((mapNum - 4) / 6) : 0;
      nWanderer = Math.min(nWanderer, 4);
      nHunter = Math.min(nHunter, 3);
      nGhost = Math.min(nGhost, 2);
      var i;
      for (i = 0; i < nWanderer; i++) {
        var p1 = findFarSpawnTile(board, 4, rng);
        list.push({ type: E_WANDERER, x: p1.x, y: p1.y, hp: 1, dir: "left", moveCd: 0 });
      }
      for (i = 0; i < nHunter; i++) {
        var p2 = findFarSpawnTile(board, 5, rng);
        list.push({ type: E_HUNTER, x: p2.x, y: p2.y, hp: 2, dir: "left", moveCd: 0 });
      }
      for (i = 0; i < nGhost; i++) {
        var p3 = findFarSpawnTile(board, 5, rng);
        list.push({ type: E_GHOST, x: p3.x, y: p3.y, hp: 2, dir: "left", moveCd: 0 });
      }
    }
    return list;
  }
  function findFarSpawnTile(board, minDist, rng) {
    var tries = 0;
    var spawn = board.spawn;
    while (tries < 80) {
      tries++;
      var x = 1 + Math.floor(rng() * (COLS - 2));
      var y = 1 + Math.floor(rng() * (ROWS - 2));
      if (board.tiles[y][x] !== T_FLOOR) continue;
      var d = Math.abs(x - spawn.x) + Math.abs(y - spawn.y);
      if (d < minDist) continue;
      return { x: x, y: y };
    }
    // Fallback
    return { x: COLS - 2, y: ROWS - 2 };
  }

  // -- Geometry --------------------------------------------------------------
  function getBoardOrigin() {
    var availableW = LOGICAL_W;
    var availableH = LOGICAL_H - BOARD_PADDING_TOP - BOARD_PADDING_BOTTOM;
    var tilePx = Math.min(TILE_PX, Math.floor(Math.min(availableW / COLS, availableH / ROWS)));
    var bw = COLS * tilePx;
    var bh = ROWS * tilePx;
    var ox = Math.floor((LOGICAL_W - bw) / 2);
    var oy = BOARD_PADDING_TOP + Math.floor((availableH - bh) / 2);
    return { ox: ox, oy: oy, tilePx: tilePx };
  }

  function tilePxCenter(x, y) {
    var go = state.boardOrigin;
    return { x: go.ox + x * go.tilePx + go.tilePx / 2, y: go.oy + y * go.tilePx + go.tilePx / 2 };
  }
  function tileToScreen(x, y) {
    var go = state.boardOrigin;
    return { x: go.ox + x * go.tilePx, y: go.oy + y * go.tilePx, size: go.tilePx };
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var mapNum = opts.map || 1;
    var board = generateMap(mapNum);
    var enemies = planEnemies(mapNum, board);

    state = {
      map: mapNum,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      mapsCleared: opts.mapsCleared || 0,
      maxMapReached: opts.maxMapReached || mapNum,
      enemiesDefeated: opts.enemiesDefeated || 0,
      bombsPlaced: opts.bombsPlaced || 0,
      best: opts.best || readBest(),

      // Power-up persistent stats (carry across maps)
      maxBombs: opts.maxBombs || BOMB_LIMIT_INIT,
      explosionRange: opts.explosionRange || EXPLOSION_RANGE_INIT,
      moveSpeed: opts.moveSpeed || SPEED_INIT,
      shieldArmed: !!opts.shieldArmed,
      kickAbility: !!opts.kickAbility,

      // Per-map runtime
      board: board,
      player: {
        gx: board.spawn.x,                  // grid x (cell coords)
        gy: board.spawn.y,
        x: board.spawn.x + 0.5,             // continuous tile-space coords (center)
        y: board.spawn.y + 0.5,
        moveDir: null,                      // active hold direction
        facing: "down",
        moving: false,
        invuln: 0
      },
      bombs: [],
      explosions: [],
      enemies: enemies,
      pickups: [],
      flashes: [],
      particles: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      timeBudget: INITIAL_TIME_BUDGET,
      timeLeft: INITIAL_TIME_BUDGET,
      exitRevealed: false,
      scholarBroken: false,                 // tracks if scholar wall already broken

      time: 0,
      mapStartTs: Date.now(),
      endReason: ""
    };
    state.boardOrigin = getBoardOrigin();
  }

  // -- Movement / collision --------------------------------------------------
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }
  function tileAt(x, y) {
    if (!inBounds(x, y)) return T_SOLID;
    return state.board.tiles[y][x];
  }
  function bombAt(gx, gy) {
    for (var i = 0; i < state.bombs.length; i++) {
      if (state.bombs[i].gx === gx && state.bombs[i].gy === gy) return state.bombs[i];
    }
    return null;
  }
  function pickupAt(gx, gy) {
    for (var i = 0; i < state.pickups.length; i++) {
      if (state.pickups[i].gx === gx && state.pickups[i].gy === gy) return state.pickups[i];
    }
    return null;
  }
  function isBlockingForPlayer(gx, gy) {
    var t = tileAt(gx, gy);
    if (t === T_SOLID) return true;
    if (t === T_SOFT) return true;
    if (t === T_SCHOLAR) return true;
    var b = bombAt(gx, gy);
    if (b && !b.passable) return true;
    return false;
  }
  function isBlockingForEnemy(enemy, gx, gy) {
    var t = tileAt(gx, gy);
    if (t === T_SOLID) return true;
    if (enemy.type === E_GHOST) {
      // Ghost phases through soft walls only (NOT scholar walls — scholars block
      // even ghosts so the review prompt is not bypassed by phase-through)
      if (t === T_SOFT) return false;
    }
    if (t === T_SOFT) return true;
    if (t === T_SCHOLAR) return true;
    var b = bombAt(gx, gy);
    if (b && !b.passable) return true;
    return false;
  }

  // -- Input flags -----------------------------------------------------------
  var keys = { up: false, down: false, left: false, right: false };
  var pendingBomb = false;

  function setMoveKey(dir, val) {
    if (!keys.hasOwnProperty(dir)) return;
    keys[dir] = val;
  }
  function activeMoveDir() {
    // Priority: most recently pressed by checking last-set; here we use a deterministic
    // priority order — left/right beats up/down for diagonal-blocking; we simply pick
    // whichever is true with up/down first, then left/right.
    if (keys.up && !keys.down) return "up";
    if (keys.down && !keys.up) return "down";
    if (keys.left && !keys.right) return "left";
    if (keys.right && !keys.left) return "right";
    return null;
  }

  // -- Player update ---------------------------------------------------------
  function updatePlayer(dt) {
    var p = state.player;
    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
    var dir = activeMoveDir();
    p.moving = false;

    if (dir) {
      p.moveDir = dir;
      p.facing = dir;
      var dx = 0, dy = 0;
      if (dir === "up") dy = -1;
      else if (dir === "down") dy = 1;
      else if (dir === "left") dx = -1;
      else dx = 1;
      // Sub-tile movement; tile-grid collision against next cell
      var step = state.moveSpeed * dt;
      var newX = p.x + dx * step;
      var newY = p.y + dy * step;
      // Snap-to-axis: when moving horizontally, ease toward y center; vice versa.
      if (dx !== 0) {
        var snapY = Math.floor(p.y) + 0.5;
        if (Math.abs(p.y - snapY) > 0.001) {
          var ssign = snapY > p.y ? 1 : -1;
          var sStep = Math.min(Math.abs(snapY - p.y), step * 0.7);
          newY = p.y + ssign * sStep;
        } else newY = snapY;
      }
      if (dy !== 0) {
        var snapX = Math.floor(p.x) + 0.5;
        if (Math.abs(p.x - snapX) > 0.001) {
          var ssign2 = snapX > p.x ? 1 : -1;
          var sStep2 = Math.min(Math.abs(snapX - p.x), step * 0.7);
          newX = p.x + ssign2 * sStep2;
        } else newX = snapX;
      }
      // Collide with next tile in dir
      var probeX = newX + dx * 0.49;
      var probeY = newY + dy * 0.49;
      var tx = Math.floor(probeX);
      var ty = Math.floor(probeY);
      // Bomb pass-through: player can stand on an own bomb at spawn (passable),
      // but can't enter a non-passable bomb tile.
      var blocking = isBlockingForPlayer(tx, ty);
      // Allow player to leave tiles that contain their own dropped bomb (if bomb is passable)
      if (blocking) {
        // Check kick: if bomb in front and kick ability + same-axis empty space, kick it
        var bf = bombAt(tx, ty);
        if (bf && state.kickAbility && !bf.passable) {
          var success = tryKickBomb(bf, dir);
          if (success) {
            // Allow player to slide a tiny bit into vacated cell — but only if cell now clear
            var bf2 = bombAt(tx, ty);
            if (!bf2) {
              p.x = newX; p.y = newY; p.moving = true;
            }
          }
          // Either way, player stops at edge
        }
      } else {
        p.x = newX; p.y = newY; p.moving = true;
      }
      // Update grid cell
      p.gx = Math.floor(p.x);
      p.gy = Math.floor(p.y);
      // Bomb passable status: if player has moved off bomb tile, mark non-passable
      for (var bi = 0; bi < state.bombs.length; bi++) {
        var bb = state.bombs[bi];
        if (bb.passable && (p.gx !== bb.gx || p.gy !== bb.gy)) bb.passable = false;
      }
      // Pickup collection
      var pk = pickupAt(p.gx, p.gy);
      if (pk) collectPickup(pk);
    }

    // Bomb drop request
    if (pendingBomb) {
      pendingBomb = false;
      tryDropBomb();
    }
  }

  // -- Bombs -----------------------------------------------------------------
  function tryDropBomb() {
    var p = state.player;
    var gx = p.gx, gy = p.gy;
    if (bombAt(gx, gy)) return false;
    if (tileAt(gx, gy) !== T_FLOOR) return false;
    var alive = 0;
    for (var i = 0; i < state.bombs.length; i++) if (!state.bombs[i].exploded) alive++;
    if (alive >= state.maxBombs) return false;
    var bomb = {
      gx: gx, gy: gy,
      fuse: BOMB_FUSE_MS / 1000,
      ticked: 0,
      range: state.explosionRange,
      passable: true,                  // pass for player only at drop time (until they step off)
      kickedDir: null,
      kickSpeed: 0,
      kickX: gx + 0.5,                 // continuous coord while sliding
      kickY: gy + 0.5,
      exploded: false
    };
    state.bombs.push(bomb);
    sfx.bomb_drop();
    state.bombsPlaced++;
    return true;
  }

  function tryKickBomb(bomb, dir) {
    var dx = 0, dy = 0;
    if (dir === "up") dy = -1;
    else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1;
    else dx = 1;
    // Check next cell empty for kick
    var nx = bomb.gx + dx, ny = bomb.gy + dy;
    if (!inBounds(nx, ny)) return false;
    if (tileAt(nx, ny) !== T_FLOOR) return false;
    if (bombAt(nx, ny)) return false;
    if (pickupAt(nx, ny)) return false;
    bomb.kickedDir = dir;
    bomb.kickSpeed = 6.0;       // tiles/sec
    return true;
  }

  function updateBombs(dt) {
    for (var i = state.bombs.length - 1; i >= 0; i--) {
      var b = state.bombs[i];
      if (b.exploded) continue;
      // Fuse tick countdown
      var prevTick = Math.floor(b.ticked);
      b.fuse -= dt;
      b.ticked += dt;
      if (Math.floor(b.ticked) > prevTick && b.ticked < BOMB_FUSE_MS / 1000) {
        sfx.bomb_fuse_tick();
      }
      // Sliding (kicked) bomb
      if (b.kickedDir && b.kickSpeed > 0) {
        var dx = 0, dy = 0;
        if (b.kickedDir === "up") dy = -1;
        else if (b.kickedDir === "down") dy = 1;
        else if (b.kickedDir === "left") dx = -1;
        else dx = 1;
        var step = b.kickSpeed * dt;
        b.kickX += dx * step;
        b.kickY += dy * step;
        // Snap to grid as we cross cell centers
        var ngx = Math.floor(b.kickX);
        var ngy = Math.floor(b.kickY);
        if (ngx !== b.gx || ngy !== b.gy) {
          // Check if next cell is valid
          if (!inBounds(ngx, ngy) || tileAt(ngx, ngy) !== T_FLOOR || bombAt(ngx, ngy) ||
              (state.player.gx === ngx && state.player.gy === ngy)) {
            // stop kick; reset to current cell center
            b.kickedDir = null;
            b.kickSpeed = 0;
            b.kickX = b.gx + 0.5;
            b.kickY = b.gy + 0.5;
          } else {
            b.gx = ngx; b.gy = ngy;
          }
        }
        // Stop if hit bound
        if (Math.abs(b.kickX - (b.gx + 0.5)) > 0.5 || Math.abs(b.kickY - (b.gy + 0.5)) > 0.5) {
          // safety
          b.kickX = b.gx + 0.5; b.kickY = b.gy + 0.5;
        }
      }
      if (b.fuse <= 0) explodeBomb(b);
    }
  }

  function explodeBomb(b) {
    if (b.exploded) return;
    b.exploded = true;
    sfx.bomb_explode();
    addShake(8, 0.4);
    // Remove bomb from list
    var idx = state.bombs.indexOf(b);
    if (idx >= 0) state.bombs.splice(idx, 1);
    // Build explosion cells: center + cross arms up to range or solid wall
    var cells = [{ x: b.gx, y: b.gy, dir: "center" }];
    var dirs = [{ dx: 1, dy: 0, name: "right" }, { dx: -1, dy: 0, name: "left" }, { dx: 0, dy: -1, name: "up" }, { dx: 0, dy: 1, name: "down" }];
    var hitSoft = []; // cells that triggered soft wall destruction
    for (var d = 0; d < 4; d++) {
      var di = dirs[d];
      for (var r = 1; r <= b.range; r++) {
        var cx = b.gx + di.dx * r;
        var cy = b.gy + di.dy * r;
        if (!inBounds(cx, cy)) break;
        var t = tileAt(cx, cy);
        if (t === T_SOLID) break;
        cells.push({ x: cx, y: cy, dir: di.name });
        if (t === T_SOFT || t === T_SCHOLAR) {
          hitSoft.push({ x: cx, y: cy, type: t });
          break; // explosion stops after destroying soft tile
        }
      }
    }
    // Register explosion FX
    state.explosions.push({
      cells: cells,
      life: EXPLOSION_LIFE_MS / 1000,
      totalLife: EXPLOSION_LIFE_MS / 1000
    });
    // Process effects: soft walls, enemies, player, chained bombs, pickups
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      // Chain other bombs
      var chainB = bombAt(c.x, c.y);
      if (chainB && chainB !== b && !chainB.exploded) {
        chainB.fuse = 0.05;
      }
      // Pickups vaporized in explosion
      var pIdx = -1;
      for (var pii = 0; pii < state.pickups.length; pii++) {
        if (state.pickups[pii].gx === c.x && state.pickups[pii].gy === c.y) { pIdx = pii; break; }
      }
      if (pIdx >= 0) {
        burstAt(tilePxCenter(c.x, c.y).x, tilePxCenter(c.x, c.y).y, "#a991ff", 8);
        state.pickups.splice(pIdx, 1);
      }
      // Hit player
      var p = state.player;
      if (p.gx === c.x && p.gy === c.y && p.invuln <= 0 && phase === "playing") {
        playerHit("explosion");
      }
      // Hit enemies
      for (var ei = state.enemies.length - 1; ei >= 0; ei--) {
        var en = state.enemies[ei];
        if (en.gx === c.x && en.gy === c.y || (Math.floor(en.x) === c.x && Math.floor(en.y) === c.y)) {
          en.hp--;
          if (en.hp <= 0) {
            state.enemies.splice(ei, 1);
            state.enemiesDefeated++;
            sfx.enemy_die();
            burstAt(tilePxCenter(c.x, c.y).x, tilePxCenter(c.x, c.y).y, "#f04860", 18);
            var bonus = en.type === E_BOSS ? 1500 : (en.type === E_HUNTER || en.type === E_GHOST ? 250 : 100);
            state.score += bonus;
            pushPopup("+" + bonus, tilePxCenter(c.x, c.y).x, tilePxCenter(c.x, c.y).y - 16, "is-bonus");
            if (en.type === E_BOSS) {
              pushPopup("BOSS DOWN!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
              sfx.exit_open();
            }
          } else {
            burstAt(tilePxCenter(c.x, c.y).x, tilePxCenter(c.x, c.y).y, "#f5b04a", 10);
            en.invuln = 0.4;
          }
        }
      }
    }
    // Destroy soft walls (after enemies/player so explosion can reach through if range>1 — but we already capped)
    for (var s = 0; s < hitSoft.length; s++) {
      var cell = hitSoft[s];
      var wasScholar = cell.type === T_SCHOLAR;
      state.board.tiles[cell.y][cell.x] = T_FLOOR;
      sfx.wall_break();
      burstAt(tilePxCenter(cell.x, cell.y).x, tilePxCenter(cell.x, cell.y).y, "#a96e3d", 14);
      // If this cell is the exit, reveal it
      if (state.board.exitPos && state.board.exitPos.x === cell.x && state.board.exitPos.y === cell.y) {
        state.exitRevealed = true;
        state.board.tiles[cell.y][cell.x] = T_EXIT;
        sfx.exit_open();
        pushPopup("EXIT REVEALED", LOGICAL_W / 2, 100, "is-emerald");
      }
      // Roll for power-up drop
      if (wasScholar) {
        // Scholar wall: open review modal
        if (!state.scholarBroken) {
          state.scholarBroken = true;
          sfx.scholar_break();
          openScholarQuestion(cell);
          // Also drop a power-up regardless (per spec: skip/wrong silent + still drops random power-up)
          maybeDropPowerup(cell);
        }
      } else {
        if (Math.random() < POWERUP_DROP_PROB) {
          maybeDropPowerup(cell);
        }
      }
    }
  }

  function maybeDropPowerup(cell) {
    var t = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.pickups.push({ gx: cell.x, gy: cell.y, type: t, age: 0 });
  }

  function collectPickup(pk) {
    sfx.power_up_grab();
    var label = "";
    if (pk.type === PU_BOMB) {
      state.maxBombs = Math.min(BOMB_LIMIT_MAX, state.maxBombs + 1);
      label = "+1 BOMB";
    } else if (pk.type === PU_RANGE) {
      state.explosionRange = Math.min(EXPLOSION_RANGE_MAX, state.explosionRange + 1);
      label = "+1 RANGE";
    } else if (pk.type === PU_SPEED) {
      state.moveSpeed = Math.min(SPEED_MAX, state.moveSpeed + SPEED_BONUS_PER_PICKUP);
      label = "+SPEED";
    } else if (pk.type === PU_SHIELD) {
      state.shieldArmed = true;
      label = "SHIELD";
    } else if (pk.type === PU_KICK) {
      state.kickAbility = true;
      label = "KICK";
    }
    state.score += 200;
    pushPopup(label, tilePxCenter(pk.gx, pk.gy).x, tilePxCenter(pk.gx, pk.gy).y - 16, "is-bonus");
    burstAt(tilePxCenter(pk.gx, pk.gy).x, tilePxCenter(pk.gx, pk.gy).y, "#a991ff", 12);
    // Remove pickup from list
    var idx = state.pickups.indexOf(pk);
    if (idx >= 0) state.pickups.splice(idx, 1);
    updateHud();
  }

  // -- Explosions / FX -------------------------------------------------------
  function updateExplosions(dt) {
    for (var i = state.explosions.length - 1; i >= 0; i--) {
      var e = state.explosions[i];
      e.life -= dt;
      if (e.life <= 0) state.explosions.splice(i, 1);
    }
  }

  // -- Enemy AI --------------------------------------------------------------
  var ENEMY_DIRS = [
    { name: "left", dx: -1, dy: 0 },
    { name: "right", dx: 1, dy: 0 },
    { name: "up", dx: 0, dy: -1 },
    { name: "down", dx: 0, dy: 1 }
  ];
  function dirVec(name) {
    for (var i = 0; i < ENEMY_DIRS.length; i++) if (ENEMY_DIRS[i].name === name) return ENEMY_DIRS[i];
    return ENEMY_DIRS[0];
  }
  function oppositeDir(name) {
    if (name === "left") return "right";
    if (name === "right") return "left";
    if (name === "up") return "down";
    return "up";
  }

  function updateEnemies(dt) {
    var p = state.player;
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.invuln) e.invuln = Math.max(0, e.invuln - dt);
      if (e.gx == null) {
        e.gx = e.x; e.gy = e.y; e.x = e.gx + 0.5; e.y = e.gy + 0.5;
      }
      // Boss special: summon minions periodically
      if (e.type === E_BOSS) {
        e.summonCd -= dt;
        if (e.summonCd <= 0 && state.enemies.length < 8) {
          var bx = e.gx, by = e.gy;
          var slot = null;
          for (var di = 0; di < ENEMY_DIRS.length && !slot; di++) {
            var dvec = ENEMY_DIRS[di];
            var sx = bx + dvec.dx, sy = by + dvec.dy;
            if (inBounds(sx, sy) && tileAt(sx, sy) === T_FLOOR && !bombAt(sx, sy)) {
              slot = { x: sx, y: sy };
            }
          }
          if (slot) {
            state.enemies.push({ type: E_MINION, gx: slot.x, gy: slot.y, x: slot.x + 0.5, y: slot.y + 0.5, hp: 1, dir: "left", moveCd: 0 });
            burstAt(tilePxCenter(slot.x, slot.y).x, tilePxCenter(slot.x, slot.y).y, "#d04848", 12);
          }
          e.summonCd = 5.0;
        }
      }
      // Movement: tile-based step
      var speedTilesPerSec = 1.6;
      if (e.type === E_HUNTER) speedTilesPerSec = 2.2;
      if (e.type === E_GHOST) speedTilesPerSec = 1.4;
      if (e.type === E_BOSS) speedTilesPerSec = 1.0;
      if (e.type === E_MINION) speedTilesPerSec = 2.0;
      var step = speedTilesPerSec * dt;

      // Re-pick direction at cell centers
      var atCenter = (Math.abs(e.x - (e.gx + 0.5)) < 0.05) && (Math.abs(e.y - (e.gy + 0.5)) < 0.05);
      if (atCenter) {
        e.x = e.gx + 0.5; e.y = e.gy + 0.5;
        e.dir = chooseEnemyDirection(e);
      }
      var dv = dirVec(e.dir);
      // Try to move forward; if blocked at next cell boundary, stop
      var newX = e.x + dv.dx * step;
      var newY = e.y + dv.dy * step;
      // Compute target cell as next cell along dir
      var targetGx = e.gx + dv.dx;
      var targetGy = e.gy + dv.dy;
      // Check blocking only when crossing into next cell
      var crossing = false;
      if (dv.dx > 0 && newX >= e.gx + 1) crossing = true;
      if (dv.dx < 0 && newX <= e.gx) crossing = true;
      if (dv.dy > 0 && newY >= e.gy + 1) crossing = true;
      if (dv.dy < 0 && newY <= e.gy) crossing = true;
      if (crossing) {
        if (isBlockingForEnemy(e, targetGx, targetGy)) {
          // Snap to cell center, change direction next tick
          e.x = e.gx + 0.5;
          e.y = e.gy + 0.5;
          e.dir = chooseEnemyDirection(e, /*forceChange*/ true);
        } else {
          e.x = newX; e.y = newY;
          e.gx = Math.floor(e.x);
          e.gy = Math.floor(e.y);
        }
      } else {
        e.x = newX; e.y = newY;
      }

      // Player collision check
      if (Math.abs(e.x - p.x) < 0.7 && Math.abs(e.y - p.y) < 0.7 && p.invuln <= 0 && phase === "playing") {
        playerHit("enemy");
      }
    }
  }

  function chooseEnemyDirection(e, forceChange) {
    // Pool of valid directions (not solid, not into a placed bomb if non-passable for them)
    var candidates = [];
    for (var i = 0; i < ENEMY_DIRS.length; i++) {
      var d = ENEMY_DIRS[i];
      var nx = e.gx + d.dx, ny = e.gy + d.dy;
      if (!isBlockingForEnemy(e, nx, ny)) candidates.push(d.name);
    }
    if (candidates.length === 0) return e.dir;
    if (e.type === E_HUNTER || e.type === E_BOSS) {
      // Greedy chase: prefer dir that reduces manhattan distance to player
      var p = state.player;
      var bestDir = null, bestD = 1e9;
      for (var k = 0; k < candidates.length; k++) {
        var name = candidates[k];
        var v = dirVec(name);
        var nx2 = e.gx + v.dx, ny2 = e.gy + v.dy;
        var dist = Math.abs(nx2 - Math.floor(p.x)) + Math.abs(ny2 - Math.floor(p.y));
        if (dist < bestD) { bestD = dist; bestDir = name; }
      }
      // 25% chance to randomly deviate to avoid getting stuck
      if (Math.random() < 0.18) bestDir = candidates[Math.floor(Math.random() * candidates.length)];
      return bestDir || candidates[0];
    } else if (e.type === E_GHOST) {
      // Ghost: also pursue but can phase soft walls
      var p2 = state.player;
      var bestG = null, bestGD = 1e9;
      for (var k2 = 0; k2 < candidates.length; k2++) {
        var name2 = candidates[k2];
        var v2 = dirVec(name2);
        var nx3 = e.gx + v2.dx, ny3 = e.gy + v2.dy;
        var d2 = Math.abs(nx3 - Math.floor(p2.x)) + Math.abs(ny3 - Math.floor(p2.y));
        if (d2 < bestGD) { bestGD = d2; bestG = name2; }
      }
      if (Math.random() < 0.30) bestG = candidates[Math.floor(Math.random() * candidates.length)];
      return bestG || candidates[0];
    } else {
      // Wanderer / minion: random walk; avoid reversing unless forced
      if (!forceChange && candidates.indexOf(e.dir) >= 0 && Math.random() < 0.55) return e.dir;
      var noBack = candidates.filter(function (n) { return n !== oppositeDir(e.dir); });
      if (noBack.length > 0) return noBack[Math.floor(Math.random() * noBack.length)];
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  // -- Player hit / death ----------------------------------------------------
  function playerHit(reason) {
    if (state.player.invuln > 0) return;
    if (state.shieldArmed) {
      state.shieldArmed = false;
      state.player.invuln = 1.5;
      sfx.power_up_grab();
      pushPopup("SHIELD!", tilePxCenter(state.player.gx, state.player.gy).x, tilePxCenter(state.player.gx, state.player.gy).y - 18, "is-bonus");
      burstAt(tilePxCenter(state.player.gx, state.player.gy).x, tilePxCenter(state.player.gx, state.player.gy).y, "#5de0f0", 18);
      addShake(4, 0.2);
      updateHud();
      return;
    }
    sfx.life_lost();
    addShake(10, 0.5);
    burstAt(tilePxCenter(state.player.gx, state.player.gy).x, tilePxCenter(state.player.gx, state.player.gy).y, "#f04860", 24);
    state.lives--;
    if (state.lives <= 0) {
      phase = "dying";
      setTimeout(function () { gameOver(); }, 900);
    } else {
      phase = "dying";
      setTimeout(function () {
        // Reset positions only — keep map state, score, power-ups
        state.player.gx = state.board.spawn.x;
        state.player.gy = state.board.spawn.y;
        state.player.x = state.board.spawn.x + 0.5;
        state.player.y = state.board.spawn.y + 0.5;
        state.player.invuln = 2.0;
        // Clear enemies adjacent to spawn to avoid instant re-death
        state.enemies = state.enemies.filter(function (en) {
          var d = Math.abs(en.gx - state.board.spawn.x) + Math.abs(en.gy - state.board.spawn.y);
          return d >= 3;
        });
        phase = "playing";
        updateHud();
      }, 700);
    }
    updateHud();
  }

  // -- Map clear -------------------------------------------------------------
  function checkExit() {
    if (!state.exitRevealed) return;
    var p = state.player;
    var t = tileAt(p.gx, p.gy);
    if (t === T_EXIT) {
      onMapClear();
    }
  }

  function onMapClear() {
    if (phase === "mapClear" || phase === "question" || phase === "dying") return;
    phase = "mapClear";
    // Ensure any lingering overlay is dismissed before transition
    showScreen(null);
    sfx.exit_open();
    addShake(6, 0.5);
    var timeBonus = Math.max(0, Math.floor(state.timeLeft) * 100);
    var enemyPenalty = state.enemies.length * -200; // negative number
    var bonus = timeBonus + enemyPenalty;
    if (bonus < 0) bonus = 0; // never go below 0 per-map net contribution from these
    state.score += bonus;
    pushPopup("MAP CLEAR!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopup("+" + (timeBonus + enemyPenalty), LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    if (state.map % BOSS_INTERVAL === 0) pushPopup("BOSS CONQUERED", LOGICAL_W / 2, LOGICAL_H / 2 - 80, "is-legend");
    state.mapsCleared++;
    state.maxMapReached = Math.max(state.maxMapReached, state.map + 1);
    // Bonus life every 5 maps
    if (state.map % BONUS_LIFE_INTERVAL === 0) {
      state.lives++;
      pushPopup("+1 LIFE", LOGICAL_W / 2, 110, "is-emerald");
    }
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#ff5028", "#f5b04a", "#5de0f0", "#a991ff"] });
      }
    } catch (e) {}
    saveSnapshot();
    setTimeout(function () {
      var nextMap = state.map + 1;
      var carry = {
        map: nextMap,
        score: state.score,
        lives: state.lives,
        shardsAwarded: state.shardsAwarded,
        questionsAnsweredCorrect: state.questionsAnsweredCorrect,
        questionsAnsweredTotal: state.questionsAnsweredTotal,
        best: state.best,
        mapsCleared: state.mapsCleared,
        enemiesDefeated: state.enemiesDefeated,
        bombsPlaced: state.bombsPlaced,
        maxMapReached: Math.max(state.maxMapReached, nextMap),
        maxBombs: state.maxBombs,
        explosionRange: state.explosionRange,
        moveSpeed: state.moveSpeed,
        shieldArmed: state.shieldArmed,
        kickAbility: state.kickAbility
      };
      initState(carry);
      phase = "playing";
      // Boss intro for boss maps
      if (state.map % BOSS_INTERVAL === 0) {
        sfx.boss_intro();
        addShake(6, 0.5);
        pushPopup("BOSS APPROACHES", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
      }
      updateHud();
      updatePowerupSlots();
    }, 1500);
  }

  // -- Time pressure ---------------------------------------------------------
  function updateTime(dt) {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      // Spawn an extra hunter every 15 seconds past timeout, max 3 extras
      state.timeLeft = -15;
      var rng = makeRng((state.map * 31 + Date.now()) >>> 0);
      var spot = findFarSpawnTile(state.board, 4, rng);
      if (state.enemies.length < 10) {
        state.enemies.push({ type: E_HUNTER, gx: spot.x, gy: spot.y, x: spot.x + 0.5, y: spot.y + 0.5, hp: 2, dir: "left", moveCd: 0 });
        pushPopup("HUNTER SUMMONED", LOGICAL_W / 2, 110, "is-warn");
      }
    }
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
    drawBoardFloor();
    drawTiles();
    drawPickups();
    drawBombs();
    drawExplosions();
    drawEnemies();
    drawPlayer();
    drawParticles();

    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#0a0612";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    var go = state.boardOrigin;
    var cx = go.ox + (COLS * go.tilePx) / 2;
    var cy = go.oy + (ROWS * go.tilePx) / 2;
    var rad = Math.max(COLS, ROWS) * go.tilePx * 0.7;
    var glow = ctx.createRadialGradient(cx, cy, 60, cx, cy, rad);
    glow.addColorStop(0, "rgba(255, 80, 40, 0.10)");
    glow.addColorStop(0.6, "rgba(40, 12, 6, 0.10)");
    glow.addColorStop(1, "rgba(10, 6, 4, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Decorative checker pattern
    ctx.fillStyle = "rgba(120, 60, 30, 0.04)";
    for (var y = 0; y < LOGICAL_H; y += 60) {
      for (var x = 0; x < LOGICAL_W; x += 60) {
        if (((x / 60 + y / 60) | 0) % 2 === 0) ctx.fillRect(x, y, 30, 30);
      }
    }
  }

  function drawBoardFloor() {
    var go = state.boardOrigin;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(go.ox - 8, go.oy - 8, COLS * go.tilePx + 16, ROWS * go.tilePx + 16);
    ctx.restore();
  }

  function drawTiles() {
    var go = state.boardOrigin;
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        drawTile(x, y, state.board.tiles[y][x], go);
      }
    }
  }

  function drawTile(x, y, t, go) {
    var px = go.ox + x * go.tilePx;
    var py = go.oy + y * go.tilePx;
    var s = go.tilePx;
    if (t === T_SOLID) drawSolidWall(px, py, s, x, y);
    else if (t === T_SOFT) drawSoftWall(px, py, s);
    else if (t === T_SCHOLAR) drawScholarWall(px, py, s);
    else if (t === T_EXIT) drawExitTile(px, py, s);
    else drawFloorTile(px, py, s);
  }

  function drawFloorTile(px, py, s) {
    var grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, "#3a2618");
    grad.addColorStop(1, "#251608");
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = "rgba(255, 200, 140, 0.06)";
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
  }

  function drawSolidWall(px, py, s, gx, gy) {
    var grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, "#5a3a20");
    grad.addColorStop(1, "#2a1808");
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, s, s);
    // Inner highlight
    ctx.fillStyle = "rgba(255, 200, 140, 0.16)";
    ctx.fillRect(px + 2, py + 2, s - 4, 3);
    // Bottom shade
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(px + 2, py + s - 5, s - 4, 3);
    // Brick lines
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1;
    var midY = py + s / 2;
    ctx.beginPath();
    ctx.moveTo(px, midY); ctx.lineTo(px + s, midY);
    ctx.stroke();
    var offset = ((gx + gy) % 2) === 0 ? s / 4 : (s * 3) / 4;
    ctx.beginPath();
    ctx.moveTo(px + offset, py); ctx.lineTo(px + offset, midY);
    ctx.moveTo(px + (offset + s / 2) % s, midY); ctx.lineTo(px + (offset + s / 2) % s, py + s);
    ctx.stroke();
    // Outer border
    ctx.strokeStyle = "rgba(20, 8, 4, 0.7)";
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
  }

  function drawSoftWall(px, py, s) {
    var grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, "#a96e3d");
    grad.addColorStop(1, "#5e3a18");
    ctx.fillStyle = grad;
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
    // Plank lines
    ctx.strokeStyle = "rgba(20, 8, 4, 0.55)";
    ctx.lineWidth = 1;
    var lineY1 = py + s / 3;
    var lineY2 = py + (s * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(px + 3, lineY1); ctx.lineTo(px + s - 3, lineY1);
    ctx.moveTo(px + 3, lineY2); ctx.lineTo(px + s - 3, lineY2);
    ctx.stroke();
    // Highlight top edge
    ctx.fillStyle = "rgba(255, 220, 160, 0.2)";
    ctx.fillRect(px + 3, py + 3, s - 6, 2);
    // Border
    ctx.strokeStyle = "rgba(20, 8, 4, 0.8)";
    ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);
  }

  function drawScholarWall(px, py, s) {
    var pulse = 0.5 + 0.5 * Math.sin(state.time * 4);
    var grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, "#f5b04a");
    grad.addColorStop(1, "#a96e1a");
    ctx.fillStyle = grad;
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
    // Glow
    ctx.fillStyle = "rgba(255, 220, 140, " + (0.18 + 0.20 * pulse) + ")";
    ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
    // ? Sign
    ctx.fillStyle = "#3a2010";
    ctx.font = "bold " + Math.floor(s * 0.55) + "px 'Fraunces', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", px + s / 2, py + s / 2 + 2);
    // Border
    ctx.strokeStyle = "rgba(255, 220, 140, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);
  }

  function drawExitTile(px, py, s) {
    var pulse = 0.5 + 0.5 * Math.sin(state.time * 5);
    // Tone down glow when player stands on the exit so they remain visible
    var playerOnExit = state.player && state.player.gx === Math.floor((px - state.boardOrigin.ox) / state.boardOrigin.tilePx) &&
                       state.player.gy === Math.floor((py - state.boardOrigin.oy) / state.boardOrigin.tilePx);
    var glowAlpha = playerOnExit ? 0.35 : (0.6 + 0.3 * pulse);
    var grad = ctx.createRadialGradient(px + s / 2, py + s / 2, 2, px + s / 2, py + s / 2, s * 0.7);
    grad.addColorStop(0, "rgba(77, 212, 155, " + glowAlpha + ")");
    grad.addColorStop(1, "rgba(20, 80, 60, 0.0)");
    ctx.fillStyle = "#0c2a18";
    ctx.fillRect(px, py, s, s);
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, s, s);
    // Spiral / portal mark (dimmed when player is on tile)
    var strokeAlpha = playerOnExit ? 0.45 : (0.8 + 0.2 * pulse);
    ctx.strokeStyle = "rgba(170, 240, 200, " + strokeAlpha + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + s / 2, py + s / 2, s * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px + s / 2, py + s / 2, s * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPickups() {
    var go = state.boardOrigin;
    for (var i = 0; i < state.pickups.length; i++) {
      var pk = state.pickups[i];
      pk.age = (pk.age || 0) + 0.016;
      var bob = Math.sin(pk.age * 4) * 2;
      var px = go.ox + pk.gx * go.tilePx + go.tilePx / 2;
      var py = go.oy + pk.gy * go.tilePx + go.tilePx / 2 + bob;
      var s = go.tilePx * 0.5;
      var color = "#a991ff";
      var glyph = "?";
      if (pk.type === PU_BOMB) { color = "#f5b04a"; glyph = "B"; }
      else if (pk.type === PU_RANGE) { color = "#ff5028"; glyph = "R"; }
      else if (pk.type === PU_SPEED) { color = "#5de0f0"; glyph = "S"; }
      else if (pk.type === PU_SHIELD) { color = "#4dd49b"; glyph = "H"; }
      else if (pk.type === PU_KICK) { color = "#a991ff"; glyph = "K"; }
      // Halo
      ctx.fillStyle = "rgba(255, 220, 140, 0.18)";
      ctx.beginPath(); ctx.arc(px, py, s * 0.95, 0, Math.PI * 2); ctx.fill();
      // Body
      var grad = ctx.createRadialGradient(px - 4, py - 4, 1, px, py, s);
      grad.addColorStop(0, "#fff5d8");
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(px, py, s * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(20, 8, 4, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Glyph
      ctx.fillStyle = "#1a0c08";
      ctx.font = "bold " + Math.floor(s * 0.85) + "px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyph, px, py + 1);
    }
  }

  function drawBombs() {
    var go = state.boardOrigin;
    for (var i = 0; i < state.bombs.length; i++) {
      var b = state.bombs[i];
      var rx = (b.kickedDir ? b.kickX : b.gx + 0.5);
      var ry = (b.kickedDir ? b.kickY : b.gy + 0.5);
      var px = go.ox + rx * go.tilePx;
      var py = go.oy + ry * go.tilePx;
      var s = go.tilePx * 0.40;
      // Pulse: faster as fuse runs out
      var fuseT = Math.max(0, b.fuse / (BOMB_FUSE_MS / 1000));
      var pulse = 0.5 + 0.5 * Math.sin(state.time * (8 + (1 - fuseT) * 12));
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.ellipse(px, py + s * 0.7, s * 0.85, s * 0.25, 0, 0, Math.PI * 2); ctx.fill();
      // Body
      var grad = ctx.createRadialGradient(px - 4, py - 4, 1, px, py, s);
      grad.addColorStop(0, "#4a4a4a");
      grad.addColorStop(1, "#0c0c0c");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(px, py, s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255, 100, 50, " + (0.4 + 0.5 * pulse * (1 - fuseT)) + ")";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Fuse spark
      ctx.fillStyle = "rgba(255, 200, 80, 0.85)";
      var fx = px + s * 0.6 * Math.cos(state.time * 6);
      var fy = py - s - 5;
      ctx.beginPath(); ctx.arc(fx, fy, 3 * (0.6 + pulse * 0.5), 0, Math.PI * 2); ctx.fill();
      // Stem
      ctx.strokeStyle = "rgba(120, 80, 40, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py - s * 0.85);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }
  }

  function drawExplosions() {
    var go = state.boardOrigin;
    for (var i = 0; i < state.explosions.length; i++) {
      var e = state.explosions[i];
      var t = Math.max(0, e.life / e.totalLife);
      for (var c = 0; c < e.cells.length; c++) {
        var cell = e.cells[c];
        var px = go.ox + cell.x * go.tilePx;
        var py = go.oy + cell.y * go.tilePx;
        var s = go.tilePx;
        var alpha = Math.min(1, t * 1.5);
        // Outer
        ctx.fillStyle = "rgba(255, 160, 60, " + (0.8 * alpha) + ")";
        ctx.fillRect(px + 2, py + 2, s - 4, s - 4);
        // Mid
        ctx.fillStyle = "rgba(255, 200, 100, " + (0.7 * alpha) + ")";
        ctx.fillRect(px + 6, py + 6, s - 12, s - 12);
        // Core
        ctx.fillStyle = "rgba(255, 240, 200, " + (0.85 * alpha) + ")";
        ctx.fillRect(px + 10, py + 10, s - 20, s - 20);
        // Random spark in cell
        if (alpha > 0.4) {
          ctx.fillStyle = "rgba(255, 80, 40, " + (0.9 * alpha) + ")";
          var sx = px + 4 + Math.random() * (s - 8);
          var sy = py + 4 + Math.random() * (s - 8);
          ctx.fillRect(sx, sy, 2, 2);
        }
      }
    }
  }

  function drawEnemies() {
    var go = state.boardOrigin;
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      var px = go.ox + e.x * go.tilePx;
      var py = go.oy + e.y * go.tilePx;
      var s = go.tilePx * 0.4;
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath(); ctx.ellipse(px, py + s * 0.7, s * 0.85, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      var col;
      var sizeMul = 1.0;
      if (e.type === E_WANDERER) col = "#d04848";
      else if (e.type === E_HUNTER) col = "#a991ff";
      else if (e.type === E_GHOST) { col = "rgba(173, 216, 250, 0.55)"; sizeMul = 1.0; }
      else if (e.type === E_BOSS) { col = "#f04860"; sizeMul = 1.7; }
      else if (e.type === E_MINION) { col = "#f08060"; sizeMul = 0.8; }
      else col = "#d04848";
      var rs = s * sizeMul;
      // Body
      var grad = ctx.createRadialGradient(px - 4, py - 4, 1, px, py, rs);
      grad.addColorStop(0, "#fff5d8");
      grad.addColorStop(1, col);
      ctx.fillStyle = grad;
      ctx.beginPath();
      // Pulse for boss
      if (e.type === E_BOSS) {
        var bp = 0.5 + 0.5 * Math.sin(state.time * 5);
        ctx.arc(px, py, rs * (0.95 + 0.10 * bp), 0, Math.PI * 2);
      } else {
        ctx.arc(px, py, rs * 0.95, 0, Math.PI * 2);
      }
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(px - rs * 0.3, py - rs * 0.15, rs * 0.18, 0, Math.PI * 2);
      ctx.arc(px + rs * 0.3, py - rs * 0.15, rs * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a0c08";
      ctx.beginPath();
      ctx.arc(px - rs * 0.3, py - rs * 0.15, rs * 0.08, 0, Math.PI * 2);
      ctx.arc(px + rs * 0.3, py - rs * 0.15, rs * 0.08, 0, Math.PI * 2);
      ctx.fill();
      // Border
      ctx.strokeStyle = "rgba(20, 8, 4, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, rs * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      // HP indicator for stronger enemies
      if (e.hp > 1) {
        ctx.fillStyle = "rgba(255, 200, 80, 0.85)";
        ctx.font = "bold " + Math.floor(rs * 0.6) + "px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(e.hp), px, py + rs * 0.5 + 4);
      }
      // Ghost: dashed outline
      if (e.type === E_GHOST) {
        ctx.strokeStyle = "rgba(180, 220, 255, 0.5)";
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, rs * 1.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  function drawPlayer() {
    var go = state.boardOrigin;
    var p = state.player;
    var px = go.ox + p.x * go.tilePx;
    var py = go.oy + p.y * go.tilePx;
    var s = go.tilePx * 0.36;
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(px, py + s * 0.85, s * 0.95, s * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    // Invuln flash
    var alpha = (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) ? 0.35 : 1.0;
    ctx.globalAlpha = alpha;
    // Cape
    var grad = ctx.createRadialGradient(px - 4, py - 4, 1, px, py, s);
    grad.addColorStop(0, "#fff5d8");
    grad.addColorStop(1, "#5de0f0");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(px, py, s, 0, Math.PI * 2); ctx.fill();
    // Helmet
    ctx.fillStyle = "#2a4880";
    ctx.beginPath(); ctx.arc(px, py - s * 0.25, s * 0.7, 0, Math.PI * 2); ctx.fill();
    // Visor / face
    ctx.fillStyle = "#fff";
    var ex1 = px - s * 0.25, ey = py - s * 0.2;
    var ex2 = px + s * 0.25;
    ctx.beginPath();
    ctx.arc(ex1, ey, s * 0.18, 0, Math.PI * 2);
    ctx.arc(ex2, ey, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0c08";
    var pupilOff = 0;
    if (p.facing === "left") pupilOff = -s * 0.06;
    else if (p.facing === "right") pupilOff = s * 0.06;
    ctx.beginPath();
    ctx.arc(ex1 + pupilOff, ey, s * 0.08, 0, Math.PI * 2);
    ctx.arc(ex2 + pupilOff, ey, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Border
    ctx.strokeStyle = "rgba(20, 8, 4, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py, s, 0, Math.PI * 2); ctx.stroke();
    // Shield aura
    if (state.shieldArmed) {
      ctx.strokeStyle = "rgba(93, 224, 240, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, s * 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(93, 224, 240, 0.4)";
      ctx.beginPath(); ctx.arc(px, py, s * 1.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
    if (dom.hudLevel) dom.hudLevel.textContent = String(state.map);
    if (dom.hudBombs) dom.hudBombs.textContent = String(state.maxBombs);
    if (dom.hudRange) dom.hudRange.textContent = String(state.explosionRange);
    if (dom.hudBest) dom.hudBest.textContent = state.best > 0 ? formatNumber(state.best) : "—";
    if (dom.goalName) {
      if (state.exitRevealed) {
        dom.goalName.textContent = "Reach the exit";
      } else {
        dom.goalName.textContent = "Find the hidden exit";
      }
    }
    if (dom.goalMeta) {
      var bits = [];
      bits.push("Map " + state.map);
      bits.push("Enemies " + state.enemies.length);
      var t = Math.max(0, Math.ceil(state.timeLeft));
      bits.push("Time " + t);
      if (state.shieldArmed) bits.push("SHIELD");
      if (state.kickAbility) bits.push("KICK");
      dom.goalMeta.textContent = bits.join(" · ");
    }
    if (dom.hudLives) {
      var cell = dom.hudLives.parentElement;
      if (cell) cell.classList.toggle("is-danger", state.lives <= 1);
    }
  }
  function updatePowerupSlots() {
    if (!state) return;
    if (dom.puBombs) {
      var glyph = dom.puBombs.querySelector(".pu-glyph");
      if (glyph) glyph.textContent = String(state.maxBombs);
      dom.puBombs.classList.toggle("is-active", state.maxBombs > BOMB_LIMIT_INIT);
    }
    if (dom.puRange) {
      var g2 = dom.puRange.querySelector(".pu-glyph");
      if (g2) g2.textContent = String(state.explosionRange);
      dom.puRange.classList.toggle("is-active", state.explosionRange > EXPLOSION_RANGE_INIT);
    }
    if (dom.puSpeed) {
      dom.puSpeed.classList.toggle("is-active", state.moveSpeed > SPEED_INIT);
    }
    if (dom.puShield) {
      dom.puShield.classList.toggle("is-shield", state.shieldArmed);
    }
    if (dom.puKick) {
      dom.puKick.classList.toggle("is-kick", state.kickAbility);
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

  function openScholarQuestion(cell) {
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Wall · Optional · +1500 + 12 shards · Reveals exit";
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
      dom.explanation.textContent = "Decoded! +1500 plus 12 shards. Exit revealed.";
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
    setTimeout(function () { closeQuestion(correct); }, 1200);
  }
  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += 1500;
      addShards(12);
      // Auto-reveal exit
      if (!state.exitRevealed && state.board.exitPos) {
        var ep = state.board.exitPos;
        if (state.board.tiles[ep.y][ep.x] === T_SOFT) {
          state.board.tiles[ep.y][ep.x] = T_EXIT;
        } else if (state.board.tiles[ep.y][ep.x] === T_FLOOR) {
          state.board.tiles[ep.y][ep.x] = T_EXIT;
        }
        state.exitRevealed = true;
        sfx.exit_open();
        pushPopup("EXIT REVEALED", LOGICAL_W / 2, 100, "is-emerald");
      }
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5b04a", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+1500 SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
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
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 250));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Archive Burned You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Bomb Scribe · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Maps Cleared</div><div class="end-cell-value">' + state.mapsCleared + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Enemies Defeated</div><div class="end-cell-value">' + formatNumber(state.enemiesDefeated) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Bombs Placed</div><div class="end-cell-value">' + formatNumber(state.bombsPlaced) + '</div></div>',
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
  function addShards(n, reasonOverride) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, reasonOverride || (GAME_ID + "-scholar-correct"));
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          map: state.maxMapReached,
          enemies: state.enemiesDefeated,
          bombs: state.bombsPlaced
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
          map: state.map,
          lives: state.lives,
          enemiesDefeated: state.enemiesDefeated,
          maxBombs: state.maxBombs,
          explosionRange: state.explosionRange,
          moveSpeed: state.moveSpeed,
          shieldArmed: state.shieldArmed,
          kickAbility: state.kickAbility,
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
          file: "games/bomb-scribe/index.html"
        };
        if (extra && typeof extra === "object") {
          if (extra.score != null) payload.score = extra.score;
          if (extra.durationMs != null) payload.durationMs = extra.durationMs;
          if (extra.map != null) payload.level = extra.map;
        }
        window.MrMacsProfile.recordPlay(payload);
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("bomb-scribe:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("bomb-scribe:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  var runStartTs = 0;
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
      if (e.repeat && (k === " " || k === "Spacebar")) return;
      if (phase === "playing") {
        if (k === "ArrowUp" || k === "w" || k === "W")    { setMoveKey("up", true); e.preventDefault(); return; }
        if (k === "ArrowDown" || k === "s" || k === "S")  { setMoveKey("down", true); e.preventDefault(); return; }
        if (k === "ArrowLeft" || k === "a" || k === "A")  { setMoveKey("left", true); e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { setMoveKey("right", true); e.preventDefault(); return; }
        if (k === " " || k === "Spacebar" || k === "x" || k === "X") { pendingBomb = true; e.preventDefault(); return; }
        if (k === "r" || k === "R") { tryReset(); e.preventDefault(); return; }
        if (k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause(); e.preventDefault(); return;
        }
      }
      if (phase === "paused" && (k === "p" || k === "P")) {
        togglePause(); e.preventDefault(); return;
      }
      if (k === "Escape" || k === "Esc") {
        if (phase === "playing" || phase === "paused") togglePause();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
      }
    });
    document.addEventListener("keyup", function (e) {
      var k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") setMoveKey("up", false);
      else if (k === "ArrowDown" || k === "s" || k === "S") setMoveKey("down", false);
      else if (k === "ArrowLeft" || k === "a" || k === "A") setMoveKey("left", false);
      else if (k === "ArrowRight" || k === "d" || k === "D") setMoveKey("right", false);
    });
    bindCanvasInput();
    bindTouchControls();
  }

  function bindCanvasInput() {
    var touchStart = null;
    var lastSwipeTs = 0;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (e.touches && e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      if (phase !== "playing" || !touchStart) return;
      var t2 = e.changedTouches && e.changedTouches[0];
      if (!t2) { touchStart = null; return; }
      var dx = t2.clientX - touchStart.x;
      var dy = t2.clientY - touchStart.y;
      var dt = performance.now() - touchStart.t;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      var SWIPE = 24;
      if (ax < SWIPE && ay < SWIPE && dt < 250) {
        // Tap: drop bomb
        pendingBomb = true;
      } else {
        // Swipe: queue movement key briefly
        var dir = (ax > ay) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
        // Pulse: press for 220ms
        clearAllKeys();
        setMoveKey(dir, true);
        lastSwipeTs = performance.now();
        setTimeout(function () {
          // Release if no other input has arrived since
          if (performance.now() - lastSwipeTs >= 200) setMoveKey(dir, false);
        }, 220);
      }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });

    // Tap (mouse) drops bomb on the player tile if clicked on player; otherwise step toward click
    canvas.addEventListener("click", function (e) {
      if (phase !== "playing") return;
      var pos = canvasToTile(e.clientX, e.clientY);
      if (!pos) return;
      var p = state.player;
      if (pos.x === p.gx && pos.y === p.gy) {
        pendingBomb = true;
        return;
      }
      var dxx = pos.x - p.gx, dyy = pos.y - p.gy;
      // For desktop mice, treat single click as one-step toward target axis
      var dir;
      if (Math.abs(dxx) > Math.abs(dyy)) dir = dxx > 0 ? "right" : "left";
      else dir = dyy > 0 ? "down" : "up";
      clearAllKeys();
      setMoveKey(dir, true);
      setTimeout(function () { setMoveKey(dir, false); }, 200);
    });
  }
  function clearAllKeys() {
    keys.up = keys.down = keys.left = keys.right = false;
  }
  function canvasToTile(clientX, clientY) {
    if (!state) return null;
    var rect = canvas.getBoundingClientRect();
    var lx = (clientX - rect.left - offsetX) / scale;
    var ly = (clientY - rect.top - offsetY) / scale;
    var go = state.boardOrigin;
    var tx = Math.floor((lx - go.ox) / go.tilePx);
    var ty = Math.floor((ly - go.oy) / go.tilePx);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return null;
    return { x: tx, y: ty };
  }

  function bindTouchControls() {
    function pressBtn(btn, downFn, upFn) {
      if (!btn) return;
      var press = function (e) { if (e) e.preventDefault(); downFn(); };
      var release = function (e) { if (e) e.preventDefault(); if (upFn) upFn(); };
      btn.addEventListener("touchstart", press, { passive: false });
      btn.addEventListener("touchend", release, { passive: false });
      btn.addEventListener("touchcancel", release, { passive: false });
      btn.addEventListener("mousedown", press);
      btn.addEventListener("mouseup", release);
      btn.addEventListener("mouseleave", release);
      btn.addEventListener("click", function (e) { e.preventDefault(); });
    }
    pressBtn(dom.tcUp,
      function () { setMoveKey("up", true); },
      function () { setMoveKey("up", false); });
    pressBtn(dom.tcDown,
      function () { setMoveKey("down", true); },
      function () { setMoveKey("down", false); });
    pressBtn(dom.tcLeft,
      function () { setMoveKey("left", true); },
      function () { setMoveKey("left", false); });
    pressBtn(dom.tcRight,
      function () { setMoveKey("right", true); },
      function () { setMoveKey("right", false); });
    pressBtn(dom.tcBomb,
      function () { pendingBomb = true; },
      null);
    pressBtn(dom.tcReset,
      function () { tryReset(); },
      null);
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

  // -- Reset (current map) ---------------------------------------------------
  function tryReset() {
    if (phase !== "playing" && phase !== "paused") return;
    clearAllKeys();
    var carry = {
      map: state.map,
      score: state.score,
      lives: state.lives,
      shardsAwarded: state.shardsAwarded,
      questionsAnsweredCorrect: state.questionsAnsweredCorrect,
      questionsAnsweredTotal: state.questionsAnsweredTotal,
      best: state.best,
      mapsCleared: state.mapsCleared,
      enemiesDefeated: state.enemiesDefeated,
      bombsPlaced: state.bombsPlaced,
      maxMapReached: state.maxMapReached,
      maxBombs: state.maxBombs,
      explosionRange: state.explosionRange,
      moveSpeed: state.moveSpeed,
      shieldArmed: state.shieldArmed,
      kickAbility: state.kickAbility
    };
    initState(carry);
    phase = "playing";
    updateHud();
    updatePowerupSlots();
  }

  // -- UI bindings -----------------------------------------------------------
  function bindUi() {
    dom.startBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.resumeBtn.addEventListener("click", togglePause);
    dom.restartBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.pauseExitBtn.addEventListener("click", exitToArcade);
    dom.exitBtn.addEventListener("click", exitToArcade);
    dom.pauseBtn.addEventListener("click", togglePause);
    dom.bombBtn.addEventListener("click", function () { if (phase === "playing") pendingBomb = true; });
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
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("bomb-scribe");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "bomb-scribe", { compact: false });
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

  // ── Help overlay ───────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      window.MrMacsHelpOverlay.register("bomb-scribe", {
        title: "How to Play Bomb Scribe",
        goal: "Clear every map by bombing all soft walls and enemies, reach the exit, and answer scholar challenges along the way.",
        controls: [
          { key: "↑ ↓ ← →  /  WASD", action: "Move your character" },
          { key: "Space / X",         action: "Drop a bomb" },
          { key: "Esc / P",           action: "Pause" }
        ],
        tips: [
          "Bombs explode in a cross pattern — step out of the blast radius before the 3-second fuse triggers.",
          "Bomb-Up power-ups let you carry and place more bombs simultaneously.",
          "The exit tile is hidden under a soft wall — blow up every block to uncover it."
        ],
        scholar: "One soft wall per map hides a Scholar Wall (glowing). Destroy it to trigger a review challenge — answer correctly to clear nearby walls and earn bonus shards."
      });
      var _helpSetupActions = document.querySelector("#setupScreen .setup-actions");
      if (_helpSetupActions) window.MrMacsHelpOverlay.mountButton(_helpSetupActions, "bomb-scribe");
    }
  } catch (e) {}
  }

  function exitToArcade() {
    stopMusic();
    saveSnapshot();
    if (state && runStartTs) {
      recordPlayWithProfile({
        score: state.score,
        durationMs: Date.now() - runStartTs,
        map: state.maxMapReached
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
      map: s.map || 1,
      lives: s.lives != null ? s.lives : LIVES_INIT,
      enemiesDefeated: s.enemiesDefeated || 0,
      maxBombs: s.maxBombs || BOMB_LIMIT_INIT,
      explosionRange: s.explosionRange || EXPLOSION_RANGE_INIT,
      moveSpeed: s.moveSpeed || SPEED_INIT,
      shieldArmed: !!s.shieldArmed,
      kickAbility: !!s.kickAbility,
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
    if (snap && snap.state && (snap.state.score || (snap.state.map && snap.state.map > 1)) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Map ' + (snap.state.map || 1) +
        ' &middot; Enemies ' + (snap.state.enemiesDefeated || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Bomb Scribe Scores</div>';
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
        updatePlayer(dt);
        updateBombs(dt);
        updateExplosions(dt);
        updateEnemies(dt);
        updateTime(dt);
        checkExit();
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
      }
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "mapClear" || phase === "paused" || phase === "bossIntro") {
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
    var GAME_ID_LOCAL = "bomb-scribe";
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
