#!/usr/bin/env node
/**
 * Generate standards-aligned all-subject review content.
 *
 * Outputs:
 *   - data/all-subject-course-taxonomy.json
 *   - data/released-assessment-source-catalog.json
 *   - data/generated-all-subject-jeopardy-blueprints.json
 *   - data/generated-practice-exam-blueprints.json
 *   - data/bank-fragments/all-subject-*.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const FRAG_DIR = path.join(DATA_DIR, "bank-fragments");
const VERSION = "20260515-all-subjects-v1";

const NYSED_SOURCES = {
  standardsAreas: {
    id: "nysed-p12-standards-content-areas",
    label: "NYS P-12 Learning Standards by Content Area",
    url: "https://www.nysed.gov/standards-instruction/nys-p-12-learning-standards-content-area"
  },
  grades38: {
    id: "nysed-grades-3-8-released-tests",
    label: "NYSED Past Grades 3-8 Tests",
    url: "https://www.nysed.gov/state-assessment/past-grades-3-8-tests"
  },
  algebraOne: { id: "nysed-regents-algebra-i", label: "Regents Examination in Algebra I", url: "https://www.nysedregents.org/algebraone/" },
  geometry: { id: "nysed-regents-geometry", label: "Regents Examination in Geometry", url: "https://www.nysedregents.org/geometry/" },
  algebraTwo: { id: "nysed-regents-algebra-ii", label: "Regents Examination in Algebra II", url: "https://www.nysedregents.org/algebratwo/" },
  ela: { id: "nysed-regents-ela", label: "Regents Examination in English Language Arts", url: "https://www.nysedregents.org/hsela/" },
  livingEnvironment: { id: "nysed-regents-living-environment", label: "Regents Examination in Living Environment", url: "https://www.nysedregents.org/LivingEnvironment/" },
  earthScience: { id: "nysed-regents-earth-science", label: "Regents Examination in Physical Setting/Earth Science", url: "https://www.nysedregents.org/EarthScience/" },
  chemistry: { id: "nysed-regents-chemistry", label: "Regents Examination in Physical Setting/Chemistry", url: "https://www.nysedregents.org/chemistry/" },
  physics: { id: "nysed-regents-physics", label: "Regents Examination in Physical Setting/Physics", url: "https://www.nysedregents.org/physics/" },
  globalHistory: { id: "nysed-regents-global-history-ii", label: "Regents Examination in Global History and Geography II", url: "https://www.nysedregents.org/ghg2/" },
  usHistory: { id: "nysed-regents-us-history-government", label: "Regents Examination in United States History and Government", url: "https://www.nysedregents.org/ushg/" },
  personalFinance: { id: "nysed-personal-finance", label: "NYSED Personal Finance Education", url: "https://www.nysed.gov/standards-instruction/personal-finance-education" },
  apCentral: { id: "college-board-ap-courses", label: "College Board AP Courses and Exams", url: "https://apcentral.collegeboard.org/courses" }
};

const SUBJECT_SOURCE = {
  ELA: "nysed-p12-standards-content-areas",
  Mathematics: "nysed-p12-standards-content-areas",
  Science: "nysed-p12-standards-content-areas",
  "Social Studies": "nysed-p12-standards-content-areas",
  Arts: "nysed-p12-standards-content-areas",
  "Computer Science and Digital Fluency": "nysed-p12-standards-content-areas",
  "World Languages": "nysed-p12-standards-content-areas",
  Health: "nysed-p12-standards-content-areas",
  "Physical Education": "nysed-p12-standards-content-areas",
  CDOS: "nysed-p12-standards-content-areas",
  "Family and Consumer Sciences": "nysed-p12-standards-content-areas",
  "Technology Education": "nysed-p12-standards-content-areas",
  "Personal Finance": "nysed-personal-finance",
  AP: "college-board-ap-courses"
};

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function unit(title, concepts, skills, standardRefs = []) {
  return { title, concepts, skills, standardRefs };
}

function makeCourse({ id, label, subjectArea, gradeBand, standardsFramework, standardsSourceId, assessmentSourceIds = [], units, ap = false, nys = true, minQuestions }) {
  return {
    id,
    label,
    subjectArea,
    gradeBand,
    standardsFramework,
    standardsSourceId: standardsSourceId || (ap ? "college-board-ap-courses" : SUBJECT_SOURCE[subjectArea] || "nysed-p12-standards-content-areas"),
    assessmentSourceIds,
    ap,
    nys,
    minQuestions: minQuestions || (ap ? 60 : 40),
    units
  };
}

const ELA_UNITS = [
  unit("Reading Literature", ["theme", "character development", "setting", "point of view", "figurative language"], ["cite textual evidence", "infer theme", "analyze craft"], ["NYS ELA Reading Literature"]),
  unit("Reading Informational Text", ["central idea", "supporting detail", "text structure", "author purpose", "claim"], ["summarize", "trace argument", "evaluate evidence"], ["NYS ELA Reading Informational Text"]),
  unit("Vocabulary and Language", ["context clues", "connotation", "domain vocabulary", "syntax", "tone"], ["determine meaning", "analyze word choice", "revise language"], ["NYS ELA Language"]),
  unit("Writing Arguments", ["claim", "counterclaim", "evidence", "reasoning", "audience"], ["write a claim", "organize evidence", "address counterclaims"], ["NYS ELA Writing"]),
  unit("Writing Informative Text", ["topic development", "transitions", "precise language", "source integration", "conclusion"], ["explain clearly", "integrate sources", "revise for clarity"], ["NYS ELA Writing"]),
  unit("Speaking and Listening", ["discussion norms", "presentation", "active listening", "collaboration", "media"], ["build on ideas", "present evidence", "evaluate media"], ["NYS ELA Speaking and Listening"]),
  unit("Research and Sources", ["credible source", "paraphrase", "quotation", "citation", "synthesis"], ["assess credibility", "avoid plagiarism", "synthesize sources"], ["NYS ELA Research"]),
  unit("Test Reading Strategy", ["main idea", "evidence choice", "inference", "author craft", "paired passages"], ["eliminate distractors", "return to text", "compare passages"], ["NYSED released ELA items"])
];

const MATH_UNITS = [
  unit("Number Systems", ["place value", "rational number", "integer operation", "exponent", "scientific notation"], ["compute accurately", "use structure", "check reasonableness"], ["NYS Next Generation Mathematics Number Systems"]),
  unit("Ratios and Proportions", ["ratio", "unit rate", "percent", "scale factor", "proportional relationship"], ["model rates", "solve proportions", "interpret percent"], ["NYS Next Generation Mathematics Ratios and Proportions"]),
  unit("Expressions and Equations", ["variable", "equation", "inequality", "equivalent expression", "solution"], ["write equations", "solve equations", "justify steps"], ["NYS Next Generation Mathematics Expressions and Equations"]),
  unit("Functions", ["input", "output", "linear function", "rate of change", "intercept"], ["represent functions", "compare models", "interpret graphs"], ["NYS Next Generation Mathematics Functions"]),
  unit("Geometry", ["angle", "area", "volume", "similarity", "Pythagorean relationship"], ["use formulas", "reason with shapes", "prove relationships"], ["NYS Next Generation Mathematics Geometry"]),
  unit("Statistics and Probability", ["data distribution", "mean", "median", "variability", "probability"], ["summarize data", "compare samples", "model chance"], ["NYS Next Generation Mathematics Statistics"]),
  unit("Modeling", ["mathematical model", "constraint", "approximation", "graph", "context"], ["choose a model", "interpret parameters", "critique answers"], ["NYS Next Generation Mathematics Modeling"]),
  unit("State Test Strategy", ["multiple representation", "constructed response", "error analysis", "estimation", "answer reasonableness"], ["show work", "defend reasoning", "use diagrams"], ["NYSED released Mathematics items"])
];

const SCIENCE_UNITS = [
  unit("Matter and Its Interactions", ["atom", "molecule", "chemical reaction", "conservation of matter", "property"], ["model particles", "compare substances", "explain reactions"], ["NYS P-12 Science Learning Standards Physical Sciences"]),
  unit("Energy", ["energy transfer", "kinetic energy", "potential energy", "heat", "system"], ["trace energy", "interpret data", "predict changes"], ["NYS P-12 Science Learning Standards Energy"]),
  unit("Forces and Motion", ["force", "motion", "Newton's laws", "field", "acceleration"], ["analyze motion", "use evidence", "model forces"], ["NYS P-12 Science Learning Standards Forces"]),
  unit("Life Science", ["cell", "ecosystem", "inheritance", "adaptation", "homeostasis"], ["explain systems", "analyze traits", "model interactions"], ["NYS P-12 Science Learning Standards Life Sciences"]),
  unit("Earth and Space Systems", ["weathering", "climate", "plate tectonics", "solar system", "water cycle"], ["read maps", "interpret models", "connect systems"], ["NYS P-12 Science Learning Standards Earth and Space"]),
  unit("Engineering Design", ["criteria", "constraint", "prototype", "optimization", "trade-off"], ["define problems", "test solutions", "revise designs"], ["NYS P-12 Science Learning Standards Engineering Design"]),
  unit("Science Practices", ["claim", "evidence", "reasoning", "variable", "data table"], ["plan investigations", "evaluate data", "argue from evidence"], ["NYS P-12 Science and Engineering Practices"]),
  unit("Released Test Strategy", ["stimulus", "graph", "data pattern", "lab setup", "scientific explanation"], ["read diagrams", "use units", "match evidence"], ["NYSED released Science items"])
];

const SOCIAL_UNITS = [
  unit("Geography and Human Systems", ["region", "migration", "environment", "settlement", "resources"], ["read maps", "explain movement", "connect place and culture"], ["NYS Social Studies Framework Geography"]),
  unit("Government and Civics", ["citizenship", "rights", "power", "law", "representation"], ["explain institutions", "analyze rights", "evaluate civic action"], ["NYS Social Studies Framework Civics"]),
  unit("Economics", ["scarcity", "trade-off", "market", "incentive", "interdependence"], ["reason economically", "use data", "explain choices"], ["NYS Social Studies Framework Economics"]),
  unit("Historical Thinking", ["chronology", "cause and effect", "turning point", "continuity", "change"], ["source evidence", "contextualize", "compare periods"], ["NYS Social Studies Practices"]),
  unit("Culture and Belief", ["belief system", "culture", "diffusion", "identity", "tradition"], ["compare cultures", "explain diffusion", "use evidence"], ["NYS Social Studies Framework History"]),
  unit("Power and Conflict", ["empire", "revolution", "reform", "war", "human rights"], ["analyze causes", "evaluate impacts", "connect evidence"], ["NYS Social Studies Framework History"]),
  unit("Source Analysis", ["primary source", "point of view", "purpose", "audience", "bias"], ["sourcing", "corroborate", "interpret documents"], ["NYS Social Studies Practices"]),
  unit("Regents or State Test Strategy", ["stimulus question", "document set", "constructed response", "civic literacy", "enduring issue"], ["cite documents", "write claims", "explain relationships"], ["NYSED released Social Studies exams"])
];

const ARTS_UNITS = [
  unit("Create", ["process", "craft", "composition", "improvisation", "revision"], ["generate ideas", "refine work", "make artistic choices"], ["NYS Arts Creating"]),
  unit("Perform or Present", ["technique", "expressive quality", "ensemble", "curation", "audience"], ["prepare work", "present clearly", "respond to feedback"], ["NYS Arts Performing/Presenting"]),
  unit("Respond", ["interpretation", "evidence", "style", "mood", "form"], ["describe artwork", "support interpretation", "analyze choices"], ["NYS Arts Responding"]),
  unit("Connect", ["culture", "history", "community", "identity", "purpose"], ["connect art to context", "compare traditions", "reflect on meaning"], ["NYS Arts Connecting"]),
  unit("Media and Design", ["visual hierarchy", "sequence", "contrast", "sound", "movement"], ["design intentionally", "edit media", "evaluate impact"], ["NYS Arts Media Arts"]),
  unit("Critique", ["criteria", "revision", "intent", "audience", "evidence"], ["give feedback", "revise work", "justify choices"], ["NYS Arts Responding"]),
  unit("Safety and Studio Habits", ["materials", "practice routine", "collaboration", "care", "responsibility"], ["use tools safely", "practice deliberately", "collaborate"], ["NYS Arts Practice"]),
  unit("Portfolio Reflection", ["artist statement", "sustained investigation", "selected work", "growth", "revision"], ["explain process", "select evidence", "reflect on growth"], ["NYS Arts Portfolio"])
];

const WORLD_LANGUAGE_UNITS = [
  unit("Interpersonal Communication", ["conversation", "question", "response", "clarification", "register"], ["exchange information", "ask follow-ups", "negotiate meaning"], ["NYS World Languages Interpretive/Interpersonal/Presentational"]),
  unit("Interpretive Listening and Reading", ["main idea", "detail", "context clue", "authentic text", "inference"], ["understand messages", "infer meaning", "use context"], ["NYS World Languages Interpretive"]),
  unit("Presentational Speaking and Writing", ["audience", "purpose", "organized message", "cultural product", "accuracy"], ["present information", "write for audience", "revise language"], ["NYS World Languages Presentational"]),
  unit("Culture", ["practice", "product", "perspective", "community", "comparison"], ["explain culture", "compare perspectives", "avoid stereotypes"], ["NYS World Languages Cultures"]),
  unit("Vocabulary in Context", ["cognate", "phrase", "circumlocution", "theme", "idiom"], ["use vocabulary", "work around gaps", "recognize cognates"], ["NYS World Languages Communication"]),
  unit("Grammar for Meaning", ["tense", "agreement", "word order", "question form", "connector"], ["communicate meaning", "notice patterns", "edit for clarity"], ["NYS World Languages Language Structures"]),
  unit("Community Connections", ["real-world task", "travel", "service", "media", "global issue"], ["use language beyond class", "interpret authentic media", "connect communities"], ["NYS World Languages Connections"]),
  unit("Checkpoint Strategy", ["proficiency", "task completion", "comprehensibility", "elaboration", "accuracy"], ["complete tasks", "sustain communication", "support ideas"], ["NYS World Languages Checkpoint"])
];

const HEALTH_PE_UNITS = [
  unit("Personal Health and Wellness", ["wellness", "nutrition", "sleep", "stress", "decision"], ["analyze choices", "set goals", "use reliable information"], ["NYS Health Education"]),
  unit("Mental and Emotional Health", ["coping strategy", "support system", "resilience", "empathy", "self-management"], ["identify supports", "manage stress", "communicate needs"], ["NYS Health Education"]),
  unit("Safety and Injury Prevention", ["risk", "prevention", "first aid", "emergency", "boundary"], ["reduce risk", "respond safely", "make plans"], ["NYS Health Education"]),
  unit("Relationships and Communication", ["respect", "consent", "assertive communication", "conflict resolution", "advocacy"], ["communicate clearly", "resolve conflict", "seek help"], ["NYS Health Education"]),
  unit("Movement Skills", ["balance", "coordination", "strategy", "fitness component", "practice"], ["perform skills", "use feedback", "improve movement"], ["NYS Physical Education"]),
  unit("Fitness Planning", ["cardiorespiratory endurance", "strength", "flexibility", "intensity", "recovery"], ["plan activity", "monitor effort", "set goals"], ["NYS Physical Education"]),
  unit("Teamwork and Fair Play", ["sportsmanship", "role", "strategy", "cooperation", "safety"], ["work with others", "use rules", "show respect"], ["NYS Physical Education"]),
  unit("Health Literacy", ["credible source", "advocacy", "community resource", "prevention", "decision-making model"], ["evaluate claims", "advocate for health", "choose resources"], ["NYS Health Education"])
];

const CS_TECH_UNITS = [
  unit("Computing Systems", ["hardware", "software", "input", "output", "troubleshooting"], ["identify systems", "diagnose problems", "use tools"], ["NYS Computer Science and Digital Fluency Computing Systems"]),
  unit("Networks and the Internet", ["network", "protocol", "IP address", "cybersecurity", "encryption"], ["explain networks", "protect data", "recognize risks"], ["NYS Computer Science and Digital Fluency Networks"]),
  unit("Data and Analysis", ["data set", "pattern", "visualization", "bias", "privacy"], ["collect data", "interpret charts", "question bias"], ["NYS Computer Science and Digital Fluency Data"]),
  unit("Algorithms and Programming", ["algorithm", "loop", "condition", "variable", "debugging"], ["write steps", "trace code", "debug errors"], ["NYS Computer Science and Digital Fluency Algorithms"]),
  unit("Impacts of Computing", ["digital footprint", "accessibility", "ethics", "automation", "equity"], ["evaluate impacts", "design inclusively", "protect privacy"], ["NYS Computer Science and Digital Fluency Impacts"]),
  unit("Engineering and Design", ["design process", "prototype", "constraint", "testing", "iteration"], ["define problems", "build prototypes", "revise designs"], ["NYS Technology Education"]),
  unit("Career Readiness", ["workplace skill", "communication", "credential", "pathway", "professionalism"], ["plan careers", "use feedback", "collaborate"], ["NYS CDOS"]),
  unit("Media Literacy", ["source credibility", "algorithmic feed", "misinformation", "copyright", "remix"], ["verify sources", "identify bias", "credit media"], ["NYS Digital Fluency"])
];

const FINANCE_FACS_UNITS = [
  unit("Budgeting", ["income", "expense", "saving", "needs", "wants"], ["make a budget", "track spending", "prioritize choices"], ["NYS Personal Finance"]),
  unit("Credit and Debt", ["credit score", "interest", "loan", "minimum payment", "debt"], ["compare credit", "calculate cost", "avoid traps"], ["NYS Personal Finance"]),
  unit("Saving and Investing", ["compound interest", "risk", "diversification", "retirement", "inflation"], ["compare options", "explain risk", "plan long-term"], ["NYS Personal Finance"]),
  unit("Consumer Skills", ["warranty", "unit price", "contract", "fraud", "consumer protection"], ["read contracts", "compare prices", "avoid scams"], ["NYS Family and Consumer Sciences"]),
  unit("Career and Income", ["career pathway", "tax", "benefit", "pay stub", "human capital"], ["interpret pay", "evaluate jobs", "plan training"], ["NYS CDOS"]),
  unit("Food and Nutrition", ["meal planning", "food safety", "nutrient", "label", "culture"], ["plan meals", "read labels", "prepare safely"], ["NYS Family and Consumer Sciences"]),
  unit("Family and Community", ["relationship skill", "caregiving", "resource management", "community", "responsibility"], ["solve problems", "manage resources", "communicate"], ["NYS Family and Consumer Sciences"]),
  unit("Financial Decision-Making", ["opportunity cost", "goal", "trade-off", "insurance", "emergency fund"], ["weigh trade-offs", "set goals", "manage risk"], ["NYS Personal Finance"])
];

function withGrade(units, gradeLabel) {
  return units.map((u) => ({
    ...u,
    title: `${gradeLabel}: ${u.title}`,
    concepts: u.concepts.map((concept) => `${concept}`),
    skills: u.skills.slice()
  }));
}

const courses = [];

for (const grade of [5, 6, 7, 8]) {
  courses.push(makeCourse({
    id: `ela-${grade}`,
    label: `Grade ${grade} ELA`,
    subjectArea: "ELA",
    gradeBand: `Grade ${grade}`,
    standardsFramework: "New York State Next Generation English Language Arts Learning Standards",
    assessmentSourceIds: ["nysed-grades-3-8-released-tests"],
    units: withGrade(ELA_UNITS, `Grade ${grade}`)
  }));
  courses.push(makeCourse({
    id: `math-${grade}`,
    label: `Grade ${grade} Mathematics`,
    subjectArea: "Mathematics",
    gradeBand: `Grade ${grade}`,
    standardsFramework: "New York State Next Generation Mathematics Learning Standards",
    assessmentSourceIds: ["nysed-grades-3-8-released-tests"],
    units: withGrade(MATH_UNITS, `Grade ${grade}`)
  }));
  courses.push(makeCourse({
    id: `science-${grade}`,
    label: `Grade ${grade} Science`,
    subjectArea: "Science",
    gradeBand: `Grade ${grade}`,
    standardsFramework: "New York State P-12 Science Learning Standards",
    assessmentSourceIds: grade === 5 || grade === 8 ? ["nysed-grades-3-8-released-tests"] : [],
    units: withGrade(SCIENCE_UNITS, `Grade ${grade}`)
  }));
}

for (const grade of [9, 10, 11, 12]) {
  courses.push(makeCourse({
    id: `english-${grade}`,
    label: `English ${grade}`,
    subjectArea: "ELA",
    gradeBand: `Grade ${grade}`,
    standardsFramework: "New York State Next Generation English Language Arts Learning Standards",
    assessmentSourceIds: grade === 11 ? ["nysed-regents-ela"] : [],
    units: withGrade(ELA_UNITS, `English ${grade}`)
  }));
}

[
  ["algebra-1", "Algebra I", ["nysed-regents-algebra-i"]],
  ["geometry", "Geometry", ["nysed-regents-geometry"]],
  ["algebra-2", "Algebra II", ["nysed-regents-algebra-ii"]],
  ["precalculus", "Precalculus", []],
  ["statistics", "Statistics and Data Science", []],
  ["calculus", "Calculus", []]
].forEach(([id, label, assessmentSourceIds]) => courses.push(makeCourse({
  id,
  label,
  subjectArea: "Mathematics",
  gradeBand: "High School",
  standardsFramework: "New York State Next Generation Mathematics Learning Standards",
  assessmentSourceIds,
  units: withGrade(MATH_UNITS, label)
})));

[
  ["earth-science", "Earth and Space Sciences", ["nysed-regents-earth-science"]],
  ["biology", "Life Science: Biology", ["nysed-regents-living-environment"]],
  ["chemistry", "Chemistry", ["nysed-regents-chemistry"]],
  ["physics", "Physics", ["nysed-regents-physics"]],
  ["environmental-science", "Environmental Science", []]
].forEach(([id, label, assessmentSourceIds]) => courses.push(makeCourse({
  id,
  label,
  subjectArea: "Science",
  gradeBand: "High School",
  standardsFramework: "New York State P-12 Science Learning Standards",
  assessmentSourceIds,
  units: withGrade(SCIENCE_UNITS, label)
})));

[
  ["visual-arts-5-8", "Middle School Visual Arts", ARTS_UNITS],
  ["music-5-8", "Middle School Music", ARTS_UNITS],
  ["visual-arts", "High School Visual Arts", ARTS_UNITS],
  ["music", "High School Music", ARTS_UNITS],
  ["theater", "Theater", ARTS_UNITS],
  ["dance", "Dance", ARTS_UNITS],
  ["media-arts", "Media Arts", ARTS_UNITS],
  ["world-languages-checkpoint-a", "World Languages Checkpoint A", WORLD_LANGUAGE_UNITS],
  ["world-languages-checkpoint-b", "World Languages Checkpoint B", WORLD_LANGUAGE_UNITS],
  ["world-languages-checkpoint-c", "World Languages Checkpoint C", WORLD_LANGUAGE_UNITS],
  ["health-5-8", "Middle School Health", HEALTH_PE_UNITS],
  ["health", "High School Health", HEALTH_PE_UNITS],
  ["physical-education-5-8", "Middle School Physical Education", HEALTH_PE_UNITS],
  ["physical-education", "High School Physical Education", HEALTH_PE_UNITS],
  ["computer-science-5-8", "Middle School Computer Science and Digital Fluency", CS_TECH_UNITS],
  ["computer-science", "High School Computer Science and Digital Fluency", CS_TECH_UNITS],
  ["technology-education", "Technology Education", CS_TECH_UNITS],
  ["career-readiness", "Career Development and Occupational Studies", CS_TECH_UNITS],
  ["media-literacy", "Media Literacy and Digital Citizenship", CS_TECH_UNITS],
  ["family-consumer-sciences", "Family and Consumer Sciences", FINANCE_FACS_UNITS],
  ["personal-finance", "Personal Finance", FINANCE_FACS_UNITS]
].forEach(([id, label, units]) => courses.push(makeCourse({
  id,
  label,
  subjectArea: label.includes("World Languages") ? "World Languages" : label.includes("Health") ? "Health" : label.includes("Physical Education") ? "Physical Education" : label.includes("Computer") ? "Computer Science and Digital Fluency" : label.includes("Career") ? "CDOS" : label.includes("Technology") ? "Technology Education" : label.includes("Finance") ? "Personal Finance" : label.includes("Family") ? "Family and Consumer Sciences" : label.includes("Media Literacy") ? "Computer Science and Digital Fluency" : "Arts",
  gradeBand: label.includes("Middle") || label.includes("Checkpoint A") ? "Grades 5-8" : "High School",
  standardsFramework: "New York State P-12 Learning Standards",
  standardsSourceId: SUBJECT_SOURCE[label.includes("World Languages") ? "World Languages" : label.includes("Health") ? "Health" : label.includes("Physical Education") ? "Physical Education" : label.includes("Computer") ? "Computer Science and Digital Fluency" : label.includes("Finance") ? "Personal Finance" : "Arts"],
  units: withGrade(units, label)
})));

const apUnits = {
  "ap-biology": ["Chemistry of Life", "Cell Structure and Function", "Cellular Energetics", "Cell Communication and Cell Cycle", "Heredity", "Gene Expression and Regulation", "Natural Selection", "Ecology"],
  "ap-chemistry": ["Atomic Structure and Properties", "Molecular and Ionic Compound Structure", "Intermolecular Forces and Properties", "Chemical Reactions", "Kinetics", "Thermodynamics", "Equilibrium", "Acids and Bases", "Applications of Thermodynamics"],
  "ap-environmental-science": ["The Living World: Ecosystems", "Biodiversity", "Populations", "Earth Systems and Resources", "Land and Water Use", "Energy Resources and Consumption", "Atmospheric Pollution", "Aquatic and Terrestrial Pollution", "Global Change"],
  "ap-physics-1": ["Kinematics", "Force and Translational Dynamics", "Work, Energy, and Power", "Linear Momentum", "Torque and Rotational Dynamics", "Energy and Momentum of Rotating Systems", "Oscillations", "Fluids"],
  "ap-physics-2": ["Thermodynamics", "Electric Force, Field, and Potential", "Electric Circuits", "Magnetism", "Electromagnetic Induction", "Geometric and Physical Optics", "Quantum, Atomic, and Nuclear Physics"],
  "ap-physics-c-mechanics": ["Kinematics", "Newton's Laws", "Work, Energy, and Power", "Systems of Particles and Linear Momentum", "Rotation", "Oscillations", "Gravitation"],
  "ap-physics-c-electricity-magnetism": ["Electrostatics", "Conductors and Capacitors", "Electric Circuits", "Magnetic Fields", "Electromagnetism"],
  "ap-calculus-ab": ["Limits and Continuity", "Differentiation: Definition and Fundamental Properties", "Differentiation: Composite, Implicit, and Inverse Functions", "Contextual Applications of Differentiation", "Analytical Applications of Differentiation", "Integration and Accumulation of Change", "Differential Equations", "Applications of Integration"],
  "ap-calculus-bc": ["Limits and Continuity", "Differentiation", "Applications of Differentiation", "Integration", "Differential Equations", "Applications of Integration", "Parametric, Polar, and Vector Functions", "Infinite Sequences and Series"],
  "ap-statistics": ["Exploring One-Variable Data", "Exploring Two-Variable Data", "Collecting Data", "Probability, Random Variables, and Probability Distributions", "Sampling Distributions", "Inference for Categorical Data", "Inference for Quantitative Data", "Inference for Slopes"],
  "ap-precalculus": ["Polynomial and Rational Functions", "Exponential and Logarithmic Functions", "Trigonometric and Polar Functions", "Functions Involving Parameters, Vectors, and Matrices"],
  "ap-computer-science-a": ["Primitive Types", "Using Objects", "Boolean Expressions and if Statements", "Iteration", "Writing Classes", "Arrays", "ArrayList", "2D Array", "Inheritance", "Recursion"],
  "ap-computer-science-principles": ["Creative Development", "Data", "Algorithms and Programming", "Computer Systems and Networks", "Impact of Computing"],
  "ap-english-language": ["Rhetorical Situation", "Claims and Evidence", "Reasoning and Organization", "Style", "Synthesis", "Argument", "Rhetorical Analysis"],
  "ap-english-literature": ["Short Fiction", "Poetry", "Longer Fiction or Drama", "Character", "Structure", "Figurative Language", "Literary Argument"],
  "ap-us-history": ["Period 1: 1491-1607", "Period 2: 1607-1754", "Period 3: 1754-1800", "Period 4: 1800-1848", "Period 5: 1844-1877", "Period 6: 1865-1898", "Period 7: 1890-1945", "Period 8: 1945-1980", "Period 9: 1980-Present"],
  "ap-world-history": ["The Global Tapestry", "Networks of Exchange", "Land-Based Empires", "Transoceanic Interconnections", "Revolutions", "Consequences of Industrialization", "Global Conflict", "Cold War and Decolonization", "Globalization"],
  "ap-european-history": ["Renaissance and Exploration", "Age of Reformation", "Absolutism and Constitutionalism", "Scientific, Philosophical, and Political Developments", "Conflict, Crisis, and Reaction", "Industrialization and Its Effects", "19th-Century Perspectives", "20th-Century Global Conflicts", "Cold War and Contemporary Europe"],
  "ap-us-government": ["Foundations of American Democracy", "Interactions Among Branches of Government", "Civil Liberties and Civil Rights", "American Political Ideologies and Beliefs", "Political Participation"],
  "ap-comparative-government": ["Political Systems, Regimes, and Governments", "Political Institutions", "Political Culture and Participation", "Party and Electoral Systems", "Political and Economic Changes and Development"],
  "ap-human-geography": ["Thinking Geographically", "Population and Migration", "Cultural Patterns and Processes", "Political Patterns and Processes", "Agriculture and Rural Land-Use", "Cities and Urban Land-Use", "Industrial and Economic Development"],
  "ap-psychology": ["Biological Bases of Behavior", "Cognition", "Development and Learning", "Social Psychology and Personality", "Mental and Physical Health", "Research Methods"],
  "ap-macroeconomics": ["Basic Economic Concepts", "Economic Indicators and the Business Cycle", "National Income and Price Determination", "Financial Sector", "Long-Run Consequences of Stabilization Policies", "Open Economy"],
  "ap-microeconomics": ["Basic Economic Concepts", "Supply and Demand", "Production, Cost, and Perfect Competition", "Imperfect Competition", "Factor Markets", "Market Failure and Role of Government"],
  "ap-african-american-studies": ["Origins of the African Diaspora", "Freedom, Enslavement, and Resistance", "The Practice of Freedom", "Movements and Debates", "Black Life, Arts, and Culture"],
  "ap-art-history": ["Global Prehistory", "Ancient Mediterranean", "Early Europe and Colonial Americas", "Later Europe and Americas", "Indigenous Americas", "Africa", "West and Central Asia", "South, East, and Southeast Asia", "The Pacific", "Global Contemporary"],
  "ap-music-theory": ["Music Fundamentals", "Harmony and Voice Leading", "Melodic Composition", "Harmonic Progression", "Form and Analysis", "Aural Skills"],
  "ap-2d-art-design": ["Sustained Investigation", "Selected Works", "Design Principles", "Materials and Processes", "Portfolio Reflection"],
  "ap-3d-art-design": ["Sustained Investigation", "Selected Works", "Form and Space", "Materials and Processes", "Portfolio Reflection"],
  "ap-drawing": ["Sustained Investigation", "Selected Works", "Mark Making", "Composition", "Portfolio Reflection"],
  "ap-research": ["Research Question", "Literature Review", "Methodology", "Data and Evidence", "Academic Paper", "Presentation and Oral Defense"],
  "ap-seminar": ["Question and Explore", "Understand and Analyze Argument", "Evaluate Multiple Perspectives", "Synthesize Ideas", "Team Project", "Individual Written Argument"],
  "ap-chinese-language": ["Families and Communities", "Personal and Public Identities", "Beauty and Aesthetics", "Science and Technology", "Contemporary Life", "Global Challenges"],
  "ap-french-language": ["Families and Communities", "Personal and Public Identities", "Beauty and Aesthetics", "Science and Technology", "Contemporary Life", "Global Challenges"],
  "ap-german-language": ["Families and Communities", "Personal and Public Identities", "Beauty and Aesthetics", "Science and Technology", "Contemporary Life", "Global Challenges"],
  "ap-italian-language": ["Families and Communities", "Personal and Public Identities", "Beauty and Aesthetics", "Science and Technology", "Contemporary Life", "Global Challenges"],
  "ap-japanese-language": ["Families and Communities", "Personal and Public Identities", "Beauty and Aesthetics", "Science and Technology", "Contemporary Life", "Global Challenges"],
  "ap-spanish-language": ["Families and Communities", "Personal and Public Identities", "Beauty and Aesthetics", "Science and Technology", "Contemporary Life", "Global Challenges"],
  "ap-spanish-literature": ["Medieval and Golden Age Texts", "19th-Century Literature", "20th-Century Literature", "Contemporary Texts", "Literary Analysis", "Cultural Context"],
  "ap-latin": ["Vergil", "Caesar", "Latin Vocabulary", "Grammar and Syntax", "Roman Culture", "Literary Analysis"],
  "ap-business-personal-finance": ["Business Ownership", "Markets and Consumers", "Accounting and Finance", "Personal Finance", "Entrepreneurship", "Ethics and Regulation"],
  "ap-cybersecurity": ["Security Principles", "Networks", "Threats and Vulnerabilities", "Cryptography", "Risk Management", "Incident Response"]
};

const AP_LABELS = {
  "ap-2d-art-design": "AP 2-D Art and Design",
  "ap-3d-art-design": "AP 3-D Art and Design",
  "ap-drawing": "AP Drawing",
  "ap-art-history": "AP Art History",
  "ap-music-theory": "AP Music Theory",
  "ap-english-language": "AP English Language and Composition",
  "ap-english-literature": "AP English Literature and Composition",
  "ap-african-american-studies": "AP African American Studies",
  "ap-comparative-government": "AP Comparative Government and Politics",
  "ap-european-history": "AP European History",
  "ap-human-geography": "AP Human Geography",
  "ap-macroeconomics": "AP Macroeconomics",
  "ap-microeconomics": "AP Microeconomics",
  "ap-psychology": "AP Psychology",
  "ap-us-government": "AP United States Government and Politics",
  "ap-us-history": "AP United States History",
  "ap-world-history": "AP World History: Modern",
  "ap-calculus-ab": "AP Calculus AB",
  "ap-calculus-bc": "AP Calculus BC",
  "ap-computer-science-a": "AP Computer Science A",
  "ap-computer-science-principles": "AP Computer Science Principles",
  "ap-precalculus": "AP Precalculus",
  "ap-statistics": "AP Statistics",
  "ap-biology": "AP Biology",
  "ap-chemistry": "AP Chemistry",
  "ap-environmental-science": "AP Environmental Science",
  "ap-physics-1": "AP Physics 1: Algebra-Based",
  "ap-physics-2": "AP Physics 2: Algebra-Based",
  "ap-physics-c-electricity-magnetism": "AP Physics C: Electricity and Magnetism",
  "ap-physics-c-mechanics": "AP Physics C: Mechanics",
  "ap-chinese-language": "AP Chinese Language and Culture",
  "ap-french-language": "AP French Language and Culture",
  "ap-german-language": "AP German Language and Culture",
  "ap-italian-language": "AP Italian Language and Culture",
  "ap-japanese-language": "AP Japanese Language and Culture",
  "ap-latin": "AP Latin",
  "ap-spanish-language": "AP Spanish Language and Culture",
  "ap-spanish-literature": "AP Spanish Literature and Culture",
  "ap-research": "AP Research",
  "ap-seminar": "AP Seminar",
  "ap-business-personal-finance": "AP Business with Personal Finance",
  "ap-cybersecurity": "AP Cybersecurity"
};

for (const [id, label] of Object.entries(AP_LABELS)) {
  const titles = apUnits[id] || ["Course Concepts", "Evidence and Skills", "Applications", "Analysis", "Performance Tasks", "Exam Practice"];
  const isLanguage = /language|latin|spanish-literature/.test(id);
  const subjectArea = /art|music|drawing/.test(id) ? "AP Arts" :
    /english|seminar|research|language|latin|spanish-literature/.test(id) ? "AP English and Languages" :
    /biology|chemistry|environmental|physics/.test(id) ? "AP Sciences" :
    /calculus|statistics|precalculus|computer|cybersecurity/.test(id) ? "AP Math and Computer Science" :
    /business|macro|micro/.test(id) ? "AP Economics and Business" : "AP History and Social Sciences";
  courses.push(makeCourse({
    id,
    label,
    subjectArea,
    gradeBand: "AP",
    standardsFramework: "College Board AP Course and Exam Description",
    standardsSourceId: "college-board-ap-courses",
    assessmentSourceIds: ["college-board-ap-courses"],
    ap: true,
    nys: false,
    units: titles.map((title) => unit(title, [
      title,
      isLanguage ? "interpretive communication" : "disciplinary reasoning",
      isLanguage ? "cultural comparison" : "evidence-based explanation",
      isLanguage ? "presentational task" : "model or source analysis",
      isLanguage ? "authentic text" : "exam-style application"
    ], [
      isLanguage ? "interpret authentic sources" : "apply a course concept",
      isLanguage ? "communicate for purpose and audience" : "use evidence accurately",
      isLanguage ? "compare cultural perspectives" : "explain reasoning"
    ], [`AP CED: ${title}`]))
  }));
}

const fillerDistractors = [
  "memorizing an isolated fact without evidence",
  "choosing an answer because it uses familiar words",
  "ignoring the source or data in the prompt",
  "describing a topic without explaining why it matters",
  "using a rule from a different unit",
  "making a claim without supporting evidence"
];

function choiceSet(correct, pool, seed) {
  const choices = [correct];
  let i = seed;
  const uniquePool = uniq(pool.filter((item) => item && item !== correct)).concat(fillerDistractors);
  while (choices.length < 4 && uniquePool.length) {
    choices.push(uniquePool[i % uniquePool.length]);
    i += 3;
  }
  return choices.slice(0, 4).sort((a, b) => slug(a).localeCompare(slug(b)));
}

function standardRefs(course, unitSpec) {
  return uniq([...(unitSpec.standardRefs || []), course.standardsFramework]);
}

function questionTemplates(course, unitSpec, unitIndex, itemIndex, pool, round) {
  const c0 = unitSpec.concepts[0] || unitSpec.title;
  const c1 = unitSpec.concepts[1] || c0;
  const c2 = unitSpec.concepts[2] || c1;
  const skill = unitSpec.skills[itemIndex % unitSpec.skills.length] || "use evidence";
  const refs = standardRefs(course, unitSpec);
  const pass = round > 0 ? ` during mixed review pass ${round + 1}` : "";
  const base = {
    course: course.id,
    courseLabel: course.label,
    topic: unitSpec.title,
    domain: course.subjectArea,
    subjectArea: course.subjectArea,
    gradeBand: course.gradeBand,
    standardRefs: refs,
    sourceAuthority: course.standardsSourceId,
    assessmentSourceId: course.assessmentSourceIds[0] || course.standardsSourceId,
    itemMode: course.assessmentSourceIds.length ? "released-pattern" : "standards-aligned-original"
  };
  const variants = [
    {
      prompt: `In ${course.label}, which concept is most central to the unit "${unitSpec.title}"${pass}?`,
      correctText: c0,
      choices: choiceSet(c0, pool, unitIndex + itemIndex),
      explanation: `${c0} is a core idea in ${unitSpec.title}. The related standard asks students to connect the concept to evidence, process, or application rather than treat it as a loose vocabulary word.`
    },
    {
      prompt: `A student reviewing ${unitSpec.title}${pass} needs to show the skill "${skill}." Which action best fits that skill?`,
      correctText: `Use evidence to explain ${c1}.`,
      choices: choiceSet(`Use evidence to explain ${c1}.`, [`Guess from key words about ${c2}.`, `Repeat the definition of ${c0} only.`, `Ignore the context and pick the longest answer.`, `Use evidence to explain ${c1}.`], unitIndex),
      explanation: `The useful move is to connect evidence to ${c1}; this matches the standards/CED emphasis on reasoning and application.`
    },
    {
      prompt: `Which answer best avoids a common mistake about ${unitSpec.title}${pass}?`,
      correctText: `Connect ${c0} to the prompt context before choosing.`,
      choices: choiceSet(`Connect ${c0} to the prompt context before choosing.`, [`Treat ${c0} as always meaning the same thing.`, `Skip the data or source because the topic is familiar.`, `Choose an unrelated fact from another unit.`, `Connect ${c0} to the prompt context before choosing.`], itemIndex),
      explanation: `Most missed review questions come from using familiar terms without matching them to the exact context.`
    },
    {
      prompt: `In a standards-aligned question about ${unitSpec.title}${pass}, what kind of evidence would be strongest?`,
      correctText: `Specific evidence that proves a claim about ${c2}.`,
      choices: choiceSet(`Specific evidence that proves a claim about ${c2}.`, [`A vague statement that the topic is important.`, `A fact from a different course.`, `A personal opinion without support.`, `Specific evidence that proves a claim about ${c2}.`], itemIndex + 2),
      explanation: `The standards across NYS courses and AP CEDs reward evidence used for a claim, not disconnected recall.`
    },
    {
      prompt: `Which review note would help most for ${course.label}: ${unitSpec.title}${pass}?`,
      correctText: `${c0} matters because it helps explain ${c1}.`,
      choices: choiceSet(`${c0} matters because it helps explain ${c1}.`, [`${c0} appears on tests, so no explanation is needed.`, `${c2} is unrelated to this unit.`, `Only the vocabulary list matters for this unit.`, `${c0} matters because it helps explain ${c1}.`], unitIndex + 4),
      explanation: `Strong review notes pair the concept with why it matters in the unit.`
    },
    {
      prompt: `A released-test-style item asks students to interpret ${unitSpec.title}${pass}. What should they do first?`,
      correctText: `Read the prompt, source, or data for the exact task.`,
      choices: choiceSet(`Read the prompt, source, or data for the exact task.`, [`Pick the first familiar vocabulary word.`, `Answer from memory before reading the stimulus.`, `Eliminate every answer that sounds detailed.`, `Read the prompt, source, or data for the exact task.`], unitIndex + 6),
      explanation: `Released NYS tests and AP items often hinge on the exact task wording, source, graph, or scenario.`
    },
    {
      prompt: `Which classroom explanation would best connect ${unitSpec.title} to the larger course skill${pass}?`,
      correctText: `${c0} is useful when students ${skill}.`,
      choices: choiceSet(`${c0} is useful when students ${skill}.`, [`${c0} only matters for memorized definitions.`, `${c1} should be ignored unless it appears in the title.`, `The standard rewards guessing from familiar words.`, `${c0} is useful when students ${skill}.`], unitIndex + 8),
      explanation: `This answer connects a concept to a skill, which is the central move in standards-aligned review.`
    },
    {
      prompt: `For ${unitSpec.title}${pass}, which response sounds most like a high-quality constructed response?`,
      correctText: `It names ${c0}, cites evidence, and explains the connection.`,
      choices: choiceSet(`It names ${c0}, cites evidence, and explains the connection.`, [`It lists three vocabulary words without a claim.`, `It copies the question without adding evidence.`, `It gives an opinion about the topic only.`, `It names ${c0}, cites evidence, and explains the connection.`], itemIndex + 10),
      explanation: `Constructed responses need a claim, evidence, and explanation, whether the item is NYS, AP, or standards-aligned classroom practice.`
    },
    {
      prompt: `Which review target belongs most directly in ${unitSpec.title}${pass}?`,
      correctText: c2,
      choices: choiceSet(c2, pool, unitIndex + itemIndex + 12),
      explanation: `${c2} is part of the concept cluster for ${unitSpec.title}, so it belongs in this unit rather than in an unrelated review bucket.`
    },
    {
      prompt: `A student wants to transfer ${unitSpec.title} knowledge to a new question${pass}. What is the best strategy?`,
      correctText: `Match the new prompt to ${c0}, then justify the answer with evidence.`,
      choices: choiceSet(`Match the new prompt to ${c0}, then justify the answer with evidence.`, [`Use the exact answer from the last question.`, `Ignore unfamiliar data or wording.`, `Choose the answer with the most academic vocabulary.`, `Match the new prompt to ${c0}, then justify the answer with evidence.`], itemIndex + 14),
      explanation: `Transfer requires recognizing the underlying concept and then adapting it to the new prompt.`
    }
  ];
  return variants[itemIndex % variants.length] ? { ...base, ...variants[itemIndex % variants.length] } : null;
}

function buildQuestions(course) {
  const conceptPool = course.units.flatMap((u) => u.concepts);
  const out = [];
  let item = 0;
  const variantsPerUnit = 10;
  while (out.length < course.minQuestions) {
    const unitIndex = Math.floor(item / variantsPerUnit) % course.units.length;
    const round = Math.floor(item / (variantsPerUnit * course.units.length));
    const unitSpec = course.units[unitIndex];
    const q = questionTemplates(course, unitSpec, unitIndex, item, conceptPool, round);
    out.push({
      id: `${course.id}-${String(out.length + 1).padStart(3, "0")}`,
      ...q
    });
    item += 1;
  }
  return out;
}

function buildJeopardyBoard(course, unitSpec, unitIndex) {
  const categories = [
    ["Core Concepts", unitSpec.concepts],
    ["Skills", unitSpec.skills],
    ["Evidence", ["source evidence", "data pattern", "example", "counterexample", "context"]],
    ["Common Traps", ["distractor", "misreading", "overgeneralization", "missing units", "unsupported claim"]],
    ["Applications", ["scenario", "model", "performance task", "constructed response", "transfer"]]
  ].map(([name, pool], categoryIndex) => ({
    name,
    clues: [100, 200, 300, 400, 500].map((value, valueIndex) => {
      const answer = pool[valueIndex % pool.length] || unitSpec.title;
      return {
        value,
        clue: `This ${course.subjectArea.toLowerCase()} idea helps students handle ${unitSpec.title} at the ${value}-level.`,
        answer,
        explanation: `${answer} belongs in ${unitSpec.title} for ${course.label}. A strong response should define it, connect it to the task, and use evidence or process language from the standards/CED.`
      };
    })
  }));
  return {
    id: `${course.id}-unit-${String(unitIndex + 1).padStart(2, "0")}`,
    courseId: course.id,
    courseLabel: course.label,
    unit: unitSpec.title,
    title: `${course.label}: ${unitSpec.title} Jeopardy Review`,
    standardsFramework: course.standardsFramework,
    sourceAuthority: course.standardsSourceId,
    categories,
    final: {
      category: "Synthesis",
      clue: `This is the best one-sentence move for connecting ${unitSpec.title} to evidence.`,
      answer: `Use evidence to explain the unit concept in context.`,
      explanation: `The final clue checks whether students can move beyond recall and explain how ${unitSpec.title} works in a standards-aligned task.`
    }
  };
}

function buildPracticeBlueprint(course) {
  const released = course.assessmentSourceIds.filter((id) => id.includes("nysed") || id.includes("regents"));
  const sourceMode = released.length ? "released-nys-source-backed" : course.ap ? "ap-ced-original-with-public-sample-links" : "standards-aligned-original";
  return {
    id: `${course.id}-practice-blueprint`,
    courseId: course.id,
    courseLabel: course.label,
    sourceMode,
    standardsFramework: course.standardsFramework,
    officialSourceIds: course.assessmentSourceIds,
    sectionPlan: course.ap ? [
      { id: "mcq", label: "AP-style multiple choice", count: 30, sourcePolicy: "original AP-style items aligned to CED units unless a public College Board PDF is explicitly registered" },
      { id: "frq", label: "Course-appropriate free response or performance task", count: 3, sourcePolicy: "CED skill rubric estimate" }
    ] : released.length ? [
      { id: "released-mcq", label: "Released NYS multiple choice", count: course.id.startsWith("ela-") || course.id.startsWith("math-") ? 20 : 28, sourcePolicy: "official released NYSED item pattern or exact released form when digitized" },
      { id: "constructed-response", label: "Constructed response", count: 3, sourcePolicy: "released NYSED rubric shape where available" }
    ] : [
      { id: "standards-mcq", label: "Standards-aligned multiple choice", count: 20, sourcePolicy: "original items aligned to NYSED standards" },
      { id: "application", label: "Application or performance task", count: 2, sourcePolicy: "original standards-aligned rubric" }
    ],
    units: course.units.map((u) => ({
      unit: u.title,
      standardRefs: standardRefs(course, u),
      sampledQuestionIds: Array.from({ length: 4 }, (_, i) => `${course.id}-${String((course.units.indexOf(u) * 4 + i + 1)).padStart(3, "0")}`)
    }))
  };
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function main() {
  const generatedPrefix = /^all-subject-/;
  for (const file of fs.readdirSync(FRAG_DIR)) {
    if (generatedPrefix.test(file) && file.endsWith(".json")) fs.rmSync(path.join(FRAG_DIR, file));
  }

  const orderedCourses = courses.sort((a, b) => a.id.localeCompare(b.id));
  for (const course of orderedCourses) {
    const questions = buildQuestions(course);
    writeJson(path.join(FRAG_DIR, `all-subject-${course.id}.json`), {
      course: course.id,
      courseLabel: course.label,
      generatedBy: "scripts/generate-all-subject-content.mjs",
      version: VERSION,
      questions
    });
  }

  const taxonomy = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    boundary: "NYSED P-12 standards content areas plus College Board AP courses",
    sourceAuthorities: NYSED_SOURCES,
    courses: orderedCourses
  };

  const sourceCatalog = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    policy: "Released NYSED Regents and Grades 3-8 materials are authoritative practice-exam sources. Arcade questions may be original or released-pattern items, but exact released forms should stay source-tagged and separated from general trivia.",
    sources: NYSED_SOURCES,
    courseSourceMap: Object.fromEntries(orderedCourses.map((course) => [course.id, {
      courseLabel: course.label,
      standardsSourceId: course.standardsSourceId,
      assessmentSourceIds: course.assessmentSourceIds,
      sourceMode: course.assessmentSourceIds.length ? "released-backed-or-public-official" : "standards-aligned-original"
    }]))
  };

  const jeopardy = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    mode: "unit-blueprints",
    boardShape: "5 categories x 5 clues plus Final Jeopardy",
    boards: orderedCourses.flatMap((course) => course.units.map((unitSpec, index) => buildJeopardyBoard(course, unitSpec, index)))
  };

  const practice = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    sourcePolicy: "Exact released forms remain separate from generated/original practice. Existing Regents/AP exact-form runners should consume registered official forms; this file fills the all-subject coverage map.",
    exams: orderedCourses.map(buildPracticeBlueprint)
  };

  writeJson(path.join(DATA_DIR, "all-subject-course-taxonomy.json"), taxonomy);
  writeJson(path.join(DATA_DIR, "released-assessment-source-catalog.json"), sourceCatalog);
  writeJson(path.join(DATA_DIR, "generated-all-subject-jeopardy-blueprints.json"), jeopardy);
  writeJson(path.join(DATA_DIR, "generated-practice-exam-blueprints.json"), practice);

  console.log(`Generated ${orderedCourses.length} course fragments, ${jeopardy.boards.length} Jeopardy unit blueprints, and ${practice.exams.length} practice exam blueprints.`);
}

main();
