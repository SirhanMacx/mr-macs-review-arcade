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
const JEOPARDY_SHARD_DIR = path.join(DATA_DIR, "generated-jeopardy-boards");
const PRACTICE_PAGE_DIR = path.join(ROOT, "assets", "generated-practice-pages");
const VERSION = "20260516-course-depth-v2";
const NON_AP_ITEMS_PER_UNIT = 20;
const AP_ITEMS_PER_UNIT = 22;
const JEOPARDY_VARIANTS = [
  {
    id: "review",
    label: "Review Board",
    shortLabel: "Review",
    focus: "core review, unit vocabulary, and first-pass exam reasoning"
  },
  {
    id: "challenge",
    label: "Challenge Board",
    shortLabel: "Challenge",
    focus: "harder transfer, error analysis, and evidence-based reasoning"
  },
  {
    id: "sprint",
    label: "Final Sprint Board",
    shortLabel: "Final Sprint",
    focus: "fast recall, common traps, and final exam readiness"
  }
];

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

function sourceById(id) {
  return NYSED_SOURCES[id] || Object.values(NYSED_SOURCES).find((source) => source.id === id) || null;
}

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
  const unitCount = Math.max(1, units.length);
  const depthFloor = ap
    ? Math.max(180, unitCount * AP_ITEMS_PER_UNIT)
    : Math.max(144, unitCount * NON_AP_ITEMS_PER_UNIT);
  const resolvedMinQuestions = Math.max(minQuestions || 0, depthFloor);
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
    minQuestions: resolvedMinQuestions,
    questionsPerUnit: Math.ceil(resolvedMinQuestions / unitCount),
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

const HIGH_SCHOOL_MATH_UNITS = {
  "algebra-1": [
    unit("Linear Equations and Inequalities", ["solution set", "equivalent equation", "literal equation", "inequality", "constraint", "rate"], ["solve equations", "justify algebraic steps", "interpret constraints"], ["NYS Algebra I: Algebra"]),
    unit("Linear Functions and Graphs", ["slope", "y-intercept", "rate of change", "linear model", "domain", "range"], ["graph linear functions", "compare representations", "interpret parameters"], ["NYS Algebra I: Functions"]),
    unit("Systems of Equations", ["intersection", "substitution", "elimination", "no solution", "infinitely many solutions", "constraint system"], ["solve systems", "explain intersections", "model constraints"], ["NYS Algebra I: Systems"]),
    unit("Exponents and Radicals", ["exponent law", "scientific notation", "radical", "rational exponent", "growth factor", "scale"], ["rewrite expressions", "estimate magnitude", "apply exponent rules"], ["NYS Algebra I: Number and Quantity"]),
    unit("Polynomials and Factoring", ["polynomial", "factor", "zero product property", "quadratic expression", "standard form", "vertex"], ["factor expressions", "identify structure", "connect factors to zeros"], ["NYS Algebra I: Algebra"]),
    unit("Quadratic Functions", ["parabola", "axis of symmetry", "vertex", "roots", "maximum", "minimum"], ["graph quadratics", "solve by factoring", "interpret features"], ["NYS Algebra I: Functions"]),
    unit("Exponential Functions", ["initial value", "growth rate", "decay rate", "percent change", "asymptote", "recursive pattern"], ["model growth", "compare linear and exponential", "interpret base"], ["NYS Algebra I: Functions"]),
    unit("Statistics and Residuals", ["scatterplot", "correlation", "line of best fit", "residual", "causation", "outlier"], ["interpret scatterplots", "fit models", "critique claims"], ["NYS Algebra I: Statistics"])
  ],
  geometry: [
    unit("Transformations and Symmetry", ["translation", "rotation", "reflection", "dilation", "rigid motion", "image"], ["describe transformations", "prove congruence", "use coordinates"], ["NYS Geometry: Congruence"]),
    unit("Congruence and Proof", ["congruence", "corresponding parts", "SSS", "SAS", "ASA", "proof statement"], ["write proofs", "justify triangle congruence", "use logical sequence"], ["NYS Geometry: Congruence"]),
    unit("Similarity", ["scale factor", "similar triangle", "AA similarity", "proportional side", "indirect measurement", "dilation"], ["prove similarity", "solve proportions", "interpret scale"], ["NYS Geometry: Similarity"]),
    unit("Right Triangles and Trigonometry", ["Pythagorean theorem", "sine", "cosine", "tangent", "special right triangle", "angle of elevation"], ["solve right triangles", "choose trig ratios", "model distances"], ["NYS Geometry: Right Triangle Trigonometry"]),
    unit("Circles", ["central angle", "inscribed angle", "arc", "chord", "tangent", "sector"], ["use circle theorems", "find arc measures", "solve circle problems"], ["NYS Geometry: Circles"]),
    unit("Coordinate Geometry", ["distance formula", "midpoint", "slope", "parallel lines", "perpendicular lines", "partition"], ["prove with coordinates", "calculate distance", "classify figures"], ["NYS Geometry: Coordinate Geometry"]),
    unit("Measurement and Dimension", ["area", "surface area", "volume", "density", "cross-section", "composite figure"], ["use formulas", "reason with units", "solve design problems"], ["NYS Geometry: Measurement"]),
    unit("Geometric Modeling", ["diagram", "assumption", "constraint", "precision", "construction", "locus"], ["model real situations", "critique diagrams", "defend assumptions"], ["NYS Geometry: Modeling"])
  ],
  "algebra-2": [
    unit("Function Families", ["linear function", "quadratic function", "exponential function", "absolute value", "piecewise function", "transformation"], ["compare functions", "identify features", "model contexts"], ["NYS Algebra II: Functions"]),
    unit("Polynomial Functions", ["degree", "leading coefficient", "zero", "multiplicity", "end behavior", "factor theorem"], ["analyze polynomial graphs", "find zeros", "use structure"], ["NYS Algebra II: Algebra"]),
    unit("Rational and Radical Functions", ["asymptote", "extraneous solution", "radical equation", "rational expression", "domain restriction", "inverse operation"], ["solve rational equations", "check solutions", "interpret restrictions"], ["NYS Algebra II: Algebra"]),
    unit("Exponential and Logarithmic Functions", ["logarithm", "base", "compound growth", "half-life", "inverse function", "e"], ["solve exponential equations", "interpret logs", "model growth"], ["NYS Algebra II: Functions"]),
    unit("Trigonometric Functions", ["unit circle", "radian", "period", "amplitude", "phase shift", "sinusoidal model"], ["graph trig functions", "solve trig equations", "interpret periodicity"], ["NYS Algebra II: Functions"]),
    unit("Sequences and Series", ["arithmetic sequence", "geometric sequence", "recursive rule", "explicit rule", "sigma notation", "series"], ["write formulas", "compare growth", "sum finite series"], ["NYS Algebra II: Number and Quantity"]),
    unit("Probability and Statistics", ["normal distribution", "standard deviation", "conditional probability", "independence", "simulation", "margin of error"], ["interpret probability", "use distributions", "evaluate studies"], ["NYS Algebra II: Statistics"]),
    unit("Modeling and Regents Strategy", ["parameter", "residual", "constraint", "technology output", "reasonableness", "multiple representation"], ["choose models", "justify answers", "read exam stimuli"], ["NYSED Regents Algebra II released items"])
  ],
  precalculus: [
    unit("Advanced Function Analysis", ["domain", "range", "composition", "inverse", "transformation", "continuity"], ["analyze functions", "compose functions", "interpret inverse relationships"], ["NYS Mathematics: Functions"]),
    unit("Polynomial and Rational Models", ["zero", "asymptote", "factor", "end behavior", "hole", "multiplicity"], ["sketch graphs", "solve equations", "connect algebra and graph features"], ["NYS Mathematics: Algebra"]),
    unit("Exponential and Logarithmic Models", ["logarithm", "exponential model", "growth factor", "decay", "semi-log plot", "inverse"], ["model change", "solve with logs", "interpret parameters"], ["NYS Mathematics: Functions"]),
    unit("Trigonometric and Circular Functions", ["unit circle", "radian", "period", "amplitude", "identity", "inverse trig"], ["evaluate trig", "prove identities", "solve periodic models"], ["NYS Mathematics: Trigonometry"]),
    unit("Vectors and Parametric Equations", ["vector component", "magnitude", "direction", "parameter", "position", "velocity"], ["represent motion", "add vectors", "interpret parameters"], ["NYS Mathematics: Modeling"]),
    unit("Polar and Complex Numbers", ["polar coordinate", "complex plane", "modulus", "argument", "De Moivre", "rotation"], ["convert forms", "graph polar equations", "interpret complex operations"], ["NYS Mathematics: Number and Quantity"]),
    unit("Matrices and Systems", ["matrix", "determinant", "inverse matrix", "linear system", "row operation", "transformation matrix"], ["solve systems", "interpret matrices", "use technology"], ["NYS Mathematics: Algebra"]),
    unit("Limits and Readiness for Calculus", ["limit", "average rate", "instantaneous rate", "secant line", "tangent line", "accumulation"], ["estimate limits", "connect rates", "prepare for derivatives"], ["NYS Mathematics: Calculus Readiness"])
  ],
  statistics: [
    unit("One-Variable Data", ["distribution", "center", "spread", "outlier", "shape", "boxplot"], ["describe distributions", "compare data sets", "choose statistics"], ["NYS Statistics and Probability"]),
    unit("Two-Variable Data", ["scatterplot", "correlation", "regression", "residual", "association", "lurking variable"], ["interpret association", "fit lines", "avoid causation errors"], ["NYS Statistics and Probability"]),
    unit("Collecting Data", ["population", "sample", "random assignment", "bias", "control group", "survey design"], ["evaluate studies", "design samples", "identify bias"], ["NYS Statistics and Probability"]),
    unit("Probability", ["sample space", "event", "conditional probability", "independence", "expected value", "simulation"], ["calculate probability", "use tree diagrams", "interpret independence"], ["NYS Statistics and Probability"]),
    unit("Sampling Distributions", ["sample statistic", "parameter", "variability", "standard error", "central limit idea", "margin of error"], ["reason about samples", "interpret variability", "simulate distributions"], ["NYS Statistics and Probability"]),
    unit("Inference for Proportions", ["confidence interval", "hypothesis test", "p-value", "null hypothesis", "alternative hypothesis", "significance"], ["test claims", "interpret intervals", "explain p-values"], ["NYS Statistics and Probability"]),
    unit("Inference for Means", ["mean", "standard deviation", "t-distribution", "paired data", "confidence level", "degrees of freedom"], ["choose tests", "state conclusions", "check conditions"], ["NYS Statistics and Probability"]),
    unit("Data Ethics and Communication", ["misleading graph", "privacy", "sampling frame", "practical significance", "replication", "uncertainty"], ["critique claims", "communicate uncertainty", "use ethical data"], ["NYS Statistics and Probability"])
  ],
  calculus: [
    unit("Limits and Continuity", ["limit", "one-sided limit", "continuity", "asymptote", "piecewise function", "squeeze reasoning"], ["estimate limits", "justify continuity", "analyze graphs"], ["NYS Mathematics: Calculus"]),
    unit("Derivative Concepts", ["derivative", "tangent line", "instantaneous rate", "difference quotient", "differentiability", "slope field"], ["compute derivatives", "interpret rates", "connect graphs"], ["NYS Mathematics: Calculus"]),
    unit("Derivative Rules", ["product rule", "quotient rule", "chain rule", "implicit differentiation", "inverse derivative", "higher derivative"], ["apply rules", "differentiate efficiently", "check structure"], ["NYS Mathematics: Calculus"]),
    unit("Applications of Derivatives", ["optimization", "related rates", "mean value theorem", "concavity", "inflection point", "linearization"], ["solve applications", "justify extrema", "analyze behavior"], ["NYS Mathematics: Calculus"]),
    unit("Integration Concepts", ["antiderivative", "definite integral", "accumulation", "Riemann sum", "average value", "area under curve"], ["interpret integrals", "estimate accumulation", "connect area and rate"], ["NYS Mathematics: Calculus"]),
    unit("Techniques of Integration", ["u-substitution", "integration by parts", "partial fractions", "trig substitution", "improper integral", "numeric integration"], ["choose techniques", "evaluate integrals", "check reasonableness"], ["NYS Mathematics: Calculus"]),
    unit("Differential Equations", ["separable equation", "slope field", "initial condition", "exponential model", "logistic model", "Euler method"], ["solve differential equations", "interpret models", "match slope fields"], ["NYS Mathematics: Calculus"]),
    unit("Series and Approximation", ["sequence", "series", "convergence", "Taylor polynomial", "radius of convergence", "error bound"], ["test convergence", "approximate functions", "bound error"], ["NYS Mathematics: Calculus"])
  ]
};

