const M = window.MrMacsMastery;
const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;
const state = { data: null, course: "", pool: [], session: [], index: 0, correct: 0, answered: 0, habits: 0, misses: [], locked: false, zoom: 1 };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function show(id) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  $("#" + id).classList.add("active");
  scrollTo({ top: 0, behavior: "auto" });
}

function emptyCard(iconName, title, sub) {
  const icon = (typeof window !== "undefined" && window.MrMacsIcons && window.MrMacsIcons.has(iconName))
    ? window.MrMacsIcons.svg(iconName) : "";
  return '<div class="empty-card">' + icon + '<strong>' + M.esc(title) + '</strong><span>' + M.esc(sub) + '</span></div>';
}

function fillCourses() {
  const params = new URLSearchParams(location.search);
  const requested = params.get("course");
  const found = M.COURSES.find((course) => course.id === requested || course.label === requested || M.slug(course.short) === requested);
  $("#courseSelect").innerHTML = M.courseOptions().map((option) =>
    '<option value="' + M.esc(option.value) + '">' + M.esc(option.label) + '</option>'
  ).join("");
  $("#courseSelect").value = found ? found.label : "Grade 11 U.S. History";
  state.course = $("#courseSelect").value;
}

function renderMetrics() {
  const questions = M.sourceLabQuestions(state.data, state.course);
  const sets = M.uniq(questions.map((q) => q.set));
  $("#sourceMetrics").innerHTML =
    '<div class="metric"><strong>' + questions.length + '</strong><span>trusted sources</span></div>' +
    '<div class="metric"><strong>' + sets.length + '</strong><span>sets</span></div>' +
    '<div class="metric"><strong>0</strong><span>missing images used</span></div>';
}

function courseHref(href) {
  const course = "course=" + encodeURIComponent(state.course);
  if (href.includes("#")) {
    const parts = href.split("#");
    return parts[0] + "?" + course + "#" + parts.slice(1).join("#");
  }
  return href + "?" + course;
}

function current() {
  return state.session[state.index];
}

function sourceLock(question) {
  const normalized = { ...question, stimulusImages: question.images || question.stimulusImages || [] };
  if (SourceBank) return SourceBank.sourceLock(normalized);
  return {
    ok: Boolean(normalized.stimulusImages.length),
    needed: true,
    reason: normalized.stimulusImages.length ? "" : "Source image missing",
    images: normalized.stimulusImages,
    identity: [question.course, question.source, normalized.stimulusImages.map((image) => image.src).join("|")].join("::"),
    label: normalized.stimulusImages.length ? "Source matched" : "Source blocked"
  };
}

function resetHabits() {
  $$("[data-habit]").forEach((box) => { box.checked = false; });
}

function habitCount() {
  return $$("[data-habit]").filter((box) => box.checked).length;
}

function renderQuestion() {
  const q = current();
  state.locked = false;
  state.zoom = 1;
  $("#zoomWrap").style.setProperty("--zoom", state.zoom);
  $("#sourceNumber").textContent = String(state.index + 1);
  $("#score").textContent = String(state.correct);
  $("#habitScore").textContent = String(state.habits);
  $("#sessionTitle").textContent = M.courseProfile(state.course).short + " Source Lab";
  $("#questionMeta").innerHTML = [q.course, q.set, M.SKILL_LABELS[q.skill] || q.skill].filter(Boolean).map((value) => '<span class="pill">' + M.esc(value) + '</span>').join("");
  const lock = sourceLock(q);
  $("#sourceImage").src = lock.images[0]?.src || q.images?.[0]?.src || "";
  $("#sourceLine").dataset.sourceIdentity = lock.identity || "";
  $("#sourceLine").innerHTML = '<span class="source-lock-pill ' + (lock.ok ? "ok" : "warn") + '">' + M.esc(lock.label) + (lock.reason ? " · " + M.esc(lock.reason) : "") + '</span><span>' + M.esc(q.source || q.topic || "Released source stimulus") + '</span>';
  $("#prompt").textContent = q.prompt;
  $("#feedback").textContent = "";
  $("#choices").innerHTML = q.choices.map((choice, index) =>
    '<button class="choice" type="button" data-answer="' + M.esc(choice.text) + '"><strong>' + String.fromCharCode(65 + index) + '.</strong> ' + M.esc(choice.text) + '</button>'
  ).join("");
  $$(".choice").forEach((button) => button.addEventListener("click", () => answer(button)));
  resetHabits();
}

