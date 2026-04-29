const CHARACTERS = [
  {
    id: "archivist",
    name: "Archivist Nova",
    role: "Primary Source Pro",
    vehicle: "Archive Kart",
    emblem: "A",
    accent: "#66e9ff",
    body: "#174a76",
    stats: { speed: 7, handling: 8, boost: 6 },
    perk: "Extra source time"
  },
  {
    id: "cartographer",
    name: "Cartographer Cruz",
    role: "Map Master",
    vehicle: "Compass Coupe",
    emblem: "M",
    accent: "#ffd15c",
    body: "#8b5b15",
    stats: { speed: 8, handling: 6, boost: 7 },
    perk: "Sharper lane control"
  },
  {
    id: "reformer",
    name: "Reformer Rey",
    role: "Movement Builder",
    vehicle: "Petition Racer",
    emblem: "R",
    accent: "#64f0aa",
    body: "#167052",
    stats: { speed: 6, handling: 7, boost: 9 },
    perk: "Longer boost chains"
  },
  {
    id: "diplomat",
    name: "Diplomat Vale",
    role: "Treaty Tactician",
    vehicle: "Summit Speedster",
    emblem: "D",
    accent: "#ff5f9f",
    body: "#7e1d4d",
    stats: { speed: 8, handling: 7, boost: 6 },
    perk: "Faster recovery"
  }
];

const TRACKS = [
  {
    id: "source",
    title: "Source Circuit",
    subtitle: "Regents stimulus MCQs with document billboards and tight answer gates.",
    glyph: "DBQ",
    accent: "#66e9ff",
    theme: "regents",
    pool: "source",
    laps: 3
  },
  {
    id: "liberty",
    title: "Liberty Loop",
    subtitle: "U.S. History, civics, reform movements, amendments, presidents, and court cases.",
    glyph: "USA",
    accent: "#ffd15c",
    theme: "liberty",
    pool: "us",
    laps: 3
  },
  {
    id: "silk",
    title: "Silk Road Speedway",
    subtitle: "Global history, world history, geography, empires, revolutions, and trade routes.",
    glyph: "MAP",
    accent: "#64f0aa",
    theme: "global",
    pool: "global",
    laps: 3
  },
  {
    id: "apex",
    title: "AP Apex Grand Prix",
    subtitle: "A high-speed AP review mix across psych, APUSH, world, Euro, gov, econ, and human geo.",
    glyph: "AP",
    accent: "#ff5f9f",
    theme: "ap",
    pool: "ap",
    laps: 3
  }
];

const els = {
  characterGrid: document.querySelector("#characterGrid"),
  trackGrid: document.querySelector("#trackGrid"),
  characterScreen: document.querySelector("#characterScreen"),
  trackScreen: document.querySelector("#trackScreen"),
  raceScreen: document.querySelector("#raceScreen"),
  resultsScreen: document.querySelector("#resultsScreen"),
  topStats: document.querySelector("#topStats"),
  canvas: document.querySelector("#raceCanvas"),
  hudRacer: document.querySelector("#hudRacer"),
  hudLap: document.querySelector("#hudLap"),
  hudScore: document.querySelector("#hudScore"),
  hudStreak: document.querySelector("#hudStreak"),
  questionMeta: document.querySelector("#questionMeta"),
  questionText: document.querySelector("#questionText"),
  sourcePreview: document.querySelector("#sourcePreview"),
  sourceImage: document.querySelector("#sourceImage"),
  sourceCaption: document.querySelector("#sourceCaption"),
  timerBar: document.querySelector("#timerBar"),
  feedback: document.querySelector("#feedback"),
  answerDock: document.querySelector("#answerDock"),
  pauseBtn: document.querySelector("#pauseBtn"),
  quitBtn: document.querySelector("#quitBtn"),
  resultTitle: document.querySelector("#resultTitle"),
  resultGrid: document.querySelector("#resultGrid"),
  coachText: document.querySelector("#coachText"),
  againBtn: document.querySelector("#againBtn"),
  backToCharacters: document.querySelector("#backToCharacters")
};

