const M = window.MrMacsMastery;
const TASKS = {
  "Grade 10 Global History II": [
    {
      id: "global-crq-1",
      title: "Global CRQ Set 1",
      points: 3,
      docs: 2,
      minDocs: 2,
      type: "CRQ",
      setHints: ["Geography + Historical Turning Points"],
      prompt: "Answer the three CRQ moves: describe the historical context for Document 1, explain sourcing for Document 2, and explain a relationship between the two documents.",
      checks: ["Historical context", "Sourcing or point of view", "Relationship between documents"]
    },
    {
      id: "global-crq-2",
      title: "Global CRQ Set 2",
      points: 4,
      docs: 2,
      minDocs: 2,
      type: "CRQ",
      setHints: ["Economic + Political Systems", "Conflicts + Human Rights Violations"],
      prompt: "Explain context for both documents, identify a relationship or turning point, and explain why that relationship matters in Global History.",
      checks: ["Context for Document 1", "Context for Document 2", "Relationship or turning point", "Why it matters"]
    },
    {
      id: "global-eie",
      title: "Enduring Issues Essay",
      points: 5,
      docs: 5,
      minDocs: 3,
      type: "Essay",
      setHints: ["Important Individuals + EIE", "Conflicts + Human Rights Violations"],
      prompt: "Identify and define one enduring issue raised by the documents. Argue why the issue has endured over time. Use evidence from at least three documents and include outside information.",
      checks: ["Enduring issue", "At least three documents", "Significance or effect", "Continuity or change", "Outside information", "Organized analysis"]
    }
  ],
  "Grade 11 U.S. History": [
    {
      id: "us-short-1",
      title: "U.S. Short Essay",
      points: 5,
      docs: 2,
      minDocs: 2,
      type: "Short Essay",
      setHints: ["Colonial + Constitution + Supreme Court", "Amendments + Documents + Laws"],
      prompt: "Describe the historical context around the documents, explain the relationship between them, and include one specific outside detail from U.S. History.",
      checks: ["Historical context", "Relationship", "Both documents", "Outside information", "Analysis"]
    },
    {
      id: "us-civic-scaffold",
      title: "Civic Literacy Scaffold",
      points: 6,
      docs: 6,
      minDocs: 4,
      type: "Scaffold",
      setHints: ["Amendments + Documents + Laws", "Presidents + Reformers + Movements"],
      prompt: "Answer the document scaffold: identify the civic issue, extract evidence from the documents, and explain how the issue was addressed.",
      checks: ["Civic issue", "Document evidence", "Historical circumstances", "Efforts to address", "Extent of success", "Specific facts"]
    },
    {
      id: "us-cle",
      title: "Civic Literacy Essay",
      points: 5,
      docs: 6,
      minDocs: 4,
      type: "Essay",
      setHints: ["Amendments + Documents + Laws", "Presidents + Reformers + Movements", "Modern Issues + Miscellaneous"],
      prompt: "Identify the civic or constitutional issue. Explain historical circumstances, describe efforts to address the issue, and discuss the extent of success. Use document evidence and outside information.",
      checks: ["Civic issue", "Historical circumstances", "Efforts to address", "Extent of success", "At least four documents", "Outside information and organization"]
    }
  ]
};

const state = { data: null, course: "Grade 10 Global History II", task: null, docs: [], result: null };
const $ = (selector) => document.querySelector(selector);

function show(id) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  $("#" + id).classList.add("active");
  scrollTo({ top: 0, behavior: "auto" });
}

function emptyCard(iconName, title, sub) {
  const icon = (typeof window !== "undefined" && window.MrMacsIcons && window.MrMacsIcons.has(iconName))
    ? window.MrMacsIcons.svg(iconName) : "";
  return '<div class="empty-card">' + icon + '<strong>' + M.esc(title) + '</strong><span>' + M.esc(sub) + '</span></div>';
}

