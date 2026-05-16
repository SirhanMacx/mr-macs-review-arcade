import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const GAMES_ROOT = join(ROOT, "games");
const BANK_PATH = join(ROOT, "data", "chrono-defense-bank.json");
const AP_RIGOR_VERSION = "ap-rigor-v2-applied-concepts";
const BOARD_HARDENING_VERSION = "jeopardy-hardening-v4-natural-clues";

const AP_DIRS = [
  "ap-world-history",
  "ap-european-history",
  "ap-human-geography",
  "ap-us-government",
  "ap-psychology",
  "ap-macroeconomics",
  "ap-microeconomics",
  "ap-economics-combined",
  // Wave 4 (May 16 2026) — new AP per-course HTMLs landed in df9940d.
  // Each needs a matching FINAL_POOLS, COURSE_BY_DIR, and
  // shortDisciplineForDir mapping below or hardening will substitute
  // wrong-domain content (e.g. AP World History finals into AP Biology).
  "ap-biology",
  "ap-chemistry",
  "ap-computer-science-principles",
  "ap-french-language",
  "ap-music-theory",
  "ap-spanish-language",
  "ap-spanish-literature"
];

const EXPECTED_SKILLS = new Map([
  [100, "identify key content"],
  [200, "match content to unit context"],
  [300, "explain cause, effect, or turning point"],
  [400, "connect evidence to a larger context"],
  [500, "synthesize a high-value exam pattern"]
]);

const COURSE_BY_DIR = {
  "ap-world-history": "AP World History: Modern",
  "ap-european-history": "AP European History",
  "ap-human-geography": "AP Human Geography",
  "ap-us-government": "AP U.S. Government and Politics",
  "ap-psychology": "AP Psychology",
  "ap-macroeconomics": "AP Macroeconomics",
  "ap-microeconomics": "AP Microeconomics",
  "ap-economics-combined": "AP Economics",
  "ap-biology": "AP Biology",
  "ap-chemistry": "AP Chemistry",
  "ap-computer-science-principles": "AP Computer Science Principles",
  "ap-french-language": "AP French Language and Culture",
  "ap-music-theory": "AP Music Theory",
  "ap-spanish-language": "AP Spanish Language and Culture",
  "ap-spanish-literature": "AP Spanish Literature and Culture"
};

