(function () {
  "use strict";

  var GAME_ID = "source-sorter";
  var GAME_TITLE = "Source Sorter";
  var CARD_SECONDS = 20;
  var BEST_KEY = "mrmacs:" + GAME_ID + ":best";
  var HISTORY_KEY = "mrmacs:" + GAME_ID + ":history";

  var SOURCE_BINS = [
    { id: "text", label: "Text Document", hint: "Passage, speech, amendment, letter", color: "#f4c64f" },
    { id: "map", label: "Map Evidence", hint: "Map, route, territory, region", color: "#69d9e7" },
    { id: "data", label: "Chart or Graph", hint: "Chart, table, graph, trend", color: "#79e6a9" },
    { id: "visual", label: "Visual Source", hint: "Cartoon, poster, photo, cover", color: "#ff7b8f" }
  ];

  var COURSE_BINS = [
    { id: "world", label: "World History", hint: "Global, world, Europe, empire", color: "#b79cff" },
    { id: "us", label: "U.S. History", hint: "United States, reform, war, rights", color: "#69d9e7" },
    { id: "civics", label: "Civics", hint: "Government, courts, rights, policy", color: "#f4c64f" },
    { id: "economics", label: "Economics", hint: "Markets, scarcity, policy, trade", color: "#79e6a9" }
  ];

  var COURSE_TARGETS = {
    "global-9": "world",
    "global-10": "world",
    "ap-world-history-modern": "world",
    "ap-european-history": "world",
    "ap-human-geography": "world",
    "us-history": "us",
    "ap-united-states-history": "us",
    "ap-african-american-studies": "us",
    "us-government": "civics",
    "ap-united-states-government-and-politics": "civics",
    "economics": "economics",
    "ap-macroeconomics": "economics",
    "ap-microeconomics": "economics"
  };

  var state = {
    sourceCards: [],
    courseCards: [],
    deck: [],
    current: null,
    mode: "source-type",
    rounds: 12,
    roundIndex: 0,
    score: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    locked: false,
    deadline: 0,
    timer: null,
    startedAt: 0,
    fetchReady: false,
    usedFallback: false
  };

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function shuffle(items) {
    var arr = items.slice();
    for (var i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function sourceBank() {
    return window.MrMacsSourceBank || null;
  }

  function playSfx(name) {
    try {
      if (window.MrMacsSFX && typeof window.MrMacsSFX.play === "function") {
        window.MrMacsSFX.play(name);
      }
    } catch (err) {}
  }

  function labelForCourse(courseId) {
    var labels = window.DIAG_BANK_COURSE_LABELS || {};
    return labels[courseId] || courseId;
  }

  function answerText(question) {
    var bank = sourceBank();
    if (bank && typeof bank.answerText === "function") {
      var bankAnswer = clean(bank.answerText(question));
      if (bankAnswer) return bankAnswer;
    }
    if (question.correctText) return clean(question.correctText);
    var choices = Array.isArray(question.choices) ? question.choices : [];
    for (var i = 0; i < choices.length; i += 1) {
      if (String(choices[i].label) === String(question.correct)) return clean(choices[i].text);
    }
    return clean(question.answer || "");
  }

  function promptText(question) {
    var bank = sourceBank();
    if (bank && typeof bank.displayPrompt === "function") {
      return clean(bank.displayPrompt(question));
    }
    return clean(question.prompt || question.stem);
  }

  function sourceText(question) {
    var bank = sourceBank();
    if (bank && typeof bank.displaySource === "function") {
      return clean(bank.displaySource(question));
    }
    return clean(question.source || question.set || question.day || question.topic);
  }

  function stimulusImages(question) {
    var bank = sourceBank();
    if (bank && typeof bank.sourceLock === "function") {
      var lock = bank.sourceLock(question);
      return lock && Array.isArray(lock.images) ? lock.images : [];
    }
    return Array.isArray(question.stimulusImages) ? question.stimulusImages.filter(function (img) {
      return img && img.src;
    }) : [];
  }

  function classifySource(question) {
    var blob = [
      question.stem,
      question.prompt,
      question.source,
      question.explanation,
      Array.isArray(question.tags) ? question.tags.join(" ") : ""
    ].join(" ").toLowerCase();

    if (/\b(map|maps|route|routes|territor|canal|region|regions|migration|geographic|geography)\b/.test(blob)) return "map";
    if (/\b(graph|graphs|chart|charts|table|tables|data|trend|trends|statistics|percent|percentage|rate|rates|population|exports|imports)\b/.test(blob)) return "data";
    if (/\b(cartoon|cartoonist|poster|photograph|photo|image|picture|cover|covers|postcard|stamp|painting|advertisement|visual|illustration|magazine)\b/.test(blob)) return "visual";
    if (/\b(passage|excerpt|speech|amendment|document|documents|letter|treaty|order|statement|quote|quotation|article|compact|constitution|papers|manifesto|proclamation|decision|clause)\b/.test(blob)) return "text";
    return "";
  }

  function normalizeSourceQuestion(question) {
    var target = classifySource(question);
    if (!target) return null;
    var images = stimulusImages(question);
    if (!images.length) return null;

    return {
      mode: "source-type",
      target: target,
      prompt: promptText(question),
      answer: answerText(question),
      explanation: clean(question.explanation),
      source: sourceText(question) || clean(question.source),
      course: clean(question.course),
      topic: clean(question.set || question.day || question.subject),
      images: images,
      raw: question
    };
  }

  function normalizeCourseQuestion(courseId, question) {
    var target = COURSE_TARGETS[courseId];
    if (!target) return null;
    var prompt = promptText(question);
    var answer = answerText(question);
    if (!prompt || !answer) return null;

    return {
      mode: "course-shelf",
      target: target,
      prompt: prompt,
      answer: answer,
      explanation: clean(question.explanation),
      source: clean(question.sourceAuthority || question.assessmentSourceId || "Shared course bank"),
      course: labelForCourse(courseId),
      topic: clean(question.topic || question.domain || question.subjectArea),
      images: [],
      raw: question
    };
  }

  function sharedCourseCards() {
    var bank = window.DIAG_BANK_BY_COURSE || {};
    var cards = [];
    Object.keys(COURSE_TARGETS).forEach(function (courseId) {
      var rows = Array.isArray(bank[courseId]) ? bank[courseId] : [];
      rows.forEach(function (question) {
        var card = normalizeCourseQuestion(courseId, question);
        if (card) cards.push(card);
      });
    });
    return cards;
  }

  function loadRegentsSourceCards() {
    return fetch("../../data/regents-gauntlet-bank.json?v=20260517-source-sorter", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (data) {
        var rows = Array.isArray(data.questions) ? data.questions : [];
        if (sourceBank() && typeof sourceBank().registerRecords === "function") {
          sourceBank().registerRecords(rows);
        }
        return rows.map(normalizeSourceQuestion).filter(Boolean);
      });
  }

  function binsForMode(mode) {
    return mode === "course-shelf" ? COURSE_BINS : SOURCE_BINS;
  }

  function poolForMode(mode) {
    if (mode === "course-shelf") return state.courseCards;
    if (state.sourceCards.length) return state.sourceCards;
    return state.courseCards;
  }

  function balancedDeck(pool, rounds, bins) {
    var groups = {};
    bins.forEach(function (bin) {
      groups[bin.id] = shuffle(pool.filter(function (card) { return card.target === bin.id; }));
    });

    var deck = [];
    var cursor = 0;
    while (deck.length < rounds && deck.length < pool.length) {
      var bin = bins[cursor % bins.length];
      var group = groups[bin.id] || [];
      if (group.length) deck.push(group.pop());
      cursor += 1;
      if (cursor > rounds * bins.length * 4) break;
    }

    if (deck.length < rounds) {
      var used = new Set(deck.map(function (card) { return card.raw && (card.raw.id || card.prompt); }));
      shuffle(pool).forEach(function (card) {
        var key = card.raw && (card.raw.id || card.prompt);
        if (deck.length >= rounds) return;
        if (!used.has(key)) deck.push(card);
      });
    }

    return shuffle(deck).slice(0, rounds);
  }

  function showScreen(name) {
    els.setupScreen.hidden = name !== "setup";
    els.playScreen.hidden = name !== "play";
    els.endScreen.hidden = name !== "end";
    if (name === "setup") els.setupScreen.style.display = "";
    if (name === "play") els.playScreen.style.display = "";
    if (name === "end") els.endScreen.style.display = "";
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function setTopStats() {
    var best = readBest();
    els.topStats.innerHTML = [
      state.score + " pts",
      state.streak + " streak",
      best.score ? best.score + " best" : "no best yet"
    ].map(function (text) {
      return "<span>" + esc(text) + "</span>";
    }).join("");
  }

  function renderBankStatus() {
    var sourceCount = state.sourceCards.length;
    var courseCount = state.courseCards.length;
    var coverage = window.DIAG_BANK_COVERAGE || {};
    els.bankMetrics.innerHTML = [
      [sourceCount || "-", "source cards"],
      [courseCount || "-", "course cards"],
      [coverage.questions || courseCount || "-", "shared bank"]
    ].map(function (metric) {
      return "<div class=\"metric\"><strong>" + esc(metric[0]) + "</strong><span>" + esc(metric[1]) + "</span></div>";
    }).join("");

    els.bankNote.textContent = state.usedFallback
      ? "Source JSON was unavailable, so Source Type uses the shared course-bank fallback."
      : "Ready: Regents source cards plus shared course-bank cards are loaded locally.";
  }

  function updateStartState() {
    var mode = els.modeSelect.value;
    var pool = poolForMode(mode);
    var ready = pool.length >= 4;
    els.startBtn.disabled = !ready;
    els.startBtn.textContent = ready ? "Start Sort" : "Bank Unavailable";
  }

  function renderShelves() {
    var bins = binsForMode(state.mode);
    els.shelfGrid.innerHTML = bins.map(function (bin, index) {
      return [
        "<button class=\"shelf-btn\" type=\"button\" data-target=\"", esc(bin.id), "\" style=\"--shelf-color:", esc(bin.color), "\">",
        "<span class=\"shelf-key\">", index + 1, "</span>",
        "<span class=\"shelf-title\">", esc(bin.label), "</span>",
        "<span class=\"shelf-hint\">", esc(bin.hint), "</span>",
        "</button>"
      ].join("");
    }).join("");

    Array.prototype.forEach.call(els.shelfGrid.querySelectorAll(".shelf-btn"), function (button) {
      button.addEventListener("click", function () {
        grade(button.dataset.target, button);
      });
    });
  }

  function renderCard() {
    var card = state.current;
    var label = card.mode === "source-type" ? "Sort the source type" : "Sort the course shelf";
    var imageHtml = "";
    if (card.images.length) {
      imageHtml = "<div class=\"stimulus-grid\">" + card.images.slice(0, 2).map(function (image, index) {
        var caption = clean(image.label || image.alt || ("Source image " + (index + 1)));
        return "<figure><img src=\"" + esc(image.src) + "\" alt=\"" + esc(caption) + "\"><figcaption>" + esc(caption) + "</figcaption></figure>";
      }).join("") + "</div>";
    }

    els.cardRoot.innerHTML = [
      "<span class=\"card-label\">", esc(label), "</span>",
      "<div class=\"card-meta\">", esc([card.course, card.topic, card.source].filter(Boolean).join(" | ")), "</div>",
      "<h2>", esc(card.prompt), "</h2>",
      imageHtml,
      "<p class=\"answer-line\"><strong>Answer key:</strong> ", esc(card.answer), "</p>"
    ].join("");
  }

  function updateHud() {
    var left = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
    els.scoreHud.textContent = state.score;
    els.streakHud.textContent = state.streak;
    els.roundHud.textContent = Math.min(state.roundIndex + 1, state.rounds) + "/" + state.rounds;
    els.timerHud.textContent = state.deadline ? left : CARD_SECONDS;
    setTopStats();
  }

  function stopTimer() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }

  function startTimer() {
    stopTimer();
    state.deadline = Date.now() + CARD_SECONDS * 1000;
    updateHud();
    state.timer = setInterval(function () {
      updateHud();
      if (!state.locked && Date.now() >= state.deadline) {
        grade("", null);
      }
    }, 250);
  }

  function nextCard() {
    stopTimer();
    if (state.roundIndex >= state.deck.length) {
      finishRun();
      return;
    }
    state.current = state.deck[state.roundIndex];
    state.locked = false;
    els.feedback.textContent = "";
    renderCard();
    renderShelves();
    updateHud();
    startTimer();
  }

  function targetLabel(targetId) {
    var bins = binsForMode(state.mode);
    for (var i = 0; i < bins.length; i += 1) {
      if (bins[i].id === targetId) return bins[i].label;
    }
    return targetId;
  }

  function grade(target, button) {
    if (state.locked || !state.current) return;
    state.locked = true;
    stopTimer();

    var correct = target === state.current.target;
    var timeLeft = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));

    Array.prototype.forEach.call(els.shelfGrid.querySelectorAll(".shelf-btn"), function (shelf) {
      if (shelf.dataset.target === state.current.target) shelf.classList.add("correct");
    });
    if (button && !correct) button.classList.add("wrong");

    if (correct) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.score += 100 + Math.min(60, state.streak * 10) + timeLeft * 3;
      playSfx("success");
    } else {
      state.streak = 0;
      state.score = Math.max(0, state.score - 20);
      playSfx("error");
    }

    var verdict = correct ? "Correct shelf." : target ? "Wrong shelf." : "Time expired.";
    var explanation = state.current.explanation || "Review the clue, answer key, and source label before sorting the next card.";
    els.feedback.innerHTML = "<strong>" + esc(verdict) + "</strong> Correct: " + esc(targetLabel(state.current.target)) + ". " + esc(explanation);
    state.roundIndex += 1;
    updateHud();
    setTimeout(nextCard, correct ? 950 : 1700);
  }

  function startRun() {
    var selectedMode = els.modeSelect.value;
    if (selectedMode === "source-type" && !state.sourceCards.length) selectedMode = "course-shelf";
    state.mode = selectedMode;
    state.rounds = Number(els.roundSelect.value) || 12;

    var bins = binsForMode(state.mode);
    var pool = poolForMode(state.mode);
    state.deck = balancedDeck(pool, state.rounds, bins);
    state.rounds = state.deck.length;
    state.roundIndex = 0;
    state.score = 0;
    state.correct = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.locked = false;
    state.startedAt = Date.now();

    if (!state.deck.length) {
      els.bankNote.textContent = "No playable cards are available for this mode.";
      updateStartState();
      return;
    }

    playSfx("gameStart");
    showScreen("play");
    nextCard();
  }

  function readBest() {
    try {
      return JSON.parse(localStorage.getItem(BEST_KEY) || "{}") || {};
    } catch (err) {
      return {};
    }
  }

  function saveLocalResult(payload) {
    try {
      var best = readBest();
      if (!best.score || payload.score > best.score) {
        localStorage.setItem(BEST_KEY, JSON.stringify(payload));
      }
      var history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      history.unshift(payload);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
    } catch (err) {}
  }

  function dispatchScore(payload) {
    try {
      if (window.CustomEvent && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("mrmacs:score-submit", { detail: payload }));
      }
    } catch (err) {}
  }

  function finishRun() {
    stopTimer();
    var durationMs = Date.now() - state.startedAt;
    var accuracy = state.rounds ? Math.round((state.correct / state.rounds) * 100) : 0;
    var payload = {
      gameId: GAME_ID,
      score: state.score,
      meta: {
        title: GAME_TITLE,
        mode: state.mode,
        rounds: state.rounds,
        correct: state.correct,
        accuracy: accuracy,
        bestStreak: state.bestStreak,
        durationMs: durationMs,
        localOnly: true
      }
    };

    saveLocalResult({
      score: state.score,
      mode: state.mode,
      rounds: state.rounds,
      correct: state.correct,
      accuracy: accuracy,
      bestStreak: state.bestStreak,
      playedAt: new Date().toISOString()
    });
    dispatchScore(payload);

    els.resultTitle.textContent = accuracy >= 85 ? "Clean Sort" : accuracy >= 65 ? "Sorted Run" : "Archive Reset";
    els.resultMetrics.innerHTML = [
      [state.score, "points"],
      [state.correct + "/" + state.rounds, "correct"],
      [accuracy + "%", "accuracy"]
    ].map(function (metric) {
      return "<div class=\"metric\"><strong>" + esc(metric[0]) + "</strong><span>" + esc(metric[1]) + "</span></div>";
    }).join("");
    els.resultNote.textContent = "Best streak: " + state.bestStreak + ". Score saved locally and submitted through mrmacs:score-submit.";
    showScreen("end");
    setTopStats();
  }

  function mountHelp() {
    if (!window.MrMacsHelpOverlay) return;
    window.MrMacsHelpOverlay.register(GAME_ID, {
      title: "How to Play Source Sorter",
      goal: "Sort each review card into the correct archive shelf before time runs out.",
      controls: [
        { key: "Click shelf", action: "Choose an answer" },
        { key: "1-4", action: "Pick shelves from left to right" },
        { key: "Play Again", action: "Start a new local run" }
      ],
      tips: [
        "In Source Type mode, inspect the stem for map, graph, cartoon, poster, speech, or passage clues.",
        "In Course Shelf mode, use the topic and answer key to sort the card into its course family.",
        "Fast correct sorts earn time bonuses.",
        "Wrong shelves reveal the correct shelf before the next card."
      ],
      scholar: "Runs stay local, and the final score dispatches the shared arcade score event."
    });

    var container = document.querySelector("#setupScreen .setup-actions");
    if (container) window.MrMacsHelpOverlay.mountButton(container, GAME_ID, { label: "?" });
  }

  function bindEvents() {
    els.startBtn.addEventListener("click", startRun);
    els.againBtn.addEventListener("click", function () {
      showScreen("setup");
      updateStartState();
    });
    els.modeSelect.addEventListener("change", updateStartState);
    document.addEventListener("keydown", function (event) {
      if (els.playScreen.hidden || state.locked) return;
      if (!/^[1-4]$/.test(event.key)) return;
      var index = Number(event.key) - 1;
      var buttons = els.shelfGrid.querySelectorAll(".shelf-btn");
      if (buttons[index]) {
        event.preventDefault();
        buttons[index].click();
      }
    });
  }

  function cacheEls() {
    [
      "setupScreen",
      "playScreen",
      "endScreen",
      "startBtn",
      "againBtn",
      "modeSelect",
      "roundSelect",
      "bankMetrics",
      "bankNote",
      "topStats",
      "scoreHud",
      "streakHud",
      "roundHud",
      "timerHud",
      "cardRoot",
      "shelfGrid",
      "feedback",
      "resultTitle",
      "resultMetrics",
      "resultNote"
    ].forEach(function (id) {
      els[id] = $(id);
    });
  }

  function init() {
    cacheEls();
    bindEvents();
    mountHelp();
    state.courseCards = sharedCourseCards();
    renderBankStatus();
    updateStartState();
    setTopStats();

    loadRegentsSourceCards()
      .then(function (cards) {
        state.sourceCards = cards;
        state.fetchReady = true;
        state.usedFallback = false;
      })
      .catch(function (err) {
        state.fetchReady = true;
        state.usedFallback = true;
        state.sourceCards = [];
        if (window.console && console.warn) console.warn("[source-sorter] source-card load failed", err);
      })
      .then(function () {
        renderBankStatus();
        updateStartState();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
