(() => {
  "use strict";

  const canvas = document.getElementById("empireCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const params = new URLSearchParams(window.location.search);
  const FX_LITE = params.get("fx") === "lite" || window.matchMedia("(max-width: 900px)").matches;
  const STORAGE_KEY = "mr-macs-empire-ascendant";

  const COLS = 12;
  const ROWS = 9;
  const ERAS = ["Ancient", "Classical", "Medieval", "Early Modern", "Industrial", "Modern"];
  const OWNERS = {
    player: { name: "Mac Dynasty", color: "#f2c14e", fill: "rgba(242,193,78,.24)" },
    north: { name: "Northern League", color: "#7bdff2", fill: "rgba(123,223,242,.19)" },
    steppe: { name: "Steppe Confederation", color: "#d98a5d", fill: "rgba(217,138,93,.19)" },
    ocean: { name: "Ocean Compact", color: "#b79cff", fill: "rgba(183,156,255,.18)" }
  };

  const TERRAIN = {
    plains: { label: "Plains", color: "#5d8d58", edge: "#9ccc7a", food: 2, industry: 1, knowledge: 0, culture: 0 },
    forest: { label: "Forest", color: "#2f714f", edge: "#77d99b", food: 1, industry: 2, knowledge: 0, culture: 0 },
    river: { label: "River Valley", color: "#3f8d86", edge: "#7bdff2", food: 3, industry: 0, knowledge: 1, culture: 0 },
    hills: { label: "Hills", color: "#83684d", edge: "#d98a5d", food: 0, industry: 3, knowledge: 0, culture: 0 },
    mountain: { label: "Mountains", color: "#66727a", edge: "#c9d0d4", food: 0, industry: 2, knowledge: 1, culture: 0 },
    coast: { label: "Coast", color: "#315e7d", edge: "#7bdff2", food: 2, industry: 0, knowledge: 0, culture: 1 },
    desert: { label: "Desert", color: "#9c7a44", edge: "#f2c14e", food: 0, industry: 1, knowledge: 0, culture: 2 }
  };

  const IMPROVEMENTS = {
    farm: { label: "Farms", cost: { industry: 8 }, yield: { food: 3 }, allowed: ["plains", "river", "coast"], color: "#77d99b" },
    workshop: { label: "Workshops", cost: { industry: 12 }, yield: { industry: 3 }, allowed: ["forest", "hills", "mountain", "plains"], color: "#d98a5d" },
    academy: { label: "Academy", cost: { industry: 14, culture: 4 }, yield: { knowledge: 3 }, allowed: ["river", "plains", "coast", "desert"], color: "#7bdff2" },
    monument: { label: "Monument", cost: { industry: 10 }, yield: { culture: 3, stability: 1 }, allowed: ["plains", "river", "desert", "coast", "hills"], color: "#f2c14e" },
    fort: { label: "Fort", cost: { industry: 10, culture: 2 }, yield: { stability: 2 }, allowed: ["plains", "forest", "hills", "mountain", "desert", "river"], color: "#b79cff" },
    harbor: { label: "Harbor", cost: { industry: 12 }, yield: { food: 1, culture: 2, knowledge: 1 }, allowed: ["coast"], color: "#7bdff2" }
  };

  const els = {
    food: document.getElementById("food"),
    industry: document.getElementById("industry"),
    knowledge: document.getElementById("knowledge"),
    culture: document.getElementById("culture"),
    stability: document.getElementById("stability"),
    pauseBtn: document.getElementById("pauseBtn"),
    exitBtn: document.getElementById("exitBtn"),
    advisorTitle: document.getElementById("advisorTitle"),
    advisorMeta: document.getElementById("advisorMeta"),
    advisorText: document.getElementById("advisorText"),
    advisorLog: document.getElementById("advisorLog"),
    commandPanel: document.getElementById("commandPanel"),
    selectedTitle: document.getElementById("selectedTitle"),
    selectedMeta: document.getElementById("selectedMeta"),
    actionGrid: document.getElementById("actionGrid"),
    endTurnBtn: document.getElementById("endTurnBtn"),
    setupScreen: document.getElementById("setupScreen"),
    councilScreen: document.getElementById("councilScreen"),
    menuScreen: document.getElementById("menuScreen"),
    endScreen: document.getElementById("endScreen"),
    courseFilter: document.getElementById("courseFilter"),
    setFilter: document.getElementById("setFilter"),
    scenarioFilter: document.getElementById("scenarioFilter"),
    setupMetrics: document.getElementById("setupMetrics"),
    startBtn: document.getElementById("startBtn"),
    soundBtn: document.getElementById("soundBtn"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    resumeBtn: document.getElementById("resumeBtn"),
    restartBtn: document.getElementById("restartBtn"),
    menuExitBtn: document.getElementById("menuExitBtn"),
    setupBtn: document.getElementById("setupBtn"),
    againBtn: document.getElementById("againBtn"),
    questionMeta: document.getElementById("questionMeta"),
    questionPrompt: document.getElementById("questionPrompt"),
    stimulusBox: document.getElementById("stimulusBox"),
    choiceGrid: document.getElementById("choiceGrid"),
    explanation: document.getElementById("explanation"),
    endTitle: document.getElementById("endTitle"),
    endGrid: document.getElementById("endGrid"),
    studyTargets: document.getElementById("studyTargets")
  };

  const view = {
    width: 0,
    height: 0,
    dpr: 1,
    size: 44,
    ox: 0,
    oy: 0,
    mapW: 0,
    mapH: 0
  };

  const state = {
    bank: null,
    filtered: [],
    queue: [],
    mode: "setup",
    tiles: [],
    selected: null,
    pendingAction: null,
    turn: 1,
    era: 0,
    resources: { food: 18, industry: 18, knowledge: 0, culture: 12, stability: 62 },
    population: 2,
    score: 0,
    councils: 0,
    correct: 0,
    missed: [],
    particles: [],
    banners: [],
    events: [],
    last: 0,
    elapsed: 0,
    cameraNudge: 0
  };

  class AudioBus {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    ensure() {
      if (!this.enabled) return null;
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }

    tone(freq, dur = .08, type = "sine", gain = .055, bend = 1) {
      const audio = this.ensure();
      if (!audio) return;
      const now = audio.currentTime;
      const osc = audio.createOscillator();
      const vol = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (bend !== 1) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * bend), now + dur);
      vol.gain.setValueAtTime(.0001, now);
      vol.gain.exponentialRampToValueAtTime(gain, now + .012);
      vol.gain.exponentialRampToValueAtTime(.0001, now + dur);
      osc.connect(vol).connect(audio.destination);
      osc.start(now);
      osc.stop(now + dur + .03);
    }

    select() { this.tone(420, .055, "triangle", .04, 1.25); }
    build() { [360, 540, 720].forEach((f, i) => setTimeout(() => this.tone(f, .07, "triangle", .05, 1.05), i * 55)); }
    correct() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, .09, "triangle", .055, 1.07), i * 50)); }
    wrong() { this.tone(190, .15, "sawtooth", .055, .55); }
    turn() { this.tone(260, .07, "triangle", .045, 1.8); }
    era() { [392, 494, 659, 988].forEach((f, i) => setTimeout(() => this.tone(f, .12, "triangle", .06, 1.08), i * 70)); }
  }

  const audio = new AudioBus();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\bcon\s+icts\b/gi, "conflicts")
      .replace(/\bUnited states\b/g, "United States")
      .replace(/\bu\.s\.\b/gi, "U.S.")
      .replace(/\bnys\b/gi, "NYS")
      .trim();
  }

  function displayPrompt(q) {
    const raw = cleanText(q?.prompt || q?.stem || "");
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

  function stimulusTextFor(q) {
    if (!q) return "";
    if (typeof q.stimulusText === "string") return cleanText(q.stimulusText);
    if (typeof q.stimulus === "string") return cleanText(q.stimulus);
    if (typeof q.stimulusHtml === "string") {
      const tmp = document.createElement("div");
      tmp.innerHTML = q.stimulusHtml;
      return cleanText(tmp.textContent || "");
    }
    return "";
  }

  function hasReliableStimulus(q) {
    return Boolean(stimulusTextFor(q) || stimulusImagesFor(q).length);
  }

  function isPlayableQuestion(q) {
    if (!q || !q.answer || !(q.prompt || q.stem)) return false;
    if (q.type !== "mcq") return true;
    if (hasReliableStimulus(q)) return true;
    return !promptNeedsStimulus(q);
  }

  function resolveStimulusSrc(src) {
    const value = String(src || "").trim();
    if (!value) return "";
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    if (value.startsWith("../../") || value.startsWith("../")) return value;
    if (value.startsWith("assets/")) return `../../${value}`;
    return value;
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
    els.startBtn.textContent = "Found Empire";
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
    state.queue = shuffle(state.filtered);
    renderSetupMetrics();
  }

  function renderSetupMetrics() {
    const total = state.filtered.length;
    const sourceBased = state.filtered.filter(hasReliableStimulus).length;
    const best = Number(localStorage.getItem(`${STORAGE_KEY}:bestScore`) || 0);
    els.setupMetrics.innerHTML = [
      `${formatNumber(total)} council questions loaded`,
      `${formatNumber(sourceBased)} source-based councils`,
      `${state.bank.courses.length} courses available`,
      `Best empire score ${formatNumber(best)}`
    ].map((text) => `<span class="metric-pill">${escapeHtml(text)}</span>`).join("");
  }

  function nextQuestion() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    return state.queue.pop() || state.filtered[Math.floor(Math.random() * state.filtered.length)];
  }

  function buildChoices(q) {
    const answer = cleanText(q.answer);
    let choices = [];
    if (q.type === "mcq" && Array.isArray(q.choices) && q.choices.length) {
      const correctLabel = String(q.correct || "");
      const correct = q.choices.find((choice) => String(choice.label) === correctLabel)?.text || answer;
      choices = q.choices.map((choice) => ({
        text: cleanText(choice.text),
        correct: normalize(choice.text) === normalize(correct)
      })).filter((choice) => choice.text);
      if (!choices.some((choice) => choice.correct)) choices.unshift({ text: cleanText(correct), correct: true });
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
      const unique = [...new Map(shuffle(sameSet.concat(fallback)).map((text) => [normalize(text), text])).values()];
      choices = [{ text: answer, correct: true }]
        .concat(unique.slice(0, 3).map((text) => ({ text, correct: false })));
    }
    while (choices.length < 4) {
      const fallback = ["River valley civilization", "Imperial expansion", "Trade network", "Political reform"][choices.length] || "Review term";
      choices.push({ text: fallback, correct: false });
    }
    const deduped = [...new Map(choices.map((choice) => [normalize(choice.text), choice])).values()];
    if (!deduped.some((choice) => choice.correct)) deduped.unshift({ text: answer, correct: true });
    return shuffle(deduped).slice(0, 4);
  }

  function resize() {
    const dprLimit = window.matchMedia("(max-width: 900px)").matches ? 1.12 : 1.5;
    const dpr = Math.min(dprLimit, window.devicePixelRatio || 1);
    view.width = window.innerWidth;
    view.height = window.innerHeight;
    view.dpr = dpr;
    canvas.width = Math.max(1, Math.round(view.width * dpr));
    canvas.height = Math.max(1, Math.round(view.height * dpr));
    canvas.style.width = `${view.width}px`;
    canvas.style.height = `${view.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const leftUi = view.width > 1050 ? 430 : 0;
    const rightUi = view.width > 1050 ? 430 : 0;
    const mapBudgetW = Math.max(360, view.width - leftUi - rightUi - 28);
    const mapBudgetH = view.height * (view.width > 900 ? .82 : .58);
    view.size = clamp(Math.min(mapBudgetW / 15.4, mapBudgetH / 9.8), 25, 56);
    view.mapW = view.size * (1.5 * (COLS - 1) + 2);
    view.mapH = view.size * Math.sqrt(3) * (ROWS + .6);
    const baseX = view.width > 1050 ? leftUi + (mapBudgetW - view.mapW) / 2 : (view.width - view.mapW) / 2;
    const baseY = view.width > 900 ? Math.max(108, (view.height - view.mapH) / 2 + 28) : Math.max(165, (view.height - view.mapH) * .44);
    view.ox = baseX + view.size;
    view.oy = baseY + view.size;
  }

  function generateMap() {
    const tiles = [];
    for (let q = 0; q < COLS; q++) {
      for (let r = 0; r < ROWS; r++) {
        const edge = q === 0 || q === COLS - 1 || r === 0 || r === ROWS - 1;
        let terrain = "plains";
        const riverBand = Math.abs(r - (4 + Math.sin(q * .85) * 1.15));
        if (q > 8 && r < 3) terrain = "mountain";
        else if (q < 2 || (q > 9 && r > 5)) terrain = "coast";
        else if (riverBand < .72) terrain = "river";
        else if ((q + r * 2) % 7 === 0) terrain = "hills";
        else if ((q * 3 + r) % 11 === 0) terrain = "desert";
        else if ((q + r) % 4 === 0 || (!edge && Math.random() > .76)) terrain = "forest";
        tiles.push({
          id: `${q},${r}`,
          q,
          r,
          terrain,
          owner: null,
          city: false,
          capital: false,
          improvement: null,
          unrest: 0,
          explored: true,
          pulse: Math.random() * Math.PI * 2
        });
      }
    }
    state.tiles = tiles;
    setOwner(tileAt(2, 4), "player", true);
    setOwner(tileAt(1, 4), "player");
    setOwner(tileAt(2, 5), "player");
    setOwner(tileAt(9, 2), "north", true);
    setOwner(tileAt(9, 7), "steppe", true);
    setOwner(tileAt(5, 1), "ocean", true);
    state.selected = tileAt(2, 4);
  }

  function setOwner(tile, owner, capital = false) {
    if (!tile) return;
    tile.owner = owner;
    if (capital) {
      tile.city = true;
      tile.capital = true;
    }
    tile.unrest = 0;
  }

  function tileAt(q, r) {
    return state.tiles.find((tile) => tile.q === q && tile.r === r);
  }

  function neighbors(tile) {
    const odd = tile.q % 2;
    const dirs = odd
      ? [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [0, -1]]
      : [[1, -1], [1, 0], [0, 1], [-1, 0], [-1, -1], [0, -1]];
    return dirs.map(([dq, dr]) => tileAt(tile.q + dq, tile.r + dr)).filter(Boolean);
  }

  function isAdjacentToPlayer(tile) {
    return neighbors(tile).some((near) => near.owner === "player");
  }

  function ownedTiles(owner = "player") {
    return state.tiles.filter((tile) => tile.owner === owner);
  }

  function startGame() {
    audio.ensure();
    state.mode = "playing";
    state.turn = 1;
    state.era = 0;
    const crisis = els.scenarioFilter.value === "crisis";
    const frontier = els.scenarioFilter.value === "frontier";
    state.resources = {
      food: frontier ? 24 : 18,
      industry: crisis ? 14 : 18,
      knowledge: 0,
      culture: frontier ? 16 : 12,
      stability: crisis ? 44 : 62
    };
    state.population = 2;
    state.score = 0;
    state.councils = 0;
    state.correct = 0;
    state.missed = [];
    state.particles = [];
    state.banners = [];
    state.events = [];
    state.pendingAction = null;
    generateMap();
    updateHud();
    renderSelection();
    setAdvisor("Imperial Council", "Found your capital, claim provinces, build districts, and keep stability above collapse.", "The first dynasty rises beside the river.", "good");
    els.setupScreen.classList.remove("show");
    els.endScreen.classList.remove("show");
    els.menuScreen.classList.remove("show");
    els.councilScreen.classList.remove("show");
    window.MrMacsAnalytics?.track("game_play", {
      gameId: "empire-ascendant",
      title: "Empire Ascendant",
      course: els.courseFilter.value || "All Courses",
      gameType: "Strategy"
    }, { counter: "game-plays", once: false });
  }

  function updateHud() {
    els.food.textContent = formatNumber(state.resources.food);
    els.industry.textContent = formatNumber(state.resources.industry);
    els.knowledge.textContent = formatNumber(state.resources.knowledge);
    els.culture.textContent = formatNumber(state.resources.culture);
    els.stability.textContent = `${Math.floor(state.resources.stability)}%`;
    els.advisorMeta.textContent = `Turn ${state.turn} | ${ERAS[state.era]} Era`;
  }

  function setAdvisor(title, text, log = "", tone = "") {
    els.advisorTitle.textContent = title;
    els.advisorText.textContent = text;
    els.advisorLog.textContent = log;
    els.advisorLog.className = `advisor-log ${tone}`;
  }

  function canAfford(cost = {}) {
    return Object.entries(cost).every(([key, value]) => (state.resources[key] || 0) >= value);
  }

  function spend(cost = {}) {
    for (const [key, value] of Object.entries(cost)) state.resources[key] -= value;
  }

  function gain(values = {}) {
    for (const [key, value] of Object.entries(values)) {
      state.resources[key] = (state.resources[key] || 0) + value;
    }
    state.resources.stability = clamp(state.resources.stability, 0, 100);
  }

  function costText(cost = {}) {
    const parts = Object.entries(cost).map(([key, value]) => `${value} ${key}`);
    return parts.length ? parts.join(", ") : "free";
  }

  function yieldText(values = {}) {
    const parts = Object.entries(values).map(([key, value]) => `+${value} ${key}`);
    return parts.length ? parts.join(", ") : "no yield";
  }

  function renderSelection() {
    const tile = state.selected;
    if (!tile) {
      els.selectedTitle.textContent = "Select a province";
      els.selectedMeta.textContent = "Tap your capital or any bordering tile.";
      els.actionGrid.innerHTML = "";
      return;
    }
    const owner = tile.owner ? OWNERS[tile.owner].name : "Unclaimed";
    const terrain = TERRAIN[tile.terrain].label;
    const improvement = tile.improvement ? ` | ${IMPROVEMENTS[tile.improvement].label}` : "";
    els.selectedTitle.textContent = `${terrain} Province`;
    els.selectedMeta.textContent = `${owner}${tile.capital ? " | Capital" : ""}${improvement}${tile.unrest ? ` | Unrest ${tile.unrest}` : ""}`;
    renderActions(tile);
  }

  function renderActions(tile) {
    const actions = [];
    if (tile.owner === "player") {
      for (const [key, item] of Object.entries(IMPROVEMENTS)) {
        if (!tile.improvement && item.allowed.includes(tile.terrain)) {
          actions.push({
            key: `build:${key}`,
            label: `Build ${item.label}`,
            sub: `${costText(item.cost)} | ${yieldText(item.yield)}`,
            disabled: !canAfford(item.cost),
            action: () => buildImprovement(tile, key)
          });
        }
      }
      actions.push({
        key: "reform",
        label: "Call Reform Council",
        sub: "Review check | stability + knowledge",
        disabled: state.resources.culture < 4,
        action: () => openCouncil({ type: "reform", tile, cost: { culture: 4 } })
      });
    } else if (!tile.owner && isAdjacentToPlayer(tile)) {
      const cost = { culture: tile.terrain === "mountain" ? 12 : 8 };
      actions.push({
        key: "claim",
        label: "Claim Province",
        sub: `${costText(cost)} | review council`,
        disabled: !canAfford(cost),
        action: () => openCouncil({ type: "claim", tile, cost })
      });
    } else if (tile.owner && tile.owner !== "player" && isAdjacentToPlayer(tile)) {
      const cost = { industry: 10, culture: 6 };
      actions.push({
        key: "rival",
        label: `Challenge ${OWNERS[tile.owner].name}`,
        sub: `${costText(cost)} | border council`,
        disabled: !canAfford(cost),
        action: () => openCouncil({ type: "rival", tile, cost })
      });
    } else if (!tile.owner) {
      actions.push({
        key: "distant",
        label: "Too Far To Claim",
        sub: "Expand from a bordering province",
        disabled: true,
        action: () => {}
      });
    } else {
      actions.push({
        key: "rival-watch",
        label: OWNERS[tile.owner].name,
        sub: "Reach its border to negotiate or contest",
        disabled: true,
        action: () => {}
      });
    }
    if (!actions.length) {
      actions.push({
        key: "none",
        label: "Province Developed",
        sub: "Select a border tile or end the turn",
        disabled: true,
        action: () => {}
      });
    }
    els.actionGrid.innerHTML = actions.slice(0, 6).map((action, index) => (
      `<button type="button" data-index="${index}" ${action.disabled ? "disabled" : ""}>${escapeHtml(action.label)}<span>${escapeHtml(action.sub)}</span></button>`
    )).join("");
    els.actionGrid.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const action = actions[Number(button.dataset.index)];
        if (action && !action.disabled) action.action();
      });
    });
  }

  function buildImprovement(tile, key) {
    const improvement = IMPROVEMENTS[key];
    if (!tile || tile.owner !== "player" || tile.improvement || !improvement || !canAfford(improvement.cost)) return;
    spend(improvement.cost);
    tile.improvement = key;
    state.score += 250;
    gain({ stability: key === "fort" || key === "monument" ? 1 : 0 });
    audio.build();
    burst(tile, improvement.color, 22);
    banner(tile, improvement.label, improvement.color);
    setAdvisor("Provincial Works", `${improvement.label} changed the local economy. End the turn to collect the new yield.`, `${TERRAIN[tile.terrain].label}: ${yieldText(improvement.yield)}`, "good");
    updateHud();
    renderSelection();
  }

  function openCouncil(action) {
    if (!action || state.mode !== "playing") return;
    if (action.cost && !canAfford(action.cost)) return;
    state.pendingAction = action;
    state.mode = "council";
    const q = nextQuestion();
    state.pendingAction.question = q;
    state.pendingAction.choices = buildChoices(q);
    renderCouncil(action, q);
    els.councilScreen.classList.add("show");
  }

  function renderCouncil(action, q) {
    const typeLabel = {
      claim: "Expansion Council",
      rival: "Border Crisis",
      reform: "Reform Council",
      crisis: "Stability Crisis"
    }[action.type] || "Council Review";
    const value = q.value ? ` | ${q.value}` : "";
    els.questionMeta.textContent = `${typeLabel} | ${cleanText(q.course || "Social Studies")}${value}`;
    els.questionPrompt.textContent = displayPrompt(q);
    els.explanation.textContent = "";
    els.explanation.className = "explanation";
    renderStimulus(q);
    els.choiceGrid.innerHTML = action.choices.map((choice, index) => (
      `<button type="button" data-index="${index}">${escapeHtml(choice.text)}</button>`
    )).join("");
    els.choiceGrid.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => resolveCouncil(Number(button.dataset.index)));
    });
  }

  function renderStimulus(q) {
    const images = stimulusImagesFor(q);
    const text = stimulusTextFor(q);
    if (!images.length && !text) {
      els.stimulusBox.classList.remove("show");
      els.stimulusBox.innerHTML = "";
      return;
    }
    const imageHtml = images.slice(0, 2).map((image, index) => {
      const src = resolveStimulusSrc(image.src);
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(image.label || `Stimulus ${index + 1}`)}">`;
    }).join("");
    const textHtml = text ? `<div class="stimulus-text">${escapeHtml(text)}</div>` : "";
    els.stimulusBox.innerHTML = `${imageHtml}${textHtml}`;
    els.stimulusBox.classList.add("show");
  }

  function resolveCouncil(index) {
    const action = state.pendingAction;
    if (!action || state.mode !== "council") return;
    const choice = action.choices[index];
    if (!choice) return;
    const buttons = [...els.choiceGrid.querySelectorAll("button")];
    buttons.forEach((button, i) => {
      button.disabled = true;
      button.classList.toggle("correct", action.choices[i]?.correct);
      if (i === index && !choice.correct) button.classList.add("wrong");
    });
    state.councils += 1;
    const q = action.question;
    const explanation = displayExplanation(q);
    if (choice.correct) {
      state.correct += 1;
      els.explanation.textContent = explanation;
      els.explanation.className = "explanation good";
      applyCouncilSuccess(action);
      audio.correct();
    } else {
      els.explanation.textContent = `Correct answer: ${cleanText(q.answer)}. ${explanation}`;
      els.explanation.className = "explanation bad";
      state.missed.push(q);
      applyCouncilFailure(action);
      audio.wrong();
    }
    updateHud();
    renderSelection();
    setTimeout(closeCouncil, choice.correct ? 1200 : 2200);
  }

  function applyCouncilSuccess(action) {
    if (action.cost) spend(action.cost);
    if (action.type === "claim") {
      setOwner(action.tile, "player");
      gain({ food: 2, culture: 1, stability: 3 });
      state.score += 700 + state.era * 160;
      burst(action.tile, OWNERS.player.color, 28);
      banner(action.tile, "CLAIMED", OWNERS.player.color);
      setAdvisor("Expansion Approved", "The council backed your claim. The empire grows without destabilizing the realm.", `${TERRAIN[action.tile.terrain].label} province joined the realm.`, "good");
    } else if (action.type === "rival") {
      const oldOwner = action.tile.owner;
      setOwner(action.tile, "player");
      gain({ culture: 2, stability: 4 });
      state.score += 950 + state.era * 220;
      burst(action.tile, OWNERS.player.color, 32);
      banner(action.tile, "BORDER WON", OWNERS.player.color);
      setAdvisor("Border Victory", `${OWNERS[oldOwner].name} yielded the frontier after a clear council decision.`, "Your dynasty gains prestige.", "good");
    } else if (action.type === "reform") {
      gain({ knowledge: 8 + state.era * 2, stability: 9, culture: 1 });
      state.score += 600;
      burst(action.tile, "#7bdff2", 24);
      banner(action.tile, "REFORM", "#7bdff2");
      setAdvisor("Reform Passed", "Administration, legitimacy, and scholarship improved across the empire.", "+knowledge +stability", "good");
    } else if (action.type === "crisis") {
      gain({ stability: 12, culture: 4 });
      state.score += 650;
      setAdvisor("Crisis Contained", "The council response turned unrest into renewed legitimacy.", "+stability", "good");
    }
  }

  function applyCouncilFailure(action) {
    if (action.type === "claim") {
      gain({ stability: -8 });
      action.tile.unrest = Math.min(3, action.tile.unrest + 1);
      setAdvisor("Expansion Stalled", "The claim failed and local elites resisted imperial control.", "Stability fell. Review the answer before the next council.", "bad");
    } else if (action.type === "rival") {
      gain({ stability: -12, industry: -3 });
      setAdvisor("Border Reversal", "The rival state held the frontier and your army lost supplies.", "-stability -industry", "bad");
    } else if (action.type === "reform") {
      if (action.cost && canAfford(action.cost)) spend(action.cost);
      gain({ stability: -10 });
      setAdvisor("Reform Backlash", "The council misread the issue. Factions gained leverage.", "-stability", "bad");
    } else if (action.type === "crisis") {
      gain({ stability: -16 });
      setAdvisor("Crisis Deepens", "The unrest spread because the council response missed the core issue.", "-stability", "bad");
    }
    if (action.tile) {
      burst(action.tile, "#ff6f6f", 22);
      banner(action.tile, "UNREST", "#ff6f6f");
    }
  }

  function closeCouncil() {
    els.councilScreen.classList.remove("show");
    state.pendingAction = null;
    state.mode = "playing";
    checkEra();
    checkCollapse();
    updateHud();
    renderSelection();
  }

  function endTurn() {
    if (state.mode !== "playing") return;
    const yields = collectYields();
    state.turn += 1;
    state.score += ownedTiles().length * 42 + state.era * 70;
    state.resources.food -= Math.max(1, Math.floor(ownedTiles().length / 5));
    state.resources.stability += Math.min(3, Math.floor(state.resources.food / 18));
    if (state.resources.food < 0) {
      state.resources.stability -= 9;
      state.resources.food = 0;
      setAdvisor("Granary Shortage", "Food ran low. Build farms or claim river/coast provinces before instability spreads.", "-stability", "bad");
    } else {
      setAdvisor("Turn Complete", "Your provinces produced new resources. Rival empires are moving at the frontier.", yields, "good");
    }
    if (state.turn % (els.scenarioFilter.value === "frontier" ? 2 : 3) === 0) rivalTurn();
    if (state.turn % 5 === 0 || (els.scenarioFilter.value === "crisis" && state.turn % 4 === 0)) {
      openCouncil({ type: "crisis", tile: state.selected || ownedTiles()[0], cost: {} });
    }
    checkEra();
    checkCollapse();
    updateHud();
    renderSelection();
    audio.turn();
  }

  function collectYields() {
    const totals = { food: 0, industry: 0, knowledge: 0, culture: 0, stability: 0 };
    for (const tile of ownedTiles()) {
      const base = TERRAIN[tile.terrain];
      totals.food += base.food;
      totals.industry += base.industry;
      totals.knowledge += base.knowledge;
      totals.culture += base.culture;
      if (tile.city) {
        totals.food += 1;
        totals.industry += 1;
        totals.culture += 1;
      }
      if (tile.improvement) {
        const y = IMPROVEMENTS[tile.improvement].yield;
        for (const [key, value] of Object.entries(y)) totals[key] += value;
      }
      if (tile.unrest) totals.stability -= tile.unrest;
    }
    gain(totals);
    return Object.entries(totals)
      .filter(([, value]) => value)
      .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${key}`)
      .join(", ");
  }

  function rivalTurn() {
    for (const owner of ["north", "steppe", "ocean"]) {
      const frontier = state.tiles.filter((tile) => !tile.owner && neighbors(tile).some((near) => near.owner === owner));
      if (!frontier.length) continue;
      const target = shuffle(frontier).sort((a, b) => scoreTileForOwner(b, owner) - scoreTileForOwner(a, owner))[0];
      if (Math.random() < .72) {
        setOwner(target, owner);
        burst(target, OWNERS[owner].color, 14);
      }
    }
  }

  function scoreTileForOwner(tile) {
    const base = TERRAIN[tile.terrain];
    return base.food + base.industry + base.knowledge + base.culture + Math.random() * 2;
  }

  function checkEra() {
    const threshold = 35 + state.era * 32;
    if (state.era < ERAS.length - 1 && state.resources.knowledge >= threshold) {
      state.resources.knowledge -= threshold;
      state.era += 1;
      gain({ stability: 8, culture: 6, industry: 8 });
      audio.era();
      for (const tile of ownedTiles()) burst(tile, "#f2c14e", 6);
      setAdvisor("Era Advanced", `Your empire entered the ${ERAS[state.era]} Era. New legitimacy and production spread across the realm.`, "+stability +industry +culture", "good");
    }
    if (state.era >= ERAS.length - 1 && ownedTiles().length >= 18 && state.resources.stability >= 55) {
      endGame("Modern Golden Age");
    }
  }

  function checkCollapse() {
    if (state.resources.stability > 0) return;
    const outer = ownedTiles().filter((tile) => !tile.capital);
    const losses = shuffle(outer).slice(0, Math.max(1, Math.min(4, Math.ceil(outer.length / 5))));
    for (const tile of losses) {
      tile.owner = null;
      tile.city = false;
      tile.improvement = null;
      tile.unrest = 1;
      burst(tile, "#ff6f6f", 26);
      banner(tile, "REVOLT", "#ff6f6f");
    }
    state.resources.stability = 24;
    state.era = Math.max(0, state.era - 1);
    setAdvisor("Dynastic Collapse", "Low stability fractured the empire. Outlying provinces revolted and the state fell back an era.", "Rebuild legitimacy before expanding again.", "bad");
  }

  function endGame(title = "Empire Chronicle Sealed") {
    if (state.mode === "ended") return;
    state.mode = "ended";
    els.endScreen.classList.add("show");
    const accuracy = state.councils ? Math.round((state.correct / state.councils) * 100) : 0;
    const territory = ownedTiles().length;
    const finalScore = Math.floor(state.score + territory * 180 + state.era * 900 + state.resources.stability * 16);
    const best = Number(localStorage.getItem(`${STORAGE_KEY}:bestScore`) || 0);
    if (finalScore > best) localStorage.setItem(`${STORAGE_KEY}:bestScore`, String(finalScore));
    els.endTitle.textContent = title;
    els.endGrid.innerHTML = [
      [formatNumber(finalScore), "empire score"],
      [ERAS[state.era], "final era"],
      [String(territory), "provinces"],
      [`${accuracy}%`, "council accuracy"]
    ].map(([value, label]) => `<div class="end-tile"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
    if (state.missed.length) {
      const items = state.missed.slice(-5).map((q) => `<p><strong>${escapeHtml(cleanText(q.answer))}</strong>: ${escapeHtml(displayPrompt(q))}</p>`).join("");
      els.studyTargets.innerHTML = `<strong>Study targets from this campaign</strong>${items}`;
    } else {
      els.studyTargets.innerHTML = "<strong>No missed councils.</strong><p>Try the Age of Crisis scenario with a narrow course filter.</p>";
    }
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "empire-ascendant",
      title: "Empire Ascendant",
      score: finalScore,
      accuracy,
      questions: state.councils,
      course: els.courseFilter.value || "All Courses"
    }, { counter: "game-completions", once: false });
  }

  function showSetup() {
    state.mode = "setup";
    els.setupScreen.classList.add("show");
    els.endScreen.classList.remove("show");
    els.menuScreen.classList.remove("show");
    els.councilScreen.classList.remove("show");
  }

  function pauseGame() {
    if (state.mode !== "playing") return;
    state.mode = "menu";
    els.menuScreen.classList.add("show");
  }

  function resumeGame() {
    if (state.mode !== "menu") return;
    state.mode = "playing";
    els.menuScreen.classList.remove("show");
  }

  function exitArcade() {
    window.location.href = "../../";
  }

  function hexToPixel(tile) {
    const x = view.ox + view.size * 1.5 * tile.q;
    const y = view.oy + view.size * Math.sqrt(3) * (tile.r + .5 * (tile.q & 1));
    return { x, y };
  }

  function pixelToTile(px, py) {
    let best = null;
    let bestDist = Infinity;
    for (const tile of state.tiles) {
      const p = hexToPixel(tile);
      const dist = Math.hypot(px - p.x, py - p.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = tile;
      }
    }
    return bestDist < view.size * .95 ? best : null;
  }

  function hexPath(x, y, size = view.size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i);
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function draw() {
    drawBackground();
    drawMap();
    drawParticles();
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, view.width, view.height);
    grad.addColorStop(0, "#071013");
    grad.addColorStop(.48, "#0d1a1f");
    grad.addColorStop(1, "#101a16");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, view.width, view.height);
    if (!FX_LITE) {
      ctx.save();
      ctx.globalAlpha = .32;
      ctx.strokeStyle = "rgba(251,245,230,.06)";
      ctx.lineWidth = 1;
      for (let x = -80; x < view.width + 80; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + view.height * .4, view.height);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawMap() {
    ctx.save();
    const nudge = Math.sin(state.elapsed * .8) * state.cameraNudge;
    ctx.translate(nudge, nudge * .35);
    for (const tile of state.tiles) drawTile(tile);
    for (const tile of state.tiles) drawTileOverlay(tile);
    ctx.restore();
  }

  function drawTile(tile) {
    const p = hexToPixel(tile);
    const terrain = TERRAIN[tile.terrain];
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.38)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;
    hexPath(p.x, p.y, view.size - 2);
    const fill = ctx.createRadialGradient(p.x - view.size * .25, p.y - view.size * .35, 6, p.x, p.y, view.size);
    fill.addColorStop(0, lighten(terrain.color, .20));
    fill.addColorStop(1, terrain.color);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = terrain.edge;
    ctx.globalAlpha = .95;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    if (tile.owner) {
      ctx.save();
      hexPath(p.x, p.y, view.size - 6);
      ctx.fillStyle = OWNERS[tile.owner].fill;
      ctx.fill();
      ctx.strokeStyle = OWNERS[tile.owner].color;
      ctx.lineWidth = tile.owner === "player" ? 4 : 3;
      ctx.stroke();
      ctx.restore();
    }

    if (!tile.owner && isAdjacentToPlayer(tile)) {
      ctx.save();
      ctx.globalAlpha = .6 + Math.sin(state.elapsed * 3 + tile.pulse) * .16;
      hexPath(p.x, p.y, view.size - 8);
      ctx.strokeStyle = "rgba(242,193,78,.72)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    if (state.selected === tile) {
      ctx.save();
      ctx.globalAlpha = .95;
      ctx.shadowColor = "#f2c14e";
      ctx.shadowBlur = 22;
      hexPath(p.x, p.y, view.size + 4);
      ctx.strokeStyle = "#f2c14e";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTileOverlay(tile) {
    const p = hexToPixel(tile);
    if (tile.capital || tile.city) drawCity(p.x, p.y, tile);
    if (tile.improvement) drawImprovement(p.x, p.y, tile.improvement);
    if (tile.unrest) {
      ctx.save();
      ctx.fillStyle = "#ff6f6f";
      ctx.font = `900 ${Math.max(11, view.size * .30)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("UNREST", p.x, p.y + view.size * .68);
      ctx.restore();
    }
  }

  function drawCity(x, y, tile) {
    const color = tile.owner ? OWNERS[tile.owner].color : "#fbf5e6";
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(0,0,0,.40)";
    ctx.fillRect(-view.size * .30, -view.size * .04, view.size * .60, view.size * .25);
    ctx.fillStyle = color;
    ctx.fillRect(-view.size * .24, -view.size * .22, view.size * .13, view.size * .44);
    ctx.fillRect(-view.size * .06, -view.size * .34, view.size * .13, view.size * .56);
    ctx.fillRect(view.size * .13, -view.size * .16, view.size * .13, view.size * .38);
    if (tile.capital) {
      ctx.beginPath();
      ctx.moveTo(-view.size * .06, -view.size * .42);
      ctx.lineTo(view.size * .22, -view.size * .34);
      ctx.lineTo(-view.size * .06, -view.size * .26);
      ctx.closePath();
      ctx.fillStyle = "#fbf5e6";
      ctx.fill();
    }
    ctx.restore();
  }

  function drawImprovement(x, y, key) {
    const item = IMPROVEMENTS[key];
    ctx.save();
    ctx.translate(x, y + view.size * .28);
    ctx.fillStyle = item.color;
    ctx.strokeStyle = "rgba(0,0,0,.42)";
    ctx.lineWidth = 2;
    if (key === "farm") {
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * view.size * .10, -view.size * .16);
        ctx.lineTo(i * view.size * .10 + view.size * .06, view.size * .12);
        ctx.strokeStyle = item.color;
        ctx.stroke();
      }
    } else if (key === "workshop") {
      ctx.fillRect(-view.size * .18, -view.size * .12, view.size * .36, view.size * .24);
      ctx.fillRect(view.size * .02, -view.size * .28, view.size * .10, view.size * .18);
    } else if (key === "academy") {
      ctx.beginPath();
      ctx.moveTo(-view.size * .24, view.size * .12);
      ctx.lineTo(0, -view.size * .22);
      ctx.lineTo(view.size * .24, view.size * .12);
      ctx.closePath();
      ctx.fill();
    } else if (key === "monument") {
      ctx.beginPath();
      ctx.moveTo(0, -view.size * .26);
      ctx.lineTo(view.size * .16, view.size * .16);
      ctx.lineTo(-view.size * .16, view.size * .16);
      ctx.closePath();
      ctx.fill();
    } else if (key === "fort") {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 4;
      ctx.strokeRect(-view.size * .22, -view.size * .18, view.size * .44, view.size * .32);
    } else if (key === "harbor") {
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -view.size * .05, view.size * .20, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for (const p of state.particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of state.banners) {
      ctx.globalAlpha = clamp(b.life, 0, 1);
      ctx.fillStyle = b.color;
      ctx.font = `900 ${Math.max(14, view.size * .32)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,.55)";
      ctx.shadowBlur = 8;
      ctx.fillText(b.text, b.x, b.y);
    }
    ctx.restore();
  }

  function update(dt) {
    state.elapsed += dt;
    state.cameraNudge = Math.max(0, state.cameraNudge - dt * 5);
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= .98;
      p.vy = p.vy * .98 + 30 * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const b of state.banners) {
      b.life -= dt;
      b.y += b.vy * dt;
    }
    state.banners = state.banners.filter((b) => b.life > 0);
  }

  function burst(tile, color, count) {
    const p = hexToPixel(tile);
    const actual = FX_LITE ? Math.ceil(count * .45) : count;
    for (let i = 0; i < actual; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 135;
      state.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        life: .45 + Math.random() * .5
      });
    }
    state.cameraNudge = Math.max(state.cameraNudge, 1);
  }

  function banner(tile, text, color) {
    const p = hexToPixel(tile);
    state.banners.push({ x: p.x, y: p.y - view.size * .62, text, color, life: 1.2, vy: -24 });
  }

  function lighten(hex, amount) {
    const raw = hex.replace("#", "");
    const r = clamp(parseInt(raw.slice(0, 2), 16) + 255 * amount, 0, 255);
    const g = clamp(parseInt(raw.slice(2, 4), 16) + 255 * amount, 0, 255);
    const b = clamp(parseInt(raw.slice(4, 6), 16) + 255 * amount, 0, 255);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  }

  function loop(now) {
    const dt = Math.min(.033, ((now || 0) - (state.last || now || 0)) / 1000 || .016);
    state.last = now || 0;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function bind() {
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", (event) => {
      if (state.mode !== "playing") return;
      audio.ensure();
      const tile = pixelToTile(event.clientX, event.clientY);
      if (!tile) return;
      state.selected = tile;
      audio.select();
      renderSelection();
      const owner = tile.owner ? OWNERS[tile.owner].name : "Unclaimed";
      setAdvisor("Province Selected", `${TERRAIN[tile.terrain].label} province. ${owner}.`, "Choose an action or end the turn.", "");
    });
    els.courseFilter.addEventListener("change", () => {
      populateSets();
      applyFilters();
    });
    els.setFilter.addEventListener("change", applyFilters);
    els.scenarioFilter.addEventListener("change", renderSetupMetrics);
    els.startBtn.addEventListener("click", startGame);
    els.endTurnBtn.addEventListener("click", endTurn);
    els.pauseBtn.addEventListener("click", () => state.mode === "menu" ? resumeGame() : pauseGame());
    els.resumeBtn.addEventListener("click", resumeGame);
    els.restartBtn.addEventListener("click", startGame);
    els.againBtn.addEventListener("click", startGame);
    els.setupBtn.addEventListener("click", showSetup);
    els.exitBtn.addEventListener("click", exitArcade);
    els.menuExitBtn.addEventListener("click", exitArcade);
    els.soundBtn.addEventListener("click", () => {
      audio.enabled = !audio.enabled;
      els.soundBtn.textContent = audio.enabled ? "Sound On" : "Sound Off";
      if (audio.enabled) audio.ensure();
    });
    els.fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape") {
        if (state.mode === "playing") pauseGame();
        else if (state.mode === "menu") resumeGame();
      }
      if (event.code === "Enter" && state.mode === "playing") endTurn();
    });
  }

  async function init() {
    resize();
    bind();
    requestAnimationFrame(loop);
    try {
      await loadBank();
    } catch (error) {
      console.error(error);
      els.startBtn.textContent = "Bank failed to load";
      els.setupMetrics.innerHTML = `<span class="metric-pill">Question bank could not load. Try refreshing the page.</span>`;
    }
  }

  init();
})();
