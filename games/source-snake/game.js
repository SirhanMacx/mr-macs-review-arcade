/* ===========================================================================
   Source Snake — Grid-based Snake for Mr. Mac's Review Arcade
   Vanilla JS · Canvas · Smooth-interp grid Snake · Rare scholar pellets gate review
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "source-snake";
  var GAME_TITLE = "Source Snake";

  var COLS = 32;
  var ROWS = 20;
  var CELL = 30;
  var LOGICAL_W = COLS * CELL;   // 960
  var LOGICAL_H = ROWS * CELL;   // 600

  var STEP_BASE_MS = 140;
  var STEP_MIN_MS = 60;
  var STEP_LENGTH_FACTOR = 1.2;

  var POWERUP_DROP_RATE = 0.03;
  var POWERUP_TTL = 8.0;          // seconds
  var POWERUP_DURATIONS = {
    speed: 10, slow: 10, phase: 5, magnet: 8
    // shrink is instant
  };
  var POWERUP_KINDS_ALL = ["speed", "slow", "phase", "magnet", "shrink"];

  // Pellet weights (sum doesn't have to be 100; relative)
  var PELLET_WEIGHTS = { primary: 70, rumor: 25, scholar: 5 };
  var SCORE_PRIMARY = 100;
  var SCORE_RUMOR = 25;
  var SCORE_SCHOLAR_BONUS = 500;
  var WAVE_BONUS = 50;            // each 1000 score milestone
  var SHARDS_CAP = 200;
  var RETRY_PER_SCORE = 1000;
  var RETRY_MAX = 3;

  var MAGNET_RADIUS_CELLS = 4;
  var MAGNET_PULL_PX = 80;        // how far per second pellet drifts toward head when magnet active
  var SHRINK_AMOUNT = 5;

  // -- Inline review bank (~26 entries) --------------------------------------
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
    { prompt: "Which best describes a primary source?", choices: ["A first-hand record from the time period studied", "A textbook chapter", "A modern documentary", "An encyclopedia entry"], correctText: "A first-hand record from the time period studied" }
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
  var lastStepSfxTs = 0;

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
    step: function () {
      // Gate to avoid annoyance: at most one tick every 90 ms.
      var now = performance.now();
      if (now - lastStepSfxTs < 90) return;
      lastStepSfxTs = now;
      sfxTone(180, 0.02, { type: "square", volume: 0.025, endFreq: 140 });
    },
    eatPrimary: function () { sfxTone(440, 0.12, { type: "square", volume: 0.14, endFreq: 660 }); },
    eatRumor:   function () { sfxTone(220, 0.14, { type: "square", volume: 0.12, endFreq: 160 }); },
    eatScholar: function () {
      [523, 659, 784].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 90);
      });
    },
    powerup: function () {
      sfxTone(660, 0.10, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(880, 0.14, { type: "triangle", volume: 0.14 }); }, 80);
    },
    death: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(420, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 60 });
    },
    direction: function () { sfxTone(640, 0.025, { type: "triangle", volume: 0.04, endFreq: 720 }); },
    magnetPing: function () { sfxTone(1100, 0.05, { type: "sine", volume: 0.04, endFreq: 1320 }); },
    milestone: function () {
      [523, 659, 784, 988].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.14, { type: "triangle", volume: 0.13 }); }, i * 70);
      });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("snakeCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLength = $("hudLength");
    dom.hudRetry = $("hudRetry");
    dom.hudBest = $("hudBest");
    dom.waveName = $("waveName");
    dom.waveMeta = $("waveMeta");
    dom.powerupTray = $("powerupTray");
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
    dom.retryBtn = $("retryBtn");
    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.retryHint = $("retryHint");
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
  }

  // -- State init ------------------------------------------------------------
  function makeInitialSnake() {
    // length 3, centered, head facing right
    var midR = Math.floor(ROWS / 2);
    var midC = Math.floor(COLS / 2);
    return [
      { c: midC,     r: midR },  // head (front)
      { c: midC - 1, r: midR },
      { c: midC - 2, r: midR }   // tail (back)
    ];
  }

  function initState(opts) {
    opts = opts || {};
    var snake = opts.snake || makeInitialSnake();
    state = {
      snake: snake,
      // direction: "right" | "left" | "up" | "down"
      dir: opts.dir || "right",
      queuedDir: null,
      score: opts.score || 0,
      maxLength: opts.maxLength || snake.length,
      stepInterval: STEP_BASE_MS,
      stepAccum: 0,
      stepProgress: 0,        // 0..1 within current grid step (for interp)
      pellet: null,
      powerup: null,          // floating power-up token on grid
      powerupTimer: 0,
      activePowerups: {},     // kind -> remaining seconds
      retries: opts.retries || 0,
      nextRetryAt: opts.nextRetryAt || RETRY_PER_SCORE,
      lastMilestone: opts.lastMilestone || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      pelletsEaten: 0,
      scholarPelletsHit: 0,
      time: 0,
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      particles: [],
      fragments: [],          // post-death scatter
      bounce: 0,              // 0..1 head bounce on direction change
      eatScale: 0,            // 0..1 head bite scale
      headEyesBlink: 0,
      best: opts.best || readBest(),
      usedPowerup: false
    };
    spawnPellet();
  }

  // -- Pellet logic ----------------------------------------------------------
  function spawnPellet() {
    var empty = listEmptyCells();
    if (!empty.length) return;
    var cell = empty[Math.floor(Math.random() * empty.length)];
    // Weighted choice
    var total = PELLET_WEIGHTS.primary + PELLET_WEIGHTS.rumor + PELLET_WEIGHTS.scholar;
    var roll = Math.random() * total;
    var kind;
    if (roll < PELLET_WEIGHTS.primary) kind = "primary";
    else if (roll < PELLET_WEIGHTS.primary + PELLET_WEIGHTS.rumor) kind = "rumor";
    else kind = "scholar";
    state.pellet = {
      c: cell.c, r: cell.r,
      // Floating pixel offset (used for magnet drift). Default to cell center.
      px: cell.c * CELL + CELL / 2,
      py: cell.r * CELL + CELL / 2,
      kind: kind,
      pulse: 0,
      rot: 0
    };
  }

  function listEmptyCells() {
    var occupied = {};
    for (var i = 0; i < state.snake.length; i++) {
      var seg = state.snake[i];
      occupied[seg.c + "," + seg.r] = true;
    }
    if (state.powerup) occupied[state.powerup.c + "," + state.powerup.r] = true;
    var out = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (!occupied[c + "," + r]) out.push({ c: c, r: r });
      }
    }
    return out;
  }

  function spawnPowerup(kind) {
    if (!kind) {
      var idx = Math.floor(Math.random() * POWERUP_KINDS_ALL.length);
      kind = POWERUP_KINDS_ALL[idx];
    }
    var empty = listEmptyCells();
    if (!empty.length) return;
    var cell = empty[Math.floor(Math.random() * empty.length)];
    state.powerup = {
      c: cell.c, r: cell.r,
      kind: kind,
      ttl: POWERUP_TTL,
      bob: Math.random() * Math.PI * 2
    };
  }

  // Spawn one of each currently-undropped power-up nearby (used after correct scholar)
  function spawnPowerupsNearby(centerC, centerR) {
    var present = {};
    if (state.powerup) present[state.powerup.kind] = true;
    // Active power-ups don't block respawning; we want fresh drops.
    var spawned = 0;
    POWERUP_KINDS_ALL.forEach(function (k) {
      // pick a candidate cell within ~6 cell radius that's empty
      var attempts = 0;
      while (attempts++ < 24) {
        var dc = Math.floor((Math.random() - 0.5) * 12);
        var dr = Math.floor((Math.random() - 0.5) * 12);
        var c = centerC + dc, r = centerR + dr;
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
        if (cellOccupied(c, r)) continue;
        if (state.powerup && state.powerup.c === c && state.powerup.r === r) continue;
        // Place this kind: just push as a separate floating token via a list?
        // Simpler: only one floating powerup at a time. Stagger spawns by setting the most-recent
        // kind on state.powerup, and queue the rest to drift in.
        if (!state.powerup) {
          state.powerup = { c: c, r: r, kind: k, ttl: POWERUP_TTL, bob: Math.random() * Math.PI * 2 };
          spawned++;
          break;
        }
        // For additional kinds, push them onto a queue to spawn over time
        state._powerupQueue = state._powerupQueue || [];
        state._powerupQueue.push({ kind: k });
        spawned++;
        break;
      }
    });
    return spawned;
  }

  function cellOccupied(c, r) {
    for (var i = 0; i < state.snake.length; i++) {
      var seg = state.snake[i];
      if (seg.c === c && seg.r === r) return true;
    }
    if (state.pellet && state.pellet.c === c && state.pellet.r === r) return true;
    return false;
  }

  // -- Step (grid update) ----------------------------------------------------
  function recomputeStepInterval() {
    var len = state.snake.length;
    var base = Math.max(STEP_MIN_MS, STEP_BASE_MS - len * STEP_LENGTH_FACTOR);
    if (state.activePowerups.speed) base *= 0.6;
    if (state.activePowerups.slow) base *= 1.5;
    state.stepInterval = base;
  }

  function performStep() {
    // Apply queued direction (no 180° reversal)
    if (state.queuedDir && !isOpposite(state.dir, state.queuedDir)) {
      if (state.queuedDir !== state.dir) {
        state.bounce = 1;
        sfx.direction();
      }
      state.dir = state.queuedDir;
    }
    state.queuedDir = null;

    var head = state.snake[0];
    var nh = nextCell(head, state.dir);

    // Wall collision
    if (nh.c < 0 || nh.c >= COLS || nh.r < 0 || nh.r >= ROWS) {
      die();
      return;
    }

    // Self collision (head into body) — phase power-up bypasses
    if (!state.activePowerups.phase) {
      for (var i = 0; i < state.snake.length; i++) {
        var seg = state.snake[i];
        if (seg.c === nh.c && seg.r === nh.r) {
          die();
          return;
        }
      }
    }

    // Move: insert new head
    state.snake.unshift({ c: nh.c, r: nh.r });

    // Pellet collision?
    var ate = state.pellet && state.pellet.c === nh.c && state.pellet.r === nh.r;
    if (ate) {
      handlePelletEaten(state.pellet);
      // Note: handlePelletEaten doesn't pop tail (snake grows)
    } else {
      // Pop tail
      state.snake.pop();
    }

    // Powerup collision?
    if (state.powerup && state.powerup.c === nh.c && state.powerup.r === nh.r) {
      handlePowerupEaten(state.powerup);
      state.powerup = null;
      // Try to dequeue from the staged queue
      if (state._powerupQueue && state._powerupQueue.length) {
        var next = state._powerupQueue.shift();
        spawnPowerup(next.kind);
      }
    }

    // SFX
    sfx.step();

    state.maxLength = Math.max(state.maxLength, state.snake.length);
    if (state.snake.length >= 50) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("source-snake", "snake-tail-50"); } catch (e) {}
    }
    if (state.snake.length >= 30 && !state.usedPowerup) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("source-snake", "snake-no-power"); } catch (e) {}
    }
    recomputeStepInterval();
    updateHud();
  }

  function nextCell(c, dir) {
    if (dir === "right") return { c: c.c + 1, r: c.r };
    if (dir === "left")  return { c: c.c - 1, r: c.r };
    if (dir === "up")    return { c: c.c,     r: c.r - 1 };
    return { c: c.c, r: c.r + 1 }; // down
  }

  function isOpposite(a, b) {
    return (a === "left" && b === "right") ||
           (a === "right" && b === "left") ||
           (a === "up" && b === "down") ||
           (a === "down" && b === "up");
  }

  function handlePelletEaten(pellet) {
    state.pelletsEaten++;
    state.eatScale = 1;
    var headPx = pellet.c * CELL + CELL / 2;
    var headPy = pellet.r * CELL + CELL / 2;
    if (pellet.kind === "primary") {
      addScore(SCORE_PRIMARY);
      sfx.eatPrimary();
      pushPopup("+" + SCORE_PRIMARY, headPx, headPy, "");
      burstParticles(headPx, headPy, "#e8b84b", 14);
    } else if (pellet.kind === "rumor") {
      addScore(SCORE_RUMOR);
      sfx.eatRumor();
      pushPopup("+" + SCORE_RUMOR, headPx, headPy, "is-rumor");
      burstParticles(headPx, headPy, "#f07bb8", 10);
    } else if (pellet.kind === "scholar") {
      // No immediate score — opens review modal
      state.scholarPelletsHit++;
      sfx.eatScholar();
      pushPopup("SCHOLAR", headPx, headPy, "is-scholar");
      burstParticles(headPx, headPy, "#a991ff", 24);
      // Spawn a fresh non-scholar pellet immediately (game continues if they skip)
      state.pellet = null;
      spawnPellet();
      // Open review (paused gameplay)
      openScholarQuestion();
      // Roll for power-up still possible? Skip — scholar already gives bonus on correct.
      return;
    }
    // Random power-up drop?
    if (Math.random() < POWERUP_DROP_RATE && !state.powerup) {
      // Stagger by a tiny tick — for now spawn now
      spawnPowerup();
    }
    // Spawn new pellet
    state.pellet = null;
    spawnPellet();
  }

  function handlePowerupEaten(p) {
    state.usedPowerup = true;
    sfx.powerup();
    var px = p.c * CELL + CELL / 2;
    var py = p.r * CELL + CELL / 2;
    pushPopup(powerupLabel(p.kind), px, py, "is-bonus");
    burstParticles(px, py, "#5de0f0", 18);
    if (p.kind === "shrink") {
      var n = Math.min(SHRINK_AMOUNT, state.snake.length - 3);
      if (n > 0) {
        for (var i = 0; i < n; i++) state.snake.pop();
      }
      return;
    }
    var dur = POWERUP_DURATIONS[p.kind] || 8;
    state.activePowerups[p.kind] = (state.activePowerups[p.kind] || 0) + dur;
    recomputeStepInterval();
  }

  function powerupLabel(k) {
    if (k === "speed") return "SPEED";
    if (k === "slow") return "SLOW";
    if (k === "phase") return "PHASE";
    if (k === "magnet") return "MAGNET";
    if (k === "shrink") return "SHRINK";
    return k.toUpperCase();
  }
  function powerupGlyph(k) {
    if (k === "speed") return "→";
    if (k === "slow") return "⧖";
    if (k === "phase") return "◎";
    if (k === "magnet") return "⋌";
    if (k === "shrink") return "⦵";
    return "*";
  }

  // -- Score, milestones, retries -------------------------------------------
  function addScore(n) {
    if (n <= 0) return;
    state.score += n;
    // Retry tokens
    while (state.score >= state.nextRetryAt && state.retries < RETRY_MAX) {
      state.retries++;
      state.nextRetryAt += RETRY_PER_SCORE;
      pushPopup("+RETRY", canvasW / 2, 80, "is-bonus");
      sfx.milestone();
    }
    // Milestone celebration every 1000
    var milestone = Math.floor(state.score / 1000);
    if (milestone > state.lastMilestone) {
      state.lastMilestone = milestone;
      pushPopup(milestone * 1000 + "!", canvasW / 2, 120, "is-bonus");
      sfx.milestone();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 18, palette: ["#a991ff", "#e8b84b", "#5de0f0"] });
        }
      } catch (e) {}
    }
    updateHud();
  }

  // -- Death / retry ---------------------------------------------------------
  function die() {
    sfx.death();
    addShake(8, 0.45);
    // Scatter snake into fragments
    state.fragments = [];
    for (var i = 0; i < state.snake.length; i++) {
      var seg = state.snake[i];
      var px = seg.c * CELL + CELL / 2;
      var py = seg.r * CELL + CELL / 2;
      state.fragments.push({
        x: px, y: py,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.5) * 240,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 6,
        life: 1.6,
        totalLife: 1.6,
        idx: i
      });
    }
    state.snake = []; // clear
    phase = "ended";
    // Update best
    var prevBest = readBest();
    if (state.score > prevBest) writeBest(state.score);
    // Save snapshot still
    saveSnapshot();
    // Show end screen after a short delay so the scatter is visible
    setTimeout(showEndScreen, 700);
  }

  function showEndScreen() {
    if (phase !== "ended") return;
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 200));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = "Thread Severed";
    if (dom.endTitle) dom.endTitle.textContent = "Source Snake · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Length</div><div class="end-cell-value">' + state.maxLength + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Shards Earned</div><div class="end-cell-value">' + state.shardsAwarded + '</div></div>'
      ].join("");
    }
    if (state.retries > 0) {
      dom.retryBtn.hidden = false;
      dom.retryHint.textContent = "You have " + state.retries + " retry token" + (state.retries === 1 ? "" : "s") + ". Press R or use the button to respawn at length 3 with score retained.";
    } else {
      dom.retryBtn.hidden = true;
      dom.retryHint.textContent = "";
    }
    showScreen("end");
    try { var el = document.getElementById("endRecap"); if (el && window.MrMacsEndRecap) { MrMacsEndRecap.render(el); MrMacsEndRecap.stopTracking(); } } catch (e) {}
    stopMusic();
  }

  function useRetry() {
    if (state.retries <= 0) return;
    state.retries--;
    var keepScore = state.score;
    var keepShards = state.shardsAwarded;
    var keepCorrect = state.questionsAnsweredCorrect;
    var keepTotal = state.questionsAnsweredTotal;
    var keepNextRetryAt = state.nextRetryAt;
    var keepLastMilestone = state.lastMilestone;
    var keepBest = readBest();
    initState({
      score: keepScore,
      shardsAwarded: keepShards,
      retries: state.retries,
      nextRetryAt: keepNextRetryAt,
      lastMilestone: keepLastMilestone,
      best: keepBest
    });
    state.questionsAnsweredCorrect = keepCorrect;
    state.questionsAnsweredTotal = keepTotal;
    state.fragments = [];
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    renderPowerupTray();
  }

  // -- Particles / popups / shake -------------------------------------------
  function burstParticles(x, y, color, count) {
    if (reducedMotion) count = Math.max(2, Math.floor(count / 2));
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 160;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.6 + Math.random() * 0.4,
        totalLife: 0.6,
        color: color,
        size: 1.6 + Math.random() * 2.2
      });
    }
  }

  function pushPopup(text, x, y, klass) {
    if (!dom.popupOverlay) return;
    var el = document.createElement("div");
    el.className = "popup-text " + (klass || "");
    el.textContent = text;
    // Convert logical coord to overlay coord using current scale & offset
    var cx = offsetX + x * scale;
    var cy = offsetY + y * scale;
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    el.style.transform = "translate(-50%, -50%)";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1100);
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
    state.time += dt;

    // Tick down power-ups
    var changed = false;
    for (var k in state.activePowerups) {
      state.activePowerups[k] -= dt;
      if (state.activePowerups[k] <= 0) {
        delete state.activePowerups[k];
        changed = true;
      }
    }
    if (changed) recomputeStepInterval();

    // Magnet pull on pellet (toward head)
    if (state.activePowerups.magnet && state.pellet) {
      var head = state.snake[0];
      if (head) {
        var hx = head.c * CELL + CELL / 2;
        var hy = head.r * CELL + CELL / 2;
        var dx = hx - state.pellet.px;
        var dy = hy - state.pellet.py;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var maxDist = MAGNET_RADIUS_CELLS * CELL;
        if (dist < maxDist && dist > 0.5) {
          state.pellet.px += (dx / dist) * MAGNET_PULL_PX * dt;
          state.pellet.py += (dy / dist) * MAGNET_PULL_PX * dt;
          // If pellet enters head cell visually, it counts on next step naturally.
          // Repeating soft ping
          if (Math.random() < dt * 2) sfx.magnetPing();
        }
      }
    } else if (state.pellet) {
      // ease pellet toward its cell center if it drifted
      var tx = state.pellet.c * CELL + CELL / 2;
      var ty = state.pellet.r * CELL + CELL / 2;
      state.pellet.px += (tx - state.pellet.px) * Math.min(1, dt * 6);
      state.pellet.py += (ty - state.pellet.py) * Math.min(1, dt * 6);
    }

    // Pellet pulse
    if (state.pellet) {
      state.pellet.pulse += dt;
      state.pellet.rot += dt * (state.pellet.kind === "scholar" ? 1.4 : 0.4);
    }

    // Powerup drift / TTL
    if (state.powerup) {
      state.powerup.ttl -= dt;
      state.powerup.bob += dt * 4;
      if (state.powerup.ttl <= 0) {
        state.powerup = null;
        // Try queued
        if (state._powerupQueue && state._powerupQueue.length) {
          var nextQ = state._powerupQueue.shift();
          spawnPowerup(nextQ.kind);
        }
      }
    } else if (state._powerupQueue && state._powerupQueue.length) {
      // After a short delay between staggered spawns
      state._stagger = (state._stagger || 0) + dt;
      if (state._stagger > 0.6) {
        state._stagger = 0;
        var q = state._powerupQueue.shift();
        spawnPowerup(q.kind);
      }
    }

    // Particles
    var alive = [];
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt;
      if (p.life > 0) alive.push(p);
    }
    state.particles = alive;

    // Fragments (post-death scatter)
    if (state.fragments.length) {
      var fAlive = [];
      for (var fi = 0; fi < state.fragments.length; fi++) {
        var f = state.fragments[fi];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 220 * dt; // gravity-ish
        f.rot += f.rotSpeed * dt;
        f.life -= dt;
        if (f.life > 0) fAlive.push(f);
      }
      state.fragments = fAlive;
    }

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

    // Bounce decay
    if (state.bounce > 0) state.bounce = Math.max(0, state.bounce - dt * 5);
    if (state.eatScale > 0) state.eatScale = Math.max(0, state.eatScale - dt * 4);
    state.headEyesBlink += dt;

    // Step accumulator
    if (phase === "playing") {
      state.stepAccum += dt * 1000;
      while (state.stepAccum >= state.stepInterval && phase === "playing") {
        state.stepAccum -= state.stepInterval;
        performStep();
      }
      state.stepProgress = state.stepAccum / state.stepInterval;
    }

    // Powerup tray refresh (light)
    renderPowerupTray();
  }

  // -- Rendering -------------------------------------------------------------
  function clearCanvas() {
    ctx.save();
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  function drawGridBackground() {
    // Logical canvas drawing happens within the scaled context
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    // Solid background already drawn; add subtle gradient + grid.
    var grd = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W * 0.1, LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W * 0.7);
    grd.addColorStop(0, "rgba(20, 30, 60, 0.35)");
    grd.addColorStop(1, "rgba(2, 4, 12, 0.0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Faint cyan grid lines
    ctx.strokeStyle = "rgba(93,224,240,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var c = 0; c <= COLS; c++) {
      var x = c * CELL + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, LOGICAL_H);
    }
    for (var r = 0; r <= ROWS; r++) {
      var y = r * CELL + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(LOGICAL_W, y);
    }
    ctx.stroke();

    // Outer arena border
    ctx.strokeStyle = "rgba(169,145,255,0.42)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, LOGICAL_W - 2, LOGICAL_H - 2);
    ctx.restore();
  }

  function drawSnake() {
    if (!state.snake.length) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);

    var snake = state.snake;
    var head = snake[0];
    var prog = state.stepProgress;
    // Compute interp head pos (toward direction)
    var dirVec = dirToVec(state.dir);
    var headPx = head.c * CELL + CELL / 2 + dirVec.x * CELL * prog;
    var headPy = head.r * CELL + CELL / 2 + dirVec.y * CELL * prog;

    // Tail interp: tail leaves from its current cell toward the next segment. So tail's draw pos
    // is current tail's cell center, lerped by `prog` toward the segment in front of it.
    var tailIdx = snake.length - 1;
    var tail = snake[tailIdx];
    var tailNext = snake[tailIdx - 1] || tail;
    var tailPx = tail.c * CELL + CELL / 2 + (tailNext.c - tail.c) * CELL * prog;
    var tailPy = tail.r * CELL + CELL / 2 + (tailNext.r - tail.r) * CELL * prog;

    // Determine each segment's draw position via interp
    var positions = [];
    positions.push({ x: headPx, y: headPy });
    for (var i = 1; i < snake.length - 1; i++) {
      var s = snake[i];
      positions.push({ x: s.c * CELL + CELL / 2, y: s.r * CELL + CELL / 2 });
    }
    if (snake.length > 1) positions.push({ x: tailPx, y: tailPy });

    // Phase mode: ghosted alpha
    var phasing = !!state.activePowerups.phase;

    // Draw tail to head so head is on top
    for (var k2 = positions.length - 1; k2 >= 0; k2--) {
      var pos = positions[k2];
      var t = positions.length > 1 ? k2 / (positions.length - 1) : 0; // 0=head, 1=tail
      var brightness = 1 - t * 0.55;
      var size = CELL * (0.86 - t * 0.16);
      var radius = size * 0.28;
      var color = lerpColor("#a991ff", "#5d4cb0", t);
      if (phasing) color = lerpColor("#7a92ff", "#4a3a98", t);
      ctx.save();
      ctx.globalAlpha = phasing ? 0.55 : 1;
      ctx.fillStyle = applyBrightness(color, brightness);
      ctx.shadowColor = "rgba(169,145,255,0.45)";
      ctx.shadowBlur = k2 === 0 ? 18 : 6;
      var px = pos.x - size / 2;
      var py = pos.y - size / 2;
      // Bounce-on-turn: scale head slightly
      if (k2 === 0 && state.bounce > 0 && !reducedMotion) {
        var sc = 1 + state.bounce * 0.16;
        ctx.translate(pos.x, pos.y);
        ctx.scale(sc, sc);
        ctx.translate(-pos.x, -pos.y);
      }
      // Eat-bite scale
      if (k2 === 0 && state.eatScale > 0 && !reducedMotion) {
        var es = 1 + state.eatScale * 0.22;
        ctx.translate(pos.x, pos.y);
        ctx.scale(es, es);
        ctx.translate(-pos.x, -pos.y);
      }
      drawRoundRect(ctx, px, py, size, size, radius);
      ctx.fill();

      // Subtle inner highlight
      ctx.shadowBlur = 0;
      ctx.globalAlpha = phasing ? 0.18 : 0.32;
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      drawRoundRect(ctx, px + size * 0.18, py + size * 0.16, size * 0.36, size * 0.18, radius * 0.4);
      ctx.fill();
      ctx.restore();
    }

    // Head eyes (face direction)
    drawHeadEyes(headPx, headPy);
    ctx.restore();
  }

  function drawHeadEyes(hx, hy) {
    var dirVec = dirToVec(state.dir);
    // Eye offset perpendicular to direction
    var perp = { x: -dirVec.y, y: dirVec.x };
    var eyeOff = CELL * 0.18;
    var eyeFwd = CELL * 0.16;
    var eyeR = CELL * 0.10;
    var pupilR = CELL * 0.05;
    var ex1 = hx + dirVec.x * eyeFwd + perp.x * eyeOff;
    var ey1 = hy + dirVec.y * eyeFwd + perp.y * eyeOff;
    var ex2 = hx + dirVec.x * eyeFwd - perp.x * eyeOff;
    var ey2 = hy + dirVec.y * eyeFwd - perp.y * eyeOff;
    // Blink ~ every 3-5 seconds for 0.12s
    var blinkPhase = (state.headEyesBlink % 4.0);
    var blinking = blinkPhase < 0.12;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex1, ey1, blinking ? eyeR * 0.4 : eyeR, 0, Math.PI * 2);
    ctx.arc(ex2, ey2, blinking ? eyeR * 0.4 : eyeR, 0, Math.PI * 2);
    ctx.fill();
    if (!blinking) {
      ctx.fillStyle = "#0a0a1c";
      ctx.beginPath();
      ctx.arc(ex1 + dirVec.x * pupilR, ey1 + dirVec.y * pupilR, pupilR, 0, Math.PI * 2);
      ctx.arc(ex2 + dirVec.x * pupilR, ey2 + dirVec.y * pupilR, pupilR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function dirToVec(d) {
    if (d === "right") return { x: 1, y: 0 };
    if (d === "left")  return { x: -1, y: 0 };
    if (d === "up")    return { x: 0, y: -1 };
    return { x: 0, y: 1 };
  }

  function drawPellet() {
    if (!state.pellet) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    var p = state.pellet;
    var px = p.px, py = p.py;
    var pulse = 0.5 + 0.5 * Math.sin(p.pulse * 4);
    if (p.kind === "primary") {
      drawGlowDot(px, py, CELL * 0.32, CELL * 0.6 + pulse * 6, "#e8b84b", "rgba(232,184,75,0.5)");
    } else if (p.kind === "rumor") {
      drawGlowDot(px, py, CELL * 0.22, CELL * 0.5 + pulse * 5, "#f07bb8", "rgba(240,123,184,0.45)");
    } else if (p.kind === "scholar") {
      // multi-color shimmer + rotating
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.rot);
      var halo = ctx.createRadialGradient(0, 0, 2, 0, 0, CELL * 0.7 + pulse * 8);
      halo.addColorStop(0, "rgba(169,145,255,0.7)");
      halo.addColorStop(0.5, "rgba(93,224,240,0.32)");
      halo.addColorStop(1, "rgba(232,184,75,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, CELL * 0.75, 0, Math.PI * 2);
      ctx.fill();
      // Star body
      var spikes = 6;
      var rOuter = CELL * 0.36;
      var rInner = CELL * 0.16;
      ctx.beginPath();
      for (var i = 0; i < spikes * 2; i++) {
        var rr = (i % 2 === 0) ? rOuter : rInner;
        var a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        var sx = Math.cos(a) * rr;
        var sy = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      var bodyGrd = ctx.createLinearGradient(-rOuter, -rOuter, rOuter, rOuter);
      bodyGrd.addColorStop(0, "#a991ff");
      bodyGrd.addColorStop(0.5, "#5de0f0");
      bodyGrd.addColorStop(1, "#e8b84b");
      ctx.fillStyle = bodyGrd;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawGlowDot(x, y, r, haloR, fillColor, haloColor) {
    var halo = ctx.createRadialGradient(x, y, 1, x, y, haloR);
    halo.addColorStop(0, haloColor);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, haloR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawPowerup() {
    if (!state.powerup) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    var p = state.powerup;
    var px = p.c * CELL + CELL / 2;
    var py = p.r * CELL + CELL / 2 + Math.sin(p.bob) * 3;
    var color = "#5de0f0";
    var halo = "rgba(93,224,240,0.42)";
    if (p.kind === "speed") { color = "#5de0f0"; halo = "rgba(93,224,240,0.42)"; }
    if (p.kind === "slow") { color = "#a991ff"; halo = "rgba(169,145,255,0.42)"; }
    if (p.kind === "phase") { color = "#52e8a0"; halo = "rgba(82,232,160,0.42)"; }
    if (p.kind === "magnet") { color = "#e8b84b"; halo = "rgba(232,184,75,0.42)"; }
    if (p.kind === "shrink") { color = "#f07bb8"; halo = "rgba(240,123,184,0.42)"; }
    // Halo
    var glow = ctx.createRadialGradient(px, py, 2, px, py, CELL * 0.7);
    glow.addColorStop(0, halo);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, CELL * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Token: hex shape
    ctx.fillStyle = color;
    ctx.beginPath();
    var tr = CELL * 0.32;
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      var sx = px + Math.cos(a) * tr;
      var sy = py + Math.sin(a) * tr;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Letter
    ctx.fillStyle = "#02091a";
    ctx.font = "800 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.kind.charAt(0).toUpperCase(), px, py);
    // TTL ring
    var ttlRatio = Math.max(0, Math.min(1, p.ttl / POWERUP_TTL));
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, CELL * 0.42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ttlRatio);
    ctx.stroke();
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

  function drawFragments() {
    if (!state.fragments.length) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    for (var i = 0; i < state.fragments.length; i++) {
      var f = state.fragments[i];
      var t = Math.max(0, f.life / Math.max(0.01, f.totalLife));
      ctx.globalAlpha = t;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      var size = CELL * 0.7;
      ctx.fillStyle = "#a991ff";
      ctx.shadowColor = "rgba(169,145,255,0.5)";
      ctx.shadowBlur = 6;
      drawRoundRect(ctx, -size / 2, -size / 2, size, size, size * 0.25);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Trail dots: 1-2 dots per step at tail's last position
  // (Subtle; produced by performStep would be ideal — instead emitted from rendering.)
  function emitTrailIfStepped() {
    if (reducedMotion) return;
    // emit at most ~once per step boundary using stepProgress as a proxy
    // simpler: each render frame, push a faint dot near tail with low probability
    if (!state.snake.length) return;
    if (Math.random() < 0.15) {
      var s = state.snake[state.snake.length - 1];
      var x = s.c * CELL + CELL / 2 + (Math.random() - 0.5) * 4;
      var y = s.r * CELL + CELL / 2 + (Math.random() - 0.5) * 4;
      state.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 0.5, totalLife: 0.5,
        color: "rgba(169,145,255,0.5)",
        size: 1.2 + Math.random() * 0.8
      });
    }
  }

  function drawRoundRect(c, x, y, w, h, r) {
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
    // color may be rgb(...) or #...
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
    // Render at logical scale, letterboxed
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawGridBackground();
    drawParticles();
    drawPellet();
    drawPowerup();
    if (state.snake.length) drawSnake();
    drawFragments();

    // Reset
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // -- Game loop -------------------------------------------------------------
  function loop(ts) {
    rafHandle = requestAnimationFrame(loop);
    if (!state) return;
    var dt = lastFrame ? Math.min(0.05, (ts - lastFrame) / 1000) : 0;
    lastFrame = ts;
    if (phase === "playing" || phase === "ended") {
      updateGame(dt);
      emitTrailIfStepped();
    }
    render();
    if (ts - lastSnapshotTs > 5000) { lastSnapshotTs = ts; saveSnapshot(); }
  }

  // -- HUD -------------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLength) dom.hudLength.textContent = state.snake.length || state.maxLength;
    if (dom.hudRetry) {
      dom.hudRetry.textContent = state.retries;
      var retryCell = dom.hudRetry.closest ? dom.hudRetry.closest(".stat-cell") : null;
      if (retryCell) {
        if (state.retries > 0) retryCell.classList.add("is-retry");
        else retryCell.classList.remove("is-retry");
      }
    }
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.waveMeta) dom.waveMeta.textContent = "Pace · " + Math.round(state.stepInterval) + " ms";
    if (dom.waveName) {
      var len = state.snake.length;
      var label = "Reading Room";
      if (len >= 30) label = "Deep Stacks";
      else if (len >= 22) label = "Map Annex";
      else if (len >= 14) label = "Periodicals";
      dom.waveName.textContent = label;
    }
  }

  function renderPowerupTray() {
    if (!dom.powerupTray) return;
    var html = "";
    for (var k in state.activePowerups) {
      var remaining = state.activePowerups[k];
      if (remaining <= 0) continue;
      html += '<span class="powerup-chip">' +
        '<span class="powerup-chip-icon">' + powerupGlyph(k) + '</span> ' +
        powerupLabel(k) + ' &middot; ' + remaining.toFixed(1) + 's</span>';
    }
    dom.powerupTray.innerHTML = html;
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
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Pellet · Optional · +500 score";
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
      dom.explanation.textContent = "Decoded! +" + SCORE_SCHOLAR_BONUS + " score · power-up cascade incoming.";
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
      addScore(SCORE_SCHOLAR_BONUS);
      addShards(20, GAME_ID + "-scholar-correct");
      // Spawn one of every kind of power-up nearby that isn't already on the field
      var head = state.snake[0] || { c: Math.floor(COLS / 2), r: Math.floor(ROWS / 2) };
      spawnPowerupsNearby(head.c, head.r);
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 36, palette: ["#a991ff", "#5de0f0", "#e8b84b"] });
        }
      } catch (e) {}
    }
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { length: state.maxLength });
      }
    } catch (e) {}
  }

  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          length: state.snake.length || state.maxLength,
          retries: state.retries,
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
          file: "games/source-snake/index.html"
        });
      }
    } catch (e) {}
  }

  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("source-snake:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("source-snake:best", String(v));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("maze-cabinet", { volume: 0.5 });
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
        var setDir = null;
        if (k === "ArrowLeft" || k === "a" || k === "A") setDir = "left";
        else if (k === "ArrowRight" || k === "d" || k === "D") setDir = "right";
        else if (k === "ArrowUp" || k === "w" || k === "W") setDir = "up";
        else if (k === "ArrowDown" || k === "s" || k === "S") setDir = "down";
        if (setDir) {
          // Queue: don't accept opposite of current dir
          if (!isOpposite(state.dir, setDir)) state.queuedDir = setDir;
          e.preventDefault();
          return;
        }
        if (k === " " || k === "Space" || e.code === "Space" || k === "p" || k === "P") {
          togglePause();
          e.preventDefault();
          return;
        }
      }
      if (phase === "paused" && (k === " " || k === "p" || k === "P")) {
        togglePause();
        e.preventDefault();
        return;
      }
      if (k === "Escape" || k === "Esc") {
        if (phase === "playing" || phase === "paused") togglePause();
        else if (phase === "question") skipQuestion();
      }
      if (phase === "ended" && (k === "r" || k === "R")) {
        if (state && state.retries > 0) useRetry();
      }
    });

    // Touch swipe on canvas — fires the moment the swipe crosses a
    // small threshold during touchmove (was firing only on touchend with
    // 24px threshold, which felt sluggish — the snake had already moved
    // past the turn point before the gesture completed).
    var touchStart = null;
    var lastSwipeDir = null;
    canvas.addEventListener("touchstart", function (e) {
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY };
        lastSwipeDir = null;
      }
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (!touchStart || !e.touches || !e.touches[0]) return;
      var t = e.touches[0];
      var dx = t.clientX - touchStart.x;
      var dy = t.clientY - touchStart.y;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax < 14 && ay < 14) return; // smaller dead zone (was 24)
      var setDir;
      if (ax > ay) setDir = (dx > 0) ? "right" : "left";
      else setDir = (dy > 0) ? "down" : "up";
      if (setDir === lastSwipeDir) return; // already queued this direction
      lastSwipeDir = setDir;
      if (phase === "playing" && !isOpposite(state.dir, setDir)) {
        state.queuedDir = setDir;
        // Reset origin so the player can chain a new perpendicular swipe
        // from this point without lifting their finger.
        touchStart = { x: t.clientX, y: t.clientY };
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function () { touchStart = null; lastSwipeDir = null; }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchStart = null; lastSwipeDir = null; }, { passive: true });

    // Mouse/keyboard click on the canvas could also direct, but stick with swipe + keys.
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
    if (dom.retryBtn) dom.retryBtn.addEventListener("click", function () { useRetry(); });
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

    try {
      if (window.MrMacsHelpOverlay) {
        window.MrMacsHelpOverlay.register("source-snake", {
          title: "How to Play Source Snake",
          goal: "Steer your research thread through the archive grid, eating gold primary sources while dodging red rumor scraps — survive as long as possible.",
          controls: [
            { key: "Arrow Keys / WASD", action: "Steer the snake" },
            { key: "Space / P", action: "Pause" },
            { key: "R", action: "Use retry token" },
            { key: "Esc", action: "Menu" }
          ],
          tips: [
            "Red rumor scraps still grow your snake — avoid them to keep your thread manageable at high speeds.",
            "Speed increases with length; use Slow power-ups when the pace gets uncontrollable.",
            "Retry tokens save you from a single wall or self-collision — they build up every 1000 score, max 3."
          ],
          scholar: "Rare purple scholar pellets pause the game and open a review modal — answer correctly for +500 score and a power-up cascade."
        });
        var setupActions = document.querySelector("#setupScreen .setup-actions");
        if (setupActions) window.MrMacsHelpOverlay.mountButton(setupActions, "source-snake");
      }
    } catch (e) {}
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("source-snake");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "source-snake", { compact: false });
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
    try { window.MrMacsEndRecap && MrMacsEndRecap.reset(); MrMacsEndRecap && MrMacsEndRecap.startTracking(); } catch (e) {}
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    renderPowerupTray();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state;
    initState({
      score: s.score,
      retries: s.retries || 0
    });
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    renderPowerupTray();
    recordPlayWithProfile();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.length) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Length ' + (snap.state.length || 3) +
        ' &middot; Retries ' + (snap.state.retries || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Source Snake Scores</div>';
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
    var GAME_ID_LOCAL = "source-snake";
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
