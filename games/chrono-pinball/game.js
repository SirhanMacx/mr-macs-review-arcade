(() => {
  "use strict";

  const TABLE_W = 900;
  const TABLE_H = 1400;
  const STORAGE_KEY = "mr-macs-chrono-pinball";
  const params = new URLSearchParams(window.location.search);
  const FX_LITE = params.get("fx") === "lite" || window.matchMedia("(max-width: 820px)").matches;
  const MAX_PARTICLES = FX_LITE ? 70 : 170;
  const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;

  const canvas = document.getElementById("pinballCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  const els = {
    score: document.getElementById("score"),
    balls: document.getElementById("balls"),
    multiplier: document.getElementById("multiplier"),
    locks: document.getElementById("locks"),
    pauseBtn: document.getElementById("pauseBtn"),
    exitBtn: document.getElementById("exitBtn"),
    missionPanel: document.getElementById("missionPanel"),
    missionKicker: document.getElementById("missionKicker"),
    missionText: document.getElementById("missionText"),
    missionFeedback: document.getElementById("missionFeedback"),
    leftFlip: document.getElementById("leftFlip"),
    rightFlip: document.getElementById("rightFlip"),
    launchBtn: document.getElementById("launchBtn"),
    setupScreen: document.getElementById("setupScreen"),
    questionScreen: document.getElementById("questionScreen"),
    pauseScreen: document.getElementById("pauseScreen"),
    endScreen: document.getElementById("endScreen"),
    courseFilter: document.getElementById("courseFilter"),
    setFilter: document.getElementById("setFilter"),
    modeFilter: document.getElementById("modeFilter"),
    setupMetrics: document.getElementById("setupMetrics"),
    startBtn: document.getElementById("startBtn"),
    soundBtn: document.getElementById("soundBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    resumeBtn: document.getElementById("resumeBtn"),
    restartBtn: document.getElementById("restartBtn"),
    pauseExitBtn: document.getElementById("pauseExitBtn"),
    setupBtn: document.getElementById("setupBtn"),
    againBtn: document.getElementById("againBtn"),
    questionMeta: document.getElementById("questionMeta"),
    questionPrompt: document.getElementById("questionPrompt"),
    stimulusBox: document.getElementById("stimulusBox"),
    choiceGrid: document.getElementById("choiceGrid"),
    explanation: document.getElementById("explanation"),
    endTitle: document.getElementById("endTitle"),
    endGrid: document.getElementById("endGrid"),
    studyTargets: document.getElementById("studyTargets")
  };

  const table = {
    width: 0,
    height: 0,
    scale: 1,
    ox: 0,
    oy: 0,
    dpr: 1
  };

  const baseTargets = [
    { x: 198, y: 618, w: 86, h: 34, label: "CIV", color: "#75ecff" },
    { x: 304, y: 594, w: 86, h: 34, label: "REV", color: "#f5c451" },
    { x: 410, y: 618, w: 86, h: 34, label: "ERA", color: "#69f3a9" },
    { x: 516, y: 594, w: 86, h: 34, label: "LAW", color: "#ff7bcc" },
    { x: 622, y: 618, w: 86, h: 34, label: "MAP", color: "#a991ff" }
  ];

  const bumpers = [
    { x: 300, y: 385, r: 58, label: "DOC", color: "#75ecff", score: 520 },
    { x: 450, y: 282, r: 60, label: "ERA", color: "#f5c451", score: 620 },
    { x: 600, y: 385, r: 58, label: "REV", color: "#ff7bcc", score: 520 },
    { x: 240, y: 804, r: 44, label: "LAW", color: "#69f3a9", score: 430 },
    { x: 660, y: 804, r: 44, label: "MAP", color: "#a991ff", score: 430 }
  ];

  const lanes = [
    { x: 165, y: 138, w: 104, h: 92, label: "ANCIENT", color: "#75ecff", score: 900 },
    { x: 398, y: 118, w: 104, h: 92, label: "MODERN", color: "#f5c451", score: 950 },
    { x: 631, y: 138, w: 104, h: 92, label: "GLOBAL", color: "#ff7bcc", score: 900 }
  ];

  const walls = [
    [86, 162, 86, 1080],
    [814, 162, 814, 1080],
    [86, 162, 244, 80],
    [656, 80, 814, 162],
    [244, 80, 656, 80],
    [92, 1020, 285, 1172],
    [808, 1020, 615, 1172],
    [92, 1110, 92, 1280],
    [808, 1110, 808, 1280]
  ];

  const state = {
    bank: null,
    filtered: [],
    queue: [],
    mode: "setup",
    running: false,
    pausedFrom: null,
    score: 0,
    ballsLeft: 3,
    multiplier: 1,
    lockProgress: 0,
    combo: 0,
    answered: 0,
    correct: 0,
    bestCombo: 0,
    ballSave: 0,
    missionStreak: 0,
    currentQuestion: null,
    currentChoices: [],
    missed: [],
    balls: [],
    targets: [],
    particles: [],
    sparks: [],
    stars: [],
    floatText: [],
    leftActive: false,
    rightActive: false,
    plungerHeld: false,
    plungerCharge: 0,
    launchHint: 0,
    launchInputAt: 0,
    shake: 0,
    last: 0,
    elapsed: 0,
    feedbackUntil: 0,
    laneCooldown: new Map(),
    pausedAtMode: "playing",
    audioReady: false
  };

  class AudioBus {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    ensure() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }

    tone(freq, dur = .08, type = "sine", gain = .08, bend = 1) {
      const audio = this.ensure();
      if (!audio) return;
      const now = audio.currentTime;
      const osc = audio.createOscillator();
      const vol = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (bend !== 1) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * bend), now + dur);
      vol.gain.setValueAtTime(0.0001, now);
      vol.gain.exponentialRampToValueAtTime(gain, now + .01);
      vol.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(vol).connect(audio.destination);
      osc.start(now);
      osc.stop(now + dur + .03);
    }

    launch() {
      this.tone(130, .18, "sawtooth", .06, 2.6);
      setTimeout(() => this.tone(420, .10, "triangle", .05, 1.28), 80);
    }

    flipper() {
      this.tone(125, .045, "square", .04, 1.55);
    }

    bumper(colorIndex = 0) {
      const freq = [620, 740, 840, 980][colorIndex % 4];
      this.tone(freq, .075, "triangle", .075, 1.35);
      setTimeout(() => this.tone(freq * 1.5, .055, "sine", .045, .82), 35);
    }

    target() {
      this.tone(510, .06, "square", .06, 1.2);
      setTimeout(() => this.tone(780, .07, "triangle", .045, 1.08), 45);
    }

    correct() {
      [440, 554, 659, 880].forEach((freq, i) => {
        setTimeout(() => this.tone(freq, .10, "triangle", .06, 1.08), i * 58);
      });
    }

    wrong() {
      this.tone(210, .16, "sawtooth", .06, .58);
      setTimeout(() => this.tone(150, .12, "triangle", .04, .72), 95);
    }

    drain() {
      this.tone(180, .18, "sawtooth", .065, .42);
    }

    multiball() {
      [360, 540, 720, 960, 1200].forEach((freq, i) => {
        setTimeout(() => this.tone(freq, .085, "triangle", .07, 1.12), i * 46);
      });
    }
  }

  const audio = new AudioBus();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
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

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\bcon\s+icts\b/gi, "conflicts")
      .replace(/\bUnited states\b/g, "United States")
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
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : raw;
  }

  function displayExplanation(q) {
    const explanation = cleanText(q?.explanation || "");
    if (explanation) return explanation;
    if (q?.answer) return `Correct answer: ${cleanText(q.answer)}.`;
    return "Review this item again before the exam.";
  }

  const sourcePromptRe = /(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(documents|statements|headlines|sources|passages|figures|maps|graphs|charts|cartoons)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|similar\s+to\s+this)/i;

  function promptNeedsStimulus(q) {
    return sourcePromptRe.test(String((q && (q.prompt || q.stem)) || ""));
  }

  function stimulusImagesFor(q) {
    if (SourceBank) return SourceBank.stimulusImages(q);
    if (!q) return [];
    const list = Array.isArray(q.stimulusImages) ? q.stimulusImages : [];
    const images = list.length ? list : (q.stimulusImage ? [{ src: q.stimulusImage, label: "Source stimulus" }] : []);
    if (!images.length) return [];
    if (q.stimulusRequired === true || q.stimulusImage || q.stimulusText || q.stimulusHtml || typeof q.stimulus === "string") {
      return images.filter((image) => image && image.src);
    }
    if (q.stimulusRequired === false) return [];
    return promptNeedsStimulus(q) ? images.filter((image) => image && image.src) : [];
  }

  function stimulusTextFor(q) {
    if (!q) return "";
    if (typeof q.stimulusText === "string") return cleanText(q.stimulusText);
    if (typeof q.stimulus === "string") return cleanText(q.stimulus);
    if (typeof q.stimulusHtml === "string") {
      const tmp = document.createElement("div");
      tmp.innerHTML = q.stimulusHtml;
      return cleanText(tmp.textContent || "");
    }
    return "";
  }

  function hasReliableStimulus(q) {
    return Boolean(stimulusTextFor(q) || stimulusImagesFor(q).length);
  }

  function isPlayableQuestion(q) {
    if (!q || !q.answer || !(q.prompt || q.stem)) return false;
    if (SourceBank && !SourceBank.playableSharedPrompt(q)) return false;
    if (SourceBank && SourceBank.sourceBased(q)) {
      if (!hasReliableStimulus(q)) return false;
      if (q.type === "mcq") return SourceBank.usableRegentsQuestion(q);
      return true;
    }
    if (q.type !== "mcq") return true;
    if (hasReliableStimulus(q)) return true;
    return !promptNeedsStimulus(q);
  }

  function resolveStimulusSrc(src) {
    const value = String(src || "").trim();
    if (!value) return "";
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    if (value.startsWith("../../") || value.startsWith("../")) return value;
    if (value.startsWith("assets/")) return `../../${value}`;
    return value;
  }

  async function loadBank() {
    els.startBtn.disabled = true;
    els.startBtn.textContent = "Loading...";
    const response = await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
    if (!response.ok) throw new Error(`Question bank failed: ${response.status}`);
    state.bank = await response.json();
    state.bank.questions = (state.bank.questions || []).filter(isPlayableQuestion);
    rebuildSetIndex();
    populateFilters();
    applyFilters();
    els.startBtn.disabled = false;
    els.startBtn.textContent = "Launch Table";
  }

  function rebuildSetIndex() {
    const setsByCourse = {};
    for (const q of state.bank.questions) {
      if (!q.course || !q.set) continue;
      if (!setsByCourse[q.course]) setsByCourse[q.course] = new Set();
      setsByCourse[q.course].add(q.set);
    }
    state.bank.courses = Object.keys(setsByCourse).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    state.bank.setsByCourse = Object.fromEntries(
      Object.entries(setsByCourse).map(([course, sets]) => [
        course,
        [...sets].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      ])
    );
  }

  function populateFilters() {
    const courses = ["All Courses", ...state.bank.courses];
    els.courseFilter.innerHTML = courses
      .map((course) => `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`)
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
    prepareQueue();
    renderSetupMetrics();
  }

  function renderSetupMetrics() {
    const total = state.filtered.length;
    const mcq = state.filtered.filter((q) => q.type === "mcq").length;
    const sourceBased = state.filtered.filter(hasReliableStimulus).length;
    const best = Number(localStorage.getItem(`${STORAGE_KEY}:bestScore`) || 0);
    els.setupMetrics.innerHTML = [
      `${formatNumber(total)} review prompts loaded`,
      `${formatNumber(mcq)} MCQs`,
      `${formatNumber(sourceBased)} source-based missions`,
      `Best score ${formatNumber(best)}`
    ].map((text) => `<span class="metric-pill">${escapeHtml(text)}</span>`).join("");
  }

  function prepareQueue() {
    state.queue = shuffle(state.filtered);
  }

  function nextQuestion() {
    if (!state.queue.length) prepareQueue();
    return state.queue.pop() || state.filtered[Math.floor(Math.random() * state.filtered.length)];
  }

  function buildChoices(q) {
    const answer = cleanText(q.answer);
    let choices = [];
    if (q.type === "mcq" && Array.isArray(q.choices) && q.choices.length) {
      const correctLabel = String(q.correct || "");
      const correct = q.choices.find((choice) => String(choice.label) === correctLabel)?.text || answer;
      choices = q.choices.map((choice) => ({
        text: cleanText(choice.text),
        correct: normalize(choice.text) === normalize(correct)
      })).filter((choice) => choice.text);
      if (!choices.some((choice) => choice.correct)) choices.unshift({ text: cleanText(correct), correct: true });
    } else {
      const sameSet = state.filtered
        .filter((item) => item.id !== q.id && item.answer)
        .filter((item) => item.set === q.set || item.course === q.course)
        .map((item) => cleanText(item.answer))
        .filter((text) => text && normalize(text) !== normalize(answer));
      const fallback = state.bank.questions
        .filter((item) => item.id !== q.id && item.answer)
        .map((item) => cleanText(item.answer))
        .filter((text) => text && normalize(text) !== normalize(answer));
      const unique = [...new Map(shuffle(sameSet.concat(fallback)).map((text) => [normalize(text), text])).values()];
      choices = [{ text: answer, correct: true }]
        .concat(unique.slice(0, 3).map((text) => ({ text, correct: false })));
    }
    while (choices.length < 4) {
      const fallback = ["Constitutionalism", "Industrialization", "Sovereignty", "Nationalism"][choices.length] || "Review term";
      choices.push({ text: fallback, correct: false });
    }
    const deduped = [...new Map(choices.map((choice) => [normalize(choice.text), choice])).values()];
    if (!deduped.some((choice) => choice.correct)) deduped.unshift({ text: answer, correct: true });
    return shuffle(deduped).slice(0, 4);
  }

  function initStars() {
    state.stars = Array.from({ length: FX_LITE ? 110 : 190 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: .25 + Math.random() * .9,
      hue: Math.random() > .72 ? "#f5c451" : (Math.random() > .5 ? "#75ecff" : "#ffffff")
    }));
  }

  function resize() {
    const dprLimit = window.matchMedia("(max-width: 820px)").matches ? 1.15 : 1.55;
    const dpr = Math.min(dprLimit, window.devicePixelRatio || 1);
    table.width = window.innerWidth;
    table.height = window.innerHeight;
    table.dpr = dpr;
    canvas.width = Math.max(1, Math.round(table.width * dpr));
    canvas.height = Math.max(1, Math.round(table.height * dpr));
    canvas.style.width = `${table.width}px`;
    canvas.style.height = `${table.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wide = table.width > 1080 && table.width > table.height;
    const widthBudget = table.width * (wide ? .56 : .98);
    const heightBudget = table.height * .99;
    table.scale = Math.min(widthBudget / TABLE_W, heightBudget / TABLE_H);
    table.ox = (table.width - TABLE_W * table.scale) / 2;
    table.oy = (table.height - TABLE_H * table.scale) / 2;
  }

  function resetTargets() {
    state.targets = baseTargets.map((target) => ({ ...target, down: false, flash: 0, cooldown: 0 }));
  }

  function newBall(stuck = true) {
    return {
      x: 762,
      y: stuck ? 1206 : 1120,
      vx: stuck ? 0 : -220 + Math.random() * 440,
      vy: stuck ? 0 : -720 - Math.random() * 220,
      r: 17,
      stuck,
      launchLane: false,
      trail: [],
      spin: Math.random() * Math.PI * 2,
      id: Math.random().toString(36).slice(2)
    };
  }

  function resetGameState() {
    state.score = 0;
    state.ballsLeft = els.modeFilter.value === "endless" ? 5 : 3;
    state.multiplier = 1;
    state.lockProgress = 0;
    state.combo = 0;
    state.answered = 0;
    state.correct = 0;
    state.bestCombo = 0;
    state.ballSave = 10;
    state.launchHint = 3.5;
    state.launchInputAt = 0;
    state.missionStreak = 0;
    state.currentQuestion = null;
    state.currentChoices = [];
    state.missed = [];
    state.balls = [newBall(true)];
    state.particles = [];
    state.sparks = [];
    state.floatText = [];
    state.laneCooldown.clear();
    resetTargets();
    prepareQueue();
    updateHud();
    setMission("Chrono table online", "Tap Launch to fire the archive ball. Hold it for a stronger serve, then flip with A/D, arrow keys, or the buttons.", "");
  }

  function startGame() {
    audio.ensure();
    resetGameState();
    state.mode = "playing";
    state.running = true;
    els.setupScreen.classList.remove("show");
    els.endScreen.classList.remove("show");
    els.pauseScreen.classList.remove("show");
    els.questionScreen.classList.remove("show");
    window.MrMacsAnalytics?.track("game_play", {
      gameId: "chrono-pinball",
      title: "Chrono Pinball",
      course: els.courseFilter.value || "All Courses",
      gameType: "Pinball"
    }, { counter: "game-plays", once: false });
  }

  function setMission(kicker, text, feedback, tone = "") {
    els.missionKicker.textContent = kicker;
    els.missionText.textContent = text;
    els.missionFeedback.textContent = feedback || "";
    els.missionFeedback.className = `mission-feedback ${tone}`;
    state.feedbackUntil = state.elapsed + 4.2;
  }

  function updateHud() {
    els.score.textContent = formatNumber(state.score);
    els.balls.textContent = String(Math.max(0, state.ballsLeft));
    els.multiplier.textContent = `${state.multiplier}x`;
    els.locks.textContent = `${state.lockProgress}/5`;
  }

  function addScore(points, x, y, color = "#f5c451", label = "") {
    const value = Math.floor(points * state.multiplier);
    state.score += value;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    updateHud();
    addText(x, y, label || `+${formatNumber(value)}`, color);
  }

  function addText(x, y, text, color) {
    state.floatText.push({
      x,
      y,
      text,
      color,
      life: 1.05,
      vy: -48 - Math.random() * 22
    });
  }

  function addParticles(x, y, count, color, power = 1) {
    const budget = Math.max(0, MAX_PARTICLES - state.particles.length);
    const actual = Math.min(count, budget);
    for (let i = 0; i < actual; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (120 + Math.random() * 430) * power;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color,
        life: .38 + Math.random() * .55
      });
    }
  }

  function holdLaunch() {
    if (state.mode !== "playing") return;
    const stuckBall = state.balls.find((ball) => ball.stuck);
    if (!stuckBall) return;
    state.launchInputAt = performance.now();
    state.plungerHeld = true;
    els.launchBtn.classList.add("active");
    audio.ensure();
  }

  function releaseLaunch() {
    if (state.mode !== "playing") {
      cancelLaunch();
      return;
    }
    if (!state.plungerHeld && !state.balls.some((ball) => ball.stuck)) return;
    const heldFor = performance.now() - state.launchInputAt;
    const minimumCharge = heldFor < 150 ? .55 : .22;
    launchStuckBall(minimumCharge);
  }

  function quickLaunch() {
    if (state.mode !== "playing") return;
    launchStuckBall(.68);
  }

  function cancelLaunch() {
    state.plungerHeld = false;
    els.launchBtn.classList.remove("active");
    state.plungerCharge = 0;
  }

  function launchStuckBall(minimumCharge = .55) {
    const stuckBall = state.balls.find((ball) => ball.stuck);
    if (!stuckBall) {
      cancelLaunch();
      return false;
    }
    const charge = clamp(Math.max(state.plungerCharge, minimumCharge), .22, 1);
    state.plungerHeld = false;
    els.launchBtn.classList.remove("active");
    stuckBall.stuck = false;
    stuckBall.launchLane = true;
    stuckBall.x = 768;
    stuckBall.y = 1198;
    stuckBall.vx = 0;
    stuckBall.vy = -1040 - charge * 760;
    state.plungerCharge = 0;
    state.launchHint = 0;
    state.shake = .12;
    audio.launch();
    addParticles(stuckBall.x, stuckBall.y + 18, 20, "#f5c451", 1.1);
    setMission("Ball launched", "Use flippers to hit bumpers, lanes, and the five lock targets. A review lock opens when all targets are lit.", "", "");
    return true;
  }

  function setFlipper(side, active) {
    if (side === "left") {
      if (!state.leftActive && active) audio.flipper();
      state.leftActive = active;
      els.leftFlip.classList.toggle("active", active);
    } else {
      if (!state.rightActive && active) audio.flipper();
      state.rightActive = active;
      els.rightFlip.classList.toggle("active", active);
    }
  }

  function getFlipper(side) {
    const left = side === "left";
    const pivot = left ? { x: 332, y: 1228 } : { x: 568, y: 1228 };
    const length = 190;
    const active = left ? state.leftActive : state.rightActive;
    const angle = left
      ? (active ? -.55 : .24)
      : (active ? Math.PI + .55 : Math.PI - .24);
    return {
      side,
      active,
      pivot,
      end: {
        x: pivot.x + Math.cos(angle) * length,
        y: pivot.y + Math.sin(angle) * length
      },
      angle,
      length
    };
  }

  function update(dt) {
    state.elapsed += dt;
    if (state.mode === "playing") {
      if (state.launchHint > 0) state.launchHint = Math.max(0, state.launchHint - dt);
      if (state.plungerHeld) {
        state.plungerCharge = clamp(state.plungerCharge + dt * 1.2, 0, 1);
      }
      if (state.ballSave > 0) state.ballSave = Math.max(0, state.ballSave - dt);
      for (const target of state.targets) {
        target.flash = Math.max(0, target.flash - dt * 3);
        target.cooldown = Math.max(0, target.cooldown - dt);
      }
      for (const [key, value] of [...state.laneCooldown.entries()]) {
        const next = value - dt;
        if (next <= 0) state.laneCooldown.delete(key);
        else state.laneCooldown.set(key, next);
      }
      for (const ball of [...state.balls]) updateBall(ball, dt);
      if (state.balls.length === 0) serveOrEnd();
    }

    updateParticles(dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.feedbackUntil && state.elapsed > state.feedbackUntil && state.mode === "playing") {
      els.missionFeedback.textContent = "";
      els.missionFeedback.className = "mission-feedback";
      state.feedbackUntil = 0;
    }
  }

  function updateBall(ball, dt) {
    if (ball.stuck) {
      const spring = Math.sin(state.elapsed * 8) * 2 + state.plungerCharge * 42;
      ball.x = 762;
      ball.y = 1206 + spring;
      ball.trail.length = 0;
      return;
    }

    if (ball.launchLane) {
      ball.x = lerp(ball.x, 768, .22);
      ball.vy = Math.min(ball.vy, -1120);
      ball.y += ball.vy * dt;
      ball.spin += ball.vy * dt * .018;
      ball.trail.push({ x: ball.x, y: ball.y, life: .42 });
      if (ball.trail.length > 16) ball.trail.shift();
      if (ball.y <= 168) {
        ball.launchLane = false;
        ball.x = 704;
        ball.y = 178;
        ball.vx = -520 - Math.random() * 130;
        ball.vy = 210 + Math.random() * 120;
        addParticles(ball.x, ball.y, 18, "#75ecff", .8);
        addText(ball.x - 24, ball.y + 16, "ORBIT ENTRY", "#75ecff");
      }
      return;
    }

    ball.vy += 690 * dt;
    ball.vx *= .999;
    ball.vy *= .999;
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 1800) {
      ball.vx = ball.vx / speed * 1800;
      ball.vy = ball.vy / speed * 1800;
    }
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.spin += ball.vx * dt * .015;
    ball.trail.push({ x: ball.x, y: ball.y, life: .42 });
    if (ball.trail.length > 16) ball.trail.shift();

    collideBounds(ball);
    for (const wall of walls) collideSegmentWall(ball, wall[0], wall[1], wall[2], wall[3], .82);
    for (let i = 0; i < bumpers.length; i++) collideBumper(ball, bumpers[i], i);
    for (const lane of lanes) collideLane(ball, lane);
    for (const target of state.targets) collideTarget(ball, target);
    collideFlipper(ball, getFlipper("left"));
    collideFlipper(ball, getFlipper("right"));

    if (ball.y > TABLE_H + 70) drainBall(ball);
  }

  function collideBounds(ball) {
    const left = 76 + ball.r;
    const right = 824 - ball.r;
    const top = 68 + ball.r;
    if (ball.x < left) {
      ball.x = left;
      ball.vx = Math.abs(ball.vx) * .84;
      railHit(ball.x, ball.y);
    }
    if (ball.x > right) {
      ball.x = right;
      ball.vx = -Math.abs(ball.vx) * .84;
      railHit(ball.x, ball.y);
    }
    if (ball.y < top) {
      ball.y = top;
      ball.vy = Math.abs(ball.vy) * .86;
      railHit(ball.x, ball.y);
    }
  }

  function railHit(x, y) {
    if (Math.random() > .72) addParticles(x, y, 3, "#75ecff", .4);
  }

  function reflect(ball, nx, ny, bounce = .88, boost = 0) {
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) {
      ball.vx -= (1 + bounce) * dot * nx;
      ball.vy -= (1 + bounce) * dot * ny;
    }
    if (boost) {
      ball.vx += nx * boost;
      ball.vy += ny * boost;
    }
  }

  function collideSegmentWall(ball, x1, y1, x2, y2, bounce = .86) {
    const closest = closestPoint(ball.x, ball.y, x1, y1, x2, y2);
    const dx = ball.x - closest.x;
    const dy = ball.y - closest.y;
    const dist = Math.hypot(dx, dy) || .001;
    const radius = ball.r + 7;
    if (dist >= radius) return false;
    const nx = dx / dist;
    const ny = dy / dist;
    const push = radius - dist;
    ball.x += nx * push;
    ball.y += ny * push;
    reflect(ball, nx, ny, bounce);
    return true;
  }

  function closestPoint(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const lenSq = vx * vx + vy * vy || 1;
    const t = clamp(((px - x1) * vx + (py - y1) * vy) / lenSq, 0, 1);
    return { x: x1 + vx * t, y: y1 + vy * t, t };
  }

  function collideBumper(ball, bumper, index) {
    const dx = ball.x - bumper.x;
    const dy = ball.y - bumper.y;
    const dist = Math.hypot(dx, dy) || .001;
    const min = ball.r + bumper.r;
    if (dist >= min) return;
    const nx = dx / dist;
    const ny = dy / dist;
    ball.x = bumper.x + nx * min;
    ball.y = bumper.y + ny * min;
    reflect(ball, nx, ny, .96, 420);
    bumper.flash = 1;
    state.shake = Math.max(state.shake, .08);
    addScore(bumper.score + state.combo * 12, bumper.x, bumper.y - bumper.r, bumper.color);
    addParticles(ball.x, ball.y, 22, bumper.color, 1.05);
    audio.bumper(index);
  }

  function collideLane(ball, lane) {
    if (ball.y < lane.y - ball.r || ball.y > lane.y + lane.h + ball.r || ball.x < lane.x - ball.r || ball.x > lane.x + lane.w + ball.r) return;
    const key = lane.label;
    if (state.laneCooldown.has(key)) return;
    state.laneCooldown.set(key, 1.8);
    addScore(lane.score + state.combo * 20, lane.x + lane.w / 2, lane.y + lane.h, lane.color, lane.label);
    addParticles(lane.x + lane.w / 2, lane.y + lane.h / 2, 16, lane.color, .9);
    audio.target();
    state.ballSave = Math.max(state.ballSave, 4);
    setMission("Orbit lane scored", `${lane.label} lane charged the archive reactor. Keep the ball alive and finish the lock row.`, "+orbit bonus", "good");
  }

  function collideTarget(ball, target) {
    if (target.down || target.cooldown > 0) return;
    const closestX = clamp(ball.x, target.x, target.x + target.w);
    const closestY = clamp(ball.y, target.y, target.y + target.h);
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const dist = Math.hypot(dx, dy);
    if (dist > ball.r + 2) return;
    target.down = true;
    target.flash = 1;
    target.cooldown = .5;
    state.lockProgress = Math.min(5, state.lockProgress + 1);
    const nx = dist ? dx / dist : 0;
    const ny = dist ? dy / dist : -1;
    reflect(ball, nx, ny, .88, 120);
    addScore(1150 + state.lockProgress * 150, target.x + target.w / 2, target.y, target.color, `${target.label} LOCK`);
    addParticles(target.x + target.w / 2, target.y + target.h / 2, 20, target.color, 1);
    audio.target();
    updateHud();
    if (state.lockProgress >= 5) {
      setTimeout(() => openReviewLock(), 220);
    } else {
      setMission("Lock target lit", `${5 - state.lockProgress} more target${5 - state.lockProgress === 1 ? "" : "s"} until the review lock opens.`, `${state.lockProgress}/5 locks`, "good");
    }
  }

  function collideFlipper(ball, flipper) {
    const closest = closestPoint(ball.x, ball.y, flipper.pivot.x, flipper.pivot.y, flipper.end.x, flipper.end.y);
    const dx = ball.x - closest.x;
    const dy = ball.y - closest.y;
    const dist = Math.hypot(dx, dy) || .001;
    const radius = ball.r + 17;
    if (dist >= radius || closest.t < -.05 || closest.t > 1.05) return;
    let nx = dx / dist;
    let ny = dy / dist;
    if (ny > .55) {
      nx *= -1;
      ny *= -1;
    }
    const push = radius - dist;
    ball.x += nx * push;
    ball.y += ny * push;
    reflect(ball, nx, ny, .82);
    if (flipper.active) {
      const sidePower = flipper.side === "left" ? 300 : -300;
      const sweet = .65 + closest.t * .55;
      ball.vx += sidePower * sweet;
      ball.vy = Math.min(ball.vy, -760 * sweet - Math.abs(ball.vx) * .12);
      addParticles(closest.x, closest.y, 6, flipper.side === "left" ? "#75ecff" : "#ff7bcc", .45);
    }
  }

  function drainBall(ball) {
    state.balls = state.balls.filter((item) => item.id !== ball.id);
    addParticles(ball.x, TABLE_H - 48, 18, "#ff5d68", .8);
    audio.drain();
    if (state.balls.length) return;
    if (state.ballSave > 0) {
      state.ballSave = 0;
      setMission("Ball save", "The archive shield kicked the ball back into play.", "saved", "good");
      state.balls.push(newBall(true));
      return;
    }
    state.ballsLeft -= 1;
    state.combo = 0;
    updateHud();
  }

  function serveOrEnd() {
    if (state.ballsLeft > 0) {
      state.balls.push(newBall(true));
      state.launchHint = 3.5;
      setMission("Ball drained", "Tap Launch to serve the next ball. Build the lock row again for another review mission.", `${state.ballsLeft} ball${state.ballsLeft === 1 ? "" : "s"} left`, "bad");
    } else {
      endGame();
    }
  }

  function openReviewLock() {
    if (state.mode !== "playing") return;
    state.mode = "question";
    state.running = false;
    state.lockProgress = 0;
    resetTargets();
    state.currentQuestion = nextQuestion();
    state.currentChoices = buildChoices(state.currentQuestion);
    renderQuestion();
    updateHud();
    els.questionScreen.classList.add("show");
    setMission("Review lock engaged", "Clear the mission to bank a multiplier, shield time, and a shot at multiball.", "", "");
  }

  function renderQuestion() {
    const q = state.currentQuestion;
    if (!q) return;
    const value = q.value ? ` | ${q.value}` : "";
    els.questionMeta.textContent = cleanText(`${q.course || "Social Studies"} | ${q.set || q.subject || "Review"}${value}`);
    els.questionPrompt.textContent = displayPrompt(q);
    els.explanation.textContent = "";
    els.explanation.className = "explanation";
    renderStimulus(q);
    els.choiceGrid.innerHTML = state.currentChoices.map((choice, index) => (
      `<button type="button" data-index="${index}">${escapeHtml(choice.text)}</button>`
    )).join("");
    els.choiceGrid.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => answerQuestion(Number(button.dataset.index)));
    });
  }

  function renderStimulus(q) {
    const images = stimulusImagesFor(q);
    const text = stimulusTextFor(q);
    if (!images.length && !text) {
      els.stimulusBox.classList.remove("show");
      els.stimulusBox.innerHTML = "";
      return;
    }
    const imageHtml = images.slice(0, 2).map((image, index) => {
      const src = resolveStimulusSrc(image.src);
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(image.label || `Stimulus ${index + 1}`)}">`;
    }).join("");
    const textHtml = text ? `<div class="stimulus-text">${escapeHtml(text)}</div>` : "";
    els.stimulusBox.innerHTML = `${imageHtml}${textHtml}`;
    els.stimulusBox.classList.add("show");
  }

  function answerQuestion(index) {
    if (state.mode !== "question") return;
    const q = state.currentQuestion;
    const choice = state.currentChoices[index];
    if (!q || !choice) return;
    state.answered += 1;
    const buttons = [...els.choiceGrid.querySelectorAll("button")];
    buttons.forEach((button, i) => {
      button.disabled = true;
      button.classList.toggle("correct", state.currentChoices[i]?.correct);
      if (i === index && !choice.correct) button.classList.add("wrong");
    });
    const explanation = displayExplanation(q);
    if (choice.correct) {
      state.correct += 1;
      state.missionStreak += 1;
      state.multiplier = clamp(state.multiplier + 1, 1, 6);
      state.ballSave = Math.max(state.ballSave, 12);
      addScore(5200 + state.missionStreak * 850, 450, 650, "#69f3a9", "MISSION CLEAR");
      els.explanation.textContent = explanation;
      els.explanation.className = "explanation good";
      audio.correct();
      setMission("Mission clear", "Correct review answer. Multiplier increased and ball save is active.", "+multiplier +shield", "good");
      if (state.missionStreak % 2 === 0 || els.modeFilter.value === "endless") {
        setTimeout(spawnMultiball, 520);
      }
    } else {
      state.missionStreak = 0;
      state.multiplier = Math.max(1, state.multiplier - 1);
      state.missed.push(q);
      state.combo = 0;
      addScore(900, 450, 650, "#ff5d68", "REVIEW");
      els.explanation.textContent = `Correct answer: ${cleanText(q.answer)}. ${explanation}`;
      els.explanation.className = "explanation bad";
      audio.wrong();
      setMission("Mission reviewed", "The table stays alive, but the multiplier dropped. Use the explanation, then relaunch.", "study target saved", "bad");
    }
    updateHud();
    setTimeout(closeQuestion, choice.correct ? 1450 : 2400);
  }

  function closeQuestion() {
    if (state.mode !== "question") return;
    els.questionScreen.classList.remove("show");
    state.mode = "playing";
    state.running = true;
    if (!state.balls.length) state.balls.push(newBall(true));
  }

  function spawnMultiball() {
    if (state.mode !== "playing" && state.mode !== "question") return;
    const count = Math.min(3 - state.balls.length, 2);
    for (let i = 0; i < count; i++) {
      const ball = newBall(false);
      ball.x = 420 + Math.random() * 70;
      ball.y = 520 + Math.random() * 80;
      ball.vx = -430 + Math.random() * 860;
      ball.vy = -520 - Math.random() * 360;
      state.balls.push(ball);
      addParticles(ball.x, ball.y, 28, i ? "#ff7bcc" : "#75ecff", 1.1);
    }
    if (count > 0) {
      audio.multiball();
      state.shake = .18;
      addText(450, 490, "MULTIBALL", "#f5c451");
      setMission("Multiball", "Two archive balls are live. Keep both in play and keep scoring.", "multiball active", "good");
    }
  }

  function pauseGame() {
    if (state.mode !== "playing") return;
    state.pausedAtMode = state.mode;
    state.mode = "paused";
    state.running = false;
    els.pauseScreen.classList.add("show");
  }

  function resumeGame() {
    if (state.mode !== "paused") return;
    state.mode = state.pausedAtMode || "playing";
    state.running = state.mode === "playing";
    state.last = performance.now();
    els.pauseScreen.classList.remove("show");
  }

  function endGame() {
    if (state.mode === "ended") return;
    state.mode = "ended";
    state.running = false;
    els.endScreen.classList.add("show");
    const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
    const best = Number(localStorage.getItem(`${STORAGE_KEY}:bestScore`) || 0);
    if (state.score > best) localStorage.setItem(`${STORAGE_KEY}:bestScore`, String(Math.floor(state.score)));
    els.endTitle.textContent = state.score > best ? "New table record" : "Archive table closed";
    els.endGrid.innerHTML = [
      [formatNumber(state.score), "score"],
      [`${accuracy}%`, "mission accuracy"],
      [`${state.correct}/${state.answered}`, "review locks"],
      [String(state.bestCombo), "best combo"]
    ].map(([value, label]) => `<div class="end-tile"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
    if (state.missed.length) {
      const items = state.missed.slice(-5).map((q) => `<p><strong>${escapeHtml(cleanText(q.answer))}</strong>: ${escapeHtml(displayPrompt(q))}</p>`).join("");
      els.studyTargets.innerHTML = `<strong>Study targets from this run</strong>${items}`;
    } else {
      els.studyTargets.innerHTML = "<strong>No missed review locks.</strong><p>Try a narrower course/unit filter for a tougher table.</p>";
    }
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "chrono-pinball",
      title: "Chrono Pinball",
      score: Math.floor(state.score),
      accuracy,
      questions: state.answered,
      course: els.courseFilter.value || "All Courses"
    }, { counter: "game-completions", once: false });
  }

  function showSetup() {
    state.mode = "setup";
    state.running = false;
    els.endScreen.classList.remove("show");
    els.pauseScreen.classList.remove("show");
    els.questionScreen.classList.remove("show");
    els.setupScreen.classList.add("show");
  }

  function exitArcade() {
    window.location.href = "../../";
  }

  function updateParticles(dt) {
    for (const star of state.stars) {
      star.y += dt * .011 * star.z;
      if (star.y > 1.02) {
        star.y = -.02;
        star.x = Math.random();
      }
    }
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= .986;
      p.vy = p.vy * .986 + 120 * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const text of state.floatText) {
      text.life -= dt;
      text.y += text.vy * dt;
      text.vy *= .98;
    }
    state.floatText = state.floatText.filter((text) => text.life > 0);
  }

  function draw() {
    ctx.clearRect(0, 0, table.width, table.height);
    drawSpace();
    ctx.save();
    const shakeX = state.shake ? (Math.random() - .5) * state.shake * 20 : 0;
    const shakeY = state.shake ? (Math.random() - .5) * state.shake * 20 : 0;
    ctx.translate(table.ox + shakeX, table.oy + shakeY);
    ctx.scale(table.scale, table.scale);
    drawTable();
    drawLanes();
    drawBumpers();
    drawTargets();
    drawFlippers();
    drawBalls();
    drawTableParticles();
    drawPlunger();
    ctx.restore();
  }

  function drawSpace() {
    const gradient = ctx.createRadialGradient(table.width * .5, table.height * .42, 40, table.width * .5, table.height * .45, Math.max(table.width, table.height) * .72);
    gradient.addColorStop(0, "#121933");
    gradient.addColorStop(.42, "#050817");
    gradient.addColorStop(1, "#03050d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, table.width, table.height);

    ctx.save();
    ctx.globalAlpha = FX_LITE ? .55 : .72;
    for (const star of state.stars) {
      const x = star.x * table.width;
      const y = star.y * table.height;
      const size = star.z * (FX_LITE ? 1.4 : 1.9);
      ctx.fillStyle = star.hue;
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();

    if (!FX_LITE) {
      const glow = ctx.createRadialGradient(table.width * .74, table.height * .22, 0, table.width * .74, table.height * .22, table.width * .34);
      glow.addColorStop(0, "rgba(255,123,204,.12)");
      glow.addColorStop(1, "rgba(255,123,204,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, table.width, table.height);
    }
  }

  function drawTable() {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 18;
    roundRect(ctx, 48, 44, 804, 1310, 42);
    const body = ctx.createLinearGradient(48, 44, 852, 1354);
    body.addColorStop(0, "#16213f");
    body.addColorStop(.34, "#0b132a");
    body.addColorStop(.72, "#151326");
    body.addColorStop(1, "#070915");
    ctx.fillStyle = body;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, 74, 70, 752, 1254, 34);
    const play = ctx.createLinearGradient(74, 70, 826, 1324);
    play.addColorStop(0, "#1b2f58");
    play.addColorStop(.38, "#111d38");
    play.addColorStop(.72, "#1d1730");
    play.addColorStop(1, "#0b0d17");
    ctx.fillStyle = play;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(245,196,81,.24)";
    ctx.stroke();
    ctx.restore();

    drawArcadeCircuit();
    drawRails();
    drawCenterEmblem();
    drawDrain();
  }

  function drawArcadeCircuit() {
    ctx.save();
    ctx.globalAlpha = .35;
    ctx.lineWidth = 2;
    for (let y = 180; y < 1120; y += 92) {
      ctx.strokeStyle = y % 184 === 0 ? "rgba(117,236,255,.20)" : "rgba(255,255,255,.06)";
      ctx.beginPath();
      ctx.moveTo(128, y);
      ctx.bezierCurveTo(290, y - 38, 618, y + 42, 772, y - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRails() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const wall of walls) {
      ctx.strokeStyle = "rgba(251,247,237,.18)";
      ctx.lineWidth = 17;
      ctx.beginPath();
      ctx.moveTo(wall[0], wall[1]);
      ctx.lineTo(wall[2], wall[3]);
      ctx.stroke();
      ctx.strokeStyle = "rgba(117,236,255,.22)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(245,196,81,.32)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(450, 254, 280, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,123,204,.24)";
    ctx.beginPath();
    ctx.arc(450, 698, 265, Math.PI * .16, Math.PI * .84);
    ctx.stroke();
    ctx.restore();
  }

  function drawCenterEmblem() {
    ctx.save();
    ctx.translate(450, 724);
    ctx.rotate(Math.sin(state.elapsed * .45) * .03);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 170);
    glow.addColorStop(0, "rgba(245,196,81,.14)");
    glow.addColorStop(1, "rgba(245,196,81,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(245,196,81,.30)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 104, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-76, -54);
    ctx.lineTo(0, -98);
    ctx.lineTo(76, -54);
    ctx.lineTo(76, 54);
    ctx.lineTo(0, 98);
    ctx.lineTo(-76, 54);
    ctx.closePath();
    ctx.strokeStyle = "rgba(117,236,255,.28)";
    ctx.stroke();
    ctx.fillStyle = "rgba(251,247,237,.10)";
    ctx.fill();
    ctx.fillStyle = "rgba(251,247,237,.65)";
    ctx.font = "900 25px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ARCHIVE", 0, -6);
    ctx.font = "800 15px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(245,196,81,.76)";
    ctx.fillText("REACTOR", 0, 24);
    ctx.restore();
  }

  function drawDrain() {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.42)";
    roundRect(ctx, 314, 1280, 272, 58, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,93,104,.38)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.44)";
    ctx.font = "900 18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DRAIN", 450, 1317);
    ctx.restore();
  }

  function drawLanes() {
    ctx.save();
    for (const lane of lanes) {
      const hot = state.laneCooldown.has(lane.label);
      ctx.save();
      ctx.shadowColor = lane.color;
      ctx.shadowBlur = hot ? 30 : 12;
      roundRect(ctx, lane.x, lane.y, lane.w, lane.h, 20);
      ctx.fillStyle = hot ? `${hexToRgba(lane.color, .28)}` : "rgba(0,0,0,.22)";
      ctx.fill();
      ctx.strokeStyle = hexToRgba(lane.color, hot ? .82 : .42);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(251,247,237,.78)";
      ctx.font = "900 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(lane.label, lane.x + lane.w / 2, lane.y + lane.h / 2 + 5);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBumpers() {
    ctx.save();
    for (let i = 0; i < bumpers.length; i++) {
      const bumper = bumpers[i];
      bumper.flash = Math.max(0, (bumper.flash || 0) - .025);
      const pulse = .5 + Math.sin(state.elapsed * 3.4 + i) * .5;
      const hot = (bumper.flash || 0) + pulse * .2;
      ctx.save();
      ctx.translate(bumper.x, bumper.y);
      ctx.shadowColor = bumper.color;
      ctx.shadowBlur = FX_LITE ? 12 + hot * 16 : 22 + hot * 28;
      const grad = ctx.createRadialGradient(-bumper.r * .28, -bumper.r * .34, 8, 0, 0, bumper.r);
      grad.addColorStop(0, "rgba(255,255,255,.94)");
      grad.addColorStop(.22, bumper.color);
      grad.addColorStop(1, "rgba(0,0,0,.45)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, bumper.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = "rgba(251,247,237,.44)";
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(0,0,0,.38)";
      ctx.beginPath();
      ctx.arc(0, 0, bumper.r - 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#06101e";
      ctx.font = `900 ${bumper.r > 50 ? 23 : 17}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(bumper.label, 0, 1);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawTargets() {
    ctx.save();
    for (const target of state.targets) {
      ctx.save();
      const y = target.down ? target.y + 18 : target.y;
      ctx.translate(target.x, y);
      ctx.shadowColor = target.color;
      ctx.shadowBlur = target.down ? 2 : 18 + target.flash * 20;
      roundRect(ctx, 0, 0, target.w, target.h, 7);
      ctx.fillStyle = target.down ? "rgba(0,0,0,.30)" : hexToRgba(target.color, .36);
      ctx.fill();
      ctx.strokeStyle = target.down ? "rgba(255,255,255,.12)" : hexToRgba(target.color, .88);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = target.down ? "rgba(255,255,255,.35)" : "rgba(251,247,237,.92)";
      ctx.font = "900 16px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(target.label, target.w / 2, target.h / 2 + 1);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawFlippers() {
    drawFlipper(getFlipper("left"), "#75ecff");
    drawFlipper(getFlipper("right"), "#ff7bcc");
  }

  function drawFlipper(flipper, color) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = flipper.active ? 26 : 11;
    ctx.strokeStyle = "rgba(0,0,0,.52)";
    ctx.lineWidth = 42;
    ctx.beginPath();
    ctx.moveTo(flipper.pivot.x, flipper.pivot.y);
    ctx.lineTo(flipper.end.x, flipper.end.y);
    ctx.stroke();
    const grad = ctx.createLinearGradient(flipper.pivot.x, flipper.pivot.y, flipper.end.x, flipper.end.y);
    grad.addColorStop(0, color);
    grad.addColorStop(.52, "#fbf7ed");
    grad.addColorStop(1, color);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 29;
    ctx.beginPath();
    ctx.moveTo(flipper.pivot.x, flipper.pivot.y);
    ctx.lineTo(flipper.end.x, flipper.end.y);
    ctx.stroke();
    ctx.fillStyle = "#11172b";
    ctx.beginPath();
    ctx.arc(flipper.pivot.x, flipper.pivot.y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawBalls() {
    ctx.save();
    for (const ball of state.balls) {
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const a = (i / ball.trail.length) * .28 * t.life;
        ctx.fillStyle = `rgba(117,236,255,${a})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * (i / ball.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.spin);
      ctx.shadowColor = "#75ecff";
      ctx.shadowBlur = 18;
      const grad = ctx.createRadialGradient(-7, -9, 4, 0, 0, ball.r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(.34, "#c6f8ff");
      grad.addColorStop(.68, "#6ecdea");
      grad.addColorStop(1, "#122745");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,.28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-ball.r * .55, 0);
      ctx.lineTo(ball.r * .55, 0);
      ctx.moveTo(0, -ball.r * .55);
      ctx.lineTo(0, ball.r * .55);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPlunger() {
    ctx.save();
    const charge = state.plungerCharge;
    ctx.save();
    ctx.globalAlpha = .5 + charge * .35;
    ctx.strokeStyle = "rgba(245,196,81,.52)";
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(768, 1196);
    ctx.bezierCurveTo(780, 880, 792, 430, 704, 178);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(245,196,81,.72)";
    ctx.beginPath();
    ctx.moveTo(700, 160);
    ctx.lineTo(721, 194);
    ctx.lineTo(682, 187);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,.30)";
    roundRect(ctx, 724, 1080, 88, 230, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(245,196,81,.24)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "rgba(245,196,81,.28)";
    roundRect(ctx, 752, 1240 - charge * 118, 34, 72 + charge * 62, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(245,196,81,.68)";
    ctx.stroke();
    ctx.fillStyle = "rgba(251,247,237,.68)";
    ctx.font = "900 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LAUNCH", 768, 1064);
    if (state.launchHint > 0 && state.balls.some((ball) => ball.stuck)) {
      const alpha = .62 + Math.sin(state.elapsed * 7) * .22;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(245,196,81,.94)";
      ctx.font = "900 24px Inter, system-ui, sans-serif";
      ctx.fillText("TAP LAUNCH", 450, 1152);
      ctx.font = "800 15px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(251,247,237,.76)";
      ctx.fillText("or press Space", 450, 1177);
      ctx.globalAlpha = 1;
    }
    if (state.ballSave > 0 && state.mode === "playing") {
      ctx.fillStyle = "rgba(105,243,169,.85)";
      ctx.font = "900 16px Inter, system-ui, sans-serif";
      ctx.fillText(`BALL SAVE ${Math.ceil(state.ballSave)}`, 450, 1088);
    }
    ctx.restore();
  }

  function drawTableParticles() {
    ctx.save();
    for (const p of state.particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const text of state.floatText) {
      ctx.globalAlpha = clamp(text.life, 0, 1);
      ctx.fillStyle = text.color;
      ctx.font = "900 25px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = text.color;
      ctx.shadowBlur = 12;
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.restore();
  }

  function roundRect(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + radius);
    context.lineTo(x + w, y + h - radius);
    context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    context.lineTo(x + radius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  function hexToRgba(hex, alpha) {
    const raw = hex.replace("#", "");
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function loop(now) {
    const dt = Math.min(.033, ((now || 0) - (state.last || now || 0)) / 1000 || .016);
    state.last = now || 0;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function bindControls() {
    window.addEventListener("resize", resize);
    window.addEventListener("blur", () => {
      if (state.mode === "playing") pauseGame();
      setFlipper("left", false);
      setFlipper("right", false);
      cancelLaunch();
    });

    els.courseFilter.addEventListener("change", () => {
      populateSets();
      applyFilters();
    });
    els.setFilter.addEventListener("change", applyFilters);
    els.modeFilter.addEventListener("change", renderSetupMetrics);
    els.startBtn.addEventListener("click", startGame);
    els.pauseBtn.addEventListener("click", () => state.mode === "paused" ? resumeGame() : pauseGame());
    els.resumeBtn.addEventListener("click", resumeGame);
    els.restartBtn.addEventListener("click", startGame);
    els.againBtn.addEventListener("click", startGame);
    els.setupBtn.addEventListener("click", showSetup);
    els.exitBtn.addEventListener("click", exitArcade);
    els.pauseExitBtn.addEventListener("click", exitArcade);
    els.soundBtn.addEventListener("click", () => {
      audio.enabled = !audio.enabled;
      els.soundBtn.textContent = audio.enabled ? "Sound On" : "Sound Off";
      if (audio.enabled) audio.ensure();
    });
    els.fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });

    bindHoldButton(els.leftFlip, () => setFlipper("left", true), () => setFlipper("left", false));
    bindHoldButton(els.rightFlip, () => setFlipper("right", true), () => setFlipper("right", false));
    bindHoldButton(els.launchBtn, holdLaunch, releaseLaunch, quickLaunch);

    canvas.addEventListener("pointerdown", (event) => {
      audio.ensure();
      if (state.mode !== "playing") return;
      canvas.setPointerCapture?.(event.pointerId);
      if (event.clientX < window.innerWidth * .38) setFlipper("left", true);
      else if (event.clientX > window.innerWidth * .62) {
        const stuck = state.balls.some((ball) => ball.stuck);
        if (stuck) holdLaunch();
        else setFlipper("right", true);
      }
    });
    canvas.addEventListener("pointerup", (event) => {
      setFlipper("left", false);
      setFlipper("right", false);
      releaseLaunch();
      canvas.releasePointerCapture?.(event.pointerId);
    });
    canvas.addEventListener("pointercancel", () => {
      setFlipper("left", false);
      setFlipper("right", false);
      cancelLaunch();
    });
    canvas.addEventListener("click", (event) => {
      if (state.mode !== "playing") return;
      if (event.clientX > window.innerWidth * .62 && state.balls.some((ball) => ball.stuck)) quickLaunch();
    });

    window.addEventListener("keydown", (event) => {
      if (event.repeat && event.code !== "Space" && event.code !== "ArrowDown") return;
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        event.preventDefault();
        setFlipper("left", true);
      } else if (event.code === "ArrowRight" || event.code === "KeyD") {
        event.preventDefault();
        setFlipper("right", true);
      } else if (event.code === "Space" || event.code === "ArrowDown") {
        event.preventDefault();
        holdLaunch();
      } else if (event.code === "KeyP") {
        event.preventDefault();
        state.mode === "paused" ? resumeGame() : pauseGame();
      } else if (event.code === "Escape") {
        if (state.mode === "question") closeQuestion();
        else if (state.mode === "playing") pauseGame();
      }
    });
    window.addEventListener("keyup", (event) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") setFlipper("left", false);
      if (event.code === "ArrowRight" || event.code === "KeyD") setFlipper("right", false);
      if (event.code === "Space" || event.code === "ArrowDown") {
        event.preventDefault();
        releaseLaunch();
      }
    });
  }

  function bindHoldButton(button, down, up, clickFallback) {
    let pointerHandledAt = 0;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointerHandledAt = performance.now();
      button.setPointerCapture?.(event.pointerId);
      down();
    });
    button.addEventListener("pointerup", (event) => {
      event.preventDefault();
      pointerHandledAt = performance.now();
      up();
      button.releasePointerCapture?.(event.pointerId);
    });
    button.addEventListener("pointercancel", () => {
      pointerHandledAt = performance.now();
      up();
    });
    button.addEventListener("mouseleave", () => {
      if (button.classList.contains("active")) up();
    });
    button.addEventListener("click", (event) => {
      if (!clickFallback) return;
      event.preventDefault();
      if (performance.now() - pointerHandledAt < 180) {
        if (state.balls.some((ball) => ball.stuck)) clickFallback();
        return;
      }
      clickFallback();
    });
    button.addEventListener("touchstart", (event) => {
      if (window.PointerEvent) return;
      event.preventDefault();
      down();
    }, { passive: false });
    button.addEventListener("touchend", (event) => {
      if (window.PointerEvent) return;
      event.preventDefault();
      up();
    }, { passive: false });
    button.addEventListener("mousedown", () => {
      if (window.PointerEvent) return;
      down();
    });
    button.addEventListener("mouseup", () => {
      if (window.PointerEvent) return;
      up();
    });
  }

  async function init() {
    resize();
    initStars();
    resetTargets();
    bindControls();
    updateHud();
    setMission("Loading table", "Preparing the review bank and table systems.", "", "");
    requestAnimationFrame(loop);
    try {
      await loadBank();
      setMission("Mission loaded", "Launch the archive ball, hit the gold lock targets, and answer review missions for multiball.", "", "");
    } catch (error) {
      console.error(error);
      els.startBtn.textContent = "Bank failed to load";
      els.setupMetrics.innerHTML = `<span class="metric-pill">Question bank could not load. Try refreshing the page.</span>`;
      setMission("Bank error", "The shared review library did not load. Refresh the page before playing.", "bank offline", "bad");
    }
  }

  init();
})();
