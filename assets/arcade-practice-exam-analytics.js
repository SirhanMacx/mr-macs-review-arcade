/* Mr. Mac's Arcade — Practice-Exam Analytics Auto-Instrumentation
 *
 * Why this exists:
 *   The 52 per-course practice-exam pages (games/ap-*-practice/,
 *   games/grade-*-practice/, games/regents-practice-exam/,
 *   games/ap-practice-exam/, games/apush-practice/, ...) all share
 *   the same DOM contract:
 *     - #beginBtn / #startBtn   → user clicks "Begin Exam"
 *     - .exam-choice            → answer-choice buttons (one per option)
 *     - .exam-results           → results screen rendered on completion
 *     - .results-row            → per-topic mastery row (label, frac, meter, pct)
 *     - .exam-card              → question card with .exam-topic + .exam-prompt
 *
 *   Hand-instrumenting all 52 files would be 52 separate edits and 52
 *   places to drift out of sync. This module wraps the DOM and fires
 *   consistent `practice_exam_start`, `practice_exam_question_answered`,
 *   and `practice_exam_finish` events into the shared MrMacsAnalytics
 *   pipeline (which strips PII + persists to localStorage + bumps the
 *   public counter API).
 *
 * No PII. Only:
 *   - gameId (slug of folder, e.g. "ap-bio-practice")
 *   - topic (e.g. "Heredity") — content label, not student data
 *   - correctness (boolean), elapsedMs (when computable), correctCount, totalCount, percent
 *
 * Idempotency:
 *   - Re-loading the script is a no-op (window.MrMacsPracticeExamAnalytics guard).
 *   - The .exam-choice listener is registered ONCE per click (via
 *     event delegation on document) so re-renders don't double-fire.
 *   - practice_exam_start fires once per page-load (per #beginBtn click).
 *   - practice_exam_finish fires once per .exam-results appearance
 *     (tracked via a MutationObserver + done flag).
 *
 * Privacy: PII stripped via MrMacsAnalytics.stripPII before any event payload
 * enters the local log or hits the counter API.
 */
