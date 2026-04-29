const CHARACTERS = [
  {
    id: "archivist",
    name: "Archivist Nova",
    role: "Primary Source Pro",
    vehicle: "Archive Kart",
    accent: "#66e9ff",
    body: "#1592b6",
    sprite: "0% 0%",
    stats: { speed: 7, handling: 8, boost: 6 },
    perk: "Extra source time"
  },
  {
    id: "cartographer",
    name: "Cartographer Cruz",
    role: "Map Master",
    vehicle: "Compass Coupe",
    accent: "#ffd15c",
    body: "#c38a1d",
    sprite: "100% 0%",
    stats: { speed: 8, handling: 6, boost: 7 },
    perk: "Sharper lane control"
  },
  {
    id: "reformer",
    name: "Reformer Rey",
    role: "Movement Builder",
    vehicle: "Petition Racer",
    accent: "#64f0aa",
    body: "#2aa365",
    sprite: "0% 100%",
    stats: { speed: 6, handling: 7, boost: 9 },
    perk: "Longer boost chains"
  },
  {
    id: "diplomat",
    name: "Diplomat Vale",
    role: "Treaty Tactician",
    vehicle: "Summit Speedster",
    accent: "#ff5f9f",
    body: "#bd3b85",
    sprite: "100% 100%",
    stats: { speed: 8, handling: 7, boost: 6 },
    perk: "Faster recovery"
  }
];

const TRACKS = [
  {
    id: "source",
    title: "Source Circuit",
    subtitle: "Museum curves, source billboards, item cubes, and Regents stimulus questions.",
    accent: "#66e9ff",
    theme: "regents",
    pool: "source",
    sprite: "0% 0%",
    laps: 3
  },
  {
    id: "liberty",
    title: "Liberty Loop",
    subtitle: "Civics city streets with presidents, amendments, reformers, and court cases.",
    accent: "#ffd15c",
    theme: "liberty",
    pool: "us",
    sprite: "100% 0%",
    laps: 3
  },
  {
    id: "silk",
    title: "Silk Road Speedway",
    subtitle: "Global history switchbacks through maps, empires, revolutions, and trade routes.",
    accent: "#64f0aa",
    theme: "global",
    pool: "global",
    sprite: "0% 100%",
    laps: 3
  },
  {
    id: "apex",
    title: "AP Apex Grand Prix",
    subtitle: "A neon AP review circuit across psych, APUSH, world, Euro, gov, econ, and geo.",
    accent: "#ff5f9f",
    theme: "ap",
    pool: "ap",
    sprite: "100% 100%",
    laps: 3
  }
];

