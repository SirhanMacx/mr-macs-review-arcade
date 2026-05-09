/* global MrMacsAnalytics, MrMacsProfile */
/* Arcade Duel v2 — Turn-based MCQ combat, best-of-3, all upgrades
   Direction: Turn-based / command-menu (Pokemon-trainer style)
   No new asset files — pure canvas + Web Audio + CSS only. */

"use strict";

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const SourceBank = window.MrMacsSourceBank;

function esc(text) {
  return (text ?? "").toString().replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

// ─────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────
const SAVE_KEY = "mr-macs-arcade-duel-v1";
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}
function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...loadSave(), ...data })); } catch {}
}

// ─────────────────────────────────────────────
// OPPONENT ROSTER (Story ladder: 7 opponents)
// ─────────────────────────────────────────────
const OPPONENTS = [
  { id: "spartan",  name: "Spartan Warrior",     era: "Ancient Greece",  hp: 80,  atk: [12,18], special: 20, tell: "Braces shield → heavy incoming", skin: "spartan",  icon: "🏛️" },
  { id: "samurai",  name: "Samurai Scholar",      era: "Feudal Japan",    hp: 90,  atk: [14,20], special: 24, tell: "Spins blade → counter chance",   skin: "samurai",  icon: "⛩️" },
  { id: "knight",   name: "Crusader Knight",      era: "Medieval Europe", hp: 100, atk: [16,22], special: 28, tell: "Shield bash → stagger",          skin: "knight",   icon: "⚜️" },
  { id: "frontier", name: "Frontier Sharpshooter",era: "1800s America",   hp: 95,  atk: [18,25], special: 30, tell: "Draws pistol → dodge or die",    skin: "frontier", icon: "🤠" },
  { id: "spy",      name: "Cold War Spy",         era: "20th Century",    hp: 105, atk: [20,28], special: 34, tell: "Gadget flash → disoriented",     skin: "spy",      icon: "🕵️" },
  { id: "titan",    name: "Knowledge Titan",      era: "All Eras",        hp: 120, atk: [22,32], special: 40, tell: "Eyes glow → finisher incoming",  skin: "titan",    icon: "📚" },
  { id: "ai",       name: "Future AI",            era: "Year 2XXX",       hp: 140, atk: [24,36], special: 46, tell: "Recalculates → all attacks +20%", skin: "ai",      icon: "🤖" },
];

// Difficulty multipliers
const DIFF = {
  apprentice: { playerMult: 1.2, aiMult: 0.7,  aiSkipChance: 0.35, aiSpecialHp: 0.50 },
  skilled:    { playerMult: 1.0, aiMult: 1.0,  aiSkipChance: 0.20, aiSpecialHp: 0.40 },
  master:     { playerMult: 0.9, aiMult: 1.3,  aiSkipChance: 0.10, aiSpecialHp: 0.65 },
};

// Breather tips pool
const TIPS = [
  "Streak 3 correct answers to unlock your Finisher!",
  "Defend reduces next enemy hit by 50%.",
  "Skip lets the opponent attack for free — only use it when stuck.",
  "Special move deals 2× damage — wait for full charge.",
  "Heal Restore works once per round — use it wisely.",
  "Watch for the opponent's 'tell' — it signals a heavy attack.",
  "Charge builds by 1 for each correct answer.",
  "Perfect round (no damage taken) earns a bonus HP refill.",
];

// ─────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────
const G = {
  bank: null,
  course: "All Courses",
  set: "All Sets",
  length: 25,
  difficulty: "skilled",
  mode: "story",
  opponentIndex: 0,    // current story opponent index
  muted: false,
  paused: false,
  sound: null,
  ambientNode: null,
  // run-level
  run: null,
};

// per-round state factory
function mkRound(opponent, diff) {
  const maxHp = 100;
  const enemyMaxHp = Math.round(opponent.hp * diff.aiMult);
  return {
    // fighters
    youHp: maxHp, youMaxHp: maxHp,
    enemyHp: enemyMaxHp, enemyMaxHp,
    // question pool
    items: [],
    index: 0,
    correct: 0,
    missed: [],
    // game mechanics
    streak: 0,    charge: 0,     maxCharge: 3,
    itemUsed: false, defending: false,
    answered: false,
    // enemy AI
    aiTell: false, aiCounterWindow: false,
    phase: "command",   // "command" | "question"
    pendingMove: null,  // "attack" | "special"
    // round timer
    timeLeft: 99,
    timerID: null,
    // MrMacsProfile flawless tracking (Hook 4b)
    damageTakenThisRound: 0,
  };
}

// Match-level state
function mkMatch(bank, items, opp, diff) {
  return {
    bank,
    items,       // shuffled full pool
    itemCursor: 0,
    opponent: opp,
    diff,
    rounds: [],  // won/lost per round — "win"|"lose"|"draw"
    currentRound: 1,
    totalRounds: 3,
    playerWins: 0,
    enemyWins: 0,
    totalCorrect: 0,
    totalPlayed: 0,
    totalMissed: [],
    bestStreak: 0,
  };
}

