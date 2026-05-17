/* ===========================================================================
   Centiquill — Centipede vertical shooter · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x800 logical · 18 cols x 24 rows x 40px grid
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "centiquill";
  var GAME_TITLE = "Centiquill";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 800;

  // Grid
  var COLS = 18;
  var ROWS = 24;
  var CELL = 40;

  // Player zone: bottom 6 rows (rows 18..23)
  var PLAYER_TOP_ROW = 18;
  var PLAYER_BOTTOM_ROW = ROWS - 1;

  // Player physics
  var PLAYER_SPEED = 280;          // px/sec
  var PLAYER_W = 28;
  var PLAYER_H = 28;
  var BULLET_SPEED = 620;          // px/sec
  var BULLET_W = 4;
  var BULLET_H = 14;
  var SHOOT_COOLDOWN_MS = 200;
  var RAPID_COOLDOWN_MS = 100;

  // Mushrooms (ink-pots)
  var INK_POT_INITIAL = 30;
  var INK_POT_HP = 4;

  // Centipede
  var CENTI_BASE_LEN = 10;
  var CENTI_LEN_PER_LEVEL = 1;
  var CENTI_MAX_LEN = 16;
  var CENTI_BASE_SPEED = 120;       // px/sec at level 1
  var CENTI_SPEED_PER_LEVEL = 18;
  var CENTI_SEG_SIZE = 28;

  // Other enemies
  var SPIDER_BASE_INTERVAL = 14.0;  // seconds between spawns at L1
  var FLEA_BASE_INTERVAL   = 22.0;
  var SCARAB_BASE_INTERVAL = 28.0;
  var SPIDER_HP = 3;
  var FLEA_HP = 1;
  var SCARAB_HP = 2;

  // Scoring
  var SCORE_SEGMENT = 100;
  var SCORE_HEAD    = 200;
  var SCORE_SPIDER  = 300;
  var SCORE_FLEA    = 500;
  var SCORE_SCARAB  = 600;

  // Stage / lives
  var LIVES_INIT = 3;
  var BONUS_LIFE_THRESHOLD = 12000;
  var SHARDS_CAP = 200;

  // Power-ups
  var POWERUP_DROP_RATE = 0.05;
  var POWERUP_INV_CAP = 3;
  var POWERUP_DUR_SPREAD = 12.0;
  var POWERUP_DUR_RAPID = 12.0;
  var POWERUP_MULT_KILLS = 5;        // 2x for next 5 kills

  // Scholar inkblot reward
  var SCHOLAR_HP = 4;
  var SCHOLAR_BONUS = 1500;
  var SCHOLAR_SHARDS = 12;

  // Visual / audio polish
  var DEATH_DELAY_MS = 1400;

  // -- Inline review bank (28 entries · grade 8 → AP) -----------------------
  var INLINE_BANK = [
    // Grade 8 / NYS Civics
    { prompt: "The Bill of Rights refers to:", choices: ["The first ten amendments to the Constitution", "The Declaration of Independence", "The Articles of Confederation", "The Federalist Papers"], correctText: "The first ten amendments to the Constitution" },
    { prompt: "The Emancipation Proclamation (1863) declared:", choices: ["Slaves in Confederate states free", "All slaves free immediately", "An end to the Civil War", "Equal rights for women"], correctText: "Slaves in Confederate states free" },
    { prompt: "The principle of judicial review was established in:", choices: ["Marbury v. Madison (1803)", "McCulloch v. Maryland (1819)", "Dred Scott v. Sandford (1857)", "Plessy v. Ferguson (1896)"], correctText: "Marbury v. Madison (1803)" },
    { prompt: "The 'Trail of Tears' refers to the forced relocation of:", choices: ["Cherokee and other Southeast tribes", "Sioux of the Plains", "Navajo of the Southwest", "Inuit of Alaska"], correctText: "Cherokee and other Southeast tribes" },
    // Global / World History
    { prompt: "The Mongol Empire's most lasting impact on Eurasia was:", choices: ["Opening trade routes (Pax Mongolica)", "Spread of Buddhism", "Conquest of Western Europe", "Ending the Silk Road"], correctText: "Opening trade routes (Pax Mongolica)" },
    { prompt: "The Columbian Exchange most directly led to:", choices: ["Global transfer of crops and diseases", "European industrial revolution", "Decline of Asian trade", "End of the slave trade"], correctText: "Global transfer of crops and diseases" },
    { prompt: "The Meiji Restoration (1868) is best characterized by:", choices: ["Rapid Japanese modernization", "End of Japanese isolation only", "Restoration of feudal lords", "Defeat of the samurai"], correctText: "Rapid Japanese modernization" },
    { prompt: "The Treaty of Versailles (1919) is criticized for:", choices: ["Punishing Germany too harshly", "Creating the League of Nations", "Returning Alsace-Lorraine", "Ending colonialism"], correctText: "Punishing Germany too harshly" },
    { prompt: "Apartheid in South Africa primarily enforced:", choices: ["Racial segregation by law", "Religious uniformity", "Economic socialism", "Tribal monarchy"], correctText: "Racial segregation by law" },
    // U.S. History
    { prompt: "The Louisiana Purchase (1803):", choices: ["Doubled the size of the U.S.", "Annexed Texas", "Ended the War of 1812", "Founded the Oregon Trail"], correctText: "Doubled the size of the U.S." },
    { prompt: "The 14th Amendment (1868) most importantly:", choices: ["Granted citizenship and equal protection", "Banned alcohol", "Extended voting to women", "Ended segregation"], correctText: "Granted citizenship and equal protection" },
    { prompt: "FDR's 'court-packing' plan was a response to:", choices: ["Supreme Court striking down New Deal laws", "Wartime emergency", "Pearl Harbor", "The Dust Bowl"], correctText: "Supreme Court striking down New Deal laws" },
    { prompt: "The Truman Doctrine (1947) committed the U.S. to:", choices: ["Containing the spread of communism", "Disarmament", "Free trade in Asia", "European political union"], correctText: "Containing the spread of communism" },
    // AP World / Themes
    { prompt: "The 'Pax Romana' refers to:", choices: ["Roman peace and prosperity ~27 BCE-180 CE", "Roman defeat of Carthage", "Spread of Christianity", "Fall of the western empire"], correctText: "Roman peace and prosperity ~27 BCE-180 CE" },
    { prompt: "Confucian ideals most emphasize:", choices: ["Hierarchical social harmony", "Individual rights", "Religious purity", "Military conquest"], correctText: "Hierarchical social harmony" },
    { prompt: "The fall of Constantinople (1453) most accelerated:", choices: ["European search for sea routes to Asia", "The First Crusade", "Mongol expansion", "The Renaissance papacy"], correctText: "European search for sea routes to Asia" },
    // AP US Gov / AP US History
    { prompt: "Federalist No. 10 argues that a large republic best:", choices: ["Controls the effects of factions", "Eliminates political parties", "Prevents states from acting", "Concentrates power in Congress"], correctText: "Controls the effects of factions" },
    { prompt: "The 'separation of powers' divides authority among:", choices: ["Legislative, executive, judicial branches", "Federal and state governments", "Congress and the President only", "Executive and the people"], correctText: "Legislative, executive, judicial branches" },
    { prompt: "Korematsu v. United States (1944) involved:", choices: ["Japanese American internment", "Free speech in wartime", "Affirmative action", "Voting rights"], correctText: "Japanese American internment" },
    { prompt: "The Gilded Age was characterized by:", choices: ["Industrial growth and political corruption", "Westward exploration only", "Rural agricultural prosperity", "Social Darwinism rejected"], correctText: "Industrial growth and political corruption" },
    // AP Euro
    { prompt: "Martin Luther's primary objection in his 95 Theses was to:", choices: ["The sale of indulgences", "Papal infallibility", "The Latin Mass", "Marriage of clergy"], correctText: "The sale of indulgences" },
    { prompt: "The Glorious Revolution (1688) resulted in:", choices: ["Constitutional monarchy in England", "Restoration of Catholicism", "Absolute monarchy", "End of Parliament"], correctText: "Constitutional monarchy in England" },
    { prompt: "The Enlightenment most directly influenced:", choices: ["The American and French Revolutions", "The Reformation", "The Crusades", "The Industrial Revolution alone"], correctText: "The American and French Revolutions" },
    // AP Econ / Geography
    { prompt: "Comparative advantage explains why nations should:", choices: ["Specialize and trade", "Produce everything domestically", "Avoid international trade", "Subsidize all industries"], correctText: "Specialize and trade" },
    { prompt: "A trade deficit means a country:", choices: ["Imports more than it exports", "Exports more than it imports", "Has high inflation", "Owes the IMF"], correctText: "Imports more than it exports" },
    { prompt: "Demographic transition theory predicts that as nations develop:", choices: ["Birth and death rates fall", "Birth rates rise then fall", "Death rates rise", "Population always grows"], correctText: "Birth and death rates fall" },
    // AP Psych
    { prompt: "Operant conditioning was most associated with:", choices: ["B.F. Skinner", "Sigmund Freud", "Ivan Pavlov", "Albert Bandura"], correctText: "B.F. Skinner" },
    { prompt: "Confirmation bias is the tendency to:", choices: ["Seek information that supports existing beliefs", "Remember the first item in a list", "Conform to group consensus", "Overestimate one's abilities"], correctText: "Seek information that supports existing beliefs" }
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

  // Input
  var keys = {};
  var lastShootTs = 0;
  var touchFireHeld = false;

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
    shoot: function () {
      sfxTone(680, 0.05, { type: "square", volume: 0.08, endFreq: 920 });
    },
    hit_centi: function () {
      sfxTone(420, 0.06, { type: "triangle", volume: 0.12, endFreq: 280 });
      sfxNoise(0.05, { volume: 0.08, cutoff: 1100 });
    },
    hit_head: function () {
      sfxTone(320, 0.10, { type: "sawtooth", volume: 0.14, endFreq: 180 });
      sfxNoise(0.08, { volume: 0.10, cutoff: 900 });
    },
    ink_pot_break: function () {
      sfxNoise(0.14, { volume: 0.12, cutoff: 700 });
      sfxTone(220, 0.10, { type: "triangle", volume: 0.08, endFreq: 110 });
    },
    spider_die: function () {
      sfxNoise(0.18, { volume: 0.16, cutoff: 1400 });
      sfxTone(540, 0.20, { type: "square", volume: 0.12, endFreq: 200 });
    },
    flea_die: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.14, endFreq: 1320 });
      sfxNoise(0.08, { volume: 0.10, cutoff: 1800 });
    },
    scarab_die: function () {
      sfxNoise(0.22, { volume: 0.18, cutoff: 800 });
      sfxTone(180, 0.24, { type: "sawtooth", volume: 0.14, endFreq: 80 });
    },
    scholar_hit: function () {
      sfxTone(1180, 0.06, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(1480, 0.08, { type: "triangle", volume: 0.14 }); }, 50);
    },
    scholar_correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong: function () {
      sfxTone(360, 0.18, { type: "sawtooth", volume: 0.12, endFreq: 220 });
    },
    life_lost: function () {
      sfxNoise(0.4, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 50 });
    },
    level_clear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    powerup_pickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerup_use: function () {
      sfxTone(660, 0.08, { type: "square", volume: 0.14, endFreq: 1320 });
    },
    page_flip: function () {
      sfxNoise(0.34, { volume: 0.22, cutoff: 1800 });
      [220, 440, 880, 1760].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "sawtooth", volume: 0.14 }); }, i * 50);
      });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("centiCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudLevel = $("hudLevel");
    dom.hudSegments = $("hudSegments");
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
    dom.tcFire = $("tcFire");
    dom.pwrSlots = [$("pwrSlot0"), $("pwrSlot1"), $("pwrSlot2")];
  }

  // -- Helpers: grid <-> pixel ----------------------------------------------
  function cellCenter(row, col) {
    return { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
  }
  function cellTopLeft(row, col) {
    return { x: col * CELL, y: row * CELL };
  }
  function inBounds(row, col) {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
  }

  // -- Ink-pot (mushroom) ----------------------------------------------------
  function makeInkPot(row, col, opts) {
    opts = opts || {};
    return {
      row: row,
      col: col,
      hp: opts.hp != null ? opts.hp : INK_POT_HP,
      maxHp: INK_POT_HP,
      scholar: !!opts.scholar,
      hitFlash: 0,
      ripple: 0,
      shimmerPhase: Math.random() * Math.PI * 2
    };
  }
  function findInkPot(row, col) {
    for (var i = 0; i < state.inkPots.length; i++) {
      if (state.inkPots[i].row === row && state.inkPots[i].col === col) return state.inkPots[i];
    }
    return null;
  }
  function removeInkPotAt(row, col) {
    for (var i = 0; i < state.inkPots.length; i++) {
      if (state.inkPots[i].row === row && state.inkPots[i].col === col) {
        state.inkPots.splice(i, 1);
        return true;
      }
    }
    return false;
  }
  function addInkPotAt(row, col) {
    if (!inBounds(row, col)) return null;
    if (row < 1) return null; // never on row 0 (centi spawn area)
    if (row >= PLAYER_TOP_ROW) row = PLAYER_TOP_ROW - 1; // keep out of player zone
    if (findInkPot(row, col)) return null;
    var pot = makeInkPot(row, col);
    state.inkPots.push(pot);
    return pot;
  }
  function damageInkPot(pot, dmg) {
    pot.hp -= (dmg || 1);
    pot.hitFlash = 0.18;
    pot.ripple = 0.001;
    if (pot.hp <= 0) {
      var center = cellCenter(pot.row, pot.col);
      burstAt(center.x, center.y, "#5b8cc6", 12);
      sfx.ink_pot_break();
      removeInkPotAt(pot.row, pot.col);
      maybeDropPowerup(pot.row, pot.col);
      return true;
    }
    return false;
  }

  // -- Scholar inkblot -------------------------------------------------------
  function pickScholarInkPot() {
    if (!state.inkPots.length) return null;
    // Prefer middle-range ink-pots (row 6..15) for visibility
    var mids = state.inkPots.filter(function (p) { return p.row >= 6 && p.row <= 15 && !p.scholar; });
    var pool = mids.length ? mids : state.inkPots.slice();
    var pick = pool[Math.floor(Math.random() * pool.length)];
    pick.scholar = true;
    pick.hp = SCHOLAR_HP;
    pick.maxHp = SCHOLAR_HP;
    return pick;
  }

  // -- Centiquill ------------------------------------------------------------
  // A centiquill is a chain. Each segment has a (row, col) target and a (px, py) world position
  // the head moves toward target; tail follows on segment cooldown.
  // For Centipede behavior: head hops between adjacent cells horizontally; on edge or block, it drops down a row and reverses.
  function makeCentiquill(level, opts) {
    opts = opts || {};
    var len = opts.length != null ? opts.length : Math.min(CENTI_MAX_LEN, CENTI_BASE_LEN + (level - 1) * CENTI_LEN_PER_LEVEL);
    var startCol = opts.startCol != null ? opts.startCol : Math.floor(COLS / 2) - Math.floor(len / 2);
    var startRow = opts.startRow != null ? opts.startRow : 0;
    var dir = opts.dir != null ? opts.dir : (Math.random() < 0.5 ? 1 : -1);
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var segs = [];
    for (var i = 0; i < len; i++) {
      var col = startCol - dir * i;
      col = Math.max(0, Math.min(COLS - 1, col));
      var c = cellCenter(startRow, col);
      segs.push({
        row: startRow, col: col,
        x: c.x, y: c.y,
        targetX: c.x, targetY: c.y,
        targetRow: startRow, targetCol: col,
        letter: letters.charAt(Math.floor(Math.random() * 26)),
        wobble: Math.random() * Math.PI * 2
      });
    }
    return {
      segments: segs,
      direction: dir,             // 1 right, -1 left
      verticalDir: 1,             // 1 down, -1 up (rare; mostly down)
      speed: CENTI_BASE_SPEED + (level - 1) * CENTI_SPEED_PER_LEVEL,
      headMoveT: 0,               // 0..1 progress toward next cell
      cellTime: 0,                // accumulator
      poisoned: false             // future: poisoned ink-pot enrages
    };
  }

  // Plan next target cell for the centiquill head (and trickle it down to tail).
  function planNextHeadTarget(centi) {
    if (!centi.segments.length) return false;
    var head = centi.segments[0];
    var nextCol = head.row != null ? head.col + centi.direction : head.col;
    var nextRow = head.row;
    var blocked = false;
    if (nextCol < 0 || nextCol >= COLS) {
      blocked = true;
    } else {
      // ink-pot blocks horizontal movement → drop and reverse
      var pot = findInkPot(nextRow, nextCol);
      if (pot) blocked = true;
    }
    if (blocked) {
      nextRow = head.row + centi.verticalDir;
      // wrap back up if we hit the bottom of player zone
      if (nextRow >= ROWS - 1) {
        // If we're reaching the bottom row, bounce back up (Centipede behavior at floor)
        centi.verticalDir = -1;
        nextRow = head.row + centi.verticalDir;
      } else if (nextRow <= 0) {
        centi.verticalDir = 1;
        nextRow = head.row + centi.verticalDir;
      }
      centi.direction = -centi.direction;
      nextCol = head.col;
    }
    nextCol = Math.max(0, Math.min(COLS - 1, nextCol));
    nextRow = Math.max(0, Math.min(ROWS - 1, nextRow));
    var c = cellCenter(nextRow, nextCol);
    head.targetRow = nextRow;
    head.targetCol = nextCol;
    head.targetX = c.x;
    head.targetY = c.y;
    return true;
  }

  function updateCentipedes(dt) {
    if (!state.centiquills || !state.centiquills.length) return;
    for (var i = 0; i < state.centiquills.length; i++) {
      updateCenti(state.centiquills[i], dt);
    }
  }

  function updateCenti(centi, dt) {
    if (!centi.segments.length) return;
    var head = centi.segments[0];
    // Move head from (x,y) toward (targetX,targetY) at speed
    if (head.targetX === head.x && head.targetY === head.y) {
      // need to plan
      planNextHeadTarget(centi);
    }
    var dx = head.targetX - head.x;
    var dy = head.targetY - head.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) {
      head.x = head.targetX;
      head.y = head.targetY;
      head.row = head.targetRow;
      head.col = head.targetCol;
      // Check ink-pot collision on landing → ricochet down one row
      var pot = findInkPot(head.row, head.col);
      if (pot) {
        // shouldn't happen unless flea added one; ricochet down
        centi.verticalDir = 1;
        // immediate plan next
      }
      planNextHeadTarget(centi);
    } else {
      var step = centi.speed * dt;
      if (step >= dist) {
        head.x = head.targetX;
        head.y = head.targetY;
        head.row = head.targetRow;
        head.col = head.targetCol;
        planNextHeadTarget(centi);
      } else {
        head.x += dx / dist * step;
        head.y += dy / dist * step;
      }
    }
    // Tail follows: each segment trails the previous by ~CENTI_SEG_SIZE
    for (var s = 1; s < centi.segments.length; s++) {
      var prev = centi.segments[s - 1];
      var seg = centi.segments[s];
      var ddx = prev.x - seg.x;
      var ddy = prev.y - seg.y;
      var d = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d > CENTI_SEG_SIZE) {
        var move = (d - CENTI_SEG_SIZE) * Math.min(1, dt * 14);
        seg.x += ddx / d * move;
        seg.y += ddy / d * move;
        // Update grid pos to nearest
        seg.row = Math.max(0, Math.min(ROWS - 1, Math.floor(seg.y / CELL)));
        seg.col = Math.max(0, Math.min(COLS - 1, Math.floor(seg.x / CELL)));
      }
      seg.wobble += dt * 4;
    }
    head.wobble += dt * 4;
  }

  // Centiquill segment hit — split or shorten.
  function hitCentiSegment(centi, segIndex) {
    var seg = centi.segments[segIndex];
    if (!seg) return null;
    var center = { x: seg.x, y: seg.y };
    // place ink-pot at hit location
    addInkPotAt(seg.row, seg.col);
    if (segIndex === 0) {
      // Hit head → remove head; segment 1 becomes new head
      centi.segments.shift();
      sfx.hit_head();
      state.score += SCORE_HEAD * scoreMult();
      decKills();
      pushPopup("+" + (SCORE_HEAD * scoreMult()), center.x, center.y - 18, "is-score");
      burstAt(center.x, center.y, "#a991ff", 14);
      // If still segments, ensure new head has a fresh target
      if (centi.segments.length) {
        planNextHeadTarget(centi);
      }
    } else {
      // Hit body → split: segments [0..segIndex-1] stays as 'centi'; new centiquill from [segIndex+1..]
      var tailSegs = centi.segments.splice(segIndex);
      // remove the hit segment itself (it was tailSegs[0])
      var hitSeg = tailSegs.shift();
      sfx.hit_centi();
      state.score += SCORE_SEGMENT * scoreMult();
      decKills();
      pushPopup("+" + (SCORE_SEGMENT * scoreMult()), center.x, center.y - 18, "is-score");
      burstAt(center.x, center.y, "#a991ff", 10);
      // If tailSegs has any segments, spawn a new centiquill from them
      if (tailSegs.length) {
        var newCenti = {
          segments: tailSegs,
          direction: -centi.direction,
          verticalDir: centi.verticalDir,
          speed: centi.speed,
          headMoveT: 0,
          cellTime: 0,
          poisoned: false
        };
        // Plan target for new centiquill head
        planNextHeadTarget(newCenti);
        state.centiquills.push(newCenti);
      }
      // The ORIGINAL centi keeps its current direction; head still has its target
    }
    return seg;
  }

  // -- Other enemies ---------------------------------------------------------
  // spider — zigzags in player zone, eats ink-pots
  function spawnSpider() {
    var side = Math.random() < 0.5 ? "left" : "right";
    var startCol = side === "left" ? 0 : COLS - 1;
    var startRow = PLAYER_TOP_ROW + 1 + Math.floor(Math.random() * 4);
    var c = cellCenter(startRow, startCol);
    state.enemies.push({
      type: "spider",
      x: c.x,
      y: c.y,
      vx: (side === "left" ? 1 : -1) * (90 + state.level * 10),
      vy: (Math.random() < 0.5 ? -1 : 1) * 80,
      hp: SPIDER_HP,
      maxHp: SPIDER_HP,
      eatT: 0,
      bounceT: 0
    });
  }

  function spawnFlea() {
    var col = 1 + Math.floor(Math.random() * (COLS - 2));
    var c = cellCenter(0, col);
    state.enemies.push({
      type: "flea",
      x: c.x,
      y: -CELL / 2,
      vx: 0,
      vy: 180 + state.level * 14,
      hp: FLEA_HP,
      maxHp: FLEA_HP,
      plantT: 0.8,                  // seconds until next ink-pot plant
      lastPlantedRow: -1
    });
  }

  function spawnScarab() {
    var side = Math.random() < 0.5 ? "left" : "right";
    var startCol = side === "left" ? -1 : COLS;
    var c = cellCenter(ROWS - 1, Math.max(0, Math.min(COLS - 1, startCol)));
    state.enemies.push({
      type: "scarab",
      x: side === "left" ? -20 : LOGICAL_W + 20,
      y: c.y - 4,
      vx: (side === "left" ? 1 : -1) * (220 + state.level * 12),
      vy: 0,
      hp: SCARAB_HP,
      maxHp: SCARAB_HP
    });
  }

  function updateEnemies(dt) {
    for (var i = state.enemies.length - 1; i >= 0; i--) {
      var e = state.enemies[i];
      if (e.dying) {
        e.dyingT = (e.dyingT || 0) + dt * 3;
        if (e.dyingT > 1) state.enemies.splice(i, 1);
        continue;
      }
      if (e.type === "spider") updateSpider(e, dt);
      else if (e.type === "flea") updateFlea(e, dt);
      else if (e.type === "scarab") updateScarab(e, dt);
    }
  }

  function updateSpider(e, dt) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.bounceT += dt;
    if (e.bounceT > 0.6 + Math.random() * 0.4) {
      e.bounceT = 0;
      e.vy = -e.vy;
    }
    var minY = (PLAYER_TOP_ROW) * CELL + CELL / 2;
    var maxY = (ROWS - 1) * CELL + CELL / 2;
    if (e.y < minY) { e.y = minY; e.vy = Math.abs(e.vy); }
    if (e.y > maxY) { e.y = maxY; e.vy = -Math.abs(e.vy); }
    if (e.x < -20 || e.x > LOGICAL_W + 20) {
      e.dying = true;  e.dyingT = 0;
    }
    // Eat ink-pots in player zone
    e.eatT -= dt;
    if (e.eatT <= 0) {
      e.eatT = 0.18;
      var row = Math.floor(e.y / CELL);
      var col = Math.floor(e.x / CELL);
      var pot = findInkPot(row, col);
      if (pot) {
        removeInkPotAt(row, col);
        burstAt(e.x, e.y, "#5b8cc6", 6);
      }
    }
  }
  function updateFlea(e, dt) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.plantT -= dt;
    if (e.plantT <= 0) {
      e.plantT = 0.18;
      var row = Math.floor(e.y / CELL);
      var col = Math.floor(e.x / CELL);
      if (row !== e.lastPlantedRow && row > 0 && row < PLAYER_TOP_ROW + 3) {
        addInkPotAt(row, col);
        e.lastPlantedRow = row;
      }
    }
    if (e.y > LOGICAL_H + 20) { e.dying = true; e.dyingT = 0; }
  }
  function updateScarab(e, dt) {
    e.x += e.vx * dt;
    if (e.x < -40 || e.x > LOGICAL_W + 40) {
      e.dying = true; e.dyingT = 0;
    }
  }

  // -- Powerups --------------------------------------------------------------
  // Drops at ink-pot location; floats down slightly until picked up.
  var POWERUP_TYPES = ["spread", "rapid", "shield", "mult", "flip"];
  var POWERUP_META = {
    spread: { glyph: "🔫", color: "#5de0f0", glow: "#5de0f0", label: "SPREAD", className: "is-spread" },
    rapid:  { glyph: "⚡",  color: "#f5c451", glow: "#f5c451", label: "RAPID",  className: "is-rapid" },
    shield: { glyph: "🛡",  color: "#a991ff", glow: "#a991ff", label: "SHIELD", className: "is-shield" },
    mult:   { glyph: "⭐",  color: "#f07bb8", glow: "#f07bb8", label: "x2",     className: "is-mult" },
    flip:   { glyph: "💥",  color: "#d04848", glow: "#d04848", label: "FLIP",   className: "is-flip" }
  };

  function maybeDropPowerup(row, col) {
    if (Math.random() >= POWERUP_DROP_RATE) return;
    var type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    var c = cellCenter(row, col);
    state.fallingPowerups.push({
      type: type,
      x: c.x, y: c.y,
      vy: 60,
      bob: 0,
      life: 8.0
    });
  }

  function updateFallingPowerups(dt) {
    for (var i = state.fallingPowerups.length - 1; i >= 0; i--) {
      var p = state.fallingPowerups[i];
      p.y += p.vy * dt;
      p.bob += dt * 4;
      p.life -= dt;
      // Pickup by player overlap (in player zone)
      var pl = state.player;
      if (Math.abs(pl.x - p.x) < 22 && Math.abs(pl.y - p.y) < 22) {
        // Add to inventory if room; else discard
        if (state.inventory.length < POWERUP_INV_CAP) {
          state.inventory.push(p.type);
          sfx.powerup_pickup();
          var meta = POWERUP_META[p.type];
          pushPopup(meta.label + " ready", pl.x, pl.y - 30, "is-bonus");
        }
        state.fallingPowerups.splice(i, 1);
        renderInventory();
        continue;
      }
      if (p.life <= 0 || p.y > LOGICAL_H + 30) {
        state.fallingPowerups.splice(i, 1);
      }
    }
  }

  function activatePowerup(slotIdx) {
    if (slotIdx < 0 || slotIdx >= state.inventory.length) return;
    var type = state.inventory[slotIdx];
    state.inventory.splice(slotIdx, 1);
    sfx.powerup_use();
    var meta = POWERUP_META[type];
    pushPopup(meta.label + "!", state.player.x, state.player.y - 36, "is-bonus");
    if (type === "spread") {
      state.spreadT = POWERUP_DUR_SPREAD;
    } else if (type === "rapid") {
      state.rapidT = POWERUP_DUR_RAPID;
    } else if (type === "shield") {
      state.shieldActive = true;
    } else if (type === "mult") {
      state.multKills = POWERUP_MULT_KILLS;
    } else if (type === "flip") {
      pageFlip();
    }
    renderInventory();
  }

  function pageFlip() {
    try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("centiquill", "centiquill-page-flip"); } catch (e) {}
    sfx.page_flip();
    addShake(14, 0.55);
    var bonus = 0;
    // Clear all ink-pots
    var potCount = state.inkPots.length;
    for (var i = state.inkPots.length - 1; i >= 0; i--) {
      var pot = state.inkPots[i];
      var c = cellCenter(pot.row, pot.col);
      burstAt(c.x, c.y, pot.scholar ? "#f5c451" : "#5b8cc6", 8);
      state.inkPots.splice(i, 1);
      bonus += 50;
    }
    // Scholar may need to be re-picked
    state._scholarMissing = true;
    // Clear all enemies (including centi segments)
    for (var j = state.enemies.length - 1; j >= 0; j--) {
      var e = state.enemies[j];
      var ec = { x: e.x, y: e.y };
      e.dying = true; e.dyingT = 0;
      bonus += 50;
      burstAt(ec.x, ec.y, "#d04848", 12);
    }
    var totalCentiSegs = 0;
    for (var k = 0; k < state.centiquills.length; k++) {
      var cq = state.centiquills[k];
      for (var m = 0; m < cq.segments.length; m++) {
        var s = cq.segments[m];
        burstAt(s.x, s.y, "#a991ff", 8);
        bonus += 50;
        totalCentiSegs++;
      }
      cq.segments = [];
    }
    state.centiquills = [];
    state.score += bonus;
    pushPopup("PAGE FLIP +" + bonus, LOGICAL_W / 2, LOGICAL_H / 2, "is-tetris");
    if (window.MrMacsCelebration && !reducedMotion) {
      try { window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#a991ff", "#5de0f0"] }); } catch (e) {}
    }
    // Trigger level clear since centiquills are cleared
    setTimeout(function () {
      if (phase === "playing" && state.centiquills.length === 0) onLevelClear();
    }, 600);
  }

  function scoreMult() {
    return state.multKills > 0 ? 2 : 1;
  }
  function decKills() {
    if (state.multKills > 0) state.multKills--;
  }

  // -- Bullets ---------------------------------------------------------------
  function tryShoot() {
    if (phase !== "playing") return;
    var now = performance.now();
    var cd = state.rapidT > 0 ? RAPID_COOLDOWN_MS : SHOOT_COOLDOWN_MS;
    if (now - lastShootTs < cd) return;
    lastShootTs = now;
    sfx.shoot();
    var p = state.player;
    if (state.spreadT > 0) {
      // 3-bullet fan
      state.bullets.push({ x: p.x, y: p.y - PLAYER_H / 2, vx: 0,    vy: -BULLET_SPEED, life: 2 });
      state.bullets.push({ x: p.x - 6, y: p.y - PLAYER_H / 2, vx: -120, vy: -BULLET_SPEED, life: 2 });
      state.bullets.push({ x: p.x + 6, y: p.y - PLAYER_H / 2, vx:  120, vy: -BULLET_SPEED, life: 2 });
    } else {
      state.bullets.push({ x: p.x, y: p.y - PLAYER_H / 2, vx: 0, vy: -BULLET_SPEED, life: 2 });
    }
  }

  function updateBullets(dt) {
    for (var i = state.bullets.length - 1; i >= 0; i--) {
      var b = state.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < -10 || b.x < -10 || b.x > LOGICAL_W + 10) {
        state.bullets.splice(i, 1);
        continue;
      }
      // Hit ink-pot first (ink-pots block bullets)
      var hitRow = Math.floor(b.y / CELL);
      var hitCol = Math.floor(b.x / CELL);
      var pot = findInkPot(hitRow, hitCol);
      if (pot) {
        if (pot.scholar) {
          // Scholar hit: animate, decrement HP
          pot.hp -= 1;
          pot.hitFlash = 0.18;
          pot.ripple = 0.001;
          sfx.scholar_hit();
          state.bullets.splice(i, 1);
          if (pot.hp <= 0) {
            // Trigger scholar review
            removeInkPotAt(pot.row, pot.col);
            state._scholarMissing = true;
            triggerScholar(pot);
          }
        } else {
          if (damageInkPot(pot, 1)) {
            // pot destroyed
          }
          state.bullets.splice(i, 1);
        }
        continue;
      }
      // Hit centi segment?
      var hitFound = false;
      outer: for (var c = 0; c < state.centiquills.length; c++) {
        var centi = state.centiquills[c];
        for (var s = 0; s < centi.segments.length; s++) {
          var seg = centi.segments[s];
          var ddx = b.x - seg.x;
          var ddy = b.y - seg.y;
          var rsq = ddx * ddx + ddy * ddy;
          var R = CENTI_SEG_SIZE * 0.5 + 4;
          if (rsq <= R * R) {
            hitCentiSegment(centi, s);
            // remove empty centi
            if (!centi.segments.length) {
              state.centiquills.splice(c, 1);
            }
            state.bullets.splice(i, 1);
            hitFound = true;
            break outer;
          }
        }
      }
      if (hitFound) continue;
      // Hit other enemies?
      var enemyHit = false;
      for (var ei = 0; ei < state.enemies.length; ei++) {
        var en = state.enemies[ei];
        if (en.dying) continue;
        var dx = b.x - en.x;
        var dy = b.y - en.y;
        var R2 = en.type === "scarab" ? 18 : 16;
        if (dx * dx + dy * dy <= R2 * R2) {
          en.hp -= 1;
          burstAt(en.x, en.y, en.type === "spider" ? "#4dd49b" : en.type === "flea" ? "#5de0f0" : "#f07bb8", 6);
          if (en.hp <= 0) {
            en.dying = true; en.dyingT = 0;
            var pts = en.type === "spider" ? SCORE_SPIDER : en.type === "flea" ? SCORE_FLEA : SCORE_SCARAB;
            pts *= scoreMult();
            decKills();
            state.score += pts;
            pushPopup("+" + pts, en.x, en.y - 18, "is-score");
            if (en.type === "spider") sfx.spider_die();
            else if (en.type === "flea") sfx.flea_die();
            else sfx.scarab_die();
          } else {
            sfx.hit_centi();
          }
          state.bullets.splice(i, 1);
          enemyHit = true;
          break;
        }
      }
      if (enemyHit) continue;
      // off the top? despawn
      if (b.y < 0) state.bullets.splice(i, 1);
    }
  }

  // -- Scholar trigger -------------------------------------------------------
  function triggerScholar(scholarPot) {
    activeQuestion = pickQuestion();
    pendingScholarPot = scholarPot;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Inkblot · Optional · +1500 + 12 shards";
    if (dom.questionCloseBtn) dom.questionCloseBtn.textContent = "Skip";
    renderQuestion();
    prevPhase = phase;
    phase = "question";
    pauseMusic();
    showScreen("question");
    sfx.scholar_hit();
    saveSnapshot();
  }

  // -- Player update ---------------------------------------------------------
  function updatePlayer(dt) {
    var p = state.player;
    if (p.dying) return;
    // Movement
    var ax = 0, ay = 0;
    if (keys["a"] || keys["arrowleft"])  ax -= 1;
    if (keys["d"] || keys["arrowright"]) ax += 1;
    if (keys["w"] || keys["arrowup"])    ay -= 1;
    if (keys["s"] || keys["arrowdown"])  ay += 1;
    if (ax || ay) {
      var mag = Math.sqrt(ax * ax + ay * ay);
      ax /= mag; ay /= mag;
      p.x += ax * PLAYER_SPEED * dt;
      p.y += ay * PLAYER_SPEED * dt;
    }
    // Touch-held directional
    if (state.touchMove) {
      var tm = state.touchMove;
      p.x += tm.x * PLAYER_SPEED * dt;
      p.y += tm.y * PLAYER_SPEED * dt;
    }
    // Constrain to player zone
    var minX = PLAYER_W / 2 + 4;
    var maxX = LOGICAL_W - PLAYER_W / 2 - 4;
    var minY = PLAYER_TOP_ROW * CELL + PLAYER_H / 2;
    var maxY = LOGICAL_H - PLAYER_H / 2 - 6;
    if (p.x < minX) p.x = minX;
    if (p.x > maxX) p.x = maxX;
    if (p.y < minY) p.y = minY;
    if (p.y > maxY) p.y = maxY;
    // Auto-fire on space hold or touch-hold
    if (keys[" "] || touchFireHeld) tryShoot();
    // Powerup timers
    if (state.spreadT > 0) state.spreadT = Math.max(0, state.spreadT - dt);
    if (state.rapidT > 0) state.rapidT = Math.max(0, state.rapidT - dt);
    // Collision with enemies + segments
    if (!p.invuln || p.invuln <= 0) {
      var killed = false;
      // Centi segments
      outer2: for (var c = 0; c < state.centiquills.length; c++) {
        var centi = state.centiquills[c];
        for (var s = 0; s < centi.segments.length; s++) {
          var seg = centi.segments[s];
          var dx = p.x - seg.x, dy = p.y - seg.y;
          var R = (PLAYER_W * 0.4) + (CENTI_SEG_SIZE * 0.4);
          if (dx * dx + dy * dy <= R * R) {
            playerHit();
            killed = true; break outer2;
          }
        }
      }
      if (!killed) {
        for (var ei = 0; ei < state.enemies.length; ei++) {
          var en = state.enemies[ei];
          if (en.dying) continue;
          var ddx = p.x - en.x, ddy = p.y - en.y;
          var R3 = en.type === "scarab" ? (PLAYER_W * 0.4 + 16) : (PLAYER_W * 0.4 + 14);
          if (ddx * ddx + ddy * ddy <= R3 * R3) {
            playerHit();
            break;
          }
        }
      }
    } else {
      p.invuln = Math.max(0, p.invuln - dt);
    }
  }

  function playerHit() {
    var p = state.player;
    if (state.shieldActive) {
      state.shieldActive = false;
      addShake(8, 0.3);
      burstAt(p.x, p.y, "#a991ff", 18);
      pushPopup("SHIELD", p.x, p.y - 30, "is-bonus");
      sfx.powerup_use();
      p.invuln = 1.4;
      return;
    }
    if (p.invuln > 0) return;
    state.lives--;
    sfx.life_lost();
    addShake(10, 0.5);
    p.dying = true;
    p.dyingT = 0;
    burstAt(p.x, p.y, "#f5c451", 24);
    if (state.lives <= 0) {
      phase = "dying";
      setTimeout(gameOver, 900);
    } else {
      phase = "dying";
      setTimeout(function () {
        respawnPlayer();
        phase = "playing";
      }, DEATH_DELAY_MS);
    }
  }
  function respawnPlayer() {
    state.player = makePlayer();
    state.player.invuln = 1.6;
  }

  // -- Player factory --------------------------------------------------------
  function makePlayer() {
    return {
      x: LOGICAL_W / 2,
      y: (ROWS - 2) * CELL + CELL / 2,
      dying: false,
      dyingT: 0,
      invuln: 0
    };
  }

  // -- Stage / level clear ---------------------------------------------------
  function onLevelClear() {
    if (phase === "levelClear") return;
    if (state.level >= 5) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("centiquill", "centiquill-stage-5"); } catch (e) {}
    }
    sfx.level_clear();
    addShake(6, 0.5);
    var bonus = 1000 + state.level * 500 + state.lives * 800;
    state.score += bonus;
    state.lives++;
    pushPopup("STAGE CLEAR!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopup("+" + bonus + " · +1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 32, palette: ["#f5c451", "#a991ff", "#5de0f0"] });
      }
    } catch (e) {}
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
        spidersKilled: state.spidersKilled,
        fleasKilled: state.fleasKilled,
        scarabsKilled: state.scarabsKilled,
        bestRunSegments: state.bestRunSegments,
        best: state.best,
        inventory: state.inventory.slice(),
        spreadT: state.spreadT,
        rapidT: state.rapidT,
        shieldActive: state.shieldActive,
        multKills: state.multKills
      };
      initState(carry);
      // carry-over old ink-pots from previous level → keep field
      phase = "playing";
    }, 1500);
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var level = opts.level || 1;
    state = {
      level: level,
      maxLevel: opts.maxLevel || level,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      best: opts.best || readBest(),
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      spidersKilled: opts.spidersKilled || 0,
      fleasKilled: opts.fleasKilled || 0,
      scarabsKilled: opts.scarabsKilled || 0,
      bestRunSegments: opts.bestRunSegments || 0,
      inkPots: [],
      centiquills: [],
      bullets: [],
      enemies: [],
      fallingPowerups: [],
      inventory: opts.inventory || [],
      spreadT: opts.spreadT || 0,
      rapidT: opts.rapidT || 0,
      shieldActive: opts.shieldActive || false,
      multKills: opts.multKills || 0,
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      bgStars: opts.bgStars || generateStars(),
      time: 0,
      spiderTimer: SPIDER_BASE_INTERVAL * 0.6,
      fleaTimer: FLEA_BASE_INTERVAL * 0.8,
      scarabTimer: SCARAB_BASE_INTERVAL,
      player: makePlayer(),
      touchMove: null,
      _scholarMissing: false,
      endReason: ""
    };
    // Build ink-pot field
    seedInkPots(level);
    // Build centiquill
    var len = Math.min(CENTI_MAX_LEN, CENTI_BASE_LEN + (level - 1) * CENTI_LEN_PER_LEVEL);
    state.centiquills.push(makeCentiquill(level, { length: len, startCol: Math.floor(COLS / 2) - Math.floor(len / 2), startRow: 0 }));
    planNextHeadTarget(state.centiquills[0]);
    // Pick scholar inkblot
    pickScholarInkPot();
    // Render inventory
    if (dom.pwrSlots) renderInventory();
  }

  function seedInkPots(level) {
    state.inkPots = [];
    var target = INK_POT_INITIAL + Math.floor((level - 1) * 2);
    var attempts = 0;
    while (state.inkPots.length < target && attempts < target * 6) {
      attempts++;
      var row = 1 + Math.floor(Math.random() * (PLAYER_TOP_ROW - 2));
      var col = Math.floor(Math.random() * COLS);
      if (findInkPot(row, col)) continue;
      state.inkPots.push(makeInkPot(row, col));
    }
  }

  function generateStars() {
    var stars = [];
    for (var i = 0; i < 80; i++) {
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

  // -- Spawn timers ----------------------------------------------------------
  function updateSpawns(dt) {
    state.spiderTimer -= dt;
    state.fleaTimer -= dt;
    state.scarabTimer -= dt;
    if (state.spiderTimer <= 0) {
      state.spiderTimer = Math.max(5, SPIDER_BASE_INTERVAL - state.level * 0.6);
      // limit concurrent spiders
      var nSpid = countEnemies("spider");
      if (nSpid < 2) spawnSpider();
    }
    if (state.fleaTimer <= 0) {
      state.fleaTimer = Math.max(8, FLEA_BASE_INTERVAL - state.level * 0.8);
      // Flea only spawns when ink-pot count gets low
      if (state.inkPots.length < INK_POT_INITIAL - 6 || state.level >= 3) {
        if (countEnemies("flea") < 1) spawnFlea();
      }
    }
    if (state.scarabTimer <= 0) {
      state.scarabTimer = Math.max(10, SCARAB_BASE_INTERVAL - state.level * 1.0);
      if (state.level >= 2 && countEnemies("scarab") < 1) spawnScarab();
    }
    // Refresh scholar if missing (after page-flip or scholar consumed)
    if (state._scholarMissing && state.inkPots.length > 0) {
      state._scholarMissing = false;
      pickScholarInkPot();
    }
  }
  function countEnemies(type) {
    var n = 0;
    for (var i = 0; i < state.enemies.length; i++) {
      if (!state.enemies[i].dying && state.enemies[i].type === type) n++;
    }
    return n;
  }

  // -- Centi clear check -----------------------------------------------------
  function centiquillsRemainingSegments() {
    var n = 0;
    for (var i = 0; i < state.centiquills.length; i++) {
      n += state.centiquills[i].segments.length;
    }
    return n;
  }

  // -- Particles + popups ----------------------------------------------------
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    count = count || 10;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 140;
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

  // -- Bonus life check ------------------------------------------------------
  function checkBonusLife() {
    var threshold = Math.floor(state.score / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    if (threshold > lastBonusLifeThreshold && threshold >= BONUS_LIFE_THRESHOLD) {
      lastBonusLifeThreshold = threshold;
      state.lives++;
      pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 - 80, "is-bonus");
      sfx.powerup_pickup();
    }
  }

  // -- Render ----------------------------------------------------------------
  function render() {
    if (!state) return;
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    // Apply screen shake offset
    var shakeX = state.shake.x;
    var shakeY = state.shake.y;
    // letterbox
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, w, h);
    ctx.translate(offsetX + shakeX, offsetY + shakeY);
    ctx.scale(scale, scale);
    // background
    drawBackground();
    // grid divider for player zone
    drawPlayerZoneDivider();
    // ink-pots
    drawInkPots();
    // falling powerups
    drawFallingPowerups();
    // centi
    drawCentiquills();
    // enemies
    drawEnemies();
    // bullets
    drawBullets();
    // player
    drawPlayer();
    // particles
    drawParticles();
    ctx.restore();
  }

  function drawBackground() {
    // Dark archive page gradient + stars
    var g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    g.addColorStop(0, "#0a1430");
    g.addColorStop(0.6, "#040814");
    g.addColorStop(1, "#020408");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // stars
    for (var i = 0; i < state.bgStars.length; i++) {
      var s = state.bgStars[i];
      s.twinkle += 0.02 * s.twinkleSpeed;
      var a = 0.2 + (Math.sin(s.twinkle) * 0.5 + 0.5) * 0.4;
      ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // page margin lines (left/right)
    ctx.strokeStyle = "rgba(245,196,81,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 60); ctx.lineTo(40, LOGICAL_H - 60);
    ctx.moveTo(LOGICAL_W - 40, 60); ctx.lineTo(LOGICAL_W - 40, LOGICAL_H - 60);
    ctx.stroke();
  }

  function drawPlayerZoneDivider() {
    var y = PLAYER_TOP_ROW * CELL;
    ctx.strokeStyle = "rgba(245,196,81,0.18)";
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(LOGICAL_W - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawInkPots() {
    for (var i = 0; i < state.inkPots.length; i++) {
      var pot = state.inkPots[i];
      var c = cellCenter(pot.row, pot.col);
      // damage state: 0..3 (full, cracked, shattered)
      var damageStage = pot.maxHp - pot.hp; // 0..maxHp-1
      var opacity = pot.hp / pot.maxHp;
      var size = 14 + opacity * 6;
      // Halo for scholar
      if (pot.scholar) {
        var phase2 = (state.time * 2) % (Math.PI * 2);
        var glowR = 20 + Math.sin(phase2) * 4;
        var grad = ctx.createRadialGradient(c.x, c.y, 6, c.x, c.y, glowR);
        grad.addColorStop(0, "rgba(245,196,81,0.6)");
        grad.addColorStop(1, "rgba(245,196,81,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }
      // ink-splat shape
      var color = pot.scholar ? "#f5c451" : "#5b8cc6";
      if (damageStage >= 1) color = pot.scholar ? "#c89232" : "#3d5e8a";
      if (damageStage >= 2) color = pot.scholar ? "#9a6e1a" : "#2a4368";
      if (damageStage >= 3) color = pot.scholar ? "#7a521a" : "#1f3252";
      // base ink-splat (irregular)
      ctx.save();
      if (pot.hitFlash > 0) {
        ctx.fillStyle = "#fff";
        pot.hitFlash -= 1 / 60;
      } else {
        ctx.fillStyle = color;
      }
      ctx.beginPath();
      ctx.arc(c.x, c.y, size, 0, Math.PI * 2);
      ctx.fill();
      // splat lobes
      ctx.fillStyle = color;
      var lobes = 4;
      for (var L = 0; L < lobes; L++) {
        var a = (L / lobes) * Math.PI * 2 + pot.shimmerPhase;
        var lr = size * 0.55;
        var lx = c.x + Math.cos(a) * size * 0.85;
        var ly = c.y + Math.sin(a) * size * 0.85;
        ctx.beginPath();
        ctx.arc(lx, ly, lr * (0.6 + 0.3 * Math.sin(state.time * 2 + L)), 0, Math.PI * 2);
        ctx.fill();
      }
      // cracks for damage
      if (damageStage >= 1) {
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(c.x - size * 0.6, c.y);
        ctx.lineTo(c.x + size * 0.6, c.y - size * 0.2);
        ctx.stroke();
      }
      if (damageStage >= 2) {
        ctx.beginPath();
        ctx.moveTo(c.x - size * 0.4, c.y - size * 0.5);
        ctx.lineTo(c.x + size * 0.3, c.y + size * 0.4);
        ctx.stroke();
      }
      if (damageStage >= 3) {
        ctx.beginPath();
        ctx.moveTo(c.x + size * 0.5, c.y - size * 0.3);
        ctx.lineTo(c.x - size * 0.2, c.y + size * 0.6);
        ctx.stroke();
      }
      // scholar "?" glyph
      if (pot.scholar) {
        ctx.fillStyle = "#04060f";
        ctx.font = "bold 16px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", c.x, c.y + 1);
      }
      ctx.restore();
    }
  }

  function drawCentiquills() {
    for (var i = 0; i < state.centiquills.length; i++) {
      var centi = state.centiquills[i];
      // tail to head, head drawn last
      for (var s = centi.segments.length - 1; s >= 0; s--) {
        var seg = centi.segments[s];
        var isHead = (s === 0);
        ctx.save();
        var R = CENTI_SEG_SIZE / 2 + (Math.sin(seg.wobble) * 1);
        // Body glow
        ctx.shadowColor = isHead ? "rgba(208,72,72,0.5)" : "rgba(169,145,255,0.4)";
        ctx.shadowBlur = 10;
        // Body fill
        var grad = ctx.createRadialGradient(seg.x - R * 0.3, seg.y - R * 0.3, 2, seg.x, seg.y, R);
        if (isHead) {
          grad.addColorStop(0, "#ff8a8a");
          grad.addColorStop(0.6, "#d04848");
          grad.addColorStop(1, "#5b1818");
        } else {
          grad.addColorStop(0, "#c9b6ff");
          grad.addColorStop(0.6, "#a991ff");
          grad.addColorStop(1, "#3a2868");
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, R, 0, Math.PI * 2);
        ctx.fill();
        // outline
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isHead ? "#5b1818" : "#3a2868";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        // letter glyph
        ctx.fillStyle = isHead ? "#fff" : "#fff";
        ctx.font = "bold " + Math.floor(R * 0.95) + "px 'Fraunces', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(seg.letter, seg.x, seg.y + 1);
        // head: eyes + antennae
        if (isHead) {
          ctx.fillStyle = "#fff";
          var eyeOff = 4;
          // Eyes positioned in front of motion (toward target)
          var dirSign = centi.direction;
          ctx.beginPath();
          ctx.arc(seg.x + dirSign * 5, seg.y - 3, 2.4, 0, Math.PI * 2);
          ctx.arc(seg.x + dirSign * 5, seg.y + 4, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#1a1a2a";
          ctx.beginPath();
          ctx.arc(seg.x + dirSign * 6, seg.y - 3, 1.1, 0, Math.PI * 2);
          ctx.arc(seg.x + dirSign * 6, seg.y + 4, 1.1, 0, Math.PI * 2);
          ctx.fill();
          // antennae
          ctx.strokeStyle = "rgba(255,180,200,0.85)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(seg.x, seg.y - R + 2);
          ctx.lineTo(seg.x - 4, seg.y - R - 6);
          ctx.moveTo(seg.x, seg.y - R + 2);
          ctx.lineTo(seg.x + 4, seg.y - R - 6);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  function drawEnemies() {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      var fade = e.dying ? Math.max(0, 1 - e.dyingT) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      if (e.type === "spider") drawSpider(e);
      else if (e.type === "flea") drawFlea(e);
      else if (e.type === "scarab") drawScarab(e);
      ctx.restore();
    }
  }
  function drawSpider(e) {
    // Quill-spider: 8 legs, oval body, fangs
    ctx.save();
    ctx.shadowColor = "rgba(77,212,155,0.5)";
    ctx.shadowBlur = 8;
    var bodyR = 12;
    // legs
    ctx.strokeStyle = "#4dd49b";
    ctx.lineWidth = 1.6;
    for (var L = 0; L < 8; L++) {
      var a = (L / 8) * Math.PI * 2 + Math.sin(state.time * 8 + L) * 0.18;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 14);
      ctx.stroke();
    }
    // body
    var grad = ctx.createRadialGradient(e.x - 3, e.y - 3, 2, e.x, e.y, bodyR);
    grad.addColorStop(0, "#9af2c3");
    grad.addColorStop(0.7, "#3fa676");
    grad.addColorStop(1, "#0c4732");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, bodyR + 1, bodyR - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#ffd2d2";
    ctx.beginPath();
    ctx.arc(e.x - 4, e.y - 2, 2, 0, Math.PI * 2);
    ctx.arc(e.x + 4, e.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0a0a";
    ctx.beginPath();
    ctx.arc(e.x - 4, e.y - 2, 0.9, 0, Math.PI * 2);
    ctx.arc(e.x + 4, e.y - 2, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawFlea(e) {
    // Page-flea: small bouncy creature with spotty trail
    ctx.save();
    ctx.shadowColor = "rgba(93,224,240,0.5)";
    ctx.shadowBlur = 6;
    // trail
    ctx.fillStyle = "rgba(93,224,240,0.3)";
    ctx.beginPath();
    ctx.ellipse(e.x, e.y - 8, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    var grad = ctx.createRadialGradient(e.x - 2, e.y - 2, 1, e.x, e.y, 9);
    grad.addColorStop(0, "#a8e8ff");
    grad.addColorStop(1, "#1a4868");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.strokeStyle = "#5de0f0";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(e.x - 3, e.y + 6); ctx.lineTo(e.x - 8, e.y + 11);
    ctx.moveTo(e.x + 3, e.y + 6); ctx.lineTo(e.x + 8, e.y + 11);
    ctx.stroke();
    ctx.restore();
  }
  function drawScarab(e) {
    // Misconception-scarab: armored beetle, dark red
    ctx.save();
    ctx.shadowColor = "rgba(240,123,184,0.4)";
    ctx.shadowBlur = 8;
    var bodyW = 18;
    var bodyH = 12;
    var grad = ctx.createRadialGradient(e.x, e.y - 3, 2, e.x, e.y, 14);
    grad.addColorStop(0, "#ff96c8");
    grad.addColorStop(0.6, "#c8487c");
    grad.addColorStop(1, "#4a1828");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, bodyW, bodyH, 0, 0, Math.PI * 2);
    ctx.fill();
    // armor split
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(e.x, e.y - bodyH);
    ctx.lineTo(e.x, e.y + bodyH);
    ctx.stroke();
    // legs
    var dirSign = e.vx > 0 ? 1 : -1;
    ctx.strokeStyle = "#f07bb8";
    for (var L = -1; L <= 1; L++) {
      ctx.beginPath();
      ctx.moveTo(e.x + L * 6, e.y + bodyH * 0.7);
      ctx.lineTo(e.x + L * 6 - dirSign * 4, e.y + bodyH * 1.4);
      ctx.stroke();
    }
    // eyes
    ctx.fillStyle = "#ffe080";
    ctx.beginPath();
    ctx.arc(e.x + dirSign * 12, e.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBullets() {
    ctx.save();
    for (var i = 0; i < state.bullets.length; i++) {
      var b = state.bullets[i];
      // glowing ink-pen tip
      ctx.shadowColor = "rgba(245,196,81,0.7)";
      ctx.shadowBlur = 10;
      var grad = ctx.createLinearGradient(b.x, b.y - BULLET_H / 2, b.x, b.y + BULLET_H / 2);
      grad.addColorStop(0, "#fff8c4");
      grad.addColorStop(0.5, "#f5c451");
      grad.addColorStop(1, "#a86a14");
      ctx.fillStyle = grad;
      ctx.fillRect(b.x - BULLET_W / 2, b.y - BULLET_H / 2, BULLET_W, BULLET_H);
    }
    ctx.restore();
  }

  function drawPlayer() {
    var p = state.player;
    if (!p) return;
    ctx.save();
    if (p.dying) {
      ctx.globalAlpha = 1 - p.dyingT;
    } else if (p.invuln > 0) {
      var blink = Math.floor(state.time * 14) % 2;
      ctx.globalAlpha = blink ? 0.4 : 1;
    }
    // Editor: small scholar figure with quill pen
    var x = p.x, y = p.y;
    // body
    ctx.shadowColor = "rgba(245,196,81,0.5)";
    ctx.shadowBlur = 8;
    var grad = ctx.createLinearGradient(x, y - PLAYER_H / 2, x, y + PLAYER_H / 2);
    grad.addColorStop(0, "#f5c451");
    grad.addColorStop(0.5, "#c8922a");
    grad.addColorStop(1, "#5a3e08");
    ctx.fillStyle = grad;
    ctx.beginPath();
    // robe trapezoid
    ctx.moveTo(x - PLAYER_W * 0.4, y + PLAYER_H * 0.5);
    ctx.lineTo(x + PLAYER_W * 0.4, y + PLAYER_H * 0.5);
    ctx.lineTo(x + PLAYER_W * 0.3, y - PLAYER_H * 0.1);
    ctx.lineTo(x - PLAYER_W * 0.3, y - PLAYER_H * 0.1);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.fillStyle = "#f4d8a5";
    ctx.beginPath();
    ctx.arc(x, y - PLAYER_H * 0.25, PLAYER_W * 0.22, 0, Math.PI * 2);
    ctx.fill();
    // hair / hat
    ctx.fillStyle = "#3a2210";
    ctx.beginPath();
    ctx.arc(x, y - PLAYER_H * 0.32, PLAYER_W * 0.22, Math.PI, 0);
    ctx.fill();
    // quill pen pointing up
    ctx.strokeStyle = "#fff8c4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + PLAYER_W * 0.32, y - PLAYER_H * 0.05);
    ctx.lineTo(x + PLAYER_W * 0.45, y - PLAYER_H * 0.6);
    ctx.stroke();
    ctx.fillStyle = "#fff8c4";
    ctx.beginPath();
    ctx.arc(x + PLAYER_W * 0.45, y - PLAYER_H * 0.6, 2, 0, Math.PI * 2);
    ctx.fill();
    // shield ring
    if (state.shieldActive) {
      ctx.strokeStyle = "rgba(169,145,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, PLAYER_W * 0.6 + Math.sin(state.time * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var a = Math.max(0, p.life / p.totalLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }

  function drawFallingPowerups() {
    for (var i = 0; i < state.fallingPowerups.length; i++) {
      var p = state.fallingPowerups[i];
      var meta = POWERUP_META[p.type];
      ctx.save();
      ctx.shadowColor = meta.color;
      ctx.shadowBlur = 14;
      var bob = Math.sin(p.bob) * 3;
      ctx.fillStyle = meta.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, p.x, p.y + bob);
      ctx.restore();
    }
  }

  // -- Inventory render ------------------------------------------------------
  function renderInventory() {
    if (!dom.pwrSlots) return;
    for (var i = 0; i < dom.pwrSlots.length; i++) {
      var slot = dom.pwrSlots[i];
      if (!slot) continue;
      var glyphEl = slot.querySelector(".pwr-glyph");
      slot.classList.remove("is-filled", "is-spread", "is-rapid", "is-shield", "is-mult", "is-flip");
      if (i < state.inventory.length) {
        var t = state.inventory[i];
        var meta = POWERUP_META[t];
        slot.classList.add("is-filled", meta.className);
        if (glyphEl) glyphEl.textContent = meta.glyph;
        slot.setAttribute("aria-label", "Power-up slot " + (i + 1) + " (" + (i + 1) + " key) — " + meta.label);
      } else {
        if (glyphEl) glyphEl.textContent = "·";
        slot.setAttribute("aria-label", "Power-up slot " + (i + 1) + " (" + (i + 1) + " key) — empty");
      }
    }
  }

  // -- HUD update ------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudLevel) dom.hudLevel.textContent = String(state.level);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.hudSegments) {
      var rem = centiquillsRemainingSegments();
      dom.hudSegments.textContent = String(rem);
      var cell = dom.hudSegments.parentElement;
      if (cell) cell.classList.toggle("is-warning", rem <= 3 && rem > 0);
    }
    if (dom.goalName) {
      dom.goalName.textContent = "Stage " + state.level + " · centiquill descending";
    }
    if (dom.goalMeta) {
      var bits = [];
      if (state.spreadT > 0) bits.push("Spread " + state.spreadT.toFixed(1) + "s");
      if (state.rapidT > 0) bits.push("Rapid " + state.rapidT.toFixed(1) + "s");
      if (state.shieldActive) bits.push("Shield");
      if (state.multKills > 0) bits.push("x2 (" + state.multKills + ")");
      if (bits.length === 0) bits.push("Powerups · 0 active");
      bits.push("Pots " + state.inkPots.length);
      dom.goalMeta.textContent = bits.join(" · ");
    }
  }
  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Question modal --------------------------------------------------------
  var activeQuestion = null;
  var pendingScholarPot = null;

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
      dom.explanation.textContent = "Correct! +" + SCHOLAR_BONUS + " points and " + SCHOLAR_SHARDS + " shards.";
      dom.explanation.className = "explanation is-correct";
      state.questionsAnsweredCorrect++;
      sfx.scholar_correct();
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText;
      dom.explanation.className = "explanation is-wrong";
      sfx.scholar_wrong();
    }
    state.questionsAnsweredTotal++;
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }
  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += SCHOLAR_BONUS;
      addShards(SCHOLAR_SHARDS);
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCHOLAR_BONUS + " SCHOLAR", LOGICAL_W / 2, 100, "is-bonus");
    }
    activeQuestion = null;
    pendingScholarPot = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }
  function skipQuestion() {
    activeQuestion = null;
    pendingScholarPot = null;
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
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Centiquill Defeated You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Centiquill · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Stages Cleared</div><div class="end-cell-value">' + Math.max(0, state.level - 1) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Spiders</div><div class="end-cell-value">' + state.spidersKilled + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Fleas</div><div class="end-cell-value">' + state.fleasKilled + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scarabs</div><div class="end-cell-value">' + state.scarabsKilled + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>'
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { level: state.maxLevel, segments: state.bestRunSegments });
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
  var runStartTs = 0;
  function recordPlayWithProfile() {
    runStartTs = Date.now();
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          gameId: GAME_ID,
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/centiquill/index.html",
          score: 0,
          durationMs: 0,
          level: 1
        });
      }
    } catch (e) {}
  }
  function recordRunEnd() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          gameId: GAME_ID,
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/centiquill/index.html",
          score: state.score,
          durationMs: Date.now() - runStartTs,
          level: state.maxLevel
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(GAME_ID + ":best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem(GAME_ID + ":best", String(Math.floor(v)));
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
      var k = (e.key || "").toLowerCase();
      if (e.key === " " && (phase === "playing" || phase === "paused")) e.preventDefault();
      keys[k] = true;
      if (phase === "playing") {
        if (k === "1") { activatePowerup(0); e.preventDefault(); return; }
        if (k === "2") { activatePowerup(1); e.preventDefault(); return; }
        if (k === "3") { activatePowerup(2); e.preventDefault(); return; }
        if (k === "4") { activatePowerup(3); e.preventDefault(); return; }
        if (k === "5") { activatePowerup(4); e.preventDefault(); return; }
        if (k === "p") { if (e.repeat) return; togglePause(); e.preventDefault(); return; }
      }
      if (phase === "paused" && (k === "p" || k === " ")) {
        togglePause(); e.preventDefault(); return;
      }
      if (k === "escape") {
        if (phase === "playing" || phase === "paused") togglePause();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
      }
    });
    document.addEventListener("keyup", function (e) {
      var k = (e.key || "").toLowerCase();
      keys[k] = false;
    });
    bindTouch();
    bindTouchControls();
    bindPwrSlots();
  }
  function bindPwrSlots() {
    if (!dom.pwrSlots) return;
    for (var i = 0; i < dom.pwrSlots.length; i++) {
      (function (idx) {
        var slot = dom.pwrSlots[idx];
        if (!slot) return;
        slot.addEventListener("click", function (e) {
          e.preventDefault();
          if (phase === "playing") activatePowerup(idx);
        });
      })(i);
    }
  }
  function bindTouch() {
    var touchActive = null;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        var lx = (t.clientX - rect.left - offsetX) / scale;
        var ly = (t.clientY - rect.top - offsetY) / scale;
        touchActive = { startX: lx, startY: ly, lastX: lx, lastY: ly };
      }
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (phase !== "playing" || !touchActive) return;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        var lx = (t.clientX - rect.left - offsetX) / scale;
        var ly = (t.clientY - rect.top - offsetY) / scale;
        // Compute desired direction toward touch position relative to player
        var p = state.player;
        var dx = lx - p.x;
        var dy = ly - p.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > 4) {
          state.touchMove = { x: dx / d, y: dy / d };
        } else {
          state.touchMove = null;
        }
        touchActive.lastX = lx; touchActive.lastY = ly;
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function () {
      touchActive = null;
      state.touchMove = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () {
      touchActive = null;
      state.touchMove = null;
    }, { passive: true });
  }
  function bindTouchControls() {
    var dirMap = {
      up:    { x: 0, y: -1 },
      down:  { x: 0, y: 1 },
      left:  { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };
    function setDir(btn, dirName) {
      if (!btn) return;
      var down = function (e) {
        if (e) e.preventDefault();
        var d = dirMap[dirName];
        state.touchMove = { x: d.x, y: d.y };
      };
      var up = function (e) {
        if (e) e.preventDefault();
        state.touchMove = null;
      };
      btn.addEventListener("touchstart", down, { passive: false });
      btn.addEventListener("touchend", up, { passive: false });
      btn.addEventListener("touchcancel", up, { passive: false });
      btn.addEventListener("mousedown", down);
      btn.addEventListener("mouseup", up);
      btn.addEventListener("mouseleave", up);
    }
    setDir(dom.tcUp, "up");
    setDir(dom.tcDown, "down");
    setDir(dom.tcLeft, "left");
    setDir(dom.tcRight, "right");
    if (dom.tcFire) {
      var fireDown = function (e) { if (e) e.preventDefault(); touchFireHeld = true; };
      var fireUp = function (e) { if (e) e.preventDefault(); touchFireHeld = false; };
      dom.tcFire.addEventListener("touchstart", fireDown, { passive: false });
      dom.tcFire.addEventListener("touchend", fireUp, { passive: false });
      dom.tcFire.addEventListener("touchcancel", fireUp, { passive: false });
      dom.tcFire.addEventListener("mousedown", fireDown);
      dom.tcFire.addEventListener("mouseup", fireUp);
      dom.tcFire.addEventListener("mouseleave", fireUp);
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
      MrMacsDifficulty.register("centiquill");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "centiquill", { compact: false });
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
    if (snap && snap.state && (snap.state.score || snap.state.level > 1) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Stage ' + (snap.state.level || 1) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Centiquill Scores</div>';
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
      updatePlayer(dt);
      updateBullets(dt);
      updateCentipedes(dt);
      updateEnemies(dt);
      updateSpawns(dt);
      updateFallingPowerups(dt);
      checkBonusLife();
      // Track best run segments
      var rem = centiquillsRemainingSegments();
      if (rem > state.bestRunSegments) state.bestRunSegments = rem;
      // Track per-enemy kills
      countDyingKills();
      // Stage clear: all centiquills destroyed
      if (rem === 0 && state.centiquills.length === 0) {
        // give it a tiny grace tick to let particles finish
        onLevelClear();
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
  // Track which enemies just died this frame to bump per-type kill counters
  function countDyingKills() {
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.dying && !e._counted) {
        e._counted = true;
        if (e.type === "spider") state.spidersKilled++;
        else if (e.type === "flea") state.fleasKilled++;
        else if (e.type === "scarab") state.scarabsKilled++;
      }
    }
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
    recordRunEnd();
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
      MrMacsHelpOverlay.register("centiquill", {
        title: "How to Play Centiquill",
        goal: "Shoot all segments of the descending centiquill and clear each stage while dodging spiders, fleas, and the deadly misconception-scarab.",
        controls: [
          { key: "W / A / S / D or Arrows", action: "Move the editor sprite" },
          { key: "Space", action: "Fire upward" },
          { key: "1 / 2 / 3", action: "Use power-up in that slot" },
          { key: "Touch D-pad + FIRE", action: "Move and shoot on mobile" },
          { key: "Esc / P", action: "Pause or unpause" }
        ],
        tips: [
          "Shooting a body segment splits the centiquill into two shorter chains.",
          "Shooting the head shortens the overall chain by one — prioritize heads when the stage is late.",
          "Quill-spiders eat ink-pot mushrooms, making the field clearer — let them pass if convenient.",
          "Page-fleas drop ink-pots from the top, re-cluttering the field — shoot them quickly.",
          "The misconception-scarab is fast and unkillable — dodge it, never chase it."
        ],
        scholar: "Once per stage an ink-pot glows gold — the Scholar Inkblot. Shoot it to open an optional review prompt worth +1500 points and 12 shards. The stage continues while the prompt is open. Skip any time with no penalty."
      });
      var _helpContainer = document.querySelector("#setupScreen .setup-actions");
      if (_helpContainer) MrMacsHelpOverlay.mountButton(_helpContainer, "centiquill");
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "centiquill";
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
