(() => {
  "use strict";

  const STORAGE_KEY = "mr-macs-archive-cipher-v1";
  const MAX_ATTEMPTS = 6;
  const $ = (id) => document.getElementById(id);
  const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;

  const els = {
    fx: $("fx"),
    streak: $("streak"),
    solved: $("solved"),
    accuracy: $("accuracy"),
    best: $("best"),
    backBtn: $("backBtn"),
    termTitle: $("termTitle"),
    clueText: $("clueText"),
    sourcePanel: $("sourcePanel"),
    metaRow: $("metaRow"),
    hintBox: $("hintBox"),
    board: $("board"),
    message: $("message"),
    ringCore: $("ringCore"),
    courseFilter: $("courseFilter"),
    setFilter: $("setFilter"),
    lengthFilter: $("lengthFilter"),
    libraryCount: $("libraryCount"),
    hintBtn: $("hintBtn"),
    skipBtn: $("skipBtn"),
    newBtn: $("newBtn"),
    keyboard: $("keyboard"),
    resultModal: $("resultModal"),
    resultKicker: $("resultKicker"),
    resultTitle: $("resultTitle"),
    resultAnswer: $("resultAnswer"),
    resultExplain: $("resultExplain"),
    closeResultBtn: $("closeResultBtn"),
    nextBtn: $("nextBtn"),
    sourceViewer: $("sourceViewer"),
    sourceViewerTitle: $("sourceViewerTitle"),
    sourceViewerMeta: $("sourceViewerMeta"),
    sourceViewerImage: $("sourceViewerImage"),
    sourceViewerClose: $("sourceViewerClose")
  };

  const ctx = els.fx.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const liteFx = new URLSearchParams(location.search).get("fx") !== "full";
  document.documentElement.classList.toggle("perf-lite", liteFx);
  const keys = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const keyRank = { absent: 1, present: 2, correct: 3 };

  const state = {
    bank: null,
    terms: [],
    filtered: [],
    queue: [],
    target: null,
    guesses: [],
    current: "",
    locked: false,
    hintLevel: 0,
    keyStates: {},
    particles: [],
    fxFrame: 0,
    last: 0,
    stats: readStats()
  };

  class AudioBus {
    constructor() { this.ctx = null; }
    ensure() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    }
    tone(freq, duration = .07, type = "sine", gain = .025, delay = 0) {
      const audio = this.ensure();
      const start = audio.currentTime + delay;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      amp.gain.setValueAtTime(.0001, start);
      amp.gain.exponentialRampToValueAtTime(gain, start + .01);
      amp.gain.exponentialRampToValueAtTime(.0001, start + duration);
      osc.connect(amp).connect(audio.destination);
      osc.start(start);
      osc.stop(start + duration + .04);
    }
    key() { this.tone(420, .035, "triangle", .012); }
    erase() { this.tone(220, .045, "sine", .012); }
    bad() { this.tone(140, .14, "sawtooth", .025); }
    flip(index) { this.tone(360 + index * 42, .05, "triangle", .014, index * .045); }
    win() {
      [520, 740, 980, 1320].forEach((note, index) => this.tone(note, .10, "triangle", .03, index * .075));
    }
    loss() {
      [240, 190, 150].forEach((note, index) => this.tone(note, .14, "sawtooth", .022, index * .08));
    }
  }
  const audio = new AudioBus();

  function readStats() {
    try {
      return Object.assign({ played: 0, solved: 0, streak: 0, best: 0 }, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
    } catch {
      return { played: 0, solved: 0, streak: 0, best: 0 };
    }
  }

  function writeStats() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\bcon\s+icts\b/gi, "conflicts")
      .replace(/\bunited states\b/gi, "United States")
      .replace(/\bu\.s\.\b/gi, "U.S.")
      .trim();
  }

  function normalizeTerm(value) {
    return cleanText(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  function displayPrompt(q) {
    if (SourceBank && SourceBank.displayPrompt) return SourceBank.displayPrompt(q);
    q = q || {};
    const raw = cleanText(q.prompt || "");
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

  const sourcePromptRe = /(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(documents|statements|headlines|sources|passages|figures|maps|graphs|charts|cartoons)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|similar\s+to\s+this)/i;

  function promptNeedsStimulus(q) {
    if (SourceBank) return SourceBank.sourceBased(q);
    return sourcePromptRe.test(String((q && (q.prompt || q.stem)) || ""));
  }

  function stimulusImages(q) {
    if (SourceBank) return SourceBank.stimulusImages(q);
    q = q || {};
    const list = Array.isArray(q.stimulusImages) ? q.stimulusImages : [];
    if (list.length) {
      if (q.stimulusRequired === true) return list.filter((image) => image && image.src);
      if (q.stimulusRequired === false) return [];
      return promptNeedsStimulus(q) ? list.filter((image) => image && image.src) : [];
    }
    if (q.stimulusImage) return [{ src: q.stimulusImage, label: "Source stimulus" }];
    return [];
  }

  function sourceImageLabel(term, image, index) {
    const q = term && term.q ? term.q : {};
    if (SourceBank && SourceBank.displayStimulusLabel) return SourceBank.displayStimulusLabel(q, image);
    return cleanText((image && image.label) || q.source || `Source ${index + 1}`);
  }

  function stimulusText(q) {
    q = q || {};
    if (q.stimulusText) return cleanText(q.stimulusText);
    if (typeof q.stimulus === "string") return cleanText(q.stimulus);
    return "";
  }

  function hasStimulus(q) {
    q = q || {};
    return Boolean(stimulusText(q) || q.stimulusHtml || stimulusImages(q).length);
  }

  function trustedSource(q) {
    if (SourceBank) return SourceBank.trustedSource(q);
    return /trusted|official/i.test(String((q && q.sourceIntegrity) || ""));
  }

  function courseMatchesStimulus(q) {
    if (SourceBank) return SourceBank.courseMatchesStimulus(q);
    const srcs = stimulusImages(q).map((image) => String(image.src || ""));
    if (!srcs.length) return false;
    const course = String((q && q.course) || "");
    if (/U\.S\. History/i.test(course)) {
      return srcs.every((src) => /\/us-day/i.test(src) || /regents-released-forms\/us-/i.test(src));
    }
    if (/Global History/i.test(course)) {
      return srcs.every((src) => /\/global-day/i.test(src) || /regents-released-forms\/global-/i.test(src));
    }
    return true;
  }

  function verifiedSourceQuestion(q) {
    if (SourceBank) return SourceBank.verifiedSourceQuestion(q);
    return Boolean(q && !/^quarantined/i.test(String(q.sourceIntegrity || "")) && trustedSource(q) && stimulusImages(q).length && courseMatchesStimulus(q));
  }

  function sourceLock(term) {
    const q = term && term.q ? term.q : {};
    const images = stimulusImages(q);
    const sourceMeta = cleanText(q.source || term?.set || "Released Regents source");
    const identity = SourceBank && SourceBank.sourceIdentity ? SourceBank.sourceIdentity(q) : `${term?.course || ""}::${sourceMeta}`;
    const reason = SourceBank && SourceBank.missingSourceReason ? SourceBank.missingSourceReason(q) : "";
    return {
      ok: verifiedSourceQuestion(q),
      reason,
      images,
      sourceMeta,
      identity,
      text: stimulusText(q),
      html: q.stimulusHtml ? String(q.stimulusHtml) : ""
    };
  }

  function explanationFor(term) {
    const explanation = cleanText(term.q.explanation || "");
    if (explanation) return explanation;
    return `${term.answer}: ${displayPrompt(term.q)}`;
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function isGoodTerm(q) {
    if (/^quarantined/i.test(String(q.sourceIntegrity || ""))) return false;
    if (SourceBank && !SourceBank.playableSharedPrompt(q)) return false;
    const code = normalizeTerm(q.answer);
    if (code.length < 4 || code.length > 12) return false;
    if (!/^[A-Z]+$/.test(code)) return false;
    if (/^(TRUE|FALSE|NONE|OTHER|ABOVE|BELOW)$/i.test(q.answer)) return false;
    const answer = cleanText(q.answer);
    if (answer.length < 4 || answer.length > 40) return false;
    if (promptNeedsStimulus(q) && !verifiedSourceQuestion(q)) return false;
    if (stimulusImages(q).length && !verifiedSourceQuestion(q)) return false;
    return Boolean(displayPrompt(q));
  }

  function buildTermBank(questions) {
    const byCode = new Map();
    for (const q of questions) {
      if (!q || !q.answer || !isGoodTerm(q)) continue;
      const code = normalizeTerm(q.answer);
      const existing = byCode.get(`${q.course}|${q.set}|${code}`);
      if (existing && existing.value >= Number(q.value || 0)) continue;
      byCode.set(`${q.course}|${q.set}|${code}`, {
        code,
        answer: cleanText(q.answer),
        clue: displayPrompt(q),
        course: q.course || "Social Studies",
        set: q.set || q.subject || "Review",
        category: q.category || q.subject || "Review",
        value: Number(q.value || 0),
        hasStimulus: verifiedSourceQuestion(q),
        q
      });
    }
    return [...byCode.values()].sort((a, b) => a.course.localeCompare(b.course) || a.answer.localeCompare(b.answer));
  }

  async function loadBank() {
    els.newBtn.disabled = true;
    const response = await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
    if (!response.ok) throw new Error(`Review bank failed: ${response.status}`);
    state.bank = await response.json();
    state.terms = buildTermBank(state.bank.questions || []);
    populateFilters();
    applyFilters();
    els.newBtn.disabled = false;
    newRound();
  }

  function populateFilters() {
    const courses = ["All Courses", ...new Set(state.terms.map((term) => term.course))];
    els.courseFilter.innerHTML = courses.map((course) => `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`).join("");
    populateSets();
  }

  function populateSets() {
    const course = els.courseFilter.value || "All Courses";
    const sets = ["All Sets", ...new Set(state.terms.filter((term) => course === "All Courses" || term.course === course).map((term) => term.set))];
    els.setFilter.innerHTML = sets.map((set) => `<option value="${escapeHtml(set)}">${escapeHtml(set)}</option>`).join("");
  }

  function lengthOK(code) {
    const mode = els.lengthFilter.value;
    if (mode === "short") return code.length >= 4 && code.length <= 6;
    if (mode === "standard") return code.length >= 7 && code.length <= 9;
    if (mode === "challenge") return code.length >= 10 && code.length <= 12;
    return true;
  }

  function applyFilters() {
    const course = els.courseFilter.value || "All Courses";
    const set = els.setFilter.value || "All Sets";
    state.filtered = state.terms.filter((term) => {
      if (course !== "All Courses" && term.course !== course) return false;
      if (set !== "All Sets" && term.set !== set) return false;
      return lengthOK(term.code);
    });
    state.queue = shuffle(state.filtered);
    updateLibraryCount();
  }

  function updateLibraryCount() {
    const total = state.filtered.length;
    const all = state.terms.length;
    els.libraryCount.textContent = total ? `${total.toLocaleString()} review terms ready` : "No terms match this filter";
  }

  function nextTerm() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    let attempts = Math.max(1, state.queue.length);
    while (attempts > 0 && state.queue.length) {
      const term = state.queue.pop();
      if (!term?.hasStimulus || sourceLock(term).ok) return term;
      attempts -= 1;
    }
    return state.filtered.find((term) => !term?.hasStimulus || sourceLock(term).ok) || null;
  }

  function newRound() {
    if (!state.filtered.length) {
      setMessage("No playable terms match this filter. Try Any term or All Sets.", "bad");
      return;
    }
    state.target = nextTerm();
    if (!state.target) {
      setMessage("No source-verified terms match this filter yet. Try All Sets.", "bad");
      return;
    }
    state.guesses = [];
    state.current = "";
    state.locked = false;
    state.hintLevel = 0;
    state.keyStates = {};
    els.resultModal.classList.remove("show");
    els.ringCore.className = "ring-core";
    renderPuzzle();
    renderKeyboard();
    setMessage(`Decode a ${state.target.code.length}-letter review term. Spaces and punctuation are removed.`, "");
  }

  function renderPuzzle() {
    const term = state.target;
    if (!term) return;
    els.termTitle.textContent = `Term Lock ${term.code.length}`;
    els.clueText.textContent = term.clue;
    renderStimulus(term);
    els.metaRow.innerHTML = [
      term.course,
      term.set,
      term.category,
      `${term.code.length} letters`
    ].map((item) => `<span class="meta-pill">${escapeHtml(item)}</span>`).join("");
    renderHint();
    renderBoard();
    updateStatsUI();
  }

  function renderStimulus(term) {
    const q = term && term.q ? term.q : {};
    const lock = sourceLock(term);
    const needsSource = stimulusImages(q).length || stimulusText(q) || q.stimulusHtml || promptNeedsStimulus(q);
    if (!needsSource) {
      els.sourcePanel.hidden = true;
      els.sourcePanel.innerHTML = "";
      return;
    }
    if (!lock.ok) {
      els.sourcePanel.hidden = false;
      els.sourcePanel.innerHTML = `<div class="source-kicker">Source</div><div class="source-warning"><strong>This source question is not ready yet.</strong><span>Try another clue.</span></div>`;
      return;
    }
    if (!lock.images.length && !lock.text && !lock.html) {
      els.sourcePanel.hidden = true;
      els.sourcePanel.innerHTML = "";
      return;
    }
    const textBlock = lock.html
      ? `<div class="source-text">${lock.html}</div>`
      : lock.text
        ? `<div class="source-text">${escapeHtml(lock.text)}</div>`
        : "";
    const imageBlock = lock.images.map((image, index) => (
      `<figure class="source-figure">` +
        `<img data-source-img="1" src="${escapeHtml(image.src)}" alt="${escapeHtml(sourceImageLabel(term, image, index))}" loading="eager">` +
        `<figcaption>${escapeHtml(sourceImageLabel(term, image, index))} · ${escapeHtml(lock.sourceMeta)}</figcaption>` +
        `<button class="source-open inline" type="button" data-source-open="${escapeHtml(image.src)}" data-source-label="${escapeHtml(sourceImageLabel(term, image, index))}" data-source-meta="${escapeHtml(lock.sourceMeta)}">Inspect</button>` +
      `</figure>`
    )).join("");
    els.sourcePanel.hidden = false;
    const tools = `<div class="source-tools" data-source-identity="${escapeHtml(lock.identity)}"><span class="source-verified" title="${escapeHtml(lock.identity)}">Matched released Regents source</span><span class="source-lock-note">Source matched</span></div>`;
    els.sourcePanel.innerHTML = `<div class="source-kicker">Source</div>${tools}<p class="source-match-line"><strong>Source:</strong> Used for this clue only · ${escapeHtml(lock.sourceMeta)}</p>${textBlock}${imageBlock}`;
  }

  function renderHint() {
    const term = state.target;
    if (!term) {
      els.hintBox.textContent = "";
      return;
    }
    const hints = [
      "Hints unlock extra context, but the best streaks come from solving without them.",
      `<strong>Course:</strong> ${escapeHtml(term.course)}<br><strong>Unit/Set:</strong> ${escapeHtml(term.set)}`,
      `<strong>First letter:</strong> ${term.code[0]}<br><strong>Last letter:</strong> ${term.code[term.code.length - 1]}`,
      `<strong>Pattern:</strong> ${escapeHtml(patternFor(term.answer))}`
    ];
    els.hintBox.innerHTML = hints[Math.min(state.hintLevel, hints.length - 1)];
  }

  function patternFor(answer) {
    return cleanText(answer).replace(/[A-Za-z]/g, "_");
  }

  function renderBoard() {
    const length = state.target.code.length;
    els.board.style.setProperty("--term-length", length);
    els.board.innerHTML = "";
    for (let row = 0; row < MAX_ATTEMPTS; row++) {
      const rowEl = document.createElement("div");
      rowEl.className = "row";
      rowEl.style.gridTemplateColumns = `repeat(${length}, minmax(0, auto))`;
      const storedGuess = state.guesses[row];
      const guess = (storedGuess && storedGuess.guess) || (row === state.guesses.length ? state.current : "");
      const marks = (storedGuess && storedGuess.marks) || [];
      for (let col = 0; col < length; col++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.textContent = guess[col] || "";
        if (row === state.guesses.length && col === state.current.length) tile.classList.add("active");
        if (marks[col]) {
          tile.classList.add(marks[col], "flip");
          tile.style.setProperty("--i", col);
        }
        rowEl.appendChild(tile);
      }
      els.board.appendChild(rowEl);
    }
  }

  function renderKeyboard() {
    const rows = keys.map((letters, rowIndex) => {
      const buttons = letters.split("").map((letter) => keyButton(letter)).join("");
      if (rowIndex === 2) return `<div class="key-row">${keyButton("ENTER", true)}${buttons}${keyButton("DEL", true)}</div>`;
      return `<div class="key-row">${buttons}</div>`;
    }).join("");
    els.keyboard.innerHTML = rows;
    els.keyboard.querySelectorAll(".key").forEach((button) => {
      button.addEventListener("click", () => handleKey(button.dataset.key));
    });
  }

  function keyButton(key, wide = false) {
    const cls = ["key"];
    if (wide) cls.push("wide");
    if (state.keyStates[key]) cls.push(state.keyStates[key]);
    return `<button class="${cls.join(" ")}" type="button" data-key="${key}">${key === "DEL" ? "DEL" : key}</button>`;
  }

  function updateStatsUI() {
    els.streak.textContent = state.stats.streak.toLocaleString();
    els.solved.textContent = state.stats.solved.toLocaleString();
    els.best.textContent = state.stats.best.toLocaleString();
    els.accuracy.textContent = state.stats.played ? `${Math.round((state.stats.solved / state.stats.played) * 100)}%` : "--";
  }

  function setMessage(text, type = "") {
    els.message.textContent = text;
    els.message.className = `message ${type}`.trim();
  }

  function handleKey(key) {
    if (!state.target || state.locked) return;
    if (key === "ENTER") {
      submitGuess();
      return;
    }
    if (key === "DEL" || key === "BACKSPACE") {
      state.current = state.current.slice(0, -1);
      audio.erase();
      renderBoard();
      return;
    }
    if (!/^[A-Z]$/.test(key)) return;
    if (state.current.length >= state.target.code.length) return;
    state.current += key;
    audio.key();
    renderBoard();
    const row = els.board.children[state.guesses.length];
    const tile = row && row.children ? row.children[state.current.length - 1] : null;
    if (tile) tile.classList.add("pop");
  }

  function submitGuess() {
    const target = state.target.code;
    if (state.current.length !== target.length) {
      setMessage(`Need ${target.length} letters for this cipher.`, "bad");
      audio.bad();
      return;
    }
    const marks = scoreGuess(state.current, target);
    state.guesses.push({ guess: state.current, marks });
    updateKeyStates(state.current, marks);
    marks.forEach((_, index) => audio.flip(index));
    const solved = state.current === target;
    state.current = "";
    renderBoard();
    renderKeyboard();
    if (solved) {
      finishRound(true);
    } else if (state.guesses.length >= MAX_ATTEMPTS) {
      finishRound(false);
    } else {
      const remaining = MAX_ATTEMPTS - state.guesses.length;
      setMessage(`${remaining} attempt${remaining === 1 ? "" : "s"} left. Use the clue, not random letters.`, "");
    }
  }

  function scoreGuess(guess, target) {
    const marks = Array(guess.length).fill("absent");
    const remaining = {};
    for (let i = 0; i < target.length; i++) {
      if (guess[i] === target[i]) {
        marks[i] = "correct";
      } else {
        remaining[target[i]] = (remaining[target[i]] || 0) + 1;
      }
    }
    for (let i = 0; i < guess.length; i++) {
      if (marks[i] === "correct") continue;
      if (remaining[guess[i]] > 0) {
        marks[i] = "present";
        remaining[guess[i]] -= 1;
      }
    }
    return marks;
  }

  function updateKeyStates(guess, marks) {
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      const next = marks[i];
      const current = state.keyStates[letter];
      if (!current || keyRank[next] > keyRank[current]) state.keyStates[letter] = next;
    }
  }

  function finishRound(won, skipped = false) {
    state.locked = true;
    state.stats.played += 1;
    if (won) {
      state.stats.solved += 1;
      state.stats.streak += 1;
      state.stats.best = Math.max(state.stats.best, state.stats.streak);
      els.ringCore.className = "ring-core win";
      setMessage("Cipher decoded. Explanation unlocked.", "good");
      audio.win();
      burst(36, "#67f0a8");
      if (window.MrMacsAnalytics && typeof window.MrMacsAnalytics.track === "function") {
        window.MrMacsAnalytics.track("game_complete", {
          gameId: "archive-cipher",
          title: "Archive Cipher",
          term: state.target.answer,
          attempts: state.guesses.length
        }, { counter: "game-completions", once: false });
      }
    } else {
      state.stats.streak = 0;
      els.ringCore.className = "ring-core loss";
      setMessage(skipped ? "Cipher skipped. Study the term, then try the next one." : "Cipher locked. Study the explanation.", "bad");
      audio.loss();
      burst(24, "#ff7bcc");
    }
    writeStats();
    updateStatsUI();
    showResult(won, skipped);
  }

  function showResult(won, skipped) {
    els.resultKicker.textContent = won ? "Decoded" : skipped ? "Skipped" : "Locked";
    els.resultTitle.textContent = won ? "Cipher Solved" : "Review This Term";
    els.resultAnswer.textContent = state.target.answer;
    els.resultExplain.textContent = explanationFor(state.target);
    els.resultModal.classList.add("show");
  }

  function useHint() {
    if (!state.target || state.locked) return;
    state.hintLevel = Math.min(3, state.hintLevel + 1);
    renderHint();
    setMessage(state.hintLevel >= 3 ? "Pattern hint unlocked." : "Hint unlocked.", "");
  }

  function burst(count, color) {
    if (reduceMotion) return;
    const actual = liteFx ? Math.min(16, Math.ceil(count * .45)) : count;
    const rect = els.fx.getBoundingClientRect();
    for (let i = 0; i < actual; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      state.particles.push({
        x: rect.width / 2,
        y: rect.height * .34,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 5,
        color,
        life: .5 + Math.random() * .8,
        max: 1.2
      });
    }
    scheduleFx();
  }

  function resizeFx() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.floor(innerWidth * dpr);
    const height = Math.floor(innerHeight * dpr);
    if (els.fx.width !== width || els.fx.height !== height) {
      els.fx.width = width;
      els.fx.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFx(now) {
    state.fxFrame = 0;
    const t = now || performance.now();
    const dt = Math.min(.05, Math.max(0, (t - state.last) / 1000 || .016));
    state.last = t;
    resizeFx();
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!reduceMotion && !liteFx && !document.hidden) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 30; i++) {
        const y = ((i * 97 + t * .035) % (innerHeight + 160)) - 80;
        const x = (i * 173 + Math.sin(t * .0008 + i) * 90) % innerWidth;
        const alpha = .04 + (i % 5) * .012;
        ctx.strokeStyle = `rgba(117,236,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 46 + (i % 4) * 18, y - 16);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 38 * dt;
      const alpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = hexToRgba(p.color, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    if (!document.hidden && (!liteFx || state.particles.length)) scheduleFx();
  }

  function scheduleFx() {
    if (!state.fxFrame) state.fxFrame = requestAnimationFrame(drawFx);
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    const int = parseInt(value.length === 3 ? value.split("").map((c) => c + c).join("") : value, 16);
    return `rgba(${(int >> 16) & 255},${(int >> 8) & 255},${int & 255},${alpha})`;
  }

  function openSourceViewer(src, label, meta) {
    if (!src) return;
    els.sourceViewerTitle.textContent = label || "Source stimulus";
    els.sourceViewerMeta.textContent = meta || "Verified released source";
    els.sourceViewerImage.src = src;
    els.sourceViewer.hidden = false;
    document.body.classList.add("viewer-open");
  }

  function closeSourceViewer() {
    els.sourceViewer.hidden = true;
    els.sourceViewerImage.removeAttribute("src");
    document.body.classList.remove("viewer-open");
  }

  function bindEvents() {
    els.courseFilter.addEventListener("change", () => {
      populateSets();
      applyFilters();
      newRound();
    });
    els.setFilter.addEventListener("change", () => {
      applyFilters();
      newRound();
    });
    els.lengthFilter.addEventListener("change", () => {
      applyFilters();
      newRound();
    });
    els.hintBtn.addEventListener("click", useHint);
    els.skipBtn.addEventListener("click", () => !state.locked && finishRound(false, true));
    els.newBtn.addEventListener("click", newRound);
    els.closeResultBtn.addEventListener("click", () => els.resultModal.classList.remove("show"));
    els.nextBtn.addEventListener("click", newRound);
    els.sourceViewerClose.addEventListener("click", closeSourceViewer);
    els.sourceViewer.addEventListener("click", (event) => {
      if (event.target === els.sourceViewer) closeSourceViewer();
    });
    document.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-source-open]") : null;
      if (button) openSourceViewer(button.dataset.sourceOpen, button.dataset.sourceLabel, button.dataset.sourceMeta);
    });
    document.addEventListener("error", (event) => {
      const img = event.target instanceof HTMLImageElement ? event.target : null;
      if (!img || !img.dataset.sourceImg || img.dataset.sourceMissing) return;
      img.dataset.sourceMissing = "1";
      const figure = img.closest(".source-figure");
      if (figure) {
        figure.classList.add("source-missing-frame");
        const note = document.createElement("div");
        note.className = "source-missing";
        note.textContent = "Source image did not load. Try a new clue or reload the page.";
        figure.append(note);
      }
    }, true);
    els.backBtn.addEventListener("click", () => { window.location.href = "../../index.html"; });
    window.addEventListener("keydown", (event) => {
      if (!els.sourceViewer.hidden && event.key === "Escape") {
        closeSourceViewer();
        return;
      }
      if (els.resultModal.classList.contains("show") && event.key === "Enter") {
        event.preventDefault();
        newRound();
        return;
      }
      const key = event.key.length === 1 ? event.key.toUpperCase() : event.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        event.preventDefault();
        handleKey(key);
      }
    });
    window.addEventListener("resize", resizeFx);
  }

  async function init() {
    bindEvents();
    renderKeyboard();
    updateStatsUI();
    scheduleFx();
    try {
      await loadBank();
    } catch (error) {
      console.error(error);
      els.libraryCount.textContent = "Library failed to load";
      setMessage("Could not load the review bank. Reload the page or check the data file.", "bad");
    }
  }

  init();
})();
