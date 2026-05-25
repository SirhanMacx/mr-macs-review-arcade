(function () {
  "use strict";

  var GAME_ID = "block-blast";
  var GAME_TITLE = "Block Blast Academy";
  var SIZE = 9;
  var QUESTION_INTERVAL = 3;
  var SHARDS_CAP = 70;
  var COLORS = ["#45d8ff", "#ffc857", "#72e28a", "#ff6f61", "#a98cff", "#4ecdc4", "#ff9f43"];
  var TOPICS = [
    "Global History",
    "U.S. History",
    "Civics",
    "Economics",
    "Geography",
    "Science",
    "ELA Evidence"
  ];

  var SHAPES = [
    { name: "Flashcard", cells: [[0,0]] },
    { name: "Pair Notes", cells: [[0,0],[0,1]] },
    { name: "Three Terms", cells: [[0,0],[0,1],[0,2]] },
    { name: "Study Column", cells: [[0,0],[1,0],[2,0]] },
    { name: "Quiz Square", cells: [[0,0],[0,1],[1,0],[1,1]] },
    { name: "Evidence L", cells: [[0,0],[1,0],[2,0],[2,1]] },
    { name: "Source Corner", cells: [[0,1],[1,1],[2,1],[2,0]] },
    { name: "Cause Stack", cells: [[0,0],[1,0],[1,1],[2,1]] },
    { name: "Effect Stack", cells: [[0,1],[1,1],[1,0],[2,0]] },
    { name: "Concept T", cells: [[0,0],[0,1],[0,2],[1,1]] },
    { name: "Review Plus", cells: [[0,1],[1,0],[1,1],[1,2],[2,1]] },
    { name: "Timeline Five", cells: [[0,0],[0,1],[0,2],[0,3],[0,4]] },
    { name: "Map Five", cells: [[0,0],[1,0],[2,0],[3,0],[4,0]] }
  ];

  var FALLBACK_QUESTIONS = [
    {
      prompt: "Which river valley civilization developed along the Nile River?",
      choices: ["Ancient Egypt", "Indus Valley", "Shang China", "Mesopotamia"],
      correctText: "Ancient Egypt",
      explanation: "Ancient Egypt grew along the Nile River."
    },
    {
      prompt: "In a democracy, the rule of law means that:",
      choices: ["leaders and citizens are accountable to laws", "only judges can make laws", "the military controls elections", "taxes are optional"],
      correctText: "leaders and citizens are accountable to laws",
      explanation: "Rule of law means no person is above the law."
    },
    {
      prompt: "What was one major cause of the Industrial Revolution beginning in Great Britain?",
      choices: ["access to coal and iron", "the fall of Constantinople", "the end of all trade", "the invention of paper money"],
      correctText: "access to coal and iron",
      explanation: "Coal, iron, capital, labor, and markets helped Britain industrialize early."
    },
    {
      prompt: "Which amendment protects freedom of speech, religion, press, assembly, and petition in the United States?",
      choices: ["First Amendment", "Fifth Amendment", "Tenth Amendment", "Fourteenth Amendment"],
      correctText: "First Amendment",
      explanation: "The First Amendment protects those five core freedoms."
    },
    {
      prompt: "A primary source is best described as:",
      choices: ["evidence created during the time being studied", "a textbook chapter written later", "a modern encyclopedia article", "a teacher's summary"],
      correctText: "evidence created during the time being studied",
      explanation: "Primary sources come directly from the period or event."
    },
    {
      prompt: "Which economic term means there are limited resources but unlimited wants?",
      choices: ["scarcity", "inflation", "tariff", "monopoly"],
      correctText: "scarcity",
      explanation: "Scarcity is the basic economic problem of limited resources."
    },
    {
      prompt: "What does latitude measure?",
      choices: ["distance north or south of the Equator", "distance east or west of the Prime Meridian", "height above sea level", "population density"],
      correctText: "distance north or south of the Equator",
      explanation: "Latitude lines run east-west and measure north/south position."
    },
    {
      prompt: "Which Enlightenment idea most directly influenced constitutional government?",
      choices: ["consent of the governed", "divine right monarchy", "mercantilist trade control", "feudal obligation"],
      correctText: "consent of the governed",
      explanation: "Consent of the governed supports representative constitutional government."
    },
    {
      prompt: "In an argument paragraph, evidence should:",
      choices: ["support the claim with specific information", "replace the claim entirely", "avoid the source", "only repeat the prompt"],
      correctText: "support the claim with specific information",
      explanation: "Evidence proves or strengthens the claim."
    },
    {
      prompt: "What is one feature of a command economy?",
      choices: ["government planners make major production decisions", "prices are set only by supply and demand", "all businesses are privately owned", "trade is never regulated"],
      correctText: "government planners make major production decisions",
      explanation: "In command economies, government planning directs production."
    }
  ];

  var dom = {};
  var phase = "setup";
  var state = null;
  var selectedIndex = 0;
  var hoverCell = null;
  var armedBoost = null;
  var activeQuestion = null;
  var soundOn = true;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function init() {
    cacheDom();
    renderLeaderboard();
    resetPreviewBoard();
    bindInput();
    registerHelp();
    ensureQuestionBank();
    showScreen("setup");
  }

  function cacheDom() {
    [
      "board", "pieceTray", "statusStrip", "topicCard", "setupScreen", "questionScreen", "pauseScreen", "endScreen",
      "startBtn", "soundBtn", "fullscreenBtn", "pauseBtn", "exitBtn", "resumeBtn", "restartBtn", "pauseExitBtn",
      "setupBtn", "againBtn", "questionCloseBtn", "questionMeta", "questionPrompt", "choiceGrid", "explanation",
      "hudScore", "hudClears", "hudStreak", "hudBest", "bombBtn", "rowBtn", "shuffleBtn", "bombCount", "rowCount",
      "shuffleCount", "nextQuestion", "leaderboardPanel", "endLeaderboard", "endGrid", "endKicker", "endTitle"
    ].forEach(function (id) {
      dom[id] = document.getElementById(id);
    });
  }

  function newState() {
    return {
      grid: emptyGrid(),
      tray: [],
      score: 0,
      clears: 0,
      placements: 0,
      correct: 0,
      answered: 0,
      streak: 1,
      bestStreak: 1,
      boosts: { bomb: 0, row: 0, shuffle: 1 },
      shardsAwarded: 0
    };
  }

  function emptyGrid() {
    var grid = [];
    for (var i = 0; i < SIZE * SIZE; i++) grid.push(null);
    return grid;
  }

  function startGame() {
    state = newState();
    selectedIndex = 0;
    hoverCell = null;
    armedBoost = null;
    refillTray();
    phase = "playing";
    showScreen(null);
    updateHud();
    renderAll();
    recordPlay();
    startMusic();
    setStatus("Pick a block, then tap the board.");
    try {
      if (window.MrMacsEndRecap && window.MrMacsEndRecap.startTracking) {
        window.MrMacsEndRecap.startTracking(GAME_ID, GAME_TITLE);
      }
    } catch (e) {}
  }

  function resetPreviewBoard() {
    state = newState();
    state.tray = [
      makePiece(SHAPES[9], 0),
      makePiece(SHAPES[4], 1),
      makePiece(SHAPES[6], 2)
    ];
    renderAll();
    state = null;
  }

  function makePiece(shape, colorIndex) {
    var topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    return {
      id: Math.random().toString(36).slice(2),
      name: shape.name,
      cells: shape.cells.map(function (cell) { return [cell[0], cell[1]]; }),
      color: COLORS[colorIndex == null ? Math.floor(Math.random() * COLORS.length) : colorIndex % COLORS.length],
      topic: topic
    };
  }

  function randomPiece() {
    var shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return makePiece(shape);
  }

  function refillTray() {
    state.tray = [randomPiece(), randomPiece(), randomPiece()];
    selectedIndex = firstAvailablePieceIndex();
  }

  function firstAvailablePieceIndex() {
    if (!state) return 0;
    for (var i = 0; i < state.tray.length; i++) {
      if (state.tray[i]) return i;
    }
    return -1;
  }

  function placeSelectedAt(r, c) {
    if (phase !== "playing" || !state) return;
    if (armedBoost === "bomb") {
      useBombAt(r, c);
      return;
    }
    var piece = state.tray[selectedIndex];
    if (!piece) {
      setStatus("Select a block from the tray first.");
      selectedIndex = firstAvailablePieceIndex();
      renderTray();
      return;
    }
    if (!canPlace(piece, r, c)) {
      setStatus("That block does not fit there.");
      playSfx("wrong");
      flashInvalid(r, c);
      return;
    }
    piece.cells.forEach(function (cell) {
      state.grid[indexOf(r + cell[0], c + cell[1])] = {
        color: piece.color,
        topic: piece.topic
      };
    });
    state.placements += 1;
    state.score += piece.cells.length * 18 * state.streak;
    state.tray[selectedIndex] = null;
    playSfx("place");
    var cleared = clearLines();
    if (state.tray.every(function (p) { return !p; })) refillTray();
    selectedIndex = firstAvailablePieceIndex();
    if (!cleared && state.placements % QUESTION_INTERVAL === 0) {
      openQuestion("Study Boost - " + placementsUntilQuestionText());
    }
    renderAll();
    maybeEndRun();
  }

  function canPlace(piece, r, c) {
    if (!piece) return false;
    for (var i = 0; i < piece.cells.length; i++) {
      var rr = r + piece.cells[i][0];
      var cc = c + piece.cells[i][1];
      if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) return false;
      if (state.grid[indexOf(rr, cc)]) return false;
    }
    return true;
  }

  function hasAnyMove() {
    if (!state) return false;
    for (var p = 0; p < state.tray.length; p++) {
      var piece = state.tray[p];
      if (!piece) continue;
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (canPlace(piece, r, c)) return true;
        }
      }
    }
    return false;
  }

  function clearLines() {
    var rows = [];
    var cols = [];
    for (var r = 0; r < SIZE; r++) {
      var fullRow = true;
      for (var c = 0; c < SIZE; c++) {
        if (!state.grid[indexOf(r, c)]) { fullRow = false; break; }
      }
      if (fullRow) rows.push(r);
    }
    for (var col = 0; col < SIZE; col++) {
      var fullCol = true;
      for (var rr = 0; rr < SIZE; rr++) {
        if (!state.grid[indexOf(rr, col)]) { fullCol = false; break; }
      }
      if (fullCol) cols.push(col);
    }
    if (!rows.length && !cols.length) {
      state.streak = 1;
      return false;
    }
    var clearedCells = {};
    rows.forEach(function (row) {
      for (var c = 0; c < SIZE; c++) clearedCells[indexOf(row, c)] = true;
    });
    cols.forEach(function (col) {
      for (var r = 0; r < SIZE; r++) clearedCells[indexOf(r, col)] = true;
    });
    Object.keys(clearedCells).forEach(function (key) {
      state.grid[parseInt(key, 10)] = null;
    });
    var lines = rows.length + cols.length;
    var cellCount = Object.keys(clearedCells).length;
    state.clears += lines;
    state.streak = Math.min(9, state.streak + lines);
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.score += (lines * 320 + cellCount * 22) * state.streak;
    playSfx(lines >= 2 ? "power" : "clear");
    setStatus(lines + " line" + (lines === 1 ? "" : "s") + " cleared. Streak x" + state.streak + ".");
    if (lines >= 2 || state.placements % QUESTION_INTERVAL === 0) {
      openQuestion("Study Boost - " + lines + " clear combo");
    }
    return true;
  }

  function useBombAt(r, c) {
    if (!state.boosts.bomb) {
      armedBoost = null;
      return;
    }
    var cleared = 0;
    for (var rr = r - 1; rr <= r + 1; rr++) {
      for (var cc = c - 1; cc <= c + 1; cc++) {
        if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) continue;
        var idx = indexOf(rr, cc);
        if (state.grid[idx]) {
          state.grid[idx] = null;
          cleared += 1;
        }
      }
    }
    state.boosts.bomb -= 1;
    armedBoost = null;
    if (cleared) {
      state.score += cleared * 35 * state.streak;
      setStatus("Eraser burst cleared " + cleared + " blocks.");
      playSfx("power");
    } else {
      setStatus("Eraser used on an empty patch.");
      playSfx("wrong");
    }
    renderAll();
    maybeEndRun();
  }

  function useBestLineClear() {
    if (phase !== "playing" || !state || state.boosts.row <= 0) return;
    var best = { type: "row", value: 0, filled: -1 };
    for (var r = 0; r < SIZE; r++) {
      var rowFill = 0;
      for (var c = 0; c < SIZE; c++) if (state.grid[indexOf(r, c)]) rowFill += 1;
      if (rowFill > best.filled) best = { type: "row", value: r, filled: rowFill };
    }
    for (var col = 0; col < SIZE; col++) {
      var colFill = 0;
      for (var rr = 0; rr < SIZE; rr++) if (state.grid[indexOf(rr, col)]) colFill += 1;
      if (colFill > best.filled) best = { type: "col", value: col, filled: colFill };
    }
    if (best.filled <= 0) {
      setStatus("Line clear saved for later. The board is empty.");
      renderAll();
      return;
    }
    state.boosts.row -= 1;
    if (best.type === "row") {
      for (var c2 = 0; c2 < SIZE; c2++) state.grid[indexOf(best.value, c2)] = null;
    } else {
      for (var r2 = 0; r2 < SIZE; r2++) state.grid[indexOf(r2, best.value)] = null;
    }
    state.score += best.filled * 45 * state.streak;
    state.clears += 1;
    setStatus("Line clear removed the most crowded " + best.type + ".");
    playSfx("power");
    renderAll();
    maybeEndRun();
  }

  function refreshTray() {
    if (phase !== "playing" || !state || state.boosts.shuffle <= 0) return;
    state.boosts.shuffle -= 1;
    refillTray();
    setStatus("Tray refreshed. New blocks ready.");
    playSfx("move");
    renderAll();
    maybeEndRun();
  }

  function maybeEndRun() {
    if (phase !== "playing" || !state) return;
    if (hasAnyMove()) {
      updateQuestionCountdown();
      return;
    }
    endRun();
  }

  function endRun() {
    phase = "ended";
    writeBest(Math.max(readBest(), state.score));
    submitLeaderboard();
    recordCompletion();
    addShards(Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 180)));
    renderEnd();
    stopMusic();
    showScreen("end");
  }

  function openQuestion(meta) {
    if (phase !== "playing" || !state) return;
    activeQuestion = pickQuestion();
    if (!activeQuestion) return;
    phase = "question";
    pauseMusic();
    if (dom.questionMeta) dom.questionMeta.textContent = meta || "Study Boost";
    renderQuestion();
    showScreen("question");
  }

  function pickQuestion() {
    try {
      var due = window.MrMacsReviewMix && window.MrMacsReviewMix.maybeDue && window.MrMacsReviewMix.maybeDue();
      if (due) return normalizeQuestion(due);
    } catch (e) {}
    if (window.MrMacsPickValidQuestion) {
      var valid = window.MrMacsPickValidQuestion(function () {
        return normalizeQuestion(randomBankQuestion());
      }, 18);
      if (valid) return valid;
      var fallbackValid = window.MrMacsPickValidQuestion(function () {
        return FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
      }, 10);
      if (fallbackValid) return fallbackValid;
    }
    return FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  }

  function randomBankQuestion() {
    var bank = window.DIAG_BANK_BY_COURSE || {};
    var pool = [];
    Object.keys(bank).forEach(function (course) {
      if (Array.isArray(bank[course])) pool = pool.concat(bank[course]);
    });
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function normalizeQuestion(q) {
    if (!q) return null;
    if (q.prompt && Array.isArray(q.choices) && q.correctText) {
      return {
        prompt: String(q.prompt),
        choices: q.choices.slice(0, 4).map(String),
        correctText: String(q.correctText),
        explanation: q.explanation || q.rationale || ""
      };
    }
    if (q.question && Array.isArray(q.options)) {
      var correct = null;
      if (typeof q.answer === "number" && q.options[q.answer]) correct = q.options[q.answer];
      else if (typeof q.correct === "number" && q.options[q.correct]) correct = q.options[q.correct];
      else if (q.correctText) correct = q.correctText;
      else if (q.answer && typeof q.answer === "string") correct = q.answer;
      if (!correct) return null;
      return {
        prompt: String(q.question),
        choices: q.options.slice(0, 4).map(String),
        correctText: String(correct),
        explanation: q.explanation || q.rationale || ""
      };
    }
    return null;
  }

  function renderQuestion() {
    if (!activeQuestion) return;
    dom.questionPrompt.textContent = activeQuestion.prompt;
    dom.explanation.textContent = "";
    dom.explanation.className = "explanation";
    var choices = activeQuestion.choices.slice();
    shuffle(choices);
    if (choices.indexOf(activeQuestion.correctText) < 0) choices[0] = activeQuestion.correctText;
    choices = choices.slice(0, 4);
    var letters = ["A", "B", "C", "D"];
    dom.choiceGrid.innerHTML = choices.map(function (choice, i) {
      return '<button class="choice-btn" data-text="' + escapeHtml(choice) + '">' +
        '<span class="choice-letter">' + letters[i] + '</span>' +
        '<span>' + escapeHtml(choice) + '</span>' +
        '</button>';
    }).join("");
    Array.prototype.forEach.call(dom.choiceGrid.querySelectorAll(".choice-btn"), function (btn) {
      btn.addEventListener("click", onChoice);
    });
  }

  function onChoice(e) {
    var picked = e.currentTarget.getAttribute("data-text");
    var correct = picked === activeQuestion.correctText;
    state.answered += 1;
    if (correct) state.correct += 1;
    recordAnswer(activeQuestion, correct);
    try { if (window.MrMacsReviewMix) window.MrMacsReviewMix.gradeIfResurfaced(activeQuestion, correct); } catch (err) {}
    Array.prototype.forEach.call(dom.choiceGrid.querySelectorAll(".choice-btn"), function (btn) {
      btn.disabled = true;
      if (btn.getAttribute("data-text") === activeQuestion.correctText) btn.classList.add("is-correct");
      else if (btn === e.currentTarget) btn.classList.add("is-wrong");
    });
    if (correct) {
      var boost = grantBoost();
      state.streak = Math.min(9, state.streak + 1);
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.score += 250 * state.streak;
      dom.explanation.textContent = "Correct. +" + (250 * state.streak) + " score and " + boost + " earned.";
      dom.explanation.className = "explanation is-correct";
      playSfx("correct");
      celebrate();
    } else {
      state.streak = 1;
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText + (activeQuestion.explanation ? " - " + activeQuestion.explanation : "");
      dom.explanation.className = "explanation is-wrong";
      playSfx("wrong");
    }
    setTimeout(closeQuestion, 1150);
  }

  function grantBoost() {
    var order = ["bomb", "row", "shuffle"];
    var boost = order[Math.floor(Math.random() * order.length)];
    state.boosts[boost] += 1;
    if (boost === "bomb") return "Eraser";
    if (boost === "row") return "Line Clear";
    return "Refresh";
  }

  function closeQuestion() {
    activeQuestion = null;
    phase = "playing";
    showScreen(null);
    resumeMusic();
    updateHud();
    renderAll();
    maybeEndRun();
  }

  function skipQuestion() {
    if (!activeQuestion) return;
    activeQuestion = null;
    phase = "playing";
    showScreen(null);
    resumeMusic();
    setStatus("Study boost skipped. Keep building lines.");
    renderAll();
    maybeEndRun();
  }

  function renderAll() {
    renderBoard();
    renderTray();
    updateHud();
    updateQuestionCountdown();
  }

  function renderBoard() {
    if (!dom.board || !state) return;
    var piece = selectedIndex >= 0 ? state.tray[selectedIndex] : null;
    var ghost = hoverCell && piece && phase === "playing" ? ghostMap(piece, hoverCell.r, hoverCell.c) : {};
    var invalid = hoverCell && piece && phase === "playing" && !canPlace(piece, hoverCell.r, hoverCell.c);
    var html = "";
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var idx = indexOf(r, c);
        var cell = state.grid[idx];
        var classes = ["cell"];
        if (cell) classes.push("filled");
        if (ghost[idx]) classes.push("ghost");
        if (invalid && hoverCell.r === r && hoverCell.c === c) classes.push("invalid");
        var color = cell ? cell.color : (piece ? piece.color : COLORS[0]);
        html += '<button class="' + classes.join(" ") + '" data-r="' + r + '" data-c="' + c + '" role="gridcell" aria-label="Board row ' + (r + 1) + ' column ' + (c + 1) + '" style="--block-color:' + color + ';--ghost-color:' + color + '"></button>';
      }
    }
    dom.board.innerHTML = html;
    Array.prototype.forEach.call(dom.board.querySelectorAll(".cell"), function (btn) {
      btn.addEventListener("click", function () {
        placeSelectedAt(parseInt(btn.getAttribute("data-r"), 10), parseInt(btn.getAttribute("data-c"), 10));
      });
    });
  }

  function ghostMap(piece, r, c) {
    var out = {};
    if (!piece) return out;
    piece.cells.forEach(function (cell) {
      var rr = r + cell[0];
      var cc = c + cell[1];
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) out[indexOf(rr, cc)] = true;
    });
    return out;
  }

  function renderTray() {
    if (!dom.pieceTray || !state) return;
    dom.pieceTray.innerHTML = state.tray.map(function (piece, i) {
      if (!piece) {
        return '<button class="piece-card used" type="button" disabled><div class="piece-preview"></div><span><strong class="piece-name">Placed</strong><span class="piece-topic">Tray slot used</span></span></button>';
      }
      return '<button class="piece-card ' + (i === selectedIndex ? "selected" : "") + '" type="button" data-piece="' + i + '" style="--piece-color:' + piece.color + '">' +
        '<div class="piece-preview">' + renderMiniCells(piece) + '</div>' +
        '<span><strong class="piece-name">' + escapeHtml(piece.name) + '</strong><span class="piece-topic">' + escapeHtml(piece.topic) + '</span></span>' +
        '</button>';
    }).join("");
    Array.prototype.forEach.call(dom.pieceTray.querySelectorAll(".piece-card[data-piece]"), function (btn) {
      btn.addEventListener("click", function () {
        selectedIndex = parseInt(btn.getAttribute("data-piece"), 10);
        armedBoost = null;
        var piece = state.tray[selectedIndex];
        setStatus(piece.name + " selected.");
        renderAll();
      });
    });
    var selected = state.tray[selectedIndex];
    if (dom.topicCard) {
      dom.topicCard.textContent = selected ? selected.topic + " block selected. Tap any board square where its top-left corner should land." : "Tray empty. New study blocks are loading.";
    }
  }

  function renderMiniCells(piece) {
    var cells = {};
    piece.cells.forEach(function (cell) { cells[cell[0] + "," + cell[1]] = true; });
    var html = "";
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        html += '<span class="mini-cell ' + (cells[r + "," + c] ? "on" : "") + '"></span>';
      }
    }
    return html;
  }

  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudClears) dom.hudClears.textContent = String(state.clears);
    if (dom.hudStreak) dom.hudStreak.textContent = "x" + state.streak;
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(readBest(), state.score));
    if (dom.bombCount) dom.bombCount.textContent = state.boosts.bomb;
    if (dom.rowCount) dom.rowCount.textContent = state.boosts.row;
    if (dom.shuffleCount) dom.shuffleCount.textContent = state.boosts.shuffle;
    if (dom.bombBtn) dom.bombBtn.disabled = state.boosts.bomb <= 0 || phase !== "playing";
    if (dom.rowBtn) dom.rowBtn.disabled = state.boosts.row <= 0 || phase !== "playing";
    if (dom.shuffleBtn) dom.shuffleBtn.disabled = state.boosts.shuffle <= 0 || phase !== "playing";
  }

  function updateQuestionCountdown() {
    if (!dom.nextQuestion || !state) return;
    var left = QUESTION_INTERVAL - (state.placements % QUESTION_INTERVAL);
    if (left === QUESTION_INTERVAL) left = QUESTION_INTERVAL;
    dom.nextQuestion.textContent = "Study Boost in " + left + " placement" + (left === 1 ? "" : "s");
  }

  function renderEnd() {
    if (!state || !dom.endGrid) return;
    dom.endGrid.innerHTML = [
      endCell("Score", formatNumber(state.score)),
      endCell("Line Clears", state.clears),
      endCell("Best Streak", "x" + state.bestStreak),
      endCell("Questions", state.correct + "/" + state.answered),
      endCell("Blocks Placed", state.placements),
      endCell("Best", formatNumber(readBest()))
    ].join("");
    renderLeaderboard(dom.endLeaderboard);
  }

  function endCell(label, value) {
    return '<div class="end-cell"><div class="end-cell-label">' + escapeHtml(label) + '</div><div class="end-cell-value">' + escapeHtml(value) + '</div></div>';
  }

  function renderLeaderboard(target) {
    var panel = target || dom.leaderboardPanel;
    if (!panel) return;
    var rows = [];
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.top) rows = window.MrMacsLeaderboards.top(GAME_ID, 5) || [];
    } catch (e) { rows = []; }
    if (!rows.length) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    panel.innerHTML = '<strong>Leaderboard</strong><ol>' + rows.map(function (row) {
      var name = row.name || row.player || "Player";
      var score = row.score || 0;
      return '<li>' + escapeHtml(name) + ' - ' + formatNumber(score) + '</li>';
    }).join("") + '</ol>';
  }

  function pauseGame() {
    if (phase !== "playing") return;
    phase = "paused";
    pauseMusic();
    showScreen("pause");
  }

  function resumeGame() {
    if (phase !== "paused") return;
    phase = "playing";
    showScreen(null);
    resumeMusic();
  }

  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
  }

  function bindInput() {
    if (dom.startBtn) dom.startBtn.addEventListener("click", startGame);
    if (dom.againBtn) dom.againBtn.addEventListener("click", startGame);
    if (dom.setupBtn) dom.setupBtn.addEventListener("click", function () { phase = "setup"; showScreen("setup"); renderLeaderboard(); });
    if (dom.pauseBtn) dom.pauseBtn.addEventListener("click", pauseGame);
    if (dom.resumeBtn) dom.resumeBtn.addEventListener("click", resumeGame);
    if (dom.restartBtn) dom.restartBtn.addEventListener("click", startGame);
    if (dom.questionCloseBtn) dom.questionCloseBtn.addEventListener("click", skipQuestion);
    if (dom.exitBtn) dom.exitBtn.addEventListener("click", function () { window.location.href = "../../index.html"; });
    if (dom.pauseExitBtn) dom.pauseExitBtn.addEventListener("click", function () { window.location.href = "../../index.html"; });
    if (dom.soundBtn) dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) stopMusic();
      else if (phase === "playing") startMusic();
    });
    if (dom.fullscreenBtn) dom.fullscreenBtn.addEventListener("click", function () {
      var root = document.documentElement;
      if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(function () {});
      else if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
    });
    if (dom.bombBtn) dom.bombBtn.addEventListener("click", function () {
      if (!state || state.boosts.bomb <= 0) return;
      armedBoost = armedBoost === "bomb" ? null : "bomb";
      setStatus(armedBoost ? "Eraser armed. Tap a 3x3 area to clear." : "Eraser canceled.");
    });
    if (dom.rowBtn) dom.rowBtn.addEventListener("click", useBestLineClear);
    if (dom.shuffleBtn) dom.shuffleBtn.addEventListener("click", refreshTray);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key.toLowerCase() === "p") {
        if (phase === "playing") pauseGame();
        else if (phase === "paused") resumeGame();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
        return;
      }
      if (phase !== "playing" || !state) return;
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        var idx = parseInt(e.key, 10) - 1;
        if (state.tray[idx]) {
          selectedIndex = idx;
          armedBoost = null;
          renderAll();
        }
        return;
      }
      var key = e.key.toLowerCase();
      if (key === "b") {
        if (state.boosts.bomb > 0) {
          armedBoost = armedBoost === "bomb" ? null : "bomb";
          setStatus(armedBoost ? "Eraser armed." : "Eraser canceled.");
        }
      } else if (key === "l") {
        useBestLineClear();
      } else if (key === "r") {
        refreshTray();
      }
    });
  }

  function ensureQuestionBank() {
    try {
      var qb = window.MrMacsQuestionBank;
      if (!qb) return;
      var loaded = false;
      if (typeof qb.isLoaded === "function") loaded = qb.isLoaded();
      else if (window.DIAG_BANK_BY_COURSE) loaded = true;
      if (loaded) return;
      if (typeof qb.preload === "function") qb.preload({ priority: false });
      else if (typeof qb.warm === "function") qb.warm();
      else if (typeof qb.load === "function") qb.load({ priority: false }).catch(function () {});
    } catch (e) {}
  }

  function registerHelp() {
    try {
      if (!window.MrMacsHelpOverlay) return;
      window.MrMacsHelpOverlay.register(GAME_ID, {
        title: GAME_TITLE,
        subtitle: "A school trivia block puzzle.",
        goal: "Place all three tray blocks onto the 9x9 board. Clear full rows or columns for score.",
        controls: [
          "Tap a tray block, then tap the board to place its top-left corner.",
          "Answer Study Boost questions to earn erasers, line clears, and tray refreshes.",
          "Use number keys 1-3 to select blocks, B for eraser, L for line clear, and R for refresh."
        ],
        scoring: [
          "Bigger pieces, line clears, and streaks increase score.",
          "Correct course-content answers add score and power-ups.",
          "The run ends when none of the remaining blocks fit."
        ]
      });
      window.MrMacsHelpOverlay.mountButton("#setupScreen .setup-actions", GAME_ID);
    } catch (e) {}
  }

  function recordPlay() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/block-blast/index.html"
        });
      }
    } catch (e) {}
  }

  function recordAnswer(q, correct) {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordAnswer) {
        window.MrMacsProfile.recordAnswer({
          gameId: GAME_ID,
          course: q.course || "All Courses",
          set: q.set || q.unit || "Block Blast Academy",
          prompt: q.prompt,
          answer: q.correctText,
          correct: !!correct
        });
      }
    } catch (e) {}
  }

  function recordCompletion() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordCompletion) {
        window.MrMacsProfile.recordCompletion(GAME_ID, state.score);
      }
    } catch (e) {}
  }

  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          clears: state.clears,
          streak: state.bestStreak,
          correct: state.correct,
          answered: state.answered
        });
      }
    } catch (e) {}
  }

  function addShards(n) {
    if (!n || n <= 0) return;
    try {
      state.shardsAwarded += n;
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(n, GAME_ID);
      }
    } catch (e) {}
  }

  function startMusic() {
    if (!soundOn) return;
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) window.MrMacsArcadeMusic.start("puzzle-focus", { volume: 0.42 }); } catch (e) {}
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

  function playSfx(type) {
    try {
      if (!window.MrMacsSfx) return;
      if (type === "correct" && window.MrMacsSfx.correct) window.MrMacsSfx.correct();
      else if (type === "wrong" && window.MrMacsSfx.wrong) window.MrMacsSfx.wrong();
      else if (type === "power" && window.MrMacsSfx.powerupCorrect) window.MrMacsSfx.powerupCorrect();
      else if (window.MrMacsSfx.blip) window.MrMacsSfx.blip();
    } catch (e) {}
  }

  function celebrate() {
    if (reducedMotion) return;
    try {
      if (window.MrMacsCelebration && window.MrMacsCelebration.burst) {
        window.MrMacsCelebration.burst({ count: 24, palette: COLORS });
      }
    } catch (e) {}
  }

  function setStatus(msg) {
    if (dom.statusStrip) dom.statusStrip.textContent = msg;
  }

  function flashInvalid(r, c) {
    hoverCell = { r: r, c: c };
    renderBoard();
    setTimeout(function () {
      hoverCell = null;
      renderBoard();
    }, 260);
  }

  function indexOf(r, c) {
    return r * SIZE + c;
  }

  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(GAME_ID + ":best");
      var value = raw ? parseInt(raw, 10) : 0;
      return isNaN(value) ? 0 : value;
    } catch (e) {
      return 0;
    }
  }

  function writeBest(value) {
    try {
      if (window.localStorage) window.localStorage.setItem(GAME_ID + ":best", String(value));
    } catch (e) {}
  }

  function placementsUntilQuestionText() {
    var left = QUESTION_INTERVAL - (state.placements % QUESTION_INTERVAL);
    if (left === QUESTION_INTERVAL) left = QUESTION_INTERVAL;
    return left + " placement" + (left === 1 ? "" : "s");
  }

  function formatNumber(n) {
    return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