const ctx = els.canvas.getContext("2d");
const state = {
  banks: null,
  character: CHARACTERS[0],
  track: TRACKS[0],
  pool: [],
  cursor: 0,
  current: null,
  selected: 0,
  total: 12,
  answered: 0,
  correct: 0,
  score: 0,
  streak: 0,
  running: false,
  paused: false,
  resolved: false,
  deadline: 0,
  answerSeconds: 15,
  distance: 0,
  speed: 0,
  boost: 0,
  shake: 0,
  spark: 0,
  kartX: 0,
  lastFrame: 0,
  dpr: 1
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffle(values) {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function cleanPrompt(prompt) {
  return String(prompt || "Choose the best answer.")
    .replace(/^Final wager:\s*/i, "")
    .replace(/^Final clue for ([^:]+):\s*/i, "");
}

function showScreen(screen) {
  [els.characterScreen, els.trackScreen, els.raceScreen, els.resultsScreen].forEach((el) => el.classList.remove("active"));
  screen.classList.add("active");
  scrollTo({ top: 0, behavior: "auto" });
}

function renderCharacters() {
  els.characterGrid.innerHTML = CHARACTERS.map((racer) => `
    <button class="racer-card" type="button" style="--accent:${racer.accent}" data-id="${racer.id}">
      <div class="portrait"><span>${escapeHtml(racer.emblem)}</span></div>
      <h3>${escapeHtml(racer.name)}</h3>
      <p><strong>${escapeHtml(racer.role)}</strong><br>${escapeHtml(racer.vehicle)} · ${escapeHtml(racer.perk)}</p>
      <div class="stat-grid">
        <div class="stat"><b>${racer.stats.speed}</b><span>Speed</span></div>
        <div class="stat"><b>${racer.stats.handling}</b><span>Grip</span></div>
        <div class="stat"><b>${racer.stats.boost}</b><span>Boost</span></div>
      </div>
    </button>
  `).join("");
  els.characterGrid.querySelectorAll(".racer-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.character = CHARACTERS.find((racer) => racer.id === button.dataset.id) || CHARACTERS[0];
      showScreen(els.trackScreen);
      updateTopStats();
    });
  });
}

function renderTracks() {
  els.trackGrid.innerHTML = TRACKS.map((track) => `
    <button class="track-card" type="button" style="--accent:${track.accent};--glyph:'${track.glyph}'" data-id="${track.id}">
      <div class="track-art" aria-hidden="true"><span>${escapeHtml(track.glyph)}</span></div>
      <h3>${escapeHtml(track.title)}</h3>
      <p>${escapeHtml(track.subtitle)}</p>
      <div class="stat-grid">
        <div class="stat"><b>${track.laps}</b><span>Laps</span></div>
        <div class="stat"><b>12</b><span>Gates</span></div>
        <div class="stat"><b>MCQ</b><span>Mode</span></div>
      </div>
    </button>
  `).join("");
  els.trackGrid.querySelectorAll(".track-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.track = TRACKS.find((track) => track.id === button.dataset.id) || TRACKS[0];
      startRace();
    });
  });
}

function updateTopStats() {
  els.topStats.innerHTML = [
    state.character ? state.character.name : "Choose racer",
    state.track ? state.track.title : "Choose track",
    state.banks ? "Banks loaded" : "Loading bank"
  ].map((text) => `<span>${escapeHtml(text)}</span>`).join("");
}

async function loadBanks() {
  const [chrono, regents] = await Promise.all([
    fetch("../../data/chrono-defense-bank.json").then((r) => r.json()),
    fetch("../../data/regents-gauntlet-bank.json").then((r) => r.json())
  ]);
  state.banks = { chrono, regents };
  updateTopStats();
}

function sourceBased(question) {
  return Boolean(
    (question.stimulusImages && question.stimulusImages.length) ||
    question.stimulusRequired ||
    /based on|according to|document|map|cartoon|graph|chart|excerpt|passage|photograph|source/i.test(question.stem || question.prompt || "")
  );
}

function normalizeRegents(question) {
  const choices = (question.choices || []).slice(0, 4).map((choice) => String(choice.text || ""));
  const correctIndex = (question.choices || []).slice(0, 4).findIndex((choice) => String(choice.label) === String(question.correct));
  if (choices.length !== 4 || correctIndex < 0) return null;
  return {
    prompt: cleanPrompt(question.stem || question.prompt),
    choices,
    correctIndex,
    explanation: question.explanation || "Review the source and the wording of each answer choice.",
    course: question.course || "Regents Review",
    set: question.set || question.day || "",
    source: question.source || "",
    images: question.stimulusImages || []
  };
}

