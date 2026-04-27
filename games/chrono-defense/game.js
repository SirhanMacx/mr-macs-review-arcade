(() => {
  "use strict";

  const BASE_W = 1600;
  const BASE_H = 900;
  const STORAGE_KEY = "mr-macs-chrono-defense-v1";
  const $ = (id) => document.getElementById(id);

  const els = {
    canvas: $("arena"),
    wave: $("wave"),
    lives: $("lives"),
    insight: $("insight"),
    score: $("score"),
    bankCount: $("bankCount"),
    courseFilter: $("courseFilter"),
    setFilter: $("setFilter"),
    towerList: $("towerList"),
    powerList: $("powerList"),
    selectedTowerName: $("selectedTowerName"),
    upgradeTitle: $("upgradeTitle"),
    upgradePreview: $("upgradePreview"),
    upgradeText: $("upgradeText"),
    upgradeBtn: $("upgradeBtn"),
    sellBtn: $("sellBtn"),
    startWave: $("startWave"),
    pauseBtn: $("pauseBtn"),
    soundBtn: $("soundBtn"),
    resetBtn: $("resetBtn"),
    libraryBtn: $("libraryBtn"),
    libraryPanel: $("libraryPanel"),
    libraryStatus: $("libraryStatus"),
    fullscreenBtn: $("fullscreenBtn"),
    missionTitle: $("missionTitle"),
    missionText: $("missionText"),
    questionConsole: $("questionConsole"),
    questionMeta: $("questionMeta"),
    questionStreak: $("questionStreak"),
    questionPrompt: $("questionPrompt"),
    stimulusStrip: $("stimulusStrip"),
    choices: $("choices"),
    typedForm: $("typedForm"),
    typedAnswer: $("typedAnswer"),
    toggleQuestion: $("toggleQuestion"),
    reactorDock: $("reactorDock"),
    feedback: $("feedback"),
    waveBanner: $("waveBanner"),
    powerCharge: $("powerCharge")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const liteFx = new URLSearchParams(location.search).get("fx") !== "full";
  document.documentElement.classList.toggle("perf-lite", liteFx);
  const ROAD_CLEARANCE = 78;
  const TOWER_CLEARANCE = 92;

  const assetPaths = {
    arena: "../../assets/chrono-defense-road-map.webp",
    towers: "../../assets/chrono-defense-tower-sprites.webp",
    villains: "../../assets/chrono-defense-enemy-sprites.webp",
    pieces: "../../assets/chrono-defense-game-pieces.webp"
  };
  const images = {};

  const towerTypes = [
    {
      id: "archive",
      name: "Archive Cannon",
      role: "single target evidence bursts",
      cost: 120,
      row: 0,
      color: "#ffd76b",
      damage: 46,
      range: 205,
      rate: 1.05,
      splash: 0,
      upgrades: ["Annotated Barrel", "Evidence Howitzer", "Archive Singularity"]
    },
    {
      id: "constitution",
      name: "Constitution Obelisk",
      role: "slows and cracks shields",
      cost: 150,
      row: 1,
      color: "#84f3ff",
      damage: 28,
      range: 185,
      rate: .82,
      slow: .34,
      upgrades: ["Rights Shield", "Judicial Pulse", "Amendment Citadel"]
    },
    {
      id: "map",
      name: "Map Beacon",
      role: "wide pulse and tower buffs",
      cost: 165,
      row: 2,
      color: "#66f2ac",
      damage: 24,
      range: 235,
      rate: .64,
      aura: true,
      upgrades: ["Trade Winds", "Empire Lens", "Global Relay"]
    },
    {
      id: "reform",
      name: "Reform Press",
      role: "chain beams through crowds",
      cost: 140,
      row: 3,
      color: "#ffb56e",
      damage: 32,
      range: 190,
      rate: .95,
      chain: true,
      upgrades: ["Muckraker Press", "Movement Broadcast", "Reform Storm"]
    },
    {
      id: "forge",
      name: "Industrial Forge",
      role: "splash mortars and boss damage",
      cost: 190,
      row: 4,
      color: "#ff8d4d",
      damage: 58,
      range: 215,
      rate: .55,
      splash: 82,
      upgrades: ["Factory Mortar", "Rail Battery", "Industrial Supernova"]
    },
    {
      id: "prism",
      name: "Psychology Prism",
      role: "stuns elites and amplifies streaks",
      cost: 175,
      row: 5,
      color: "#c981ff",
      damage: 34,
      range: 180,
      rate: .78,
      stun: .46,
      upgrades: ["Attention Lens", "Memory Splitter", "Cognition Core"]
    }
  ];

  const enemyTypes = [
    { name: "Misconception Balloon", row: 0, hp: 55, speed: 86, reward: 10, damage: 1 },
    { name: "Rumor Balloon", row: 0, hp: 76, speed: 96, reward: 12, damage: 1 },
    { name: "Distractor Balloon", row: 1, hp: 88, speed: 108, reward: 14, damage: 1 },
    { name: "Source Skimmer", row: 1, hp: 118, speed: 88, reward: 17, damage: 1 },
    { name: "Bias Blimp", row: 2, hp: 175, speed: 72, reward: 24, damage: 2, elite: true },
    { name: "Chronology Blimp", row: 2, hp: 235, speed: 64, reward: 30, damage: 2, elite: true },
    { name: "Locked Document Blimp", row: 2, hp: 280, speed: 56, reward: 34, damage: 2, armored: true, elite: true },
    { name: "Final Exam Airship", row: 3, hp: 720, speed: 47, reward: 80, damage: 4, boss: true },
    { name: "Imperial Exam Boss", row: 3, hp: 900, speed: 43, reward: 94, damage: 5, boss: true },
    { name: "Cold War Exam Boss", row: 3, hp: 1100, speed: 45, reward: 108, damage: 5, boss: true },
    { name: "Cumulative Final Boss", row: 3, hp: 1360, speed: 40, reward: 135, damage: 6, boss: true }
  ];

  const powerups = [
    { id: "scroll", name: "Source Bomb", cost: 180, sprite: 13, text: "Primary-source blast damages every villain." },
    { id: "shield", name: "Rights Shield", cost: 140, sprite: 16, text: "Adds emergency lives and blocks the next leak." },
    { id: "route", name: "Trade Surge", cost: 120, sprite: 9, text: "Boosts tower fire rate for eight seconds." },
    { id: "freeze", name: "Time Freeze", cost: 160, sprite: 14, text: "Freezes the path while towers keep firing." }
  ];

  const pathPoints = [
    { x: 138.8, y: 246.8 }, { x: 138.8, y: 304.1 }, { x: 177.0, y: 350.1 },
    { x: 234.4, y: 383.5 }, { x: 325.4, y: 411.3 }, { x: 449.8, y: 390.2 },
    { x: 569.4, y: 346.2 }, { x: 669.9, y: 344.3 }, { x: 733.0, y: 396.0 },
    { x: 759.8, y: 492.6 }, { x: 751.2, y: 597.8 }, { x: 824.9, y: 650.4 },
    { x: 956.9, y: 648.5 }, { x: 1077.5, y: 593.0 }, { x: 1188.5, y: 521.3 },
    { x: 1309.1, y: 506.9 }, { x: 1418.2, y: 530.8 }, { x: 1519.6, y: 470.6 },
    { x: 1650.7, y: 386.4 }
  ];

  const state = {
    bank: null,
    filtered: [],
    queue: [],
    selectedBuild: "archive",
    selectedTower: null,
    wave: 0,
    lives: 25,
    shield: 0,
    insight: 650,
    score: 0,
    running: false,
    paused: false,
    gameOver: false,
    sound: true,
    last: 0,
    frameStamp: 0,
    elapsed: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [],
    texts: [],
    spawnQueue: [],
    spawnTimer: 0,
    currentQuestion: null,
    correct: 0,
    answered: 0,
    streak: 0,
    bestWave: Number(localStorage.getItem(`${STORAGE_KEY}:bestWave`) || 0),
    freezeUntil: 0,
    surgeUntil: 0,
    shake: 0,
    hover: null,
    reactorFlash: 0,
    questionCollapsed: false,
    pathLength: 0,
    routePoints: [],
    segments: []
  };

  class AudioBus {
    constructor() {
      this.ctx = null;
    }
    ensure() {
      if (!state.sound) return null;
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      return this.ctx;
    }
    tone(freq, duration = .08, type = "sine", gain = .045) {
      const audio = this.ensure();
      if (!audio) return;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(0, audio.currentTime);
      amp.gain.linearRampToValueAtTime(gain, audio.currentTime + .01);
      amp.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
      osc.connect(amp).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + duration + .02);
    }
    correct() { this.tone(740, .08, "triangle", .04); setTimeout(() => this.tone(1110, .1, "triangle", .035), 70); }
    wrong() { this.tone(180, .16, "sawtooth", .035); }
    pop() { this.tone(420 + Math.random() * 260, .06, "square", .025); }
    fire() { this.tone(260 + Math.random() * 90, .04, "triangle", .018); }
    wave() { this.tone(260, .08, "sine", .035); setTimeout(() => this.tone(520, .12, "sine", .035), 90); }
  }
  const audio = new AudioBus();

  function money(value) {
    return Math.floor(value).toLocaleString();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\b(the|a|an)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildPath() {
    state.routePoints = sampleRoute(pathPoints, 12);
    state.segments = [];
    state.pathLength = 0;
    for (let i = 0; i < state.routePoints.length - 1; i++) {
      const a = state.routePoints[i];
      const b = state.routePoints[i + 1];
      const len = dist(a, b);
      state.segments.push({ a, b, len, start: state.pathLength });
      state.pathLength += len;
    }
  }

  function sampleRoute(points, stepsPerSegment) {
    const route = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      for (let step = 0; step < stepsPerSegment; step++) {
        route.push(catmullRom(p0, p1, p2, p3, step / stepsPerSegment));
      }
    }
    route.push(points[points.length - 1]);
    return route;
  }

  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: .5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: .5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  }

  function pointAt(distance) {
    const d = clamp(distance, 0, state.pathLength);
    const seg = state.segments.find((item) => d >= item.start && d <= item.start + item.len) || state.segments[state.segments.length - 1];
    const t = seg.len ? (d - seg.start) / seg.len : 0;
    return {
      x: seg.a.x + (seg.b.x - seg.a.x) * t,
      y: seg.a.y + (seg.b.y - seg.a.y) * t
    };
  }

  function loadImage(name, src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        images[name] = image;
        resolve(image);
      };
      image.onerror = reject;
      image.src = src;
    });
  }

  async function init() {
    buildPath();
    await Promise.all(Object.entries(assetPaths).map(([name, src]) => loadImage(name, src)));
    const res = await fetch("../../data/chrono-defense-bank.json", { cache: "no-store" });
    state.bank = await res.json();
    initFilters();
    initControls();
    renderTowerList();
    renderPowerups();
    applyFilters();
    updateHud();
    els.missionTitle.textContent = "Build, answer, survive";
    els.missionText.textContent = "Place social studies towers, answer the reactor prompts, and hold the path through infinite review waves.";
    if (matchMedia("(max-width: 1120px) and (orientation: landscape)").matches) {
      setQuestionCollapsed(true);
    }
    prepareQuestion();
    requestAnimationFrame(loop);
  }

  function initFilters() {
    const courses = ["All Courses", ...state.bank.courses];
    els.courseFilter.innerHTML = courses.map((course) => `<option>${escapeHtml(course)}</option>`).join("");
    els.courseFilter.value = "All Courses";
    els.courseFilter.addEventListener("change", () => {
      fillSets();
      applyFilters();
    });
    els.setFilter.addEventListener("change", applyFilters);
    fillSets();
  }

  function fillSets() {
    const course = els.courseFilter.value;
    let sets = [];
    if (course === "All Courses") {
      sets = [...new Set(state.bank.questions.map((q) => q.set))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } else {
      sets = state.bank.setsByCourse[course] || [];
    }
    els.setFilter.innerHTML = ["All Sets", ...sets].map((set) => `<option>${escapeHtml(set)}</option>`).join("");
  }

  function applyFilters() {
    const course = els.courseFilter.value;
    const set = els.setFilter.value;
    state.filtered = state.bank.questions.filter((q) => {
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && q.set !== set) return false;
      return true;
    });
    state.queue = shuffle(state.filtered);
    els.bankCount.textContent = `${state.filtered.length.toLocaleString()} prompts`;
    els.libraryStatus.textContent = `${course} / ${set}`;
    els.missionTitle.textContent = course === "All Courses" ? "Full Arcade Mixed Review" : course;
    els.missionText.textContent = set === "All Sets"
      ? "Endless waves will pull from the selected course library."
      : `Endless waves are locked to ${set}.`;
    prepareQuestion();
  }

  function nextQuestion() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    return state.queue.pop() || null;
  }

  function prepareQuestion() {
    const q = nextQuestion();
    state.currentQuestion = q;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.choices.innerHTML = "";
    els.stimulusStrip.innerHTML = "";
    els.stimulusStrip.classList.remove("show");
    els.typedAnswer.value = "";
    if (!q) {
      els.questionPrompt.textContent = "No prompts match this filter yet. Pick another course or content set.";
      els.questionMeta.textContent = "Review Reactor";
      return;
    }
    els.questionMeta.textContent = `${q.course} / ${q.set}`;
    els.questionPrompt.textContent = q.prompt;
    els.questionStreak.textContent = `${state.streak} streak`;
    if (q.stimulusImages?.length) {
      els.stimulusStrip.classList.add("show");
      els.stimulusStrip.innerHTML = q.stimulusImages.slice(0, 2).map((image) => (
        `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.label || "question stimulus")}">`
      )).join("");
    }
    if (q.type === "mcq" && q.choices?.length) {
      els.typedForm.style.display = "none";
      els.choices.style.display = "grid";
      els.choices.innerHTML = q.choices.map((choice) => (
        `<button type="button" data-choice="${escapeHtml(choice.label)}">${escapeHtml(choice.label)}. ${escapeHtml(choice.text)}</button>`
      )).join("");
      els.choices.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => submitAnswer(button.dataset.choice));
      });
    } else {
      els.choices.style.display = "none";
      els.typedForm.style.display = "grid";
      if (!state.questionCollapsed) els.typedAnswer.focus({ preventScroll: true });
    }
  }

  function submitAnswer(raw) {
    const q = state.currentQuestion;
    if (!q) return;
    const isCorrect = checkAnswer(q, raw);
    state.answered += 1;
    if (isCorrect) {
      state.correct += 1;
      state.streak += 1;
      const reward = 85 + Math.min(140, state.streak * 8) + Math.floor(state.wave * 3);
      state.insight += reward;
      state.score += 220 + state.streak * 35 + state.wave * 10;
      precisionStrike(95 + state.wave * 9 + state.streak * 4);
      state.reactorFlash = 1;
      els.feedback.textContent = `Source strike fired. ${q.explanation || q.answer} +${reward} insight.`;
      els.feedback.className = "feedback good";
      audio.correct();
    } else {
      state.streak = 0;
      state.score = Math.max(0, state.score - 35);
      state.shake = .45;
      els.feedback.textContent = `Not quite. Answer: ${q.answer}. ${q.explanation || ""}`;
      els.feedback.className = "feedback bad";
      audio.wrong();
    }
    updateHud();
    window.setTimeout(prepareQuestion, isCorrect ? 950 : 1900);
  }

  function checkAnswer(q, raw) {
    if (q.type === "mcq") return String(raw) === String(q.correct);
    const answer = normalize(raw);
    const accepted = [q.answer, ...(q.aliases || [])].map(normalize).filter(Boolean);
    return accepted.some((item) => answer === item || (item.length > 5 && answer.includes(item)) || (answer.length > 5 && item.includes(answer)));
  }

  function initControls() {
    els.typedForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAnswer(els.typedAnswer.value);
    });
    els.startWave.addEventListener("click", startWave);
    els.pauseBtn.addEventListener("click", () => {
      state.paused = !state.paused;
      els.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
    });
    els.soundBtn.addEventListener("click", () => {
      state.sound = !state.sound;
      els.soundBtn.textContent = state.sound ? "Sound On" : "Sound Off";
    });
    els.resetBtn.addEventListener("click", resetGame);
    els.upgradeBtn.addEventListener("click", upgradeSelected);
    els.sellBtn.addEventListener("click", sellSelected);
    els.libraryBtn.addEventListener("click", focusLibrary);
    els.fullscreenBtn.addEventListener("click", toggleFullscreen);
    els.toggleQuestion.addEventListener("click", () => setQuestionCollapsed(true));
    els.reactorDock.addEventListener("click", () => setQuestionCollapsed(!state.questionCollapsed));
    els.canvas.addEventListener("pointermove", (event) => {
      state.hover = canvasPoint(event);
    });
    els.canvas.addEventListener("pointerleave", () => {
      state.hover = null;
    });
    els.canvas.addEventListener("click", handleCanvasClick);
  }

  function setQuestionCollapsed(collapsed) {
    state.questionCollapsed = collapsed;
    els.questionConsole.classList.toggle("is-collapsed", collapsed);
    els.toggleQuestion.setAttribute("aria-expanded", String(!collapsed));
    els.reactorDock.setAttribute("aria-expanded", String(!collapsed));
    els.reactorDock.textContent = collapsed ? "Show Question Panel" : "Hide Question Panel";
    if (!collapsed && els.typedForm.style.display !== "none") {
      els.typedAnswer.focus({ preventScroll: true });
    }
  }

  function focusLibrary() {
    els.libraryPanel.classList.remove("is-highlighted");
    void els.libraryPanel.offsetWidth;
    els.libraryPanel.classList.add("is-highlighted");
    els.libraryPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    els.courseFilter.focus({ preventScroll: true });
  }

  function renderTowerList() {
    els.towerList.innerHTML = towerTypes.map((tower) => `
      <button class="tower-card ${tower.id === state.selectedBuild ? "active" : ""}" type="button" data-tower="${tower.id}">
        <span class="tower-icon" style="${towerIconStyle(tower, 0)}"></span>
        <span><strong>${escapeHtml(tower.name)}</strong><span>${escapeHtml(tower.role)}</span></span>
        <em class="cost">${tower.cost}</em>
      </button>
    `).join("");
    els.towerList.querySelectorAll(".tower-card").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedBuild = button.dataset.tower;
        state.selectedTower = null;
        renderTowerList();
        updateSelectedPanel();
      });
    });
  }

  function renderPowerups() {
    els.powerList.innerHTML = powerups.map((power) => `
      <button class="power-card" type="button" data-power="${power.id}">
        <span class="power-icon" style="${powerIconStyle(power.sprite)}"></span>
        <span><strong>${escapeHtml(power.name)}</strong><span>${escapeHtml(power.text)}</span></span>
        <em class="cost">${power.cost}</em>
      </button>
    `).join("");
    els.powerList.querySelectorAll(".power-card").forEach((button) => {
      button.addEventListener("click", () => usePower(button.dataset.power));
    });
  }

  function toggleFullscreen() {
    const root = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    root.requestFullscreen?.();
  }

  function towerIconStyle(tower, tier) {
    return atlasStyle("../../assets/chrono-defense-tower-sprites.webp", tower.row, clamp(tier, 0, 2), 6, 3);
  }

  function powerIconStyle(sprite) {
    const col = sprite % 6;
    const row = Math.floor(sprite / 6);
    return atlasStyle("../../assets/chrono-defense-game-pieces.webp", row, col, 4, 6);
  }

  function atlasStyle(src, row, col, rows, cols) {
    const x = cols === 1 ? 0 : (col / (cols - 1)) * 100;
    const y = rows === 1 ? 0 : (row / (rows - 1)) * 100;
    return `background-image:url('${src}');background-size:${cols * 100}% ${rows * 100}%;background-position:${x}% ${y}%;`;
  }

  function towerRect(row, tier) {
    const cols = 3;
    const rows = 6;
    const w = images.towers.width / cols;
    const h = images.towers.height / rows;
    return {
      x: clamp(tier, 0, 2) * w,
      y: clamp(row, 0, 5) * h,
      w,
      h
    };
  }

  function villainFrameRect(row, frame) {
    const cols = 6;
    const rows = 4;
    return {
      x: clamp(frame, 0, 5) * (images.villains.width / cols),
      y: clamp(row, 0, 3) * (images.villains.height / rows),
      w: images.villains.width / cols,
      h: images.villains.height / rows
    };
  }

  function pieceRect(sprite) {
    const cols = 6;
    const rows = 4;
    return {
      x: (sprite % cols) * (images.pieces.width / cols),
      y: Math.floor(sprite / cols) * (images.pieces.height / rows),
      w: images.pieces.width / cols,
      h: images.pieces.height / rows
    };
  }

  function startWave() {
    if (state.gameOver) return;
    if (!state.towers.length) {
      showBanner("Build a Tower First");
      return;
    }
    if (state.spawnQueue.length || state.enemies.length) return;
    state.wave += 1;
    state.running = true;
    state.paused = false;
    els.pauseBtn.textContent = "Pause";
    const count = 9 + Math.floor(state.wave * 1.7);
    const bossStart = 7;
    const tier = Math.min(bossStart, Math.floor(state.wave / 2) + 2);
    const bossWave = state.wave % 5 === 0;
    state.spawnQueue = [];
    for (let i = 0; i < count; i++) {
      const index = clamp(Math.floor(Math.random() * tier), 0, bossStart - 1);
      state.spawnQueue.push({ type: index, delay: .22 + Math.max(.08, .34 - state.wave * .01) });
    }
    if (bossWave) {
      const bossIndex = bossStart + Math.min(3, Math.floor(state.wave / 10));
      state.spawnQueue.push({ type: bossIndex, delay: .9 });
      showBanner(`Boss Wave ${state.wave}`);
    } else {
      showBanner(`Wave ${state.wave}`);
    }
    state.spawnTimer = 0;
    state.score += state.wave * 25;
    updateHud();
    audio.wave();
  }

  function spawnEnemy(typeIndex) {
    const base = enemyTypes[typeIndex];
    const scale = 1 + state.wave * .19 + Math.max(0, state.wave - 12) * .035;
    const entrance = Math.random() * 18;
    const point = pointAt(entrance);
    const enemy = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
      type: base,
      name: base.name,
      row: base.row,
      maxHp: Math.round(base.hp * scale * (base.boss ? 1.35 : 1)),
      hp: 0,
      speed: base.speed * (1 + Math.min(.55, state.wave * .01)),
      reward: Math.round(base.reward * (1 + state.wave * .045)),
      damage: base.damage,
      boss: Boolean(base.boss),
      armored: Boolean(base.armored),
      dist: entrance,
      x: point.x,
      y: point.y,
      slowUntil: 0,
      stunUntil: 0,
      wobble: Math.random() * Math.PI * 2
    };
    enemy.hp = enemy.maxHp;
    state.enemies.push(enemy);
  }

  function handleCanvasClick(event) {
    const pos = canvasPoint(event);
    const clickedTower = state.towers.find((tower) => Math.hypot(tower.x - pos.x, tower.y - pos.y) < 58);
    if (clickedTower) {
      state.selectedTower = clickedTower;
      updateSelectedPanel();
      return;
    }
    const type = towerTypes.find((tower) => tower.id === state.selectedBuild);
    const placement = placementStatus(pos);
    if (!placement.ok) {
      showBanner(placement.reason);
      state.hover = pos;
      return;
    }
    if (!type || state.insight < type.cost) {
      showBanner("Need More Insight");
      return;
    }
    state.insight -= type.cost;
    const tower = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
      type,
      x: pos.x,
      y: pos.y,
      level: 1,
      cooldown: Math.random() * .4,
      targetId: null,
      angle: 0,
      pulse: 0,
      kills: 0
    };
    state.towers.push(tower);
    state.selectedTower = tower;
    updateSelectedPanel();
    updateHud();
    addBurst(tower.x, tower.y, type.color, 18);
  }

  function placementStatus(pos) {
    if (!pos) return { ok: false, reason: "Choose Open Ground" };
    if (pos.x < 52 || pos.x > BASE_W - 52 || pos.y < 58 || pos.y > BASE_H - 58) {
      return { ok: false, reason: "Too Close To Edge" };
    }
    if (distanceToTrack(pos) < ROAD_CLEARANCE) return { ok: false, reason: "Road Is Blocked" };
    if (state.towers.some((tower) => Math.hypot(tower.x - pos.x, tower.y - pos.y) < TOWER_CLEARANCE)) {
      return { ok: false, reason: "Too Close To Tower" };
    }
    return { ok: true, reason: "Build Here" };
  }

  function distanceToTrack(point) {
    let best = Infinity;
    for (const seg of state.segments) {
      best = Math.min(best, distanceToSegment(point, seg.a, seg.b));
    }
    return best;
  }

  function distanceToSegment(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy || 1;
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq, 0, 1);
    const x = a.x + dx * t;
    const y = a.y + dy * t;
    return Math.hypot(p.x - x, p.y - y);
  }

  function canvasPoint(event) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * BASE_W / rect.width,
      y: (event.clientY - rect.top) * BASE_H / rect.height
    };
  }

  function upgradeSelected() {
    const tower = state.selectedTower;
    if (!tower) return;
    if (tower.level >= 3) {
      showBanner("Legendary Tier Online");
      return;
    }
    const cost = upgradeCost(tower);
    if (state.insight < cost) {
      showBanner("Need More Insight");
      return;
    }
    state.insight -= cost;
    tower.level += 1;
    tower.pulse = 1;
    addBurst(tower.x, tower.y, tower.type.color, 34);
    updateSelectedPanel();
    updateHud();
    audio.correct();
  }

  function sellSelected() {
    const tower = state.selectedTower;
    if (!tower) return;
    state.insight += Math.round((tower.type.cost + (tower.level - 1) * 95) * .58);
    state.towers = state.towers.filter((item) => item !== tower);
    state.selectedTower = null;
    updateSelectedPanel();
    updateHud();
  }

  function upgradeCost(tower) {
    return Math.round(tower.type.cost * (.95 + tower.level * .7) + state.wave * 9);
  }

  function updateSelectedPanel() {
    const tower = state.selectedTower;
    if (!tower) {
      const type = towerTypes.find((item) => item.id === state.selectedBuild);
      els.selectedTowerName.textContent = type.name;
      els.upgradeTitle.textContent = "Build selected tower";
      els.upgradeText.textContent = `${type.name}: ${type.role}. Build anywhere on open ground away from the road.`;
      els.upgradePreview.style = towerIconStyle(type, 0);
      els.upgradeBtn.disabled = true;
      els.sellBtn.disabled = true;
      renderTowerList();
      return;
    }
    els.upgradeTitle.textContent = `${tower.type.name} T${tower.level}`;
    const next = tower.type.upgrades[tower.level] || "Maxed legendary tier";
    els.upgradeText.textContent = tower.level < 3
      ? `Next: ${next}. Cost ${upgradeCost(tower)} insight. Kills: ${tower.kills}.`
      : `${tower.type.upgrades[2]} online. This tower is at maximum tier.`;
    els.upgradePreview.style = towerIconStyle(tower.type, tower.level - 1);
    els.upgradeBtn.disabled = tower.level >= 3;
    els.sellBtn.disabled = false;
    renderTowerList();
  }

  function usePower(id) {
    const power = powerups.find((item) => item.id === id);
    if (!power || state.insight < power.cost) {
      showBanner("Need More Insight");
      return;
    }
    state.insight -= power.cost;
    if (id === "scroll") {
      precisionStrike(220 + state.wave * 16, true);
      showBanner("Source Bomb");
    }
    if (id === "shield") {
      state.shield += 6;
      state.lives += 2;
      addBurst(BASE_W * .5, BASE_H * .5, "#84f3ff", 48);
      showBanner("Rights Shield");
    }
    if (id === "route") {
      state.surgeUntil = state.elapsed + 8;
      showBanner("Trade Surge");
    }
    if (id === "freeze") {
      state.freezeUntil = state.elapsed + 6;
      showBanner("Time Freeze");
    }
    updateHud();
    audio.correct();
  }

  function resetGame() {
    state.wave = 0;
    state.lives = 25;
    state.shield = 0;
    state.insight = 650;
    state.score = 0;
    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.enemies = [];
    state.towers = [];
    state.projectiles = [];
    state.particles = [];
    state.texts = [];
    state.spawnQueue = [];
    state.streak = 0;
    state.correct = 0;
    state.answered = 0;
    state.selectedTower = null;
    updateHud();
    updateSelectedPanel();
    showBanner("Reset");
  }

  function loop(now) {
    if (document.hidden) {
      state.last = now;
      requestAnimationFrame(loop);
      return;
    }
    if (liteFx && state.frameStamp && now - state.frameStamp < 1000 / 45) {
      requestAnimationFrame(loop);
      return;
    }
    state.frameStamp = now;
    const dt = Math.min(.05, ((now - (state.last || now)) / 1000) || 0);
    state.last = now;
    if (!state.paused && !state.gameOver) {
      state.elapsed += dt;
      update(dt);
    }
    draw(now / 1000);
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (state.spawnQueue.length) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const item = state.spawnQueue.shift();
        spawnEnemy(item.type);
        state.spawnTimer = item.delay;
      }
    }
    updateEnemies(dt);
    updateTowers(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateTexts(dt);
    state.reactorFlash = Math.max(0, state.reactorFlash - dt * 1.9);
    if (state.running && !state.spawnQueue.length && !state.enemies.length && state.wave > 0) {
      state.running = false;
      state.insight += 95 + state.wave * 14;
      state.score += 400 + state.wave * 75;
      showBanner("Wave Cleared");
      updateHud();
    }
  }

  function updateEnemies(dt) {
    const frozen = state.elapsed < state.freezeUntil;
    for (const enemy of state.enemies) {
      if (state.elapsed < enemy.stunUntil || frozen) continue;
      const slow = state.elapsed < enemy.slowUntil ? .56 : 1;
      const point = pointAt(enemy.dist);
      enemy.x = point.x;
      enemy.y = point.y + Math.sin(state.elapsed * 4 + enemy.wobble) * (enemy.boss ? 4 : 7);
      enemy.dist += enemy.speed * slow * dt;
      if (enemy.dist >= state.pathLength) leakEnemy(enemy);
    }
    state.enemies = state.enemies.filter((enemy) => !enemy.dead && !enemy.leaked);
  }

  function leakEnemy(enemy) {
    enemy.leaked = true;
    if (state.shield > 0) {
      state.shield -= enemy.damage;
      if (state.shield < 0) {
        state.lives += state.shield;
        state.shield = 0;
      }
    } else {
      state.lives -= enemy.damage;
    }
    state.shake = .55;
    addText(enemy.x, enemy.y, `-${enemy.damage}`, "#ff6479");
    if (state.lives <= 0) endGame();
    updateHud();
  }

  function updateTowers(dt) {
    const surge = state.elapsed < state.surgeUntil ? 1.55 : 1;
    for (const tower of state.towers) {
      tower.cooldown -= dt * surge;
      tower.pulse = Math.max(0, tower.pulse - dt * 1.8);
      const target = selectTarget(tower);
      if (!target) continue;
      tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
      if (tower.cooldown <= 0) {
        fireTower(tower, target);
        const rate = tower.type.rate * (1 + (tower.level - 1) * .24);
        tower.cooldown = 1 / rate;
      }
    }
  }

  function selectTarget(tower) {
    const range = tower.type.range * (1 + (tower.level - 1) * .14);
    let best = null;
    for (const enemy of state.enemies) {
      if (Math.hypot(enemy.x - tower.x, enemy.y - tower.y) > range) continue;
      if (!best || enemy.dist > best.dist) best = enemy;
    }
    return best;
  }

  function fireTower(tower, target) {
    const level = tower.level;
    const damage = tower.type.damage * (1 + (level - 1) * .62) + state.wave * .45;
    const projectileSprite = { archive: 7, constitution: 8, map: 9, reform: 10, forge: 11, prism: 12 }[tower.type.id] || 7;
    tower.pulse = .55;
    audio.fire();
    if (tower.type.chain) {
      const chainTargets = state.enemies
        .filter((enemy) => Math.hypot(enemy.x - tower.x, enemy.y - tower.y) < tower.type.range * 1.1)
        .sort((a, b) => b.dist - a.dist)
        .slice(0, level + 1);
      for (const enemy of chainTargets) {
        damageEnemy(enemy, damage * .72, tower);
        state.projectiles.push({ kind: "beam", x: tower.x, y: tower.y, tx: enemy.x, ty: enemy.y, color: tower.type.color, life: .15, max: .15 });
      }
      return;
    }
    if (tower.type.aura) {
      const radius = 95 + level * 22;
      state.projectiles.push({ kind: "pulse", x: tower.x, y: tower.y, r: 0, maxR: radius, color: tower.type.color, life: .42, max: .42, tower });
      for (const enemy of state.enemies) {
        if (Math.hypot(enemy.x - target.x, enemy.y - target.y) < radius) damageEnemy(enemy, damage * .55, tower);
      }
      return;
    }
    state.projectiles.push({
      kind: tower.type.splash ? "mortar" : "bolt",
      sprite: projectileSprite,
      x: tower.x,
      y: tower.y - 26,
      target,
      tx: target.x,
      ty: target.y,
      speed: tower.type.splash ? 560 : 760,
      damage,
      splash: tower.type.splash ? tower.type.splash * (1 + level * .12) : 0,
      slow: tower.type.slow,
      stun: tower.type.stun,
      color: tower.type.color,
      tower
    });
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      if (p.kind === "beam") {
        p.life -= dt;
        if (p.life <= 0) p.dead = true;
        continue;
      }
      if (p.kind === "pulse") {
        p.life -= dt;
        p.r = p.maxR * (1 - p.life / p.max);
        if (p.life <= 0) p.dead = true;
        continue;
      }
      const target = p.target && !p.target.dead ? p.target : null;
      const tx = target ? target.x : p.tx;
      const ty = target ? target.y : p.ty;
      const dx = tx - p.x;
      const dy = ty - p.y;
      const d = Math.hypot(dx, dy);
      if (d < p.speed * dt || d < 10) {
        impactProjectile(p, tx, ty);
        p.dead = true;
      } else {
        p.x += dx / d * p.speed * dt;
        p.y += dy / d * p.speed * dt;
      }
    }
    state.projectiles = state.projectiles.filter((p) => !p.dead);
  }

  function impactProjectile(p, x, y) {
    if (p.splash) {
      addBurst(x, y, p.color, 22);
      for (const enemy of state.enemies) {
        const d = Math.hypot(enemy.x - x, enemy.y - y);
        if (d <= p.splash) damageEnemy(enemy, p.damage * (1 - d / (p.splash * 1.35)), p.tower);
      }
    } else if (p.target && !p.target.dead) {
      if (p.slow) p.target.slowUntil = state.elapsed + 1.6 + p.tower.level * .3;
      if (p.stun) p.target.stunUntil = state.elapsed + p.stun + p.tower.level * .12;
      damageEnemy(p.target, p.damage, p.tower);
      addBurst(x, y, p.color, 8);
    }
  }

  function damageEnemy(enemy, amount, tower) {
    if (enemy.dead) return;
    const armored = enemy.armored ? .78 : 1;
    const final = Math.max(1, amount * armored);
    enemy.hp -= final;
    if (Math.random() < .16) addText(enemy.x, enemy.y - 26, Math.round(final), tower?.type?.color || "#ffd76b");
    if (enemy.hp <= 0) popEnemy(enemy, tower);
  }

  function popEnemy(enemy, tower) {
    if (enemy.dead) return;
    enemy.dead = true;
    if (tower) tower.kills += 1;
    state.insight += enemy.reward;
    state.score += enemy.reward * 8 + (enemy.boss ? 1000 : 80);
    addBurst(enemy.x, enemy.y, enemy.boss ? "#ffd76b" : "#67efff", enemy.boss ? 60 : 24);
    addText(enemy.x, enemy.y, `+${enemy.reward}`, "#66f2ac");
    audio.pop();
    updateHud();
  }

  function precisionStrike(amount, all = false) {
    const targets = [...state.enemies].sort((a, b) => b.dist - a.dist).slice(0, all ? 999 : 5);
    for (const enemy of targets) {
      damageEnemy(enemy, amount * (enemy.boss ? .85 : 1), null);
      state.projectiles.push({ kind: "beam", x: BASE_W * .5, y: 92, tx: enemy.x, ty: enemy.y, color: "#ffd76b", life: .22, max: .22 });
    }
    if (targets.length) state.shake = .24;
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 28 * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    state.shake = Math.max(0, state.shake - dt * 1.4);
  }

  function updateTexts(dt) {
    for (const text of state.texts) {
      text.life -= dt;
      text.y -= 36 * dt;
    }
    state.texts = state.texts.filter((text) => text.life > 0);
  }

  function addBurst(x, y, color, count) {
    const actual = reduceMotion ? Math.min(8, count) : liteFx ? Math.min(18, Math.ceil(count * .45)) : count;
    for (let i = 0; i < actual; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 180;
      state.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: 2 + Math.random() * 5,
        color,
        life: .35 + Math.random() * .55,
        max: .9
      });
    }
  }

  function addText(x, y, value, color) {
    state.texts.push({ x, y, value, color, life: .9 });
  }

  function draw(time) {
    const shake = state.shake ? Math.sin(time * 90) * state.shake * 8 : 0;
    ctx.save();
    ctx.translate(shake, shake * .4);
    drawBackground(time);
    drawReactorPulse(time);
    drawTowers(time);
    drawEnemies(time);
    drawPlacementPreview(time);
    drawProjectiles(time);
    drawParticles();
    drawTexts();
    ctx.restore();
  }

  function drawBackground(time) {
    ctx.drawImage(images.arena, 0, 0, BASE_W, BASE_H);
    const grd = ctx.createLinearGradient(0, 0, BASE_W, BASE_H);
    grd.addColorStop(0, "rgba(2,5,12,.12)");
    grd.addColorStop(.52, "rgba(2,5,12,.02)");
    grd.addColorStop(1, "rgba(2,5,12,.20)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.save();
    ctx.globalAlpha = .1 + Math.sin(time * .8) * .035;
    ctx.fillStyle = "#fff3b8";
    ctx.beginPath();
    ctx.arc(1485, 135, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPath(time) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 0;
    ctx.setLineDash([22, 44]);
    ctx.lineDashOffset = -time * 62;
    ctx.strokeStyle = "rgba(255,255,255,.30)";
    ctx.lineWidth = 4;
    drawPathLine();
    ctx.restore();
  }

  function drawPathLine() {
    const points = state.routePoints.length ? state.routePoints : pathPoints;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }

  function drawReactorPulse(time) {
    if (state.reactorFlash <= 0) return;
    ctx.save();
    ctx.globalAlpha = state.reactorFlash * .45;
    ctx.strokeStyle = "#ffd76b";
    ctx.shadowColor = "#ffd76b";
    ctx.shadowBlur = 22;
    ctx.lineWidth = 7 + state.reactorFlash * 8;
    ctx.setLineDash([30, 22]);
    ctx.lineDashOffset = -time * 160;
    drawPathLine();
    ctx.restore();
  }

  function drawPlacementPreview(time) {
    const hover = state.hover;
    if (!hover || state.selectedTower) return;
    const type = towerTypes.find((tower) => tower.id === state.selectedBuild);
    if (!type) return;
    const placement = placementStatus(hover);
    const color = placement.ok ? type.color : "#ff6479";
    ctx.save();
    ctx.translate(hover.x, hover.y);
    ctx.globalAlpha = placement.ok ? .82 : .58;
    ctx.fillStyle = placement.ok ? "rgba(102,242,172,.09)" : "rgba(255,100,121,.10)";
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = placement.ok ? 16 : 8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 43 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = placement.ok ? .9 : .45;
    drawTowerSprite({ type, level: 1 }, -45, -72, 90, 90);
    ctx.restore();
  }

  function drawTowers(time) {
    for (const tower of state.towers) {
      const selected = tower === state.selectedTower;
      const range = tower.type.range * (1 + (tower.level - 1) * .14);
      if (selected) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,215,107,.34)";
        ctx.fillStyle = "rgba(255,215,107,.055)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(tower.x, tower.y + Math.sin(time * 3 + tower.x) * 2);
      const scale = 1 + tower.pulse * .16;
      ctx.scale(scale, scale);
      ctx.shadowColor = tower.type.color;
      ctx.shadowBlur = selected ? 24 : 12;
      drawTowerSprite(tower, -64, -92, 128, 128);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = tower.type.color;
      ctx.globalAlpha = .35 + tower.pulse * .45;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 42 + tower.pulse * 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTowerSprite(tower, x, y, w, h) {
    const rect = towerRect(tower.type.row, tower.level - 1);
    ctx.drawImage(images.towers, rect.x, rect.y, rect.w, rect.h, x, y, w, h);
  }

  function drawEnemies(time) {
    for (const enemy of state.enemies) {
      const baseSize = enemy.boss ? 240 : enemy.type.elite ? 166 : 132;
      const damageFrame = enemy.hp / enemy.maxHp < .25 ? 5 : null;
      const frame = damageFrame ?? Math.floor((time * 8 + enemy.wobble) % 5);
      const size = baseSize * (1 + Math.sin(time * 5 + enemy.wobble) * .025);
      const rect = villainFrameRect(enemy.row, frame);
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(Math.sin(time * 3 + enemy.wobble) * .055);
      ctx.fillStyle = "rgba(0,0,0,.24)";
      ctx.beginPath();
      ctx.ellipse(0, size * .38, size * .38, size * .13, 0, 0, Math.PI * 2);
      ctx.fill();
      const squash = Math.sin(time * 7 + enemy.wobble);
      ctx.scale(1 + squash * .035, 1 - squash * .025);
      ctx.shadowBlur = enemy.boss ? 24 : 14;
      ctx.shadowColor = enemy.boss ? "#ffd76b" : enemy.row === 2 ? "#c981ff" : "#67efff";
      ctx.drawImage(images.villains, rect.x, rect.y, rect.w, rect.h, -size / 2, -size / 2, size, size);
      const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);
      const barW = size * .72;
      const barH = enemy.boss ? 10 : 7;
      const barY = -size * .58;
      ctx.fillStyle = "rgba(0,0,0,.58)";
      ctx.fillRect(-barW / 2, barY, barW, barH);
      ctx.fillStyle = pct > .45 ? "#66f2ac" : pct > .2 ? "#ffd76b" : "#ff6479";
      ctx.fillRect(-barW / 2, barY, barW * pct, barH);
      if (state.elapsed < enemy.slowUntil || state.elapsed < enemy.stunUntil) {
        ctx.strokeStyle = state.elapsed < enemy.stunUntil ? "#c981ff" : "#67efff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, size * .48, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawProjectiles(time) {
    for (const p of state.projectiles) {
      ctx.save();
      if (p.kind === "beam") {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();
      } else if (p.kind === "pulse") {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const angle = Math.atan2((p.ty || p.y) - p.y, (p.tx || p.x) - p.x);
        drawPieceSprite(p.sprite || 7, p.x, p.y, p.kind === "mortar" ? 56 : 42, p.kind === "mortar" ? 56 : 42, angle);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = .38;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.kind === "mortar" ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawPieceSprite(sprite, x, y, w, h, angle = 0) {
    const rect = pieceRect(sprite);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(images.pieces, rect.x, rect.y, rect.w, rect.h, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawParticles() {
    for (const p of state.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTexts() {
    ctx.save();
    ctx.font = "900 22px Inter, sans-serif";
    ctx.textAlign = "center";
    for (const text of state.texts) {
      ctx.globalAlpha = clamp(text.life / .9, 0, 1);
      ctx.fillStyle = text.color;
      ctx.strokeStyle = "rgba(0,0,0,.75)";
      ctx.lineWidth = 4;
      ctx.strokeText(String(text.value), text.x, text.y);
      ctx.fillText(String(text.value), text.x, text.y);
    }
    ctx.restore();
  }

  function updateHud() {
    els.wave.textContent = state.wave;
    els.lives.textContent = Math.max(0, Math.ceil(state.lives));
    els.insight.textContent = money(state.insight);
    els.score.textContent = money(state.score);
    els.questionStreak.textContent = `${state.streak} streak`;
    els.powerCharge.textContent = state.shield > 0 ? `${state.shield} shield` : "ready";
  }

  function showBanner(text) {
    els.waveBanner.textContent = text;
    els.waveBanner.classList.remove("show");
    void els.waveBanner.offsetWidth;
    els.waveBanner.classList.add("show");
  }

  function endGame() {
    state.gameOver = true;
    state.running = false;
    state.lives = 0;
    if (state.wave > state.bestWave) {
      state.bestWave = state.wave;
      localStorage.setItem(`${STORAGE_KEY}:bestWave`, String(state.bestWave));
    }
    showBanner(`Run Complete: Wave ${state.wave}`);
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "chrono-defense-infinite",
      title: "Chrono Defense Infinite",
      score: state.score,
      wave: state.wave,
      accuracy: state.answered ? Math.round(state.correct / state.answered * 100) : 0
    }, { counter: "game-completions" });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const radius = typeof r === "number" ? r : 8;
      this.beginPath();
      this.moveTo(x + radius, y);
      this.lineTo(x + w - radius, y);
      this.quadraticCurveTo(x + w, y, x + w, y + radius);
      this.lineTo(x + w, y + h - radius);
      this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      this.lineTo(x + radius, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - radius);
      this.lineTo(x, y + radius);
      this.quadraticCurveTo(x, y, x + radius, y);
      this.closePath();
      return this;
    };
  }

  init().catch((error) => {
    console.error(error);
    els.missionTitle.textContent = "Engine failed to load";
    els.missionText.textContent = "Refresh the page. If this repeats, the question bank or asset files did not load.";
  });
})();
