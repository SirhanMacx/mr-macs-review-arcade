const els = {
  canvas: document.querySelector("#gameCanvas"),
  setup: document.querySelector("#setupScreen"),
  briefing: document.querySelector("#briefing"),
  results: document.querySelector("#resultScreen"),
  start: document.querySelector("#startBtn"),
  again: document.querySelector("#againBtn"),
  pause: document.querySelector("#pauseBtn"),
  quit: document.querySelector("#quitBtn"),
  theater: document.querySelector("#theaterSelect"),
  difficulty: document.querySelector("#difficultySelect"),
  metrics: document.querySelector("#missionMetrics"),
  score: document.querySelector("#score"),
  wave: document.querySelector("#wave"),
  shield: document.querySelector("#shield"),
  intel: document.querySelector("#intel"),
  topStats: document.querySelector("#topStats"),
  questionMeta: document.querySelector("#questionMeta"),
  questionReward: document.querySelector("#questionReward"),
  questionPrompt: document.querySelector("#questionPrompt"),
  choices: document.querySelector("#choices"),
  feedback: document.querySelector("#feedback"),
  resultTitle: document.querySelector("#resultTitle"),
  resultMetrics: document.querySelector("#resultMetrics"),
  coach: document.querySelector("#coachText")
};

const ctx = els.canvas.getContext("2d");
const keys = new Set();
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const ASSETS = {
  sheet: new Image(),
  ready: false,
  failed: false
};
ASSETS.sheet.src = "assets/cold-war-invaders-atari-sheet.png";
ASSETS.sheet.onload = () => {
  ASSETS.ready = true;
  draw();
};
ASSETS.sheet.onerror = () => {
  ASSETS.failed = true;
  setToast("BITMAP ASSETS MISSING", 2);
};

const SPRITES = {
  marquee: [38, 18, 1450, 238],
  player: [48, 318, 185, 130],
  satellite: [292, 322, 240, 132],
  radar: [610, 326, 140, 132],
  missile: [848, 332, 92, 146],
  sputnik: [1005, 330, 132, 154],
  boss: [1164, 326, 324, 166],
  intel: [104, 552, 75, 116],
  laserCyan: [337, 562, 28, 100],
  laserRed: [448, 562, 29, 101],
  laserGreen: [558, 562, 29, 101],
  explosion1: [714, 574, 76, 82],
  explosion2: [842, 558, 132, 110],
  explosion3: [986, 558, 136, 116],
  explosion4: [1144, 572, 112, 102],
  wall: [48, 726, 570, 110],
  nuke: [842, 710, 122, 124],
  starTile: [1052, 724, 426, 128],
  earth: [30, 878, 1460, 118]
};

const COLD_RE = /cold war|containment|korea|vietnam|soviet|communis|nuclear|berlin|cuban|nato|warsaw|iron curtain|truman doctrine|marshall plan|space race|détente|detente|proxy|arms race|brinkmanship|ussr|stalin|mao|castro|gorbachev|reagan/i;
const THEATER = {
  cold: /cold war|containment|korea|vietnam|soviet|communis|nuclear|berlin|cuban|nato|warsaw|iron curtain|truman doctrine|marshall plan|space race|proxy|arms race|brinkmanship|ussr/i,
  us: /U\.S\.|United States|AP U\.S\.|APUSH|Grade 8|Grade 11|NYS U\.S\./i,
  global: /Global|World|European|Grade 10|AP World|AP European|Human Rights|Decolonization/i,
  ap: /^AP\b|AP |Advanced Placement/i,
  all: /./
};

const FALLBACK = [
  ["The U.S. policy of stopping the spread of communism after World War II.", "Containment", ["Isolationism", "Appeasement", "Neutrality"], "Containment shaped U.S. actions in Europe, Asia, and Latin America."],
  ["The crisis in 1962 that brought the U.S. and Soviet Union close to nuclear war.", "Cuban Missile Crisis", ["Berlin Airlift", "Korean War", "Marshall Plan"], "The Cuban Missile Crisis was a direct nuclear confrontation over Soviet missiles in Cuba."],
  ["The alliance created by the U.S. and Western democracies in 1949.", "NATO", ["Warsaw Pact", "United Nations", "OPEC"], "NATO was the Western military alliance; the Warsaw Pact was the Soviet-led counterpart."],
  ["The economic aid program designed to rebuild Western Europe and limit communist appeal.", "Marshall Plan", ["New Deal", "Great Society", "Open Door Policy"], "The Marshall Plan used economic recovery as a Cold War strategy."],
  ["The symbolic barrier that divided communist East Berlin from democratic West Berlin.", "Berlin Wall", ["Iron Curtain", "38th Parallel", "Suez Canal"], "The Berlin Wall became a visible symbol of Cold War division."],
  ["Competition between the U.S. and USSR to develop rockets, satellites, and lunar achievements.", "Space Race", ["Arms Race", "Red Scare", "Domino Theory"], "The Space Race was a technological and propaganda contest."],
  ["The idea that if one nation fell to communism, nearby nations might follow.", "Domino Theory", ["Containment", "Détente", "Glasnost"], "Domino Theory influenced U.S. involvement in Vietnam."],
  ["A period of eased Cold War tensions in the 1970s.", "Détente", ["Brinkmanship", "McCarthyism", "Total war"], "Détente included diplomacy and arms-limitation talks."]
].map((row, index) => ({
  id: `fallback-${index}`,
  prompt: row[0],
  answer: row[1],
  choices: [row[1], ...row[2]].map((text, i) => ({ label: String.fromCharCode(65 + i), text })),
  correct: "A",
  explanation: row[3],
  course: "Cold War Core",
  set: "Fallback Intel"
}));

