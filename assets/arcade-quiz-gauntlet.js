/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Arcade — Quiz Gauntlet
   A drop-in quiz engine that any course-landing page can use to become
   a real playable surface. Pulls questions from the shared bank
   (window.DIAG_BANK_BY_COURSE), respects the wrong-answer queue
   (window.MrMacsReviewMix), records to leaderboards
   (window.MrMacsLeaderboards), and submits wrong answers to the SR
   queue (window.MrMacsProfile.recordAnswer).

   USAGE (in any course-landing page):

     <button data-quiz-gauntlet-start
             data-course="ap-psychology"
             data-course-label="AP Psychology"
             data-rounds="15">
       ▶ START GAUNTLET
     </button>
     <script src="../../assets/arcade-quiz-gauntlet.js" defer></script>

   The button mounts a click handler that opens a full-screen quiz
   modal. The course attribute maps to a shared-bank course id.

   Public API: window.MrMacsQuizGauntlet
     .open(opts)         — opens the gauntlet directly
     .available()        — bool: are bank + profile loaded?
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  if (root.MrMacsQuizGauntlet) return;

  var STYLE_ID = "mmq-gauntlet-styles";
  var DEFAULT_ROUNDS = 15;
  var MAX_ROUNDS = 30;

  function bank() { return root.DIAG_BANK_BY_COURSE || {}; }
  function profile() { return root.MrMacsProfile; }
  function leaderboards() { return root.MrMacsLeaderboards; }

  function available() {
    return typeof bank() === "object" && Object.keys(bank()).length > 0;
  }

  // Resolve a course identifier to a bank key.
  // Course-id mapping: each course-landing page passes a logical id
  // (apush, global-10-units, etc.) that we map to one or more bank
  // keys.
  function resolveBankKey(courseId) {
    if (!courseId) return null;
    var MAP = {
      "apush": "ap-us-history",
      "ap-us-history": "ap-us-history",
      "ap-european-history": "ap-european-history",
      "ap-world-history": "ap-world-history",
      "ap-human-geography": "ap-human-geography",
      "ap-macroeconomics": "ap-macroeconomics",
      "ap-microeconomics": "ap-microeconomics",
      "ap-economics-combined": "ap-macroeconomics",  // fall-back
      "ap-psychology": "ap-psychology",
      "ap-us-government": "ap-us-government",
      "civics-pig": "us-government",
      "economics": "economics",
      "global-9": "global-9",
      "global-10-units": "global-10",
      "global-regents-sprint": "global-10",
      "grade-5": "grade-5",
      "grade-6": "grade-6",
      "grade-7": "grade-7",
      "grade-8": "grade-8",
      "us-history-units": "us-history",
      "us-regents-sprint": "us-history"
    };
    return MAP[courseId] || courseId;
  }

  // For courses that map to multiple banks (e.g. boss-rush pulls
  // every AP course). Returns array of bank keys.
  function resolveBankKeys(courseId) {
    if (courseId === "boss-rush" || courseId === "all") {
      return Object.keys(bank());
    }
    if (courseId === "ap-practice-exam" || courseId === "ap-courses") {
      return Object.keys(bank()).filter(function (k) { return k.indexOf("ap-") === 0; });
    }
    var single = resolveBankKey(courseId);
    return single ? [single] : [];
  }

  function injectStyles() {
    if (!document || !document.head) return;
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ".mmq-overlay { position: fixed; inset: 0; z-index: 9990;",
      "  background: radial-gradient(ellipse at center, rgba(8,12,24,.96) 0%, rgba(2,4,12,.99) 75%);",
      "  display: grid; place-items: center; padding: 16px;",
      "  font-family: 'Inter', system-ui, sans-serif; color: #f0f5ff;",
      "  animation: mmqIn 200ms ease-out; }",
      "@keyframes mmqIn { from { opacity: 0; } to { opacity: 1; } }",
      ".mmq-panel { width: min(680px, 100%); max-height: 90vh; overflow-y: auto;",
      "  background: linear-gradient(180deg, #11151f, #06070d);",
      "  border: 2px solid rgba(255, 208, 96, 0.45);",
      "  border-radius: 12px; padding: 28px;",
      "  box-shadow: 0 32px 80px rgba(0,0,0,.7); }",
      ".mmq-close { position: absolute; top: 18px; right: 22px;",
      "  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);",
      "  color: rgba(255,255,255,.7); font-size: 18px; line-height: 1;",
      "  width: 36px; height: 36px; border-radius: 50%; cursor: pointer; }",
      ".mmq-close:hover { background: rgba(255,255,255,.15); color: #fff; }",
      ".mmq-kicker { font-family: 'JetBrains Mono', monospace;",
      "  font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;",
      "  color: #ffd060; margin: 0 0 6px; }",
      ".mmq-title { margin: 0 0 14px;",
      "  font-family: 'Fraunces', Georgia, serif; font-style: italic;",
      "  font-size: clamp(22px, 4vw, 28px); font-weight: 800; color: #f5f7fb; }",
      ".mmq-hud { display: flex; gap: 18px; margin: 0 0 14px;",
      "  font-family: 'JetBrains Mono', monospace; font-size: 12px; }",
      ".mmq-hud .mmq-stat { display: flex; flex-direction: column; gap: 2px; }",
      ".mmq-hud .mmq-stat-num { font-size: 22px; font-weight: 800; color: #ffd060;",
      "  text-shadow: 0 0 10px rgba(255, 208, 96, 0.45); line-height: 1; }",
      ".mmq-hud .mmq-stat-label { font-size: 9px; letter-spacing: .14em;",
      "  text-transform: uppercase; color: rgba(216,220,235,.6); }",
      ".mmq-progress { height: 6px; background: rgba(255,255,255,.06);",
      "  border-radius: 3px; overflow: hidden; margin: 0 0 18px; }",
      ".mmq-progress > div { height: 100%; background: linear-gradient(90deg, #5de0f0, #ffd060);",
      "  transition: width 200ms; }",
      ".mmq-prompt { font-size: clamp(15px, 2.6vw, 18px); line-height: 1.45;",
      "  margin: 0 0 18px; color: #f0f5ff; font-weight: 600; }",
      ".mmq-choices { display: grid; gap: 10px; margin: 0 0 12px; }",
      ".mmq-choice { display: flex; align-items: center; gap: 12px;",
      "  width: 100%; padding: 14px 16px;",
      "  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.10);",
      "  border-radius: 8px; color: #f0f5ff; text-align: left;",
      "  font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer;",
      "  transition: border-color 150ms, background 150ms; }",
      ".mmq-choice:hover, .mmq-choice:focus-visible {",
      "  border-color: rgba(255, 208, 96, 0.55); background: rgba(255, 208, 96, 0.06); outline: none; }",
      ".mmq-choice.is-correct { background: rgba(77,212,155,.18); border-color: #4dd49b; }",
      ".mmq-choice.is-wrong { background: rgba(240,72,96,.18); border-color: #f04860; }",
      ".mmq-choice .mmq-letter { display: inline-block; min-width: 1.4em;",
      "  font-family: 'Press Start 2P', monospace; font-size: 11px; color: #ffd060; }",
      ".mmq-explain { padding: 12px 14px; background: rgba(93,224,240,.08);",
      "  border-left: 3px solid #5de0f0; border-radius: 4px; margin: 12px 0 0;",
      "  font-size: 13px; line-height: 1.45; color: rgba(216,220,235,.88); }",
      ".mmq-next { display: block; width: 100%; margin: 16px 0 0;",
      "  padding: 14px 18px; background: linear-gradient(135deg, #ffd060, #f5c451);",
      "  color: #14100a; border: 0; border-radius: 10px;",
      "  font: 800 14px/1 'Inter', sans-serif; cursor: pointer; }",
      ".mmq-next:hover { transform: translateY(-1px);",
      "  box-shadow: 0 10px 22px rgba(245, 196, 81, 0.42); }",
      ".mmq-final { text-align: center; }",
      ".mmq-final-score { font-family: 'Press Start 2P', monospace;",
      "  font-size: clamp(28px, 6vw, 44px); color: #ffd060;",
      "  text-shadow: 0 0 18px rgba(255, 208, 96, 0.55); margin: 14px 0; }",
      ".mmq-final-stats { display: flex; justify-content: center; gap: 22px;",
      "  margin: 18px 0; flex-wrap: wrap; }",
      ".mmq-final-stats > div { font-family: 'JetBrains Mono', monospace;",
      "  font-size: 12px; color: rgba(216,220,235,.78); }",
      ".mmq-final-stats strong { display: block; font-size: 22px; color: #5de0f0; }",
      ".mmq-final-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }",
      ".mmq-secondary { padding: 12px 18px; background: rgba(255,255,255,.06);",
      "  border: 1px solid rgba(255,255,255,.14); color: #f0f5ff;",
      "  border-radius: 8px; cursor: pointer; font: 700 13px/1 'Inter', sans-serif; }",
      "@media (max-width: 540px) { .mmq-panel { padding: 18px; }",
      "  .mmq-hud { gap: 14px; } .mmq-hud .mmq-stat-num { font-size: 18px; } }"
    ].join("\n");
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function escHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function getQuestions(courseId, n) {
    var keys = resolveBankKeys(courseId);
    var all = [];
    keys.forEach(function (k) {
      if (bank()[k] && Array.isArray(bank()[k])) {
        all = all.concat(bank()[k]);
      }
    });
    return shuffle(all).slice(0, n);
  }

  // ─── Main UX ──────────────────────────────────────────────────────────
  function open(opts) {
    opts = opts || {};
    var courseId = opts.courseId || opts.course || "";
    var courseLabel = opts.courseLabel || courseId || "Quiz Gauntlet";
    var rounds = Math.max(3, Math.min(MAX_ROUNDS, Number(opts.rounds) || DEFAULT_ROUNDS));
    var gameId = opts.gameId || (courseId + "-gauntlet");

    var questions = getQuestions(courseId, rounds);
    if (!questions.length) {
      alert("No questions available for " + courseLabel + " yet. Check back soon!");
      return;
    }
    rounds = Math.min(rounds, questions.length);

    injectStyles();
    var overlay = document.createElement("div");
    overlay.className = "mmq-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = '<div class="mmq-panel" style="position:relative;">' +
                          '<button class="mmq-close" aria-label="Close gauntlet">×</button>' +
                          '<div class="mmq-content"></div>' +
                        '</div>';
    document.body.appendChild(overlay);
    var content = overlay.querySelector(".mmq-content");

    var idx = 0;
    var correct = 0;
    var streak = 0;
    var bestStreak = 0;
    var startTs = Date.now();

    function renderQuestion() {
      if (idx >= rounds) return renderFinal();
      var q = questions[idx];
      var letters = ["A","B","C","D"];
      var shuffledChoices = shuffle(q.choices || []);
      var pct = Math.round((idx / rounds) * 100);
      content.innerHTML =
        '<p class="mmq-kicker">' + escHtml(courseLabel) + ' Gauntlet</p>' +
        '<h2 class="mmq-title">Question ' + (idx + 1) + ' of ' + rounds + '</h2>' +
        '<div class="mmq-hud">' +
          '<div class="mmq-stat"><span class="mmq-stat-num">' + correct + '</span><span class="mmq-stat-label">Correct</span></div>' +
          '<div class="mmq-stat"><span class="mmq-stat-num">' + streak + '</span><span class="mmq-stat-label">Streak</span></div>' +
          '<div class="mmq-stat"><span class="mmq-stat-num">' + Math.round(((idx===0?0:correct/idx)*100)) + '%</span><span class="mmq-stat-label">Accuracy</span></div>' +
        '</div>' +
        '<div class="mmq-progress"><div style="width:' + pct + '%"></div></div>' +
        '<p class="mmq-prompt">' + escHtml(q.prompt) + '</p>' +
        '<div class="mmq-choices">' +
          shuffledChoices.map(function (c, i) {
            return '<button class="mmq-choice" type="button" data-choice="' + escHtml(c) + '">' +
                     '<span class="mmq-letter">' + letters[i] + '</span>' +
                     '<span>' + escHtml(c) + '</span>' +
                   '</button>';
          }).join('') +
        '</div>';
      content.querySelectorAll(".mmq-choice").forEach(function (btn) {
        btn.addEventListener("click", function () { onAnswer(q, btn); });
      });
    }

    function onAnswer(q, btn) {
      var picked = btn.dataset.choice;
      var wasCorrect = picked === q.correctText;
      // Lock buttons
      content.querySelectorAll(".mmq-choice").forEach(function (b) {
        b.disabled = true;
        if (b.dataset.choice === q.correctText) b.classList.add("is-correct");
        else if (b === btn) b.classList.add("is-wrong");
      });
      if (wasCorrect) {
        correct++; streak++;
        if (streak > bestStreak) bestStreak = streak;
      } else {
        streak = 0;
        // Record to wrong-answer queue
        if (profile() && profile().recordAnswer) {
          try {
            profile().recordAnswer({
              course: q.course || courseId,
              set: q.topic || "Gauntlet",
              correct: false,
              prompt: q.prompt,
              answer: q.correctText,
              gameId: gameId
            });
          } catch (e) {}
        }
      }
      if (profile() && profile().recordAnswer && wasCorrect) {
        try {
          profile().recordAnswer({
            course: q.course || courseId,
            set: q.topic || "Gauntlet",
            correct: true,
            prompt: q.prompt,
            answer: q.correctText,
            gameId: gameId
          });
        } catch (e) {}
      }
      // Append "Next" button
      var nextBtn = document.createElement("button");
      nextBtn.className = "mmq-next";
      nextBtn.type = "button";
      nextBtn.textContent = idx + 1 >= rounds ? "See Results →" : "Next Question →";
      nextBtn.addEventListener("click", function () { idx++; renderQuestion(); });
      content.appendChild(nextBtn);
      nextBtn.focus();
    }

    function renderFinal() {
      var acc = Math.round((correct / rounds) * 100);
      var dur = Math.round((Date.now() - startTs) / 1000);
      var score = correct * 100 + bestStreak * 50;
      // Submit to leaderboard
      if (leaderboards() && leaderboards().submit) {
        try {
          leaderboards().submit({ gameId: gameId, score: score, meta: { rounds: rounds, accuracy: acc, course: courseId } });
        } catch (e) {}
      }
      // Award shards
      var shards = Math.round(score / 10);
      if (profile() && profile().addShards) {
        try { profile().addShards(shards, gameId); } catch (e) {}
      }
      content.innerHTML =
        '<div class="mmq-final">' +
          '<p class="mmq-kicker">' + escHtml(courseLabel) + ' Gauntlet · Complete</p>' +
          '<h2 class="mmq-title">' + (acc >= 80 ? "Mastery Run!" : acc >= 60 ? "Solid Run." : "Keep Pushing.") + '</h2>' +
          '<div class="mmq-final-score">' + score + '</div>' +
          '<div class="mmq-final-stats">' +
            '<div><strong>' + correct + '/' + rounds + '</strong>Correct</div>' +
            '<div><strong>' + acc + '%</strong>Accuracy</div>' +
            '<div><strong>' + bestStreak + '</strong>Best Streak</div>' +
            '<div><strong>+' + shards + ' 💎</strong>Shards</div>' +
            '<div><strong>' + dur + 's</strong>Time</div>' +
          '</div>' +
          '<div class="mmq-final-actions">' +
            '<button class="mmq-next" data-action="again">▶ Try Again</button>' +
            '<button class="mmq-secondary" data-action="close">← Back to Course</button>' +
          '</div>' +
        '</div>';
      content.querySelector('[data-action="again"]').addEventListener("click", function () {
        overlay.remove(); open(opts);
      });
      content.querySelector('[data-action="close"]').addEventListener("click", function () {
        overlay.remove();
      });
    }

    overlay.querySelector(".mmq-close").addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    // ESC to close
    document.addEventListener("keydown", function escListener(e) {
      if (e.key === "Escape" && document.body.contains(overlay)) {
        overlay.remove();
        document.removeEventListener("keydown", escListener);
      }
    });

    renderQuestion();
  }

  // ─── Auto-wire any [data-quiz-gauntlet-start] button on the page ───
  function autowire() {
    var btns = document.querySelectorAll("[data-quiz-gauntlet-start]");
    btns.forEach(function (btn) {
      if (btn.__mmqWired) return;
      btn.__mmqWired = true;
      btn.addEventListener("click", function () {
        open({
          courseId: btn.dataset.course || "",
          courseLabel: btn.dataset.courseLabel || btn.dataset.course || "Gauntlet",
          rounds: parseInt(btn.dataset.rounds, 10) || DEFAULT_ROUNDS,
          gameId: btn.dataset.gameId || (btn.dataset.course + "-gauntlet")
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autowire);
  } else {
    autowire();
  }

  root.MrMacsQuizGauntlet = {
    open: open,
    available: available,
    resolveBankKey: resolveBankKey,
    resolveBankKeys: resolveBankKeys
  };
})(typeof window !== "undefined" ? window : globalThis);
