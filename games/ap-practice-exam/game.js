(function () {
  "use strict";

  const DATA_VERSION = "2026-05-01-ap-released-pages-v2";
  const BANK_URL = `../../data/chrono-defense-bank.json?v=${DATA_VERSION}`;
  const OFFICIAL_URL = `../../data/ap-official-practice-exams.json?v=${DATA_VERSION}`;
  const ANSWER_PATTERN = [0, 2, 1, 3, 1, 0, 3, 2, 0, 1, 3, 2, 1, 3, 0, 2];

  const PROFILES = {
    "AP U.S. History Exam Review": profile("AP U.S. History", "APUSH", "history", 55, 95, ["saq1", "saq2", "saq3", "dbq", "leq"]),
    "AP World History: Modern Exam Review": profile("AP World History: Modern", "AP World", "history", 55, 95, ["saq1", "saq2", "saq3", "dbq", "leq"]),
    "AP European History Exam Review": profile("AP European History", "AP Euro", "history", 55, 95, ["saq1", "saq2", "saq3", "dbq", "leq"]),
    "AP Human Geography Exam Review": profile("AP Human Geography", "AP HUG", "geo", 60, 90, ["frq1", "frq2", "frq3"]),
    "AP U.S. Government and Politics Exam Review": profile("AP U.S. Government and Politics", "AP Gov", "gov", 55, 90, ["concept", "quant", "scotus", "argument"]),
    "AP Psychology Review": profile("AP Psychology", "AP Psych", "psych", 75, 90, ["article", "evidence"]),
    "AP Macroeconomics Exam Review": profile("AP Macroeconomics", "AP Macro", "econ", 60, 90, ["long", "short1", "short2"]),
    "AP Microeconomics Exam Review": profile("AP Microeconomics", "AP Micro", "econ", 60, 90, ["long", "short1", "short2"]),
    "AP Economics Combined Exam Review": profile("AP Economics Mixed Review", "AP Econ", "econ", 60, 90, ["long", "short1", "short2"], "Mixed Macro/Micro review, not a separate College Board AP exam.")
  };

  const state = {
    bank: [],
    officialForms: [],
    officialFrqPages: [],
    selection: "official::apush-2017-ced-practice",
    mode: "full",
    exam: null,
    current: 0,
    answers: {},
    writing: {},
    startTime: 0,
    timerId: 0
  };

  const $ = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);

  function profile(label, short, family, mcq, minutes, taskIds, mixedNotice = "") {
    const skills = {
      history: ["causation", "contextualization", "comparison", "continuity and change", "evidence"],
      geo: ["spatial reasoning", "scale", "data interpretation", "models", "patterns"],
      gov: ["constitutional reasoning", "institutions", "data interpretation", "argumentation", "policy impact"],
      psych: ["concept application", "research methods", "data interpretation", "evidence-based reasoning", "scenario analysis"],
      econ: ["graph interpretation", "policy analysis", "model application", "causal reasoning", "calculation"]
    }[family];
    const writing = taskIds.map((id) => taskFor(id, short));
    return { label, short, family, mcq, sprintMcq: family === "psych" ? 30 : 25, minutes, skills, writing, mixedNotice };
  }

  function taskFor(id, short) {
    const map = {
      saq1: { label: "SAQ 1", max: 3, kind: "saq", topic: `${short} evidence` },
      saq2: { label: "SAQ 2", max: 3, kind: "saq", topic: `${short} causation or comparison` },
      saq3: { label: "SAQ 3", max: 3, kind: "saq", topic: `${short} choice prompt` },
      dbq: { label: "DBQ", max: 7, kind: "dbq", topic: `${short} document argument` },
      leq: { label: "LEQ", max: 6, kind: "leq", topic: `${short} long essay` },
      frq1: { label: "FRQ 1", max: 7, kind: "frq", topic: `${short} applied model` },
      frq2: { label: "FRQ 2", max: 7, kind: "frq", topic: `${short} data or spatial pattern` },
      frq3: { label: "FRQ 3", max: 7, kind: "frq", topic: `${short} scenario analysis` },
      concept: { label: "Concept Application", max: 3, kind: "concept", topic: "institutions and policy" },
      quant: { label: "Quantitative Analysis", max: 4, kind: "quant", topic: "political data" },
      scotus: { label: "SCOTUS Comparison", max: 4, kind: "scotus", topic: "constitutional principles" },
      argument: { label: "Argument Essay", max: 6, kind: "argument", topic: "claim and evidence" },
      article: { label: "Article Analysis", max: 7, kind: "article", topic: "research methods" },
      evidence: { label: "Evidence-Based Question", max: 7, kind: "evidence", topic: "concept application" },
      long: { label: "Long FRQ", max: 10, kind: "econ-long", topic: "economic model" },
      short1: { label: "Short FRQ 1", max: 5, kind: "econ-short", topic: "economic application" },
      short2: { label: "Short FRQ 2", max: 5, kind: "econ-short", topic: "economic application" }
    };
    return { id, ...(map[id] || map.frq1) };
  }

  async function init() {
    wireEvents();
    try {
      const [bankResponse, officialResponse] = await Promise.all([fetch(BANK_URL), fetch(OFFICIAL_URL)]);
      const bankData = await bankResponse.json();
      const officialData = await officialResponse.json();
      state.bank = Array.isArray(bankData) ? bankData : bankData.questions || [];
      state.officialForms = officialData.forms || [];
      state.officialFrqPages = officialData.officialFrqPages || [];
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
    $("modeSelect").addEventListener("change", (event) => {
      state.mode = event.target.value;
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
      `<option value="official::${escapeHtml(form.id)}">Released AP exam: ${escapeHtml(form.label)}</option>`
    ).join("");
    const bank = Object.keys(PROFILES).map((course) =>
      `<option value="bank::${escapeHtml(course)}">Typed practice bank: ${escapeHtml(PROFILES[course].label)}</option>`
    ).join("");
    $("courseSelect").innerHTML = `
      <optgroup label="Released AP Exam Practice">${official}</optgroup>
      <optgroup label="Typed AP Practice Bank">${bank}</optgroup>
    `;
    $("courseSelect").value = state.selection;
  }

  function selectedKind() {
    const [kind, id] = String(state.selection).split("::");
    return { kind, id };
  }

  function renderFormat() {
    const selected = selectedKind();
    if (selected.kind === "official") {
      const form = state.officialForms.find((item) => item.id === selected.id) || state.officialForms[0];
      if (!form) return;
      const writing = form.writingTasks || [];
      $("modeSelect").disabled = true;
      $("formatPanel").innerHTML = `
        <p class="eyebrow">Released AP Exam Practice</p>
        <h2>${escapeHtml(form.title)}</h2>
        <ul class="format-list">
          <li><strong>${form.mcqCount} official MCQs</strong><span>Official released exam pages project one page at a time with matching answer controls.</span></li>
          <li><strong>${writing.length} writing tasks</strong><span>${writing.map((task) => `${task.label} (${task.max})`).join(", ")}</span></li>
          <li><strong>${form.minutes} minute timer</strong><span>Page-by-page released-form practice with a digital answer sheet.</span></li>
          <li><strong>Official link preserved</strong><span><a href="${escapeHtml(form.pdfUrl)}" target="_blank" rel="noopener">Open source PDF</a></span></li>
        </ul>
      `;
      return;
    }
    $("modeSelect").disabled = false;
    const profile = PROFILES[selected.id] || PROFILES["AP U.S. History Exam Review"];
    const mcqCount = state.mode === "sprint" ? profile.sprintMcq : profile.mcq;
    const minutes = state.mode === "sprint" ? Math.max(35, Math.round(profile.minutes * 0.45)) : profile.minutes;
    const writing = state.mode === "sprint" ? profile.writing.slice(0, 2) : profile.writing;
    const frq = state.officialFrqPages.find((page) => page.course === profile.label);
    $("formatPanel").innerHTML = `
      <p class="eyebrow">Typed AP Practice Bank</p>
      <h2>${escapeHtml(profile.label)}</h2>
      <ul class="format-list">
        <li><strong>${mcqCount} typed MCQs</strong><span>Question text appears directly on screen like the Regents practice exams.</span></li>
        <li><strong>${writing.length} typed writing tasks</strong><span>${writing.map((task) => `${task.label} (${task.max})`).join(", ")}</span></li>
        <li><strong>Attached source pages</strong><span>MCQs and writing tasks open with matching source/document panels.</span></li>
        <li><strong>${minutes} minute timer</strong><span>Timer keeps running until you score or leave the page.</span></li>
        <li><strong>Practice estimate</strong><span>Same-course distractors, rubric-position feedback, and approximate AP band.</span></li>
      </ul>
      ${frq ? `<p class="source-note"><a href="${escapeHtml(frq.url)}" target="_blank" rel="noopener">Official released FRQs</a>: ${escapeHtml(frq.status)}</p>` : ""}
      ${profile.mixedNotice ? `<p class="source-note">${escapeHtml(profile.mixedNotice)}</p>` : ""}
    `;
  }

  function startExam() {
    state.selection = $("courseSelect").value;
    state.mode = $("modeSelect").value;
    state.answers = {};
    state.writing = {};
    state.current = 0;
    const selected = selectedKind();
    state.exam = selected.kind === "official"
      ? buildOfficialExam(state.officialForms.find((form) => form.id === selected.id))
      : buildBankExam(selected.id, state.mode);
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
      stem: `Question ${index + 1} is displayed in the official source panel. Select the answer here.`,
      source: form.sourceLabel,
      officialPdf: form.pdfUrl,
      officialPage: questionPageFor(form, index + 1)
    }));
    const writing = (form.writingTasks || []).map((task) => ({
      ...task,
      kind: "writing",
      skill: "official rubric estimate",
      prompt: `Use the official PDF prompt and scoring guide for ${task.label}. Enter your response here for a practice rubric estimate.`,
      bullets: task.rubricTokens || ["claim", "evidence", "explanation"],
      anchors: task.rubricTokens || [],
      officialPdf: form.pdfUrl,
      officialPage: writingPageFor(form, task.id),
      officialPageUrl: form.officialPageUrl
    }));
    return {
      sourceMode: "official",
      form,
      course: form.course,
      profile: { label: form.label, short: form.label, skills: ["official PDF"], family: "official" },
      mcq,
      writing,
      pageGroups: pageGroupsFor(mcq),
      minutes: form.minutes || 120
    };
  }

  function questionPageFor(form, questionNumber) {
    const ranges = form.questionPageRanges || [];
    const match = ranges.find((range) => questionNumber >= range[0] && questionNumber <= range[1]);
    return match ? match[2] : form.pdfStartPage || 1;
  }

  function writingPageFor(form, taskId) {
    return (form.writingPages || {})[taskId] || form.pdfStartPage || 1;
  }

  function pageGroupsFor(questions) {
    const groups = new Map();
    questions.forEach((question, index) => {
      const page = Number(question.officialPage || 1);
      if (!groups.has(page)) groups.set(page, []);
      groups.get(page).push({ ...question, index });
    });
    return [...groups.entries()].map(([page, items]) => ({ page, items })).sort((a, b) => a.page - b.page);
  }

  function buildBankExam(course, mode) {
    const profile = PROFILES[course] || PROFILES["AP U.S. History Exam Review"];
    const mcqCount = mode === "sprint" ? profile.sprintMcq : profile.mcq;
    const writingTasks = mode === "sprint" ? profile.writing.slice(0, 2) : profile.writing;
    const pool = state.bank
      .filter((item) => item.course === course && item.prompt && item.answer)
      .map((item, index) => ({ ...item, _stable: hash(`${item.course}|${item.set}|${item.category}|${item.prompt}|${index}`) }));
    const hardPool = pool
      .filter((item) => Number(item.value || 0) >= 300 || String(item.type || "").includes("final"))
      .sort((a, b) => b._stable - a._stable);
    const selected = uniqueByAnswer([...hardPool, ...pool]).slice(0, mcqCount);
    return {
      sourceMode: "bank",
      course,
      profile,
      mcq: selected.map((item, index) => makeBankQuestion(item, index, profile, pool)),
      writing: writingTasks.map((task, index) => makeWritingTask(task, index, profile, pool)),
      minutes: mode === "sprint" ? Math.max(35, Math.round(profile.minutes * 0.45)) : profile.minutes
    };
  }

  function makeBankQuestion(item, index, profile, pool) {
    const skill = profile.skills[index % profile.skills.length];
    const correct = cleanAnswer(item.answer);
    const desiredIndex = ANSWER_PATTERN[index % ANSWER_PATTERN.length];
    const distractors = buildDistractors(item, correct, pool, profile);
    const sourceDoc = makeSourceDoc(item, index, profile, skill);
    return {
      id: `mcq-${index}`,
      kind: "mcq",
      label: `MCQ ${index + 1}`,
      category: item.category || item.set || profile.short,
      skill,
      correct,
      correctIndex: desiredIndex,
      choices: placeCorrect([correct, ...distractors], desiredIndex),
      labels: ["A", "B", "C", "D"],
      stem: makeStem(item, profile, skill, index),
      source: sourceDoc.sourceLine,
      sourceDoc
    };
  }

  function makeStem(item, profile, skill, index) {
    const category = cleanPrompt(item.category || item.set || profile.label);
    const templates = {
      history: [
        `Which answer best completes this AP-style claim about ${category}?`,
        "Which concept best explains the historical process in the attached source?",
        "A historian could use this source as evidence for which larger development?",
        `Which answer would best support an argument using ${skill}?`
      ],
      econ: [
        "Which answer best applies the economic model or policy logic in the attached scenario?",
        "Which concept would an AP economics response need to identify before explaining the outcome?",
        "Which answer best predicts or explains the change implied by the source?"
      ],
      gov: [
        "Which answer best connects this source to a constitutional principle, institution, or policy outcome?",
        "Which AP Government concept would most directly explain the attached scenario?",
        "Which answer best supports a defensible claim about American government?"
      ],
      psych: [
        "Which answer best applies the psychological concept to the attached situation?",
        "Which concept would most directly explain the behavior, method, or finding in the source?",
        "Which answer best supports an evidence-based AP Psychology explanation?"
      ],
      geo: [
        "Which answer best applies the geographic model, pattern, or scale in the attached source?",
        "Which concept best explains the spatial relationship in the source?",
        "Which answer best supports an AP Human Geography explanation?"
      ]
    };
    const list = templates[profile.family] || templates.history;
    return list[index % list.length];
  }

  function makeSourceDoc(item, index, profile, skill) {
    const category = cleanPrompt(item.category || item.set || profile.label);
    const set = cleanPrompt(item.set || "AP review bank");
    const excerpt = cleanPrompt(item.prompt);
    return {
      id: `source-${index + 1}`,
      title: `${profile.short} Source ${index + 1}`,
      kind: sourceKind(profile.family, index),
      sourceLine: `${set}${category ? ` / ${category}` : ""}`,
      category,
      skill,
      excerpt,
      citation: `Practice source sheet built from the ${profile.label} review bank.`
    };
  }

  function sourceKind(family, index) {
    const kinds = {
      history: ["Context excerpt", "Comparison source", "Causation source", "Continuity/change source"],
      econ: ["Model scenario", "Policy source", "Market data prompt", "Graph reasoning prompt"],
      gov: ["Constitutional scenario", "Institutional source", "Policy source", "Required concept source"],
      psych: ["Research scenario", "Behavior source", "Application source", "Evidence prompt"],
      geo: ["Spatial source", "Data prompt", "Model source", "Scale scenario"]
    };
    const list = kinds[family] || kinds.history;
    return list[index % list.length];
  }

  function buildDistractors(item, correct, pool, profile) {
    const sameCategory = pool.filter((candidate) => candidate !== item && cleanAnswer(candidate.answer) !== correct && candidate.category === item.category);
    const sameSet = pool.filter((candidate) => candidate !== item && cleanAnswer(candidate.answer) !== correct && candidate.set === item.set);
    const sameCourse = pool.filter((candidate) => candidate !== item && cleanAnswer(candidate.answer) !== correct);
    const ordered = [...sameCategory, ...sameSet, ...sameCourse]
      .sort((a, b) => distractorScore(b, correct, profile) - distractorScore(a, correct, profile) || a._stable - b._stable)
      .map((candidate) => cleanAnswer(candidate.answer))
      .filter((answer) => answer && answer !== correct && answer.length <= 82);
    const unique = [...new Set(ordered)].slice(0, 3);
    while (unique.length < 3) unique.push(fallbackDistractor(profile, unique.length));
    return unique.slice(0, 3);
  }

  function distractorScore(candidate, correct, profile) {
    const answer = cleanAnswer(candidate.answer);
    let score = 0;
    if (answer.split(/\s+/).length >= Math.min(2, correct.split(/\s+/).length)) score += 2;
    if (String(candidate.type || "").includes("final")) score += 2;
    if (Number(candidate.value || 0) >= 400) score += 2;
    if (profile.family === "history" && /revolution|war|empire|state|trade|reform|movement/i.test(answer)) score += 1;
    return score;
  }

  function fallbackDistractor(profile, index) {
    const bank = {
      history: ["sectionalism", "state centralization", "commercial exchange"],
      econ: ["aggregate demand", "market equilibrium", "marginal analysis"],
      gov: ["federalism", "judicial review", "political socialization"],
      psych: ["operational definition", "cognitive bias", "neural plasticity"],
      geo: ["spatial diffusion", "site and situation", "urban hierarchy"]
    };
    return (bank[profile.family] || bank.history)[index] || "historical context";
  }

  function placeCorrect(choices, desiredIndex) {
    const correct = choices[0];
    const shuffled = choices.slice(1, 4);
    const finalChoices = [];
    for (let index = 0; index < 4; index += 1) finalChoices[index] = index === desiredIndex ? correct : shuffled.shift();
    return finalChoices;
  }

  function makeWritingTask(task, index, profile, pool) {
    const sourceItems = pool
      .filter((item) => Number(item.value || 0) >= 300)
      .slice(index * 5, index * 5 + 5);
    const anchors = sourceItems.map((item) => cleanAnswer(item.answer)).filter(Boolean);
    return {
      id: task.id,
      kind: "writing",
      label: task.label,
      max: task.max,
      skill: writingSkill(task.kind, profile),
      prompt: writingPrompt(task, profile, anchors),
      bullets: writingBullets(task.kind),
      anchors,
      sourceDocs: sourceItems.map((item, offset) => makeSourceDoc(item, index * 5 + offset, profile, writingSkill(task.kind, profile)))
    };
  }

  function writingPrompt(task, profile, anchors) {
    const anchorText = anchors.slice(0, 4).join(", ");
    if (task.kind === "saq") return `Answer all parts using specific evidence from ${profile.short}. Topic focus: ${task.topic}. Anchor concepts: ${anchorText}.`;
    if (task.kind === "dbq") return `Develop an argument about ${task.topic}. Use document-style evidence, outside evidence, sourcing, and reasoning. Anchor concepts: ${anchorText}.`;
    if (task.kind === "leq") return `Develop a thesis-driven essay about ${task.topic}. Use specific evidence, reasoning, and complexity. Anchor concepts: ${anchorText}.`;
    if (task.kind === "concept") return "Apply a government concept to a policy scenario. Identify the concept, explain how it works, and connect it to an institution or constitutional principle.";
    if (task.kind === "quant") return "Interpret a political trend, describe the data pattern, and explain a likely cause or implication using AP Government vocabulary.";
    if (task.kind === "scotus") return "Compare a required Supreme Court case to a new scenario. Identify the constitutional principle and explain the similarity or difference.";
    if (task.kind === "argument") return "Write a defensible claim about American government and support it with at least two specific pieces of course evidence.";
    if (task.kind === "article") return "Analyze a research scenario. Identify method, variables, ethical issue or bias, and explain how the evidence supports a conclusion.";
    if (task.kind === "evidence") return "Use psychological evidence to explain behavior in context. Apply terms precisely and connect each term to the scenario.";
    if (task.kind === "econ-long") return "Build a complete economic explanation using a graph or model, policy action, predicted change, and long-run effect.";
    return "Answer with AP-level precision. Identify the concept, apply it to the scenario, and explain the result.";
  }

  function writingSkill(kind, profile) {
    if (kind === "dbq" || kind === "leq" || kind === "argument") return "argumentation";
    if (kind === "quant" || kind === "article") return "evidence and data";
    if (kind === "econ-long" || kind === "econ-short") return "model application";
    return profile.skills[0] || "application";
  }

  function writingBullets(kind) {
    const byKind = {
      saq: ["A/B/C parts answered", "specific evidence", "clear explanation"],
      dbq: ["thesis", "document evidence", "outside evidence", "sourcing", "complexity"],
      leq: ["thesis", "context", "evidence", "reasoning", "complexity"],
      concept: ["identify", "apply", "explain"],
      quant: ["describe trend", "use data", "explain implication"],
      scotus: ["case principle", "comparison", "constitutional reasoning"],
      argument: ["claim", "two evidence points", "reasoning"],
      article: ["method", "variables", "evidence", "validity"],
      evidence: ["claim", "terms", "scenario link", "evidence"],
      "econ-long": ["graph/model", "policy action", "effect", "long-run reasoning"],
      "econ-short": ["identify", "calculate or predict", "explain"]
    };
    return byKind[kind] || ["specific evidence", "clear explanation", "course vocabulary"];
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
    if (question.officialPdf) {
      renderOfficialPage(index, question);
      return;
    }
    $("questionCard").innerHTML = `
      <div class="source-runner">
        ${sourceDeck([question.sourceDoc], "Attached Source Page")}
        <section class="digital-panel" aria-label="Digital answer sheet">
          <div class="runner-head">
            <p class="eyebrow">Typed Question</p>
            <h3>${escapeHtml(question.label)}</h3>
            <span>${escapeHtml(question.source)}</span>
          </div>
          <div class="stem">${escapeHtml(question.stem).replace(/\n/g, "<br>")}</div>
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
        renderMcq(index);
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

  function renderOfficialMcq(index, question) {
    renderOfficialPage(index, question);
  }

  function renderOfficialPage(index, question) {
    state.answers._mcqIndex = index;
    const pageQuestions = pageQuestionsFor(question.officialPage);
    const group = pageGroupFor(question.officialPage);
    const first = pageQuestions[0]?.index ?? index;
    const last = pageQuestions[pageQuestions.length - 1]?.index ?? index;
    $("questionLabel").textContent = `Released page ${question.officialPage} · Questions ${first + 1}-${last + 1}`;
    $("skillLabel").textContent = "Official AP page";
    $("questionCard").innerHTML = `
      <div class="released-page-runner">
        ${officialViewer(question.officialPdf, question.officialPage, `${question.source} · Page ${question.officialPage}`)}
        <section class="digital-panel" aria-label="Digital answer sheet">
          <div class="runner-head">
            <p class="eyebrow">Official Exam Page</p>
            <h3>Questions ${first + 1}-${last + 1}</h3>
            <span>Released PDF page ${escapeHtml(String(question.officialPage))}</span>
          </div>
          ${pageNavHtml(question.officialPage)}
          <div class="page-question-list">
            ${pageQuestions.map(({ index: questionIndex, ...pageQuestion }) => `
              <article class="page-question ${questionIndex === index ? "active" : ""}" data-page-question="${questionIndex}">
                <div class="page-question-head">
                  <strong>Question ${questionIndex + 1}</strong>
                  <span>${escapeHtml(pageQuestion.stem)}</span>
                </div>
                <div class="choices compact-choices">
                  ${pageQuestion.choices.map((choice, choiceIndex) => `
                    <button type="button" class="choice ${state.answers[pageQuestion.id] === choiceIndex ? "selected" : ""}" data-question="${questionIndex}" data-choice="${choiceIndex}">
                      <span class="letter">${escapeHtml((pageQuestion.labels || ["A", "B", "C", "D"])[choiceIndex] || "")}</span>
                      <span>${escapeHtml(choice)}</span>
                    </button>
                  `).join("")}
                </div>
              </article>
            `).join("")}
          </div>
          ${answerMapHtml(index)}
        </section>
      </div>
    `;
    $("questionCard").querySelectorAll(".choice").forEach((button) => {
      button.addEventListener("click", () => {
        const questionIndex = Number(button.dataset.question);
        const target = state.exam.mcq[questionIndex] || question;
        state.answers[target.id] = Number(button.dataset.choice);
        renderOfficialPage(questionIndex, target);
        updateAnswered();
      });
    });
    $("questionCard").querySelectorAll("[data-qjump]").forEach((button) => {
      button.addEventListener("click", () => renderMcq(Number(button.dataset.qjump)));
    });
    $("questionCard").querySelectorAll("[data-pagejump]").forEach((button) => {
      button.addEventListener("click", () => {
        const page = Number(button.dataset.pagejump);
        const targetGroup = pageGroupFor(page);
        const targetIndex = targetGroup?.items?.[0]?.index ?? 0;
        renderMcq(targetIndex);
      });
    });
    const prev = adjacentPageGroup(group, -1);
    const next = adjacentPageGroup(group, 1);
    $("prevBtn").textContent = "Previous Page";
    $("nextBtn").textContent = "Next Page";
    $("prevBtn").disabled = !prev;
    $("nextBtn").disabled = !next;
    $("prevBtn").onclick = () => prev && renderMcq(prev.items[0].index);
    $("nextBtn").onclick = () => next && renderMcq(next.items[0].index);
  }

  function pageQuestionsFor(page) {
    return (pageGroupFor(page)?.items || []).map(({ index, ...question }) => ({ ...question, index }));
  }

  function pageGroupFor(page) {
    return (state.exam.pageGroups || []).find((group) => Number(group.page) === Number(page));
  }

  function adjacentPageGroup(group, delta) {
    if (!group) return null;
    const groups = state.exam.pageGroups || [];
    const index = groups.findIndex((item) => item.page === group.page);
    return groups[index + delta] || null;
  }

  function pageNavHtml(activePage) {
    const groups = state.exam.pageGroups || [];
    return `
      <div class="page-strip" aria-label="Released exam pages">
        ${groups.map((group) => {
          const first = group.items[0]?.index ?? 0;
          const last = group.items[group.items.length - 1]?.index ?? first;
          return `<button type="button" class="${Number(group.page) === Number(activePage) ? "active" : ""}" data-pagejump="${group.page}">p.${group.page} · Q${first + 1}-${last + 1}</button>`;
        }).join("")}
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

  function officialViewer(url, page, label) {
    const src = `${url}#page=${page || 1}&view=FitH`;
    return `
      <div class="official-source">
        <div class="official-source-head">
          <strong>${escapeHtml(label || "Official AP PDF")}</strong>
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener">Open PDF</a>
        </div>
        <iframe class="pdf-frame" src="${escapeHtml(src)}" title="${escapeHtml(label || "Official AP PDF")}"></iframe>
      </div>
    `;
  }

  function sourceDeck(docs, title) {
    const sourceDocs = (docs || []).filter(Boolean);
    if (!sourceDocs.length) return "";
    return `
      <div class="source-deck" aria-label="${escapeHtml(title || "Attached source pages")}">
        <div class="official-source-head">
          <strong>${escapeHtml(title || "Attached Source Pages")}</strong>
          <span>${sourceDocs.length} page${sourceDocs.length === 1 ? "" : "s"}</span>
        </div>
        <div class="source-pages">
          ${sourceDocs.map((doc, index) => `
            <article class="source-page">
              <div class="source-page-head">
                <strong>${escapeHtml(doc.title || `Source ${index + 1}`)}</strong>
                <span>${escapeHtml(doc.kind || "Source")}</span>
              </div>
              <p class="source-line">${escapeHtml(doc.sourceLine || doc.category || "")}</p>
              <blockquote>${escapeHtml(doc.excerpt || "Review the attached source evidence before answering.").replace(/\n/g, "<br>")}</blockquote>
              <footer>
                <span>${escapeHtml(doc.skill || "AP reasoning")}</span>
                <span>${escapeHtml(doc.citation || "Practice source sheet")}</span>
              </footer>
            </article>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderWriting(task) {
    $("questionLabel").textContent = task.label;
    $("skillLabel").textContent = `${task.max} points`;
    $("prevBtn").textContent = "Previous";
    $("nextBtn").textContent = "Next";
    const source = task.officialPdf
      ? officialViewer(task.officialPdf, task.officialPage || 1, "Official AP prompt and scoring guide")
      : sourceDeck(task.sourceDocs, "Attached Writing Documents");
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
    const sourceNote = state.exam.sourceMode === "official"
      ? "MCQs are scored from the public answer key. Writing is still an automated practice estimate against rubric signals."
      : "This is AP-style practice from the review bank, not an official College Board score.";
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
        <p>${state.exam.form ? `<a href="${escapeHtml(state.exam.form.pdfUrl)}" target="_blank" rel="noopener">Open official PDF</a>` : "AP-style bank practice with same-course distractors."}</p>
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

  function uniqueByAnswer(items) {
    const seen = new Set();
    return items.filter((item) => {
      const answer = cleanAnswer(item.answer).toLowerCase();
      if (!answer || seen.has(answer)) return false;
      seen.add(answer);
      return true;
    });
  }

  function cleanPrompt(value) {
    return String(value || "").replace(/\s+/g, " ").replace(/^this\s+/i, "").trim();
  }

  function cleanAnswer(value) {
    return String(value || "").replace(/\s+/g, " ").replace(/^what is\s+/i, "").replace(/^who is\s+/i, "").replace(/[?.!]+$/g, "").trim();
  }

  function hash(value) {
    let h = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      h ^= value.charCodeAt(index);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
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