const ITEMS = [
  {
    id: "scroll",
    name: "Archive Boost",
    short: "Boost",
    sprite: "0% 0%",
    color: "#66e9ff",
    coach: "Correct. Archive Boost launched."
  },
  {
    id: "rocket",
    name: "Compass Rocket",
    short: "Rocket",
    sprite: "100% 0%",
    color: "#ffd15c",
    coach: "Correct. Compass Rocket hit the racer ahead."
  },
  {
    id: "shield",
    name: "Citation Shield",
    short: "Shield",
    sprite: "0% 100%",
    color: "#64f0aa",
    coach: "Correct. Citation Shield is active."
  },
  {
    id: "burst",
    name: "Debate Burst",
    short: "Burst",
    sprite: "100% 100%",
    color: "#ff5f9f",
    coach: "Correct. Debate Burst slowed the field."
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
  hudPlace: document.querySelector("#hudPlace"),
  hudScore: document.querySelector("#hudScore"),
  hudItem: document.querySelector("#hudItem"),
  itemThumb: document.querySelector("#itemThumb"),
  itemBtn: document.querySelector("#itemBtn"),
  speedBar: document.querySelector("#speedBar"),
  questionCard: document.querySelector("#questionCard"),
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
const keys = new Set();
const TRACK_LENGTH = 5400;
const VISIBLE_RANGE = 1150;

function loadAsset(src) {
  const image = new Image();
  image.src = src;
  return image;
}

const ASSETS = {
  keyArt: loadAsset("rally-key-art.png"),
  racers: loadAsset("rally-racers.png"),
  tracks: loadAsset("rally-tracks.png"),
  items: loadAsset("rally-items.png")
};

const state = {
  banks: null,
  character: CHARACTERS[0],
  track: TRACKS[0],
  pool: [],
  cursor: 0,
  current: null,
  running: false,
  paused: false,
  quizOpen: false,
  resolved: false,
  distance: 0,
  speed: 0,
  lane: 0,
  laneVel: 0,
  driftCharge: 0,
  drifting: false,
  boost: 0,
  shield: 0,
  spin: 0,
  hitFlash: 0,
  item: null,
  itemBoxes: [],
  rivals: [],
  particles: [],
  score: 0,
  correct: 0,
  attempts: 0,
  streak: 0,
  maxStreak: 0,
  place: 4,
  lap: 1,
  selected: 0,
  answerSeconds: 16,
  deadline: 0,
  finishTime: 0,
  startedAt: 0,
  lastFrame: 0,
  toast: "",
  toastTime: 0,
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ordinal(value) {
  const suffix = value === 1 ? "st" : value === 2 ? "nd" : value === 3 ? "rd" : "th";
  return `${value}${suffix}`;
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

function setToast(text, seconds = 1.5) {
  state.toast = text;
  state.toastTime = seconds;
}

function renderCharacters() {
  els.characterGrid.innerHTML = CHARACTERS.map((racer) => `
    <button class="racer-card" type="button" style="--accent:${racer.accent};--sprite:${racer.sprite}" data-id="${racer.id}">
      <div class="portrait" aria-hidden="true"></div>
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
    <button class="track-card" type="button" style="--accent:${track.accent};--track-sprite:${track.sprite}" data-id="${track.id}">
      <div class="track-art" aria-hidden="true"></div>
      <h3>${escapeHtml(track.title)}</h3>
      <p>${escapeHtml(track.subtitle)}</p>
      <div class="stat-grid">
        <div class="stat"><b>${track.laps}</b><span>Laps</span></div>
        <div class="stat"><b>Item</b><span>Questions</span></div>
        <div class="stat"><b>4</b><span>Racers</span></div>
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
    /based on|according to|document|map|cartoon|graph|chart|excerpt|passage|photograph|source|illustration/i.test(question.stem || question.prompt || "")
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
    explanation: question.explanation || "Review the source, then eliminate the answer choices that overstate or distort it.",
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
        explanation: question.explanation || "Use the wording of the clue to eliminate close distractors.",
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
  return shuffle([...regents, ...chrono]);
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
  state.running = true;
  state.paused = false;
  state.quizOpen = false;
  state.resolved = false;
  state.distance = 0;
  state.speed = 330;
  state.lane = 0;
  state.laneVel = 0;
  state.driftCharge = 0;
  state.drifting = false;
  state.boost = 0;
  state.shield = 0;
  state.spin = 0;
  state.hitFlash = 0;
  state.item = null;
  state.score = 0;
  state.correct = 0;
  state.attempts = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.place = 4;
  state.lap = 1;
  state.finishTime = 0;
  state.startedAt = performance.now();
  state.itemBoxes = buildItemBoxes();
  state.rivals = buildRivals();
  state.particles = [];
  showScreen(els.raceScreen);
  resizeCanvas();
  updateItemHud();
  updateHud();
  updateTopStats();
  setToast("GO", 0.9);
  state.lastFrame = performance.now();
  requestAnimationFrame(tick);
}

function buildItemBoxes() {
  const boxes = [];
  const lanes = [-0.68, 0, 0.68];
  let id = 0;
  for (let distance = 520; distance < TRACK_LENGTH * state.track.laps - 220; distance += 520) {
    const offset = Math.floor(distance / 520) % lanes.length;
    boxes.push({ id: id += 1, distance, lane: lanes[offset], item: ITEMS[id % ITEMS.length], taken: false });
    boxes.push({ id: id += 1, distance: distance + 60, lane: lanes[(offset + 2) % lanes.length], item: ITEMS[id % ITEMS.length], taken: false });
  }
  return boxes;
}

function buildRivals() {
  return CHARACTERS
    .filter((racer) => racer.id !== state.character.id)
    .map((racer, index) => ({
      racer,
      distance: 60 + index * 95,
      lane: [-0.55, 0.18, 0.62][index] || 0,
      base: 428 + racer.stats.speed * 18 + index * 14,
      speed: 420 + index * 22,
      hit: 0,
      boost: 0
    }));
}

function nextQuestion() {
  if (state.cursor >= state.pool.length) {
    state.pool = shuffle(state.pool);
    state.cursor = 0;
  }
  state.current = state.pool[state.cursor];
  state.cursor += 1;
  return state.current;
}

function openItemQuestion() {
  if (!state.running || state.paused || state.quizOpen || !state.item) return;
  const question = nextQuestion();
  state.quizOpen = true;
  state.resolved = false;
  state.selected = 0;
  state.answerSeconds = question.images.length || state.character.id === "archivist" ? 22 : 16;
  state.deadline = Date.now() + state.answerSeconds * 1000;
  renderQuestion();
  els.questionCard.classList.remove("hidden");
  els.questionCard.classList.add("active");
}

function closeItemQuestion() {
  state.quizOpen = false;
  state.current = null;
  els.questionCard.classList.add("hidden");
  els.questionCard.classList.remove("active");
  updateItemHud();
}

function renderQuestion() {
  const q = state.current;
  els.questionMeta.textContent = [state.item.name, q.course, q.set, q.source].filter(Boolean).join(" · ");
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
  els.feedback.textContent = "Answer correctly to activate the item.";
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
  state.attempts += 1;
  if (correct) {
    state.correct += 1;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.score += 750 + state.streak * 120;
    applyItem(state.item);
    els.feedback.className = "feedback good";
    els.feedback.innerHTML = `<strong>${escapeHtml(state.item.coach)}</strong> ${escapeHtml(state.current.explanation || "")}`;
    setToast(state.item.short.toUpperCase(), 1.2);
  } else {
    state.streak = 0;
    state.score = Math.max(0, state.score - 150);
    if (state.shield > 0) {
      state.shield = Math.max(0, state.shield - 1.2);
      setToast("SHIELD SAVED IT", 1.1);
    } else {
      state.spin = state.character.id === "diplomat" ? 0.55 : 0.95;
      state.speed *= 0.58;
      setToast(timedOut ? "TIMEOUT" : "MISFIRE", 1.2);
    }
    els.feedback.className = "feedback bad";
    const lead = timedOut ? "Time ran out." : "Item fizzled.";
    els.feedback.innerHTML = `<strong>${lead}</strong> Correct answer: ${String.fromCharCode(65 + state.current.correctIndex)}. ${escapeHtml(state.current.explanation || "")}`;
  }
  els.answerDock.querySelectorAll(".answer-btn").forEach((button, i) => {
    button.classList.toggle("correct", i === state.current.correctIndex);
    button.classList.toggle("wrong", i === index && !correct);
  });
  state.item = null;
  setTimeout(() => {
    if (state.running) closeItemQuestion();
  }, correct ? 1250 : 2100);
}

function applyItem(item) {
  if (!item) return;
  if (item.id === "scroll") {
    state.boost = Math.max(state.boost, 3.3 + state.character.stats.boost * 0.14);
    burstParticles(state.lane, state.character.accent, 24);
  } else if (item.id === "rocket") {
    const ahead = state.rivals
      .filter((rival) => rival.distance > state.distance - 40)
      .sort((a, b) => a.distance - b.distance)[0] || state.rivals[0];
    if (ahead) {
      ahead.hit = 2.9;
      ahead.speed *= 0.48;
      ahead.distance = Math.max(0, ahead.distance - 130);
      burstParticles(ahead.lane, item.color, 28);
    }
  } else if (item.id === "shield") {
    state.shield = 8.5;
    burstParticles(state.lane, item.color, 20);
  } else if (item.id === "burst") {
    state.rivals.forEach((rival) => {
      rival.hit = Math.max(rival.hit, 2.2);
      rival.speed *= 0.62;
    });
    burstParticles(0, item.color, 38);
  }
}

function collectItem(box) {
  if (box.taken || state.item || state.quizOpen) return;
  box.taken = true;
  state.item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  state.score += 120;
  updateItemHud();
  setToast("ITEM READY", 1.1);
  burstParticles(box.lane, state.item.color, 16);
}

function updateItemHud() {
  if (state.item) {
    els.hudItem.textContent = state.item.name;
    els.itemThumb.style.backgroundImage = "url('rally-items.png')";
    els.itemThumb.style.backgroundPosition = state.item.sprite;
    els.itemThumb.classList.add("ready");
    els.itemBtn.disabled = false;
  } else {
    els.hudItem.textContent = "Empty";
    els.itemThumb.style.backgroundImage = "";
    els.itemThumb.style.backgroundPosition = "";
    els.itemThumb.classList.remove("ready");
    els.itemBtn.disabled = true;
  }
}

function updateHud() {
  const total = TRACK_LENGTH * state.track.laps;
  state.lap = Math.min(state.track.laps, Math.floor(state.distance / TRACK_LENGTH) + 1);
  state.place = 1 + state.rivals.filter((rival) => rival.distance > state.distance).length;
  els.hudRacer.textContent = state.character.name.split(" ").pop();
  els.hudLap.textContent = `${state.lap}/${state.track.laps}`;
  els.hudPlace.textContent = ordinal(state.place);
  els.hudScore.textContent = String(Math.max(0, Math.round(state.score)));
  els.speedBar.style.transform = `scaleX(${clamp(state.speed / 620, 0, 1)})`;
  if (state.quizOpen && !state.resolved && state.current) {
    const left = Math.max(0, state.deadline - Date.now());
    els.timerBar.style.transform = `scaleX(${left / (state.answerSeconds * 1000)})`;
    if (left <= 0) gradeAnswer(-1, true);
  }
  if (state.distance >= total) finishRace();
}

function finishRace() {
  if (!state.running) return;
  state.running = false;
  state.finishTime = (performance.now() - state.startedAt) / 1000;
  const accuracy = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0;
  const title = state.place === 1 ? "First Place" : state.place <= 3 ? "Podium Finish" : "Race Finished";
  els.resultTitle.textContent = title;
  els.resultGrid.innerHTML = [
    [ordinal(state.place), "place"],
    [`${state.finishTime.toFixed(1)}s`, "time"],
    [`${state.correct}/${state.attempts}`, "items"],
    [`${accuracy}%`, "accuracy"]
  ].map(([big, label]) => `<div><strong>${escapeHtml(big)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  els.coachText.textContent = accuracy >= 85
    ? "Strong item control. Keep racing Source Circuit, then move into the full Regents practice exam."
    : accuracy >= 60
      ? "Good racing base. The next jump is reading source captions before firing items."
      : "Replay one track and use fewer panic items. Correct item questions matter more than raw speed.";
  window.MrMacsAnalytics?.track("game_complete", {
    gameId: "regents-rally-source-circuit",
    title: "Regents Rally: Source Circuit",
    score: accuracy,
    questions: state.attempts
  }, { counter: "game-completions" });
  showScreen(els.resultsScreen);
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
  if (!state.paused && !state.quizOpen) {
    updateRace(dt);
  }
  updateHud();
  drawRace(now, dt);
  requestAnimationFrame(tick);
}

function updateRace(dt) {
  const left = keys.has("ArrowLeft") || keys.has("a");
  const right = keys.has("ArrowRight") || keys.has("d");
  const accelerate = keys.has("ArrowUp") || keys.has("w");
  const brake = keys.has("ArrowDown") || keys.has("s");
  const drift = keys.has(" ") && (left || right) && state.speed > 260;
  const steer = (right ? 1 : 0) - (left ? 1 : 0);
  const offroad = Math.max(0, Math.abs(state.lane) - 1.04);
  const maxSpeed = 306 + state.character.stats.speed * 16 + (accelerate ? 146 : 46) - (brake ? 190 : 0);
  const boostSpeed = state.boost > 0 ? 138 + state.character.stats.boost * 8 : 0;
  const targetSpeed = Math.max(120, maxSpeed + boostSpeed - offroad * 185 - state.spin * 240);
  state.speed += (targetSpeed - state.speed) * (brake ? 0.1 : 0.046);
  const grip = 1.28 + state.character.stats.handling * 0.13;
  const driftGrip = drift ? 0.72 : 1;
  state.laneVel += steer * grip * driftGrip * dt;
  state.laneVel *= drift ? 0.965 : 0.89;
  state.lane += state.laneVel * (1.35 + state.speed / 420);
  if (Math.abs(state.lane) > 1.25) {
    state.lane = clamp(state.lane, -1.25, 1.25);
    state.laneVel *= -0.35;
    state.speed *= 0.985;
  }
  if (drift) {
    state.driftCharge = Math.min(1.8, state.driftCharge + dt);
    state.drifting = true;
    if (Math.random() < 0.7) burstParticles(state.lane - steer * 0.18, state.character.accent, 1);
  } else if (state.drifting) {
    if (state.driftCharge > 0.55) {
      state.boost = Math.max(state.boost, 0.7 + state.driftCharge * 0.52);
      state.score += Math.round(65 * state.driftCharge);
      setToast("MINI BOOST", 0.7);
    }
    state.driftCharge = 0;
    state.drifting = false;
  }
  state.distance += state.speed * dt;
  state.boost = Math.max(0, state.boost - dt);
  state.shield = Math.max(0, state.shield - dt);
  state.spin = Math.max(0, state.spin - dt * 1.7);
  state.hitFlash = Math.max(0, state.hitFlash - dt);
  state.toastTime = Math.max(0, state.toastTime - dt);
  updateRivals(dt);
  updateItemBoxes();
  updateParticles(dt);
  state.score += dt * Math.max(3, state.speed / 34);
}

function updateRivals(dt) {
  state.rivals.forEach((rival, index) => {
    rival.hit = Math.max(0, rival.hit - dt);
    rival.boost = Math.max(0, rival.boost - dt);
    const curve = Math.sin(rival.distance * 0.005 + index * 2.2);
    rival.lane += (curve * 0.62 - rival.lane) * 0.018;
    const rubberBand = rival.distance < state.distance - 280 ? 52 : rival.distance > state.distance + 550 ? -28 : 0;
    const hitDrag = rival.hit > 0 ? 175 : 0;
    const target = rival.base + rubberBand - hitDrag;
    rival.speed += (target - rival.speed) * 0.045;
    rival.distance += rival.speed * dt;
  });
}

function updateItemBoxes() {
  state.itemBoxes.forEach((box) => {
    const ahead = box.distance - state.distance;
    if (!box.taken && ahead > -95 && ahead < 90 && Math.abs(box.lane - state.lane) < 0.5) {
      collectItem(box);
    }
  });
}

function burstParticles(lane, color, count) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      lane: lane + (Math.random() - 0.5) * 0.35,
      ahead: 60 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 80,
      vy: -40 - Math.random() * 80,
      life: 0.45 + Math.random() * 0.5,
      max: 0.8,
      color
    });
  }
}

function updateParticles(dt) {
  state.particles.forEach((p) => {
    p.ahead += p.vy * dt;
    p.lane += p.vx * dt / 460;
    p.life -= dt;
  });
  state.particles = state.particles.filter((p) => p.life > 0);
}

function drawRace(now) {
  const w = els.canvas.clientWidth;
  const h = els.canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  drawEnvironment(w, h, now);
  drawRoad(w, h);
  drawVisibleItems(w, h, now);
  drawVisibleRivals(w, h);
  drawPlayerKart(w, h);
  drawParticles(w, h);
  drawMinimap(w, h);
  drawToast(w, h);
  if (state.paused) {
    ctx.fillStyle = "rgba(5,8,22,.62)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f8fbff";
    ctx.font = "900 42px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSED", w / 2, h / 2);
  }
}

function themeColors() {
  const base = {
    regents: ["#081324", "#16306c", "#66e9ff"],
    liberty: ["#14152d", "#4b3317", "#ffd15c"],
    global: ["#061d22", "#16583d", "#64f0aa"],
    ap: ["#170b30", "#45205d", "#ff5f9f"]
  };
  return base[state.track.theme] || base.regents;
}

function drawEnvironment(w, h, now) {
  const [top, mid, accent] = themeColors();
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, top);
  sky.addColorStop(0.58, mid);
  sky.addColorStop(1, "#050816");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  if (ASSETS.tracks.complete && ASSETS.tracks.naturalWidth) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    drawSpriteCover(ASSETS.tracks, state.track.sprite, 0, 0, w, h * 0.62);
    const veil = ctx.createLinearGradient(0, 0, 0, h * 0.68);
    veil.addColorStop(0, "rgba(5,8,22,.05)");
    veil.addColorStop(0.55, "rgba(5,8,22,.18)");
    veil.addColorStop(1, "rgba(5,8,22,.92)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, w, h * 0.68);
    ctx.restore();
  }
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.19, 125 + Math.sin(now / 800) * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  drawSpeedLines(w, h, accent);
}