const HIGH_SCHOOL_SCIENCE_UNITS = {
  "earth-science": [
    unit("Earth in Space", ["celestial motion", "seasons", "moon phase", "solar system model", "gravity", "spectral evidence"], ["interpret sky models", "explain seasons", "use evidence from observations"], ["NYS Earth and Space Sciences"]),
    unit("Earth Materials", ["mineral property", "rock cycle", "igneous rock", "sedimentary rock", "metamorphic rock", "resource"], ["identify materials", "classify rocks", "connect properties to formation"], ["NYS Earth and Space Sciences"]),
    unit("Plate Tectonics", ["plate boundary", "earthquake", "volcano", "mantle convection", "seafloor spreading", "subduction"], ["read tectonic maps", "explain hazards", "use geologic evidence"], ["NYS Earth and Space Sciences"]),
    unit("Weathering and Landscapes", ["erosion", "deposition", "stream velocity", "glacier", "soil", "topographic map"], ["interpret landscapes", "read contour maps", "explain surface processes"], ["NYS Earth and Space Sciences"]),
    unit("Atmosphere and Weather", ["air pressure", "front", "humidity", "storm track", "station model", "wind"], ["read weather maps", "predict weather", "explain air movement"], ["NYS Earth and Space Sciences"]),
    unit("Climate Systems", ["greenhouse effect", "climate proxy", "ocean current", "latitude", "feedback", "human impact"], ["analyze climate data", "distinguish weather and climate", "evaluate evidence"], ["NYS Earth and Space Sciences"]),
    unit("Geologic History", ["fossil", "relative dating", "absolute dating", "index fossil", "unconformity", "geologic time"], ["sequence events", "use fossil evidence", "interpret rock records"], ["NYS Earth and Space Sciences"]),
    unit("Earth Science Lab and Models", ["model limitation", "map scale", "density", "data table", "variable", "measurement error"], ["use reference tables", "read diagrams", "argue from data"], ["NYSED Earth Science released items"])
  ],
  biology: [
    unit("Cell Structure and Function", ["organelle", "cell membrane", "diffusion", "osmosis", "homeostasis", "microscope evidence"], ["model cells", "interpret diagrams", "explain transport"], ["NYS Life Science"]),
    unit("Biochemistry and Energy", ["enzyme", "ATP", "photosynthesis", "cellular respiration", "macromolecule", "energy transfer"], ["trace matter and energy", "explain enzymes", "interpret lab data"], ["NYS Life Science"]),
    unit("Genetics and Inheritance", ["DNA", "gene", "allele", "Punnett square", "mutation", "chromosome"], ["predict inheritance", "interpret pedigrees", "connect genes to traits"], ["NYS Life Science"]),
    unit("Evolution", ["natural selection", "adaptation", "variation", "common ancestry", "fossil evidence", "speciation"], ["explain selection", "use evidence", "avoid purpose-based misconceptions"], ["NYS Life Science"]),
    unit("Ecology", ["ecosystem", "food web", "population", "carrying capacity", "biodiversity", "invasive species"], ["model interactions", "analyze population data", "explain stability"], ["NYS Life Science"]),
    unit("Human Body Systems", ["immune response", "nervous system", "endocrine system", "feedback loop", "respiration", "digestion"], ["connect systems", "explain regulation", "interpret body-system data"], ["NYS Life Science"]),
    unit("Reproduction and Development", ["mitosis", "meiosis", "fertilization", "embryo", "differentiation", "asexual reproduction"], ["compare processes", "explain development", "interpret cell-cycle models"], ["NYS Life Science"]),
    unit("Biology Lab and Regents Strategy", ["controlled variable", "dependent variable", "claim evidence reasoning", "graph trend", "experimental design", "valid conclusion"], ["design investigations", "evaluate data", "write scientific explanations"], ["NYSED Living Environment released items"])
  ],
  chemistry: [
    unit("Atomic Structure", ["proton", "neutron", "electron", "isotope", "atomic mass", "electron configuration"], ["use periodic table data", "compare atoms", "explain isotopes"], ["NYS Chemistry"]),
    unit("Periodic Trends", ["atomic radius", "ionization energy", "electronegativity", "metallic character", "valence electron", "group trend"], ["predict properties", "explain trends", "use table evidence"], ["NYS Chemistry"]),
    unit("Bonding and Intermolecular Forces", ["ionic bond", "covalent bond", "polarity", "hydrogen bonding", "molecular geometry", "lattice"], ["classify bonds", "predict properties", "draw models"], ["NYS Chemistry"]),
    unit("Moles and Stoichiometry", ["mole", "molar mass", "balanced equation", "limiting reactant", "percent yield", "empirical formula"], ["convert quantities", "balance equations", "solve stoichiometry"], ["NYS Chemistry"]),
    unit("Solutions and Concentration", ["molarity", "solubility", "dilution", "saturated solution", "electrolyte", "colligative property"], ["calculate concentration", "interpret solubility", "compare solutions"], ["NYS Chemistry"]),
    unit("Thermochemistry and Kinetics", ["enthalpy", "activation energy", "catalyst", "reaction rate", "collision theory", "energy diagram"], ["read energy diagrams", "explain rates", "analyze heat flow"], ["NYS Chemistry"]),
    unit("Equilibrium, Acids, and Bases", ["Le Chatelier's principle", "equilibrium constant", "pH", "acid", "base", "titration"], ["predict shifts", "interpret pH", "solve acid-base problems"], ["NYS Chemistry"]),
    unit("Redox and Lab Strategy", ["oxidation", "reduction", "half-reaction", "electrochemical cell", "indicator", "measurement uncertainty"], ["identify redox", "use lab evidence", "write scientific explanations"], ["NYSED Chemistry released items"])
  ],
  physics: [
    unit("Motion in One and Two Dimensions", ["displacement", "velocity", "acceleration", "projectile motion", "vector component", "kinematic graph"], ["analyze motion graphs", "resolve vectors", "solve kinematics"], ["NYS Physics"]),
    unit("Forces and Newton's Laws", ["net force", "mass", "free-body diagram", "friction", "normal force", "tension"], ["draw force diagrams", "apply Newton's laws", "explain acceleration"], ["NYS Physics"]),
    unit("Energy", ["work", "kinetic energy", "potential energy", "conservation of energy", "power", "spring energy"], ["track energy", "solve conservation problems", "interpret energy diagrams"], ["NYS Physics"]),
    unit("Momentum", ["impulse", "momentum", "collision", "conservation", "elastic collision", "inelastic collision"], ["analyze collisions", "use impulse-momentum", "interpret data"], ["NYS Physics"]),
    unit("Circular Motion and Gravitation", ["centripetal force", "period", "frequency", "orbital motion", "gravitational field", "satellite"], ["model circular motion", "connect force and acceleration", "solve orbital contexts"], ["NYS Physics"]),
    unit("Waves and Sound", ["wavelength", "frequency", "amplitude", "interference", "standing wave", "Doppler effect"], ["analyze wave diagrams", "calculate wave speed", "explain interference"], ["NYS Physics"]),
    unit("Electricity and Magnetism", ["charge", "electric field", "potential difference", "current", "resistance", "magnetic field"], ["analyze circuits", "use Ohm's law", "explain fields"], ["NYS Physics"]),
    unit("Modern Physics and Lab Strategy", ["photon", "nuclear reaction", "half-life", "model limitation", "graph slope", "experimental uncertainty"], ["interpret modern models", "analyze lab graphs", "argue from evidence"], ["NYSED Physics released items"])
  ],
  "environmental-science": [
    unit("Ecosystems and Biodiversity", ["species richness", "food web", "ecosystem service", "habitat", "keystone species", "resilience"], ["analyze ecosystems", "explain biodiversity", "interpret field data"], ["NYS Science: Ecosystems"]),
    unit("Population Dynamics", ["carrying capacity", "limiting factor", "growth curve", "age structure", "migration", "density"], ["model populations", "interpret graphs", "predict change"], ["NYS Science: Ecology"]),
    unit("Earth Systems and Resources", ["watershed", "soil", "mineral resource", "renewable resource", "nonrenewable resource", "land use"], ["trace resources", "evaluate trade-offs", "read maps"], ["NYS Earth and Space Sciences"]),
    unit("Energy Resources", ["fossil fuel", "renewable energy", "energy efficiency", "grid", "carbon footprint", "life-cycle cost"], ["compare resources", "calculate impacts", "evaluate claims"], ["NYS Science: Energy"]),
    unit("Pollution", ["point source", "nonpoint source", "bioaccumulation", "eutrophication", "particulate matter", "waste stream"], ["trace pollutants", "interpret evidence", "propose mitigation"], ["NYS Science: Human Impacts"]),
    unit("Climate Change", ["greenhouse gas", "feedback", "mitigation", "adaptation", "climate model", "sea-level rise"], ["analyze climate data", "weigh solutions", "distinguish evidence and opinion"], ["NYS Earth and Space Sciences"]),
    unit("Environmental Policy", ["regulation", "cost-benefit analysis", "stakeholder", "environmental justice", "conservation", "risk assessment"], ["evaluate policy", "identify stakeholders", "justify trade-offs"], ["NYS Science: Human Impacts"]),
    unit("Field Methods and Data", ["sampling method", "transect", "water-quality indicator", "biodiversity index", "error", "replication"], ["design investigations", "analyze field data", "write evidence-based conclusions"], ["NYS Science Practices"])
  ]
};

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
    courseContext: gradeLabel,
    title: u.title,
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
  units: HIGH_SCHOOL_MATH_UNITS[id] || withGrade(MATH_UNITS, label)
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
  units: HIGH_SCHOOL_SCIENCE_UNITS[id] || withGrade(SCIENCE_UNITS, label)
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

const AP_DOMAIN_CONCEPTS = {
  arts: ["sustained investigation", "selected works", "intentional choices", "materials and processes", "portfolio evidence", "artist statement"],
  english: ["claim", "evidence", "commentary", "rhetorical situation", "line of reasoning", "style"],
  languages: ["interpretive communication", "presentational communication", "cultural comparison", "authentic source", "register", "audience"],
  sciences: ["model", "system", "data pattern", "cause and effect", "experimental design", "scale"],
  math: ["function behavior", "representation", "parameter", "model", "justification", "precision"],
  computer: ["algorithm", "abstraction", "data", "debugging", "impact", "security"],
  economics: ["marginal analysis", "market model", "incentive", "policy effect", "graph shift", "efficiency"],
  history: ["contextualization", "comparison", "causation", "continuity and change", "source evidence", "argument"],
  capstone: ["research question", "source credibility", "methodology", "evidence", "limitations", "presentation"]
};

