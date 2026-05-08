(() => {
  "use strict";

  // ─── CONSTANTS ───────────────────────────────────────────────────────────────
  const BASE_W = 1600, BASE_H = 900;
  const STORAGE_KEY = "mr-macs-time-rift-v1";
  const MAX_RUN_MINUTES = 20;
  const BOSS_EVERY_SECONDS = 300; // every 5 minutes
  const $ = (id) => document.getElementById(id);
  const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;

  // ─── DOM REFS ─────────────────────────────────────────────────────────────────
  const els = {
    canvas: $("arena"),
    level: $("level"), hp: $("hp"), era: $("era"), score: $("score"),
    killCount: $("killCount"), goldCount: $("goldCount"), runTimer: $("runTimer"),
    hpBar: $("hpBar"), xpBar: $("xpBar"),
    bankCount: $("bankCount"), courseFilter: $("courseFilter"), setFilter: $("setFilter"),
    libraryBtn: $("libraryBtn"), libraryPanel: $("libraryPanel"), libraryStatus: $("libraryStatus"),
    startBtn: $("startBtn"), pauseBtn: $("pauseBtn"), soundBtn: $("soundBtn"), resetBtn: $("resetBtn"),
    fullscreenBtn: $("fullscreenBtn"), missionTitle: $("missionTitle"),
    questionTimer: $("questionTimer"), questionPrompt: $("questionPrompt"),
    choices: $("choices"), stimulus: $("stimulus"),
    stimulusZoom: $("stimulusZoom"), stimulusZoomImg: $("stimulusZoomImg"), stimulusClose: $("stimulusClose"),
    typedForm: $("typedForm"), typedAnswer: $("typedAnswer"), feedback: $("feedback"),
    relicList: $("relicList"), buildPower: $("buildPower"),
    upgradeScreen: $("upgradeScreen"), upgradeGrid: $("upgradeGrid"), riftBanner: $("riftBanner")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const liteFx = new URLSearchParams(location.search).get("fx") !== "full";
  document.documentElement.classList.toggle("perf-lite", liteFx);

  const images = {};
  const assetPaths = {
    arena: "../../assets/time-rift/arena.webp",
    sprites: "../../assets/time-rift/sprites.png",
    relics: "../../assets/time-rift/relics.png"
  };

  // ─── ERAS ─────────────────────────────────────────────────────────────────────
  const eras = ["Ancient", "Medieval", "Revolution", "Industrial", "Modern", "Final Rift"];

  // ─── WEAPON DEFINITIONS ──────────────────────────────────────────────────────
  // Each weapon has 8 levels. Level stats are interpolated between level 1 and 8.
  const WEAPONS = {
    cannonball: {
      name: "Cannonball", icon: "💣", color: "#ffd66e",
      desc: "Slow heavy bolt — massive damage",
      baseCooldown: 2.2, baseDamage: 85, baseSpeed: 320, baseRadius: 18, basePierce: 1,
      // per-level multipliers [cooldown, damage, area, pierce]
      levels: [
        { cd: 2.2, dmg: 85,  area: 18, pierce: 1 },
        { cd: 2.0, dmg: 108, area: 20, pierce: 1 },
        { cd: 1.8, dmg: 135, area: 22, pierce: 1 },
        { cd: 1.7, dmg: 162, area: 24, pierce: 2 },
        { cd: 1.6, dmg: 194, area: 26, pierce: 2 },
        { cd: 1.4, dmg: 230, area: 28, pierce: 2 },
        { cd: 1.3, dmg: 270, area: 32, pierce: 3 },
        { cd: 1.1, dmg: 320, area: 36, pierce: 3 }
      ],
      fire(ws) {
        const target = nearestEnemy();
        if (!target) return;
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        const lv = ws.levels[ws.level - 1];
        spawnProjectile({ kind:"cannonball", x:player.x, y:player.y,
          vx: Math.cos(angle)*320, vy: Math.sin(angle)*320,
          dmg: lv.dmg, radius: lv.area, pierce: lv.pierce, life: 2.5,
          color: "#ffd66e" });
        sfx.cannonball();
      }
    },
    musket: {
      name: "Musket Volley", icon: "🔫", color: "#c58cff",
      desc: "3-shot spread — rapid triple fire",
      levels: [
        { cd: 1.4, dmg: 28, shots: 3, spread: 0.22 },
        { cd: 1.3, dmg: 34, shots: 3, spread: 0.20 },
        { cd: 1.1, dmg: 40, shots: 3, spread: 0.18 },
        { cd: 1.0, dmg: 47, shots: 4, spread: 0.18 },
        { cd: 0.9, dmg: 55, shots: 4, spread: 0.16 },
        { cd: 0.8, dmg: 65, shots: 5, spread: 0.16 },
        { cd: 0.7, dmg: 76, shots: 5, spread: 0.14 },
        { cd: 0.6, dmg: 90, shots: 6, spread: 0.12 }
      ],
      fire(ws) {
        const target = nearestEnemy();
        if (!target) return;
        const base = Math.atan2(target.y - player.y, target.x - player.x);
        const lv = ws.levels[ws.level - 1];
        for (let i = 0; i < lv.shots; i++) {
          const half = (lv.shots - 1) / 2;
          const a = base + (i - half) * lv.spread;
          spawnProjectile({ kind:"bullet", x:player.x, y:player.y,
            vx: Math.cos(a)*820, vy: Math.sin(a)*820,
            dmg: lv.dmg, radius: 7, pierce: 1, life: 0.9,
            color: "#c58cff" });
        }
        sfx.musket();
      }
    },
    saber: {
      name: "Saber Slash", icon: "⚔️", color: "#6cf3b2",
      desc: "Close-range arc — hits all nearby foes",
      levels: [
        { cd: 0.9, dmg: 45, range: 160, arc: Math.PI*0.7 },
        { cd: 0.85,dmg: 56, range: 175, arc: Math.PI*0.75 },
        { cd: 0.8, dmg: 70, range: 190, arc: Math.PI*0.8 },
        { cd: 0.75,dmg: 85, range: 210, arc: Math.PI*0.85 },
        { cd: 0.7, dmg: 102,range: 230, arc: Math.PI*0.9 },
        { cd: 0.65,dmg: 122,range: 250, arc: Math.PI*0.95 },
        { cd: 0.6, dmg: 145,range: 275, arc: Math.PI },
        { cd: 0.5, dmg: 172,range: 310, arc: Math.PI*1.1 }
      ],
      fire(ws) {
        const lv = ws.levels[ws.level - 1];
        const facing = player.facing || 0;
        let hit = 0;
        for (const e of state.enemies) {
          const d = dist(player, e);
          if (d > lv.range) continue;
          let a = Math.atan2(e.y - player.y, e.x - player.x) - facing;
          while (a > Math.PI) a -= Math.PI*2;
          while (a < -Math.PI) a += Math.PI*2;
          if (Math.abs(a) < lv.arc / 2) {
            damageEnemy(e, lv.dmg, "#6cf3b2");
            hit++;
          }
        }
        state.particles.push({ kind:"arc", x:player.x, y:player.y,
          angle:facing, arc:lv.arc, range:lv.range,
          color:"#6cf3b2", life:0.22, maxLife:0.22 });
        if (hit) sfx.slash();
        sfx.slash();
      }
    },
    pendulum: {
      name: "Pendulum", icon: "⚙️", color: "#ff8b6b",
      desc: "Orbiting mass — damages on contact",
      levels: [
        { cd: 999, orbs: 1, dmg: 22, radius: 100, orbRadius: 20 },
        { cd: 999, orbs: 1, dmg: 28, radius: 112, orbRadius: 22 },
        { cd: 999, orbs: 2, dmg: 32, radius: 118, orbRadius: 23 },
        { cd: 999, orbs: 2, dmg: 38, radius: 128, orbRadius: 25 },
        { cd: 999, orbs: 3, dmg: 45, radius: 136, orbRadius: 27 },
        { cd: 999, orbs: 3, dmg: 54, radius: 148, orbRadius: 29 },
        { cd: 999, orbs: 4, dmg: 64, radius: 160, orbRadius: 32 },
        { cd: 999, orbs: 4, dmg: 76, radius: 178, orbRadius: 36 }
      ],
      fire() {} // handled by updateOrbitals
    },
    telegraph: {
      name: "Telegraph", icon: "⚡", color: "#72f2ff",
      desc: "Chain lightning — jumps between enemies",
      levels: [
        { cd: 1.8, dmg: 38, chains: 2, range: 250 },
        { cd: 1.7, dmg: 47, chains: 3, range: 270 },
        { cd: 1.6, dmg: 58, chains: 3, range: 290 },
        { cd: 1.4, dmg: 70, chains: 4, range: 310 },
        { cd: 1.2, dmg: 84, chains: 4, range: 335 },
        { cd: 1.0, dmg: 100,chains: 5, range: 360 },
        { cd: 0.9, dmg: 118,chains: 6, range: 390 },
        { cd: 0.75,dmg: 140,chains: 7, range: 420 }
      ],
      fire(ws) {
        if (!state.enemies.length) return;
        const lv = ws.levels[ws.level - 1];
        const first = nearestEnemy();
        if (!first) return;
        const hit = new Set([first]);
        let last = first;
        damageEnemy(first, lv.dmg, "#72f2ff");
        state.particles.push({ kind:"beam", x:player.x, y:player.y-20, tx:first.x, ty:first.y, color:"#72f2ff", life:0.18, maxLife:0.18 });
        for (let c = 1; c < lv.chains; c++) {
          let best = null, bd = Infinity;
          for (const e of state.enemies) {
            if (hit.has(e) || e.dead) continue;
            const d = dist(last, e);
            if (d < lv.range && d < bd) { bd = d; best = e; }
          }
          if (!best) break;
          hit.add(best);
          state.particles.push({ kind:"beam", x:last.x, y:last.y, tx:best.x, ty:best.y, color:"#72f2ff", life:0.18, maxLife:0.18 });
          damageEnemy(best, lv.dmg * 0.75, "#72f2ff");
          last = best;
        }
        sfx.lightning();
      }
    },
    boomerang: {
      name: "Boomerang", icon: "🪃", color: "#ffd66e",
      desc: "Returns to sender — pierces enemies",
      levels: [
        { cd: 1.6, dmg: 32, pierce: 5, speed: 600 },
        { cd: 1.5, dmg: 40, pierce: 6, speed: 640 },
        { cd: 1.4, dmg: 50, pierce: 6, speed: 680 },
        { cd: 1.3, dmg: 62, pierce: 7, speed: 720 },
        { cd: 1.2, dmg: 76, pierce: 8, speed: 760 },
        { cd: 1.1, dmg: 92, pierce: 9, speed: 800 },
        { cd: 1.0, dmg:110, pierce:10, speed: 840 },
        { cd: 0.85,dmg:132, pierce:12, speed: 900 }
      ],
      fire(ws) {
        const target = nearestEnemy();
        if (!target) return;
        const lv = ws.levels[ws.level - 1];
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        spawnProjectile({ kind:"boomerang", x:player.x, y:player.y,
          vx:Math.cos(angle)*lv.speed, vy:Math.sin(angle)*lv.speed,
          origVx:Math.cos(angle)*lv.speed, origVy:Math.sin(angle)*lv.speed,
          dmg:lv.dmg, radius:14, pierce:lv.pierce, life:1.4,
          returning:false, returnTimer:0.5,
          color:"#ffd66e" });
        sfx.boomerang();
      }
    },
    eraBomb: {
      name: "Era Bomb", icon: "💥", color: "#ff5d72",
      desc: "Timed AOE explosion",
      levels: [
        { cd: 4.0, dmg: 120, blastR: 140 },
        { cd: 3.6, dmg: 150, blastR: 158 },
        { cd: 3.2, dmg: 185, blastR: 176 },
        { cd: 2.9, dmg: 224, blastR: 194 },
        { cd: 2.6, dmg: 268, blastR: 212 },
        { cd: 2.3, dmg: 318, blastR: 232 },
        { cd: 2.0, dmg: 374, blastR: 256 },
        { cd: 1.7, dmg: 440, blastR: 285 }
      ],
      fire(ws) {
        const lv = ws.levels[ws.level - 1];
        const target = nearestEnemy() || { x: player.x + Math.random()*200-100, y: player.y + Math.random()*200-100 };
        state.projectiles.push({ kind:"bomb", x:target.x, y:target.y,
          vx:0, vy:0, dmg:lv.dmg, radius:lv.blastR,
          fuseTimer:1.2, life:1.5, color:"#ff5d72", dead:false });
        sfx.bomb();
      }
    },
    timeEcho: {
      name: "Time Echo", icon: "👻", color: "#c58cff",
      desc: "Summons a copy of yourself that fights for 3 seconds",
      levels: [
        { cd: 8.0, dmg: 0.5, duration: 3 },
        { cd: 7.5, dmg: 0.6, duration: 3.5 },
        { cd: 7.0, dmg: 0.7, duration: 4 },
        { cd: 6.5, dmg: 0.8, duration: 4.5 },
        { cd: 6.0, dmg: 0.9, duration: 5 },
        { cd: 5.5, dmg: 1.0, duration: 5.5 },
        { cd: 5.0, dmg: 1.1, duration: 6 },
        { cd: 4.5, dmg: 1.3, duration: 7 }
      ],
      fire(ws) {
        const lv = ws.levels[ws.level - 1];
        state.echos.push({
          x: player.x + (Math.random()-0.5)*80,
          y: player.y + (Math.random()-0.5)*80,
          life: lv.duration, maxLife: lv.duration,
          dmgMult: lv.dmg,
          fireTimer: 0
        });
        sfx.echo();
      }
    }
  };

  // ─── PASSIVE DEFINITIONS ─────────────────────────────────────────────────────
  const PASSIVES = {
    speed: {
      name:"Swift Boots", icon:"👟", desc:"Move speed +12% per level",
      levels:[12,24,36,50,65,82,100,120],
      apply(lv) { player.speedBonus = 1 + PASSIVES.speed.levels[lv-1]/100; }
    },
    magnet: {
      name:"Lodestone", icon:"🧲", desc:"XP pickup range +60px per level",
      levels:[60,120,180,240,300,370,450,550],
      apply(lv) { state.magnetRange = 96 + PASSIVES.magnet.levels[lv-1]; }
    },
    maxhp: {
      name:"Iron Will", icon:"❤️", desc:"Max HP +20 per level",
      levels:[20,40,60,85,112,142,175,215],
      apply(lv) {
        const old = player.maxHp;
        player.maxHp = 100 + PASSIVES.maxhp.levels[lv-1];
        player.hp += player.maxHp - old;
        player.hp = Math.min(player.hp, player.maxHp);
      }
    },
    regen: {
      name:"Vital Tide", icon:"💚", desc:"+1 HP/sec regen per level",
      levels:[1,2,3.5,5,7,9.5,12.5,16],
      apply(lv) { state.regenRate = PASSIVES.regen.levels[lv-1]; }
    },
    area: {
      name:"Rift Lens", icon:"🔬", desc:"Weapon AoE +10% per level",
      levels:[10,20,32,45,60,77,97,120],
      apply(lv) { state.areaBonus = 1 + PASSIVES.area.levels[lv-1]/100; }
    },
    multishot: {
      name:"Powder Keg", icon:"💨", desc:"+1 projectile per 2 levels",
      levels:[1,1,2,2,3,3,4,4],
      apply(lv) { state.extraProjectiles = PASSIVES.multishot.levels[lv-1]; }
    },
    crit: {
      name:"Eagle Eye", icon:"🦅", desc:"Crit chance +8% per level",
      levels:[8,16,24,32,42,52,64,78],
      apply(lv) { state.critChance = PASSIVES.crit.levels[lv-1]/100; }
    },
    cooldown: {
      name:"Hourglass", icon:"⏳", desc:"Cooldown -8% per level",
      levels:[8,15,22,29,36,43,50,58],
      apply(lv) { state.cooldownReduction = PASSIVES.cooldown.levels[lv-1]/100; }
    }
  };

  // ─── EVOLUTIONS ──────────────────────────────────────────────────────────────
  const EVOLUTIONS = [
    {
      name:"Siege Cannon", icon:"🏰", color:"#ffd66e",
      desc:"Cannonball+Hourglass → massive slow AoE cannon",
      requires:["cannonball","cooldown"],
      replaces:"cannonball",
      weaponOverride: {
        levels:[{ cd:3.5, dmg:620, area:90, pierce:8 }],
        fire(ws) {
          const target = nearestEnemy();
          if (!target) return;
          const angle = Math.atan2(target.y-player.y, target.x-player.x);
          spawnProjectile({ kind:"siege", x:player.x, y:player.y,
            vx:Math.cos(angle)*220, vy:Math.sin(angle)*220,
            dmg:620, radius:90, pierce:8, life:3.5, color:"#ffd66e" });
          sfx.cannonball();
        }
      }
    },
    {
      name:"Storm Telegraph", icon:"🌩️", color:"#72f2ff",
      desc:"Telegraph+Eagle Eye → bounces crit bolts",
      requires:["telegraph","crit"],
      replaces:"telegraph",
      weaponOverride: {
        levels:[{ cd:0.6, dmg:180, chains:12, range:500 }],
        fire(ws) {
          if (!state.enemies.length) return;
          const lv = { dmg:180, chains:12, range:500 };
          const first = nearestEnemy(); if (!first) return;
          const hit = new Set([first]);
          let last = first;
          damageEnemy(first, lv.dmg, "#72f2ff", true);
          state.particles.push({ kind:"beam", x:player.x, y:player.y-20, tx:first.x, ty:first.y, color:"#72f2ff", life:0.25, maxLife:0.25 });
          for (let c = 1; c < lv.chains; c++) {
            let best = null, bd = Infinity;
            for (const e of state.enemies) {
              if (hit.has(e)||e.dead) continue;
              const d = dist(last, e);
              if (d < lv.range && d < bd) { bd = d; best = e; }
            }
            if (!best) break;
            hit.add(best);
            state.particles.push({ kind:"beam", x:last.x, y:last.y, tx:best.x, ty:best.y, color:"#72f2ff", life:0.25, maxLife:0.25 });
            damageEnemy(best, lv.dmg*0.9, "#72f2ff", true);
            last = best;
          }
          sfx.lightning();
        }
      }
    },
    {
      name:"Ghost Army", icon:"💀", color:"#c58cff",
      desc:"TimeEcho+Speed → 3 echoes at once",
      requires:["timeEcho","speed"],
      replaces:"timeEcho",
      weaponOverride: {
        levels:[{ cd:6.0, dmg:1.5, duration:8 }],
        fire(ws) {
          for (let i = 0; i < 3; i++) {
            state.echos.push({
              x: player.x + (Math.random()-0.5)*200,
              y: player.y + (Math.random()-0.5)*200,
              life:8, maxLife:8, dmgMult:1.5, fireTimer:i*0.4
            });
          }
          sfx.echo();
        }
      }
    }
  ];

  // ─── ENEMY ARCHETYPES ────────────────────────────────────────────────────────
  const ENEMY_TYPES = [
    {
      id:"shambler", name:"Era Shambler", color:"#ffd66e",
      hp:80, speed:65, dmg:10, reward:12, radius:34,
      desc:"Slow tank — soaks damage",
      draw(e,time) { drawCircleEnemy(e, "#ffd66e", time, 0.8); }
    },
    {
      id:"zipper", name:"Rift Zipper", color:"#92f0c4",
      hp:28, speed:195, dmg:7, reward:8, radius:20,
      desc:"Fast low-HP — swarms quickly",
      draw(e,time) { drawCircleEnemy(e, "#92f0c4", time, 0.5); }
    },
    {
      id:"shooter", name:"Arc Shooter", color:"#c58cff",
      hp:55, speed:72, dmg:8, reward:14, radius:28,
      ranged:true, fireRate:2.2,
      desc:"Ranged — fires projectiles at player",
      draw(e,time) { drawCircleEnemy(e, "#c58cff", time, 0.6); }
    },
    {
      id:"exploder", name:"Blast Wraith", color:"#ff5d72",
      hp:40, speed:140, dmg:45, reward:15, radius:26,
      kamikaze:true,
      desc:"Kamikaze — detonates on contact",
      draw(e,time) { drawCircleEnemy(e, "#ff5d72", time, 0.55); }
    },
    {
      id:"splitter", name:"Split Shade", color:"#ff8b6b",
      hp:100, speed:78, dmg:9, reward:18, radius:38,
      splits:2,
      desc:"Splits into 2 smaller enemies on death",
      draw(e,time) { drawCircleEnemy(e, "#ff8b6b", time, 0.7); }
    },
    {
      id:"boss", name:"Rift Overlord", color:"#ffd66e",
      hp:1400, speed:48, dmg:22, reward:200, radius:62,
      boss:true, phase:1,
      desc:"Boss — every 5 minutes, special mechanics",
      draw(e,time) { drawCircleEnemy(e, "#ffd66e", time, 1.4, true); }
    }
  ];

  // ─── PICKUP TYPES ────────────────────────────────────────────────────────────
  const PICKUP_HEART = "heart";
  const PICKUP_SHELL = "shell";
  const PICKUP_MAGNET = "magnet";
  const PICKUP_CHEST = "chest";
  const PICKUP_XP = "xp";

  // ─── PLAYER STATE ────────────────────────────────────────────────────────────
  const player = {
    x: BASE_W / 2, y: BASE_H / 2,
    radius: 32, hp: 100, maxHp: 100,
    baseSpeed: 265, speedBonus: 1,
    get speed() { return this.baseSpeed * this.speedBonus; },
    facing: 0, target: null,
    invincible: 0  // invincibility frames after hit
  };

  // ─── CAMERA ──────────────────────────────────────────────────────────────────
  const camera = { x: BASE_W/2, y: BASE_H/2, zoom: 1 };
  const WORLD_W = BASE_W * 2.5, WORLD_H = BASE_H * 2.5;

  // ─── GAME STATE ──────────────────────────────────────────────────────────────
  const state = {
    // bank/question
    bank: null, filtered: [], queue: [], currentQuestion: null,
    // run flags
    running: false, paused: false, gameOver: false, sound: true,
    // timing
    last: 0, frameStamp: 0, elapsed: 0, runTime: 0,
    spawnTimer: 0, spawnEvery: 0.82,
    trialTimer: 8, trialEvery: 22, trialOpen: false,
    choosingUpgrade: false,
    // progression
    level: 1, xp: 0, xpNext: 50, xpBonus: 0,
    score: 0, kills: 0, gold: 0, shards: 0,
    streak: 0, answered: 0, correct: 0,
    rerollTokens: 1, pendingUpgradePool: null,
    // best / meta
    bestScore: Number(localStorage.getItem(`${STORAGE_KEY}:best`) || 0),
    metaGold: Number(localStorage.getItem(`${STORAGE_KEY}:gold`) || 0),
    metaUpgrades: JSON.parse(localStorage.getItem(`${STORAGE_KEY}:upgrades`) || "{}"),
    // weapons + passives
    weaponSlots: [], passiveSlots: [],
    equippedEvolutions: [],
    weaponCooldowns: {},
    // entity lists
    enemies: [], projectiles: [], pickups: [], particles: [], texts: [], echos: [],
    // input
    keys: new Set(), pointerDown: false,
    joystick: { active:false, baseX:0, baseY:0, dx:0, dy:0 },
    // modifiers from passives
    magnetRange: 96,
    regenRate: 0, regenAccum: 0,
    areaBonus: 1, extraProjectiles: 0,
    critChance: 0, cooldownReduction: 0,
    armor: 0, knockback: 0, scoreBonus: 0,
    damage: 1, // global damage multiplier
    // fx
    shake: 0, flash: 0, flashColor: "#ffd66e",
    deathSlowmo: 0,
    // misc
    guard: 0,
    correctHeal: 8,
    // last boss time
    lastBossTime: 0,
    // drone for background audio
    droneFilter: null, droneGain: null,
    // boss banner
    _bossBanner: 0
  };

  // ─── META SHOP ───────────────────────────────────────────────────────────────
  const META_UPGRADES = [
    { id:"startSlot",  name:"Extra Weapon Slot", desc:"Start each run with 2 weapon slots", cost:150 },
    { id:"dmgBonus",   name:"+10% Damage",       desc:"All weapon damage +10% permanently", cost:100 },
    { id:"pickupRange",name:"+15% Pickup Range", desc:"XP magnet range +15% from start",   cost:80  },
    { id:"startHp",    name:"+25 Starting HP",   desc:"Start each run with 125 max HP",     cost:120 },
    { id:"rerollStart",name:"Extra Reroll",       desc:"Start each run with 2 reroll tokens",cost:90 },
    { id:"xpBoost",    name:"+15% XP Gain",      desc:"All XP gems worth 15% more",         cost:110 },
    { id:"goldFind",   name:"+20% Gold Find",     desc:"Enemies drop 20% more gold",         cost:130 },
    { id:"critStart",  name:"Starter Crit",       desc:"Begin each run with 8% crit chance", cost:140 }
  ];

  // ─── QUESTION HELPERS (preserved from original) ───────────────────────────────
  const sourcePromptRe = /(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(documents|statements|headlines|sources|passages|figures|maps|graphs|charts|cartoons)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|similar\s+to\s+this)/i;
  function promptNeedsStimulus(q) { return sourcePromptRe.test(String((q&&(q.prompt||q.stem))||"")); }
  function stimulusTextFor(q) { if (!q) return ""; return q.stimulusText||(typeof q.stimulus==="string"?q.stimulus:""); }
  function stimulusImagesFor(q) {
    if (SourceBank) return SourceBank.stimulusImages(q);
    if (!q) return [];
    const list = Array.isArray(q.stimulusImages)?q.stimulusImages:[];
    const imgs = list.length?list:(q.stimulusImage?[{src:q.stimulusImage,label:"Source stimulus"}]:[]);
    if (!imgs.length) return [];
    if (q.stimulusRequired===true||q.stimulusImage||q.stimulusText||q.stimulusHtml||typeof q.stimulus==="string") return imgs.filter(i=>i&&i.src);
    if (q.stimulusRequired===false) return [];
    return promptNeedsStimulus(q)?imgs.filter(i=>i&&i.src):[];
  }
  function hasReliableStimulus(q) { return Boolean(stimulusTextFor(q)||(q&&q.stimulusHtml)||stimulusImagesFor(q).length); }
  function isPlayableQuestion(q) {
    if (!q||!q.prompt||!q.answer) return false;
    if (SourceBank&&!SourceBank.playableSharedPrompt(q)) return false;
    if (SourceBank&&SourceBank.sourceBased(q)) {
      if (!hasReliableStimulus(q)) return false;
      if (q.type==="mcq") return SourceBank.usableRegentsQuestion(q);
      return true;
    }
    if (q.type!=="mcq") return true;
    if (hasReliableStimulus(q)) return true;
    return !promptNeedsStimulus(q);
  }

  // ─── UTILITIES ───────────────────────────────────────────────────────────────
  const clamp = (v,mn,mx) => Math.max(mn, Math.min(mx, v));
  const money = (v) => Math.floor(v).toLocaleString();
  const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
  function shuffle(arr) {
    const a=[...arr];
    for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  function normalize(v) {
    return String(v||"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9 ]+/g," ")
      .replace(/\b(the|a|an)\b/g," ").replace(/\s+/g," ").trim();
  }
  function escapeHtml(v) {
    return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function isTypingTarget(t) {
    if (!t) return false;
    const tag=String(t.tagName||"").toLowerCase();
    return tag==="input"||tag==="textarea"||tag==="select"||Boolean(t.isContentEditable);
  }
  function polishStudyText(text) {
    const R=[[/\bunited states\b/gi,"United States"],[/\bu\.s\.\b/gi,"U.S."],[/\bnew york\b/gi,"New York"],
      [/\bamerica\b/gi,"America"],[/\bamerican\b/gi,"American"],[/\beurope\b/gi,"Europe"],[/\beuropean\b/gi,"European"],
      [/\bafrica\b/gi,"Africa"],[/\basia\b/gi,"Asia"],[/\bchina\b/gi,"China"],[/\bjapan\b/gi,"Japan"],
      [/\bindia\b/gi,"India"],[/\bbritain\b/gi,"Britain"],[/\bfrance\b/gi,"France"],[/\bgermany\b/gi,"Germany"],
      [/\brussia\b/gi,"Russia"],[/\bsoviet\b/gi,"Soviet"],[/\bgreek\b/gi,"Greek"],[/\broman\b/gi,"Roman"],
      [/\bsilk road\b/gi,"Silk Road"],[/\bottoman\b/gi,"Ottoman"],[/\bcatholic\b/gi,"Catholic"],
      [/\bprotestant\b/gi,"Protestant"],[/\brenaissance\b/gi,"Renaissance"],[/\benlightenment\b/gi,"Enlightenment"],
      [/\bindustrial revolution\b/gi,"Industrial Revolution"],[/\bworld war i\b/gi,"World War I"],
      [/\bworld war ii\b/gi,"World War II"],[/\bcold war\b/gi,"Cold War"],[/\bnew deal\b/gi,"New Deal"],
      [/\bcongress\b/gi,"Congress"],[/\bconstitution\b/gi,"Constitution"],[/\bpresident\b/gi,"President"]];
    return R.reduce((v,[p,r])=>v.replace(p,r), text);
  }
  function displayPrompt(q) {
    const raw=String(q?.prompt||"").trim();
    const cleaned=raw.replace(/^final\s+clue(?:\s+for\s+[^:]+)?:\s*/i,"").replace(/^name\s+this\s+content\s+item:\s*/i,"").trim();
    const p=polishStudyText(cleaned);
    return p?p.charAt(0).toUpperCase()+p.slice(1):raw;
  }
  function nearestEnemy(src) {
    src = src || player;
    let best=null, bd=Infinity;
    for (const e of state.enemies) {
      if (e.dead) continue;
      const d=dist(src,e);
      if (d<bd) { bd=d; best=e; }
    }
    return best;
  }

  // ─── AUDIO ────────────────────────────────────────────────────────────────────
  const sfx = (() => {
    let actx = null;
    let droneOsc = null, droneFilter = null, droneGainNode = null;
    function ac() {
      if (!state.sound) return null;
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      return actx;
    }
    function tone(freq, dur=0.08, type="sine", gain=0.04, attack=0.01) {
      const a = ac(); if (!a) return;
      const osc=a.createOscillator(), amp=a.createGain();
      osc.type=type; osc.frequency.value=freq;
      amp.gain.setValueAtTime(0,a.currentTime);
      amp.gain.linearRampToValueAtTime(gain,a.currentTime+attack);
      amp.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+dur);
      osc.connect(amp).connect(a.destination);
      osc.start(); osc.stop(a.currentTime+dur+0.02);
    }
    function noise(dur=0.06, gain=0.05) {
      const a=ac(); if (!a) return;
      const buf=a.createBuffer(1,a.sampleRate*dur,a.sampleRate);
      const data=buf.getChannelData(0);
      for (let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
      const src=a.createBufferSource(), amp=a.createGain(), filt=a.createBiquadFilter();
      filt.type="bandpass"; filt.frequency.value=800;
      src.buffer=buf; amp.gain.value=gain;
      src.connect(filt).connect(amp).connect(a.destination);
      src.start(); src.stop(a.currentTime+dur);
    }
    return {
      cannonball() { tone(80,0.5,"sawtooth",0.08); tone(180,0.3,"triangle",0.05); },
      musket()     { noise(0.04,0.09); tone(400,0.04,"square",0.03); },
      slash()      { tone(320,0.07,"sawtooth",0.05); tone(520,0.04,"triangle",0.03); },
      lightning()  { tone(1200,0.06,"square",0.04); tone(600,0.1,"sawtooth",0.03); },
      boomerang()  { tone(440,0.06,"triangle",0.04); setTimeout(()=>tone(660,0.08,"triangle",0.03),120); },
      bomb()       { tone(60,0.8,"sawtooth",0.09); noise(0.12,0.12); },
      echo()       { tone(840,0.12,"sine",0.035); setTimeout(()=>tone(1080,0.18,"sine",0.025),80); },
      hit()        { tone(340+Math.random()*160,0.04,"triangle",0.016); },
      xpPick()     { tone(600+Math.random()*400,0.05,"sine",0.022); },
      levelUp()    { [440,660,880].forEach((f,i)=>setTimeout(()=>tone(f,0.14,"sine",0.038),i*70)); },
      bossRoar()   { tone(55,1.2,"sawtooth",0.11); tone(80,0.9,"square",0.06); },
      heartPick()  { tone(880,0.08,"sine",0.04); setTimeout(()=>tone(1100,0.1,"sine",0.03),60); },
      shellBlast() { tone(60,0.6,"sawtooth",0.1); noise(0.2,0.15); },
      magnetSweep(){ tone(720,0.3,"sine",0.03); },
      correct()    { tone(740,0.08,"triangle",0.04); setTimeout(()=>tone(1180,0.1,"triangle",0.034),70); },
      wrong()      { tone(170,0.18,"sawtooth",0.034); },
      death() {
        const a=ac(); if (!a) return;
        [880,700,520,380,240,120].forEach((f,i)=>setTimeout(()=>tone(f,0.22,"sine",0.04),i*120));
      },
      mute() { if (actx) actx.suspend(); },
      unmute() { if (actx) actx.resume(); },
      startDrone() {
        const a=ac(); if (!a) return;
        if (droneOsc) return;
        droneOsc=a.createOscillator();
        droneFilter=a.createBiquadFilter();
        droneGainNode=a.createGain();
        droneOsc.type="sawtooth"; droneOsc.frequency.value=55;
        droneFilter.type="lowpass"; droneFilter.frequency.value=200;
        droneGainNode.gain.value=0.012;
        droneOsc.connect(droneFilter).connect(droneGainNode).connect(a.destination);
        droneOsc.start();
        state.droneFilter=droneFilter; state.droneGain=droneGainNode;
      },
      updateDrone(intensity) { // 0-1
        if (!droneFilter) return;
        droneFilter.frequency.value=200+intensity*800;
        droneGainNode.gain.value=0.012+intensity*0.04;
      },
      stopDrone() {
        if (droneOsc) { try{droneOsc.stop();}catch(e){} droneOsc=null; droneFilter=null; droneGainNode=null; state.droneFilter=null; }
      }
    };
  })();

  // ─── IMAGE LOADER ─────────────────────────────────────────────────────────────
  function loadImage(name, src) {
    return new Promise((resolve) => {
      const img=new Image();
      img.onload=()=>{images[name]=img; resolve(img);};
      img.onerror=()=>resolve(null);
      img.src=src;
    });
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  async function init() {
    await Promise.all(Object.entries(assetPaths).map(([n,s])=>loadImage(n,s)));
    try {
      const res=await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
      state.bank=await res.json();
      state.bank.questions=state.bank.questions.filter(isPlayableQuestion);
      rebuildSetIndex();
    } catch(e) {
      state.bank={ questions:[], courses:[], setsByCourse:{} };
    }
    initFilters(); initControls(); applyFilters();
    applyMetaUpgrades();
    giveStartingWeapon();
    renderHUD(); updateRelicPanel();
    showBanner("Enter the Rift");
    // ── MrMacsProfile boot ──────────────────────────────────────────────────
    if (window.MrMacsProfile) {
      MrMacsProfile.recordPlay({
        id: "time-rift-survivors",
        title: "Time Rift Survivors",
        course: "All Courses",
        file: "games/time-rift-survivors/index.html"
      });
      const settings = MrMacsProfile.getSettings();
      if (settings.sound === "off") {
        state.sound = false;
        els.soundBtn.textContent = "Sound Off";
      }
    }
    // ────────────────────────────────────────────────────────────────────────
    requestAnimationFrame(loop);
  }

  function applyMetaUpgrades() {
    const mu=state.metaUpgrades;
    if (mu.startHp) { player.maxHp=125; player.hp=125; }
    if (mu.dmgBonus) state.damage=1.1;
    if (mu.pickupRange) state.magnetRange=Math.round(96*1.15);
    if (mu.rerollStart) state.rerollTokens=2;
    if (mu.xpBoost) state.xpBonus=0.15;
    if (mu.critStart) state.critChance=0.08;
  }

  function giveStartingWeapon() {
    const slots = state.metaUpgrades.startSlot ? 2 : 1;
    // Always start with cannonball in slot 0
    state.weaponSlots=[{
      id:"cannonball", ...WEAPONS.cannonball, level:1,
      cooldownTimer:0
    }];
    if (slots>1) {
      state.weaponSlots.push({ id:"musket", ...WEAPONS.musket, level:1, cooldownTimer:0 });
    }
  }

  // ─── FILTER / BANK ───────────────────────────────────────────────────────────
  function rebuildSetIndex() {
    const sbc={};
    state.bank.questions.forEach(q=>{
      if (!sbc[q.course]) sbc[q.course]=new Set();
      sbc[q.course].add(q.set);
    });
    state.bank.setsByCourse=Object.fromEntries(
      Object.entries(sbc).map(([c,s])=>[c,[...s].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))])
    );
  }
  function fillSets() {
    const course=els.courseFilter.value;
    let sets=course==="All Courses"
      ?[...new Set(state.bank.questions.map(q=>q.set))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))
      :(state.bank.setsByCourse[course]||[]);
    els.setFilter.innerHTML=["All Sets",...sets].map(s=>`<option>${escapeHtml(s)}</option>`).join("");
  }
  function applyFilters() {
    const course=els.courseFilter.value, set=els.setFilter.value;
    state.filtered=state.bank.questions.filter(q=>{
      if (course!=="All Courses"&&q.course!==course) return false;
      if (set!=="All Sets"&&q.set!==set) return false;
      return true;
    });
    state.queue=shuffle(state.filtered);
    els.bankCount.textContent=`${state.filtered.length.toLocaleString()} prompts`;
    els.libraryStatus.textContent=`${course} / ${set}`;
    els.missionTitle.textContent=course==="All Courses"?"Mixed Timeline Run":course;
    prepareQuestion();
  }
  function initFilters() {
    if (!state.bank.courses) return;
    const courses=["All Courses",...state.bank.courses];
    els.courseFilter.innerHTML=courses.map(c=>`<option>${escapeHtml(c)}</option>`).join("");
    els.courseFilter.value="All Courses";
    els.courseFilter.addEventListener("change",()=>{fillSets();applyFilters();});
    els.setFilter.addEventListener("change",applyFilters);
    fillSets();
  }


  // ─── CONTROLS ────────────────────────────────────────────────────────────────
  function initControls() {
    els.startBtn.addEventListener("click", startRun);
    els.pauseBtn.addEventListener("click", () => {
      if (!state.running||state.gameOver) return;
      state.paused=!state.paused;
      els.pauseBtn.textContent=state.paused?"Resume":"Pause";
      if (state.paused) sfx.stopDrone(); else sfx.startDrone();
    });
    els.soundBtn.addEventListener("click", () => {
      state.sound=!state.sound;
      els.soundBtn.textContent=state.sound?"Sound On":"Sound Off";
      if (!state.sound) sfx.stopDrone();
    });
    els.resetBtn.addEventListener("click", resetRun);
    els.fullscreenBtn.addEventListener("click", ()=>{
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
    });
    els.libraryBtn.addEventListener("click", ()=>{
      els.libraryPanel.classList.remove("is-highlighted");
      void els.libraryPanel.offsetWidth;
      els.libraryPanel.classList.add("is-highlighted");
      els.libraryPanel.scrollIntoView({behavior:reduceMotion?"auto":"smooth",block:"start"});
      els.courseFilter.focus({preventScroll:true});
    });
    els.stimulusClose.addEventListener("click", closeStimulus);
    els.stimulusZoom.addEventListener("click", (e)=>{ if (e.target===els.stimulusZoom) closeStimulus(); });
    els.typedForm.addEventListener("submit", (e)=>{ e.preventDefault(); submitAnswer(els.typedAnswer.value); });

    // keyboard
    window.addEventListener("keydown", (e) => {
      if (isTypingTarget(e.target)) return;
      const k=e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(k)) {
        state.keys.add(k); player.target=null; e.preventDefault();
      }
      if (e.key===" ") { e.preventDefault(); startRun(); }
    });
    window.addEventListener("keyup", (e) => {
      if (isTypingTarget(e.target)) return;
      state.keys.delete(e.key.toLowerCase());
    });

    // virtual joystick (touch)
    const joyZone = els.canvas;
    joyZone.addEventListener("touchstart", onTouchStart, {passive:false});
    joyZone.addEventListener("touchmove",  onTouchMove,  {passive:false});
    joyZone.addEventListener("touchend",   onTouchEnd,   {passive:false});
    joyZone.addEventListener("touchcancel",onTouchEnd,   {passive:false});

    // pointer for tap-to-move on desktop only when no joystick
    els.canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType==="touch") return;
      state.pointerDown=true;
      player.target=canvasPoint(e);
      els.canvas.setPointerCapture?.(e.pointerId);
    });
    els.canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType==="touch"||!state.pointerDown) return;
      player.target=canvasPoint(e);
    });
    els.canvas.addEventListener("pointerup", ()=>state.pointerDown=false);
  }

  let joystickTouchId = null;
  function onTouchStart(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const rect=els.canvas.getBoundingClientRect();
      const cx=(t.clientX-rect.left)*BASE_W/rect.width;
      const cy=(t.clientY-rect.top)*BASE_H/rect.height;
      // left third of canvas = joystick zone
      if (cx < BASE_W*0.38 && joystickTouchId===null) {
        joystickTouchId=t.identifier;
        state.joystick={ active:true, baseX:cx, baseY:cy, dx:0, dy:0 };
      }
    }
  }
  function onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier!==joystickTouchId) continue;
      const rect=els.canvas.getBoundingClientRect();
      const cx=(t.clientX-rect.left)*BASE_W/rect.width;
      const cy=(t.clientY-rect.top)*BASE_H/rect.height;
      const rawDx=cx-state.joystick.baseX;
      const rawDy=cy-state.joystick.baseY;
      const len=Math.hypot(rawDx,rawDy)||1;
      const maxR=120;
      state.joystick.dx=(len>maxR?rawDx/len*maxR:rawDx)/maxR;
      state.joystick.dy=(len>maxR?rawDy/len*maxR:rawDy)/maxR;
    }
  }
  function onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier===joystickTouchId) {
        joystickTouchId=null;
        state.joystick={ active:false, baseX:0, baseY:0, dx:0, dy:0 };
      }
    }
  }

  function canvasPoint(e) {
    const rect=els.canvas.getBoundingClientRect();
    return { x:(e.clientX-rect.left)*BASE_W/rect.width, y:(e.clientY-rect.top)*BASE_H/rect.height };
  }

  // ─── RUN MANAGEMENT ──────────────────────────────────────────────────────────
  function startRun() {
    if (state.gameOver) resetRun();
    if (state.running) return;
    state.running=true; state.paused=false;
    els.startBtn.textContent="Running";
    els.pauseBtn.textContent="Pause";
    showBanner("Rift Open");
    sfx.startDrone();
  }

  function resetRun() {
    sfx.stopDrone();
    state.running=false; state.paused=false; state.gameOver=false;
    state.elapsed=0; state.runTime=0;
    state.spawnTimer=0; state.spawnEvery=0.82;
    state.trialTimer=8; state.trialEvery=22; state.trialOpen=false;
    state.choosingUpgrade=false;
    state.level=1; state.xp=0; state.xpNext=50; state.xpBonus=0;
    state.score=0; state.kills=0; state.gold=0; state.shards=0;
    state.streak=0; state.answered=0; state.correct=0;
    state.rerollTokens=1; state.pendingUpgradePool=null;
    state.enemies=[]; state.projectiles=[]; state.pickups=[];
    state.particles=[]; state.texts=[]; state.echos=[];
    state.magnetRange=96; state.regenRate=0; state.regenAccum=0;
    state.areaBonus=1; state.extraProjectiles=0;
    state.critChance=0; state.cooldownReduction=0;
    state.armor=0; state.knockback=0; state.scoreBonus=0;
    state.damage=1; state.guard=0; state.correctHeal=8;
    state.shake=0; state.flash=0; state.deathSlowmo=0;
    state.lastBossTime=0; state._bossBanner=0;
    player.x=BASE_W/2; player.y=BASE_H/2;
    player.hp=100; player.maxHp=100;
    player.baseSpeed=265; player.speedBonus=1; player.facing=0;
    player.target=null; player.invincible=0;
    camera.x=BASE_W/2; camera.y=BASE_H/2;
    els.startBtn.textContent="Start Run";
    els.pauseBtn.textContent="Pause";
    els.upgradeScreen.classList.remove("show");
    applyMetaUpgrades();
    giveStartingWeapon();
    prepareQuestion(); renderHUD(); updateRelicPanel();
    showBanner("Reset");
  }

  // ─── QUESTION SYSTEM ─────────────────────────────────────────────────────────
  function nextQuestion() {
    if (!state.queue.length) state.queue=shuffle(state.filtered);
    return state.queue.pop()||null;
  }

  function prepareQuestion() {
    const q=nextQuestion();
    state.currentQuestion=q;
    els.feedback.textContent=""; els.feedback.className="feedback";
    els.choices.innerHTML=""; els.typedAnswer.value="";
    if (!q) {
      renderStimulus(null);
      els.questionPrompt.textContent="No prompts match this filter.";
      els.choices.style.display="none"; els.typedForm.style.display="none"; return;
    }
    renderStimulus(q);
    els.questionPrompt.textContent=displayPrompt(q);
    if (q.type==="mcq"&&q.choices?.length) {
      els.typedForm.style.display="none"; els.choices.style.display="grid";
      els.choices.innerHTML=q.choices.map(c=>`<button type="button" data-choice="${escapeHtml(c.label)}">${escapeHtml(c.label)}. ${escapeHtml(c.text)}</button>`).join("");
      els.choices.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>submitAnswer(b.dataset.choice)));
    } else {
      const choices=buildChoices(q);
      els.typedForm.style.display="grid"; els.choices.style.display="grid";
      els.choices.innerHTML=choices.map(c=>`<button type="button" data-choice="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
      els.choices.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>submitAnswer(b.dataset.choice)));
    }
  }

  function buildChoices(q) {
    const correct=q.answer;
    const pool=shuffle(state.filtered.map(i=>i.answer).filter(a=>a&&normalize(a)!==normalize(correct)));
    return shuffle([correct,...pool.slice(0,3)]);
  }

  function renderStimulus(q) {
    const imgs=stimulusImagesFor(q), text=stimulusTextFor(q);
    if (!imgs.length&&!text) { els.stimulus.hidden=true; els.stimulus.innerHTML=""; return; }
    els.stimulus.hidden=false;
    const textBlock=text?`<p>${escapeHtml(text)}</p>`:"";
    const imageButtons=imgs.map((item,i)=>{
      const label=item.label||`Source ${i+1}`;
      return `<button type="button" data-src="${escapeHtml(item.src)}" data-label="${escapeHtml(label)}">
        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(label)}">
        <span>${escapeHtml(label)}</span>
      </button>`;
    }).join("");
    els.stimulus.innerHTML=textBlock+imageButtons;
    els.stimulus.querySelectorAll("button[data-src]").forEach(b=>
      b.addEventListener("click",()=>openStimulus(b.dataset.src,b.dataset.label)));
  }

  function openStimulus(src,label) {
    state.wasPausedForStimulus=state.paused;
    if (state.running&&!state.paused) { state.paused=true; els.pauseBtn.textContent="Resume"; }
    els.stimulusZoomImg.src=src; els.stimulusZoomImg.alt=label||"Source";
    els.stimulusZoom.classList.add("show"); els.stimulusZoom.setAttribute("aria-hidden","false");
  }
  function closeStimulus() {
    els.stimulusZoom.classList.remove("show"); els.stimulusZoom.setAttribute("aria-hidden","true");
    els.stimulusZoomImg.removeAttribute("src");
    if (state.running&&!state.wasPausedForStimulus&&!state.gameOver) { state.paused=false; els.pauseBtn.textContent="Pause"; }
  }

  function submitAnswer(raw) {
    const q=state.currentQuestion;
    if (!q||state.choosingUpgrade) return;
    const isCorrect=checkAnswer(q,raw);
    state.answered+=1; state.trialOpen=false; state.trialTimer=state.trialEvery;
    if (isCorrect) {
      state.correct+=1; state.streak+=1;
      const reward=260+state.streak*45;
      state.score+=Math.round(reward*(1+state.scoreBonus));
      player.hp=Math.min(player.maxHp,player.hp+state.correctHeal);
      riftStrike(150+state.streak*18);
      els.feedback.textContent=`Timeline strike. ${q.explanation||q.answer}`;
      els.feedback.className="feedback good";
      sfx.correct();
      // bonus upgrade roll for correct answer
      window.setTimeout(()=>showUpgradeChoices(true),450);
    } else {
      state.streak=0; state.shake=0.55; spawnAmbush();
      els.feedback.textContent=`Rift unstable. Answer: ${q.answer}. ${q.explanation||""}`;
      els.feedback.className="feedback bad"; sfx.wrong();
    }
    renderHUD();
    window.setTimeout(prepareQuestion, isCorrect?1300:2300);
  }

  function checkAnswer(q,raw) {
    if (q.type==="mcq") return String(raw)===String(q.correct);
    const answer=normalize(raw);
    const accepted=[q.answer,...(q.aliases||[])].map(normalize).filter(Boolean);
    return accepted.some(a=>answer===a||(a.length>5&&answer.includes(a))||(answer.length>5&&a.includes(answer)));
  }


  // ─── MAIN LOOP ───────────────────────────────────────────────────────────────
  function loop(now) {
    if (document.hidden) { state.last=now; requestAnimationFrame(loop); return; }
    if (liteFx&&state.frameStamp&&now-state.frameStamp<1000/45) { requestAnimationFrame(loop); return; }
    state.frameStamp=now;
    const rawDt=Math.min(0.05,((now-(state.last||now))/1000)||0);
    state.last=now;
    const dt = state.deathSlowmo>0 ? rawDt*0.15 : rawDt;
    if (state.deathSlowmo>0) state.deathSlowmo=Math.max(0,state.deathSlowmo-rawDt);
    if (!state.paused&&!state.gameOver&&!state.choosingUpgrade) {
      state.elapsed+=dt;
      if (state.running) {
        const prevTime = state.runTime;
        state.runTime+=dt;
        // 15-minute survival milestone (900 seconds)
        if (prevTime < 900 && state.runTime >= 900) {
          window.MrMacsProfile?.addShards(500, "time-rift-survive-15min");
          window.MrMacsProfile?.unlock("tr-survivor-15");
        }
      }
      update(dt);
    }
    draw(now/1000);
    requestAnimationFrame(loop);
  }

  function update(dt) {
    if (!state.running) { updateParticles(dt); return; }
    updateCamera(dt);
    updatePlayer(dt);
    updateSpawn(dt);
    updateWeapons(dt);
    updateOrbitals(dt);
    updateEchos(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateTrial(dt);
    updateRegen(dt);
    state.flash=Math.max(0,state.flash-dt*2.2);
    state.shake=Math.max(0,state.shake-dt*1.4);
    // drone intensity = enemy count / 80 clamped
    sfx.updateDrone(clamp(state.enemies.length/80,0,1));
    renderHUD();
  }

  // ─── CAMERA ──────────────────────────────────────────────────────────────────
  function updateCamera(dt) {
    const deadZone=80;
    const dx=player.x-camera.x, dy=player.y-camera.y;
    const d=Math.hypot(dx,dy);
    if (d>deadZone) {
      const speed=clamp((d-deadZone)*4,0,900)*dt;
      camera.x+=dx/d*Math.min(speed,d-deadZone);
      camera.y+=dy/d*Math.min(speed,d-deadZone);
    }
    camera.x=clamp(camera.x,0,BASE_W); camera.y=clamp(camera.y,0,BASE_H);
  }

  // ─── PLAYER MOVEMENT ─────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    let dx=0, dy=0;
    if (state.keys.has("w")||state.keys.has("arrowup"))    dy-=1;
    if (state.keys.has("s")||state.keys.has("arrowdown"))  dy+=1;
    if (state.keys.has("a")||state.keys.has("arrowleft"))  dx-=1;
    if (state.keys.has("d")||state.keys.has("arrowright")) dx+=1;
    // virtual joystick overrides
    if (state.joystick.active) {
      dx=state.joystick.dx; dy=state.joystick.dy;
    }
    if (dx||dy) {
      const len=Math.hypot(dx,dy)||1;
      player.x+=dx/len*player.speed*dt;
      player.y+=dy/len*player.speed*dt;
      player.facing=Math.atan2(dy/len,dx/len);
      player.target=null;
    } else if (player.target) {
      const d=Math.hypot(player.target.x-player.x,player.target.y-player.y);
      if (d>10) {
        player.x+=(player.target.x-player.x)/d*player.speed*dt;
        player.y+=(player.target.y-player.y)/d*player.speed*dt;
        player.facing=Math.atan2(player.target.y-player.y,player.target.x-player.x);
      }
    }
    player.x=clamp(player.x,72,BASE_W-72);
    player.y=clamp(player.y,86,BASE_H-86);
    if (player.invincible>0) player.invincible=Math.max(0,player.invincible-dt);
  }

  function updateRegen(dt) {
    if (!state.regenRate) return;
    state.regenAccum+=state.regenRate*dt;
    if (state.regenAccum>=1) {
      const heal=Math.floor(state.regenAccum);
      player.hp=Math.min(player.maxHp,player.hp+heal);
      state.regenAccum-=heal;
    }
  }

  // ─── SPAWNING ────────────────────────────────────────────────────────────────
  function currentEraIndex() { return clamp(Math.floor(state.runTime/38),0,eras.length-1); }

  function updateSpawn(dt) {
    const eraIdx=currentEraIndex();
    // ramp: 0-2min slow, 5-10min hordes, 15+ thick
    const t=state.runTime;
    let rate = t<120 ? 0.9-t*0.003
             : t<600 ? 0.6-t*0.0008
             : 0.22;
    state.spawnEvery=Math.max(0.12,rate);
    state.spawnTimer-=dt;
    if (state.spawnTimer<=0) {
      const count = t<120 ? 1 : t<600 ? Math.floor(1+t/300) : 4;
      for (let i=0;i<count;i++) spawnEnemy(false,eraIdx);
      state.spawnTimer=state.spawnEvery;
    }
    // boss every 5 minutes
    const bossN=Math.floor(t/BOSS_EVERY_SECONDS);
    if (bossN>Math.floor((t-dt)/BOSS_EVERY_SECONDS)&&t>10) {
      spawnBoss(eraIdx);
      showBanner("⚠ BOSS RIFT ⚠");
      sfx.bossRoar();
      state.flash=1; state.flashColor="#ff5d72";
      state._bossBanner = 2.2; // seconds to show boss banner
    }
  }

  function spawnEnemy(forceBoss=false,eraIdx=0) {
    if (forceBoss) { spawnBoss(eraIdx); return; }
    const t=state.runTime;
    // weighted enemy type pool by time
    const pool = t<120 ? ["shambler","zipper"]
               : t<300 ? ["shambler","zipper","shooter","exploder"]
               : t<600 ? ["shambler","zipper","shooter","exploder","splitter"]
               : ["shambler","zipper","shooter","exploder","splitter"];
    // bias toward zipper swarms at horde phase
    const id = t>300&&Math.random()<0.4 ? "zipper" : pool[Math.floor(Math.random()*pool.length)];
    const base=ENEMY_TYPES.find(e=>e.id===id)||ENEMY_TYPES[0];
    const scale=1+t*0.009;
    const {x,y}=spawnOffscreen();
    state.enemies.push({
      ...base,
      x,y,
      hp:Math.round(base.hp*scale), maxHp:Math.round(base.hp*scale),
      speed:base.speed*(1+Math.min(0.5,t*0.003)),
      damage:base.damage, reward:Math.round(base.reward*(1+t*0.008)),
      dead:false, hit:0, wobble:Math.random()*Math.PI*2,
      fireTimer: base.ranged ? (Math.random()*base.fireRate) : 0,
      splitDone:false
    });
  }

  function spawnBoss(eraIdx) {
    const base=ENEMY_TYPES.find(e=>e.id==="boss");
    const t=state.runTime;
    const bossN=Math.max(1,Math.floor(t/BOSS_EVERY_SECONDS));
    const scale=1+bossN*0.6;
    const {x,y}=spawnOffscreen(true);
    state.enemies.push({
      ...base,
      x,y,
      hp:Math.round(base.hp*scale), maxHp:Math.round(base.hp*scale),
      speed:base.speed*(1+bossN*0.08),
      damage:base.damage*(1+bossN*0.12),
      reward:base.reward*(1+bossN*0.5),
      dead:false, hit:0, wobble:0, fireTimer:2,
      phase:1, bossN
    });
  }

  function spawnOffscreen(boss=false) {
    const angle=Math.random()*Math.PI*2;
    const r=boss?820:Math.max(BASE_W,BASE_H)*0.62+Math.random()*200;
    return { x:BASE_W/2+Math.cos(angle)*r, y:BASE_H/2+Math.sin(angle)*r };
  }

  function spawnAmbush() {
    for (let i=0;i<6;i++) spawnEnemy(false,currentEraIndex());
    state.flash=1; state.flashColor="#ff5d72";
  }

  // ─── WEAPONS UPDATE ──────────────────────────────────────────────────────────
  function weaponCooldownFor(ws) {
    const lv=ws.levels[ws.level-1];
    const cd=lv.cd||1.0;
    return cd*(1-state.cooldownReduction*0.5); // max 50% from cooldown reduction
  }

  function updateWeapons(dt) {
    for (const ws of state.weaponSlots) {
      if (ws.id==="pendulum") continue; // handled by orbitals
      ws.cooldownTimer=(ws.cooldownTimer||0)-dt;
      if (ws.cooldownTimer<=0) {
        ws.fire(ws);
        ws.cooldownTimer=weaponCooldownFor(ws);
      }
    }
  }

  function updateOrbitals(dt) {
    const pendulum=state.weaponSlots.find(w=>w.id==="pendulum");
    if (!pendulum) return;
    const lv=pendulum.levels[pendulum.level-1];
    const orbs=lv.orbs||1;
    const orbR=lv.radius||100;
    const orbSize=(lv.orbRadius||20)*state.areaBonus;
    for (let i=0;i<orbs;i++) {
      const angle=state.elapsed*(1.3+orbs*0.07)+i*Math.PI*2/orbs;
      const ox=player.x+Math.cos(angle)*orbR;
      const oy=player.y+Math.sin(angle)*orbR;
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x-ox,e.y-oy)<e.radius+orbSize) {
          damageEnemy(e,lv.dmg*state.areaBonus*dt*3,"#ff8b6b");
        }
      }
    }
  }

  function updateEchos(dt) {
    for (const echo of state.echos) {
      echo.life-=dt;
      if (echo.life<=0) continue;
      echo.fireTimer-=dt;
      if (echo.fireTimer<=0) {
        const target=nearestEnemy(echo);
        if (target) {
          const angle=Math.atan2(target.y-echo.y,target.x-echo.x);
          spawnProjectile({ kind:"bullet", x:echo.x, y:echo.y,
            vx:Math.cos(angle)*720, vy:Math.sin(angle)*720,
            dmg:30*echo.dmgMult*state.damage, radius:8, pierce:1, life:0.9,
            color:"#c58cff" });
          sfx.hit();
        }
        echo.fireTimer=0.45;
      }
    }
    state.echos=state.echos.filter(e=>e.life>0);
  }

  // ─── ENTITY UPDATE ───────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (const e of state.enemies) {
      if (e.dead) continue;
      e.hit=Math.max(0,e.hit-dt*4);
      const angle=Math.atan2(player.y-e.y,player.x-e.x);
      const d=dist(e,player);
      e.x+=Math.cos(angle)*e.speed*dt;
      e.y+=Math.sin(angle)*e.speed*dt;
      // ranged shooter — fires at player
      if (e.ranged) {
        e.fireTimer=(e.fireTimer||0)-dt;
        if (e.fireTimer<=0 && d<600) {
          const a=Math.atan2(player.y-e.y,player.x-e.x)+(Math.random()-0.5)*0.3;
          state.projectiles.push({ kind:"enemyBullet", x:e.x, y:e.y,
            vx:Math.cos(a)*320, vy:Math.sin(a)*320,
            dmg:e.damage, radius:8, pierce:1, life:2.4, color:"#c58cff", enemy:true, dead:false });
          e.fireTimer=e.fireRate||2.5;
        }
      }
      // boss phase 2 at 50%
      if (e.boss && e.phase===1 && e.hp/e.maxHp<0.5) {
        e.phase=2; e.speed*=1.5;
        addText(e.x,e.y-80,"PHASE 2","#ff5d72");
        state.shake=0.8;
      }
      // contact damage
      if (d<e.radius+player.radius) {
        if (e.kamikaze) {
          // explode
          addBurst(e.x,e.y,e.color,40);
          sfx.bomb();
          hurtPlayer(e.damage);
          e.dead=true;
        } else {
          hurtPlayer(e.damage*dt*1.6);
        }
      }
    }
    state.enemies=state.enemies.filter(e=>!e.dead);
  }

  function spawnProjectile(p) {
    p.dead=false;
    p.hitSet=new Set(); // track what it's already hit for pierce
    state.projectiles.push(p);
  }

  function updateProjectiles(dt) {
    for (const p of state.projectiles) {
      if (p.dead) continue;
      p.life-=dt;
      if (p.kind==="bomb") {
        // fused bomb — does not move
        p.fuseTimer=(p.fuseTimer||0)-dt;
        if (p.fuseTimer<=0) {
          // explode
          const blastR=p.radius*state.areaBonus;
          for (const e of state.enemies) {
            if (e.dead||dist(p,e)>blastR+e.radius) continue;
            damageEnemy(e,p.dmg*state.damage,"#ff5d72");
          }
          addBurst(p.x,p.y,"#ff5d72",50);
          state.particles.push({kind:"ring",x:p.x,y:p.y,r:0,max:blastR,color:"#ff5d72",life:0.4,maxLife:0.4});
          sfx.shellBlast();
          p.dead=true;
        }
        continue;
      }
      // boomerang return logic
      if (p.kind==="boomerang") {
        p.returnTimer=(p.returnTimer||0)-dt;
        if (!p.returning&&p.returnTimer<=0) {
          p.returning=true;
          p.vx=-p.origVx; p.vy=-p.origVy;
        }
        if (p.returning) {
          // redirect toward player
          const a=Math.atan2(player.y-p.y,player.x-p.x);
          const spd=Math.hypot(p.vx,p.vy);
          p.vx=Math.cos(a)*spd; p.vy=Math.sin(a)*spd;
          if (dist(p,player)<30) { p.dead=true; continue; }
        }
      }
      p.x+=p.vx*dt; p.y+=p.vy*dt;
      if (p.life<=0||p.x<-200||p.x>BASE_W+200||p.y<-200||p.y>BASE_H+200) { p.dead=true; continue; }
      // enemy bullet hits player
      if (p.enemy) {
        if (dist(p,player)<player.radius+p.radius) {
          hurtPlayer(p.dmg);
          addBurst(p.x,p.y,"#c58cff",10);
          p.dead=true;
        }
        continue;
      }
      // player bullet hits enemies
      for (const e of state.enemies) {
        if (e.dead||p.hitSet.has(e)) continue;
        if (dist(p,e)<e.radius+p.radius) {
          const isCrit=Math.random()<state.critChance;
          const dmg=p.dmg*state.damage*(isCrit?2:1);
          damageEnemy(e,dmg,isCrit?"#ffffff":p.color,false,isCrit);
          p.hitSet.add(e);
          if (p.pierce<=p.hitSet.size) { p.dead=true; break; }
        }
      }
    }
    state.projectiles=state.projectiles.filter(p=>!p.dead);
  }

  function updatePickups(dt) {
    for (const pk of state.pickups) {
      const d=dist(pk,player);
      if (pk.kind===PICKUP_XP && d<state.magnetRange) {
        pk.x+=(player.x-pk.x)/Math.max(1,d)*680*dt;
        pk.y+=(player.y-pk.y)/Math.max(1,d)*680*dt;
      }
      if (d<34) {
        collectPickup(pk);
        pk.dead=true;
      }
    }
    state.pickups=state.pickups.filter(p=>!p.dead);
  }

  function collectPickup(pk) {
    if (pk.kind===PICKUP_XP) {
      gainXp(pk.value*(1+state.xpBonus));
      sfx.xpPick();
    } else if (pk.kind===PICKUP_HEART) {
      player.hp=Math.min(player.maxHp,player.hp+player.maxHp*0.25);
      addText(player.x,player.y-60,"+HP","#6cf3b2");
      sfx.heartPick();
    } else if (pk.kind===PICKUP_SHELL) {
      // nuke screen
      for (const e of state.enemies) if (!e.boss) damageEnemy(e,9999,"#ffd66e");
      addText(player.x,player.y-60,"SHELL BLAST","#ffd66e");
      sfx.shellBlast();
      state.flash=1; state.flashColor="#ffd66e";
    } else if (pk.kind===PICKUP_MAGNET) {
      // sweep all xp gems
      for (const p2 of state.pickups) if (p2.kind===PICKUP_XP) { p2.x=player.x; p2.y=player.y; }
      addText(player.x,player.y-60,"MAGNET","#72f2ff");
      sfx.magnetSweep();
    } else if (pk.kind===PICKUP_CHEST) {
      showUpgradeChoices(false,true); // chest = 3 choices with 1 mandatory rare
      window.MrMacsProfile?.addShards(20, "time-rift-chest");
    }
  }

  function updateTrial(dt) {
    state.trialTimer-=dt;
    if (state.trialTimer<=0&&!state.trialOpen) {
      state.trialOpen=true; state.trialTimer=0;
      els.questionTimer.textContent="answer now";
      showBanner("Rift Trial");
    } else if (!state.trialOpen) {
      els.questionTimer.textContent=`${Math.ceil(state.trialTimer)}s`;
    }
  }


  // ─── COMBAT HELPERS ──────────────────────────────────────────────────────────
  function hurtPlayer(amount) {
    if (player.invincible>0) return;
    if (state.guard>0&&amount>5) {
      state.guard-=1;
      addText(player.x,player.y-48,"GUARD","#72f2ff");
      addBurst(player.x,player.y,"#72f2ff",18);
      return;
    }
    const reduced=Math.max(1,amount*(1-clamp(state.armor,0,0.6)));
    player.hp-=reduced;
    state.shake=Math.max(state.shake,0.22);
    player.invincible=0.18; // brief invincibility
    if (player.hp<=0) { player.hp=0; endRun(); }
  }

  function damageEnemy(e,amount,color="#ffd66e",aoe=false,isCrit=false) {
    if (e.dead) return;
    const finalDmg=Math.max(1,amount);
    e.hp-=finalDmg;
    e.hit=1;
    if (state.knockback&&!aoe) {
      const angle=Math.atan2(e.y-player.y,e.x-player.x);
      e.x+=Math.cos(angle)*state.knockback;
      e.y+=Math.sin(angle)*state.knockback;
    }
    if (isCrit) {
      addText(e.x,e.y-e.radius-10,`CRIT ${Math.round(finalDmg)}`,color);
      state.shake=Math.max(state.shake,0.3);
    } else if (Math.random()<0.25) {
      addText(e.x,e.y-e.radius,Math.round(finalDmg),color);
    }
    if (e.hp<=0) killEnemy(e);
  }

  function killEnemy(e) {
    e.dead=true;
    state.kills+=1;
    const xp=Math.round(e.reward*(1+state.xpBonus));
    // drop XP gem
    state.pickups.push({ kind:PICKUP_XP, x:e.x, y:e.y, value:xp, color:e.color });
    // chance to drop special pickup
    const roll=Math.random();
    if (roll<0.012&&!e.boss)  state.pickups.push({ kind:PICKUP_HEART,  x:e.x+30, y:e.y });
    else if (roll<0.025)       state.pickups.push({ kind:PICKUP_SHELL,  x:e.x-30, y:e.y });
    else if (roll<0.04)        state.pickups.push({ kind:PICKUP_MAGNET, x:e.x,    y:e.y+30 });
    if (e.boss) {
      state.pickups.push({ kind:PICKUP_CHEST, x:e.x, y:e.y });
      state.shards+=10; state.gold+=50;
      window.MrMacsProfile?.addShards(75, "time-rift-boss-kill");
    } else {
      state.gold+=Math.round(e.reward*0.3*(state.metaUpgrades.goldFind?1.2:1));
      window.MrMacsProfile?.addShards(1, "time-rift-kill");
    }
    state.score+=Math.round((e.reward*18+(e.boss?2000:0))*(1+state.scoreBonus));
    addBurst(e.x,e.y,e.color,e.boss?70:20);
    if (e.boss) addText(e.x,e.y,"BOSS SLAIN!","#ffd66e");
    sfx.hit();
    // splitter logic
    if (e.id==="splitter"&&!e.splitDone) {
      e.splitDone=true;
      for (let i=0;i<2;i++) {
        const angle=i*Math.PI+(Math.random()-0.5)*0.5;
        state.enemies.push({
          ...ENEMY_TYPES.find(t=>t.id==="zipper"),
          x:e.x+Math.cos(angle)*40, y:e.y+Math.sin(angle)*40,
          hp:18, maxHp:18, speed:160,
          dead:false, hit:0, wobble:Math.random()*Math.PI*2,
          fireTimer:0, splitDone:true
        });
      }
    }
  }

  function gainXp(value) {
    state.xp+=value;
    while (state.xp>=state.xpNext&&state.level<25) {
      state.xp-=state.xpNext;
      state.level+=1;
      state.xpNext=Math.round(state.xpNext*1.28+22);
      state.score+=200*state.level;
      addText(player.x,player.y-70,`LEVEL ${state.level}`,"#ffd66e");
      sfx.levelUp();
      window.MrMacsProfile?.addShards(15, "time-rift-level-up");
      // XP bar pulse handled in CSS via class toggle
      els.xpBar.style.width="0%";
      showUpgradeChoices(false);
    }
  }

  function riftStrike(amount) {
    state.flash=0.7; state.flashColor="#ffd66e";
    const targets=[...state.enemies].sort((a,b)=>dist(a,player)-dist(b,player)).slice(0,9);
    for (const e of targets) {
      damageEnemy(e,amount*(e.boss?0.6:1),"#ffd66e",true);
      state.particles.push({kind:"beam",x:player.x,y:player.y-40,tx:e.x,ty:e.y,color:"#ffd66e",life:0.2,maxLife:0.2});
    }
  }

  // ─── UPGRADE / LEVEL-UP FLOW ─────────────────────────────────────────────────
  const UPGRADE_POOL_SIZE = 3;

  function buildUpgradePool(fromQuestion=false, isChest=false) {
    // Weapons: new or level up existing
    const allWeaponIds=Object.keys(WEAPONS);
    const equippedIds=state.weaponSlots.map(w=>w.id);
    const upgrades=[];

    // leveling existing weapons
    for (const ws of state.weaponSlots) {
      if (ws.level<8) {
        upgrades.push({ kind:"weapon", id:ws.id, name:`${ws.name} Lv.${ws.level+1}`,
          desc:ws.desc, icon:ws.icon, color:ws.color, isUpgrade:true });
      }
    }
    // new weapons (up to 4 slots total)
    if (equippedIds.length<4) {
      for (const id of allWeaponIds) {
        if (!equippedIds.includes(id)) {
          const w=WEAPONS[id];
          upgrades.push({ kind:"weapon", id, name:w.name, desc:w.desc, icon:w.icon, color:w.color, isNew:true });
        }
      }
    }
    // evolutions
    for (const evo of EVOLUTIONS) {
      if (state.equippedEvolutions.includes(evo.name)) continue;
      const hasAll=evo.requires.every(req=>
        state.weaponSlots.some(w=>w.id===req&&w.level>=8)||
        state.passiveSlots.some(p=>p.id===req&&p.level>=8)
      );
      if (hasAll) upgrades.push({ kind:"evolution", ...evo });
    }
    // passives
    for (const [id,p] of Object.entries(PASSIVES)) {
      const existing=state.passiveSlots.find(s=>s.id===id);
      if (!existing) {
        upgrades.push({ kind:"passive", id, name:p.name, desc:p.desc, icon:p.icon });
      } else if (existing.level<8) {
        upgrades.push({ kind:"passive", id, name:`${p.name} Lv.${existing.level+1}`,
          desc:p.desc, icon:p.icon, isUpgrade:true });
      }
    }

    // chest = force at least 1 evolution or rare
    if (isChest) {
      const rare=upgrades.filter(u=>u.kind==="evolution");
      if (rare.length) {
        const forced=rare[Math.floor(Math.random()*rare.length)];
        const rest=shuffle(upgrades.filter(u=>u!==forced)).slice(0,2);
        return [forced,...rest];
      }
    }
    return shuffle(upgrades).slice(0,UPGRADE_POOL_SIZE);
  }

  function showUpgradeChoices(fromQuestion=false, isChest=false) {
    if (state.choosingUpgrade||state.gameOver) return;
    state.choosingUpgrade=true;
    const pool=buildUpgradePool(fromQuestion,isChest);
    state.pendingUpgradePool=pool;
    renderUpgradeScreen(pool, fromQuestion);
  }

  function renderUpgradeScreen(pool, showQuestion=false) {
    const rerollHtml=state.rerollTokens>0
      ?`<button id="rerollBtn" class="upgrade-reroll" type="button">Reroll (${state.rerollTokens} left)</button>`
      :"";
    const questionHtml=showQuestion&&state.currentQuestion
      ?`<div class="upgrade-question-bonus">
          <span>BONUS ROLL</span> — Answer correctly for an extra choice!
          <button id="upgradeAnswerBtn" type="button">Answer</button>
        </div>`
      :"";

    els.upgradeGrid.innerHTML=pool.map(u=>{
      // compute current level for dots
      let currentLv = 0;
      if (u.kind==="weapon") {
        const ws = state.weaponSlots.find(w=>w.id===u.id);
        currentLv = ws ? ws.level : 0;
      } else if (u.kind==="passive") {
        const ps = state.passiveSlots.find(p=>p.id===u.id);
        currentLv = ps ? ps.level : 0;
      } else if (u.kind==="evolution") {
        currentLv = 8;
      }
      const dots = Array.from({length:8},(_,i)=>`<span class="lvdot${i<currentLv?" active":""}" aria-hidden="true"></span>`).join("");
      const kindLabel = u.kind==="evolution" ? "EVOLUTION" : u.isNew ? "NEW" : `LV.${currentLv+1}`;
      return `<button class="upgrade-card" type="button"
          data-upgrade-id="${escapeHtml(u.id||u.name)}"
          style="--card-color:${u.color||"#ffd66e"}"
          aria-label="Choose ${escapeHtml(u.name)}">
        <span class="upgrade-icon" aria-hidden="true">${u.icon||"⭐"}</span>
        <strong>${escapeHtml(u.name)}</strong>
        <span style="color:var(--magenta);font-size:10px;font-weight:800;letter-spacing:.1em">${kindLabel}</span>
        <span>${escapeHtml(u.desc||"")}</span>
        <div class="lvdots" role="meter" aria-label="Level ${currentLv} of 8">${dots}</div>
      </button>`;
    }).join("")+rerollHtml+questionHtml;

    els.upgradeGrid.querySelectorAll(".upgrade-card").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const uid=btn.dataset.upgradeId;
        const choice=pool.find(u=>(u.id||u.name)===uid);
        if (choice) applyUpgrade(choice);
      });
    });
    const rerollBtn=els.upgradeGrid.querySelector("#rerollBtn");
    if (rerollBtn) rerollBtn.addEventListener("click",()=>{
      state.rerollTokens--;
      const newPool=buildUpgradePool(false,false);
      renderUpgradeScreen(newPool,false);
    });
    const ansBtn=els.upgradeGrid.querySelector("#upgradeAnswerBtn");
    if (ansBtn) ansBtn.addEventListener("click",()=>{
      // collapse the bonus section and give a 4th choice
      const extra=buildUpgradePool().slice(0,1);
      pool.push(...extra);
      renderUpgradeScreen(pool,false);
    });

    els.upgradeScreen.classList.add("show");
    els.upgradeScreen.setAttribute("aria-hidden","false");
  }

  function applyUpgrade(u) {
    if (u.kind==="weapon") {
      if (u.isUpgrade) {
        const ws=state.weaponSlots.find(w=>w.id===u.id);
        if (ws) ws.level=Math.min(8,ws.level+1);
      } else {
        // add new weapon slot
        const def=WEAPONS[u.id];
        if (def) state.weaponSlots.push({id:u.id,...def,level:1,cooldownTimer:0});
      }
    } else if (u.kind==="passive") {
      const existing=state.passiveSlots.find(p=>p.id===u.id);
      if (existing) { existing.level=Math.min(8,existing.level+1); PASSIVES[u.id].apply(existing.level); }
      else { state.passiveSlots.push({id:u.id,level:1}); PASSIVES[u.id].apply(1); }
    } else if (u.kind==="evolution") {
      state.equippedEvolutions.push(u.name);
      const replaced=state.weaponSlots.find(w=>w.id===u.replaces);
      if (replaced) {
        Object.assign(replaced, { id:u.name, name:u.name, ...u.weaponOverride, level:1, cooldownTimer:0 });
      }
      showBanner(`EVOLVED: ${u.name}`);
      sfx.levelUp();
      window.MrMacsProfile?.addShards(150, "time-rift-evolution");
      window.MrMacsProfile?.unlock("tr-evolution");
    }
    state.choosingUpgrade=false;
    els.upgradeScreen.classList.remove("show");
    els.upgradeScreen.setAttribute("aria-hidden","true");
    updateRelicPanel(); renderHUD();
    showBanner(u.name);
  }


  // ─── END RUN ─────────────────────────────────────────────────────────────────
  function endRun() {
    state.gameOver=true; state.running=false;
    player.hp=0; player.invincible=0;
    state.deathSlowmo=1.5; // trigger slowmo zoom
    sfx.stopDrone();
    sfx.death();
    if (state.score>state.bestScore) {
      state.bestScore=state.score;
      localStorage.setItem(`${STORAGE_KEY}:best`,String(state.bestScore));
    }
    // save gold
    state.metaGold+=state.gold;
    localStorage.setItem(`${STORAGE_KEY}:gold`,String(state.metaGold));
    els.startBtn.textContent="Start Run";
    showBanner(`Run Over — ${money(state.score)} pts`);
    // show run summary after slowmo
    window.setTimeout(showRunSummary,2000);
    window.MrMacsAnalytics?.track("game_complete",{
      gameId:"time-rift-survivors", title:"Time Rift Survivors",
      score:state.score, level:state.level,
      accuracy:state.answered?Math.round(state.correct/state.answered*100):0
    },{counter:"game-completions"});
  }

  function showRunSummary() {
    if (!state.gameOver) return;
    const acc = state.answered ? Math.round(state.correct/state.answered*100) : 0;
    const mins = Math.floor(state.runTime/60), secs = Math.floor(state.runTime%60);
    const isNewBest = state.score >= state.bestScore && state.score > 0;
    els.upgradeGrid.innerHTML=`
      <div class="run-summary">
        <div class="run-summary-title">Timeline Broken — Run Complete</div>
        ${isNewBest ? `<div class="run-summary-best">NEW BEST · ${money(state.score)} pts</div>` : ""}
        <div class="run-summary-score">${money(state.score)}</div>
        <div class="run-summary-stats">
          <span>Level <b>${state.level}</b></span>
          <span>Kills <b>${state.kills.toLocaleString()}</b></span>
          <span>Time <b>${mins}:${String(secs).padStart(2,"0")}</b></span>
          <span>Accuracy <b>${acc}%</b></span>
          <span>Gold earned <b>${state.gold.toLocaleString()}</b></span>
          <span>Weapons <b>${state.weaponSlots.length}</b></span>
        </div>
        ${state.metaGold >= 80 ? `<div class="run-summary-shop-hint">You have ${state.metaGold} gold — visit the Meta Shop!</div>` : ""}
        <button id="summaryRetry" class="primary" type="button" aria-label="Play again">Enter the Rift Again</button>
        <button id="summaryMeta" type="button" aria-label="Open meta shop">Meta Shop (${state.metaGold} gold)</button>
      </div>
    `;
    els.upgradeScreen.classList.add("show");
    document.getElementById("summaryRetry")?.addEventListener("click",()=>{
      els.upgradeScreen.classList.remove("show");
      resetRun();
    });
    document.getElementById("summaryMeta")?.addEventListener("click", showMetaShop);
  }

  function showMetaShop() {
    els.upgradeGrid.innerHTML=`
      <div class="meta-shop">
        <div class="meta-shop-title">META SHOP</div>
        <div class="meta-shop-gold">Gold: ${state.metaGold}</div>
        <div class="meta-shop-grid">
          ${META_UPGRADES.map(u=>{
            const owned=!!state.metaUpgrades[u.id];
            return `<button class="upgrade-card meta-upgrade-btn ${owned?"meta-owned":""}"
              data-meta-id="${u.id}" ${owned?"disabled":""} type="button">
              <strong>${escapeHtml(u.name)}</strong>
              <span>${escapeHtml(u.desc)}</span>
              <em>${owned?"Owned":u.cost+" gold"}</em>
            </button>`;
          }).join("")}
        </div>
        <button id="closeMetaShop" type="button" style="margin-top:12px">Back</button>
      </div>
    `;
    document.querySelectorAll(".meta-upgrade-btn:not([disabled])").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const id=btn.dataset.metaId;
        const def=META_UPGRADES.find(u=>u.id===id);
        if (!def||state.metaGold<def.cost) return;
        state.metaGold-=def.cost;
        state.metaUpgrades[id]=true;
        localStorage.setItem(`${STORAGE_KEY}:gold`,String(state.metaGold));
        localStorage.setItem(`${STORAGE_KEY}:upgrades`,JSON.stringify(state.metaUpgrades));
        showMetaShop(); // re-render
      });
    });
    document.getElementById("closeMetaShop")?.addEventListener("click",showRunSummary);
  }

  // ─── HUD + UI ─────────────────────────────────────────────────────────────────
  function renderHUD() {
    const eraIdx = currentEraIndex();
    const hpPct = clamp(player.hp / player.maxHp, 0, 1);
    const xpPct = clamp(state.xp / state.xpNext, 0, 1);

    els.level.textContent = state.level;
    els.hp.textContent = Math.max(0, Math.ceil(player.hp));
    els.era.textContent = eras[eraIdx];
    els.score.textContent = money(state.score);

    els.hpBar.style.width = `${hpPct * 100}%`;
    const hpParent = els.hpBar.parentElement;
    if (hpParent) {
      hpParent.setAttribute("aria-valuenow", Math.round(hpPct*100));
      if (hpPct < 0.28) hpParent.classList.add("hp-critical");
      else hpParent.classList.remove("hp-critical");
    }
    els.xpBar.style.width = `${xpPct * 100}%`;
    const xpParent = els.xpBar.parentElement;
    if (xpParent) xpParent.setAttribute("aria-valuenow", Math.round(xpPct*100));

    els.buildPower.textContent = `Lv.${state.level} · ${state.kills.toLocaleString()} kills`;
    if (!state.trialOpen && state.running) {
      els.questionTimer.textContent = `${Math.ceil(Math.max(0, state.trialTimer))}s`;
    }
    if (els.killCount) els.killCount.textContent = state.kills.toLocaleString();
    if (els.goldCount) els.goldCount.textContent = state.gold.toLocaleString();
    if (els.runTimer) {
      const m = Math.floor(state.runTime/60), s = Math.floor(state.runTime%60);
      els.runTimer.textContent = `${m}:${String(s).padStart(2,"0")}`;
    }
  }

  function updateRelicPanel() {
    const rows=[];
    for (const ws of state.weaponSlots) {
      const dots=Array.from({length:8},(_,i)=>`<span class="lvdot${i<ws.level?" active":""}">`).join("</span>");
      rows.push(`<div class="relic-chip weapon-chip">
        <span class="relic-icon-emoji">${ws.icon||"⚔"}</span>
        <div class="relic-chip-info"><strong>${escapeHtml(ws.name)}</strong><div class="lvdots">${dots}</div></div>
      </div>`);
    }
    for (const ps of state.passiveSlots) {
      const p=PASSIVES[ps.id];
      const dots=Array.from({length:8},(_,i)=>`<span class="lvdot${i<ps.level?" active":""}">`).join("</span>");
      rows.push(`<div class="relic-chip passive-chip">
        <span class="relic-icon-emoji">${p.icon||"★"}</span>
        <div class="relic-chip-info"><strong>${escapeHtml(p.name)}</strong><div class="lvdots">${dots}</div></div>
      </div>`);
    }
    els.relicList.innerHTML=rows.length?rows.join(""):`<div class="library-status">Level up to unlock relics.</div>`;
  }

  function showBanner(text) {
    els.riftBanner.textContent=text;
    els.riftBanner.classList.remove("show");
    void els.riftBanner.offsetWidth;
    els.riftBanner.classList.add("show");
  }

  // ─── PARTICLE HELPERS ─────────────────────────────────────────────────────────
  function addBurst(x,y,color,count) {
    const actual=reduceMotion?Math.min(6,count):liteFx?Math.min(16,Math.ceil(count*0.4)):count;
    for (let i=0;i<actual;i++) {
      const a=Math.random()*Math.PI*2;
      const s=40+Math.random()*190;
      state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
        r:2+Math.random()*5,color,life:0.35+Math.random()*0.55,maxLife:0.9});
    }
  }
  function addText(x,y,value,color="#ffd66e") {
    state.texts.push({x,y,value,color,life:0.9});
  }
  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life-=dt;
      if (p.kind==="ring") { p.r=p.max*(1-p.life/p.maxLife); continue; }
      if (p.kind==="arc"||p.kind==="beam") continue;
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=30*dt;
    }
    state.particles=state.particles.filter(p=>p.life>0);
  }
  function updateTexts(dt) {
    for (const t of state.texts) { t.life-=dt; t.y-=38*dt; }
    state.texts=state.texts.filter(t=>t.life>0);
  }


  // ─── DRAW SYSTEM ──────────────────────────────────────────────────────────────
  function draw(time) {
    const shake=state.shake?Math.sin(time*88)*state.shake*12:0;
    ctx.save();
    ctx.translate(shake,shake*0.4);
    drawBackground(time);
    drawSlowField(time);
    drawPickups(time);
    drawEnemyProjectiles(time);
    drawProjectiles(time);
    drawOrbitalsGfx(time);
    drawEchos(time);
    drawPlayer(time);
    drawEnemies(time);
    drawParticles();
    drawTexts();
    drawOverlay();
    drawJoystick();
    ctx.restore();
    // deathslowmo vignette
    if (state.deathSlowmo>0) {
      ctx.save();
      ctx.globalAlpha=state.deathSlowmo*0.5;
      ctx.fillStyle="#000";
      const g=ctx.createRadialGradient(BASE_W/2,BASE_H/2,100,BASE_W/2,BASE_H/2,700);
      g.addColorStop(0,"transparent"); g.addColorStop(1,"rgba(0,0,0,0.9)");
      ctx.fillStyle=g; ctx.fillRect(0,0,BASE_W,BASE_H);
      ctx.restore();
    }
  }

  function drawBackground(time) {
    if (images.arena) {
      ctx.drawImage(images.arena, 0, 0, BASE_W, BASE_H);
    } else {
      ctx.fillStyle = "#06080f"; ctx.fillRect(0, 0, BASE_W, BASE_H);
      // chromatic aberration grid — three shifted color planes
      if (!reduceMotion) {
        ctx.save();
        const gridSz = 80;
        const offsets = [[2,0,"rgba(255,46,189,.06)"],[0,0,"rgba(114,242,255,.06)"],[-2,0,"rgba(168,255,62,.04)"]];
        for (const [ox, oy, col] of offsets) {
          ctx.strokeStyle = col; ctx.lineWidth = 1;
          for (let x=0; x<BASE_W; x+=gridSz) {
            ctx.beginPath(); ctx.moveTo(x+ox, 0+oy); ctx.lineTo(x+ox, BASE_H+oy); ctx.stroke();
          }
          for (let y=0; y<BASE_H; y+=gridSz) {
            ctx.beginPath(); ctx.moveTo(0+ox, y+oy); ctx.lineTo(BASE_W+ox, y+oy); ctx.stroke();
          }
        }
        ctx.restore();
      }
    }

    // dark vignette
    const grd = ctx.createRadialGradient(BASE_W/2, BASE_H/2, 100, BASE_W/2, BASE_H/2, 820);
    grd.addColorStop(0, "rgba(114,242,255,.008)");
    grd.addColorStop(0.65, "rgba(6,8,15,.015)");
    grd.addColorStop(1, "rgba(6,8,15,.45)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, BASE_W, BASE_H);

    // Era portal: drifting chromatic rift circles
    if (!reduceMotion) {
      ctx.save();
      // Cyan ring
      ctx.globalAlpha = 0.14 + Math.sin(time * 1.1) * 0.04;
      ctx.strokeStyle = "#72f2ff"; ctx.lineWidth = 2;
      ctx.setLineDash([18, 32]); ctx.lineDashOffset = -time * 48;
      ctx.shadowColor = "#72f2ff"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(BASE_W/2, BASE_H/2, 178 + Math.sin(time)*8, 0, Math.PI*2); ctx.stroke();
      // Magenta ring (chromatic aberration offset)
      ctx.globalAlpha = 0.10 + Math.cos(time * 0.9) * 0.03;
      ctx.strokeStyle = "#ff2ebd"; ctx.lineDashOffset = -time * 38 + 14;
      ctx.shadowColor = "#ff2ebd";
      ctx.beginPath(); ctx.arc(BASE_W/2 + 3, BASE_H/2 - 2, 178 + Math.sin(time)*8, 0, Math.PI*2); ctx.stroke();
      // Acid outer ring
      ctx.globalAlpha = 0.08 + Math.cos(time * 0.75) * 0.025;
      ctx.strokeStyle = "#a8ff3e"; ctx.lineWidth = 1.5; ctx.lineDashOffset = -time * 55;
      ctx.shadowColor = "#a8ff3e";
      ctx.beginPath(); ctx.arc(BASE_W/2, BASE_H/2, 295 + Math.cos(time*0.8)*10, 0, Math.PI*2); ctx.stroke();
      ctx.restore();

      // Drifting time-fragment particles (era portals)
      drawTimeFragments(time);
    }
  }

  // Drifting era-portal fragments on background
  const _frags = Array.from({length: 22}, (_, i) => ({
    x: Math.random() * BASE_W, y: Math.random() * BASE_H,
    vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
    r: 4 + Math.random()*18, alpha: 0.04 + Math.random()*0.1,
    hue: Math.floor(Math.random()*3) // 0=cyan 1=magenta 2=acid
  }));
  const FRAG_COLORS = ["#72f2ff","#ff2ebd","#a8ff3e"];

  function drawTimeFragments(time) {
    ctx.save();
    for (const f of _frags) {
      f.x += f.vx * 0.016; f.y += f.vy * 0.016;
      if (f.x < -40) f.x = BASE_W + 40;
      if (f.x > BASE_W + 40) f.x = -40;
      if (f.y < -40) f.y = BASE_H + 40;
      if (f.y > BASE_H + 40) f.y = -40;
      ctx.globalAlpha = f.alpha * (0.6 + Math.sin(time * 2 + f.r) * 0.4);
      ctx.fillStyle = FRAG_COLORS[f.hue];
      ctx.shadowColor = FRAG_COLORS[f.hue]; ctx.shadowBlur = 10;
      // diamond fragment
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(time * 0.3 + f.r);
      ctx.beginPath(); ctx.moveTo(0,-f.r); ctx.lineTo(f.r*0.5,0); ctx.lineTo(0,f.r); ctx.lineTo(-f.r*0.5,0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSlowField(time) {
    // placeholder: draw a subtle pulse ring around player for the slow aura
    ctx.save(); ctx.globalAlpha=0.12;
    ctx.strokeStyle="#72f2ff"; ctx.shadowColor="#72f2ff"; ctx.shadowBlur=14;
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(player.x,player.y,180+Math.sin(time*3)*4,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  function drawPlayer(time) {
    const bobY = Math.sin(time * 4) * 2.5;
    const hit  = player.invincible > 0;
    ctx.save();
    ctx.translate(player.x, player.y + bobY);
    // ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.ellipse(0, 28, 18, 6, 0, 0, Math.PI*2); ctx.fill();

    // cape-wave idle rotation
    const capeAngle = Math.sin(time * 2.8) * 0.04;
    ctx.rotate(capeAngle);

    if (images.sprites) {
      // chromatic-split on hit: draw ghost copies offset in R+B channels
      if (hit) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.globalCompositeOperation = "screen";
        // red channel ghost
        ctx.translate(-6, -2);
        ctx.shadowColor = "#ff2ebd"; ctx.shadowBlur = 28;
        drawSprite(0, -52, -70, 104, 112);
        ctx.translate(12, 4);
        ctx.shadowColor = "#72f2ff"; ctx.shadowBlur = 28;
        drawSprite(0, -52, -70, 104, 112);
        ctx.restore();
      }
      ctx.shadowColor = hit ? "#ff2ebd" : "#72f2ff";
      ctx.shadowBlur  = hit ? 40 : 22;
      ctx.globalAlpha = hit ? (Math.sin(time * 40) * 0.5 + 0.5) : 1; // flicker on hit
      drawSprite(0, -52, -70, 104, 112);
    } else {
      // polished fallback: chronomancer silhouette
      const r = player.radius;
      // body gradient
      const g = ctx.createRadialGradient(0, -r*0.2, r*0.1, 0, 0, r*1.2);
      g.addColorStop(0, hit ? "#ff2ebd" : "#a8e8ff");
      g.addColorStop(0.6, hit ? "#c00080" : "#2266cc");
      g.addColorStop(1, "rgba(20,40,100,0)");
      ctx.shadowColor = hit ? "#ff2ebd" : "#72f2ff";
      ctx.shadowBlur  = hit ? 40 : 24;
      ctx.globalAlpha = hit ? (Math.sin(time * 40) * 0.5 + 0.5) : 1;

      // Cape (cloak)
      ctx.fillStyle = hit ? "rgba(255,46,189,.5)" : "rgba(50,120,220,.4)";
      ctx.beginPath();
      ctx.moveTo(-r*0.8, r*0.1);
      ctx.quadraticCurveTo(-r*1.2, r*0.7 + Math.sin(time*3)*4, -r*0.2, r*0.85);
      ctx.quadraticCurveTo(0, r*0.9, r*0.2, r*0.85);
      ctx.quadraticCurveTo(r*1.2, r*0.7 + Math.sin(time*3+1)*4, r*0.8, r*0.1);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, r*0.72, r, 0, 0, Math.PI*2); ctx.fill();

      // Orb / staff head
      ctx.shadowColor = "#ffd66e"; ctx.shadowBlur = 18;
      ctx.fillStyle = "#ffd66e";
      ctx.beginPath(); ctx.arc(r*0.85, -r*0.6, r*0.18, 0, Math.PI*2); ctx.fill();

      // Chromatic split ghosts on hit
      if (hit) {
        ctx.globalAlpha = 0.35;
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "#ff2ebd";
        ctx.beginPath(); ctx.ellipse(-6, -2, r*0.72, r, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#72f2ff";
        ctx.beginPath(); ctx.ellipse(6, 2, r*0.72, r, 0, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();

    // HP-critical CSS class on mission-panel
    const hpPct = player.hp / player.maxHp;
    document.querySelector(".mission-panel")?.classList.toggle("hp-critical", hpPct < 0.28 && !state.gameOver);
  }

  // Era color tints applied to enemies
  const ERA_TINTS = ["#d4aa55","#8a7eff","#c8e8ff","#ff8b6b","#a8ff3e","#ff2ebd"];

  function drawEnemies(time) {
    const eraIdx = currentEraIndex();
    const eraTint = ERA_TINTS[clamp(eraIdx, 0, ERA_TINTS.length-1)];

    for (const e of state.enemies) {
      if (e.dead) continue;
      const size = e.boss ? 180 : e.elite ? 120 : e.id==="zipper" ? 56 : 84;
      const wobble = Math.sin(time * 5 + e.wobble) * (e.boss ? 1.5 : 3);
      ctx.save();
      ctx.translate(e.x, e.y + wobble);

      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.beginPath(); ctx.ellipse(0, size*0.3, size*0.34, size*0.1, 0, 0, Math.PI*2); ctx.fill();

      ctx.shadowColor = e.hit ? "#ffffff" : e.color;
      ctx.shadowBlur  = e.hit ? 36 : 14;
      ctx.globalAlpha = e.hit ? (Math.sin(time*60)*0.4+0.65) : 1;

      if (images.sprites) {
        drawSprite(e.sprite||1, -size/2, -size/2, size, size);
      } else {
        drawArchetypeEnemy(e, eraTint, time, size);
      }
      ctx.globalAlpha = 1;

      // HP bar (layered)
      const pct = clamp(e.hp/e.maxHp, 0, 1);
      const bw  = size * 0.78, bx = -bw/2, by = -size*0.58;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath(); ctx.roundRect?.(bx, by, bw, 7, 3); ctx.fill();
      const barGrad = ctx.createLinearGradient(bx, 0, bx+bw*pct, 0);
      if (pct > 0.5) { barGrad.addColorStop(0,"#6cf3b2"); barGrad.addColorStop(1,"#72f2ff"); }
      else if (pct > 0.25) { barGrad.addColorStop(0,"#ffd66e"); barGrad.addColorStop(1,"#ff8b6b"); }
      else { barGrad.addColorStop(0,"#ff4060"); barGrad.addColorStop(1,"#ff2ebd"); }
      ctx.fillStyle = barGrad;
      ctx.beginPath(); ctx.roundRect?.(bx, by, bw*pct, 7, 3); ctx.fill();

      // Boss name + era-badge
      if (e.boss) {
        ctx.font = "800 16px 'JetBrains Mono','Courier New',monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffd66e";
        ctx.shadowColor = "#ffd66e"; ctx.shadowBlur = 12;
        ctx.fillText(`${e.name} · P${e.phase||1}`, 0, -size*0.68);
        // phase 2 glow ring
        if (e.phase === 2) {
          ctx.strokeStyle = "#ff2ebd"; ctx.lineWidth = 3;
          ctx.globalAlpha = 0.55 + Math.sin(time*6)*0.3;
          ctx.beginPath(); ctx.arc(0, 0, e.radius+10+Math.sin(time*4)*4, 0, Math.PI*2); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawArchetypeEnemy(e, eraTint, time, size) {
    const r = e.radius;
    const id = e.id || "shambler";

    if (id === "boss") {
      // Boss: multi-ring + pulsing crown
      const pulse = Math.sin(time*3) * 5;
      ctx.strokeStyle = "#ff2ebd"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, r+12+pulse, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = "#ffd66e"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r+22+pulse*0.5, 0, Math.PI*2); ctx.stroke();
      const g = ctx.createRadialGradient(0, -r*0.3, r*0.1, 0, 0, r*1.3);
      g.addColorStop(0, "#ffe066"); g.addColorStop(0.5, "#ff8b6b"); g.addColorStop(1, "rgba(255,46,189,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      // crown spikes
      for (let i=0; i<8; i++) {
        const a = (i/8)*Math.PI*2 + time*0.5;
        ctx.fillStyle = "#ffd66e"; ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*r*0.9, Math.sin(a)*r*0.9);
        ctx.lineTo(Math.cos(a+0.18)*(r+10), Math.sin(a+0.18)*(r+10));
        ctx.lineTo(Math.cos(a-0.18)*(r+10), Math.sin(a-0.18)*(r+10));
        ctx.closePath(); ctx.fill();
      }
    } else if (id === "zipper") {
      // Zipper: fast angular hex with era tint
      ctx.fillStyle = e.color;
      ctx.strokeStyle = eraTint; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i=0;i<6;i++) {
        const a = (i/6)*Math.PI*2 - time*4;
        i===0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // inner dart
      ctx.fillStyle = eraTint; ctx.globalAlpha = 0.7;
      ctx.beginPath();
      for (let i=0;i<6;i++) {
        const a = (i/6)*Math.PI*2 - time*4;
        i===0 ? ctx.moveTo(Math.cos(a)*r*0.45, Math.sin(a)*r*0.45) : ctx.lineTo(Math.cos(a)*r*0.45, Math.sin(a)*r*0.45);
      }
      ctx.closePath(); ctx.fill();
    } else if (id === "shooter") {
      // Shooter: diamond with targeting reticle
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
      ctx.closePath(); ctx.fill();
      // reticle ring
      ctx.strokeStyle = eraTint; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r*1.3, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r*1.5, 0); ctx.lineTo(-r*0.9, 0);
      ctx.moveTo(r*0.9, 0);  ctx.lineTo(r*1.5, 0);
      ctx.moveTo(0, -r*1.5); ctx.lineTo(0, -r*0.9);
      ctx.moveTo(0, r*0.9);  ctx.lineTo(0, r*1.5);
      ctx.stroke();
    } else if (id === "exploder") {
      // Exploder: jagged star, warning flash
      const flash = Math.sin(time*14) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255,64,96,${0.6+flash*0.4})`;
      const spikes = 8;
      ctx.beginPath();
      for (let i=0; i<spikes*2; i++) {
        const a  = (i / (spikes*2)) * Math.PI*2;
        const ro = i%2===0 ? r : r*0.48;
        i===0 ? ctx.moveTo(Math.cos(a)*ro, Math.sin(a)*ro) : ctx.lineTo(Math.cos(a)*ro, Math.sin(a)*ro);
      }
      ctx.closePath(); ctx.fill();
    } else if (id === "splitter") {
      // Splitter: large divided circle with split-line
      const g = ctx.createRadialGradient(0,0,r*0.2,0,0,r*1.1);
      g.addColorStop(0, "#ffb060"); g.addColorStop(1, "#ff5d30");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
      ctx.moveTo(0, -r); ctx.lineTo(0, r);
      ctx.stroke();
      // era badge glow
      ctx.strokeStyle = eraTint; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r*1.15, 0, Math.PI*2); ctx.stroke();
    } else {
      // Shambler: rounded tank with era tint rim
      const g = ctx.createRadialGradient(-r*0.3,-r*0.3,r*0.1,0,0,r*1.3);
      g.addColorStop(0, e.color);
      g.addColorStop(1, "rgba(20,20,40,0.5)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = eraTint; ctx.lineWidth = 2; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(0, 0, r*1.08, 0, Math.PI*2); ctx.stroke();
    }
  }

  function drawOrbitalsGfx(time) {
    const pendulum=state.weaponSlots.find(w=>w.id==="pendulum"||w.id==="Siege Cannon");
    if (!pendulum) return;
    const lv=pendulum.levels[pendulum.level-1]||pendulum.levels[0];
    const orbs=lv.orbs||1;
    const orbR=lv.radius||100;
    const orbSize=(lv.orbRadius||20)*state.areaBonus;
    const angSpeed=1.3+orbs*0.07;

    // orbit ring (dashed)
    ctx.save(); ctx.globalAlpha=0.12; ctx.strokeStyle="#ff8b6b"; ctx.lineWidth=1.5;
    ctx.setLineDash([6,14]); ctx.lineDashOffset=-time*20;
    ctx.shadowColor="#ff8b6b"; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(player.x,player.y,orbR,0,Math.PI*2); ctx.stroke();
    ctx.restore();

    for (let i=0; i<orbs; i++) {
      const angle=time*angSpeed+i*Math.PI*2/orbs;

      // motion trail (5 ghost orbs)
      for (let t2=1; t2<=5; t2++) {
        const ta=angle-t2*0.12;
        const tx=player.x+Math.cos(ta)*orbR, ty=player.y+Math.sin(ta)*orbR;
        ctx.save();
        ctx.globalAlpha=0.08*(6-t2);
        ctx.fillStyle="#ff8b6b";
        ctx.beginPath(); ctx.arc(tx,ty,orbSize*(1-t2*0.06),0,Math.PI*2); ctx.fill();
        ctx.restore();
      }

      const ox=player.x+Math.cos(angle)*orbR, oy=player.y+Math.sin(angle)*orbR;
      ctx.save();
      // bronze orb gradient
      const og=ctx.createRadialGradient(ox-orbSize*0.35,oy-orbSize*0.35,1,ox,oy,orbSize*1.1);
      og.addColorStop(0,"#ffe0b0"); og.addColorStop(0.5,"#cc6820"); og.addColorStop(1,"#6b2000");
      ctx.shadowColor="#ff8b6b"; ctx.shadowBlur=22;
      ctx.fillStyle=og;
      ctx.beginPath(); ctx.arc(ox,oy,orbSize,0,Math.PI*2); ctx.fill();
      // glint
      ctx.globalAlpha=0.5; ctx.fillStyle="#fff";
      ctx.beginPath(); ctx.arc(ox-orbSize*0.28,oy-orbSize*0.28,orbSize*0.18,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  function drawEchos(time) {
    for (const echo of state.echos) {
      const alpha=clamp(echo.life/echo.maxLife,0,1)*0.65;
      ctx.save();
      ctx.globalAlpha=alpha;
      ctx.translate(echo.x,echo.y+Math.sin(time*5)*3);
      ctx.shadowColor="#c58cff"; ctx.shadowBlur=24;
      if (images.sprites) {
        drawSprite(0,-40,-52,80,88);
      } else {
        ctx.fillStyle="#c58cff";
        ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawProjectiles(time) {
    for (const p of state.projectiles) {
      if (p.dead || p.enemy) continue;
      ctx.save();
      const angle = Math.atan2(p.vy, p.vx);

      if (p.kind === "bomb") {
        // Era Bomb: pulsing grenade + fuse particle + countdown ring
        const fuseProgress = clamp(1 - (p.fuseTimer||0)/1.2, 0, 1);
        const pulse = Math.sin(time*14) * fuseProgress * 7;
        const r = 12 + pulse;
        // fuse spark trail
        ctx.globalAlpha = 0.6 + fuseProgress * 0.3;
        ctx.fillStyle = "#ffd66e"; ctx.shadowColor = "#ffd66e"; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(p.x - Math.cos(angle)*r, p.y - Math.sin(angle)*r, 3+fuseProgress*2, 0, Math.PI*2); ctx.fill();
        // iron sphere
        const g = ctx.createRadialGradient(p.x-r*0.3, p.y-r*0.3, r*0.05, p.x, p.y, r*1.2);
        g.addColorStop(0, "#888"); g.addColorStop(0.6, "#444"); g.addColorStop(1, "#222");
        ctx.globalAlpha = 1;
        ctx.shadowColor = p.color; ctx.shadowBlur = 20 + pulse;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.fill();
        // countdown ring
        ctx.strokeStyle = `hsl(${(1-fuseProgress)*120},100%,60%)`; ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(p.x, p.y, r+8, -Math.PI/2, -Math.PI/2 + Math.PI*2*fuseProgress); ctx.stroke();
      } else if (p.kind === "cannonball" || p.kind === "siege") {
        // Iron sphere with spin + smoke trail
        const isSiege = p.kind === "siege";
        const r = p.radius || (isSiege ? 28 : 12);
        // smoke trail
        for (let i=1; i<=4; i++) {
          ctx.globalAlpha = 0.12 * (1 - i/5);
          ctx.fillStyle = "#aaa";
          ctx.beginPath(); ctx.arc(p.x - Math.cos(angle)*r*i*0.9, p.y - Math.sin(angle)*r*i*0.9, r*(1-i*0.15), 0, Math.PI*2); ctx.fill();
        }
        // spinning iron sphere
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(p.x-r*0.3, p.y-r*0.35, r*0.05, p.x, p.y, r*1.1);
        g.addColorStop(0, "#b8a060"); g.addColorStop(0.5, "#7a5c20"); g.addColorStop(1, "#3a2808");
        ctx.shadowColor = p.color; ctx.shadowBlur = isSiege ? 40 : 24;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.fill();
        // spin line detail
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(time * 8 * (isSiege ? 0.4 : 1));
        ctx.strokeStyle = "rgba(255,200,80,.4)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, r*0.5, 0, Math.PI); ctx.stroke();
        ctx.restore();
      } else if (p.kind === "bullet") {
        // Musket shot: tapered lead shot with muzzle glow
        ctx.translate(p.x, p.y); ctx.rotate(angle);
        ctx.shadowColor = p.color; ctx.shadowBlur = 14;
        // lead shot
        const g = ctx.createLinearGradient(-10, -4, 10, 4);
        g.addColorStop(0, "#e0dfe8"); g.addColorStop(0.5, p.color); g.addColorStop(1, "rgba(100,80,200,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI*2);
        ctx.fill();
        // muzzle flash highlight
        ctx.globalAlpha = clamp(p.life * 3, 0, 0.8);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(10, 0, 4, 0, Math.PI*2); ctx.fill();
      } else if (p.kind === "boomerang") {
        // Spinning blade with motion blur arc
        ctx.translate(p.x, p.y);
        // motion blur trail
        for (let i=1; i<=3; i++) {
          ctx.globalAlpha = 0.15 / i;
          ctx.fillStyle = p.color;
          const trailAngle = angle + time*8 - i*0.4;
          ctx.save(); ctx.rotate(trailAngle);
          ctx.beginPath(); ctx.moveTo(0,-p.radius); ctx.lineTo(p.radius,p.radius); ctx.lineTo(-p.radius,p.radius); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.rotate(angle + time * 8);
        ctx.shadowColor = p.color; ctx.shadowBlur = 18;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.radius); ctx.lineTo(p.radius, p.radius); ctx.lineTo(-p.radius, p.radius); ctx.closePath(); ctx.fill();
        // blade edge glint
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(-p.radius*0.6, p.radius*0.6); ctx.lineTo(0, -p.radius*0.8); ctx.stroke();
      } else {
        // Generic arc/slash/beam projectile
        ctx.translate(p.x, p.y); ctx.rotate(angle);
        ctx.shadowColor = p.color; ctx.shadowBlur = 14;
        const g = ctx.createLinearGradient(-14, 0, 14, 0);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, p.color); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(-14, -5, 28, 10);
      }
      ctx.restore();
    }
  }

  function drawEnemyProjectiles(time) {
    for (const p of state.projectiles) {
      if (p.dead||!p.enemy) continue;
      ctx.save();
      ctx.shadowColor="#c58cff"; ctx.shadowBlur=10;
      ctx.fillStyle="#c58cff";
      ctx.beginPath(); ctx.arc(p.x,p.y,6,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  function drawPickups(time) {
    for (const pk of state.pickups) {
      const bob = Math.sin(time * 5 + pk.x * 0.01) * 3.5;
      ctx.save();
      ctx.translate(pk.x, pk.y + bob);

      if (pk.kind === PICKUP_XP) {
        // Refined diamond with magnetic-pulse glow
        const c = pk.color || "#ffd66e";
        const pulse = Math.sin(time * 8 + pk.x) * 0.5 + 0.5;
        ctx.shadowColor = c; ctx.shadowBlur = 10 + pulse * 14;
        // outer glow ring
        ctx.globalAlpha = 0.2 + pulse * 0.15;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(8,0); ctx.lineTo(0,11); ctx.lineTo(-8,0); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        // gem facets
        const gd = ctx.createLinearGradient(-6,-7,6,7);
        gd.addColorStop(0,"#fff"); gd.addColorStop(0.3, c); gd.addColorStop(1, "#330044");
        ctx.fillStyle = gd;
        ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(6,0); ctx.lineTo(0,8); ctx.lineTo(-6,0); ctx.closePath(); ctx.fill();
        // highlight facet
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(6,0); ctx.lineTo(0,-1); ctx.closePath(); ctx.fill();
      } else if (pk.kind === PICKUP_HEART) {
        // Beating red gem heart
        const beat = 1 + Math.sin(time * 6) * 0.12;
        ctx.scale(beat, beat);
        ctx.shadowColor = "#ff4060"; ctx.shadowBlur = 20;
        ctx.fillStyle = "#ff4060";
        // heart shape
        ctx.beginPath();
        ctx.moveTo(0, 3);
        ctx.bezierCurveTo(-8, -4, -12, 2, -6, 8);
        ctx.lineTo(0, 14); ctx.lineTo(6, 8);
        ctx.bezierCurveTo(12, 2, 8, -4, 0, 3);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.3)";
        ctx.beginPath(); ctx.ellipse(-3, 1, 2.5, 3.5, -0.6, 0, Math.PI*2); ctx.fill();
      } else if (pk.kind === PICKUP_SHELL) {
        // Lightning bolt icon
        ctx.shadowColor = "#ffd66e"; ctx.shadowBlur = 22;
        ctx.fillStyle = "#ffd66e";
        ctx.beginPath();
        ctx.moveTo(4,-12); ctx.lineTo(-2,0); ctx.lineTo(3,0); ctx.lineTo(-4,12); ctx.lineTo(6,2); ctx.lineTo(1,2); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.4)";
        ctx.beginPath(); ctx.ellipse(2,-4,1.5,3,0.3,0,Math.PI*2); ctx.fill();
      } else if (pk.kind === PICKUP_MAGNET) {
        // Horseshoe magnet — spinning
        ctx.rotate(time * 2);
        ctx.shadowColor = "#72f2ff"; ctx.shadowBlur = 22;
        // U-shape
        ctx.strokeStyle = "#72f2ff"; ctx.lineWidth = 4.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.arc(0, 0, 9, Math.PI, Math.PI*2); ctx.stroke();
        // poles
        ctx.strokeStyle = "#ff4060"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(-9,-7); ctx.stroke();
        ctx.strokeStyle = "#a8ff3e";
        ctx.beginPath(); ctx.moveTo(9,0);  ctx.lineTo(9,-7); ctx.stroke();
        // magnetic pulse ring
        ctx.globalAlpha = 0.22 + Math.sin(time*6)*0.12;
        ctx.strokeStyle = "#72f2ff"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 16 + Math.sin(time*4)*3, 0, Math.PI*2); ctx.stroke();
      } else if (pk.kind === PICKUP_CHEST) {
        // Gilded chest silhouette with glow
        const glow = Math.sin(time * 3) * 0.5 + 0.5;
        ctx.shadowColor = "#ffd66e"; ctx.shadowBlur = 20 + glow * 16;
        // chest base
        ctx.fillStyle = "#8a5500";
        ctx.beginPath(); ctx.roundRect?.(-13, 0, 26, 18, 3); ctx.fill();
        // chest lid
        ctx.fillStyle = "#c07a1a";
        ctx.beginPath(); ctx.roundRect?.(-13, -12, 26, 13, [3,3,0,0]); ctx.fill();
        // gold trim
        ctx.strokeStyle = "#ffd66e"; ctx.lineWidth = 2;
        ctx.strokeRect(-13, -12, 26, 30);
        ctx.beginPath(); ctx.moveTo(-13,0); ctx.lineTo(13,0); ctx.stroke();
        // latch
        ctx.fillStyle = "#ffd66e";
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
        // glow aura
        ctx.globalAlpha = 0.18 + glow * 0.15;
        ctx.fillStyle = "#ffd66e";
        ctx.beginPath(); ctx.arc(0, 4, 20, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.save();
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      if (p.kind === "beam") {
        // Electric chain lightning: main bolt + jittery branches
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const len = Math.hypot(dx, dy);
        const steps = Math.max(4, Math.floor(len / 40));
        ctx.strokeStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 22; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        for (let i=1; i<steps; i++) {
          const t2 = i/steps;
          const jx = (Math.random()-0.5) * 22 * (1 - Math.abs(t2-0.5)*1.5);
          const jy = (Math.random()-0.5) * 22 * (1 - Math.abs(t2-0.5)*1.5);
          ctx.lineTo(p.x + dx*t2 + jx, p.y + dy*t2 + jy);
        }
        ctx.lineTo(p.tx, p.ty); ctx.stroke();
        // bright flash endpoints
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = "#fff"; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.tx, p.ty, 5, 0, Math.PI*2); ctx.fill();
        // branches
        ctx.strokeStyle = p.color; ctx.lineWidth = 1.5; ctx.shadowBlur = 12; ctx.globalAlpha = a * 0.5;
        const midX = p.x + dx*0.5 + (Math.random()-0.5)*16;
        const midY = p.y + dy*0.5 + (Math.random()-0.5)*16;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + (Math.random()-0.5)*50, midY + (Math.random()-0.5)*50);
        ctx.stroke();
      } else if (p.kind === "ring") {
        // Shockwave ring with gradient fade
        ctx.strokeStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 20; ctx.lineWidth = 4 * a;
        ctx.globalAlpha = a * 0.9;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.globalAlpha = a * 0.35;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.15, 0, Math.PI*2); ctx.stroke();
      } else if (p.kind === "arc") {
        // Saber slash: bright arc with blue afterimage
        ctx.strokeStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 28; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.range, p.angle-p.arc/2, p.angle+p.arc/2); ctx.stroke();
        // afterimage
        ctx.globalAlpha = a * 0.4;
        ctx.strokeStyle = "#a8efff"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.range*0.85, p.angle-p.arc/2, p.angle+p.arc/2); ctx.stroke();
        // spark particles along arc
        ctx.fillStyle = "#ffffff"; ctx.globalAlpha = a * 0.8;
        for (let i=0; i<4; i++) {
          const a2 = p.angle - p.arc/2 + (i/3)*p.arc;
          const sr = p.range * (0.85 + Math.random()*0.3);
          ctx.beginPath(); ctx.arc(p.x + Math.cos(a2)*sr, p.y + Math.sin(a2)*sr, 2, 0, Math.PI*2); ctx.fill();
        }
      } else {
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawTexts() {
    ctx.save();
    ctx.font = "700 20px 'JetBrains Mono','Courier New',monospace";
    ctx.textAlign = "center";
    for (const t of state.texts) {
      const alpha = clamp(t.life / 0.9, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = t.color; ctx.shadowBlur = 12;
      ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.lineWidth = 4;
      ctx.strokeText(String(t.value), t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(String(t.value), t.x, t.y);
    }
    ctx.restore();
  }

  function drawOverlay() {
    // Screen flash (hit/pickup/boss)
    if (state.flash > 0) {
      ctx.save();
      ctx.globalAlpha = state.flash * 0.18;
      ctx.fillStyle = state.flashColor || "#ffd66e";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    }

    // Prismatic chromatic-shatter death
    if (state.deathSlowmo > 0 && state.gameOver) {
      const t2 = state.deathSlowmo; // 1.5 → 0
      if (!reduceMotion) {
        const split = clamp((1.5-t2)/1.5, 0, 1) * 18;
        // Chromatic aberration overlay: shift RGB planes
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#ff2ebd";
        ctx.fillRect(split, 0, BASE_W, BASE_H);
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = "#72f2ff";
        ctx.fillRect(-split, 0, BASE_W, BASE_H);
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#a8ff3e";
        ctx.fillRect(0, split*0.5, BASE_W, BASE_H);
        ctx.restore();

        // Rune circle around player death point
        const runeAlpha = clamp((1.5-t2)/0.8, 0, 1);
        if (runeAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = runeAlpha * 0.7;
          ctx.strokeStyle = "#ff2ebd"; ctx.lineWidth = 3; ctx.shadowColor="#ff2ebd"; ctx.shadowBlur=24;
          const runeR = 80 + (1.5-t2) * 60;
          ctx.beginPath(); ctx.arc(player.x, player.y, runeR, 0, Math.PI*2); ctx.stroke();
          ctx.globalAlpha = runeAlpha * 0.45;
          ctx.strokeStyle = "#72f2ff"; ctx.lineWidth = 1.5;
          ctx.setLineDash([12,20]); ctx.lineDashOffset = t2 * 30;
          ctx.beginPath(); ctx.arc(player.x, player.y, runeR * 1.25, 0, Math.PI*2); ctx.stroke();
          // rune spokes
          ctx.setLineDash([]); ctx.strokeStyle="#a8ff3e"; ctx.lineWidth=1;
          for (let i=0;i<8;i++) {
            const a2 = (i/8)*Math.PI*2 + t2*2;
            ctx.beginPath();
            ctx.moveTo(player.x + Math.cos(a2)*runeR*0.5, player.y + Math.sin(a2)*runeR*0.5);
            ctx.lineTo(player.x + Math.cos(a2)*runeR, player.y + Math.sin(a2)*runeR);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    }

    // Game-over text (after slowmo ends)
    if (state.gameOver && state.deathSlowmo <= 0) {
      ctx.save();
      ctx.font = "900 58px 'Fraunces','Georgia',serif";
      ctx.textAlign = "center";
      // Chromatic aberration on text
      if (!reduceMotion) {
        ctx.fillStyle = "#ff2ebd"; ctx.globalAlpha = 0.8;
        ctx.fillText("TIMELINE BROKEN", BASE_W/2 + 4, BASE_H/2 - 20);
        ctx.fillStyle = "#72f2ff"; ctx.globalAlpha = 0.8;
        ctx.fillText("TIMELINE BROKEN", BASE_W/2 - 4, BASE_H/2 - 20);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.88)"; ctx.lineWidth = 7;
      ctx.strokeText("TIMELINE BROKEN", BASE_W/2, BASE_H/2 - 20);
      ctx.fillStyle = "#ff4060";
      ctx.fillText("TIMELINE BROKEN", BASE_W/2, BASE_H/2 - 20);
      ctx.font = "700 28px 'JetBrains Mono','Courier New',monospace";
      ctx.fillStyle = "#ffd66e";
      ctx.strokeText(`Score: ${money(state.score)}`, BASE_W/2, BASE_H/2 + 40);
      ctx.fillText(`Score: ${money(state.score)}`, BASE_W/2, BASE_H/2 + 40);
      ctx.restore();
    }

    // Boss spawn: full-screen red flash banner drawn on canvas
    if (state._bossBanner > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(state._bossBanner, 1) * 0.85;
      ctx.fillStyle = "rgba(255,40,60,.15)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.globalAlpha = clamp(state._bossBanner * 2, 0, 1);
      ctx.font = "900 72px 'Fraunces','Georgia',serif";
      ctx.textAlign = "center";
      // Chromatic aberration on boss banner
      if (!reduceMotion) {
        ctx.fillStyle="#ff2ebd"; ctx.fillText("ANACHRONISM PRIME", BASE_W/2+6, BASE_H/2+4);
        ctx.fillStyle="#72f2ff"; ctx.fillText("ANACHRONISM PRIME", BASE_W/2-6, BASE_H/2-4);
      }
      ctx.strokeStyle="#000"; ctx.lineWidth=8;
      ctx.strokeText("ANACHRONISM PRIME", BASE_W/2, BASE_H/2);
      ctx.fillStyle="#ff4060";
      ctx.fillText("ANACHRONISM PRIME", BASE_W/2, BASE_H/2);
      ctx.font="700 24px Inter,sans-serif"; ctx.fillStyle="#ffd66e";
      ctx.fillText("Boss has entered the Rift", BASE_W/2, BASE_H/2 + 56);
      ctx.restore();
    }
    if (state._bossBanner > 0) state._bossBanner -= 0.016;
  }

  function drawJoystick() {
    if (!state.joystick.active) return;
    const {baseX,baseY,dx,dy}=state.joystick;
    ctx.save();
    // outer ring
    ctx.globalAlpha=0.28;
    ctx.strokeStyle="#72f2ff"; ctx.lineWidth=2;
    ctx.shadowColor="#72f2ff"; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.arc(baseX,baseY,72,0,Math.PI*2); ctx.stroke();
    // tick marks
    ctx.globalAlpha=0.18;
    for (let i=0;i<8;i++) {
      const a2=(i/8)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(baseX+Math.cos(a2)*62,baseY+Math.sin(a2)*62);
      ctx.lineTo(baseX+Math.cos(a2)*72,baseY+Math.sin(a2)*72);
      ctx.stroke();
    }
    // thumb dot (glassmorphic)
    const tx=baseX+dx*70, ty=baseY+dy*70;
    ctx.globalAlpha=0.6;
    ctx.fillStyle="rgba(114,242,255,.18)";
    ctx.beginPath(); ctx.arc(tx,ty,32,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=0.5;
    ctx.strokeStyle="#72f2ff"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(tx,ty,32,0,Math.PI*2); ctx.stroke();
    // inner glow dot
    ctx.globalAlpha=0.75;
    ctx.fillStyle="#72f2ff"; ctx.shadowBlur=18;
    ctx.beginPath(); ctx.arc(tx,ty,10,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // sprite sheet helper
  function drawSprite(index,x,y,w,h) {
    if (!images.sprites) return;
    const cols=4;
    const sw=images.sprites.width/cols;
    const sh=images.sprites.height/Math.ceil(14/cols);
    const sx=(index%cols)*sw, sy=Math.floor(index/cols)*sh;
    ctx.drawImage(images.sprites,sx,sy,sw,sh,x,y,w,h);
  }


  // ─── BOOT ────────────────────────────────────────────────────────────────────
  init().catch((error) => {
    console.error("Time Rift Survivors init error:", error);
    els.missionTitle.textContent = "Engine failed to load";
    els.questionPrompt.textContent = "Refresh the page. If this repeats, the question bank or asset files did not load.";
  });

})();
