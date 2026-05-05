(() => {
  "use strict";

  // ─── Constants ────────────────────────────────────────────────────────────
  const TABLE_W = 900;
  const TABLE_H = 1400;
  const STORAGE_KEY = "mr-macs-chrono-pinball-v1";
  const params = new URLSearchParams(window.location.search);
  const FX_LITE = params.get("fx") === "lite" || window.matchMedia("(max-width: 820px)").matches;
  const MAX_PARTICLES = FX_LITE ? 80 : 200;
  const GRAVITY = 700;
  const SUBSTEPS = 3;

  // Era drop-target rows (5 historical eras)
  const ERA_LABELS = ["RENAISSANCE", "INDUSTRIAL", "WWII", "COLD WAR", "DIGITAL AGE"];
  const ERA_COLORS = ["#f5c451", "#75ecff", "#ff7bcc", "#69f3a9", "#a991ff"];

  // ─── DOM refs ─────────────────────────────────────────────────────────────
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

  // ─── Table layout ─────────────────────────────────────────────────────────
  const table = { width: 0, height: 0, scale: 1, ox: 0, oy: 0, dpr: 1 };

  // Bumpers: {x, y, r, label, color, score}
  const BUMPERS = [
    { x: 300, y: 340, r: 52, label: "DOC",  color: "#75ecff", score: 550 },
    { x: 450, y: 248, r: 56, label: "ERA",  color: "#f5c451", score: 680 },
    { x: 600, y: 340, r: 52, label: "REV",  color: "#ff7bcc", score: 550 },
    { x: 248, y: 760, r: 40, label: "LAW",  color: "#69f3a9", score: 420 },
    { x: 652, y: 760, r: 40, label: "MAP",  color: "#a991ff", score: 420 }
  ];

  // Slingshots: triangular kickers on left+right inlanes
  const SLINGS = [
    { x1: 102, y1: 980, x2: 200, y2: 1080, side: "left",  color: "#75ecff" },
    { x1: 798, y1: 980, x2: 700, y2: 1080, side: "right", color: "#ff7bcc" }
  ];

  // Ramps: entry gate + exit
  const RAMPS = [
    { x: 128, y: 440, w: 80, h: 28, label: "LEFT RAMP",  color: "#f5c451", score: 4200, exitX: 680, exitY: 220, exitVx: 180, exitVy: 120, active: false, flash: 0 },
    { x: 692, y: 440, w: 80, h: 28, label: "RIGHT RAMP", color: "#69f3a9", score: 4200, exitX: 220, exitY: 220, exitVx: -180, exitVy: 120, active: false, flash: 0 }
  ];

  // Spinners: vertical segment, rotate on hit
  const SPINNERS = [
    { x: 184, y: 600, h: 62, angle: 0, spin: 0, color: "#75ecff", score: 180 },
    { x: 716, y: 600, h: 62, angle: 0, spin: 0, color: "#ff7bcc", score: 180 }
  ];

  // Top lanes (skill shot): 3 lanes at top
  const TOP_LANES = [
    { x: 168, y: 138, w: 98, h: 78, label: "ANCIENT", color: "#75ecff", score: 900, lit: false, cooldown: 0 },
    { x: 400, y: 118, w: 100, h: 78, label: "MODERN",  color: "#f5c451", score: 950, lit: false, cooldown: 0 },
    { x: 634, y: 138, w: 98,  h: 78, label: "GLOBAL",  color: "#ff7bcc", score: 900, lit: false, cooldown: 0 }
  ];

  // Wall segments [x1,y1,x2,y2]
  const WALLS = [
    // Outer walls
    [86, 160, 86, 1088],
    [814, 160, 814, 1088],
    // Top arch
    [86, 160, 244, 80],
    [656, 80, 814, 160],
    [244, 80, 656, 80],
    // Inlane guide rails (left)
    [102, 980, 180, 1100],
    [180, 1100, 264, 1160],
    // Inlane guide rails (right)
    [798, 980, 720, 1100],
    [720, 1100, 636, 1160],
    // Outlane walls
    [86, 1088, 240, 1200],
    [814, 1088, 560, 1200],
    // Plunger lane
    [726, 160, 726, 1240],
    [814, 160, 814, 1240]
  ];

  // Era drop-target rows: 5 targets per row, knocked down individually
  function buildEraTargets() {
    return ERA_LABELS.map((era, ei) => ({
      era,
      color: ERA_COLORS[ei],
      completed: false,
      targets: [0, 1, 2, 3, 4].map((ti) => ({
        x: 152 + ti * 122,
        y: 560 + (ei % 2) * 36,
        w: 90,
        h: 28,
        label: era.slice(0, 3),
        down: false,
        flash: 0,
        cooldown: 0
      }))
    }));
  }

  // Flipper geometry
  function getFlipper(side) {
    const left = side === "left";
    const pivot = left ? { x: 316, y: 1230 } : { x: 584, y: 1230 };
    const len = 178;
    const active = left ? state.leftActive : state.rightActive;
    const restAngle  = left ? 0.28  : Math.PI - 0.28;
    const liftAngle  = left ? -0.52 : Math.PI + 0.52;
    const angle = active ? liftAngle : restAngle;
    return {
      side, active, pivot, angle, len,
      end: { x: pivot.x + Math.cos(angle) * len, y: pivot.y + Math.sin(angle) * len }
    };
  }

  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    bank: null, filtered: [], queue: [],
    mode: "setup", running: false, pausedAtMode: "playing",
    score: 0, ballsLeft: 3, multiplier: 1,
    bonus: 0, bonusMult: 1,
    eraTargets: [],
    eraCompleted: 0,       // 0-5 eras done
    missionsCompleted: 0,
    currentMissionEra: -1, // which era row is active mission
    missionStep: 0,        // 0,1,2 questions answered this mission
    missionRampDone: false,
    wizardMode: false,
    wizardTimer: 0,
    multiBallActive: false,
    lockedBalls: 0,
    combo: 0, bestCombo: 0,
    answered: 0, correct: 0,
    missed: [],
    balls: [],
    particles: [],
    floatText: [],
    stars: [],
    tiltWarnings: 0,
    tiltLocked: false,
    tiltLockTimer: 0,
    leftActive: false, rightActive: false,
    plungerHeld: false, plungerCharge: 0,
    launchHint: 0, launchInputAt: 0,
    ballSave: 0,
    shake: 0,
    last: 0, elapsed: 0,
    feedbackUntil: 0,
    skillShotLane: -1,     // which top lane is lit for skill shot
    rampsMade: 0,
    spinnerFlash: [0, 0],
    flipperFlash: [0, 0],
    slingFlash: [0, 0],
    scoreCountTarget: 0, scoreDisplay: 0,
    missionStreak: 0,
    currentQuestion: null, currentChoices: [],
    highScore: 0,
    bestEraProgress: 0
  };

  // ─── Audio (Web Audio API only) ───────────────────────────────────────────
  class AudioBus {
    constructor() { this.enabled = true; this.ctx = null; }

    ensure() {
      if (!this.enabled) return null;
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }

    tone(freq, dur = 0.08, type = "sine", gain = 0.08, bend = 1) {
      const ac = this.ensure(); if (!ac) return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const vol = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (bend !== 1) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * bend), now + dur);
      vol.gain.setValueAtTime(0.0001, now);
      vol.gain.exponentialRampToValueAtTime(gain, now + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(vol).connect(ac.destination);
      osc.start(now); osc.stop(now + dur + 0.04);
    }

    chord(freqs, dur, type, gain) {
      freqs.forEach((f, i) => setTimeout(() => this.tone(f, dur, type, gain), i * 55));
    }

    bumper(idx) {
      const f = [620, 740, 860, 980, 760][idx % 5];
      this.tone(f, 0.07, "triangle", 0.08, 1.4);
      setTimeout(() => this.tone(f * 1.5, 0.05, "sine", 0.05, 0.82), 32);
    }

    sling() {
      this.tone(340, 0.04, "square", 0.07, 1.6);
      setTimeout(() => this.tone(680, 0.03, "square", 0.04, 0.7), 22);
    }

    dropTarget() {
      this.tone(520, 0.055, "square", 0.07, 1.18);
    }

    ramp() {
      [440, 554, 659, 880, 1100].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, "triangle", 0.07, 1.05), i * 50));
    }

    launch() {
      this.tone(130, 0.18, "sawtooth", 0.07, 2.6);
      setTimeout(() => this.tone(420, 0.10, "triangle", 0.05, 1.3), 80);
    }

    flipper() { this.tone(128, 0.04, "square", 0.05, 1.5); }

    correct() { this.chord([440, 554, 659, 880], 0.10, "triangle", 0.06); }

    wrong() {
      this.tone(210, 0.16, "sawtooth", 0.06, 0.55);
      setTimeout(() => this.tone(150, 0.12, "triangle", 0.04, 0.7), 90);
    }

    drain() { this.tone(180, 0.20, "sawtooth", 0.07, 0.4); }

    modeStart() {
      [220, 330, 440, 660, 880, 1100].forEach((f, i) => setTimeout(() => this.tone(f, 0.11, "triangle", 0.07, 1.08), i * 48));
    }

    multiball() {
      [360, 540, 720, 960, 1200, 1440].forEach((f, i) => setTimeout(() => this.tone(f, 0.09, "triangle", 0.08, 1.1), i * 44));
    }

    wizard() {
      [261, 329, 392, 523, 659, 783, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, "triangle", 0.09, 1.06), i * 58));
    }

    tiltWarning() {
      this.tone(160, 0.22, "sawtooth", 0.09, 0.5);
      setTimeout(() => this.tone(200, 0.18, "sawtooth", 0.07, 0.6), 140);
    }

    spinner() { this.tone(880 + Math.random() * 200, 0.035, "sine", 0.04, 0.95); }

    skillShot() {
      [880, 1100, 1320].forEach((f, i) => setTimeout(() => this.tone(f, 0.09, "triangle", 0.07, 1.1), i * 42));
    }

    bonusCount() { this.tone(440 + Math.random() * 200, 0.03, "sine", 0.04, 1.1); }
  }

  const audio = new AudioBus();

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp   = (a, b, t)   => a + (b - a) * t;
  const hypot  = (dx, dy)    => Math.sqrt(dx * dx + dy * dy);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatNumber(v) { return Math.max(0, Math.floor(v)).toLocaleString(); }
  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function normalize(v) {
    return String(v || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  function cleanText(v) {
    return String(v || "").replace(/\s+/g, " ")
      .replace(/\bcon\s+icts\b/gi, "conflicts")
      .replace(/\bUnited states\b/g, "United States")
      .replace(/\bu\.s\.\b/gi, "U.S.").replace(/\bnys\b/gi, "NYS").trim();
  }
  function displayPrompt(q) {
    const raw = cleanText(q?.prompt || q?.stem || "");
    const cleaned = raw
      .replace(/^final\s+clue(?:\s+for\s+[^:]+)?:\s*/i, "")
      .replace(/^name\s+this\s+content\s+item:\s*/i, "")
      .replace(/^this\s+is\s+(his|her)\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+/i, "Identify: ")
      .replace(/^these\s+are\s+/i, "Identify: ").trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : raw;
  }
  function displayExplanation(q) {
    const ex = cleanText(q?.explanation || "");
    return ex || (q?.answer ? `Correct answer: ${cleanText(q.answer)}.` : "Review this item again.");
  }

  const sourceRe = /(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(documents|statements|headlines|sources|passages|figures|maps|graphs|charts|cartoons)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+(this|the)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|similar\s+to\s+this)/i;

  function promptNeedsStimulus(q) { return sourceRe.test(String(q?.prompt || q?.stem || "")); }
  function stimulusImagesFor(q) {
    const SB = window.MrMacsSourceBank;
    if (SB) return SB.stimulusImages(q);
    if (!q) return [];
    const list = Array.isArray(q.stimulusImages) ? q.stimulusImages : [];
    const imgs = list.length ? list : (q.stimulusImage ? [{ src: q.stimulusImage, label: "Source" }] : []);
    if (!imgs.length) return [];
    if (q.stimulusRequired === true || q.stimulusImage || q.stimulusText || q.stimulusHtml || typeof q.stimulus === "string")
      return imgs.filter(i => i?.src);
    if (q.stimulusRequired === false) return [];
    return promptNeedsStimulus(q) ? imgs.filter(i => i?.src) : [];
  }
  function stimulusTextFor(q) {
    if (!q) return "";
    if (typeof q.stimulusText === "string") return cleanText(q.stimulusText);
    if (typeof q.stimulus === "string") return cleanText(q.stimulus);
    if (typeof q.stimulusHtml === "string") {
      const d = document.createElement("div"); d.innerHTML = q.stimulusHtml;
      return cleanText(d.textContent || "");
    }
    return "";
  }
  function hasReliableStimulus(q) { return Boolean(stimulusTextFor(q) || stimulusImagesFor(q).length); }
  function isPlayableQuestion(q) {
    if (!q || !q.answer || !(q.prompt || q.stem)) return false;
    const SB = window.MrMacsSourceBank;
    if (SB && !SB.playableSharedPrompt(q)) return false;
    if (SB && SB.sourceBased(q)) {
      if (!hasReliableStimulus(q)) return false;
      if (q.type === "mcq") return SB.usableRegentsQuestion(q);
      return true;
    }
    if (q.type !== "mcq") return true;
    if (hasReliableStimulus(q)) return true;
    return !promptNeedsStimulus(q);
  }
  function resolveStimulusSrc(src) {
    const v = String(src || "").trim();
    if (!v) return "";
    if (/^(https?:|data:|blob:)/i.test(v)) return v;
    if (v.startsWith("../../") || v.startsWith("../")) return v;
    if (v.startsWith("assets/")) return `../../${v}`;
    return v;
  }

  // ─── Question bank ────────────────────────────────────────────────────────
  async function loadBank() {
    els.startBtn.disabled = true;
    els.startBtn.textContent = "Loading...";
    const r = await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
    if (!r.ok) throw new Error(`Bank failed: ${r.status}`);
    state.bank = await r.json();
    state.bank.questions = (state.bank.questions || []).filter(isPlayableQuestion);
    rebuildSetIndex();
    populateFilters();
    applyFilters();
    els.startBtn.disabled = false;
    els.startBtn.textContent = "Launch Table";
  }

  function rebuildSetIndex() {
    const byCourse = {};
    for (const q of state.bank.questions) {
      if (!q.course || !q.set) continue;
      if (!byCourse[q.course]) byCourse[q.course] = new Set();
      byCourse[q.course].add(q.set);
    }
    state.bank.courses = Object.keys(byCourse).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    state.bank.setsByCourse = Object.fromEntries(
      Object.entries(byCourse).map(([c, s]) => [c, [...s].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))])
    );
  }

  function populateFilters() {
    els.courseFilter.innerHTML = ["All Courses", ...state.bank.courses]
      .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    populateSets();
  }

  function populateSets() {
    const course = els.courseFilter.value || "All Courses";
    const sets = course === "All Courses" ? ["All Sets"] : ["All Sets", ...(state.bank.setsByCourse[course] || [])];
    els.setFilter.innerHTML = sets.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  }

  function applyFilters() {
    const course = els.courseFilter.value || "All Courses";
    const set = els.setFilter.value || "All Sets";
    state.filtered = state.bank.questions.filter(q => {
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
    const mcq = state.filtered.filter(q => q.type === "mcq").length;
    const src = state.filtered.filter(hasReliableStimulus).length;
    const best = Number(localStorage.getItem(`${STORAGE_KEY}:highScore`) || 0);
    els.setupMetrics.innerHTML = [
      `${formatNumber(total)} review prompts`,
      `${formatNumber(mcq)} MCQs`,
      `${formatNumber(src)} source-based`,
      `Best: ${formatNumber(best)}`
    ].map(t => `<span class="metric-pill">${escapeHtml(t)}</span>`).join("");
  }

  function prepareQueue() { state.queue = shuffle(state.filtered); }

  function nextQuestion() {
    if (!state.queue.length) prepareQueue();
    return state.queue.pop() || state.filtered[Math.floor(Math.random() * state.filtered.length)];
  }

  function buildChoices(q) {
    const answer = cleanText(q.answer);
    let choices = [];
    if (q.type === "mcq" && Array.isArray(q.choices) && q.choices.length) {
      const correctLabel = String(q.correct || "");
      const correct = q.choices.find(c => String(c.label) === correctLabel)?.text || answer;
      choices = q.choices.map(c => ({ text: cleanText(c.text), correct: normalize(c.text) === normalize(correct) })).filter(c => c.text);
      if (!choices.some(c => c.correct)) choices.unshift({ text: cleanText(correct), correct: true });
    } else {
      const pool = shuffle([
        ...state.filtered.filter(x => x.id !== q.id && x.answer && (x.set === q.set || x.course === q.course)).map(x => cleanText(x.answer)),
        ...state.bank.questions.filter(x => x.id !== q.id && x.answer).map(x => cleanText(x.answer))
      ].filter(t => t && normalize(t) !== normalize(answer)));
      const unique = [...new Map(pool.map(t => [normalize(t), t])).values()];
      choices = [{ text: answer, correct: true }, ...unique.slice(0, 3).map(t => ({ text: t, correct: false }))];
    }
    while (choices.length < 4) choices.push({ text: ["Constitutionalism", "Nationalism", "Sovereignty", "Industrialization"][choices.length] || "Review term", correct: false });
    const deduped = [...new Map(choices.map(c => [normalize(c.text), c])).values()];
    if (!deduped.some(c => c.correct)) deduped.unshift({ text: answer, correct: true });
    return shuffle(deduped).slice(0, 4);
  }

  // ─── Ball factory ─────────────────────────────────────────────────────────
  let _ballId = 0;
  function newBall(stuck = true) {
    return {
      x: 768, y: stuck ? 1210 : 1130,
      vx: stuck ? 0 : -240 + Math.random() * 480,
      vy: stuck ? 0 : -740 - Math.random() * 240,
      r: 16,
      stuck,
      launchLane: false,
      trail: [],
      spin: Math.random() * Math.PI * 2,
      stuckTimer: 0,
      id: ++_ballId
    };
  }

  // ─── Game lifecycle ───────────────────────────────────────────────────────
  function resetGameState() {
    state.score = 0; state.scoreCountTarget = 0; state.scoreDisplay = 0;
    state.ballsLeft = els.modeFilter.value === "endless" ? 5 : 3;
    state.multiplier = 1; state.bonus = 0; state.bonusMult = 1;
    state.eraTargets = buildEraTargets();
    state.eraCompleted = 0; state.missionsCompleted = 0;
    state.currentMissionEra = -1; state.missionStep = 0; state.missionRampDone = false;
    state.wizardMode = false; state.wizardTimer = 0;
    state.multiBallActive = false; state.lockedBalls = 0;
    state.combo = 0; state.bestCombo = 0;
    state.answered = 0; state.correct = 0; state.missed = [];
    state.balls = [newBall(true)];
    state.particles = []; state.floatText = [];
    state.tiltWarnings = 0; state.tiltLocked = false; state.tiltLockTimer = 0;
    state.leftActive = false; state.rightActive = false;
    state.plungerHeld = false; state.plungerCharge = 0;
    state.launchHint = 3.5; state.launchInputAt = 0; state.ballSave = 0;
    state.shake = 0; state.elapsed = 0;
    state.feedbackUntil = 0; state.missionStreak = 0;
    state.currentQuestion = null; state.currentChoices = [];
    state.skillShotLane = Math.floor(Math.random() * 3);
    TOP_LANES.forEach((l, i) => { l.lit = i === state.skillShotLane; l.cooldown = 0; });
    state.rampsMade = 0;
    state.spinnerFlash = [0, 0];
    state.flipperFlash = [0, 0];
    state.slingFlash = [0, 0];
    RAMPS.forEach(r => { r.active = false; r.flash = 0; });
    BUMPERS.forEach(b => { b.flash = 0; });
    updateHud();
    setMission("Chrono Pinball", "Hold SPACE / Launch button to charge plunger. Z = left flipper  / = right flipper  T = tilt.", "");
  }

  function startGame() {
    audio.ensure();
    resetGameState();
    state.mode = "playing"; state.running = true;
    state.last = performance.now();
    hideAllScreens();
    window.MrMacsAnalytics?.track("game_play", { gameId: "chrono-pinball", title: "Chrono Pinball", course: els.courseFilter.value || "All Courses", gameType: "Pinball" }, { counter: "game-plays", once: false });
  }

  function hideAllScreens() {
    els.setupScreen.classList.remove("show");
    els.endScreen.classList.remove("show");
    els.pauseScreen.classList.remove("show");
    els.questionScreen.classList.remove("show");
  }

  function setMission(kicker, text, feedback, tone = "") {
    els.missionKicker.textContent = kicker;
    els.missionText.textContent = text;
    els.missionFeedback.textContent = feedback || "";
    els.missionFeedback.className = `mission-feedback ${tone}`;
    state.feedbackUntil = state.elapsed + 5;
  }

  function updateHud() {
    // score count-up is handled in update(), just set display value
    els.score.textContent = formatNumber(state.scoreDisplay);
    els.balls.textContent = String(Math.max(0, state.ballsLeft));
    els.multiplier.textContent = state.wizardMode ? "5×WIZ" : `${state.multiplier}x`;
    // locks shows era progress
    const erasDone = state.eraTargets.filter(e => e.completed).length;
    els.locks.textContent = `${erasDone}/5`;
  }

  function addScore(points, x, y, color = "#f5c451", label = "") {
    const mult = state.wizardMode ? 5 : state.multiplier;
    const value = Math.floor(points * mult);
    state.scoreCountTarget += value;
    state.bonus += Math.floor(points * 0.1);
    state.combo++;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    addText(x, y, label || `+${formatNumber(value)}`, color);
  }

  function addText(x, y, text, color) {
    state.floatText.push({ x, y, text, color, life: 1.1, vy: -52 - Math.random() * 24 });
  }

  function addParticles(x, y, count, color, power = 1) {
    const budget = MAX_PARTICLES - state.particles.length;
    const n = Math.min(count, Math.max(0, budget));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (100 + Math.random() * 460) * power;
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: 1.5 + Math.random() * 4.5, color, life: 0.35 + Math.random() * 0.6 });
    }
  }

  // ─── Physics helpers ──────────────────────────────────────────────────────
  function closestPointOnSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
    return { x: x1 + dx * t, y: y1 + dy * t, t };
  }

  function reflectBall(ball, nx, ny, bounce = 0.85, boost = 0) {
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) {
      ball.vx -= (1 + bounce) * dot * nx;
      ball.vy -= (1 + bounce) * dot * ny;
    }
    if (boost) { ball.vx += nx * boost; ball.vy += ny * boost; }
  }

  function segCollide(ball, x1, y1, x2, y2, bounce = 0.84) {
    const cp = closestPointOnSeg(ball.x, ball.y, x1, y1, x2, y2);
    const dx = ball.x - cp.x, dy = ball.y - cp.y;
    const dist = hypot(dx, dy) || 0.001;
    const minD = ball.r + 6;
    if (dist >= minD) return false;
    const nx = dx / dist, ny = dy / dist;
    ball.x += nx * (minD - dist);
    ball.y += ny * (minD - dist);
    reflectBall(ball, nx, ny, bounce);
    return true;
  }

  // ─── Update per frame ─────────────────────────────────────────────────────
  function update(dt) {
    state.elapsed += dt;

    // Score count-up animation
    if (state.scoreDisplay < state.scoreCountTarget) {
      const diff = state.scoreCountTarget - state.scoreDisplay;
      state.scoreDisplay = Math.min(state.scoreCountTarget, state.scoreDisplay + Math.max(1, diff * 0.12));
      els.score.textContent = formatNumber(state.scoreDisplay);
    }

    if (state.mode !== "playing") {
      updateParticles(dt);
      if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 4);
      return;
    }

    // Tilt lockout timer
    if (state.tiltLocked) {
      state.tiltLockTimer -= dt;
      if (state.tiltLockTimer <= 0) { state.tiltLocked = false; state.tiltWarnings = 0; }
    }

    // Wizard mode countdown
    if (state.wizardMode) {
      state.wizardTimer -= dt;
      if (state.wizardTimer <= 0) {
        state.wizardMode = false;
        setMission("Wizard mode ended", "All eras mastered. Keep scoring to build your legacy.", "", "");
        updateHud();
      }
    }

    if (state.launchHint > 0) state.launchHint = Math.max(0, state.launchHint - dt);
    if (state.plungerHeld) state.plungerCharge = clamp(state.plungerCharge + dt * 1.1, 0, 1);
    if (state.ballSave > 0) state.ballSave = Math.max(0, state.ballSave - dt);

    // Spinner decay
    SPINNERS.forEach((sp, i) => {
      sp.spin *= 0.93;
      sp.angle += sp.spin * dt;
      state.spinnerFlash[i] = Math.max(0, state.spinnerFlash[i] - dt * 3);
    });

    // Ramp flash decay
    RAMPS.forEach(rp => { rp.flash = Math.max(0, rp.flash - dt * 2); });

    // Sling flash decay
    state.slingFlash = state.slingFlash.map(v => Math.max(0, v - dt * 4));
    state.flipperFlash = state.flipperFlash.map(v => Math.max(0, v - dt * 3));

    // Era target cooldowns
    for (const era of state.eraTargets) {
      for (const t of era.targets) {
        t.flash = Math.max(0, t.flash - dt * 3);
        t.cooldown = Math.max(0, t.cooldown - dt);
      }
    }

    // Top lane cooldowns
    TOP_LANES.forEach(l => { l.cooldown = Math.max(0, l.cooldown - dt); });

    // Ball physics with substeps (launch-lane balls handled in loop())
    for (const ball of [...state.balls]) {
      if (!ball.stuck && !ball.launchLane) updateBall(ball, dt);
    }
    if (state.balls.length === 0) serveOrEnd();

    // Multiball tracking
    const liveBalls = state.balls.filter(b => !b.stuck).length;
    if (state.multiBallActive && liveBalls <= 1) {
      state.multiBallActive = false;
      setMission("Multiball ended", "Down to last ball. Keep scoring!", "", "bad");
    }

    updateParticles(dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 3.5);
    if (state.feedbackUntil && state.elapsed > state.feedbackUntil) {
      els.missionFeedback.textContent = "";
      els.missionFeedback.className = "mission-feedback";
      state.feedbackUntil = 0;
    }
    updateHud();
  }

  function updateBall(ball, dt) {
    const subDt = dt / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s++) {
      // Velocity Verlet step
      ball.vy += GRAVITY * subDt;

      // Friction on rails
      ball.vx *= 0.9994;
      ball.vy *= 0.9994;

      // Speed cap
      const speed = hypot(ball.vx, ball.vy);
      if (speed > 1900) {
        ball.vx = ball.vx / speed * 1900;
        ball.vy = ball.vy / speed * 1900;
      }

      ball.x += ball.vx * subDt;
      ball.y += ball.vy * subDt;
      ball.spin += ball.vx * subDt * 0.013;

      // Stuck-ball nudge
      if (speed < 60) {
        ball.stuckTimer = (ball.stuckTimer || 0) + subDt;
        if (ball.stuckTimer > 3) {
          ball.vx += (Math.random() - 0.5) * 180;
          ball.vy -= 140;
          ball.stuckTimer = 0;
        }
      } else {
        ball.stuckTimer = 0;
      }

      // Boundary
      collideBounds(ball);

      // Walls
      for (const w of WALLS) segCollide(ball, w[0], w[1], w[2], w[3], 0.82);

      // Bumpers
      for (let i = 0; i < BUMPERS.length; i++) collideBumper(ball, BUMPERS[i], i);

      // Slingshots
      for (let i = 0; i < SLINGS.length; i++) collideSling(ball, SLINGS[i], i);

      // Ramps
      for (const rp of RAMPS) collideRamp(ball, rp);

      // Spinners
      for (let i = 0; i < SPINNERS.length; i++) collideSpinner(ball, SPINNERS[i], i);

      // Era drop-targets
      for (const era of state.eraTargets) {
        if (!era.completed) {
          for (const t of era.targets) collideEraTarget(ball, t, era);
        }
      }

      // Top lanes
      for (let i = 0; i < TOP_LANES.length; i++) collideTopLane(ball, TOP_LANES[i], i);

      // Flippers
      collideFlipper(ball, getFlipper("left"), 0);
      collideFlipper(ball, getFlipper("right"), 1);
    }

    // Trail
    ball.trail.push({ x: ball.x, y: ball.y, life: 0.44 });
    if (ball.trail.length > 18) ball.trail.shift();

    if (ball.y > TABLE_H + 80) drainBall(ball);
  }

  // Launch-lane special movement
  function updateLaunchLaneBall(ball, dt) {
    ball.x = lerp(ball.x, 768, 0.18);
    ball.vy = Math.min(ball.vy, -1080);
    ball.y += ball.vy * dt;
    ball.spin += ball.vy * dt * 0.016;
    ball.trail.push({ x: ball.x, y: ball.y, life: 0.44 });
    if (ball.trail.length > 16) ball.trail.shift();
    if (ball.y <= 168) {
      ball.launchLane = false;
      ball.x = 710; ball.y = 178;
      ball.vx = -540 - Math.random() * 100;
      ball.vy = 190 + Math.random() * 100;
      addParticles(ball.x, ball.y, 18, "#75ecff", 0.8);
      addText(ball.x, ball.y + 20, "ORBIT!", "#75ecff");
    }
  }

  function collideBounds(ball) {
    const left = 80 + ball.r, right = 820 - ball.r, top = 72 + ball.r;
    if (ball.x < left)  { ball.x = left;  ball.vx =  Math.abs(ball.vx) * 0.82; }
    if (ball.x > right) { ball.x = right; ball.vx = -Math.abs(ball.vx) * 0.82; }
    if (ball.y < top)   { ball.y = top;   ball.vy =  Math.abs(ball.vy) * 0.84; }
    // Plunger-lane right wall
    if (ball.x > 724 - ball.r && ball.y > 160) {
      ball.x = 724 - ball.r;
      ball.vx = -Math.abs(ball.vx) * 0.8;
    }
  }

  function collideBumper(ball, b, idx) {
    const dx = ball.x - b.x, dy = ball.y - b.y;
    const dist = hypot(dx, dy) || 0.001;
    const minD = ball.r + b.r;
    if (dist >= minD) return;
    const nx = dx / dist, ny = dy / dist;
    ball.x = b.x + nx * minD;
    ball.y = b.y + ny * minD;
    reflectBall(ball, nx, ny, 1.0, 480);
    b.flash = 1;
    state.shake = Math.max(state.shake, 0.09);
    addScore(b.score + state.combo * 15, b.x, b.y - b.r - 20, b.color);
    addParticles(ball.x, ball.y, FX_LITE ? 12 : 22, b.color, 1.1);
    audio.bumper(idx);
  }

  function collideSling(ball, sling, idx) {
    const hit = segCollide(ball, sling.x1, sling.y1, sling.x2, sling.y2, 0.92);
    if (!hit) return;
    // Extra kick
    const dx = sling.x2 - sling.x1, dy = sling.y2 - sling.y1;
    const len = hypot(dx, dy) || 1;
    const nx = -dy / len * (sling.side === "left" ? 1 : -1);
    const ny = dx / len * (sling.side === "left" ? 1 : -1);
    ball.vx += nx * 360;
    ball.vy += ny * 360 - 120;
    state.slingFlash[idx] = 1;
    state.shake = Math.max(state.shake, 0.06);
    addScore(580, (sling.x1 + sling.x2) / 2, (sling.y1 + sling.y2) / 2 - 20, sling.color, "SLING!");
    addParticles((sling.x1 + sling.x2) / 2, (sling.y1 + sling.y2) / 2, FX_LITE ? 8 : 14, sling.color, 0.8);
    audio.sling();
  }

  function collideRamp(ball, rp) {
    // Treat ramp as a horizontal gate
    const cx = clamp(ball.x, rp.x, rp.x + rp.w);
    const cy = clamp(ball.y, rp.y, rp.y + rp.h);
    const dx = ball.x - cx, dy = ball.y - cy;
    const dist = hypot(dx, dy);
    if (dist > ball.r + 2) return;
    // Deflect upward and teleport ball to ramp exit
    rp.flash = 1; rp.active = true;
    state.rampsMade++;
    const pts = 4200 + state.rampsMade * 800;
    addScore(pts, rp.x + rp.w / 2, rp.y - 30, rp.color, `${rp.label}!`);
    addParticles(rp.x + rp.w / 2, rp.y, FX_LITE ? 14 : 26, rp.color, 1.2);
    audio.ramp();
    state.shake = Math.max(state.shake, 0.12);
    // Advance mission ramp requirement
    if (state.currentMissionEra >= 0 && !state.missionRampDone) {
      state.missionRampDone = true;
      addText(rp.x + rp.w / 2, rp.y - 60, "MISSION RAMP!", "#f5c451");
    }
    // Teleport ball to exit
    ball.x = rp.exitX; ball.y = rp.exitY;
    ball.vx = rp.exitVx; ball.vy = rp.exitVy;
    // Bonus multiplier advance every 3 ramps
    if (state.rampsMade % 3 === 0 && state.bonusMult < 5) {
      state.bonusMult++;
      addText(rp.exitX, rp.exitY - 40, `BONUS ${state.bonusMult}×`, "#69f3a9");
    }
  }

  function collideSpinner(ball, sp, idx) {
    // Spinner is a vertical line segment
    const cp = closestPointOnSeg(ball.x, ball.y, sp.x, sp.y, sp.x, sp.y + sp.h);
    const dx = ball.x - cp.x, dy = ball.y - cp.y;
    const dist = hypot(dx, dy) || 0.001;
    if (dist >= ball.r + 4) return;
    const nx = dx / dist;
    ball.x += nx * (ball.r + 4 - dist);
    ball.vx = -ball.vx * 0.72;
    sp.spin = ball.vx * 0.04;
    state.spinnerFlash[idx] = 0.8;
    addScore(sp.score, sp.x, sp.y - 20, sp.color);
    audio.spinner();
  }

  function collideEraTarget(ball, t, era) {
    if (t.down || t.cooldown > 0) return;
    const cx = clamp(ball.x, t.x, t.x + t.w);
    const cy = clamp(ball.y, t.y, t.y + t.h);
    const dx = ball.x - cx, dy = ball.y - cy;
    if (hypot(dx, dy) > ball.r + 2) return;
    t.down = true; t.flash = 1; t.cooldown = 0.4;
    const nx = Math.abs(dy) > Math.abs(dx) ? 0 : (dx > 0 ? 1 : -1);
    const ny = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0;
    reflectBall(ball, nx, ny, 0.86, 100);
    addScore(1400, t.x + t.w / 2, t.y - 18, era.color, `${era.era.slice(0, 6)}!`);
    addParticles(t.x + t.w / 2, t.y, FX_LITE ? 10 : 18, era.color, 0.9);
    audio.dropTarget();
    state.shake = Math.max(state.shake, 0.05);

    // Check if all targets in this era row are down
    if (era.targets.every(tt => tt.down) && !era.completed) {
      era.completed = true;
      state.eraCompleted++;
      state.bonus += 5000;
      setTimeout(() => startEraMission(era), 300);
    }
  }

  function collideTopLane(ball, lane, idx) {
    if (lane.cooldown > 0) return;
    const cx = clamp(ball.x, lane.x, lane.x + lane.w);
    const cy = clamp(ball.y, lane.y, lane.y + lane.h);
    const dx = ball.x - cx, dy = ball.y - cy;
    if (hypot(dx, dy) > ball.r + 2) return;
    lane.cooldown = 1.8;
    // Skill shot check
    if (lane.lit && idx === state.skillShotLane) {
      addScore(50000, lane.x + lane.w / 2, lane.y - 30, "#f5c451", "SKILL SHOT!");
      addParticles(lane.x + lane.w / 2, lane.y, FX_LITE ? 20 : 36, "#f5c451", 1.4);
      audio.skillShot();
      state.shake = Math.max(state.shake, 0.15);
      lane.lit = false;
    } else {
      addScore(lane.score, lane.x + lane.w / 2, lane.y, lane.color, lane.label);
      addParticles(lane.x + lane.w / 2, lane.y, FX_LITE ? 8 : 14, lane.color, 0.7);
      audio.dropTarget();
    }
    state.ballSave = Math.max(state.ballSave, 3.5);
  }

  function collideFlipper(ball, flipper, fIdx) {
    const cp = closestPointOnSeg(ball.x, ball.y, flipper.pivot.x, flipper.pivot.y, flipper.end.x, flipper.end.y);
    const dx = ball.x - cp.x, dy = ball.y - cp.y;
    const dist = hypot(dx, dy) || 0.001;
    const radius = ball.r + 16;
    if (dist >= radius || cp.t < -0.04 || cp.t > 1.04) return;
    let nx = dx / dist, ny = dy / dist;
    if (ny > 0.6) { nx = -nx; ny = -ny; }
    ball.x += nx * (radius - dist);
    ball.y += ny * (radius - dist);
    reflectBall(ball, nx, ny, 0.80);
    if (flipper.active) {
      const side = flipper.side === "left" ? 1 : -1;
      const sweet = 0.5 + cp.t * 0.7;
      ball.vx += side * 340 * sweet;
      ball.vy = Math.min(ball.vy, -820 * sweet - Math.abs(ball.vx) * 0.10);
      state.flipperFlash[fIdx] = 1;
      addParticles(cp.x, cp.y, FX_LITE ? 5 : 9, flipper.side === "left" ? "#75ecff" : "#ff7bcc", 0.45);
    }
  }

  function drainBall(ball) {
    state.balls = state.balls.filter(b => b.id !== ball.id);
    addParticles(ball.x, TABLE_H - 50, FX_LITE ? 10 : 20, "#ff5d68", 0.7);
    audio.drain();
    if (state.balls.length) return;
    if (state.ballSave > 0) {
      state.ballSave = 0;
      setMission("Ball Save!", "Shield activated — ball returned to plunger.", "saved!", "good");
      state.balls.push(newBall(true));
      return;
    }
    // End-of-ball bonus
    showBallBonus();
    state.ballsLeft--;
    state.combo = 0;
    state.multiplier = Math.max(1, state.multiplier - 1);
  }

  function showBallBonus() {
    if (state.bonus <= 0) return;
    const total = Math.floor(state.bonus * state.bonusMult);
    state.scoreCountTarget += total;
    addText(450, 700, `BALL BONUS +${formatNumber(total)}`, "#f5c451");
    state.bonus = 0;
    // Small audio flourish
    for (let i = 0; i < 6; i++) setTimeout(() => audio.bonusCount(), i * 60);
  }

  function serveOrEnd() {
    if (state.ballsLeft > 0) {
      state.balls.push(newBall(true));
      state.launchHint = 3.5;
      // Reset era targets for next ball
      state.eraTargets.forEach(era => {
        if (!era.completed) era.targets.forEach(t => { t.down = false; t.flash = 0; });
      });
      setMission("Ball drained", `${state.ballsLeft} ball${state.ballsLeft === 1 ? "" : "s"} remaining. Launch to continue.`, "next ball ready", "bad");
    } else {
      endGame();
    }
  }

  // ─── Era Mission system ───────────────────────────────────────────────────
  function startEraMission(era) {
    if (state.mode !== "playing") return;
    state.currentMissionEra = state.eraTargets.indexOf(era);
    state.missionStep = 0;
    state.missionRampDone = false;
    state.mode = "question";
    state.running = false;
    state.currentQuestion = nextQuestion();
    state.currentChoices = buildChoices(state.currentQuestion);
    renderQuestion(`${era.era} MISSION · Q 1/3`);
    els.questionScreen.classList.add("show");
    audio.modeStart();
    state.shake = 0.2;
    addText(450, 500, `${era.era} MISSION!`, era.color);
    setMission(`${era.era} Mission started`, "Answer 3 questions while keeping the ball alive + hit 1 ramp for jackpot!", "", "good");
  }

  function renderQuestion(metaOverride) {
    const q = state.currentQuestion;
    if (!q) return;
    const metaText = metaOverride || cleanText(`${q.course || "Social Studies"} | ${q.set || q.subject || "Review"}`);
    els.questionMeta.textContent = metaText;
    els.questionPrompt.textContent = displayPrompt(q);
    els.explanation.textContent = "";
    els.explanation.className = "explanation";
    renderStimulus(q);
    els.choiceGrid.innerHTML = state.currentChoices.map((c, i) =>
      `<button type="button" data-index="${i}">${escapeHtml(c.text)}</button>`
    ).join("");
    els.choiceGrid.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => answerQuestion(Number(btn.dataset.index)));
    });
  }

  function renderStimulus(q) {
    const imgs = stimulusImagesFor(q);
    const text = stimulusTextFor(q);
    if (!imgs.length && !text) {
      els.stimulusBox.classList.remove("show");
      els.stimulusBox.innerHTML = "";
      return;
    }
    const imgHtml = imgs.slice(0, 2).map((img, i) =>
      `<img src="${escapeHtml(resolveStimulusSrc(img.src))}" alt="${escapeHtml(img.label || `Stimulus ${i + 1}`)}">`
    ).join("");
    const textHtml = text ? `<div class="stimulus-text">${escapeHtml(text)}</div>` : "";
    els.stimulusBox.innerHTML = imgHtml + textHtml;
    els.stimulusBox.classList.add("show");
  }

  function answerQuestion(index) {
    if (state.mode !== "question") return;
    const q = state.currentQuestion;
    const choice = state.currentChoices[index];
    if (!q || !choice) return;
    state.answered++;
    const buttons = [...els.choiceGrid.querySelectorAll("button")];
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.toggle("correct", !!state.currentChoices[i]?.correct);
      if (i === index && !choice.correct) btn.classList.add("wrong");
    });
    if (choice.correct) {
      state.correct++; state.missionStreak++;
      state.multiplier = clamp(state.multiplier + 1, 1, 6);
      state.ballSave = Math.max(state.ballSave, 10);
      addScore(6000 + state.missionStreak * 900, 450, 600, "#69f3a9", "CORRECT!");
      els.explanation.textContent = displayExplanation(q);
      els.explanation.className = "explanation good";
      audio.correct();
    } else {
      state.missionStreak = 0;
      state.multiplier = Math.max(1, state.multiplier - 1);
      state.missed.push(q);
      addScore(400, 450, 600, "#ff5d68", "REVIEW");
      els.explanation.textContent = `Correct: ${cleanText(q.answer)}. ${displayExplanation(q)}`;
      els.explanation.className = "explanation bad";
      audio.wrong();
    }

    // Advance mission steps
    state.missionStep++;
    const era = state.eraTargets[state.currentMissionEra];
    const modeLabel = era ? era.era : "MISSION";
    if (state.missionStep < 3) {
      els.questionMeta.textContent = `${modeLabel} · Q ${state.missionStep + 1}/3`;
      setTimeout(() => {
        state.currentQuestion = nextQuestion();
        state.currentChoices = buildChoices(state.currentQuestion);
        renderQuestion(`${modeLabel} · Q ${state.missionStep + 1}/3`);
      }, choice.correct ? 1400 : 2200);
    } else {
      // Mission complete — check jackpot
      const jackpot = choice.correct && state.missionRampDone;
      const jackptPts = 50000 + state.missionsCompleted * 30000;
      if (jackpot) {
        addScore(jackptPts, 450, 550, "#f5c451", "JACKPOT!");
        audio.wizard();
        state.shake = 0.25;
      }
      state.missionsCompleted++;

      // Check wizard mode (all 5 era missions done)
      if (state.missionsCompleted >= 5 && !state.wizardMode) {
        setTimeout(() => triggerWizardMode(), 600);
      } else if (state.missionsCompleted % 2 === 0) {
        // Multiball every 2 missions
        setTimeout(() => spawnMultiball(), 500);
      }

      setTimeout(closeMission, choice.correct ? 1600 : 2400);
    }
  }

  function closeMission() {
    if (state.mode !== "question") return;
    els.questionScreen.classList.remove("show");
    state.mode = "playing"; state.running = true;
    if (!state.balls.length || state.balls.every(b => b.stuck)) {
      if (!state.balls.some(b => b.stuck)) state.balls.push(newBall(true));
    }
    state.currentMissionEra = -1;
    setMission("Mission complete", "Clear the next era row to start another mission.", "+multiplier banked", "good");
  }

  function triggerWizardMode() {
    state.wizardMode = true; state.wizardTimer = 60;
    spawnMultiball();
    audio.wizard();
    state.shake = 0.3;
    addText(450, 450, "WIZARD MODE!", "#f5c451");
    setMission("WIZARD MODE", "All 5 eras mastered! 5× scoring + multiball for 60 seconds!", "WIZARD!", "good");
    updateHud();
  }

  function spawnMultiball() {
    if (state.mode !== "playing" && state.mode !== "question") return;
    const toSpawn = Math.min(3 - state.balls.filter(b => !b.stuck).length, 2);
    for (let i = 0; i < toSpawn; i++) {
      const b = newBall(false);
      b.x = 400 + Math.random() * 100;
      b.y = 500 + Math.random() * 100;
      b.vx = -480 + Math.random() * 960;
      b.vy = -560 - Math.random() * 300;
      state.balls.push(b);
      addParticles(b.x, b.y, FX_LITE ? 16 : 28, i ? "#ff7bcc" : "#75ecff", 1.15);
    }
    if (toSpawn > 0) {
      state.multiBallActive = true;
      audio.multiball();
      state.shake = 0.22;
      addText(450, 480, "MULTIBALL!", "#f5c451");
      setMission("MULTIBALL!", "Keep all balls alive and keep scoring.", "multiball active", "good");
    }
  }

  // ─── Particles ────────────────────────────────────────────────────────────
  function initStars() {
    state.stars = Array.from({ length: FX_LITE ? 100 : 190 }, () => ({
      x: Math.random(), y: Math.random(),
      z: 0.2 + Math.random() * 0.9,
      hue: Math.random() > 0.72 ? "#f5c451" : (Math.random() > 0.5 ? "#75ecff" : "#ffffff")
    }));
  }

  function updateParticles(dt) {
    for (const st of state.stars) {
      st.y += dt * 0.012 * st.z;
      if (st.y > 1.02) { st.y = -0.02; st.x = Math.random(); }
    }
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.985; p.vy = p.vy * 0.985 + 110 * dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);
    for (const t of state.floatText) {
      t.life -= dt; t.y += t.vy * dt; t.vy *= 0.97;
    }
    state.floatText = state.floatText.filter(t => t.life > 0);
  }

  // ─── Pause / end ──────────────────────────────────────────────────────────
  function pauseGame() {
    if (state.mode !== "playing") return;
    state.pausedAtMode = state.mode;
    state.mode = "paused"; state.running = false;
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
    state.mode = "ended"; state.running = false;
    els.endScreen.classList.add("show");
    const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
    // Persistence
    const prevBest = Number(localStorage.getItem(`${STORAGE_KEY}:highScore`) || 0);
    if (Math.floor(state.scoreCountTarget) > prevBest)
      localStorage.setItem(`${STORAGE_KEY}:highScore`, String(Math.floor(state.scoreCountTarget)));
    const prevEra = Number(localStorage.getItem(`${STORAGE_KEY}:bestEra`) || 0);
    if (state.eraCompleted > prevEra)
      localStorage.setItem(`${STORAGE_KEY}:bestEra`, String(state.eraCompleted));
    if (state.wizardMode || state.missionsCompleted >= 5) {
      const wc = Number(localStorage.getItem(`${STORAGE_KEY}:wizardCount`) || 0) + 1;
      localStorage.setItem(`${STORAGE_KEY}:wizardCount`, String(wc));
    }

    els.endTitle.textContent = Math.floor(state.scoreCountTarget) > prevBest ? "New table record!" : "Archive table closed";
    els.endGrid.innerHTML = [
      [formatNumber(state.scoreCountTarget), "final score"],
      [`${accuracy}%`, "accuracy"],
      [`${state.correct}/${state.answered}`, "missions"],
      [String(state.bestCombo), "best combo"],
      [String(state.eraCompleted), "eras done"],
      [String(state.rampsMade), "ramps made"]
    ].map(([v, l]) => `<div class="end-tile"><strong>${escapeHtml(v)}</strong><span>${escapeHtml(l)}</span></div>`).join("");

    if (state.missed.length) {
      const items = state.missed.slice(-5).map(q =>
        `<p><strong>${escapeHtml(cleanText(q.answer))}</strong>: ${escapeHtml(displayPrompt(q))}</p>`
      ).join("");
      els.studyTargets.innerHTML = `<strong>Study targets from this run</strong>${items}`;
    } else {
      els.studyTargets.innerHTML = "<strong>No missed missions — excellent recall!</strong>";
    }

    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "chrono-pinball", title: "Chrono Pinball",
      score: Math.floor(state.scoreCountTarget), accuracy,
      questions: state.answered, course: els.courseFilter.value || "All Courses"
    }, { counter: "game-completions", once: false });
  }

  function showSetup() {
    state.mode = "setup"; state.running = false;
    hideAllScreens();
    els.setupScreen.classList.add("show");
  }

  // ─── Tilt ─────────────────────────────────────────────────────────────────
  function tiltNudge() {
    if (state.mode !== "playing" || state.tiltLocked) return;
    state.tiltWarnings++;
    audio.tiltWarning();
    state.shake = 0.28;
    if (state.tiltWarnings >= 3) {
      state.tiltLocked = true;
      state.tiltLockTimer = 4;
      state.leftActive = false; state.rightActive = false;
      setMission("TILT!", "Flippers locked for 4 seconds. Be more careful with that machine!", "TILT PENALTY", "bad");
    } else {
      addText(450, 600, `TILT WARNING ${state.tiltWarnings}/3`, "#ff5d68");
      setMission("Tilt warning", `${3 - state.tiltWarnings} warning${3 - state.tiltWarnings === 1 ? "" : "s"} before lockout.`, `warning ${state.tiltWarnings}/3`, "bad");
    }
  }

  // ─── Plunger controls ─────────────────────────────────────────────────────
  function holdLaunch() {
    if (state.mode !== "playing") return;
    if (!state.balls.some(b => b.stuck)) return;
    state.plungerHeld = true; state.launchInputAt = performance.now();
    els.launchBtn.classList.add("active");
    audio.ensure();
  }

  function releaseLaunch() {
    if (state.mode !== "playing") { cancelLaunch(); return; }
    if (!state.plungerHeld && !state.balls.some(b => b.stuck)) return;
    const held = performance.now() - state.launchInputAt;
    launchStuckBall(held < 150 ? 0.58 : 0.22);
  }

  function quickLaunch() {
    if (state.mode !== "playing") return;
    launchStuckBall(0.72);
  }

  function cancelLaunch() {
    state.plungerHeld = false; state.plungerCharge = 0;
    els.launchBtn.classList.remove("active");
  }

  function launchStuckBall(minCharge = 0.55) {
    const ball = state.balls.find(b => b.stuck);
    if (!ball) { cancelLaunch(); return false; }
    const charge = clamp(Math.max(state.plungerCharge, minCharge), 0.22, 1);
    ball.stuck = false; ball.launchLane = true;
    ball.x = 768; ball.y = 1200;
    ball.vx = 0; ball.vy = -1060 - charge * 780;
    state.plungerHeld = false; state.plungerCharge = 0;
    state.launchHint = 0; state.shake = 0.14;
    els.launchBtn.classList.remove("active");
    audio.launch();
    addParticles(ball.x, ball.y + 20, FX_LITE ? 12 : 22, "#f5c451", 1.1);
    setMission("Ball launched!", "Hit bumpers, ramps, and light the era targets to start a mission.", "", "");
    return true;
  }

  function setFlipper(side, active) {
    if (state.tiltLocked) return;
    const prev = side === "left" ? state.leftActive : state.rightActive;
    if (!prev && active) audio.flipper();
    if (side === "left") { state.leftActive = active; els.leftFlip.classList.toggle("active", active); }
    else { state.rightActive = active; els.rightFlip.classList.toggle("active", active); }
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────
  function resize() {
    const dprLimit = window.matchMedia("(max-width: 820px)").matches ? 1.2 : 1.6;
    const dpr = Math.min(dprLimit, window.devicePixelRatio || 1);
    table.width = window.innerWidth; table.height = window.innerHeight; table.dpr = dpr;
    canvas.width  = Math.round(table.width  * dpr);
    canvas.height = Math.round(table.height * dpr);
    canvas.style.width  = `${table.width}px`;
    canvas.style.height = `${table.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wide = table.width > 1080 && table.width > table.height;
    const wb = table.width  * (wide ? 0.55 : 0.99);
    const hb = table.height * 0.99;
    table.scale = Math.min(wb / TABLE_W, hb / TABLE_H);
    table.ox = (table.width  - TABLE_W * table.scale) / 2;
    table.oy = (table.height - TABLE_H * table.scale) / 2;
  }

  function draw() {
    ctx.clearRect(0, 0, table.width, table.height);
    drawSpace();
    const sx = state.shake ? (Math.random() - 0.5) * state.shake * 22 : 0;
    const sy = state.shake ? (Math.random() - 0.5) * state.shake * 22 : 0;
    ctx.save();
    ctx.translate(table.ox + sx, table.oy + sy);
    ctx.scale(table.scale, table.scale);

    drawTableBody();
    drawTopLanes();
    drawBumpers();
    drawSlingshots();
    drawRamps();
    drawSpinners();
    drawEraTargets();
    drawFlippers();
    drawBalls();
    drawParticles();
    drawPlunger();
    drawHudOverlay();

    ctx.restore();
  }

  function drawSpace() {
    const g = ctx.createRadialGradient(table.width * 0.5, table.height * 0.42, 30, table.width * 0.5, table.height * 0.46, Math.max(table.width, table.height) * 0.75);
    g.addColorStop(0, "#121933");
    g.addColorStop(0.4, "#050817");
    g.addColorStop(1, "#03050d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, table.width, table.height);
    ctx.save();
    ctx.globalAlpha = FX_LITE ? 0.52 : 0.7;
    for (const st of state.stars) {
      ctx.fillStyle = st.hue;
      ctx.fillRect(st.x * table.width, st.y * table.height, st.z * 1.8, st.z * 1.8);
    }
    ctx.restore();
    if (!FX_LITE && state.wizardMode) {
      const wg = ctx.createRadialGradient(table.width * 0.5, table.height * 0.5, 0, table.width * 0.5, table.height * 0.5, table.width * 0.6);
      wg.addColorStop(0, `rgba(245,196,81,${0.06 + Math.sin(state.elapsed * 4) * 0.03})`);
      wg.addColorStop(1, "rgba(245,196,81,0)");
      ctx.fillStyle = wg;
      ctx.fillRect(0, 0, table.width, table.height);
    }
  }

  function roundRect(context, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + rad, y);
    context.lineTo(x + w - rad, y);
    context.quadraticCurveTo(x + w, y, x + w, y + rad);
    context.lineTo(x + w, y + h - rad);
    context.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    context.lineTo(x + rad, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - rad);
    context.lineTo(x, y + rad);
    context.quadraticCurveTo(x, y, x + rad, y);
    context.closePath();
  }

  function hexToRgba(hex, a) {
    const r = hex.replace("#", "");
    return `rgba(${parseInt(r.slice(0,2),16)},${parseInt(r.slice(2,4),16)},${parseInt(r.slice(4,6),16)},${a})`;
  }

  function drawTableBody() {
    // Outer cabinet
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 36; ctx.shadowOffsetY = 20;
    roundRect(ctx, 46, 42, 808, 1316, 44);
    const cab = ctx.createLinearGradient(46, 42, 854, 1358);
    cab.addColorStop(0, "#16213f"); cab.addColorStop(0.34, "#0b132a");
    cab.addColorStop(0.72, "#151326"); cab.addColorStop(1, "#070915");
    ctx.fillStyle = cab; ctx.fill(); ctx.restore();

    // Play field
    ctx.save();
    roundRect(ctx, 72, 68, 656, 1258, 36);
    const pf = ctx.createLinearGradient(72, 68, 728, 1326);
    pf.addColorStop(0, "#1b2f58"); pf.addColorStop(0.38, "#111d38");
    pf.addColorStop(0.72, "#1d1730"); pf.addColorStop(1, "#0b0d17");
    ctx.fillStyle = pf; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = state.wizardMode ? `rgba(245,196,81,${0.4 + Math.sin(state.elapsed * 6) * 0.2})` : "rgba(245,196,81,0.22)";
    ctx.stroke(); ctx.restore();

    // Decorative circuit lines
    if (!FX_LITE) {
      ctx.save(); ctx.globalAlpha = 0.28; ctx.lineWidth = 1.5;
      for (let y = 180; y < 1120; y += 88) {
        ctx.strokeStyle = y % 176 === 0 ? "rgba(117,236,255,0.20)" : "rgba(255,255,255,0.05)";
        ctx.beginPath(); ctx.moveTo(116, y);
        ctx.bezierCurveTo(280, y - 36, 580, y + 38, 724, y - 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Walls
    ctx.save(); ctx.lineCap = "round";
    for (const w of WALLS) {
      ctx.strokeStyle = "rgba(251,247,237,0.18)"; ctx.lineWidth = 15;
      ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); ctx.stroke();
      ctx.strokeStyle = "rgba(117,236,255,0.22)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); ctx.stroke();
    }
    ctx.restore();

    // Center emblem
    drawCenterEmblem();

    // Drain zone
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.44)";
    roundRect(ctx, 316, 1285, 268, 54, 22); ctx.fill();
    ctx.strokeStyle = "rgba(255,93,104,0.36)"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "900 17px Inter,system-ui,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("DRAIN", 450, 1320); ctx.restore();
  }

  function drawCenterEmblem() {
    ctx.save(); ctx.translate(400, 720);
    ctx.rotate(Math.sin(state.elapsed * 0.4) * 0.025);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 160);
    glow.addColorStop(0, state.wizardMode ? "rgba(245,196,81,0.20)" : "rgba(245,196,81,0.12)");
    glow.addColorStop(1, "rgba(245,196,81,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 160, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(245,196,81,0.28)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 96, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = i === 0 ? ctx.moveTo : ctx.lineTo;
      (i === 0 ? (x, y) => ctx.moveTo(x, y) : (x, y) => ctx.lineTo(x, y))(Math.cos(a) * 70, Math.sin(a) * 70);
    }
    ctx.closePath(); ctx.strokeStyle = "rgba(117,236,255,0.26)"; ctx.stroke();
    ctx.fillStyle = "rgba(251,247,237,0.08)"; ctx.fill();
    ctx.fillStyle = "rgba(251,247,237,0.62)";
    ctx.font = "900 22px Inter,system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("ARCHIVE", 0, -8);
    ctx.font = "800 13px Inter,system-ui,sans-serif"; ctx.fillStyle = "rgba(245,196,81,0.72)";
    ctx.fillText(state.wizardMode ? "★ WIZARD ★" : "REACTOR", 0, 18); ctx.restore();
  }

  function drawTopLanes() {
    for (let i = 0; i < TOP_LANES.length; i++) {
      const lane = TOP_LANES[i];
      const hot = lane.cooldown > 0;
      const lit = lane.lit;
      ctx.save();
      ctx.shadowColor = lane.color;
      ctx.shadowBlur = lit ? 28 : (hot ? 20 : 10);
      roundRect(ctx, lane.x, lane.y, lane.w, lane.h, 18);
      ctx.fillStyle = lit ? hexToRgba(lane.color, 0.32) : (hot ? hexToRgba(lane.color, 0.22) : "rgba(0,0,0,0.20)");
      ctx.fill();
      ctx.strokeStyle = hexToRgba(lane.color, lit ? 0.9 : 0.4); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = lit ? "#fbf7ed" : "rgba(251,247,237,0.72)";
      ctx.font = `${lit ? 900 : 800} 12px Inter,system-ui,sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(lane.label, lane.x + lane.w / 2, lane.y + lane.h / 2);
      if (lit) {
        ctx.fillStyle = "#f5c451"; ctx.font = "700 10px Inter,system-ui,sans-serif";
        ctx.fillText("SKILL", lane.x + lane.w / 2, lane.y + lane.h / 2 + 13);
      }
      ctx.restore();
    }
  }

  function drawBumpers() {
    for (let i = 0; i < BUMPERS.length; i++) {
      const b = BUMPERS[i];
      b.flash = Math.max(0, (b.flash || 0) - 0.022);
      const pulse = 0.5 + Math.sin(state.elapsed * 3.2 + i) * 0.5;
      const hot = b.flash + pulse * 0.18;
      ctx.save(); ctx.translate(b.x, b.y);
      ctx.shadowColor = b.color;
      ctx.shadowBlur = FX_LITE ? 12 + hot * 14 : 20 + hot * 26;
      const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, 6, 0, 0, b.r);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.2, b.color);
      g.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = "rgba(251,247,237,0.42)"; ctx.stroke();
      ctx.lineWidth = 1.8; ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath(); ctx.arc(0, 0, b.r - 12, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#06101e"; ctx.font = `900 ${b.r > 48 ? 21 : 16}px Inter,system-ui,sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(b.label, 0, 1); ctx.restore();
    }
  }

  function drawSlingshots() {
    for (let i = 0; i < SLINGS.length; i++) {
      const sl = SLINGS[i];
      const flash = state.slingFlash[i];
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = sl.color; ctx.shadowBlur = 8 + flash * 24;
      ctx.strokeStyle = hexToRgba(sl.color, 0.4 + flash * 0.5); ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(sl.x1, sl.y1); ctx.lineTo(sl.x2, sl.y2); ctx.stroke();
      ctx.strokeStyle = "rgba(251,247,237,0.55)"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(sl.x1, sl.y1); ctx.lineTo(sl.x2, sl.y2); ctx.stroke();
      ctx.restore();
    }
  }

  function drawRamps() {
    for (const rp of RAMPS) {
      ctx.save();
      ctx.shadowColor = rp.color; ctx.shadowBlur = 8 + rp.flash * 28;
      roundRect(ctx, rp.x, rp.y, rp.w, rp.h, 10);
      ctx.fillStyle = hexToRgba(rp.color, 0.18 + rp.flash * 0.22); ctx.fill();
      ctx.strokeStyle = hexToRgba(rp.color, 0.5 + rp.flash * 0.4); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = "rgba(251,247,237,0.78)";
      ctx.font = "800 11px Inter,system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(rp.label, rp.x + rp.w / 2, rp.y + rp.h / 2); ctx.restore();
    }
  }

  function drawSpinners() {
    for (let i = 0; i < SPINNERS.length; i++) {
      const sp = SPINNERS[i];
      const flash = state.spinnerFlash[i];
      ctx.save(); ctx.translate(sp.x, sp.y + sp.h / 2);
      ctx.rotate(sp.angle);
      ctx.shadowColor = sp.color; ctx.shadowBlur = 6 + flash * 20;
      ctx.strokeStyle = hexToRgba(sp.color, 0.5 + flash * 0.4); ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, -sp.h / 2); ctx.lineTo(0, sp.h / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.restore();
    }
  }

  function drawEraTargets() {
    for (const era of state.eraTargets) {
      for (const t of era.targets) {
        const oy = t.down ? 16 : 0;
        ctx.save(); ctx.translate(t.x, t.y + oy);
        ctx.shadowColor = era.color;
        ctx.shadowBlur = t.down ? 2 : (10 + t.flash * 20);
        roundRect(ctx, 0, 0, t.w, t.h, 6);
        ctx.fillStyle = t.down ? "rgba(0,0,0,0.28)" : hexToRgba(era.color, 0.32 + t.flash * 0.18); ctx.fill();
        ctx.strokeStyle = t.down ? "rgba(255,255,255,0.10)" : hexToRgba(era.color, 0.85); ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = t.down ? "rgba(255,255,255,0.28)" : "rgba(251,247,237,0.90)";
        ctx.font = "900 13px Inter,system-ui,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(t.label, t.w / 2, t.h / 2 + 1); ctx.restore();
      }
      // Era row label
      const firstT = era.targets[0];
      ctx.save();
      ctx.fillStyle = era.completed ? hexToRgba(era.color, 0.9) : hexToRgba(era.color, 0.5);
      ctx.font = `${era.completed ? 900 : 800} 10px Inter,system-ui,sans-serif`;
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(era.era, firstT.x, firstT.y - 4); ctx.restore();
    }
  }

  function drawFlippers() {
    drawOneFlipper(getFlipper("left"),  "#75ecff", state.flipperFlash[0]);
    drawOneFlipper(getFlipper("right"), "#ff7bcc", state.flipperFlash[1]);
  }

  function drawOneFlipper(f, color, flash) {
    ctx.save(); ctx.lineCap = "round";
    ctx.shadowColor = color; ctx.shadowBlur = f.active ? 28 : (10 + flash * 20);
    ctx.strokeStyle = "rgba(0,0,0,0.50)"; ctx.lineWidth = 40;
    ctx.beginPath(); ctx.moveTo(f.pivot.x, f.pivot.y); ctx.lineTo(f.end.x, f.end.y); ctx.stroke();
    const grad = ctx.createLinearGradient(f.pivot.x, f.pivot.y, f.end.x, f.end.y);
    grad.addColorStop(0, color); grad.addColorStop(0.5, "#fbf7ed"); grad.addColorStop(1, color);
    ctx.strokeStyle = grad; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.moveTo(f.pivot.x, f.pivot.y); ctx.lineTo(f.end.x, f.end.y); ctx.stroke();
    // Glow on active hit
    if (flash > 0.5) {
      ctx.strokeStyle = hexToRgba(color, flash * 0.55); ctx.lineWidth = 36;
      ctx.beginPath(); ctx.moveTo(f.pivot.x, f.pivot.y); ctx.lineTo(f.end.x, f.end.y); ctx.stroke();
    }
    ctx.fillStyle = "#11172b"; ctx.beginPath(); ctx.arc(f.pivot.x, f.pivot.y, 23, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  function drawBalls() {
    for (const ball of state.balls) {
      if (ball.stuck) {
        // Plunger-resting ball — small bounce animation
        const bob = Math.sin(state.elapsed * 8) * 2 + state.plungerCharge * 44;
        ball.x = 768; ball.y = 1210 + bob;
      }

      // Trail (motion blur)
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const a = (i / ball.trail.length) * 0.30 * t.life;
        ctx.fillStyle = `rgba(117,236,255,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(t.x, t.y, ball.r * (i / ball.trail.length), 0, Math.PI * 2); ctx.fill();
      }

      // Ball
      ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.spin);
      ctx.shadowColor = "#75ecff"; ctx.shadowBlur = state.multiBallActive ? 26 : 18;
      const g = ctx.createRadialGradient(-6, -8, 3, 0, 0, ball.r);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.32, "#c6f8ff");
      g.addColorStop(0.7, "#6ecdea"); g.addColorStop(1, "#122745");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ball.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.44)"; ctx.lineWidth = 1.8; ctx.stroke();
      // Seam lines
      ctx.strokeStyle = "rgba(0,0,0,0.26)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-ball.r * 0.5, 0); ctx.lineTo(ball.r * 0.5, 0);
      ctx.moveTo(0, -ball.r * 0.5); ctx.lineTo(0, ball.r * 0.5); ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    for (const p of state.particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const t of state.floatText) {
      ctx.globalAlpha = clamp(t.life, 0, 1);
      ctx.fillStyle = t.color; ctx.shadowColor = t.color; ctx.shadowBlur = 12;
      ctx.font = "900 24px Inter,system-ui,sans-serif"; ctx.textAlign = "center";
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  function drawPlunger() {
    const charge = state.plungerCharge;
    ctx.save();
    // Plunger lane background
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    roundRect(ctx, 728, 170, 84, 1070, 22); ctx.fill();
    ctx.strokeStyle = "rgba(245,196,81,0.20)"; ctx.lineWidth = 2; ctx.stroke();

    // Launch lane dotted guide
    ctx.globalAlpha = 0.38 + charge * 0.35;
    ctx.strokeStyle = "rgba(245,196,81,0.50)"; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
    ctx.beginPath(); ctx.moveTo(768, 1198); ctx.bezierCurveTo(778, 880, 790, 430, 710, 178); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    // Plunger bar
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    roundRect(ctx, 750, 1090, 36, 200, 14); ctx.fill();
    ctx.strokeStyle = "rgba(245,196,81,0.22)"; ctx.lineWidth = 2; ctx.stroke();
    // Charge indicator
    const barH = 64 + charge * 68;
    const barY = 1240 - charge * 120;
    ctx.fillStyle = `rgba(245,196,81,${0.28 + charge * 0.52})`;
    roundRect(ctx, 756, barY, 24, barH, 10); ctx.fill();
    ctx.strokeStyle = `rgba(245,196,81,${0.6 + charge * 0.35})`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "rgba(251,247,237,0.65)";
    ctx.font = "900 12px Inter,system-ui,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("LAUNCH", 768, 1078);

    // Launch hint
    if (state.launchHint > 0 && state.balls.some(b => b.stuck)) {
      const alpha = 0.60 + Math.sin(state.elapsed * 6) * 0.24;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(245,196,81,0.94)";
      ctx.font = "900 22px Inter,system-ui,sans-serif"; ctx.textAlign = "center";
      ctx.fillText("TAP LAUNCH", 400, 1155);
      ctx.font = "800 14px Inter,system-ui,sans-serif"; ctx.fillStyle = "rgba(251,247,237,0.72)";
      ctx.fillText("Space / Z = left   / = right", 400, 1178);
      ctx.globalAlpha = 1;
    }

    // Ball save indicator
    if (state.ballSave > 0 && state.mode === "playing") {
      ctx.fillStyle = "rgba(105,243,169,0.88)";
      ctx.font = "900 15px Inter,system-ui,sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`BALL SAVE ${Math.ceil(state.ballSave)}`, 400, 1090);
    }

    ctx.restore();
  }

  function drawHudOverlay() {
    // Tilt locked overlay
    if (state.tiltLocked) {
      ctx.save(); ctx.globalAlpha = 0.65 + Math.sin(state.elapsed * 8) * 0.2;
      ctx.fillStyle = "rgba(255,93,104,0.22)";
      roundRect(ctx, 80, 68, 660, 1270, 34); ctx.fill();
      ctx.fillStyle = "#ff5d68"; ctx.font = "900 48px Inter,system-ui,sans-serif";
      ctx.textAlign = "center"; ctx.fillText("TILT", 400, 760);
      ctx.font = "800 20px Inter,system-ui,sans-serif";
      ctx.fillText(`Lockout: ${Math.ceil(state.tiltLockTimer)}s`, 400, 810);
      ctx.restore();
    }

    // Active mission banner
    if (state.currentMissionEra >= 0 && state.mode === "playing") {
      const era = state.eraTargets[state.currentMissionEra];
      if (era) {
        ctx.save(); ctx.globalAlpha = 0.88;
        ctx.fillStyle = hexToRgba(era.color, 0.18);
        roundRect(ctx, 80, 540, 620, 40, 10); ctx.fill();
        ctx.strokeStyle = hexToRgba(era.color, 0.6); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = era.color; ctx.font = "900 16px Inter,system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${era.era} MISSION · Q ${state.missionStep + 1}/3${state.missionRampDone ? " · RAMP ✓" : ""}`, 390, 566);
        ctx.restore();
      }
    }

    // Wizard mode flash
    if (state.wizardMode) {
      ctx.save();
      const t = state.wizardTimer;
      ctx.globalAlpha = 0.55 + Math.sin(state.elapsed * 5) * 0.15;
      ctx.fillStyle = "rgba(245,196,81,0.12)";
      roundRect(ctx, 80, 68, 660, 1270, 34); ctx.fill();
      ctx.fillStyle = "#f5c451"; ctx.font = "900 20px Inter,system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`★ WIZARD MODE · ${Math.ceil(t)}s · 5× ★`, 400, 120);
      ctx.restore();
    }
  }

  // ─── Main loop ────────────────────────────────────────────────────────────
  function loop(now) {
    const dt = Math.min(0.033, ((now || 0) - (state.last || now || 0)) / 1000 || 0.016);
    state.last = now || 0;
    // Handle launch-lane balls separately (pre-table, constrained path)
    for (const ball of state.balls) {
      if (ball.launchLane) updateLaunchLaneBall(ball, dt);
    }
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  function bindControls() {
    window.addEventListener("resize", resize);
    window.addEventListener("blur", () => {
      if (state.mode === "playing") pauseGame();
      setFlipper("left", false); setFlipper("right", false); cancelLaunch();
    });

    els.courseFilter.addEventListener("change", () => { populateSets(); applyFilters(); });
    els.setFilter.addEventListener("change", applyFilters);
    els.modeFilter.addEventListener("change", renderSetupMetrics);
    els.startBtn.addEventListener("click", startGame);
    els.pauseBtn.addEventListener("click", () => state.mode === "paused" ? resumeGame() : pauseGame());
    els.resumeBtn.addEventListener("click", resumeGame);
    els.restartBtn.addEventListener("click", startGame);
    els.againBtn.addEventListener("click", startGame);
    els.setupBtn.addEventListener("click", showSetup);
    els.exitBtn.addEventListener("click", () => { window.location.href = "../../"; });
    els.pauseExitBtn.addEventListener("click", () => { window.location.href = "../../"; });
    els.soundBtn.addEventListener("click", () => {
      audio.enabled = !audio.enabled;
      els.soundBtn.textContent = audio.enabled ? "Sound On" : "Sound Off";
      if (audio.enabled) audio.ensure();
    });
    els.fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });

    // Touch zones on canvas
    canvas.addEventListener("pointerdown", (e) => {
      audio.ensure();
      if (state.mode !== "playing") return;
      canvas.setPointerCapture?.(e.pointerId);
      const frac = e.clientX / window.innerWidth;
      if (frac < 0.38) {
        setFlipper("left", true);
      } else if (frac > 0.62) {
        if (state.balls.some(b => b.stuck)) holdLaunch();
        else setFlipper("right", true);
      }
    }, { passive: true });

    canvas.addEventListener("pointerup", (e) => {
      setFlipper("left", false); setFlipper("right", false);
      releaseLaunch();
      canvas.releasePointerCapture?.(e.pointerId);
    }, { passive: true });

    canvas.addEventListener("pointercancel", () => {
      setFlipper("left", false); setFlipper("right", false); cancelLaunch();
    }, { passive: true });

    // Flipper / launch / plunger buttons
    bindHoldBtn(els.leftFlip,  () => setFlipper("left",  true),  () => setFlipper("left",  false));
    bindHoldBtn(els.rightFlip, () => setFlipper("right", true),  () => setFlipper("right", false));
    bindHoldBtn(els.launchBtn, holdLaunch, releaseLaunch, quickLaunch);

    // Keyboard
    window.addEventListener("keydown", (e) => {
      if (e.repeat && e.code !== "Space") return;
      switch (e.code) {
        case "KeyZ": case "ArrowLeft":  e.preventDefault(); setFlipper("left",  true); break;
        case "Slash": case "ArrowRight": e.preventDefault(); setFlipper("right", true); break;
        case "Space": case "ArrowDown":  e.preventDefault(); holdLaunch(); break;
        case "KeyT":  e.preventDefault(); tiltNudge(); break;
        case "KeyP":  e.preventDefault(); state.mode === "paused" ? resumeGame() : pauseGame(); break;
        case "Escape":
          if (state.mode === "question") closeMission();
          else if (state.mode === "playing") pauseGame();
          break;
        case "KeyM":
          audio.enabled = !audio.enabled;
          els.soundBtn.textContent = audio.enabled ? "Sound On" : "Sound Off";
          break;
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "KeyZ" || e.code === "ArrowLeft")  setFlipper("left",  false);
      if (e.code === "Slash" || e.code === "ArrowRight") setFlipper("right", false);
      if (e.code === "Space" || e.code === "ArrowDown") { e.preventDefault(); releaseLaunch(); }
    });

    // Device motion for tilt
    window.addEventListener("devicemotion", (e) => {
      if (!e.acceleration) return;
      const mag = Math.hypot(e.acceleration.x || 0, e.acceleration.y || 0, e.acceleration.z || 0);
      if (mag > 18) tiltNudge();
    });
  }

  function bindHoldBtn(btn, down, up, clickFallback) {
    let t0 = 0;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault(); t0 = performance.now();
      btn.setPointerCapture?.(e.pointerId); down();
    });
    btn.addEventListener("pointerup", (e) => {
      e.preventDefault(); up(); btn.releasePointerCapture?.(e.pointerId);
    });
    btn.addEventListener("pointercancel", () => { up(); });
    btn.addEventListener("mouseleave", () => { if (btn.classList.contains("active")) up(); });
    if (clickFallback) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (performance.now() - t0 < 200 && state.balls.some(b => b.stuck)) clickFallback();
      });
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  async function init() {
    // Load persistence
    state.highScore = Number(localStorage.getItem(`${STORAGE_KEY}:highScore`) || 0);

    resize();
    initStars();
    bindControls();
    updateHud();
    setMission("Loading table", "Preparing the review bank and table systems…", "");
    requestAnimationFrame(loop);

    try {
      await loadBank();
      setMission("Chrono Pinball ready", "Select a course, then hit Launch Table. Z = left flipper  / = right flipper  Space = plunger  T = tilt.", "");
    } catch (err) {
      console.error("Bank load failed:", err);
      els.startBtn.textContent = "Bank failed — refresh";
      els.setupMetrics.innerHTML = `<span class="metric-pill">Question bank offline. Try refreshing.</span>`;
      setMission("Bank error", "The review library did not load. Refresh the page.", "bank offline", "bad");
    }
  }

  init();
})();
