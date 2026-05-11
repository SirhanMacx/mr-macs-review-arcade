/* ═══════════════════════════════════════════════════════════════════════
   Mr. Mac's Arcade — Friday Practice export
   Generates a printable / save-as-PDF worksheet from the active
   profile's wrong-answer queue. Three formats:
     · worksheet   — questions with blank answer space + key at end
     · student     — student-facing copy only (no key)
     · key         — answer key only
   Opens in a new window/tab and auto-fires print(). Browsers' built-in
   "Save as PDF" produces a clean, classroom-handout-quality artifact.

   Public API: window.MrMacsFridayPractice
     .print(opts?)              — opts: { count, format, course }
     .render(opts?) → htmlString — opts as above; returns full HTML
                                   (useful for embedding / testing)
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  "use strict";
  if (root.MrMacsFridayPractice) return;

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getProfileMeta() {
    var name = "Trainer";
    var course = "";
    try {
      if (root.MrMacsProfile) {
        name = (root.MrMacsProfile.getName && root.MrMacsProfile.getName()) || "Trainer";
        course = (root.MrMacsProfile.getCourse && root.MrMacsProfile.getCourse()) || "";
      }
    } catch (e) {}
    return { name: name, course: course };
  }

  function getQueue(count) {
    if (!root.MrMacsProfile) return [];
    var all = [];
    try {
      if (typeof root.MrMacsProfile.getWrongAnswers === "function") {
        all = root.MrMacsProfile.getWrongAnswers(count) || [];
      } else if (typeof root.MrMacsProfile.get === "function") {
        var p = root.MrMacsProfile.get();
        all = (p && p.wrongAnswers) || [];
      }
    } catch (e) {}
    return all.slice(0, count);
  }

  function todayLabel() {
    var d = new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
  }

  function buildHtml(items, opts) {
    var meta = getProfileMeta();
    var format = opts.format || "worksheet";
    var showKey = format === "worksheet" || format === "key";
    var showQuestions = format === "worksheet" || format === "student";

    // Group items by course so worksheets can be sliced per-class
    var byCourse = {};
    items.forEach(function (it) {
      var c = it.course || "Mixed Review";
      byCourse[c] = byCourse[c] || [];
      byCourse[c].push(it);
    });

    var styles = [
      "@page { margin: 0.6in; }",
      "* { box-sizing: border-box; }",
      "body { font-family: 'Georgia', 'Times New Roman', serif; color: #111; max-width: 720px; margin: 0 auto; padding: 18px; line-height: 1.45; }",
      ".fp-head { border-bottom: 3px solid #111; padding-bottom: 10px; margin-bottom: 18px; }",
      ".fp-title { font-family: 'Georgia', serif; font-weight: 900; font-size: 26px; letter-spacing: -0.01em; margin: 0; }",
      ".fp-sub   { font-family: 'Helvetica', sans-serif; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin: 4px 0 0; }",
      ".fp-meta-row { display: flex; gap: 18px; flex-wrap: wrap; margin: 10px 0 0; font-family: 'Helvetica', sans-serif; font-size: 12px; }",
      ".fp-meta-row span { color: #333; }",
      ".fp-meta-row strong { color: #111; }",
      ".fp-stamp { float: right; font-family: 'Helvetica', sans-serif; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #777; }",
      ".fp-namelines { display: flex; gap: 30px; margin: 14px 0 18px; font-family: 'Helvetica', sans-serif; font-size: 11px; color: #444; }",
      ".fp-namelines span { flex: 1; border-bottom: 1px solid #555; padding-bottom: 4px; }",
      ".fp-course-head { margin: 18px 0 8px; padding: 4px 8px; background: #f0eee8; border-left: 4px solid #b58a2a; font-family: 'Helvetica', sans-serif; font-size: 11px; letter-spacing: 0.10em; text-transform: uppercase; font-weight: 700; color: #333; }",
      ".fp-q { margin: 14px 0 18px; page-break-inside: avoid; }",
      ".fp-q-num { display: inline-block; font-weight: 700; min-width: 1.6em; }",
      ".fp-q-prompt { font-size: 14px; margin: 0 0 8px; }",
      ".fp-q-answer-space { border-bottom: 1px solid #999; min-height: 26px; margin-top: 4px; }",
      ".fp-q-context { font-family: 'Helvetica', sans-serif; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-top: 4px; }",
      ".fp-key-head { margin: 32px 0 10px; padding-top: 14px; border-top: 2px solid #111; font-family: 'Helvetica', sans-serif; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 800; color: #b58a2a; }",
      ".fp-key { font-family: 'Helvetica', sans-serif; font-size: 11px; line-height: 1.5; columns: 2; column-gap: 24px; color: #222; }",
      ".fp-key div { margin-bottom: 4px; break-inside: avoid; }",
      ".fp-foot { margin-top: 26px; padding-top: 8px; border-top: 1px solid #ccc; font-family: 'Helvetica', sans-serif; font-size: 9px; letter-spacing: 0.10em; text-transform: uppercase; color: #999; text-align: center; }",
      "@media print { body { padding: 0; } .fp-no-print { display: none; } }",
      ".fp-no-print { padding: 10px; background: #fffbe5; border: 1px dashed #b58a2a; border-radius: 6px; margin-bottom: 18px; font-family: 'Helvetica', sans-serif; font-size: 12px; }",
      ".fp-no-print button { margin-left: 8px; padding: 6px 12px; cursor: pointer; }"
    ].join("\n");

    var html = "";
    html += "<!doctype html><html><head><meta charset='utf-8'>";
    html += "<title>Friday Practice — " + escHtml(meta.name) + "</title>";
    html += "<style>" + styles + "</style>";
    html += "</head><body>";

    // Non-print hint banner
    html += "<div class='fp-no-print'>📄 Friday Practice worksheet ready. ";
    html += "<button onclick='window.print()' type='button'>Print / Save as PDF</button> ";
    html += "<button onclick='window.close()' type='button'>Close</button>";
    html += "</div>";

    // Header
    html += "<div class='fp-head'>";
    html += "<span class='fp-stamp'>Mr. Mac's Arcade · Friday Practice</span>";
    html += "<h1 class='fp-title'>Friday Practice</h1>";
    html += "<p class='fp-sub'>Personalized review · pulled from your wrong-answer queue</p>";
    html += "<div class='fp-meta-row'>";
    html += "<span><strong>Student:</strong> " + escHtml(meta.name) + "</span>";
    if (meta.course) html += "<span><strong>Course:</strong> " + escHtml(meta.course) + "</span>";
    html += "<span><strong>Date:</strong> " + escHtml(todayLabel()) + "</span>";
    html += "<span><strong>Questions:</strong> " + items.length + "</span>";
    html += "</div>";
    html += "</div>";

    // Name/period writing lines
    html += "<div class='fp-namelines'>";
    html += "<span>Name: ____________________</span>";
    html += "<span>Period: ____</span>";
    html += "<span>Score: _____ / " + items.length + "</span>";
    html += "</div>";

    // Body: questions grouped by course
    if (showQuestions) {
      var globalNum = 1;
      Object.keys(byCourse).forEach(function (course) {
        html += "<div class='fp-course-head'>" + escHtml(course) + "</div>";
        byCourse[course].forEach(function (item) {
          html += "<div class='fp-q'>";
          html += "<span class='fp-q-num'>" + globalNum + ".</span>";
          html += "<span class='fp-q-prompt'>" + escHtml(item.prompt || "(no prompt)") + "</span>";
          html += "<div class='fp-q-answer-space' aria-label='Answer space'></div>";
          if (item.set) {
            html += "<div class='fp-q-context'>" + escHtml(String(item.set)) + "</div>";
          }
          html += "</div>";
          globalNum++;
        });
      });
    }

    // Answer key
    if (showKey) {
      html += "<div class='fp-key-head'>Answer Key" + (format === "key" ? "" : " — Fold under or remove before distribution") + "</div>";
      html += "<div class='fp-key'>";
      var keyNum = 1;
      Object.keys(byCourse).forEach(function (course) {
        byCourse[course].forEach(function (item) {
          html += "<div><strong>" + keyNum + ".</strong> " + escHtml(item.answer || "(see source)") + "</div>";
          keyNum++;
        });
      });
      html += "</div>";
    }

    html += "<div class='fp-foot'>Generated " + escHtml(todayLabel()) + " · Mr. Mac's Review Arcade · sirhanmacx.github.io/mr-macs-review-arcade</div>";
    html += "</body></html>";
    return html;
  }

  function render(opts) {
    opts = opts || {};
    var count = Math.max(1, Math.min(80, Number(opts.count) || 20));
    var items = getQueue(count);
    return buildHtml(items, { format: opts.format || "worksheet" });
  }

  function printPractice(opts) {
    opts = opts || {};
    var count = Math.max(1, Math.min(80, Number(opts.count) || 20));
    var items = getQueue(count);
    if (!items.length) {
      // Friendly fallback when the queue is empty
      var msg = "No wrong answers in your queue yet. Play a few games — your missed " +
                "questions will land here for a personalized practice handout.";
      try {
        if (root.MrMacsToast && root.MrMacsToast.push) {
          root.MrMacsToast.push({ icon: "info", title: "Nothing to print yet", sub: msg, tone: "info", ms: 5000 });
        } else {
          alert(msg);
        }
      } catch (e) { alert(msg); }
      return false;
    }
    var html = buildHtml(items, { format: opts.format || "worksheet" });
    // Open in a new window/tab + auto-fire print after load
    var w = window.open("", "_blank", "noopener=yes,width=900,height=900");
    if (!w) {
      alert("Pop-up blocked. Allow pop-ups for Mr. Mac's Arcade and try again.");
      return false;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Auto-print after layout (small delay so styles apply)
    setTimeout(function () {
      try { w.focus(); w.print(); } catch (e) {}
    }, 400);
    return true;
  }

  // ─── Wire the profile-drawer button ──────────────────────────────────
  function wireButton() {
    var btn = document.getElementById("fridayPrintBtn");
    if (!btn) return;
    if (btn.__fridayWired) return;
    btn.__fridayWired = true;
    btn.addEventListener("click", function () {
      var count = parseInt((document.getElementById("fridayCount") || {}).value || "20", 10);
      var format = (document.getElementById("fridayFormat") || {}).value || "worksheet";
      printPractice({ count: count, format: format });
    });
  }

  function init() {
    wireButton();
    // Re-wire if profile drawer is re-rendered (e.g., profile switch)
    if (root.MrMacsProfile && typeof root.MrMacsProfile.on === "function") {
      root.MrMacsProfile.on("profile:update", wireButton);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  root.MrMacsFridayPractice = {
    print: printPractice,
    render: render
  };
})(typeof window !== "undefined" ? window : globalThis);
