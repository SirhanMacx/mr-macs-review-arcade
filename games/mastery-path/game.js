const M = window.MrMacsMastery;
const state = {
  data: null,
  course: "",
  items: [],
  index: 0,
  answers: {},
  locked: false,
  correct: 0,
  lastResult: null
};

const $ = (selector) => document.querySelector(selector);

function show(id) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  $("#" + id).classList.add("active");
  scrollTo({ top: 0, behavior: "auto" });
}

function fillCourses() {
  const select = $("#courseSelect");
  select.innerHTML = M.courseOptions().map((option) =>
    '<option value="' + M.esc(option.value) + '">' + M.esc(option.label) + '</option>'
  ).join("");
  const params = new URLSearchParams(location.search);
  const requested = params.get("course");
  const found = M.COURSES.find((course) => course.id === requested || course.label === requested || M.slug(course.short) === requested);
  select.value = found ? found.label : "Grade 10 Global History II";
  state.course = select.value;
}

function card(title, value, body, tone) {
  return '<article class="card"><span class="pill ' + (tone || "") + '">' + M.esc(title) + '</span><strong>' + M.esc(value) + '</strong><span>' + M.esc(body) + '</span></article>';
}

function metric(title, value) {
  return '<div class="metric"><strong>' + M.esc(value) + '</strong><span>' + M.esc(title) + '</span></div>';
}

function actionCard(action) {
  return '<a class="action-card" href="' + M.esc(courseHref(action.href)) + '">' +
    '<span class="tag">' + M.esc(action.id === "jeopardy" ? "Review Board" : "Practice Tool") + '</span>' +
    '<strong>' + M.esc(action.title) + '</strong>' +
    '<span>' + M.esc(action.body) + '</span>' +
    '<span class="btn primary">Start</span>' +
  '</a>';
}

function courseHref(href) {
  const course = "course=" + encodeURIComponent(state.course);
  if (href.includes("#")) {
    const parts = href.split("#");
    return parts[0] + "?" + course + "#" + parts.slice(1).join("#");
  }
  return href + "?" + course;
}

function recentMasteryForCourse() {
  const data = M.readMastery();
  const all = []
    .concat(data.diagnostics || [])
    .concat(data.sourceSessions || [])
    .concat(data.writingSessions || [])
    .filter((row) => row.course === state.course)
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  return all[0] || null;
}

function renderDashboard() {
  if (!state.data) return;
  const summary = M.courseSummary(state.data.games, state.data, state.course);
  const profile = summary.profile;
  const recent = recentMasteryForCourse();
  $("#courseTitle").textContent = profile.short + " Dashboard";
  $("#courseMetrics").innerHTML =
    metric("course activities", summary.games) +
    metric("trusted sources", summary.sourceQuestions) +
    metric("Jeopardy boards", summary.jeopardy);
  $("#dashboardCards").innerHTML =
    card("Assessment", profile.exam, profile.writing, "gold") +
    card("Game Library", summary.games, "filtered course launches", "") +
    card("Source Bank", summary.sourceQuestions, "image-backed source questions", "green") +
    card("Review Bank", summary.reviewQuestions, "course prompts and concepts", "") +
    card("Recent Result", recent ? ((recent.accuracy ?? recent.score ?? "--") + (recent.accuracy !== undefined ? "%" : "")) : "Not started", recent ? (recent.title || "last practice") : "take the diagnostic first", recent ? "green" : "") +
    card("Focus Skills", profile.skills.map((skill) => M.SKILL_LABELS[skill] || skill).slice(0, 3).join(", "), "course priority skills", "");

  const fallback = {
    weakSkills: profile.skills.slice(0, 3).map((skill) => ({ id: skill, label: M.SKILL_LABELS[skill] || skill, rate: 0 })),
    accuracy: recent && Number.isFinite(Number(recent.accuracy)) ? Number(recent.accuracy) : 0
  };
  $("#actionCards").innerHTML = M.nextActions(profile, state.lastResult || fallback).map(actionCard).join("");
}

function renderSkillList() {
  const profile = M.courseProfile(state.course);
  $("#diagSkillList").innerHTML = profile.skills.slice(0, 4).map((skill) =>
    '<div class="skill-card"><strong>' + M.esc(M.SKILL_LABELS[skill] || skill) + '</strong><span>Diagnostic target</span></div>'
  ).join("");
}