const state = {
  dpr: 1,
  w: 1,
  h: 1,
  bank: [],
  pool: [],
  current: null,
  running: false,
  paused: false,
  briefing: false,
  locked: false,
  over: false,
  score: 0,
  wave: 1,
  shield: 100,
  intel: 0,
  correct: 0,
  answered: 0,
  streak: 0,
  theater: "cold",
  difficulty: "regents",
  player: { x: 0, y: 0, vx: 0, cooldown: 0, invuln: 0 },
  bullets: [],
  enemyShots: [],
  enemies: [],
  particles: [],
  stars: [],
  boss: null,
  enemyDir: 1,
  enemyStep: 0,
  enemyFire: 1.4,
  nextWave: 0,
  shake: 0,
  toast: "LOADING INTEL BANK",
  toastTime: 1.5,
  last: 0
};

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function frameEase(rate, dt) {
  return 1 - Math.exp(-rate * dt);
}

function drawSprite(name, x, y, w, h, options = {}) {
  const sprite = SPRITES[name];
  if (!ASSETS.ready || !sprite) return false;
  ctx.save();
  ctx.translate(x, y);
  if (options.rotate) ctx.rotate(options.rotate);
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
  ctx.globalCompositeOperation = options.blend || "lighter";
  ctx.drawImage(ASSETS.sheet, sprite[0], sprite[1], sprite[2], sprite[3], -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

function clean(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function normalizeQuestion(q) {
  if (!q) return null;
  if (Array.isArray(q.choices) && q.choices.length >= 4) {
    const choices = q.choices.slice(0, 4).map((choice) => ({ text: clean(choice.text), correct: String(choice.label) === String(q.correct) }));
    const answer = choices.find((choice) => choice.correct)?.text || q.answer;
    if (!answer || choices.some((choice) => !choice.text)) return null;
    return {
      prompt: clean(q.stem || q.prompt),
      choices: shuffle(choices),
      answer,
      explanation: clean(q.explanation) || `Correct answer: ${answer}.`,
      course: q.course || "Cold War Review",
      set: q.set || q.day || q.category || "Review"
    };
  }
  if (!q.prompt || !q.answer) return null;
  const sameCourse = state.bank.filter((item) => item.answer && item.answer !== q.answer && item.course === q.course).map((item) => clean(item.answer));
  const fallback = state.bank.filter((item) => item.answer && item.answer !== q.answer).map((item) => clean(item.answer));
  const distractors = [...new Map(shuffle(sameCourse.concat(fallback)).filter(Boolean).map((item) => [item.toLowerCase(), item])).values()].slice(0, 3);
  if (distractors.length < 3) return null;
  return {
    prompt: clean(q.prompt),
    choices: shuffle([q.answer, ...distractors].map((text) => ({ text: clean(text), correct: text === q.answer }))),
    answer: clean(q.answer),
    explanation: clean(q.explanation) || `Correct answer: ${clean(q.answer)}.`,
    course: q.course || "Cold War Review",
    set: q.set || q.day || q.category || "Review"
  };
}

function questionText(q) {
  return [q.course, q.set, q.prompt, q.answer, q.explanation, ...(q.tags || [])].join(" ");
}

async function loadBank() {
  try {
    const response = await fetch("../../data/chrono-defense-bank.json", { cache: "no-store" });
    const data = await response.json();
    const raw = (data.questions || []).filter((q) => q.answer || q.choices);
    const cold = raw.filter((q) => COLD_RE.test(questionText(q)));
    state.bank = cold.length >= 40 ? cold : raw.filter((q) => /Cold War|Foreign Policy|Global Conflict|Modern Era|APUSH|AP World|AP European|Grade 8|Grade 10|Grade 11/i.test(questionText(q)));
  } catch {
    state.bank = FALLBACK;
  }
  if (!state.bank.length) state.bank = FALLBACK;
  renderMetrics();
  setToast(`${state.bank.length} INTEL PROMPTS`, 1.4);
}

function filteredBank() {
  const regex = THEATER[state.theater] || THEATER.cold;
  const filtered = state.bank.filter((q) => regex.test(questionText(q)));
  return filtered.length >= 8 ? filtered : state.bank;
}

function renderMetrics() {
  const bank = filteredBank();
  const courses = new Set(bank.map((q) => q.course).filter(Boolean)).size;
  els.metrics.innerHTML = [
    [bank.length, "intel prompts"],
    [courses, "course lanes"],
    [state.difficulty, "difficulty"],
    ["E", "burst key"]
  ].map(([big, label]) => `<div class="metric"><strong>${esc(big)}</strong><span>${esc(label)}</span></div>`).join("");
}

function resize() {
  state.dpr = Math.min(devicePixelRatio || 1, 2);
  state.w = innerWidth;
  state.h = innerHeight;
  els.canvas.width = Math.max(1, Math.floor(state.w * state.dpr));
  els.canvas.height = Math.max(1, Math.floor(state.h * state.dpr));
  els.canvas.style.width = `${state.w}px`;
  els.canvas.style.height = `${state.h}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  state.player.y = state.h - 86;
  if (!state.player.x) state.player.x = state.w / 2;
  buildStars();
}

function buildStars() {
  const count = Math.min(190, Math.floor(state.w * state.h / 5500));
  state.stars = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * state.w,
    y: Math.random() * state.h,
    r: 1 + Math.random() * 1.8,
    speed: 8 + Math.random() * 34,
    twinkle: Math.random() * 9,
    color: i % 7 === 0 ? "#ffd15c" : i % 5 === 0 ? "#72f3ff" : "#f8fbff"
  }));
}

function setToast(text, seconds = 1.2) {
  state.toast = text;
  state.toastTime = seconds;
}

function startGame() {
  state.theater = els.theater.value;
  state.difficulty = els.difficulty.value;
  state.pool = shuffle(filteredBank());
  state.running = true;
  state.paused = false;
  state.briefing = false;
  state.over = false;
  state.score = 0;
  state.wave = 1;
  state.shield = 100;
  state.intel = 30;
  state.correct = 0;
  state.answered = 0;
  state.streak = 0;
  state.player = { x: state.w / 2, y: state.h - 86, vx: 0, cooldown: 0, invuln: 0 };
  state.bullets = [];
  state.enemyShots = [];
  state.particles = [];
  state.boss = null;
  state.enemyDir = 1;
  state.nextWave = 0;
  els.setup.classList.remove("show");
  els.results.classList.add("hidden");
  els.briefing.classList.add("hidden");
  spawnWave();
  updateHud();
  setToast("DEFEND THE SATELLITE LINE", 1.4);
  state.last = performance.now();
  requestAnimationFrame(loop);
  window.MrMacsAnalytics?.track("game_play", { gameId: "cold-war-invaders", title: "Cold War Invaders" }, { counter: "game-plays" });
}

function difficultyTune() {
  return {
    cadet: { speed: 0.82, fire: 1.25, shield: 0.72 },
    regents: { speed: 1, fire: 1, shield: 1 },
    crisis: { speed: 1.22, fire: 0.72, shield: 1.25 }
  }[state.difficulty] || { speed: 1, fire: 1, shield: 1 };
}

function spawnWave() {
  const tune = difficultyTune();
  const rows = Math.min(5, 3 + Math.floor(state.wave / 3));
  const cols = Math.min(10, 6 + Math.floor(state.wave / 2));
  const gapX = Math.min(72, Math.max(46, (state.w - 70) / cols));
  const startX = state.w / 2 - (cols - 1) * gapX / 2;
  const startY = 118;
  const labels = shuffle(filteredBank()).slice(0, rows * cols).map((q) => clean(q.answer || q.prompt).slice(0, 18));
  state.enemies = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const kind = ["satellite", "missile", "drone", "sputnik", "radar"][(row + col + state.wave) % 5];
      state.enemies.push({
        x: startX + col * gapX,
        y: startY + row * 54,
        baseX: startX + col * gapX,
        row,
        col,
        w: 38,
        h: 28,
        hp: row === rows - 1 && state.wave > 4 ? 2 : 1,
        kind,
        label: labels[row * cols + col] || "Cold War",
        phase: Math.random() * 7
      });
    }
  }
  state.enemyDir = 1;
  state.enemyStep = 0;
  state.enemyFire = Math.max(0.28, (1.45 - state.wave * 0.055) * tune.fire);
  if (state.wave % 4 === 0) {
    state.boss = {
      x: state.w / 2,
      y: 88,
      w: Math.min(420, state.w * 0.64),
      h: 82,
      hp: 3 + Math.floor(state.wave / 4),
      max: 3 + Math.floor(state.wave / 4),
      title: ["BERLIN BLOCKADE", "CUBAN MISSILE CRISIS", "VIETNAM ESCALATION", "ARMS RACE"][Math.floor(state.wave / 4 - 1) % 4]
    };
    setToast(`${state.boss.title} APPROACHES`, 1.3);
  }
}

function nextQuestion() {
  if (!state.pool.length) state.pool = shuffle(filteredBank());
  let normalized = null;
  while (!normalized && state.pool.length) normalized = normalizeQuestion(state.pool.pop());
  return normalized || normalizeQuestion(FALLBACK[Math.floor(Math.random() * FALLBACK.length)]);
}

function openBriefing(reason = "Containment Burst Armed") {
  if (!state.running || state.briefing || state.over) return;
  state.current = nextQuestion();
  if (!state.current) return;
  state.briefing = true;
  state.locked = false;
  els.questionReward.textContent = reason;
  els.questionMeta.textContent = [state.current.course, state.current.set].filter(Boolean).join(" / ");
  els.questionPrompt.textContent = state.current.prompt;
  els.feedback.className = "feedback";
  els.feedback.textContent = "Answer correctly to clear the nearest wave and damage crisis targets.";
  els.choices.innerHTML = state.current.choices.map((choice, index) => `
    <button class="choice" type="button" data-index="${index}">
      <b>${String.fromCharCode(65 + index)}.</b>${esc(choice.text)}
    </button>
  `).join("");
  els.choices.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => gradeAnswer(Number(button.dataset.index)));
  });
  els.briefing.classList.remove("hidden");
}

function gradeAnswer(index) {
  if (state.locked || !state.current) return;
  state.locked = true;
  const choice = state.current.choices[index];
  const correct = Boolean(choice?.correct);
  state.answered += 1;
  if (correct) {
    state.correct += 1;
    state.streak += 1;
    state.score += 900 + state.streak * 120;
    state.intel = Math.max(0, state.intel - 88);
    containmentBurst();
    els.feedback.className = "feedback good";
    els.feedback.innerHTML = `<strong>Containment burst launched.</strong> ${esc(state.current.explanation)}`;
  } else {
    state.streak = 0;
    state.shield = Math.max(0, state.shield - 11 * difficultyTune().shield);
    state.intel = Math.max(0, state.intel - 35);
    state.shake = Math.max(state.shake, 0.5);
    els.feedback.className = "feedback bad";
    els.feedback.innerHTML = `<strong>Signal jammed.</strong> Correct answer: ${esc(state.current.answer)}. ${esc(state.current.explanation)}`;
  }
  els.choices.querySelectorAll(".choice").forEach((button, i) => {
    button.classList.toggle("correct", state.current.choices[i].correct);
    button.classList.toggle("wrong", i === index && !correct);
    button.disabled = true;
  });
  updateHud();
  setTimeout(() => {
    state.briefing = false;
    state.current = null;
    els.briefing.classList.add("hidden");
    if (state.shield <= 0) finish(false);
  }, correct ? 1150 : 2200);
}

function containmentBurst() {
  const sorted = state.enemies.slice().sort((a, b) => b.y - a.y);
  const remove = sorted.slice(0, Math.max(7, Math.floor(state.enemies.length * 0.42)));
  remove.forEach((enemy) => explode(enemy.x, enemy.y, "#72f3ff", 18));
  state.enemies = state.enemies.filter((enemy) => !remove.includes(enemy));
  if (state.boss) {
    state.boss.hp -= 1;
    explode(state.boss.x, state.boss.y + 18, "#ffd15c", 36);
    if (state.boss.hp <= 0) {
      state.score += 2500;
      setToast(`${state.boss.title} DEFUSED`, 1.2);
      state.boss = null;
    }
  }
  state.enemyShots = [];
  state.shake = Math.max(state.shake, 0.32);
}

function fire() {
  if (state.player.cooldown > 0 || state.briefing || state.paused) return;
  state.bullets.push({ x: state.player.x, y: state.player.y - 28, vy: -780, r: 4, color: "#72f3ff" });
  state.player.cooldown = 0.18;
}

function enemyFire() {
  const candidates = state.enemies.filter((enemy) => !state.enemies.some((other) => other.col === enemy.col && other.row > enemy.row));
  const shooter = candidates[Math.floor(Math.random() * candidates.length)];
  if (!shooter) return;
  state.enemyShots.push({ x: shooter.x, y: shooter.y + 20, vy: 210 + state.wave * 12, r: 5, color: shooter.kind === "missile" ? "#ff5f7d" : "#ffd15c" });
}

function update(dt) {
  if (!state.running || state.paused || state.briefing) {
    updateParticles(dt);
    return;
  }
  const tune = difficultyTune();
  const left = keys.has("ArrowLeft") || keys.has("a");
  const right = keys.has("ArrowRight") || keys.has("d");
  const target = (right ? 1 : 0) - (left ? 1 : 0);
  state.player.vx += (target * 560 - state.player.vx) * frameEase(11, dt);
  state.player.x = clamp(state.player.x + state.player.vx * dt, 34, state.w - 34);
  state.player.cooldown = Math.max(0, state.player.cooldown - dt);
  state.player.invuln = Math.max(0, state.player.invuln - dt);
  if (keys.has(" ") || keys.has("Space")) fire();
  if (keys.has("e") && state.intel >= 100) openBriefing("Manual Intel Burst Armed");

  const edge = state.enemies.some((enemy) => enemy.x > state.w - 34 || enemy.x < 34);
  if (edge) {
    state.enemyDir *= -1;
    state.enemies.forEach((enemy) => enemy.y += 16 + state.wave * 0.6);
  }
  state.enemyStep += dt * (24 + state.wave * 3.4) * tune.speed;
  state.enemies.forEach((enemy) => {
    enemy.x += state.enemyDir * dt * (22 + state.wave * 2.2) * tune.speed;
    enemy.y += Math.sin(state.enemyStep * 0.06 + enemy.phase) * 0.08;
  });
  if (state.boss) state.boss.x = state.w / 2 + Math.sin(performance.now() / 820) * Math.min(180, state.w * 0.18);

  state.enemyFire -= dt;
  if (state.enemyFire <= 0) {
    enemyFire();
    state.enemyFire = Math.max(0.26, (1.35 - state.wave * 0.045) * tune.fire);
  }

  state.bullets.forEach((b) => b.y += b.vy * dt);
  state.enemyShots.forEach((b) => b.y += b.vy * dt);
  state.bullets = state.bullets.filter((b) => b.y > -30);
  state.enemyShots = state.enemyShots.filter((b) => b.y < state.h + 40);
  collide();
  updateParticles(dt);
  state.intel = Math.min(100, state.intel + dt * (4.8 + state.wave * 0.28));
  state.shake = Math.max(0, state.shake - dt * 1.9);
  state.toastTime = Math.max(0, state.toastTime - dt);
  if (state.enemies.some((enemy) => enemy.y > state.h - 150)) {
    state.shield = Math.max(0, state.shield - dt * 18 * tune.shield);
  }
  if (!state.enemies.length && !state.boss) {
    state.nextWave -= dt;
    if (state.nextWave <= 0) {
      state.wave += 1;
      state.intel = Math.min(100, state.intel + 35);
      spawnWave();
    }
  } else {
    state.nextWave = 1.15;
  }
  if (state.shield <= 0) finish(false);
  updateHud();
}

function collide() {
  for (const bullet of state.bullets) {
    for (const enemy of state.enemies) {
      if (Math.abs(bullet.x - enemy.x) < enemy.w * 0.58 && Math.abs(bullet.y - enemy.y) < enemy.h * 0.75) {
        bullet.dead = true;
        enemy.hp -= 1;
        if (enemy.hp <= 0) {
          enemy.dead = true;
          state.score += 120 + state.wave * 14;
          state.intel = Math.min(100, state.intel + 5.5);
          explode(enemy.x, enemy.y, enemy.kind === "missile" ? "#ff5f7d" : "#72f3ff", 16);
        } else {
          explode(enemy.x, enemy.y, "#ffd15c", 8);
        }
      }
    }
    if (state.boss && Math.abs(bullet.x - state.boss.x) < state.boss.w / 2 && Math.abs(bullet.y - state.boss.y) < state.boss.h) {
      bullet.dead = true;
      state.intel = Math.min(100, state.intel + 8);
      state.score += 60;
      explode(bullet.x, bullet.y, "#ffd15c", 10);
      if (state.intel >= 100) setToast("ANSWER INTEL TO DAMAGE CRISIS", 0.9);
    }
  }
  state.bullets = state.bullets.filter((bullet) => !bullet.dead);
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
  for (const shot of state.enemyShots) {
    if (state.player.invuln <= 0 && Math.abs(shot.x - state.player.x) < 30 && Math.abs(shot.y - state.player.y) < 28) {
      shot.dead = true;
      state.player.invuln = 1.1;
      state.shield = Math.max(0, state.shield - 8 * difficultyTune().shield);
      state.shake = Math.max(state.shake, 0.36);
      explode(state.player.x, state.player.y, "#ff5f7d", 22);
      if (state.intel >= 45) openBriefing("Emergency Hotline Question");
    }
  }
  state.enemyShots = state.enemyShots.filter((shot) => !shot.dead);
}

function explode(x, y, color, count) {
  if (reduceMotion) return;
  state.particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.46,
    max: 0.46,
    size: count > 20 ? 92 : 62,
    color,
    sprite: true
  });
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 260;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.45,
      max: 0.8,
      size: 2 + Math.random() * 5,
      color
    });
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.96, dt * 60);
    p.vy *= Math.pow(0.96, dt * 60);
    return p.life > 0;
  });
}

function updateHud() {
  els.score.textContent = Math.round(state.score).toLocaleString();
  els.wave.textContent = String(state.wave);
  els.shield.textContent = `${Math.max(0, Math.round(state.shield))}%`;
  els.intel.textContent = `${Math.round(state.intel)}%`;
  els.topStats.innerHTML = [
    `${Math.round(state.score).toLocaleString()} pts`,
    `Wave ${state.wave}`,
    state.intel >= 100 ? "Intel armed" : `${Math.round(state.intel)}% intel`
  ].map((item) => `<span>${esc(item)}</span>`).join("");
}

function finish(won = true) {
  if (!state.running) return;
  state.running = false;
  state.over = true;
  els.results.classList.remove("hidden");
  const accuracy = state.answered ? Math.round(state.correct / state.answered * 100) : 0;
  els.resultTitle.textContent = won || state.wave >= 4 ? "Containment Held" : "Satellite Line Broken";
  els.resultMetrics.innerHTML = [
    [Math.round(state.score).toLocaleString(), "score"],
    [state.wave, "wave reached"],
    [`${state.correct}/${state.answered}`, "intel questions"],
    [`${accuracy}%`, "accuracy"]
  ].map(([big, label]) => `<div class="metric"><strong>${esc(big)}</strong><span>${esc(label)}</span></div>`).join("");
  els.coach.textContent = accuracy >= 85
    ? "Strong Cold War command. Move into U.S. or Global Regents practice and keep using exact policy names."
    : accuracy >= 60
      ? "Good defense. Replay the same theater and focus on alliances, crisis names, and containment vocabulary."
      : "Replay on Cadet and slow down on the intel briefings. Cold War review rewards precise terms.";
  window.MrMacsAnalytics?.track("game_complete", {
    gameId: "cold-war-invaders",
    title: "Cold War Invaders",
    score: accuracy,
    questions: state.answered,
    weakTopics: accuracy < 70 ? ["Cold War vocabulary", "Containment and crisis events"] : []
  }, { counter: "game-completions" });
}

function draw() {
  ctx.clearRect(0, 0, state.w, state.h);
  ctx.save();
  if (state.shake > 0) ctx.translate(Math.sin(performance.now() / 22) * state.shake * 18, Math.cos(performance.now() / 27) * state.shake * 12);
  drawSpace();
  drawEarth();
  drawBoss();
  state.enemies.forEach(drawEnemy);
  state.bullets.forEach((bullet) => drawShot(bullet, true));
  state.enemyShots.forEach((shot) => drawShot(shot, false));
  drawPlayer();
  drawParticles();
  ctx.restore();
  drawOverlay();
}

function drawSpace() {
  const t = performance.now() / 1000;
  const g = ctx.createLinearGradient(0, 0, 0, state.h);
  g.addColorStop(0, "#09143a");
  g.addColorStop(0.55, "#050815");
  g.addColorStop(1, "#03050d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, state.w, state.h);
  if (ASSETS.ready) {
    const tileW = 320;
    const tileH = 96;
    const ox = -((t * 22) % tileW);
    const oy = -((t * 12) % tileH);
    for (let y = oy; y < state.h + tileH; y += tileH) {
      for (let x = ox; x < state.w + tileW; x += tileW) {
        drawSprite("starTile", x + tileW / 2, y + tileH / 2, tileW, tileH, { alpha: 0.62 });
      }
    }
  }
  state.stars.forEach((star) => {
    star.y += star.speed * 0.0008;
    if (star.y > state.h) star.y = 0;
    ctx.globalAlpha = 0.38 + Math.sin(t * 2 + star.twinkle) * 0.22;
    ctx.fillStyle = star.color;
    ctx.fillRect(star.x, star.y, star.r, star.r);
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(114,243,255,.10)";
  ctx.lineWidth = 1;
  const grid = 72;
  const offset = (t * 18) % grid;
  for (let x = -grid; x < state.w + grid; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x + offset, 0);
    ctx.lineTo(x - offset * 2, state.h);
    ctx.stroke();
  }
}

function drawEarth() {
  if (ASSETS.ready) {
    drawSprite("earth", state.w / 2, state.h - 26, Math.max(state.w * 1.02, 760), 118, { alpha: 0.95 });
    const wallAlpha = clamp(state.shield / 100, 0.18, 0.78);
    for (let x = -140; x < state.w + 180; x += 390) {
      drawSprite("wall", x + 195, state.h - 132, 390, 76, { alpha: wallAlpha });
    }
    return;
  }
  const y = state.h + 86;
  const r = Math.max(state.w * 0.58, 360);
  const g = ctx.createRadialGradient(state.w / 2, y - 120, 50, state.w / 2, y, r);
  g.addColorStop(0, "rgba(114,243,255,.42)");
  g.addColorStop(0.45, "rgba(26,82,116,.52)");
  g.addColorStop(0.75, "rgba(11,22,42,.85)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(state.w / 2, y, r, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(114,243,255,.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(state.w / 2, y, r * 0.94, Math.PI + 0.12, Math.PI * 1.88);
  ctx.stroke();
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0) ctx.globalAlpha = 0.45;
  if (drawSprite("player", 0, -5, 106, 76, { alpha: p.invuln > 0 ? 0.68 : 1 })) {
    ctx.strokeStyle = state.intel >= 100 ? "#ffd15c" : "#6df2a8";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, 58 + Math.sin(performance.now() / 120) * 3, 44, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.beginPath();
  ctx.ellipse(0, 28, 52, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#dfefff";
  ctx.strokeStyle = "#72f3ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(34, 22);
  ctx.lineTo(13, 16);
  ctx.lineTo(0, 32);
  ctx.lineTo(-13, 16);
  ctx.lineTo(-34, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#06111f";
  ctx.fillRect(-7, -6, 14, 18);
  ctx.strokeStyle = state.intel >= 100 ? "#ffd15c" : "#6df2a8";
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.ellipse(0, 0, 52 + Math.sin(performance.now() / 120) * 3, 42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const pulse = Math.sin(performance.now() / 180 + enemy.phase) * 2;
  const color = {
    satellite: "#72f3ff",
    missile: "#ff5f7d",
    drone: "#ffd15c",
    sputnik: "#b892ff",
    radar: "#6df2a8"
  }[enemy.kind] || "#72f3ff";
  const spriteName = {
    satellite: "satellite",
    missile: "missile",
    drone: "sputnik",
    sputnik: "sputnik",
    radar: "radar"
  }[enemy.kind] || "sputnik";
  const spriteSize = {
    satellite: [58, 34],
    missile: [32, 48],
    drone: [40, 46],
    sputnik: [40, 46],
    radar: [46, 40]
  }[enemy.kind] || [42, 42];
  if (drawSprite(spriteName, 0, pulse, spriteSize[0], spriteSize[1])) {
    if (state.w > 760 && enemy.y < state.h * 0.62) {
      ctx.font = "900 8px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText(enemy.label.toUpperCase(), 0, 32);
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = "rgba(0,0,0,.38)";
  ctx.beginPath();
  ctx.ellipse(0, enemy.h * 0.7, enemy.w * 0.62, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 2.5;
  if (enemy.kind === "missile") {
    ctx.beginPath();
    ctx.moveTo(0, -20 - pulse);
    ctx.lineTo(16, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-16, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.kind === "satellite") {
    ctx.strokeRect(-8, -10 + pulse, 16, 20);
    ctx.strokeRect(-33, -6 + pulse, 18, 12);
    ctx.strokeRect(15, -6 + pulse, 18, 12);
  } else {
    ctx.beginPath();
    ctx.arc(0, pulse, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-30, pulse);
    ctx.lineTo(30, pulse);
    ctx.stroke();
  }
  if (state.w > 760 && enemy.y < state.h * 0.62) {
    ctx.font = "800 8px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.fillText(enemy.label.toUpperCase(), 0, 31);
  }
  ctx.restore();
}

function drawBoss() {
  if (!state.boss) return;
  const boss = state.boss;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  if (drawSprite("boss", 0, 8, Math.min(330, boss.w), 154, { alpha: 0.96 })) {
    ctx.fillStyle = "#ffd15c";
    ctx.font = "950 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(boss.title, 0, -50);
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(-boss.w * 0.36, 72, boss.w * 0.72, 8);
    ctx.fillStyle = "#ff5f7d";
    ctx.fillRect(-boss.w * 0.36, 72, boss.w * 0.72 * boss.hp / boss.max, 8);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "rgba(255,95,125,.12)";
  ctx.strokeStyle = "#ff5f7d";
  ctx.lineWidth = 3;
  roundRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ff5f7d";
  ctx.font = "950 13px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(boss.title, 0, 4);
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.fillRect(-boss.w * 0.38, boss.h / 2 + 10, boss.w * 0.76, 8);
  ctx.fillStyle = "#ffd15c";
  ctx.fillRect(-boss.w * 0.38, boss.h / 2 + 10, boss.w * 0.76 * boss.hp / boss.max, 8);
  ctx.restore();
}

function drawShot(shot, player) {
  const sprite = player ? (state.intel >= 100 ? "laserGreen" : "laserCyan") : "laserRed";
  if (drawSprite(sprite, shot.x, shot.y, player ? 16 : 18, player ? 58 : 50, { alpha: 0.96 })) return;
  ctx.save();
  ctx.strokeStyle = shot.color;
  ctx.lineWidth = player ? 4 : 5;
  ctx.shadowColor = shot.color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(shot.x, shot.y - (player ? 18 : 8));
  ctx.lineTo(shot.x, shot.y + (player ? 8 : 18));
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  state.particles.forEach((p) => {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    if (p.sprite) {
      const frame = clamp(Math.floor((1 - p.life / p.max) * 4) + 1, 1, 4);
      const size = p.size * (1 + (1 - p.life / p.max) * 0.28);
      drawSprite(`explosion${frame}`, p.x, p.y, size, size, { alpha: ctx.globalAlpha });
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1;
  });
}

function drawOverlay() {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#000";
  for (let y = 0; y < state.h; y += 5) ctx.fillRect(0, y, state.w, 1);
  ctx.globalAlpha = 1;
  if (state.toastTime > 0) {
    ctx.globalAlpha = clamp(state.toastTime, 0, 1);
    ctx.font = "950 28px Inter, sans-serif";
    ctx.textAlign = "center";
    const width = Math.min(state.w - 36, ctx.measureText(state.toast).width + 44);
    ctx.fillStyle = "rgba(5,9,21,.78)";
    ctx.strokeStyle = "#72f3ff";
    roundRect(state.w / 2 - width / 2, state.h * 0.18, width, 52, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f8fbff";
    ctx.fillText(state.toast, state.w / 2, state.h * 0.18 + 34);
  }
  if (state.paused) {
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#050815";
    ctx.fillRect(0, 0, state.w, state.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f8fbff";
    ctx.font = "950 48px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", state.w / 2, state.h / 2);
  }
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loop(now) {
  if (!state.running) return;
  const dt = Math.min(0.04, (now - (state.last || now)) / 1000);
  state.last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.add(key);
  if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if (event.key === " " || event.code === "Space") fire();
  if ((event.key === "e" || event.key === "E") && state.intel >= 100) openBriefing("Manual Intel Burst Armed");
  if (event.key === "Escape" && state.running && !state.briefing) {
    state.paused = !state.paused;
    els.pause.textContent = state.paused ? "Resume" : "Pause";
  }
});

document.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

els.canvas.addEventListener("pointermove", (event) => {
  if (!state.running || state.briefing) return;
  state.player.x = clamp(event.clientX, 34, state.w - 34);
});
els.canvas.addEventListener("pointerdown", (event) => {
  if (!state.running) return;
  state.player.x = clamp(event.clientX, 34, state.w - 34);
  if (state.intel >= 100 && event.clientY < state.h * 0.42) openBriefing("Touch Intel Burst Armed");
  else fire();
});

els.start.addEventListener("click", startGame);
els.again.addEventListener("click", () => {
  els.results.classList.add("hidden");
  els.setup.classList.add("show");
  renderMetrics();
});
els.pause.addEventListener("click", () => {
  if (!state.running || state.briefing) return;
  state.paused = !state.paused;
  els.pause.textContent = state.paused ? "Resume" : "Pause";
});
els.quit.addEventListener("click", () => finish(false));
els.theater.addEventListener("change", () => {
  state.theater = els.theater.value;
  renderMetrics();
});
els.difficulty.addEventListener("change", () => {
  state.difficulty = els.difficulty.value;
  renderMetrics();
});

addEventListener("resize", resize, { passive: true });
resize();
loadBank();
draw();