// ─────────────────────────────────────────────
// SOUND ENGINE (Web Audio API only, no files)
// ─────────────────────────────────────────────
function ensureCtx() {
  if (!G.sound) {
    try { G.sound = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  return G.sound;
}

function tone(freq, type, duration, volume, delay = 0) {
  if (G.muted) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  try {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  } catch {}
}

function playSound(kind) {
  if (G.muted) return;
  const s = {
    start:   () => { tone(220,"triangle",.15,.03); tone(330,"triangle",.15,.03,.07); tone(440,"triangle",.2,.03,.14); },
    hit:     () => { tone(480,"square",.08,.025); tone(680,"triangle",.12,.02,.05); },
    heavy:   () => { tone(320,"sawtooth",.18,.04); tone(200,"sawtooth",.25,.03,.08); },
    special: () => { tone(660,"triangle",.12,.035); tone(880,"triangle",.14,.035,.06); tone(1100,"sine",.2,.03,.12); },
    block:   () => { tone(180,"sawtooth",.06,.018); tone(150,"sawtooth",.1,.012,.04); },
    correct: () => { tone(523,"sine",.1,.025); tone(659,"sine",.1,.025,.08); tone(784,"sine",.18,.025,.16); },
    wrong:   () => { tone(220,"sawtooth",.15,.03); tone(165,"sawtooth",.2,.025,.1); },
    wave:    () => { [392,494,587,698,880].forEach((f,i)=>tone(f,"triangle",.14,.03,i*.06)); },
    ko:      () => { [880,660,440,330,220].forEach((f,i)=>tone(f,"triangle",.18,.04,i*.09)); },
    finisher:() => { [440,554,659,880,1100,880].forEach((f,i)=>tone(f,"sine",.18,.038,i*.07)); },
    bell:    () => { tone(800,"sine",.6,.04); tone(400,"sine",.5,.018,.05); },
    skip:    () => { tone(200,"triangle",.1,.015); },
    heal:    () => { tone(523,"sine",.12,.02); tone(659,"sine",.15,.02,.09); },
    timer:   () => { tone(880,"sine",.07,.01); },
  };
  try { s[kind]?.(); } catch {}
}

// Ambient looping (sub-bass throb + high shimmer)
function startAmbient() {
  if (G.muted) return;
  stopAmbient();
  const ctx = ensureCtx();
  if (!ctx) return;
  try {
    const bufLen = ctx.sampleRate * 2.0;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      // Sub throb at ~60 Hz + shimmer noise
      data[i] = Math.sin(2 * Math.PI * 60 * i / ctx.sampleRate) * 0.012
              + (Math.random() * 2 - 1) * 0.005;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    G.ambientNode = { src, gain };
  } catch {}
}
function stopAmbient() {
  try { G.ambientNode?.src.stop(); } catch {}
  G.ambientNode = null;
}

// ─────────────────────────────────────────────
// PARTICLE SYSTEM (canvas)
// ─────────────────────────────────────────────
const canvas = $("#particleCanvas");
const ctx2 = canvas?.getContext("2d");
let particles = [];

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function spawnParticles(x, y, color, count, type) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === "spark" ? randInt(4, 9) : randInt(2, 6);
    particles.push({
      x: x - rect.left, y: y - rect.top,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (type === "spark" ? 3 : 1),
      life: 1, decay: type === "spark" ? 0.055 : 0.038,
      size: type === "spark" ? randInt(2, 4) : randInt(4, 9),
      color, type,
    });
  }
}

function spawnStageParticles(side, type) {
  const stage = $("#combatStage");
  if (!stage) return;
  const r = stage.getBoundingClientRect();
  const x = side === "enemy"
    ? r.right - r.width * 0.22
    : r.left  + r.width * 0.22;
  const y = r.top + r.height * 0.45;
  const color = type === "spark" ? "#7af0ff"
    : side === "enemy" ? "#ff7bcc" : "#69f0aa";
  // Phase 5: cap spark count in lite mode (parry sparks are the most particle-heavy)
  const lite = window.MrMacsArcadePerf && MrMacsArcadePerf.isLite();
  const baseCount = type === "spark" ? 12 : 18;
  const count = lite ? Math.min(4, baseCount) : baseCount;
  spawnParticles(x, y, color, count, type);
}

function animateParticles() {
  if (!ctx2) return;
  requestAnimationFrame(animateParticles);
  ctx2.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0.01);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.22; // gravity
    p.life -= p.decay;
    ctx2.globalAlpha = p.life;
    ctx2.fillStyle = p.color;
    ctx2.beginPath();
    ctx2.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = 1;
}
animateParticles();

// ─────────────────────────────────────────────
// SCREEN MANAGEMENT
// ─────────────────────────────────────────────
function setScreen(id) {
  ["setup","duel","end","roundBreather"].forEach((s) => {
    $(("#" + s))?.classList.toggle("hidden", s !== id);
  });
  $("#pauseBtn").style.display = id === "duel" ? "" : "none";
}

// ─────────────────────────────────────────────
// BANK / QUESTION HELPERS
// ─────────────────────────────────────────────
function sourceLockFor(q) {
  if (!SourceBank) {
    const images = (q.stimulusImages || []).filter((img) => img && img.src);
    const quarantined = /^quarantined/i.test(String(q.sourceIntegrity || ""));
    const needed = Boolean(q.stimulusRequired || images.length || /\b(according to|based on|document|source|map|cartoon|chart|graph|excerpt|passage|photograph|image|this statement|these headlines|this speech|this article|information on the map|both documents)\b/i.test([q.stem, q.prompt, q.source].join(" ")));
    const ok = !quarantined && (!needed || images.length);
    return { ok, needed, reason: ok ? "" : quarantined ? "Source quarantined" : "Source needs image", images: ok && needed ? images : [], label: ok ? (needed ? "Source matched" : "No source needed") : "Source blocked" };
  }
  return SourceBank.sourceLock(q);
}
function playableQuestion(q) {
  if (!q || !(q.choices || []).length) return false;
  if (SourceBank) return SourceBank.usableRegentsQuestion(q);
  return sourceLockFor(q).ok;
}
function bankQuestions() {
  const qs = G.bank?.questions || [];
  return qs.filter((q) => {
    if (!playableQuestion(q)) return false;
    if (G.course !== "All Courses" && q.course !== G.course) return false;
    if (G.set !== "All Sets" && q.set !== G.set) return false;
    return true;
  });
}

// ─────────────────────────────────────────────
// HUD RENDERING
// ─────────────────────────────────────────────
function renderHUD() {
  const m = G.run;
  const rnd = m.rounds;
  const r = currentRound();
  if (!r) return;

  // Round pips
  const pips = [1,2,3].map((i) => {
    const w = rnd[i-1];
    const cls = w === "win" ? "pip win" : w === "lose" ? "pip lose" : "pip";
    return `<span class="${cls}" aria-label="${w || "pending"}"></span>`;
  }).join("");
  $("#roundPips").innerHTML = pips;
  $("#roundLabel").textContent = `Round ${m.currentRound} of ${m.totalRounds}`;

  // Timer
  const t = r.timeLeft;
  const timerEl = $("#timerText");
  timerEl.textContent = String(t);
  timerEl.className = t <= 10 ? "danger" : "";

  // Streak + charge
  $("#streakText").textContent = String(r.streak);
  $("#chargeText").textContent = String(r.charge);

  // HP bars
  const youPct = clamp((r.youHp / r.youMaxHp) * 100, 0, 100);
  const enmPct = clamp((r.enemyHp / r.enemyMaxHp) * 100, 0, 100);
  $("#youBar").style.width = youPct + "%";
  $("#enemyBar").style.width = enmPct + "%";
  $("#youBar").className = "bar-fill you" + (youPct <= 25 ? " danger" : youPct <= 50 ? " warn" : "");
  $("#enemyBar").className = "bar-fill enemy" + (enmPct <= 25 ? " danger" : enmPct <= 50 ? " warn" : "");
  $("#youHpText").textContent = String(Math.max(0, r.youHp));
  $("#enemyHpText").textContent = String(Math.max(0, r.enemyHp));

  // Charge meter
  const chargePct = clamp((r.charge / r.maxCharge) * 100, 0, 100);
  $("#chargeFill").style.width = chargePct + "%";
  const ready = r.charge >= r.maxCharge;
  $("#chargeReady").classList.toggle("hidden", !ready);
  $("#cmdSpecial").disabled = !ready;
  $("#tSpecial").disabled = !ready;

  // Item button
  $("#itemSubLabel").textContent = r.itemUsed ? "Already used" : "Heal 20 HP (1 use)";
  $("#cmdItem").disabled = r.itemUsed || r.youHp >= r.youMaxHp;
  $("#tItem").disabled = r.itemUsed || r.youHp >= r.youMaxHp;

  // Charge pips in Special button (rendered by polish layer)
  renderChargePips(r.charge, r.maxCharge);

  // ARIA progress bars
  const youBarTrack = $("#youBarTrack");
  if (youBarTrack) youBarTrack.setAttribute("aria-valuenow", String(Math.max(0, r.youHp)));
  const enemyBarTrack = $("#enemyBarTrack");
  if (enemyBarTrack) enemyBarTrack.setAttribute("aria-valuenow", String(Math.max(0, r.enemyHp)));
  const chargeTrack = $("#chargeTrack");
  if (chargeTrack) chargeTrack.setAttribute("aria-valuenow", String(r.charge));
}

