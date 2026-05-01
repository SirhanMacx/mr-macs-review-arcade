(function () {
  "use strict";

  var STORAGE_KEY = "mr-macs-review-arcade-v1:mastery-path";
  var SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;

  var COURSES = [
    { id: "grade-5", label: "Grade 5 Social Studies", short: "Grade 5", level: "Grade 5", family: "K-8", exam: "NYS Framework", writing: "Short constructed responses", skills: ["geography", "culture", "government", "economics", "source"] },
    { id: "grade-6", label: "Grade 6 Social Studies", short: "Grade 6", level: "Grade 6", family: "K-8", exam: "NYS Framework", writing: "Source-based paragraph practice", skills: ["geography", "belief", "civilization", "source", "chronology"] },
    { id: "grade-7", label: "Grade 7 U.S. History I", short: "Grade 7", level: "Grade 7", family: "U.S.", exam: "NYS Framework", writing: "Document evidence and context", skills: ["civics", "constitution", "source", "causation", "chronology"] },
    { id: "grade-8", label: "Grade 8 U.S. History II", short: "Grade 8", level: "Grade 8", family: "U.S.", exam: "NYS Framework", writing: "Document evidence and argument", skills: ["civics", "economics", "source", "causation", "continuity"] },
    { id: "global-9", label: "Grade 9 Global History I", short: "Global 9", level: "Grade 9", family: "Global", exam: "Global I course review", writing: "CRQ foundations", skills: ["geography", "belief", "civilization", "source", "comparison"] },
    { id: "global-10", label: "Grade 10 Global History II", short: "Global 10", level: "Grade 10", family: "Global", exam: "Global History II Regents", writing: "CRQ + Enduring Issues Essay", regents: true, skills: ["source", "context", "relationship", "enduring-issue", "outside-info"] },
    { id: "us-11", label: "Grade 11 U.S. History", short: "U.S. 11", level: "Grade 11", family: "U.S.", exam: "U.S. History Regents", writing: "Short essays + Civic Literacy Essay", regents: true, skills: ["source", "civics", "context", "relationship", "outside-info"] },
    { id: "ap-psych", label: "AP Psychology", short: "AP Psych", level: "AP", family: "AP", exam: "AP Psychology", writing: "Concept application and evidence", skills: ["vocabulary", "application", "evidence", "research", "analysis"] },
    { id: "apush", label: "AP United States History", short: "APUSH", level: "AP", family: "AP", exam: "AP U.S. History", writing: "SAQ, DBQ, LEQ thinking", skills: ["source", "context", "causation", "continuity", "argument"] },
    { id: "ap-world", label: "AP World History: Modern", short: "AP World", level: "AP", family: "AP", exam: "AP World History", writing: "SAQ, DBQ, LEQ thinking", skills: ["source", "comparison", "causation", "continuity", "argument"] },
    { id: "ap-euro", label: "AP European History", short: "AP Euro", level: "AP", family: "AP", exam: "AP European History", writing: "SAQ, DBQ, LEQ thinking", skills: ["source", "context", "causation", "continuity", "argument"] },
    { id: "ap-hug", label: "AP Human Geography", short: "AP HUG", level: "AP", family: "AP", exam: "AP Human Geography", writing: "Stimulus FRQ practice", skills: ["geography", "models", "source", "application", "evidence"] },
    { id: "ap-gov", label: "AP U.S. Government and Politics", short: "AP Gov", level: "AP", family: "AP", exam: "AP U.S. Government", writing: "Concept application and argument essay", skills: ["civics", "constitution", "source", "argument", "evidence"] },
    { id: "ap-macro", label: "AP Macroeconomics", short: "AP Macro", level: "AP", family: "AP", exam: "AP Macroeconomics", writing: "Graph and policy explanations", skills: ["economics", "graphs", "policy", "application", "vocabulary"] },
    { id: "ap-micro", label: "AP Microeconomics", short: "AP Micro", level: "AP", family: "AP", exam: "AP Microeconomics", writing: "Graph and market explanations", skills: ["economics", "graphs", "markets", "application", "vocabulary"] },
    { id: "civics-pig", label: "Civics and Participation in Government", short: "Civics", level: "Elective", family: "Elective", exam: "Civics course review", writing: "Civic action evidence", skills: ["civics", "participation", "policy", "source", "argument"] },
    { id: "economics", label: "Economics", short: "Economics", level: "Elective", family: "Elective", exam: "Economics course review", writing: "Economic reasoning", skills: ["economics", "markets", "policy", "graphs", "vocabulary"] }
  ];

  var SKILL_LABELS = {
    "source": "Source Reading",
    "context": "Historical Context",
    "relationship": "Relationships",
    "outside-info": "Outside Information",
    "enduring-issue": "Enduring Issues",
    "civics": "Civics",
    "constitution": "Constitution",
    "geography": "Geography",
    "belief": "Belief Systems",
    "civilization": "Civilizations",
    "economics": "Economics",
    "graphs": "Graphs And Data",
    "policy": "Policy Reasoning",
    "vocabulary": "Vocabulary",
    "chronology": "Chronology",
    "causation": "Cause And Effect",
    "comparison": "Comparison",
    "continuity": "Continuity And Change",
    "argument": "Argument",
    "evidence": "Evidence",
    "application": "Application",
    "research": "Research Methods",
    "markets": "Markets",
    "models": "Models",
    "participation": "Participation",
    "analysis": "Analysis",
    "culture": "Culture",
    "government": "Government"
  };

  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "all";
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function shuffle(values) {
    var out = values.slice();
    for (var i = out.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function uniq(values) {
    return Array.from(new Set(values.filter(Boolean))).sort(function (a, b) {
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    });
  }

  function courseProfile(course) {
    if (!course || course === "All Courses") return COURSES[5];
    var wanted = norm(course);
    return COURSES.find(function (item) {
      return norm(item.label) === wanted || norm(item.short) === wanted || item.id === course;
    }) || COURSES.find(function (item) {
      return wanted.includes(norm(item.short)) || wanted.includes(norm(item.label));
    }) || COURSES[5];
  }

  function courseOptions() {
    return COURSES.map(function (course) {
      return { value: course.label, label: course.short + " - " + course.exam };
    });
  }

  function hasImages(question) {
    if (SourceBank) return SourceBank.hasStimulusImages(question);
    return (question.stimulusImages || []).some(function (img) {
      return img && img.src;
    });
  }

  function sourceBased(question) {
    if (SourceBank) return SourceBank.sourceBased(question);
    var text = [question.stem, question.prompt, question.source, question.category, (question.tags || []).join(" ")].join(" ");
    return hasImages(question) || question.stimulusRequired || /document|source|map|cartoon|chart|graph|excerpt|passage|photograph|image|speaker|table|data/i.test(text);
  }

  function trustedSource(question) {
    if (SourceBank) return SourceBank.trustedSource(question);
    return hasImages(question) && !/^quarantined/i.test(String(question.sourceIntegrity || ""));
  }

  function sourceLock(question) {
    var normalized = Object.assign({}, question, { stimulusImages: question.stimulusImages || question.images || [] });
    if (SourceBank) return SourceBank.sourceLock(normalized);
    var ok = trustedSource(normalized);
    return {
      ok: ok,
      needed: sourceBased(normalized),
      reason: ok ? "" : "Source needs review",
      images: ok ? (normalized.stimulusImages || []) : [],
      identity: [normalized.course, normalized.source, (normalized.stimulusImages || []).map(function (image) { return image.src; }).join("|")].join("::"),
      label: ok ? "Source Lock: verified" : "Source Lock: blocked"
    };
  }

  function skillFor(question) {
    var text = norm([question.stem, question.prompt, question.answer, question.source, question.category, (question.tags || []).join(" ")].join(" "));
    if (/map|location|geograph|river|hemisphere|migration|region|urban|rural/.test(text)) return "geography";
    if (/cartoon|document|source|excerpt|speaker|author|photograph|chart|graph|data|according|based on/.test(text)) return "source";
    if (/constitution|amendment|court|congress|president|federal|rights|civic|citizen|policy|government/.test(text)) return "civics";
    if (/econom|market|supply|demand|inflation|trade|tax|money|bank|price|scarcity/.test(text)) return "economics";
    if (/religion|belief|islam|hindu|buddh|christian|judaism|confucian|legalism|sikh/.test(text)) return "belief";
    if (/cause|effect|result|impact|turning point|revolution|war|imperial|industrial/.test(text)) return "causation";
    if (/similar|different|compare|contrast/.test(text)) return "comparison";
    if (/chronology|period|century|before|after|timeline/.test(text)) return "chronology";
    if (/continuity|change over time|endured|enduring/.test(text)) return "continuity";
    return "vocabulary";
  }

  function topicFor(question) {
    if (question.set) return question.set;
    if (question.day && question.subject) return question.day + ": " + question.subject;
    if (question.category) return question.category;
    if ((question.tags || []).length) return question.tags[0];
    return question.subject || question.course || "Social Studies";
  }

  function choiceAnswer(question) {
    if (!question.choices) return String(question.answer || "");
    var found = question.choices.find(function (choice) {
      return String(choice.label) === String(question.correct);
    });
    return found ? found.text : "";
  }

  function makeRegentsMcq(question) {
    return {
      id: "regents:" + question.id,
      sourceId: question.id,
      bank: "regents",
      course: question.course,
      subject: question.subject,
      set: question.set || question.day,
      prompt: question.stem,
      answer: choiceAnswer(question),
      choices: shuffle((question.choices || []).map(function (choice) {
        return { text: choice.text, correct: String(choice.label) === String(question.correct) };
      })),
      explanation: question.explanation || ("Correct answer: " + choiceAnswer(question)),
      source: question.source,
      images: question.stimulusImages || [],
      sourceLock: sourceLock(question),
      skill: skillFor(question),
      topic: topicFor(question),
      tags: question.tags || [],
      sourceBased: sourceBased(question)
    };
  }

  function makeChronoMcq(question, pool) {
    var answer = String(question.answer || "");
    var distractors = shuffle(pool.filter(function (item) {
      return item.course === question.course && item.answer && item.answer !== answer;
    })).slice(0, 3).map(function (item) {
      return item.answer;
    });
    if (distractors.length < 3) {
      distractors = distractors.concat(shuffle(pool.filter(function (item) {
        return item.answer && item.answer !== answer;
      })).slice(0, 3 - distractors.length).map(function (item) {
        return item.answer;
      }));
    }
    return {
      id: "review:" + question.id,
      sourceId: question.id,
      bank: "review",
      course: question.course,
      subject: question.subject,
      set: question.set || question.day,
      prompt: question.prompt,
      answer: answer,
      choices: shuffle([answer].concat(distractors)).map(function (text) {
        return { text: text, correct: text === answer };
      }),
      explanation: question.explanation || (answer + ": " + question.prompt),
      source: question.source,
      images: [],
      skill: skillFor(question),
      topic: topicFor(question),
      tags: question.tags || [],
      sourceBased: false
    };
  }

  async function loadJson(path) {
    var response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load " + path);
    return response.json();
  }

  async function loadArcadeData(root) {
    root = root || "../../";
    var values = await Promise.all([
      loadJson(root + "games.json"),
      loadJson(root + "data/regents-gauntlet-bank.json"),
      loadJson(root + "data/chrono-defense-bank.json")
    ]);
    return { games: values[0], regents: values[1], review: values[2] };
  }

  function courseGames(games, course) {
    var profile = courseProfile(course);
    return (games || []).filter(function (game) {
      if (game.course === profile.label) return true;
      if (profile.id === "global-10" && game.course === "Grade 10 Global History II + Grade 11 U.S. History") return true;
      if (profile.id === "us-11" && game.course === "Grade 10 Global History II + Grade 11 U.S. History") return true;
      return norm([game.course, game.subject, game.grade, game.tags && game.tags.join(" ")].join(" ")).includes(norm(profile.short));
    });
  }

  function questionPool(data, course) {
    var profile = courseProfile(course);
    var courseValue = profile.label;
    var regents = (data.regents.questions || []).filter(function (q) {
      return profile.regents ? q.course === courseValue : norm([q.course, q.subject, q.set, q.tags && q.tags.join(" ")].join(" ")).includes(norm(profile.short));
    }).map(makeRegentsMcq);
    var reviewRaw = (data.review.questions || []).filter(function (q) {
      return q.course === courseValue || norm([q.course, q.subject, q.set, q.tags && q.tags.join(" ")].join(" ")).includes(norm(profile.short));
    });
    var review = reviewRaw.map(function (q) {
      return makeChronoMcq(q, reviewRaw);
    }).filter(function (q) {
      return q.answer && q.choices.length >= 4;
    });
    return { regents: regents, review: review, all: regents.concat(review), profile: profile };
  }

  function buildDiagnostic(data, course, count) {
    count = count || 12;
    var pools = questionPool(data, course);
    var sourceItems = shuffle(pools.regents.filter(function (q) { return q.sourceBased && sourceLock(q).ok; })).slice(0, Math.ceil(count / 2));
    var regentsItems = shuffle(pools.regents.filter(function (q) { return !sourceItems.some(function (s) { return s.id === q.id; }); })).slice(0, Math.ceil(count / 3));
    var reviewItems = shuffle(pools.review).slice(0, count - sourceItems.length - regentsItems.length);
    var items = shuffle(sourceItems.concat(regentsItems, reviewItems)).slice(0, count);
    if (items.length < count) {
      items = items.concat(shuffle(pools.all.filter(function (q) {
        return !items.some(function (item) { return item.id === q.id; });
      })).slice(0, count - items.length));
    }
    return items;
  }

  function sourceLabQuestions(data, course) {
    return shuffle(questionPool(data, course).regents.filter(function (question) {
      var lock = sourceLock(question);
      return question.sourceBased && lock.ok && lock.images.length;
    }));
  }

  function writingDocs(data, course, count, exclude, setHints) {
    exclude = exclude || {};
    setHints = (setHints || []).map(norm).filter(Boolean);
    var docs = [];
    var seen = {};
    var questions = sourceLabQuestions(data, course);
    var preferred = setHints.length ? questions.filter(function (question) {
      var haystack = norm([question.set, question.topic, question.source, (question.tags || []).join(" ")].join(" "));
      return setHints.some(function (hint) { return haystack.includes(hint); });
    }) : questions;
    function add(question) {
      var key = norm([question.source, question.images.map(function (img) { return img.src; }).join("|")].join("|"));
      if (!key || seen[key] || exclude[key]) return;
      seen[key] = true;
      docs.push({
        id: "doc-" + (docs.length + 1),
        course: question.course,
        source: question.source,
        title: question.set || question.topic,
        prompt: question.prompt,
        images: question.images,
        skill: question.skill,
        topic: question.topic,
        key: key
      });
    }
    preferred.forEach(add);
    if (docs.length < count) questions.forEach(add);
    return docs.slice(0, count);
  }

  function evaluateDiagnostic(items, answers) {
    var correct = 0;
    var misses = [];
    var skillTotals = {};
    var topicTotals = {};
    items.forEach(function (item) {
      var answer = answers[item.id];
      var ok = answer === item.answer;
      if (ok) correct += 1;
      var skill = item.skill || "vocabulary";
      skillTotals[skill] = skillTotals[skill] || { label: SKILL_LABELS[skill] || skill, total: 0, correct: 0 };
      skillTotals[skill].total += 1;
      if (ok) skillTotals[skill].correct += 1;
      var topic = item.topic || "Social Studies";
      topicTotals[topic] = topicTotals[topic] || { label: topic, total: 0, correct: 0 };
      topicTotals[topic].total += 1;
      if (ok) topicTotals[topic].correct += 1;
      if (!ok) misses.push(item);
    });
    var weakSkills = Object.keys(skillTotals).map(function (id) {
      var row = skillTotals[id];
      row.id = id;
      row.rate = row.total ? Math.round(row.correct / row.total * 100) : 0;
      return row;
    }).sort(function (a, b) {
      return a.rate - b.rate || b.total - a.total;
    });
    var weakTopics = Object.keys(topicTotals).map(function (id) {
      var row = topicTotals[id];
      row.id = slug(id);
      row.rate = row.total ? Math.round(row.correct / row.total * 100) : 0;
      return row;
    }).sort(function (a, b) {
      return a.rate - b.rate || b.total - a.total;
    });
    return {
      correct: correct,
      total: items.length,
      accuracy: items.length ? Math.round(correct / items.length * 100) : 0,
      misses: misses,
      weakSkills: weakSkills,
      weakTopics: weakTopics
    };
  }

  function nextActions(profile, result) {
    var weakText = (result.weakSkills || []).slice(0, 3).map(function (row) { return row.id; }).join(" ");
    var actions = [];
    if (/source|geography|graphs/.test(weakText) || result.accuracy < 70) {
      actions.push({ id: "source-lab", title: "Source Reading Lab", body: "Build the inspect-first habit with verified image-backed questions.", href: "../source-lab/" });
    }
    if (/context|relationship|outside-info|argument|evidence|enduring/.test(weakText) || profile.regents) {
      actions.push({ id: "writing-coach", title: "Writing Coach", body: "Practice rubric moves before another full exam.", href: "../writing-coach/" });
    }
    if (profile.regents) {
      actions.push({ id: "regents-practice-exam", title: "Full Regents Practice", body: "Put MCQs and writing together under a real timer.", href: "../regents-practice-exam/" });
    }
    actions.push({ id: "jeopardy", title: "Targeted Jeopardy Board", body: "Review the weakest topic with a fast class-style board.", href: "../../index.html#jeopardy" });
    return actions.slice(0, 4);
  }

  function readMastery() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      data.version = 1;
      data.diagnostics = Array.isArray(data.diagnostics) ? data.diagnostics : [];
      data.sourceSessions = Array.isArray(data.sourceSessions) ? data.sourceSessions : [];
      data.writingSessions = Array.isArray(data.writingSessions) ? data.writingSessions : [];
      return data;
    } catch (error) {
      return { version: 1, diagnostics: [], sourceSessions: [], writingSessions: [] };
    }
  }

  function writeMastery(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {}
    try {
      window.dispatchEvent(new CustomEvent("mrmacs-mastery-updated", { detail: data }));
    } catch (error) {}
  }

  function recordSession(type, detail) {
    var data = readMastery();
    var key = type === "diagnostic" ? "diagnostics" : type === "source" ? "sourceSessions" : "writingSessions";
    data[key] = Array.isArray(data[key]) ? data[key] : [];
    data[key].unshift(Object.assign({ at: new Date().toISOString() }, detail || {}));
    data[key] = data[key].slice(0, 12);
    data.lastUpdated = new Date().toISOString();
    writeMastery(data);
    if (window.MrMacsAnalytics && window.MrMacsAnalytics.track) {
      window.MrMacsAnalytics.track("game_complete", {
        gameId: detail.gameId || type,
        title: detail.title || "Mastery Path",
        course: detail.course || "",
        score: detail.score,
        accuracy: detail.accuracy,
        weakTopics: detail.weakTopics || [],
        studyTargets: detail.studyTargets || []
      }, { counter: "game-completions", once: false });
    } else if (window.MrMacsProgress && window.MrMacsProgress.recordEvent) {
      window.MrMacsProgress.recordEvent("game_complete", {
        gameId: detail.gameId || type,
        title: detail.title || "Mastery Path",
        course: detail.course || "",
        score: detail.score,
        accuracy: detail.accuracy,
        weakTopics: detail.weakTopics || [],
        studyTargets: detail.studyTargets || []
      });
    }
    return data;
  }

  function courseSummary(games, data, course) {
    var profile = courseProfile(course);
    var gamesForCourse = courseGames(games || [], profile.label);
    var pools = data ? questionPool(data, profile.label) : { regents: [], review: [], all: [] };
    return {
      profile: profile,
      games: gamesForCourse.length,
      jeopardy: gamesForCourse.filter(function (game) { return /jeopardy|unit review/i.test([game.gameType, game.title, game.file, game.originalFile].join(" ")); }).length,
      sourceQuestions: pools.regents.filter(function (q) { return q.sourceBased && sourceLock(q).ok && q.images.length; }).length,
      reviewQuestions: pools.review.length,
      fullPractice: gamesForCourse.filter(function (game) { return /practice exam|regents|source/i.test([game.title, game.gameType, game.subtitle].join(" ")); }).length
    };
  }

  window.MrMacsMastery = {
    COURSES: COURSES,
    SKILL_LABELS: SKILL_LABELS,
    slug: slug,
    norm: norm,
    esc: esc,
    shuffle: shuffle,
    uniq: uniq,
    courseProfile: courseProfile,
    courseOptions: courseOptions,
    loadArcadeData: loadArcadeData,
    questionPool: questionPool,
    buildDiagnostic: buildDiagnostic,
    evaluateDiagnostic: evaluateDiagnostic,
    sourceLabQuestions: sourceLabQuestions,
    writingDocs: writingDocs,
    nextActions: nextActions,
    readMastery: readMastery,
    writeMastery: writeMastery,
    recordSession: recordSession,
    courseSummary: courseSummary,
    trustedSource: trustedSource,
    sourceLock: sourceLock,
    sourceBased: sourceBased
  };
})();
