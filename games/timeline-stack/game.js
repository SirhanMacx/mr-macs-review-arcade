(function () {
  "use strict";

  var GAME_ID = "timeline-stack";
  var GAME_TITLE = "Timeline Stack";
  var BEST_KEY = "mr-macs-timeline-stack-best-v1";
  var MAX_YEAR = 2026;
  var MIN_YEAR = 1000;

  var HISTORY_COURSES = [
    "global-10",
    "global-9",
    "us-history",
    "us-government",
    "economics",
    "ap-world-history-modern",
    "ap-united-states-history",
    "ap-european-history",
    "ap-united-states-government-and-politics",
    "ap-human-geography",
    "grade-5",
    "grade-6",
    "grade-7",
    "grade-8"
  ];

  var FALLBACK_EVENTS = [
    { year: 1215, title: "Magna Carta limits royal power", clue: "English nobles forced King John to accept limits on monarchy.", course: "global-9", topic: "Foundations" },
    { year: 1492, title: "Columbus reaches the Caribbean", clue: "The voyage accelerated sustained contact between hemispheres.", course: "global-9", topic: "Exchange" },
    { year: 1776, title: "Declaration of Independence", clue: "American colonies announced separation from Britain.", course: "us-history", topic: "Revolution" },
    { year: 1789, title: "French Revolution begins", clue: "The Estates-General crisis led to a broader challenge to monarchy.", course: "global-10", topic: "Revolution" },
    { year: 1865, title: "Thirteenth Amendment", clue: "The United States abolished slavery after the Civil War.", course: "us-history", topic: "Civil War" },
    { year: 1914, title: "World War I begins", clue: "Alliance systems and nationalism helped turn a regional crisis into war.", course: "global-10", topic: "World War I" },
    { year: 1945, title: "United Nations founded", clue: "Nations created a new organization after World War II.", course: "global-10", topic: "Global Cooperation" },
    { year: 1949, title: "NATO formed", clue: "The alliance became a major Cold War security organization.", course: "global-10", topic: "Cold War" },
    { year: 1954, title: "Brown v. Board of Education", clue: "The Supreme Court rejected segregated public schools.", course: "us-history", topic: "Civil Rights" },
    { year: 1989, title: "Berlin Wall falls", clue: "A symbol of Cold War division came down in Europe.", course: "global-10", topic: "Cold War" }
  ];

  var dom = {};
  var state = null;

  function $(id) {
    return document.getElementById(id);
  }

  function cacheDom() {
    dom.setupScreen = $("setupScreen");
    dom.playScreen = $("playScreen");
    dom.endScreen = $("endScreen");
    dom.courseSelect = $("courseSelect");
    dom.sizeSelect = $("sizeSelect");
    dom.roundSelect = $("roundSelect");
    dom.setupStatus = $("setupStatus");
    dom.bestCard = $("bestCard");
    dom.leaderboardPanel = $("leaderboardPanel");
    dom.startBtn = $("startBtn");
    dom.restartBtn = $("restartBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");
    dom.checkBtn = $("checkBtn");
    dom.nextBtn = $("nextBtn");
    dom.stackList = $("stackList");
    dom.feedback = $("feedback");
    dom.resultGrid = $("resultGrid");
    dom.endFeedback = $("endFeedback");
    dom.endTitle = $("endTitle");
    dom.courseLabel = $("courseLabel");
    dom.roundTitle = $("roundTitle");
    dom.hudScore = $("hudScore");
    dom.hudRound = $("hudRound");
    dom.hudStreak = $("hudStreak");
    dom.hudAccuracy = $("hudAccuracy");
  }

  function createInitialState() {
    return {
      phase: "setup",
      pool: [],
      courseId: "history-mix",
      courseLabel: "History Mix",
      stackSize: 5,
      rounds: 6,
      round: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      perfects: 0,
      slotCorrect: 0,
      slotTotal: 0,
      pairCorrect: 0,
      pairTotal: 0,
      checked: false,
      current: [],
      used: Object.create(null),
      startedAt: 0,
      lastResult: null
    };
  }

  function init() {
    cacheDom();
    state = createInitialState();
    bindUi();
    populateCourses();
    refreshPool();
    renderBestCard();
    renderLeaderboard();
    updateHud();
    registerHelp();
  }

  function bindUi() {
    dom.courseSelect.addEventListener("change", function () {
      state.courseId = dom.courseSelect.value;
      refreshPool();
    });
    dom.sizeSelect.addEventListener("change", function () {
      state.stackSize = Math.max(4, Math.min(6, Number(dom.sizeSelect.value) || 5));
      refreshSetupStatus();
    });
    dom.roundSelect.addEventListener("change", function () {
      state.rounds = Math.max(4, Math.min(8, Number(dom.roundSelect.value) || 6));
      refreshSetupStatus();
    });
    dom.startBtn.addEventListener("click", startGame);
    dom.restartBtn.addEventListener("click", startGame);
    dom.checkBtn.addEventListener("click", checkStack);
    dom.nextBtn.addEventListener("click", function () {
      if (state.round >= state.rounds) endGame();
      else nextRound();
    });
    dom.setupBtn.addEventListener("click", showSetup);
    dom.againBtn.addEventListener("click", startGame);
  }

  function bank() {
    return window.DIAG_BANK_BY_COURSE || {};
  }

  function labels() {
    return window.DIAG_BANK_COURSE_LABELS || {};
  }

  function populateCourses() {
    var b = bank();
    var html = '<option value="history-mix">History Mix</option>';
    HISTORY_COURSES.forEach(function (courseId) {
      if (Array.isArray(b[courseId]) && b[courseId].length) {
        html += '<option value="' + escapeHtml(courseId) + '">' + escapeHtml(courseLabel(courseId)) + '</option>';
      }
    });
    html += '<option value="all">All Shared Bank</option>';
    dom.courseSelect.innerHTML = html;
    dom.courseSelect.value = state.courseId;
  }

  function refreshPool() {
    state.courseId = dom.courseSelect.value || "history-mix";
    state.courseLabel = state.courseId === "history-mix" ? "History Mix" :
      state.courseId === "all" ? "All Shared Bank" : courseLabel(state.courseId);
    state.pool = buildEventPool(state.courseId);
    if (state.pool.length < state.stackSize) {
      state.pool = state.pool.concat(fallbackEvents());
    }
    refreshSetupStatus();
  }

  function refreshSetupStatus() {
    state.stackSize = Math.max(4, Math.min(6, Number(dom.sizeSelect.value) || 5));
    state.rounds = Math.max(4, Math.min(8, Number(dom.roundSelect.value) || 6));
    var usable = state.pool.length;
    var uniqueYears = Object.create(null);
    state.pool.forEach(function (eventCard) { uniqueYears[eventCard.year] = true; });
    var enough = usable >= state.stackSize && Object.keys(uniqueYears).length >= state.stackSize;
    dom.startBtn.disabled = !enough;
    dom.setupStatus.textContent = enough
      ? usable + " timeline-ready cards found for " + state.courseLabel + "."
      : "Not enough date-bearing cards found yet. Try History Mix or All Shared Bank.";
  }

  function rowsForCourse(courseId) {
    var b = bank();
    if (courseId === "all") {
      return window.DIAG_BANK_ALL || concatRows(Object.keys(b), b);
    }
    if (courseId === "history-mix") {
      return concatRows(HISTORY_COURSES, b);
    }
    return Array.isArray(b[courseId]) ? b[courseId].slice() : [];
  }

  function concatRows(keys, sourceBank) {
    var out = [];
    keys.forEach(function (courseId) {
      if (Array.isArray(sourceBank[courseId])) out = out.concat(sourceBank[courseId]);
    });
    return out;
  }

  function buildEventPool(courseId) {
    var rows = rowsForCourse(courseId);
    var seen = Object.create(null);
    var events = [];
    for (var i = 0; i < rows.length; i++) {
      var eventCard = makeEventCard(rows[i], i);
      if (!eventCard) continue;
      var key = eventCard.year + "|" + eventCard.title.toLowerCase();
      if (seen[key]) continue;
      seen[key] = true;
      events.push(eventCard);
    }
    return shuffle(events);
  }

  function makeEventCard(q, index) {
    if (!q || typeof q !== "object") return null;
    if (window.MrMacsValidQuestion && !window.MrMacsValidQuestion(q)) return null;
    var year = extractYear(q);
    if (year === null) return null;
    var title = deriveTitle(q);
    if (!title) return null;
    var clue = deriveClue(q, title);
    return {
      id: String(q.id || q.assessmentSourceId || "bank") + "-" + index + "-" + year,
      year: year,
      title: title,
      clue: clue,
      course: q.course || "Review",
      topic: q.topic || q.domain || "Timeline",
      question: q
    };
  }

  function fallbackEvents() {
    return FALLBACK_EVENTS.map(function (eventCard, index) {
      return {
        id: "fallback-" + index + "-" + eventCard.year,
        year: eventCard.year,
        title: eventCard.title,
        clue: eventCard.clue,
        course: eventCard.course,
        topic: eventCard.topic,
        question: null
      };
    });
  }

  function extractYear(q) {
    var text = [
      q.prompt || "",
      q.correctText || "",
      q.topic || "",
      q.explanation || ""
    ].join(" ");
    var re = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;
    var years = [];
    var match;
    while ((match = re.exec(text)) !== null) {
      var year = Number(match[1]);
      if (year < MIN_YEAR || year > MAX_YEAR) continue;
      var after = text.slice(match.index + match[1].length, match.index + match[1].length + 8).toLowerCase();
      if (after.indexOf("bce") !== -1 || /\bbc\b/.test(after)) continue;
      years.push(year);
    }
    if (!years.length) return null;
    years.sort(function (a, b) { return a - b; });
    return years[0];
  }

  function deriveTitle(q) {
    var correct = cleanText(stripYears(q.correctText || ""));
    var prompt = cleanText(stripYears(q.prompt || ""));
    if (correct && !looksLikeYear(correct) && correct.length >= 4 && correct.length <= 78) return correct;
    if (prompt) return truncate(prompt, 78);
    return "";
  }

  function deriveClue(q, title) {
    var prompt = cleanText(stripYears(q.prompt || ""));
    var explanation = cleanText(stripYears(q.explanation || ""));
    var clue = prompt && prompt.toLowerCase() !== title.toLowerCase() ? prompt : explanation;
    if (!clue) clue = q.topic || "Review the relative order of this event.";
    return truncate(clue, 142);
  }

  function stripYears(value) {
    return String(value || "")
      .replace(/\b(1[0-9]{3}|20[0-2][0-9])\b/g, "the date")
      .replace(/\s+/g, " ");
  }

  function looksLikeYear(value) {
    return /^\s*(the date|\d{3,4})\s*$/i.test(String(value || ""));
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/[_*`]+/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
  }

  function truncate(value, max) {
    value = String(value || "").trim();
    if (value.length <= max) return value;
    return value.slice(0, Math.max(0, max - 1)).replace(/\s+\S*$/, "") + "...";
  }

  function startGame() {
    refreshPool();
    if (dom.startBtn.disabled) return;
    state.round = 0;
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.perfects = 0;
    state.slotCorrect = 0;
    state.slotTotal = 0;
    state.pairCorrect = 0;
    state.pairTotal = 0;
    state.used = Object.create(null);
    state.startedAt = Date.now();
    state.phase = "play";
    dom.setupScreen.hidden = true;
    dom.endScreen.hidden = true;
    dom.playScreen.hidden = false;
    nextRound();
    try {
      if (window.MrMacsCabinetFX && window.MrMacsCabinetFX.pulseStart) window.MrMacsCabinetFX.pulseStart();
    } catch (e) {}
  }

  function nextRound() {
    state.round += 1;
    state.checked = false;
    state.current = makeRoundStack();
    dom.nextBtn.hidden = true;
    dom.checkBtn.disabled = false;
    dom.checkBtn.hidden = false;
    dom.feedback.textContent = "Move cards until the stack runs from earliest at the top to latest at the bottom.";
    dom.courseLabel.textContent = state.courseLabel;
    dom.roundTitle.textContent = "Round " + state.round + " of " + state.rounds;
    renderStack();
    updateHud();
  }

  function makeRoundStack() {
    var chosen = [];
    var yearSeen = Object.create(null);
    var candidates = shuffle(state.pool);
    for (var i = 0; i < candidates.length; i++) {
      var eventCard = candidates[i];
      if (state.used[eventCard.id]) continue;
      if (yearSeen[eventCard.year]) continue;
      chosen.push(eventCard);
      yearSeen[eventCard.year] = true;
      state.used[eventCard.id] = true;
      if (chosen.length >= state.stackSize) break;
    }
    if (chosen.length < state.stackSize) {
      state.used = Object.create(null);
      return makeRoundStack();
    }
    chosen.sort(compareEvents);
    var shuffled = shuffle(chosen);
    if (isOrdered(shuffled) && shuffled.length > 1) {
      var first = shuffled[0];
      shuffled[0] = shuffled[1];
      shuffled[1] = first;
    }
    return shuffled;
  }

  function renderStack() {
    var correctOrder = correctStack();
    var correctSlots = Object.create(null);
    correctOrder.forEach(function (eventCard, index) {
      correctSlots[eventCard.id] = index;
    });

    dom.stackList.innerHTML = state.current.map(function (eventCard, index) {
      var lockedClass = "";
      if (state.checked) lockedClass = correctSlots[eventCard.id] === index ? " is-correct" : " is-wrong";
      var rank = state.checked ? '<span class="card-year">' + eventCard.year + '</span>' :
        '<span class="card-rank">' + (index + 1) + '</span>';
      return '<li class="stack-card' + lockedClass + '" data-id="' + escapeHtml(eventCard.id) + '">' +
        rank +
        '<div class="card-body">' +
          '<h3 class="card-title">' + escapeHtml(eventCard.title) + '</h3>' +
          '<p class="card-clue">' + escapeHtml(eventCard.clue) + '</p>' +
          '<p class="card-meta">' + escapeHtml(courseLabel(eventCard.course)) + ' / ' + escapeHtml(eventCard.topic) + '</p>' +
        '</div>' +
        '<div class="card-controls">' +
          '<button class="move-btn" type="button" data-move="up" aria-label="Move ' + escapeHtml(eventCard.title) + ' up"' + (state.checked || index === 0 ? " disabled" : "") + '>UP</button>' +
          '<button class="move-btn" type="button" data-move="down" aria-label="Move ' + escapeHtml(eventCard.title) + ' down"' + (state.checked || index === state.current.length - 1 ? " disabled" : "") + '>DN</button>' +
        '</div>' +
      '</li>';
    }).join("");

    var buttons = dom.stackList.querySelectorAll(".move-btn");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", onMoveClick);
    }
  }

  function onMoveClick(event) {
    var card = event.currentTarget.closest(".stack-card");
    if (!card || state.checked) return;
    var id = card.getAttribute("data-id");
    var direction = event.currentTarget.getAttribute("data-move");
    moveCard(id, direction === "up" ? -1 : 1);
  }

  function moveCard(id, delta) {
    var index = -1;
    for (var i = 0; i < state.current.length; i++) {
      if (state.current[i].id === id) {
        index = i;
        break;
      }
    }
    if (index < 0) return;
    var next = index + delta;
    if (next < 0 || next >= state.current.length) return;
    var card = state.current[index];
    state.current[index] = state.current[next];
    state.current[next] = card;
    renderStack();
  }

  function checkStack() {
    if (state.checked) return;
    state.checked = true;
    var correctOrder = correctStack();
    var slots = 0;
    for (var i = 0; i < state.current.length; i++) {
      if (state.current[i].id === correctOrder[i].id) slots += 1;
    }
    var pairScore = scorePairs(state.current);
    var perfect = slots === state.current.length;
    if (perfect) {
      state.streak += 1;
      state.perfects += 1;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    } else {
      state.streak = 0;
    }
    var points = Math.round((pairScore.correct / pairScore.total) * 240) + slots * 45;
    if (perfect) points += 180 + state.streak * 40;
    state.score += points;
    state.slotCorrect += slots;
    state.slotTotal += state.current.length;
    state.pairCorrect += pairScore.correct;
    state.pairTotal += pairScore.total;
    state.lastResult = { slots: slots, pairs: pairScore, perfect: perfect, points: points };

    recordAnswers(correctOrder);
    renderStack();
    renderRoundFeedback(correctOrder, points, slots, pairScore, perfect);
    dom.checkBtn.disabled = true;
    dom.nextBtn.hidden = false;
    dom.nextBtn.textContent = state.round >= state.rounds ? "See Results" : "Next Stack";
    updateHud();
  }

  function correctStack() {
    return state.current.slice().sort(compareEvents);
  }

  function compareEvents(a, b) {
    if (a.year !== b.year) return a.year - b.year;
    return a.title.localeCompare(b.title);
  }

  function isOrdered(cards) {
    for (var i = 1; i < cards.length; i++) {
      if (compareEvents(cards[i - 1], cards[i]) > 0) return false;
    }
    return true;
  }

  function scorePairs(cards) {
    var correct = 0;
    var total = 0;
    for (var i = 0; i < cards.length; i++) {
      for (var j = i + 1; j < cards.length; j++) {
        total += 1;
        if (cards[i].year < cards[j].year) correct += 1;
      }
    }
    return { correct: correct, total: total || 1 };
  }

  function recordAnswers(correctOrder) {
    var correctIndex = Object.create(null);
    correctOrder.forEach(function (eventCard, index) {
      correctIndex[eventCard.id] = index;
    });
    for (var i = 0; i < state.current.length; i++) {
      var card = state.current[i];
      var correct = correctIndex[card.id] === i;
      if (card.question && window.MrMacsReviewMix && window.MrMacsReviewMix.gradeIfResurfaced) {
        try { window.MrMacsReviewMix.gradeIfResurfaced(card.question, correct); } catch (e) {}
      }
      if (card.question && window.MrMacsProfile && window.MrMacsProfile.recordAnswer) {
        try {
          window.MrMacsProfile.recordAnswer({
            course: card.course,
            set: card.topic || "Timeline Stack",
            correct: correct,
            prompt: card.question.prompt,
            answer: String(card.year) + " - " + card.title,
            gameId: GAME_ID
          });
        } catch (e2) {}
      }
    }
  }

  function renderRoundFeedback(correctOrder, points, slots, pairScore, perfect) {
    var line = correctOrder.map(function (eventCard) {
      return eventCard.year + ": " + eventCard.title;
    }).join(" / ");
    var pairPct = Math.round((pairScore.correct / pairScore.total) * 100);
    dom.feedback.innerHTML =
      '<strong>' + (perfect ? "Perfect stack" : "Stack checked") + ': +' + formatNumber(points) + ' points.</strong> ' +
      slots + '/' + state.current.length + ' cards were in the exact slot; pair order was ' + pairPct + '%. ' +
      '<div class="correct-line">' + escapeHtml(line) + '</div>';
  }

  function endGame() {
    state.phase = "ended";
    dom.playScreen.hidden = true;
    dom.endScreen.hidden = false;
    var accuracy = state.slotTotal ? Math.round((state.slotCorrect / state.slotTotal) * 100) : 0;
    var pairAccuracy = state.pairTotal ? Math.round((state.pairCorrect / state.pairTotal) * 100) : 0;
    var best = readBest();
    var newBest = state.score > best.score;
    if (newBest) writeBest({ score: state.score, ts: Date.now(), accuracy: accuracy });
    submitScore(accuracy, pairAccuracy);
    renderLeaderboard();
    renderBestCard();

    dom.endTitle.textContent = newBest ? "New timeline record" : "Timeline archived";
    dom.resultGrid.innerHTML = [
      { label: "Score", value: formatNumber(state.score) },
      { label: "Exact Slots", value: state.slotCorrect + "/" + state.slotTotal },
      { label: "Pair Order", value: pairAccuracy + "%" },
      { label: "Perfects", value: state.perfects }
    ].map(function (item) {
      return '<div class="result-stat"><strong>' + escapeHtml(item.value) + '</strong><span>' + escapeHtml(item.label) + '</span></div>';
    }).join("");
    dom.endFeedback.textContent = "Best streak: " + state.bestStreak + ". Course: " + state.courseLabel + ". Accuracy: " + accuracy + "%.";
    updateHud();
    try {
      if (window.MrMacsCabinetFX && window.MrMacsCabinetFX.flashGameOver) window.MrMacsCabinetFX.flashGameOver();
    } catch (e) {}
  }

  function submitScore(accuracy, pairAccuracy) {
    var meta = {
      course: state.courseId,
      courseLabel: state.courseLabel,
      rounds: state.rounds,
      stackSize: state.stackSize,
      exactAccuracy: accuracy,
      pairAccuracy: pairAccuracy,
      perfects: state.perfects,
      bestStreak: state.bestStreak,
      durationMs: Date.now() - state.startedAt
    };
    var hookDispatched = false;
    try {
      var leaderboards = window.MrMacsLeaderboards;
      hookDispatched = !!(leaderboards && leaderboards.__mrMacsGlobalHook);
      if (leaderboards && leaderboards.submit) {
        leaderboards.submit(GAME_ID, state.score, meta);
      }
    } catch (e) {
      hookDispatched = false;
    }
    if (!hookDispatched) {
      dispatchScore({ gameId: GAME_ID, score: state.score, meta: meta });
    }
  }

  function dispatchScore(detail) {
    try {
      if (window.dispatchEvent && window.CustomEvent) {
        window.dispatchEvent(new window.CustomEvent("mrmacs:score-submit", { detail: detail }));
      }
    } catch (e) {}
  }

  function showSetup() {
    state.phase = "setup";
    dom.setupScreen.hidden = false;
    dom.playScreen.hidden = true;
    dom.endScreen.hidden = true;
    refreshPool();
    renderBestCard();
    renderLeaderboard();
    updateHud();
  }

  function updateHud() {
    var accuracy = state.slotTotal ? Math.round((state.slotCorrect / state.slotTotal) * 100) + "%" : "--";
    dom.hudScore.textContent = formatNumber(state.score || 0);
    dom.hudRound.textContent = state.phase === "setup" ? "0/" + state.rounds : state.round + "/" + state.rounds;
    dom.hudStreak.textContent = state.streak || 0;
    dom.hudAccuracy.textContent = accuracy;
  }

  function renderBestCard() {
    var best = readBest();
    if (!best.score) {
      dom.bestCard.hidden = true;
      return;
    }
    dom.bestCard.hidden = false;
    dom.bestCard.innerHTML = '<strong>Local best:</strong> ' + formatNumber(best.score) +
      ' points' + (best.accuracy ? ' / ' + best.accuracy + '% exact slots' : "");
  }

  function renderLeaderboard() {
    if (!dom.leaderboardPanel || !window.MrMacsLeaderboards || !window.MrMacsLeaderboards.top) {
      if (dom.leaderboardPanel) dom.leaderboardPanel.hidden = true;
      return;
    }
    var rows = [];
    try { rows = window.MrMacsLeaderboards.top(GAME_ID, 5) || []; } catch (e) { rows = []; }
    if (!rows.length) {
      dom.leaderboardPanel.hidden = true;
      return;
    }
    var html = '<div class="leaderboard-title">Top 5 Timeline Stack Scores</div>';
    rows.forEach(function (row, index) {
      html += '<div class="leaderboard-row"><span>#' + (index + 1) + '</span><span>' +
        escapeHtml(row.name || row.displayName || "PLAYER") + '</span><strong>' +
        formatNumber(row.score || 0) + '</strong></div>';
    });
    dom.leaderboardPanel.innerHTML = html;
    dom.leaderboardPanel.hidden = false;
  }

  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(BEST_KEY);
      return raw ? JSON.parse(raw) || { score: 0 } : { score: 0 };
    } catch (e) {
      return { score: 0 };
    }
  }

  function writeBest(value) {
    try {
      if (window.localStorage) window.localStorage.setItem(BEST_KEY, JSON.stringify(value));
    } catch (e) {}
  }

  function registerHelp() {
    try {
      if (!window.MrMacsHelpOverlay) return;
      window.MrMacsHelpOverlay.register(GAME_ID, {
        title: "How to Play - Timeline Stack",
        goal: "Order each stack from earliest event at the top to latest event at the bottom.",
        controls: [
          { key: "UP / DN", action: "Move a card one slot" },
          { key: "Check Stack", action: "Lock in the order" },
          { key: "Next Stack", action: "Advance after scoring" }
        ],
        tips: [
          "The year is hidden until scoring, so use the event clue and course context.",
          "Exact slots matter, but partial pair order still earns points.",
          "Perfect stacks build a streak bonus.",
          "Missed cards are sent to the local review queue when profile storage is available."
        ],
        scholar: "Timeline Stack uses date-bearing cards from the shared arcade bank and falls back to a small local history set only when the bank cannot supply enough cards."
      });
      var actions = document.querySelector("#setupScreen .setup-actions");
      if (actions) window.MrMacsHelpOverlay.mountButton(actions, GAME_ID);
    } catch (e) {}
  }

  function courseLabel(courseId) {
    if (!courseId) return "Review";
    var labelMap = labels();
    if (labelMap[courseId]) return prettifyLabel(labelMap[courseId]);
    return prettifyLabel(courseId);
  }

  function prettifyLabel(value) {
    return String(value || "")
      .replace(/^ap-/i, "AP ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (ch) { return ch.toUpperCase(); })
      .replace(/\bUs\b/g, "U.S.")
      .replace(/\bEla\b/g, "ELA");
  }

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatNumber(value) {
    return String(Math.round(Number(value) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