function renderEnemyInfo() {
  const opp = G.run.opponent;
  $("#enemyBarLabel").textContent = opp.name;
  $("#enemyStageName").textContent = opp.name;
  const isBoss = opp.id === "titan" || opp.id === "ai";
  $("#enemyAvatar").classList.toggle("boss", isBoss);
  $("#missionTitle").textContent = opp.name;
  $("#missionMeta").textContent = `${opp.era} · ${G.difficulty.charAt(0).toUpperCase() + G.difficulty.slice(1)} · Round ${G.run.currentRound}/3`;
  // Era-themed stage background — Phase 5: skip animation class in lite mode (static gradient)
  const stage = $("#combatStage");
  if (stage) {
    stage.className = stage.className.replace(/\bera-\S+/g, "").trim();
    const lite = window.MrMacsArcadePerf && MrMacsArcadePerf.isLite();
    if (!lite) stage.classList.add("era-" + (opp.skin || "spartan"));
  }
  // Round accent on duel panel
  const duelPanel = $("#duel");
  if (duelPanel) duelPanel.setAttribute("data-round", String(G.run.currentRound));
}

// ─────────────────────────────────────────────
// ROUND MANAGEMENT
// ─────────────────────────────────────────────
function currentRound() { return G.run?.roundData || null; }

function startMatch() {
  const pool = bankQuestions();
  const items = shuffle(pool.slice());
  const maxLen = G.length === 999 ? items.length : Math.min(Number(G.length), items.length);
  const opp = G.mode === "story" ? OPPONENTS[G.opponentIndex] : OPPONENTS[Number($("#opponentSelect").value)];
  const diff = DIFF[G.difficulty];

  G.run = mkMatch(G.bank, items.slice(0, maxLen), opp, diff);
  G.run.roundData = null;

  setScreen("duel");
  renderEnemyInfo();
  beginRound(1);
  startAmbient();
  playSound("start");

  // Phase 3 — First-run tour: 4 steps after first match starts
  // Delay so the duel screen and command menu are rendered
  setTimeout(function () {
    if (window.MrMacsArcadeTour) {
      MrMacsArcadeTour.start("arcade-duel", [
        {
          target: "#commandMenu",
          title: "4 commands",
          body: "Attack / Special / Defend / Restore. Special needs 3 streak charges; Restore is once per round.",
          placement: "auto",
        },
        {
          target: "#combatStage",
          title: "Watch the tells",
          body: "Each opponent has a tell — a brief windup before their attack. Block at the right time for a counter.",
          placement: "auto",
        },
        {
          target: "#questionPanel",
          title: "Answers fuel attacks",
          body: "Correct = full damage + crit chance. Wrong = half damage + opponent counter window.",
          placement: "auto",
        },
        {
          target: "#storyLadder",
          title: "7-opponent story ladder",
          body: "Spartan → Samurai → Knight → Frontiersman → Cold War Spy → Knowledge Titan → Future AI. Beat them all.",
          placement: "center",
        },
      ]);
    }
  }, 800);
}

function beginRound(roundNum) {
  const m = G.run;
  m.currentRound = roundNum;
  const diff = m.diff;
  const r = mkRound(m.opponent, diff);
  // Feed questions from shared pool
  r.items = m.items.slice(m.itemCursor, m.itemCursor + 12);
  // HP carry: partial refill between rounds (30%)
  if (roundNum > 1) {
    const prev = m.roundData;
    r.youHp = clamp(prev.youHp + Math.round(r.youMaxHp * 0.30), 20, r.youMaxHp);
    r.enemyHp = clamp(prev.enemyHp + Math.round(r.enemyMaxHp * 0.30), 20, r.enemyMaxHp);
  }
  m.roundData = r;
  showPhase("command");
  renderHUD();
  renderEnemyInfo();
  startRoundTimer();
  playSound("bell");
  showStinger(`ROUND ${roundNum}`, "round-start", 1600);
  showRoundIntro(roundNum, m.opponent);
}

function startRoundTimer() {
  const r = currentRound();
  clearInterval(r.timerID);
  r.timerID = setInterval(() => {
    if (G.paused) return;
    r.timeLeft -= 1;
    renderHUD();
    if (r.timeLeft <= 10 && r.timeLeft > 0) playSound("timer");
    if (r.timeLeft <= 0) {
      clearInterval(r.timerID);
      resolveTimeout();
    }
  }, 1000);
}

function resolveTimeout() {
  const r = currentRound();
  // Whoever has more HP % wins on time
  const youPct = r.youHp / r.youMaxHp;
  const enmPct = r.enemyHp / r.enemyMaxHp;
  const won = youPct > enmPct;
  flashStage(won ? "hit-enemy" : "hit-player", "Time's Up!");
  endRound(won ? "win" : "lose");
}

// ─────────────────────────────────────────────
// PHASE: COMMAND MENU / QUESTION CARD
// ─────────────────────────────────────────────
function showPhase(phase) {
  const r = currentRound();
  if (!r) return;
  r.phase = phase;
  if (phase === "command") {
    r.answered = false;
    $("#commandMenu").classList.remove("hidden");
    $("#questionCard").classList.add("hidden");
    $("#feedback").classList.add("hidden");
    $("#nextBtn").classList.add("hidden");
  } else {
    $("#commandMenu").classList.add("hidden");
    $("#questionCard").classList.remove("hidden");
  }
  renderHUD();
}