function normalizeChrono(question, rawPool, globalAnswers) {
  if (question.choices && question.choices.length >= 4) {
    const choices = question.choices.slice(0, 4).map((choice) => String(choice.text || ""));
    const correctIndex = question.choices.slice(0, 4).findIndex((choice) => String(choice.label) === String(question.correct));
    if (correctIndex >= 0) {
      return {
        prompt: cleanPrompt(question.stem || question.prompt),
        choices,
        correctIndex,
        explanation: question.explanation || "",
        course: question.course || "Review Arcade",
        set: question.set || question.day || "",
        source: question.source || question.category || "",
        images: question.stimulusImages || []
      };
    }
  }
  if (!question.answer || !question.prompt) return null;
  const sameCourse = rawPool.filter((item) => item.answer && item.answer !== question.answer && item.course === question.course).map((item) => item.answer);
  const distractors = uniq(shuffle(sameCourse.length >= 3 ? sameCourse : globalAnswers).filter((answer) => answer !== question.answer)).slice(0, 3);
  if (distractors.length < 3) return null;
  const answerSet = shuffle([question.answer, ...distractors]);
  return {
    prompt: cleanPrompt(question.prompt),
    choices: answerSet,
    correctIndex: answerSet.findIndex((choice) => choice === question.answer),
    explanation: question.explanation || `Correct answer: ${question.answer}`,
    course: question.course || "Review Arcade",
    set: question.set || question.day || "",
    source: question.source || question.category || "",
    images: []
  };
}

function poolForTrack(track) {
  const chronoRaw = (state.banks?.chrono?.questions || []).filter((q) => q.answer || q.choices);
  const regentsRaw = state.banks?.regents?.questions || [];
  const globalAnswers = uniq(chronoRaw.map((q) => q.answer));
  if (track.pool === "source") {
    return shuffle(regentsRaw.filter(sourceBased).map(normalizeRegents).filter(Boolean));
  }
  const filters = {
    us: /U\.S\.|United States|Civics|Government|Grade 7|Grade 8|Grade 11|APUSH|AP U\.S\./i,
    global: /Global|World|European|Human Geography|Geography|Eastern|Western|Grade 5|Grade 6|Grade 9|Grade 10/i,
    ap: /^AP\b|AP |Advanced Placement/i
  };
  const regex = filters[track.pool] || /./;
  const filteredChrono = chronoRaw.filter((q) => regex.test(q.course || ""));
  const chrono = filteredChrono.map((q) => normalizeChrono(q, filteredChrono, globalAnswers)).filter(Boolean);
  const regents = regentsRaw
    .filter((q) => track.pool === "us" ? /U\.S\.|United States|Grade 11/i.test(q.course || "") : /Global|Grade 10/i.test(q.course || ""))
    .map(normalizeRegents)
    .filter(Boolean);
  return shuffle([...chrono, ...regents]);
}

function startRace() {
  if (!state.banks) {
    els.topStats.innerHTML = "<span>Still loading question banks...</span>";
    return;
  }
  state.pool = poolForTrack(state.track);
  if (!state.pool.length) return;
  state.cursor = 0;
  state.current = null;
  state.selected = 0;
  state.total = 12;
  state.answered = 0;
  state.correct = 0;
  state.score = 0;
  state.streak = 0;
  state.running = true;
  state.paused = false;
  state.resolved = false;
  state.distance = 0;
  state.speed = 0;
  state.boost = 0;
  state.shake = 0;
  state.spark = 0;
  state.kartX = 0;
  showScreen(els.raceScreen);
  resizeCanvas();
  nextQuestion();
  state.lastFrame = performance.now();
  requestAnimationFrame(tick);
  updateTopStats();
}

