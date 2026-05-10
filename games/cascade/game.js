/* ===========================================================================
   Cascade — bubble shooter with cluster pops + chain drops · Mr. Mac's Arcade
   Vanilla JS · Canvas · 720x800 logical · 6 colors · 5 power-ups · scholar
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "cascade";
  var GAME_TITLE = "Cascade";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 800;

  // Hex grid: 12 wide on even rows, 11 wide on odd (offset). Radius ~26.
  var BUBBLE_R = 26;
  var BUBBLE_D = BUBBLE_R * 2;
  var COL_STEP = BUBBLE_D;                         // 52
  var ROW_STEP = Math.round(BUBBLE_D * 0.866);     // ~45 (sqrt(3)/2)
  var COLS = 12;                                    // even rows
  var GRID_LEFT = 24;                               // padding
  var GRID_TOP = 64;                                // below ceiling line
  var INITIAL_ROWS = 7;
  var DEATH_LINE_Y = LOGICAL_H * 0.80;              // 640
  var LAUNCHER_X = LOGICAL_W / 2;
  var LAUNCHER_Y = LOGICAL_H - 60;

  // Physics
  var SHOT_SPEED = 700;        // px/sec
  var AIM_CONE_HALF = 78;      // degrees from straight up (so range is straight-up +/- 78)

  // Pressure
  var PRESSURE_TICK = 6;       // every 6 non-popping shots → drop a row
  var SLOW_TIME_DURATION = 12.0;
  var LASER_SIGHT_DURATION = 15.0;

  // Spawn
  var POWERUP_RATE = 0.05;      // 5% of newly generated launcher bubbles are powerups
  var SCHOLAR_INTERVAL = 30;    // every ~30 pops, plant a scholar in the cluster

  // Scoring
  var SCORE_PER_POP = 10;
  var SCORE_PER_DROP = 5;
  var SCHOLAR_BONUS = 1000;
  var COMBO_STEP = 0.2;
  var COMBO_MIN = 1.0;
  var COMBO_MAX = 2.0;
  var SHARDS_CAP = 200;

  // Bubble palette: 6 colors. Index → color.
  var COLORS = [
    { id: "gold",    main: "#f5c451", outline: "#bd8a1a", pitch: 880, label: "GOLD" },
    { id: "steel",   main: "#a0a8b8", outline: "#5a6478", pitch: 392, label: "STEEL" },
    { id: "crimson", main: "#d04848", outline: "#7a2424", pitch: 523, label: "CRIM" },
    { id: "indigo",  main: "#a991ff", outline: "#5a40a0", pitch: 659, label: "INDIGO" },
    { id: "cyan",    main: "#5de0f0", outline: "#1f7a8a", pitch: 988, label: "CYAN" },
    { id: "sage",    main: "#6dc18f", outline: "#2c6b48", pitch: 740, label: "SAGE" }
  ];

  var POWERUPS = {
    bomb:      { glyph: "💣", label: "BOMB", main: "#2a3040", glow: "#f08040" },
    rainbow:   { glyph: "🌈", label: "RAIN", main: "#fff",    glow: "#a991ff" },
    lightning: { glyph: "⚡", label: "LIGHT", main: "#fef080", glow: "#f5c451" },
    slow:      { glyph: "❄",  label: "SLOW", main: "#a8e8ff", glow: "#5de0f0" },
    laser:     { glyph: "🎯", label: "LASER", main: "#ffd0c4", glow: "#f07b6b" }
  };

  // -- Inline review bank (~28 entries) --------------------------------------
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
    { prompt: "Sputnik (1957) launched by the USSR triggered:", choices: ["The U.S. space race and NASA's founding", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The U.S. space race and NASA's founding" },
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

  var phase = "setup"; // setup | playing | question | paused | ended
  var prevPhase = null;
  var lastFrame = 0;
  var rafHandle = null;
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
    aimTick:  function () { sfxTone(540, 0.014, { type: "square", volume: 0.030 }); },
    shoot:    function () { sfxTone(440, 0.060, { type: "square", volume: 0.10, endFreq: 220 }); },
    wallBounce: function () { sfxTone(360, 0.018, { type: "triangle", volume: 0.05, endFreq: 280 }); },
    popColor: function (cIdx) {
      var c = COLORS[cIdx] || COLORS[0];
      sfxTone(c.pitch, 0.10, { type: "triangle", volume: 0.13, endFreq: c.pitch * 1.4 });
    },
    cascadeChain: function (n) {
      var notes = [523, 659, 784, 988, 1175, 1397, 1568];
      var k = Math.min(notes.length, Math.max(2, n));
      for (var i = 0; i < k; i++) {
        (function (idx) {
          setTimeout(function () { sfxTone(notes[idx], 0.13, { type: "triangle", volume: 0.13 }); }, idx * 60);
        })(i);
      }
    },
    bubbleDrop: function () { sfxTone(220, 0.18, { type: "sine", volume: 0.06, endFreq: 90 }); },
    powerup: function () {
      sfxTone(784, 0.12, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1175, 0.16, { type: "triangle", volume: 0.16 }); }, 80);
    },
    scholarPop: function () {
      [659, 988, 1397].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 80);
      });
    },
    ceilingDrop: function () {
      sfxNoise(0.18, { volume: 0.16, cutoff: 380 });
      sfxTone(140, 0.22, { type: "sawtooth", volume: 0.12, endFreq: 70 });
    },
    correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
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
    canvas = $("cascadeCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudPops = $("hudPops");
    dom.hudCombo = $("hudCombo");
    dom.hudBest = $("hudBest");
    dom.pressureName = $("pressureName");
    dom.pressureMeta = $("pressureMeta");
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
    dom.tcLeft = $("tcLeft");
    dom.tcRight = $("tcRight");
    dom.tcShoot = $("tcShoot");
    dom.tcSwap = $("tcSwap");
  }

  // -- Hex grid math ---------------------------------------------------------
  // Even rows have 12 cells, odd rows have 11 cells offset by half a column.
  function rowWidth(r) { return (r % 2 === 0) ? COLS : COLS - 1; }

  function cellCenter(r, c) {
    var xOff = (r % 2 === 0) ? 0 : COL_STEP / 2;
    var x = GRID_LEFT + BUBBLE_R + xOff + c * COL_STEP;
    var y = GRID_TOP + BUBBLE_R + r * ROW_STEP;
    return { x: x, y: y };
  }

  // Find the nearest valid cell to a given pixel (used at impact snap)
  function nearestCell(x, y) {
    var bestR = 0, bestC = 0, bestDist = Infinity;
    var maxR = state.grid.length;
    for (var r = 0; r < maxR; r++) {
      var w = rowWidth(r);
      for (var c = 0; c < w; c++) {
        var p = cellCenter(r, c);
        var dx = p.x - x, dy = p.y - y;
        var d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; bestR = r; bestC = c; }
      }
    }
    return { r: bestR, c: bestC };
  }

  // Six neighbors of cell (r,c). Even rows shift left, odd rows shift right.
  function neighbors(r, c) {
    var even = (r % 2 === 0);
    var off = even ? -1 : 0;
    var n = [
      { r: r,     c: c - 1 },
      { r: r,     c: c + 1 },
      { r: r - 1, c: c + off },
      { r: r - 1, c: c + off + 1 },
      { r: r + 1, c: c + off },
      { r: r + 1, c: c + off + 1 }
    ];
    var out = [];
    for (var i = 0; i < n.length; i++) {
      if (n[i].r < 0 || n[i].r >= state.grid.length) continue;
      if (n[i].c < 0 || n[i].c >= rowWidth(n[i].r)) continue;
      out.push(n[i]);
    }
    return out;
  }

  function getCell(r, c) {
    if (r < 0 || r >= state.grid.length) return null;
    var row = state.grid[r];
    if (!row) return null;
    if (c < 0 || c >= row.length) return null;
    return row[c];
  }
  function setCell(r, c, v) {
    if (r < 0 || c < 0) return;
    while (state.grid.length <= r) {
      var nr = state.grid.length;
      var w = rowWidth(nr);
      var nrow = new Array(w);
      for (var i = 0; i < w; i++) nrow[i] = null;
      state.grid.push(nrow);
    }
    if (c < state.grid[r].length) state.grid[r][c] = v;
  }

  // -- Bubble factory --------------------------------------------------------
  function newBubble(colorIdx, opts) {
    opts = opts || {};
    return {
      colorIdx: colorIdx,            // -1 means rainbow (any)
      powerup: opts.powerup || null, // bomb/rainbow/lightning/slow/laser/null
      scholar: !!opts.scholar,
      shimmer: 0,
      pop: 0,                         // 0..1 pop animation life
      popMax: 0,
      falling: false,
      fy: 0, fyVel: 0, fxVel: 0, frot: 0, frotVel: 0
    };
  }

  function randomColorIdx() { return Math.floor(Math.random() * COLORS.length); }

  // Pick a launcher feed bubble — sometimes powerup. Considers existing colors.
  function genLauncherBubble() {
    if (Math.random() < POWERUP_RATE) {
      var keys = ["bomb", "rainbow", "lightning", "slow", "laser"];
      var pick = keys[Math.floor(Math.random() * keys.length)];
      var idx = (pick === "rainbow") ? -1 : randomColorIdx();
      return newBubble(idx, { powerup: pick });
    }
    // Bias toward colors still in the cluster, so player can always make progress.
    var present = clusterColorSet();
    if (present.length > 0) {
      // 80% chance pick from present, else random
      if (Math.random() < 0.85) {
        return newBubble(present[Math.floor(Math.random() * present.length)]);
      }
    }
    return newBubble(randomColorIdx());
  }

  function clusterColorSet() {
    var set = {};
    for (var r = 0; r < state.grid.length; r++) {
      var row = state.grid[r];
      if (!row) continue;
      for (var c = 0; c < row.length; c++) {
        var b = row[c];
        if (b && b.colorIdx >= 0 && !b.powerup) set[b.colorIdx] = true;
      }
    }
    var arr = [];
    for (var k in set) if (set.hasOwnProperty(k)) arr.push(parseInt(k, 10));
    return arr;
  }

  // -- State init ------------------------------------------------------------
  function makeEmptyGrid() {
    var g = [];
    for (var r = 0; r < INITIAL_ROWS; r++) {
      var w = rowWidth(r);
      var row = new Array(w);
      for (var c = 0; c < w; c++) row[c] = null;
      g.push(row);
    }
    return g;
  }

  function populateInitialGrid(grid) {
    // Use ~5 colors so initial board has variety; keep rows near top.
    var palette = [];
    var pool = [0, 1, 2, 3, 4, 5];
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    palette = pool.slice(0, 5);
    for (var r = 0; r < INITIAL_ROWS; r++) {
      var w = rowWidth(r);
      for (var c = 0; c < w; c++) {
        // Avoid creating an instant cluster of 3 same-color in a row (visual)
        var idx = palette[Math.floor(Math.random() * palette.length)];
        // light de-clump: if both prior siblings same color, pick another
        if (c >= 2 && grid[r][c - 1] && grid[r][c - 2] &&
            grid[r][c - 1].colorIdx === idx && grid[r][c - 2].colorIdx === idx) {
          idx = palette[(palette.indexOf(idx) + 1) % palette.length];
        }
        grid[r][c] = newBubble(idx);
      }
    }
  }

  function initState(opts) {
    opts = opts || {};
    state = {
      grid: makeEmptyGrid(),
      // Launcher feed
      current: null,
      next: null,
      // Aim
      aimAngle: -Math.PI / 2, // straight up
      // Active shot
      shot: null,
      // Falling bubbles (animated)
      falling: [],
      // Particles
      particles: [],
      // Cascade-ripple delayed pops
      pendingPops: [],
      // Effects
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      // Powerup state
      slowTime: 0,        // remaining seconds
      laserTime: 0,
      // Pressure
      shotsSinceLastPop: 0,
      pressureLast: 0,    // time since last drop (display)
      // Stats
      score: opts.score || 0,
      popsTotal: opts.popsTotal || 0,
      combo: 1.0,
      maxChain: 0,
      maxCascade: 0,
      shotsTotal: 0,
      lifetimeRows: 0,
      // Scholar
      popsUntilScholar: SCHOLAR_INTERVAL,
      // Combo flash overlays
      tetrisFlash: 0,
      cascadeFlash: 0,
      // Stats / awards
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      // Persisted best
      best: opts.best || readBest(),
      time: 0,
      // Death-line warning fade
      deathPulse: 0,
      // End reason
      endReason: ""
    };
    populateInitialGrid(state.grid);
    state.current = genLauncherBubble();
    state.next = genLauncherBubble();
    // Mark a starter scholar in a few rounds — first one only after first pop wave.
  }

  // -- Cluster / disconnected logic -----------------------------------------
  // Find connected same-color cluster from (r,c) (treat rainbow bubbles as wildcards joining).
  function findColorCluster(r, c) {
    var origin = getCell(r, c);
    if (!origin) return [];
    var targetColor = origin.colorIdx;
    var visited = {};
    var queue = [{ r: r, c: c }];
    var out = [];
    var key = function (rr, cc) { return rr + "," + cc; };
    visited[key(r, c)] = true;
    while (queue.length) {
      var cur = queue.shift();
      var b = getCell(cur.r, cur.c);
      if (!b) continue;
      // Match: same colorIdx, OR (origin is rainbow AND any color), OR (b is rainbow AND we have any color).
      var matches = false;
      if (targetColor === -1) {
        // Origin rainbow: spread to whatever we touch initially (uses first non-rainbow neighbor color as anchor).
        if (b.colorIdx !== -1) {
          targetColor = b.colorIdx; // anchor on first real color
          matches = true;
        } else if (b.powerup) {
          matches = false;
        } else {
          matches = true; // both rainbow, keep spreading
        }
      } else {
        if (b.colorIdx === targetColor) matches = true;
        // rainbow bubbles join any cluster
        else if (b.colorIdx === -1 && !b.powerup) matches = true;
      }
      if (!matches) continue;
      out.push(cur);
      var ns = neighbors(cur.r, cur.c);
      for (var i = 0; i < ns.length; i++) {
        var k = key(ns[i].r, ns[i].c);
        if (!visited[k]) {
          visited[k] = true;
          queue.push(ns[i]);
        }
      }
    }
    return out;
  }

  // Find all bubbles connected to row 0 (the ceiling). Anything else is disconnected.
  function findCeilingConnected() {
    var visited = {};
    var queue = [];
    var key = function (rr, cc) { return rr + "," + cc; };
    var w0 = rowWidth(0);
    for (var c = 0; c < w0; c++) {
      if (state.grid[0] && state.grid[0][c]) {
        queue.push({ r: 0, c: c });
        visited[key(0, c)] = true;
      }
    }
    var out = [];
    while (queue.length) {
      var cur = queue.shift();
      var b = getCell(cur.r, cur.c);
      if (!b) continue;
      out.push(cur);
      var ns = neighbors(cur.r, cur.c);
      for (var i = 0; i < ns.length; i++) {
        var k = key(ns[i].r, ns[i].c);
        if (!visited[k] && getCell(ns[i].r, ns[i].c)) {
          visited[k] = true;
          queue.push(ns[i]);
        }
      }
    }
    return { set: visited, list: out };
  }

  // -- Shoot mechanic --------------------------------------------------------
  function fireShot() {
    if (state.shot) return; // one shot in flight
    if (!state.current) return;
    var angle = state.aimAngle;
    var b = state.current;
    state.shot = {
      x: LAUNCHER_X,
      y: LAUNCHER_Y - BUBBLE_R - 4,
      vx: Math.cos(angle) * SHOT_SPEED,
      vy: Math.sin(angle) * SHOT_SPEED,
      bubble: b,
      bouncesLeft: 12 // safety, walls only
    };
    state.current = state.next;
    state.next = genLauncherBubble();
    state.shotsTotal++;
    sfx.shoot();
  }

  function swapLauncher() {
    if (!state.current || !state.next) return;
    var t = state.current;
    state.current = state.next;
    state.next = t;
    sfx.aimTick();
  }

  // Step the in-flight shot. dt in seconds.
  function updateShot(dt) {
    if (!state.shot) return;
    var s = state.shot;
    var stepX = s.vx * dt;
    var stepY = s.vy * dt;
    // We move in small increments to avoid tunneling.
    var dist = Math.hypot(stepX, stepY);
    var steps = Math.max(1, Math.ceil(dist / (BUBBLE_R * 0.6)));
    for (var i = 0; i < steps; i++) {
      s.x += stepX / steps;
      s.y += stepY / steps;
      // Wall bounces
      if (s.x < BUBBLE_R) {
        s.x = BUBBLE_R;
        s.vx = Math.abs(s.vx);
        sfx.wallBounce();
      } else if (s.x > LOGICAL_W - BUBBLE_R) {
        s.x = LOGICAL_W - BUBBLE_R;
        s.vx = -Math.abs(s.vx);
        sfx.wallBounce();
      }
      // Ceiling stick
      if (s.y - BUBBLE_R <= GRID_TOP) {
        snapShotToGrid(s, /*hitCeiling=*/true);
        return;
      }
      // Collision with any cluster bubble
      var hit = collideShotWithCluster(s);
      if (hit) {
        snapShotToGrid(s, false);
        return;
      }
      // Off bottom (rare): drop the shot harmlessly.
      if (s.y > LOGICAL_H + BUBBLE_R * 2) {
        state.shot = null;
        return;
      }
    }
  }

  function collideShotWithCluster(s) {
    // Search candidate cells around shot's position.
    var maxR = state.grid.length;
    for (var r = 0; r < maxR; r++) {
      var w = rowWidth(r);
      for (var c = 0; c < w; c++) {
        var b = state.grid[r][c];
        if (!b) continue;
        var p = cellCenter(r, c);
        var dx = p.x - s.x, dy = p.y - s.y;
        if (dx * dx + dy * dy < (BUBBLE_D - 2) * (BUBBLE_D - 2)) {
          return { r: r, c: c };
        }
      }
    }
    return null;
  }

  function snapShotToGrid(s, hitCeiling) {
    // Find nearest empty cell. Try candidates: nearestCell, plus neighbors.
    var nc = nearestCell(s.x, s.y);
    var candidates = [{ r: nc.r, c: nc.c }];
    var ns = neighbors(nc.r, nc.c);
    for (var i = 0; i < ns.length; i++) candidates.push(ns[i]);
    // Also include "expand grid down" cells in case shot ended below current rows
    var nextRow = state.grid.length;
    for (var ec = 0; ec < rowWidth(nextRow); ec++) candidates.push({ r: nextRow, c: ec });

    var best = null, bestDist = Infinity;
    for (var k = 0; k < candidates.length; k++) {
      var rr = candidates[k].r, cc = candidates[k].c;
      if (rr < 0) continue;
      // ensure grid row exists for measurement
      while (state.grid.length <= rr) {
        var w = rowWidth(state.grid.length);
        var newRow = new Array(w);
        for (var z = 0; z < w; z++) newRow[z] = null;
        state.grid.push(newRow);
      }
      if (cc < 0 || cc >= rowWidth(rr)) continue;
      if (state.grid[rr][cc]) continue;
      var p = cellCenter(rr, cc);
      var dx = p.x - s.x, dy = p.y - s.y;
      var d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = { r: rr, c: cc }; }
    }
    if (!best) {
      // No valid cell (shouldn't happen often) — drop the shot.
      state.shot = null;
      return;
    }
    var bub = s.bubble;
    setCell(best.r, best.c, bub);
    state.shot = null;

    // Apply powerup effects on stick
    if (bub.powerup === "bomb") {
      doBomb(best.r, best.c);
      cleanupAfterBoardChange();
      onShotResolved(true);
      return;
    } else if (bub.powerup === "lightning") {
      doLightning(best.r, best.c);
      cleanupAfterBoardChange();
      onShotResolved(true);
      return;
    } else if (bub.powerup === "slow") {
      bub.powerup = null; // consumed on stick
      state.slowTime = Math.max(state.slowTime, SLOW_TIME_DURATION);
      sfx.powerup();
      pushPopup("SLOW · 12s", LAUNCHER_X, LAUNCHER_Y - 80, "is-bonus");
      // resolves like a normal shot — still attempts color match below
    } else if (bub.powerup === "laser") {
      bub.powerup = null;
      state.laserTime = Math.max(state.laserTime, LASER_SIGHT_DURATION);
      sfx.powerup();
      pushPopup("LASER · 15s", LAUNCHER_X, LAUNCHER_Y - 80, "is-bonus");
    } else if (bub.powerup === "rainbow") {
      // Rainbow joins whatever color it touches (cluster pass below treats colorIdx === -1 as wildcard).
      bub.powerup = null;
    }

    // Try color cluster match
    var cluster = findColorCluster(best.r, best.c);
    if (cluster.length >= 3) {
      handleClusterPop(cluster, best);
      cleanupAfterBoardChange();
      onShotResolved(true);
    } else {
      sfx.popColor(0); // soft non-pop tick (shoot already played)
      onShotResolved(false);
    }
  }

  function onShotResolved(popped) {
    if (popped) {
      state.shotsSinceLastPop = 0;
      // bump combo
      state.combo = Math.min(COMBO_MAX, state.combo + COMBO_STEP);
    } else {
      state.shotsSinceLastPop++;
      // reset combo
      state.combo = COMBO_MIN;
      if (state.shotsSinceLastPop >= PRESSURE_TICK && state.slowTime <= 0) {
        // Push the cluster down by one row.
        pressureRowDrop();
      }
    }
    // Schedule a scholar planting if quota met
    if (state.popsUntilScholar <= 0) {
      plantScholarInCluster();
      state.popsUntilScholar = SCHOLAR_INTERVAL;
    }
    // Game-over check: any bubble crossing the death line?
    if (anyBubbleBelowDeathLine()) {
      state.endReason = "Cluster crossed the death line";
      gameOver();
      return;
    }
    saveSnapshot();
    updateHud();
  }

  function pressureRowDrop() {
    state.shotsSinceLastPop = 0;
    state.lifetimeRows++;
    sfx.ceilingDrop();
    addShake(6, 0.32);
    // Insert an empty row at top and shift everything down by 1
    // Strategy: prepend a new empty row sized for row 0, but since we offset
    // rows alternately we need to insert and re-index.
    var newGrid = [];
    var newTopRow = new Array(rowWidth(0));
    for (var c = 0; c < newTopRow.length; c++) newTopRow[c] = null;
    newGrid.push(newTopRow);
    // Shift existing rows down. They keep their own row-width pattern (which depends on parity).
    // Because parity pattern is even/odd/even/odd..., when we shift by 1, an old "even" row
    // becomes a new "odd" row and vice versa. The widths must adjust: take the bubble data
    // from prior row and re-fit into new width. Use rebucketing: drop last column if
    // shrinking, or append null if widening.
    for (var r = 0; r < state.grid.length; r++) {
      var oldRow = state.grid[r];
      var newR = r + 1;
      var newW = rowWidth(newR);
      var nrow = new Array(newW);
      for (var i = 0; i < newW; i++) nrow[i] = null;
      var copyW = Math.min(oldRow.length, newW);
      for (var k = 0; k < copyW; k++) nrow[k] = oldRow[k];
      newGrid.push(nrow);
    }
    state.grid = newGrid;
    // Populate new top row with random colors (a fresh wave of pressure)
    var palette = clusterColorSet();
    if (palette.length === 0) palette = [0, 1, 2, 3, 4, 5];
    for (var nc = 0; nc < newTopRow.length; nc++) {
      newGrid[0][nc] = newBubble(palette[Math.floor(Math.random() * palette.length)]);
    }
    pushPopup("CEILING · DROP", LAUNCHER_X, GRID_TOP + 20, "is-bonus");
  }

  function anyBubbleBelowDeathLine() {
    for (var r = 0; r < state.grid.length; r++) {
      var row = state.grid[r];
      if (!row) continue;
      for (var c = 0; c < row.length; c++) {
        if (row[c]) {
          var p = cellCenter(r, c);
          if (p.y + BUBBLE_R > DEATH_LINE_Y) return true;
        }
      }
    }
    return false;
  }

  // -- Pop / cascade handling ------------------------------------------------
  function handleClusterPop(cluster, origin) {
    // Score from cluster pop
    var size = cluster.length;
    var era = colorOfCell(origin) || 0;
    var basePts = size * SCORE_PER_POP;
    var pts = Math.round(basePts * state.combo);
    state.score += pts;
    state.popsTotal += size;
    state.popsUntilScholar = Math.max(0, state.popsUntilScholar - size);
    state.maxCascade = Math.max(state.maxCascade, size);

    // Cascade-ripple animation: start delayed pops in BFS order from origin.
    sfx.popColor(era);
    queueCascadeRipple(cluster, origin);

    // Determine if any popped bubble was the scholar. Save flag for after ripple completes.
    var scholarPopped = false;
    var rainbowInCluster = false;
    for (var i = 0; i < cluster.length; i++) {
      var b = getCell(cluster[i].r, cluster[i].c);
      if (b && b.scholar) scholarPopped = true;
      if (b && (b.colorIdx === -1 || b.powerup === "rainbow")) rainbowInCluster = true;
    }
    if (rainbowInCluster) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("cascade", "cascade-rainbow"); } catch (e) {}
    }
    // Final-row pressure: any bubble within ~1 bubble height of death line at time of pop
    var atPressure = false;
    for (var pr = 0; pr < state.grid.length && !atPressure; pr++) {
      var prow = state.grid[pr];
      if (!prow) continue;
      for (var pc = 0; pc < prow.length; pc++) {
        if (prow[pc]) {
          var pp = cellCenter(pr, pc);
          if (pp.y + BUBBLE_R > DEATH_LINE_Y - BUBBLE_D) { atPressure = true; break; }
        }
      }
    }
    if (atPressure) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("cascade", "cascade-pressure-zero"); } catch (e) {}
    }
    // Remove bubbles from the grid immediately (visual handled by particles).
    for (var k = 0; k < cluster.length; k++) {
      setCell(cluster[k].r, cluster[k].c, null);
      var p = cellCenter(cluster[k].r, cluster[k].c);
      burstAt(p.x, p.y, COLORS[era].main);
    }

    // Floating callouts
    if (size >= 5) {
      var label = "CASCADE!";
      if (size >= 8) label = "CASCADE x" + size + "!";
      pushPopup(label, LOGICAL_W / 2, GRID_TOP + 50, "is-tetris");
      state.cascadeFlash = 1;
    }
    pushPopup("+" + pts, LOGICAL_W / 2, GRID_TOP + 80, "is-score");

    // Drop disconnected bubbles
    var ce = findCeilingConnected();
    var droppers = [];
    for (var rr = 0; rr < state.grid.length; rr++) {
      var row = state.grid[rr];
      if (!row) continue;
      for (var cc = 0; cc < row.length; cc++) {
        if (!row[cc]) continue;
        if (!ce.set[rr + "," + cc]) {
          droppers.push({ r: rr, c: cc, b: row[cc] });
          row[cc] = null;
        }
      }
    }
    if (droppers.length > 0) {
      for (var d = 0; d < droppers.length; d++) {
        var dp = cellCenter(droppers[d].r, droppers[d].c);
        startFalling(droppers[d].b, dp.x, dp.y);
      }
      var chainPts = droppers.length * SCORE_PER_DROP;
      var chainBonus = Math.round(chainPts * state.combo);
      state.score += chainBonus;
      state.popsTotal += droppers.length;
      state.maxChain = Math.max(state.maxChain, droppers.length);
      sfx.cascadeChain(droppers.length);
      sfx.bubbleDrop();
      var chainLabel = (droppers.length >= 12) ? "ARCHIVE PURGE!" : (droppers.length >= 5 ? "CHAIN!" : "");
      if (chainLabel) pushPopup(chainLabel + " x" + droppers.length, LOGICAL_W / 2, GRID_TOP + 110, "is-legend");
    }

    // Scholar consequences
    if (scholarPopped) {
      state.pendingScholarPrompt = true;
    }

    addShake(size >= 5 ? 5 : 2.5, 0.25);
  }

  function colorOfCell(cell) {
    var b = state.grid[cell.r] && state.grid[cell.r][cell.c];
    if (!b || b.colorIdx < 0) return 0;
    return b.colorIdx;
  }

  function queueCascadeRipple(cluster, origin) {
    if (reducedMotion) return; // skip wave
    // Sort by manhattan-ish distance from origin so ripple looks correct.
    var sorted = cluster.slice().sort(function (a, b) {
      var da = Math.abs(a.r - origin.r) + Math.abs(a.c - origin.c);
      var db = Math.abs(b.r - origin.r) + Math.abs(b.c - origin.c);
      return da - db;
    });
    for (var i = 0; i < sorted.length; i++) {
      var p = cellCenter(sorted[i].r, sorted[i].c);
      state.particles.push({
        kind: "ripple",
        x: p.x, y: p.y,
        life: 0.30,
        totalLife: 0.30,
        startDelay: i * 0.04,
        radius: 4,
        color: "rgba(255,255,255,0.9)"
      });
    }
  }

  function startFalling(b, x, y) {
    b.falling = true;
    b.fy = y;
    b.fyVel = 0;
    b.fxVel = (Math.random() - 0.5) * 80;
    b.frot = 0;
    b.frotVel = (Math.random() - 0.5) * 4;
    b.fx = x;
    state.falling.push(b);
  }

  function cleanupAfterBoardChange() {
    // Trim trailing empty rows beyond INITIAL_ROWS so cluster doesn't grow indefinitely.
    while (state.grid.length > INITIAL_ROWS) {
      var last = state.grid[state.grid.length - 1];
      var any = false;
      for (var i = 0; i < last.length; i++) if (last[i]) { any = true; break; }
      if (!any) state.grid.pop();
      else break;
    }
  }

  // -- Powerups --------------------------------------------------------------
  function doBomb(r, c) {
    sfx.powerup();
    var center = cellCenter(r, c);
    var popped = [];
    var radius = BUBBLE_D * 2.5;
    for (var rr = 0; rr < state.grid.length; rr++) {
      var row = state.grid[rr];
      if (!row) continue;
      for (var cc = 0; cc < row.length; cc++) {
        var b = row[cc];
        if (!b) continue;
        var p = cellCenter(rr, cc);
        var dx = p.x - center.x, dy = p.y - center.y;
        if (dx * dx + dy * dy <= radius * radius) {
          popped.push({ r: rr, c: cc });
          burstAt(p.x, p.y, "#f08040");
        }
      }
    }
    if (popped.length === 0) return;
    state.popsTotal += popped.length;
    state.popsUntilScholar = Math.max(0, state.popsUntilScholar - popped.length);
    var pts = Math.round(popped.length * SCORE_PER_POP * 1.5 * state.combo);
    state.score += pts;
    pushPopup("BOMB +" + pts, center.x, center.y, "is-tetris");
    state.combo = Math.min(COMBO_MAX, state.combo + COMBO_STEP);
    var scholarHit = false;
    for (var i = 0; i < popped.length; i++) {
      var b2 = getCell(popped[i].r, popped[i].c);
      if (b2 && b2.scholar) scholarHit = true;
      setCell(popped[i].r, popped[i].c, null);
    }
    addShake(8, 0.4);
    // Drop disconnected
    cascadeDropDisconnected();
    if (scholarHit) state.pendingScholarPrompt = true;
  }

  function doLightning(r, c) {
    sfx.powerup();
    // Find the dominant color among the 6 neighbors of stick spot, fall back to random present.
    var nlist = neighbors(r, c);
    var counts = {};
    for (var i = 0; i < nlist.length; i++) {
      var b = getCell(nlist[i].r, nlist[i].c);
      if (b && b.colorIdx >= 0 && !b.powerup) counts[b.colorIdx] = (counts[b.colorIdx] || 0) + 1;
    }
    var pickIdx = null, pickN = 0;
    for (var k in counts) if (counts.hasOwnProperty(k)) {
      if (counts[k] > pickN) { pickN = counts[k]; pickIdx = parseInt(k, 10); }
    }
    if (pickIdx == null) {
      var present = clusterColorSet();
      if (present.length === 0) {
        setCell(r, c, null);
        return;
      }
      pickIdx = present[Math.floor(Math.random() * present.length)];
    }
    // Pop everything of that color in the cluster.
    var popped = [];
    for (var rr = 0; rr < state.grid.length; rr++) {
      var row = state.grid[rr];
      if (!row) continue;
      for (var cc = 0; cc < row.length; cc++) {
        var b2 = row[cc];
        if (!b2) continue;
        if (b2.colorIdx === pickIdx || b2.colorIdx === -1) {
          popped.push({ r: rr, c: cc });
        }
      }
    }
    // Also remove the lightning bubble itself.
    setCell(r, c, null);
    if (popped.length === 0) return;
    var pts = Math.round(popped.length * SCORE_PER_POP * 1.6 * state.combo);
    state.score += pts;
    state.popsTotal += popped.length;
    state.popsUntilScholar = Math.max(0, state.popsUntilScholar - popped.length);
    state.combo = Math.min(COMBO_MAX, state.combo + COMBO_STEP);
    pushPopup("PURGE · " + (COLORS[pickIdx].label) + "!", LOGICAL_W / 2, GRID_TOP + 50, "is-legend");
    var scholarHit = false;
    for (var p2 = 0; p2 < popped.length; p2++) {
      var bb = getCell(popped[p2].r, popped[p2].c);
      if (bb && bb.scholar) scholarHit = true;
      setCell(popped[p2].r, popped[p2].c, null);
      var pp = cellCenter(popped[p2].r, popped[p2].c);
      burstAt(pp.x, pp.y, COLORS[pickIdx].main);
    }
    addShake(6, 0.32);
    cascadeDropDisconnected();
    if (scholarHit) state.pendingScholarPrompt = true;
  }

  function cascadeDropDisconnected() {
    var ce = findCeilingConnected();
    var dropped = [];
    for (var rr = 0; rr < state.grid.length; rr++) {
      var row = state.grid[rr];
      if (!row) continue;
      for (var cc = 0; cc < row.length; cc++) {
        if (!row[cc]) continue;
        if (!ce.set[rr + "," + cc]) {
          var dp = cellCenter(rr, cc);
          startFalling(row[cc], dp.x, dp.y);
          dropped.push(row[cc]);
          row[cc] = null;
        }
      }
    }
    if (dropped.length > 0) {
      var pts = Math.round(dropped.length * SCORE_PER_DROP * state.combo);
      state.score += pts;
      state.popsTotal += dropped.length;
      sfx.bubbleDrop();
      sfx.cascadeChain(dropped.length);
      if (dropped.length >= 5) {
        pushPopup((dropped.length >= 12 ? "ARCHIVE PURGE! x" : "CHAIN! x") + dropped.length, LOGICAL_W / 2, GRID_TOP + 110, "is-legend");
      }
    }
  }

  // -- Scholar planting ------------------------------------------------------
  function plantScholarInCluster() {
    // Find a random non-scholar non-powerup bubble and mark it scholar.
    var candidates = [];
    for (var rr = 0; rr < state.grid.length; rr++) {
      var row = state.grid[rr];
      if (!row) continue;
      for (var cc = 0; cc < row.length; cc++) {
        var b = row[cc];
        if (b && !b.scholar && !b.powerup && b.colorIdx >= 0) candidates.push(b);
      }
    }
    if (candidates.length === 0) return;
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    pick.scholar = true;
  }

  // -- Update loop -----------------------------------------------------------
  function updateGame(dt) {
    if (!state) return;
    state.time += dt;

    // Update slow/laser timers (slow only ticks if it was active; pressure tick is paused)
    if (state.slowTime > 0) state.slowTime = Math.max(0, state.slowTime - dt);
    if (state.laserTime > 0) state.laserTime = Math.max(0, state.laserTime - dt);

    // Update active shot
    updateShot(dt);

    // Update falling bubbles
    var aliveFall = [];
    for (var i = 0; i < state.falling.length; i++) {
      var f = state.falling[i];
      f.fyVel += 1100 * dt;
      f.fy += f.fyVel * dt;
      f.fx += f.fxVel * dt;
      f.frot += f.frotVel * dt;
      if (f.fy < LOGICAL_H + BUBBLE_R * 2) aliveFall.push(f);
    }
    state.falling = aliveFall;

    // Particles
    var aliveP = [];
    for (var pi = 0; pi < state.particles.length; pi++) {
      var p = state.particles[pi];
      if (p.startDelay && p.startDelay > 0) {
        p.startDelay -= dt;
        aliveP.push(p);
        continue;
      }
      p.life -= dt;
      if (p.kind === "ripple") {
        p.radius += dt * 90;
        if (p.life > 0) aliveP.push(p);
      } else {
        p.x += (p.vx || 0) * dt;
        p.y += (p.vy || 0) * dt;
        if (p.vx) p.vx *= 0.92;
        if (p.vy) {
          p.vy *= 0.92;
          p.vy += 80 * dt; // gentle gravity
        }
        if (p.life > 0) aliveP.push(p);
      }
    }
    state.particles = aliveP;

    // Cascade flash
    if (state.cascadeFlash > 0) state.cascadeFlash = Math.max(0, state.cascadeFlash - dt * 1.6);

    // Death-line pulse
    state.deathPulse = (state.deathPulse + dt) % 1.4;

    // Shake
    if (state.shake.life > 0) {
      state.shake.life -= dt;
      var k2 = Math.max(0, state.shake.life / Math.max(0.01, state.shake.totalLife));
      var inten = state.shake.intensity * k2;
      state.shake.x = (Math.random() - 0.5) * inten * 2;
      state.shake.y = (Math.random() - 0.5) * inten * 2;
    } else {
      state.shake.x = 0; state.shake.y = 0;
    }

    // Open scholar modal if pending and shot has resolved
    if (state.pendingScholarPrompt && !state.shot && state.particles.filter(function (p) { return p.kind === "ripple" && p.startDelay <= 0; }).length === 0) {
      state.pendingScholarPrompt = false;
      openScholarQuestion();
    }

    // Periodic shimmer tick
    for (var rr = 0; rr < state.grid.length; rr++) {
      var row = state.grid[rr];
      if (!row) continue;
      for (var cc = 0; cc < row.length; cc++) {
        var b = row[cc];
        if (b && b.scholar) b.shimmer = (b.shimmer || 0) + dt;
      }
    }
    if (state.current && state.current.scholar) state.current.shimmer = (state.current.shimmer || 0) + dt;

    // Aim continuous adjustment via held keys
    tickAimHeld(dt);

    updateHud();
  }

  // -- Particles / shake / popups -------------------------------------------
  function burstAt(x, y, color) {
    if (reducedMotion) {
      // single subtle particle
      state.particles.push({ kind: "spark", x: x, y: y, vx: 0, vy: -20, life: 0.18, totalLife: 0.18, color: color, size: 2 });
      return;
    }
    var n = 8;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 80 + Math.random() * 240;
      state.particles.push({
        kind: "spark",
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.5 + Math.random() * 0.4,
        totalLife: 0.7,
        color: color,
        size: 1.6 + Math.random() * 2.6
      });
    }
  }

  function pushPopup(text, x, y, klass) {
    if (!dom.popupOverlay) return;
    var el = document.createElement("div");
    el.className = "popup-text " + (klass || "");
    el.textContent = text;
    var cx = offsetX + x * scale;
    var cy = offsetY + y * scale;
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1200);
  }

  function addShake(intensity, life) {
    if (reducedMotion) return;
    var s = state.shake;
    s.intensity = Math.max(s.intensity, intensity);
    s.life = Math.max(s.life, life);
    s.totalLife = Math.max(s.totalLife, life);
  }

  // -- Aim handling ----------------------------------------------------------
  // Aim angle is measured in radians from +x axis. -PI/2 = straight up.
  // Allow the cone (up +/- 78°) so player can slice into walls.
  function clampAim(angle) {
    var minA = -Math.PI / 2 - (AIM_CONE_HALF * Math.PI / 180);
    var maxA = -Math.PI / 2 + (AIM_CONE_HALF * Math.PI / 180);
    if (angle < minA) return minA;
    if (angle > maxA) return maxA;
    return angle;
  }

  // Compute aim trajectory points for the dashed guide (max bounces limited).
  function computeAimPath(maxBounces) {
    var path = [{ x: LAUNCHER_X, y: LAUNCHER_Y - BUBBLE_R - 4 }];
    var x = LAUNCHER_X;
    var y = LAUNCHER_Y - BUBBLE_R - 4;
    var vx = Math.cos(state.aimAngle);
    var vy = Math.sin(state.aimAngle);
    var bounces = 0;
    for (var step = 0; step < 1500; step++) {
      x += vx * 6;
      y += vy * 6;
      // wall bounce
      if (x < BUBBLE_R) { x = BUBBLE_R; vx = -vx; bounces++; path.push({ x: x, y: y }); if (bounces > maxBounces) break; }
      else if (x > LOGICAL_W - BUBBLE_R) { x = LOGICAL_W - BUBBLE_R; vx = -vx; bounces++; path.push({ x: x, y: y }); if (bounces > maxBounces) break; }
      // ceiling
      if (y - BUBBLE_R <= GRID_TOP) { path.push({ x: x, y: y }); break; }
      // hit any cluster bubble? stop
      var hit = false;
      for (var rr = 0; rr < state.grid.length && !hit; rr++) {
        var row = state.grid[rr];
        if (!row) continue;
        for (var cc = 0; cc < row.length; cc++) {
          var b = row[cc];
          if (!b) continue;
          var p = cellCenter(rr, cc);
          var dx = p.x - x, dy = p.y - y;
          if (dx * dx + dy * dy < (BUBBLE_D - 4) * (BUBBLE_D - 4)) { hit = true; break; }
        }
      }
      if (hit) { path.push({ x: x, y: y }); break; }
      if (y > LOGICAL_H + 80) break;
    }
    return path;
  }

  // -- Rendering -------------------------------------------------------------
  function clearCanvas() {
    ctx.save();
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.restore();
  }

  function drawBackground() {
    var grd = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H * 0.3, 60, LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W);
    grd.addColorStop(0, "rgba(20, 30, 60, 0.55)");
    grd.addColorStop(0.55, "rgba(8, 10, 22, 0.5)");
    grd.addColorStop(1, "rgba(2, 4, 12, 0.95)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Cascade flash
    if (state.cascadeFlash > 0) {
      ctx.fillStyle = "rgba(245, 196, 81, " + (state.cascadeFlash * 0.18).toFixed(3) + ")";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }
  }

  function drawHexOverlay() {
    // Faint grid overlay showing valid cells in the active grid range.
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    var maxR = Math.max(state.grid.length, INITIAL_ROWS) + 2;
    for (var r = 0; r < maxR; r++) {
      var w = rowWidth(r);
      for (var c = 0; c < w; c++) {
        var p = cellCenter(r, c);
        if (p.y - BUBBLE_R > DEATH_LINE_Y + BUBBLE_R) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, BUBBLE_R - 1, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawDeathLine() {
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    var pulse = reducedMotion ? 0.55 : 0.4 + 0.4 * Math.abs(Math.sin(state.deathPulse / 1.4 * Math.PI * 2));
    ctx.strokeStyle = "rgba(240, 72, 96, " + pulse.toFixed(3) + ")";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(0, DEATH_LINE_Y);
    ctx.lineTo(LOGICAL_W, DEATH_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Faint label
    ctx.fillStyle = "rgba(240, 72, 96, " + (pulse * 0.85).toFixed(3) + ")";
    ctx.font = "700 9px 'JetBrains Mono', monospace";
    ctx.textBaseline = "middle";
    ctx.fillText("DEATH LINE", 12, DEATH_LINE_Y - 9);
    ctx.restore();
  }

  function drawClusterBubbles() {
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    // Death-line proximity tint: bubbles within ~2 rows of DEATH_LINE redden.
    var warnY = DEATH_LINE_Y - ROW_STEP * 2.5;
    for (var r = 0; r < state.grid.length; r++) {
      var row = state.grid[r];
      if (!row) continue;
      for (var c = 0; c < row.length; c++) {
        var b = row[c];
        if (!b) continue;
        var p = cellCenter(r, c);
        var redTint = 0;
        if (p.y > warnY) {
          redTint = Math.min(1, (p.y - warnY) / (DEATH_LINE_Y - warnY)) * 0.55;
        }
        drawBubble(p.x, p.y, b, { redTint: redTint });
      }
    }
    ctx.restore();
  }

  // Draw a bubble. opts.redTint 0..1; opts.previewScale; opts.shotShadow
  function drawBubble(x, y, b, opts) {
    opts = opts || {};
    var r = BUBBLE_R * (opts.previewScale || 1);
    var color = "#888";
    var outline = "#222";
    if (b.powerup) {
      var pdef = POWERUPS[b.powerup];
      color = pdef.main;
      outline = pdef.glow;
    } else if (b.colorIdx === -1) {
      // rainbow cycling
      var t = (state.time * 1.4) % 1;
      var idx = Math.floor(t * COLORS.length);
      color = COLORS[idx].main;
      outline = COLORS[(idx + 2) % COLORS.length].main;
    } else {
      var c = COLORS[b.colorIdx] || COLORS[0];
      color = c.main;
      outline = c.outline;
    }

    // Drop shadow
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.arc(x + 1.5, y + 2.5, r * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    var bodyColor = color;
    if (opts.redTint && opts.redTint > 0) {
      bodyColor = lerpColor(color, "#f04860", opts.redTint);
    }
    if (b.pop > 0) {
      // pop animation: scale up + fade — handled by particles, but keep skin sane.
    }
    var grd = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    grd.addColorStop(0, applyBrightness(bodyColor, 1.4));
    grd.addColorStop(0.5, bodyColor);
    grd.addColorStop(1, applyBrightness(bodyColor, 0.62));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x - r * 0.32, y - r * 0.4, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(x - r * 0.45, y - r * 0.5, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Outline
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = outline;
    ctx.beginPath();
    ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Powerup glyph
    if (b.powerup) {
      ctx.save();
      ctx.fillStyle = "#1a1f2e";
      ctx.font = "700 " + Math.round(r * 0.95) + "px 'Inter', sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      var pdef2 = POWERUPS[b.powerup];
      ctx.fillText(pdef2.glyph, x, y + 1);
      ctx.restore();
    }

    // Scholar adornment
    if (b.scholar) {
      var rot = (b.shimmer || 0) * 1.6;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      // Multi-color rotating outline: 6 short arcs in different hues
      var hueColors = ["#f5c451", "#5de0f0", "#a991ff", "#f07bb8", "#52e8a0", "#f04860"];
      ctx.lineWidth = 2.5;
      for (var hi = 0; hi < 6; hi++) {
        ctx.strokeStyle = hueColors[hi];
        ctx.beginPath();
        ctx.arc(0, 0, r + 1.5, hi * Math.PI / 3, hi * Math.PI / 3 + Math.PI / 4);
        ctx.stroke();
      }
      ctx.restore();
      // Question mark sigil
      ctx.save();
      ctx.fillStyle = "#1a1f2e";
      ctx.font = "900 " + Math.round(r * 0.85) + "px 'Fraunces', serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText("?", x, y + 1);
      ctx.restore();
    }
  }

  function drawShot() {
    if (!state.shot) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    drawBubble(state.shot.x, state.shot.y, state.shot.bubble);
    ctx.restore();
  }

  function drawLauncher() {
    // Base pad + launcher pivot
    ctx.save();
    ctx.translate(state.shake.x * 0.4, state.shake.y * 0.4);
    // Pad
    var padW = 130, padH = 22;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.strokeStyle = "rgba(93,224,240,0.35)";
    ctx.lineWidth = 1.3;
    var px = LAUNCHER_X - padW / 2;
    var py = LAUNCHER_Y + 14;
    ctx.beginPath();
    ctx.fillStyle = "rgba(8, 14, 28, 0.9)";
    ctx.fillRect(px, py, padW, padH);
    ctx.strokeRect(px + 0.5, py + 0.5, padW - 1, padH - 1);
    // Aim arm
    ctx.strokeStyle = "rgba(245, 196, 81, 0.7)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    var a = state.aimAngle;
    var armLen = 36;
    ctx.beginPath();
    ctx.moveTo(LAUNCHER_X, LAUNCHER_Y);
    ctx.lineTo(LAUNCHER_X + Math.cos(a) * armLen, LAUNCHER_Y + Math.sin(a) * armLen);
    ctx.stroke();
    // Pivot ring
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(LAUNCHER_X, LAUNCHER_Y, BUBBLE_R + 8, 0, Math.PI * 2);
    ctx.stroke();
    // Loaded bubble
    if (state.current) drawBubble(LAUNCHER_X, LAUNCHER_Y, state.current);
    // Pressure-tick indicator: small ticks above launcher
    var remaining = Math.max(0, PRESSURE_TICK - state.shotsSinceLastPop);
    var tickY = LAUNCHER_Y + 6;
    for (var i = 0; i < PRESSURE_TICK; i++) {
      var tx = LAUNCHER_X - 36 + i * 16;
      var on = i < (PRESSURE_TICK - remaining);
      ctx.fillStyle = on ? "rgba(240, 72, 96, 0.9)" : "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(tx, tickY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slow-time / Laser HUD
    if (state.slowTime > 0) {
      ctx.fillStyle = "rgba(93,224,240,0.85)";
      ctx.font = "800 11px 'JetBrains Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("SLOW " + state.slowTime.toFixed(1) + "s", 16, LAUNCHER_Y - 30);
    }
    if (state.laserTime > 0) {
      ctx.fillStyle = "rgba(240, 123, 184, 0.85)";
      ctx.font = "800 11px 'JetBrains Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("LASER " + state.laserTime.toFixed(1) + "s", 16, LAUNCHER_Y - 14);
    }

    // Next bubble preview (right of launcher)
    if (state.next) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "700 10px 'JetBrains Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("NEXT", LAUNCHER_X + 78, LAUNCHER_Y - 8);
      drawBubble(LAUNCHER_X + 110, LAUNCHER_Y, state.next, { previewScale: 0.7 });
      ctx.restore();
    }
    ctx.restore();
  }

  function drawAimGuide() {
    if (state.shot) return; // hide while shot in flight
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    ctx.strokeStyle = "rgba(93, 224, 240, 0.42)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 6]);
    var maxBounces = (state.laserTime > 0) ? 3 : 1;
    var path = computeAimPath(maxBounces);
    ctx.beginPath();
    for (var i = 0; i < path.length; i++) {
      var p = path[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // Endpoint marker
    if (path.length > 0) {
      var e = path[path.length - 1];
      ctx.fillStyle = "rgba(93,224,240,0.6)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFalling() {
    ctx.save();
    for (var i = 0; i < state.falling.length; i++) {
      var f = state.falling[i];
      ctx.save();
      ctx.translate(f.fx, f.fy);
      ctx.rotate(f.frot);
      drawBubble(0, 0, f);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawParticles() {
    if (!state.particles.length) return;
    ctx.save();
    ctx.translate(state.shake.x, state.shake.y);
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      if (p.startDelay && p.startDelay > 0) continue;
      var t = Math.max(0, p.life / Math.max(0.01, p.totalLife));
      if (p.kind === "ripple") {
        ctx.globalAlpha = t * 0.85;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function lerpColor(a, b, t) {
    function parse(c) {
      if (c.indexOf("#") === 0) {
        return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
      }
      var m = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(c);
      if (m) return [+m[1], +m[2], +m[3]];
      return [200, 200, 200];
    }
    var aa = parse(a), bb = parse(b);
    var r = Math.round(aa[0] + (bb[0] - aa[0]) * t);
    var g = Math.round(aa[1] + (bb[1] - aa[1]) * t);
    var bl = Math.round(aa[2] + (bb[2] - aa[2]) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  function applyBrightness(color, b) {
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawBackground();
    drawHexOverlay();
    drawClusterBubbles();
    drawDeathLine();
    drawAimGuide();
    drawShot();
    drawFalling();
    drawLauncher();
    drawParticles();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // -- Game loop -------------------------------------------------------------
  function loop(ts) {
    rafHandle = requestAnimationFrame(loop);
    if (!state) return;
    var dt = lastFrame ? Math.min(0.05, (ts - lastFrame) / 1000) : 0;
    lastFrame = ts;
    if (phase === "playing") {
      updateGame(dt);
    } else if (phase === "ended" || phase === "paused" || phase === "question") {
      // tick particles + shake decay so anims finish
      if (state) {
        var aliveP = [];
        for (var pi = 0; pi < state.particles.length; pi++) {
          var p = state.particles[pi];
          if (p.startDelay && p.startDelay > 0) { p.startDelay -= dt; aliveP.push(p); continue; }
          p.life -= dt;
          if (p.kind === "ripple") {
            p.radius += dt * 90;
            if (p.life > 0) aliveP.push(p);
          } else {
            p.x += (p.vx || 0) * dt;
            p.y += (p.vy || 0) * dt;
            if (p.vx) p.vx *= 0.92;
            if (p.vy) { p.vy *= 0.92; p.vy += 80 * dt; }
            if (p.life > 0) aliveP.push(p);
          }
        }
        state.particles = aliveP;
        // Falling tick (so they finish drop on game over)
        var aliveF = [];
        for (var fi = 0; fi < state.falling.length; fi++) {
          var f = state.falling[fi];
          f.fyVel += 1100 * dt;
          f.fy += f.fyVel * dt;
          f.fx += f.fxVel * dt;
          f.frot += f.frotVel * dt;
          if (f.fy < LOGICAL_H + BUBBLE_R * 2) aliveF.push(f);
        }
        state.falling = aliveF;
        if (state.shake.life > 0) {
          state.shake.life -= dt;
          var k2 = Math.max(0, state.shake.life / Math.max(0.01, state.shake.totalLife));
          var inten = state.shake.intensity * k2;
          state.shake.x = (Math.random() - 0.5) * inten * 2;
          state.shake.y = (Math.random() - 0.5) * inten * 2;
        } else {
          state.shake.x = 0; state.shake.y = 0;
        }
        if (state.cascadeFlash > 0) state.cascadeFlash = Math.max(0, state.cascadeFlash - dt * 1.6);
        state.deathPulse = (state.deathPulse + dt) % 1.4;
      }
    }
    render();
    if (ts - lastSnapshotTs > 10000) { lastSnapshotTs = ts; saveSnapshot(); }
  }

  // -- HUD -------------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudPops) dom.hudPops.textContent = formatNumber(state.popsTotal);
    if (dom.hudCombo) dom.hudCombo.textContent = "x" + state.combo.toFixed(1);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));

    var remain = Math.max(0, PRESSURE_TICK - state.shotsSinceLastPop);
    if (dom.pressureName) {
      if (state.slowTime > 0) {
        dom.pressureName.textContent = "Slow time · " + state.slowTime.toFixed(1) + "s";
      } else {
        dom.pressureName.textContent = remain + " shots until drop";
      }
    }
    // Pressure warning state on ribbon
    if (dom.waveRibbon) {
      if (remain <= 1 && state.slowTime <= 0) dom.waveRibbon.classList.add("is-warning");
      else dom.waveRibbon.classList.remove("is-warning");
    }
    if (dom.pressureMeta) {
      var bits = [];
      if (state.laserTime > 0) bits.push("Laser " + state.laserTime.toFixed(1) + "s");
      bits.push("Combo x" + state.combo.toFixed(1));
      bits.push("Rows " + state.lifetimeRows);
      dom.pressureMeta.textContent = bits.join(" · ");
    }
    // Powerup cursor hint on canvas
    if (canvas && state.current && state.current.powerup) {
      canvas.dataset.powerup = state.current.powerup;
    } else if (canvas) {
      delete canvas.dataset.powerup;
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

  function openScholarQuestion() {
    activeQuestion = pickQuestion();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Bubble · Optional · +" + SCHOLAR_BONUS + " · purge a color";
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
      dom.explanation.textContent = "Decoded! +" + SCHOLAR_BONUS + " · purging one cluster color.";
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
      state.score += SCHOLAR_BONUS;
      addShards(20, GAME_ID + "-scholar-correct");
      sfx.correct();
      // Purge a single random color from cluster
      var present = clusterColorSet();
      if (present.length > 0) {
        var pickIdx = present[Math.floor(Math.random() * present.length)];
        var popped = [];
        for (var rr = 0; rr < state.grid.length; rr++) {
          var row = state.grid[rr];
          if (!row) continue;
          for (var cc = 0; cc < row.length; cc++) {
            var b = row[cc];
            if (b && b.colorIdx === pickIdx) popped.push({ r: rr, c: cc });
          }
        }
        for (var i = 0; i < popped.length; i++) {
          var p = cellCenter(popped[i].r, popped[i].c);
          burstAt(p.x, p.y, COLORS[pickIdx].main);
          setCell(popped[i].r, popped[i].c, null);
        }
        state.popsTotal += popped.length;
        cascadeDropDisconnected();
        pushPopup("PURGE · " + COLORS[pickIdx].label, LOGICAL_W / 2, GRID_TOP + 50, "is-bonus");
        addShake(5, 0.3);
      }
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
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
    if (dom.endKicker) dom.endKicker.textContent = "Cluster Breached";
    if (dom.endTitle) dom.endTitle.textContent = "Cascade · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Pops</div><div class="end-cell-value">' + formatNumber(state.popsTotal) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Cluster</div><div class="end-cell-value">' + state.maxCascade + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Chain Drop</div><div class="end-cell-value">' + state.maxChain + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Pressure Drops</div><div class="end-cell-value">' + state.lifetimeRows + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    try { var el = document.getElementById("endRecap"); if (el && window.MrMacsEndRecap) { MrMacsEndRecap.render(el); MrMacsEndRecap.stopTracking(); } } catch (e) {}
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

  // Convert client coords → logical canvas coords
  function clientToLogical(cx, cy) {
    var rect = canvas.getBoundingClientRect();
    var x = (cx - rect.left - offsetX) / scale;
    var y = (cy - rect.top - offsetY) / scale;
    return { x: x, y: y };
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { popsTotal: state.popsTotal });
      }
    } catch (e) {}
  }

  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          popsTotal: state.popsTotal,
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
          file: "games/cascade/index.html"
        });
      }
    } catch (e) {}
  }

  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("cascade:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("cascade:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("rift-survivors", { volume: 0.5 });
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
  // Aim DAS: holding ←/→ rotates the launcher continuously.
  var aimHeld = 0;     // -1, 0, +1
  var aimVel = 1.4;    // rad/sec
  var aimFineMode = false; // shift held = finer

  function tickAimHeld(dt) {
    if (aimHeld === 0) return;
    var v = aimVel * (aimFineMode ? 0.25 : 1);
    state.aimAngle = clampAim(state.aimAngle + aimHeld * v * dt);
  }

  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
        if (k === "ArrowLeft") {
          aimHeld = -1;
          state.aimAngle = clampAim(state.aimAngle - 0.04);
          sfx.aimTick();
          e.preventDefault();
          return;
        }
        if (k === "ArrowRight") {
          aimHeld = 1;
          state.aimAngle = clampAim(state.aimAngle + 0.04);
          sfx.aimTick();
          e.preventDefault();
          return;
        }
        if (k === "Shift") {
          aimFineMode = true;
          return;
        }
        if (k === " " || e.code === "Space") {
          if (e.repeat) return;
          fireShot();
          e.preventDefault();
          return;
        }
        if (k === "s" || k === "S" || k === "Tab") {
          if (e.repeat) return;
          swapLauncher();
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
      if (k === "ArrowLeft" && aimHeld === -1) aimHeld = 0;
      if (k === "ArrowRight" && aimHeld === 1) aimHeld = 0;
      if (k === "Shift") aimFineMode = false;
    });

    bindMouse();
    bindTouch();
    bindTouchControls();
  }

  function bindMouse() {
    canvas.addEventListener("mousemove", function (e) {
      if (phase !== "playing") return;
      var p = clientToLogical(e.clientX, e.clientY);
      var dx = p.x - LAUNCHER_X;
      var dy = p.y - LAUNCHER_Y;
      var ang = Math.atan2(dy, dx);
      // Only allow upward angles; if below, clamp.
      state.aimAngle = clampAim(ang);
    });
    canvas.addEventListener("click", function (e) {
      if (phase !== "playing") return;
      // Make sure click is on canvas content, not inside any modal.
      fireShot();
    });
  }

  function bindTouch() {
    var dragActive = false;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (e.touches && e.touches.length === 2) {
        // two-finger tap: swap
        swapLauncher();
        return;
      }
      if (e.touches && e.touches.length === 1) {
        dragActive = true;
        var t = e.touches[0];
        var p = clientToLogical(t.clientX, t.clientY);
        state.aimAngle = clampAim(Math.atan2(p.y - LAUNCHER_Y, p.x - LAUNCHER_X));
        e.preventDefault();
      }
    }, { passive: false });
    canvas.addEventListener("touchmove", function (e) {
      if (!dragActive) return;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        var p = clientToLogical(t.clientX, t.clientY);
        state.aimAngle = clampAim(Math.atan2(p.y - LAUNCHER_Y, p.x - LAUNCHER_X));
        e.preventDefault();
      }
    }, { passive: false });
    canvas.addEventListener("touchend", function (e) {
      if (!dragActive) return;
      dragActive = false;
      if (phase === "playing") fireShot();
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () { dragActive = false; }, { passive: true });
  }

  function bindTouchControls() {
    function pressBtn(btn, fn) {
      if (!btn) return;
      btn.addEventListener("click", function (e) { e.preventDefault(); if (phase === "playing") fn(); });
      btn.addEventListener("touchstart", function (e) { e.preventDefault(); if (phase === "playing") fn(); }, { passive: false });
    }
    pressBtn(dom.tcLeft,  function () { state.aimAngle = clampAim(state.aimAngle - 0.08); sfx.aimTick(); });
    pressBtn(dom.tcRight, function () { state.aimAngle = clampAim(state.aimAngle + 0.08); sfx.aimTick(); });
    pressBtn(dom.tcShoot, function () { fireShot(); });
    pressBtn(dom.tcSwap,  function () { swapLauncher(); });
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

    try {
      if (window.MrMacsHelpOverlay) {
        window.MrMacsHelpOverlay.register("cascade", {
          title: "How to Play Cascade",
          goal: "Aim the launcher and fire colored bubbles to pop clusters of 3 or more matching colors before the ceiling reaches the launcher.",
          controls: [
            { key: "← / →", action: "Aim launcher left / right" },
            { key: "Space", action: "Shoot bubble" },
            { key: "S / Tab", action: "Swap queued bubble" },
            { key: "Esc / P", action: "Pause" }
          ],
          tips: [
            "Every 6 non-popping shots drops the ceiling one row — aim for large clusters to maximize pops per shot.",
            "Disconnected bubbles cascade down as chain drops worth bonus points; plan shots to isolate hanging groups.",
            "Use Bomb and Rainbow power-up bubbles when the cluster is densely packed for massive chain reactions."
          ],
          scholar: "Gold scholar bubbles appear in the cluster every ~30 pops — pop one to unlock a review prompt worth +1000 score and a single-color purge of the cluster."
        });
        var setupActions = document.querySelector("#setupScreen .setup-actions");
        if (setupActions) window.MrMacsHelpOverlay.mountButton(setupActions, "cascade");
      }
    } catch (e) {}
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("cascade");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "cascade", { compact: false });
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
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state;
    initState({
      score: s.score || 0,
      popsTotal: s.popsTotal || 0,
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
    if (snap && snap.state && (snap.state.score || snap.state.popsTotal) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Pops ' + (snap.state.popsTotal || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Cascade Scores</div>';
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
    var GAME_ID_LOCAL = "cascade";
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