// ─────────────────────────────────────────────
// COMMANDS
// ─────────────────────────────────────────────
function cmdAttack() { startQuestion("attack"); }
function cmdSpecial() { if (currentRound().charge >= currentRound().maxCharge) startQuestion("special"); }
function cmdDefend() {
  const r = currentRound();
  r.defending = true;
  flashStage("defend", "Defending…");
  playSound("block");
  showStinger("DEFEND", "defend", 900);
  spawnStageParticles("player", "spark");
  enemyAttack();
}
function cmdItem() {
  const r = currentRound();
  if (r.itemUsed || r.youHp >= r.youMaxHp) return;
  r.itemUsed = true;
  r.youHp = Math.min(r.youMaxHp, r.youHp + 20);
  playSound("heal");
  flashStage("heal", "+20 HP restored!");
  spawnStageParticles("player", "burst");
  renderHUD();
  // After item, enemy attacks
  setTimeout(() => enemyAttack(), 700);
}

// ─────────────────────────────────────────────
// QUESTION FLOW
// ─────────────────────────────────────────────
function startQuestion(move) {
  const r = currentRound();
  r.pendingMove = move;
  const q = pickQuestion();
  if (!q) { // no questions left — just do base damage
    resolveMove(true, true); return;
  }
  r.currentQ = q;
  r.answered = false;
  showPhase("question");
  renderQuestionCard(q);
}

function pickQuestion() {
  const m = G.run;
  if (m.itemCursor >= m.items.length) return null;
  const q = m.items[m.itemCursor];
  m.itemCursor++;
  return q;
}

function renderQuestionCard(q) {
  const lock = sourceLockFor(q);
  const tags = [q.course, q.day, q.set, lock.needed ? "Stimulus Based" : "Content Recall", q.source];
  $("#qTags").innerHTML = tags.filter(Boolean).slice(0, 5).map((t) => `<span>${esc(t)}</span>`).join("");
  $("#qStem").textContent = q.stem;
  renderStimulus(q);
  $("#choices").innerHTML = q.choices.map((c) => (
    `<button class="choice" data-choice="${esc(c.label)}" type="button"><strong>${esc(c.label)}</strong><span>${esc(c.text)}</span></button>`
  )).join("");
  $$(".choice").forEach((btn) => btn.addEventListener("click", () => choose(btn.dataset.choice)));
  $("#feedback").classList.add("hidden");
  $("#nextBtn").classList.add("hidden");
  $("#skipBtn").classList.remove("hidden");
}

function renderStimulus(q) {
  const panel = $("#stimulusPanel");
  const strip = $("#stimulusStrip");
  if (!panel || !strip) return;
  const lock = sourceLockFor(q);
  const imgs = lock.images || [];
  panel.classList.toggle("hidden", imgs.length === 0);
  strip.innerHTML = imgs.map((img, i) => (
    `<figure><img loading="lazy" src="${esc(img.src)}" alt="${esc(img.label || "Stimulus image " + (i+1))}"><figcaption>${esc(img.label || "Stimulus image " + (i+1))}</figcaption></figure>`
  )).join("");
}

function choose(label) {
  const r = currentRound();
  const q = r.currentQ;
  if (r.answered || !q) return;
  r.answered = true;
  const correct = label === q.correct;

  // Track globally
  G.run.totalPlayed++;
  if (correct) {
    G.run.totalCorrect++;
    r.correct = (r.correct || 0) + 1;
  } else {
    G.run.totalMissed.push(q);
    r.missed = (r.missed || []).concat([q]);
  }

  // Update streak
  if (correct) {
    r.streak++;
    if (r.streak > G.run.bestStreak) G.run.bestStreak = r.streak;
  } else {
    r.streak = 0;
  }

  // Show answer highlighting
  $$(".choice").forEach((btn) => {
    const lab = btn.dataset.choice;
    btn.disabled = true;
    if (lab === q.correct) btn.classList.add("correct");
    if (lab === label && !correct) btn.classList.add("wrong");
  });

  const explanation = q.explanation || ("Correct: " + (q.choices.find((c) => c.label === q.correct)?.text || ""));
  $("#feedback").innerHTML = `<strong>${correct ? "✓ Correct!" : "✗ Wrong."}</strong><p>${esc(explanation)}</p>`;
  if (r.streak === 3) {
    $("#feedback").innerHTML += `<p class="finisher-notice">🔥 FINISHER UNLOCKED — use Special now!</p>`;
  }
  $("#feedback").classList.remove("hidden");
  $("#skipBtn").classList.add("hidden");
  $("#nextBtn").classList.remove("hidden");

  playSound(correct ? "correct" : "wrong");

  // MrMacsProfile — per-answer shards + first-correct achievement (Hooks 3a, 4a)
  if (correct && window.MrMacsProfile) {
    MrMacsProfile.addShards(15, "arcade-duel-correct");
    MrMacsProfile.unlock("first-correct");
  }

  // Phase 1 — recordAnswer: track per-topic stats + wrong-answer queue
  if (window.MrMacsProfile && MrMacsProfile.recordAnswer) {
    MrMacsProfile.recordAnswer({
      course: q.course || G.course,
      set: q.set || G.set,
      gameId: "arcade-duel",
      correct: correct,
      prompt: q.stem || "",
      answer: (q.choices || []).find((c) => c.label === q.correct)?.text || "",
    });
  }

  resolveMove(correct, false);
}

function skipQuestion() {
  const r = currentRound();
  if (r.answered) return;
  r.answered = true;
  r.streak = 0;
  playSound("skip");
  $("#feedback").innerHTML = `<strong>Skipped.</strong><p>Opponent gets a free attack.</p>`;
  $("#feedback").classList.remove("hidden");
  $("#skipBtn").classList.add("hidden");
  $("#nextBtn").classList.remove("hidden");
  resolveMove(false, true); // wrong + skip flag
}

