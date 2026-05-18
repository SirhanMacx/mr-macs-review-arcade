(function () {
  "use strict";

  var GAME_ID = "claim-evidence";
  var DEFAULT_COURSE = "global-10";
  var MATCHES_PER_ROUND = 3;
  var STORAGE_KEY = "mrmacs-claim-evidence-best-v1";

  var els = {};
  var state = {
    course: DEFAULT_COURSE,
    roundsTotal: 6,
    round: 0,
    pool: [],
    poolIndex: 0,
    currentPairs: [],
    matched: {},
    selectedClaim: "",
    selectedEvidence: "",
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    misses: 0,
    attempts: 0,
    hints: 0,
    startTs: 0,
    locked: false,
    wrongLogged: {}
  };

  function $(id) {
    return document.getElementById(id);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function text(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function shuffle(items) {
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copy[i];
      copy[i] = copy[j];
      copy[j] = t;
    }
    return copy;
  }

  function clampInt(value, fallback, min, max) {
    var n = parseInt(value, 10);
    if (!isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function bank() {
    return window.DIAG_BANK_BY_COURSE || {};
  }

  function validQuestion(q) {
    if (window.MrMacsValidQuestion) return window.MrMacsValidQuestion(q);
    return !!(q && q.prompt && q.correctText && Array.isArray(q.choices) && q.choices.indexOf(q.correctText) !== -1);
  }

  function getCourseRows(courseId) {
    var rows;
    if (courseId === "balanced-all") {
      rows = window.DIAG_BANK_GENERAL_TRIVIA || window.DIAG_BANK_ALL || [];
    } else {
      rows = bank()[courseId] || [];
    }
    return rows.filter(validQuestion);
  }

  function courseLabel(courseId) {
    if (courseId === "balanced-all") return "Balanced All Courses";
    var labels = window.DIAG_BANK_COURSE_LABELS || {};
    return labels[courseId] || courseId;
  }

  function compactEvidence(q) {
    var prompt = text(q.prompt);
    if (prompt.length <= 240) return prompt;
    var cut = prompt.slice(0, 240);
    var lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf(";"), cut.lastIndexOf(","));
    if (lastStop > 140) return cut.slice(0, lastStop + 1);
    return cut.replace(/\s+\S*$/, "") + "...";
  }

  function makePair(q, index) {
    return {
      id: "pair-" + state.round + "-" + index + "-" + Math.random().toString(36).slice(2, 8),
      q: q,
      claim: text(q.correctText),
      evidence: compactEvidence(q),
      topic: text(q.topic || q.domain || q.course || "Review"),
      course: text(q.course || state.course)
    };
  }

  function updateHud() {
    els.hudScore.textContent = String(state.score);
    els.hudRound.textContent = state.round + "/" + state.roundsTotal;
    els.hudStreak.textContent = String(state.streak);
    els.hudBest.textContent = String(state.bestStreak);
  }

  function setFeedback(kind, kicker, message) {
    els.consoleKicker.textContent = kicker;
    els.feedbackText.textContent = message;
    els.feedbackBox.classList.remove("is-good", "is-bad", "is-hint");
    if (kind) els.feedbackBox.classList.add("is-" + kind);
  }

  function showScreen(name) {
    els.setupScreen.hidden = name !== "setup";
    els.playScreen.hidden = name !== "play";
    els.endScreen.hidden = name !== "end";
    els.setupScreen.classList.toggle("show", name === "setup");
  }

  function populateCourses() {
    var b = bank();
    var ids = Object.keys(b).filter(function (id) {
      return getCourseRows(id).length >= MATCHES_PER_ROUND;
    }).sort();
    els.courseSelect.innerHTML = "";

    var allOption = document.createElement("option");
    allOption.value = "balanced-all";
    allOption.textContent = "Balanced All Courses";
    els.courseSelect.appendChild(allOption);

    ids.forEach(function (id) {
      var option = document.createElement("option");
      option.value = id;
      option.textContent = courseLabel(id) + " (" + getCourseRows(id).length + ")";
      els.courseSelect.appendChild(option);
    });

    var params = new URLSearchParams(window.location.search);
    var requested = params.get("bank") || DEFAULT_COURSE;
    els.courseSelect.value = ids.indexOf(requested) !== -1 ? requested : "balanced-all";
    els.roundSelect.value = String(clampInt(params.get("n"), 6, 4, 10));

    var total = window.DIAG_BANK_COVERAGE && window.DIAG_BANK_COVERAGE.questions;
    els.bankStatus.textContent = "Shared bank ready: " + ids.length + " course banks" + (total ? ", " + total + " questions." : ".");
    els.startBtn.disabled = ids.length === 0;
  }

  function pickDueQuestion() {
    if (!window.MrMacsReviewMix || typeof window.MrMacsReviewMix.maybeDue !== "function") return null;
    var due = window.MrMacsReviewMix.maybeDue({ mixRate: 0.25 });
    if (due && validQuestion(due)) return due;
    return null;
  }

  function nextPoolQuestion(seenClaims, seenPrompts) {
    var tries = 0;
    while (tries < state.pool.length + 10) {
      if (state.poolIndex >= state.pool.length) {
        state.pool = shuffle(state.pool);
        state.poolIndex = 0;
      }
      var q = state.pool[state.poolIndex++];
      tries += 1;
      var claimKey = text(q && q.correctText).toLowerCase();
      var promptKey = text(q && q.prompt).toLowerCase();
      if (!validQuestion(q) || seenClaims[claimKey] || seenPrompts[promptKey]) continue;
      seenClaims[claimKey] = true;
      seenPrompts[promptKey] = true;
      if (window.MrMacsRecentTracker) window.MrMacsRecentTracker.markSeen(q);
      return q;
    }
    return null;
  }

  function buildRoundPairs() {
    var seenClaims = {};
    var seenPrompts = {};
    var picks = [];
    var due = pickDueQuestion();
    if (due) {
      picks.push(due);
      seenClaims[text(due.correctText).toLowerCase()] = true;
      seenPrompts[text(due.prompt).toLowerCase()] = true;
    }
    while (picks.length < MATCHES_PER_ROUND) {
      var q = nextPoolQuestion(seenClaims, seenPrompts);
      if (!q) break;
      picks.push(q);
    }
    return picks.map(makePair);
  }

  function cardButton(type, pair) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "match-card";
    button.dataset.id = pair.id;
    button.dataset.type = type;
    button.setAttribute("aria-pressed", "false");

    var label = document.createElement("span");
    label.className = "card-label";
    label.textContent = type === "claim" ? "Claim" : "Evidence";

    var main = document.createElement("span");
    main.className = "card-main";
    main.textContent = type === "claim" ? pair.claim : pair.evidence;

    var meta = document.createElement("span");
    meta.className = "card-meta";
    meta.textContent = type === "claim" ? pair.topic : "Bank: " + courseLabel(pair.course);

    button.appendChild(label);
    button.appendChild(main);
    button.appendChild(meta);
    button.addEventListener("click", function () {
      selectCard(type, pair.id);
    });
    return button;
  }

  function renderRound() {
    els.claimsBoard.innerHTML = "";
    els.evidenceBoard.innerHTML = "";
    state.matched = {};
    state.selectedClaim = "";
    state.selectedEvidence = "";
    state.wrongLogged = {};

    var claimPairs = shuffle(state.currentPairs);
    var evidencePairs = shuffle(state.currentPairs);
    claimPairs.forEach(function (pair) {
      els.claimsBoard.appendChild(cardButton("claim", pair));
    });
    evidencePairs.forEach(function (pair) {
      els.evidenceBoard.appendChild(cardButton("evidence", pair));
    });

    els.objectiveName.textContent = "Round " + state.round + ": forge " + MATCHES_PER_ROUND + " matches";
    els.objectiveMeta.textContent = courseLabel(state.course);
    setFeedback("", "Ready", "Select a claim, then choose the evidence card that proves it.");
    updateHud();
  }

  function pairById(id) {
    for (var i = 0; i < state.currentPairs.length; i++) {
      if (state.currentPairs[i].id === id) return state.currentPairs[i];
    }
    return null;
  }

  function getCard(type, id) {
    return document.querySelector('.match-card[data-type="' + type + '"][data-id="' + id + '"]');
  }

  function clearSelections() {
    qsa(".match-card.is-selected").forEach(function (button) {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
    state.selectedClaim = "";
    state.selectedEvidence = "";
  }

  function selectCard(type, id) {
    if (state.locked || state.matched[id]) return;
    var key = type === "claim" ? "selectedClaim" : "selectedEvidence";
    var old = state[key];
    if (old && old !== id) {
      var oldCard = getCard(type, old);
      if (oldCard) {
        oldCard.classList.remove("is-selected");
        oldCard.setAttribute("aria-pressed", "false");
      }
    }
    state[key] = old === id ? "" : id;
    var card = getCard(type, id);
    if (card) {
      var selected = state[key] === id;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", selected ? "true" : "false");
    }
    if (state.selectedClaim && state.selectedEvidence) gradeSelection();
  }

  function recordAnswer(pair, correct) {
    if (!pair || !pair.q) return;
    if (window.MrMacsProfile && typeof window.MrMacsProfile.recordAnswer === "function") {
      try {
        window.MrMacsProfile.recordAnswer({
          gameId: GAME_ID,
          course: pair.q.course || state.course,
          set: pair.q.topic || "Claim Evidence",
          correct: !!correct,
          prompt: pair.q.prompt || "",
          answer: pair.q.correctText || ""
        });
      } catch (e) {}
    }
    if (window.MrMacsReviewMix && typeof window.MrMacsReviewMix.gradeIfResurfaced === "function") {
      try { window.MrMacsReviewMix.gradeIfResurfaced(pair.q, !!correct); } catch (e2) {}
    }
  }

  function markWrongOnce(pair) {
    if (!pair || state.wrongLogged[pair.id]) return;
    state.wrongLogged[pair.id] = true;
    recordAnswer(pair, false);
  }

  function gradeSelection() {
    var claimPair = pairById(state.selectedClaim);
    var evidencePair = pairById(state.selectedEvidence);
    if (!claimPair || !evidencePair) {
      clearSelections();
      return;
    }

    state.attempts += 1;
    var claimCard = getCard("claim", claimPair.id);
    var evidenceCard = getCard("evidence", evidencePair.id);
    var correct = claimPair.id === evidencePair.id;

    if (correct) {
      state.matched[claimPair.id] = true;
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.score += 100 + Math.min(120, state.streak * 20);
      if (claimCard) {
        claimCard.classList.remove("is-selected");
        claimCard.classList.add("is-correct");
        claimCard.disabled = true;
      }
      if (evidenceCard) {
        evidenceCard.classList.remove("is-selected");
        evidenceCard.classList.add("is-correct");
        evidenceCard.disabled = true;
      }
      recordAnswer(claimPair, true);
      setFeedback("good", "Matched", claimPair.claim + ": " + (claimPair.q.explanation || "The evidence supports this claim."));
      clearSelections();
      updateHud();
      if (Object.keys(state.matched).length >= MATCHES_PER_ROUND) {
        state.locked = true;
        window.setTimeout(nextRound, 900);
      }
      return;
    }

    state.misses += 1;
    state.streak = 0;
    state.score = Math.max(0, state.score - 25);
    markWrongOnce(claimPair);
    if (claimCard) claimCard.classList.add("is-wrong");
    if (evidenceCard) evidenceCard.classList.add("is-wrong");
    setFeedback("bad", "Check the link", "That evidence does not prove " + claimPair.claim + ". Try a tighter support card.");
    updateHud();

    state.locked = true;
    window.setTimeout(function () {
      if (claimCard) claimCard.classList.remove("is-wrong");
      if (evidenceCard) evidenceCard.classList.remove("is-wrong");
      clearSelections();
      state.locked = false;
    }, 650);
  }

  function nextRound() {
    state.locked = false;
    if (state.round >= state.roundsTotal) {
      endRun();
      return;
    }
    state.round += 1;
    state.currentPairs = buildRoundPairs();
    if (state.currentPairs.length < MATCHES_PER_ROUND) {
      setFeedback("bad", "Bank issue", "This bank does not have enough usable questions for a full matching round.");
      endRun();
      return;
    }
    renderRound();
  }

  function startRun() {
    state.course = els.courseSelect.value || DEFAULT_COURSE;
    state.roundsTotal = clampInt(els.roundSelect.value, 6, 4, 10);
    state.round = 0;
    state.pool = shuffle(getCourseRows(state.course));
    state.poolIndex = 0;
    state.currentPairs = [];
    state.matched = {};
    state.selectedClaim = "";
    state.selectedEvidence = "";
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.correct = 0;
    state.misses = 0;
    state.attempts = 0;
    state.hints = 0;
    state.startTs = Date.now();
    state.locked = false;
    state.wrongLogged = {};

    if (state.pool.length < MATCHES_PER_ROUND) {
      els.bankStatus.textContent = "Pick a bank with at least " + MATCHES_PER_ROUND + " valid questions.";
      return;
    }

    if (window.MrMacsRecentTracker) window.MrMacsRecentTracker.clear();
    showScreen("play");
    nextRound();
  }

  function hint() {
    if (els.playScreen.hidden || state.locked) return;
    var open = state.currentPairs.filter(function (pair) { return !state.matched[pair.id]; });
    if (!open.length) return;
    var pair = open[0];
    var claimCard = getCard("claim", pair.id);
    var evidenceCard = getCard("evidence", pair.id);
    state.hints += 1;
    state.streak = 0;
    state.score = Math.max(0, state.score - 50);
    if (claimCard) claimCard.classList.add("is-hint");
    if (evidenceCard) evidenceCard.classList.add("is-hint");
    setFeedback("hint", "Hint", "The claim '" + pair.claim + "' belongs with the highlighted evidence.");
    updateHud();
    window.setTimeout(function () {
      if (claimCard) claimCard.classList.remove("is-hint");
      if (evidenceCard) evidenceCard.classList.remove("is-hint");
    }, 1300);
  }

  function accuracy() {
    if (!state.attempts) return 100;
    return Math.round((state.correct / state.attempts) * 100);
  }

  function bestScore() {
    var n = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    return isFinite(n) ? n : 0;
  }

  function saveBest(score) {
    var prior = bestScore();
    if (score > prior) localStorage.setItem(STORAGE_KEY, String(score));
    return Math.max(prior, score);
  }

  function submitScore(best) {
    var detail = {
      gameId: GAME_ID,
      score: state.score,
      meta: {
        course: state.course,
        courseLabel: courseLabel(state.course),
        rounds: state.roundsTotal,
        matches: state.correct,
        attempts: state.attempts,
        accuracy: accuracy(),
        bestStreak: state.bestStreak,
        hints: state.hints,
        durationMs: Date.now() - state.startTs,
        localBest: best
      }
    };

    if (window.MrMacsLeaderboards && typeof window.MrMacsLeaderboards.submit === "function") {
      try { window.MrMacsLeaderboards.submit(GAME_ID, state.score, detail.meta); } catch (e) {}
    }
    try {
      if (!(window.MrMacsGlobalLeaderboards && window.MrMacsGlobalLeaderboards.installSubmitHook) &&
          window.dispatchEvent && window.CustomEvent) {
        window.dispatchEvent(new window.CustomEvent("mrmacs:score-submit", { detail: detail }));
      }
    } catch (e2) {}
  }

  function endRun() {
    var best = saveBest(state.score);
    submitScore(best);
    showScreen("end");
    els.endTitle.textContent = accuracy() >= 80 ? "Strong Evidence Chain" : "Run Complete";
    els.retryHint.textContent = accuracy() >= 80
      ? "Your matches held up. Try a harder or broader bank next."
      : "Replay the same bank and focus on which evidence directly proves each claim.";
    els.endGrid.innerHTML = "";
    [
      ["Score", state.score],
      ["Accuracy", accuracy() + "%"],
      ["Best Streak", state.bestStreak],
      ["Local Best", best]
    ].forEach(function (item) {
      var cell = document.createElement("div");
      cell.className = "end-cell";
      var strong = document.createElement("strong");
      strong.textContent = String(item[1]);
      var span = document.createElement("span");
      span.textContent = item[0];
      cell.appendChild(strong);
      cell.appendChild(span);
      els.endGrid.appendChild(cell);
    });
    updateHud();
  }

  function resetToSetup() {
    showScreen("setup");
    populateCourses();
    setFeedback("", "Ready", "Select a claim and the evidence card that supports it.");
  }

  function installHelp() {
    if (!window.MrMacsHelpOverlay) return;
    window.MrMacsHelpOverlay.register(GAME_ID, {
      title: "How to Play - Claim Evidence Forge",
      goal: "Match each claim to the evidence card that directly proves or defines it.",
      controls: [
        { key: "Click", action: "Select a claim and one evidence card" },
        { key: "H", action: "Highlight one unmatched pair for a small score cost" },
        { key: "R", action: "Reset to the setup screen" }
      ],
      tips: [
        "Start with the most specific claim; broad claims are harder to prove.",
        "A correct evidence card usually contains the definition, cause, effect, or example that makes the claim true.",
        "Wrong links feed the local review queue when the arcade profile layer is available.",
        "Use the explanation after a match to check the reasoning, not just the answer."
      ],
      scholar: "Shared-bank review items and due wrong-answer cards can both appear in the match deck."
    });
    var container = document.querySelector("#setupScreen .setup-actions");
    if (container) window.MrMacsHelpOverlay.mountButton(container, GAME_ID);
  }

  function bindEvents() {
    els.startBtn.addEventListener("click", startRun);
    els.hintBtn.addEventListener("click", hint);
    els.resetBtn.addEventListener("click", resetToSetup);
    els.setupBtn.addEventListener("click", resetToSetup);
    els.againBtn.addEventListener("click", startRun);
    document.addEventListener("keydown", function (event) {
      var target = event.target;
      if (target && /input|select|textarea/i.test(target.tagName || "")) return;
      if (event.key === "h" || event.key === "H") {
        hint();
      } else if (event.key === "r" || event.key === "R") {
        resetToSetup();
      }
    });
  }

  function cacheEls() {
    [
      "setupScreen", "playScreen", "endScreen", "startBtn", "hintBtn", "resetBtn",
      "courseSelect", "roundSelect", "bankStatus", "hudScore", "hudRound",
      "hudStreak", "hudBest", "objectiveName", "objectiveMeta", "claimsBoard",
      "evidenceBoard", "consoleKicker", "feedbackText", "endTitle", "endGrid",
      "retryHint", "setupBtn", "againBtn"
    ].forEach(function (id) {
      els[id] = $(id);
    });
    els.feedbackBox = document.querySelector(".reasoning-console");
  }

  function init() {
    cacheEls();
    if (!window.DIAG_BANK_BY_COURSE) {
      els.bankStatus.textContent = "Loading shared question bank...";
      els.startBtn.disabled = true;
      if (window.MrMacsQuestionBank && typeof window.MrMacsQuestionBank.load === "function") {
        window.MrMacsQuestionBank.load({ priority: true }).then(init).catch(function () {
          els.bankStatus.textContent = "Shared question bank did not load.";
        });
      } else {
        els.bankStatus.textContent = "Shared question bank did not load.";
      }
      return;
    }
    populateCourses();
    bindEvents();
    installHelp();
    updateHud();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
