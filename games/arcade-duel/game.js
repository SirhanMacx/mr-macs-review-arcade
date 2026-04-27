/* global MrMacsAnalytics */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  bank: null,
  course: "All Courses",
  set: "All Sets",
  length: 25,
  run: null,
  stageTimer: null,
  sound: null
};

function esc(text) {
  return (text ?? "").toString().replace(/[&<>\"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function playSound(kind) {
  try {
    state.sound = state.sound || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = state.sound;
    const now = ctx.currentTime;
    const patterns = {
      start: [[220, 0], [330, 0.05], [440, 0.1]],
      hit: [[520, 0], [780, 0.04], [1040, 0.08]],
      miss: [[180, 0], [120, 0.06]],
      wave: [[392, 0], [588, 0.05], [784, 0.1], [1176, 0.15]],
      power: [[620, 0], [930, 0.05]]
    };
    for (const [freq, delay] of patterns[kind] || patterns.hit) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === "miss" ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(kind === "miss" ? 0.035 : 0.026, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    }
  } catch (err) {
    // Audio is optional and may be blocked until a user gesture.
  }
}

function bankQuestions() {
  const qs = state.bank?.questions || [];
  return qs.filter((q) => {
    if (state.course !== "All Courses" && q.course !== state.course) return false;
    if (state.set !== "All Sets" && q.set !== state.set) return false;
    return true;
  });
}

function renderSetOptions() {
  const qs = state.bank?.questions || [];
  const sets = uniq(qs.filter((q) => state.course === "All Courses" || q.course === state.course).map((q) => q.set));
  $("#setSelect").innerHTML = ["All Sets", ...sets].map((s) => `<option>${esc(s)}</option>`).join("");
  if (!sets.includes(state.set)) state.set = "All Sets";
  $("#setSelect").value = state.set;
}

function renderSetupMetrics() {
  const qs = bankQuestions();
  const stim = qs.filter((q) => (q.stimulusImages || []).length).length;
  $("#setupMetrics").innerHTML = `<strong>${qs.length}</strong> available MCQs · <strong>${stim}</strong> with stimulus crops`;
}

function setScreen(id) {
  $("#setup").classList.toggle("hidden", id !== "setup");
  $("#duel").classList.toggle("hidden", id !== "duel");
  $("#end").classList.toggle("hidden", id !== "end");
}

function startRun() {
  const pool = bankQuestions();
  const items = shuffle(pool.slice());
  const maxLen = state.length === 999 ? items.length : Math.min(Number(state.length), items.length);
  state.run = {
    items: items.slice(0, maxLen),
    index: 0,
    correct: 0,
    missed: [],
    youHp: 3,
    energy: 0,
    streak: 0,
    wave: 1,
    enemyMax: 6,
    enemyHp: 6
  };
  $("#missionTitle").textContent = state.set === "All Sets" ? state.course : state.set;
  $("#missionMeta").textContent = `${state.course} · ${state.set} · ${maxLen === items.length ? "Endless" : maxLen + " Q"}`;
  playSound("start");
  setScreen("duel");
  renderBars();
  renderQuestion();
}

function renderBars() {
  const r = state.run;
  const bossWave = r.wave % 3 === 0;
  $("#waveText").textContent = `Wave ${r.wave}`;
  $("#energyText").textContent = String(r.energy);
  $("#streakText").textContent = String(r.streak);

  $("#youHpText").textContent = String(r.youHp);
  $("#enemyHpText").textContent = String(r.enemyHp);
  $("#enemyName").textContent = bossWave ? "Boss" : "Enemy";
  $("#enemyStageName").textContent = bossWave ? "Knowledge Titan" : "Source Warden";
  $("#enemyAvatar").classList.toggle("boss", bossWave);
  $("#stageCallout").textContent = bossWave ? `Boss ${r.enemyHp}/${r.enemyMax}` : `Wave ${r.wave} · ${r.enemyHp}/${r.enemyMax}`;
  $("#youBar").style.width = `${(r.youHp / 3) * 100}%`;
  $("#enemyBar").style.width = `${(r.enemyHp / r.enemyMax) * 100}%`;

  $("#eliminateBtn").disabled = r.energy < 2 || r.answered;
  $("#repairBtn").disabled = r.energy < 3 || r.youHp >= 3 || r.answered;
}

function flashStage(kind, label) {
  const stage = $("#combatStage");
  stage.classList.remove("hit-enemy", "hit-player");
  stage.offsetWidth;
  stage.classList.add(kind);
  $("#stageCallout").textContent = label;
  clearTimeout(state.stageTimer);
  state.stageTimer = setTimeout(() => stage.classList.remove("hit-enemy", "hit-player"), 520);
}

function current() {
  return state.run.items[state.run.index];
}

function renderStimulus(q) {
  const panel = $("#stimulusPanel");
  const strip = $("#stimulusStrip");
  const imgs = q.stimulusImages || [];
  panel.classList.toggle("hidden", imgs.length === 0);
  strip.innerHTML = imgs.map((img, i) => (
    `<figure><img loading="lazy" src="${esc(img.src)}" alt="${esc(img.label || ("Stimulus image " + (i + 1)))}"><figcaption>${esc(img.label || ("Stimulus image " + (i + 1)))}</figcaption></figure>`
  )).join("");
}

function renderQuestion() {
  const r = state.run;
  const q = current();
  r.answered = false;
  $("#feedback").classList.add("hidden");
  $("#nextBtn").classList.add("hidden");

  const tags = [
    q.course,
    q.day,
    q.set,
    (q.stimulusRequired ? "Stimulus Based" : ((q.stimulusImages || []).length ? "Stimulus" : "Content Recall")),
    q.source
  ];
  $("#qTags").innerHTML = tags.filter(Boolean).slice(0, 5).map((t) => `<span>${esc(t)}</span>`).join("");
  $("#qStem").textContent = q.stem;
  renderStimulus(q);

  $("#choices").innerHTML = q.choices.map((c) => (
    `<button class="choice" data-choice="${esc(c.label)}" type="button"><strong>${esc(c.label)}</strong><span>${esc(c.text)}</span></button>`
  )).join("");
  $$(".choice").forEach((btn) => btn.addEventListener("click", () => choose(btn.dataset.choice)));
  renderBars();
}

function eliminateTwo() {
  const r = state.run;
  if (r.energy < 2 || r.answered) return;
  const q = current();
  const wrong = q.choices.map((c) => c.label).filter((lab) => lab !== q.correct);
  shuffle(wrong);
  const disable = wrong.slice(0, 2);
  $$(".choice").forEach((btn) => {
    if (disable.includes(btn.dataset.choice)) btn.disabled = true;
  });
  r.energy -= 2;
  playSound("power");
  renderBars();
}

function repair() {
  const r = state.run;
  if (r.energy < 3 || r.youHp >= 3 || r.answered) return;
  r.energy -= 3;
  r.youHp = Math.min(3, r.youHp + 1);
  playSound("power");
  renderBars();
}

function choose(label) {
  const r = state.run;
  const q = current();
  if (r.answered) return;
  r.answered = true;

  const correct = label === q.correct;
  let stageMessage = correct ? "Direct hit" : "Shield cracked";
  if (correct) {
    r.correct += 1;
    r.streak += 1;
    r.energy = Math.min(9, r.energy + 1);
    r.enemyHp -= 1;
  } else {
    r.streak = 0;
    r.youHp -= 1;
    r.missed.push(q);
  }

  $$(".choice").forEach((btn) => {
    const lab = btn.dataset.choice;
    btn.disabled = true;
    if (lab === q.correct) btn.classList.add("correct");
    if (lab === label && !correct) btn.classList.add("wrong");
  });

  $("#feedback").innerHTML = `<strong>${correct ? "Hit!" : "Miss."}</strong><p>${esc(q.explanation || ("Correct answer: " + (q.choices.find((c) => c.label === q.correct)?.text || "")))}</p>`;
  $("#feedback").classList.remove("hidden");

  if (r.enemyHp <= 0) {
    r.wave += 1;
    r.enemyMax = Math.min(12, 5 + r.wave);
    r.enemyHp = r.enemyMax;
    r.energy = Math.min(9, r.energy + 1);
    $("#feedback").innerHTML += `<p><strong>Enemy down.</strong> New wave incoming.</p>`;
    stageMessage = "Wave cleared";
  }

  $("#nextBtn").classList.remove("hidden");
  renderBars();
  playSound(stageMessage === "Wave cleared" ? "wave" : (correct ? "hit" : "miss"));
  flashStage(correct ? "hit-enemy" : "hit-player", stageMessage);
}

function next() {
  const r = state.run;
  if (r.youHp <= 0) return finish(false);
  r.index += 1;
  if (r.index >= r.items.length) return finish(true);
  renderQuestion();
}

function finish(won) {
  const r = state.run;
  const played = r.index + (r.answered ? 1 : 0);
  const acc = played ? Math.round((r.correct / played) * 100) : 0;

  MrMacsAnalytics?.track("game_complete", {
    gameId: "arcade-duel",
    title: "Arcade Duel",
    score: r.wave - 1,
    accuracy: acc,
    questions: played
  }, { counter: "game-completions" });

  $("#endTitle").textContent = won ? "Run complete" : "Defeated";
  $("#endMeta").textContent = `${state.course} · ${state.set}`;
  $("#endGrid").innerHTML = [
    [r.wave - 1, "waves cleared"],
    [acc + "%", "accuracy"],
    [r.correct + "/" + played, "correct"]
  ].map(([v, k]) => `<div class="metric"><strong>${esc(v)}</strong><span>${esc(k)}</span></div>`).join("");
  $("#missedList").innerHTML = r.missed.length
    ? r.missed.slice(0, 10).map((q) => `<div class="missed-item"><strong>${esc(q.stem)}</strong><p>${esc(q.course + " · " + q.day + " · " + q.source)}</p><p>${esc(q.explanation || "")}</p></div>`).join("")
    : `<div class="missed-item"><strong>No missed questions.</strong><p>Raise the run length to test endurance.</p></div>`;

  setScreen("end");
}

async function load() {
  try {
    const res = await fetch("../../data/regents-gauntlet-bank.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to load bank: " + res.status);
    state.bank = await res.json();

    const qs = state.bank.questions || [];
    $("#courseSelect").innerHTML = ["All Courses", ...uniq(qs.map((q) => q.course))].map((c) => `<option>${esc(c)}</option>`).join("");
    renderSetOptions();
    renderSetupMetrics();
    $("#loadStatus").textContent = `Loaded ${qs.length} MCQs.`;
  } catch (err) {
    console.error(err);
    $("#loadStatus").textContent = "Failed to load bank.";
    $("#startBtn").disabled = true;
  }
}

$("#courseSelect").addEventListener("change", (e) => {
  state.course = e.target.value;
  renderSetOptions();
  renderSetupMetrics();
});
$("#setSelect").addEventListener("change", (e) => {
  state.set = e.target.value;
  renderSetupMetrics();
});
$("#lengthSelect").addEventListener("change", (e) => {
  state.length = Number(e.target.value);
  renderSetupMetrics();
});

$("#startBtn").addEventListener("click", startRun);
$("#nextBtn").addEventListener("click", next);
$("#againBtn").addEventListener("click", () => {
  state.run = null;
  setScreen("setup");
  renderSetupMetrics();
});
$("#eliminateBtn").addEventListener("click", eliminateTwo);
$("#repairBtn").addEventListener("click", repair);
$("#toggleStimulus").addEventListener("click", () => $("#stimulusPanel").classList.toggle("expanded"));

$("#openHub").addEventListener("click", () => {
  if (window.top === window) location.href = "../../index.html#library";
  else window.parent.postMessage({ type: "mrmac_arcade_close" }, "*");
});

document.addEventListener("keydown", (e) => {
  if (!state.run || $("#duel").classList.contains("hidden")) return;
  if (e.key >= "1" && e.key <= "4") choose(e.key);
  if (e.key === "Enter" && !$("#nextBtn").classList.contains("hidden")) next();
});

load();
