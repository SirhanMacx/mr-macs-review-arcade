/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Arcade — Question Validator + Session Dedup (defense-in-depth)
   Single source of truth for "is this question safe to render?" AND "have
   we just shown this question?". Sits behind every game's pickQuestion path
   so (a) a stale cache / malformed bank row / template leak can never reach
   the player, and (b) the same prompt isn't shown twice in quick succession.

   Public API: window.MrMacsValidQuestion(q)         → bool
               window.MrMacsPickValidQuestion(fn, n) → q | null
                 — auto-rejects template-leaked items AND recently-shown
                   prompts. Tracks last 80 prompts per session.
               window.MrMacsRecentTracker.markSeen(q)
               window.MrMacsRecentTracker.wasSeen(q) → bool
               window.MrMacsRecentTracker.clear()
               window.MrMacsRecentTracker.size() → number

   Idempotent: re-loading the script is a no-op (early return if loaded).
   MRMAC_QUESTION_VALIDATOR_V1
   ═══════════════════════════════════════════════════════════════════════ */
(function (w) {
  "use strict";
  if (!w) return;
  if (w.MrMacsValidQuestion && w.MrMacsPickValidQuestion && w.MrMacsRecentTracker) return;

  // Pedagogy-template fingerprints — any blob containing one of these is
  // treated as a leaked builder template that escaped the bank build.
  // Keep in sync with assets/shared-question-bank.js runtime self-clean.
  var TEMPLATE_NEEDLES = [
    "Specific evidence that proves a claim",
    "ignoring the source or data in the prompt",
    "describing a topic without explaining why it matters",
    "choosing an answer because it uses familiar words",
    "In an AP CED-aligned exam task",
    "In a NYS Framework-aligned exam task",
    "which concept is the best anchor for a NYS standards-aligned",
    "best avoids a common mistake about",
    "named anchor for this",
    "is a core idea in",
    "Synthesis response linking",
    "Foundational idea students identify"
  ];

  function isValidQuestion(q) {
    if (!q || typeof q !== "object") return false;
    if (!q.prompt || typeof q.prompt !== "string" || q.prompt.length < 8) return false;
    if (!q.correctText || typeof q.correctText !== "string") return false;
    if (!Array.isArray(q.choices) || q.choices.length !== 4) return false;
    for (var i = 0; i < 4; i++) {
      var c = q.choices[i];
      if (!c || typeof c !== "string" || c.trim().length < 3) return false;
    }
    if (q.choices.indexOf(q.correctText) === -1) return false;
    var blob = q.prompt + " " + q.correctText + " " + q.choices.join(" ");
    for (var j = 0; j < TEMPLATE_NEEDLES.length; j++) {
      if (blob.indexOf(TEMPLATE_NEEDLES[j]) !== -1) return false;
    }
    return true;
  }

  // Recently-seen tracker. Keeps a FIFO of the last RECENT_LIMIT prompts
  // shown in this session so picks rotate through the deep pool instead of
  // repeating after 5–10 questions. Resets only on page reload.
  var RECENT_LIMIT = 80;
  var recentQueue = [];
  var recentSet = Object.create(null);

  function keyOf(q) {
    if (!q || typeof q !== "object") return "";
    if (typeof q.prompt === "string" && q.prompt) return q.prompt;
    if (typeof q.id === "string" && q.id) return q.id;
    if (typeof q.question === "string" && q.question) return q.question;
    if (typeof q.stem === "string" && q.stem) return q.stem;
    return "";
  }

  function wasSeen(q) {
    var k = keyOf(q);
    return !!(k && recentSet[k]);
  }

  function markSeen(q) {
    var k = keyOf(q);
    if (!k) return;
    if (recentSet[k]) return;
    recentSet[k] = true;
    recentQueue.push(k);
    while (recentQueue.length > RECENT_LIMIT) {
      var drop = recentQueue.shift();
      delete recentSet[drop];
    }
  }

  function clearRecent() {
    recentQueue.length = 0;
    recentSet = Object.create(null);
  }

  function recentSize() { return recentQueue.length; }

  function pickValidQuestion(pickFn, maxTries) {
    if (typeof pickFn !== "function") return null;
    maxTries = (typeof maxTries === "number" && maxTries > 0) ? maxTries : 25;
    // Phase 1: prefer fresh (not recently seen) + valid
    for (var i = 0; i < maxTries; i++) {
      try {
        var q = pickFn();
        if (isValidQuestion(q) && !wasSeen(q)) {
          markSeen(q);
          return q;
        }
      } catch (e) {}
    }
    // Phase 2: pool may be exhausted — fall back to any valid Q (allow repeat)
    for (var k = 0; k < 5; k++) {
      try {
        var q2 = pickFn();
        if (isValidQuestion(q2)) {
          markSeen(q2);
          return q2;
        }
      } catch (e) {}
    }
    return null;
  }

  w.MrMacsValidQuestion = isValidQuestion;
  w.MrMacsPickValidQuestion = pickValidQuestion;
  w.MrMacsRecentTracker = {
    markSeen: markSeen,
    wasSeen: wasSeen,
    clear: clearRecent,
    size: recentSize
  };
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