function fillTasks() {
  const course = $("#courseSelect").value;
  const tasks = TASKS[course] || TASKS["Grade 10 Global History II"];
  $("#taskSelect").innerHTML = tasks.map((task) => '<option value="' + M.esc(task.id) + '">' + M.esc(task.title + " - " + task.points + " pts") + '</option>').join("");
  renderTaskMetrics();
}

function selectedTask() {
  const course = $("#courseSelect").value;
  const id = $("#taskSelect").value;
  return (TASKS[course] || [])[0] && (TASKS[course] || []).find((task) => task.id === id) || TASKS[course][0];
}

function renderTaskMetrics() {
  const course = $("#courseSelect").value;
  const task = selectedTask();
  const questions = state.data ? M.sourceLabQuestions(state.data, course) : [];
  $("#taskMetrics").innerHTML =
    '<div class="metric"><strong>' + task.points + '</strong><span>rubric points</span></div>' +
    '<div class="metric"><strong>' + task.docs + '</strong><span>documents</span></div>' +
    '<div class="metric"><strong>' + questions.length + '</strong><span>source pool</span></div>';
}

function renderRubric(target, task, result) {
  const hits = result ? result.checks : [];
  target.innerHTML = task.checks.map((label, index) => {
    const hit = result ? hits[index] && hits[index].pass : false;
    return '<div class="rubric-row ' + (hit ? "hit" : "") + '"><strong>' + M.esc(label) + '</strong><span>' + M.esc(result ? (hits[index]?.note || (hit ? "Present" : "Needs work")) : "Rubric target") + '</span></div>';
  }).join("");
}

function courseHref(href) {
  const course = "course=" + encodeURIComponent(state.course);
  if (href.includes("#")) {
    const parts = href.split("#");
    return parts[0] + "?" + course + "#" + parts.slice(1).join("#");
  }
  return href + "?" + course;
}

function renderDocs() {
  $("#docGrid").innerHTML = state.docs.map((doc, index) =>
    '<figure class="doc-card">' +
      '<div class="doc-images">' + doc.images.map((image, imageIndex) =>
        '<img src="' + M.esc(image.src) + '" alt="Document ' + (index + 1) + (doc.images.length > 1 ? ', image ' + (imageIndex + 1) : '') + '">'
      ).join("") + '</div>' +
      '<figcaption class="source-line"><strong>Document ' + (index + 1) + '</strong><br>' + M.esc(doc.title || "Released source") + '<br>' + M.esc(doc.source || "Released Regents source") + '</figcaption>' +
    '</figure>'
  ).join("");
}

function start() {
  state.course = $("#courseSelect").value;
  state.task = selectedTask();
  state.docs = M.writingDocs(state.data, state.course, state.task.docs, {}, state.task.setHints);
  $("#taskKicker").textContent = state.course;
  $("#taskTitle").textContent = state.task.title;
  $("#promptText").textContent = state.task.prompt;
  $("#taskPills").innerHTML =
    '<span class="pill gold">' + state.task.points + ' points</span>' +
    '<span class="pill green">Use at least ' + state.task.minDocs + ' docs</span>' +
    '<span class="pill">' + M.esc(state.task.type) + '</span>';
  $("#responseText").value = "";
  renderRubric($("#rubricPreview"), state.task, null);
  renderDocs();
  updateCounts();
  show("writeScreen");
}