const FINAL_POOLS = {
  "ap-world-history": [
    ["Sufism", "Islamic mystical movement that helped spread faith through local practice and devotion."],
    ["Gunpowder empires", "Ottoman, Safavid, and Mughal states that expanded using artillery and centralized rule."],
    ["Indian Ocean trade", "Maritime network linking East Africa, Arabia, South Asia, and Southeast Asia."],
    ["Columbian Exchange", "Post-1492 transfer of crops, animals, diseases, people, and ideas between hemispheres."],
    ["Social Darwinism", "Ideology using survival language to justify imperial hierarchy."],
    ["Non-Aligned Movement", "Cold War bloc of states refusing formal alignment with either superpower."],
    ["Green Revolution", "Agricultural transformation using high-yield seeds, fertilizer, irrigation, and technology."],
    ["Neoliberalism", "Late twentieth-century policy turn toward privatization, deregulation, and freer trade."]
  ],
  "ap-european-history": [
    ["Civic humanism", "Renaissance ideal connecting classical learning to active public service."],
    ["Predestination", "Calvinist doctrine that God had already chosen who would be saved."],
    ["Empiricism", "Scientific Revolution approach stressing observation and evidence."],
    ["Balance of power", "Diplomatic principle meant to prevent one state from dominating Europe."],
    ["Conservatism", "Post-1815 ideology defending monarchy, order, tradition, and hierarchy."],
    ["Proletariat", "Industrial working class central to Marxist analysis."],
    ["Realpolitik", "Pragmatic politics based on power rather than ideology."],
    ["European Union", "Postwar supranational organization promoting European integration."]
  ],
  "ap-human-geography": [
    ["Scale", "Level of analysis that changes how geographic patterns are interpreted."],
    ["Possibilism", "View that environments limit but do not determine human choices."],
    ["Step migration", "Migration pattern moving through stages from smaller to larger places."],
    ["Cultural landscape", "Visible imprint of human activity on the physical environment."],
    ["Nation-state", "State whose political borders closely match a national group."],
    ["Von Thunen model", "Agricultural land-use model shaped by transport cost and distance to market."],
    ["Bid-rent theory", "Urban model explaining land values by distance from the central business district."],
    ["Agglomeration", "Clustering of firms that lowers costs and increases shared advantages."]
  ],
  "ap-us-government": [
    ["Popular sovereignty", "Democratic principle that government authority comes from the people."],
    ["Checks and balances", "Constitutional system letting branches limit one another's power."],
    ["Federalist No. 10", "Madison essay arguing a large republic can control factional dangers."],
    ["Selective incorporation", "Process applying Bill of Rights protections to states through the Fourteenth Amendment."],
    ["Bureaucratic discretion", "Agency power to decide how laws are implemented."],
    ["Political socialization", "Process by which people develop political beliefs and values."],
    ["Retrospective voting", "Voting based on evaluation of past government performance."],
    ["Iron triangle", "Policy relationship among agencies, committees, and interest groups."]
  ],
  "ap-psychology": [
    ["Operational definition", "Exact procedure for measuring or manipulating a variable so research can be replicated."],
    ["Neuroplasticity", "Brain capacity to reorganize after learning, experience, or injury."],
    ["Working memory", "Short-term system for actively holding and manipulating information."],
    ["Attachment", "Close emotional bond between child and caregiver."],
    ["Cognitive dissonance", "Mental tension from holding conflicting attitudes or behaviors."],
    ["Biopsychosocial model", "Explanation using biological, psychological, and social factors together."],
    ["Social facilitation", "Performance change caused by the presence of others."],
    ["Validity", "Degree to which a test measures what it claims to measure."]
  ],
  "ap-macroeconomics": [
    ["Automatic stabilizers", "Fiscal features that change with the business cycle without new legislation."],
    ["Liquidity preference", "Demand for holding money instead of interest-bearing assets."],
    ["Crowding out", "Reduced private investment caused by government borrowing pushing up interest rates."],
    ["Phillips curve", "Model showing the short-run inflation-unemployment trade-off."],
    ["Money multiplier", "Ratio estimating deposit expansion from new bank reserves."],
    ["Long-run aggregate supply", "Potential output when resources are fully employed."],
    ["Stagflation", "Combination of high inflation, high unemployment, and weak growth."],
    ["Current account", "International account recording trade, income flows, and transfers."]
  ],
  "ap-microeconomics": [
    ["Deadweight loss", "Lost surplus created when output differs from the efficient quantity."],
    ["Nash equilibrium", "Game outcome where no player gains by changing strategy alone."],
    ["Price discrimination", "Charging different buyers different prices for the same good."],
    ["Marginal revenue product", "Extra revenue generated by hiring one more resource unit."],
    ["Externality", "Cost or benefit affecting a third party outside a market exchange."],
    ["Allocative efficiency", "Output level where price equals marginal cost."],
    ["Natural monopoly", "Market where one firm can supply output at lower cost than competitors."],
    ["Elasticity", "Measure of quantity responsiveness to price, income, or related-good changes."]
  ],
  "ap-economics-combined": [
    ["Comparative advantage", "Lower-opportunity-cost basis for mutually beneficial specialization and trade."],
    ["Crowding out", "Reduced private investment caused by government borrowing pushing up interest rates."],
    ["Deadweight loss", "Lost surplus created when output differs from the efficient quantity."],
    ["Money multiplier", "Ratio estimating deposit expansion from new bank reserves."],
    ["Phillips curve", "Model showing the short-run inflation-unemployment trade-off."],
    ["Nash equilibrium", "Game outcome where no player gains by changing strategy alone."],
    ["Automatic stabilizers", "Fiscal features that change with the business cycle without new legislation."],
    ["Price discrimination", "Charging different buyers different prices for the same good."]
  ],
  // Wave 4 (May 16 2026) — domain-correct finals for new AP courses.
  // Each entry is one canonical concept that resists answer-leak from
  // its own clue and aligns with the College Board CED 2024+.
  "ap-biology": [
    ["Allosteric regulation", "Enzyme activity modulated by molecule binding outside the active site."],
    ["Hardy-Weinberg equilibrium", "Population state where allele frequencies stay constant across generations."],
    ["Chemiosmosis", "ATP synthesis driven by proton gradient across an inner membrane."],
    ["Apoptosis", "Programmed cell death used in development, immunity, and tissue maintenance."],
    ["Operon", "Bacterial gene cluster transcribed together under one promoter."],
    ["Genetic drift", "Random change in allele frequency that has larger impact on small populations."],
    ["Trophic efficiency", "Fraction of energy passed from one trophic level to the next."],
    ["Endosymbiotic theory", "Hypothesis that mitochondria and chloroplasts originated as engulfed prokaryotes."]
  ],
  "ap-chemistry": [
    ["Le Chatelier's principle", "Equilibrium response that opposes any imposed disturbance to a system."],
    ["Activation energy", "Minimum energy barrier required for reactants to form products."],
    ["Lattice energy", "Energy released when gaseous ions form one mole of solid ionic compound."],
    ["Buffer capacity", "Amount of acid or base a buffer absorbs before its pH changes sharply."],
    ["Standard reduction potential", "Voltage of a half-cell measured under standard conditions versus hydrogen."],
    ["Gibbs free energy", "Thermodynamic value indicating whether a reaction is spontaneous at a given temperature."],
    ["Photoelectron spectroscopy", "Technique that ionizes electrons to reveal atomic energy levels."],
    ["Common ion effect", "Solubility reduction caused by adding a shared ion to a saturated solution."]
  ],
  "ap-computer-science-principles": [
    ["Abstraction", "Process of hiding complexity by exposing only the necessary interface."],
    ["Public key encryption", "Asymmetric cryptography using a public key to encrypt and a private key to decrypt."],
    ["Heuristic", "Practical approach producing good-enough solutions when exact methods are too costly."],
    ["Lossless compression", "Data reduction in which the original file can be perfectly reconstructed."],
    ["Distributed computing", "Workload split across networked machines that cooperate to finish a task."],
    ["Packet switching", "Network technique splitting messages into addressable, independently routed chunks."],
    ["Procedural abstraction", "Encapsulation of repeated logic into a named, reusable procedure."],
    ["Binary search", "Sorted-array lookup that halves the search space each step."]
  ],
  "ap-french-language": [
    ["La francophonie", "Worldwide community of French-speaking nations, regions, and institutions."],
    ["Subjonctif", "Mood expressing doubt, emotion, necessity, or hypothetical situations."],
    ["Conditionnel", "Mood used for politeness, hypothesis, and reported future possibilities."],
    ["Pronom complément d'objet direct", "Pronoun replacing a direct object inside a French sentence."],
    ["Passé composé", "Compound past tense formed with avoir or être plus a past participle."],
    ["Imparfait", "Past tense expressing ongoing, habitual, or descriptive background actions."],
    ["Ecologie globale", "Theme connecting environmental issues across French-speaking contexts."],
    ["Multiculturalisme", "AP French Theme exploring identity, immigration, and cultural exchange."]
  ],
  "ap-music-theory": [
    ["Cadence", "Harmonic conclusion of a phrase, classified by chord motion at the end."],
    ["Secondary dominant", "Chord that temporarily tonicizes a non-tonic scale degree."],
    ["Counterpoint", "Compositional technique combining independent melodic lines into a single texture."],
    ["Modulation", "Process of changing the established tonal center within a piece."],
    ["Picardy third", "Major chord ending a phrase that was otherwise in a minor key."],
    ["Neapolitan sixth", "Pre-dominant chord built on the lowered second scale degree, usually in first inversion."],
    ["Sonata form", "Three-part design featuring exposition, development, and recapitulation."],
    ["Voice leading", "Principles for moving individual voices smoothly within a harmonic progression."]
  ],
  "ap-spanish-language": [
    ["Identidad personal", "AP Spanish theme exploring self-concept, traditions, and lived experience."],
    ["Subjuntivo", "Spanish mood used for doubt, emotion, will, and hypothetical contexts."],
    ["Ser vs estar", "Pair of Spanish verbs distinguishing inherent traits from temporary states."],
    ["Pretérito vs imperfecto", "Spanish past tense contrast between completed events and ongoing background."],
    ["Multiculturalismo hispano", "Theme exploring identity, migration, and pluralism in the Spanish-speaking world."],
    ["Reflexivo", "Spanish verb construction in which the subject acts on itself."],
    ["Por y para", "Spanish preposition pair contrasting cause/duration with destination/purpose."],
    ["Mandato formal", "Spanish formal command form built from the present subjunctive."]
  ],
  "ap-spanish-literature": [
    ["Sor Juana Inés de la Cruz", "Colonial Mexican poet whose Hombres necios anchors Period 2 of the AP reading list."],
    ["Don Quijote de la Mancha", "Cervantes novel widely read as the first modern European novel."],
    ["García Márquez", "Colombian author central to magical realism and AP Spanish Lit Period 6."],
    ["Magia realismo", "Narrative mode blending realistic detail with matter-of-fact supernatural events."],
    ["Modernismo", "Late-19th-century Latin American movement led by Rubén Darío."],
    ["Generación del 98", "Spanish writers responding to the 1898 loss of empire, including Unamuno."],
    ["Costumbrismo", "Realist tradition depicting regional customs, dress, and daily life."],
    ["Greguerias", "Short metaphor-driven aphorisms developed by Ramón Gómez de la Serna."]
  ]
};