function nextQuestion() {
  if (state.answered >= state.total) {
    finishRace();
    return;
  }
  if (state.cursor >= state.pool.length) {
    state.pool = shuffle(state.pool);
    state.cursor = 0;
  }
  state.current = state.pool[state.cursor];
  state.cursor += 1;
  state.selected = 0;
  state.resolved = false;
  state.answerSeconds = state.current.images.length || state.character.id === "archivist" ? 18 : 14;
  state.deadline = Date.now() + state.answerSeconds * 1000;
  renderQuestion();
}

function renderQuestion() {
  const q = state.current;
  els.questionMeta.textContent = [q.course, q.set, q.source, `Gate ${state.answered + 1}/${state.total}`].filter(Boolean).join(" · ");
  els.questionText.textContent = q.prompt;
  if (q.images.length) {
    els.sourcePreview.classList.remove("hidden");
    els.sourceImage.src = q.images[0].src;
    els.sourceCaption.textContent = q.images[0].label || "Source stimulus";
  } else {
    els.sourcePreview.classList.add("hidden");
    els.sourceImage.removeAttribute("src");
  }
  els.feedback.className = "feedback";
  els.feedback.textContent = "Choose the correct gate. Arrow keys steer; A-D or tap answers selects a gate.";
  els.answerDock.innerHTML = q.choices.map((choice, index) => `
    <button class="answer-btn" type="button" data-index="${index}">
      <b>${String.fromCharCode(65 + index)}</b>
      ${escapeHtml(choice)}
    </button>
  `).join("");
  els.answerDock.querySelectorAll(".answer-btn").forEach((button) => {
    button.addEventListener("click", () => gradeAnswer(Number(button.dataset.index)));
  });
  refreshAnswers();
}

function refreshAnswers() {
  els.answerDock.querySelectorAll(".answer-btn").forEach((button, index) => {
    button.classList.toggle("selected", index === state.selected && !state.resolved);
  });
}

function gradeAnswer(index, timedOut = false) {
  if (state.resolved || !state.current) return;
  state.resolved = true;
  const correct = index === state.current.correctIndex;
  state.answered += 1;
  if (correct) {
    state.correct += 1;
    state.streak += 1;
    const boostPoints = Math.min(250, state.streak * 35);
    state.score += 400 + boostPoints + Math.round(state.character.stats.boost * 12);
    state.boost = 1.4 + state.character.stats.boost / 18;
    state.spark = 1;
    els.feedback.className = "feedback good";
    els.feedback.innerHTML = `<strong>Boost!</strong> Correct gate. ${escapeHtml(state.current.explanation || "Keep the streak alive.")}`;
  } else {
    state.streak = 0;
    state.score = Math.max(0, state.score - 75);
    state.shake = state.character.id === "diplomat" ? 0.55 : 0.9;
    els.feedback.className = "feedback bad";
    const lead = timedOut ? "Time ran out." : "Spinout.";
    els.feedback.innerHTML = `<strong>${lead}</strong> Correct gate: ${String.fromCharCode(65 + state.current.correctIndex)}. ${escapeHtml(state.current.explanation || "")}`;
  }
  els.answerDock.querySelectorAll(".answer-btn").forEach((button, i) => {
    button.classList.toggle("correct", i === state.current.correctIndex);
    button.classList.toggle("wrong", i === index && !correct);
  });
  setTimeout(() => {
    if (state.running) nextQuestion();
  }, correct ? 1050 : 1850);
}