(function () {
  "use strict";
  var root = (typeof window !== "undefined") ? window : {};
  if (root.MrMacsPracticeExamAnalytics) return;

  // Only run on /games/*-practice/ + /games/regents-practice-exam/ +
  // /games/ap-practice-exam/ pages. Anything else is a no-op.
  var path = (typeof location !== "undefined" && location.pathname) ? location.pathname : "";
  // Match every practice-exam surface:
  //   /games/<anything>/practice-exam.html       (52 per-course pages)
  //   /games/<...-practice|regents-*>/...        (folder-based heuristic)
  //   /games/(ap|regents)-practice-exam/...      (umbrella exams)
  //   /games/generated-practice-exam/...         (dynamic exam builder)
  //   /games/apush-practice/...                  (legacy slug)
  var isPracticeExamPage = /\/practice-exam\.html$/.test(path) ||
    /\/games\/(.*-practice|regents-[^/]+|ap-practice-exam|regents-practice-exam|generated-practice-exam|apush-practice)\//.test(path);
  if (!isPracticeExamPage) return;

  function slug(value) {
    return String(value || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "unknown";
  }

  function gameIdFromPath() {
    var id = path.split("/games/")[1] || path;
    try { id = decodeURIComponent(id); } catch (e) {}
    id = id.replace(/\/index\.html$/i, "").replace(/\/practice-exam\.html$/i, "").replace(/\/+$/g, "");
    if (id.indexOf("/") > -1) return id.split("/")[0];
    return slug(id);
  }

  var gameId = gameIdFromPath();
  var pageTitle = (typeof document !== "undefined" && document.title) ? document.title : gameId;
  // The page <title> is the canonical exam name (e.g. "AP Biology Practice Exam — Mr. Mac's Review Arcade").
  // Strip the suffix to get the display name.
  var displayTitle = pageTitle.replace(/\s*—\s*Mr\.\s*Mac.*$/i, "").trim() || gameId;

  var state = {
    started: false,
    startTs: 0,
    questionStartTs: 0,
    questionsAnswered: 0,
    correctCount: 0,
    perTopic: {},          // topic → { correct, total }
    seenTopics: [],        // ordered list of topic labels encountered
    finished: false,
    lastSnapshotCorrect: 0,
    lastSnapshotTotal: 0
  };

  function safeTrack(type, detail, options) {
    try {
      if (!root.MrMacsAnalytics || typeof root.MrMacsAnalytics.track !== "function") return;
      detail = detail || {};
      detail.gameId = detail.gameId || gameId;
      detail.title = detail.title || displayTitle;
      detail.gameType = detail.gameType || "Practice Exam";
      // Strip PII just in case caller passes anything beyond the
      // documented shape — defense-in-depth.
      if (root.MrMacsAnalytics.stripPII) {
        detail = root.MrMacsAnalytics.stripPII(detail);
      }
      root.MrMacsAnalytics.track(type, detail, options || {});
    } catch (error) {
      // Analytics must never crash the exam UX.
    }
  }

  function fireStart() {
    if (state.started) return;
    state.started = true;
    state.startTs = Date.now();
    state.questionStartTs = state.startTs;
    safeTrack("game_launch", {
      gameId: gameId,
      title: displayTitle,
      gameType: "Practice Exam",
      startedAt: new Date(state.startTs).toISOString()
    }, { counter: "game-launches", onceKey: "practice-exam-start:" + gameId });
    // Also fire the semantic practice_exam_start event so the admin
    // dashboard can distinguish exam starts from arcade-game launches.
    safeTrack("practice_exam_start", {
      gameId: gameId,
      title: displayTitle
    }, { counter: "practice-exam-starts", onceKey: "practice-exam-event-start:" + gameId });
  }

  function extractTopic(button) {
    // The button sits inside a .exam-card with a .exam-topic label.
    try {
      var card = button.closest && button.closest(".exam-card");
      if (card) {
        var topic = card.querySelector(".exam-topic");
        if (topic && topic.textContent) return topic.textContent.trim().slice(0, 80);
      }
    } catch (e) {}
    return "";
  }

  function snapshotProgress(button) {
    // Best-effort read of score from the on-screen progress pill. The
    // shared exam template renders innerHTML like "Score: 5 / 12 <span class='pct'>42%</span>".
    var pill = document.getElementById("scorePill");
    if (!pill) return null;
    try {
      var text = pill.textContent || "";
      var m = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (m) {
        var correct = Number(m[1]);
        var total = Number(m[2]);
        if (Number.isFinite(correct) && Number.isFinite(total) && total >= 0) {
          return { correct: correct, total: total };
        }
      }
    } catch (e) {}
    return null;
  }

  function onAnswerClick(button) {
    if (!state.started) fireStart();
    var topic = extractTopic(button);
    if (topic && state.seenTopics.indexOf(topic) === -1) state.seenTopics.push(topic);

    // Inferring correctness: the question DOM marks the chosen button
    // with .correct or .wrong AFTER the listener runs. We schedule
    // a microtask read so we see the post-click state.
    var elapsedMs = Math.max(0, Date.now() - state.questionStartTs);
    setTimeout(function () {
      var isCorrect = button.classList && (button.classList.contains("correct"));
      var isWrong = button.classList && (button.classList.contains("wrong"));
      // If the page hasn't marked it yet (some custom flows render
      // correctness via different selectors), fall back to snapshot
      // diff against the progress pill.
      var snap = snapshotProgress(button);
      if (snap && snap.total > state.lastSnapshotTotal) {
        var deltaCorrect = snap.correct - state.lastSnapshotCorrect;
        if (deltaCorrect > 0) isCorrect = true;
        else if (deltaCorrect <= 0 && !isCorrect) isWrong = true;
        state.lastSnapshotCorrect = snap.correct;
        state.lastSnapshotTotal = snap.total;
      }
      state.questionsAnswered += 1;
      if (isCorrect) state.correctCount += 1;
      if (topic) {
        var bucket = state.perTopic[topic] || { correct: 0, total: 0 };
        bucket.total += 1;
        if (isCorrect) bucket.correct += 1;
        state.perTopic[topic] = bucket;
      }
      safeTrack("practice_exam_question_answered", {
        gameId: gameId,
        title: displayTitle,
        topic: topic || "",
        correct: !!isCorrect,
        wrong: !!isWrong,
        questionNumber: state.questionsAnswered,
        elapsedMs: elapsedMs
      }, { once: false, counter: "practice-exam-questions-answered" });
      state.questionStartTs = Date.now();
    }, 0);
  }

  // Event delegation: catches both the initial render and any
  // re-renders (renderQuestion → renderResults → renderReview).
  if (typeof document !== "undefined") {
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t) return;
      // Climb to the nearest .exam-choice; user may click on the inner
      // <span class="letter"> or <span class="text">.
      var choice = (t.closest) ? t.closest(".exam-choice") : null;
      if (choice && !choice.disabled) {
        onAnswerClick(choice);
        return;
      }
      // Catch start buttons. Some exams use #beginBtn (per-course),
      // others use #startBtn (umbrella regents/ap-practice-exam).
      if (t.id === "beginBtn" || t.id === "startBtn") {
        fireStart();
      }
    }, true);
  }

  // Detect results screen via MutationObserver — fires once when
  // .exam-results enters the DOM (renderResults() injects it).
  function checkFinish(root2) {
    if (state.finished) return;
    var results = root2.querySelector ? root2.querySelector(".exam-results .grand-score") : null;
    if (!results) return;
    var text = (results.textContent || "").trim();
    // grand-score renders "<correct> / <total> <small>NN%</small>"
    var m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return;
    var correct = Number(m[1]);
    var total = Number(m[2]);
    var pctMatch = text.match(/(\d+)\s*%/);
    var percent = pctMatch ? Number(pctMatch[1]) : (total ? Math.round((correct / total) * 100) : 0);
    state.finished = true;
    var elapsedMs = state.startTs ? (Date.now() - state.startTs) : 0;

    // Build weak-topic list from per-topic breakdown if visible on screen
    var weakTopics = [];
    try {
      var rows = root2.querySelectorAll ? root2.querySelectorAll(".exam-results .results-row.weak .label") : [];
      for (var i = 0; i < rows.length && weakTopics.length < 8; i += 1) {
        var lbl = (rows[i].textContent || "").trim().slice(0, 80);
        if (lbl) weakTopics.push(lbl);
      }
    } catch (e) {}

    safeTrack("game_complete", {
      gameId: gameId,
      title: displayTitle,
      gameType: "Practice Exam",
      score: correct,
      questions: total,
      accuracy: percent,
      percent: percent,
      elapsedMs: elapsedMs,
      weakTopics: weakTopics
    }, { counter: "game-completions", onceKey: "practice-exam-complete:" + gameId + ":" + Date.now() });

    safeTrack("practice_exam_finish", {
      gameId: gameId,
      title: displayTitle,
      score: correct,
      questions: total,
      percent: percent,
      elapsedMs: elapsedMs,
      weakTopics: weakTopics
    }, { counter: "practice-exam-finishes", onceKey: "practice-exam-event-finish:" + gameId + ":" + Date.now() });
  }

  function startObserver() {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
    var target = document.body || document.documentElement;
    if (!target) return;
    // Initial check in case results screen was already rendered (e.g. restored from saved progress).
    checkFinish(document);
    var mo = new MutationObserver(function () { checkFinish(document); });
    try { mo.observe(target, { childList: true, subtree: true }); } catch (e) {}
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startObserver);
    } else {
      startObserver();
    }
  }

  root.MrMacsPracticeExamAnalytics = {
    gameId: gameId,
    state: function () { return JSON.parse(JSON.stringify(state)); },
    fireStart: fireStart,
    fireFinish: function () { checkFinish(document); }
  };
})();