const AP_UNIT_CONCEPT_OVERRIDES = {
  "ap-biology": {
    "Chemistry of Life": ["water polarity", "hydrogen bonding", "carbon skeleton", "macromolecule", "dehydration synthesis", "hydrolysis", "enzyme shape", "structure and function"],
    "Cell Structure and Function": ["organelle", "phospholipid bilayer", "selective permeability", "diffusion", "osmosis", "surface area-to-volume ratio", "compartmentalization", "membrane transport"],
    "Cellular Energetics": ["ATP", "enzyme", "photosynthesis", "cellular respiration", "electron transport chain", "chemiosmosis", "energy coupling", "fermentation"],
    "Cell Communication and Cell Cycle": ["signal transduction", "ligand", "receptor", "second messenger", "phosphorylation cascade", "cell cycle checkpoint", "mitosis", "apoptosis"],
    "Heredity": ["meiosis", "chromosome", "allele", "segregation", "independent assortment", "crossing over", "genetic variation", "pedigree"],
    "Gene Expression and Regulation": ["transcription", "translation", "gene regulation", "operon", "mutation", "RNA processing", "epigenetic change", "biotechnology"],
    "Natural Selection": ["variation", "fitness", "selection pressure", "adaptation", "genetic drift", "gene flow", "speciation", "Hardy-Weinberg equilibrium"],
    "Ecology": ["population", "community", "ecosystem", "food web", "energy flow", "biogeochemical cycle", "carrying capacity", "biodiversity"]
  },
  "ap-chemistry": {
    "Atomic Structure and Properties": ["photoelectron spectrum", "coulombic attraction", "ionization energy", "atomic radius", "electron configuration", "periodic trend", "isotope", "valence electron"],
    "Molecular and Ionic Compound Structure": ["ionic lattice", "covalent bond", "Lewis diagram", "formal charge", "resonance", "VSEPR geometry", "bond polarity", "hybridization"],
    "Intermolecular Forces and Properties": ["London dispersion force", "dipole-dipole attraction", "hydrogen bonding", "vapor pressure", "boiling point", "solubility", "phase change", "particulate model"],
    "Chemical Reactions": ["net ionic equation", "stoichiometry", "limiting reactant", "redox reaction", "precipitation reaction", "acid-base reaction", "mole ratio", "particle conservation"],
    "Kinetics": ["reaction rate", "rate law", "activation energy", "catalyst", "collision model", "reaction mechanism", "rate-determining step", "energy profile"],
    "Thermodynamics": ["enthalpy", "entropy", "Gibbs free energy", "calorimetry", "Hess's law", "bond energy", "spontaneity", "heat transfer"],
    "Equilibrium": ["equilibrium constant", "reaction quotient", "Le Chatelier's principle", "ICE table", "equilibrium shift", "solubility product", "dynamic equilibrium", "stress"],
    "Acids and Bases": ["pH", "pKa", "buffer", "titration curve", "equivalence point", "weak acid", "conjugate base", "Henderson-Hasselbalch relationship"],
    "Applications of Thermodynamics": ["electrochemical cell", "cell potential", "free energy", "galvanic cell", "electrolysis", "oxidation", "reduction", "thermodynamic favorability"]
  },
  "ap-physics-1": {
    "Kinematics": ["position", "velocity", "acceleration", "motion graph", "free fall", "projectile motion", "vector component", "constant acceleration"],
    "Force and Translational Dynamics": ["net force", "free-body diagram", "friction", "normal force", "tension", "Newton's second law", "system schema", "force pair"],
    "Work, Energy, and Power": ["work", "kinetic energy", "gravitational potential energy", "spring potential energy", "energy bar chart", "conservation of energy", "power", "dissipated energy"],
    "Linear Momentum": ["momentum", "impulse", "collision", "conservation of momentum", "center of mass", "elastic collision", "inelastic collision", "momentum transfer"],
    "Torque and Rotational Dynamics": ["torque", "rotational inertia", "angular acceleration", "lever arm", "rotational equilibrium", "angular velocity", "rolling motion", "rotational kinetic energy"],
    "Energy and Momentum of Rotating Systems": ["angular momentum", "conservation of angular momentum", "rotational energy", "moment of inertia", "radius change", "rotational collision", "system boundary", "external torque"],
    "Oscillations": ["simple harmonic motion", "period", "frequency", "amplitude", "restoring force", "spring constant", "pendulum", "energy exchange"],
    "Fluids": ["density", "pressure", "buoyant force", "continuity equation", "flow rate", "Bernoulli's principle", "fluid column", "displacement volume"]
  }
};

function phraseConcepts(title) {
  const clean = String(title || "")
    .replace(/^Period\s+\d+:\s*/i, "")
    .replace(/\([^)]*\)/g, "")
    .trim();
  const pieces = clean
    .split(/\s*(?:,|:|;|\/|\band\b|\bor\b|\bto\b)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);
  return uniq([clean, ...pieces]);
}

function apDomainKey(id) {
  if (/2d|3d|drawing|art|music/.test(id)) return "arts";
  if (/seminar|research/.test(id)) return "capstone";
  if (/english|spanish-literature/.test(id)) return "english";
  if (/language|latin/.test(id)) return "languages";
  if (/biology|chemistry|environmental|physics/.test(id)) return "sciences";
  if (/calculus|statistics|precalculus/.test(id)) return "math";
  if (/computer|cybersecurity/.test(id)) return "computer";
  if (/business|macro|micro/.test(id)) return "economics";
  return "history";
}

function apConceptsFor(id, title) {
  const domain = apDomainKey(id);
  const override = (AP_UNIT_CONCEPT_OVERRIDES[id] && AP_UNIT_CONCEPT_OVERRIDES[id][title]) || [];
  return uniq([...override, ...phraseConcepts(title), ...(AP_DOMAIN_CONCEPTS[domain] || AP_DOMAIN_CONCEPTS.history)]).slice(0, 10);
}

function apSkillsFor(id) {
  const domain = apDomainKey(id);
  const skills = {
    arts: ["explain artistic intent", "connect materials to meaning", "evaluate revision choices"],
    capstone: ["evaluate source credibility", "align evidence to a research question", "explain methodological limits"],
    english: ["analyze evidence", "build a line of reasoning", "connect choices to meaning"],
    languages: ["interpret authentic sources", "communicate for purpose and audience", "compare cultural perspectives"],
    sciences: ["use models", "analyze data", "justify claims with evidence"],
    math: ["represent relationships", "justify procedures", "interpret parameters"],
    computer: ["trace algorithms", "evaluate impacts", "debug logic"],
    economics: ["shift and interpret graphs", "explain incentives", "evaluate policy effects"],
    history: ["contextualize evidence", "compare developments", "explain causation"]
  };
  return skills[domain] || skills.history;
}

