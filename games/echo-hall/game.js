/* ===========================================================================
   Echo Hall — Simon Says ring · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · 4-pad / 6-pad ring · scholar echoes
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "echo-hall";
  var GAME_TITLE = "Echo Hall";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  // Ring geometry
  var RING_CX = LOGICAL_W / 2;
  var RING_CY = LOGICAL_H / 2 + 12; // slightly below center (HUD room)
  var RING_OUTER_R = 280;
  var RING_INNER_R = 110;
  var PAD_GAP_DEG = 4;              // angular gap between pads, in degrees

  // Difficulty / scoring
  var LIVES_INIT = 3;
  var LIVES_BONUS_INTERVAL = 5;     // every 5 successful rounds → +1 life
  var LIVES_CAP = 6;
  var SHARDS_CAP = 200;
  var BONUS_LIFE_THRESHOLD = 10000; // legacy unused; kept for parity
  var HARD_MODE_ROUND = 8;          // pad count goes from 4 → 6
  var SHUFFLE_INTERVAL = 3;         // hard mode: maybe shuffle every N rounds
  var REVERSE_EVERY = 5;            // every 5th round = backward
  var WATCH_BASE_MS = 600;          // pad lit duration round 1
  var WATCH_FLOOR_MS = 200;         // floor speed
  var WATCH_BETWEEN_MS = 100;       // gap between pad flashes during watch
  var SCHOLAR_ROUND_RATE = 0.27;    // ~ once per 4 rounds (probabilistic)
  var SCHOLAR_BONUS_SCORE = 1500;
  var SCHOLAR_BONUS_SHARDS = 12;
  var SCHOLAR_FIRST_ELIGIBLE = 2;   // not on round 1 — don't surprise on first round
  var POWERUP_INVENTORY_CAP = 3;
  var POWERUP_DROP_RATE = 0.35;     // chance to drop a power-up after a perfect (non-reverse) round
  var POWERUP_REVERSE_DROP_RATE = 0.55; // higher on reverse round
  var POWERUP_SKIP_STREAK_RATE = 0.12;  // chance to drop SKIP on 5+ streak
  var MULT_INC_PER_PERFECT = 0.5;
  var MULT_CAP = 5;

  // 6-pad sigil glyphs + meta
  var DISCIPLINES = [
    { id: "history",   sigil: "H", color: "#d04848", colorDeep: "#8a2a2a", label: "History",   freq: 220.00 }, // history-low
    { id: "science",   sigil: "S", color: "#5de0f0", colorDeep: "#1d8ea0", label: "Science",   freq: 587.33 }, // cyan ping (D5)
    { id: "art",       sigil: "A", color: "#a991ff", colorDeep: "#6b53d6", label: "Art",       freq: 369.99 }, // violet shimmer (F#4)
    { id: "language",  sigil: "L", color: "#4dd49b", colorDeep: "#1f8d68", label: "Language",  freq: 329.63 }, // emerald (E4)
    { id: "math",      sigil: "M", color: "#f5c451", colorDeep: "#a86c1a", label: "Math",      freq: 440.00 }, // gold (A4)
    { id: "geography", sigil: "G", color: "#6d8df0", colorDeep: "#324a9c", label: "Geography", freq: 277.18 }  // indigo (C#4)
  ];

  // Pad layout: which discipline indices are active for the round
  // 4-pad mode uses indices [0, 1, 2, 3] (history, science, art, language)
  // 6-pad mode uses all 6
  function disciplinesForMode(hardMode) {
    if (hardMode) return [0, 1, 2, 3, 4, 5];
    return [0, 1, 2, 3];
  }

  // Watch duration scaling
  function watchDurationMs(round) {
    // Round 1 = 600ms, drops 35-40ms per round, floor 200
    var d = WATCH_BASE_MS - (round - 1) * 40;
    return Math.max(WATCH_FLOOR_MS, d);
  }

  // -- Inline review bank (28 entries) ---------------------------------------
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence", hint: "Home of the Medici banking family." },
    { prompt: "The Magna Carta (1215) is significant because it:", choices: ["Limited the power of the English king", "Established Parliament", "Ended the Hundred Years' War", "Founded the common law"], correctText: "Limited the power of the English king", hint: "First written check on royal authority." },
    { prompt: "Which gas do plants release during photosynthesis?", choices: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctText: "Oxygen", hint: "We breathe it in." },
    { prompt: "What is the powerhouse of the cell?", choices: ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"], correctText: "Mitochondria", hint: "Generates ATP." },
    { prompt: "Who painted the ceiling of the Sistine Chapel?", choices: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"], correctText: "Michelangelo", hint: "Italian Renaissance sculptor and painter." },
    { prompt: "Which composer wrote the Ninth Symphony with its 'Ode to Joy'?", choices: ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Franz Schubert"], correctText: "Ludwig van Beethoven", hint: "He was deaf when he composed it." },
    { prompt: "An immediate cause of World War I was the assassination of:", choices: ["Archduke Franz Ferdinand", "Tsar Nicholas II", "Kaiser Wilhelm II", "Otto von Bismarck"], correctText: "Archduke Franz Ferdinand", hint: "Sarajevo, June 1914." },
    { prompt: "Which river runs through Paris, France?", choices: ["The Seine", "The Thames", "The Rhine", "The Danube"], correctText: "The Seine", hint: "Notre-Dame sits on an island in it." },
    { prompt: "What is 7 squared?", choices: ["49", "14", "42", "56"], correctText: "49", hint: "7 times 7." },
    { prompt: "What is the value of pi rounded to two decimals?", choices: ["3.14", "3.41", "2.17", "3.18"], correctText: "3.14", hint: "Circle's circumference / diameter." },
    { prompt: "A noun is best defined as:", choices: ["A person, place, thing, or idea", "An action word", "A describing word", "A connector word"], correctText: "A person, place, thing, or idea", hint: "Schoolhouse Rock made a song about it." },
    { prompt: "Which is a primary source?", choices: ["A diary written during the event studied", "A modern textbook", "An encyclopedia entry", "A documentary made decades later"], correctText: "A diary written during the event studied", hint: "First-hand record from the period." },
    { prompt: "The largest desert in the world (by area) is the:", choices: ["Antarctic Desert", "Sahara", "Gobi", "Kalahari"], correctText: "Antarctic Desert", hint: "Cold deserts count too." },
    { prompt: "Which planet has the most moons (as of 2025)?", choices: ["Saturn", "Jupiter", "Neptune", "Uranus"], correctText: "Saturn", hint: "Ringed gas giant." },
    { prompt: "The 13th Amendment to the U.S. Constitution (1865):", choices: ["Abolished slavery", "Granted women the vote", "Created the income tax", "Lowered the voting age"], correctText: "Abolished slavery", hint: "Followed the Civil War." },
    { prompt: "Brown v. Board of Education (1954) ruled:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required nationwide", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional", hint: "Overturned Plessy v. Ferguson." },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain", hint: "Coal, steam, and textiles, late 1700s." },
    { prompt: "DNA is shaped like a:", choices: ["Double helix", "Single spiral", "Cube lattice", "Triangular sheet"], correctText: "Double helix", hint: "Watson and Crick (and Franklin) modeled it." },
    { prompt: "The atomic number of carbon is:", choices: ["6", "12", "14", "8"], correctText: "6", hint: "Number of protons." },
    { prompt: "Which Greek epic poem follows Odysseus's journey home?", choices: ["The Odyssey", "The Iliad", "The Aeneid", "Beowulf"], correctText: "The Odyssey", hint: "By Homer; ten-year voyage." },
    { prompt: "The Berlin Wall fell in:", choices: ["1989", "1991", "1985", "1979"], correctText: "1989", hint: "End-of-decade Cold War turning point." },
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations", "NATO", "The League of Nations", "The European Union"], correctText: "The United Nations", hint: "Drafted under Eleanor Roosevelt." },
    { prompt: "Solve: 12 × 8 = ?", choices: ["96", "92", "108", "104"], correctText: "96", hint: "Twelve eights." },
    { prompt: "Which structure is the longest wall ever built?", choices: ["The Great Wall of China", "Hadrian's Wall", "The Berlin Wall", "The Walls of Constantinople"], correctText: "The Great Wall of China", hint: "Ming dynasty completed major sections." },
    { prompt: "Impressionist painter known for 'Water Lilies':", choices: ["Claude Monet", "Vincent van Gogh", "Pablo Picasso", "Edgar Degas"], correctText: "Claude Monet", hint: "Painted his own garden at Giverny." },
    { prompt: "The largest ocean on Earth is the:", choices: ["Pacific", "Atlantic", "Indian", "Arctic"], correctText: "Pacific", hint: "It alone covers about a third of Earth's surface." },
    { prompt: "A right angle measures:", choices: ["90 degrees", "45 degrees", "180 degrees", "60 degrees"], correctText: "90 degrees", hint: "Quarter of a full turn." },
    { prompt: "Shakespeare's tragic prince of Denmark is:", choices: ["Hamlet", "Macbeth", "Othello", "Lear"], correctText: "Hamlet", hint: "'To be, or not to be.'" }
  ];

  // -- Canvas / state --------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  // Phases:
  //   setup | playing-watch | playing-repeat | playing-roundover
  //   question | paused | ended | introWatch
  var phase = "setup";
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

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
    var type = opts.type || "sine";
    var vol = opts.volume == null ? 0.16 : opts.volume;
    var attack = opts.attack || 0.005;
    var decay = opts.decay == null ? duration : opts.decay;
    var now = ctxA.currentTime + (opts.delay || 0);
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

  // Pad-specific tone (length depends on watchDuration; we want a clean sine ping)
  function sfxPadTone(disciplineIdx, durationMs) {
    var d = DISCIPLINES[disciplineIdx];
    if (!d) return;
    var dur = Math.max(0.08, (durationMs || 360) / 1000);
    // Layered: a sine fundamental + soft triangle harmonic for richness
    sfxTone(d.freq, dur, { type: "sine", volume: 0.18, decay: dur * 0.95 });
    sfxTone(d.freq * 2, dur * 0.7, { type: "triangle", volume: 0.05, decay: dur * 0.65 });
  }

  var sfx = {
    tap:        function (idx) { sfxPadTone(idx, 240); },
    miss:       function () {
      sfxTone(180, 0.30, { type: "sawtooth", volume: 0.18, endFreq: 70 });
      sfxNoise(0.18, { volume: 0.10, cutoff: 600 });
    },
    roundComplete: function () {
      [523, 659, 784, 988].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    scholarAppear: function () {
      sfxTone(880, 0.18, { type: "sine", volume: 0.18 });
      setTimeout(function () { sfxTone(1320, 0.20, { type: "sine", volume: 0.18 }); }, 110);
    },
    scholarCorrect: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholarWrong: function () {
      sfxTone(330, 0.32, { type: "sawtooth", volume: 0.16, endFreq: 100 });
    },
    lifeLost: function () {
      sfxNoise(0.32, { volume: 0.15, cutoff: 500 });
      sfxTone(220, 0.36, { type: "sawtooth", volume: 0.14, endFreq: 50 });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    powerupPickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerupUse: function () {
      sfxTone(660, 0.10, { type: "square", volume: 0.14 });
      setTimeout(function () { sfxTone(990, 0.12, { type: "square", volume: 0.14 }); }, 60);
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.14 }); }, 130);
    },
    hardModeUnlock: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.20, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    reverseRoundWarn: function () {
      sfxTone(660, 0.14, { type: "triangle", volume: 0.14, endFreq: 330 });
      setTimeout(function () { sfxTone(330, 0.20, { type: "triangle", volume: 0.14, endFreq: 660 }); }, 150);
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("echoCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudRound = $("hudRound");
    dom.hudMult = $("hudMult");
    dom.hudBest = $("hudBest");
    dom.phaseName = $("phaseName");
    dom.phaseMeta = $("phaseMeta");
    dom.waveRibbon = $("waveRibbon");
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
    dom.powerupDock = $("powerupDock");
  }

  // -- Pad geometry ----------------------------------------------------------
  // Each pad occupies an arc segment on a ring. Returns {centerX, centerY, startAngle, endAngle}.
  function padArc(padIdx, padCount) {
    var step = (Math.PI * 2) / padCount;
    var gap = (PAD_GAP_DEG * Math.PI) / 180;
    // Start at top: angle 0 = right, so we shift by -PI/2 to put pad 0 at top.
    var midAngle = -Math.PI / 2 + padIdx * step;
    var startAngle = midAngle - step / 2 + gap / 2;
    var endAngle = midAngle + step / 2 - gap / 2;
    var midR = (RING_OUTER_R + RING_INNER_R) / 2;
    return {
      midAngle: midAngle,
      startAngle: startAngle,
      endAngle: endAngle,
      cx: RING_CX + Math.cos(midAngle) * midR,
      cy: RING_CY + Math.sin(midAngle) * midR
    };
  }

  // Pick the pad index that contains a given world (logical) point. -1 if outside ring.
  function padIdxAtPoint(x, y, padCount) {
    var dx = x - RING_CX;
    var dy = y - RING_CY;
    var r = Math.sqrt(dx * dx + dy * dy);
    if (r < RING_INNER_R || r > RING_OUTER_R) return -1;
    var ang = Math.atan2(dy, dx); // -PI..PI
    // Convert to "from top, clockwise" => 0..2PI starting at top
    var rel = ang + Math.PI / 2;
    if (rel < 0) rel += Math.PI * 2;
    if (rel >= Math.PI * 2) rel -= Math.PI * 2;
    var step = (Math.PI * 2) / padCount;
    var idx = Math.floor((rel + step / 2) / step) % padCount;
    if (idx < 0) idx += padCount;
    return idx;
  }

  // -- Power-ups -------------------------------------------------------------
  var POWERUP_TYPES = ["reveal", "slow", "shield", "mult", "skip"];
  var POWERUP_META = {
    reveal: { glyph: "👁", label: "Reveal",   color: "#5de0f0", desc: "Shows the next pad" },
    slow:   { glyph: "⏱",       label: "Slow",     color: "#9bd5ff", desc: "Slow next watch by 1.5x" },
    shield: { glyph: "🛡", label: "Shield",   color: "#a8e8ff", desc: "Next wrong tap is free" },
    mult:   { glyph: "⭐",       label: "2x Mult",  color: "#fff8c4", desc: "2x score for 3 rounds" },
    skip:   { glyph: "🔄", label: "Skip",     color: "#f0a8e8", desc: "Auto-clear current round" }
  };

  function pickPowerupTypeForRound(state) {
    // SKIP is rare: only via streak rolls; otherwise pick from the other 4 types
    var pool = ["reveal", "slow", "shield", "mult"];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function tryDropPowerup(round, perfectStreak) {
    if (!state) return;
    if (state.powerups.length >= POWERUP_INVENTORY_CAP) return;
    var isReverse = (round % REVERSE_EVERY) === 0;
    var rate = isReverse ? POWERUP_REVERSE_DROP_RATE : POWERUP_DROP_RATE;
    if (Math.random() < rate) {
      var type = pickPowerupTypeForRound(state);
      state.powerups.push({ type: type });
      sfx.powerupPickup();
      pushPopup("+ " + POWERUP_META[type].label, RING_CX, LOGICAL_H - 110, "is-bonus");
      renderPowerupDock();
    }
    // Streak-driven SKIP roll
    if (perfectStreak >= 5 && state.powerups.length < POWERUP_INVENTORY_CAP) {
      if (Math.random() < POWERUP_SKIP_STREAK_RATE) {
        state.powerups.push({ type: "skip" });
        sfx.powerupPickup();
        pushPopup("+ Skip Round", RING_CX, LOGICAL_H - 130, "is-legend");
        renderPowerupDock();
      }
    }
  }

  function activatePowerup(slot) {
    if (!state) return;
    if (slot < 0 || slot >= state.powerups.length) return;
    var p = state.powerups[slot];
    if (!p) return;
    var meta = POWERUP_META[p.type];
    sfx.powerupUse();
    pushPopup(meta.label.toUpperCase() + "!", RING_CX, RING_CY - 120, "is-bonus");
    if (p.type === "reveal") {
      state.flags.revealNext = 2; // reveal next 2 pads if requested mid-watch (or peek at round start)
    } else if (p.type === "slow") {
      state.flags.slowNextWatch = true;
    } else if (p.type === "shield") {
      state.flags.shieldArmed = true;
    } else if (p.type === "mult") {
      state.flags.multBonusRounds = 3;
    } else if (p.type === "skip") {
      // Auto-complete current round only valid during repeat phase
      if (phase === "playing-repeat") {
        // Score as if all sequence taps were correct; trigger round-over success
        state.flags.skipFiring = true;
        completeRoundFromSkip();
      } else {
        // refund — push back into inventory
        return;
      }
    }
    state.powerups.splice(slot, 1);
    renderPowerupDock();
  }

  function renderPowerupDock() {
    if (!dom.powerupDock) return;
    var slots = dom.powerupDock.querySelectorAll(".powerup-slot");
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var p = state && state.powerups[i];
      var glyph = slot.querySelector(".slot-glyph");
      var label = slot.querySelector(".slot-label");
      slot.classList.remove("is-filled", "is-active");
      if (p) {
        var meta = POWERUP_META[p.type];
        slot.classList.add("is-filled");
        if (glyph) glyph.textContent = meta.glyph;
        if (label) label.textContent = meta.label;
      } else {
        if (glyph) glyph.textContent = "";
        if (label) label.textContent = "";
      }
    }
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var startRound = opts.round || 1;
    var hardMode = startRound >= HARD_MODE_ROUND;
    var padCount = hardMode ? 6 : 4;
    state = {
      round: startRound,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      multiplier: opts.multiplier || 1,
      perfectStreak: opts.perfectStreak || 0,
      hardMode: hardMode,
      hardModeAnnounced: hardMode,
      padCount: padCount,
      // disciplineMap: pad index -> discipline index. Default identity; shuffles in hard mode.
      disciplineMap: defaultDisciplineMap(padCount),
      sequence: [], // array of pad indices for current round
      seqIdx: 0,    // index in sequence we're currently lighting (watch) or expecting (repeat)
      reverse: false,
      // Visual: pad activations [{padIdx, t (0..1), source, scholar}]
      flashes: [],
      pads: buildPads(padCount),
      // Power-ups
      powerups: [],
      flags: {
        revealNext: 0,            // count of upcoming pads to "reveal" (peek pulse)
        slowNextWatch: false,
        shieldArmed: false,
        multBonusRounds: 0,
        skipFiring: false,
        scholarPending: false
      },
      // Stats
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      bestRound: opts.bestRound || startRound,
      sequencesCleared: opts.sequencesCleared || 0,
      maxSeqLength: opts.maxSeqLength || 0,
      hardModeReached: opts.hardModeReached || hardMode,
      best: opts.best || readBest(),
      // Visuals
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      hitPause: 0,         // freezes the loop briefly on milestone events
      bgPulse: 0,
      bgStars: opts.bgStars || generateStars(),
      time: 0,
      // Watch / repeat timing
      watchTimer: 0,        // time within current pad lit interval
      watchPadDur: 0,       // duration of the current pad lit (seconds)
      watchGap: 0,          // gap timer between pad lights
      isReverseRound: false,
      reverseShown: false,
      endReason: ""
    };
    state.isReverseRound = (state.round % REVERSE_EVERY) === 0;
  }

  function defaultDisciplineMap(padCount) {
    var arr = [];
    for (var i = 0; i < padCount; i++) arr.push(i % DISCIPLINES.length);
    return arr;
  }

  function buildPads(padCount) {
    var pads = [];
    for (var i = 0; i < padCount; i++) {
      pads.push({ idx: i, glow: 0, idleT: Math.random() * Math.PI * 2 });
    }
    return pads;
  }

  function generateStars() {
    var stars = [];
    for (var i = 0; i < 56; i++) {
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

  // -- Sequence build / round flow -------------------------------------------
  function buildSequenceForRound(round) {
    // length 3 + (round - 1), capped at 30
    var len = Math.min(30, 3 + (round - 1));
    var seq = [];
    for (var i = 0; i < len; i++) {
      seq.push(Math.floor(Math.random() * state.padCount));
    }
    return seq;
  }

  function startRound() {
    if (!state) return;
    // Hard mode unlock?
    var wasHard = state.hardMode;
    state.hardMode = state.round >= HARD_MODE_ROUND;
    if (state.hardMode && !state.hardModeAnnounced) {
      state.hardModeAnnounced = true;
      state.hardModeReached = true;
      state.padCount = 6;
      state.disciplineMap = defaultDisciplineMap(6);
      state.pads = buildPads(6);
      sfx.hardModeUnlock();
      pushPopup("HARD MODE UNLOCKED", RING_CX, RING_CY - 230, "is-legend");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 32, palette: ["#a991ff", "#f5c451", "#6d8df0"] });
        }
      } catch (e) {}
      addShake(8, 0.4);
    }
    // Hard-mode shuffle every SHUFFLE_INTERVAL rounds (50% chance)
    if (state.hardMode && (state.round % SHUFFLE_INTERVAL === 0) && state.round > HARD_MODE_ROUND) {
      if (Math.random() < 0.5) {
        shuffleDisciplineMap();
        pushPopup("PADS SHUFFLED!", RING_CX, RING_CY - 200, "is-warn");
        addShake(5, 0.32);
      }
    }
    state.isReverseRound = (state.round % REVERSE_EVERY) === 0;
    state.reverseShown = false;
    state.sequence = buildSequenceForRound(state.round);
    state.maxSeqLength = Math.max(state.maxSeqLength, state.sequence.length);
    state.seqIdx = 0;
    state.flashes = [];
    // Decide if a scholar echo will interrupt this round
    var willScholar = state.round >= SCHOLAR_FIRST_ELIGIBLE
      && Math.random() < SCHOLAR_ROUND_RATE
      && (phase !== "ended");
    state.flags.scholarPending = willScholar;
    state.flags.scholarFiredAt = willScholar ? Math.floor(Math.random() * Math.max(1, state.sequence.length - 1)) + 1 : -1;
    // Reverse round ribbon warn
    if (state.isReverseRound) {
      sfx.reverseRoundWarn();
      addShake(3, 0.25);
    }
    setRibbon();
    state.watchTimer = 0;
    state.watchGap = state.isReverseRound ? 0.6 : 0.35;
    state.watchPadDur = (state.flags.slowNextWatch ? watchDurationMs(state.round) * 1.5 : watchDurationMs(state.round)) / 1000;
    state.flags.slowNextWatch = false;
    phase = "playing-watch";
    updateHud();
  }

  function shuffleDisciplineMap() {
    var n = state.padCount;
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(i % DISCIPLINES.length);
    // Fisher-Yates
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = arr[j]; arr[j] = arr[k]; arr[k] = tmp;
    }
    state.disciplineMap = arr;
  }

  function setRibbon() {
    if (!dom.waveRibbon) return;
    dom.waveRibbon.classList.remove("is-watch", "is-repeat", "is-reverse", "is-hard");
    var label = "Watch the echo";
    if (state.isReverseRound) {
      dom.waveRibbon.classList.add("is-reverse");
      label = "Watch (REVERSE round)";
    } else if (phase === "playing-watch") {
      dom.waveRibbon.classList.add("is-watch");
      label = "Watch the echo";
    } else if (phase === "playing-repeat") {
      dom.waveRibbon.classList.add("is-repeat");
      label = state.isReverseRound ? "Repeat BACKWARD" : "Repeat the echo";
    } else if (phase === "playing-roundover") {
      dom.waveRibbon.classList.add("is-watch");
      label = "Round complete";
    } else {
      label = "Watch the echo";
    }
    if (state.hardMode) dom.waveRibbon.classList.add("is-hard");
    if (dom.phaseName) dom.phaseName.textContent = label;
    if (dom.phaseMeta) {
      var seqLen = state.sequence.length;
      var idx = Math.min(seqLen, state.seqIdx);
      dom.phaseMeta.textContent = "Sequence " + idx + "/" + seqLen + " · R" + state.round;
    }
  }

  // -- Watch phase -----------------------------------------------------------
  function updateWatchPhase(dt) {
    if (phase !== "playing-watch") return;
    if (state.hitPause > 0) { state.hitPause -= dt; return; }
    state.watchTimer += dt;
    // Currently lighting state.seqIdx-th pad (well, in display order).
    // When in reverse round, we still SHOW forward, then ask player to reverse.
    var totalDur = state.watchPadDur + 0.10; // pad lit + tail buffer
    if (state.watchGap > 0) {
      state.watchGap -= dt;
      if (state.watchGap <= 0) {
        state.watchGap = 0;
        // Schedule next pad light: scholar fire?
        if (state.flags.scholarPending && state.seqIdx === state.flags.scholarFiredAt) {
          // Trigger scholar interruption now (replace this beat with the gold "?" pad)
          fireScholarEcho();
          return;
        }
        beginPadFlash(state.sequence[state.seqIdx], state.watchPadDur);
        state.watchTimer = 0;
      }
      return;
    }
    if (state.watchTimer >= totalDur) {
      // Move to next pad in sequence
      state.seqIdx++;
      setRibbon();
      if (state.seqIdx >= state.sequence.length) {
        // Watch phase done; advance to repeat
        beginRepeatPhase();
        return;
      }
      // Reveal peek if requested (highlights the next pad subtly via small glow)
      if (state.flags.revealNext > 0) {
        previewNextPad();
        state.flags.revealNext--;
      }
      // Inter-pad gap
      state.watchGap = Math.max(0.10, WATCH_BETWEEN_MS / 1000 - (state.round * 0.005));
      state.watchTimer = 0;
    }
  }

  function beginPadFlash(padIdx, durSec) {
    state.flashes.push({
      padIdx: padIdx,
      t: 0,
      duration: durSec,
      source: "watch"
    });
    sfxPadTone(state.disciplineMap[padIdx], durSec * 1000);
  }

  function previewNextPad() {
    // Subtle glow on the upcoming pad (helps "Reveal" power-up read)
    if (state.seqIdx >= state.sequence.length) return;
    var padIdx = state.sequence[state.seqIdx];
    state.flashes.push({
      padIdx: padIdx,
      t: 0,
      duration: 0.30,
      source: "preview",
      faint: true
    });
  }

  function beginRepeatPhase() {
    state.seqIdx = 0;
    state.watchTimer = 0;
    phase = "playing-repeat";
    setRibbon();
    pushPopup(state.isReverseRound ? "GO! BACKWARD" : "GO!", RING_CX, RING_CY - 200, state.isReverseRound ? "is-warn" : "is-cyan");
  }

  // -- Repeat phase: handle player taps --------------------------------------
  function expectedPadAt(seqIdx) {
    if (state.isReverseRound) {
      return state.sequence[state.sequence.length - 1 - seqIdx];
    }
    return state.sequence[seqIdx];
  }

  function tapPad(padIdx) {
    if (phase !== "playing-repeat") return;
    if (state.flags.skipFiring) return;
    // Visual + audio
    state.flashes.push({
      padIdx: padIdx,
      t: 0,
      duration: 0.28,
      source: "tap"
    });
    sfx.tap(state.disciplineMap[padIdx]);
    spawnTapRipple(padIdx);
    var expected = expectedPadAt(state.seqIdx);
    if (padIdx === expected) {
      state.seqIdx++;
      setRibbon();
      if (state.seqIdx >= state.sequence.length) {
        // Round complete!
        onRoundComplete();
      }
    } else {
      // Wrong pad
      onWrongTap(padIdx);
    }
  }

  function onWrongTap(padIdx) {
    if (state.flags.shieldArmed) {
      state.flags.shieldArmed = false;
      pushPopup("SHIELD!", RING_CX, RING_CY - 180, "is-cyan");
      sfx.powerupUse();
      // Don't penalize — let player continue
      return;
    }
    sfx.miss();
    addShake(8, 0.45);
    state.lives--;
    state.perfectStreak = 0;
    state.multiplier = 1;
    pushPopup("MISS!", RING_CX, RING_CY, "is-warn");
    burstAt(RING_CX, RING_CY, "#f04860", 24);
    sfx.lifeLost();
    updateHud();
    if (state.lives <= 0) {
      gameOver();
      return;
    }
    // Replay sequence: short pause then re-watch
    phase = "playing-roundover";
    state.hitPause = 0.65;
    setTimeout(function () {
      if (phase !== "playing-roundover" || !state) return;
      // Restart same round (don't increase length); replay watch
      state.flashes = [];
      state.seqIdx = 0;
      state.watchPadDur = watchDurationMs(state.round) / 1000;
      state.watchGap = 0.4;
      state.watchTimer = 0;
      // Don't fire scholar again on retry
      state.flags.scholarPending = false;
      state.flags.scholarFiredAt = -1;
      phase = "playing-watch";
      setRibbon();
    }, 700);
  }

  function onRoundComplete() {
    if (state.isReverseRound) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("echo-hall", "echo-reverse-clear"); } catch (e) {}
    }
    sfx.roundComplete();
    state.sequencesCleared++;
    state.perfectStreak++;
    state.bestRound = Math.max(state.bestRound, state.round);
    if (state.round >= HARD_MODE_ROUND) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("echo-hall", "echo-hard-mode"); } catch (e) {}
    }
    // Score
    var multBonus = (state.flags.multBonusRounds > 0) ? 2 : 1;
    var earned = Math.round(100 * state.sequence.length * state.multiplier * multBonus);
    state.score += earned;
    pushPopup("+" + earned, RING_CX, RING_CY, "is-score");
    // Multiplier bump
    if (!state.flags.shieldArmed) {
      state.multiplier = Math.min(MULT_CAP, state.multiplier + MULT_INC_PER_PERFECT);
    }
    if (state.multiplier >= 3 && !reducedMotion) {
      state.hitPause = 0.18;
    }
    // Power-up drop
    tryDropPowerup(state.round, state.perfectStreak);
    // Bonus life every N rounds
    if (state.round % LIVES_BONUS_INTERVAL === 0 && state.lives < LIVES_CAP) {
      state.lives++;
      pushPopup("+1 LIFE", RING_CX, RING_CY - 60, "is-bonus");
    }
    // Mult bonus rounds tick down
    if (state.flags.multBonusRounds > 0) state.flags.multBonusRounds--;
    // Particles
    if (!reducedMotion) {
      var palette = ["#f5c451", "#5de0f0", "#a991ff", "#4dd49b"];
      for (var i = 0; i < 18; i++) {
        burstAt(RING_CX + Math.cos(i / 3) * 80, RING_CY + Math.sin(i / 3) * 80, palette[i % palette.length], 10);
      }
    }
    // 5-streak celebration
    if (state.perfectStreak >= 5 && state.perfectStreak % 5 === 0) {
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0"] });
        }
      } catch (e) {}
      pushPopup("STREAK x" + state.perfectStreak + "!", RING_CX, RING_CY - 130, "is-legend");
    }
    state.round++;
    phase = "playing-roundover";
    setRibbon();
    updateHud();
    saveSnapshot();
    setTimeout(function () {
      if (!state || phase === "ended" || phase === "paused") return;
      if (phase === "playing-roundover") {
        startRound();
      }
    }, 1200);
  }

  function completeRoundFromSkip() {
    // Auto-complete: pretend all remaining taps land
    var earned = Math.round(100 * state.sequence.length * state.multiplier);
    state.score += earned;
    pushPopup("SKIP +" + earned, RING_CX, RING_CY, "is-bonus");
    state.flags.skipFiring = false;
    state.sequencesCleared++;
    state.bestRound = Math.max(state.bestRound, state.round);
    state.round++;
    phase = "playing-roundover";
    setRibbon();
    updateHud();
    setTimeout(function () {
      if (!state || phase === "ended" || phase === "paused") return;
      if (phase === "playing-roundover") startRound();
    }, 900);
  }

  // -- Scholar echo ----------------------------------------------------------
  var activeQuestion = null;
  function fireScholarEcho() {
    sfx.scholarAppear();
    state.flags.scholarPending = false;
    var pad = state.sequence[state.seqIdx];
    state.flashes.push({
      padIdx: pad,
      t: 0,
      duration: 1.2,
      source: "scholar"
    });
    pauseMusic();
    addShake(3, 0.2);
    setTimeout(openScholarQuestion, 380);
  }

  function openScholarQuestion() {
    if (!state) return;
    if (phase !== "playing-watch") {
      resumeMusic();
      return;
    }
    prevPhase = phase;
    phase = "question";
    // MRMAC_QUESTION_VALIDATOR_V1 — retry up to 10× for a valid inline question
    activeQuestion = (typeof window !== "undefined" && window.MrMacsPickValidQuestion)
      ? window.MrMacsPickValidQuestion(function () { return INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)]; }, 10)
      : null;
    if (!activeQuestion) activeQuestion = INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
    var choices = activeQuestion.choices.slice();
    // Shuffle answer choices for variety
    for (var i = choices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = choices[i]; choices[i] = choices[j]; choices[j] = tmp;
    }
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Echo · +" + SCHOLAR_BONUS_SCORE;
    if (dom.questionPrompt) dom.questionPrompt.textContent = activeQuestion.prompt;
    if (dom.explanation) {
      dom.explanation.textContent = activeQuestion.hint ? "Hint: " + activeQuestion.hint : "";
      dom.explanation.className = "explanation";
    }
    if (dom.choiceGrid) {
      var html = "";
      for (var k = 0; k < choices.length; k++) {
        html += '<button class="choice-btn" type="button" data-text="' + escapeHtml(choices[k]) + '">' +
          '<span class="choice-letter">' + String.fromCharCode(65 + k) + '.</span>' +
          escapeHtml(choices[k]) + '</button>';
      }
      dom.choiceGrid.innerHTML = html;
      var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
      for (var b = 0; b < btns.length; b++) btns[b].addEventListener("click", onChoiceClick);
    }
    showScreen("question");
  }

  function onChoiceClick(e) {
    if (!activeQuestion) return;
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
      dom.explanation.textContent = "Decoded! +" + SCHOLAR_BONUS_SCORE + " and +" + SCHOLAR_BONUS_SHARDS + " shards.";
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
      state.score += SCHOLAR_BONUS_SCORE;
      addShards(SCHOLAR_BONUS_SHARDS, "echo-hall-scholar-correct");
      sfx.scholarCorrect();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCHOLAR_BONUS_SCORE + " SCHOLAR", RING_CX, RING_CY - 200, "is-bonus");
    } else {
      sfx.scholarWrong();
    }
    activeQuestion = null;
    phase = prevPhase || "playing-watch";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
    // Resume sequence forward from where we left off (skip the scholar beat)
    state.seqIdx++;
    if (state.seqIdx >= state.sequence.length) {
      beginRepeatPhase();
    } else {
      state.watchGap = 0.32;
      state.watchTimer = 0;
    }
  }

  function skipQuestion() {
    if (phase !== "question") return;
    state.questionsAnsweredTotal++;
    activeQuestion = null;
    phase = prevPhase || "playing-watch";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    state.seqIdx++;
    if (state.seqIdx >= state.sequence.length) {
      beginRepeatPhase();
    } else {
      state.watchGap = 0.32;
      state.watchTimer = 0;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // -- Render ----------------------------------------------------------------
  function render() {
    if (!ctx || !canvas) return;
    var ts = performance.now();
    // shake
    var sh = state ? state.shake : null;
    var shakeX = sh ? sh.x : 0;
    var shakeY = sh ? sh.y : 0;
    ctx.save();
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, (offsetX + shakeX) * dpr, (offsetY + shakeY) * dpr);
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    drawBackground(ts);
    drawArchiveFrame();
    drawCenterCrest();
    drawPads(ts);
    drawFlashes();
    drawParticles();
    if (state) {
      // Center text overlays
      drawCenterIndicator();
    }
    ctx.restore();
  }

  function drawBackground(ts) {
    if (!state) return;
    // Bronze radial vault behind the ring
    var grd = ctx.createRadialGradient(RING_CX, RING_CY, RING_INNER_R * 0.5, RING_CX, RING_CY, RING_OUTER_R * 1.4);
    grd.addColorStop(0, "rgba(40, 26, 12, .72)");
    grd.addColorStop(0.5, "rgba(20, 14, 8, .55)");
    grd.addColorStop(1, "rgba(4, 6, 15, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Faint twinkling stars (vault particulate)
    if (state.bgStars) {
      for (var i = 0; i < state.bgStars.length; i++) {
        var s = state.bgStars[i];
        s.twinkle += 0.016 * s.twinkleSpeed;
        var a = 0.15 + 0.18 * Math.abs(Math.sin(s.twinkle));
        ctx.fillStyle = "rgba(255, 220, 160, " + a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawArchiveFrame() {
    // Thick bronze ring around the play ring
    ctx.save();
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";

    // Outer dark backing
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, RING_OUTER_R + 32, 0, Math.PI * 2);
    ctx.fillStyle = "#0a0d18";
    ctx.fill();

    // Bronze rim
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, RING_OUTER_R + 22, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    var rimGrad = ctx.createLinearGradient(RING_CX - RING_OUTER_R, RING_CY - RING_OUTER_R, RING_CX + RING_OUTER_R, RING_CY + RING_OUTER_R);
    rimGrad.addColorStop(0, "#b8843e");
    rimGrad.addColorStop(0.5, "#f0d068");
    rimGrad.addColorStop(1, "#7a4f23");
    ctx.strokeStyle = rimGrad;
    ctx.stroke();

    // Inner detail line
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, RING_OUTER_R + 12, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(245, 196, 81, 0.55)";
    ctx.stroke();

    // Bronze etchings: 8 wedge marks at cardinals + diagonals
    for (var i = 0; i < 8; i++) {
      var ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
      var cx1 = RING_CX + Math.cos(ang) * (RING_OUTER_R + 30);
      var cy1 = RING_CY + Math.sin(ang) * (RING_OUTER_R + 30);
      var cx2 = RING_CX + Math.cos(ang) * (RING_OUTER_R + 50);
      var cy2 = RING_CY + Math.sin(ang) * (RING_OUTER_R + 50);
      ctx.beginPath();
      ctx.moveTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(168, 110, 61, .9)";
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCenterCrest() {
    // Inner disc with the Echo Hall sigil
    ctx.save();
    var grd = ctx.createRadialGradient(RING_CX, RING_CY, RING_INNER_R * 0.2, RING_CX, RING_CY, RING_INNER_R);
    grd.addColorStop(0, "#1a1a30");
    grd.addColorStop(1, "#08101e");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, RING_INNER_R - 8, 0, Math.PI * 2);
    ctx.fill();

    // Bronze inner rim
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, RING_INNER_R - 4, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#a96e3d";
    ctx.stroke();

    // Sigil text
    ctx.fillStyle = "rgba(245, 196, 81, 0.86)";
    ctx.font = "italic 700 32px 'Fraunces', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Echo", RING_CX, RING_CY - 14);
    ctx.font = "italic 900 28px 'Fraunces', serif";
    ctx.fillStyle = "rgba(240, 208, 104, 1)";
    ctx.fillText("Hall", RING_CX, RING_CY + 18);

    ctx.restore();
  }

  function drawCenterIndicator() {
    if (!state) return;
    if (phase !== "playing-watch" && phase !== "playing-repeat") return;
    var label = "";
    var color = "#f5c451";
    if (phase === "playing-watch") {
      label = state.isReverseRound ? "WATCH • REVERSE" : "WATCH";
      color = state.isReverseRound ? "#f07bb8" : "#5de0f0";
    } else {
      label = state.isReverseRound ? "REPEAT ←" : "REPEAT";
      color = "#f5c451";
    }
    ctx.save();
    ctx.font = "800 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.fillText(label, RING_CX, RING_CY + RING_INNER_R - 40);
    ctx.fillStyle = color;
    ctx.fillText(label, RING_CX, RING_CY + RING_INNER_R - 41);
    ctx.restore();
  }

  function drawPads(ts) {
    if (!state) return;
    var idleSpeed = 0.0024;
    for (var i = 0; i < state.padCount; i++) {
      var arc = padArc(i, state.padCount);
      var disciplineIdx = state.disciplineMap[i];
      var d = DISCIPLINES[disciplineIdx];
      var pad = state.pads[i];
      pad.idleT += idleSpeed;
      // Glow decay
      pad.glow = Math.max(0, pad.glow - 0.04);

      // Idle pulse contribution (low)
      var idle = 0.18 + 0.06 * Math.sin(pad.idleT);
      var glow = pad.glow + idle * 0.22;
      drawPadShape(arc, d, glow, false);
    }

    // Scholar overlay pad: if we're in watch phase and this is the scholar beat slot, override visual
    // (handled implicitly via flash with source="scholar")
  }

  function drawPadShape(arc, discipline, glow, isScholar) {
    var color = isScholar ? "#f5c451" : discipline.color;
    var deep = isScholar ? "#a86c1a" : discipline.colorDeep;

    // Outer pad arc (highlight)
    ctx.save();
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, RING_OUTER_R, arc.startAngle, arc.endAngle);
    ctx.arc(RING_CX, RING_CY, RING_INNER_R, arc.endAngle, arc.startAngle, true);
    ctx.closePath();
    var padGrad = ctx.createRadialGradient(arc.cx, arc.cy, 4, arc.cx, arc.cy, 130);
    padGrad.addColorStop(0, mixHex(color, "#ffffff", 0.05 + glow * 0.7));
    padGrad.addColorStop(0.6, color);
    padGrad.addColorStop(1, deep);
    ctx.fillStyle = padGrad;
    ctx.fill();

    // Glow halo for active pads
    if (glow > 0.05) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 30 + 60 * glow;
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.stroke();
    }

    // Bronze divider lines on either side
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(168, 110, 61, 0.65)";
    ctx.beginPath();
    ctx.moveTo(RING_CX + Math.cos(arc.startAngle) * RING_INNER_R, RING_CY + Math.sin(arc.startAngle) * RING_INNER_R);
    ctx.lineTo(RING_CX + Math.cos(arc.startAngle) * RING_OUTER_R, RING_CY + Math.sin(arc.startAngle) * RING_OUTER_R);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(RING_CX + Math.cos(arc.endAngle) * RING_INNER_R, RING_CY + Math.sin(arc.endAngle) * RING_INNER_R);
    ctx.lineTo(RING_CX + Math.cos(arc.endAngle) * RING_OUTER_R, RING_CY + Math.sin(arc.endAngle) * RING_OUTER_R);
    ctx.stroke();

    // Sigil glyph
    ctx.fillStyle = isScholar ? "rgba(20, 12, 4, .85)" : "rgba(0,0,0,.55)";
    ctx.font = "italic 900 44px 'Fraunces', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isScholar ? "?" : discipline.sigil, arc.cx, arc.cy + 2);

    // Discipline label arc
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = "800 11px 'JetBrains Mono', monospace";
    ctx.fillText(isScholar ? "SCHOLAR" : discipline.label.toUpperCase(), arc.cx, arc.cy + 36);

    ctx.restore();
  }

  function drawFlashes() {
    if (!state) return;
    for (var i = 0; i < state.flashes.length; i++) {
      var f = state.flashes[i];
      var arc = padArc(f.padIdx, state.padCount);
      var d = DISCIPLINES[state.disciplineMap[f.padIdx]];
      var t = f.t;
      // Use pad.glow accumulator so the pad rendering picks it up next frame
      // but also draw an over-bright overlay this frame for snap.
      var brightness = 1 - Math.min(1, t / Math.max(0.001, f.duration));
      brightness = Math.pow(brightness, 0.6);
      if (f.faint) brightness *= 0.45;
      if (brightness <= 0.02) continue;
      // Deposit into pad glow so subsequent frames show afterglow
      state.pads[f.padIdx].glow = Math.max(state.pads[f.padIdx].glow, brightness * 0.8);
      // Bright overlay
      ctx.save();
      ctx.beginPath();
      ctx.arc(RING_CX, RING_CY, RING_OUTER_R - 1, arc.startAngle, arc.endAngle);
      ctx.arc(RING_CX, RING_CY, RING_INNER_R + 1, arc.endAngle, arc.startAngle, true);
      ctx.closePath();
      var color = f.source === "scholar" ? "#f5c451" : d.color;
      ctx.fillStyle = "rgba(255, 255, 255, " + (0.18 * brightness).toFixed(3) + ")";
      ctx.fill();
      ctx.shadowColor = color;
      ctx.shadowBlur = 80 * brightness;
      ctx.lineWidth = 2 + 4 * brightness;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Tap ripple ring
      if (f.source === "tap" && t < f.duration * 0.6) {
        var rt = t / Math.max(0.001, f.duration);
        var rad = RING_INNER_R + (RING_OUTER_R - RING_INNER_R) * 0.5 + rt * 60;
        ctx.beginPath();
        ctx.arc(arc.cx, arc.cy, 8 + rt * 60, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, " + (0.4 * (1 - rt)).toFixed(3) + ")";
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    if (!state || !state.particles) return;
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var alpha = Math.max(0, p.life / p.totalLife);
      ctx.fillStyle = "rgba(" + p.r + "," + p.g + "," + p.b + "," + alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // -- Particles + Popups + Shake -------------------------------------------
  function burstAt(x, y, hex, count) {
    if (!state || reducedMotion) return;
    var rgb = hexToRgb(hex);
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 220;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        size: 2 + Math.random() * 3,
        life: 0.6 + Math.random() * 0.4,
        totalLife: 1.0,
        r: rgb[0], g: rgb[1], b: rgb[2]
      });
    }
  }

  function spawnTapRipple(padIdx) {
    if (reducedMotion) return;
    var arc = padArc(padIdx, state.padCount);
    var d = DISCIPLINES[state.disciplineMap[padIdx]];
    burstAt(arc.cx, arc.cy, d.color, 8);
  }

  function updateParticles(dt) {
    if (!state || !state.particles) return;
    var keep = [];
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;       // gravity
      p.life -= dt;
      if (p.life > 0) keep.push(p);
    }
    state.particles = keep;
  }

  function updateFlashes(dt) {
    if (!state || !state.flashes) return;
    var keep = [];
    for (var i = 0; i < state.flashes.length; i++) {
      var f = state.flashes[i];
      f.t += dt;
      if (f.t < f.duration + 0.1) keep.push(f);
    }
    state.flashes = keep;
  }

  function pushPopup(text, x, y, cls) {
    if (!dom.popupOverlay) return;
    var rect = canvas.getBoundingClientRect();
    var px = (x * scale) + offsetX + rect.left;
    var py = (y * scale) + offsetY + rect.top;
    var el = document.createElement("div");
    el.className = "popup-text " + (cls || "");
    el.style.left = px + "px";
    el.style.top = py + "px";
    el.textContent = text;
    dom.popupOverlay.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
  }

  function addShake(intensity, life) {
    if (!state) return;
    if (reducedMotion) return;
    state.shake.intensity = Math.max(state.shake.intensity, intensity);
    state.shake.life = Math.max(state.shake.life, life);
    state.shake.totalLife = state.shake.life;
  }

  function updateShake(dt) {
    if (!state) return;
    var sh = state.shake;
    if (sh.life <= 0) { sh.x = 0; sh.y = 0; sh.intensity = 0; return; }
    sh.life -= dt;
    var amt = sh.intensity * (sh.life / Math.max(0.001, sh.totalLife));
    sh.x = (Math.random() - 0.5) * amt;
    sh.y = (Math.random() - 0.5) * amt;
  }

  // -- HUD -------------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) {
      dom.hudLives.textContent = String(state.lives);
      var cell = dom.hudLives.parentNode;
      if (cell) {
        cell.classList.remove("is-warning", "is-danger");
        if (state.lives <= 1) cell.classList.add("is-danger");
        else if (state.lives <= 2) cell.classList.add("is-warning");
      }
    }
    if (dom.hudRound) dom.hudRound.textContent = String(state.round);
    if (dom.hudMult) {
      var mtext = state.multiplier.toFixed(state.multiplier === Math.floor(state.multiplier) ? 0 : 1) + "x";
      dom.hudMult.textContent = mtext;
      var mcell = dom.hudMult.parentNode;
      if (mcell) {
        mcell.classList.remove("is-mult");
        if (state.multiplier > 1) mcell.classList.add("is-mult");
      }
    }
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    setRibbon();
  }

  function formatNumber(n) {
    return Math.floor(n || 0).toLocaleString("en-US");
  }

  // -- Game over -------------------------------------------------------------
  function gameOver() {
    if (phase === "ended") return;
    sfx.gameOver();
    addShake(10, 0.6);
    phase = "ended";
    var prevBest = readBest();
    if (state.score > prevBest) writeBest(state.score);
    saveSnapshot();
    setTimeout(showEndScreen, 700);
  }

  function showEndScreen() {
    if (phase !== "ended") return;
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 250));
    if (shardsToAdd > 0) addShards(shardsToAdd, "echo-hall-run-end");
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "The hall fell silent" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Echo Hall · Round " + Math.max(1, state.round - 1) + " reached";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Round</div><div class="end-cell-value">' + state.bestRound + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Sequences Cleared</div><div class="end-cell-value">' + state.sequencesCleared + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Longest Sequence</div><div class="end-cell-value">' + state.maxSeqLength + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)" + (state.hardModeReached ? " · Hard mode reached" : "");
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.stopTracking(); MrMacsEndRecap.render(document.getElementById("endRecap")); } } catch (e) {}
    showScreen("end");
    stopMusic();
    // Record duration via profile recordPlay
    var duration = Math.floor((Date.now() - (state.startedAt || Date.now())));
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          gameId: GAME_ID,
          score: state.score,
          durationMs: duration,
          level: state.bestRound
        });
      }
    } catch (e) {}
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
  function addShards(n, reason) {
    if (n <= 0 || !state) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, reason || GAME_ID);
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          round: state.bestRound,
          sequences: state.sequencesCleared,
          maxSeq: state.maxSeqLength,
          hardMode: !!state.hardModeReached
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
          lives: state.lives,
          multiplier: state.multiplier,
          perfectStreak: state.perfectStreak,
          sequencesCleared: state.sequencesCleared,
          maxSeqLength: state.maxSeqLength,
          hardModeReached: !!state.hardModeReached,
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
          gameId: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/echo-hall/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("echo-hall:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("echo-hall:best", String(Math.floor(v)));
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
      // Power-up keys (1-3) — always active during play
      if ((phase === "playing-watch" || phase === "playing-repeat") && state) {
        if (k === "1" || k === "2" || k === "3") {
          var slot = parseInt(k, 10) - 1;
          activatePowerup(slot);
          e.preventDefault();
          return;
        }
      }
      if (phase === "playing-repeat" && state) {
        var padIdx = padIdxFromKey(k, state.padCount);
        if (padIdx >= 0) {
          tapPad(padIdx);
          e.preventDefault();
          return;
        }
      }
      if (k === "p" || k === "P") {
        if (phase === "playing-watch" || phase === "playing-repeat" || phase === "paused") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
      }
      if (k === "Escape" || k === "Esc") {
        if (phase === "playing-watch" || phase === "playing-repeat" || phase === "paused") togglePause();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
      }
    });
    bindClickTap();
    bindPowerupDock();
  }

  // 4-pad: A S K L (positions: top-left=A, top-right=S, bottom-left=K, bottom-right=L)
  // We use 4-pad layout with pads at top, right, bottom, left (clockwise from top: idx 0=top, 1=right, 2=bottom, 3=left)
  // Mapping from keyboard ergonomics: A = left side, S = bottom-left/inner, K = bottom-right, L = right
  // Easy interpretation: A=left, S=top, K=bottom, L=right (common Simon convention)
  // For 6-pad: A S D = left-half (top, mid, bottom); J K L = right-half — covering 6 pads clockwise top→right→down→down→left→up
  function padIdxFromKey(k, padCount) {
    if (!k) return -1;
    var key = k.toLowerCase();
    if (padCount === 4) {
      // pad indices clockwise from top: 0 top, 1 right, 2 bottom, 3 left
      if (key === "s") return 0;          // top
      if (key === "l") return 1;          // right
      if (key === "k") return 2;          // bottom
      if (key === "a") return 3;          // left
      // Arrow keys as fallback
      if (key === "arrowup") return 0;
      if (key === "arrowright") return 1;
      if (key === "arrowdown") return 2;
      if (key === "arrowleft") return 3;
      return -1;
    } else {
      // 6-pad: clockwise from top
      // 0 = top, 1 = upper-right, 2 = lower-right, 3 = bottom, 4 = lower-left, 5 = upper-left
      if (key === "s") return 0;          // top
      if (key === "d") return 1;          // upper-right
      if (key === "l") return 2;          // lower-right
      if (key === "k") return 3;          // bottom
      if (key === "j") return 4;          // lower-left
      if (key === "a") return 5;          // upper-left
      return -1;
    }
  }

  function bindClickTap() {
    function handle(eventX, eventY) {
      if (phase !== "playing-repeat" || !state) return;
      // Translate to logical coords
      var rect = canvas.getBoundingClientRect();
      var lx = (eventX - rect.left - offsetX) / scale;
      var ly = (eventY - rect.top - offsetY) / scale;
      var idx = padIdxAtPoint(lx, ly, state.padCount);
      if (idx >= 0) tapPad(idx);
    }
    canvas.addEventListener("click", function (e) {
      handle(e.clientX, e.clientY);
    });
    canvas.addEventListener("touchstart", function (e) {
      if (e.touches && e.touches.length === 1) {
        handle(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }
    }, { passive: false });
  }

  function bindPowerupDock() {
    if (!dom.powerupDock) return;
    var slots = dom.powerupDock.querySelectorAll(".powerup-slot");
    for (var i = 0; i < slots.length; i++) {
      (function (idx, slot) {
        slot.addEventListener("click", function () { activatePowerup(idx); });
      })(i, slots[i]);
    }
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing-watch" || phase === "playing-repeat" || phase === "playing-roundover") {
      prevPhase = phase;
      phase = "paused";
      pauseMusic();
      showScreen("pause");
      renderPauseProgress();
    } else if (phase === "paused") {
      phase = prevPhase || "playing-watch";
      prevPhase = null;
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
      else if (phase !== "setup" && phase !== "ended") startMusic();
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
      MrMacsDifficulty.register("echo-hall");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "echo-hall", { compact: false });
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
    initState({});
    state.startedAt = Date.now();
    showScreen(null);
    startMusic();
    updateHud();
    recordPlayWithProfile();
    renderPowerupDock();
    // Begin first round
    startRound();
  }

  function resumeRun(snap) {
    var s = (snap && snap.state) || (snap || {});
    initState({
      round: s.round || 1,
      score: s.score || 0,
      lives: s.lives != null ? s.lives : LIVES_INIT,
      multiplier: s.multiplier || 1,
      perfectStreak: s.perfectStreak || 0,
      sequencesCleared: s.sequencesCleared || 0,
      maxSeqLength: s.maxSeqLength || 0,
      hardModeReached: !!s.hardModeReached,
      best: readBest()
    });
    state.startedAt = Date.now();
    showScreen(null);
    startMusic();
    updateHud();
    recordPlayWithProfile();
    renderPowerupDock();
    startRound();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    var snapState = snap && (snap.state || snap);
    if (snapState && (snapState.score || snapState.round) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snapState.score || 0) +
        ' &middot; Round ' + (snapState.round || 1) +
        ' &middot; Lives ' + (snapState.lives != null ? snapState.lives : LIVES_INIT) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Echo Hall Scores</div>';
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

  // -- Color util ------------------------------------------------------------
  function hexToRgb(hex) {
    if (typeof hex !== "string") return [255, 255, 255];
    var h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mixHex(a, b, t) {
    var ra = hexToRgb(a), rb = hexToRgb(b);
    var r = Math.round(ra[0] + (rb[0] - ra[0]) * t);
    var g = Math.round(ra[1] + (rb[1] - ra[1]) * t);
    var bb = Math.round(ra[2] + (rb[2] - ra[2]) * t);
    return "rgb(" + r + "," + g + "," + bb + ")";
  }

  // -- Main loop -------------------------------------------------------------
  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    if (state) {
      state.time += dt;
      if (phase === "playing-watch" || phase === "playing-repeat") {
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
      }
    }
    if (phase === "playing-watch" && state && state.hitPause <= 0) {
      updateWatchPhase(dt);
    } else if (state && state.hitPause > 0) {
      state.hitPause -= dt;
    }
    if (state) {
      updateFlashes(dt);
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing-watch" || phase === "playing-repeat" || phase === "playing-roundover") {
      // Lightweight HUD refresh
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
    if (state && (phase === "playing-watch" || phase === "playing-repeat" || phase === "playing-roundover")) saveSnapshot();
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
      MrMacsHelpOverlay.register("echo-hall", {
        title: "How to Play Echo Hall",
        goal: "Watch the archive ring light up a sequence of discipline pads, then repeat it exactly — sequences grow by one each round.",
        controls: [
          { key: "A / S / K / L", action: "Tap pads 1-4 (normal mode)" },
          { key: "A / S / D / J / K / L", action: "Tap pads 1-6 (hard mode)" },
          { key: "Click / Tap pad", action: "Activate pad on screen" },
          { key: "1 / 2 / 3", action: "Use power-up" },
          { key: "Esc / P", action: "Pause or unpause" }
        ],
        tips: [
          "Every fifth round the sequence plays backwards — listen carefully before touching anything.",
          "Reach round 8 to unlock hard mode, which adds two more pads and may shuffle colors.",
          "Use the Slow Echo power-up when the sequence gets long to buy thinking time.",
          "Each pad has a unique tone; training your ear helps more than memorizing colors.",
          "A wrong tap costs a life — wait for the full sequence to finish before repeating."
        ],
        scholar: "Once per few rounds a Scholar Echo interrupts the sequence. Correctly tap the bonus prompt pad pattern to earn shards; the normal round resumes immediately after. Skip any time with no penalty."
      });
      var _helpContainer = document.querySelector("#setupScreen .setup-actions");
      if (_helpContainer) MrMacsHelpOverlay.mountButton(_helpContainer, "echo-hall");
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "echo-hall";
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