// ─────────────────────────────────────────────
// DAMAGE RESOLUTION
// ─────────────────────────────────────────────
function resolveMove(correct, wasSkip) {
  const r = currentRound();
  const move = r.pendingMove;
  const diff = G.run.diff;

  if (correct) {
    // Player attacks
    let dmg = randInt(18, 26);
    if (move === "special") {
      dmg = Math.round(dmg * 2.0);
      r.charge = 0;
      playSound("special");
      spawnStageParticles("enemy", "burst");
    } else {
      // Charge builds on correct
      r.charge = Math.min(r.maxCharge, r.charge + 1);
      spawnStageParticles("enemy", "burst");
      playSound("hit");
    }
    // Streak crit: 3 streak = +50% on non-special
    if (r.streak >= 3 && move !== "special") {
      dmg = Math.round(dmg * 1.5);
    }
    dmg = Math.round(dmg * diff.playerMult);
    hitStop(300);
    cameraShake(move === "special" ? 12 : 6);
    r.enemyHp = Math.max(0, r.enemyHp - dmg);
    flashStage("hit-enemy", move === "special" ? `SPECIAL  −${dmg}!` : `Hit! −${dmg}`);
    if (move === "special") showStinger("SPECIAL ATTACK!", "special", 1100);
    showCombo(r.streak);
    spawnDamageFloat(dmg, "enemy", r.streak >= 3 && move !== "special");
    renderHUD();
    if (r.enemyHp <= 0) { showKOStamp(); setTimeout(() => endRound("win"), 800); return; }
  } else {
    // Wrong / skip — opponent counter-window
    r.aiCounterWindow = true;
  }

  // Opponent attacks after correct or wrong
  const delay = correct ? 900 : wasSkip ? 500 : 700;
  setTimeout(() => enemyAttack(), delay);
}

// ─────────────────────────────────────────────
// AI OPPONENT
// ─────────────────────────────────────────────
function enemyAttack() {
  const r = currentRound();
  const m = G.run;
  const opp = m.opponent;
  const diff = m.diff;

  // AI decision logic:
  // If counter window (player wrong/skip) → guaranteed attack
  // If player HP low and AI has no counter window → 40% chance to attack anyway
  const forceAttack = r.aiCounterWindow;
  const spontaneous = !forceAttack && r.youHp < r.youMaxHp * 0.4 && Math.random() > (1 - diff.aiSkipChance);
  r.aiCounterWindow = false;

  if (!forceAttack && !spontaneous) {
    // AI "skips" this turn — telegraphed tell
    r.aiTell = true;
    flashStage("ai-tell", `${opp.name}: ${opp.tell}`);
    showStinger("⚠ TELL!", "ai-tell", 900);
    setTimeout(() => { r.aiTell = false; showPhase("command"); }, 1100);
    return;
  }

  // AI uses special if HP below threshold
  let isSpecial = r.enemyHp < r.enemyMaxHp * diff.aiSpecialHp && Math.random() > 0.45;

  let dmg = randInt(opp.atk[0], opp.atk[1]);
  dmg = Math.round(dmg * diff.aiMult);
  if (isSpecial) {
    dmg = Math.round(dmg * 1.8);
    flashStage("hit-player", `${opp.name} SPECIAL −${dmg}!`);
    showStinger(`${opp.name.toUpperCase()}\nSPECIAL!`, "enemy-special", 1000);
    playSound("heavy");
    cameraShake(14);
    spawnStageParticles("player", "burst");
  } else {
    flashStage("hit-player", `${opp.name} hits −${dmg}`);
    playSound("hit");
    spawnStageParticles("player", "spark");
  }

  // Defending reduces by 50%
  if (r.defending) {
    dmg = Math.max(1, Math.round(dmg * 0.5));
    flashStage("hit-player", `Blocked! −${dmg}`);
    playSound("block");
    spawnStageParticles("player", "spark");
    r.defending = false;
  }

  hitStop(isSpecial ? 420 : 200);
  r.youHp = Math.max(0, r.youHp - dmg);
  r.damageTakenThisRound += dmg; // MrMacsProfile flawless tracking (Hook 4b)
  spawnDamageFloat(dmg, "player", isSpecial);
  renderHUD();

  if (r.youHp <= 0) {
    showKOStamp();
    setTimeout(() => endRound("lose"), 700);
    return;
  }
  // Return to command menu
  setTimeout(() => showPhase("command"), 800);
}

// ─────────────────────────────────────────────
// ROUND ENDING
// ─────────────────────────────────────────────
function endRound(result) {
  const r = currentRound();
  clearInterval(r.timerID);
  const m = G.run;

  m.rounds[m.currentRound - 1] = result;
  if (result === "win") {
    m.playerWins++;
    playSound("wave");
    showStinger("ROUND WIN!", "round-win", 1800);
    // MrMacsProfile — round win shards + flawless achievement (Hooks 3b, 4b)
    if (window.MrMacsProfile) {
      MrMacsProfile.addShards(75, "arcade-duel-round-win");
      if (r.damageTakenThisRound === 0) MrMacsProfile.unlock("duel-flawless");
    }
  } else {
    m.enemyWins++;
    playSound("ko");
    showStinger("ROUND LOST", "round-lose", 1800);
  }

  // Check match winner
  if (m.playerWins >= 2 || m.enemyWins >= 2 || m.currentRound >= m.totalRounds) {
    setTimeout(() => endMatch(), 2000);
    return;
  }

  // More rounds — show breather
  setTimeout(() => showBreather(result), 1800);
}

function showBreather(lastResult) {
  const m = G.run;
  const r = currentRound();
  const won = lastResult === "win";

  // Perfect round bonus
  const perfectBonus = r.youHp === r.youMaxHp;
  if (perfectBonus && won) r.youHp = Math.min(r.youMaxHp, r.youHp + 15);

  $("#breatherBadge").textContent = won ? "Round Win! 🏆" : "Round Lost 💀";
  $("#breatherBadge").className = "breather-badge " + (won ? "win" : "lose");
  $("#breatherTitle").textContent = `Prepare for Round ${m.currentRound + 1}`;
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  $("#breatherTip").textContent = tip;

  // Breather bars (preview HP for next round)
  const youNext = clamp(r.youHp + Math.round(r.youMaxHp * 0.30), 20, r.youMaxHp);
  const enmNext = clamp(r.enemyHp + Math.round(r.enemyMaxHp * 0.30), 20, r.enemyMaxHp);
  $("#bYouBar").style.width = (youNext / r.youMaxHp * 100) + "%";
  $("#bEnemyBar").style.width = (enmNext / r.enemyMaxHp * 100) + "%";
  $("#bYouHp").textContent = youNext;
  $("#bEnemyHp").textContent = enmNext;
  $("#bEnemyName").textContent = m.opponent.name;

  setScreen("roundBreather");
}

function continueRound() {
  const m = G.run;
  setScreen("duel");
  beginRound(m.currentRound + 1);
}