for (const [id, label] of Object.entries(AP_LABELS)) {
  const titles = apUnits[id] || ["Course Concepts", "Evidence and Skills", "Applications", "Analysis", "Performance Tasks", "Exam Practice"];
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
    units: titles.map((title) => unit(title, apConceptsFor(id, title), apSkillsFor(id), [`AP CED: ${title}`]))
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

function courseArtifact(course) {
  const subject = course.subjectArea;
  if (/ELA|English|Languages/.test(subject)) return "text excerpt";
  if (/Math|Mathematics|Statistics|Calculus/.test(subject)) return "graph, table, or equation";
  if (/Science|Physics|Chemistry|Biology|Environmental/.test(subject)) return "data table, diagram, or model";
  if (/Arts/.test(subject)) return "work sample or performance excerpt";
  if (/Computer|Technology/.test(subject)) return "algorithm, code trace, or system diagram";
  if (/Health|Physical/.test(subject)) return "scenario or personal-wellness data";
  if (/Finance|Family|CDOS|Business|Economics/.test(subject)) return "budget, case study, or market scenario";
  return "source, scenario, or data set";
}

function reasoningMove(course) {
  const subject = course.subjectArea;
  if (/Math|Mathematics|Statistics|Calculus/.test(subject)) return "show a valid procedure and interpret the answer in context";
  if (/Science|Physics|Chemistry|Biology|Environmental/.test(subject)) return "connect a model or data pattern to a scientific claim";
  if (/ELA|English/.test(subject)) return "quote or paraphrase evidence and explain how it supports the claim";
  if (/Languages/.test(subject)) return "communicate the message for the task, audience, and cultural context";
  if (/Arts/.test(subject)) return "connect artistic choices to purpose, audience, and effect";
  if (/Computer|Technology/.test(subject)) return "trace the system or algorithm and explain the consequence";
  if (/Health|Physical/.test(subject)) return "choose a safe, evidence-based action and explain the health impact";
  if (/Finance|Family|CDOS|Business|Economics/.test(subject)) return "weigh trade-offs and justify the decision with evidence";
  return "use evidence to explain the answer in context";
}

function examTask(course) {
  if (course.ap) return "AP CED-aligned exam task";
  if ((course.assessmentSourceIds || []).some((id) => /regents/.test(id))) return "Regents-style item";
  if ((course.assessmentSourceIds || []).some((id) => /grades-3-8/.test(id))) return "NYSED released state-test-style item";
  return "NYS standards-aligned classroom task";
}

function articleFor(phrase) {
  return /^[aeiou]/i.test(String(phrase || "").trim()) ? "an" : "a";
}

function compactStandard(course, unitSpec) {
  return (unitSpec.standardRefs && unitSpec.standardRefs[0]) || course.standardsFramework || "course standard";
}

const CONCEPT_GLOSSES = {
  "water-polarity": "explains why water forms attractions that shape biological reactions and transport",
  "hydrogen-bonding": "describes the weak attractions that influence water behavior, DNA pairing, and protein shape",
  "carbon-skeleton": "forms the chain-like framework that gives organic molecules their structure",
  macromolecule: "names the large biological molecule built from smaller subunits",
  "dehydration-synthesis": "builds a larger molecule by removing water",
  hydrolysis: "breaks a larger molecule by adding water",
  "enzyme-shape": "controls whether a substrate can fit and a reaction can be catalyzed",
  organelle: "names a specialized cell structure with a particular job",
  "phospholipid-bilayer": "forms the flexible double layer of a cell membrane",
  "selective-permeability": "allows some materials through a membrane while restricting others",
  diffusion: "moves particles from higher concentration toward lower concentration",
  osmosis: "moves water across a membrane based on solute concentration",
  "surface-area-to-volume-ratio": "affects how efficiently a cell can exchange materials",
  compartmentalization: "separates cell processes into specialized spaces",
  "membrane-transport": "moves substances across the boundary of a cell",
  atp: "stores usable chemical energy for cellular work",
  enzyme: "lowers activation energy so a reaction can happen more efficiently",
  photosynthesis: "converts light energy into chemical energy stored in sugars",
  "cellular-respiration": "releases usable energy from organic molecules",
  "electron-transport-chain": "passes electrons through membrane proteins to help build a proton gradient",
  chemiosmosis: "uses a proton gradient to drive ATP production",
  "energy-coupling": "links an energy-releasing process to an energy-requiring process",
  fermentation: "regenerates electron carriers when oxygen is limited",
  "signal-transduction": "converts an outside signal into a chain of cellular responses",
  ligand: "binds to a receptor to start a communication pathway",
  receptor: "detects a signal and begins the response pathway",
  "second-messenger": "carries a signal inside the cell after receptor activation",
  "phosphorylation-cascade": "amplifies a signal through repeated phosphate transfers",
  "cell-cycle-checkpoint": "halts division until key conditions are met",
  mitosis: "separates duplicated chromosomes into two identical nuclei",
  apoptosis: "triggers programmed cell death when cells need to be removed",
  meiosis: "makes haploid gametes and increases genetic variation",
  chromosome: "packages DNA into a structure that can be sorted during division",
  allele: "represents one version of a gene",
  segregation: "separates allele pairs during gamete formation",
  "independent-assortment": "sorts chromosome pairs into gametes in different combinations",
  "crossing-over": "exchanges DNA between homologous chromosomes",
  "genetic-variation": "provides the differences that inheritance and selection act on",
  pedigree: "tracks inheritance patterns across generations",
  transcription: "copies DNA information into RNA",
  translation: "uses RNA information to build a polypeptide",
  "gene-regulation": "controls when, where, and how strongly genes are expressed",
  operon: "coordinates bacterial gene expression through shared control sequences",
  mutation: "changes genetic information and can alter a trait or protein",
  "rna-processing": "modifies an RNA transcript before it is translated",
  "epigenetic-change": "changes gene activity without changing the DNA sequence",
  biotechnology: "uses biological tools to analyze or modify genetic information",
  variation: "describes heritable differences among individuals in a population",
  fitness: "measures reproductive success in a particular environment",
  "selection-pressure": "makes some inherited traits more or less advantageous",
  adaptation: "is an inherited trait that improves success in a specific environment",
  "genetic-drift": "changes allele frequencies by chance, especially in small populations",
  "gene-flow": "moves alleles between populations through migration",
  speciation: "forms new species when populations become reproductively isolated",
  "hardy-weinberg-equilibrium": "models allele frequencies when evolution is not occurring",
  population: "groups organisms of the same species in the same area",
  community: "includes interacting populations in an ecosystem",
  ecosystem: "combines living communities with their physical environment",
  "food-web": "maps feeding relationships and energy transfer among organisms",
  "energy-flow": "tracks usable energy as it moves through trophic levels",
  "biogeochemical-cycle": "moves matter through living systems and Earth reservoirs",
  "carrying-capacity": "marks the population size an environment can sustain",
  biodiversity: "captures the variety of life in an area or system",
  slope: "measures the rate of change between two quantities",
  "y-intercept": "marks the starting value when the input is zero",
  "rate-of-change": "shows how one quantity changes compared with another",
  "linear-model": "represents a constant rate relationship",
  intersection: "shows where two relationships share the same solution",
  substitution: "solves a system by replacing one expression with an equivalent one",
  elimination: "combines equations to remove a variable",
  parabola: "graphs a quadratic relationship with a turning point",
  vertex: "marks the maximum or minimum point of a quadratic graph",
  roots: "show where a function equals zero",
  "growth-rate": "describes how fast a quantity increases over time",
  scatterplot: "displays paired data to reveal a possible association",
  correlation: "describes the direction and strength of an association",
  residual: "measures how far a data point is from a model's prediction",
  "claim": "states the argument or conclusion that evidence must support",
  evidence: "provides details from text, data, source, or observation to support a claim",
  reasoning: "explains why the evidence supports the claim",
  "central-idea": "captures the main point developed across an informational text",
  theme: "names a larger message developed through a literary work",
  "point-of-view": "shows how a narrator or speaker's position shapes meaning",
  "text-structure": "organizes information so readers can follow the author's thinking",
  "author-purpose": "explains why a text was written and how choices serve that goal"
};

const SKILL_GLOSSES = {
  "use-models": "represent a process or system so relationships can be tested",
  "analyze-data": "look for patterns, units, limits, and outliers before making a claim",
  "justify-claims-with-evidence": "pair a claim with evidence and reasoning",
  "represent-relationships": "move between words, tables, graphs, symbols, and diagrams",
  "justify-procedures": "explain why each step is valid, not just what step was used",
  "interpret-parameters": "connect numbers or symbols to what they mean in context",
  "cite-textual-evidence": "use exact details from a text to support an interpretation",
  "infer-theme": "use details to identify a message that is not stated directly",
  "trace-argument": "follow how claims, reasons, and evidence build a case",
  "source-evidence": "use origin, purpose, audience, and context to read a document",
  contextualize: "place evidence inside the broader time, place, or situation",
  corroborate: "compare evidence across sources before accepting a claim",
  "trace-algorithms": "step through instructions to predict output or locate an error",
  "debug-logic": "find and correct the part of a process that breaks the intended result"
};

const EVIDENCE_GLOSSES = {
  "data-table-diagram-or-model": "presents measurements, structures, or relationships students must interpret",
  "graph-table-or-equation": "shows a relationship in a form that can be calculated or interpreted",
  "text-excerpt": "contains language choices and details that must be cited",
  "source-scenario-or-data-set": "gives the context or proof students need for the answer",
  "claim-evidence-link": "connects a conclusion to the proof that supports it",
  "model-limitation": "identifies what a representation leaves out or simplifies",
  "context-clue": "uses surrounding information to figure out meaning",
  "source-pattern": "shows a repeated detail, trend, or perspective across evidence"
};

const TRAP_GLOSSES = {
  "familiar-word-trap": "picks an answer because it repeats vocabulary while ignoring the task",
  "unsupported-claim": "states an answer without proof from the source, data, or model",
  "wrong-unit-transfer": "uses a rule or fact from another unit where it does not fit",
  "ignored-evidence": "answers from memory before reading the stimulus",
  overgeneralization: "turns a limited pattern into a claim that is too broad",
  "misread-task": "answers a different question from the one being asked",
  "wrong-representation": "uses the wrong graph, diagram, model, or equation for the task",
  "distractor-trap": "falls for an answer that sounds academic but does not match the evidence",
  "unit-mix-up": "confuses two related concepts from different parts of the course",
  "absolute-wording": "misses how words like always or never can make a claim too strong",
  "partial-answer": "names one correct detail but leaves out the reasoning that earns full credit"
};

const APPLICATION_GLOSSES = {
  "new-scenario": "asks students to apply the idea in an unfamiliar setting",
  "multi-step-reasoning": "requires more than one linked decision before the answer is complete",
  "constructed-response": "requires a claim, evidence, and explanation rather than a single choice",
  "comparison-task": "asks students to explain similarities, differences, or trade-offs",
  "real-world-application": "uses the course idea to make sense of a practical situation",
  "performance-task": "asks students to produce, design, solve, or explain a complete response",
  "exam-transfer": "checks whether a review idea works on a new released-style question",
  "course-theme": "connects the unit to a larger idea that recurs across the course",
  "unit-connection": "links two ideas so the answer is more than isolated vocabulary",
  "student-explanation": "turns a correct answer into a clear reason someone else could follow",
  "final-review-move": "summarizes the idea students should carry into the next assessment"
};

function extraDomainTerms(course) {
  const subject = course.subjectArea;
  if (/Math|Mathematics|Statistics|Calculus/.test(subject)) return ["graph", "table", "equation", "model", "constraint", "parameter"];
  if (/Science|Physics|Chemistry|Biology|Environmental/.test(subject)) return ["data pattern", "model", "system", "variable", "evidence", "experimental design"];
  if (/ELA|English/.test(subject)) return ["claim", "evidence", "inference", "author craft", "theme", "line of reasoning"];
  if (/Languages/.test(subject)) return ["authentic source", "audience", "register", "cultural context", "message", "proficiency"];
  if (/Arts/.test(subject)) return ["composition", "technique", "intent", "audience", "materials", "revision"];
  if (/Computer|Technology/.test(subject)) return ["algorithm", "data", "system", "debugging", "security", "impact"];
  if (/Health|Physical/.test(subject)) return ["scenario", "decision", "risk", "evidence", "wellness plan", "safety"];
  if (/Finance|Family|CDOS|Business|Economics/.test(subject)) return ["trade-off", "incentive", "budget", "case study", "risk", "decision"];
  return ["evidence", "context", "claim", "source", "comparison", "application"];
}

function glossaryKey(value) {
  return slug(String(value || "").replace(/\./g, ""));
}

function domainFallbackGloss(course, unitSpec, kind) {
  const subject = course.subjectArea;
  if (kind === "skill") return "choose evidence, apply the right process, and explain the result";
  if (kind === "evidence") return "gives students the proof or representation they need before answering";
  if (kind === "trap") return "makes an answer look correct while breaking the task directions";
  if (kind === "application") return "moves the unit idea into a new assessment context";
  if (/Math|Mathematics|Statistics|Calculus/.test(subject)) return "describes the quantity, relationship, or representation needed to solve the problem";
  if (/Science|Physics|Chemistry|Biology|Environmental/.test(subject)) return "describes the structure, process, or system evidence behind the observed pattern";
  if (/ELA|English/.test(subject)) return "describes the reading or writing choice that connects evidence to meaning";
  if (/Languages/.test(subject)) return "describes the communication choice that fits the message, audience, and culture";
  if (/Arts/.test(subject)) return "describes the artistic choice that shapes meaning, technique, or audience response";
  if (/Computer|Technology/.test(subject)) return "describes the system, data, or logic needed to predict the result";
  if (/Health|Physical/.test(subject)) return "describes the safe and evidence-based choice in the scenario";
  if (/Finance|Family|CDOS|Business|Economics/.test(subject)) return "describes the decision, trade-off, or incentive in the scenario";
  return `describes the key idea students use to explain ${unitSpec.title}`;
}

function clueGloss(answer, kind, course, unitSpec) {
  const key = glossaryKey(answer);
  const tables = kind === "skill" ? [SKILL_GLOSSES, CONCEPT_GLOSSES]
    : kind === "evidence" ? [EVIDENCE_GLOSSES, CONCEPT_GLOSSES]
      : kind === "trap" ? [TRAP_GLOSSES]
        : kind === "application" ? [APPLICATION_GLOSSES]
          : [CONCEPT_GLOSSES, SKILL_GLOSSES];
  for (const table of tables) {
    if (table[key]) return table[key];
  }
  return domainFallbackGloss(course, unitSpec, kind);
}

function ensureFive(items, fallback) {
  return uniq(items.concat(fallback)).slice(0, 5);
}

function unitProfile(course, unitSpec) {
  const artifactKey = glossaryKey(courseArtifact(course));
  const domain = course.ap ? apDomainKey(course.id) : "";
  const domainConcepts = domain ? AP_DOMAIN_CONCEPTS[domain] || [] : [];
  const terms = uniq(
    unitSpec.concepts
      .filter((concept) => slug(concept) !== slug(unitSpec.title))
      .concat(extraDomainTerms(course), phraseConcepts(unitSpec.title), domainConcepts, unitSpec.concepts)
  ).slice(0, 10);
  while (terms.length < 5) terms.push(unitSpec.title);
  const skills = ensureFive(unitSpec.skills, ["use evidence", "analyze data", "justify claims with evidence", "interpret context", "explain reasoning"]);
  const evidence = ensureFive(
    [courseArtifact(course), "claim-evidence link", "model limitation", "context clue", "source pattern"],
    [artifactKey, "data pattern", "task context", "rubric language", "worked example"]
  );
  const traps = ensureFive(
    ["familiar-word trap", "unsupported claim", "wrong-unit transfer", "ignored evidence", "overgeneralization"],
    ["misread task", "wrong representation", "distractor trap", "unit mix-up", "partial answer"]
  );
  const applications = ensureFive(
    ["new scenario", "multi-step reasoning", "constructed response", "comparison task", "real-world application"],
    ["performance task", "exam transfer", "course theme", "unit connection", "student explanation"]
  );
  return { terms, skills, evidence, traps, applications };
}

function titleCaseCompact(value) {
  const keepSmall = new Set(["and", "or", "of", "to", "for", "in", "the", "a", "an"]);
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && keepSmall.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function categoryPairName(a, b, fallback) {
  const first = titleCaseCompact(a);
  const second = titleCaseCompact(b);
  if (first && second && first !== second) return `${first} + ${second}`;
  return first || second || fallback;
}

function boardCategoryNameOverrides(course, unitSpec) {
  const byCourse = {
    "ap-biology": {
      "Chemistry of Life": ["Water + Bonds", "Macromolecules", "Lab Evidence", "Biochem Traps", "AP Transfer"],
      "Cell Structure and Function": ["Membranes", "Organelles", "Cell Models", "Transport Traps", "AP Transfer"],
      "Cellular Energetics": ["ATP + Enzymes", "Photosynthesis", "Respiration Data", "Energy Traps", "AP Transfer"],
      "Cell Communication and Cell Cycle": ["Signals + Receptors", "Cycle Control", "Pathway Evidence", "AP Traps", "AP Transfer"],
      "Heredity": ["Meiosis", "Inheritance Patterns", "Genetic Evidence", "Crossing Traps", "AP Transfer"],
      "Gene Expression and Regulation": ["DNA to Protein", "Gene Control", "Biotech Evidence", "Expression Traps", "AP Transfer"],
      "Natural Selection": ["Selection", "Population Genetics", "Evolution Evidence", "Adaptation Traps", "AP Transfer"],
      "Ecology": ["Populations", "Ecosystems", "Ecology Data", "Food-Web Traps", "AP Transfer"]
    },
    "ap-chemistry": {
      "Atomic Structure and Properties": ["Atoms + Spectra", "Periodic Trends", "Particle Evidence", "Trend Traps", "AP Transfer"],
      "Molecular and Ionic Compound Structure": ["Bonding", "Molecular Shape", "Lewis Evidence", "Structure Traps", "AP Transfer"],
      "Intermolecular Forces and Properties": ["Forces", "Properties", "Particulate Evidence", "IMF Traps", "AP Transfer"],
      "Chemical Reactions": ["Reaction Types", "Stoichiometry", "Equation Evidence", "Reaction Traps", "AP Transfer"],
      "Kinetics": ["Rate Laws", "Mechanisms", "Kinetics Data", "Rate Traps", "AP Transfer"],
      "Thermodynamics": ["Energy", "Entropy", "Calorimetry Evidence", "Thermo Traps", "AP Transfer"],
      "Equilibrium": ["Equilibrium", "Shifts", "ICE Evidence", "Equilibrium Traps", "AP Transfer"],
      "Acids and Bases": ["pH + pKa", "Titrations", "Curve Evidence", "Acid-Base Traps", "AP Transfer"],
      "Applications of Thermodynamics": ["Electrochemistry", "Free Energy", "Cell Evidence", "Redox Traps", "AP Transfer"]
    },
    "ap-physics-1": {
      "Kinematics": ["Motion Graphs", "Vectors", "Graph Evidence", "Kinematics Traps", "AP Transfer"],
      "Force and Translational Dynamics": ["Forces", "Diagrams", "System Evidence", "Newton Traps", "AP Transfer"],
      "Work, Energy, and Power": ["Work + Energy", "Conservation", "Energy Evidence", "Energy Traps", "AP Transfer"],
      "Linear Momentum": ["Impulse", "Collisions", "Momentum Evidence", "System Traps", "AP Transfer"],
      "Torque and Rotational Dynamics": ["Torque", "Rotation", "Rotational Evidence", "Torque Traps", "AP Transfer"],
      "Energy and Momentum of Rotating Systems": ["Angular Momentum", "Rotational Energy", "System Evidence", "Rotation Traps", "AP Transfer"],
      "Oscillations": ["SHM", "Period + Frequency", "Oscillation Evidence", "SHM Traps", "AP Transfer"],
      "Fluids": ["Pressure", "Flow", "Fluid Evidence", "Fluid Traps", "AP Transfer"]
    }
  };
  return byCourse[course.id]?.[unitSpec.title] || null;
}

function choiceSet(correct, pool, seed) {
  const choices = new Array(4);
  const target = Math.abs(seed) % 4;
  choices[target] = correct;
  let i = seed;
  const uniquePool = uniq(pool.filter((item) => item && item !== correct).concat(fillerDistractors));
  for (let slot = 0; slot < 4; slot++) {
    if (choices[slot]) continue;
    choices[slot] = uniquePool[Math.abs(i) % uniquePool.length];
    i += 5;
  }
  return choices;
}

function standardRefs(course, unitSpec) {
  return uniq([...(unitSpec.standardRefs || []), course.standardsFramework]);
}

function questionTemplates(course, unitSpec, unitIndex, itemIndex, pool, round) {
  const c0 = unitSpec.concepts[0] || unitSpec.title;
  const c1 = unitSpec.concepts[1] || c0;
  const c2 = unitSpec.concepts[2] || c1;
  const c3 = unitSpec.concepts[3] || c2;
  const c4 = unitSpec.concepts[4] || c3;
  const skill = unitSpec.skills[itemIndex % unitSpec.skills.length] || "use evidence";
  const refs = standardRefs(course, unitSpec);
  const pass = round > 0 ? ` (spiral review pass ${round + 1})` : "";
  const artifact = courseArtifact(course);
  const move = reasoningMove(course);
  const task = examTask(course);
  const standard = compactStandard(course, unitSpec);
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
      prompt: `${course.label} - ${unitSpec.title}${pass}: which concept is the best anchor for ${articleFor(task)} ${task}?`,
      correctText: c0,
      choices: choiceSet(c0, pool, unitIndex + itemIndex),
      explanation: `${c0} is the anchor concept for ${unitSpec.title}. In ${standard}, students need to use that concept to reason through a task, not just recognize the word.`
    },
    {
      prompt: `A student reviewing ${course.label}: ${unitSpec.title}${pass} needs to show the skill "${skill}." Which action best fits that skill?`,
      correctText: `Use evidence to explain ${c1}.`,
      choices: choiceSet(`Use evidence to explain ${c1}.`, [`Guess from key words about ${c2}.`, `Repeat the definition of ${c0} only.`, `Ignore the context and pick the longest answer.`, `Use evidence to explain ${c1}.`], unitIndex),
      explanation: `The useful move is to connect evidence to ${c1}; this matches the standards/CED emphasis on reasoning and application.`
    },
    {
      prompt: `Which answer best avoids a common mistake about ${course.label}: ${unitSpec.title}${pass}?`,
      correctText: `Connect ${c0} to the prompt context before choosing.`,
      choices: choiceSet(`Connect ${c0} to the prompt context before choosing.`, [`Treat ${c0} as always meaning the same thing.`, `Skip the data or source because the topic is familiar.`, `Choose an unrelated fact from another unit.`, `Connect ${c0} to the prompt context before choosing.`], itemIndex),
      explanation: `Most missed review questions come from using familiar terms without matching them to the exact context.`
    },
    {
      prompt: `In ${articleFor(task)} ${task} about ${unitSpec.title}${pass}, what kind of evidence would be strongest?`,
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
      prompt: `${articleFor(task).toUpperCase()} ${task} asks students to interpret ${artifact} for ${unitSpec.title}${pass}. What should they do first?`,
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
    },
    {
      prompt: `${course.label} - ${unitSpec.title}${pass}: which pair best shows how two ideas in the unit connect?`,
      correctText: `${c0} connects to ${c1}.`,
      choices: choiceSet(`${c0} connects to ${c1}.`, [`${c3} replaces all evidence.`, `${c4} belongs only in an unrelated course.`, `${c1} proves that context never matters.`, `${c0} connects to ${c1}.`], itemIndex + 16),
      explanation: `The pair ${c0} and ${c1} belongs together in ${unitSpec.title}; students should explain the relationship rather than memorize each term alone.`
    },
    {
      prompt: `Which answer best describes the role of ${artifact} in a ${course.label} question on ${unitSpec.title}${pass}?`,
      correctText: `It provides evidence students must use before deciding.`,
      choices: choiceSet(`It provides evidence students must use before deciding.`, [`It is decoration that can be skipped.`, `It always gives the answer without reasoning.`, `It only matters if it repeats the vocabulary word.`, `It provides evidence students must use before deciding.`], itemIndex + 18),
      explanation: `The ${artifact} is part of the task. Students should read it for evidence, patterns, constraints, or context before selecting an answer.`
    },
    {
      prompt: `Which statement would be easiest to defend in ${unitSpec.title}${pass}?`,
      correctText: `${c0} can be explained with evidence from ${artifact}.`,
      choices: choiceSet(`${c0} can be explained with evidence from ${artifact}.`, [`${c0} is true because it sounds familiar.`, `${c1} does not need evidence.`, `Any answer with a longer sentence is correct.`, `${c0} can be explained with evidence from ${artifact}.`], itemIndex + 20),
      explanation: `Defensible answers connect a course concept to evidence from the task. That is the common pattern behind NYS, AP, and classroom review questions.`
    },
    {
      prompt: `A student misses a ${task} on ${unitSpec.title}${pass}. Which feedback would help most?`,
      correctText: `Reread the task, identify ${c0}, and explain the evidence step by step.`,
      choices: choiceSet(`Reread the task, identify ${c0}, and explain the evidence step by step.`, [`Memorize more unrelated vocabulary before trying again.`, `Skip explanation and only copy the correct letter.`, `Ignore ${c1} because it is probably a trick.`, `Reread the task, identify ${c0}, and explain the evidence step by step.`], itemIndex + 22),
      explanation: `Useful feedback turns the missed item into a process: read the task, identify the concept, and explain evidence.`
    },
    {
      prompt: `Which phrase best signals mastery of ${course.label}: ${unitSpec.title}${pass}?`,
      correctText: `${move}.`,
      choices: choiceSet(`${move}.`, [`pick the answer that looks longest`, `recall one disconnected definition`, `avoid using evidence because it slows the work`, `${move}.`], itemIndex + 24),
      explanation: `Mastery in ${course.label} means applying the unit idea with a clear reasoning move, especially when the question uses a new source or scenario.`
    },
    {
      prompt: `For ${unitSpec.title}${pass}, which unit vocabulary word should be reviewed with ${c0}?`,
      correctText: c1,
      choices: choiceSet(c1, pool, itemIndex + 26),
      explanation: `${c1} belongs near ${c0} in this unit's concept map. Reviewing them together helps students answer transfer questions.`
    },
    {
      prompt: `Which response would lose credit on a ${task} about ${unitSpec.title}${pass}?`,
      correctText: `A response that names ${c0} but never explains how it fits the evidence.`,
      choices: choiceSet(`A response that names ${c0} but never explains how it fits the evidence.`, [`A response that links ${c0} to ${c1}.`, `A response that cites evidence from ${artifact}.`, `A response that explains the reasoning in context.`, `A response that names ${c0} but never explains how it fits the evidence.`], itemIndex + 28),
      explanation: `A concept label without explanation is incomplete. Students need to connect the term to evidence, data, or task context.`
    },
    {
      prompt: `Which question should a student ask while reviewing ${course.label}: ${unitSpec.title}${pass}?`,
      correctText: `How does ${c0} help explain the evidence or scenario?`,
      choices: choiceSet(`How does ${c0} help explain the evidence or scenario?`, [`Which answer has the most familiar word?`, `Can I ignore the source because I studied last night?`, `Which option is written in the longest phrase?`, `How does ${c0} help explain the evidence or scenario?`], itemIndex + 30),
      explanation: `The best review question forces students to connect the concept to evidence and context.`
    },
    {
      prompt: `Which answer best fits the standard reference "${standard}" for ${unitSpec.title}${pass}?`,
      correctText: `Apply ${c0} in a new task and support the reasoning.`,
      choices: choiceSet(`Apply ${c0} in a new task and support the reasoning.`, [`Copy the unit title without explaining it.`, `Use a fact from a different course as the main proof.`, `Avoid the task because the standard is broad.`, `Apply ${c0} in a new task and support the reasoning.`], itemIndex + 32),
      explanation: `${standard} expects students to use knowledge and skill together. The correct answer applies ${c0} and supports the reasoning.`
    }
  ];
  return variants[itemIndex % variants.length] ? { ...base, ...variants[itemIndex % variants.length] } : null;
}

