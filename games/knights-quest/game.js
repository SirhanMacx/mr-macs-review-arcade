/* ===========================================================================
   Knight's Quest — Rogue-lite dungeon crawler · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · 18x18 grid @ 40px tiles
   Procedural rooms · 5 enemy types · floor 5 boss · scholar relics trigger review.
   Game first; review optional for legendary upgrades.
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "knights-quest";
  var GAME_TITLE = "Knight's Quest";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  // Grid
  var GRID = 18;
  var CELL = 40; // 18 * 40 = 720

  // Tile types
  var T_FLOOR = 0;
  var T_WALL  = 1;
  var T_DOOR  = 2;
  var T_DOOR_LOCKED = 3;
  var T_STAIRS = 4;

  // Player
  var PLAYER_HP_INIT = 3;
  var PLAYER_MOVE_MS = 180;       // ms per cell
  var PLAYER_ATK_INIT = 1;
  var ATTACK_COOLDOWN_MS = 280;
  var ATTACK_FLASH_MS = 220;
  var BLOCK_FLASH_MS = 280;
  var BLOCK_COOLDOWN_MS = 600;
  var INVULN_MS = 700;
  var DEATH_DELAY_MS = 1100;

  // Floors
  var FLOORS_PER_RUN = 5;
  var ROOMS_MIN = 5;
  var ROOMS_MAX = 8;

  // Enemies & combat
  var ENEMY_MOVE_MS_BASE = 460;    // goblin base; tuned per type
  var SKELE_BONE_MS = 1700;        // ranged cooldown
  var BONE_SPEED = 6.5;            // px/frame at logical 60fps; we use dt
  var WRAITH_PHASE_MS_ON = 2200;
  var WRAITH_PHASE_MS_OFF = 2000;
  var BOSS_HP = 15;

  // Scoring
  var SCORE_ENEMY_KILL = 80;
  var SCORE_BOSS_PHASE = 600;
  var SCORE_BOSS_DEFEAT = 5000;
  var SCORE_FLOOR_CLEAR = 1500;
  var SCORE_RELIC_PICKUP = 200;
  var SCORE_CHEST_OPEN = 250;
  var SCORE_KEY_PICKUP = 50;
  var SCORE_POTION_PICKUP = 80;
  var SCORE_SCHOLAR_CORRECT = 1500;
  var BONUS_LIFE_THRESHOLD = 12000;
  var SHARDS_CAP = 200;
  var LIVES_INIT = 3;

  // Loot rates
  var SCHOLAR_RELIC_PER_FLOOR = 1;
  var POTION_PER_FLOOR_MIN = 1;
  var POTION_PER_FLOOR_MAX = 2;
  var KEY_DROP_RATE_FROM_KILL = 0.10;
  var POWERUP_DROP_RATE_FROM_KILL = 0.06;

  // Power-up types
  var POWERUP_TYPES = ["shield", "berserk", "heal", "loot", "bomb"];
  var POWERUP_META = {
    shield:  { glyph: "S", color: "#aae0f0", glow: "#5db8e0", label: "SHIELD AURA",   long: "Shield Aura" },
    berserk: { glyph: "B", color: "#ff8848", glow: "#d04848", label: "BERSERKER",     long: "Berserker (2x ATK)" },
    heal:    { glyph: "H", color: "#7be07b", glow: "#4dd49b", label: "HEAL POTION",   long: "Heal Potion" },
    loot:    { glyph: "L", color: "#f5c451", glow: "#f0d068", label: "LOOT DOUBLER",  long: "Loot Doubler" },
    bomb:    { glyph: "X", color: "#f07bb8", glow: "#d04848", label: "BOMB",          long: "Bomb (3x3)" }
  };

  // Relics (passive; legendary tier from scholar review correctness)
  var RELIC_DEFS = [
    { id: "ironheart",   name: "Ironheart Pendant",     bonus: { hpMax: 1 },             legend: { hpMax: 2 } },
    { id: "sharpedge",   name: "Sharp-Edge Charm",      bonus: { atk: 1 },               legend: { atk: 2 } },
    { id: "swiftboots",  name: "Swift Boots",           bonus: { moveMs: -20 },          legend: { moveMs: -45 } },
    { id: "trueaim",     name: "True-Aim Sigil",        bonus: { atkRange: 1 },          legend: { atkRange: 1, atk: 1 } },
    { id: "wardstone",   name: "Wardstone Pendant",     bonus: { blockBonus: 1 },        legend: { blockBonus: 2 } },
    { id: "luckcharm",   name: "Lucky Coin",            bonus: { lootChance: 0.05 },     legend: { lootChance: 0.12 } },
    { id: "venomtooth",  name: "Venom Tooth",           bonus: { dotChance: 0.20 },      legend: { dotChance: 0.45 } },
    { id: "scholarseal", name: "Scholar's Seal",        bonus: { scholarBonus: 250 },    legend: { scholarBonus: 750 } }
  ];

  // -- Inline review bank (28 entries — matches clueCount) ------------------
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

  var phase = "setup"; // setup | playing | question | paused | ended | dying | floorClear | bossIntro
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
  var pendingScholarRelic = null;

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
    footstep: function () { sfxTone(180, 0.05, { type: "triangle", volume: 0.05, endFreq: 120 }); },
    attackSwing: function () { sfxTone(540, 0.08, { type: "square", volume: 0.10, endFreq: 320 }); },
    attackHit: function () {
      sfxNoise(0.10, { volume: 0.16, cutoff: 900 });
      sfxTone(420, 0.08, { type: "sawtooth", volume: 0.12, endFreq: 220 });
    },
    enemyDie: function () {
      sfxTone(540, 0.10, { type: "square", volume: 0.10, endFreq: 220 });
      setTimeout(function () { sfxNoise(0.15, { volume: 0.12, cutoff: 700 }); }, 60);
    },
    block: function () {
      sfxTone(880, 0.06, { type: "triangle", volume: 0.10 });
      setTimeout(function () { sfxTone(660, 0.08, { type: "triangle", volume: 0.10 }); }, 40);
    },
    scholarPickup: function () {
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
    chestOpen: function () {
      sfxTone(660, 0.06, { type: "square", volume: 0.10 });
      setTimeout(function () { sfxTone(880, 0.10, { type: "triangle", volume: 0.12 }); }, 60);
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.14 }); }, 140);
    },
    keyPickup: function () { sfxTone(1320, 0.10, { type: "triangle", volume: 0.14 }); },
    potionDrink: function () {
      sfxTone(540, 0.08, { type: "triangle", volume: 0.12 });
      setTimeout(function () { sfxTone(880, 0.12, { type: "triangle", volume: 0.14 }); }, 80);
    },
    bossIntro: function () {
      sfxNoise(0.5, { volume: 0.18, cutoff: 600 });
      sfxTone(140, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 60 });
      setTimeout(function () { sfxTone(110, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 80 }); }, 200);
    },
    bossPhase: function () {
      sfxNoise(0.3, { volume: 0.14, cutoff: 800 });
      [220, 330, 440].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "sawtooth", volume: 0.14 }); }, i * 90);
      });
    },
    lifeLost: function () {
      sfxNoise(0.30, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.4, { type: "sawtooth", volume: 0.14, endFreq: 50 });
    },
    gameOver: function () {
      sfxNoise(0.6, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.7, { type: "sawtooth", volume: 0.18, endFreq: 40 });
    },
    levelUp: function () {
      [523, 659, 784, 988, 1175, 1568, 2093].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
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
    canvas = $("knightCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudHp = $("hudHp");
    dom.hudFloor = $("hudFloor");
    dom.hudKeys = $("hudKeys");
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
    dom.tcAttack = $("tcAttack");
    dom.tcBlock = $("tcBlock");
  }

  // -- Random helpers --------------------------------------------------------
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function chance(p) { return Math.random() < p; }

  // -- Procedural dungeon generator -----------------------------------------
  // Builds a grid of rooms connected by corridors. Returns:
  //   { tiles: [GRID][GRID], rooms: [...], spawn: {x,y}, stairs: {x,y} }
  function buildFloor(floorIndex, totalFloors) {
    var tiles = [];
    for (var y = 0; y < GRID; y++) {
      tiles.push(new Array(GRID));
      for (var x = 0; x < GRID; x++) tiles[y][x] = T_WALL;
    }
    var roomCount = floorIndex >= totalFloors - 1 ? 1 : rand(ROOMS_MIN, ROOMS_MAX);
    var rooms = [];
    var attempts = 0;
    var isBossFloor = (floorIndex === totalFloors - 1);

    if (isBossFloor) {
      // Single boss arena: large central room
      var bw = 12, bh = 12;
      var bx = Math.floor((GRID - bw) / 2);
      var by = Math.floor((GRID - bh) / 2);
      carveRoom(tiles, bx, by, bw, bh);
      rooms.push({ x: bx, y: by, w: bw, h: bh, isBoss: true, cleared: false, visited: true });
    } else {
      while (rooms.length < roomCount && attempts < 80) {
        attempts++;
        var w = rand(4, 6);
        var h = rand(4, 6);
        var rx = rand(1, GRID - w - 2);
        var ry = rand(1, GRID - h - 2);
        var ok = true;
        for (var r = 0; r < rooms.length; r++) {
          var R = rooms[r];
          // Pad-1 separation
          if (rx < R.x + R.w + 1 && rx + w + 1 > R.x &&
              ry < R.y + R.h + 1 && ry + h + 1 > R.y) {
            ok = false; break;
          }
        }
        if (!ok) continue;
        carveRoom(tiles, rx, ry, w, h);
        rooms.push({ x: rx, y: ry, w: w, h: h, cleared: false, visited: false, isBoss: false });
      }
      // Connect rooms with L-shaped corridors in order
      for (var i = 1; i < rooms.length; i++) {
        carveCorridor(tiles, rooms[i - 1], rooms[i]);
      }
    }

    // Spawn = center of first room (always treat first room as visited)
    if (rooms.length === 0) {
      // Fallback: shouldn't happen; create a starter room
      carveRoom(tiles, 7, 7, 4, 4);
      rooms.push({ x: 7, y: 7, w: 4, h: 4, cleared: false, visited: true, isBoss: false });
    }
    rooms[0].visited = true;
    rooms[0].cleared = true; // first room is safe
    var spawn = roomCenter(rooms[0]);

    // Stairs in the LAST room (or boss room — combined with boss death)
    var lastRoom = rooms[rooms.length - 1];
    var stairs = null;
    if (!isBossFloor) {
      stairs = roomCenter(lastRoom);
      // Mark stairs tile
      if (inBounds(stairs.x, stairs.y) && tiles[stairs.y][stairs.x] === T_FLOOR) {
        tiles[stairs.y][stairs.x] = T_STAIRS;
      }
    }

    return {
      tiles: tiles,
      rooms: rooms,
      spawn: spawn,
      stairs: stairs,
      isBoss: isBossFloor
    };
  }

  function carveRoom(tiles, x, y, w, h) {
    for (var yy = y; yy < y + h; yy++) {
      for (var xx = x; xx < x + w; xx++) {
        if (inBounds(xx, yy)) tiles[yy][xx] = T_FLOOR;
      }
    }
  }
  function carveCorridor(tiles, a, b) {
    var ca = roomCenter(a), cb = roomCenter(b);
    var cx = ca.x, cy = ca.y;
    // Random elbow: horizontal-first or vertical-first
    if (chance(0.5)) {
      while (cx !== cb.x) {
        if (inBounds(cx, cy) && tiles[cy][cx] !== T_FLOOR) tiles[cy][cx] = T_FLOOR;
        cx += (cb.x > cx) ? 1 : -1;
      }
      while (cy !== cb.y) {
        if (inBounds(cx, cy) && tiles[cy][cx] !== T_FLOOR) tiles[cy][cx] = T_FLOOR;
        cy += (cb.y > cy) ? 1 : -1;
      }
    } else {
      while (cy !== cb.y) {
        if (inBounds(cx, cy) && tiles[cy][cx] !== T_FLOOR) tiles[cy][cx] = T_FLOOR;
        cy += (cb.y > cy) ? 1 : -1;
      }
      while (cx !== cb.x) {
        if (inBounds(cx, cy) && tiles[cy][cx] !== T_FLOOR) tiles[cy][cx] = T_FLOOR;
        cx += (cb.x > cx) ? 1 : -1;
      }
    }
  }
  function roomCenter(r) {
    return { x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2) };
  }
  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < GRID && y < GRID;
  }
  function isWalkable(x, y) {
    if (!inBounds(x, y)) return false;
    var t = state.floor.tiles[y][x];
    return t === T_FLOOR || t === T_STAIRS || t === T_DOOR;
  }

  // -- Spawn enemies & loot in floor ----------------------------------------
  function populateFloor(floor, floorIndex, totalFloors) {
    state.enemies = [];
    state.bones = [];
    state.relics = [];
    state.chests = [];
    state.keys = [];
    state.potions = [];
    state.powerups = [];
    state.boss = null;
    state.scholarRelicPlaced = false;
    state.lootDoublerHits = 0;

    if (floor.isBoss) {
      // Place boss in center of room
      var br = floor.rooms[0];
      var bc = roomCenter(br);
      state.boss = makeBoss(bc.x, bc.y);
      // Place a couple of helper enemies
      for (var i = 0; i < 2; i++) {
        var pos = randomFloorTileIn(floor, br);
        if (pos) state.enemies.push(makeEnemy("goblin", pos.x, pos.y));
      }
      return;
    }

    // For each room (skip first/spawn room): place enemies + maybe loot
    var enemyTypes = ["goblin", "skeleton", "slime", "wraith"];
    var enemyWeights = floorIndex === 0
      ? [0.6, 0.25, 0.15, 0.0]
      : floorIndex === 1
      ? [0.45, 0.30, 0.20, 0.05]
      : floorIndex === 2
      ? [0.35, 0.30, 0.20, 0.15]
      : [0.25, 0.30, 0.20, 0.25];

    for (var r = 1; r < floor.rooms.length; r++) {
      var room = floor.rooms[r];
      var enemyN = rand(2, 4);
      for (var k = 0; k < enemyN; k++) {
        var pos2 = randomFloorTileIn(floor, room);
        if (!pos2) continue;
        // Pick enemy type by weighted roll
        var tt = pickWeighted(enemyTypes, enemyWeights);
        state.enemies.push(makeEnemy(tt, pos2.x, pos2.y));
      }
      // Maybe a chest
      if (chance(0.55)) {
        var cpos = randomFloorTileIn(floor, room);
        if (cpos) state.chests.push(makeChest(cpos.x, cpos.y, chance(0.3)));
      }
    }

    // Place exactly 1 scholar relic (gold-rim) on floor — random non-spawn room
    var roomIdx = rand(1, Math.max(1, floor.rooms.length - 1));
    var sRoom = floor.rooms[roomIdx];
    var spos = randomFloorTileIn(floor, sRoom);
    if (spos) {
      state.relics.push(makeRelic(spos.x, spos.y, true)); // true = scholar
      state.scholarRelicPlaced = true;
    }
    // Plus 1-2 normal relics scattered
    var normalRelics = rand(1, 2);
    for (var n = 0; n < normalRelics; n++) {
      var nrPos = randomFloorTile(floor);
      if (nrPos && !overlapsLoot(nrPos)) state.relics.push(makeRelic(nrPos.x, nrPos.y, false));
    }
    // Potions
    var potCount = rand(POTION_PER_FLOOR_MIN, POTION_PER_FLOOR_MAX);
    for (var p = 0; p < potCount; p++) {
      var pp = randomFloorTile(floor);
      if (pp && !overlapsLoot(pp)) state.potions.push(makePotion(pp.x, pp.y));
    }
    // Keys (1 per floor minimum, more on higher floors)
    var keyCount = 1 + (floorIndex >= 2 ? 1 : 0);
    for (var ki = 0; ki < keyCount; ki++) {
      var kp = randomFloorTile(floor);
      if (kp && !overlapsLoot(kp)) state.keys.push(makeKey(kp.x, kp.y));
    }
  }

  function pickWeighted(arr, weights) {
    var total = 0;
    for (var i = 0; i < weights.length; i++) total += weights[i];
    var r = Math.random() * total;
    var acc = 0;
    for (var j = 0; j < arr.length; j++) {
      acc += weights[j];
      if (r <= acc) return arr[j];
    }
    return arr[0];
  }

  function overlapsLoot(pos) {
    // Avoid placing on spawn point
    if (state.player && state.player.tx === pos.x && state.player.ty === pos.y) return true;
    // Avoid stacked loot
    var lists = [state.relics, state.chests, state.keys, state.potions];
    for (var i = 0; i < lists.length; i++) {
      var L = lists[i];
      for (var j = 0; j < L.length; j++) {
        if (L[j].tx === pos.x && L[j].ty === pos.y) return true;
      }
    }
    return false;
  }

  function randomFloorTile(floor) {
    for (var attempts = 0; attempts < 100; attempts++) {
      var x = rand(1, GRID - 2);
      var y = rand(1, GRID - 2);
      if (floor.tiles[y][x] === T_FLOOR) {
        // Don't place on spawn or stairs
        if (floor.spawn && floor.spawn.x === x && floor.spawn.y === y) continue;
        if (floor.stairs && floor.stairs.x === x && floor.stairs.y === y) continue;
        return { x: x, y: y };
      }
    }
    return null;
  }
  function randomFloorTileIn(floor, room) {
    for (var attempts = 0; attempts < 40; attempts++) {
      var x = rand(room.x, room.x + room.w - 1);
      var y = rand(room.y, room.y + room.h - 1);
      if (floor.tiles[y][x] === T_FLOOR) {
        if (floor.spawn && floor.spawn.x === x && floor.spawn.y === y) continue;
        if (floor.stairs && floor.stairs.x === x && floor.stairs.y === y) continue;
        return { x: x, y: y };
      }
    }
    return null;
  }

  // -- Entity factories ------------------------------------------------------
  function makePlayer(spawn) {
    return {
      tx: spawn.x,
      ty: spawn.y,
      px: spawn.x * CELL + CELL / 2,
      py: spawn.y * CELL + CELL / 2,
      facing: "down",
      moving: false,
      moveT: 0,
      moveTotal: 0,
      moveFrom: { x: spawn.x * CELL + CELL / 2, y: spawn.y * CELL + CELL / 2 },
      moveTo: { x: spawn.x * CELL + CELL / 2, y: spawn.y * CELL + CELL / 2 },
      hp: PLAYER_HP_INIT,
      hpMax: PLAYER_HP_INIT,
      atk: PLAYER_ATK_INIT,
      atkRange: 1,
      atkCdT: 0,
      attackT: 0,
      blockT: 0,
      blockCdT: 0,
      invulnT: 0,
      keys: 0,
      relicsHeld: [],          // {def, legendary}
      shieldT: 0,              // shield aura duration
      berserkT: 0,
      lootDoublerCharges: 0,
      moveMs: PLAYER_MOVE_MS,
      // Misc
      animT: 0,
      dying: false,
      dyingT: 0,
      bobT: 0
    };
  }

  function makeEnemy(type, tx, ty) {
    var e = {
      type: type,
      tx: tx, ty: ty,
      px: tx * CELL + CELL / 2,
      py: ty * CELL + CELL / 2,
      moveFrom: { x: tx * CELL + CELL / 2, y: ty * CELL + CELL / 2 },
      moveTo: { x: tx * CELL + CELL / 2, y: ty * CELL + CELL / 2 },
      moving: false,
      moveT: 0,
      moveTotal: 0,
      moveCdT: 0.4 + Math.random() * 0.6,
      hp: 1,
      hpMax: 1,
      stunT: 0,
      poisonT: 0,
      hurtT: 0,
      animT: Math.random() * 4,
      facing: "down",
      dying: false,
      dyingT: 0,
      // Type-specific
      shotCdT: 1.0 + Math.random(),
      phaseT: WRAITH_PHASE_MS_OFF / 1000 * 0.5,
      phasing: false,
      splitTier: 0,
      moveMs: 0
    };
    if (type === "goblin") {
      e.hp = 1; e.hpMax = 1;
      e.moveMs = 460;
    } else if (type === "skeleton") {
      e.hp = 2; e.hpMax = 2;
      e.moveMs = 600;
    } else if (type === "slime") {
      e.hp = 1; e.hpMax = 1;
      e.moveMs = 540;
    } else if (type === "wraith") {
      e.hp = 3; e.hpMax = 3;
      e.moveMs = 420;
      e.phasing = false;
      e.phaseT = WRAITH_PHASE_MS_OFF / 1000;
    }
    return e;
  }
  function makeMiniSlime(tx, ty) {
    var e = makeEnemy("slime", tx, ty);
    e.splitTier = 1;
    e.hp = 1; e.hpMax = 1;
    e.moveMs = 480;
    return e;
  }

  function makeBoss(tx, ty) {
    return {
      tx: tx, ty: ty,
      px: tx * CELL + CELL / 2,
      py: ty * CELL + CELL / 2,
      moveFrom: { x: tx * CELL + CELL / 2, y: ty * CELL + CELL / 2 },
      moveTo: { x: tx * CELL + CELL / 2, y: ty * CELL + CELL / 2 },
      moveT: 0, moveTotal: 0, moving: false, moveCdT: 1.5,
      hp: BOSS_HP, hpMax: BOSS_HP,
      stunT: 0, hurtT: 0, dying: false, dyingT: 0,
      animT: 0,
      phase: 1,                 // 1 (HP > 10), 2 (HP 5-10), 3 (HP < 5)
      phaseT: 0,
      attackPattern: "wander",  // wander, charge, summon, blast
      attackCdT: 2.0,
      summonCdT: 5.0,
      chargeDir: null,
      chargeT: 0,
      moveMs: 380
    };
  }

  function makeRelic(tx, ty, isScholar) {
    var def = pick(RELIC_DEFS);
    return {
      tx: tx, ty: ty,
      px: tx * CELL + CELL / 2,
      py: ty * CELL + CELL / 2,
      def: def,
      isScholar: !!isScholar,
      legendary: false,
      bobT: Math.random() * Math.PI * 2,
      collected: false
    };
  }
  function makeChest(tx, ty, locked) {
    return {
      tx: tx, ty: ty,
      px: tx * CELL + CELL / 2,
      py: ty * CELL + CELL / 2,
      locked: !!locked,
      open: false,
      bobT: Math.random() * Math.PI * 2
    };
  }
  function makeKey(tx, ty) {
    return {
      tx: tx, ty: ty,
      px: tx * CELL + CELL / 2,
      py: ty * CELL + CELL / 2,
      bobT: Math.random() * Math.PI * 2
    };
  }
  function makePotion(tx, ty) {
    return {
      tx: tx, ty: ty,
      px: tx * CELL + CELL / 2,
      py: ty * CELL + CELL / 2,
      bobT: Math.random() * Math.PI * 2
    };
  }
  function makePowerup(tx, ty, type) {
    return {
      tx: tx, ty: ty,
      px: tx * CELL + CELL / 2,
      py: ty * CELL + CELL / 2,
      type: type,
      bobT: Math.random() * Math.PI * 2,
      life: 14.0
    };
  }
  function makeBone(px, py, dirX, dirY) {
    return {
      x: px, y: py,
      vx: dirX * 220,
      vy: dirY * 220,
      life: 2.5,
      rot: 0
    };
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var floorIndex = opts.floorIndex || 0;
    var floor = buildFloor(floorIndex, FLOORS_PER_RUN);
    var startScore = opts.score || 0;
    var startLives = opts.lives != null ? opts.lives : LIVES_INIT;
    var pl = makePlayer(floor.spawn);
    if (opts.carryPlayer) {
      // Preserve relics, hp, atk, etc. across floors
      var c = opts.carryPlayer;
      pl.hpMax = c.hpMax + 1; // +1 per floor
      pl.hp = pl.hpMax;
      pl.atk = c.atk;
      pl.atkRange = c.atkRange;
      pl.relicsHeld = c.relicsHeld || [];
      pl.keys = c.keys || 0;
      pl.moveMs = c.moveMs;
      // Reapply relic bonuses (already baked into c stats)
    }
    state = {
      floorIndex: floorIndex,
      maxFloorIndex: opts.maxFloorIndex != null ? opts.maxFloorIndex : floorIndex,
      score: startScore,
      lives: startLives,
      floor: floor,
      enemies: [],
      bones: [],
      relics: [],
      chests: [],
      keys: [],
      potions: [],
      powerups: [],
      particles: [],
      embers: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      bgStars: opts.bgStars || generateStars(),
      // stats
      enemiesKilled: opts.enemiesKilled || 0,
      relicsCollected: opts.relicsCollected || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      floorsCleared: opts.floorsCleared || 0,
      bossDefeats: opts.bossDefeats || 0,
      best: opts.best || readBest(),
      time: 0,
      player: pl,
      boss: null,
      scholarRelicPlaced: false,
      lootDoublerHits: 0,
      endReason: ""
    };
    populateFloor(floor, floorIndex, FLOORS_PER_RUN);
    // Apply relic bonuses from carried relics
    if (opts.carryPlayer && opts.carryPlayer.relicsHeld) {
      // re-apply for consistency, but stats were carried. Skip re-applying additive bonuses.
    }
  }

  function generateStars() {
    var stars = [];
    for (var i = 0; i < 40; i++) {
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

  // -- Input state -----------------------------------------------------------
  var keys = { left: false, right: false, up: false, down: false, attackQueued: false, blockHeld: false };

  // -- Player update ---------------------------------------------------------
  function updatePlayer(dt) {
    var p = state.player;
    if (!p || p.dying) {
      if (p && p.dying) {
        p.dyingT += dt * 1.4;
      }
      return;
    }
    p.animT += dt;
    p.bobT += dt * 6;

    // Decay timers
    if (p.atkCdT > 0) p.atkCdT = Math.max(0, p.atkCdT - dt);
    if (p.attackT > 0) p.attackT = Math.max(0, p.attackT - dt);
    if (p.blockT > 0) p.blockT = Math.max(0, p.blockT - dt);
    if (p.blockCdT > 0) p.blockCdT = Math.max(0, p.blockCdT - dt);
    if (p.invulnT > 0) p.invulnT = Math.max(0, p.invulnT - dt);
    if (p.shieldT > 0) p.shieldT = Math.max(0, p.shieldT - dt);
    if (p.berserkT > 0) p.berserkT = Math.max(0, p.berserkT - dt);

    // Block (Shift) — short window granting damage immunity
    if (keys.blockHeld && p.blockCdT <= 0 && p.blockT <= 0) {
      p.blockT = BLOCK_FLASH_MS / 1000;
      p.blockCdT = BLOCK_COOLDOWN_MS / 1000;
      sfx.block();
    }

    // Attack queue: trigger if cooldown done. Attacks are allowed mid-step.
    if (keys.attackQueued && p.atkCdT <= 0) {
      keys.attackQueued = false;
      doAttack(p);
    } else if (p.atkCdT > 0) {
      // Drop the queue if it lingers more than one cooldown
      keys.attackQueued = false;
    }

    // Movement: if not currently moving, accept new direction
    if (!p.moving) {
      var dx = 0, dy = 0;
      if (keys.left) { dx = -1; p.facing = "left"; }
      else if (keys.right) { dx = 1; p.facing = "right"; }
      else if (keys.up) { dy = -1; p.facing = "up"; }
      else if (keys.down) { dy = 1; p.facing = "down"; }
      if (dx !== 0 || dy !== 0) {
        var ntx = p.tx + dx;
        var nty = p.ty + dy;
        if (canPlayerMoveTo(ntx, nty)) {
          startMove(p, ntx, nty);
          if (chance(0.3)) sfx.footstep();
        }
      }
    }

    // Continue current move
    if (p.moving) {
      p.moveT += dt;
      var t = Math.min(1, p.moveT / Math.max(0.001, p.moveTotal));
      // Easing: ease-out
      var te = 1 - Math.pow(1 - t, 2.2);
      p.px = p.moveFrom.x + (p.moveTo.x - p.moveFrom.x) * te;
      p.py = p.moveFrom.y + (p.moveTo.y - p.moveFrom.y) * te;
      if (t >= 1) {
        p.moving = false;
        p.px = p.moveTo.x;
        p.py = p.moveTo.y;
        p.tx = Math.round((p.px - CELL / 2) / CELL);
        p.ty = Math.round((p.py - CELL / 2) / CELL);
        // On arrival: pickups
        onPlayerArrived(p);
      }
    }
  }

  function canPlayerMoveTo(tx, ty) {
    if (!inBounds(tx, ty)) return false;
    var t = state.floor.tiles[ty][tx];
    if (t === T_WALL) return false;
    // Locked door: requires key
    if (t === T_DOOR_LOCKED) return false;
    // Don't walk into living enemies (they share tile collision is handled separately)
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.dying) continue;
      if (e.tx === tx && e.ty === ty) return false;
    }
    if (state.boss && !state.boss.dying && state.boss.tx === tx && state.boss.ty === ty) return false;
    return true;
  }

  function startMove(ent, ntx, nty) {
    ent.moveFrom = { x: ent.px, y: ent.py };
    ent.moveTo = { x: ntx * CELL + CELL / 2, y: nty * CELL + CELL / 2 };
    ent.tx = ntx;
    ent.ty = nty;
    ent.moveT = 0;
    ent.moveTotal = (ent.moveMs || PLAYER_MOVE_MS) / 1000;
    ent.moving = true;
  }

  function onPlayerArrived(p) {
    // Stairs?
    if (state.floor.tiles[p.ty][p.tx] === T_STAIRS) {
      onFloorClear();
      return;
    }
    // Pickup chests
    for (var c = state.chests.length - 1; c >= 0; c--) {
      var ch = state.chests[c];
      if (ch.tx === p.tx && ch.ty === p.ty && !ch.open) {
        if (ch.locked) {
          if (p.keys > 0) {
            p.keys--;
            ch.locked = false;
            ch.open = true;
            sfx.chestOpen();
            spawnChestLoot(ch);
            addScore(SCORE_CHEST_OPEN);
            pushPopup("+" + SCORE_CHEST_OPEN + " CHEST", ch.px, ch.py - 14, "is-bonus");
          } else {
            pushPopup("LOCKED", ch.px, ch.py - 14, "is-warn");
          }
        } else {
          ch.open = true;
          sfx.chestOpen();
          spawnChestLoot(ch);
          addScore(SCORE_CHEST_OPEN);
          pushPopup("+" + SCORE_CHEST_OPEN + " CHEST", ch.px, ch.py - 14, "is-bonus");
        }
      }
    }
    // Pickup keys
    for (var k = state.keys.length - 1; k >= 0; k--) {
      var K = state.keys[k];
      if (K.tx === p.tx && K.ty === p.ty) {
        p.keys++;
        addScore(SCORE_KEY_PICKUP);
        pushPopup("+KEY", K.px, K.py - 14, "is-bonus");
        sfx.keyPickup();
        state.keys.splice(k, 1);
      }
    }
    // Pickup potions
    for (var po = state.potions.length - 1; po >= 0; po--) {
      var P = state.potions[po];
      if (P.tx === p.tx && P.ty === p.ty) {
        p.hp = Math.min(p.hpMax, p.hp + 1);
        addScore(SCORE_POTION_PICKUP);
        pushPopup("+1 HP", P.px, P.py - 14, "is-emerald");
        sfx.potionDrink();
        state.potions.splice(po, 1);
      }
    }
    // Pickup powerups
    for (var pu = state.powerups.length - 1; pu >= 0; pu--) {
      var PU = state.powerups[pu];
      if (PU.tx === p.tx && PU.ty === p.ty) {
        applyPowerup(PU.type);
        var meta = POWERUP_META[PU.type];
        pushPopup(meta.label, PU.px, PU.py - 18, "is-bonus");
        state.powerups.splice(pu, 1);
      }
    }
    // Relics (scholar trigger optional question)
    for (var ri = state.relics.length - 1; ri >= 0; ri--) {
      var R = state.relics[ri];
      if (R.tx === p.tx && R.ty === p.ty && !R.collected) {
        if (R.isScholar) {
          // Trigger optional review modal
          pendingScholarRelic = R;
          R.collected = true;
          sfx.scholarPickup();
          openQuestion(R);
          return; // wait for player's choice
        } else {
          // Normal relic: apply bonus directly
          applyRelic(R, false);
          addScore(SCORE_RELIC_PICKUP);
          pushPopup(R.def.name, R.px, R.py - 14, "is-bonus");
          state.relics.splice(ri, 1);
        }
      }
    }
  }

  function spawnChestLoot(chest) {
    // Loot doubler doubles the chest's contents
    var doubled = state.player.lootDoublerCharges > 0;
    if (doubled) {
      state.player.lootDoublerCharges--;
      pushPopup("DOUBLE LOOT!", chest.px, chest.py - 30, "is-legend");
    }
    var rolls = doubled ? 2 : 1;
    for (var i = 0; i < rolls; i++) {
      var roll = Math.random();
      // 40% relic, 25% potion, 20% key, 15% powerup
      if (roll < 0.40) {
        var relic = makeRelic(chest.tx, chest.ty, false);
        // place adjacent if possible
        var pos = findEmptyAdjacent(chest.tx, chest.ty);
        if (pos) { relic.tx = pos.x; relic.ty = pos.y; relic.px = pos.x * CELL + CELL / 2; relic.py = pos.y * CELL + CELL / 2; }
        state.relics.push(relic);
      } else if (roll < 0.65) {
        var pos2 = findEmptyAdjacent(chest.tx, chest.ty) || { x: chest.tx, y: chest.ty };
        state.potions.push(makePotion(pos2.x, pos2.y));
      } else if (roll < 0.85) {
        var pos3 = findEmptyAdjacent(chest.tx, chest.ty) || { x: chest.tx, y: chest.ty };
        state.keys.push(makeKey(pos3.x, pos3.y));
      } else {
        var pos4 = findEmptyAdjacent(chest.tx, chest.ty) || { x: chest.tx, y: chest.ty };
        var ptype = pick(POWERUP_TYPES);
        state.powerups.push(makePowerup(pos4.x, pos4.y, ptype));
      }
    }
  }

  function findEmptyAdjacent(tx, ty) {
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
    for (var i = 0; i < dirs.length; i++) {
      var nx = tx + dirs[i][0], ny = ty + dirs[i][1];
      if (!inBounds(nx, ny)) continue;
      if (state.floor.tiles[ny][nx] !== T_FLOOR && state.floor.tiles[ny][nx] !== T_STAIRS) continue;
      // Don't overlap existing pickups
      if (overlapsLoot({ x: nx, y: ny })) continue;
      return { x: nx, y: ny };
    }
    return null;
  }

  // -- Attack ----------------------------------------------------------------
  function doAttack(p) {
    p.atkCdT = ATTACK_COOLDOWN_MS / 1000;
    p.attackT = ATTACK_FLASH_MS / 1000;
    sfx.attackSwing();
    var fx = 0, fy = 0;
    if (p.facing === "left") fx = -1;
    else if (p.facing === "right") fx = 1;
    else if (p.facing === "up") fy = -1;
    else if (p.facing === "down") fy = 1;
    var atk = p.atk * (p.berserkT > 0 ? 2 : 1);
    var hit = false;
    var range = p.atkRange || 1;
    for (var step = 1; step <= range; step++) {
      var tx = p.tx + fx * step;
      var ty = p.ty + fy * step;
      // Hit boss?
      if (state.boss && !state.boss.dying && state.boss.tx === tx && state.boss.ty === ty) {
        damageBoss(state.boss, atk);
        hit = true;
      }
      // Hit enemies on tile
      for (var i = state.enemies.length - 1; i >= 0; i--) {
        var e = state.enemies[i];
        if (e.dying) continue;
        if (e.tx === tx && e.ty === ty) {
          if (e.type === "wraith" && e.phasing) {
            // wraith phases through walls but is still hittable
          }
          damageEnemy(e, atk);
          hit = true;
        }
      }
      // Hit bones? Knock them out
      for (var b = state.bones.length - 1; b >= 0; b--) {
        var bone = state.bones[b];
        var bx = Math.round((bone.x - CELL / 2) / CELL);
        var by = Math.round((bone.y - CELL / 2) / CELL);
        if (bx === tx && by === ty) {
          state.bones.splice(b, 1);
          spawnEmber(bone.x, bone.y, 4, "#e8e0c8");
        }
      }
    }
    if (hit) sfx.attackHit();
    spawnSlashEffect(p, fx, fy);
  }

  function damageEnemy(e, atk) {
    e.hp -= atk;
    e.hurtT = 0.18;
    e.stunT = Math.max(e.stunT, 0.15);
    spawnEmber(e.px, e.py - 6, 6, "#f5c451");
    // Venom Tooth relic chance
    if (state.player.relicsHeld) {
      for (var r = 0; r < state.player.relicsHeld.length; r++) {
        var rh = state.player.relicsHeld[r];
        if (rh.def.id === "venomtooth") {
          var dotChance = rh.legendary ? rh.def.legend.dotChance : rh.def.bonus.dotChance;
          if (Math.random() < dotChance) e.poisonT = 2.0;
        }
      }
    }
    if (e.hp <= 0) {
      killEnemy(e);
    }
  }
  function damageBoss(boss, atk) {
    boss.hp -= atk;
    boss.hurtT = 0.18;
    spawnEmber(boss.px, boss.py - 8, 10, "#ff7042");
    addShake(2, 0.12);
    // Phase transitions
    var prev = boss.phase;
    if (boss.hp <= 5) boss.phase = 3;
    else if (boss.hp <= 10) boss.phase = 2;
    else boss.phase = 1;
    if (boss.phase !== prev) {
      addScore(SCORE_BOSS_PHASE);
      pushPopup("PHASE " + boss.phase, boss.px, boss.py - 30, "is-magnate");
      sfx.bossPhase();
      boss.attackPattern = "wander";
      boss.attackCdT = 1.2;
      addShake(5, 0.4);
    }
    if (boss.hp <= 0) {
      killBoss(boss);
    }
  }

  function killEnemy(e) {
    e.dying = true;
    e.dyingT = 0;
    sfx.enemyDie();
    spawnEmber(e.px, e.py, 12, "#f5c451");
    addScore(SCORE_ENEMY_KILL);
    state.enemiesKilled++;
    pushPopup("+" + SCORE_ENEMY_KILL, e.px, e.py - 14, "is-score");
    // Slime split: spawn 2 mini-slimes
    if (e.type === "slime" && e.splitTier === 0) {
      // Spawn 2 minis on adjacent tiles
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      var spawned = 0;
      for (var d = 0; d < dirs.length && spawned < 2; d++) {
        var nx = e.tx + dirs[d][0];
        var ny = e.ty + dirs[d][1];
        if (inBounds(nx, ny) && state.floor.tiles[ny][nx] === T_FLOOR && !enemyAt(nx, ny)) {
          state.enemies.push(makeMiniSlime(nx, ny));
          spawned++;
        }
      }
      if (spawned === 0) {
        // Spawn one on top
        state.enemies.push(makeMiniSlime(e.tx, e.ty));
      }
    }
    // Drop chance: keys, powerups
    var lootChance = 0;
    if (state.player.relicsHeld) {
      for (var r = 0; r < state.player.relicsHeld.length; r++) {
        var rh = state.player.relicsHeld[r];
        if (rh.def.id === "luckcharm") {
          lootChance += rh.legendary ? rh.def.legend.lootChance : rh.def.bonus.lootChance;
        }
      }
    }
    if (Math.random() < KEY_DROP_RATE_FROM_KILL + lootChance) {
      state.keys.push(makeKey(e.tx, e.ty));
    } else if (Math.random() < POWERUP_DROP_RATE_FROM_KILL + lootChance) {
      state.powerups.push(makePowerup(e.tx, e.ty, pick(POWERUP_TYPES)));
    }
  }
  function enemyAt(tx, ty) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.dying && e.tx === tx && e.ty === ty) return true;
    }
    return false;
  }

  function killBoss(boss) {
    boss.dying = true;
    boss.dyingT = 0;
    sfx.enemyDie();
    addScore(SCORE_BOSS_DEFEAT);
    state.bossDefeats++;
    pushPopup("BOSS DEFEATED! +" + SCORE_BOSS_DEFEAT, boss.px, boss.py - 30, "is-legend");
    addShake(8, 0.6);
    spawnEmber(boss.px, boss.py, 36, "#ff7042");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 60, palette: ["#f5c451", "#5db8e0", "#a991ff", "#d04848"] });
      }
    } catch (e) {}
    // Drop campaign keepsake (legendary relic)
    var keepsake = makeRelic(boss.tx, boss.ty, false);
    keepsake.legendary = true;
    state.relics.push(keepsake);
    // After delay, run complete
    setTimeout(function () {
      onRunComplete();
    }, 1800);
  }

  function spawnSlashEffect(p, fx, fy) {
    // Slash arc particle
    for (var i = 0; i < 6; i++) {
      var ang = Math.atan2(fy, fx) + (Math.random() - 0.5) * 0.8;
      var sp = 80 + Math.random() * 60;
      state.embers.push({
        x: p.px + fx * 18,
        y: p.py + fy * 18,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 20,
        life: 0.25 + Math.random() * 0.18,
        totalLife: 0.4,
        color: "#f5c451",
        r: 1.5 + Math.random() * 2
      });
    }
  }

  // -- Powerups --------------------------------------------------------------
  function applyPowerup(type) {
    var p = state.player;
    sfx.powerupPickup();
    if (type === "shield") {
      p.shieldT = 8.0;
    } else if (type === "berserk") {
      p.berserkT = 8.0;
      sfx.powerupUse();
    } else if (type === "heal") {
      p.hp = Math.min(p.hpMax, p.hp + 2);
    } else if (type === "loot") {
      p.lootDoublerCharges += 3;
    } else if (type === "bomb") {
      detonateBomb(p.tx, p.ty);
    }
  }
  function detonateBomb(cx, cy) {
    addShake(8, 0.45);
    sfx.powerupUse();
    sfxNoise(0.4, { volume: 0.22, cutoff: 600 });
    // 3x3 area
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        var tx = cx + dx, ty = cy + dy;
        if (!inBounds(tx, ty)) continue;
        // Hit enemies
        for (var i = state.enemies.length - 1; i >= 0; i--) {
          var e = state.enemies[i];
          if (!e.dying && e.tx === tx && e.ty === ty) {
            damageEnemy(e, 99);
          }
        }
        // Hit boss too
        if (state.boss && !state.boss.dying && state.boss.tx === tx && state.boss.ty === ty) {
          damageBoss(state.boss, 3);
        }
        spawnEmber(tx * CELL + CELL / 2, ty * CELL + CELL / 2, 8, "#f07bb8");
      }
    }
    pushPopup("BOMB!", cx * CELL + CELL / 2, cy * CELL + CELL / 2 - 24, "is-warn");
  }

  // -- Apply relic bonuses ---------------------------------------------------
  function applyRelic(relic, legendary) {
    var p = state.player;
    var def = relic.def;
    var bonus = legendary ? def.legend : def.bonus;
    if (bonus.hpMax) {
      p.hpMax += bonus.hpMax;
      p.hp = Math.min(p.hpMax, p.hp + bonus.hpMax);
    }
    if (bonus.atk) p.atk += bonus.atk;
    if (bonus.atkRange) p.atkRange += bonus.atkRange;
    if (bonus.moveMs) p.moveMs = Math.max(60, p.moveMs + bonus.moveMs);
    if (bonus.scholarBonus) {
      // Award a one-time score bonus on pickup
      addScore(bonus.scholarBonus);
    }
    p.relicsHeld.push({ def: def, legendary: !!legendary });
    state.relicsCollected++;
    sfx.powerupPickup();
  }

  // -- Floor / Run completion -----------------------------------------------
  function onFloorClear() {
    if (phase === "floorClear") return;
    phase = "floorClear";
    addScore(SCORE_FLOOR_CLEAR);
    state.floorsCleared++;
    pushPopup("FLOOR " + (state.floorIndex + 1) + " CLEAR!", LOGICAL_W / 2, LOGICAL_H / 2, "is-legend");
    pushPopup("+" + SCORE_FLOOR_CLEAR, LOGICAL_W / 2, LOGICAL_H / 2 + 36, "is-bonus");
    sfx.levelUp();
    addShake(4, 0.4);
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5db8e0", "#a991ff"] });
      }
    } catch (e) {}
    setTimeout(advanceFloor, 1400);
  }
  function advanceFloor() {
    var nextIdx = state.floorIndex + 1;
    if (nextIdx >= FLOORS_PER_RUN) {
      onRunComplete();
      return;
    }
    initState({
      floorIndex: nextIdx,
      maxFloorIndex: Math.max(state.maxFloorIndex, nextIdx),
      score: state.score,
      lives: state.lives,
      enemiesKilled: state.enemiesKilled,
      relicsCollected: state.relicsCollected,
      shardsAwarded: state.shardsAwarded,
      questionsAnsweredCorrect: state.questionsAnsweredCorrect,
      questionsAnsweredTotal: state.questionsAnsweredTotal,
      floorsCleared: state.floorsCleared,
      bossDefeats: state.bossDefeats,
      best: state.best,
      bgStars: state.bgStars,
      carryPlayer: state.player
    });
    phase = (state.floor.isBoss) ? "bossIntro" : "playing";
    if (state.floor.isBoss) {
      pushPopup("THE MISCONCEPTION LORD", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-magnate");
      sfx.bossIntro();
      setTimeout(function () { if (phase === "bossIntro") phase = "playing"; }, 1600);
    } else {
      pushPopup("FLOOR " + (state.floorIndex + 1), LOGICAL_W / 2, 100, "is-magnate");
    }
  }

  function onRunComplete() {
    if (phase === "ended") return;
    phase = "ended";
    sfx.gameOver();
    addShake(6, 0.4);
    var prevBest = readBest();
    if (state.score > prevBest) writeBest(state.score);
    saveSnapshot();
    setTimeout(function () { showEndScreen(true); }, 700);
  }

  function gameOver() {
    if (phase === "ended") return;
    sfx.gameOver();
    addShake(8, 0.5);
    phase = "ended";
    var prevBest = readBest();
    if (state.score > prevBest) writeBest(state.score);
    saveSnapshot();
    setTimeout(function () { showEndScreen(false); }, 700);
  }

  function showEndScreen(victory) {
    if (phase !== "ended") return;
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 250));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = victory ? "Misconception Lord Defeated" : (state.lives <= 0 ? "Knight Fallen" : "Run Ended");
    if (dom.endTitle) dom.endTitle.textContent = victory ? "Knight's Quest · The dungeon is conquered" : "Knight's Quest · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Floors Cleared</div><div class="end-cell-value">' + state.floorsCleared + '/' + FLOORS_PER_RUN + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Enemies Slain</div><div class="end-cell-value">' + formatNumber(state.enemiesKilled) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Relics Collected</div><div class="end-cell-value">' + state.relicsCollected + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    stopMusic();
  }

  // -- Enemies update -------------------------------------------------------
  function updateEnemies(dt) {
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (e.dying) {
        e.dyingT += dt * 2.4;
        if (e.dyingT > 1) state.enemies.splice(i, 1);
        continue;
      }
      e.animT += dt;
      if (e.hurtT > 0) e.hurtT = Math.max(0, e.hurtT - dt);
      if (e.stunT > 0) {
        e.stunT = Math.max(0, e.stunT - dt);
        continue;
      }
      // Poison DoT
      if (e.poisonT > 0) {
        e.poisonT = Math.max(0, e.poisonT - dt);
        if (Math.random() < dt * 0.8) {
          e.hp -= 1;
          spawnEmber(e.px, e.py, 4, "#7be07b");
          if (e.hp <= 0) { killEnemy(e); continue; }
        }
      }
      // Wraith phase toggling
      if (e.type === "wraith") {
        e.phaseT -= dt;
        if (e.phaseT <= 0) {
          e.phasing = !e.phasing;
          e.phaseT = e.phasing ? WRAITH_PHASE_MS_ON / 1000 : WRAITH_PHASE_MS_OFF / 1000;
        }
      }
      // Skeleton ranged
      if (e.type === "skeleton") {
        e.shotCdT -= dt;
        if (e.shotCdT <= 0 && hasLineOfSight(e.tx, e.ty, state.player.tx, state.player.ty)) {
          var dxs = state.player.tx - e.tx;
          var dys = state.player.ty - e.ty;
          var len = Math.sqrt(dxs * dxs + dys * dys) || 1;
          var ndx = dxs / len, ndy = dys / len;
          state.bones.push(makeBone(e.px, e.py, ndx, ndy));
          e.shotCdT = SKELE_BONE_MS / 1000 + Math.random() * 0.6;
        }
      }
      // Movement: when not moving, decide
      if (!e.moving) {
        e.moveCdT -= dt;
        if (e.moveCdT <= 0) {
          // Choose direction based on type AI
          var dir = aiNextDir(e);
          if (dir) {
            var ntx = e.tx + dir.x;
            var nty = e.ty + dir.y;
            if (canEnemyMoveTo(e, ntx, nty)) {
              startMove(e, ntx, nty);
            }
          }
          e.moveCdT = (e.moveMs / 1000) * (0.85 + Math.random() * 0.3);
        }
      }
      if (e.moving) {
        e.moveT += dt;
        var t = Math.min(1, e.moveT / Math.max(0.001, e.moveTotal));
        var te = 1 - Math.pow(1 - t, 2.0);
        e.px = e.moveFrom.x + (e.moveTo.x - e.moveFrom.x) * te;
        e.py = e.moveFrom.y + (e.moveTo.y - e.moveFrom.y) * te;
        if (t >= 1) {
          e.moving = false;
          e.px = e.moveTo.x;
          e.py = e.moveTo.y;
        }
      }
    }
  }

  function aiNextDir(e) {
    // Move toward player if nearby (within 6 tiles), else wander
    var p = state.player;
    var dx = p.tx - e.tx;
    var dy = p.ty - e.ty;
    var manhattan = Math.abs(dx) + Math.abs(dy);
    // Skeletons prefer to stay at range; if too close, retreat
    if (e.type === "skeleton" && manhattan <= 2) {
      return { x: -Math.sign(dx) || (chance(0.5) ? 1 : -1), y: -Math.sign(dy) || 0 };
    }
    if (manhattan <= 6 && chance(0.85)) {
      // chase: prefer larger axis, with random tiebreak
      if (Math.abs(dx) > Math.abs(dy)) {
        return { x: Math.sign(dx), y: 0 };
      } else if (Math.abs(dy) > Math.abs(dx)) {
        return { x: 0, y: Math.sign(dy) };
      } else {
        return chance(0.5) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
      }
    }
    // wander
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    var pick0 = dirs[Math.floor(Math.random() * 4)];
    return { x: pick0[0], y: pick0[1] };
  }
  function canEnemyMoveTo(e, ntx, nty) {
    if (!inBounds(ntx, nty)) return false;
    var t = state.floor.tiles[nty][ntx];
    // Wraith phasing through walls allowed
    if (e.type === "wraith" && e.phasing) {
      // can move through walls but not OOB
    } else {
      if (t === T_WALL || t === T_DOOR_LOCKED) return false;
    }
    // Don't stack on player or other enemies
    if (state.player && state.player.tx === ntx && state.player.ty === nty) return false;
    for (var i = 0; i < state.enemies.length; i++) {
      var o = state.enemies[i];
      if (o === e || o.dying) continue;
      if (o.tx === ntx && o.ty === nty) return false;
    }
    if (state.boss && !state.boss.dying && state.boss.tx === ntx && state.boss.ty === nty) return false;
    return true;
  }

  function hasLineOfSight(ax, ay, bx, by) {
    // Simple 4-direction LOS for ranged enemies
    if (ax === bx) {
      var step = ay < by ? 1 : -1;
      for (var y = ay + step; y !== by; y += step) {
        if (state.floor.tiles[y][ax] === T_WALL) return false;
      }
      return true;
    }
    if (ay === by) {
      var step2 = ax < bx ? 1 : -1;
      for (var x = ax + step2; x !== bx; x += step2) {
        if (state.floor.tiles[ay][x] === T_WALL) return false;
      }
      return true;
    }
    return false;
  }

  // -- Bones (skeleton projectiles) update ----------------------------------
  function updateBones(dt) {
    for (var i = state.bones.length - 1; i >= 0; i--) {
      var b = state.bones[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += dt * 12;
      if (b.life <= 0) { state.bones.splice(i, 1); continue; }
      // Wall collide
      var tx = Math.floor(b.x / CELL);
      var ty = Math.floor(b.y / CELL);
      if (!inBounds(tx, ty) || state.floor.tiles[ty][tx] === T_WALL) {
        state.bones.splice(i, 1);
        spawnEmber(b.x, b.y, 4, "#e8e0c8");
        continue;
      }
    }
  }

  // -- Boss update ----------------------------------------------------------
  function updateBoss(dt) {
    var boss = state.boss;
    if (!boss) return;
    if (boss.dying) {
      boss.dyingT += dt * 1.5;
      return;
    }
    boss.animT += dt;
    if (boss.hurtT > 0) boss.hurtT = Math.max(0, boss.hurtT - dt);
    if (boss.stunT > 0) {
      boss.stunT = Math.max(0, boss.stunT - dt);
      return;
    }
    boss.attackCdT -= dt;
    boss.summonCdT -= dt;
    if (boss.attackPattern === "charge") {
      // Charge in straight line for chargeT seconds
      boss.chargeT -= dt;
      if (!boss.moving) {
        var ntx = boss.tx + (boss.chargeDir ? boss.chargeDir.x : 0);
        var nty = boss.ty + (boss.chargeDir ? boss.chargeDir.y : 0);
        if (boss.chargeDir && canBossMoveTo(boss, ntx, nty)) {
          startMove(boss, ntx, nty);
          boss.moveTotal = 0.16; // fast
        } else {
          boss.attackPattern = "wander";
          boss.attackCdT = 1.0;
        }
      }
      if (boss.chargeT <= 0) {
        boss.attackPattern = "wander";
        boss.attackCdT = 1.2;
      }
    } else if (boss.attackPattern === "summon") {
      // Summon: emit 4 bones in cardinal directions from boss
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var d = 0; d < dirs.length; d++) {
        state.bones.push(makeBone(boss.px, boss.py, dirs[d][0], dirs[d][1]));
      }
      addShake(3, 0.18);
      sfx.bossPhase();
      boss.attackPattern = "wander";
      boss.attackCdT = 1.5;
    } else if (boss.attackPattern === "blast") {
      // Phase 3: 8-way bone burst
      for (var ang = 0; ang < 8; ang++) {
        var a = (ang / 8) * Math.PI * 2;
        state.bones.push(makeBone(boss.px, boss.py, Math.cos(a), Math.sin(a)));
      }
      addShake(5, 0.3);
      sfx.bossPhase();
      boss.attackPattern = "wander";
      boss.attackCdT = 1.4;
    } else {
      // Wander toward player
      if (!boss.moving) {
        boss.moveCdT -= dt;
        if (boss.moveCdT <= 0) {
          var dx = state.player.tx - boss.tx;
          var dy = state.player.ty - boss.ty;
          var dir;
          if (Math.abs(dx) > Math.abs(dy)) dir = { x: Math.sign(dx), y: 0 };
          else if (Math.abs(dy) > Math.abs(dx)) dir = { x: 0, y: Math.sign(dy) };
          else dir = chance(0.5) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
          var nx = boss.tx + dir.x, ny = boss.ty + dir.y;
          if (canBossMoveTo(boss, nx, ny)) startMove(boss, nx, ny);
          boss.moveCdT = boss.moveMs / 1000;
        }
      }
    }
    // Choose new attack pattern when cooldown expires
    if (boss.attackCdT <= 0 && boss.attackPattern === "wander") {
      // Phase-driven choices
      if (boss.phase === 1) {
        // 50% summon, 50% charge
        boss.attackPattern = chance(0.5) ? "summon" : "charge";
      } else if (boss.phase === 2) {
        // Mix in blast
        var roll = Math.random();
        if (roll < 0.4) boss.attackPattern = "summon";
        else if (roll < 0.75) boss.attackPattern = "charge";
        else boss.attackPattern = "blast";
      } else {
        // Phase 3: more aggressive, more blasts
        var roll2 = Math.random();
        if (roll2 < 0.25) boss.attackPattern = "summon";
        else if (roll2 < 0.55) boss.attackPattern = "charge";
        else boss.attackPattern = "blast";
      }
      if (boss.attackPattern === "charge") {
        var dxc = state.player.tx - boss.tx;
        var dyc = state.player.ty - boss.ty;
        boss.chargeDir = (Math.abs(dxc) > Math.abs(dyc))
          ? { x: Math.sign(dxc), y: 0 }
          : { x: 0, y: Math.sign(dyc) };
        boss.chargeT = 1.0;
      }
    }
    if (boss.moving) {
      boss.moveT += dt;
      var t = Math.min(1, boss.moveT / Math.max(0.001, boss.moveTotal));
      var te = 1 - Math.pow(1 - t, 2.0);
      boss.px = boss.moveFrom.x + (boss.moveTo.x - boss.moveFrom.x) * te;
      boss.py = boss.moveFrom.y + (boss.moveTo.y - boss.moveFrom.y) * te;
      if (t >= 1) {
        boss.moving = false;
        boss.px = boss.moveTo.x;
        boss.py = boss.moveTo.y;
      }
    }
  }
  function canBossMoveTo(boss, ntx, nty) {
    if (!inBounds(ntx, nty)) return false;
    var t = state.floor.tiles[nty][ntx];
    if (t === T_WALL || t === T_DOOR_LOCKED) return false;
    if (state.player && state.player.tx === ntx && state.player.ty === nty) return false;
    for (var i = 0; i < state.enemies.length; i++) {
      var o = state.enemies[i];
      if (o.dying) continue;
      if (o.tx === ntx && o.ty === nty) return false;
    }
    return true;
  }

  // -- Collisions: enemies vs player + bones ---------------------------------
  function checkCollisions() {
    var p = state.player;
    if (!p || p.dying) return;
    if (p.invulnT > 0) return; // brief immunity after hit

    // Enemies adjacent or on tile
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.dying) continue;
      if (e.tx === p.tx && e.ty === p.ty) {
        playerDamaged(1);
        return;
      }
      // Touch by adjacency only when both still
      if (!e.moving && !p.moving) {
        var ddx = Math.abs(e.tx - p.tx), ddy = Math.abs(e.ty - p.ty);
        if (ddx + ddy === 1) {
          // Goblin/slime/wraith strike on adjacency (low chance per frame to keep tactical)
          // Actually do it on contact via a small periodic check below
        }
      }
    }
    // Boss collision
    if (state.boss && !state.boss.dying) {
      if (state.boss.tx === p.tx && state.boss.ty === p.ty) {
        playerDamaged(2);
        return;
      }
    }
    // Bones
    for (var b = state.bones.length - 1; b >= 0; b--) {
      var bn = state.bones[b];
      var dx = p.px - bn.x;
      var dy = p.py - bn.y;
      if (dx * dx + dy * dy < 18 * 18) {
        playerDamaged(1);
        state.bones.splice(b, 1);
        return;
      }
    }
  }

  // Periodic adjacent strike (so still enemies aren't free hits)
  var adjStrikeAccum = 0;
  function processAdjacentEnemyStrikes(dt) {
    adjStrikeAccum += dt;
    if (adjStrikeAccum < 0.5) return;
    adjStrikeAccum = 0;
    var p = state.player;
    if (!p || p.dying || p.invulnT > 0) return;
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.dying || e.moving) continue;
      var ddx = Math.abs(e.tx - p.tx), ddy = Math.abs(e.ty - p.ty);
      if (ddx + ddy === 1) {
        // Skeletons don't melee
        if (e.type === "skeleton") continue;
        playerDamaged(1);
        return;
      }
    }
    // Boss adjacent strike
    if (state.boss && !state.boss.dying && !state.boss.moving) {
      var bx = Math.abs(state.boss.tx - p.tx), by = Math.abs(state.boss.ty - p.ty);
      if (bx + by === 1) {
        playerDamaged(2);
        return;
      }
    }
  }

  function playerDamaged(amount) {
    var p = state.player;
    if (p.dying || p.invulnT > 0) return;
    // Block window?
    if (p.blockT > 0) {
      // Block!
      p.invulnT = 0.2;
      sfx.block();
      pushPopup("BLOCK!", p.px, p.py - 22, "is-bonus");
      // Wardstone Pendant: if player has it, also damage attacker (skip attacker resolution; just popup)
      for (var r = 0; r < p.relicsHeld.length; r++) {
        if (p.relicsHeld[r].def.id === "wardstone") {
          // counter: chance to stun adjacent enemies
          var bonus = p.relicsHeld[r].legendary ? p.relicsHeld[r].def.legend.blockBonus : p.relicsHeld[r].def.bonus.blockBonus;
          stunNearbyEnemies(p.tx, p.ty, bonus * 0.35);
          break;
        }
      }
      return;
    }
    if (p.shieldT > 0) {
      // Shield aura absorbs one hit
      p.shieldT = 0;
      pushPopup("SHIELD!", p.px, p.py - 22, "is-bonus");
      sfx.block();
      p.invulnT = INVULN_MS / 1000;
      return;
    }
    p.hp -= amount;
    p.invulnT = INVULN_MS / 1000;
    sfx.attackHit();
    addShake(4, 0.3);
    pushPopup("-" + amount + " HP", p.px, p.py - 22, "is-warn");
    spawnEmber(p.px, p.py - 6, 8, "#f04860");
    if (p.hp <= 0) {
      die();
    }
  }
  function stunNearbyEnemies(tx, ty, dur) {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.dying) continue;
      var ddx = Math.abs(e.tx - tx), ddy = Math.abs(e.ty - ty);
      if (ddx + ddy <= 1) e.stunT = Math.max(e.stunT, dur);
    }
  }

  function die() {
    sfx.lifeLost();
    addShake(8, 0.6);
    state.player.dying = true;
    state.player.dyingT = 0;
    phase = "dying";
    spawnEmber(state.player.px, state.player.py, 22, "#f04860");
    setTimeout(onPlayerDeathFinish, DEATH_DELAY_MS);
  }
  function onPlayerDeathFinish() {
    if (phase !== "dying") return;
    state.lives--;
    if (state.lives <= 0) {
      gameOver();
      return;
    }
    // Rogue-lite: full reset to floor 1, fresh build
    initState({
      floorIndex: 0,
      maxFloorIndex: state.maxFloorIndex,
      score: state.score,
      lives: state.lives,
      enemiesKilled: state.enemiesKilled,
      relicsCollected: state.relicsCollected,
      shardsAwarded: state.shardsAwarded,
      questionsAnsweredCorrect: state.questionsAnsweredCorrect,
      questionsAnsweredTotal: state.questionsAnsweredTotal,
      floorsCleared: state.floorsCleared,
      bossDefeats: state.bossDefeats,
      best: state.best,
      bgStars: state.bgStars
      // do NOT carryPlayer — full reset of stats per the rogue-lite spec
    });
    phase = "playing";
    pushPopup("LIFE LOST · RESTART", LOGICAL_W / 2, 100, "is-warn");
  }

  // -- Score / lives --------------------------------------------------------
  function addScore(n) {
    state.score += n;
    var threshold = Math.floor(state.score / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    if (threshold > lastBonusLifeThreshold && threshold >= BONUS_LIFE_THRESHOLD) {
      lastBonusLifeThreshold = threshold;
      state.lives++;
      pushPopup("+1 LIFE", LOGICAL_W / 2, 80, "is-bonus");
      sfx.powerupPickup();
    }
  }

  // -- Scholar relic question modal ------------------------------------------
  function openQuestion(relic) {
    activeQuestion = INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
    prevPhase = phase;
    phase = "question";
    renderQuestion();
    pauseMusic();
    showScreen("question");
    saveSnapshot();
  }
  function renderQuestion() {
    if (!activeQuestion) return;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Relic";
    dom.questionPrompt.textContent = activeQuestion.prompt;
    dom.explanation.textContent = "";
    dom.explanation.className = "explanation";
    var letters = ["A", "B", "C", "D"];
    var choices = activeQuestion.choices.slice();
    // Fisher-Yates shuffle
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
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    btns.forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute("data-text") === activeQuestion.correctText) b.classList.add("is-correct");
      else if (b === btn) b.classList.add("is-wrong");
    });
    if (correct) {
      dom.explanation.textContent = "Decoded! +1500 plus 12 shards. Relic upgraded to LEGENDARY tier (2x bonus).";
      dom.explanation.className = "explanation is-correct";
      state.questionsAnsweredCorrect++;
      sfx.scholarCorrect();
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText + " — relic stays normal tier.";
      dom.explanation.className = "explanation is-wrong";
      sfx.scholarWrong();
    }
    state.questionsAnsweredTotal++;
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }
  function closeQuestion(wasCorrect) {
    var relic = pendingScholarRelic;
    if (relic) {
      // Apply relic: legendary if correct, normal otherwise
      applyRelic(relic, wasCorrect);
      addScore(SCORE_RELIC_PICKUP);
      // Remove relic from world
      var idx = state.relics.indexOf(relic);
      if (idx >= 0) state.relics.splice(idx, 1);
      if (wasCorrect) {
        addScore(SCORE_SCHOLAR_CORRECT);
        addShards(12, GAME_ID + "-scholar-correct");
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5db8e0", "#a991ff"] });
          }
        } catch (e) {}
        pushPopup("+" + SCORE_SCHOLAR_CORRECT + " SCHOLAR · LEGENDARY!", LOGICAL_W / 2, 90, "is-legend");
      }
    }
    activeQuestion = null;
    pendingScholarRelic = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    if (phase === "question") phase = "playing";
    showScreen(null);
    resumeMusic();
    updateHud();
  }
  function skipQuestion() {
    var relic = pendingScholarRelic;
    if (relic) {
      // Skip = keep the relic at normal tier (game first; review optional)
      applyRelic(relic, false);
      addScore(SCORE_RELIC_PICKUP);
      var idx = state.relics.indexOf(relic);
      if (idx >= 0) state.relics.splice(idx, 1);
      pushPopup("Relic kept (normal)", LOGICAL_W / 2, 100, "is-bonus");
    }
    activeQuestion = null;
    pendingScholarRelic = null;
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
  function pushPopup(text, x, y, klass) {
    state.popups.push({ text: text, x: x, y: y, klass: klass || "", life: 1.1 });
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

  // -- Render ---------------------------------------------------------------
  function render() {
    if (!ctx || !canvas) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background fill (cabinet wood / void)
    ctx.fillStyle = "#06060f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if (state && state.shake) {
      ctx.translate(state.shake.x, state.shake.y);
    }

    // Cabinet panel inside logical area
    var grad = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 3, 0, LOGICAL_W / 2, LOGICAL_H / 3, LOGICAL_W * 0.7);
    grad.addColorStop(0, "rgba(36,18,54,0.95)");
    grad.addColorStop(1, "rgba(8,4,18,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    if (!state) { ctx.restore(); return; }

    // Background stars
    drawStars();
    // Tiles
    drawTiles();
    // Loot
    drawChests();
    drawRelics();
    drawKeys();
    drawPotions();
    drawPowerups();
    // Boss
    drawBoss();
    // Enemies
    drawEnemies();
    // Bones
    drawBones();
    // Player
    drawPlayer();
    // Embers
    drawEmbers();
    // Boss HP bar overlay
    drawBossHpBar();

    ctx.restore();
  }

  function drawStars() {
    if (!state.bgStars) return;
    ctx.save();
    for (var i = 0; i < state.bgStars.length; i++) {
      var s = state.bgStars[i];
      s.twinkle += 0.016 * (s.twinkleSpeed || 1);
      var a = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(s.twinkle));
      ctx.fillStyle = "rgba(220, 200, 255," + a.toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTiles() {
    var f = state.floor;
    if (!f) return;
    for (var y = 0; y < GRID; y++) {
      for (var x = 0; x < GRID; x++) {
        var t = f.tiles[y][x];
        var px = x * CELL, py = y * CELL;
        if (t === T_WALL) {
          // Stone wall
          ctx.fillStyle = "#3a2c48";
          ctx.fillRect(px, py, CELL, CELL);
          // Brick lines
          ctx.fillStyle = "#2a1c38";
          ctx.fillRect(px, py + CELL - 4, CELL, 4);
          ctx.fillRect(px + CELL - 4, py, 4, CELL);
          // Highlight
          ctx.fillStyle = "rgba(255,255,255,.06)";
          ctx.fillRect(px + 4, py + 4, CELL - 12, 4);
        } else if (t === T_FLOOR) {
          // Floor tile
          var alt = ((x + y) & 1);
          ctx.fillStyle = alt ? "#1a0f28" : "#221536";
          ctx.fillRect(px, py, CELL, CELL);
          // Tile crack lines
          ctx.fillStyle = "rgba(0,0,0,.18)";
          ctx.fillRect(px, py + CELL - 1, CELL, 1);
          ctx.fillRect(px + CELL - 1, py, 1, CELL);
        } else if (t === T_STAIRS) {
          // Stairs glow
          ctx.fillStyle = "#221536";
          ctx.fillRect(px, py, CELL, CELL);
          // Pulse
          var pulse = 0.5 + 0.5 * Math.sin(state.time * 4);
          ctx.fillStyle = "rgba(245,196,81," + (0.25 + 0.30 * pulse).toFixed(2) + ")";
          ctx.fillRect(px + 4, py + 4, CELL - 8, CELL - 8);
          // Inner steps
          ctx.fillStyle = "#f5c451";
          ctx.fillRect(px + 10, py + 10, CELL - 20, 4);
          ctx.fillRect(px + 14, py + 18, CELL - 28, 4);
          ctx.fillRect(px + 18, py + 26, CELL - 36, 4);
        }
      }
    }
  }

  function drawPlayer() {
    var p = state.player;
    if (!p) return;
    var x = p.px, y = p.py;
    var bob = Math.sin(p.bobT) * 1.5;
    // Shield aura
    if (p.shieldT > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(93,184,224,.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 2, 22 + Math.sin(state.time * 5) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(93,184,224,.12)";
      ctx.fill();
      ctx.restore();
    }
    if (p.berserkT > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,80,68,.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 2, 19 + Math.sin(state.time * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Block flash
    if (p.blockT > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(214,220,236,.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 2, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Body — knight in armor
    if (p.dying) {
      ctx.save();
      ctx.globalAlpha = 1 - p.dyingT;
      ctx.translate(x, y + bob);
      ctx.rotate(p.dyingT * Math.PI);
      drawKnightSprite(0, 0, p.facing);
      ctx.restore();
      return;
    }
    // Invuln blink
    if (p.invulnT > 0 && Math.floor(p.invulnT * 16) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
    drawKnightSprite(x, y + bob, p.facing);
    ctx.globalAlpha = 1;
    // Slash effect
    if (p.attackT > 0) {
      drawSlashArc(p);
    }
  }
  function drawKnightSprite(x, y, facing) {
    // Pixel-art knight: silver helmet, blue tabard, gold trim
    ctx.save();
    ctx.translate(x, y);
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body — rectangular tunic
    ctx.fillStyle = "#3c4a8a";
    ctx.fillRect(-9, -2, 18, 14);
    // Belt
    ctx.fillStyle = "#1a1a26";
    ctx.fillRect(-9, 6, 18, 2);
    // Legs
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(-7, 10, 6, 6);
    ctx.fillRect(1, 10, 6, 6);
    // Boots
    ctx.fillStyle = "#1a0f08";
    ctx.fillRect(-7, 14, 6, 3);
    ctx.fillRect(1, 14, 6, 3);
    // Tabard cross
    ctx.fillStyle = "#f5c451";
    ctx.fillRect(-1, 0, 2, 10);
    ctx.fillRect(-5, 4, 10, 2);
    // Head — helmet
    ctx.fillStyle = "#a0a8b8";
    ctx.fillRect(-7, -14, 14, 12);
    ctx.fillStyle = "#c0c8d8";
    ctx.fillRect(-6, -13, 12, 3);
    // Visor slit
    ctx.fillStyle = "#100808";
    ctx.fillRect(-5, -8, 10, 3);
    // Plume
    ctx.fillStyle = "#d04848";
    ctx.fillRect(-2, -18, 4, 4);
    // Sword direction
    var sx = 0, sy = 0;
    if (facing === "right") { sx = 12; sy = -2; ctx.fillStyle = "#d6dcec"; ctx.fillRect(sx, sy, 6, 2); ctx.fillStyle = "#f5c451"; ctx.fillRect(sx - 1, sy - 1, 1, 4); }
    else if (facing === "left") { sx = -18; sy = -2; ctx.fillStyle = "#d6dcec"; ctx.fillRect(sx, sy, 6, 2); ctx.fillStyle = "#f5c451"; ctx.fillRect(sx + 6, sy - 1, 1, 4); }
    else if (facing === "up") { sx = -1; sy = -22; ctx.fillStyle = "#d6dcec"; ctx.fillRect(sx, sy, 2, 6); ctx.fillStyle = "#f5c451"; ctx.fillRect(sx - 1, sy + 6, 4, 1); }
    else { sx = -1; sy = 14; ctx.fillStyle = "#d6dcec"; ctx.fillRect(sx, sy, 2, 6); ctx.fillStyle = "#f5c451"; ctx.fillRect(sx - 1, sy - 1, 4, 1); }
    // Shield
    ctx.fillStyle = "#5db8e0";
    if (facing === "left") {
      ctx.fillRect(8, -4, 4, 10);
      ctx.fillStyle = "#f5c451";
      ctx.fillRect(9, -3, 2, 2);
    } else if (facing === "right") {
      ctx.fillRect(-12, -4, 4, 10);
      ctx.fillStyle = "#f5c451";
      ctx.fillRect(-11, -3, 2, 2);
    }
    ctx.restore();
  }
  function drawSlashArc(p) {
    var t = 1 - p.attackT / (ATTACK_FLASH_MS / 1000);
    var r = 18 + t * 14;
    var alpha = 0.7 - t * 0.55;
    ctx.save();
    ctx.translate(p.px, p.py);
    var ang0 = 0, ang1 = 0;
    if (p.facing === "right") { ang0 = -Math.PI / 3; ang1 = Math.PI / 3; }
    else if (p.facing === "left") { ang0 = Math.PI - Math.PI / 3; ang1 = Math.PI + Math.PI / 3; }
    else if (p.facing === "up") { ang0 = -Math.PI / 2 - Math.PI / 3; ang1 = -Math.PI / 2 + Math.PI / 3; }
    else { ang0 = Math.PI / 2 - Math.PI / 3; ang1 = Math.PI / 2 + Math.PI / 3; }
    ctx.strokeStyle = "rgba(245,196,81," + alpha.toFixed(2) + ")";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r, ang0, ang1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255," + (alpha * 0.6).toFixed(2) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, ang0, ang1);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemies() {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      var alpha = 1;
      if (e.dying) {
        alpha = 1 - e.dyingT;
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      var bob = Math.sin(e.animT * 4 + e.tx + e.ty) * 1.5;
      // Hurt flash
      if (e.hurtT > 0) {
        ctx.globalAlpha = alpha * 0.6 + 0.4 * Math.sin(e.hurtT * 60);
      }
      drawEnemySprite(e, e.px, e.py + bob);
      // Health pip(s)
      if (e.hpMax > 1 && e.hp > 0 && !e.dying) {
        for (var h = 0; h < e.hpMax; h++) {
          ctx.fillStyle = h < e.hp ? "#d04848" : "rgba(255,255,255,.18)";
          ctx.fillRect(e.px - 8 + h * 5, e.py - 18, 4, 2);
        }
      }
      // Poison aura
      if (e.poisonT > 0) {
        ctx.strokeStyle = "rgba(123,224,123,.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(e.px, e.py - 2, 14 + Math.sin(state.time * 6) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawEnemySprite(e, x, y) {
    if (e.type === "goblin") {
      // Green goblin with crooked teeth
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.beginPath(); ctx.ellipse(x, y + 10, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#5d9a4a";
      ctx.fillRect(x - 8, y - 2, 16, 12);
      ctx.fillStyle = "#3d6a2a";
      ctx.fillRect(x - 8, y + 6, 16, 4);
      ctx.fillStyle = "#5d9a4a";
      ctx.fillRect(x - 7, y - 11, 14, 10);
      // Red eyes
      ctx.fillStyle = "#d04848";
      ctx.fillRect(x - 4, y - 7, 2, 2);
      ctx.fillRect(x + 2, y - 7, 2, 2);
      // Teeth
      ctx.fillStyle = "#fff5e8";
      ctx.fillRect(x - 2, y - 3, 1, 2);
      ctx.fillRect(x + 1, y - 3, 1, 2);
      // Club
      ctx.fillStyle = "#7a4a26";
      ctx.fillRect(x + 8, y - 4, 3, 8);
    } else if (e.type === "skeleton") {
      // Skeleton
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.beginPath(); ctx.ellipse(x, y + 10, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
      // Body
      ctx.fillStyle = "#e8e0c8";
      ctx.fillRect(x - 6, y - 2, 12, 12);
      // Ribs
      ctx.fillStyle = "#aaa090";
      ctx.fillRect(x - 5, y, 10, 1);
      ctx.fillRect(x - 5, y + 3, 10, 1);
      ctx.fillRect(x - 5, y + 6, 10, 1);
      // Skull
      ctx.fillStyle = "#f0e8d0";
      ctx.fillRect(x - 7, y - 12, 14, 10);
      // Eye sockets
      ctx.fillStyle = "#100808";
      ctx.fillRect(x - 4, y - 8, 3, 3);
      ctx.fillRect(x + 1, y - 8, 3, 3);
      // Bow held
      ctx.strokeStyle = "#aaa090";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 9, y + 2, 5, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    } else if (e.type === "slime") {
      // Bouncy slime
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.beginPath(); ctx.ellipse(x, y + 11, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
      var sz = e.splitTier > 0 ? 9 : 13;
      ctx.fillStyle = "#7be07b";
      ctx.beginPath();
      ctx.ellipse(x, y, sz, sz * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2d8a3c";
      ctx.beginPath();
      ctx.ellipse(x, y + sz * 0.4, sz, sz * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#100808";
      ctx.fillRect(x - 3, y - 3, 2, 2);
      ctx.fillRect(x + 1, y - 3, 2, 2);
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,.32)";
      ctx.beginPath();
      ctx.ellipse(x - 3, y - 4, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === "wraith") {
      // Wraith — semi-transparent purple
      ctx.fillStyle = "rgba(0,0,0,.3)";
      ctx.beginPath(); ctx.ellipse(x, y + 10, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      var alpha = e.phasing ? 0.45 : 0.85;
      ctx.fillStyle = "rgba(141,118,216," + alpha + ")";
      // Body — flowing cloak
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 10);
      ctx.lineTo(x - 7, y - 10);
      ctx.quadraticCurveTo(x, y - 16, x + 7, y - 10);
      ctx.lineTo(x + 9, y + 10);
      ctx.quadraticCurveTo(x + 4, y + 14, x, y + 12);
      ctx.quadraticCurveTo(x - 4, y + 14, x - 9, y + 10);
      ctx.closePath();
      ctx.fill();
      // Hollow eyes
      ctx.fillStyle = "#5db8e0";
      ctx.fillRect(x - 4, y - 8, 2, 3);
      ctx.fillRect(x + 2, y - 8, 2, 3);
      // Phase indicator
      if (e.phasing) {
        ctx.strokeStyle = "rgba(141,118,216,.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawBoss() {
    var boss = state.boss;
    if (!boss) return;
    var x = boss.px, y = boss.py;
    var alpha = boss.dying ? 1 - boss.dyingT : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (boss.hurtT > 0) {
      ctx.globalAlpha = alpha * 0.5 + 0.5 * Math.sin(boss.hurtT * 60);
    }
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Aura (phase color)
    var auraColor = boss.phase === 1 ? "rgba(200,68,88,.35)" : boss.phase === 2 ? "rgba(255,112,66,.45)" : "rgba(245,196,81,.55)";
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(x, y, 28 + Math.sin(state.time * 4) * 3, 0, Math.PI * 2);
    ctx.fill();
    // Body — looming hooded figure
    ctx.fillStyle = "#4a1a30";
    ctx.fillRect(x - 16, y - 4, 32, 22);
    ctx.fillStyle = "#6a2a48";
    ctx.fillRect(x - 16, y - 4, 32, 5);
    // Head — horned helm
    ctx.fillStyle = "#2a1018";
    ctx.fillRect(x - 14, y - 22, 28, 20);
    ctx.fillStyle = "#4a1a30";
    ctx.fillRect(x - 13, y - 21, 26, 4);
    // Horns
    ctx.fillStyle = "#e8c878";
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 22);
    ctx.lineTo(x - 22, y - 32);
    ctx.lineTo(x - 12, y - 26);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 14, y - 22);
    ctx.lineTo(x + 22, y - 32);
    ctx.lineTo(x + 12, y - 26);
    ctx.fill();
    // Glowing eyes
    var eyeColor = boss.phase === 1 ? "#d04848" : boss.phase === 2 ? "#ff7042" : "#f5c451";
    ctx.fillStyle = eyeColor;
    ctx.fillRect(x - 8, y - 14, 4, 4);
    ctx.fillRect(x + 4, y - 14, 4, 4);
    // Mouth
    ctx.fillStyle = "#100408";
    ctx.fillRect(x - 6, y - 6, 12, 4);
    ctx.fillStyle = "#f5c451";
    ctx.fillRect(x - 5, y - 5, 1, 1);
    ctx.fillRect(x - 2, y - 5, 1, 1);
    ctx.fillRect(x + 1, y - 5, 1, 1);
    ctx.fillRect(x + 4, y - 5, 1, 1);
    // Tome in hand
    ctx.fillStyle = "#2a4a8a";
    ctx.fillRect(x - 24, y + 4, 8, 10);
    ctx.fillStyle = "#f5c451";
    ctx.fillRect(x - 23, y + 5, 6, 2);
    ctx.restore();
  }

  function drawBossHpBar() {
    var boss = state.boss;
    if (!boss || boss.dying) return;
    ctx.save();
    var bx = LOGICAL_W / 2 - 180;
    var by = LOGICAL_H - 36;
    var bw = 360;
    var bh = 18;
    // BG
    ctx.fillStyle = "rgba(0,0,0,.62)";
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    ctx.fillStyle = "rgba(40,20,32,.95)";
    ctx.fillRect(bx, by, bw, bh);
    // Fill
    var pct = Math.max(0, boss.hp / boss.hpMax);
    var grad = ctx.createLinearGradient(bx, by, bx + bw, by);
    grad.addColorStop(0, "#d04848");
    grad.addColorStop(1, "#ff7042");
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * pct, bh);
    // Phase markers
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.fillRect(bx + bw / 3, by - 2, 1, bh + 4);
    ctx.fillRect(bx + 2 * bw / 3, by - 2, 1, bh + 4);
    // Label
    ctx.fillStyle = "#fff5e8";
    ctx.font = "bold 11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MISCONCEPTION LORD · HP " + boss.hp + " / " + boss.hpMax + " · PHASE " + boss.phase, bx + bw / 2, by + bh / 2);
    ctx.restore();
  }

  function drawRelics() {
    for (var i = 0; i < state.relics.length; i++) {
      var r = state.relics[i];
      r.bobT += 0.05;
      var bob = Math.sin(r.bobT) * 2.5;
      var x = r.px, y = r.py + bob;
      ctx.save();
      // Glow
      var glowColor = r.isScholar ? "rgba(245,196,81,.55)" : (r.legendary ? "rgba(245,196,81,.7)" : "rgba(169,145,255,.45)");
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(x, y, 14 + Math.sin(r.bobT * 1.5) * 2, 0, Math.PI * 2);
      ctx.fill();
      // Relic body — small chalice/medallion
      ctx.fillStyle = r.isScholar ? "#f5c451" : (r.legendary ? "#f5c451" : "#a991ff");
      ctx.fillRect(x - 6, y - 6, 12, 12);
      ctx.fillStyle = r.isScholar ? "#7a5a18" : "#3c2c70";
      ctx.fillRect(x - 5, y - 5, 10, 2);
      // Inner gem
      ctx.fillStyle = r.isScholar ? "#fff5e8" : "#fff5e8";
      ctx.fillRect(x - 2, y - 2, 4, 4);
      // Question mark for scholar
      if (r.isScholar) {
        ctx.fillStyle = "#3a200a";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", x, y);
      }
      // Gold rim outline
      if (r.isScholar) {
        ctx.strokeStyle = "#fff5e8";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 7, y - 7, 14, 14);
      }
      ctx.restore();
    }
  }
  function drawChests() {
    for (var i = 0; i < state.chests.length; i++) {
      var c = state.chests[i];
      var x = c.px, y = c.py;
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.beginPath();
      ctx.ellipse(x, y + 12, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Chest body
      if (c.open) {
        ctx.fillStyle = "#5a4218";
        ctx.fillRect(x - 12, y - 2, 24, 12);
        // Empty top
        ctx.fillStyle = "#3a2812";
        ctx.fillRect(x - 12, y - 12, 24, 4);
      } else {
        // Bottom
        ctx.fillStyle = "#7a5a26";
        ctx.fillRect(x - 12, y - 4, 24, 14);
        // Lid
        ctx.fillStyle = "#9a6e36";
        ctx.fillRect(x - 12, y - 12, 24, 8);
        // Bands
        ctx.fillStyle = "#3a2812";
        ctx.fillRect(x - 12, y - 4, 24, 2);
        ctx.fillRect(x - 12, y, 24, 2);
        // Lock
        if (c.locked) {
          ctx.fillStyle = "#d04848";
          ctx.fillRect(x - 3, y - 6, 6, 6);
          ctx.fillStyle = "#100808";
          ctx.fillRect(x - 1, y - 4, 2, 2);
        } else {
          ctx.fillStyle = "#f5c451";
          ctx.fillRect(x - 3, y - 6, 6, 6);
          ctx.fillStyle = "#7a5a18";
          ctx.fillRect(x - 1, y - 4, 2, 2);
        }
        // Glow if not opened
        ctx.strokeStyle = "rgba(245,196,81,.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y - 2, 17 + Math.sin(state.time * 3) * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  function drawKeys() {
    for (var i = 0; i < state.keys.length; i++) {
      var k = state.keys[i];
      k.bobT += 0.06;
      var bob = Math.sin(k.bobT) * 2;
      var x = k.px, y = k.py + bob;
      // Glow
      ctx.fillStyle = "rgba(245,196,81,.32)";
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
      // Key shape: bow + shaft + teeth
      ctx.fillStyle = "#f5c451";
      ctx.beginPath();
      ctx.arc(x - 4, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c8922a";
      ctx.fillRect(x - 1, y - 1, 8, 2);
      ctx.fillRect(x + 4, y - 3, 1, 2);
      ctx.fillRect(x + 6, y - 4, 1, 3);
      // Hole
      ctx.fillStyle = "#100808";
      ctx.fillRect(x - 5, y - 1, 2, 2);
    }
  }
  function drawPotions() {
    for (var i = 0; i < state.potions.length; i++) {
      var P = state.potions[i];
      P.bobT += 0.06;
      var bob = Math.sin(P.bobT) * 2;
      var x = P.px, y = P.py + bob;
      // Glow
      ctx.fillStyle = "rgba(123,224,123,.3)";
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      // Bottle
      ctx.fillStyle = "#aaa090";
      ctx.fillRect(x - 2, y - 8, 4, 3);
      ctx.fillStyle = "#3c4a8a";
      ctx.fillRect(x - 4, y - 5, 8, 10);
      ctx.fillStyle = "#7be07b";
      ctx.fillRect(x - 3, y - 3, 6, 6);
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.fillRect(x - 3, y - 3, 1, 4);
    }
  }
  function drawPowerups() {
    for (var i = 0; i < state.powerups.length; i++) {
      var P = state.powerups[i];
      P.bobT += 0.07;
      var bob = Math.sin(P.bobT) * 2.5;
      var x = P.px, y = P.py + bob;
      var meta = POWERUP_META[P.type];
      // Glow
      ctx.fillStyle = meta.glow;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(x, y, 12 + Math.sin(state.time * 5) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Capsule body
      ctx.fillStyle = meta.color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = meta.glow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();
      // Glyph
      ctx.fillStyle = "#100408";
      ctx.font = "bold 10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, x, y);
    }
  }
  function drawBones() {
    for (var i = 0; i < state.bones.length; i++) {
      var b = state.bones[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      // Bone shape: white rect with knobs
      ctx.fillStyle = "#e8e0c8";
      ctx.fillRect(-7, -1.5, 14, 3);
      ctx.beginPath();
      ctx.arc(-7, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(7, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#aaa090";
      ctx.fillRect(-6, 0, 12, 1);
      ctx.restore();
    }
  }
  function drawEmbers() {
    for (var i = 0; i < state.embers.length; i++) {
      var e = state.embers[i];
      var k = Math.max(0, e.life / e.totalLife);
      ctx.fillStyle = e.color;
      ctx.globalAlpha = k;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (0.6 + k * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // -- HUD update -----------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = state.lives;
    if (dom.hudHp) dom.hudHp.textContent = state.player.hp + "/" + state.player.hpMax;
    if (dom.hudFloor) dom.hudFloor.textContent = (state.floorIndex + 1) + "/" + FLOORS_PER_RUN;
    if (dom.hudKeys) dom.hudKeys.textContent = state.player.keys;
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      if (state.floor && state.floor.isBoss) {
        dom.goalName.textContent = "Defeat the Misconception Lord";
      } else if (state.floorsCleared >= FLOORS_PER_RUN - 1) {
        dom.goalName.textContent = "Find the stairs and descend";
      } else {
        dom.goalName.textContent = "Clear the dungeon · find the stairs";
      }
    }
    if (dom.goalMeta) {
      var active = [];
      if (state.player.shieldT > 0) active.push("SHIELD " + state.player.shieldT.toFixed(1) + "s");
      if (state.player.berserkT > 0) active.push("BERSERK " + state.player.berserkT.toFixed(1) + "s");
      if (state.player.lootDoublerCharges > 0) active.push("LOOT x" + state.player.lootDoublerCharges);
      var rstr = "Relics " + state.relicsCollected;
      var pstr = active.length ? " · " + active.join(" · ") : "";
      dom.goalMeta.textContent = rstr + pstr;
    }
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { floor: state.maxFloorIndex + 1, floorsCleared: state.floorsCleared, bossDefeats: state.bossDefeats });
      }
    } catch (e) {}
  }
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          floorIndex: state.floorIndex,
          floorsCleared: state.floorsCleared,
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
          file: "games/knights-quest/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("knights-quest:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("knights-quest:best", String(Math.floor(v)));
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
      if (phase === "playing" || phase === "bossIntro") {
        if (k === "a" || k === "A" || k === "ArrowLeft") { keys.left = true; e.preventDefault(); return; }
        if (k === "d" || k === "D" || k === "ArrowRight") { keys.right = true; e.preventDefault(); return; }
        if (k === "w" || k === "W" || k === "ArrowUp") { keys.up = true; e.preventDefault(); return; }
        if (k === "s" || k === "S" || k === "ArrowDown") { keys.down = true; e.preventDefault(); return; }
        if (k === " " || k === "Spacebar") {
          if (!e.repeat) keys.attackQueued = true;
          e.preventDefault();
          return;
        }
        if (k === "Shift") {
          keys.blockHeld = true;
          e.preventDefault();
          return;
        }
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
    document.addEventListener("keyup", function (e) {
      var k = e.key;
      if (k === "a" || k === "A" || k === "ArrowLeft") keys.left = false;
      else if (k === "d" || k === "D" || k === "ArrowRight") keys.right = false;
      else if (k === "w" || k === "W" || k === "ArrowUp") keys.up = false;
      else if (k === "s" || k === "S" || k === "ArrowDown") keys.down = false;
      else if (k === "Shift") keys.blockHeld = false;
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
        keys.attackQueued = true;
      } else {
        var dir;
        if (ay > ax) dir = (dy < 0) ? "up" : "down";
        else dir = (dx < 0) ? "left" : "right";
        keys[dir] = true;
        setTimeout(function () { keys[dir] = false; }, 200);
      }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; }, { passive: true });
  }
  function bindTouchControls() {
    function bindHold(btn, key) {
      if (!btn) return;
      var down = function (e) { if (e) e.preventDefault(); keys[key] = true; };
      var up = function (e) { if (e) e.preventDefault(); keys[key] = false; };
      btn.addEventListener("touchstart", down, { passive: false });
      btn.addEventListener("touchend", up, { passive: false });
      btn.addEventListener("touchcancel", up, { passive: false });
      btn.addEventListener("mousedown", down);
      btn.addEventListener("mouseup", up);
      btn.addEventListener("mouseleave", up);
    }
    bindHold(dom.tcLeft, "left");
    bindHold(dom.tcRight, "right");
    bindHold(dom.tcUp, "up");
    bindHold(dom.tcDown, "down");
    if (dom.tcAttack) {
      var atk = function (e) { if (e) e.preventDefault(); keys.attackQueued = true; };
      dom.tcAttack.addEventListener("click", atk);
      dom.tcAttack.addEventListener("touchstart", atk, { passive: false });
    }
    if (dom.tcBlock) {
      var blockDown = function (e) { if (e) e.preventDefault(); keys.blockHeld = true; };
      var blockUp = function (e) { if (e) e.preventDefault(); keys.blockHeld = false; };
      dom.tcBlock.addEventListener("touchstart", blockDown, { passive: false });
      dom.tcBlock.addEventListener("touchend", blockUp, { passive: false });
      dom.tcBlock.addEventListener("touchcancel", blockUp, { passive: false });
      dom.tcBlock.addEventListener("mousedown", blockDown);
      dom.tcBlock.addEventListener("mouseup", blockUp);
      dom.tcBlock.addEventListener("mouseleave", blockUp);
    }
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
    lastBonusLifeThreshold = Math.floor((s.score || 0) / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    initState({
      floorIndex: s.floorIndex || 0,
      score: s.score || 0,
      floorsCleared: s.floorsCleared || 0,
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
    if (snap && snap.state && (snap.state.score || snap.state.floorsCleared) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Floor ' + ((snap.state.floorIndex || 0) + 1) +
        ' &middot; Floors Cleared ' + (snap.state.floorsCleared || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Knight\'s Quest Scores</div>';
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
    if (phase === "playing" || phase === "bossIntro") {
      updatePlayer(dt);
      updateEnemies(dt);
      updateBones(dt);
      updateBoss(dt);
      processAdjacentEnemyStrikes(dt);
      checkCollisions();
      // Decay powerup item life
      for (var i = state.powerups.length - 1; i >= 0; i--) {
        var pu = state.powerups[i];
        pu.life -= dt;
        if (pu.life <= 0) state.powerups.splice(i, 1);
      }
    }
    if (phase === "dying" && state && state.player) {
      state.player.dyingT += dt * 1.4;
      if (state.player.dyingT > 1) state.player.dyingT = 1;
    }
    if (state) {
      updateEmbers(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "floorClear" || phase === "paused" || phase === "bossIntro") {
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
