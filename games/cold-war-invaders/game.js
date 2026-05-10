// Cold War Invaders — Full Arcade Engine v2.0
// Systems: fleet march, accel/decel player, destructible shields, UFO, power-ups,
// wave/mission structure, boss phases, audio (Web Audio), particles, CRT, localStorage
"use strict";

// ─── DOM refs ────────────────────────────────────────────────────────────────
const els = {
  canvas:         document.querySelector("#gameCanvas"),
  setup:          document.querySelector("#setupScreen"),
  briefing:       document.querySelector("#briefing"),
  results:        document.querySelector("#resultScreen"),
  start:          document.querySelector("#startBtn"),
  again:          document.querySelector("#againBtn"),
  pause:          document.querySelector("#pauseBtn"),
  quit:           document.querySelector("#quitBtn"),
  mute:           document.querySelector("#muteBtn"),
  touchLeft:      document.querySelector("#touchLeft"),
  touchRight:     document.querySelector("#touchRight"),
  touchFire:      document.querySelector("#touchFire"),
  touchIntel:     document.querySelector("#touchIntel"),
  theater:        document.querySelector("#theaterSelect"),
  difficulty:     document.querySelector("#difficultySelect"),
  metrics:        document.querySelector("#missionMetrics"),
  score:          document.querySelector("#score"),
  wave:           document.querySelector("#wave"),
  shield:         document.querySelector("#shield"),
  intel:          document.querySelector("#intel"),
  topStats:       document.querySelector("#topStats"),
  questionMeta:   document.querySelector("#questionMeta"),
  questionReward: document.querySelector("#questionReward"),
  questionPrompt: document.querySelector("#questionPrompt"),
  questionSource: document.querySelector("#questionSource"),
  choices:        document.querySelector("#choices"),
  feedback:       document.querySelector("#feedback"),
  resultTitle:    document.querySelector("#resultTitle"),
  resultMetrics:  document.querySelector("#resultMetrics"),
  coach:          document.querySelector("#coachText")
};

const ctx           = els.canvas.getContext("2d");
const keys          = new Set();
const reduceMotion  = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileCtrl    = matchMedia("(max-width: 820px)");
const perfLite      = matchMedia("(pointer: coarse)").matches || innerWidth < 760
                   || !!(window.MrMacsArcadePerf && window.MrMacsArcadePerf.isLite());
const SourceBank    = window.MrMacsSourceBank ?? null;

// ─── Audio (Web Audio API — no files) ─────────────────────────────────────
let audioCtx = null;
let muted    = false;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

function playTone({ type = "square", freq = 440, freq2, freqTime,
                    gain = 0.18, gainDecay = 0.12, duration = 0.12,
                    detune = 0, when = 0 } = {}) {
  if (muted || reduceMotion) return;
  try {
    const ac  = getAudioCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.connect(env);
    env.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    if (freq2 !== undefined && freqTime !== undefined) {
      osc.frequency.setValueAtTime(freq, ac.currentTime + when);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), ac.currentTime + when + freqTime);
    }
    env.gain.setValueAtTime(gain, ac.currentTime + when);
    env.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + duration + gainDecay);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + duration + gainDecay + 0.02);
  } catch {}
}

function sfxShot()    { playTone({ type:"square", freq:520, freq2:300, freqTime:0.06, gain:0.13, duration:0.06, gainDecay:0.04 }); }
function sfxHit()     { playTone({ type:"sawtooth", freq:180, freq2:60, freqTime:0.08, gain:0.22, duration:0.07, gainDecay:0.12 }); }
function sfxDeath()   {
  [0,0.04,0.08,0.12,0.16].forEach((t,i)=>playTone({type:"square",freq:380-i*60,gain:0.2,duration:0.07,gainDecay:0.06,when:t}));
}
function sfxPowerup() {
  [0,0.06,0.12,0.18].forEach((t,i)=>playTone({type:"triangle",freq:400+i*120,gain:0.15,duration:0.08,gainDecay:0.04,when:t}));
}
function sfxWaveClear() {
  [0,0.07,0.14,0.21,0.28].forEach((t,i)=>playTone({type:"square",freq:300+i*80,gain:0.14,duration:0.1,gainDecay:0.05,when:t}));
}
function sfxBossDamage() { playTone({ type:"sawtooth", freq:100, freq2:40, freqTime:0.18, gain:0.28, duration:0.15, gainDecay:0.15 }); }
function sfxMissile() { playTone({ type:"sawtooth", freq:600, freq2:200, freqTime:0.1, gain:0.16, duration:0.08, gainDecay:0.08 }); }

// UFO siren oscillator (continuous while UFO alive)
let ufoOsc = null;
function startUfoSiren() {
  if (muted || reduceMotion || ufoOsc) return;
  try {
    const ac  = getAudioCtx();
    ufoOsc    = ac.createOscillator();
    const lfo = ac.createOscillator();
    const env = ac.createGain();
    const gain2 = ac.createGain();
    lfo.type = "sine"; lfo.frequency.value = 6;
    ufoOsc.type = "sine"; ufoOsc.frequency.value = 520;
    gain2.gain.value = perfLite ? 30 : 120; // Phase 5: cap siren oscillator depth in lite mode
    lfo.connect(gain2);
    gain2.connect(ufoOsc.frequency);
    ufoOsc.connect(env);
    env.connect(ac.destination);
    env.gain.value = 0.10;
    lfo.start(); ufoOsc.start();
  } catch {}
}
function stopUfoSiren() {
  if (!ufoOsc) return;
  try { ufoOsc.stop(); } catch {}
  ufoOsc = null;
}

// Invader march — 4-note pattern, tempo driven by remaining fleet
const MARCH_NOTES = [110, 92, 82, 73];
let marchPhase   = 0;
let marchTimer   = 0;
function tickMarch(dt, enemyCount, totalEnemies) {
  if (muted || reduceMotion) return;
  const ratio   = totalEnemies > 0 ? enemyCount / totalEnemies : 1;
  const interval= 0.08 + ratio * 0.42;   // fast when few remain
  marchTimer   -= dt;
  if (marchTimer <= 0) {
    marchTimer = interval;
    playTone({ type:"square", freq:MARCH_NOTES[marchPhase % 4], gain:0.14, duration:0.03, gainDecay:0.03 });
    marchPhase++;
  }
}

// ─── Sprites ──────────────────────────────────────────────────────────────
const ASSETS = { sheet: new Image(), ready: false, failed: false };
ASSETS.sheet.src = "assets/cold-war-invaders-atari-sheet.webp";
ASSETS.sheet.onload  = () => { ASSETS.ready = true; draw(); };
ASSETS.sheet.onerror = () => { ASSETS.failed = true; setToast("BITMAP ASSETS MISSING", 2); };

const SPRITES = {
  marquee:    [38,18,1450,238],
  player:     [48,318,185,130],
  satellite:  [292,322,240,132],
  radar:      [610,326,140,132],
  missile:    [848,332,92,146],
  sputnik:    [1005,330,132,154],
  boss:       [1164,326,324,166],
  intel:      [104,552,75,116],
  laserCyan:  [337,562,28,100],
  laserRed:   [448,562,29,101],
  laserGreen: [558,562,29,101],
  explosion1: [714,574,76,82],
  explosion2: [842,558,132,110],
  explosion3: [986,558,136,116],
  explosion4: [1144,572,112,102],
  wall:       [48,726,570,110],
  nuke:       [842,710,122,124],
  starTile:   [1052,724,426,128],
  earth:      [30,878,1460,118]
};

function drawSprite(name, x, y, w, h, options = {}) {
  const s = SPRITES[name];
  if (!ASSETS.ready || !s) return false;
  ctx.save();
  ctx.translate(x, y);
  if (options.rotate) ctx.rotate(options.rotate);
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
  ctx.globalCompositeOperation = options.blend || "lighter";
  ctx.drawImage(ASSETS.sheet, s[0], s[1], s[2], s[3], -w/2, -h/2, w, h);
  ctx.restore();
  return true;
}

// ─── Question bank ────────────────────────────────────────────────────────
const COLD_RE = /cold war|containment|korea|vietnam|soviet|communis|nuclear|berlin|cuban|nato|warsaw|iron curtain|truman doctrine|marshall plan|space race|détente|detente|proxy|arms race|brinkmanship|ussr|stalin|mao|castro|gorbachev|reagan/i;
const THEATER = {
  cold:   /cold war|containment|korea|vietnam|soviet|communis|nuclear|berlin|cuban|nato|warsaw|iron curtain|truman doctrine|marshall plan|space race|proxy|arms race|brinkmanship|ussr/i,
  us:     /U\.S\.|United States|AP U\.S\.|APUSH|Grade 8|Grade 11|NYS U\.S\./i,
  global: /Global|World|European|Grade 10|AP World|AP European|Human Rights|Decolonization/i,
  ap:     /^AP\b|AP |Advanced Placement/i,
  all:    /./
};

const FALLBACK = [
  ["The U.S. policy of stopping the spread of communism after World War II.","Containment",["Isolationism","Appeasement","Neutrality"],"Containment shaped U.S. actions in Europe, Asia, and Latin America."],
  ["The crisis in 1962 that brought the U.S. and Soviet Union close to nuclear war.","Cuban Missile Crisis",["Berlin Airlift","Korean War","Marshall Plan"],"The Cuban Missile Crisis was a direct nuclear confrontation over Soviet missiles in Cuba."],
  ["The alliance created by the U.S. and Western democracies in 1949.","NATO",["Warsaw Pact","United Nations","OPEC"],"NATO was the Western military alliance; the Warsaw Pact was the Soviet-led counterpart."],
  ["The economic aid program designed to rebuild Western Europe and limit communist appeal.","Marshall Plan",["New Deal","Great Society","Open Door Policy"],"The Marshall Plan used economic recovery as a Cold War strategy."],
  ["The symbolic barrier that divided communist East Berlin from democratic West Berlin.","Berlin Wall",["Iron Curtain","38th Parallel","Suez Canal"],"The Berlin Wall became a visible symbol of Cold War division."],
  ["Competition between the U.S. and USSR to develop rockets, satellites, and lunar achievements.","Space Race",["Arms Race","Red Scare","Domino Theory"],"The Space Race was a technological and propaganda contest."],
  ["The idea that if one nation fell to communism, nearby nations might follow.","Domino Theory",["Containment","Détente","Glasnost"],"Domino Theory influenced U.S. involvement in Vietnam."],
  ["A period of eased Cold War tensions in the 1970s.","Détente",["Brinkmanship","McCarthyism","Total war"],"Détente included diplomacy and arms-limitation talks."]
].map((row, i) => ({
  id: `fb-${i}`,
  prompt: row[0], answer: row[1],
  choices: [row[1],...row[2]].map((t, j) => ({ label: String.fromCharCode(65+j), text: t })),
  correct: "A", explanation: row[3],
  course: "Cold War Core", set: "Fallback Intel"
}));

// ─── Difficulty configs ────────────────────────────────────────────────────
const DIFF_PRESET = {
  cadet:          { speed: 0.72, fireRate: 1.45, accuracy: 0.15, lives: 5, shotTier: 1 },
  regents:        { speed: 1.00, fireRate: 1.00, accuracy: 0.35, lives: 3, shotTier: 1 },
  crisis:         { speed: 1.28, fireRate: 0.72, accuracy: 0.55, lives: 3, shotTier: 1 },
  "five-star":    { speed: 1.60, fireRate: 0.50, accuracy: 0.75, lives: 2, shotTier: 1 }
};

// Theater formation configs
const THEATER_FORMATION = {
  korea:   { rows: 4, cols: 8,  style: "dense",     tint: [255,100,100] },
  cuba:    { rows: 3, cols: 10, style: "curved",     tint: [255,60,60]  },
  berlin:  { rows: 5, cols: 7,  style: "wedge",      tint: [180,80,255] },
  vietnam: { rows: 3, cols: 6,  style: "dispersed",  tint: [60,255,140] },
  // defaults for non-specific theaters
  cold:    { rows: 4, cols: 8,  style: "rect",       tint: [114,243,255] },
  us:      { rows: 4, cols: 8,  style: "rect",       tint: [255,209,92] },
  global:  { rows: 4, cols: 8,  style: "rect",       tint: [114,243,255] },
  ap:      { rows: 5, cols: 9,  style: "rect",       tint: [184,146,255] },
  all:     { rows: 4, cols: 8,  style: "rect",       tint: [114,243,255] }
};

// ─── Persistent storage ────────────────────────────────────────────────────
const LS_KEY = "cwi_v2";
function loadPersist() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function savePersist(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...loadPersist(), ...data })); } catch {}
}