function endMatch() {
  const m = G.run;
  stopAmbient();
  clearInterval(currentRound()?.timerID);

  const won = m.playerWins > m.enemyWins;
  const perfect = m.enemyWins === 0;
  const stingerText = perfect ? "PERFECT!" : won ? "VICTORY!" : "DEFEAT";
  showStinger(stingerText, won ? "victory" : "defeat", 2500);
  playSound(won ? "finisher" : "ko");

  // Persist progress
  const save = loadSave();
  if (won && G.mode === "story") {
    const beaten = save.beatenOpponents || [];
    if (!beaten.includes(m.opponent.id)) beaten.push(m.opponent.id);
    writeSave({ beatenOpponents: beaten, difficulty: G.difficulty });
  }
  if (m.bestStreak > (save.bestStreak || 0)) writeSave({ bestStreak: m.bestStreak });

  // MrMacsProfile — match win shards + ladder shards + achievements (Hooks 3c, 3d, 4c)
  if (won && window.MrMacsProfile) {
    MrMacsProfile.addShards(200, "arcade-duel-match-win");
    if (G.mode === "story") {
      MrMacsProfile.addShards(500, "arcade-duel-ladder-opponent");
      if (G.opponentIndex === OPPONENTS.length - 1) MrMacsProfile.unlock("duel-ladder");
    }
  }

  const played = m.totalPlayed;
  const acc = played ? Math.round((m.totalCorrect / played) * 100) : 0;

  MrMacsAnalytics?.track("game_complete", {
    gameId: "arcade-duel",
    title: "Arcade Duel",
    score: m.playerWins,
    accuracy: acc,
    questions: played,
  }, { counter: "game-completions" });

  setTimeout(() => {
    setScreen("end");
    // New result title element
    const resultEl = $("#endResultTitle");
    if (resultEl) {
      resultEl.textContent = perfect ? "PERFECT!" : won ? "VICTORY!" : "DEFEAT";
      resultEl.className = "end-result-title " + (perfect ? "perfect" : won ? "victory" : "defeat");
    }
    $("#endMeta").textContent = `${G.course} · ${G.set} · vs ${m.opponent.name}`;
    const metrics = [
      { val: m.playerWins, suffix: "/" + m.totalRounds, label: "rounds won", numeric: true },
      { val: acc, suffix: "%", label: "accuracy", numeric: true },
      { val: m.totalCorrect, suffix: "/" + played, label: "correct", numeric: true },
      { val: m.bestStreak, suffix: "", label: "best streak", numeric: true },
    ];
    $("#endGrid").innerHTML = metrics.map((m, i) => `<div class="metric"><strong id="metric-${i}">${esc(String(m.val) + m.suffix)}</strong><span>${esc(m.label)}</span></div>`).join("");
    // Animated count-up on numeric metrics
    metrics.forEach((m, i) => {
      const el = $("#metric-" + i);
      if (!el || !m.numeric) return;
      const orig = String(m.val) + m.suffix;
      el.textContent = "0" + m.suffix;
      setTimeout(() => {
        let current = 0;
        const target = m.val;
        const steps = 24;
        const inc = target / steps;
        const id = setInterval(() => {
          current = Math.min(current + inc, target);
          el.textContent = Math.round(current) + m.suffix;
          if (current >= target) clearInterval(id);
        }, 40);
      }, i * 120);
    });
    $("#missedList").innerHTML = m.totalMissed.length
      ? m.totalMissed.slice(0, 10).map((q) => `<div class="missed-item"><strong>${esc(q.stem)}</strong><p>${esc((q.course || "") + " · " + (q.day || "") + " · " + (q.source || ""))}</p><p>${esc(q.explanation || "")}</p></div>`).join("")
      : `<div class="missed-item"><strong>No missed questions.</strong><p>Outstanding performance!</p></div>`;
    renderStoryLadder();
  }, 2600);
}

// ─────────────────────────────────────────────
// VISUAL EFFECTS
// ─────────────────────────────────────────────
function flashStage(kind, label) {
  const stage = $("#combatStage");
  if (!stage) return;
  stage.classList.remove("hit-enemy","hit-player","defend","heal","ai-tell");
  void stage.offsetWidth; // force reflow
  if (kind === "hit-enemy") stage.classList.add("hit-enemy");
  else if (kind === "hit-player") stage.classList.add("hit-player");
  else if (kind === "defend") stage.classList.add("defend");
  else if (kind === "heal") stage.classList.add("heal");
  else if (kind === "ai-tell") stage.classList.add("ai-tell");
  if (label) $("#stageCallout").textContent = label;
  setTimeout(() => stage.classList.remove("hit-enemy","hit-player","defend","heal","ai-tell"), 600);
}

// Hit-stop: briefly freeze avatar animations
let hitStopTimeout = null;
function hitStop(ms) {
  const stage = $("#combatStage");
  if (!stage) return;
  stage.classList.add("hit-stop");
  clearTimeout(hitStopTimeout);
  hitStopTimeout = setTimeout(() => stage.classList.remove("hit-stop"), ms);
}

// Camera shake via CSS class — Phase 5: lite mode reduces intensity
let shakeTimeout = null;
function cameraShake(intensity) {
  const shell = $("#app");
  if (!shell) return;
  // Lite mode: halve shake on heavy hits (intensity > 8), skip if very light
  const lite = window.MrMacsArcadePerf && MrMacsArcadePerf.isLite();
  if (lite && intensity <= 4) return;
  const effectiveIntensity = lite ? Math.max(2, Math.round(intensity * 0.45)) : intensity;
  shell.style.setProperty("--shake", effectiveIntensity + "px");
  shell.classList.add("shaking");
  clearTimeout(shakeTimeout);
  shakeTimeout = setTimeout(() => shell.classList.remove("shaking"), 420);
}

// Combo floating counter
function showCombo(streak) {
  if (streak < 2) return;
  const el = $("#comboCounter");
  if (!el) return;
  el.textContent = `${streak}× COMBO`;
  el.className = "combo-counter" + (streak >= 5 ? " mega" : "");
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 1400);
}

// Stinger banner
let stingerTimeout = null;
function showStinger(text, variant, duration) {
  const el = $("#stinger");
  if (!el) return;
  el.textContent = text;
  el.className = "stinger stinger-" + variant;
  el.classList.remove("hidden");
  clearTimeout(stingerTimeout);
  stingerTimeout = setTimeout(() => el.classList.add("hidden"), duration || 1500);
}

// Slow-mo on K.O. (CSS class on body)
function slowMo(ms) {
  document.body.classList.add("slow-mo");
  setTimeout(() => document.body.classList.remove("slow-mo"), ms);
}