const SPECIFIC_CLUES = new Map([
  ["Delhi Sultanate", "Northern Indian Muslim state that linked South Asia to Persianate political culture."],
  ["Feudalism", "Decentralized land-for-service system that structured medieval European obligations."],
  ["Black Death", "Afro-Eurasian pandemic that disrupted labor, trade, and social order."],
  ["Treaty of Versailles", "Peace settlement whose punishments helped destabilize interwar Europe."],
  ["Contextualization", "Reasoning skill placing a development within broader conditions of time and place."],
  ["Density", "Frequency measure used to compare concentration across geographic areas."],
  ["Spatial distribution", "Pattern of clustering, dispersal, or concentration across space."],
  ["Limited government", "Constitutional principle restricting public power through law and rights."],
  ["Republicanism", "Representative system where voters choose officials to make policy."],
  ["Dependent variable", "Measured outcome expected to change when the independent variable changes."],
  ["Confounding variable", "Outside factor that threatens a study's causal conclusion."],
  ["Experiment", "Research design using manipulation and control to test cause and effect."],
  ["Descriptive statistics", "Numerical summaries used to describe center, spread, or pattern in data."],
  ["Production possibilities curve", "Model showing scarcity, opportunity cost, efficiency, and trade-offs."],
  ["Absolute advantage", "Greater output with the same resources, distinct from lower opportunity cost."],
  ["Comparative advantage", "Lower opportunity cost that explains specialization and trade gains."],
  ["Equilibrium", "Market outcome where planned buying equals planned selling."],
  ["Price floor", "Legal minimum set above equilibrium that can create surplus."],
  ["Consumer surplus", "Buyer benefit from paying less than maximum willingness to pay."],
  ["Fixed cost", "Cost that stays unchanged as output rises or falls."],
  ["Average total cost", "Per-unit cost found by dividing total cost by output."],
  ["Marginal revenue product", "Extra revenue created by hiring one more resource unit."],
  ["Long-run aggregate supply", "Potential output when labor, capital, and technology are fully employed."],
  ["Money multiplier", "Deposit expansion ratio based on reserve requirements and bank lending."],
  ["Crowding out", "Government borrowing effect that raises rates and reduces private investment."],
  ["Human Development Index", "Composite development measure using income, education, and life expectancy."],
  ["Gerrymandering", "District manipulation designed to advantage one political party or group."],
  ["Stare decisis", "Legal principle encouraging courts to follow precedent."],
  ["Necessary and proper clause", "Elastic clause letting Congress carry out enumerated powers."],
  ["Electoral College", "Constitutional system that formally selects the president through state electors."],
  ["Due process clause", "Fourteenth Amendment protection against unfair government procedures."],
  ["Equal protection clause", "Fourteenth Amendment rule requiring equal treatment under law."]
]);

