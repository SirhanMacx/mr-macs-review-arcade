/* ===========================================================================
   Tower Climb — Donkey Kong-style platformer · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x800 logical · 5-floor tower (6 on stage 4+)
   Climb angled girders + ladders. Misconception Magnate rolls rumor barrels.
   Scholar tomes trigger optional review prompts. Game first; review optional.
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "tower-climb";
  var GAME_TITLE = "Tower Climb";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 800;

  // Tower geometry
  // Floors are angled girders alternating slope direction (DK style).
  // Floor 0 = bottom (player start), top floor = magnate's perch.
  // Each floor spans from one wall to the other; tilt makes barrels roll.
  var WALL_LEFT = 70;
  var WALL_RIGHT = LOGICAL_W - 70;        // 650
  var TOWER_FLOOR_H = 120;                // vertical distance between floor mid-lines
  var FLOOR_BASE_Y = LOGICAL_H - 110;     // y of floor-0 (bottom) midline
  var FLOOR_THICK = 14;                   // thickness of girder
  var FLOOR_TILT = 18;                    // rise/fall across the floor (px)
  var GAP_AT_LADDER = 0;                  // (no gap; ladders are overlays)

  // Player
  var PLAYER_W = 22;
  var PLAYER_H = 28;
  var WALK_SPEED = 130;                   // px/sec
  var CLIMB_SPEED = 95;                   // px/sec on ladders
  var GRAVITY = 1100;                     // px/sec^2
  var JUMP_VY = -380;                     // initial jump velocity
  var JUMP_VY_BOOSTED = -480;             // springs power-up
  var DEATH_DELAY_MS = 1500;
  var STAGE_CLEAR_DELAY_MS = 2000;

  // Enemy spawn
  var BARREL_SPAWN_BASE = 2.6;            // seconds between barrel rolls at stage 1
  function barrelSpawnInterval(stage) {
    return Math.max(0.9, BARREL_SPAWN_BASE - (stage - 1) * 0.30);
  }
  var SCHOLAR_TOME_DROP_RATE = 0.16;      // 16% chance (was 8% — Jon: more review opportunities)
  var POWERUP_GILT_TOME_RATE = 0.05;      // 5% chance a tome is gilt-rim ⇒ review prompt
  var POWERUP_DROP_RATE = 0.05;           // 5% chance scholar tome carries a power-up

  // Scoring
  var SCORE_BARREL_HOP = 100;
  var SCORE_TOME_GRAB = 200;
  var SCORE_SCHOLAR_CORRECT = 1500;
  var SCORE_STAGE_CLEAR = 5000;
  var BONUS_LIFE_THRESHOLD = 10000;
  var SHARDS_CAP = 200;
  var LIVES_INIT = 3;

  // Stage progression: floors per stage, max stages, etc.
  function floorsForStage(stage) {
    return stage <= 3 ? 5 : 6;
  }

  // Power-up types
  var POWERUP_TYPES = ["helmet", "springs", "hammer", "slow", "ladder"];
  var POWERUP_META = {
    helmet:  { glyph: "⛑", color: "#e9d8a3", glow: "#f5c451", label: "HELMET" },
    springs: { glyph: "⚡", color: "#f7f06b", glow: "#f5e451", label: "SPRINGS" },
    hammer:  { glyph: "⚒", color: "#ffd2c2", glow: "#f0a070", label: "HAMMER" },
    slow:    { glyph: "◔", color: "#aae0f0", glow: "#5db8e0", label: "SLOW TIME" },
    ladder:  { glyph: "☇", color: "#a8e8b4", glow: "#4dd49b", label: "LADDER" }
  };

  // -- Inline review bank (28 entries) --------------------------------------
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

  var phase = "setup"; // setup | playing | question | paused | ended | dying | stageClear
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
  var pendingScholarTome = null;
  // Run token guards setTimeout callbacks (death/stage clear) against stale runs.
  var runToken = 0;
  // Pending timer ids so we can clear stage/death timeouts on phase changes.
  var pendingDeathTimer = null;
  var pendingStageTimer = null;

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
    jump:        function () { sfxTone(540, 0.10, { type: "square", volume: 0.10, endFreq: 880 }); },
    land:        function () { sfxTone(380, 0.05, { type: "triangle", volume: 0.08, endFreq: 240 }); },
    climb:       function () { sfxTone(420, 0.04, { type: "triangle", volume: 0.06, endFreq: 540 }); },
    barrelHop:   function () {
      sfxTone(660, 0.06, { type: "triangle", volume: 0.10 });
      setTimeout(function () { sfxTone(880, 0.06, { type: "triangle", volume: 0.10 }); }, 40);
    },
    barrelHit:   function () {
      sfxNoise(0.4, { volume: 0.20, cutoff: 700 });
      sfxTone(280, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 60 });
    },
    tomeGrab:    function () {
      [784, 988, 1318].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.14 }); }, i * 50);
      });
    },
    scholarGrab: function () {
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
    hammerSmash: function () {
      sfxNoise(0.18, { volume: 0.20, cutoff: 1500 });
      sfxTone(660, 0.16, { type: "square", volume: 0.16, endFreq: 220 });
    },
    magnateGrowl: function () {
      sfxTone(160, 0.50, { type: "sawtooth", volume: 0.18, endFreq: 80 });
      sfxNoise(0.4, { volume: 0.10, cutoff: 400 });
    },
    stageClear: function () {
      [523, 659, 784, 988, 1175, 1568, 2093].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.20, { type: "triangle", volume: 0.20 }); }, i * 90);
      });
    },
    lifeLost:    function () {
      sfxNoise(0.30, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.4, { type: "sawtooth", volume: 0.14, endFreq: 50 });
    },
    gameOver:    function () {
      sfxNoise(0.6, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.7, { type: "sawtooth", volume: 0.18, endFreq: 40 });
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
    canvas = $("towerCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudStage = $("hudStage");
    dom.hudFloor = $("hudFloor");
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
    dom.tcJump = $("tcJump");
  }

  // -- Tower geometry helpers ------------------------------------------------
  // Floor i (0 = bottom). Tilt alternates: even floors slope down→right, odd slope down→left.
  // Returns y of the girder at world x for floor i.
  function floorMidY(floorIndex) {
    return FLOOR_BASE_Y - floorIndex * TOWER_FLOOR_H;
  }
  function floorTilt(floorIndex) {
    return (floorIndex % 2 === 0) ? +1 : -1; // +1 means right side lower (down→right)
  }
  function floorYAtX(floorIndex, x) {
    // Linear interpolation across the tower span based on tilt.
    if (x < WALL_LEFT) x = WALL_LEFT;
    if (x > WALL_RIGHT) x = WALL_RIGHT;
    var span = WALL_RIGHT - WALL_LEFT;
    var t = (x - WALL_LEFT) / span; // 0..1 left to right
    var midY = floorMidY(floorIndex);
    var tilt = floorTilt(floorIndex);
    // tilt=+1: y at left = midY - FLOOR_TILT, y at right = midY + FLOOR_TILT
    // tilt=-1: opposite
    return midY + tilt * (t - 0.5) * (2 * FLOOR_TILT);
  }
  function floorEnds(floorIndex) {
    // Even floors (0,2,4): right end at wall, left end stops short of wall (so barrels fall left)
    // Odd floors: opposite. Magnate-style top floor handled separately.
    var tilt = floorTilt(floorIndex);
    // Where does the floor "end" so a barrel falls off?
    // For tilt=+1 (down→right): barrel rolls right, falls off right end → right end is ON wall
    // The opposite end stops before the opposing wall, leaving a gap so player must take a ladder
    // We choose: open end is whichever side the barrel falls off. The far wall blocks the player.
    var openSide = tilt > 0 ? "right" : "left";
    var leftX = (openSide === "right") ? WALL_LEFT : WALL_LEFT;
    var rightX = (openSide === "right") ? WALL_RIGHT : WALL_RIGHT;
    return { leftX: leftX, rightX: rightX, openSide: openSide };
  }

  // -- Ladders ---------------------------------------------------------------
  // A ladder spans floor i (top) to floor i-1 (bottom).
  // Each floor (except the top) has at least one ladder going up to the next floor.
  // Higher stages can add a second ladder.
  function buildLadders(stage) {
    var ladders = [];
    var floors = floorsForStage(stage);
    for (var i = 0; i < floors - 1; i++) {
      // Place primary ladder at a position that varies per stage to feel different.
      // Avoid edges. x-range roughly 100..620.
      var seed = (stage * 17 + i * 31 + 7) % 11;
      var primX = WALL_LEFT + 80 + seed * 42; // 150..570
      ladders.push(makeLadder(i, primX));
      if (stage >= 3 && i % 2 === 0) {
        // Add a second ladder on alternating floors at higher stages.
        var altX = WALL_LEFT + 220 + ((seed + 5) % 7) * 36;
        ladders.push(makeLadder(i, altX));
      }
    }
    return ladders;
  }
  function makeLadder(floorIndex, xCenter) {
    // floorIndex = bottom floor (the floor at the BOTTOM of this ladder)
    // top of ladder = at floor (floorIndex+1), bottom = at floor (floorIndex)
    var bottomY = floorYAtX(floorIndex, xCenter) - FLOOR_THICK / 2;
    var topY = floorYAtX(floorIndex + 1, xCenter) + FLOOR_THICK / 2;
    return {
      floorIndex: floorIndex,
      x: xCenter,
      width: 22,
      topY: topY,
      bottomY: bottomY
    };
  }
  function ladderAtPlayer(p) {
    // Returns ladder if player's center x is within +/- 12 of any ladder x AND
    // player's vertical mid is within the ladder's vertical span.
    if (!state) return null;
    for (var i = 0; i < state.ladders.length; i++) {
      var L = state.ladders[i];
      if (Math.abs(p.x - L.x) <= 14) {
        var pMidY = p.y - PLAYER_H / 2;
        if (pMidY >= L.topY - 6 && pMidY <= L.bottomY + 6) {
          return L;
        }
      }
    }
    return null;
  }
  function ladderTouchAtFeet(p) {
    // For accessing a ladder while standing on a girder.
    if (!state) return null;
    for (var i = 0; i < state.ladders.length; i++) {
      var L = state.ladders[i];
      if (L.floorIndex === p.floor && Math.abs(p.x - L.x) <= 14) return L;
      if (L.floorIndex === p.floor - 1 && Math.abs(p.x - L.x) <= 14) return L; // top of ladder reaches floor (floorIndex+1)
    }
    return null;
  }

  // -- Player ----------------------------------------------------------------
  function makePlayer() {
    var startX = WALL_LEFT + 36;
    var startFloor = 0;
    var y = floorYAtX(startFloor, startX);
    return {
      x: startX,
      y: y,                        // foot y (player stands on floor)
      vx: 0,
      vy: 0,
      floor: 0,
      onGround: true,
      onLadder: false,
      facing: 1,                   // +1 right, -1 left
      animT: 0,
      jumping: false,
      dying: false,
      dyingT: 0,
      // power-up timers
      helmetActive: false,         // one-shot shield
      springsT: 0,                 // duration
      hammerT: 0,                  // duration of hammer (5s window)
      slowT: 0,                    // duration of slow time
      // brief post-hit / post-respawn invulnerability so a single frame can't burn 2 lives
      invulnT: 0,
      // jump tracking for scoring (barrel hop bonuses)
      jumpedOver: []               // ids of barrels we've cleared on this jump
    };
  }

  // -- Magnate ---------------------------------------------------------------
  function makeMagnate(stage) {
    var floors = floorsForStage(stage);
    var topFloor = floors - 1;
    // Magnate sits on a small platform at top, on left side
    var x = WALL_LEFT + 100;
    var y = floorYAtX(topFloor, x) - 8; // sit just above floor
    return {
      x: x,
      y: y,
      floor: topFloor,
      stompT: 0,
      growlT: 0,
      animT: 0
    };
  }

  // -- Spotlight (top-floor goal) -------------------------------------------
  function makeSpotlight(stage) {
    var floors = floorsForStage(stage);
    var topFloor = floors - 1;
    var x = WALL_RIGHT - 80;
    var y = floorYAtX(topFloor, x) - 30;
    return {
      x: x,
      y: y,
      floor: topFloor,
      r: 26,
      pulse: 0
    };
  }

  // -- Barrels ---------------------------------------------------------------
  // A barrel rolls down a tilted girder, falls off the open end, lands on next floor below,
  // continues rolling in opposite direction (alternating tilt). On reaching a ladder,
  // 35% chance to descend the ladder (reroute at half speed).
  var nextBarrelId = 1;
  function makeBarrel(stage) {
    var floors = floorsForStage(stage);
    var topFloor = floors - 1;
    var spawnX = WALL_LEFT + 130;
    var y = floorYAtX(topFloor, spawnX) - 8;
    return {
      id: nextBarrelId++,
      x: spawnX,
      y: y,
      vx: 70 + stage * 6,   // initial roll speed; sign set below
      vy: 0,
      floor: topFloor,
      onGround: true,
      falling: false,
      onLadder: null,
      ladderProgress: 0,
      stage: stage,
      rot: 0,
      smashed: false,
      smashedT: 0,
      hopFlag: {} // map of player jump-id => true (for barrel-hop scoring once)
    };
  }

  // -- Tomes -----------------------------------------------------------------
  // Tomes appear: drop from magnate's perch, slide down floors, settle at edges.
  var nextTomeId = 1;
  function makeTome(stage, isGilt) {
    var floors = floorsForStage(stage);
    var topFloor = floors - 1;
    var spawnX = WALL_LEFT + 100 + Math.random() * 30;
    var y = floorYAtX(topFloor, spawnX) - 24;
    return {
      id: nextTomeId++,
      x: spawnX,
      y: y,
      vx: 60,
      vy: 0,
      floor: topFloor,
      onGround: true,
      isGilt: !!isGilt,
      power: null,
      life: 22.0,
      bob: 0,
      rot: 0
    };
  }

  // -- Powerup pickups (separate sprites, on tome collection chance) ---------
  // Powerups float briefly at tome pickup location and float upward.
  function spawnPowerupBubble(x, y, type) {
    state.powerupBubbles.push({
      x: x, y: y,
      vy: -36,
      type: type,
      life: 6.0,
      collected: false,
      bob: 0
    });
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var stage = opts.stage || 1;
    state = {
      stage: stage,
      maxStage: opts.maxStage || stage,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      ladders: buildLadders(stage),
      barrels: [],
      tomes: [],
      powerupBubbles: [],
      particles: [],
      embers: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      bgStars: opts.bgStars || generateStars(),
      // stats
      barrelsHopped: opts.barrelsHopped || 0,
      tomesCollected: opts.tomesCollected || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      stagesCleared: opts.stagesCleared || 0,
      best: opts.best || readBest(),
      time: 0,
      barrelSpawnT: 1.5,
      magnateGrowlT: 4.0,
      stageClearT: 0,
      player: makePlayer(),
      magnate: makeMagnate(stage),
      spotlight: makeSpotlight(stage),
      endReason: ""
    };
    nextBarrelId = 1;
    nextTomeId = 1;
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

  // -- Input state -----------------------------------------------------------
  var keys = { left: false, right: false, up: false, down: false, jumpQueued: false };
  var jumpId = 0;

  // -- Movement / physics ---------------------------------------------------
  function updatePlayer(dt) {
    var p = state.player;
    if (p.dying) {
      p.dyingT += dt * 1.4;
      if (p.dyingT >= 1) {
        // After death animation; respawn or game over handled in onPlayerDeathFinish.
      }
      return;
    }
    p.animT += dt;

    // Decay timers
    if (p.springsT > 0) p.springsT = Math.max(0, p.springsT - dt);
    if (p.hammerT > 0) p.hammerT = Math.max(0, p.hammerT - dt);
    if (p.slowT > 0) p.slowT = Math.max(0, p.slowT - dt);
    if (p.invulnT > 0) p.invulnT = Math.max(0, p.invulnT - dt);

    // Ladder logic
    if (p.onLadder) {
      var L = ladderAtPlayer(p);
      if (!L) {
        // Snapped off; settle on nearest floor surface.
        p.onLadder = false;
        p.vy = 0;
        // Snap floor
        snapPlayerToNearestFloor(p);
      } else {
        p.vy = 0;
        if (keys.up) {
          p.y -= CLIMB_SPEED * dt;
          if (Math.floor(p.animT * 5) % 2 === 0 && Math.random() < 0.04) sfx.climb();
        } else if (keys.down) {
          p.y += CLIMB_SPEED * dt;
          if (Math.floor(p.animT * 5) % 2 === 0 && Math.random() < 0.04) sfx.climb();
        }
        // Clamp to ladder span
        if (p.y - PLAYER_H / 2 < L.topY) {
          // Reached top: dismount onto floor above
          p.onLadder = false;
          p.floor = L.floorIndex + 1;
          var ny = floorYAtX(p.floor, p.x);
          p.y = ny;
          p.onGround = true;
          p.vy = 0;
        } else if (p.y - PLAYER_H / 2 > L.bottomY) {
          // Dismount at bottom
          p.onLadder = false;
          p.floor = L.floorIndex;
          var ny2 = floorYAtX(p.floor, p.x);
          p.y = ny2;
          p.onGround = true;
          p.vy = 0;
        }
      }
      // Allow jump off ladder
      if (keys.jumpQueued) {
        keys.jumpQueued = false;
        p.onLadder = false;
        doJump(p);
      }
      return;
    }

    // Not on ladder; on ground or in air
    // Horizontal
    var moving = false;
    if (keys.left && !keys.right) {
      p.vx = -WALK_SPEED;
      p.facing = -1;
      moving = true;
    } else if (keys.right && !keys.left) {
      p.vx = WALK_SPEED;
      p.facing = 1;
      moving = true;
    } else {
      p.vx = 0;
    }

    // Try to grab a ladder (must press up/down while standing on a girder)
    if (p.onGround && (keys.up || keys.down)) {
      var Lt = ladderTouchAtFeet(p);
      if (Lt) {
        // Begin climbing
        p.onLadder = true;
        p.x = Lt.x;
        // when going up, set y to feet on floor (already there)
        // when going down, only allow if there's a ladder below current floor
        if (keys.down) {
          // need to be on the top of a ladder going down: ladder.floorIndex == p.floor - 1
          if (Lt.floorIndex === p.floor - 1) {
            // begin descent: place player just below floor surface
            p.y = floorYAtX(p.floor, p.x) + 4;
          } else if (Lt.floorIndex === p.floor) {
            // ladder goes UP from this floor; cancel descent
            p.onLadder = false;
            p.vx = 0;
          }
        } else if (keys.up) {
          if (Lt.floorIndex !== p.floor) {
            // ladder above us
            p.onLadder = false;
          } else {
            // begin ascent: place feet just above floor
            p.y = floorYAtX(p.floor, p.x) - 4;
          }
        }
        if (p.onLadder) return;
      }
    }

    // Jumping
    if (keys.jumpQueued && p.onGround) {
      keys.jumpQueued = false;
      doJump(p);
    } else {
      keys.jumpQueued = false;
    }

    // Apply velocity
    p.x += p.vx * dt;
    if (p.x < WALL_LEFT + 12) p.x = WALL_LEFT + 12;
    if (p.x > WALL_RIGHT - 12) p.x = WALL_RIGHT - 12;

    if (!p.onGround) {
      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      // Check landing on the floor at p.floor (bottom face): floorY at x
      var fy = floorYAtX(p.floor, p.x);
      if (p.vy >= 0 && p.y >= fy) {
        p.y = fy;
        p.vy = 0;
        p.onGround = true;
        p.jumping = false;
        sfx.land();
        // Reset jumpedOver tracking — we award barrel-hop on landing
      }
      // Also check landing on a NEXT-DOWN floor if we somehow fell off
      // Not implemented; keep simple — falling off doesn't happen since walls clamp.
    } else {
      // Settle to current floor's tilt (floor surface y depends on x)
      p.y = floorYAtX(p.floor, p.x);
    }
  }

  function snapPlayerToNearestFloor(p) {
    var floors = floorsForStage(state.stage);
    var bestI = 0, bestDist = Infinity;
    for (var i = 0; i < floors; i++) {
      var fy = floorYAtX(i, p.x);
      var d = Math.abs(fy - p.y);
      if (d < bestDist) { bestDist = d; bestI = i; }
    }
    p.floor = bestI;
    p.y = floorYAtX(bestI, p.x);
    p.onGround = true;
    p.vy = 0;
  }

  function doJump(p) {
    if (!p.onGround) return;
    var vy = (p.springsT > 0) ? JUMP_VY_BOOSTED : JUMP_VY;
    p.vy = vy;
    p.onGround = false;
    p.jumping = true;
    p.jumpedOver = [];
    jumpId++;
    sfx.jump();
  }

  // -- Barrels ---------------------------------------------------------------
  function updateBarrels(dt) {
    var slowMod = (state.player.slowT > 0) ? 0.5 : 1.0;
    var bdt = dt * slowMod;
    var floors = floorsForStage(state.stage);
    for (var i = state.barrels.length - 1; i >= 0; i--) {
      var b = state.barrels[i];
      if (b.smashed) {
        b.smashedT += dt;
        if (b.smashedT > 0.4) state.barrels.splice(i, 1);
        continue;
      }
      // Speed roughly constant; sign is set by tilt of current floor
      // Even floor (tilt=+1) → roll right. Odd floor (tilt=-1) → roll left.
      var desiredSign = (floorTilt(b.floor) > 0) ? 1 : -1;
      var speed = (60 + b.stage * 5);
      b.rot += (desiredSign * speed) * bdt * 0.04;

      if (b.onLadder) {
        // Descending a ladder
        b.x = b.onLadder.x;
        b.y += (CLIMB_SPEED * 0.6) * bdt;
        if (b.y - 8 >= b.onLadder.bottomY) {
          // Landed on floor below
          b.floor = b.onLadder.floorIndex;
          b.y = floorYAtX(b.floor, b.x) - 8;
          b.onLadder = null;
          b.onGround = true;
          // Resume rolling in new floor's direction
          desiredSign = (floorTilt(b.floor) > 0) ? 1 : -1;
          b.vx = desiredSign * speed;
        }
        continue;
      }

      if (b.falling) {
        b.vy += GRAVITY * bdt;
        b.y += b.vy * bdt;
        b.x += b.vx * bdt * 0.5;
        // Prevent barrels from drifting off-canvas during fall
        if (b.x < WALL_LEFT - 16) { b.x = WALL_LEFT - 16; b.vx = Math.abs(b.vx); }
        if (b.x > WALL_RIGHT + 16) { b.x = WALL_RIGHT + 16; b.vx = -Math.abs(b.vx); }
        // Land on next-lower floor
        if (b.floor > 0) {
          var fyNext = floorYAtX(b.floor - 1, b.x) - 8;
          if (b.y >= fyNext && b.vy > 0) {
            b.floor -= 1;
            b.y = fyNext;
            b.falling = false;
            b.vy = 0;
            b.onGround = true;
            // Reverse direction based on new floor tilt
            desiredSign = (floorTilt(b.floor) > 0) ? 1 : -1;
            b.vx = desiredSign * speed;
            spawnEmber(b.x, b.y + 6, 6, "#f0a070");
            sfx.barrelHop();
          }
        } else {
          // Off the bottom; despawn
          if (b.y > LOGICAL_H + 30) {
            state.barrels.splice(i, 1);
            continue;
          }
        }
        continue;
      }

      // On girder: roll
      b.vx = desiredSign * speed;
      b.x += b.vx * bdt;
      b.y = floorYAtX(b.floor, b.x) - 8;

      // Random ladder descent (35%) when within 8 px of a ladder x with matching floorIndex (= b.floor - 1)
      // i.e., a ladder going DOWN from current floor must be: ladder where floorIndex+1 == b.floor
      // Let's check ladders at the floor below.
      var tookLadder = false;
      for (var L = 0; L < state.ladders.length; L++) {
        var lad = state.ladders[L];
        if (lad.floorIndex === b.floor - 1 && Math.abs(b.x - lad.x) <= 4) {
          if (Math.random() < 0.32) {
            b.onLadder = lad;
            b.x = lad.x;
            // Place barrel just below the floor surface so it can descend the ladder.
            b.y = floorYAtX(b.floor, b.x) + 4;
            b.falling = false;
            b.onGround = false;
            tookLadder = true;
          }
          break; // only consider one matching ladder per frame
        }
      }
      if (tookLadder) continue;

      // Check if rolled off the end
      if (b.x >= WALL_RIGHT - 8 && desiredSign > 0) {
        // Falls off right side onto floor below
        b.falling = true;
        b.vy = 30;
        b.onGround = false;
      } else if (b.x <= WALL_LEFT + 8 && desiredSign < 0) {
        b.falling = true;
        b.vy = 30;
        b.onGround = false;
      }
    }
  }

  function spawnBarrelMaybe(dt) {
    state.barrelSpawnT -= dt;
    if (state.barrelSpawnT <= 0) {
      // Magnate decides: tome or barrel?
      if (Math.random() < SCHOLAR_TOME_DROP_RATE && state.tomes.length < 2) {
        var isGilt = Math.random() < POWERUP_GILT_TOME_RATE * 4; // gilt rate inflated; ~5% of tomes will be gilt
        // Reset gilt rate properly: we want 5% of tomes to be gilt (approx).
        // Use direct check with constant.
        isGilt = Math.random() < POWERUP_GILT_TOME_RATE;
        var t = makeTome(state.stage, isGilt);
        state.tomes.push(t);
      } else {
        var b = makeBarrel(state.stage);
        state.barrels.push(b);
        // Magnate growl + stomp animation
        state.magnate.stompT = 0.35;
        state.magnate.growlT = 0.6;
        if (Math.random() < 0.3) sfx.magnateGrowl();
      }
      state.barrelSpawnT = barrelSpawnInterval(state.stage) * (0.85 + Math.random() * 0.30);
    }
  }

  // -- Tomes update ---------------------------------------------------------
  function updateTomes(dt) {
    var slowMod = (state.player.slowT > 0) ? 0.5 : 1.0;
    var tdt = dt * slowMod;
    for (var i = state.tomes.length - 1; i >= 0; i--) {
      var t = state.tomes[i];
      t.life -= dt;
      t.bob += dt * 3;
      if (t.life <= 0) {
        state.tomes.splice(i, 1);
        continue;
      }
      // Tomes drift down floors slowly. Roll like barrels but slower; do not descend ladders.
      var desiredSign = (floorTilt(t.floor) > 0) ? 1 : -1;
      var speed = 38;
      if (t.onGround) {
        t.x += desiredSign * speed * tdt;
        t.y = floorYAtX(t.floor, t.x) - 24;
        t.rot += desiredSign * tdt * 0.7;
        // edge → fall to next floor
        if ((t.x >= WALL_RIGHT - 8 && desiredSign > 0) || (t.x <= WALL_LEFT + 8 && desiredSign < 0)) {
          if (t.floor > 0) {
            t.onGround = false;
            t.vy = 30;
          } else {
            // settled at bottom; let it persist near the wall
            t.x = (desiredSign > 0) ? WALL_RIGHT - 12 : WALL_LEFT + 12;
            t.y = floorYAtX(t.floor, t.x) - 24;
          }
        }
      } else {
        t.vy += GRAVITY * tdt;
        t.y += t.vy * tdt;
        if (t.floor > 0) {
          var fy = floorYAtX(t.floor - 1, t.x) - 24;
          if (t.y >= fy && t.vy > 0) {
            t.floor -= 1;
            t.y = fy;
            t.vy = 0;
            t.onGround = true;
          }
        }
      }
    }
  }

  // -- Powerup bubbles update ----------------------------------------------
  function updatePowerupBubbles(dt) {
    for (var i = state.powerupBubbles.length - 1; i >= 0; i--) {
      var pb = state.powerupBubbles[i];
      pb.life -= dt;
      pb.bob += dt * 5;
      pb.y += pb.vy * dt;
      pb.vy *= (1 - dt * 0.6);
      if (pb.life <= 0 || pb.collected) {
        state.powerupBubbles.splice(i, 1);
      }
    }
  }

  // -- Collisions -----------------------------------------------------------
  function checkCollisions() {
    var p = state.player;
    if (p.dying) return;

    // Barrels
    for (var i = 0; i < state.barrels.length; i++) {
      var b = state.barrels[i];
      if (b.smashed) continue;
      var dx = p.x - b.x;
      var dy = (p.y - PLAYER_H * 0.4) - b.y;
      var distSq = dx * dx + dy * dy;
      var hitR2 = 18 * 18;
      var nearbyR2 = 32 * 32;
      // hammer smash: if hammer active AND barrel within hit range
      if (p.hammerT > 0 && distSq < (24 + 14) * (24 + 14)) {
        b.smashed = true; b.smashedT = 0;
        spawnEmber(b.x, b.y, 14, "#ff8848");
        addScore(SCORE_BARREL_HOP);
        pushPopup("+" + SCORE_BARREL_HOP, b.x, b.y - 12, "is-score");
        sfx.hammerSmash();
        addShake(3, 0.12);
        continue;
      }
      // Barrel-hop bonus: if player jumping AND barrel passes UNDER player feet
      if (p.jumping && !p.onGround && !b.smashed && !b.hopFlag[jumpId]) {
        var feetY = p.y;
        if (b.y > feetY + 4 && b.y < feetY + 28 && Math.abs(b.x - p.x) < 24) {
          // Player's feet are above the barrel: record hop
          b.hopFlag[jumpId] = true;
          state.barrelsHopped++;
          addScore(SCORE_BARREL_HOP);
          pushPopup("+" + SCORE_BARREL_HOP, p.x, p.y - 36, "is-score");
          sfx.barrelHop();
        }
      }
      // Lethal contact (when on the same horizontal level as player)
      if (distSq < hitR2) {
        // brief invulnerability after helmet save / respawn — prevents double-life loss in same frame
        if (p.invulnT > 0) continue;
        if (p.helmetActive) {
          p.helmetActive = false;
          p.invulnT = 0.9; // ~0.9s grace so a clustered second barrel can't insta-kill
          b.smashed = true; b.smashedT = 0;
          spawnEmber(b.x, b.y, 12, "#f5c451");
          pushPopup("HELMET", p.x, p.y - 32, "is-bonus");
          sfx.barrelHop();
          continue;
        }
        die();
        return;
      }
    }

    // Tomes
    for (var t = state.tomes.length - 1; t >= 0; t--) {
      var T = state.tomes[t];
      var dxT = p.x - T.x;
      var dyT = (p.y - PLAYER_H * 0.4) - T.y;
      if (dxT * dxT + dyT * dyT < 24 * 24) {
        if (T.isGilt) {
          state.tomes.splice(t, 1);
          openQuestion(T);
          return;
        } else {
          state.tomes.splice(t, 1);
          state.tomesCollected++;
          addScore(SCORE_TOME_GRAB);
          pushPopup("+" + SCORE_TOME_GRAB + " TOME", T.x, T.y - 14, "is-bonus");
          sfx.tomeGrab();
          // 5% chance the tome carries a power-up
          if (Math.random() < POWERUP_DROP_RATE) {
            var type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            spawnPowerupBubble(T.x, T.y - 8, type);
          }
        }
      }
    }

    // Powerup bubbles
    for (var pb = state.powerupBubbles.length - 1; pb >= 0; pb--) {
      var P = state.powerupBubbles[pb];
      var dxP = p.x - P.x;
      var dyP = (p.y - PLAYER_H * 0.4) - P.y;
      if (dxP * dxP + dyP * dyP < 28 * 28) {
        applyPowerup(P.type);
        P.collected = true;
      }
    }

    // Spotlight goal
    var sp = state.spotlight;
    if (p.floor === sp.floor) {
      var dxS = p.x - sp.x;
      var dyS = p.y - sp.y;
      if (dxS * dxS + dyS * dyS < (sp.r + 14) * (sp.r + 14)) {
        if (phase === "playing") onStageClear();
      }
    }
  }

  // -- Score / lives ---------------------------------------------------------
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

  // -- Powerups --------------------------------------------------------------
  function applyPowerup(type) {
    sfx.powerupPickup();
    var meta = POWERUP_META[type] || { label: "POWER", glow: "#f0c060" };
    pushPopup(meta.label, state.player.x, state.player.y - 36, "is-bonus");
    if (type === "helmet") {
      state.player.helmetActive = true;
    } else if (type === "springs") {
      state.player.springsT = 8.0;
    } else if (type === "hammer") {
      state.player.hammerT = 5.0;
      sfx.powerupUse();
    } else if (type === "slow") {
      state.player.slowT = 5.0;
    } else if (type === "ladder") {
      // Insert one extra ladder shortcut on a random floor
      addExtraLadder();
    }
  }
  function addExtraLadder() {
    var floors = floorsForStage(state.stage);
    var idx = Math.floor(Math.random() * (floors - 1));
    var x = WALL_LEFT + 100 + Math.random() * (WALL_RIGHT - WALL_LEFT - 200);
    var L = makeLadder(idx, x);
    L.fresh = 2.0; // sparkle for 2 seconds
    state.ladders.push(L);
    pushPopup("LADDER!", x, L.topY - 14, "is-bonus");
  }

  // -- Death / lives ---------------------------------------------------------
  function die() {
    if (state.player.dying) return;
    sfx.barrelHit();
    sfx.lifeLost();
    addShake(8, 0.6);
    state.player.dying = true;
    state.player.dyingT = 0;
    phase = "dying";
    spawnEmber(state.player.x, state.player.y - 10, 22, "#f04860");
    setTimeout(onPlayerDeathFinish, DEATH_DELAY_MS);
  }
  function onPlayerDeathFinish() {
    if (phase !== "dying") return;
    state.lives--;
    if (state.lives <= 0) {
      gameOver();
      return;
    }
    // Respawn at bottom-left of tower
    var p = state.player;
    p.x = WALL_LEFT + 36;
    p.floor = 0;
    p.y = floorYAtX(0, p.x);
    p.vx = 0; p.vy = 0;
    p.dying = false;
    p.dyingT = 0;
    p.onGround = true;
    p.onLadder = false;
    p.jumping = false;
    p.jumpedOver = [];
    // Clear nearby barrels for fairness
    state.barrels = state.barrels.filter(function (b) { return b.floor > 1 || b.x > WALL_LEFT + 200; });
    phase = "playing";
  }

  // -- Stage clear -----------------------------------------------------------
  function onStageClear() {
    if (phase === "stageClear") return;
    phase = "stageClear";
    sfx.stageClear();
    addScore(SCORE_STAGE_CLEAR);
    state.stagesCleared++;
    state.lives++; // +1 per stage clear
    pushPopup("STAGE CLEAR! +" + SCORE_STAGE_CLEAR, LOGICAL_W / 2, LOGICAL_H / 2, "is-legend");
    pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 + 40, "is-bonus");
    addShake(4, 0.4);
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5db8e0", "#d96f2f", "#a991ff"] });
      }
    } catch (e) {}
    setTimeout(advanceStage, STAGE_CLEAR_DELAY_MS);
  }
  function advanceStage() {
    var nextStage = state.stage + 1;
    initState({
      stage: nextStage,
      maxStage: Math.max(state.maxStage, nextStage),
      score: state.score,
      lives: state.lives,
      barrelsHopped: state.barrelsHopped,
      tomesCollected: state.tomesCollected,
      shardsAwarded: state.shardsAwarded,
      questionsAnsweredCorrect: state.questionsAnsweredCorrect,
      questionsAnsweredTotal: state.questionsAnsweredTotal,
      stagesCleared: state.stagesCleared,
      best: state.best,
      bgStars: state.bgStars
    });
    phase = "playing";
    pushPopup("STAGE " + nextStage, LOGICAL_W / 2, 100, "is-magnate");
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
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Magnate Wins" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Tower Climb · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Stages Cleared</div><div class="end-cell-value">' + state.stagesCleared + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Barrels Hopped</div><div class="end-cell-value">' + formatNumber(state.barrelsHopped) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Tomes Collected</div><div class="end-cell-value">' + state.tomesCollected + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.stopTracking(); MrMacsEndRecap.render(document.getElementById("endRecap")); } } catch (e) {}
    showScreen("end");
    stopMusic();
  }

  // -- Scholar question modal ------------------------------------------------
  function openQuestion(tome) {
    pendingScholarTome = tome;
    // MRMAC_QUESTION_VALIDATOR_V1 — retry up to 10× for a valid inline question
    activeQuestion = (typeof window !== "undefined" && window.MrMacsPickValidQuestion)
      ? window.MrMacsPickValidQuestion(function () { return INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)]; }, 10)
      : null;
    if (!activeQuestion) activeQuestion = INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
    sfx.scholarGrab();
    state.score += 0; // grant base via correct/skip handler
    prevPhase = phase;
    phase = "question";
    renderQuestion();
    pauseMusic();
    showScreen("question");
    saveSnapshot();
  }

  function renderQuestion() {
    if (!activeQuestion) return;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Tome";
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
    state.tomesCollected++;
    addScore(SCORE_TOME_GRAB);
    if (wasCorrect) {
      addScore(SCORE_SCHOLAR_CORRECT);
      addShards(12, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5db8e0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCORE_SCHOLAR_CORRECT + " SCHOLAR", LOGICAL_W / 2, 90, "is-bonus");
    }
    activeQuestion = null;
    pendingScholarTome = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    if (phase === "question") phase = "playing";
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function skipQuestion() {
    state.tomesCollected++;
    addScore(SCORE_TOME_GRAB);
    activeQuestion = null;
    pendingScholarTome = null;
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
      // Convert logical coordinates to client coordinates.
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

    // Spotlight on top floor (goal)
    drawSpotlight();

    // Walls (left & right pillar structures)
    drawWalls();

    // Floors (girders)
    drawFloors();

    // Ladders
    drawLadders();

    // Magnate
    drawMagnate();

    // Tomes
    drawTomes();

    // Powerup bubbles
    drawPowerupBubbles();

    // Barrels
    drawBarrels();

    // Player
    drawPlayer();

    // Embers
    drawEmbers();

    // Foreground vignette
    ctx.save();
    var vg = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_H * 0.35, LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_H * 0.62);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.restore();

    ctx.restore();
  }

  function drawStars() {
    if (!state.bgStars) return;
    ctx.save();
    var t = state.time;
    for (var i = 0; i < state.bgStars.length; i++) {
      var s = state.bgStars[i];
      var alpha = 0.35 + 0.45 * Math.sin(t * s.twinkleSpeed + s.twinkle) * 0.5 + 0.25;
      ctx.fillStyle = "rgba(220,200,240," + alpha.toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWalls() {
    ctx.save();
    // Left wall
    var wgL = ctx.createLinearGradient(20, 0, 80, 0);
    wgL.addColorStop(0, "#3b2042");
    wgL.addColorStop(1, "#1a0e22");
    ctx.fillStyle = wgL;
    ctx.fillRect(20, 80, 50, LOGICAL_H - 160);
    // Right wall
    var wgR = ctx.createLinearGradient(LOGICAL_W - 80, 0, LOGICAL_W - 20, 0);
    wgR.addColorStop(0, "#1a0e22");
    wgR.addColorStop(1, "#3b2042");
    ctx.fillStyle = wgR;
    ctx.fillRect(LOGICAL_W - 70, 80, 50, LOGICAL_H - 160);
    // Rivets
    ctx.fillStyle = "rgba(255,200,180,0.18)";
    for (var y = 90; y < LOGICAL_H - 80; y += 28) {
      ctx.beginPath(); ctx.arc(35, y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(LOGICAL_W - 35, y, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFloors() {
    var floors = floorsForStage(state.stage);
    ctx.save();
    for (var i = 0; i < floors; i++) {
      var x0 = WALL_LEFT, x1 = WALL_RIGHT;
      var y0 = floorYAtX(i, x0);
      var y1 = floorYAtX(i, x1);
      // Girder shape — orange gradient.
      var grad = ctx.createLinearGradient(0, y0 - FLOOR_THICK, 0, y0 + FLOOR_THICK);
      grad.addColorStop(0, "#f0883e");
      grad.addColorStop(0.5, "#d96f2f");
      grad.addColorStop(1, "#9a4515");
      ctx.fillStyle = grad;
      // Trapezoidal girder
      ctx.beginPath();
      ctx.moveTo(x0, y0 - FLOOR_THICK / 2);
      ctx.lineTo(x1, y1 - FLOOR_THICK / 2);
      ctx.lineTo(x1, y1 + FLOOR_THICK / 2);
      ctx.lineTo(x0, y0 + FLOOR_THICK / 2);
      ctx.closePath();
      ctx.fill();
      // Rivet pattern
      ctx.fillStyle = "rgba(40,16,8,0.65)";
      var span = WALL_RIGHT - WALL_LEFT;
      for (var rv = 0; rv < 14; rv++) {
        var tx = WALL_LEFT + (rv + 0.5) / 14 * span;
        var ty = floorYAtX(i, tx);
        ctx.beginPath();
        ctx.arc(tx, ty - 2, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tx, ty + 3, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Hatching across the girder for pixel-art feel
      ctx.fillStyle = "rgba(255,200,160,0.10)";
      for (var hx = WALL_LEFT + 4; hx < WALL_RIGHT; hx += 8) {
        var hy = floorYAtX(i, hx);
        ctx.fillRect(hx, hy - FLOOR_THICK / 2 + 1, 4, 2);
      }
      // Highlight edge
      ctx.fillStyle = "rgba(255,220,180,0.45)";
      ctx.fillRect(x0, y0 - FLOOR_THICK / 2, span, 1);
    }
    // Bottom platform fill (so the bottom floor visually rests on a base)
    ctx.fillStyle = "#1a0e22";
    ctx.fillRect(WALL_LEFT, floorYAtX(0, LOGICAL_W / 2) + FLOOR_THICK / 2, WALL_RIGHT - WALL_LEFT, 80);
    ctx.restore();
  }

  function drawLadders() {
    ctx.save();
    for (var i = 0; i < state.ladders.length; i++) {
      var L = state.ladders[i];
      var w = L.width;
      // Side rails
      var freshGlow = (L.fresh && L.fresh > 0);
      var railColor = freshGlow ? "#aae8ff" : "#5db8e0";
      var railShadow = freshGlow ? "#155da3" : "#2a6a8a";
      ctx.strokeStyle = railColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(L.x - w / 2, L.topY);
      ctx.lineTo(L.x - w / 2, L.bottomY);
      ctx.moveTo(L.x + w / 2, L.topY);
      ctx.lineTo(L.x + w / 2, L.bottomY);
      ctx.stroke();
      // Rungs
      ctx.strokeStyle = railShadow;
      ctx.lineWidth = 2;
      var rungSpacing = 12;
      for (var ry = L.topY + 4; ry < L.bottomY; ry += rungSpacing) {
        ctx.beginPath();
        ctx.moveTo(L.x - w / 2, ry);
        ctx.lineTo(L.x + w / 2, ry);
        ctx.stroke();
      }
      // Bright rung overlay
      ctx.strokeStyle = railColor;
      ctx.lineWidth = 1;
      for (var ry2 = L.topY + 4; ry2 < L.bottomY; ry2 += rungSpacing) {
        ctx.beginPath();
        ctx.moveTo(L.x - w / 2 + 1, ry2 - 1);
        ctx.lineTo(L.x + w / 2 - 1, ry2 - 1);
        ctx.stroke();
      }
      if (freshGlow) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, L.fresh) * 0.5;
        ctx.fillStyle = "#aae8ff";
        ctx.beginPath();
        ctx.arc(L.x, (L.topY + L.bottomY) / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawMagnate() {
    var m = state.magnate;
    var stomp = m.stompT > 0 ? Math.sin((1 - m.stompT / 0.35) * Math.PI) * 4 : 0;
    ctx.save();
    ctx.translate(m.x, m.y - stomp);
    // Body silhouette — pixel-art block style
    ctx.imageSmoothingEnabled = false;
    // Belly
    ctx.fillStyle = "#7a1f30";
    pixelRect(-22, -8, 44, 26);
    ctx.fillStyle = "#c84458";
    pixelRect(-20, -6, 40, 22);
    // Head
    ctx.fillStyle = "#8b2a3c";
    pixelRect(-14, -28, 28, 22);
    ctx.fillStyle = "#aa3148";
    pixelRect(-12, -26, 24, 18);
    // Top hat
    ctx.fillStyle = "#1a0d22";
    pixelRect(-12, -42, 24, 4);
    pixelRect(-9, -54, 18, 12);
    ctx.fillStyle = "#c8922a";
    pixelRect(-9, -44, 18, 2);
    // Eyes (angry)
    ctx.fillStyle = "#fff5e8";
    pixelRect(-9, -22, 5, 4);
    pixelRect(4, -22, 5, 4);
    ctx.fillStyle = "#a40";
    pixelRect(-8, -21, 3, 3);
    pixelRect(5, -21, 3, 3);
    // Brow (animation: stomp = furrow)
    ctx.fillStyle = "#3a0a14";
    pixelRect(-11, -24, 8, 2);
    pixelRect(3, -24, 8, 2);
    // Mouth (growl)
    ctx.fillStyle = "#1a0d22";
    pixelRect(-7, -12, 14, 3);
    ctx.fillStyle = "#fff5e8";
    pixelRect(-5, -12, 2, 2);
    pixelRect(2, -12, 2, 2);
    // Arms (angled for "rolling barrel" pose)
    var armSwing = Math.sin(state.time * 4) * 4;
    ctx.fillStyle = "#7a1f30";
    pixelRect(-26, -2 + armSwing, 8, 16);
    pixelRect(18, -2 - armSwing, 8, 16);
    // Bow tie / lapel detail
    ctx.fillStyle = "#f5c451";
    pixelRect(-3, -8, 6, 4);
    // Stack of barrels behind
    ctx.fillStyle = "rgba(120,60,30,0.6)";
    pixelRect(-44, -4, 14, 18);
    ctx.fillStyle = "#9a4515";
    pixelRect(-44, 0, 14, 14);
    ctx.fillStyle = "rgba(255,200,160,0.2)";
    pixelRect(-44, 0, 14, 2);
    ctx.restore();

    // Growl glow
    if (m.growlT > 0) {
      ctx.save();
      var ga = m.growlT / 0.6;
      ctx.globalAlpha = Math.min(1, ga) * 0.5;
      var g = ctx.createRadialGradient(m.x, m.y - 10, 4, m.x, m.y - 10, 60);
      g.addColorStop(0, "rgba(200,68,88,0.7)");
      g.addColorStop(1, "rgba(200,68,88,0)");
      ctx.fillStyle = g;
      ctx.fillRect(m.x - 70, m.y - 60, 140, 80);
      ctx.restore();
      m.growlT -= 1 / 60;
    }
    if (m.stompT > 0) m.stompT -= 1 / 60;
  }

  function drawSpotlight() {
    var sp = state.spotlight;
    sp.pulse += 0.04;
    var r = sp.r + Math.sin(sp.pulse) * 3;
    ctx.save();
    // Beam — reduce outer alpha so it doesn't obscure the top girder/ladders
    var bg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, r * 4.5);
    bg.addColorStop(0, "rgba(245,196,81,0.42)");
    bg.addColorStop(0.4, "rgba(245,196,81,0.14)");
    bg.addColorStop(1, "rgba(245,196,81,0)");
    ctx.fillStyle = bg;
    // Clip beam rect to stay within canvas so it can't spill above floor 0
    ctx.fillRect(Math.max(0, sp.x - r * 4.5), Math.max(0, sp.y - r * 4.5), r * 9, r * 9);
    // Disc
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff5e8";
    ctx.beginPath();
    ctx.arc(sp.x - 4, sp.y - 4, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    // Pole
    ctx.fillStyle = "#a87030";
    ctx.fillRect(sp.x - 3, sp.y, 6, 22);
    ctx.fillStyle = "#3b2042";
    ctx.fillRect(sp.x - 8, sp.y + 22, 16, 4);
    ctx.restore();
  }

  function drawTomes() {
    ctx.save();
    for (var i = 0; i < state.tomes.length; i++) {
      var t = state.tomes[i];
      var bobY = Math.sin(t.bob) * 2;
      ctx.save();
      ctx.translate(t.x, t.y + bobY);
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      pixelRect(-9, 14, 18, 3);
      // Book body
      var coverColor = t.isGilt ? "#f5c451" : "#d96f2f";
      var rimColor = t.isGilt ? "#fff5b0" : "#9a4515";
      ctx.fillStyle = "#3a1c08";
      pixelRect(-10, -12, 20, 24);
      ctx.fillStyle = coverColor;
      pixelRect(-9, -11, 18, 22);
      // Spine
      ctx.fillStyle = rimColor;
      pixelRect(-9, -11, 2, 22);
      // Pages
      ctx.fillStyle = "#fff8e0";
      pixelRect(-7, -10, 14, 20);
      ctx.fillStyle = "#a08068";
      for (var ln = 0; ln < 5; ln++) {
        pixelRect(-5, -7 + ln * 4, 10, 1);
      }
      // Gilt rim with rotating ?
      if (t.isGilt) {
        ctx.save();
        ctx.strokeStyle = "#fff5b0";
        ctx.lineWidth = 1;
        ctx.strokeRect(-10, -12, 20, 24);
        ctx.translate(0, -2);
        ctx.rotate(t.rot);
        ctx.fillStyle = "#3a1c08";
        ctx.font = "bold 14px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPowerupBubbles() {
    ctx.save();
    for (var i = 0; i < state.powerupBubbles.length; i++) {
      var P = state.powerupBubbles[i];
      var bob = Math.sin(P.bob) * 2;
      var meta = POWERUP_META[P.type];
      ctx.save();
      ctx.translate(P.x, P.y + bob);
      // Halo
      ctx.fillStyle = "rgba(245,196,81,0.18)";
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillStyle = meta.glow;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0a0612";
      ctx.font = "bold 16px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, 0, 1);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBarrels() {
    ctx.save();
    for (var i = 0; i < state.barrels.length; i++) {
      var b = state.barrels[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      if (b.smashed) {
        var k = 1 - b.smashedT / 0.4;
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = "#f0a070";
        for (var j = 0; j < 6; j++) {
          var ang = j / 6 * Math.PI * 2;
          var dx = Math.cos(ang) * (1 - k) * 18;
          var dy = Math.sin(ang) * (1 - k) * 18;
          pixelRect(-3 + dx, -3 + dy, 4, 4);
        }
        ctx.restore();
        continue;
      }
      ctx.rotate(b.rot);
      // Shadow
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#000";
      pixelRect(-9, 8, 18, 3);
      ctx.globalAlpha = 1;
      // Barrel body — pixel-art lateral view
      ctx.fillStyle = "#7a3a14";
      pixelRect(-10, -8, 20, 16);
      ctx.fillStyle = "#a85a26";
      pixelRect(-9, -7, 18, 14);
      ctx.fillStyle = "#d97a36";
      pixelRect(-9, -6, 18, 4);
      pixelRect(-9, 1, 18, 3);
      // Bands
      ctx.fillStyle = "#3a1c08";
      pixelRect(-10, -2, 20, 2);
      pixelRect(-10, 4, 20, 2);
      // Rim slats
      ctx.fillStyle = "#5a2c10";
      pixelRect(-9, -7, 1, 14);
      pixelRect(-3, -7, 1, 14);
      pixelRect(2, -7, 1, 14);
      pixelRect(8, -7, 1, 14);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPlayer() {
    var p = state.player;
    if (p.dying) {
      // Dying spin
      var k = p.dyingT;
      ctx.save();
      ctx.translate(p.x, p.y - PLAYER_H * 0.4 - k * 16);
      ctx.rotate(k * Math.PI * 2);
      ctx.globalAlpha = 1 - k;
      drawScholar(0, 0, p.facing, true);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    drawScholar(0, 0, p.facing, false);
    ctx.restore();
  }

  function drawScholar(cx, cy, facing, dying) {
    var p = state.player;
    var legSwing = (p.onLadder)
      ? Math.sin(state.time * 8) * 2
      : (p.onGround && (p.vx !== 0)) ? Math.sin(state.time * 14) * 3 : 0;
    var armSwing = (p.onLadder) ? -legSwing : legSwing;
    ctx.save();
    ctx.translate(cx, cy - PLAYER_H);
    ctx.scale(facing < 0 ? -1 : 1, 1);
    ctx.imageSmoothingEnabled = false;
    // Shadow
    ctx.save();
    ctx.translate(0, PLAYER_H);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#000";
    pixelRect(-10, -2, 20, 3);
    ctx.restore();
    // Legs
    ctx.fillStyle = "#3a4a8e";
    pixelRect(-7, 16, 5, 12 + legSwing);
    pixelRect(2, 16, 5, 12 - legSwing);
    // Shoes
    ctx.fillStyle = "#1a0d22";
    pixelRect(-7, 26 + legSwing, 6, 2);
    pixelRect(2, 26 - legSwing, 6, 2);
    // Body / coat
    var coatColor = "#c84458";
    if (p.helmetActive) coatColor = "#5db8e0";
    ctx.fillStyle = coatColor;
    pixelRect(-8, 6, 16, 12);
    // Coat shading
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    pixelRect(-8, 14, 16, 2);
    pixelRect(2, 6, 6, 12);
    // Sash (gold)
    ctx.fillStyle = "#f5c451";
    pixelRect(-8, 10, 16, 2);
    // Arms
    ctx.fillStyle = coatColor;
    pixelRect(-10, 6 + armSwing, 4, 10);
    pixelRect(6, 6 - armSwing, 4, 10);
    // Hands
    ctx.fillStyle = "#f0d0a0";
    pixelRect(-10, 14 + armSwing, 4, 3);
    pixelRect(6, 14 - armSwing, 4, 3);
    // Head
    ctx.fillStyle = "#f0d0a0";
    pixelRect(-6, -4, 12, 12);
    ctx.fillStyle = "#d8a878";
    pixelRect(-6, 4, 12, 2);
    // Hair (tousled)
    ctx.fillStyle = "#3a1c08";
    pixelRect(-7, -6, 14, 4);
    pixelRect(-7, -2, 2, 4);
    // Eyes
    ctx.fillStyle = "#1a0d22";
    pixelRect(-3, -1, 2, 2);
    pixelRect(2, -1, 2, 2);
    // Mouth
    pixelRect(-1, 4, 3, 1);

    // Helmet visual on top of head
    if (p.helmetActive) {
      ctx.fillStyle = "#aac8e0";
      pixelRect(-7, -8, 14, 5);
      ctx.fillStyle = "#5db8e0";
      pixelRect(-6, -7, 12, 3);
      ctx.fillStyle = "#fff";
      pixelRect(-2, -8, 4, 1);
    }
    // Hammer overlay
    if (p.hammerT > 0) {
      ctx.save();
      ctx.translate(8, 8);
      ctx.rotate(Math.sin(state.time * 14) * 0.4);
      ctx.fillStyle = "#a87030";
      pixelRect(-1, 0, 2, 14);
      ctx.fillStyle = "#d8d8e0";
      pixelRect(-6, -4, 12, 6);
      ctx.fillStyle = "#888";
      pixelRect(-6, -2, 12, 1);
      ctx.restore();
    }
    // Springs visual (jump trail)
    if (p.springsT > 0 && p.jumping) {
      ctx.fillStyle = "rgba(245,228,81,0.5)";
      for (var s = 0; s < 3; s++) {
        pixelRect(-2 + s * 2, 28 + s * 4, 4, 2);
      }
    }
    ctx.restore();
  }

  function pixelRect(x, y, w, h) {
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawEmbers() {
    if (!state.embers) return;
    ctx.save();
    for (var i = 0; i < state.embers.length; i++) {
      var e = state.embers[i];
      var k = Math.max(0, e.life / Math.max(0.001, e.totalLife));
      ctx.globalAlpha = k;
      ctx.fillStyle = e.color;
      pixelRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
    }
    ctx.restore();
  }

  // -- HUD update -----------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = state.lives;
    if (dom.hudStage) dom.hudStage.textContent = state.stage;
    if (dom.hudFloor) dom.hudFloor.textContent = (state.player.floor + 1) + "/" + floorsForStage(state.stage);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      if (state.player.floor >= floorsForStage(state.stage) - 1) {
        dom.goalName.textContent = "Touch the Magnate's spotlight!";
      } else {
        dom.goalName.textContent = "Climb to the top floor";
      }
    }
    if (dom.goalMeta) {
      var active = [];
      if (state.player.helmetActive) active.push("HELMET");
      if (state.player.springsT > 0) active.push("SPRINGS " + state.player.springsT.toFixed(1) + "s");
      if (state.player.hammerT > 0) active.push("HAMMER " + state.player.hammerT.toFixed(1) + "s");
      if (state.player.slowT > 0) active.push("SLOW " + state.player.slowT.toFixed(1) + "s");
      dom.goalMeta.textContent = "Powerups · " + (active.length ? active.join(" · ") : "none");
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { stage: state.maxStage, stages: state.stagesCleared });
      }
    } catch (e) {}
  }
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          stage: state.stage,
          stagesCleared: state.stagesCleared,
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
          file: "games/tower-climb/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("tower-climb:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("tower-climb:best", String(Math.floor(v)));
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
        if (k === "a" || k === "A" || k === "ArrowLeft") { keys.left = true; e.preventDefault(); return; }
        if (k === "d" || k === "D" || k === "ArrowRight") { keys.right = true; e.preventDefault(); return; }
        if (k === "w" || k === "W" || k === "ArrowUp") { keys.up = true; e.preventDefault(); return; }
        if (k === "s" || k === "S" || k === "ArrowDown") { keys.down = true; e.preventDefault(); return; }
        if (k === " " || k === "Spacebar") {
          if (!e.repeat) keys.jumpQueued = true;
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
        // tap → jump
        keys.jumpQueued = true;
      } else {
        // swipe maps to held key for ~200ms
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
    if (dom.tcJump) {
      var j = function (e) { if (e) e.preventDefault(); keys.jumpQueued = true; };
      dom.tcJump.addEventListener("click", j);
      dom.tcJump.addEventListener("touchstart", j, { passive: false });
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
      MrMacsDifficulty.register("tower-climb");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "tower-climb", { compact: false });
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
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.reset(); MrMacsEndRecap.startTracking(); } } catch (e) {}
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
      stage: s.stage || 1,
      stagesCleared: s.stagesCleared || 0,
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
    if (snap && snap.state && (snap.state.score || snap.state.stagesCleared) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Stage ' + (snap.state.stage || 1) +
        ' &middot; Stages Cleared ' + (snap.state.stagesCleared || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Tower Climb Scores</div>';
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

  // -- Powerup and ladder freshness updates ---------------------------------
  function updateFreshLadders(dt) {
    for (var i = 0; i < state.ladders.length; i++) {
      var L = state.ladders[i];
      if (L.fresh && L.fresh > 0) L.fresh = Math.max(0, L.fresh - dt);
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
      updatePlayer(dt);
      updateBarrels(dt);
      updateTomes(dt);
      updatePowerupBubbles(dt);
      updateFreshLadders(dt);
      spawnBarrelMaybe(dt);
      checkCollisions();
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
    if (phase === "playing" || phase === "dying" || phase === "stageClear" || phase === "paused") {
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

  try {
    if (window.MrMacsA11yQuickToggle) {
      var hudControls = document.querySelector(".hud-controls") || document.querySelector(".top-hud");
      if (hudControls) MrMacsA11yQuickToggle.mount(hudControls);
    }
  } catch (e) {}

  // ── Help overlay ───────────────────────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      MrMacsHelpOverlay.register("tower-climb", {
        title: "How to Play Tower Climb",
        goal: "Climb a five-floor archive tower of angled girders and ladders, dodging rumor barrels, to topple the Misconception Magnate.",
        controls: [
          { key: "← / →  or  A / D", action: "Walk left / right" },
          { key: "Space  or  Up / W", action: "Jump" },
          { key: "Esc / P", action: "Pause" }
        ],
        tips: [
          "Jump over rolling barrels for +100 points each — timing the leap at the last moment is safest.",
          "Ladders let you move between girder floors — climb quickly before the next barrel wave.",
          "Gilt-rim scholar tomes give +200; snag them when the path is clear.",
          "Power-ups (helmet, springs, hammer, slow-time, ladder) appear mid-climb — helmet absorbs one barrel hit.",
          "The Magnate teleports to the next tower after each defeat — every floor gets harder."
        ],
        scholar: "Rare gilt-rim scholar tomes appear on girder platforms. Grabbing one sparks a review prompt worth +1500 points and 12 bonus shards — the game pauses while the prompt is open."
      });
      var setupActions = document.querySelector("#setupScreen .setup-actions");
      if (setupActions) MrMacsHelpOverlay.mountButton(setupActions, "tower-climb");
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "tower-climb";
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
