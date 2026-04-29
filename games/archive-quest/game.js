(() => {
  "use strict";

  const BASE_W = 1600;
  const BASE_H = 900;
  const STORAGE_KEY = "mr-macs-archive-quest-v1";
  const $ = (id) => document.getElementById(id);

  const els = {
    canvas: $("gameCanvas"),
    score: $("score"),
    levelName: $("levelName"),
    health: $("health"),
    evidence: $("evidence"),
    powerLabel: $("powerLabel"),
    powerFill: $("powerFill"),
    setupScreen: $("setupScreen"),
    questionScreen: $("questionScreen"),
    pauseScreen: $("pauseScreen"),
    endScreen: $("endScreen"),
    courseFilter: $("courseFilter"),
    setFilter: $("setFilter"),
    levelFilter: $("levelFilter"),
    setupMetrics: $("setupMetrics"),
    startBtn: $("startBtn"),
    pauseBtn: $("pauseBtn"),
    soundBtn: $("soundBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    resumeBtn: $("resumeBtn"),
    restartBtn: $("restartBtn"),
    setupBtn: $("setupBtn"),
    againBtn: $("againBtn"),
    leftBtn: $("leftBtn"),
    rightBtn: $("rightBtn"),
    jumpBtn: $("jumpBtn"),
    dashBtn: $("dashBtn"),
    questionMeta: $("questionMeta"),
    questionReward: $("questionReward"),
    questionPrompt: $("questionPrompt"),
    stimulusRow: $("stimulusRow"),
    choices: $("choices"),
    feedback: $("feedback"),
    endTitle: $("endTitle"),
    endGrid: $("endGrid"),
    studyTargets: $("studyTargets")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const qaMode = new URLSearchParams(location.search).get("qa");
  const assetPaths = {
    background: "../../assets/archive-quest/background.png",
    tiles: "../../assets/archive-quest/tiles.png",
    hero: "../../assets/archive-quest/hero.png",
    enemies: "../../assets/archive-quest/enemies-items.png"
  };

  const levels = [
    { name: "Polis Archive", short: "Polis", tint: "rgba(106,238,255,.14)", goal: "Launch from the archive gate.", speed: 1 },
    { name: "Revolution Rooftops", short: "Reform", tint: "rgba(255,106,169,.13)", goal: "Cross the debate skyline.", speed: 1.08 },
    { name: "Rights Bridge", short: "Rights", tint: "rgba(255,208,91,.13)", goal: "Secure the final civic seal.", speed: 1.16 }
  ];

  const rewards = [
    { type: "shield", label: "Civic Shield", time: 9 },
    { type: "quill", label: "Quill Dash", time: 8 },
    { type: "hourglass", label: "Slow Time", time: 8 },
    { type: "crown", label: "Mastery Crown", time: 10 }
  ];

  const images = {};
  const keys = {};
  const input = { left: false, right: false, dash: false };
  const pointerInput = new Map();

  const player = {
    x: 120,
    y: 520,
    w: 72,
    h: 118,
    vx: 0,
    vy: 0,
    onGround: false,
    coyote: 0,
    jumpBuffer: 0,
    airJumps: 1,
    maxAirJumps: 1,
    dashCooldown: 0,
    invuln: 0,
    spawnX: 120,
    spawnY: 520,
    facing: 1,
    frame: 0
  };

  const state = {
    stage: { scale: 1, ox: 0, oy: 0, width: BASE_W, height: BASE_H },
    mode: "setup",
    bank: null,
    filtered: [],
    queue: [],
    assetsReady: false,
    last: 0,
    elapsed: 0,
    cameraX: 0,
    cameraY: 0,
    levelIndex: 0,
    level: null,
    score: 0,
    evidence: 0,
    health: 3,
    answered: 0,
    correct: 0,
    streak: 0,
    misses: [],
    comboToast: [],
    particles: [],
    floating: [],
    power: null,
    pending: null,
    questionLock: false,
    sound: true,
    best: Number(localStorage.getItem(`${STORAGE_KEY}:best`) || 0)
  };

  class AudioBus {
    constructor() {
      this.ctx = null;
    }
    ensure() {
      if (!state.sound) return null;
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }
    tone(freq, duration = .08, type = "sine", gain = .025, delay = 0) {
      const audio = this.ensure();
      if (!audio) return;
      const start = audio.currentTime + delay;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      amp.gain.setValueAtTime(.0001, start);
      amp.gain.exponentialRampToValueAtTime(gain, start + .012);
      amp.gain.exponentialRampToValueAtTime(.0001, start + duration);
      osc.connect(amp).connect(audio.destination);
      osc.start(start);
      osc.stop(start + duration + .04);
    }
    jump() { this.tone(520, .08, "triangle", .022); this.tone(820, .08, "sine", .015, .04); }
    dash() { this.tone(260, .06, "sawtooth", .018); this.tone(920, .12, "triangle", .018, .04); }
    pickup() { this.tone(780, .06, "triangle", .026); this.tone(1180, .08, "sine", .018, .05); }
    correct() { this.tone(620, .08, "triangle", .034); this.tone(930, .1, "triangle", .026, .08); this.tone(1240, .12, "sine", .02, .16); }
    wrong() { this.tone(210, .16, "sawtooth", .03); this.tone(130, .18, "sawtooth", .02, .11); }
    hurt() { this.tone(150, .13, "sawtooth", .032); }
    level() { this.tone(440, .08, "sine", .024); this.tone(660, .1, "sine", .024, .09); this.tone(990, .16, "triangle", .024, .18); }
  }
  const audio = new AudioBus();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function cleanText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .replace(/\bcon\s+icts\b/gi, "conflicts")
      .replace(/\bu\.s\.\b/gi, "U.S.")
      .replace(/\bnys\b/gi, "NYS")
      .trim();
  }

  function displayPrompt(q) {
    const raw = cleanText(q?.prompt || q?.stem || "");
    const cleaned = raw
      .replace(/^final\s+clue(?:\s+for\s+[^:]+)?:\s*/i, "")
      .replace(/^name\s+this\s+content\s+item:\s*/i, "")
      .replace(/^this\s+is\s+his\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+her\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+/i, "Identify: ")
      .replace(/^these\s+are\s+/i, "Identify: ")
      .trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "Choose the best answer.";
  }

  function displayExplanation(q) {
    const explanation = cleanText(q?.explanation || "");
    if (explanation) return explanation;
    if (q?.answer) return `Correct answer: ${cleanText(q.answer)}.`;
    return "Review this item again before the next run.";
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function formatNumber(value) {
    return Math.max(0, Math.floor(value)).toLocaleString();
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function chromaKey(img) {
    if (!img) return null;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const pixels = g.getImageData(0, 0, c.width, c.height);
    const data = pixels.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], gr = data[i + 1], b = data[i + 2];
      if (gr > 145 && gr > r * 1.45 && gr > b * 1.45) {
        data[i + 3] = 0;
      } else if (gr > 115 && gr > r * 1.25 && gr > b * 1.25) {
        data[i + 3] = Math.min(data[i + 3], 80);
        data[i + 1] = Math.min(data[i + 1], 120);
      }
    }
    g.putImageData(pixels, 0, 0);
    return c;
  }

  async function loadAssets() {
    const [background, tiles, hero, enemies] = await Promise.all([
      loadImage(assetPaths.background),
      loadImage(assetPaths.tiles),
      loadImage(assetPaths.hero),
      loadImage(assetPaths.enemies)
    ]);
    images.background = background;
    images.tiles = chromaKey(tiles);
    images.hero = chromaKey(hero);
    images.enemies = chromaKey(enemies);
    state.assetsReady = true;
  }

  const sourcePromptRe = /(\bthis\s+(amendment|document|letter|speech|excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\b(shown|pictured|illustrated|above|below|accompanying)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\b|\bbased\s+on\s+(the|this)\b)/i;

  function stimulusImagesFor(q) {
    if (!q) return [];
    const list = Array.isArray(q.stimulusImages) ? q.stimulusImages : [];
    const imagesList = list.length ? list : (q.stimulusImage ? [{ src: q.stimulusImage, label: "Source stimulus" }] : []);
    if (!imagesList.length) return [];
    if (q.stimulusRequired === true || q.stimulusImage || q.stimulusText || q.stimulusHtml || typeof q.stimulus === "string") return imagesList.filter((image) => image && image.src);
    if (q.stimulusRequired === false) return [];
    return sourcePromptRe.test(String(q.prompt || q.stem || "")) ? imagesList.filter((image) => image && image.src) : [];
  }

  function isPlayableQuestion(q) {
    if (!q || !q.prompt || !q.answer) return false;
    if (q.type !== "mcq") return true;
    if (stimulusImagesFor(q).length || q.stimulus || q.stimulusText || q.stimulusHtml) return true;
    return !sourcePromptRe.test(String(q.prompt || q.stem || ""));
  }

  async function loadBank() {
    els.startBtn.disabled = true;
    els.startBtn.textContent = "Loading...";
    const response = await fetch("../../data/chrono-defense-bank.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Question bank failed: ${response.status}`);
    state.bank = await response.json();
    state.bank.questions = (state.bank.questions || []).filter(isPlayableQuestion);
    rebuildSetIndex();
    populateFilters();
    applyFilters();
  }

  function rebuildSetIndex() {
    const setsByCourse = {};
    for (const q of state.bank.questions) {
      if (!q.course || !q.set) continue;
      if (!setsByCourse[q.course]) setsByCourse[q.course] = new Set();
      setsByCourse[q.course].add(q.set);
    }
    state.bank.courses = Object.keys(setsByCourse).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    state.bank.setsByCourse = Object.fromEntries(Object.entries(setsByCourse).map(([course, sets]) => [
      course,
      [...sets].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    ]));
  }

  function populateFilters() {
    els.courseFilter.innerHTML = ["All Courses", ...state.bank.courses]
      .map((course) => `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`)
      .join("");
    els.levelFilter.innerHTML = levels
      .map((level, index) => `<option value="${index}">${escapeHtml(level.name)}</option>`)
      .join("");
    populateSets();
  }

  function populateSets() {
    const course = els.courseFilter.value || "All Courses";
    const sets = course === "All Courses" ? ["All Sets"] : ["All Sets", ...(state.bank.setsByCourse[course] || [])];
    els.setFilter.innerHTML = sets
      .map((set) => `<option value="${escapeHtml(set)}">${escapeHtml(set)}</option>`)
      .join("");
  }

  function applyFilters() {
    const course = els.courseFilter.value || "All Courses";
    const set = els.setFilter.value || "All Sets";
    state.filtered = state.bank.questions.filter((q) => {
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && q.set !== set) return false;
      return true;
    });
    if (!state.filtered.length) state.filtered = [...state.bank.questions];
    state.queue = shuffle(state.filtered);
    renderSetupMetrics();
  }

  function renderSetupMetrics() {
    const mcq = state.filtered.filter((q) => q.type === "mcq").length;
    const stimulus = state.filtered.filter((q) => stimulusImagesFor(q).length).length;
    els.setupMetrics.innerHTML = [
      [`${formatNumber(state.filtered.length)}`, "review prompts"],
      [`${formatNumber(mcq)}`, "MCQs"],
      [`${formatNumber(stimulus)}`, "source items"],
      [`${formatNumber(state.best)}`, "best score"]
    ].map(([strong, span]) => `<div class="metric"><strong>${strong}</strong><span>${span}</span></div>`).join("");
  }

  function nextQuestion() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    return state.queue.pop() || state.filtered[Math.floor(Math.random() * state.filtered.length)];
  }

  function buildChoices(q) {
    const answer = cleanText(q.answer);
    let choices = [];
    if (q.type === "mcq" && Array.isArray(q.choices) && q.choices.length) {
      const correctLabel = String(q.correct || "");
      const correct = q.choices.find((choice) => String(choice.label) === correctLabel)?.text || answer;
      const distractors = q.choices
        .map((choice) => cleanText(choice.text))
        .filter((text) => text && normalize(text) !== normalize(correct));
      choices = [{ text: cleanText(correct), correct: true }]
        .concat(shuffle(distractors).slice(0, 3).map((text) => ({ text, correct: false })));
    } else {
      const sameSet = state.filtered
        .filter((item) => item.id !== q.id && item.answer)
        .filter((item) => item.set === q.set || item.course === q.course)
        .map((item) => cleanText(item.answer))
        .filter((text) => text && normalize(text) !== normalize(answer) && cleanDistractor(text));
      const fallback = state.bank.questions
        .filter((item) => item.id !== q.id && item.answer)
        .map((item) => cleanText(item.answer))
        .filter((text) => text && normalize(text) !== normalize(answer) && cleanDistractor(text));
      const unique = [...new Map(shuffle(sameSet.concat(fallback)).map((text) => [normalize(text), text])).values()];
      choices = [{ text: answer, correct: true }]
        .concat(unique.slice(0, 3).map((text) => ({ text, correct: false })));
    }
    while (choices.length < 4) {
      choices.push({ text: ["Federalism", "Imperialism", "Industrialization", "Civic participation"][choices.length] || "Review term", correct: false });
    }
    return shuffle(choices.slice(0, 4));
  }

  function cleanDistractor(text) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (text.length > 76 || words.length > 8) return false;
    if (/^(he|she|they|it|this|these)\s+(is|are|was|were|shows|uses)\b/i.test(text)) return false;
    return true;
  }

  function buildLevel(index) {
    const meta = levels[index];
    const width = 6600 + index * 420;
    const platforms = [];
    for (let x = -120; x < width + 300; x += 360) {
      if ((x > 850 && x < 1160) || (x > 2520 && x < 2860) || (x > 4440 && x < 4800)) continue;
      platforms.push({ x, y: 780, w: 380, h: 90, tile: 0 });
    }
    const ledges = [
      [520, 610, 260, 42], [900, 515, 320, 44], [1350, 650, 270, 44],
      [1780, 560, 340, 44], [2220, 470, 260, 44], [2870, 630, 420, 48],
      [3500, 545, 280, 44], [3880, 455, 320, 44], [4240, 620, 270, 44],
      [4860, 570, 340, 44], [5320, 475, 300, 44], [5850, 640, 360, 48]
    ];
    ledges.forEach((p, i) => platforms.push({ x: p[0] + index * (i % 3) * 16, y: p[1] - index * 8, w: p[2], h: p[3], tile: i % 3 === 0 ? 1 : 2 }));
    const orbs = [];
    platforms.filter((p) => p.y < 760).forEach((p, i) => {
      if (i % 2 === 0) orbs.push({ x: p.x + p.w * .42, y: p.y - 64, taken: false, sprite: 8 + (i % 3) });
    });
    for (let x = 420; x < width - 500; x += 520) {
      orbs.push({ x, y: 690 - ((x / 260) % 3) * 44, taken: false, sprite: 8 + Math.floor(x / 520) % 3 });
    }
    const enemies = [
      enemy(1120, 458, "bat", 0, 1080, 1260),
      enemy(2020, 500, "crawler", 1, 1820, 2120),
      enemy(3180, 570, "sentinel", 4, 2920, 3320),
      enemy(4140, 400, "drone", 3, 3850, 4210),
      enemy(5100, 510, "mask", 5, 4860, 5300)
    ].map((e) => ({ ...e, speed: e.speed * meta.speed }));
    const spikes = [
      { x: 1000, y: 736, w: 170, h: 50 },
      { x: 2620, y: 736, w: 190, h: 50 },
      { x: 4530, y: 736, w: 200, h: 50 }
    ];
    const springs = [
      { x: 1280, y: 714, w: 100, h: 56 },
      { x: 3420, y: 714, w: 100, h: 56 },
      { x: 5680, y: 714, w: 100, h: 56 }
    ];
    const gates = [
      { x: 1580, y: 608, w: 105, h: 168, open: false, reward: rewards[index % rewards.length] },
      { x: 3650, y: 438, w: 105, h: 168, open: false, reward: rewards[(index + 1) % rewards.length] },
      { x: width - 710, y: 608, w: 120, h: 172, open: false, reward: rewards[(index + 3) % rewards.length], final: true }
    ];
    const relics = [
      { x: 730, y: 540, w: 66, h: 66, taken: false, reward: rewards[(index + 2) % rewards.length], sprite: 9 },
      { x: 2280, y: 390, w: 66, h: 66, taken: false, reward: rewards[(index + 1) % rewards.length], sprite: 13 },
      { x: 5350, y: 390, w: 70, h: 70, taken: false, reward: rewards[index % rewards.length], sprite: 10 }
    ];
    return { ...meta, index, width, platforms, orbs, enemies, spikes, springs, gates, relics, finish: { x: width - 220, y: 595, w: 120, h: 180 } };
  }

  function enemy(x, y, type, sprite, minX, maxX) {
    const sizes = { bat: [78, 62], crawler: [90, 70], sentinel: [84, 118], drone: [84, 70], mask: [76, 80] };
    const [w, h] = sizes[type] || [80, 80];
    return { x, y, w, h, type, sprite, minX, maxX, dir: Math.random() > .5 ? 1 : -1, speed: type === "sentinel" ? 62 : 88, dead: false, bob: Math.random() * 5 };
  }

  function startRun() {
    state.mode = "running";
    state.levelIndex = Number(els.levelFilter.value || 0);
    state.score = 0;
    state.evidence = 0;
    state.health = 3;
    state.answered = 0;
    state.correct = 0;
    state.streak = 0;
    state.misses = [];
    state.power = null;
    state.particles = [];
    state.floating = [];
    state.queue = shuffle(state.filtered);
    loadLevel(state.levelIndex);
    showOnly();
    audio.level();
    if (qaMode === "question") setTimeout(() => openQuestion({ reward: rewards[0] }), 450);
    window.MrMacsAnalytics?.track("game_play", { gameId: "archive-quest", title: "Archive Quest" }, { counter: "game-plays" });
  }

  function loadLevel(index) {
    state.levelIndex = clamp(index, 0, levels.length - 1);
    state.level = buildLevel(state.levelIndex);
    player.x = 120;
    player.y = 520;
    player.vx = 0;
    player.vy = 0;
    player.airJumps = player.maxAirJumps;
    player.spawnX = 120;
    player.spawnY = 520;
    state.cameraX = 0;
    state.cameraY = 0;
    addFloat(levels[state.levelIndex].goal, 180, 430, "#ffd05b");
    updateHud();
  }

  function showOnly(screen = null) {
    els.setupScreen.classList.toggle("show", screen === "setup");
    els.questionScreen.classList.toggle("show", screen === "question");
    els.pauseScreen.classList.toggle("show", screen === "pause");
    els.endScreen.classList.toggle("show", screen === "end");
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function playerRect() {
    return { x: player.x - player.w / 2, y: player.y - player.h, w: player.w, h: player.h };
  }

  function damage(amount = 1) {
    if (player.invuln > 0) return;
    if (state.power?.type === "shield") {
      state.power.time = Math.max(0, state.power.time - 2.4);
      player.invuln = 1.1;
      burst(player.x, player.y - 60, "#75f2a8", 18);
      audio.pickup();
      return;
    }
    state.health = Math.max(0, state.health - amount);
    player.invuln = 1.5;
    player.vx = -player.facing * 360;
    player.vy = -430;
    burst(player.x, player.y - 55, "#ff6aa9", 22);
    audio.hurt();
    updateHud();
    if (state.health <= 0) finishRun(false);
  }

  function respawn() {
    player.x = player.spawnX;
    player.y = player.spawnY;
    player.vx = 0;
    player.vy = 0;
    player.airJumps = player.maxAirJumps;
    damage(1);
  }

  function grantPower(reward) {
    if (!reward) return;
    state.power = { ...reward, total: reward.time };
    addFloat(reward.label, player.x, player.y - 150, "#75f2a8");
    burst(player.x, player.y - 84, "#ffd05b", 34);
    updateHud();
  }

  function openQuestion(pending) {
    if (state.mode !== "running" || state.questionLock) return;
    state.mode = "question";
    state.pending = { ...pending, q: nextQuestion(), choices: [] };
    state.pending.choices = buildChoices(state.pending.q);
    state.questionLock = false;
    renderQuestion();
    showOnly("question");
  }

  function renderQuestion() {
    const { q, reward } = state.pending;
    els.questionMeta.textContent = cleanText(`${q.course || "Social Studies"} | ${q.set || q.subject || "Review"}`);
    els.questionReward.textContent = reward ? `${reward.label} locked` : "Review gate";
    els.questionPrompt.textContent = displayPrompt(q);
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.choices.innerHTML = state.pending.choices.map((choice, index) => (
      `<button class="choice-btn" type="button" data-choice="${index}"><strong>Choice ${index + 1}</strong>${escapeHtml(choice.text)}</button>`
    )).join("");
    els.choices.querySelectorAll(".choice-btn").forEach((button) => {
      button.addEventListener("click", () => answerQuestion(Number(button.dataset.choice), button));
    });
    const imgs = stimulusImagesFor(q);
    els.stimulusRow.classList.toggle("show", imgs.length > 0);
    els.stimulusRow.innerHTML = imgs.slice(0, 3).map((img, index) => (
      `<a href="${escapeHtml(img.src)}" target="_blank" rel="noopener"><img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.label || `Stimulus ${index + 1}`)}"><span>${escapeHtml(img.label || `Stimulus ${index + 1}`)}</span></a>`
    )).join("");
  }

  function answerQuestion(index, button) {
    if (!state.pending || state.questionLock) return;
    state.questionLock = true;
    const choice = state.pending.choices[index];
    const correct = Boolean(choice?.correct);
    state.answered += 1;
    if (correct) {
      state.correct += 1;
      state.streak += 1;
      state.score += 450 + state.streak * 65;
      grantPower(state.pending.reward);
      els.feedback.textContent = `${state.pending.reward ? state.pending.reward.label + " unlocked. " : ""}${displayExplanation(state.pending.q)}`;
      els.feedback.className = "feedback good";
      audio.correct();
    } else {
      state.streak = 0;
      state.misses.push(state.pending.q);
      els.feedback.textContent = `Correct answer: ${state.pending.choices.find((c) => c.correct)?.text || state.pending.q.answer}. ${displayExplanation(state.pending.q)}`;
      els.feedback.className = "feedback bad";
      damage(1);
      audio.wrong();
      if (state.mode === "end") return;
    }
    [...els.choices.children].forEach((child, i) => {
      child.disabled = true;
      if (state.pending.choices[i].correct) child.classList.add("correct");
    });
    if (!correct && button) button.classList.add("wrong");
    if (state.pending.gate) state.pending.gate.open = true;
    if (state.pending.relic) state.pending.relic.taken = true;
    updateHud();
    setTimeout(() => {
      if (state.mode === "end") return;
      state.mode = "running";
      state.pending = null;
      state.questionLock = false;
      showOnly();
    }, correct ? 1550 : 2450);
  }

  function update(dt) {
    if (state.mode !== "running" || !state.level) return;
    state.elapsed += dt;
    if (state.power) {
      state.power.time -= dt;
      if (state.power.time <= 0) state.power = null;
    }
    player.invuln = Math.max(0, player.invuln - dt);
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.onGround ? .12 : Math.max(0, player.coyote - dt);

    const moveLeft = input.left || keys.ArrowLeft || keys.KeyA;
    const moveRight = input.right || keys.ArrowRight || keys.KeyD;
    if (moveLeft) { player.vx -= 2500 * dt; player.facing = -1; }
    if (moveRight) { player.vx += 2500 * dt; player.facing = 1; }
    if (!moveLeft && !moveRight && player.onGround) player.vx *= Math.pow(.0008, dt);
    const speedBoost = state.power?.type === "quill" ? 1.42 : 1;
    const maxSpeed = 390 * speedBoost;
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
    if ((input.dash || keys.ShiftLeft || keys.ShiftRight) && player.dashCooldown <= 0) {
      player.vx = player.facing * 760 * speedBoost;
      player.dashCooldown = .72;
      burst(player.x - player.facing * 22, player.y - 64, "#6beeff", 18);
      audio.dash();
    }
    if (player.jumpBuffer > 0 && (player.onGround || player.coyote > 0)) {
      player.vy = -820;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.airJumps = player.maxAirJumps;
      audio.jump();
      dust(player.x, player.y, 12);
    } else if (player.jumpBuffer > 0 && player.airJumps > 0) {
      player.vy = -760;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.airJumps -= 1;
      audio.jump();
      burst(player.x, player.y - 72, "#6beeff", 18);
    }
    const gravity = state.power?.type === "hourglass" ? 1950 : 2250;
    player.vy = clamp(player.vy + gravity * dt, -1200, 1120);
    moveAndCollide(dt);
    if (state.mode !== "running") {
      updateCamera(dt);
      return;
    }
    updateObjects(dt);
    updateCamera(dt);
    updateFx(dt);
    updateHud();
  }

  function moveAndCollide(dt) {
    const level = state.level;
    player.x += player.vx * dt;
    let pr = playerRect();
    for (const p of level.platforms) {
      if (!rectsOverlap(pr, p)) continue;
      if (player.vx > 0) player.x = p.x - player.w / 2;
      else if (player.vx < 0) player.x = p.x + p.w + player.w / 2;
      player.vx = 0;
      pr = playerRect();
    }
    for (const gate of level.gates) {
      if (gate.open) continue;
      if (!rectsOverlap(pr, gate)) continue;
      player.x = player.x < gate.x ? gate.x - player.w / 2 : gate.x + gate.w + player.w / 2;
      player.vx = 0;
      openQuestion({ gate, reward: gate.reward });
    }
    player.y += player.vy * dt;
    pr = playerRect();
    player.onGround = false;
    for (const p of level.platforms) {
      if (!rectsOverlap(pr, p)) continue;
      if (player.vy > 0) {
        player.y = p.y;
        player.vy = 0;
        player.onGround = true;
        player.airJumps = player.maxAirJumps;
      } else if (player.vy < 0) {
        player.y = p.y + p.h + player.h;
        player.vy = 20;
      }
      pr = playerRect();
    }
    player.x = clamp(player.x, 40, level.width - 40);
    if (player.y > 1100) respawn();
  }

  function updateObjects(dt) {
    const level = state.level;
    const pr = playerRect();
    for (const orb of level.orbs) {
      if (orb.taken || !rectsOverlap(pr, { x: orb.x - 26, y: orb.y - 26, w: 52, h: 52 })) continue;
      orb.taken = true;
      state.evidence += 1;
      state.score += state.power?.type === "crown" ? 210 : 105;
      burst(orb.x, orb.y, "#6beeff", 12);
      audio.pickup();
    }
    for (const relic of level.relics) {
      if (relic.taken || !rectsOverlap(pr, relic)) continue;
      openQuestion({ relic, reward: relic.reward });
    }
    for (const spring of level.springs) {
      if (!rectsOverlap(pr, spring) || player.vy < 0) continue;
      player.y = spring.y;
      player.vy = -1080;
      player.airJumps = player.maxAirJumps;
      burst(spring.x + spring.w / 2, spring.y, "#ffd05b", 16);
      audio.jump();
    }
    for (const spike of level.spikes) {
      if (rectsOverlap(pr, spike)) damage(1);
    }
    for (const e of level.enemies) {
      if (e.dead) continue;
      const pace = state.power?.type === "hourglass" ? .42 : 1;
      e.x += e.dir * e.speed * pace * dt;
      e.bob += dt * 5;
      if (e.x < e.minX || e.x > e.maxX) e.dir *= -1;
      const er = { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h };
      if (!rectsOverlap(pr, er)) continue;
      if (player.vy > 160 && pr.y + pr.h - er.y < 45) {
        e.dead = true;
        player.vy = -560;
        state.score += 180;
        burst(e.x, e.y - e.h / 2, "#ff6aa9", 24);
        audio.pickup();
      } else {
        damage(1);
      }
    }
    if (rectsOverlap(pr, level.finish)) {
      if (state.levelIndex < levels.length - 1) {
        state.score += 900;
        loadLevel(state.levelIndex + 1);
        audio.level();
      } else {
        finishRun(true);
      }
    }
  }

  function updateCamera(dt) {
    const viewW = state.stage.viewW || BASE_W;
    const viewH = state.stage.viewH || BASE_H;
    const targetX = clamp(player.x - viewW * .34, 0, Math.max(0, state.level.width - viewW));
    const targetY = clamp(player.y - viewH * .66, -80, 120);
    state.cameraX = lerp(state.cameraX, targetX, 1 - Math.pow(.002, dt));
    state.cameraY = lerp(state.cameraY, targetY, 1 - Math.pow(.008, dt));
  }

  function updateFx(dt) {
    state.particles = state.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      return p.life > 0;
    });
    state.floating = state.floating.filter((f) => {
      f.life -= dt;
      f.y -= 34 * dt;
      return f.life > 0;
    });
  }

  function finishRun(won) {
    state.mode = "end";
    state.best = Math.max(state.best, state.score);
    localStorage.setItem(`${STORAGE_KEY}:best`, String(state.best));
    renderEnd(won);
    showOnly("end");
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "archive-quest",
      title: "Archive Quest",
      score: Math.floor(state.score),
      accuracy: state.answered ? Math.round(state.correct / state.answered * 100) : 0,
      questions: state.answered
    }, { counter: "game-completions" });
  }

  function renderEnd(won) {
    const accuracy = state.answered ? Math.round(state.correct / state.answered * 100) : 0;
    els.endTitle.textContent = won ? "Archive secured" : "Quest ended";
    els.endGrid.innerHTML = [
      [`${formatNumber(state.score)}`, "score"],
      [`${accuracy}%`, "question accuracy"],
      [`${state.correct}/${state.answered}`, "review gates"],
      [`${formatNumber(state.evidence)}`, "evidence found"]
    ].map(([strong, span]) => `<div class="metric"><strong>${strong}</strong><span>${span}</span></div>`).join("");
    const targets = topMissedTargets();
    els.studyTargets.innerHTML = targets.length
      ? targets.map(([label, count]) => `<div class="study-card"><strong>${escapeHtml(label)}</strong><span>${count} miss${count === 1 ? "" : "es"} in this quest</span></div>`).join("")
      : `<div class="study-card"><strong>Clean run</strong><span>No major weak topic surfaced.</span></div>`;
  }

  function topMissedTargets() {
    const counts = {};
    state.misses.forEach((q) => {
      [q.set, ...(q.tags || []).slice(0, 2)].filter(Boolean).forEach((tag) => counts[tag] = (counts[tag] || 0) + 1);
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }

  function updateHud() {
    els.score.textContent = formatNumber(state.score);
    els.levelName.textContent = levels[state.levelIndex]?.short || "Quest";
    els.health.textContent = String(state.health);
    els.evidence.textContent = String(state.evidence);
    if (state.power) {
      els.powerLabel.textContent = state.power.label;
      els.powerFill.style.width = `${clamp(state.power.time / state.power.total * 100, 0, 100)}%`;
    } else {
      els.powerLabel.textContent = "No powerup";
      els.powerFill.style.width = "0%";
    }
  }

  function burst(x, y, color, count) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 100 + Math.random() * 260;
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: .45 + Math.random() * .55, color, size: 3 + Math.random() * 5 });
    }
  }

  function dust(x, y, count) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      state.particles.push({ x: x + (Math.random() - .5) * 50, y: y - 12, vx: (Math.random() - .5) * 150, vy: -60 - Math.random() * 60, life: .25 + Math.random() * .22, color: "rgba(255,231,184,.7)", size: 4 + Math.random() * 7 });
    }
  }

  function addFloat(text, x, y, color = "#fff8ec") {
    state.floating.push({ text, x, y, color, life: 2.2 });
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    els.canvas.width = Math.max(1, Math.floor(width * dpr));
    els.canvas.height = Math.max(1, Math.floor(height * dpr));
    els.canvas.style.width = `${width}px`;
    els.canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scale = Math.max(width / BASE_W, height / BASE_H);
    state.stage = { scale, ox: 0, oy: 0, width, height, viewW: width / scale, viewH: height / scale };
  }

  function screenToWorld(x, y) {
    return {
      x: (x - state.stage.ox) / state.stage.scale + state.cameraX,
      y: (y - state.stage.oy) / state.stage.scale + state.cameraY
    };
  }

  function render() {
    const s = state.stage;
    ctx.clearRect(0, 0, s.width, s.height);
    ctx.save();
    ctx.translate(s.ox, s.oy);
    ctx.scale(s.scale, s.scale);
    drawWorld();
    ctx.restore();
  }

  function drawWorld() {
    drawBackground();
    if (!state.level) {
      drawLoadingScene();
      return;
    }
    ctx.save();
    ctx.translate(-state.cameraX, -state.cameraY);
    drawLevel();
    drawPlayer();
    drawParticles();
    drawFloating();
    ctx.restore();
  }

  function drawBackground() {
    const bg = images.background;
    const level = state.level || levels[0];
    ctx.fillStyle = "#07101c";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    if (bg) {
      const parallax = state.cameraX * .18;
      const h = BASE_H;
      const tileW = BASE_W * 1.08;
      const offset = -((parallax % tileW + tileW) % tileW);
      for (let x = offset - tileW; x < BASE_W + tileW; x += tileW) {
        ctx.drawImage(bg, x, 0, tileW, h);
      }
    }
    ctx.fillStyle = level.tint || "rgba(106,238,255,.12)";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.fillStyle = "rgba(5,10,20,.30)";
    ctx.fillRect(0, 730, BASE_W, 170);
  }

  function drawLoadingScene() {
    ctx.fillStyle = "#fff8ec";
    ctx.font = "900 42px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.assetsReady ? "Archive ready" : "Loading archive...", BASE_W / 2, BASE_H / 2);
  }

  function drawLevel() {
    const level = state.level;
    level.platforms.forEach(drawPlatform);
    level.spikes.forEach((spike) => drawTile(14, spike.x, spike.y - 28, spike.w, spike.h + 30));
    level.springs.forEach((spring) => drawTile(5, spring.x, spring.y - 34, spring.w, spring.h + 34));
    level.orbs.forEach((orb) => {
      if (!orb.taken) drawTile(orb.sprite, orb.x - 28, orb.y - 28 + Math.sin(state.elapsed * 4 + orb.x) * 4, 56, 56);
    });
    level.relics.forEach((relic) => {
      if (!relic.taken) drawTile(relic.sprite, relic.x, relic.y + Math.sin(state.elapsed * 3 + relic.x) * 5, relic.w, relic.h);
    });
    level.gates.forEach((gate) => {
      if (!gate.open) drawTile(gate.final ? 7 : 6, gate.x, gate.y, gate.w, gate.h);
      else drawPortalGlow(gate.x + gate.w / 2, gate.y + gate.h / 2, gate.w * .8, "#75f2a8");
    });
    drawPortalGlow(level.finish.x + level.finish.w / 2, level.finish.y + level.finish.h / 2, 120, "#ffd05b");
    drawTile(6, level.finish.x - 10, level.finish.y - 12, level.finish.w + 20, level.finish.h + 20);
    level.enemies.forEach(drawEnemy);
  }

  function drawPlatform(p) {
    const tileIndex = p.tile || 1;
    const chunks = Math.max(1, Math.ceil(p.w / 240));
    for (let i = 0; i < chunks; i++) {
      const x = p.x + i * (p.w / chunks);
      const w = p.w / chunks + 2;
      drawTile(tileIndex, x, p.y, w, p.h);
    }
  }

  function drawPortalGlow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(.45, color.replace(")", ",.38)").replace("rgb", "rgba"));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTile(index, x, y, w, h) {
    if (!images.tiles) {
      ctx.fillStyle = index === 14 ? "#d14365" : "#bda77a";
      ctx.fillRect(x, y, w, h);
      return;
    }
    drawSprite(images.tiles, 4, 4, index, x, y, w, h);
  }

  function drawEnemy(e) {
    if (e.dead) return;
    const y = e.y + (e.type === "bat" || e.type === "drone" ? Math.sin(e.bob) * 8 : 0);
    drawSprite(images.enemies, 4, 3, e.sprite, e.x - e.w / 2, y - e.h, e.w, e.h, e.dir < 0);
  }

  function drawPlayer() {
    const flicker = player.invuln > 0 && Math.floor(state.elapsed * 18) % 2 === 0;
    if (flicker) return;
    let frame = 0;
    if (!player.onGround && player.vy < -80) frame = 4;
    else if (!player.onGround) frame = 5;
    else if (Math.abs(player.vx) > 40) frame = 1 + Math.floor(state.elapsed * 12) % 3;
    if (state.power?.type === "crown") frame = 10;
    drawSprite(images.hero, 4, 3, frame, player.x - 92, player.y - 142, 184, 150, player.facing < 0);
    if (state.power?.type === "shield") {
      ctx.strokeStyle = "rgba(117,242,168,.72)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(player.x, player.y - 70, 64, 80, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawSprite(sheet, cols, rows, index, x, y, w, h, flip = false) {
    if (!sheet) {
      ctx.fillStyle = "#ffd05b";
      ctx.fillRect(x, y, w, h);
      return;
    }
    const sw = sheet.width / cols;
    const sh = sheet.height / rows;
    const sx = (index % cols) * sw;
    const sy = Math.floor(index / cols) * sh;
    ctx.save();
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, sx, sy, sw, sh, 0, 0, w, h);
    } else {
      ctx.drawImage(sheet, sx, sy, sw, sh, x, y, w, h);
    }
    ctx.restore();
  }

  function drawParticles() {
    state.particles.forEach((p) => {
      ctx.globalAlpha = clamp(p.life * 2, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawFloating() {
    ctx.textAlign = "center";
    state.floating.forEach((f) => {
      ctx.globalAlpha = clamp(f.life / 1.2, 0, 1);
      ctx.font = "900 30px Inter, sans-serif";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(4,8,18,.82)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    });
  }

  function loop(ts) {
    const now = ts / 1000;
    const dt = Math.min(.033, now - (state.last || now));
    state.last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function setButtonInput(button, key) {
    const set = (value, pointerId = null) => {
      input[key] = value;
      if (pointerId != null) {
        if (value) pointerInput.set(pointerId, key);
        else pointerInput.delete(pointerId);
      }
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      if (key === "jump") {
        queueJump();
        return;
      }
      set(true, event.pointerId);
    });
    button.addEventListener("pointerup", (event) => set(false, event.pointerId));
    button.addEventListener("pointercancel", (event) => set(false, event.pointerId));
    button.addEventListener("pointerleave", (event) => {
      if (pointerInput.get(event.pointerId) === key) set(false, event.pointerId);
    });
    button.addEventListener("click", () => {
      if (state.mode !== "running") return;
      if (key === "jump") {
        return;
      } else if (key === "dash") {
        input.dash = true;
        setTimeout(() => { input.dash = false; }, 110);
      } else {
        input[key] = true;
        player.vx += key === "right" ? 140 : -140;
        setTimeout(() => { input[key] = false; }, 130);
      }
    });
  }

  function wireEvents() {
    addEventListener("resize", resize);
    addEventListener("keydown", (event) => {
      const fresh = !keys[event.code];
      keys[event.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (fresh && ["Space", "ArrowUp", "KeyW"].includes(event.code)) queueJump();
      if (event.code === "Escape") togglePause();
    });
    addEventListener("keyup", (event) => {
      keys[event.code] = false;
    });
    els.courseFilter.addEventListener("change", () => { populateSets(); applyFilters(); });
    els.setFilter.addEventListener("change", applyFilters);
    els.startBtn.addEventListener("click", startRun);
    els.pauseBtn.addEventListener("click", togglePause);
    els.resumeBtn.addEventListener("click", togglePause);
    els.restartBtn.addEventListener("click", startRun);
    els.againBtn.addEventListener("click", startRun);
    els.setupBtn.addEventListener("click", () => { state.mode = "setup"; showOnly("setup"); });
    els.soundBtn.addEventListener("click", () => {
      state.sound = !state.sound;
      els.soundBtn.textContent = state.sound ? "Sound On" : "Sound Off";
    });
    els.fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
    setButtonInput(els.leftBtn, "left");
    setButtonInput(els.rightBtn, "right");
    setButtonInput(els.jumpBtn, "jump");
    setButtonInput(els.dashBtn, "dash");
    els.canvas.addEventListener("pointerdown", (event) => {
      if (state.mode !== "running") return;
      const pos = screenToWorld(event.clientX, event.clientY);
      if (pos.y < player.y - 80) queueJump();
      else if (pos.x < player.x) input.left = true;
      else input.right = true;
    });
    els.canvas.addEventListener("pointerup", () => { input.left = false; input.right = false; });
  }

  function queueJump() {
    if (state.mode !== "running") return;
    player.jumpBuffer = .14;
  }

  function togglePause() {
    if (state.mode === "question" || state.mode === "setup" || state.mode === "end") return;
    if (state.mode === "paused") {
      state.mode = "running";
      showOnly();
    } else {
      state.mode = "paused";
      showOnly("pause");
    }
  }

  async function init() {
    resize();
    wireEvents();
    showOnly("setup");
    render();
    try {
      await Promise.all([loadAssets(), loadBank()]);
      els.startBtn.disabled = false;
      els.startBtn.textContent = "Start Quest";
    } catch (error) {
      console.error(error);
      els.setupMetrics.innerHTML = `<div class="metric"><strong>Offline</strong><span>Question bank did not load.</span></div>`;
      els.startBtn.disabled = true;
    }
    requestAnimationFrame(loop);
  }

  init();
})();