// ─── Shared state ─────────────────────────────────────────────────────────
const state = {
  dpr: 1, w: 1, h: 1,
  bank: [], pool: [], current: null,
  running: false, paused: false, briefing: false, locked: false, over: false,
  // scores
  score: 0, displayScore: 0,
  wave: 1, waveMission: 1, mission: 1,
  shield: 100,
  intel: 0,
  lives: 3,
  correct: 0, answered: 0, streak: 0,
  kills: 0, totalKills: 0, shotsFired: 0,
  combo: 0, comboTimer: 0,
  // settings
  theater: "cold", difficulty: "regents", shotTier: 1,
  // player
  player: { x:0, y:0, vx:0, cooldown:0, invuln:0, shotCount:1 },
  touch:  { left:false, right:false, fire:false },
  // game objects
  bullets:     [],
  enemyShots:  [],
  enemies:     [],
  particles:   [],
  stars:       [],
  shields:     [],
  powerUps:    [],
  ufo:         null,
  boss:        null,
  scorePopups: [],
  // fleet march
  marchDir:    1,
  marchX:      0,          // accumulated march offset from start
  marchStep:   0,          // time accumulator for step cadence
  marchStepInterval: 0.5,  // seconds between steps
  marchDropPending: false,
  totalEnemiesSpawned: 0,
  // active effects
  activePowerUps: { tripleShot: 0, rapidFire: 0, slowFleet: 0 },
  // wave timing
  nextWave: 0,
  waveComplete: false,
  waveCompleteTimer: 0,
  pendingBriefing: false,
  // boss
  bossPhase: 0,
  // misc
  shake: 0, flash: 0,
  toast: "LOADING INTEL BANK", toastTime: 1.5,
  safeTime: 0,
  ufoTimer: 0,
  last: 0,
  missionStats: { kills:0, shotsFired:0, shotsHit:0, intelEarned:0, shieldDmg:0 },
  // profile tracking
  bunkersRebuilt: 0,
  firstCorrectFired: false
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function esc(v) {
  return String(v ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function frameEase(rate, dt) { return 1 - Math.exp(-rate * dt); }
function rnd(lo, hi) { return lo + Math.random()*(hi-lo); }

function playerBottomInset() {
  return mobileCtrl.matches ? Math.min(220, Math.max(160, state.h * 0.28)) : 90;
}

// ─── Resize + stars ────────────────────────────────────────────────────────
function resize() {
  state.dpr = Math.min(devicePixelRatio || 1, perfLite ? 1.25 : 2);
  state.w   = innerWidth;
  state.h   = innerHeight;
  els.canvas.width  = Math.max(1, Math.floor(state.w * state.dpr));
  els.canvas.height = Math.max(1, Math.floor(state.h * state.dpr));
  els.canvas.style.width  = `${state.w}px`;
  els.canvas.style.height = `${state.h}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  state.player.y = state.h - playerBottomInset();
  if (!state.player.x) state.player.x = state.w / 2;
  buildStars();
  if (state.running) buildShields();
}

function buildStars() {
  const count = Math.min(perfLite ? 90 : 190, Math.floor(state.w * state.h / (perfLite ? 8500 : 5500)));
  state.stars = Array.from({ length: count }, (_,i) => ({
    x: Math.random() * state.w,
    y: Math.random() * state.h,
    r: 1 + Math.random() * 1.8,
    speed: 8 + Math.random() * 34,
    twinkle: Math.random() * 9,
    color: i%7===0 ? "#ffd15c" : i%5===0 ? "#72f3ff" : "#f8fbff"
  }));
}

function setToast(text, secs = 1.2) {
  state.toast = text; state.toastTime = secs;
}

// ─── Question helpers ──────────────────────────────────────────────────────
function clean(t) { return String(t||"").replace(/\s+/g," ").trim(); }
function stimulusImagesFor(q) {
  if (SourceBank) return SourceBank.stimulusImages(q);
  const list = Array.isArray(q?.stimulusImages) ? q.stimulusImages : [];
  return list.length ? list.filter(i=>i&&i.src) : (q?.stimulusImage ? [{src:q.stimulusImage,label:"Source stimulus"}] : []);
}
function stimulusTextFor(q) {
  if (!q) return "";
  if (typeof q.stimulusText==="string") return clean(q.stimulusText);
  if (typeof q.stimulus==="string")     return clean(q.stimulus);
  if (typeof q.stimulusHtml==="string") {
    const d=document.createElement("div"); d.innerHTML=q.stimulusHtml; return clean(d.textContent||"");
  }
  return "";
}
function hasRenderableSource(q) { return Boolean(stimulusTextFor(q)||stimulusImagesFor(q).length); }
function sourceBasedQuestion(q) {
  if (SourceBank) return SourceBank.sourceBased(q);
  return Boolean(q?.stimulusRequired||stimulusImagesFor(q).length||/\b(this|these)\s+(source|document|documents|map|cartoon|chart|graph|excerpt|passage|image|photograph|photo|poster|headline|speech)\b|shown|pictured|according to|based on/i.test(q?.prompt||q?.stem||""));
}
function displayPrompt(q)      { return clean((SourceBank&&SourceBank.displayPrompt(q))||q?.stem||q?.prompt||""); }
function displaySourceLabel(q) { return clean((SourceBank&&SourceBank.displaySource(q))||q?.source||q?.set||q?.day||"Source"); }
function resolveSrc(src) {
  const v=String(src||"").trim();
  if (!v) return "";
  if (/^(https?:|data:|blob:)/i.test(v)) return v;
  if (v.startsWith("../../")||v.startsWith("../")) return v;
  if (v.startsWith("assets/")) return `../../${v}`;
  return v;
}
function isPlayableQuestion(q) {
  if (!q||!(q.answer||q.choices)||!(q.prompt||q.stem)) return false;
  if (SourceBank&&!SourceBank.playableSharedPrompt(q)) return false;
  if (sourceBasedQuestion(q)) {
    if (!hasRenderableSource(q)) return false;
    // Bug fix: removed q.type==="mcq" guard — quarantined/untrusted source-based
    // questions of any type must be blocked from the pool, not just MCQ-typed ones.
    if (SourceBank&&!SourceBank.usableRegentsQuestion(q)) return false;
  }
  return true;
}
function normalizeQuestion(q) {
  if (!q) return null;
  // Bug fix: use sourceLock() trust pipeline instead of stimulusImagesFor() directly.
  // stimulusImagesFor() returns raw images without quarantine/course-path/trust checks,
  // causing quarantined or mismatched documents to appear as stimulus mid-game.
  // sourceLock() returns images:[] when ok===false, guaranteeing only verified images reach the UI.
  const lock        = SourceBank ? SourceBank.sourceLock(q)
                    : { ok: stimulusImagesFor(q).length > 0, images: stimulusImagesFor(q) };
  const rawImages   = lock.ok ? lock.images : [];
  const sourceImages = rawImages.map(im=>({src:resolveSrc(im.src),label:clean((SourceBank&&SourceBank.displayStimulusLabel(q,im))||im.label||"Source stimulus")})).filter(im=>im.src);
  const sourceText   = stimulusTextFor(q);
  const sourceLabel  = displaySourceLabel(q);
  const sourceBased  = sourceBasedQuestion(q);
  // If source-based but lock failed (quarantined / untrusted), drop the question entirely.
  if (sourceBased&&!lock.ok) return null;
  if (sourceBased&&!sourceImages.length&&!sourceText) return null;
  if (Array.isArray(q.choices)&&q.choices.length>=4) {
    const choices = q.choices.slice(0,4).map(c=>({text:clean(c.text),correct:String(c.label)===String(q.correct)}));
    const answer  = choices.find(c=>c.correct)?.text||q.answer;
    if (!answer||choices.some(c=>!c.text)) return null;
    return { prompt:displayPrompt(q), choices:shuffle(choices), answer, explanation:clean(q.explanation)||`Correct: ${answer}.`, course:q.course||"Cold War Review", set:q.set||q.day||q.category||"Review", sourceBased, sourceImages, sourceText, sourceLabel };
  }
  if (!q.prompt||!q.answer) return null;
  const sameCourse = state.bank.filter(b=>b.answer&&b.answer!==q.answer&&b.course===q.course).map(b=>clean(b.answer));
  const fallback   = state.bank.filter(b=>b.answer&&b.answer!==q.answer).map(b=>clean(b.answer));
  const distractors= [...new Map(shuffle(sameCourse.concat(fallback)).filter(Boolean).map(t=>[t.toLowerCase(),t])).values()].slice(0,3);
  if (distractors.length<3) return null;
  return { prompt:displayPrompt(q), choices:shuffle([q.answer,...distractors].map(t=>({text:clean(t),correct:t===q.answer}))), answer:clean(q.answer), explanation:clean(q.explanation)||`Correct: ${clean(q.answer)}.`, course:q.course||"Cold War Review", set:q.set||q.day||q.category||"Review", sourceBased, sourceImages, sourceText, sourceLabel };
}
function questionText(q) { return [q.course,q.set,q.prompt,q.answer,q.explanation,...(q.tags||[])].join(" "); }

async function loadBank() {
  try {
    const r    = await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
    const data = await r.json();
    const raw  = (data.questions||[]).filter(isPlayableQuestion);
    const cold = raw.filter(q=>COLD_RE.test(questionText(q)));
    state.bank = cold.length>=40 ? cold : raw.filter(q=>/Cold War|Foreign Policy|Global Conflict|Modern Era|APUSH|AP World|AP European|Grade 8|Grade 10|Grade 11/i.test(questionText(q)));
  } catch { state.bank = FALLBACK; }
  if (!state.bank.length) state.bank = FALLBACK;
  renderMetrics();
  setToast(`${state.bank.length} INTEL PROMPTS`, 1.4);
}

function filteredBank() {
  const re = THEATER[state.theater]||THEATER.cold;
  const f  = state.bank.filter(q=>re.test(questionText(q)));
  return f.length>=8 ? f : state.bank;
}

function nextQuestion() {
  if (!state.pool.length) state.pool = shuffle(filteredBank());
  let nq = null;
  while (!nq&&state.pool.length) nq = normalizeQuestion(state.pool.pop());
  return nq || normalizeQuestion(FALLBACK[Math.floor(Math.random()*FALLBACK.length)]);
}

function renderMetrics() {
  const bank    = filteredBank();
  const courses = new Set(bank.map(q=>q.course).filter(Boolean)).size;
  const persist = loadPersist();
  const hi      = persist[`hi_${state.theater}`] || 0;
  els.metrics.innerHTML = [
    [bank.length, "intel prompts"],
    [courses,     "course lanes"],
    [hi ? Math.round(hi).toLocaleString() : "—", "high score"],
    ["E", "burst key"]
  ].map(([big,label])=>`<div class="metric"><strong>${esc(big)}</strong><span>${esc(label)}</span></div>`).join("");
}

// ─── Difficulty tuning ─────────────────────────────────────────────────────
function tune() {
  const base = DIFF_PRESET[state.difficulty] || DIFF_PRESET.regents;
  if (!mobileCtrl.matches) return base;
  return { ...base, speed: base.speed*0.82, fireRate: base.fireRate*1.36, accuracy: base.accuracy*0.6 };
}

// ─── Destructible Shields ─────────────────────────────────────────────────
const SHIELD_W   = 48;
const SHIELD_H   = 36;
const CELL_SIZE  = 6;
const SHIELD_CW  = Math.ceil(SHIELD_W / CELL_SIZE);  // 8
const SHIELD_CH  = Math.ceil(SHIELD_H / CELL_SIZE);  // 6

function buildShields() {
  state.shields = [];
  const count = mobileCtrl.matches ? 3 : 4;
  const baseY = state.h - playerBottomInset() - 68;
  for (let i = 0; i < count; i++) {
    const cx = state.w * (i+1) / (count+1);
    const cells = [];
    for (let r = 0; r < SHIELD_CH; r++) {
      for (let c = 0; c < SHIELD_CW; c++) {
        // carve classic bunker arch cutout from bottom-center
        const isBottomCenter = r >= SHIELD_CH-2 && c >= SHIELD_CW*0.3 && c < SHIELD_CW*0.7;
        cells.push({ alive: !isBottomCenter, r, c });
      }
    }
    state.shields.push({ cx, cy: baseY, cells, w: SHIELD_W, h: SHIELD_H });
  }
}

function erodeShield(sx, sy) {
  const ERODE_R = CELL_SIZE * 2.2;
  for (const sh of state.shields) {
    for (const cell of sh.cells) {
      if (!cell.alive) continue;
      const px = sh.cx - sh.w/2 + (cell.c + 0.5)*CELL_SIZE;
      const py = sh.cy - sh.h/2 + (cell.r + 0.5)*CELL_SIZE;
      if (Math.hypot(px-sx, py-sy) < ERODE_R) cell.alive = false;
    }
  }
}

function hitShield(bx, by) {
  const BR = CELL_SIZE * 0.8;
  for (const sh of state.shields) {
    for (const cell of sh.cells) {
      if (!cell.alive) continue;
      const px = sh.cx - sh.w/2 + (cell.c + 0.5)*CELL_SIZE;
      const py = sh.cy - sh.h/2 + (cell.r + 0.5)*CELL_SIZE;
      if (Math.abs(bx-px)<CELL_SIZE+BR && Math.abs(by-py)<CELL_SIZE+BR) {
        erodeShield(px, py);
        return true;
      }
    }
  }
  return false;
}

function rebuildShieldsPartial() {
  for (const sh of state.shields) {
    for (const cell of sh.cells) {
      // restore outer 60% of destroyed cells
      const isBottomCenter = cell.r >= SHIELD_CH-2 && cell.c >= SHIELD_CW*0.3 && cell.c < SHIELD_CW*0.7;
      if (!isBottomCenter && !cell.alive && Math.random() < 0.6) cell.alive = true;
    }
  }
  state.bunkersRebuilt++;
}

function drawShields() {
  // Determine cell health per shield (density of alive cells)
  for (const sh of state.shields) {
    const aliveCount = sh.cells.filter(c=>c.alive).length;
    const healthRatio = aliveCount / sh.cells.length;
    // Color shifts: full=cream-green, damaged=amber, critical=red
    const r  = healthRatio > 0.6 ? Math.round(93 + (1-healthRatio)*162)
              : healthRatio > 0.3 ? Math.round(200 + (0.6-healthRatio)*55)
              : 200;
    const g  = healthRatio > 0.6 ? Math.round(196 * healthRatio + 130*(1-healthRatio))
              : healthRatio > 0.3 ? Math.round(130 * healthRatio)
              : 37;
    const b  = healthRatio > 0.6 ? Math.round(138 * healthRatio)
              : 37;
    const cellColor = `rgb(${r},${g},${b})`;

    for (const cell of sh.cells) {
      if (!cell.alive) continue;
      const px = sh.cx - sh.w/2 + cell.c * CELL_SIZE;
      const py = sh.cy - sh.h/2 + cell.r * CELL_SIZE;
      ctx.fillStyle   = cellColor;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(Math.floor(px), Math.floor(py), CELL_SIZE-1, CELL_SIZE-1);
      // Interior shadow (top edge)
      ctx.fillStyle   = "rgba(0,0,0,.28)";
      ctx.fillRect(Math.floor(px), Math.floor(py), CELL_SIZE-1, 1);
      ctx.globalAlpha = 1;
    }
  }
}

// ─── Power-ups ────────────────────────────────────────────────────────────
const POWERUP_TYPES  = ["tripleShot","rapidFire","shieldBoost","slowFleet","bomb"];
const POWERUP_LABELS = { tripleShot:"TRIPLE SHOT", rapidFire:"RAPID FIRE", shieldBoost:"SHIELD +1", slowFleet:"SLOW FLEET", bomb:"BOMB" };
const POWERUP_COLORS = { tripleShot:"#ffd15c", rapidFire:"#72f3ff", shieldBoost:"#6df2a8", slowFleet:"#b892ff", bomb:"#ff5f7d" };

function spawnPowerup(x, y, type) {
  if (!type) type = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
  state.powerUps.push({ x, y, vy: 80, type, life: 7.0, pulse: Math.random()*Math.PI*2 });
}

function applyPowerup(type) {
  sfxPowerup();
  switch (type) {
    case "tripleShot":  state.activePowerUps.tripleShot  = 5; setToast("TRIPLE SHOT ARMED", 1.2); break;
    case "rapidFire":   state.activePowerUps.rapidFire   = 5; setToast("RAPID FIRE", 1.2); break;
    case "shieldBoost": state.shield = Math.min(100, state.shield+15); setToast("SHIELD RESTORED", 1.2); break;
    case "slowFleet":   state.activePowerUps.slowFleet   = 3; setToast("FLEET SLOWED", 1.2); break;
    case "bomb":
      // destroy bottom row of enemies
      const maxRow = Math.max(...state.enemies.map(e=>e.row), 0);
      const toKill = state.enemies.filter(e=>e.row===maxRow);
      toKill.forEach(e=>{ e.dead=true; state.kills++; state.score+=80; explode(e.x,e.y,"#ff5f7d",12); });
      state.enemies = state.enemies.filter(e=>!e.dead);
      setToast("BOMB — BOTTOM ROW CLEARED", 1.4);
      break;
  }
  updateHud();
}

// ─── UFO / Mystery Ship ────────────────────────────────────────────────────
function spawnUfo() {
  const dir    = Math.random() < 0.5 ? 1 : -1;
  const startX = dir > 0 ? -80 : state.w + 80;
  state.ufo    = { x: startX, y: mobileCtrl.matches ? 90 : 70, vx: dir*180, hp: 2, scored: false, timer: 0 };
  startUfoSiren();
}

function updateUfo(dt) {
  if (!state.ufo) {
    state.ufoTimer -= dt;
    if (state.ufoTimer <= 0) {
      state.ufoTimer = rnd(12, 25);
      if (state.running && !state.briefing && !state.paused) spawnUfo();
    }
    return;
  }
  const u = state.ufo;
  u.x    += u.vx * dt;
  u.timer += dt;
  if (u.x < -120 || u.x > state.w + 120) {
    state.ufo = null; stopUfoSiren(); return;
  }
  // check player bullets
  for (const b of state.bullets) {
    if (Math.abs(b.x-u.x)<38 && Math.abs(b.y-u.y)<22) {
      b.dead = true;
      u.hp--;
      explode(u.x, u.y, "#ffd15c", 10);
      if (u.hp <= 0) {
        const pts = [100,300,500][Math.floor(Math.random()*3)];
        state.score += pts;
        spawnScorePopup(u.x, u.y, `+${pts}`);
        // chance to drop power-up
        if (Math.random() < 0.45) spawnPowerup(u.x, u.y+20);
        state.ufo = null; stopUfoSiren();
        sfxWaveClear();
        state.missionStats.shotsHit++;
        window.MrMacsProfile?.addShards(25, "cold-war-invaders");
        return;
      }
    }
  }
}

// ─── Score popups ──────────────────────────────────────────────────────────
function spawnScorePopup(x, y, text, color="#ffd15c") {
  state.scorePopups.push({ x, y, vy:-70, text, color, life:1.2, max:1.2 });
}

// ─── Wave / Formation ─────────────────────────────────────────────────────
const WAVES_PER_MISSION = 5;
const BOSS_TITLES = ["BERLIN BLOCKADE","CUBAN MISSILE CRISIS","VIETNAM ESCALATION","ARMS RACE SUMMIT"];
const BOSS_LABELS = ["Berlin","Cuba","Vietnam","Arms Race"];

function spawnWave() {
  const t = tune();
  const theaterCfg = THEATER_FORMATION[state.theater] || THEATER_FORMATION.cold;
  const waveMod    = state.waveMission;  // 1-5 within mission

  // Scale formation with wave progression
  let rows = Math.min(theaterCfg.rows, 2 + waveMod);
  let cols = Math.min(theaterCfg.cols, 5 + waveMod);

  // Special formations per theater style
  const style = theaterCfg.style;
  const gapX  = Math.min(70, Math.max(44, (state.w - 80) / cols));
  const startY = mobileCtrl.matches ? 136 : 118;

  state.enemies = [];
  const labels  = shuffle(filteredBank()).slice(0, rows*cols).map(q=>clean(q.answer||q.prompt).slice(0,18));

  for (let row = 0; row < rows; row++) {
    let offsetX = 0;
    if (style === "wedge")    offsetX = row * 18;
    if (style === "curved")   offsetX = Math.sin((row/rows)*Math.PI)*24;
    if (style === "dispersed") offsetX = (Math.random()-0.5)*60;

    // dispersed: skip some slots
    const colList = [];
    for (let c = 0; c < cols; c++) {
      if (style === "dispersed" && Math.random() < 0.22) continue;
      colList.push(c);
    }

    colList.forEach((col, ci) => {
      const kind = ["satellite","missile","drone","sputnik","radar"][(row+col+state.wave)%5];
      const elite = (row === 0 && state.waveMission >= 3); // top row = elite in later waves
      state.enemies.push({
        x: state.w/2 - (cols-1)*gapX/2 + col*gapX + offsetX,
        y: startY + row * 52,
        baseX: state.w/2 - (cols-1)*gapX/2 + col*gapX + offsetX,
        row, col,
        w: 38, h: 28,
        hp: elite ? 2 : 1,
        kind, elite,
        label: labels[row*cols+col] || "Cold War",
        phase: Math.random()*7,
        tint: theaterCfg.tint
      });
    });
  }

  // Ragged-row extras for higher waves
  if (state.wave > 3 && style !== "dispersed") {
    const extraCount = Math.min(4, state.waveMission);
    for (let i = 0; i < extraCount; i++) {
      const kind = ["satellite","missile","sputnik"][i%3];
      state.enemies.push({
        x: rnd(80, state.w-80),
        y: startY - 40 - i*30,
        baseX: state.w/2,
        row: -1, col: i,
        w: 38, h: 28,
        hp: 1, kind, elite: false,
        label: "Cold War",
        phase: Math.random()*7,
        tint: theaterCfg.tint
      });
    }
  }

  state.totalEnemiesSpawned = state.enemies.length;
  state.marchDir   = 1;
  state.marchX     = 0;
  state.marchStep  = 0;
  state.marchDropPending = false;
  // March speed: base 0.62s, gets faster with fewer enemies; enemy speed tuned
  state.marchStepInterval = 0.62;

  // Enemy fire rate
  const isMobile = mobileCtrl.matches;
  state.enemyFire = Math.max(0.3, (1.5 - state.wave*0.045) * t.fireRate * (isMobile?1.55:1));

  // UFO timer reset
  state.ufoTimer = rnd(14, 28);

  setToast(`WAVE ${state.wave} — DEFEND THE LINE`, 1.4);
  state.waveComplete = false;
  state.waveCompleteTimer = 0;
}

function spawnBoss() {
  const bossIndex = (state.mission - 1) % BOSS_TITLES.length;
  state.boss = {
    x: state.w / 2,
    y: mobileCtrl.matches ? 100 : 80,
    w: Math.min(400, state.w * 0.62),
    h: 78,
    hp: 12 + state.mission * 4,
    max: 12 + state.mission * 4,
    phase: 0,
    title: BOSS_TITLES[bossIndex],
    label: BOSS_LABELS[bossIndex],
    fireTimer: 0.8,
    moveSin: 0
  };
  state.bossPhase = 0;
  setToast(`${state.boss.title} — BOSS ENCOUNTER`, 1.8);
  sfxBossDamage();
}

// ─── Enemy march ──────────────────────────────────────────────────────────
// Classic Space Invaders: step-march left/right, drop one row at edge
function updateMarch(dt) {
  if (!state.enemies.length) return;

  const t     = tune();
  const slow  = state.activePowerUps.slowFleet > 0 ? 0.35 : 1;
  const count = state.enemies.length;
  const total = Math.max(1, state.totalEnemiesSpawned);
  // Speed up as fleet thins: interval shortens dramatically
  const ratio          = count / total;
  const baseInterval   = Math.max(0.06, state.marchStepInterval * ratio);
  const interval       = baseInterval / t.speed * slow;

  // Tick march step
  state.marchStep += dt;
  if (state.marchStep < interval) return;
  state.marchStep -= interval;

  // One step
  const stepSize = 8 * t.speed * slow;
  const leftEdge  = Math.min(...state.enemies.map(e=>e.x)) - stepSize;
  const rightEdge = Math.max(...state.enemies.map(e=>e.x)) + stepSize;

  // Check if would hit wall
  if (state.marchDropPending || (state.marchDir > 0 && rightEdge > state.w-30) || (state.marchDir < 0 && leftEdge < 30)) {
    // Drop row
    state.enemies.forEach(e => e.y += 20);
    state.marchDir *= -1;
    state.marchDropPending = false;
    tickMarch(0, count, total); // audible step
  } else {
    state.enemies.forEach(e => e.x += state.marchDir * stepSize);
    tickMarch(0, count, total);
  }

  // Check if enemies have reached player zone
  const danger = state.player.y - 180;
  if (state.enemies.some(e=>e.y > danger)) {
    // Accelerate march
    state.marchStepInterval = Math.max(0.08, state.marchStepInterval * 0.97);
  }
}

// ─── Enemy shooting ───────────────────────────────────────────────────────
function enemyShoot() {
  const t = tune();
  // Candidates = bottom enemy per column
  const colMap = new Map();
  for (const e of state.enemies) {
    if (!colMap.has(e.col) || colMap.get(e.col).y < e.y) colMap.set(e.col, e);
  }
  const candidates = [...colMap.values()];
  if (!candidates.length) return;

  // Targeted shot: some bullets aimed at player
  const aimed = Math.random() < t.accuracy;
  const shooter = candidates[Math.floor(Math.random()*candidates.length)];
  const tx = aimed ? state.player.x + rnd(-40, 40) : shooter.x + rnd(-20, 20);
  const ty = aimed ? state.player.y : state.h + 50;
  const dx = tx - shooter.x;
  const dy = ty - shooter.y;
  const len = Math.hypot(dx, dy) || 1;
  const spd = (mobileCtrl.matches ? 140 : 200) + state.wave * (mobileCtrl.matches ? 6 : 10);

  const isElite  = shooter.elite && Math.random() < 0.4;
  const isMissile= shooter.kind === "missile" && Math.random() < 0.3;

  state.enemyShots.push({
    x: shooter.x, y: shooter.y + 20,
    vx: (dx/len) * spd,
    vy: Math.max((dy/len)*spd, spd*0.5),
    r: isMissile ? 5 : 4,
    color: isMissile ? "#ff5f7d" : isElite ? "#b892ff" : "#ffd15c",
    missile: isMissile || isElite
  });
  if (isMissile) sfxMissile();
}

function updateBoss(dt) {
  if (!state.boss) return;
  const b = state.boss;
  b.moveSin += dt;
  b.x = state.w/2 + Math.sin(b.moveSin * 0.8) * Math.min(180, state.w*0.2);

  // Phase changes
  const hpRatio = b.hp / b.max;
  const newPhase = hpRatio < 0.33 ? 2 : hpRatio < 0.66 ? 1 : 0;
  if (newPhase > b.phase) {
    b.phase = newPhase;
    setToast("BOSS PHASE CHANGE", 1.0);
    state.shake = Math.max(state.shake, 0.8);
    sfxBossDamage();
  }

  // Boss fires more per phase
  b.fireTimer -= dt;
  if (b.fireTimer <= 0) {
    const count = 1 + b.phase;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI/2 + rnd(-0.3,0.3) + (i - count/2)*0.28;
      const spd   = 180 + b.phase*60;
      state.enemyShots.push({
        x: b.x + rnd(-30,30), y: b.y + b.h/2,
        vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
        r: 5, color: "#ff5f7d", missile: true
      });
    }
    b.fireTimer = Math.max(0.35, 1.0 - b.phase*0.28);
    if (b.phase > 0) sfxMissile();
  }
}

// ─── Player fire ──────────────────────────────────────────────────────────
function fire() {
  if (state.briefing || state.paused) return;
  const rapid  = state.activePowerUps.rapidFire > 0;
  const minCD  = rapid ? 0.07 : (mobileCtrl.matches ? 0.12 : 0.16);
  if (state.player.cooldown > 0) return;

  const triple = state.activePowerUps.tripleShot > 0;
  const tier   = state.player.shotCount;
  const count  = triple ? 3 : (tier >= 3 ? 3 : tier >= 2 ? 2 : 1);

  for (let i = 0; i < count; i++) {
    const spread = (i - (count-1)/2) * 14;
    state.bullets.push({ x: state.player.x+spread, y: state.player.y-28, vx: spread*2, vy:-820, r:4, color:"#72f3ff" });
  }
  state.player.cooldown = minCD;
  state.missionStats.shotsFired++;
  state.shotsFired++;
  sfxShot();
}

// ─── Collision ────────────────────────────────────────────────────────────
function collide() {
  // Player bullets vs enemies
  for (const b of state.bullets) {
    for (const e of state.enemies) {
      if (Math.abs(b.x-e.x)<e.w*0.58 && Math.abs(b.y-e.y)<e.h*0.78) {
        b.dead = true;
        e.hp--;
        state.missionStats.shotsHit++;
        if (e.hp <= 0) {
          e.dead = true;
          state.kills++; state.missionStats.kills++; state.totalKills++;
          const pts = (100 + state.wave*12 + (e.elite ? 80 : 0)) * (1 + state.combo * 0.1);
          state.score += pts;
          state.combo++;
          state.comboTimer = 2.5;
          spawnScorePopup(e.x, e.y-18, `+${Math.round(pts)}`);
          explode(e.x, e.y, e.kind==="missile" ? "#ff5f7d" : "#72f3ff", 16);
          sfxHit();
          // small intel
          state.intel = Math.min(100, state.intel + 4.5);
          // chance to drop power-up (low)
          if (Math.random() < 0.04) spawnPowerup(e.x, e.y);
          window.MrMacsProfile?.addShards(2, "cold-war-invaders");
        } else {
          explode(e.x, e.y, "#ffd15c", 6);
        }
      }
    }
    // vs boss
    if (state.boss && Math.abs(b.x-state.boss.x)<state.boss.w/2 && Math.abs(b.y-state.boss.y)<state.boss.h/2+10) {
      b.dead = true;
      state.boss.hp--;
      state.missionStats.shotsHit++;
      state.score += 40;
      state.shake = Math.max(state.shake, 0.2);
      explode(b.x, b.y, "#ffd15c", 8);
      sfxBossDamage();
      if (state.boss.hp <= 0) {
        state.score += 3500;
        spawnScorePopup(state.boss.x, state.boss.y-30, "+3500 BOSS!", "#ffd15c");
        setToast(`${state.boss.title} DEFUSED`, 1.6);
        explode(state.boss.x, state.boss.y, "#ffd15c", 48);
        state.boss = null;
        sfxWaveClear();
        state.shake = Math.max(state.shake, 1.2);
        state.flash = 0.35;
        window.MrMacsProfile?.addShards(300, "cold-war-invaders");
        window.MrMacsProfile?.unlock("cwi-mission-clear");
        if (state.bunkersRebuilt === 0) window.MrMacsProfile?.unlock("cwi-no-shield");
      }
    }
    // vs shield
    if (!b.dead && hitShield(b.x, b.y)) { b.dead = true; }
  }
  state.bullets  = state.bullets.filter(b=>!b.dead);
  state.enemies  = state.enemies.filter(e=>!e.dead);

  // Enemy shots vs player
  for (const s of state.enemyShots) {
    if (state.player.invuln > 0) continue;
    if (Math.abs(s.x-state.player.x)<30 && Math.abs(s.y-state.player.y)<26) {
      s.dead = true;
      state.player.invuln = 1.4;
      state.shield = Math.max(0, state.shield - 8 * tune().accuracy);
      state.missionStats.shieldDmg += 8;
      state.shake  = Math.max(state.shake, 0.48);
      state.combo  = 0;
      explode(state.player.x, state.player.y, "#ff5f7d", 20);
      sfxDeath();
      if (state.shield <= 0) {
        state.lives--;
        if (state.lives > 0) {
          state.shield = 30;
          state.player.invuln = 3.0;
          setToast(`SHIP LOST — ${state.lives} REMAINING`, 1.6);
          state.flash = 0.4;
        } else {
          finish(false);
        }
      }
      // trigger question if intel near full
      if (state.intel >= 60 && !state.briefing) openBriefing("Emergency Intel Query");
    }
  }
  state.enemyShots = state.enemyShots.filter(s=>!s.dead);

  // Enemy shots vs shields
  for (const s of state.enemyShots) {
    if (hitShield(s.x, s.y)) s.dead = true;
  }
  state.enemyShots = state.enemyShots.filter(s=>!s.dead);

  // Power-up collection
  for (const pu of state.powerUps) {
    if (Math.abs(pu.x-state.player.x)<28 && Math.abs(pu.y-state.player.y)<28) {
      pu.dead = true;
      applyPowerup(pu.type);
      window.MrMacsProfile?.addShards(20, "cold-war-invaders");
    }
  }
  state.powerUps = state.powerUps.filter(p=>!p.dead);
}

// ─── Briefing / Questions ─────────────────────────────────────────────────
function renderQuestionSource(q) {
  if (!els.questionSource) return;
  // Bug fix: reset all img src attributes before rebuilding to prevent state leak where
  // a previous question's image lingers if the browser has already decoded it into memory.
  els.questionSource.querySelectorAll("img").forEach(img => { img.removeAttribute("src"); img.src = ""; });
  els.questionSource.innerHTML = "";
  const images = q?.sourceImages||[];
  const text   = q?.sourceText||"";
  if (!images.length&&!text) { els.questionSource.classList.add("hidden"); return; }
  const heading   = q.sourceBased ? "Intel source" : "Reference";
  const imageHtml = images.slice(0,2).map((img,i)=>`<a class="intel-source-thumb" href="${esc(img.src)}" target="_blank" rel="noopener"><img src="${esc(img.src)}" alt="${esc(img.label||`Source ${i+1}`)}"><span>${esc(img.label||`Source ${i+1}`)}</span></a>`).join("");
  const textHtml  = text ? `<p>${esc(text)}</p>` : "";
  els.questionSource.innerHTML = `<div class="intel-source-head"><strong>${esc(heading)}</strong><span>${esc(q.sourceLabel||"Matched source")}</span></div>${textHtml}${imageHtml?`<div class="intel-source-grid">${imageHtml}</div>`:""}`;
  els.questionSource.classList.remove("hidden");
}

function openBriefing(reason="Containment Burst Armed") {
  if (!state.running || state.briefing || state.over) return;
  state.current = nextQuestion();
  if (!state.current) return;
  state.briefing = true;
  state.locked   = false;
  // Pause enemy fire while briefing is open
  els.questionReward.textContent = reason;
  els.questionMeta.textContent   = [state.current.course, state.current.set].filter(Boolean).join(" / ");
  els.questionPrompt.textContent = state.current.prompt;
  renderQuestionSource(state.current);
  els.feedback.className   = "feedback";
  els.feedback.textContent = "Answer correctly for a power-up. Wrong = fleet speed +10%.";
  els.choices.innerHTML    = state.current.choices.map((c,i)=>`<button class="choice" type="button" data-index="${i}"><b>${String.fromCharCode(65+i)}.</b>${esc(c.text)}</button>`).join("");
  els.choices.querySelectorAll(".choice").forEach(btn=>{
    btn.addEventListener("click",()=>gradeAnswer(Number(btn.dataset.index)));
  });
  hideBriefingStamp();
  startTimeRing(18);
  els.briefing.classList.remove("hidden");
  try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck(0.3, 300); } catch (e) {}
}

function showBriefingStamp(correct) {
  const stampEl = document.getElementById("briefingStamp");
  const textEl  = document.getElementById("stampText");
  if (!stampEl || !textEl) return;
  textEl.textContent = correct ? "Intel Acquired" : "Mission Failed";
  textEl.className   = "stamp-text " + (correct ? "correct" : "wrong");
  stampEl.classList.add("show");
  stampEl.removeAttribute("aria-hidden");
}

function hideBriefingStamp() {
  const stampEl = document.getElementById("briefingStamp");
  if (!stampEl) return;
  stampEl.classList.remove("show");
  stampEl.setAttribute("aria-hidden","true");
}

// Start a time-drain animation on the fill bar
let _briefingTimerRaf = null;
function startTimeRing(duration) {
  const fill = document.getElementById("timeRingFill");
  if (!fill) return;
  fill.style.transition = "none";
  fill.style.width      = "100%";
  // force reflow
  fill.getBoundingClientRect();
  fill.style.transition = `width ${duration}s linear`;
  fill.style.width      = "0%";
}
function resetTimeRing() {
  const fill = document.getElementById("timeRingFill");
  if (!fill) return;
  fill.style.transition = "none";
  fill.style.width      = "100%";
}

function gradeAnswer(index) {
  if (state.locked || !state.current) return;
  state.locked   = true;
  const choice   = state.current.choices[index];
  const correct  = Boolean(choice?.correct);
  state.answered++;

  // Phase 1 — recordAnswer hook
  if (window.MrMacsProfile) {
    try {
      window.MrMacsProfile.recordAnswer({
        course:  state.current.course || "Cold War Review",
        set:     state.current.set    || "Cold War",
        correct: correct,
        prompt:  state.current.prompt,
        answer:  state.current.answer,
        gameId:  "cold-war-invaders"
      });
    } catch (e) {}
  }

  if (correct) {
    state.correct++;
    state.streak++;
    state.intel = Math.max(0, state.intel - 88);
    state.score += 900 + state.streak * 120;
    state.missionStats.intelEarned++;
    // Power-up reward
    const puType = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
    setTimeout(()=>applyPowerup(puType), 100);
    els.feedback.className  = "feedback good";
    els.feedback.innerHTML  = `<strong>Intel acquired — power-up incoming.</strong> ${esc(state.current.explanation)}`;
    sfxPowerup();
    window.MrMacsProfile?.addShards(15, "cold-war-invaders");
    if (!state.firstCorrectFired) {
      state.firstCorrectFired = true;
      window.MrMacsProfile?.unlock("first-correct");
    }
  } else {
    state.streak = 0;
    // Wrong = fleet speed penalty
    state.marchStepInterval = Math.max(0.06, state.marchStepInterval * 0.90);
    state.shield = Math.max(0, state.shield - 8 * tune().accuracy);
    state.shake  = Math.max(state.shake, 0.42);
    els.feedback.className  = "feedback bad";
    els.feedback.innerHTML  = `<strong>Wrong — fleet accelerated.</strong> Correct: ${esc(state.current.answer)}. ${esc(state.current.explanation)}`;
  }
  els.choices.querySelectorAll(".choice").forEach((btn,i)=>{
    btn.classList.toggle("correct", state.current.choices[i].correct);
    btn.classList.toggle("wrong",   i===index && !correct);
    btn.disabled = true;
  });
  // Slam stamp
  setTimeout(()=>showBriefingStamp(correct), 80);
  updateHud();
  setTimeout(()=>{
    state.briefing = false;
    state.current  = null;
    state.safeTime = mobileCtrl.matches ? (correct?16:12) : (correct?7:5);
    state.enemyShots = [];
    state.player.invuln = Math.max(state.player.invuln, mobileCtrl.matches?2.0:1.0);
    hideBriefingStamp();
    resetTimeRing();
    els.briefing.classList.add("hidden");
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore(400); } catch (e) {}
    if (state.shield <= 0 && state.lives <= 0) finish(false);
  }, correct ? 1100 : 2100);
}

function containmentBurst() {
  const sorted = state.enemies.slice().sort((a,b)=>b.y-a.y);
  const remove = sorted.slice(0, Math.max(6, Math.floor(state.enemies.length*0.40)));
  remove.forEach(e=>explode(e.x,e.y,"#72f3ff",16));
  state.enemies = state.enemies.filter(e=>!remove.includes(e));
  if (state.boss) {
    state.boss.hp -= 2;
    explode(state.boss.x, state.boss.y+18, "#ffd15c", 36);
    sfxBossDamage();
    if (state.boss.hp <= 0) {
      state.score += 2500;
      setToast(`${state.boss.title} DEFUSED`, 1.2);
      state.boss = null;
      sfxWaveClear();
    }
  }
  state.enemyShots = [];
  state.shake      = Math.max(state.shake, 0.38);
}

// ─── Mission structure ────────────────────────────────────────────────────
function advanceWave() {
  state.waveMission++;
  state.wave++;
  rebuildShieldsPartial();
  state.intel = Math.min(100, state.intel + 28);
  // Wave 5 — snapshot on wave transition
  try {
    if (window.MrMacsSessions) {
      window.MrMacsSessions.save("cold-war-invaders", {
        score: Math.round(state.score || 0),
        wave: state.wave, lives: state.lives,
        intelEarned: (state.missionStats && state.missionStats.intelEarned) || 0,
        theater: state.theater, difficulty: state.difficulty
      });
    }
  } catch (e) {}

  if (state.waveMission > WAVES_PER_MISSION) {
    // Mission boss wave
    state.waveMission = WAVES_PER_MISSION + 1;
    spawnBoss();
    setToast(`MISSION ${state.mission} BOSS`, 2.0);
    sfxWaveClear();
  } else {
    spawnWave();
    sfxWaveClear();
  }
}

function checkWaveComplete() {
  const allGone = !state.enemies.length && !state.boss;
  if (!allGone) { state.nextWave = 1.2; return; }
  state.nextWave -= 1/60; // decremented via dt elsewhere
  if (state.nextWave > 0) return;

  // Wave complete — trigger between-wave briefing
  if (!state.waveComplete) {
    state.waveComplete = true;
    state.waveCompleteTimer = 0;
    sfxWaveClear();
    if (state.waveMission <= WAVES_PER_MISSION) {
      setToast(`WAVE ${state.wave} CLEAR`, 1.2);
      // Open briefing between waves
      state.pendingBriefing = true;
    } else {
      // boss was just killed — inter-mission screen
      state.pendingBriefing = false;
      showInterMission();
    }
  }
}

function showInterMission() {
  // Brief inter-mission stats overlay (3 seconds then advance)
  const acc = state.missionStats.shotsFired > 0
    ? Math.round(state.missionStats.shotsHit / state.missionStats.shotsFired * 100) : 0;
  setToast(`MISSION ${state.mission} COMPLETE — ACC ${acc}%`, 3.0);
  state.mission++;
  state.waveMission = 1;
  // Reset mission stats
  state.missionStats = { kills:0, shotsFired:0, shotsHit:0, intelEarned:0, shieldDmg:0 };
  setTimeout(()=>{
    rebuildShieldsPartial();
    spawnWave();
  }, 3000);
}

// ─── Particles ────────────────────────────────────────────────────────────
function explode(x, y, color, count) {
  if (reduceMotion) return;
  // Sprite flash — Phase 5: cap explosion sprite size in lite mode
  const flashSize = perfLite ? (count>20?52:38) : (count>20?88:58);
  state.particles.push({ x,y, vx:0,vy:0, life:0.44,max:0.44, size: flashSize, color, sprite:true });
  // Pixel spray
  const cap = perfLite ? Math.floor(count*0.6) : count;
  for (let i=0; i<cap; i++) {
    const angle = Math.random()*Math.PI*2;
    const spd   = 80 + Math.random()*260;
    state.particles.push({ x,y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd, life:0.32+Math.random()*0.44, max:0.76, size:2+Math.random()*4.5, color });
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter(p=>{
    p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt;
    p.vx *= Math.pow(0.96, dt*60); p.vy *= Math.pow(0.96, dt*60);
    return p.life > 0;
  });
}

// ─── Theater tint ─────────────────────────────────────────────────────────
const THEATER_TINT_CLASSES = ["theater-korea","theater-cuba","theater-berlin","theater-vietnam"];
function applyTheaterTint() {
  document.body.classList.remove(...THEATER_TINT_CLASSES);
  if (["korea","cuba","berlin","vietnam"].includes(state.theater)) {
    document.body.classList.add("theater-" + state.theater);
  }
}

// Theater code labels for wave counter
const THEATER_CODES = { korea:"KOR", cuba:"CUB", berlin:"BLN", vietnam:"VNM", cold:"CWI", us:"USH", global:"GLB", ap:"APR", all:"ALL" };

// ─── HUD ─────────────────────────────────────────────────────────────────
function updateHud() {
  const displayScore = Math.round(state.score);
  els.score.textContent  = displayScore.toLocaleString();
  // Wave code: e.g. "BLN-3"
  const code = THEATER_CODES[state.theater] || "CWI";
  els.wave.textContent   = `${code}-${state.wave}`;
  const shieldPct = Math.max(0, Math.round(state.shield));
  els.shield.textContent = `${shieldPct}%`;
  els.intel.textContent  = `${Math.round(state.intel)}%`;

  // Shield bar fill + low-shift (red when low)
  const shieldBar = document.getElementById("shieldBar");
  if (shieldBar) {
    shieldBar.style.width = `${shieldPct}%`;
    // background-position shifts color: 100% = green zone, 0% = red zone
    shieldBar.style.backgroundPosition = `${100 - shieldPct}% 0`;
  }

  // Combo display (HTML overlay)
  const comboEl = document.getElementById("comboDisplay");
  if (comboEl) {
    if (state.combo > 1 && state.running) {
      comboEl.textContent = `STREAK: ${state.combo}`;
      comboEl.classList.add("active");
      comboEl.classList.toggle("flash", state.combo > 8);
    } else {
      comboEl.classList.remove("active","flash");
    }
  }

  // Lives indicator in top-stats as prefix
  const livesIcons = "♥".repeat(Math.max(0, state.lives));
  els.topStats.innerHTML = [
    `${displayScore.toLocaleString()} pts`,
    `Wave ${code}-${state.wave} · M${state.mission}`,
    state.intel >= 100 ? "Intel armed" : `${Math.round(state.intel)}% intel`,
    livesIcons
  ].map(t=>`<span>${esc(t)}</span>`).join("");
}

// ─── Start / finish ────────────────────────────────────────────────────────
function startGame() {
  // Read from native selects (kept in sync by the dossier UI controller in index.html)
  state.theater    = els.theater.value || "korea";
  state.difficulty = els.difficulty.value || "regents";
  const preset     = DIFF_PRESET[state.difficulty]||DIFF_PRESET.regents;
  state.pool       = shuffle(filteredBank());
  state.running    = true;
  state.paused     = false;
  state.briefing   = false;
  state.over       = false;
  // Setup-extras Resume support: honor a carried-over score from prior session.
  state.score      = Math.max(0, Number(state.__resumeScoreCarry || 0));
  state.__resumeScoreCarry = 0; state.__resumeWaveCarry = 0;
  state.displayScore = 0;
  state.wave       = 1;
  state.waveMission= 1;
  state.mission    = 1;
  state.shield     = 100;
  state.intel      = mobileCtrl.matches ? 52 : 28;
  state.lives      = preset.lives;
  state.correct    = 0;
  state.answered   = 0;
  state.streak     = 0;
  state.kills      = 0;
  state.totalKills = 0;
  state.shotsFired = 0;
  state.combo      = 0;
  state.comboTimer = 0;
  state.player     = { x:state.w/2, y:state.h-playerBottomInset(), vx:0, cooldown:0, invuln:mobileCtrl.matches?2.2:0, shotCount:preset.shotTier };
  state.touch      = { left:false, right:false, fire:false };
  state.bullets    = [];
  state.enemyShots = [];
  state.particles  = [];
  state.powerUps   = [];
  state.shields    = [];
  state.scorePopups= [];
  state.boss       = null;
  state.ufo        = null;
  state.ufoTimer   = rnd(14,28);
  state.marchDir   = 1;
  state.marchStep  = 0;
  state.nextWave   = 0;
  state.waveComplete = false;
  state.pendingBriefing = false;
  state.flash      = 0;
  state.shake      = 0;
  state.activePowerUps = { tripleShot:0, rapidFire:0, slowFleet:0 };
  state.missionStats   = { kills:0, shotsFired:0, shotsHit:0, intelEarned:0, shieldDmg:0 };
  state.bunkersRebuilt = 0;
  state.firstCorrectFired = false;
  marchPhase  = 0;
  marchTimer  = 0;

  els.setup.classList.remove("show");
  els.results.classList.add("hidden");
  els.briefing.classList.add("hidden");
  document.body.classList.add("playing");
  applyTheaterTint();

  buildShields();
  spawnWave();
  updateHud();
  setToast("DEFEND THE SATELLITE LINE", 1.4);
  state.last = performance.now();
  requestAnimationFrame(loop);
  window.MrMacsAnalytics?.track("game_play",{gameId:"cold-war-invaders",title:"Cold War Invaders"},{counter:"game-plays"});
  try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start("cold-war-mission"); } catch (e) {}

  // Wave 5 — clear stale snapshot + start ~10s session snapshots
  try {
    if (window.MrMacsSessions) window.MrMacsSessions.clear("cold-war-invaders");
    if (state.__wave5SnapTimer) clearInterval(state.__wave5SnapTimer);
    state.__wave5SnapTimer = setInterval(function () {
      try {
        if (!state.running || state.paused || state.over || !window.MrMacsSessions) return;
        window.MrMacsSessions.save("cold-war-invaders", {
          score: Math.round(state.score || 0),
          wave: state.wave, lives: state.lives,
          intelEarned: (state.missionStats && state.missionStats.intelEarned) || 0,
          theater: state.theater, difficulty: state.difficulty
        });
      } catch (e) {}
    }, 10000);
  } catch (e) {}

  // Phase 3 — First-run tour (fires only once, after first mission start)
  if (window.MrMacsArcadeTour) {
    setTimeout(function () {
      window.MrMacsArcadeTour.start("cold-war-invaders", [
        {
          target: "#theaterGrid",
          title:  "Pick a theater",
          body:   "Korea / Cuba / Berlin / Vietnam — each formation pattern is different. Berlin’s wedge is the toughest opener."
        },
        {
          target: "#gameCanvas",
          title:  "Move + fire",
          body:   "Arrow keys / A–D + Space. Touch: hold left/right zones, tap fire."
        },
        {
          target: "#hud",
          title:  "Bunkers erode",
          body:   "Take cover but they take damage. Beating a mission without rebuilding earns the no-shield achievement."
        },
        {
          target: "#briefing",
          title:  "Briefings between waves",
          body:   "Answer briefing questions for power-ups. Skip is a free pass with no reward."
        }
      ]);
    }, 800);
  }
}

function finish(won=true) {
  if (!state.running) return;
  state.running = false;
  state.over    = true;
  try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch (e) {}
  state.touch   = { left:false, right:false, fire:false };
  stopUfoSiren();
  document.body.classList.remove("playing");
  els.results.classList.remove("hidden");
  const accuracy = state.answered ? Math.round(state.correct/state.answered*100) : 0;
  const acc2     = state.shotsFired ? Math.round((state.missionStats.shotsHit||state.kills)/Math.max(1,state.shotsFired)*100) : 0;
  els.resultTitle.textContent = won||state.wave>=5 ? "Containment held" : "Satellite line broken";

  // Best-wave banner
  const persist2   = loadPersist();
  const prevWave   = persist2[`wave_${state.theater}`] || 0;
  const waveRecord = state.wave > prevWave;
  const bannerEl   = document.getElementById("bestWaveBanner");
  if (bannerEl) {
    bannerEl.innerHTML = waveRecord
      ? `<span class="best-wave-banner">New Record — Wave ${state.wave}</span>` : "";
  }

  // Animated count-up metrics
  const scoreVal    = Math.round(state.score);
  const shieldUp    = state.missionStats.shieldDmg > 0
    ? Math.round((1 - state.missionStats.shieldDmg / 100) * 100) : 100;
  els.resultMetrics.innerHTML = [
    [scoreVal.toLocaleString(), "score"],
    [state.wave, "wave reached"],
    [`${state.missionStats.kills}`, "contacts neutralized"],
    [`${accuracy}%`, "intel accuracy"]
  ].map(([big,label])=>`<div class="metric"><strong>${esc(big)}</strong><span>${esc(label)}</span></div>`).join("");
  els.coach.textContent = accuracy>=85
    ? "Strong Cold War command. Move into U.S. or Global Regents practice and keep using exact policy names."
    : accuracy>=60
      ? "Good defense. Replay the same theater and focus on alliances, crisis names, and containment vocabulary."
      : "Replay on Cadet and slow down on the intel briefings. Cold War review rewards precise terms.";
  // Persist high score
  const persist = loadPersist();
  const hiKey   = `hi_${state.theater}`;
  const waveKey = `wave_${state.theater}`;
  const intelKey= `intel_total`;
  if ((persist[hiKey]||0) < state.score) savePersist({ [hiKey]: state.score });
  if ((persist[waveKey]||0) < state.wave) savePersist({ [waveKey]: state.wave });
  savePersist({ [intelKey]: (persist[intelKey]||0) + state.correct });
  window.MrMacsAnalytics?.track("game_complete",{gameId:"cold-war-invaders",title:"Cold War Invaders",score:Math.round(state.score),accuracy,questions:state.answered,weakTopics:accuracy<70?["Cold War vocabulary","Containment and crisis events"]:[]},{counter:"game-completions"});
  // Wave 5 — leaderboard submit + session clear
  try {
    if (state.__wave5SnapTimer) { clearInterval(state.__wave5SnapTimer); state.__wave5SnapTimer = null; }
    if (window.MrMacsSessions) window.MrMacsSessions.clear("cold-war-invaders");
  } catch (e) {}
  try {
    if (window.MrMacsLeaderboards) {
      const shards = (state.missionStats && state.missionStats.intelEarned) || 0;
      const wave5Score = Math.max(1, state.wave) * Math.max(1, shards);
      const result = window.MrMacsLeaderboards.submit("cold-war-invaders", wave5Score, {
        wave: state.wave, intelEarned: shards, theater: state.theater, accuracy
      });
      if (result && result.isNewRecord && window.MrMacsToast) {
        window.MrMacsToast.push({ icon: "🏆", title: "New high score!", sub: "Rank #" + result.rank, tone: "good", ms: 4200 });
      } else if (result && window.MrMacsToast) {
        window.MrMacsToast.push({ icon: "🏅", title: "Top 5 score", sub: "Rank #" + result.rank, tone: "good", ms: 3600 });
      }
    }
  } catch (e) {}
}

// ─── Main update ──────────────────────────────────────────────────────────
function update(dt) {
  if (!state.running || state.paused || state.briefing) { updateParticles(dt); return; }

  const t = tune();
  state.safeTime = Math.max(0, state.safeTime - dt);

  // Player movement — smooth accel/decel
  const left  = keys.has("ArrowLeft")||keys.has("a")||state.touch.left;
  const right = keys.has("ArrowRight")||keys.has("d")||state.touch.right;
  const target= (right?1:0) - (left?1:0);
  const maxSpd= mobileCtrl.matches ? 680 : 620;
  state.player.vx += (target*maxSpd - state.player.vx) * frameEase(14, dt);
  state.player.x   = clamp(state.player.x + state.player.vx*dt, 34, state.w-34);
  state.player.cooldown = Math.max(0, state.player.cooldown - dt);
  state.player.invuln   = Math.max(0, state.player.invuln   - dt);

  if (keys.has(" ")||keys.has("Space")||state.touch.fire) fire();
  if ((keys.has("e")||keys.has("x")) && state.intel>=100 && !state.briefing) openBriefing("Manual Intel Burst");

  // Power-up timers
  for (const k of Object.keys(state.activePowerUps)) {
    if (state.activePowerUps[k] > 0) {
      state.activePowerUps[k] = Math.max(0, state.activePowerUps[k] - dt);
    }
  }

  // March
  updateMarch(dt);

  // Slow-fleet: marchStep slows if active (handled in updateMarch)

  // Enemy falling damage
  const mobileGrace = mobileCtrl.matches && state.safeTime > 0;
  if (!mobileGrace && state.enemies.some(e=>e.y > state.h - (mobileCtrl.matches?100:150))) {
    state.shield = Math.max(0, state.shield - dt * (mobileCtrl.matches?5:16) * t.accuracy);
    state.missionStats.shieldDmg += dt * 16 * t.accuracy;
  }

  // Boss update
  updateBoss(dt);

  // UFO
  updateUfo(dt);

  // Enemy fire timer
  state.enemyFire -= dt;
  if (state.enemyFire <= 0 && !mobileGrace && state.enemies.length) {
    enemyShoot();
    state.enemyFire = Math.max(0.24, (1.4 - state.wave*0.04) * t.fireRate * (mobileCtrl.matches?1.5:1));
  }

  // Move bullets
  state.bullets.forEach(b=>{ b.y+=b.vy*dt; b.x+=b.vx*dt; });
  state.enemyShots.forEach(s=>{ s.y+=s.vy*dt; s.x+=s.vx*dt; });
  state.bullets    = state.bullets.filter(b=>b.y>-40&&b.x>-20&&b.x<state.w+20);
  state.enemyShots = state.enemyShots.filter(s=>s.y<state.h+50&&s.x>-50&&s.x<state.w+50);

  // Power-up drift
  state.powerUps.forEach(p=>{ p.y+=p.vy*dt; p.life-=dt; });
  state.powerUps = state.powerUps.filter(p=>p.life>0&&p.y<state.h+40);

  // Score popups
  state.scorePopups.forEach(sp=>{ sp.y+=sp.vy*dt; sp.life-=dt; });
  state.scorePopups = state.scorePopups.filter(sp=>sp.life>0);

  // Collisions
  collide();

  // Particles
  updateParticles(dt);

  // Combo decay
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  // Intel charge
  state.intel = Math.min(100, state.intel + dt * (4.5 + state.wave*0.22));

  // Screen effects
  state.shake     = Math.max(0, state.shake - dt*1.8);
  state.flash     = Math.max(0, state.flash - dt*2.0);
  state.toastTime = Math.max(0, state.toastTime - dt);

  // Wave/mission advancement
  if (!state.enemies.length && !state.boss) {
    state.nextWave -= dt;
    if (state.nextWave <= 0 && !state.waveComplete) {
      state.waveComplete = true;
      sfxWaveClear();

      // Trigger between-wave briefing (but only between waves, not before boss)
      if (state.waveMission <= WAVES_PER_MISSION) {
        setToast(`WAVE ${state.wave} CLEAR`, 1.2);
        window.MrMacsProfile?.addShards(100, "cold-war-invaders");
        // Delay then ask question then spawn next wave
        setTimeout(()=>{
          if (!state.running || state.over) return;
          state.pendingBriefing = false;
          openBriefingBetweenWaves();
        }, 600);
      } else {
        // Boss just died (handled in collide already via boss hp <= 0 → null)
        // This branch: we had a boss, it's gone, advance mission
        showInterMission();
      }
    }
  } else {
    state.nextWave   = 1.2;
    state.waveComplete = false;
  }

  if (state.shield <= 0 && state.lives <= 0) finish(false);
  updateHud();
}

function openBriefingBetweenWaves() {
  if (!state.running || state.over) return;
  // Open question; after close → advance wave
  state.current = nextQuestion();
  if (!state.current) { advanceWaveNoQuestion(); return; }
  state.briefing = true;
  state.locked   = false;
  els.questionReward.textContent = "Between-Wave Intel Briefing";
  els.questionMeta.textContent   = [state.current.course, state.current.set].filter(Boolean).join(" / ");
  els.questionPrompt.textContent = state.current.prompt;
  renderQuestionSource(state.current);
  els.feedback.className   = "feedback";
  els.feedback.textContent = "Correct = power-up. Wrong = fleet speed boost next wave. Skip = no penalty.";
  // Add a skip button
  const skipIcon = (window.MrMacsIcons && typeof window.MrMacsIcons.svg === "function")
    ? window.MrMacsIcons.svg("skip-fwd")
    : "";
  els.choices.innerHTML = state.current.choices.map((c,i)=>`<button class="choice" type="button" data-index="${i}"><b>${String.fromCharCode(65+i)}.</b>${esc(c.text)}</button>`).join("")
    + `<button class="choice skip-btn" type="button" data-index="-1" style="grid-column:1/-1;opacity:.7;"><span class="skip-ic" aria-hidden="true">${skipIcon}</span> Skip (no penalty)</button>`;
  els.choices.querySelectorAll(".choice").forEach(btn=>{
    btn.addEventListener("click",()=>gradeBetweenWave(Number(btn.dataset.index)));
  });
  hideBriefingStamp();
  startTimeRing(22);
  els.briefing.classList.remove("hidden");
  try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck(0.3, 300); } catch (e) {}
}

function gradeBetweenWave(index) {
  if (state.locked || !state.current) return;
  state.locked = true;
  const skipped = index < 0;
  let correct   = false;

  if (!skipped) {
    const choice = state.current.choices[index];
    correct      = Boolean(choice?.correct);
    state.answered++;
    if (correct) {
      state.correct++;
      state.streak++;
      state.intel = Math.max(0, state.intel - 70);
      state.score += 900 + state.streak * 120;
      state.missionStats.intelEarned++;
      const puType = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
      setTimeout(()=>applyPowerup(puType), 100);
      els.feedback.className  = "feedback good";
      els.feedback.innerHTML  = `<strong>Intel acquired — power-up incoming.</strong> ${esc(state.current.explanation)}`;
      sfxPowerup();
      window.MrMacsProfile?.addShards(15, "cold-war-invaders");
      if (!state.firstCorrectFired) {
        state.firstCorrectFired = true;
        window.MrMacsProfile?.unlock("first-correct");
      }
    } else {
      state.streak = 0;
      state.marchStepInterval = Math.max(0.06, state.marchStepInterval * 0.88);
      els.feedback.className  = "feedback bad";
      els.feedback.innerHTML  = `<strong>Wrong — next fleet is faster.</strong> Correct: ${esc(state.current.answer)}.`;
    }
    els.choices.querySelectorAll(".choice").forEach((btn,i)=>{
      if (i < state.current.choices.length) {
        btn.classList.toggle("correct", state.current.choices[i].correct);
        btn.classList.toggle("wrong",   i===index && !correct);
      }
      btn.disabled = true;
    });
  } else {
    els.feedback.className   = "feedback";
    els.feedback.textContent = "Mission skipped — no penalty, no reward. Will resume mission.";
    els.choices.querySelectorAll(".choice").forEach(btn=>btn.disabled=true);
  }
  if (!skipped) setTimeout(()=>showBriefingStamp(correct), 80);
  updateHud();
  setTimeout(()=>{
    state.briefing = false;
    state.current  = null;
    hideBriefingStamp();
    resetTimeRing();
    els.briefing.classList.add("hidden");
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore(400); } catch (e) {}
    advanceWaveNoQuestion();
  }, skipped ? 600 : correct ? 1000 : 1800);
}

function advanceWaveNoQuestion() {
  if (!state.running || state.over) return;
  state.waveComplete = false;
  advanceWave();
}

// ─── Draw ─────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, state.w, state.h);
  ctx.save();

  // Screen shake
  if (state.shake > 0 && !reduceMotion) {
    ctx.translate(
      Math.sin(performance.now()/21) * state.shake * 16,
      Math.cos(performance.now()/27) * state.shake * 10
    );
  }

  drawSpace();
  drawEarth();
  drawShields();
  drawPowerUps();
  drawBoss();
  state.enemies.forEach(drawEnemy);
  drawUfo();
  state.bullets.forEach(b=>drawShot(b,true));
  state.enemyShots.forEach(s=>drawShot(s,false));
  drawPlayer();
  drawParticles();
  ctx.restore();

  drawScorePopups();
  drawOverlay();
}

// Theater silhouette cityscape — drawn near horizon
const CITYSCAPE_PROFILES = {
  korea:   [[0,.7],[.05,.62],[.08,.58],[.1,.62],[.15,.65],[.18,.58],[.22,.52],[.25,.55],[.3,.65],[.35,.62],[.38,.56],[.42,.6],[.45,.65],[.5,.62],[.55,.58],[.6,.54],[.63,.6],[.68,.65],[.72,.6],[.75,.56],[.8,.62],[.85,.65],[.88,.6],[.92,.56],[.95,.62],[1,.7]],
  cuba:    [[0,.72],[.04,.65],[.08,.6],[.12,.65],[.18,.63],[.22,.58],[.26,.64],[.32,.68],[.38,.64],[.42,.6],[.46,.65],[.5,.7],[.55,.65],[.6,.6],[.64,.65],[.7,.68],[.75,.63],[.8,.58],[.85,.64],[.9,.68],[.95,.7],[1,.72]],
  berlin:  [[0,.68],[.03,.58],[.06,.52],[.09,.58],[.12,.54],[.15,.48],[.18,.54],[.22,.6],[.28,.56],[.32,.5],[.36,.56],[.4,.6],[.44,.54],[.48,.5],[.52,.54],[.56,.6],[.6,.54],[.64,.5],[.68,.54],[.72,.6],[.76,.58],[.8,.52],[.84,.56],[.88,.6],[.92,.55],[.96,.6],[1,.68]],
  vietnam: [[0,.75],[.05,.7],[.1,.65],[.13,.68],[.18,.72],[.22,.68],[.26,.65],[.3,.7],[.36,.68],[.4,.65],[.44,.7],[.5,.75],[.55,.7],[.6,.65],[.65,.7],[.7,.75],[.75,.7],[.8,.65],[.86,.68],[.9,.72],[.95,.7],[1,.75]],
};

function drawCityscape() {
  if (reduceMotion) return;
  const profile = CITYSCAPE_PROFILES[state.theater];
  if (!profile) return;
  const baseY = state.h * 0.78;
  const alpha  = 0.07;
  ctx.save();
  ctx.globalAlpha = alpha;
  // Theater tint
  const tintMap = { korea:"#6ab0d4", cuba:"#5dc48a", berlin:"#8c9ba8", vietnam:"#7a9a4a" };
  ctx.fillStyle = tintMap[state.theater] || "#c8252a";
  ctx.beginPath();
  ctx.moveTo(0, state.h);
  profile.forEach(([rx, ry]) => ctx.lineTo(rx * state.w, ry * state.h));
  ctx.lineTo(state.w, state.h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSpace() {
  const t = performance.now() / 1000;
  // Dossier ink-black base
  const g = ctx.createLinearGradient(0,0,0,state.h);
  g.addColorStop(0,"#0e0c08"); g.addColorStop(0.5,"#0a0908"); g.addColorStop(1,"#060504");
  ctx.fillStyle = g; ctx.fillRect(0,0,state.w,state.h);

  // Scrolling star tile from sheet
  if (ASSETS.ready) {
    const tW=320, tH=96;
    const ox=-((t*22)%tW), oy=-((t*12)%tH);
    for (let y=oy; y<state.h+tH; y+=tH)
      for (let x=ox; x<state.w+tW; x+=tW)
        drawSprite("starTile",x+tW/2,y+tH/2,tW,tH,{alpha:0.62});
  }

  // Random star field
  state.stars.forEach(star=>{
    star.y += star.speed*0.0008;
    if (star.y>state.h) star.y=0;
    ctx.globalAlpha = 0.36 + Math.sin(t*2+star.twinkle)*0.22;
    ctx.fillStyle   = star.color;
    ctx.fillRect(star.x, star.y, star.r, star.r);
  });
  ctx.globalAlpha = 1;

  // Subtle grid lines (dossier amber tint)
  ctx.strokeStyle = "rgba(212,130,10,.05)";
  ctx.lineWidth   = 1;
  const grid = 72, offset = (t*18)%grid;
  for (let x=-grid; x<state.w+grid; x+=grid) {
    ctx.beginPath(); ctx.moveTo(x+offset,0); ctx.lineTo(x-offset*2,state.h); ctx.stroke();
  }

  // Theater cityscape silhouette
  drawCityscape();
}

function drawEarth() {
  if (ASSETS.ready) {
    drawSprite("earth", state.w/2, state.h-26, Math.max(state.w*1.02,760), 118, {alpha:0.95});
    const wallAlpha = clamp(state.shield/100, 0.16, 0.78);
    for (let x=-140; x<state.w+180; x+=390)
      drawSprite("wall", x+195, state.h-132, 390, 76, {alpha:wallAlpha});
    return;
  }
  const y=state.h+86, r=Math.max(state.w*0.58,360);
  const g=ctx.createRadialGradient(state.w/2,y-120,50,state.w/2,y,r);
  g.addColorStop(0,"rgba(114,243,255,.42)"); g.addColorStop(0.45,"rgba(26,82,116,.52)");
  g.addColorStop(0.75,"rgba(11,22,42,.85)"); g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(state.w/2,y,r,Math.PI,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#72f3ff40"; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(state.w/2,y,r*0.94,Math.PI+0.12,Math.PI*1.88); ctx.stroke();
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Invuln flicker
  if (p.invuln>0 && Math.floor(performance.now()/65)%2===0) { ctx.restore(); return; }

  // Thrust trail (only while moving or always subtle)
  if (!reduceMotion) {
    const t      = performance.now()/1000;
    const moving = Math.abs(p.vx) > 20;
    const trailLen = moving ? 36 : 18;
    const trailAlpha = moving ? 0.52 : 0.22;
    const grad = ctx.createLinearGradient(0,18,0,18+trailLen);
    grad.addColorStop(0, "rgba(200,37,42,.62)");
    grad.addColorStop(1, "rgba(200,37,42,0)");
    ctx.globalAlpha = trailAlpha * (0.7 + Math.sin(t*14)*0.3);
    ctx.fillStyle   = grad;
    // left engine trail
    ctx.fillRect(-18, 18, 6, trailLen);
    // right engine trail
    ctx.fillRect(12, 18, 6, trailLen);
    ctx.globalAlpha = 1;
  }

  if (drawSprite("player",0,-5,106,76,{alpha:p.invuln>0?0.68:1})) {
    ctx.strokeStyle = state.activePowerUps.tripleShot>0 ? "#d4820a" : state.activePowerUps.rapidFire>0 ? "#c8252a" : "#f4ecd8";
    ctx.lineWidth   = 2; ctx.globalAlpha = 0.62;
    ctx.beginPath(); ctx.ellipse(0,0,58+Math.sin(performance.now()/120)*3,44,0,0,Math.PI*2); ctx.stroke();
    ctx.restore(); return;
  }
  // Fallback ship
  ctx.fillStyle="#dfefff"; ctx.strokeStyle="#72f3ff"; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,-34); ctx.lineTo(34,22); ctx.lineTo(13,16); ctx.lineTo(0,32); ctx.lineTo(-13,16); ctx.lineTo(-34,22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle="#06111f"; ctx.fillRect(-7,-6,14,18);
  ctx.strokeStyle = state.intel>=100?"#ffd15c":"#6df2a8";
  ctx.globalAlpha=0.72; ctx.beginPath(); ctx.ellipse(0,0,52+Math.sin(performance.now()/120)*3,42,0,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const pulse = Math.sin(performance.now()/180+enemy.phase)*2;
  const color = { satellite:"#72f3ff", missile:"#ff5f7d", drone:"#ffd15c", sputnik:"#b892ff", radar:"#6df2a8" }[enemy.kind]||"#72f3ff";
  const spriteName = { satellite:"satellite", missile:"missile", drone:"sputnik", sputnik:"sputnik", radar:"radar" }[enemy.kind]||"sputnik";
  const spriteSize = { satellite:[58,34], missile:[32,48], drone:[40,46], sputnik:[40,46], radar:[46,40] }[enemy.kind]||[42,42];

  // Elite glow
  if (enemy.elite) {
    ctx.shadowColor = color; ctx.shadowBlur = 12;
  }

  if (drawSprite(spriteName,0,pulse,spriteSize[0],spriteSize[1])) {
    if (state.w>760 && enemy.y<state.h*0.62) {
      ctx.shadowBlur=0;
      ctx.font="700 8px 'JetBrains Mono',ui-monospace,monospace";
      ctx.textAlign="center"; ctx.fillStyle=color;
      ctx.fillText(enemy.label,0,32);
    }
    ctx.restore(); return;
  }
  // Fallback shape
  ctx.strokeStyle=color; ctx.fillStyle="rgba(255,255,255,.12)"; ctx.lineWidth=2.5;
  if (enemy.kind==="missile") {
    ctx.beginPath(); ctx.moveTo(0,-20-pulse); ctx.lineTo(16,14); ctx.lineTo(0,8); ctx.lineTo(-16,14); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (enemy.kind==="satellite") {
    ctx.strokeRect(-8,-10+pulse,16,20); ctx.strokeRect(-33,-6+pulse,18,12); ctx.strokeRect(15,-6+pulse,18,12);
  } else {
    ctx.beginPath(); ctx.arc(0,pulse,17,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-30,pulse); ctx.lineTo(30,pulse); ctx.stroke();
  }
  if (state.w>760&&enemy.y<state.h*0.62) {
    ctx.font="700 8px 'JetBrains Mono',ui-monospace,monospace"; ctx.textAlign="center"; ctx.fillStyle=color;
    ctx.fillText(enemy.label,0,31);
  }
  ctx.restore();
}

function drawBoss() {
  if (!state.boss) return;
  const b = state.boss;
  ctx.save(); ctx.translate(b.x, b.y);
  // Phase tinting: gold → orange → declassified-red
  const phaseColors = ["#d4820a","#c05000","#c8252a"];
  const pc = phaseColors[b.phase];
  ctx.shadowColor = pc; ctx.shadowBlur = b.phase > 0 ? 22 : 8;

  if (drawSprite("boss",0,8,Math.min(320,b.w),148,{alpha:0.97})) {
    ctx.fillStyle=pc; ctx.font="700 13px 'JetBrains Mono',ui-monospace,monospace";
    ctx.textAlign="center";
    ctx.fillText(b.title,0,-52);
    // HP bar
    ctx.fillStyle="rgba(255,255,255,.16)";
    ctx.fillRect(-b.w*0.36, 72, b.w*0.72, 9);
    ctx.fillStyle=pc;
    ctx.fillRect(-b.w*0.36, 72, b.w*0.72 * b.hp/b.max, 9);
    // Phase pips
    for (let i=0; i<3; i++) {
      ctx.fillStyle = i<=b.phase ? pc : "rgba(255,255,255,.2)";
      ctx.beginPath(); ctx.arc(-b.w*0.36+i*20+10, 88, 4, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore(); return;
  }
  ctx.fillStyle="rgba(255,95,125,.12)"; ctx.strokeStyle=pc; ctx.lineWidth=3;
  roundRect(-b.w/2,-b.h/2,b.w,b.h,12); ctx.fill(); ctx.stroke();
  ctx.fillStyle=pc; ctx.font="950 13px Inter,sans-serif"; ctx.textAlign="center"; ctx.fillText(b.title,0,4);
  ctx.fillStyle="rgba(255,255,255,.16)"; ctx.fillRect(-b.w*0.38,b.h/2+10,b.w*0.76,8);
  ctx.fillStyle=pc; ctx.fillRect(-b.w*0.38,b.h/2+10,b.w*0.76*b.hp/b.max,8);
  ctx.restore();
}

function drawUfo() {
  if (!state.ufo) return;
  const u  = state.ufo;
  const t  = performance.now()/1000;
  const glow = Math.abs(Math.sin(t*6))*0.5 + 0.5;
  ctx.save();
  ctx.translate(u.x, u.y);
  if (drawSprite("sputnik",0,0,44,44,{alpha:0.95})) {
    ctx.strokeStyle = "#ffd15c";
    ctx.lineWidth   = 2; ctx.globalAlpha = glow*0.8;
    ctx.beginPath(); ctx.ellipse(0,0,28,16,0,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=1;
    ctx.fillStyle="#ffd15c"; ctx.font="900 10px ui-monospace,Menlo,monospace";
    ctx.textAlign="center"; ctx.fillText("UFO",0,26);
    ctx.restore(); return;
  }
  ctx.strokeStyle="#ffd15c"; ctx.fillStyle="rgba(255,209,92,.18)"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,0,28,12,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-6,14,8,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle="#ffd15c"; ctx.font="900 9px Inter,sans-serif"; ctx.textAlign="center"; ctx.fillText("?",0,3);
  ctx.restore();
}

function drawShot(shot, player) {
  const sprite = player ? (state.activePowerUps.tripleShot>0?"laserGreen":state.activePowerUps.rapidFire>0?"laserGreen":"laserCyan") : "laserRed";
  // Draw sprite if available (still add trail on top)
  const spriteDrawn = drawSprite(sprite, shot.x, shot.y, player?16:18, player?56:48, {alpha:0.96});
  ctx.save();
  if (!spriteDrawn) {
    ctx.strokeStyle = shot.color; ctx.lineWidth = player?4:5;
    ctx.shadowColor = shot.color; ctx.shadowBlur = perfLite ? (shot.missile ? 8 : 4) : (shot.missile ? 22 : 14); // Phase 5: cap missile glow in lite mode
    ctx.beginPath(); ctx.moveTo(shot.x, shot.y-(player?18:8)); ctx.lineTo(shot.x, shot.y+(player?8:18)); ctx.stroke();
  }
  if (!reduceMotion && !perfLite) { // Phase 5: skip motion-blur trail in lite mode
    // Motion-blur trail
    const trailLen   = shot.missile ? 36 : 20;
    const trailDir   = player ? -1 : 1;  // player bullets go up, enemy go down
    const trailColor = shot.missile ? "rgba(200,37,42," : (player ? "rgba(244,236,216," : "rgba(212,130,10,");
    const grad = ctx.createLinearGradient(shot.x, shot.y, shot.x + shot.vx*0.04, shot.y + trailLen*trailDir);
    grad.addColorStop(0, trailColor + (shot.missile?"0.55)":"0.4)"));
    grad.addColorStop(1, trailColor + "0)");
    ctx.globalAlpha  = shot.missile ? 0.72 : 0.42;
    ctx.strokeStyle  = grad;
    ctx.lineWidth    = shot.missile ? 6 : 3;
    ctx.shadowColor  = shot.missile ? "#c8252a" : shot.color;
    ctx.shadowBlur   = shot.missile ? 14 : 6;
    ctx.beginPath();
    ctx.moveTo(shot.x, shot.y);
    ctx.lineTo(shot.x + shot.vx*0.04, shot.y + trailLen*trailDir);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPowerUps() {
  for (const pu of state.powerUps) {
    const color = POWERUP_COLORS[pu.type]||"#ffd15c";
    const t     = performance.now()/1000;
    const pulse = Math.abs(Math.sin(t*3+pu.pulse));
    ctx.save();
    ctx.translate(pu.x, pu.y);
    ctx.globalAlpha  = 0.8 + pulse*0.2;
    ctx.fillStyle    = color;
    ctx.strokeStyle  = "#fff";
    ctx.lineWidth    = 1.5;
    ctx.shadowColor  = color; ctx.shadowBlur = 10+pulse*8;
    ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.font    = "900 8px ui-monospace,Menlo,monospace";
    ctx.textAlign = "center"; ctx.fillStyle="#fff";
    ctx.fillText(POWERUP_LABELS[pu.type]?.slice(0,4)||"",0,3);
    ctx.restore();
  }
}

function drawParticles() {
  state.particles.forEach(p=>{
    ctx.globalAlpha = clamp(p.life/p.max,0,1);
    if (p.sprite) {
      const frame = clamp(Math.floor((1-p.life/p.max)*4)+1,1,4);
      const size  = p.size*(1+(1-p.life/p.max)*0.3);
      drawSprite(`explosion${frame}`, p.x,p.y, size,size, {alpha:ctx.globalAlpha});
      ctx.globalAlpha=1; return;
    }
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha=1;
  });
}

function drawScorePopups() {
  ctx.save();
  for (const sp of state.scorePopups) {
    ctx.globalAlpha = clamp(sp.life/sp.max, 0, 1);
    ctx.fillStyle   = sp.color || "#d4820a";
    ctx.font        = "700 13px 'JetBrains Mono',ui-monospace,monospace";
    ctx.textAlign   = "center";
    ctx.shadowColor = sp.color || "#d4820a"; ctx.shadowBlur = 6;
    ctx.fillText(sp.text, sp.x, sp.y);
  }
  ctx.globalAlpha=1; ctx.shadowBlur=0;
  ctx.restore();
}

function drawOverlay() {
  ctx.save();

  // Flash — dossier red
  if (state.flash > 0 && !reduceMotion) {
    ctx.globalAlpha = state.flash * 0.6;
    ctx.fillStyle   = "#c8252a";
    ctx.fillRect(0,0,state.w,state.h);
    ctx.globalAlpha = 1;
  }

  // CRT scanlines
  if (!reduceMotion && !perfLite) {
    ctx.globalAlpha = 0.14;
    ctx.fillStyle   = "#000";
    for (let y=0; y<state.h; y+=4) ctx.fillRect(0,y,state.w,1.5);
    ctx.globalAlpha = 1;
  }

  // HUD: combo meter
  if (state.combo > 1 && state.running) {
    ctx.globalAlpha = 0.92;
    ctx.fillStyle   = state.combo>8?"#ff5f7d":state.combo>4?"#ffd15c":"#72f3ff";
    ctx.font        = `900 ${Math.min(28,14+state.combo)}px ui-monospace,SFMono-Regular,Menlo,monospace`;
    ctx.textAlign   = "right";
    ctx.fillText(`${state.combo}x COMBO`, state.w-18, state.h - (mobileCtrl.matches?230:110));
    ctx.globalAlpha = 1;
  }

  // Active power-up indicators
  const puY = mobileCtrl.matches ? state.h - 240 : state.h - 120;
  let puX   = 14;
  ctx.font  = "900 10px ui-monospace,SFMono-Regular,Menlo,monospace";
  ctx.textAlign = "left";
  for (const [k, v] of Object.entries(state.activePowerUps)) {
    if (v > 0) {
      const label = POWERUP_LABELS[k]||k;
      const color = POWERUP_COLORS[k]||"#ffd15c";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.fillText(`${label} ${Math.ceil(v)}s`, puX, puY);
      puX += ctx.measureText(`${label} ${Math.ceil(v)}s`).width + 14;
    }
  }
  ctx.globalAlpha=1;

  // Lives row
  if (state.running) {
    const lx = 14, ly = state.h - (mobileCtrl.matches?260:140);
    ctx.font = "900 18px Inter,sans-serif";
    ctx.textAlign = "left";
    for (let i=0; i<state.lives; i++) {
      ctx.fillStyle = "#ff5f7d"; ctx.globalAlpha=0.88;
      ctx.fillText("♥", lx + i*22, ly);
    }
    ctx.globalAlpha=1;
  }

  // Mini-map: drawn into HTML glass disc canvas element
  if (state.running) {
    drawMiniMap();
  }

  // Toast — dossier red stamp style
  if (state.toastTime > 0) {
    ctx.globalAlpha = clamp(state.toastTime,0,1);
    ctx.font        = "700 22px 'JetBrains Mono',ui-monospace,monospace";
    ctx.textAlign   = "center";
    const toastW = Math.min(state.w-36, ctx.measureText(state.toast).width+44);
    const toastY = Math.max(mobileCtrl.matches?100:82, state.h*0.17);
    ctx.fillStyle   = "rgba(10,9,6,.88)";
    ctx.strokeStyle = "rgba(200,37,42,.7)";
    ctx.lineWidth   = 1;
    roundRect(state.w/2-toastW/2, toastY, toastW, 48, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle   = "#f4ecd8";
    ctx.fillText(state.toast, state.w/2, toastY+30);
    ctx.globalAlpha = 1;
  }

  // Paused
  if (state.paused) {
    ctx.globalAlpha = 0.76; ctx.fillStyle = "#0e0c08"; ctx.fillRect(0,0,state.w,state.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle   = "#f4ecd8"; ctx.font="700 48px 'Inter',sans-serif"; ctx.textAlign="center";
    ctx.fillText("Paused",state.w/2,state.h/2);
    ctx.fillStyle   = "#d4820a"; ctx.font="700 20px 'Inter',sans-serif";
    ctx.fillText("Esc or Pause button to resume",state.w/2,state.h/2+44);
    ctx.fillStyle = "#8a7a5e"; ctx.font="16px 'JetBrains Mono',monospace";
    ctx.fillText(`Sound: ${muted?"MUTED":"ON"}  · M to toggle`,state.w/2,state.h/2+76);
  }

  ctx.restore();
}

function drawMiniMap() {
  // Draw into the HTML glass disc canvas (#minimap)
  const mmCanvas = document.getElementById("minimap");
  if (!mmCanvas) return;
  const mc   = mmCanvas.getContext("2d");
  const mmW  = mmCanvas.width;
  const mmH  = mmCanvas.height;
  const mmR  = mmW / 2;

  mc.clearRect(0, 0, mmW, mmH);

  // Clip to circle
  mc.save();
  mc.beginPath();
  mc.arc(mmR, mmR, mmR - 1, 0, Math.PI * 2);
  mc.clip();

  // Background
  mc.fillStyle = "rgba(10,9,6,.72)";
  mc.fillRect(0, 0, mmW, mmH);

  // Enemies
  const colorMap = { satellite:"#6ab0d4", missile:"#c8252a", drone:"#d4820a", sputnik:"#f4ecd8", radar:"#5dc48a" };
  for (const e of state.enemies) {
    const ex = (e.x / state.w) * mmW;
    const ey = (e.y / state.h) * mmH;
    mc.fillStyle = colorMap[e.kind] || "#f4ecd8";
    mc.globalAlpha = 0.85;
    mc.fillRect(ex - 1.5, ey - 1.5, 3, 3);
  }

  // Boss
  if (state.boss) {
    const bx = (state.boss.x / state.w) * mmW;
    const by = (state.boss.y / state.h) * mmH;
    mc.fillStyle = "#d4820a";
    mc.globalAlpha = 1;
    mc.beginPath();
    mc.arc(bx, by, 4, 0, Math.PI * 2);
    mc.fill();
  }

  // Player
  const px = (state.player.x / state.w) * mmW;
  const py = (state.player.y / state.h) * mmH;
  mc.fillStyle = "#f4ecd8";
  mc.globalAlpha = 1;
  mc.beginPath();
  mc.arc(px, py, 3, 0, Math.PI * 2);
  mc.fill();

  mc.restore();

  // Rim highlight (drawn outside clip)
  mc.save();
  mc.globalAlpha = 0.36;
  mc.strokeStyle = "rgba(244,236,216,.5)";
  mc.lineWidth   = 1.5;
  mc.beginPath();
  mc.arc(mmR, mmR, mmR - 1, 0, Math.PI * 2);
  mc.stroke();
  mc.restore();
}

// ─── Loop ─────────────────────────────────────────────────────────────────
function loop(now) {
  if (!state.running) return;
  const dt = Math.min(0.04, (now - (state.last||now)) / 1000);
  state.last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ─── Utility ──────────────────────────────────────────────────────────────
function roundRect(x, y, w, h, r) {
  const rad = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
  ctx.beginPath();
  ctx.moveTo(x+rad,y);
  ctx.arcTo(x+w,y,x+w,y+h,rad);
  ctx.arcTo(x+w,y+h,x,y+h,rad);
  ctx.arcTo(x,y+h,x,y,rad);
  ctx.arcTo(x,y,x+w,y,rad);
  ctx.closePath();
}

// ─── Input ────────────────────────────────────────────────────────────────
document.addEventListener("keydown", ev=>{
  const k = ev.key.length===1 ? ev.key.toLowerCase() : ev.key;
  keys.add(k);
  if (["ArrowLeft","ArrowRight"," "].includes(ev.key)) ev.preventDefault();
  if (ev.key===" "||ev.code==="Space") fire();
  if ((ev.key==="e"||ev.key==="E"||ev.key==="x"||ev.key==="X") && state.intel>=100 && !state.briefing) openBriefing("Manual Intel Burst");
  if ((ev.key==="m"||ev.key==="M")) {
    muted = !muted;
    if (muted) stopUfoSiren();
    syncMuteButton();
    setToast(muted?"SOUND MUTED":"SOUND ON", 1.0);
  }
  if (ev.key==="Escape" && state.running && !state.briefing) {
    state.paused = !state.paused;
    els.pause.textContent = state.paused ? "Resume" : "Pause";
  }
});
document.addEventListener("keyup", ev=>{
  const k = ev.key.length===1 ? ev.key.toLowerCase() : ev.key;
  keys.delete(k);
});

// Mouse/pointer on canvas — aim + shoot (no mode switching, just supplement keyboard)
els.canvas.addEventListener("pointermove", ev=>{
  if (!state.running||state.briefing) return;
  ev.preventDefault();
  state.player.x = clamp(ev.clientX, 34, state.w-34);
});
els.canvas.addEventListener("pointerdown", ev=>{
  if (!state.running) return;
  ev.preventDefault();
  els.canvas.setPointerCapture?.(ev.pointerId);
  state.player.x = clamp(ev.clientX, 34, state.w-34);
  if (state.intel>=100 && ev.clientY<state.h*0.42) openBriefing("Touch Intel Burst");
  else fire();
});
els.canvas.addEventListener("pointerup",     ev=>{ ev.preventDefault(); els.canvas.releasePointerCapture?.(ev.pointerId); });
els.canvas.addEventListener("pointercancel", ev=>{ ev.preventDefault(); els.canvas.releasePointerCapture?.(ev.pointerId); });

// Touch buttons
function bindTouchButton(btn, press, release=press) {
  if (!btn) return;
  const down = ev=>{ ev.preventDefault(); btn.setPointerCapture?.(ev.pointerId); btn.classList.add("active"); press(); };
  const up   = ev=>{ ev.preventDefault(); btn.releasePointerCapture?.(ev.pointerId); btn.classList.remove("active"); release(false); };
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup",   up);
  btn.addEventListener("pointercancel", up);
  btn.addEventListener("pointerleave", up);
}

bindTouchButton(els.touchLeft,  ()=>{state.touch.left=true;},  ()=>{state.touch.left=false;});
bindTouchButton(els.touchRight, ()=>{state.touch.right=true;}, ()=>{state.touch.right=false;});
bindTouchButton(els.touchFire,  ()=>{state.touch.fire=true; fire();}, ()=>{state.touch.fire=false;});
bindTouchButton(els.touchIntel, ()=>{
  if (state.intel>=100&&!state.briefing) openBriefing("Touch Intel Burst");
}, ()=>{});

// ─── UI events ────────────────────────────────────────────────────────────
els.start.addEventListener("click", startGame);
els.again.addEventListener("click", ()=>{
  els.results.classList.add("hidden");
  els.setup.classList.add("show");
  document.body.classList.remove("playing");
  renderMetrics();
});
els.pause.addEventListener("click", ()=>{
  if (!state.running||state.briefing) return;
  state.paused = !state.paused;
  els.pause.textContent = state.paused?"Resume":"Pause";
});
els.quit.addEventListener("click", ()=>finish(false));
// Sync the mute button (icon + aria) with the current muted state.
// Uses MrMacsIcons monoline glyphs when available, falls back to text.
function syncMuteButton() {
  if (!els.mute) return;
  const iconEl = els.mute.querySelector(".mute-icon");
  const labelEl = els.mute.querySelector(".mute-label");
  const Icons = window.MrMacsIcons;
  if (iconEl) {
    if (Icons && typeof Icons.svg === "function") {
      iconEl.innerHTML = muted ? Icons.svg("audio-off") : Icons.svg("audio-on");
    } else {
      // Fallback: stable monoline glyph (no color emoji on any platform)
      iconEl.textContent = muted ? "✕" : "♪";
    }
  } else {
    // Older markup — fall back to overwriting the button text
    els.mute.textContent = muted ? "MUTE" : "SND";
  }
  if (labelEl) labelEl.textContent = muted ? "OFF" : "SND";
  els.mute.setAttribute("data-muted", muted ? "true" : "false");
  els.mute.setAttribute("aria-pressed", muted ? "true" : "false");
}

if (els.mute) {
  els.mute.addEventListener("click", ()=>{
    muted = !muted;
    if (muted) stopUfoSiren();
    syncMuteButton();
    setToast(muted?"SOUND MUTED":"SOUND ON", 0.9);
  });
  // Initial paint so the icon renders even if music/profile boot is slow
  syncMuteButton();
}
els.theater.addEventListener("change", ()=>{ state.theater=els.theater.value; renderMetrics(); applyTheaterTint(); });
els.difficulty.addEventListener("change", ()=>{ state.difficulty=els.difficulty.value; renderMetrics(); });

// ─── Boot ─────────────────────────────────────────────────────────────────
addEventListener("resize", resize, {passive:true});
mobileCtrl.addEventListener?.("change", resize);
resize();
loadBank();
draw();

// ── MrMacsProfile boot ────────────────────────────────────────────────────
if (window.MrMacsProfile) {
  MrMacsProfile.recordPlay({ id: "cold-war-invaders", title: "Cold War Invaders", course: "All Courses", file: "games/cold-war-invaders/index.html" });
  const _settings = MrMacsProfile.getSettings?.();
  if (_settings && typeof _settings.muted === "boolean") {
    muted = _settings.muted;
    if (muted) stopUfoSiren();
    syncMuteButton();
  }
}

// ── Setup-screen extras: resume card + top-5 leaderboard ──────────────────
function _cwiFmtAgo(ts) {
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
function _cwiSafe(v) {
  return String(v == null ? "" : v).replace(/[<>&"]/g, c =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;");
}
function _cwiRenderResumeCard() {
  const card = document.getElementById("resumeCard");
  if (!card) return;
  if (!window.MrMacsSessions) { card.hidden = true; return; }
  let prev = null;
  try { prev = window.MrMacsSessions.load("cold-war-invaders"); } catch (e) {}
  if (!prev || !prev.state || !prev.ts) { card.hidden = true; return; }
  if (Date.now() - prev.ts > 24 * 3600 * 1000) { card.hidden = true; return; }
  const s = prev.state || {};
  const wave = s.wave || 1;
  const score = Math.round(s.score || 0);
  card.hidden = false;
  card.innerHTML =
    '<div class="resume-card-head">' +
      '<span class="resume-card-title">Resume your run?</span>' +
      '<span class="resume-card-time">' + _cwiSafe(_cwiFmtAgo(prev.ts)) + '</span>' +
    '</div>' +
    '<div class="resume-card-meta">Wave ' + wave + ' · score ' + score.toLocaleString() + '</div>' +
    '<div class="resume-card-actions">' +
      '<button type="button" class="resume-btn resume-btn--primary" id="resumeRunBtn">Resume</button>' +
      '<button type="button" class="resume-btn" id="resumeFreshBtn">Start fresh</button>' +
    '</div>';
  const resumeBtn = card.querySelector("#resumeRunBtn");
  const freshBtn  = card.querySelector("#resumeFreshBtn");
  if (resumeBtn) {
    resumeBtn.addEventListener("click", () => {
      // Best-effort restore: bring carried-over score forward, then begin
      // a fresh mission. Cold War Invaders rebuilds enemy formations from
      // scratch — so we honor the score but reset the playfield safely.
      try {
        if (typeof state === "object") {
          state.__resumeScoreCarry = Math.round(s.score || 0);
          state.__resumeWaveCarry  = Math.max(1, Number(s.wave) || 1);
        }
      } catch (e) {}
      try {
        if (window.MrMacsToast) window.MrMacsToast.push({
          icon: "⏯", title: "Resuming from wave " + wave,
          sub: "Score " + score.toLocaleString() + " carried over", tone: "info", ms: 3500
        });
      } catch (e) {}
      const startBtn = document.getElementById("startBtn");
      if (startBtn) startBtn.click();
    });
  }
  if (freshBtn) {
    freshBtn.addEventListener("click", () => {
      try { window.MrMacsSessions.clear("cold-war-invaders"); } catch (e) {}
      card.hidden = true;
      const startBtn = document.getElementById("startBtn");
      if (startBtn) startBtn.click();
    });
  }
}
function _cwiRenderLeaderboardPanel() {
  const panel = document.getElementById("leaderboardPanel");
  if (!panel) return;
  if (!window.MrMacsLeaderboards) { panel.hidden = true; return; }
  let rows = [];
  try { rows = window.MrMacsLeaderboards.top("cold-war-invaders", 5) || []; } catch (e) { rows = []; }
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
        '<span class="lb-avatar">' + _cwiSafe(r.avatar || "") + '</span>' +
        '<span class="lb-name">' + _cwiSafe(r.name || "Trainer") + '</span>' +
        '<span class="lb-score">' + Math.round(r.score || 0).toLocaleString() + '</span>' +
        '<span class="lb-ago">' + _cwiSafe(_cwiFmtAgo(r.ts || 0)) + '</span>' +
      '</li>'
    ).join("") +
    '</ol>';
}
try { _cwiRenderResumeCard(); } catch (e) {}
try { _cwiRenderLeaderboardPanel(); } catch (e) {}
