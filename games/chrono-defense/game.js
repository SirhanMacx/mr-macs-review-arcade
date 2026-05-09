(() => {
  "use strict";

  const BASE_W = 1600;
  const BASE_H = 900;
  const STORAGE_KEY = "mr-macs-chrono-defense-v1";
  const $ = (id) => document.getElementById(id);
  const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;

  // ─── Element refs ────────────────────────────────────────────────────────────
  const els = {
    canvas: $("arena"),
    wave: $("wave"), lives: $("lives"), insight: $("insight"), score: $("score"),
    hpFill: $("hpFill"),
    waveProgress: $("waveProgress"), waveProgressFill: $("waveProgressFill"),
    bankCount: $("bankCount"), courseFilter: $("courseFilter"), setFilter: $("setFilter"),
    towerList: $("towerList"), powerList: $("powerList"),
    selectedTowerName: $("selectedTowerName"),
    upgradeTitle: $("upgradeTitle"), upgradePreview: $("upgradePreview"),
    upgradeText: $("upgradeText"), upgradeBtn: $("upgradeBtn"), sellBtn: $("sellBtn"),
    branch0Btn: $("branch0Btn"), branch1Btn: $("branch1Btn"),
    startWave: $("startWave"), pauseBtn: $("pauseBtn"),
    soundBtn: $("soundBtn"), resetBtn: $("resetBtn"),
    speedBtn: $("speedBtn"), autoBtn: $("autoBtn"),
    libraryBtn: $("libraryBtn"), libraryPanel: $("libraryPanel"),
    libraryStatus: $("libraryStatus"), fullscreenBtn: $("fullscreenBtn"),
    missionTitle: $("missionTitle"), missionText: $("missionText"),
    questionConsole: $("questionConsole"), questionMeta: $("questionMeta"),
    questionStreak: $("questionStreak"), questionPrompt: $("questionPrompt"),
    stimulusStrip: $("stimulusStrip"), choices: $("choices"),
    typedForm: $("typedForm"), typedAnswer: $("typedAnswer"),
    toggleQuestion: $("toggleQuestion"), reactorDock: $("reactorDock"),
    feedback: $("feedback"), waveBanner: $("waveBanner"),
    powerCharge: $("powerCharge"),
    mapSelect: $("mapSelect"), mapLabel: $("mapLabel")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Phase 5 — perf-lite: prefer arcade-perf detection, fall back to URL param
  const liteFx = (window.MrMacsArcadePerf && MrMacsArcadePerf.isLite())
    || new URLSearchParams(location.search).get("fx") !== "full";
  document.documentElement.classList.toggle("perf-lite", liteFx);

  // ─── Persistence ─────────────────────────────────────────────────────────────
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  }
  function writeSave(patch) {
    try {
      const saved = loadSave();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign(saved, patch)));
    } catch {}
  }

  // ─── Maps ────────────────────────────────────────────────────────────────────
  const MAPS = [
    {
      id: "industrial",
      name: "Industrial Era",
      era: "1870–1914",
      unlocked: true,
      color: "#ffd76b",
      bgTint: "rgba(80,40,0,.18)",
      path: [
        { x: 80,  y: 200 }, { x: 280, y: 200 }, { x: 380, y: 320 },
        { x: 500, y: 420 }, { x: 650, y: 380 }, { x: 780, y: 280 },
        { x: 950, y: 260 }, { x: 1080, y: 380 }, { x: 1150, y: 520 },
        { x: 1050, y: 650 }, { x: 880,  y: 700 }, { x: 720,  y: 660 },
        { x: 580,  y: 720 }, { x: 450,  y: 800 }, { x: 300,  y: 780 },
        { x: 150,  y: 700 }, { x: 100,  y: 580 }, { x: 200,  y: 480 },
        { x: 350,  y: 440 }, { x: 480,  y: 540 }, { x: 620,  y: 560 },
        { x: 760,  y: 500 }, { x: 900,  y: 520 }, { x: 1020, y: 440 },
        { x: 1180, y: 400 }, { x: 1320, y: 360 }, { x: 1450, y: 300 },
        { x: 1540, y: 200 }
      ]
    },
    {
      id: "coldwar",
      name: "Cold War",
      era: "1947–1991",
      unlocked: false,
      color: "#84f3ff",
      bgTint: "rgba(0,40,80,.22)",
      path: [
        { x: 80,  y: 450 }, { x: 220, y: 300 }, { x: 380, y: 200 },
        { x: 560, y: 180 }, { x: 700, y: 280 }, { x: 820, y: 400 },
        { x: 960, y: 440 }, { x: 1100, y: 340 }, { x: 1240, y: 220 },
        { x: 1380, y: 260 }, { x: 1480, y: 380 }, { x: 1520, y: 520 },
        { x: 1440, y: 650 }, { x: 1280, y: 720 }, { x: 1100, y: 700 },
        { x: 940,  y: 760 }, { x: 780,  y: 720 }, { x: 640,  y: 620 },
        { x: 520,  y: 560 }, { x: 380,  y: 580 }, { x: 240,  y: 660 },
        { x: 120,  y: 760 }, { x: 80,   y: 860 }
      ]
    },
    {
      id: "modern",
      name: "Modern Era",
      era: "1991–2010",
      unlocked: false,
      color: "#66f2ac",
      bgTint: "rgba(0,60,20,.18)",
      path: [
        { x: 800, y: 50  }, { x: 900, y: 160 }, { x: 1000, y: 280 },
        { x: 1100, y: 180 }, { x: 1250, y: 120 }, { x: 1400, y: 200 },
        { x: 1520, y: 320 }, { x: 1480, y: 460 }, { x: 1360, y: 560 },
        { x: 1200, y: 600 }, { x: 1060, y: 520 }, { x: 920,  y: 440 },
        { x: 780,  y: 520 }, { x: 640,  y: 620 }, { x: 500,  y: 700 },
        { x: 360,  y: 720 }, { x: 220,  y: 660 }, { x: 100,  y: 560 },
        { x: 60,   y: 420 }, { x: 120,  y: 300 }, { x: 260,  y: 220 },
        { x: 420,  y: 180 }, { x: 580,  y: 220 }, { x: 700,  y: 320 },
        { x: 780,  y: 450 }, { x: 860,  y: 580 }, { x: 960,  y: 680 },
        { x: 1100, y: 740 }, { x: 1280, y: 780 }, { x: 1500, y: 820 }
      ]
    },
    {
      id: "future",
      name: "Future Arc",
      era: "2010–∞",
      unlocked: false,
      color: "#c981ff",
      bgTint: "rgba(40,0,80,.22)",
      path: [
        { x: 80,  y: 80  }, { x: 200, y: 180 }, { x: 360, y: 120 },
        { x: 520, y: 200 }, { x: 660, y: 300 }, { x: 800, y: 200 },
        { x: 960, y: 140 }, { x: 1120, y: 240 }, { x: 1280, y: 320 },
        { x: 1440, y: 240 }, { x: 1520, y: 380 }, { x: 1440, y: 500 },
        { x: 1300, y: 580 }, { x: 1140, y: 520 }, { x: 980,  y: 440 },
        { x: 820,  y: 520 }, { x: 660,  y: 600 }, { x: 500,  y: 680 },
        { x: 340,  y: 760 }, { x: 200,  y: 820 }, { x: 80,   y: 820 }
      ]
    }
  ];

  // ─── Tower archetypes ─────────────────────────────────────────────────────────
  const TOWER_TYPES = [
    {
      id: "sniper",
      name: "Chrono Sniper",
      role: "Long range · single target · high damage",
      archetype: "sniper",
      cost: 130,
      color: "#ffd76b",
      damage: 90, range: 350, rate: 0.7, splash: 0,
      upgrades: ["Rifled Barrel", "Armor-Piercing Round", { a: "Temporal Lock (stun)", b: "Headshot Protocol (+200% dmg)" }],
      upgradeMult: [1, 1.7, 2.8],
      rangeMult: [1, 1.15, 1.3],
      rateMult: [1, 1.1, 1.2],
      icon: "target"
    },
    {
      id: "cannon",
      name: "Forge Cannon",
      role: "Medium range · splash AOE · heavy",
      archetype: "cannon",
      cost: 175,
      color: "#ff8d4d",
      damage: 55, range: 220, rate: 0.55, splash: 90,
      upgrades: ["Extended Barrel", "Cluster Shell", { a: "Mega Mortar (+AOE)", b: "Rapid Fire (-reload)" }],
      upgradeMult: [1, 1.6, 2.5],
      rangeMult: [1, 1.1, 1.2],
      rateMult: [1, 1.15, 1.35],
      icon: "flame"
    },
    {
      id: "slow",
      name: "Cryo Obelisk",
      role: "Slows enemies · no direct damage",
      archetype: "slow",
      cost: 110,
      color: "#84f3ff",
      damage: 10, range: 190, rate: 0.9, splash: 0, slowFactor: 0.45,
      upgrades: ["Deep Freeze", "Cryo Field", { a: "Arctic Storm (AOE slow)", b: "Ice Shard (adds damage)" }],
      upgradeMult: [1, 1.2, 1.5],
      rangeMult: [1, 1.15, 1.35],
      rateMult: [1, 1.1, 1.2],
      icon: "diamond"
    },
    {
      id: "dot",
      name: "Plague Press",
      role: "Poison DOT · continuous damage",
      archetype: "dot",
      cost: 145,
      color: "#66f2ac",
      damage: 18, range: 195, rate: 1.2, splash: 0, dotDuration: 3.5,
      upgrades: ["Virulent Spores", "Pandemic Cloud", { a: "Bio Storm (AOE DOT)", b: "Lethal Toxin (+3× DOT dmg)" }],
      upgradeMult: [1, 1.5, 2.4],
      rangeMult: [1, 1.1, 1.2],
      rateMult: [1, 1.15, 1.3],
      icon: "atom"
    },
    {
      id: "boost",
      name: "Archive Relay",
      role: "No damage · boosts nearby towers",
      archetype: "boost",
      cost: 160,
      color: "#c981ff",
      damage: 0, range: 180, rate: 0, boostDamage: 0.25, boostRange: 0.15,
      upgrades: ["Enhanced Aura", "Overcharge Field", { a: "Grand Relay (+50% aura)", b: "Fire Network (chain boost)" }],
      upgradeMult: [1, 1, 1],
      rangeMult: [1, 1.2, 1.4],
      rateMult: [1, 1, 1],
      icon: "bolt"
    }
  ];

  // ─── Enemy archetypes ─────────────────────────────────────────────────────────
  const ENEMY_TYPES = [
    {
      id: "fast",
      name: "Swift Anachronism",
      hp: 55, speed: 130, reward: 8, damage: 1,
      color: "#67efff", size: 32,
      resistSlow: 0, resistDot: 0,
      stealth: false, healer: false, splitter: false, boss: false
    },
    {
      id: "tank",
      name: "Iron Revision",
      hp: 280, speed: 55, reward: 22, damage: 2,
      color: "#ff8d4d", size: 52,
      resistSlow: 0, resistDot: 0.3,
      stealth: false, healer: false, splitter: false, boss: false
    },
    {
      id: "stealth",
      name: "Shadow Falsehood",
      hp: 95, speed: 100, reward: 18, damage: 1,
      color: "#c981ff", size: 36,
      resistSlow: 0, resistDot: 0,
      stealth: true, healer: false, splitter: false, boss: false
    },
    {
      id: "healer",
      name: "Revisionist Herald",
      hp: 140, speed: 70, reward: 20, damage: 1,
      color: "#66f2ac", size: 42,
      resistSlow: 0, resistDot: 0,
      stealth: false, healer: true, splitter: false, boss: false,
      healRate: 12, healRadius: 120
    },
    {
      id: "splitter",
      name: "Myth Cluster",
      hp: 200, speed: 75, reward: 16, damage: 1,
      color: "#ffd76b", size: 46,
      resistSlow: 0, resistDot: 0,
      stealth: false, healer: false, splitter: true, boss: false,
      splitCount: 3
    },
    {
      id: "boss",
      name: "Final Exam Boss",
      hp: 1200, speed: 45, reward: 120, damage: 5,
      color: "#ff6479", size: 80,
      resistSlow: 0.4, resistDot: 0.2,
      stealth: false, healer: false, splitter: false, boss: true,
      ability: "rampage" // doubles speed at 50% hp
    }
  ];

  // ─── Special abilities ────────────────────────────────────────────────────────
  // Note: `icon` may be either a Unicode dingbat or an SVG icon name resolved
  // via window.MrMacsIcons at render time. See renderAbilities().
  const ABILITIES = [
    {
      id: "timestop",
      name: "Time Stop",
      desc: "Freeze all enemies for 5 sec",
      cost: 0, cooldown: 45, duration: 5,
      color: "#84f3ff", icon: "⏸", iconKind: "text"
    },
    {
      id: "erastorm",
      name: "Era Storm",
      desc: "Industrial Smog: heavy AOE damage",
      cost: 0, cooldown: 60, duration: 0,
      color: "#ff8d4d", icon: "bolt", iconKind: "svg"
    },
    {
      id: "reinforce",
      name: "Reinforcements",
      desc: "Place 1-2 free random towers",
      cost: 0, cooldown: 50, duration: 0,
      color: "#66f2ac", icon: "shield", iconKind: "svg"
    }
  ];

  // ─── Wave composition per map ─────────────────────────────────────────────────
  function buildWaveComposition(wave, mapId) {
    const types = [];
    const count = Math.min(8 + Math.floor(wave * 1.5), 50);
    const bossWave = wave % 10 === 0;
    const midBossWave = wave % 5 === 0 && !bossWave;

    for (let i = 0; i < count; i++) {
      let roll = Math.random();
      if (wave < 3)       types.push(roll < 0.8 ? "fast" : "tank");
      else if (wave < 7)  types.push(roll < 0.5 ? "fast" : roll < 0.8 ? "tank" : "stealth");
      else if (wave < 12) types.push(roll < 0.35 ? "fast" : roll < 0.6 ? "tank" : roll < 0.8 ? "stealth" : "splitter");
      else                types.push(roll < 0.25 ? "fast" : roll < 0.45 ? "tank" : roll < 0.6 ? "stealth" : roll < 0.75 ? "healer" : "splitter");
    }
    if (midBossWave) types.push("boss");
    if (bossWave)   { types.push("boss"); types.push("boss"); }
    return types;
  }

  // ─── Audio ────────────────────────────────────────────────────────────────────
  class AudioBus {
    constructor() { this.ctx = null; }
    ensure() {
      if (!state.sound) return null;
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }
    _play(freq, dur, type, vol, attack = 0.01, decay = 0) {
      const ac = this.ensure(); if (!ac) return;
      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = type; osc.frequency.value = freq;
      amp.gain.setValueAtTime(0, ac.currentTime);
      amp.gain.linearRampToValueAtTime(vol, ac.currentTime + attack);
      if (decay) amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + attack + decay);
      else        amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      osc.connect(amp).connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + dur + 0.02);
    }
    // per-archetype tower fire
    sniperFire()  { this._play(1200, 0.05, "square", 0.03); this._play(600, 0.07, "sawtooth", 0.015); }
    cannonFire()  { this._play(80, 0.18, "sawtooth", 0.06, 0.005, 0.17); }
    slowFire()    { this._play(520, 0.12, "sine", 0.025); this._play(780, 0.1, "sine", 0.015); }
    dotFire()     { this._play(300, 0.09, "sawtooth", 0.02); }
    boostPulse()  { this._play(660, 0.14, "triangle", 0.02); this._play(880, 0.1, "triangle", 0.015); }
    hit()         { this._play(280 + Math.random() * 120, 0.04, "triangle", 0.02); }
    pop()         { this._play(380 + Math.random() * 200, 0.06, "square", 0.025); }
    correct()     { this._play(740, 0.08, "triangle", 0.04); setTimeout(() => this._play(1110, 0.1, "triangle", 0.035), 70); }
    wrong()       { this._play(180, 0.16, "sawtooth", 0.035); }
    waveStart()   {
      const ac = this.ensure(); if (!ac) return;
      [260, 330, 520].forEach((f, i) => setTimeout(() => this._play(f, 0.14, "sine", 0.04), i * 90));
    }
    bossRoar() {
      this._play(60, 0.5, "sawtooth", 0.08, 0.02, 0.45);
      this._play(90, 0.4, "square", 0.04, 0.01, 0.38);
    }
    abilityStinger() {
      [520, 660, 880, 1040].forEach((f, i) => setTimeout(() => this._play(f, 0.1, "triangle", 0.035), i * 55));
    }
    mute(on) { this.ctx && (on ? this.ctx.resume() : this.ctx.suspend()); }
  }
  const audio = new AudioBus();

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const fmt  = (v) => Math.floor(v).toLocaleString();
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const dist  = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const uid   = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return {
      x: 0.5 * ((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
      y: 0.5 * ((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
    };
  }

  function buildRoute(rawPoints, stepsPerSeg = 10) {
    const route = [];
    for (let i = 0; i < rawPoints.length - 1; i++) {
      const p0 = rawPoints[Math.max(0, i-1)];
      const p1 = rawPoints[i];
      const p2 = rawPoints[i+1];
      const p3 = rawPoints[Math.min(rawPoints.length-1, i+2)];
      for (let s = 0; s < stepsPerSeg; s++) route.push(catmullRom(p0, p1, p2, p3, s / stepsPerSeg));
    }
    route.push(rawPoints[rawPoints.length - 1]);
    return route;
  }

  function buildSegments(route) {
    let totalLen = 0;
    const segs = [];
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i], b = route[i+1];
      const len = dist(a, b);
      segs.push({ a, b, len, start: totalLen });
      totalLen += len;
    }
    return { segs, totalLen };
  }

  function pointAt(segs, totalLen, d) {
    const clamped = clamp(d, 0, totalLen);
    const seg = segs.find(s => clamped >= s.start && clamped <= s.start + s.len) || segs[segs.length - 1];
    const t = seg.len ? (clamped - seg.start) / seg.len : 0;
    return { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
  }

  function distanceToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx*dx + dy*dy || 1;
    const t = clamp(((p.x-a.x)*dx + (p.y-a.y)*dy) / lenSq, 0, 1);
    return Math.hypot(p.x - (a.x + dx*t), p.y - (a.y + dy*t));
  }

  // ─── State ────────────────────────────────────────────────────────────────────
  const save = loadSave();
  const state = {
    // question bank
    bank: null, filtered: [], queue: [],
    // map
    currentMap: 0,
    route: [], segs: [], totalLen: 0,
    // game objects
    enemies: [], towers: [], projectiles: [], particles: [], texts: [],
    spawnQueue: [], spawnTimer: 0,
    // hud
    wave: 0, maxWave: 30,
    lives: 20, maxLives: 20,
    insight: 600, score: 0,
    // game flow
    running: false, paused: false, gameOver: false,
    betweenWaves: true, autoStart: false,
    speed: 1,
    sound: true,
    // abilities
    abilities: ABILITIES.map(a => ({ ...a, lastUsed: -999 })),
    abilityActive: null,    // { id, until }
    // question
    currentQuestion: null, correct: 0, answered: 0, streak: 0,
    questionCooldown: 0,   // time before next question popup in combat
    pendingEffect: null,   // { type: "crit"|"voucher"|"slowtime", value }
    // fx
    shake: 0, reactorFlash: 0,
    freezeUntil: 0,
    // loop
    last: 0, frameStamp: 0, elapsed: 0,
    // selection
    selectedBuild: "sniper",
    selectedTower: null,
    hover: null,
    // question UI
    questionCollapsed: false,
    // persistence
    mapsUnlocked: save.mapsUnlocked || [true, false, false, false],
    bestWave: save.bestWave || [0, 0, 0, 0],
    totalShards: save.totalShards || 0,
    // MrMacsProfile: track base damage this run for td-perfect-base achievement
    baseDamageThisRun: 0
  };

  // Sync map unlock from save
  MAPS.forEach((m, i) => m.unlocked = state.mapsUnlocked[i] || i === 0);

  // ─── Question engine (unchanged from scaffold) ────────────────────────────────
  function normalize(v) {
    return String(v||"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9 ]+/g," ").replace(/\b(the|a|an)\b/g," ").replace(/\s+/g," ").trim();
  }
  function compactKey(v) { return normalize(v).replace(/\s+/g,""); }
  const stopWords = new Set(["and","or","of","in","to","for","with","on","by","from","as","at","is","are","was","were"]);
  function sigTokens(v) { return normalize(v).split(" ").filter(t => t.length > 1 && !stopWords.has(t)); }
  function initials(v) { return normalize(v).split(" ").filter(t => t && !stopWords.has(t)).map(t => t[0]).join(""); }
  function editDist(a, b) {
    if (a === b) return 0; if (!a) return b.length; if (!b) return a.length;
    const prev = Array.from({length:b.length+1}, (_,i) => i), curr = Array(b.length+1).fill(0);
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const c = a[i-1]===b[j-1]?0:1;
        curr[j] = Math.min(curr[j-1]+1, prev[j]+1, prev[j-1]+c);
      }
      for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
  }
  function typoClose(a, b) {
    const L = compactKey(a), R = compactKey(b);
    if (!L||!R) return false; if (L===R) return true;
    const n = Math.max(L.length,R.length);
    return editDist(L,R) <= (n<=5?1:n<=10?2:Math.max(2,Math.floor(n*.16)));
  }
  function tokenMatch(r, e) {
    const rt = sigTokens(r), et = sigTokens(e);
    if (!rt.length||!et.length) return false;
    if (rt.length===1&&rt[0].length>=5) return et.some(t=>typoClose(rt[0],t));
    const me = et.filter(t=>rt.some(g=>typoClose(g,t))).length;
    const mr = rt.filter(g=>et.some(t=>typoClose(g,t))).length;
    if (et.length<=3) return me===et.length&&mr===rt.length;
    return me/et.length>=.7&&mr/rt.length>=.8;
  }
  function answerMatches(raw, accepted) {
    const ans = normalize(raw); if (!ans) return false;
    return accepted.some(item => {
      if (!item) return false;
      const ik = normalize(item), ac2 = compactKey(ans), ic2 = compactKey(ik);
      if (ans===ik||(ic2.length>1&&ac2===ic2)) return true;
      if ((ik.length>5&&ans.includes(ik))||(ans.length>5&&ik.includes(ans))) return true;
      if (initials(ik).length>=2&&ac2===initials(ik)) return true;
      return typoClose(ans,ik)||tokenMatch(ans,ik);
    });
  }
  function checkAnswer(q, raw) {
    if (q.type==="mcq") return String(raw)===String(q.correct);
    return answerMatches(raw, [q.answer,...(q.aliases||[])].map(normalize).filter(Boolean));
  }
  function displayPrompt(q) { return SourceBank?.displayPrompt ? SourceBank.displayPrompt(q) : String((q&&(q.prompt||q.stem))||"").trim(); }
  function displaySource(q) { return SourceBank?.displaySource ? SourceBank.displaySource(q) : String((q&&(q.source||q.category||q.set))||"").trim(); }
  const srcRe = /(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\s+|based\s+on\s+this\s+|based\s+on\s+the\s+)/i;
  function stimulusImages(q) {
    if (SourceBank) return SourceBank.stimulusImages(q);
    if (!q) return [];
    const list = Array.isArray(q.stimulusImages) ? q.stimulusImages : [];
    if (!list.length) return [];
    if (q.stimulusRequired===true) return list.filter(i=>i&&i.src);
    if (q.stimulusRequired===false) return [];
    return srcRe.test(String(q.prompt||q.stem||"")) ? list.filter(i=>i&&i.src) : [];
  }
  function isPlayable(q) {
    if (!q||!q.prompt||!q.answer) return false;
    if (SourceBank&&!SourceBank.playableSharedPrompt(q)) return false;
    if (SourceBank&&SourceBank.sourceBased(q)) {
      if (!stimulusImages(q).length) return false;
      if (q.type==="mcq") return SourceBank.usableRegentsQuestion(q);
      return true;
    }
    return true;
  }

  // ─── Map building ─────────────────────────────────────────────────────────────
  function activateMap(idx) {
    const map = MAPS[idx];
    state.currentMap = idx;
    const route = buildRoute(map.path, 12);
    const { segs, totalLen } = buildSegments(route);
    state.route = route;
    state.segs = segs;
    state.totalLen = totalLen;
    if (els.mapLabel) els.mapLabel.textContent = `${map.name} · ${map.era}`;
  }

  // ─── Placement validation ─────────────────────────────────────────────────────
  const ROAD_CLEAR = 75;
  const TOWER_CLEAR = 88;

  function distanceToPath(p) {
    let best = Infinity;
    for (const seg of state.segs) best = Math.min(best, distanceToSegment(p, seg.a, seg.b));
    return best;
  }

  function placementStatus(pos) {
    if (!pos) return { ok: false, reason: "Choose Open Ground" };
    if (pos.x < 55 || pos.x > BASE_W - 55 || pos.y < 65 || pos.y > BASE_H - 65)
      return { ok: false, reason: "Too Close To Edge" };
    if (distanceToPath(pos) < ROAD_CLEAR)
      return { ok: false, reason: "On The Road" };
    if (state.towers.some(t => dist(t, pos) < TOWER_CLEAR))
      return { ok: false, reason: "Too Close To Tower" };
    return { ok: true };
  }

  // ─── Tower helpers ────────────────────────────────────────────────────────────
  function towerStats(tower) {
    const type = tower.type;
    const tier = tower.level - 1;
    const branch = tower.branch || null;
    let dmg = type.damage * type.upgradeMult[tier];
    let rng = type.range * type.rangeMult[tier];
    let rte = (type.rate || 0) * type.rateMult[tier];
    let splash = type.splash || 0;
    if (branch === "a" && type.id === "sniper") { dmg *= 1.5; rte *= 0.85; }
    if (branch === "b" && type.id === "sniper") { dmg *= 3.0; rte *= 0.6;  }
    if (branch === "a" && type.id === "cannon") { splash *= 1.5; }
    if (branch === "b" && type.id === "cannon") { rte *= 1.8; splash *= 0.8; }
    if (branch === "a" && type.id === "slow")   { splash = 120; }
    if (branch === "b" && type.id === "slow")   { dmg *= 5; }
    if (branch === "a" && type.id === "dot")    { splash = 90; }
    if (branch === "b" && type.id === "dot")    { dmg *= 3; }
    if (branch === "a" && type.id === "boost")  { rng *= 1.5; }
    if (branch === "b" && type.id === "boost")  { /* chain handled in fire */ }
    // apply wave scaling
    dmg += state.wave * 0.4;
    // apply active boost auras
    const boosted = state.towers.filter(t => t.type.archetype === "boost" && t !== tower && dist(t, tower) < t.type.range * t.type.rangeMult[t.level - 1]);
    boosted.forEach(b => {
      const bd = b.type.boostDamage * (1 + (b.level - 1) * 0.3);
      const br = b.type.boostRange  * (1 + (b.level - 1) * 0.2);
      dmg *= (1 + bd);
      rng *= (1 + br);
    });
    // question crit
    if (tower.crit > 0) { dmg *= 2.2; }
    return { dmg, rng, rte, splash };
  }

  function upgradeCost(tower) {
    if (tower.level >= 3) return Infinity;
    return Math.round(tower.type.cost * (0.9 + tower.level * 0.75) + state.wave * 8);
  }

  function sellValue(tower) {
    let spent = tower.type.cost;
    for (let i = 1; i < tower.level; i++) spent += Math.round(tower.type.cost * (0.9 + i * 0.75));
    return Math.round(spent * 0.70);
  }

  // ─── Spawning ─────────────────────────────────────────────────────────────────
  function spawnEnemy(typeId) {
    const base = ENEMY_TYPES.find(e => e.id === typeId) || ENEMY_TYPES[0];
    const scale = 1 + state.wave * 0.18 + Math.max(0, state.wave - 10) * 0.04;
    const maxHp = Math.round(base.hp * scale * (base.boss ? 1.4 : 1));
    const startDist = 30 + Math.random() * 40;
    const pt = pointAt(state.segs, state.totalLen, startDist);
    state.enemies.push({
      id: uid(),
      type: base,
      name: base.name,
      maxHp, hp: maxHp,
      speed: base.speed * (1 + Math.min(0.5, state.wave * 0.012)),
      reward: Math.round(base.reward * (1 + state.wave * 0.04)),
      damage: base.damage,
      boss: base.boss, stealth: base.stealth, healer: base.healer,
      splitter: base.splitter, splitCount: base.splitCount || 0,
      color: base.color, size: base.size,
      dist: startDist,
      x: pt.x, y: pt.y,
      wobble: Math.random() * Math.PI * 2,
      slowUntil: 0, stunUntil: 0,
      revealed: !base.stealth, // stealth enemies start hidden
      dotEffects: [],            // { dmg, until }
      rampaged: false,
      dead: false, leaked: false
    });
  }

  // ─── Enemy update ─────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    const frozen = state.freezeUntil > state.elapsed;
    for (const e of state.enemies) {
      if (e.dead || e.leaked) continue;

      // DOT tick
      e.dotEffects = e.dotEffects.filter(d => d.until > state.elapsed);
      for (const d of e.dotEffects) {
        const tickDmg = d.dmg * dt;
        if (tickDmg > 0) damageEnemy(e, tickDmg, null, true);
      }

      if (frozen || e.stunUntil > state.elapsed) continue;

      // Healer: regenerate nearby enemies
      if (e.healer && !e.dead) {
        for (const other of state.enemies) {
          if (other === e || other.dead || other.leaked) continue;
          if (dist(e, other) < (e.type.healRadius || 120)) {
            other.hp = Math.min(other.maxHp, other.hp + e.type.healRate * dt);
          }
        }
      }

      // Boss rampage at 50% HP
      if (e.boss && !e.rampaged && e.hp / e.maxHp < 0.5) {
        e.rampaged = true;
        e.speed *= 1.8;
        addText(e.x, e.y - 30, "RAMPAGE!", "#ff6479");
        if (state.sound) audio.bossRoar();
      }

      const slow = e.slowUntil > state.elapsed ? (1 - (e.type.resistSlow || 0)) * 0.45 : 1;
      e.dist += e.speed * slow * dt;
      if (e.dist >= state.totalLen) { leakEnemy(e); continue; }
      const pt = pointAt(state.segs, state.totalLen, e.dist);
      e.x = pt.x; e.y = pt.y;
    }
    state.enemies = state.enemies.filter(e => !e.dead && !e.leaked);
  }

  function leakEnemy(e) {
    e.leaked = true;
    state.lives = Math.max(0, state.lives - e.damage);
    state.shake = 0.6;
    addText(e.x, e.y, `-${e.damage} HP`, "#ff5167");
    // MrMacsProfile: track base damage for td-perfect-base achievement
    state.baseDamageThisRun += e.damage;
    updateHud();
    if (state.lives <= 0) endGame();
  }

  // ─── Tower fire ───────────────────────────────────────────────────────────────
  function selectTarget(tower, rng) {
    let best = null;
    for (const e of state.enemies) {
      if (e.dead || e.leaked) continue;
      if (tower.type.archetype !== "sniper" && e.stealth && !e.revealed) continue;
      if (dist(tower, e) > rng) continue;
      if (!best || e.dist > best.dist) best = e;
    }
    return best;
  }

  function updateTowers(dt) {
    for (const tower of state.towers) {
      tower.cooldown = Math.max(0, tower.cooldown - dt * state.speed);
      tower.pulse = Math.max(0, tower.pulse - dt * 1.8);
      tower.crit = Math.max(0, (tower.crit || 0) - dt);

      if (tower.type.archetype === "boost") continue; // no firing

      const { dmg, rng, rte, splash } = towerStats(tower);
      if (!rte) continue;
      const target = selectTarget(tower, rng);
      if (!target) continue;
      tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
      if (tower.cooldown <= 0) {
        fireTower(tower, target, dmg, rng, rte, splash);
        tower.cooldown = 1 / rte;
        tower.pulse = 0.55;
      }
    }
  }

  function fireTower(tower, target, dmg, rng, rte, splash) {
    const arch = tower.type.archetype;
    // play sound
    if (state.sound) {
      if (arch==="sniper") audio.sniperFire();
      else if (arch==="cannon") audio.cannonFire();
      else if (arch==="slow") audio.slowFire();
      else if (arch==="dot") audio.dotFire();
    }

    // muzzle flash particle
    addMuzzle(tower.x, tower.y, tower.type.color);

    if (arch === "dot") {
      // reveal stealth
      if (target.stealth) target.revealed = true;
      const dur = tower.type.dotDuration * (1 + (tower.level - 1) * 0.4);
      const existingDot = target.dotEffects.find(d => d.towerId === tower.id);
      if (existingDot) { existingDot.until = state.elapsed + dur; existingDot.dmg = dmg * 0.5; }
      else target.dotEffects.push({ towerId: tower.id, dmg: dmg * 0.5, until: state.elapsed + dur });
      state.projectiles.push({ kind: "bolt", x: tower.x, y: tower.y, tx: target.x, ty: target.y, target, color: tower.type.color, speed: 500, damage: dmg * 0.3, splash: 0, slow: 0, stun: 0, tower });
      return;
    }

    if (arch === "slow") {
      state.projectiles.push({ kind: "bolt", x: tower.x, y: tower.y, tx: target.x, ty: target.y, target, color: tower.type.color, speed: 600, damage: dmg, splash: 0, slow: 2.0 + tower.level * 0.5, stun: 0, tower });
      return;
    }

    if (arch === "sniper") {
      // sniper: instant beam (reveal stealth)
      if (target.stealth) target.revealed = true;
      damageEnemy(target, dmg, tower);
      addBurstAt(target.x, target.y, tower.type.color, 12);
      state.projectiles.push({ kind: "beam", x: tower.x, y: tower.y, tx: target.x, ty: target.y, color: tower.type.color, life: 0.1, max: 0.1 });
      if (tower.branch === "a") {
        // temporal lock: stun
        target.stunUntil = state.elapsed + 1.2;
      }
      return;
    }

    if (arch === "cannon" || splash > 0) {
      state.projectiles.push({ kind: "mortar", x: tower.x, y: tower.y - 20, tx: target.x, ty: target.y, target, color: tower.type.color, speed: 480, damage: dmg, splash, slow: 0, stun: 0, tower });
      return;
    }

    // default bolt
    state.projectiles.push({ kind: "bolt", x: tower.x, y: tower.y, tx: target.x, ty: target.y, target, color: tower.type.color, speed: 680, damage: dmg, splash: 0, slow: 0, stun: 0, tower });
  }

  // ─── Projectile update ────────────────────────────────────────────────────────
  function updateProjectiles(dt) {
    const adt = dt * state.speed;
    for (const p of state.projectiles) {
      if (p.kind === "beam") {
        p.life -= adt; if (p.life <= 0) p.dead = true;
        continue;
      }
      if (p.kind === "pulse") {
        p.life -= adt;
        p.r = p.maxR * (1 - p.life / p.max);
        if (p.life <= 0) p.dead = true;
        continue;
      }
      const target = p.target && !p.target.dead ? p.target : null;
      const tx = target ? target.x : p.tx;
      const ty = target ? target.y : p.ty;
      const dx = tx - p.x, dy = ty - p.y;
      const d  = Math.hypot(dx, dy);
      if (d < p.speed * adt || d < 12) {
        impactProjectile(p, tx, ty);
        p.dead = true;
      } else {
        p.x += dx / d * p.speed * adt;
        p.y += dy / d * p.speed * adt;
      }
    }
    state.projectiles = state.projectiles.filter(p => !p.dead);
  }

  function impactProjectile(p, x, y) {
    if (state.sound) audio.hit();
    if (p.splash > 0) {
      addBurstAt(x, y, p.color, 24);
      for (const e of state.enemies) {
        if (e.dead || e.leaked) continue;
        const d = dist({ x, y }, e);
        if (d <= p.splash) {
          damageEnemy(e, p.damage * (1 - d / (p.splash * 1.4)), p.tower);
          if (p.slow) e.slowUntil = state.elapsed + p.slow;
        }
      }
    } else if (p.target && !p.target.dead) {
      const e = p.target;
      if (e.stealth) e.revealed = true;
      if (p.slow) e.slowUntil = state.elapsed + p.slow;
      if (p.stun) e.stunUntil = state.elapsed + p.stun;
      damageEnemy(e, p.damage, p.tower);
      addBurstAt(x, y, p.color, 8);
    }
  }

  // ─── Damage ───────────────────────────────────────────────────────────────────
  function damageEnemy(e, amount, tower, isDot = false) {
    if (e.dead) return;
    const resist = isDot ? (e.type.resistDot || 0) : 0;
    const final = Math.max(0.5, amount * (1 - resist));
    e.hp -= final;
    if (Math.random() < 0.14) addText(e.x, e.y - 22, Math.round(final), tower?.type?.color || "#ffd76b");
    if (e.hp <= 0) killEnemy(e, tower);
  }

  function killEnemy(e, tower) {
    if (e.dead) return;
    e.dead = true;
    if (tower) tower.kills = (tower.kills || 0) + 1;
    // splitter
    if (e.splitter && e.splitCount > 0) {
      for (let i = 0; i < e.splitCount; i++) {
        spawnMinion(e);
      }
    }
    const shards = e.reward;
    state.insight += shards;
    state.totalShards += shards;
    state.score += shards * 8 + (e.boss ? 1200 : e.splitter ? 200 : 80);
    if (e.boss) {
      addBurstAt(e.x, e.y, "#ff6479", 80);
      state.shake = liteFx ? 0.4 : 1.2; // Phase 5: reduced boss shake in lite mode
      addText(e.x, e.y - 40, `+${shards} BOSS!`, "#ffd76b");
      if (state.sound) audio.abilityStinger();
      // MrMacsProfile: boss kill shard award
      if (window.MrMacsProfile) MrMacsProfile.addShards(75, "chrono-defense-boss-kill");
    } else {
      addBurstAt(e.x, e.y, e.color, 18);
      addText(e.x, e.y, `+${shards}`, "#66f2ac");
      if (state.sound) audio.pop();
      // MrMacsProfile: enemy kill shard award
      if (window.MrMacsProfile) MrMacsProfile.addShards(1, "chrono-defense-kill");
    }
    updateHud();
    persistProgress();
  }

  function spawnMinion(parent) {
    const base = ENEMY_TYPES[0]; // fast minion
    const pt = pointAt(state.segs, state.totalLen, parent.dist + Math.random() * 30 - 15);
    state.enemies.push({
      id: uid(), type: base, name: "Myth Fragment",
      maxHp: Math.round(parent.maxHp * 0.22), hp: Math.round(parent.maxHp * 0.22),
      speed: base.speed * 1.3, reward: Math.round(parent.reward * 0.2),
      damage: 1, boss: false, stealth: false, healer: false,
      splitter: false, splitCount: 0,
      color: "#ffd76b", size: 20,
      dist: parent.dist, x: pt.x, y: pt.y,
      wobble: Math.random() * Math.PI * 2,
      slowUntil: 0, stunUntil: 0, revealed: true, dotEffects: [],
      rampaged: false, dead: false, leaked: false
    });
  }

  // ─── Precision strike (question correct) ─────────────────────────────────────
  function precisionStrike(amount, all = false) {
    const targets = [...state.enemies].sort((a,b) => b.dist - a.dist).slice(0, all ? 999 : 6);
    for (const e of targets) {
      damageEnemy(e, amount * (e.boss ? 0.75 : 1), null);
      state.projectiles.push({ kind: "beam", x: BASE_W * 0.5, y: 80, tx: e.x, ty: e.y, color: "#ffd76b", life: 0.22, max: 0.22 });
    }
    if (targets.length) state.shake = 0.3;
  }

  // ─── Abilities ────────────────────────────────────────────────────────────────
  function useAbility(id) {
    const ab = state.abilities.find(a => a.id === id);
    if (!ab) return;
    const now = state.elapsed;
    if (now - ab.lastUsed < ab.cooldown) {
      const rem = Math.ceil(ab.cooldown - (now - ab.lastUsed));
      showBanner(`${ab.name}: ${rem}s cooldown`);
      return;
    }
    ab.lastUsed = now;
    if (state.sound) audio.abilityStinger();

    if (id === "timestop") {
      state.freezeUntil = now + 5;
      showBanner("Time Stop");
    }
    if (id === "erastorm") {
      const dmg = 120 + state.wave * 12;
      for (const e of state.enemies) {
        if (!e.dead && !e.leaked) damageEnemy(e, dmg * (e.boss ? 0.5 : 1), null);
      }
      addBurstAt(BASE_W / 2, BASE_H / 2, "#ff8d4d", 80);
      state.shake = 0.8;
      state._eraStormPulse = { start: state.elapsed };
      showBanner("Era Storm");
    }
    if (id === "reinforce") {
      let placed = 0;
      const attempts = 60;
      for (let i = 0; i < attempts && placed < 2; i++) {
        const pos = { x: 100 + Math.random() * (BASE_W - 200), y: 100 + Math.random() * (BASE_H - 200) };
        if (placementStatus(pos).ok) {
          const type = TOWER_TYPES[Math.floor(Math.random() * TOWER_TYPES.length)];
          state.towers.push({ id: uid(), type, x: pos.x, y: pos.y, level: 1, cooldown: 0.5, angle: 0, pulse: 1, kills: 0, crit: 0, branch: null });
          addBurstAt(pos.x, pos.y, type.color, 24);
          placed++;
        }
      }
      showBanner("Reinforcements Deployed");
    }
    renderAbilities();
    updateHud();
  }

  // ─── Wave system ──────────────────────────────────────────────────────────────
  function startWave() {
    if (state.gameOver) return;
    if (!state.towers.length) { showBanner("Build a Tower First"); return; }
    if (state.spawnQueue.length || state.enemies.length) return;
    if (!state.betweenWaves) return;

    state.wave += 1;
    state.running = true;
    state.paused = false;
    state.betweenWaves = false;
    els.pauseBtn.textContent = "Pause";
    els.startWave.disabled = true;
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start("td-strategic"); } catch (e) {}

    const bossWave = state.wave % 10 === 0;
    const midBoss  = state.wave % 5 === 0 && !bossWave;
    const typeList = buildWaveComposition(state.wave, MAPS[state.currentMap].id);
    const interval = Math.max(0.08, 0.38 - state.wave * 0.008);
    state.spawnQueue = typeList.map((t, i) => ({ type: t, delay: i === 0 ? 0 : interval }));
    state.spawnTimer = 0;

    const mapName = MAPS[state.currentMap].name;
    const bannerText = bossWave
      ? `Wave ${state.wave} · ${mapName} Boss Assault`
      : midBoss
        ? `Wave ${state.wave} · Elite Strike — ${mapName}`
        : `Wave ${state.wave} · ${mapName} Incursion`;
    showBanner(bannerText, bossWave || midBoss);

    state.score += state.wave * 25;
    updateHud();
    if (state.sound) {
      audio.waveStart();
      if (bossWave || midBoss) setTimeout(() => audio.bossRoar(), 600);
    }

    // queue a question in ~8 sec
    state.questionCooldown = 6 + Math.random() * 6;

    // Wave 5 — snapshot on wave start + ensure periodic timer is running
    try {
      if (window.MrMacsSessions) {
        window.MrMacsSessions.save("chrono-defense", {
          wave: state.wave, lives: state.lives, score: state.score,
          map: MAPS[state.currentMap].id,
          towers: (state.towers || []).map(t => ({ x: t.x, y: t.y, level: t.level, type: t.type && t.type.id }))
        });
      }
      if (!state.__wave5SnapTimer) {
        state.__wave5SnapTimer = setInterval(() => {
          try {
            if (state.gameOver || !state.running || !window.MrMacsSessions) return;
            window.MrMacsSessions.save("chrono-defense", {
              wave: state.wave, lives: state.lives, score: state.score,
              map: MAPS[state.currentMap].id,
              towers: (state.towers || []).map(t => ({ x: t.x, y: t.y, level: t.level, type: t.type && t.type.id }))
            });
          } catch (e) {}
        }, 10000);
      }
    } catch (e) {}
  }

  function endWave() {
    state.running = false;
    state.betweenWaves = true;
    els.startWave.disabled = false;

    // bonus for full HP wave
    const hpBonus = state.lives >= state.maxLives ? 80 + state.wave * 10 : 0;
    const waveBonus = 100 + state.wave * 18;
    state.insight += waveBonus + hpBonus;
    state.score += 500 + state.wave * 80;

    const bossWave = state.wave % 10 === 0;
    if (bossWave) {
      const nextMap = state.currentMap + 1;
      if (nextMap < MAPS.length && !state.mapsUnlocked[nextMap]) {
        state.mapsUnlocked[nextMap] = true;
        MAPS[nextMap].unlocked = true;
        showBanner(`Map Unlocked: ${MAPS[nextMap].name}!`);
        renderMapSelect();
      }
    }

    if (state.wave >= state.maxWave) {
      // MrMacsProfile: map cleared (wave 30 reached)
      if (window.MrMacsProfile) {
        MrMacsProfile.addShards(200, "chrono-defense-map-clear");
        MrMacsProfile.unlock("td-wave-30");
        if (state.baseDamageThisRun === 0) MrMacsProfile.unlock("td-perfect-base");
      }
      endGame(true);
      return;
    }

    // MrMacsProfile: wave survived shard award
    if (window.MrMacsProfile) MrMacsProfile.addShards(50, "chrono-defense-wave-survived");

    showBanner(hpBonus > 0 ? `Wave ${state.wave} Cleared · Perfect! +${hpBonus}` : `Wave ${state.wave} Cleared · +${waveBonus}`);
    updateHud();
    persistProgress();

    if (state.autoStart) setTimeout(startWave, 2200);
  }

  // ─── Question mid-wave ────────────────────────────────────────────────────────
  function updateQuestionCooldown(dt) {
    if (!state.running || state.paused) return;
    state.questionCooldown -= dt;
    if (state.questionCooldown <= 0 && state.currentQuestion === null) {
      triggerCombatQuestion();
    }
  }

  function triggerCombatQuestion() {
    if (!state.filtered.length) return;
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    const q = state.queue.pop();
    if (!q) return;
    state.currentQuestion = q;
    prepareQuestion(q);
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck(0.4, 250); } catch (e) {}
    // next question in combat 12-20 sec
    state.questionCooldown = 12 + Math.random() * 8;
  }

  // ─── Question UI ──────────────────────────────────────────────────────────────
  function nextQuestion() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    return state.queue.pop() || null;
  }

  function prepareQuestion(q) {
    if (!q) q = nextQuestion();
    state.currentQuestion = q;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.choices.innerHTML = "";
    els.stimulusStrip.innerHTML = "";
    els.stimulusStrip.classList.remove("show");
    els.typedAnswer.value = "";
    if (!q) {
      els.questionPrompt.textContent = "No questions match this filter.";
      els.questionMeta.textContent = "Review Reactor";
      return;
    }
    els.questionMeta.textContent = [q.course, q.set, displaySource(q)].filter(Boolean).join(" / ");
    els.questionPrompt.textContent = displayPrompt(q);
    els.questionStreak.textContent = `${state.streak} streak`;
    const imgs = stimulusImages(q);
    if (imgs.length) {
      els.stimulusStrip.classList.add("show");
      els.stimulusStrip.innerHTML = imgs.slice(0,2).map(im => `<img src="${esc(im.src)}" alt="${esc(im.label||"")}">`).join("");
    }
    if (q.type === "mcq" && q.choices?.length) {
      els.typedForm.style.display = "none";
      els.choices.style.display = "grid";
      els.choices.innerHTML = q.choices.map(c => `<button type="button" data-choice="${esc(c.label)}">${esc(c.label)}. ${esc(c.text)}</button>`).join("");
      els.choices.querySelectorAll("button").forEach(b => b.addEventListener("click", () => submitAnswer(b.dataset.choice)));
    } else {
      els.choices.style.display = "none";
      els.typedForm.style.display = "grid";
      if (!state.questionCollapsed) els.typedAnswer.focus({ preventScroll: true });
    }
  }

  function submitAnswer(raw) {
    const q = state.currentQuestion; if (!q) return;
    const correct = checkAnswer(q, raw);
    state.answered++;
    // Phase 1 — recordAnswer: log to profile topic stats for cram/diagnostic routing
    if (window.MrMacsProfile && MrMacsProfile.recordAnswer) {
      MrMacsProfile.recordAnswer({
        course: q.course || els.courseFilter.value || "Unknown",
        set: q.set || els.setFilter.value || "General",
        correct,
        prompt: displayPrompt(q),
        answer: String(q.answer || ""),
        gameId: "chrono-defense"
      });
    }
    if (correct) {
      state.correct++;
      state.streak++;
      const reward = 80 + Math.min(120, state.streak * 8) + state.wave * 3;
      state.insight += reward;
      state.score += 200 + state.streak * 30 + state.wave * 10;
      // MrMacsProfile: mid-wave correct answer shard award + first-correct achievement
      if (window.MrMacsProfile) {
        MrMacsProfile.addShards(15, "chrono-defense-correct-answer");
        if (state.correct === 1) MrMacsProfile.unlock("first-correct");
      }
      // question effect: cycle through crit, voucher, slowtime
      const roll = Math.random();
      if (roll < 0.40) {
        // crit: next tower shot is 2.2× damage for 4s
        state.towers.forEach(t => t.crit = 4);
        addText(BASE_W/2, BASE_H/2 - 40, "CRIT ACTIVE!", "#ffd76b");
      } else if (roll < 0.70) {
        // slow time 5 sec
        state.freezeUntil = state.elapsed + 5;
        addText(BASE_W/2, BASE_H/2 - 40, "SLOW TIME!", "#4de8ff");
      } else {
        // precision strike bonus
        precisionStrike(80 + state.wave * 8);
      }
      state.reactorFlash = 1;
      els.feedback.textContent = `Correct! ${q.explanation || q.answer} +${reward}`;
      els.feedback.className = "feedback good";
      if (state.sound) audio.correct();
      // Question console glow
      els.questionConsole.classList.add("q-correct");
      setTimeout(() => els.questionConsole.classList.remove("q-correct"), 900);
    } else {
      state.streak = 0;
      state.score = Math.max(0, state.score - 30);
      // wrong: brief enemy speed boost
      state.enemies.forEach(e => { if (!e.dead && !e.leaked) e.speed *= 1.1; });
      setTimeout(() => state.enemies.forEach(e => { if (!e.dead && !e.leaked) e.speed /= 1.1; }), 4000);
      els.feedback.textContent = `Not quite. Answer: ${q.answer}. ${q.explanation||""}`;
      els.feedback.className = "feedback bad";
      if (state.sound) audio.wrong();
      // Red shake
      els.questionConsole.classList.add("q-wrong");
      setTimeout(() => els.questionConsole.classList.remove("q-wrong"), 400);
    }
    updateHud();
    els.questionStreak.textContent = `${state.streak} streak`;
    // in combat, prepare next question after delay
    setTimeout(() => {
      state.currentQuestion = null;
      prepareQuestion();
      try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore(400); } catch (e) {}
    }, correct ? 1000 : 2000);
  }

  // ─── Controls ─────────────────────────────────────────────────────────────────
  function initControls() {
    els.typedForm.addEventListener("submit", e => { e.preventDefault(); submitAnswer(els.typedAnswer.value); });
    els.startWave.addEventListener("click", startWave);
    els.pauseBtn.addEventListener("click", () => {
      state.paused = !state.paused;
      els.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
    });
    els.soundBtn.addEventListener("click", () => {
      state.sound = !state.sound;
      els.soundBtn.textContent = state.sound ? "Sound: On" : "Sound: Off";
    });
    els.resetBtn.addEventListener("click", resetGame);
    els.speedBtn.addEventListener("click", () => {
      state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1;
      els.speedBtn.textContent = `${state.speed}× Speed`;
    });
    els.autoBtn?.addEventListener("click", () => {
      state.autoStart = !state.autoStart;
      els.autoBtn.textContent = state.autoStart ? "Auto: ON" : "Auto: OFF";
      els.autoBtn.classList.toggle("active-toggle", state.autoStart);
    });
    els.upgradeBtn.addEventListener("click", upgradeSelected);
    els.sellBtn.addEventListener("click", sellSelected);
    els.branch0Btn?.addEventListener("click", () => chooseBranch("a"));
    els.branch1Btn?.addEventListener("click", () => chooseBranch("b"));
    els.libraryBtn.addEventListener("click", focusLibrary);
    els.fullscreenBtn.addEventListener("click", toggleFullscreen);
    els.toggleQuestion.addEventListener("click", () => setQuestionCollapsed(true));
    els.reactorDock.addEventListener("click", () => setQuestionCollapsed(!state.questionCollapsed));

    // Canvas pointer
    els.canvas.addEventListener("pointermove", e => { state.hover = canvasPoint(e); });
    els.canvas.addEventListener("pointerleave", () => { state.hover = null; });
    els.canvas.addEventListener("click", handleCanvasClick);
    els.canvas.addEventListener("contextmenu", e => { e.preventDefault(); handleRightClick(canvasPoint(e)); });

    // Touch: tap to select tower type, tap canvas to place/select
    els.canvas.addEventListener("touchend", e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      handleCanvasClick({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: false });

    // Map select
    els.mapSelect?.addEventListener("change", () => {
      const idx = parseInt(els.mapSelect.value, 10);
      if (state.mapsUnlocked[idx] && !state.running && !state.enemies.length) {
        resetGame(false);
        activateMap(idx);
        renderMapSelect();
      } else {
        showBanner(state.mapsUnlocked[idx] ? "Finish current wave first" : "Map Locked — Reach Wave 10");
        els.mapSelect.value = state.currentMap;
      }
    });

    // Abilities
    els.powerList.addEventListener("click", e => {
      const btn = e.target.closest("[data-ability]");
      if (btn) useAbility(btn.dataset.ability);
    });
  }

  function chooseBranch(branch) {
    const tower = state.selectedTower;
    if (!tower || tower.level < 3 || tower.branch) return;
    tower.branch = branch;
    addBurstAt(tower.x, tower.y, tower.type.color, 40);
    updateSelectedPanel();
    if (state.sound) audio.correct();
  }

  function handleCanvasClick(event) {
    const pos = canvasPoint(event);
    // click on tower to select
    const clicked = state.towers.find(t => dist(t, pos) < 54);
    if (clicked) {
      state.selectedTower = clicked;
      updateSelectedPanel();
      return;
    }
    // place tower
    const type = TOWER_TYPES.find(t => t.id === state.selectedBuild);
    const pl = placementStatus(pos);
    if (!pl.ok) { showBanner(pl.reason); return; }
    if (!type || state.insight < type.cost) { showBanner("Need More Shards"); return; }
    state.insight -= type.cost;
    const tower = { id: uid(), type, x: pos.x, y: pos.y, level: 1, cooldown: Math.random() * 0.5, angle: 0, pulse: 1, kills: 0, crit: 0, branch: null };
    state.towers.push(tower);
    state.selectedTower = tower;
    addBurstAt(pos.x, pos.y, type.color, 20);
    updateSelectedPanel();
    updateHud();
  }

  function handleRightClick(pos) {
    const clicked = state.towers.find(t => dist(t, pos) < 54);
    if (clicked) {
      state.insight += sellValue(clicked);
      state.towers = state.towers.filter(t => t !== clicked);
      if (state.selectedTower === clicked) state.selectedTower = null;
      updateSelectedPanel();
      updateHud();
      showBanner(`Sold for ${sellValue(clicked)}`);
    }
  }

  function upgradeSelected() {
    const tower = state.selectedTower; if (!tower) return;
    if (tower.level >= 3) {
      if (!tower.branch) showBanner("Choose a specialization!");
      else showBanner("Max tier reached");
      return;
    }
    const cost = upgradeCost(tower);
    if (state.insight < cost) { showBanner("Need More Shards"); return; }
    state.insight -= cost;
    tower.level++;
    tower.pulse = 1;
    addBurstAt(tower.x, tower.y, tower.type.color, 36);
    updateSelectedPanel();
    updateHud();
    if (state.sound) audio.correct();
  }

  function sellSelected() {
    const tower = state.selectedTower; if (!tower) return;
    const val = sellValue(tower);
    state.insight += val;
    state.towers = state.towers.filter(t => t !== tower);
    state.selectedTower = null;
    updateSelectedPanel();
    updateHud();
    showBanner(`Sold · +${val}`);
  }

  function updateSelectedPanel() {
    const tower = state.selectedTower;
    if (!tower) {
      const type = TOWER_TYPES.find(t => t.id === state.selectedBuild);
      els.selectedTowerName.textContent = type ? type.name : "";
      els.upgradeTitle.textContent = "Select a tower to build";
      els.upgradeText.textContent = type ? `${type.name}: ${type.role}. Cost: ${type.cost} shards.` : "";
      if (type) renderTowerPreviewCanvas({ type, level: 1, branch: null }, els.upgradePreview);
      else els.upgradePreview.innerHTML = "";
      els.upgradeBtn.disabled = true;
      els.sellBtn.disabled = true;
      els.branch0Btn && (els.branch0Btn.style.display = "none");
      els.branch1Btn && (els.branch1Btn.style.display = "none");
      renderTowerList();
      return;
    }
    const upg = tower.type.upgrades;
    const nextUpg = upg[tower.level]; // 0=lv1, 1=lv2, 2=lv3 branch
    const { dmg, rng, rte, splash } = towerStats(tower);
    els.upgradeTitle.textContent = `${tower.type.name} T${tower.level}${tower.branch ? " [" + tower.branch.toUpperCase() + "]" : ""}`;
    const statsLine = `DMG:${Math.round(dmg)} RNG:${Math.round(rng)} ${rte ? "RTE:" + rte.toFixed(1) : ""} ${splash ? "AOE:" + Math.round(splash) : ""} KLS:${tower.kills}`;
    if (tower.level < 3) {
      els.upgradeText.textContent = `Next: ${nextUpg}. Cost: ${upgradeCost(tower)} shards. ${statsLine}`;
      els.upgradeBtn.disabled = false;
    } else {
      // level 3: show branch choice if not chosen
      if (!tower.branch && typeof nextUpg === "object") {
        els.upgradeText.textContent = `Choose specialization: A) ${nextUpg.a}  B) ${nextUpg.b}. ${statsLine}`;
        els.branch0Btn && (els.branch0Btn.style.display = "");
        els.branch0Btn && (els.branch0Btn.textContent = "A: " + nextUpg.a);
        els.branch1Btn && (els.branch1Btn.style.display = "");
        els.branch1Btn && (els.branch1Btn.textContent = "B: " + nextUpg.b);
      } else {
        const chosen = tower.branch ? (tower.branch === "a" ? nextUpg.a : nextUpg.b) : "Max Tier";
        els.upgradeText.textContent = `${chosen}. Max tier. ${statsLine}`;
        els.branch0Btn && (els.branch0Btn.style.display = "none");
        els.branch1Btn && (els.branch1Btn.style.display = "none");
      }
      els.upgradeBtn.disabled = true;
    }
    renderTowerPreviewCanvas(tower, els.upgradePreview);
    els.sellBtn.disabled = false;
    renderTowerList();
  }

  // ─── Tower preview canvas (sidebar) ──────────────────────────────────────────
  function renderTowerPreviewCanvas(tower, container) {
    let cv = container.querySelector("canvas");
    if (!cv) {
      container.innerHTML = "";
      cv = document.createElement("canvas");
      cv.width = 80; cv.height = 80;
      cv.style.cssText = "width:100%;height:100%;display:block;";
      container.appendChild(cv);
    }
    const tc = cv.getContext("2d");
    tc.clearRect(0, 0, 80, 80);
    tc.save();
    tc.translate(40, 44);
    tc.scale(1.3, 1.3);
    const tierFill = tower.level === 3 ? (tower.branch ? "#e8d0ff" : "#c8b8f0")
                   : tower.level === 2 ? "#ffd76b" : "#d0ddf0";
    const tierStroke = tower.level === 3 ? tower.type.color : tower.level === 2 ? "#ffb330" : "#8090b8";
    // Redirect ctx to tc temporarily
    const savedCtx = { fillStyle: tc.fillStyle };
    // Use same drawTowerSilhouette but on tc
    const prev = ctx;
    // Draw silhouette using tc
    tc.fillStyle = tierFill;
    tc.strokeStyle = tierStroke;
    tc.shadowColor = tower.type.color;
    tc.shadowBlur = 12;
    tc.lineWidth = 2;
    drawTowerSilhouetteOn(tc, tower.type.archetype, tierFill, tierStroke, tower.type.color, tower.level);
    tc.restore();
  }

  function drawTowerSilhouetteOn(c, archetype, fill, stroke, accent, level) {
    c.lineWidth = 2;
    c.strokeStyle = stroke;
    c.fillStyle = fill;
    if (level >= 3) { c.shadowColor = accent; c.shadowBlur = 18; }
    const lv = level || 1;
    if (archetype === "sniper") {
      c.beginPath();
      c.moveTo(0,-34); c.lineTo(7,-18); c.lineTo(9,14); c.lineTo(5,18); c.lineTo(-5,18); c.lineTo(-9,14); c.lineTo(-7,-18); c.closePath();
      c.fill(); c.stroke();
      c.fillStyle = accent; c.strokeStyle="rgba(0,0,0,0.4)"; c.lineWidth=1;
      c.beginPath(); c.rect(-2,-7,5,4); c.fill(); c.stroke();
      c.strokeStyle = stroke; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(0,-34); c.lineTo(0,-44); c.stroke();
    } else if (archetype === "cannon") {
      c.beginPath(); c.arc(0,4,16,Math.PI,Math.PI*2); c.lineTo(16,18); c.lineTo(-16,18); c.closePath();
      c.fill(); c.stroke();
      c.strokeStyle = accent; c.lineWidth = 5; c.lineCap = "round";
      c.beginPath(); c.moveTo(0,4); c.lineTo(18,-12); c.stroke();
      c.lineCap = "butt";
      c.fillStyle = "rgba(0,0,0,0.4)";
      for (let i=-1;i<=1;i++){c.beginPath();c.arc(i*8,12,2.5,0,Math.PI*2);c.fill();}
    } else if (archetype === "slow") {
      c.beginPath();
      c.moveTo(0,-38);c.lineTo(9,-16);c.lineTo(12,0);c.lineTo(9,16);c.lineTo(0,20);c.lineTo(-9,16);c.lineTo(-12,0);c.lineTo(-9,-16);c.closePath();
      c.fill(); c.stroke();
      c.strokeStyle = accent; c.lineWidth = 1; c.globalAlpha *= 0.6;
      c.beginPath(); c.moveTo(0,-38); c.lineTo(0,20); c.stroke();
      c.beginPath(); c.moveTo(-12,0); c.lineTo(12,0); c.stroke();
      c.globalAlpha = 1;
      c.fillStyle = accent; c.beginPath(); c.arc(0,-36,4,0,Math.PI*2); c.fill();
    } else if (archetype === "dot") {
      c.beginPath(); c.ellipse(0,8,14,10,0,0,Math.PI*2); c.fill(); c.stroke();
      c.beginPath(); c.rect(-5,-8,10,16); c.fill(); c.stroke();
      c.fillStyle = accent; c.beginPath(); c.ellipse(0,-8,7,3,0,0,Math.PI*2); c.fill(); c.stroke();
      c.fillStyle = "rgba(102,242,172,0.6)";
      c.beginPath(); c.arc(4,14,2.5,0,Math.PI*2); c.fill();
    } else if (archetype === "boost") {
      c.strokeStyle = stroke; c.lineWidth = 3; c.lineCap = "round";
      c.beginPath(); c.moveTo(0,22); c.lineTo(0,-26); c.stroke(); c.lineCap = "butt";
      c.fillStyle = fill; c.strokeStyle = stroke; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0,-26); c.lineTo(20,-18); c.lineTo(18,-9); c.lineTo(0,-5); c.closePath();
      c.fill(); c.stroke();
      c.strokeStyle = accent; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(4,-20); c.lineTo(12,-14); c.lineTo(4,-9); c.stroke();
    }
  }

  // ─── Tower / Ability list rendering ──────────────────────────────────────────
  function renderTowerList() {
    els.towerList.innerHTML = TOWER_TYPES.map(t => `
      <button class="tower-card ${t.id === state.selectedBuild ? "active" : ""}" type="button"
        data-tower="${t.id}" aria-label="${esc(t.name)}, cost ${t.cost} shards">
        <canvas class="tower-icon-canvas" width="54" height="54" data-arch="${t.id}" aria-hidden="true"></canvas>
        <span><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></span>
        <em class="cost">${t.cost}</em>
      </button>
    `).join("");
    // Draw canvas icons
    els.towerList.querySelectorAll("canvas[data-arch]").forEach(cv => {
      const type = TOWER_TYPES.find(t => t.id === cv.dataset.arch);
      if (!type) return;
      const tc = cv.getContext("2d");
      tc.clearRect(0, 0, 54, 54);
      tc.save();
      tc.translate(27, 30);
      tc.scale(1.1, 1.1);
      drawTowerSilhouetteOn(tc, type.archetype, "#d0ddf0", "#8090b8", type.color, 1);
      tc.restore();
    });
    els.towerList.querySelectorAll(".tower-card").forEach(b => b.addEventListener("click", () => {
      state.selectedBuild = b.dataset.tower;
      state.selectedTower = null;
      renderTowerList();
      updateSelectedPanel();
    }));
  }

  function renderAbilities() {
    const now = state.elapsed;
    els.powerList.innerHTML = state.abilities.map(ab => {
      const elapsed = now - ab.lastUsed;
      const ready = elapsed >= ab.cooldown;
      const rem = ready ? 0 : Math.ceil(ab.cooldown - elapsed);
      // Phase 5: skip SVG cooldown ring in lite mode — keep icon + text countdown
      const ringHtml = liteFx ? "" : (() => {
        const pct = ready ? 100 : Math.round(elapsed / ab.cooldown * 100);
        const circumference = 44; // 2π×7 ≈ 44
        const dash = Math.round((pct / 100) * circumference);
        return `<svg width="52" height="52" viewBox="0 0 52 52" style="position:absolute;top:0;left:0;" aria-hidden="true">
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
              <circle cx="26" cy="26" r="22" fill="none" stroke="${ab.color}"
                stroke-width="3" stroke-dasharray="${dash} ${circumference}"
                stroke-linecap="round" transform="rotate(-90 26 26)"
                style="transition:stroke-dasharray .3s ease;opacity:${ready?1:0.7}"/>
            </svg>`;
      })();
      // Icon glyph: monoline SVG if available, fallback to text dingbat
      const iconGlyph = (ab.iconKind === "svg" && window.MrMacsIcons && window.MrMacsIcons.has(ab.icon))
        ? `<span class="ability-glyph" style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;font-size:24px;color:${ready ? ab.color : "var(--muted)"};">${window.MrMacsIcons.svg(ab.icon)}</span>`
        : `<span style="position:relative;z-index:1;font-size:22px;line-height:52px;">${esc(ab.icon)}</span>`;
      return `
        <button class="power-card ${ready ? "" : "cooling"}" type="button" data-ability="${ab.id}"
          aria-label="${esc(ab.name)}: ${ready ? "ready" : rem + "s cooldown"}">
          <span class="ability-icon" style="position:relative;">
            ${ringHtml}
            ${iconGlyph}
          </span>
          <span><strong>${esc(ab.name)}</strong><span>${esc(ab.desc)}</span></span>
          <em class="cost" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${ready ? ab.color : "var(--muted)"};">${ready ? "READY" : rem + "s"}</em>
        </button>`;
    }).join("");
  }

  function renderMapSelect() {
    if (!els.mapSelect) return;
    els.mapSelect.innerHTML = MAPS.map((m, i) => {
      const locked = !state.mapsUnlocked[i];
      // Note: <option> elements only render text — no SVG. Use clean ASCII glyph.
      return `<option value="${i}" ${locked ? "disabled" : ""} ${i === state.currentMap ? "selected" : ""}>${locked ? "[Locked] " : ""}${esc(m.name)}${locked ? "" : " · Wave " + (state.bestWave[i] || 0) + " best"}</option>`;
    }).join("");
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function updateHud() {
    els.wave.textContent = state.wave;
    els.lives.textContent = Math.max(0, Math.ceil(state.lives));
    els.insight.textContent = fmt(state.insight);
    els.score.textContent = fmt(state.score);
    els.questionStreak.textContent = `${state.streak} streak`;

    // HP bar
    if (els.hpFill) {
      const pct = clamp(state.lives / state.maxLives, 0, 1);
      els.hpFill.style.width = `${pct * 100}%`;
      els.hpFill.style.background = pct > 0.6 ? "#66f2ac" : pct > 0.3 ? "#ffd76b" : "#ff6479";
    }

    // Wave progress
    if (els.waveProgressFill) {
      const total = state.spawnQueue.length + state.enemies.length;
      const totalSpawned = (8 + Math.floor(state.wave * 1.5));
      const done = Math.max(0, totalSpawned - total);
      els.waveProgressFill.style.width = `${clamp(done / totalSpawned, 0, 1) * 100}%`;
    }

    renderAbilities();
  }

  // ─── Filters / library ───────────────────────────────────────────────────────
  function initFilters() {
    const courses = ["All Courses", ...state.bank.courses];
    els.courseFilter.innerHTML = courses.map(c => `<option>${esc(c)}</option>`).join("");
    els.courseFilter.value = "All Courses";
    els.courseFilter.addEventListener("change", () => { fillSets(); applyFilters(); });
    els.setFilter.addEventListener("change", applyFilters);
    fillSets();
  }

  function fillSets() {
    const course = els.courseFilter.value;
    let sets = course === "All Courses"
      ? [...new Set(state.bank.questions.map(q => q.set))].sort((a,b) => a.localeCompare(b,undefined,{numeric:true}))
      : (state.bank.setsByCourse[course] || []);
    els.setFilter.innerHTML = ["All Sets",...sets].map(s => `<option>${esc(s)}</option>`).join("");
  }

  function applyFilters() {
    const course = els.courseFilter.value, set = els.setFilter.value;
    state.filtered = state.bank.questions.filter(q => {
      if (!isPlayable(q)) return false;
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && q.set !== set) return false;
      return true;
    });
    state.queue = shuffle(state.filtered);
    els.bankCount.textContent = `${state.filtered.length.toLocaleString()} questions`;
    els.libraryStatus.textContent = `${course} / ${set}`;
    els.missionTitle.textContent = course === "All Courses" ? "Full Arcade Mixed Review" : course;
    prepareQuestion();
  }

  function focusLibrary() {
    els.libraryPanel.classList.remove("is-highlighted");
    void els.libraryPanel.offsetWidth;
    els.libraryPanel.classList.add("is-highlighted");
    els.libraryPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    els.courseFilter.focus({ preventScroll: true });
  }

  // ─── Particles / texts ───────────────────────────────────────────────────────
  function addMuzzle(x, y, color) {
    const count = liteFx ? 4 : 8;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 100;
      state.particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, r: 2+Math.random()*3, color, life: 0.12, max: 0.12, glow: true });
    }
  }

  function addBurstAt(x, y, color, count) {
    const actual = reduceMotion ? Math.min(6, count) : liteFx ? Math.min(16, Math.ceil(count*0.45)) : count;
    for (let i = 0; i < actual; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 50 + Math.random() * 200;
      state.particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, r: 2+Math.random()*5, color, life: 0.35+Math.random()*0.55, max: 0.9 });
    }
  }

  function addText(x, y, value, color) {
    state.texts.push({ x, y, value: String(value), color, life: 0.9 });
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 30 * dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);
    state.shake = Math.max(0, state.shake - dt * 1.5);
  }

  function updateTexts(dt) {
    for (const t of state.texts) { t.life -= dt; t.y -= 38 * dt; }
    state.texts = state.texts.filter(t => t.life > 0);
  }

  // ─── Main loop ────────────────────────────────────────────────────────────────
  function loop(now) {
    if (document.hidden) { state.last = now; requestAnimationFrame(loop); return; }
    if (liteFx && state.frameStamp && now - state.frameStamp < 1000/45) { requestAnimationFrame(loop); return; }
    state.frameStamp = now;
    const dt = Math.min(0.05, ((now - (state.last || now)) / 1000) || 0);
    state.last = now;
    if (!state.paused && !state.gameOver) {
      state.elapsed += dt;
      update(dt);
    }
    draw(now / 1000);
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // spawn
    if (state.spawnQueue.length) {
      state.spawnTimer -= dt * state.speed;
      if (state.spawnTimer <= 0) {
        const item = state.spawnQueue.shift();
        spawnEnemy(item.type);
        state.spawnTimer = item.delay;
      }
    }
    updateEnemies(dt * state.speed);
    updateTowers(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateQuestionCooldown(dt);
    state.reactorFlash = Math.max(0, state.reactorFlash - dt * 2);
    // check wave end
    if (state.running && !state.spawnQueue.length && !state.enemies.length) {
      endWave();
    }
  }

  // ─── Drawing ──────────────────────────────────────────────────────────────────
  function draw(time) {
    const shake = state.shake ? Math.sin(time * 95) * state.shake * 9 : 0;
    ctx.save();
    ctx.translate(shake, shake * 0.35);
    drawBackground(time);
    drawPath(time);
    drawSpawnAndBase();
    drawTowers(time);
    drawEnemies(time);
    drawPlacementPreview(time);
    drawProjectiles();
    drawParticles();
    drawTexts();
    if (state.freezeUntil > state.elapsed) drawFreezeOverlay();
    drawEraStormPulse(time);
    ctx.restore();
  }

  // ─── Era terrain painters ─────────────────────────────────────────────────────
  function drawEraBackground(time, map) {
    // For reduced motion, use a static time value
    if (reduceMotion) time = 0;
    const id = map.id;
    if (id === "industrial") {
      // Soot-stained factory: dark warm brown + brick-red smog layers
      const g = ctx.createLinearGradient(0, 0, 0, BASE_H);
      g.addColorStop(0,  "#0c0700");
      g.addColorStop(0.4,"#120a02");
      g.addColorStop(1,  "#0a0500");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      if (!liteFx) {
        // brick texture columns
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.strokeStyle = "#c87020";
        ctx.lineWidth = 1;
        for (let x = 60; x < BASE_W; x += 60) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
        }
        for (let y = 40; y < BASE_H; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
        }
        ctx.restore();
        // smokestack silhouettes
        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = "#6b3a10";
        const stacks = [[200,BASE_H-160],[500,BASE_H-200],[950,BASE_H-180],[1350,BASE_H-220],[1500,BASE_H-150]];
        for (const [sx, sy] of stacks) {
          ctx.fillRect(sx-14, sy, 28, BASE_H-sy+10);
          ctx.fillRect(sx-20, sy-50, 40, 22);
        }
        ctx.restore();
      }
    } else if (id === "coldwar") {
      // Concrete + amber: brutalist architecture, overcast sky
      const g = ctx.createLinearGradient(0, 0, 0, BASE_H);
      g.addColorStop(0,  "#050a14");
      g.addColorStop(0.5,"#060e1c");
      g.addColorStop(1,  "#020508");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      if (!liteFx) {
        // concrete panel lines
        ctx.save();
        ctx.globalAlpha = 0.035;
        ctx.strokeStyle = "#8ca0b8";
        ctx.lineWidth = 1;
        for (let x = 80; x < BASE_W; x += 80) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
        }
        for (let y = 80; y < BASE_H; y += 80) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
        }
        ctx.restore();
        // radioactive amber glow pulses
        ctx.save();
        const pulseR = (Math.sin(time*0.6)+1)/2;
        ctx.globalAlpha = 0.03 + pulseR * 0.02;
        const ag = ctx.createRadialGradient(BASE_W*0.15, BASE_H*0.8, 0, BASE_W*0.15, BASE_H*0.8, 300);
        ag.addColorStop(0, "#ffb347"); ag.addColorStop(1, "transparent");
        ctx.fillStyle = ag; ctx.fillRect(0, 0, BASE_W, BASE_H);
        const ag2 = ctx.createRadialGradient(BASE_W*0.85, BASE_H*0.2, 0, BASE_W*0.85, BASE_H*0.2, 280);
        ag2.addColorStop(0, "#ffb347"); ag2.addColorStop(1, "transparent");
        ctx.fillStyle = ag2; ctx.fillRect(0, 0, BASE_W, BASE_H);
        ctx.restore();
      }
    } else if (id === "modern") {
      // Glass + cobalt: city skyline, cool blues
      const g = ctx.createLinearGradient(0, 0, 0, BASE_H);
      g.addColorStop(0,  "#020816");
      g.addColorStop(0.5,"#010612");
      g.addColorStop(1,  "#010408");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      if (!liteFx) {
        // glass panel reflections
        ctx.save();
        ctx.globalAlpha = 0.028;
        ctx.strokeStyle = "#4090c8";
        ctx.lineWidth = 1;
        for (let x = 90; x < BASE_W; x += 90) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
        }
        for (let y = 60; y < BASE_H; y += 60) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
        }
        ctx.restore();
        // city skyline silhouettes
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = "#0a2040";
        const buildings = [[100,260],[180,200],[280,230],[400,170],[520,190],[700,150],[900,160],[1100,140],[1280,170],[1400,200],[1500,240]];
        for (let i = 0; i < buildings.length-1; i++) {
          const [bx,by] = buildings[i];
          const bw = buildings[i+1][0]-bx;
          ctx.fillRect(bx, by, bw-4, BASE_H-by+10);
        }
        ctx.restore();
      }
    } else {
      // Future Arc: chrome + neon
      const g = ctx.createLinearGradient(0, 0, BASE_W, BASE_H);
      g.addColorStop(0,  "#06020e");
      g.addColorStop(0.5,"#040118");
      g.addColorStop(1,  "#08020a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      if (!liteFx) {
        // neon grid
        ctx.save();
        ctx.globalAlpha = 0.045;
        ctx.strokeStyle = "#c981ff";
        ctx.lineWidth = 1;
        const gSize = 90;
        const gOff = (time * 15) % gSize;
        for (let x = -gSize + gOff; x < BASE_W + gSize; x += gSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
        }
        for (let y = -gSize + gOff*0.5; y < BASE_H + gSize; y += gSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
        }
        ctx.restore();
        // neon pulse radials
        ctx.save();
        const fp = (Math.sin(time*1.2)+1)/2;
        ctx.globalAlpha = 0.04 + fp*0.03;
        const fg = ctx.createRadialGradient(BASE_W/2, BASE_H/2, 0, BASE_W/2, BASE_H/2, BASE_H*0.7);
        fg.addColorStop(0, "#c981ff"); fg.addColorStop(1, "transparent");
        ctx.fillStyle = fg; ctx.fillRect(0, 0, BASE_W, BASE_H);
        ctx.restore();
      }
    }
  }

  function drawBackground(time) {
    const map = MAPS[state.currentMap];
    // Era-specific backdrop
    drawEraBackground(time, map);

    // Gentle animated grid overlay (era-tinted, faint)
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = map.color;
    ctx.lineWidth = 0.5;
    const gridSize = 80;
    const offset = (time * 14) % gridSize;
    for (let x = -gridSize + offset; x < BASE_W + gridSize; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
    }
    for (let y = -gridSize + offset * 0.4; y < BASE_H + gridSize; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
    }
    ctx.restore();

    // Vignette
    const vgrd = ctx.createRadialGradient(BASE_W/2, BASE_H/2, BASE_H*0.25, BASE_W/2, BASE_H/2, BASE_H);
    vgrd.addColorStop(0, "rgba(0,0,0,0)");
    vgrd.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vgrd;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  }

  function drawPath(time) {
    if (!state.route.length) return;
    const map = MAPS[state.currentMap];
    const route = state.route;

    // Outer soft glow
    ctx.save();
    ctx.strokeStyle = map.color;
    ctx.shadowColor = map.color;
    ctx.shadowBlur  = 28;
    ctx.lineWidth   = 22;
    ctx.globalAlpha = 0.08;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (const pt of route) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    // Mid glow layer
    ctx.save();
    ctx.strokeStyle = map.color;
    ctx.shadowColor = map.color;
    ctx.shadowBlur  = 12;
    ctx.lineWidth   = 10;
    ctx.globalAlpha = 0.14;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (const pt of route) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    // Solid road surface
    ctx.save();
    ctx.strokeStyle = "rgba(200,210,240,0.22)";
    ctx.lineWidth   = 5;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (const pt of route) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    // Animated dash flow arrows
    ctx.save();
    ctx.setLineDash([18, 36]);
    ctx.lineDashOffset = -(time * 60);
    ctx.strokeStyle = "rgba(255,255,255,0.26)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (const pt of route) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    // Directional arrowheads every ~160 px along route
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.shadowColor = "rgba(255,255,255,0.2)";
    ctx.shadowBlur  = 6;
    let stepLen = 0;
    const arrowInterval = 160;
    let nextArrow = arrowInterval;
    for (let i = 1; i < route.length; i++) {
      const a = route[i-1], b = route[i];
      const segLen = Math.hypot(b.x-a.x, b.y-a.y);
      stepLen += segLen;
      while (stepLen >= nextArrow) {
        const frac = 1 - (stepLen - nextArrow) / segLen;
        const ax = a.x + (b.x-a.x)*frac;
        const ay = a.y + (b.y-a.y)*frac;
        const ang = Math.atan2(b.y-a.y, b.x-a.x);
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(8,0); ctx.lineTo(-5,5); ctx.lineTo(-5,-5); ctx.closePath();
        ctx.fill();
        ctx.restore();
        nextArrow += arrowInterval;
      }
    }
    ctx.restore();

    // Reactor flash (question correct)
    if (state.reactorFlash > 0) {
      ctx.save();
      ctx.globalAlpha = state.reactorFlash * 0.55;
      ctx.strokeStyle = "#ffd76b";
      ctx.shadowColor = "#ffd76b";
      ctx.shadowBlur  = 32;
      ctx.lineWidth   = 8 + state.reactorFlash * 12;
      ctx.setLineDash([28, 18]);
      ctx.lineDashOffset = -(time * 180);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(route[0].x, route[0].y);
      for (const pt of route) ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSpawnAndBase() {
    if (!state.route.length) return;
    const start = state.route[0];
    const end   = state.route[state.route.length - 1];
    const map   = MAPS[state.currentMap];

    // Spawn marker
    ctx.save();
    ctx.fillStyle = "#ff6479";
    ctx.shadowColor = "#ff6479"; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(start.x, start.y, 18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("IN", start.x, start.y);
    ctx.restore();

    // Base/HQ
    ctx.save();
    ctx.fillStyle = map.color;
    ctx.shadowColor = map.color; ctx.shadowBlur = 28;
    ctx.beginPath(); ctx.arc(end.x, end.y, 24, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 12px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("HQ", end.x, end.y);
    ctx.restore();

    // HP bar under HQ
    const barW = 80, barH = 10;
    const pct = clamp(state.lives / state.maxLives, 0, 1);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(end.x - barW/2, end.y + 30, barW, barH);
    ctx.fillStyle = pct > 0.5 ? "#66f2ac" : pct > 0.25 ? "#ffd76b" : "#ff6479";
    ctx.fillRect(end.x - barW/2, end.y + 30, barW * pct, barH);
    ctx.restore();
  }

  // ─── Canvas tower silhouettes ─────────────────────────────────────────────────
  function drawTowerSilhouette(archetype, fill, stroke, accent, level) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;

    const lv = level || 1;
    // Accent glow for T3
    if (lv >= 3) {
      ctx.shadowColor = accent;
      ctx.shadowBlur = 22;
    }

    if (archetype === "sniper") {
      // Tall obelisk — narrow pointed spire
      ctx.beginPath();
      ctx.moveTo(0, -36);   // apex
      ctx.lineTo(8, -20);
      ctx.lineTo(10, 16);   // base shoulder
      ctx.lineTo(6, 20);    // base
      ctx.lineTo(-6, 20);
      ctx.lineTo(-10, 16);
      ctx.lineTo(-8, -20);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // scope notch
      ctx.fillStyle = accent; ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(-3, -8, 6, 4);
      ctx.fill(); ctx.stroke();
      // barrel
      ctx.strokeStyle = stroke; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(0, -48); ctx.stroke();
    } else if (archetype === "cannon") {
      // Squat dome fortress
      ctx.beginPath();
      ctx.arc(0, 4, 18, Math.PI, Math.PI*2);  // dome top
      ctx.lineTo(18, 20);
      ctx.lineTo(-18, 20);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // cannon barrel (angled)
      ctx.strokeStyle = accent; ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(20, -14); ctx.stroke();
      ctx.lineCap = "butt";
      // bolt holes
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.arc(i*9, 14, 3, 0, Math.PI*2); ctx.fill();
      }
    } else if (archetype === "slow") {
      // Crystal spike — cryo obelisk
      ctx.beginPath();
      ctx.moveTo(0, -40); ctx.lineTo(10, -18); ctx.lineTo(14, 0);
      ctx.lineTo(10, 18); ctx.lineTo(0, 22); ctx.lineTo(-10, 18);
      ctx.lineTo(-14, 0); ctx.lineTo(-10, -18);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // inner crystal facets
      ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.globalAlpha *= 0.6;
      ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(14,0); ctx.stroke();
      ctx.globalAlpha = 1;
      // tip glow
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(0, -38, 4, 0, Math.PI*2); ctx.fill();
    } else if (archetype === "dot") {
      // Poison vat — squat round vessel
      // Vat body
      ctx.beginPath();
      ctx.ellipse(0, 8, 16, 12, 0, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // vat neck
      ctx.fillStyle = fill; ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.rect(-6, -8, 12, 16);
      ctx.fill(); ctx.stroke();
      // lid
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(0, -8, 8, 4, 0, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // drip
      ctx.fillStyle = "rgba(102,242,172,0.6)";
      ctx.beginPath(); ctx.arc(5, 14, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(-4, 18, 2, 0, Math.PI*2); ctx.fill();
    } else if (archetype === "boost") {
      // Bardic banner / Archive relay — flag on post
      // Post
      ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 24); ctx.lineTo(0, -28); ctx.stroke();
      ctx.lineCap = "butt";
      // Banner flag
      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -28); ctx.lineTo(22, -20); ctx.lineTo(20, -10);
      ctx.lineTo(0, -6); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Accent chevron on flag
      ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(5,-22); ctx.lineTo(14,-16); ctx.lineTo(5,-10); ctx.stroke();
      // Base plate
      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(-12, 20, 24, 6); ctx.fill(); ctx.stroke();
    }
  }

  function drawTowers(time) {
    for (const tower of state.towers) {
      const sel = tower === state.selectedTower;
      const { rng } = towerStats(tower);

      // range ring if selected
      if (sel) {
        ctx.save();
        ctx.strokeStyle = tower.type.color;
        ctx.fillStyle   = tower.type.color + "18";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.shadowColor = tower.type.color; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(tower.x, tower.y, rng, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      // boost aura ring
      if (tower.type.archetype === "boost") {
        ctx.save();
        ctx.strokeStyle = tower.type.color;
        ctx.globalAlpha = 0.15 + Math.sin(time*2)*0.06;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 12]);
        ctx.beginPath(); ctx.arc(tower.x, tower.y, rng, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // tower body — canvas silhouette
      ctx.save();
      ctx.translate(tower.x, tower.y + Math.sin(time * 3 + tower.x) * 1.5);
      const scale = 1 + tower.pulse * 0.14;
      ctx.scale(scale, scale);
      ctx.shadowColor = tower.type.color;
      ctx.shadowBlur  = sel ? 32 : 16;
      ctx.globalAlpha = 1;

      // Tier-based color: T1 silver, T2 gold, T3 platinum/violet
      const tierFill = tower.level === 3 ? (tower.branch === "a" ? "#e8d0ff" : tower.branch === "b" ? "#ffe8a0" : "#c8b8f0")
                     : tower.level === 2 ? "#ffd76b" : "#d0ddf0";
      const tierStroke = tower.level === 3 ? (tower.branch ? tower.type.color : "#c981ff")
                       : tower.level === 2 ? "#ffb330" : "#8090b8";
      const tCol = tower.type.color;

      drawTowerSilhouette(tower.type.archetype, tierFill, tierStroke, tCol, tower.level);

      // Tier badge
      ctx.shadowBlur = 0;
      ctx.font = `700 11px 'JetBrains Mono', monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = tierFill;
      ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 3;
      const badge = `T${tower.level}${tower.branch ? tower.branch.toUpperCase() : ""}`;
      ctx.strokeText(badge, 20, -28);
      ctx.fillText(badge, 20, -28);
      ctx.restore();

      // selection ring
      if (sel) {
        ctx.save();
        ctx.strokeStyle = tower.type.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.9 + Math.sin(time*5)*0.1;
        ctx.shadowColor = tower.type.color; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(tower.x, tower.y, 34 + tower.pulse*20, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }

      // crit glow
      if (tower.crit > 0) {
        ctx.save();
        ctx.strokeStyle = "#ffd76b";
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = "#ffd76b"; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(tower.x, tower.y, 38, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ─── Canvas enemy silhouettes ─────────────────────────────────────────────────
  function drawEnemySilhouette(typeId, color, size, isBoss, hpPct) {
    const s = size * 0.52; // scale factor
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1.5;

    if (typeId === "fast") {
      // Lean runner — angled dynamic pose
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, s*0.45, s*0.7, -0.2, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // Head
      ctx.fillStyle = color; ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.arc(s*0.2, -s*0.9, s*0.35, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Speed lines
      ctx.strokeStyle = color; ctx.globalAlpha *= 0.4; ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(-s*1.2, i*s*0.22); ctx.lineTo(-s*0.6, i*s*0.22); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (typeId === "tank") {
      // Blocky brute — rectangular armored body
      ctx.beginPath();
      ctx.roundRect(-s*0.7, -s*0.8, s*1.4, s*1.4, s*0.15);
      ctx.fill(); ctx.stroke();
      // Armor plates
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-s*0.7, -s*0.15); ctx.lineTo(s*0.7, -s*0.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.7, s*0.3);  ctx.lineTo(s*0.7, s*0.3);  ctx.stroke();
      // Shoulder pauldrons
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(-s*0.7, -s*0.4, s*0.25, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc( s*0.7, -s*0.4, s*0.25, 0, Math.PI*2); ctx.fill();
      // Head
      ctx.beginPath(); ctx.arc(0, -s*1.05, s*0.38, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    } else if (typeId === "stealth") {
      // Ghost — wispy translucent shape
      ctx.globalAlpha *= 0.75;
      ctx.beginPath();
      ctx.moveTo(-s*0.5, s*0.6);
      ctx.bezierCurveTo(-s*0.5, s*1.1, -s*0.2, s*0.9, 0, s*0.8);
      ctx.bezierCurveTo(s*0.2, s*0.9, s*0.5, s*1.1, s*0.5, s*0.6);
      ctx.lineTo(s*0.5, -s*0.2);
      ctx.bezierCurveTo(s*0.5, -s*1.1, -s*0.5, -s*1.1, -s*0.5, -s*0.2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Eye gleams
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.strokeStyle = "none";
      ctx.beginPath(); ctx.arc(-s*0.18, -s*0.3, s*0.1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc( s*0.18, -s*0.3, s*0.1, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (typeId === "healer") {
      // Robed healer — hooded figure with cross glow
      // Robe
      ctx.beginPath();
      ctx.moveTo(-s*0.5, s*0.9);
      ctx.lineTo(-s*0.65, s*0.2);
      ctx.bezierCurveTo(-s*0.65, -s*1.0, s*0.65, -s*1.0, s*0.65, s*0.2);
      ctx.lineTo(s*0.5, s*0.9);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Hood
      ctx.beginPath(); ctx.arc(0, -s*0.9, s*0.42, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Cross / healer mark
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(-s*0.08, -s*0.6, s*0.16, s*0.5);
      ctx.fillRect(-s*0.22, -s*0.45, s*0.44, s*0.16);
    } else if (typeId === "splitter") {
      // Cluster — three overlapping orbs
      const clrs = [color, color, color];
      const offsets = [[-s*0.42,-s*0.2],[s*0.42,-s*0.2],[0,s*0.38]];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = color;
        ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8 + i*0.07;
        ctx.beginPath(); ctx.arc(offsets[i][0], offsets[i][1], s*0.48, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Cracks showing splits
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.4, s*0.1); ctx.lineTo(s*0.4, s*0.5); ctx.stroke();
    } else {
      // Boss — crowned giant
      // Body
      ctx.beginPath();
      ctx.roundRect(-s*0.8, -s*0.6, s*1.6, s*1.6, s*0.12);
      ctx.fill(); ctx.stroke();
      // Crown
      ctx.fillStyle = "#ffd76b"; ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s*0.5, -s*0.65);
      ctx.lineTo(-s*0.5, -s*1.2); ctx.lineTo(-s*0.2, -s*0.9);
      ctx.lineTo(0, -s*1.35);
      ctx.lineTo(s*0.2, -s*0.9); ctx.lineTo(s*0.5, -s*1.2);
      ctx.lineTo(s*0.5, -s*0.65);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Eyes
      ctx.fillStyle = "#ff5167";
      ctx.beginPath(); ctx.arc(-s*0.28, -s*0.15, s*0.15, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc( s*0.28, -s*0.15, s*0.15, 0, Math.PI*2); ctx.fill();
      // Glower glow on low HP
      if (hpPct < 0.5) {
        ctx.strokeStyle = "#ff5167"; ctx.lineWidth = 3; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(0, 0, s*1.1, 0, Math.PI*2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawEnemies(time) {
    for (const e of state.enemies) {
      if (e.dead || e.leaked) continue;
      // stealth: semi-transparent if not revealed
      const alpha = (e.stealth && !e.revealed) ? 0.28 : 1;
      const size = e.size;

      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.globalAlpha = alpha;
      ctx.rotate(Math.sin(time * 3 + e.wobble) * 0.06);

      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath(); ctx.ellipse(0, size*0.4, size*0.35, size*0.1, 0, 0, Math.PI*2); ctx.fill();

      // glow halo
      ctx.shadowColor = e.color; ctx.shadowBlur = e.boss ? 36 : 16;

      // Draw silhouette per archetype
      drawEnemySilhouette(e.type.id, e.color, size, e.boss, e.hp / e.maxHp);

      // status rings
      if (e.slowUntil > state.elapsed) {
        ctx.strokeStyle = "#84f3ff"; ctx.lineWidth = 3; ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(0, 0, size*0.7, 0, Math.PI*2); ctx.stroke();
      }
      if (e.stunUntil > state.elapsed) {
        ctx.strokeStyle = "#c981ff"; ctx.lineWidth = 3; ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(0, 0, size*0.7, 0, Math.PI*2); ctx.stroke();
      }
      if (e.dotEffects.length > 0) {
        ctx.strokeStyle = "#66f2ac"; ctx.lineWidth = 2; ctx.globalAlpha = 0.5;
        ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.arc(0, 0, size*0.8, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
      }

      // HP bar — gradient + low-HP shake
      const pct = clamp(e.hp / e.maxHp, 0, 1);
      const bw = size * 1.5, bh = e.boss ? 14 : 8;
      const by = -size * 0.85;
      ctx.globalAlpha = 1;
      // Low HP shake offset
      const shakeX = (pct < 0.25 && !e.dead) ? (Math.random()-0.5)*3 : 0;
      // Background track
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath(); ctx.roundRect(-bw/2 + shakeX, by, bw, bh, bh/2); ctx.fill();
      // HP fill gradient
      const hpGrad = ctx.createLinearGradient(-bw/2 + shakeX, 0, -bw/2 + bw*pct + shakeX, 0);
      if (pct > 0.5) { hpGrad.addColorStop(0,"#52e89a"); hpGrad.addColorStop(1,"#a0ffd6"); }
      else if (pct > 0.2) { hpGrad.addColorStop(0,"#e8b040"); hpGrad.addColorStop(1,"#ffd76b"); }
      else { hpGrad.addColorStop(0,"#cc3048"); hpGrad.addColorStop(1,"#ff5167"); }
      ctx.fillStyle = hpGrad;
      const fillW = Math.max(bh, bw * pct);
      ctx.beginPath(); ctx.roundRect(-bw/2 + shakeX, by, fillW, bh, bh/2); ctx.fill();
      // Shine
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath(); ctx.roundRect(-bw/2 + shakeX, by, fillW, bh*0.4, bh*0.2); ctx.fill();
      ctx.restore();
    }
  }

  function drawPlacementPreview(time) {
    const hover = state.hover;
    if (!hover || state.selectedTower) return;
    const type = TOWER_TYPES.find(t => t.id === state.selectedBuild);
    if (!type) return;
    const pl = placementStatus(hover);
    const color = pl.ok ? type.color : "#ff5167";

    // Nearby grid dots light up
    if (pl.ok) {
      const snapGrid = 80;
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = type.color;
      for (let gx = -4*snapGrid; gx <= 4*snapGrid; gx += snapGrid) {
        for (let gy = -4*snapGrid; gy <= 4*snapGrid; gy += snapGrid) {
          const d = Math.hypot(gx, gy);
          if (d < snapGrid*3) {
            const a = 0.28 * (1 - d/(snapGrid*3));
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.arc(hover.x + gx, hover.y + gy, 3, 0, Math.PI*2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(hover.x, hover.y);
    ctx.shadowColor = color; ctx.shadowBlur = 24;

    // Range ring
    if (pl.ok) {
      ctx.strokeStyle = color + "70";
      ctx.fillStyle   = color + "0e";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.arc(0, 0, type.range, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Pulsing placement ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.8 + Math.sin(time*6)*0.2;
    ctx.beginPath(); ctx.arc(0, 0, 34 + Math.sin(time*5)*4, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;

    // Tower silhouette preview
    ctx.globalAlpha = pl.ok ? 0.75 : 0.3;
    drawTowerSilhouette(type.archetype, type.color + "cc", type.color, type.color, 1);

    ctx.restore();
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      ctx.save();
      if (p.kind === "beam") {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 20;
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.tx, p.ty); ctx.stroke();
      } else if (p.kind === "pulse") {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 18;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke();
      } else if (p.kind === "mortar") {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 18;
        // Canvas mortar shell
        ctx.save();
        ctx.translate(p.x, p.y);
        const mAng = Math.atan2(p.ty - p.y, p.tx - p.x);
        ctx.rotate(mAng + Math.PI/4);
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI*2);
        ctx.fill();
        // Nose
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(7, -7, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      } else {
        // bolt: glowing dot with trail
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = p.glow ? 16 : 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  function drawTexts() {
    ctx.save();
    ctx.font = "900 20px Inter, sans-serif";
    ctx.textAlign = "center";
    for (const t of state.texts) {
      const a = clamp(t.life / 0.9, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle   = t.color;
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth   = 4;
      ctx.strokeText(t.value, t.x, t.y);
      ctx.fillText(t.value, t.x, t.y);
    }
    ctx.restore();
  }

  function drawFreezeOverlay() {
    const rem = state.freezeUntil - state.elapsed;
    ctx.save();
    // Tint
    ctx.fillStyle = "rgba(77,200,255,0.09)";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    // Animated border — clock tick pulse
    const pulse = (Math.sin(state.elapsed * 8) + 1) * 0.5;
    ctx.strokeStyle = `rgba(77,232,255,${0.25 + pulse * 0.25})`;
    ctx.lineWidth = 7;
    ctx.shadowColor = "rgba(77,232,255,0.5)";
    ctx.shadowBlur  = 20 + pulse * 16;
    ctx.strokeRect(4, 4, BASE_W-8, BASE_H-8);
    // Snowflake / clock icon center fade
    ctx.globalAlpha = 0.25 + pulse * 0.1;
    ctx.fillStyle = "rgba(77,232,255,0.22)";
    ctx.font = "bold 18px 'JetBrains Mono',monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowBlur = 0;
    ctx.fillText(`FROZEN · ${Math.ceil(rem)}s`, BASE_W/2, 36);
    ctx.restore();
  }

  // ─── Era Storm AOE pulse ──────────────────────────────────────────────────────
  function drawEraStormPulse(time) {
    if (!state._eraStormPulse) return;
    const p = state._eraStormPulse;
    const age = state.elapsed - p.start;
    const dur = 1.2;
    if (age > dur) { state._eraStormPulse = null; return; }
    const frac = age / dur;
    const r = frac * Math.max(BASE_W, BASE_H);
    const a = (1 - frac) * 0.6;
    const map = MAPS[state.currentMap];
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = map.color;
    ctx.shadowColor = map.color;
    ctx.shadowBlur  = 28;
    ctx.lineWidth   = 6 - frac*5;
    ctx.beginPath(); ctx.arc(BASE_W/2, BASE_H/2, r, 0, Math.PI*2); ctx.stroke();
    // Secondary ring
    ctx.globalAlpha = a * 0.5;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(BASE_W/2, BASE_H/2, r*0.72, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // ─── End-game overlay (DOM) ───────────────────────────────────────────────────
  function showEndGameOverlay(victory) {
    if (document.getElementById("runSummary")) return;
    const map = MAPS[state.currentMap];
    const kills = state.towers.reduce((s,t) => s+(t.kills||0), 0) + (state._totalKills||0);
    const acc = state.answered ? Math.round(state.correct/state.answered*100) : 0;
    const runTime = Math.round(state.elapsed / 60);
    const el = document.createElement("div");
    el.className = "run-summary";
    el.id = "runSummary";
    el.innerHTML = `
      <div class="run-summary-card">
        <h2>${victory ? "Victory!" : "Fell in Battle"}</h2>
        <p class="sub-head">${map.name} · ${map.era} · Wave ${state.wave}</p>
        <div class="run-stats">
          <div class="run-stat"><span class="val">${state.wave}</span><span class="lbl">Waves</span></div>
          <div class="run-stat"><span class="val">${state.score.toLocaleString()}</span><span class="lbl">Score</span></div>
          <div class="run-stat"><span class="val">${acc}%</span><span class="lbl">Accuracy</span></div>
          <div class="run-stat"><span class="val">${state.correct}</span><span class="lbl">Correct</span></div>
          <div class="run-stat"><span class="val">${state.answered}</span><span class="lbl">Questions</span></div>
          <div class="run-stat"><span class="val">${runTime}m</span><span class="lbl">Run Time</span></div>
        </div>
        <div class="run-cta">
          <button class="primary" id="runRestart" type="button">Play Again</button>
          <button id="runQuit" type="button">Exit</button>
        </div>
      </div>`;
    document.querySelector(".stage").appendChild(el);
    document.getElementById("runRestart")?.addEventListener("click", () => {
      el.remove(); resetGame();
    });
    document.getElementById("runQuit")?.addEventListener("click", () => {
      window.location.href = "../../index.html";
    });
  }

  // ─── Reset / end ─────────────────────────────────────────────────────────────
  function resetGame(full = true) {
    // Wave 5 — clear stale snapshot when starting a fresh run
    try {
      if (full && window.MrMacsSessions) window.MrMacsSessions.clear("chrono-defense");
      if (full && state.__wave5SnapTimer) { clearInterval(state.__wave5SnapTimer); state.__wave5SnapTimer = null; }
    } catch (e) {}
    if (full) state.wave = 0;
    state.lives = state.maxLives;
    state.insight = 600;
    state.score = 0;
    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.betweenWaves = true;
    state.enemies = [];
    state.towers = [];
    state.projectiles = [];
    state.particles = [];
    state.texts = [];
    state.spawnQueue = [];
    state.streak = 0;
    state.correct = 0;
    state.answered = 0;
    state.baseDamageThisRun = 0;
    state.selectedTower = null;
    state.freezeUntil = 0;
    state.shake = 0;
    state.reactorFlash = 0;
    state.speed = 1;
    state._totalKills = 0;
    state._eraStormPulse = null;
    document.getElementById("runSummary")?.remove();
    els.speedBtn.textContent = "1× Speed";
    els.startWave.disabled = false;
    els.pauseBtn.textContent = "Pause";
    updateHud();
    updateSelectedPanel();
    showBanner("Reset — Build & Defend");
  }

  function endGame(victory = false) {
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch (e) {}
    state.gameOver = true;
    state.running = false;
    const map = MAPS[state.currentMap];
    if (state.wave > (state.bestWave[state.currentMap] || 0)) {
      state.bestWave[state.currentMap] = state.wave;
    }
    persistProgress();
    showBanner(victory ? `Victory! All 30 Waves Survived` : `Wave ${state.wave} · Mission Failed`);
    setTimeout(() => showEndGameOverlay(victory), 1600);
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "chrono-defense-infinite",
      title: "Chrono Defense Infinite",
      score: state.score, wave: state.wave, map: map.id,
      accuracy: state.answered ? Math.round(state.correct / state.answered * 100) : 0
    }, { counter: "game-completions" });
    // Wave 5 — leaderboard submit + session clear
    try {
      if (state.__wave5SnapTimer) { clearInterval(state.__wave5SnapTimer); state.__wave5SnapTimer = null; }
      if (window.MrMacsSessions) window.MrMacsSessions.clear("chrono-defense");
    } catch (e) {}
    try {
      if (window.MrMacsLeaderboards) {
        const result = window.MrMacsLeaderboards.submit("chrono-defense", state.wave, {
          score: state.score, map: map.id, victory: !!victory,
          accuracy: state.answered ? Math.round(state.correct / state.answered * 100) : 0
        });
        if (result && result.isNewRecord && window.MrMacsToast) {
          window.MrMacsToast.push({ icon: "🏆", title: "New high score!", sub: "Rank #" + result.rank, tone: "good", ms: 4200 });
        } else if (result && window.MrMacsToast) {
          window.MrMacsToast.push({ icon: "🏅", title: "Top 5 score", sub: "Rank #" + result.rank, tone: "good", ms: 3600 });
        }
      }
    } catch (e) {}
  }

  function persistProgress() {
    writeSave({
      mapsUnlocked: state.mapsUnlocked,
      bestWave: state.bestWave,
      totalShards: state.totalShards
    });
  }

  // ─── Misc helpers ─────────────────────────────────────────────────────────────
  function esc(v) {
    return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function canvasPoint(event) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * BASE_W / rect.width,
      y: (event.clientY - rect.top)  * BASE_H / rect.height
    };
  }

  function showBanner(text, isBoss = false) {
    els.waveBanner.textContent = text;
    els.waveBanner.classList.remove("show", "boss-wave");
    void els.waveBanner.offsetWidth;
    if (isBoss) els.waveBanner.classList.add("boss-wave");
    els.waveBanner.classList.add("show");
  }

  function setQuestionCollapsed(v) {
    state.questionCollapsed = v;
    els.questionConsole.classList.toggle("is-collapsed", v);
    els.toggleQuestion.setAttribute("aria-expanded", String(!v));
    els.reactorDock.setAttribute("aria-expanded", String(!v));
    els.reactorDock.textContent = v ? "Show Question Panel" : "Hide Question Panel";
    if (!v && els.typedForm.style.display !== "none") els.typedAnswer.focus({ preventScroll: true });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  }

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r=8) {
      this.beginPath();
      this.moveTo(x+r,y); this.lineTo(x+w-r,y); this.quadraticCurveTo(x+w,y,x+w,y+r);
      this.lineTo(x+w,y+h-r); this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      this.lineTo(x+r,y+h); this.quadraticCurveTo(x,y+h,x,y+h-r);
      this.lineTo(x,y+r); this.quadraticCurveTo(x,y,x+r,y); this.closePath();
      return this;
    };
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────────
  async function init() {
    activateMap(0);
    // ─── MrMacsProfile boot hooks ─────────────────────────────────────────────
    if (window.MrMacsProfile) {
      MrMacsProfile.recordPlay({
        id: "chrono-defense",
        title: "Chrono Defense",
        course: "All Courses",
        file: "games/chrono-defense/index.html"
      });
      // Sync profile sound setting to game
      const profileSettings = MrMacsProfile.getSettings();
      if (profileSettings && profileSettings.sound === "off") {
        state.sound = false;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    const res = await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
    state.bank = await res.json();
    state.bank.questions = (state.bank.questions || []).filter(isPlayable);
    initFilters();
    initControls();
    renderTowerList();
    renderAbilities();
    renderMapSelect();
    applyFilters();
    updateHud();
    updateSelectedPanel();
    els.missionTitle.textContent = "Build · Answer · Defend";
    els.missionText.textContent = "Place towers, survive 30 waves per map, answer questions to power up. Four era maps unlock progressively.";
    // Setup-screen extras (resume card + top-5 leaderboard)
    try { initSetupExtras(); } catch (e) {}
    if (matchMedia("(max-width: 1120px) and (orientation: landscape)").matches) setQuestionCollapsed(true);
    prepareQuestion();
    requestAnimationFrame(loop);

    // Phase 3 — first-run tour (fires after first map load, once per game ID)
    if (window.MrMacsArcadeTour) {
      const tourSteps = [
        {
          target: "#towerList",
          title: "5 tower archetypes",
          body: "Sniper hits stealth, Cannon splashes, Cryo slows, Plague poisons over time, Boost amps neighbors."
        },
        {
          target: "#arena",
          title: "Place + upgrade",
          body: "Tap a road-adjacent cell, pick a tower. Tap your tower again to upgrade or sell at 70%."
        },
        {
          target: "#waveProgress",
          title: "30 waves per map",
          body: "Bosses every 5 waves, double bosses on 10. Beat wave 30 to unlock the next era map."
        },
        {
          target: "#powerList",
          title: "Special abilities",
          body: "Time Stop / Era Storm / Reinforcements — long cooldowns. Save them for boss waves."
        }
      ];
      MrMacsArcadeTour.start("chrono-defense", tourSteps);
    }
  }

  // ─── Setup-screen extras: resume card + top-5 leaderboard ────────────────
  function _cdFmtAgo(ts) {
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
  function _cdSafe(v) {
    return String(v == null ? "" : v).replace(/[<>&"]/g, c =>
      c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;");
  }
  function initSetupExtras() {
    renderResumeCard();
    renderLeaderboardPanel();
  }
  function renderResumeCard() {
    const card = document.getElementById("resumeCard");
    if (!card) return;
    if (!window.MrMacsSessions) { card.hidden = true; return; }
    let prev = null;
    try { prev = window.MrMacsSessions.load("chrono-defense"); } catch (e) {}
    if (!prev || !prev.state || !prev.ts) { card.hidden = true; return; }
    if (Date.now() - prev.ts > 24 * 3600 * 1000) { card.hidden = true; return; }
    const s = prev.state || {};
    const wave = s.wave || 1;
    const mapId = s.map || "industrial";
    card.hidden = false;
    card.innerHTML =
      '<div class="resume-card-head">' +
        '<span class="resume-card-title">Resume your run?</span>' +
        '<span class="resume-card-time">' + _cdSafe(_cdFmtAgo(prev.ts)) + '</span>' +
      '</div>' +
      '<div class="resume-card-meta">Wave ' + wave + ' · map ' + _cdSafe(mapId) + '</div>' +
      '<div class="resume-card-actions">' +
        '<button type="button" class="resume-btn resume-btn--primary" id="resumeRunBtn">Resume</button>' +
        '<button type="button" class="resume-btn" id="resumeFreshBtn">Start fresh</button>' +
      '</div>';
    const resumeBtn = card.querySelector("#resumeRunBtn");
    const freshBtn  = card.querySelector("#resumeFreshBtn");
    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => {
        // Best-effort: jump to the saved map (so the player keeps their era)
        // without restoring towers — Chrono Defense rebuilds the playfield
        // from scratch each run. Toast acknowledges the prior progress.
        try {
          if (Array.isArray(MAPS)) {
            const idx = MAPS.findIndex(m => m && m.id === mapId);
            if (idx >= 0) activateMap(idx);
          }
        } catch (e) {}
        try {
          if (window.MrMacsToast) window.MrMacsToast.push({
            icon: "⏯", title: "Resuming on " + _cdSafe(mapId),
            sub: "Build towers — last run reached wave " + wave, tone: "info", ms: 3500
          });
        } catch (e) {}
        card.hidden = true;
      });
    }
    if (freshBtn) {
      freshBtn.addEventListener("click", () => {
        try { window.MrMacsSessions.clear("chrono-defense"); } catch (e) {}
        card.hidden = true;
      });
    }
  }
  function renderLeaderboardPanel() {
    const panel = document.getElementById("leaderboardPanel");
    if (!panel) return;
    if (!window.MrMacsLeaderboards) { panel.hidden = true; return; }
    let rows = [];
    try { rows = window.MrMacsLeaderboards.top("chrono-defense", 5) || []; } catch (e) { rows = []; }
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
          '<span class="lb-avatar">' + _cdSafe(r.avatar || "") + '</span>' +
          '<span class="lb-name">' + _cdSafe(r.name || "Trainer") + '</span>' +
          '<span class="lb-score">' + Math.round(r.score || 0).toLocaleString() + '</span>' +
          '<span class="lb-ago">' + _cdSafe(_cdFmtAgo(r.ts || 0)) + '</span>' +
        '</li>'
      ).join("") +
      '</ol>';
  }

  init().catch(err => {
    console.error("Chrono Defense init failed:", err);
    if (els.missionTitle) els.missionTitle.textContent = "Engine failed to load";
    if (els.missionText)  els.missionText.textContent  = "Question bank or network error. Tap Reset, then refresh the page.";
    if (els.feedback) {
      els.feedback.textContent = "If the problem persists, check your connection.";
      els.feedback.className = "feedback bad";
    }
  });
})();