function extractGame(text, file) {
  const match = text.match(/const GAME = (\{[\s\S]*?\});\s*(?:const|let|var)\s+STORAGE_KEY/);
  if (!match) throw new Error(`Could not find GAME JSON in ${file}`);
  return { game: JSON.parse(match[1]), raw: match[0] };
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|and|or|of|to|in|for|with|by|on|from|during|this|that|these|those)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value).split(" ").filter(Boolean).length;
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripPeriod(value) {
  return clean(value).replace(/[.!?]+$/g, "");
}

function escRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function answerLeaks(clue, answer) {
  const a = normalize(answer);
  if (!a || a.length < 5) return false;
  if (a.split(" ").length === 1 && a.length < 8) return false;
  return normalize(clue).includes(a);
}

function shortDisciplineForDir(dir) {
  if (dir.includes("history")) return "history";
  if (dir.includes("geography")) return "geo";
  if (dir.includes("government")) return "gov";
  if (dir.includes("psychology")) return "psych";
  // Wave 4 (May 16 2026)
  if (dir.includes("biology")) return "bio";
  if (dir.includes("chemistry")) return "chem";
  if (dir.includes("computer-science")) return "csp";
  if (dir.includes("french")) return "lang";
  if (dir.includes("music")) return "music";
  if (dir.includes("spanish-literature")) return "lit";
  if (dir.includes("spanish")) return "lang";
  return "econ";
}