function buildQuestions(course) {
  const conceptPool = course.units.flatMap((u) => u.concepts);
  const out = [];
  const questionsPerUnit = Math.ceil(course.minQuestions / Math.max(1, course.units.length));
  for (let unitIndex = 0; unitIndex < course.units.length; unitIndex++) {
    const unitSpec = course.units[unitIndex];
    for (let itemIndex = 0; itemIndex < questionsPerUnit; itemIndex++) {
      const round = Math.floor(itemIndex / 18);
      const q = questionTemplates(course, unitSpec, unitIndex, itemIndex, conceptPool, round);
      out.push({
        id: `${course.id}-${String(out.length + 1).padStart(3, "0")}`,
        ...q
      });
    }
  }
  return out.slice(0, course.minQuestions);
}

function answerAliases(answer) {
  const base = String(answer || "").trim();
  const variants = [
    base,
    base.toLowerCase(),
    base.replace(/\band\b/gi, "&"),
    base.replace(/&/g, "and"),
    base.replace(/\bU\.S\.\b/g, "US"),
    base.replace(/\bUnited States\b/g, "U.S."),
    base.replace(/\s+/g, " ")
  ].filter(Boolean);
  return uniq(variants);
}

function valueSkill(value) {
  if (value <= 100) return "identify the idea accurately";
  if (value <= 200) return "match the idea to a course context";
  if (value <= 300) return "explain the reasoning behind the idea";
  if (value <= 400) return "use evidence, data, or text to defend the idea";
  return "transfer the idea to a harder exam-style situation";
}

function boardCategorySpecs(course, unitSpec, variant) {
  const profile = unitProfile(course, unitSpec);
  const overrideNames = boardCategoryNameOverrides(course, unitSpec);
  const termA = ensureFive(profile.terms.slice(0, 5), profile.terms);
  const termB = ensureFive(profile.terms.slice(5), profile.terms.slice(1).concat(profile.terms));
  const names = overrideNames || [
    categoryPairName(termA[0], termA[1], `${titleCaseCompact(unitSpec.title)} Terms`),
    categoryPairName(termB[0], termB[1], `${titleCaseCompact(unitSpec.title)} Connections`),
    /Math|Mathematics|Statistics|Calculus/.test(course.subjectArea) ? "Representations" :
      /Science|Physics|Chemistry|Biology|Environmental/.test(course.subjectArea) ? "Models + Data" :
        /ELA|English|Languages/.test(course.subjectArea) ? "Texts + Evidence" :
          /Arts/.test(course.subjectArea) ? "Works + Choices" :
            /Computer|Technology/.test(course.subjectArea) ? "Systems + Data" : "Sources + Evidence",
    /Math|Mathematics|Statistics|Calculus/.test(course.subjectArea) ? "Procedure Traps" :
      /Science|Physics|Chemistry|Biology|Environmental/.test(course.subjectArea) ? "Reasoning Traps" :
        /ELA|English|Languages/.test(course.subjectArea) ? "Reading Traps" : "Common Traps",
    course.ap ? "AP Transfer" : (course.assessmentSourceIds || []).length ? "Exam Transfer" : "Applied Review"
  ];
  const reviewCategories = [
    { name: names[0], kind: "term", pool: termA },
    { name: names[1], kind: "term", pool: termB },
    { name: names[2], kind: "evidence", pool: profile.evidence },
    { name: names[3], kind: "trap", pool: profile.traps },
    { name: names[4], kind: "application", pool: profile.applications }
  ];
  if (variant.id === "challenge") {
    return [
      { name: names[0], kind: "term", pool: termA },
      { name: "Evidence Moves", kind: "skill", pool: profile.skills },
      { name: names[2], kind: "evidence", pool: profile.evidence },
      { name: "Error Analysis", kind: "trap", pool: profile.traps },
      { name: names[4], kind: "application", pool: profile.applications }
    ];
  }
  if (variant.id === "sprint") {
    return [
      { name: names[0], kind: "term", pool: termA },
      { name: names[1], kind: "term", pool: termB },
      { name: "Exam Signals", kind: "evidence", pool: profile.evidence },
      { name: "Trap Door", kind: "trap", pool: profile.traps },
      { name: "Big Picture", kind: "application", pool: profile.applications }
    ];
  }
  return reviewCategories;
}

function categoryKind(categoryIndex) {
  return ["term", "skill", "evidence", "trap", "application"][categoryIndex] || "term";
}

