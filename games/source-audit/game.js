const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;
const SOURCE_PATTERN = /(\bthis\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter)\b|\bthese\s+(documents|maps|cartoons|graphs|charts|photographs|photos|sources|timelines|images|posters|newspapers|tables|statements|conditions|changes|figures)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthe\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b)/i;
const JAN_2026 = "Jan 2026";
const COURSES = ["Grade 10 Global History II", "Grade 11 U.S. History"];
const state = { bank: null, records: [], course: "all", status: "all", query: "" };
const $ = (selector) => document.querySelector(selector);

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function images(question) {
  return SourceBank ? SourceBank.stimulusImages(question) : (question.stimulusImages || []).filter((image) => image && image.src);
}

function quarantined(question) {
  return SourceBank ? SourceBank.isQuarantined(question) : /^quarantined/i.test(String(question.sourceIntegrity || ""));
}

function sourceDependent(question) {
  return SourceBank ? SourceBank.sourceBased(question) : (question.stimulusRequired || SOURCE_PATTERN.test(question.stem || ""));
}

function officialQuestionNumber(question) {
  if (Number.isFinite(Number(question.officialQuestionNumber))) return Number(question.officialQuestionNumber);
  const sourceMatch = String(question.source || "").match(/Q(?:uestion)?\s*(\d{1,2})\b/i);
  if (sourceMatch) return Number(sourceMatch[1]);
  if (String(question.source || "").includes(JAN_2026) && Number.isFinite(Number(question.number))) return Number(question.number);
  return null;
}

function imageCourseMismatch(question) {
  if (SourceBank) return images(question).length > 0 && !SourceBank.courseMatchesStimulus(question);
  const qImages = images(question);
  if (/U\.S\. History/.test(question.course || "")) return qImages.some((image) => !/\/us-day/i.test(image.src));
  if (/Global History/.test(question.course || "")) return qImages.some((image) => !/\/global-day/i.test(image.src));
  return false;
}

function sourceKey(question) {
  return [question.course || "", question.source || "", question.id || ""].join("|");
}

function duplicateImageMap(questions) {
  const users = new Map();
  questions.forEach((question) => {
    if (quarantined(question)) return;
    images(question).forEach((image) => {
      if (!users.has(image.src)) users.set(image.src, []);
      users.get(image.src).push(question);
    });
  });
  const duplicated = new Map();
  users.forEach((items, src) => {
    if (new Set(items.map(sourceKey)).size > 1) duplicated.set(src, items);
  });
  return duplicated;
}

function recordFor(question, duplicated) {
  const qImages = images(question);
  const isQuarantined = quarantined(question);
  const missing = !isQuarantined && sourceDependent(question) && !qImages.length;
  const mismatch = !isQuarantined && imageCourseMismatch(question);
  const reused = !isQuarantined && qImages.some((image) => duplicated.has(image.src));
  const official = !isQuarantined && String(question.source || "").includes(JAN_2026) && qImages.length > 0;
  let status = "trusted";
  if (isQuarantined) status = "quarantined";
  else if (missing) status = "missing";
  else if (mismatch) status = "mismatch";
  else if (reused) status = "reused";
  else if (official) status = "official";
  return {
    question,
    images: qImages,
    status,
    issue: ["missing", "mismatch", "reused", "quarantined"].includes(status),
    official,
    qnum: officialQuestionNumber(question),
    duplicateUsers: qImages.flatMap((image) => duplicated.get(image.src) || [])
  };
}

function buildRecords(bank) {
  const questions = bank.questions || [];
  const duplicated = duplicateImageMap(questions);
  return questions.map((question) => recordFor(question, duplicated));
}

function count(records, predicate) {
  return records.filter(predicate).length;
}

function janCoverage(course) {
  const nums = new Set(
    state.records
      .filter((record) => record.question.course === course && record.official && !record.issue)
      .map((record) => record.qnum)
      .filter((num) => num >= 1 && num <= 28)
  );
  return nums.size;
}

function renderMetrics() {
  const records = state.records;
  const trusted = count(records, (record) => !record.issue && record.images.length);
  const issueCount = count(records, (record) => record.issue);
  const quarantinedCount = count(records, (record) => record.status === "quarantined");
  const officialCount = count(records, (record) => record.official && !record.issue);
  $("#metrics").innerHTML = [
    [trusted, "image-backed practice records", ""],
    [officialCount, "Jan. 2026 practice records", ""],
    [quarantinedCount, "records not in practice", quarantinedCount ? "warn" : ""],
    [issueCount, "records needing review", issueCount ? "warn" : ""]
  ].map(([value, label, klass]) => '<article class="metric ' + klass + '"><strong>' + esc(value) + '</strong><span>' + esc(label) + '</span></article>').join("");
}

function renderCoverage() {
  $("#coverageGrid").innerHTML = COURSES.map((course) => {
    const have = janCoverage(course);
    const ok = have === 28;
    const label = course.replace("Grade 10 ", "").replace("Grade 11 ", "");
    return '<article class="coverage-card ' + (ok ? "ok" : "warn") + '">' +
      '<strong>' + have + '/28</strong>' +
      '<span>' + esc(label) + ' January 2026 MCQ coverage</span>' +
    '</article>';
  }).join("");
}

function fillCourses() {
  const courses = [...new Set(state.records.map((record) => record.question.course).filter(Boolean))].sort();
  $("#courseFilter").innerHTML = '<option value="all">All Courses</option>' + courses.map((course) => '<option value="' + esc(course) + '">' + esc(course) + '</option>').join("");
}