function finishRace() {
  state.running = false;
  const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
  const medal = accuracy >= 90 ? "First Place" : accuracy >= 75 ? "Podium Finish" : accuracy >= 60 ? "Finished the Rally" : "Practice Lap Complete";
  els.resultTitle.textContent = medal;
  els.resultGrid.innerHTML = [
    [state.score, "points"],
    [`${state.correct}/${state.answered}`, "correct"],
    [`${accuracy}%`, "accuracy"],
    [`${state.track.laps}/3`, "laps"]
  ].map(([big, label]) => `<div><strong>${escapeHtml(big)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  els.coachText.textContent = accuracy >= 85
    ? "Strong race. Move to Source Circuit or a full Regents practice exam next."
    : accuracy >= 65
      ? "Good base. Replay the same track and read every source caption before choosing a gate."
      : "Use this as a diagnostic lap. Slow down, read the wording, and replay one track until the misses drop.";
  window.MrMacsAnalytics?.track("game_complete", {
    gameId: "regents-rally-source-circuit",
    title: "Regents Rally: Source Circuit",
    score: accuracy,
    questions: state.answered
  }, { counter: "game-completions" });
  showScreen(els.resultsScreen);
}

function updateHud() {
  const lap = Math.min(state.track.laps, Math.floor(state.answered / (state.total / state.track.laps)) + 1);
  els.hudRacer.textContent = state.character.name.split(" ").pop();
  els.hudLap.textContent = `${lap}/${state.track.laps}`;
  els.hudScore.textContent = String(state.score);
  els.hudStreak.textContent = String(state.streak);
  if (!state.resolved && state.current) {
    const left = Math.max(0, state.deadline - Date.now());
    const pct = left / (state.answerSeconds * 1000);
    els.timerBar.style.transform = `scaleX(${pct})`;
    if (left <= 0) gradeAnswer(-1, true);
  }
}

function resizeCanvas() {
  const rect = els.canvas.getBoundingClientRect();
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  els.canvas.width = Math.max(1, Math.floor(rect.width * state.dpr));
  els.canvas.height = Math.max(1, Math.floor(rect.height * state.dpr));
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function tick(now) {
  if (!state.running) return;
  const dt = Math.min(48, now - state.lastFrame) / 1000;
  state.lastFrame = now;
  if (!state.paused) {
    const target = 62 + state.character.stats.speed * 7 + state.boost * 38 - state.shake * 22;
    state.speed += (target - state.speed) * 0.055;
    state.distance += state.speed * dt;
    state.boost = Math.max(0, state.boost - dt * 0.95);
    state.shake = Math.max(0, state.shake - dt * 1.4);
    state.spark = Math.max(0, state.spark - dt * 1.2);
  }
  updateHud();
  drawRace(now);
  requestAnimationFrame(tick);
}

function drawRace(now) {
  const w = els.canvas.clientWidth;
  const h = els.canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  const shakeX = state.shake ? (Math.random() - 0.5) * state.shake * 16 : 0;
  ctx.save();
  ctx.translate(shakeX, 0);
  drawSky(w, h, now);
  drawRoad(w, h);
  drawGates(w, h, now);
  drawRivals(w, h, now);
  drawKart(w, h, now);
  ctx.restore();
  if (state.paused) {
    ctx.fillStyle = "rgba(5,8,22,.62)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f8fbff";
    ctx.font = "900 42px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", w / 2, h / 2);
  }
}

function themeColors() {
  const base = {
    regents: ["#071630", "#132b5c", "#66e9ff"],
    liberty: ["#161326", "#402a17", "#ffd15c"],
    global: ["#071b17", "#17432e", "#64f0aa"],
    ap: ["#180d27", "#472045", "#ff5f9f"]
  };
  return base[state.track.theme] || base.regents;
}

function drawSky(w, h, now) {
  const [top, mid, accent] = themeColors();
  const g = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, "#050816");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.arc(w * 0.76, h * 0.18, 120 + Math.sin(now / 900) * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  drawBackdropObjects(w, h, accent);
}

function drawBackdropObjects(w, h, accent) {
  const horizon = h * 0.42;
  ctx.fillStyle = "rgba(1,4,13,.58)";
  for (let i = 0; i < 14; i += 1) {
    const x = ((i * 137 - state.distance * 0.25) % (w + 220)) - 110;
    const height = 70 + ((i * 31) % 110);
    const width = 36 + ((i * 17) % 54);
    if (state.track.theme === "global") {
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.lineTo(x + width * 0.5, horizon - height);
      ctx.lineTo(x + width, horizon);
      ctx.fill();
    } else if (state.track.theme === "liberty") {
      ctx.fillRect(x, horizon - height, width, height);
      ctx.fillStyle = "rgba(255,209,92,.22)";
      ctx.fillRect(x + width * 0.42, horizon - height - 40, width * 0.16, 40);
      ctx.fillStyle = "rgba(1,4,13,.58)";
    } else {
      ctx.fillRect(x, horizon - height, width, height);
      ctx.fillStyle = "rgba(255,255,255,.08)";
      for (let y = horizon - height + 14; y < horizon - 8; y += 18) ctx.fillRect(x + 8, y, width - 16, 3);
      ctx.fillStyle = "rgba(1,4,13,.58)";
    }
  }
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.36;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const y = horizon - 44 - i * 42;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.25, y - 20, w * 0.7, y + 22, w, y - 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function roadPoint(n, w, h) {
  const horizon = h * 0.43;
  const y = horizon + n * n * (h - horizon + 90);
  const roadWidth = 90 + n * n * w * 1.15;
  const curve = Math.sin(state.distance * 0.015 + n * 4.2) * 44 * (1 - n) + Math.sin(state.distance * 0.004) * 28;
  return { x: w / 2 + curve, y, roadWidth };
}

function drawRoad(w, h) {
  const segments = 34;
  for (let i = 0; i < segments; i += 1) {
    const n1 = i / segments;
    const n2 = (i + 1) / segments;
    const p1 = roadPoint(n1, w, h);
    const p2 = roadPoint(n2, w, h);
    const pulse = Math.floor((i + state.distance * 0.12) / 2) % 2;
    ctx.fillStyle = pulse ? "#182238" : "#10182c";
    ctx.beginPath();
    ctx.moveTo(p1.x - p1.roadWidth / 2, p1.y);
    ctx.lineTo(p1.x + p1.roadWidth / 2, p1.y);
    ctx.lineTo(p2.x + p2.roadWidth / 2, p2.y);
    ctx.lineTo(p2.x - p2.roadWidth / 2, p2.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pulse ? "rgba(255,209,92,.12)" : "rgba(102,233,255,.10)";
    ctx.beginPath();
    ctx.moveTo(p1.x - p1.roadWidth / 2 - 16, p1.y);
    ctx.lineTo(p1.x - p1.roadWidth / 2, p1.y);
    ctx.lineTo(p2.x - p2.roadWidth / 2, p2.y);
    ctx.lineTo(p2.x - p2.roadWidth / 2 - 30, p2.y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p1.x + p1.roadWidth / 2 + 16, p1.y);
    ctx.lineTo(p1.x + p1.roadWidth / 2, p1.y);
    ctx.lineTo(p2.x + p2.roadWidth / 2, p2.y);
    ctx.lineTo(p2.x + p2.roadWidth / 2 + 30, p2.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,.34)";
  ctx.lineWidth = 3;
  for (let lane = 1; lane <= 3; lane += 1) {
    ctx.beginPath();
    for (let i = 3; i < segments; i += 1) {
      const n = i / segments;
      const p = roadPoint(n, w, h);
      const x = p.x - p.roadWidth / 2 + p.roadWidth * (lane / 4);
      if (i === 3) ctx.moveTo(x, p.y);
      else ctx.lineTo(x, p.y);
    }
    ctx.stroke();
  }
}

function drawGates(w, h, now) {
  if (!state.current) return;
  const p = roadPoint(0.34 + Math.sin(now / 700) * 0.01, w, h);
  const gateW = p.roadWidth / 4.6;
  for (let i = 0; i < 4; i += 1) {
    const x = p.x - p.roadWidth * 0.38 + i * p.roadWidth * 0.25;
    const y = p.y - 64;
    const active = i === state.selected && !state.resolved;
    const correct = state.resolved && i === state.current.correctIndex;
    const wrong = state.resolved && i === state.selected && i !== state.current.correctIndex;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = correct ? "rgba(100,240,170,.9)" : wrong ? "rgba(255,95,128,.86)" : active ? "rgba(102,233,255,.86)" : "rgba(8,14,30,.82)";
    ctx.strokeStyle = active || correct ? "#ffffff" : "rgba(255,255,255,.4)";
    ctx.lineWidth = active ? 4 : 2;
    roundRect(-gateW / 2, -36, gateW, 72, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = active || correct || wrong ? "#07101c" : "#f8fbff";
    ctx.font = `900 ${Math.max(26, gateW * 0.28)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String.fromCharCode(65 + i), 0, 0);
    ctx.restore();
  }
}

