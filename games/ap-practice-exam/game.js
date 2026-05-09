(function () {
  "use strict";

  const DATA_VERSION = "2026-05-01-ap-source-pages-v8";
  const AP_RIGOR_VERSION = "2026-05-01-ap-skill-bands-v1";
  const OFFICIAL_URL = `../../data/ap-official-practice-exams.json?v=${DATA_VERSION}`;

  const state = {
    officialForms: [],
    selection: "apush-2017-ced-practice",
    exam: null,
    current: 0,
    answers: {},
    writing: {},
    startTime: 0,
    timerId: 0
  };

  const $ = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    wireEvents();
    try {
      const officialResponse = await fetch(OFFICIAL_URL);
      const officialData = await officialResponse.json();
      state.officialForms = officialData.forms || [];
      populateCourses();
      renderFormat();
    } catch (error) {
      $("formatPanel").innerHTML = `<p class="eyebrow">Load Error</p><h2>AP practice materials could not load.</h2><p>${escapeHtml(error.message)}</p>`;
      $("startBtn").disabled = true;
    }
  }

  function wireEvents() {
    $("courseSelect").addEventListener("change", (event) => {
      state.selection = event.target.value;
      renderFormat();
    });
    $("startBtn").addEventListener("click", startExam);
    $("finishBtn").addEventListener("click", scoreExam);
    $("retryBtn").addEventListener("click", () => {
      showScreen("setupScreen");
      $("timer").textContent = "--:--";
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSourceInspector();
    });
  }

  function populateCourses() {
    const official = state.officialForms.map((form) =>
      `<option value="${escapeHtml(form.id)}">Released AP exam: ${escapeHtml(form.label)}</option>`
    ).join("");
    $("courseSelect").innerHTML = official;
    if (!state.officialForms.some((form) => form.id === state.selection)) {
      state.selection = state.officialForms[0]?.id || "";
    }
    $("courseSelect").value = state.selection;
  }

  function renderFormat() {
    const form = state.officialForms.find((item) => item.id === state.selection) || state.officialForms[0];
    if (!form) return;
    const writing = form.writingTasks || [];
    $("formatPanel").innerHTML = `
      <p class="eyebrow">Released AP Exam Practice</p>
      <h2>${escapeHtml(form.title)}</h2>
      <ul class="format-list">
        <li><strong>${form.mcqCount} official MCQs</strong><span>Each question stays locked to its matching rendered PDF page.</span></li>
        <li><strong>${writing.length} writing tasks</strong><span>${writing.map((task) => `${task.label} (${task.max})`).join(", ")}</span></li>
        <li><strong>${form.minutes} minute timer</strong><span>Build stamina and pacing with a full-length practice run.</span></li>
        <li><strong>${state.officialForms.length} released forms in bank</strong><span>Score bands are practice estimates for this released-form practice.</span></li>
        <li><strong>Official link preserved</strong><span><a href="${escapeHtml(form.pdfUrl)}" target="_blank" rel="noopener">Open source PDF</a></span></li>
      </ul>
    `;
  }

  function startExam() {
    state.selection = $("courseSelect").value;
    state.answers = {};
    state.writing = {};
    state.current = 0;
    state.exam = buildOfficialExam(state.officialForms.find((form) => form.id === state.selection) || state.officialForms[0]);
    state.startTime = Date.now();
    startTimer();
    renderTabs();
    renderQuestion();
    requestAnimationFrame(() => $("questionCard")?.scrollIntoView({ block: "start", behavior: "auto" }));
    showScreen("examScreen");
    // Record play with the shared profile module so the hub Continue rail
    // and recent-game tracking pick this up.
    try {
      if (window.MrMacsProfile) {
        var formMeta = state.officialForms.find((form) => form.id === state.selection) || state.officialForms[0];
        window.MrMacsProfile.recordPlay({
          id: "ap-practice-exam",
          title: "Practice AP Exam — " + (formMeta && formMeta.title ? formMeta.title : state.selection),
          course: (formMeta && formMeta.course) || "AP",
          file: "games/ap-practice-exam/index.html"
        });
      }
    } catch (e) {}
  }

  function buildOfficialExam(form) {
    const answerKey = String(form.answerKey || "").trim().split("");
    const options = form.options || ["A", "B", "C", "D"];
    const mcq = answerKey.map((letter, index) => ({
      id: `mcq-${index}`,
      kind: "mcq",
      label: `MCQ ${index + 1}`,
      category: form.label,
      skill: "official PDF",
      correctIndex: options.indexOf(letter),
      choices: options,
      labels: options,
      stem: `Use the rendered official PDF page for the exact question and answer choices.`,
      source: form.sourceLabel,
      formId: form.id,
      officialPdf: form.pdfUrl,
      officialPage: questionPageFor(form, index + 1),
      officialPages: questionPagesFor(form, index + 1)
    }));
    const writing = (form.writingTasks || []).map((task) => ({
      ...task,
      kind: "writing",
      skill: "official rubric estimate",
      rigorVersion: AP_RIGOR_VERSION,
      skillTargets: skillTargetsForTask(task, form),
      prompt: `Use the official PDF prompt and scoring guide for ${task.label}. Enter your response here for a practice rubric estimate.`,
      bullets: task.rubricTokens || ["claim", "evidence", "explanation"],
      anchors: task.rubricTokens || [],
      formId: form.id,
      officialPdf: form.pdfUrl,
      officialPage: writingPageFor(form, task.id),
      officialPages: writingPagesFor(form, task.id),
      officialPageUrl: form.officialPageUrl
    }));
    return {
      sourceMode: "official",
      form,
      course: form.course,
      profile: { label: form.label, short: form.label, skills: ["official PDF"], family: "official" },
      mcq,
      writing,
      minutes: form.minutes || 120
    };
  }

  function skillTargetsForTask(task, form) {
    const label = `${task.label || ""} ${task.id || ""}`.toLowerCase();
    const course = String(form.course || "");
    if (/dbq/.test(label)) return ["defensible thesis", "document evidence", "outside evidence", "sourcing", "complexity"];
    if (/leq/.test(label)) return ["defensible thesis", "context", "specific evidence", "historical reasoning", "complexity"];
    if (/saq/.test(label)) return ["direct answer", "specific evidence", "explanation"];
    if (/Psychology/i.test(course)) return ["define terms", "apply to scenario", "method or data precision"];
    if (/Economics/i.test(course)) return ["correct graph logic", "directional change", "economic explanation"];
    return ["claim", "evidence", "reasoning"];
  }

  function questionPageFor(form, questionNumber) {
    const ranges = form.questionPageRanges || [];
    const match = ranges.find((range) => questionNumber >= range[0] && questionNumber <= range[1]);
    return match ? match[2] : form.pdfStartPage || 1;
  }

  function questionPagesFor(form, questionNumber) {
    const ranges = form.questionPageRanges || [];
    const rangeIndex = ranges.findIndex((range) => questionNumber >= range[0] && questionNumber <= range[1]);
    if (rangeIndex < 0) return [form.pdfStartPage || 1];
    const startPage = Number(ranges[rangeIndex][2]) || form.pdfStartPage || 1;
    const firstWritingPage = firstPageValue(form.writingPages);
    const nextRangePage = ranges[rangeIndex + 1] ? Number(ranges[rangeIndex + 1][2]) : firstWritingPage;
    const endPage = Math.max(startPage, (nextRangePage || startPage + 1) - 1);
    return usablePageSpan(form, startPage, endPage);
  }

  function writingPageFor(form, taskId) {
    return (form.writingPages || {})[taskId] || form.pdfStartPage || 1;
  }

  function writingPagesFor(form, taskId) {
    const entries = Object.entries(form.writingPages || {})
      .map(([id, page]) => ({ id, page: Number(page) }))
      .filter((entry) => Number.isFinite(entry.page))
      .sort((a, b) => a.page - b.page);
    const index = entries.findIndex((entry) => entry.id === taskId);
    if (index < 0) return [writingPageFor(form, taskId)];
    const startPage = entries[index].page;
    const nextPage = entries[index + 1]?.page;
    const endPage = Math.max(startPage, Math.min(nextPage ? nextPage - 1 : startPage, startPage + 5));
    return usablePageSpan(form, startPage, endPage);
  }

  function firstPageValue(map) {
    const values = Object.values(map || {}).map(Number).filter(Number.isFinite);
    return values.length ? Math.min(...values) : 0;
  }

  function pageSpan(startPage, endPage) {
    const pages = [];
    for (let page = Number(startPage); page <= Number(endPage); page += 1) {
      pages.push(page);
    }
    return pages;
  }

  function usablePageSpan(form, startPage, endPage) {
    const skipPages = new Set((form.skipPages || []).map(Number));
    const pages = pageSpan(startPage, endPage).filter((page) => !skipPages.has(page));
    return pages.length ? pages : pageSpan(startPage, endPage);
  }

  function renderTabs() {
    const tabs = [
      { id: "mcq", label: "MCQ", count: state.exam.mcq.length },
      ...state.exam.writing.map((task) => ({ id: task.id, label: task.label, count: task.max }))
    ];
    $("sectionTabs").innerHTML = tabs.map((tab, index) => `
      <button type="button" data-jump="${index}" class="${index === 0 ? "active" : ""}">
        <span>${escapeHtml(tab.label)}</span><small>${escapeHtml(String(tab.count))}</small>
      </button>
    `).join("");
    $("sectionTabs").querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        state.current = Number(button.dataset.jump);
        renderQuestion();
      });
    });
  }

  function renderQuestion() {
    $("sectionTabs").querySelectorAll("button").forEach((button, index) => button.classList.toggle("active", index === state.current));
    if (state.current === 0) renderMcq(Number(state.answers._mcqIndex || 0));
    else renderWriting(state.exam.writing[state.current - 1]);
    updateAnswered();
  }

  function renderMcq(index) {
    const question = state.exam.mcq[index];
    state.answers._mcqIndex = index;
    $("questionLabel").textContent = `${question.label} of ${state.exam.mcq.length}`;
    $("skillLabel").textContent = question.skill;
    $("prevBtn").textContent = "Previous";
    $("nextBtn").textContent = "Next";
    renderOfficialPage(index, question);
  }

  function renderOfficialMcq(index, question) {
    renderOfficialPage(index, question);
  }

  function renderOfficialPage(index, question) {
    state.answers._mcqIndex = index;
    const pages = question.officialPages?.length ? question.officialPages : [question.officialPage || 1];
    $("questionLabel").textContent = `Question ${index + 1} of ${state.exam.mcq.length}`;
    $("skillLabel").textContent = "Official AP page";
    $("questionCard").innerHTML = `
      <div class="released-page-runner">
        ${officialViewer(question.formId, pages, question.officialPdf, `${question.category} · ${pageLabel(pages)}`)}
        <section class="digital-panel" aria-label="Digital answer sheet">
          <div class="source-lock">Question ${index + 1} is locked to ${escapeHtml(pageLabel(pages))}</div>
          <div class="runner-head">
            <p class="eyebrow">Official Question</p>
            <h3>Question ${index + 1}</h3>
            <span>Rendered ${escapeHtml(pageLabel(pages))}</span>
          </div>
          <div class="stem">${escapeHtml(question.stem)}</div>
          <p class="answer-sheet-note">Read the exact wording and choices on the official page, then mark the matching answer here.</p>
          ${answerChoicesHtml(question)}
          ${answerMapHtml(index)}
        </section>
      </div>
    `;
    $("questionCard").querySelectorAll(".choice").forEach((button) => {
      button.addEventListener("click", () => {
        state.answers[question.id] = Number(button.dataset.choice);
        renderOfficialPage(index, question);
        updateAnswered();
      });
    });
    wireSourceTools($("questionCard"));
    $("questionCard").querySelectorAll("[data-qjump]").forEach((button) => {
      button.addEventListener("click", () => renderMcq(Number(button.dataset.qjump)));
    });
    $("prevBtn").disabled = index === 0;
    $("nextBtn").disabled = index === state.exam.mcq.length - 1;
    $("prevBtn").onclick = () => renderMcq(Math.max(0, index - 1));
    $("nextBtn").onclick = () => renderMcq(Math.min(state.exam.mcq.length - 1, index + 1));
  }

  function answerChoicesHtml(question) {
    return `
      <div class="answer-sheet-choices" aria-label="Digital answer choices">
        ${(question.labels || question.choices || ["A", "B", "C", "D"]).map((label, choiceIndex) => `
          <button type="button" class="choice answer-bubble ${state.answers[question.id] === choiceIndex ? "selected" : ""}" data-choice="${choiceIndex}" aria-label="Answer ${escapeHtml(label)}">
            <span class="letter">${escapeHtml(label)}</span>
            <span>Answer ${escapeHtml(label)}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  function answerMapHtml(activeIndex) {
    return `
      <div class="answer-map" aria-label="Question navigator">
        ${state.exam.mcq.map((question, index) => {
          const answered = Number.isInteger(state.answers[question.id]);
          const classes = ["qdot", answered ? "answered" : "", index === activeIndex ? "active" : ""].filter(Boolean).join(" ");
          return `<button type="button" class="${classes}" data-qjump="${index}" aria-label="Question ${index + 1}${answered ? " answered" : ""}">${index + 1}</button>`;
        }).join("")}
      </div>
    `;
  }

  function officialViewer(formId, pages, url, label) {
    const sourcePages = (pages || []).filter(Boolean);
    return `
      <div class="official-source" data-source-viewer data-form-id="${escapeHtml(formId)}" data-pages="${escapeHtml(sourcePages.join(","))}" data-pdf-url="${escapeHtml(url)}" data-source-label="${escapeHtml(label || "Official AP PDF")}">
        <div class="official-source-head">
          <div class="source-title">
            <strong>${escapeHtml(label || "Official AP PDF")}</strong>
            <span>Zoom or expand the matching PDF page for close reading.</span>
            <span class="source-health" data-source-health>Checking source pages</span>
          </div>
          <div class="source-toolbar" aria-label="Source viewing tools">
            <button type="button" class="source-tool" data-source-zoom="-1" aria-label="Zoom source out">-</button>
            <span class="source-zoom-label" data-source-zoom-label>100%</span>
            <button type="button" class="source-tool" data-source-zoom="1" aria-label="Zoom source in">+</button>
            <button type="button" class="source-tool" data-source-fit>Fit</button>
            <button type="button" class="source-expand" data-source-expand>Expand Source</button>
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener">PDF</a>
          </div>
        </div>
        ${sourcePageChipsHtml(sourcePages)}
        <div class="official-page-stack">
          ${sourcePageFiguresHtml(formId, sourcePages)}
        </div>
      </div>
    `;
  }

  function sourcePageChipsHtml(pages) {
    if (!pages.length) return "";
    return `
      <div class="source-page-strip" aria-label="Source pages">
        ${pages.map((page, index) => `
          <button type="button" class="${index === 0 ? "active" : ""}" data-source-page="${escapeHtml(String(page))}">Page ${escapeHtml(String(page))}</button>
        `).join("")}
      </div>
    `;
  }

  function sourcePageFiguresHtml(formId, pages) {
    return pages.map((page) => `
      <figure class="official-page-figure" data-page="${escapeHtml(String(page))}">
        <img class="official-page-image" data-source-page-img="1" src="${escapeHtml(officialPageImage(formId, page))}" alt="${escapeHtml(`Official PDF page ${page}`)}">
        <figcaption>Official PDF page ${escapeHtml(String(page))}</figcaption>
      </figure>
    `).join("");
  }

  function wireSourceTools(root) {
    root.querySelectorAll("[data-source-viewer]").forEach((viewer) => {
      applySourceZoom(viewer, Number(viewer.dataset.zoom) || 1);
      updateSourceHealth(viewer);
    });
    root.querySelectorAll("[data-source-zoom]").forEach((button) => {
      button.addEventListener("click", () => {
        const viewer = button.closest("[data-source-viewer]");
        if (!viewer) return;
        const current = Number(viewer.dataset.zoom) || 1;
        applySourceZoom(viewer, current + Number(button.dataset.sourceZoom) * 0.2);
      });
    });
    root.querySelectorAll("[data-source-fit]").forEach((button) => {
      button.addEventListener("click", () => {
        const viewer = button.closest("[data-source-viewer]");
        if (viewer) applySourceZoom(viewer, 1);
      });
    });
    root.querySelectorAll("[data-source-expand]").forEach((button) => {
      button.addEventListener("click", () => {
        const viewer = button.closest("[data-source-viewer]");
        if (viewer) openSourceInspector(sourcePayloadFrom(viewer));
      });
    });
    root.querySelectorAll("[data-source-page]").forEach((button) => {
      button.addEventListener("click", () => {
        const viewer = button.closest("[data-source-viewer]");
        const page = button.dataset.sourcePage;
        const target = [...(viewer?.querySelectorAll("[data-page]") || [])].find((item) => item.dataset.page === page);
        if (!viewer || !target) return;
        viewer.querySelectorAll("[data-source-page]").forEach((item) => item.classList.toggle("active", item === button));
        target.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    });
    root.querySelectorAll("[data-source-page-img]").forEach((image) => {
      image.addEventListener("load", () => {
        updateSourceHealth(image.closest("[data-source-viewer]"));
      }, { once: true });
      image.addEventListener("error", () => {
        image.closest(".official-page-figure")?.classList.add("source-missing");
        updateSourceHealth(image.closest("[data-source-viewer]"));
      }, { once: true });
    });
  }

  function updateSourceHealth(viewer) {
    if (!viewer) return;
    const images = [...viewer.querySelectorAll("[data-source-page-img]")];
    const label = viewer.querySelector("[data-source-health]");
    if (!label || !images.length) return;
    const missing = images.filter((image) => image.closest(".official-page-figure")?.classList.contains("source-missing")).length;
    const loaded = images.filter((image) => image.complete && image.naturalWidth > 0).length;
    viewer.classList.toggle("source-ok", !missing && loaded === images.length);
    viewer.classList.toggle("source-warn", missing > 0);
    if (missing) label.textContent = `${missing} source page image missing`;
    else if (loaded === images.length) label.textContent = `Source page loaded: ${images.length} page${images.length === 1 ? "" : "s"}`;
    else label.textContent = `Checking ${images.length} source page${images.length === 1 ? "" : "s"}`;
  }

  function applySourceZoom(viewer, zoom) {
    const nextZoom = Math.max(0.8, Math.min(2.8, zoom));
    viewer.dataset.zoom = nextZoom.toFixed(2);
    viewer.style.setProperty("--source-zoom", nextZoom.toFixed(2));
    viewer.style.setProperty("--source-width", `${Math.round(nextZoom * 100)}%`);
    const label = viewer.querySelector("[data-source-zoom-label]");
    if (label) label.textContent = `${Math.round(nextZoom * 100)}%`;
  }

  function sourcePayloadFrom(viewer) {
    return {
      formId: viewer.dataset.formId || "",
      pages: String(viewer.dataset.pages || "").split(",").map((page) => Number(page)).filter(Number.isFinite),
      url: viewer.dataset.pdfUrl || "",
      label: viewer.dataset.sourceLabel || "Official AP PDF"
    };
  }

  function openSourceInspector(payload) {
    closeSourceInspector();
    const pages = payload.pages.length ? payload.pages : [1];
    const inspector = document.createElement("section");
    inspector.className = "source-inspector";
    inspector.setAttribute("role", "dialog");
    inspector.setAttribute("aria-modal", "true");
    inspector.setAttribute("aria-label", "Expanded source viewer");
    inspector.dataset.sourceViewer = "expanded";
    inspector.dataset.formId = payload.formId;
    inspector.dataset.pages = pages.join(",");
    inspector.dataset.pdfUrl = payload.url;
    inspector.dataset.sourceLabel = payload.label;
    inspector.innerHTML = `
      <div class="source-inspector-panel">
        <header class="source-inspector-head">
          <div class="source-title">
            <strong>${escapeHtml(payload.label)}</strong>
            <span>${escapeHtml(pageLabel(pages))}</span>
            <span class="source-health" data-source-health>Checking source pages</span>
          </div>
          <div class="source-toolbar" aria-label="Expanded source viewing tools">
            <button type="button" class="source-tool" data-source-zoom="-1" aria-label="Zoom source out">-</button>
            <span class="source-zoom-label" data-source-zoom-label>100%</span>
            <button type="button" class="source-tool" data-source-zoom="1" aria-label="Zoom source in">+</button>
            <button type="button" class="source-tool" data-source-fit>Fit</button>
            <a href="${escapeHtml(payload.url)}" target="_blank" rel="noopener">Open PDF</a>
            <button type="button" class="source-close" data-source-close>Close</button>
          </div>
        </header>
        ${sourcePageChipsHtml(pages)}
        <div class="official-page-stack source-inspector-stack">
          ${sourcePageFiguresHtml(payload.formId, pages)}
        </div>
      </div>
    `;
    inspector.addEventListener("click", (event) => {
      if (event.target === inspector) closeSourceInspector();
    });
    inspector.querySelector("[data-source-close]").addEventListener("click", closeSourceInspector);
    document.body.appendChild(inspector);
    document.body.classList.add("source-inspector-open");
    wireSourceTools(inspector);
    applySourceZoom(inspector, 1.15);
    inspector.querySelector("[data-source-close]").focus();
  }

  function closeSourceInspector() {
    document.querySelector(".source-inspector")?.remove();
    document.body.classList.remove("source-inspector-open");
  }

  function officialPageImage(formId, page) {
    return `../../assets/ap-released-forms/${encodeURIComponent(formId)}/page-${String(page).padStart(3, "0")}.webp`;
  }

  function pageLabel(pages) {
    const sourcePages = (pages || []).filter(Boolean);
    if (!sourcePages.length) return "official PDF page";
    if (sourcePages.length === 1) return `official PDF page ${sourcePages[0]}`;
    return `official PDF pages ${sourcePages[0]}-${sourcePages[sourcePages.length - 1]}`;
  }

  function renderWriting(task) {
    $("questionLabel").textContent = task.label;
    $("skillLabel").textContent = `${task.max} points`;
    $("prevBtn").textContent = "Previous";
    $("nextBtn").textContent = "Next";
    const source = officialViewer(task.formId, task.officialPages || [task.officialPage || 1], task.officialPdf, `${task.label} · ${pageLabel(task.officialPages || [task.officialPage || 1])}`);
    $("questionCard").innerHTML = `
      ${source}
      <div class="ap-skill-targets" aria-label="AP skill targets">
        ${(task.skillTargets || []).map((target) => `<span>${escapeHtml(target)}</span>`).join("")}
      </div>
      <div class="writing-task">
        <div class="source-lock">${escapeHtml(task.label)} is locked to ${escapeHtml(pageLabel(task.officialPages || [task.officialPage || 1]))}</div>
        <div class="stem">${escapeHtml(task.prompt)}</div>
        <ul class="writing-points">
          ${(task.bullets || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
        <textarea id="writingBox" aria-label="${escapeHtml(task.label)} response" placeholder="Write your response here."></textarea>
      </div>
    `;
    wireSourceTools($("questionCard"));
    const box = $("writingBox");
    box.value = state.writing[task.id] || "";
    box.addEventListener("input", () => {
      state.writing[task.id] = box.value;
      updateAnswered();
    });
    $("prevBtn").disabled = state.current <= 0;
    $("nextBtn").disabled = state.current >= state.exam.writing.length;
    $("prevBtn").onclick = () => move(-1);
    $("nextBtn").onclick = () => move(1);
  }

  function move(delta) {
    state.current = Math.max(0, Math.min(state.exam.writing.length, state.current + delta));
    renderQuestion();
  }

  function updateAnswered() {
    const mcqAnswered = state.exam.mcq.filter((question) => Number.isInteger(state.answers[question.id])).length;
    const writingAnswered = state.exam.writing.filter((task) => (state.writing[task.id] || "").trim().length >= 40).length;
    $("answeredCount").textContent = String(mcqAnswered + writingAnswered);
  }

  function scoreExam() {
    clearInterval(state.timerId);
    const mcqCorrect = state.exam.mcq.reduce((total, question) => total + (state.answers[question.id] === question.correctIndex ? 1 : 0), 0);
    const mcqPercent = mcqCorrect / state.exam.mcq.length;
    const writingResults = state.exam.writing.map((task) => scoreWritingTask(task, state.writing[task.id] || ""));
    const writingEarned = writingResults.reduce((total, result) => total + result.earned, 0);
    const writingMax = writingResults.reduce((total, result) => total + result.max, 0);
    const writingPercent = writingMax ? writingEarned / writingMax : 0;
    const scored = scoreComposite(mcqCorrect, mcqPercent, writingResults, writingEarned, writingMax, writingPercent);
    const weakTopics = collectWeakTopics();
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "ap-practice-exam",
      title: state.exam.title || state.exam.form?.title || "AP Practice Exam",
      course: state.exam.course || state.exam.form?.course || "AP Practice",
      gameType: "Full Practice Exam",
      score: scored.apScore,
      accuracy: Math.round(mcqPercent * 100),
      weakTopics
    }, { counter: "game-completions" });
    renderResults({ mcqCorrect, mcqPercent, writingResults, writingEarned, writingMax, writingPercent, ...scored });
    showScreen("resultsScreen");
  }

  function scoreComposite(mcqCorrect, mcqPercent, writingResults, writingEarned, writingMax, writingPercent) {
    const scoring = state.exam.form?.scoring;
    if (scoring?.type === "weightedRaw") {
      const writingWeighted = writingResults.reduce((sum, result) => sum + result.earned * Number(result.weight || 1), 0);
      const composite = Math.round(mcqCorrect * Number(scoring.mcqWeight || 1) + writingWeighted);
      return { composite, compositeLabel: "composite", apScore: scoreFromRanges(composite, scoring.ranges), officialFormula: true };
    }
    if (scoring?.type === "weightedPercent") {
      const composite = Math.round(mcqPercent * scoring.mcqPercentWeight + writingPercent * scoring.writingPercentWeight);
      return { composite, compositeLabel: "weighted %", apScore: scoreFromRanges(composite, scoring.ranges), officialFormula: false };
    }
    const composite = Math.round((mcqPercent * 0.5 + writingPercent * 0.5) * 100);
    return { composite, compositeLabel: "weighted %", apScore: apBand(composite), officialFormula: false };
  }

  function scoreFromRanges(value, ranges) {
    const match = (ranges || []).find((range) => value >= Number(range.min));
    return match ? match.score : apBand(value);
  }

  function scoreWritingTask(task, response) {
    const text = response.toLowerCase();
    const words = response.trim().split(/\s+/).filter(Boolean);
    const signals = writingSignalChecks(task, response);
    const signalHits = signals.filter((signal) => signal.hit).length;
    const anchorHits = (task.anchors || []).filter((anchor) => anchor && text.includes(String(anchor).toLowerCase())).length;
    const lengthScore = lengthBand(words.length, task.max);
    const raw = lengthScore + Math.min(6, signalHits) + Math.min(3, anchorHits);
    const earned = Math.max(0, Math.min(task.max, Math.round((raw / 12) * task.max)));
    const position = earned >= task.max * 0.8 ? "upper rubric band" : earned >= task.max * 0.5 ? "middle rubric band" : "early rubric band";
    return {
      id: task.id,
      label: task.label,
      max: task.max,
      weight: task.weight || 1,
      earned,
      position,
      signals,
      words: words.length,
      metSignals: signals.filter((signal) => signal.hit).map((signal) => signal.label),
      missingSignals: signals.filter((signal) => !signal.hit).map((signal) => signal.label),
      next: nextStep(task, response, earned, signals)
    };
  }

  function lengthBand(wordCount, max) {
    if (max <= 3) return wordCount >= 70 ? 3 : wordCount >= 35 ? 2 : wordCount >= 15 ? 1 : 0;
    if (max <= 5) return wordCount >= 130 ? 3 : wordCount >= 75 ? 2 : wordCount >= 35 ? 1 : 0;
    return wordCount >= 260 ? 3 : wordCount >= 150 ? 2 : wordCount >= 60 ? 1 : 0;
  }

  function writingSignalChecks(task, response) {
    const text = response.toLowerCase();
    const label = `${task.label || ""} ${task.id || ""}`.toLowerCase();
    const anchors = (task.anchors || []).filter((anchor) => anchor && text.includes(String(anchor).toLowerCase())).length;
    const checks = [
      { label: "claim", hit: /\b(thesis|claim|argument|position|because)\b/i.test(response) },
      { label: "specific evidence", hit: anchors >= 1 || /\b(example|evidence|document|data|case|study|law|policy|event)\b/i.test(response) },
      { label: "reasoning", hit: /\b(because|therefore|as a result|led to|caused|effect|shows|explains)\b/i.test(response) },
      { label: "task verb", hit: /\b(explain|identify|describe|analyze|evaluate|calculate|draw|label|compare|contrast)\b/i.test(response) }
    ];
    if (/dbq/.test(label)) checks.push(
      { label: "uses documents", hit: /\b(doc|document|source)\s*[1-7]?\b/i.test(response) || anchors >= 2 },
      { label: "sourcing", hit: /\b(point of view|purpose|audience|context|author|bias|reliability)\b/i.test(response) },
      { label: "outside evidence", hit: /\b(outside evidence|for example|another example|also)\b/i.test(response) && anchors >= 1 }
    );
    if (/leq/.test(label)) checks.push(
      { label: "contextualization", hit: /\b(context|background|before|during|after|broader)\b/i.test(response) },
      { label: "historical reasoning", hit: /\b(causation|continuity|change|comparison|turning point|similar|different)\b/i.test(response) }
    );
    if (/saq/.test(label)) checks.push(
      { label: "direct parts", hit: /\b(a\.|b\.|c\.|part a|part b|part c)\b/i.test(response) || anchors >= 2 }
    );
    if (/frq/.test(label)) checks.push(
      { label: "applies terms", hit: anchors >= 2 || /\b(define|apply|scenario|behavior|response|variable)\b/i.test(response) },
      { label: "method/data precision", hit: /\b(independent|dependent|operational|random|control|mean|median|standard deviation|statistical)\b/i.test(response) }
    );
    if (/\b(graph|curve|equilibrium|demand|supply|gdp|reserve|tariff|surplus|marginal|interest rate)\b/i.test((task.anchors || []).join(" ") + " " + (task.prompt || ""))) checks.push(
      { label: "graph logic", hit: /\b(graph|curve|shift|left|right|increase|decrease|equilibrium|surplus|shortage)\b/i.test(response) }
    );
    return checks;
  }

  function nextStep(task, response, earned, signals) {
    if (!response.trim()) return "Write enough specific evidence for the grader to see the claim.";
    const missing = (signals || []).filter((signal) => !signal.hit).map((signal) => signal.label);
    const label = `${task.label || ""} ${task.id || ""}`.toLowerCase();
    if (missing.includes("uses documents")) return "Cite the documents directly and explain what each one proves.";
    if (missing.includes("outside evidence")) return "Add one accurate example beyond the documents and tie it to the argument.";
    if (missing.includes("sourcing")) return "Explain point of view, purpose, audience, or historical situation for at least one document.";
    if (missing.includes("contextualization")) return "Open with broader historical context before the thesis.";
    if (missing.includes("historical reasoning")) return "Name the reasoning move directly: causation, comparison, continuity and change, or turning point.";
    if (missing.includes("direct parts")) return "Answer every part of the SAQ directly, then support each part with one precise fact.";
    if (missing.includes("graph logic")) return "State the direction of the shift or change, then explain the new outcome.";
    if (/dbq/.test(label) && missing.length) return "Add: " + missing.slice(0, 2).join(" and ") + ".";
    if (/leq/.test(label) && missing.length) return "Strengthen the thesis and support it with specific historical evidence.";
    if (/saq/.test(label) && missing.length) return "Keep each part short and specific: answer, evidence, explanation.";
    if (/frq/.test(label) && missing.length) return "Use the exact course terms from the prompt and apply them to the scenario or data.";
    if (missing.length) return "Add: " + missing.slice(0, 2).join(" and ") + ".";
    if (earned <= task.max * 0.35) return "Add a defensible claim and at least two precise course facts.";
    if (earned <= task.max * 0.7) return "Tighten the explanation so each fact proves the claim.";
    return "Push for complexity: qualify the argument, compare, calculate, source, or explain limits.";
  }

  function writingBreakdownHtml(item) {
    const met = item.metSignals?.length ? `Met: ${item.metSignals.slice(0, 3).join(", ")}.` : "Met: none yet.";
    const missing = item.missingSignals?.length ? ` Next: ${item.missingSignals.slice(0, 2).join(", ")}.` : "";
    return `${escapeHtml(item.label)}: ${item.earned}/${item.max}, ${escapeHtml(item.position)}. ${escapeHtml(met + missing + " " + item.next)}`;
  }

  function apBand(composite) {
    if (composite >= 82) return 5;
    if (composite >= 68) return 4;
    if (composite >= 52) return 3;
    if (composite >= 38) return 2;
    return 1;
  }

  function renderResults(result) {
    const scoreLabel = result.officialFormula ? "practice composite score" : result.compositeLabel;
    $("scoreGrid").innerHTML = `
      <div class="metric"><strong>${result.apScore}</strong><span>AP estimate</span></div>
      <div class="metric"><strong>${result.composite}</strong><span>${escapeHtml(scoreLabel)}</span></div>
      <div class="metric"><strong>${result.mcqCorrect}/${state.exam.mcq.length}</strong><span>${state.exam.sourceMode === "official" ? "official MCQ key" : "MCQ"}</span></div>
      <div class="metric"><strong>${result.writingEarned}/${result.writingMax}</strong><span>Writing estimate</span></div>
    `;
    const weakTopics = collectWeakTopics().slice(0, 5);
    const sourceNote = "MCQs are scored from the public answer key. Writing is still an automated practice estimate against rubric signals.";
    $("feedbackGrid").innerHTML = `
      <article class="feedback-card">
        <h3>Writing Feedback</h3>
        <ul>${result.writingResults.map((item) => {
          return `<li>${writingBreakdownHtml(item)}</li>`;
        }).join("")}</ul>
      </article>
      <article class="feedback-card">
        <h3>Next Practice</h3>
        <ul>${weakTopics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("") || "<li>Keep reviewing mixed AP questions.</li>"}</ul>
      </article>
      <article class="feedback-card">
        <h3>Score Meaning</h3>
        <p>${escapeHtml(sourceNote)}</p>
      </article>
      <article class="feedback-card">
        <h3>Source</h3>
        <p><a href="${escapeHtml(state.exam.form.pdfUrl)}" target="_blank" rel="noopener">Open official PDF</a></p>
      </article>
    `;
  }

  function collectWeakTopics() {
    const misses = state.exam.mcq
      .filter((question) => state.answers[question.id] !== question.correctIndex)
      .map((question) => question.category)
      .filter(Boolean);
    const writingSignals = state.exam.writing.flatMap((task) =>
      writingSignalChecks(task, state.writing[task.id] || "")
        .filter((signal) => !signal.hit)
        .map((signal) => `AP ${signal.label}`)
    );
    const counts = misses.concat(writingSignals).reduce((map, topic) => map.set(topic, (map.get(topic) || 0) + 1), new Map());
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([topic]) => `Review ${topic}`);
  }

  function startTimer() {
    clearInterval(state.timerId);
    const total = state.exam.minutes * 60 * 1000;
    const tick = () => {
      const remaining = Math.max(0, total - (Date.now() - state.startTime));
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      $("timer").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      if (remaining <= 0) clearInterval(state.timerId);
    };
    tick();
    state.timerId = setInterval(tick, 1000);
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}());
