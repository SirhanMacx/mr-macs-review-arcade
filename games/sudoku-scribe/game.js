/* ===========================================================================
   Sudoku Scribe — 9x9 Sudoku · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · 4 difficulties · curated bank
   Game first — fill cells with 1-9, scholar cells trigger optional reviews.
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "sudoku-scribe";
  var GAME_TITLE = "Sudoku Scribe";

  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  var BOARD_PADDING_TOP = 130;
  var BOARD_PADDING_BOTTOM = 80;

  var LIVES_INIT = 3;
  var SHARDS_CAP = 200;
  var BONUS_LIFE_THRESHOLD = 10000;
  var HINTS_PER_PUZZLE = 3;
  var SCHOLAR_PER_PUZZLE = 5;  // was 3 — Jon: more review opportunities
  var IDLE_WARN_AT = 60;             // 60 seconds idle warning -> 0 progress life loss
  var IDLE_LIFE_LOST_AT = 90;        // additional idle time triggers life loss

  // Difficulty time targets (seconds) and bonuses
  var DIFFICULTY_META = {
    easy:   { name: "Easy",   targetSec: 300,  baseScore: 5000,  hintCost: 100 },
    medium: { name: "Medium", targetSec: 480,  baseScore: 7500,  hintCost: 150 },
    hard:   { name: "Hard",   targetSec: 720,  baseScore: 10000, hintCost: 200 },
    expert: { name: "Expert", targetSec: 1080, baseScore: 15000, hintCost: 300 }
  };

  // -- Inline review bank (28 entries, grade 8 → AP) ------------------------
  var INLINE_BANK = [
    { prompt: "Which Italian city was the financial heart of the early Renaissance?", choices: ["Florence", "Naples", "Milan", "Rome"], correctText: "Florence", hint: "Home of the Medici banking family." },
    { prompt: "Movable-type printing in Europe was popularized by:", choices: ["Johannes Gutenberg", "Leonardo da Vinci", "Marco Polo", "Erasmus"], correctText: "Johannes Gutenberg", hint: "Mainz, ~1450 — Bibles." },
    { prompt: "The Protestant Reformation began with:", choices: ["Luther's 95 Theses", "The Council of Trent", "Henry VIII's annulment", "Calvin's Institutes"], correctText: "Luther's 95 Theses", hint: "Wittenberg, 1517." },
    { prompt: "The Columbian Exchange refers to:", choices: ["Transfer of plants, animals, diseases between hemispheres", "A 1492 trade treaty", "Slave trade routes from Africa", "Tax policy in the colonies"], correctText: "Transfer of plants, animals, diseases between hemispheres", hint: "Old World <-> New World biology." },
    { prompt: "Which technology most enabled European long-distance voyages?", choices: ["The astrolabe and caravel", "The compound microscope", "The cotton gin", "The seed drill"], correctText: "The astrolabe and caravel", hint: "Navigation + nimble ship." },
    { prompt: "The Industrial Revolution began in:", choices: ["Britain", "France", "Germany", "United States"], correctText: "Britain", hint: "Coal, textiles, late 1700s." },
    { prompt: "Which invention most powered early factories?", choices: ["The steam engine", "The electric motor", "The internal combustion engine", "The assembly line"], correctText: "The steam engine", hint: "Watt, 1769 patent." },
    { prompt: "An immediate cause of World War I was:", choices: ["Assassination of Archduke Franz Ferdinand", "Treaty of Versailles", "German unification", "Russian Revolution"], correctText: "Assassination of Archduke Franz Ferdinand", hint: "Sarajevo, June 1914." },
    { prompt: "Trench warfare on the Western Front was characterized by:", choices: ["Stalemate and high casualties", "Rapid cavalry advances", "Aerial bombing of cities", "Naval blockade only"], correctText: "Stalemate and high casualties", hint: "Mud, machine guns, no man's land." },
    { prompt: "The Treaty of Versailles (1919) blamed the war primarily on:", choices: ["Germany", "Russia", "Austria-Hungary", "Ottoman Empire"], correctText: "Germany", hint: "War-guilt clause, Article 231." },
    { prompt: "The Cold War was a struggle primarily between:", choices: ["U.S. and Soviet Union", "U.S. and China", "Britain and France", "Germany and Russia"], correctText: "U.S. and Soviet Union", hint: "Capitalism vs. communism, 1947-91." },
    { prompt: "The Marshall Plan (1948) provided:", choices: ["Economic aid to rebuild Western Europe", "Military aid to South Korea", "Nuclear technology to NATO allies", "Loans to Latin America"], correctText: "Economic aid to rebuild Western Europe", hint: "$13 billion postwar package." },
    { prompt: "The doctrine of containment aimed to:", choices: ["Stop the spread of communism", "Roll back Soviet borders", "Promote free trade in Asia", "End nuclear weapons"], correctText: "Stop the spread of communism", hint: "Kennan's long telegram." },
    { prompt: "The Cuban Missile Crisis (1962) ended when:", choices: ["The Soviet Union withdrew missiles from Cuba", "Cuba renounced communism", "The U.S. invaded Cuba", "Khrushchev was removed from power"], correctText: "The Soviet Union withdrew missiles from Cuba", hint: "Quid pro quo on Turkey missiles." },
    { prompt: "Brown v. Board of Education (1954) ruled:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required", "Busing was illegal", "Voting tests were banned"], correctText: "Segregated public schools were unconstitutional", hint: "Overturned 'separate but equal'." },
    { prompt: "The Montgomery Bus Boycott was sparked by:", choices: ["Rosa Parks' arrest", "The March on Washington", "The Voting Rights Act", "Plessy v. Ferguson"], correctText: "Rosa Parks' arrest", hint: "December 1, 1955." },
    { prompt: "The Civil Rights Act of 1964:", choices: ["Banned discrimination in public accommodations", "Created the EPA", "Established Medicare", "Ended the Vietnam War"], correctText: "Banned discrimination in public accommodations", hint: "Title II covers hotels/restaurants." },
    { prompt: "Sputnik (1957), launched by the USSR, triggered:", choices: ["The U.S. space race and NASA's founding", "The end of the Cold War", "The first moon landing", "The Cuban Missile Crisis"], correctText: "The U.S. space race and NASA's founding", hint: "First artificial satellite." },
    { prompt: "Which document begins 'We hold these truths to be self-evident'?", choices: ["Declaration of Independence", "Constitution", "Bill of Rights", "Federalist No. 10"], correctText: "Declaration of Independence", hint: "Jefferson, 1776." },
    { prompt: "Checks and balances divides power among:", choices: ["Three branches of government", "Federal and state", "Senate and House", "Citizens and government"], correctText: "Three branches of government", hint: "Legislative, executive, judicial." },
    { prompt: "The 13th Amendment (1865):", choices: ["Abolished slavery", "Granted voting rights to women", "Created income tax", "Gave Black men the vote"], correctText: "Abolished slavery", hint: "Ratified after the Civil War." },
    { prompt: "The 19th Amendment (1920):", choices: ["Granted women the right to vote", "Repealed Prohibition", "Lowered the voting age", "Established direct election of senators"], correctText: "Granted women the right to vote", hint: "Suffrage movement victory." },
    { prompt: "The New Deal (1930s) was a response to:", choices: ["The Great Depression", "World War I", "The Dust Bowl alone", "The Cold War"], correctText: "The Great Depression", hint: "FDR, relief/recovery/reform." },
    { prompt: "Pearl Harbor (Dec 7, 1941) led directly to:", choices: ["U.S. entry into World War II", "End of WWII", "The Marshall Plan", "Founding of the UN"], correctText: "U.S. entry into World War II", hint: "'A date which will live in infamy.'" },
    { prompt: "The Magna Carta (1215) is significant because it:", choices: ["Limited the power of the English king", "Established Parliament", "Ended the Hundred Years' War", "Created common law"], correctText: "Limited the power of the English king", hint: "King John signed at Runnymede." },
    { prompt: "Which best describes a primary source?", choices: ["A first-hand record from the time period studied", "A textbook chapter", "A modern documentary", "An encyclopedia entry"], correctText: "A first-hand record from the time period studied", hint: "Letters, diaries, photographs." },
    { prompt: "The Berlin Wall fell in:", choices: ["1989", "1991", "1985", "1979"], correctText: "1989", hint: "Just before German reunification." },
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations", "NATO", "The League of Nations", "The European Union"], correctText: "The United Nations", hint: "Eleanor Roosevelt led the drafting." }
  ];

  // -- Hand-crafted Sudoku puzzle bank --------------------------------------
  // Each entry: { puzzle: 81-char string with '0' for empty, solution: 81-char }
  // Difficulty roughly correlates with number of empty cells.
  // Easy: ~36-42 empties; Medium: ~46-50; Hard: ~52-56; Expert: ~58-62.
  // Built from canonical valid sudoku solutions and verified.
  // 32 puzzles, all verified valid (givens consistent with embedded solutions,
  // each solution a complete and valid 9x9 sudoku). Generated via the
  // standard pattern + permutation method, then thinned to target empties
  // while preserving uniqueness via solver count. See /tmp/gen_sudoku_bank.js.
  var PUZZLE_BANK = {
    easy: [
      // 8 puzzles · ~42 empties each
      { puzzle:   "100000900200497003000010058405009010307080405806002307030150742081200000740963080",
        solution: "163825974258497163974316258425739816397681425816542397639158742581274639742963581" },
      { puzzle:   "021030600060008003700054081046003009579060002380795000214300000050102098008500120",
        solution: "821937645465218973793654281146823759579461832382795416214389567657142398938576124" },
      { puzzle:   "806200904005900016904801030503000000000602090601530487152300768008000340300086000",
        solution: "816253974235947816974861235593478621487612593621539487152394768768125349349786152" },
      { puzzle:   "690100080480976205200830090000008934050040100004761800028097061040000300501000740",
        solution: "697152483483976215215834697176528934852349176934761852328497561749615328561283749" },
      { puzzle:   "700920080000610392300000000140702039009481006076390140007008000010209800803040927",
        solution: "761923485485617392392854761148762539539481276276395148927538614614279853853146927" },
      { puzzle:   "004010092203005060108309407000190205540700139000054786870600000400000013010002570",
        solution: "754816392293475861168329457687193245542768139931254786875631924429587613316942578" },
      { puzzle:   "000070035907050218005182040090600021000005860803010000106720300470500106309861000",
        solution: "218479635947356218635182947594638721721945863863217594186724359472593186359861472" },
      { puzzle:   "006000854310040976004007010280009600090070081630218495500732108000184000000000020",
        solution: "976321854312845976854967312281459637495673281637218495569732148723184569148596723" }
    ],
    medium: [
      // 8 puzzles · ~48 empties each
      { puzzle:   "053000824710200000824500006001720305400050690000010000040000000139070040007005109",
        solution: "953167824716248953824539716691724385472853691385916472548391267139672548267485139" },
      { puzzle:   "500007940003060000012030580005074009009201437400000120250010600000000070371000008",
        solution: "586127943943865712712439586125374869869251437437698125258713694694582371371946258" },
      { puzzle:   "000000482000428560000076000070349005805007000094050600010900000948260713000000008",
        solution: "567193482139428567482576139671349825825617394394852671713984256948265713256731948" },
      { puzzle:   "000800103100590480086200050000008234200905860007002000075083910000706008000000070",
        solution: "759864123123597486486231759591678234234915867867342591675483912912756348348129675" },
      { puzzle:   "000068500480000709500002486043905000600134000002600043000051097007306000200009000",
        solution: "729468531486513729531792486143925678678134952952687143364251897897346215215879364" },
      { puzzle:   "100630208200040003003000050007204000006000020020100897580016039001097500030005040",
        solution: "154639278278541963963782154897254316316978425425163897582416739641397582739825641" },
      { puzzle:   "814000900002000030000029000043070200007100003020000090005600021200458300039217045",
        solution: "814365972792841536356729184543976218967182453128534697485693721271458369639217845" },
      { puzzle:   "041250000960010000000906801000560080000100006500308027038421059700000010400090600",
        solution: "841257963963814275275936841127569384384172596596348127638421759759683412412795638" }
    ],
    hard: [
      // 8 puzzles · ~52 empties each
      { puzzle:   "800060000910080607007000054100000009009010540046007100005300001000000463000179000",
        solution: "854763912912485637637291854128654379379812546546937128285346791791528463463179285" },
      { puzzle:   "000001900053060807000900026045608700080009000001000602504000000039006008270000500",
        solution: "426871953953462817817935426345628791682719345791354682564287139139546278278193564" },
      { puzzle:   "070091000200700069100000004000050400400009035800100906003910080682030090000000500",
        solution: "374691258258743169169582374926358417417269835835174926543917682682435791791826543" },
      { puzzle:   "040008003009071400700020009000800500000190004900437008060009040000000085030580007",
        solution: "246958173589371426713624859374862591628195734951437268865719342197243685432586917" },
      { puzzle:   "000609008605080000410000005000096041800710520001502060300020006000100070080040000",
        solution: "237659418695481237418273695523896741869714523741532869374925186952168374186347952" },
      { puzzle:   "700001080002350000000900010200007040001000300006100058800060105694002030020080004",
        solution: "769241583412358769583976412258637941941825376376194258837469125694512837125783694" },
      { puzzle:   "032000000894007200600003008005080003708061020000002807000000000260000701080030054",
        solution: "532849176894617235671523498925784613748361529316952847459178362263495781187236954" },
      { puzzle:   "035762008070001005108000000000009062054000700000000004840235010520100009010000000",
        solution: "435762198276981435198354276781549362954623781362817954849235617523176849617498523" }
    ],
    expert: [
      // 8 puzzles · ~55-58 empties each
      { puzzle:   "000018900002000000950470000030004009020060000800900607400020006005000070390800005",
        solution: "764218953182395764953476182637184529529763841841952637478521396215639478396847215" },
      { puzzle:   "000000850000006009400070060000000300600009074302000010926700180000050006080000700",
        solution: "261493857857216439439875261574681392618329574392547618926734185743158926185962743" },
      { puzzle:   "003000000900045002000097050090080010306009000000630007500002700700000009600400030",
        solution: "453216978978345162162897453297584316316729845845631297531962784784153629629478531" },
      { puzzle:   "007020500090650030000000090000970020009142000000300780300000105072000000100006000",
        solution: "837429516294651837516783294653978421789142653421365789368297145972514368145836972" },
      { puzzle:   "409031000000000050020094003308000010000780002000009000290010000031678200000000000",
        solution: "459831726183267459726594183378426915915783642642159378294315867531678294867942531" },
      { puzzle:   "049000200010000040070050006037002900804090000000700020005300000000076005000540190",
        solution: "549631278316827549278954316637482951824195637951763824485319762193276485762548193" },
      { puzzle:   "004010003700009004000840060907050000005601000010003000000020000002307050000090180",
        solution: "824716593761539824593842761937254618245681937618973245459128376182367459376495182" },
      { puzzle:   "080040001600398000400005000014600700000000004000050030300009100200700000007506090",
        solution: "983247651651398472472165983514683729836972514729451836365829147298714365147536298" }
    ]
  };
  // The runtime will fall back to a live solver if any embedded solution
  // ever fails to round-trip — see initState.

  // -- Power-up meta ---------------------------------------------------------
  var POWERUP_META = {
    free_hint:        { glyph: "💡", label: "Free Hint",     desc: "Reveal one correct cell free." },
    highlight_same:   { glyph: "🔍", label: "Highlight Same", desc: "Highlight all cells with the same value as the selected cell." },
    show_conflicts:   { glyph: "🎯", label: "Show Conflicts", desc: "Flash all cells in conflict for 3 seconds." },
    score_x2:         { glyph: "⭐", label: "2x Score",       desc: "Next puzzle awards double score." },
    easy_mode:        { glyph: "🔄", label: "Easy Mode",      desc: "Reveal 5 random empty cells with their correct values." }
  };
  var POWERUP_DROP_TABLE = ["free_hint", "highlight_same", "show_conflicts", "score_x2", "easy_mode"];

  // -- Sudoku helpers --------------------------------------------------------
  function parsePuzzleString(s) {
    var grid = [];
    for (var r = 0; r < 9; r++) {
      var row = [];
      for (var c = 0; c < 9; c++) {
        var ch = s.charAt(r * 9 + c);
        var n = parseInt(ch, 10);
        row.push(isNaN(n) ? 0 : n);
      }
      grid.push(row);
    }
    return grid;
  }

  function gridToString(g) {
    var s = "";
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) s += String(g[r][c] || 0);
    return s;
  }

  function cloneGrid(g) {
    var out = [];
    for (var r = 0; r < 9; r++) out.push(g[r].slice());
    return out;
  }

  // Find first empty cell (row-major)
  function findEmpty(g) {
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      if (!g[r][c]) return [r, c];
    }
    return null;
  }

  // Is value v valid at (r,c) given current grid?
  function isValidPlacement(g, r, c, v) {
    for (var i = 0; i < 9; i++) {
      if (g[r][i] === v && i !== c) return false;
      if (g[i][c] === v && i !== r) return false;
    }
    var br = Math.floor(r / 3) * 3;
    var bc = Math.floor(c / 3) * 3;
    for (var rr = br; rr < br + 3; rr++) {
      for (var cc = bc; cc < bc + 3; cc++) {
        if (g[rr][cc] === v && (rr !== r || cc !== c)) return false;
      }
    }
    return true;
  }

  // Backtracking solver (returns first solution, or null)
  function solve(grid) {
    var g = cloneGrid(grid);
    function bt() {
      var empty = findEmpty(g);
      if (!empty) return true;
      var r = empty[0], c = empty[1];
      for (var v = 1; v <= 9; v++) {
        if (isValidPlacement(g, r, c, v)) {
          g[r][c] = v;
          if (bt()) return true;
          g[r][c] = 0;
        }
      }
      return false;
    }
    return bt() ? g : null;
  }

  // Verify a 9x9 grid is a complete and valid sudoku solution
  function isValidSolution(g) {
    if (!g || g.length !== 9) return false;
    for (var i = 0; i < 9; i++) {
      var rowSeen = {}, colSeen = {};
      for (var j = 0; j < 9; j++) {
        var rv = g[i][j], cv = g[j][i];
        if (!rv || rv < 1 || rv > 9 || rowSeen[rv]) return false;
        if (!cv || cv < 1 || cv > 9 || colSeen[cv]) return false;
        rowSeen[rv] = true; colSeen[cv] = true;
      }
    }
    for (var br = 0; br < 3; br++) for (var bc = 0; bc < 3; bc++) {
      var seen = {};
      for (var rr = br * 3; rr < br * 3 + 3; rr++) {
        for (var cc = bc * 3; cc < bc * 3 + 3; cc++) {
          var v = g[rr][cc];
          if (seen[v]) return false;
          seen[v] = true;
        }
      }
    }
    return true;
  }

  // Verify every nonzero cell in givens matches the solution
  function solutionMatchesGivens(sol, givens) {
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      if (givens[r][c] && givens[r][c] !== sol[r][c]) return false;
    }
    return true;
  }

  // Find all conflicts: returns set of "r,c" cells in conflict
  function findConflicts(g) {
    var bad = {};
    function mark(r, c) { bad[r + "," + c] = true; }
    // Rows + cols
    for (var i = 0; i < 9; i++) {
      var rowSeen = {}, colSeen = {};
      for (var j = 0; j < 9; j++) {
        var rv = g[i][j];
        if (rv) {
          if (rowSeen[rv] != null) { mark(i, j); mark(i, rowSeen[rv]); }
          else rowSeen[rv] = j;
        }
        var cv = g[j][i];
        if (cv) {
          if (colSeen[cv] != null) { mark(j, i); mark(colSeen[cv], i); }
          else colSeen[cv] = j;
        }
      }
    }
    // Boxes
    for (var br = 0; br < 3; br++) {
      for (var bc = 0; bc < 3; bc++) {
        var seen = {};
        for (var r = br * 3; r < br * 3 + 3; r++) {
          for (var c = bc * 3; c < bc * 3 + 3; c++) {
            var v = g[r][c];
            if (v) {
              var k = String(v);
              if (seen[k]) {
                mark(r, c);
                mark(seen[k][0], seen[k][1]);
              } else {
                seen[k] = [r, c];
              }
            }
          }
        }
      }
    }
    return bad;
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

  var sfx = {
    cell_select:   function () { sfxTone(620, 0.04, { type: "triangle", volume: 0.07, endFreq: 720 }); },
    fill_correct:  function () { sfxTone(720, 0.06, { type: "triangle", volume: 0.10, endFreq: 980 }); },
    fill_conflict: function () {
      sfxTone(280, 0.10, { type: "sawtooth", volume: 0.12, endFreq: 180 });
      sfxNoise(0.06, { volume: 0.08, cutoff: 1200 });
    },
    hint:          function () {
      sfxTone(1175, 0.08, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(1568, 0.10, { type: "triangle", volume: 0.14 }); }, 60);
    },
    conflict_warn: function () {
      sfxNoise(0.18, { volume: 0.14, cutoff: 700 });
      sfxTone(220, 0.18, { type: "sawtooth", volume: 0.10, endFreq: 120 });
    },
    scholar_correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong:   function () { sfxTone(330, 0.18, { type: "sawtooth", volume: 0.14, endFreq: 220 }); },
    puzzle_clear: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    life_lost:    function () { sfxTone(440, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 80 }); },
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
    }
  };

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | clearing
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
    canvas = $("scribeCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudPuzzle = $("hudPuzzle");
    dom.hudTime = $("hudTime");
    dom.hudHints = $("hudHints");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
    dom.popupOverlay = $("popupOverlay");
    dom.numpad = $("numpad");
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
    dom.pencilBtn = $("pencilBtn");
    dom.hintBtn = $("hintBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");
    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.retryHint = $("retryHint");
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
    dom.difficultySelect = $("difficultySelect");
    dom.puSlot1 = $("puSlot1");
    dom.puSlot2 = $("puSlot2");
    dom.puSlot3 = $("puSlot3");
    dom.puSlot4 = $("puSlot4");
    dom.puSlot5 = $("puSlot5");
  }

  // -- Geometry helpers ------------------------------------------------------
  function getBoardOrigin() {
    // 9x9 board: pick max tile so it fits between top/bottom padding,
    // also leaves left/right margin for power-up tray + numpad.
    var marginSide = 90; // ample margin for trays at min width
    var availableW = LOGICAL_W - marginSide * 2;
    var availableH = LOGICAL_H - BOARD_PADDING_TOP - BOARD_PADDING_BOTTOM;
    var cellPx = Math.floor(Math.min(availableW / 9, availableH / 9));
    var bw = cellPx * 9;
    var bh = cellPx * 9;
    var ox = Math.floor((LOGICAL_W - bw) / 2);
    var oy = BOARD_PADDING_TOP + Math.floor((availableH - bh) / 2);
    return { ox: ox, oy: oy, cellPx: cellPx, w: bw, h: bh };
  }

  // -- State init ------------------------------------------------------------
  function pickPuzzleForDifficulty(difficulty, indexHint) {
    var bank = PUZZLE_BANK[difficulty] || PUZZLE_BANK.easy;
    var idx = indexHint != null ? Math.abs(indexHint) % bank.length : Math.floor(Math.random() * bank.length);
    return bank[idx];
  }

  function makeScholarCellList(givenGrid, count) {
    // Pick `count` empty cells deterministically scattered across the board.
    var empties = [];
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      if (!givenGrid[r][c]) empties.push([r, c]);
    }
    // Shuffle deterministically using row+col seed
    empties.sort(function (a, b) {
      var ka = (a[0] * 7 + a[1] * 13) % 91;
      var kb = (b[0] * 7 + b[1] * 13) % 91;
      return ka - kb;
    });
    var picks = empties.slice(0, Math.min(count, empties.length));
    var set = {};
    for (var i = 0; i < picks.length; i++) set[picks[i][0] + "," + picks[i][1]] = true;
    return set;
  }

  function initState(opts) {
    opts = opts || {};
    var difficulty = opts.difficulty || (dom.difficultySelect ? dom.difficultySelect.value : "easy");
    if (!DIFFICULTY_META[difficulty]) difficulty = "easy";
    var puzzleNum = opts.puzzleNum || 1;
    var bankIndex = opts.bankIndex != null ? opts.bankIndex : (puzzleNum - 1);
    var entry = pickPuzzleForDifficulty(difficulty, bankIndex);
    var givens = parsePuzzleString(entry.puzzle);
    // Verify embedded solution; fall back to live-solve if invalid or
    // inconsistent with givens.
    var solGrid = parsePuzzleString(entry.solution);
    if (!isValidSolution(solGrid) || !solutionMatchesGivens(solGrid, givens)) {
      var solved = solve(givens);
      if (solved) solGrid = solved;
    }
    // userGrid starts as a clone of givens, scholar set chosen from empties
    var userGrid = cloneGrid(givens);
    var scholars = makeScholarCellList(givens, SCHOLAR_PER_PUZZLE);

    var bestTime = readDifficultyBest(difficulty);
    state = {
      difficulty: difficulty,
      puzzleNum: puzzleNum,
      bankIndex: bankIndex,
      givens: givens,                      // 9x9 of givens (0=empty)
      solution: solGrid,                   // 9x9 of solution
      grid: userGrid,                      // 9x9 of user-filled values
      pencils: makeEmptyPencils(),         // 9x9 of arrays of integers
      scholars: scholars,                  // map "r,c" -> true
      scholarSolved: {},                   // map "r,c" -> true (already used)
      conflicts: {},                       // map "r,c" -> true
      revealedHints: {},                   // map "r,c" -> true (cells revealed by hint)
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      hintsLeft: HINTS_PER_PUZZLE,
      timeOnPuzzle: 0,                     // seconds since puzzle start
      idleTimer: 0,                        // seconds since last action
      idleWarning: false,
      pencilMode: false,
      selected: null,                      // {r,c} or null
      hintCellPulse: null,                 // {r,c,age}
      conflictFlash: 0,                    // seconds remaining
      sameValueHighlight: 0,               // value 1-9 highlighted
      sameValueLeft: 0,                    // seconds remaining of highlight
      doubleScoreNext: !!opts.doubleScoreNext,
      currentScoreMult: opts.currentScoreMult || 1,
      // power-ups
      inventory: opts.inventory || [],
      // FX
      particles: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      goalPulse: 0,
      // stats
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      best: opts.best || readBest(),
      time: 0,
      puzzlesCleared: opts.puzzlesCleared || 0,
      cellsFilledCorrect: 0,
      maxPuzzleReached: opts.maxPuzzleReached || puzzleNum,
      hintsUsedThisPuzzle: 0,
      erasuresThisPuzzle: 0,
      bestTime: bestTime,
      endReason: ""
    };
    state.boardOrigin = getBoardOrigin();
  }

  function makeEmptyPencils() {
    var arr = [];
    for (var r = 0; r < 9; r++) {
      var row = [];
      for (var c = 0; c < 9; c++) row.push([]);
      arr.push(row);
    }
    return arr;
  }

  // -- Cell input ------------------------------------------------------------
  function isGiven(r, c) { return state.givens[r][c] !== 0; }

  function placeValue(r, c, v) {
    if (phase !== "playing") return;
    if (isGiven(r, c)) {
      sfx.fill_conflict();
      pushPopup("FIXED", cellPx(r, c).cx, cellPx(r, c).cy - 18, "is-warn");
      return;
    }
    var prev = state.grid[r][c];
    if (prev === v) {
      // Toggle off — erase
      eraseCell(r, c);
      return;
    }
    if (prev !== 0) state.erasuresThisPuzzle++;
    state.grid[r][c] = v;
    state.pencils[r][c] = []; // clear pencil marks on cell
    // Once user changes a previously hint-revealed cell, drop the hint flag
    if (state.revealedHints[r + "," + c]) delete state.revealedHints[r + "," + c];
    refreshConflicts();
    state.idleTimer = 0;
    state.idleWarning = false;
    var key = r + "," + c;
    var conflict = !!state.conflicts[key];
    var solV = state.solution[r] ? state.solution[r][c] : 0;
    var solutionMatch = (solV && v === solV);
    if (conflict || !solutionMatch) {
      // Either an explicit conflict OR a value that doesn't match the unique
      // solution. Both are wrong — flag as conflict so the player sees it.
      sfx.fill_conflict();
      addShake(2, 0.18);
      pushPopup("CONFLICT", cellPx(r, c).cx, cellPx(r, c).cy - 18, "is-warn");
      // Mark so visual conflict tint applies even when no row/col/box clash.
      if (!conflict) state.conflicts[key] = true;
    } else {
      sfx.fill_correct();
      state.cellsFilledCorrect++;
      // Scholar trigger
      if (state.scholars[key] && !state.scholarSolved[key]) {
        state.scholarSolved[key] = true;
        openScholarQuestion(r, c);
      }
      // Power-up drop on every 7th correct cell
      if (state.cellsFilledCorrect % 7 === 0 && state.inventory.length < 5) {
        dropPowerup();
      }
      pushPopup("+50", cellPx(r, c).cx, cellPx(r, c).cy - 18, "is-bonus");
      state.score += 50 * state.currentScoreMult;
    }
    if (allCellsCorrect()) {
      onPuzzleClear();
    }
  }

  function eraseCell(r, c) {
    if (isGiven(r, c)) return;
    if (state.grid[r][c] !== 0) state.erasuresThisPuzzle++;
    state.grid[r][c] = 0;
    state.pencils[r][c] = [];
    // Erasing a hint-revealed value also clears the revealed flag — otherwise
    // the next hint roll could land on the same cell again.
    var key = r + "," + c;
    if (state.revealedHints[key]) delete state.revealedHints[key];
    refreshConflicts();
    state.idleTimer = 0;
    state.idleWarning = false;
    sfx.cell_select();
  }

  function togglePencil(r, c, v) {
    if (phase !== "playing") return;
    if (isGiven(r, c) || state.grid[r][c] !== 0) return;
    var marks = state.pencils[r][c];
    var idx = marks.indexOf(v);
    if (idx >= 0) marks.splice(idx, 1);
    else marks.push(v);
    sfx.cell_select();
    state.idleTimer = 0;
  }

  function refreshConflicts() {
    state.conflicts = findConflicts(state.grid);
  }

  function allCellsCorrect() {
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      if (state.grid[r][c] === 0) return false;
      if (state.solution[r] && state.grid[r][c] !== state.solution[r][c]) return false;
    }
    // No conflicts and no empties = solved
    return Object.keys(state.conflicts).length === 0;
  }

  // -- Hint system -----------------------------------------------------------
  function useHint(opts) {
    opts = opts || {};
    var free = !!opts.free;
    if (phase !== "playing") return false;
    if (!free && state.hintsLeft <= 0) {
      pushPopup("NO HINTS", LOGICAL_W / 2, 200, "is-warn");
      return false;
    }
    // Pool: cells that are EMPTY in the user grid, NOT given, with a known
    // solution value, and not already revealed by a prior hint.
    var pool = [];
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      if (state.grid[r][c] !== 0) continue;
      if (isGiven(r, c)) continue;
      var key = r + "," + c;
      if (state.revealedHints[key]) continue;
      var sv = state.solution[r] ? state.solution[r][c] : 0;
      if (!sv) continue;
      pool.push([r, c]);
    }
    if (!pool.length) {
      pushPopup("NO HINT TARGET", LOGICAL_W / 2, 200, "is-warn");
      return false;
    }
    // Prefer cell user has selected if empty / not given / not already a hint
    var pick;
    if (state.selected) {
      var sr = state.selected.r, sc = state.selected.c;
      var skey = sr + "," + sc;
      if (!isGiven(sr, sc) && state.grid[sr][sc] === 0 && !state.revealedHints[skey]) pick = [sr, sc];
    }
    if (!pick) pick = pool[Math.floor(Math.random() * pool.length)];
    var pr = pick[0], pc = pick[1];
    var v = state.solution[pr] ? state.solution[pr][pc] : 0;
    if (!v) return false;
    state.grid[pr][pc] = v;
    state.pencils[pr][pc] = [];
    state.revealedHints[pr + "," + pc] = true;
    refreshConflicts();
    state.hintCellPulse = { r: pr, c: pc, age: 0 };
    sfx.hint();
    pushPopup("HINT", cellPx(pr, pc).cx, cellPx(pr, pc).cy - 18, "is-bonus");
    if (!free) {
      state.hintsLeft--;
      state.score = Math.max(0, state.score - DIFFICULTY_META[state.difficulty].hintCost);
      state.hintsUsedThisPuzzle++;
    }
    state.cellsFilledCorrect++;
    state.idleTimer = 0;
    state.idleWarning = false;
    if (allCellsCorrect()) onPuzzleClear();
    return true;
  }

  // -- Power-ups -------------------------------------------------------------
  function dropPowerup() {
    var t = POWERUP_DROP_TABLE[Math.floor(Math.random() * POWERUP_DROP_TABLE.length)];
    if (state.inventory.length >= 5) return;
    state.inventory.push(t);
    sfx.powerup_pickup();
    var meta = POWERUP_META[t];
    if (meta) {
      pushPopup(meta.glyph + " " + meta.label.toUpperCase(), LOGICAL_W / 2, 220, "is-bonus");
    }
    updatePowerupSlots();
  }

  function usePowerup(slotN) {
    var idx = slotN - 1;
    if (idx < 0 || idx >= state.inventory.length) return;
    var t = state.inventory[idx];
    state.inventory.splice(idx, 1);
    updatePowerupSlots();
    sfx.powerup_use();
    if (t === "free_hint") {
      useHint({ free: true });
    } else if (t === "highlight_same") {
      var v = (state.selected && state.grid[state.selected.r][state.selected.c]) || 0;
      if (v) {
        state.sameValueHighlight = v;
        state.sameValueLeft = 5;
        pushPopup("HIGHLIGHT " + v, LOGICAL_W / 2, 220, "is-emerald");
      } else {
        pushPopup("SELECT A FILLED CELL FIRST", LOGICAL_W / 2, 220, "is-warn");
        // Refund into inventory
        state.inventory.push(t);
        updatePowerupSlots();
      }
    } else if (t === "show_conflicts") {
      state.conflictFlash = 3;
      pushPopup("CONFLICTS FLASHED", LOGICAL_W / 2, 220, "is-warn");
    } else if (t === "score_x2") {
      state.doubleScoreNext = true;
      pushPopup("2x NEXT PUZZLE ARMED", LOGICAL_W / 2, 220, "is-bonus");
    } else if (t === "easy_mode") {
      // Reveal 5 random empty cells with their correct values
      var empties = [];
      for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
        if (state.grid[r][c] === 0) empties.push([r, c]);
      }
      // Shuffle
      for (var i = empties.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = empties[i]; empties[i] = empties[j]; empties[j] = tmp;
      }
      var revealed = 0;
      for (var k = 0; k < empties.length && revealed < 5; k++) {
        var rr = empties[k][0], cc = empties[k][1];
        var sv = state.solution[rr] ? state.solution[rr][cc] : 0;
        if (!sv) continue;
        state.grid[rr][cc] = sv;
        state.pencils[rr][cc] = [];
        state.revealedHints[rr + "," + cc] = true;
        state.cellsFilledCorrect++;
        revealed++;
      }
      refreshConflicts();
      pushPopup("REVEALED " + revealed, LOGICAL_W / 2, 220, "is-emerald");
      if (allCellsCorrect()) onPuzzleClear();
    }
  }

  // -- Puzzle clear / advance ------------------------------------------------
  function onPuzzleClear() {
    if (phase !== "playing") return;
    phase = "clearing";
    sfx.puzzle_clear();
    addShake(4, 0.4);
    // Compute score awards
    var meta = DIFFICULTY_META[state.difficulty];
    var elapsed = Math.max(0.001, state.timeOnPuzzle);
    var ratio = meta.targetSec / elapsed; // > 1 if faster than target
    var timeScore = Math.floor(meta.baseScore * Math.min(2, Math.max(0.4, ratio)));
    var hintBonus = (state.hintsUsedThisPuzzle === 0) ? Math.floor(meta.baseScore * 0.4) : 0;
    var eraseBonus = (state.erasuresThisPuzzle === 0) ? Math.floor(meta.baseScore * 0.2) : 0;
    var total = (timeScore + hintBonus + eraseBonus) * state.currentScoreMult;
    state.score += total;
    pushPopup("PUZZLE CLEAR +" + formatNumber(total), LOGICAL_W / 2, 220, "is-emerald");

    // Best time tracker
    var prevBestTime = state.bestTime;
    var elapsedInt = Math.floor(elapsed);
    if (!prevBestTime || elapsedInt < prevBestTime) {
      writeDifficultyBest(state.difficulty, elapsedInt);
      state.bestTime = elapsedInt;
      pushPopup("NEW BEST TIME!", LOGICAL_W / 2, 260, "is-bonus");
    }

    state.puzzlesCleared++;
    state.maxPuzzleReached = Math.max(state.maxPuzzleReached, state.puzzleNum);
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#a991ff", "#4dd49b"] });
      }
    } catch (e) {}
    saveSnapshot();
    setTimeout(advanceToNextPuzzle, 1800);
  }

  function advanceToNextPuzzle() {
    var nextPuzzle = state.puzzleNum + 1;
    var nextMult = state.doubleScoreNext ? 2 : 1;
    var saved = {
      difficulty: state.difficulty,
      puzzleNum: nextPuzzle,
      bankIndex: state.bankIndex + 1,
      score: state.score,
      lives: state.lives,
      inventory: state.inventory.slice(),
      doubleScoreNext: false,
      currentScoreMult: nextMult,
      shardsAwarded: state.shardsAwarded,
      questionsAnsweredCorrect: state.questionsAnsweredCorrect,
      questionsAnsweredTotal: state.questionsAnsweredTotal,
      best: state.best,
      puzzlesCleared: state.puzzlesCleared,
      maxPuzzleReached: Math.max(state.maxPuzzleReached, nextPuzzle)
    };
    initState(saved);
    phase = "playing";
    showScreen(null);
    updateHud();
    updatePowerupSlots();
    runStartTs = runStartTs || Date.now();
  }

  // -- Lives / game over -----------------------------------------------------
  function loseLife(reason) {
    if (phase !== "playing") return;
    state.lives--;
    sfx.life_lost();
    addShake(6, 0.45);
    pushPopup("-1 LIFE", LOGICAL_W / 2, 200, "is-warn");
    state.endReason = reason || state.endReason;
    if (state.lives <= 0) {
      gameOver();
    }
  }

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
    if (shardsToAdd > 0) addShards(shardsToAdd, GAME_ID + "-run-bonus");
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Archive Defeated You" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Sudoku Scribe · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Puzzles Cleared</div><div class="end-cell-value">' + state.puzzlesCleared + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Difficulty</div><div class="end-cell-value">' + DIFFICULTY_META[state.difficulty].name + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Puzzle</div><div class="end-cell-value">' + state.maxPuzzleReached + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Score</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    try { if (window.MrMacsEndRecap) { MrMacsEndRecap.stopTracking(); MrMacsEndRecap.render(document.getElementById("endRecap")); } } catch (e) {}
    showScreen("end");
    stopMusic();
  }

  // -- Render ----------------------------------------------------------------
  function render() {
    var W = canvas.width;
    var H = canvas.height;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W / dpr, H / dpr);

    // Background gradient
    var grad = ctx.createRadialGradient(W / dpr / 2, H / dpr * 0.3, 0, W / dpr / 2, H / dpr * 0.3, W / dpr * 0.7);
    grad.addColorStop(0, "#221a0f");
    grad.addColorStop(0.6, "#0c0a05");
    grad.addColorStop(1, "#080603");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W / dpr, H / dpr);

    // Apply scale + offsets to map LOGICAL space onto canvas pixels
    ctx.save();
    ctx.translate(offsetX + state.shake.x, offsetY + state.shake.y);
    ctx.scale(scale, scale);

    drawBoard();
    drawScholars();
    drawNumbersAndPencils();
    drawSelection();
    drawHintCellPulse();
    drawSameHighlight();
    drawConflictFlash();
    drawParticles();
    ctx.restore();
    ctx.restore();
  }

  function drawBoard() {
    var b = state.boardOrigin;
    // Parchment paper backdrop
    var bg = ctx.createLinearGradient(b.ox, b.oy, b.ox + b.w, b.oy + b.h);
    bg.addColorStop(0, "rgba(232, 213, 154, 0.15)");
    bg.addColorStop(1, "rgba(184, 154, 90, 0.12)");
    ctx.fillStyle = bg;
    ctx.fillRect(b.ox - 8, b.oy - 8, b.w + 16, b.h + 16);

    // Outer bezel
    ctx.strokeStyle = "rgba(245, 196, 81, 0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(b.ox - 8, b.oy - 8, b.w + 16, b.h + 16);

    // Cells
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var x = b.ox + c * b.cellPx;
        var y = b.oy + r * b.cellPx;
        var key = r + "," + c;
        if (isGiven(r, c)) {
          ctx.fillStyle = "rgba(20, 16, 8, 0.85)";
        } else if (state.revealedHints[key]) {
          ctx.fillStyle = "rgba(169, 145, 255, 0.18)";
        } else {
          ctx.fillStyle = "rgba(34, 26, 15, 0.62)";
        }
        ctx.fillRect(x, y, b.cellPx, b.cellPx);
      }
    }

    // Conflict tint (red bg)
    for (var k in state.conflicts) {
      var rc = k.split(",");
      var rr = parseInt(rc[0], 10), cc = parseInt(rc[1], 10);
      var cx = b.ox + cc * b.cellPx;
      var cy = b.oy + rr * b.cellPx;
      ctx.fillStyle = "rgba(240, 72, 96, 0.32)";
      ctx.fillRect(cx, cy, b.cellPx, b.cellPx);
    }

    // Thin grid lines
    ctx.strokeStyle = "rgba(255, 230, 180, 0.18)";
    ctx.lineWidth = 1;
    for (var i = 0; i <= 9; i++) {
      var lx = b.ox + i * b.cellPx;
      ctx.beginPath();
      ctx.moveTo(lx, b.oy);
      ctx.lineTo(lx, b.oy + b.h);
      ctx.stroke();
      var ly = b.oy + i * b.cellPx;
      ctx.beginPath();
      ctx.moveTo(b.ox, ly);
      ctx.lineTo(b.ox + b.w, ly);
      ctx.stroke();
    }
    // Thick lines for 3x3 boxes
    ctx.strokeStyle = "rgba(245, 196, 81, 0.7)";
    ctx.lineWidth = 2.5;
    for (var j = 0; j <= 9; j += 3) {
      var lx2 = b.ox + j * b.cellPx;
      ctx.beginPath();
      ctx.moveTo(lx2, b.oy);
      ctx.lineTo(lx2, b.oy + b.h);
      ctx.stroke();
      var ly2 = b.oy + j * b.cellPx;
      ctx.beginPath();
      ctx.moveTo(b.ox, ly2);
      ctx.lineTo(b.ox + b.w, ly2);
      ctx.stroke();
    }
  }

  function drawScholars() {
    var b = state.boardOrigin;
    for (var key in state.scholars) {
      if (state.scholarSolved[key]) continue;
      var rc = key.split(",");
      var r = parseInt(rc[0], 10), c = parseInt(rc[1], 10);
      var x = b.ox + c * b.cellPx;
      var y = b.oy + r * b.cellPx;
      // Gold shimmer rim — min lineWidth 3 so it remains visible on small mobile cells
      var pulse = reducedMotion ? 0.5 : (Math.sin(state.time * 3) + 1) * 0.5;
      ctx.strokeStyle = "rgba(245, 196, 81, " + (0.65 + pulse * 0.35) + ")";
      ctx.lineWidth = Math.max(3, b.cellPx * 0.05);
      ctx.strokeRect(x + 2, y + 2, b.cellPx - 4, b.cellPx - 4);
      // "?" mark in corner
      if (state.grid[r][c] === 0) {
        ctx.fillStyle = "rgba(245, 196, 81, 0.85)";
        ctx.font = "bold 12px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("?", x + 4, y + 3);
      }
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  function drawNumbersAndPencils() {
    var b = state.boardOrigin;
    var fontPx = Math.floor(b.cellPx * 0.55);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        var v = state.grid[r][c];
        var x = b.ox + c * b.cellPx;
        var y = b.oy + r * b.cellPx;
        var cx = x + b.cellPx / 2;
        var cy = y + b.cellPx / 2;
        if (v) {
          // Color by source
          var color;
          if (isGiven(r, c)) color = "#f6efde"; // givens — bright off-white
          else if (state.revealedHints[r + "," + c]) color = "#a991ff"; // hint — violet
          else if (state.conflicts[r + "," + c]) color = "#f04860";   // conflict — red
          else color = "#5de0f0";                                      // user — cyan
          ctx.fillStyle = color;
          ctx.font = "italic 700 " + fontPx + "px 'Fraunces', serif";
          ctx.fillText(String(v), cx, cy + 1);
        } else {
          // Pencil marks: render as 3x3 mini-grid
          var marks = state.pencils[r][c];
          if (marks && marks.length) {
            var pFont = Math.max(9, Math.floor(b.cellPx * 0.22));
            ctx.font = "700 " + pFont + "px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(184, 167, 128, 0.85)";
            for (var p = 0; p < marks.length; p++) {
              var pv = marks[p];
              var pr = Math.floor((pv - 1) / 3);
              var pc = (pv - 1) % 3;
              var px = x + (pc + 0.5) * (b.cellPx / 3);
              var py = y + (pr + 0.5) * (b.cellPx / 3);
              ctx.fillText(String(pv), px, py + 1);
            }
          }
        }
      }
    }
  }

  function drawSelection() {
    if (!state.selected) return;
    var b = state.boardOrigin;
    var sr = state.selected.r, sc = state.selected.c;
    var x = b.ox + sc * b.cellPx;
    var y = b.oy + sr * b.cellPx;
    // Row + col highlight (subtle)
    ctx.fillStyle = "rgba(245, 196, 81, 0.05)";
    ctx.fillRect(b.ox, y, b.w, b.cellPx);
    ctx.fillRect(x, b.oy, b.cellPx, b.h);
    // Box highlight
    var boxR = Math.floor(sr / 3) * 3;
    var boxC = Math.floor(sc / 3) * 3;
    ctx.fillRect(b.ox + boxC * b.cellPx, b.oy + boxR * b.cellPx, b.cellPx * 3, b.cellPx * 3);
    // Selection border
    ctx.strokeStyle = "rgba(245, 196, 81, 0.95)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1, y + 1, b.cellPx - 2, b.cellPx - 2);
    if (state.pencilMode) {
      // Inner dashed indicator
      ctx.save();
      ctx.strokeStyle = "rgba(169, 145, 255, 0.95)";
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, b.cellPx - 10, b.cellPx - 10);
      ctx.restore();
    }
  }

  function drawHintCellPulse() {
    if (!state.hintCellPulse) return;
    var b = state.boardOrigin;
    var p = state.hintCellPulse;
    var x = b.ox + p.c * b.cellPx;
    var y = b.oy + p.r * b.cellPx;
    var t = Math.max(0, 1 - (p.age || 0) / 1.6);
    if (t <= 0) return;
    // Clip to cell bounds so the border never bleeds into adjacent cells
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, b.cellPx, b.cellPx);
    ctx.clip();
    ctx.strokeStyle = "rgba(169, 145, 255, " + (0.55 + t * 0.45) + ")";
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2.5, y + 2.5, b.cellPx - 5, b.cellPx - 5);
    ctx.restore();
  }

  function drawSameHighlight() {
    if (state.sameValueLeft <= 0 || !state.sameValueHighlight) return;
    var b = state.boardOrigin;
    var v = state.sameValueHighlight;
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
      if (state.grid[r][c] === v) {
        var x = b.ox + c * b.cellPx;
        var y = b.oy + r * b.cellPx;
        ctx.fillStyle = "rgba(77, 212, 155, 0.32)";
        ctx.fillRect(x, y, b.cellPx, b.cellPx);
      }
    }
  }

  function drawConflictFlash() {
    if (state.conflictFlash <= 0) return;
    var b = state.boardOrigin;
    var alpha = (Math.sin(state.time * 12) + 1) * 0.5;
    for (var k in state.conflicts) {
      var rc = k.split(",");
      var r = parseInt(rc[0], 10), c = parseInt(rc[1], 10);
      var x = b.ox + c * b.cellPx;
      var y = b.oy + r * b.cellPx;
      // Clip to cell so the pulsing border never bleeds into neighbours
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, b.cellPx, b.cellPx);
      ctx.clip();
      ctx.strokeStyle = "rgba(240, 72, 96, " + (0.6 + alpha * 0.4) + ")";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, b.cellPx - 4, b.cellPx - 4);
      ctx.restore();
    }
  }

  function drawParticles() {
    if (!state.particles.length) return;
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var t = 1 - p.age / p.life;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // -- FX helpers ------------------------------------------------------------
  function addShake(intensity, duration) {
    state.shake.intensity = Math.max(state.shake.intensity, intensity);
    state.shake.life = duration;
    state.shake.totalLife = duration;
  }
  function updateShake(dt) {
    var s = state.shake;
    if (s.life > 0) {
      s.life -= dt;
      var t = s.life / s.totalLife;
      var amp = s.intensity * t;
      s.x = (Math.random() * 2 - 1) * amp;
      s.y = (Math.random() * 2 - 1) * amp;
      if (s.life <= 0) { s.x = 0; s.y = 0; s.intensity = 0; }
    } else {
      s.x = 0; s.y = 0;
    }
  }
  function updateParticles(dt) {
    if (!state.particles.length) return;
    var live = [];
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      p.age += dt;
      if (p.age >= p.life) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      live.push(p);
    }
    state.particles = live;
  }

  function pushPopup(text, x, y, cls) {
    if (!dom.popupOverlay) return;
    var el = document.createElement("div");
    el.className = "popup-text" + (cls ? " " + cls : "");
    el.textContent = text;
    var rect = canvas.getBoundingClientRect();
    var px = (x * scale + offsetX) / rect.width * 100;
    var py = (y * scale + offsetY) / rect.height * 100;
    el.style.left = px + "%";
    el.style.top = py + "%";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () { try { el.remove(); } catch (e) {} }, 1300);
  }

  function cellPx(r, c) {
    var b = state.boardOrigin;
    return {
      x: b.ox + c * b.cellPx,
      y: b.oy + r * b.cellPx,
      cx: b.ox + c * b.cellPx + b.cellPx / 2,
      cy: b.oy + r * b.cellPx + b.cellPx / 2,
      size: b.cellPx
    };
  }

  // -- HUD -------------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudPuzzle) dom.hudPuzzle.textContent = String(state.puzzleNum);
    if (dom.hudTime) dom.hudTime.textContent = formatTime(Math.floor(state.timeOnPuzzle));
    if (dom.hudHints) dom.hudHints.textContent = String(state.hintsLeft);
    if (dom.goalName) {
      var filled = countFilled();
      dom.goalName.textContent = filled + "/81 cells filled";
    }
    if (dom.goalMeta) {
      var bits = [];
      bits.push(DIFFICULTY_META[state.difficulty].name);
      bits.push("Hints " + state.hintsLeft);
      if (state.doubleScoreNext) bits.push("2x ARMED");
      if (state.currentScoreMult > 1) bits.push("MULT " + state.currentScoreMult + "x");
      if (state.idleWarning) bits.push("MOVE!");
      bits.push("P " + state.puzzleNum);
      dom.goalMeta.textContent = bits.join(" · ");
    }
    if (dom.hudLives) {
      var cell = dom.hudLives.parentElement;
      if (cell) cell.classList.toggle("is-danger", state.lives <= 1);
    }
    if (dom.pencilBtn) {
      dom.pencilBtn.classList.toggle("is-active", !!state.pencilMode);
      dom.pencilBtn.textContent = state.pencilMode ? "Pencil ON" : "Pencil";
      dom.pencilBtn.setAttribute("aria-label", state.pencilMode ? "Pencil-mark mode active — click to disable" : "Toggle pencil-mark mode");
    }
  }

  function countFilled() {
    var n = 0;
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) if (state.grid[r][c]) n++;
    return n;
  }

  function updatePowerupSlots() {
    var slots = [dom.puSlot1, dom.puSlot2, dom.puSlot3, dom.puSlot4, dom.puSlot5];
    for (var i = 0; i < 5; i++) {
      var slot = slots[i];
      if (!slot) continue;
      var glyphEl = slot.querySelector(".pu-glyph");
      var keyEl = slot.querySelector(".pu-key");
      if (i < state.inventory.length) {
        var t = state.inventory[i];
        var meta = POWERUP_META[t];
        slot.classList.add("has");
        slot.classList.remove("empty");
        if (glyphEl && meta) glyphEl.textContent = meta.glyph;
        slot.title = meta ? (meta.label + " - " + meta.desc) : "Power-up";
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
  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  // -- Scholar / review modal -----------------------------------------------
  var activeQuestion = null;
  var pendingScholarCell = null;

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

  function openScholarQuestion(r, c) {
    activeQuestion = pickQuestion();
    pendingScholarCell = { r: r, c: c };
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Cell · Optional · +1500 + 12 shards";
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
      dom.explanation.textContent = "Decoded! +1500 plus 12 shards.";
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
      state.score += 1500;
      addShards(12, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+1500 SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
    }
    activeQuestion = null;
    pendingScholarCell = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
    if (allCellsCorrect()) onPuzzleClear();
  }

  function skipQuestion() {
    activeQuestion = null;
    pendingScholarCell = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
    if (allCellsCorrect()) onPuzzleClear();
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
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    // Smart play-area scaling (May 10 2026): scale 9x9 board to 94% of
    // available play area minus chrome (HUD on top + numpad on bottom).
    var w = window.innerWidth;
    var chromeTop = w <= 1100 ? 180 : 150;
    var chromeBottom = w <= 1100 ? 110 : 0;   // numpad takes ~110px
    var availW = Math.max(1, rect.width);
    var availH = Math.max(120, rect.height - chromeTop - chromeBottom);
    var BOARD_LOGICAL = 600;
    scale = Math.min(availW * 0.96 / BOARD_LOGICAL, availH * 0.94 / BOARD_LOGICAL);
    offsetX = (rect.width - LOGICAL_W * scale) / 2;
    offsetY = chromeTop + (availH - LOGICAL_H * scale) / 2;
  }

  // -- Hub integration -------------------------------------------------------
  function addShards(n, source) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, source || (GAME_ID + "-bonus"));
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          puzzle: state.maxPuzzleReached,
          difficulty: state.difficulty
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
          puzzleNum: state.puzzleNum,
          lives: state.lives,
          difficulty: state.difficulty,
          puzzlesCleared: state.puzzlesCleared,
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
          file: "games/sudoku-scribe/index.html"
        };
        if (extra && typeof extra === "object") {
          if (extra.score != null) payload.score = extra.score;
          if (extra.durationMs != null) payload.durationMs = extra.durationMs;
          if (extra.puzzle != null) payload.level = extra.puzzle;
        }
        window.MrMacsProfile.recordPlay(payload);
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("sudoku-scribe:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("sudoku-scribe:best", String(Math.floor(v)));
    } catch (e) {}
  }
  function readDifficultyBest(d) {
    try {
      var raw = window.localStorage && window.localStorage.getItem("sudoku-scribe:best-time:" + d);
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeDifficultyBest(d, sec) {
    try {
      if (window.localStorage) window.localStorage.setItem("sudoku-scribe:best-time:" + d, String(Math.floor(sec)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  var runStartTs = 0;
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        // Primary "archive-dusk", fall back if missing
        try {
          window.MrMacsArcadeMusic.start("archive-dusk", { volume: 0.5 });
        } catch (eMain) {
          window.MrMacsArcadeMusic.start("maze-cabinet", { volume: 0.5 });
        }
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
        // Movement
        if (k === "ArrowUp")    { moveSelection(-1, 0); e.preventDefault(); return; }
        if (k === "ArrowDown")  { moveSelection( 1, 0); e.preventDefault(); return; }
        if (k === "ArrowLeft")  { moveSelection( 0,-1); e.preventDefault(); return; }
        if (k === "ArrowRight") { moveSelection( 0, 1); e.preventDefault(); return; }
        // Number keys 1-9
        if (k >= "1" && k <= "9") {
          var num = parseInt(k, 10);
          if (e.shiftKey) {
            // Shift+digit = pencil mark
            if (state.selected) togglePencil(state.selected.r, state.selected.c, num);
          } else if (e.ctrlKey || e.metaKey || e.altKey) {
            // Use power-up slot
            usePowerup(num);
          } else if (state.pencilMode) {
            if (state.selected) togglePencil(state.selected.r, state.selected.c, num);
          } else {
            if (state.selected) placeValue(state.selected.r, state.selected.c, num);
          }
          e.preventDefault();
          return;
        }
        if (k === "0" || k === "Backspace" || k === "Delete") {
          if (state.selected) eraseCell(state.selected.r, state.selected.c);
          e.preventDefault();
          return;
        }
        if (k === "h" || k === "H") { useHint({ free: false }); e.preventDefault(); return; }
        if (k === " " || k === "Space") {
          // Toggle pencil mode
          state.pencilMode = !state.pencilMode;
          updateHud();
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
    bindCanvasInput();
    bindNumpad();
  }

  function moveSelection(dr, dc) {
    var sel = state.selected || { r: 4, c: 4 };
    var nr = Math.max(0, Math.min(8, sel.r + dr));
    var nc = Math.max(0, Math.min(8, sel.c + dc));
    state.selected = { r: nr, c: nc };
    sfx.cell_select();
    state.idleTimer = 0;
  }

  function bindCanvasInput() {
    function pickFromClient(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      var lx = (clientX - rect.left - offsetX) / scale;
      var ly = (clientY - rect.top - offsetY) / scale;
      var b = state.boardOrigin;
      var c = Math.floor((lx - b.ox) / b.cellPx);
      var r = Math.floor((ly - b.oy) / b.cellPx);
      if (r < 0 || c < 0 || r > 8 || c > 8) return null;
      return { r: r, c: c };
    }
    var holdTimer = null;
    var holdStart = null;
    canvas.addEventListener("mousedown", function (e) {
      if (phase !== "playing") return;
      var pos = pickFromClient(e.clientX, e.clientY);
      if (!pos) return;
      // Only handle primary button; let contextmenu handler deal with right-click
      if (e.button != null && e.button !== 0) return;
      state.selected = pos;
      sfx.cell_select();
      state.idleTimer = 0;
      state.idleWarning = false;
      holdStart = performance.now();
      // Long-press TOGGLES pencil mode (matching the right-click contextmenu)
      holdTimer = setTimeout(function () {
        state.pencilMode = !state.pencilMode;
        updateHud();
      }, 450);
    });
    canvas.addEventListener("mouseup", function (e) {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    });
    canvas.addEventListener("mouseleave", function () {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    });
    canvas.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      if (phase !== "playing") return;
      var pos = pickFromClient(e.clientX, e.clientY);
      if (!pos) return;
      state.selected = pos;
      state.pencilMode = !state.pencilMode;
      updateHud();
    });
    // Touch — short tap = select; long press = pencil toggle
    var touchStart = null;
    var touchHold = null;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY, t: performance.now() };
        var pos = pickFromClient(t.clientX, t.clientY);
        if (pos) {
          state.selected = pos;
          sfx.cell_select();
          state.idleTimer = 0;
          state.idleWarning = false;
        }
        touchHold = setTimeout(function () {
          // Long-press TOGGLES pencil mode for symmetry with right-click/long-press mouse.
          state.pencilMode = !state.pencilMode;
          updateHud();
        }, 450);
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function () {
      if (touchHold) { clearTimeout(touchHold); touchHold = null; }
      touchStart = null;
    }, { passive: true });
    canvas.addEventListener("touchcancel", function () {
      if (touchHold) { clearTimeout(touchHold); touchHold = null; }
      touchStart = null;
    }, { passive: true });

    // Power-up slot clicks
    [dom.puSlot1, dom.puSlot2, dom.puSlot3, dom.puSlot4, dom.puSlot5].forEach(function (slot) {
      if (!slot) return;
      slot.addEventListener("click", function () {
        var slotN = parseInt(slot.getAttribute("data-slot"), 10) || 1;
        usePowerup(slotN);
      });
    });
  }

  function bindNumpad() {
    if (!dom.numpad) return;
    var btns = dom.numpad.querySelectorAll(".np-btn");
    btns.forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        if (phase !== "playing") return;
        var num = parseInt(b.getAttribute("data-num"), 10);
        if (isNaN(num)) return;
        if (num === 0) {
          if (state.selected) eraseCell(state.selected.r, state.selected.c);
        } else {
          if (state.selected) {
            if (state.pencilMode) togglePencil(state.selected.r, state.selected.c, num);
            else placeValue(state.selected.r, state.selected.c, num);
          }
        }
      });
    });
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
    if (dom.startBtn) dom.startBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    if (dom.resumeBtn) dom.resumeBtn.addEventListener("click", togglePause);
    if (dom.restartBtn) dom.restartBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    if (dom.pauseExitBtn) dom.pauseExitBtn.addEventListener("click", exitToArcade);
    if (dom.exitBtn) dom.exitBtn.addEventListener("click", exitToArcade);
    if (dom.pauseBtn) dom.pauseBtn.addEventListener("click", togglePause);
    if (dom.pencilBtn) dom.pencilBtn.addEventListener("click", function () {
      if (phase !== "playing") return;
      state.pencilMode = !state.pencilMode;
      updateHud();
    });
    if (dom.hintBtn) dom.hintBtn.addEventListener("click", function () {
      if (phase !== "playing") return;
      useHint({ free: false });
    });
    if (dom.setupBtn) dom.setupBtn.addEventListener("click", function () {
      clearSnapshot();
      phase = "setup";
      stopMusic();
      showScreen("setup");
      renderSetupExtras();
    });
    if (dom.againBtn) dom.againBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
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
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("sudoku-scribe");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "sudoku-scribe", { compact: false });
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
        puzzle: state.maxPuzzleReached
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
      puzzleNum: s.puzzleNum || 1,
      bankIndex: (s.puzzleNum || 1) - 1,
      lives: s.lives != null ? s.lives : LIVES_INIT,
      puzzlesCleared: s.puzzlesCleared || 0,
      difficulty: s.difficulty || "easy",
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
    if (snap && snap.state && (snap.state.score || snap.state.puzzleNum > 1) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' · Puzzle ' + (snap.state.puzzleNum || 1) +
        ' · ' + ((DIFFICULTY_META[snap.state.difficulty] || DIFFICULTY_META.easy).name) +
        '</div>' +
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
          var html = '<div class="leaderboard-title">Top 5 Sudoku Scribe Scores</div>';
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
        state.timeOnPuzzle += dt;
        state.idleTimer += dt;
        if (state.idleTimer > IDLE_WARN_AT && !state.idleWarning) {
          state.idleWarning = true;
          pushPopup("KEEP MOVING", LOGICAL_W / 2, 200, "is-warn");
          sfx.conflict_warn();
        }
        if (state.idleTimer > IDLE_LIFE_LOST_AT) {
          state.idleTimer = 0;
          state.idleWarning = false;
          loseLife("idle");
        }
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
        // Same-value highlight timer
        if (state.sameValueLeft > 0) {
          state.sameValueLeft -= dt;
          if (state.sameValueLeft <= 0) {
            state.sameValueHighlight = 0;
            state.sameValueLeft = 0;
          }
        }
        // Conflict flash
        if (state.conflictFlash > 0) state.conflictFlash = Math.max(0, state.conflictFlash - dt);
        // Hint cell aging
        if (state.hintCellPulse) {
          state.hintCellPulse.age = (state.hintCellPulse.age || 0) + dt;
          if (state.hintCellPulse.age > 1.6) state.hintCellPulse = null;
        }
      }
      updateParticles(dt);
      updateShake(dt);
    }
    if (state) render();
    if (phase === "playing" || phase === "clearing" || phase === "paused") {
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
    var GAME_ID_LOCAL = "sudoku-scribe";
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
