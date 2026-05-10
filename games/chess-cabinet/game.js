/* ===========================================================================
   Chess Cabinet — Chess vs AI · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x720 logical · Full chess engine + minimax AI
   Pieces: K Q R B N P (uppercase = white = player) / k q r b n p (lowercase = black = AI)
   Rules: standard movement · capture · check · checkmate · castling · en passant · promotion-to-queen
   AI tiers: Easy random | Normal d=2 | Hard d=3 + PST | Expert d=4 + opening book
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "chess-cabinet";
  var GAME_TITLE = "Chess Cabinet";

  // Logical canvas
  var LOGICAL_W = 720;
  var LOGICAL_H = 720;

  // Board renderer
  var BOARD_PADDING_TOP = 130;
  var BOARD_PADDING_BOTTOM = 90;
  var BOARD_SIZE = Math.min(LOGICAL_W - 200, LOGICAL_H - BOARD_PADDING_TOP - BOARD_PADDING_BOTTOM);
  var TILE_PX = Math.floor(BOARD_SIZE / 8);

  // Match config
  var MAX_MATCHES = 3;
  var WINS_FOR_CHAMPION = 3;
  var SCHOLAR_ROTATE_MOVES = 8;
  var SHARDS_CAP = 200;
  var POWERUP_CAP = 3;
  var BONUS_LIFE_THRESHOLD = 15000;

  // Scoring
  var PIECE_VALUE = { k: 0, q: 1000, r: 500, b: 325, n: 325, p: 100 };
  var CAPTURE_BONUS_BASE = 100;     // multiplier baseline; actual uses PIECE_VALUE
  var CHECKMATE_BONUS = 5000;
  var LOSS_PER_PIECE = 200;
  var SCHOLAR_BONUS = 1500;
  var SCHOLAR_SHARDS = 12;

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

  // ==========================================================================
  //  CHESS ENGINE — full move generation + minimax AI
  //  Internal board: 64-square 1D array indexed [0..63] with 0 = a8 (top-left
  //  in white's perspective), file = idx & 7, rank = idx >> 3 (0 = top, 7 = bottom)
  //  Empty: ""  · White pieces: K Q R B N P  · Black pieces: k q r b n p
  // ==========================================================================
  var WHITE = "w";
  var BLACK = "b";
  // Promotion piece choices (for the player; AI auto-queens)
  var PROMO_PIECES_WHITE = ["Q", "R", "B", "N"];
  var PROMO_PIECES_BLACK = ["q", "r", "b", "n"];

  // Piece-square tables (mid-game, white perspective). Black mirrors via 63-i.
  var PST = {
    P: [
      0,  0,  0,  0,  0,  0,  0,  0,
     50, 50, 50, 50, 50, 50, 50, 50,
     10, 10, 20, 30, 30, 20, 10, 10,
      5,  5, 10, 25, 25, 10,  5,  5,
      0,  0,  0, 20, 20,  0,  0,  0,
      5, -5,-10,  0,  0,-10, -5,  5,
      5, 10, 10,-20,-20, 10, 10,  5,
      0,  0,  0,  0,  0,  0,  0,  0
    ],
    N: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
    ],
    B: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
    ],
    R: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
    ],
    Q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
    ],
    K: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
    ]
  };

  // Tiny opening book for Expert tier; map of position-key (board.toString) to
  // candidate AI moves expressed as {from, to}. Triggered when AI plays Black
  // in opening. We key on the player's first/second moves.
  var OPENING_BOOK = {
    // After 1.e4 (white pawn e2->e4) -> respond with e7-e5 (Black pawn)
    "e2e4": [{ from: "e7", to: "e5" }, { from: "c7", to: "c5" }, { from: "e7", to: "e6" }],
    // After 1.d4 -> Nf6
    "d2d4": [{ from: "g8", to: "f6" }, { from: "d7", to: "d5" }],
    // After 1.c4 -> e5
    "c2c4": [{ from: "e7", to: "e5" }, { from: "g8", to: "f6" }],
    // After 1.Nf3 -> Nf6
    "g1f3": [{ from: "g8", to: "f6" }, { from: "d7", to: "d5" }],
    // After 1.e4 e5 2.Nf3 (white knight) -> Nc6
    "e2e4|e7e5|g1f3": [{ from: "b8", to: "c6" }],
    // After 1.d4 d5 2.c4 -> e6 (Queen's gambit declined)
    "d2d4|d7d5|c2c4": [{ from: "e7", to: "e6" }, { from: "c7", to: "c6" }]
  };

  function newBoard() {
    // Standard starting position. Index 0 = a8.
    return [
      "r","n","b","q","k","b","n","r",
      "p","p","p","p","p","p","p","p",
      "", "", "", "", "", "", "", "",
      "", "", "", "", "", "", "", "",
      "", "", "", "", "", "", "", "",
      "", "", "", "", "", "", "", "",
      "P","P","P","P","P","P","P","P",
      "R","N","B","Q","K","B","N","R"
    ];
  }

  function newPosition() {
    return {
      board: newBoard(),
      turn: WHITE,                // whose move
      // castling rights
      wK: true, wQ: true, bK: true, bQ: true,
      // en passant target square index (0..63) or -1
      ep: -1,
      // half-move clock (50-move rule, not enforced strictly here)
      half: 0,
      full: 1,
      moveLog: []                 // strings like "e2e4"
    };
  }

  function pieceColor(p) {
    if (!p) return null;
    return p === p.toUpperCase() ? WHITE : BLACK;
  }
  function pieceType(p) { return p ? p.toUpperCase() : ""; }
  function isWhite(p) { return p && p === p.toUpperCase(); }
  function isBlack(p) { return p && p === p.toLowerCase(); }

  function fileOf(idx) { return idx & 7; }
  function rankOf(idx) { return idx >> 3; }
  function idxOf(file, rank) { return rank * 8 + file; }
  function inBoard(file, rank) { return file >= 0 && file < 8 && rank >= 0 && rank < 8; }

  function squareName(idx) {
    var f = fileOf(idx), r = rankOf(idx);
    return "abcdefgh".charAt(f) + (8 - r);
  }
  function nameToIdx(s) {
    if (!s || s.length < 2) return -1;
    var f = "abcdefgh".indexOf(s.charAt(0));
    var r = parseInt(s.charAt(1), 10);
    if (f < 0 || isNaN(r) || r < 1 || r > 8) return -1;
    return idxOf(f, 8 - r);
  }

  // Generate all *pseudo-legal* moves for the side to move, then filter for
  // legality (does not leave own king in check). Returns array of move objects:
  // { from, to, piece, captured, flag, promote }
  // flag: "" | "ep" | "castleK" | "castleQ" | "double"
  function generateMoves(pos, side) {
    side = side || pos.turn;
    var moves = [];
    var b = pos.board;
    for (var i = 0; i < 64; i++) {
      var p = b[i];
      if (!p) continue;
      if (pieceColor(p) !== side) continue;
      var pt = pieceType(p);
      if (pt === "P") genPawnMoves(pos, i, side, moves);
      else if (pt === "N") genKnightMoves(pos, i, side, moves);
      else if (pt === "B") genSlidingMoves(pos, i, side, moves, [[1,1],[1,-1],[-1,1],[-1,-1]]);
      else if (pt === "R") genSlidingMoves(pos, i, side, moves, [[1,0],[-1,0],[0,1],[0,-1]]);
      else if (pt === "Q") genSlidingMoves(pos, i, side, moves, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
      else if (pt === "K") genKingMoves(pos, i, side, moves);
    }
    // Filter for legality
    var legal = [];
    for (var m = 0; m < moves.length; m++) {
      var mv = moves[m];
      var unmake = makeMove(pos, mv);
      if (!isInCheck(pos, side)) legal.push(mv);
      undoMove(pos, mv, unmake);
    }
    return legal;
  }

  function genPawnMoves(pos, i, side, out) {
    var b = pos.board;
    var dir = (side === WHITE) ? -1 : 1;
    var startRank = (side === WHITE) ? 6 : 1;
    var promoteRank = (side === WHITE) ? 0 : 7;
    var f = fileOf(i), r = rankOf(i);
    var p = b[i];

    // Forward 1
    var fr = r + dir;
    if (inBoard(f, fr)) {
      var to1 = idxOf(f, fr);
      if (!b[to1]) {
        if (fr === promoteRank) {
          out.push({ from: i, to: to1, piece: p, captured: "", flag: "promo", promote: (side === WHITE ? "Q" : "q") });
        } else {
          out.push({ from: i, to: to1, piece: p, captured: "", flag: "" });
        }
        // Forward 2 from start rank
        if (r === startRank) {
          var fr2 = r + 2 * dir;
          var to2 = idxOf(f, fr2);
          if (!b[to2] && !b[to1]) {
            out.push({ from: i, to: to2, piece: p, captured: "", flag: "double" });
          }
        }
      }
    }
    // Captures (incl. promotion)
    [-1, 1].forEach(function (df) {
      var nf = f + df, nr = r + dir;
      if (!inBoard(nf, nr)) return;
      var to = idxOf(nf, nr);
      var target = b[to];
      if (target && pieceColor(target) !== side) {
        if (nr === promoteRank) {
          out.push({ from: i, to: to, piece: p, captured: target, flag: "promo", promote: (side === WHITE ? "Q" : "q") });
        } else {
          out.push({ from: i, to: to, piece: p, captured: target, flag: "" });
        }
      } else if (!target && pos.ep === to) {
        // En passant: only valid if the adjacent square holds an opposing pawn
        var capIdx = idxOf(nf, r);
        var capPiece = b[capIdx];
        if (capPiece && pieceType(capPiece) === "P" && pieceColor(capPiece) !== side) {
          out.push({ from: i, to: to, piece: p, captured: capPiece, flag: "ep", capIdx: capIdx });
        }
      }
    });
  }

  var KNIGHT_OFFSETS = [
    [1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]
  ];
  function genKnightMoves(pos, i, side, out) {
    var b = pos.board;
    var f = fileOf(i), r = rankOf(i), p = b[i];
    for (var k = 0; k < KNIGHT_OFFSETS.length; k++) {
      var nf = f + KNIGHT_OFFSETS[k][0], nr = r + KNIGHT_OFFSETS[k][1];
      if (!inBoard(nf, nr)) continue;
      var to = idxOf(nf, nr);
      var t = b[to];
      if (!t) out.push({ from: i, to: to, piece: p, captured: "", flag: "" });
      else if (pieceColor(t) !== side) out.push({ from: i, to: to, piece: p, captured: t, flag: "" });
    }
  }

  function genSlidingMoves(pos, i, side, out, dirs) {
    var b = pos.board;
    var f = fileOf(i), r = rankOf(i), p = b[i];
    for (var k = 0; k < dirs.length; k++) {
      var df = dirs[k][0], dr = dirs[k][1];
      var nf = f + df, nr = r + dr;
      while (inBoard(nf, nr)) {
        var to = idxOf(nf, nr);
        var t = b[to];
        if (!t) {
          out.push({ from: i, to: to, piece: p, captured: "", flag: "" });
        } else {
          if (pieceColor(t) !== side) {
            out.push({ from: i, to: to, piece: p, captured: t, flag: "" });
          }
          break;
        }
        nf += df; nr += dr;
      }
    }
  }

  var KING_OFFSETS = [
    [1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]
  ];
  function genKingMoves(pos, i, side, out) {
    var b = pos.board;
    var f = fileOf(i), r = rankOf(i), p = b[i];
    for (var k = 0; k < KING_OFFSETS.length; k++) {
      var nf = f + KING_OFFSETS[k][0], nr = r + KING_OFFSETS[k][1];
      if (!inBoard(nf, nr)) continue;
      var to = idxOf(nf, nr);
      var t = b[to];
      if (!t) out.push({ from: i, to: to, piece: p, captured: "", flag: "" });
      else if (pieceColor(t) !== side) out.push({ from: i, to: to, piece: p, captured: t, flag: "" });
    }
    // Castling — king must not be in check, and must not pass through or land
    // on an attacked square (king's start, transit, and destination are all
    // checked). Also requires the king and rook not to have moved (rights flags),
    // an unobstructed path, and a rook of the correct color in the corner.
    if (side === WHITE && i === idxOf(4, 7) && b[i] === "K") {
      // Kingside (white): King e1 -> g1, rook h1 -> f1
      if (pos.wK && !b[idxOf(5,7)] && !b[idxOf(6,7)] && b[idxOf(7,7)] === "R") {
        if (!isSquareAttacked(pos, idxOf(4,7), BLACK) &&
            !isSquareAttacked(pos, idxOf(5,7), BLACK) &&
            !isSquareAttacked(pos, idxOf(6,7), BLACK)) {
          out.push({ from: i, to: idxOf(6,7), piece: p, captured: "", flag: "castleK" });
        }
      }
      // Queenside: King e1 -> c1, rook a1 -> d1 (b1 must be empty too — d1, c1, b1)
      if (pos.wQ && !b[idxOf(1,7)] && !b[idxOf(2,7)] && !b[idxOf(3,7)] && b[idxOf(0,7)] === "R") {
        if (!isSquareAttacked(pos, idxOf(4,7), BLACK) &&
            !isSquareAttacked(pos, idxOf(3,7), BLACK) &&
            !isSquareAttacked(pos, idxOf(2,7), BLACK)) {
          out.push({ from: i, to: idxOf(2,7), piece: p, captured: "", flag: "castleQ" });
        }
      }
    } else if (side === BLACK && i === idxOf(4, 0) && b[i] === "k") {
      if (pos.bK && !b[idxOf(5,0)] && !b[idxOf(6,0)] && b[idxOf(7,0)] === "r") {
        if (!isSquareAttacked(pos, idxOf(4,0), WHITE) &&
            !isSquareAttacked(pos, idxOf(5,0), WHITE) &&
            !isSquareAttacked(pos, idxOf(6,0), WHITE)) {
          out.push({ from: i, to: idxOf(6,0), piece: p, captured: "", flag: "castleK" });
        }
      }
      if (pos.bQ && !b[idxOf(1,0)] && !b[idxOf(2,0)] && !b[idxOf(3,0)] && b[idxOf(0,0)] === "r") {
        if (!isSquareAttacked(pos, idxOf(4,0), WHITE) &&
            !isSquareAttacked(pos, idxOf(3,0), WHITE) &&
            !isSquareAttacked(pos, idxOf(2,0), WHITE)) {
          out.push({ from: i, to: idxOf(2,0), piece: p, captured: "", flag: "castleQ" });
        }
      }
    }
  }

  // Is square attacked by the given side (color)?
  function isSquareAttacked(pos, sq, byColor) {
    var b = pos.board;
    var sqF = fileOf(sq), sqR = rankOf(sq);
    // Pawn attacks: white pawns attack from below toward smaller-rank squares,
    // so a square sq is attacked by a white pawn if pos[sq + (+8 +/- 1)]
    // contains a white pawn. We compute via offsets: byColor white attacks
    // upward (dir = -1 in our orientation where rank 0 = top).
    var pdir = (byColor === WHITE) ? -1 : 1;
    for (var dfp = -1; dfp <= 1; dfp += 2) {
      var pf2 = sqF + dfp, pr2 = sqR - pdir;
      if (inBoard(pf2, pr2)) {
        var pi = idxOf(pf2, pr2);
        var pa = b[pi];
        if (pa && pieceType(pa) === "P" && pieceColor(pa) === byColor) return true;
      }
    }
    // Knights
    for (var k = 0; k < KNIGHT_OFFSETS.length; k++) {
      var nf = sqF + KNIGHT_OFFSETS[k][0], nr = sqR + KNIGHT_OFFSETS[k][1];
      if (!inBoard(nf, nr)) continue;
      var ni = idxOf(nf, nr);
      var nP = b[ni];
      if (nP && pieceType(nP) === "N" && pieceColor(nP) === byColor) return true;
    }
    // Sliding rook/queen along straight, bishop/queen along diagonal
    var straight = [[1,0],[-1,0],[0,1],[0,-1]];
    var diag = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (var s = 0; s < straight.length; s++) {
      var df = straight[s][0], dr = straight[s][1];
      var fF = sqF + df, fR = sqR + dr;
      while (inBoard(fF, fR)) {
        var idx = idxOf(fF, fR);
        var pq = b[idx];
        if (pq) {
          if (pieceColor(pq) === byColor) {
            var pt = pieceType(pq);
            if (pt === "R" || pt === "Q") return true;
          }
          break;
        }
        fF += df; fR += dr;
      }
    }
    for (var s2 = 0; s2 < diag.length; s2++) {
      var df2 = diag[s2][0], dr2 = diag[s2][1];
      var fF2 = sqF + df2, fR2 = sqR + dr2;
      while (inBoard(fF2, fR2)) {
        var idx2 = idxOf(fF2, fR2);
        var pq2 = b[idx2];
        if (pq2) {
          if (pieceColor(pq2) === byColor) {
            var pt2 = pieceType(pq2);
            if (pt2 === "B" || pt2 === "Q") return true;
          }
          break;
        }
        fF2 += df2; fR2 += dr2;
      }
    }
    // King adjacency
    for (var kk = 0; kk < KING_OFFSETS.length; kk++) {
      var kf = sqF + KING_OFFSETS[kk][0], kr = sqR + KING_OFFSETS[kk][1];
      if (!inBoard(kf, kr)) continue;
      var ki = idxOf(kf, kr);
      var kp = b[ki];
      if (kp && pieceType(kp) === "K" && pieceColor(kp) === byColor) return true;
    }
    return false;
  }

  function findKing(pos, side) {
    var glyph = (side === WHITE) ? "K" : "k";
    for (var i = 0; i < 64; i++) if (pos.board[i] === glyph) return i;
    return -1;
  }

  function isInCheck(pos, side) {
    var ki = findKing(pos, side);
    if (ki < 0) return false;
    return isSquareAttacked(pos, ki, side === WHITE ? BLACK : WHITE);
  }

  // Apply a move; return an "unmake" descriptor with prior state to restore.
  function makeMove(pos, m) {
    var b = pos.board;
    var unmake = {
      ep: pos.ep,
      wK: pos.wK, wQ: pos.wQ, bK: pos.bK, bQ: pos.bQ,
      half: pos.half, full: pos.full,
      captured: m.captured || "",
      from: m.from, to: m.to,
      piece: m.piece,
      flag: m.flag,
      promote: m.promote,
      capIdx: m.capIdx,
      rookFrom: -1, rookTo: -1, rookPiece: ""
    };
    var side = pieceColor(m.piece);

    // Castling
    if (m.flag === "castleK") {
      // King: from -> to (+2). Rook: from to+1 -> to-1? Standard:
      // White kingside: K e1->g1, R h1->f1
      // Black kingside: K e8->g8, R h8->f8
      var kingTo = m.to;
      var rookFrom = (side === WHITE) ? idxOf(7,7) : idxOf(7,0);
      var rookTo = (side === WHITE) ? idxOf(5,7) : idxOf(5,0);
      b[m.to] = b[m.from];
      b[m.from] = "";
      unmake.rookPiece = b[rookFrom];
      b[rookTo] = b[rookFrom];
      b[rookFrom] = "";
      unmake.rookFrom = rookFrom; unmake.rookTo = rookTo;
    } else if (m.flag === "castleQ") {
      var rf = (side === WHITE) ? idxOf(0,7) : idxOf(0,0);
      var rt = (side === WHITE) ? idxOf(3,7) : idxOf(3,0);
      b[m.to] = b[m.from];
      b[m.from] = "";
      unmake.rookPiece = b[rf];
      b[rt] = b[rf];
      b[rf] = "";
      unmake.rookFrom = rf; unmake.rookTo = rt;
    } else if (m.flag === "ep") {
      b[m.to] = b[m.from];
      b[m.from] = "";
      b[m.capIdx] = "";  // remove captured pawn
    } else if (m.flag === "promo") {
      b[m.to] = m.promote;
      b[m.from] = "";
    } else {
      b[m.to] = b[m.from];
      b[m.from] = "";
    }

    // Update castling rights
    if (m.piece === "K") { pos.wK = false; pos.wQ = false; }
    else if (m.piece === "k") { pos.bK = false; pos.bQ = false; }
    if (m.piece === "R") {
      if (m.from === idxOf(0,7)) pos.wQ = false;
      if (m.from === idxOf(7,7)) pos.wK = false;
    }
    if (m.piece === "r") {
      if (m.from === idxOf(0,0)) pos.bQ = false;
      if (m.from === idxOf(7,0)) pos.bK = false;
    }
    // Captured rook in corner also voids the corresponding right
    if (m.captured === "R") {
      if (m.to === idxOf(0,7)) pos.wQ = false;
      if (m.to === idxOf(7,7)) pos.wK = false;
    }
    if (m.captured === "r") {
      if (m.to === idxOf(0,0)) pos.bQ = false;
      if (m.to === idxOf(7,0)) pos.bK = false;
    }

    // Set en passant target
    if (m.flag === "double") {
      var ff = fileOf(m.from), fr = rankOf(m.from), tr = rankOf(m.to);
      pos.ep = idxOf(ff, (fr + tr) >> 1);
    } else {
      pos.ep = -1;
    }

    // Half/full counters
    if (m.captured || pieceType(m.piece) === "P") pos.half = 0;
    else pos.half += 1;
    if (side === BLACK) pos.full += 1;
    pos.turn = (side === WHITE) ? BLACK : WHITE;
    return unmake;
  }

  function undoMove(pos, m, unmake) {
    var b = pos.board;
    pos.ep = unmake.ep;
    pos.wK = unmake.wK; pos.wQ = unmake.wQ;
    pos.bK = unmake.bK; pos.bQ = unmake.bQ;
    pos.half = unmake.half; pos.full = unmake.full;

    if (m.flag === "castleK" || m.flag === "castleQ") {
      b[m.from] = m.piece;
      b[m.to] = "";
      b[unmake.rookFrom] = unmake.rookPiece;
      b[unmake.rookTo] = "";
    } else if (m.flag === "ep") {
      b[m.from] = m.piece;
      b[m.to] = "";
      b[m.capIdx] = m.captured;
    } else if (m.flag === "promo") {
      b[m.from] = m.piece;
      b[m.to] = m.captured;
    } else {
      b[m.from] = m.piece;
      b[m.to] = m.captured;
    }
    pos.turn = pieceColor(m.piece);
  }

  // Evaluation: material + (optional) PST. Sign: positive = good for white.
  function evaluate(pos, usePST) {
    var b = pos.board;
    var score = 0;
    for (var i = 0; i < 64; i++) {
      var p = b[i];
      if (!p) continue;
      var pt = pieceType(p);
      var v = PIECE_VALUE[pt.toLowerCase()] || 0;
      if (isWhite(p)) {
        score += v;
        if (usePST && PST[pt]) score += PST[pt][i];
      } else {
        score -= v;
        if (usePST && PST[pt]) score -= PST[pt][63 - i];
      }
    }
    return score;
  }

  // Negamax with alpha-beta. side = +1 if white-to-move else -1. Returns score
  // from white's perspective. We track best move at the root via outBestMove.
  function search(pos, depth, alpha, beta, sideMul, usePST, outRoot) {
    if (depth <= 0) {
      // Quiescence-lite: return static eval (no QS to keep code small)
      return sideMul * evaluate(pos, usePST);
    }
    var moves = generateMoves(pos);
    if (moves.length === 0) {
      if (isInCheck(pos, pos.turn)) {
        // Checkmate: very bad for the side to move
        return -100000 + (1000 - depth);
      }
      // Stalemate
      return 0;
    }
    // Move ordering: captures first by MVV-LVA (most valuable victim - least valuable attacker)
    moves.sort(function (a, b) {
      var av = (a.captured ? PIECE_VALUE[a.captured.toLowerCase()] || 0 : 0) - (PIECE_VALUE[a.piece.toLowerCase()] || 0) * 0.1;
      var bv = (b.captured ? PIECE_VALUE[b.captured.toLowerCase()] || 0 : 0) - (PIECE_VALUE[b.piece.toLowerCase()] || 0) * 0.1;
      return bv - av;
    });
    var best = -Infinity;
    var bestMove = null;
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      var u = makeMove(pos, m);
      var sc = -search(pos, depth - 1, -beta, -alpha, -sideMul, usePST, null);
      undoMove(pos, m, u);
      if (sc > best) {
        best = sc;
        bestMove = m;
      }
      if (sc > alpha) alpha = sc;
      if (alpha >= beta) break;
    }
    if (outRoot) outRoot.move = bestMove;
    return best;
  }

  // Pick AI move based on tier ("easy" | "normal" | "hard" | "expert").
  function aiSelectMove(pos, tier, moveLog) {
    var moves = generateMoves(pos);
    if (moves.length === 0) return null;
    if (tier === "easy") {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    // Opening book for expert: try to look up by move log key
    if (tier === "expert" && moveLog && moveLog.length > 0 && moveLog.length <= 4) {
      var key = moveLog.join("|");
      if (OPENING_BOOK[key]) {
        var candidates = OPENING_BOOK[key];
        for (var c = 0; c < candidates.length; c++) {
          var fromI = nameToIdx(candidates[c].from);
          var toI = nameToIdx(candidates[c].to);
          for (var i = 0; i < moves.length; i++) {
            if (moves[i].from === fromI && moves[i].to === toI) return moves[i];
          }
        }
      }
      // Also try last white move as key
      var lastKey = moveLog[moveLog.length - 1];
      if (OPENING_BOOK[lastKey]) {
        var cand2 = OPENING_BOOK[lastKey];
        for (var c2 = 0; c2 < cand2.length; c2++) {
          var fI = nameToIdx(cand2[c2].from), tI = nameToIdx(cand2[c2].to);
          for (var i2 = 0; i2 < moves.length; i2++) {
            if (moves[i2].from === fI && moves[i2].to === tI) return moves[i2];
          }
        }
      }
    }
    var depth, usePST;
    if (tier === "normal") { depth = 2; usePST = false; }
    else if (tier === "hard") { depth = 3; usePST = true; }
    else if (tier === "expert") { depth = 4; usePST = true; }
    else { depth = 2; usePST = false; }
    var sideMul = (pos.turn === WHITE) ? 1 : -1;
    var root = { move: null };
    search(pos, depth, -Infinity, Infinity, sideMul, usePST, root);
    return root.move || moves[0];
  }

  // ==========================================================================
  //  SFX (Web Audio)
  // ==========================================================================
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
    piece_select: function () { sfxTone(620, 0.05, { type: "triangle", volume: 0.10 }); },
    piece_move: function () { sfxTone(420, 0.07, { type: "triangle", volume: 0.10, endFreq: 480 }); },
    piece_capture: function () {
      sfxTone(180, 0.10, { type: "sawtooth", volume: 0.14, endFreq: 90 });
      sfxNoise(0.12, { volume: 0.10, cutoff: 700 });
    },
    check: function () {
      sfxTone(880, 0.10, { type: "square", volume: 0.16 });
      setTimeout(function () { sfxTone(660, 0.14, { type: "square", volume: 0.14 }); }, 80);
    },
    checkmate: function () {
      [880, 1175, 1568, 1865, 2349].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 100);
      });
    },
    scholar_move: function () {
      sfxTone(988, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1318, 0.14, { type: "triangle", volume: 0.16 }); }, 90);
    },
    scholar_correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong: function () {
      sfxTone(330, 0.18, { type: "sawtooth", volume: 0.14, endFreq: 220 });
    },
    match_won: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 80);
      });
    },
    match_lost: function () {
      sfxTone(440, 0.5, { type: "sawtooth", volume: 0.16, endFreq: 80 });
      sfxNoise(0.3, { volume: 0.12, cutoff: 600 });
    },
    life_lost: function () {
      sfxTone(440, 0.4, { type: "sawtooth", volume: 0.14, endFreq: 100 });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    hint: function () {
      sfxTone(1175, 0.08, { type: "triangle", volume: 0.14 });
      setTimeout(function () { sfxTone(1568, 0.10, { type: "triangle", volume: 0.14 }); }, 60);
    },
    undo: function () { sfxTone(660, 0.06, { type: "triangle", volume: 0.10, endFreq: 480 }); },
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

  // ==========================================================================
  //  Canvas/state
  // ==========================================================================
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | aiThinking | question | paused | ended | gameOver
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("cabinetCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudMatch = $("hudMatch");
    dom.hudWins = $("hudWins");
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
    dom.undoBtn = $("undoBtn");
    dom.resignBtn = $("resignBtn");
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
    dom.diffEasy = $("diffEasy");
    dom.diffNormal = $("diffNormal");
    dom.diffHard = $("diffHard");
    dom.diffExpert = $("diffExpert");
  }

  // ==========================================================================
  //  State init / game flow
  // ==========================================================================
  function initState() {
    state = {
      score: 0,
      best: readBest(),
      lives: MAX_MATCHES,             // matches remaining
      matchNum: 1,
      wins: 0,
      losses: 0,
      tier: "normal",
      pos: newPosition(),
      selected: -1,                   // selected square (idx) or -1
      legalForSelected: [],
      lastMove: null,                 // {from, to} for highlight
      // Scholar square (one square at a time, gold)
      scholarSq: -1,
      movesSinceScholarRotation: 0,
      // Powerups (slot index -> {id, key})
      powerups: [],
      undoCount: 0,                   // remaining undos this match (cap 3)
      hintCount: 0,                   // remaining hints this match (cap 3)
      hintMove: null,                 // {from, to} if hint active
      bestMoveTurnsLeft: 0,           // best-move indicator turns
      shieldArmed: false,             // true if shield will save next captured piece
      lastShieldedPiece: null,        // piece restored info
      // Move counters for scoring
      capturesByPlayer: 0,
      lossesByPlayer: 0,
      questionsAnsweredCorrect: 0,
      questionsAnsweredTotal: 0,
      shardsAwarded: 0,
      bonusLifeAwarded: false,
      // Track piece-square scoring history snapshot
      moveHistory: [],                // [{ unmake, move, scoreBefore }] for player undo
      runStartTs: Date.now()
    };
    rotateScholarSquare();
  }

  function startNewMatch(resetWins) {
    if (resetWins) {
      state.wins = 0;
      state.losses = 0;
      state.score = 0;
      state.matchNum = 1;
      state.lives = MAX_MATCHES;
    }
    state.pos = newPosition();
    state.selected = -1;
    state.legalForSelected = [];
    state.lastMove = null;
    state.undoCount = 3;
    state.hintCount = 3;
    state.hintMove = null;
    state.bestMoveTurnsLeft = 0;
    state.shieldArmed = false;
    state.lastShieldedPiece = null;
    state.moveHistory = [];
    state.capturesByPlayer = 0;
    state.lossesByPlayer = 0;
    state.movesSinceScholarRotation = 0;
    rotateScholarSquare();
    phase = "playing";
    updateHud();
    drawAll();
  }

  function setTier(tier) {
    state.tier = tier;
    [dom.diffEasy, dom.diffNormal, dom.diffHard, dom.diffExpert].forEach(function (b) {
      if (!b) return;
      b.classList.toggle("is-active", b.getAttribute("data-diff") === tier);
    });
    if (dom.goalName) {
      var label;
      if (tier === "easy") label = "Easy · Random";
      else if (tier === "normal") label = "Normal · Depth 2";
      else if (tier === "hard") label = "Hard · Depth 3 + PST";
      else if (tier === "expert") label = "Expert · Depth 4 + Book";
      else label = "Normal · Depth 2";
      dom.goalName.textContent = label;
    }
  }

  // Scholar square rotates every 8 moves to a random *empty* or piece-occupied
  // square (excluding the back ranks initially). Gold-tinted; landing a piece
  // ON the scholar square triggers the optional review.
  function rotateScholarSquare() {
    if (!state) return;
    // pick a square between rank 2 and rank 5 (0-indexed) so it's mid-board
    var attempts = 0;
    while (attempts < 30) {
      var f = Math.floor(Math.random() * 8);
      var r = 2 + Math.floor(Math.random() * 4);
      var idx = idxOf(f, r);
      if (idx !== state.scholarSq) {
        state.scholarSq = idx;
        return;
      }
      attempts++;
    }
    // Fallback
    state.scholarSq = idxOf(Math.floor(Math.random() * 8), 2 + Math.floor(Math.random() * 4));
  }

  // ==========================================================================
  //  Input handling
  // ==========================================================================
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
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
  }

  function bindCanvasInput() {
    // Track recent touch so we can suppress the synthetic click that follows
    // touchend (which would otherwise fire handleSquareClick twice — once for
    // the tap on a piece, then again for the "tap target" tap).
    var lastTouchAt = 0;
    canvas.addEventListener("click", function (e) {
      if (phase !== "playing") return;
      // Suppress click that's the synthetic tail of a touchend within ~600ms
      if (Date.now() - lastTouchAt < 600) return;
      var sq = canvasToSquare(e.clientX, e.clientY);
      if (sq < 0) return;
      handleSquareClick(sq);
    });
    canvas.addEventListener("touchstart", function (e) {
      // Marking touchstart prevents most browsers from generating the click
      lastTouchAt = Date.now();
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      lastTouchAt = Date.now();
      if (phase !== "playing") {
        e.preventDefault();
        return;
      }
      var t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      var sq = canvasToSquare(t.clientX, t.clientY);
      if (sq < 0) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      handleSquareClick(sq);
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

  function canvasToSquare(clientX, clientY) {
    if (!state) return -1;
    var rect = canvas.getBoundingClientRect();
    var lx = (clientX - rect.left - offsetX) / scale;
    var ly = (clientY - rect.top - offsetY) / scale;
    var go = boardOrigin();
    var f = Math.floor((lx - go.ox) / go.tilePx);
    var r = Math.floor((ly - go.oy) / go.tilePx);
    if (f < 0 || r < 0 || f >= 8 || r >= 8) return -1;
    return idxOf(f, r);
  }

  function boardOrigin() {
    var ox = (LOGICAL_W - 8 * TILE_PX) / 2;
    var oy = BOARD_PADDING_TOP;
    return { ox: ox, oy: oy, tilePx: TILE_PX };
  }

  // Click on a board square. If a piece is selected and the click is a legal
  // target, perform the move. Otherwise, select the clicked piece (if it's
  // the player's color and white-to-move).
  function handleSquareClick(sq) {
    if (!state || phase !== "playing") return;
    if (state.pos.turn !== WHITE) return;  // wait for AI

    var b = state.pos.board;
    var clicked = b[sq];

    // If we have a selection and the clicked square is a legal target, move
    if (state.selected >= 0) {
      var match = null;
      for (var i = 0; i < state.legalForSelected.length; i++) {
        if (state.legalForSelected[i].to === sq) { match = state.legalForSelected[i]; break; }
      }
      if (match) {
        playerMove(match);
        return;
      }
    }

    // Otherwise, select if it's a white piece
    if (clicked && pieceColor(clicked) === WHITE) {
      var moves = generateMoves(state.pos, WHITE).filter(function (m) { return m.from === sq; });
      state.selected = sq;
      state.legalForSelected = moves;
      sfx.piece_select();
      drawAll();
    } else {
      // Deselect
      state.selected = -1;
      state.legalForSelected = [];
      drawAll();
    }
  }

  // Player moves are full chess moves; trigger captures, scoring, AI reply.
  function playerMove(m) {
    // If this is a promotion move, prompt the player to choose Q/R/B/N
    // before applying it (instead of silently auto-queening).
    if (m.flag === "promo" && pieceColor(m.piece) === WHITE && !m._promoPicked) {
      promptPromotion(function (chosen) {
        // Build a fresh promotion move with the chosen piece
        var picked = {
          from: m.from, to: m.to, piece: m.piece,
          captured: m.captured || "", flag: "promo",
          promote: chosen, _promoPicked: true
        };
        playerMove(picked);
      });
      return;
    }
    var preMove = {
      ep: state.pos.ep,
      wK: state.pos.wK, wQ: state.pos.wQ, bK: state.pos.bK, bQ: state.pos.bQ,
      half: state.pos.half, full: state.pos.full
    };
    var moveNotation = squareName(m.from) + squareName(m.to);
    var unmake = makeMove(state.pos, m);
    state.pos.moveLog.push(moveNotation);

    // Score
    if (m.captured) {
      // Capture: score by piece value
      var v = PIECE_VALUE[m.captured.toLowerCase()] || 0;
      state.score += v;
      state.capturesByPlayer += 1;
      sfx.piece_capture();
      pushPopup("+" + v + " CAPTURE", LOGICAL_W / 2, 130, "is-score");
      // Drop power-up randomly
      maybeDropPowerup();
    } else {
      sfx.piece_move();
    }

    // Save history for undo
    state.moveHistory.push({
      move: m, unmake: unmake, before: preMove, side: WHITE,
      scoreDelta: m.captured ? (PIECE_VALUE[m.captured.toLowerCase()] || 0) : 0
    });
    state.lastMove = { from: m.from, to: m.to };
    state.selected = -1;
    state.legalForSelected = [];
    state.hintMove = null;
    state.bestMoveTurnsLeft = Math.max(0, state.bestMoveTurnsLeft - 1);

    // Scholar square check: if the player landed ON the scholar square, trigger review
    if (m.to === state.scholarSq) {
      sfx.scholar_move();
      // Open review modal AFTER updating board
      state.movesSinceScholarRotation = 0;  // reset counter; new square after answer
      drawAll();
      updateHud();
      setTimeout(openScholarQuestion, 200);
      return;
    } else {
      state.movesSinceScholarRotation += 1;
      if (state.movesSinceScholarRotation >= SCHOLAR_ROTATE_MOVES) {
        rotateScholarSquare();
        state.movesSinceScholarRotation = 0;
      }
    }

    drawAll();
    updateHud();

    // Check for end of match (checkmate/stalemate before AI move)
    if (checkMatchEnd(true)) return;

    // AI replies after a short delay
    phase = "aiThinking";
    if (dom.goalMeta) dom.goalMeta.textContent = "AI thinking…";
    scheduleAiReply();
  }

  // Schedule AI reply, chunking heavy work via setTimeout so the UI doesn't
  // freeze on Expert (depth-4) searches. We yield to the browser before the
  // search runs so the "AI thinking…" indicator paints.
  function scheduleAiReply() {
    setTimeout(function () {
      if (!state || phase !== "aiThinking") return;
      // Yield once more so the UI repaints before the heavy compute lands.
      setTimeout(aiReply, state.tier === "expert" ? 30 : 0);
    }, 200);
  }

  function aiReply() {
    if (!state || phase !== "aiThinking") return;
    var m;
    try {
      m = aiSelectMove(state.pos, state.tier, state.pos.moveLog);
    } catch (e) {
      m = null;
    }
    if (!state || phase !== "aiThinking") return;
    if (!m) {
      // No moves: checkmate or stalemate
      checkMatchEnd(false);
      return;
    }
    var preMove = {
      ep: state.pos.ep,
      wK: state.pos.wK, wQ: state.pos.wQ, bK: state.pos.bK, bQ: state.pos.bQ,
      half: state.pos.half, full: state.pos.full
    };
    var moveNotation = squareName(m.from) + squareName(m.to);
    var unmake = makeMove(state.pos, m);
    state.pos.moveLog.push(moveNotation);

    if (m.captured) {
      // Black captured a white piece
      if (state.shieldArmed) {
        // Restore the captured piece — undo the AI move and refund
        // Trick: we already made the move. We need to put the captured back at
        // its origin. Simplest: undo the move, then make a "non-capturing"
        // version that keeps the piece. Here, the cleanest is to undo + bail.
        undoMove(state.pos, m, unmake);
        state.pos.moveLog.pop();
        state.shieldArmed = false;
        sfx.powerup_use();
        pushPopup("SHIELD!", LOGICAL_W / 2, 200, "is-emerald");
        // Let AI try a different (non-capturing) move if any, else just pass turn
        var nonCap = generateMoves(state.pos, BLACK).filter(function (mv) { return !mv.captured; });
        if (nonCap.length > 0) {
          var alt = nonCap[Math.floor(Math.random() * nonCap.length)];
          var u2 = makeMove(state.pos, alt);
          state.pos.moveLog.push(squareName(alt.from) + squareName(alt.to));
          state.lastMove = { from: alt.from, to: alt.to };
          state.moveHistory.push({ move: alt, unmake: u2, before: preMove, side: BLACK, scoreDelta: 0 });
          sfx.piece_move();
        } else {
          // No non-cap move; force-skip AI turn (acceptable for a power-up)
          state.pos.turn = WHITE;
        }
      } else {
        var v = PIECE_VALUE[m.captured.toLowerCase()] || 0;
        state.score = Math.max(0, state.score - LOSS_PER_PIECE);
        state.lossesByPlayer += 1;
        sfx.piece_capture();
        pushPopup("-" + LOSS_PER_PIECE + " LOST", LOGICAL_W / 2, 130, "is-warn");
        state.lastMove = { from: m.from, to: m.to };
        state.moveHistory.push({ move: m, unmake: unmake, before: preMove, side: BLACK, scoreDelta: -LOSS_PER_PIECE });
      }
    } else {
      sfx.piece_move();
      state.lastMove = { from: m.from, to: m.to };
      state.moveHistory.push({ move: m, unmake: unmake, before: preMove, side: BLACK, scoreDelta: 0 });
    }

    // Check check / checkmate against player
    if (isInCheck(state.pos, WHITE)) {
      sfx.check();
      pushPopup("CHECK!", LOGICAL_W / 2, 90, "is-warn");
    }

    // Scholar rotation tick (AI moves count too)
    state.movesSinceScholarRotation += 1;
    if (state.movesSinceScholarRotation >= SCHOLAR_ROTATE_MOVES) {
      rotateScholarSquare();
      state.movesSinceScholarRotation = 0;
    }

    drawAll();
    updateHud();

    if (checkMatchEnd(false)) return;

    phase = "playing";
  }

  // Check whether the match has ended. Returns true if it ended and handled.
  function checkMatchEnd(afterPlayer) {
    var sideToMove = state.pos.turn;
    var moves = generateMoves(state.pos);
    if (moves.length > 0) {
      // Bonus life check
      if (!state.bonusLifeAwarded && state.score >= BONUS_LIFE_THRESHOLD) {
        state.bonusLifeAwarded = true;
        state.lives += 1;
        pushPopup("BONUS MATCH!", LOGICAL_W / 2, 80, "is-emerald");
        sfx.match_won();
        updateHud();
      }
      return false;
    }
    // No moves: checkmate or stalemate
    var inCheck = isInCheck(state.pos, sideToMove);
    if (inCheck) {
      // Checkmate
      sfx.checkmate();
      addShake(10, 0.6);
      if (sideToMove === BLACK) {
        // Player wins this match
        state.score += CHECKMATE_BONUS;
        state.wins += 1;
        pushPopup("CHECKMATE!", LOGICAL_W / 2, 100, "is-tetris");
        pushPopup("+" + CHECKMATE_BONUS, LOGICAL_W / 2, 160, "is-score");
        sfx.match_won();
        try { if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        } } catch (e) {}
        setTimeout(advanceAfterMatch, 1400);
      } else {
        // Player loses this match
        state.losses += 1;
        state.lives -= 1;
        sfx.match_lost();
        pushPopup("CHECKMATED", LOGICAL_W / 2, 100, "is-warn");
        sfx.life_lost();
        setTimeout(advanceAfterMatch, 1400);
      }
    } else {
      // Stalemate -> draw (count as half: doesn't decrement lives, no win added)
      pushPopup("STALEMATE", LOGICAL_W / 2, 100, "is-bonus");
      sfx.match_lost();
      setTimeout(advanceAfterMatch, 1400);
    }
    return true;
  }

  function advanceAfterMatch() {
    saveSnapshot();
    if (state.wins >= WINS_FOR_CHAMPION) {
      // Champion!
      gameOver(true);
      return;
    }
    if (state.lives <= 0 || state.losses >= 3) {
      gameOver(false);
      return;
    }
    state.matchNum += 1;
    startNewMatch(false);
  }

  // Resign current match
  function resignMatch() {
    if (phase !== "playing" && phase !== "aiThinking") return;
    state.losses += 1;
    state.lives -= 1;
    sfx.match_lost();
    pushPopup("RESIGNED", LOGICAL_W / 2, 100, "is-warn");
    setTimeout(advanceAfterMatch, 700);
  }

  // ==========================================================================
  //  Undo / Reset / Pause
  // ==========================================================================
  function tryUndo() {
    if (phase !== "playing") return;
    if (state.undoCount <= 0) {
      pushPopup("NO UNDOS", LOGICAL_W / 2, 200, "is-warn");
      return;
    }
    if (state.moveHistory.length < 2) {
      // need both AI + player to undo a "pair"
      if (state.moveHistory.length === 1 && state.moveHistory[0].side === WHITE) {
        // undo single white move
        var h = state.moveHistory.pop();
        undoMove(state.pos, h.move, h.unmake);
        state.pos.moveLog.pop();
        state.score = Math.max(0, state.score - h.scoreDelta);
        state.undoCount -= 1;
        sfx.undo();
        state.lastMove = null;
        state.selected = -1;
        state.legalForSelected = [];
        drawAll(); updateHud();
        return;
      }
      pushPopup("NO MOVES", LOGICAL_W / 2, 200, "is-warn");
      return;
    }
    // Undo last AI move + last player move
    var lastAi = state.moveHistory.pop();
    if (lastAi) {
      undoMove(state.pos, lastAi.move, lastAi.unmake);
      state.pos.moveLog.pop();
      state.score = Math.max(0, state.score - lastAi.scoreDelta);
    }
    var lastP = state.moveHistory.pop();
    if (lastP) {
      undoMove(state.pos, lastP.move, lastP.unmake);
      state.pos.moveLog.pop();
      state.score = Math.max(0, state.score - lastP.scoreDelta);
    }
    state.undoCount -= 1;
    sfx.undo();
    state.lastMove = null;
    state.selected = -1;
    state.legalForSelected = [];
    drawAll(); updateHud();
  }

  function togglePause() {
    if (phase === "paused") {
      var resume = prevPhase || "playing";
      phase = resume;
      prevPhase = null;
      showScreen(null);
      resumeMusic();
      // If we were paused mid-AI-think, re-arm the reply timer; otherwise the
      // AI would never move on resume (the original setTimeout already fired
      // and bailed out because phase !== "aiThinking").
      if (resume === "aiThinking") {
        scheduleAiReply();
      }
      drawAll();
      updateHud();
    } else if (phase === "playing" || phase === "aiThinking") {
      prevPhase = phase;
      phase = "paused";
      showScreen("pause");
      pauseMusic();
    }
  }

  // ==========================================================================
  //  Power-ups
  //  Slot inventory: state.powerups = [{id, key, label, glyph}]
  //  IDs: undo · hint · clock · shield · bestMove
  // ==========================================================================
  function maybeDropPowerup() {
    // 28% chance to drop on capture
    if (Math.random() > 0.28) return;
    if (state.powerups.length >= POWERUP_CAP) return;
    var pool = [
      { id: "undo", glyph: "↻", label: "Undo" },          // ↻
      { id: "hint", glyph: "\u{1F4A1}", label: "Hint" },       // 💡
      { id: "clock", glyph: "⏱", label: "+60s" },         // ⏱
      { id: "shield", glyph: "\u{1F6E1}", label: "Shield" },   // 🛡
      { id: "bestMove", glyph: "\u{1F3AF}", label: "Indicator" } // 🎯
    ];
    // For undo, hint, only drop if pertinent counts allow
    var pickPool = pool.filter(function (p) {
      if (p.id === "undo" && state.undoCount >= 3) return false;
      if (p.id === "hint" && state.hintCount >= 3) return false;
      return true;
    });
    if (pickPool.length === 0) pickPool = pool;
    var p = pickPool[Math.floor(Math.random() * pickPool.length)];
    state.powerups.push(p);
    sfx.powerup_pickup();
    updatePowerupSlots();
  }

  function usePowerup(slot) {
    var idx = slot - 1;
    if (idx < 0 || idx >= state.powerups.length) return;
    var pu = state.powerups[idx];
    if (!pu) return;
    if (pu.id === "undo") {
      // Grants +1 undo (if any caps left)
      state.undoCount = Math.min(3, state.undoCount + 1);
      pushPopup("+UNDO", LOGICAL_W / 2, 200, "is-emerald");
      sfx.powerup_use();
    } else if (pu.id === "hint") {
      // Show suggested player move via AI search. Only suggest when it's
      // actually white's turn so we never show an illegal move.
      state.hintCount = Math.min(3, state.hintCount + 1);
      if (state.pos.turn !== WHITE) {
        pushPopup("WAIT TURN", LOGICAL_W / 2, 200, "is-warn");
      } else {
        var whiteMoves = generateMoves(state.pos, WHITE);
        if (whiteMoves.length > 0) {
          var sideMul = 1;
          var root = { move: null };
          search(state.pos, 2, -Infinity, Infinity, sideMul, true, root);
          // Validate: the search's chosen move must still be in the legal set
          var chosen = root.move;
          var valid = false;
          if (chosen) {
            for (var hi = 0; hi < whiteMoves.length; hi++) {
              if (whiteMoves[hi].from === chosen.from && whiteMoves[hi].to === chosen.to) {
                valid = true; break;
              }
            }
          }
          if (!valid) chosen = whiteMoves[0];
          if (chosen) {
            state.hintMove = { from: chosen.from, to: chosen.to };
            pushPopup("HINT", LOGICAL_W / 2, 200, "is-bonus");
            sfx.hint();
          }
        }
      }
    } else if (pu.id === "clock") {
      // Score bonus instead of clock since this is turn-based
      state.score += 600;
      pushPopup("+600 TIME", LOGICAL_W / 2, 200, "is-bonus");
      sfx.powerup_use();
    } else if (pu.id === "shield") {
      state.shieldArmed = true;
      pushPopup("SHIELD ARMED", LOGICAL_W / 2, 200, "is-emerald");
      sfx.powerup_use();
    } else if (pu.id === "bestMove") {
      state.bestMoveTurnsLeft = 3;
      // Compute a hint immediately
      var sideMul2 = 1;
      var root2 = { move: null };
      search(state.pos, 2, -Infinity, Infinity, sideMul2, true, root2);
      if (root2.move) state.hintMove = { from: root2.move.from, to: root2.move.to };
      pushPopup("INDICATOR x3", LOGICAL_W / 2, 200, "is-bonus");
      sfx.powerup_use();
    }
    state.powerups.splice(idx, 1);
    updatePowerupSlots();
    drawAll(); updateHud();
  }

  function updatePowerupSlots() {
    [dom.puSlot1, dom.puSlot2, dom.puSlot3].forEach(function (slot, i) {
      if (!slot) return;
      var pu = state.powerups[i];
      var glyphEl = slot.querySelector(".pu-glyph");
      if (pu) {
        slot.classList.remove("empty");
        slot.classList.add("has");
        if (glyphEl) glyphEl.textContent = pu.glyph;
        slot.setAttribute("aria-label", "Power-up slot " + (i + 1) + ": " + pu.label);
      } else {
        slot.classList.add("empty");
        slot.classList.remove("has", "is-active");
        if (glyphEl) glyphEl.textContent = "·";
        slot.setAttribute("aria-label", "Power-up slot " + (i + 1) + " (empty)");
      }
    });
  }

  // ==========================================================================
  //  Scholar review modal
  // ==========================================================================
  var activeQuestion = null;
  function openScholarQuestion() {
    if (phase === "question" || phase === "ended") return;
    var q = INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
    if (!q) return;
    activeQuestion = q;
    state.questionsAnsweredTotal += 1;
    prevPhase = phase;
    phase = "question";
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Square · " + squareName(state.scholarSq).toUpperCase();
    if (dom.questionPrompt) dom.questionPrompt.textContent = q.prompt;
    if (dom.choiceGrid) {
      dom.choiceGrid.innerHTML = "";
      // Shuffle choice display
      var idxs = [0, 1, 2, 3].sort(function () { return Math.random() - 0.5; });
      idxs.forEach(function (origIdx, displayIdx) {
        var btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.type = "button";
        btn.innerHTML = '<span class="choice-letter">' + "ABCD".charAt(displayIdx) + ".</span>" + escapeHtml(q.choices[origIdx]);
        btn.addEventListener("click", function () { answerQuestion(q.choices[origIdx], q.correctText, btn); });
        dom.choiceGrid.appendChild(btn);
      });
    }
    if (dom.explanation) {
      dom.explanation.textContent = q.hint || "";
      dom.explanation.classList.remove("is-correct", "is-wrong");
    }
    showScreen("question");
    pauseMusic();
  }
  function answerQuestion(picked, correct, btn) {
    var isCorrect = picked === correct;
    if (btn) btn.classList.add(isCorrect ? "is-correct" : "is-wrong");
    if (dom.explanation) {
      dom.explanation.textContent = isCorrect ? "Correct · +1500 score, +12 shards" : "Not quite — " + (activeQuestion.hint || "");
      dom.explanation.classList.add(isCorrect ? "is-correct" : "is-wrong");
    }
    if (isCorrect) {
      sfx.scholar_correct();
      state.questionsAnsweredCorrect += 1;
    } else {
      sfx.scholar_wrong();
    }
    setTimeout(function () { closeQuestion(isCorrect); }, 1100);
  }
  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += SCHOLAR_BONUS;
      addShards(SCHOLAR_SHARDS);
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+1500 SCHOLAR", LOGICAL_W / 2, 80, "is-bonus");
    }
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    rotateScholarSquare();
    drawAll();
    updateHud();
    // After review, if it was a player move that triggered the scholar, AI must reply
    if (state.pos.turn === BLACK) {
      phase = "aiThinking";
      setTimeout(aiReply, 250);
    }
  }
  function skipQuestion() {
    activeQuestion = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    rotateScholarSquare();
    drawAll();
    updateHud();
    if (state.pos.turn === BLACK) {
      phase = "aiThinking";
      setTimeout(aiReply, 250);
    }
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ==========================================================================
  //  Promotion picker — lightweight overlay (no extra HTML required)
  // ==========================================================================
  var promoOverlay = null;
  function promptPromotion(onPick) {
    closePromotion();
    var overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.style.cssText = "position:absolute;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;background:rgba(8,6,2,.78);backdrop-filter:blur(4px);pointer-events:auto;";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Choose promotion piece");
    overlay.setAttribute("aria-modal", "true");
    var card = document.createElement("div");
    card.style.cssText = "background:rgba(14,10,4,.96);border:1px solid rgba(255,230,180,.14);border-radius:14px;padding:20px 24px;box-shadow:0 32px 96px rgba(0,0,0,.72);max-width:360px;text-align:center;";
    var title = document.createElement("h3");
    title.textContent = "Promote pawn";
    title.style.cssText = "font-family:'Fraunces',serif;font-style:italic;font-weight:800;font-size:20px;margin:0 0 12px;color:#f6efde;";
    var sub = document.createElement("p");
    sub.textContent = "Choose a piece to promote to.";
    sub.style.cssText = "color:#b8a780;font-size:13px;margin:0 0 14px;";
    var row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;justify-content:center;";
    var pieces = PROMO_PIECES_WHITE;
    var labels = { Q: "Queen", R: "Rook", B: "Bishop", N: "Knight" };
    pieces.forEach(function (pc) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = GLYPHS[pc] + " " + labels[pc];
      b.setAttribute("aria-label", "Promote to " + labels[pc]);
      b.style.cssText = "padding:10px 14px;border-radius:8px;border:1px solid rgba(255,230,180,.25);background:rgba(255,230,180,.06);color:#f6efde;font-size:14px;cursor:pointer;font-family:inherit;";
      b.addEventListener("click", function (e) {
        e.preventDefault();
        closePromotion();
        try { if (typeof onPick === "function") onPick(pc); } catch (err) {}
      });
      row.appendChild(b);
    });
    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(row);
    overlay.appendChild(card);
    var shell = document.querySelector(".cabinet-shell") || document.body;
    shell.appendChild(overlay);
    promoOverlay = overlay;
    // Auto-focus first button so keyboard users can press Enter
    setTimeout(function () {
      var b0 = row.querySelector("button");
      if (b0 && b0.focus) try { b0.focus(); } catch (e) {}
    }, 30);
  }
  function closePromotion() {
    if (promoOverlay && promoOverlay.parentNode) {
      promoOverlay.parentNode.removeChild(promoOverlay);
    }
    promoOverlay = null;
  }

  // ==========================================================================
  //  Game over / end screen
  // ==========================================================================
  function gameOver(isChampion) {
    if (phase === "ended" || phase === "gameOver") return;
    sfx.gameOver();
    addShake(8, 0.5);
    phase = "ended";
    var prevBest = readBest();
    if (state.score > prevBest) writeBest(state.score);
    setTimeout(function () { showEndScreen(isChampion); }, 700);
  }
  function showEndScreen(isChampion) {
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 250));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = isChampion ? "Cabinet Champion" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = isChampion ? "Chess Cabinet · Champion" : "Chess Cabinet · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Wins</div><div class="end-cell-value">' + state.wins + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Losses</div><div class="end-cell-value">' + state.losses + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Captures</div><div class="end-cell-value">' + state.capturesByPlayer + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + "/" + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best Score</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run) · Tier: " + state.tier;
    showScreen("end");
    stopMusic();
    recordPlayWithProfile({ score: state.score, durationMs: Date.now() - (state.runStartTs || Date.now()) });
  }

  // ==========================================================================
  //  Screens
  // ==========================================================================
  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
  }

  // ==========================================================================
  //  Drawing — board, pieces (Unicode chess characters), highlights
  // ==========================================================================
  var GLYPHS = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
  };

  var shake = { mag: 0, decay: 1, t: 0 };
  function addShake(mag, decay) { shake.mag = mag; shake.decay = decay || 0.6; shake.t = 1; }

  function drawAll() {
    if (!ctx || !canvas) return;
    var w = canvas.width, h = canvas.height;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w / dpr, h / dpr);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (shake.t > 0 && !reducedMotion) {
      var sx = (Math.random() - 0.5) * shake.mag * shake.t;
      var sy = (Math.random() - 0.5) * shake.mag * shake.t;
      ctx.translate(sx, sy);
      shake.t -= shake.decay * 0.05;
      if (shake.t < 0) shake.t = 0;
    }

    drawBackdrop();
    drawBoard();
    drawCoords();
    drawSidePanels();
    ctx.restore();
  }

  function drawBackdrop() {
    var g = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, 100, LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_H * 0.7);
    g.addColorStop(0, "#221a0f");
    g.addColorStop(0.6, "#14110a");
    g.addColorStop(1, "#0c0a05");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }

  function drawBoard() {
    var go = boardOrigin();
    // Border with brass frame
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    var pad = 8;
    var bx = go.ox - pad, by = go.oy - pad, bw = 8 * go.tilePx + pad * 2, bh = 8 * go.tilePx + pad * 2;
    var brass = ctx.createLinearGradient(bx, by, bx, by + bh);
    brass.addColorStop(0, "#c8922a");
    brass.addColorStop(0.5, "#7d5618");
    brass.addColorStop(1, "#3a2406");
    ctx.fillStyle = brass;
    roundRect(ctx, bx - 2, by - 2, bw + 4, bh + 4, 12);
    ctx.fill();
    ctx.restore();

    // Inner board border line
    ctx.strokeStyle = "rgba(245, 196, 81, .55)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, go.ox - 2, go.oy - 2, 8 * go.tilePx + 4, 8 * go.tilePx + 4, 6);
    ctx.stroke();

    // Squares
    var b = state.pos.board;
    for (var r = 0; r < 8; r++) {
      for (var f = 0; f < 8; f++) {
        var idx = idxOf(f, r);
        var x = go.ox + f * go.tilePx;
        var y = go.oy + r * go.tilePx;
        var isLight = ((f + r) & 1) === 0;
        var fill = isLight ? "#e8d59a" : "#5a3a1c";
        // Scholar square: gold tint — use brighter dark-square color for mobile contrast
        if (idx === state.scholarSq) {
          fill = isLight ? "#f5c451" : "#c4861c";
        }
        // Last move highlight
        if (state.lastMove && (state.lastMove.from === idx || state.lastMove.to === idx)) {
          fill = isLight ? "#d8b66a" : "#7d4824";
        }
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, go.tilePx, go.tilePx);

        // Subtle inner stroke
        ctx.strokeStyle = "rgba(0,0,0,.10)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, go.tilePx - 1, go.tilePx - 1);

        // Scholar ring overlay — boosted opacity + blur for mobile dark schemes
        if (idx === state.scholarSq) {
          ctx.save();
          ctx.strokeStyle = "rgba(245, 196, 81, 1)";
          ctx.lineWidth = 3;
          ctx.shadowColor = "rgba(245, 196, 81, 1)";
          ctx.shadowBlur = 20;
          ctx.strokeRect(x + 4, y + 4, go.tilePx - 8, go.tilePx - 8);
          ctx.restore();
          // Tiny "S" — higher contrast
          ctx.save();
          ctx.fillStyle = "rgba(255, 248, 200, .85)";
          ctx.font = "bold 10px 'JetBrains Mono', monospace";
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          ctx.fillText("S", x + go.tilePx - 4, y + go.tilePx - 4);
          ctx.restore();
        }
      }
    }

    // Selected square + legal moves
    if (state.selected >= 0) {
      var f0 = fileOf(state.selected), r0 = rankOf(state.selected);
      var x0 = go.ox + f0 * go.tilePx, y0 = go.oy + r0 * go.tilePx;
      ctx.save();
      ctx.fillStyle = "rgba(93, 224, 240, .25)";
      ctx.fillRect(x0, y0, go.tilePx, go.tilePx);
      ctx.strokeStyle = "rgba(93, 224, 240, .8)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x0 + 1.5, y0 + 1.5, go.tilePx - 3, go.tilePx - 3);
      ctx.restore();
      // Legal target dots / capture rings
      for (var i = 0; i < state.legalForSelected.length; i++) {
        var to = state.legalForSelected[i].to;
        var tf = fileOf(to), tr = rankOf(to);
        var tx = go.ox + tf * go.tilePx + go.tilePx / 2;
        var ty = go.oy + tr * go.tilePx + go.tilePx / 2;
        ctx.save();
        if (state.legalForSelected[i].captured) {
          // Capture indicator: ring
          ctx.strokeStyle = "rgba(240, 72, 96, .85)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(tx, ty, go.tilePx * 0.42, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Move indicator: dot
          ctx.fillStyle = "rgba(77, 212, 155, .65)";
          ctx.beginPath();
          ctx.arc(tx, ty, go.tilePx * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Hint / best-move indicator
    if (state.hintMove && (state.bestMoveTurnsLeft > 0 || state.hintMove)) {
      var hf0 = fileOf(state.hintMove.from), hr0 = rankOf(state.hintMove.from);
      var hf1 = fileOf(state.hintMove.to), hr1 = rankOf(state.hintMove.to);
      var hx0 = go.ox + hf0 * go.tilePx + go.tilePx / 2;
      var hy0 = go.oy + hr0 * go.tilePx + go.tilePx / 2;
      var hx1 = go.ox + hf1 * go.tilePx + go.tilePx / 2;
      var hy1 = go.oy + hr1 * go.tilePx + go.tilePx / 2;
      ctx.save();
      ctx.strokeStyle = "rgba(169, 145, 255, .85)";
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(hx0, hy0);
      ctx.lineTo(hx1, hy1);
      ctx.stroke();
      ctx.setLineDash([]);
      // Origin/target rings
      ctx.strokeStyle = "rgba(169, 145, 255, .9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx0, hy0, go.tilePx * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx1, hy1, go.tilePx * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Pieces
    for (var rr = 0; rr < 8; rr++) {
      for (var ff = 0; ff < 8; ff++) {
        var idx2 = idxOf(ff, rr);
        var p = b[idx2];
        if (!p) continue;
        var px = go.ox + ff * go.tilePx + go.tilePx / 2;
        var py = go.oy + rr * go.tilePx + go.tilePx / 2;
        drawPiece(p, px, py, go.tilePx);
      }
    }

    // Check indicator
    var sideToHi = state.pos.turn;
    if (isInCheck(state.pos, sideToHi)) {
      var ki = findKing(state.pos, sideToHi);
      if (ki >= 0) {
        var kf = fileOf(ki), kr = rankOf(ki);
        var kx = go.ox + kf * go.tilePx;
        var ky = go.oy + kr * go.tilePx;
        ctx.save();
        ctx.strokeStyle = "rgba(240, 72, 96, .9)";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(240, 72, 96, .8)";
        ctx.shadowBlur = 16;
        ctx.strokeRect(kx + 2, ky + 2, go.tilePx - 4, go.tilePx - 4);
        ctx.restore();
      }
    }
  }

  function drawPiece(p, x, y, size) {
    var glyph = GLYPHS[p];
    if (!glyph) return;
    var isW = isWhite(p);
    ctx.save();
    ctx.font = "bold " + Math.floor(size * 0.85) + "px 'Fraunces', 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Drop shadow
    ctx.shadowColor = "rgba(0, 0, 0, .55)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    if (isW) {
      // White piece — render filled white-ish glyph plus a dark outline
      ctx.fillStyle = "#fff8e0";
      ctx.fillText(glyph, x, y);
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(20, 16, 8, .6)";
      ctx.lineWidth = 1.5;
      ctx.strokeText(glyph, x, y);
    } else {
      ctx.fillStyle = "#1c1208";
      ctx.fillText(glyph, x, y);
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(245, 196, 81, .25)";
      ctx.lineWidth = 0.8;
      ctx.strokeText(glyph, x, y);
    }
    ctx.restore();
  }

  function drawCoords() {
    var go = boardOrigin();
    ctx.save();
    ctx.fillStyle = "rgba(184, 167, 128, .85)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (var f = 0; f < 8; f++) {
      ctx.fillText("abcdefgh".charAt(f), go.ox + f * go.tilePx + go.tilePx / 2, go.oy + 8 * go.tilePx + 6);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (var r = 0; r < 8; r++) {
      ctx.fillText(String(8 - r), go.ox - 8, go.oy + r * go.tilePx + go.tilePx / 2);
    }
    ctx.restore();
  }

  function drawSidePanels() {
    // Right panel: captured pieces by player
    var go = boardOrigin();
    var rx = go.ox + 8 * go.tilePx + 18;
    // Need at least 80 logical px for the panel to be readable
    if (rx > LOGICAL_W - 80) return;  // not enough room — skip
    ctx.save();
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(184, 167, 128, .8)";
    ctx.textAlign = "left";
    ctx.fillText("Captured", rx, go.oy + 4);
    ctx.font = "20px 'Fraunces', serif";
    var ry = go.oy + 22;
    var capList = [];
    // Tally by piece type
    var counts = { q: 0, r: 0, b: 0, n: 0, p: 0 };
    for (var i = 0; i < state.moveHistory.length; i++) {
      var h = state.moveHistory[i];
      if (h.side === WHITE && h.move.captured && isBlack(h.move.captured)) {
        var pt = h.move.captured.toLowerCase();
        if (counts[pt] != null) counts[pt] += 1;
      }
    }
    var lineY = ry;
    ["q", "r", "b", "n", "p"].forEach(function (pt) {
      if (counts[pt] > 0) {
        ctx.fillStyle = "#1c1208";
        ctx.fillText(GLYPHS[pt] + " x" + counts[pt], rx, lineY);
        ctx.fillStyle = "rgba(184, 167, 128, .8)";
        lineY += 22;
      }
    });
    // Lost panel
    var lostY = lineY + 12;
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(240, 72, 96, .75)";
    ctx.fillText("Lost", rx, lostY);
    var lostCounts = { Q: 0, R: 0, B: 0, N: 0, P: 0 };
    for (var j = 0; j < state.moveHistory.length; j++) {
      var hj = state.moveHistory[j];
      if (hj.side === BLACK && hj.move.captured && isWhite(hj.move.captured)) {
        var ptW = hj.move.captured.toUpperCase();
        if (lostCounts[ptW] != null) lostCounts[ptW] += 1;
      }
    }
    var lostLineY = lostY + 18;
    ctx.font = "20px 'Fraunces', serif";
    ["Q", "R", "B", "N", "P"].forEach(function (pt) {
      if (lostCounts[pt] > 0) {
        ctx.fillStyle = "#fff8e0";
        ctx.fillText(GLYPHS[pt] + " x" + lostCounts[pt], rx, lostLineY);
        lostLineY += 22;
      }
    });
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

  // ==========================================================================
  //  HUD
  // ==========================================================================
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = state.lives;
    if (dom.hudMatch) dom.hudMatch.textContent = state.matchNum;
    if (dom.hudWins) dom.hudWins.textContent = state.wins + "W " + state.losses + "L";
    if (dom.hudBest) dom.hudBest.textContent = state.best ? formatNumber(state.best) : "—";
    if (dom.goalMeta) {
      var meta;
      if (phase === "aiThinking") meta = "AI thinking…";
      else if (state.pos.turn === WHITE) meta = "White (you) to move";
      else meta = "Black (AI) to move";
      meta += " · undos " + state.undoCount + " · hints " + state.hintCount;
      if (state.shieldArmed) meta += " · SHIELD";
      if (state.bestMoveTurnsLeft > 0) meta += " · INDICATOR x" + state.bestMoveTurnsLeft;
      dom.goalMeta.textContent = meta;
    }
  }

  // ==========================================================================
  //  Popups
  // ==========================================================================
  function pushPopup(text, x, y, cls) {
    if (!dom.popupOverlay) return;
    var el = document.createElement("div");
    el.className = "popup-text" + (cls ? " " + cls : "");
    el.textContent = text;
    var rect = canvas.getBoundingClientRect();
    var px = (x * scale) + offsetX;
    var py = (y * scale) + offsetY;
    el.style.left = px + "px";
    el.style.top = py + "px";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1200);
  }

  // ==========================================================================
  //  Hub integration
  // ==========================================================================
  function addShards(n) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, GAME_ID + "-scholar-correct");
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          wins: state.wins,
          tier: state.tier
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
          matchNum: state.matchNum,
          wins: state.wins,
          losses: state.losses,
          tier: state.tier,
          ts: Date.now()
        });
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
          file: "games/chess-cabinet/index.html"
        };
        if (extra && typeof extra === "object") {
          if (extra.score != null) payload.score = extra.score;
          if (extra.durationMs != null) payload.durationMs = extra.durationMs;
        }
        window.MrMacsProfile.recordPlay(payload);
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("chess-cabinet:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("chess-cabinet:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // ==========================================================================
  //  Music
  // ==========================================================================
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("duel-arena", { volume: 0.5 });
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

  // ==========================================================================
  //  Resize / scaling
  // ==========================================================================
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

  // ==========================================================================
  //  Helpers
  // ==========================================================================
  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function tick() {
    if (state && (phase === "playing" || phase === "aiThinking")) {
      drawAll();
    }
    rafHandle = window.requestAnimationFrame(tick);
  }

  // ==========================================================================
  //  Buttons
  // ==========================================================================
  function bindButtons() {
    if (dom.startBtn) dom.startBtn.addEventListener("click", function () {
      initState();
      setTier(state.tier);  // sync UI -> state default
      // Re-read difficulty from any active button
      var active = document.querySelector(".diff-btn.is-active");
      if (active) state.tier = active.getAttribute("data-diff") || "normal";
      setTier(state.tier);
      startNewMatch(true);
      startMusic();
      showScreen(null);
      recordPlayWithProfile();
    });
    if (dom.soundBtn) dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) stopMusic();
      else if (state && phase !== "setup") startMusic();
    });
    if (dom.fullscreenBtn) dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      } catch (e) {}
    });
    [dom.diffEasy, dom.diffNormal, dom.diffHard, dom.diffExpert].forEach(function (b) {
      if (!b) return;
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-diff");
        if (state) state.tier = t;
        // Update UI visually even before starting
        document.querySelectorAll(".diff-btn").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
      });
    });
    if (dom.resumeBtn) dom.resumeBtn.addEventListener("click", togglePause);
    if (dom.restartBtn) dom.restartBtn.addEventListener("click", function () {
      initState();
      var active = document.querySelector(".diff-btn.is-active");
      if (active) state.tier = active.getAttribute("data-diff") || "normal";
      setTier(state.tier);
      startNewMatch(true);
      showScreen(null);
    });
    if (dom.pauseExitBtn) dom.pauseExitBtn.addEventListener("click", function () {
      stopMusic();
      try { window.location.href = "../../index.html"; } catch (e) {}
    });
    if (dom.exitBtn) dom.exitBtn.addEventListener("click", function () {
      stopMusic();
      try { window.location.href = "../../index.html"; } catch (e) {}
    });
    if (dom.pauseBtn) dom.pauseBtn.addEventListener("click", togglePause);
    if (dom.undoBtn) dom.undoBtn.addEventListener("click", tryUndo);
    if (dom.resignBtn) dom.resignBtn.addEventListener("click", resignMatch);
    if (dom.setupBtn) dom.setupBtn.addEventListener("click", function () {
      showScreen("setup");
    });
    if (dom.againBtn) dom.againBtn.addEventListener("click", function () {
      initState();
      var active = document.querySelector(".diff-btn.is-active");
      if (active) state.tier = active.getAttribute("data-diff") || "normal";
      setTier(state.tier);
      startNewMatch(true);
      startMusic();
      showScreen(null);
    });
    if (dom.questionCloseBtn) dom.questionCloseBtn.addEventListener("click", skipQuestion);
  }

  // ==========================================================================
  //  Boot
  // ==========================================================================
  function boot() {
    setupDom();
    bindInput();
    bindButtons();
    // Default state for setup-screen drawing
    initState();
    setTier("normal");
    resize();
    window.addEventListener("resize", function () { resize(); drawAll(); });
    drawAll();
    updateHud();
    showScreen("setup");
    rafHandle = window.requestAnimationFrame(tick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
