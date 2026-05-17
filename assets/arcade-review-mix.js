/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Arcade — Review Mix (spaced-repetition resurfacer)
   Sits in front of every game's `pickQuestion` and — with configurable
   probability — substitutes a due wrong-answer card from the student's
   personal queue. Closes the pedagogical loop the profile module's
   Leitner SR system was already wired for but no game was consuming.

   Flow:
     1. Game calls MrMacsReviewMix.maybeDue() before its own bank pick.
     2. If a due card is available (≥1 in the queue with nextShowAt ≤ now)
        and a probability roll succeeds (default 35%), returns a question
        object in the same shape the bank returns.
     3. After the student answers, game calls
        MrMacsReviewMix.gradeIfResurfaced(question, wasCorrect) to advance
        the box level (correct → next box; wrong → reset to box 1, lapse
        count++). At box 5, the card retires to the "mastered" archive.

   Distractor strategy:
     The queue stores prompt+correct-answer but NOT the original
     distractors. Resurfaced cards rebuild a 4-choice multiple-choice by
     borrowing 3 random distractors from the active course's bank,
     falling back to global bank if course-specific options are thin.

   Public API: window.MrMacsReviewMix
     .maybeDue(opts?) → question | null      | tries to serve a due card
     .gradeIfResurfaced(question, correct)   | grades after answer
     .dueCount() → number                    | how many cards due right now
     .setMixRate(0..1)                       | global probability override
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  if (root.MrMacsReviewMix) return;

  var DEFAULT_MIX_RATE = 0.35;  // 35% of questions in a session are due wrong-answers
  var customMixRate = null;
  var MIN_DISTRACTOR_POOL = 8;  // need this many alternatives to build a 4-choice MCQ

  function profile() { return root.MrMacsProfile; }
  function bank()    { return root.DIAG_BANK_BY_COURSE || {}; }

  // Collect candidate distractors. STRICT in-course only — never fall through
  // to global pool. Cross-course distractors produced the user-visible bug
  // where a US history prompt ("U.S. policy to stop the spread of communism")
  // showed up with choices like "ClassCastException" (AP CS A), "Speaker"
  // (AP Gov), and "Sum a over 1 minus r" (AP Calc BC). If the course no
  // longer exists in the current bank (e.g. queue item from an older bank
  // version), or has too few sibling answers, we return [] and maybeDue()
  // skips the card. Better to fall through to a fresh bank pick than to
  // serve nonsense.
  function gatherDistractors(course, correctAnswer) {
    var b = bank();
    if (!course || !b[course] || !Array.isArray(b[course])) return [];
    var seen = Object.create(null);
    var pool = [];
    for (var i = 0; i < b[course].length; i++) {
      var ct = b[course][i] && b[course][i].correctText;
      if (!ct) continue;
      if (ct === correctAnswer) continue;
      if (seen[ct]) continue;
      seen[ct] = true;
      pool.push(ct);
    }
    return pool;
  }

  function pickN(arr, n) {
    var copy = arr.slice();
    var out = [];
    while (out.length < n && copy.length) {
      var i = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(i, 1)[0]);
    }
    return out;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function dueCount() {
    if (!profile() || !profile().getDueWrongAnswers) return 0;
    return profile().getDueWrongAnswers(80).length;
  }

  function maybeDue(opts) {
    opts = opts || {};
    if (!profile() || !profile().getDueWrongAnswers) return null;
    var rate = (typeof customMixRate === "number") ? customMixRate :
               (typeof opts.mixRate === "number") ? opts.mixRate :
               DEFAULT_MIX_RATE;
    if (Math.random() > rate) return null;
    var due = profile().getDueWrongAnswers(20);
    if (!due.length) return null;
    // Pick the most-overdue card. The profile already sorts oldest-due-first.
    var pick = due[0];
    var distractors = pickN(gatherDistractors(pick.course, pick.answer), 3);
    if (distractors.length < 3) return null;
    var choices = shuffle([pick.answer].concat(distractors));
    return {
      prompt: pick.prompt,
      choices: choices,
      correctText: pick.answer,
      topic: pick.set || "Review Queue",
      course: pick.course,
      _isResurfaced: true,
      _resurfacedPromptKey: pick.prompt,  // for grading lookup
      _resurfacedBoxLevel: pick.boxLevel || 1,
      _resurfacedLapses: pick.lapses || 0
    };
  }

  function gradeIfResurfaced(question, wasCorrect) {
    if (!question || !question._isResurfaced) return null;
    if (!profile() || !profile().gradeWrongAnswer) return null;
    try {
      return profile().gradeWrongAnswer(question._resurfacedPromptKey, !!wasCorrect);
    } catch (e) { return null; }
  }

  function setMixRate(r) {
    if (r === null || r === undefined) { customMixRate = null; return; }
    var n = Number(r);
    if (!isFinite(n)) return;
    customMixRate = Math.max(0, Math.min(1, n));
  }

  root.MrMacsReviewMix = {
    maybeDue: maybeDue,
    gradeIfResurfaced: gradeIfResurfaced,
    dueCount: dueCount,
    setMixRate: setMixRate,
    DEFAULT_MIX_RATE: DEFAULT_MIX_RATE
  };
})(typeof window !== "undefined" ? window : globalThis);