function cluePrompt(course, unitSpec, categoryName, categoryIndex, value, answer, variant, kind = categoryKind(categoryIndex)) {
  const task = examTask(course);
  const standard = compactStandard(course, unitSpec);
  const gloss = clueGloss(answer, kind, course, unitSpec);
  const opener = value >= 500
    ? `On a hard ${task} tied to ${standard},`
    : value >= 300
      ? `In ${course.label} ${unitSpec.title},`
      : `For ${unitSpec.title},`;
  if (kind === "term") return `${opener} this term ${gloss}.`;
  if (kind === "skill") return `${opener} this reasoning move asks students to ${gloss}.`;
  if (kind === "evidence") return `${opener} this is the evidence source that ${gloss}.`;
  if (kind === "trap") return `${opener} this trap happens when a student ${gloss}.`;
  return `${opener} this task type ${gloss}.`;
}

function richExplanation(course, unitSpec, categoryName, categoryIndex, value, answer, variant, kind = categoryKind(categoryIndex)) {
  const standard = compactStandard(course, unitSpec);
  const skill = valueSkill(value);
  const frame = variant.id === "review" ? "review board" : variant.id === "challenge" ? "challenge board" : "final sprint board";
  const gloss = clueGloss(answer, kind, course, unitSpec);
  if (kind === "skill") {
    return `${answer} is the right move for this ${frame}: students have to ${gloss}, then explain how the evidence or context supports the answer.`;
  }
  if (kind === "trap") {
    return `${answer} is the mistake to watch for: a student ${gloss}. The fix is to reread the task, locate the evidence, and explain how the evidence supports the unit concept.`;
  }
  const explanations = [
    `${answer} is the right term because it ${gloss}. A strong ${course.label} response then uses that idea to ${skill} and connects it to ${standard}.`,
    `${answer} matters because it ${gloss}. Students should use it as evidence, not decoration, before making a claim about ${unitSpec.title}.`,
    `${answer} is the transfer target because it ${gloss}. This is where students show they can apply ${unitSpec.title} beyond memorized vocabulary.`
  ];
  if (kind === "evidence") return explanations[1];
  if (kind === "application") return explanations[2];
  return explanations[0];
}

function buildJeopardyBoard(course, unitSpec, unitIndex, variant = JEOPARDY_VARIANTS[0]) {
  const baseId = `${course.id}-unit-${String(unitIndex + 1).padStart(2, "0")}`;
  const id = variant.id === "review" ? baseId : `${baseId}-${variant.id}`;
  const categorySpecs = boardCategorySpecs(course, unitSpec, variant);
  const categories = categorySpecs.map((spec, categoryIndex) => ({
    name: spec.name,
    clues: [100, 200, 300, 400, 500].map((value, valueIndex) => {
      const pool = spec.pool || [];
      const kind = spec.kind || categoryKind(categoryIndex);
      const answer = pool[valueIndex % pool.length] || unitSpec.title;
      return {
        value,
        clue: cluePrompt(course, unitSpec, spec.name, categoryIndex, value, answer, variant, kind),
        answer,
        aliases: answerAliases(answer),
        explanation: richExplanation(course, unitSpec, spec.name, categoryIndex, value, answer, variant, kind),
        daily: categoryIndex === 3 && valueIndex === (unitIndex + (variant.id === "challenge" ? 1 : variant.id === "sprint" ? 2 : 0)) % 5,
        rigor: {
          value,
          skill: valueSkill(value),
          alignment: course.standardsFramework,
          sourceAuthority: course.standardsSourceId,
          boardVariant: variant.id,
          categoryKind: kind
        }
      };
    })
  }));
  return {
    id,
    baseUnitBoardId: baseId,
    variantId: variant.id,
    variantLabel: variant.label,
    variantFocus: variant.focus,
    courseId: course.id,
    courseLabel: course.label,
    subjectArea: course.subjectArea,
    gradeBand: course.gradeBand,
    unit: unitSpec.title,
    title: `${course.label}: ${unitSpec.title} ${variant.shortLabel} Jeopardy`,
    subtitle: `${variant.label} for ${course.label} ${unitSpec.title}.`,
    standardsFramework: course.standardsFramework,
    sourceAuthority: course.standardsSourceId,
    assessmentSourceIds: course.assessmentSourceIds,
    categories,
    final: {
      category: "Synthesis",
      clue: `This one-sentence response best explains how a student should connect ${unitSpec.title} to evidence in ${course.label}.`,
      answer: `Use evidence to explain the unit concept in context.`,
      aliases: answerAliases("Use evidence to explain the unit concept in context."),
      explanation: `Final Jeopardy checks whether students can move beyond recall. A strong response names the relevant ${unitSpec.title} idea, uses evidence from the prompt or source, and explains the connection in context. That is the common scoring habit across NYS standards-aligned tasks and AP CED-style review.`
    },
    alignment: {
      course: course.label,
      unit: unitSpec.title,
      standardSet: course.standardsFramework,
      sourceAuthority: course.standardsSourceId,
      variant: variant.label,
      boardShape: "5 categories x 5 clues, values 100-500, one Daily Double, Final Jeopardy",
      difficultyLadder: {
        100: "identify the idea accurately",
        200: "match the idea to course context",
        300: "explain reasoning",
        400: "use evidence or data",
        500: "transfer to a harder task"
      }
    }
  };
}

function generatedPracticePages(course) {
  const firstUnits = course.units.slice(0, 4);
  const sourceIds = course.assessmentSourceIds.length ? course.assessmentSourceIds : [course.standardsSourceId];
  const sourceLabels = sourceIds.map((id) => sourceById(id)?.label || id);
  return [
    {
      id: `${course.id}-practice-page-1`,
      page: 1,
      title: `${course.label} Practice Source Packet`,
      kind: "Course overview",
      path: `assets/generated-practice-pages/${course.id}/page-001.svg`,
      sourceLabel: course.ap ? "AP CED-aligned public practice packet" : "NYS standards-aligned practice packet",
      sourceIds,
      unit: "Course Review",
      prompts: [
        `Course: ${course.label}`,
        `Framework: ${course.standardsFramework}`,
        `Official source family: ${sourceLabels.join(", ")}`,
        `Use this page like the front page of a practice form: check course, unit, and source authority before answering.`
      ]
    },
    {
      id: `${course.id}-practice-page-2`,
      page: 2,
      title: "Multiple-Choice Stimulus Set",
      kind: "MCQ source page",
      path: `assets/generated-practice-pages/${course.id}/page-002.svg`,
      sourceLabel: "Released-form style stimulus page",
      sourceIds,
      unit: firstUnits[0]?.title || "Unit 1",
      prompts: [
        `Stimulus A: ${firstUnits[0]?.concepts?.slice(0, 3).join(", ") || course.label}`,
        `Stimulus B: ${firstUnits[1]?.concepts?.slice(0, 3).join(", ") || firstUnits[0]?.title || course.label}`,
        `Skill focus: read the source, graph, example, or scenario before choosing an answer.`,
        `Question bank items should cite this packet when the task requires evidence from a source.`
      ]
    },
    {
      id: `${course.id}-practice-page-3`,
      page: 3,
      title: "Constructed Response Packet",
      kind: "Writing source page",
      path: `assets/generated-practice-pages/${course.id}/page-003.svg`,
      sourceLabel: "Course writing task page",
      sourceIds,
      unit: firstUnits[2]?.title || firstUnits[0]?.title || "Written Response",
      prompts: [
        `Task: make a claim about ${firstUnits[2]?.title || firstUnits[0]?.title || course.label}.`,
        `Evidence: use a named concept such as ${firstUnits[2]?.concepts?.[0] || firstUnits[0]?.concepts?.[0] || "course evidence"}.`,
        `Reasoning: explain why the evidence proves the claim.`,
        `Scoring: accurate concept, evidence or process, clear explanation.`
      ]
    },
    {
      id: `${course.id}-practice-page-4`,
      page: 4,
      title: "Rubric and Unit Coverage",
      kind: "Rubric page",
      path: `assets/generated-practice-pages/${course.id}/page-004.svg`,
      sourceLabel: "Teacher review and scoring guide",
      sourceIds,
      unit: "Rubric",
      prompts: [
        `Units covered: ${course.units.slice(0, 8).map((u) => u.title).join("; ")}`,
        `Multiple choice: answer from evidence, not just familiar wording.`,
        `Written response: claim, evidence, reasoning, and course vocabulary.`,
        `Teacher note: exact released Regents/AP forms stay in the dedicated official practice runners when digitized.`
      ]
    }
  ];
}

function officialLinksForCourse(course) {
  const ids = course.assessmentSourceIds.length ? course.assessmentSourceIds : [course.standardsSourceId];
  return ids.map((id) => {
    const source = sourceById(id) || { id, label: id, url: "" };
    return { id: source.id || id, label: source.label || id, url: source.url || "" };
  });
}

function practiceExamFamily(course) {
  if (course.ap) return "AP course practice";
  if ((course.assessmentSourceIds || []).some((id) => /regents/.test(id))) return "NYSED Regents practice";
  if ((course.assessmentSourceIds || []).some((id) => /grades-3-8/.test(id))) return "NYSED Grades 3-8 released-test practice";
  return "NYS standards course practice";
}

function exactRunnerStatus(course) {
  const exactRegents = new Set(["global-10", "us-history"]);
  const exactAp = new Set(["ap-us-history", "ap-world-history", "ap-european-history", "ap-psychology", "ap-macroeconomics", "ap-microeconomics"]);
  if (exactRegents.has(course.id)) return "exact released-form runner registered";
  if (exactAp.has(course.id)) return "public AP practice PDF runner registered";
  if (course.ap) return "CED-aligned generated practice with official AP source links; full public MCQ PDF added when College Board publishes one";
  if ((course.assessmentSourceIds || []).length) return "released-source companion practice with official NYSED source links; exact form can be digitized into the Regents runner";
  return "standards-aligned generated practice";
}

function practiceSectionPlan(course) {
  if (course.ap) {
    if (/art|drawing/.test(course.id)) {
      return [
        { id: "portfolio-review", label: "Portfolio evidence review", count: 15, sourcePolicy: "original portfolio-choice items aligned to AP Art and Design portfolio requirements" },
        { id: "written-evidence", label: "Sustained investigation written evidence", count: 4, sourcePolicy: "CED portfolio reflection rubric estimate" }
      ];
    }
    if (/seminar|research/.test(course.id)) {
      return [
        { id: "source-analysis", label: "AP Capstone source analysis", count: 24, sourcePolicy: "original source-analysis items aligned to AP Capstone skills" },
        { id: "performance-task", label: "Performance task writing", count: 4, sourcePolicy: "CED-style research and presentation rubric estimate" }
      ];
    }
    if (/language|latin/.test(course.id)) {
      return [
        { id: "interpretive", label: "Interpretive communication", count: 30, sourcePolicy: "original AP-style authentic-source items aligned to themes and modes" },
        { id: "presentational", label: "Presentational and interpersonal tasks", count: 4, sourcePolicy: "CED communication rubric estimate" }
      ];
    }
    return [
      { id: "mcq", label: "AP-style multiple choice", count: 30, sourcePolicy: "original AP-style items aligned to CED units unless a public College Board PDF is explicitly registered" },
      { id: "frq", label: "Course-appropriate free response or performance task", count: 3, sourcePolicy: "CED skill rubric estimate" }
    ];
  }
  if (/^ela-|^english-/.test(course.id)) {
    return [
      { id: "reading", label: "Reading comprehension and evidence", count: 24, sourcePolicy: "NYSED released ELA item pattern or exact form when digitized" },
      { id: "writing", label: "Argument, informative, or text-analysis writing", count: 2, sourcePolicy: "NYSED writing-rubric shape" }
    ];
  }
  if (/^math-|algebra|geometry|precalculus|calculus|statistics/.test(course.id)) {
    return [
      { id: "selected-response", label: "Selected response and short constructed response", count: 24, sourcePolicy: "NYSED mathematics released-test or Regents pattern" },
      { id: "constructed-response", label: "Multi-step constructed response", count: 4, sourcePolicy: "NYSED mathematics process/rubric shape" }
    ];
  }
  if (/^science-|earth-science|biology|chemistry|physics|environmental-science/.test(course.id)) {
    return [
      { id: "stimulus-mcq", label: "Stimulus-based science multiple choice", count: 28, sourcePolicy: "NYSED released science or Regents pattern" },
      { id: "lab-constructed-response", label: "Lab, data, and constructed response", count: 4, sourcePolicy: "NYSED science practice/rubric shape" }
    ];
  }
  if ((course.assessmentSourceIds || []).some((id) => /nysed|regents/.test(id))) {
    return [
      { id: "released-mcq", label: "Released NYS multiple choice", count: 28, sourcePolicy: "official released NYSED item pattern or exact released form when digitized" },
      { id: "constructed-response", label: "Constructed response", count: 3, sourcePolicy: "released NYSED rubric shape where available" }
    ];
  }
  return [
    { id: "standards-mcq", label: "Standards-aligned multiple choice", count: 24, sourcePolicy: "original items aligned to NYSED standards" },
    { id: "application", label: "Application or performance task", count: 3, sourcePolicy: "original standards-aligned rubric" }
  ];
}