function additionsFor(dir) {
  const kind = shortDisciplineForDir(dir);
  return {
    history: ["tied to state power, exchange, or conflict", "tied to turning points or comparisons"],
    geo: ["used to explain spatial patterns across scale", "used to interpret regional outcomes"],
    gov: ["tied to institutions, rights, or policy outcomes", "used to connect rules and power"],
    psych: ["applied to behavior, research, or evidence", "used to analyze scenario-based behavior"],
    econ: ["used to predict incentives, shifts, or welfare effects", "used to analyze graphs and policy effects"],
    bio: ["evidenced by lab data or mechanism", "tied to evolutionary or ecological context"],
    chem: ["explained by reaction mechanism or thermodynamics", "predicted from periodic or kinetic patterns"],
    csp: ["explained through algorithm efficiency or abstraction", "used to analyze impact of computing"],
    lang: ["tied to AP theme and authentic source", "applied to grammar in context"],
    music: ["analyzed through voice leading or harmonic function", "applied to score or aural analysis"],
    lit: ["tied to required author or work", "analyzed through literary device or period context"]
  }[kind];
}

function enrichClue(answer, currentClue, dir, value) {
  const specific = SPECIFIC_CLUES.get(clean(answer));
  if (specific && !answerLeaks(specific, answer)) return specific;
  const additions = additionsFor(dir);
  let base = stripPeriod(currentClue)
    .replace(/^This practice /i, "")
    .replace(/^This policy /i, "")
    .replace(/^This measure /i, "")
    .replace(/^This model /i, "Model ")
    .replace(/^This principle /i, "Principle ")
    .replace(/^A course-relevant development students must connect to evidence$/i, "Strategic location shaping trade, movement, or conflict")
    .replace(/^Court case used to define constitutional meaning, rights, or government power$/i, "Landmark case shaping rights, representation, or institutional power");
  for (const addition of additions) {
    const repeated = new RegExp(`,\\s*${escRegExp(addition)}(?:,\\s*${escRegExp(addition)})+`, "gi");
    base = base.replace(repeated, `, ${addition}`);
  }
  if (words(base) >= 12 || Number(value) < 400) return base.endsWith(".") ? base : `${base}.`;
  const normalizedBase = normalize(base);
  for (const addition of additions) {
    if (normalizedBase.includes(normalize(addition))) continue;
    const candidate = `${base}, ${addition}.`;
    if (words(candidate) <= 26 && !answerLeaks(candidate, answer)) return candidate;
  }
  return `${base}.`;
}

function pickFinal(dir, game, fileIndex) {
  const boardAnswers = new Set((game.categories || []).flatMap((category) => category.clues || []).map((clue) => normalize(clue.answer)));
  const pool = FINAL_POOLS[dir] || FINAL_POOLS["ap-world-history"];
  for (let offset = 0; offset < pool.length; offset += 1) {
    const [answer, clue] = pool[(fileIndex + offset) % pool.length];
    if (!boardAnswers.has(normalize(answer)) && !answerLeaks(clue, answer)) {
      return {
        category: "AP Concept",
        clue,
        answer,
        aliases: [],
        explanation: `${answer}: ${clue}`,
        rigor: {
          value: "Final",
          skill: "answer one difficult AP concept with one correct response",
          alignment: COURSE_BY_DIR[dir] || "AP course framework",
          hardeningVersion: BOARD_HARDENING_VERSION,
          apRigorVersion: AP_RIGOR_VERSION
        }
      };
    }
  }
  return game.final;
}

