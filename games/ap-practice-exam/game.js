(function () {
  "use strict";

  const DATA_VERSION = "2026-05-01-ap-rendered-pages-v3";
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
        <li><strong>${form.mcqCount} official MCQs</strong><span>Each question opens as a digital answer card with the matching rendered PDF page beside it.</span></li>
        <li><strong>${writing.length} writing tasks</strong><span>${writing.map((task) => `${task.label} (${task.max})`).join(", ")}</span></li>
        <li><strong>${form.minutes} minute timer</strong><span>Full released-form practice with a digital answer sheet.</span></li>
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
    showScreen("examScreen");
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
      choices: options.map((option) => `Option ${option}`),
      labels: options,
      stem: `Read Question ${index + 1} on the rendered official PDF page, then enter your answer here.`,
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
    return pageSpan(startPage, endPage);
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
    return pageSpan(startPage, endPage);
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
        ${officialViewer(question.formId, pages, question.officialPdf, `${question.source} · ${pageLabel(pages)}`)}
        <section class="digital-panel" aria-label="Digital answer sheet">
          <div class="runner-head">
            <p class="eyebrow">Digital Question</p>
            <h3>Question ${index + 1}</h3>
            <span>Rendered ${escapeHtml(pageLabel(pages))}</span>
          </div>
          <div class="stem">${escapeHtml(question.stem)}</div>
          <div class="choices compact-choices">
            ${question.choices.map((choice, choiceIndex) => `
              <button type="button" class="choice ${state.answers[question.id] === choiceIndex ? "selected" : ""}" data-choice="${choiceIndex}">
                <span class="letter">${escapeHtml((question.labels || ["A", "B", "C", "D"])[choiceIndex] || "")}</span>
                <span>${escapeHtml(choice)}</span>
              </button>
            `).join("")}
          </div>
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
    $("questionCard").querySelectorAll("[data-qjump]").forEach((button) => {
      button.addEventListener("click", () => renderMcq(Number(button.dataset.qjump)));
    });
    $("prevBtn").disabled = index === 0;
    $("nextBtn").disabled = index === state.exam.mcq.length - 1;
    $("prevBtn").onclick = () => renderMcq(Math.max(0, index - 1));
    $("nextBtn").onclick = () => renderMcq(Math.min(state.exam.mcq.length - 1, index + 1));
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
      <div class="official-source">
        <div class="official-source-head">
          <strong>${escapeHtml(label || "Official AP PDF")}</strong>
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener">Open PDF</a>
        </div>
        <div class="official-page-stack">
          ${sourcePages.map((page) => `
            <figure class="official-page-figure">
              <img class="official-page-image" src="${escapeHtml(officialPageImage(formId, page))}" alt="${escapeHtml(`Official PDF page ${page}`)}">
              <figcaption>Official PDF page ${escapeHtml(String(page))}</figcaption>
            </figure>
          `).join("")}
        </div>
      </div>
    `;
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
      <div class="writing-task">
        <div class="stem">${escapeHtml(task.prompt)}</div>
        <ul class="writing-points">
          ${(task.bullets || []).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
        <textarea id="writingBox" aria-label="${escapeHtml(task.label)} response" placeholder="Write your response here."></textarea>
      </div>
    `;
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
    const rubricHits = [
      /\b(thesis|claim|argument)\b/i,
      /\b(because|therefore|as a result|led to|caused|effect)\b/i,
      /\b(evidence|example|document|data|case|study|graph|model)\b/i,
      /\b(compare|contrast|continuity|change|context|however|although)\b/i,
      /\b(explain|identify|describe|analyze|evaluate|calculate|draw|label)\b/i
    ].filter((pattern) => pattern.test(response)).length;
    const anchorHits = (task.anchors || []).filter((anchor) => anchor && text.includes(String(anchor).toLowerCase())).length;
    const lengthScore = words.length >= 260 ? 3 : words.length >= 150 ? 2 : words.length >= 60 ? 1 : 0;
    const raw = lengthScore + rubricHits + Math.min(2, anchorHits);
    const earned = Math.max(0, Math.min(task.max, Math.round((raw / 10) * task.max)));
    const position = earned >= task.max * 0.8 ? "upper rubric band" : earned >= task.max * 0.5 ? "middle rubric band" : "early rubric band";
    return { id: task.id, label: task.label, max: task.max, weight: task.weight || 1, earned, position, next: nextStep(task, response, earned) };
  }

  function nextStep(task, response, earned) {
    if (!response.trim()) return "Write enough specific evidence for the grader to see the claim.";
    if (earned <= task.max * 0.35) return "Add a defensible claim and at least two precise course facts.";
    if (earned <= task.max * 0.7) return "Tighten the explanation so each fact proves the claim.";
    return "Push for complexity: qualify the argument, compare, calculate, source, or explain limits.";
  }

  function apBand(composite) {
    if (composite >= 82) return 5;
    if (composite >= 68) return 4;
    if (composite >= 52) return 3;
    if (composite >= 38) return 2;
    return 1;
  }

  function renderResults(result) {
    const scoreLabel = result.officialFormula ? "official worksheet composite" : result.compositeLabel;
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
        <h3>Writing Rubric Position</h3>
        <ul>${result.writingResults.map((item) => `<li>${escapeHtml(item.label)}: ${item.earned}/${item.max}, ${escapeHtml(item.position)}. ${escapeHtml(item.next)}</li>`).join("")}</ul>
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
    const counts = misses.reduce((map, topic) => map.set(topic, (map.get(topic) || 0) + 1), new Map());
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
