(() => {
  "use strict";

  const BASE_W = 1600;
  const BASE_H = 900;
  const STORAGE_KEY = "mr-macs-timeline-runner-v1";
  const $ = (id) => document.getElementById(id);

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

  const assetPaths = {
    background: "../../assets/timeline-runner/runner-track.png",
    sprites: "../../assets/timeline-runner/runner-sprites.png"
  };

  const SPRITES = {
    runner: 0,
    orb: 1,
    scroll: 2,
    shield: 3,
    comet: 4,
    compass: 5,
    gateCyan: 6,
    gateGold: 7,
    gatePink: 8,
    column: 9,
    crate: 10,
    barrier: 11,
    shard: 12,
    dronePurple: 13,
    droneBlue: 14,
    portal: 15
  };

  const intensityProfiles = {
    standard: { label: "Standard run", speed: 1, gateEvery: 7.6, obstacleEvery: 1.05, pickupEvery: 3.2 },
    exam: { label: "Exam sprint", speed: 1.13, gateEvery: 6.5, obstacleEvery: .86, pickupEvery: 3.8 },
    endless: { label: "Endless chaos", speed: 1.26, gateEvery: 5.9, obstacleEvery: .72, pickupEvery: 4.2 }
  };

  const laneNames = ["left", "center", "right"];
  const gateColors = ["#75ecff", "#f5c451", "#ff7bcc"];
  const images = {};

  const player = {
    lane: 1,
    visualLane: 1,
    jumpTime: 0,
    slideTime: 0,
    invulnerable: 0
  };

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
    distance: 0,
    score: 0,
    correct: 0,
    answered: 0,
    streak: 0,
    health: 3,
    shields: 0,
    boost: 0,
    speedPace: 1,
    currentQuestion: null,
    currentChoices: [],
    gateActive: null,
    nextGateId: 1,
    gateTimer: 2.4,
    obstacleTimer: 1.4,
    pickupTimer: 2.2,
    objects: [],
    particles: [],
    texts: [],
    wrongs: [],
    feedbackUntil: 0,
    shake: 0,
    flash: 0,
    assetsReady: false,
    bestScore: Number(localStorage.getItem(`${STORAGE_KEY}:bestScore`) || 0),
    pointerStart: null,
    sawFirstGate: false,
    runCourse: "All Courses",
    runSet: "All Sets",
    runIntensity: "standard",
    checkpointMode: "standby",
    debriefUntil: 0,
    stage: { scale: 1, ox: 0, oy: 0, width: BASE_W, height: BASE_H }
  };

  class AudioBus {
    constructor() {
      this.ctx = null;
      this.nextBeat = 0;
      this.step = 0;
    }

    ensure() {
      if (!state.sound) return null;
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }

    tone(freq, duration = .08, type = "sine", gain = .03, when = 0) {
      const audio = this.ensure();
      if (!audio) return;
      const start = audio.currentTime + when;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      amp.gain.setValueAtTime(.0001, start);
      amp.gain.exponentialRampToValueAtTime(Math.max(gain, .0002), start + .012);
      amp.gain.exponentialRampToValueAtTime(.0001, start + duration);
      osc.connect(amp).connect(audio.destination);
      osc.start(start);
      osc.stop(start + duration + .04);
    }

    noise(duration = .08, gain = .035) {
      const audio = this.ensure();
      if (!audio) return;
      const bufferSize = Math.max(1, Math.floor(audio.sampleRate * duration));
      const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const source = audio.createBufferSource();
      const amp = audio.createGain();
      amp.gain.value = gain;
      source.buffer = buffer;
      source.connect(amp).connect(audio.destination);
      source.start();
    }

    lane() { this.tone(360 + player.lane * 90, .045, "triangle", .018); }
    jump() { this.tone(520, .06, "sine", .022); this.tone(820, .08, "triangle", .016, .035); }
    slide() { this.tone(180, .07, "sawtooth", .015); }
    pickup() { this.tone(760, .055, "triangle", .026); this.tone(1120, .08, "sine", .018, .05); }
    shield() { this.tone(440, .08, "sine", .024); this.tone(660, .10, "sine", .018, .07); }
    boost() { this.tone(220, .08, "sawtooth", .018); this.tone(880, .13, "triangle", .022, .08); }
    hit() { this.noise(.12, .05); this.tone(120, .16, "sawtooth", .03); }
    correct() {
      this.tone(640, .08, "triangle", .038);
      this.tone(960, .10, "triangle", .03, .07);
      this.tone(1280, .13, "sine", .025, .14);
    }
    wrong() {
      this.tone(210, .13, "sawtooth", .034);
      this.tone(145, .18, "sawtooth", .025, .11);
    }
    start() {
      this.tone(220, .09, "sine", .03);
      this.tone(440, .12, "triangle", .026, .08);
      this.tone(880, .15, "sine", .024, .17);
      this.nextBeat = 0;
    }

    music(now) {
      if (!state.running || state.paused || state.gameOver || reduceMotion) return;
      const audio = this.ensure();
      if (!audio) return;
      if (now < this.nextBeat) return;
      const pace = .56 / Math.max(.85, Math.min(1.6, state.speedPace));
      const root = state.boost > 0 ? 146.83 : 130.81;
      const note = [0, 7, 12, 7, 3, 10, 12, 15][this.step % 8];
      if (this.step % 4 === 0) this.tone(root, .08, "sine", .016);
      if (this.step % 2 === 0) this.tone(root * Math.pow(2, note / 12), .07, "triangle", .012, .02);
      if (this.step % 8 === 7) this.tone(root * 4, .04, "sine", .01, .06);
      this.step += 1;
      this.nextBeat = now + pace;
    }
  }
  const audio = new AudioBus();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - clamp(t, 0, 1), 2.4);
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function formatNumber(value) {
    return Math.max(0, Math.floor(value)).toLocaleString();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\b(the|a|an)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .replace(/\bcon\s+icts\b/gi, "conflicts")
      .replace(/\bUnited states\b/g, "United States")
      .replace(/\bu\.s\.\b/gi, "U.S.")
      .replace(/\bnys\b/gi, "NYS")
      .trim();
  }

  function displayPrompt(q) {
    const raw = cleanText(q?.prompt || "");
    const cleaned = raw
      .replace(/^final\s+clue(?:\s+for\s+[^:]+)?:\s*/i, "")
      .replace(/^name\s+this\s+content\s+item:\s*/i, "")
      .replace(/^this\s+is\s+his\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+her\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+/i, "Identify: ")
      .replace(/^these\s+are\s+/i, "Identify: ")
      .trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : raw;
  }

  function displayExplanation(q) {
    const explanation = cleanText(q?.explanation || "");
    if (explanation) return explanation;
    if (q?.answer) return `Correct answer: ${cleanText(q.answer)}.`;
    return "Review this item again before the exam.";
  }

  const sourcePromptRe = /(\bthis\s+(amendment|document|letter|speech|excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(issues|documents|statements|headlines|conditions|changes|questions|figures)\b|\b(shown|pictured|illustrated|above|below|accompanying)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\b|\bbased\s+on\s+(the|this)\b|similar\s+to\s+this)/i;

  function promptNeedsStimulus(q) {
    return sourcePromptRe.test(String((q && (q.prompt || q.stem)) || ""));
  }

  function stimulusImagesFor(q) {
    if (!q) return [];
    const list = Array.isArray(q.stimulusImages) ? q.stimulusImages : [];
    const images = list.length ? list : (q.stimulusImage ? [{ src: q.stimulusImage, label: "Source stimulus" }] : []);
    if (!images.length) return [];
    if (q.stimulusRequired === true || q.stimulusImage || q.stimulusText || q.stimulusHtml || typeof q.stimulus === "string") {
      return images.filter((image) => image && image.src);
    }
    if (q.stimulusRequired === false) return [];
    return promptNeedsStimulus(q) ? images.filter((image) => image && image.src) : [];
  }

  function hasReliableStimulus(q) {
    return Boolean((q && (q.stimulus || q.stimulusText || q.stimulusHtml)) || stimulusImagesFor(q).length);
  }

  function isPlayableQuestion(q) {
    if (!q || !q.prompt || !q.answer) return false;
    if (q.type !== "mcq") return true;
    if (hasReliableStimulus(q)) return true;
    return !promptNeedsStimulus(q);
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function loadAssets() {
    const [background, sprites] = await Promise.all([
      loadImage(assetPaths.background),
      loadImage(assetPaths.sprites)
    ]);
    images.background = background;
    images.sprites = sprites ? makeTransparentSheet(sprites) : null;
    state.assetsReady = true;
  }

  function makeTransparentSheet(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const sheet = canvas.getContext("2d", { willReadFrequently: true });
    sheet.drawImage(img, 0, 0);
    const pixels = sheet.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixels.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const avg = (r + g + b) / 3;
      if (max < 42 || (avg < 55 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18)) {
        data[i + 3] = 0;
      } else if (max < 74) {
        data[i + 3] = Math.min(data[i + 3], 110);
      }
    }
    sheet.putImageData(pixels, 0, 0);
    return canvas;
  }

  async function loadBank() {
    els.startBtn.disabled = true;
    els.startBtn.textContent = "Loading...";
    const response = await fetch("../../data/chrono-defense-bank.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Question bank failed: ${response.status}`);
    state.bank = await response.json();
    state.bank.questions = (state.bank.questions || []).filter(isPlayableQuestion);
    rebuildSetIndex();
    populateFilters();
    applyFilters();
    els.startBtn.disabled = false;
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
      Object.entries(setsByCourse).map(([course, sets]) => [
        course,
        [...sets].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      ])
    );
  }

  function populateFilters() {
    const courses = ["All Courses", ...state.bank.courses];
    els.courseFilter.innerHTML = courses
      .map((course) => `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`)
      .join("");
    populateSets();
  }

  function populateSets() {
    const course = els.courseFilter.value || "All Courses";
    const sets = course === "All Courses" ? ["All Sets"] : ["All Sets", ...(state.bank.setsByCourse[course] || [])];
    els.setFilter.innerHTML = sets
      .map((set) => `<option value="${escapeHtml(set)}">${escapeHtml(set)}</option>`)
      .join("");
  }

  function applyFilters() {
    const course = els.courseFilter.value || "All Courses";
    const set = els.setFilter.value || "All Sets";
    state.filtered = state.bank.questions.filter((q) => {
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && q.set !== set) return false;
      return true;
    });
    if (!state.filtered.length) state.filtered = [...state.bank.questions];
    renderSetupMetrics();
    prepareQueue();
    prepareQuestion();
  }

  function renderSetupMetrics() {
    const filtered = state.filtered.length;
    const mcq = state.filtered.filter((q) => q.type === "mcq").length;
    const stimulus = state.filtered.filter((q) => stimulusImagesFor(q).length).length;
    const best = Number(localStorage.getItem(`${STORAGE_KEY}:bestScore`) || 0);
    els.setupMetrics.innerHTML = [
      `${formatNumber(filtered)} review prompts loaded`,
      `${formatNumber(mcq)} MCQs`,
      `${formatNumber(stimulus)} source-based items`,
      `Best run ${formatNumber(best)}`
    ].map((text) => `<span class="metric-pill">${escapeHtml(text)}</span>`).join("");
  }

  function prepareQueue() {
    state.queue = shuffle(state.filtered);
  }

  function nextQuestion() {
    if (!state.queue.length) prepareQueue();
    return state.queue.pop() || state.filtered[Math.floor(Math.random() * state.filtered.length)];
  }

  function buildChoices(q) {
    const answer = cleanText(q.answer);
    let choices = [];
    if (q.type === "mcq" && Array.isArray(q.choices) && q.choices.length) {
      const correctLabel = String(q.correct || "");
      const correct = q.choices.find((choice) => String(choice.label) === correctLabel)?.text || answer;
      const distractors = q.choices
        .map((choice) => cleanText(choice.text))
        .filter((text) => text && normalize(text) !== normalize(correct));
      choices = [{ text: cleanText(correct), correct: true }]
        .concat(shuffle(distractors).slice(0, 2).map((text) => ({ text, correct: false })));
    } else {
      const sameSet = state.filtered
        .filter((item) => item.id !== q.id && item.answer)
        .filter((item) => item.set === q.set || item.course === q.course)
        .map((item) => cleanText(item.answer))
        .filter((text) => text && normalize(text) !== normalize(answer));
      const fallback = state.bank.questions
        .filter((item) => item.id !== q.id && item.answer)
        .map((item) => cleanText(item.answer))
        .filter((text) => text && normalize(text) !== normalize(answer));
      const uniqueDistractors = [...new Map(shuffle(sameSet.concat(fallback)).map((text) => [normalize(text), text])).values()];
      choices = [{ text: answer, correct: true }]
        .concat(uniqueDistractors.slice(0, 2).map((text) => ({ text, correct: false })));
    }

    while (choices.length < 3) {
      choices.push({ text: ["Reconstruction", "Industrialization", "Popular sovereignty"][choices.length] || "Review term", correct: false });
    }

    return shuffle(choices.slice(0, 3)).map((choice, index) => ({
      ...choice,
      lane: index,
      color: gateColors[index],
      sprite: [SPRITES.gateCyan, SPRITES.gateGold, SPRITES.gatePink][index]
    }));
  }

  function prepareQuestion() {
    if (!state.filtered.length || state.gateActive) return;
    const q = nextQuestion();
    state.currentQuestion = q;
    state.currentChoices = buildChoices(q);
    if (state.checkpointMode !== "debrief") renderStandby();
  }

  function setQuestionMode(mode) {
    state.checkpointMode = mode;
    els.questionCard.classList.toggle("standby", mode === "standby");
    els.questionCard.classList.toggle("checkpoint", mode === "checkpoint");
    els.questionCard.classList.toggle("debrief", mode === "debrief");
  }

  function renderStandby() {
    els.questionMeta.textContent = "Next checkpoint loading";
    els.questionPrompt.textContent = "";
    els.laneChips.innerHTML = "";
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    renderStimulus(null);
    setQuestionMode("standby");
  }

  function renderQuestion() {
    const q = state.currentQuestion;
    if (!q) {
      els.questionMeta.textContent = "Loading review prompt...";
      els.questionPrompt.textContent = "Dodge hazards and steer into the correct answer gate.";
      els.laneChips.innerHTML = "";
      renderStimulus(null);
      return;
    }
    const value = q.value ? ` | ${q.value}` : "";
    els.questionMeta.textContent = cleanText(`${q.course || "Social Studies"} | ${q.set || q.subject || "Review"}${value}`);
    els.questionPrompt.textContent = displayPrompt(q);
    els.laneChips.innerHTML = state.currentChoices.map((choice) => (
      `<button class="lane-chip" type="button" data-lane="${choice.lane}" style="--gate:${choice.color}">` +
      `${laneNames[choice.lane].toUpperCase()}: ${escapeHtml(choice.text)}` +
      `</button>`
    )).join("");
    els.laneChips.querySelectorAll(".lane-chip").forEach((button) => {
      button.addEventListener("click", () => moveToLane(Number(button.dataset.lane)));
    });
    renderStimulus(q);
    setQuestionMode("checkpoint");
  }

  function renderDebrief(q, wasCorrect, answer, explanation) {
    els.questionMeta.textContent = wasCorrect ? "Checkpoint cleared" : "Checkpoint review";
    els.questionPrompt.textContent = wasCorrect ? `Correct: ${answer}` : `Correct answer: ${answer}`;
    els.laneChips.innerHTML = "";
    renderStimulus(null);
    els.feedback.textContent = explanation;
    els.feedback.className = `feedback ${wasCorrect ? "good" : "bad"}`;
    state.debriefUntil = state.elapsed + (wasCorrect ? 2.5 : 3.5);
    setQuestionMode("debrief");
  }

  function renderStimulus(q) {
    const imagesList = stimulusImagesFor(q);
    if (!imagesList.length) {
      els.stimulusStrip.classList.remove("show");
      els.stimulusStrip.innerHTML = "";
      return;
    }
    els.stimulusStrip.classList.add("show");
    els.stimulusStrip.innerHTML = `<span class="source-pill">Source</span>` + imagesList.slice(0, 2).map((item, index) => (
      `<a class="stimulus-thumb" href="${escapeHtml(item.src)}" target="_blank" rel="noopener">` +
      `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label || `Stimulus ${index + 1}`)}">` +
      `<span>${escapeHtml(item.label || `Stimulus ${index + 1}`)}</span>` +
      `</a>`
    )).join("");
  }

  function setFeedback(message, type = "") {
    els.feedback.textContent = message;
    els.feedback.className = `feedback ${type}`.trim();
    state.feedbackUntil = state.elapsed + 4.4;
  }

  function clearFeedbackIfExpired() {
    if (state.feedbackUntil && state.elapsed > state.feedbackUntil) {
      els.feedback.textContent = "";
      els.feedback.className = "feedback";
      state.feedbackUntil = 0;
    }
    if (state.checkpointMode === "debrief" && state.elapsed > state.debriefUntil) {
      state.debriefUntil = 0;
      renderStandby();
    }
  }

  function resetRun() {
    const profile = intensityProfiles[els.intensityFilter.value] || intensityProfiles.standard;
    state.running = true;
    state.paused = false;
    state.gameOver = false;
    state.elapsed = 0;
    state.distance = 0;
    state.score = 0;
    state.correct = 0;
    state.answered = 0;
    state.streak = 0;
    state.health = 3;
    state.shields = 0;
    state.boost = 0;
    state.speedPace = profile.speed;
    state.gateTimer = Math.max(4.4, profile.gateEvery * .62);
    state.obstacleTimer = 1.1;
    state.pickupTimer = 1.8;
    state.objects = [];
    state.particles = [];
    state.texts = [];
    state.wrongs = [];
    state.shake = 0;
    state.flash = 0;
    state.gateActive = null;
    state.sawFirstGate = false;
    state.debriefUntil = 0;
    state.runCourse = els.courseFilter.value || "All Courses";
    state.runSet = els.setFilter.value || "All Sets";
    state.runIntensity = els.intensityFilter.value || "standard";
    player.lane = 1;
    player.visualLane = 1;
    player.jumpTime = 0;
    player.slideTime = 0;
    player.invulnerable = 0;
    prepareQueue();
    prepareQuestion();
    setFeedback("First gate forming. Steer left, center, or right into the best answer.", "");
    renderStandby();
    hideOverlays();
    updateHud();
  }

  function startRun(options = {}) {
    if (!state.filtered.length) applyFilters();
    if (!options.silent) audio.start();
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
    if (state.paused) resumeRun();
    else pauseRun();
  }

  function endRun() {
    if (state.gameOver) return;
    state.gameOver = true;
    state.running = false;
    const finalScore = Math.floor(state.score);
    if (finalScore > state.bestScore) {
      state.bestScore = finalScore;
      localStorage.setItem(`${STORAGE_KEY}:bestScore`, String(finalScore));
    }
    renderEndScreen();
    els.endScreen.classList.add("show");
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "timeline-runner",
      title: "Timeline Runner",
      score: finalScore,
      answered: state.answered,
      correct: state.correct
    }, { counter: "game-completions", once: false });
  }

  function renderEndScreen() {
    const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
    els.endTitle.textContent = state.health <= 0 ? "Timeline breach contained" : "Run archived";
    els.endGrid.innerHTML = [
      { label: "score", value: formatNumber(state.score) },
      { label: "answered", value: `${state.correct}/${state.answered}` },
      { label: "accuracy", value: `${accuracy}%` },
      { label: "distance", value: `${formatNumber(state.distance)}m` },
      { label: "best", value: formatNumber(state.bestScore) },
      { label: "streak", value: formatNumber(state.streak) }
    ].map((item) => (
      `<div class="end-stat"><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></div>`
    )).join("");

    const targets = state.wrongs.slice(-4).reverse();
    if (!targets.length) {
      els.studyTargets.innerHTML = `<div class="study-target"><strong>Clean run.</strong>No missed answer gates in this session.</div>`;
      return;
    }
    els.studyTargets.innerHTML = targets.map((item) => (
      `<div class="study-target"><strong>${escapeHtml(item.answer)}</strong>` +
      `${escapeHtml(item.prompt)}<br>${escapeHtml(item.explanation)}</div>`
    )).join("");
  }

  function showSetup() {
    state.running = false;
    state.paused = false;
    state.gameOver = false;
    els.pauseScreen.classList.remove("show");
    els.endScreen.classList.remove("show");
    els.setupScreen.classList.add("show");
    renderSetupMetrics();
  }

  function updateHud() {
    els.score.textContent = formatNumber(state.score);
    els.streak.textContent = formatNumber(state.streak);
    els.health.textContent = `${state.health}${state.shields ? `+${state.shields}` : ""}`;
    els.speed.textContent = `${Math.max(.8, state.speedPace + (state.boost > 0 ? .28 : 0)).toFixed(1)}x`;
  }

  function moveLane(delta) {
    moveToLane(player.lane + delta);
  }

  function moveToLane(lane) {
    const next = clamp(lane, 0, 2);
    if (next === player.lane) return;
    player.lane = next;
    addParticles(lanePoint(player.lane, .92).x, 748, 10, gateColors[player.lane], .8);
    audio.lane();
  }

  function jump() {
    if (player.jumpTime > 0) return;
    player.jumpTime = .72;
    audio.jump();
  }

  function slide() {
    player.slideTime = .56;
    audio.slide();
  }

  function damage(reason) {
    if (player.invulnerable > 0) return;
    if (state.shields > 0) {
      state.shields -= 1;
      player.invulnerable = .85;
      state.flash = Math.max(state.flash, .35);
      setFeedback(`Shield blocked ${reason}.`, "good");
      audio.shield();
      return;
    }
    state.health -= 1;
    state.streak = 0;
    player.invulnerable = 1.1;
    state.shake = Math.max(state.shake, 16);
    state.flash = Math.max(state.flash, .45);
    setFeedback(`Hit by ${reason}. Keep moving and recover on the next gate.`, "bad");
    audio.hit();
    if (state.health <= 0) endRun();
  }

  function collectPickup(obj) {
    obj.hit = true;
    const point = lanePoint(obj.lane, obj.progress);
    if (obj.pickup === "shield") {
      state.shields = Math.min(3, state.shields + 1);
      setFeedback("Rights Shield gained. It blocks the next hit.", "good");
      audio.shield();
      addText(point.x, point.y - 20, "+shield", "#75ecff");
    } else if (obj.pickup === "boost") {
      state.boost = Math.max(state.boost, 2.6);
      state.score += 125;
      setFeedback("Trade Surge active. Faster pace, bonus points.", "good");
      audio.boost();
      addText(point.x, point.y - 20, "surge", "#f5c451");
    } else {
      state.score += 180 + state.streak * 8;
      setFeedback("Evidence collected. Score boosted.", "good");
      audio.pickup();
      addText(point.x, point.y - 20, "+evidence", "#67f0a8");
    }
    addParticles(point.x, point.y, 18, obj.color || "#75ecff", 1.1);
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const roll = Math.random();
    let mode = "dodge";
    let sprite = Math.random() > .5 ? SPRITES.column : SPRITES.dronePurple;
    let label = "DODGE";
    if (roll < .34) {
      mode = "jump";
      sprite = SPRITES.crate;
      label = "JUMP";
    } else if (roll < .62) {
      mode = "slide";
      sprite = SPRITES.barrier;
      label = "SLIDE";
    }
    state.objects.push({
      kind: "obstacle",
      lane,
      progress: 0,
      sprite,
      mode,
      label,
      color: mode === "jump" ? "#f5c451" : mode === "slide" ? "#ff7bcc" : "#75ecff",
      hit: false
    });
  }

  function spawnPickup() {
    const lane = Math.floor(Math.random() * 3);
    const roll = Math.random();
    const pickup = roll < .22 ? "shield" : roll < .43 ? "boost" : "evidence";
    const sprite = pickup === "shield" ? SPRITES.shield : pickup === "boost" ? SPRITES.comet : (Math.random() > .45 ? SPRITES.scroll : SPRITES.orb);
    state.objects.push({
      kind: "pickup",
      lane,
      progress: 0,
      pickup,
      sprite,
      color: pickup === "shield" ? "#75ecff" : pickup === "boost" ? "#f5c451" : "#67f0a8",
      hit: false
    });
  }

  function spawnGate() {
    if (state.gateActive || !state.currentQuestion) return;
    const gateId = state.nextGateId++;
    state.gateActive = gateId;
    state.sawFirstGate = true;
    state.objects = state.objects.filter((obj) => obj.kind !== "obstacle" || obj.progress > .95);
    state.currentChoices.forEach((choice) => {
      state.objects.push({
        kind: "gate",
        gateId,
        lane: choice.lane,
        progress: 0,
        choice,
        sprite: choice.sprite,
        color: choice.color,
        hit: false
      });
    });
    renderQuestion();
    setFeedback("Choose your lane before the checkpoint gates reach you.", "");
  }

  function resolveGate(choice) {
    if (!state.gateActive || !state.currentQuestion) return;
    const q = state.currentQuestion;
    state.answered += 1;
    const point = lanePoint(player.lane, .92);
    const explanation = displayExplanation(q);
    const answer = cleanText(q.answer);
    if (choice.correct) {
      state.correct += 1;
      state.streak += 1;
      state.score += 650 + state.streak * 75;
      state.boost = Math.max(state.boost, 1.2);
      state.flash = Math.max(state.flash, .34);
      renderDebrief(q, true, answer, explanation);
      addText(point.x, point.y - 80, `+${650 + state.streak * 75}`, "#67f0a8");
      addParticles(point.x, point.y - 80, 36, "#67f0a8", 1.3);
      audio.correct();
    } else {
      state.wrongs.push({
        prompt: displayPrompt(q),
        answer,
        explanation
      });
      addText(point.x, point.y - 80, "review", "#ff9aa8");
      addParticles(point.x, point.y - 80, 28, "#ff7bcc", 1.1);
      audio.wrong();
      if (state.shields > 0) {
        state.shields -= 1;
        player.invulnerable = .85;
        renderDebrief(q, false, answer, `${explanation} Shield absorbed the damage.`);
      } else {
        state.health -= 1;
        state.streak = 0;
        player.invulnerable = 1.1;
        state.shake = Math.max(state.shake, 16);
        state.flash = Math.max(state.flash, .45);
        renderDebrief(q, false, answer, explanation);
        if (state.health <= 0) endRun();
      }
    }
    state.objects = state.objects.filter((obj) => obj.gateId !== state.gateActive);
    state.gateActive = null;
    state.currentQuestion = null;
    state.currentChoices = [];
    state.gateTimer = Math.max(4.2, (intensityProfiles[state.runIntensity] || intensityProfiles.standard).gateEvery * .70);
    prepareQuestion();
    updateHud();
  }

  function update(dt) {
    if (!state.running || state.paused || state.gameOver) return;
    const profile = intensityProfiles[state.runIntensity] || intensityProfiles.standard;
    state.elapsed += dt;
    clearFeedbackIfExpired();

    const difficulty = 1 + Math.min(.52, state.distance / 12000);
    const boostScale = state.boost > 0 ? 1.28 : 1;
    state.speedPace = profile.speed * difficulty * boostScale;
    const progressSpeed = (.148 + difficulty * .032) * profile.speed * boostScale;
    state.distance += dt * (42 + 118 * state.speedPace);
    state.score += dt * (9 + state.streak * .9) * state.speedPace;
    state.boost = Math.max(0, state.boost - dt);
    state.shake = Math.max(0, state.shake - dt * 34);
    state.flash = Math.max(0, state.flash - dt * 1.7);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.jumpTime = Math.max(0, player.jumpTime - dt);
    player.slideTime = Math.max(0, player.slideTime - dt);
    player.visualLane += (player.lane - player.visualLane) * Math.min(1, dt * 12);
    emitRunSparks(dt);

    state.gateTimer -= dt;
    state.obstacleTimer -= dt;
    state.pickupTimer -= dt;

    if (state.gateTimer <= 0) {
      spawnGate();
      state.gateTimer = profile.gateEvery / Math.min(1.32, difficulty);
    }

    if (!state.gateActive && state.obstacleTimer <= 0) {
      spawnObstacle();
      state.obstacleTimer = (profile.obstacleEvery + Math.random() * .55) / Math.min(1.28, difficulty);
    }

    if (state.pickupTimer <= 0) {
      spawnPickup();
      state.pickupTimer = profile.pickupEvery + Math.random() * 1.3;
    }

    for (const obj of state.objects) {
      obj.progress += dt * progressSpeed * (obj.kind === "gate" ? .86 : 1);
      if (obj.progress > .9 && !obj.hit) {
        if (obj.kind === "gate" && obj.lane === player.lane) {
          obj.hit = true;
          resolveGate(obj.choice);
          break;
        }
        if (obj.kind === "pickup" && obj.lane === player.lane) collectPickup(obj);
        if (obj.kind === "obstacle" && obj.lane === player.lane) {
          const jumped = obj.mode === "jump" && jumpLift() > .42;
          const slid = obj.mode === "slide" && player.slideTime > 0;
          if (obj.mode === "dodge" || (!jumped && !slid)) {
            obj.hit = true;
            damage(obj.mode === "jump" ? "timeline debris" : obj.mode === "slide" ? "archive barrier" : "corrupted source");
          } else {
            obj.hit = true;
            state.score += 80;
            addText(lanePoint(obj.lane, obj.progress).x, lanePoint(obj.lane, obj.progress).y - 30, "+dodge", "#75ecff");
          }
        }
      }
    }
    state.objects = state.objects.filter((obj) => obj.progress < 1.12 && !obj.hit);

    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 42 * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    for (const text of state.texts) {
      text.life -= dt;
      text.y -= dt * 42;
    }
    state.texts = state.texts.filter((text) => text.life > 0);

    if (state.answered >= 30 && state.runIntensity !== "endless") {
      endRun();
    }
    updateHud();
  }

  function jumpLift() {
    if (player.jumpTime <= 0) return 0;
    const t = 1 - player.jumpTime / .72;
    return Math.sin(Math.PI * clamp(t, 0, 1));
  }

  function lanePoint(lane, progress) {
    const p = easeOut(progress);
    const horizonY = 286;
    const bottomY = 794;
    const center = BASE_W / 2;
    const laneSpread = lerp(74, 360, p);
    const laneOffset = (lane - 1) * laneSpread;
    const curve = Math.sin(state.distance * .0009 + p * Math.PI * 1.1) * lerp(4, 18, p);
    return {
      x: center + laneOffset + curve,
      y: lerp(horizonY, bottomY, p),
      scale: lerp(.20, 1.26, Math.pow(p, 1.15))
    };
  }

  function emitRunSparks(dt) {
    const particleLimit = liteFx ? 70 : 170;
    if (reduceMotion || state.particles.length > particleLimit) return;
    const density = state.boost > 0 ? 4 : 2;
    const count = Math.max(1, Math.floor(density * state.speedPace));
    for (let i = 0; i < count; i++) {
      if (Math.random() > dt * 20) continue;
      const lane = Math.floor(Math.random() * 3);
      const p = .68 + Math.random() * .25;
      const point = lanePoint(lane, p);
      const color = gateColors[lane];
      state.particles.push({
        x: point.x + (Math.random() - .5) * 46 * point.scale,
        y: point.y + 26 * point.scale,
        vx: (Math.random() - .5) * 72,
        vy: 160 + Math.random() * 210,
        radius: (1.5 + Math.random() * 4.2) * point.scale,
        color,
        life: .18 + Math.random() * .34,
        maxLife: .52
      });
    }
  }

  function addParticles(x, y, count, color, power = 1) {
    if (reduceMotion) return;
    const actual = liteFx ? Math.min(12, Math.ceil(count * .45)) : count;
    for (let i = 0; i < actual; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (45 + Math.random() * 160) * power;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 28,
        radius: 2 + Math.random() * 4,
        color,
        life: .35 + Math.random() * .65,
        maxLife: .8
      });
    }
  }

  function addText(x, y, text, color) {
    state.texts.push({ x, y, text, color, life: 1, maxLife: 1 });
  }

  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(liteFx ? 1 : 2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (els.canvas.width !== width || els.canvas.height !== height) {
      els.canvas.width = width;
      els.canvas.height = height;
    }
  }

  function beginCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(liteFx ? 1 : 2, window.devicePixelRatio || 1));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#050711";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (images.background) {
      ctx.save();
      if (!liteFx) {
        ctx.filter = "blur(10px) saturate(1.18) brightness(.70)";
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
    const ox = (rect.width - BASE_W * scale) / 2;
    const oy = (rect.height - BASE_H * scale) / 2;
    state.stage = { scale, ox, oy, width: BASE_W * scale, height: BASE_H * scale };
    if (state.shake > 0) {
      const s = state.shake;
      ctx.translate((Math.random() - .5) * s, (Math.random() - .5) * s);
    }
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
  }

  function draw() {
    resizeCanvas();
    beginCanvas();
    drawBackground();
    drawRoad();
    drawSpeedTunnel();
    drawWorldObjects();
    drawPlayer();
    drawParticles();
    drawRunText();
    drawOverlayEffects();
    audio.music(state.elapsed);
  }

  function drawBackground() {
    if (images.background) {
      drawImageCover(images.background, 0, 0, BASE_W, BASE_H);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, BASE_H);
      gradient.addColorStop(0, "#081426");
      gradient.addColorStop(.55, "#0a1021");
      gradient.addColorStop(1, "#050711");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
    }
    ctx.fillStyle = "rgba(4, 7, 15, .22)";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    const pulse = .5 + Math.sin(state.elapsed * 1.6) * .5;
    const glow = ctx.createRadialGradient(800, 330, 40, 800, 330, 520);
    glow.addColorStop(0, `rgba(117,236,255,${.18 + pulse * .06})`);
    glow.addColorStop(.44, "rgba(117,236,255,.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    if (!reduceMotion) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 34; i++) {
        const y = ((i * 77 + state.distance * .18) % 820) + 40;
        const x = 200 + ((i * 193) % 1200);
        const alpha = .05 + ((i % 4) * .018);
        ctx.strokeStyle = `rgba(117,236,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 30 + (i % 5) * 11, y - 10);
        ctx.stroke();
      }
      ctx.restore();
    }
    drawFloatingPanels();
  }

  function drawImageCover(img, x, y, w, h) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawRawImageCover(img, x, y, w, h) {
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const scale = Math.max(w / imgW, h / imgH);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (imgW - sw) / 2;
    const sy = (imgH - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawFloatingPanels() {
    if (reduceMotion) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? -1 : 1;
      const p = (state.elapsed * .055 + state.distance * .000035 + i * .097) % 1;
      const drift = Math.sin(state.elapsed * .8 + i * 1.7) * 34;
      const x = 800 + side * lerp(250, 690, p) + drift;
      const y = lerp(170, 740, Math.pow(p, 1.18));
      const w = lerp(54, 170, p);
      const h = w * .64;
      const alpha = lerp(.05, .22, p);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(side * (.12 + Math.sin(state.elapsed + i) * .05));
      ctx.fillStyle = `rgba(117,236,255,${alpha * .40})`;
      ctx.strokeStyle = `rgba(${i % 3 === 0 ? "245,196,81" : i % 3 === 1 ? "117,236,255" : "255,123,204"},${alpha})`;
      ctx.lineWidth = 1.4;
      roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();
      roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.stroke();
      ctx.globalAlpha = alpha * 1.8;
      for (let line = 0; line < 4; line++) {
        ctx.beginPath();
        ctx.moveTo(-w * .33, -h * .20 + line * h * .13);
        ctx.lineTo(w * (.14 + line * .06), -h * .20 + line * h * .13);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSpeedTunnel() {
    if (reduceMotion) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let lane = 0; lane < 3; lane++) {
      for (let i = 0; i < 8; i++) {
        const p = (state.distance * .00125 + i / 8 + lane * .13) % 1;
        const start = lanePoint(lane, clamp(p, .04, .98));
        const end = lanePoint(lane, clamp(p + .055, .05, .99));
        const alpha = lerp(.04, .46, p) * (state.boost > 0 ? 1.45 : 1);
        ctx.strokeStyle = hexToRgba(gateColors[lane], alpha);
        ctx.lineWidth = lerp(2, 9, p);
        ctx.shadowColor = gateColors[lane];
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 14; i++) {
      const p = (state.elapsed * .35 + state.distance * .0009 + i * .071) % 1;
      const left = lanePoint(0, p);
      const right = lanePoint(2, p);
      ctx.strokeStyle = `rgba(255,255,255,${lerp(.02, .16, p)})`;
      ctx.lineWidth = lerp(1, 3, p);
      ctx.beginPath();
      ctx.moveTo(left.x - 78 * p, left.y);
      ctx.lineTo(right.x + 78 * p, right.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRoad() {
    const bottom = BASE_H + 28;
    const horizon = 300;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const road = ctx.createLinearGradient(800, horizon, 800, bottom);
    road.addColorStop(0, "rgba(7, 20, 38, .24)");
    road.addColorStop(.68, "rgba(4, 8, 17, .46)");
    road.addColorStop(1, "rgba(0, 0, 0, .68)");
    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(690, horizon);
    ctx.lineTo(910, horizon);
    ctx.lineTo(1425, bottom);
    ctx.lineTo(175, bottom);
    ctx.closePath();
    ctx.fill();

    for (let lane = 0; lane < 4; lane++) {
      const laneFrac = lane / 3;
      const topX = lerp(690, 910, laneFrac);
      const bottomX = lerp(175, 1425, laneFrac);
      const color = lane === 0 || lane === 3 ? "245,196,81" : "117,236,255";
      ctx.strokeStyle = `rgba(${color},${lane === 0 || lane === 3 ? .50 : .38})`;
      ctx.lineWidth = lane === 0 || lane === 3 ? 3 : 2;
      ctx.shadowColor = `rgba(${color},.40)`;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(topX, horizon);
      ctx.lineTo(bottomX, bottom);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    for (let i = 0; i < 22; i++) {
      const p = ((i / 22) + (state.distance * .00075)) % 1;
      const y = lerp(horizon, bottom, Math.pow(p, 1.7));
      const width = lerp(120, 1050, Math.pow(p, 1.2));
      const alpha = lerp(.08, .32, p);
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(800 - width / 2, y);
      ctx.lineTo(800 + width / 2, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWorldObjects() {
    const sorted = [...state.objects].sort((a, b) => a.progress - b.progress);
    for (const obj of sorted) {
      if (obj.kind === "gate") drawGate(obj);
      else if (obj.kind === "pickup") drawPickup(obj);
      else drawObstacle(obj);
    }
  }

  function drawGate(obj) {
    const point = lanePoint(obj.lane, obj.progress);
    const size = 160 * point.scale;
    const alpha = clamp(obj.progress * 2.4, .15, 1);
    const pulse = 1 + Math.sin(state.elapsed * 6.5 + obj.lane * 1.7) * .07;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = Math.max(2, size * .035);
    ctx.shadowColor = obj.color;
    ctx.shadowBlur = 28;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y - size * .35, size * .52 * pulse, size * .72 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha * .38;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - size * .96);
    ctx.lineTo(point.x - size * .52, point.y + size * .18);
    ctx.lineTo(point.x + size * .52, point.y + size * .18);
    ctx.closePath();
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.globalAlpha = alpha;
    drawSprite(obj.sprite, point.x, point.y - size * .34, size * pulse, alpha);
    ctx.globalCompositeOperation = "source-over";
    drawGateLabel(obj, point.x, point.y - size * .95, size);
    ctx.restore();
  }

  function drawGateLabel(obj, x, y, size) {
    const text = cleanText(obj.choice.text);
    const width = clamp(size * (text.length > 34 ? 2.25 : 1.95), 144, 420);
    const height = clamp(size * (text.length > 34 ? .74 : .60), 58, 118);
    x = clamp(x, width / 2 + 24, BASE_W - width / 2 - 24);
    ctx.save();
    ctx.translate(x - width / 2, y - height / 2);
    const grd = ctx.createLinearGradient(0, 0, width, height);
    grd.addColorStop(0, "rgba(6,10,21,.90)");
    grd.addColorStop(1, "rgba(20,26,42,.78)");
    ctx.fillStyle = grd;
    roundRect(0, 0, width, height, 18);
    ctx.fill();
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = obj.color;
    ctx.shadowBlur = 16;
    roundRect(0, 0, width, height, 18);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f7f4ec";
    const fontSize = clamp(size * .12 - Math.max(0, text.length - 32) * .035, 10.5, 18);
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapCanvasText(text, width / 2, height / 2, width - 22, fontSize * 1.18, 3);
    ctx.restore();
  }

  function drawPickup(obj) {
    const point = lanePoint(obj.lane, obj.progress);
    const bob = Math.sin(state.elapsed * 5 + obj.lane) * 8;
    const size = (70 + (obj.pickup === "boost" ? 18 : 0)) * point.scale;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = obj.color;
    ctx.shadowBlur = 22;
    drawSprite(obj.sprite, point.x, point.y - 42 * point.scale + bob, size, .95);
    ctx.restore();
  }

  function drawObstacle(obj) {
    const point = lanePoint(obj.lane, obj.progress);
    const size = (obj.mode === "slide" ? 130 : obj.mode === "jump" ? 118 : 112) * point.scale;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.shadowColor = obj.color;
    ctx.shadowBlur = 20;
    drawSprite(obj.sprite, point.x, point.y - size * .34, size, .98);
    ctx.globalCompositeOperation = "source-over";
    if (obj.progress > .38) {
      ctx.fillStyle = "rgba(5,7,17,.74)";
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = 1.5;
      const w = 82 * point.scale;
      const h = 28 * point.scale;
      roundRect(point.x - w / 2, point.y - size * .95, w, h, 9 * point.scale);
      ctx.fill();
      roundRect(point.x - w / 2, point.y - size * .95, w, h, 9 * point.scale);
      ctx.stroke();
      ctx.fillStyle = "#f7f4ec";
      ctx.font = `900 ${Math.max(9, 11 * point.scale)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.label, point.x, point.y - size * .95 + h / 2 + 1);
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = lanePoint(player.visualLane, .94);
    const lift = jumpLift() * 142;
    const sliding = player.slideTime > 0;
    const x = p.x;
    const runBob = Math.sin(state.elapsed * 15.5) * (sliding ? 2 : 7);
    const y = 770 - lift + (sliding ? 24 : 0) + runBob;
    const size = sliding ? 126 : 154;
    const tilt = (player.lane - player.visualLane) * .18 + Math.sin(state.elapsed * 12) * .025;
    ctx.save();
    ctx.globalAlpha = player.invulnerable > 0 ? .62 + Math.sin(state.elapsed * 28) * .22 : 1;
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.beginPath();
    ctx.ellipse(x, 806, sliding ? 72 : 58, sliding ? 13 : 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "screen";
    for (let i = 3; i > 0; i--) {
      ctx.globalAlpha = .10 * i;
      drawSprite(SPRITES.runner, x - i * 22, y + i * 10, size * (1 - i * .04), .22);
    }
    ctx.globalAlpha = player.invulnerable > 0 ? .62 + Math.sin(state.elapsed * 28) * .22 : 1;
    if (state.boost > 0) {
      ctx.strokeStyle = "rgba(245,196,81,.65)";
      ctx.lineWidth = 9;
      ctx.shadowColor = "#f5c451";
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.moveTo(x - 82, y + 30);
      ctx.lineTo(x - 160, y + 72);
      ctx.stroke();
      ctx.strokeStyle = "rgba(117,236,255,.62)";
      ctx.beginPath();
      ctx.moveTo(x - 62, y + 8);
      ctx.lineTo(x - 135, y + 38);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    drawSprite(SPRITES.runner, 0, 0, size, 1);
    ctx.restore();
    if (state.shields > 0) {
      ctx.strokeStyle = "rgba(117,236,255,.75)";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#75ecff";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.ellipse(x, y + 6, 70, 92, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSprite(index, x, y, size, alpha = 1) {
    if (!images.sprites) {
      ctx.fillStyle = "rgba(117,236,255,.55)";
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const cols = 4;
    const rows = 4;
    const sheetW = images.sprites.naturalWidth || images.sprites.width;
    const sheetH = images.sprites.naturalHeight || images.sprites.height;
    const cellW = sheetW / cols;
    const cellH = sheetH / rows;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const pad = 8;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(
      images.sprites,
      col * cellW + pad,
      row * cellH + pad,
      cellW - pad * 2,
      cellH - pad * 2,
      x - size / 2,
      y - size / 2,
      size,
      size
    );
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const p of state.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color.replace(")", `,${alpha})`).replace("rgb(", "rgba(");
      if (!p.color.startsWith("rgb")) ctx.fillStyle = hexToRgba(p.color, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRunText() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const text of state.texts) {
      const alpha = clamp(text.life / text.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(5,7,17,.74)";
      ctx.strokeStyle = text.color;
      ctx.lineWidth = 2;
      const w = 122;
      const h = 34;
      roundRect(text.x - w / 2, text.y - h / 2, w, h, 12);
      ctx.fill();
      roundRect(text.x - w / 2, text.y - h / 2, w, h, 12);
      ctx.stroke();
      ctx.fillStyle = "#f7f4ec";
      ctx.font = "900 15px Inter, system-ui, sans-serif";
      ctx.fillText(text.text, text.x, text.y + 1);
    }
    ctx.restore();
  }

  function drawOverlayEffects() {
    if (!state.running) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.14)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.globalCompositeOperation = "screen";
      drawSprite(SPRITES.portal, 800, 470 + Math.sin(state.elapsed * 1.4) * 8, 260, .65);
      ctx.restore();
    }
    if (state.flash > 0) {
      ctx.save();
      ctx.globalAlpha = state.flash * .28;
      ctx.fillStyle = state.health <= 1 ? "#ff7bcc" : "#75ecff";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    }
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    const int = parseInt(value.length === 3 ? value.split("").map((c) => c + c).join("") : value, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function wrapCanvasText(text, x, y, maxWidth, lineHeight, maxLines) {
    const words = cleanText(text).split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
        if (lines.length === maxLines - 1) break;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines || words.join(" ").length > visible.join(" ").length) {
      visible[visible.length - 1] = `${visible[visible.length - 1].replace(/\s+\S+$/, "")}...`;
    }
    const startY = y - ((visible.length - 1) * lineHeight) / 2;
    visible.forEach((item, index) => ctx.fillText(item, x, startY + index * lineHeight));
  }

  function bindEvents() {
    window.addEventListener("resize", resizeCanvas);
    els.courseFilter.addEventListener("change", () => {
      populateSets();
      applyFilters();
    });
    els.setFilter.addEventListener("change", applyFilters);
    els.intensityFilter.addEventListener("change", renderSetupMetrics);
    els.startBtn.addEventListener("click", startRun);
    els.resumeBtn.addEventListener("click", resumeRun);
    els.restartBtn.addEventListener("click", startRun);
    els.againBtn.addEventListener("click", startRun);
    els.setupBtn.addEventListener("click", showSetup);
    els.pauseBtn.addEventListener("click", togglePause);
    els.backBtn.addEventListener("click", () => {
      window.location.href = "../../index.html";
    });
    els.soundBtn.addEventListener("click", () => {
      state.sound = !state.sound;
      els.soundBtn.textContent = state.sound ? "Sound On" : "Sound Off";
      if (state.sound) audio.ensure();
    });
    els.fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
    els.leftBtn.addEventListener("click", () => moveLane(-1));
    els.rightBtn.addEventListener("click", () => moveLane(1));
    els.jumpBtn.addEventListener("click", jump);
    els.slideBtn.addEventListener("click", slide);

    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        moveLane(-1);
      } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        moveLane(1);
      } else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w" || event.key === " ") {
        event.preventDefault();
        jump();
      } else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        event.preventDefault();
        slide();
      } else if (event.key.toLowerCase() === "p" || event.key === "Escape") {
        event.preventDefault();
        togglePause();
      }
    });

    els.canvas.addEventListener("pointerdown", (event) => {
      state.pointerStart = { x: event.clientX, y: event.clientY, at: performance.now() };
    });
    els.canvas.addEventListener("pointerup", (event) => {
      if (!state.pointerStart) return;
      const dx = event.clientX - state.pointerStart.x;
      const dy = event.clientY - state.pointerStart.y;
      state.pointerStart = null;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 26) {
        moveLane(dx > 0 ? 1 : -1);
      } else if (dy < -28) {
        jump();
      } else if (dy > 28) {
        slide();
      }
    });
  }

  function loop(now) {
    const t = now || performance.now();
    if (document.hidden) {
      state.last = t;
      requestAnimationFrame(loop);
      return;
    }
    if (liteFx && state.frameStamp && t - state.frameStamp < 1000 / 45) {
      requestAnimationFrame(loop);
      return;
    }
    state.frameStamp = t;
    if (!state.last) state.last = t;
    const dt = Math.min(.04, Math.max(0, (t - state.last) / 1000));
    state.last = t;
    if (!state.running || state.paused || state.gameOver) {
      state.elapsed += dt * .45;
    }
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  async function init() {
    bindEvents();
    resizeCanvas();
    requestAnimationFrame(loop);
    try {
      await Promise.all([loadAssets(), loadBank()]);
      renderStandby();
      renderSetupMetrics();
      if (new URLSearchParams(window.location.search).get("autostart") === "1") {
        state.sound = false;
        els.soundBtn.textContent = "Sound Off";
        startRun({ silent: true });
      }
    } catch (error) {
      console.error(error);
      els.questionMeta.textContent = "Question bank unavailable";
      els.questionPrompt.textContent = "Reload the page or check the arcade data files.";
      els.startBtn.disabled = true;
      els.startBtn.textContent = "Library Error";
      els.setupMetrics.innerHTML = `<span class="metric-pill">Library failed to load</span>`;
    }
  }

  init();
})();
