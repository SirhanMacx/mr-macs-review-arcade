/* ===========================================================================
   Pinball Empire — Cabinet Pinball · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x900 logical · 4-zone table · multiball · scholar bonus rounds
   Theme: civilizations through history (Sumer → Egypt → Greece → Rome → Tang → Mali → Aztec → Industrial)
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "pinball-empire";
  var GAME_TITLE = "Pinball Empire";

  // Logical canvas (vertical pinball cabinet)
  var LOGICAL_W = 720;
  var LOGICAL_H = 900;

  // Physics
  var GRAVITY = 720;                // px/s^2 downward
  var BALL_RADIUS = 11;
  var BALL_FRICTION = 0.998;        // mild drag per frame
  var BALL_MAX_SPEED = 1500;
  var WALL_BOUNCE = 0.78;           // wall restitution
  var BUMPER_BOUNCE = 1.28;         // pop bumper kicks faster than ball came in
  var SLINGSHOT_BOUNCE = 1.18;
  var DROP_BOUNCE = 0.85;
  var FLIPPER_REST_ANGLE = 0.42;     // radians - resting downward slope
  var FLIPPER_ACTIVE_ANGLE = -0.55;  // radians - flicked up
  var FLIPPER_LENGTH = 92;
  var FLIPPER_THICK = 16;
  var FLIPPER_FLIP_SPEED = 22;        // rad/s when activating
  var FLIPPER_RETURN_SPEED = 11;      // rad/s on return

  // Plunger
  var PLUNGER_MAX_CHARGE = 1.0;       // seconds to fully charge
  var PLUNGER_MIN_VEL = 540;
  var PLUNGER_MAX_VEL = 1180;

  // Score / progression
  var BUMPER_POINTS = 100;
  var DROP_POINTS = 200;
  var DROP_ROW_BONUS = 1000;
  var SPINNER_POINTS = 50;
  var SAUCER_POINTS = 5000;
  var SLINGSHOT_POINTS = 50;
  var JACKPOT_POINTS = 10000;
  var BALLS_INIT = 3;
  var EXTRA_BALL_THRESHOLD = 100000;
  var BONUS_ROUND_INTERVAL = 50000;
  var BONUS_CORRECT_BONUS = 5000;
  var SHARDS_CAP = 200;

  // Multiball
  var MULTIBALL_LOCK_TARGET = 3;       // 3 saucer locks (or 3 drop-row completions) → multiball
  var MULTIBALL_BALLS = 3;
  var MULTIBALL_DURATION = 60.0;       // multiball ends naturally after all but 1 ball drains

  // Empire progression
  var EMPIRES = [
    { name: "Sumer",       theme: "#a96e3d" },
    { name: "Egypt",       theme: "#f5c451" },
    { name: "Greece",      theme: "#5de0f0" },
    { name: "Rome",        theme: "#cf8a3d" },
    { name: "Tang China",  theme: "#f07bb8" },
    { name: "Mali",        theme: "#4dd49b" },
    { name: "Aztec",       theme: "#a991ff" },
    { name: "Industrial",  theme: "#d0d8ee" }
  ];

  // -- Inline review bank (28 entries — covering empires/civilizations) -------
  var INLINE_BANK = [
    { prompt: "The first known cities arose in:",
      choices: ["Mesopotamia, between the Tigris and Euphrates", "The Nile Delta only", "The Indus Valley first", "The Yellow River basin first"],
      correctText: "Mesopotamia, between the Tigris and Euphrates" },
    { prompt: "Cuneiform was the writing system of:",
      choices: ["Sumer", "Egypt", "Greece", "Rome"],
      correctText: "Sumer" },
    { prompt: "The Code of Hammurabi is significant because it:",
      choices: ["Is one of the earliest known written law codes", "Established the first democracy", "Banned slavery", "Created Roman citizenship"],
      correctText: "Is one of the earliest known written law codes" },
    { prompt: "The Egyptian pyramids at Giza were built primarily as:",
      choices: ["Royal tombs", "Granaries", "Astronomical observatories", "Defensive forts"],
      correctText: "Royal tombs" },
    { prompt: "Egyptian hieroglyphic writing was decoded thanks to the:",
      choices: ["Rosetta Stone", "Dead Sea Scrolls", "Magna Carta", "Code of Hammurabi"],
      correctText: "Rosetta Stone" },
    { prompt: "The Indus Valley civilization is best known for:",
      choices: ["Planned cities like Mohenjo-daro and Harappa", "Pyramid construction", "Phalanx warfare", "Triremes and naval power"],
      correctText: "Planned cities like Mohenjo-daro and Harappa" },
    { prompt: "Athenian democracy allowed political participation by:",
      choices: ["Adult male citizens", "All adult residents", "Women and male citizens", "Slaves and citizens"],
      correctText: "Adult male citizens" },
    { prompt: "The philosopher Socrates is most associated with:",
      choices: ["The Socratic method of questioning", "Founding the Academy", "Writing the Republic", "Tutoring Alexander the Great"],
      correctText: "The Socratic method of questioning" },
    { prompt: "Alexander the Great's empire spread which culture across three continents?",
      choices: ["Hellenistic (Greek)", "Roman", "Persian", "Egyptian"],
      correctText: "Hellenistic (Greek)" },
    { prompt: "The Roman Republic transitioned to an empire under:",
      choices: ["Augustus", "Julius Caesar's dictatorship alone", "Cicero", "Marcus Aurelius"],
      correctText: "Augustus" },
    { prompt: "Pax Romana refers to:",
      choices: ["A long period of relative peace and stability in the Roman Empire", "A treaty ending the Punic Wars", "A military reform under Diocletian", "Roman law applied to provinces"],
      correctText: "A long period of relative peace and stability in the Roman Empire" },
    { prompt: "The Han Dynasty in China is famous for:",
      choices: ["Opening the Silk Road and refining Confucian governance", "Building the Great Wall from scratch", "Inventing gunpowder", "Defeating the Mongols"],
      correctText: "Opening the Silk Road and refining Confucian governance" },
    { prompt: "Confucianism emphasizes:",
      choices: ["Social harmony, filial piety, and proper conduct", "Withdrawal from society into nature", "A strict legal code with harsh punishment", "Salvation through divine grace"],
      correctText: "Social harmony, filial piety, and proper conduct" },
    { prompt: "The Tang Dynasty (618-907 CE) is associated with:",
      choices: ["A golden age of poetry, trade, and Buddhism in China", "The fall of Rome", "The Mongol conquests", "European colonization of Asia"],
      correctText: "A golden age of poetry, trade, and Buddhism in China" },
    { prompt: "Mansa Musa, ruler of Mali, became famous in 1324 for:",
      choices: ["His pilgrimage to Mecca and lavish gold distribution", "Defeating the Songhai", "Founding Timbuktu's first mosque", "Banning the gold-salt trade"],
      correctText: "His pilgrimage to Mecca and lavish gold distribution" },
    { prompt: "Timbuktu became renowned as a center of:",
      choices: ["Trans-Saharan trade and Islamic scholarship", "Naval shipbuilding", "Iron-age metallurgy alone", "Aztec religious worship"],
      correctText: "Trans-Saharan trade and Islamic scholarship" },
    { prompt: "The Aztec capital Tenochtitlan was built on:",
      choices: ["An island in Lake Texcoco with causeways and chinampas", "The Yucatan peninsula coast", "The Andean highlands", "A river island near the Gulf"],
      correctText: "An island in Lake Texcoco with causeways and chinampas" },
    { prompt: "The Inca Empire's road network connected the empire across:",
      choices: ["The Andes Mountains of South America", "The Mexican plateau", "The Amazon basin alone", "The Caribbean coast"],
      correctText: "The Andes Mountains of South America" },
    { prompt: "The Byzantine Empire continued the legacy of:",
      choices: ["Rome, centered on Constantinople", "Greece, centered on Athens", "Persia, centered on Susa", "Egypt, centered on Alexandria"],
      correctText: "Rome, centered on Constantinople" },
    { prompt: "Justinian's Code (6th century) was important because it:",
      choices: ["Codified Roman law for the Byzantine Empire and influenced later European law", "Founded canon law for the Catholic Church", "Created English common law", "Outlined Sharia for the caliphate"],
      correctText: "Codified Roman law for the Byzantine Empire and influenced later European law" },
    { prompt: "The Silk Road primarily linked:",
      choices: ["China with Central Asia, the Middle East, and Mediterranean Europe", "Egypt with sub-Saharan Africa", "Mesoamerica with the Andes", "Japan with Korea only"],
      correctText: "China with Central Asia, the Middle East, and Mediterranean Europe" },
    { prompt: "The Mongol Empire under Genghis Khan and his successors:",
      choices: ["Created the largest contiguous land empire in history", "Was confined to the Mongolian plateau", "Conquered most of sub-Saharan Africa", "Built a maritime empire across the Pacific"],
      correctText: "Created the largest contiguous land empire in history" },
    { prompt: "The Ottoman Empire seized Constantinople in:",
      choices: ["1453", "1066", "1492", "1517"],
      correctText: "1453" },
    { prompt: "The Mughal Empire's most enduring monument is the:",
      choices: ["Taj Mahal", "Forbidden City", "Hagia Sophia", "Colosseum"],
      correctText: "Taj Mahal" },
    { prompt: "The Industrial Revolution began in:",
      choices: ["Britain", "France", "Germany", "United States"],
      correctText: "Britain" },
    { prompt: "Steam-powered factories most directly transformed:",
      choices: ["Textile production and urban labor", "Plantation agriculture in the Americas", "Pacific whaling", "Sub-Saharan farming"],
      correctText: "Textile production and urban labor" },
    { prompt: "An empire is best defined as:",
      choices: ["A state that rules diverse peoples and territories under one central authority", "Any country with a king", "A democracy with colonies", "A trade alliance of city-states"],
      correctText: "A state that rules diverse peoples and territories under one central authority" },
    { prompt: "Which best describes a primary source?",
      choices: ["A first-hand record from the time period studied", "A textbook chapter", "A modern documentary", "An encyclopedia entry"],
      correctText: "A first-hand record from the time period studied" }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | dying
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var lastBonusLifeThreshold = 0;
  var lastBonusRoundThreshold = 0;
  var keyState = { left: false, right: false, plunger: false };
  var tiltKeyTimes = [];

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
    ball_hit:        function () { sfxTone(280, 0.03, { type: "square", volume: 0.06 }); },
    flipper:         function () { sfxTone(180, 0.05, { type: "triangle", volume: 0.10, endFreq: 360 }); },
    bumper:          function () {
      sfxTone(660, 0.06, { type: "square", volume: 0.14, endFreq: 880 });
      setTimeout(function () { sfxTone(990, 0.06, { type: "triangle", volume: 0.10 }); }, 30);
    },
    dt_hit:          function () { sfxTone(440, 0.05, { type: "square", volume: 0.12, endFreq: 660 }); },
    dt_complete:     function () {
      [659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 50);
      });
    },
    spinner:         function () { sfxTone(1800, 0.04, { type: "sawtooth", volume: 0.06 }); },
    saucer:          function () {
      [523, 659, 784, 988].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 80);
      });
    },
    multiball_start: function () {
      [220, 330, 440, 660, 880, 1320].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.20, { type: "sawtooth", volume: 0.18 }); }, i * 80);
      });
      sfxNoise(0.4, { volume: 0.14, cutoff: 800 });
    },
    jackpot:         function () {
      [1175, 1568, 2093, 1568, 2093, 2637].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.12, { type: "triangle", volume: 0.20 }); }, i * 60);
      });
    },
    bonus_trigger:   function () {
      [880, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    bonus_correct:   function () {
      [784, 1175, 1568, 1865, 2349].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.14, { type: "triangle", volume: 0.18 }); }, i * 60);
      });
    },
    bonus_wrong:     function () { sfxTone(330, 0.20, { type: "sawtooth", volume: 0.14, endFreq: 110 }); },
    ball_drain:      function () {
      sfxTone(440, 0.4, { type: "sawtooth", volume: 0.16, endFreq: 80 });
      sfxNoise(0.3, { volume: 0.12, cutoff: 600 });
    },
    plunger:         function () { sfxTone(140, 0.18, { type: "sawtooth", volume: 0.16, endFreq: 580 }); },
    tilt:            function () {
      sfxNoise(0.5, { volume: 0.20, cutoff: 800 });
      sfxTone(220, 0.4, { type: "sawtooth", volume: 0.14, endFreq: 80 });
    },
    gameOver:        function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    extraBall:       function () {
      [988, 1318, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("pinballCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudBalls = $("hudBalls");
    dom.hudMult = $("hudMult");
    dom.hudCombo = $("hudCombo");
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
    dom.tcPlunge = $("tcPlunge");
  }

  // -- Geometry helpers ------------------------------------------------------
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function distSq(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
  function len(x, y) { return Math.sqrt(x * x + y * y); }
  function reflect(vx, vy, nx, ny) {
    var dot = vx * nx + vy * ny;
    return { x: vx - 2 * dot * nx, y: vy - 2 * dot * ny };
  }

  // -- Table layout ---------------------------------------------------------
  // Coordinate system: (0,0) top-left of canvas.
  // Playfield region uses inner walls. Plunger is a vertical chute on the right.
  var TABLE = {
    leftWall: 30,
    rightWall: LOGICAL_W - 30,
    topWall: 60,
    bottomWall: LOGICAL_H - 30,
    plungerLane: LOGICAL_W - 70,        // x position of plunger chute centerline
    plungerLaneWidth: 36,                // chute width
    drainGap: { x1: 270, x2: 450 },      // gap between flippers at the bottom
    drainY: LOGICAL_H - 30,
    flipperPivotY: LOGICAL_H - 90,
    leftFlipperPivotX: 270,
    rightFlipperPivotX: 450
  };

  // 3 pop bumpers in top zone (form a triangle)
  function bumperLayout() {
    return [
      { x: LOGICAL_W * 0.30, y: 200, r: 26, lit: 0 },
      { x: LOGICAL_W * 0.50, y: 160, r: 26, lit: 0 },
      { x: LOGICAL_W * 0.70, y: 200, r: 26, lit: 0 }
    ];
  }

  // 5 drop targets mid-left in a vertical column (knocked down once)
  function dropTargetLayout() {
    var targets = [];
    var cx = 100;
    var startY = 360;
    var spacing = 38;
    for (var i = 0; i < 5; i++) {
      targets.push({
        x: cx,
        y: startY + i * spacing,
        w: 56,
        h: 14,
        down: false,
        respawnT: 0
      });
    }
    return targets;
  }

  // Spinner mid-right (rotates on hit; scores per rotation)
  function spinnerLayout() {
    return {
      x: LOGICAL_W - 130,
      y: 380,
      r: 24,
      angle: 0,
      angularVel: 0,
      rotationsCounted: 0
    };
  }

  // Saucer center (ball lands → ejects)
  function saucerLayout() {
    return {
      x: LOGICAL_W / 2,
      y: 480,
      r: 22,
      capturedBall: null,
      ejectT: 0,
      locks: 0
    };
  }

  // Slingshots — angled triangles between flippers and walls
  function slingshotLayout() {
    return [
      // left slingshot — triangle near left wall above flipper
      {
        side: "left",
        ax: TABLE.leftWall + 16,    ay: TABLE.flipperPivotY - 80,
        bx: TABLE.leftWall + 16,    by: TABLE.flipperPivotY - 14,
        cx: TABLE.leftFlipperPivotX - 50, cy: TABLE.flipperPivotY - 14,
        flashT: 0
      },
      // right slingshot
      {
        side: "right",
        ax: TABLE.rightWall - 16,   ay: TABLE.flipperPivotY - 80,
        bx: TABLE.rightWall - 16,   by: TABLE.flipperPivotY - 14,
        cx: TABLE.rightFlipperPivotX + 50, cy: TABLE.flipperPivotY - 14,
        flashT: 0
      }
    ];
  }

  // Top-arch curve (the lane that brings the ball back down from plunger chute):
  //   we render an arc at top, but collision uses the rect walls + a ceiling line.
  // To keep ball in playfield, the plunger chute is a narrow vertical lane on the
  // right side; once the ball leaves the chute (above topWall), it enters the play area.

  function makeBall(opts) {
    opts = opts || {};
    return {
      x: opts.x != null ? opts.x : (TABLE.plungerLane),
      y: opts.y != null ? opts.y : (TABLE.bottomWall - BALL_RADIUS - 4),
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      r: BALL_RADIUS,
      onPlunger: opts.onPlunger != null ? opts.onPlunger : true,
      inChute: opts.inChute != null ? opts.inChute : true,
      alive: true
    };
  }

  function makeFlipper(side) {
    return {
      side: side,
      pivotX: side === "left" ? TABLE.leftFlipperPivotX : TABLE.rightFlipperPivotX,
      pivotY: TABLE.flipperPivotY,
      length: FLIPPER_LENGTH,
      thick: FLIPPER_THICK,
      // angle: 0 points right; left flipper rests at +0.42 (down-right), active -0.55 (up-right)
      // right flipper is mirrored: rests at PI - 0.42 (down-left), active PI + 0.55 (up-left).
      angle: side === "left" ? FLIPPER_REST_ANGLE : Math.PI - FLIPPER_REST_ANGLE,
      restAngle: side === "left" ? FLIPPER_REST_ANGLE : Math.PI - FLIPPER_REST_ANGLE,
      activeAngle: side === "left" ? FLIPPER_ACTIVE_ANGLE : Math.PI - FLIPPER_ACTIVE_ANGLE,
      angularVel: 0,
      pressed: false
    };
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    state = {
      empire: opts.empire || 0,
      score: opts.score || 0,
      ballsLeft: opts.ballsLeft != null ? opts.ballsLeft : BALLS_INIT,
      mult: 1,
      multT: 0,
      combo: 0,
      comboT: 0,
      maxCombo: opts.maxCombo || 0,
      best: opts.best || readBest(),
      balls: [],
      flippers: { left: makeFlipper("left"), right: makeFlipper("right") },
      plunger: { charge: 0, charging: false, releaseAnim: 0 },
      bumpers: bumperLayout(),
      dropTargets: dropTargetLayout(),
      dropRowsCleared: opts.dropRowsCleared || 0,
      spinner: spinnerLayout(),
      saucer: saucerLayout(),
      slingshots: slingshotLayout(),
      multiball: false,
      multiballT: 0,
      jackpotPrimed: false,
      tilt: { warnings: 0, locked: false, lockT: 0, flashT: 0 },
      bgStars: opts.bgStars || generateStars(),
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      // stats
      bumperHits: opts.bumperHits || 0,
      dropTargetsKnocked: opts.dropTargetsKnocked || 0,
      saucerLocks: opts.saucerLocks || 0,
      jackpotsHit: opts.jackpotsHit || 0,
      bonusRoundsTriggered: opts.bonusRoundsTriggered || 0,
      bonusRoundsCorrect: opts.bonusRoundsCorrect || 0,
      multiballRounds: opts.multiballRounds || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      time: 0,
      endReason: ""
    };
    // First ball pre-loaded on the plunger
    state.balls.push(makeBall({ onPlunger: true, inChute: true }));
  }

  function generateStars() {
    var stars = [];
    for (var i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * LOGICAL_W,
        y: Math.random() * LOGICAL_H * 0.55,
        r: 0.5 + Math.random() * 1.5,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.0
      });
    }
    return stars;
  }

  // -- Plunger logic ---------------------------------------------------------
  function updatePlunger(dt) {
    var pl = state.plunger;
    if (pl.releaseAnim > 0) {
      pl.releaseAnim -= dt * 4;
      if (pl.releaseAnim < 0) pl.releaseAnim = 0;
    }
    // Find ball on plunger
    var ballOnPlunger = null;
    for (var i = 0; i < state.balls.length; i++) {
      if (state.balls[i].onPlunger) { ballOnPlunger = state.balls[i]; break; }
    }
    if (!ballOnPlunger) {
      pl.charging = false;
      pl.charge = 0;
      return;
    }
    // Hold ball on plunger seat
    ballOnPlunger.x = TABLE.plungerLane;
    ballOnPlunger.y = TABLE.bottomWall - BALL_RADIUS - 4 - pl.charge * 24;
    ballOnPlunger.vx = 0;
    ballOnPlunger.vy = 0;
    if (keyState.plunger || pl.charging) {
      pl.charging = true;
      pl.charge = Math.min(1.0, pl.charge + dt / PLUNGER_MAX_CHARGE);
    } else {
      // released — fire if was charged
      if (pl.charge > 0.05) {
        var v = PLUNGER_MIN_VEL + (PLUNGER_MAX_VEL - PLUNGER_MIN_VEL) * pl.charge;
        ballOnPlunger.vy = -v;
        ballOnPlunger.onPlunger = false;
        // ball stays inChute until it exits the top of the chute
        pl.charge = 0;
        pl.releaseAnim = 1;
        sfx.plunger();
      }
    }
  }

  // -- Flippers --------------------------------------------------------------
  function updateFlippers(dt) {
    ["left", "right"].forEach(function (k) {
      var f = state.flippers[k];
      var target = f.pressed ? f.activeAngle : f.restAngle;
      if (f.side === "left") {
        // angle decreases when active (rotates CCW upward-right)
        if (f.pressed) {
          f.angle = Math.max(target, f.angle - FLIPPER_FLIP_SPEED * dt);
          f.angularVel = -FLIPPER_FLIP_SPEED;
        } else {
          f.angle = Math.min(target, f.angle + FLIPPER_RETURN_SPEED * dt);
          f.angularVel = FLIPPER_RETURN_SPEED;
        }
      } else {
        // right flipper mirror — when pressed, angle increases past PI to PI+0.55
        if (f.pressed) {
          f.angle = Math.min(target, f.angle + FLIPPER_FLIP_SPEED * dt);
          f.angularVel = FLIPPER_FLIP_SPEED;
        } else {
          f.angle = Math.max(target, f.angle - FLIPPER_RETURN_SPEED * dt);
          f.angularVel = -FLIPPER_RETURN_SPEED;
        }
      }
    });
  }

  function flipperEndpoint(f) {
    return {
      x: f.pivotX + Math.cos(f.angle) * f.length,
      y: f.pivotY + Math.sin(f.angle) * f.length
    };
  }

  // Closest point on segment p0→p1 to point p
  function closestPointOnSegment(px, py, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0;
    var lenSq = dx * dx + dy * dy;
    var t = lenSq > 0 ? ((px - x0) * dx + (py - y0) * dy) / lenSq : 0;
    t = clamp(t, 0, 1);
    return { x: x0 + t * dx, y: y0 + t * dy, t: t };
  }

  function collideBallFlipper(ball, f) {
    var endP = flipperEndpoint(f);
    var cp = closestPointOnSegment(ball.x, ball.y, f.pivotX, f.pivotY, endP.x, endP.y);
    var dx = ball.x - cp.x;
    var dy = ball.y - cp.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var minDist = ball.r + f.thick / 2;
    if (d < minDist && d > 0.001) {
      var nx = dx / d, ny = dy / d;
      // separate
      var pen = minDist - d;
      ball.x += nx * pen;
      ball.y += ny * pen;
      // velocity reflection
      var rv = reflect(ball.vx, ball.vy, nx, ny);
      ball.vx = rv.x * 0.92;
      ball.vy = rv.y * 0.92;
      // add flipper kinetic energy when actively flipping
      if (f.pressed && Math.abs(f.angularVel) > 1) {
        // velocity at contact point due to rotation
        var rx = cp.x - f.pivotX;
        var ry = cp.y - f.pivotY;
        var rotVx = -f.angularVel * ry;
        var rotVy =  f.angularVel * rx;
        // boost ball away from flipper along normal proportional to rotational speed
        var kick = Math.min(1100, Math.abs(f.angularVel) * 20 + 300) * (cp.t * 0.6 + 0.4);
        ball.vx += nx * kick * 0.8 + rotVx * 0.4;
        ball.vy += ny * kick * 0.8 + rotVy * 0.4;
        sfx.flipper();
      } else {
        sfx.ball_hit();
      }
      // clamp
      var sp = len(ball.vx, ball.vy);
      if (sp > BALL_MAX_SPEED) {
        ball.vx = ball.vx / sp * BALL_MAX_SPEED;
        ball.vy = ball.vy / sp * BALL_MAX_SPEED;
      }
      return true;
    }
    return false;
  }

  // -- Walls / playfield bounds ---------------------------------------------
  // The plunger chute is a vertical column at right edge (x in [plungerLane - 18, plungerLane + 18])
  // up to topWall+30, beyond which the ball can pop into the main playfield via a one-way arch.
  function collideBallWalls(ball) {
    // Bottom drain — only if ball goes through the drain gap
    if (ball.y + ball.r >= TABLE.drainY) {
      // If x is in the drain gap → drain
      if (ball.x >= TABLE.drainGap.x1 && ball.x <= TABLE.drainGap.x2) {
        // drain
        ball.alive = false;
        return;
      } else {
        // bounce off bottom wall (between flippers/wall - shouldn't usually happen, safety)
        ball.y = TABLE.drainY - ball.r;
        ball.vy = -Math.abs(ball.vy) * WALL_BOUNCE;
        sfx.ball_hit();
      }
    }

    // Top wall
    if (ball.y - ball.r <= TABLE.topWall) {
      ball.y = TABLE.topWall + ball.r;
      ball.vy = Math.abs(ball.vy) * WALL_BOUNCE;
      sfx.ball_hit();
    }

    // Plunger chute is "active" while inChute=true and ball is below the top arch line
    var topArchY = TABLE.topWall + 24;
    if (ball.inChute) {
      // chute walls
      var chuteLeft = TABLE.plungerLane - TABLE.plungerLaneWidth / 2;
      var chuteRight = TABLE.plungerLane + TABLE.plungerLaneWidth / 2;
      if (ball.x - ball.r < chuteLeft) {
        ball.x = chuteLeft + ball.r;
        ball.vx = Math.abs(ball.vx) * WALL_BOUNCE;
      }
      if (ball.x + ball.r > chuteRight) {
        ball.x = chuteRight - ball.r;
        ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE;
      }
      // when ball travels above the arch and slows enough → pop into playfield (allow leftward exit)
      if (ball.y < topArchY) {
        // push it out leftward into playfield
        ball.inChute = false;
        ball.vx -= 60; // give a small leftward nudge
      }
      // Bottom of chute — solid
      if (ball.y + ball.r > TABLE.bottomWall) {
        ball.y = TABLE.bottomWall - ball.r;
        ball.vy = -Math.abs(ball.vy) * WALL_BOUNCE;
      }
    } else {
      // Outer walls of main playfield
      if (ball.x - ball.r < TABLE.leftWall) {
        ball.x = TABLE.leftWall + ball.r;
        ball.vx = Math.abs(ball.vx) * WALL_BOUNCE;
        sfx.ball_hit();
      }
      // The right wall in the main playfield is just to the LEFT of the plunger chute
      var chuteEdge = TABLE.plungerLane - TABLE.plungerLaneWidth / 2 - 4;
      if (ball.x + ball.r > chuteEdge) {
        // Below the arch line, it's a wall; above the arch it's open (but chute starts above)
        if (ball.y > topArchY + 30) {
          ball.x = chuteEdge - ball.r;
          ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE;
          sfx.ball_hit();
        } else {
          // above arch — the ball can pass back to the right (or it does so naturally)
        }
      }
      // Far right wall above arch acts as ceiling redirect
      if (ball.y < topArchY && ball.x + ball.r > TABLE.rightWall) {
        ball.x = TABLE.rightWall - ball.r;
        ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE;
      }
    }

    // Inverted V "lane guides" near the bottom that funnel toward flippers.
    // Left guide: from (leftWall, drainY-180) → (drainGap.x1 - 6, drainY-10)
    // Right guide: from (rightWall, drainY-180) → (drainGap.x2 + 6, drainY-10)
    collideBallLine(ball, TABLE.leftWall + 6, TABLE.drainY - 180, TABLE.drainGap.x1 - 6, TABLE.drainY - 10);
    collideBallLine(ball, TABLE.rightWall - 6 - (TABLE.plungerLaneWidth + 8), TABLE.drainY - 180, TABLE.drainGap.x2 + 6, TABLE.drainY - 10);
  }

  function collideBallLine(ball, x0, y0, x1, y1) {
    var cp = closestPointOnSegment(ball.x, ball.y, x0, y0, x1, y1);
    var dx = ball.x - cp.x;
    var dy = ball.y - cp.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var minDist = ball.r + 3;
    if (d < minDist && d > 0.001) {
      var nx = dx / d, ny = dy / d;
      ball.x += nx * (minDist - d);
      ball.y += ny * (minDist - d);
      var rv = reflect(ball.vx, ball.vy, nx, ny);
      ball.vx = rv.x * WALL_BOUNCE;
      ball.vy = rv.y * WALL_BOUNCE;
      sfx.ball_hit();
      return true;
    }
    return false;
  }

  // -- Bumpers ---------------------------------------------------------------
  function collideBallBumpers(ball) {
    for (var i = 0; i < state.bumpers.length; i++) {
      var b = state.bumpers[i];
      var dx = ball.x - b.x;
      var dy = ball.y - b.y;
      var minD = ball.r + b.r;
      if (dx * dx + dy * dy < minD * minD) {
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 0.001) { d = 0.001; dx = 1; dy = 0; }
        var nx = dx / d, ny = dy / d;
        // separate
        ball.x = b.x + nx * minD;
        ball.y = b.y + ny * minD;
        // strong outward kick
        var inSp = len(ball.vx, ball.vy);
        var outSp = Math.max(inSp * BUMPER_BOUNCE, 480);
        ball.vx = nx * outSp;
        ball.vy = ny * outSp;
        b.lit = 0.4; // light up briefly
        addScore(BUMPER_POINTS, "bumper");
        state.bumperHits++;
        bumpCombo();
        sfx.bumper();
        burstAt(b.x, b.y, "#f5c451", 8);
        addShake(2, 0.08);
      }
    }
  }

  // -- Drop targets ---------------------------------------------------------
  function collideBallDropTargets(ball) {
    for (var i = 0; i < state.dropTargets.length; i++) {
      var t = state.dropTargets[i];
      if (t.down) continue;
      // AABB vs circle
      var rx = clamp(ball.x, t.x - t.w / 2, t.x + t.w / 2);
      var ry = clamp(ball.y, t.y - t.h / 2, t.y + t.h / 2);
      var dx = ball.x - rx, dy = ball.y - ry;
      var d2 = dx * dx + dy * dy;
      if (d2 < ball.r * ball.r) {
        var d = Math.sqrt(d2);
        var nx, ny;
        if (d < 0.001) { nx = 0; ny = -1; } else { nx = dx / d; ny = dy / d; }
        ball.x += nx * (ball.r - d + 0.5);
        ball.y += ny * (ball.r - d + 0.5);
        var rv = reflect(ball.vx, ball.vy, nx, ny);
        ball.vx = rv.x * DROP_BOUNCE;
        ball.vy = rv.y * DROP_BOUNCE;
        knockDropTarget(t);
      }
    }
  }
  function knockDropTarget(t) {
    t.down = true;
    t.respawnT = 0;
    addScore(DROP_POINTS, "dropTarget");
    state.dropTargetsKnocked++;
    bumpCombo();
    sfx.dt_hit();
    burstAt(t.x, t.y, "#cf8a3d", 6);
    // Check row complete
    var allDown = state.dropTargets.every(function (q) { return q.down; });
    if (allDown) {
      onDropRowComplete();
    }
  }

  function onDropRowComplete() {
    addScore(DROP_ROW_BONUS, "dropTargetRow");
    state.dropRowsCleared++;
    sfx.dt_complete();
    addShake(4, 0.2);
    pushPopup("ROW COMPLETE +" + DROP_ROW_BONUS, LOGICAL_W / 2, 360, "is-bonus");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 18, palette: ["#f5c451", "#cf8a3d", "#5de0f0"] });
      }
    } catch (e) {}
    // Multiball lock progression — every drop row clears = 1 multiball lock
    state.saucer.locks = Math.min(MULTIBALL_LOCK_TARGET, state.saucer.locks + 1);
    if (state.saucer.locks >= MULTIBALL_LOCK_TARGET && !state.multiball) {
      triggerMultiball();
    }
    // Reset row after 1.6s
    setTimeout(function () {
      if (!state) return;
      for (var i = 0; i < state.dropTargets.length; i++) state.dropTargets[i].down = false;
    }, 1600);
  }

  // -- Spinner ---------------------------------------------------------------
  function collideBallSpinner(ball) {
    var sp = state.spinner;
    var dx = ball.x - sp.x;
    var dy = ball.y - sp.y;
    var minD = ball.r + sp.r * 0.6;
    if (dx * dx + dy * dy < minD * minD) {
      // Spin imparts angular vel, doesn't bounce hard — passes through with a small slowdown
      var ballSp = len(ball.vx, ball.vy);
      sp.angularVel += (ballSp / 200) * (Math.random() < 0.5 ? 1 : -1) + (ball.vx > 0 ? 6 : -6);
      sp.angularVel = clamp(sp.angularVel, -28, 28);
      ball.vx *= 0.92;
      ball.vy *= 0.92;
      sfx.spinner();
    }
  }
  function updateSpinner(dt) {
    var sp = state.spinner;
    var prevAngle = sp.angle;
    sp.angle += sp.angularVel * dt;
    sp.angularVel *= Math.pow(0.5, dt * 1.4); // friction
    if (Math.abs(sp.angularVel) < 0.05) sp.angularVel = 0;
    // Score one rotation at a time (every full 2*PI traversed)
    var twoPi = Math.PI * 2;
    var prevRot = Math.floor(prevAngle / twoPi);
    var currRot = Math.floor(sp.angle / twoPi);
    var diff = Math.abs(currRot - prevRot);
    if (diff > 0) {
      sp.rotationsCounted += diff;
      addScore(SPINNER_POINTS * diff, "spinner");
      if (sp.rotationsCounted % 5 === 0) bumpCombo();
    }
  }

  // -- Saucer ---------------------------------------------------------------
  function collideBallSaucer(ball) {
    var sa = state.saucer;
    if (sa.capturedBall) return; // already capturing another ball
    var dx = ball.x - sa.x;
    var dy = ball.y - sa.y;
    var minD = ball.r + sa.r;
    if (dx * dx + dy * dy < minD * minD) {
      // Ball is captured for ~1.0s, then ejected upward with random horizontal jitter
      sa.capturedBall = ball;
      sa.ejectT = 1.0;
      ball.vx = 0; ball.vy = 0;
      addScore(SAUCER_POINTS, "saucer");
      state.saucerLocks++;
      sa.locks = Math.min(MULTIBALL_LOCK_TARGET, sa.locks + 1);
      sfx.saucer();
      pushPopup("SAUCER +" + SAUCER_POINTS, sa.x, sa.y - 40, "is-bonus");
      bumpCombo();
      // Each saucer lock advances the empire/empire stage
      advanceEmpire();
      addShake(3, 0.18);
      // Multiball trigger
      if (sa.locks >= MULTIBALL_LOCK_TARGET && !state.multiball) {
        triggerMultiball();
      }
      // Jackpot in multiball
      if (state.multiball && state.jackpotPrimed) {
        addScore(JACKPOT_POINTS, "jackpot");
        state.jackpotsHit++;
        sfx.jackpot();
        pushPopup("JACKPOT +" + JACKPOT_POINTS, LOGICAL_W / 2, 220, "is-jackpot");
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 32, palette: ["#f0a030", "#f5c451", "#5de0f0"] });
          }
        } catch (e) {}
      }
    }
  }
  function updateSaucer(dt) {
    var sa = state.saucer;
    if (!sa.capturedBall) return;
    sa.ejectT -= dt;
    sa.capturedBall.x = sa.x;
    sa.capturedBall.y = sa.y;
    if (sa.ejectT <= 0) {
      // eject upward with a slight angle
      var ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      var spd = 720;
      sa.capturedBall.vx = Math.cos(ang) * spd;
      sa.capturedBall.vy = Math.sin(ang) * spd;
      sa.capturedBall = null;
    }
  }

  // -- Slingshots -----------------------------------------------------------
  function collideBallSlingshots(ball) {
    for (var i = 0; i < state.slingshots.length; i++) {
      var sl = state.slingshots[i];
      // The slingshot hypotenuse — line from (cx, cy) (inner corner) → (ax, ay) (top of vertical edge)
      // We check against the diagonal hypotenuse line as the active rebound surface.
      var hit = collideBallLineWithKick(ball, sl.cx, sl.cy, sl.ax, sl.ay, SLINGSHOT_BOUNCE);
      if (hit) {
        sl.flashT = 0.2;
        addScore(SLINGSHOT_POINTS, "slingshot");
        bumpCombo();
        burstAt((sl.cx + sl.ax) / 2, (sl.cy + sl.ay) / 2, "#f0a030", 5);
      }
    }
  }
  function collideBallLineWithKick(ball, x0, y0, x1, y1, bounceMul) {
    var cp = closestPointOnSegment(ball.x, ball.y, x0, y0, x1, y1);
    var dx = ball.x - cp.x;
    var dy = ball.y - cp.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var minDist = ball.r + 4;
    if (d < minDist && d > 0.001) {
      var nx = dx / d, ny = dy / d;
      ball.x += nx * (minDist - d);
      ball.y += ny * (minDist - d);
      var rv = reflect(ball.vx, ball.vy, nx, ny);
      ball.vx = rv.x * bounceMul;
      ball.vy = rv.y * bounceMul;
      // ensure minimum kick speed
      var sp = len(ball.vx, ball.vy);
      if (sp < 380) {
        ball.vx = nx * 380;
        ball.vy = ny * 380;
      }
      return true;
    }
    return false;
  }

  // -- Combo / multiplier ---------------------------------------------------
  function bumpCombo() {
    state.combo++;
    state.comboT = 3.5; // 3.5s sustain
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
    // Multiplier escalates every 5 combo
    if (state.combo > 0 && state.combo % 5 === 0) {
      state.mult = Math.min(8, state.mult + 1);
      state.multT = 8.0;
      pushPopup("MULT x" + state.mult, LOGICAL_W / 2, 240, "is-bonus");
    }
  }
  function updateCombo(dt) {
    if (state.comboT > 0) {
      state.comboT -= dt;
      if (state.comboT <= 0) {
        state.combo = 0;
        state.comboT = 0;
      }
    }
    if (state.multT > 0) {
      state.multT -= dt;
      if (state.multT <= 0) {
        state.multT = 0;
        state.mult = 1;
      }
    }
  }

  // -- Score / Empire / Bonus rounds ---------------------------------------
  function addScore(base, source) {
    var pts = Math.floor(base * state.mult);
    state.score += pts;
    var prevExtra = lastBonusLifeThreshold;
    var prevBonus = lastBonusRoundThreshold;
    var extraT = Math.floor(state.score / EXTRA_BALL_THRESHOLD) * EXTRA_BALL_THRESHOLD;
    if (extraT > prevExtra && extraT >= EXTRA_BALL_THRESHOLD) {
      lastBonusLifeThreshold = extraT;
      state.ballsLeft++;
      sfx.extraBall();
      pushPopup("EXTRA BALL", LOGICAL_W / 2, LOGICAL_H / 2 - 60, "is-bonus");
    }
    var bonusT = Math.floor(state.score / BONUS_ROUND_INTERVAL) * BONUS_ROUND_INTERVAL;
    if (bonusT > prevBonus && bonusT >= BONUS_ROUND_INTERVAL && phase === "playing") {
      lastBonusRoundThreshold = bonusT;
      // Defer slightly so we don't open mid-collision
      setTimeout(function () { if (phase === "playing") openBonusRound(); }, 600);
    }
    return pts;
  }

  function advanceEmpire() {
    state.empire = Math.min(EMPIRES.length - 1, state.empire + 1);
    var em = EMPIRES[state.empire];
    pushPopup(em.name.toUpperCase(), LOGICAL_W / 2, 320, "is-legend");
  }

  // -- Multiball -----------------------------------------------------------
  function triggerMultiball() {
    state.multiball = true;
    state.multiballT = MULTIBALL_DURATION;
    state.multiballRounds++;
    state.jackpotPrimed = true;
    // Add additional balls at the saucer position
    var sa = state.saucer;
    var existing = state.balls.length;
    var toAdd = Math.max(0, MULTIBALL_BALLS - existing);
    for (var i = 0; i < toAdd; i++) {
      var ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
      var spd = 700 + Math.random() * 200;
      state.balls.push(makeBall({
        x: sa.x + (Math.random() - 0.5) * 20,
        y: sa.y - 30,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        onPlunger: false,
        inChute: false
      }));
    }
    // Reset locks display
    state.saucer.locks = 0;
    sfx.multiball_start();
    pushPopup("MULTIBALL!", LOGICAL_W / 2, LOGICAL_H / 2 - 50, "is-tetris");
    pushPopup("Jackpot at SAUCER", LOGICAL_W / 2, LOGICAL_H / 2, "is-bonus");
    addShake(8, 0.5);
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#5de0f0", "#f5c451", "#a991ff"] });
      }
    } catch (e) {}
  }
  function updateMultiball(dt) {
    if (!state.multiball) return;
    state.multiballT -= dt;
    // End when only 1 ball remains
    var aliveCount = 0;
    for (var i = 0; i < state.balls.length; i++) if (state.balls[i].alive) aliveCount++;
    if (aliveCount <= 1 || state.multiballT <= 0) {
      state.multiball = false;
      state.jackpotPrimed = false;
      state.multiballT = 0;
    }
  }

  // -- Tilt -----------------------------------------------------------------
  // Detect spam of arrow keys / shake events: 6 inputs in 1.0s = warning, 10 = tilt
  function registerTiltInput() {
    var now = performance.now();
    tiltKeyTimes.push(now);
    while (tiltKeyTimes.length > 0 && now - tiltKeyTimes[0] > 1000) tiltKeyTimes.shift();
    if (state.tilt.locked) return;
    if (tiltKeyTimes.length >= 10) {
      onTilt();
    } else if (tiltKeyTimes.length >= 6) {
      onTiltWarning();
    }
  }
  function onTiltWarning() {
    if (state.tilt.flashT > 0) return;
    state.tilt.warnings++;
    state.tilt.flashT = 0.6;
    pushPopup("TILT WARNING", LOGICAL_W / 2, 280, "is-warn");
    sfx.tilt();
  }
  function onTilt() {
    state.tilt.locked = true;
    state.tilt.lockT = 2.5;
    sfx.tilt();
    addShake(10, 0.6);
    pushPopup("TILT!", LOGICAL_W / 2, LOGICAL_H / 2, "is-warn");
    // Lock flippers (set pressed=false), drain the active ball (oldest non-onPlunger)
    state.flippers.left.pressed = false;
    state.flippers.right.pressed = false;
    for (var i = 0; i < state.balls.length; i++) {
      if (!state.balls[i].onPlunger) {
        state.balls[i].alive = false;
        break;
      }
    }
  }
  function updateTilt(dt) {
    if (state.tilt.lockT > 0) {
      state.tilt.lockT -= dt;
      if (state.tilt.lockT <= 0) {
        state.tilt.locked = false;
        tiltKeyTimes.length = 0;
      }
    }
    if (state.tilt.flashT > 0) state.tilt.flashT -= dt;
  }

  // -- Ball update / collision driver ---------------------------------------
  function updateBalls(dt) {
    // multiple sub-steps for stability at high speeds
    var subSteps = 4;
    var sdt = dt / subSteps;
    for (var s = 0; s < subSteps; s++) {
      for (var i = 0; i < state.balls.length; i++) {
        var b = state.balls[i];
        if (!b.alive) continue;
        if (b.onPlunger) continue;
        if (state.saucer.capturedBall === b) continue;
        // Gravity
        b.vy += GRAVITY * sdt;
        // Integrate
        b.x += b.vx * sdt;
        b.y += b.vy * sdt;
        // Mild drag
        b.vx *= BALL_FRICTION;
        b.vy *= BALL_FRICTION;
        // Clamp speed
        var sp = len(b.vx, b.vy);
        if (sp > BALL_MAX_SPEED) {
          b.vx = b.vx / sp * BALL_MAX_SPEED;
          b.vy = b.vy / sp * BALL_MAX_SPEED;
        }
        // Collisions
        collideBallWalls(b);
        if (!b.alive) continue;
        collideBallBumpers(b);
        collideBallDropTargets(b);
        collideBallSpinner(b);
        collideBallSaucer(b);
        collideBallSlingshots(b);
        // Flippers (skip if tilt locked)
        if (!state.tilt.locked) {
          collideBallFlipper(b, state.flippers.left);
          collideBallFlipper(b, state.flippers.right);
        }
      }
    }
    // Ball-ball collisions (light pass; only when multiple)
    if (state.balls.length > 1) {
      for (var bi = 0; bi < state.balls.length; bi++) {
        for (var bj = bi + 1; bj < state.balls.length; bj++) {
          var b1 = state.balls[bi], b2 = state.balls[bj];
          if (!b1.alive || !b2.alive) continue;
          if (b1.onPlunger || b2.onPlunger) continue;
          var dx = b2.x - b1.x, dy = b2.y - b1.y;
          var minD = b1.r + b2.r;
          var d2 = dx * dx + dy * dy;
          if (d2 < minD * minD && d2 > 0.0001) {
            var d = Math.sqrt(d2);
            var nx = dx / d, ny = dy / d;
            var pen = (minD - d) / 2;
            b1.x -= nx * pen; b1.y -= ny * pen;
            b2.x += nx * pen; b2.y += ny * pen;
            // Equal-mass elastic: swap normal-component velocities
            var v1n = b1.vx * nx + b1.vy * ny;
            var v2n = b2.vx * nx + b2.vy * ny;
            b1.vx += (v2n - v1n) * nx;
            b1.vy += (v2n - v1n) * ny;
            b2.vx += (v1n - v2n) * nx;
            b2.vy += (v1n - v2n) * ny;
          }
        }
      }
    }
    // Cull drained balls
    for (var ci = state.balls.length - 1; ci >= 0; ci--) {
      if (!state.balls[ci].alive) {
        sfx.ball_drain();
        burstAt(state.balls[ci].x, state.balls[ci].y, "#d04848", 18);
        addShake(4, 0.2);
        state.balls.splice(ci, 1);
      }
    }
    // If no balls left, lose ball-in-play and either spawn next or game over
    if (state.balls.length === 0) {
      onBallLost();
    }
    // Drop target respawn (single targets that the player has knocked) —
    // we leave them down until full row clears (clearing handled in onDropRowComplete reset).
  }

  function onBallLost() {
    if (state.multiball) {
      // Multiball drained — but multiball ends when only 1 ball remains, so reaching 0
      // means multiball ended naturally; don't penalize.
      state.multiball = false;
      state.jackpotPrimed = false;
    }
    state.ballsLeft--;
    if (state.ballsLeft <= 0) {
      // Game over
      gameOver();
      return;
    }
    // Respawn ball on plunger
    state.balls.push(makeBall({ onPlunger: true, inChute: true }));
    // Reset combo
    state.combo = 0;
    state.comboT = 0;
    state.mult = 1;
    state.multT = 0;
  }

  // -- Bumper "lit" decay --------------------------------------------------
  function updateLitDecay(dt) {
    for (var i = 0; i < state.bumpers.length; i++) {
      if (state.bumpers[i].lit > 0) state.bumpers[i].lit -= dt * 1.4;
      if (state.bumpers[i].lit < 0) state.bumpers[i].lit = 0;
    }
    for (var j = 0; j < state.slingshots.length; j++) {
      if (state.slingshots[j].flashT > 0) state.slingshots[j].flashT -= dt * 2;
      if (state.slingshots[j].flashT < 0) state.slingshots[j].flashT = 0;
    }
  }

  // -- Particles + popups ---------------------------------------------------
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
    if (!dom.popupOverlay || !canvas) return;
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

  // -- Render ---------------------------------------------------------------
  function render() {
    var W = canvas.width, H = canvas.height;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(offsetX * dpr, offsetY * dpr);
    ctx.scale(scale * dpr, scale * dpr);
    ctx.translate(state.shake.x, state.shake.y);

    drawBackground();
    drawTableFrame();
    drawLanes();
    drawSlingshots();
    drawDropTargets();
    drawBumpers();
    drawSpinner();
    drawSaucer();
    drawFlippers();
    drawPlunger();
    drawBalls();
    drawParticles();

    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#04060f";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    // Empire-tinted glow band
    var em = EMPIRES[state.empire % EMPIRES.length];
    var glow = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, 60, LOGICAL_W / 2, LOGICAL_H / 2, 480);
    glow.addColorStop(0, hexA(em.theme, 0.10));
    glow.addColorStop(0.5, "rgba(20,40,80,0.10)");
    glow.addColorStop(1, "rgba(4,6,15,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Stars in upper region
    if (state.bgStars) {
      for (var i = 0; i < state.bgStars.length; i++) {
        var s = state.bgStars[i];
        var tw = reducedMotion ? 1 : (0.5 + 0.5 * Math.abs(Math.sin(state.time * s.twinkleSpeed + s.twinkle)));
        ctx.fillStyle = "rgba(255,255,255," + (0.18 * tw) + ")";
        ctx.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
      }
    }
  }
  function hexA(hex, a) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substr(0, 2), 16);
    var g = parseInt(h.substr(2, 2), 16);
    var b = parseInt(h.substr(4, 2), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  function drawTableFrame() {
    // Outer playfield rectangle (subtle)
    ctx.save();
    ctx.strokeStyle = "rgba(245,196,81,0.32)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(TABLE.leftWall, TABLE.topWall, TABLE.rightWall - TABLE.leftWall, TABLE.bottomWall - TABLE.topWall, 14) :
      ctx.rect(TABLE.leftWall, TABLE.topWall, TABLE.rightWall - TABLE.leftWall, TABLE.bottomWall - TABLE.topWall);
    ctx.stroke();
    // Top arch (decorative)
    ctx.strokeStyle = "rgba(208,216,238,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(LOGICAL_W / 2, TABLE.topWall + 60, 220, Math.PI, 0);
    ctx.stroke();
    // Plunger chute walls
    var chuteLeft = TABLE.plungerLane - TABLE.plungerLaneWidth / 2;
    var chuteRight = TABLE.plungerLane + TABLE.plungerLaneWidth / 2;
    ctx.strokeStyle = "rgba(208,216,238,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chuteLeft, TABLE.topWall + 40);
    ctx.lineTo(chuteLeft, TABLE.bottomWall - 4);
    ctx.moveTo(chuteRight, TABLE.topWall + 4);
    ctx.lineTo(chuteRight, TABLE.bottomWall - 4);
    ctx.stroke();
    // Empire title at top
    var em = EMPIRES[state.empire % EMPIRES.length];
    ctx.font = "italic 700 22px Fraunces, serif";
    ctx.fillStyle = em.theme;
    ctx.textAlign = "center";
    ctx.fillText(em.name.toUpperCase(), LOGICAL_W / 2, TABLE.topWall + 36);
    ctx.restore();
  }

  function drawLanes() {
    // Left + right inner lane guides toward flippers
    ctx.save();
    ctx.strokeStyle = "rgba(208,216,238,0.50)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(TABLE.leftWall + 6, TABLE.drainY - 180);
    ctx.lineTo(TABLE.drainGap.x1 - 6, TABLE.drainY - 10);
    ctx.stroke();
    ctx.beginPath();
    var rxStart = TABLE.rightWall - 6 - (TABLE.plungerLaneWidth + 8);
    ctx.moveTo(rxStart, TABLE.drainY - 180);
    ctx.lineTo(TABLE.drainGap.x2 + 6, TABLE.drainY - 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawSlingshots() {
    for (var i = 0; i < state.slingshots.length; i++) {
      var sl = state.slingshots[i];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sl.ax, sl.ay);
      ctx.lineTo(sl.bx, sl.by);
      ctx.lineTo(sl.cx, sl.cy);
      ctx.closePath();
      var fillBase = "rgba(207,138,61,0.55)";
      var flashFill = "rgba(255,200,100,0.85)";
      ctx.fillStyle = sl.flashT > 0 ? flashFill : fillBase;
      ctx.fill();
      ctx.strokeStyle = sl.flashT > 0 ? "#fff8c4" : "rgba(245,196,81,0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDropTargets() {
    ctx.save();
    for (var i = 0; i < state.dropTargets.length; i++) {
      var t = state.dropTargets[i];
      var x = t.x - t.w / 2;
      var y = t.y - t.h / 2;
      if (t.down) {
        ctx.fillStyle = "rgba(80,90,110,0.45)";
        ctx.fillRect(x, y, t.w, t.h * 0.4);
      } else {
        // standing target
        ctx.fillStyle = "#cf8a3d";
        ctx.fillRect(x, y, t.w, t.h);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x, y, t.w, 3);
        ctx.strokeStyle = "rgba(245,196,81,0.85)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, t.w, t.h);
        // letter
        ctx.fillStyle = "#1a1208";
        ctx.font = "800 11px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("EMPIRE".charAt(i) || "*", t.x, t.y + 1);
      }
    }
    ctx.restore();
  }

  function drawBumpers() {
    for (var i = 0; i < state.bumpers.length; i++) {
      var b = state.bumpers[i];
      ctx.save();
      // outer glow
      var g = ctx.createRadialGradient(b.x, b.y, b.r * 0.4, b.x, b.y, b.r * 1.6);
      g.addColorStop(0, b.lit > 0 ? "rgba(255,240,160," + (0.6 + 0.4 * b.lit) + ")" : "rgba(245,196,81,0.3)");
      g.addColorStop(1, "rgba(245,196,81,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 1.6, 0, Math.PI * 2);
      ctx.fill();
      // body
      ctx.fillStyle = b.lit > 0 ? "#fff8c4" : "#f5c451";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a96e3d";
      ctx.lineWidth = 3;
      ctx.stroke();
      // inner ring
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      // center cap
      ctx.fillStyle = "#a96e3d";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawSpinner() {
    var sp = state.spinner;
    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(sp.angle);
    // spinner blade
    ctx.fillStyle = "#5de0f0";
    ctx.fillRect(-sp.r, -3, sp.r * 2, 6);
    ctx.strokeStyle = "rgba(208,216,238,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-sp.r, -3, sp.r * 2, 6);
    ctx.restore();
    // base post
    ctx.save();
    ctx.fillStyle = "rgba(208,216,238,0.35)";
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
    ctx.fill();
    // glow ring
    ctx.strokeStyle = "rgba(93,224,240,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawSaucer() {
    var sa = state.saucer;
    ctx.save();
    // outer rim
    var g = ctx.createRadialGradient(sa.x, sa.y, 4, sa.x, sa.y, sa.r * 1.4);
    g.addColorStop(0, "rgba(169,145,255,0.7)");
    g.addColorStop(1, "rgba(169,145,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sa.x, sa.y, sa.r * 1.4, 0, Math.PI * 2);
    ctx.fill();
    // hole
    ctx.fillStyle = "#0a0e1a";
    ctx.beginPath();
    ctx.arc(sa.x, sa.y, sa.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a991ff";
    ctx.lineWidth = 3;
    ctx.stroke();
    // lock indicator dots above
    for (var k = 0; k < MULTIBALL_LOCK_TARGET; k++) {
      var dx = sa.x - 18 + k * 18;
      var dy = sa.y - sa.r - 12;
      ctx.fillStyle = (k < sa.locks) ? "#5de0f0" : "rgba(208,216,238,0.25)";
      ctx.beginPath();
      ctx.arc(dx, dy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFlippers() {
    ["left", "right"].forEach(function (k) {
      var f = state.flippers[k];
      var endP = flipperEndpoint(f);
      ctx.save();
      // shadow
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = f.thick + 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(f.pivotX + 1, f.pivotY + 2);
      ctx.lineTo(endP.x + 1, endP.y + 2);
      ctx.stroke();
      // flipper body — gradient
      var grad = ctx.createLinearGradient(f.pivotX, f.pivotY, endP.x, endP.y);
      grad.addColorStop(0, "#f0d068");
      grad.addColorStop(1, "#a96e3d");
      ctx.strokeStyle = grad;
      ctx.lineWidth = f.thick;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(f.pivotX, f.pivotY);
      ctx.lineTo(endP.x, endP.y);
      ctx.stroke();
      // inner highlight
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(f.pivotX, f.pivotY - 3);
      ctx.lineTo(endP.x * 0.7 + f.pivotX * 0.3, endP.y * 0.7 + f.pivotY * 0.3 - 2);
      ctx.stroke();
      // pivot
      ctx.fillStyle = "#cf8a3d";
      ctx.beginPath();
      ctx.arc(f.pivotX, f.pivotY, f.thick / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1208";
      ctx.beginPath();
      ctx.arc(f.pivotX, f.pivotY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPlunger() {
    var pl = state.plunger;
    var x = TABLE.plungerLane;
    var y0 = TABLE.bottomWall - 6;
    var y1 = TABLE.bottomWall - 6 - 50 - pl.charge * 24;
    ctx.save();
    // plunger spring
    ctx.strokeStyle = "rgba(208,216,238,0.5)";
    ctx.lineWidth = 2;
    var coils = 8;
    var cstep = (y0 - y1) / coils;
    ctx.beginPath();
    for (var i = 0; i < coils; i++) {
      var yA = y0 - i * cstep;
      var yB = y0 - (i + 0.5) * cstep;
      ctx.moveTo(x - 8, yA);
      ctx.lineTo(x + 8, yB);
      ctx.lineTo(x - 8, yA - cstep);
    }
    ctx.stroke();
    // plunger head
    ctx.fillStyle = pl.charging ? "#f5c451" : "#cf8a3d";
    ctx.fillRect(x - 12, y1 - 8, 24, 8);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 12, y1 - 8, 24, 8);
    ctx.restore();
  }

  function drawBalls() {
    for (var i = 0; i < state.balls.length; i++) {
      var b = state.balls[i];
      if (!b.alive) continue;
      ctx.save();
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.arc(b.x + 2, b.y + 2, b.r, 0, Math.PI * 2);
      ctx.fill();
      // body
      var g = ctx.createRadialGradient(b.x - b.r * 0.4, b.y - b.r * 0.4, 1, b.x, b.y, b.r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, "#d0d8ee");
      g.addColorStop(1, "#7a8298");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      // sheen
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.4, b.y - b.r * 0.4, b.r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var a = Math.max(0, p.life / p.totalLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  // -- HUD update -----------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudBalls) dom.hudBalls.textContent = String(state.ballsLeft);
    if (dom.hudMult) {
      dom.hudMult.textContent = "x" + state.mult;
      var mc = dom.hudMult.parentElement;
      if (mc) mc.classList.toggle("is-warning", state.mult >= 3);
    }
    if (dom.hudCombo) {
      dom.hudCombo.textContent = String(state.combo);
      var cc = dom.hudCombo.parentElement;
      if (cc) cc.classList.toggle("is-warning", state.combo >= 5);
    }
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      var em = EMPIRES[state.empire % EMPIRES.length];
      var label = em.name + (state.multiball ? " · MULTIBALL" : "");
      dom.goalName.textContent = label;
    }
    if (dom.goalMeta) {
      var dropDown = state.dropTargets.filter(function (t) { return t.down; }).length;
      var bits = [];
      bits.push("Drop targets " + dropDown + "/5");
      bits.push("Locks " + state.saucer.locks + "/" + MULTIBALL_LOCK_TARGET);
      if (state.multiball) bits.push("MB " + state.multiballT.toFixed(1) + "s");
      if (state.tilt.locked) bits.push("TILT");
      else if (state.tilt.warnings > 0) bits.push("Tilt warns: " + state.tilt.warnings);
      dom.goalMeta.textContent = bits.join(" · ");
    }
    // Multiball stat-cell flash
    if (dom.hudCombo && dom.hudCombo.parentElement) {
      dom.hudCombo.parentElement.classList.toggle("is-multiball", state.multiball);
    }
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Bonus round / scholar modal -----------------------------------------
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

  function openBonusRound() {
    if (phase !== "playing") return;
    activeQuestion = pickQuestion();
    state.bonusRoundsTriggered++;
    sfx.bonus_trigger();
    if (dom.questionMeta) dom.questionMeta.textContent = "Bonus Round · Optional · +" + BONUS_CORRECT_BONUS;
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
      dom.explanation.textContent = "Decoded! +" + BONUS_CORRECT_BONUS + " bonus and scholar shards.";
      dom.explanation.className = "explanation is-correct";
      state.bonusRoundsCorrect++;
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText + ". No penalty — back to the table.";
      dom.explanation.className = "explanation is-wrong";
    }
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }

  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += BONUS_CORRECT_BONUS;
      addShards(20, GAME_ID + "-scholar-correct");
      sfx.bonus_correct();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + BONUS_CORRECT_BONUS + " SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
    } else {
      sfx.bonus_wrong();
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

  // -- Game over -----------------------------------------------------------
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
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 1000));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = "Cabinet Dark";
    if (dom.endTitle) dom.endTitle.textContent = "Pinball Empire · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Empire reached</div><div class="end-cell-value">' + EMPIRES[state.empire % EMPIRES.length].name + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Bumper hits</div><div class="end-cell-value">' + formatNumber(state.bumperHits) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Drop targets</div><div class="end-cell-value">' + formatNumber(state.dropTargetsKnocked) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Saucer locks</div><div class="end-cell-value">' + state.saucerLocks + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Multiballs</div><div class="end-cell-value">' + state.multiballRounds + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Jackpots</div><div class="end-cell-value">' + state.jackpotsHit + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Bonus correct</div><div class="end-cell-value">' + state.bonusRoundsCorrect + '/' + state.bonusRoundsTriggered + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max combo</div><div class="end-cell-value">' + state.maxCombo + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    stopMusic();
  }

  // -- Screens -------------------------------------------------------------
  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
  }

  // -- Resize / scaling ----------------------------------------------------
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

  // -- Hub integration -----------------------------------------------------
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
          empire: EMPIRES[state.empire % EMPIRES.length].name,
          jackpots: state.jackpotsHit
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
          ballsLeft: state.ballsLeft,
          empire: state.empire,
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
          file: "games/pinball-empire/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("pinball-empire:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("pinball-empire:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music --------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("pinball-cabinet", { volume: 0.5 });
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

  // -- Input --------------------------------------------------------------
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
        if (k === "ArrowLeft" || k === "z" || k === "Z") {
          if (!state.tilt.locked) state.flippers.left.pressed = true;
          if (!e.repeat) registerTiltInput();
          e.preventDefault();
          return;
        }
        if (k === "ArrowRight" || k === "/" || k === "?") {
          if (!state.tilt.locked) state.flippers.right.pressed = true;
          if (!e.repeat) registerTiltInput();
          e.preventDefault();
          return;
        }
        if (k === " " || k === "ArrowDown" || k === "Down") {
          keyState.plunger = true;
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
      if (phase === "paused" && (k === "p" || k === "P")) {
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
      if (k === "ArrowLeft" || k === "z" || k === "Z") {
        state.flippers.left.pressed = false;
        e.preventDefault();
      }
      if (k === "ArrowRight" || k === "/" || k === "?") {
        state.flippers.right.pressed = false;
        e.preventDefault();
      }
      if (k === " " || k === "ArrowDown" || k === "Down") {
        keyState.plunger = false;
        e.preventDefault();
      }
    });
    bindTouch();
    bindTouchControls();
  }

  function bindTouch() {
    // Tap zones: left-half = left flipper, right-half = right flipper
    // Long press at right edge over plunger = plunger charge
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      var rect = canvas.getBoundingClientRect();
      for (var i = 0; i < e.touches.length; i++) {
        var t = e.touches[i];
        var lx = (t.clientX - rect.left - offsetX) / scale;
        // plunger zone: right ~80px wide near x = plungerLane
        if (lx >= TABLE.plungerLane - 50) {
          keyState.plunger = true;
        } else if (lx < LOGICAL_W / 2) {
          if (!state.tilt.locked) state.flippers.left.pressed = true;
          registerTiltInput();
        } else {
          if (!state.tilt.locked) state.flippers.right.pressed = true;
          registerTiltInput();
        }
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchend", function (e) {
      // when no touches remain, release everything
      if (e.touches.length === 0) {
        state.flippers.left.pressed = false;
        state.flippers.right.pressed = false;
        keyState.plunger = false;
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchcancel", function () {
      state.flippers.left.pressed = false;
      state.flippers.right.pressed = false;
      keyState.plunger = false;
    }, { passive: true });

    // Detect device shake-style tilt via devicemotion
    try {
      window.addEventListener("devicemotion", function (ev) {
        if (phase !== "playing") return;
        var a = ev.accelerationIncludingGravity || ev.acceleration;
        if (!a) return;
        var mag = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
        if (mag > 32) registerTiltInput();
      }, { passive: true });
    } catch (e) {}
  }

  function bindTouchControls() {
    function pressBtn(btn, dir) {
      if (!btn) return;
      var down = function (e) {
        if (e) e.preventDefault();
        if (phase !== "playing") return;
        if (dir === "left" && !state.tilt.locked) { state.flippers.left.pressed = true; registerTiltInput(); }
        if (dir === "right" && !state.tilt.locked) { state.flippers.right.pressed = true; registerTiltInput(); }
        if (dir === "plunge") keyState.plunger = true;
      };
      var up = function (e) {
        if (e) e.preventDefault();
        if (dir === "left") state.flippers.left.pressed = false;
        if (dir === "right") state.flippers.right.pressed = false;
        if (dir === "plunge") keyState.plunger = false;
      };
      btn.addEventListener("mousedown", down);
      btn.addEventListener("mouseup", up);
      btn.addEventListener("mouseleave", up);
      btn.addEventListener("touchstart", down, { passive: false });
      btn.addEventListener("touchend", up, { passive: false });
      btn.addEventListener("touchcancel", up, { passive: false });
    }
    pressBtn(dom.tcLeft, "left");
    pressBtn(dom.tcRight, "right");
    pressBtn(dom.tcPlunge, "plunge");
  }

  // -- Pause --------------------------------------------------------------
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

  // -- UI bindings --------------------------------------------------------
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

  function newRun() {
    lastBonusLifeThreshold = 0;
    lastBonusRoundThreshold = 0;
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    lastBonusLifeThreshold = Math.floor((s.score || 0) / EXTRA_BALL_THRESHOLD) * EXTRA_BALL_THRESHOLD;
    lastBonusRoundThreshold = Math.floor((s.score || 0) / BONUS_ROUND_INTERVAL) * BONUS_ROUND_INTERVAL;
    initState({
      score: s.score || 0,
      ballsLeft: s.ballsLeft || BALLS_INIT,
      empire: s.empire || 0,
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
    if (snap && snap.state && (snap.state.score || snap.state.ballsLeft) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Balls ' + (snap.state.ballsLeft || 0) +
        ' &middot; Empire ' + EMPIRES[(snap.state.empire || 0) % EMPIRES.length].name + '</div>' +
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
    }
    // Leaderboard
    if (dom.leaderboardPanel) {
      try {
        var top = (window.MrMacsLeaderboards && window.MrMacsLeaderboards.top)
          ? window.MrMacsLeaderboards.top(GAME_ID, 5) : null;
        if (top && top.length) {
          var html = '<div class="leaderboard-title">Top scores</div>';
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

  // -- Main loop ----------------------------------------------------------
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
      updateFlippers(dt);
      updatePlunger(dt);
      updateBalls(dt);
      updateSaucer(dt);
      updateSpinner(dt);
      updateMultiball(dt);
      updateCombo(dt);
      updateLitDecay(dt);
      updateTilt(dt);
    }
    if (state) {
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "paused" || phase === "dying") {
      updateHud();
    }
    rafHandle = requestAnimationFrame(loop);
  }

  // -- Boot ---------------------------------------------------------------
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
