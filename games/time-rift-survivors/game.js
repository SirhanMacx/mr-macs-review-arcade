(() => {
  "use strict";

  const BASE_W = 1600;
  const BASE_H = 900;
  const STORAGE_KEY = "mr-macs-time-rift-survivors-v1";
  const $ = (id) => document.getElementById(id);

  const els = {
    canvas: $("arena"),
    level: $("level"),
    hp: $("hp"),
    era: $("era"),
    score: $("score"),
    hpBar: $("hpBar"),
    xpBar: $("xpBar"),
    bankCount: $("bankCount"),
    courseFilter: $("courseFilter"),
    setFilter: $("setFilter"),
    libraryBtn: $("libraryBtn"),
    libraryPanel: $("libraryPanel"),
    libraryStatus: $("libraryStatus"),
    startBtn: $("startBtn"),
    pauseBtn: $("pauseBtn"),
    soundBtn: $("soundBtn"),
    resetBtn: $("resetBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    missionTitle: $("missionTitle"),
    questionTimer: $("questionTimer"),
    questionPrompt: $("questionPrompt"),
    choices: $("choices"),
    stimulus: $("stimulus"),
    stimulusZoom: $("stimulusZoom"),
    stimulusZoomImg: $("stimulusZoomImg"),
    stimulusClose: $("stimulusClose"),
    typedForm: $("typedForm"),
    typedAnswer: $("typedAnswer"),
    feedback: $("feedback"),
    relicList: $("relicList"),
    buildPower: $("buildPower"),
    upgradeScreen: $("upgradeScreen"),
    upgradeGrid: $("upgradeGrid"),
    riftBanner: $("riftBanner")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const liteFx = new URLSearchParams(location.search).get("fx") !== "full";
  document.documentElement.classList.toggle("perf-lite", liteFx);

  const assetPaths = {
    arena: "../../assets/time-rift/arena.webp",
    sprites: "../../assets/time-rift/sprites.png",
    relics: "../../assets/time-rift/relics.png"
  };
  const images = {};

  const eras = ["Ancient", "Medieval", "Revolution", "Industrial", "Modern", "Final Rift"];
  const relics = [
    { id: "law", name: "Code Shield", icon: 0, text: "Max HP +18 and grants emergency guard.", apply: () => { player.maxHp += 18; player.hp = Math.min(player.maxHp, player.hp + 28); state.guard += 1; } },
    { id: "compass", name: "Silk Road Compass", icon: 1, text: "Move faster and pull XP from farther away.", apply: () => { player.speed += 24; state.magnet += 48; } },
    { id: "charter", name: "Charter Seal", icon: 2, text: "Reduce contact damage and improve shields.", apply: () => { state.armor += .08; state.guard += 1; } },
    { id: "press", name: "Printing Press", icon: 3, text: "Fires extra archive bolts.", apply: () => { state.boltCount += 1; state.fireRate += .08; } },
    { id: "quill", name: "Enlightenment Quill", icon: 4, text: "Bolts hit harder and score more.", apply: () => { state.damage += 8; state.scoreBonus += .08; } },
    { id: "torch", name: "Revolution Torch", icon: 5, text: "Adds a rotating flame burst.", apply: () => { state.orbitCount += 1; state.orbitDamage += 5; } },
    { id: "engine", name: "Steam Core", icon: 6, text: "Faster attacks and more projectile speed.", apply: () => { state.fireRate += .14; state.projectileSpeed += 70; } },
    { id: "chain", name: "Broken Chain", icon: 7, text: "Every strike pushes enemies back.", apply: () => { state.knockback += 22; state.damage += 3; } },
    { id: "sash", name: "Suffrage Sash", icon: 8, text: "XP rewards increase and rift trials recharge faster.", apply: () => { state.xpBonus += .18; state.trialEvery = Math.max(13, state.trialEvery - 2); } },
    { id: "gear", name: "New Deal Gear", icon: 9, text: "Heal after each correct answer.", apply: () => { state.correctHeal += 9; player.maxHp += 6; } },
    { id: "bridge", name: "Rights Bridge", icon: 10, text: "Adds a wide justice pulse around you.", apply: () => { state.pulseDamage += 7; state.pulseRange += 20; } },
    { id: "radar", name: "Cold War Radar", icon: 11, text: "Slows enemies inside the rift field.", apply: () => { state.slowField += .06; state.slowRange += 30; } }
  ];

  const enemyTypes = [
    { name: "Legion Anomaly", sprite: 1, hp: 42, speed: 82, damage: 8, reward: 10, color: "#ffd66e" },
    { name: "Knight Echo", sprite: 2, hp: 64, speed: 64, damage: 10, reward: 13, color: "#72f2ff" },
    { name: "Plague Mask", sprite: 3, hp: 48, speed: 98, damage: 7, reward: 12, color: "#92f0c4" },
    { name: "Empire Blimp", sprite: 4, hp: 132, speed: 46, damage: 15, reward: 24, color: "#c58cff", elite: true },
    { name: "Propaganda Drone", sprite: 5, hp: 72, speed: 112, damage: 9, reward: 16, color: "#ff8b6b" },
    { name: "Industrial Golem", sprite: 6, hp: 185, speed: 38, damage: 18, reward: 30, color: "#ffb15f", elite: true },
    { name: "Cold War Orb", sprite: 7, hp: 118, speed: 75, damage: 14, reward: 22, color: "#72f2ff", elite: true },
    { name: "Revolution Specter", sprite: 8, hp: 82, speed: 104, damage: 10, reward: 18, color: "#ff6f9d" },
    { name: "Megaphone Wraith", sprite: 9, hp: 92, speed: 94, damage: 11, reward: 18, color: "#6cf3b2" },
    { name: "Misinformation Core", sprite: 10, hp: 150, speed: 72, damage: 16, reward: 27, color: "#c58cff", elite: true },
    { name: "Final Rift Beast", sprite: 11, hp: 760, speed: 42, damage: 24, reward: 120, color: "#ffd66e", boss: true }
  ];

  const player = {
    x: BASE_W / 2,
    y: BASE_H / 2,
    radius: 34,
    hp: 100,
    maxHp: 100,
    speed: 265,
    target: null
  };

  const state = {
    bank: null,
    filtered: [],
    queue: [],
    currentQuestion: null,
    running: false,
    paused: false,
    gameOver: false,
    sound: true,
    last: 0,
    frameStamp: 0,
    elapsed: 0,
    runTime: 0,
    spawnTimer: 0,
    spawnEvery: .82,
    trialTimer: 5,
    trialEvery: 21,
    trialOpen: false,
    choosingUpgrade: false,
    level: 1,
    xp: 0,
    xpNext: 44,
    score: 0,
    kills: 0,
    streak: 0,
    answered: 0,
    correct: 0,
    bestScore: Number(localStorage.getItem(`${STORAGE_KEY}:bestScore`) || 0),
    enemies: [],
    projectiles: [],
    pickups: [],
    particles: [],
    texts: [],
    keys: new Set(),
    pointerDown: false,
    damage: 26,
    fireRate: 1,
    fireTimer: 0,
    boltCount: 1,
    projectileSpeed: 720,
    orbitCount: 1,
    orbitDamage: 18,
    pulseDamage: 12,
    pulseRange: 116,
    pulseTimer: 0,
    slowField: .06,
    slowRange: 175,
    magnet: 96,
    armor: 0,
    knockback: 0,
    guard: 0,
    correctHeal: 8,
    scoreBonus: 0,
    xpBonus: 0,
    shake: 0,
    flash: 0,
    activeRelics: []
  };

  class AudioBus {
    constructor() { this.ctx = null; }
    ensure() {
      if (!state.sound) return null;
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      return this.ctx;
    }
    tone(freq, duration = .08, type = "sine", gain = .04) {
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
    hit() { this.tone(340 + Math.random() * 180, .045, "triangle", .018); }
    pop() { this.tone(720, .05, "square", .022); }
    correct() { this.tone(740, .08, "triangle", .04); setTimeout(() => this.tone(1180, .1, "triangle", .034), 70); }
    wrong() { this.tone(170, .18, "sawtooth", .034); }
    level() { this.tone(420, .08, "sine", .035); setTimeout(() => this.tone(840, .16, "sine", .035), 80); }
    wave() { this.tone(230, .1, "sine", .04); setTimeout(() => this.tone(460, .12, "sine", .035), 90); }
  }
  const audio = new AudioBus();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function money(value) {
    return Math.floor(value).toLocaleString();
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

  function isPlayableQuestion(q) {
    if (q.type !== "mcq") return true;
    if (q.stimulus || q.stimulusText || q.stimulusHtml || q.stimulusImage || q.stimulusImages?.length) return true;
    const prompt = String(q.prompt || "");
    const missingContext = /(\bthis\s+(amendment|document|letter|speech|excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(issues|documents|statements|headlines|conditions|changes|questions|figures)\b|\b(shown|pictured|illustrated|above|below|accompanying)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\b|\bbased\s+on\s+(the|this)\b|similar\s+to\s+this)/i;
    return !missingContext.test(prompt);
  }

  function rebuildSetIndex() {
    const setsByCourse = {};
    state.bank.questions.forEach((q) => {
      if (!setsByCourse[q.course]) setsByCourse[q.course] = new Set();
      setsByCourse[q.course].add(q.set);
    });
    state.bank.setsByCourse = Object.fromEntries(
      Object.entries(setsByCourse).map(([course, sets]) => [
        course,
        [...sets].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      ])
    );
  }

  function displayPrompt(q) {
    const raw = String(q?.prompt || "").trim();
    const cleaned = raw
      .replace(/^final\s+clue(?:\s+for\s+[^:]+)?:\s*/i, "")
      .replace(/^name\s+this\s+content\s+item:\s*/i, "")
      .replace(/^this\s+is\s+his\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+her\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+/i, "Identify: ")
      .replace(/^these\s+are\s+/i, "Identify: ")
      .trim();
    const polished = polishStudyText(cleaned);
    return polished ? polished.charAt(0).toUpperCase() + polished.slice(1) : raw;
  }

  function polishStudyText(text) {
    const replacements = [
      [/\bunited states\b/gi, "United States"],
      [/\bu\.s\.\b/gi, "U.S."],
      [/\bnew york\b/gi, "New York"],
      [/\bvirginia\b/gi, "Virginia"],
      [/\bmaryland\b/gi, "Maryland"],
      [/\bamerica\b/gi, "America"],
      [/\bamerican\b/gi, "American"],
      [/\beurope\b/gi, "Europe"],
      [/\beuropean\b/gi, "European"],
      [/\bafrica\b/gi, "Africa"],
      [/\bafrican\b/gi, "African"],
      [/\basia\b/gi, "Asia"],
      [/\basian\b/gi, "Asian"],
      [/\bchina\b/gi, "China"],
      [/\bchinese\b/gi, "Chinese"],
      [/\bjapan\b/gi, "Japan"],
      [/\bjapanese\b/gi, "Japanese"],
      [/\bindia\b/gi, "India"],
      [/\bindian\b/gi, "Indian"],
      [/\bbritain\b/gi, "Britain"],
      [/\bbritish\b/gi, "British"],
      [/\bfrance\b/gi, "France"],
      [/\bfrench\b/gi, "French"],
      [/\bgermany\b/gi, "Germany"],
      [/\bgerman\b/gi, "German"],
      [/\brussia\b/gi, "Russia"],
      [/\brussian\b/gi, "Russian"],
      [/\bsoviet\b/gi, "Soviet"],
      [/\bgreek\b/gi, "Greek"],
      [/\broman\b/gi, "Roman"],
      [/\bbyzantine\b/gi, "Byzantine"],
      [/\bstrategic defense initiative\b/gi, "Strategic Defense Initiative"],
      [/\bsilk road\b/gi, "Silk Road"],
      [/\bottoman\b/gi, "Ottoman"],
      [/\bmali\b/gi, "Mali"],
      [/\bislamic\b/gi, "Islamic"],
      [/\bcatholic\b/gi, "Catholic"],
      [/\bprotestant\b/gi, "Protestant"],
      [/\brenaissance\b/gi, "Renaissance"],
      [/\benlightenment\b/gi, "Enlightenment"],
      [/\bindustrial revolution\b/gi, "Industrial Revolution"],
      [/\bworld war i\b/gi, "World War I"],
      [/\bworld war ii\b/gi, "World War II"],
      [/\bcold war\b/gi, "Cold War"],
      [/\bcongress\b/gi, "Congress"],
      [/\bconstitution\b/gi, "Constitution"],
      [/\bsupreme court\b/gi, "Supreme Court"],
      [/\bpresident\b/gi, "President"],
      [/\bnew deal\b/gi, "New Deal"]
    ];
    return replacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
  }

  function loadImage(name, src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => { images[name] = image; resolve(image); };
      image.onerror = reject;
      image.src = src;
    });
  }

  async function init() {
    await Promise.all(Object.entries(assetPaths).map(([name, src]) => loadImage(name, src)));
    const res = await fetch("../../data/chrono-defense-bank.json", { cache: "no-store" });
    state.bank = await res.json();
    state.bank.questions = state.bank.questions.filter(isPlayableQuestion);
    rebuildSetIndex();
    initFilters();
    initControls();
    applyFilters();
    renderRelics();
    updateHud();
    showBanner("Enter the Rift");
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
    els.missionTitle.textContent = course === "All Courses" ? "Mixed Timeline Run" : course;
    prepareQuestion();
  }

  function initControls() {
    els.startBtn.addEventListener("click", startRun);
    els.pauseBtn.addEventListener("click", () => {
      if (!state.running || state.gameOver) return;
      state.paused = !state.paused;
      els.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
    });
    els.soundBtn.addEventListener("click", () => {
      state.sound = !state.sound;
      els.soundBtn.textContent = state.sound ? "Sound On" : "Sound Off";
    });
    els.resetBtn.addEventListener("click", resetRun);
    els.fullscreenBtn.addEventListener("click", toggleFullscreen);
    els.libraryBtn.addEventListener("click", focusLibrary);
    els.stimulusClose.addEventListener("click", closeStimulus);
    els.stimulusZoom.addEventListener("click", (event) => {
      if (event.target === els.stimulusZoom) closeStimulus();
    });
    els.typedForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAnswer(els.typedAnswer.value);
    });
    els.canvas.addEventListener("pointerdown", (event) => {
      state.pointerDown = true;
      player.target = canvasPoint(event);
      els.canvas.setPointerCapture?.(event.pointerId);
    });
    els.canvas.addEventListener("pointermove", (event) => {
      if (state.pointerDown) player.target = canvasPoint(event);
    });
    els.canvas.addEventListener("pointerup", () => { state.pointerDown = false; });
    window.addEventListener("keydown", (event) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(event.key)) {
        state.keys.add(event.key.toLowerCase());
        player.target = null;
        event.preventDefault();
      }
      if (event.key === " ") {
        event.preventDefault();
        startRun();
      }
    });
    window.addEventListener("keyup", (event) => {
      state.keys.delete(event.key.toLowerCase());
    });
  }

  function startRun() {
    if (state.gameOver) resetRun();
    if (state.running) return;
    state.running = true;
    state.paused = false;
    els.startBtn.textContent = "Running";
    els.pauseBtn.textContent = "Pause";
    showBanner("Rift Open");
    audio.wave();
  }

  function resetRun() {
    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.elapsed = 0;
    state.runTime = 0;
    state.spawnTimer = 0;
    state.trialTimer = 5;
    state.trialOpen = false;
    state.choosingUpgrade = false;
    state.level = 1;
    state.xp = 0;
    state.xpNext = 44;
    state.score = 0;
    state.kills = 0;
    state.streak = 0;
    state.answered = 0;
    state.correct = 0;
    state.enemies = [];
    state.projectiles = [];
    state.pickups = [];
    state.particles = [];
    state.texts = [];
    state.damage = 26;
    state.fireRate = 1;
    state.fireTimer = 0;
    state.boltCount = 1;
    state.projectileSpeed = 720;
    state.orbitCount = 1;
    state.orbitDamage = 18;
    state.pulseDamage = 12;
    state.pulseRange = 116;
    state.pulseTimer = 0;
    state.slowField = .06;
    state.slowRange = 175;
    state.magnet = 96;
    state.armor = 0;
    state.knockback = 0;
    state.guard = 0;
    state.correctHeal = 8;
    state.scoreBonus = 0;
    state.xpBonus = 0;
    state.activeRelics = [];
    player.x = BASE_W / 2;
    player.y = BASE_H / 2;
    player.hp = 100;
    player.maxHp = 100;
    player.speed = 265;
    player.target = null;
    els.startBtn.textContent = "Start Run";
    els.pauseBtn.textContent = "Pause";
    els.upgradeScreen.classList.remove("show");
    prepareQuestion();
    renderRelics();
    updateHud();
    showBanner("Reset");
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    document.documentElement.requestFullscreen?.();
  }

  function focusLibrary() {
    els.libraryPanel.classList.remove("is-highlighted");
    void els.libraryPanel.offsetWidth;
    els.libraryPanel.classList.add("is-highlighted");
    els.libraryPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    els.courseFilter.focus({ preventScroll: true });
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
    els.typedAnswer.value = "";
    if (!q) {
      renderStimulus(null);
      els.questionPrompt.textContent = "No prompts match this course/unit yet. Pick another library filter.";
      els.choices.style.display = "none";
      els.typedForm.style.display = "none";
      return;
    }
    renderStimulus(q);
    els.questionPrompt.textContent = displayPrompt(q);
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
      const choices = buildChoices(q);
      els.typedForm.style.display = "grid";
      els.choices.style.display = "grid";
      els.choices.innerHTML = choices.map((choice) => (
        `<button type="button" data-choice="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`
      )).join("");
      els.choices.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => submitAnswer(button.dataset.choice));
      });
    }
  }

  function buildChoices(q) {
    const correct = q.answer;
    const pool = shuffle(state.filtered.map((item) => item.answer).filter((answer) => answer && normalize(answer) !== normalize(correct)));
    return shuffle([correct, ...pool.slice(0, 3)]);
  }

  function renderStimulus(q) {
    const images = q?.stimulusImages || (q?.stimulusImage ? [{ src: q.stimulusImage, label: "Source stimulus" }] : []);
    const text = q?.stimulusText || (typeof q?.stimulus === "string" ? q.stimulus : "");
    if (!images.length && !text) {
      els.stimulus.hidden = true;
      els.stimulus.innerHTML = "";
      return;
    }
    els.stimulus.hidden = false;
    const textBlock = text ? `<p>${escapeHtml(text)}</p>` : "";
    const imageButtons = images.map((item, index) => {
      const label = item.label || `Source ${index + 1}`;
      return `<button type="button" data-src="${escapeHtml(item.src)}" data-label="${escapeHtml(label)}">
        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(label)}">
        <span>${escapeHtml(label)}</span>
      </button>`;
    }).join("");
    els.stimulus.innerHTML = textBlock + imageButtons;
    els.stimulus.querySelectorAll("button[data-src]").forEach((button) => {
      button.addEventListener("click", () => openStimulus(button.dataset.src, button.dataset.label));
    });
  }

  function openStimulus(src, label) {
    state.wasPausedForStimulus = state.paused;
    if (state.running && !state.paused) {
      state.paused = true;
      els.pauseBtn.textContent = "Resume";
    }
    els.stimulusZoomImg.src = src;
    els.stimulusZoomImg.alt = label || "Source stimulus";
    els.stimulusZoom.classList.add("show");
    els.stimulusZoom.setAttribute("aria-hidden", "false");
  }

  function closeStimulus() {
    els.stimulusZoom.classList.remove("show");
    els.stimulusZoom.setAttribute("aria-hidden", "true");
    els.stimulusZoomImg.removeAttribute("src");
    if (state.running && !state.wasPausedForStimulus && !state.gameOver) {
      state.paused = false;
      els.pauseBtn.textContent = "Pause";
    }
  }

  function submitAnswer(raw) {
    const q = state.currentQuestion;
    if (!q || state.choosingUpgrade) return;
    const isCorrect = checkAnswer(q, raw);
    state.answered += 1;
    state.trialOpen = false;
    state.trialTimer = state.trialEvery;
    if (isCorrect) {
      state.correct += 1;
      state.streak += 1;
      const reward = 260 + state.streak * 45;
      state.score += Math.round(reward * (1 + state.scoreBonus));
      player.hp = Math.min(player.maxHp, player.hp + state.correctHeal);
      riftStrike(150 + state.streak * 18);
      els.feedback.textContent = `Timeline strike. ${q.explanation || q.answer}`;
      els.feedback.className = "feedback good";
      audio.correct();
      window.setTimeout(showUpgradeChoices, 450);
    } else {
      state.streak = 0;
      state.shake = .55;
      spawnAmbush();
      els.feedback.textContent = `Rift unstable. Answer: ${q.answer}. ${q.explanation || ""}`;
      els.feedback.className = "feedback bad";
      audio.wrong();
    }
    updateHud();
    window.setTimeout(prepareQuestion, isCorrect ? 1300 : 2300);
  }

  function checkAnswer(q, raw) {
    if (q.type === "mcq") return String(raw) === String(q.correct);
    const answer = normalize(raw);
    const accepted = [q.answer, ...(q.aliases || [])].map(normalize).filter(Boolean);
    return accepted.some((item) => answer === item || (item.length > 5 && answer.includes(item)) || (answer.length > 5 && item.includes(answer)));
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
    if (!state.paused && !state.gameOver && !state.choosingUpgrade) {
      state.elapsed += dt;
      if (state.running) state.runTime += dt;
      update(dt);
    }
    draw(now / 1000);
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (!state.running) {
      updateParticles(dt);
      return;
    }
    updatePlayer(dt);
    updateSpawn(dt);
    updateWeapons(dt);
    updateOrbitals(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateTrial(dt);
    state.flash = Math.max(0, state.flash - dt * 1.9);
    state.shake = Math.max(0, state.shake - dt * 1.35);
    updateHud();
  }

  function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (state.keys.has("w") || state.keys.has("arrowup")) dy -= 1;
    if (state.keys.has("s") || state.keys.has("arrowdown")) dy += 1;
    if (state.keys.has("a") || state.keys.has("arrowleft")) dx -= 1;
    if (state.keys.has("d") || state.keys.has("arrowright")) dx += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      player.x += dx / len * player.speed * dt;
      player.y += dy / len * player.speed * dt;
      player.target = null;
    } else if (player.target) {
      const d = Math.hypot(player.target.x - player.x, player.target.y - player.y);
      if (d > 10) {
        player.x += (player.target.x - player.x) / d * player.speed * dt;
        player.y += (player.target.y - player.y) / d * player.speed * dt;
      }
    }
    player.x = clamp(player.x, 72, BASE_W - 72);
    player.y = clamp(player.y, 86, BASE_H - 86);
  }

  function updateSpawn(dt) {
    const eraIndex = currentEraIndex();
    state.spawnEvery = Math.max(.23, .82 - state.runTime * .006);
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy(false, eraIndex);
      state.spawnTimer = state.spawnEvery;
    }
    const bossDue = Math.floor(state.runTime / 45) > Math.floor((state.runTime - dt) / 45) && state.runTime > 8;
    if (bossDue) {
      spawnEnemy(true, eraIndex);
      showBanner("Boss Rift");
      audio.wave();
    }
  }

  function currentEraIndex() {
    return clamp(Math.floor(state.runTime / 38), 0, eras.length - 1);
  }

  function spawnEnemy(forceBoss = false, eraIndex = currentEraIndex()) {
    const maxIndex = Math.min(enemyTypes.length - 2, 2 + eraIndex * 2);
    const index = forceBoss ? enemyTypes.length - 1 : Math.floor(Math.random() * (maxIndex + 1));
    const base = enemyTypes[index];
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(BASE_W, BASE_H) * .62;
    const spawn = {
      x: BASE_W / 2 + Math.cos(angle) * radius,
      y: BASE_H / 2 + Math.sin(angle) * radius
    };
    const scale = 1 + state.runTime * .012 + (forceBoss ? .8 : 0);
    state.enemies.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
      type: base,
      sprite: base.sprite,
      x: spawn.x,
      y: spawn.y,
      r: forceBoss ? 58 : base.elite ? 42 : 31,
      hp: Math.round(base.hp * scale),
      maxHp: Math.round(base.hp * scale),
      speed: base.speed * (1 + Math.min(.5, state.runTime * .004)),
      damage: base.damage,
      reward: Math.round(base.reward * (1 + state.runTime * .01)),
      boss: forceBoss || base.boss,
      elite: base.elite,
      color: base.color,
      hit: 0,
      wobble: Math.random() * Math.PI * 2
    });
  }

  function spawnAmbush() {
    for (let i = 0; i < 5; i++) spawnEnemy(false, currentEraIndex());
    state.flash = 1;
  }

  function updateWeapons(dt) {
    state.fireTimer -= dt * (1 + state.fireRate);
    if (state.fireTimer <= 0) {
      fireBolts();
      state.fireTimer = Math.max(.16, .58 / (1 + state.fireRate * .45));
    }
    state.pulseTimer -= dt;
    if (state.pulseTimer <= 0) {
      riftPulse();
      state.pulseTimer = 2.4;
    }
  }

  function updateOrbitals(dt) {
    if (!state.orbitCount) return;
    const radius = 92 + state.orbitCount * 9;
    for (let i = 0; i < state.orbitCount; i++) {
      const angle = state.elapsed * (1.25 + state.orbitCount * .08) + i * Math.PI * 2 / state.orbitCount;
      const x = player.x + Math.cos(angle) * radius;
      const y = player.y + Math.sin(angle) * radius;
      for (const enemy of state.enemies) {
        if (Math.hypot(enemy.x - x, enemy.y - y) < enemy.r + 22) {
          damageEnemy(enemy, state.orbitDamage * dt, "#ffb15f", true);
        }
      }
    }
  }

  function fireBolts() {
    if (!state.enemies.length) return;
    const targets = [...state.enemies]
      .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))
      .slice(0, state.boltCount);
    for (const target of targets) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      state.projectiles.push({
        kind: "bolt",
        sprite: 12,
        x: player.x,
        y: player.y - 12,
        vx: Math.cos(angle) * state.projectileSpeed,
        vy: Math.sin(angle) * state.projectileSpeed,
        damage: state.damage,
        life: 1.35,
        color: "#ffd66e"
      });
      audio.hit();
    }
  }

  function riftPulse() {
    const range = state.pulseRange;
    let hit = false;
    for (const enemy of state.enemies) {
      const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (d < range) {
        damageEnemy(enemy, state.pulseDamage * (1 - d / (range * 1.7)), "#72f2ff", true);
        hit = true;
      }
    }
    if (hit) {
      state.particles.push({ kind: "ring", x: player.x, y: player.y, r: 0, max: range, color: "#72f2ff", life: .55, maxLife: .55 });
    }
  }

  function updateEnemies(dt) {
    for (const enemy of state.enemies) {
      enemy.hit = Math.max(0, enemy.hit - dt * 4);
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      const d = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      const slow = d < state.slowRange ? (1 - state.slowField) : 1;
      enemy.x += Math.cos(angle) * enemy.speed * slow * dt;
      enemy.y += Math.sin(angle) * enemy.speed * slow * dt;
      if (d < enemy.r + player.radius) {
        hurtPlayer(enemy.damage * dt * 1.55);
        enemy.x -= Math.cos(angle) * 42 * dt;
        enemy.y -= Math.sin(angle) * 42 * dt;
      }
    }
    state.enemies = state.enemies.filter((enemy) => !enemy.dead);
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0 || p.x < -80 || p.x > BASE_W + 80 || p.y < -80 || p.y > BASE_H + 80) p.dead = true;
      for (const enemy of state.enemies) {
        if (enemy.dead || p.dead) continue;
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < enemy.r + 14) {
          damageEnemy(enemy, p.damage, p.color);
          p.dead = true;
        }
      }
    }
    state.projectiles = state.projectiles.filter((p) => !p.dead);
  }

  function updatePickups(dt) {
    for (const pickup of state.pickups) {
      const d = Math.hypot(pickup.x - player.x, pickup.y - player.y);
      if (d < state.magnet) {
        pickup.x += (player.x - pickup.x) / Math.max(1, d) * 640 * dt;
        pickup.y += (player.y - pickup.y) / Math.max(1, d) * 640 * dt;
      }
      if (d < 34) {
        gainXp(pickup.value);
        pickup.dead = true;
      }
    }
    state.pickups = state.pickups.filter((pickup) => !pickup.dead);
  }

  function updateTrial(dt) {
    state.trialTimer -= dt;
    if (state.trialTimer <= 0 && !state.trialOpen) {
      state.trialOpen = true;
      state.trialTimer = 0;
      els.questionTimer.textContent = "answer now";
      showBanner("Rift Trial");
    } else if (!state.trialOpen) {
      els.questionTimer.textContent = `${Math.ceil(state.trialTimer)}s`;
    }
  }

  function hurtPlayer(amount) {
    if (state.guard > 0 && amount > 5) {
      state.guard -= 1;
      addText(player.x, player.y - 48, "guard", "#72f2ff");
      addBurst(player.x, player.y, "#72f2ff", 22);
      return;
    }
    player.hp -= Math.max(1, amount * (1 - clamp(state.armor, 0, .6)));
    state.shake = Math.max(state.shake, .18);
    if (player.hp <= 0) endRun();
  }

  function damageEnemy(enemy, amount, color = "#ffd66e", pulse = false) {
    if (enemy.dead) return;
    enemy.hp -= Math.max(1, amount);
    enemy.hit = 1;
    if (state.knockback && !pulse) {
      const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      enemy.x += Math.cos(angle) * state.knockback;
      enemy.y += Math.sin(angle) * state.knockback;
    }
    if (Math.random() < .2) addText(enemy.x, enemy.y - enemy.r, Math.round(amount), color);
    if (enemy.hp <= 0) killEnemy(enemy);
  }

  function killEnemy(enemy) {
    enemy.dead = true;
    state.kills += 1;
    const xp = Math.round(enemy.reward * (1 + state.xpBonus));
    state.pickups.push({ x: enemy.x, y: enemy.y, value: xp, color: enemy.color });
    state.score += Math.round((enemy.reward * 18 + (enemy.boss ? 1400 : 0)) * (1 + state.scoreBonus));
    addBurst(enemy.x, enemy.y, enemy.color, enemy.boss ? 60 : 22);
    addText(enemy.x, enemy.y, `+${enemy.reward}`, "#6cf3b2");
    audio.pop();
  }

  function gainXp(value) {
    state.xp += value;
    while (state.xp >= state.xpNext) {
      state.xp -= state.xpNext;
      state.level += 1;
      state.xpNext = Math.round(state.xpNext * 1.25 + 18);
      state.score += 180 * state.level;
      addText(player.x, player.y - 60, `LEVEL ${state.level}`, "#ffd66e");
      showUpgradeChoices();
      audio.level();
    }
  }

  function riftStrike(amount) {
    state.flash = 1;
    state.shake = .35;
    const targets = [...state.enemies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)).slice(0, 9);
    for (const enemy of targets) {
      damageEnemy(enemy, amount * (enemy.boss ? .66 : 1), "#ffd66e", true);
      state.particles.push({ kind: "beam", x: player.x, y: player.y - 40, tx: enemy.x, ty: enemy.y, color: "#ffd66e", life: .2, maxLife: .2 });
    }
  }

  function showUpgradeChoices() {
    if (state.choosingUpgrade || state.gameOver) return;
    state.choosingUpgrade = true;
    const choices = shuffle(relics).slice(0, 3);
    els.upgradeGrid.innerHTML = choices.map((relic) => `
      <button class="upgrade-card" type="button" data-relic="${escapeHtml(relic.id)}">
        <span class="relic-icon" style="${relicIconStyle(relic.icon)}"></span>
        <strong>${escapeHtml(relic.name)}</strong>
        <span>${escapeHtml(relic.text)}</span>
      </button>
    `).join("");
    els.upgradeGrid.querySelectorAll(".upgrade-card").forEach((button) => {
      button.addEventListener("click", () => chooseRelic(button.dataset.relic));
    });
    els.upgradeScreen.classList.add("show");
    els.upgradeScreen.setAttribute("aria-hidden", "false");
  }

  function chooseRelic(id) {
    const relic = relics.find((item) => item.id === id);
    if (!relic) return;
    relic.apply();
    state.activeRelics.push(relic);
    state.choosingUpgrade = false;
    els.upgradeScreen.classList.remove("show");
    els.upgradeScreen.setAttribute("aria-hidden", "true");
    renderRelics();
    updateHud();
    showBanner(relic.name);
  }

  function renderRelics() {
    const active = state.activeRelics.slice(-9);
    els.relicList.innerHTML = active.length ? active.map((relic) => `
      <div class="relic-chip">
        <span class="relic-icon" style="${relicIconStyle(relic.icon)}"></span>
        <strong>${escapeHtml(relic.name)}</strong>
      </div>
    `).join("") : `<div class="library-status">Correct answers and level-ups unlock relics.</div>`;
    els.buildPower.textContent = `Level ${state.level}`;
  }

  function relicIconStyle(index) {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = (col / 3) * 100;
    const y = (row / 2) * 100;
    return `background-position:${x}% ${y}%;`;
  }

  function spriteRect(index) {
    const cols = 4;
    const rows = 4;
    const w = images.sprites.width / cols;
    const h = images.sprites.height / rows;
    return {
      x: (index % cols) * w,
      y: Math.floor(index / cols) * h,
      w,
      h
    };
  }

  function draw(time) {
    const shake = state.shake ? Math.sin(time * 84) * state.shake * 10 : 0;
    ctx.save();
    ctx.translate(shake, shake * .4);
    drawBackground(time);
    drawField(time);
    drawPickups(time);
    drawPlayer(time);
    drawEnemies(time);
    drawOrbitals(time);
    drawProjectiles(time);
    drawParticles();
    drawTexts();
    drawOverlay();
    ctx.restore();
  }

  function drawBackground(time) {
    ctx.drawImage(images.arena, 0, 0, BASE_W, BASE_H);
    const grd = ctx.createRadialGradient(BASE_W / 2, BASE_H / 2, 120, BASE_W / 2, BASE_H / 2, 760);
    grd.addColorStop(0, "rgba(114,242,255,.02)");
    grd.addColorStop(.55, "rgba(3,5,10,.03)");
    grd.addColorStop(1, "rgba(3,5,10,.36)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.save();
    ctx.globalAlpha = .16 + Math.sin(time * 1.2) * .05;
    ctx.strokeStyle = "#72f2ff";
    ctx.lineWidth = 2;
    ctx.setLineDash([18, 30]);
    ctx.lineDashOffset = -time * 45;
    ctx.beginPath();
    ctx.arc(BASE_W / 2, BASE_H / 2, 170 + Math.sin(time) * 8, 0, Math.PI * 2);
    ctx.arc(BASE_W / 2, BASE_H / 2, 284 + Math.cos(time * .8) * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawField(time) {
    ctx.save();
    ctx.globalAlpha = .2;
    ctx.strokeStyle = "#72f2ff";
    ctx.shadowColor = "#72f2ff";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(player.x, player.y, state.slowRange + Math.sin(time * 3) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer(time) {
    ctx.save();
    ctx.translate(player.x, player.y + Math.sin(time * 4) * 2);
    ctx.shadowColor = "#72f2ff";
    ctx.shadowBlur = 22;
    drawSprite(0, -58, -78, 116, 116);
    ctx.restore();
  }

  function drawEnemies(time) {
    for (const enemy of state.enemies) {
      const size = enemy.boss ? 166 : enemy.elite ? 116 : 92;
      const wobble = Math.sin(time * 5 + enemy.wobble);
      ctx.save();
      ctx.translate(enemy.x, enemy.y + wobble * 3);
      ctx.rotate(wobble * .035);
      ctx.fillStyle = "rgba(0,0,0,.26)";
      ctx.beginPath();
      ctx.ellipse(0, size * .33, size * .34, size * .12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = enemy.hit ? 24 : 10;
      ctx.globalAlpha = enemy.hit ? .86 : 1;
      drawSprite(enemy.sprite, -size / 2, -size / 2, size, size);
      const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,.62)";
      ctx.fillRect(-size * .36, -size * .55, size * .72, 7);
      ctx.fillStyle = pct > .45 ? "#6cf3b2" : pct > .2 ? "#ffd66e" : "#ff5d72";
      ctx.fillRect(-size * .36, -size * .55, size * .72 * pct, 7);
      ctx.restore();
    }
  }

  function drawOrbitals(time) {
    if (!state.orbitCount) return;
    for (let i = 0; i < state.orbitCount; i++) {
      const angle = time * (1.25 + state.orbitCount * .08) + i * Math.PI * 2 / state.orbitCount;
      const radius = 92 + state.orbitCount * 9;
      const x = player.x + Math.cos(angle) * radius;
      const y = player.y + Math.sin(angle) * radius;
      drawPiece(13, x, y, 48, angle);
    }
  }

  function drawProjectiles(time) {
    for (const p of state.projectiles) {
      const angle = Math.atan2(p.vy, p.vx);
      drawPiece(p.sprite, p.x, p.y, 54, angle);
      ctx.save();
      ctx.globalAlpha = .24;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPickups(time) {
    for (const pickup of state.pickups) {
      ctx.save();
      ctx.translate(pickup.x, pickup.y + Math.sin(time * 6 + pickup.x) * 3);
      ctx.fillStyle = pickup.color;
      ctx.shadowColor = pickup.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.save();
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      if (p.kind === "beam") {
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();
      } else if (p.kind === "ring") {
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
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
      ctx.strokeStyle = "rgba(0,0,0,.74)";
      ctx.lineWidth = 4;
      ctx.strokeText(String(text.value), text.x, text.y);
      ctx.fillText(String(text.value), text.x, text.y);
    }
    ctx.restore();
  }

  function drawOverlay() {
    if (state.flash <= 0) return;
    ctx.save();
    ctx.globalAlpha = state.flash * .18;
    ctx.fillStyle = "#ffd66e";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.restore();
  }

  function drawSprite(index, x, y, w, h) {
    const rect = spriteRect(index);
    ctx.drawImage(images.sprites, rect.x, rect.y, rect.w, rect.h, x, y, w, h);
  }

  function drawPiece(index, x, y, size, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    drawSprite(index, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      if (p.kind === "ring") p.r = p.max * (1 - p.life / p.maxLife);
      if (!p.kind) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 28 * dt;
      }
    }
    state.particles = state.particles.filter((p) => p.life > 0);
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
        maxLife: .9
      });
    }
  }

  function addText(x, y, value, color) {
    state.texts.push({ x, y, value, color, life: .9 });
  }

  function updateHud() {
    els.level.textContent = state.level;
    els.hp.textContent = Math.max(0, Math.ceil(player.hp));
    els.era.textContent = eras[currentEraIndex()];
    els.score.textContent = money(state.score);
    els.hpBar.style.width = `${clamp(player.hp / player.maxHp * 100, 0, 100)}%`;
    els.xpBar.style.width = `${clamp(state.xp / state.xpNext * 100, 0, 100)}%`;
    els.buildPower.textContent = `Level ${state.level}`;
    if (!state.trialOpen && state.running) els.questionTimer.textContent = `${Math.ceil(state.trialTimer)}s`;
  }

  function endRun() {
    state.gameOver = true;
    state.running = false;
    player.hp = 0;
    els.startBtn.textContent = "Start Run";
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem(`${STORAGE_KEY}:bestScore`, String(state.bestScore));
    }
    showBanner(`Run Complete: ${money(state.score)}`);
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "time-rift-survivors",
      title: "Time Rift Survivors",
      score: state.score,
      level: state.level,
      accuracy: state.answered ? Math.round(state.correct / state.answered * 100) : 0
    }, { counter: "game-completions" });
  }

  function showBanner(text) {
    els.riftBanner.textContent = text;
    els.riftBanner.classList.remove("show");
    void els.riftBanner.offsetWidth;
    els.riftBanner.classList.add("show");
  }

  function canvasPoint(event) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * BASE_W / rect.width,
      y: (event.clientY - rect.top) * BASE_H / rect.height
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  init().catch((error) => {
    console.error(error);
    els.missionTitle.textContent = "Engine failed to load";
    els.questionPrompt.textContent = "Refresh the page. If this repeats, the question bank or asset files did not load.";
  });
})();