// ─────────────────────────────────────────────
// ROUND INTRO OVERLAY
// ─────────────────────────────────────────────
function showRoundIntro(roundNum, opp) {
  // Remove any existing overlay
  const old = $("#roundIntroOverlay");
  if (old) old.remove();

  const roundColors = { 1: "var(--r1)", 2: "var(--r2)", 3: "var(--r3)" };
  const color = roundColors[roundNum] || "var(--gold)";

  const ov = document.createElement("div");
  ov.id = "roundIntroOverlay";
  ov.setAttribute("aria-hidden", "true");
  ov.style.setProperty("--round-intro-color", color);
  ov.innerHTML = `
    <div class="intro-round-num">Round ${roundNum} of 3</div>
    <div class="intro-fight-word">FIGHT</div>
    <div class="intro-vs-strip">
      <div class="intro-fighter player-side">
        <div class="intro-portrait">🎓</div>
        <div class="intro-fighter-name">Review Core</div>
        <div class="intro-fighter-sub">You</div>
      </div>
      <div class="intro-vs-divider">
        <div class="intro-vs-line"></div>
        VS
        <div class="intro-vs-line"></div>
      </div>
      <div class="intro-fighter enemy-side">
        <div class="intro-portrait">${opp.icon || "⚔️"}</div>
        <div class="intro-fighter-name">${esc(opp.name)}</div>
        <div class="intro-fighter-sub">${esc(opp.era)}</div>
      </div>
    </div>
    <div class="intro-tell-tip">⚠ ${esc(opp.tell)}</div>
  `;
  document.body.appendChild(ov);

  // Auto-remove after 2.2s
  setTimeout(() => {
    ov.classList.add("fade-out");
    setTimeout(() => ov.remove(), 420);
  }, 2200);
}

// ─────────────────────────────────────────────
// DAMAGE NUMBER FLOATS
// ─────────────────────────────────────────────
function spawnDamageFloat(dmg, side, isCrit) {
  const stage = $("#combatStage");
  if (!stage) return;
  const r = stage.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "dmg-float " + (side === "enemy" ? "enemy-dmg" : "player-dmg") + (isCrit ? " crit" : "");
  el.textContent = (isCrit ? "✦ " : "−") + dmg;
  const xBase = side === "enemy" ? r.width * 0.68 : r.width * 0.24;
  el.style.cssText = `
    left:${xBase + randInt(-18, 18)}px;
    top:${r.height * 0.36 + randInt(-12, 12)}px;
    font-size:${isCrit ? 22 : 16 + Math.min(dmg / 8, 8)}px;
  `;
  stage.style.position = "relative";
  stage.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ─────────────────────────────────────────────
// KO STAMP
// ─────────────────────────────────────────────
function showKOStamp() {
  const stage = $("#combatStage");
  if (!stage) return;
  const el = document.createElement("div");
  el.className = "ko-stamp";
  el.innerHTML = `<span class="ko-text">K.O.</span>`;
  stage.appendChild(el);
  setTimeout(() => el.remove(), 1600);
  // Phase 5: skip slow-mo in lite mode
  const lite = window.MrMacsArcadePerf && MrMacsArcadePerf.isLite();
  if (!lite) slowMo(800);
}

// ─────────────────────────────────────────────
// CHARGE PIPS IN SPECIAL BUTTON
// ─────────────────────────────────────────────
function renderChargePips(charge, maxCharge) {
  for (let i = 0; i < 3; i++) {
    const pip = $("#cpip" + i);
    if (pip) pip.classList.toggle("filled", i < charge);
  }
}

// ─────────────────────────────────────────────
// STORY LADDER VISUALIZATION
// ─────────────────────────────────────────────
function renderStoryLadder() {
  const list = $("#ladderList");
  if (!list) return;
  const save = loadSave();
  const beaten = save.beatenOpponents || [];
  const currentIdx = G.opponentIndex;
  list.innerHTML = OPPONENTS.map((o, i) => {
    const isDefeated = beaten.includes(o.id);
    const isCurrent = i === currentIdx && G.mode === "story";
    const isLocked = i > 0 && !beaten.includes(OPPONENTS[i-1].id) && !isDefeated && !isCurrent;
    let cls = "ladder-item";
    if (isDefeated) cls += " defeated";
    else if (isCurrent) cls += " current";
    else if (isLocked) cls += " locked";
    const badge = isDefeated ? "✓" : isCurrent ? "▶" : isLocked ? "🔒" : "•";
    return `<div class="${cls}" role="listitem" aria-label="${esc(o.name)}, ${isDefeated ? "defeated" : isCurrent ? "current target" : "pending"}">
      <span class="ladder-badge" aria-hidden="true">${badge}</span>
      <div class="ladder-portrait" aria-hidden="true">${o.icon || "⚔️"}</div>
      <div class="ladder-name">${esc(o.name)}</div>
      <div class="ladder-era">${esc(o.era)}</div>
    </div>`;
  }).join("");
}

// ─────────────────────────────────────────────
// DIFFICULTY PILLS
// ─────────────────────────────────────────────
function renderDiffPills(active) {
  $$(".diff-pill").forEach((pill) => {
    const d = pill.dataset.diff;
    pill.className = "diff-pill" + (d === active ? " active-" + d : "");
    pill.setAttribute("aria-pressed", d === active ? "true" : "false");
  });
}

// ─────────────────────────────────────────────
// ANIMATED COUNT-UP
// ─────────────────────────────────────────────
function countUp(el, target, duration) {
  if (!el) return;
  const start = 0;
  const step = duration / 30;
  let current = start;
  const inc = (target - start) / 30;
  el.classList.add("metric-counting");
  const id = setInterval(() => {
    current += inc;
    if (current >= target) {
      el.textContent = target;
      el.classList.remove("metric-counting");
      clearInterval(id);
    } else {
      el.textContent = typeof target === "number" && !isNaN(target)
        ? Math.round(current)
        : target;
    }
  }, step);
}

// ─────────────────────────────────────────────
// SETUP SCREEN
// ─────────────────────────────────────────────
function renderSetOptions() {
  const qs = (G.bank?.questions || []).filter(playableQuestion);
  const sets = uniq(qs.filter((q) => G.course === "All Courses" || q.course === G.course).map((q) => q.set));
  $("#setSelect").innerHTML = ["All Sets", ...sets].map((s) => `<option>${esc(s)}</option>`).join("");
  if (!sets.includes(G.set)) G.set = "All Sets";
  $("#setSelect").value = G.set;
}

function renderSetupMetrics() {
  const qs = bankQuestions();
  const stim = qs.filter((q) => sourceLockFor(q).images.length).length;
  $("#setupMetrics").innerHTML = `<strong>${qs.length}</strong> playable MCQs · <strong>${stim}</strong> source matched`;
}

function renderOpponentSelect() {
  const save = loadSave();
  const beaten = save.beatenOpponents || [];
  $("#opponentSelect").innerHTML = OPPONENTS.map((o, i) => {
    const unlocked = i === 0 || beaten.includes(OPPONENTS[i-1].id) || beaten.includes(o.id) || G.mode === "versus";
    const label = unlocked ? `${o.name} (${o.era})` : `${o.name} — Locked`;
    return `<option value="${i}" ${unlocked ? "" : "disabled"}>${esc(label)}</option>`;
  }).join("");
}

// ─────────────────────────────────────────────
// PAUSE
// ─────────────────────────────────────────────
function togglePause() {
  G.paused = !G.paused;
  $("#pauseOverlay").classList.toggle("hidden", !G.paused);
  $("#pauseBtn").textContent = G.paused ? "▶" : "⏸";
}

// ─────────────────────────────────────────────
// KEYBOARD CONTROLS
// ─────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!$("#duel").classList.contains("hidden")) togglePause();
    return;
  }
  if (G.paused) return;
  const r = currentRound();
  if (!r || $("#duel").classList.contains("hidden")) return;

  // Question phase: 1-4 to pick answer, Enter for next
  if (r.phase === "question") {
    if (e.key >= "1" && e.key <= "4") {
      const btn = $$(".choice")[Number(e.key) - 1];
      if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
    }
    if (e.key === "Enter" && !$("#nextBtn").classList.contains("hidden")) {
      e.preventDefault(); advanceAfterQuestion();
    }
    return;
  }

  // Command phase: J=attack, K=defend, L=special, I=item
  if (r.phase === "command") {
    if (e.key === "j" || e.key === "J") { e.preventDefault(); cmdAttack(); }
    if (e.key === "k" || e.key === "K") { e.preventDefault(); cmdDefend(); }
    if (e.key === "l" || e.key === "L") { e.preventDefault(); cmdSpecial(); }
    if (e.key === "i" || e.key === "I") { e.preventDefault(); cmdItem(); }
  }
});