function buildPracticeBlueprint(course) {
  const released = course.assessmentSourceIds.filter((id) => id.includes("nysed") || id.includes("regents"));
  const sourceMode = released.length ? "released-nys-source-backed" : course.ap ? "ap-ced-original-with-public-sample-links" : "standards-aligned-original";
  const questionsPerUnit = Math.ceil(course.minQuestions / Math.max(1, course.units.length));
  const sampleCount = Math.min(8, questionsPerUnit);
  const sourcePages = generatedPracticePages(course);
  const officialPracticeLinks = officialLinksForCourse(course);
  return {
    id: `${course.id}-practice-blueprint`,
    courseId: course.id,
    courseLabel: course.label,
    subjectArea: course.subjectArea,
    gradeBand: course.gradeBand,
    sourceMode,
    standardsFramework: course.standardsFramework,
    officialSourceIds: course.assessmentSourceIds,
    officialPracticeLinks,
    examFamily: practiceExamFamily(course),
    exactRunnerStatus: exactRunnerStatus(course),
    sourcePages,
    sourcePacket: {
      title: `${course.label} Practice Source Packet`,
      mode: released.length ? "released-form companion packet" : course.ap ? "AP CED companion packet" : "NYS standards companion packet",
      pageCount: sourcePages.length,
      officialPracticeLinks,
      viewerContract: "Uses assets/document-viewer.js with data-source-page-img, official-page-image, and Expand Source controls."
    },
    sectionPlan: practiceSectionPlan(course),
    units: course.units.map((u) => ({
      unit: u.title,
      standardRefs: standardRefs(course, u),
      sampledQuestionIds: Array.from({ length: sampleCount }, (_, i) => `${course.id}-${String((course.units.indexOf(u) * questionsPerUnit + i + 1)).padStart(3, "0")}`)
    })),
    writtenTasks: course.units.slice(0, 4).map((u, index) => ({
      id: `${course.id}-written-${index + 1}`,
      unit: u.title,
      prompt: `Use the ${course.label} unit "${u.title}" to answer a constructed response. Make a claim, use a specific concept such as ${u.concepts[0]}, and explain the evidence or process in context.`,
      scoringFocus: ["accurate course concept", "evidence or process", "clear explanation"]
    }))
  };
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(text, max = 74) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function sourcePageSvg(course, page) {
  const palette = course.ap ? ["#ff7bcc", "#7af0ff"] :
    course.subjectArea === "Mathematics" ? ["#ffd15c", "#72e9ff"] :
    course.subjectArea === "Science" ? ["#74f0aa", "#72e9ff"] :
    course.subjectArea === "ELA" ? ["#b892ff", "#ffd15c"] :
    ["#72e9ff", "#ffd15c"];
  const promptLines = page.prompts.flatMap((prompt) => wrapText(prompt, 68));
  const unitLines = course.units.slice(0, 8).map((u, index) => `${index + 1}. ${u.title}`);
  const bodyLines = [
    `${page.kind.toUpperCase()} - PAGE ${page.page}`,
    "",
    ...promptLines,
    "",
    "COURSE UNIT MAP",
    ...unitLines
  ].slice(0, 26);
  const lineText = bodyLines.map((line, i) =>
    `<text x="92" y="${286 + i * 30}" class="${line === "" ? "blank" : line === line.toUpperCase() && line.length < 38 ? "section" : "body"}">${xmlEscape(line || " ")}</text>`
  ).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="1500" viewBox="0 0 1120 1500" role="img" aria-label="${xmlEscape(page.title)}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffdf4"/>
      <stop offset=".55" stop-color="#f4f0df"/>
      <stop offset="1" stop-color="#e7dfc4"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${palette[0]}"/>
      <stop offset="1" stop-color="${palette[1]}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="20" stdDeviation="20" flood-color="#000" flood-opacity=".25"/>
    </filter>
  </defs>
  <rect width="1120" height="1500" fill="#15100b"/>
  <rect x="46" y="42" width="1028" height="1416" rx="22" fill="url(#paper)" filter="url(#shadow)"/>
  <rect x="46" y="42" width="1028" height="18" rx="9" fill="url(#bar)"/>
  <rect x="92" y="106" width="936" height="112" rx="14" fill="#12182b"/>
  <text x="126" y="154" font-family="Arial Black, Impact, sans-serif" font-size="34" fill="#fff7d7">${xmlEscape(course.label)}</text>
  <text x="126" y="194" font-family="Arial, sans-serif" font-size="20" fill="#cfe8ff">${xmlEscape(page.title)}</text>
  <text x="864" y="180" font-family="Arial Black, Impact, sans-serif" font-size="44" text-anchor="middle" fill="${palette[0]}">P${page.page}</text>
  <rect x="92" y="246" width="936" height="900" rx="14" fill="#fffaf0" stroke="#d0c5a6" stroke-width="2"/>
  ${lineText}
  <rect x="92" y="1190" width="936" height="156" rx="14" fill="#141a2d"/>
  <text x="122" y="1234" font-family="Arial Black, Impact, sans-serif" font-size="25" fill="${palette[1]}">VIEWER CONTRACT</text>
  <text x="122" y="1274" font-family="Arial, sans-serif" font-size="21" fill="#f8fbff">Zoomable practice page. Use Expand Source, +/- zoom, fit, keyboard shortcuts, and page strip.</text>
  <text x="122" y="1314" font-family="Arial, sans-serif" font-size="20" fill="#d7e4ff">${xmlEscape(page.sourceLabel)}</text>
  <text x="92" y="1408" font-family="Arial, sans-serif" font-size="18" fill="#70684f">Generated from NYS/AP course taxonomy for classroom practice. Exact public released forms remain in Regents/AP practice runners when registered.</text>
  <style>
    .section { font: 700 23px Arial, sans-serif; fill: #13192b; }
    .body { font: 21px Arial, sans-serif; fill: #21242d; }
    .blank { font: 10px Arial, sans-serif; fill: transparent; }
  </style>
</svg>
`;
}

function writePracticePageAssets(courses) {
  fs.rmSync(PRACTICE_PAGE_DIR, { recursive: true, force: true });
  for (const course of courses) {
    for (const page of generatedPracticePages(course)) {
      const file = path.join(ROOT, page.path);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, sourcePageSvg(course, page), "utf8");
    }
  }
}

function extractGamePayload(text, file) {
  const match = text.match(/const GAME = (\{[\s\S]*?\});\s*(?:const|let|var)\s+STORAGE_KEY/);
  if (!match) throw new Error(`Could not locate GAME payload in ${file}`);
  return JSON.parse(match[1]);
}

function decodeManifestPath(value) {
  try {
    return decodeURIComponent(String(value || "").split("?")[0].split("#")[0]);
  } catch {
    return String(value || "").split("?")[0].split("#")[0];
  }
}

function socialStudyCourseId(label, file = "") {
  const text = `${label || ""} ${file || ""}`.toLowerCase();
  if (text.includes("global-9") || text.includes("grade 9 global")) return "global-9";
  if (text.includes("global-10") || text.includes("grade 10 global")) return "global-10";
  if (text.includes("us-history") || text.includes("grade 11 u.s") || text.includes("grade 11 us")) return "us-history";
  if (text.includes("grade-5") || text.includes("grade 5")) return "grade-5";
  if (text.includes("grade-6") || text.includes("grade 6")) return "grade-6";
  if (text.includes("grade-7") || text.includes("grade 7")) return "grade-7";
  if (text.includes("grade-8") || text.includes("grade 8")) return "grade-8";
  if (text.includes("apush") || text.includes("ap united states history")) return "ap-us-history";
  if (text.includes("ap-world") || text.includes("ap world history")) return "ap-world-history";
  if (text.includes("ap-european") || text.includes("ap european")) return "ap-european-history";
  if (text.includes("ap-human") || text.includes("ap human geography")) return "ap-human-geography";
  if (text.includes("ap-us-government") || text.includes("ap-government") || text.includes("ap united states government") || text.includes("ap u.s. government")) return "ap-us-government";
  if (text.includes("ap-psychology") || text.includes("ap psychology")) return "ap-psychology";
  if (text.includes("ap-macro")) return "ap-macroeconomics";
  if (text.includes("ap-micro")) return "ap-microeconomics";
  if (text.includes("economics")) return "economics";
  if (text.includes("civics") || text.includes("government")) return "us-government";
  return "";
}

function isStaticJeopardyBoard(game) {
  if (game.generatedBy || game.isGeneratedJeopardy) return false;
  const file = decodeManifestPath(game.file || "");
  if (!file.endsWith(".html") || !/Jeopardy/i.test(file)) return false;
  return fs.existsSync(path.join(ROOT, file));
}

function derivedChoices(correct, sameCategoryAnswers, boardAnswers, seed) {
  const distractors = uniq(sameCategoryAnswers.concat(boardAnswers)).filter((answer) => slug(answer) !== slug(correct));
  const filler = ["contextualization", "claim evidence reasoning", "representative government", "economic interdependence", "human rights"];
  return choiceSet(correct, distractors.concat(filler), seed);
}

function boardDerivedQuestion(meta, game, category, clue, clueIndex, boardAnswers) {
  const course = socialStudyCourseId(meta.course || game.exam || game.course || "", meta.file || "");
  if (!course) return null;
  const categoryAnswers = (category.clues || []).map((row) => row.answer).filter(Boolean);
  const value = Number(clue.value || 0);
  return {
    id: `board-derived-${course}-${slug(game.slug || meta.id || game.title)}-${slug(category.name)}-${value || clueIndex + 1}`,
    prompt: `${game.title} · ${category.name} · $${value || "Final"}: ${clue.clue}`,
    choices: derivedChoices(clue.answer, categoryAnswers, boardAnswers, clueIndex + value),
    correctText: String(clue.answer || "").trim(),
    topic: `${game.title} · ${category.name}`,
    explanation: String(clue.explanation || clue.sourceExplanation || `Review ${game.title} and connect the answer to the clue.`).trim(),
    domain: "Social Studies",
    subjectArea: meta.subject || "Social Studies",
    gradeBand: meta.grade || "",
    standardRefs: uniq([game.alignment?.standardSet, game.alignment?.examTarget, "NYS Social Studies Framework"]).filter(Boolean),
    sourceAuthority: "existing-named-social-studies-jeopardy-board",
    assessmentSourceId: (game.alignment?.examTarget || "").includes("Regents") ? "nysed-social-studies-regents-pattern" : "course-jeopardy-board",
    itemMode: "jeopardy-board-derived",
    course
  };
}

function writeSocialStudiesBoardBank() {
  for (const file of fs.readdirSync(FRAG_DIR)) {
    if (/^jeopardy-derived-.*\.json$/.test(file)) fs.rmSync(path.join(FRAG_DIR, file), { force: true });
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "games.json"), "utf8"));
  const byCourse = new Map();
  for (const meta of manifest.filter(isStaticJeopardyBoard)) {
    const file = decodeManifestPath(meta.file);
    let game;
    try {
      game = extractGamePayload(fs.readFileSync(path.join(ROOT, file), "utf8"), file);
    } catch {
      continue;
    }
    const course = socialStudyCourseId(meta.course || game.exam || game.course || "", meta.file || "");
    if (!course) continue;
    const boardAnswers = (game.categories || []).flatMap((category) => (category.clues || []).map((clue) => clue.answer)).filter(Boolean);
    const questions = [];
    for (const category of game.categories || []) {
      (category.clues || []).forEach((clue, index) => {
        const question = boardDerivedQuestion(meta, game, category, clue, index, boardAnswers);
        if (question) questions.push(question);
      });
    }
    if (game.final?.answer && game.final?.clue) {
      const finalQuestion = boardDerivedQuestion(meta, game, { name: game.final.category || "Final Jeopardy", clues: [game.final] }, { ...game.final, value: 700 }, 700, boardAnswers);
      if (finalQuestion) questions.push(finalQuestion);
    }
    if (!byCourse.has(course)) byCourse.set(course, { course, courseLabel: meta.course || game.exam || course, questions: [] });
    byCourse.get(course).questions.push(...questions);
  }
  for (const [course, fragment] of byCourse) {
    fragment.questions = fragment.questions.slice(0, 1200);
    writeJson(path.join(FRAG_DIR, `jeopardy-derived-${course}.json`), fragment);
  }
  return Array.from(byCourse.values()).reduce((sum, fragment) => sum + fragment.questions.length, 0);
}

function countFragmentQuestions() {
  const seenByCourse = new Map();
  let total = 0;
  for (const file of fs.readdirSync(FRAG_DIR).filter((name) => name.endsWith(".json") && !name.startsWith("._")).sort()) {
    try {
      const fragment = JSON.parse(fs.readFileSync(path.join(FRAG_DIR, file), "utf8"));
      if (!fragment.course || !Array.isArray(fragment.questions)) continue;
      if (!seenByCourse.has(fragment.course)) seenByCourse.set(fragment.course, new Set());
      const seen = seenByCourse.get(fragment.course);
      for (const question of fragment.questions) {
        if (!question?.prompt || !question?.correctText || !Array.isArray(question.choices) || question.choices.length !== 4 || !question.choices.includes(question.correctText)) continue;
        const key = question.prompt.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        total += 1;
      }
    } catch {
      continue;
    }
  }
  return total;
}

function boardSummary(board) {
  return {
    id: board.id,
    baseUnitBoardId: board.baseUnitBoardId,
    variantId: board.variantId,
    variantLabel: board.variantLabel,
    variantFocus: board.variantFocus,
    courseId: board.courseId,
    courseLabel: board.courseLabel,
    subjectArea: board.subjectArea,
    gradeBand: board.gradeBand,
    unit: board.unit,
    title: board.title,
    subtitle: board.subtitle,
    standardsFramework: board.standardsFramework,
    sourceAuthority: board.sourceAuthority,
    categories: (board.categories || []).map((category) => ({ name: category.name })),
    hasFinal: Boolean(board.final),
    clueCount: (board.categories || []).reduce((sum, category) => sum + (category.clues || []).length, 0),
    shard: `data/generated-jeopardy-boards/${board.courseId}.json`
  };
}

function writeJeopardyShards(boards) {
  fs.rmSync(JEOPARDY_SHARD_DIR, { recursive: true, force: true });
  fs.mkdirSync(JEOPARDY_SHARD_DIR, { recursive: true });
  const byCourse = new Map();
  for (const board of boards) {
    if (!byCourse.has(board.courseId)) byCourse.set(board.courseId, []);
    byCourse.get(board.courseId).push(board);
  }
  for (const [courseId, courseBoards] of byCourse) {
    writeJson(path.join(JEOPARDY_SHARD_DIR, `${courseId}.json`), {
      version: VERSION,
      generatedAt: new Date().toISOString(),
      courseId,
      boardCount: courseBoards.length,
      boards: courseBoards
    });
  }
  return {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    mode: "lightweight-board-index",
    boardCount: boards.length,
    shardCount: byCourse.size,
    boards: boards.map(boardSummary)
  };
}

function generatedCatalogEntries(boards, exams) {
  const boardEntries = boards.map((board) => ({
    id: `generated-jeopardy-${board.id}`,
    title: board.title,
    subtitle: `${board.variantLabel}: ${board.variantFocus}. Includes typed responses, answer explanations, one Daily Double, and Final Jeopardy.`,
    day: board.unit,
    course: board.courseLabel,
    subject: board.subjectArea || board.standardsFramework,
    grade: board.gradeBand || "",
    gameType: "Jeopardy",
    file: `games/generated-jeopardy/index.html?board=${encodeURIComponent(board.id)}`,
    originalFile: `${board.title}.html`,
    collection: "generated-jeopardy",
    generatedBy: "scripts/generate-all-subject-content.mjs",
    generatedBoardId: board.id,
    isGeneratedJeopardy: true,
    categories: (board.categories || []).map((category) => category.name),
    clueCount: 25,
    hasFinal: true,
    cardArt: "assets/cabinet/category-tile-jeopardy.webp",
    thumbnail: "assets/game-thumbnails/generated-jeopardy.webp",
    tags: [
      "all subjects",
      "generated jeopardy",
      "unit review",
      board.variantId,
      board.sourceAuthority,
      board.standardsFramework,
      board.courseLabel,
      board.unit
    ].filter(Boolean)
  }));

  const courseExamEntries = exams.map((exam) => ({
    id: `generated-practice-exam-${exam.courseId}`,
    title: `${exam.courseLabel} Practice Exam`,
    subtitle: `Course-specific practice exam with MCQs, written response prompts, and ${exam.sourcePages?.length || 0} zoomable source pages using the shared document viewer.`,
    day: "Practice Exam",
    course: exam.courseLabel,
    subject: exam.subjectArea || "Practice Exams",
    grade: exam.gradeBand || "",
    gameType: "Full Practice Exam",
    file: `games/generated-practice-exam/index.html?course=${encodeURIComponent(exam.courseId)}`,
    originalFile: `${exam.courseLabel} Practice Exam.html`,
    collection: "generated-practice-exam",
    generatedBy: "scripts/generate-all-subject-content.mjs",
    generatedPracticeExamId: exam.id,
    categories: ["Practice Exam", "Zoomable Sources", "Written Response", exam.sourceMode].filter(Boolean),
    clueCount: (exam.sectionPlan || []).reduce((sum, section) => sum + Number(section.count || 0), 0),
    hasFinal: false,
    cardArt: "assets/cabinet/category-tile-practice.webp",
    thumbnail: "assets/game-thumbnails/generated-practice-exam.webp",
    tags: ["all subjects", "practice exam", "zoomable source pages", exam.courseLabel, exam.sourceMode].filter(Boolean)
  }));

  const unitExamEntries = exams.flatMap((exam) => (exam.units || []).map((unit, index) => ({
    id: `generated-unit-practice-${exam.courseId}-unit-${String(index + 1).padStart(2, "0")}`,
    title: `${exam.courseLabel}: ${unit.unit} Practice`,
    subtitle: `Unit-focused practice set with source packet pages, MCQs, and a constructed-response task for ${unit.unit}.`,
    day: unit.unit,
    course: exam.courseLabel,
    subject: exam.subjectArea || "Practice Exams",
    grade: exam.gradeBand || "",
    gameType: "Unit Practice Exam",
    file: `games/generated-practice-exam/index.html?course=${encodeURIComponent(exam.courseId)}&unit=${encodeURIComponent(unit.unit)}&autorun=1`,
    originalFile: `${exam.courseLabel} ${unit.unit} Practice.html`,
    collection: "generated-practice-exam",
    generatedBy: "scripts/generate-all-subject-content.mjs",
    generatedPracticeExamId: exam.id,
    generatedPracticeUnit: unit.unit,
    categories: ["Unit Practice", "Zoomable Sources", "Constructed Response"].concat(unit.standardRefs || []),
    clueCount: Math.max(10, Math.min(20, (unit.sampledQuestionIds || []).length + 8)),
    hasFinal: false,
    cardArt: "assets/cabinet/category-tile-practice.webp",
    thumbnail: "assets/game-thumbnails/generated-practice-exam.webp",
    tags: ["all subjects", "unit practice", "zoomable source pages", exam.courseLabel, unit.unit].filter(Boolean)
  })));

  return boardEntries.concat(courseExamEntries, unitExamEntries);
}

function expandGamesManifest(boards, exams, bankTotal) {
  const manifestFile = path.join(ROOT, "games.json");
  if (!fs.existsSync(manifestFile)) return [];
  const base = JSON.parse(fs.readFileSync(manifestFile, "utf8"))
    .filter((game) => !game.generatedBy && !/^generated-jeopardy-/.test(game.id || "") && !/^generated-practice-exam-/.test(game.id || "") && !/^generated-unit-practice-/.test(game.id || ""));
  for (const game of base) {
    if (game.id === "generated-jeopardy") {
      game.subtitle = `${boards.length} generated unit Jeopardy boards across NYS grades 5-12 and AP courses, with 5x5 boards, Daily Doubles, Final Jeopardy, typed responses, and explanations.`;
      game.clueCount = boards.length * 25;
      game.tags = uniq([...(game.tags || []), "thousands-scale catalog", "daily double", "typed answers"]);
    }
    if (game.id === "generated-practice-exam") {
      game.subtitle = `${exams.length} course practice exams and ${exams.reduce((sum, exam) => sum + (exam.units || []).length, 0)} unit practice forms with zoomable source packet pages and the shared document viewer.`;
      game.clueCount = bankTotal;
      game.tags = uniq([...(game.tags || []), "zoomable source pages", "document viewer", "course source packets"]);
    }
  }
  const generated = generatedCatalogEntries(boards, exams);
  const expanded = base.concat(generated);
  writeJson(manifestFile, expanded);
  return expanded;
}

function updateIndexCounts(totalGames, boards, exams, bankTotal) {
  const file = path.join(ROOT, "index.html");
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  const examCount = exams.length;
  html = html
    .replace(/content="Mr\. Mac's Review Arcade — \d+ arcade entries/g, `content="Mr. Mac's Review Arcade — ${totalGames} arcade entries`)
    .replace(/content="Mr\. Mac's Review Arcade — \d+ grades 5-12\/AP review entries/g, `content="Mr. Mac's Review Arcade — ${totalGames} grades 5-12/AP review entries`)
    .replace(/"featureList": \[[\s\S]*?\n      \]/, `"featureList": [
        "${totalGames} cataloged review entries and practice tools",
        "${boards.length} generated unit Jeopardy boards plus social studies flagship boards",
        "${bankTotal} shared-bank questions across 99 course buckets",
        "${examCount} generated course practice exams with zoomable source pages",
        "Live multiplayer rooms (40 players)",
        "Printable wrong-answer worksheets",
        "Offline play via Progressive Web App"
      ]`)
    .replace(/\b221 live games\b/g, `${totalGames} live games`)
    .replace(/title\.textContent = "OPEN LIBRARY · 78 GAMES READY";/g, `title.textContent = "OPEN LIBRARY · ${totalGames} GAMES READY";`);
  fs.writeFileSync(file, html, "utf8");
}

function main() {
  const generatedPrefix = /^all-subject-/;
  for (const file of fs.readdirSync(FRAG_DIR)) {
    if (generatedPrefix.test(file) && file.endsWith(".json")) fs.rmSync(path.join(FRAG_DIR, file));
  }

  const orderedCourses = courses.sort((a, b) => a.id.localeCompare(b.id));
  writePracticePageAssets(orderedCourses);
  let bankTotal = 0;
  for (const course of orderedCourses) {
    const questions = buildQuestions(course);
    bankTotal += questions.length;
    writeJson(path.join(FRAG_DIR, `all-subject-${course.id}.json`), {
      course: course.id,
      courseLabel: course.label,
      generatedBy: "scripts/generate-all-subject-content.mjs",
      version: VERSION,
      questions
    });
  }
  const socialDerivedQuestions = writeSocialStudiesBoardBank();
  const sharedQuestionTotal = countFragmentQuestions();

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
    mode: "cataloged-unit-board-variants",
    boardShape: "5 categories x 5 clues plus one Daily Double and Final Jeopardy",
    variants: JEOPARDY_VARIANTS,
    boards: orderedCourses.flatMap((course) => course.units.flatMap((unitSpec, index) =>
      JEOPARDY_VARIANTS.map((variant) => buildJeopardyBoard(course, unitSpec, index, variant))
    ))
  };

  const practice = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    sourcePolicy: "Exact released forms remain separate from generated/original practice. Existing Regents/AP exact-form runners consume registered official forms; this file fills the all-subject coverage map with zoomable companion source packets.",
    exams: orderedCourses.map(buildPracticeBlueprint)
  };

  writeJson(path.join(DATA_DIR, "all-subject-course-taxonomy.json"), taxonomy);
  writeJson(path.join(DATA_DIR, "released-assessment-source-catalog.json"), sourceCatalog);
  writeJson(path.join(DATA_DIR, "generated-all-subject-jeopardy-blueprints.json"), jeopardy);
  const jeopardyIndex = writeJeopardyShards(jeopardy.boards);
  writeJson(path.join(DATA_DIR, "generated-jeopardy-index.json"), jeopardyIndex);
  writeJson(path.join(DATA_DIR, "generated-practice-exam-blueprints.json"), practice);
  const manifest = expandGamesManifest(jeopardy.boards, practice.exams, sharedQuestionTotal);
  updateIndexCounts(manifest.length, jeopardy.boards, practice.exams, sharedQuestionTotal);

  console.log(`Generated ${orderedCourses.length} course fragments, ${jeopardy.boards.length} Jeopardy boards, ${practice.exams.length} practice exams, ${manifest.length} catalog entries, ${socialDerivedQuestions} social-studies board-derived bank questions, ${sharedQuestionTotal} shared-bank source questions, and ${orderedCourses.length * 4} zoomable practice pages.`);
}

main();
