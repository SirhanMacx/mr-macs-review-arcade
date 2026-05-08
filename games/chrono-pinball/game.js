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
    const chips = [
      { value: formatNumber(total), label: "Review Prompts" },
      { value: formatNumber(mcq),   label: "MCQs" },
      { value: formatNumber(src),   label: "Source-Based" },
    ];
    const bestChip = `<span class="metric-pill mp-best"><span class="mp-value">${escapeHtml(formatNumber(best))}</span><span class="mp-label">Best Score</span></span>`;
    els.setupMetrics.innerHTML =
      chips.map(c =>
        `<span class="metric-pill"><span class="mp-value">${escapeHtml(c.value)}</span><span class="mp-label">${escapeHtml(c.label)}</span></span>`
      ).join("") + bestChip;
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
    // MrMacsProfile — boot hook
    if (window.MrMacsProfile) {
      window.MrMacsProfile.recordPlay({ id: "chrono-pinball", title: "Chrono Pinball", course: "All Courses", file: "games/chrono-pinball/index.html" });
      audio.modeStart();
    }
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
    // Mirror kicker to DMD as default scrolling text (only if no flash active)
    if (!dmd.flashTimer || dmd.flashTimer <= 0) {
      dmd.msg = `${kicker.toUpperCase()}  ${text.toUpperCase().slice(0, 60)}`;
    }
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
    window.MrMacsProfile?.addShards(1, "chrono-pinball:bumper");
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
    window.MrMacsProfile?.addShards(1, "chrono-pinball:slingshot");
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
    window.MrMacsProfile?.addShards(5, "chrono-pinball:ramp");
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
      window.MrMacsProfile?.addShards(25, "chrono-pinball:drop-target-row");
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
    setDmdMsg(`BALL ${state.ballsLeft + 1} DRAINED  ${state.ballsLeft} REMAINING  LAUNCH TO CONTINUE`, "", "#f04860", 1.5);
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
    setDmdMsg(`${era.era} MISSION  ANSWER 3 QUESTIONS + HIT RAMP = JACKPOT`, "", era.color, 1.5);
    updateMissionProgressDots(0);
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
      addScore(6000 + state.missionStreak * 900, 450, 600, "#52e8a0", "CORRECT!");
      els.explanation.textContent = displayExplanation(q);
      els.explanation.className = "explanation good";
      audio.correct();
      setDmdMsg("CORRECT!  +" + formatNumber(6000 + state.missionStreak * 900), "", "#52e8a0", 1.0);
      // multiplier badge pulse
      els.multiplier.classList.remove("pumped");
      void els.multiplier.offsetWidth;
      els.multiplier.classList.add("pumped");
      // MrMacsProfile — correct answer shards + first-correct achievement
      if (window.MrMacsProfile) {
        window.MrMacsProfile.addShards(15, "chrono-pinball:correct-answer");
        window.MrMacsProfile.unlock("first-correct");
      }
    } else {
      state.missionStreak = 0;
      state.multiplier = Math.max(1, state.multiplier - 1);
      state.missed.push(q);
      addScore(400, 450, 600, "#f04860", "REVIEW");
      els.explanation.textContent = `Correct: ${cleanText(q.answer)}. ${displayExplanation(q)}`;
      els.explanation.className = "explanation bad";
      audio.wrong();
      setDmdMsg("INCORRECT  REVIEW: " + cleanText(q.answer).toUpperCase(), "", "#f04860", 1.0);
    }

    // Advance mission steps
    state.missionStep++;
    updateMissionProgressDots(Math.min(state.missionStep, 2));
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
        addScore(jackptPts, 450, 550, "#d4a017", "JACKPOT!");
        setDmdMsg("JACKPOT!  +" + formatNumber(jackptPts) + "  MISSION COMPLETE", "", "#d4a017", 2.0);
        audio.wizard();
        state.shake = 0.25;
      }
      state.missionsCompleted++;
      window.MrMacsProfile?.addShards(100, "chrono-pinball:era-mission");

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

  function updateMissionProgressDots(step) {
    const dots = document.querySelectorAll(".mp-dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === step);
      dot.classList.toggle("done", i < step);
    });
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
    setDmdMsg("MISSION COMPLETE  KEEP SCORING  NEXT ERA AWAITS", "", "#52e8a0", 1.2);
    updateMissionProgressDots(0);
  }

  function triggerWizardMode() {
    state.wizardMode = true; state.wizardTimer = 60;
    spawnMultiball();
    audio.wizard();
    state.shake = 0.3;
    addText(450, 450, "WIZARD MODE!", "#f5c451");
    setMission("WIZARD MODE", "All 5 eras mastered! 5× scoring + multiball for 60 seconds!", "WIZARD!", "good");
    setDmdMsg("★ WIZARD MODE ★  5× SCORING  ALL ERAS MASTERED", "", "#d4a017", 2.5);
    updateHud();
    // MrMacsProfile — Wizard Mode shards + achievement
    if (window.MrMacsProfile) {
      window.MrMacsProfile.addShards(500, "chrono-pinball:wizard-mode");
      window.MrMacsProfile.unlock("pinball-wizard");
    }
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
      setDmdMsg("MULTIBALL!", "Keep all balls live", "#f07bb8", 1.8);
      // MrMacsProfile — multiball achievement
      window.MrMacsProfile?.unlock("pinball-multiball");
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
    const isNewRecord = Math.floor(state.scoreCountTarget) > prevBest;
    if (isNewRecord)
      localStorage.setItem(`${STORAGE_KEY}:highScore`, String(Math.floor(state.scoreCountTarget)));
    const prevEra = Number(localStorage.getItem(`${STORAGE_KEY}:bestEra`) || 0);
    if (state.eraCompleted > prevEra)
      localStorage.setItem(`${STORAGE_KEY}:bestEra`, String(state.eraCompleted));
    if (state.wizardMode || state.missionsCompleted >= 5) {
      const wc = Number(localStorage.getItem(`${STORAGE_KEY}:wizardCount`) || 0) + 1;
      localStorage.setItem(`${STORAGE_KEY}:wizardCount`, String(wc));
    }

    // Show initials entry if new record
    const initialsEl = document.getElementById("initialsEntry");
    if (initialsEl) {
      initialsEl.style.display = isNewRecord ? "flex" : "none";
      if (isNewRecord) {
        [0,1,2].forEach(i => { const el = document.getElementById(`ini${i}`); if (el) el.value = ""; });
        setTimeout(() => document.getElementById("ini0")?.focus(), 200);
      }
    }

    // DMD game over message
    setDmdMsg(
      isNewRecord
        ? `NEW RECORD!  ${formatNumber(Math.floor(state.scoreCountTarget))}  ENTER YOUR INITIALS`
        : `GAME OVER  SCORE: ${formatNumber(Math.floor(state.scoreCountTarget))}  ${accuracy}% ACCURACY`,
      "", isNewRecord ? "#d4a017" : "#5de0f0", 3.0
    );

    els.endTitle.textContent = isNewRecord ? "New table record!" : "Archive table closed";
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
    setDmdMsg("BALL LAUNCHED  HIT ERA TARGETS · LIGHT MISSIONS · EARN MULTIBALL", "", "#5de0f0", 1.2);
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
  // DMD canvas reference (dot-matrix display)
  const dmdCanvas = document.getElementById("dmdCanvas");
  const dmdCtx = dmdCanvas ? dmdCanvas.getContext("2d") : null;

  // DMD state
  const dmd = {
    msg: "CHRONO PINBALL",
    subMsg: "",
    scrollX: 0,
    scrollTimer: 0,
    flashTimer: 0,
    flashColor: "",
    h: 40,         // pixel height of DMD strip
    cols: 128,     // LED columns
    rows: 16,      // LED rows
    cellW: 0,
    cellH: 0
  };

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

    // DMD canvas: spans full width, sits just above HUD (z-index 2 in CSS)
    if (dmdCanvas) {
      const dh = Math.max(36, Math.min(56, table.height * 0.048));
      dmd.h = dh;
      dmdCanvas.width  = Math.round(table.width * dpr);
      dmdCanvas.height = Math.round(dh * dpr);
      dmdCanvas.style.width  = `${table.width}px`;
      dmdCanvas.style.height = `${dh}px`;
      dmd.cellW = table.width / dmd.cols;
      dmd.cellH = dh / dmd.rows;
    }
  }

  // ── DMD renderer ────────────────────────────────────────────────────────
  function updateDmd(dt) {
    if (!dmdCtx) return;
    dmd.scrollTimer += dt;
    if (dmd.flashTimer > 0) dmd.flashTimer -= dt;
    if (dmd.scrollTimer > 0.045) { dmd.scrollX -= 2; dmd.scrollTimer = 0; }

    const dpr = table.dpr;
    const W = dmdCanvas.width / dpr;
    const H = dmd.h;
    dmdCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dmdCtx.clearRect(0, 0, W, H);

    // Background panel
    dmdCtx.fillStyle = "rgba(8,4,18,0.94)";
    dmdCtx.fillRect(0, 0, W, H);
    // Top brass border line
    const borderG = dmdCtx.createLinearGradient(0, 0, W, 0);
    borderG.addColorStop(0,   "rgba(200,146,42,0)");
    borderG.addColorStop(0.2, "rgba(200,146,42,0.7)");
    borderG.addColorStop(0.8, "rgba(200,146,42,0.7)");
    borderG.addColorStop(1,   "rgba(200,146,42,0)");
    dmdCtx.fillStyle = borderG;
    dmdCtx.fillRect(0, H - 2, W, 2);
    dmdCtx.fillRect(0, 0, W, 1.5);

    // LED dot-matrix grid
    const cellW = dmd.cellW, cellH = dmd.cellH;
    const dotR  = Math.min(cellW, cellH) * 0.38;

    // Determine LED content: text rendered via offscreen approach
    const flashActive = dmd.flashTimer > 0;
    const baseColor   = flashActive ? dmd.flashColor : (state.wizardMode ? "#d4a017" : "#1a9440");
    const dimColor    = flashActive ? hexToRgba(dmd.flashColor, 0.10) : "rgba(0,80,20,0.18)";

    // Determine displayed text
    let mainText = dmd.msg;
    let scoreText = state.mode === "playing" || state.mode === "ended"
      ? formatNumber(Math.floor(state.scoreDisplay)) : "";

    // Draw dots row by row
    for (let row = 0; row < dmd.rows; row++) {
      for (let col = 0; col < dmd.cols; col++) {
        const cx = col * cellW + cellW * 0.5;
        const cy = row * cellH + cellH * 0.5;
        dmdCtx.fillStyle = dimColor;
        dmdCtx.beginPath();
        dmdCtx.arc(cx, cy, dotR, 0, Math.PI * 2);
        dmdCtx.fill();
      }
    }

    // Render text into LED grid using a temp canvas
    const tmpC = document.createElement("canvas");
    tmpC.width = dmd.cols; tmpC.height = dmd.rows;
    const tmpX = tmpC.getContext("2d");
    tmpX.fillStyle = "#000";
    tmpX.fillRect(0, 0, dmd.cols, dmd.rows);
    tmpX.fillStyle = "#fff";
    tmpX.font = `bold ${Math.floor(dmd.rows * 0.62)}px "JetBrains Mono",monospace`;
    tmpX.textBaseline = "middle";

    // Left: score
    if (scoreText) {
      tmpX.textAlign = "left";
      tmpX.fillText(scoreText, 2 + (dmd.scrollX * 0.02), dmd.rows / 2);
    }
    // Center: scrolling message
    const msgPx = dmd.scrollX % (dmd.cols * 1.6 + mainText.length * 7);
    tmpX.textAlign = "left";
    tmpX.fillText(mainText, dmd.cols * 0.35 + msgPx, dmd.rows / 2);
    // Right: mode/era indicator
    if (state.wizardMode) {
      tmpX.textAlign = "right";
      tmpX.fillText("WIZ 5×", dmd.cols - 2, dmd.rows / 2);
    } else if (state.multiplier > 1) {
      tmpX.textAlign = "right";
      tmpX.fillText(`${state.multiplier}×`, dmd.cols - 2, dmd.rows / 2);
    }

    const imgData = tmpX.getImageData(0, 0, dmd.cols, dmd.rows).data;
    for (let row = 0; row < dmd.rows; row++) {
      for (let col = 0; col < dmd.cols; col++) {
        const px = (row * dmd.cols + col) * 4;
        if (imgData[px] > 80) {
          const cx = col * cellW + cellW * 0.5;
          const cy = row * cellH + cellH * 0.5;
          dmdCtx.shadowColor = baseColor;
          dmdCtx.shadowBlur  = FX_LITE ? 3 : 6;
          dmdCtx.fillStyle   = baseColor;
          dmdCtx.beginPath();
          dmdCtx.arc(cx, cy, dotR * 0.95, 0, Math.PI * 2);
          dmdCtx.fill();
          dmdCtx.shadowBlur  = 0;
        }
      }
    }

    // Progress bar (era completion)
    const erasDone = state.eraTargets.filter(e => e.completed).length;
    if (erasDone > 0) {
      const barW = (W * 0.18) * (erasDone / 5);
      const barY = H - 4;
      dmdCtx.fillStyle = "rgba(200,146,42,0.75)";
      dmdCtx.fillRect(W * 0.01, barY, barW, 3);
    }
  }

  function setDmdMsg(msg, subMsg, flashColor, flashDur) {
    dmd.msg = msg || "";
    dmd.subMsg = subMsg || "";
    dmd.scrollX = 0;
    if (flashColor) {
      dmd.flashColor  = flashColor;
      dmd.flashTimer  = flashDur || 1.2;
    }
  }

  // ── Main draw ────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, table.width, table.height);
    drawCabinetBackground();
    const sx = state.shake ? (Math.random() - 0.5) * state.shake * 20 : 0;
    const sy = state.shake ? (Math.random() - 0.5) * state.shake * 20 : 0;
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
    drawCabinetBezel();

    ctx.restore();
  }

  // ── Cabinet background (deep purple atmosphere) ──────────────────────────
  function drawCabinetBackground() {
    // Deep purple void
    const g = ctx.createRadialGradient(
      table.width * 0.5, table.height * 0.38, 40,
      table.width * 0.5, table.height * 0.46,
      Math.max(table.width, table.height) * 0.80
    );
    g.addColorStop(0,   "#1a0c38");
    g.addColorStop(0.28,"#100820");
    g.addColorStop(0.6, "#08051a");
    g.addColorStop(1,   "#040210");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, table.width, table.height);

    // Floating star particles
    ctx.save();
    ctx.globalAlpha = FX_LITE ? 0.48 : 0.66;
    for (const st of state.stars) {
      ctx.fillStyle = st.hue;
      ctx.fillRect(st.x * table.width, st.y * table.height, st.z * 1.7, st.z * 1.7);
    }
    ctx.restore();

    // Wizard mode gold wash
    if (!FX_LITE && state.wizardMode) {
      const wg = ctx.createRadialGradient(
        table.width * 0.5, table.height * 0.5, 0,
        table.width * 0.5, table.height * 0.5,
        table.width * 0.65
      );
      wg.addColorStop(0, `rgba(212,160,23,${0.07 + Math.sin(state.elapsed * 4) * 0.03})`);
      wg.addColorStop(1, "rgba(212,160,23,0)");
      ctx.fillStyle = wg;
      ctx.fillRect(0, 0, table.width, table.height);
    }
  }

  // ── Canvas draw helpers ──────────────────────────────────────────────────
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

  // ── Table body (playfield + cabinet frame) ───────────────────────────────
  function drawTableBody() {
    // Outer cabinet body — dark wood + brass trim
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.75)";
    ctx.shadowBlur  = 48;
    ctx.shadowOffsetY = 28;
    roundRect(ctx, 44, 40, 812, 1320, 28);
    const cab = ctx.createLinearGradient(44, 40, 856, 1360);
    cab.addColorStop(0,    "#1e1030");
    cab.addColorStop(0.18, "#160c28");
    cab.addColorStop(0.50, "#110920");
    cab.addColorStop(0.82, "#160c28");
    cab.addColorStop(1,    "#0e0818");
    ctx.fillStyle = cab;
    ctx.fill();
    ctx.restore();

    // Cabinet brass border lines
    ctx.save();
    ctx.lineWidth = 3;
    // Top brass highlight
    const brassG = ctx.createLinearGradient(44, 40, 856, 40);
    brassG.addColorStop(0,    "rgba(200,146,42,0)");
    brassG.addColorStop(0.12, "rgba(232,184,75,0.70)");
    brassG.addColorStop(0.88, "rgba(232,184,75,0.70)");
    brassG.addColorStop(1,    "rgba(200,146,42,0)");
    ctx.strokeStyle = brassG;
    roundRect(ctx, 44, 40, 812, 1320, 28);
    ctx.stroke();
    ctx.restore();

    // Cabinet corner brass bolts
    if (!FX_LITE) {
      [[62,58],[838,58],[62,1342],[838,1342]].forEach(([cx, cy]) => {
        ctx.save();
        const bg = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 9);
        bg.addColorStop(0, "rgba(232,184,75,0.80)");
        bg.addColorStop(0.5, "rgba(200,146,42,0.50)");
        bg.addColorStop(1,  "rgba(100,70,15,0.30)");
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(232,184,75,0.60)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      });
    }

    // Playfield surface
    ctx.save();
    roundRect(ctx, 74, 66, 654, 1262, 20);
    ctx.clip();

    // Layered painterly gradient — era-reactive
    const erasDone = state.eraTargets.filter(e => e.completed).length;
    const eraHues = [
      [26, 22, 62],   // neutral purple-blue
      [32, 18, 50],   // deep indigo
      [22, 30, 46],   // steel blue (industrial)
      [18, 34, 22],   // military green hint (WWII)
      [14, 36, 44],   // teal (cold war)
      [24, 14, 52]    // violet digital
    ];
    const h = eraHues[erasDone] || eraHues[0];
    const pf = ctx.createLinearGradient(74, 66, 728, 1328);
    pf.addColorStop(0,    `rgb(${h[0]+12},${h[1]+10},${h[2]+14})`);
    pf.addColorStop(0.30, `rgb(${h[0]},${h[1]},${h[2]})`);
    pf.addColorStop(0.65, `rgb(${h[0]-4},${h[1]-4},${h[2]-8})`);
    pf.addColorStop(1,    `rgb(${h[0]-8},${h[1]-8},${h[2]-14})`);
    ctx.fillStyle = pf;
    ctx.fillRect(74, 66, 654, 1262);

    // Subtle atmosphere particles
    if (!FX_LITE) {
      ctx.globalAlpha = 0.055;
      for (let i = 0; i < 8; i++) {
        const px = 74 + (i * 90 + state.elapsed * 8 + i * 37) % 630;
        const py = 200 + (i * 154 + state.elapsed * 5 + i * 60) % 900;
        const ag = ctx.createRadialGradient(px, py, 10, px, py, 90);
        const aColor = ERA_COLORS[i % ERA_COLORS.length];
        ag.addColorStop(0, hexToRgba(aColor, 0.6));
        ag.addColorStop(1, "transparent");
        ctx.fillStyle = ag;
        ctx.beginPath(); ctx.arc(px, py, 90, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Playfield chrome border
    ctx.save();
    roundRect(ctx, 74, 66, 654, 1262, 20);
    const pfBorder = ctx.createLinearGradient(74, 66, 728, 1328);
    if (state.wizardMode) {
      const pls = 0.38 + Math.sin(state.elapsed * 6) * 0.18;
      pfBorder.addColorStop(0, `rgba(212,160,23,${pls})`);
      pfBorder.addColorStop(0.5, `rgba(232,184,75,${pls * 1.3})`);
      pfBorder.addColorStop(1, `rgba(212,160,23,${pls})`);
    } else {
      pfBorder.addColorStop(0, "rgba(200,146,42,0.30)");
      pfBorder.addColorStop(0.5, "rgba(200,146,42,0.55)");
      pfBorder.addColorStop(1, "rgba(200,146,42,0.30)");
    }
    ctx.strokeStyle = pfBorder;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Decorative inlane light strips
    if (!FX_LITE) {
      ctx.save(); ctx.globalAlpha = 0.22;
      // Left inlane strip
      ctx.strokeStyle = "rgba(93,224,240,0.55)"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(106, 980); ctx.lineTo(186, 1106); ctx.stroke();
      // Right inlane strip
      ctx.strokeStyle = "rgba(240,123,184,0.55)";
      ctx.beginPath(); ctx.moveTo(794, 980); ctx.lineTo(714, 1106); ctx.stroke();
      ctx.restore();
    }

    // Circuit line decoration
    if (!FX_LITE) {
      ctx.save(); ctx.globalAlpha = 0.20; ctx.lineWidth = 1.2;
      for (let y = 200; y < 1100; y += 92) {
        const tone = y % 184 === 0 ? "rgba(93,224,240,0.30)" : "rgba(255,255,255,0.06)";
        ctx.strokeStyle = tone;
        ctx.beginPath(); ctx.moveTo(118, y);
        ctx.bezierCurveTo(280, y - 30, 570, y + 32, 722, y - 6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Walls — chrome rails
    ctx.save(); ctx.lineCap = "round";
    for (const w of WALLS) {
      // Shadow
      ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); ctx.stroke();
      // Chrome body
      const wg = ctx.createLinearGradient(w[0], w[1], w[2], w[3]);
      wg.addColorStop(0, "rgba(200,194,220,0.55)");
      wg.addColorStop(0.5,"rgba(255,255,255,0.35)");
      wg.addColorStop(1, "rgba(180,170,200,0.40)");
      ctx.strokeStyle = wg; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); ctx.stroke();
      // Edge highlight
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); ctx.stroke();
    }
    ctx.restore();

    // Center emblem
    drawCenterEmblem();

    // Drain zone
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.50)";
    roundRect(ctx, 312, 1285, 278, 56, 18); ctx.fill();
    ctx.strokeStyle = "rgba(240,72,96,0.38)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = "900 16px 'JetBrains Mono',monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("DRAIN", 451, 1314);
    ctx.restore();
  }

  // ── Cabinet bezel (drawn over everything) ────────────────────────────────
  function drawCabinetBezel() {
    if (FX_LITE) return;
    ctx.save();
    // Side art rails
    const leftRail = ctx.createLinearGradient(0, 0, 40, 0);
    leftRail.addColorStop(0, "rgba(200,146,42,0.25)");
    leftRail.addColorStop(1, "rgba(200,146,42,0)");
    ctx.fillStyle = leftRail;
    ctx.fillRect(0, 0, 30, TABLE_H);

    const rightRail = ctx.createLinearGradient(TABLE_W - 30, 0, TABLE_W, 0);
    rightRail.addColorStop(0, "rgba(200,146,42,0)");
    rightRail.addColorStop(1, "rgba(200,146,42,0.25)");
    ctx.fillStyle = rightRail;
    ctx.fillRect(TABLE_W - 30, 0, 30, TABLE_H);

    // Glass reflection
    ctx.globalAlpha = 0.032;
    const glassG = ctx.createLinearGradient(0, 0, TABLE_W * 0.45, TABLE_H * 0.3);
    glassG.addColorStop(0, "#ffffff");
    glassG.addColorStop(1, "transparent");
    ctx.fillStyle = glassG;
    ctx.fillRect(0, 0, TABLE_W, TABLE_H);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawCenterEmblem() {
    ctx.save(); ctx.translate(400, 720);
    ctx.rotate(Math.sin(state.elapsed * 0.38) * 0.022);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 168);
    glow.addColorStop(0, state.wizardMode ? "rgba(212,160,23,0.24)" : "rgba(200,146,42,0.14)");
    glow.addColorStop(0.6, state.wizardMode ? "rgba(200,146,42,0.06)" : "rgba(160,96,200,0.05)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 168, 0, Math.PI * 2); ctx.fill();

    // Outer ring — chrome
    const ringG = ctx.createRadialGradient(-30, -30, 60, 0, 0, 100);
    ringG.addColorStop(0, "rgba(200,194,220,0.42)");
    ringG.addColorStop(1, "rgba(120,100,160,0.22)");
    ctx.strokeStyle = ringG; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 98, 0, Math.PI * 2); ctx.stroke();

    // Inner hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + state.elapsed * 0.08;
      const fn = i === 0 ? "moveTo" : "lineTo";
      ctx[fn](Math.cos(a) * 68, Math.sin(a) * 68);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(93,224,240,0.28)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.04)"; ctx.fill();

    // Brass accent dots at hex vertices
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + state.elapsed * 0.08;
      const dx = Math.cos(a) * 68, dy = Math.sin(a) * 68;
      ctx.fillStyle = "rgba(200,146,42,0.55)";
      ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = "rgba(245,240,255,0.68)";
    ctx.font = "900 20px 'Inter',system-ui,sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("ARCHIVE", 0, -9);
    ctx.font = "700 12px 'JetBrains Mono',monospace";
    ctx.fillStyle = state.wizardMode ? "rgba(212,160,23,0.90)" : "rgba(200,146,42,0.72)";
    ctx.fillText(state.wizardMode ? "★ WIZARD ★" : "REACTOR", 0, 14);
    ctx.restore();
  }

  // ── Top lanes ────────────────────────────────────────────────────────────
  function drawTopLanes() {
    for (let i = 0; i < TOP_LANES.length; i++) {
      const lane = TOP_LANES[i];
      const hot  = lane.cooldown > 0;
      const lit  = lane.lit;
      ctx.save();
      ctx.shadowColor = lane.color;
      ctx.shadowBlur  = lit ? 32 : (hot ? 18 : 8);
      roundRect(ctx, lane.x, lane.y, lane.w, lane.h, 14);

      // Fill
      const lg = ctx.createLinearGradient(lane.x, lane.y, lane.x, lane.y + lane.h);
      if (lit) {
        lg.addColorStop(0, hexToRgba(lane.color, 0.45));
        lg.addColorStop(1, hexToRgba(lane.color, 0.18));
      } else if (hot) {
        lg.addColorStop(0, hexToRgba(lane.color, 0.28));
        lg.addColorStop(1, hexToRgba(lane.color, 0.10));
      } else {
        lg.addColorStop(0, "rgba(0,0,0,0.22)");
        lg.addColorStop(1, "rgba(0,0,0,0.38)");
      }
      ctx.fillStyle = lg; ctx.fill();

      // Border
      ctx.strokeStyle = hexToRgba(lane.color, lit ? 0.95 : 0.42);
      ctx.lineWidth = lit ? 3 : 2;
      ctx.stroke();

      // Top highlight
      if (lit || hot) {
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        roundRect(ctx, lane.x + 2, lane.y + 2, lane.w - 4, lane.h * 0.35, 10);
        ctx.fill();
      }

      // Label text
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = lit ? "#f5f0ff" : "rgba(245,240,255,0.72)";
      ctx.font        = `${lit ? 900 : 800} 11px 'JetBrains Mono',monospace`;
      ctx.textAlign   = "center"; ctx.textBaseline = "middle";
      ctx.fillText(lane.label, lane.x + lane.w / 2, lane.y + lane.h / 2 - (lit ? 5 : 0));
      if (lit) {
        ctx.fillStyle = "#d4a017";
        ctx.font      = "800 9px 'JetBrains Mono',monospace";
        ctx.fillText("SKILL SHOT", lane.x + lane.w / 2, lane.y + lane.h / 2 + 8);
      }
      ctx.restore();
    }
  }

  // ── Bumpers — 3D dome look ───────────────────────────────────────────────
  function drawBumpers() {
    for (let i = 0; i < BUMPERS.length; i++) {
      const b   = BUMPERS[i];
      b.flash   = Math.max(0, (b.flash || 0) - 0.020);
      const pulse = 0.5 + Math.sin(state.elapsed * 3.0 + i * 1.4) * 0.5;
      const hot   = b.flash + pulse * 0.16;
      ctx.save(); ctx.translate(b.x, b.y);

      // Outer glow halo
      const glowR = b.r + 20 + hot * 14;
      const halo = ctx.createRadialGradient(0, 0, b.r - 8, 0, 0, glowR);
      halo.addColorStop(0, hexToRgba(b.color, FX_LITE ? 0.30 : 0.48 + b.flash * 0.30));
      halo.addColorStop(1, "transparent");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2); ctx.fill();

      ctx.shadowColor = b.color;
      ctx.shadowBlur  = FX_LITE ? 14 + hot * 12 : 22 + hot * 28;

      // Outer ring (rim)
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath(); ctx.arc(0, 0, b.r + 4, 0, Math.PI * 2); ctx.fill();

      // Dome body — 3D radial gradient
      const dome = ctx.createRadialGradient(-b.r * 0.32, -b.r * 0.36, 4, 0, 0, b.r);
      dome.addColorStop(0, "rgba(255,255,255,0.96)");
      dome.addColorStop(0.15, "rgba(255,255,255,0.75)");
      dome.addColorStop(0.38, b.color);
      dome.addColorStop(0.70, hexToRgba(b.color, 0.72));
      dome.addColorStop(1,   "rgba(0,0,0,0.52)");
      ctx.fillStyle = dome;
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();

      // Chrome ring edge
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(220,214,240,0.42)"; ctx.stroke();

      // Inner cap ring (darker recessed area)
      ctx.lineWidth   = 1.5;
      ctx.strokeStyle = "rgba(0,0,0,0.40)";
      ctx.beginPath(); ctx.arc(0, 0, b.r - 14, 0, Math.PI * 2); ctx.stroke();

      // Label
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = "#080c1a";
      ctx.font = `900 ${b.r > 48 ? 20 : 15}px 'Inter',system-ui,sans-serif`;
      ctx.textAlign   = "center"; ctx.textBaseline = "middle";
      ctx.fillText(b.label, 0, 1);

      // Flash burst overlay
      if (b.flash > 0.3) {
        ctx.globalAlpha = b.flash * 0.55;
        ctx.fillStyle   = "#ffffff";
        ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }
  }

  // ── Slingshots — rubber band visual ─────────────────────────────────────
  function drawSlingshots() {
    for (let i = 0; i < SLINGS.length; i++) {
      const sl    = SLINGS[i];
      const flash = state.slingFlash[i];
      ctx.save();
      ctx.lineCap = "round";

      // Outer glow
      ctx.shadowColor = sl.color;
      ctx.shadowBlur  = 6 + flash * 28;

      // Thick rubber body
      ctx.strokeStyle = hexToRgba(sl.color, 0.32 + flash * 0.42);
      ctx.lineWidth   = 16;
      ctx.beginPath(); ctx.moveTo(sl.x1, sl.y1); ctx.lineTo(sl.x2, sl.y2); ctx.stroke();

      // Chrome edge highlight
      ctx.strokeStyle = "rgba(255,255,255,0.48)";
      ctx.lineWidth   = 5;
      ctx.beginPath(); ctx.moveTo(sl.x1, sl.y1); ctx.lineTo(sl.x2, sl.y2); ctx.stroke();

      // Flash burst
      if (flash > 0.5) {
        ctx.strokeStyle = hexToRgba(sl.color, flash * 0.65);
        ctx.lineWidth   = 24;
        ctx.beginPath(); ctx.moveTo(sl.x1, sl.y1); ctx.lineTo(sl.x2, sl.y2); ctx.stroke();
      }

      // End caps (pivot balls)
      [[sl.x1, sl.y1],[sl.x2, sl.y2]].forEach(([px, py]) => {
        const cg = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, 9);
        cg.addColorStop(0, "#ffffff");
        cg.addColorStop(0.5, hexToRgba(sl.color, 0.80));
        cg.addColorStop(1,  "rgba(0,0,0,0.40)");
        ctx.fillStyle = cg;
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
      });

      ctx.restore();
    }
  }

  // ── Ramps — glowing arc lines ────────────────────────────────────────────
  function drawRamps() {
    for (const rp of RAMPS) {
      ctx.save();
      ctx.shadowColor = rp.color;
      ctx.shadowBlur  = 10 + rp.flash * 32;

      // Glowing arc path indicator
      const mx = rp.x + rp.w / 2;
      const my = rp.y;
      // Ramp entry glow
      roundRect(ctx, rp.x, rp.y, rp.w, rp.h, 10);
      const rg = ctx.createLinearGradient(rp.x, rp.y, rp.x, rp.y + rp.h);
      rg.addColorStop(0, hexToRgba(rp.color, 0.28 + rp.flash * 0.28));
      rg.addColorStop(1, hexToRgba(rp.color, 0.10 + rp.flash * 0.18));
      ctx.fillStyle = rg; ctx.fill();
      ctx.strokeStyle = hexToRgba(rp.color, 0.65 + rp.flash * 0.35);
      ctx.lineWidth = 3; ctx.stroke();

      // Top highlight
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      roundRect(ctx, rp.x + 2, rp.y + 2, rp.w - 4, rp.h * 0.4, 7);
      ctx.fill();

      // Ramp arc path
      ctx.globalAlpha = 0.28 + rp.flash * 0.35;
      ctx.strokeStyle = rp.color; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.bezierCurveTo(mx, my - 60, rp.exitX + (mx < 400 ? 40 : -40), (rp.exitY + my) / 2, rp.exitX, rp.exitY);
      ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      // Label
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = "rgba(245,240,255,0.85)";
      ctx.font        = "800 10px 'JetBrains Mono',monospace";
      ctx.textAlign   = "center"; ctx.textBaseline = "middle";
      ctx.fillText(rp.label, mx, rp.y + rp.h / 2);

      // Completion sparkle
      if (rp.flash > 0.7) {
        for (let si = 0; si < 6; si++) {
          const sa = (si / 6) * Math.PI * 2 + state.elapsed * 4;
          const sr = 24 + rp.flash * 18;
          ctx.fillStyle = hexToRgba(rp.color, rp.flash * 0.9);
          ctx.beginPath();
          ctx.arc(mx + Math.cos(sa) * sr, my + Math.sin(sa) * sr, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  // ── Spinners — 3D rotation visualization ────────────────────────────────
  function drawSpinners() {
    for (let i = 0; i < SPINNERS.length; i++) {
      const sp    = SPINNERS[i];
      const flash = state.spinnerFlash[i];
      ctx.save(); ctx.translate(sp.x, sp.y + sp.h / 2);
      ctx.rotate(sp.angle);

      ctx.shadowColor = sp.color;
      ctx.shadowBlur  = 8 + flash * 24;
      ctx.lineCap     = "round";

      // Motion blur effect (secondary ghost lines)
      if (!FX_LITE && Math.abs(sp.spin) > 0.1) {
        ctx.globalAlpha = 0.28;
        ctx.rotate(0.18 * Math.sign(sp.spin));
        ctx.strokeStyle = sp.color; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(0, -sp.h / 2 * 0.85); ctx.lineTo(0, sp.h / 2 * 0.85); ctx.stroke();
        ctx.rotate(-0.36 * Math.sign(sp.spin));
        ctx.beginPath(); ctx.moveTo(0, -sp.h / 2 * 0.85); ctx.lineTo(0, sp.h / 2 * 0.85); ctx.stroke();
        ctx.rotate(0.18 * Math.sign(sp.spin));
        ctx.globalAlpha = 1;
      }

      // Main blade
      const sg = ctx.createLinearGradient(0, -sp.h / 2, 0, sp.h / 2);
      sg.addColorStop(0, hexToRgba(sp.color, 0.40 + flash * 0.40));
      sg.addColorStop(0.5, hexToRgba(sp.color, 0.80 + flash * 0.20));
      sg.addColorStop(1, hexToRgba(sp.color, 0.40 + flash * 0.40));
      ctx.strokeStyle = sg; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(0, -sp.h / 2); ctx.lineTo(0, sp.h / 2); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -sp.h / 2); ctx.lineTo(0, sp.h / 2); ctx.stroke();

      // Crossbar
      ctx.strokeStyle = hexToRgba(sp.color, 0.60 + flash * 0.30); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();

      // Center pivot
      const pg = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
      pg.addColorStop(0, "#ffffff"); pg.addColorStop(1, hexToRgba(sp.color, 0.60));
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    }
  }

  // ── Era drop-targets ─────────────────────────────────────────────────────
  function drawEraTargets() {
    // Era colour theme mapping
    const ERA_THEME_COLORS = {
      "RENAISSANCE": "#d4a017",
      "INDUSTRIAL":  "#cd7f32",
      "WWII":        "#5a7a5a",
      "COLD WAR":    "#4fc3c3",
      "DIGITAL AGE": "#a080f8"
    };

    for (const era of state.eraTargets) {
      const eraColor = ERA_THEME_COLORS[era.era] || era.color;
      for (const t of era.targets) {
        const oy = t.down ? 14 : 0;
        ctx.save(); ctx.translate(t.x, t.y + oy);
        ctx.shadowColor = eraColor;
        ctx.shadowBlur  = t.down ? 2 : (12 + t.flash * 22);

        // Target slab gradient
        roundRect(ctx, 0, 0, t.w, t.h, 7);
        if (t.down) {
          // Knocked down — recessed grey
          const dg = ctx.createLinearGradient(0, 0, 0, t.h);
          dg.addColorStop(0, "rgba(20,16,36,0.55)");
          dg.addColorStop(1, "rgba(10,8,18,0.35)");
          ctx.fillStyle = dg;
        } else {
          // Standing — era-themed solid
          const sg = ctx.createLinearGradient(0, 0, 0, t.h);
          sg.addColorStop(0, hexToRgba(eraColor, 0.60 + t.flash * 0.22));
          sg.addColorStop(1, hexToRgba(eraColor, 0.28 + t.flash * 0.12));
          ctx.fillStyle = sg;
        }
        ctx.fill();

        // Border
        ctx.strokeStyle = t.down
          ? "rgba(255,255,255,0.10)"
          : hexToRgba(eraColor, 0.90 + t.flash * 0.10);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Top highlight (3D bevel)
        if (!t.down) {
          ctx.fillStyle = "rgba(255,255,255,0.16)";
          roundRect(ctx, 1.5, 1.5, t.w - 3, t.h * 0.38, 5);
          ctx.fill();
        }

        // Label
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = t.down ? "rgba(255,255,255,0.25)" : "#f5f0ff";
        ctx.font        = "900 12px 'JetBrains Mono',monospace";
        ctx.textAlign   = "center"; ctx.textBaseline = "middle";
        ctx.fillText(t.label, t.w / 2, t.h / 2 + 1);

        // Sparkle on fresh knockdown
        if (t.flash > 0.5) {
          for (let si = 0; si < 4; si++) {
            const sa = (si / 4) * Math.PI * 2 + state.elapsed * 5;
            const sr = t.flash * 16;
            ctx.fillStyle = hexToRgba(eraColor, t.flash * 0.8);
            ctx.beginPath();
            ctx.arc(t.w / 2 + Math.cos(sa) * sr, t.h / 2 + Math.sin(sa) * sr, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // Era row label
      const firstT = era.targets[0];
      const eraColor2 = ERA_THEME_COLORS[era.era] || era.color;
      ctx.save();
      if (era.completed) {
        ctx.shadowColor = eraColor2; ctx.shadowBlur = 10;
      }
      ctx.fillStyle = era.completed ? eraColor2 : hexToRgba(eraColor2, 0.52);
      ctx.font = `${era.completed ? 900 : 700} 9px 'JetBrains Mono',monospace`;
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      ctx.fillText(era.era + (era.completed ? " ✓" : ""), firstT.x, firstT.y - 3);
      ctx.restore();
    }
  }

  // ── Flippers ─────────────────────────────────────────────────────────────
  function drawFlippers() {
    drawOneFlipper(getFlipper("left"),  "#5de0f0", state.flipperFlash[0]);
    drawOneFlipper(getFlipper("right"), "#f07bb8", state.flipperFlash[1]);
  }

  function drawOneFlipper(f, color, flash) {
    ctx.save(); ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur  = f.active ? 32 : (8 + flash * 24);

    // Shadow body
    ctx.strokeStyle = "rgba(0,0,0,0.60)"; ctx.lineWidth = 44;
    ctx.beginPath(); ctx.moveTo(f.pivot.x, f.pivot.y); ctx.lineTo(f.end.x, f.end.y); ctx.stroke();

    // Rubber body gradient
    const grad = ctx.createLinearGradient(f.pivot.x, f.pivot.y, f.end.x, f.end.y);
    if (f.active) {
      grad.addColorStop(0, color);
      grad.addColorStop(0.4, "#f5f0ff");
      grad.addColorStop(1, color);
    } else {
      grad.addColorStop(0, hexToRgba(color, 0.80));
      grad.addColorStop(0.4, "rgba(245,240,255,0.90)");
      grad.addColorStop(1, hexToRgba(color, 0.80));
    }
    ctx.strokeStyle = grad; ctx.lineWidth = 28;
    ctx.beginPath(); ctx.moveTo(f.pivot.x, f.pivot.y); ctx.lineTo(f.end.x, f.end.y); ctx.stroke();

    // Chrome highlight along top
    ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(f.pivot.x, f.pivot.y); ctx.lineTo(f.end.x, f.end.y); ctx.stroke();

    // Active flash
    if (flash > 0.4) {
      ctx.strokeStyle = hexToRgba(color, flash * 0.50); ctx.lineWidth = 40;
      ctx.beginPath(); ctx.moveTo(f.pivot.x, f.pivot.y); ctx.lineTo(f.end.x, f.end.y); ctx.stroke();
    }

    // Pivot hub — brass ring
    const pivG = ctx.createRadialGradient(f.pivot.x - 5, f.pivot.y - 5, 4, f.pivot.x, f.pivot.y, 24);
    pivG.addColorStop(0, "rgba(232,184,75,0.80)");
    pivG.addColorStop(0.5, "rgba(200,146,42,0.50)");
    pivG.addColorStop(1, "rgba(80,50,10,0.40)");
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = "#0e0c1e";
    ctx.beginPath(); ctx.arc(f.pivot.x, f.pivot.y, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle   = pivG;
    ctx.beginPath(); ctx.arc(f.pivot.x, f.pivot.y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(232,184,75,0.65)"; ctx.lineWidth = 2.5; ctx.stroke();

    ctx.restore();
  }

  // ── Balls — chrome with 18-point trail ───────────────────────────────────
  function drawBalls() {
    for (const ball of state.balls) {
      if (ball.stuck) {
        const bob = Math.sin(state.elapsed * 8) * 2 + state.plungerCharge * 44;
        ball.x = 768; ball.y = 1210 + bob;
      }

      // Motion trail (18 points)
      const trailColor = state.multiBallActive
        ? (ball.id % 2 === 0 ? "93,224,240" : "240,123,184")
        : "93,224,240";
      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const frac = i / ball.trail.length;
        const a = frac * 0.32 * clamp(t.life, 0, 1);
        ctx.fillStyle = `rgba(${trailColor},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * frac, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ball body
      ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.spin);
      ctx.shadowColor = state.multiBallActive ? "#f07bb8" : "#5de0f0";
      ctx.shadowBlur  = state.multiBallActive ? 30 : 20;

      // Chrome gradient — deep sphere illusion
      const g = ctx.createRadialGradient(-ball.r * 0.38, -ball.r * 0.42, 2, 0, 0, ball.r);
      g.addColorStop(0,    "#ffffff");
      g.addColorStop(0.12, "rgba(255,255,255,0.95)");
      g.addColorStop(0.35, "#b8e8f8");
      g.addColorStop(0.60, "#6ecde8");
      g.addColorStop(0.84, "#2862a0");
      g.addColorStop(1,    "#0e1e40");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, ball.r, 0, Math.PI * 2); ctx.fill();

      // Chrome ring
      ctx.strokeStyle = "rgba(255,255,255,0.50)"; ctx.lineWidth = 1.8; ctx.stroke();

      // Bottom shadow crescent
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.arc(ball.r * 0.2, ball.r * 0.3, ball.r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.beginPath();
      ctx.ellipse(-ball.r * 0.32, -ball.r * 0.36, ball.r * 0.28, ball.r * 0.16, -0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ── Particles & float text ───────────────────────────────────────────────
  function drawParticles() {
    ctx.save();
    for (const p of state.particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = FX_LITE ? 0 : 6;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
    for (const t of state.floatText) {
      ctx.globalAlpha = clamp(t.life, 0, 1);
      ctx.fillStyle   = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur  = FX_LITE ? 6 : 16;
      ctx.font        = "900 23px 'JetBrains Mono',monospace";
      ctx.textAlign   = "center";
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  // ── Plunger lane ─────────────────────────────────────────────────────────
  function drawPlunger() {
    const charge = state.plungerCharge;
    ctx.save();

    // Lane background
    const lg = ctx.createLinearGradient(728, 170, 812, 170);
    lg.addColorStop(0, "rgba(0,0,0,0.38)");
    lg.addColorStop(0.5, "rgba(14,8,30,0.55)");
    lg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = lg;
    roundRect(ctx, 728, 170, 84, 1070, 18); ctx.fill();
    ctx.strokeStyle = "rgba(200,146,42,0.18)"; ctx.lineWidth = 2; ctx.stroke();

    // Launch guide dashes
    ctx.globalAlpha = 0.32 + charge * 0.40;
    const dashColor = charge > 0.6
      ? `rgba(240,72,96,${0.60 + charge * 0.30})`
      : `rgba(200,146,42,${0.45 + charge * 0.35})`;
    ctx.strokeStyle = dashColor;
    ctx.lineWidth   = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(768, 1198);
    ctx.bezierCurveTo(776, 880, 788, 430, 708, 178);
    ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    // Plunger bar body
    const barBg = ctx.createLinearGradient(750, 0, 786, 0);
    barBg.addColorStop(0, "rgba(200,146,42,0.22)");
    barBg.addColorStop(0.5, "rgba(232,184,75,0.35)");
    barBg.addColorStop(1, "rgba(200,146,42,0.18)");
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    roundRect(ctx, 750, 1090, 36, 200, 12); ctx.fill();
    ctx.strokeStyle = "rgba(200,146,42,0.25)"; ctx.lineWidth = 1.5; ctx.stroke();

    // Charge indicator fill
    const barH = 60 + charge * 74;
    const barY = 1244 - charge * 128;
    const chargeColor = charge > 0.7
      ? `rgba(240,72,96,${0.45 + charge * 0.40})`
      : `rgba(200,146,42,${0.30 + charge * 0.48})`;
    ctx.fillStyle   = chargeColor;
    roundRect(ctx, 755, barY, 26, barH, 9); ctx.fill();
    const chargeBorder = charge > 0.7
      ? `rgba(255,140,150,${0.60 + charge * 0.30})`
      : `rgba(232,184,75,${0.55 + charge * 0.35})`;
    ctx.strokeStyle = chargeBorder; ctx.lineWidth = 1.5; ctx.stroke();

    // Charge glow
    if (charge > 0.3) {
      ctx.shadowColor = charge > 0.7 ? "#f04860" : "#d4a017";
      ctx.shadowBlur  = charge * 28;
      roundRect(ctx, 755, barY, 26, barH, 9); ctx.stroke();
      ctx.shadowBlur  = 0;
    }

    // "LAUNCH" label
    ctx.fillStyle   = "rgba(245,240,255,0.62)";
    ctx.font        = "800 11px 'JetBrains Mono',monospace";
    ctx.textAlign   = "center";
    ctx.fillText("LAUNCH", 768, 1080);

    // Launch hint
    if (state.launchHint > 0 && state.balls.some(b => b.stuck)) {
      const alpha = 0.58 + Math.sin(state.elapsed * 6) * 0.22;
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = "rgba(200,146,42,0.94)";
      ctx.font        = "900 20px 'JetBrains Mono',monospace";
      ctx.textAlign   = "center";
      ctx.fillText("TAP LAUNCH", 400, 1152);
      ctx.font        = "700 12px 'Inter',system-ui,sans-serif";
      ctx.fillStyle   = "rgba(245,240,255,0.65)";
      ctx.fillText("Space · Z = left   / = right", 400, 1172);
      ctx.globalAlpha = 1;
    }

    // Ball save indicator
    if (state.ballSave > 0 && state.mode === "playing") {
      ctx.fillStyle   = "rgba(82,232,160,0.90)";
      ctx.font        = "900 14px 'JetBrains Mono',monospace";
      ctx.textAlign   = "center";
      ctx.fillText(`BALL SAVE ${Math.ceil(state.ballSave)}`, 400, 1092);
    }

    ctx.restore();
  }

  // ── HUD overlay (on-table overlays) ──────────────────────────────────────
  function drawHudOverlay() {
    // Tilt lockout
    if (state.tiltLocked) {
      ctx.save();
      ctx.globalAlpha = 0.60 + Math.sin(state.elapsed * 8) * 0.18;
      ctx.fillStyle   = "rgba(240,72,96,0.18)";
      roundRect(ctx, 78, 66, 666, 1278, 22); ctx.fill();
      ctx.fillStyle   = "#f04860";
      ctx.shadowColor = "#f04860"; ctx.shadowBlur = 24;
      ctx.font        = "900 52px 'Fraunces',Georgia,serif";
      ctx.textAlign   = "center"; ctx.textBaseline = "middle";
      ctx.fillText("TILT", 401, 760);
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = "rgba(245,240,255,0.80)";
      ctx.font        = "700 18px 'JetBrains Mono',monospace";
      ctx.fillText(`Lockout: ${Math.ceil(state.tiltLockTimer)}s`, 401, 820);
      ctx.restore();
    }

    // Tilt warning edge flash (screen edge red)
    if (state.tiltWarnings > 0 && !state.tiltLocked && state.shake > 0.1) {
      ctx.save();
      const edgeGlow = ctx.createRadialGradient(401, 700, 280, 401, 700, 580);
      edgeGlow.addColorStop(0, "transparent");
      edgeGlow.addColorStop(1, `rgba(240,72,96,${state.shake * 0.55})`);
      ctx.fillStyle = edgeGlow;
      roundRect(ctx, 78, 66, 666, 1278, 22); ctx.fill();
      ctx.restore();
    }

    // Active mission banner
    if (state.currentMissionEra >= 0 && state.mode === "playing") {
      const era = state.eraTargets[state.currentMissionEra];
      if (era) {
        ctx.save(); ctx.globalAlpha = 0.90;
        const mBg = ctx.createLinearGradient(78, 540, 744, 580);
        mBg.addColorStop(0, hexToRgba(era.color, 0.06));
        mBg.addColorStop(0.5, hexToRgba(era.color, 0.22));
        mBg.addColorStop(1, hexToRgba(era.color, 0.06));
        ctx.fillStyle = mBg;
        roundRect(ctx, 78, 538, 646, 44, 10); ctx.fill();
        ctx.strokeStyle = hexToRgba(era.color, 0.65); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = era.color;
        ctx.shadowColor = era.color; ctx.shadowBlur = 8;
        ctx.font = "900 15px 'JetBrains Mono',monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(
          `${era.era} MISSION · Q ${state.missionStep + 1}/3${state.missionRampDone ? " · RAMP ✓" : ""}`,
          401, 560
        );
        ctx.restore();
      }
    }

    // Wizard mode full overlay
    if (state.wizardMode) {
      const t = state.wizardTimer;
      ctx.save();
      // Edge pulse glow
      ctx.globalAlpha = 0.40 + Math.sin(state.elapsed * 5) * 0.12;
      const wizGlow = ctx.createRadialGradient(401, 700, 200, 401, 700, 600);
      wizGlow.addColorStop(0, "transparent");
      wizGlow.addColorStop(1, "rgba(212,160,23,0.28)");
      ctx.fillStyle = wizGlow;
      roundRect(ctx, 78, 66, 666, 1278, 22); ctx.fill();
      // Banner
      ctx.globalAlpha = 0.85 + Math.sin(state.elapsed * 6) * 0.12;
      ctx.fillStyle = hexToRgba("#d4a017", 0.16);
      roundRect(ctx, 78, 78, 666, 56, 14); ctx.fill();
      ctx.strokeStyle = "rgba(212,160,23,0.65)"; ctx.lineWidth = 2; ctx.stroke();
      // Text
      ctx.globalAlpha = 1;
      ctx.fillStyle   = "#d4a017";
      ctx.shadowColor = "#d4a017"; ctx.shadowBlur = 18;
      ctx.font        = "900 19px 'Fraunces',Georgia,serif";
      ctx.textAlign   = "center"; ctx.textBaseline = "middle";
      ctx.fillText(`★ WIZARD MODE · ${Math.ceil(t)}s · 5× SCORING ★`, 401, 106);
      ctx.restore();
    }

    // Score count-up tween — update HUD class for wizard glow
    if (state.wizardMode) {
      document.body.classList.add("wizard-hud");
    } else {
      document.body.classList.remove("wizard-hud");
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
    updateDmd(dt);
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

  // ─── High score table helpers ──────────────────────────────────────────────
  function loadScoreTable() {
    try {
      return JSON.parse(localStorage.getItem(`${STORAGE_KEY}:scoreTable`) || "[]");
    } catch { return []; }
  }
  function saveScoreTable(table) {
    localStorage.setItem(`${STORAGE_KEY}:scoreTable`, JSON.stringify(table.slice(0, 8)));
  }
  function insertScore(initials, score) {
    const t = loadScoreTable();
    t.push({ initials: String(initials || "---").toUpperCase().slice(0, 3), score: Math.floor(score) });
    t.sort((a, b) => b.score - a.score);
    saveScoreTable(t);
    return t;
  }
  function renderHighScoreStrip() {
    const strip = document.getElementById("highScoreStrip");
    if (!strip) return;
    const t = loadScoreTable();
    if (!t.length) { strip.innerHTML = ""; return; }
    const ranks = ["1ST","2ND","3RD"];
    strip.innerHTML = t.slice(0, 5).map((e, i) =>
      `<div class="hs-entry">
         <span class="hs-rank">${ranks[i] || (i+1)+"TH"}</span>
         <span class="hs-initials">${escapeHtml(e.initials)}</span>
         <span class="hs-score">${formatNumber(e.score)}</span>
       </div>`
    ).join("");
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
    setDmdMsg("CHRONO PINBALL  LOADING ARCHIVE  PLEASE WAIT", "", "#d4a017", 0);
    renderHighScoreStrip();
    bindInitialsEntry();
    requestAnimationFrame(loop);

    try {
      await loadBank();
      setMission("Chrono Pinball ready", "Select a course, then hit Launch Table. Z = left flipper  / = right flipper  Space = plunger  T = tilt.", "");
      setDmdMsg("CHRONO PINBALL  SELECT COURSE  INSERT COIN TO PLAY", "", "#d4a017", 0);
    } catch (err) {
      console.error("Bank load failed:", err);
      els.startBtn.textContent = "Bank failed — refresh";
      els.setupMetrics.innerHTML = `<span class="metric-pill">Question bank offline. Try refreshing.</span>`;
      setMission("Bank error", "The review library did not load. Refresh the page.", "bank offline", "bad");
    }
  }

  function bindInitialsEntry() {
    const saveBtn = document.getElementById("saveInitialsBtn");
    if (!saveBtn) return;
    saveBtn.addEventListener("click", () => {
      const ini = [0,1,2].map(i => {
        const el = document.getElementById(`ini${i}`);
        return el ? (el.value.trim().toUpperCase()[0] || "-") : "-";
      }).join("");
      insertScore(ini, state.scoreCountTarget);
      renderHighScoreStrip();
      const entry = document.getElementById("initialsEntry");
      if (entry) entry.style.display = "none";
      // Flash DMD with the saved score
      setDmdMsg(`${ini} SCORED ${formatNumber(state.scoreCountTarget)}  NEW RECORD!`, "", "#d4a017", 2.5);
    });

    // Auto-advance between initial boxes
    [0,1,2].forEach(i => {
      const el = document.getElementById(`ini${i}`);
      if (!el) return;
      el.addEventListener("input", () => {
        el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
        const next = document.getElementById(`ini${i+1}`);
        if (el.value && next) next.focus();
      });
      el.addEventListener("keydown", e => {
        if (e.key === "Backspace" && !el.value && i > 0) {
          document.getElementById(`ini${i-1}`)?.focus();
        }
      });
    });
  }

  init();
})();
