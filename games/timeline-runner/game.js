(() => {
  "use strict";

  // ─── Constants ─────────────────────────────────────────────────────────────
  const BASE_W = 1600;
  const BASE_H = 900;
  const STORAGE_KEY = "mr-macs-timeline-runner-v1";
  const $ = (id) => document.getElementById(id);
  const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;

  // ─── DOM refs ──────────────────────────────────────────────────────────────
  const els = {
    canvas: $("runnerCanvas"),
    score: $("score"),
    streak: $("streak"),
    health: $("health"),
    speed: $("speed"),
    questionCard: $("questionCard"),
    questionMeta: $("questionMeta"),
    questionPrompt: $("questionPrompt"),
    stimulusStrip: $("stimulusStrip"),
    laneChips: $("laneChips"),
    feedback: $("feedback"),
    setupScreen: $("setupScreen"),
    pauseScreen: $("pauseScreen"),
    endScreen: $("endScreen"),
    courseFilter: $("courseFilter"),
    setFilter: $("setFilter"),
    intensityFilter: $("intensityFilter"),
    setupMetrics: $("setupMetrics"),
    startBtn: $("startBtn"),
    soundBtn: $("soundBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    pauseBtn: $("pauseBtn"),
    backBtn: $("backBtn"),
    resumeBtn: $("resumeBtn"),
    restartBtn: $("restartBtn"),
    setupBtn: $("setupBtn"),
    againBtn: $("againBtn"),
    leftBtn: $("leftBtn"),
    rightBtn: $("rightBtn"),
    jumpBtn: $("jumpBtn"),
    slideBtn: $("slideBtn"),
    endTitle: $("endTitle"),
    endGrid: $("endGrid"),
    studyTargets: $("studyTargets")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const liteFx = new URLSearchParams(location.search).get("fx") !== "full";
  document.documentElement.classList.toggle("perf-lite", liteFx);

  // ─── Era bands ─────────────────────────────────────────────────────────────
  const ERAS = [
    { name: "Industrial",    startKm: 0,    color: "#c97b3a", sky: "#1a0e06", accent: "#f5a623", filter: "sepia(0.35) hue-rotate(8deg)" },
    { name: "Cold War",      startKm: 0.5,  color: "#4a7fb5", sky: "#06101a", accent: "#75ecff", filter: "hue-rotate(195deg) saturate(1.1)" },
    { name: "Digital Age",   startKm: 1.0,  color: "#67f0a8", sky: "#021209", accent: "#00ffaa", filter: "hue-rotate(140deg) saturate(1.25)" },
    { name: "Future",        startKm: 1.5,  color: "#ff7bcc", sky: "#120618", accent: "#e040fb", filter: "hue-rotate(280deg) saturate(1.3)" }
  ];

  // ─── Intensity profiles ────────────────────────────────────────────────────
  const intensityProfiles = {
    standard: { label: "Standard run", speed: 1,    gateEvery: 7.6, obstacleEvery: 1.05, pickupEvery: 3.2 },
    exam:     { label: "Exam sprint",   speed: 1.13, gateEvery: 6.5, obstacleEvery: 0.86, pickupEvery: 3.8 },
    endless:  { label: "Endless chaos", speed: 1.26, gateEvery: 5.9, obstacleEvery: 0.72, pickupEvery: 4.2 }
  };

  // ─── Obstacle types (5+) ───────────────────────────────────────────────────
  const OBSTACLE_TYPES = [
    { id: "block",    label: "JUMP",    mode: "jump",  color: "#f5c451", w: 80, h: 70  }, // static block → jump
    { id: "pipe",     label: "SLIDE",   mode: "slide", color: "#ff7bcc", w: 120, h: 42 }, // low pipe → slide
    { id: "fence",    label: "SWAP",    mode: "dodge", color: "#75ecff", w: 55, h: 160 }, // side fence → lane swap
    { id: "cart",     label: "DODGE",   mode: "dodge", color: "#e040fb", w: 90, h: 60, moving: true }, // moving cart
    { id: "gap",      label: "JUMP",    mode: "jump",  color: "#f5a623", w: 140, h: 20 }, // gap
    { id: "boss",     label: "DODGE",   mode: "boss",  color: "#ff4444", w: 200, h: 200, windup: 3.0 }  // boss block
  ];

  // ─── Pickup types ──────────────────────────────────────────────────────────
  const PICKUP_TYPES = {
    coin:    { color: "#f5c451", label: "+coin",    score: 50   },
    magnet:  { color: "#ff7bcc", label: "magnet",   duration: 8  },
    shield:  { color: "#75ecff", label: "+shield"               },
    boost:   { color: "#f5c451", label: "boost!",   duration: 5  },
    jetpack: { color: "#67f0a8", label: "jetpack",  duration: 8  }
  };

  const laneNames  = ["left", "center", "right"];
  const gateColors = ["#75ecff", "#f5c451", "#ff7bcc"];
  const images     = {};

  // ─── Player state ──────────────────────────────────────────────────────────
  const player = {
    lane: 1,
    visualLane: 1,
    // Jump
    jumpTime: 0,
    jumpHeld: false,
    jumpBuffer: 0,          // pre-input buffer (s)
    coyoteTime: 0,          // post-edge coyote window (s)
    airborne: false,
    doubleJumpUsed: false,
    // Slide
    slideTime: 0,
    // Power-ups
    invulnerable: 0,
    magnetTimer: 0,
    boostTimer: 0,
    jetpackTimer: 0,
    // Lane interpolation
    laneChangeBlur: 0
  };

  // ─── Run state ─────────────────────────────────────────────────────────────
  const state = {
    bank: null,
    filtered: [],
    queue: [],
    running: false,
    paused: false,
    gameOver: false,
    sound: true,
    last: 0,
    frameStamp: 0,
    elapsed: 0,
    distance: 0,          // metres
    score: 0,
    correct: 0,
    answered: 0,
    streak: 0,
    coinStreak: 0,         // unbroken coin pickups
    multiplier: 1,
    health: 3,
    shields: 0,
    speedPace: 1,
    currentQuestion: null,
    currentChoices: [],
    gateActive: null,
    nextGateId: 1,
    gateTimer: 2.4,
    obstacleTimer: 1.4,
    pickupTimer: 2.2,
    nextGateAt: 200,       // distance (m) for next gate
    pauseUsed: false,      // 1-use pause per run
    objects: [],
    particles: [],
    texts: [],
    speedLines: [],
    wrongs: [],
    feedbackUntil: 0,
    shake: 0,
    flash: 0,
    flashColor: "#75ecff",
    deathAnim: 0,          // 0 = none, > 0 = countdown
    eraIndex: 0,
    eraTransition: 0,      // 0-1 blend between eras
    assetsReady: false,
    bestDistance: Number(localStorage.getItem(`${STORAGE_KEY}:bestDistance`) || 0),
    totalCoins: Number(localStorage.getItem(`${STORAGE_KEY}:totalCoins`) || 0),
    // shop upgrades
    startWithShield: Boolean(JSON.parse(localStorage.getItem(`${STORAGE_KEY}:startShield`) || "false")),
    powerupDuration: Number(localStorage.getItem(`${STORAGE_KEY}:powerupDuration`) || 0),
    pointerStart: null,
    pointerHoldStart: 0,
    sawFirstGate: false,
    runCourse: "All Courses",
    runSet: "All Sets",
    runIntensity: "standard",
    checkpointMode: "standby",
    debriefUntil: 0,
    chunkSeed: 0,
    bossWarning: 0,         // seconds remaining in boss windup
    eraKeys: 0,
    stage: { scale: 1, ox: 0, oy: 0, width: BASE_W, height: BASE_H }
  };

  // ─── Persistence helpers ───────────────────────────────────────────────────
  function persistState() {
    localStorage.setItem(`${STORAGE_KEY}:bestDistance`, String(state.bestDistance));
    localStorage.setItem(`${STORAGE_KEY}:totalCoins`,   String(state.totalCoins));
  }

  // ─── Audio Bus (Web Audio only) ────────────────────────────────────────────
  class AudioBus {
    constructor() {
      this.ctx       = null;
      this.beatStep  = 0;
      this.nextBeat  = 0;
      this.droneNode = null;
      this.droneGain = null;
      this.droneFilter = null;
      this.footTimer = 0;
    }

    ensure() {
      if (!state.sound) return null;
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }

    tone(freq, dur = 0.08, type = "sine", gain = 0.03, when = 0) {
      const ac = this.ensure(); if (!ac) return;
      const t0  = ac.currentTime + when;
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(amp).connect(ac.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.04);
    }

    noise(dur = 0.08, gain = 0.035) {
      const ac = this.ensure(); if (!ac) return;
      const buf  = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ac.createBufferSource();
      const amp = ac.createGain();
      amp.gain.value = gain;
      src.buffer = buf;
      src.connect(amp).connect(ac.destination);
      src.start();
    }

    // Footstep loop synced to scroll speed
    footstep(now, dt) {
      if (!state.running || state.paused || state.gameOver || player.airborne) return;
      this.footTimer -= dt;
      if (this.footTimer > 0) return;
      const interval = 0.30 / Math.max(0.6, state.speedPace);
      this.footTimer = interval;
      const base = 90 + Math.random() * 30;
      this.tone(base, 0.04, "triangle", 0.012);
    }

    coin() {
      // random pitch within a major third (200–250 Hz)
      const freq = 760 + Math.floor(Math.random() * 4) * 65;
      this.tone(freq, 0.06, "triangle", 0.028);
      this.tone(freq * 1.26, 0.08, "sine", 0.018, 0.04);
    }

    powerupArpeggio(kind) {
      const ac = this.ensure(); if (!ac) return;
      const roots = { magnet: 330, shield: 440, boost: 220, jetpack: 550 };
      const root  = roots[kind] || 440;
      const scale = [0, 4, 7, 12, 16];
      scale.forEach((semi, i) => {
        this.tone(root * Math.pow(2, semi / 12), 0.09, "triangle", 0.022, i * 0.065);
      });
    }

    hitThud() {
      // thud + descending glissando
      const ac = this.ensure(); if (!ac) return;
      this.noise(0.14, 0.055);
      const t0  = ac.currentTime;
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, t0);
      osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.4);
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(0.04, t0 + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
      osc.connect(amp).connect(ac.destination);
      osc.start(t0); osc.stop(t0 + 0.45);
    }

    eraStinger(eraIndex) {
      const roots = [130, 220, 311, 440];
      const root  = roots[eraIndex % roots.length];
      [0, 4, 7, 12].forEach((semi, i) => {
        this.tone(root * Math.pow(2, semi / 12), 0.18, "sine", 0.028, i * 0.10);
      });
    }

    correct() {
      this.tone(640, 0.08, "triangle", 0.038);
      this.tone(960, 0.10, "triangle", 0.030, 0.07);
      this.tone(1280, 0.13, "sine", 0.025, 0.14);
    }

    wrong() {
      this.tone(210, 0.13, "sawtooth", 0.034);
      this.tone(145, 0.18, "sawtooth", 0.025, 0.11);
    }

    lane() { this.tone(360 + player.lane * 90, 0.045, "triangle", 0.018); }
    jump() { this.tone(520, 0.06, "sine", 0.022); this.tone(820, 0.08, "triangle", 0.016, 0.035); }
    slide() { this.tone(180, 0.07, "sawtooth", 0.015); }
    shield() { this.tone(440, 0.08, "sine", 0.024); this.tone(660, 0.10, "sine", 0.018, 0.07); }

    startRun() {
      this.tone(220, 0.09, "sine", 0.03);
      this.tone(440, 0.12, "triangle", 0.026, 0.08);
      this.tone(880, 0.15, "sine", 0.024, 0.17);
      this.beatStep = 0; this.nextBeat = 0;
      this.startDrone();
    }

    startDrone() {
      const ac = this.ensure(); if (!ac) return;
      this.stopDrone();
      const osc    = ac.createOscillator();
      const filter = ac.createBiquadFilter();
      const amp    = ac.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 55;
      filter.type = "lowpass";
      filter.frequency.value = 400;
      filter.Q.value = 2;
      amp.gain.value = 0.008;
      osc.connect(filter).connect(amp).connect(ac.destination);
      osc.start();
      this.droneNode   = osc;
      this.droneGain   = amp;
      this.droneFilter = filter;
    }

    updateDrone() {
      if (!this.droneNode || !this.droneFilter) return;
      // Era-tinted filter sweep
      const targetFreq = 200 + state.eraIndex * 180 + (state.speedPace - 1) * 400;
      const cur = this.droneFilter.frequency.value;
      this.droneFilter.frequency.value = cur + (targetFreq - cur) * 0.04;
      if (this.droneGain) this.droneGain.gain.value = state.sound ? 0.008 : 0;
    }

    stopDrone() {
      try { if (this.droneNode) { this.droneNode.stop(); } } catch (_) {}
      this.droneNode = this.droneGain = this.droneFilter = null;
    }

    music(now) {
      if (!state.running || state.paused || state.gameOver || reduceMotion) return;
      const ac = this.ensure(); if (!ac) return;
      if (now < this.nextBeat) return;
      const pace  = 0.56 / Math.max(0.85, Math.min(1.6, state.speedPace));
      const root  = player.boostTimer > 0 ? 146.83 : 130.81;
      const note  = [0, 7, 12, 7, 3, 10, 12, 15][this.beatStep % 8];
      if (this.beatStep % 4 === 0) this.tone(root,                                    0.08, "sine",     0.016);
      if (this.beatStep % 2 === 0) this.tone(root * Math.pow(2, note / 12),            0.07, "triangle", 0.012, 0.02);
      if (this.beatStep % 8 === 7) this.tone(root * 4,                                 0.04, "sine",     0.010, 0.06);
      this.beatStep++;
      this.nextBeat = now + pace;
    }
  }
  const audio = new AudioBus();

  // ─── Utility helpers ────────────────────────────────────────────────────────
  const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp   = (a, b, t)   => a + (b - a) * t;
  const easeOut = (t)        => 1 - Math.pow(1 - clamp(t, 0, 1), 2.4);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatNumber(v) { return Math.max(0, Math.floor(v)).toLocaleString(); }
  function formatKm(m)     { return (m / 1000).toFixed(2) + " km"; }

  function escapeHtml(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function normalize(v) {
    return String(v || "").toLowerCase()
      .replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
  }

  function cleanText(t) {
    return String(t || "").replace(/\s+/g, " ")
      .replace(/\bcon\s+icts\b/gi, "conflicts")
      .replace(/\bUnited states\b/g, "United States")
      .replace(/\bu\.s\.\b/gi, "U.S.").replace(/\bnys\b/gi, "NYS").trim();
  }

  function displayPrompt(q) {
    const raw = cleanText(q?.prompt || "");
    return raw
      .replace(/^final\s+clue(?:\s+for\s+[^:]+)?:\s*/i, "")
      .replace(/^name\s+this\s+content\s+item:\s*/i, "")
      .replace(/^this\s+is\s+his\s+/i, "Identify: ")
      .replace(/^this\s+is\s+her\s+/i, "Identify: ")
      .replace(/^this\s+is\s+/i, "Identify: ")
      .replace(/^these\s+are\s+/i, "Identify: ")
      .trim() || raw;
  }

  function displayExplanation(q) {
    const ex = cleanText(q?.explanation || "");
    return ex || (q?.answer ? `Correct answer: ${cleanText(q.answer)}.` : "Review this item again before the exam.");
  }

  const sourcePromptRe = /(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map)\b|\bbased\s+on\s+(this|the)\s+(passage|excerpt|source)\b)/i;

  function promptNeedsStimulus(q) { return sourcePromptRe.test(String(q?.prompt || q?.stem || "")); }

  function stimulusImagesFor(q) {
    if (SourceBank) return SourceBank.stimulusImages(q);
    if (!q) return [];
    const list   = Array.isArray(q.stimulusImages) ? q.stimulusImages : [];
    const images = list.length ? list : (q.stimulusImage ? [{ src: q.stimulusImage, label: "Source" }] : []);
    if (!images.length) return [];
    if (q.stimulusRequired === false) return [];
    if (q.stimulusRequired === true || q.stimulusImage) return images.filter(i => i?.src);
    return promptNeedsStimulus(q) ? images.filter(i => i?.src) : [];
  }

  function hasReliableStimulus(q) {
    return Boolean((q?.stimulus || q?.stimulusText || q?.stimulusHtml) || stimulusImagesFor(q).length);
  }

  function isPlayableQuestion(q) {
    if (!q || !q.prompt || !q.answer) return false;
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

  // ─── Image loading ──────────────────────────────────────────────────────────
  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function loadAssets() {
    const assetPaths = {
      background: liteFx
        ? "../../assets/timeline-runner/runner-track-lite.jpg"
        : "../../assets/timeline-runner/runner-track.png",
      sprites: "../../assets/timeline-runner/runner-sprites.png"
    };
    const [bg, sp] = await Promise.all([
      loadImage(assetPaths.background),
      loadImage(assetPaths.sprites)
    ]);
    images.background = bg;
    images.sprites    = sp ? makeTransparentSheet(sp) : null;
    state.assetsReady = true;
  }

  function makeTransparentSheet(img) {
    const cv = document.createElement("canvas");
    cv.width  = img.naturalWidth;
    cv.height = img.naturalHeight;
    const sh   = cv.getContext("2d", { willReadFrequently: true });
    sh.drawImage(img, 0, 0);
    const px = sh.getImageData(0, 0, cv.width, cv.height);
    const d  = px.data;
    for (let i = 0; i < d.length; i += 4) {
      const max = Math.max(d[i], d[i+1], d[i+2]);
      const avg = (d[i] + d[i+1] + d[i+2]) / 3;
      if (max < 42 || (avg < 55 && Math.abs(d[i]-d[i+1]) < 18 && Math.abs(d[i+1]-d[i+2]) < 18))
        d[i+3] = 0;
      else if (max < 74)
        d[i+3] = Math.min(d[i+3], 110);
    }
    sh.putImageData(px, 0, 0);
    return cv;
  }

  // ─── Question bank ─────────────────────────────────────────────────────────
  async function loadBank() {
    els.startBtn.disabled = true;
    els.startBtn.textContent = "Loading...";
    const res = await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
    if (!res.ok) throw new Error(`Question bank failed: ${res.status}`);
    state.bank = await res.json();
    state.bank.questions = (state.bank.questions || []).filter(isPlayableQuestion);
    rebuildSetIndex();
    populateFilters();
    applyFilters();
    els.startBtn.disabled  = false;
    els.startBtn.textContent = "Start Run";
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
      Object.entries(setsByCourse).map(([c, s]) => [c, [...s].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))])
    );
  }

  function populateFilters() {
    els.courseFilter.innerHTML = ["All Courses", ...state.bank.courses]
      .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    populateSets();
  }

  function populateSets() {
    const course = els.courseFilter.value || "All Courses";
    const sets   = course === "All Courses" ? ["All Sets"] : ["All Sets", ...(state.bank.setsByCourse[course] || [])];
    els.setFilter.innerHTML = sets
      .map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  }

  function applyFilters() {
    const course = els.courseFilter.value || "All Courses";
    const set    = els.setFilter.value    || "All Sets";
    state.filtered = state.bank.questions.filter(q => {
      if (course !== "All Courses" && q.course !== course) return false;
      if (set    !== "All Sets"    && q.set    !== set)    return false;
      return true;
    });
    if (!state.filtered.length) state.filtered = [...state.bank.questions];
    renderSetupMetrics();
    prepareQueue();
    prepareQuestion();
  }

  function renderSetupMetrics() {
    const best = state.bestDistance;
    els.setupMetrics.innerHTML = [
      `${formatNumber(state.filtered.length)} review prompts`,
      `${formatNumber(state.filtered.filter(q => q.type === "mcq").length)} MCQs`,
      `Best run: ${best ? formatKm(best) : "—"}`,
      `Coins: ${formatNumber(state.totalCoins)}`
    ].map(t => `<span class="metric-pill">${escapeHtml(t)}</span>`).join("");
  }

  function prepareQueue()    { state.queue = shuffle(state.filtered); }
  function nextQuestion()    {
    if (!state.queue.length) prepareQueue();
    return state.queue.pop() || state.filtered[Math.floor(Math.random() * state.filtered.length)];
  }

  function buildChoices(q) {
    const answer = cleanText(q.answer);
    let choices  = [];
    if (q.type === "mcq" && Array.isArray(q.choices) && q.choices.length) {
      const correctLabel = String(q.correct || "");
      const correct      = q.choices.find(c => String(c.label) === correctLabel)?.text || answer;
      const distractors  = q.choices.map(c => cleanText(c.text)).filter(t => t && normalize(t) !== normalize(correct));
      choices = [{ text: cleanText(correct), correct: true }]
        .concat(shuffle(distractors).slice(0, 2).map(t => ({ text: t, correct: false })));
    } else {
      const pool = shuffle([
        ...state.filtered.filter(i => i.id !== q.id && i.answer && (i.set === q.set || i.course === q.course)).map(i => cleanText(i.answer)),
        ...state.bank.questions.filter(i => i.id !== q.id && i.answer).map(i => cleanText(i.answer))
      ].filter(t => t && normalize(t) !== normalize(answer)));
      const unique = [...new Map(pool.map(t => [normalize(t), t])).values()];
      choices = [{ text: answer, correct: true }].concat(unique.slice(0, 2).map(t => ({ text: t, correct: false })));
    }
    while (choices.length < 3) choices.push({ text: ["Reconstruction", "Industrialization", "Manifest Destiny"][choices.length] || "Review term", correct: false });
    return shuffle(choices.slice(0, 3)).map((c, i) => ({
      ...c, lane: i, color: gateColors[i],
    }));
  }

  function prepareQuestion() {
    if (!state.filtered.length || state.gateActive) return;
    const q = nextQuestion();
    state.currentQuestion = q;
    state.currentChoices  = buildChoices(q);
    if (state.checkpointMode !== "debrief") renderStandby();
  }

  // ─── Question card UI ───────────────────────────────────────────────────────
  function setQuestionMode(mode) {
    state.checkpointMode = mode;
    els.questionCard.classList.toggle("standby",    mode === "standby");
    els.questionCard.classList.toggle("checkpoint", mode === "checkpoint");
    els.questionCard.classList.toggle("debrief",    mode === "debrief");
  }

  function renderStandby() {
    els.questionMeta.textContent   = "Next checkpoint approaching";
    els.questionPrompt.textContent = "";
    els.laneChips.innerHTML        = "";
    els.feedback.textContent       = "";
    els.feedback.className         = "feedback";
    renderStimulus(null);
    setQuestionMode("standby");
  }

  function renderQuestion() {
    const q = state.currentQuestion;
    if (!q) { renderStandby(); return; }
    const val = q.value ? ` | ${q.value}` : "";
    els.questionMeta.textContent   = cleanText(`${q.course || "Social Studies"} | ${q.set || "Review"}${val}`);
    els.questionPrompt.textContent = displayPrompt(q);
    els.laneChips.innerHTML = state.currentChoices.map(c =>
      `<button class="lane-chip" type="button" data-lane="${c.lane}" style="--gate:${c.color}">${laneNames[c.lane].toUpperCase()}: ${escapeHtml(c.text)}</button>`
    ).join("");
    els.laneChips.querySelectorAll(".lane-chip").forEach(btn =>
      btn.addEventListener("click", () => moveToLane(Number(btn.dataset.lane)))
    );
    renderStimulus(q);
    setQuestionMode("checkpoint");
  }

  function renderDebrief(q, wasCorrect, answer, explanation) {
    els.questionMeta.textContent   = wasCorrect ? "Checkpoint cleared" : "Checkpoint review";
    els.questionPrompt.textContent = wasCorrect ? `Correct: ${answer}` : `Correct answer: ${answer}`;
    els.laneChips.innerHTML        = "";
    renderStimulus(null);
    els.feedback.textContent = explanation;
    els.feedback.className   = `feedback ${wasCorrect ? "good" : "bad"}`;
    state.debriefUntil = state.elapsed + (wasCorrect ? 2.5 : 3.5);
    setQuestionMode("debrief");
  }

  function renderStimulus(q) {
    const list = stimulusImagesFor(q);
    if (!list.length) { els.stimulusStrip.classList.remove("show"); els.stimulusStrip.innerHTML = ""; return; }
    els.stimulusStrip.classList.add("show");
    els.stimulusStrip.innerHTML = `<span class="source-pill">Source</span>` +
      list.slice(0, 2).map((item, i) =>
        `<a class="stimulus-thumb" href="${escapeHtml(item.src)}" target="_blank" rel="noopener"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label || `Stimulus ${i+1}`)}"><span>${escapeHtml(item.label || `Stimulus ${i+1}`)}</span></a>`
      ).join("");
  }

  function setFeedback(msg, type = "") {
    els.feedback.textContent = msg;
    els.feedback.className   = `feedback ${type}`.trim();
    state.feedbackUntil = state.elapsed + 4.4;
  }

  function clearFeedbackIfExpired() {
    if (state.feedbackUntil && state.elapsed > state.feedbackUntil) {
      els.feedback.textContent = ""; els.feedback.className = "feedback"; state.feedbackUntil = 0;
    }
    if (state.checkpointMode === "debrief" && state.elapsed > state.debriefUntil) {
      state.debriefUntil = 0; renderStandby();
    }
  }

  // ─── Run lifecycle ─────────────────────────────────────────────────────────
  function resetRun() {
    const profile = intensityProfiles[els.intensityFilter.value] || intensityProfiles.standard;
    Object.assign(state, {
      running: true, paused: false, gameOver: false, elapsed: 0,
      distance: 0, score: 0, correct: 0, answered: 0,
      streak: 0, coinStreak: 0, multiplier: 1,
      health: 3, shields: state.startWithShield ? 1 : 0,
      speedPace: profile.speed,
      gateTimer: Math.max(4.4, profile.gateEvery * 0.62),
      obstacleTimer: 1.1, pickupTimer: 1.8,
      nextGateAt: 200, pauseUsed: false,
      objects: [], particles: [], texts: [], speedLines: [], wrongs: [],
      shake: 0, flash: 0, flashColor: "#75ecff", deathAnim: 0,
      eraIndex: 0, eraTransition: 0, bossWarning: 0, eraKeys: 0,
      gateActive: null, sawFirstGate: false, debriefUntil: 0,
      runCourse: els.courseFilter.value  || "All Courses",
      runSet:    els.setFilter.value     || "All Sets",
      runIntensity: els.intensityFilter.value || "standard"
    });
    Object.assign(player, {
      lane: 1, visualLane: 1, jumpTime: 0, jumpHeld: false,
      jumpBuffer: 0, coyoteTime: 0, airborne: false, doubleJumpUsed: false,
      slideTime: 0, invulnerable: 0,
      magnetTimer: 0, boostTimer: 0, jetpackTimer: 0, laneChangeBlur: 0
    });
    prepareQueue(); prepareQuestion();
    setFeedback("Steer left, center, or right into the correct answer gate.", "");
    renderStandby();
    hideOverlays();
    updateHud();
  }

  function startRun(opts = {}) {
    if (!state.filtered.length) applyFilters();
    if (!opts.silent) audio.startRun();
    resetRun();
  }

  function hideOverlays() {
    els.setupScreen.classList.remove("show");
    els.pauseScreen.classList.remove("show");
    els.endScreen.classList.remove("show");
  }

  function pauseRun() {
    if (!state.running || state.gameOver) return;
    state.paused = true;
    els.pauseScreen.classList.add("show");
  }

  function resumeRun() {
    if (!state.running || state.gameOver) return;
    state.paused = false;
    els.pauseScreen.classList.remove("show");
    state.last = performance.now();
  }

  function togglePause() {
    if (!state.running || state.gameOver) return;
    if (state.paused) resumeRun(); else pauseRun();
  }

  function endRun() {
    if (state.gameOver) return;
    state.gameOver = true; state.running = false;
    state.deathAnim = 1.2;
    audio.stopDrone();
    const km = state.distance;
    if (km > state.bestDistance) state.bestDistance = km;
    persistState();
    setTimeout(() => {
      renderEndScreen();
      els.endScreen.classList.add("show");
    }, 900);
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "timeline-runner", title: "Timeline Runner",
      score: Math.floor(state.score), answered: state.answered, correct: state.correct
    }, { counter: "game-completions", once: false });
  }

  function renderEndScreen() {
    const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
    els.endTitle.textContent = state.health <= 0 ? "Timeline breach contained" : "Run archived";
    els.endGrid.innerHTML = [
      { label: "score",    value: formatNumber(state.score) },
      { label: "distance", value: formatKm(state.distance) },
      { label: "accuracy", value: `${accuracy}%` },
      { label: "correct",  value: `${state.correct}/${state.answered}` },
      { label: "best",     value: formatKm(state.bestDistance) },
      { label: "streak",   value: formatNumber(state.streak) }
    ].map(i => `<div class="end-stat"><strong>${escapeHtml(i.value)}</strong><span>${escapeHtml(i.label)}</span></div>`).join("");
    const targets = state.wrongs.slice(-4).reverse();
    els.studyTargets.innerHTML = !targets.length
      ? `<div class="study-target"><strong>Clean run.</strong>No missed gates this session.</div>`
      : targets.map(i => `<div class="study-target"><strong>${escapeHtml(i.answer)}</strong>${escapeHtml(i.prompt)}<br>${escapeHtml(i.explanation)}</div>`).join("");
    renderShop();
  }

  // ─── Coin Shop ──────────────────────────────────────────────────────────────
  const SHOP_ITEMS = [
    { id: "startShield",     label: "Start with Shield",    cost: 200,  storageKey: `${STORAGE_KEY}:startShield`,     bought: () => state.startWithShield },
    { id: "powerupDuration", label: "+2s Power-up Duration", cost: 350,  storageKey: `${STORAGE_KEY}:powerupDuration`, bought: () => state.powerupDuration > 0 }
  ];

  function renderShop() {
    const shopGrid = document.getElementById("shopGrid");
    if (!shopGrid) return;
    shopGrid.innerHTML = SHOP_ITEMS.map(item => {
      const owned  = item.bought();
      const canBuy = !owned && state.totalCoins >= item.cost;
      return `<button class="end-stat shop-item${owned ? " owned" : ""}" data-shop="${item.id}" ${owned || !canBuy ? "disabled" : ""} style="cursor:${canBuy && !owned ? "pointer" : "default"};border-color:${owned ? "var(--green)" : "rgba(255,255,255,.12)"}">` +
        `<strong>${escapeHtml(owned ? "✓ Owned" : `${item.cost} coins`)}</strong>` +
        `<span>${escapeHtml(item.label)}</span></button>`;
    }).join("");
    shopGrid.querySelectorAll("[data-shop]").forEach(btn => {
      btn.addEventListener("click", () => buyShopItem(btn.dataset.shop));
    });
  }

  function buyShopItem(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item || item.bought() || state.totalCoins < item.cost) return;
    state.totalCoins -= item.cost;
    if (id === "startShield") {
      state.startWithShield = true;
      localStorage.setItem(`${STORAGE_KEY}:startShield`, "true");
    } else if (id === "powerupDuration") {
      state.powerupDuration += 2;
      localStorage.setItem(`${STORAGE_KEY}:powerupDuration`, String(state.powerupDuration));
    }
    persistState();
    renderShop();
    renderEndScreen();
  }

  function showSetup() {
    state.running = false; state.paused = false; state.gameOver = false;
    els.pauseScreen.classList.remove("show");
    els.endScreen.classList.remove("show");
    els.setupScreen.classList.add("show");
    renderSetupMetrics();
  }

  // ─── HUD update ─────────────────────────────────────────────────────────────
  function updateHud() {
    const distKm = (state.distance / 1000).toFixed(2);
    els.score.textContent  = formatNumber(state.score);
    els.streak.textContent = `${state.multiplier.toFixed(1)}×`;
    els.health.textContent = `${state.health}${state.shields ? `+${state.shields}` : ""}`;
    els.speed.textContent  = `${distKm}km`;
  }

  // ─── Player movement ─────────────────────────────────────────────────────────
  function moveLane(delta) { moveToLane(player.lane + delta); }

  function moveToLane(lane) {
    const next = clamp(lane, 0, 2);
    if (next === player.lane) return;
    player.lane            = next;
    player.laneChangeBlur  = 0.18;
    addParticles(lanePoint(player.visualLane, 0.92).x, 748, 10, gateColors[player.lane], 0.8);
    audio.lane();
  }

  function doJump() {
    const onGround = !player.airborne;
    const coyote   = player.coyoteTime > 0;
    if (onGround || coyote) {
      player.jumpTime         = 0.72;
      player.airborne         = true;
      player.coyoteTime       = 0;
      player.doubleJumpUsed   = false;
      audio.jump();
    } else if (!player.doubleJumpUsed) {
      // double jump (mid-air)
      player.jumpTime       = Math.max(player.jumpTime, 0.44);
      player.doubleJumpUsed = true;
      audio.jump();
      addParticles(lanePoint(player.visualLane, 0.94).x, 750, 16, "#75ecff", 1.1);
    }
  }

  function tryJump() {
    // called on keydown / pointer; sets buffer
    player.jumpBuffer = 0.10;
    doJump();
  }

  function slide() {
    player.slideTime = 0.56;
    audio.slide();
  }

  // ─── Damage / powerup ────────────────────────────────────────────────────────
  function damage(reason) {
    if (player.invulnerable > 0) return;
    if (state.shields > 0) {
      state.shields--;
      player.invulnerable = 0.85;
      state.flash = Math.max(state.flash, 0.35);
      state.flashColor = "#75ecff";
      setFeedback(`Shield blocked ${reason}.`, "good");
      audio.shield();
      return;
    }
    state.health--;
    state.streak    = 0;
    state.coinStreak = 0;
    state.multiplier = 1;
    player.invulnerable = 1.1;
    state.shake = Math.max(state.shake, 18);
    state.flash = Math.max(state.flash, 0.5);
    state.flashColor = "#ff7bcc";
    setFeedback(`Hit by ${reason}. Keep running.`, "bad");
    audio.hitThud();
    if (state.health <= 0) endRun();
  }

  function collectPickup(obj) {
    obj.hit = true;
    const pt = lanePoint(obj.lane, obj.progress);
    switch (obj.pickupKind) {
      case "coin":
        state.coinStreak++;
        state.multiplier = Math.min(8, 1 + state.coinStreak * 0.15);
        const coinScore = Math.round(PICKUP_TYPES.coin.score * state.multiplier);
        state.score    += coinScore;
        state.totalCoins++;
        addText(pt.x, pt.y - 20, `+${coinScore}`, "#f5c451");
        addParticles(pt.x, pt.y, 14, "#f5c451", 1.0);
        audio.coin();
        break;
      case "magnet":
        player.magnetTimer = PICKUP_TYPES.magnet.duration + state.powerupDuration;
        setFeedback("Magnet active — coins pulled to you!", "good");
        audio.powerupArpeggio("magnet");
        addText(pt.x, pt.y - 20, "magnet", "#ff7bcc");
        addParticles(pt.x, pt.y, 22, "#ff7bcc", 1.2);
        break;
      case "shield":
        state.shields = Math.min(3, state.shields + 1);
        setFeedback("Shield gained. Absorbs next hit.", "good");
        audio.shield();
        addText(pt.x, pt.y - 20, "+shield", "#75ecff");
        addParticles(pt.x, pt.y, 18, "#75ecff", 1.0);
        break;
      case "boost":
        player.boostTimer = PICKUP_TYPES.boost.duration + state.powerupDuration;
        state.score += 100;
        setFeedback("Speed Boost! 2× pace for 5 sec.", "good");
        audio.powerupArpeggio("boost");
        addText(pt.x, pt.y - 20, "boost!", "#f5c451");
        addParticles(pt.x, pt.y, 24, "#f5c451", 1.3);
        spawnSpeedLines();
        break;
      case "jetpack":
        player.jetpackTimer = PICKUP_TYPES.jetpack.duration + state.powerupDuration;
        player.airborne = true;
        setFeedback("Jet Pack! Auto-fly for 8 sec.", "good");
        audio.powerupArpeggio("jetpack");
        addText(pt.x, pt.y - 20, "jetpack!", "#67f0a8");
        addParticles(pt.x, pt.y, 28, "#67f0a8", 1.4);
        break;
      case "erakey":
        state.eraKeys++;
        state.score += 500;
        addText(pt.x, pt.y - 20, "era key!", "#f5a623");
        addParticles(pt.x, pt.y, 30, "#f5a623", 1.5);
        setFeedback(`Era Key collected! ${state.eraKeys}/5 — collect all to win!`, "good");
        if (state.eraKeys >= 5) endRun();
        break;
    }
  }

  // ─── Spawning ────────────────────────────────────────────────────────────────
  function spawnObstacle() {
    const diff  = 1 + Math.min(0.6, state.distance / 10000);
    const roll  = Math.random();
    let   tpl;
    if (roll < 0.20)      tpl = OBSTACLE_TYPES[1]; // pipe → slide
    else if (roll < 0.40) tpl = OBSTACLE_TYPES[0]; // block → jump
    else if (roll < 0.52) tpl = OBSTACLE_TYPES[2]; // fence → dodge
    else if (roll < 0.64) tpl = OBSTACLE_TYPES[3]; // moving cart
    else if (roll < 0.76) tpl = OBSTACLE_TYPES[4]; // gap
    else if (roll < 0.80 && diff > 1.25) tpl = OBSTACLE_TYPES[5]; // boss
    else                  tpl = OBSTACLE_TYPES[0];

    const isBoss = tpl.id === "boss";
    state.objects.push({
      kind: "obstacle",
      lane: Math.floor(Math.random() * 3),
      progress: 0,
      obstacleId: tpl.id,
      mode: tpl.mode,
      label: tpl.label,
      color: tpl.color,
      isBoss,
      windupLeft: isBoss ? tpl.windup : 0,
      windupDone: false,
      moving: tpl.moving || false,
      movDir: Math.random() > 0.5 ? 1 : -1,
      hit: false
    });
    if (isBoss) {
      state.bossWarning = tpl.windup;
      setFeedback("⚠ BOSS incoming — prepare to dodge!", "bad");
    }
  }

  function spawnPickup() {
    // Coin lines: 80% coins, sprinkled with power-ups
    const roll = Math.random();
    let kind;
    if (roll < 0.60) kind = "coin";
    else if (roll < 0.70) kind = "magnet";
    else if (roll < 0.78) kind = "shield";
    else if (roll < 0.86) kind = "boost";
    else if (roll < 0.92) kind = "jetpack";
    else kind = "erakey";

    // Spawn a short line of coins for coin type
    const lane = Math.floor(Math.random() * 3);
    if (kind === "coin") {
      const count = 3 + Math.floor(Math.random() * 3);
      const gap   = 0.06;
      for (let i = 0; i < count; i++) {
        state.objects.push({
          kind: "pickup", pickupKind: "coin", lane,
          progress: -(i * gap), color: PICKUP_TYPES.coin.color, hit: false
        });
      }
    } else {
      state.objects.push({
        kind: "pickup", pickupKind: kind, lane,
        progress: 0, color: PICKUP_TYPES[kind]?.color || "#67f0a8", hit: false
      });
    }
  }

  function spawnGate() {
    if (state.gateActive || !state.currentQuestion) return;
    const id = state.nextGateId++;
    state.gateActive = id;
    state.sawFirstGate = true;
    state.objects = state.objects.filter(o => o.kind !== "obstacle" || o.progress > 0.95);
    state.currentChoices.forEach(c => {
      state.objects.push({
        kind: "gate", gateId: id, lane: c.lane,
        progress: 0, choice: c, color: c.color, hit: false
      });
    });
    renderQuestion();
    setFeedback("Choose your lane before the gates reach you.", "");
  }

  function resolveGate(choice) {
    if (!state.gateActive || !state.currentQuestion) return;
    const q   = state.currentQuestion;
    state.answered++;
    const pt  = lanePoint(player.lane, 0.92);
    const explanation = displayExplanation(q);
    const answer      = cleanText(q.answer);

    if (choice.correct) {
      state.correct++;
      state.streak++;
      state.multiplier = Math.min(8, state.multiplier + 0.5);
      const bonus = 650 + state.streak * 75;
      state.score += bonus;
      player.boostTimer = Math.max(player.boostTimer, 1.2);
      state.flash = Math.max(state.flash, 0.34);
      state.flashColor = "#67f0a8";
      renderDebrief(q, true, answer, explanation);
      addText(pt.x, pt.y - 80, `+${bonus}`, "#67f0a8");
      addParticles(pt.x, pt.y - 80, 36, "#67f0a8", 1.3);
      audio.correct();
    } else {
      state.wrongs.push({ prompt: displayPrompt(q), answer, explanation });
      state.streak = 0;
      state.coinStreak = 0;
      state.multiplier = Math.max(1, state.multiplier - 1);
      addText(pt.x, pt.y - 80, "review", "#ff9aa8");
      addParticles(pt.x, pt.y - 80, 28, "#ff7bcc", 1.1);
      audio.wrong();
      if (state.shields > 0) {
        state.shields--;
        player.invulnerable = 0.85;
        renderDebrief(q, false, answer, `${explanation} Shield absorbed the damage.`);
      } else {
        state.health--;
        player.invulnerable = 1.1;
        state.shake = Math.max(state.shake, 16);
        state.flash = Math.max(state.flash, 0.45);
        state.flashColor = "#ff7bcc";
        renderDebrief(q, false, answer, explanation);
        if (state.health <= 0) endRun();
      }
    }

    state.objects   = state.objects.filter(o => o.gateId !== state.gateActive);
    state.gateActive = null;
    state.currentQuestion = null;
    state.currentChoices  = [];
    const profile  = intensityProfiles[state.runIntensity] || intensityProfiles.standard;
    state.gateTimer = Math.max(4.2, profile.gateEvery * 0.70);
    state.nextGateAt = state.distance + 200;
    prepareQuestion();
    updateHud();
  }

  // ─── Speed lines (boost juice) ────────────────────────────────────────────
  function spawnSpeedLines() {
    if (reduceMotion) return;
    for (let i = 0; i < 16; i++) {
      const side = Math.random() > 0.5 ? -1 : 1;
      state.speedLines.push({
        x: BASE_W * 0.5 + side * (400 + Math.random() * 360),
        y: 200 + Math.random() * 500,
        len: 60 + Math.random() * 140,
        vx: -side * (800 + Math.random() * 400),
        life: 0.18 + Math.random() * 0.22,
        maxLife: 0.4,
        color: Math.random() > 0.5 ? "#f5c451" : "#75ecff"
      });
    }
  }

  // ─── Era management ──────────────────────────────────────────────────────────
  function updateEra() {
    const km        = state.distance / 1000;
    let   newIndex  = 0;
    for (let i = ERAS.length - 1; i >= 0; i--) {
      if (km >= ERAS[i].startKm) { newIndex = i; break; }
    }
    if (newIndex !== state.eraIndex) {
      audio.eraStinger(newIndex);
      setFeedback(`Era transition: ${ERAS[newIndex].name}`, "good");
      state.eraTransition = 0;
      state.eraIndex      = newIndex;
    }
    state.eraTransition = Math.min(1, state.eraTransition + 0.016);
  }

  // ─── Magnet effect ───────────────────────────────────────────────────────────
  function applyMagnet() {
    if (player.magnetTimer <= 0) return;
    for (const obj of state.objects) {
      if (obj.kind !== "pickup" || obj.hit || obj.pickupKind !== "coin") continue;
      const target = lanePoint(player.lane, 0.92);
      const current = lanePoint(obj.lane, obj.progress);
      // Pull coin towards player lane
      if (obj.lane !== player.lane && current.y > target.y - 80 && current.y < target.y + 80) {
        obj.lane = player.lane;
      }
    }
  }

  // ─── Main update ─────────────────────────────────────────────────────────────
  function update(dt) {
    if (!state.running || state.paused || state.gameOver) return;
    const profile    = intensityProfiles[state.runIntensity] || intensityProfiles.standard;
    state.elapsed   += dt;
    clearFeedbackIfExpired();
    updateEra();

    // Difficulty + speed
    const difficulty   = 1 + Math.min(0.55, state.distance / 12000);
    const boostMult    = player.boostTimer > 0 ? 2.0 : 1.0;
    const jetpackMult  = player.jetpackTimer > 0 ? 0.85 : 1.0;
    state.speedPace    = profile.speed * difficulty * boostMult * jetpackMult;
    const progSpeed    = (0.148 + difficulty * 0.032) * profile.speed * boostMult;

    // Distance and score
    state.distance += dt * (42 + 118 * state.speedPace);
    state.score    += dt * (9 + state.streak * 0.9) * state.speedPace;

    // Power-up timers
    player.boostTimer   = Math.max(0, player.boostTimer   - dt);
    player.magnetTimer  = Math.max(0, player.magnetTimer  - dt);
    player.jetpackTimer = Math.max(0, player.jetpackTimer - dt);

    // Hit / FX decay
    state.shake = Math.max(0, state.shake - dt * 34);
    state.flash = Math.max(0, state.flash - dt * 1.7);
    state.bossWarning = Math.max(0, state.bossWarning - dt);
    player.invulnerable   = Math.max(0, player.invulnerable - dt);
    player.laneChangeBlur = Math.max(0, player.laneChangeBlur - dt * 4);

    // Jump physics (variable height: hold longer = higher)
    if (player.jumpHeld && player.jumpTime > 0 && player.airborne) {
      player.jumpTime = Math.max(0, player.jumpTime - dt * 0.85); // held jump decays slower
    } else {
      player.jumpTime = Math.max(0, player.jumpTime - dt);
    }
    // Jump buffer
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    // Coyote time
    if (!player.airborne) {
      player.coyoteTime = 0.08; // reset when on ground
    } else {
      player.coyoteTime = Math.max(0, player.coyoteTime - dt);
    }
    // Land detection
    if (player.airborne && player.jumpTime <= 0 && player.jetpackTimer <= 0) {
      // land after jump apex
      player.airborne = false;
      player.doubleJumpUsed = false;
    }
    // Jetpack: keep player airborne automatically
    if (player.jetpackTimer > 0) player.airborne = true;

    // Lane interpolation (smooth, not instant)
    player.visualLane += (player.lane - player.visualLane) * Math.min(1, dt * 11);

    // Magnet
    applyMagnet();

    // Spawn speed lines during boost
    if (player.boostTimer > 0 && !reduceMotion && Math.random() < dt * 12) spawnSpeedLines();

    // Gate timer (distance-based)
    if (!state.gateActive && state.distance >= state.nextGateAt) {
      spawnGate();
      const interval = Math.max(150, (profile.gateEvery / Math.min(1.32, difficulty)) * (42 + 118 * state.speedPace));
      state.nextGateAt = state.distance + interval;
    }

    // Obstacle spawn
    state.obstacleTimer -= dt;
    if (!state.gateActive && state.obstacleTimer <= 0) {
      spawnObstacle();
      state.obstacleTimer = (profile.obstacleEvery + Math.random() * 0.55) / Math.min(1.28, difficulty);
    }

    // Pickup spawn
    state.pickupTimer -= dt;
    if (state.pickupTimer <= 0) {
      spawnPickup();
      state.pickupTimer = profile.pickupEvery + Math.random() * 1.3;
    }

    // Move and collide objects
    for (const obj of state.objects) {
      // Moving cart: change lanes
      if (obj.moving && !obj.hit) {
        obj.progress += dt * progSpeed;
        if (Math.random() < dt * 0.8) {
          obj.lane = clamp(obj.lane + obj.movDir, 0, 2);
          if (obj.lane === 0 || obj.lane === 2) obj.movDir = -obj.movDir;
        }
      } else {
        obj.progress += dt * progSpeed * (obj.kind === "gate" ? 0.86 : 1);
      }
      // Boss windup
      if (obj.isBoss && !obj.windupDone) {
        obj.windupLeft -= dt;
        if (obj.windupLeft <= 0) { obj.windupDone = true; obj.lane = player.lane; }
        continue; // don't collide until done
      }

      if (obj.progress > 0.90 && !obj.hit) {
        if (obj.kind === "gate" && obj.lane === player.lane) {
          obj.hit = true; resolveGate(obj.choice); break;
        }
        if (obj.kind === "pickup" && obj.lane === player.lane && !obj.hit) {
          collectPickup(obj);
        }
        if (obj.kind === "obstacle" && obj.lane === player.lane) {
          const lift    = jumpLift();
          const jumped  = obj.mode === "jump"  && lift > 0.35;
          const slid    = obj.mode === "slide" && player.slideTime > 0;
          const dodged  = obj.mode === "dodge" && obj.lane !== player.lane;
          if (!jumped && !slid && !dodged) {
            obj.hit = true;
            damage(obj.label === "JUMP"  ? "timeline debris" :
                   obj.label === "SLIDE" ? "archive barrier"  : "corrupted source");
          } else if (!obj.hit) {
            obj.hit = true;
            state.score += 80;
            const p2 = lanePoint(obj.lane, obj.progress);
            addText(p2.x, p2.y - 30, "+dodge", "#75ecff");
          }
        }
      }
    }
    state.objects = state.objects.filter(o => o.progress < 1.15 && !o.hit);

    // Particles
    for (const p of state.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 42 * dt; }
    state.particles = state.particles.filter(p => p.life > 0);

    // Float texts
    for (const t of state.texts) { t.life -= dt; t.y -= dt * 42; }
    state.texts = state.texts.filter(t => t.life > 0);

    // Speed lines
    for (const l of state.speedLines) { l.life -= dt; l.x += l.vx * dt; }
    state.speedLines = state.speedLines.filter(l => l.life > 0);

    // Run length limit (non-endless)
    if (state.answered >= 30 && state.runIntensity !== "endless") endRun();

    // Footstep audio
    audio.footstep(state.elapsed, dt);

    emitRunSparks(dt);
    updateHud();
  }

  // ─── Jump helpers ────────────────────────────────────────────────────────────
  function jumpLift() {
    if (player.jumpTime <= 0 && player.jetpackTimer <= 0) return 0;
    if (player.jetpackTimer > 0) return 0.9; // jetpack full lift
    const t = 1 - player.jumpTime / 0.72;
    return Math.sin(Math.PI * clamp(t, 0, 1));
  }

  // ─── Lane-to-canvas geometry ─────────────────────────────────────────────────
  function lanePoint(lane, progress) {
    const p         = easeOut(progress);
    const horizonY  = 286;
    const bottomY   = 794;
    const center    = BASE_W / 2;
    const laneSpread = lerp(74, 360, p);
    const laneOffset = (lane - 1) * laneSpread;
    const curve      = Math.sin(state.distance * 0.0009 + p * Math.PI * 1.1) * lerp(4, 18, p);
    return {
      x:     center + laneOffset + curve,
      y:     lerp(horizonY, bottomY, p),
      scale: lerp(0.20, 1.26, Math.pow(p, 1.15))
    };
  }

  // ─── Particle emitters ────────────────────────────────────────────────────────
  function emitRunSparks(dt) {
    const limit = liteFx ? 70 : 180;
    if (reduceMotion || state.particles.length > limit) return;
    const density = player.boostTimer > 0 ? 5 : 2;
    const count   = Math.max(1, Math.floor(density * state.speedPace));
    for (let i = 0; i < count; i++) {
      if (Math.random() > dt * 22) continue;
      const lane = Math.floor(Math.random() * 3);
      const p    = 0.68 + Math.random() * 0.25;
      const pt   = lanePoint(lane, p);
      state.particles.push({
        x: pt.x + (Math.random() - 0.5) * 46 * pt.scale,
        y: pt.y + 26 * pt.scale,
        vx: (Math.random() - 0.5) * 72, vy: 160 + Math.random() * 210,
        radius: (1.5 + Math.random() * 4.2) * pt.scale,
        color: gateColors[lane],
        life: 0.18 + Math.random() * 0.34, maxLife: 0.52
      });
    }
  }

  function addParticles(x, y, count, color, power = 1) {
    if (reduceMotion) return;
    const actual = liteFx ? Math.min(12, Math.ceil(count * 0.45)) : count;
    for (let i = 0; i < actual; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (45 + Math.random() * 160) * power;
      state.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 28,
        radius: 2 + Math.random() * 4, color,
        life: 0.35 + Math.random() * 0.65, maxLife: 0.8
      });
    }
  }

  function addText(x, y, text, color) {
    state.texts.push({ x, y, text, color, life: 1, maxLife: 1 });
  }

  // ─── Canvas resize ────────────────────────────────────────────────────────────
  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr  = Math.max(1, Math.min(liteFx ? 1 : 2, window.devicePixelRatio || 1));
    const w    = Math.max(1, Math.floor(rect.width  * dpr));
    const h    = Math.max(1, Math.floor(rect.height * dpr));
    if (els.canvas.width !== w || els.canvas.height !== h) { els.canvas.width = w; els.canvas.height = h; }
  }

  function beginCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr  = Math.max(1, Math.min(liteFx ? 1 : 2, window.devicePixelRatio || 1));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#050711";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (images.background) {
      ctx.save();
      const era = ERAS[state.eraIndex];
      if (!liteFx) {
        ctx.filter = `blur(10px) saturate(1.18) brightness(.68) ${era.filter}`;
        drawRawImageCover(images.background, -20, -20, rect.width + 40, rect.height + 40);
        ctx.filter = "none";
      } else {
        drawRawImageCover(images.background, 0, 0, rect.width, rect.height);
      }
      ctx.fillStyle = "rgba(5,7,17,.50)";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.restore();
    }

    const scale = Math.min(rect.width / BASE_W, rect.height / BASE_H);
    const ox    = (rect.width  - BASE_W * scale) / 2;
    const oy    = (rect.height - BASE_H * scale) / 2;
    state.stage  = { scale, ox, oy, width: BASE_W * scale, height: BASE_H * scale };
    if (state.shake > 0) {
      const s = state.shake;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
  }

  // ─── Draw pipeline ────────────────────────────────────────────────────────────
  function draw() {
    resizeCanvas();
    beginCanvas();
    drawBackground();
    drawRoad();
    drawSpeedTunnel();
    drawSpeedLines();
    drawWorldObjects();
    drawPlayer();
    drawParticles();
    drawRunText();
    drawPowerupRings();
    drawBossWarning();
    drawEraLabel();
    drawMultiplierBadge();
    drawOverlayEffects();
    audio.music(state.elapsed);
    audio.updateDrone();
  }

  // ─── Background + parallax ───────────────────────────────────────────────────
  function drawBackground() {
    const era = ERAS[state.eraIndex];
    if (images.background) {
      drawImageCover(images.background, 0, 0, BASE_W, BASE_H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, BASE_H);
      g.addColorStop(0, era.sky);
      g.addColorStop(0.55, "#0a1021");
      g.addColorStop(1, "#050711");
      ctx.fillStyle = g; ctx.fillRect(0, 0, BASE_W, BASE_H);
    }
    ctx.fillStyle = "rgba(4,7,15,.22)"; ctx.fillRect(0, 0, BASE_W, BASE_H);

    // Ambient glow (era-tinted)
    const pulse = 0.5 + Math.sin(state.elapsed * 1.6) * 0.5;
    const glow  = ctx.createRadialGradient(800, 330, 40, 800, 330, 520);
    glow.addColorStop(0, hexToRgba(era.accent, 0.18 + pulse * 0.06));
    glow.addColorStop(0.44, hexToRgba(era.accent, 0.06));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, BASE_W, BASE_H);

    // Star-field / data-streaks (parallax)
    if (!reduceMotion) {
      ctx.save(); ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 34; i++) {
        const y     = ((i * 77 + state.distance * 0.18) % 820) + 40;
        const x     = 200 + ((i * 193) % 1200);
        const alpha = 0.05 + (i % 4) * 0.018;
        ctx.strokeStyle = hexToRgba(era.accent, alpha);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 + (i % 5) * 11, y - 10); ctx.stroke();
      }
      ctx.restore();
    }
    drawFloatingPanels();
  }

  function drawFloatingPanels() {
    if (reduceMotion) return;
    ctx.save(); ctx.globalCompositeOperation = "screen";
    const era = ERAS[state.eraIndex];
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? -1 : 1;
      const p    = (state.elapsed * 0.055 + state.distance * 0.000035 + i * 0.097) % 1;
      const drift = Math.sin(state.elapsed * 0.8 + i * 1.7) * 34;
      const x = 800 + side * lerp(250, 690, p) + drift;
      const y = lerp(170, 740, Math.pow(p, 1.18));
      const w = lerp(54, 170, p);
      const h = w * 0.64;
      const alpha = lerp(0.05, 0.22, p);
      ctx.save(); ctx.translate(x, y); ctx.rotate(side * (0.12 + Math.sin(state.elapsed + i) * 0.05));
      ctx.fillStyle   = hexToRgba(era.accent, alpha * 0.30);
      ctx.strokeStyle = hexToRgba(era.accent, alpha);
      ctx.lineWidth   = 1.4;
      roundRect(-w/2, -h/2, w, h, 8); ctx.fill();
      roundRect(-w/2, -h/2, w, h, 8); ctx.stroke();
      ctx.globalAlpha = alpha * 1.8;
      for (let line = 0; line < 4; line++) {
        ctx.beginPath();
        ctx.moveTo(-w * 0.33, -h * 0.20 + line * h * 0.13);
        ctx.lineTo( w * (0.14 + line * 0.06), -h * 0.20 + line * h * 0.13);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ─── Speed lines ──────────────────────────────────────────────────────────────
  function drawSpeedLines() {
    if (reduceMotion || !state.speedLines.length) return;
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (const l of state.speedLines) {
      const alpha = clamp(l.life / l.maxLife, 0, 1);
      ctx.strokeStyle = hexToRgba(l.color, alpha * 0.85);
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x + l.len, l.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ─── Speed tunnel / lane lines ─────────────────────────────────────────────
  function drawSpeedTunnel() {
    if (reduceMotion) return;
    const era = ERAS[state.eraIndex];
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (let lane = 0; lane < 3; lane++) {
      for (let i = 0; i < 8; i++) {
        const p     = (state.distance * 0.00125 + i / 8 + lane * 0.13) % 1;
        const start = lanePoint(lane, clamp(p, 0.04, 0.98));
        const end   = lanePoint(lane, clamp(p + 0.055, 0.05, 0.99));
        const alpha = lerp(0.04, 0.46, p) * (player.boostTimer > 0 ? 1.65 : 1);
        ctx.strokeStyle = hexToRgba(gateColors[lane], alpha);
        ctx.lineWidth   = lerp(2, 9, p);
        ctx.shadowColor = gateColors[lane]; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
      }
    }
    // cross-lines
    for (let i = 0; i < 14; i++) {
      const p     = (state.elapsed * 0.35 + state.distance * 0.0009 + i * 0.071) % 1;
      const left  = lanePoint(0, p);
      const right = lanePoint(2, p);
      ctx.strokeStyle = `rgba(255,255,255,${lerp(0.02, 0.16, p)})`;
      ctx.lineWidth   = lerp(1, 3, p);
      ctx.beginPath(); ctx.moveTo(left.x - 78 * p, left.y); ctx.lineTo(right.x + 78 * p, right.y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawRoad() {
    const bottom  = BASE_H + 28;
    const horizon = 300;
    ctx.save(); ctx.globalCompositeOperation = "source-over";
    const road = ctx.createLinearGradient(800, horizon, 800, bottom);
    road.addColorStop(0, "rgba(7,20,38,.24)");
    road.addColorStop(0.68, "rgba(4,8,17,.46)");
    road.addColorStop(1, "rgba(0,0,0,.68)");
    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(690, horizon); ctx.lineTo(910, horizon); ctx.lineTo(1425, bottom); ctx.lineTo(175, bottom);
    ctx.closePath(); ctx.fill();
    // Lane dividers
    for (let l = 0; l < 4; l++) {
      const f      = l / 3;
      const topX   = lerp(690, 910, f);
      const botX   = lerp(175, 1425, f);
      const isEdge = l === 0 || l === 3;
      const color  = isEdge ? "245,196,81" : "117,236,255";
      ctx.strokeStyle = `rgba(${color},${isEdge ? 0.50 : 0.38})`;
      ctx.lineWidth   = isEdge ? 3 : 2;
      ctx.shadowColor = `rgba(${color},.40)`; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(topX, horizon); ctx.lineTo(botX, bottom); ctx.stroke();
    }
    // Dashes
    ctx.shadowBlur = 0; ctx.lineWidth = 1;
    for (let i = 0; i < 22; i++) {
      const p = ((i / 22) + state.distance * 0.00075) % 1;
      const y = lerp(horizon, bottom, Math.pow(p, 1.7));
      const w = lerp(120, 1050, Math.pow(p, 1.2));
      ctx.strokeStyle = `rgba(255,255,255,${lerp(0.08, 0.32, p)})`;
      ctx.beginPath(); ctx.moveTo(800 - w/2, y); ctx.lineTo(800 + w/2, y); ctx.stroke();
    }
    ctx.restore();
  }

  // ─── World objects ────────────────────────────────────────────────────────────
  function drawWorldObjects() {
    const sorted = [...state.objects].sort((a, b) => a.progress - b.progress);
    for (const obj of sorted) {
      if (obj.kind === "gate")    drawGate(obj);
      else if (obj.kind === "pickup") drawPickup(obj);
      else drawObstacle(obj);
    }
  }

  function drawGate(obj) {
    const pt    = lanePoint(obj.lane, obj.progress);
    const size  = 160 * pt.scale;
    const alpha = clamp(obj.progress * 2.4, 0.15, 1);
    const pulse = 1 + Math.sin(state.elapsed * 6.5 + obj.lane * 1.7) * 0.07;
    ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = obj.color; ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.shadowColor = obj.color; ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y - size * 0.35, size * 0.52 * pulse, size * 0.72 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.38;
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y - size * 0.96);
    ctx.lineTo(pt.x - size * 0.52, pt.y + size * 0.18);
    ctx.lineTo(pt.x + size * 0.52, pt.y + size * 0.18);
    ctx.closePath(); ctx.fillStyle = obj.color; ctx.fill();
    ctx.globalAlpha = alpha;
    drawGateLabel(obj, pt.x, pt.y - size * 0.95, size);
    ctx.restore();
  }

  function drawGateLabel(obj, x, y, size) {
    const text  = cleanText(obj.choice.text);
    const width = clamp(size * (text.length > 34 ? 2.25 : 1.95), 144, 420);
    const height = clamp(size * (text.length > 34 ? 0.74 : 0.60), 58, 118);
    x = clamp(x, width / 2 + 24, BASE_W - width / 2 - 24);
    ctx.save(); ctx.globalCompositeOperation = "source-over";
    ctx.translate(x - width / 2, y - height / 2);
    const grd = ctx.createLinearGradient(0, 0, width, height);
    grd.addColorStop(0, "rgba(6,10,21,.92)"); grd.addColorStop(1, "rgba(20,26,42,.80)");
    ctx.fillStyle = grd; roundRect(0, 0, width, height, 18); ctx.fill();
    ctx.strokeStyle = obj.color; ctx.lineWidth = 2;
    ctx.shadowColor = obj.color; ctx.shadowBlur = 16;
    roundRect(0, 0, width, height, 18); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#f7f4ec";
    const fontSize = clamp(size * 0.12 - Math.max(0, text.length - 32) * 0.035, 10.5, 18);
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    wrapCanvasText(text, width / 2, height / 2, width - 22, fontSize * 1.18, 3);
    ctx.restore();
  }

  function drawPickup(obj) {
    const pt   = lanePoint(obj.lane, obj.progress);
    if (pt.y < 0 || pt.y > BASE_H + 50) return; // off-screen
    const bob  = Math.sin(state.elapsed * 5 + obj.lane) * 8;
    const size = (obj.pickupKind === "coin" ? 32 : 64) * pt.scale;
    ctx.save(); ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = obj.color; ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.92;

    // Draw shape by type (pure canvas — no sprite needed)
    if (obj.pickupKind === "coin") {
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - 18 * pt.scale + bob * 0.5, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff8"; ctx.lineWidth = size * 0.15;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - 18 * pt.scale + bob * 0.5, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // power-up icon: star shape
      const cx = pt.x;
      const cy = pt.y - 42 * pt.scale + bob;
      const r1 = size;
      const r2 = size * 0.45;
      const n  = obj.pickupKind === "jetpack" ? 6 : obj.pickupKind === "magnet" ? 4 : 5;
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const r   = i % 2 === 0 ? r1 : r2;
        const ang = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
        else ctx.lineTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
      }
      ctx.closePath(); ctx.fill();
      // Era key: special ring
      if (obj.pickupKind === "erakey") {
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 * pt.scale;
        ctx.beginPath(); ctx.arc(cx, cy, r1 * 1.4, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawObstacle(obj) {
    const pt    = lanePoint(obj.lane, obj.progress);
    if (obj.progress < 0) return;
    const era   = ERAS[state.eraIndex];

    // Boss: pulsing windup ring
    if (obj.isBoss && !obj.windupDone) {
      const pct   = 1 - obj.windupLeft / 3.0;
      const rad   = 80 + pct * 80;
      ctx.save(); ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 4;
      ctx.shadowColor = "#ff4444"; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(pt.x, pt.y - 80 * pt.scale, rad * pt.scale, 0, Math.PI * 2 * pct);
      ctx.stroke(); ctx.restore();
      // Warning label
      ctx.save();
      ctx.fillStyle = "#ff4444";
      ctx.font = `900 ${Math.max(12, 18 * pt.scale)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⚠ BOSS", pt.x, pt.y - 140 * pt.scale);
      ctx.restore();
      return;
    }

    // Regular obstacle box
    const tw = (obj.obstacleId === "pipe" ? 120 : obj.obstacleId === "boss" ? 160 : 80) * pt.scale;
    const th = (obj.obstacleId === "pipe" ? 36  : obj.obstacleId === "boss" ? 160 : 72) * pt.scale;
    const tx = pt.x - tw / 2;
    const ty = pt.y - th - 10 * pt.scale;

    ctx.save(); ctx.globalCompositeOperation = "screen";
    ctx.fillStyle   = hexToRgba(obj.color, 0.18);
    ctx.strokeStyle = obj.color;
    ctx.lineWidth   = Math.max(1.5, 2.5 * pt.scale);
    ctx.shadowColor = obj.color; ctx.shadowBlur = 18;
    roundRect(tx, ty, tw, th, 10 * pt.scale); ctx.fill();
    roundRect(tx, ty, tw, th, 10 * pt.scale); ctx.stroke();

    // Label chip
    if (obj.progress > 0.36) {
      ctx.globalCompositeOperation = "source-over"; ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(5,7,17,.80)"; ctx.strokeStyle = obj.color; ctx.lineWidth = 1.5;
      const lw = 72 * pt.scale; const lh = 26 * pt.scale;
      roundRect(pt.x - lw/2, ty - lh - 4 * pt.scale, lw, lh, 8 * pt.scale); ctx.fill();
      roundRect(pt.x - lw/2, ty - lh - 4 * pt.scale, lw, lh, 8 * pt.scale); ctx.stroke();
      ctx.fillStyle = "#f7f4ec";
      ctx.font = `900 ${Math.max(9, 11 * pt.scale)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(obj.label, pt.x, ty - lh / 2 - 4 * pt.scale + lh / 2);
    }
    ctx.restore();
  }

  // ─── Player ────────────────────────────────────────────────────────────────
  function drawPlayer() {
    const pt      = lanePoint(player.visualLane, 0.94);
    const lift    = jumpLift() * 145;
    const sliding = player.slideTime > 0;
    const x       = pt.x;
    const runBob  = Math.sin(state.elapsed * 15.5) * (sliding ? 2 : 7);
    const y       = 770 - lift + (sliding ? 24 : 0) + runBob;
    const size    = sliding ? 126 : 154;
    const tilt    = (player.lane - player.visualLane) * 0.18 + Math.sin(state.elapsed * 12) * 0.025;
    const alpha   = player.invulnerable > 0 ? 0.62 + Math.sin(state.elapsed * 28) * 0.22 : 1.0;

    ctx.save(); ctx.globalAlpha = alpha;

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.beginPath();
    ctx.ellipse(x, 806, sliding ? 72 : 58, sliding ? 13 : 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jetpack flame
    if (player.jetpackTimer > 0) {
      ctx.save(); ctx.globalCompositeOperation = "screen";
      ctx.shadowColor = "#67f0a8"; ctx.shadowBlur = 30;
      const flame = ctx.createLinearGradient(x, y + size * 0.5, x, y + size * 0.5 + 80);
      flame.addColorStop(0, "rgba(103,240,168,.95)");
      flame.addColorStop(0.5, "rgba(245,196,81,.7)");
      flame.addColorStop(1, "rgba(255,123,204,0)");
      ctx.fillStyle = flame;
      ctx.beginPath();
      const fw = 24 + Math.sin(state.elapsed * 22) * 8;
      ctx.ellipse(x - 18, y + size * 0.5 + 20, fw * 0.5, 45 + Math.sin(state.elapsed * 18) * 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 18, y + size * 0.5 + 20, fw * 0.5, 45 + Math.sin(state.elapsed * 20) * 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Boost flame trail
    if (player.boostTimer > 0) {
      ctx.save(); ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = "rgba(245,196,81,.70)"; ctx.lineWidth = 9;
      ctx.shadowColor = "#f5c451"; ctx.shadowBlur = 28;
      ctx.beginPath(); ctx.moveTo(x - 82, y + 30); ctx.lineTo(x - 165, y + 72); ctx.stroke();
      ctx.strokeStyle = "rgba(117,236,255,.62)"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x - 62, y + 8); ctx.lineTo(x - 135, y + 38); ctx.stroke();
      ctx.restore();
    }

    // Motion blur on lane change
    if (player.laneChangeBlur > 0.02 && !reduceMotion) {
      ctx.save(); ctx.globalCompositeOperation = "screen";
      const blurAlpha = player.laneChangeBlur * 0.35;
      ctx.globalAlpha = blurAlpha;
      for (let i = 1; i <= 3; i++) {
        const bx = x - (player.lane - player.visualLane > 0 ? -1 : 1) * i * 22;
        drawPlayerShape(bx, y, size, tilt, sliding, false);
      }
      ctx.restore();
    }

    // Main player
    ctx.globalCompositeOperation = "screen";
    drawPlayerShape(x, y, size, tilt, sliding, true);

    // Shield aura
    if (state.shields > 0) {
      ctx.strokeStyle = "rgba(117,236,255,.78)"; ctx.lineWidth = 4;
      ctx.shadowColor = "#75ecff"; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.ellipse(x, y + 6, 70, 92, 0, 0, Math.PI * 2); ctx.stroke();
    }

    // Magnet aura
    if (player.magnetTimer > 0) {
      const mag = 0.5 + Math.sin(state.elapsed * 8) * 0.4;
      ctx.strokeStyle = `rgba(255,123,204,${mag * 0.6})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y + 6, 90, 115, 0, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.restore();
  }

  function drawPlayerShape(x, y, size, tilt, sliding, shadow) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    if (shadow) {
      for (let i = 3; i > 0; i--) {
        ctx.globalAlpha = 0.10 * i;
        drawSprite(0 /* runner */, -i * 22, i * 10, size * (1 - i * 0.04), 0.22);
      }
      ctx.globalAlpha = 1;
    }
    drawSprite(0 /* runner */, 0, 0, size, 1);
    ctx.restore();
  }

  // ─── Sprite (or fallback shape) ───────────────────────────────────────────
  const SPRITE_COLS = 4;
  const SPRITE_ROWS = 4;

  function drawSprite(index, x, y, size, alpha = 1) {
    if (!images.sprites) {
      // Fallback: glowing capsule
      ctx.save(); ctx.globalAlpha = (ctx.globalAlpha || 1) * alpha;
      ctx.fillStyle = "#75ecff44";
      ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    const shW  = images.sprites.naturalWidth  || images.sprites.width;
    const shH  = images.sprites.naturalHeight || images.sprites.height;
    const cellW = shW / SPRITE_COLS;
    const cellH = shH / SPRITE_ROWS;
    const col   = index % SPRITE_COLS;
    const row   = Math.floor(index / SPRITE_COLS);
    const pad   = 8;
    ctx.save(); ctx.globalAlpha = (ctx.globalAlpha || 1) * alpha;
    ctx.drawImage(images.sprites,
      col * cellW + pad, row * cellH + pad, cellW - pad * 2, cellH - pad * 2,
      x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  // ─── Particles ────────────────────────────────────────────────────────────────
  function drawParticles() {
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (const p of state.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color.startsWith("#") ? hexToRgba(p.color, alpha) :
        p.color.replace(")", `,${alpha})`).replace("rgb(", "rgba(");
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ─── Run texts ────────────────────────────────────────────────────────────────
  function drawRunText() {
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const t of state.texts) {
      const alpha = clamp(t.life / t.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = "rgba(5,7,17,.76)"; ctx.strokeStyle = t.color; ctx.lineWidth = 2;
      const w = 128; const h = 34;
      roundRect(t.x - w/2, t.y - h/2, w, h, 12); ctx.fill();
      roundRect(t.x - w/2, t.y - h/2, w, h, 12); ctx.stroke();
      ctx.fillStyle = "#f7f4ec"; ctx.font = "900 15px Inter, system-ui, sans-serif";
      ctx.fillText(t.text, t.x, t.y + 1);
    }
    ctx.globalAlpha = 1; ctx.restore();
  }

  // ─── Power-up timer rings (HUD overlay on canvas) ─────────────────────────
  function drawPowerupRings() {
    if (!state.running) return;
    const rings = [
      { timer: player.boostTimer,   max: 5,  color: "#f5c451", label: "⚡" },
      { timer: player.magnetTimer,  max: 8,  color: "#ff7bcc", label: "🧲" },
      { timer: player.jetpackTimer, max: 8,  color: "#67f0a8", label: "🚀" }
    ].filter(r => r.timer > 0);
    if (!rings.length) return;
    ctx.save(); ctx.globalCompositeOperation = "source-over";
    let rx = BASE_W - 90;
    for (const r of rings) {
      const pct  = r.timer / r.max;
      const cx   = rx; const cy = 120; const rad = 28;
      ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = r.color; ctx.lineWidth = 6;
      ctx.shadowColor = r.color; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f7f4ec"; ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(Math.ceil(r.timer), cx, cy);
      rx -= 70;
    }
    ctx.restore();
  }

  // ─── Boss warning bar ─────────────────────────────────────────────────────────
  function drawBossWarning() {
    if (state.bossWarning <= 0) return;
    const pct   = state.bossWarning / 3.0;
    const flash = Math.sin(state.elapsed * 14) > 0 ? 1 : 0;
    ctx.save(); ctx.globalAlpha = 0.85 * flash;
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(0, BASE_H - 12, BASE_W * pct, 12);
    ctx.fillStyle = "#fff"; ctx.font = "900 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("BOSS INCOMING", BASE_W / 2, BASE_H - 6);
    ctx.globalAlpha = 1; ctx.restore();
  }

  // ─── Era label ───────────────────────────────────────────────────────────────
  function drawEraLabel() {
    if (!state.running) return;
    const era   = ERAS[state.eraIndex];
    const alpha = Math.min(1, state.eraTransition * 3) * 0.88;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = hexToRgba(era.color, 0.90);
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "top";
    ctx.fillText(`ERA: ${era.name.toUpperCase()}`, BASE_W - 18, 14);
    // Era key counter
    ctx.fillStyle = "#f5a623";
    ctx.textAlign = "right";
    ctx.fillText(`KEYS: ${state.eraKeys}/5`, BASE_W - 18, 32);
    ctx.restore();
  }

  // ─── Multiplier badge ─────────────────────────────────────────────────────────
  function drawMultiplierBadge() {
    if (!state.running || state.multiplier <= 1.05) return;
    const pulse = 1 + Math.sin(state.elapsed * 9) * 0.06;
    ctx.save();
    ctx.translate(BASE_W - 22, 68);
    ctx.scale(pulse, pulse);
    ctx.fillStyle   = "rgba(5,7,17,.82)";
    ctx.strokeStyle = "#f5c451"; ctx.lineWidth = 2;
    ctx.shadowColor = "#f5c451"; ctx.shadowBlur = 18;
    roundRect(-38, -18, 76, 36, 12); ctx.fill();
    roundRect(-38, -18, 76, 36, 12); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f5c451"; ctx.font = "900 18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(`×${state.multiplier.toFixed(1)}`, 0, 0);
    ctx.restore();
  }

  // ─── Overlay effects (flash, death animation) ─────────────────────────────
  function drawOverlayEffects() {
    if (!state.running && !state.gameOver) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    }
    if (state.flash > 0) {
      ctx.save(); ctx.globalAlpha = state.flash * 0.28;
      ctx.fillStyle = state.flashColor; ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    }
    // Death animation: radial fade + flash
    if (state.deathAnim > 0) {
      state.deathAnim -= 0.016;
      const t     = 1 - state.deathAnim / 1.2;
      const r     = t * BASE_W * 1.2;
      const alpha = clamp(t * 2 - 0.5, 0, 0.9);
      ctx.save();
      const grad  = ctx.createRadialGradient(BASE_W / 2, BASE_H / 2, 0, BASE_W / 2, BASE_H / 2, r);
      grad.addColorStop(0, "rgba(255,123,204,0)");
      grad.addColorStop(0.5, "rgba(255,123,204,.18)");
      grad.addColorStop(1, `rgba(5,7,17,${alpha})`);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    }
  }

  // ─── Canvas helpers ────────────────────────────────────────────────────────
  function drawImageCover(img, x, y, w, h) {
    const s  = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / s; const sh = h / s;
    const sx = (img.naturalWidth  - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawRawImageCover(img, x, y, w, h) {
    const iw = img.naturalWidth  || img.width;
    const ih = img.naturalHeight || img.height;
    const s  = Math.max(w / iw, h / ih);
    const sw = w / s; const sh = h / s;
    const sx = (iw - sw) / 2; const sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function hexToRgba(hex, alpha) {
    const v   = hex.replace("#", "");
    const int = parseInt(v.length === 3 ? v.split("").map(c => c + c).join("") : v, 16);
    return `rgba(${(int >> 16) & 255},${(int >> 8) & 255},${int & 255},${alpha})`;
  }

  function roundRect(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function wrapCanvasText(text, x, y, maxW, lh, maxLines) {
    const words = cleanText(text).split(" ");
    const lines = []; let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line); line = word;
        if (lines.length === maxLines - 1) break;
      } else line = test;
    }
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines) visible[visible.length - 1] = visible[visible.length - 1].replace(/\s+\S+$/, "") + "…";
    const startY = y - ((visible.length - 1) * lh) / 2;
    visible.forEach((l, i) => ctx.fillText(l, x, startY + i * lh));
  }

  // ─── Input binding ─────────────────────────────────────────────────────────
  function bindEvents() {
    window.addEventListener("resize", resizeCanvas);

    els.courseFilter.addEventListener("change", () => { populateSets(); applyFilters(); });
    els.setFilter.addEventListener("change", applyFilters);
    els.intensityFilter.addEventListener("change", renderSetupMetrics);
    els.startBtn.addEventListener("click", startRun);
    els.resumeBtn.addEventListener("click", resumeRun);
    els.restartBtn.addEventListener("click", startRun);
    els.againBtn.addEventListener("click", startRun);
    els.setupBtn.addEventListener("click", showSetup);
    els.pauseBtn.addEventListener("click", togglePause);
    els.backBtn.addEventListener("click", () => { window.location.href = "../../index.html"; });
    els.soundBtn.addEventListener("click", () => {
      state.sound = !state.sound;
      els.soundBtn.textContent = state.sound ? "Sound On" : "Sound Off";
      if (state.sound) audio.ensure();
      else if (audio.droneGain) audio.droneGain.gain.value = 0;
    });
    els.fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });

    // Touch dock buttons
    els.leftBtn.addEventListener("click",  () => moveLane(-1));
    els.rightBtn.addEventListener("click", () => moveLane(1));
    els.jumpBtn.addEventListener("click",  () => tryJump());
    els.slideBtn.addEventListener("click", () => slide());

    // Keyboard
    window.addEventListener("keydown", e => {
      if (!state.running || state.paused || state.gameOver) return;
      if (e.key === "ArrowLeft"  || e.key.toLowerCase() === "a") { e.preventDefault(); moveLane(-1); }
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") { e.preventDefault(); moveLane(1); }
      else if (e.key === "ArrowUp" || e.key.toLowerCase() === "w" || e.key === " ") {
        e.preventDefault();
        player.jumpHeld = true;
        tryJump();
      }
      else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") { e.preventDefault(); slide(); }
      else if (e.key.toLowerCase() === "p" || e.key === "Escape") { e.preventDefault(); togglePause(); }
    });
    window.addEventListener("keyup", e => {
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w" || e.key === " ") {
        player.jumpHeld = false;
      }
    });

    // Touch / pointer (swipe gestures + hold for variable jump)
    let touchStartTime = 0;
    els.canvas.addEventListener("pointerdown", e => {
      state.pointerStart = { x: e.clientX, y: e.clientY };
      touchStartTime = performance.now();
      player.jumpHeld = true;
    });
    els.canvas.addEventListener("pointermove", e => {
      if (!state.pointerStart) return;
      const dx = e.clientX - state.pointerStart.x;
      const dy = e.clientY - state.pointerStart.y;
      // Lane swap on quick horizontal swipe
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        moveLane(dx > 0 ? 1 : -1);
        state.pointerStart = { x: e.clientX, y: e.clientY };
      }
    });
    els.canvas.addEventListener("pointerup", e => {
      if (!state.pointerStart) return;
      const dx = e.clientX - state.pointerStart.x;
      const dy = e.clientY - state.pointerStart.y;
      state.pointerStart  = null;
      player.jumpHeld = false;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 26) {
        moveLane(dx > 0 ? 1 : -1);
      } else if (dy < -28) {
        tryJump();
      } else if (dy > 28) {
        slide();
      } else {
        // Tap = jump
        tryJump();
      }
    });
    els.canvas.addEventListener("pointercancel", () => {
      state.pointerStart = null; player.jumpHeld = false;
    });
  }

  // ─── Game loop ─────────────────────────────────────────────────────────────
  function loop(now) {
    const t = now || performance.now();
    if (document.hidden) { state.last = t; requestAnimationFrame(loop); return; }
    if (liteFx && state.frameStamp && t - state.frameStamp < 1000 / 45) { requestAnimationFrame(loop); return; }
    state.frameStamp = t;
    if (!state.last) state.last = t;
    const dt = Math.min(0.04, Math.max(0, (t - state.last) / 1000));
    state.last = t;
    if (!state.running || state.paused || state.gameOver) state.elapsed += dt * 0.45;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    bindEvents();
    resizeCanvas();
    requestAnimationFrame(loop);
    try {
      await Promise.all([loadAssets(), loadBank()]);
      renderStandby();
      renderSetupMetrics();
      if (new URLSearchParams(location.search).get("autostart") === "1") {
        state.sound = false;
        els.soundBtn.textContent = "Sound Off";
        startRun({ silent: true });
      }
    } catch (err) {
      console.error(err);
      els.questionMeta.textContent   = "Question bank unavailable";
      els.questionPrompt.textContent = "Reload the page or check the arcade data files.";
      els.startBtn.disabled = true;
      els.startBtn.textContent = "Library Error";
      els.setupMetrics.innerHTML = `<span class="metric-pill">Library failed to load</span>`;
    }
  }

  init();
})();