function drawRivals(w, h, now) {
  for (let i = 0; i < 3; i += 1) {
    const n = 0.52 + i * 0.11 + Math.sin(now / 700 + i) * 0.015;
    const p = roadPoint(n, w, h);
    const lane = (i % 3) - 1;
    const x = p.x + lane * p.roadWidth * 0.18;
    const y = p.y;
    const scale = 0.22 + n * 0.42;
    drawMiniKart(x, y, scale, CHARACTERS[(i + 1) % CHARACTERS.length]);
  }
}

function drawKart(w, h) {
  const laneTarget = (state.selected - 1.5) * Math.min(180, w * 0.16);
  const handling = 0.045 + state.character.stats.handling * 0.006;
  state.kartX += (laneTarget - state.kartX) * handling;
  const x = w / 2 + state.kartX;
  const y = h - 94;
  const scale = Math.max(0.82, Math.min(1.25, w / 1120));
  if (state.boost > 0.15) {
    const [, , accent] = themeColors();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = 8;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 80 + i * 40, y + 60);
      ctx.lineTo(x - 120 + i * 30, y + 170);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  drawHeroKart(x, y, scale, state.character);
  if (state.spark > 0) {
    ctx.fillStyle = state.character.accent;
    ctx.globalAlpha = state.spark;
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      const r = 40 + i * 3;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r, y + 10 + Math.sin(a) * r * 0.45, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawMiniKart(x, y, scale, racer) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(0, 42, 75, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = racer.body;
  roundRect(-55, -10, 110, 54, 12);
  ctx.fill();
  ctx.fillStyle = racer.accent;
  roundRect(-36, -38, 72, 46, 18);
  ctx.fill();
  ctx.fillStyle = "#050816";
  ctx.beginPath();
  ctx.arc(-44, 42, 18, 0, Math.PI * 2);
  ctx.arc(44, 42, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeroKart(x, y, scale, racer) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.beginPath();
  ctx.ellipse(0, 70, 170, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#050816";
  ctx.beginPath();
  ctx.arc(-92, 58, 42, 0, Math.PI * 2);
  ctx.arc(92, 58, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = racer.accent;
  ctx.beginPath();
  ctx.arc(-92, 58, 19, 0, Math.PI * 2);
  ctx.arc(92, 58, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = racer.body;
  roundRect(-116, -8, 232, 78, 18);
  ctx.fill();
  const g = ctx.createLinearGradient(-90, -80, 90, 50);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.28, racer.accent);
  g.addColorStop(1, racer.body);
  ctx.fillStyle = g;
  roundRect(-68, -86, 136, 94, 34);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.38)";
  roundRect(-42, -60, 84, 34, 16);
  ctx.fill();
  ctx.fillStyle = "#07101c";
  ctx.font = "900 44px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(racer.emblem, 0, -2);
  ctx.fillStyle = racer.accent;
  roundRect(-82, 12, 164, 34, 12);
  ctx.fill();
  ctx.fillStyle = "#07101c";
  ctx.font = "900 18px Inter, sans-serif";
  ctx.fillText(racer.vehicle.toUpperCase().slice(0, 14), 0, 31);
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

document.addEventListener("keydown", (event) => {
  if (!els.raceScreen.classList.contains("active")) return;
  if (event.key === "ArrowLeft") {
    state.selected = Math.max(0, state.selected - 1);
    refreshAnswers();
    event.preventDefault();
  } else if (event.key === "ArrowRight") {
    state.selected = Math.min(3, state.selected + 1);
    refreshAnswers();
    event.preventDefault();
  } else if (event.key === "Enter" || event.key === " ") {
    gradeAnswer(state.selected);
    event.preventDefault();
  } else if (/^[abcd]$/i.test(event.key)) {
    gradeAnswer(event.key.toUpperCase().charCodeAt(0) - 65);
  } else if (event.key === "Escape") {
    state.paused = !state.paused;
  }
});

els.pauseBtn.addEventListener("click", () => {
  state.paused = !state.paused;
  els.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
});
els.quitBtn.addEventListener("click", () => {
  state.running = false;
  showScreen(els.trackScreen);
});
els.againBtn.addEventListener("click", () => showScreen(els.trackScreen));
els.backToCharacters.addEventListener("click", () => showScreen(els.characterScreen));
addEventListener("resize", resizeCanvas, { passive: true });

renderCharacters();
renderTracks();
loadBanks().catch(() => {
  els.topStats.innerHTML = "<span>Question bank failed to load</span>";
});