function statusMatches(record) {
  if (state.status === "all") return true;
  if (state.status === "issue") return record.issue;
  if (state.status === "trusted") return !record.issue && record.images.length;
  if (state.status === "official") return record.official && !record.issue;
  return record.status === state.status;
}

function searchable(record) {
  const q = record.question;
  return [q.id, q.course, q.subject, q.day, q.set, q.source, q.stem, q.sourceIntegrity, ...(q.tags || [])].join(" ").toLowerCase();
}

function filteredRecords() {
  const query = state.query.trim().toLowerCase();
  return state.records.filter((record) => {
    if (state.course !== "all" && record.question.course !== state.course) return false;
    if (!statusMatches(record)) return false;
    if (query && !searchable(record).includes(query)) return false;
    return true;
  }).sort((a, b) => {
    if (a.issue !== b.issue) return a.issue ? -1 : 1;
    if (a.question.course !== b.question.course) return String(a.question.course).localeCompare(String(b.question.course));
    return String(a.question.source || a.question.id).localeCompare(String(b.question.source || b.question.id), undefined, { numeric: true });
  });
}

function statusLabel(record) {
  if (record.status === "official") return "Official Jan. 2026";
  if (record.status === "trusted") return "Trusted";
  if (record.status === "missing") return "Missing Image";
  if (record.status === "mismatch") return "Course Mismatch";
  if (record.status === "reused") return "Reused Image";
  return "Quarantined";
}

function thumb(record) {
  const image = record.images[0];
  if (!image) return '<div class="thumb"><span>No stimulus image</span></div>';
  return '<a class="thumb" href="' + esc(image.src) + '" target="_blank" rel="noopener"><img src="' + esc(image.src) + '" alt="' + esc(image.label || "Source stimulus") + '" loading="lazy"></a>';
}

function renderRecord(record) {
  const q = record.question;
  const issueLine = record.status === "reused"
    ? "Also assigned to: " + [...new Set(record.duplicateUsers.map((item) => item.id).filter((id) => id !== q.id))].slice(0, 4).join(", ")
    : (q.sourceIssue || q.sourceIntegrity || "");
  const meta = [q.course, q.set || q.day, q.source].filter(Boolean);
  const path = record.images.map((image) => image.src).join(" | ") || "No exposed stimulus image path";
  return '<article class="audit-card">' +
    thumb(record) +
    '<div class="audit-main">' +
      '<h3>' + esc(q.stem || q.id) + '</h3>' +
      '<p>' + esc((q.explanation || "").replace(/^Correct answer:\s*/i, "Answer: ")) + '</p>' +
      '<div class="audit-meta">' + meta.map((item) => '<span class="pill">' + esc(item) + '</span>').join("") + '</div>' +
    '</div>' +
    '<aside class="audit-side">' +
      '<span class="status ' + esc(record.status) + '">' + esc(statusLabel(record)) + '</span>' +
      '<span class="status-label">Source path</span>' +
      '<span class="path">' + esc(path) + '</span>' +
      (issueLine ? '<span class="path">' + esc(issueLine) + '</span>' : '') +
    '</aside>' +
  '</article>';
}

function renderList() {
  const records = filteredRecords();
  $("#resultCount").textContent = records.length + " records";
  $("#resultTitle").textContent = state.status === "issue" ? "Records Needing Review" : "Source Records";
  $("#auditList").innerHTML = records.length
    ? records.slice(0, 240).map(renderRecord).join("") + (records.length > 240 ? '<div class="empty">Showing first 240 records. Narrow the filters or export CSV for the full audit.</div>' : "")
    : '<div class="empty">No source records match these filters.</div>';
}

function render() {
  renderMetrics();
  renderCoverage();
  renderList();
}

function csvValue(value) {
  return '"' + String(value ?? "").replaceAll('"', '""') + '"';
}

function exportCsv() {
  const rows = [["id", "course", "status", "source", "set", "stem", "image_paths", "source_integrity"]];
  filteredRecords().forEach((record) => {
    const q = record.question;
    rows.push([q.id, q.course, statusLabel(record), q.source, q.set || q.day, q.stem, record.images.map((image) => image.src).join(" | "), q.sourceIntegrity || ""]);
  });
  const blob = new Blob([rows.map((row) => row.map(csvValue).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mr-macs-regents-source-audit.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function boot() {
  const response = await fetch("../../data/regents-gauntlet-bank.json");
  if (!response.ok) throw new Error("Could not load Regents source bank");
  state.bank = await response.json();
  state.records = buildRecords(state.bank);
  fillCourses();
  $("#courseFilter").addEventListener("change", (event) => { state.course = event.target.value; renderList(); renderCoverage(); });
  $("#statusFilter").addEventListener("change", (event) => { state.status = event.target.value; renderList(); });
  $("#searchBox").addEventListener("input", (event) => { state.query = event.target.value; renderList(); });
  $("#showIssuesBtn").addEventListener("click", () => {
    state.status = "issue";
    $("#statusFilter").value = "issue";
    renderList();
    document.querySelector(".panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#exportBtn").addEventListener("click", exportCsv);
  render();
}

boot().catch((error) => {
  console.error(error);
  $("#metrics").innerHTML = '<article class="metric warn"><strong>Error</strong><span>Could not load the Regents source bank.</span></article>';
});
