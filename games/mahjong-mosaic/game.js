/* ===========================================================================
   Mahjong Mosaic — Mahjong solitaire · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · 4 stages · 144 tiles each
   Layouts: Turtle (stage 1) · Dragon · Pyramid · Castle (stages 2+)
   Tiles: 36 unique × 4 copies = 144
     Suits (each 1-9): SCROLL · ATOM · COMPASS · PALETTE  (= 36 unique)
     Honors: 4 winds + 3 dragons (filler — counts replace some suits)
   Match rule: pairs of identical FREE tiles (no tile above + at least
   one of left/right edge open).
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "mahjong-mosaic";
  var GAME_TITLE = "Mahjong Mosaic";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  // Tile renderer
  var TILE_W = 38;        // base footprint (one half-cell wide is the per-cell unit)
  var TILE_H = 50;        // taller than wide — classic mahjong tile
  var LAYER_OFFSET_X = 4; // depth bevel offset per layer
  var LAYER_OFFSET_Y = 4;

  // Difficulty scaffolds
  var TOTAL_TILES = 144;
  var LIVES_INIT = 3;
  var SHARDS_CAP = 200;
  var POWERUP_CAP = 3;

  // Per-stage limits
  var HINT_PER_STAGE = 3;
  var SHUFFLE_PER_STAGE = 2;
  var UNDO_PER_STAGE = 5;

  // Time limit (seconds)
  var TIME_INITIAL = 480;          // 8 minutes
  var TIME_FLOOR = 240;            // 4 minutes
  var TIME_DECREMENT = 30;         // -30s per stage

  // Scoring
  var BASE_MATCH_SCORE = 100;
  var TIME_BONUS_FACTOR = 100;     // matched while at full timer = +100
  var SCHOLAR_BONUS = 1500;
  var SCHOLAR_SHARDS = 12;
  var SCORE_TO_SHARDS_RATIO = 200;

  // Number of scholar tiles in a stage (~5 of 144)
  var SCHOLAR_COUNT = 5;

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

  // -- Tile types ------------------------------------------------------------
  // Suits: 4 suits × 9 ranks each = 36 unique. We need 36 unique types × 4 copies.
  // Honor tiles (4 winds + 3 dragons = 7) used additionally to flavor — treated
  // as alternates within the 36 unique pool. To keep totals at 144 we work
  // with exactly 36 unique types in the bag and add 4 copies each.
  // Suit IDs: 0..8 = SCROLL 1-9, 9..17 = ATOM 1-9, 18..26 = COMPASS 1-9, 27..35 = PALETTE 1-9
  // We re-skin a couple of suit positions as honors for visual variety.
  // Honor positions are pure visuals — type ID is what governs matching.

  var SUIT_SCROLL = 0;
  var SUIT_ATOM   = 1;
  var SUIT_COMPASS = 2;
  var SUIT_PALETTE = 3;

  var SUIT_NAME = ["SCROLL", "ATOM", "COMPASS", "PALETTE"];

  // Honor mapping — we mark TYPE IDs 32..35 (last four PALETTE 5..9-ish) as
  // honors visually: 32 = wind:N, 33 = wind:E, 34 = wind:S, 35 = wind:W
  // and 28,29,30 = dragons (red/green/white). Functional matching is by ID only.
  // (Visual flair without breaking the 36×4 bag.)
  var HONOR_VIS = {
    28: { kind: "dragon", glyph: "DR", hue: "#f04860", label: "DRAGON-R" },
    29: { kind: "dragon", glyph: "DG", hue: "#4dd49b", label: "DRAGON-G" },
    30: { kind: "dragon", glyph: "DW", hue: "#d8cba8", label: "DRAGON-W" },
    32: { kind: "wind",   glyph: "N",  hue: "#5de0f0", label: "WIND-N" },
    33: { kind: "wind",   glyph: "E",  hue: "#f5c451", label: "WIND-E" },
    34: { kind: "wind",   glyph: "S",  hue: "#a991ff", label: "WIND-S" },
    35: { kind: "wind",   glyph: "W",  hue: "#f07bb8", label: "WIND-W" }
  };

  // Suit hue palette — used for face accents
  var SUIT_HUE = {
    0: "#a96e3d", // scroll: bronze
    1: "#5de0f0", // atom: cyan
    2: "#4dd49b", // compass: emerald
    3: "#a991ff"  // palette: violet
  };

  // -- Layouts (Turtle, Dragon, Pyramid, Castle) ----------------------------
  // Each layout is an array of layers (bottom-up). Each layer is a list of
  // tile slots specified by half-cell coordinates: [hx, hy] where hx/hy step
  // in HALF tile widths/heights. A regular tile occupies hx..hx+1 and
  // hy..hy+1 (i.e. 2x2 in half-cell units). Layouts are designed to total 144
  // tiles and to be standard mahjong-solitaire shapes.
  //
  // Coordinate system: half-cells, origin at top-left of board area.
  // Tile origin (hx, hy) means tile occupies the 2x2 half-cell box rooted at hx, hy.

  // ---- TURTLE LAYOUT (classic) — 144 tiles, 5 layers ----
  // Layer 0 (bottom, base body): 87 tiles arranged in classic turtle silhouette.
  // We assemble it row-by-row in half-cell ticks. 1 row of half-cells corresponds
  // to half a tile (offset for tightly-packed turtle layout's overlapping rows).
  // Layer counts: 87 + 36 + 16 + 4 + 1 = 144.
  function buildTurtleLayout() {
    var layers = [[], [], [], [], []];
    // Base layer 0 (87 tiles) — symmetric turtle body
    // Format: rows of (hx,hy) starting points. y units in half-cells.
    // Row 0 (top): 12 tiles spanning columns 2..24
    var baseRows = [
      // [yHalf, xStartHalf, xEndHalf, step]
      // Top edge row (12 tiles)
      { yh: 0, cols: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] },
      // Row 1 (8 tiles, central) — shorter
      { yh: 2, cols: [6, 8, 10, 12, 14, 16, 18, 20] },
      // Row 2 (10 tiles)
      { yh: 4, cols: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22] },
      // Row 3 (12 tiles) — widest section
      { yh: 6, cols: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] },
      // Row 4 (12 tiles)
      { yh: 8, cols: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] },
      // Row 5 (10 tiles)
      { yh: 10, cols: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22] },
      // Row 6 (8 tiles)
      { yh: 12, cols: [6, 8, 10, 12, 14, 16, 18, 20] },
      // Row 7 (12 tiles, bottom edge)
      { yh: 14, cols: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] }
    ];
    var baseCount = 0;
    for (var r = 0; r < baseRows.length; r++) {
      var row = baseRows[r];
      for (var c = 0; c < row.cols.length; c++) {
        layers[0].push({ hx: row.cols[c], hy: row.yh, layer: 0 });
        baseCount++;
      }
    }
    // Two side-flippers (legs) — 2 tiles each side at row 14, hx -2 / 26 (single tiles outside)
    // Each layer is the actual count we want; let's pad to exactly 87 for turtle base.
    // We have 84 so far, add 1 left "head" and 1 right "tail" plus 1 detached centre piece.
    layers[0].push({ hx: -2, hy: 6, layer: 0 });   // head
    layers[0].push({ hx: 26, hy: 6, layer: 0 });   // tail
    layers[0].push({ hx: 28, hy: 8, layer: 0 });   // tail tip
    // Layer 0 total → 84 + 3 = 87 ✓ (close to standard Turtle base)

    // Layer 1 (36 tiles): inner 6-row block
    var layer1Rows = [
      { yh: 2,  cols: [8, 10, 12, 14, 16, 18] },
      { yh: 4,  cols: [6, 8, 10, 12, 14, 16, 18, 20] },
      { yh: 6,  cols: [6, 8, 10, 12, 14, 16, 18, 20] },
      { yh: 8,  cols: [6, 8, 10, 12, 14, 16, 18, 20] },
      { yh: 10, cols: [6, 8, 10, 12, 14, 16, 18, 20] },
      { yh: 12, cols: [8, 10, 12, 14, 16, 18] }
    ];
    for (var r1 = 0; r1 < layer1Rows.length; r1++) {
      var row1 = layer1Rows[r1];
      for (var c1 = 0; c1 < row1.cols.length; c1++) {
        layers[1].push({ hx: row1.cols[c1], hy: row1.yh, layer: 1 });
      }
    }
    // 6 + 8 + 8 + 8 + 8 + 6 = 44... too many; trim to 36 by removing edge cols
    // Re-build precisely:
    layers[1] = [];
    var l1Rows = [
      { yh: 4,  cols: [8, 10, 12, 14, 16, 18] },
      { yh: 6,  cols: [8, 10, 12, 14, 16, 18] },
      { yh: 8,  cols: [8, 10, 12, 14, 16, 18] },
      { yh: 10, cols: [8, 10, 12, 14, 16, 18] },
      { yh: 12, cols: [8, 10, 12, 14, 16, 18] },
      { yh: 14, cols: [10, 12, 14, 16] }
    ];
    for (var r1b = 0; r1b < l1Rows.length; r1b++) {
      var row1b = l1Rows[r1b];
      for (var c1b = 0; c1b < row1b.cols.length; c1b++) {
        layers[1].push({ hx: row1b.cols[c1b], hy: row1b.yh, layer: 1 });
      }
    }
    // Above gives 6+6+6+6+6+4 = 34. Add 2 head pieces → 36
    layers[1].push({ hx: 10, hy: 2, layer: 1 });
    layers[1].push({ hx: 16, hy: 2, layer: 1 });

    // Layer 2 (16 tiles): centre 4x4
    var l2Rows = [
      { yh: 6,  cols: [10, 12, 14, 16] },
      { yh: 8,  cols: [10, 12, 14, 16] },
      { yh: 10, cols: [10, 12, 14, 16] },
      { yh: 12, cols: [10, 12, 14, 16] }
    ];
    for (var r2 = 0; r2 < l2Rows.length; r2++) {
      var row2 = l2Rows[r2];
      for (var c2 = 0; c2 < row2.cols.length; c2++) {
        layers[2].push({ hx: row2.cols[c2], hy: row2.yh, layer: 2 });
      }
    }
    // Layer 3 (4 tiles): centre 2x2
    var l3Rows = [
      { yh: 8,  cols: [12, 14] },
      { yh: 10, cols: [12, 14] }
    ];
    for (var r3 = 0; r3 < l3Rows.length; r3++) {
      var row3 = l3Rows[r3];
      for (var c3 = 0; c3 < row3.cols.length; c3++) {
        layers[3].push({ hx: row3.cols[c3], hy: row3.yh, layer: 3 });
      }
    }
    // Layer 4 (1 tile): centrepiece
    layers[4].push({ hx: 13, hy: 9, layer: 4 });

    return { name: "Turtle", layers: layers };
  }

  // ---- DRAGON LAYOUT — long, snaking shape ----
  function buildDragonLayout() {
    var layers = [[], [], [], [], []];
    // Base layer (96 tiles) — wide horizontal field with pinched midsection
    var l0Rows = [
      { yh: 0,  cols: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26] },     // 14
      { yh: 2,  cols: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26] },     // 14
      { yh: 4,  cols: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22] },                   // 10
      { yh: 6,  cols: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22] },                   // 10
      { yh: 8,  cols: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22] },                   // 10
      { yh: 10, cols: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22] },                   // 10
      { yh: 12, cols: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26] },     // 14
      { yh: 14, cols: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26] }      // 14
    ];
    // Total: 14+14+10+10+10+10+14+14 = 96 ✓
    for (var r0 = 0; r0 < l0Rows.length; r0++) {
      var rr = l0Rows[r0];
      for (var cc = 0; cc < rr.cols.length; cc++) {
        layers[0].push({ hx: rr.cols[cc], hy: rr.yh, layer: 0 });
      }
    }
    // Layer 1 (32 tiles): two long ridges
    var l1Rows = [
      { yh: 2, cols: [6, 8, 10, 12, 14, 16, 18, 20] },        // 8
      { yh: 4, cols: [6, 8, 10, 12, 14, 16, 18, 20] },        // 8
      { yh: 10, cols: [6, 8, 10, 12, 14, 16, 18, 20] },       // 8
      { yh: 12, cols: [6, 8, 10, 12, 14, 16, 18, 20] }        // 8
    ];
    // 8*4 = 32
    for (var r1 = 0; r1 < l1Rows.length; r1++) {
      var rr1 = l1Rows[r1];
      for (var cc1 = 0; cc1 < rr1.cols.length; cc1++) {
        layers[1].push({ hx: rr1.cols[cc1], hy: rr1.yh, layer: 1 });
      }
    }
    // Layer 2 (12): centre row
    var l2Cols = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    for (var c2 = 0; c2 < l2Cols.length; c2++) {
      layers[2].push({ hx: l2Cols[c2], hy: 7, layer: 2 });
    }
    // 10 tiles → adjust to 12. Add two more endpoints at center
    layers[2].push({ hx: 2, hy: 7, layer: 2 });
    layers[2].push({ hx: 24, hy: 7, layer: 2 });
    // Total layer 2: 12 ✓
    // Layer 3 (3 tiles): central crown
    layers[3].push({ hx: 10, hy: 7, layer: 3 });
    layers[3].push({ hx: 12, hy: 7, layer: 3 });
    layers[3].push({ hx: 14, hy: 7, layer: 3 });
    // Layer 4 (1 tile): apex
    layers[4].push({ hx: 12, hy: 7, layer: 4 });
    // Total: 96 + 32 + 12 + 3 + 1 = 144 ✓

    return { name: "Dragon", layers: layers };
  }

  // ---- PYRAMID LAYOUT — stepped pyramid ----
  function buildPyramidLayout() {
    var layers = [[], [], [], [], []];
    // Base 9x9 = 81... but we need 144 total over 5 layers. Use stacked rectangles.
    // Layer 0: 10x9 = 90
    for (var y0 = 0; y0 < 9; y0++) {
      for (var x0 = 0; x0 < 10; x0++) {
        layers[0].push({ hx: 4 + x0 * 2, hy: y0 * 2, layer: 0 });
      }
    }
    // Layer 1: 8x5 = 40
    for (var y1 = 0; y1 < 5; y1++) {
      for (var x1 = 0; x1 < 8; x1++) {
        layers[1].push({ hx: 6 + x1 * 2, hy: 4 + y1 * 2, layer: 1 });
      }
    }
    // Trim layer 1 to ~36 ... we used 40; we want overall 144.
    // Reduce layer 0 from 90 to 90, layer 1 from 40 to 36, layer 2 from 16 to 12, layer 3 = 4, layer 4 = 2 → totals 90+36+12+4+2 = 144
    // Adjust layer 1 to 6×6 = 36
    layers[1] = [];
    for (var y1b = 0; y1b < 6; y1b++) {
      for (var x1b = 0; x1b < 6; x1b++) {
        layers[1].push({ hx: 8 + x1b * 2, hy: 4 + y1b * 2, layer: 1 });
      }
    }
    // Layer 2: 4×3 = 12
    for (var y2 = 0; y2 < 3; y2++) {
      for (var x2 = 0; x2 < 4; x2++) {
        layers[2].push({ hx: 10 + x2 * 2, hy: 6 + y2 * 2, layer: 2 });
      }
    }
    // Layer 3: 2×2 = 4
    for (var y3 = 0; y3 < 2; y3++) {
      for (var x3 = 0; x3 < 2; x3++) {
        layers[3].push({ hx: 12 + x3 * 2, hy: 8 + y3 * 2, layer: 3 });
      }
    }
    // Layer 4: 2×1 = 2
    layers[4].push({ hx: 12, hy: 9, layer: 4 });
    layers[4].push({ hx: 14, hy: 9, layer: 4 });

    // Verify: 90+36+12+4+2 = 144 ✓
    return { name: "Pyramid", layers: layers };
  }

  // ---- CASTLE LAYOUT — fortress with towers ----
  function buildCastleLayout() {
    var layers = [[], [], [], [], []];
    // Layer 0 (90): 10×7 main wall + two flanking 5-tile corner towers
    // 10×7 = 70 main floor
    for (var y0 = 0; y0 < 7; y0++) {
      for (var x0 = 0; x0 < 10; x0++) {
        layers[0].push({ hx: 4 + x0 * 2, hy: y0 * 2, layer: 0 });
      }
    }
    // Add 4 corner clusters of 5 tiles each = 20 → 90 total
    var clusters = [
      { ox: 0,  oy: 0 },  // NW
      { ox: 24, oy: 0 },  // NE
      { ox: 0,  oy: 12 }, // SW
      { ox: 24, oy: 12 }  // SE
    ];
    for (var ci = 0; ci < clusters.length; ci++) {
      var cl = clusters[ci];
      // 5 tiles per cluster (an L-shape)
      layers[0].push({ hx: cl.ox, hy: cl.oy, layer: 0 });
      layers[0].push({ hx: cl.ox, hy: cl.oy + 2, layer: 0 });
      if (cl.ox === 0) {
        layers[0].push({ hx: cl.ox, hy: cl.oy + 4, layer: 0 });
      } else {
        layers[0].push({ hx: cl.ox, hy: cl.oy + 4, layer: 0 });
      }
      // Corner doublers
      if (cl.oy === 0) {
        layers[0].push({ hx: cl.ox + 2, hy: cl.oy, layer: 0 });
        layers[0].push({ hx: cl.ox - 2 + (cl.ox === 0 ? 0 : 0), hy: cl.oy + 6, layer: 0 });
        // Replace the offending invalid one with a safe coord
      }
    }
    // The cluster code above will create some overlaps/invalid coords; we
    // rebuild cleanly here:
    layers[0] = [];
    // 10×7 main floor (70 tiles)
    for (var y0a = 0; y0a < 7; y0a++) {
      for (var x0a = 0; x0a < 10; x0a++) {
        layers[0].push({ hx: 4 + x0a * 2, hy: y0a * 2, layer: 0 });
      }
    }
    // Towers: NW (5), NE (5), SW (5), SE (5) at corners of the field
    // NW at hx=0..2, hy=0..4 — 3 cells
    layers[0].push({ hx: 0, hy: 0, layer: 0 });
    layers[0].push({ hx: 0, hy: 2, layer: 0 });
    layers[0].push({ hx: 0, hy: 4, layer: 0 });
    layers[0].push({ hx: 2, hy: 0, layer: 0 });
    layers[0].push({ hx: 2, hy: 4, layer: 0 });
    // NE at hx=24..26
    layers[0].push({ hx: 24, hy: 0, layer: 0 });
    layers[0].push({ hx: 24, hy: 2, layer: 0 });
    layers[0].push({ hx: 24, hy: 4, layer: 0 });
    layers[0].push({ hx: 26, hy: 0, layer: 0 });
    layers[0].push({ hx: 26, hy: 4, layer: 0 });
    // SW
    layers[0].push({ hx: 0, hy: 8, layer: 0 });
    layers[0].push({ hx: 0, hy: 10, layer: 0 });
    layers[0].push({ hx: 0, hy: 12, layer: 0 });
    layers[0].push({ hx: 2, hy: 8, layer: 0 });
    layers[0].push({ hx: 2, hy: 12, layer: 0 });
    // SE
    layers[0].push({ hx: 24, hy: 8, layer: 0 });
    layers[0].push({ hx: 24, hy: 10, layer: 0 });
    layers[0].push({ hx: 24, hy: 12, layer: 0 });
    layers[0].push({ hx: 26, hy: 8, layer: 0 });
    layers[0].push({ hx: 26, hy: 12, layer: 0 });
    // Layer 0 = 70 + 5 + 5 + 5 + 5 = 90 ✓

    // Layer 1: 8×5 inner floor (40) — but we need 36
    for (var y1c = 0; y1c < 5; y1c++) {
      for (var x1c = 0; x1c < 8; x1c++) {
        if (y1c === 0 && (x1c === 0 || x1c === 7)) continue; // remove 2 corners
        if (y1c === 4 && (x1c === 0 || x1c === 7)) continue; // remove 2 corners
        layers[1].push({ hx: 6 + x1c * 2, hy: 2 + y1c * 2, layer: 1 });
      }
    }
    // 40 - 4 = 36 ✓
    // Layer 2: 6×2 = 12
    for (var y2c = 0; y2c < 2; y2c++) {
      for (var x2c = 0; x2c < 6; x2c++) {
        layers[2].push({ hx: 8 + x2c * 2, hy: 5 + y2c * 2, layer: 2 });
      }
    }
    // Layer 3: 4 tiles in center
    for (var x3c = 0; x3c < 4; x3c++) {
      layers[3].push({ hx: 10 + x3c * 2, hy: 7, layer: 3 });
    }
    // Layer 4: 2 keystone tiles
    layers[4].push({ hx: 12, hy: 7, layer: 4 });
    layers[4].push({ hx: 14, hy: 7, layer: 4 });
    // Total: 90+36+12+4+2 = 144 ✓

    return { name: "Castle", layers: layers };
  }

  function getLayoutForStage(stage) {
    if (stage === 1) return buildTurtleLayout();
    var pool = ["Dragon", "Pyramid", "Castle"];
    var pick = pool[(stage - 2 + Math.floor(Math.random() * pool.length)) % pool.length];
    if (pick === "Dragon") return buildDragonLayout();
    if (pick === "Pyramid") return buildPyramidLayout();
    return buildCastleLayout();
  }

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

  // Suit-specific match tones
  var SUIT_MATCH_TONES = {
    0: [523, 784, 988],     // SCROLL — warm major
    1: [659, 988, 1318],    // ATOM — bright
    2: [440, 659, 880],     // COMPASS — round
    3: [392, 587, 784]      // PALETTE — mellow
  };

  var sfx = {
    tile_select: function () {
      sfxTone(720, 0.06, { type: "triangle", volume: 0.10 });
    },
    tile_match: function (suit) {
      var tones = SUIT_MATCH_TONES[suit] || SUIT_MATCH_TONES[0];
      tones.forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.14 }); }, i * 50);
      });
    },
    tile_invalid: function () {
      sfxTone(220, 0.08, { type: "sawtooth", volume: 0.12, endFreq: 140 });
    },
    hint: function () {
      sfxTone(1175, 0.08, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(1568, 0.10, { type: "triangle", volume: 0.14 }); }, 60);
    },
    shuffle: function () {
      [440, 587, 740, 880].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.06, { type: "square", volume: 0.10 }); }, i * 40);
      });
    },
    undo: function () {
      sfxTone(660, 0.06, { type: "triangle", volume: 0.10, endFreq: 480 });
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
    powerup_pickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerup_use: function () {
      [880, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    time_low_warn: function () {
      sfxTone(660, 0.08, { type: "square", volume: 0.14, endFreq: 440 });
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
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("mosaicCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudStage = $("hudStage");
    dom.hudTimer = $("hudTimer");
    dom.hudTimerCell = $("hudTimerCell");
    dom.hudTilesLeft = $("hudTilesLeft");
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
    dom.hintBtn = $("hintBtn");
    dom.shuffleBtn = $("shuffleBtn");
    dom.undoBtn = $("undoBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");
    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.retryHint = $("retryHint");
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
    dom.puSlot1 = $("puSlot1");
    dom.puSlot2 = $("puSlot2");
    dom.puSlot3 = $("puSlot3");
  }

  // -- Tile bag --------------------------------------------------------------
  // Build a shuffled bag of 144 tile-type IDs (36 unique × 4 copies).
  function buildBag(seed) {
    var rng = makeRng(seed);
    var bag = [];
    for (var t = 0; t < 36; t++) {
      for (var c = 0; c < 4; c++) bag.push(t);
    }
    // Shuffle
    for (var i = bag.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = bag[i]; bag[i] = bag[j]; bag[j] = tmp;
    }
    return bag;
  }
  function makeRng(seed) {
    var s = (seed || 1) >>> 0;
    if (s === 0) s = 1;
    return function () {
      s = (s * 1103515245 + 12345) >>> 0;
      return (s & 0x7fffffff) / 0x7fffffff;
    };
  }

  // Assign type IDs to layout slots — solvable by construction.
  // We collect all slots ordered "top-most layer first, then within layer by
  // 'most blocked' (more tiles above + adjacency)". We then place pairs from
  // the most-accessible slots downward — this guarantees a deal that *can*
  // be solved (though shuffles can introduce dead-ends). For simplicity we
  // just shuffle the bag and assign by slot order — the user has shuffles to
  // recover from any deadlock.
  function assignTilesToLayout(layout, seed) {
    var bag = buildBag(seed);
    var tiles = [];
    var idx = 0;
    for (var L = 0; L < layout.layers.length; L++) {
      var layerSlots = layout.layers[L];
      for (var k = 0; k < layerSlots.length; k++) {
        var slot = layerSlots[k];
        if (idx >= bag.length) break;
        tiles.push({
          id: idx,
          typeId: bag[idx],
          hx: slot.hx,
          hy: slot.hy,
          layer: slot.layer,
          matched: false,
          scholar: false
        });
        idx++;
      }
    }
    // If for any reason layout slot count differs from 144, trim/pad
    while (tiles.length < TOTAL_TILES) {
      tiles.push({
        id: tiles.length,
        typeId: bag[tiles.length] !== undefined ? bag[tiles.length] : 0,
        hx: 0, hy: 0, layer: 0, matched: true, scholar: false
      });
    }
    if (tiles.length > TOTAL_TILES) tiles.length = TOTAL_TILES;
    // Pick scholar tiles — pair-aligned (a pair share scholar status)
    markScholarPairs(tiles, seed);
    return tiles;
  }

  function markScholarPairs(tiles, seed) {
    var rng = makeRng(seed * 31 + 7);
    // Group unmatched tile indexes by typeId
    var byType = {};
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      if (!byType[t.typeId]) byType[t.typeId] = [];
      byType[t.typeId].push(i);
    }
    var typeIds = Object.keys(byType);
    // Shuffle types
    for (var s = typeIds.length - 1; s > 0; s--) {
      var sj = Math.floor(rng() * (s + 1));
      var tmp = typeIds[s]; typeIds[s] = typeIds[sj]; typeIds[sj] = tmp;
    }
    // Mark exactly one tile per chosen typeId. With 4 instances per type, ANY
    // pair-match involving that type will include the scholar (a.scholar ||
    // b.scholar) — guaranteeing the review prompt fires once per scholar type.
    var tilesMarkedSoFar = 0;
    for (var ti = 0; ti < typeIds.length && tilesMarkedSoFar < SCHOLAR_COUNT; ti++) {
      var ids = byType[typeIds[ti]];
      if (!ids || !ids.length) continue;
      // Shuffle ids and flag a single instance
      for (var x = ids.length - 1; x > 0; x--) {
        var xj = Math.floor(rng() * (x + 1));
        var t2 = ids[x]; ids[x] = ids[xj]; ids[xj] = t2;
      }
      tiles[ids[0]].scholar = true;
      tilesMarkedSoFar++;
    }
  }

  // -- Free-tile rule --------------------------------------------------------
  // A tile is FREE if (a) no unmatched tile is on top of it (in a layer above
  // and overlapping in 2D footprint) and (b) at least one of its left/right
  // sides is open (no unmatched tile adjacent on that side at the SAME layer).

  function tileFootprint(t) {
    return {
      x1: t.hx, y1: t.hy,
      x2: t.hx + 1, y2: t.hy + 1
    };
  }
  function overlapsHalf(a, b) {
    // both have width=1 unit (hx..hx+1) and height=1 unit but in half-cells
    // the tile is 2x2 half-cells (occupies hx, hx+1 columns and hy, hy+1 rows)
    // So two tiles overlap if their hx and hy ranges intersect.
    var ax1 = a.hx, ax2 = a.hx + 2;
    var ay1 = a.hy, ay2 = a.hy + 2;
    var bx1 = b.hx, bx2 = b.hx + 2;
    var by1 = b.hy, by2 = b.hy + 2;
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
  }

  function isCovered(tile) {
    if (!state) return false;
    var tiles = state.tiles;
    for (var i = 0; i < tiles.length; i++) {
      var other = tiles[i];
      if (other.matched) continue;
      if (other.layer <= tile.layer) continue;
      if (overlapsHalf(tile, other)) return true;
    }
    return false;
  }

  function isLeftBlocked(tile) {
    var tiles = state.tiles;
    for (var i = 0; i < tiles.length; i++) {
      var other = tiles[i];
      if (other.matched) continue;
      if (other.layer !== tile.layer) continue;
      if (other === tile) continue;
      // adjacency: other's hx+2 == tile.hx AND vertical overlap
      if (other.hx + 2 !== tile.hx) continue;
      if (other.hy + 2 <= tile.hy || other.hy >= tile.hy + 2) continue;
      return true;
    }
    return false;
  }
  function isRightBlocked(tile) {
    var tiles = state.tiles;
    for (var i = 0; i < tiles.length; i++) {
      var other = tiles[i];
      if (other.matched) continue;
      if (other.layer !== tile.layer) continue;
      if (other === tile) continue;
      if (other.hx !== tile.hx + 2) continue;
      if (other.hy + 2 <= tile.hy || other.hy >= tile.hy + 2) continue;
      return true;
    }
    return false;
  }

  function isFree(tile) {
    if (tile.matched) return false;
    if (isCovered(tile)) return false;
    var leftB = isLeftBlocked(tile);
    var rightB = isRightBlocked(tile);
    return !(leftB && rightB);
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var stageNum = opts.stage || 1;
    var seed = opts.seed || (Date.now() % 0x7fffffff);
    if (opts.fixedSeed != null) seed = opts.fixedSeed;
    var layout = getLayoutForStage(stageNum);
    var tiles = assignTilesToLayout(layout, seed);
    var timeBudget = Math.max(TIME_FLOOR, TIME_INITIAL - (stageNum - 1) * TIME_DECREMENT);

    state = {
      stage: stageNum,
      maxStage: opts.maxStage || stageNum,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      layoutName: layout.name,
      tiles: tiles,
      selectedId: null,
      // Stage budgets
      hintsLeft: HINT_PER_STAGE,
      shufflesLeft: SHUFFLE_PER_STAGE,
      undosLeft: UNDO_PER_STAGE,
      // Match history for undo
      undoStack: [],
      // Power-ups
      inventory: opts.inventory || [],
      timerScale: 1.0, // for "+60s timer" power-up effect (doesn't change scale, just adds time)
      scoreMultiplierStages: opts.scoreMultiplierStages || 0, // count of remaining stages with 2x score
      revealTopUntil: 0, // ts (in state.time seconds) when to stop reveal
      // FX
      particles: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      hintHighlight: null, // {id1, id2, age}
      shakeTile: null,     // {id, age}
      // Stats
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      best: opts.best || readBest(),
      time: 0,
      timeRemaining: timeBudget,
      timeBudget: timeBudget,
      pairsMatched: 0,
      pairsTotal: TOTAL_TILES / 2,
      stagesCleared: opts.stagesCleared || 0,
      tilesMatched: opts.tilesMatched || 0,
      maxStageReached: opts.maxStageReached || stageNum,
      pendingScholarMatch: null,
      endReason: ""
    };
    state.boardOrigin = computeBoardOrigin();
    // Guarantee at least one legal move at deal — re-shuffle in place until OK.
    // (Bag is identical, so just permute typeIds across unmatched tiles.)
    var attempts = 0;
    while (attempts < 8 && !hasAnyValidMoveSafe()) {
      var unmatched = state.tiles.filter(function (t) { return !t.matched; });
      var typeIds = unmatched.map(function (t) { return t.typeId; });
      for (var j = typeIds.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = typeIds[j]; typeIds[j] = typeIds[k]; typeIds[k] = tmp;
      }
      for (var u = 0; u < unmatched.length; u++) unmatched[u].typeId = typeIds[u];
      attempts++;
    }
    return state;
  }
  function hasAnyValidMoveSafe() {
    if (!state || !state.tiles) return true;
    return findValidPair() !== null;
  }

  // Compute where to draw board (centered horizontally, below HUD)
  function computeBoardOrigin() {
    // Board half-cell grid is roughly 28 wide × 16 tall; with TILE_W=38 (cell=19px)
    // Total pixel width = 28*19 = 532, height = 16*25 = 400; we center.
    var cellW = TILE_W / 2;
    var cellH = TILE_H / 2;
    var totalW = 28 * cellW;
    var totalH = 16 * cellH;
    var ox = Math.floor((LOGICAL_W - totalW) / 2);
    var oy = 130 + Math.floor((LOGICAL_H - 130 - 80 - totalH) / 2);
    return { ox: ox, oy: oy, cellW: cellW, cellH: cellH };
  }

  // Pixel center of a tile
  function tileCenter(t) {
    var go = state.boardOrigin;
    var x = go.ox + (t.hx + 1) * go.cellW + t.layer * LAYER_OFFSET_X;
    var y = go.oy + (t.hy + 1) * go.cellH - t.layer * LAYER_OFFSET_Y;
    return { x: x, y: y };
  }
  function tileBox(t) {
    var go = state.boardOrigin;
    var x = go.ox + t.hx * go.cellW + t.layer * LAYER_OFFSET_X;
    var y = go.oy + t.hy * go.cellH - t.layer * LAYER_OFFSET_Y;
    return { x: x, y: y, w: TILE_W, h: TILE_H };
  }

  // -- Selection + matching --------------------------------------------------
  function tileById(id) {
    for (var i = 0; i < state.tiles.length; i++) {
      if (state.tiles[i].id === id) return state.tiles[i];
    }
    return null;
  }

  function onTileClick(tile) {
    if (phase !== "playing") return;
    if (!tile || tile.matched) return;
    if (!isFree(tile)) {
      // Subtle invalid feedback
      sfx.tile_invalid();
      shakeTile(tile);
      return;
    }
    if (state.selectedId == null) {
      state.selectedId = tile.id;
      sfx.tile_select();
      return;
    }
    if (state.selectedId === tile.id) {
      // Deselect
      state.selectedId = null;
      sfx.tile_select();
      return;
    }
    var prev = tileById(state.selectedId);
    if (!prev) {
      state.selectedId = tile.id;
      sfx.tile_select();
      return;
    }
    if (prev.typeId !== tile.typeId) {
      // Invalid pair
      sfx.tile_invalid();
      shakeTile(tile);
      shakeTile(prev);
      state.selectedId = null;
      return;
    }
    // Both must be free (selected was free at time of selection; verify still free)
    if (!isFree(prev) || !isFree(tile)) {
      sfx.tile_invalid();
      state.selectedId = null;
      return;
    }
    // It's a match!
    matchTiles(prev, tile);
  }

  function matchTiles(a, b) {
    pushUndo();
    a.matched = true;
    b.matched = true;
    state.tilesMatched += 2;
    state.pairsMatched++;
    state.selectedId = null;
    // Particle bursts
    var ca = tileCenter(a), cb = tileCenter(b);
    burstAt(ca.x, ca.y, "#f5c451", 14);
    burstAt(cb.x, cb.y, "#5de0f0", 14);
    // Score
    var timeRatio = state.timeBudget > 0 ? Math.max(0, state.timeRemaining / state.timeBudget) : 0;
    var per = BASE_MATCH_SCORE + Math.floor(timeRatio * TIME_BONUS_FACTOR);
    var mul = state.scoreMultiplierStages > 0 ? 2 : 1;
    var awarded = per * mul;
    state.score += awarded;
    pushPopup("+" + awarded, ca.x, ca.y - 24, "is-score");
    // Suit-specific tone
    var suit = suitOf(a.typeId);
    sfx.tile_match(suit);
    // Scholar logic — fire when either matched tile is a scholar
    if (a.scholar || b.scholar) {
      // shared review prompt
      openScholarQuestion(a, b);
    }
    updateHud();
    if (allMatched()) {
      onStageClear();
      return;
    }
    // After match, check for no-more-moves
    if (!hasAnyValidMove()) {
      handleNoValidMove();
    }
  }

  function suitOf(typeId) {
    // 0..8 = SCROLL (suit 0), 9..17 = ATOM (1), 18..26 = COMPASS (2), 27..35 = PALETTE (3)
    return Math.floor(typeId / 9);
  }
  function rankOf(typeId) {
    return (typeId % 9) + 1;
  }

  function allMatched() {
    for (var i = 0; i < state.tiles.length; i++) {
      if (!state.tiles[i].matched) return false;
    }
    return true;
  }

  // Find any valid pair among free tiles
  function findValidPair() {
    var freeByType = {};
    for (var i = 0; i < state.tiles.length; i++) {
      var t = state.tiles[i];
      if (t.matched) continue;
      if (!isFree(t)) continue;
      var key = t.typeId;
      if (!freeByType[key]) freeByType[key] = [];
      freeByType[key].push(t);
    }
    for (var k in freeByType) {
      if (freeByType[k].length >= 2) return [freeByType[k][0], freeByType[k][1]];
    }
    return null;
  }
  function hasAnyValidMove() {
    return findValidPair() !== null;
  }

  function handleNoValidMove() {
    // If user has shuffles left, just toast a message; if not, lose a life
    if (state.shufflesLeft > 0) {
      pushPopup("NO MOVES — try shuffle", LOGICAL_W / 2, 200, "is-warn");
      sfx.tile_invalid();
      return;
    }
    pushPopup("DEADLOCKED!", LOGICAL_W / 2, LOGICAL_H / 2, "is-warn");
    sfx.life_lost();
    setTimeout(function () { stageFailed("deadlock"); }, 800);
  }

  // -- Hint, shuffle, undo ---------------------------------------------------
  function useHint() {
    if (phase !== "playing") return;
    if (state.hintsLeft <= 0) {
      pushPopup("NO HINTS LEFT", LOGICAL_W / 2, 200, "is-warn");
      return;
    }
    var pair = findValidPair();
    if (!pair) {
      pushPopup("NO VALID PAIR", LOGICAL_W / 2, 200, "is-warn");
      return;
    }
    state.hintsLeft--;
    state.score = Math.max(0, state.score - 100);
    state.hintHighlight = { id1: pair[0].id, id2: pair[1].id, age: 0 };
    sfx.hint();
    pushPopup("HINT — −100", LOGICAL_W / 2, 200, "is-cyan");
    updateHud();
  }

  function useShuffle() {
    if (phase !== "playing") return;
    if (state.shufflesLeft <= 0) {
      pushPopup("NO SHUFFLES LEFT", LOGICAL_W / 2, 200, "is-warn");
      return;
    }
    state.shufflesLeft--;
    state.score = Math.max(0, state.score - 500);
    // Re-shuffle unmatched tiles (preserve scholar flags by tile slot)
    pushUndo();
    var unmatched = [];
    for (var i = 0; i < state.tiles.length; i++) {
      if (!state.tiles[i].matched) unmatched.push(state.tiles[i]);
    }
    var typeIds = unmatched.map(function (t) { return t.typeId; });
    var rng = Math.random;
    for (var j = typeIds.length - 1; j > 0; j--) {
      var k = Math.floor(rng() * (j + 1));
      var tmp = typeIds[j]; typeIds[j] = typeIds[k]; typeIds[k] = tmp;
    }
    for (var u = 0; u < unmatched.length; u++) {
      unmatched[u].typeId = typeIds[u];
    }
    state.selectedId = null;
    sfx.shuffle();
    pushPopup("SHUFFLED — −500", LOGICAL_W / 2, 200, "is-cyan");
    updateHud();
    if (!hasAnyValidMove()) {
      handleNoValidMove();
    }
  }

  function pushUndo() {
    var snap = {
      tiles: state.tiles.map(function (t) {
        return { id: t.id, typeId: t.typeId, hx: t.hx, hy: t.hy, layer: t.layer, matched: t.matched, scholar: t.scholar };
      }),
      selectedId: state.selectedId,
      score: state.score,
      pairsMatched: state.pairsMatched,
      tilesMatched: state.tilesMatched,
      hintsLeft: state.hintsLeft,
      shufflesLeft: state.shufflesLeft,
      undosLeft: state.undosLeft
    };
    state.undoStack.push(snap);
    if (state.undoStack.length > 32) state.undoStack.shift();
  }
  function tryUndo() {
    if (phase !== "playing") return;
    if (state.undosLeft <= 0) {
      pushPopup("NO UNDOS LEFT", LOGICAL_W / 2, 200, "is-warn");
      return;
    }
    if (!state.undoStack.length) {
      pushPopup("NOTHING TO UNDO", LOGICAL_W / 2, 200, "is-warn");
      return;
    }
    var snap = state.undoStack.pop();
    for (var i = 0; i < snap.tiles.length; i++) {
      var src = snap.tiles[i];
      var dst = tileById(src.id);
      if (dst) {
        dst.typeId = src.typeId;
        dst.matched = src.matched;
        dst.scholar = src.scholar;
      }
    }
    state.selectedId = snap.selectedId;
    state.score = snap.score;
    state.pairsMatched = snap.pairsMatched;
    state.tilesMatched = snap.tilesMatched;
    state.hintsLeft = snap.hintsLeft;
    state.shufflesLeft = snap.shufflesLeft;
    state.undosLeft--;
    sfx.undo();
    pushPopup("UNDO", LOGICAL_W / 2, 200, "is-cyan");
    updateHud();
  }

  // -- Power-ups -------------------------------------------------------------
  // 5 types: hint (bonus hint), shuffle (bonus shuffle), timer (+60s),
  // multiplier (2x score next stage), reveal (briefly highlights top layer)
  var POWERUP_TYPES = ["bonus_hint", "bonus_shuffle", "bonus_timer", "score_2x", "reveal_top"];
  var POWERUP_META = {
    bonus_hint:    { glyph: "💡", label: "Bonus Hint",    desc: "+1 hint this stage" },
    bonus_shuffle: { glyph: "🔄", label: "Bonus Shuffle", desc: "+1 shuffle this stage" },
    bonus_timer:   { glyph: "⏱",  label: "+60s Timer",   desc: "Add 60 seconds" },
    score_2x:      { glyph: "⭐", label: "2x Score",      desc: "Doubles next-stage scoring" },
    reveal_top:    { glyph: "🔍", label: "Reveal Top",   desc: "Briefly highlight top-layer tiles" }
  };

  function maybeDropPowerup() {
    if (state.inventory.length >= POWERUP_CAP) return;
    if (Math.random() < 0.65) {
      var t = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      state.inventory.push(t);
      sfx.powerup_pickup();
      pushPopup("+" + POWERUP_META[t].label, LOGICAL_W / 2, 110, "is-bonus");
    }
  }

  function usePowerup(slot) {
    if (phase !== "playing") return;
    var idx = slot - 1;
    if (idx < 0 || idx >= state.inventory.length) return;
    var type = state.inventory[idx];
    state.inventory.splice(idx, 1);
    sfx.powerup_use();
    if (type === "bonus_hint") {
      state.hintsLeft++;
      pushPopup("+1 HINT", LOGICAL_W / 2, 200, "is-emerald");
    } else if (type === "bonus_shuffle") {
      state.shufflesLeft++;
      pushPopup("+1 SHUFFLE", LOGICAL_W / 2, 200, "is-emerald");
    } else if (type === "bonus_timer") {
      state.timeRemaining += 60;
      pushPopup("+60s", LOGICAL_W / 2, 200, "is-emerald");
    } else if (type === "score_2x") {
      state.scoreMultiplierStages = 1; // active for the rest of this stage
      pushPopup("2x SCORE", LOGICAL_W / 2, 200, "is-bonus");
    } else if (type === "reveal_top") {
      state.revealTopUntil = state.time + 4.0;
      pushPopup("REVEAL TOP", LOGICAL_W / 2, 200, "is-cyan");
    }
    updatePowerupSlots();
    updateHud();
  }

  // -- Stage clear / fail ---------------------------------------------------
  function onStageClear() {
    if (phase === "stageClear") return;
    sfx.stage_clear();
    addShake(8, 0.5);
    var bonus = state.hintsLeft * 200 + state.shufflesLeft * 500;
    state.score += bonus;
    pushPopup("MOSAIC CLEARED!", LOGICAL_W / 2, LOGICAL_H / 2 - 30, "is-tetris");
    pushPopup("+" + bonus + " bonus", LOGICAL_W / 2, LOGICAL_H / 2 + 18, "is-score");
    if (state.stage >= 4) {
      pushPopup("MOSAIC LEGEND!", LOGICAL_W / 2, LOGICAL_H / 2 - 70, "is-legend");
    }
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#a96e3d", "#a991ff"] });
      }
    } catch (e) {}
    state.stagesCleared++;
    state.maxStageReached = Math.max(state.maxStageReached, state.stage);
    maybeDropPowerup();

    phase = "stageClear";
    saveSnapshot();

    if (state.stage >= 4) {
      // Beat the run! Loop into endless mode (stage 5+) — keep advancing
      setTimeout(function () { advanceStage(); }, 1600);
    } else {
      setTimeout(function () { advanceStage(); }, 1500);
    }
  }
  function advanceStage() {
    var nextStage = state.stage + 1;
    var carry = {
      stage: nextStage,
      maxStage: Math.max(state.maxStage, nextStage),
      score: state.score,
      lives: state.lives,
      shardsAwarded: state.shardsAwarded,
      questionsAnsweredCorrect: state.questionsAnsweredCorrect,
      questionsAnsweredTotal: state.questionsAnsweredTotal,
      best: state.best,
      stagesCleared: state.stagesCleared,
      tilesMatched: state.tilesMatched,
      maxStageReached: Math.max(state.maxStageReached, nextStage),
      inventory: state.inventory.slice(),
      scoreMultiplierStages: 0
    };
    initState(carry);
    // Clear any lingering selection / hint highlight from the previous stage
    state.selectedId = null;
    state.hintHighlight = null;
    state.shakeTile = null;
    phase = "playing";
    updateHud();
    updatePowerupSlots();
  }

  function stageFailed(reason) {
    if (phase === "dying" || phase === "ended") return;
    state.lives--;
    sfx.life_lost();
    if (state.lives <= 0) {
      phase = "dying";
      state.endReason = reason;
      setTimeout(function () { gameOver(); }, 900);
      return;
    }
    pushPopup("STAGE FAILED", LOGICAL_W / 2, LOGICAL_H / 2, "is-warn");
    pushPopup(reason === "timeout" ? "Out of time" : (reason === "deadlock" ? "No moves possible" : "Defeated"), LOGICAL_W / 2, LOGICAL_H / 2 + 32, "is-warn");
    phase = "dying";
    setTimeout(function () {
      // Restart same stage (fresh deal)
      var carry = {
        stage: state.stage,
        maxStage: state.maxStage,
        score: state.score,
        lives: state.lives,
        shardsAwarded: state.shardsAwarded,
        questionsAnsweredCorrect: state.questionsAnsweredCorrect,
        questionsAnsweredTotal: state.questionsAnsweredTotal,
        best: state.best,
        stagesCleared: state.stagesCleared,
        tilesMatched: state.tilesMatched,
        maxStageReached: state.maxStageReached,
        inventory: state.inventory.slice()
      };
      initState(carry);
      // Clear stale highlight/selection state from the failed stage
      state.selectedId = null;
      state.hintHighlight = null;
      state.shakeTile = null;
      phase = "playing";
      updateHud();
      updatePowerupSlots();
    }, 1300);
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
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / SCORE_TO_SHARDS_RATIO));
    if (shardsToAdd > 0) addShards(shardsToAdd, GAME_ID + ":run-complete");
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Mosaic Defeated You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Mahjong Mosaic · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Stages Cleared</div><div class="end-cell-value">' + state.stagesCleared + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Tiles Matched</div><div class="end-cell-value">' + formatNumber(state.tilesMatched) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Stage</div><div class="end-cell-value">' + state.maxStageReached + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Score</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.stopTracking(); MrMacsEndRecap.render(document.getElementById("endRecap")); } } catch (e) {}
    showScreen("end");
    stopMusic();
  }

  // -- FX --------------------------------------------------------------------
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
        life: 0.7,
        totalLife: 0.7,
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
  function shakeTile(tile) {
    if (!tile) return;
    if (reducedMotion) return;
    state.shakeTile = { id: tile.id, age: 0 };
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
    drawTiles();
    drawHintHighlight();
    drawSelectionFrame();
    drawParticles();

    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#0a0c12";
    ctx.fillRect(-50, -50, LOGICAL_W + 100, LOGICAL_H + 100);
    // Subtle parallax — depth layered glow
    var go = state.boardOrigin;
    var cx = go.ox + 14 * go.cellW;
    var cy = go.oy + 8 * go.cellH;
    var rad = 18 * go.cellW;
    var glow = ctx.createRadialGradient(cx, cy, 80, cx, cy, rad);
    glow.addColorStop(0, "rgba(245, 196, 81, 0.10)");
    glow.addColorStop(0.5, "rgba(28, 36, 56, 0.10)");
    glow.addColorStop(1, "rgba(10, 12, 18, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    // Decorative corner motifs (parallax suggestion)
    var pulse = (Math.sin(state.time * 0.7) * 0.5 + 0.5) * 0.3 + 0.4;
    ctx.fillStyle = "rgba(93, 224, 240, " + (0.04 * pulse).toFixed(3) + ")";
    for (var y = 0; y < LOGICAL_H; y += 80) {
      for (var x = 0; x < LOGICAL_W; x += 80) {
        if (((x / 80 + y / 80) | 0) % 2 === 0) ctx.fillRect(x, y, 40, 40);
      }
    }
  }

  // Draw tiles bottom layer first to top
  function drawTiles() {
    var byLayer = [[], [], [], [], []];
    for (var i = 0; i < state.tiles.length; i++) {
      var t = state.tiles[i];
      if (t.matched) continue;
      if (t.layer >= 0 && t.layer < 5) byLayer[t.layer].push(t);
    }
    // Within each layer, sort tiles top-to-bottom (smaller hy first), then left-to-right
    for (var L = 0; L < byLayer.length; L++) {
      byLayer[L].sort(function (a, b) {
        if (a.hy !== b.hy) return a.hy - b.hy;
        return a.hx - b.hx;
      });
      for (var k = 0; k < byLayer[L].length; k++) {
        drawOneTile(byLayer[L][k]);
      }
    }
  }

  function drawOneTile(t) {
    var b = tileBox(t);
    var x = b.x, y = b.y, w = b.w, h = b.h;
    var free = isFree(t);

    // Shake offset?
    var shakeOff = 0;
    if (state.shakeTile && state.shakeTile.id === t.id) {
      var age = state.shakeTile.age || 0;
      var amp = Math.max(0, 4 - age * 16);
      shakeOff = Math.sin(age * 80) * amp;
    }
    x += shakeOff;

    // Side / depth bevel (3D side strip on right + bottom)
    ctx.fillStyle = "#3a2c1a";
    ctx.fillRect(x + w - 4, y + 4, 4, h - 4);
    ctx.fillRect(x + 4, y + h - 4, w - 4, 4);
    // Drop shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 4, y + 4, w, h);

    // Tile face (parchment)
    var faceGrad = ctx.createLinearGradient(x, y, x, y + h);
    faceGrad.addColorStop(0, "#f4e6c0");
    faceGrad.addColorStop(0.5, "#e3cf99");
    faceGrad.addColorStop(1, "#c2a868");
    ctx.fillStyle = faceGrad;
    ctx.fillRect(x, y, w, h);
    // Inner bevel highlight
    ctx.fillStyle = "rgba(255, 248, 220, 0.55)";
    ctx.fillRect(x, y, w, 3);
    ctx.fillRect(x, y, 3, h);
    // Edge shadow
    ctx.fillStyle = "rgba(60, 40, 14, 0.35)";
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillRect(x + w - 2, y, 2, h);

    // Border
    ctx.strokeStyle = "rgba(60, 40, 14, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // Reveal-top dimmer
    if (state.revealTopUntil > state.time && !isHighest(t)) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(x, y, w, h);
    }

    // If covered, dim the face slightly to suggest unavailability
    if (!free) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.30)";
      ctx.fillRect(x, y, w, h);
    }

    // Glyph/face content based on typeId
    drawTileGlyph(t, x, y, w, h, free);

    // Selected ring
    if (state.selectedId === t.id) {
      ctx.save();
      ctx.strokeStyle = "#5de0f0";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.shadowColor = "#5de0f0";
      ctx.shadowBlur = 10;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.restore();
    }

    // Scholar gold rim
    if (t.scholar) {
      ctx.strokeStyle = "#f5c451";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
      // animated dashed inner pulse
      var pulse = (Math.sin(state.time * 4) * 0.5 + 0.5) * 0.6 + 0.4;
      ctx.strokeStyle = "rgba(245, 196, 81, " + pulse.toFixed(2) + ")";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
    }
  }

  // Returns true if the tile is on the topmost layer present (i.e. nothing
  // blocks above). Used by reveal-top FX.
  function isHighest(tile) {
    return !isCovered(tile);
  }

  function drawTileGlyph(t, x, y, w, h, free) {
    var cx = x + w / 2, cy = y + h / 2;
    var typeId = t.typeId;
    var honor = HONOR_VIS[typeId];
    var suit = suitOf(typeId);
    var rank = rankOf(typeId);
    var hue = SUIT_HUE[suit];
    if (honor) hue = honor.hue;

    // For honor tiles, draw a centered glyph
    if (honor) {
      ctx.fillStyle = hue;
      ctx.font = "bold 14px 'Fraunces', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(honor.glyph, cx, cy + 4);
      // Tiny label below
      ctx.fillStyle = "rgba(40, 28, 12, 0.7)";
      ctx.font = "bold 6px 'JetBrains Mono', monospace";
      ctx.fillText(honor.kind.toUpperCase(), cx, cy + 16);
      return;
    }

    // For numbered suits: rank as a Fraunces digit, suit pictograph below
    ctx.fillStyle = hue;
    ctx.font = "bold 16px 'Fraunces', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(rank), cx, cy - 6);

    // Suit pictograph (programmatic)
    drawSuitPictograph(suit, cx, cy + 11, hue);
  }

  function drawSuitPictograph(suit, cx, cy, hue) {
    ctx.save();
    ctx.strokeStyle = hue;
    ctx.fillStyle = hue;
    ctx.lineWidth = 1.5;
    if (suit === SUIT_SCROLL) {
      // Tiny scroll: two parallel lines wrapped around a curl
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 3);
      ctx.lineTo(cx + 6, cy - 3);
      ctx.moveTo(cx - 6, cy + 3);
      ctx.lineTo(cx + 6, cy + 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 6, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 6, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (suit === SUIT_ATOM) {
      // Atom: nucleus + two crossed orbits
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 3, Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 3, -Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (suit === SUIT_COMPASS) {
      // Compass rose: 4-arm star
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx + 2, cy);
      ctx.lineTo(cx + 6, cy);
      ctx.lineTo(cx + 2, cy + 1);
      ctx.lineTo(cx, cy + 6);
      ctx.lineTo(cx - 2, cy + 1);
      ctx.lineTo(cx - 6, cy);
      ctx.lineTo(cx - 2, cy);
      ctx.closePath();
      ctx.fill();
    } else if (suit === SUIT_PALETTE) {
      // Palette: kidney shape with a thumb hole
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 3, cy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // dabs of paint
      ctx.fillStyle = "#f5c451"; ctx.fillRect(cx - 5, cy - 1, 1.5, 1.5);
      ctx.fillStyle = "#5de0f0"; ctx.fillRect(cx - 2, cy - 2, 1.5, 1.5);
      ctx.fillStyle = "#a991ff"; ctx.fillRect(cx + 1, cy + 1, 1.5, 1.5);
    }
    ctx.restore();
  }

  function drawHintHighlight() {
    if (!state.hintHighlight) return;
    var ageT = Math.min(1, state.hintHighlight.age / 4);
    var ids = [state.hintHighlight.id1, state.hintHighlight.id2];
    var pulse = (Math.sin(state.time * 6) * 0.5 + 0.5) * 0.6 + 0.4;
    for (var i = 0; i < ids.length; i++) {
      var t = tileById(ids[i]);
      if (!t || t.matched) continue;
      var b = tileBox(t);
      ctx.save();
      ctx.globalAlpha = (1 - ageT) * pulse * 0.85;
      ctx.strokeStyle = "#a991ff";
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      ctx.restore();
    }
  }
  function drawSelectionFrame() {
    if (state.selectedId == null) return;
    // Already drawn per-tile, but a trailing hint of "ready to pair"
    // Add ambient shimmer around the selected tile
    var t = tileById(state.selectedId);
    if (!t || t.matched) {
      // Stale selection — clear it defensively
      state.selectedId = null;
      return;
    }
    var b = tileBox(t);
    ctx.save();
    ctx.globalAlpha = (Math.sin(state.time * 5) * 0.5 + 0.5) * 0.5;
    ctx.strokeStyle = "#5de0f0";
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8);
    ctx.restore();
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var t = p.life / p.totalLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // -- HUD -------------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudStage) dom.hudStage.textContent = String(state.stage);
    if (dom.hudTimer) dom.hudTimer.textContent = formatTime(state.timeRemaining);
    if (dom.hudTimerCell) {
      dom.hudTimerCell.classList.remove("is-danger", "is-warning", "is-good");
      if (state.timeRemaining < 30) dom.hudTimerCell.classList.add("is-danger");
      else if (state.timeRemaining < 90) dom.hudTimerCell.classList.add("is-warning");
      else dom.hudTimerCell.classList.add("is-good");
    }
    if (dom.hudTilesLeft) {
      var left = state.tiles.length - state.tilesMatched;
      dom.hudTilesLeft.textContent = String(left);
    }
    if (dom.hudBest) {
      dom.hudBest.textContent = state.best > 0 ? formatNumber(state.best) : "—";
    }
    if (dom.goalName) dom.goalName.textContent = state.layoutName + " · " + (state.tiles.length - state.tilesMatched) + " tiles";
    if (dom.goalMeta) {
      var bits = [];
      bits.push("Pairs " + state.pairsMatched + "/" + state.pairsTotal);
      bits.push("Hints " + state.hintsLeft);
      bits.push("Shuffles " + state.shufflesLeft);
      bits.push("Undos " + state.undosLeft);
      if (state.scoreMultiplierStages > 0) bits.push("2X");
      dom.goalMeta.textContent = bits.join(" · ");
    }
    if (dom.hudLives) {
      var cell = dom.hudLives.parentElement;
      if (cell) cell.classList.toggle("is-danger", state.lives <= 1);
    }
    // Hint/shuffle/undo button cost text
    if (dom.hintBtn) {
      dom.hintBtn.classList.toggle("is-spent", state.hintsLeft <= 0);
      var hc = dom.hintBtn.querySelector(".round-cost");
      if (hc) hc.textContent = String(state.hintsLeft);
    }
    if (dom.shuffleBtn) {
      dom.shuffleBtn.classList.toggle("is-spent", state.shufflesLeft <= 0);
      var sc = dom.shuffleBtn.querySelector(".round-cost");
      if (sc) sc.textContent = String(state.shufflesLeft);
    }
    if (dom.undoBtn) {
      dom.undoBtn.classList.toggle("is-spent", state.undosLeft <= 0);
      var uc = dom.undoBtn.querySelector(".round-cost");
      if (uc) uc.textContent = String(state.undosLeft);
    }
  }
  function updatePowerupSlots() {
    var slots = [dom.puSlot1, dom.puSlot2, dom.puSlot3];
    for (var i = 0; i < 3; i++) {
      var slot = slots[i];
      if (!slot) continue;
      var glyphEl = slot.querySelector(".pu-glyph");
      var keyEl = slot.querySelector(".pu-key");
      if (state && i < state.inventory.length) {
        var t = state.inventory[i];
        var meta = POWERUP_META[t];
        slot.classList.add("has");
        slot.classList.remove("empty");
        if (glyphEl) glyphEl.textContent = meta.glyph;
        slot.title = meta.label + " — " + meta.desc;
      } else {
        slot.classList.remove("has");
        slot.classList.add("empty");
        if (glyphEl) glyphEl.textContent = "·";
        slot.title = "Empty slot";
      }
      if (keyEl) keyEl.textContent = String(i + 1);
    }
  }
  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function formatTime(secs) {
    var s = Math.max(0, Math.floor(secs));
    var m = Math.floor(s / 60);
    var ss = s % 60;
    return m + ":" + (ss < 10 ? "0" : "") + ss;
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

  function openScholarQuestion(a, b) {
    activeQuestion = pickQuestion();
    state.pendingScholarMatch = { a: a.id, b: b.id };
    sfx.scholar_match();
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Tile · Optional · +" + SCHOLAR_BONUS + " + " + SCHOLAR_SHARDS + " shards";
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
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }
  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += SCHOLAR_BONUS;
      addShards(SCHOLAR_SHARDS, GAME_ID + ":scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCHOLAR_BONUS + " SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
    }
    activeQuestion = null;
    state.pendingScholarMatch = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
    // After closing, check if we just matched the last pair — possibly trigger stage-clear
    if (allMatched()) onStageClear();
  }
  function skipQuestion() {
    activeQuestion = null;
    state.pendingScholarMatch = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
    if (state && allMatched()) onStageClear();
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
  }

  // -- Hub integration -------------------------------------------------------
  function addShards(n, source) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, source || (GAME_ID + ":default"));
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          stage: state.maxStageReached,
          tiles: state.tilesMatched
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
          stage: state.stage,
          lives: state.lives,
          tilesMatched: state.tilesMatched,
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
          file: "games/mahjong-mosaic/index.html"
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
      var raw = window.localStorage && window.localStorage.getItem("mahjong-mosaic:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("mahjong-mosaic:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  var runStartTs = 0;
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        var theme = "archive-dusk";
        // Try archive-dusk; fall back to maze-cabinet if not present.
        if (window.MrMacsArcadeMusic.themes &&
            !window.MrMacsArcadeMusic.themes[theme]) {
          theme = "maze-cabinet";
        }
        window.MrMacsArcadeMusic.start(theme, { volume: 0.5 });
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
        if (k === "h" || k === "H") { useHint(); e.preventDefault(); return; }
        if (k === "s" || k === "S") { useShuffle(); e.preventDefault(); return; }
        if (k === "u" || k === "U") { tryUndo(); e.preventDefault(); return; }
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
        if (e.repeat) return;
        if (phase === "playing" || phase === "paused") {
          togglePause();
          e.preventDefault();
        } else if (phase === "question") {
          skipQuestion();
          e.preventDefault();
        }
      }
    });
    bindCanvasInput();
  }

  function bindCanvasInput() {
    canvas.addEventListener("click", function (e) {
      if (phase !== "playing") return;
      var t = canvasToTile(e.clientX, e.clientY);
      if (!t) return;
      onTileClick(t);
    });
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (!(e.touches && e.touches.length === 1)) return;
      var t0 = e.touches[0];
      var tile = canvasToTile(t0.clientX, t0.clientY);
      if (tile) {
        // Defer click handling to touchend to avoid double-fire
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      if (phase !== "playing") return;
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var tile = canvasToTile(t.clientX, t.clientY);
      if (tile) {
        onTileClick(tile);
        e.preventDefault();
      }
    });
    // Power-up slot clicks
    [dom.puSlot1, dom.puSlot2, dom.puSlot3].forEach(function (slot) {
      if (!slot) return;
      slot.addEventListener("click", function () {
        var slotN = parseInt(slot.getAttribute("data-slot"), 10) || 1;
        usePowerup(slotN);
      });
    });
  }
  // Find the topmost (highest layer, then highest draw order within layer) tile under a click.
  // Within a layer, tiles drawn later (lower hy, then lower hx per the sort in drawTiles)
  // visually appear on top due to the layer-offset bevel. We pick the tile with the greatest
  // layer; within ties, the one with the largest visual Z (lowest hy, then lowest hx = drawn
  // on top in the sorted pass — but bevel offset means a tile at a HIGHER layer index is always
  // strictly on top of any tile in a lower layer index, and within the same layer the bevel
  // only shifts x/y by LAYER_OFFSET so it's negligible for click disambiguation).
  // Practical fix: prefer highest layer; within same layer prefer highest hx (drawn later in
  // the x-sorted pass, so its bevel overwrites lower hx visually).
  function canvasToTile(clientX, clientY) {
    if (!state) return null;
    var rect = canvas.getBoundingClientRect();
    var lx = (clientX - rect.left - offsetX) / scale;
    var ly = (clientY - rect.top - offsetY) / scale;
    var best = null;
    var bestLayer = -1;
    var bestHx = -Infinity;
    for (var i = 0; i < state.tiles.length; i++) {
      var t = state.tiles[i];
      if (t.matched) continue;
      var b = tileBox(t);
      if (lx >= b.x && lx < b.x + b.w && ly >= b.y && ly < b.y + b.h) {
        if (t.layer > bestLayer || (t.layer === bestLayer && t.hx > bestHx)) {
          best = t;
          bestLayer = t.layer;
          bestHx = t.hx;
        }
      }
    }
    return best;
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
    dom.hintBtn.addEventListener("click", function () { useHint(); });
    dom.shuffleBtn.addEventListener("click", function () { useShuffle(); });
    dom.undoBtn.addEventListener("click", function () { tryUndo(); });
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
      MrMacsDifficulty.register("mahjong-mosaic");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "mahjong-mosaic", { compact: false });
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
    if (state && runStartTs) {
      recordPlayWithProfile({
        score: state.score,
        durationMs: Date.now() - runStartTs,
        stage: state.maxStageReached
      });
    }
    window.location.href = "../../index.html";
  }

  function newRun() {
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.reset(); MrMacsEndRecap.startTracking(); } } catch (e) {}
    initState({});
    showScreen(null);
    phase = "playing";
    runStartTs = Date.now();
    startMusic();
    updateHud();
    updatePowerupSlots();
    recordPlayWithProfile();
  }
  function resumeRun(snap) {
    var s = snap.state || {};
    initState({
      score: s.score || 0,
      stage: s.stage || 1,
      lives: s.lives != null ? s.lives : LIVES_INIT,
      tilesMatched: s.tilesMatched || 0,
      best: readBest()
    });
    showScreen(null);
    phase = "playing";
    runStartTs = Date.now();
    startMusic();
    updateHud();
    updatePowerupSlots();
    recordPlayWithProfile();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.stage > 1) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Stage ' + (snap.state.stage || 1) +
        ' &middot; Tiles ' + (snap.state.tilesMatched || 0) + '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Mahjong Mosaic Scores</div>';
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
  var timeWarnedAt30 = false;
  var timeWarnedAt60 = false;

  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    if (state) {
      state.time += dt;
      if (phase === "playing") {
        // Tick down stage timer
        state.timeRemaining -= dt;
        if (state.timeRemaining < 60 && !timeWarnedAt60) {
          timeWarnedAt60 = true;
          sfx.time_low_warn();
          pushPopup("60s LEFT", LOGICAL_W / 2, 200, "is-warn");
        }
        if (state.timeRemaining < 30 && !timeWarnedAt30) {
          timeWarnedAt30 = true;
          sfx.time_low_warn();
          pushPopup("30s — HURRY", LOGICAL_W / 2, 200, "is-warn");
        }
        if (state.timeRemaining <= 0) {
          state.timeRemaining = 0;
          stageFailed("timeout");
        }
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
      }
      // Hint highlight aging
      if (state.hintHighlight) {
        state.hintHighlight.age = (state.hintHighlight.age || 0) + dt;
        if (state.hintHighlight.age > 4) state.hintHighlight = null;
      }
      // Shake-tile aging
      if (state.shakeTile) {
        state.shakeTile.age = (state.shakeTile.age || 0) + dt;
        if (state.shakeTile.age > 0.4) state.shakeTile = null;
      }
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "dying" || phase === "stageClear" || phase === "paused") {
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
    bindInput();
    bindUi();
    showScreen("setup");
    updatePowerupSlots();
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

  // Reset time-warn flags when stage advances
  var _origAdvance = advanceStage;
  advanceStage = function () {
    timeWarnedAt30 = false;
    timeWarnedAt60 = false;
    return _origAdvance.apply(null, arguments);
  };
  // Reset time-warn flags when stage fails (since the same stage restarts)
  var _origStageFailed = stageFailed;
  stageFailed = function (reason) {
    timeWarnedAt30 = false;
    timeWarnedAt60 = false;
    return _origStageFailed.call(null, reason);
  };

  try {
    if (window.MrMacsA11yQuickToggle) {
      var hudControls = document.querySelector(".hud-controls") || document.querySelector(".top-hud");
      if (hudControls) MrMacsA11yQuickToggle.mount(hudControls);
    }
  } catch (e) {}

  // ── Help overlay ───────────────────────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      MrMacsHelpOverlay.register("mahjong-mosaic", {
        title: "How to Play Mahjong Mosaic",
        goal: "Clear all 144 tiles across four stages by matching identical free pairs before time runs out.",
        controls: [
          { key: "Click / Tap", action: "Select a free tile" },
          { key: "Second click on matching tile", action: "Match and pop the pair" },
          { key: "Esc / P", action: "Pause" }
        ],
        tips: [
          "A tile is free if nothing sits directly on top of it AND at least one of its left or right edges is open.",
          "Work from the top of stacks first — clearing upper tiles unlocks more moves below.",
          "Running out of moves with shuffles remaining auto-shuffles the board — but save them for emergencies.",
          "Layouts rotate each stage: Turtle, Dragon, Pyramid, Castle — each has a different unlock order.",
          "Three lives across four stages; losing a stage by timeout or no-moves costs a life."
        ],
        scholar: "Scholar tiles have a gilt rim. Matching a scholar pair triggers an optional review prompt worth bonus shards — both tiles pop and the clock pauses while you answer."
      });
      var setupActions = document.querySelector("#setupScreen .setup-actions");
      if (setupActions) MrMacsHelpOverlay.mountButton(setupActions, "mahjong-mosaic");
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "mahjong-mosaic";
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
