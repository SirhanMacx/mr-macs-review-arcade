/* ===========================================================================
   Archive Tycoon — Idle clicker · Mr. Mac's Review Arcade
   ---------------------------------------------------------------------------
   Click the central "Scribble" button to produce knowledge. Knowledge buys
   auto-producers (apprentice → scribe → manuscript press → library →
   university → research institute → knowledge engine). Each producer has
   an exponential cost curve (1.15x per purchase). Curated upgrade tree
   provides per-producer and global multipliers. At 1B knowledge, the player
   can publish the archive (prestige) — reset everything for permanent +1%
   global production per published volume. Scholar challenges appear every
   ~4 minutes — correct review answer = +25% global production for 5 minutes
   plus 12 shards. Five power-ups, three lives, autosave every 10s.
   =========================================================================== */
(function () {
  "use strict";

  // ─── Constants / configuration ─────────────────────────────────────────────
  const CANVAS_SIZE = 720;
  const PRESTIGE_THRESHOLD = 1_000_000_000; // 1B knowledge to publish
  const COST_GROWTH = 1.15;
  const MAX_PRODUCER_OWNED = 9999; // hard cap to prevent Infinity cost overflow
  const KNOWLEDGE_HARD_CAP = 1e15; // numeric stability — below MAX_SAFE_INTEGER (~9e15)
  const SCHOLAR_INTERVAL_MS = 240_000; // ~4 minutes
  const SCHOLAR_INTERVAL_JITTER = 60_000;
  const SCHOLAR_BOOST_DURATION_MS = 300_000; // 5 minutes
  const SCHOLAR_BOOST_MULTIPLIER = 1.25;
  const SCHOLAR_SHARD_REWARD = 12;
  const AUTOSAVE_INTERVAL_MS = 10_000;
  const SAVE_KEY = "mr-macs-archive-tycoon-save-v1";
  const STARTING_LIVES = 3;
  const POWERUP_DROP_CHANCE_PER_TICK = 0.0008; // each 100ms tick
  const SHARDS_CAP = 200; // per-session cap (matches sibling games)
  const OFFLINE_RATE = 0.25; // 25% of online production
  const OFFLINE_CAP_HOURS = 4; // 4-hour offline cap (was 8h * 50%)
  const SKIP_TIME_FLOOR = 60; // skip-time grants at least 60s of click-equivalent
  const REDUCED_MOTION = (typeof window !== "undefined" && window.matchMedia)
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const PRODUCERS = [
    { id: "apprentice", name: "Apprentice", short: "App", baseRate: 1,    baseCost: 25,        glyph: "Ap" },
    { id: "scribe",     name: "Scribe",     short: "Scr", baseRate: 8,    baseCost: 200,       glyph: "Sc" },
    { id: "press",      name: "Manuscript Press", short: "Press", baseRate: 40,   baseCost: 1_000,      glyph: "Mp" },
    { id: "library",    name: "Library",    short: "Lib", baseRate: 200,  baseCost: 8_000,      glyph: "Lb" },
    { id: "university", name: "University", short: "Uni", baseRate: 1_000, baseCost: 40_000,     glyph: "Un" },
    { id: "institute",  name: "Research Institute", short: "Res", baseRate: 5_000, baseCost: 250_000,    glyph: "Re" },
    { id: "engine",     name: "Knowledge Engine", short: "Eng", baseRate: 25_000, baseCost: 1_500_000,  glyph: "En" }
  ];

  // Per-producer tier upgrades (5 tiers each, 2x mult, cost scales with tier)
  function buildProducerUpgrades() {
    const list = [];
    PRODUCERS.forEach((p, idx) => {
      const tierThresholds = [10, 25, 50, 100, 200];
      const tierCostMultiplier = [10, 50, 250, 1500, 10000];
      for (let t = 0; t < 5; t++) {
        list.push({
          id: `${p.id}-tier${t + 1}`,
          producerId: p.id,
          name: `${p.name} Tier ${t + 1}`,
          effect: `2× ${p.short} production`,
          cost: p.baseCost * tierCostMultiplier[t],
          tier: t + 1,
          icon: ["I", "II", "III", "IV", "V"][t],
          requiresOwned: tierThresholds[t],
          kind: "producer-mult"
        });
      }
    });
    return list;
  }

  // Global upgrades (click power and all-producers multipliers)
  const GLOBAL_UPGRADES = [
    { id: "click-2x-1",   name: "Sharp Quill",      effect: "2× click power",         cost: 500,        kind: "click-mult",   icon: "Q" },
    { id: "click-2x-2",   name: "Iron Stylus",      effect: "2× click power",         cost: 25_000,     kind: "click-mult",   icon: "S" },
    { id: "click-2x-3",   name: "Master's Pen",     effect: "2× click power",         cost: 1_000_000,  kind: "click-mult",   icon: "P" },
    { id: "click-2x-4",   name: "Calligraphy Set",  effect: "2× click power",         cost: 50_000_000, kind: "click-mult",   icon: "C" },
    { id: "global-2x-1",  name: "Editorial Board",  effect: "2× all producers",       cost: 75_000,     kind: "global-mult",  icon: "E" },
    { id: "global-2x-2",  name: "Peer Review",      effect: "2× all producers",       cost: 5_000_000,  kind: "global-mult",  icon: "R" },
    { id: "global-2x-3",  name: "Royal Charter",    effect: "2× all producers",       cost: 250_000_000,kind: "global-mult",  icon: "C" }
  ];

  // ─── 28 inline scholar challenge questions (mixed social-studies review) ───
  const SCHOLAR_QUESTIONS = [
    {
      prompt: "Which Renaissance figure painted the Sistine Chapel ceiling?",
      choices: ["Donatello", "Michelangelo", "Raphael", "Leonardo da Vinci"],
      correct: 1,
      explain: "Michelangelo painted the Sistine Chapel ceiling between 1508-1512 for Pope Julius II."
    },
    {
      prompt: "The Magna Carta (1215) is significant because it...",
      choices: [
        "established absolute monarchy in England",
        "limited the power of the king under law",
        "founded the Church of England",
        "ended the Hundred Years' War"
      ],
      correct: 1,
      explain: "The Magna Carta established that even the king was subject to the law — a foundation of constitutional government."
    },
    {
      prompt: "The printing press developed by Gutenberg c.1450 most directly accelerated...",
      choices: ["the Crusades", "the spread of literacy and ideas", "feudal manor decline", "the bubonic plague"],
      correct: 1,
      explain: "Movable-type printing dramatically lowered the cost of books and accelerated the spread of literacy and the Reformation."
    },
    {
      prompt: "Which document declared 'all men are created equal'?",
      choices: ["U.S. Constitution", "Bill of Rights", "Declaration of Independence", "Federalist Papers"],
      correct: 2,
      explain: "Thomas Jefferson's 1776 Declaration of Independence opens with 'all men are created equal.'"
    },
    {
      prompt: "The Industrial Revolution began in the late 1700s in...",
      choices: ["France", "Great Britain", "Germany", "the United States"],
      correct: 1,
      explain: "Britain's coal, capital, colonies, and stable government gave it the conditions for industrialization to take root first."
    },
    {
      prompt: "Karl Marx and Friedrich Engels wrote the...",
      choices: ["Wealth of Nations", "Communist Manifesto", "Social Contract", "Leviathan"],
      correct: 1,
      explain: "The 1848 Communist Manifesto called for workers to overthrow capitalism."
    },
    {
      prompt: "World War I began in 1914 with the assassination of...",
      choices: [
        "Tsar Nicholas II",
        "Archduke Franz Ferdinand",
        "Kaiser Wilhelm II",
        "Otto von Bismarck"
      ],
      correct: 1,
      explain: "Gavrilo Princip's assassination of Archduke Franz Ferdinand in Sarajevo triggered the alliance system into war."
    },
    {
      prompt: "The Treaty of Versailles (1919) is most associated with...",
      choices: [
        "the rise of the Soviet Union",
        "harsh terms imposed on Germany",
        "the founding of the United Nations",
        "decolonization of Africa"
      ],
      correct: 1,
      explain: "The treaty's reparations and 'war guilt' clause fueled German resentment that Hitler later exploited."
    },
    {
      prompt: "The Russian Revolution of 1917 brought to power the...",
      choices: ["Mensheviks", "Bolsheviks", "Whites", "Provisional Government"],
      correct: 1,
      explain: "Lenin's Bolsheviks seized power in the October Revolution, replacing the Provisional Government."
    },
    {
      prompt: "Mahatma Gandhi led India to independence using the strategy of...",
      choices: ["armed insurrection", "satyagraha — nonviolent civil disobedience", "religious conversion", "diplomatic alliances with the USSR"],
      correct: 1,
      explain: "Gandhi's satyagraha movement used nonviolent resistance — boycotts, marches, fasts — to pressure British rule."
    },
    {
      prompt: "The Great Depression (1929) is most directly tied to...",
      choices: ["WWI reparations alone", "the U.S. stock market crash", "the Russian Revolution", "the Spanish Flu"],
      correct: 1,
      explain: "The October 1929 crash triggered global economic collapse, bank failures, and mass unemployment."
    },
    {
      prompt: "The Holocaust refers to the systematic genocide of...",
      choices: [
        "Armenians by the Ottoman Empire",
        "Six million Jews and millions of others by Nazi Germany",
        "Native peoples by European colonizers",
        "Cambodians by the Khmer Rouge"
      ],
      correct: 1,
      explain: "Nazi Germany systematically murdered six million Jews, plus Roma, disabled people, political prisoners, and others."
    },
    {
      prompt: "The Cold War was a geopolitical struggle primarily between...",
      choices: [
        "the U.S. and China",
        "the U.S. and the USSR",
        "the UK and Germany",
        "France and the USSR"
      ],
      correct: 1,
      explain: "The Cold War (1947-1991) was the post-WWII rivalry between the capitalist U.S. and communist Soviet Union."
    },
    {
      prompt: "The Marshall Plan (1948) was a U.S. program to...",
      choices: [
        "rebuild war-torn Western Europe",
        "contain communism in Asia only",
        "decolonize Africa",
        "fund space exploration"
      ],
      correct: 0,
      explain: "The Marshall Plan delivered $13 billion to rebuild Western Europe, also seen as containment by stabilizing democracies."
    },
    {
      prompt: "The fall of the Berlin Wall in 1989 symbolized...",
      choices: [
        "the start of the Cold War",
        "the end of communist rule in Eastern Europe",
        "German reunification under the USSR",
        "NATO expansion"
      ],
      correct: 1,
      explain: "The Wall's fall on November 9, 1989 became the iconic moment of communism's collapse in Eastern Europe."
    },
    {
      prompt: "Which 1948 document, adopted by the UN, set out fundamental human rights?",
      choices: [
        "Geneva Conventions",
        "Universal Declaration of Human Rights",
        "Helsinki Accords",
        "Atlantic Charter"
      ],
      correct: 1,
      explain: "The UDHR, championed by Eleanor Roosevelt, was adopted in 1948 as a global statement of inalienable rights."
    },
    {
      prompt: "The Columbian Exchange refers to the post-1492 transfer of...",
      choices: [
        "art between Italy and France",
        "plants, animals, people, and diseases between hemispheres",
        "spices along the Silk Road",
        "ideas between China and Japan"
      ],
      correct: 1,
      explain: "Columbus's voyages launched a biological and cultural exchange that reshaped both Americas and Eurasia."
    },
    {
      prompt: "The Atlantic Slave Trade forcibly transported approximately how many Africans to the Americas?",
      choices: ["under 1 million", "about 5 million", "approximately 12.5 million", "over 50 million"],
      correct: 2,
      explain: "Roughly 12.5 million enslaved Africans were forcibly transported across the Atlantic over four centuries."
    },
    {
      prompt: "The French Revolution (1789) was driven primarily by...",
      choices: [
        "religious conflict",
        "Enlightenment ideas, fiscal crisis, and inequality between estates",
        "foreign invasion by Britain",
        "the Industrial Revolution"
      ],
      correct: 1,
      explain: "Enlightenment ideals, royal debt, food shortages, and unfair taxation of the Third Estate combined to spark revolution."
    },
    {
      prompt: "Adam Smith's Wealth of Nations (1776) argued that markets are best guided by...",
      choices: [
        "central planning",
        "an 'invisible hand' of self-interest and competition",
        "religious authority",
        "monarchical decree"
      ],
      correct: 1,
      explain: "Smith argued that competition channels self-interest toward outcomes that serve society — capitalism's intellectual foundation."
    },
    {
      prompt: "The Meiji Restoration (1868) transformed Japan by...",
      choices: [
        "isolating it from foreign trade",
        "rapidly modernizing and industrializing it",
        "splitting it into rival kingdoms",
        "establishing communist rule"
      ],
      correct: 1,
      explain: "The Meiji era ended feudal isolation and rapidly industrialized Japan, making it a major world power within a generation."
    },
    {
      prompt: "Imperialism in the late 1800s was justified by Europeans using ideas like...",
      choices: [
        "Marxism",
        "Social Darwinism and the 'White Man's Burden'",
        "Renaissance humanism",
        "Buddhist teachings"
      ],
      correct: 1,
      explain: "Social Darwinism and the 'civilizing mission' were used to rationalize colonization and exploitation of Africa, Asia, and the Pacific."
    },
    {
      prompt: "The Berlin Conference (1884-85) is most associated with...",
      choices: [
        "the partition of Africa among European powers",
        "the start of WWI",
        "the founding of the League of Nations",
        "the Congress of Vienna"
      ],
      correct: 0,
      explain: "European powers carved up Africa among themselves at Berlin, ignoring African political realities."
    },
    {
      prompt: "The Universal Declaration of Human Rights guarantees rights that are...",
      choices: [
        "granted by individual governments",
        "inherent and inalienable to all humans",
        "earned through citizenship",
        "limited to wartime"
      ],
      correct: 1,
      explain: "The UDHR frames rights as universal — belonging to every person by virtue of being human."
    },
    {
      prompt: "Apartheid was the system of racial segregation in...",
      choices: ["the United States", "South Africa", "India", "Brazil"],
      correct: 1,
      explain: "Apartheid (1948-1994) was South Africa's legal system of racial separation, ended through Mandela's leadership."
    },
    {
      prompt: "The Cuban Missile Crisis (1962) is significant because it...",
      choices: [
        "ended the Cold War",
        "brought the world closest to nuclear war",
        "started the Vietnam War",
        "founded the United Nations"
      ],
      correct: 1,
      explain: "For 13 days, JFK and Khrushchev faced off over Soviet missiles in Cuba — the closest brush with nuclear war."
    },
    {
      prompt: "The Treaty of Tordesillas (1494) divided the New World between...",
      choices: [
        "England and France",
        "Spain and Portugal",
        "the Netherlands and Spain",
        "Russia and Spain"
      ],
      correct: 1,
      explain: "Pope Alexander VI brokered Tordesillas, drawing a meridian dividing newly discovered lands between Spain and Portugal."
    },
    {
      prompt: "The Enlightenment thinker who wrote 'The Social Contract' was...",
      choices: ["John Locke", "Thomas Hobbes", "Jean-Jacques Rousseau", "Voltaire"],
      correct: 2,
      explain: "Rousseau's 1762 Social Contract argued legitimate political authority derives from the general will of the people."
    }
  ];

  // ─── 5 power-ups ──────────────────────────────────────────────────────────
  const POWERUPS = {
    "click-frenzy": {
      name: "Click Frenzy",
      glyph: "⚡",
      description: "10× click power · 30s",
      durationMs: 30_000,
      effect: "click-mult",
      multiplier: 10
    },
    "mega-production": {
      name: "Mega Production",
      glyph: "🔥",
      description: "5× all producers · 60s",
      durationMs: 60_000,
      effect: "global-mult",
      multiplier: 5
    },
    "lucky-coin": {
      name: "Lucky Coin",
      glyph: "🪙",
      description: "Next purchase free",
      durationMs: 0,
      effect: "next-free",
      multiplier: 1
    },
    "skip-time": {
      name: "Skip Time",
      glyph: "⏱",
      description: "Advance 1 hour of production",
      durationMs: 0,
      effect: "skip-time",
      multiplier: 1
    },
    "insight": {
      name: "Insight",
      glyph: "💡",
      description: "Reveals optimal next purchase · 30s",
      durationMs: 30_000,
      effect: "show-optimal",
      multiplier: 1
    }
  };
  const POWERUP_KEYS = Object.keys(POWERUPS);

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const $  = (sel) => document.querySelector(sel);
  const $id = (id) => document.getElementById(id);

  const canvas = $id("tycoonCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  // HUD
  const hudKnowledge = $id("hudKnowledge");
  const hudPerSec    = $id("hudPerSec");
  const hudVolumes   = $id("hudVolumes");
  const hudLives     = $id("hudLives");
  const hudClickPower= $id("hudClickPower");
  const hudGlobal    = $id("hudGlobal");

  // Buttons
  const prestigeBtn      = $id("prestigeBtn");
  const pauseBtn         = $id("pauseBtn");
  const exitBtn          = $id("exitBtn");
  const startBtn         = $id("startBtn");
  const soundBtn         = $id("soundBtn");
  const fullscreenBtn    = $id("fullscreenBtn");
  const resumeBtn        = $id("resumeBtn");
  const restartBtn       = $id("restartBtn");
  const pauseExitBtn     = $id("pauseExitBtn");
  const setupBtn         = $id("setupBtn");
  const againBtn         = $id("againBtn");
  const prestigeCancelBtn= $id("prestigeCancelBtn");
  const prestigeConfirmBtn= $id("prestigeConfirmBtn");
  const questionCloseBtn = $id("questionCloseBtn");

  // Screens
  const setupScreen    = $id("setupScreen");
  const pauseScreen    = $id("pauseScreen");
  const endScreen      = $id("endScreen");
  const questionScreen = $id("questionScreen");
  const prestigeScreen = $id("prestigeScreen");

  // Containers
  const producerList  = $id("producerList");
  const upgradeList   = $id("upgradeList");
  const popupOverlay  = $id("popupOverlay");
  const boostRibbon   = $id("boostRibbon");
  const boostList     = $id("boostList");

  // Powerup slots
  const powerupSlots = [0, 1, 2].map(i => $id(`powerupSlot${i}`));

  // End screen
  const endTitle  = $id("endTitle");
  const endKicker = $id("endKicker");
  const endGrid   = $id("endGrid");
  const retryHint = $id("retryHint");

  // Question screen
  const questionMeta   = $id("questionMeta");
  const questionPrompt = $id("questionPrompt");
  const choiceGrid     = $id("choiceGrid");
  const explanation    = $id("explanation");

  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    knowledge: 0,
    totalEarned: 0,
    clicks: 0,
    producers: PRODUCERS.reduce((acc, p) => { acc[p.id] = 0; return acc; }, {}),
    upgradesBought: {},          // upgradeId → true
    volumes: 0,                  // prestiges
    lives: STARTING_LIVES,
    soundOn: true,
    paused: false,
    running: false,
    started: false,
    gameOver: false,

    // Active timed boosts (boostId → {expiresAt, multiplier, label})
    boosts: {},

    // Power-up inventory: array of length 3, slot id or null
    powerupInventory: [null, null, null],

    // Lucky coin flag (next purchase free)
    luckyCoinActive: false,

    // Next scholar challenge time
    nextScholarAt: 0,
    scholarActive: false,

    // Insight flag
    insightActive: false,
    insightExpiresAt: 0,

    // Milestone tracking
    milestonesHit: {},

    // Click feedback
    clickPulses: [], // {x, y, t0}
    knowledgeOrbs: [],// {x, y, vx, vy, life, max}

    // Mouse/canvas positioning
    canvasRect: null,

    // Stats
    totalClicks: 0,
    totalProducerPurchases: 0,
    totalUpgrades: 0,
    totalPublished: 0,
    correctScholarAnswers: 0,
    powerupsUsed: 0,
    shardsAwarded: 0,

    // Mouse/canvas positioning continued
    canvasLogicalSize: CANVAS_SIZE,

    // UI refresh throttle
    _lastUiRefresh: 0,

    // Pause bookkeeping (so timed boosts / scholar timer don't expire while paused)
    pauseStartedAt: 0,
    currentScholarQ: null,

    // Time
    lastTick: 0,
    lastSave: 0,
    sessionStart: Date.now()
  };

  // Pre-built upgrade list (per-producer + global), runtime-stable
  const PRODUCER_UPGRADES = buildProducerUpgrades();
  const ALL_UPGRADES = [...PRODUCER_UPGRADES, ...GLOBAL_UPGRADES];

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function fmtNum(n) {
    if (!isFinite(n)) return "∞";
    n = Math.floor(n);
    if (n < 1_000) return n.toString();
    const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
    let u = 0;
    while (Math.abs(n) >= 1000 && u < units.length - 1) {
      n /= 1000;
      u++;
    }
    return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2) + units[u];
  }

  function fmtRate(n) {
    return fmtNum(n) + "/s";
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function producerCost(p) {
    const owned = Math.min(state.producers[p.id] || 0, MAX_PRODUCER_OWNED);
    // Guard against Infinity for very large `owned` (Math.pow overflows ~1750 for 1.15^n)
    if (owned >= MAX_PRODUCER_OWNED) return Number.POSITIVE_INFINITY;
    const cost = p.baseCost * Math.pow(COST_GROWTH, owned);
    if (!isFinite(cost) || cost > Number.MAX_SAFE_INTEGER) return Number.POSITIVE_INFINITY;
    return Math.ceil(cost);
  }

  function producerCount(id) { return state.producers[id] || 0; }

  function producerUnitProduction(p) {
    let mult = 1;
    PRODUCER_UPGRADES.forEach(u => {
      if (u.producerId === p.id && state.upgradesBought[u.id]) mult *= 2;
    });
    return p.baseRate * mult;
  }

  function totalProducerProduction(p) {
    return producerCount(p.id) * producerUnitProduction(p);
  }

  function globalMultiplier() {
    let mult = 1;
    // Global 2x upgrades
    GLOBAL_UPGRADES.forEach(u => {
      if (u.kind === "global-mult" && state.upgradesBought[u.id]) mult *= 2;
    });
    // Volumes: +1% per published volume (only applied here — not double-applied to click power)
    mult *= (1 + state.volumes * 0.01);
    // Active boosts (timed) — filter expired inline so production doesn't read stale boosts
    const now = (typeof performance !== "undefined") ? performance.now() : Date.now();
    Object.values(state.boosts).forEach(b => {
      if (b.expiresAt && now > b.expiresAt) return;
      if (b.kind === "global") mult *= b.multiplier;
    });
    return mult;
  }

  function clickMultiplier() {
    let mult = 1;
    GLOBAL_UPGRADES.forEach(u => {
      if (u.kind === "click-mult" && state.upgradesBought[u.id]) mult *= 2;
    });
    const now = (typeof performance !== "undefined") ? performance.now() : Date.now();
    Object.values(state.boosts).forEach(b => {
      if (b.expiresAt && now > b.expiresAt) return;
      if (b.kind === "click") mult *= b.multiplier;
    });
    return mult;
  }

  function clickPower() {
    // Volumes bonus is applied via globalMultiplier on production; click power gets only its own mult.
    return Math.max(1, Math.floor(clickMultiplier()));
  }

  function totalProductionPerSecond() {
    let total = 0;
    PRODUCERS.forEach(p => { total += totalProducerProduction(p); });
    return total * globalMultiplier();
  }

  function canAfford(cost) { return state.knowledge >= cost; }

  function canPrestige() { return state.totalEarned >= PRESTIGE_THRESHOLD; }

  // ─── Audio (Web Audio API only) ───────────────────────────────────────────
  class AudioBus {
    constructor() {
      this.enabled = true;
      this.ctx = null;
      this.masterGain = null;
    }
    ensure() {
      if (!this.enabled) return null;
      try {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.6;
          this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === "suspended") this.ctx.resume();
        return this.ctx;
      } catch (e) {
        return null;
      }
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
      osc.connect(vol).connect(this.masterGain);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    }
    seq(notes, type = "triangle", gain = 0.07) {
      // notes: array of {freq, dur, delay}
      let t = 0;
      notes.forEach(n => {
        setTimeout(() => this.tone(n.freq, n.dur || 0.12, type, gain), t);
        t += (n.delay || 70);
      });
    }
    click() { this.tone(620 + rand(-30, 30), 0.05, "triangle", 0.05, 1.2); }
    clickCritical() {
      this.tone(880, 0.06, "square", 0.07, 1.6);
      setTimeout(() => this.tone(1320, 0.05, "triangle", 0.06, 1.4), 24);
    }
    purchase() {
      this.tone(440, 0.07, "triangle", 0.07, 1.4);
      setTimeout(() => this.tone(660, 0.06, "sine", 0.05, 1.2), 50);
    }
    upgrade() {
      [523, 659, 784, 988].forEach((f, i) => setTimeout(() => this.tone(f, 0.10, "triangle", 0.07, 1.04), i * 60));
    }
    prestigePublish() {
      // Big triumphant fanfare
      [261, 329, 392, 523, 659, 784, 1046, 1318].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.18, "triangle", 0.10, 1.04), i * 80)
      );
    }
    scholarChallenge() {
      // Mysterious chime to summon scholar
      [392, 587, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.20, "sine", 0.07, 1.0), i * 100));
    }
    scholarCorrect() {
      [659, 784, 988, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, "triangle", 0.08, 1.05), i * 70));
    }
    scholarWrong() {
      this.tone(220, 0.18, "sawtooth", 0.06, 0.5);
      setTimeout(() => this.tone(165, 0.15, "triangle", 0.05, 0.7), 100);
    }
    milestone() {
      [523, 784, 1046, 1568].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.12, "triangle", 0.09, 1.1), i * 65)
      );
    }
    lifeLost() {
      [330, 247, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.20, "sawtooth", 0.07, 0.7), i * 130));
    }
    gameOver() {
      [392, 330, 277, 220, 165].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.22, "triangle", 0.08, 0.85), i * 140)
      );
    }
    powerupPickup() {
      this.tone(988, 0.08, "sine", 0.07, 1.2);
      setTimeout(() => this.tone(1318, 0.10, "triangle", 0.08, 1.1), 40);
    }
    powerupUse() {
      [659, 988, 1318, 1976].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.10, "triangle", 0.08, 1.04), i * 50)
      );
    }
  }
  const audio = new AudioBus();

  // ─── Persistence ──────────────────────────────────────────────────────────
  function save() {
    try {
      const snap = {
        v: 1,
        knowledge: state.knowledge,
        totalEarned: state.totalEarned,
        clicks: state.totalClicks,
        producers: state.producers,
        upgradesBought: state.upgradesBought,
        volumes: state.volumes,
        lives: state.lives,
        soundOn: state.soundOn,
        powerupInventory: state.powerupInventory,
        milestonesHit: state.milestonesHit,
        sessionStart: state.sessionStart,
        savedAt: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
    } catch (e) { /* ignore */ }
  }

  function loadSnapshot() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const snap = JSON.parse(raw);
      if (!snap || snap.v !== 1) return null;
      return snap;
    } catch (e) { return null; }
  }

  function applySnapshot(snap) {
    if (!snap) return false;
    state.knowledge = +snap.knowledge || 0;
    state.totalEarned = +snap.totalEarned || 0;
    state.totalClicks = +snap.clicks || 0;
    state.producers = Object.assign({}, state.producers, snap.producers || {});
    state.upgradesBought = snap.upgradesBought || {};
    state.volumes = +snap.volumes || 0;
    state.lives = +snap.lives || STARTING_LIVES;
    state.soundOn = snap.soundOn !== false;
    audio.enabled = state.soundOn;
    state.powerupInventory = Array.isArray(snap.powerupInventory)
      ? snap.powerupInventory.slice(0, 3)
      : [null, null, null];
    while (state.powerupInventory.length < 3) state.powerupInventory.push(null);
    state.milestonesHit = snap.milestonesHit || {};
    state.sessionStart = +snap.sessionStart || Date.now();

    // Offline production credit (4h cap, 25% rate; clamp negatives, isFinite)
    if (snap.savedAt) {
      const elapsedSec = Math.max(0, (Date.now() - snap.savedAt) / 1000);
      const offlineSec = Math.min(elapsedSec, OFFLINE_CAP_HOURS * 3600);
      const baseRate = totalProductionPerSecond();
      const offlineGain = (isFinite(baseRate) && baseRate > 0)
        ? baseRate * offlineSec * OFFLINE_RATE
        : 0;
      const granted = addKnowledge(offlineGain);
      if (granted > 0) {
        showCallout(`Welcome back · +${fmtNum(granted)} idle`);
      }
    }
    return true;
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  // ─── Profile / shards integration ────────────────────────────────────────
  function awardShards(n, reason) {
    try {
      const remaining = SHARDS_CAP - (state.shardsAwarded || 0);
      const capped = Math.max(0, Math.min(n | 0, remaining));
      if (capped <= 0) return;
      state.shardsAwarded = (state.shardsAwarded || 0) + capped;
      window.MrMacsProfile?.addShards(capped, reason);
    } catch (e) { /* ignore */ }
  }

  // Clamp knowledge to numerical safe range to avoid Infinity / precision loss
  function addKnowledge(amount) {
    if (!isFinite(amount) || isNaN(amount) || amount <= 0) return 0;
    const headroom = KNOWLEDGE_HARD_CAP - state.knowledge;
    if (headroom <= 0) return 0;
    const granted = Math.min(amount, headroom);
    state.knowledge += granted;
    state.totalEarned = Math.min(KNOWLEDGE_HARD_CAP * 1000, state.totalEarned + granted);
    return granted;
  }

  // ─── Canvas sizing (square 720x720, scaled for viewport) ─────────────────
  function sizeCanvas() {
    // Account for HUD top, side rails, powerup tray
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const hudH = 70;
    // On mobile (≤700px) rails are hidden; producer strip sits at bottom (~44vw height)
    // On medium (≤880px) upgrade panel hidden but producer rail still on right
    const railL = vw > 700 ? 280 + 28 : 0;
    const railR = vw > 880 ? 300 + 28 : vw > 700 ? 240 + 28 : 0;
    // padBottom: desktop = powerup tray; mobile = producer strip (44vw) + powerup slot row (~54px)
    const padBottom = vw <= 700 ? Math.round(vh * 0.44) + 54 : 96;

    const availW = Math.max(240, vw - railL - railR - 32);
    const availH = Math.max(240, vh - hudH - padBottom);
    const size = Math.min(CANVAS_SIZE, availW, availH);
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.canvasRect = canvas.getBoundingClientRect();
    state.canvasLogicalSize = size;
  }

  // ─── Main click handler ──────────────────────────────────────────────────
  function buttonHitTest(localX, localY) {
    const cx = state.canvasLogicalSize / 2;
    const cy = state.canvasLogicalSize / 2;
    const radius = state.canvasLogicalSize * 0.26;
    const dx = localX - cx;
    const dy = localY - cy;
    return (dx * dx + dy * dy) <= radius * radius;
  }

  function handleCanvasClick(e) {
    if (!state.running || state.paused || state.scholarActive) return;
    // Suppress synthetic click that fires ~300ms after touchend
    if (performance.now() - _lastTouchAt < 600) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    state.canvasRect = rect;
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    if (!buttonHitTest(x, y)) return;
    doScribbleClick(x, y);
  }

  // Touch handler: dedupe via this flag so the synthetic mouse `click` after
  // touchstart doesn't double-fire. Used for both touchstart (fast tap) and
  // touchend (cancellation guard).
  let _lastTouchAt = 0;
  function handleCanvasTouch(e) {
    if (!state.running || state.paused || state.scholarActive) return;
    const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    if (!t) return;
    e.preventDefault();
    _lastTouchAt = performance.now();
    const rect = canvas.getBoundingClientRect();
    state.canvasRect = rect;
    const x = (t.clientX - rect.left);
    const y = (t.clientY - rect.top);
    if (!buttonHitTest(x, y)) return;
    doScribbleClick(x, y);
  }

  function doScribbleClick(x, y) {
    const power = clickPower();
    // Critical click (1% chance) = 10x
    const isCrit = Math.random() < 0.01;
    const total = isCrit ? power * 10 : power;
    const granted = addKnowledge(total);
    state.totalClicks++;
    state.clicks++;

    if (isCrit) {
      audio.clickCritical();
      spawnFloatNum("+" + fmtNum(granted), x, y, true);
    } else {
      audio.click();
      spawnFloatNum("+" + fmtNum(granted), x, y, false);
    }

    // Click pulse
    state.clickPulses.push({ x, y, t0: performance.now() });
    if (state.clickPulses.length > 24) state.clickPulses.shift();

    // Spawn knowledge orbs trail (skip when reduced motion)
    if (!REDUCED_MOTION) spawnKnowledgeOrbs(x, y, isCrit ? 8 : 3);

    checkMilestones();
    refreshHUD();
  }

  function spawnFloatNum(text, x, y, crit) {
    const div = document.createElement("div");
    div.className = "float-num" + (crit ? " crit" : "");
    div.textContent = text;
    const rect = canvas.getBoundingClientRect();
    const overlay = popupOverlay.getBoundingClientRect();
    div.style.left = (rect.left - overlay.left + x) + "px";
    div.style.top = (rect.top - overlay.top + y - 30) + "px";
    div.style.transform = "translate(-50%, 0)";
    popupOverlay.appendChild(div);
    setTimeout(() => div.remove(), 1100);
  }

  function spawnKnowledgeOrbs(x, y, n) {
    for (let i = 0; i < n; i++) {
      state.knowledgeOrbs.push({
        x, y,
        vx: rand(-1.5, 1.5),
        vy: rand(-2.8, -1.0),
        life: 0,
        max: rand(40, 75),
        size: rand(2.5, 5.5),
        hue: 45 + rand(-8, 12)
      });
    }
    if (state.knowledgeOrbs.length > 240) state.knowledgeOrbs.splice(0, state.knowledgeOrbs.length - 240);
  }

  // ─── Producer purchase ────────────────────────────────────────────────────
  function buyProducer(producerId) {
    const p = PRODUCERS.find(p => p.id === producerId);
    if (!p) return;
    if ((state.producers[producerId] || 0) >= MAX_PRODUCER_OWNED) return;
    const cost = producerCost(p);
    if (state.luckyCoinActive) {
      // Free purchase — also count this as the powerup actually used
      state.producers[producerId]++;
      state.luckyCoinActive = false;
      state.totalProducerPurchases++;
      state.powerupsUsed++;
      audio.purchase();
      showCallout(`Lucky! ${p.name} free`);
      refreshAll();
      return;
    }
    if (!isFinite(cost) || !canAfford(cost)) return;
    state.knowledge -= cost;
    state.producers[producerId]++;
    state.totalProducerPurchases++;
    audio.purchase();
    refreshAll();
  }

  function buyUpgrade(upgradeId) {
    const u = ALL_UPGRADES.find(u => u.id === upgradeId);
    if (!u || state.upgradesBought[u.id]) return;
    if (u.requiresOwned !== undefined && producerCount(u.producerId) < u.requiresOwned) return;
    if (state.luckyCoinActive) {
      state.upgradesBought[u.id] = true;
      state.luckyCoinActive = false;
      state.totalUpgrades++;
      state.powerupsUsed++;
      audio.upgrade();
      showCallout(`Lucky! ${u.name} free`);
      refreshAll();
      return;
    }
    if (!canAfford(u.cost)) return;
    state.knowledge -= u.cost;
    state.upgradesBought[u.id] = true;
    state.totalUpgrades++;
    audio.upgrade();
    refreshAll();
  }

  // ─── Milestones (1k / 10k / 100k / 1M / 1B) ──────────────────────────────
  function checkMilestones() {
    const milestones = [
      [1_000,         "1K"],
      [10_000,        "10K"],
      [100_000,       "100K"],
      [1_000_000,     "1M"],
      [10_000_000,    "10M"],
      [100_000_000,   "100M"],
      [1_000_000_000, "1B"]
    ];
    milestones.forEach(([n, label]) => {
      if (state.totalEarned >= n && !state.milestonesHit[label]) {
        state.milestonesHit[label] = true;
        audio.milestone();
        showCallout(`Milestone · ${label} knowledge`);
        const shardReward = Math.min(8, 1 + Math.floor(Math.log10(n) / 2));
        awardShards(shardReward, `archive-tycoon-milestone-${label}`);
      }
    });
  }

  // ─── Prestige (publish a volume) ─────────────────────────────────────────
  function showPrestige() {
    if (!canPrestige()) return;
    const futureVolumes = state.volumes + 1;
    $id("prestigeBody").innerHTML =
      `Reset all knowledge, producers, and upgrades. Earn <strong>+1 volume</strong> ` +
      `(total: ${futureVolumes}) for a permanent <strong>+${futureVolumes}% production</strong> bonus. ` +
      `<br><br>You have <strong>${state.lives - 1} lives</strong> remaining after this publish.`;
    prestigeScreen.classList.add("show");
  }

  function doPrestige() {
    if (!canPrestige()) return;
    state.volumes++;
    state.lives--;
    state.totalPublished++;
    audio.prestigePublish();
    awardShards(20, "archive-tycoon-publish");
    showCallout(`Volume ${state.volumes} published!`, 2200);

    // Reset run state but keep volumes/lives/sound + lifetime stats
    state.knowledge = 0;
    state.totalEarned = 0;
    state.clicks = 0;
    PRODUCERS.forEach(p => { state.producers[p.id] = 0; });
    state.upgradesBought = {};
    state.boosts = {};
    state.luckyCoinActive = false;
    state.powerupInventory = [null, null, null];
    state.milestonesHit = {};
    state.scholarActive = false;
    state.nextScholarAt = performance.now() + SCHOLAR_INTERVAL_MS + rand(0, SCHOLAR_INTERVAL_JITTER);

    prestigeScreen.classList.remove("show");
    refreshAll();

    if (state.lives <= 0) {
      endGame("Final volume published. The archive sleeps.");
    }
  }

  // ─── Scholar challenges ──────────────────────────────────────────────────
  function maybeTriggerScholar(now) {
    if (state.scholarActive) return;
    if (now < state.nextScholarAt) return;
    triggerScholar();
  }

  function triggerScholar() {
    state.scholarActive = true;
    audio.scholarChallenge();
    const q = pick(SCHOLAR_QUESTIONS);
    state.currentScholarQ = q;
    questionMeta.textContent = "Scholar Challenge · Boost incoming";
    questionPrompt.textContent = q.prompt;
    explanation.textContent = "";
    choiceGrid.innerHTML = "";
    q.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.type = "button";
      btn.textContent = choice;
      btn.addEventListener("click", () => answerScholar(i, btn, q));
      choiceGrid.appendChild(btn);
    });
    questionScreen.classList.add("show");
    showCallout("Scholar arrives!");
  }

  function answerScholar(idx, btnEl, q) {
    Array.from(choiceGrid.children).forEach(c => c.disabled = true);
    if (idx === q.correct) {
      btnEl.dataset.state = "correct";
      explanation.textContent = "Correct. " + q.explain;
      audio.scholarCorrect();
      // Apply boost
      const boostId = "scholar-" + Date.now();
      state.boosts[boostId] = {
        kind: "global",
        multiplier: SCHOLAR_BOOST_MULTIPLIER,
        label: `Scholar +${Math.round((SCHOLAR_BOOST_MULTIPLIER - 1) * 100)}%`,
        expiresAt: performance.now() + SCHOLAR_BOOST_DURATION_MS
      };
      awardShards(SCHOLAR_SHARD_REWARD, "archive-tycoon-scholar-correct");
      state.correctScholarAnswers++;
      showCallout(`Boost active · +${Math.round((SCHOLAR_BOOST_MULTIPLIER - 1) * 100)}% · 5min`, 2000);
    } else {
      btnEl.dataset.state = "wrong";
      // Highlight correct
      const correctBtn = choiceGrid.children[q.correct];
      if (correctBtn) correctBtn.dataset.state = "correct";
      explanation.textContent = "Not quite. " + q.explain;
      audio.scholarWrong();
    }
    setTimeout(() => closeScholar(), 1900);
  }

  function closeScholar() {
    questionScreen.classList.remove("show");
    state.scholarActive = false;
    state.currentScholarQ = null;
    state.nextScholarAt = performance.now() + SCHOLAR_INTERVAL_MS + rand(0, SCHOLAR_INTERVAL_JITTER);
  }

  function skipScholar() {
    if (!state.scholarActive) {
      questionScreen.classList.remove("show");
      return;
    }
    audio.scholarWrong();
    closeScholar();
  }

  // ─── Power-ups ────────────────────────────────────────────────────────────
  function maybeDropPowerup() {
    if (Math.random() > POWERUP_DROP_CHANCE_PER_TICK) return;
    const slot = state.powerupInventory.indexOf(null);
    if (slot === -1) return;
    const id = pick(POWERUP_KEYS);
    state.powerupInventory[slot] = id;
    audio.powerupPickup();
    showCallout(`${POWERUPS[id].glyph} ${POWERUPS[id].name} acquired`);
    refreshPowerups();
  }

  function usePowerup(slotIdx) {
    const id = state.powerupInventory[slotIdx];
    if (!id) return;
    const p = POWERUPS[id];

    // Lucky coin: don't allow stacking — refuse activation if one is already active
    if (p.effect === "next-free" && state.luckyCoinActive) {
      showCallout("Lucky coin already active");
      return;
    }

    state.powerupInventory[slotIdx] = null;
    audio.powerupUse();

    // Fixed-key per kind so the same powerup type can't stack with itself.
    // Re-activating refreshes the duration but does not multiply the bonus.
    if (p.effect === "click-mult") {
      const key = "pu-click-frenzy";
      state.boosts[key] = {
        kind: "click",
        multiplier: p.multiplier,
        label: `${p.glyph} ${p.name}`,
        expiresAt: performance.now() + p.durationMs
      };
      state.powerupsUsed++;
    } else if (p.effect === "global-mult") {
      const key = "pu-global-mega";
      state.boosts[key] = {
        kind: "global",
        multiplier: p.multiplier,
        label: `${p.glyph} ${p.name}`,
        expiresAt: performance.now() + p.durationMs
      };
      state.powerupsUsed++;
    } else if (p.effect === "next-free") {
      // Defer powerupsUsed increment until coin is actually consumed in buyProducer/buyUpgrade
      state.luckyCoinActive = true;
      showCallout(`${p.glyph} Next purchase free`);
    } else if (p.effect === "skip-time") {
      // Floor: at least SKIP_TIME_FLOOR seconds of click-equivalent so the powerup
      // is never wasted at very low production rates.
      const baseRate = totalProductionPerSecond();
      const productionGain = (isFinite(baseRate) && baseRate > 0) ? baseRate * 3600 : 0;
      const floorGain = clickPower() * SKIP_TIME_FLOOR;
      const totalGain = Math.max(productionGain, floorGain);
      const granted = addKnowledge(totalGain);
      showCallout(`${p.glyph} +${fmtNum(granted)} skipped`, 1800);
      checkMilestones();
      state.powerupsUsed++;
    } else if (p.effect === "show-optimal") {
      state.insightActive = true;
      state.insightExpiresAt = performance.now() + p.durationMs;
      state.powerupsUsed++;
    }
    refreshAll();
  }

  function findOptimalPurchase() {
    // Returns producerId that gives best K/sec per cost
    let best = null;
    let bestRatio = 0;
    PRODUCERS.forEach(p => {
      const cost = producerCost(p);
      const unit = producerUnitProduction(p) * globalMultiplier();
      const ratio = unit / cost;
      if (ratio > bestRatio) { bestRatio = ratio; best = p.id; }
    });
    return best;
  }

  // ─── UI rendering ────────────────────────────────────────────────────────
  function refreshHUD() {
    hudKnowledge.textContent  = fmtNum(state.knowledge);
    hudPerSec.textContent     = fmtNum(totalProductionPerSecond());
    hudVolumes.textContent    = state.volumes;
    hudLives.textContent      = "❤".repeat(Math.max(0, state.lives)) || "0";
    hudClickPower.textContent = "+" + fmtNum(clickPower());
    hudGlobal.textContent     = "×" + globalMultiplier().toFixed(2);

    prestigeBtn.disabled = !canPrestige();
    prestigeBtn.title = canPrestige()
      ? `Publish · +${state.volumes + 1}% perm. boost`
      : `Reach 1B (${fmtNum(state.totalEarned)}/1B)`;
  }

  function refreshProducers() {
    if (!producerList) return;
    const optimalId = state.insightActive ? findOptimalPurchase() : null;
    producerList.innerHTML = "";
    PRODUCERS.forEach((p, i) => {
      const cost = producerCost(p);
      const owned = state.producers[p.id];
      const rate = producerUnitProduction(p);

      // Find the next tier upgrade for this producer (not yet bought)
      const nextTierUpgrade = PRODUCER_UPGRADES.find(u =>
        u.producerId === p.id && !state.upgradesBought[u.id]
      );
      const tierHint = nextTierUpgrade
        ? `Tier ${nextTierUpgrade.tier} @ ${owned >= nextTierUpgrade.requiresOwned
            ? fmtNum(nextTierUpgrade.cost)
            : `×${nextTierUpgrade.requiresOwned} req`}`
        : (owned > 0 ? "All tiers unlocked" : "");

      const card = document.createElement("button");
      card.className = "producer-card";
      card.type = "button";
      card.dataset.affordable = canAfford(cost) || state.luckyCoinActive ? "true" : "false";
      if (optimalId === p.id) card.dataset.optimal = "true";
      card.title = `${p.name} · +${fmtNum(rate)}/s each · Key ${i + 1}`;
      card.innerHTML = `
        <div class="producer-icon">${p.glyph}</div>
        <div class="producer-meta">
          <span class="producer-name">${p.name}</span>
          <span class="producer-rate">+${fmtNum(rate)}/s · ${i + 1}</span>
          ${tierHint ? `<span class="producer-tier-hint">${tierHint}</span>` : ""}
        </div>
        <div class="producer-buy">
          <span class="producer-cost">${state.luckyCoinActive ? "FREE" : fmtNum(cost)}</span>
          <span class="producer-count">×${owned}</span>
        </div>
      `;
      card.addEventListener("click", () => buyProducer(p.id));
      producerList.appendChild(card);
    });
  }

  function refreshUpgrades() {
    if (!upgradeList) return;
    upgradeList.innerHTML = "";

    // Show globals first
    GLOBAL_UPGRADES.forEach(u => {
      // Skip if already bought (shrink list)
      const card = renderUpgradeCard(u);
      if (card) upgradeList.appendChild(card);
    });

    // Then per-producer upgrades, only show those whose required producer is owned ≥1
    PRODUCERS.forEach(p => {
      if (producerCount(p.id) < 1) return;
      PRODUCER_UPGRADES.filter(u => u.producerId === p.id).forEach(u => {
        const card = renderUpgradeCard(u);
        if (card) upgradeList.appendChild(card);
      });
    });

    if (upgradeList.children.length === 0) {
      const empty = document.createElement("p");
      empty.style.cssText = "color:var(--muted);font-size:11px;padding:8px 4px;line-height:1.5";
      empty.textContent = "Hire your first producer to unlock its upgrade tree.";
      upgradeList.appendChild(empty);
    }
  }

  function renderUpgradeCard(u) {
    if (state.upgradesBought[u.id]) {
      // Render as bought (kept visible briefly), but hide tier 4+ when bought
      if (u.kind !== "global-mult" && u.tier && u.tier >= 3) return null;
      const card = document.createElement("div");
      card.className = "upgrade-card";
      card.dataset.bought = "true";
      card.innerHTML = `
        <div class="upgrade-icon" style="color:var(--emerald);border-color:rgba(77,212,155,.32)">✓</div>
        <div class="upgrade-meta">
          <span class="upgrade-name">${u.name}</span>
          <span class="upgrade-effect">${u.effect}</span>
        </div>
        <span class="upgrade-cost">OWNED</span>
      `;
      return card;
    }
    if (u.requiresOwned !== undefined && producerCount(u.producerId) < u.requiresOwned) return null;
    const card = document.createElement("button");
    card.className = "upgrade-card";
    card.type = "button";
    card.dataset.affordable = (canAfford(u.cost) || state.luckyCoinActive) ? "true" : "false";
    card.title = `${u.name} · ${u.effect}`;
    card.innerHTML = `
      <div class="upgrade-icon">${u.icon}</div>
      <div class="upgrade-meta">
        <span class="upgrade-name">${u.name}</span>
        <span class="upgrade-effect">${u.effect}</span>
      </div>
      <span class="upgrade-cost">${state.luckyCoinActive ? "FREE" : fmtNum(u.cost)}</span>
    `;
    card.addEventListener("click", () => buyUpgrade(u.id));
    return card;
  }

  function refreshPowerups() {
    powerupSlots.forEach((slot, i) => {
      const id = state.powerupInventory[i];
      const icon = slot.querySelector(".pu-icon");
      const num  = slot.querySelector(".pu-num");
      if (!id) {
        slot.dataset.empty = "true";
        if (icon) icon.textContent = "·";
        slot.title = "Empty slot";
      } else {
        slot.dataset.empty = "false";
        if (icon) icon.textContent = POWERUPS[id].glyph;
        slot.title = `${POWERUPS[id].name} — ${POWERUPS[id].description}`;
      }
      if (num) num.textContent = (i + 1).toString();
    });
  }

  function refreshBoosts() {
    const now = performance.now();
    let active = [];
    Object.entries(state.boosts).forEach(([id, b]) => {
      if (b.expiresAt && now > b.expiresAt) {
        delete state.boosts[id];
      } else {
        const remain = ((b.expiresAt - now) / 1000) | 0;
        active.push(`${b.label} (${remain}s)`);
      }
    });
    if (state.luckyCoinActive) active.unshift("🪙 Next free");
    if (state.insightActive) {
      if (now > state.insightExpiresAt) state.insightActive = false;
      else {
        const remain = ((state.insightExpiresAt - now) / 1000) | 0;
        active.unshift(`💡 Insight (${remain}s)`);
      }
    }
    if (active.length === 0) {
      boostRibbon.hidden = true;
    } else {
      boostRibbon.hidden = false;
      boostList.textContent = active.join(" · ");
    }
  }

  function refreshAll() {
    refreshHUD();
    refreshProducers();
    refreshUpgrades();
    refreshPowerups();
    refreshBoosts();
  }

  function showCallout(text, durationMs = 1400) {
    const div = document.createElement("div");
    div.className = "milestone-callout";
    div.textContent = text;
    popupOverlay.appendChild(div);
    setTimeout(() => div.remove(), durationMs);
  }

  // ─── Main canvas render loop ─────────────────────────────────────────────
  function drawScene(now, dt) {
    const W = state.canvasLogicalSize;
    const H = state.canvasLogicalSize;
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const grad = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.7);
    grad.addColorStop(0, "rgba(245,196,81,.10)");
    grad.addColorStop(.55, "rgba(13,20,36,1)");
    grad.addColorStop(1, "rgba(6,10,20,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle animated background dust
    drawArchiveDust(now, W, H);

    // Volume / volumes shelf at top
    drawVolumeShelf(W, H);

    // Producer rate pillars at bottom
    drawProducerPillars(W, H);

    // Knowledge orbs (rising particles)
    updateAndDrawOrbs(dt, W, H);

    // The big scribble button
    drawScribbleButton(now, W, H);

    // Click pulses
    drawClickPulses(now);

    // Per-second ticker label below button
    drawPerSecLabel(W, H);
  }

  function drawArchiveDust(now, W, H) {
    ctx.save();
    const seed = Math.floor(now / 60);
    for (let i = 0; i < 36; i++) {
      const t = (seed * 0.001 + i * 0.213) % 1;
      const x = ((i * 47.13) % W);
      const y = (i * 31.7 + (now * 0.02 + i * 17) % H) % H;
      const a = 0.04 + 0.05 * Math.sin(now * 0.001 + i);
      ctx.fillStyle = `rgba(245,196,81,${a})`;
      ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawVolumeShelf(W, H) {
    const shelfY = 36;
    const shelfH = 40;
    const cx = W / 2;
    const maxSpread = W * 0.7;
    const count = Math.min(state.volumes, 24);
    if (count === 0) {
      ctx.save();
      ctx.fillStyle = "rgba(245,196,81,.32)";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("ARCHIVE · NO VOLUMES PUBLISHED", cx, shelfY + 20);
      ctx.restore();
      return;
    }
    const bookW = Math.min(20, maxSpread / count);
    const startX = cx - (count * bookW) / 2;
    ctx.save();
    for (let i = 0; i < count; i++) {
      const x = startX + i * bookW;
      ctx.fillStyle = i % 3 === 0 ? "#a96e3d" : i % 3 === 1 ? "#c8922a" : "#7a4a2a";
      ctx.fillRect(x + 1, shelfY, bookW - 2, shelfH);
      ctx.fillStyle = "rgba(255,217,122,.4)";
      ctx.fillRect(x + 1, shelfY, bookW - 2, 4);
    }
    // Shelf board
    ctx.fillStyle = "rgba(50, 30, 18, .8)";
    ctx.fillRect(startX - 6, shelfY + shelfH, count * bookW + 12, 5);
    // Label
    ctx.fillStyle = "rgba(245,196,81,.7)";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${state.volumes} VOLUMES PUBLISHED`, cx, shelfY + shelfH + 22);
    ctx.restore();
  }

  function drawProducerPillars(W, H) {
    const baseY = H - 24;
    const margin = 30;
    const usable = W - margin * 2;
    const colW = usable / PRODUCERS.length;
    const maxBarH = 90;

    // Determine max for normalization
    let maxRate = 1;
    PRODUCERS.forEach(p => { maxRate = Math.max(maxRate, totalProducerProduction(p) * globalMultiplier()); });

    ctx.save();
    PRODUCERS.forEach((p, i) => {
      const x = margin + i * colW;
      const rate = totalProducerProduction(p) * globalMultiplier();
      const owned = state.producers[p.id];
      const h = (rate / maxRate) * maxBarH;
      // Pillar background
      ctx.fillStyle = "rgba(255,255,255,.04)";
      ctx.fillRect(x + 4, baseY - maxBarH, colW - 8, maxBarH);
      // Pillar fill
      const grad = ctx.createLinearGradient(0, baseY - h, 0, baseY);
      grad.addColorStop(0, "rgba(255,217,122,.95)");
      grad.addColorStop(1, "rgba(168,110,61,.9)");
      ctx.fillStyle = grad;
      if (h > 0) ctx.fillRect(x + 4, baseY - h, colW - 8, h);
      // Label
      ctx.fillStyle = owned > 0 ? "var(--gold)" : "rgba(255,255,255,.32)";
      ctx.fillStyle = owned > 0 ? "rgba(245,196,81,.85)" : "rgba(255,255,255,.32)";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.short, x + colW / 2, baseY + 14);
      // Count above bar
      if (owned > 0) {
        ctx.fillStyle = "rgba(245,196,81,.95)";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText("×" + owned, x + colW / 2, baseY - maxBarH - 4);
      }
    });
    ctx.restore();
  }

  function drawScribbleButton(now, W, H) {
    const cx = W / 2;
    const cy = H / 2;
    const baseR = W * 0.26;

    // Pulse animation
    const pulse = 1 + Math.sin(now * 0.003) * 0.012;
    const r = baseR * pulse;

    ctx.save();

    // Outer glow ring
    const ringW = 18;
    const ringGrad = ctx.createRadialGradient(cx, cy, r, cx, cy, r + ringW * 2);
    ringGrad.addColorStop(0, "rgba(245,196,81,.55)");
    ringGrad.addColorStop(.55, "rgba(245,196,81,.22)");
    ringGrad.addColorStop(1, "rgba(245,196,81,0)");
    ctx.fillStyle = ringGrad;
    ctx.beginPath(); ctx.arc(cx, cy, r + ringW * 2, 0, Math.PI * 2); ctx.fill();

    // Button body
    const bodyGrad = ctx.createRadialGradient(cx - r * .25, cy - r * .35, 0, cx, cy, r);
    bodyGrad.addColorStop(0, "#fff3c0");
    bodyGrad.addColorStop(.35, "#f5c451");
    bodyGrad.addColorStop(.7, "#c8922a");
    bodyGrad.addColorStop(1, "#7a4a1a");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    // Embossed inner ring
    ctx.strokeStyle = "rgba(255,255,255,.32)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2); ctx.stroke();

    // Inner accent ring
    ctx.strokeStyle = "rgba(80,40,15,.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2); ctx.stroke();

    // Quill icon (simplified drawing)
    drawQuillIcon(cx, cy - r * 0.05, r * 0.42);

    // Label
    ctx.fillStyle = "rgba(40,20,8,.85)";
    ctx.font = "bold 22px Fraunces, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRIBBLE", cx, cy + r * 0.62);

    // Click power
    ctx.fillStyle = "rgba(40,20,8,.65)";
    ctx.font = "12px JetBrains Mono, monospace";
    ctx.fillText("+" + fmtNum(clickPower()) + " / click", cx, cy + r * 0.82);

    ctx.restore();
  }

  function drawQuillIcon(cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 5);
    // Quill shaft
    ctx.strokeStyle = "rgba(40,22,8,.85)";
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, size * 0.5);
    ctx.lineTo(size * 0.5, -size * 0.5);
    ctx.stroke();
    // Feather barbs
    ctx.strokeStyle = "rgba(40,22,8,.55)";
    ctx.lineWidth = 1.4;
    for (let t = 0; t < 8; t++) {
      const u = -size * 0.4 + t * (size * 0.85 / 8);
      const v = size * 0.4 - t * (size * 0.85 / 8);
      const off = size * 0.18 * (1 - t / 8);
      ctx.beginPath();
      ctx.moveTo(u, v);
      ctx.lineTo(u + off, v + off * 0.6);
      ctx.stroke();
    }
    // Ink tip
    ctx.fillStyle = "rgba(40,22,8,.95)";
    ctx.beginPath();
    ctx.moveTo(size * 0.5, -size * 0.5);
    ctx.lineTo(size * 0.6, -size * 0.42);
    ctx.lineTo(size * 0.42, -size * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPerSecLabel(W, H) {
    const cx = W / 2;
    const y = H / 2 + W * 0.32;
    ctx.save();
    ctx.fillStyle = "rgba(245,196,81,.65)";
    ctx.font = "11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(fmtNum(totalProductionPerSecond()) + "/sec auto", cx, y);
    ctx.restore();
  }

  function drawClickPulses(now) {
    const surviving = [];
    state.clickPulses.forEach(p => {
      const age = now - p.t0;
      if (age > 600) return;
      const t = age / 600;
      const r = 8 + t * 60;
      const a = 0.55 * (1 - t);
      ctx.save();
      ctx.strokeStyle = `rgba(255,217,122,${a})`;
      ctx.lineWidth = 2 * (1 - t * 0.7);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      surviving.push(p);
    });
    state.clickPulses = surviving;
  }

  function updateAndDrawOrbs(dt, W, H) {
    const surviving = [];
    state.knowledgeOrbs.forEach(o => {
      o.life += dt * 60;
      if (o.life >= o.max) return;
      o.x += o.vx;
      o.y += o.vy;
      o.vy += 0.02; // very slight gravity, mostly upward float
      o.vx *= 0.99;
      const t = o.life / o.max;
      const a = 1 - t;
      ctx.save();
      ctx.fillStyle = `hsla(${o.hue}, 80%, ${65 + t * 20}%, ${a * 0.85})`;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size * (1 - t * 0.4), 0, Math.PI * 2);
      ctx.fill();
      // Orb sparkle
      ctx.fillStyle = `rgba(255,255,255,${a * 0.6})`;
      ctx.beginPath();
      ctx.arc(o.x - o.size * 0.2, o.y - o.size * 0.25, o.size * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      surviving.push(o);
    });
    state.knowledgeOrbs = surviving;
  }

  // ─── Loop ────────────────────────────────────────────────────────────────
  let rafId = 0;
  let tickAccum = 0;
  const TICK_MS = 100;

  function tick(now) {
    // Stop the loop entirely on game over (prevents memory leak)
    if (state.gameOver || !state.running) {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(tick);

    if (!state.lastTick) state.lastTick = now;
    const dt = Math.min(0.1, (now - state.lastTick) / 1000); // cap at 100ms
    state.lastTick = now;

    if (!state.paused) {
      // Production tick
      tickAccum += dt * 1000;
      // Bound accum so a hidden tab returning doesn't replay hours of ticks at once
      if (tickAccum > 5000) tickAccum = 5000;
      while (tickAccum >= TICK_MS) {
        tickAccum -= TICK_MS;
        const gain = totalProductionPerSecond() * (TICK_MS / 1000);
        if (gain > 0) {
          const granted = addKnowledge(gain);
          if (granted > 0) checkMilestones();
        }
        maybeDropPowerup();
        maybeTriggerScholar(now);

        // Autosave
        if (now - state.lastSave > AUTOSAVE_INTERVAL_MS) {
          save();
          state.lastSave = now;
        }
      }

      // Cleanup expired boosts (also called by refreshBoosts)
      refreshBoosts();

      // Periodic UI refresh (cheap; counts/costs change every tick)
      refreshHUD();
      // Producer cost displays update every ~250ms
      if ((Math.floor(now / 250)) !== state._lastUiRefresh) {
        state._lastUiRefresh = Math.floor(now / 250);
        refreshProducers();
        refreshUpgrades();
      }
    }

    drawScene(now, dt);
  }

  // ─── Game flow ───────────────────────────────────────────────────────────
  function showSetup() {
    setupScreen.classList.add("show");
    pauseScreen.classList.remove("show");
    endScreen.classList.remove("show");
    questionScreen.classList.remove("show");
    prestigeScreen.classList.remove("show");

    // Show resume option if save exists
    const snap = loadSnapshot();
    const resumeCard = $id("resumeCard");
    if (snap && snap.totalEarned > 0 && resumeCard) {
      resumeCard.hidden = false;
      resumeCard.innerHTML =
        `<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.14em;margin-bottom:6px">Resume Run</div>` +
        `<div style="font-size:13px;color:var(--text);line-height:1.4">` +
        `${fmtNum(snap.totalEarned)} earned · ${snap.volumes} volumes · ${snap.lives} lives` +
        `</div>` +
        `<div style="display:flex;gap:8px;margin-top:10px">` +
        `<button class="btn glass-pill" id="resumeRunBtn" type="button">Resume</button>` +
        `<button class="btn glass-pill" id="newRunBtn" type="button">New Run</button>` +
        `</div>`;
      const r = $id("resumeRunBtn");
      const nr = $id("newRunBtn");
      if (r) r.addEventListener("click", () => { applySnapshot(snap); startGame(); });
      if (nr) nr.addEventListener("click", () => { clearSave(); resumeCard.hidden = true; });
    } else if (resumeCard) {
      resumeCard.hidden = true;
    }
  }

  function startGame() {
    setupScreen.classList.remove("show");
    state.started = true;
    state.running = true;
    state.gameOver = false;
    state.paused = false;
    state.sessionStart = Date.now();
    state.nextScholarAt = performance.now() + SCHOLAR_INTERVAL_MS + rand(0, SCHOLAR_INTERVAL_JITTER);
    state.lastTick = 0;
    state.lastSave = performance.now();
    refreshAll();

    // Start music
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start("archive-dusk"); } catch (e) {}
  }

  function pauseGame() {
    if (!state.running || state.gameOver || state.paused) return;
    state.paused = true;
    state.pauseStartedAt = performance.now();
    pauseScreen.classList.add("show");
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck(0.25, 250); } catch (e) {}
  }
  function resumeGame() {
    if (!state.paused) {
      pauseScreen.classList.remove("show");
      return;
    }
    // Offset timed deadlines by the paused duration so boosts/scholar timer don't expire while paused
    const pausedFor = performance.now() - (state.pauseStartedAt || performance.now());
    if (pausedFor > 0) {
      Object.values(state.boosts).forEach(b => {
        if (b.expiresAt) b.expiresAt += pausedFor;
      });
      if (state.insightExpiresAt) state.insightExpiresAt += pausedFor;
      if (state.nextScholarAt) state.nextScholarAt += pausedFor;
    }
    state.paused = false;
    state.pauseStartedAt = 0;
    pauseScreen.classList.remove("show");
    state.lastTick = 0;
    tickAccum = 0;
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore(250); } catch (e) {}
    // Resume RAF if it was stopped (defensive — pause itself doesn't stop RAF)
    if (!rafId && !state.gameOver && state.running) rafId = requestAnimationFrame(tick);
  }
  function restartGame() {
    // Wipe save and reset to fresh
    clearSave();
    state.knowledge = 0;
    state.totalEarned = 0;
    state.totalClicks = 0;
    state.clicks = 0;
    PRODUCERS.forEach(p => { state.producers[p.id] = 0; });
    state.upgradesBought = {};
    state.boosts = {};
    state.luckyCoinActive = false;
    state.powerupInventory = [null, null, null];
    state.milestonesHit = {};
    state.volumes = 0;
    state.lives = STARTING_LIVES;
    state.scholarActive = false;
    state.gameOver = false;
    state.totalProducerPurchases = 0;
    state.totalUpgrades = 0;
    state.totalPublished = 0;
    state.correctScholarAnswers = 0;
    state.powerupsUsed = 0;

    pauseScreen.classList.remove("show");
    endScreen.classList.remove("show");
    state.paused = false;
    refreshAll();
    state.nextScholarAt = performance.now() + SCHOLAR_INTERVAL_MS;
  }

  function endGame(reason) {
    state.gameOver = true;
    state.running = false;
    state.paused = false;
    audio.gameOver();
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch (e) {}

    endTitle.textContent = reason || "Archive Closed";
    endKicker.textContent = "Run Ended";

    endGrid.innerHTML = "";
    const stats = [
      ["Volumes Published", state.totalPublished],
      ["Total Knowledge", fmtNum(state.totalEarned)],
      ["Manual Scribbles", fmtNum(state.totalClicks)],
      ["Producers Bought", state.totalProducerPurchases],
      ["Upgrades Acquired", state.totalUpgrades],
      ["Scholars Answered", state.correctScholarAnswers],
      ["Power-ups Used", state.powerupsUsed],
      ["Final Multiplier", "×" + globalMultiplier().toFixed(2)]
    ];
    stats.forEach(([label, value]) => {
      const div = document.createElement("div");
      div.className = "end-stat";
      div.innerHTML = `<span class="end-stat-label">${label}</span><span class="end-stat-value">${value}</span>`;
      endGrid.appendChild(div);
    });
    retryHint.textContent = "Run another archive — your published volumes carry forward across new sessions.";
    endScreen.classList.add("show");

    // Award shards on end
    if (state.totalPublished > 0) {
      awardShards(5 * state.totalPublished, "archive-tycoon-end-volumes");
    }
    clearSave(); // game over wipes save
  }

  function exitToHub() {
    save();
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch (e) {}
    window.location.href = "../../index.html";
  }

  function toggleSound() {
    state.soundOn = !state.soundOn;
    audio.enabled = state.soundOn;
    soundBtn.textContent = state.soundOn ? "Sound On" : "Sound Off";
    if (!state.soundOn) {
      try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch (e) {}
    } else if (state.running) {
      try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start("archive-dusk"); } catch (e) {}
    }
    save();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }

  // ─── Event wiring ────────────────────────────────────────────────────────
  function wireEvents() {
    canvas.addEventListener("click", handleCanvasClick);
    // touchstart for immediate tap response (deduped via _lastTouchAt so click doesn't double-fire)
    canvas.addEventListener("touchstart", handleCanvasTouch, { passive: false });
    canvas.addEventListener("touchend", handleCanvasTouch, { passive: false });

    startBtn.addEventListener("click", startGame);
    soundBtn.addEventListener("click", toggleSound);
    fullscreenBtn.addEventListener("click", toggleFullscreen);

    pauseBtn.addEventListener("click", pauseGame);
    resumeBtn.addEventListener("click", resumeGame);
    restartBtn.addEventListener("click", () => { restartGame(); resumeGame(); });
    pauseExitBtn.addEventListener("click", exitToHub);
    exitBtn.addEventListener("click", exitToHub);
    setupBtn.addEventListener("click", () => { endScreen.classList.remove("show"); showSetup(); });
    againBtn.addEventListener("click", () => { endScreen.classList.remove("show"); restartGame(); startGame(); });

    prestigeBtn.addEventListener("click", showPrestige);
    prestigeCancelBtn.addEventListener("click", () => prestigeScreen.classList.remove("show"));
    prestigeConfirmBtn.addEventListener("click", doPrestige);

    questionCloseBtn.addEventListener("click", skipScholar);

    powerupSlots.forEach((slot, i) => {
      slot.addEventListener("click", () => usePowerup(i));
    });

    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", sizeCanvas);
    window.addEventListener("beforeunload", () => save());

    // Pause when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) save();
    });
  }

  function handleKeydown(e) {
    // Setup screen
    if (!state.started) return;

    const key = e.key;
    if (key === "Escape" || key === "p" || key === "P") {
      e.preventDefault();
      if (state.paused) resumeGame();
      else if (state.running) pauseGame();
      return;
    }
    if (state.paused || state.gameOver) return;
    if (state.scholarActive && key === "Escape") {
      skipScholar();
      return;
    }

    // Scribble (space)
    if (key === " " || key === "Spacebar") {
      e.preventDefault();
      const W = state.canvasLogicalSize;
      doScribbleClick(W / 2, W / 2);
      return;
    }
    // Buy producers 1-7
    const num = parseInt(key, 10);
    if (!isNaN(num) && num >= 1 && num <= 7) {
      e.preventDefault();
      buyProducer(PRODUCERS[num - 1].id);
      return;
    }
    // Powerup keys 8/9/0 (since 1-7 are producers)
    if (key === "8") { usePowerup(0); return; }
    if (key === "9") { usePowerup(1); return; }
    if (key === "0") { usePowerup(2); return; }

    // Upgrade hotkeys: q,w,e,r,t,y,u for click/global upgrades
    const ukeys = { q: "click-2x-1", w: "click-2x-2", e: "click-2x-3", r: "click-2x-4", t: "global-2x-1", y: "global-2x-2", u: "global-2x-3" };
    if (ukeys[key]) {
      e.preventDefault();
      buyUpgrade(ukeys[key]);
      return;
    }

    // Publish
    if (key === "P" || key === "p") return; // P handled above for pause
    if (key === "+" || key === "=") {
      e.preventDefault();
      if (canPrestige()) showPrestige();
    }
  }

  // ─── Boot ────────────────────────────────────────────────────────────────
  function boot() {
    sizeCanvas();
    wireEvents();
    refreshAll();

    // Try to load existing save (preview, not auto-resume)
    showSetup();

    // Start RAF loop
    rafId = requestAnimationFrame(tick);

    // Toast / icon / extras integration (graceful no-ops if not present)
    try {
      window.MrMacsArcadeIcons?.applyIcons?.(document);
    } catch (e) {}

    // Analytics ping
    try {
      window.MrMacsArcadeAnalytics?.recordPlay?.("archive-tycoon");
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
