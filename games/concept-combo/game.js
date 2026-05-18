(function () {
  "use strict";

  var GAME_ID = "concept-combo";
  var GAME_TITLE = "Concept Combo";
  var ROUND_SIZE = 4;
  var STORAGE_KEY = "mrmacs.conceptCombo.best";

  var COURSE_ORDER = [
    "general",
    "global-10",
    "us-history",
    "ap-world-history-modern",
    "ap-european-history",
    "ap-us-government-and-politics",
    "ap-comparative-government-and-politics",
    "ap-human-geography",
    "ap-psychology",
    "ap-macroeconomics",
    "ap-microeconomics",
    "algebra-1",
    "geometry",
    "algebra-2",
    "grade-7-math",
    "grade-8-ela",
    "living-environment"
  ];

  var COURSE_LABELS = {
    general: "General Mix",
    "global-10": "Global History II",
    "us-history": "U.S. History",
    "ap-world-history-modern": "AP World History",
    "ap-european-history": "AP European History",
    "ap-us-government-and-politics": "AP U.S. Government",
    "ap-comparative-government-and-politics": "AP Comparative Government",
    "ap-human-geography": "AP Human Geography",
    "ap-psychology": "AP Psychology",
    "ap-macroeconomics": "AP Macroeconomics",
    "ap-microeconomics": "AP Microeconomics",
    "algebra-1": "Algebra 1",
    "algebra-2": "Algebra 2",
    geometry: "Geometry",
    "grade-7-math": "Grade 7 Math",
    "grade-8-ela": "Grade 8 ELA",
    "living-environment": "Living Environment"
  };

  var state = {
    course: "global-10",
    totalRounds: 5,
    round: 0,
    queue: [],
    pairs: [],
    selectedClue: "",
    selectedConcept: "",
    score: 0,
    combo: 0,
    bestCombo: 0,
    correct: 0,
    attempts: 0,
    misses: [],
    locked: false,
    startedAt: 0
  };

  function $(id) {
    return document.getElementById(id);
  }

  var els = {
    setup: $("setupScreen"),
    play: $("playScreen"),
    end: $("endScreen"),
    courseSelect: $("courseSelect"),
    roundSelect: $("roundSelect"),
    setupMetrics: $("setupMetrics"),
    startBtn: $("startBtn"),
    setupBtn: $("setupBtn"),
    againBtn: $("againBtn"),
    bestScore: $("bestScore"),
    score: $("score"),
    combo: $("comboCount"),
    round: $("roundCount"),
    accuracy: $("accuracyText"),
    cluesLeft: $("cluesLeft"),
    conceptsLeft: $("conceptsLeft"),
    clueDeck: $("clueDeck"),
    conceptDeck: $("conceptDeck"),
    chainRail: $("chainRail"),
    feedback: $("feedback"),
    finalScore: $("finalScore"),
    finalAccuracy: $("finalAccuracy"),
    finalCombo: $("finalCombo"),
    endTitle: $("endTitle"),
    missList: $("missList")
  };

  function playSfx(name) {
    try {
      if (window.MrMacsSFX && typeof window.MrMacsSFX.play === "function") {
        window.MrMacsSFX.play(name);
      }
    } catch (e) {}
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cleanText(value, max) {
    var text = String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
    if (max && text.length > max) return text.slice(0, max - 1).trim() + "...";
    return text;
  }

  function labelForCourse(id) {
    if (COURSE_LABELS[id]) return COURSE_LABELS[id];
    return String(id || "")
      .split("-")
      .filter(Boolean)
      .map(function (part) { return part.charAt(0).toUpperCase() + part.slice(1); })
      .join(" ");
  }

  function questionBank() {
    return window.DIAG_BANK_BY_COURSE || {};
  }

  function generalPool() {
    return window.DIAG_BANK_GENERAL_TRIVIA || window.DIAG_BANK_ALL || [];
  }

  function poolFor(course) {
    if (course === "general") return generalPool();
    var bank = questionBank();
    return Array.isArray(bank[course]) ? bank[course] : [];
  }

  function validQuestion(q) {
    if (!q || typeof q !== "object") return false;
    if (!q.prompt || !q.correctText) return false;
    if (!Array.isArray(q.choices) || q.choices.length < 4) return false;
    if (q.choices.indexOf(q.correctText) === -1) return false;
    if (String(q.correctText).trim().length < 2) return false;
    if (String(q.prompt).trim().length < 8) return false;
    return true;
  }

  function normalizeQuestion(q, index) {
    return {
      id: cleanText(q.id || (q.course || "q") + "-" + index, 80),
      prompt: cleanText(q.prompt, 240),
      correctText: cleanText(q.correctText, 96),
      choices: (q.choices || []).map(function (choice) { return cleanText(choice, 96); }),
      topic: cleanText(q.topic || q.domain || q.subjectArea || "Review", 72),
      explanation: cleanText(q.explanation || "", 280),
      course: q.course || state.course,
      _isResurfaced: q._isResurfaced,
      _resurfacedPromptKey: q._resurfacedPromptKey,
      _resurfacedBoxLevel: q._resurfacedBoxLevel,
      _resurfacedLapses: q._resurfacedLapses
    };
  }

  function shuffle(items) {
    var arr = items.slice();
    for (var i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function uniqueQuestions(rows, needed, seenAnswers) {
    var out = [];
    var seenPrompts = Object.create(null);
    var answers = seenAnswers || Object.create(null);
    shuffle(rows).forEach(function (raw, index) {
      if (out.length >= needed) return;
      if (!validQuestion(raw)) return;
      var q = normalizeQuestion(raw, index);
      var answerKey = q.correctText.toLowerCase();
      var promptKey = q.prompt.toLowerCase();
      if (answers[answerKey] || seenPrompts[promptKey]) return;
      answers[answerKey] = true;
      seenPrompts[promptKey] = true;
      out.push(q);
    });
    return out;
  }

  function dueQuestion(seenAnswers) {
    if (!window.MrMacsReviewMix || typeof window.MrMacsReviewMix.maybeDue !== "function") return null;
    for (var i = 0; i < 4; i += 1) {
      var due = window.MrMacsReviewMix.maybeDue({ mixRate: 1 });
      if (!validQuestion(due)) continue;
      var q = normalizeQuestion(due, i);
      var key = q.correctText.toLowerCase();
      if (!seenAnswers[key]) {
        seenAnswers[key] = true;
        return q;
      }
    }
    return null;
  }

  function buildQueue(course, count) {
    var seenAnswers = Object.create(null);
    var queue = [];
    while (queue.length < Math.min(3, count)) {
      var due = dueQuestion(seenAnswers);
      if (!due) break;
      queue.push(due);
    }
    queue = queue.concat(uniqueQuestions(poolFor(course), count - queue.length, seenAnswers));
    if (queue.length < count) {
      queue = queue.concat(uniqueQuestions(generalPool(), count - queue.length, seenAnswers));
    }
    return queue.slice(0, count);
  }

  function bestScore() {
    try {
      return Number(localStorage.getItem(STORAGE_KEY) || 0) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(score) {
    var best = bestScore();
    if (score <= best) return best;
    try {
      localStorage.setItem(STORAGE_KEY, String(score));
    } catch (e) {}
    return score;
  }

  function accuracy() {
    if (!state.attempts) return 100;
    return Math.round((state.correct / state.attempts) * 100);
  }

  function updateHud() {
    els.score.textContent = String(state.score);
    els.score.setAttribute("data-score", String(state.score));
    els.combo.textContent = state.combo + "x";
    els.round.textContent = Math.min(state.round, state.totalRounds) + "/" + state.totalRounds;
    els.accuracy.textContent = accuracy() + "%";
    var left = state.pairs.filter(function (pair) { return !pair.matched; }).length;
    els.cluesLeft.textContent = left + " left";
    els.conceptsLeft.textContent = left + " left";
    els.chainRail.style.setProperty("--chain", Math.min(100, state.combo * 12) + "%");
  }

  function showScreen(name) {
    els.setup.hidden = name !== "setup";
    els.play.hidden = name !== "play";
    els.end.hidden = name !== "end";
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function setFeedback(message, tone) {
    els.feedback.className = "combo-feedback" + (tone ? " " + tone : "");
    els.feedback.textContent = message;
  }

  function clearSelection() {
    state.selectedClue = "";
    state.selectedConcept = "";
    Array.from(document.querySelectorAll(".is-selected")).forEach(function (node) {
      node.classList.remove("is-selected");
    });
  }

  function setupMetrics() {
    var pool = poolFor(state.course).filter(validQuestion);
    var topics = Object.create(null);
    pool.forEach(function (q) {
      var topic = q.topic || q.domain || q.subjectArea || "Review";
      topics[topic] = true;
    });
    els.setupMetrics.innerHTML =
      '<div class="metric"><strong>' + pool.length + '</strong><span>questions</span></div>' +
      '<div class="metric"><strong>' + Object.keys(topics).length + '</strong><span>topics</span></div>' +
      '<div class="metric"><strong>' + (window.MrMacsReviewMix && window.MrMacsReviewMix.dueCount ? window.MrMacsReviewMix.dueCount() : 0) + '</strong><span>due cards</span></div>';
    els.startBtn.disabled = pool.length < ROUND_SIZE;
    els.startBtn.textContent = pool.length < ROUND_SIZE ? "Bank Unavailable" : "Start Combo";
  }

  function populateCourses() {
    var bank = questionBank();
    var ids = [];
    COURSE_ORDER.forEach(function (id) {
      if (id === "general" || (Array.isArray(bank[id]) && bank[id].length >= ROUND_SIZE)) ids.push(id);
    });
    Object.keys(bank).sort().forEach(function (id) {
      if (ids.indexOf(id) === -1 && bank[id] && bank[id].length >= ROUND_SIZE) ids.push(id);
    });
    els.courseSelect.innerHTML = ids.map(function (id) {
      return '<option value="' + escapeHtml(id) + '">' + escapeHtml(labelForCourse(id)) + '</option>';
    }).join("");
  }

  function applyQueryParams() {
    var params = new URLSearchParams(window.location.search);
    var requestedCourse = params.get("bank") || params.get("course");
    if (requestedCourse && (requestedCourse === "general" || poolFor(requestedCourse).length)) {
      state.course = requestedCourse;
      els.courseSelect.value = requestedCourse;
    }
    var requestedCount = Number(params.get("n") || 0);
    if (Number.isFinite(requestedCount) && requestedCount >= ROUND_SIZE) {
      state.totalRounds = Math.max(3, Math.min(8, Math.ceil(requestedCount / ROUND_SIZE)));
      var existing = Array.from(els.roundSelect.options).some(function (option) {
        return Number(option.value) === state.totalRounds;
      });
      if (!existing) {
        var option = document.createElement("option");
        option.value = String(state.totalRounds);
        option.textContent = state.totalRounds + " rounds";
        els.roundSelect.appendChild(option);
      }
      els.roundSelect.value = String(state.totalRounds);
    }
  }

  function renderRound() {
    clearSelection();
    state.locked = false;
    state.round += 1;
    state.pairs = state.queue.splice(0, ROUND_SIZE).map(function (question, index) {
      return {
        id: "pair-" + state.round + "-" + index,
        question: question,
        matched: false,
        attempts: 0,
        recorded: false
      };
    });
    var concepts = shuffle(state.pairs);
    els.clueDeck.innerHTML = state.pairs.map(function (pair, index) {
      return '<button class="match-card" type="button" data-clue="' + pair.id + '">' +
        '<span>' + escapeHtml(pair.question.topic || ("Clue " + (index + 1))) + '</span>' +
        '<strong>' + escapeHtml(pair.question.prompt) + '</strong>' +
        '</button>';
    }).join("");
    els.conceptDeck.innerHTML = concepts.map(function (pair) {
      return '<button class="concept-tile" type="button" data-concept="' + pair.id + '">' +
        escapeHtml(pair.question.correctText) +
        '</button>';
    }).join("");
    Array.from(els.clueDeck.querySelectorAll("[data-clue]")).forEach(function (button) {
      button.addEventListener("click", function () { selectClue(button.getAttribute("data-clue")); });
    });
    Array.from(els.conceptDeck.querySelectorAll("[data-concept]")).forEach(function (button) {
      button.addEventListener("click", function () { selectConcept(button.getAttribute("data-concept")); });
    });
    setFeedback("Select a clue, then select its matching concept.", "");
    updateHud();
  }

  function pairById(id) {
    return state.pairs.find(function (pair) { return pair.id === id; });
  }

  function buttonFor(kind, id) {
    return document.querySelector(kind === "clue" ? '[data-clue="' + id + '"]' : '[data-concept="' + id + '"]');
  }

  function selectClue(id) {
    if (state.locked) return;
    var pair = pairById(id);
    if (!pair || pair.matched) return;
    state.selectedClue = id;
    Array.from(els.clueDeck.querySelectorAll(".is-selected")).forEach(function (node) {
      node.classList.remove("is-selected");
    });
    var button = buttonFor("clue", id);
    if (button) button.classList.add("is-selected");
    playSfx("select");
    tryMatch();
  }

  function selectConcept(id) {
    if (state.locked) return;
    var pair = pairById(id);
    if (!pair || pair.matched) return;
    state.selectedConcept = id;
    Array.from(els.conceptDeck.querySelectorAll(".is-selected")).forEach(function (node) {
      node.classList.remove("is-selected");
    });
    var button = buttonFor("concept", id);
    if (button) button.classList.add("is-selected");
    playSfx("select");
    tryMatch();
  }

  function recordPair(pair, correct) {
    if (!pair || pair.recorded) return;
    pair.recorded = true;
    var q = pair.question;
    try {
      if (window.MrMacsProfile && typeof window.MrMacsProfile.recordAnswer === "function") {
        window.MrMacsProfile.recordAnswer({
          course: q.course || state.course,
          set: q.topic || "Concept Combo",
          gameId: GAME_ID,
          correct: !!correct,
          prompt: q.prompt,
          answer: q.correctText
        });
      }
    } catch (e) {}
    try {
      if (window.MrMacsReviewMix && typeof window.MrMacsReviewMix.gradeIfResurfaced === "function") {
        window.MrMacsReviewMix.gradeIfResurfaced(q, !!correct);
      }
    } catch (e) {}
  }

  function markWrong(clueId, conceptId) {
    [buttonFor("clue", clueId), buttonFor("concept", conceptId)].forEach(function (button) {
      if (!button) return;
      button.classList.add("is-wrong");
      setTimeout(function () { button.classList.remove("is-wrong"); }, 420);
    });
  }

  function tryMatch() {
    if (!state.selectedClue || !state.selectedConcept) return;
    var cluePair = pairById(state.selectedClue);
    var conceptPair = pairById(state.selectedConcept);
    if (!cluePair || !conceptPair) {
      clearSelection();
      return;
    }
    state.attempts += 1;
    cluePair.attempts += 1;
    if (cluePair.id === conceptPair.id) {
      cluePair.matched = true;
      state.correct += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.score += 125 + state.combo * 35 + (cluePair.attempts === 1 ? 40 : 0);
      recordPair(cluePair, true);
      [buttonFor("clue", cluePair.id), buttonFor("concept", cluePair.id)].forEach(function (button) {
        if (!button) return;
        button.classList.remove("is-selected");
        button.classList.add("is-matched");
        button.disabled = true;
      });
      setFeedback("Linked: " + cluePair.question.correctText + ". Combo is now " + state.combo + "x.", "good");
      playSfx("success");
      clearSelection();
      updateHud();
      if (state.pairs.every(function (pair) { return pair.matched; })) finishRound();
    } else {
      state.combo = 0;
      state.score = Math.max(0, state.score - 30);
      if (!cluePair.missed) {
        cluePair.missed = true;
        state.misses.push(cluePair.question);
      }
      recordPair(cluePair, false);
      markWrong(cluePair.id, conceptPair.id);
      setFeedback("Chain break. Correct concept for that clue: " + cluePair.question.correctText + ".", "bad");
      playSfx("error");
      clearSelection();
      updateHud();
    }
  }

  function finishRound() {
    state.locked = true;
    var perfect = state.pairs.every(function (pair) { return pair.attempts === 1; });
    var bonus = perfect ? 220 + state.combo * 20 : 80;
    state.score += bonus;
    updateHud();
    setFeedback((perfect ? "Perfect board" : "Board clear") + ". Round bonus +" + bonus + ".", "good");
    setTimeout(function () {
      if (state.round >= state.totalRounds || state.queue.length < ROUND_SIZE) finishRun();
      else renderRound();
    }, 900);
  }

  function dispatchScore() {
    var detail = {
      gameId: GAME_ID,
      score: state.score,
      meta: {
        title: GAME_TITLE,
        course: labelForCourse(state.course),
        rounds: state.round,
        accuracy: accuracy(),
        correct: state.correct,
        attempts: state.attempts,
        bestCombo: state.bestCombo,
        mode: "local-concept-match"
      }
    };
    try {
      window.dispatchEvent(new CustomEvent("mrmacs:score-submit", { detail: detail }));
    } catch (e) {}
  }

  function finishRun() {
    var best = saveBest(state.score);
    els.bestScore.textContent = String(best);
    els.finalScore.textContent = String(state.score);
    els.finalAccuracy.textContent = accuracy() + "%";
    els.finalCombo.textContent = state.bestCombo + "x";
    els.endTitle.textContent = state.score >= best ? "New local best" : "Combo chain logged";
    var misses = state.misses.slice(0, 5);
    els.missList.innerHTML = misses.length ? misses.map(function (q) {
      return '<div class="miss-item"><strong>' + escapeHtml(q.correctText) + '</strong><br>' + escapeHtml(q.prompt) + '</div>';
    }).join("") : '<div class="miss-item"><strong>Clean run</strong><br>No missed concept links from this session.</div>';
    dispatchScore();
    try {
      if (window.MrMacsProfile && typeof window.MrMacsProfile.recordCompletion === "function") {
        window.MrMacsProfile.recordCompletion(GAME_ID, state.score);
      }
    } catch (e) {}
    playSfx("gameStart");
    showScreen("end");
  }

  function startRun() {
    if (els.startBtn.disabled) return;
    try {
      if (window.MrMacsSFX && typeof window.MrMacsSFX.ensureContext === "function") {
        window.MrMacsSFX.ensureContext();
      }
    } catch (e) {}
    state.course = els.courseSelect.value || "general";
    state.totalRounds = Number(els.roundSelect.value || 5);
    state.round = 0;
    state.queue = buildQueue(state.course, state.totalRounds * ROUND_SIZE);
    state.pairs = [];
    state.selectedClue = "";
    state.selectedConcept = "";
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.correct = 0;
    state.attempts = 0;
    state.misses = [];
    state.locked = false;
    state.startedAt = Date.now();
    if (state.queue.length < ROUND_SIZE) {
      setFeedback("This bank does not have enough clean concept pairs yet.", "bad");
      return;
    }
    try {
      if (window.MrMacsProfile && typeof window.MrMacsProfile.recordPlay === "function") {
        window.MrMacsProfile.recordPlay({
          id: GAME_ID,
          title: GAME_TITLE,
          course: labelForCourse(state.course),
          file: "games/concept-combo/index.html"
        });
      }
    } catch (e) {}
    playSfx("gameStart");
    showScreen("play");
    renderRound();
  }

  function resetToSetup() {
    clearSelection();
    state.locked = false;
    setupMetrics();
    showScreen("setup");
  }

  function boot() {
    els.bestScore.textContent = String(bestScore());
    if (!Object.keys(questionBank()).length || !generalPool().length) {
      if (window.MrMacsQuestionBank && typeof window.MrMacsQuestionBank.load === "function") {
        els.setupMetrics.innerHTML = '<div class="metric"><strong>...</strong><span>loading bank</span></div>';
        els.startBtn.disabled = true;
        els.startBtn.textContent = "Loading Bank";
        window.MrMacsQuestionBank.load({ priority: true }).then(boot).catch(function () {
          els.setupMetrics.innerHTML = '<div class="metric"><strong>0</strong><span>bank missing</span></div>';
          els.startBtn.disabled = true;
          els.startBtn.textContent = "Bank Unavailable";
        });
        return;
      }
      els.setupMetrics.innerHTML = '<div class="metric"><strong>0</strong><span>bank missing</span></div>';
      els.startBtn.disabled = true;
      els.startBtn.textContent = "Bank Unavailable";
      return;
    }
    populateCourses();
    applyQueryParams();
    setupMetrics();
    els.courseSelect.addEventListener("change", function () {
      state.course = els.courseSelect.value;
      setupMetrics();
    });
    els.roundSelect.addEventListener("change", function () {
      state.totalRounds = Number(els.roundSelect.value || 5);
    });
    els.startBtn.addEventListener("click", startRun);
    els.againBtn.addEventListener("click", startRun);
    els.setupBtn.addEventListener("click", resetToSetup);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        clearSelection();
        if (!els.play.hidden) setFeedback("Selection cleared.", "");
      }
      if (event.key === "Enter" && !els.setup.hidden && !els.startBtn.disabled) {
        startRun();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
