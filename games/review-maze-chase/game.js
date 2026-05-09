(() => {
  "use strict";

  // ─── Constants ──────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const SourceBank = window.MrMacsSourceBank || {};
  const COLS = 21;
  const ROWS = 17;
  const CELL = 32;

  // Keep original maze layout exactly
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

  // Row 9 is the tunnel row (spaces on both sides)
  const TUNNEL_ROW = 9;

  const dirs = {
    left:  { x: -1, y:  0 },
    right: { x:  1, y:  0 },
    up:    { x:  0, y: -1 },
    down:  { x:  0, y:  1 }
  };
  const opposite = { left: "right", right: "left", up: "down", down: "up" };

  const gateAssets = [
    "../../assets/review-maze-chase/gate-gold.png",
    "../../assets/review-maze-chase/gate-blue.png",
    "../../assets/review-maze-chase/gate-purple.png",
    "../../assets/review-maze-chase/gate-green.png"
  ];
  const assetSrcs = {
    player:     "../../assets/review-maze-chase/player.png",
    red:        "../../assets/review-maze-chase/chaser-red.png",
    blue:       "../../assets/review-maze-chase/chaser-blue.png",
    purple:     "../../assets/review-maze-chase/chaser-purple.png",
    green:      "../../assets/review-maze-chase/chaser-green.png",
    pellet:     "../../assets/review-maze-chase/pellet.png",
    scroll:     "../../assets/review-maze-chase/scroll-power.png",
    wall:       "../../assets/review-maze-chase/wall-tile.png",
    shield:     "../../assets/review-maze-chase/shield.png",
    burst:      "../../assets/review-maze-chase/burst.png",
    background: "../../assets/review-maze-chase/key-art.webp"
  };

  // Ghost personality to image name
  const GHOST_DEFS = [
    { img: "red",    personality: "blinky", scatter: { x: 20, y: 0  }, home: { x: 9,  y: 8 }, releaseDelay: 400  },
    { img: "purple", personality: "pinky",  scatter: { x: 0,  y: 0  }, home: { x: 10, y: 8 }, releaseDelay: 1400 },
    { img: "blue",   personality: "inky",   scatter: { x: 20, y: 16 }, home: { x: 11, y: 8 }, releaseDelay: 2600 },
    { img: "green",  personality: "clyde",  scatter: { x: 0,  y: 16 }, home: { x: 10, y: 7 }, releaseDelay: 3600 }
  ];

  // Scatter/Chase cycle: [scatter, chase, scatter, chase, ...] seconds
  const MODE_CYCLE = [7, 20, 7, 20, 5, 20, 5, Infinity];

  // Fruit definitions per level (score value)
  const FRUIT_SCORES = [100, 300, 500, 700, 1000, 2000, 3000, 5000, 5000, 5000];

  // ─── DOM refs ────────────────────────────────────────────────────────────────
  const els = {
    canvas:         $("game"),
    setup:          $("setup"),
    quiz:           $("quiz"),
    result:         $("result"),
    courseFilter:   $("courseFilter"),
    setFilter:      $("setFilter"),
    speedFilter:    $("speedFilter"),
    metrics:        $("metrics"),
    score:          $("score"),
    lives:          $("lives"),
    pellets:        $("pellets"),
    power:          $("power"),
    startBtn:       $("startBtn"),
    setupBtn:       $("setupBtn"),
    againBtn:       $("againBtn"),
    questionMeta:   $("questionMeta"),
    questionPrompt: $("questionPrompt"),
    stimulus:       $("stimulus"),
    choices:        $("choices"),
    feedback:       $("feedback"),
    resultTitle:    $("resultTitle"),
    resultMetrics:  $("resultMetrics"),
    coach:          $("coach")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const images = {};

  // ─── Phase 5 — Lite-mode flag ────────────────────────────────────────────────
  let liteMode = false;
  function applyLiteMode(lite) {
    liteMode = !!lite;
    // screen-shake amplitude: zeroed in shake() below when liteMode is true
  }
  if (window.MrMacsArcadePerf) {
    applyLiteMode(window.MrMacsArcadePerf.isLite());
    window.MrMacsArcadePerf.onChange(applyLiteMode);
  }

  // ─── Audio engine ────────────────────────────────────────────────────────────
  let audioCtx = null;
  let muted = false;
  let sirenOsc = null;
  let sirenGain = null;
  let wakkaToggle = false;
  let pelletsAtStart = 0;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, gainVal, startDelay = 0, gainRamp = true) {
    if (muted) return;
    const ac = getAudio();
    if (!ac) return;
    try {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime + startDelay);
      gain.gain.setValueAtTime(gainVal, ac.currentTime + startDelay);
      if (gainRamp) gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + startDelay + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime + startDelay);
      osc.stop(ac.currentTime + startDelay + duration + 0.01);
    } catch (_) {}
  }

  function playWakka() {
    if (muted) return;
    const freq = wakkaToggle ? 220 : 330;
    wakkaToggle = !wakkaToggle;
    playTone(freq, "square", 0.07, 0.18);
  }

  function playPowerPellet() {
    playTone(880, "sine", 0.12, 0.22);
    playTone(660, "sine", 0.12, 0.22, 0.12);
    playTone(440, "sine", 0.18, 0.22, 0.24);
  }

  function playGhostEat(combo) {
    const base = 220;
    for (let i = 0; i < 4; i++) {
      const f = base * Math.pow(1.3, i + combo * 0.4);
      playTone(Math.min(f, 1760), "triangle", 0.09, 0.25, i * 0.08);
    }
  }

  function playDeath() {
    const ac = getAudio();
    if (!ac || muted) return;
    try {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 1.2);
      gain.gain.setValueAtTime(0.28, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.3);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 1.4);
    } catch (_) {}
  }

  function playCorrect() {
    playTone(523, "sine", 0.09, 0.22);
    playTone(659, "sine", 0.09, 0.22, 0.09);
    playTone(784, "sine", 0.18, 0.22, 0.18);
  }

  function playWrong() {
    playTone(200, "square", 0.1, 0.2);
    playTone(150, "square", 0.15, 0.2, 0.1);
  }

  function startSiren(scared = false) {
    stopSiren();
    const ac = getAudio();
    if (!ac || muted) return;
    try {
      sirenOsc  = ac.createOscillator();
      sirenGain = ac.createGain();
      sirenOsc.type = "sine";
      sirenOsc.frequency.setValueAtTime(scared ? 440 : 180, ac.currentTime);
      sirenGain.gain.setValueAtTime(muted ? 0 : sirenGainFor(scared), ac.currentTime);
      sirenOsc.connect(sirenGain);
      sirenGain.connect(ac.destination);
      sirenOsc.start();
    } catch (_) {}
  }

  function stopSiren() {
    try { sirenOsc && sirenOsc.stop(); } catch (_) {}
    sirenOsc  = null;
    sirenGain = null;
  }

  // If the cabinet music engine is running, pull the siren down 30% so both layers coexist cleanly.
  function sirenGainFor(scared) {
    const base = scared ? 0.1 : 0.06;
    const musicActive = !!(window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.isPlaying && window.MrMacsArcadeMusic.isPlaying());
    return musicActive ? base * 0.7 : base;
  }

  function updateSirenPitch(pelletsLeft, total, scared) {
    if (!sirenOsc || muted) return;
    const ac = getAudio();
    if (!ac) return;
    try {
      const ratio = 1 - (pelletsLeft / (total || 1));
      const base  = scared ? 440 : 160;
      const top   = scared ? 880 : 340;
      const freq  = base + (top - base) * ratio;
      sirenOsc.frequency.setValueAtTime(freq, ac.currentTime);
      if (sirenGain) sirenGain.gain.setValueAtTime(muted ? 0 : sirenGainFor(scared), ac.currentTime);
    } catch (_) {}
  }

  function setMuted(val) {
    muted = val;
    if (muted) {
      stopSiren();
      if (sirenGain) sirenGain.gain.setValueAtTime(0, audioCtx?.currentTime || 0);
    } else {
      if (state.running && !state.paused) {
        const scared = performance.now() < state.powerUntil;
        startSiren(scared);
      }
    }
  }

  // ─── MrMacsProfile shards helper ────────────────────────────────────────────
  function awardShards(n) {
    try { window.MrMacsProfile && window.MrMacsProfile.addShards(n, "review-maze-chase"); } catch (e) {}
  }

  // ─── Game state ──────────────────────────────────────────────────────────────
  const state = {
    // data
    bank: [], filtered: [], queue: [], grid: [],
    // flags
    running: false, paused: false,
    // counters
    score: 0, bestScore: 0, lives: 3, pelletsLeft: 0,
    correct: 0, answered: 0, combo: 0, ghostEatCombo: 0,
    // power-up
    powerUntil: 0, powerFlashAt: 0,
    // level
    level: 1, baseSpeedMs: 128,
    // mode cycling (scatter/chase)
    modeStartAt: 0, modeIndex: 0, currentMode: "scatter",
    // actors
    player: null, chasers: [],
    // question gate
    currentQuestion: null,
    pelletsAtLastQuestion: 0, ghostEatsAtLastQuestion: 0,
    // fruit
    fruitCell: null, fruitScore: 0, fruitUntil: 0,
    fruitSpawnedAt70: false, fruitSpawnedAt170: false,
    // popups
    popups: [],
    // screen shake
    shakeUntil: 0, shakeMag: 0,
    // death animation
    deathAnim: null,
    // level-up flash
    levelFlashUntil: 0,
    // pause
    explicitPause: false,
    // pointer (swipe)
    pointer: null,
    // timers
    countdownUntil: 0, freezeUntil: 0,
    message: "", messageUntil: 0,
    lastStep: 0, speedMs: 128,
    // stars
    stars: [],
    // profile integration
    fruitEatenThisRun: 0,
    hasAnsweredCorrectlyOnce: false
  };

  // ─── Utility ─────────────────────────────────────────────────────────────────
  function escapeHtml(v) {
    return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function clean(v)     { return String(v || "").replace(/\s+/g, " ").trim(); }
  function normalize(v) { return clean(v).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function number(v)          { return Number(v || 0).toLocaleString(); }
  function clamp(v, lo, hi)   { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t)      { return a + (b - a) * t; }
  function ease(t)            { const v = clamp(t,0,1); return v * v * (3 - 2 * v); }
  function show(panel) {
    [els.setup, els.quiz, els.result].forEach(el => el.classList.remove("show"));
    if (panel) panel.classList.add("show");
  }

  // ─── Grid helpers ─────────────────────────────────────────────────────────────
  function isWall(x, y) {
    if (y < 0 || y >= ROWS) return true;
    // Tunnel: row 9 wraps around; spaces at edges are passable
    if (y === TUNNEL_ROW && (x < 0 || x >= COLS)) return false;
    if (x < 0 || x >= COLS) return true;
    return LEVEL[y][x] === "#";
  }
  function canMove(x, y) { return !isWall(x, y); }

  function wrapX(x, y) {
    if (y === TUNNEL_ROW) {
      if (x < 0)    return COLS - 1;
      if (x >= COLS) return 0;
    }
    return x;
  }

  function nextTile(actor, dirName) {
    const d = dirs[dirName];
    if (!d) return null;
    let nx = actor.x + d.x;
    let ny = actor.y + d.y;
    if (ny === TUNNEL_ROW) { nx = wrapX(nx, ny); }
    if (!canMove(nx, ny)) return null;
    return { x: nx, y: ny };
  }

  function moveActor(actor, x, y, now) {
    actor.prevX  = actor.x;
    actor.prevY  = actor.y;
    actor.x      = x;
    actor.y      = y;
    actor.moveAt = now;
  }

  function actorDisplay(actor, now) {
    const t = ease((now - Number(actor.moveAt || 0)) / state.speedMs);
    return {
      x: lerp(Number(actor.prevX ?? actor.x), actor.x, t),
      y: lerp(Number(actor.prevY ?? actor.y), actor.y, t)
    };
  }

  // ─── Ghost AI helpers ────────────────────────────────────────────────────────
  function getBlinky()  { return state.chasers.find(c => c.personality === "blinky") || state.chasers[0]; }

  function ghostTarget(chaser) {
    const now    = performance.now();
    const powered = now < state.powerUntil;
    const mode   = state.currentMode;

    // All frightened ghosts flee to scatter corner
    if (powered && !chaser.eaten) return chaser.scatter;

    // Eaten ghosts (eyes) return home
    if (chaser.eaten) return chaser.home;

    // In scatter mode, ghosts go to their corner
    if (mode === "scatter") return chaser.scatter;

    // Chase mode: distinct personalities
    switch (chaser.personality) {
      case "blinky": {
        // Direct chase
        return state.player;
      }
      case "pinky": {
        // Target 4 cells ahead of player direction
        const d = dirs[state.player.dir] || dirs.left;
        return {
          x: clamp(state.player.x + d.x * 4, 0, COLS - 1),
          y: clamp(state.player.y + d.y * 4, 0, ROWS - 1)
        };
      }
      case "inky": {
        // Vector from Blinky, doubled through player
        const blinky = getBlinky();
        const pd = dirs[state.player.dir] || dirs.left;
        const mid = { x: state.player.x + pd.x * 2, y: state.player.y + pd.y * 2 };
        return {
          x: clamp(2 * mid.x - blinky.x, 0, COLS - 1),
          y: clamp(2 * mid.y - blinky.y, 0, ROWS - 1)
        };
      }
      case "clyde": {
        // Chase when far (>8), scatter to corner when close
        const dist = Math.hypot(chaser.x - state.player.x, chaser.y - state.player.y);
        return dist > 8 ? state.player : chaser.scatter;
      }
      default:
        return state.player;
    }
  }

  function ghostOptions(chaser) {
    const opts = [];
    for (const [name, d] of Object.entries(dirs)) {
      // Can't reverse (except when just frightened or returning home)
      if (!chaser.justReversed && name === opposite[chaser.dir]) continue;
      let nx = chaser.x + d.x;
      let ny = chaser.y + d.y;
      if (ny === TUNNEL_ROW) nx = wrapX(nx, ny);
      if (canMove(nx, ny)) opts.push([name, d, nx, ny]);
    }
    chaser.justReversed = false;
    if (!opts.length) {
      // Fallback: allow reversal
      for (const [name, d] of Object.entries(dirs)) {
        let nx = chaser.x + d.x;
        let ny = chaser.y + d.y;
        if (ny === TUNNEL_ROW) nx = wrapX(nx, ny);
        if (canMove(nx, ny)) opts.push([name, d, nx, ny]);
      }
    }
    return opts;
  }

  function stepGhosts(now) {
    const powered = now < state.powerUntil;
    for (const chaser of state.chasers) {
      if (now < chaser.releaseAt) continue;

      // Eaten ghosts move faster
      const speedFactor = chaser.eaten ? 0.5 : 1;
      if (now - chaser.lastStep < state.speedMs * speedFactor) continue;
      chaser.lastStep = now;

      const target  = ghostTarget(chaser);
      const options = ghostOptions(chaser);
      if (!options.length) continue;

      // Frightened ghosts move randomly
      let chosen;
      if (powered && !chaser.eaten) {
        chosen = options[Math.floor(Math.random() * options.length)];
      } else {
        // Sort by distance to target, add 15% randomness for lower ghosts
        options.sort((a, b) => {
          const da = Math.hypot(a[2] - target.x, a[3] - target.y);
          const db = Math.hypot(b[2] - target.x, b[3] - target.y);
          return da - db;
        });
        const chaos = chaser.personality === "clyde" ? 0.22 : 0.12;
        chosen = Math.random() < chaos
          ? options[Math.floor(Math.random() * options.length)]
          : options[0];
      }

      if (chosen) {
        chaser.dir = chosen[0];
        moveActor(chaser, chosen[2], chosen[3], now);
      }

      // Eaten ghost arrived home — revive
      if (chaser.eaten && chaser.x === chaser.home.x && chaser.y === chaser.home.y) {
        chaser.eaten      = false;
        chaser.releaseAt  = now + 1200;
      }
    }
  }

  // ─── Mode cycling (scatter / chase) ─────────────────────────────────────────
  function updateModeCycle(now) {
    if (state.powerUntil > now) return; // pause mode cycle during power
    const elapsed = (now - state.modeStartAt) / 1000;
    let cumulative = 0;
    for (let i = 0; i < MODE_CYCLE.length; i++) {
      cumulative += MODE_CYCLE[i];
      if (elapsed < cumulative) {
        const newMode = (i % 2 === 0) ? "scatter" : "chase";
        if (newMode !== state.currentMode) {
          state.currentMode = newMode;
          // Reverse all non-eaten, non-released ghosts
          for (const c of state.chasers) {
            if (!c.eaten && performance.now() >= c.releaseAt) {
              c.dir = opposite[c.dir];
              c.justReversed = true;
            }
          }
        }
        return;
      }
    }
    state.currentMode = "chase";
  }

  // ─── Popups ───────────────────────────────────────────────────────────────────
  function addPopup(text, x, y, color = "#ffd45c") {
    state.popups.push({
      text, x, y, color,
      born: performance.now(),
      life: 900
    });
  }

  // ─── Screen shake ─────────────────────────────────────────────────────────────
  function shake(ms = 320, mag = 6) {
    if (prefersReducedMotion) return;
    state.shakeUntil = performance.now() + ms;
    state.shakeMag   = liteMode ? 0 : mag;
  }

  // ─── Death animation ──────────────────────────────────────────────────────────
  function startDeathAnim(x, y) {
    if (prefersReducedMotion) return;
    state.deathAnim = { x, y, born: performance.now(), life: 900 };
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function animateScore(target) {
    // Tween the displayed score with a count-up animation
    const el    = els.score;
    const start = parseInt(el.textContent.replace(/,/g, ""), 10) || 0;
    if (start === target) return;
    const dur   = 380;
    const t0    = performance.now();
    // Pulse the chip briefly
    const chip = el.closest(".hud-chip");
    if (chip) {
      chip.classList.remove("score-pulse");
      void chip.offsetWidth; // reflow to restart animation
      chip.classList.add("score-pulse");
    }
    function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = number(Math.round(lerp(start, target, ease(p))));
      if (p < 1) requestAnimationFrame(tick);
      else if (chip) chip.classList.remove("score-pulse");
    }
    requestAnimationFrame(tick);
  }

  function updateHud() {
    animateScore(state.score);
    // Lives icons
    els.lives.innerHTML = Array.from({ length: Math.max(0, state.lives) },
      () => '<span class="life-icon" aria-hidden="true">🔮</span>'
    ).join("") || "0";
    els.pellets.textContent = state.pelletsLeft;
    const powerSec = Math.max(0, Math.ceil((state.powerUntil - performance.now()) / 1000));
    els.power.textContent  = powerSec > 0 ? `${powerSec}s` : "";
    // Level in title
    const levelEl = $("levelIndicator");
    if (levelEl) levelEl.textContent = `LVL ${state.level}`;
    // Best score
    const bestEl = $("bestScore");
    if (bestEl) bestEl.textContent = number(state.bestScore);
  }

  // ─── Question gating ─────────────────────────────────────────────────────────
  function shouldAskQuestion() {
    // Trigger every 5 pellets eaten (from last trigger) OR every 5th ghost eat
    const pelletsDiff = (pelletsAtStart - state.pelletsLeft) - state.pelletsAtLastQuestion;
    if (pelletsDiff >= 5) return true;
    if (state.ghostEatCombo > 0 && state.ghostEatCombo % 5 === 0 &&
        state.ghostEatCombo !== state.ghostEatsAtLastQuestion) return true;
    return false;
  }

  function openQuestion() {
    const q       = nextQuestion();
    const choices = choicesFor(q);
    state.paused          = true;
    state.currentQuestion = q;
    state.pelletsAtLastQuestion  = pelletsAtStart - state.pelletsLeft;
    state.ghostEatsAtLastQuestion = state.ghostEatCombo;

    // Pause siren
    if (sirenGain) {
      try { sirenGain.gain.setValueAtTime(0, audioCtx?.currentTime || 0); } catch (_) {}
    }
    // Duck cabinet music during question modal
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck && window.MrMacsArcadeMusic.duck(); } catch (_) {}

    els.feedback.classList.remove("show-text");
    els.feedback.textContent = "";
    els.questionMeta.textContent = [q.course, q.set || q.day, sourceFor(q)].filter(Boolean).join(" · ");
    els.questionPrompt.textContent = promptFor(q);
    const imgsQ = stimulusFor(q);
    els.stimulus.innerHTML = imgsQ.map(img => {
      const lbl = SourceBank.displayStimulusLabel
        ? SourceBank.displayStimulusLabel(q, img)
        : (img.label || "Source");
      return `<figure><img src="${escapeHtml(img.src)}" alt="${escapeHtml(lbl)}"><figcaption>${escapeHtml(lbl)}</figcaption></figure>`;
    }).join("");
    els.choices.innerHTML = choices.map((choice, i) => {
      const gate = gateAssets[i % gateAssets.length];
      return `<button class="choice" type="button" data-index="${i}"><img src="${gate}" alt=""><span>${escapeHtml(choice.text)}</span></button>`;
    }).join("");
    [...els.choices.querySelectorAll(".choice")].forEach(btn => {
      btn.addEventListener("click", () => answerQuestion(choices[Number(btn.dataset.index)], btn, choices));
    });
    show(els.quiz);
  }

  function answerQuestion(choice, button, choices) {
    [...els.choices.querySelectorAll(".choice")].forEach((b, i) => {
      b.disabled = true;
      if (choices[i].correct) b.classList.add("correct");
    });
    state.answered += 1;
    const now = performance.now();

    if (choice.correct) {
      state.correct += 1;
      state.score   += 600;
      awardShards(50);
      if (!state.hasAnsweredCorrectlyOnce) {
        state.hasAnsweredCorrectlyOnce = true;
        try { window.MrMacsProfile && window.MrMacsProfile.unlock("first-correct"); } catch (e) {}
      }
      // Bonus: extend power time, give speed boost
      if (now < state.powerUntil) {
        state.powerUntil += 4000; // 4s extra scare time
        setMessage("CORRECT! +4s SCARE TIME", 1400);
      } else {
        // Spawn a fruit as bonus
        spawnFruit();
        setMessage("CORRECT! BONUS FRUIT!", 1400);
      }
      button.classList.add("correct");
      playCorrect();
      els.feedback.innerHTML = `<strong>Correct.</strong><br>${escapeHtml(state.currentQuestion.explanation || "Keep moving.")}`;
    } else {
      state.lives = Math.max(0, state.lives - 1);
      button.classList.add("wrong");
      playWrong();
      shake(400, 8);
      // Wrong: ghosts speed up for 5s
      state.ghostSpeedBoost = now + 5000;
      els.feedback.innerHTML = `<strong>Not yet.</strong><br>Answer: ${escapeHtml(answerFor(state.currentQuestion))}<br>${escapeHtml(state.currentQuestion.explanation || "")}`;
    }
    els.feedback.classList.add("show-text");
    updateHud();

    // Phase 1 — recordAnswer hook
    if (window.MrMacsProfile) {
      try {
        window.MrMacsProfile.recordAnswer({
          course:  state.currentQuestion.course || "All Courses",
          set:     state.currentQuestion.set || "Maze Chase",
          correct: choice.correct,
          prompt:  promptFor(state.currentQuestion),
          answer:  answerFor(state.currentQuestion),
          gameId:  "review-maze-chase"
        });
      } catch (e) {}
    }

    const delay = choice.correct ? 1100 : 2100;
    setTimeout(() => {
      show(null);
      state.paused = false;
      // Restore cabinet music after modal
      try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore && window.MrMacsArcadeMusic.restore(); } catch (_) {}
      // Resume siren
      if (state.running && !muted) {
        const scared = performance.now() < state.powerUntil;
        if (!sirenOsc) startSiren(scared);
        else if (sirenGain) {
          try { sirenGain.gain.setValueAtTime(sirenGainFor(scared), audioCtx?.currentTime || 0); } catch (_) {}
        }
      }
      if (state.lives <= 0) endRun(false);
    }, delay);
  }

  // ─── Grid / actors reset ──────────────────────────────────────────────────────
  function resetGrid() {
    state.grid = LEVEL.map(row => row.split(""));
    state.pelletsLeft = 0;
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (state.grid[y][x] === "." || state.grid[y][x] === "o") state.pelletsLeft++;
    pelletsAtStart = state.pelletsLeft;
    state.fruitCell = null;
    state.fruitUntil = 0;
    state.fruitSpawnedAt70  = false;
    state.fruitSpawnedAt170 = false;
  }

  function resetActors() {
    const now = performance.now();
    state.player = {
      x: 10, y: 13, prevX: 10, prevY: 13,
      moveAt: now, dir: "left", next: "left"
    };
    state.chasers = GHOST_DEFS.map(def => ({
      ...def,
      prevX: def.home.x, prevY: def.home.y,
      x: def.home.x, y: def.home.y,
      moveAt: now,
      dir: "left",
      lastStep: now,
      releaseAt: now + def.releaseDelay,
      eaten: false,
      justReversed: false
    }));
    state.modeStartAt  = now;
    state.modeIndex    = 0;
    state.currentMode  = "scatter";
    state.ghostEatCombo = 0;
    state.powerUntil    = 0;
    state.powerFlashAt  = 0;
    state.ghostSpeedBoost = 0;
  }

  // ─── Stars (background) ───────────────────────────────────────────────────────
  function initStars() {
    state.stars = Array.from({ length: 60 }, () => ({
      x:    Math.random(),
      y:    Math.random(),
      r:    0.5 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0008 + Math.random() * 0.0008
    }));
  }

  // ─── Fruit ───────────────────────────────────────────────────────────────────
  function spawnFruit() {
    // Place fruit at a random open corridor cell
    const open = [];
    for (let y = 1; y < ROWS - 1; y++)
      for (let x = 1; x < COLS - 1; x++)
        if (state.grid[y][x] === " ") open.push({ x, y });
    if (!open.length) return;
    const cell       = open[Math.floor(Math.random() * open.length)];
    const levelIdx   = clamp(state.level - 1, 0, FRUIT_SCORES.length - 1);
    state.fruitCell  = cell;
    state.fruitScore = FRUIT_SCORES[levelIdx];
    state.fruitUntil = performance.now() + 9500;
  }

  // ─── Eating ──────────────────────────────────────────────────────────────────
  function eatCell(now, board) {
    const { x, y } = state.player;
    const cell = state.grid[y]?.[x];

    if (cell === ".") {
      state.grid[y][x] = " ";
      state.score      += 10;
      state.pelletsLeft--;
      playWakka();
      awardShards(1);
      const pos = cellToScreen(x, y, board);
      addPopup("+10", pos.x, pos.y, "#ffffff");
    } else if (cell === "o") {
      state.grid[y][x] = " ";
      state.score      += 50;
      state.pelletsLeft--;
      playPowerPellet();
      awardShards(5);
      const powerDur  = Math.max(4000, 7000 - (state.level - 1) * 300);
      state.powerUntil  = now + powerDur;
      state.powerFlashAt = now + powerDur - 2000;
      state.ghostEatCombo = 0; // reset chain
      // Reverse all released ghosts
      for (const c of state.chasers) {
        if (!c.eaten && now >= c.releaseAt) {
          c.dir = opposite[c.dir];
          c.justReversed = true;
        }
      }
      setMessage("SOURCE SCROLL!", 900);
      const pos = cellToScreen(x, y, board);
      addPopup("+50 POWER!", pos.x, pos.y, "#ffd45c");
      // Siren switches to scared
      stopSiren();
      startSiren(true);
      // Trigger question on power pellet
      setTimeout(() => openQuestion(), 200);
      return;
    }

    // Fruit
    if (state.fruitCell && x === state.fruitCell.x && y === state.fruitCell.y && now < state.fruitUntil) {
      state.score     += state.fruitScore;
      const pos        = cellToScreen(x, y, board);
      addPopup(`+${state.fruitScore}`, pos.x, pos.y, "#ff72d2");
      playTone(880, "triangle", 0.3, 0.28);
      state.fruitCell  = null;
      state.fruitUntil = 0;
      awardShards(25);
      state.fruitEatenThisRun++;
      if (state.fruitEatenThisRun === 10) {
        try { window.MrMacsProfile && window.MrMacsProfile.unlock("maze-fruit-king"); } catch (e) {}
      }
      updateHud();
    }

    // Pellet milestones for fruit
    const eaten = pelletsAtStart - state.pelletsLeft;
    if (!state.fruitSpawnedAt70  && eaten >= 70)  { spawnFruit(); state.fruitSpawnedAt70  = true; }
    if (!state.fruitSpawnedAt170 && eaten >= 170) { spawnFruit(); state.fruitSpawnedAt170 = true; }

    if (state.pelletsLeft <= 0) {
      advanceLevel();
      return;
    }

    // Question trigger (not during power)
    if (now >= state.powerUntil && shouldAskQuestion()) {
      setTimeout(() => openQuestion(), 80);
    }
  }

  // ─── Level advance ────────────────────────────────────────────────────────────
  function advanceLevel() {
    if (state.level >= 10) { endRun(true); return; }
    awardShards(100);
    state.level++;
    state.score += 2000 + state.level * 500;
    if (state.level === 5) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlock("maze-level-5"); } catch (e) {}
    }
    // Golden flash for level-up
    state.levelFlashUntil = performance.now() + 700;
    setMessage(`LEVEL ${state.level}! ARCHIVE DEEPER`, 2200);
    // Ghost speed increases 5% per level
    state.speedMs = Math.max(80, Math.round(state.baseSpeedMs * Math.pow(0.95, state.level - 1)));
    const now = performance.now();
    state.countdownUntil = now + 2200;
    state.freezeUntil    = now + 2200;
    resetGrid();
    resetActors();
    updateHud();
  }

  // ─── Player step ─────────────────────────────────────────────────────────────
  function stepPlayer(now, board) {
    // Try queued direction
    const queued = nextTile(state.player, state.player.next);
    if (queued) state.player.dir = state.player.next;

    const tile = nextTile(state.player, state.player.dir);
    if (tile) {
      moveActor(state.player, tile.x, tile.y, now);
      eatCell(now, board);
    }
  }

  // ─── Collisions ──────────────────────────────────────────────────────────────
  function handleCollisions(now, board) {
    const powered = now < state.powerUntil;
    for (const chaser of state.chasers) {
      if (chaser.eaten) continue;
      if (chaser.x !== state.player.x || chaser.y !== state.player.y) continue;

      if (powered) {
        // Eat ghost
        state.ghostEatCombo++;
        state.ghostEatCombo % 5; // tick counter
        const chain  = state.ghostEatCombo;
        const pts    = [200, 400, 800, 1600][Math.min(chain - 1, 3)];
        state.score += pts;
        const pos    = cellToScreen(chaser.x, chaser.y, board);
        addPopup(`+${pts}`, pos.x, pos.y, "#6eeeff");
        playGhostEat(chain - 1);
        shake(180, 4);
        awardShards(15);
        chaser.eaten     = true;
        chaser.releaseAt = now + 4000; // will be set again on home arrival
        setMessage(`GHOST ${chain}x CHAIN!`, 900);
        updateHud();
      } else {
        // Player dies
        state.lives--;
        state.combo = 0;
        const pAt  = actorDisplay(state.player, now);
        const pos  = cellToScreen(pAt.x, pAt.y, board);
        startDeathAnim(pos.x, pos.y);
        playDeath();
        shake(600, 10);
        setMessage("SHIELD LOST", 900);
        state.freezeUntil = now + 1200;
        resetActors();
        updateHud();
        if (state.lives <= 0) {
          setTimeout(() => endRun(false), 1300);
        }
      }
      break;
    }
  }

  // ─── Start / end ──────────────────────────────────────────────────────────────
  function startRun() {
    // Resume AudioContext on user gesture
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    if (!audioCtx) getAudio();

    const now = performance.now();
    state.running       = true;
    state.paused        = false;
    state.explicitPause = false;
    state.score         = 0;
    state.lives         = 3;
    state.correct       = 0;
    state.answered      = 0;
    state.combo         = 0;
    state.ghostEatCombo = 0;
    state.level         = 1;
    state.popups        = [];
    state.ghostSpeedBoost = 0;
    state.deathAnim     = null;
    state.levelFlashUntil = 0;
    state.countdownUntil = now + 2200;
    state.freezeUntil   = 0;
    state.pelletsAtLastQuestion   = 0;
    state.ghostEatsAtLastQuestion = 0;
    state.fruitEatenThisRun       = 0;
    state.hasAnsweredCorrectlyOnce = false;

    // Honor MrMacsProfile sound setting
    if (window.MrMacsProfile) {
      try {
        const settings = window.MrMacsProfile.getSettings();
        if (settings && settings.sound === "off") setMuted(true);
      } catch (e) {}
    }

    const speedSel = els.speedFilter.value;
    state.baseSpeedMs = speedSel === "fast" ? 104 : speedSel === "study" ? 162 : 128;
    state.speedMs = state.baseSpeedMs;

    resetGrid();
    resetActors();
    setMessage("READY", 2200);
    show(null);
    updateHud();
    stopSiren();
    startSiren(false);
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start("maze-cabinet"); } catch (e) {}

    // Best score from localStorage
    const stored = parseInt(localStorage.getItem("mazeChaseBest") || "0", 10);
    state.bestScore = stored;
    const bestEl = $("bestScore");
    if (bestEl) bestEl.textContent = number(state.bestScore);

    window.MrMacsAnalytics?.track("game_open", {
      gameId: "review-maze-chase", title: "Review Maze Chase"
    }, { counter: "game-opens" });
  }

  function endRun(won) {
    state.running = false;
    state.paused  = true;
    stopSiren();
    try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch (e) {}

    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem("mazeChaseBest", String(state.bestScore));
    }

    els.resultTitle.textContent = won ? "Archive Maze Cleared!" : "Archive Overrun";
    const accuracy = state.answered
      ? Math.round((state.correct / state.answered) * 100)
      : 0;
    els.resultMetrics.innerHTML = [
      `${number(state.score)} score`,
      `Best: ${number(state.bestScore)}`,
      `Level ${state.level}`,
      `${state.correct}/${state.answered} gates`,
      `${accuracy}% accuracy`,
      `${state.pelletsLeft} evidence left`
    ].map(t => `<span>${escapeHtml(t)}</span>`).join("");
    els.coach.textContent = accuracy >= 80
      ? "Strong run. Raise speed or switch to a harder course set."
      : "Replay one set and read each explanation before pushing speed.";
    show(els.result);
    window.MrMacsAnalytics?.track("game_complete", {
      gameId: "review-maze-chase", title: "Review Maze Chase",
      score: accuracy, questions: state.answered
    }, { counter: "game-completions" });
  }

  // ─── Pause ────────────────────────────────────────────────────────────────────
  function togglePause() {
    if (!state.running) return;
    state.explicitPause = !state.explicitPause;
    state.paused        = state.explicitPause;
    if (state.paused) {
      if (sirenGain) {
        try { sirenGain.gain.setValueAtTime(0, audioCtx?.currentTime || 0); } catch (_) {}
      }
    } else {
      if (!muted && !sirenOsc) startSiren(performance.now() < state.powerUntil);
      else if (sirenGain && !muted) {
        const scared = performance.now() < state.powerUntil;
        try { sirenGain.gain.setValueAtTime(sirenGainFor(scared), audioCtx?.currentTime || 0); } catch (_) {}
      }
    }
  }

  // ─── Main loop ────────────────────────────────────────────────────────────────
  let lastBoard = null;

  function step(now) {
    const board = boardRect();
    lastBoard = board;

    const canStep =
      state.running &&
      !state.paused &&
      !state.explicitPause &&
      now >= state.countdownUntil &&
      now >= state.freezeUntil;

    if (canStep && now - state.lastStep >= state.speedMs) {
      state.lastStep = now;
      stepPlayer(now, board);
      updateModeCycle(now);
      // Ghost speed boost on wrong answer
      const ghostSpeed = (state.ghostSpeedBoost > now)
        ? state.speedMs * 0.7
        : state.speedMs;
      // temporarily set for stepGhosts comparisons
      const oldSpeed = state.speedMs;
      state.speedMs  = ghostSpeed;
      stepGhosts(now);
      state.speedMs  = oldSpeed;
      handleCollisions(now, board);
      updateHud();
      // Siren pitch follows pellet count
      if (!state.paused) updateSirenPitch(state.pelletsLeft, pelletsAtStart, now < state.powerUntil);
    }

    // Scare-time ended → switch siren back
    if (state._wasPowered && performance.now() >= state.powerUntil) {
      state._wasPowered = false;
      stopSiren();
      if (state.running && !state.paused && !muted) startSiren(false);
      // Un-eaten ghosts lose scared state
      for (const c of state.chasers) { if (!c.eaten) c.justReversed = false; }
    }
    if (performance.now() < state.powerUntil) state._wasPowered = true;

    draw(now, board);
    requestAnimationFrame(step);
  }

  // ─── Resize ──────────────────────────────────────────────────────────────────
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    els.canvas.width  = Math.floor(innerWidth  * dpr);
    els.canvas.height = Math.floor(innerHeight * dpr);
  }

  function cellToScreen(x, y, board) {
    return {
      x: board.x + x * board.cell + board.cell / 2,
      y: board.y + y * board.cell + board.cell / 2
    };
  }

  function boardRect() {
    const dpr  = Math.min(devicePixelRatio || 1, 2);
    const maxW = els.canvas.width  * 0.9;
    const maxH = els.canvas.height * 0.66;
    const cell = Math.floor(Math.min(maxW / COLS, maxH / ROWS));
    return {
      cell,
      x: Math.floor((els.canvas.width  - cell * COLS) / 2),
      y: Math.floor((els.canvas.height - cell * ROWS) / 2 + els.canvas.height * 0.04)
    };
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────────
  function draw(now, board) {
    const w = els.canvas.width;
    const h = els.canvas.height;

    // Screen shake offset
    let sx = 0, sy = 0;
    if (!prefersReducedMotion && now < state.shakeUntil) {
      const t = 1 - (state.shakeUntil - now) / 400;
      const mag = state.shakeMag * (1 - t);
      sx = (Math.random() - 0.5) * mag * 2;
      sy = (Math.random() - 0.5) * mag * 2;
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Background
    ctx.fillStyle = "#050711";
    ctx.fillRect(-Math.abs(sx)-2, -Math.abs(sy)-2, w + Math.abs(sx)*2+4, h + Math.abs(sy)*2+4);
    const bg = images["background"];
    if (bg) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(bg, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // Scanlines (subtle) — skipped in lite-mode
    if (!prefersReducedMotion && !liteMode) {
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let ly = 0; ly < h; ly += 4) ctx.fillRect(0, ly, w, 2);
    }

    // Stars — skipped in lite-mode
    if (!prefersReducedMotion && !liteMode) {
      for (const star of state.stars) {
        const alpha = 0.3 + 0.4 * Math.sin(now * star.speed + star.phase);
        ctx.fillStyle = `rgba(200,230,255,${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Overlay dim
    ctx.fillStyle = "rgba(3,6,15,0.62)";
    ctx.fillRect(0, 0, w, h);

    // Maze shadow backdrop
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur  = board.cell * 0.6;

    // Walls + floor
    drawMaze(now, board);

    // Ghosts
    drawGhosts(now, board);

    // Player
    drawPlayer(now, board);

    // Fruit
    drawFruit(now, board);

    ctx.restore(); // shadow

    // Death animation
    if (state.deathAnim) drawDeathAnim(now);

    // Popups
    drawPopups(now);

    // Overlay text (READY / messages)
    drawOverlayText(now, w, h, board);

    // Level-up golden pulse flash
    if (!prefersReducedMotion && now < state.levelFlashUntil) {
      const lft = 1 - (state.levelFlashUntil - now) / 700;
      const lfa = Math.max(0, 0.38 * Math.sin(lft * Math.PI));
      ctx.save();
      ctx.fillStyle = `rgba(245,196,81,${lfa.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // Pause screen
    if (state.explicitPause && state.running) drawPauseScreen(w, h);

    ctx.restore(); // shake
  }

  function drawMaze(now, board) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px   = board.x + x * board.cell;
        const py   = board.y + y * board.cell;
        const cs   = board.cell;
        const orig = LEVEL[y][x];
        const cell = state.grid[y]?.[x] || orig;

        if (orig === "#") {
          drawWallCell(x, y, px, py, cs);
        } else {
          // Floor
          ctx.fillStyle = "rgba(7,13,28,0.82)";
          ctx.fillRect(px, py, cs, cs);
          // Subtle grid stroke
          ctx.strokeStyle = "rgba(111,238,255,0.05)";
          ctx.lineWidth   = 0.5;
          ctx.strokeRect(px + 0.5, py + 0.5, cs - 1, cs - 1);

          if (cell === ".") drawPellet(now, x, y, px, py, cs);
          if (cell === "o") drawPowerPellet(now, x, y, px, py, cs);
        }
      }
    }
  }

  function drawWallCell(gx, gy, px, py, cs) {
    const wallImg = images["wall"];

    // Base fill
    if (wallImg) {
      ctx.drawImage(wallImg, px - 1, py - 1, cs + 2, cs + 2);
    } else {
      // Gradient fill for depth
      const wg = ctx.createLinearGradient(px, py, px + cs, py + cs);
      wg.addColorStop(0, "#18284e");
      wg.addColorStop(1, "#0e1a35");
      ctx.fillStyle = wg;
      ctx.fillRect(px, py, cs, cs);
    }

    // Check which neighbors are floor (adjacent to passable space)
    const N = !isWall(gx, gy-1);
    const S = !isWall(gx, gy+1);
    const E = !isWall(gx+1, gy);
    const W = !isWall(gx-1, gy);
    const hasExposedFace = N || S || E || W;

    if (hasExposedFace) {
      ctx.save();
      // Cyan inner-glow along exposed edges
      const rr = Math.max(1, cs * 0.14);
      const glowGrad = ctx.createLinearGradient(px, py, px, py + cs);
      glowGrad.addColorStop(0,   "rgba(122,240,255,0.12)");
      glowGrad.addColorStop(0.5, "rgba(122,240,255,0.06)");
      glowGrad.addColorStop(1,   "rgba(122,240,255,0.00)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(px + 1, py + 1, cs - 2, cs - 2, rr);
      } else {
        ctx.rect(px + 1, py + 1, cs - 2, cs - 2);
      }
      ctx.fill();

      // 1px highlight on the top face edge (fake lighting)
      if (N || (!S && !E && !W)) {
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + 1);
        ctx.lineTo(px + cs - 1, py + 1);
        ctx.stroke();
      }

      // Subtle cyan rim on exposed edges
      const rimAlpha = 0.22;
      ctx.strokeStyle = `rgba(122,240,255,${rimAlpha})`;
      ctx.lineWidth   = 1;
      if (N) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cs, py); ctx.stroke(); }
      if (S) { ctx.beginPath(); ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py + cs); ctx.stroke(); }
      if (E) { ctx.beginPath(); ctx.moveTo(px + cs, py); ctx.lineTo(px + cs, py + cs); ctx.stroke(); }
      if (W) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cs); ctx.stroke(); }

      ctx.restore();
    }
  }

  function drawPellet(now, gx, gy, px, py, cs) {
    // Pulse synced with siren frequency (every ~140ms cycle)
    const pulse = 0.82 + Math.sin(now / 140 + gx * 1.9 + gy * 0.7) * 0.14;
    const cx    = px + cs / 2;
    const cy    = py + cs / 2;
    const r     = cs * 0.145 * pulse;

    ctx.save();
    // Soft outer glow
    ctx.shadowColor = "rgba(122,240,255,0.7)";
    ctx.shadowBlur  = cs * 0.32;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4);
    g.addColorStop(0,   "#ffffff");
    g.addColorStop(0.45,"#b8eeff");
    g.addColorStop(1,   "rgba(122,240,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    ctx.fill();
    // Bright core
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPowerPellet(now, gx, gy, px, py, cs) {
    // Float + breathe animation
    const breathe  = 0.88 + Math.sin(now / 160 + gx * 0.8) * 0.14;
    const floatOff = Math.sin(now / 180 + gx * 0.6) * cs * 0.07;
    const cx       = px + cs / 2;
    const cy       = py + cs / 2 + floatOff;
    const r        = cs * 0.36 * breathe;

    ctx.save();

    // Outer halo — slow rotating gold ring
    ctx.globalAlpha  = 0.28 + 0.14 * Math.sin(now / 220 + gx);
    ctx.strokeStyle  = "#f5c451";
    ctx.lineWidth    = cs * 0.07;
    ctx.shadowColor  = "rgba(245,196,81,0.6)";
    ctx.shadowBlur   = cs * 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Core glow
    ctx.shadowColor = "rgba(245,196,81,0.95)";
    ctx.shadowBlur  = cs * 0.7;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0,   "#fffde0");
    g.addColorStop(0.35,"#f5c451");
    g.addColorStop(0.75,"#e8940a");
    g.addColorStop(1,   "rgba(232,132,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 4 rotating sparkle rays (inner + outer tips)
    const rayRot = now / 420;
    ctx.shadowBlur  = cs * 0.25;
    ctx.shadowColor = "rgba(255,248,160,0.85)";
    for (let i = 0; i < 4; i++) {
      const angle = rayRot + i * Math.PI / 2;
      const d1 = r * 0.9;
      const d2 = r * 1.55;
      const lw = Math.max(1, cs * 0.055) * (0.7 + 0.3 * breathe);
      ctx.strokeStyle = `rgba(255,248,160,${0.55 + 0.25 * breathe})`;
      ctx.lineWidth   = lw;
      ctx.lineCap     = "round";
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * d1, cy + Math.sin(angle) * d1);
      ctx.lineTo(cx + Math.cos(angle) * d2, cy + Math.sin(angle) * d2);
      ctx.stroke();
    }
    // Diagonal secondary rays (dimmer, offset 45°)
    for (let i = 0; i < 4; i++) {
      const angle = rayRot + i * Math.PI / 2 + Math.PI / 4;
      const d1 = r * 0.95;
      const d2 = r * 1.3;
      ctx.strokeStyle = `rgba(255,230,100,${0.3 + 0.15 * breathe})`;
      ctx.lineWidth   = Math.max(0.8, cs * 0.035);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * d1, cy + Math.sin(angle) * d1);
      ctx.lineTo(cx + Math.cos(angle) * d2, cy + Math.sin(angle) * d2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGhosts(now, board) {
    const powered     = now < state.powerUntil;
    const flashing    = now > state.powerFlashAt && powered;

    for (const chaser of state.chasers) {
      const at  = actorDisplay(chaser, now);
      const pos = cellToScreen(at.x, at.y, board);
      const cs  = board.cell;
      const released = now >= chaser.releaseAt;

      ctx.save();

      if (chaser.eaten) {
        // Eyes only
        drawGhostEyes(pos.x, pos.y, cs, chaser.dir);
      } else if (powered) {
        // Scared / flashing
        const flashOn = !flashing || (Math.floor(now / 180) % 2 === 0);
        // Ghost body
        ctx.globalAlpha = 0.9;
        drawGhostShape(pos.x, pos.y, cs, flashOn ? "#2244cc" : "#ffffff", now);
        // Eyes wide
        drawGhostEyes(pos.x, pos.y, cs, chaser.dir, true);
      } else {
        // Normal ghost
        const img = images[chaser.img];
        if (img) {
          ctx.drawImage(img,
            pos.x - cs * 0.67, pos.y - cs * 0.67,
            cs * 1.34, cs * 1.34
          );
        } else {
          const colors = { red:"#ff3344", purple:"#cc44ff", blue:"#44aaff", green:"#44ff88" };
          drawGhostShape(pos.x, pos.y, cs, colors[chaser.img] || "#aaaaaa", now);
        }
        // Eyes showing direction
        drawGhostEyes(pos.x, pos.y, cs, chaser.dir, false);
      }

      // Release ring
      if (!released) {
        ctx.strokeStyle = "rgba(111,238,255,0.72)";
        ctx.lineWidth   = Math.max(2, cs * 0.07);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, cs * 0.56, -Math.PI / 2, Math.PI * 1.5);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  function drawGhostShape(cx, cy, cs, color, now) {
    const r      = cs * 0.48;
    const top    = cy - r * 0.15;
    const bottom = top + r;

    // Build the ghost path (dome + wavy skirt)
    ctx.beginPath();
    ctx.arc(cx, top, r, Math.PI, 0, false);
    const waves  = 3;
    const wWidth = (r * 2) / waves;
    let   wx     = cx + r;
    ctx.lineTo(wx, bottom);
    for (let i = 0; i < waves; i++) {
      const midX  = wx - wWidth / 2;
      const endX  = wx - wWidth;
      const waveY = bottom - cs * 0.12 * (i % 2 === 0 ? 1 : -0.4);
      ctx.quadraticCurveTo(midX, waveY, endX, bottom);
      wx = endX;
    }
    ctx.closePath();

    // Base fill with translucent edges via radial gradient
    const bodyGrad = ctx.createRadialGradient(cx, top - r * 0.25, 0, cx, top, r * 1.3);
    bodyGrad.addColorStop(0,    blendAlpha(color, 1.0));   // opaque center
    bodyGrad.addColorStop(0.7,  blendAlpha(color, 0.92));  // slight edge fade
    bodyGrad.addColorStop(1,    blendAlpha(color, 0.65));  // translucent edge
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Interior sheen — top-left light catch
    const sheen = ctx.createLinearGradient(cx - r * 0.6, top - r * 0.5, cx + r * 0.3, top + r * 0.6);
    sheen.addColorStop(0, "rgba(255,255,255,0.22)");
    sheen.addColorStop(0.45,"rgba(255,255,255,0.06)");
    sheen.addColorStop(1,   "rgba(0,0,0,0.1)");
    ctx.fillStyle = sheen;
    ctx.fill();
  }

  // Helper: parse a hex/rgb color and apply alpha override (returns rgba string)
  function blendAlpha(color, alpha) {
    // Simple hex parser for 6-char hex
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1,3), 16);
      const g = parseInt(color.slice(3,5), 16);
      const b = parseInt(color.slice(5,7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
  }

  function drawGhostEyes(cx, cy, cs, dir, scared = false) {
    const eyeOffX = cs * 0.16;
    const eyeOffY = cs * 0.04;
    const eyeR    = cs * 0.12;

    for (let e = 0; e < 2; e++) {
      const ex = cx + (e === 0 ? -eyeOffX : eyeOffX);
      const ey = cy - eyeOffY;

      if (scared) {
        // Dots
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR * 0.6, 0, Math.PI * 2);
        ctx.fill();
        // X eyes during flash
      } else {
        // White sclera
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fill();

        // Pupil direction
        const pd = dirs[dir] || dirs.left;
        const px2 = ex + pd.x * eyeR * 0.45;
        const py2 = ey + pd.y * eyeR * 0.45;
        ctx.fillStyle = "#1155cc";
        ctx.beginPath();
        ctx.arc(px2, py2, eyeR * 0.52, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPlayer(now, board) {
    const at  = actorDisplay(state.player, now);
    const pos = cellToScreen(at.x, at.y, board);
    const cs  = board.cell;

    ctx.save();
    const rotation =
      state.player.dir === "right"  ?  0 :
      state.player.dir === "down"   ?  Math.PI / 2 :
      state.player.dir === "up"     ? -Math.PI / 2 :
                                       Math.PI;
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);

    const pulse  = 1 + Math.sin(now / 85) * 0.03;
    const imgObj = images["player"];
    if (imgObj) {
      ctx.drawImage(imgObj,
        -cs * 0.73 * pulse, -cs * 0.73 * pulse,
        cs * 1.46 * pulse, cs * 1.46 * pulse
      );
    } else {
      // Fallback: draw Pac-Man
      const mouthAngle = 0.25 + 0.2 * Math.abs(Math.sin(now / 120));
      ctx.fillStyle = "#ffd45c";
      ctx.shadowColor = "rgba(255,212,92,0.7)";
      ctx.shadowBlur  = cs * 0.35;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, cs * 0.44 * pulse, mouthAngle, Math.PI * 2 - mouthAngle);
      ctx.closePath();
      ctx.fill();
    }

    // Eye
    ctx.fillStyle = "#07101f";
    ctx.beginPath();
    ctx.arc(cs * 0.1, -cs * 0.22, cs * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawFruit(now, board) {
    if (!state.fruitCell || now >= state.fruitUntil) return;
    const { x, y }  = state.fruitCell;
    const pos = cellToScreen(x, y, board);
    const cs  = board.cell;
    const pulse = 0.9 + Math.sin(now / 120) * 0.12;
    const alpha = Math.min(1, (state.fruitUntil - now) / 1500);

    ctx.save();
    ctx.globalAlpha = alpha * pulse;
    ctx.shadowColor = "rgba(255,114,210,0.85)";
    ctx.shadowBlur  = cs * 0.45;
    // Draw a star shape
    const r1 = cs * 0.35;
    const r2 = cs * 0.16;
    const pts = 5;
    ctx.fillStyle = "#ff72d2";
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const a = (i * Math.PI) / pts - Math.PI / 2 + now / 800;
      const r = i % 2 === 0 ? r1 : r2;
      if (i === 0) ctx.moveTo(pos.x + r * Math.cos(a), pos.y + r * Math.sin(a));
      else ctx.lineTo(pos.x + r * Math.cos(a), pos.y + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
    // Score label
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.max(8, cs * 0.28)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(number(state.fruitScore), pos.x, pos.y + cs * 0.6);
    ctx.restore();
  }

  function drawDeathAnim(now) {
    if (!state.deathAnim) return;
    const da   = state.deathAnim;
    const t    = (now - da.born) / da.life;
    if (t >= 1) { state.deathAnim = null; return; }
    const { x, y } = da;
    const w = els.canvas.width;
    const h = els.canvas.height;

    ctx.save();

    // Phase 1 (0-0.18): brief white screen flash
    if (t < 0.18) {
      const flashAlpha = (0.18 - t) / 0.18 * 0.45;
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Slow-mo zoom: canvas scales up slightly during first 40% of anim
    if (!prefersReducedMotion && t < 0.4) {
      const zoomT = t / 0.4;
      const scale = 1 + (1 - zoomT) * 0.025;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.translate(-x, -y);
    }

    // Radial collapse: Pac-Man arc shrinks inward
    const startAngle = -Math.PI / 2;
    const endAngle   = startAngle + (1 - t) * Math.PI * 2;
    const baseR      = 22;
    const r          = baseR * (1 + t * 0.4);
    ctx.globalAlpha  = 1 - t * 0.92;
    ctx.strokeStyle  = "#f5c451";
    ctx.lineWidth    = Math.max(2, 5 * (1 - t));
    ctx.shadowColor  = "rgba(245,196,81,0.9)";
    ctx.shadowBlur   = 16 * (1 - t * 0.6);
    ctx.beginPath();
    ctx.arc(x, y, r, startAngle, endAngle);
    ctx.stroke();

    // 8-particle burst — spread outward
    const colors = ["#f5c451","#ff72d2","#7af0ff","#f5c451","#7ef0a8","#ff72d2","#f5c451","#7af0ff"];
    for (let i = 0; i < 8; i++) {
      const a    = (i / 8) * Math.PI * 2;
      const dist = t * 55 + t * t * 20;
      const px2  = x + Math.cos(a) * dist;
      const py2  = y + Math.sin(a) * dist;
      const pr   = Math.max(0, (1 - t) * 4.5);
      ctx.globalAlpha = (1 - t) * 0.88;
      ctx.fillStyle   = colors[i];
      ctx.shadowColor = colors[i];
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(px2, py2, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawPopups(now) {
    state.popups = state.popups.filter(p => now - p.born < p.life);
    for (const p of state.popups) {
      const t     = (now - p.born) / p.life;
      // Ease-out rise: fast at start, slow at end
      const tEase = 1 - (1 - t) * (1 - t);
      const alpha = t < 0.15 ? t / 0.15 : 1 - ((t - 0.15) / 0.85);
      const yOff  = tEase * 36;
      const scale = 1 + (1 - t) * 0.15; // small pop-in scale
      ctx.save();
      ctx.globalAlpha  = Math.max(0, alpha);
      ctx.translate(p.x, p.y - yOff);
      ctx.scale(scale, scale);
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font         = `700 14px "JetBrains Mono", monospace`;
      ctx.shadowColor  = "rgba(0,0,0,0.75)";
      ctx.shadowBlur   = 5;
      ctx.fillStyle    = p.color;
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
  }

  function drawOverlayText(now, w, h, board) {
    const countdown   = Math.ceil((state.countdownUntil - now) / 1000);
    const showCountdown = state.running && !state.paused && countdown > 0;
    const showMessage   = state.message && now < state.messageUntil;
    if (!showCountdown && !showMessage) return;

    ctx.save();
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    if (showCountdown) {
      const text = countdown > 1 ? String(countdown - 1) : "GO";
      const fontSize = Math.min(112, Math.max(56, board.cell * 3.6));
      const ty = h * 0.48;
      // Backdrop glow pill
      const tw = fontSize * text.length * 0.62 + 40;
      const th = fontSize * 1.1 + 20;
      ctx.save();
      const pill = ctx.createRoundRect
        ? null  // use roundRect if available
        : null;
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#06080F";
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(w / 2 - tw / 2, ty - th / 2, tw, th, 18);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      // Glow halo
      ctx.shadowColor = text === "GO" ? "rgba(122,240,255,0.9)" : "rgba(245,196,81,0.85)";
      ctx.shadowBlur  = fontSize * 0.25;
      ctx.font        = `800 ${fontSize}px "Fraunces", Georgia, serif`;
      ctx.fillStyle   = text === "GO" ? "#7af0ff" : "#f5c451";
      ctx.lineWidth   = Math.max(5, fontSize * 0.06);
      ctx.strokeStyle = "rgba(3,6,15,0.92)";
      ctx.strokeText(text, w / 2, ty);
      ctx.fillText(text, w / 2, ty);
    } else {
      // In-game message banner
      const text    = state.message;
      const fontSize = Math.min(32, Math.max(16, board.cell * 0.78));
      const ty      = Math.max(board.y - board.cell * 1.5, h * 0.14);
      const isLevel = /^LEVEL/.test(text);
      const color   = isLevel ? "#f5c451" : "#7af0ff";
      const glow    = isLevel ? "rgba(245,196,81,0.85)" : "rgba(122,240,255,0.8)";

      ctx.font        = isLevel
        ? `700 italic ${fontSize * 1.2}px "Fraunces", Georgia, serif`
        : `700 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.shadowColor = glow;
      ctx.shadowBlur  = fontSize * 0.7;
      ctx.fillStyle   = color;
      ctx.lineWidth   = Math.max(3, fontSize * 0.14);
      ctx.strokeStyle = "rgba(3,6,15,0.9)";
      ctx.strokeText(text, w / 2, ty);
      ctx.fillText(text, w / 2, ty);
    }

    ctx.restore();
  }

  function drawPauseScreen(w, h) {
    ctx.save();
    // Dimmed overlay
    ctx.fillStyle = "rgba(5,7,17,0.72)";
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    // Large Fraunces italic "PAUSED"
    const fs = Math.min(80, w * 0.12);
    ctx.font        = `700 italic ${fs}px "Fraunces", Georgia, serif`;
    ctx.shadowColor = "rgba(245,196,81,0.8)";
    ctx.shadowBlur  = fs * 0.25;
    ctx.fillStyle   = "#f5c451";
    ctx.strokeStyle = "rgba(3,6,15,0.92)";
    ctx.lineWidth   = Math.max(6, fs * 0.075);
    ctx.strokeText("Paused", w / 2, h / 2 - 8);
    ctx.fillText("Paused", w / 2, h / 2 - 8);

    // Sub-label in mono
    ctx.shadowBlur  = 0;
    ctx.font        = `500 ${Math.min(15, w * 0.026)}px "JetBrains Mono", monospace`;
    ctx.fillStyle   = "rgba(122,240,255,0.75)";
    ctx.fillText("PRESS P TO RESUME", w / 2, h / 2 + fs * 0.72);
    ctx.restore();
  }

  // ─── Message helper ───────────────────────────────────────────────────────────
  function setMessage(text, ms = 1200) {
    state.message      = text;
    state.messageUntil = performance.now() + ms;
  }

  // ─── Direction input ──────────────────────────────────────────────────────────
  function setDirection(dir) {
    if (dirs[dir]) state.player.next = dir;
    // Resume AudioContext on input
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  // ─── Image loading ────────────────────────────────────────────────────────────
  async function loadImages() {
    await Promise.allSettled(
      Object.entries(assetSrcs).map(([key, src]) =>
        new Promise((resolve) => {
          const img   = new Image();
          img.onload  = () => { images[key] = img; resolve(); };
          img.onerror = resolve; // don't block on missing assets
          img.src     = src;
        })
      )
    );
  }

  // ─── Question bank ────────────────────────────────────────────────────────────
  async function loadBank() {
    const response = await fetch("../../data/chrono-defense-bank.json?v=20260504-maze");
    const data     = await response.json();
    state.bank     = (data.questions || []).filter(playableQuestion);

    const byCourse = {};
    for (const q of state.bank) {
      if (!q.course) continue;
      if (!byCourse[q.course]) byCourse[q.course] = new Set();
      byCourse[q.course].add(q.set || q.day || q.subject || "Review");
    }
    state.setsByCourse = Object.fromEntries(
      Object.entries(byCourse).map(([c, sets]) => [c, [...sets].sort((a,b) => a.localeCompare(b, undefined, { numeric: true }))])
    );
    const courses = ["All Courses", ...Object.keys(byCourse).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }))];
    els.courseFilter.innerHTML = courses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
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
    const sets   = course === "All Courses"
      ? ["All Sets"]
      : ["All Sets", ...(state.setsByCourse?.[course] || [])];
    els.setFilter.innerHTML = sets.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  }
  function applyFilters() {
    const course = els.courseFilter.value || "All Courses";
    const set    = els.setFilter.value   || "All Sets";
    state.filtered = state.bank.filter(q => {
      if (course !== "All Courses" && q.course !== course) return false;
      if (set    !== "All Sets"    && (q.set || q.day || q.subject || "Review") !== set) return false;
      return true;
    });
    if (!state.filtered.length) state.filtered = state.bank.slice();
    state.queue = shuffle(state.filtered);
    const stimulus = state.filtered.filter(q =>
      (SourceBank.stimulusImages ? SourceBank.stimulusImages(q) : q.stimulusImages || []).length
    ).length;
    els.metrics.innerHTML = [
      `${number(state.filtered.length)} prompts loaded`,
      `${number(stimulus)} source-image prompts`,
      `${number(new Set(state.filtered.map(q => q.course)).size)} courses in filter`
    ].map(t => `<span>${escapeHtml(t)}</span>`).join("");
  }
  function nextQuestion() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    return state.queue.pop() || state.filtered[Math.floor(Math.random() * state.filtered.length)];
  }
  function promptFor(q)   { return SourceBank.displayPrompt  ? SourceBank.displayPrompt(q)  : clean(q.prompt || q.stem); }
  function answerFor(q)   { return SourceBank.answerText     ? SourceBank.answerText(q)     : clean(q.answer); }
  function sourceFor(q)   { return SourceBank.displaySource  ? SourceBank.displaySource(q)  : clean(q.source || q.category || q.set || ""); }
  function stimulusFor(q) { return SourceBank.stimulusImages ? SourceBank.stimulusImages(q) : (q.stimulusImages || []).filter(i => i && i.src); }
  function choicesFor(q) {
    if (q.type === "mcq" && Array.isArray(q.choices)) {
      const correct = answerFor(q);
      const choices = q.choices.map(c => ({
        text:    clean(c.text),
        correct: normalize(c.text) === normalize(correct) || String(c.label) === String(q.correct)
      }));
      return shuffle(choices).slice(0, 4);
    }
    const correct = answerFor(q);
    const same    = state.filtered.concat(state.bank)
      .filter(item => item !== q && item.answer)
      .map(item    => clean(item.answer))
      .filter(text => text && normalize(text) !== normalize(correct));
    const distractors = [...new Map(shuffle(same).map(t => [normalize(t), t])).values()].slice(0, 3);
    return shuffle([{ text: correct, correct: true }, ...distractors.map(t => ({ text: t, correct: false }))]).slice(0, 4);
  }

  // ─── HUD injection ────────────────────────────────────────────────────────────
  function injectHudExtras() {
    const hudStats = document.querySelector(".hud-stats");
    if (!hudStats) return;

    // Level
    if (!$("levelIndicator")) {
      const div = document.createElement("div");
      div.innerHTML = `<strong id="levelIndicator">LVL 1</strong><span>level</span>`;
      hudStats.appendChild(div);
    }
    // Best score
    if (!$("bestScore")) {
      const div = document.createElement("div");
      div.innerHTML = `<strong id="bestScore">0</strong><span>best</span>`;
      hudStats.appendChild(div);
    }
    // Pause button
    if (!$("pauseBtn")) {
      const btn = document.createElement("button");
      btn.id        = "pauseBtn";
      btn.className = "btn ghost pause-btn";
      btn.type      = "button";
      btn.textContent = "⏸ P";
      btn.setAttribute("aria-label", "Pause (P)");
      btn.addEventListener("click", togglePause);
      document.querySelector(".hud")?.appendChild(btn);
    }
    // Sound toggle
    if (!$("soundBtn")) {
      const btn = document.createElement("button");
      btn.id        = "soundBtn";
      btn.className = "btn ghost pause-btn";
      btn.type      = "button";
      btn.textContent = "🔊";
      btn.setAttribute("aria-label", "Toggle sound");
      btn.addEventListener("click", () => {
        setMuted(!muted);
        btn.textContent = muted ? "🔇" : "🔊";
      });
      document.querySelector(".hud")?.appendChild(btn);
    }
    // D-pad (mobile)
    injectDPad();
  }

  function injectDPad() {
    if ($("dpad")) return;
    const dpad = document.createElement("div");
    dpad.id        = "dpad";
    dpad.className = "dpad";
    dpad.innerHTML = `
      <button class="dpad-btn dpad-up"    data-dir="up"    aria-label="Up">▲</button>
      <button class="dpad-btn dpad-left"  data-dir="left"  aria-label="Left">◀</button>
      <button class="dpad-btn dpad-center" aria-hidden="true"></button>
      <button class="dpad-btn dpad-right" data-dir="right" aria-label="Right">▶</button>
      <button class="dpad-btn dpad-down"  data-dir="down"  aria-label="Down">▼</button>
    `;
    document.querySelector(".maze-shell")?.appendChild(dpad);
    dpad.querySelectorAll("[data-dir]").forEach(btn => {
      btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        setDirection(btn.dataset.dir);
      });
    });
  }

  // ─── Event wiring ─────────────────────────────────────────────────────────────
  els.courseFilter.addEventListener("change", () => { populateSets(); applyFilters(); });
  els.setFilter.addEventListener("change", applyFilters);
  els.startBtn.addEventListener("click", startRun);
  els.againBtn.addEventListener("click", startRun);
  els.setupBtn.addEventListener("click", () => {
    state.running = false;
    state.paused  = true;
    stopSiren();
    show(els.setup);
  });

  // Old nav controls (linear 4-button row)
  document.querySelectorAll("[data-dir]").forEach(btn => {
    btn.addEventListener("click", () => setDirection(btn.dataset.dir));
  });

  // Keyboard
  addEventListener("keydown", e => {
    const map = {
      ArrowLeft:"left", ArrowRight:"right", ArrowUp:"up", ArrowDown:"down",
      a:"left", d:"right", w:"up", s:"down",
      A:"left", D:"right", W:"up", S:"down"
    };
    if (map[e.key]) { e.preventDefault(); setDirection(map[e.key]); }
    if (e.key === "p" || e.key === "P") togglePause();
    if (e.key === "m" || e.key === "M") {
      const btn = $("soundBtn");
      setMuted(!muted);
      if (btn) btn.textContent = muted ? "🔇" : "🔊";
    }
    // ESC closes quiz/result modals (accessibility axis)
    if (e.key === "Escape") {
      if (els.quiz.classList.contains("show")) {
        // Close quiz: resume with no penalty (same as answer timeout)
        show(null);
        state.paused = false;
        // Restore cabinet music (ESC-dismissed quiz)
        try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore && window.MrMacsArcadeMusic.restore(); } catch (_) {}
        if (state.running && !muted) {
          const scared = performance.now() < state.powerUntil;
          if (!sirenOsc) startSiren(scared);
          else if (sirenGain) {
            try { sirenGain.gain.setValueAtTime(sirenGainFor(scared), audioCtx?.currentTime || 0); } catch (_) {}
          }
        }
      } else if (els.result.classList.contains("show")) {
        // ESC from result → back to setup
        state.running = false;
        state.paused  = true;
        stopSiren();
        try { window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop(); } catch (_) {}
        show(els.setup);
      }
    }
  });

  // Swipe on canvas
  els.canvas.addEventListener("pointerdown", e => {
    state.pointer = { x: e.clientX, y: e.clientY };
  });
  els.canvas.addEventListener("pointerup", e => {
    if (!state.pointer) return;
    const dx = e.clientX - state.pointer.x;
    const dy = e.clientY - state.pointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 22) {
      setDirection(Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down"  : "up")
      );
    }
    state.pointer = null;
  });
  els.canvas.addEventListener("pointermove", e => {
    if (!state.pointer) return;
    const dx = e.clientX - state.pointer.x;
    const dy = e.clientY - state.pointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 38) {
      setDirection(Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down"  : "up")
      );
      state.pointer = null;
    }
  });

  addEventListener("resize", resize);

  // ─── QA hook ─────────────────────────────────────────────────────────────────
  function installQaHook() {
    if (!new URLSearchParams(location.search).has("qa")) return;
    window.__reviewMazeQA = {
      startRun, openQuestion, state, togglePause,
      metrics: () => ({
        score:       state.score,
        lives:       state.lives,
        pelletsLeft: state.pelletsLeft,
        filtered:    state.filtered.length,
        running:     state.running,
        paused:      state.paused,
        combo:       state.combo,
        level:       state.level,
        countdown:   Math.max(0, state.countdownUntil - performance.now())
      })
    };
  }

  // ─── Boot ────────────────────────────────────────────────────────────────────
  Promise.allSettled([loadImages(), loadBank()]).then(() => {
    resize();
    resetGrid();
    resetActors();
    initStars();
    injectHudExtras();
    updateHud();
    installQaHook();

    // MrMacsProfile: record play session
    if (window.MrMacsProfile) {
      window.MrMacsProfile.recordPlay({
        id:    "review-maze-chase",
        title: "Review Maze Chase",
        course: "All Courses",
        file:  "games/review-maze-chase/index.html"
      });
      // Honor sound setting at boot
      try {
        const settings = window.MrMacsProfile.getSettings();
        if (settings && settings.sound === "off") setMuted(true);
      } catch (e) {}
      // Re-apply whenever settings change
      window.MrMacsProfile.on("settings:change", (settings) => {
        try {
          if (settings && settings.sound === "off") setMuted(true);
          else setMuted(false);
        } catch (e) {}
      });
    }

    // Phase 3 — First-run tour (fires only once; MrMacsArcadeTour tracks hasSeenTour internally)
    if (window.MrMacsArcadeTour) {
      setTimeout(function() {
        window.MrMacsArcadeTour.start("review-maze-chase", [
          {
            target: "#game",
            title: "Eat pellets, dodge chasers",
            body: "Use arrow keys, WASD, or the on-screen D-pad. Each pellet feeds your shards wallet.",
            placement: "auto"
          },
          {
            target: "#score",
            title: "Questions show up between rounds",
            body: "Answer correctly to spawn a fruit bonus and earn 50 shards.",
            placement: "auto"
          },
          {
            target: "#soundBtn",
            title: "Settings travel with you",
            body: "Sound, motion, and font preferences come from your trainer profile in the hub.",
            placement: "auto"
          }
        ]);
      }, 800);
    }

    requestAnimationFrame(step);
  });

})();
