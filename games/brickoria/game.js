/* ═══════════════════════════════════════════════════════════════════════════
   Brickoria — Brick Breaker for Mr. Mac's Review Arcade
   Vanilla JS · Canvas · Per-era reskin · Boss bricks unlock review questions
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  // ── Config ────────────────────────────────────────────────────────────────
  var GAME_ID = "brickoria";
  var GAME_TITLE = "Brickoria";
  var LOGICAL_W = 1024;
  var LOGICAL_H = 640;

  var PADDLE_BASE_W = 120;
  var PADDLE_H = 14;
  var PADDLE_Y_OFFSET = 36;
  var PADDLE_SPEED = 760; // px/sec for keyboard

  var BALL_R = 8;
  var BALL_BASE_SPEED = 380; // px/sec at level 1
  var BALL_SPEED_GROWTH = 1.05;

  var BRICK_ROWS = 8;
  var BRICK_COLS = 12;
  var BRICK_W = 70;
  var BRICK_H = 22;
  var BRICK_GAP = 6;
  var GRID_TOP_OFFSET = 88;

  var POWERUP_DROP_RATE = 0.15;
  var POWERUP_R = 11;
  var POWERUP_FALL_SPEED = 180;

  var LASER_SPEED = 720;
  var LASER_COOLDOWN = 0.16;

  var COMBO_MAX = 8;
  var SHARDS_CAP = 200;

  var POWERUP_DURATIONS = {
    extend: 30, multi: 0, slow: 15, laser: 10, life: 0
  };

  var ERAS = [
    { name: "Renaissance",        accent: "#d4a017", bgA: "#3a2110", bgB: "#0d0612", palette: ["#d4a017", "#e8b84b", "#a86a1c"], bossPalette: ["#f5d97a", "#d4a017"] },
    { name: "Age of Exploration", accent: "#4a8cd9", bgA: "#0d2540", bgB: "#0a1426", palette: ["#4a8cd9", "#6fa8e0", "#cdb88a"], bossPalette: ["#ffe6a8", "#e0b56a"] },
    { name: "Industrial",         accent: "#a08060", bgA: "#2a2018", bgB: "#0e0a08", palette: ["#7a7a7a", "#a08060", "#c8922a"], bossPalette: ["#e8b84b", "#a87a30"] },
    { name: "World War I",        accent: "#7a8a4f", bgA: "#1c2210", bgB: "#0a0c08", palette: ["#7a8a4f", "#a09464", "#5a6a3a"], bossPalette: ["#d4c060", "#8a8030"] },
    { name: "Cold War",           accent: "#d04848", bgA: "#280f1a", bgB: "#0c0a18", palette: ["#d04848", "#4a6dc7", "#e8b84b"], bossPalette: ["#ffd060", "#d09020"] },
    { name: "Civil Rights",       accent: "#a991ff", bgA: "#1c1240", bgB: "#0c0820", palette: ["#a991ff", "#7c5fdb", "#e8b84b"], bossPalette: ["#ffd060", "#a991ff"] },
    { name: "Space Age",          accent: "#5de0f0", bgA: "#0a1c3a", bgB: "#040818", palette: ["#5de0f0", "#3a8ed4", "#d0d8ff"], bossPalette: ["#ffe690", "#5de0f0"] },
    { name: "Boss Stage",         accent: "#e8b84b", bgA: "#3a1820", bgB: "#0a0612", palette: ["#d04848", "#5de0f0", "#a991ff", "#7a8a4f", "#d4a017"], bossPalette: ["#fff0a0", "#e8b84b"] }
  ];
  // ── Inline review bank (used when DIAG_BANK_BY_COURSE is unavailable) ────
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence", set: "Renaissance" },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg", set: "Renaissance" },
    { prompt: "The Protestant Reformation began with:", choices: ["Luther's 95 Theses", "The Council of Trent", "Henry VIII's annulment", "Calvin's Institutes"], correctText: "Luther's 95 Theses", set: "Reformation" },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, diseases between hemispheres", "A 1492 trade treaty between Spain and Portugal", "Slave trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, diseases between hemispheres", set: "Exploration" },
    { prompt: "Which technology most enabled European long-distance voyages?", choices: ["The astrolabe and caravel", "The compound microscope", "The cotton gin", "The seed drill"], correctText: "The astrolabe and caravel", set: "Exploration" },
    { prompt: "Encomienda was a Spanish colonial system that:", choices: ["Forced indigenous labor on Spanish landholders' estates", "Established free trade between colonies", "Banned the import of African slaves", "Created Catholic missionary schools"], correctText: "Forced indigenous labor on Spanish landholders' estates", set: "Exploration" },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain", set: "Industrial" },
    { prompt: "Which invention most powered early factories?", choices: ["The steam engine", "The electric motor", "The internal combustion engine", "The assembly line"], correctText: "The steam engine", set: "Industrial" },
    { prompt: "Urbanization in the 1800s was primarily driven by:", choices: ["Factory employment", "Religious revivals", "Voting-rights expansion", "Naval warfare"], correctText: "Factory employment", set: "Industrial" },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "German unification", "Russian Revolution"], correctText: "Assassination of Archduke Franz Ferdinand", set: "WWI" },
    { prompt: "Trench warfare on the Western Front was characterized by:", choices: ["Stalemate and high casualties", "Rapid cavalry advances", "Aerial bombing of cities", "Naval blockade only"], correctText: "Stalemate and high casualties", set: "WWI" },
    { prompt: "The Treaty of Versailles (1919) blamed the war primarily on:", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany", set: "WWI" },
    { prompt: "The League of Nations was weakened because:", choices: ["The U.S. did not join", "It had its own army", "It lacked a charter", "Britain refused to sign"], correctText: "The U.S. did not join", set: "WWI" },
    { prompt: "The Cold War was a struggle primarily between:", choices: ["U.S. and Soviet Union", "U.S. and China", "Britain and France", "Germany and Russia"], correctText: "U.S. and Soviet Union", set: "Cold War" },
    { prompt: "The Marshall Plan (1948) provided:", choices: ["Economic aid to rebuild Western Europe", "Military aid to South Korea", "Nuclear technology to NATO allies", "Loans to Latin America"], correctText: "Economic aid to rebuild Western Europe", set: "Cold War" },
    { prompt: "The doctrine of containment aimed to:", choices: ["Stop the spread of communism", "Roll back Soviet borders", "Promote free trade in Asia", "End nuclear weapons"], correctText: "Stop the spread of communism", set: "Cold War" },
    { prompt: "The Cuban Missile Crisis (1962) ended when:", choices: ["The Soviet Union withdrew missiles from Cuba", "Cuba renounced communism", "The U.S. invaded Cuba", "Khrushchev was removed from power"], correctText: "The Soviet Union withdrew missiles from Cuba", set: "Cold War" },
    { prompt: "Brown v. Board of Education (1954) ruled:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional", set: "Civil Rights" },
    { prompt: "The Montgomery Bus Boycott was sparked by:", choices: ["Rosa Parks' arrest", "The March on Washington", "The Voting Rights Act", "Plessy v. Ferguson"], correctText: "Rosa Parks' arrest", set: "Civil Rights" },
    { prompt: "The Civil Rights Act of 1964:", choices: ["Banned discrimination in public accommodations", "Created the EPA", "Established Medicare", "Ended the Vietnam War"], correctText: "Banned discrimination in public accommodations", set: "Civil Rights" },
    { prompt: "Martin Luther King Jr.'s 'I Have a Dream' speech was delivered at:", choices: ["The 1963 March on Washington", "Birmingham Jail", "Selma, Alabama", "The Lincoln Memorial in 1968"], correctText: "The 1963 March on Washington", set: "Civil Rights" },
    { prompt: "The Voting Rights Act of 1965 outlawed:", choices: ["Literacy tests used to disenfranchise voters", "Poll taxes in federal elections", "Gerrymandering", "Voter ID requirements"], correctText: "Literacy tests used to disenfranchise voters", set: "Civil Rights" },
    { prompt: "Sputnik (1957) launched by the USSR triggered:", choices: ["The U.S. space race and NASA's founding", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The U.S. space race and NASA's founding", set: "Space Age" },
    { prompt: "The first human on the moon was:", choices: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"], correctText: "Neil Armstrong", set: "Space Age" },
    { prompt: "NASA was created in:", choices: ["1958", "1945", "1969", "1981"], correctText: "1958", set: "Space Age" },
    { prompt: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Declaration of Independence", "Constitution", "Bill of Rights", "Federalist No. 10"], correctText: "Declaration of Independence", set: "Founding" },
    { prompt: "Checks and balances divides power among:", choices: ["Three branches of government", "Federal and state", "Senate and House", "Citizens and government"], correctText: "Three branches of government", set: "Founding" },
    { prompt: "The 13th Amendment (1865):", choices: ["Abolished slavery", "Granted voting rights to women", "Created income tax", "Gave Black men the vote"], correctText: "Abolished slavery", set: "Reconstruction" },
    { prompt: "The 19th Amendment (1920):", choices: ["Granted women the right to vote", "Repealed Prohibition", "Lowered the voting age", "Established direct election of senators"], correctText: "Granted women the right to vote", set: "Reform" },
    { prompt: "The New Deal (1930s) was a response to:", choices: ["The Great Depression", "World War I", "The Dust Bowl alone", "The Cold War"], correctText: "The Great Depression", set: "Depression" },
    { prompt: "Pearl Harbor (Dec 7, 1941) led directly to:", choices: ["U.S. entry into World War II", "End of WWII", "The Marshall Plan", "Founding of the UN"], correctText: "U.S. entry into World War II", set: "WWII" },
    { prompt: "The Holocaust was the systematic murder of:", choices: ["Six million European Jews and others", "Soviet POWs only", "German political prisoners", "Polish civilians only"], correctText: "Six million European Jews and others", set: "WWII" }
  ];
  // ── State ────────────────────────────────────────────────────────────────
  var canvas, ctx;
  var dpr = 1;
  var canvasW = LOGICAL_W, canvasH = LOGICAL_H;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | levelend | bonus | question | paused | ended
  var prevPhase = null;
  var startTs = 0;
  var lastFrame = 0;
  var rafHandle = null;

  var input = {
    leftDown: false,
    rightDown: false,
    mouseX: null,
    touchX: null,
    spaceQueued: false,
    spaceHeld: false
  };

  var state = null; // game state object

  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var soundOn = true;
  var lastSnapshotTs = 0;
  var pendingBossModal = false;

  // ── SFX (Web Audio) ──────────────────────────────────────────────────────
  // Lightweight oscillator-based sound effects. Single shared
  // AudioContext, lazy-init on first use (browsers require a user
  // gesture before audio works). Every cue respects soundOn.
  var sfxCtx = null;
  function sfxInit() {
    if (sfxCtx || !soundOn) return sfxCtx;
    try {
      sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { sfxCtx = null; }
    return sfxCtx;
  }
  function sfxTone(freq, duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var type = opts.type || "square";
    var vol = opts.volume == null ? 0.18 : opts.volume;
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
  // Pre-baked cues
  var sfx = {
    brick: function (rowIdx) {
      // Pitch climbs with row index (top rows = higher pitch). Square
      // wave for crunchy 8-bit feel.
      var base = 220;
      var freq = base * Math.pow(2, (BRICK_ROWS - rowIdx) / 12);
      sfxTone(freq, 0.08, { type: "square", volume: 0.10 });
    },
    paddle: function () {
      sfxTone(180, 0.05, { type: "triangle", volume: 0.14, endFreq: 110 });
    },
    wall: function () {
      sfxTone(320, 0.03, { type: "sine", volume: 0.06 });
    },
    powerup: function () {
      // Two-note ascending chime
      sfxTone(660, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(880, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    boss: function () {
      // Three-note flourish — gold fanfare
      var notes = [523, 659, 880]; // C5, E5, A5
      notes.forEach(function (n, i) {
        setTimeout(function () {
          sfxTone(n, 0.16, { type: "sawtooth", volume: 0.16 });
        }, i * 100);
      });
    },
    lose: function () {
      sfxTone(280, 0.18, { type: "triangle", volume: 0.18, endFreq: 110 });
    },
    laser: function () {
      sfxTone(1200, 0.05, { type: "square", volume: 0.06, endFreq: 1800 });
    },
    combo: function (level) {
      // Ascending triple-tone for milestone combos
      var notes = [392, 494, 659];
      notes.forEach(function (n, i) {
        setTimeout(function () {
          sfxTone(n + level * 22, 0.10, { type: "triangle", volume: 0.13 });
        }, i * 60);
      });
    }
  };
  // ── DOM ──────────────────────────────────────────────────────────────────
  var dom = {};

  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("brickCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudCombo = $("hudCombo");
    dom.hudLevel = $("hudLevel");
    dom.eraName = $("eraName");
    dom.eraMeta = $("eraMeta");
    dom.powerupTray = $("powerupTray");
    dom.setupScreen = $("setupScreen");
    dom.questionScreen = $("questionScreen");
    dom.bonusScreen = $("bonusScreen");
    dom.pauseScreen = $("pauseScreen");
    dom.endScreen = $("endScreen");
    dom.questionPrompt = $("questionPrompt");
    dom.choiceGrid = $("choiceGrid");
    dom.questionMeta = $("questionMeta");
    dom.questionCloseBtn = $("questionCloseBtn");
    dom.explanation = $("explanation");
    dom.bonusTitle = $("bonusTitle");
    dom.bonusSub = $("bonusSub");
    dom.bonusSkipBtn = $("bonusSkipBtn");
    dom.bonusPlayBtn = $("bonusPlayBtn");
    dom.startBtn = $("startBtn");
    dom.soundBtn = $("soundBtn");
    dom.fullscreenBtn = $("fullscreenBtn");
    dom.resumeBtn = $("resumeBtn");
    dom.restartBtn = $("restartBtn");
    dom.pauseExitBtn = $("pauseExitBtn");
    dom.exitBtn = $("exitBtn");
    dom.pauseBtn = $("pauseBtn");
    dom.bossBtn = $("bossBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");
    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
  }
  // ── Per-era theming ──────────────────────────────────────────────────────
  function applyEraTheme(era) {
    var root = document.documentElement;
    root.style.setProperty("--era-accent", era.accent);
    root.style.setProperty("--era-bg-a", era.bgA);
    root.style.setProperty("--era-bg-b", era.bgB);
    if (dom.eraName) dom.eraName.textContent = era.name;
  }
  // ── State init ───────────────────────────────────────────────────────────
  function initState(opts) {
    opts = opts || {};
    state = {
      level: opts.level || 1,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : 3,
      combo: 1,
      maxCombo: 1,
      maxLevel: opts.level || 1,
      shardsAwarded: 0,
      paddle: { x: LOGICAL_W / 2, w: PADDLE_BASE_W, vx: 0 },
      balls: [],
      bricks: [],
      powerups: [],
      lasers: [],
      particles: [],
      // Polish layers — all populated by update + render loops.
      fragments: [],   // brick-shatter fragments (rotating rectangles that scatter + fade)
      callouts: [],    // floating text callouts ("STREAK 5×!", "PERFECT!", etc.)
      ripples: [],     // expanding-ring shockwaves (paddle hits, boss breaks)
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      hitPauseUntil: 0, // performance.now() ms — update loop skips while < this
      lastComboMilestone: 0, // tracks combo levels we've already announced
      activePowerups: {}, // key -> expiresAt
      ballSpeedMul: 1,
      lasersOn: false,
      lasersFireCooldown: 0,
      bricksRemaining: 0,
      bossBricksRemaining: 0,
      bricksTotalAtStart: 0,
      bossUsedThisLevel: false,
      pendingBonus: false,
      eraStartScore: 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      bonusQuestionsLeft: 0
    };
  }
  // ── Brick layout per era ─────────────────────────────────────────────────
  function buildBricks(level) {
    var era = ERAS[(level - 1) % ERAS.length];
    var grid = [];
    var totalGridW = BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_GAP;
    var startX = (LOGICAL_W - totalGridW) / 2;
    var startY = GRID_TOP_OFFSET;

    var rowsToFill = BRICK_ROWS;
    var skipRows = Math.max(0, BRICK_ROWS - 4 - level); // earlier levels: emptier top
    if (level >= 5) skipRows = 0;

    var bossRowMask = level >= 4 ? [0, 2] : [0]; // boss row(s) at top
    if (level === 8) bossRowMask = [0, 1, 3];

    var bossCount = 0;
    var totalCount = 0;

    for (var r = 0; r < rowsToFill; r++) {
      if (r < skipRows) continue;
      // Procedural skip: every other column on rows where pattern thins
      var rowPattern = r % 4;
      for (var c = 0; c < BRICK_COLS; c++) {
        // Punch holes in some patterns to make varied silhouettes
        if (level === 1 && r === skipRows && (c < 2 || c > BRICK_COLS - 3)) continue;
        if (level === 4 && r === skipRows + 1 && c % 3 === 0) continue;
        if (level === 7 && r === skipRows && (c === 5 || c === 6)) continue;

        var isBoss = bossRowMask.indexOf(r - skipRows) >= 0 && (c === 1 || c === BRICK_COLS - 2 || (level >= 5 && c === Math.floor(BRICK_COLS / 2)));
        if (level === 8 && (r % 3 === 0) && (c === 0 || c === BRICK_COLS - 1)) isBoss = true;

        var hp = 1;
        if (rowPattern === 1) hp = 2;
        if (rowPattern === 0 && level >= 3) hp = level >= 6 ? 3 : 2;
        if (isBoss) hp = 5;

        var color;
        if (isBoss) {
          color = era.bossPalette[c % era.bossPalette.length];
        } else {
          color = era.palette[(r + c) % era.palette.length];
        }

        var brick = {
          x: startX + c * (BRICK_W + BRICK_GAP),
          y: startY + r * (BRICK_H + BRICK_GAP),
          w: BRICK_W,
          h: BRICK_H,
          hp: hp,
          maxHp: hp,
          color: color,
          isBoss: isBoss,
          dropPower: !isBoss && Math.random() < POWERUP_DROP_RATE,
          cracked: 0,
          row: r // for sfx pitch mapping
        };
        grid.push(brick);
        totalCount++;
        if (isBoss) bossCount++;
      }
    }

    state.bricks = grid;
    state.bricksRemaining = totalCount;
    state.bossBricksRemaining = bossCount;
    state.bricksTotalAtStart = totalCount;
    state.bossUsedThisLevel = false;
    applyEraTheme(era);
    updateEraMeta();
  }

  function updateEraMeta() {
    if (!dom.eraMeta) return;
    var done = state.bricksTotalAtStart - state.bricksRemaining;
    dom.eraMeta.textContent = "Bricks: " + done + " / " + state.bricksTotalAtStart;
  }
  // ── Resize / scaling ─────────────────────────────────────────────────────
  function resize() {
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    var sx = (rect.width) / LOGICAL_W;
    var sy = (rect.height) / LOGICAL_H;
    scale = Math.min(sx, sy);
    offsetX = (rect.width - LOGICAL_W * scale) / 2;
    offsetY = (rect.height - LOGICAL_H * scale) / 2;
  }

  // Map client coordinates to logical canvas X
  function clientToLogicalX(clientX) {
    var rect = canvas.getBoundingClientRect();
    var localX = clientX - rect.left - offsetX;
    return localX / scale;
  }
  // ── Ball / paddle init for a new level / new ball ────────────────────────
  function placeBallOnPaddle() {
    state.balls = [{
      x: state.paddle.x,
      y: LOGICAL_H - PADDLE_Y_OFFSET - PADDLE_H - BALL_R - 1,
      vx: 0,
      vy: 0,
      stuck: true,
      speed: ballSpeedForLevel(state.level),
      trail: [] // motion-blur ghost positions
    }];
  }

  function ballSpeedForLevel(lv) {
    return BALL_BASE_SPEED * Math.pow(BALL_SPEED_GROWTH, lv - 1);
  }
  // ── Game loop ────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.04, (ts - lastFrame) / 1000);
    lastFrame = ts;

    if (phase === "playing") {
      update(dt);
    }

    render();

    // Snapshot every ~10s during play
    if (phase === "playing" && ts - lastSnapshotTs > 10000) {
      lastSnapshotTs = ts;
      saveSnapshot();
    }

    rafHandle = requestAnimationFrame(loop);
  }

  function update(dt) {
    // Hit-pause: skip simulation while we're in a brief impact freeze
    // (boss break = ~90ms). Particles/ripples still freeze with us
    // since they all read from state arrays — that's fine.
    if (state.hitPauseUntil && performance.now() < state.hitPauseUntil) return;

    var p = state.paddle;

    // Paddle keyboard
    if (input.leftDown && !input.rightDown) p.vx = -PADDLE_SPEED;
    else if (input.rightDown && !input.leftDown) p.vx = PADDLE_SPEED;
    else p.vx = 0;
    p.x += p.vx * dt;

    // Paddle mouse / touch override
    if (input.touchX != null) p.x = input.touchX;
    else if (input.mouseX != null) p.x = input.mouseX;

    // Clamp paddle
    var halfW = p.w / 2;
    if (p.x < halfW) p.x = halfW;
    if (p.x > LOGICAL_W - halfW) p.x = LOGICAL_W - halfW;

    // Process queued space (launch or fire)
    if (input.spaceQueued) {
      input.spaceQueued = false;
      handleLaunchOrFire();
    }
    // Continuous laser fire if held? -> no, we use cooldown-based auto fire when laser active and space pressed
    if (state.lasersOn) {
      state.lasersFireCooldown -= dt;
      // Auto-fire when space currently down (we approximate with held flag)
    }

    // Update balls
    for (var i = state.balls.length - 1; i >= 0; i--) {
      var b = state.balls[i];
      if (b.stuck) {
        b.x = p.x;
        b.y = LOGICAL_H - PADDLE_Y_OFFSET - PADDLE_H - BALL_R - 1;
        continue;
      }
      var speedMul = state.ballSpeedMul;
      // Motion-blur trail — sample current position before move
      if (!reducedMotion) {
        b.trail = b.trail || [];
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 6) b.trail.shift();
      }
      b.x += b.vx * speedMul * dt;
      b.y += b.vy * speedMul * dt;

      // Wall collisions (with quiet wall thunk)
      if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx); sfx.wall(); }
      if (b.x > LOGICAL_W - BALL_R) { b.x = LOGICAL_W - BALL_R; b.vx = -Math.abs(b.vx); sfx.wall(); }
      if (b.y < BALL_R) { b.y = BALL_R; b.vy = Math.abs(b.vy); sfx.wall(); }

      // Lost ball
      if (b.y > LOGICAL_H + 40) {
        state.balls.splice(i, 1);
        continue;
      }

      // Paddle collision
      var paddleTop = LOGICAL_H - PADDLE_Y_OFFSET - PADDLE_H;
      if (b.vy > 0 && b.y + BALL_R >= paddleTop && b.y - BALL_R <= paddleTop + PADDLE_H) {
        if (b.x >= p.x - halfW - BALL_R && b.x <= p.x + halfW + BALL_R) {
          // Reflect with angle based on hit position
          var rel = (b.x - p.x) / halfW; // -1..1
          var angle = rel * (Math.PI * 0.38); // up to ~68°
          var spd = b.speed;
          b.vx = Math.sin(angle) * spd;
          b.vy = -Math.abs(Math.cos(angle) * spd);
          b.y = paddleTop - BALL_R - 0.5;
          // Polish: paddle hit ripple + small shake + thunk
          var era = ERAS[(state.level - 1) % ERAS.length];
          spawnRipple(b.x, paddleTop, era.accent, 28);
          triggerShake(1.5, 80);
          sfx.paddle();
          // Combo resets when ball touches paddle without breaking a brick
          if (state.combo > 1) {
            state.combo = 1;
            state.lastComboMilestone = 0;
            updateHud();
          }
        }
      }

      // Brick collisions
      hitBricksWithBall(b);
    }

    // No balls left -> lose life
    if (state.balls.length === 0 && phase === "playing") {
      loseLife();
    }

    // Update powerups (falling)
    for (var j = state.powerups.length - 1; j >= 0; j--) {
      var pu = state.powerups[j];
      pu.y += POWERUP_FALL_SPEED * dt;
      pu.t += dt;
      // Catch by paddle
      var ptop = LOGICAL_H - PADDLE_Y_OFFSET - PADDLE_H;
      if (pu.y + POWERUP_R >= ptop && pu.y - POWERUP_R <= ptop + PADDLE_H) {
        if (pu.x >= p.x - halfW - POWERUP_R && pu.x <= p.x + halfW + POWERUP_R) {
          applyPowerup(pu.kind);
          state.powerups.splice(j, 1);
          continue;
        }
      }
      if (pu.y > LOGICAL_H + 30) state.powerups.splice(j, 1);
    }

    // Update lasers
    for (var k = state.lasers.length - 1; k >= 0; k--) {
      var ls = state.lasers[k];
      ls.y -= LASER_SPEED * dt;
      if (ls.y < -10) { state.lasers.splice(k, 1); continue; }
      // Hit bricks
      var hit = laserHitBrick(ls);
      if (hit) state.lasers.splice(k, 1);
    }

    // Auto-fire lasers when active and space held (we use cooldown)
    if (state.lasersOn && state.lasersFireCooldown <= 0 && input.spaceHeld) {
      fireLaser();
    }

    // Update particles
    for (var m = state.particles.length - 1; m >= 0; m--) {
      var pt = state.particles[m];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 220 * dt;
      pt.life -= dt;
      if (pt.life <= 0) state.particles.splice(m, 1);
    }
    // Update brick fragments (gravity + drag + rotation)
    for (var fi = state.fragments.length - 1; fi >= 0; fi--) {
      var fg = state.fragments[fi];
      fg.x += fg.vx * dt;
      fg.y += fg.vy * dt;
      fg.vy += 360 * dt;     // gravity
      fg.vx *= 0.992;         // drag
      fg.rot += fg.vRot * dt;
      fg.life -= dt;
      if (fg.life <= 0 || fg.y > LOGICAL_H + 40) state.fragments.splice(fi, 1);
    }
    // Update floating callouts (drift up + fade)
    for (var ci = state.callouts.length - 1; ci >= 0; ci--) {
      var co = state.callouts[ci];
      co.y += co.vy * dt;
      co.vy *= 0.96; // ease-out drift
      co.life -= dt;
      if (co.life <= 0) state.callouts.splice(ci, 1);
    }
    // Update ripples (expanding ring)
    for (var ri = state.ripples.length - 1; ri >= 0; ri--) {
      var rp = state.ripples[ri];
      var rprog = 1 - (rp.life / rp.maxLife);
      rp.r = 8 + rprog * (rp.maxR - 8);
      rp.life -= dt;
      if (rp.life <= 0) state.ripples.splice(ri, 1);
    }
    // Decay screen shake
    if (state.shake.life > 0) {
      state.shake.life -= dt;
      if (state.shake.life <= 0) {
        state.shake.x = 0; state.shake.y = 0;
        state.shake.intensity = 0;
      } else {
        var damping = state.shake.life / state.shake.totalLife;
        state.shake.x = (Math.random() - 0.5) * 2 * state.shake.intensity * damping;
        state.shake.y = (Math.random() - 0.5) * 2 * state.shake.intensity * damping;
      }
    }

    // Tick power-up timers
    var nowTs = performance.now() / 1000;
    var changed = false;
    for (var key in state.activePowerups) {
      if (state.activePowerups[key] > 0 && state.activePowerups[key] < nowTs) {
        endPowerup(key);
        changed = true;
      }
    }
    if (changed) renderPowerupTray();

    // Level complete?
    if (state.bricksRemaining === 0 && phase === "playing") {
      onLevelClear();
    }
  }

  function handleLaunchOrFire() {
    // If we have a stuck ball, launch it
    var any = false;
    for (var i = 0; i < state.balls.length; i++) {
      if (state.balls[i].stuck) {
        state.balls[i].stuck = false;
        var spd = state.balls[i].speed;
        var ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.4; // mostly up
        state.balls[i].vx = Math.cos(ang) * spd;
        state.balls[i].vy = Math.sin(ang) * spd;
        any = true;
      }
    }
    // If lasers active, also fire one
    if (!any && state.lasersOn && state.lasersFireCooldown <= 0) {
      fireLaser();
    }
  }

  function fireLaser() {
    var p = state.paddle;
    var halfW = p.w / 2;
    var y = LOGICAL_H - PADDLE_Y_OFFSET - PADDLE_H - 2;
    state.lasers.push({ x: p.x - halfW + 12, y: y });
    state.lasers.push({ x: p.x + halfW - 12, y: y });
    state.lasersFireCooldown = LASER_COOLDOWN;
    sfx.laser();
  }

  function laserHitBrick(ls) {
    for (var i = 0; i < state.bricks.length; i++) {
      var br = state.bricks[i];
      if (ls.x >= br.x && ls.x <= br.x + br.w && ls.y >= br.y && ls.y <= br.y + br.h) {
        damageBrick(i, false); // laser doesn't combo
        return true;
      }
    }
    return false;
  }

  function hitBricksWithBall(b) {
    for (var i = 0; i < state.bricks.length; i++) {
      var br = state.bricks[i];
      if (b.x + BALL_R < br.x || b.x - BALL_R > br.x + br.w) continue;
      if (b.y + BALL_R < br.y || b.y - BALL_R > br.y + br.h) continue;

      // Determine bounce side by penetration depth
      var dxLeft = (b.x + BALL_R) - br.x;
      var dxRight = (br.x + br.w) - (b.x - BALL_R);
      var dyTop = (b.y + BALL_R) - br.y;
      var dyBot = (br.y + br.h) - (b.y - BALL_R);
      var minPen = Math.min(dxLeft, dxRight, dyTop, dyBot);
      if (minPen === dxLeft) { b.vx = -Math.abs(b.vx); b.x = br.x - BALL_R - 0.5; }
      else if (minPen === dxRight) { b.vx = Math.abs(b.vx); b.x = br.x + br.w + BALL_R + 0.5; }
      else if (minPen === dyTop) { b.vy = -Math.abs(b.vy); b.y = br.y - BALL_R - 0.5; }
      else { b.vy = Math.abs(b.vy); b.y = br.y + br.h + BALL_R + 0.5; }

      damageBrick(i, true);
      return; // one brick per frame per ball
    }
  }

  function damageBrick(i, fromBall) {
    var br = state.bricks[i];
    if (!br) return;
    br.hp -= 1;
    br.cracked = 1 - (br.hp / br.maxHp);
    if (br.hp <= 0) {
      shatterBrick(i, fromBall);
    } else {
      // Tiny particle burst on chip + tone keyed to row
      spawnParticles(br.x + br.w / 2, br.y + br.h / 2, br.color, reducedMotion ? 2 : 5, 0.4);
      sfx.brick(br.row || 0);
    }
  }

  function shatterBrick(i, fromBall) {
    var br = state.bricks[i];
    var era = ERAS[(state.level - 1) % ERAS.length];
    var cx = br.x + br.w / 2;
    var cy = br.y + br.h / 2;

    // Score with combo
    if (fromBall) {
      state.combo = Math.min(COMBO_MAX, state.combo + 1);
      if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    }
    var pts = 100 * state.combo;
    state.score += pts;

    // Combo milestone callouts
    if (fromBall) {
      var milestones = { 3: "STREAK 3×!", 5: "INCREDIBLE 5×!", 8: "ARCHIVE LEGEND 8×!" };
      if (milestones[state.combo] && state.lastComboMilestone < state.combo) {
        state.lastComboMilestone = state.combo;
        spawnCallout(cx, cy - 18, milestones[state.combo], era.accent, 1.3 + state.combo * 0.08);
        sfx.combo(state.combo);
      }
    }

    // Particles + fragments
    spawnParticles(cx, cy, br.color, reducedMotion ? 6 : 14, 0.7);
    spawnFragments(br);
    spawnRipple(cx, cy, br.color, 36 + state.combo * 4);

    // Screen shake — small for normal, big for boss
    triggerShake(br.isBoss ? 9 : 3, br.isBoss ? 360 : 140);
    if (br.isBoss) triggerHitPause(90);
    // Sound: brick thunk by row, boss fanfare for gold
    if (br.isBoss) sfx.boss();
    else sfx.brick(br.row || 0);

    // Drop power-up
    if (br.dropPower && state.powerups.length < 3) {
      spawnPowerup(cx, cy);
    }

    if (br.isBoss) {
      state.bossBricksRemaining--;
      spawnCallout(cx, cy - 30, "BOSS DOWN!", era.bossPalette[0] || era.accent, 1.6);
      // Big celebration on boss shatter
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({
            x: offsetX + cx * scale + canvas.getBoundingClientRect().left,
            y: offsetY + cy * scale + canvas.getBoundingClientRect().top,
            count: 40,
            palette: era.bossPalette
          });
        }
      } catch (e) {}
    }

    state.bricks.splice(i, 1);
    state.bricksRemaining--;
    updateHud();
    updateEraMeta();
  }

  function spawnParticles(x, y, color, n, life) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 180;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        color: color,
        life: life * (0.7 + Math.random() * 0.6),
        maxLife: life
      });
    }
  }

  // Spawn 4 rectangular fragments that scatter + rotate + fade.
  // Used when a brick fully shatters to give the break real heft.
  function spawnFragments(br) {
    if (reducedMotion) return;
    var halfW = br.w / 2;
    var halfH = br.h / 2;
    var positions = [
      { dx: -halfW / 2, dy: -halfH / 2 },
      { dx:  halfW / 2, dy: -halfH / 2 },
      { dx: -halfW / 2, dy:  halfH / 2 },
      { dx:  halfW / 2, dy:  halfH / 2 }
    ];
    var cx = br.x + halfW;
    var cy = br.y + halfH;
    for (var i = 0; i < 4; i++) {
      var p = positions[i];
      var ang = Math.atan2(p.dy, p.dx);
      var spd = 110 + Math.random() * 140;
      state.fragments.push({
        x: cx + p.dx,
        y: cy + p.dy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 60,
        rot: 0,
        vRot: (Math.random() - 0.5) * 8,
        w: br.w * 0.45,
        h: br.h * 0.45,
        color: br.color,
        life: 0.7 + Math.random() * 0.3,
        maxLife: 1
      });
    }
  }

  // Floating italic-text callout that drifts up + fades. Used for
  // combo milestones, perfect catches, multi-ball spawns.
  function spawnCallout(x, y, text, color, scale) {
    if (reducedMotion) {
      // Reduced motion still sees the text but without the float.
      state.callouts.push({ x: x, y: y, text: text, color: color || "#f5f0ff",
        life: 0.9, maxLife: 0.9, scale: scale || 1, vy: 0 });
      return;
    }
    state.callouts.push({
      x: x, y: y,
      text: text,
      color: color || "#f5f0ff",
      life: 1.1,
      maxLife: 1.1,
      scale: scale || 1,
      vy: -90
    });
  }

  // Expanding-ring shockwave (paddle hit, boss break).
  function spawnRipple(x, y, color, maxR) {
    if (reducedMotion) return;
    state.ripples.push({ x: x, y: y, r: 8, maxR: maxR || 60, color: color || "#f5f0ff",
      life: 0.45, maxLife: 0.45 });
  }

  // Trigger a screen shake. Layered in: small (paddle hit, regular
  // brick), medium (power-up grab, multi-ball), big (boss break).
  function triggerShake(intensity, durationMs) {
    if (reducedMotion) return;
    durationMs = durationMs || 220;
    // Don't downgrade a stronger active shake
    if (state.shake.life > 0 && state.shake.intensity > intensity) return;
    state.shake.intensity = intensity;
    state.shake.life = durationMs / 1000;
    state.shake.totalLife = state.shake.life;
  }

  // Briefly freeze the simulation (used on boss break for crunchy
  // impact). Update loop short-circuits while performance.now() is
  // less than state.hitPauseUntil.
  function triggerHitPause(durationMs) {
    if (reducedMotion) return;
    state.hitPauseUntil = performance.now() + (durationMs || 80);
  }

  function spawnPowerup(x, y) {
    var kinds = ["extend", "multi", "slow", "laser"];
    if (Math.random() < 0.08) kinds.push("life");
    var kind = kinds[Math.floor(Math.random() * kinds.length)];
    state.powerups.push({ x: x, y: y, kind: kind, t: 0 });
  }

  function applyPowerup(kind) {
    var nowTs = performance.now() / 1000;
    var px = state.paddle.x;
    var py = LOGICAL_H - PADDLE_Y_OFFSET - PADDLE_H;
    triggerShake(2, 110);
    sfx.powerup();
    if (kind === "extend") {
      state.paddle.w = PADDLE_BASE_W * 1.5;
      state.activePowerups.extend = nowTs + POWERUP_DURATIONS.extend;
      toast("Paddle Extended", "extend");
      spawnCallout(px, py - 30, "PADDLE+", "#52e8a0", 1.1);
      spawnRipple(px, py, "#52e8a0", 80);
    } else if (kind === "multi") {
      // Add 2 extra balls
      var base = state.balls[0];
      if (base) {
        for (var k = 0; k < 2; k++) {
          var ang = -Math.PI / 2 + (k === 0 ? -0.7 : 0.7);
          state.balls.push({
            x: base.x, y: base.y,
            vx: Math.cos(ang) * base.speed,
            vy: Math.sin(ang) * base.speed,
            stuck: false,
            speed: base.speed,
            trail: []
          });
        }
      }
      toast("Multi-ball!", "multi");
      spawnCallout(base ? base.x : px, base ? base.y - 30 : py - 30, "MULTI-BALL!", "#7af0ff", 1.4);
      spawnRipple(base ? base.x : px, base ? base.y : py, "#7af0ff", 90);
    } else if (kind === "slow") {
      state.ballSpeedMul = 0.7;
      state.activePowerups.slow = nowTs + POWERUP_DURATIONS.slow;
      toast("Slow-mo", "slow");
      spawnCallout(px, py - 30, "SLOW-MO", "#a991ff", 1.15);
    } else if (kind === "laser") {
      state.lasersOn = true;
      state.activePowerups.laser = nowTs + POWERUP_DURATIONS.laser;
      toast("Laser Paddle", "laser");
      spawnCallout(px, py - 30, "LASER PADDLE", "#ff7cc8", 1.15);
      spawnRipple(px, py, "#ff7cc8", 80);
    } else if (kind === "life") {
      state.lives++;
      updateHud();
      toast("+1 Life", "life");
      spawnCallout(px, py - 30, "+1 LIFE", "#52e8a0", 1.4);
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 30, palette: ["#52e8a0", "#5de0f0"] });
        }
      } catch (e) {}
    }
    renderPowerupTray();
  }

  function endPowerup(kind) {
    delete state.activePowerups[kind];
    if (kind === "extend") state.paddle.w = PADDLE_BASE_W;
    if (kind === "slow") state.ballSpeedMul = 1;
    if (kind === "laser") state.lasersOn = false;
  }

  function loseLife() {
    state.lives--;
    state.combo = 1;
    state.lastComboMilestone = 0;
    updateHud();
    sfx.lose();
    triggerShake(6, 280);
    if (state.lives <= 0) {
      gameOver(false);
    } else {
      placeBallOnPaddle();
    }
  }

  function onLevelClear() {
    phase = "levelend";
    saveSnapshot();
    // Brief "Era cleared" flash via toast
    var era = ERAS[(state.level - 1) % ERAS.length];
    toast(era.name + " cleared!", "trophy");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 60, palette: era.bossPalette.concat(era.palette) });
      }
    } catch (e) {}
    setTimeout(function () {
      // After last era -> win
      if (state.level >= ERAS.length) {
        gameOver(true);
        return;
      }
      // Offer bonus round
      promptBonusRound();
    }, 1100);
  }

  function promptBonusRound() {
    var era = ERAS[(state.level - 1) % ERAS.length];
    var nextEra = ERAS[state.level % ERAS.length];
    if (dom.bonusTitle) dom.bonusTitle.textContent = era.name + " complete";
    if (dom.bonusSub) dom.bonusSub.textContent = "Bonus round: 3 review questions · +1 life and +25 shards each correct. Up next: " + nextEra.name + ".";
    showScreen("bonus");
  }

  function startNextLevel() {
    state.level++;
    if (state.level > state.maxLevel) state.maxLevel = state.level;
    state.combo = 1;
    state.eraStartScore = state.score;
    // Clear power-ups
    state.powerups = [];
    state.lasers = [];
    state.activePowerups = {};
    state.lasersOn = false;
    state.ballSpeedMul = 1;
    state.paddle.w = PADDLE_BASE_W;
    renderPowerupTray();
    buildBricks(state.level);
    placeBallOnPaddle();
    // Update ball speeds to new level
    for (var i = 0; i < state.balls.length; i++) {
      state.balls[i].speed = ballSpeedForLevel(state.level);
    }
    updateHud();
    saveSnapshot();
    showScreen(null);
    phase = "playing";
  }
  // ── Render ───────────────────────────────────────────────────────────────
  function render() {
    var rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Screen-shake offset (zero when no shake active)
    var shakeX = (state && state.shake) ? state.shake.x : 0;
    var shakeY = (state && state.shake) ? state.shake.y : 0;

    // Map logical coords -> device pixel coords with letterbox + shake
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr,
      (offsetX + shakeX) * dpr, (offsetY + shakeY) * dpr);

    // Background gradient (logical-coord)
    var era = ERAS[((state ? state.level - 1 : 0)) % ERAS.length];
    var grad = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H * 0.4, 80, LOGICAL_W / 2, LOGICAL_H * 0.5, LOGICAL_W * 0.7);
    grad.addColorStop(0, era.bgA);
    grad.addColorStop(1, era.bgB);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Subtle starfield for Space Age
    if (era.name === "Space Age" && !reducedMotion) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,.3)";
      for (var s = 0; s < 30; s++) {
        var sx = (s * 173 + (performance.now() / 80) % LOGICAL_W) % LOGICAL_W;
        var sy = (s * 91) % LOGICAL_H;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.restore();
    }

    if (!state || phase === "setup") return;

    // Draw bricks
    for (var i = 0; i < state.bricks.length; i++) {
      drawBrick(state.bricks[i]);
    }

    // Draw powerups
    for (var p = 0; p < state.powerups.length; p++) {
      drawPowerup(state.powerups[p]);
    }

    // Draw lasers
    ctx.fillStyle = era.accent;
    for (var l = 0; l < state.lasers.length; l++) {
      var ls = state.lasers[l];
      ctx.fillRect(ls.x - 1.5, ls.y, 3, 12);
    }

    // Draw rotating brick fragments (behind paddle/balls)
    for (var fp = 0; fp < state.fragments.length; fp++) {
      var fg = state.fragments[fp];
      var fa = Math.max(0, Math.min(1, fg.life / fg.maxLife));
      ctx.save();
      ctx.globalAlpha = fa;
      ctx.translate(fg.x, fg.y);
      ctx.rotate(fg.rot);
      ctx.fillStyle = fg.color;
      ctx.fillRect(-fg.w / 2, -fg.h / 2, fg.w, fg.h);
      ctx.restore();
    }

    // Expanding ripples (behind paddle, ahead of bg)
    for (var rip = 0; rip < state.ripples.length; rip++) {
      var rp = state.ripples[rip];
      var ra = rp.life / rp.maxLife;
      ctx.save();
      ctx.globalAlpha = ra * 0.6;
      ctx.strokeStyle = rp.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw paddle
    drawPaddle(era);

    // Draw ball motion-blur trails before each ball
    if (!reducedMotion) {
      for (var tb = 0; tb < state.balls.length; tb++) {
        var trailBall = state.balls[tb];
        var tr = trailBall.trail || [];
        for (var ti = 0; ti < tr.length; ti++) {
          var ta = ((ti + 1) / tr.length) * 0.32;
          ctx.save();
          ctx.globalAlpha = ta;
          ctx.fillStyle = era.accent;
          ctx.beginPath();
          ctx.arc(tr[ti].x, tr[ti].y, BALL_R * (0.4 + (ti / tr.length) * 0.6), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Draw balls
    ctx.fillStyle = "#f5f0ff";
    for (var b = 0; b < state.balls.length; b++) {
      var bb = state.balls[b];
      ctx.beginPath();
      ctx.arc(bb.x, bb.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      // Soft glow
      ctx.save();
      ctx.globalAlpha = .35;
      ctx.beginPath();
      ctx.arc(bb.x, bb.y, BALL_R + 4, 0, Math.PI * 2);
      ctx.fillStyle = era.accent;
      ctx.fill();
      ctx.restore();
    }

    // Draw particles
    for (var pp = 0; pp < state.particles.length; pp++) {
      var pt = state.particles[pp];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
      ctx.restore();
    }

    // Draw floating callouts (above everything, italic Fraunces serif)
    for (var co = 0; co < state.callouts.length; co++) {
      var cc = state.callouts[co];
      var cAlpha = Math.max(0, Math.min(1, cc.life / cc.maxLife));
      var cScale = cc.scale || 1;
      // Pop-in scale on the early frames
      var pop = 1 + (1 - cAlpha) * 0.15;
      ctx.save();
      ctx.globalAlpha = cAlpha;
      ctx.translate(cc.x, cc.y);
      ctx.scale(cScale * pop, cScale * pop);
      ctx.font = "italic 800 22px Fraunces, Georgia, serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,.55)";
      ctx.lineWidth = 4;
      ctx.strokeText(cc.text, 0, 0);
      ctx.fillStyle = cc.color;
      ctx.fillText(cc.text, 0, 0);
      ctx.restore();
    }

    // Draw "press space to launch" hint when ball stuck
    if (state.balls.length === 1 && state.balls[0].stuck && phase === "playing") {
      ctx.save();
      ctx.fillStyle = "rgba(245,240,255,.85)";
      ctx.font = "italic 18px Fraunces, serif";
      ctx.textAlign = "center";
      ctx.fillText("Click or press Space to launch", LOGICAL_W / 2, LOGICAL_H / 2 + 60);
      ctx.restore();
    }
  }

  function drawBrick(br) {
    ctx.save();
    // Body
    var alpha = 1 - br.cracked * 0.3;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = br.color;
    roundRect(br.x, br.y, br.w, br.h, 3, true);

    // Inner highlight
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(br.x + 2, br.y + 2, br.w - 4, 3);

    // Boss bricks: gilded outline
    if (br.isBoss) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#fff0a0";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(br.x + 0.5, br.y + 0.5, br.w - 1, br.h - 1);
      // HP indicator
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(br.hp + "", br.x + br.w / 2, br.y + br.h / 2 + 4);
    } else if (br.maxHp > 1) {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "rgba(255,255,255,.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(br.x + 1, br.y + 1, br.w - 2, br.h - 2);
    }

    // Crack overlay if damaged
    if (br.cracked > 0.4) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(br.x + br.w * 0.2, br.y + 2);
      ctx.lineTo(br.x + br.w * 0.45, br.y + br.h - 2);
      ctx.moveTo(br.x + br.w * 0.6, br.y + 2);
      ctx.lineTo(br.x + br.w * 0.75, br.y + br.h - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPaddle(era) {
    var p = state.paddle;
    var halfW = p.w / 2;
    var y = LOGICAL_H - PADDLE_Y_OFFSET - PADDLE_H;
    ctx.save();
    // Glow
    ctx.shadowColor = era.accent;
    ctx.shadowBlur = reducedMotion ? 0 : 18;
    var g = ctx.createLinearGradient(0, y, 0, y + PADDLE_H);
    g.addColorStop(0, "#f5f0ff");
    g.addColorStop(0.5, era.accent);
    g.addColorStop(1, "#1a1030");
    ctx.fillStyle = g;
    roundRect(p.x - halfW, y, p.w, PADDLE_H, 4, true);
    ctx.shadowBlur = 0;
    // Inner highlight
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(p.x - halfW + 4, y + 2, p.w - 8, 2);
    // Laser nubs if active
    if (state.lasersOn) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ff7cc8";
      ctx.fillRect(p.x - halfW + 8, y - 3, 4, 4);
      ctx.fillRect(p.x + halfW - 12, y - 3, 4, 4);
    }
    ctx.restore();
  }

  function drawPowerup(pu) {
    var icons = { extend: "↔", multi: "●●", slow: "⏱", laser: "✦", life: "♥" };
    var color;
    if (pu.kind === "extend") color = "#5de0f0";
    else if (pu.kind === "multi") color = "#ff7cc8";
    else if (pu.kind === "slow") color = "#a991ff";
    else if (pu.kind === "laser") color = "#ff8e6f";
    else color = "#52e8a0";

    ctx.save();
    ctx.translate(pu.x, pu.y);
    ctx.rotate(pu.t * 1.2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = reducedMotion ? 0 : 12;
    roundRect(-POWERUP_R, -POWERUP_R, POWERUP_R * 2, POWERUP_R * 2, 4, true);
    ctx.shadowBlur = 0;
    ctx.rotate(-pu.t * 1.2);
    ctx.fillStyle = "#0c0820";
    ctx.font = "bold 12px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(icons[pu.kind] || "?", 0, 4);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r, fill) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
  }
  // ── HUD updates ──────────────────────────────────────────────────────────
  function updateHud() {
    if (!dom.hudScore) return;
    dom.hudScore.textContent = formatNumber(state.score);
    dom.hudLives.textContent = state.lives;
    dom.hudCombo.textContent = state.combo + "×";
    dom.hudLevel.textContent = state.level + "/" + ERAS.length;
  }

  function formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function renderPowerupTray() {
    if (!dom.powerupTray) return;
    var labels = { extend: ["↔", "Wide"], multi: ["●", "Multi"], slow: ["⏱", "Slow"], laser: ["✦", "Laser"] };
    var html = "";
    for (var k in state.activePowerups) {
      if (!labels[k]) continue;
      var nowTs = performance.now() / 1000;
      var rem = Math.max(0, Math.ceil(state.activePowerups[k] - nowTs));
      html += '<span class="powerup-chip"><span class="powerup-chip-icon">' + labels[k][0] + '</span>' + labels[k][1] + ' · ' + rem + 's</span>';
    }
    dom.powerupTray.innerHTML = html;
  }

  // Refresh powerup tray once a second
  setInterval(function () { if (state) renderPowerupTray(); }, 1000);
  // ── Toast (uses MrMacsToasts when available) ─────────────────────────────
  function toast(msg, kind) {
    try {
      if (window.MrMacsToasts && window.MrMacsToasts.show) {
        window.MrMacsToasts.show({ title: msg, kind: kind || "info", duration: 1800 });
        return;
      }
    } catch (e) {}
    // Fallback: brief title flash via era ribbon
    if (dom.eraMeta) {
      var prev = dom.eraMeta.textContent;
      dom.eraMeta.textContent = msg;
      setTimeout(function () { if (dom.eraMeta) updateEraMeta(); }, 1500);
    }
  }
  // ── Screens ──────────────────────────────────────────────────────────────
  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.bonusScreen, dom.pauseScreen, dom.endScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "bonus") dom.bonusScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
  }
  // ── Question modal ───────────────────────────────────────────────────────
  function pickQuestion(setHint) {
    // Try DIAG_BANK_BY_COURSE if available
    try {
      var bank = window.DIAG_BANK_BY_COURSE;
      if (bank && typeof bank === "object") {
        var pool = [];
        for (var c in bank) {
          if (Array.isArray(bank[c])) pool = pool.concat(bank[c]);
        }
        if (pool.length) {
          var q = pool[Math.floor(Math.random() * pool.length)];
          // Normalize to our shape
          var norm = normalizeBankQuestion(q);
          if (norm) return norm;
        }
      }
    } catch (e) {}
    // Inline fallback
    var matching = INLINE_BANK;
    if (setHint) {
      var filt = INLINE_BANK.filter(function (q) { return q.set === setHint; });
      if (filt.length >= 3) matching = filt;
    }
    return matching[Math.floor(Math.random() * matching.length)];
  }

  function normalizeBankQuestion(q) {
    if (!q) return null;
    if (q.prompt && q.choices && q.correctText) return q;
    // Try common alt shapes
    if (q.question && q.options) {
      var ct = null;
      if (typeof q.answer === "number" && q.options[q.answer]) ct = q.options[q.answer];
      else if (typeof q.correct === "number" && q.options[q.correct]) ct = q.options[q.correct];
      else if (q.correctText) ct = q.correctText;
      if (!ct) return null;
      return { prompt: q.question, choices: q.options.slice(), correctText: ct, set: q.set || "" };
    }
    return null;
  }

  var activeQuestion = null;
  var activeQuestionMode = null; // "boss" | "bonus"

  function openBossQuestion() {
    if (state.bossUsedThisLevel || state.bossBricksRemaining === 0) return;
    state.bossUsedThisLevel = true;
    activeQuestionMode = "boss";
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Boss Brick Challenge · Correct = shatter all gold";
    if (dom.questionCloseBtn) dom.questionCloseBtn.textContent = "Skip";
    renderQuestion();
    prevPhase = phase;
    phase = "question";
    pauseMusic();
    showScreen("question");
  }

  function openBonusQuestion() {
    activeQuestionMode = "bonus";
    activeQuestion = pickQuestion();
    if (dom.questionMeta) {
      var n = 4 - state.bonusQuestionsLeft;
      dom.questionMeta.textContent = "Bonus Round · Question " + n + " of 3";
    }
    if (dom.questionCloseBtn) dom.questionCloseBtn.textContent = "Skip Bonus";
    renderQuestion();
    showScreen("question");
  }

  function renderQuestion() {
    if (!activeQuestion) return;
    dom.questionPrompt.textContent = activeQuestion.prompt;
    dom.explanation.textContent = "";
    dom.explanation.className = "explanation";
    var letters = ["A", "B", "C", "D"];
    var choices = activeQuestion.choices.slice();
    // Shuffle
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
    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener("click", onChoiceClick);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
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
      dom.explanation.textContent = "Correct.";
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
    if (activeQuestionMode === "boss") {
      if (wasCorrect) {
        // Shatter all boss bricks
        for (var i = state.bricks.length - 1; i >= 0; i--) {
          if (state.bricks[i].isBoss) {
            shatterBrick(i, false);
          }
        }
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 60, palette: ["#f5d97a", "#d4a017", "#ffd060"] });
          }
        } catch (e) {}
      }
      // Resume
      phase = prevPhase || "playing";
      prevPhase = null;
      showScreen(null);
      resumeMusic();
    } else if (activeQuestionMode === "bonus") {
      if (wasCorrect) {
        state.lives++;
        var shardsBonus = 25;
        addShards(shardsBonus, GAME_ID + "-scholar-correct");
        updateHud();
      }
      state.bonusQuestionsLeft--;
      if (state.bonusQuestionsLeft > 0) {
        openBonusQuestion();
      } else {
        showScreen(null);
        startNextLevel();
      }
    }
    activeQuestion = null;
  }

  function skipQuestion() {
    if (activeQuestionMode === "boss") {
      phase = prevPhase || "playing";
      prevPhase = null;
      showScreen(null);
      resumeMusic();
    } else if (activeQuestionMode === "bonus") {
      state.bonusQuestionsLeft = 0;
      showScreen(null);
      startNextLevel();
    }
    activeQuestion = null;
  }
  // ── Game over ────────────────────────────────────────────────────────────
  function gameOver(won) {
    phase = "ended";
    stopMusic();
    saveSnapshot();
    // Compute shards (capped) & submit
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 100));
    if (shardsToAdd > 0) {
      addShards(shardsToAdd);
    }
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = won ? "Cabinet Cleared" : "Game Over";
    if (dom.endTitle) dom.endTitle.textContent = won ? "All eight eras conquered" : "Brickoria · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Era Reached</div><div class="end-cell-value">' + state.maxLevel + '/' + ERAS.length + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Combo</div><div class="end-cell-value">' + state.maxCombo + '×</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Bonus Q · Correct</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>'
      ].join("");
    }
    showScreen("end");
  }

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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { level: state.maxLevel });
      }
    } catch (e) {}
  }
  // ── Sessions ─────────────────────────────────────────────────────────────
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          level: state.level,
          score: state.score,
          lives: state.lives,
          maxLevel: state.maxLevel,
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
  // ── Music ────────────────────────────────────────────────────────────────
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("runner-synthwave", { volume: 0.55 });
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
  // ── Input ────────────────────────────────────────────────────────────────
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { input.leftDown = true; e.preventDefault(); }
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { input.rightDown = true; e.preventDefault(); }
      else if (e.key === " " || e.code === "Space") {
        if (phase === "playing") {
          input.spaceQueued = true;
          input.spaceHeld = true;
          e.preventDefault();
        }
      } else if (e.key === "Escape" || e.key === "Esc") {
        if (phase === "playing") togglePause();
        else if (phase === "paused") togglePause();
      } else if (e.key === "b" || e.key === "B") {
        if (phase === "playing") openBossQuestion();
      }
    });
    document.addEventListener("keyup", function (e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") input.leftDown = false;
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") input.rightDown = false;
      else if (e.key === " " || e.code === "Space") input.spaceHeld = false;
    });

    canvas.addEventListener("mousemove", function (e) {
      input.mouseX = clientToLogicalX(e.clientX);
    });
    canvas.addEventListener("mouseleave", function () {
      input.mouseX = null;
    });
    canvas.addEventListener("click", function () {
      if (phase === "playing") {
        input.spaceQueued = true;
      }
    });

    canvas.addEventListener("touchstart", function (e) {
      if (!e.touches.length) return;
      input.touchX = clientToLogicalX(e.touches[0].clientX);
      if (phase === "playing") {
        input.spaceQueued = true;
        input.spaceHeld = true;
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchmove", function (e) {
      if (!e.touches.length) return;
      input.touchX = clientToLogicalX(e.touches[0].clientX);
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchend", function () {
      input.touchX = null;
      input.spaceHeld = false;
    });
  }
  // ── Pause ────────────────────────────────────────────────────────────────
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
  // ── Bonus round trigger ──────────────────────────────────────────────────
  function startBonusRound() {
    state.bonusQuestionsLeft = 3;
    openBonusQuestion();
  }
  // ── Setup screen wire-up ─────────────────────────────────────────────────
  function bindUi() {
    dom.startBtn.addEventListener("click", function () {
      clearSnapshot();
      newRun();
    });

    dom.bonusSkipBtn.addEventListener("click", function () {
      showScreen(null);
      startNextLevel();
    });
    dom.bonusPlayBtn.addEventListener("click", function () {
      startBonusRound();
    });

    dom.resumeBtn.addEventListener("click", togglePause);
    dom.restartBtn.addEventListener("click", function () {
      clearSnapshot();
      newRun();
    });
    dom.pauseExitBtn.addEventListener("click", exitToArcade);
    dom.exitBtn.addEventListener("click", exitToArcade);
    dom.pauseBtn.addEventListener("click", togglePause);
    dom.bossBtn.addEventListener("click", function () {
      if (phase === "playing") openBossQuestion();
    });
    dom.setupBtn.addEventListener("click", function () {
      clearSnapshot();
      phase = "setup";
      stopMusic();
      showScreen("setup");
      renderSetupExtras();
    });
    dom.againBtn.addEventListener("click", function () {
      clearSnapshot();
      newRun();
    });
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
    initState({ level: 1, score: 0, lives: 3 });
    state.eraStartScore = 0;
    buildBricks(1);
    placeBallOnPaddle();
    updateHud();
    renderPowerupTray();
    showScreen(null);
    phase = "playing";
    startMusic();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state;
    initState({ level: s.level, score: s.score, lives: s.lives });
    state.maxLevel = s.maxLevel || s.level;
    buildBricks(state.level);
    placeBallOnPaddle();
    for (var i = 0; i < state.balls.length; i++) state.balls[i].speed = ballSpeedForLevel(state.level);
    updateHud();
    renderPowerupTray();
    showScreen(null);
    phase = "playing";
    startMusic();
    recordPlayWithProfile();
  }

  function recordPlayWithProfile() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/brickoria/index.html"
        });
      }
    } catch (e) {}
  }

  function renderSetupExtras() {
    // Resume card
    var snap = loadSnapshot();
    if (snap && snap.state && snap.state.level && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Era ' + snap.state.level + '/' + ERAS.length +
        ' · Score ' + formatNumber(snap.state.score) +
        ' · Lives ' + snap.state.lives + '</div>' +
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

    // Top-5 leaderboard
    if (dom.leaderboardPanel && window.MrMacsLeaderboards && window.MrMacsLeaderboards.top) {
      try {
        var top = window.MrMacsLeaderboards.top(GAME_ID, 5);
        if (top && top.length) {
          var html = '<div class="leaderboard-title">Top 5 Brickoria Scores</div>';
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
  // ── Boot ─────────────────────────────────────────────────────────────────
  function boot() {
    setupDom();
    applyEraTheme(ERAS[0]);
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

  // Save on tab close
  window.addEventListener("pagehide", function () {
    if (state && phase === "playing") saveSnapshot();
  });
})();
