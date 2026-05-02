const CHARACTERS = [
  {
    id: "cleopatra",
    name: "Cleopatra VII",
    shortName: "Cleopatra",
    role: "Diplomacy Driver",
    vehicle: "Nile Comet",
    accent: "#66e9ff",
    body: "#1592b6",
    sprite: "0% 0%",
    stats: { speed: 7, handling: 9, boost: 6, weight: 5 },
    perk: "Extra source time"
  },
  {
    id: "mansa-musa",
    name: "Mansa Musa",
    shortName: "Mansa",
    role: "Gold Road Heavyweight",
    vehicle: "Mali Monarch",
    accent: "#ffd15c",
    body: "#c38a1d",
    sprite: "100% 0%",
    stats: { speed: 9, handling: 5, boost: 7, weight: 9 },
    perk: "High top speed"
  },
  {
    id: "harriet-tubman",
    name: "Harriet Tubman",
    shortName: "Tubman",
    role: "Freedom Line Sprinter",
    vehicle: "Liberty Lantern",
    accent: "#64f0aa",
    body: "#2aa365",
    sprite: "0% 100%",
    stats: { speed: 6, handling: 8, boost: 10, weight: 4 },
    perk: "Longer boost chains"
  },
  {
    id: "toussaint",
    name: "Toussaint Louverture",
    shortName: "Toussaint",
    role: "Revolution Racer",
    vehicle: "Haiti Hurricane",
    accent: "#ff5f9f",
    body: "#bd3b85",
    sprite: "100% 100%",
    stats: { speed: 8, handling: 7, boost: 7, weight: 6 },
    perk: "Faster recovery"
  },
  {
    id: "genghis-khan",
    name: "Genghis Khan",
    shortName: "Genghis",
    role: "Steppe Speedster",
    vehicle: "Yam Courier",
    accent: "#ff8a3d",
    body: "#b95c26",
    sprite: "100% 0%",
    stats: { speed: 10, handling: 4, boost: 7, weight: 8 },
    perk: "Strong straightaways"
  },
  {
    id: "joan-of-arc",
    name: "Joan of Arc",
    shortName: "Joan",
    role: "Rally Captain",
    vehicle: "Orleans Arrow",
    accent: "#b892ff",
    body: "#6747bd",
    sprite: "0% 100%",
    stats: { speed: 7, handling: 7, boost: 9, weight: 5 },
    perk: "Quick drift sparks"
  },
  {
    id: "abraham-lincoln",
    name: "Abraham Lincoln",
    shortName: "Lincoln",
    role: "Union Power Driver",
    vehicle: "Rail Splitter",
    accent: "#8fb4ff",
    body: "#435d9f",
    sprite: "0% 0%",
    stats: { speed: 8, handling: 6, boost: 6, weight: 8 },
    perk: "Better bump recovery"
  },
  {
    id: "sacagawea",
    name: "Sacagawea",
    shortName: "Sacagawea",
    role: "Trail Navigator",
    vehicle: "Compass Trail",
    accent: "#7dffb2",
    body: "#327a54",
    sprite: "100% 100%",
    stats: { speed: 6, handling: 10, boost: 6, weight: 4 },
    perk: "Sharpest handling"
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
const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;
const params = new URLSearchParams(location.search);
const perfLite = params.get("perf") === "lite" || params.get("fx") === "lite" || matchMedia("(pointer: coarse)").matches || innerWidth < 760;
const EMPTY_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const TRACK_LENGTH = 5400;
const VISIBLE_RANGE = 1150;
const COUNTDOWN_SECONDS = 3.15;

function loadAsset(src) {
  const image = new Image();
  image.src = src;
  return image;
}

const ASSETS = {
  keyArt: loadAsset("rally-64-key-art.webp"),
  racers: loadAsset("rally-64-racers.webp"),
  gameplayKarts: loadAsset("rally-64-gameplay-karts.webp"),
  tracks: loadAsset("rally-64-tracks.webp"),
  items: loadAsset("rally-items.webp")
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
  bump: 0,
  hop: 0,
  countdown: 0,
  raceReleased: false,
  finishPulse: 0,
  hitFlash: 0,
  cameraShake: 0,
  skid: 0,
  item: null,
  itemBoxes: [],
  rivals: [],
  particles: [],
  score: 0,
  correct: 0,
  attempts: 0,
  streak: 0,
  maxStreak: 0,
  place: CHARACTERS.length,
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

function frameEase(rate, dt) {
  return 1 - Math.exp(-rate * dt);
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
        <div class="stat"><b>8</b><span>Racers</span></div>
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
  if (SourceBank) return SourceBank.sourceBased(question);
  return Boolean(
    (question.stimulusImages && question.stimulusImages.length) ||
    question.stimulusRequired ||
    /based on|according to|document|map|cartoon|graph|chart|excerpt|passage|photograph|source|illustration/i.test(question.stem || question.prompt || "")
  );
}

function sourceLock(question) {
  if (SourceBank) return SourceBank.sourceLock(question);
  const images = (question.stimulusImages || []).filter((image) => image && image.src);
  return {
    ok: Boolean(images.length),
    needed: sourceBased(question),
    reason: images.length ? "" : "Source image missing",
    images,
    identity: [question.course, question.source, images.map((image) => image.src).join("|")].join("::"),
    label: images.length ? "Source matched" : "Source blocked"
  };
}

function normalizeRegents(question) {
  if (SourceBank && !SourceBank.usableRegentsQuestion(question)) return null;
  const choices = (question.choices || []).slice(0, 4).map((choice) => String(choice.text || ""));
  const correctIndex = (question.choices || []).slice(0, 4).findIndex((choice) => String(choice.label) === String(question.correct));
  if (choices.length !== 4 || correctIndex < 0) return null;
  const lock = sourceLock(question);
  return {
    prompt: cleanPrompt(question.stem || question.prompt),
    choices,
    correctIndex,
    explanation: question.explanation || "Review the source, then eliminate the answer choices that overstate or distort it.",
    course: question.course || "Regents Review",
    set: question.set || question.day || "",
    source: question.source || "",
    images: lock.images || [],
    sourceLock: lock
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
  state.speed = 0;
  state.lane = 0;
  state.laneVel = 0;
  state.driftCharge = 0;
  state.drifting = false;
  state.boost = 0;
  state.shield = 0;
  state.spin = 0;
  state.bump = 0;
  state.hop = 0;
  state.countdown = COUNTDOWN_SECONDS;
  state.raceReleased = false;
  state.finishPulse = 0;
  state.hitFlash = 0;
  state.cameraShake = 0;
  state.skid = 0;
  state.item = null;
  state.score = 0;
  state.correct = 0;
  state.attempts = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.place = CHARACTERS.length;
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
  setToast("3", 0.9);
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
  const lanes = [-0.78, -0.42, -0.12, 0.18, 0.46, 0.72, 0.02];
  return CHARACTERS
    .filter((racer) => racer.id !== state.character.id)
    .map((racer, index) => ({
      racer,
      distance: 70 + index * 82,
      lane: lanes[index] ?? 0,
      desiredLane: lanes[index] ?? 0,
      base: 392 + racer.stats.speed * 17 + index * 7,
      speed: 380 + index * 17,
      hit: 0,
      boost: 0,
      itemCooldown: 4 + index * 1.2 + Math.random() * 2,
      wobble: Math.random() * Math.PI * 2
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
  state.answerSeconds = question.images.length || state.character.id === "cleopatra" ? 22 : 16;
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
    els.sourceImage.hidden = false;
    els.sourceImage.src = q.images[0].src;
    els.sourceImage.alt = q.images[0].label || "Source stimulus";
    const lock = q.sourceLock || { ok: true, label: "Source matched", reason: "" };
    els.sourceCaption.innerHTML = `<span class="source-lock-pill ${lock.ok ? "ok" : "warn"}">${escapeHtml(lock.label)}${lock.reason ? " · " + escapeHtml(lock.reason) : ""}</span> ${escapeHtml(q.images[0].label || "Source stimulus")}`;
  } else {
    els.sourcePreview.classList.add("hidden");
    els.sourceImage.hidden = true;
    els.sourceImage.src = EMPTY_PIXEL;
    els.sourceImage.alt = "";
    els.sourceCaption.textContent = "";
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
      state.spin = state.character.id === "toussaint" ? 0.55 : 0.95;
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
    state.cameraShake = Math.max(state.cameraShake, 0.22);
    burstParticles(state.lane, state.character.accent, 24);
  } else if (item.id === "rocket") {
    const ahead = state.rivals
      .filter((rival) => rival.distance > state.distance - 40)
      .sort((a, b) => a.distance - b.distance)[0] || state.rivals[0];
    if (ahead) {
      ahead.hit = 2.9;
      ahead.speed *= 0.48;
      ahead.distance = Math.max(0, ahead.distance - 130);
      state.cameraShake = Math.max(state.cameraShake, 0.26);
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
    state.cameraShake = Math.max(state.cameraShake, 0.34);
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
    els.itemThumb.style.backgroundImage = "url('rally-items.webp')";
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
  els.hudRacer.textContent = state.character.shortName || state.character.name;
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
  state.dpr = Math.min(window.devicePixelRatio || 1, perfLite ? 1.25 : 2);
  els.canvas.width = Math.max(1, Math.floor(rect.width * state.dpr));
  els.canvas.height = Math.max(1, Math.floor(rect.height * state.dpr));
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
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
  if (state.countdown > 0) {
    const before = Math.ceil(state.countdown);
    state.countdown = Math.max(0, state.countdown - dt);
    const after = Math.ceil(state.countdown);
    if (before !== after && after > 0) setToast(String(after), 0.85);
    if (!state.countdown && !state.raceReleased) {
      state.raceReleased = true;
      state.boost = keys.has("ArrowUp") || keys.has("w") ? 1.65 : 0;
      if (state.boost > 0) {
        state.cameraShake = Math.max(state.cameraShake, 0.2);
        burstParticles(state.lane, state.character.accent, 22);
      }
      setToast(state.boost > 0 ? "START BOOST" : "GO", 0.95);
    }
    state.toastTime = Math.max(0, state.toastTime - dt);
    updateRivals(dt * 0.08);
    updateParticles(dt);
    return;
  }
  const left = keys.has("ArrowLeft") || keys.has("a");
  const right = keys.has("ArrowRight") || keys.has("d");
  const accelerate = keys.has("ArrowUp") || keys.has("w");
  const brake = keys.has("ArrowDown") || keys.has("s");
  const drift = keys.has(" ") && (left || right) && state.speed > 245;
  const steer = (right ? 1 : 0) - (left ? 1 : 0);
  const offroad = Math.max(0, Math.abs(state.lane) - 0.98);
  const weight = state.character.stats.weight || 6;
  const statSpeed = 375 + state.character.stats.speed * 24 + weight * 3;
  const naturalRoll = 118 + state.character.stats.speed * 8;
  const boostSpeed = state.boost > 0 ? 218 + state.character.stats.boost * 15 : 0;
  const targetSpeed = clamp((accelerate ? statSpeed : naturalRoll) + boostSpeed - (brake ? 235 : 0) - offroad * 245 - state.spin * 270 - state.bump * 100, 0, 760);
  const accelRate = accelerate || state.boost > 0 ? 7.65 + state.character.stats.boost * 0.08 - weight * 0.06 : 3.05;
  state.speed += (targetSpeed - state.speed) * frameEase(brake ? 11.4 : accelRate, dt);
  const speedFactor = clamp(state.speed / 470, 0.25, 1.22);
  const grip = 1.14 + state.character.stats.handling * 0.16 - weight * 0.018;
  const driftGrip = drift ? 0.52 : 1;
  const curveAssist = roadCurveAt(state.distance + state.speed * 0.75, 0.6) * 0.000018 * state.speed;
  state.laneVel += (steer * grip * driftGrip - curveAssist) * speedFactor * dt;
  state.laneVel *= Math.pow(drift ? 0.978 : 0.865, dt * 60);
  state.lane += state.laneVel * (1.28 + state.speed / 385);
  if (Math.abs(state.lane) > 1.25) {
    state.lane = clamp(state.lane, -1.25, 1.25);
    state.laneVel *= -0.35;
    state.speed *= 0.965;
    state.cameraShake = Math.max(state.cameraShake, 0.12);
  }
  state.skid = Math.max(0, Math.abs(state.laneVel) * clamp(state.speed / 520, 0, 1));
  if (offroad > 0.05 && Math.random() < 0.42) burstParticles(state.lane, "#8b98b6", 1);
  if (drift) {
    if (!state.drifting) state.hop = 0.18;
    const sparkBonus = state.character.id === "joan-of-arc" ? 0.24 : 0;
    state.driftCharge = Math.min(2.7, state.driftCharge + dt * (1 + sparkBonus + Math.abs(steer) * 0.42));
    state.drifting = true;
    const spark = state.driftCharge > 1.35 ? "#ffd15c" : state.character.accent;
    if (Math.random() < 0.8) burstParticles(state.lane - steer * 0.2, spark, state.driftCharge > 1.35 ? 2 : 1);
  } else if (state.drifting) {
    if (state.driftCharge > 0.45) {
      const strong = state.driftCharge > 1.35;
      state.boost = Math.max(state.boost, (strong ? 1.82 : 0.84) + state.driftCharge * 0.45);
      state.score += Math.round((strong ? 120 : 72) * state.driftCharge);
      setToast(strong ? "SUPER MINI-TURBO" : "MINI-TURBO", 0.8);
      burstParticles(state.lane, strong ? "#ffd15c" : state.character.accent, strong ? 28 : 16);
    }
    state.driftCharge = 0;
    state.drifting = false;
  }
  state.distance += state.speed * dt;
  state.boost = Math.max(0, state.boost - dt);
  state.shield = Math.max(0, state.shield - dt);
  state.spin = Math.max(0, state.spin - dt * (state.character.id === "toussaint" ? 2.35 : 1.7));
  state.bump = Math.max(0, state.bump - dt * (state.character.id === "abraham-lincoln" ? 4.0 : 2.8));
  state.hop = Math.max(0, state.hop - dt);
  state.finishPulse = Math.max(0, state.finishPulse - dt);
  state.hitFlash = Math.max(0, state.hitFlash - dt);
  state.cameraShake = Math.max(0, state.cameraShake - dt * 1.9);
  state.toastTime = Math.max(0, state.toastTime - dt);
  updateRivals(dt);
  updateKartCollisions();
  updateItemBoxes();
  updateParticles(dt);
  state.score += dt * Math.max(3, state.speed / 34);
}

function updateKartCollisions() {
  state.rivals.forEach((rival) => {
    const gap = rival.distance - state.distance;
    const laneGap = rival.lane - state.lane;
    if (Math.abs(gap) > 54 || Math.abs(laneGap) > 0.26 || state.spin > 0.1) return;
    const playerWeight = state.character.stats.weight || 6;
    const rivalWeight = rival.racer.stats.weight || 6;
    const weightEdge = clamp((playerWeight - rivalWeight) / 10, -0.28, 0.28);
    state.bump = Math.max(0.28, 0.55 - weightEdge);
    state.cameraShake = Math.max(state.cameraShake, state.shield > 0 ? 0.18 : 0.32);
    state.speed *= state.shield > 0 ? 0.97 : 0.84 + weightEdge * 0.28;
    state.laneVel -= Math.sign(laneGap || 1) * (0.07 + rivalWeight * 0.004);
    rival.speed *= 0.86 - weightEdge * 0.18;
    rival.hit = Math.max(rival.hit, 0.32 + weightEdge * 0.4);
    burstParticles(state.lane, state.shield > 0 ? "#64f0aa" : "#ffffff", state.shield > 0 ? 10 : 16);
    if (state.toastTime < 0.2) setToast(state.shield > 0 ? "SHIELD BUMP" : "BUMP", 0.45);
  });
}

function updateRivals(dt) {
  state.rivals.forEach((rival, index) => {
    rival.hit = Math.max(0, rival.hit - dt);
    rival.boost = Math.max(0, rival.boost - dt);
    rival.itemCooldown = Math.max(0, rival.itemCooldown - dt);
    const curve = Math.sin(rival.distance * 0.0044 + index * 2.2 + rival.wobble);
    const avoidPlayer = Math.abs(rival.distance - state.distance) < 175 ? Math.sign(rival.lane - state.lane || (index % 2 ? 1 : -1)) * 0.18 : 0;
    rival.desiredLane = clamp(curve * 0.58 + avoidPlayer, -0.88, 0.88);
    rival.lane += (rival.desiredLane - rival.lane) * frameEase(1.55 + racerHandling(rival.racer) * 0.04, dt);
    const rubberBand = rival.distance < state.distance - 360 ? 92 : rival.distance > state.distance + 620 ? -42 : 0;
    const hitDrag = rival.hit > 0 ? 175 : 0;
    const boost = rival.boost > 0 ? 130 : 0;
    const target = rival.base + rubberBand + boost - hitDrag;
    rival.speed += (target - rival.speed) * frameEase(2.9, dt);
    rival.distance += rival.speed * dt;
    if (rival.itemCooldown <= 0 && Math.abs(rival.distance - state.distance) < 560) {
      rival.itemCooldown = 6.5 + Math.random() * 6;
      if (rival.distance < state.distance && Math.random() < 0.58) {
        rival.boost = 2.1;
        burstParticles(rival.lane, rival.racer.accent, 12);
      } else if (rival.distance > state.distance && Math.abs(rival.lane - state.lane) < 0.42 && state.shield <= 0) {
        state.spin = Math.max(state.spin, state.character.id === "toussaint" ? 0.42 : 0.72);
        state.speed *= 0.82;
        state.cameraShake = Math.max(state.cameraShake, 0.24);
        state.hitFlash = 0.38;
        setToast(`${rival.racer.shortName || rival.racer.name} hit you`, 0.8);
      }
    }
  });
}

function racerHandling(racer) {
  return racer?.stats?.handling || 7;
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
  ctx.save();
  if (state.cameraShake > 0) {
    const amount = state.cameraShake * 18;
    ctx.translate(Math.sin(now * 0.067) * amount, Math.cos(now * 0.051) * amount * 0.62);
  }
  drawEnvironment(w, h, now);
  drawRoad(w, h);
  drawTracksideProps(w, h, now);
  drawVisibleItems(w, h, now);
  drawVisibleRivals(w, h);
  drawPlayerKart(w, h);
  drawParticles(w, h);
  ctx.restore();
  drawMinimap(w, h);
  drawRaceOverlay(w, h);
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
  const horizon = h * 0.39;
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, top);
  sky.addColorStop(0.58, mid);
  sky.addColorStop(1, "#050816");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  drawSunDisc(w, h, now, accent);
  drawPixelClouds(w, h, now, accent);
  drawHorizonLayer(w, horizon, 0.08, 120, "rgba(2,5,16,.46)", accent, now);
  drawHorizonLayer(w, horizon + 20, 0.18, 88, "rgba(5,10,26,.72)", accent, now + 1400);
  drawGrandstands(w, h, now, accent);
  drawGroundPlane(w, h, accent);
  drawCourseLights(w, h, now, accent);
  drawSpeedLines(w, h, accent);
}

function drawSunDisc(w, h, now, accent) {
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.19, 125 + Math.sin(now / 800) * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.19, 150 + i * 26 + Math.sin(now / 700 + i) * 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawPixelClouds(w, h, now, accent) {
  ctx.save();
  const drift = state.distance * 0.035 + now * 0.012;
  for (let i = 0; i < 8; i += 1) {
    const width = 78 + (i % 3) * 28;
    const x = ((i * 211 - drift) % (w + 220) + w + 220) % (w + 220) - 120;
    const y = h * (0.08 + (i % 4) * 0.055) + Math.sin(now / 950 + i) * 4;
    ctx.globalAlpha = 0.18 + (i % 2) * 0.08;
    ctx.fillStyle = i % 3 ? "#f8fbff" : accent;
    ctx.fillRect(Math.round(x), Math.round(y), width * 0.52, 14);
    ctx.fillRect(Math.round(x + width * 0.2), Math.round(y - 14), width * 0.5, 18);
    ctx.fillRect(Math.round(x + width * 0.48), Math.round(y + 2), width * 0.44, 12);
  }
  ctx.restore();
}

function drawHorizonLayer(w, baseY, speed, height, color, accent, now) {
  const tile = 230;
  const offset = ((state.distance * speed) % tile + tile) % tile;
  ctx.save();
  for (let x = -tile - offset; x < w + tile; x += tile) {
    drawThemeSilhouette(x, baseY, tile, height, color, accent, now);
  }
  ctx.restore();
}

function drawThemeSilhouette(x, baseY, width, height, color, accent, now) {
  const theme = state.track.theme;
  ctx.fillStyle = color;
  if (theme === "liberty") {
    ctx.fillRect(x + width * 0.08, baseY - height * 0.62, width * 0.18, height * 0.62);
    ctx.fillRect(x + width * 0.34, baseY - height * 0.88, width * 0.2, height * 0.88);
    ctx.fillRect(x + width * 0.66, baseY - height * 0.54, width * 0.2, height * 0.54);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.34;
    ctx.fillRect(x + width * 0.38, baseY - height * 1.02, width * 0.02, height * 0.2);
    ctx.fillRect(x + width * 0.4, baseY - height * 1.02, width * 0.13, height * 0.07);
  } else if (theme === "global") {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + width * 0.22, baseY - height * 0.48);
    ctx.lineTo(x + width * 0.38, baseY);
    ctx.lineTo(x + width * 0.58, baseY - height * 0.75);
    ctx.lineTo(x + width * 0.86, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = accent;
    ctx.fillRect(x + width * 0.1, baseY - height * 0.2, width * 0.74, 6);
  } else if (theme === "ap") {
    for (let i = 0; i < 4; i += 1) {
      const towerX = x + width * (0.1 + i * 0.22);
      const towerH = height * (0.42 + ((i + 1) % 3) * 0.22);
      ctx.fillRect(towerX, baseY - towerH, width * 0.1, towerH);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.18 + Math.sin(now / 260 + i) * 0.06;
      ctx.fillRect(towerX + width * 0.025, baseY - towerH + 14, width * 0.05, towerH * 0.55);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
    }
  } else {
    ctx.fillRect(x + width * 0.08, baseY - height * 0.48, width * 0.18, height * 0.48);
    ctx.fillRect(x + width * 0.37, baseY - height * 0.7, width * 0.26, height * 0.7);
    ctx.fillRect(x + width * 0.72, baseY - height * 0.43, width * 0.18, height * 0.43);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(x + width * (0.4 + i * 0.045), baseY - height * 0.61, width * 0.014, height * 0.44);
    }
  }
  ctx.globalAlpha = 1;
}

function drawGrandstands(w, h, now, accent) {
  const y = h * 0.36;
  const shift = -((state.distance * 0.32) % 168);
  ctx.save();
  for (let x = shift - 168; x < w + 168; x += 168) {
    ctx.fillStyle = "rgba(3,7,20,.82)";
    ctx.beginPath();
    ctx.moveTo(x, y + 52);
    ctx.lineTo(x + 132, y + 36);
    ctx.lineTo(x + 160, y + 76);
    ctx.lineTo(x + 18, y + 94);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.2 + Math.sin(now / 180 + x) * 0.04;
    ctx.fillRect(x + 18, y + 48, 118, 8);
    ctx.globalAlpha = 0.78;
    for (let i = 0; i < 16; i += 1) {
      ctx.fillStyle = ["#66e9ff", "#ffd15c", "#64f0aa", "#ff5f9f"][i % 4];
      ctx.fillRect(x + 22 + i * 7, y + 64 + (i % 2) * 9 + Math.sin(now / 140 + i) * 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawGroundPlane(w, h, accent) {
  const horizon = h * 0.39;
  const palette = {
    regents: ["#071628", "#092137", "#0d2c43"],
    liberty: ["#22170f", "#2a211a", "#3a2e1f"],
    global: ["#092318", "#123326", "#17442f"],
    ap: ["#160b2c", "#21133d", "#2b174d"]
  }[state.track.theme] || ["#071628", "#092137", "#0d2c43"];
  for (let i = 0; i < 16; i += 1) {
    const n1 = i / 16;
    const n2 = (i + 1) / 16;
    const y1 = horizon + Math.pow(n1, 1.45) * (h - horizon + 80);
    const y2 = horizon + Math.pow(n2, 1.45) * (h - horizon + 80);
    const shift = roadCurveAt(state.distance + i * 48, n2) * 0.18;
    ctx.fillStyle = palette[(i + Math.floor(state.distance / 150)) % palette.length];
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(w, y1);
    ctx.lineTo(w + shift * 1.6, y2);
    ctx.lineTo(shift * -1.6, y2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 2;
  const gridShift = (state.distance * 0.42) % 80;
  for (let y = horizon + gridShift; y < h + 80; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + roadCurveAt(state.distance + y, 1) * 0.06);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCourseLights(w, h, now, accent) {
  ctx.save();
  const beat = 0.24 + Math.sin(now / 190) * 0.08;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = beat;
  ctx.lineWidth = 2;
  for (let side of [-1, 1]) {
    ctx.beginPath();
    for (let i = 0; i < 7; i += 1) {
      const n = 0.26 + i * 0.1;
      const p = roadPoint(n, w, h);
      const x = p.x + side * p.roadWidth * (0.58 + i * 0.025);
      const y = p.y - 26 * n;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
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

function trackPhase() {
  return { regents: 0.1, liberty: 1.25, global: 2.4, ap: 3.55 }[state.track.theme] || 0;
}

function roadCurveAt(distance, n = 0) {
  const phase = trackPhase();
  const longCurve = Math.sin(distance * 0.0009 + phase) * 64;
  const midCurve = Math.sin(distance * 0.0022 + n * 5.3 + phase * 1.7) * 74 * (1 - n);
  const snapCurve = Math.sin(distance * 0.0046 + n * 2.1 + phase) * 14 * (1 - n);
  return longCurve + midCurve + snapCurve;
}

function roadPoint(n, w, h) {
  const horizon = h * 0.39;
  const depth = n * n;
  const y = horizon + depth * (h - horizon + 120);
  const roadWidth = 120 + depth * w * 1.08;
  const curve = roadCurveAt(state.distance + n * VISIBLE_RANGE * 1.04, n) * (0.38 + n * 0.72);
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
  ctx.strokeStyle = "rgba(255,255,255,.36)";
  for (let lane = 1; lane <= 3; lane += 1) {
    for (let i = 6; i < segments - 1; i += 2) {
      const dash = Math.floor(i + state.distance * 0.045) % 5;
      if (dash === 0 || dash === 4) continue;
      const n1 = i / segments;
      const n2 = (i + 1) / segments;
      const p1 = roadPoint(n1, w, h);
      const p2 = roadPoint(n2, w, h);
      const x1 = p1.x - p1.roadWidth / 2 + p1.roadWidth * (lane / 4);
      const x2 = p2.x - p2.roadWidth / 2 + p2.roadWidth * (lane / 4);
      ctx.beginPath();
      ctx.moveTo(x1, p1.y);
      ctx.lineTo(x2, p2.y);
      ctx.stroke();
    }
  }
}

function drawTracksideProps(w, h, now) {
  const total = TRACK_LENGTH * state.track.laps;
  const base = Math.floor(state.distance / 260) * 260;
  for (let d = base + 260; d < state.distance + VISIBLE_RANGE; d += 260) {
    const side = Math.floor(d / 260) % 2 ? -1 : 1;
    const lane = side * (1.34 + (Math.floor(d / 520) % 2) * 0.18);
    const p = objectPoint(d - state.distance, lane, w, h);
    if (!p) continue;
    const theme = state.track.theme;
    const scale = p.scale;
    if (Math.floor(d / 260) % 3 === 0) {
      drawBillboard(p.x, p.y - 82 * scale, 96 * scale, 56 * scale, theme, side, now + d);
    } else {
      drawLowPolyTree(p.x, p.y - 48 * scale, 44 * scale, theme);
    }
  }
  const nextFinish = Math.ceil((state.distance + 120) / TRACK_LENGTH) * TRACK_LENGTH;
  if (nextFinish < total + 20 && nextFinish - state.distance < VISIBLE_RANGE) {
    const p = objectPoint(nextFinish - state.distance, 0, w, h);
    if (p) drawFinishGate(p.x, p.y - 150 * p.scale, p.scale);
  }
}

function drawBillboard(x, y, width, height, theme, side, seed) {
  const accent = themeColors()[2];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side < 0 ? -1 : 1, 1);
  ctx.fillStyle = "rgba(0,0,0,.38)";
  ctx.fillRect(-width * 0.08, height * 0.45, width * 0.16, height * 0.95);
  ctx.fillStyle = "#17315d";
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.5, width * 0.04);
  roundRect(-width / 2, -height / 2, width, height, height * 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.84)";
  ctx.globalAlpha = 0.88;
  const icon = Math.floor(seed / 260) % 4;
  if (icon === 0) {
    ctx.fillRect(-width * 0.18, -height * 0.18, width * 0.36, height * 0.08);
    ctx.fillRect(-width * 0.18, 0, width * 0.36, height * 0.08);
    ctx.fillRect(-width * 0.18, height * 0.18, width * 0.28, height * 0.08);
  } else if (icon === 1) {
    ctx.beginPath();
    ctx.arc(0, 0, height * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.26);
    ctx.lineTo(0, height * 0.26);
    ctx.moveTo(-height * 0.26, 0);
    ctx.lineTo(height * 0.26, 0);
    ctx.stroke();
  } else if (icon === 2) {
    ctx.beginPath();
    ctx.moveTo(-width * 0.22, height * 0.2);
    ctx.lineTo(0, -height * 0.26);
    ctx.lineTo(width * 0.22, height * 0.2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-width * 0.24, -height * 0.2, width * 0.48, height * 0.36);
    ctx.fillStyle = "#17315d";
    ctx.fillRect(-width * 0.16, -height * 0.12, width * 0.32, height * 0.06);
  }
  ctx.restore();
}

function drawLowPolyTree(x, y, size, theme) {
  const accent = themeColors()[2];
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6d4a24";
  ctx.fillRect(-size * 0.08, size * 0.02, size * 0.16, size * 0.62);
  ctx.fillStyle = theme === "ap" ? "#2c5aa0" : theme === "liberty" ? "#4d7c36" : "#2f8b49";
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.58);
  ctx.lineTo(size * 0.56, size * 0.15);
  ctx.lineTo(0, size * 0.36);
  ctx.lineTo(-size * 0.56, size * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.58);
  ctx.lineTo(size * 0.56, size * 0.15);
  ctx.lineTo(0, size * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFinishGate(x, y, scale) {
  const width = 420 * scale;
  const height = 190 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,.38)";
  ctx.fillRect(-width * 0.52, 0, width * 0.08, height);
  ctx.fillRect(width * 0.44, 0, width * 0.08, height);
  for (let i = 0; i < 10; i += 1) {
    ctx.fillStyle = i % 2 ? "#f8fbff" : "#111827";
    ctx.fillRect(-width * 0.44 + i * width * 0.088, 0, width * 0.088, height * 0.23);
  }
  ctx.strokeStyle = "#ffd15c";
  ctx.lineWidth = Math.max(2, 5 * scale);
  ctx.strokeRect(-width * 0.45, -height * 0.02, width * 0.9, height * 0.27);
  ctx.restore();
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
  const rumble = state.speed > 300 ? Math.sin(performance.now() / 32) * clamp(state.speed / 760, 0, 1) * 2.5 : 0;
  const y = h - 176 - state.hop * 95 + rumble;
  const roadCenter = roadPoint(1, w, h).x;
  const x = roadCenter + state.lane * Math.min(250, w * 0.24) + Math.sin(state.spin * 22) * state.spin * 18 + Math.sin(state.bump * 26) * state.bump * 16;
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
  if (state.drifting || state.skid > 0.035) {
    ctx.save();
    const spark = state.driftCharge > 1.35 ? "#ffd15c" : state.character.accent;
    ctx.globalAlpha = clamp(0.18 + state.skid * 2.4, 0.2, 0.78);
    ctx.strokeStyle = spark;
    ctx.lineWidth = 4;
    for (let side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + side * 48 * scale, y + 86 * scale);
      ctx.lineTo(x + side * (95 + Math.abs(state.laneVel) * 160) * scale, y + (145 + Math.sin(performance.now() / 55) * 10) * scale);
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
  const lean = clamp(state.laneVel * 0.26, -0.24, 0.24);
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
  drawGameplayKartSprite(racer, -width * 0.64, -height * 1.02, width * 1.28, height * 1.5);
  if (options.rival && scale > 0.42) {
    const name = racer.name.split(" ").pop().toUpperCase();
    ctx.font = `${Math.max(8, 12 * scale)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    const labelW = Math.min(width, ctx.measureText(name).width + 16 * scale);
    ctx.fillStyle = "rgba(5,8,22,.72)";
    roundRect(-labelW / 2, -height * 1.22, labelW, 18 * scale, 6 * scale);
    ctx.fill();
    ctx.fillStyle = racer.accent;
    ctx.fillText(name, 0, -height * 1.08);
  }
  if (options.player && state.drifting) {
    ctx.strokeStyle = state.driftCharge > 1.35 ? "#ffd15c" : racer.accent;
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(-width * 0.42, height * 0.18);
    ctx.lineTo(-width * 0.62, height * 0.46);
    ctx.moveTo(width * 0.42, height * 0.18);
    ctx.lineTo(width * 0.62, height * 0.46);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = racer.accent;
  ctx.globalAlpha = options.player ? 0.45 : 0.28;
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.beginPath();
  ctx.ellipse(0, height * 0.2, width * 0.48, height * 0.16, 0, 0, Math.PI * 2);
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

function drawRaceOverlay(w, h) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#000";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 0.18;
  const vignette = ctx.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.18, w / 2, h * 0.55, Math.max(w, h) * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.75)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  if (state.driftCharge > 0) {
    const charge = clamp(state.driftCharge / 1.8, 0, 1);
    ctx.globalAlpha = 0.32 + charge * 0.18;
    ctx.strokeStyle = state.driftCharge > 1.35 ? "#ffd15c" : state.character.accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(72, h - 92, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
    ctx.stroke();
  }
  if (state.countdown > 0) {
    const label = Math.ceil(state.countdown);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(5,8,22,.42)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f8fbff";
    ctx.strokeStyle = state.character.accent;
    ctx.lineWidth = 5;
    ctx.font = "950 108px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(String(label), w / 2, h * 0.44);
    ctx.fillText(String(label), w / 2, h * 0.44);
  }
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

function drawSpriteStretch(image, sprite, x, y, width, height) {
  const rect = spriteRect(image, sprite);
  if (!rect) return false;
  ctx.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, x, y, width, height);
  return true;
}

function drawGameplayKartSprite(racer, x, y, width, height) {
  if (ASSETS.gameplayKarts.complete && ASSETS.gameplayKarts.naturalWidth) {
    drawSpriteStretch(ASSETS.gameplayKarts, racer.sprite, x, y, width, height);
    return;
  }
  drawRacerSprite(racer, x, y, width, height, height * 0.14);
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
  keys.add("ArrowUp");
  if (x < rect.width * 0.38) keys.add("ArrowLeft");
  else if (x > rect.width * 0.62) keys.add("ArrowRight");
  else openItemQuestion();
});

els.canvas.addEventListener("pointerup", () => {
  keys.delete("ArrowLeft");
  keys.delete("ArrowRight");
  keys.delete("ArrowUp");
});
els.canvas.addEventListener("pointercancel", () => {
  keys.delete("ArrowLeft");
  keys.delete("ArrowRight");
  keys.delete("ArrowUp");
});

document.querySelectorAll("[data-hold-key]").forEach((button) => {
  const key = button.dataset.holdKey === "space" ? " " : button.dataset.holdKey;
  const press = (event) => {
    event.preventDefault();
    keys.add(key);
    button.classList.add("active");
  };
  const release = (event) => {
    event.preventDefault();
    keys.delete(key);
    button.classList.remove("active");
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

document.querySelector("[data-tap-item]")?.addEventListener("click", (event) => {
  event.preventDefault();
  openItemQuestion();
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