function drawSpeedLines(w, h, accent) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = clamp(state.speed / 2100, 0.08, 0.34);
  ctx.lineWidth = 2;
  for (let i = 0; i < 15; i += 1) {
    const y = h * 0.26 + i * h * 0.038;
    const drift = (state.distance * (0.35 + i * 0.04)) % (w + 260);
    ctx.beginPath();
    ctx.moveTo(-180 + drift, y);
    ctx.lineTo(-20 + drift, y - 10);
    ctx.stroke();
  }
  ctx.restore();
}

function roadPoint(n, w, h) {
  const horizon = h * 0.39;
  const depth = n * n;
  const y = horizon + depth * (h - horizon + 120);
  const roadWidth = 120 + depth * w * 1.08;
  const curve = Math.sin(state.distance * 0.002 + n * 5.4) * 72 * (1 - n) + Math.sin(state.distance * 0.0008) * 52;
  return { x: w / 2 + curve, y, roadWidth };
}

function drawRoad(w, h) {
  const segments = 42;
  for (let i = 0; i < segments; i += 1) {
    const n1 = i / segments;
    const n2 = (i + 1) / segments;
    const p1 = roadPoint(n1, w, h);
    const p2 = roadPoint(n2, w, h);
    const stripe = Math.floor((i + state.distance * 0.036) / 2) % 2;
    ctx.fillStyle = stripe ? "#18213a" : "#111a30";
    ctx.beginPath();
    ctx.moveTo(p1.x - p1.roadWidth / 2, p1.y);
    ctx.lineTo(p1.x + p1.roadWidth / 2, p1.y);
    ctx.lineTo(p2.x + p2.roadWidth / 2, p2.y);
    ctx.lineTo(p2.x - p2.roadWidth / 2, p2.y);
    ctx.closePath();
    ctx.fill();
    drawRoadEdge(p1, p2, stripe);
  }
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,.3)";
  for (let lane = 1; lane <= 3; lane += 1) {
    ctx.beginPath();
    for (let i = 4; i < segments; i += 1) {
      const n = i / segments;
      const p = roadPoint(n, w, h);
      const x = p.x - p.roadWidth / 2 + p.roadWidth * (lane / 4);
      if (i === 4) ctx.moveTo(x, p.y);
      else ctx.lineTo(x, p.y);
    }
    ctx.stroke();
  }
}

