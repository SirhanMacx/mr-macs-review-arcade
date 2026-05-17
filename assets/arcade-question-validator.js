/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Arcade — Question Validator (defense-in-depth)
   Single source of truth for "is this question safe to render?".
   Sits behind every game's pickQuestion path so a stale cache, malformed
   bank row, or pedagogy-template leak can never silently reach the player.

   Public API: window.MrMacsValidQuestion(q)         → bool
               window.MrMacsPickValidQuestion(fn, n) → q | null

   Mirrors the runtime self-clean filter in assets/shared-question-bank.js
   but extended to include every template needle we've seen leak through.
   Idempotent: re-loading the script is a no-op (early return if loaded).
   MRMAC_QUESTION_VALIDATOR_V1
   ═══════════════════════════════════════════════════════════════════════ */
(function (w) {
  "use strict";
  if (!w) return;
  if (w.MrMacsValidQuestion && w.MrMacsPickValidQuestion) return; // idempotent

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

  function pickValidQuestion(pickFn, maxTries) {
    if (typeof pickFn !== "function") return null;
    maxTries = (typeof maxTries === "number" && maxTries > 0) ? maxTries : 10;
    for (var i = 0; i < maxTries; i++) {
      try {
        var q = pickFn();
        if (isValidQuestion(q)) return q;
      } catch (e) {
        // swallow — try again with a different random pick
      }
    }
    return null;
  }

  w.MrMacsValidQuestion = isValidQuestion;
  w.MrMacsPickValidQuestion = pickValidQuestion;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
