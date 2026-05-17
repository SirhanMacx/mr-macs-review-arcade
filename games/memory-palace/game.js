/* ===========================================================================
   Memory Palace — Concentration / pair match · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · 3 stages (4x4, 6x4, 6x6)
   30 unique editorial card faces (figures, symbols, period markers, civics)
   Scholar pairs with gilt rim trigger optional review questions.
   5 power-ups: Peek, +30s, Shuffle Mismatch, 2x Mult, Reveal Pair
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "memory-palace";
  var GAME_TITLE = "Memory Palace";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  // Difficulty configs
  var GRID_CONFIGS = {
    "4x4": { cols: 4, rows: 4, pairs: 8,  time: 90,  label: "4 × 4" },
    "6x4": { cols: 6, rows: 4, pairs: 12, time: 150, label: "6 × 4" },
    "6x6": { cols: 6, rows: 6, pairs: 18, time: 240, label: "6 × 6" }
  };
  var STAGE_ORDER = ["4x4", "6x4", "6x6"];

  // Game-wide
  var LIVES_INIT = 3;
  var SHARDS_CAP = 200;
  var POWERUP_CAP = 3;
  var WRONG_STREAK_LIMIT = 8;        // 8+ wrong in a row -> lose life
  var FLIP_BACK_DELAY_MS = 800;      // mismatch flip-back delay
  var SCHOLAR_FLIP_DELAY_MS = 600;   // pause before opening review modal

  // Scoring
  var BASE_MATCH_SCORE = 500;
  var TIME_BONUS_FACTOR = 5;     // per second remaining at match
  var STAGE_CLEAR_TIME_BONUS = 100;  // x remaining seconds
  var MISMATCH_PENALTY = 50;
  var SCHOLAR_BONUS = 1500;
  var SCHOLAR_SHARDS = 12;
  var RUN_COMPLETE_SHARDS = 30;
  var SCORE_TO_SHARDS_RATIO = 200;

  // Scholar count per stage (1-2 cards form a pair)
  function pickScholarCount(stage) {
    // 1 pair on 4x4, 1-2 on 6x4 and 6x6
    if (stage === 1) return 1;
    return Math.random() < 0.5 ? 1 : 2;
  }

  // -- Inline review bank (28 entries) --------------------------------------
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence", hint: "Home of the Medici banking family." },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg", hint: "Mainz, ~1450 — Bibles." },
    { prompt: "The Protestant Reformation began with:", choices: ["Luther's 95 Theses", "The Council of Trent", "Henry VIII's annulment", "Calvin's Institutes"], correctText: "Luther's 95 Theses", hint: "Wittenberg, 1517." },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, diseases between hemispheres", "A 1492 trade treaty", "Slave trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, diseases between hemispheres", hint: "Old World plus New World biology." },
    { prompt: "Which technology most enabled European long-distance voyages?", choices: ["The astrolabe and caravel", "The compound microscope", "The cotton gin", "The seed drill"], correctText: "The astrolabe and caravel", hint: "Navigation plus nimble ship." },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain", hint: "Coal, textiles, late 1700s." },
    { prompt: "Which invention most powered early factories?", choices: ["The steam engine", "The electric motor", "The internal combustion engine", "The assembly line"], correctText: "The steam engine", hint: "Watt, 1769 patent." },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "German unification", "Russian Revolution"], correctText: "Assassination of Archduke Franz Ferdinand", hint: "Sarajevo, June 1914." },
    { prompt: "Trench warfare on the Western Front was characterized by:", choices: ["Stalemate and high casualties", "Rapid cavalry advances", "Aerial bombing of cities", "Naval blockade only"], correctText: "Stalemate and high casualties", hint: "Mud, machine guns, no man's land." },
    { prompt: "The Treaty of Versailles (1919) blamed the war primarily on:", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany", hint: "War-guilt clause, Article 231." },
    { prompt: "The Cold War was a struggle primarily between:", choices: ["U.S. and Soviet Union", "U.S. and China", "Britain and France", "Germany and Russia"], correctText: "U.S. and Soviet Union", hint: "Capitalism vs. communism, 1947 to 1991." },
    { prompt: "The Marshall Plan (1948) provided:", choices: ["Economic aid to rebuild Western Europe", "Military aid to South Korea", "Nuclear technology to NATO allies", "Loans to Latin America"], correctText: "Economic aid to rebuild Western Europe", hint: "$13 billion postwar package." },
    { prompt: "The doctrine of containment aimed to:", choices: ["Stop the spread of communism", "Roll back Soviet borders", "Promote free trade in Asia", "End nuclear weapons"], correctText: "Stop the spread of communism", hint: "Kennan's long telegram." },
    { prompt: "The Cuban Missile Crisis (1962) ended when:", choices: ["The Soviet Union withdrew missiles from Cuba", "Cuba renounced communism", "The U.S. invaded Cuba", "Khrushchev was removed from power"], correctText: "The Soviet Union withdrew missiles from Cuba", hint: "Quid pro quo on Turkey missiles." },
    { prompt: "Brown v. Board of Education (1954) ruled:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional", hint: "Overturned 'separate but equal'." },
    { prompt: "The Montgomery Bus Boycott was sparked by:", choices: ["Rosa Parks' arrest", "The March on Washington", "The Voting Rights Act", "Plessy v. Ferguson"], correctText: "Rosa Parks' arrest", hint: "December 1, 1955." },
    { prompt: "The Civil Rights Act of 1964:", choices: ["Banned discrimination in public accommodations", "Created the EPA", "Established Medicare", "Ended the Vietnam War"], correctText: "Banned discrimination in public accommodations", hint: "Title II covers hotels and restaurants." },
    { prompt: "Sputnik (1957), launched by the USSR, triggered:", choices: ["The U.S. space race and NASA's founding", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The U.S. space race and NASA's founding", hint: "First artificial satellite." },
    { prompt: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Declaration of Independence", "Constitution", "Bill of Rights", "Federalist No. 10"], correctText: "Declaration of Independence", hint: "Jefferson, 1776." },
    { prompt: "Checks and balances divides power among:", choices: ["Three branches of government", "Federal and state", "Senate and House", "Citizens and government"], correctText: "Three branches of government", hint: "Legislative, executive, judicial." },
    { prompt: "The 13th Amendment (1865):", choices: ["Abolished slavery", "Granted voting rights to women", "Created income tax", "Gave Black men the vote"], correctText: "Abolished slavery", hint: "Ratified after the Civil War." },
    { prompt: "The 19th Amendment (1920):", choices: ["Granted women the right to vote", "Repealed Prohibition", "Lowered the voting age", "Established direct election of senators"], correctText: "Granted women the right to vote", hint: "Suffrage movement victory." },
    { prompt: "The New Deal (1930s) was a response to:", choices: ["The Great Depression", "World War I", "The Dust Bowl alone", "The Cold War"], correctText: "The Great Depression", hint: "FDR — relief, recovery, reform." },
    { prompt: "Pearl Harbor (Dec 7, 1941) led directly to:", choices: ["U.S. entry into World War II", "End of WWII", "The Marshall Plan", "Founding of the UN"], correctText: "U.S. entry into World War II", hint: "'A date which will live in infamy.'" },
    { prompt: "The Magna Carta (1215) is significant because it:", choices: ["Limited the power of the English king", "Established Parliament", "Ended the Hundred Years' War", "Created common law"], correctText: "Limited the power of the English king", hint: "King John signed at Runnymede." },
    { prompt: "Which best describes a primary source?", choices: ["A first-hand record from the time period studied", "A textbook chapter", "A modern documentary", "An encyclopedia entry"], correctText: "A first-hand record from the time period studied", hint: "Letters, diaries, photographs." },
    { prompt: "The Berlin Wall fell in:", choices: ["1989", "1991", "1985", "1979"], correctText: "1989", hint: "Just before German reunification." },
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations", "NATO", "The League of Nations", "The European Union"], correctText: "The United Nations", hint: "Eleanor Roosevelt led the drafting." }
  ];

  // -- Card faces (30 unique types) -----------------------------------------
  // Each face has: id, kind, label (short caption), drawFn (canvas drawing).
  // Hue is the primary accent. Categories: figures, symbols, periods, civics.
  // Drawing functions accept (ctx, cx, cy, size) and use abstract icon-style.
  // Categories provide per-suit hue accents, and the label appears beneath.

  var CAT_FIGURE = "FIGURE";
  var CAT_SYMBOL = "SYMBOL";
  var CAT_PERIOD = "PERIOD";
  var CAT_CIVIC  = "CIVIC";

  var CAT_HUE = {
    FIGURE: "#a96e3d",   // bronze
    SYMBOL: "#5de0f0",   // cyan
    PERIOD: "#4dd49b",   // emerald
    CIVIC:  "#a991ff"    // violet
  };

  // -- Tiny shape helpers (canvas) ------------------------------------------
  function strokeCircle(ctxA, x, y, r, w, color) {
    ctxA.lineWidth = w;
    ctxA.strokeStyle = color;
    ctxA.beginPath();
    ctxA.arc(x, y, r, 0, Math.PI * 2);
    ctxA.stroke();
  }
  function fillCircle(ctxA, x, y, r, color) {
    ctxA.fillStyle = color;
    ctxA.beginPath();
    ctxA.arc(x, y, r, 0, Math.PI * 2);
    ctxA.fill();
  }
  function strokePoly(ctxA, pts, w, color) {
    ctxA.lineWidth = w;
    ctxA.strokeStyle = color;
    ctxA.beginPath();
    for (var i = 0; i < pts.length; i++) {
      if (i === 0) ctxA.moveTo(pts[i][0], pts[i][1]);
      else ctxA.lineTo(pts[i][0], pts[i][1]);
    }
    ctxA.closePath();
    ctxA.stroke();
  }
  function fillPoly(ctxA, pts, color) {
    ctxA.fillStyle = color;
    ctxA.beginPath();
    for (var i = 0; i < pts.length; i++) {
      if (i === 0) ctxA.moveTo(pts[i][0], pts[i][1]);
      else ctxA.lineTo(pts[i][0], pts[i][1]);
    }
    ctxA.closePath();
    ctxA.fill();
  }
  function strokeLine(ctxA, x1, y1, x2, y2, w, color) {
    ctxA.lineWidth = w;
    ctxA.strokeStyle = color;
    ctxA.beginPath();
    ctxA.moveTo(x1, y1);
    ctxA.lineTo(x2, y2);
    ctxA.stroke();
  }
  function strokeRect(ctxA, x, y, w, h, lw, color) {
    ctxA.lineWidth = lw;
    ctxA.strokeStyle = color;
    ctxA.strokeRect(x, y, w, h);
  }

  // ---- Face drawing functions: each takes (ctxA, cx, cy, s) where
  //      cx/cy is the centre and s is the half-size of the face area.
  //      All shapes are drawn relative to centre.
  // Style: hairline outlines, accent color, plus minimal fill on key element.

  function faceLincoln(ctxA, cx, cy, s, accent) {
    // Top hat silhouette
    var hatTop = cy - s * 0.7;
    var hatBrimY = cy - s * 0.15;
    fillPoly(ctxA, [[cx - s * 0.45, hatBrimY], [cx + s * 0.45, hatBrimY], [cx + s * 0.45, hatBrimY + s * 0.06], [cx - s * 0.45, hatBrimY + s * 0.06]], "#1a1208");
    fillPoly(ctxA, [[cx - s * 0.35, hatBrimY], [cx + s * 0.35, hatBrimY], [cx + s * 0.32, hatTop], [cx - s * 0.32, hatTop]], "#1a1208");
    // Beard
    fillPoly(ctxA, [[cx - s * 0.32, cy + s * 0.05], [cx + s * 0.32, cy + s * 0.05], [cx + s * 0.18, cy + s * 0.65], [cx - s * 0.18, cy + s * 0.65]], "#1a1208");
    // Face oval
    strokeCircle(ctxA, cx, cy + s * 0.12, s * 0.42, 2.2, accent);
  }
  function faceCurie(ctxA, cx, cy, s, accent) {
    // Atom orbits
    fillCircle(ctxA, cx, cy, s * 0.10, accent);
    ctxA.save();
    ctxA.translate(cx, cy);
    for (var i = 0; i < 3; i++) {
      ctxA.rotate(Math.PI / 3);
      ctxA.beginPath();
      ctxA.lineWidth = 2.0;
      ctxA.strokeStyle = accent;
      ctxA.ellipse(0, 0, s * 0.62, s * 0.22, 0, 0, Math.PI * 2);
      ctxA.stroke();
    }
    ctxA.restore();
  }
  function faceTubman(ctxA, cx, cy, s, accent) {
    // North Star: a 6-point compass star
    var pts = [];
    var R = s * 0.55, r = s * 0.18;
    for (var k = 0; k < 12; k++) {
      var ang = (k / 12) * Math.PI * 2 - Math.PI / 2;
      var rr = (k % 2 === 0) ? R : r;
      pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
    }
    strokePoly(ctxA, pts, 2.2, accent);
    fillCircle(ctxA, cx, cy, s * 0.10, accent);
  }
  function faceRoosevelt(ctxA, cx, cy, s, accent) {
    // Glasses (FDR pince-nez)
    strokeCircle(ctxA, cx - s * 0.22, cy, s * 0.18, 2.4, accent);
    strokeCircle(ctxA, cx + s * 0.22, cy, s * 0.18, 2.4, accent);
    strokeLine(ctxA, cx - s * 0.04, cy, cx + s * 0.04, cy, 2.4, accent);
    // Cigarette holder
    strokeLine(ctxA, cx + s * 0.32, cy + s * 0.18, cx + s * 0.55, cy + s * 0.4, 2.0, accent);
    fillCircle(ctxA, cx + s * 0.55, cy + s * 0.4, s * 0.05, accent);
  }
  function faceWashington(ctxA, cx, cy, s, accent) {
    // Powdered wig profile
    // Curl rows
    for (var rRow = 0; rRow < 3; rRow++) {
      var yy = cy - s * 0.4 + rRow * s * 0.3;
      for (var cn = -2; cn <= 2; cn++) {
        strokeCircle(ctxA, cx + cn * s * 0.2, yy, s * 0.10, 1.6, accent);
      }
    }
    // Triangle hat brim
    strokeLine(ctxA, cx - s * 0.5, cy - s * 0.45, cx + s * 0.5, cy - s * 0.45, 2.2, accent);
  }
  function faceFrederick(ctxA, cx, cy, s, accent) {
    // Frederick Douglass: open book + quill
    fillPoly(ctxA, [[cx - s * 0.5, cy - s * 0.1], [cx + s * 0.5, cy - s * 0.1], [cx + s * 0.5, cy + s * 0.4], [cx - s * 0.5, cy + s * 0.4]], "#1a1208");
    strokeLine(ctxA, cx, cy - s * 0.1, cx, cy + s * 0.4, 1.8, accent);
    // Quill diagonal
    strokeLine(ctxA, cx - s * 0.05, cy - s * 0.5, cx + s * 0.4, cy + s * 0.05, 2.4, accent);
  }
  function faceMartin(ctxA, cx, cy, s, accent) {
    // MLK: dove of peace silhouette
    fillPoly(ctxA, [
      [cx - s * 0.55, cy + s * 0.15],
      [cx - s * 0.20, cy - s * 0.20],
      [cx + s * 0.10, cy - s * 0.40],
      [cx + s * 0.40, cy - s * 0.10],
      [cx + s * 0.55, cy + s * 0.10],
      [cx + s * 0.20, cy + s * 0.30],
      [cx - s * 0.20, cy + s * 0.35]
    ], accent);
    fillCircle(ctxA, cx + s * 0.42, cy - s * 0.18, s * 0.04, "#1a1208");
  }
  function faceMandela(ctxA, cx, cy, s, accent) {
    // Open hand reaching up
    var fingers = 5;
    for (var fg = 0; fg < fingers; fg++) {
      var fx = cx + (fg - 2) * s * 0.18;
      var fy = cy - s * 0.30 - Math.abs(fg - 2) * s * 0.05;
      strokeLine(ctxA, fx, fy, fx, cy + s * 0.15, 4.0, accent);
    }
    // Palm
    fillPoly(ctxA, [[cx - s * 0.42, cy + s * 0.10], [cx + s * 0.42, cy + s * 0.10], [cx + s * 0.30, cy + s * 0.55], [cx - s * 0.30, cy + s * 0.55]], accent);
  }

  // Symbols
  function faceAtom(ctxA, cx, cy, s, accent) {
    fillCircle(ctxA, cx, cy, s * 0.10, accent);
    ctxA.save();
    ctxA.translate(cx, cy);
    for (var i = 0; i < 3; i++) {
      ctxA.rotate(Math.PI / 3);
      ctxA.beginPath();
      ctxA.lineWidth = 2.2;
      ctxA.strokeStyle = accent;
      ctxA.ellipse(0, 0, s * 0.6, s * 0.22, 0, 0, Math.PI * 2);
      ctxA.stroke();
    }
    ctxA.restore();
  }
  function faceScroll(ctxA, cx, cy, s, accent) {
    // Scroll with curls
    fillCircle(ctxA, cx - s * 0.45, cy, s * 0.15, "#1a1208");
    fillCircle(ctxA, cx + s * 0.45, cy, s * 0.15, "#1a1208");
    fillPoly(ctxA, [[cx - s * 0.45, cy - s * 0.18], [cx + s * 0.45, cy - s * 0.18], [cx + s * 0.45, cy + s * 0.18], [cx - s * 0.45, cy + s * 0.18]], "#1a1208");
    // ink lines
    strokeLine(ctxA, cx - s * 0.30, cy - s * 0.06, cx + s * 0.30, cy - s * 0.06, 1.5, accent);
    strokeLine(ctxA, cx - s * 0.30, cy + s * 0.04, cx + s * 0.30, cy + s * 0.04, 1.5, accent);
  }
  function faceGlobe(ctxA, cx, cy, s, accent) {
    strokeCircle(ctxA, cx, cy, s * 0.55, 2.4, accent);
    // longitude
    ctxA.lineWidth = 1.6;
    ctxA.strokeStyle = accent;
    ctxA.beginPath();
    ctxA.ellipse(cx, cy, s * 0.20, s * 0.55, 0, 0, Math.PI * 2);
    ctxA.stroke();
    // equator
    strokeLine(ctxA, cx - s * 0.55, cy, cx + s * 0.55, cy, 1.6, accent);
  }
  function faceGavel(ctxA, cx, cy, s, accent) {
    // Gavel head + striker
    fillPoly(ctxA, [[cx - s * 0.10, cy - s * 0.5], [cx + s * 0.45, cy - s * 0.30], [cx + s * 0.20, cy + s * 0.05], [cx - s * 0.30, cy - s * 0.20]], accent);
    strokeLine(ctxA, cx - s * 0.30, cy - s * 0.20, cx - s * 0.55, cy + s * 0.30, 4.0, accent);
    fillPoly(ctxA, [[cx - s * 0.55, cy + s * 0.20], [cx - s * 0.20, cy + s * 0.50], [cx - s * 0.05, cy + s * 0.40], [cx - s * 0.40, cy + s * 0.10]], accent);
  }
  function faceTorch(ctxA, cx, cy, s, accent) {
    // Statue of Liberty torch flame
    fillPoly(ctxA, [[cx, cy - s * 0.55], [cx + s * 0.20, cy - s * 0.10], [cx, cy - s * 0.20], [cx - s * 0.20, cy - s * 0.10]], accent);
    fillPoly(ctxA, [[cx - s * 0.10, cy - s * 0.10], [cx + s * 0.10, cy - s * 0.10], [cx + s * 0.05, cy + s * 0.50], [cx - s * 0.05, cy + s * 0.50]], "#1a1208");
    strokeLine(ctxA, cx - s * 0.20, cy + s * 0.50, cx + s * 0.20, cy + s * 0.50, 3.0, accent);
  }
  function faceFeather(ctxA, cx, cy, s, accent) {
    fillPoly(ctxA, [
      [cx - s * 0.10, cy + s * 0.55],
      [cx - s * 0.30, cy - s * 0.30],
      [cx, cy - s * 0.55],
      [cx + s * 0.30, cy - s * 0.30],
      [cx + s * 0.10, cy + s * 0.55]
    ], accent);
    strokeLine(ctxA, cx, cy - s * 0.50, cx, cy + s * 0.55, 2.0, "#1a1208");
  }
  function faceTelescope(ctxA, cx, cy, s, accent) {
    // Telescope barrel angled up-left to down-right
    ctxA.save();
    ctxA.translate(cx, cy);
    ctxA.rotate(-Math.PI / 6);
    fillPoly(ctxA, [[-s * 0.55, -s * 0.10], [s * 0.50, -s * 0.04], [s * 0.50, s * 0.04], [-s * 0.55, s * 0.10]], accent);
    fillCircle(ctxA, s * 0.50, 0, s * 0.10, "#1a1208");
    ctxA.restore();
    // tripod
    strokeLine(ctxA, cx, cy + s * 0.05, cx - s * 0.20, cy + s * 0.55, 2.0, accent);
    strokeLine(ctxA, cx, cy + s * 0.05, cx + s * 0.20, cy + s * 0.55, 2.0, accent);
    strokeLine(ctxA, cx, cy + s * 0.05, cx, cy + s * 0.55, 2.0, accent);
  }
  function faceMicroscope(ctxA, cx, cy, s, accent) {
    fillPoly(ctxA, [[cx - s * 0.30, cy + s * 0.45], [cx + s * 0.30, cy + s * 0.45], [cx + s * 0.20, cy + s * 0.30], [cx - s * 0.20, cy + s * 0.30]], accent);
    fillPoly(ctxA, [[cx - s * 0.05, cy - s * 0.50], [cx + s * 0.05, cy - s * 0.50], [cx + s * 0.15, cy], [cx - s * 0.15, cy]], accent);
    strokeLine(ctxA, cx + s * 0.10, cy, cx + s * 0.40, cy + s * 0.10, 2.0, accent);
    fillCircle(ctxA, cx, cy + s * 0.30, s * 0.05, "#1a1208");
  }

  // Periods (era markers)
  function faceColumn(ctxA, cx, cy, s, accent) {
    // Roman column
    fillPoly(ctxA, [[cx - s * 0.45, cy - s * 0.5], [cx + s * 0.45, cy - s * 0.5], [cx + s * 0.45, cy - s * 0.4], [cx - s * 0.45, cy - s * 0.4]], accent);
    fillPoly(ctxA, [[cx - s * 0.30, cy - s * 0.4], [cx + s * 0.30, cy - s * 0.4], [cx + s * 0.30, cy + s * 0.4], [cx - s * 0.30, cy + s * 0.4]], accent);
    fillPoly(ctxA, [[cx - s * 0.45, cy + s * 0.4], [cx + s * 0.45, cy + s * 0.4], [cx + s * 0.45, cy + s * 0.5], [cx - s * 0.45, cy + s * 0.5]], accent);
    // Vertical fluting
    for (var i = -2; i <= 2; i++) {
      strokeLine(ctxA, cx + i * s * 0.1, cy - s * 0.4, cx + i * s * 0.1, cy + s * 0.4, 1.4, "#1a1208");
    }
  }
  function facePyramid(ctxA, cx, cy, s, accent) {
    fillPoly(ctxA, [[cx, cy - s * 0.55], [cx + s * 0.55, cy + s * 0.4], [cx - s * 0.55, cy + s * 0.4]], accent);
    strokeLine(ctxA, cx, cy - s * 0.55, cx - s * 0.05, cy + s * 0.4, 1.6, "#1a1208");
    // Sun above
    strokeCircle(ctxA, cx + s * 0.40, cy - s * 0.40, s * 0.06, 1.6, accent);
  }
  function faceCog(ctxA, cx, cy, s, accent) {
    var teeth = 10, R = s * 0.55, r = s * 0.42;
    var pts = [];
    for (var t = 0; t < teeth * 2; t++) {
      var a = (t / (teeth * 2)) * Math.PI * 2;
      var rr = (t % 2 === 0) ? R : r;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    fillPoly(ctxA, pts, accent);
    fillCircle(ctxA, cx, cy, s * 0.18, "#1a1208");
    strokeCircle(ctxA, cx, cy, s * 0.18, 1.8, accent);
  }
  function faceCastle(ctxA, cx, cy, s, accent) {
    // Castle with crenelations
    fillPoly(ctxA, [[cx - s * 0.5, cy + s * 0.5], [cx + s * 0.5, cy + s * 0.5], [cx + s * 0.5, cy - s * 0.2], [cx - s * 0.5, cy - s * 0.2]], accent);
    // Crenelations
    for (var c = -2; c <= 1; c++) {
      fillPoly(ctxA, [[cx + c * s * 0.25, cy - s * 0.2], [cx + c * s * 0.25 + s * 0.10, cy - s * 0.2], [cx + c * s * 0.25 + s * 0.10, cy - s * 0.4], [cx + c * s * 0.25, cy - s * 0.4]], accent);
    }
    // Door
    fillPoly(ctxA, [[cx - s * 0.10, cy + s * 0.5], [cx + s * 0.10, cy + s * 0.5], [cx + s * 0.10, cy + s * 0.10], [cx - s * 0.10, cy + s * 0.10]], "#1a1208");
  }
  function faceShip(ctxA, cx, cy, s, accent) {
    // Caravel hull
    fillPoly(ctxA, [[cx - s * 0.55, cy + s * 0.15], [cx + s * 0.55, cy + s * 0.15], [cx + s * 0.40, cy + s * 0.45], [cx - s * 0.40, cy + s * 0.45]], accent);
    // Mast
    strokeLine(ctxA, cx, cy + s * 0.15, cx, cy - s * 0.55, 2.4, accent);
    // Sail
    fillPoly(ctxA, [[cx, cy - s * 0.55], [cx + s * 0.30, cy - s * 0.10], [cx, cy - s * 0.10]], "#f0e1b8");
  }
  function faceTrain(ctxA, cx, cy, s, accent) {
    // Steam locomotive
    fillPoly(ctxA, [[cx - s * 0.55, cy + s * 0.20], [cx + s * 0.55, cy + s * 0.20], [cx + s * 0.55, cy + s * 0.40], [cx - s * 0.55, cy + s * 0.40]], accent);
    fillPoly(ctxA, [[cx - s * 0.55, cy - s * 0.10], [cx - s * 0.10, cy - s * 0.10], [cx - s * 0.10, cy + s * 0.20], [cx - s * 0.55, cy + s * 0.20]], accent);
    // Wheels
    fillCircle(ctxA, cx - s * 0.30, cy + s * 0.45, s * 0.10, accent);
    fillCircle(ctxA, cx + s * 0.05, cy + s * 0.45, s * 0.10, accent);
    fillCircle(ctxA, cx + s * 0.40, cy + s * 0.45, s * 0.10, accent);
    // Smokestack
    fillPoly(ctxA, [[cx - s * 0.45, cy - s * 0.10], [cx - s * 0.30, cy - s * 0.10], [cx - s * 0.30, cy - s * 0.40], [cx - s * 0.45, cy - s * 0.40]], accent);
  }
  function faceRocket(ctxA, cx, cy, s, accent) {
    // Sputnik / rocket sketch
    fillPoly(ctxA, [[cx, cy - s * 0.55], [cx + s * 0.20, cy + s * 0.10], [cx, cy + s * 0.40], [cx - s * 0.20, cy + s * 0.10]], accent);
    fillPoly(ctxA, [[cx - s * 0.20, cy + s * 0.10], [cx - s * 0.40, cy + s * 0.40], [cx - s * 0.20, cy + s * 0.40]], accent);
    fillPoly(ctxA, [[cx + s * 0.20, cy + s * 0.10], [cx + s * 0.40, cy + s * 0.40], [cx + s * 0.20, cy + s * 0.40]], accent);
    fillCircle(ctxA, cx, cy - s * 0.10, s * 0.08, "#1a1208");
  }

  // Civics
  function faceLiberty(ctxA, cx, cy, s, accent) {
    // Liberty bell
    fillPoly(ctxA, [[cx - s * 0.40, cy - s * 0.30], [cx + s * 0.40, cy - s * 0.30], [cx + s * 0.50, cy + s * 0.30], [cx - s * 0.50, cy + s * 0.30]], accent);
    fillPoly(ctxA, [[cx - s * 0.50, cy + s * 0.30], [cx + s * 0.50, cy + s * 0.30], [cx + s * 0.50, cy + s * 0.40], [cx - s * 0.50, cy + s * 0.40]], "#1a1208");
    strokeLine(ctxA, cx, cy + s * 0.40, cx, cy + s * 0.55, 3.0, accent);
    fillCircle(ctxA, cx, cy + s * 0.55, s * 0.05, accent);
    // crack
    strokeLine(ctxA, cx + s * 0.20, cy - s * 0.10, cx + s * 0.10, cy + s * 0.25, 1.6, "#1a1208");
  }
  function faceFlag(ctxA, cx, cy, s, accent) {
    // Stripes & star
    strokeLine(ctxA, cx - s * 0.45, cy - s * 0.50, cx - s * 0.45, cy + s * 0.55, 3.0, accent);
    fillPoly(ctxA, [[cx - s * 0.45, cy - s * 0.50], [cx + s * 0.55, cy - s * 0.50], [cx + s * 0.55, cy + s * 0.20], [cx - s * 0.45, cy + s * 0.20]], "#1a1208");
    // Star
    var pts = [];
    var R = s * 0.16, r = s * 0.07, c2x = cx - s * 0.20, c2y = cy - s * 0.30;
    for (var k = 0; k < 10; k++) {
      var ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
      var rr = (k % 2 === 0) ? R : r;
      pts.push([c2x + Math.cos(ang) * rr, c2y + Math.sin(ang) * rr]);
    }
    fillPoly(ctxA, pts, accent);
    // stripes
    for (var i = 0; i < 4; i++) {
      strokeLine(ctxA, cx, cy - s * 0.05 + i * s * 0.07, cx + s * 0.55, cy - s * 0.05 + i * s * 0.07, 1.5, accent);
    }
  }
  function faceCapitol(ctxA, cx, cy, s, accent) {
    // Capitol dome
    ctxA.save();
    ctxA.beginPath();
    ctxA.lineWidth = 2.2;
    ctxA.strokeStyle = accent;
    ctxA.fillStyle = accent;
    ctxA.beginPath();
    ctxA.arc(cx, cy + s * 0.10, s * 0.45, Math.PI, 0);
    ctxA.fill();
    ctxA.restore();
    // Spire
    strokeLine(ctxA, cx, cy - s * 0.35, cx, cy - s * 0.55, 2.6, accent);
    fillCircle(ctxA, cx, cy - s * 0.55, s * 0.05, accent);
    // Base
    fillPoly(ctxA, [[cx - s * 0.5, cy + s * 0.10], [cx + s * 0.5, cy + s * 0.10], [cx + s * 0.5, cy + s * 0.40], [cx - s * 0.5, cy + s * 0.40]], accent);
    // Pillars
    for (var i = -2; i <= 2; i++) {
      strokeLine(ctxA, cx + i * s * 0.18, cy + s * 0.10, cx + i * s * 0.18, cy + s * 0.40, 1.8, "#1a1208");
    }
  }
  function faceBallot(ctxA, cx, cy, s, accent) {
    // Ballot box with checkmark
    fillPoly(ctxA, [[cx - s * 0.5, cy - s * 0.20], [cx + s * 0.5, cy - s * 0.20], [cx + s * 0.5, cy + s * 0.45], [cx - s * 0.5, cy + s * 0.45]], accent);
    fillPoly(ctxA, [[cx - s * 0.30, cy - s * 0.50], [cx + s * 0.30, cy - s * 0.50], [cx + s * 0.30, cy - s * 0.20], [cx - s * 0.30, cy - s * 0.20]], "#1a1208");
    // Slot
    fillPoly(ctxA, [[cx - s * 0.20, cy - s * 0.40], [cx + s * 0.20, cy - s * 0.40], [cx + s * 0.20, cy - s * 0.30], [cx - s * 0.20, cy - s * 0.30]], accent);
    // checkmark
    strokeLine(ctxA, cx - s * 0.18, cy + s * 0.10, cx - s * 0.05, cy + s * 0.25, 3.0, "#1a1208");
    strokeLine(ctxA, cx - s * 0.05, cy + s * 0.25, cx + s * 0.20, cy - s * 0.05, 3.0, "#1a1208");
  }
  function faceJustice(ctxA, cx, cy, s, accent) {
    // Scales of justice
    strokeLine(ctxA, cx, cy - s * 0.5, cx, cy + s * 0.55, 2.4, accent);
    strokeLine(ctxA, cx - s * 0.4, cy - s * 0.20, cx + s * 0.4, cy - s * 0.20, 2.4, accent);
    // pans (semicircles)
    ctxA.beginPath();
    ctxA.lineWidth = 2.2;
    ctxA.strokeStyle = accent;
    ctxA.arc(cx - s * 0.35, cy + s * 0.05, s * 0.18, 0, Math.PI);
    ctxA.stroke();
    ctxA.beginPath();
    ctxA.arc(cx + s * 0.35, cy + s * 0.05, s * 0.18, 0, Math.PI);
    ctxA.stroke();
    // base
    fillPoly(ctxA, [[cx - s * 0.20, cy + s * 0.55], [cx + s * 0.20, cy + s * 0.55], [cx + s * 0.10, cy + s * 0.45], [cx - s * 0.10, cy + s * 0.45]], accent);
  }
  function faceShield(ctxA, cx, cy, s, accent) {
    // Civic shield
    fillPoly(ctxA, [
      [cx - s * 0.45, cy - s * 0.45],
      [cx + s * 0.45, cy - s * 0.45],
      [cx + s * 0.45, cy + s * 0.10],
      [cx, cy + s * 0.55],
      [cx - s * 0.45, cy + s * 0.10]
    ], accent);
    strokeLine(ctxA, cx, cy - s * 0.45, cx, cy + s * 0.55, 1.8, "#1a1208");
    strokeLine(ctxA, cx - s * 0.45, cy - s * 0.10, cx + s * 0.45, cy - s * 0.10, 1.8, "#1a1208");
  }
  function faceQuill(ctxA, cx, cy, s, accent) {
    // Quill pen
    strokeLine(ctxA, cx + s * 0.40, cy - s * 0.50, cx - s * 0.40, cy + s * 0.50, 4.0, accent);
    fillPoly(ctxA, [[cx - s * 0.40, cy + s * 0.50], [cx - s * 0.50, cy + s * 0.50], [cx - s * 0.50, cy + s * 0.40]], accent);
    // Feather barbs
    for (var i = 0; i < 4; i++) {
      var t = i * 0.18;
      strokeLine(ctxA, cx + s * (0.40 - t), cy - s * (0.50 - t), cx + s * (0.50 - t), cy - s * (0.40 - t), 1.4, accent);
    }
  }
  // -- 30 unique card faces --------------------------------------------------
  var FACES = [
    { id: 0,  cat: CAT_FIGURE, label: "LINCOLN",     draw: faceLincoln    },
    { id: 1,  cat: CAT_FIGURE, label: "CURIE",       draw: faceCurie      },
    { id: 2,  cat: CAT_FIGURE, label: "TUBMAN",      draw: faceTubman     },
    { id: 3,  cat: CAT_FIGURE, label: "FDR",         draw: faceRoosevelt  },
    { id: 4,  cat: CAT_FIGURE, label: "WASHINGTON",  draw: faceWashington },
    { id: 5,  cat: CAT_FIGURE, label: "DOUGLASS",    draw: faceFrederick  },
    { id: 6,  cat: CAT_FIGURE, label: "MLK",         draw: faceMartin     },
    { id: 7,  cat: CAT_FIGURE, label: "MANDELA",     draw: faceMandela    },
    { id: 8,  cat: CAT_SYMBOL, label: "ATOM",        draw: faceAtom       },
    { id: 9,  cat: CAT_SYMBOL, label: "SCROLL",      draw: faceScroll     },
    { id: 10, cat: CAT_SYMBOL, label: "GLOBE",       draw: faceGlobe      },
    { id: 11, cat: CAT_SYMBOL, label: "GAVEL",       draw: faceGavel      },
    { id: 12, cat: CAT_SYMBOL, label: "TORCH",       draw: faceTorch      },
    { id: 13, cat: CAT_SYMBOL, label: "FEATHER",     draw: faceFeather    },
    { id: 14, cat: CAT_SYMBOL, label: "TELESCOPE",   draw: faceTelescope  },
    { id: 15, cat: CAT_SYMBOL, label: "MICROSCOPE",  draw: faceMicroscope },
    { id: 16, cat: CAT_PERIOD, label: "COLUMN",      draw: faceColumn     },
    { id: 17, cat: CAT_PERIOD, label: "PYRAMID",     draw: facePyramid    },
    { id: 18, cat: CAT_PERIOD, label: "COG",         draw: faceCog        },
    { id: 19, cat: CAT_PERIOD, label: "CASTLE",      draw: faceCastle     },
    { id: 20, cat: CAT_PERIOD, label: "CARAVEL",     draw: faceShip       },
    { id: 21, cat: CAT_PERIOD, label: "LOCOMOTIVE",  draw: faceTrain      },
    { id: 22, cat: CAT_PERIOD, label: "ROCKET",      draw: faceRocket     },
    { id: 23, cat: CAT_CIVIC,  label: "BELL",        draw: faceLiberty    },
    { id: 24, cat: CAT_CIVIC,  label: "FLAG",        draw: faceFlag       },
    { id: 25, cat: CAT_CIVIC,  label: "CAPITOL",     draw: faceCapitol    },
    { id: 26, cat: CAT_CIVIC,  label: "BALLOT",      draw: faceBallot     },
    { id: 27, cat: CAT_CIVIC,  label: "JUSTICE",     draw: faceJustice    },
    { id: 28, cat: CAT_CIVIC,  label: "SHIELD",      draw: faceShield     },
    { id: 29, cat: CAT_CIVIC,  label: "QUILL",       draw: faceQuill      }
  ];

  // -- SFX (Web Audio) -------------------------------------------------------
  var sfxCtx = null;
  var soundOn = true;

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
    card_flip: function () {
      sfxTone(560, 0.05, { type: "triangle", volume: 0.10, endFreq: 720 });
    },
    card_match: function () {
      [659, 784, 988].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 50);
      });
    },
    card_mismatch: function () {
      sfxTone(220, 0.10, { type: "sawtooth", volume: 0.14, endFreq: 140 });
    },
    peek: function () {
      [988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.08, { type: "triangle", volume: 0.12 }); }, i * 40);
      });
    },
    scholar_match: function () {
      [988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.15, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    scholar_correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong: function () {
      sfxTone(330, 0.18, { type: "sawtooth", volume: 0.14, endFreq: 220 });
    },
    stage_clear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    life_lost: function () {
      sfxTone(440, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 80 });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    time_low_warn: function () {
      sfxTone(660, 0.08, { type: "square", volume: 0.14, endFreq: 440 });
    },
    powerup_pickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerup_use: function () {
      [880, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    }
  };

  // -- Canvas / state --------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | stageClear | dying
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  var reducedMotionMQL = null;
  try {
    reducedMotionMQL = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = reducedMotionMQL.matches;
    var rmListener = function (e) { reducedMotion = !!e.matches; };
    if (reducedMotionMQL.addEventListener) reducedMotionMQL.addEventListener("change", rmListener);
    else if (reducedMotionMQL.addListener) reducedMotionMQL.addListener(rmListener);
  } catch (e) {}

  // Pending timeout handles (so we can cancel on phase changes)
  var pendingTimers = {
    scholarOpen: 0,
    stageClear: 0,
    questionClose: 0
  };
  function clearPendingTimer(key) {
    if (pendingTimers[key]) {
      clearTimeout(pendingTimers[key]);
      pendingTimers[key] = 0;
    }
  }
  function clearAllPendingTimers() {
    for (var k in pendingTimers) clearPendingTimer(k);
  }

  // Active question (scholar review)
  var activeQuestion = null;

  // DOM cache
  var dom = {};

  // -- Init / boot -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", boot);

  function boot() {
    canvas = document.getElementById("palaceCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d", { alpha: false });
    cacheDOM();
    bindButtons();
    bindInput();
    window.addEventListener("resize", onResizeDebounced);
    resize();
    state = makeFreshState("4x4");
    refreshSetupUI();
    drawTitle();
    raf();
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("memory-palace");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "memory-palace", { compact: false });
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
      window.MrMacsHelpOverlay.register("memory-palace", {
        title: "How to Play Memory Palace",
        goal: "Flip cards to find every matching pair before time runs out — scholar pairs unlock bonus review questions.",
        controls: [
          { key: "Click / Tap", action: "Flip a card" },
          { key: "Esc / P",     action: "Pause" }
        ],
        tips: [
          "Remember positions — mismatched cards flip back after a short delay, so track where you've seen each face.",
          "Match the scholar pair (gilt rim) to trigger a bonus review question worth extra shards.",
          "Power-ups drop on matches: Peek reveals all cards briefly, +30 s extends the timer, 2× Mult doubles your next match score."
        ],
        scholar: "Scholar cards have a gold rim. Match both to open a review challenge — answer correctly for a big shard bonus."
      });
      var _helpSetupActions = document.querySelector("#setupScreen .setup-actions");
      if (_helpSetupActions) window.MrMacsHelpOverlay.mountButton(_helpSetupActions, "memory-palace");
    }
  } catch (e) {}
  }

  function $(id) { return document.getElementById(id); }
  function cacheDOM() {
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudStage = $("hudStage");
    dom.hudTimer = $("hudTimer");
    dom.hudTimerCell = $("hudTimerCell");
    dom.hudPairs = $("hudPairs");
    dom.hudBest = $("hudBest");
    dom.brandSub = $("brandSub");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
    dom.waveRibbon = $("waveRibbon");
    dom.popupOverlay = $("popupOverlay");

    dom.setupScreen = $("setupScreen");
    dom.questionScreen = $("questionScreen");
    dom.pauseScreen = $("pauseScreen");
    dom.endScreen = $("endScreen");

    dom.startBtn = $("startBtn");
    dom.soundBtn = $("soundBtn");
    dom.fullscreenBtn = $("fullscreenBtn");
    dom.pauseBtn = $("pauseBtn");
    dom.exitBtn = $("exitBtn");
    dom.resumeBtn = $("resumeBtn");
    dom.restartBtn = $("restartBtn");
    dom.pauseExitBtn = $("pauseExitBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");

    dom.questionMeta = $("questionMeta");
    dom.questionPrompt = $("questionPrompt");
    dom.questionCloseBtn = $("questionCloseBtn");
    dom.choiceGrid = $("choiceGrid");
    dom.explanation = $("explanation");

    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.retryHint = $("retryHint");

    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");

    dom.puSlot1 = $("puSlot1");
    dom.puSlot2 = $("puSlot2");
    dom.puSlot3 = $("puSlot3");

    dom.diffButtons = document.querySelectorAll(".diff-btn");
    dom.difficultyRow = $("difficultyRow");
  }

  function bindButtons() {
    if (dom.startBtn) dom.startBtn.addEventListener("click", startRun);
    if (dom.soundBtn) dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) stopMusic();
      else if (phase === "playing") startMusic();
    });
    if (dom.fullscreenBtn) dom.fullscreenBtn.addEventListener("click", toggleFullscreen);
    if (dom.pauseBtn) dom.pauseBtn.addEventListener("click", function (e) {
      if (e && e.preventDefault) e.preventDefault();
      if (phase === "playing" || phase === "paused") togglePause();
    });
    if (dom.exitBtn) dom.exitBtn.addEventListener("click", exitToHub);
    if (dom.resumeBtn) dom.resumeBtn.addEventListener("click", togglePause);
    if (dom.restartBtn) dom.restartBtn.addEventListener("click", function () {
      clearAllPendingTimers();
      clearSnapshot();
      hideAllScreens();
      showScreen("setup");
      phase = "setup";
      stopMusic();
      refreshSetupUI();
    });
    if (dom.pauseExitBtn) dom.pauseExitBtn.addEventListener("click", exitToHub);
    if (dom.setupBtn) dom.setupBtn.addEventListener("click", function () {
      clearAllPendingTimers();
      hideAllScreens();
      showScreen("setup");
      phase = "setup";
      refreshSetupUI();
    });
    if (dom.againBtn) dom.againBtn.addEventListener("click", function () {
      clearAllPendingTimers();
      startRun();
    });
    if (dom.questionCloseBtn) dom.questionCloseBtn.addEventListener("click", function (e) {
      if (e && e.preventDefault) e.preventDefault();
      skipQuestion();
    });

    // Difficulty buttons
    if (dom.diffButtons) {
      dom.diffButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var diff = btn.getAttribute("data-diff");
          dom.diffButtons.forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
            b.setAttribute("aria-pressed", b === btn ? "true" : "false");
          });
          state.startGrid = diff;
        });
      });
    }
  }

  // -- State -----------------------------------------------------------------
  function makeFreshState(startGrid) {
    return {
      score: 0,
      lives: LIVES_INIT,
      stage: 1,
      maxStageReached: 1,
      startGrid: startGrid || "4x4",
      currentGrid: startGrid || "4x4",
      cards: [],            // cards on the field
      flippedQueue: [],     // currently face-up but not matched
      pairsMatched: 0,
      pairsTotal: 8,
      timeRemaining: 90,
      time: 0,              // running total seconds since start
      lastTimerWarnAt: 0,
      shardsAwarded: 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      pendingFlipBack: null, // {a, b, until}
      lockInput: false,
      wrongStreak: 0,
      activePeek: null,      // {until}
      activeReveal: false,   // when reveal_pair is used
      scoreMultActive: false,// 2x mult flag (this stage)
      scoreMultStage: 0,     // stage on which 2x activated
      inventory: [],         // active power-up types
      pendingScholarMatch: null, // {a, b}
      runStartTs: Date.now(),
      stageStartTs: Date.now()
    };
  }

  function refreshSetupUI() {
    var best = readBest();
    if (dom.hudBest) dom.hudBest.textContent = best > 0 ? formatScore(best) : "—";
    var snap = loadSnapshot();
    if (snap && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Last run</div>' +
        '<div class="resume-card-meta">Stage ' + escapeHtml(String(snap.stage || 1)) + ' &middot; Score ' + escapeHtml(String(snap.score || 0)) + ' &middot; ' + escapeHtml(String(snap.pairsMatched || 0)) + ' pairs</div>' +
        '<div class="resume-actions"><button class="btn glass-pill" id="resumeRunBtn" type="button">Resume</button>' +
        '<button class="btn glass-pill" id="discardRunBtn" type="button">Discard</button></div>';
      var rB = $("resumeRunBtn");
      var dB = $("discardRunBtn");
      if (rB) rB.addEventListener("click", function () {
        // Resume from snapshot — start at saved stage, but make a fresh card layout
        startRun(snap);
      });
      if (dB) dB.addEventListener("click", function () {
        clearSnapshot();
        if (dom.resumeCard) dom.resumeCard.hidden = true;
      });
    } else if (dom.resumeCard) {
      dom.resumeCard.hidden = true;
      dom.resumeCard.innerHTML = "";
    }
    // Leaderboard panel
    try {
      if (dom.leaderboardPanel) {
        dom.leaderboardPanel.hidden = true;
        dom.leaderboardPanel.innerHTML = "";
      }
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.top && dom.leaderboardPanel) {
        var rows = window.MrMacsLeaderboards.top(GAME_ID, 5) || [];
        if (rows.length) {
          dom.leaderboardPanel.hidden = false;
          var html = '<div class="leaderboard-title">Top scores</div>';
          for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            html += '<div class="leaderboard-row">' +
              '<span class="lb-rank">#' + (i + 1) + '</span>' +
              '<span class="lb-name">' + escapeHtml(r.name || "Player") + '</span>' +
              '<span class="lb-score">' + escapeHtml(String(r.score || 0)) + '</span>' +
              '</div>';
          }
          dom.leaderboardPanel.innerHTML = html;
        }
      }
    } catch (e) {}
  }

  function startRun(resumeSnap) {
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.reset(); MrMacsEndRecap.startTracking(); } } catch (e) {}
    var pickedGrid = (state && state.startGrid) || "4x4";
    state = makeFreshState(pickedGrid);
    if (resumeSnap && resumeSnap.stage) {
      state.stage = Math.max(1, Math.min(STAGE_ORDER.length, resumeSnap.stage));
      state.score = resumeSnap.score || 0;
      state.lives = resumeSnap.lives != null ? resumeSnap.lives : LIVES_INIT;
      state.startGrid = STAGE_ORDER[state.stage - 1] || pickedGrid;
    } else {
      // pick stage based on chosen grid
      var idx = STAGE_ORDER.indexOf(pickedGrid);
      state.stage = idx >= 0 ? idx + 1 : 1;
    }
    setupStage(state.stage);
    hideAllScreens();
    phase = "playing";
    state.runStartTs = Date.now();
    state.stageStartTs = Date.now();
    startMusic();
    updateHud();
    saveSnapshot();
    pushPopup("STAGE " + state.stage, LOGICAL_W / 2, 200, "is-bonus");
  }

  function setupStage(stageNum) {
    var idx = Math.max(0, Math.min(STAGE_ORDER.length - 1, stageNum - 1));
    var key = STAGE_ORDER[idx];
    var cfg = GRID_CONFIGS[key];
    state.currentGrid = key;
    state.pairsTotal = cfg.pairs;
    state.pairsMatched = 0;
    state.timeRemaining = cfg.time;
    state.flippedQueue = [];
    state.lockInput = false;
    state.wrongStreak = 0;
    state.activePeek = null;
    state.activeReveal = false;
    state.scoreMultActive = false;
    state.scoreMultStage = 0;
    state.pendingFlipBack = null;
    state.pendingScholarMatch = null;
    state.lastTimerWarnAt = 0;

    // Build cards
    var totalCards = cfg.pairs * 2;
    var faceIds = pickFaceIds(cfg.pairs);
    // Determine scholar pair indices among face IDs
    var scholarSlots = pickScholarCount(stageNum);
    var scholarSet = {};
    var picks = [];
    for (var i = 0; i < faceIds.length; i++) picks.push(i);
    shuffle(picks);
    for (var sIdx = 0; sIdx < Math.min(scholarSlots, picks.length); sIdx++) {
      scholarSet[faceIds[picks[sIdx]]] = true;
    }

    var pile = [];
    for (var f = 0; f < faceIds.length; f++) {
      var fid = faceIds[f];
      pile.push({ faceId: fid, scholar: !!scholarSet[fid] });
      pile.push({ faceId: fid, scholar: !!scholarSet[fid] });
    }
    shuffle(pile);
    var cards = [];
    for (var k = 0; k < pile.length; k++) {
      var p = pile[k];
      cards.push({
        id: k,
        faceId: p.faceId,
        scholar: p.scholar,
        revealed: false,
        matched: false,
        flipT: 0,           // 0 = back-up, 1 = face-up. Animated.
        targetFlip: 0,
        col: 0, row: 0,     // set by layout
        x: 0, y: 0, w: 0, h: 0
      });
    }
    layoutCards(cards, cfg.cols, cfg.rows);
    state.cards = cards;
  }

  function pickFaceIds(n) {
    // pick n unique faces from FACES, biased to mix categories
    var pool = FACES.slice();
    shuffle(pool);
    var out = [];
    for (var i = 0; i < pool.length && out.length < n; i++) out.push(pool[i].id);
    return out;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
  }

  function layoutCards(cards, cols, rows) {
    // Layout grid centered in 720x720 logical board
    var topMargin = 130;       // leave room for HUD + ribbon
    var bottomMargin = 30;
    var sideMargin = 80;       // room for power-up tray on the left
    var availW = LOGICAL_W - sideMargin * 2;
    var availH = LOGICAL_H - topMargin - bottomMargin;
    var gap = 12;
    var cellW = (availW - (cols - 1) * gap) / cols;
    var cellH = (availH - (rows - 1) * gap) / rows;
    // Cards prefer taller than wide
    var cw = Math.min(cellW, cellH * 0.78);
    var ch = cw * 1.28;
    if (ch > cellH) {
      ch = cellH;
      cw = ch * 0.78;
    }
    var totalGridW = cols * cw + (cols - 1) * gap;
    var totalGridH = rows * ch + (rows - 1) * gap;
    var startX = (LOGICAL_W - totalGridW) / 2;
    var startY = topMargin + (availH - totalGridH) / 2;

    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var col = i % cols;
      var row = Math.floor(i / cols);
      c.col = col;
      c.row = row;
      c.x = startX + col * (cw + gap);
      c.y = startY + row * (ch + gap);
      c.w = cw;
      c.h = ch;
    }
  }

  // -- Input -----------------------------------------------------------------
  var lastTouchEndTs = 0;
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      // Ignore browser shortcut combos so Cmd+P (print) etc. still work
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      if (phase === "playing") {
        if (k === "1") { usePowerup(1); e.preventDefault(); return; }
        if (k === "2") { usePowerup(2); e.preventDefault(); return; }
        if (k === "3") { usePowerup(3); e.preventDefault(); return; }
        if (k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
      }
      if (phase === "paused" && (k === "p" || k === "P" || k === " ")) {
        if (e.repeat) return;
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
    canvas.addEventListener("click", function (e) {
      // Suppress synthetic click after touchend (mobile ghost tap)
      if (Date.now() - lastTouchEndTs < 500) return;
      if (phase !== "playing") return;
      var c = canvasToCard(e.clientX, e.clientY);
      if (!c) return;
      onCardClick(c);
    });
    canvas.addEventListener("touchend", function (e) {
      lastTouchEndTs = Date.now();
      if (phase !== "playing") return;
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var c = canvasToCard(t.clientX, t.clientY);
      if (c) {
        e.preventDefault();
        onCardClick(c);
      }
    }, { passive: false });
    [dom.puSlot1, dom.puSlot2, dom.puSlot3].forEach(function (slot) {
      if (!slot) return;
      slot.addEventListener("click", function (e) {
        e.preventDefault();
        var slotN = parseInt(slot.getAttribute("data-slot"), 10) || 1;
        usePowerup(slotN);
      });
    });
  }

  function canvasToCard(clientX, clientY) {
    if (!state || !state.cards) return null;
    var rect = canvas.getBoundingClientRect();
    var lx = (clientX - rect.left - offsetX) / scale;
    var ly = (clientY - rect.top - offsetY) / scale;
    for (var i = 0; i < state.cards.length; i++) {
      var c = state.cards[i];
      if (lx >= c.x && lx <= c.x + c.w && ly >= c.y && ly <= c.y + c.h) return c;
    }
    return null;
  }

  function onCardClick(c) {
    if (!state) return;
    if (state.lockInput) return;
    if (state.pendingFlipBack) return;
    if (state.pendingScholarMatch) return;
    if (c.matched) return;
    if (c.revealed) return;
    if (state.flippedQueue.length >= 2) return;
    // Block clicks on peek-visible (visually face-up) cards that aren't
    // actually revealed — prevents phantom double-flip during peek window.
    if (state.activePeek && !c.revealed) return;
    // flip
    c.revealed = true;
    c.targetFlip = 1;
    state.flippedQueue.push(c.id);
    sfx.card_flip();
    if (state.flippedQueue.length === 2) {
      // evaluate after flip animation completes (mostly visual; we evaluate now)
      var aId = state.flippedQueue[0];
      var bId = state.flippedQueue[1];
      var a = cardById(aId);
      var b = cardById(bId);
      if (a && b) evaluatePair(a, b);
    }
  }

  function cardById(id) {
    for (var i = 0; i < state.cards.length; i++) if (state.cards[i].id === id) return state.cards[i];
    return null;
  }

  function evaluatePair(a, b) {
    if (a.faceId === b.faceId) {
      onMatch(a, b);
    } else {
      onMismatch(a, b);
    }
  }

  function onMatch(a, b) {
    a.matched = true;
    b.matched = true;
    state.pairsMatched++;
    state.flippedQueue = [];
    state.wrongStreak = 0;
    var mult = state.scoreMultActive ? 2 : 1;
    var gain = Math.floor((BASE_MATCH_SCORE + Math.max(0, state.timeRemaining) * TIME_BONUS_FACTOR) * mult);
    state.score += gain;
    sfx.card_match();
    pushPopup("+" + gain, (a.x + b.x) / 2 + a.w / 2, (a.y + b.y) / 2 + a.h / 2, "is-score");
    var isScholarPair = a.scholar && b.scholar;
    // Reserve scholar slot immediately so the stage-clear timer waits for review
    if (isScholarPair) {
      state.pendingScholarMatch = { a: a.id, b: b.id };
      // small visual delay so the players see the match
      var aId = a.id, bId = b.id;
      clearPendingTimer("scholarOpen");
      pendingTimers.scholarOpen = setTimeout(function () {
        pendingTimers.scholarOpen = 0;
        if (phase !== "playing") {
          // If we never opened the question, clear the reservation so other paths can proceed
          if (state) state.pendingScholarMatch = null;
          return;
        }
        var ca = cardById(aId), cb = cardById(bId);
        if (ca && cb) openScholarQuestion(ca, cb);
        else if (state) state.pendingScholarMatch = null;
      }, SCHOLAR_FLIP_DELAY_MS);
    }
    // Check stage clear (skip if scholar review pending — onStageClear will be triggered after)
    if (allMatched() && !isScholarPair) {
      // small delay for visual celebration
      clearPendingTimer("stageClear");
      pendingTimers.stageClear = setTimeout(function () {
        pendingTimers.stageClear = 0;
        if (phase === "playing" && !state.pendingScholarMatch) onStageClear();
      }, 350);
    }
    // Random chance to drop a power-up on match
    maybeDropPowerup();
    updateHud();
    saveSnapshot();
  }

  function onMismatch(a, b) {
    state.flippedQueue = [];
    state.wrongStreak++;
    state.score = Math.max(0, state.score - MISMATCH_PENALTY);
    sfx.card_mismatch();
    pushPopup("-" + MISMATCH_PENALTY, (a.x + b.x) / 2 + a.w / 2, (a.y + b.y) / 2 + a.h / 2, "is-warn");
    state.lockInput = true;
    state.pendingFlipBack = { a: a.id, b: b.id, until: state.time + FLIP_BACK_DELAY_MS / 1000 };
    if (state.wrongStreak >= WRONG_STREAK_LIMIT) {
      // lose a life
      onLifeLost("Streak of " + state.wrongStreak + " wrong matches");
      state.wrongStreak = 0;
    }
    updateHud();
  }

  function allMatched() {
    if (!state.cards) return false;
    for (var i = 0; i < state.cards.length; i++) if (!state.cards[i].matched) return false;
    return true;
  }

  function onStageClear() {
    if (phase !== "playing") return;
    if (state.pendingScholarMatch) return; // wait for scholar review
    clearAllPendingTimers();
    var bonus = Math.floor(Math.max(0, state.timeRemaining) * STAGE_CLEAR_TIME_BONUS);
    state.score += bonus;
    sfx.stage_clear();
    pushPopup("STAGE CLEAR  +" + bonus, LOGICAL_W / 2, 220, "is-legend");
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#a991ff", "#4dd49b"] });
      }
    } catch (e) {}
    if (state.stage > state.maxStageReached) state.maxStageReached = state.stage;
    // Advance to next stage or complete run
    if (state.stage >= STAGE_ORDER.length) {
      // Run complete
      onRunComplete(true);
      return;
    }
    state.stage++;
    state.maxStageReached = Math.max(state.maxStageReached, state.stage);
    setupStage(state.stage);
    state.stageStartTs = Date.now();
    pushPopup("STAGE " + state.stage, LOGICAL_W / 2, 260, "is-bonus");
    updateHud();
    saveSnapshot();
  }

  function onLifeLost(reason) {
    if (!state) return;
    clearAllPendingTimers();
    state.pendingFlipBack = null;
    state.pendingScholarMatch = null;
    state.flippedQueue = [];
    state.lockInput = false;
    state.lives--;
    sfx.life_lost();
    pushPopup("LIFE LOST", LOGICAL_W / 2, 200, "is-warn");
    if (reason) pushPopup(reason, LOGICAL_W / 2, 240, "is-warn");
    if (state.lives <= 0) {
      onRunComplete(false);
      return;
    }
    // Reset stage with same difficulty
    setupStage(state.stage);
    state.stageStartTs = Date.now();
    updateHud();
    saveSnapshot();
  }

  function onRunComplete(victory) {
    phase = "ended";
    clearAllPendingTimers();
    stopMusic();
    sfx.gameOver();
    var prevBest = readBest();
    if (state.score > prevBest) writeBest(state.score);
    var shardsToAdd = Math.floor(state.score / SCORE_TO_SHARDS_RATIO);
    if (victory) shardsToAdd += RUN_COMPLETE_SHARDS;
    if (shardsToAdd > 0) addShards(shardsToAdd, GAME_ID + (victory ? "-run-complete" : "-run-end"));
    submitLeaderboard();
    recordPlayWithProfile({
      score: state.score,
      stage: state.maxStageReached,
      durationMs: Date.now() - state.runStartTs
    });
    clearSnapshot();
    showEndScreen(victory);
  }

  // -- Power-ups -------------------------------------------------------------
  // 5 types — peek, plus30s, shuffle_mismatch, score_2x, reveal_pair
  var POWERUP_TYPES = ["peek", "plus30s", "shuffle_mismatch", "score_2x", "reveal_pair"];
  var POWERUP_META = {
    peek:             { glyph: "👁", label: "Peek",         desc: "Briefly reveal all face-down cards" },
    plus30s:          { glyph: "⏱",         label: "+30s",         desc: "Add 30 seconds" },
    shuffle_mismatch: { glyph: "🔄", label: "Shuffle",      desc: "Re-shuffle viewed unmatched cards" },
    score_2x:         { glyph: "⭐",         label: "2x Mult",      desc: "Doubles match scoring this stage" },
    reveal_pair:      { glyph: "💡", label: "Reveal Pair",  desc: "Auto-flip a known unmatched pair" }
  };

  function maybeDropPowerup() {
    if (state.inventory.length >= POWERUP_CAP) return;
    if (Math.random() < 0.30) {
      var t = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      state.inventory.push(t);
      sfx.powerup_pickup();
      pushPopup(POWERUP_META[t].glyph + " " + POWERUP_META[t].label, LOGICAL_W / 2, 110, "is-bonus");
      updateHud();
    }
  }

  function usePowerup(slot) {
    if (phase !== "playing") return;
    if (!state) return;
    var idx = slot - 1;
    if (idx < 0 || idx >= state.inventory.length) return;
    var type = state.inventory[idx];
    // For powerups that can't be applied right now, refuse without consuming
    if ((type === "shuffle_mismatch" || type === "reveal_pair") &&
        (state.pendingFlipBack || state.pendingScholarMatch)) {
      return;
    }
    state.inventory.splice(idx, 1);
    sfx.powerup_use();
    if (type === "peek") {
      state.activePeek = { until: state.time + 2.0 };
      pushPopup("PEEK", LOGICAL_W / 2, 200, "is-cyan");
    } else if (type === "plus30s") {
      var maxTime = (GRID_CONFIGS[state.currentGrid] && GRID_CONFIGS[state.currentGrid].time + 60) || 300;
      state.timeRemaining = Math.min(state.timeRemaining + 30, maxTime);
      pushPopup("+30s", LOGICAL_W / 2, 200, "is-emerald");
    } else if (type === "shuffle_mismatch") {
      shuffleMismatchedViewed();
      pushPopup("SHUFFLE MISMATCH", LOGICAL_W / 2, 200, "is-cyan");
    } else if (type === "score_2x") {
      state.scoreMultActive = true;
      state.scoreMultStage = state.stage;
      pushPopup("2x MULT", LOGICAL_W / 2, 200, "is-bonus");
    } else if (type === "reveal_pair") {
      revealKnownPair();
      pushPopup("REVEAL PAIR", LOGICAL_W / 2, 200, "is-emerald");
    }
    updateHud();
  }

  function shuffleMismatchedViewed() {
    // Re-shuffle face IDs among unmatched cards that aren't currently being
    // evaluated (in flippedQueue) or mid-flip-back. Skip matched cards, skip
    // pending flip-back cards, skip the current flippedQueue selections.
    var skipIds = {};
    if (state.flippedQueue) {
      for (var f = 0; f < state.flippedQueue.length; f++) skipIds[state.flippedQueue[f]] = true;
    }
    if (state.pendingFlipBack) {
      skipIds[state.pendingFlipBack.a] = true;
      skipIds[state.pendingFlipBack.b] = true;
    }
    if (state.pendingScholarMatch) {
      skipIds[state.pendingScholarMatch.a] = true;
      skipIds[state.pendingScholarMatch.b] = true;
    }
    var pool = [];
    for (var i = 0; i < state.cards.length; i++) {
      var c = state.cards[i];
      if (c.matched) continue;          // never shuffle matched cards
      if (skipIds[c.id]) continue;      // never shuffle currently-flipped cards
      pool.push(c);
    }
    if (pool.length < 2) return;        // nothing meaningful to shuffle
    var ids = pool.map(function (c) { return c.faceId; });
    var scholars = pool.map(function (c) { return c.scholar; });
    // Pair faceId with scholar flag so we don't desync
    var pairs = ids.map(function (fid, idx) { return { fid: fid, scholar: scholars[idx] }; });
    shuffle(pairs);
    for (var k = 0; k < pool.length; k++) {
      pool[k].faceId = pairs[k].fid;
      pool[k].scholar = pairs[k].scholar;
      pool[k].revealed = false;
      pool[k].targetFlip = 0;
    }
  }

  function revealKnownPair() {
    // Find any two UNMATCHED cards that share a faceId; flip them face-up
    // briefly. Skip matched pairs (would waste the power-up) and skip cards
    // already in flippedQueue or pendingFlipBack.
    if (state.pendingFlipBack || state.pendingScholarMatch) {
      // Don't stomp another pending flip-back/scholar reservation
      return;
    }
    var skipIds = {};
    if (state.flippedQueue) {
      for (var f = 0; f < state.flippedQueue.length; f++) skipIds[state.flippedQueue[f]] = true;
    }
    var byFace = {};
    for (var i = 0; i < state.cards.length; i++) {
      var c = state.cards[i];
      if (c.matched) continue;          // never pick already-matched
      if (skipIds[c.id]) continue;
      if (!byFace[c.faceId]) byFace[c.faceId] = [];
      byFace[c.faceId].push(c);
    }
    for (var fid in byFace) {
      if (byFace[fid].length >= 2) {
        var a = byFace[fid][0], b = byFace[fid][1];
        a.targetFlip = 1;
        b.targetFlip = 1;
        a.revealed = true;
        b.revealed = true;
        // Auto flip them back after 1.4s as a hint, NOT a match
        state.lockInput = true;
        state.pendingFlipBack = { a: a.id, b: b.id, until: state.time + 1.4, isHint: true };
        return;
      }
    }
  }

  // -- Hud & screens ---------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatScore(state.score);
    if (dom.hudLives) dom.hudLives.textContent = state.lives;
    if (dom.hudStage) dom.hudStage.textContent = state.stage;
    if (dom.hudPairs) dom.hudPairs.textContent = (state.pairsTotal - state.pairsMatched);
    var total = GRID_CONFIGS[state.currentGrid] ? GRID_CONFIGS[state.currentGrid].time : 90;
    var t = Math.max(0, Math.ceil(state.timeRemaining));
    var mins = Math.floor(t / 60);
    var secs = t % 60;
    if (dom.hudTimer) dom.hudTimer.textContent = mins + ":" + (secs < 10 ? "0" : "") + secs;
    if (dom.hudTimerCell) {
      dom.hudTimerCell.classList.remove("is-warning", "is-danger", "is-good");
      if (t <= 10) dom.hudTimerCell.classList.add("is-danger");
      else if (t <= total * 0.25) dom.hudTimerCell.classList.add("is-warning");
    }
    if (dom.brandSub) dom.brandSub.textContent = state.scoreMultActive ? "2x · " + state.currentGrid + " · Recall" : "Flip · Match · Recall";
    if (dom.goalName) {
      var cfg = GRID_CONFIGS[state.currentGrid];
      dom.goalName.textContent = (cfg ? cfg.label : "4 × 4") + " · " + (cfg ? cfg.pairs : 8) + " pairs";
    }
    if (dom.goalMeta) dom.goalMeta.textContent = "Pairs · " + state.pairsMatched + "/" + state.pairsTotal + " matched";
    var slots = [dom.puSlot1, dom.puSlot2, dom.puSlot3];
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (!s) continue;
      var typ = state.inventory[i];
      var glyphEl = s.querySelector(".pu-glyph");
      if (typ) {
        s.classList.remove("empty");
        s.classList.add("has");
        s.title = POWERUP_META[typ].label + " — " + POWERUP_META[typ].desc;
        if (glyphEl) glyphEl.textContent = POWERUP_META[typ].glyph;
      } else {
        s.classList.remove("has");
        s.classList.add("empty");
        s.title = "Empty slot";
        if (glyphEl) glyphEl.textContent = "·";
      }
    }
    var best = readBest();
    if (dom.hudBest) dom.hudBest.textContent = best > 0 ? formatScore(Math.max(best, state.score)) : formatScore(state.score);
  }

  function formatScore(n) {
    n = Math.floor(n);
    if (n >= 1000000) return (n / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
    return String(n);
  }

  function pushPopup(text, x, y, cls) {
    if (!dom.popupOverlay) return;
    var el = document.createElement("div");
    el.className = "popup-text" + (cls ? " " + cls : "");
    el.textContent = text;
    var rect = canvas.getBoundingClientRect();
    var lx = offsetX + x * scale;
    var ly = offsetY + y * scale;
    el.style.left = lx + "px";
    el.style.top = ly + "px";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
  }

  function hideAllScreens() {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen].forEach(function (s) {
      if (s) s.classList.remove("show");
    });
  }
  function showScreen(name) {
    hideAllScreens();
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
  }

  function showEndScreen(victory) {
    if (!dom.endScreen) return;
    if (dom.endTitle) dom.endTitle.textContent = victory ? "Memory Palace · Run Complete" : "Memory Palace · Run Ended";
    if (dom.endKicker) dom.endKicker.textContent = victory ? "Champion" : "Run Ended";
    var html = "";
    var fields = [
      ["Score", formatScore(state.score)],
      ["Stage Reached", state.maxStageReached + " / " + STAGE_ORDER.length],
      ["Pairs Matched", state.pairsMatched + " / " + state.pairsTotal],
      ["Scholars Correct", state.questionsAnsweredCorrect + " / " + state.questionsAnsweredTotal],
      ["Shards", "+" + state.shardsAwarded],
      ["Best", formatScore(readBest())]
    ];
    for (var i = 0; i < fields.length; i++) {
      html += '<div class="end-cell">' +
        '<div class="end-cell-label">' + fields[i][0] + '</div>' +
        '<div class="end-cell-value">' + escapeHtml(fields[i][1]) + '</div>' +
        '</div>';
    }
    dom.endGrid.innerHTML = html;
    if (dom.retryHint) {
      dom.retryHint.textContent = victory
        ? "Three palaces decoded. Tap Play Again to chase a higher score."
        : "Lives expired. Tap Play Again to retry the run.";
    }
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.stopTracking(); MrMacsEndRecap.render(document.getElementById("endRecap")); } } catch (e) {}
    showScreen("end");
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing") {
      phase = "paused";
      pauseMusic();
      showScreen("pause");
      renderPauseProgress();
    } else if (phase === "paused") {
      phase = "playing";
      hideAllScreens();
      resumeMusic();
      // Reset frame timer so the first dt after resume isn't a huge spike
      lastFrame = 0;
    }
  }

  function exitToHub() {
    stopMusic();
    try { window.location.href = "../../index.html"; } catch (e) {}
  }

  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        var el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
      } else if (document.exitFullscreen) document.exitFullscreen();
    } catch (e) {}
  }

  // -- Scholar review --------------------------------------------------------
  function pickQuestion() {
    // MRMAC_QUESTION_VALIDATOR_V1 — retry up to 10× for a valid inline question
    if (!INLINE_BANK || !INLINE_BANK.length) return null;
    function buildShape(raw) {
      return {
        prompt: raw.prompt,
        choices: raw.choices.slice(),
        correctText: raw.correctText,
        hint: raw.hint
      };
    }
    var picked = (typeof window !== "undefined" && window.MrMacsPickValidQuestion)
      ? window.MrMacsPickValidQuestion(function () {
          return buildShape(INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)]);
        }, 10)
      : null;
    if (picked) return picked;
    var q = INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
    return buildShape(q);
  }

  function openScholarQuestion(a, b) {
    activeQuestion = pickQuestion();
    if (!activeQuestion) {
      // No question bank available — clear reservation and finish stage if needed
      if (state) state.pendingScholarMatch = null;
      if (state && allMatched()) onStageClear();
      return;
    }
    state.pendingScholarMatch = { a: a.id, b: b.id };
    sfx.scholar_match();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Pair · Optional · +" + SCHOLAR_BONUS + " + " + SCHOLAR_SHARDS + " shards";
    if (dom.questionCloseBtn) dom.questionCloseBtn.textContent = "Skip";
    renderQuestion();
    prevPhase = (phase === "question") ? (prevPhase || "playing") : phase;
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
      html += '<button class="choice-btn" data-text="' + escapeAttr(choices[k]) + '">' +
        '<span class="choice-letter">' + letters[k] + '</span>' +
        escapeHtml(choices[k]) + '</button>';
    }
    dom.choiceGrid.innerHTML = html;
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    for (var bi = 0; bi < btns.length; bi++) btns[bi].addEventListener("click", onChoiceClick);
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
      dom.explanation.textContent = "Decoded! +" + SCHOLAR_BONUS + " plus " + SCHOLAR_SHARDS + " shards.";
      dom.explanation.className = "explanation is-correct";
      state.questionsAnsweredCorrect++;
      sfx.scholar_correct();
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText +
        (activeQuestion.hint ? "  ·  Hint: " + activeQuestion.hint : "");
      dom.explanation.className = "explanation is-wrong";
      sfx.scholar_wrong();
    }
    state.questionsAnsweredTotal++;
    clearPendingTimer("questionClose");
    pendingTimers.questionClose = setTimeout(function () {
      pendingTimers.questionClose = 0;
      closeQuestion(correct);
    }, 1100);
  }

  function closeQuestion(wasCorrect) {
    clearPendingTimer("questionClose");
    if (phase !== "question") return; // already closed (e.g. via skip / Esc)
    if (wasCorrect && state) {
      state.score += SCHOLAR_BONUS;
      addShards(SCHOLAR_SHARDS, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCHOLAR_BONUS + " SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
    }
    activeQuestion = null;
    if (state) state.pendingScholarMatch = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
    if (state && allMatched()) onStageClear();
  }

  function skipQuestion() {
    clearPendingTimer("questionClose");
    if (phase !== "question") return;
    activeQuestion = null;
    if (state) state.pendingScholarMatch = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
    if (state && allMatched()) onStageClear();
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  // -- Hub integration -------------------------------------------------------
  function addShards(n, source) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, source || (GAME_ID + "-default"));
      }
    } catch (e) {}
  }

  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          stage: state.maxStageReached,
          pairs: state.pairsMatched
        });
      }
    } catch (e) {}
  }

  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    var now = Date.now();
    if (now - lastSnapshotTs < 800) return;
    lastSnapshotTs = now;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          stage: state.stage,
          lives: state.lives,
          pairsMatched: state.pairsMatched,
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
  function recordPlayWithProfile(extra) {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        var payload = {
          gameId: GAME_ID,
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/memory-palace/index.html"
        };
        if (extra && typeof extra === "object") {
          if (extra.score != null) payload.score = extra.score;
          if (extra.durationMs != null) payload.durationMs = extra.durationMs;
          if (extra.stage != null) payload.stage = extra.stage;
        }
        window.MrMacsProfile.recordPlay(payload);
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

  // -- Resize ----------------------------------------------------------------
  var resizeRaf = 0;
  function onResizeDebounced() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resize);
  }
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

  // -- Frame loop ------------------------------------------------------------
  function raf() {
    rafHandle = requestAnimationFrame(function (ts) {
      var dt = Math.min(0.06, (ts - lastFrame) / 1000 || 0.016);
      lastFrame = ts;
      tick(dt);
      draw();
      raf();
    });
  }

  function tick(dt) {
    if (phase === "playing") {
      if (!state) return;
      state.time += dt;
      state.timeRemaining -= dt;
      if (state.timeRemaining <= 10 && state.timeRemaining > 0 && state.lastTimerWarnAt < state.time - 1.0) {
        sfx.time_low_warn();
        state.lastTimerWarnAt = state.time;
      }
      if (state.timeRemaining <= 0) {
        state.timeRemaining = 0;
        // Cancel any pending mid-flip / scholar / stage-clear timers so they don't
        // fire after the stage has been reset by onLifeLost.
        clearAllPendingTimers();
        state.pendingFlipBack = null;
        state.pendingScholarMatch = null;
        state.flippedQueue = [];
        state.lockInput = false;
        onLifeLost("Time expired");
        return;
      }
      // Pending flip-back
      if (state.pendingFlipBack && state.time >= state.pendingFlipBack.until) {
        var pa = cardById(state.pendingFlipBack.a);
        var pb = cardById(state.pendingFlipBack.b);
        if (pa && !pa.matched) { pa.revealed = false; pa.targetFlip = 0; }
        if (pb && !pb.matched) { pb.revealed = false; pb.targetFlip = 0; }
        state.pendingFlipBack = null;
        state.lockInput = false;
      }
      // Peek timer
      if (state.activePeek && state.time >= state.activePeek.until) {
        state.activePeek = null;
      }
      // Animate flip values — snap immediately under reduced-motion
      for (var i = 0; i < state.cards.length; i++) {
        var c = state.cards[i];
        var target = c.targetFlip;
        if (state.activePeek && !c.matched) target = 1; // force face-up during peek
        if (c.matched) target = 1;
        if (reducedMotion) {
          c.flipT = target; // instant snap — no animation
        } else {
          // Smooth lerp
          if (c.flipT < target) c.flipT = Math.min(target, c.flipT + dt * 5.5);
          else if (c.flipT > target) c.flipT = Math.max(target, c.flipT - dt * 5.5);
        }
      }
      // Periodic save
      if (state.time % 5 < dt) saveSnapshot();
      updateHud();
    }
    if (phase === "setup") {
      // gentle title animation
    }
  }

  function draw() {
    // clear
    ctx.fillStyle = "#0a0c12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    if (phase === "setup") drawTitle();
    else drawBoard();
    ctx.restore();
  }

  function drawTitle() {
    // Soft ambient frame
    ctx.fillStyle = "rgba(245, 196, 81, 0.04)";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }

  function drawBoard() {
    // Editorial backdrop tint by stage
    var stageTint;
    if (state.stage === 1) stageTint = "rgba(93, 224, 240, 0.04)";
    else if (state.stage === 2) stageTint = "rgba(77, 212, 155, 0.04)";
    else stageTint = "rgba(169, 145, 255, 0.04)";
    ctx.fillStyle = stageTint;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Cards
    for (var i = 0; i < state.cards.length; i++) {
      drawCard(state.cards[i]);
    }
  }

  function drawCard(c) {
    var cx = c.x + c.w / 2;
    var cy = c.y + c.h / 2;
    // Flip rotation: scale X around centre
    var flipScale = Math.cos((1 - c.flipT) * Math.PI);
    // 0 = face-down (scale -1), 1 = face-up (scale 1)
    // Use abs to get magnitude, side determines what face draws
    var sx = c.flipT >= 0.5 ? Math.max(0.05, flipScale) : Math.max(0.05, -flipScale);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, 1);
    ctx.translate(-cx, -cy);

    // Card shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(c.x + 3, c.y + 5, c.w, c.h);

    if (c.flipT >= 0.5) {
      // Face-up
      drawCardFace(c);
    } else {
      drawCardBack(c);
    }

    ctx.restore();

    // Scholar gilt-rim glow + rotating "?" applies on faces; drawn inside drawCardFace.
    // Matched fade
    if (c.matched) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(20, 30, 22, 0.4)";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.restore();
    }
  }

  function drawCardBack(c) {
    // Card body — dark navy with subtle gradient + ornate frame
    var grd = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h);
    grd.addColorStop(0, "#2a3550");
    grd.addColorStop(1, "#1a2440");
    ctx.fillStyle = grd;
    roundRect(c.x, c.y, c.w, c.h, 10);
    ctx.fill();
    // Inner frame
    ctx.strokeStyle = "rgba(245, 196, 81, 0.35)";
    ctx.lineWidth = 1.4;
    roundRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10, 8);
    ctx.stroke();
    // Crest motif: diamond + dot pattern
    var cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    ctx.strokeStyle = "rgba(93, 224, 240, 0.45)";
    ctx.lineWidth = 1.6;
    var ds = Math.min(c.w, c.h) * 0.18;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ds);
    ctx.lineTo(cx + ds, cy);
    ctx.lineTo(cx, cy + ds);
    ctx.lineTo(cx - ds, cy);
    ctx.closePath();
    ctx.stroke();
    // Center dot
    ctx.fillStyle = "rgba(245, 196, 81, 0.55)";
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Corner pips
    var corners = [[0.18, 0.18], [0.82, 0.18], [0.18, 0.82], [0.82, 0.82]];
    for (var ci = 0; ci < corners.length; ci++) {
      var px = c.x + corners[ci][0] * c.w;
      var py = c.y + corners[ci][1] * c.h;
      ctx.fillStyle = "rgba(168, 145, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(px, py, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCardFace(c) {
    // Card body — parchment cream
    var grd = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h);
    grd.addColorStop(0, "#f0e1b8");
    grd.addColorStop(1, "#d8c590");
    ctx.fillStyle = grd;
    roundRect(c.x, c.y, c.w, c.h, 10);
    ctx.fill();
    ctx.strokeStyle = "#786040";
    ctx.lineWidth = 1.6;
    roundRect(c.x, c.y, c.w, c.h, 10);
    ctx.stroke();

    var face = FACES[c.faceId];
    var hue = CAT_HUE[face.cat] || "#a96e3d";
    // Face icon (centered)
    var faceCx = c.x + c.w / 2;
    var faceCy = c.y + c.h * 0.42;
    var faceSize = Math.min(c.w, c.h) * 0.28;
    try { face.draw(ctx, faceCx, faceCy, faceSize, hue); } catch (e) {}

    // Category strip
    ctx.fillStyle = hue;
    ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, 4);

    // Label
    ctx.fillStyle = "#1a1208";
    ctx.font = "700 " + Math.max(9, Math.floor(c.h * 0.085)) + "px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(face.label, c.x + c.w / 2, c.y + c.h * 0.82);

    // Category badge
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(c.x + 6, c.y + c.h - 18, c.w - 12, 12);
    ctx.fillStyle = hue;
    ctx.font = "700 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(face.cat, c.x + c.w / 2, c.y + c.h - 12);

    if (c.scholar) {
      drawScholarRim(c);
    }
  }

  function drawScholarRim(c) {
    // Gold gilt rim
    ctx.save();
    ctx.strokeStyle = "#f5c451";
    ctx.lineWidth = 3.0;
    roundRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2, 9);
    ctx.stroke();
    // Glow
    ctx.shadowColor = "rgba(245, 196, 81, 0.6)";
    ctx.shadowBlur = 8;
    roundRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2, 9);
    ctx.stroke();
    ctx.restore();
    // Rotating "?" chip in top-right
    var qx = c.x + c.w - 14;
    var qy = c.y + 14;
    ctx.save();
    ctx.translate(qx, qy);
    var t = (state.time || 0) * 1.6;
    ctx.rotate(Math.sin(t) * 0.18);
    ctx.fillStyle = "rgba(245, 196, 81, 0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1208";
    ctx.font = "900 12px 'Fraunces', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 1);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    if (r == null) r = 6;
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
    var GAME_ID_LOCAL = "memory-palace";
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
