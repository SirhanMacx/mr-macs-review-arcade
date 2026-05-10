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
  // Phase 5 — lite mode: honour arcade-perf signal OR explicit ?fx=lite (default), override with ?fx=full
  const _fxParam = new URLSearchParams(location.search).get("fx");
  const liteFx = _fxParam === "full" ? false
               : _fxParam === "lite" ? true
               : (window.MrMacsArcadePerf ? window.MrMacsArcadePerf.isLite() : true);
  document.documentElement.classList.toggle("perf-lite", liteFx);

  // Title parallax canvas
  const titleCanvas = $("titleCanvas");
  const tCtx = titleCanvas ? titleCanvas.getContext("2d") : null;
  let titleTime = 0;

  // Axis 1: Render title-screen parallax era-bands + drifting silhouettes
  function drawTitleParallax(dt) {
    if (!tCtx || reduceMotion) return;
    // Phase 5 lite: skip parallax title canvas entirely (3-layer synthwave grid)
    if (liteFx) return;
    titleTime += dt || 0.016;
    const tw = titleCanvas.offsetWidth || 800;
    const th = titleCanvas.offsetHeight || 600;
    if (titleCanvas.width !== tw || titleCanvas.height !== th) {
      titleCanvas.width = tw; titleCanvas.height = th;
    }
    tCtx.clearRect(0, 0, tw, th);

    // Sky gradient — era-band rainbow sweep
    const g = tCtx.createLinearGradient(0, 0, tw, th);
    g.addColorStop(0,    "#1a0e06");
    g.addColorStop(0.28, "#06101a");
    g.addColorStop(0.56, "#021209");
    g.addColorStop(1,    "#120618");
    tCtx.fillStyle = g; tCtx.fillRect(0, 0, tw, th);

    // Layer 1 (sky) — slow horizontal star drift
    tCtx.save(); tCtx.globalCompositeOperation = "screen";
    for (let i = 0; i < 60; i++) {
      const x = ((i * 313 + titleTime * 8) % tw);
      const y = ((i * 177) % (th * 0.55));
      const r = 0.5 + (i % 4) * 0.4;
      const a = 0.15 + (i % 5) * 0.06;
      const hues = ["#f5a623","#75ecff","#67f0a8","#ff7bcc","#e040fb"];
      tCtx.fillStyle = hexToRgbaTCtx(hues[i % 5], a);
      tCtx.beginPath(); tCtx.arc(x, y, r, 0, Math.PI * 2); tCtx.fill();
    }
    tCtx.restore();

    // Layer 2 (mid) — era band silhouette buildings / structures
    tCtx.save(); tCtx.globalCompositeOperation = "source-over";
    const silColors = ["rgba(61,30,4,.70)","rgba(13,34,64,.72)","rgba(4,26,16,.75)","rgba(30,6,40,.78)"];
    for (let era = 0; era < 4; era++) {
      const offsetX = ((era * tw * 0.28) - titleTime * (6 + era * 3)) % (tw * 1.1);
      tCtx.fillStyle = silColors[era];
      // Simple skyline
      const seed = era * 17;
      for (let b = 0; b < 12; b++) {
        const bx   = ((b * (seed + 83)) % (tw * 0.9)) + offsetX;
        const bw   = 18 + (b * seed + 7) % 42;
        const bh   = 40 + (b * seed + 31) % 90;
        const by   = th * 0.38 + (b % 3) * 12;
        tCtx.fillRect(bx % tw, by, bw, bh);
      }
    }
    tCtx.restore();

    // Layer 3 (fore) — ground grid / horizon glow
    const gridAlpha = 0.18 + Math.sin(titleTime * 0.8) * 0.04;
    tCtx.save(); tCtx.globalCompositeOperation = "screen";
    tCtx.strokeStyle = `rgba(117,236,255,${gridAlpha})`;
    tCtx.lineWidth = 1;
    const horizon = th * 0.58;
    // Converging lines
    for (let i = 0; i < 12; i++) {
      const lx = (i / 11) * tw;
      tCtx.beginPath(); tCtx.moveTo(tw/2, horizon); tCtx.lineTo(lx, th); tCtx.stroke();
    }
    // Horizontal grid rows
    for (let r = 0; r < 8; r++) {
      const ry = horizon + Math.pow(r / 7, 1.6) * (th - horizon);
      const rowAlpha = gridAlpha * (0.3 + r * 0.08);
      tCtx.strokeStyle = `rgba(117,236,255,${rowAlpha})`;
      tCtx.beginPath(); tCtx.moveTo(0, ry); tCtx.lineTo(tw, ry); tCtx.stroke();
    }
    // Horizon glow
    const hg = tCtx.createLinearGradient(0, horizon - 20, 0, horizon + 40);
    hg.addColorStop(0, "rgba(117,236,255,.22)");
    hg.addColorStop(1, "rgba(0,0,0,0)");
    tCtx.fillStyle = hg;
    tCtx.fillRect(0, horizon - 20, tw, 60);
    tCtx.restore();
  }

  // Helper for tCtx (title canvas) — same hex helper but locally scoped
  function hexToRgbaTCtx(hex, alpha) {
    const v   = hex.replace("#","");
    const int = parseInt(v.length===3 ? v.split("").map(c=>c+c).join("") : v, 16);
    return `rgba(${(int>>16)&255},${(int>>8)&255},${int&255},${alpha})`;
  }

  // ─── Era bands ─────────────────────────────────────────────────────────────
  // Axis 8: Full palette per era — sky, ground, accent, particles, silhouette tint
  const ERAS = [
    {
      name: "Industrial",    startKm: 0,
      color: "#c97b3a",  sky: "#1a0e06",  ground: "#2e1a08",
      accent: "#f5a623", fog: "#3d1e04",
      filter: "sepia(0.42) hue-rotate(8deg) brightness(.76)",
      // Parallax silhouette colors
      silhouetteColor: "rgba(61,30,4,.85)",
      // Era-specific obstacle label
      obstacleTheme: { block: "Factory Crate", pipe: "Steam Pipe", fence: "Wrought Fence", gap: "Rail Gap" }
    },
    {
      name: "Cold War",      startKm: 0.5,
      color: "#4a7fb5",  sky: "#06101a",  ground: "#0b1929",
      accent: "#75ecff", fog: "#0d2240",
      filter: "hue-rotate(195deg) saturate(1.15) brightness(.72)",
      silhouetteColor: "rgba(13,34,64,.88)",
      obstacleTheme: { block: "Concrete Barrier", pipe: "Barbed Wire", fence: "Guard Tower", gap: "Bomb Crater" }
    },
    {
      name: "Digital Age",   startKm: 1.0,
      color: "#67f0a8",  sky: "#021209",  ground: "#041a10",
      accent: "#00ffaa", fog: "#032912",
      filter: "hue-rotate(140deg) saturate(1.3) brightness(.70)",
      silhouetteColor: "rgba(4,26,16,.90)",
      obstacleTheme: { block: "Data Cube", pipe: "Firewall", fence: "Null Barrier", gap: "Void Gap" }
    },
    {
      name: "Future",        startKm: 1.5,
      color: "#ff7bcc",  sky: "#120618",  ground: "#1e0628",
      accent: "#e040fb", fog: "#2a0640",
      filter: "hue-rotate(280deg) saturate(1.35) brightness(.68)",
      silhouetteColor: "rgba(30,6,40,.92)",
      obstacleTheme: { block: "Light Wall", pipe: "Plasma Duct", fence: "Force Field", gap: "Phase Rift" }
    }
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

    // Axis 1: Best-distance + coins badges on title screen
    const badgeEl = $("titleBadges");
    if (badgeEl) {
      badgeEl.innerHTML = [
        best ? `<div class="title-badge title-badge--best"><span>Best</span><span class="badge-val">${escapeHtml(formatKm(best))}</span></div>` : "",
        `<div class="title-badge title-badge--coins"><span>Coins</span><span class="badge-val">${escapeHtml(formatNumber(state.totalCoins))}</span></div>`
      ].join("");
    }
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
    const prev = state.checkpointMode;
    state.checkpointMode = mode;
    els.questionCard.classList.toggle("standby",    mode === "standby");
    els.questionCard.classList.toggle("checkpoint", mode === "checkpoint");
    els.questionCard.classList.toggle("debrief",    mode === "debrief");
    // Phase 4 — duck music during gate-question modal, restore after
    if (mode === "checkpoint" && prev !== "checkpoint") {
      try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck && window.MrMacsArcadeMusic.duck(); } catch (e) {}
    } else if (prev === "checkpoint" && mode !== "checkpoint") {
      try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore && window.MrMacsArcadeMusic.restore(); } catch (e) {}
    }
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
    // Axis 7 / 13: Sentence-case lane labels, NOT all-caps
    els.laneChips.innerHTML = state.currentChoices.map(c =>
      `<button class="lane-chip" type="button" data-lane="${c.lane}" style="--gate:${c.color}">${laneNames[c.lane].charAt(0).toUpperCase() + laneNames[c.lane].slice(1)}: ${escapeHtml(c.text)}</button>`
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
      gateActive: null, sawFirstGate: false, debriefUntil: 0, _5kmAwarded: false,
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

  // Phase 3 — Tour steps (shown once after first run starts)
  const TOUR_STEPS = [
    {
      target: "#runnerCanvas",
      title: "Three lanes",
      body: "Swipe (or arrow keys) to swap lanes. Tap or Space jumps; hold for higher arcs. Slide under low pipes.",
      placement: "top"
    },
    {
      target: ".hud-stats",
      title: "Coin streak multiplies",
      body: "Unbroken coin chain caps at 8×. One hit resets it — but power-ups can save you.",
      placement: "bottom"
    },
    {
      target: ".hud-stat--distance",
      title: "Eras shift the world",
      body: "Industrial → Cold War → Digital → Future. Collect 5 era keys in one run for a 500-shard bonus.",
      placement: "bottom"
    },
    {
      target: "#questionCard",
      title: "Gates ask history",
      body: "Pick the lane labeled with the right answer. Wrong = brief slowdown + multiplier reset.",
      placement: "top"
    }
  ];

  function startRun(opts = {}) {
    if (window.MrMacsEndRecap) { MrMacsEndRecap.reset(); MrMacsEndRecap.startTracking(); }
    const _recapEl = document.getElementById("endRecap");
    if (_recapEl) _recapEl.innerHTML = "";
    if (!state.filtered.length) applyFilters();
    if (!opts.silent) audio.startRun();
    resetRun();
    // Phase 4 — shared music engine
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start("runner-synthwave"); } catch (e) {}
    // Phase 3 — show tour once after the very first run start
    if (window.MrMacsArcadeTour) {
      requestAnimationFrame(() => {
        MrMacsArcadeTour.start("timeline-runner", TOUR_STEPS);
      });
    }
    // Wave 5 — clear stale snapshot + start ~10s session snapshots
    try {
      if (window.MrMacsSessions) window.MrMacsSessions.clear("timeline-runner");
      if (state.__wave5SnapTimer) clearInterval(state.__wave5SnapTimer);
      state.__wave5SnapTimer = setInterval(() => {
        try {
          if (!state.running || state.paused || state.gameOver || !window.MrMacsSessions) return;
          window.MrMacsSessions.save("timeline-runner", {
            distance: Math.floor(state.distance || 0),
            score: Math.floor(state.score || 0),
            lane: player && player.lane != null ? player.lane : 1,
            era: state.eraIndex || 0,
            health: state.health
          });
        } catch (e) {}
      }, 10000);
    } catch (e) {}
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
    // Phase 4 — shared music engine
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch (e) {}
    const km = state.distance;
    if (km > state.bestDistance) state.bestDistance = km;
    persistState();
    if (window.MrMacsEndRecap) MrMacsEndRecap.stopTracking();
    setTimeout(() => {
      renderEndScreen();
      if (window.MrMacsEndRecap) MrMacsEndRecap.render(document.getElementById("endRecap"));
      els.endScreen.classList.add("show");
    }, 900);
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "timeline-runner", title: "Timeline Runner",
      score: Math.floor(state.score), answered: state.answered, correct: state.correct
    }, { counter: "game-completions", once: false });
    // Wave 5 — leaderboard submit + session clear
    try {
      if (state.__wave5SnapTimer) { clearInterval(state.__wave5SnapTimer); state.__wave5SnapTimer = null; }
      if (window.MrMacsSessions) window.MrMacsSessions.clear("timeline-runner");
    } catch (e) {}
    try {
      if (window.MrMacsLeaderboards) {
        const dist = Math.floor(state.distance || 0);
        const result = window.MrMacsLeaderboards.submit("timeline-runner", dist, {
          distance: dist, score: Math.floor(state.score || 0),
          era: state.eraIndex || 0,
          accuracy: state.answered ? Math.round((state.correct / state.answered) * 100) : 0
        });
        if (result && result.isNewRecord && window.MrMacsToast) {
          window.MrMacsToast.push({ icon: "🏆", title: "New high score!", sub: "Rank #" + result.rank, tone: "good", ms: 4200 });
        } else if (result && window.MrMacsToast) {
          window.MrMacsToast.push({ icon: "🏅", title: "Top 5 score", sub: "Rank #" + result.rank, tone: "good", ms: 3600 });
        }
      }
    } catch (e) {}
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
    const sparkleIcon = (window.MrMacsIcons && window.MrMacsIcons.has("sparkles"))
      ? `<span style="color:var(--gold);margin-right:6px;vertical-align:-.16em">${window.MrMacsIcons.svg("sparkles")}</span>`
      : "";
    els.studyTargets.innerHTML = !targets.length
      ? `<div class="study-target">${sparkleIcon}<strong>Clean run.</strong>No missed gates this session.</div>`
      : targets.map(i => `<div class="study-target"><strong>${escapeHtml(i.answer)}</strong>${escapeHtml(i.prompt)}<br>${escapeHtml(i.explanation)}</div>`).join("");
    renderShop();
  }

  // ─── Coin Shop ──────────────────────────────────────────────────────────────
  const SHOP_ITEMS = [
    { id: "startShield",     label: "Start with Shield",    cost: 200,  storageKey: `${STORAGE_KEY}:startShield`,     bought: () => state.startWithShield },
    { id: "powerupDuration", label: "+2s Power-up Duration", cost: 350,  storageKey: `${STORAGE_KEY}:powerupDuration`, bought: () => state.powerupDuration > 0 }
  ];

  // Axis 9: Era-themed shop cards rendered into target grid
  function renderShopInto(grid) {
    if (!grid) return;
    grid.innerHTML = SHOP_ITEMS.map(item => {
      const owned  = item.bought();
      const canBuy = !owned && state.totalCoins >= item.cost;
      const era    = ERAS[state.eraIndex];
      return `<button class="shop-item${owned ? " owned" : ""}" data-shop="${item.id}"${owned || !canBuy ? " disabled" : ""}>` +
        `<strong>${escapeHtml(owned ? "Owned" : `${item.cost} coins`)}</strong>` +
        `<span>${escapeHtml(item.label)}</span></button>`;
    }).join("");
    grid.querySelectorAll("[data-shop]").forEach(btn => {
      btn.addEventListener("click", () => buyShopItem(btn.dataset.shop));
    });
  }

  function renderShop() {
    renderShopInto(document.getElementById("shopGrid"));
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
  // Axis 6: tabular-nums (handled in CSS), multiplier pulse-advance, era-color tint
  let prevMultiplier = 1;
  function updateHud() {
    const distKm = (state.distance / 1000).toFixed(2);
    els.score.textContent  = formatNumber(state.score);
    els.health.textContent = `${state.health}${state.shields ? `+${state.shields}` : ""}`;
    els.speed.textContent  = `${distKm}`;

    // Multiplier — pulse the badge when it advances
    const newMult = state.multiplier.toFixed(1);
    if (newMult !== els.streak.textContent) {
      const multStat = els.streak.closest?.(".hud-stat");
      if (multStat && state.multiplier > prevMultiplier) {
        multStat.classList.remove("pulse-advance");
        void multStat.offsetWidth; // reflow to restart animation
        multStat.classList.add("pulse-advance");
      }
    }
    els.streak.textContent = `${newMult}`;
    prevMultiplier = state.multiplier;
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
        window.MrMacsProfile?.addShards(1, "timeline-runner:coin");
        break;
      case "magnet":
        player.magnetTimer = PICKUP_TYPES.magnet.duration + state.powerupDuration;
        setFeedback("Magnet active — coins pulled to you!", "good");
        audio.powerupArpeggio("magnet");
        addText(pt.x, pt.y - 20, "magnet", "#ff7bcc");
        addParticles(pt.x, pt.y, 22, "#ff7bcc", 1.2);
        window.MrMacsProfile?.addShards(20, "timeline-runner:powerup");
        break;
      case "shield":
        state.shields = Math.min(3, state.shields + 1);
        setFeedback("Shield gained. Absorbs next hit.", "good");
        audio.shield();
        addText(pt.x, pt.y - 20, "+shield", "#75ecff");
        addParticles(pt.x, pt.y, 18, "#75ecff", 1.0);
        window.MrMacsProfile?.addShards(20, "timeline-runner:powerup");
        break;
      case "boost":
        player.boostTimer = PICKUP_TYPES.boost.duration + state.powerupDuration;
        state.score += 100;
        setFeedback("Speed Boost! 2× pace for 5 sec.", "good");
        audio.powerupArpeggio("boost");
        addText(pt.x, pt.y - 20, "boost!", "#f5c451");
        addParticles(pt.x, pt.y, 24, "#f5c451", 1.3);
        spawnSpeedLines();
        window.MrMacsProfile?.addShards(20, "timeline-runner:powerup");
        break;
      case "jetpack":
        player.jetpackTimer = PICKUP_TYPES.jetpack.duration + state.powerupDuration;
        player.airborne = true;
        setFeedback("Jet Pack! Auto-fly for 8 sec.", "good");
        audio.powerupArpeggio("jetpack");
        addText(pt.x, pt.y - 20, "jetpack!", "#67f0a8");
        addParticles(pt.x, pt.y, 28, "#67f0a8", 1.4);
        window.MrMacsProfile?.addShards(20, "timeline-runner:powerup");
        break;
      case "erakey":
        state.eraKeys++;
        state.score += 500;
        addText(pt.x, pt.y - 20, "era key!", "#f5a623");
        addParticles(pt.x, pt.y, 30, "#f5a623", 1.5);
        setFeedback(`Era Key collected! ${state.eraKeys}/5 — collect all to win!`, "good");
        window.MrMacsProfile?.addShards(100, "timeline-runner:era-key");
        if (state.eraKeys >= 5) {
          window.MrMacsProfile?.unlock("tr-all-eras");
          window.MrMacsProfile?.addShards(500, "timeline-runner:all-era-keys");
          endRun();
        }
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
      window.MrMacsProfile?.addShards(15, "timeline-runner:correct-gate");
      if (state.correct === 1) window.MrMacsProfile?.unlock("first-correct");
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

    // Phase 1 — recordAnswer hook
    if (window.MrMacsProfile) {
      try {
        window.MrMacsProfile.recordAnswer({
          course:  state.currentQuestion.course || state.runCourse || "All Courses",
          set:     state.currentQuestion.set    || state.runSet    || "Timeline Runner",
          correct: choice.correct,
          prompt:  displayPrompt(state.currentQuestion),
          answer:  cleanText(state.currentQuestion.answer),
          gameId:  "timeline-runner"
        });
      } catch (_) {}
    }

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
    // Phase 5 lite: cap streak count
    const lineCount = liteFx ? 4 : 16;
    for (let i = 0; i < lineCount; i++) {
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
  // Axis 8: Era transitions — CSS vars + full-screen sweep + ambient particle burst
  let eraSweepProgress = -1; // -1 = idle
  let eraSweepColor    = "#f5a623";
  let eraBannerText    = "";
  let eraBannerAlpha   = 0;

  function updateEra() {
    const km       = state.distance / 1000;
    let   newIndex = 0;
    for (let i = ERAS.length - 1; i >= 0; i--) {
      if (km >= ERAS[i].startKm) { newIndex = i; break; }
    }
    if (newIndex !== state.eraIndex) {
      const prev = ERAS[state.eraIndex];
      const next = ERAS[newIndex];
      audio.eraStinger(newIndex);
      setFeedback(`Era shift: ${prev.name} → ${next.name}`, "good");
      window.MrMacsProfile?.addShards(50, "timeline-runner:era-band");
      state.eraTransition = 0;
      state.eraIndex      = newIndex;
      // Wave 5 — snapshot on era transition
      try {
        if (window.MrMacsSessions) {
          window.MrMacsSessions.save("timeline-runner", {
            distance: Math.floor(state.distance || 0),
            score: Math.floor(state.score || 0),
            lane: player && player.lane != null ? player.lane : 1,
            era: newIndex, health: state.health
          });
        }
      } catch (e) {}
      // Trigger full-screen sweep
      eraSweepProgress = 0;
      eraSweepColor    = next.accent;
      eraBannerText    = `${prev.name}  →  ${next.name}`;
      eraBannerAlpha   = 1;
      // Ambient particle burst — Phase 5 lite: cap at 12 instead of 60
      if (!reduceMotion) {
        const burstCount = liteFx ? 12 : 60;
        for (let i = 0; i < burstCount; i++) {
          const angle = (i / burstCount) * Math.PI * 2;
          const speed = 80 + Math.random() * 220;
          state.particles.push({
            x: BASE_W / 2, y: BASE_H / 2,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40,
            radius: 3 + Math.random() * 5,
            color: next.accent,
            life: 0.6 + Math.random() * 0.8, maxLife: 1.4
          });
        }
      }
      // Update CSS vars for UI tinting
      document.documentElement.style.setProperty("--era-primary", next.color);
      document.documentElement.style.setProperty("--era-sky",     next.sky);
      document.documentElement.style.setProperty("--era-accent",  next.accent);
    }
    state.eraTransition = Math.min(1, state.eraTransition + 0.016);
    // Advance sweep
    if (eraSweepProgress >= 0) eraSweepProgress = Math.min(1, eraSweepProgress + 0.04);
    eraBannerAlpha = Math.max(0, eraBannerAlpha - 0.012);
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
    // ── MrMacsProfile: 5 km milestone ────────────────────────────────────────
    if (!state._5kmAwarded && state.distance >= 5000) {
      state._5kmAwarded = true;
      window.MrMacsProfile?.unlock("tr-distance-5km");
    }
    // ─────────────────────────────────────────────────────────────────────────

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
    // Axis 3: subtle camera bob on jump landing
    if (!reduceMotion && landingRecoil > 0) {
      const bob = Math.sin(landingRecoil * Math.PI / 0.18) * 4;
      ctx.translate(0, bob);
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
    drawEraTransitionSweep();   // Axis 8: full-screen sweep + banner
    drawOverlayEffects();
    audio.music(state.elapsed);
    audio.updateDrone();
  }

  // ─── Background + parallax ───────────────────────────────────────────────────
  // Axis 2: 3-layer parallax (sky/mid/fore) + horizon glow + era-tinted palette
  function drawBackground() {
    const era  = ERAS[state.eraIndex];
    const era2 = ERAS[Math.min(ERAS.length - 1, state.eraIndex + 1)];
    const t    = state.eraTransition;

    if (images.background) {
      if (!liteFx) {
        ctx.save();
        ctx.filter = `blur(10px) saturate(1.20) brightness(.64) ${era.filter}`;
        drawRawImageCover(images.background, -20, -20, BASE_W + 40, BASE_H + 40);
        ctx.filter = "none";
        ctx.restore();
      } else {
        drawRawImageCover(images.background, 0, 0, BASE_W, BASE_H);
      }
    } else {
      // Sky gradient — Axis 8: smooth palette shift across eras
      const skyColor  = lerpColor(era.sky,           era2.sky,           t);
      const fogColor  = lerpColor(era.fog || "#0a1021", era2.fog || "#0a1021", t);
      const skyGrd = ctx.createLinearGradient(0, 0, 0, BASE_H);
      skyGrd.addColorStop(0,    skyColor);
      skyGrd.addColorStop(0.45, fogColor);
      skyGrd.addColorStop(1,    "#050711");
      ctx.fillStyle = skyGrd; ctx.fillRect(0, 0, BASE_W, BASE_H);
    }

    ctx.fillStyle = "rgba(4,7,15,.26)"; ctx.fillRect(0, 0, BASE_W, BASE_H);

    if (!reduceMotion) {
      // ── Layer 1 (sky) — star field, slowest scroll ───────────────────────
      ctx.save(); ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 52; i++) {
        const sx     = ((i * 313 + state.distance * 0.06) % (BASE_W * 1.05));
        const sy     = ((i * 177 + state.distance * 0.02) % (BASE_H * 0.50)) + 20;
        const sr     = 0.5 + (i % 3) * 0.55;
        const salpha = 0.07 + (i % 5) * 0.028;
        ctx.fillStyle = hexToRgba(era.accent, salpha);
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // ── Layer 2 (mid) — era silhouette skyline, medium scroll ───────────
      drawEraSilhouettes(era, era2, t);

      // ── Layer 3 (fore) — data-streaks, fastest scroll ────────────────────
      ctx.save(); ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 28; i++) {
        const fy     = ((i * 77 + state.distance * 0.24) % 820) + 40;
        const fx     = 220 + ((i * 193 + state.distance * 0.14) % 1160);
        const falpha = 0.04 + (i % 4) * 0.016;
        ctx.strokeStyle = hexToRgba(era.accent, falpha);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 22 + (i % 5) * 10, fy - 7); ctx.stroke();
      }
      ctx.restore();
    }

    // ── Horizon glow — Axis 2 vanishing point treatment ──────────────────
    const horizonY  = 300;
    const pulse     = 0.5 + Math.sin(state.elapsed * 1.5) * 0.5;
    const accentCol = lerpColor(era.accent, era2.accent, t);
    const hglow     = ctx.createRadialGradient(BASE_W / 2, horizonY, 10, BASE_W / 2, horizonY, 440);
    hglow.addColorStop(0,    hexToRgba(accentCol, 0.22 + pulse * 0.07));
    hglow.addColorStop(0.40, hexToRgba(accentCol, 0.07));
    hglow.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = hglow; ctx.fillRect(0, 0, BASE_W, BASE_H);

    // Wide ambient fill
    const wglow = ctx.createRadialGradient(800, 340, 50, 800, 340, 560);
    wglow.addColorStop(0,   hexToRgba(accentCol, 0.12 + pulse * 0.04));
    wglow.addColorStop(0.5, hexToRgba(accentCol, 0.04));
    wglow.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = wglow; ctx.fillRect(0, 0, BASE_W, BASE_H);

    drawFloatingPanels();
  }

  // Axis 2/8: Per-era silhouette skyline with era-themed windows
  function drawEraSilhouettes(era, era2, t) {
    if (reduceMotion || liteFx) return;
    ctx.save(); ctx.globalCompositeOperation = "source-over";

    [0, 1].forEach(layerIdx => {
      const eraRef   = layerIdx === 0 ? era  : era2;
      const layerAlpha = layerIdx === 0 ? (0.60 * (1 - t * 0.45)) : (0.55 * t * 0.7);
      if (layerAlpha < 0.03) return;
      const col  = eraRef.silhouetteColor || "rgba(20,10,4,.80)";
      const seed = (layerIdx === 0 ? state.eraIndex : Math.min(ERAS.length-1, state.eraIndex+1)) * 53;
      const scroll = state.distance * (0.08 + layerIdx * 0.04);

      ctx.fillStyle = col;
      ctx.globalAlpha = layerAlpha;
      for (let b = 0; b < 22; b++) {
        const bx = ((b * (seed + 83) + scroll * 0.0028) % (BASE_W * 1.1)) - 40;
        const bw = 20 + (b * seed + 11) % 62;
        const bh = 42 + (b * seed + 29) % 120;
        const by = 308 - bh;
        ctx.fillRect(bx % BASE_W, by, bw, bh);
        // Window glints
        const wina = 0.28 + Math.sin(state.elapsed * 2.8 + b) * 0.10;
        ctx.fillStyle = hexToRgba(eraRef.accent, wina * layerAlpha);
        for (let wr = 0; wr < 3; wr++) {
          for (let wc = 0; wc < 2; wc++) {
            ctx.fillRect(bx % BASE_W + 5 + wc * 10, by + 10 + wr * 14, 6, 8);
          }
        }
        ctx.fillStyle = col; ctx.globalAlpha = layerAlpha;
      }
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Color lerp helper for era transitions
  function lerpColor(hex1, hex2, t) {
    if (!hex1 || !hex2) return hex1 || "#050711";
    const c1 = hexToComponents(hex1);
    const c2 = hexToComponents(hex2);
    return `rgb(${Math.round(c1[0]+(c2[0]-c1[0])*t)},${Math.round(c1[1]+(c2[1]-c1[1])*t)},${Math.round(c1[2]+(c2[2]-c1[2])*t)})`;
  }
  function hexToComponents(hex) {
    if (!hex || hex.startsWith("rgb")) {
      const m = (hex||"").match(/\d+/g) || [5,7,17];
      return [+m[0],+m[1],+m[2]];
    }
    const v   = hex.replace("#","");
    const int = parseInt(v.length===3 ? v.split("").map(c=>c+c).join("") : v, 16);
    return [(int>>16)&255,(int>>8)&255,int&255];
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
    const era     = ERAS[state.eraIndex];
    const era2    = ERAS[Math.min(ERAS.length-1, state.eraIndex+1)];
    const t       = state.eraTransition;

    ctx.save(); ctx.globalCompositeOperation = "source-over";

    // ── Road surface with era-tinted texture ─────────────────────────────
    const groundCol = lerpColor(era.ground || "#0a1021", era2.ground || "#0a1021", t);
    const road = ctx.createLinearGradient(800, horizon, 800, bottom);
    road.addColorStop(0,    `rgba(7,20,38,.28)`);
    road.addColorStop(0.45, groundCol.replace("rgb","rgba").replace(")",",0.52)"));
    road.addColorStop(1,    "rgba(0,0,0,.72)");
    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(690, horizon); ctx.lineTo(910, horizon);
    ctx.lineTo(1425, bottom); ctx.lineTo(175, bottom);
    ctx.closePath(); ctx.fill();

    // ── Surface texture strips (simulated asphalt/cobble/grid per era) ───
    if (!reduceMotion && !liteFx) {
      ctx.save(); ctx.globalAlpha = 0.08;
      ctx.fillStyle = hexToRgba(era.accent, 0.12);
      for (let i = 0; i < 14; i++) {
        const p   = (i / 14 + state.distance * 0.00038) % 1;
        const ry  = lerp(horizon, bottom, Math.pow(p, 1.4));
        const rw  = lerp(40, 820, Math.pow(p, 1.15));
        const rh  = lerp(1, 4, p);
        ctx.fillRect(800 - rw/2, ry, rw, rh);
      }
      ctx.restore();
    }

    // ── Lane edges & dividers with era-color glow ─────────────────────────
    const accentRgb = lerpColor(era.accent, era2.accent, t);
    for (let l = 0; l < 4; l++) {
      const f      = l / 3;
      const topX   = lerp(690, 910, f);
      const botX   = lerp(175, 1425, f);
      const isEdge = l === 0 || l === 3;
      // Edge lines use gold, inner dividers use era accent
      const lColor = isEdge ? "245,196,81" : "117,236,255";
      ctx.strokeStyle = `rgba(${lColor},${isEdge ? 0.52 : 0.40})`;
      ctx.lineWidth   = isEdge ? 3 : 2;
      ctx.shadowColor = `rgba(${lColor},.42)`; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.moveTo(topX, horizon); ctx.lineTo(botX, bottom); ctx.stroke();
    }

    // ── Vanishing point dot ───────────────────────────────────────────────
    ctx.shadowBlur = 0;
    const vpGlow = ctx.createRadialGradient(800, horizon, 0, 800, horizon, 48);
    vpGlow.addColorStop(0,   hexToRgba(era.accent, 0.55));
    vpGlow.addColorStop(0.5, hexToRgba(era.accent, 0.18));
    vpGlow.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = vpGlow; ctx.fillRect(752, horizon - 48, 96, 96);

    // ── Animated dashes ────────────────────────────────────────────────────
    ctx.lineWidth = 1; ctx.shadowBlur = 0;
    for (let i = 0; i < 22; i++) {
      const p  = ((i / 22) + state.distance * 0.00075) % 1;
      const dy = lerp(horizon, bottom, Math.pow(p, 1.7));
      const dw = lerp(120, 1050, Math.pow(p, 1.2));
      ctx.strokeStyle = `rgba(255,255,255,${lerp(0.07, 0.32, p)})`;
      ctx.beginPath(); ctx.moveTo(800 - dw/2, dy); ctx.lineTo(800 + dw/2, dy); ctx.stroke();
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

  // Axis 5: Collectibles — spinning gold coin with sparkle + era-styled power-up tokens
  function drawPickup(obj) {
    const pt   = lanePoint(obj.lane, obj.progress);
    if (pt.y < 0 || pt.y > BASE_H + 50) return;
    const bob  = Math.sin(state.elapsed * 5.2 + obj.lane * 1.3) * 9 * pt.scale;
    const era  = ERAS[state.eraIndex];

    ctx.save(); ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = obj.color; ctx.shadowBlur = 22;
    ctx.globalAlpha = 0.94;

    if (obj.pickupKind === "coin") {
      // Axis 5: spinning coin — squash/stretch to simulate 3D rotation
      const spin  = state.elapsed * 4.8 + obj.lane * 2.1;
      const cx    = pt.x;
      const cy    = pt.y - 18 * pt.scale + bob * 0.5;
      const r     = 14 * pt.scale;
      const flipW = Math.abs(Math.cos(spin)) * r; // squash x to simulate spin

      // Gold fill
      ctx.fillStyle = obj.color;
      ctx.shadowColor = obj.color; ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(cx, cy, flipW + 1, r, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle  = "rgba(255,255,200,.32)";
      ctx.beginPath();
      ctx.ellipse(cx - flipW * 0.2, cy - r * 0.25, flipW * 0.35 + 0.5, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dollar ring line
      if (flipW > 2) {
        ctx.strokeStyle = "rgba(255,255,255,.30)"; ctx.lineWidth = r * 0.12;
        ctx.beginPath(); ctx.ellipse(cx, cy, flipW * 0.6, r * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      }

      // Sparkle particles (rare)
      if (!reduceMotion && Math.random() < 0.04) {
        const sang = Math.random() * Math.PI * 2;
        state.particles.push({
          x: cx + r * Math.cos(sang), y: cy + r * Math.sin(sang),
          vx: Math.cos(sang) * 28, vy: Math.sin(sang) * 28 - 18,
          radius: 1.5, color: "#fff8d0",
          life: 0.3, maxLife: 0.3
        });
      }

    } else if (obj.pickupKind === "erakey") {
      // Axis 5: Era key — prismatic gem with glow rings
      const cx   = pt.x;
      const cy   = pt.y - 44 * pt.scale + bob;
      const r    = 28 * pt.scale;
      // Prismatic color cycle
      const hue  = (state.elapsed * 80) % 360;
      ctx.shadowColor = `hsl(${hue},100%,60%)`; ctx.shadowBlur = 32;
      // Diamond shape
      ctx.fillStyle = `hsl(${hue},90%,58%)`;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.6, cy);
      ctx.lineTo(cx, cy + r * 0.8);
      ctx.lineTo(cx - r * 0.6, cy);
      ctx.closePath(); ctx.fill();
      // Outer glow ring
      ctx.strokeStyle = `hsla(${(hue+120)%360},90%,70%,.70)`; ctx.lineWidth = 2.5 * pt.scale;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `hsla(${(hue+240)%360},90%,70%,.40)`; ctx.lineWidth = 1.5 * pt.scale;
      ctx.beginPath(); ctx.arc(cx, cy, r * 2.0, 0, Math.PI * 2); ctx.stroke();
      // Inner facets
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1 * pt.scale;
      ctx.beginPath(); ctx.moveTo(cx - r * 0.3, cy - r * 0.3); ctx.lineTo(cx + r * 0.25, cy + r * 0.35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + r * 0.3, cy - r * 0.3); ctx.lineTo(cx - r * 0.2, cy + r * 0.35); ctx.stroke();

    } else {
      // Power-up: era-themed star/icon
      const cx = pt.x;
      const cy = pt.y - 44 * pt.scale + bob;
      const r1 = 26 * pt.scale;
      const r2 = r1 * 0.44;
      const n  = obj.pickupKind === "jetpack" ? 6 : obj.pickupKind === "magnet" ? 4 : 5;
      const spin2 = state.elapsed * 1.2 + obj.lane;

      // Outer glow pill
      ctx.fillStyle = hexToRgba(obj.color, 0.15);
      ctx.shadowColor = obj.color; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.ellipse(cx, cy, r1 * 1.6, r1 * 1.6, 0, 0, Math.PI * 2); ctx.fill();

      // Star shape
      ctx.fillStyle = obj.color; ctx.shadowBlur = 18;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const r   = i % 2 === 0 ? r1 : r2;
        const ang = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2 + spin2;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
        else         ctx.lineTo(cx + r * Math.cos(ang), cy + r * Math.sin(ang));
      }
      ctx.closePath(); ctx.fill();

      // Era-style center icon (letter)
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(5,7,17,.82)";
      ctx.font = `900 ${Math.max(8, 12 * pt.scale)}px Inter, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const icons = { magnet: "M", shield: "S", boost: "B", jetpack: "J" };
      ctx.fillText(icons[obj.pickupKind] || "?", cx, cy);
    }
    ctx.restore();
  }

  // Axis 4: Distinct per-era obstacle silhouettes
  function drawObstacle(obj) {
    const pt  = lanePoint(obj.lane, obj.progress);
    if (obj.progress < 0) return;
    const era = ERAS[state.eraIndex];

    // Boss: pulsing 3-second windup with warning bar + dramatic reveal
    if (obj.isBoss && !obj.windupDone) {
      const pct   = 1 - obj.windupLeft / 3.0;
      const rad   = (60 + pct * 110) * pt.scale;
      ctx.save(); ctx.globalCompositeOperation = "screen";
      // Outer pulsing ring
      ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 4 * pt.scale;
      ctx.shadowColor = "#ff4444"; ctx.shadowBlur = 44;
      ctx.beginPath(); ctx.arc(pt.x, pt.y - 85 * pt.scale, rad, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct); ctx.stroke();
      // Inner fill preview
      ctx.fillStyle = hexToRgba("#ff4444", pct * 0.14);
      ctx.beginPath(); ctx.arc(pt.x, pt.y - 85 * pt.scale, rad, 0, Math.PI * 2); ctx.fill();
      // Rotating danger dashes
      for (let d = 0; d < 8; d++) {
        const ang = (d / 8) * Math.PI * 2 + state.elapsed * 3;
        const dx  = pt.x + (rad + 18) * Math.cos(ang);
        const dy  = (pt.y - 85 * pt.scale) + (rad + 18) * Math.sin(ang);
        ctx.fillStyle = `rgba(255,68,68,${0.40 * pct})`;
        ctx.beginPath(); ctx.arc(dx, dy, 3 * pt.scale, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
      // Warning text
      ctx.save(); ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#ff4444";
      ctx.font = `900 ${Math.max(11, 16 * pt.scale)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "#ff4444"; ctx.shadowBlur = 20;
      const warnFlash = Math.sin(state.elapsed * 14) > 0 ? 1 : 0.5;
      ctx.globalAlpha = warnFlash;
      ctx.fillText("BOSS INCOMING", pt.x, pt.y - 150 * pt.scale);
      ctx.restore();
      return;
    }

    // Obstacle dimensions by type
    const dims = {
      block: { w: 82,  h: 74  },
      pipe:  { w: 124, h: 38  },
      fence: { w: 52,  h: 170 },
      cart:  { w: 90,  h: 60  },
      gap:   { w: 145, h: 18  },
      boss:  { w: 168, h: 168 }
    };
    const d   = dims[obj.obstacleId] || dims.block;
    const tw  = d.w * pt.scale;
    const th  = d.h * pt.scale;
    const tx  = pt.x - tw / 2;
    const ty  = pt.y - th - 10 * pt.scale;
    const rad = Math.max(4, 8 * pt.scale);

    ctx.save(); ctx.globalCompositeOperation = "screen";

    // Axis 4: Gap — show depth (lane drops below view)
    if (obj.obstacleId === "gap") {
      ctx.fillStyle = "rgba(0,0,0,.88)";
      ctx.strokeStyle = obj.color; ctx.lineWidth = Math.max(1.5, 2 * pt.scale);
      ctx.shadowColor = obj.color; ctx.shadowBlur = 12;
      roundRect(tx, ty, tw, Math.max(4, 8 * pt.scale), rad); ctx.fill();
      roundRect(tx, ty, tw, Math.max(4, 8 * pt.scale), rad); ctx.stroke();
      // Depth lines inside gap
      ctx.globalAlpha = 0.35;
      for (let gl = 1; gl < 4; gl++) {
        const gy = ty + gl * th * 0.32;
        ctx.strokeStyle = hexToRgba(obj.color, 0.25);
        ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(tx + tw * 0.1, gy); ctx.lineTo(tx + tw * 0.9, gy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      // Standard obstacle: era-tinted silhouette
      const eraFill   = hexToRgba(obj.color, 0.16);
      const eraStroke = obj.color;
      ctx.fillStyle   = eraFill;
      ctx.strokeStyle = eraStroke;
      ctx.lineWidth   = Math.max(1.5, 2.5 * pt.scale);
      ctx.shadowColor = obj.color; ctx.shadowBlur = 20;
      roundRect(tx, ty, tw, th, rad); ctx.fill();
      roundRect(tx, ty, tw, th, rad); ctx.stroke();

      // Per-era interior detail lines
      ctx.globalAlpha = 0.20; ctx.lineWidth = Math.max(0.8, 1.2 * pt.scale);
      if (obj.obstacleId === "block") {
        // Factory crate / data cube: grid lines
        for (let gl = 1; gl < 3; gl++) {
          ctx.beginPath(); ctx.moveTo(tx + tw*gl/3, ty); ctx.lineTo(tx + tw*gl/3, ty + th); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(tx, ty + th*0.45); ctx.lineTo(tx + tw, ty + th*0.45); ctx.stroke();
      } else if (obj.obstacleId === "pipe") {
        // Pipe: end caps + bolt circles
        ctx.beginPath(); ctx.arc(pt.x - tw*0.38, ty + th*0.5, th*0.26, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(pt.x + tw*0.38, ty + th*0.5, th*0.26, 0, Math.PI*2); ctx.stroke();
      } else if (obj.obstacleId === "fence" || obj.obstacleId === "cart") {
        // Fence/cart: horizontal rails
        for (let fl = 1; fl < 4; fl++) {
          ctx.beginPath(); ctx.moveTo(tx + 4*pt.scale, ty + th*fl/4); ctx.lineTo(tx + tw - 4*pt.scale, ty + th*fl/4); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Axis 4: Label chip (action hint) — sentence-case, no ALL-CAPS on chip
    if (obj.progress > 0.30) {
      ctx.globalCompositeOperation = "source-over"; ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(5,7,17,.84)"; ctx.strokeStyle = obj.color; ctx.lineWidth = 1.5;
      const lw2 = 74 * pt.scale; const lh2 = 24 * pt.scale;
      const chipY = ty - lh2 - 5 * pt.scale;
      roundRect(pt.x - lw2/2, chipY, lw2, lh2, 7 * pt.scale); ctx.fill();
      roundRect(pt.x - lw2/2, chipY, lw2, lh2, 7 * pt.scale); ctx.stroke();
      ctx.fillStyle = "#f7f4ec";
      ctx.font = `800 ${Math.max(9, 10.5 * pt.scale)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      // Axis 13: sentence-case label (not all-caps)
      const chipLabel = obj.label.charAt(0).toUpperCase() + obj.label.slice(1).toLowerCase();
      ctx.fillText(chipLabel, pt.x, chipY + lh2 / 2);
    }
    ctx.restore();
  }

  // ─── Player ────────────────────────────────────────────────────────────────
  // Axis 3: refined silhouette, idle bob, jump anticipation+recoil, slide dust,
  //         lane ghost trail, jetpack flame, hex shield bubble, magnet field
  let playerPrevLift = 0;     // for landing recoil detection
  let landingRecoil  = 0;     // countdown timer

  function drawPlayer() {
    const pt      = lanePoint(player.visualLane, 0.94);
    const lift    = jumpLift() * 145;
    const sliding = player.slideTime > 0;
    const x       = pt.x;

    // Landing recoil
    if (playerPrevLift > 8 && lift < 4 && !player.airborne) {
      landingRecoil = 0.18;
      // Camera bob on landing
      if (!reduceMotion) addParticles(x, 800, 10, gateColors[player.lane], 0.6);
    }
    playerPrevLift = lift;
    if (landingRecoil > 0) landingRecoil -= 0.016;

    // Run bob: idle animation
    const bobAmp   = sliding ? 2 : (player.airborne ? 1 : 8);
    const runBob   = Math.sin(state.elapsed * 16) * bobAmp;
    // Landing squish on recoil
    const recoilSq = landingRecoil > 0 ? Math.sin(landingRecoil * Math.PI / 0.18) * 10 : 0;
    const y        = 770 - lift + (sliding ? 26 : 0) + runBob + recoilSq;

    // Jump anticipation squat: right before first jump frame, compress briefly
    const squatScale = (player.jumpBuffer > 0.06 && !player.airborne) ? 0.90 : 1;
    const size  = sliding ? 118 : (154 * squatScale);
    const wscale = sliding ? 1.30 : (1 / squatScale); // wider when crouching
    const tilt  = (player.lane - player.visualLane) * 0.20 + Math.sin(state.elapsed * 11) * 0.022;
    const alpha = player.invulnerable > 0 ? 0.60 + Math.sin(state.elapsed * 30) * 0.24 : 1.0;

    ctx.save(); ctx.globalAlpha = alpha;

    // Ground shadow — bigger when close to ground
    const shadowScale = 1 - lift / 180;
    ctx.fillStyle = `rgba(0,0,0,${0.38 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(x, 808, (sliding ? 78 : 60) * shadowScale, (sliding ? 12 : 16) * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slide dust particles — Phase 5 lite: skip emitter
    if (sliding && !reduceMotion && !liteFx && Math.random() < 0.4) {
      state.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: 800 + Math.random() * 12,
        vx: (Math.random() - 0.5) * 60, vy: -18 - Math.random() * 30,
        radius: 2 + Math.random() * 3,
        color: "#9bacc8",
        life: 0.28 + Math.random() * 0.24, maxLife: 0.52
      });
    }

    // Jetpack: continuous flame particles + directionality
    if (player.jetpackTimer > 0) {
      ctx.save(); ctx.globalCompositeOperation = "screen";
      ctx.shadowColor = "#67f0a8"; ctx.shadowBlur = 32;
      const fFlicker = 0.85 + Math.sin(state.elapsed * 28) * 0.15;
      const fw = (26 + Math.sin(state.elapsed * 22) * 8) * fFlicker;
      // Dual nozzle flames
      for (const nx of [-20, 20]) {
        const fGrd = ctx.createLinearGradient(x + nx, y + size * 0.5, x + nx, y + size * 0.5 + 90);
        fGrd.addColorStop(0,   "rgba(103,240,168,.96)");
        fGrd.addColorStop(0.4, "rgba(245,196,81,.72)");
        fGrd.addColorStop(1,   "rgba(255,123,204,0)");
        ctx.fillStyle = fGrd;
        ctx.beginPath();
        ctx.ellipse(x + nx, y + size * 0.5 + 18, fw * 0.48, 50 + Math.sin(state.elapsed * 19 + nx) * 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Particle emitter from nozzles
      if (!reduceMotion && Math.random() < 0.5) {
        for (const nx of [-20, 20]) {
          state.particles.push({
            x: x + nx + (Math.random()-0.5)*8,
            y: y + size * 0.5 + 20 + Math.random() * 20,
            vx: nx * 0.3 + (Math.random()-0.5)*20, vy: 60 + Math.random()*80,
            radius: 2 + Math.random()*3,
            color: Math.random() > 0.5 ? "#67f0a8" : "#f5c451",
            life: 0.15 + Math.random()*0.25, maxLife: 0.4
          });
        }
      }
      ctx.restore();
    }

    // Boost flame trail
    if (player.boostTimer > 0) {
      ctx.save(); ctx.globalCompositeOperation = "screen";
      const bt   = player.boostTimer;
      const blen = 80 + bt * 16;
      ctx.strokeStyle = "rgba(245,196,81,.72)"; ctx.lineWidth = 10;
      ctx.shadowColor = "#f5c451"; ctx.shadowBlur = 30;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x - 75, y + 28); ctx.lineTo(x - 75 - blen, y + 68); ctx.stroke();
      ctx.strokeStyle = "rgba(117,236,255,.60)"; ctx.lineWidth = 5;
      ctx.shadowColor = "#75ecff"; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.moveTo(x - 58, y + 6); ctx.lineTo(x - 58 - blen * 0.75, y + 36); ctx.stroke();
      ctx.restore();
    }

    // Axis 3: Lane swap ghost trail (motion blur) — Phase 5 lite: skip
    if (player.laneChangeBlur > 0.02 && !reduceMotion && !liteFx) {
      ctx.save(); ctx.globalCompositeOperation = "screen";
      for (let i = 1; i <= 4; i++) {
        const dir   = player.lane - player.visualLane > 0 ? -1 : 1;
        const bx    = x + dir * i * 26;
        const bAlph = player.laneChangeBlur * (0.22 - i * 0.04);
        ctx.globalAlpha = Math.max(0, bAlph);
        drawPlayerSilhouette(bx, y, size, wscale, 0, sliding);
      }
      ctx.restore();
      ctx.globalAlpha = alpha;
    }

    // Main player — refined silhouette
    ctx.globalCompositeOperation = "screen";
    drawPlayerSilhouette(x, y, size, wscale, tilt, sliding);

    // Axis 3: Shield — hex bubble (NOT just ellipse)
    if (state.shields > 0) {
      const hexR    = 88;
      const hexPulse = 1 + Math.sin(state.elapsed * 4) * 0.03;
      const hexSides = 6;
      ctx.save(); ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = "rgba(117,236,255,.80)"; ctx.lineWidth = 2.5;
      ctx.shadowColor = "#75ecff"; ctx.shadowBlur = 24;
      ctx.fillStyle   = "rgba(117,236,255,.05)";
      ctx.beginPath();
      for (let h = 0; h < hexSides; h++) {
        const ang = (h / hexSides) * Math.PI * 2 - Math.PI / 6;
        const hx  = x + hexR * hexPulse * Math.cos(ang);
        const hy  = (y + 8) + hexR * 1.3 * hexPulse * Math.sin(ang);
        if (h === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Hex grid lines (subtle inner detail)
      ctx.lineWidth = 0.5; ctx.globalAlpha = 0.30;
      for (let h = 0; h < hexSides; h++) {
        const ang = (h / hexSides) * Math.PI * 2 - Math.PI / 6;
        const hx  = x + hexR * hexPulse * Math.cos(ang);
        const hy  = (y + 8) + hexR * 1.3 * hexPulse * Math.sin(ang);
        ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(hx, hy); ctx.stroke();
      }
      ctx.restore();
    }

    // Axis 3: Magnet — orbiting field rings
    if (player.magnetTimer > 0) {
      const magPhase = state.elapsed * 2.4;
      ctx.save(); ctx.globalCompositeOperation = "screen";
      // Two orbiting particle rings
      for (let ring = 0; ring < 2; ring++) {
        const ringR = 92 + ring * 22;
        const ringA = 0.28 + Math.sin(state.elapsed * 6 + ring) * 0.14;
        ctx.strokeStyle = `rgba(255,123,204,${ringA})`; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y + 6, ringR, ringR * 1.32, magPhase + ring * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        // Orbiting dots
        for (let d = 0; d < 3; d++) {
          const dang = magPhase + (d / 3) * Math.PI * 2 + ring * 0.8;
          const dx   = x + ringR * Math.cos(dang);
          const dy   = (y + 6) + ringR * 1.32 * Math.sin(dang);
          ctx.fillStyle = `rgba(255,123,204,${ringA * 2})`;
          ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // Axis 3: Refined running silhouette — proper humanoid shape
  function drawPlayerSilhouette(x, y, size, wscale = 1, tilt = 0, sliding = false) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    const era = ERAS[state.eraIndex];

    if (images.sprites) {
      // Use sprite sheet if available — era-tinted
      ctx.shadowColor = era.accent; ctx.shadowBlur = 18;
      for (let i = 3; i > 0; i--) {
        ctx.globalAlpha = 0.10 * i;
        drawSprite(0, -i * 20, i * 9, size * (1 - i * 0.04), 0.22);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      drawSprite(0, 0, 0, size, 1);
    } else {
      // Axis 3: Procedural running silhouette
      const era = ERAS[state.eraIndex];
      const bodyColor  = era.accent;
      const accentGlow = hexToRgba(bodyColor, 0.85);

      ctx.shadowColor = bodyColor; ctx.shadowBlur = 22;

      // Limb phase from elapsed time
      const runPhase = state.elapsed * 14;
      const legSwing = sliding ? 0 : Math.sin(runPhase) * 0.32;
      const armSwing = sliding ? 0 : Math.sin(runPhase + Math.PI) * 0.28;

      const hw  = size * 0.22 * wscale; // half-width
      const hs  = size * 0.5;            // half-height

      if (sliding) {
        // Slide: low horizontal capsule
        ctx.fillStyle = accentGlow;
        roundRect(-hw * 1.6, -hs * 0.4, hw * 3.2, hs * 0.8, hw * 0.35);
        ctx.fill();
        ctx.strokeStyle = bodyColor; ctx.lineWidth = 2.5;
        roundRect(-hw * 1.6, -hs * 0.4, hw * 3.2, hs * 0.8, hw * 0.35);
        ctx.stroke();
      } else {
        // Torso
        ctx.fillStyle = accentGlow;
        roundRect(-hw * 0.9, -hs * 0.60, hw * 1.8, hs * 0.80, hw * 0.35);
        ctx.fill();
        ctx.strokeStyle = bodyColor; ctx.lineWidth = 2;
        roundRect(-hw * 0.9, -hs * 0.60, hw * 1.8, hs * 0.80, hw * 0.35);
        ctx.stroke();

        // Head
        ctx.fillStyle = accentGlow;
        ctx.beginPath();
        ctx.ellipse(0, -hs * 0.78, hw * 0.62, hw * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = bodyColor; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, -hs * 0.78, hw * 0.62, hw * 0.72, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Legs
        ctx.strokeStyle = bodyColor; ctx.lineWidth = hw * 0.55;
        ctx.lineCap = "round";
        // Left leg
        ctx.save(); ctx.rotate(-legSwing);
        ctx.beginPath();
        ctx.moveTo(-hw * 0.28, hs * 0.20);
        ctx.quadraticCurveTo(-hw * 0.5, hs * 0.62, -hw * 0.22, hs * 0.85);
        ctx.stroke();
        ctx.restore();
        // Right leg
        ctx.save(); ctx.rotate(legSwing);
        ctx.beginPath();
        ctx.moveTo(hw * 0.28, hs * 0.20);
        ctx.quadraticCurveTo(hw * 0.5, hs * 0.62, hw * 0.22, hs * 0.85);
        ctx.stroke();
        ctx.restore();

        // Arms
        ctx.lineWidth = hw * 0.40;
        ctx.save(); ctx.rotate(armSwing);
        ctx.beginPath();
        ctx.moveTo(-hw * 0.68, -hs * 0.28);
        ctx.quadraticCurveTo(-hw * 1.05, hs * 0.05, -hw * 0.55, hs * 0.24);
        ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.rotate(-armSwing);
        ctx.beginPath();
        ctx.moveTo(hw * 0.68, -hs * 0.28);
        ctx.quadraticCurveTo(hw * 1.05, hs * 0.05, hw * 0.55, hs * 0.24);
        ctx.stroke();
        ctx.restore();
      }

      // Inner glow core
      ctx.shadowBlur = 0;
      const cg = ctx.createRadialGradient(0, -hs * 0.25, 0, 0, -hs * 0.25, hw * 1.2);
      cg.addColorStop(0,   hexToRgba(bodyColor, 0.38));
      cg.addColorStop(0.6, hexToRgba(bodyColor, 0.10));
      cg.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = cg; ctx.globalCompositeOperation = "screen";
      ctx.beginPath(); ctx.ellipse(0, -hs * 0.25, hw * 1.5, hs, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ─── Sprite (or fallback shape) ───────────────────────────────────────────
  const SPRITE_COLS = 4;
  const SPRITE_ROWS = 4;

  function drawSprite(index, x, y, size, alpha = 1) {
    if (!images.sprites) {
      // Fallback capsule (should rarely hit with new drawPlayerSilhouette)
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
    // Power-up rings — labels were never rendered to canvas; ring color carries identity.
    const rings = [
      { timer: player.boostTimer,   max: 5,  color: "#f5c451" },
      { timer: player.magnetTimer,  max: 8,  color: "#ff7bcc" },
      { timer: player.jetpackTimer, max: 8,  color: "#67f0a8" }
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

  // ─── Axis 8: Full-screen era transition sweep + Fraunces banner ──────────────
  function drawEraTransitionSweep() {
    if (eraSweepProgress < 0 || eraSweepProgress >= 1) return;
    const p = eraSweepProgress;
    // Diagonal wipe left-to-right
    const wipeX = lerp(-BASE_W * 0.15, BASE_W * 1.15, easeOut(p));
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const sg = ctx.createLinearGradient(wipeX - 140, 0, wipeX + 60, 0);
    sg.addColorStop(0,    "rgba(0,0,0,0)");
    sg.addColorStop(0.35, hexToRgba(eraSweepColor, 0.28));
    sg.addColorStop(0.65, hexToRgba(eraSweepColor, 0.18));
    sg.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.restore();

    // Era banner in Fraunces italic
    if (eraBannerAlpha > 0.02 && eraBannerText) {
      ctx.save();
      ctx.globalAlpha = clamp(eraBannerAlpha, 0, 1);
      ctx.globalCompositeOperation = "source-over";
      // Background pill
      const bw  = BASE_W * 0.68;
      const bh  = 64;
      const bx  = BASE_W / 2 - bw / 2;
      const by  = BASE_H / 2 - 42;
      ctx.fillStyle = "rgba(5,7,17,.82)";
      ctx.shadowColor = eraSweepColor; ctx.shadowBlur = 28;
      roundRect(bx, by, bw, bh, 16); ctx.fill();
      ctx.strokeStyle = hexToRgba(eraSweepColor, 0.65); ctx.lineWidth = 1.5;
      roundRect(bx, by, bw, bh, 16); ctx.stroke();
      ctx.shadowBlur = 0;
      // Text
      ctx.fillStyle   = "#f7f4ec";
      ctx.textAlign   = "center"; ctx.textBaseline = "middle";
      ctx.font = `italic 700 ${clamp(Math.floor(BASE_W * 0.026), 18, 30)}px Fraunces, Georgia, serif`;
      ctx.fillText(eraBannerText, BASE_W / 2, by + bh / 2);
      ctx.restore();
    }
  }

  // ─── Era label (in-game corner badge) ────────────────────────────────────────
  function drawEraLabel() {
    if (!state.running) return;
    const era   = ERAS[state.eraIndex];
    const alpha = Math.min(1, state.eraTransition * 3) * 0.86;
    ctx.save(); ctx.globalAlpha = alpha;
    // Pill background
    const lw = 138; const lh = 40; const lx = BASE_W - lw - 12; const ly = 10;
    ctx.fillStyle   = "rgba(5,7,17,.78)";
    ctx.strokeStyle = hexToRgba(era.color, 0.60); ctx.lineWidth = 1.5;
    ctx.shadowColor = era.accent; ctx.shadowBlur = 12;
    roundRect(lx, ly, lw, lh, 12); ctx.fill();
    roundRect(lx, ly, lw, lh, 12); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle   = hexToRgba(era.color, 0.95);
    ctx.font        = "700 11px Inter, system-ui, sans-serif";
    ctx.textAlign   = "center"; ctx.textBaseline = "middle";
    ctx.fillText(era.name.toUpperCase(), lx + lw / 2, ly + lh / 2 - 8);
    // Era key counter
    ctx.fillStyle = "#f5a623"; ctx.font = "700 10px JetBrains Mono, monospace";
    ctx.fillText(`Keys: ${state.eraKeys}/5`, lx + lw / 2, ly + lh / 2 + 7);
    ctx.restore();
  }

  // ─── Multiplier badge (canvas) ────────────────────────────────────────────────
  // Axis 6: pulses on advance, JetBrains Mono
  function drawMultiplierBadge() {
    if (!state.running || state.multiplier <= 1.05) return;
    const pulse = 1 + Math.sin(state.elapsed * 9.5) * 0.06;
    ctx.save();
    ctx.translate(BASE_W - 24, 74);
    ctx.scale(pulse, pulse);
    ctx.fillStyle   = "rgba(5,7,17,.86)";
    ctx.strokeStyle = "#f5c451"; ctx.lineWidth = 2;
    ctx.shadowColor = "#f5c451"; ctx.shadowBlur = 20;
    roundRect(-40, -19, 80, 38, 12); ctx.fill();
    roundRect(-40, -19, 80, 38, 12); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f5c451";
    ctx.font = `900 17px 'JetBrains Mono', monospace`;
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

    // Axis 1: Coin shop from title screen
    const shopTitleBtn = $("shopTitleBtn");
    const shopModal    = $("shopModal");
    const shopCloseBtn = $("shopCloseBtn");
    const shopGridModal = $("shopGridModal");
    if (shopTitleBtn && shopModal) {
      shopTitleBtn.addEventListener("click", () => {
        renderShopInto(shopGridModal);
        shopModal.classList.add("show");
      });
    }
    if (shopCloseBtn && shopModal) {
      shopCloseBtn.addEventListener("click", () => shopModal.classList.remove("show"));
    }

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
    // Axis 1: Title parallax animation
    if (!state.running || state.paused) drawTitleParallax(dt);
    requestAnimationFrame(loop);
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    bindEvents();
    resizeCanvas();
    // ── MrMacsProfile: boot hook ──────────────────────────────────────────────
    if (window.MrMacsProfile) {
      window.MrMacsProfile.recordPlay({
        id: "timeline-runner", title: "Timeline Runner",
        course: "All Courses", file: "games/timeline-runner/index.html"
      });
      const ps = window.MrMacsProfile.getSettings();
      if (ps && typeof ps.sound === "boolean") {
        state.sound = ps.sound;
        els.soundBtn.textContent = state.sound ? "Sound On" : "Sound Off";
      }
      if (state.sound) audio.ensure();
    }
    // ─────────────────────────────────────────────────────────────────────────
    requestAnimationFrame(loop);
    // Setup-screen extras (resume card + top-5 leaderboard)
    try { initSetupExtras(); } catch (e) {}
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

  // ─── Setup-screen extras: resume card + top-5 leaderboard ────────────────
  function _tlrFmtAgo(ts) {
    const ms = Date.now() - (Number(ts) || 0);
    if (ms < 60000) return "just now";
    const m = Math.floor(ms / 60000);
    if (m < 60) return m + " min ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + " hr ago";
    const d = Math.floor(h / 24);
    if (d === 1) return "yesterday";
    return d + " days ago";
  }
  function _tlrSafe(v) {
    return String(v == null ? "" : v).replace(/[<>&"]/g, c =>
      c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;");
  }
  function initSetupExtras() {
    _tlrRenderResumeCard();
    _tlrRenderLeaderboardPanel();
  }
  function _tlrRenderResumeCard() {
    const card = document.getElementById("resumeCard");
    if (!card) return;
    if (!window.MrMacsSessions) { card.hidden = true; return; }
    let prev = null;
    try { prev = window.MrMacsSessions.load("timeline-runner"); } catch (e) {}
    if (!prev || !prev.state || !prev.ts) { card.hidden = true; return; }
    if (Date.now() - prev.ts > 24 * 3600 * 1000) { card.hidden = true; return; }
    const s = prev.state || {};
    const distLabel = formatKm(s.distance || 0);
    const eraIdx = Math.max(0, Math.min(ERAS.length - 1, Number(s.era) || 0));
    const eraName = (ERAS[eraIdx] && ERAS[eraIdx].name) || "Industrial";
    card.hidden = false;
    card.innerHTML =
      '<div class="resume-card-head">' +
        '<span class="resume-card-title">Resume your run?</span>' +
        '<span class="resume-card-time">' + _tlrSafe(_tlrFmtAgo(prev.ts)) + '</span>' +
      '</div>' +
      '<div class="resume-card-meta">Distance ' + _tlrSafe(distLabel) + ' · era ' + _tlrSafe(eraName) + '</div>' +
      '<div class="resume-card-actions">' +
        '<button type="button" class="resume-btn resume-btn--primary" id="resumeRunBtn">Resume</button>' +
        '<button type="button" class="resume-btn" id="resumeFreshBtn">Start fresh</button>' +
      '</div>';
    const resumeBtn = card.querySelector("#resumeRunBtn");
    const freshBtn  = card.querySelector("#resumeFreshBtn");
    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => {
        // Endless runner — runs reset on hit, so start a fresh run with toast
        // acknowledgement of the prior best.
        try {
          if (window.MrMacsToast) window.MrMacsToast.push({
            icon: "⏯", title: "Resuming · last run " + distLabel,
            sub: "Reached " + eraName + " era", tone: "info", ms: 3500
          });
        } catch (e) {}
        const startBtn = document.getElementById("startBtn");
        if (startBtn) startBtn.click();
      });
    }
    if (freshBtn) {
      freshBtn.addEventListener("click", () => {
        try { window.MrMacsSessions.clear("timeline-runner"); } catch (e) {}
        card.hidden = true;
      });
    }
  }
  function _tlrRenderLeaderboardPanel() {
    const panel = document.getElementById("leaderboardPanel");
    if (!panel) return;
    if (!window.MrMacsLeaderboards) { panel.hidden = true; return; }
    let rows = [];
    try { rows = window.MrMacsLeaderboards.top("timeline-runner", 5) || []; } catch (e) { rows = []; }
    panel.hidden = false;
    if (!rows.length) {
      panel.innerHTML =
        '<div class="lb-head">Top scores</div>' +
        '<div class="lb-empty">No high scores yet — set one!</div>';
      return;
    }
    panel.innerHTML =
      '<div class="lb-head">Top scores</div>' +
      '<ol class="lb-list">' +
      rows.map((r, i) =>
        '<li class="lb-row">' +
          '<span class="lb-rank">#' + (i + 1) + '</span>' +
          '<span class="lb-avatar">' + _tlrSafe(r.avatar || "") + '</span>' +
          '<span class="lb-name">' + _tlrSafe(r.name || "Trainer") + '</span>' +
          '<span class="lb-score">' + Math.round(r.score || 0).toLocaleString() + '</span>' +
          '<span class="lb-ago">' + _tlrSafe(_tlrFmtAgo(r.ts || 0)) + '</span>' +
        '</li>'
      ).join("") +
      '</ol>';
  }

  init();

  try {
    if (window.MrMacsA11yQuickToggle) {
      var hudControls = document.querySelector(".hud-controls") || document.querySelector(".top-hud");
      if (hudControls) MrMacsA11yQuickToggle.mount(hudControls);
    }
  } catch (e) {}

  })();