function renderQuestion() {
  const item = state.items[state.index];
  state.locked = false;
  $("#qNumber").textContent = String(state.index + 1);
  $("#diagScore").textContent = String(state.correct);
  $("#diagLeft").textContent = String(Math.max(0, state.items.length - state.index - 1));
  $("#questionMeta").innerHTML = [item.course, item.set, M.SKILL_LABELS[item.skill] || item.skill].filter(Boolean).map((value) =>
    '<span class="pill">' + M.esc(value) + '</span>'
  ).join("");
  $("#prompt").textContent = item.prompt;
  $("#feedback").textContent = "";
  $("#stimulusBox").innerHTML = item.images && item.images.length
    ? '<img class="source-image" src="' + M.esc(item.images[0].src) + '" alt="Question stimulus"><span class="source-line">' + M.esc(item.source || "Released source stimulus") + '</span>'
    : "";
  $("#choices").innerHTML = item.choices.map((choice, index) =>
    '<button class="choice" type="button" data-answer="' + M.esc(choice.text) + '"><strong>' + String.fromCharCode(65 + index) + '.</strong> ' + M.esc(choice.text) + '</button>'
  ).join("");
  document.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => answer(button));
  });
}

function answer(button) {
  if (state.locked) return;
  state.locked = true;
  const item = state.items[state.index];
  const selected = button.dataset.answer;
  const ok = selected === item.answer;
  state.answers[item.id] = selected;
  if (ok) state.correct += 1;
  button.classList.add(ok ? "correct" : "wrong");
  document.querySelectorAll(".choice").forEach((choice) => {
    if (choice.dataset.answer === item.answer) choice.classList.add("correct");
  });
  $("#diagScore").textContent = String(state.correct);
  $("#feedback").innerHTML = '<strong>' + (ok ? "Correct" : "Not yet") + '</strong><br>Answer: ' + M.esc(item.answer) + '<br>' + M.esc(item.explanation || "Review the source and try the next one.");
}

function startDiagnostic() {
  state.course = $("#courseSelect").value;
  state.items = M.buildDiagnostic(state.data, state.course, 12);
  state.index = 0;
  state.answers = {};
  state.correct = 0;
  renderSkillList();
  $("#diagTitle").textContent = M.courseProfile(state.course).short + " Diagnostic";
  show("diagnosticScreen");
  renderQuestion();
}

function finishDiagnostic() {
  const result = M.evaluateDiagnostic(state.items, state.answers);
  const profile = M.courseProfile(state.course);
  state.lastResult = result;
  $("#resultScore").textContent = result.accuracy + "%";
  $("#resultTitle").textContent = profile.short + " path is ready";
  $("#resultSummary").textContent = result.correct + " of " + result.total + " correct. The cards below show where to practice next.";
  $("#skillResults").innerHTML = result.weakSkills.slice(0, 6).map((row) => {
    const pct = row.rate + "%";
    return '<article class="skill-card"><strong>' + M.esc(row.label) + '</strong><span>' + row.correct + " / " + row.total + " correct</span><div class=\"progress-line\" style=\"--pct:" + pct + "\"><span></span></div></article>";
  }).join("");
  $("#resultActions").innerHTML = M.nextActions(profile, result).map(actionCard).join("");
  M.recordSession("diagnostic", {
    gameId: "mastery-path",
    title: "Mastery Path Diagnostic",
    course: state.course,
    score: result.accuracy,
    accuracy: result.accuracy,
    weakTopics: result.weakTopics.slice(0, 4).map((row) => row.label),
    studyTargets: result.weakSkills.slice(0, 4).map((row) => row.label)
  });
  renderDashboard();
  show("resultsScreen");
}

function nextQuestion() {
  if (state.index >= state.items.length - 1) {
    finishDiagnostic();
    return;
  }
  state.index += 1;
  renderQuestion();
}

async function boot() {
  fillCourses();
  state.data = await M.loadArcadeData("../../");
  renderDashboard();
  $("#courseSelect").addEventListener("change", () => {
    state.course = $("#courseSelect").value;
    renderDashboard();
  });
  $("#startDiagnosticBtn").addEventListener("click", startDiagnostic);
  $("#exitDiagnosticBtn").addEventListener("click", () => show("dashboardScreen"));
  $("#nextBtn").addEventListener("click", nextQuestion);
  $("#finishBtn").addEventListener("click", finishDiagnostic);
  $("#backToDashboardBtn").addEventListener("click", () => show("dashboardScreen"));
  $("#retryBtn").addEventListener("click", startDiagnostic);
  $("#printBtn").addEventListener("click", () => window.print());
}

boot().catch((error) => {
  console.error(error);
  $("#dashboardCards").innerHTML = '<article class="card"><strong>Could not load the mastery path.</strong><span>Refresh the page and try again.</span></article>';
});
