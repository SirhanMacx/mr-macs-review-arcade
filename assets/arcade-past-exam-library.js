/* arcade-past-exam-library.js
 *
 * Opens a modal listing curated REAL past-exam PDFs (NYSED Regents + College
 * Board AP) for the current practice-exam page.  Data source:
 * /data/public-exam-library.json — a curated catalog of links to PDFs hosted
 * by the original publishers (NYSED, CollegeBoard).
 *
 * Usage from a practice-exam.html page:
 *     <script src="../../assets/arcade-past-exam-library.js?v=20260516"></script>
 *     ...
 *     <button onclick="MrMacPastExams.open('regents-global-2')">📚 View Past Exams</button>
 *
 * No dependencies.  Self-contained CSS injected on first open.
 */
(function () {
  "use strict";

  const DATA_URL_CANDIDATES = [
    "../../data/public-exam-library.json",
    "/data/public-exam-library.json",
  ];

  let catalogPromise = null;
  function loadCatalog() {
    if (catalogPromise) return catalogPromise;
    catalogPromise = (async () => {
      let lastErr;
      for (const url of DATA_URL_CANDIDATES) {
        try {
          const resp = await fetch(url, { credentials: "omit" });
          if (resp.ok) return await resp.json();
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error("Could not load public-exam-library.json");
    })();
    return catalogPromise;
  }

  function ensureStylesInjected() {
    if (document.getElementById("mrmac-pastexams-styles")) return;
    const css = `
      .mrmac-pex-backdrop {
        position: fixed; inset: 0; background: rgba(8,12,24,0.78);
        backdrop-filter: blur(4px); z-index: 999999;
        display: flex; align-items: flex-start; justify-content: center;
        overflow: auto; padding: 40px 16px;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .mrmac-pex-modal {
        background: linear-gradient(180deg, #14182a 0%, #0c1020 100%);
        color: #e8ecf6; border: 1px solid rgba(255,255,255,0.12);
        border-radius: 14px; max-width: 880px; width: 100%;
        box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        padding: 24px 28px 28px;
      }
      .mrmac-pex-modal h2 {
        margin: 0 0 6px; font-size: 22px; letter-spacing: 0.01em;
      }
      .mrmac-pex-modal .mrmac-pex-sub {
        color: #aab0c4; font-size: 13.5px; margin-bottom: 16px;
      }
      .mrmac-pex-modal .mrmac-pex-sub a { color: #9fbcff; }
      .mrmac-pex-modal .mrmac-pex-list {
        list-style: none; padding: 0; margin: 16px 0 0;
        display: grid; gap: 8px;
      }
      .mrmac-pex-modal .mrmac-pex-list li {
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px; padding: 12px 14px;
        display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center;
      }
      .mrmac-pex-modal .mrmac-pex-list li .mrmac-pex-meta {
        flex: 1 1 360px; min-width: 0;
      }
      .mrmac-pex-modal .mrmac-pex-list li .mrmac-pex-title {
        font-weight: 600; font-size: 14.5px; line-height: 1.25;
      }
      .mrmac-pex-modal .mrmac-pex-list li .mrmac-pex-year {
        color: #94a3c4; font-size: 12px; margin-top: 2px;
      }
      .mrmac-pex-modal .mrmac-pex-list li .mrmac-pex-actions {
        display: flex; gap: 6px; flex-wrap: wrap;
      }
      .mrmac-pex-btn {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 7px 11px; border-radius: 7px; font-size: 12.5px;
        font-weight: 600; text-decoration: none; line-height: 1;
        background: rgba(159,188,255,0.16); color: #d8e3ff;
        border: 1px solid rgba(159,188,255,0.32);
        transition: background 0.15s, border-color 0.15s;
      }
      .mrmac-pex-btn:hover { background: rgba(159,188,255,0.28); border-color: rgba(159,188,255,0.55); }
      .mrmac-pex-btn.is-secondary {
        background: rgba(255,255,255,0.06); color: #c7d3ee;
        border-color: rgba(255,255,255,0.12);
      }
      .mrmac-pex-btn.is-extra {
        background: rgba(255,255,255,0.04); color: #94a3c4;
        border-color: rgba(255,255,255,0.08); font-weight: 500; font-size: 11.5px;
      }
      .mrmac-pex-btn.is-warn {
        background: rgba(255,180,80,0.12); color: #ffd194;
        border-color: rgba(255,180,80,0.28);
      }
      .mrmac-pex-close {
        background: transparent; border: none; color: #aab0c4;
        font-size: 22px; cursor: pointer; padding: 0; line-height: 1;
        float: right; margin-top: -4px;
      }
      .mrmac-pex-close:hover { color: #fff; }
      .mrmac-pex-empty {
        color: #aab0c4; padding: 16px; text-align: center;
        background: rgba(255,255,255,0.03); border-radius: 8px;
      }
      .mrmac-pex-loading { color: #aab0c4; font-style: italic; }
      .mrmac-pex-footer {
        margin-top: 18px; padding-top: 14px;
        border-top: 1px solid rgba(255,255,255,0.08);
        color: #7e89a8; font-size: 11.5px; line-height: 1.55;
      }
      @media (max-width: 540px) {
        .mrmac-pex-modal { padding: 18px 16px; border-radius: 12px; }
        .mrmac-pex-modal h2 { font-size: 18px; }
      }
      @media print { .mrmac-pex-backdrop { display: none !important; } }
    `;
    const style = document.createElement("style");
    style.id = "mrmac-pastexams-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function buildEntryHtml(ex) {
    const parts = [];
    parts.push(`<li>`);
    parts.push(`<div class="mrmac-pex-meta">`);
    parts.push(`<div class="mrmac-pex-title">${escapeHtml(ex.title || "Past Exam")}</div>`);
    parts.push(`<div class="mrmac-pex-year">${escapeHtml(ex.year || "")}${ex.status === "needs-verification" ? " · ⚠ link needs verification" : ""}</div>`);
    parts.push(`</div>`);
    parts.push(`<div class="mrmac-pex-actions">`);
    if (ex.examUrl) {
      parts.push(`<a class="mrmac-pex-btn" href="${escapeHtml(ex.examUrl)}" target="_blank" rel="noopener">📄 Exam PDF</a>`);
    } else {
      parts.push(`<span class="mrmac-pex-btn is-warn">No direct PDF — see source page</span>`);
    }
    if (ex.scoringGuideUrl) {
      parts.push(`<a class="mrmac-pex-btn is-secondary" href="${escapeHtml(ex.scoringGuideUrl)}" target="_blank" rel="noopener">📑 Scoring Guide</a>`);
    }
    if (Array.isArray(ex.additionalUrls)) {
      for (const a of ex.additionalUrls) {
        if (!a || !a.url) continue;
        parts.push(`<a class="mrmac-pex-btn is-extra" href="${escapeHtml(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.label || "Additional")}</a>`);
      }
    }
    parts.push(`</div>`);
    parts.push(`</li>`);
    return parts.join("");
  }

  function buildModalHtml(lib, courseKey) {
    const family = lib.examFamily || "";
    const sourceLabel = family === "AP"
      ? "College Board (apcentral.collegeboard.org)"
      : family === "NYS Grade 3-8"
        ? "NYSED Office of State Assessment"
        : "NYSED (nysedregents.org)";
    const entriesHtml = lib.exams && lib.exams.length
      ? `<ul class="mrmac-pex-list">${lib.exams.map(buildEntryHtml).join("")}</ul>`
      : `<div class="mrmac-pex-empty">No curated exams in the library yet for this course.</div>`;
    return `
      <div class="mrmac-pex-modal" role="dialog" aria-modal="true" aria-labelledby="mrmac-pex-title">
        <button class="mrmac-pex-close" type="button" aria-label="Close">×</button>
        <h2 id="mrmac-pex-title">📚 ${escapeHtml(lib.courseLabel || courseKey)} — Real Past Exams</h2>
        <div class="mrmac-pex-sub">
          Every link below opens a PDF hosted by the original publisher.
          Source: <a href="${escapeHtml(lib.sourceHomePage || "")}" target="_blank" rel="noopener">${escapeHtml(sourceLabel)}</a>
        </div>
        ${entriesHtml}
        <div class="mrmac-pex-footer">
          ${family === "AP"
            ? "College Board posts the three most recent years of free-response questions publicly. Full released exams (multiple-choice + FRQ) appear less often — usually once per decade. The CED PDF documents the full exam framework."
            : "NYSED keeps the most recent administrations posted; older exams remain available through the archive index linked above. Scoring/rating guides include the answer key plus rubrics."
          }
        </div>
      </div>
    `;
  }

  async function open(courseKey) {
    ensureStylesInjected();
    closeAnyOpen();
    const backdrop = document.createElement("div");
    backdrop.className = "mrmac-pex-backdrop";
    backdrop.innerHTML = `
      <div class="mrmac-pex-modal" role="dialog" aria-modal="true">
        <button class="mrmac-pex-close" type="button" aria-label="Close">×</button>
        <h2>📚 Loading past-exam library…</h2>
        <div class="mrmac-pex-loading">Fetching the curated catalog of real NYSED + AP PDFs…</div>
      </div>
    `;
    document.body.appendChild(backdrop);
    function close() {
      backdrop.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    backdrop.querySelector(".mrmac-pex-close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);

    try {
      const catalog = await loadCatalog();
      const lib = (catalog && catalog.libraries && catalog.libraries[courseKey]) || null;
      if (!lib) {
        backdrop.innerHTML = "";
        const modal = document.createElement("div");
        modal.className = "mrmac-pex-modal";
        modal.innerHTML = `
          <button class="mrmac-pex-close" type="button" aria-label="Close">×</button>
          <h2>📚 Past Exams</h2>
          <div class="mrmac-pex-empty">
            No curated past exams for this course yet (course key:
            <code>${escapeHtml(courseKey)}</code>).
            <br><br>
            Open the master library:
            <a class="mrmac-pex-btn" target="_blank" rel="noopener"
               href="https://www.nysedregents.org/">NYSED Regents archive</a>
            <a class="mrmac-pex-btn" target="_blank" rel="noopener"
               href="https://apcentral.collegeboard.org/">AP Central</a>
          </div>
        `;
        backdrop.appendChild(modal);
        modal.querySelector(".mrmac-pex-close").addEventListener("click", close);
      } else {
        backdrop.innerHTML = buildModalHtml(lib, courseKey);
        backdrop.querySelector(".mrmac-pex-close").addEventListener("click", close);
      }
    } catch (err) {
      backdrop.innerHTML = "";
      const modal = document.createElement("div");
      modal.className = "mrmac-pex-modal";
      modal.innerHTML = `
        <button class="mrmac-pex-close" type="button" aria-label="Close">×</button>
        <h2>📚 Past Exams</h2>
        <div class="mrmac-pex-empty">
          Could not load the catalog (offline?).
          <br><br>
          Browse directly:
          <a class="mrmac-pex-btn" target="_blank" rel="noopener" href="https://www.nysedregents.org/">NYSED Regents</a>
          <a class="mrmac-pex-btn" target="_blank" rel="noopener" href="https://apcentral.collegeboard.org/">AP Central</a>
        </div>
      `;
      backdrop.appendChild(modal);
      modal.querySelector(".mrmac-pex-close").addEventListener("click", close);
    }
  }

  function closeAnyOpen() {
    document.querySelectorAll(".mrmac-pex-backdrop").forEach((el) => el.remove());
  }

  // Public API
  window.MrMacPastExams = { open, close: closeAnyOpen, loadCatalog };
})();