function drawRoadEdge(p1, p2, stripe) {
  ctx.fillStyle = stripe ? "rgba(255,209,92,.52)" : "rgba(102,233,255,.42)";
  ctx.beginPath();
  ctx.moveTo(p1.x - p1.roadWidth / 2 - 16, p1.y);
  ctx.lineTo(p1.x - p1.roadWidth / 2, p1.y);
  ctx.lineTo(p2.x - p2.roadWidth / 2, p2.y);
  ctx.lineTo(p2.x - p2.roadWidth / 2 - 34, p2.y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(p1.x + p1.roadWidth / 2 + 16, p1.y);
  ctx.lineTo(p1.x + p1.roadWidth / 2, p1.y);
  ctx.lineTo(p2.x + p2.roadWidth / 2, p2.y);
  ctx.lineTo(p2.x + p2.roadWidth / 2 + 34, p2.y);
  ctx.closePath();
  ctx.fill();
}

function objectPoint(ahead, lane, w, h) {
  if (ahead <= -45 || ahead > VISIBLE_RANGE) return null;
  const n = clamp(1 - ahead / VISIBLE_RANGE, 0.04, 1.02);
  const p = roadPoint(n, w, h);
  return {
    x: p.x + lane * p.roadWidth * 0.29,
    y: p.y,
    scale: 0.18 + n * 0.92,
    n
  };
}

function drawVisibleItems(w, h, now) {
  const visible = state.itemBoxes
    .filter((box) => !box.taken && box.distance > state.distance - 40 && box.distance < state.distance + VISIBLE_RANGE)
    .sort((a, b) => b.distance - a.distance);
  visible.forEach((box) => {
    const p = objectPoint(box.distance - state.distance, box.lane, w, h);
    if (!p) return;
    drawItemBox(p.x, p.y - 28 * p.scale, 54 * p.scale, box.item, now + box.id * 200);
  });
}

function drawVisibleRivals(w, h) {
  const total = TRACK_LENGTH * state.track.laps;
  state.rivals
    .filter((rival) => rival.distance < total + 300)
    .map((rival) => ({ rival, ahead: rival.distance - state.distance }))
    .filter((entry) => entry.ahead > -90 && entry.ahead < VISIBLE_RANGE)
    .sort((a, b) => b.ahead - a.ahead)
    .forEach(({ rival, ahead }) => {
      const p = objectPoint(ahead, rival.lane, w, h);
      if (p) drawKartSprite(rival.racer, p.x, p.y, p.scale * 0.74, { rival });
    });
}

function drawPlayerKart(w, h) {
  const y = h - 176;
  const x = w / 2 + state.lane * Math.min(250, w * 0.24) + Math.sin(state.spin * 22) * state.spin * 18;
  const scale = Math.max(0.82, Math.min(1.18, w / 1160));
  if (state.boost > 0) {
    ctx.save();
    ctx.strokeStyle = state.character.accent;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 10;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 105 + i * 42, y + 62);
      ctx.lineTo(x - 170 + i * 28, y + 185);
      ctx.stroke();
    }
    ctx.restore();
  }
  drawKartSprite(state.character, x, y, scale, { player: true });
  if (state.shield > 0) {
    ctx.save();
    ctx.strokeStyle = "#64f0aa";
    ctx.globalAlpha = 0.42 + Math.sin(performance.now() / 90) * 0.14;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(x, y - 12, 142 * scale, 98 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawKartSprite(racer, x, y, scale, options = {}) {
  const width = (options.player ? 250 : 152) * scale;
  const height = (options.player ? 176 : 108) * scale;
  ctx.save();
  ctx.translate(x, y);
  const lean = clamp(state.laneVel * 0.22, -0.18, 0.18);
  if (options.player) ctx.rotate(lean + Math.sin(state.spin * 28) * state.spin * 0.22);
  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.beginPath();
  ctx.ellipse(0, height * 0.35, width * 0.48, height * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  if (options.rival?.hit > 0) {
    ctx.globalAlpha = 0.68;
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.beginPath();
    ctx.arc(0, -height * 0.15, width * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  drawRacerSprite(racer, -width / 2, -height * 0.68, width, height, 26 * scale);
  ctx.strokeStyle = racer.accent;
  ctx.lineWidth = Math.max(2, 4 * scale);
  roundRect(-width / 2, -height * 0.68, width, height, 26 * scale);
  ctx.stroke();
  ctx.restore();
}

function drawItemBox(x, y, size, item, now) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(now / 280) * 0.16);
  const pulse = 1 + Math.sin(now / 180) * 0.05;
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.62, size * 0.62, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.strokeStyle = item.color;
  ctx.lineWidth = Math.max(2, size * 0.08);
  roundRect(-size / 2, -size / 2, size, size, size * 0.18);
  ctx.fill();
  ctx.stroke();
  drawItemSprite(item, -size * 0.42, -size * 0.42, size * 0.84, size * 0.84, size * 0.12);
  ctx.restore();
}

function drawParticles(w, h) {
  state.particles.forEach((p) => {
    const point = objectPoint(p.ahead, p.lane, w, h);
    if (!point) return;
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(2, point.scale * 7), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawMinimap(w, h) {
  const x = w - 130;
  const y = h - 206;
  const height = 156;
  const total = TRACK_LENGTH * state.track.laps;
  ctx.save();
  ctx.fillStyle = "rgba(5,8,22,.58)";
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 1;
  roundRect(x - 22, y - 12, 42, height + 24, 18);
  ctx.fill();
  ctx.stroke();
  const drawDot = (distance, color, radius) => {
    const pct = clamp(distance / total, 0, 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y + height - pct * height, radius, 0, Math.PI * 2);
    ctx.fill();
  };
  state.rivals.forEach((rival) => drawDot(rival.distance, rival.racer.accent, 4));
  drawDot(state.distance, "#ffffff", 6);
  ctx.restore();
}

function drawToast(w, h) {
  if (!state.toastTime) return;
  ctx.save();
  ctx.globalAlpha = clamp(state.toastTime, 0, 1);
  ctx.fillStyle = "rgba(5,8,22,.72)";
  ctx.strokeStyle = state.character.accent;
  ctx.lineWidth = 2;
  const text = state.toast;
  ctx.font = "950 34px Inter, sans-serif";
  ctx.textAlign = "center";
  const width = Math.min(w - 40, ctx.measureText(text).width + 54);
  roundRect(w / 2 - width / 2, h * 0.18, width, 58, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f8fbff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h * 0.18 + 30);
  ctx.restore();
}

function spriteRect(image, sprite) {
  if (!image.complete || !image.naturalWidth) return null;
  const halfW = image.naturalWidth / 2;
  const halfH = image.naturalHeight / 2;
  const col = String(sprite).startsWith("100") ? 1 : 0;
  const row = String(sprite).endsWith("100%") ? 1 : 0;
  return { sx: col * halfW, sy: row * halfH, sw: halfW, sh: halfH };
}

function drawSpriteCover(image, sprite, x, y, width, height) {
  const rect = spriteRect(image, sprite);
  if (!rect) return false;
  const sourceRatio = rect.sw / rect.sh;
  const targetRatio = width / height;
  let sx = rect.sx;
  let sy = rect.sy;
  let sw = rect.sw;
  let sh = rect.sh;
  if (sourceRatio > targetRatio) {
    sw = sh * targetRatio;
    sx += (rect.sw - sw) / 2;
  } else {
    sh = sw / targetRatio;
    sy += (rect.sh - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  return true;
}

function drawRacerSprite(racer, x, y, width, height, radius) {
  if (!ASSETS.racers.complete || !ASSETS.racers.naturalWidth) return;
  ctx.save();
  roundRect(x, y, width, height, radius);
  ctx.clip();
  drawSpriteCover(ASSETS.racers, racer.sprite, x, y, width, height);
  const shine = ctx.createLinearGradient(x, y, x + width, y + height);
  shine.addColorStop(0, "rgba(255,255,255,.18)");
  shine.addColorStop(0.5, "rgba(255,255,255,0)");
  shine.addColorStop(1, "rgba(0,0,0,.28)");
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

function drawItemSprite(item, x, y, width, height, radius) {
  if (!ASSETS.items.complete || !ASSETS.items.naturalWidth) return;
  ctx.save();
  roundRect(x, y, width, height, radius);
  ctx.clip();
  drawSpriteCover(ASSETS.items, item.sprite, x, y, width, height);
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
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.add(key);
  if (state.quizOpen) {
    if (/^[abcd]$/i.test(event.key)) {
      gradeAnswer(event.key.toUpperCase().charCodeAt(0) - 65);
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
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
    }
    return;
  }
  if (!els.raceScreen.classList.contains("active")) return;
  if (event.key === "e" || event.key === "E" || event.key === "Shift") {
    openItemQuestion();
    event.preventDefault();
  } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
    event.preventDefault();
  } else if (event.key === "Escape") {
    state.paused = !state.paused;
  }
});

document.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

els.canvas.addEventListener("pointerdown", (event) => {
  if (!state.running || state.quizOpen) return;
  const rect = els.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  if (x < rect.width * 0.38) keys.add("ArrowLeft");
  else if (x > rect.width * 0.62) keys.add("ArrowRight");
  else openItemQuestion();
});

els.canvas.addEventListener("pointerup", () => {
  keys.delete("ArrowLeft");
  keys.delete("ArrowRight");
});

els.itemBtn.addEventListener("click", openItemQuestion);
els.pauseBtn.addEventListener("click", () => {
  state.paused = !state.paused;
  els.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
});
els.quitBtn.addEventListener("click", () => {
  state.running = false;
  closeItemQuestion();
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