function words(text) {
  return (String(text || "").trim().match(/\b[\w'-]+\b/g) || []).length;
}

function docHits(text) {
  const value = String(text || "").toLowerCase();
  let count = 0;
  for (let i = 1; i <= state.docs.length; i += 1) {
    if (new RegExp("\\b(?:doc(?:ument)?\\s*" + i + "|document " + i + ")\\b", "i").test(value)) count += 1;
  }
  return count;
}

function has(text, pattern) {
  return pattern.test(String(text || "").toLowerCase());
}

function features(text) {
  const wc = words(text);
  const docs = docHits(text);
  return {
    wc,
    docs,
    context: has(text, /context|during|because|background|historical circumstances|time period|at the time|before this/),
    sourcing: has(text, /point of view|purpose|audience|bias|author|speaker|intended|perspective/),
    relationship: has(text, /cause|effect|similar|different|turning point|relationship|led to|resulted|changed|continued/),
    issue: has(text, /issue|conflict|rights|power|inequality|human rights|government|constitutional|enduring|civic/),
    efforts: has(text, /effort|address|respond|reform|law|court|movement|protest|decision|amendment|policy/),
    success: has(text, /success|successful|limited|extent|however|although|failed|partly|impact|effect/),
    outside: has(text, /outside information|for example|another example|also|in addition|such as|beyond the document|course/),
    analysis: has(text, /this shows|this proves|therefore|as a result|this matters|significant|important|demonstrates|reveals/),
    organized: wc >= 120 && /\n\s*\n/.test(String(text || "")) || wc >= 220
  };
}

function score() {
  const text = $("#responseText").value;
  const f = features(text);
  const task = state.task;
  const checks = task.checks.map((label) => ({ label, pass: false, note: "Add this rubric move." }));
  if (/context|circumstances/i.test(task.prompt) && checks[0]) checks[0].pass = f.context;
  if (/CRQ Set 1/i.test(task.title)) {
    checks[0].pass = f.context;
    checks[0].note = f.context ? "Context is present." : "Name the larger historical setting.";
    checks[1].pass = f.sourcing;
    checks[1].note = f.sourcing ? "Sourcing language is present." : "Explain point of view, purpose, audience, or bias.";
    checks[2].pass = f.relationship && f.docs >= 2;
    checks[2].note = checks[2].pass ? "Relationship uses both documents." : "Name the relationship and use both documents.";
  } else if (/CRQ Set 2/i.test(task.title)) {
    checks[0].pass = f.context && f.docs >= 1;
    checks[1].pass = f.context && f.docs >= 2;
    checks[2].pass = f.relationship;
    checks[3].pass = f.analysis && f.docs >= 2;
    checks.forEach((check) => { check.note = check.pass ? "Present." : "Use the documents and explain the relationship."; });
  } else if (/Enduring/i.test(task.title)) {
    checks[0].pass = f.issue;
    checks[1].pass = f.docs >= 3;
    checks[2].pass = f.success || f.analysis;
    checks[3].pass = f.relationship || has(text, /endured|continued|changed|over time|continuity/);
    checks[4].pass = f.outside;
    checks[5].pass = f.analysis && f.organized;
    checks.forEach((check, i) => { check.note = check.pass ? "Present." : ["Name and define one enduring issue.", "Use at least three document references.", "Explain the effect on people or societies.", "Show endurance or change over time.", "Add outside information.", "Use organized analytical paragraphs."][i]; });
  } else if (/Scaffold/i.test(task.title)) {
    checks[0].pass = f.issue;
    checks[1].pass = f.docs >= 4;
    checks[2].pass = f.context;
    checks[3].pass = f.efforts;
    checks[4].pass = f.success;
    checks[5].pass = f.wc >= 120;
    checks.forEach((check) => { check.note = check.pass ? "Present." : "Answer with specific facts from the civic documents."; });
  } else if (/Civic Literacy/i.test(task.title)) {
    checks[0].pass = f.issue;
    checks[1].pass = f.context;
    checks[2].pass = f.efforts;
    checks[3].pass = f.success;
    checks[4].pass = f.docs >= 4;
    checks[5].pass = f.outside && f.analysis && f.organized;
    checks.forEach((check, i) => { check.note = check.pass ? "Present." : ["Name the civic or constitutional issue.", "Explain historical circumstances.", "Describe efforts to address it.", "Discuss the extent of success.", "Use at least four document references.", "Add outside information and organize the argument."][i]; });
  } else {
    checks[0].pass = f.context;
    checks[1].pass = f.relationship;
    checks[2].pass = f.docs >= 2;
    checks[3].pass = f.outside;
    checks[4].pass = f.analysis && f.wc >= 120;
    checks.forEach((check) => { check.note = check.pass ? "Present." : "Add context, relationship, evidence, outside information, and analysis."; });
  }
  let raw = checks.filter((check) => check.pass).length;
  let estimate = Math.min(task.points, raw);
  if (task.points === 5 || task.points === 6) {
    if (f.wc < 60) estimate = Math.min(estimate, 1);
    else if (f.wc < 130) estimate = Math.min(estimate, 2);
    if (task.points === 5 && checks.filter((check) => check.pass).length >= 4 && f.wc >= 220) estimate = 4;
    if (task.points === 5 && checks.every((check) => check.pass) && f.wc >= 300) estimate = 5;
  }
  estimate = Math.max(0, Math.min(task.points, estimate));
  return { score: estimate, max: task.points, checks, features: f };
}

function updateCounts() {
  const text = $("#responseText").value;
  $("#wordCount").textContent = words(text) + " words";
  $("#docCount").textContent = docHits(text) + " docs used";
}

function showResults() {
  const result = score();
  state.result = result;
  const pct = Math.round(result.score / result.max * 100);
  const met = result.checks.filter((check) => check.pass).map((check) => check.label);
  const miss = result.checks.filter((check) => !check.pass);
  const next = miss[0];
  $("#scoreBadge").textContent = result.score + "/" + result.max;
  $("#resultTitle").textContent = state.task.title + " position";
  $("#resultSummary").textContent = "Practice estimate: " + pct + "%. " + result.features.docs + " document references found and " + result.features.wc + " words written. This shows where the response sits on the guide.";
  renderRubric($("#rubricResults"), state.task, result);
  $("#coachComment").innerHTML =
    '<strong>Next improvement</strong><br>' +
    M.esc(next ? next.note : "This response is at the top of this practice guide. Try a fresh task or full exam.") +
    '<br><br><strong>Already on the guide</strong><br>' +
    M.esc(met.length ? met.join(" • ") : "No clear rubric moves located yet.");
  const profile = M.courseProfile(state.course);
  const weak = result.checks.filter((check) => !check.pass).map((check) => check.label);
  $("#nextActions").innerHTML = M.nextActions(profile, { accuracy: pct, weakSkills: weak.map((label) => ({ id: label.toLowerCase(), label, rate: 0 })) }).map((action) =>
    '<a class="action-card" href="' + M.esc(courseHref(action.href)) + '"><span class="tag">Next</span><strong>' + M.esc(action.title) + '</strong><span>' + M.esc(action.body) + '</span><span class="btn primary">Start</span></a>'
  ).join("");
  M.recordSession("writing", {
    gameId: "writing-coach",
    title: "Writing Coach",
    course: state.course,
    score: result.score,
    accuracy: pct,
    weakTopics: weak,
    studyTargets: weak.length ? weak : ["Writing"]
  });
  show("resultsScreen");
}

async function boot() {
  const params = new URLSearchParams(location.search);
  const requested = params.get("course");
  if (requested) {
    const found = M.COURSES.find((course) => course.id === requested || course.label === requested || M.slug(course.short) === requested);
    if (found && /Global|U\.S\./.test(found.label)) $("#courseSelect").value = found.label;
  }
  state.data = await M.loadArcadeData("../../");
  fillTasks();
  $("#courseSelect").addEventListener("change", fillTasks);
  $("#taskSelect").addEventListener("change", renderTaskMetrics);
  $("#startBtn").addEventListener("click", start);
  $("#newTaskBtn").addEventListener("click", () => show("setupScreen"));
  $("#scoreBtn").addEventListener("click", showResults);
  $("#responseText").addEventListener("input", updateCounts);
  $("#reviseBtn").addEventListener("click", () => show("writeScreen"));
  $("#anotherBtn").addEventListener("click", () => show("setupScreen"));
}

boot().catch((error) => {
  console.error(error);
  $("#taskMetrics").innerHTML = emptyCard("warning", "Could not load writing bank", "Refresh the page to try again.");
});
