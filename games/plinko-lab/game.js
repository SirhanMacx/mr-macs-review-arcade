/* ===========================================================================
   Plinko Lab — Plinko / Pachinko ball drop · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x800 logical · ~80 pegs · 9 slots · scholar slots
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "plinko-lab";
  var GAME_TITLE = "Plinko Lab";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 800;

  // Playfield bounds (inset to leave room for HUD, ribbons, side rails)
  var FIELD_LEFT = 40;
  var FIELD_RIGHT = LOGICAL_W - 40;
  var FIELD_TOP = 130;
  var FIELD_BOTTOM = LOGICAL_H - 100;
  var FIELD_W = FIELD_RIGHT - FIELD_LEFT;
  var FIELD_H = FIELD_BOTTOM - FIELD_TOP;

  // Drop zone (top, above the peg field) and aimer indicator
  var DROP_ZONE_Y = FIELD_TOP - 28;
  var AIMER_W = 56;
  var AIMER_H = 22;

  // Pegs — Pachinko-style offset rows, ~80 total
  // 12 rows x ~8 pegs (alternating offset) → ~96; we'll trim to fit.
  var PEG_ROWS = 12;
  var PEG_COLS_BASE = 7;
  var PEG_COLS_OFFSET = 8;
  var PEG_RADIUS = 5.5;

  // Slots — 9 slots across the bottom; payouts are symmetric, jackpot in middle
  var SLOT_COUNT = 9;
  var SLOT_PAYOUTS = [100, 200, 500, 1000, 5000, 1000, 500, 200, 100];
  var JACKPOT_INDEX = 4; // center
  var SLOT_HEIGHT = 70;
  var SLOT_TOP_Y = FIELD_BOTTOM - SLOT_HEIGHT;

  // Ball physics
  var GRAVITY = 600;                      // px/s² downward
  var RESTITUTION_PEG = 0.42;             // bouncy on peg hit
  var RESTITUTION_WALL = 0.55;
  var FRICTION_AIR = 0.998;               // tiny drag per second
  var COLLISION_RANDOM = 0.32;            // tangential randomization on peg hit
  var BALL_RADIUS = 7;
  var BALL_INITIAL_SPEED = 30;            // small initial downward
  var BOUNCY_RESTITUTION_PEG = 0.62;      // power-up boost
  var MAX_BALL_SPEED = 720;               // safety cap

  // Round / lives
  var BALLS_PER_ROUND = 12;
  var LIVES_INIT = 3;                     // 3 underperforming rounds = game over
  var ROUND_FAIL_THRESHOLD = 1500;        // round payoff < this = "underperform"

  // Power-ups
  var POWERUP_TYPES = ["autoAim", "multiplier", "magnet", "megaDrop", "bouncyPegs"];
  var POWERUP_META = {
    autoAim:    { glyph: "🎯", color: "#ffd2e0", glow: "#f07bb8", label: "AUTO-AIM" },
    multiplier: { glyph: "🪙", color: "#fff8c4", glow: "#f0a800", label: "2x MULT" },
    magnet:     { glyph: "🧲", color: "#a8e8ff", glow: "#5de0f0", label: "MAGNET" },
    megaDrop:   { glyph: "💥", color: "#ffaaaa", glow: "#f04860", label: "MEGA DROP" },
    bouncyPegs: { glyph: "⚡", color: "#fff0a0", glow: "#f5c451", label: "BOUNCY PEGS" }
  };
  var SHARDS_CAP = 200;

  // Scholar
  var SCHOLAR_BONUS_SCORE = 1500;
  var SCHOLAR_BONUS_SHARDS = 12;
  var SCHOLAR_PROBABILITY = 0.5;          // 50% per round, 1 or 2 slots flagged

  // Aim
  var AIM_SPEED = 360;                    // px/s when held arrow keys

  // -- Inline review bank (28 entries, grade 8 → AP) ------------------------
  var INLINE_BANK = [
    // Grade 8 (NYS Civics / US History to 1900)
    { prompt: "The Declaration of Independence (1776) was primarily authored by:", choices: ["Thomas Jefferson", "John Adams", "Benjamin Franklin", "George Washington"], correctText: "Thomas Jefferson" },
    { prompt: "The 'three-fifths compromise' in the U.S. Constitution dealt with:", choices: ["Counting enslaved persons for representation", "Ratifying treaties", "Dividing powers between branches", "Electing the president"], correctText: "Counting enslaved persons for representation" },
    { prompt: "The Bill of Rights consists of the first how many constitutional amendments?", choices: ["10", "5", "12", "27"], correctText: "10" },
    { prompt: "Manifest Destiny in the 1840s was the belief that:", choices: ["The U.S. was destined to expand across North America", "Slavery would inevitably end", "Industry would replace farming", "All states should be equal"], correctText: "The U.S. was destined to expand across North America" },
    // Grade 9 (Global I — antiquity to 1750)
    { prompt: "The earliest known code of laws was issued by:", choices: ["Hammurabi of Babylon", "Justinian of Byzantium", "Solon of Athens", "Augustus of Rome"], correctText: "Hammurabi of Babylon" },
    { prompt: "Confucianism is best described as a system of:", choices: ["Ethics emphasizing social harmony and filial piety", "Polytheistic worship", "Centralized military rule", "Caste-based reincarnation"], correctText: "Ethics emphasizing social harmony and filial piety" },
    { prompt: "The Silk Road primarily connected:", choices: ["China and the Mediterranean world", "West Africa and Europe", "The Americas and Asia", "Australia and India"], correctText: "China and the Mediterranean world" },
    { prompt: "The Black Death (1347-51) killed roughly what fraction of Europe's population?", choices: ["One-third", "One-tenth", "Three-quarters", "One-half"], correctText: "One-third" },
    // Grade 10 (Global II — 1750 to present)
    { prompt: "The French Revolution (1789) was triggered most directly by:", choices: ["Financial crisis and the meeting of the Estates-General", "Napoleon's coronation", "The execution of King Louis XVI", "The Reign of Terror"], correctText: "Financial crisis and the meeting of the Estates-General" },
    { prompt: "The Berlin Conference (1884-85) formalized:", choices: ["European partition of Africa", "The end of slavery", "The unification of Germany", "An alliance against Russia"], correctText: "European partition of Africa" },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "The Treaty of Versailles", "The Russian Revolution", "German reunification"], correctText: "Assassination of Archduke Franz Ferdinand" },
    { prompt: "The Marshall Plan (1948) provided:", choices: ["Economic aid to rebuild Western Europe", "Military aid to South Korea", "Nuclear technology to NATO allies", "Loans to Latin America"], correctText: "Economic aid to rebuild Western Europe" },
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations", "NATO", "The League of Nations", "The European Union"], correctText: "The United Nations" },
    // Grade 11 (US History)
    { prompt: "The Emancipation Proclamation (1863) freed enslaved people:", choices: ["In Confederate states still in rebellion", "Throughout the entire United States", "Only in border states", "Only in Washington, D.C."], correctText: "In Confederate states still in rebellion" },
    { prompt: "The 19th Amendment (1920):", choices: ["Granted women the right to vote", "Repealed Prohibition", "Lowered the voting age", "Established direct election of senators"], correctText: "Granted women the right to vote" },
    { prompt: "The New Deal (1930s) was a response to:", choices: ["The Great Depression", "World War I", "The Dust Bowl alone", "The Cold War"], correctText: "The Great Depression" },
    { prompt: "Brown v. Board of Education (1954) ruled:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional" },
    { prompt: "The Civil Rights Act of 1964:", choices: ["Banned discrimination in public accommodations", "Created the EPA", "Established Medicare", "Ended the Vietnam War"], correctText: "Banned discrimination in public accommodations" },
    // Grade 12 / Government / Economics
    { prompt: "Judicial review — the power to strike down laws — was established by:", choices: ["Marbury v. Madison (1803)", "McCulloch v. Maryland (1819)", "Gibbons v. Ogden (1824)", "Dred Scott v. Sandford (1857)"], correctText: "Marbury v. Madison (1803)" },
    { prompt: "An increase in supply, holding demand constant, will:", choices: ["Lower equilibrium price", "Raise equilibrium price", "Leave price unchanged", "Eliminate the market"], correctText: "Lower equilibrium price" },
    // AP World
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, and diseases between hemispheres after 1492", "A 1492 trade treaty", "Slave-trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, and diseases between hemispheres after 1492" },
    { prompt: "The 'Pax Mongolica' refers to:", choices: ["Stability across Eurasia under the Mongol Empire enabling trade", "A treaty ending the Hundred Years' War", "Roman peace under Augustus", "Ottoman tolerance of religious minorities"], correctText: "Stability across Eurasia under the Mongol Empire enabling trade" },
    // AP Euro
    { prompt: "The Treaty of Westphalia (1648) is significant because it:", choices: ["Established the principle of state sovereignty", "Ended the Napoleonic Wars", "Created the European Union", "Granted Catholic emancipation"], correctText: "Established the principle of state sovereignty" },
    { prompt: "The Enlightenment's emphasis on reason most directly influenced:", choices: ["The American and French Revolutions", "The Protestant Reformation", "The Counter-Reformation", "The Industrial Revolution"], correctText: "The American and French Revolutions" },
    // AP US Gov
    { prompt: "The Federalist Papers were written primarily to:", choices: ["Persuade New York to ratify the Constitution", "Declare independence from Britain", "Establish the Bill of Rights", "Create the Supreme Court"], correctText: "Persuade New York to ratify the Constitution" },
    { prompt: "Selective incorporation refers to:", choices: ["Applying Bill-of-Rights protections to states via the 14th Amendment", "Drafting members of the armed forces", "Choosing committee assignments in Congress", "Picking Supreme Court nominees"], correctText: "Applying Bill-of-Rights protections to states via the 14th Amendment" },
    // AP Psych
    { prompt: "Operant conditioning, as described by B.F. Skinner, primarily involves:", choices: ["Learning shaped by consequences (reinforcement and punishment)", "Pairing two stimuli over repeated trials", "Mental rehearsal of behaviors", "Inherited fixed action patterns"], correctText: "Learning shaped by consequences (reinforcement and punishment)" },
    // AP Macro
    { prompt: "If the Federal Reserve raises the discount rate, the most likely short-run effect is:", choices: ["A decrease in the money supply and higher interest rates", "An increase in the money supply", "Lower unemployment immediately", "A balanced federal budget"], correctText: "A decrease in the money supply and higher interest rates" }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | roundEnd
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var lastBonusLifeThreshold = 0;
  var BONUS_LIFE_THRESHOLD = 25000;

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
  // SFX helpers — peg hits get pitch-varied tinks; slot lands get tonal feedback
  var sfx = {
    pegHit: function (pitchT) {
      // pitchT in [0,1] — varies by ball y position (higher y → higher pitch)
      var f = 880 + (pitchT || 0) * 700;
      sfxTone(f, 0.045, { type: "triangle", volume: 0.06, endFreq: f * 0.7 });
    },
    drop: function () {
      sfxTone(440, 0.08, { type: "triangle", volume: 0.10, endFreq: 220 });
    },
    slotLand: function (slotIdx) {
      // map slot index to a tone — center = highest
      var idx = slotIdx || 0;
      var dist = Math.abs(idx - JACKPOT_INDEX);
      var freqs = [330, 392, 466, 523, 659]; // distance 0..4 → 0..4 mapped to higher = closer to jackpot
      var f = freqs[Math.max(0, Math.min(freqs.length - 1, JACKPOT_INDEX - dist))];
      // Closer to jackpot => higher freq → invert so center = high
      f = 330 + (4 - dist) * 80;
      sfxTone(f, 0.16, { type: "triangle", volume: 0.12, endFreq: f * 1.2 });
    },
    jackpot: function () {
      [523, 659, 784, 988, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 65);
      });
      sfxNoise(0.25, { volume: 0.10, cutoff: 2400 });
    },
    scholarLand: function () {
      [988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.15, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    scholarCorrect: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholarWrong: function () {
      sfxTone(330, 0.18, { type: "sawtooth", volume: 0.13, endFreq: 180 });
    },
    powerupPickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerupUse: function () {
      sfxTone(660, 0.10, { type: "square", volume: 0.10 });
      setTimeout(function () { sfxTone(990, 0.10, { type: "square", volume: 0.10 }); }, 60);
    },
    roundEnd: function () {
      [392, 523, 659, 784].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.20, { type: "triangle", volume: 0.16 }); }, i * 100);
      });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("plinkoCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudRound = $("hudRound");
    dom.hudBalls = $("hudBalls");
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
    dom.tcDrop = $("tcDrop");
  }

  // -- Peg field -------------------------------------------------------------
  function buildPegs() {
    var pegs = [];
    // Place pegs in PEG_ROWS rows. Alternate row offsets for Pachinko look.
    // Top of peg field starts a bit below FIELD_TOP, ends a bit above SLOT_TOP_Y
    var pegFieldTop = FIELD_TOP + 50;
    var pegFieldBottom = SLOT_TOP_Y - 30;
    var rowSpacing = (pegFieldBottom - pegFieldTop) / (PEG_ROWS - 1);
    for (var r = 0; r < PEG_ROWS; r++) {
      var isOffset = (r % 2 === 1);
      var cols = isOffset ? PEG_COLS_OFFSET : PEG_COLS_BASE;
      var colSpacing = FIELD_W / (cols + 1);
      var y = pegFieldTop + r * rowSpacing;
      for (var c = 0; c < cols; c++) {
        var x = FIELD_LEFT + colSpacing * (c + 1);
        pegs.push({
          x: x,
          y: y,
          r: PEG_RADIUS,
          hitT: 0,                  // glow timer after hit
          hue: r % 2 === 0 ? "cyan" : "magenta",
          row: r,
          col: c
        });
      }
    }
    return pegs;
  }

  // -- Slot dividers ---------------------------------------------------------
  function getSlotBounds(idx) {
    var slotW = FIELD_W / SLOT_COUNT;
    var x0 = FIELD_LEFT + idx * slotW;
    var x1 = x0 + slotW;
    return { x0: x0, x1: x1, cx: (x0 + x1) / 2, top: SLOT_TOP_Y, bottom: FIELD_BOTTOM, w: slotW };
  }

  // -- Ball ------------------------------------------------------------------
  function makeBall(x, opts) {
    opts = opts || {};
    return {
      x: x,
      y: DROP_ZONE_Y + 18,
      vx: (Math.random() - 0.5) * 12,           // tiny initial nudge
      vy: BALL_INITIAL_SPEED,
      r: BALL_RADIUS,
      alive: true,
      landed: false,
      slotIdx: -1,
      trail: [],
      hue: opts.hue || "cyan",
      bouncyT: opts.bouncyT || 0,
      magnetT: opts.magnetT || 0,
      autoAim: !!opts.autoAim,
      multiplier: opts.multiplier || 1,
      megaPartner: opts.megaPartner || false
    };
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var pegs = buildPegs();
    var scholarSlots = pickScholarSlots();
    state = {
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      round: opts.round || 1,
      ballsRemaining: BALLS_PER_ROUND,
      ballsThisRound: 0,
      roundScore: 0,
      pegs: pegs,
      balls: [],                            // active balls
      scholarSlots: scholarSlots,           // array of slot indices that are scholar
      scholarPulse: 0,                      // animated rotation
      activePowerups: {},                   // dict: { multiplierShots: number, ... }
      pendingPowerups: opts.pendingPowerups || [],  // power-ups available to use on next drop
      powerupQueueT: 0,                     // anim timer
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      bgStars: opts.bgStars || generateStars(),
      // aimer
      aimerX: LOGICAL_W / 2,
      aimerVel: 0,
      keyAimL: false,
      keyAimR: false,
      // stats
      ballsDropped: opts.ballsDropped || 0,
      jackpotsHit: opts.jackpotsHit || 0,
      jackpotStreak: 0,
      maxJackpotStreak: opts.maxJackpotStreak || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      best: opts.best || readBest(),
      time: 0,
      bestSlotIdx: opts.bestSlotIdx != null ? opts.bestSlotIdx : -1,
      bestSlotPayout: opts.bestSlotPayout || 0,
      slotHitCounts: opts.slotHitCounts || new Array(SLOT_COUNT).fill(0),
      underperformedRounds: opts.underperformedRounds || 0,
      endReason: ""
    };
  }

  function pickScholarSlots() {
    // Always pick 1 or 2 random slots; bias away from jackpot but allow it
    var pool = [];
    for (var i = 0; i < SLOT_COUNT; i++) pool.push(i);
    // shuffle
    for (var k = pool.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1));
      var t = pool[k]; pool[k] = pool[j]; pool[j] = t;
    }
    var n = Math.random() < SCHOLAR_PROBABILITY ? 2 : 1;
    return pool.slice(0, n);
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

  // -- Aim + drop ------------------------------------------------------------
  function clampAimer() {
    var minX = FIELD_LEFT + AIMER_W / 2 + 4;
    var maxX = FIELD_RIGHT - AIMER_W / 2 - 4;
    if (state.aimerX < minX) state.aimerX = minX;
    if (state.aimerX > maxX) state.aimerX = maxX;
  }

  function dropBall() {
    if (phase !== "playing") return;
    if (state.ballsRemaining <= 0) return;
    // Check if there's already a ball mid-flight — limit concurrent balls to 6
    var aliveCount = 0;
    for (var i = 0; i < state.balls.length; i++) if (state.balls[i].alive) aliveCount++;
    if (aliveCount >= 6) return;
    // Determine power-up flags from pending queue (consume first matching at drop time)
    var autoAim = false, magnetT = 0, bouncyT = 0;
    var multiplier = 1;
    var megaDrop = false;
    var multApplied = false;
    // Apply state-level multiplier (if remaining shots > 0)
    if (state.activePowerups.multiplierShots > 0) {
      multiplier = 2;
      multApplied = true;
    }
    // Consume one-shot pending power-ups in order
    if (state.pendingPowerups.length > 0) {
      // process all single-use ones first
      var consumed = [];
      for (var pi = 0; pi < state.pendingPowerups.length; pi++) {
        var p = state.pendingPowerups[pi];
        if (p === "autoAim" && !autoAim) { autoAim = true; consumed.push(pi); break; }
      }
      // also consume magnet, bouncy, megaDrop one at a time
      for (var pj = 0; pj < state.pendingPowerups.length; pj++) {
        if (consumed.indexOf(pj) !== -1) continue;
        var pp = state.pendingPowerups[pj];
        if (pp === "magnet" && magnetT === 0) { magnetT = 99; consumed.push(pj); break; }
      }
      for (var pk = 0; pk < state.pendingPowerups.length; pk++) {
        if (consumed.indexOf(pk) !== -1) continue;
        var ppk = state.pendingPowerups[pk];
        if (ppk === "bouncyPegs" && bouncyT === 0) { bouncyT = 99; consumed.push(pk); break; }
      }
      for (var pl = 0; pl < state.pendingPowerups.length; pl++) {
        if (consumed.indexOf(pl) !== -1) continue;
        var ppl = state.pendingPowerups[pl];
        if (ppl === "megaDrop" && !megaDrop) { megaDrop = true; consumed.push(pl); break; }
      }
      // remove consumed (sort desc to splice safely)
      consumed.sort(function (a, b) { return b - a; });
      for (var ci = 0; ci < consumed.length; ci++) {
        var which = state.pendingPowerups[consumed[ci]];
        sfx.powerupUse();
        pushPopup(POWERUP_META[which].label, LOGICAL_W / 2, FIELD_TOP - 4, "is-bonus");
        state.pendingPowerups.splice(consumed[ci], 1);
      }
    }
    // Decrement multiplier shots
    if (multApplied) {
      state.activePowerups.multiplierShots = Math.max(0, state.activePowerups.multiplierShots - 1);
    }
    // Spawn ball(s)
    var dropX = state.aimerX;
    if (autoAim) {
      // gravitates toward jackpot column — set initial aim there so physics still bounces
      var sb = getSlotBounds(JACKPOT_INDEX);
      dropX = sb.cx + (Math.random() - 0.5) * 12;
    }
    var ball = makeBall(dropX, { autoAim: autoAim, magnetT: magnetT, bouncyT: bouncyT, multiplier: multiplier, hue: autoAim ? "magenta" : "cyan" });
    state.balls.push(ball);
    state.ballsRemaining--;
    state.ballsThisRound++;
    state.ballsDropped++;
    sfx.drop();
    burstAt(dropX, DROP_ZONE_Y + 12, "#5de0f0", 8);
    if (megaDrop) {
      // 2 additional balls
      var b2 = makeBall(dropX - 24, { magnetT: magnetT, bouncyT: bouncyT, multiplier: multiplier, hue: "magenta", megaPartner: true });
      var b3 = makeBall(dropX + 24, { magnetT: magnetT, bouncyT: bouncyT, multiplier: multiplier, hue: "gold", megaPartner: true });
      state.balls.push(b2);
      state.balls.push(b3);
      // Mega drop counts as ONE drop for the round (but you get 3 balls, all scoring)
      pushPopup("MEGA DROP!", LOGICAL_W / 2, FIELD_TOP + 28, "is-tetris");
    }
  }

  // -- Physics ---------------------------------------------------------------
  function updateBalls(dt) {
    var anyAlive = false;
    for (var bi = state.balls.length - 1; bi >= 0; bi--) {
      var b = state.balls[bi];
      if (!b.alive) {
        // remove if landed for >0.4s (let particles linger)
        if (b.deadT == null) b.deadT = 0;
        b.deadT += dt;
        if (b.deadT > 0.4) state.balls.splice(bi, 1);
        continue;
      }
      anyAlive = true;
      // Trail capture
      if (!reducedMotion) {
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 14) b.trail.shift();
      }
      // Magnet pull toward jackpot column (gentle)
      if (b.magnetT > 0) {
        var sbJ = getSlotBounds(JACKPOT_INDEX);
        var pull = (sbJ.cx - b.x) * 0.6;        // weak horizontal force
        b.vx += pull * dt;
      }
      // Auto-aim subtle gravity toward jackpot in upper half
      if (b.autoAim && b.y < SLOT_TOP_Y - 80) {
        var sbA = getSlotBounds(JACKPOT_INDEX);
        var pullA = (sbA.cx - b.x) * 0.35;
        b.vx += pullA * dt;
      }
      // Apply gravity + air drag
      b.vy += GRAVITY * dt;
      b.vx *= Math.pow(FRICTION_AIR, dt * 60);
      // Cap speed
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (sp > MAX_BALL_SPEED) {
        b.vx = b.vx / sp * MAX_BALL_SPEED;
        b.vy = b.vy / sp * MAX_BALL_SPEED;
      }
      // Substep — 2 substeps to reduce tunneling at high speed
      var steps = sp > 320 ? 2 : 1;
      var stepDt = dt / steps;
      for (var s = 0; s < steps; s++) {
        b.x += b.vx * stepDt;
        b.y += b.vy * stepDt;
        // Walls (left/right of field) — only flip vx when moving INTO the wall
        // to prevent perpetual edge-clipping when a ball settles against a rail.
        if (b.x - b.r < FIELD_LEFT) {
          b.x = FIELD_LEFT + b.r;
          if (b.vx < 0) b.vx = -b.vx * RESTITUTION_WALL;
          burstAt(b.x, b.y, "#5de0f0", 3);
        } else if (b.x + b.r > FIELD_RIGHT) {
          b.x = FIELD_RIGHT - b.r;
          if (b.vx > 0) b.vx = -b.vx * RESTITUTION_WALL;
          burstAt(b.x, b.y, "#5de0f0", 3);
        }
        // Pegs — broad-phase: only check pegs whose y is near ball.y
        for (var pi = 0; pi < state.pegs.length; pi++) {
          var pg = state.pegs[pi];
          if (Math.abs(pg.y - b.y) > 30) continue;
          var dx = b.x - pg.x;
          var dy = b.y - pg.y;
          var rr = b.r + pg.r;
          var d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 0.0001) {
            var d = Math.sqrt(d2);
            var nx = dx / d;
            var ny = dy / d;
            // Push ball out of peg
            var penetration = rr - d;
            b.x += nx * penetration;
            b.y += ny * penetration;
            // Reflect velocity along normal
            var vDotN = b.vx * nx + b.vy * ny;
            if (vDotN < 0) {
              var rest = b.bouncyT > 0 ? BOUNCY_RESTITUTION_PEG : RESTITUTION_PEG;
              b.vx = b.vx - 2 * vDotN * nx;
              b.vy = b.vy - 2 * vDotN * ny;
              b.vx *= rest;
              b.vy *= rest;
              // Add tangential randomness for Plinko unpredictability
              var tx = -ny;
              var ty = nx;
              var rnd = (Math.random() - 0.5) * COLLISION_RANDOM * 200;
              b.vx += tx * rnd;
              b.vy += ty * rnd;
              // Peg glow + sfx
              pg.hitT = 0.45;
              var pitchT = Math.min(1, b.y / FIELD_BOTTOM);
              sfx.pegHit(pitchT);
              if (!reducedMotion) {
                burstAt(pg.x, pg.y, pg.hue === "cyan" ? "#5de0f0" : "#f04bd0", 3);
              }
            }
          }
        }
        // Check slot landing — only when y > SLOT_TOP_Y + ~12
        if (b.y > SLOT_TOP_Y + 14 && !b.landed) {
          // Determine which slot by x
          var slotW = FIELD_W / SLOT_COUNT;
          var idx = Math.floor((b.x - FIELD_LEFT) / slotW);
          if (idx < 0) idx = 0;
          if (idx >= SLOT_COUNT) idx = SLOT_COUNT - 1;
          // Check slot dividers — bounce off vertical posts between slots
          var sbHere = getSlotBounds(idx);
          // Test left divider
          var leftPostX = sbHere.x0;
          var rightPostX = sbHere.x1;
          // Within slot, divider posts at top of slot region
          if (b.y < SLOT_TOP_Y + 22) {
            // Bounce off near divider edges if close
            var distLeft = Math.abs(b.x - leftPostX);
            var distRight = Math.abs(b.x - rightPostX);
            if (idx > 0 && distLeft < b.r) {
              b.x = leftPostX + b.r;
              b.vx = Math.abs(b.vx) * 0.5 + 8;
              if (b.vx < 0) b.vx = -b.vx * 0.5;
            } else if (idx < SLOT_COUNT - 1 && distRight < b.r) {
              b.x = rightPostX - b.r;
              b.vx = -Math.abs(b.vx) * 0.5 - 8;
            } else {
              // committed to this slot
              landBallInSlot(b, idx);
              break;
            }
          } else {
            // Definitely within slot region
            landBallInSlot(b, idx);
            break;
          }
        }
        // Safety: if ball goes off the bottom, count as last slot
        if (b.y > FIELD_BOTTOM + 30 && !b.landed) {
          var slotW2 = FIELD_W / SLOT_COUNT;
          var idx2 = Math.floor((b.x - FIELD_LEFT) / slotW2);
          if (idx2 < 0) idx2 = 0;
          if (idx2 >= SLOT_COUNT) idx2 = SLOT_COUNT - 1;
          landBallInSlot(b, idx2);
          break;
        }
      }
      // Decrement timed flags
      if (b.bouncyT > 0) b.bouncyT -= dt;
      if (b.magnetT > 0) b.magnetT -= dt;
    }
    // Auto-end round if all balls done and no balls remaining and we're playing
    if (phase === "playing" && state.ballsRemaining <= 0 && !anyAlive && !state._roundEnding) {
      state._roundEnding = true;
      setTimeout(function () {
        // Guard: skip if user has exited / restarted in the meantime.
        if (phase !== "playing") return;
        onRoundEnd();
      }, 500);
    }
  }

  function landBallInSlot(ball, idx) {
    if (ball.landed) return;
    ball.landed = true;
    ball.alive = false;
    ball.slotIdx = idx;
    var payout = SLOT_PAYOUTS[idx];
    var isJackpot = (idx === JACKPOT_INDEX);
    var isScholar = state.scholarSlots.indexOf(idx) !== -1;
    state.slotHitCounts[idx]++;
    if (payout > state.bestSlotPayout) {
      state.bestSlotPayout = payout;
      state.bestSlotIdx = idx;
    }
    var earned = payout * (ball.multiplier || 1);
    state.score += earned;
    state.roundScore += earned;
    sfx.slotLand(idx);
    var slotBounds = getSlotBounds(idx);
    pushPopup("+" + earned, slotBounds.cx, SLOT_TOP_Y - 10, "is-score");
    burstAt(ball.x, ball.y, isJackpot ? "#f5c451" : (isScholar ? "#a991ff" : "#5de0f0"), isJackpot ? 24 : 12);
    if (isJackpot) {
      sfx.jackpot();
      addShake(8, 0.5);
      state.jackpotsHit++;
      state.jackpotStreak++;
      if (state.jackpotStreak > state.maxJackpotStreak) state.maxJackpotStreak = state.jackpotStreak;
      pushPopup("JACKPOT!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
      pushPopup("+" + earned, LOGICAL_W / 2, LOGICAL_H / 2 + 20, "is-score");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#f04bd0", "#a991ff"] });
        }
      } catch (e) {}
      // Drop a power-up on jackpot
      maybeDropPowerup({ guaranteed: true });
    } else {
      // Reset jackpot streak on any non-jackpot
      state.jackpotStreak = 0;
      // 5% bonus chance for power-up on perfect aim (close to jackpot column)
      var sbJ = getSlotBounds(JACKPOT_INDEX);
      var dx = Math.abs(ball.x - sbJ.cx);
      var perfectAim = dx < 30 && idx !== JACKPOT_INDEX; // drop landed near center but not jackpot
      if (perfectAim && Math.random() < 0.20) {
        maybeDropPowerup({ guaranteed: true });
      }
    }
    if (isScholar) {
      // Trigger scholar prompt — only for the first ball that lands here this round
      if (!state._scholarPromptedThisRound) {
        state._scholarPromptedThisRound = true;
        sfx.scholarLand();
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 22, palette: ["#a991ff", "#5de0f0", "#f5c451"] });
          }
        } catch (e) {}
        // Slight delay so the slot land can render first.
        // Guard: skip if game has ended/exited or already in another modal.
        setTimeout(function () {
          if (phase === "ended" || phase === "setup" || phase === "question") return;
          openScholarQuestion(idx);
        }, 250);
      }
    }
    checkBonusLife();
  }

  // -- Power-ups -------------------------------------------------------------
  function maybeDropPowerup(opts) {
    opts = opts || {};
    if (!opts.guaranteed && Math.random() > 0.05) return;
    var type;
    if (opts.type) type = opts.type;
    else type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    sfx.powerupPickup();
    if (type === "multiplier") {
      // 2x slot multiplier for next 5 balls
      state.activePowerups.multiplierShots = (state.activePowerups.multiplierShots || 0) + 5;
      var meta = POWERUP_META[type];
      pushPopup(meta.label + " x5 BALLS", LOGICAL_W / 2, FIELD_TOP + 80, "is-bonus");
    } else {
      state.pendingPowerups.push(type);
      var metaB = POWERUP_META[type];
      pushPopup(metaB.label + " READY", LOGICAL_W / 2, FIELD_TOP + 80, "is-bonus");
    }
  }

  // -- Bonus life ------------------------------------------------------------
  function checkBonusLife() {
    var threshold = Math.floor(state.score / BONUS_LIFE_THRESHOLD) * BONUS_LIFE_THRESHOLD;
    if (threshold > lastBonusLifeThreshold && threshold >= BONUS_LIFE_THRESHOLD) {
      lastBonusLifeThreshold = threshold;
      state.lives++;
      pushPopup("+1 LIFE", LOGICAL_W / 2, LOGICAL_H / 2 - 80, "is-bonus");
      sfx.scholarCorrect();
    }
  }

  // -- Round end -------------------------------------------------------------
  function onRoundEnd() {
    if (phase !== "playing") return;
    if (state.roundScore < ROUND_FAIL_THRESHOLD) {
      state.underperformedRounds++;
      pushPopup("UNDERPERFORM", LOGICAL_W / 2, LOGICAL_H / 2 + 30, "is-warn");
    } else {
      pushPopup("ROUND CLEAR", LOGICAL_W / 2, LOGICAL_H / 2 + 30, "is-bonus");
    }
    // Update lives based on underperform
    if (state.underperformedRounds >= LIVES_INIT) {
      // Game over after this round
      gameOver();
      return;
    }
    sfx.roundEnd();
    pushPopup("Round " + state.round + " · " + state.roundScore + " pts", LOGICAL_W / 2, LOGICAL_H / 2 - 20, "is-score");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 24, palette: ["#5de0f0", "#f04bd0", "#f5c451"] });
      }
    } catch (e) {}
    phase = "roundEnd";
    saveSnapshot();
    setTimeout(function () {
      // Guard: skip if user exited or restarted during the round-end pause.
      if (phase !== "roundEnd") return;
      // Start next round, preserve power-ups and stats
      var carry = {
        score: state.score,
        lives: state.lives,
        round: state.round + 1,
        ballsDropped: state.ballsDropped,
        jackpotsHit: state.jackpotsHit,
        maxJackpotStreak: state.maxJackpotStreak,
        shardsAwarded: state.shardsAwarded,
        questionsAnsweredCorrect: state.questionsAnsweredCorrect,
        questionsAnsweredTotal: state.questionsAnsweredTotal,
        best: state.best,
        bgStars: state.bgStars,
        bestSlotIdx: state.bestSlotIdx,
        bestSlotPayout: state.bestSlotPayout,
        slotHitCounts: state.slotHitCounts,
        underperformedRounds: state.underperformedRounds,
        pendingPowerups: state.pendingPowerups
      };
      var prevActiveMult = state.activePowerups.multiplierShots || 0;
      initState(carry);
      state.activePowerups.multiplierShots = prevActiveMult;
      // Refresh lives display (lives = LIVES_INIT - underperformedRounds)
      state.lives = Math.max(0, LIVES_INIT - state.underperformedRounds);
      state.pendingPowerups = carry.pendingPowerups || [];
      phase = "playing";
      state._roundEnding = false;
      state._scholarPromptedThisRound = false;
    }, 1800);
  }

  // -- Particles + popups ----------------------------------------------------
  var PARTICLE_CAP = 600;
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    if (!state || !state.particles) return;
    count = count || 10;
    // Memory-leak guard: cap total particles in flight.
    var room = PARTICLE_CAP - state.particles.length;
    if (room <= 0) return;
    if (count > room) count = room;
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

  // -- Peg + Scholar pulse update -------------------------------------------
  function updateAmbient(dt) {
    for (var i = 0; i < state.pegs.length; i++) {
      if (state.pegs[i].hitT > 0) state.pegs[i].hitT -= dt;
    }
    state.scholarPulse += dt * 1.4;
    if (state.aimerVel !== 0) {
      state.aimerX += state.aimerVel * dt;
      clampAimer();
    }
    if (state.keyAimL) {
      state.aimerX -= AIM_SPEED * dt;
      clampAimer();
    }
    if (state.keyAimR) {
      state.aimerX += AIM_SPEED * dt;
      clampAimer();
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
    drawPlayfieldFrame();
    drawPegs();
    drawSlots();
    drawAimer();
    drawBalls();
    drawParticles();
    drawPowerupQueue();

    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#04060f";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    // Soft glow behind playfield
    var cx = LOGICAL_W / 2;
    var cy = (FIELD_TOP + FIELD_BOTTOM) / 2;
    var glow = ctx.createRadialGradient(cx, cy, 80, cx, cy, 480);
    glow.addColorStop(0, "rgba(93,224,240,0.10)");
    glow.addColorStop(0.5, "rgba(240,75,208,0.06)");
    glow.addColorStop(1, "rgba(4,6,15,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Stars
    if (state.bgStars) {
      for (var i = 0; i < state.bgStars.length; i++) {
        var s = state.bgStars[i];
        var tw = reducedMotion ? 1 : (0.5 + 0.5 * Math.abs(Math.sin(state.time * s.twinkleSpeed + s.twinkle)));
        ctx.fillStyle = "rgba(255,255,255," + (0.16 * tw) + ")";
        ctx.fillRect(s.x - s.r / 2, s.y - s.r / 2, s.r, s.r);
      }
    }
  }

  function drawPlayfieldFrame() {
    // Outer frame — rounded rect with cabinet finish
    ctx.save();
    var x = FIELD_LEFT - 12;
    var y = FIELD_TOP - 36;
    var w = FIELD_W + 24;
    var h = FIELD_H + 48;
    var r = 14;
    // Frame fill
    var fg = ctx.createLinearGradient(0, y, 0, y + h);
    fg.addColorStop(0, "rgba(20,28,48,0.85)");
    fg.addColorStop(0.5, "rgba(8,14,28,0.75)");
    fg.addColorStop(1, "rgba(4,8,18,0.92)");
    ctx.fillStyle = fg;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    // Frame border
    ctx.strokeStyle = "rgba(93,224,240,0.30)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
    // Drop zone strip across the top
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(FIELD_LEFT, FIELD_TOP - 36, FIELD_W, 28);
    ctx.strokeStyle = "rgba(93,224,240,0.20)";
    ctx.lineWidth = 1;
    ctx.strokeRect(FIELD_LEFT, FIELD_TOP - 36, FIELD_W, 28);
    // Drop zone label
    ctx.fillStyle = "rgba(93,224,240,0.7)";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("DROP ZONE", FIELD_LEFT + 8, FIELD_TOP - 22);
    // playfield separator above slots
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(FIELD_LEFT, SLOT_TOP_Y);
    ctx.lineTo(FIELD_RIGHT, SLOT_TOP_Y);
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
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

  function drawPegs() {
    for (var i = 0; i < state.pegs.length; i++) {
      var p = state.pegs[i];
      var hit = Math.max(0, Math.min(1, p.hitT / 0.45));
      // Glow halo on hit
      if (hit > 0 && !reducedMotion) {
        var rad = 18 * hit;
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        var col = p.hue === "cyan" ? "rgba(93,224,240,0.6)" : "rgba(240,75,208,0.6)";
        glow.addColorStop(0, col);
        var col2 = p.hue === "cyan" ? "rgba(93,224,240,0)" : "rgba(240,75,208,0)";
        glow.addColorStop(1, col2);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // Peg body — small disk with subtle gradient
      var pgrad = ctx.createRadialGradient(p.x - 2, p.y - 2, 0, p.x, p.y, p.r * 1.4);
      if (p.hue === "cyan") {
        pgrad.addColorStop(0, "#caf3fa");
        pgrad.addColorStop(0.6, "#5de0f0");
        pgrad.addColorStop(1, "#1e7088");
      } else {
        pgrad.addColorStop(0, "#fbcaee");
        pgrad.addColorStop(0.6, "#f04bd0");
        pgrad.addColorStop(1, "#7a1e74");
      }
      ctx.fillStyle = pgrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      // peg outline — slightly brighter on hit
      ctx.strokeStyle = hit > 0 ? "#ffffff" : "rgba(255,255,255,0.18)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      // tiny highlight
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(p.x - 1.2, p.y - 1.2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSlots() {
    var slotW = FIELD_W / SLOT_COUNT;
    for (var i = 0; i < SLOT_COUNT; i++) {
      var sb = getSlotBounds(i);
      var payout = SLOT_PAYOUTS[i];
      var isJackpot = (i === JACKPOT_INDEX);
      var isScholar = state.scholarSlots.indexOf(i) !== -1;
      // Slot body fill
      var sg = ctx.createLinearGradient(0, sb.top, 0, sb.bottom);
      if (isJackpot) {
        sg.addColorStop(0, "rgba(245,196,81,0.30)");
        sg.addColorStop(0.5, "rgba(200,146,42,0.40)");
        sg.addColorStop(1, "rgba(80,55,10,0.85)");
      } else if (isScholar) {
        sg.addColorStop(0, "rgba(169,145,255,0.28)");
        sg.addColorStop(1, "rgba(20,16,40,0.85)");
      } else {
        // distance-based tinting
        var dist = Math.abs(i - JACKPOT_INDEX);
        var alpha = (4 - dist) * 0.06 + 0.10;
        sg.addColorStop(0, "rgba(93,224,240," + alpha + ")");
        sg.addColorStop(1, "rgba(8,14,28,0.85)");
      }
      ctx.fillStyle = sg;
      ctx.fillRect(sb.x0 + 1, sb.top, slotW - 2, SLOT_HEIGHT);
      // Slot top edge
      ctx.fillStyle = isJackpot ? "#f5c451" : (isScholar ? "#a991ff" : "rgba(93,224,240,0.5)");
      ctx.fillRect(sb.x0 + 1, sb.top, slotW - 2, 2);
      // Vertical dividers (posts)
      if (i < SLOT_COUNT - 1) {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(sb.x1 - 1, sb.top - 4, 2, SLOT_HEIGHT + 8);
        // Post head — small circle peg above slot top
        ctx.fillStyle = "#5de0f0";
        if (!reducedMotion) {
          ctx.shadowColor = "#5de0f0";
          ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.arc(sb.x1, sb.top - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // Jackpot rim flourish
      if (isJackpot) {
        ctx.save();
        if (!reducedMotion) {
          ctx.shadowColor = "#f5c451";
          ctx.shadowBlur = 14;
        }
        ctx.strokeStyle = "#f5c451";
        ctx.lineWidth = 2.4;
        ctx.strokeRect(sb.x0 + 2, sb.top + 1, slotW - 4, SLOT_HEIGHT - 2);
        ctx.restore();
      }
      // Scholar rim
      if (isScholar) {
        ctx.save();
        if (!reducedMotion) {
          ctx.shadowColor = "#a991ff";
          ctx.shadowBlur = 12;
        }
        ctx.strokeStyle = "#a991ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(sb.x0 + 2, sb.top + 1, slotW - 4, SLOT_HEIGHT - 2);
        ctx.restore();
      }
      // Payout label
      ctx.fillStyle = isJackpot ? "#fff8c4" : (isScholar ? "#e7daff" : "#f0f5ff");
      ctx.font = isJackpot ? "bold 18px JetBrains Mono, monospace" : "bold 14px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(formatPayout(payout), sb.cx, sb.top + 24);
      // Sub-label
      if (isJackpot) {
        ctx.fillStyle = "#f5c451";
        ctx.font = "bold 9px JetBrains Mono, monospace";
        ctx.fillText("JACKPOT", sb.cx, sb.top + 44);
      } else if (isScholar) {
        // Rotating "?" mark
        ctx.save();
        ctx.translate(sb.cx, sb.top + 50);
        if (!reducedMotion) ctx.rotate(state.scholarPulse);
        var scholarColors = ["#f5c451", "#5de0f0", "#a991ff", "#f04bd0"];
        for (var qi = 0; qi < scholarColors.length; qi++) {
          ctx.strokeStyle = scholarColors[qi];
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(0, 0, 5, Math.PI * 0.85 + qi * 0.4, Math.PI * 2.0 + qi * 0.4);
          ctx.stroke();
        }
        ctx.fillStyle = "#f0f5ff";
        ctx.font = "bold 12px JetBrains Mono, monospace";
        ctx.fillText("?", 0, 1);
        ctx.restore();
      } else {
        // Hit count tally
        var hits = state.slotHitCounts[i];
        if (hits > 0) {
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.font = "9px JetBrains Mono, monospace";
          ctx.fillText("x" + hits, sb.cx, sb.top + 50);
        }
      }
    }
    // Outer slot wall edges (left/right)
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(FIELD_LEFT, SLOT_TOP_Y);
    ctx.lineTo(FIELD_LEFT, FIELD_BOTTOM);
    ctx.moveTo(FIELD_RIGHT, SLOT_TOP_Y);
    ctx.lineTo(FIELD_RIGHT, FIELD_BOTTOM);
    ctx.stroke();
  }

  function formatPayout(n) {
    if (n >= 1000) return (n / 1000) + "k";
    return String(n);
  }

  function drawAimer() {
    if (state.ballsRemaining <= 0) return;
    var x = state.aimerX;
    var y = DROP_ZONE_Y;
    ctx.save();
    // Aim line — vertical guide
    if (!reducedMotion) {
      ctx.strokeStyle = "rgba(93,224,240,0.18)";
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + AIMER_H);
      ctx.lineTo(x, FIELD_TOP + 40);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Aimer pill
    ctx.fillStyle = "rgba(8,14,28,0.85)";
    roundRect(ctx, x - AIMER_W / 2, y - AIMER_H / 2, AIMER_W, AIMER_H, 8);
    ctx.fill();
    ctx.strokeStyle = "#5de0f0";
    ctx.lineWidth = 1.5;
    if (!reducedMotion) {
      ctx.shadowColor = "#5de0f0";
      ctx.shadowBlur = 10;
    }
    roundRect(ctx, x - AIMER_W / 2, y - AIMER_H / 2, AIMER_W, AIMER_H, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Center reticle
    ctx.fillStyle = "#f5c451";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    // Tiny chevrons
    ctx.fillStyle = "#5de0f0";
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DROP", x, y + 0);
    ctx.restore();
  }

  function drawBalls() {
    for (var i = 0; i < state.balls.length; i++) {
      var b = state.balls[i];
      // Trail
      if (!reducedMotion && b.trail.length > 1) {
        for (var t = 0; t < b.trail.length; t++) {
          var pt = b.trail[t];
          var alpha = (t / b.trail.length) * 0.6;
          var rr = (t / b.trail.length) * b.r * 0.8;
          var trailColor = b.hue === "gold" ? "rgba(245,196,81," : (b.hue === "magenta" ? "rgba(240,75,208," : "rgba(93,224,240,");
          ctx.fillStyle = trailColor + alpha + ")";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!b.alive) continue;
      // Ball body — chrome metallic
      var bgrad = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.r);
      if (b.hue === "gold") {
        bgrad.addColorStop(0, "#fff5d0");
        bgrad.addColorStop(0.5, "#f5c451");
        bgrad.addColorStop(1, "#a87a14");
      } else if (b.hue === "magenta") {
        bgrad.addColorStop(0, "#ffd5f4");
        bgrad.addColorStop(0.5, "#f04bd0");
        bgrad.addColorStop(1, "#7a1e74");
      } else {
        bgrad.addColorStop(0, "#e8faff");
        bgrad.addColorStop(0.5, "#5de0f0");
        bgrad.addColorStop(1, "#176680");
      }
      ctx.fillStyle = bgrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      // Outline
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      // Tiny highlight dot
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(b.x - 2, b.y - 2.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
      // Magnet halo
      if (b.magnetT > 0 && !reducedMotion) {
        ctx.strokeStyle = "rgba(93,224,240,0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Bouncy halo
      if (b.bouncyT > 0 && !reducedMotion) {
        ctx.strokeStyle = "rgba(245,196,81,0.6)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var a = Math.max(0, p.life / p.totalLife);
      ctx.fillStyle = hexA(p.color || "#fff", a);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  function drawPowerupQueue() {
    // Bottom-left queue of pending power-ups (icons)
    var x = FIELD_LEFT + 12;
    var y = FIELD_BOTTOM + 14;
    if (state.pendingPowerups.length === 0 && !state.activePowerups.multiplierShots) return;
    ctx.save();
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("POWERUPS", x, y);
    var px = x;
    var py = y + 14;
    for (var i = 0; i < state.pendingPowerups.length; i++) {
      var t = state.pendingPowerups[i];
      var meta = POWERUP_META[t];
      ctx.fillStyle = meta.glow;
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText("[" + meta.glyph + " " + meta.label + "]", px, py);
      py += 14;
      if (py > FIELD_BOTTOM + 64) {
        px += 130; py = y + 14;
      }
    }
    if (state.activePowerups.multiplierShots > 0) {
      ctx.fillStyle = POWERUP_META.multiplier.glow;
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillText("[" + POWERUP_META.multiplier.glyph + " 2x x" + state.activePowerups.multiplierShots + "]", px, py);
    }
    ctx.restore();
  }

  // -- Color helpers ---------------------------------------------------------
  function hexA(hex, a) {
    if (!hex) return "rgba(255,255,255," + a + ")";
    if (hex.charAt(0) !== "#") return hex;
    var h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  // -- HUD update ------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudRound) dom.hudRound.textContent = String(state.round);
    if (dom.hudBalls) {
      dom.hudBalls.textContent = String(state.ballsRemaining);
      var cell = dom.hudBalls.parentElement;
      if (cell) {
        cell.classList.toggle("is-warning", state.ballsRemaining <= 3 && state.ballsRemaining > 0);
        cell.classList.toggle("is-danger", state.ballsRemaining === 0);
      }
    }
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      dom.goalName.textContent = state.ballsRemaining + " of " + BALLS_PER_ROUND + " drops left · round " + state.round;
    }
    if (dom.goalMeta) {
      var bits = [];
      if (state.activePowerups.multiplierShots > 0) bits.push("2x mult x" + state.activePowerups.multiplierShots);
      if (state.pendingPowerups.length > 0) {
        var labels = state.pendingPowerups.map(function (t) { return POWERUP_META[t].label; });
        bits.push(labels.join(" · "));
      }
      if (state.jackpotStreak > 0) bits.push("Jackpot streak " + state.jackpotStreak);
      if (bits.length === 0) bits.push("Powerups · 0 active");
      bits.push("Round " + state.roundScore + " pts");
      dom.goalMeta.textContent = bits.join(" · ");
    }
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Scholar / review modal ------------------------------------------------
  var activeQuestion = null;
  var pendingScholarSlot = -1;

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

  function openScholarQuestion(slotIdx) {
    activeQuestion = pickQuestion();
    pendingScholarSlot = slotIdx;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Slot · Optional · +" + SCHOLAR_BONUS_SCORE + " + " + SCHOLAR_BONUS_SHARDS + " shards";
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
    // shuffle answer order (Jon's randomization rule)
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
      dom.explanation.textContent = "Decoded! +" + SCHOLAR_BONUS_SCORE + " plus " + SCHOLAR_BONUS_SHARDS + " shards.";
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
    if (wasCorrect) {
      state.score += SCHOLAR_BONUS_SCORE;
      state.roundScore += SCHOLAR_BONUS_SCORE;
      addShards(SCHOLAR_BONUS_SHARDS, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCHOLAR_BONUS_SCORE + " SCHOLAR", LOGICAL_W / 2, 90, "is-bonus");
    }
    activeQuestion = null;
    pendingScholarSlot = -1;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function skipQuestion() {
    activeQuestion = null;
    pendingScholarSlot = -1;
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
    if (dom.endKicker) dom.endKicker.textContent = state.underperformedRounds >= LIVES_INIT ? "Lab Defeated You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Plinko Lab · Run complete";
    var bestSlotLabel = "—";
    if (state.bestSlotIdx >= 0) {
      bestSlotLabel = "$" + formatNumber(state.bestSlotPayout);
    }
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Rounds Played</div><div class="end-cell-value">' + state.round + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Balls Dropped</div><div class="end-cell-value">' + formatNumber(state.ballsDropped) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Jackpots</div><div class="end-cell-value">' + state.jackpotsHit + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Slot</div><div class="end-cell-value">' + bestSlotLabel + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Streak</div><div class="end-cell-value">' + state.maxJackpotStreak + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
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
          round: state.round,
          jackpots: state.jackpotsHit,
          balls: state.ballsDropped
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
          round: state.round,
          balls: state.ballsDropped,
          jackpots: state.jackpotsHit,
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
          file: "games/plinko-lab/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("plinko-lab:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("plinko-lab:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
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

  // -- Input -----------------------------------------------------------------
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
        if (k === "ArrowLeft" || k === "a" || k === "A") { state.keyAimL = true; e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { state.keyAimR = true; e.preventDefault(); return; }
        if (k === " " || k === "Spacebar" || k === "Enter") {
          if (e.repeat) return;
          dropBall();
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
      if (k === "ArrowLeft" || k === "a" || k === "A") { if (state) state.keyAimL = false; }
      if (k === "ArrowRight" || k === "d" || k === "D") { if (state) state.keyAimR = false; }
    });
    bindMouse();
    bindTouch();
    bindTouchControls();
  }

  function bindMouse() {
    canvas.addEventListener("mousemove", function (e) {
      if (phase !== "playing") return;
      var rect = canvas.getBoundingClientRect();
      var lx = (e.clientX - rect.left - offsetX) / scale;
      var ly = (e.clientY - rect.top - offsetY) / scale;
      // Only follow mouse-x if mouse is in the upper portion of the field
      if (ly < FIELD_TOP + 60) {
        state.aimerX = lx;
        clampAimer();
      } else {
        // also still follow horizontally but clamp
        state.aimerX = lx;
        clampAimer();
      }
    });
    canvas.addEventListener("click", function (e) {
      if (phase !== "playing") return;
      // tap/click anywhere drops ball
      var rect = canvas.getBoundingClientRect();
      var lx = (e.clientX - rect.left - offsetX) / scale;
      var ly = (e.clientY - rect.top - offsetY) / scale;
      // Use click x as aim
      state.aimerX = lx;
      clampAimer();
      // small delay so user sees aim shift
      setTimeout(function () { dropBall(); }, 30);
    });
  }

  function bindTouch() {
    var touchActive = false;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (e.touches && e.touches.length === 1) {
        var rect = canvas.getBoundingClientRect();
        var lx = (e.touches[0].clientX - rect.left - offsetX) / scale;
        state.aimerX = lx;
        clampAimer();
        touchActive = true;
      }
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (phase !== "playing" || !touchActive) return;
      if (e.touches && e.touches.length === 1) {
        var rect = canvas.getBoundingClientRect();
        var lx = (e.touches[0].clientX - rect.left - offsetX) / scale;
        state.aimerX = lx;
        clampAimer();
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      if (phase !== "playing") { touchActive = false; return; }
      if (touchActive) {
        // tap to drop
        dropBall();
      }
      touchActive = false;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { touchActive = false; }, { passive: true });
  }

  function bindTouchControls() {
    function pressBtn(btn, dirOrFn) {
      if (!btn) return;
      var fire = function (e) {
        if (e) e.preventDefault();
        if (phase !== "playing") return;
        if (typeof dirOrFn === "function") dirOrFn();
        else if (dirOrFn === "left") { state.aimerX -= 32; clampAimer(); }
        else if (dirOrFn === "right") { state.aimerX += 32; clampAimer(); }
      };
      btn.addEventListener("click", fire);
      btn.addEventListener("touchstart", fire, { passive: false });
    }
    pressBtn(dom.tcLeft, "left");
    pressBtn(dom.tcRight, "right");
    pressBtn(dom.tcDrop, function () { dropBall(); });
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
      score: s.score || 0,
      round: s.round || 1,
      ballsDropped: s.balls || 0,
      jackpotsHit: s.jackpots || 0,
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
    if (snap && snap.state && (snap.state.score || snap.state.balls) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Round ' + (snap.state.round || 1) +
        ' &middot; Balls ' + (snap.state.balls || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Plinko Lab Scores</div>';
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
      updateAmbient(dt);
      updateBalls(dt);
    } else if (phase === "roundEnd") {
      // Continue updating balls (so any in-flight finish their animation)
      updateAmbient(dt);
      updateBalls(dt);
    }
    if (state) {
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "paused" || phase === "roundEnd" || phase === "ended") {
      updateHud();
    }
    rafHandle = requestAnimationFrame(loop);
  }

  // -- Boot ------------------------------------------------------------------
  function boot() {
    setupDom();
    initState({});
    state.activePowerups = state.activePowerups || {};
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
