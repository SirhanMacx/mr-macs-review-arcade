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
  const liteFx = new URLSearchParams(location.search).get("fx") !== "full";
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
      icon: "🎯"
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
      icon: "💣"
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
      icon: "❄️"
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
      icon: "☣️"
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
      icon: "⚡"
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
  const ABILITIES = [
    {
      id: "timestop",
      name: "Time Stop",
      desc: "Freeze all enemies for 5 sec",
      cost: 0, cooldown: 45, duration: 5,
      color: "#84f3ff", icon: "⏸"
    },
    {
      id: "erastorm",
      name: "Era Storm",
      desc: "Industrial Smog: heavy AOE damage",
      cost: 0, cooldown: 60, duration: 0,
      color: "#ff8d4d", icon: "🌪"
    },
    {
      id: "reinforce",
      name: "Reinforcements",
      desc: "Place 1-2 free random towers",
      cost: 0, cooldown: 50, duration: 0,
      color: "#66f2ac", icon: "🏗"
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
    totalShards: save.totalShards || 0
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
    addText(e.x, e.y, `-${e.damage}❤`, "#ff6479");
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
      state.shake = 1.2;
      addText(e.x, e.y - 40, `+${shards} BOSS!`, "#ffd76b");
      if (state.sound) audio.abilityStinger();
    } else {
      addBurstAt(e.x, e.y, e.color, 18);
      addText(e.x, e.y, `+${shards}`, "#66f2ac");
      if (state.sound) audio.pop();
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
      showBanner("⏸ Time Stop");
    }
    if (id === "erastorm") {
      const dmg = 120 + state.wave * 12;
      for (const e of state.enemies) {
        if (!e.dead && !e.leaked) damageEnemy(e, dmg * (e.boss ? 0.5 : 1), null);
      }
      addBurstAt(BASE_W / 2, BASE_H / 2, "#ff8d4d", 80);
      state.shake = 0.8;
      showBanner("🌪 Era Storm");
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
      showBanner("🏗 Reinforcements");
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

    const bossWave = state.wave % 10 === 0;
    const midBoss  = state.wave % 5 === 0 && !bossWave;
    const typeList = buildWaveComposition(state.wave, MAPS[state.currentMap].id);
    const interval = Math.max(0.08, 0.38 - state.wave * 0.008);
    state.spawnQueue = typeList.map((t, i) => ({ type: t, delay: i === 0 ? 0 : interval }));
    state.spawnTimer = 0;

    const mapName = MAPS[state.currentMap].name;
    const bannerText = bossWave
      ? `Wave ${state.wave}: ${mapName} BOSS ASSAULT`
      : midBoss
        ? `Wave ${state.wave}: Elite Strike — ${mapName}`
        : `Wave ${state.wave}: ${mapName} Incursion`;
    showBanner(bannerText);

    state.score += state.wave * 25;
    updateHud();
    if (state.sound) {
      audio.waveStart();
      if (bossWave || midBoss) setTimeout(() => audio.bossRoar(), 600);
    }

    // queue a question in ~8 sec
    state.questionCooldown = 6 + Math.random() * 6;
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
      endGame(true);
      return;
    }

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
    if (correct) {
      state.correct++;
      state.streak++;
      const reward = 80 + Math.min(120, state.streak * 8) + state.wave * 3;
      state.insight += reward;
      state.score += 200 + state.streak * 30 + state.wave * 10;
      // question effect: cycle through crit, voucher, slowtime
      const roll = Math.random();
      if (roll < 0.40) {
        // crit: next tower shot is 2.2× damage for 4s
        state.towers.forEach(t => t.crit = 4);
        addText(BASE_W/2, BASE_H/2 - 40, "CRIT ACTIVE!", "#ffd76b");
      } else if (roll < 0.70) {
        // slow time 5 sec
        state.freezeUntil = state.elapsed + 5;
        addText(BASE_W/2, BASE_H/2 - 40, "SLOW TIME!", "#84f3ff");
      } else {
        // precision strike bonus
        precisionStrike(80 + state.wave * 8);
      }
      state.reactorFlash = 1;
      els.feedback.textContent = `Correct! ${q.explanation || q.answer} +${reward}`;
      els.feedback.className = "feedback good";
      if (state.sound) audio.correct();
    } else {
      state.streak = 0;
      state.score = Math.max(0, state.score - 30);
      // wrong: brief enemy speed boost
      state.enemies.forEach(e => { if (!e.dead && !e.leaked) e.speed *= 1.1; });
      setTimeout(() => state.enemies.forEach(e => { if (!e.dead && !e.leaked) e.speed /= 1.1; }), 4000);
      els.feedback.textContent = `Not quite. Answer: ${q.answer}. ${q.explanation||""}`;
      els.feedback.className = "feedback bad";
      if (state.sound) audio.wrong();
    }
    updateHud();
    els.questionStreak.textContent = `${state.streak} streak`;
    // in combat, prepare next question after delay
    setTimeout(() => {
      state.currentQuestion = null;
      prepareQuestion();
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
      els.soundBtn.textContent = state.sound ? "🔊 Sound" : "🔇 Muted";
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
      els.upgradeText.textContent = type ? `${type.icon} ${type.name}: ${type.role}. Cost: ${type.cost} shards.` : "";
      els.upgradePreview.textContent = type ? type.icon : "";
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
    els.upgradePreview.textContent = tower.type.icon;
    els.sellBtn.disabled = false;
    renderTowerList();
  }

  // ─── Tower / Ability list rendering ──────────────────────────────────────────
  function renderTowerList() {
    els.towerList.innerHTML = TOWER_TYPES.map(t => `
      <button class="tower-card ${t.id === state.selectedBuild ? "active" : ""}" type="button" data-tower="${t.id}">
        <span class="tower-icon-emoji">${t.icon}</span>
        <span><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></span>
        <em class="cost">${t.cost}</em>
      </button>
    `).join("");
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
      return `
        <button class="power-card ${ready ? "" : "cooling"}" type="button" data-ability="${ab.id}">
          <span class="ability-icon">${ab.icon}</span>
          <span><strong>${esc(ab.name)}</strong><span>${esc(ab.desc)}</span></span>
          <em class="cost">${ready ? "READY" : rem + "s"}</em>
        </button>`;
    }).join("");
  }

  function renderMapSelect() {
    if (!els.mapSelect) return;
    els.mapSelect.innerHTML = MAPS.map((m, i) => {
      const locked = !state.mapsUnlocked[i];
      return `<option value="${i}" ${locked ? "disabled" : ""} ${i === state.currentMap ? "selected" : ""}>${locked ? "🔒 " : ""}${esc(m.name)} ${locked ? "(locked)" : "· Wave " + (state.bestWave[i] || 0) + " best"}</option>`;
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
    ctx.restore();
  }

  function drawBackground(time) {
    // dark base
    ctx.fillStyle = "#02050b";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    // era-themed tint
    const map = MAPS[state.currentMap];
    ctx.fillStyle = map.bgTint;
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    // animated grid
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = map.color;
    ctx.lineWidth = 1;
    const gridSize = 80;
    const offset = (time * 20) % gridSize;
    for (let x = -gridSize + offset; x < BASE_W + gridSize; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
    }
    for (let y = -gridSize + offset * 0.5; y < BASE_H + gridSize; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
    }
    ctx.restore();

    // subtle vignette
    const grd = ctx.createRadialGradient(BASE_W/2, BASE_H/2, BASE_H*0.3, BASE_W/2, BASE_H/2, BASE_H);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  }

  function drawPath(time) {
    if (!state.route.length) return;
    const map = MAPS[state.currentMap];

    // glow outer
    ctx.save();
    ctx.strokeStyle = map.color;
    ctx.shadowColor  = map.color;
    ctx.shadowBlur   = 18;
    ctx.lineWidth    = 14;
    ctx.globalAlpha  = 0.12;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(state.route[0].x, state.route[0].y);
    for (const pt of state.route) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    // solid road
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth   = 6;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(state.route[0].x, state.route[0].y);
    for (const pt of state.route) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    // animated dash arrow
    ctx.save();
    ctx.setLineDash([24, 40]);
    ctx.lineDashOffset = -time * 55;
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(state.route[0].x, state.route[0].y);
    for (const pt of state.route) ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    // reactor flash
    if (state.reactorFlash > 0) {
      ctx.save();
      ctx.globalAlpha = state.reactorFlash * 0.5;
      ctx.strokeStyle = "#ffd76b";
      ctx.shadowColor = "#ffd76b";
      ctx.shadowBlur  = 28;
      ctx.lineWidth   = 8 + state.reactorFlash * 10;
      ctx.setLineDash([30, 20]);
      ctx.lineDashOffset = -time * 160;
      ctx.beginPath();
      ctx.moveTo(state.route[0].x, state.route[0].y);
      for (const pt of state.route) ctx.lineTo(pt.x, pt.y);
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

      // tower body
      ctx.save();
      ctx.translate(tower.x, tower.y + Math.sin(time * 3 + tower.x) * 1.5);
      const scale = 1 + tower.pulse * 0.15;
      ctx.scale(scale, scale);
      ctx.shadowColor = tower.type.color;
      ctx.shadowBlur  = sel ? 28 : 14;

      // draw emoji tower sprite
      ctx.font = `${40 + tower.level * 8}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.globalAlpha = 1;
      ctx.fillText(tower.type.icon, 0, 0);

      // tier badge
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillStyle = tower.type.color;
      ctx.shadowBlur = 0;
      ctx.fillText(`T${tower.level}${tower.branch ? tower.branch.toUpperCase() : ""}`, 24, -26);
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

      // glow
      ctx.shadowColor = e.color; ctx.shadowBlur = e.boss ? 30 : 14;
      ctx.font = `${size * 1.3}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";

      // pick emoji per archetype
      const emoji = {
        fast: "💨", tank: "🛡", stealth: "👻", healer: "💚", splitter: "💥", boss: "👹"
      }[e.type.id] || "👾";
      ctx.fillText(emoji, 0, 0);

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

      // HP bar
      const pct = clamp(e.hp / e.maxHp, 0, 1);
      const bw = size * 1.4, bh = e.boss ? 12 : 7;
      const by = -size * 0.7;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(-bw/2, by, bw, bh);
      ctx.fillStyle = pct > 0.5 ? "#66f2ac" : pct > 0.2 ? "#ffd76b" : "#ff6479";
      ctx.fillRect(-bw/2, by, bw * pct, bh);
      ctx.restore();
    }
  }

  function drawPlacementPreview(time) {
    const hover = state.hover;
    if (!hover || state.selectedTower) return;
    const type = TOWER_TYPES.find(t => t.id === state.selectedBuild);
    if (!type) return;
    const pl = placementStatus(hover);
    const color = pl.ok ? type.color : "#ff6479";
    ctx.save();
    ctx.translate(hover.x, hover.y);
    ctx.globalAlpha = 0.7;
    ctx.shadowColor = color; ctx.shadowBlur = 20;
    // range preview
    if (pl.ok) {
      ctx.strokeStyle = color + "88";
      ctx.fillStyle   = color + "14";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, type.range, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
    }
    // pulsing ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 36 + Math.sin(time*5)*3, 0, Math.PI*2); ctx.stroke();
    // icon
    ctx.font = "40px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.globalAlpha = pl.ok ? 0.85 : 0.4;
    ctx.fillText(type.icon, 0, 0);
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
        ctx.font = "28px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("💣", p.x, p.y);
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
    ctx.save();
    ctx.fillStyle = "rgba(132,243,255,0.07)";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.strokeStyle = "rgba(132,243,255,0.3)";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, BASE_W-6, BASE_H-6);
    ctx.restore();
  }

  // ─── Reset / end ─────────────────────────────────────────────────────────────
  function resetGame(full = true) {
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
    state.selectedTower = null;
    state.freezeUntil = 0;
    state.shake = 0;
    state.reactorFlash = 0;
    state.speed = 1;
    els.speedBtn.textContent = "1× Speed";
    els.startWave.disabled = false;
    els.pauseBtn.textContent = "Pause";
    updateHud();
    updateSelectedPanel();
    showBanner("Reset — Build & Defend");
  }

  function endGame(victory = false) {
    state.gameOver = true;
    state.running = false;
    const map = MAPS[state.currentMap];
    if (state.wave > (state.bestWave[state.currentMap] || 0)) {
      state.bestWave[state.currentMap] = state.wave;
    }
    persistProgress();
    showBanner(victory ? `Victory! All 30 waves survived — ${map.name}` : `Game Over — Wave ${state.wave} on ${map.name}`);
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "chrono-defense-infinite",
      title: "Chrono Defense Infinite",
      score: state.score, wave: state.wave, map: map.id,
      accuracy: state.answered ? Math.round(state.correct / state.answered * 100) : 0
    }, { counter: "game-completions" });
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

  function showBanner(text) {
    els.waveBanner.textContent = text;
    els.waveBanner.classList.remove("show");
    void els.waveBanner.offsetWidth;
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
    if (matchMedia("(max-width: 1120px) and (orientation: landscape)").matches) setQuestionCollapsed(true);
    prepareQuestion();
    requestAnimationFrame(loop);
  }

  init().catch(err => {
    console.error(err);
    els.missionTitle.textContent = "Engine failed to load";
    els.missionText.textContent = "Refresh the page. Question bank or network error.";
  });
})();
