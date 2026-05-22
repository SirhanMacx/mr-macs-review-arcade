/* ===========================================================================
   Solitaire Hall — Klondike Solitaire · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 1280x800 logical, 7 tableau + 4 foundations + stock/waste
   Editorial suits: scrolls (red), atoms (cyan), compasses (gold), palettes (violet)
   Vegas draw-3 · scholar cards trigger optional review modal · 5 power-ups
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "solitaire-hall";
  var GAME_TITLE = "Solitaire Hall";

  // Logical canvas
  var LOGICAL_W = 1280;
  var LOGICAL_H = 800;

  // Card geometry
  var CARD_W = 110;
  var CARD_H = 154;
  var CARD_R = 10;            // corner radius
  var TABLEAU_DY_FACE_DOWN = 18;  // y offset between face-down stacked cards
  var TABLEAU_DY_FACE_UP   = 32;  // y offset between face-up stacked cards
  var COL_GAP = 22;
  var ROW_TOP = 156;          // foundations / stock / waste y
  var TABLEAU_TOP = 340;      // tableau y

  // Suits
  var S_SCROLLS   = 0;  // red
  var S_ATOMS     = 1;  // cyan (treated as 'black' for alternation)
  var S_COMPASSES = 2;  // gold (treated as 'black' for alternation)
  var S_PALETTES  = 3;  // violet (treated as 'red' for alternation)
  var SUIT_COUNT = 4;
  var SUIT_NAMES = ["Scrolls", "Atoms", "Compasses", "Palettes"];
  var SUIT_GLYPHS = ["scroll", "atom", "compass", "palette"];
  // For Klondike alternation, group suits into two color teams: warm (red-team)
  // and cool (black-team). Teams: warm = scrolls + palettes, cool = atoms + compasses.
  var SUIT_TEAM = [0, 1, 1, 0]; // 0 = warm, 1 = cool

  // Suit colors
  var SUIT_COLOR = [
    { base: "#d04848", light: "#ff7c7c", dark: "#7a2424", rim: "#ffb0b0" }, // scrolls (red)
    { base: "#5de0f0", light: "#a8f4ff", dark: "#22808c", rim: "#bff5ff" }, // atoms (cyan)
    { base: "#f5c451", light: "#ffe091", dark: "#a8821c", rim: "#ffe6a8" }, // compasses (gold)
    { base: "#a991ff", light: "#d4c5ff", dark: "#5a4fa0", rim: "#e0d4ff" }  // palettes (violet)
  ];

  // Ranks
  var R_ACE = 1, R_KING = 13;
  var RANK_LABEL = ["", "A","2","3","4","5","6","7","8","9","10","J","Q","K"];

  // Pile types
  var PT_TABLEAU = "tableau";
  var PT_FOUNDATION = "foundation";
  var PT_STOCK = "stock";
  var PT_WASTE = "waste";

  // Scoring (Vegas-style)
  var SCORE_DEAL = -52;            // ante for new hand
  var SCORE_FOUNDATION = 5;        // per card moved up
  var SCORE_FOUNDATION_DOWN = -15; // remove from foundation back to tableau
  var SCORE_TABLEAU_FLIP = 5;      // flip a face-down tableau card
  var SCORE_WASTE_TO_TABLEAU = 5;
  var SCORE_STOCK_CYCLE = -100;    // recycle waste back to stock
  var SCORE_WIN_BONUS = 700;
  var SCORE_SCHOLAR_CORRECT = 1500;
  var SHARDS_SCHOLAR = 12;

  // Game settings
  var LIVES_INIT = 3;
  var SHARDS_CAP = 200;
  var SCHOLAR_PER_GAME = 3;
  var DRAW_COUNT = 3;
  var POWERUP_DROP_RATE = 0.10;   // chance per foundation drop
  var POWERUP_MAX = 3;
  var UNDO_MAX_PER_GAME = 5;

  // Animation
  var DRAG_LIFT = 6;

  // Snapshot
  var SNAPSHOT_INTERVAL_MS = 10000;

  // -- 28 Question pool (scholar cards) --------------------------------------
  var QUESTIONS = [
    { q: "Which empire built the Colosseum in Rome?",
      choices: ["Roman Empire", "Greek city-states", "Persian Empire", "Byzantine Empire"], correct: 0,
      hint: "Capital was Rome itself." },
    { q: "Photosynthesis converts sunlight, water, and what gas into glucose?",
      choices: ["Carbon dioxide", "Nitrogen", "Methane", "Oxygen"], correct: 0,
      hint: "Plants pull this from the air." },
    { q: "The Mona Lisa was painted by:",
      choices: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], correct: 0,
      hint: "Italian polymath who also designed flying machines." },
    { q: "The longest river in South America is the:",
      choices: ["Amazon", "Nile", "Yangtze", "Mississippi"], correct: 0,
      hint: "It flows through Brazil to the Atlantic." },
    { q: "What is the square root of 144?",
      choices: ["12", "14", "10", "16"], correct: 0,
      hint: "12 × 12 = 144." },
    { q: "A noun is a word that names a:",
      choices: ["Person, place, thing, or idea", "Action", "Description", "Connection"], correct: 0,
      hint: "Verbs are actions; this is the subject." },
    { q: "The Magna Carta (1215) limited the power of the:",
      choices: ["English king", "Pope", "Holy Roman Emperor", "Sultan"], correct: 0,
      hint: "King John signed it under baron pressure." },
    { q: "Which planet is closest to the sun?",
      choices: ["Mercury", "Venus", "Earth", "Mars"], correct: 0,
      hint: "Smallest of the eight, too." },
    { q: "Beethoven's Symphony No. 9 famously includes a vocal:",
      choices: ["'Ode to Joy'", "'Ave Maria'", "'Hallelujah'", "'Te Deum'"], correct: 0,
      hint: "Sets a Schiller poem." },
    { q: "Mount Everest sits in which mountain range?",
      choices: ["Himalayas", "Andes", "Alps", "Rockies"], correct: 0,
      hint: "Border of Nepal and China." },
    { q: "What is 7 × 8?",
      choices: ["56", "54", "64", "48"], correct: 0,
      hint: "Memorize this product." },
    { q: "'Et tu, Brute?' is a line from:",
      choices: ["Shakespeare's Julius Caesar", "Homer's Odyssey", "Dante's Inferno", "Virgil's Aeneid"], correct: 0,
      hint: "Caesar's last words on stage." },
    { q: "The Black Death of the 1340s was caused by:",
      choices: ["A bacterial plague", "Cholera", "Smallpox", "Influenza"], correct: 0,
      hint: "Spread by fleas on rats." },
    { q: "DNA's molecular structure is a:",
      choices: ["Double helix", "Single strand", "Ring", "Cube lattice"], correct: 0,
      hint: "Watson and Crick, 1953." },
    { q: "Picasso's 'Guernica' protested:",
      choices: ["The bombing of a Spanish town", "World War I trenches", "The French Revolution", "The Holocaust"], correct: 0,
      hint: "Spanish Civil War, 1937." },
    { q: "Which country has the largest population today?",
      choices: ["India", "China", "United States", "Indonesia"], correct: 0,
      hint: "Surpassed China in 2023." },
    { q: "The slope-intercept form of a line is:",
      choices: ["y = mx + b", "ax² + bx + c", "y = a/x", "x² + y² = r²"], correct: 0,
      hint: "m is slope, b is the y-intercept." },
    { q: "A 'pronoun' replaces a:",
      choices: ["Noun", "Verb", "Adjective", "Adverb"], correct: 0,
      hint: "Like 'she' or 'they'." },
    { q: "The 13th Amendment to the U.S. Constitution:",
      choices: ["Abolished slavery", "Granted women's suffrage", "Ended Prohibition", "Created income tax"], correct: 0,
      hint: "Ratified December 1865." },
    { q: "Newton's third law states that:",
      choices: ["Every action has an equal and opposite reaction", "Force equals mass times acceleration", "An object at rest stays at rest", "Energy is conserved"], correct: 0,
      hint: "Action–reaction pairs." },
    { q: "The Impressionists worked primarily in:",
      choices: ["19th-century France", "Renaissance Italy", "Edo Japan", "Mughal India"], correct: 0,
      hint: "Monet, Renoir, Degas." },
    { q: "The Sahara is in:",
      choices: ["North Africa", "South America", "Central Asia", "Australia"], correct: 0,
      hint: "Stretches from Morocco to Egypt." },
    { q: "A triangle with three 60° angles is:",
      choices: ["Equilateral", "Right", "Scalene", "Obtuse"], correct: 0,
      hint: "All sides equal." },
    { q: "Which Shakespeare play features 'star-crossed lovers'?",
      choices: ["Romeo and Juliet", "Hamlet", "Macbeth", "Othello"], correct: 0,
      hint: "Verona, Italy setting." },
    { q: "The Berlin Wall fell in:",
      choices: ["1989", "1979", "1961", "1991"], correct: 0,
      hint: "Same year as the Velvet Revolution." },
    { q: "Which gas is most abundant in Earth's atmosphere?",
      choices: ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"], correct: 0,
      hint: "About 78% of dry air." },
    { q: "Pi (π) is approximately:",
      choices: ["3.14159", "2.71828", "1.41421", "1.61803"], correct: 0,
      hint: "Ratio of circumference to diameter." },
    { q: "Which civilization built Machu Picchu in the Andes?",
      choices: ["Inca", "Maya", "Aztec", "Olmec"], correct: 0,
      hint: "Empire spanned modern Peru in the 15th century." }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | dragging | paused | question | activating | ended | autoFinish
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
    var type = opts.type || "square";
    var vol = opts.volume == null ? 0.14 : opts.volume;
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
      src.connect(gain).connect(ctxA.destination);
      src.start();
    } catch (e) {}
  }

  var sfx = {
    cardPickup:        function () { sfxTone(520, 0.06, { type: "sine", volume: 0.10, endFreq: 660 }); },
    cardPlace:         function () { sfxTone(420, 0.07, { type: "triangle", volume: 0.12, endFreq: 320 }); },
    cardInvalid:       function () { sfxTone(180, 0.18, { type: "sawtooth", volume: 0.13, endFreq: 90 }); },
    foundationDrop:    function () { sfxTone(720, 0.10, { type: "sine", volume: 0.14, endFreq: 1000 }); sfxTone(540, 0.09, { type: "triangle", volume: 0.10, endFreq: 720 }); },
    scholarToFoundation: function () { sfxTone(880, 0.18, { type: "sine", volume: 0.16, endFreq: 1320 }); sfxTone(660, 0.14, { type: "triangle", volume: 0.10, endFreq: 990 }); },
    scholarCorrect:    function () { sfxTone(660, 0.10, { type: "sine", volume: 0.16, endFreq: 880 }); setTimeout(function () { sfxTone(880, 0.10, { type: "sine", volume: 0.14, endFreq: 1100 }); }, 100); setTimeout(function () { sfxTone(1100, 0.20, { type: "sine", volume: 0.13, endFreq: 1320 }); }, 200); },
    scholarWrong:      function () { sfxTone(330, 0.22, { type: "triangle", volume: 0.14, endFreq: 220 }); },
    win:               function () { sfxTone(660, 0.10, { type: "square", volume: 0.16, endFreq: 880 }); setTimeout(function () { sfxTone(880, 0.10, { type: "square", volume: 0.14, endFreq: 1100 }); }, 100); setTimeout(function () { sfxTone(1100, 0.18, { type: "square", volume: 0.12, endFreq: 1320 }); }, 200); setTimeout(function () { sfxTone(1320, 0.32, { type: "square", volume: 0.14 }); }, 320); },
    lifeLost:          function () { sfxTone(440, 0.18, { type: "sawtooth", volume: 0.16, endFreq: 220 }); sfxTone(330, 0.20, { type: "triangle", volume: 0.12, endFreq: 110 }); },
    gameOver:          function () { sfxTone(330, 0.18, { type: "sawtooth", volume: 0.16, endFreq: 220 }); setTimeout(function () { sfxTone(220, 0.32, { type: "sawtooth", volume: 0.14, endFreq: 88 }); }, 200); },
    hint:              function () { sfxTone(540, 0.08, { type: "sine", volume: 0.12, endFreq: 760 }); sfxTone(720, 0.08, { type: "sine", volume: 0.10, endFreq: 920 }); },
    undo:              function () { sfxTone(640, 0.08, { type: "triangle", volume: 0.12, endFreq: 440 }); },
    stockCycle:        function () { sfxNoise(0.12, { volume: 0.10 }); sfxTone(220, 0.18, { type: "triangle", volume: 0.10, endFreq: 360 }); },
    powerupPickup:     function () { sfxTone(880, 0.10, { type: "sine", volume: 0.16, endFreq: 1320 }); sfxTone(1100, 0.10, { type: "triangle", volume: 0.10, endFreq: 1500 }); },
    powerupUse:        function () { sfxTone(560, 0.12, { type: "square", volume: 0.16, endFreq: 1100 }); sfxNoise(0.08, { volume: 0.06 }); }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("solitaireCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudMoves = $("hudMoves");
    dom.hudGame = $("hudGame");
    dom.hudLives = $("hudLives");
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
    dom.newDealBtn = $("newDealBtn");
    dom.autoCompleteBtn = $("autoCompleteBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");
    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.retryHint = $("retryHint");
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
    dom.powerupSlots = [$("powerupSlot0"), $("powerupSlot1"), $("powerupSlot2")];
    dom.activationHint = $("activationHint");
    dom.activationHintText = $("activationHintText");
  }

  // -- Card / pile model -----------------------------------------------------
  function makeCard(suit, rank) {
    return {
      suit: suit,
      rank: rank,
      faceUp: false,
      scholar: false,
      // Animation/render state
      x: 0, y: 0,            // current draw position
      tx: 0, ty: 0,          // target draw position (when not dragged)
      pile: null,            // ref to pile during play
      pileIndex: 0
    };
  }

  function makeDeck() {
    var deck = [];
    for (var s = 0; s < SUIT_COUNT; s++) {
      for (var r = R_ACE; r <= R_KING; r++) {
        deck.push(makeCard(s, r));
      }
    }
    return deck;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // -- Layout ----------------------------------------------------------------
  // Foundations are at top-right (4 piles), tableau is the 7-column row below.
  // Stock + Waste sit at top-left.
  function layoutPiles() {
    var pad = 32;
    var sevenW = 7 * CARD_W + 6 * COL_GAP;
    var startX = (LOGICAL_W - sevenW) / 2;
    var stockX = startX;
    var wasteX = startX + CARD_W + COL_GAP;
    var foundationStartX = startX + 3 * (CARD_W + COL_GAP); // columns 4..7 reserved for foundations
    void pad;

    state.piles = [];

    // Stock (index 0)
    var stock = { type: PT_STOCK, index: 0, x: stockX, y: ROW_TOP, cards: [] };
    state.piles.push(stock);
    state.stock = stock;

    // Waste (index 1)
    var waste = { type: PT_WASTE, index: 1, x: wasteX, y: ROW_TOP, cards: [] };
    state.piles.push(waste);
    state.waste = waste;

    // Foundations (4)
    state.foundations = [];
    for (var f = 0; f < 4; f++) {
      var fp = { type: PT_FOUNDATION, index: f,
        x: foundationStartX + f * (CARD_W + COL_GAP),
        y: ROW_TOP, cards: [], suit: -1 };
      state.foundations.push(fp);
      state.piles.push(fp);
    }

    // Tableau (7)
    state.tableau = [];
    for (var t = 0; t < 7; t++) {
      var tp = { type: PT_TABLEAU, index: t,
        x: startX + t * (CARD_W + COL_GAP),
        y: TABLEAU_TOP, cards: [] };
      state.tableau.push(tp);
      state.piles.push(tp);
    }
  }

  // -- Deal ------------------------------------------------------------------
  function deal() {
    var deck = shuffle(makeDeck());
    layoutPiles();
    // Mark scholar cards (random 3 cards)
    var scholarIndices = {};
    var picked = 0, attempts = 0;
    while (picked < SCHOLAR_PER_GAME && attempts < 200) {
      attempts++;
      var idx = Math.floor(Math.random() * deck.length);
      if (scholarIndices[idx]) continue;
      // Don't pick aces (they go to foundation immediately on auto-finish — keep
      // scholars on cards that travel through tableau more often). But it's fine
      // either way; allow all.
      scholarIndices[idx] = true;
      picked++;
    }
    for (var k = 0; k < deck.length; k++) {
      if (scholarIndices[k]) deck[k].scholar = true;
    }
    // Tableau: column i gets i+1 cards, only top is face up
    for (var c = 0; c < 7; c++) {
      for (var r = 0; r <= c; r++) {
        var card = deck.pop();
        card.pile = state.tableau[c];
        card.pileIndex = state.tableau[c].cards.length;
        state.tableau[c].cards.push(card);
        card.faceUp = (r === c);
      }
    }
    // Remaining 24 go to stock face-down
    while (deck.length) {
      var c2 = deck.pop();
      c2.pile = state.stock;
      c2.pileIndex = state.stock.cards.length;
      c2.faceUp = false;
      state.stock.cards.push(c2);
    }
    repositionAll(true);
  }

  // Snap target positions for every card
  function cardTargetXY(pile, indexInPile, isTopOfStack) {
    var x = pile.x;
    var y = pile.y;
    if (pile.type === PT_TABLEAU) {
      // Walk the cards: every face-down card adds DY_FACE_DOWN; face-up adds DY_FACE_UP
      for (var i = 0; i < indexInPile; i++) {
        var c = pile.cards[i];
        y += c.faceUp ? TABLEAU_DY_FACE_UP : TABLEAU_DY_FACE_DOWN;
      }
    }
    void isTopOfStack;
    return { x: x, y: y };
  }

  function repositionAll(snap) {
    for (var p = 0; p < state.piles.length; p++) {
      var pile = state.piles[p];
      for (var i = 0; i < pile.cards.length; i++) {
        var card = pile.cards[i];
        card.pile = pile;
        card.pileIndex = i;
        var pos = cardTargetXY(pile, i);
        card.tx = pos.x;
        card.ty = pos.y;
        if (snap) { card.x = card.tx; card.y = card.ty; }
      }
    }
  }

  // -- Move legality ---------------------------------------------------------
  function canStackOnTableau(moving, target) {
    // moving: card being moved (the head of the moving stack)
    // target: card on top of destination tableau pile, or null for empty pile
    if (!target) {
      return moving.rank === R_KING; // only Kings on empty tableau
    }
    if (!target.faceUp) return false;
    // Descending by 1
    if (moving.rank !== target.rank - 1) return false;
    // Alternating teams (warm vs cool)
    if (SUIT_TEAM[moving.suit] === SUIT_TEAM[target.suit]) return false;
    return true;
  }

  function canStackOnFoundation(moving, foundationPile) {
    // Only one card at a time can move to foundation
    if (foundationPile.cards.length === 0) {
      return moving.rank === R_ACE;
    }
    var top = foundationPile.cards[foundationPile.cards.length - 1];
    return moving.suit === top.suit && moving.rank === top.rank + 1;
  }

  // Returns the index in the source pile where a movable face-up sub-stack starts
  // for the given card (or -1 if the card cannot move). For tableau, the card
  // and everything below it must form a valid descending alt-color run.
  function movableSubStackStart(pile, idx) {
    if (idx < 0 || idx >= pile.cards.length) return -1;
    var card = pile.cards[idx];
    if (!card.faceUp) return -1;
    if (pile.type === PT_TABLEAU) {
      // Validate the run from idx to end
      for (var i = idx; i < pile.cards.length - 1; i++) {
        var a = pile.cards[i];
        var b = pile.cards[i + 1];
        if (!a.faceUp || !b.faceUp) return -1;
        if (b.rank !== a.rank - 1) return -1;
        if (SUIT_TEAM[a.suit] === SUIT_TEAM[b.suit]) return -1;
      }
      return idx;
    } else if (pile.type === PT_WASTE) {
      // Only top of waste is movable, single card
      if (idx !== pile.cards.length - 1) return -1;
      return idx;
    } else if (pile.type === PT_FOUNDATION) {
      // Only top of foundation is movable, single card
      if (idx !== pile.cards.length - 1) return -1;
      return idx;
    }
    return -1;
  }

  // -- Apply moves -----------------------------------------------------------
  function topCard(pile) { return pile.cards.length ? pile.cards[pile.cards.length - 1] : null; }

  function moveCards(srcPile, srcStartIdx, dstPile) {
    if (srcStartIdx < 0 || srcStartIdx > srcPile.cards.length - 1) return false;
    var moving = srcPile.cards.slice(srcStartIdx);
    if (!moving.length) return false;

    // Validate based on dst type
    if (dstPile.type === PT_FOUNDATION) {
      if (moving.length !== 1) return false;
      if (!canStackOnFoundation(moving[0], dstPile)) return false;
    } else if (dstPile.type === PT_TABLEAU) {
      var dstTop = topCard(dstPile);
      if (!canStackOnTableau(moving[0], dstTop)) return false;
    } else {
      return false;
    }
    return commitMove(srcPile, srcStartIdx, dstPile, moving, /*isUndo*/false, /*scoreDelta*/null, /*flipResult*/null);
  }

  // commitMove applies the move and updates score/flip state.
  // history records all info needed to undo: srcPile.index/type, srcStartIdx, dstPile.index/type,
  // count, scoreBefore, didFlip (boolean: whether a tableau card became face-up).
  function commitMove(srcPile, srcStartIdx, dstPile, movingArr, isUndo, scoreDeltaOverride, flipUndo) {
    // Capture pre-state for history
    var hist = {
      srcType: srcPile.type, srcIndex: srcPile.index, srcStart: srcStartIdx,
      dstType: dstPile.type, dstIndex: dstPile.index,
      count: movingArr.length,
      didFlip: false,
      scoreDelta: 0,
      stockCycleConsumed: false,
      cards: movingArr  // hold for re-add on undo
    };

    // Detach from src
    srcPile.cards.splice(srcStartIdx, movingArr.length);

    // Attach to dst (preserving order)
    for (var i = 0; i < movingArr.length; i++) {
      var c = movingArr[i];
      c.pile = dstPile;
      dstPile.cards.push(c);
    }

    // If src was a tableau and now its (new) top is face-down, flip it
    if (srcPile.type === PT_TABLEAU && srcPile.cards.length > 0) {
      var newTop = srcPile.cards[srcPile.cards.length - 1];
      if (!newTop.faceUp) {
        if (flipUndo === false || (!isUndo && flipUndo == null)) {
          newTop.faceUp = true;
          hist.didFlip = true;
          state.score += SCORE_TABLEAU_FLIP;
        }
      }
    }

    // Compute scoring (Vegas)
    if (!isUndo) {
      var dscore = 0;
      // Foundation drops
      if (dstPile.type === PT_FOUNDATION) {
        dscore += SCORE_FOUNDATION;
      }
      // Waste -> Tableau
      if (srcPile.type === PT_WASTE && dstPile.type === PT_TABLEAU) {
        dscore += SCORE_WASTE_TO_TABLEAU;
      }
      // Foundation -> Tableau (penalty)
      if (srcPile.type === PT_FOUNDATION && dstPile.type === PT_TABLEAU) {
        dscore += SCORE_FOUNDATION_DOWN;
      }
      // Apply 2x score active mode
      if (state.scoreMultiplier && state.scoreMultiplier.active && dscore > 0) {
        dscore *= 2;
      }
      // Score from flip already applied above; track that delta into history
      hist.scoreDelta = dscore + (hist.didFlip ? SCORE_TABLEAU_FLIP : 0);
      state.score += dscore;
      if (state.score > state.best) { state.best = state.score; writeBest(state.best); }
    } else if (scoreDeltaOverride != null) {
      state.score += scoreDeltaOverride;
    }

    // Push history (only on player-driven moves)
    if (!isUndo) {
      state.history.push(hist);
      if (state.history.length > 200) state.history.shift();
    }

    // Tick decreasing 2x score multiplier
    if (!isUndo && state.scoreMultiplier && state.scoreMultiplier.active) {
      state.scoreMultiplier.movesLeft--;
      if (state.scoreMultiplier.movesLeft <= 0) {
        state.scoreMultiplier.active = false;
        showActivationHint(false);
      }
    }

    // Move counter
    if (!isUndo) state.moveCount++;
    repositionAll(false);

    // Sounds + scoring popups
    if (!isUndo) {
      if (dstPile.type === PT_FOUNDATION) {
        var dropped = movingArr[movingArr.length - 1];
        if (dropped && dropped.scholar) {
          sfx.scholarToFoundation();
          dropped.scholar = false; // consumed; only triggers once
          hist.scholarConsumed = true; // tag so undo can restore it
          hist.scholarCard = dropped;
          // Trigger scholar review immediately so autoFinish/playing both pause
          triggerScholarReview(dropped, dstPile);
        } else {
          sfx.foundationDrop();
        }
        // Power-up drop chance
        maybeDropPowerup();
      } else {
        sfx.cardPlace();
      }
    } else {
      sfx.undo();
    }

    // Win check (skip if scholar review just opened)
    if (!isUndo && phase !== "question") {
      if (isWin()) onWin();
    }
    return true;
  }

  function isWin() {
    if (!state || !state.foundations) return false;
    var total = 0;
    for (var i = 0; i < state.foundations.length; i++) total += state.foundations[i].cards.length;
    return total === 52;
  }


  // -- Stock cycle -----------------------------------------------------------
  function clickStock() {
    if (phase !== "playing") return;
    if (state.stock.cards.length === 0) {
      // Recycle waste back to stock
      if (state.waste.cards.length === 0) {
        sfx.cardInvalid();
        return;
      }
      // Pull from waste, reverse order, mark face-down
      while (state.waste.cards.length > 0) {
        var c = state.waste.cards.pop();
        c.faceUp = false;
        c.pile = state.stock;
        state.stock.cards.push(c);
      }
      state.score += SCORE_STOCK_CYCLE;
      state.stockCycles++;
      // History entry for the cycle
      state.history.push({
        kind: "stockCycle",
        scoreDelta: SCORE_STOCK_CYCLE
      });
      sfx.stockCycle();
      pushPopupAtBoard("STOCK CYCLE -100", "is-warn");
      // Recycling counts as a move (parity with stock draw)
      state.moveCount++;
      repositionAll(false);
      return;
    }
    // Draw up to DRAW_COUNT
    var drawn = [];
    for (var i = 0; i < DRAW_COUNT && state.stock.cards.length > 0; i++) {
      var card = state.stock.cards.pop();
      card.faceUp = true;
      card.pile = state.waste;
      state.waste.cards.push(card);
      drawn.push(card);
    }
    sfx.cardPickup();
    state.history.push({
      kind: "stockDraw",
      drawn: drawn,
      scoreDelta: 0
    });
    state.moveCount++;
    repositionAll(false);
  }

  // -- Undo ------------------------------------------------------------------
  function undo() {
    if (phase !== "playing") return;
    if (state.undosUsed >= UNDO_MAX_PER_GAME) {
      pushPopupAtBoard("NO UNDOS LEFT", "is-warn");
      sfx.cardInvalid();
      return;
    }
    if (state.history.length === 0) {
      sfx.cardInvalid();
      return;
    }
    var hist = state.history.pop();
    if (hist.kind === "stockCycle") {
      // Undo: pull from stock back to waste, mark face-up
      while (state.stock.cards.length > 0) {
        var c = state.stock.cards.pop();
        c.faceUp = true;
        c.pile = state.waste;
        state.waste.cards.push(c);
      }
      state.score -= hist.scoreDelta;
      state.stockCycles = Math.max(0, state.stockCycles - 1);
      state.moveCount = Math.max(0, state.moveCount - 1);
      sfx.undo();
      repositionAll(false);
      state.undosUsed++;
      return;
    }
    if (hist.kind === "stockDraw") {
      // Undo: pop drawn count from waste back to stock face-down
      var n = hist.drawn ? hist.drawn.length : 0;
      for (var i = 0; i < n; i++) {
        if (state.waste.cards.length === 0) break;
        var c2 = state.waste.cards.pop();
        c2.faceUp = false;
        c2.pile = state.stock;
        state.stock.cards.push(c2);
      }
      sfx.undo();
      state.moveCount = Math.max(0, state.moveCount - 1);
      repositionAll(false);
      state.undosUsed++;
      return;
    }
    // Standard move undo
    var srcPile = pileByTypeIndex(hist.srcType, hist.srcIndex);
    var dstPile = pileByTypeIndex(hist.dstType, hist.dstIndex);
    if (!srcPile || !dstPile) { sfx.cardInvalid(); return; }
    // Pull last `count` from dst
    var moving = dstPile.cards.splice(dstPile.cards.length - hist.count, hist.count);
    // If src was tableau and history.didFlip was true, flip its current top back face-down
    if (hist.didFlip && srcPile.type === PT_TABLEAU && srcPile.cards.length > 0) {
      srcPile.cards[srcPile.cards.length - 1].faceUp = false;
    }
    // Restore scholar marker if this move had consumed one (allows re-trigger)
    if (hist.scholarConsumed && hist.scholarCard) {
      hist.scholarCard.scholar = true;
    }
    // Re-attach moving to src at original start position (which is end since we just popped)
    for (var k = 0; k < moving.length; k++) {
      var mc = moving[k];
      mc.pile = srcPile;
      srcPile.cards.push(mc);
    }
    state.score -= hist.scoreDelta;
    state.moveCount = Math.max(0, state.moveCount - 1);
    sfx.undo();
    state.undosUsed++;
    repositionAll(false);
  }

  function pileByTypeIndex(type, index) {
    if (type === PT_STOCK) return state.stock;
    if (type === PT_WASTE) return state.waste;
    if (type === PT_FOUNDATION) return state.foundations[index];
    if (type === PT_TABLEAU) return state.tableau[index];
    return null;
  }

  // -- Hint engine -----------------------------------------------------------
  // Find a "good" valid move:
  //   priority 1: any card to foundation
  //   priority 2: a face-up tableau move that uncovers a face-down card
  //   priority 3: waste -> tableau or foundation
  //   priority 4: tableau -> tableau just to free Kings/sequences
  function findHint() {
    if (!state) return null;
    // 1) Foundation moves
    for (var f = 0; f < state.foundations.length; f++) {
      var fp = state.foundations[f];
      // From waste
      var wt = topCard(state.waste);
      if (wt && canStackOnFoundation(wt, fp)) {
        return { src: state.waste, srcStart: state.waste.cards.length - 1, dst: fp };
      }
      // From tableau tops
      for (var t = 0; t < state.tableau.length; t++) {
        var tp = state.tableau[t];
        var top = topCard(tp);
        if (top && top.faceUp && canStackOnFoundation(top, fp)) {
          return { src: tp, srcStart: tp.cards.length - 1, dst: fp };
        }
      }
    }
    // 2) Tableau moves that uncover a face-down card
    for (var s = 0; s < state.tableau.length; s++) {
      var srcP = state.tableau[s];
      // Find first face-up card from top of pile
      var firstFaceUpIdx = -1;
      for (var ci = 0; ci < srcP.cards.length; ci++) {
        if (srcP.cards[ci].faceUp) { firstFaceUpIdx = ci; break; }
      }
      if (firstFaceUpIdx === -1) continue;
      // Uncover only happens if the card BELOW firstFaceUpIdx is face-down (which it always is by Klondike rules unless firstFaceUpIdx==0)
      if (firstFaceUpIdx === 0) continue;
      // We want to move the entire face-up substack starting at firstFaceUpIdx
      var startIdx = movableSubStackStart(srcP, firstFaceUpIdx);
      if (startIdx === -1) continue;
      var movingHead = srcP.cards[startIdx];
      for (var dt = 0; dt < state.tableau.length; dt++) {
        if (dt === s) continue;
        var dstP = state.tableau[dt];
        var dtop = topCard(dstP);
        if (canStackOnTableau(movingHead, dtop)) {
          return { src: srcP, srcStart: startIdx, dst: dstP };
        }
      }
    }
    // 3) Waste -> tableau
    var wtop = topCard(state.waste);
    if (wtop) {
      for (var d2 = 0; d2 < state.tableau.length; d2++) {
        var dp = state.tableau[d2];
        var dtp = topCard(dp);
        if (canStackOnTableau(wtop, dtp)) {
          return { src: state.waste, srcStart: state.waste.cards.length - 1, dst: dp };
        }
      }
    }
    // 4) Tableau -> tableau (any face-up sub-stack to any other)
    for (var s2 = 0; s2 < state.tableau.length; s2++) {
      var srcQ = state.tableau[s2];
      for (var idx2 = 0; idx2 < srcQ.cards.length; idx2++) {
        if (!srcQ.cards[idx2].faceUp) continue;
        var ms = movableSubStackStart(srcQ, idx2);
        if (ms === -1) continue;
        var head = srcQ.cards[ms];
        // Skip "moving a King to an empty pile when it's already at top" non-progress
        for (var dq = 0; dq < state.tableau.length; dq++) {
          if (dq === s2) continue;
          var dqp = state.tableau[dq];
          // Skip moving King already at row-zero of source
          if (head.rank === R_KING && ms === 0 && dqp.cards.length === 0) continue;
          if (canStackOnTableau(head, topCard(dqp))) {
            return { src: srcQ, srcStart: ms, dst: dqp };
          }
        }
      }
    }
    // 5) Stock click as fallback
    if (state.stock.cards.length > 0) {
      return { kind: "stockClick", src: state.stock };
    }
    if (state.waste.cards.length > 0) {
      return { kind: "stockClick", src: state.stock }; // recycle
    }
    return null;
  }

  function applyHint() {
    if (phase !== "playing") return;
    var h = findHint();
    if (!h) {
      pushPopupAtBoard("NO MOVES", "is-warn");
      sfx.cardInvalid();
      return;
    }
    // Highlight the source card briefly
    if (h.kind === "stockClick") {
      state.hintHighlight = { pile: state.stock, idx: -1, t: 0 };
      sfx.hint();
      return;
    }
    state.hintHighlight = { pile: h.src, idx: h.srcStart, dstPile: h.dst, t: 0 };
    sfx.hint();
  }

  // -- Auto-Move to Foundation (power-up) ------------------------------------
  function autoMoveAllToFoundation() {
    if (phase !== "playing") return false;
    var moved = 0;
    // Repeat until no eligible card moves
    var changed = true;
    var passes = 0;
    while (changed && passes < 60) {
      changed = false; passes++;
      // From waste
      var wt = topCard(state.waste);
      if (wt) {
        for (var f = 0; f < state.foundations.length; f++) {
          if (canStackOnFoundation(wt, state.foundations[f])) {
            moveCards(state.waste, state.waste.cards.length - 1, state.foundations[f]);
            changed = true; moved++; break;
          }
        }
      }
      // From tableau tops
      for (var t = 0; t < state.tableau.length; t++) {
        var tp = state.tableau[t];
        var top = topCard(tp);
        if (top && top.faceUp) {
          for (var f2 = 0; f2 < state.foundations.length; f2++) {
            if (canStackOnFoundation(top, state.foundations[f2])) {
              moveCards(tp, tp.cards.length - 1, state.foundations[f2]);
              changed = true; moved++; break;
            }
          }
        }
      }
    }
    return moved > 0;
  }

  // -- Reveal Hidden ---------------------------------------------------------
  function revealOneHidden() {
    var candidates = [];
    for (var t = 0; t < state.tableau.length; t++) {
      var tp = state.tableau[t];
      for (var i = 0; i < tp.cards.length; i++) {
        if (!tp.cards[i].faceUp) candidates.push({ pile: tp, idx: i });
      }
    }
    if (!candidates.length) return false;
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    // Flip just this one card (does not affect the card above it visually)
    pick.pile.cards[pick.idx].faceUp = true;
    // No score for power-up flip; that's a free peek
    pushPopupAtBoard("REVEALED", "is-bonus");
    return true;
  }

  // -- Win / End -------------------------------------------------------------
  function onWin() {
    state.score += SCORE_WIN_BONUS;
    if (state.scoreMultiplier && state.scoreMultiplier.active) state.score += SCORE_WIN_BONUS;
    state.gamesWon++;
    sfx.win();
    pushPopupAtBoard("HALL CLEARED!", "is-legend");
    if (window.MrMacsCelebration && !reducedMotion) {
      try { window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#a991ff", "#4dd49b", "#5de0f0"] }); } catch (e) {}
    }
    // Bank a life by skipping the loss
    setTimeout(function () {
      // Award shards for the win
      addShards(20, GAME_ID + "-win");
      newDeal();
    }, 1800);
  }

  // No moves and stock empty + waste cycled? Lose a life.
  function isStuck() {
    if (state.stock.cards.length > 0) return false;
    if (state.waste.cards.length > 0) {
      // Player can still recycle, so check if recycling helps. As a simple heuristic:
      // peek at every card in waste to see if it can move anywhere meaningful.
      for (var i = 0; i < state.waste.cards.length; i++) {
        var c = state.waste.cards[i];
        // foundation
        for (var f = 0; f < state.foundations.length; f++) {
          if (canStackOnFoundation(c, state.foundations[f])) return false;
        }
        // tableau
        for (var t = 0; t < state.tableau.length; t++) {
          if (canStackOnTableau(c, topCard(state.tableau[t]))) return false;
        }
      }
    }
    // Tableau move?
    for (var s = 0; s < state.tableau.length; s++) {
      var srcP = state.tableau[s];
      for (var ci = 0; ci < srcP.cards.length; ci++) {
        if (!srcP.cards[ci].faceUp) continue;
        var ms = movableSubStackStart(srcP, ci);
        if (ms === -1) continue;
        var head = srcP.cards[ms];
        // Foundation from tableau top
        if (ms === srcP.cards.length - 1) {
          for (var f2 = 0; f2 < state.foundations.length; f2++) {
            if (canStackOnFoundation(head, state.foundations[f2])) return false;
          }
        }
        // Tableau dest (must change useful structure)
        for (var d = 0; d < state.tableau.length; d++) {
          if (d === s) continue;
          var dp = state.tableau[d];
          if (head.rank === R_KING && ms === 0 && dp.cards.length === 0) continue;
          if (canStackOnTableau(head, topCard(dp))) return false;
        }
      }
    }
    return true;
  }

  // -- Power-ups -------------------------------------------------------------
  // 5 power-up types: 'undo', 'hint', 'reveal', 'mult2', 'autoFoundation'
  var POWERUP_TYPES = ["undo", "hint", "reveal", "mult2", "autoFoundation"];
  var POWERUP_INFO = {
    undo:           { label: "Undo",       icon: "↩",  hint: "Revert last move (also free with U)" },
    hint:           { label: "Hint",       icon: "\u{1F4A1}", hint: "Highlight a valid move" },
    reveal:         { label: "Reveal",     icon: "\u{1F50D}", hint: "Flip one face-down tableau card" },
    mult2:          { label: "2x Score",   icon: "⭐",  hint: "Double scoring for 8 moves" },
    autoFoundation: { label: "Auto-Move",  icon: "\u{1F3AF}", hint: "Move all eligible cards to foundation" }
  };

  function maybeDropPowerup() {
    if (!state.powerups) state.powerups = [];
    if (state.powerups.length >= POWERUP_MAX) return;
    if (Math.random() > POWERUP_DROP_RATE) return;
    var t = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.powerups.push(t);
    sfx.powerupPickup();
    pushPopupAtBoard("POWER-UP: " + (POWERUP_INFO[t] ? POWERUP_INFO[t].label : t).toUpperCase(), "is-bonus");
    updatePowerupUi();
  }

  function activatePowerup(slot) {
    if (phase !== "playing") return;
    if (slot < 0 || slot >= POWERUP_MAX) return;
    var t = state.powerups[slot];
    if (!t) return;
    if (t === "undo") {
      undo();
      state.powerups.splice(slot, 1);
      sfx.powerupUse();
      updatePowerupUi();
      return;
    }
    if (t === "hint") {
      applyHint();
      state.powerups.splice(slot, 1);
      sfx.powerupUse();
      updatePowerupUi();
      return;
    }
    if (t === "reveal") {
      if (revealOneHidden()) {
        sfx.powerupUse();
        state.powerups.splice(slot, 1);
        updatePowerupUi();
      } else {
        sfx.cardInvalid();
        pushPopupAtBoard("NOTHING HIDDEN", "is-warn");
      }
      return;
    }
    if (t === "mult2") {
      state.scoreMultiplier = { active: true, movesLeft: 8 };
      showActivationHint(true, "2x SCORE · 8 moves");
      sfx.powerupUse();
      state.powerups.splice(slot, 1);
      updatePowerupUi();
      return;
    }
    if (t === "autoFoundation") {
      var moved = autoMoveAllToFoundation();
      if (!moved) {
        pushPopupAtBoard("NOTHING ELIGIBLE", "is-warn");
        sfx.cardInvalid();
      } else {
        sfx.powerupUse();
        pushPopupAtBoard("AUTO-MOVED", "is-bonus");
      }
      state.powerups.splice(slot, 1);
      updatePowerupUi();
      return;
    }
  }

  // -- Auto-Complete (built-in button on HUD) --------------------------------
  // If the deck is fully solvable from face-up state, auto-finish.
  function isAutoFinishable() {
    // All cards on tableau face-up AND no cards in stock or waste (or at least
    // movable). The standard rule: every tableau card is face-up — at that
    // point, foundations can always be filled if you keep moving smallest rank up.
    if (state.stock.cards.length > 0) return false;
    if (state.waste.cards.length > 0) return false;
    for (var t = 0; t < state.tableau.length; t++) {
      var tp = state.tableau[t];
      for (var i = 0; i < tp.cards.length; i++) {
        if (!tp.cards[i].faceUp) return false;
      }
    }
    return true;
  }

  function tryAutoFinish() {
    if (phase !== "playing") return;
    if (!isAutoFinishable()) {
      pushPopupAtBoard("NOT YET SOLVABLE", "is-warn");
      sfx.cardInvalid();
      return;
    }
    phase = "autoFinish";
    pushPopupAtBoard("AUTO-FINISH →", "is-bonus");
    autoFinishStep();
  }

  function autoFinishStep() {
    if (phase !== "autoFinish") return;
    // Find the lowest rank top card across waste/tableau that fits a foundation
    var bestMove = null;
    function consider(srcPile) {
      var c = topCard(srcPile);
      if (!c) return;
      for (var f = 0; f < state.foundations.length; f++) {
        if (canStackOnFoundation(c, state.foundations[f])) {
          if (!bestMove || c.rank < bestMove.rank) {
            bestMove = { src: srcPile, dst: state.foundations[f], rank: c.rank };
          }
          break;
        }
      }
    }
    consider(state.waste);
    for (var t = 0; t < state.tableau.length; t++) consider(state.tableau[t]);
    if (!bestMove) {
      // No more foundation moves; either won or stuck
      if (isWin()) {
        // onWin() already handled if win was via this last move; else trigger
      } else {
        phase = "playing";
      }
      return;
    }
    // Execute the move with a small delay for visual flow
    var srcPile = bestMove.src;
    var dstPile = bestMove.dst;
    var ok = moveCards(srcPile, srcPile.cards.length - 1, dstPile);
    if (!ok) { phase = "playing"; return; }
    if (phase === "question") return; // scholar fired
    setTimeout(function () { autoFinishStep(); }, reducedMotion ? 50 : 140);
  }

  // -- Scholar review --------------------------------------------------------
  function triggerScholarReview(card, foundationPile) {
    if (phase === "ended") return;
    void foundationPile;
    pauseMusic();
    state.questionsAnsweredTotal++;
    var idx = Math.floor(Math.random() * QUESTIONS.length);
    state.questionIdx = idx;
    var q = QUESTIONS[idx];
    if (dom.questionPrompt) dom.questionPrompt.textContent = q.q;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Card · " + (q.hint ? q.hint : "Bonus prompt");
    if (dom.explanation) {
      dom.explanation.textContent = "";
      dom.explanation.className = "explanation";
    }
    if (dom.choiceGrid) {
      dom.choiceGrid.innerHTML = "";
      var letters = ["A","B","C","D"];
      var indices = [0, 1, 2, 3];
      for (var s = indices.length - 1; s > 0; s--) {
        var j = Math.floor(Math.random() * (s + 1));
        var tmp = indices[s]; indices[s] = indices[j]; indices[j] = tmp;
      }
      for (var i = 0; i < indices.length; i++) {
        var origIdx = indices[i];
        var btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.type = "button";
        btn.innerHTML = '<span class="choice-letter">' + letters[i] + '.</span>' + escapeHtml(q.choices[origIdx]);
        (function (oi, b) {
          b.addEventListener("click", function () { handleScholarAnswer(oi, b); });
        })(origIdx, btn);
        dom.choiceGrid.appendChild(btn);
      }
    }
    prevPhase = phase;
    phase = "question";
    showScreen("question");
  }

  function handleScholarAnswer(chosenIdx, btn) {
    if (phase !== "question") return;
    var q = QUESTIONS[state.questionIdx];
    var correct = chosenIdx === q.correct;
    if (correct) {
      btn.classList.add("is-correct");
      if (dom.explanation) {
        dom.explanation.className = "explanation is-correct";
        dom.explanation.textContent = "Correct! +1500 pts · +12 shards.";
      }
      state.questionsAnsweredCorrect++;
      state.score += SCORE_SCHOLAR_CORRECT;
      if (state.score > state.best) { state.best = state.score; writeBest(state.best); }
      addShards(SHARDS_SCHOLAR, GAME_ID + "-scholar-correct");
      sfx.scholarCorrect();
      if (window.MrMacsCelebration && !reducedMotion) {
        try { window.MrMacsCelebration.burst({ count: 24, palette: ["#f5c451", "#a991ff", "#4dd49b"] }); } catch (e) {}
      }
    } else {
      btn.classList.add("is-wrong");
      if (dom.explanation) {
        dom.explanation.className = "explanation is-wrong";
        dom.explanation.textContent = "Not quite — but no penalty. Back to the deal!";
      }
      sfx.scholarWrong();
    }
    setTimeout(resumeFromScholar, correct ? 900 : 700);
  }

  function skipQuestion() {
    if (phase !== "question") return;
    resumeFromScholar();
  }

  function resumeFromScholar() {
    showScreen(null);
    resumeMusic();
    phase = (prevPhase === "autoFinish") ? "autoFinish" : "playing";
    // Win check was deferred while phase was "question"; perform it now that
    // the scholar card has fully landed on its foundation.
    if (isWin()) { onWin(); return; }
    if (phase === "autoFinish") {
      setTimeout(autoFinishStep, reducedMotion ? 50 : 140);
    }
  }

  // -- Drag input ------------------------------------------------------------
  // dragState captures the moving sub-stack while dragging
  var dragState = null;

  function pickPointToWorld(ev) {
    var rect = canvas.getBoundingClientRect();
    var clientX = ev.clientX != null ? ev.clientX : (ev.touches && ev.touches[0] ? ev.touches[0].clientX : 0);
    var clientY = ev.clientY != null ? ev.clientY : (ev.touches && ev.touches[0] ? ev.touches[0].clientY : 0);
    var px = (clientX - rect.left - offsetX) / scale;
    var py = (clientY - rect.top - offsetY) / scale;
    return { x: px, y: py };
  }

  // Find the topmost card under (px, py); for tableau allow picking a face-up
  // card in the middle of the stack (so the run can be dragged together).
  function pickCardAt(px, py) {
    // Iterate piles in reverse z order: stock & waste & foundations on top, then tableau
    // First check non-tableau piles (single visible top card)
    var npiles = [state.waste].concat(state.foundations).concat([state.stock]);
    for (var i = 0; i < npiles.length; i++) {
      var p = npiles[i];
      var top = topCard(p);
      if (top && pointInCard(px, py, top.x, top.y)) {
        return { pile: p, idx: p.cards.length - 1, card: top };
      }
      // Check empty pile slots (used for stock click on empty)
      if (!top) {
        if (px >= p.x && px <= p.x + CARD_W && py >= p.y && py <= p.y + CARD_H) {
          return { pile: p, idx: -1, card: null };
        }
      }
    }
    // Tableau: pick the topmost card whose rect contains the point
    for (var t = 0; t < state.tableau.length; t++) {
      var tp = state.tableau[t];
      for (var k = tp.cards.length - 1; k >= 0; k--) {
        var c = tp.cards[k];
        if (pointInCard(px, py, c.x, c.y)) {
          return { pile: tp, idx: k, card: c };
        }
      }
      // Empty tableau column
      if (tp.cards.length === 0 && px >= tp.x && px <= tp.x + CARD_W && py >= tp.y && py <= tp.y + CARD_H) {
        return { pile: tp, idx: -1, card: null };
      }
    }
    return null;
  }
  function pointInCard(px, py, cx, cy) {
    return px >= cx && px <= cx + CARD_W && py >= cy && py <= cy + CARD_H;
  }

  // Where the user clicked an empty area or didn't click a real target — return null
  function dropTargetAt(px, py, head) {
    // Foundation if this would accept a single card move
    if (head) {
      for (var f = 0; f < state.foundations.length; f++) {
        var fp = state.foundations[f];
        if (px >= fp.x && px <= fp.x + CARD_W && py >= fp.y && py <= fp.y + CARD_H) {
          if (canStackOnFoundation(head, fp)) return fp;
        }
      }
    }
    // Tableau
    for (var t = 0; t < state.tableau.length; t++) {
      var tp = state.tableau[t];
      // Use the bottom-most card's rect or the empty slot rect
      var minY = tp.y;
      var maxY = tp.y + CARD_H;
      if (tp.cards.length > 0) {
        var bottom = tp.cards[tp.cards.length - 1];
        maxY = bottom.y + CARD_H;
      }
      if (px >= tp.x && px <= tp.x + CARD_W && py >= minY && py <= maxY) {
        if (canStackOnTableau(head, topCard(tp))) return tp;
      }
    }
    return null;
  }

  function pointerDown(ev) {
    if (phase === "paused" || phase === "ended" || phase === "setup" || phase === "question") return;
    var w = pickPointToWorld(ev);
    var pick = pickCardAt(w.x, w.y);
    if (!pick) return;

    // Click on stock = draw
    if (pick.pile.type === PT_STOCK) {
      clickStock();
      return;
    }
    if (pick.idx === -1) return;
    if (pick.pile.type === PT_FOUNDATION) {
      // Only top card from a foundation, single-card drag back to tableau
      if (pick.idx !== pick.pile.cards.length - 1) return;
    } else {
      // Determine if this card and everything below forms a valid move-able run
      var startIdx = movableSubStackStart(pick.pile, pick.idx);
      if (startIdx === -1) {
        // If user clicked a face-down card on tableau top, do nothing (it stays
        // face-down until the card above moves). Otherwise, ignore.
        if (pick.pile.type === PT_TABLEAU && pick.idx === pick.pile.cards.length - 1 && !pick.card.faceUp) {
          // No-op — Klondike doesn't auto-flip on click in this build
          return;
        }
        sfx.cardInvalid();
        return;
      }
      pick.idx = startIdx;
    }

    // Begin drag
    var stack = pick.pile.cards.slice(pick.idx);
    if (!stack.length) return;
    var startMouse = w;
    var headCard = stack[0];
    var grabOffsetX = startMouse.x - headCard.x;
    var grabOffsetY = startMouse.y - headCard.y;
    dragState = {
      pile: pick.pile,
      startIdx: pick.idx,
      stack: stack,
      grabOffsetX: grabOffsetX,
      grabOffsetY: grabOffsetY,
      didMove: false,
      startMouseX: startMouse.x,
      startMouseY: startMouse.y
    };
    sfx.cardPickup();
    phase = "dragging";
    ev.preventDefault();
  }

  function pointerMove(ev) {
    if (!dragState) return;
    var w = pickPointToWorld(ev);
    var head = dragState.stack[0];
    var dx = w.x - dragState.grabOffsetX - head.x;
    var dy = w.y - dragState.grabOffsetY - head.y;
    if (!dragState.didMove) {
      var movedDist = Math.hypot(w.x - dragState.startMouseX, w.y - dragState.startMouseY);
      if (movedDist > 3) dragState.didMove = true;
    }
    for (var i = 0; i < dragState.stack.length; i++) {
      var c = dragState.stack[i];
      c.x += dx;
      c.y += dy;
    }
    ev.preventDefault();
  }

  function pointerUp(ev) {
    if (!dragState) return;
    var w = pickPointToWorld(ev);
    var head = dragState.stack[0];
    void w;
    var didMove = dragState.didMove;
    var srcPile = dragState.pile;
    var startIdx = dragState.startIdx;

    // If the user merely clicked (didn't drag), try a smart click-target move
    if (!didMove) {
      // Smart auto-route: try foundations first (only single card), else first
      // valid tableau column.
      var moved = false;
      if (dragState.stack.length === 1) {
        for (var f = 0; f < state.foundations.length; f++) {
          if (canStackOnFoundation(head, state.foundations[f])) {
            // Snap stack back to source first (visually) then commit
            snapStackBack(dragState);
            moved = moveCards(srcPile, startIdx, state.foundations[f]);
            break;
          }
        }
      }
      if (!moved) {
        // Try tableau placements
        for (var t = 0; t < state.tableau.length; t++) {
          var tp = state.tableau[t];
          if (tp === srcPile) continue;
          if (canStackOnTableau(head, topCard(tp))) {
            snapStackBack(dragState);
            moved = moveCards(srcPile, startIdx, tp);
            break;
          }
        }
      }
      if (!moved) {
        snapStackBack(dragState);
        sfx.cardInvalid();
      }
    } else {
      // Real drag: find a drop target
      var dst = dropTargetAt(head.x + CARD_W / 2, head.y + CARD_H / 2, head);
      if (dst) {
        snapStackBack(dragState);
        var ok = moveCards(srcPile, startIdx, dst);
        if (!ok) {
          // Should not happen since dropTargetAt validates
          snapStackBack(dragState);
        }
      } else {
        snapStackBack(dragState);
        sfx.cardInvalid();
      }
    }
    dragState = null;
    if (phase === "dragging") phase = "playing";
    if (ev) ev.preventDefault();
  }

  function snapStackBack(ds) {
    repositionAll(false);
    void ds;
  }

  // -- Render ----------------------------------------------------------------
  function render() {
    // Clear + cabinet bg
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#04060f";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Apply scale + offset for logical coords
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Backdrop felt
    drawFelt();

    // Pile slots (empty placeholders)
    drawSlots();

    // Cards on each pile (in order)
    var draggedCards = dragState ? dragState.stack : null;
    for (var p = 0; p < state.piles.length; p++) {
      var pile = state.piles[p];
      for (var i = 0; i < pile.cards.length; i++) {
        var c = pile.cards[i];
        if (draggedCards && draggedCards.indexOf(c) !== -1) continue; // draw later on top
        // Smooth lerp toward target pos when not dragging
        if (Math.abs(c.x - c.tx) > 0.5 || Math.abs(c.y - c.ty) > 0.5) {
          c.x += (c.tx - c.x) * 0.32;
          c.y += (c.ty - c.y) * 0.32;
        } else {
          c.x = c.tx; c.y = c.ty;
        }
        drawCard(c);
      }
    }

    // Hint highlight (pulsing border)
    if (state.hintHighlight) {
      state.hintHighlight.t += 0.08;
      var hl = state.hintHighlight;
      var alpha = 0.45 + 0.35 * Math.sin(hl.t * 4);
      if (hl.idx >= 0 && hl.pile && hl.pile.cards[hl.idx]) {
        var hc = hl.pile.cards[hl.idx];
        ctx.save();
        ctx.strokeStyle = "rgba(245,196,81," + alpha.toFixed(3) + ")";
        ctx.lineWidth = 4;
        roundedRectPath(hc.x - 4, hc.y - 4, CARD_W + 8, CARD_H + 8, CARD_R + 2);
        ctx.stroke();
        ctx.restore();
      } else if (hl.pile && hl.idx === -1) {
        // Stock highlight
        ctx.save();
        ctx.strokeStyle = "rgba(245,196,81," + alpha.toFixed(3) + ")";
        ctx.lineWidth = 4;
        roundedRectPath(hl.pile.x - 4, hl.pile.y - 4, CARD_W + 8, CARD_H + 8, CARD_R + 2);
        ctx.stroke();
        ctx.restore();
      }
      // Auto-fade after some time
      if (hl.t > 1.6) state.hintHighlight = null;
    }

    // Dragged stack on top
    if (draggedCards) {
      for (var k = 0; k < draggedCards.length; k++) {
        var dc = draggedCards[k];
        // Apply small lift shadow
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;
        drawCard(dc, true);
        ctx.restore();
      }
    }

    // HUD overlay rendered via DOM, not canvas — but draw minor indicators here
    drawIndicators();

    // Particles
    drawParticles();

    ctx.restore();
  }

  function drawFelt() {
    var w = LOGICAL_W, h = LOGICAL_H;
    var grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, "#0f1c34");
    grad.addColorStop(1, "#04060f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Subtle vignette dots
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#a991ff";
    for (var i = 0; i < 80; i++) {
      var rx = (i * 137) % w;
      var ry = (i * 73 + 41) % h;
      ctx.fillRect(rx, ry, 1, 1);
    }
    ctx.restore();
  }

  function drawSlots() {
    var slots = [state.stock, state.waste].concat(state.foundations).concat(state.tableau);
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      drawEmptyPile(s);
    }
    // Foundation suit watermarks — always draw behind cards so player can see target suit
    for (var f = 0; f < state.foundations.length; f++) {
      var fp = state.foundations[f];
      var topF = fp.cards.length > 0 ? fp.cards[0] : null;
      if (!topF) continue; // no suit established yet; generic 'A' already drawn in drawEmptyPile
      var sc = SUIT_COLOR[topF.suit];
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = sc.base;
      roundedRectPath(fp.x, fp.y, CARD_W, CARD_H, CARD_R);
      ctx.fill();
      // Suit glyph watermark centered
      ctx.globalAlpha = 0.13;
      drawSuitGlyph(topF.suit, fp.x + CARD_W / 2 - 20, fp.y + CARD_H / 2 - 20, 40);
      ctx.restore();
    }
  }

  function drawEmptyPile(pile) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    roundedRectPath(pile.x, pile.y, CARD_W, CARD_H, CARD_R);
    ctx.fill();
    ctx.stroke();
    // Slot label
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var label = "";
    if (pile.type === PT_STOCK) label = state.stock.cards.length === 0 ? "RECYCLE" : "STOCK";
    else if (pile.type === PT_WASTE) label = "WASTE";
    else if (pile.type === PT_FOUNDATION) label = "FOUNDATION";
    else if (pile.type === PT_TABLEAU) label = "";
    if (label) ctx.fillText(label, pile.x + CARD_W / 2, pile.y + CARD_H / 2);
    // Foundation suit hint
    if (pile.type === PT_FOUNDATION && pile.cards.length === 0) {
      // No predetermined suit; just show 'A' watermark
      ctx.font = "900 36px 'Fraunces', serif";
      ctx.fillStyle = "rgba(245,196,81,0.10)";
      ctx.fillText("A", pile.x + CARD_W / 2, pile.y + CARD_H / 2 + 16);
    }
    ctx.restore();
  }

  function drawCard(card, lifted) {
    var x = card.x;
    var y = card.y;
    if (lifted) y -= DRAG_LIFT;

    if (!card.faceUp) {
      drawCardBack(x, y);
      return;
    }
    // Card background
    ctx.save();
    var grad = ctx.createLinearGradient(x, y, x, y + CARD_H);
    grad.addColorStop(0, "#fafcff");
    grad.addColorStop(1, "#dde3f2");
    ctx.fillStyle = grad;
    roundedRectPath(x, y, CARD_W, CARD_H, CARD_R);
    ctx.fill();
    // Outer rim
    ctx.strokeStyle = card.scholar ? "#f5c451" : "rgba(0,0,0,0.20)";
    ctx.lineWidth = card.scholar ? 3 : 1.2;
    ctx.stroke();

    if (card.scholar) {
      // Inner gold halo
      ctx.save();
      ctx.shadowColor = "rgba(245,196,81,0.55)";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "rgba(245,196,81,0.8)";
      ctx.lineWidth = 1.8;
      roundedRectPath(x + 2, y + 2, CARD_W - 4, CARD_H - 4, CARD_R - 2);
      ctx.stroke();
      ctx.restore();
    }

    // Rank + suit corners
    var sc = SUIT_COLOR[card.suit];
    var rankStr = RANK_LABEL[card.rank];
    ctx.fillStyle = sc.dark;
    ctx.font = "900 19px 'Fraunces', serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(rankStr, x + 8, y + 8);
    drawSuitGlyph(card.suit, x + 8, y + 28, 18);

    ctx.save();
    ctx.translate(x + CARD_W, y + CARD_H);
    ctx.rotate(Math.PI);
    ctx.fillStyle = sc.dark;
    ctx.font = "900 19px 'Fraunces', serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(rankStr, 8, 8);
    drawSuitGlyph(card.suit, 8, 28, 18);
    ctx.restore();

    // Center face: large suit, scholar marker if scholar
    var centerY = y + CARD_H / 2;
    if (card.rank >= 11) {
      // Court card: render a stylized rank letter with suit glyph
      ctx.fillStyle = sc.base;
      ctx.font = "900 56px 'Fraunces', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(rankStr, x + CARD_W / 2, centerY - 6);
      drawSuitGlyph(card.suit, x + CARD_W / 2 - 16, centerY + 14, 32);
    } else if (card.rank === R_ACE) {
      drawSuitGlyph(card.suit, x + CARD_W / 2 - 26, centerY - 26, 52);
    } else {
      // Pip layout: scaled glyphs by rank
      drawPips(card, x, y);
    }

    if (card.scholar) {
      // ? mark in the middle-bottom for scholar
      ctx.fillStyle = "#a96e3d";
      ctx.font = "900 18px 'Fraunces', serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("?", x + CARD_W - 10, y + CARD_H - 8);
    }

    ctx.restore();
  }

  function drawCardBack(x, y) {
    ctx.save();
    var grad = ctx.createLinearGradient(x, y, x + CARD_W, y + CARD_H);
    grad.addColorStop(0, "#1a2238");
    grad.addColorStop(1, "#0a1224");
    ctx.fillStyle = grad;
    roundedRectPath(x, y, CARD_W, CARD_H, CARD_R);
    ctx.fill();
    ctx.strokeStyle = "rgba(245,196,81,0.40)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Diamond pattern
    ctx.save();
    ctx.beginPath();
    roundedRectPath(x + 6, y + 6, CARD_W - 12, CARD_H - 12, CARD_R - 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(169,145,255,0.20)";
    ctx.lineWidth = 1;
    var step = 14;
    for (var dx = -CARD_H; dx < CARD_W + CARD_H; dx += step) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx + CARD_H, y + CARD_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + dx, y + CARD_H);
      ctx.lineTo(x + dx + CARD_H, y);
      ctx.stroke();
    }
    ctx.restore();
    // Center monogram
    ctx.fillStyle = "rgba(245,196,81,0.85)";
    ctx.font = "900 22px 'Fraunces', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MAC", x + CARD_W / 2, y + CARD_H / 2 - 6);
    ctx.fillStyle = "rgba(245,196,81,0.55)";
    ctx.font = "700 9px 'JetBrains Mono', monospace";
    ctx.fillText("REVIEW HALL", x + CARD_W / 2, y + CARD_H / 2 + 14);
    ctx.restore();
  }

  function drawSuitGlyph(suit, x, y, size) {
    var sc = SUIT_COLOR[suit];
    ctx.save();
    ctx.fillStyle = sc.base;
    ctx.strokeStyle = sc.dark;
    ctx.lineWidth = 1;
    var cx = x + size / 2;
    var cy = y + size / 2;
    if (suit === S_SCROLLS) {
      // Scroll: a vertical rolled paper with horizontal stripes
      var w = size * 0.7;
      var h = size * 0.85;
      ctx.fillStyle = sc.base;
      roundedRectPath(cx - w / 2, cy - h / 2, w, h, size * 0.16);
      ctx.fill();
      ctx.strokeStyle = sc.dark;
      ctx.lineWidth = Math.max(1, size * 0.05);
      ctx.beginPath();
      ctx.moveTo(cx - w / 2 + size * 0.1, cy - h * 0.18);
      ctx.lineTo(cx + w / 2 - size * 0.1, cy - h * 0.18);
      ctx.moveTo(cx - w / 2 + size * 0.1, cy + h * 0.05);
      ctx.lineTo(cx + w / 2 - size * 0.1, cy + h * 0.05);
      ctx.stroke();
      // Top + bottom rolls
      ctx.fillStyle = sc.dark;
      roundedRectPath(cx - w / 2, cy - h / 2 - size * 0.06, w, size * 0.12, size * 0.08);
      ctx.fill();
      roundedRectPath(cx - w / 2, cy + h / 2 - size * 0.06, w, size * 0.12, size * 0.08);
      ctx.fill();
    } else if (suit === S_ATOMS) {
      // Atom: nucleus + 2 ellipses crossing
      ctx.lineWidth = Math.max(1.2, size * 0.07);
      ctx.strokeStyle = sc.base;
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.46, size * 0.18, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.46, size * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = sc.dark;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sc.base;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
    } else if (suit === S_COMPASSES) {
      // Compass: a star/cross with circle
      ctx.fillStyle = sc.base;
      ctx.strokeStyle = sc.dark;
      ctx.lineWidth = Math.max(1, size * 0.06);
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.46);
      ctx.lineTo(cx + size * 0.10, cy - size * 0.10);
      ctx.lineTo(cx + size * 0.46, cy);
      ctx.lineTo(cx + size * 0.10, cy + size * 0.10);
      ctx.lineTo(cx, cy + size * 0.46);
      ctx.lineTo(cx - size * 0.10, cy + size * 0.10);
      ctx.lineTo(cx - size * 0.46, cy);
      ctx.lineTo(cx - size * 0.10, cy - size * 0.10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = sc.dark;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.10, 0, Math.PI * 2);
      ctx.fill();
    } else if (suit === S_PALETTES) {
      // Palette: rounded shape with thumb hole and 3 paint dots
      ctx.fillStyle = sc.base;
      ctx.strokeStyle = sc.dark;
      ctx.lineWidth = Math.max(1, size * 0.05);
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.42, cy + size * 0.15);
      ctx.bezierCurveTo(cx - size * 0.50, cy - size * 0.15,
                        cx - size * 0.20, cy - size * 0.45,
                        cx + size * 0.10, cy - size * 0.40);
      ctx.bezierCurveTo(cx + size * 0.42, cy - size * 0.32,
                        cx + size * 0.46, cy + size * 0.10,
                        cx + size * 0.18, cy + size * 0.30);
      ctx.bezierCurveTo(cx + size * 0.04, cy + size * 0.36,
                        cx - size * 0.10, cy + size * 0.18,
                        cx - size * 0.20, cy + size * 0.32);
      ctx.bezierCurveTo(cx - size * 0.34, cy + size * 0.42,
                        cx - size * 0.46, cy + size * 0.30,
                        cx - size * 0.42, cy + size * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Thumb hole
      ctx.fillStyle = "#0a1224";
      ctx.beginPath();
      ctx.arc(cx - size * 0.20, cy + size * 0.10, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      // Paint dots
      ctx.fillStyle = "#5de0f0";
      ctx.beginPath(); ctx.arc(cx + size * 0.06, cy - size * 0.20, size * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f5c451";
      ctx.beginPath(); ctx.arc(cx + size * 0.20, cy - size * 0.05, size * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d04848";
      ctx.beginPath(); ctx.arc(cx + size * 0.10, cy + size * 0.12, size * 0.06, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawPips(card, x, y) {
    // Standard 2..10 pip layout
    var n = card.rank;
    // Coordinates as fractions of card area
    var positions = pipPositionsForRank(n);
    var size = 18;
    for (var i = 0; i < positions.length; i++) {
      var pp = positions[i];
      var px = x + pp.x * CARD_W - size / 2;
      var py = y + pp.y * CARD_H - size / 2;
      ctx.save();
      if (pp.flip) {
        ctx.translate(px + size, py + size);
        ctx.rotate(Math.PI);
        drawSuitGlyph(card.suit, 0, 0, size);
      } else {
        drawSuitGlyph(card.suit, px, py, size);
      }
      ctx.restore();
    }
  }
  // Returns array of {x, y, flip} where x/y are fractional 0..1
  // Compact pip table (rank 2..10). Each glyph in row 5..6 is rotated (flip:true).
  var PIP_LAYOUT = {
    2:  [[0.5,0.22,0],[0.5,0.78,1]],
    3:  [[0.5,0.22,0],[0.5,0.5,0],[0.5,0.78,1]],
    4:  [[0.3,0.22,0],[0.7,0.22,0],[0.3,0.78,1],[0.7,0.78,1]],
    5:  [[0.3,0.22,0],[0.7,0.22,0],[0.5,0.5,0],[0.3,0.78,1],[0.7,0.78,1]],
    6:  [[0.3,0.22,0],[0.7,0.22,0],[0.3,0.5,0],[0.7,0.5,0],[0.3,0.78,1],[0.7,0.78,1]],
    7:  [[0.3,0.22,0],[0.7,0.22,0],[0.5,0.28,0],[0.3,0.5,0],[0.7,0.5,0],[0.3,0.78,1],[0.7,0.78,1]],
    8:  [[0.3,0.22,0],[0.7,0.22,0],[0.5,0.28,0],[0.3,0.5,0],[0.7,0.5,0],[0.5,0.72,1],[0.3,0.78,1],[0.7,0.78,1]],
    9:  [[0.3,0.22,0],[0.7,0.22,0],[0.3,0.34,0],[0.7,0.34,0],[0.5,0.5,0],[0.3,0.66,1],[0.7,0.66,1],[0.3,0.78,1],[0.7,0.78,1]],
    10: [[0.3,0.22,0],[0.7,0.22,0],[0.3,0.34,0],[0.7,0.34,0],[0.5,0.30,0],[0.5,0.70,1],[0.3,0.66,1],[0.7,0.66,1],[0.3,0.78,1],[0.7,0.78,1]]
  };
  function pipPositionsForRank(rank) {
    var arr = PIP_LAYOUT[rank];
    if (!arr) return [];
    var ps = [];
    for (var i = 0; i < arr.length; i++) ps.push({ x: arr[i][0], y: arr[i][1], flip: !!arr[i][2] });
    return ps;
  }

  function drawIndicators() {
    // Foundation progress mini-bar in the goal ribbon (rendered via DOM)
  }

  // -- Particles -------------------------------------------------------------
  function spawnParticleBurst(x, y, color, count) {
    if (reducedMotion) return;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = 0.6 + Math.random() * 1.6;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 0.6,
        life: 1.0,
        color: color || "#f5c451",
        size: 2 + Math.random() * 2
      });
    }
  }
  function updateParticles(dt) {
    if (!state.particles) return;
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];
      p.life -= dt * 1.6;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }
  function drawParticles() {
    if (!state.particles || !state.particles.length) return;
    ctx.save();
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  }

  // -- HUD updates -----------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudMoves) dom.hudMoves.textContent = String(state.moveCount);
    if (dom.hudGame) dom.hudGame.textContent = String(state.gameNumber);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score || 0));
    if (dom.goalName) dom.goalName.textContent = isWin() ? "Hall cleared!" : ("Build all four foundations · Game " + state.gameNumber);
    if (dom.goalMeta) {
      var fcards = 0;
      for (var i = 0; i < state.foundations.length; i++) fcards += state.foundations[i].cards.length;
      dom.goalMeta.textContent = "Foundations " + fcards + "/52 · Stock cycles " + state.stockCycles + " · Undos " + state.undosUsed + "/" + UNDO_MAX_PER_GAME;
    }
    // Auto-finish button: show ready state when conditions are met
    if (dom.autoCompleteBtn) {
      var canAF = phase === "playing" && isAutoFinishable();
      dom.autoCompleteBtn.classList.toggle("is-ready", canAF);
      dom.autoCompleteBtn.title = canAF
        ? "All cards face-up — click to auto-complete!"
        : "Auto-Finish (available when stock/waste empty and all tableau cards are face-up)";
    }
  }

  function updatePowerupUi() {
    for (var i = 0; i < dom.powerupSlots.length; i++) {
      var s = dom.powerupSlots[i];
      if (!s) continue;
      var t = state.powerups[i];
      var iconEl = s.querySelector(".pu-icon");
      if (t) {
        s.classList.add("is-filled");
        if (iconEl) iconEl.textContent = POWERUP_INFO[t] ? POWERUP_INFO[t].icon : "?";
        var info = POWERUP_INFO[t];
        s.setAttribute("aria-label", "Power-up " + (i + 1) + ": " + (info ? info.label : t));
        s.title = info ? info.label + " — " + info.hint : t;
      } else {
        s.classList.remove("is-filled");
        if (iconEl) iconEl.textContent = "";
        s.setAttribute("aria-label", "Power-up slot " + (i + 1) + " (empty)");
        s.title = "Empty slot — earn power-ups by foundation drops";
      }
    }
  }

  function showActivationHint(show, text) {
    if (!dom.activationHint) return;
    if (show) {
      if (text && dom.activationHintText) dom.activationHintText.textContent = text;
      dom.activationHint.classList.add("show");
    } else {
      dom.activationHint.classList.remove("show");
    }
  }

  // -- Popups (DOM overlay) --------------------------------------------------
  function pushPopupAtBoard(text, cls) {
    if (!dom.popupOverlay) return;
    var el = document.createElement("div");
    el.className = "popup-text" + (cls ? " " + cls : "");
    el.textContent = text;
    el.style.left = "50%";
    el.style.top = "55%";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
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
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, { games: state.gameNumber, won: state.gamesWon });
      }
    } catch (e) {}
  }
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          gameNumber: state.gameNumber,
          lives: state.lives,
          gamesWon: state.gamesWon,
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
          file: "games/solitaire-hall/index.html"
        });
      }
    } catch (e) {}
  }
  function recordRunCompletion() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordCompletion) {
        window.MrMacsProfile.recordCompletion(GAME_ID, state.score);
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
        window.MrMacsArcadeMusic.start("archive-dusk", { volume: 0.45 });
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

  // -- Input bindings --------------------------------------------------------
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing" || phase === "dragging") {
        if (k === "u" || k === "U") { undo(); e.preventDefault(); return; }
        if (k === "h" || k === "H") { applyHint(); e.preventDefault(); return; }
        if (k === "a" || k === "A") { tryAutoFinish(); e.preventDefault(); return; }
        if (k === "n" || k === "N") { newDeal(); e.preventDefault(); return; }
        if (k === "1") { activatePowerup(0); e.preventDefault(); return; }
        if (k === "2") { activatePowerup(1); e.preventDefault(); return; }
        if (k === "3") { activatePowerup(2); e.preventDefault(); return; }
        if (k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
        if (k === "Escape" || k === "Esc") { togglePause(); e.preventDefault(); return; }
      } else if (phase === "paused") {
        if (k === "p" || k === "P" || k === " " || k === "Escape" || k === "Esc") {
          togglePause(); e.preventDefault(); return;
        }
      } else if (phase === "question") {
        if (k === "Escape" || k === "Esc") { skipQuestion(); e.preventDefault(); return; }
      }
    });

    canvas.addEventListener("mousedown", pointerDown);
    window.addEventListener("mousemove", pointerMove);
    window.addEventListener("mouseup", pointerUp);

    canvas.addEventListener("touchstart", pointerDown, { passive: false });
    canvas.addEventListener("touchmove", function (ev) {
      pointerMove(ev);
    }, { passive: false });
    canvas.addEventListener("touchend", pointerUp, { passive: false });
    canvas.addEventListener("touchcancel", pointerUp, { passive: false });
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing" || phase === "dragging") {
      prevPhase = phase;
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
    if (dom.startBtn) dom.startBtn.addEventListener("click", function () { clearSnapshot(); startNewRun(); });
    if (dom.resumeBtn) dom.resumeBtn.addEventListener("click", togglePause);
    if (dom.restartBtn) dom.restartBtn.addEventListener("click", function () { clearSnapshot(); startNewRun(); });
    if (dom.pauseExitBtn) dom.pauseExitBtn.addEventListener("click", exitToArcade);
    if (dom.exitBtn) dom.exitBtn.addEventListener("click", exitToArcade);
    if (dom.pauseBtn) dom.pauseBtn.addEventListener("click", togglePause);
    if (dom.newDealBtn) dom.newDealBtn.addEventListener("click", function () { newDeal(); });
    if (dom.autoCompleteBtn) dom.autoCompleteBtn.addEventListener("click", function () { tryAutoFinish(); });
    if (dom.setupBtn) dom.setupBtn.addEventListener("click", function () {
      clearSnapshot();
      phase = "setup";
      stopMusic();
      showScreen("setup");
      renderSetupExtras();
    });
    if (dom.againBtn) dom.againBtn.addEventListener("click", function () { clearSnapshot(); startNewRun(); });
    if (dom.questionCloseBtn) dom.questionCloseBtn.addEventListener("click", skipQuestion);
    if (dom.soundBtn) dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) stopMusic();
      else if (phase === "playing") startMusic();
    });
    if (dom.fullscreenBtn) dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      } catch (e) {}
    });
    for (var i = 0; i < dom.powerupSlots.length; i++) {
      (function (idx) {
        var s = dom.powerupSlots[idx];
        if (!s) return;
        s.addEventListener("click", function () { activatePowerup(idx); });
      })(i);
    }
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("solitaire-hall");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "solitaire-hall", { compact: false });
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

  // ── Help overlay ───────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      window.MrMacsHelpOverlay.register("solitaire-hall", {
        title: "How to Play Solitaire Hall",
        goal: "Move all 52 cards onto the four foundation piles in suit order (Ace → King) to win the Vegas draw-3 game.",
        controls: [
          { key: "Click stock pile",   action: "Deal 3 cards from the deck" },
          { key: "Drag / Drop",        action: "Move a card or run to a tableau column or foundation" },
          { key: "Touch drag",         action: "Same as mouse drag on touchscreens" },
          { key: "Esc / P",            action: "Pause" }
        ],
        tips: [
          "Only Kings (or runs starting with a King) can fill an empty tableau column.",
          "Uncover face-down tableau cards as fast as possible — they're your hidden resources.",
          "Power-ups drop occasionally on foundation moves: Undo, Reveal, Skip-Time, and 2× Score."
        ],
        scholar: "Scholar cards have a golden back. Playing one to a foundation triggers a review challenge — answer correctly for a shard bonus."
      });
      var _helpSetupActions = document.querySelector("#setupScreen .setup-actions");
      if (_helpSetupActions) window.MrMacsHelpOverlay.mountButton(_helpSetupActions, "solitaire-hall");
    }
  } catch (e) {}
  }

  function exitToArcade() {
    stopMusic();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  // -- Run lifecycle ---------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    state = {
      score: opts.score || 0,
      best: opts.best != null ? opts.best : readBest(),
      gameNumber: opts.gameNumber || 1,
      gamesWon: opts.gamesWon || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      moveCount: 0,
      stockCycles: 0,
      undosUsed: 0,
      shardsAwarded: 0,
      gameStartedAt: Date.now(),
      durationMs: 0,

      piles: [],
      stock: null,
      waste: null,
      foundations: [],
      tableau: [],

      history: [],
      hintHighlight: null,
      scoreMultiplier: { active: false, movesLeft: 0 },
      powerups: [],
      particles: [],

      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      questionIdx: -1
    };
    // Apply ante for new deal
    state.score += SCORE_DEAL;
    deal();
  }

  function startNewRun() {
    initState({});
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    updatePowerupUi();
    recordPlayWithProfile();
  }

  function newDeal() {
    if (!state) { startNewRun(); return; }
    // Charge a life if we hadn't won
    if (!isWin()) {
      // Only charge a life if the deck wasn't winnable. If isStuck() => deck was effectively over.
      // Either way, deduct a life when player chooses "New Deal" unless this came after a win.
      state.lives--;
      if (state.lives <= 0) {
        sfx.gameOver();
        gameOver();
        return;
      }
      sfx.lifeLost();
      pushPopupAtBoard("LIFE LOST", "is-warn");
    }
    // Keep cumulative score, increment game number
    state.gameNumber++;
    state.moveCount = 0;
    state.stockCycles = 0;
    state.undosUsed = 0;
    state.history = [];
    state.scoreMultiplier = { active: false, movesLeft: 0 };
    state.powerups = [];
    state.stuckHandled = false;
    state.score += SCORE_DEAL;
    deal();
    phase = "playing";
    updateHud();
    updatePowerupUi();
    if (!soundOn) stopMusic(); else startMusic();
  }

  function gameOver() {
    phase = "ended";
    state.durationMs = Date.now() - state.gameStartedAt;
    if (state.score > state.best) { state.best = state.score; writeBest(state.best); }
    try { recordRunCompletion(); } catch (e) {}
    showEndScreen();
  }

  function showEndScreen() {
    if (phase !== "ended") return;
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Solitaire Hall Bested You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Solitaire Hall · Run complete";
    if (dom.endGrid) {
      var maxBest = Math.max(state.best || 0, state.score);
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Games Played</div><div class="end-cell-value">' + state.gameNumber + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Halls Cleared</div><div class="end-cell-value">' + state.gamesWon + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Moves</div><div class="end-cell-value">' + state.moveCount + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(maxBest) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    stopMusic();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    var snapState = snap && snap.state ? snap.state : snap;
    if (snapState && (snapState.score || snapState.gameNumber) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snapState.score || 0) +
        ' &middot; Game ' + (snapState.gameNumber || 1) +
        ' &middot; Lives ' + (snapState.lives != null ? snapState.lives : LIVES_INIT) + '</div>' +
        '<div class="resume-actions">' +
          '<button class="btn glass-pill" id="resumeRunBtn">Resume Run</button>' +
          '<button class="btn glass-pill" id="discardRunBtn">New Run</button>' +
        '</div>';
      var rb = $("resumeRunBtn");
      if (rb) rb.addEventListener("click", function () {
        // Resume: keep score + gameNumber + lives but reshuffle a fresh deck
        initState({
          score: snapState.score || 0,
          gameNumber: snapState.gameNumber || 1,
          gamesWon: snapState.gamesWon || 0,
          lives: snapState.lives != null ? snapState.lives : LIVES_INIT,
          best: readBest()
        });
        showScreen(null);
        phase = "playing";
        startMusic();
        updateHud();
        updatePowerupUi();
        recordPlayWithProfile();
      });
      var db = $("discardRunBtn");
      if (db) db.addEventListener("click", function () { clearSnapshot(); startNewRun(); });
    } else if (dom.resumeCard) {
      dom.resumeCard.hidden = true;
      dom.resumeCard.innerHTML = "";
    }
    if (dom.leaderboardPanel && window.MrMacsLeaderboards && window.MrMacsLeaderboards.top) {
      try {
        var top = window.MrMacsLeaderboards.top(GAME_ID, 5);
        if (top && top.length) {
          var html = '<div class="leaderboard-title">Top 5 Solitaire Hall Scores</div>';
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
    var chromeBottom = 0;
    [".top-hud", ".wave-ribbon"].forEach(function (selector) {
      var el = document.querySelector(selector);
      if (!el) return;
      var style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      var box = el.getBoundingClientRect();
      chromeBottom = Math.max(chromeBottom, box.bottom - rect.top);
    });
    // 24px (was 16) buffer — gives clearance to the smoke-test threshold of
    // chromeBottom + 4 and absorbs the 2-6px FOUT layout shift that lands
    // after the May 22 perf pass made the game.js script `defer` (chrome
    // gets its initial size with fallback fonts, grows when the real font
    // arrives, and the cards otherwise stay anchored to the smaller chrome).
    var dealRowTop = Math.max(0, chromeBottom) + 24;
    var sx = rect.width / LOGICAL_W;
    var sy = rect.height / LOGICAL_H;
    scale = Math.min(sx, sy);
    if (dealRowTop > 10) {
      var protectedHeightScale = (rect.height - dealRowTop - 6) / (LOGICAL_H - ROW_TOP);
      if (protectedHeightScale > 0) {
        scale = Math.min(scale, protectedHeightScale);
      }
    }
    offsetX = (rect.width - LOGICAL_W * scale) / 2;
    offsetY = (rect.height - LOGICAL_H * scale) / 2;
    if (dealRowTop > 10 && offsetY + ROW_TOP * scale < dealRowTop) {
      offsetY = dealRowTop - ROW_TOP * scale;
    }
  }

  // -- Utilities -------------------------------------------------------------
  function formatNumber(n) {
    if (n == null) return "0";
    var sign = n < 0 ? "-" : "";
    return sign + Math.abs(Math.floor(n)).toLocaleString();
  }
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function roundedRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // -- Main loop -------------------------------------------------------------
  function update(dt) {
    void dt;
    if (!state) return;
    if (phase === "playing") {
      // Stuck detection (only when stock empty AND waste empty AND no moves)
      if (!isWin() && state.stock.cards.length === 0 && state.waste.cards.length === 0 && isStuck()) {
        // Only trigger once per game; here we simply mark it and prompt new deal
        if (!state.stuckHandled) {
          state.stuckHandled = true;
          pushPopupAtBoard("NO MORE MOVES", "is-warn");
          setTimeout(function () { newDeal(); }, 1100);
        }
      }
    }
  }
  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    if (state) {
      if (phase === "playing") {
        if (ts - lastSnapshotTs > SNAPSHOT_INTERVAL_MS) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
      }
    }
    update(dt);
    if (state) {
      updateParticles(dt);
    }
    if (state) render();
    if (phase !== "setup" && phase !== "ended") {
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
    // Re-run resize when the HUD or ribbon resizes (e.g. when web fonts
    // finish swapping in after the deferred script load completes). This
    // closes the FOUT race that left cards anchored to the pre-swap chrome
    // height after the May 22 perf pass moved game.js to `defer`.
    if (typeof ResizeObserver === "function") {
      try {
        var roTargets = [document.querySelector(".top-hud"), document.querySelector(".wave-ribbon")].filter(Boolean);
        if (roTargets.length) {
          var ro = new ResizeObserver(function () { resize(); });
          roTargets.forEach(function (el) { ro.observe(el); });
        }
      } catch (_e) { /* old browser — fall back to window resize alone */ }
    }
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
      document.fonts.ready.then(function () { resize(); }).catch(function () {});
    }
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
    var GAME_ID_LOCAL = "solitaire-hall";
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
