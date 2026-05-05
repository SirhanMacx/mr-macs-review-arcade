(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const SourceBank = window.MrMacsSourceBank || {};
  const COLS = 21;
  const ROWS = 17;
  const CELL = 32;
  const LEVEL = [
    "#####################",
    "#o........#........o#",
    "#.###.###.#.###.###.#",
    "#...................#",
    "#.###.#.#####.#.###.#",
    "#.....#...#...#.....#",
    "#####.### # ###.#####",
    "    #.#       #.#    ",
    "#####.# ## ## #.#####",
    "     . #     # .     ",
    "#####.# ##### #.#####",
    "#.........#.........#",
    "#.###.###.#.###.###.#",
    "#o..#...........#..o#",
    "###.#.#.#####.#.#.###",
    "#.....#...#...#.....#",
    "#####################"
  ];
  const dirs = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 }
  };
  const opposite = { left: "right", right: "left", up: "down", down: "up" };
  const gateAssets = [
    "../../assets/review-maze-chase/gate-gold.png",
    "../../assets/review-maze-chase/gate-blue.png",
    "../../assets/review-maze-chase/gate-purple.png",
    "../../assets/review-maze-chase/gate-green.png"
  ];
  const assets = {
    player: "../../assets/review-maze-chase/player.png",
    red: "../../assets/review-maze-chase/chaser-red.png",
    blue: "../../assets/review-maze-chase/chaser-blue.png",
    purple: "../../assets/review-maze-chase/chaser-purple.png",
    green: "../../assets/review-maze-chase/chaser-green.png",
    pellet: "../../assets/review-maze-chase/pellet.png",
    scroll: "../../assets/review-maze-chase/scroll-power.png",
    wall: "../../assets/review-maze-chase/wall-tile.png",
    shield: "../../assets/review-maze-chase/shield.png",
    burst: "../../assets/review-maze-chase/burst.png",
    background: "../../assets/review-maze-chase/key-art.webp"
  };
  const els = {
    canvas: $("game"),
    setup: $("setup"),
    quiz: $("quiz"),
    result: $("result"),
    courseFilter: $("courseFilter"),
    setFilter: $("setFilter"),
    speedFilter: $("speedFilter"),
    metrics: $("metrics"),
    score: $("score"),
    lives: $("lives"),
    pellets: $("pellets"),
    power: $("power"),
    startBtn: $("startBtn"),
    setupBtn: $("setupBtn"),
    againBtn: $("againBtn"),
    questionMeta: $("questionMeta"),
    questionPrompt: $("questionPrompt"),
    stimulus: $("stimulus"),
    choices: $("choices"),
    feedback: $("feedback"),
    resultTitle: $("resultTitle"),
    resultMetrics: $("resultMetrics"),
    coach: $("coach")
  };
  const ctx = els.canvas.getContext("2d", { alpha: false });
  const images = {};
  const state = {
    bank: [],
    filtered: [],
    queue: [],
    grid: [],
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    pelletsLeft: 0,
    correct: 0,
    answered: 0,
    combo: 0,
    powerUntil: 0,
    player: { x: 10, y: 13, dir: "left", next: "left" },
    chasers: [],
    currentQuestion: null,
    pointer: null,
    countdownUntil: 0,
    freezeUntil: 0,
    message: "",
    messageUntil: 0,
    lastStep: 0,
    lastDraw: 0,
    speedMs: 128
  };

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }
  function normalize(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function number(value) {
    return Number(value || 0).toLocaleString();
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function lerp(start, end, t) {
    return start + (end - start) * t;
  }
  function ease(t) {
    const v = clamp(t, 0, 1);
    return v * v * (3 - 2 * v);
  }
  function show(panel) {
    [els.setup, els.quiz, els.result].forEach((el) => el.classList.remove("show"));
    if (panel) panel.classList.add("show");
  }
  function canMove(x, y) {
    return y >= 0 && y < ROWS && x >= 0 && x < COLS && LEVEL[y][x] !== "#";
  }
  function nextTile(actor, dirName) {
    const dir = dirs[dirName];
    if (!dir) return null;
    let x = actor.x + dir.x;
    let y = actor.y + dir.y;
    if (y === 9 && x < 0) x = COLS - 1;
    if (y === 9 && x >= COLS) x = 0;
    if (!canMove(x, y)) return null;
    return { x, y };
  }
  function moveActor(actor, x, y, now) {
    actor.prevX = actor.x;
    actor.prevY = actor.y;
    actor.x = x;
    actor.y = y;
    actor.moveAt = now;
  }
  function actorDisplay(actor, now) {
    const t = ease((now - Number(actor.moveAt || 0)) / state.speedMs);
    return {
      x: lerp(Number(actor.prevX ?? actor.x), actor.x, t),
      y: lerp(Number(actor.prevY ?? actor.y), actor.y, t)
    };
  }
  function setMessage(text, ms = 1200) {
    state.message = text;
    state.messageUntil = performance.now() + ms;
  }
  function setDirection(dir) {
    if (dirs[dir]) state.player.next = dir;
  }
  function image(name) {
    return images[name];
  }
  function drawImg(name, x, y, size, alpha = 1) {
    const img = image(name);
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }

  async function loadImages() {
    await Promise.all(Object.entries(assets).map(([key, src]) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = reject;
      img.src = src;
    })));
  }
  async function loadBank() {
    const response = await fetch("../../data/chrono-defense-bank.json?v=20260504-maze");
    const data = await response.json();
    state.bank = (data.questions || []).filter(playableQuestion);
    const byCourse = {};
    for (const q of state.bank) {
      if (!q.course) continue;
      if (!byCourse[q.course]) byCourse[q.course] = new Set();
      byCourse[q.course].add(q.set || q.day || q.subject || "Review");
    }
    state.setsByCourse = Object.fromEntries(Object.entries(byCourse).map(([course, sets]) => [course, [...sets].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))]));
    const courses = ["All Courses", ...Object.keys(byCourse).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))];
    els.courseFilter.innerHTML = courses.map((course) => `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`).join("");
    populateSets();
    applyFilters();
  }
  function playableQuestion(q) {
    if (!q) return false;
    if (SourceBank.playableSharedPrompt && !SourceBank.playableSharedPrompt(q)) return false;
    if (SourceBank.sourceBased && SourceBank.sourceBased(q) && SourceBank.sourceLock && !SourceBank.sourceLock(q).ok) return false;
    if (q.type === "mcq") return Array.isArray(q.choices) && q.choices.length >= 3;
    return Boolean(q.answer && (q.prompt || q.stem));
  }
  function populateSets() {
    const course = els.courseFilter.value || "All Courses";
    const sets = course === "All Courses" ? ["All Sets"] : ["All Sets", ...(state.setsByCourse?.[course] || [])];
    els.setFilter.innerHTML = sets.map((set) => `<option value="${escapeHtml(set)}">${escapeHtml(set)}</option>`).join("");
  }
  function applyFilters() {
    const course = els.courseFilter.value || "All Courses";
    const set = els.setFilter.value || "All Sets";
    state.filtered = state.bank.filter((q) => {
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && (q.set || q.day || q.subject || "Review") !== set) return false;
      return true;
    });
    if (!state.filtered.length) state.filtered = state.bank.slice();
    state.queue = shuffle(state.filtered);
    const stimulus = state.filtered.filter((q) => (SourceBank.stimulusImages ? SourceBank.stimulusImages(q) : q.stimulusImages || []).length).length;
    els.metrics.innerHTML = [
      `${number(state.filtered.length)} prompts loaded`,
      `${number(stimulus)} source-image prompts`,
      `${number(new Set(state.filtered.map((q) => q.course)).size)} courses in filter`
    ].map((text) => `<span>${escapeHtml(text)}</span>`).join("");
  }
  function nextQuestion() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    return state.queue.pop() || state.filtered[Math.floor(Math.random() * state.filtered.length)];
  }
  function promptFor(q) {
    return SourceBank.displayPrompt ? SourceBank.displayPrompt(q) : clean(q.prompt || q.stem);
  }
  function answerFor(q) {
    return SourceBank.answerText ? SourceBank.answerText(q) : clean(q.answer);
  }
  function sourceFor(q) {
    return SourceBank.displaySource ? SourceBank.displaySource(q) : clean(q.source || q.category || q.set || "");
  }
  function stimulusFor(q) {
    return SourceBank.stimulusImages ? SourceBank.stimulusImages(q) : (q.stimulusImages || []).filter((img) => img && img.src);
  }
  function choicesFor(q) {
    if (q.type === "mcq" && Array.isArray(q.choices)) {
      const correct = answerFor(q);
      const choices = q.choices.map((choice) => ({ text: clean(choice.text), correct: normalize(choice.text) === normalize(correct) || String(choice.label) === String(q.correct) }));
      return shuffle(choices).slice(0, 4);
    }
    const correct = answerFor(q);
    const same = state.filtered.concat(state.bank)
      .filter((item) => item !== q && item.answer)
      .map((item) => clean(item.answer))
      .filter((text) => text && normalize(text) !== normalize(correct));
    const distractors = [...new Map(shuffle(same).map((text) => [normalize(text), text])).values()].slice(0, 3);
    return shuffle([{ text: correct, correct: true }, ...distractors.map((text) => ({ text, correct: false }))]).slice(0, 4);
  }
  function openQuestion() {
    const q = nextQuestion();
    const choices = choicesFor(q);
    state.paused = true;
    state.currentQuestion = q;
    els.feedback.classList.remove("show-text");
    els.feedback.textContent = "";
    els.questionMeta.textContent = [q.course, q.set || q.day, sourceFor(q)].filter(Boolean).join(" · ");
    els.questionPrompt.textContent = promptFor(q);
    const imagesForQuestion = stimulusFor(q);
    els.stimulus.innerHTML = imagesForQuestion.map((img) => {
      const label = SourceBank.displayStimulusLabel ? SourceBank.displayStimulusLabel(q, img) : (img.label || "Source");
      return `<figure><img src="${escapeHtml(img.src)}" alt="${escapeHtml(label)}"><figcaption>${escapeHtml(label)}</figcaption></figure>`;
    }).join("");
    els.choices.innerHTML = choices.map((choice, index) => {
      const gate = gateAssets[index % gateAssets.length];
      return `<button class="choice" type="button" data-index="${index}"><img src="${gate}" alt=""><span>${escapeHtml(choice.text)}</span></button>`;
    }).join("");
    [...els.choices.querySelectorAll(".choice")].forEach((button) => {
      button.addEventListener("click", () => answerQuestion(choices[Number(button.dataset.index)], button, choices));
    });
    show(els.quiz);
  }
  function answerQuestion(choice, button, choices) {
    [...els.choices.querySelectorAll(".choice")].forEach((choiceButton, index) => {
      choiceButton.disabled = true;
      if (choices[index].correct) choiceButton.classList.add("correct");
    });
    state.answered += 1;
    if (choice.correct) {
      state.correct += 1;
      state.score += 600;
      state.combo = 0;
      state.powerUntil = performance.now() + 11000;
      setMessage("SOURCE POWER: chase the chasers", 1500);
      button.classList.add("correct");
      els.feedback.innerHTML = `<strong>Correct. Source power online.</strong><br>${escapeHtml(state.currentQuestion.explanation || "Chasers are vulnerable. Clear the maze.")}`;
    } else {
      state.lives = Math.max(0, state.lives - 1);
      button.classList.add("wrong");
      els.feedback.innerHTML = `<strong>Not yet.</strong><br>Answer: ${escapeHtml(answerFor(state.currentQuestion))}<br>${escapeHtml(state.currentQuestion.explanation || "Use the explanation, then keep moving.")}`;
    }
    els.feedback.classList.add("show-text");
    updateHud();
    setTimeout(() => {
      show(null);
      state.paused = false;
      if (state.lives <= 0) endRun(false);
    }, choice.correct ? 1100 : 2100);
  }

  function resetGrid() {
    state.grid = LEVEL.map((row) => row.split(""));
    state.pelletsLeft = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (state.grid[y][x] === "." || state.grid[y][x] === "o") state.pelletsLeft += 1;
      }
    }
  }
  function resetActors() {
    const now = performance.now();
    state.player = { x: 10, y: 13, prevX: 10, prevY: 13, moveAt: now, dir: "left", next: "left" };
    state.chasers = [
      { x: 9, y: 8, prevX: 9, prevY: 8, moveAt: now, dir: "left", img: "red", personality: "hunter", scatter: { x: 1, y: 1 }, home: { x: 9, y: 8 }, releaseAt: now + 400 },
      { x: 10, y: 8, prevX: 10, prevY: 8, moveAt: now, dir: "right", img: "blue", personality: "ambush", scatter: { x: 19, y: 1 }, home: { x: 10, y: 8 }, releaseAt: now + 1400 },
      { x: 11, y: 8, prevX: 11, prevY: 8, moveAt: now, dir: "up", img: "purple", personality: "patrol", scatter: { x: 1, y: 15 }, home: { x: 11, y: 8 }, releaseAt: now + 2600 },
      { x: 10, y: 7, prevX: 10, prevY: 7, moveAt: now, dir: "down", img: "green", personality: "mirror", scatter: { x: 19, y: 15 }, home: { x: 10, y: 7 }, releaseAt: now + 3600 }
    ];
  }
  function startRun() {
    const now = performance.now();
    state.running = true;
    state.paused = false;
    state.score = 0;
    state.lives = 3;
    state.correct = 0;
    state.answered = 0;
    state.combo = 0;
    state.powerUntil = 0;
    state.countdownUntil = now + 2200;
    state.freezeUntil = 0;
    state.lastStep = now;
    state.speedMs = els.speedFilter.value === "fast" ? 104 : els.speedFilter.value === "study" ? 162 : 128;
    resetGrid();
    resetActors();
    setMessage("READY", 2200);
    show(null);
    updateHud();
    window.MrMacsAnalytics?.track("game_open", { gameId: "review-maze-chase", title: "Review Maze Chase" }, { counter: "game-opens" });
  }
  function updateHud() {
    els.score.textContent = number(state.score);
    els.lives.textContent = state.lives;
    els.pellets.textContent = state.pelletsLeft;
    els.power.textContent = Math.max(0, Math.ceil((state.powerUntil - performance.now()) / 1000));
  }
  function eatCell() {
    const cell = state.grid[state.player.y][state.player.x];
    if (cell === ".") {
      state.grid[state.player.y][state.player.x] = " ";
      state.score += 10;
      state.pelletsLeft -= 1;
    } else if (cell === "o") {
      state.grid[state.player.y][state.player.x] = " ";
      state.score += 80;
      state.pelletsLeft -= 1;
      setMessage("SOURCE SCROLL", 900);
      openQuestion();
    }
    if (state.pelletsLeft <= 0) endRun(true);
  }
  function stepPlayer(now) {
    const queued = nextTile(state.player, state.player.next);
    if (queued) state.player.dir = state.player.next;
    const tile = nextTile(state.player, state.player.dir);
    if (tile) {
      moveActor(state.player, tile.x, tile.y, now);
      eatCell();
    }
  }
  function chaserOptions(chaser) {
    return Object.entries(dirs)
      .filter(([name, dir]) => name !== opposite[chaser.dir] && canMove(chaser.x + dir.x, chaser.y + dir.y));
  }
  function targetFor(chaser) {
    const powered = performance.now() < state.powerUntil;
    if (powered) return chaser.scatter;
    if (chaser.personality === "ambush") {
      const dir = dirs[state.player.dir] || dirs.left;
      return { x: clamp(state.player.x + dir.x * 3, 0, COLS - 1), y: clamp(state.player.y + dir.y * 3, 0, ROWS - 1) };
    }
    if (chaser.personality === "patrol") return Math.abs(chaser.x - state.player.x) + Math.abs(chaser.y - state.player.y) > 7 ? state.player : chaser.scatter;
    if (chaser.personality === "mirror") return { x: COLS - 1 - state.player.x, y: ROWS - 1 - state.player.y };
    return state.player;
  }
  function stepChasers(now) {
    const powered = now < state.powerUntil;
    for (const chaser of state.chasers) {
      if (now < chaser.releaseAt) continue;
      let target = targetFor(chaser);
      let options = chaserOptions(chaser);
      if (!options.length) options = Object.entries(dirs).filter(([, dir]) => canMove(chaser.x + dir.x, chaser.y + dir.y));
      options.sort((a, b) => {
        const da = Math.hypot(chaser.x + a[1].x - target.x, chaser.y + a[1].y - target.y);
        const db = Math.hypot(chaser.x + b[1].x - target.x, chaser.y + b[1].y - target.y);
        return powered ? db - da : da - db;
      });
      const chosen = Math.random() < .18 ? options[Math.floor(Math.random() * options.length)] : options[0];
      if (chosen) {
        chaser.dir = chosen[0];
        const tile = nextTile(chaser, chosen[0]);
        if (tile) moveActor(chaser, tile.x, tile.y, now);
      }
    }
  }
  function handleCollisions(now) {
    const powered = now < state.powerUntil;
    for (const chaser of state.chasers) {
      if (chaser.x !== state.player.x || chaser.y !== state.player.y) continue;
      if (powered) {
        state.combo += 1;
        state.score += 300 * state.combo;
        moveActor(chaser, chaser.home.x, chaser.home.y, now);
        chaser.releaseAt = now + 1600;
        setMessage(`${300 * state.combo} SOURCE COMBO`, 900);
      } else {
        state.lives -= 1;
        state.combo = 0;
        state.freezeUntil = now + 650;
        setMessage("SHIELD LOST", 900);
        resetActors();
        if (state.lives <= 0) endRun(false);
      }
      updateHud();
      break;
    }
  }
  function endRun(won) {
    state.running = false;
    state.paused = true;
    els.resultTitle.textContent = won ? "Archive maze cleared" : "Archive overrun";
    const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
    els.resultMetrics.innerHTML = [
      `${number(state.score)} score`,
      `${state.correct}/${state.answered} gates`,
      `${accuracy}% accuracy`,
      `${state.pelletsLeft} evidence left`
    ].map((text) => `<span>${escapeHtml(text)}</span>`).join("");
    els.coach.textContent = accuracy >= 80 ? "Strong review run. Raise the speed or switch to a harder course set." : "Replay one course set and use each source-scroll explanation before speeding up.";
    show(els.result);
    window.MrMacsAnalytics?.track("game_complete", { gameId: "review-maze-chase", title: "Review Maze Chase", score: accuracy, questions: state.answered }, { counter: "game-completions" });
  }
  function step(now) {
    if (state.running && !state.paused && now >= state.countdownUntil && now >= state.freezeUntil && now - state.lastStep >= state.speedMs) {
      state.lastStep = now;
      stepPlayer(now);
      stepChasers(now);
      handleCollisions(now);
      updateHud();
    }
    draw(now);
    requestAnimationFrame(step);
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    els.canvas.width = Math.floor(innerWidth * dpr);
    els.canvas.height = Math.floor(innerHeight * dpr);
  }
  function cellToScreen(x, y, board) {
    return {
      x: board.x + x * board.cell + board.cell / 2,
      y: board.y + y * board.cell + board.cell / 2
    };
  }
  function boardRect() {
    const maxW = els.canvas.width * .9;
    const maxH = els.canvas.height * .68;
    const cell = Math.floor(Math.min(maxW / COLS, maxH / ROWS));
    return {
      cell,
      x: Math.floor((els.canvas.width - cell * COLS) / 2),
      y: Math.floor((els.canvas.height - cell * ROWS) / 2 + els.canvas.height * .04)
    };
  }
  function draw(now) {
    const w = els.canvas.width;
    const h = els.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image("background"), 0, 0, w, h);
    ctx.fillStyle = "rgba(3,6,15,.68)";
    ctx.fillRect(0, 0, w, h);
    const board = boardRect();
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = board.cell * .7;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const sx = board.x + x * board.cell;
        const sy = board.y + y * board.cell;
        const cell = state.grid[y]?.[x] || LEVEL[y][x];
        if (LEVEL[y][x] === "#") {
          ctx.drawImage(image("wall"), sx - 1, sy - 1, board.cell + 2, board.cell + 2);
        } else {
          ctx.fillStyle = "rgba(7,13,28,.78)";
          ctx.fillRect(sx, sy, board.cell, board.cell);
          ctx.strokeStyle = "rgba(111,238,255,.06)";
          ctx.strokeRect(sx + .5, sy + .5, board.cell - 1, board.cell - 1);
          if (cell === ".") {
            const pulse = 0.86 + Math.sin(now / 140 + x * 1.7 + y) * 0.1;
            drawImg("pellet", sx + board.cell / 2, sy + board.cell / 2, board.cell * .58 * pulse);
          }
          if (cell === "o") {
            ctx.save();
            ctx.shadowColor = "rgba(255,212,92,.78)";
            ctx.shadowBlur = board.cell * .42;
            drawImg("scroll", sx + board.cell / 2, sy + board.cell / 2 + Math.sin(now / 180 + x) * board.cell * .06, board.cell * 1.12);
            ctx.restore();
          }
        }
      }
    }
    const powered = now < state.powerUntil;
    for (const chaser of state.chasers) {
      const at = actorDisplay(chaser, now);
      const pos = cellToScreen(at.x, at.y, board);
      const released = now >= chaser.releaseAt;
      drawImg(chaser.img, pos.x, pos.y, board.cell * 1.34, powered ? .48 : 1);
      if (powered) drawImg("burst", pos.x, pos.y, board.cell * .74, .7);
      if (!released) {
        ctx.save();
        ctx.strokeStyle = "rgba(111,238,255,.74)";
        ctx.lineWidth = Math.max(2, board.cell * .08);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, board.cell * .58, -Math.PI / 2, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
      }
    }
    const playerAt = actorDisplay(state.player, now);
    const p = cellToScreen(playerAt.x, playerAt.y, board);
    ctx.save();
    const rotation = state.player.dir === "right" ? 0 : state.player.dir === "down" ? Math.PI / 2 : state.player.dir === "up" ? -Math.PI / 2 : Math.PI;
    ctx.translate(p.x, p.y);
    ctx.rotate(rotation);
    const playerPulse = 1 + Math.sin(now / 85) * .035;
    const img = image("player");
    if (img) ctx.drawImage(img, -board.cell * .73 * playerPulse, -board.cell * .73 * playerPulse, board.cell * 1.46 * playerPulse, board.cell * 1.46 * playerPulse);
    ctx.restore();
    for (let i = 0; i < state.lives; i++) drawImg("shield", board.x + i * board.cell * 1.1 + board.cell * .55, board.y - board.cell * .7, board.cell * .75);
    ctx.restore();
    drawOverlayText(now, w, h, board);
  }
  function drawOverlayText(now, w, h, board) {
    const countdown = Math.ceil((state.countdownUntil - now) / 1000);
    const showCountdown = state.running && !state.paused && countdown > 0;
    const showMessage = state.message && now < state.messageUntil;
    if (!showCountdown && !showMessage) return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = showCountdown ? (countdown > 1 ? String(countdown - 1) : "GO") : state.message;
    const y = showCountdown ? h * .48 : Math.max(board.y - board.cell * 1.25, h * .18);
    ctx.font = showCountdown ? `950 ${Math.min(96, Math.max(52, board.cell * 3.4))}px Inter, sans-serif` : `950 ${Math.min(34, Math.max(18, board.cell * .8))}px Inter, sans-serif`;
    ctx.lineWidth = Math.max(4, board.cell * .16);
    ctx.strokeStyle = "rgba(3,6,15,.88)";
    ctx.fillStyle = showCountdown ? "#ffd45c" : "#6eeeff";
    ctx.strokeText(text, w / 2, y);
    ctx.fillText(text, w / 2, y);
    ctx.restore();
  }
  function installQaHook() {
    if (!new URLSearchParams(location.search).has("qa")) return;
    window.__reviewMazeQA = {
      startRun,
      openQuestion,
      state,
      metrics: () => ({
        score: state.score,
        lives: state.lives,
        pelletsLeft: state.pelletsLeft,
        filtered: state.filtered.length,
        running: state.running,
        paused: state.paused,
        combo: state.combo,
        countdown: Math.max(0, state.countdownUntil - performance.now())
      })
    };
  }

  els.courseFilter.addEventListener("change", () => { populateSets(); applyFilters(); });
  els.setFilter.addEventListener("change", applyFilters);
  els.startBtn.addEventListener("click", startRun);
  els.againBtn.addEventListener("click", startRun);
  els.setupBtn.addEventListener("click", () => { state.running = false; state.paused = true; show(els.setup); });
  document.querySelectorAll("[data-dir]").forEach((button) => button.addEventListener("click", () => setDirection(button.dataset.dir)));
  addEventListener("keydown", (event) => {
    const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
    if (map[event.key]) {
      event.preventDefault();
      setDirection(map[event.key]);
    }
  });
  els.canvas.addEventListener("pointerdown", (event) => { state.pointer = { x: event.clientX, y: event.clientY }; });
  els.canvas.addEventListener("pointerup", (event) => {
    if (!state.pointer) return;
    const dx = event.clientX - state.pointer.x;
    const dy = event.clientY - state.pointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 24) setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    state.pointer = null;
  });
  addEventListener("resize", resize);

  Promise.all([loadImages(), loadBank()]).then(() => {
    resize();
    resetGrid();
    resetActors();
    updateHud();
    installQaHook();
    requestAnimationFrame(step);
  });
})();