// ─────────────────────────────────────────────
// ADVANCE AFTER QUESTION ANSWERED
// ─────────────────────────────────────────────
function advanceAfterQuestion() {
  showPhase("command");
}

// ─────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────
async function load() {
  try {
    const res = await fetch("../../data/regents-gauntlet-bank.json?v=20260502-source-contract");
    if (!res.ok) throw new Error("Bank load failed: " + res.status);
    G.bank = await res.json();

    const qs = (G.bank.questions || []).filter(playableQuestion);
    $("#courseSelect").innerHTML = ["All Courses", ...uniq(qs.map((q) => q.course))].map((c) => `<option>${esc(c)}</option>`).join("");
    renderSetOptions();
    renderSetupMetrics();
    renderOpponentSelect();
    renderStoryLadder();

    // Restore prefs
    const save = loadSave();
    if (save.difficulty) {
      G.difficulty = save.difficulty;
    }
    renderDiffPills(G.difficulty);

    // MrMacsProfile — boot hook (Hook 2)
    if (window.MrMacsProfile) {
      MrMacsProfile.recordPlay({ id: "arcade-duel", title: "Arcade Duel", course: "All Courses", file: "games/arcade-duel/index.html" });
      // Sound at boot: respect profile mute preference (Hook 5)
      const profileSettings = MrMacsProfile.getSettings();
      if (profileSettings && profileSettings.sound === false) {
        G.muted = true;
        $("#muteBtn").textContent = "🔇";
      }
    }

    $("#loadStatus").textContent = `Loaded ${qs.length} playable MCQs.`;
  } catch (err) {
    console.error(err);
    $("#loadStatus").textContent = "Failed to load bank.";
    $("#startBtn").disabled = true;
  }
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
$("#courseSelect").addEventListener("change", (e) => { G.course = e.target.value; renderSetOptions(); renderSetupMetrics(); });
$("#setSelect").addEventListener("change", (e) => { G.set = e.target.value; renderSetupMetrics(); });
$("#lengthSelect").addEventListener("change", (e) => { G.length = Number(e.target.value); renderSetupMetrics(); });
// Difficulty pills (new UI — replaces hidden diffSelect)
$$(".diff-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    G.difficulty = pill.dataset.diff;
    renderDiffPills(G.difficulty);
    writeSave({ difficulty: G.difficulty });
  });
});
// Keep hidden diffSelect in sync (fallback)
$("#diffSelect")?.addEventListener("change", (e) => {
  G.difficulty = e.target.value;
  renderDiffPills(G.difficulty);
});
$("#modeSelect").addEventListener("change", (e) => {
  G.mode = e.target.value;
  $("#opponentPickWrap").classList.toggle("hidden", G.mode !== "versus");
  renderOpponentSelect();
  renderStoryLadder();
});
$("#startBtn").addEventListener("click", () => { ensureCtx(); startMatch(); });
$("#nextBtn").addEventListener("click", advanceAfterQuestion);
$("#skipBtn").addEventListener("click", skipQuestion);
$("#againBtn").addEventListener("click", () => { G.run = null; setScreen("setup"); renderSetupMetrics(); renderStoryLadder(); });
$("#continueRoundBtn").addEventListener("click", continueRound);
$("#toggleStimulus").addEventListener("click", () => $("#stimulusPanel").classList.toggle("expanded"));

// Command menu buttons
$("#cmdAttack").addEventListener("click", cmdAttack);
$("#cmdSpecial").addEventListener("click", cmdSpecial);
$("#cmdDefend").addEventListener("click", cmdDefend);
$("#cmdItem").addEventListener("click", cmdItem);

// Touch bar (mirrors command menu)
$("#tAttack").addEventListener("click", cmdAttack);
$("#tSpecial").addEventListener("click", cmdSpecial);
$("#tDefend").addEventListener("click", cmdDefend);
$("#tItem").addEventListener("click", cmdItem);

// Pause / mute
$("#pauseBtn").addEventListener("click", togglePause);
$("#resumeBtn").addEventListener("click", togglePause);
$("#quitBtn").addEventListener("click", () => { togglePause(); G.run = null; stopAmbient(); setScreen("setup"); });
$("#muteBtn").addEventListener("click", () => {
  G.muted = !G.muted;
  $("#muteBtn").textContent = G.muted ? "🔇" : "🔊";
  if (G.muted) stopAmbient(); else startAmbient();
});

$("#openHub").addEventListener("click", () => {
  if (window.top === window) location.href = "../../index.html#library";
  else window.parent.postMessage({ type: "mrmac_arcade_close" }, "*");
});

load();
