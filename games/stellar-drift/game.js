/* ===========================================================================
   Stellar Drift — Asteroids-style vector arcade for Mr. Mac's Review Arcade
   Vanilla JS · Canvas · Newtonian inertia · Rare "intel asteroids" gate review
   =========================================================================== */
(function () {
  "use strict";
  // -- Config ----------------------------------------------------------------
  var GAME_ID = "stellar-drift";
  var GAME_TITLE = "Stellar Drift";
  var LOGICAL_W = 1024;
  var LOGICAL_H = 640;

  var SHIP_R = 14;                 // ship hit radius
  var SHIP_DRAW_R = 16;            // ship visual radius
  var SHIP_TURN = Math.PI * 1.9;   // rad/sec
  var SHIP_THRUST = 240;           // px/sec^2
  var SHIP_FRICTION = 0.992;       // per-frame multiplier (applied each update)
  var SHIP_MAX_SPEED = 460;
  var BULLET_SPEED = 540;
  var BULLET_LIFE = 1.0;           // seconds
  var BULLET_MAX = 8;
  var FIRE_INTERVAL_BASE = 0.20;   // 5/sec
  var HYPER_COOLDOWN = 8.0;
  var HYPER_INVINCIBILITY = 1.0;
  var RESPAWN_INVINCIBILITY = 2.0;
  var RESPAWN_DELAY = 1.5;

  var ASTEROID_LARGE_R = 50;
  var ASTEROID_MED_R = 28;
  var ASTEROID_SMALL_R = 14;
  var ASTEROID_BASE_SPEED = 60;    // px/sec at wave 1
  var ASTEROID_SPEED_GROWTH = 1.045;
  var ASTEROID_SPLIT_BOOST = 1.18;

  var UFO_LARGE_R = 22;
  var UFO_SMALL_R = 14;
  var UFO_LARGE_SPEED = 100;
  var UFO_SMALL_SPEED = 150;
  var UFO_SHOT_SPEED = 320;
  var UFO_SHOT_LIFE = 1.6;
  var UFO_SHOT_INTERVAL_LARGE = 1.5;
  var UFO_SHOT_INTERVAL_SMALL = 1.1;

  var POWERUP_DROP_RATE = 0.05;
  var POWERUP_R = 13;
  var POWERUP_DRIFT = 30;
  var POWERUP_TTL = 12; // seconds drifting before despawn

  var POWERUP_DURATIONS = {
    triple: 12, rapid: 10, shield: 12, slowtime: 10
    // shards: instant
  };

  var SCORE_LARGE = 20;
  var SCORE_MED = 50;
  var SCORE_SMALL = 100;
  var SCORE_UFO = 1000;
  var EXTRA_LIFE_EVERY = 10000;
  var SHARDS_CAP = 200;

  var BOSS_R = 80;
  var BOSS_HP = 12;
  var BOSS_SHOT_INTERVAL = 1.4;
  var BOSS_SHOT_SPEED = 280;

  // -- Inline review bank (kept small + portable; supplements course bank) ---
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
    { prompt: "The first human on the moon was:", choices: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"], correctText: "Neil Armstrong" },
    { prompt: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Declaration of Independence", "Constitution", "Bill of Rights", "Federalist No. 10"], correctText: "Declaration of Independence" },
    { prompt: "Checks and balances divides power among:", choices: ["Three branches of government", "Federal and state", "Senate and House", "Citizens and government"], correctText: "Three branches of government" },
    { prompt: "The 13th Amendment (1865):", choices: ["Abolished slavery", "Granted voting rights to women", "Created income tax", "Gave Black men the vote"], correctText: "Abolished slavery" },
    { prompt: "The 19th Amendment (1920):", choices: ["Granted women the right to vote", "Repealed Prohibition", "Lowered the voting age", "Established direct election of senators"], correctText: "Granted women the right to vote" },
    { prompt: "The New Deal (1930s) was a response to:", choices: ["The Great Depression", "World War I", "The Dust Bowl alone", "The Cold War"], correctText: "The Great Depression" },
    { prompt: "Pearl Harbor (Dec 7, 1941) led directly to:", choices: ["U.S. entry into World War II", "End of WWII", "The Marshall Plan", "Founding of the UN"], correctText: "U.S. entry into World War II" },
    { prompt: "The Holocaust was the systematic murder of:", choices: ["Six million European Jews and others", "Soviet POWs only", "German political prisoners", "Polish civilians only"], correctText: "Six million European Jews and others" },
    { prompt: "The U.S. Constitution's Preamble begins with:", choices: ["We the People", "When in the course", "Four score and seven", "All men are created equal"], correctText: "We the People" },
    { prompt: "The Magna Carta (1215) is significant because it:", choices: ["Limited the power of the English king", "Established Parliament", "Ended the Hundred Years' War", "Created common law"], correctText: "Limited the power of the English king" }
  ];

  // -- State -----------------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var canvasW = LOGICAL_W, canvasH = LOGICAL_H;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended
  var prevPhase = null;
  var lastFrame = 0;
  var rafHandle = null;
  var lastSnapshotTs = 0;

  var input = {
    leftDown: false,
    rightDown: false,
    thrustDown: false,
    fireDown: false,
    fireQueued: false,
    hyperQueued: false
  };

  var state = null;
  var thrustNode = null; // running oscillator while thrust held

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
        // Slight low-pass via running average
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
    shoot: function () { sfxTone(880, 0.06, { type: "square", volume: 0.08, endFreq: 540 }); },
    explodeSmall: function () { sfxNoise(0.18, { volume: 0.14, cutoff: 1800 }); sfxTone(220, 0.12, { type: "triangle", volume: 0.08, endFreq: 110 }); },
    explodeMed:   function () { sfxNoise(0.28, { volume: 0.18, cutoff: 1400 }); sfxTone(160, 0.20, { type: "sawtooth", volume: 0.10, endFreq: 70 }); },
    explodeLarge: function () { sfxNoise(0.42, { volume: 0.22, cutoff: 900 });  sfxTone(110, 0.32, { type: "sawtooth", volume: 0.13, endFreq: 50 }); },
    ufoAlarm: function () { sfxTone(420, 0.25, { type: "sawtooth", volume: 0.12, endFreq: 720 }); },
    powerup: function () {
      sfxTone(660, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(880, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    intelPing: function () { sfxTone(1100, 0.08, { type: "sine", volume: 0.05 }); },
    bossIntro: function () {
      var notes = [220, 277, 330, 415];
      notes.forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "sawtooth", volume: 0.14 }); }, i * 110);
      });
    },
    bossHit: function () { sfxTone(180, 0.10, { type: "square", volume: 0.13, endFreq: 110 }); },
    bossDie: function () {
      sfxNoise(0.6, { volume: 0.22, cutoff: 700 });
      [110, 165, 220, 277, 330].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.20, { type: "sawtooth", volume: 0.13 }); }, i * 90);
      });
    },
    death: function () { sfxTone(420, 0.5, { type: "sawtooth", volume: 0.18, endFreq: 60 }); },
    hyperspace: function () { sfxTone(1200, 0.22, { type: "sine", volume: 0.10, endFreq: 240 }); }
  };
  // Continuous thrust hum: keep a single low oscillator alive while held.
  function thrustOn() {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA || thrustNode) return;
    try {
      var osc = ctxA.createOscillator();
      var gain = ctxA.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 90;
      gain.gain.setValueAtTime(0, ctxA.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctxA.currentTime + 0.04);
      var lfo = ctxA.createOscillator();
      lfo.frequency.value = 18;
      var lfoGain = ctxA.createGain();
      lfoGain.gain.value = 14;
      lfo.connect(lfoGain).connect(osc.frequency);
      osc.connect(gain).connect(ctxA.destination);
      osc.start();
      lfo.start();
      thrustNode = { osc: osc, lfo: lfo, gain: gain };
    } catch (e) {}
  }
  function thrustOff() {
    if (!thrustNode) return;
    try {
      var ctxA = sfxCtx;
      var n = thrustNode;
      thrustNode = null;
      if (!ctxA) return;
      var t = ctxA.currentTime;
      n.gain.gain.cancelScheduledValues(t);
      n.gain.gain.setValueAtTime(n.gain.gain.value, t);
      n.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      n.osc.stop(t + 0.12);
      n.lfo.stop(t + 0.12);
    } catch (e) {}
  }

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("stellarCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudWave = $("hudWave");
    dom.hudHyper = $("hudHyper");
    dom.waveName = $("waveName");
    dom.waveMeta = $("waveMeta");
    dom.powerupTray = $("powerupTray");
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
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
    dom.touchRotL = $("touchRotL");
    dom.touchRotR = $("touchRotR");
    dom.touchThrust = $("touchThrust");
    dom.touchFire = $("touchFire");
    dom.touchHyper = $("touchHyper");
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    state = {
      wave: opts.wave || 1,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : 3,
      maxWave: opts.wave || 1,
      shardsAwarded: 0,
      nextExtraLifeAt: EXTRA_LIFE_EVERY,
      ship: makeShip(),
      asteroids: [],
      bullets: [],
      ufoBullets: [],
      ufos: [],
      boss: null,
      powerups: [],
      particles: [],
      callouts: [],
      stars: makeStars(),
      timeSinceUfo: 0,
      waveActiveTime: 0,
      hyperCooldown: 0,
      respawnAt: 0,
      activePowerups: {},      // kind -> expiresAt (timestamp seconds since boot)
      slowFactor: 1,
      tripleShot: false,
      rapidFire: false,
      shield: false,
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      time: 0,                 // seconds elapsed in playing phase
      fireCooldown: 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      intelHit: 0
    };
    state.ship.invincibleUntil = state.time + RESPAWN_INVINCIBILITY;
  }

  function makeShip() {
    return {
      x: LOGICAL_W / 2,
      y: LOGICAL_H / 2,
      vx: 0, vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      flameFlicker: 0,
      invincibleUntil: 0,
      alive: true
    };
  }

  function makeStars() {
    var arr = [];
    var layers = reducedMotion ? 1 : 3;
    var counts = [60, 36, 18];
    var speeds = [6, 14, 28];
    var sizes = [0.8, 1.2, 1.8];
    for (var L = 0; L < layers; L++) {
      var n = counts[L];
      for (var i = 0; i < n; i++) {
        arr.push({
          x: Math.random() * LOGICAL_W,
          y: Math.random() * LOGICAL_H,
          layer: L,
          drift: speeds[L],
          size: sizes[L],
          twinkle: Math.random() * Math.PI * 2
        });
      }
    }
    return arr;
  }

  // -- Asteroid factory ------------------------------------------------------
  function asteroidShape() {
    var n = 10 + Math.floor(Math.random() * 4); // 10-13 vertices
    var verts = [];
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2;
      var jitter = 0.78 + Math.random() * 0.34; // 0.78..1.12
      verts.push({ a: ang, r: jitter });
    }
    return verts;
  }

  function makeAsteroid(size, x, y, hint) {
    var radius = size === "large" ? ASTEROID_LARGE_R
              : size === "medium" ? ASTEROID_MED_R
              : ASTEROID_SMALL_R;
    var speed = ASTEROID_BASE_SPEED * Math.pow(ASTEROID_SPEED_GROWTH, state.wave - 1);
    if (size === "medium") speed *= ASTEROID_SPLIT_BOOST;
    if (size === "small") speed *= ASTEROID_SPLIT_BOOST * 1.06;
    speed *= (0.7 + Math.random() * 0.6);
    var angle = (hint && typeof hint.angle === "number") ? hint.angle : Math.random() * Math.PI * 2;
    return {
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: radius,
      size: size,
      verts: asteroidShape(),
      rot: 0,
      rotSpeed: (Math.random() - 0.5) * 0.6,
      isIntel: false,
      pulse: 0
    };
  }

  // -- Wave construction -----------------------------------------------------
  function startWave(wave) {
    state.wave = wave;
    state.maxWave = Math.max(state.maxWave, wave);
    state.timeSinceUfo = 0;
    state.waveActiveTime = 0;
    state.asteroids = [];
    state.ufos = [];
    state.ufoBullets = [];
    state.boss = null;

    var isBossWave = wave % 5 === 0;
    if (isBossWave) {
      spawnBoss();
      sfx.bossIntro();
      pushCallout("MISCONCEPTION MOTHERSHIP", LOGICAL_W / 2, LOGICAL_H / 2 - 80, "#f07bb8", 1.6);
    } else {
      // 4 large asteroids on wave 1, +1 each wave up to 12.
      var count = Math.max(4, Math.min(12, 4 + (wave - 1)));
      // 1-2 intel asteroids per wave (rarer early)
      var intelCount = 1 + (wave >= 3 ? 1 : 0);
      for (var i = 0; i < count; i++) {
        var pos = randomAsteroidSpawn();
        var a = makeAsteroid("large", pos.x, pos.y);
        state.asteroids.push(a);
      }
      // Mark intel asteroids (Fisher-Yates pick of distinct indices)
      var idxPool = [];
      for (var iz = 0; iz < state.asteroids.length; iz++) idxPool.push(iz);
      for (var iy = idxPool.length - 1; iy > 0; iy--) {
        var jz = Math.floor(Math.random() * (iy + 1));
        var tmp = idxPool[iy]; idxPool[iy] = idxPool[jz]; idxPool[jz] = tmp;
      }
      for (var ix = 0; ix < intelCount && ix < idxPool.length; ix++) {
        state.asteroids[idxPool[ix]].isIntel = true;
      }
      pushCallout("WAVE " + wave, LOGICAL_W / 2, LOGICAL_H / 2 - 60, "#5de0f0", 1.4);
    }

    if (dom.waveName) dom.waveName.textContent = isBossWave ? ("Mothership · Wave " + wave) : ("Wave " + wave);
    updateWaveMeta();
  }

  function randomAsteroidSpawn() {
    // Spawn away from the ship's center quadrant
    var x, y, attempts = 0;
    while (attempts++ < 12) {
      x = Math.random() * LOGICAL_W;
      y = Math.random() * LOGICAL_H;
      var dx = x - LOGICAL_W / 2;
      var dy = y - LOGICAL_H / 2;
      if (Math.sqrt(dx * dx + dy * dy) > 220) return { x: x, y: y };
    }
    return { x: x, y: y };
  }

  function spawnBoss() {
    state.boss = {
      x: LOGICAL_W / 2,
      y: -BOSS_R - 20,
      vx: 0, vy: 50,
      r: BOSS_R,
      hp: BOSS_HP,
      maxHp: BOSS_HP,
      verts: asteroidShape().map(function (v) { return { a: v.a, r: v.r * 0.9 + 0.15 }; }),
      rot: 0,
      rotSpeed: 0.18,
      shotCd: 1.8
    };
  }

  function updateWaveMeta() {
    if (!dom.waveMeta) return;
    if (state.boss) {
      dom.waveMeta.textContent = "Mothership: " + state.boss.hp + " / " + state.boss.maxHp;
    } else {
      dom.waveMeta.textContent = "Asteroids: " + state.asteroids.length;
    }
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

  // -- Game loop -------------------------------------------------------------
  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.04, (ts - lastFrame) / 1000);
    lastFrame = ts;

    if (phase === "playing") {
      update(dt);
      if (ts - lastSnapshotTs > 10000) { lastSnapshotTs = ts; saveSnapshot(); }
      if (ts - lastTrayRender > 250) { lastTrayRender = ts; renderPowerupTray(); }
    }
    render();
    rafHandle = requestAnimationFrame(loop);
  }

  function update(dt) {
    state.time += dt;
    state.waveActiveTime += dt;
    state.timeSinceUfo += dt;
    state.hyperCooldown = Math.max(0, state.hyperCooldown - dt);

    // Slow time effect (asteroids + UFOs)
    var slow = state.activePowerups.slowtime ? 0.6 : 1;
    state.slowFactor = slow;

    // Decay active powerups
    var keys = Object.keys(state.activePowerups);
    for (var pi = 0; pi < keys.length; pi++) {
      if (state.time > state.activePowerups[keys[pi]]) {
        delete state.activePowerups[keys[pi]];
      }
    }
    state.tripleShot = !!state.activePowerups.triple;
    state.rapidFire = !!state.activePowerups.rapid;
    state.shield = !!state.activePowerups.shield;

    // Respawn check
    if (!state.ship.alive && state.respawnAt > 0 && state.time >= state.respawnAt) {
      state.ship = makeShip();
      state.ship.invincibleUntil = state.time + RESPAWN_INVINCIBILITY;
      state.respawnAt = 0;
    }

    // Ship physics
    if (state.ship.alive) {
      var s = state.ship;
      // Rotate
      if (input.leftDown && !input.rightDown) s.angle -= SHIP_TURN * dt;
      else if (input.rightDown && !input.leftDown) s.angle += SHIP_TURN * dt;
      // Thrust
      s.thrusting = !!input.thrustDown;
      if (s.thrusting) {
        s.vx += Math.cos(s.angle) * SHIP_THRUST * dt;
        s.vy += Math.sin(s.angle) * SHIP_THRUST * dt;
        s.flameFlicker = (s.flameFlicker + dt * 22) % (Math.PI * 2);
      }
      // Cap speed
      var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (sp > SHIP_MAX_SPEED) {
        s.vx = (s.vx / sp) * SHIP_MAX_SPEED;
        s.vy = (s.vy / sp) * SHIP_MAX_SPEED;
      }
      // Friction (very mild — Asteroids tradition)
      s.vx *= Math.pow(SHIP_FRICTION, dt * 60);
      s.vy *= Math.pow(SHIP_FRICTION, dt * 60);
      // Move
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      wrap(s);

      // Hyperspace
      if (input.hyperQueued) {
        input.hyperQueued = false;
        if (state.hyperCooldown <= 0) doHyperspace();
      }

      // Fire
      state.fireCooldown -= dt;
      var fireInterval = state.rapidFire ? FIRE_INTERVAL_BASE / 2.5 : FIRE_INTERVAL_BASE;
      if ((input.fireDown || input.fireQueued) && state.fireCooldown <= 0) {
        fireBullet();
        state.fireCooldown = fireInterval;
      }
      input.fireQueued = false;
    } else {
      input.fireQueued = false;
    }

    // Bullets
    for (var bi = state.bullets.length - 1; bi >= 0; bi--) {
      var b = state.bullets[bi];
      b.life -= dt;
      if (b.life <= 0) { state.bullets.splice(bi, 1); continue; }
      if (!reducedMotion) {
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 5) b.trail.shift();
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      wrapPos(b);
    }

    // UFO bullets
    for (var ubi = state.ufoBullets.length - 1; ubi >= 0; ubi--) {
      var ub = state.ufoBullets[ubi];
      ub.life -= dt;
      if (ub.life <= 0) { state.ufoBullets.splice(ubi, 1); continue; }
      ub.x += ub.vx * dt;
      ub.y += ub.vy * dt;
      wrapPos(ub);
      // Hit ship?
      if (state.ship.alive && state.time > state.ship.invincibleUntil && !state.shield) {
        var ddx = ub.x - state.ship.x, ddy = ub.y - state.ship.y;
        if (ddx * ddx + ddy * ddy < (SHIP_R + 3) * (SHIP_R + 3)) {
          state.ufoBullets.splice(ubi, 1);
          loseLife();
          continue;
        }
      } else if (state.shield && state.ship.alive) {
        var sdx = ub.x - state.ship.x, sdy = ub.y - state.ship.y;
        if (sdx * sdx + sdy * sdy < (SHIP_R + 3) * (SHIP_R + 3)) {
          // Bounce
          var mag = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
          var nx = sdx / mag, ny = sdy / mag;
          var dot = ub.vx * nx + ub.vy * ny;
          ub.vx -= 2 * dot * nx;
          ub.vy -= 2 * dot * ny;
          spawnSpark(ub.x, ub.y, "#5de0f0", 6);
        }
      }
    }

    // Asteroids
    for (var ai = state.asteroids.length - 1; ai >= 0; ai--) {
      var a = state.asteroids[ai];
      a.x += a.vx * slow * dt;
      a.y += a.vy * slow * dt;
      a.rot += a.rotSpeed * slow * dt;
      if (a.isIntel) a.pulse = (a.pulse + dt * 2.6) % (Math.PI * 2);
      wrap(a);
      // Bullet vs asteroid
      var hit = -1;
      for (var bj = 0; bj < state.bullets.length; bj++) {
        var bul = state.bullets[bj];
        var dx = bul.x - a.x, dy = bul.y - a.y;
        if (dx * dx + dy * dy < a.r * a.r) { hit = bj; break; }
      }
      if (hit >= 0) {
        state.bullets.splice(hit, 1);
        if (a.isIntel) {
          // Open intel intercept; do NOT split yet
          a.isIntel = false;
          state.asteroids.splice(ai, 1);
          state.intelHit++;
          spawnExplosion(a.x, a.y, a.size, "#e8b84b");
          openIntelQuestion();
          continue;
        }
        splitAsteroid(ai);
        continue;
      }
      // Ship vs asteroid
      if (state.ship.alive && state.time > state.ship.invincibleUntil) {
        var sx = a.x - state.ship.x, sy = a.y - state.ship.y;
        var rs = a.r + SHIP_R;
        if (sx * sx + sy * sy < rs * rs) {
          if (state.shield) {
            // Bounce: push asteroid out
            var mag2 = Math.sqrt(sx * sx + sy * sy) || 1;
            var nx2 = sx / mag2, ny2 = sy / mag2;
            a.vx = nx2 * 80;
            a.vy = ny2 * 80;
            a.x = state.ship.x + nx2 * (rs + 1);
            a.y = state.ship.y + ny2 * (rs + 1);
            spawnSpark(state.ship.x + nx2 * SHIP_R, state.ship.y + ny2 * SHIP_R, "#5de0f0", 10);
            sfxTone(420, 0.06, { type: "triangle", volume: 0.10 });
          } else {
            spawnExplosion(a.x, a.y, a.size, "#a991ff");
            state.asteroids.splice(ai, 1);
            loseLife();
            continue;
          }
        }
      }
    }

    // UFOs
    for (var ui = state.ufos.length - 1; ui >= 0; ui--) {
      var u = state.ufos[ui];
      u.x += u.vx * slow * dt;
      u.y += u.vy * slow * dt;
      // Vertical drift sin wave
      u.driftPhase += dt;
      u.y += Math.sin(u.driftPhase * 1.3) * 24 * slow * dt;
      // Off-screen exit
      if (u.x < -60 || u.x > LOGICAL_W + 60) { state.ufos.splice(ui, 1); continue; }
      // Shoot
      u.shotCd -= dt;
      if (u.shotCd <= 0) {
        u.shotCd = u.size === "small" ? UFO_SHOT_INTERVAL_SMALL : UFO_SHOT_INTERVAL_LARGE;
        ufoShoot(u);
      }
      // Bullet vs UFO
      var uHit = -1;
      for (var bk = 0; bk < state.bullets.length; bk++) {
        var bb = state.bullets[bk];
        var dxu = bb.x - u.x, dyu = bb.y - u.y;
        if (dxu * dxu + dyu * dyu < u.r * u.r) { uHit = bk; break; }
      }
      if (uHit >= 0) {
        state.bullets.splice(uHit, 1);
        spawnExplosion(u.x, u.y, "medium", "#f07bb8");
        addScore(SCORE_UFO);
        pushCallout("UFO +" + SCORE_UFO, u.x, u.y - 22, "#f07bb8", 1.0);
        state.ufos.splice(ui, 1);
        continue;
      }
      // Ship vs UFO
      if (state.ship.alive && state.time > state.ship.invincibleUntil && !state.shield) {
        var sxu = u.x - state.ship.x, syu = u.y - state.ship.y;
        var rsu = u.r + SHIP_R;
        if (sxu * sxu + syu * syu < rsu * rsu) {
          spawnExplosion(u.x, u.y, "medium", "#f07bb8");
          state.ufos.splice(ui, 1);
          loseLife();
          continue;
        }
      }
    }

    // Boss
    if (state.boss) {
      var bs = state.boss;
      // Drift in then patrol horizontally
      if (bs.y < 140) bs.y += 50 * dt;
      else {
        bs.x += bs.vx * dt;
        if (bs.vx === 0) bs.vx = 70;
        if (bs.x < 120 || bs.x > LOGICAL_W - 120) bs.vx = -bs.vx;
      }
      bs.rot += bs.rotSpeed * dt;
      bs.shotCd -= dt;
      if (bs.shotCd <= 0) {
        bs.shotCd = BOSS_SHOT_INTERVAL;
        bossShoot(bs);
      }
      // Bullet vs boss
      for (var bb2 = state.bullets.length - 1; bb2 >= 0; bb2--) {
        var bul2 = state.bullets[bb2];
        var dxb = bul2.x - bs.x, dyb = bul2.y - bs.y;
        if (dxb * dxb + dyb * dyb < bs.r * bs.r) {
          state.bullets.splice(bb2, 1);
          bs.hp--;
          spawnSpark(bul2.x, bul2.y, "#f07bb8", 8);
          sfx.bossHit();
          triggerShake(2, 90);
          updateWaveMeta();
          if (bs.hp <= 0) {
            spawnExplosion(bs.x, bs.y, "large", "#f07bb8");
            spawnExplosion(bs.x + 30, bs.y + 10, "medium", "#a991ff");
            spawnExplosion(bs.x - 30, bs.y - 10, "medium", "#5de0f0");
            addScore(5000);
            pushCallout("MOTHERSHIP DESTROYED · +5000", bs.x, bs.y - 60, "#f0d068", 1.7);
            state.boss = null;
            sfx.bossDie();
            try { if (window.MrMacsCelebration && !reducedMotion) window.MrMacsCelebration.burst({ count: 60, palette: ["#f07bb8", "#a991ff", "#5de0f0", "#f0d068"] }); } catch (e) {}
            scheduleNextWave();
            break;
          }
        }
      }
      // Ship vs boss
      if (state.ship.alive && state.boss && state.time > state.ship.invincibleUntil && !state.shield) {
        var sxb = bs.x - state.ship.x, syb = bs.y - state.ship.y;
        var rsb = bs.r + SHIP_R;
        if (sxb * sxb + syb * syb < rsb * rsb) {
          loseLife();
        }
      }
    }

    // Powerups (drifting)
    for (var pi2 = state.powerups.length - 1; pi2 >= 0; pi2--) {
      var pu = state.powerups[pi2];
      pu.x += pu.vx * dt;
      pu.y += pu.vy * dt;
      pu.t += dt;
      pu.pulse = (pu.pulse + dt * 3) % (Math.PI * 2);
      wrapPos(pu);
      if (pu.t > POWERUP_TTL) { state.powerups.splice(pi2, 1); continue; }
      // Pickup by ship
      if (state.ship.alive) {
        var pdx = pu.x - state.ship.x, pdy = pu.y - state.ship.y;
        if (pdx * pdx + pdy * pdy < (POWERUP_R + SHIP_R) * (POWERUP_R + SHIP_R)) {
          applyPowerup(pu.kind);
          state.powerups.splice(pi2, 1);
        }
      }
    }

    // UFO spawn timing
    if (!state.boss && state.waveActiveTime > 15 && state.timeSinceUfo > (25 + Math.random() * 15)) {
      state.timeSinceUfo = 0;
      spawnUfo();
    }

    // Particles
    for (var pp = state.particles.length - 1; pp >= 0; pp--) {
      var p = state.particles[pp];
      p.life -= dt;
      if (p.life <= 0) { state.particles.splice(pp, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.rot += p.rotSpeed * dt;
    }
    // Callouts
    for (var co = state.callouts.length - 1; co >= 0; co--) {
      var cc = state.callouts[co];
      cc.life -= dt;
      cc.y -= 20 * dt;
      if (cc.life <= 0) state.callouts.splice(co, 1);
    }
    // Stars (parallax — drift slow)
    if (!reducedMotion) {
      for (var st = 0; st < state.stars.length; st++) {
        var star = state.stars[st];
        star.x -= star.drift * dt;
        if (star.x < 0) star.x += LOGICAL_W;
        star.twinkle += dt * (1 + star.layer * 0.4);
      }
    }
    // Shake decay
    if (state.shake.life > 0) {
      state.shake.life = Math.max(0, state.shake.life - dt * 1000);
      var k = state.shake.life / Math.max(1, state.shake.totalLife);
      var amp = state.shake.intensity * k;
      state.shake.x = (Math.random() - 0.5) * amp * 2;
      state.shake.y = (Math.random() - 0.5) * amp * 2;
    } else {
      state.shake.x = 0; state.shake.y = 0;
    }

    // Wave clear?
    if (!state.boss && state.asteroids.length === 0 && state.ufos.length === 0 && phase === "playing") {
      // Award wave clear bonus + advance
      var bonus = 100 * state.wave;
      addScore(bonus);
      pushCallout("WAVE CLEAR · +" + bonus, LOGICAL_W / 2, LOGICAL_H / 2 - 40, "#5de0f0", 1.6);
      try { if (window.MrMacsCelebration && !reducedMotion) window.MrMacsCelebration.burst({ count: 26, palette: ["#5de0f0", "#a991ff", "#52e8a0"] }); } catch (e) {}
      scheduleNextWave();
    }

    // HUD
    updateHud();
  }

  function scheduleNextWave() {
    saveSnapshot();
    var nextWave = state.wave + 1;
    setTimeout(function () {
      if (phase === "playing") startWave(nextWave);
    }, 1100);
  }

  // -- Ship actions ----------------------------------------------------------
  function fireBullet() {
    if (state.bullets.length >= BULLET_MAX) return;
    var s = state.ship;
    var muzzleX = s.x + Math.cos(s.angle) * SHIP_DRAW_R;
    var muzzleY = s.y + Math.sin(s.angle) * SHIP_DRAW_R;
    function spawn(angle) {
      if (state.bullets.length >= BULLET_MAX) return;
      state.bullets.push({
        x: muzzleX, y: muzzleY,
        vx: Math.cos(angle) * BULLET_SPEED + s.vx * 0.2,
        vy: Math.sin(angle) * BULLET_SPEED + s.vy * 0.2,
        life: BULLET_LIFE,
        trail: []
      });
    }
    if (state.tripleShot) {
      spawn(s.angle - 0.18);
      spawn(s.angle);
      spawn(s.angle + 0.18);
    } else {
      spawn(s.angle);
    }
    sfx.shoot();
  }

  function doHyperspace() {
    var s = state.ship;
    sfx.hyperspace();
    spawnSpark(s.x, s.y, "#a991ff", 16);
    s.x = 60 + Math.random() * (LOGICAL_W - 120);
    s.y = 60 + Math.random() * (LOGICAL_H - 120);
    s.vx = 0; s.vy = 0;
    state.hyperCooldown = HYPER_COOLDOWN;
    s.invincibleUntil = state.time + HYPER_INVINCIBILITY;
    // 5% self-destruct chance (Asteroids tradition)
    if (Math.random() < 0.05) {
      pushCallout("HYPERSPACE FAULT", s.x, s.y - 30, "#f04860", 1.4);
      spawnExplosion(s.x, s.y, "medium", "#f07bb8");
      loseLife();
    } else {
      spawnSpark(s.x, s.y, "#a991ff", 16);
    }
  }

  function loseLife() {
    var s = state.ship;
    sfx.death();
    spawnExplosion(s.x, s.y, "medium", "#f07bb8");
    triggerShake(6, 320);
    s.alive = false;
    state.lives--;
    if (state.lives <= 0) {
      gameOver(false);
      return;
    }
    state.respawnAt = state.time + RESPAWN_DELAY;
    saveSnapshot();
  }

  // -- Asteroid splitting ----------------------------------------------------
  function splitAsteroid(idx) {
    var a = state.asteroids[idx];
    state.asteroids.splice(idx, 1);
    var color, scoreVal, sfxFn;
    if (a.size === "large") { color = "#f0a060"; scoreVal = SCORE_LARGE; sfxFn = sfx.explodeLarge; }
    else if (a.size === "medium") { color = "#d0c468"; scoreVal = SCORE_MED; sfxFn = sfx.explodeMed; }
    else { color = "#5de0f0"; scoreVal = SCORE_SMALL; sfxFn = sfx.explodeSmall; }
    addScore(scoreVal);
    pushCallout("+" + scoreVal, a.x, a.y - 12, color, 0.8);
    spawnExplosion(a.x, a.y, a.size, color);
    sfxFn();
    triggerShake(a.size === "large" ? 3 : a.size === "medium" ? 2 : 1, a.size === "large" ? 140 : 90);

    // Split: Large -> 2 medium, Medium -> 2 small, Small -> destroyed
    var nextSize = a.size === "large" ? "medium" : a.size === "medium" ? "small" : null;
    if (nextSize) {
      var ang = Math.atan2(a.vy, a.vx);
      state.asteroids.push(makeAsteroid(nextSize, a.x, a.y, { angle: ang + 0.5 + Math.random() * 0.4 }));
      state.asteroids.push(makeAsteroid(nextSize, a.x, a.y, { angle: ang - 0.5 - Math.random() * 0.4 }));
    }
    // 5% chance any kill drops a powerup
    if (Math.random() < POWERUP_DROP_RATE) dropPowerup(a.x, a.y);
    updateWaveMeta();
  }

  function dropPowerup(x, y) {
    var kinds = ["triple", "rapid", "shield", "slowtime", "shards"];
    var weights = [22, 22, 22, 22, 12];
    var total = 0; for (var i = 0; i < weights.length; i++) total += weights[i];
    var roll = Math.random() * total, acc = 0, kind = "triple";
    for (var j = 0; j < kinds.length; j++) {
      acc += weights[j];
      if (roll <= acc) { kind = kinds[j]; break; }
    }
    var ang = Math.random() * Math.PI * 2;
    state.powerups.push({
      x: x, y: y,
      vx: Math.cos(ang) * POWERUP_DRIFT,
      vy: Math.sin(ang) * POWERUP_DRIFT,
      kind: kind,
      t: 0,
      pulse: 0
    });
  }

  function applyPowerup(kind) {
    sfx.powerup();
    pushCallout(powerupLabel(kind), state.ship.x, state.ship.y - 28, powerupColor(kind), 1.2);
    if (kind === "shards") {
      addShards(50);
      pushCallout("+50 SHARDS", state.ship.x, state.ship.y - 50, "#f0d068", 1.2);
      return;
    }
    var dur = POWERUP_DURATIONS[kind] || 10;
    state.activePowerups[kind] = state.time + dur;
    renderPowerupTray();
  }

  function powerupLabel(kind) {
    return ({
      triple: "TRIPLE SHOT",
      rapid: "RAPID FIRE",
      shield: "SHIELD",
      slowtime: "SLOW TIME",
      shards: "+50 SHARDS"
    })[kind] || kind.toUpperCase();
  }
  function powerupColor(kind) {
    return ({
      triple: "#5de0f0",
      rapid: "#f07bb8",
      shield: "#52e8a0",
      slowtime: "#a991ff",
      shards: "#f0d068"
    })[kind] || "#f0f5ff";
  }
  function powerupGlyph(kind) {
    return ({ triple: "***", rapid: ">>>", shield: "()", slowtime: "Z..", shards: "+50" })[kind] || "?";
  }

  // -- UFOs ------------------------------------------------------------------
  function spawnUfo() {
    var fromLeft = Math.random() < 0.5;
    var sizeIsSmall = state.wave >= 4 && Math.random() < 0.5;
    var u = {
      x: fromLeft ? -40 : LOGICAL_W + 40,
      y: 80 + Math.random() * (LOGICAL_H - 160),
      vx: (fromLeft ? 1 : -1) * (sizeIsSmall ? UFO_SMALL_SPEED : UFO_LARGE_SPEED),
      vy: 0,
      r: sizeIsSmall ? UFO_SMALL_R : UFO_LARGE_R,
      size: sizeIsSmall ? "small" : "large",
      driftPhase: Math.random() * Math.PI * 2,
      shotCd: 1.0
    };
    state.ufos.push(u);
    sfx.ufoAlarm();
    pushCallout("UFO INBOUND", u.x + (fromLeft ? 80 : -80), u.y - 40, "#f07bb8", 1.0);
  }

  function ufoShoot(u) {
    var s = state.ship;
    if (!s.alive) return;
    var dx = s.x - u.x, dy = s.y - u.y;
    var ang = Math.atan2(dy, dx);
    var inacc = u.size === "small" ? 0.06 : 0.22;
    ang += (Math.random() - 0.5) * inacc * 2;
    state.ufoBullets.push({
      x: u.x, y: u.y,
      vx: Math.cos(ang) * UFO_SHOT_SPEED,
      vy: Math.sin(ang) * UFO_SHOT_SPEED,
      life: UFO_SHOT_LIFE
    });
    sfxTone(540, 0.06, { type: "square", volume: 0.06, endFreq: 320 });
  }

  function bossShoot(bs) {
    var s = state.ship;
    if (!s.alive) {
      // Spread shot when no target
      for (var k = 0; k < 5; k++) {
        var a = (k / 5) * Math.PI * 2;
        state.ufoBullets.push({ x: bs.x, y: bs.y, vx: Math.cos(a) * BOSS_SHOT_SPEED, vy: Math.sin(a) * BOSS_SHOT_SPEED, life: 2.4 });
      }
      return;
    }
    var ang = Math.atan2(s.y - bs.y, s.x - bs.x);
    for (var i = -1; i <= 1; i++) {
      state.ufoBullets.push({
        x: bs.x, y: bs.y,
        vx: Math.cos(ang + i * 0.18) * BOSS_SHOT_SPEED,
        vy: Math.sin(ang + i * 0.18) * BOSS_SHOT_SPEED,
        life: 2.4
      });
    }
    sfxTone(180, 0.10, { type: "sawtooth", volume: 0.10, endFreq: 90 });
  }

  // -- Wrap helpers ----------------------------------------------------------
  function wrap(o) {
    if (o.x < -o.r) o.x = LOGICAL_W + o.r;
    if (o.x > LOGICAL_W + o.r) o.x = -o.r;
    if (o.y < -o.r) o.y = LOGICAL_H + o.r;
    if (o.y > LOGICAL_H + o.r) o.y = -o.r;
  }
  function wrapPos(o) {
    if (o.x < 0) o.x = LOGICAL_W;
    if (o.x > LOGICAL_W) o.x = 0;
    if (o.y < 0) o.y = LOGICAL_H;
    if (o.y > LOGICAL_H) o.y = 0;
  }

  // -- Score, shards, lives --------------------------------------------------
  function addScore(n) {
    state.score += n;
    while (state.score >= state.nextExtraLifeAt) {
      state.lives++;
      state.nextExtraLifeAt += EXTRA_LIFE_EVERY;
      pushCallout("EXTRA SHIP", state.ship.x, state.ship.y - 50, "#52e8a0", 1.5);
      sfx.powerup();
    }
    updateHud();
  }

  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = state.lives;
    if (dom.hudWave) dom.hudWave.textContent = state.wave;
    if (dom.hudHyper) dom.hudHyper.textContent = state.hyperCooldown > 0 ? state.hyperCooldown.toFixed(1) : "RDY";
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Particles + polish ----------------------------------------------------
  function spawnExplosion(x, y, size, color) {
    var n = size === "large" ? 22 : size === "medium" ? 14 : 8;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = 60 + Math.random() * (size === "large" ? 220 : size === "medium" ? 150 : 110);
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.5 + Math.random() * 0.45,
        maxLife: 0.95,
        color: color,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 6,
        len: 6 + Math.random() * 8
      });
    }
  }
  function spawnSpark(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * 120;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.55,
        color: color,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4,
        len: 4 + Math.random() * 4
      });
    }
  }
  function pushCallout(text, x, y, color, life) {
    state.callouts.push({
      text: text, x: x, y: y, color: color || "#f0f5ff",
      life: life || 1.0, maxLife: life || 1.0
    });
  }
  function triggerShake(intensity, ms) {
    if (reducedMotion) return;
    if (state.shake.life > ms) return;
    state.shake.intensity = intensity;
    state.shake.life = ms;
    state.shake.totalLife = ms;
  }

  // -- Render ----------------------------------------------------------------
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var shakeX = (state && state.shake) ? state.shake.x : 0;
    var shakeY = (state && state.shake) ? state.shake.y : 0;
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr,
      (offsetX + shakeX) * dpr, (offsetY + shakeY) * dpr);

    // Background gradient
    var grad = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H * 0.45, 80, LOGICAL_W / 2, LOGICAL_H * 0.5, LOGICAL_W * 0.7);
    grad.addColorStop(0, "#0a1426");
    grad.addColorStop(1, "#02060f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Starfield
    if (state) drawStars();
    // Subtle grid
    if (!reducedMotion) drawGrid();

    if (!state || phase === "setup") return;

    // Asteroids
    for (var i = 0; i < state.asteroids.length; i++) drawAsteroid(state.asteroids[i]);
    // Boss
    if (state.boss) drawBoss(state.boss);
    // UFOs
    for (var u = 0; u < state.ufos.length; u++) drawUfo(state.ufos[u]);
    // Powerups
    for (var p = 0; p < state.powerups.length; p++) drawPowerup(state.powerups[p]);
    // UFO bullets
    for (var ub = 0; ub < state.ufoBullets.length; ub++) drawUfoBullet(state.ufoBullets[ub]);
    // Bullet trails (behind heads)
    if (!reducedMotion) {
      for (var bt = 0; bt < state.bullets.length; bt++) drawBulletTrail(state.bullets[bt]);
    }
    // Bullets
    for (var bi = 0; bi < state.bullets.length; bi++) drawBullet(state.bullets[bi]);
    // Particles
    for (var pp = 0; pp < state.particles.length; pp++) drawParticle(state.particles[pp]);
    // Ship
    if (state.ship.alive) drawShip(state.ship);

    // Callouts
    for (var co = 0; co < state.callouts.length; co++) drawCallout(state.callouts[co]);

    // Hyperspace cooldown ring (corner indicator)
    if (state.hyperCooldown > 0) drawHyperRing();
  }

  function drawStars() {
    if (!state.stars) return;
    var t = state.time || 0;
    ctx.save();
    for (var i = 0; i < state.stars.length; i++) {
      var s = state.stars[i];
      var tw = (Math.sin(s.twinkle + t * 1.4) * 0.3 + 0.7);
      ctx.globalAlpha = (0.18 + s.layer * 0.18) * tw;
      ctx.fillStyle = s.layer === 2 ? "#a8c4f0" : s.layer === 1 ? "#d0d8ee" : "#ffffff";
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.restore();
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(93,224,240,.04)";
    ctx.lineWidth = 1;
    var step = 64;
    for (var x = 0; x < LOGICAL_W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, LOGICAL_H);
      ctx.stroke();
    }
    for (var y = 0; y < LOGICAL_H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(LOGICAL_W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShip(s) {
    var blink = state.time < s.invincibleUntil;
    if (blink && (Math.floor(state.time * 12) % 2 === 0)) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);

    // Shield halo
    if (state.shield) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = "#52e8a0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, SHIP_DRAW_R + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#52e8a0";
      ctx.beginPath();
      ctx.arc(0, 0, SHIP_DRAW_R + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Ship triangle (vector)
    ctx.strokeStyle = "#f0f5ff";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(SHIP_DRAW_R, 0);
    ctx.lineTo(-SHIP_DRAW_R * 0.7, -SHIP_DRAW_R * 0.7);
    ctx.lineTo(-SHIP_DRAW_R * 0.4, 0);
    ctx.lineTo(-SHIP_DRAW_R * 0.7, SHIP_DRAW_R * 0.7);
    ctx.closePath();
    ctx.stroke();

    // Inner highlight (cyan glow)
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "#5de0f0";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Thrust flame
    if (s.thrusting) {
      var f = 0.6 + Math.sin(s.flameFlicker) * 0.35;
      ctx.save();
      ctx.strokeStyle = "#f0d068";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-SHIP_DRAW_R * 0.4, -SHIP_DRAW_R * 0.35);
      ctx.lineTo(-SHIP_DRAW_R * (1.0 + f), 0);
      ctx.lineTo(-SHIP_DRAW_R * 0.4, SHIP_DRAW_R * 0.35);
      ctx.stroke();
      ctx.strokeStyle = "rgba(240,123,184,.55)";
      ctx.beginPath();
      ctx.moveTo(-SHIP_DRAW_R * 0.4, -SHIP_DRAW_R * 0.2);
      ctx.lineTo(-SHIP_DRAW_R * (0.7 + f * 0.4), 0);
      ctx.lineTo(-SHIP_DRAW_R * 0.4, SHIP_DRAW_R * 0.2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    var color;
    if (a.isIntel) {
      var pulse = 0.6 + Math.sin(a.pulse) * 0.4;
      ctx.shadowColor = "#f0d068";
      ctx.shadowBlur = 12 + 8 * pulse;
      color = "#f0d068";
    } else if (a.size === "large") color = "#f0a060";
    else if (a.size === "medium") color = "#d0c468";
    else color = "#5de0f0";
    ctx.strokeStyle = color;
    ctx.lineWidth = a.isIntel ? 2 : 1.6;
    ctx.beginPath();
    for (var i = 0; i < a.verts.length; i++) {
      var v = a.verts[i];
      var px = Math.cos(v.a) * a.r * v.r;
      var py = Math.sin(v.a) * a.r * v.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    if (a.isIntel) {
      ctx.save();
      ctx.fillStyle = "#f0d068";
      ctx.font = "italic 700 11px Fraunces, Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("INTEL", a.x, a.y + 4);
      ctx.restore();
    }
  }

  function drawBoss(bs) {
    ctx.save();
    ctx.translate(bs.x, bs.y);
    ctx.rotate(bs.rot);
    ctx.shadowColor = "#f07bb8";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#f07bb8";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (var i = 0; i < bs.verts.length; i++) {
      var v = bs.verts[i];
      var px = Math.cos(v.a) * bs.r * v.r;
      var py = Math.sin(v.a) * bs.r * v.r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner ring
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(169,145,255,.7)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, bs.r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(93,224,240,.5)";
    ctx.beginPath();
    ctx.arc(0, 0, bs.r * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // HP bar above
    var w = 140, h = 6;
    var hpFrac = bs.hp / bs.maxHp;
    ctx.save();
    ctx.translate(bs.x, bs.y - bs.r - 22);
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "#f07bb8";
    ctx.fillRect(-w / 2, -h / 2, w * hpFrac, h);
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2 - .5, -h / 2 - .5, w + 1, h + 1);
    ctx.fillStyle = "#f0d068";
    ctx.font = "800 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("MOTHERSHIP", 0, -8);
    ctx.restore();
  }

  function drawUfo(u) {
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.strokeStyle = u.size === "small" ? "#f07bb8" : "#a991ff";
    ctx.lineWidth = 1.6;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 8;
    // Saucer
    ctx.beginPath();
    ctx.moveTo(-u.r, 0);
    ctx.lineTo(-u.r * 0.5, -u.r * 0.45);
    ctx.lineTo(u.r * 0.5, -u.r * 0.45);
    ctx.lineTo(u.r, 0);
    ctx.lineTo(u.r * 0.5, u.r * 0.4);
    ctx.lineTo(-u.r * 0.5, u.r * 0.4);
    ctx.closePath();
    ctx.stroke();
    // Cockpit dome
    ctx.beginPath();
    ctx.arc(0, -u.r * 0.45, u.r * 0.4, Math.PI, 0);
    ctx.stroke();
    // Center stripe
    ctx.beginPath();
    ctx.moveTo(-u.r, 0);
    ctx.lineTo(u.r, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawPowerup(pu) {
    var color = powerupColor(pu.kind);
    var pulse = 0.7 + Math.sin(pu.pulse) * 0.3;
    ctx.save();
    ctx.translate(pu.x, pu.y);
    ctx.shadowColor = color;
    ctx.shadowBlur = 12 * pulse;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    // Hex
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var ang = (i / 6) * Math.PI * 2 + pu.pulse * 0.3;
      var px = Math.cos(ang) * POWERUP_R;
      var py = Math.sin(ang) * POWERUP_R;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = "800 9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(powerupGlyph(pu.kind), 0, 4);
    ctx.restore();
  }

  function drawBulletTrail(b) {
    if (!b.trail || !b.trail.length) return;
    ctx.save();
    ctx.strokeStyle = "#f0f5ff";
    for (var i = 0; i < b.trail.length; i++) {
      var t = b.trail[i];
      var alpha = ((i + 1) / b.trail.length) * 0.45;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var nx = i + 1 < b.trail.length ? b.trail[i + 1].x : b.x;
      var ny = i + 1 < b.trail.length ? b.trail[i + 1].y : b.y;
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBullet(b) {
    var fade = Math.min(1, b.life / BULLET_LIFE);
    ctx.save();
    ctx.shadowColor = "#f0f5ff";
    ctx.shadowBlur = 6;
    ctx.strokeStyle = "rgba(240,245,255," + fade + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x - 3, b.y);
    ctx.lineTo(b.x + 3, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawUfoBullet(ub) {
    ctx.save();
    ctx.shadowColor = "#f07bb8";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#f07bb8";
    ctx.beginPath();
    ctx.arc(ub.x, ub.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticle(p) {
    var alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-p.len / 2, 0);
    ctx.lineTo(p.len / 2, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawCallout(cc) {
    var alpha = Math.max(0, Math.min(1, cc.life / cc.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "italic 800 22px Fraunces, Georgia, serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,.6)";
    ctx.lineWidth = 4;
    ctx.strokeText(cc.text, cc.x, cc.y);
    ctx.fillStyle = cc.color;
    ctx.fillText(cc.text, cc.x, cc.y);
    ctx.restore();
  }

  function drawHyperRing() {
    var frac = state.hyperCooldown / HYPER_COOLDOWN;
    ctx.save();
    ctx.translate(LOGICAL_W - 36, 36);
    ctx.strokeStyle = "rgba(169,145,255,.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, -Math.PI / 2, -Math.PI / 2 + (1 - frac) * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#a991ff";
    ctx.font = "700 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("HYP", 0, 4);
    ctx.restore();
  }

  // -- Powerup tray ----------------------------------------------------------
  // Re-rendered on demand from the game loop (every ~250 ms during play) so
  // that countdowns tick down. Keeps DOM writes cheap and bounded.
  var lastTrayRender = 0;
  function renderPowerupTray() {
    if (!dom.powerupTray || !state) return;
    var html = "";
    var keys = Object.keys(state.activePowerups);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var remaining = Math.max(0, state.activePowerups[k] - state.time);
      html += '<span class="powerup-chip" style="border-color:' + powerupColor(k) + ';">' +
        '<span class="powerup-chip-icon">' + powerupGlyph(k) + '</span> ' +
        powerupLabel(k) + ' &middot; ' + remaining.toFixed(1) + 's</span>';
    }
    dom.powerupTray.innerHTML = html;
  }

  // -- Intel / review intercept ----------------------------------------------
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

  function openIntelQuestion() {
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Intel Intercept · Optional · Bonus shards";
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
      dom.explanation.textContent = "Intel decrypted. +1000 score · +50 shards.";
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
      addScore(1000);
      addShards(50, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 36, palette: ["#f0d068", "#5de0f0", "#52e8a0"] });
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

  // -- Game over -------------------------------------------------------------
  function gameOver(won) {
    phase = "ended";
    stopMusic();
    thrustOff();
    saveSnapshot();
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 200));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = won ? "Sector Cleared" : "Cruiser Lost";
    if (dom.endTitle) dom.endTitle.textContent = won ? "Sector traversed" : "Stellar Drift · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Wave Reached</div><div class="end-cell-value">' + state.maxWave + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Intel Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Shards Earned</div><div class="end-cell-value">' + state.shardsAwarded + '</div></div>'
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { wave: state.maxWave });
      }
    } catch (e) {}
  }
  // -- Sessions --------------------------------------------------------------
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          wave: state.wave,
          score: state.score,
          lives: state.lives,
          maxWave: state.maxWave,
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
  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("rift-survivors", { volume: 0.55 });
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
        if (k === "ArrowLeft" || k === "a" || k === "A") { input.leftDown = true; e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { input.rightDown = true; e.preventDefault(); return; }
        if (k === "ArrowUp" || k === "w" || k === "W") {
          if (!input.thrustDown) thrustOn();
          input.thrustDown = true; e.preventDefault(); return;
        }
        if (k === " " || e.code === "Space") {
          input.fireDown = true; input.fireQueued = true; e.preventDefault(); return;
        }
        if (k === "Shift" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
          input.hyperQueued = true; e.preventDefault(); return;
        }
      }
      if (k === "Escape" || k === "Esc" || k === "p" || k === "P") {
        if (phase === "playing" || phase === "paused") togglePause();
      }
    });
    document.addEventListener("keyup", function (e) {
      var k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") input.leftDown = false;
      else if (k === "ArrowRight" || k === "d" || k === "D") input.rightDown = false;
      else if (k === "ArrowUp" || k === "w" || k === "W") {
        input.thrustDown = false; thrustOff();
      } else if (k === " " || e.code === "Space") input.fireDown = false;
    });
    // Touch buttons
    bindHoldButton(dom.touchRotL, function (down) { input.leftDown = down; });
    bindHoldButton(dom.touchRotR, function (down) { input.rightDown = down; });
    bindHoldButton(dom.touchThrust, function (down) {
      if (phase !== "playing") return;
      if (down && !input.thrustDown) thrustOn();
      if (!down && input.thrustDown) thrustOff();
      input.thrustDown = down;
    });
    bindHoldButton(dom.touchFire, function (down) {
      if (phase !== "playing") return;
      input.fireDown = down;
      if (down) input.fireQueued = true;
    });
    if (dom.touchHyper) dom.touchHyper.addEventListener("click", function () {
      if (phase === "playing") input.hyperQueued = true;
    });
  }

  function bindHoldButton(el, fn) {
    if (!el) return;
    var down = function (e) { e.preventDefault(); fn(true); };
    var up   = function (e) { if (e) e.preventDefault(); fn(false); };
    el.addEventListener("touchstart", down, { passive: false });
    el.addEventListener("touchend", up, { passive: false });
    el.addEventListener("touchcancel", up, { passive: false });
    el.addEventListener("mousedown", down);
    el.addEventListener("mouseup", up);
    el.addEventListener("mouseleave", up);
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing") {
      prevPhase = "playing";
      phase = "paused";
      thrustOff();
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
      thrustOff();
      showScreen("setup");
      renderSetupExtras();
    });
    dom.againBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.questionCloseBtn.addEventListener("click", skipQuestion);
    dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) { stopMusic(); thrustOff(); }
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
    thrustOff();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  function newRun() {
    initState({ wave: 1, score: 0, lives: 3 });
    startWave(1);
    updateHud();
    renderPowerupTray();
    showScreen(null);
    phase = "playing";
    startMusic();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state;
    initState({ wave: s.wave, score: s.score, lives: s.lives });
    state.maxWave = s.maxWave || s.wave;
    startWave(state.wave);
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
          file: "games/stellar-drift/index.html"
        });
      }
    } catch (e) {}
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && snap.state.wave && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Wave ' + snap.state.wave +
        ' &middot; Score ' + formatNumber(snap.state.score) +
        ' &middot; Ships ' + snap.state.lives + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Stellar Drift Scores</div>';
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
    thrustOff();
  });
})();