function answer(button) {
  if (state.locked) return;
  state.locked = true;
  const q = current();
  const selected = button.dataset.answer;
  const ok = selected === q.answer;
  const habits = habitCount();
  state.answered += 1;
  state.habits += habits;
  if (ok) state.correct += 1;
  else state.misses.push(q);
  button.classList.add(ok ? "correct" : "wrong");
  $$(".choice").forEach((choice) => {
    if (choice.dataset.answer === q.answer) choice.classList.add("correct");
  });
  $("#score").textContent = String(state.correct);
  $("#habitScore").textContent = String(state.habits);
  const habitLine = habits >= 3 ? "Strong source routine." : "Before answering, mark title/date, labels, and your prediction.";
  $("#feedback").innerHTML = '<strong>' + (ok ? "Correct" : "Not yet") + '</strong><br>Answer: ' + M.esc(q.answer) + '<br>' + M.esc(habitLine) + '<br>' + M.esc(q.explanation || "");
}

function start() {
  state.course = $("#courseSelect").value;
  const length = Number($("#lengthSelect").value || 12);
  state.pool = M.sourceLabQuestions(state.data, state.course);
  state.session = state.pool.slice(0, length);
  state.index = 0;
  state.correct = 0;
  state.answered = 0;
  state.habits = 0;
  state.misses = [];
  if (!state.session.length) {
    $("#sourceMetrics").innerHTML = emptyCard("scroll", "No verified sources yet", "This course has no image-backed source questions in the bank. Try another course.");
    return;
  }
  show("playScreen");
  renderQuestion();
}

function next() {
  if (state.index >= state.session.length - 1) {
    finish();
    return;
  }
  state.index += 1;
  renderQuestion();
}

function finish() {
  const accuracy = state.answered ? Math.round(state.correct / state.answered * 100) : 0;
  const habitMax = state.answered * 3;
  const habitPct = habitMax ? Math.round(state.habits / habitMax * 100) : 0;
  const weakTopics = M.uniq(state.misses.map((q) => q.topic)).slice(0, 5);
  $("#resultScore").textContent = accuracy + "%";
  $("#resultSummary").textContent = state.correct + " of " + state.answered + " correct. Source routine score: " + habitPct + "%.";
  $("#resultCards").innerHTML =
    '<article class="card"><span class="pill gold">Accuracy</span><strong>' + accuracy + '%</strong><span>source MCQs correct</span></article>' +
    '<article class="card"><span class="pill green">Habit</span><strong>' + habitPct + '%</strong><span>inspection steps completed</span></article>' +
    '<article class="card"><span class="pill">Targets</span><strong>' + (weakTopics[0] || "Clear") + '</strong><span>' + (weakTopics.length ? weakTopics.join(", ") : "No weak topics from this run") + '</span></article>';
  const profile = M.courseProfile(state.course);
  const result = { accuracy, weakSkills: [{ id: "source", label: "Source Reading", rate: accuracy }], weakTopics: weakTopics.map((topic) => ({ label: topic, rate: 0 })) };
  $("#nextActions").innerHTML = M.nextActions(profile, result).map((action) =>
    '<a class="action-card" href="' + M.esc(courseHref(action.href)) + '"><span class="tag">Next</span><strong>' + M.esc(action.title) + '</strong><span>' + M.esc(action.body) + '</span><span class="btn primary">Start</span></a>'
  ).join("");
  M.recordSession("source", {
    gameId: "source-lab",
    title: "Source Reading Lab",
    course: state.course,
    score: accuracy,
    accuracy,
    weakTopics,
    studyTargets: accuracy < 80 ? ["Source Reading", "Stimulus MCQ"] : ["Mixed Review"]
  });
  show("resultsScreen");
}

function zoom(delta) {
  state.zoom = Math.max(.75, Math.min(2.8, state.zoom + delta));
  $("#zoomWrap").style.setProperty("--zoom", state.zoom);
}

async function boot() {
  fillCourses();
  state.data = await M.loadArcadeData("../../");
  renderMetrics();
  $("#courseSelect").addEventListener("change", () => {
    state.course = $("#courseSelect").value;
    renderMetrics();
  });
  $("#startBtn").addEventListener("click", start);
  $("#nextBtn").addEventListener("click", next);
  $("#finishBtn").addEventListener("click", finish);
  $("#againBtn").addEventListener("click", () => {
    renderMetrics();
    show("setupScreen");
  });
  $("#zoomIn").addEventListener("click", () => zoom(.2));
  $("#zoomOut").addEventListener("click", () => zoom(-.2));
  $("#zoomReset").addEventListener("click", () => {
    state.zoom = 1;
    $("#zoomWrap").style.setProperty("--zoom", state.zoom);
  });
}

boot().catch((error) => {
  console.error(error);
  $("#sourceMetrics").innerHTML = emptyCard("warning", "Could not load source bank", "Refresh the page to try again.");
});
