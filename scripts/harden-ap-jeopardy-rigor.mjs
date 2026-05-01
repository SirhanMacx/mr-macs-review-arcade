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
  "ap-economics-combined"
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
  "ap-economics-combined": "AP Economics"
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
  return "econ";
}

function additionsFor(dir) {
  const kind = shortDisciplineForDir(dir);
  return {
    history: ["tied to state power, exchange, or conflict", "tied to turning points or comparisons"],
    geo: ["used to explain spatial patterns across scale", "used to interpret regional outcomes"],
    gov: ["tied to institutions, rights, or policy outcomes", "used to connect rules and power"],
    psych: ["applied to behavior, research, or evidence", "used to analyze scenario-based behavior"],
    econ: ["used to predict incentives, shifts, or welfare effects", "used to analyze graphs and policy effects"]
  }[kind];
}

function enrichClue(answer, currentClue, dir, value) {
  const specific = SPECIFIC_CLUES.get(clean(answer));
  if (specific && !answerLeaks(specific, answer)) return specific;
  const base = stripPeriod(currentClue)
    .replace(/^This practice /i, "")
    .replace(/^This policy /i, "")
    .replace(/^This measure /i, "")
    .replace(/^This model /i, "Model ")
    .replace(/^This principle /i, "Principle ")
    .replace(/^A course-relevant development students must connect to evidence$/i, "Strategic location shaping trade, movement, or conflict")
    .replace(/^Court case used to define constitutional meaning, rights, or government power$/i, "Landmark case shaping rights, representation, or institutional power");
  if (words(base) >= 12 || Number(value) < 400) return base.endsWith(".") ? base : `${base}.`;
  for (const addition of additionsFor(dir)) {
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