function hardenGame(game, dir, file, fileIndex) {
  for (const category of game.categories || []) {
    for (const clue of category.clues || []) {
      const value = Number(clue.value);
      if (value >= 400) {
        const next = enrichClue(clue.answer, clue.clue, dir, value);
        clue.sourceClue = clue.sourceClue || clue.clue;
        clue.clue = next;
        clue.explanation = `${clean(clue.answer)}: ${stripPeriod(next)}.`;
      }
      clue.rigor = {
        ...(clue.rigor || {}),
        value,
        skill: EXPECTED_SKILLS.get(value) || clue.rigor?.skill || "identify key content",
        alignment: clue.rigor?.alignment || `${COURSE_BY_DIR[dir] || "AP"} course framework`,
        hardeningVersion: BOARD_HARDENING_VERSION,
        apRigorVersion: AP_RIGOR_VERSION
      };
    }
  }
  game.final = pickFinal(dir, game, fileIndex);
  game.alignment = {
    ...(game.alignment || {}),
    standardSet: game.alignment?.standardSet || `${COURSE_BY_DIR[dir] || "AP"} course framework`,
    examTarget: game.alignment?.examTarget || "AP course skills: application, evidence, reasoning, and disciplinary vocabulary",
    hardeningVersion: BOARD_HARDENING_VERSION,
    apRigorVersion: AP_RIGOR_VERSION,
    boardShape: "5 categories x 5 clues, values 100-500, Final Jeopardy as one difficult one-answer AP concept"
  };
}

function updateBoardFiles() {
  let changed = 0;
  for (const dir of AP_DIRS) {
    const fullDir = join(GAMES_ROOT, dir);
    const files = readdirSync(fullDir).filter((file) => file.endsWith(".html")).sort();
    files.forEach((file, index) => {
      const full = join(fullDir, file);
      const text = readFileSync(full, "utf8");
      const { game, raw } = extractGame(text, relative(ROOT, full));
      hardenGame(game, dir, file, index);
      const next = text.replace(raw, `const GAME = ${JSON.stringify(game)};\nconst STORAGE_KEY`);
      if (next !== text) {
        writeFileSync(full, next);
        changed += 1;
      }
    });
  }
  return changed;
}

function searchable(question) {
  return [
    question.course,
    question.subject,
    question.set,
    question.category,
    question.prompt,
    question.answer,
    question.explanation,
    ...(question.tags || [])
  ].map(clean).join(" ").toLowerCase();
}

function dirForCourse(course) {
  const text = String(course || "");
  if (text.includes("World History")) return "ap-world-history";
  if (text.includes("European History")) return "ap-european-history";
  if (text.includes("Human Geography")) return "ap-human-geography";
  if (text.includes("Government")) return "ap-us-government";
  if (text.includes("Psychology")) return "ap-psychology";
  if (text.includes("Macroeconomics")) return "ap-macroeconomics";
  if (text.includes("Microeconomics")) return "ap-microeconomics";
  if (text.includes("Economics Combined")) return "ap-economics-combined";
  // Wave 4 (May 16 2026)
  if (text.includes("AP Biology")) return "ap-biology";
  if (text.includes("AP Chemistry")) return "ap-chemistry";
  if (text.includes("Computer Science Principles")) return "ap-computer-science-principles";
  if (text.includes("French Language")) return "ap-french-language";
  if (text.includes("Music Theory")) return "ap-music-theory";
  if (text.includes("Spanish Literature")) return "ap-spanish-literature";
  if (text.includes("Spanish Language")) return "ap-spanish-language";
  return "";
}

function updateBank() {
  const bank = JSON.parse(readFileSync(BANK_PATH, "utf8"));
  let changed = 0;
  for (const question of bank.questions || []) {
    const dir = dirForCourse(question.course);
    if (!dir || Number(question.value || 0) < 400 || !String(question.type || "").startsWith("jeopardy")) continue;
    const next = enrichClue(question.answer, question.prompt, dir, question.value);
    if (next !== question.prompt || question.apRigorVersion !== AP_RIGOR_VERSION) {
      question.prompt = next;
      question.explanation = `${clean(question.answer)}: ${stripPeriod(next)}.`;
      question.hardeningVersion = question.hardeningVersion || BOARD_HARDENING_VERSION;
      question.apRigorVersion = AP_RIGOR_VERSION;
      question.search = searchable(question);
      changed += 1;
    }
  }
  writeFileSync(BANK_PATH, `${JSON.stringify(bank, null, 2)}\n`);
  return changed;
}

const boardChanges = updateBoardFiles();
const bankChanges = updateBank();
console.log(`AP Jeopardy rigor hardening applied to ${boardChanges} boards and ${bankChanges} bank items.`);
