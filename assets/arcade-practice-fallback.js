/* arcade-practice-fallback.js
   Bridges the umbrella practice-exam pickers (ap-practice-exam +
   regents-practice-exam) to the 57 individual per-course practice exams
   listed in games.json.

   The umbrella pickers were originally built around a small set of
   PDF-anchored official forms (~6 AP, ~2 Regents). Every OTHER course
   shipped its own per-course MCQ practice exam, but those weren't
   reachable from the umbrella dropdown — so students hitting the
   "Practice AP Exam" or "Regents Practice Exam" tile for, say, AP Bio
   or Algebra II would see a dropdown with no matching option and assume
   the feature was broken.

   This shim:
     1. Detects which umbrella it's running under (data-fallback-scope)
     2. Polls until #courseSelect is populated by the host picker
     3. Fetches games.json and harvests every gameType="Practice Exam"
        entry matching this scope (AP / non-AP)
     4. Appends a "Mr. Mac's Quick Practice — <Course>" option for every
        course not already in the dropdown
     5. Hijacks the #startBtn click — if the selected option's value
        starts with "redirect:", it navigates to that per-course HTML
        instead of running the umbrella's start logic

   Hosts: both umbrella picker HTMLs include this script with a body
   attribute `data-fallback-scope="ap"` or `data-fallback-scope="regents"`.
================================================================ */
(function () {
  "use strict";

  var SCOPE = (document.body && document.body.dataset && document.body.dataset.fallbackScope) || "ap";
  // SCOPE === "ap" → only AP courses
  // SCOPE === "regents" → Regents + Grade K-8 + non-AP courses

  function $(id) { return document.getElementById(id); }

  function isAPCourse(course) {
    return /^AP\b/i.test(String(course || ""));
  }

  function matchesScope(entry) {
    var c = String(entry.course || "");
    if (SCOPE === "ap") return isAPCourse(c);
    if (SCOPE === "regents") return !isAPCourse(c);
    return true;
  }

  function normalizeName(s) {
    return String(s || "").toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\bap\b/g, "")
      .replace(/\bpractice\b/g, "")
      .replace(/\bexam\b/g, "")
      .trim();
  }

  // Compare two strings loosely — used to detect whether an entry's course
  // is already represented in the host picker's dropdown.
  function looselyMatches(a, b) {
    var na = normalizeName(a);
    var nb = normalizeName(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    // Substring either direction (e.g. "AP United States History" vs "AP U.S. History")
    if (na.indexOf(nb) >= 0 || nb.indexOf(na) >= 0) return true;
    return false;
  }

  function findCourseSelect() {
    return $("courseSelect");
  }

  function existingOptions(sel) {
    if (!sel) return [];
    var out = [];
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      out.push({
        value: o.value,
        text: o.textContent || o.innerText || "",
        dataCourse: o.dataset && o.dataset.course
      });
    }
    return out;
  }

  function fetchPracticeEntries() {
    return fetch("../../games.json")
      .then(function (r) { return r.json(); })
      .then(function (entries) {
        return (entries || []).filter(function (e) {
          return e && e.gameType === "Practice Exam"
            && e.file && /\bpractice-exam\.html$/.test(e.file)
            && matchesScope(e);
        });
      })
      .catch(function () { return []; });
  }

  function augmentDropdown() {
    var sel = findCourseSelect();
    if (!sel) return Promise.resolve(false);
    return fetchPracticeEntries().then(function (entries) {
      if (!entries.length) return false;
      var have = existingOptions(sel);
      var added = 0;
      entries.forEach(function (entry) {
        // Skip if the host picker already has this course
        var dupe = have.some(function (opt) {
          return looselyMatches(opt.text, entry.title)
              || looselyMatches(opt.text, entry.course)
              || (opt.dataCourse && looselyMatches(opt.dataCourse, entry.course));
        });
        if (dupe) return;
        // Skip if we already appended this redirect option
        var alreadyAppended = false;
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value === "redirect:" + entry.file) {
            alreadyAppended = true;
            break;
          }
        }
        if (alreadyAppended) return;
        var opt = document.createElement("option");
        opt.value = "redirect:" + entry.file;
        opt.textContent = "Mr. Mac's Quick Practice — " + (entry.course || entry.title);
        opt.dataset.fallback = "1";
        opt.dataset.course = entry.course || "";
        opt.dataset.targetFile = entry.file;
        sel.appendChild(opt);
        added++;
      });
      if (added > 0) {
        // Fire a synthetic change so any "preview" panel re-renders gracefully.
        try {
          var evt = new Event("change", { bubbles: true });
          sel.dispatchEvent(evt);
        } catch (_e) {}
        // Re-enable startBtn in case the host disabled it during load failure.
        var startBtn = $("startBtn");
        if (startBtn && startBtn.disabled) startBtn.disabled = false;
      }
      return added > 0;
    });
  }

  function interceptStart() {
    var startBtn = $("startBtn");
    if (!startBtn) return;
    // Use capture to intercept BEFORE the host picker's own click handler.
    startBtn.addEventListener("click", function (ev) {
      var sel = findCourseSelect();
      if (!sel) return;
      var val = sel.value || "";
      if (val.indexOf("redirect:") !== 0) return; // not a fallback option — let host handle
      ev.preventDefault();
      ev.stopPropagation();
      var file = val.slice("redirect:".length);
      // Honor base href if any
      window.location.href = "../../" + file;
    }, true);
  }

  function showFallbackHint() {
    // Cosmetic: if the host's setup panel exists, slip in a one-liner so
    // students notice the new options without surprise.
    var panels = document.querySelectorAll(".setup-panel, .panel.setup-panel, .format-panel");
    if (!panels.length) return;
    var hint = document.createElement("p");
    hint.className = "fallback-hint";
    hint.style.cssText = "margin:8px 0 0;font-size:11px;color:#9aa6c6;letter-spacing:.4px;";
    hint.innerHTML = "★ Course not in the official-PDF list? Pick a " +
      "<em style=\"color:#ffce3a;font-style:normal\">Mr. Mac's Quick Practice</em> " +
      "option below for a 30-45 question MCQ exam built from our bank.";
    // Avoid double-injection
    if (!document.querySelector(".fallback-hint")) {
      panels[0].appendChild(hint);
    }
  }

  // The host picker populates #courseSelect on DOMContentLoaded — wait for it.
  function pollUntilReady(attempt) {
    attempt = attempt || 0;
    var sel = findCourseSelect();
    if (sel && sel.options.length > 0) {
      augmentDropdown().then(function (added) {
        interceptStart();
        if (added) showFallbackHint();
      });
      return;
    }
    if (attempt > 60) {
      // Host never populated — still wire up the dropdown ourselves so the
      // fallback path works even if the official-form fetch totally fails.
      if (sel && sel.options.length === 0) {
        augmentDropdown().then(function () {
          interceptStart();
          showFallbackHint();
        });
      }
      return;
    }
    setTimeout(function () { pollUntilReady(attempt + 1); }, 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { pollUntilReady(0); });
  } else {
    pollUntilReady(0);
  }
})();
