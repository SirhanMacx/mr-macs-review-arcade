#!/usr/bin/env node
// One-shot manual fix for 9 Jeopardy boards where a category has a duplicate
// clue at one value and is missing another value (100–500). Each fix replaces
// the duplicate clue index with a new clue authored from real curriculum.
//
// Generated as part of the May 16 2026 audit pass.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function extractRange(text) {
  const startMarker = "const GAME = ";
  const idx = text.indexOf(startMarker);
  let i = idx + startMarker.length;
  while (i < text.length && text[i] !== "{") i++;
  const start = i;
  let depth = 0, inStr = false, q = "", esc = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === q) { inStr = false; q = ""; continue; }
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; q = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

// Builds a clue object copying the alignment/skill of the existing first clue
// in the category (so rigor block stays board-consistent).
function mkClue(value, clue, answer, aliases, explanation, refClue) {
  const skill = {
    100: "identify key content",
    200: "match content to unit context",
    300: "explain cause, effect, or turning point",
    400: "connect evidence to a larger context",
    500: "synthesize a high-value exam pattern"
  }[value];
  return {
    value,
    clue,
    answer,
    aliases: aliases || [answer],
    explanation,
    sourceClue: clue,
    sourceExplanation: `${answer}: ${clue}`,
    rigor: {
      value,
      skill,
      alignment: refClue?.rigor?.alignment || "AP/Regents course framework",
      examTarget: refClue?.rigor?.examTarget || "exam reasoning",
      categoryQuality: refClue?.rigor?.categoryQuality || "board-specific-category-v1"
    }
  };
}

// Fix specification: for each file, identify (categoryIndex, replaceClueIndex,
// newClue). The replaceClueIndex points to the DUPLICATE clue to overwrite.
const FIXES = [
  {
    file: "games/us-history-units/01 - Colonial Foundations Jeopardy Review.html",
    catIndex: 1,
    replaceIndex: 1, // the duplicate $500 House of Burgesses
    make: (cat) => mkClue(
      200,
      "Massachusetts colony's elected lawmaking body, established 1629.",
      "Massachusetts General Court",
      ["Massachusetts General Court", "General Court", "Massachusetts colonial legislature", "Bay Colony assembly"],
      "The Massachusetts General Court began in 1629 as the governing body of the Massachusetts Bay Colony and quickly evolved into a representative legislature with elected deputies from each town. Alongside the Virginia House of Burgesses, it shows the early colonial pattern of self-government through elected assemblies — a habit colonists would later cite when resisting British rule. The Regents uses it to illustrate the spread of representative institutions in the colonies.",
      cat.clues[0]
    )
  },
  {
    file: "games/apush/05 - Period 5 1844-1877 Jeopardy Review.html",
    catIndex: 1,
    replaceIndex: 4, // duplicate $500 Dred Scott
    make: (cat) => mkClue(
      400,
      "1854 Massachusetts senator's brutal caning on the Senate floor over an anti-slavery speech.",
      "Sumner caning",
      ["Sumner caning", "caning of Charles Sumner", "Brooks-Sumner affair", "caning of Sumner"],
      "On May 22 1856, Representative Preston Brooks (SC) beat Senator Charles Sumner (MA) with a cane on the Senate floor after Sumner's 'Crime Against Kansas' speech denouncing slavery's expansion. Sumner needed three years to recover; Brooks became a Southern hero. APUSH frames the caning as a vivid Period 5 illustration of how Bleeding Kansas violence (NAT-4, POL-3) had pushed sectional conflict from politics into physical violence on the eve of the Civil War.",
      cat.clues[0]
    )
  },
  {
    file: "games/apush/08 - Period 8 1945-1980 Jeopardy Review.html",
    catIndex: 4,
    replaceIndex: 1, // duplicate $200 Feminist movement
    make: (cat) => mkClue(
      100,
      "1965 program that expanded federal aid to elementary and secondary education.",
      "Elementary and Secondary Education Act",
      ["Elementary and Secondary Education Act", "ESEA", "ESEA 1965", "Elementary + Secondary Education Act"],
      "Signed by LBJ in April 1965 at his own one-room Texas schoolhouse, the ESEA channeled federal Title I dollars to schools serving low-income students — the largest federal commitment to K-12 education in U.S. history at that point. APUSH treats it as a flagship Great Society reform (POL-3, WXT-3) and the foundation for later federal education policy from A Nation at Risk through No Child Left Behind. It also tested federalism by tying funds to civil-rights compliance.",
      cat.clues[0]
    )
  },
  {
    file: "games/ap-european-history/04 - Unit 4 Scientific, Philosophical, and Political Developments Jeopardy Review.html",
    catIndex: 1,
    replaceIndex: 1, // duplicate $100 Montesquieu (should be $200)
    make: (cat) => mkClue(
      200,
      "French baron whose Spirit of the Laws (1748) argued for separating government powers.",
      "Montesquieu",
      ["Montesquieu", "Baron de Montesquieu", "Charles-Louis de Secondat"],
      "Charles-Louis de Secondat, Baron de Montesquieu, published The Spirit of the Laws in 1748, arguing that liberty depended on dividing government among executive, legislative, and judicial branches that could check one another. AP Euro emphasizes Montesquieu's direct influence on later constitutional design — most notably the U.S. Constitution — and uses him to illustrate the Enlightenment's effort to apply scientific reasoning (SCD-2) to political institutions, a hallmark of Unit 4's intellectual revolution.",
      cat.clues[0]
    )
  },
  {
    file: "games/ap-human-geography/02 - Unit 2 Population and Migration Jeopardy Review.html",
    catIndex: 0,
    replaceIndex: 0, // duplicate $300 Population density (q0 should be $100)
    make: (cat) => mkClue(
      100,
      "The total number of people living in a defined area at a given time.",
      "Population",
      ["population", "total population", "absolute population"],
      "Population is the simplest count of how many people occupy a place — a country, region, or city — at a specific moment. AP Human Geography uses population as the baseline measure that all other Unit 2 concepts (density, distribution, structure) refine. Demographers track population through censuses every 10 years (in most countries) to plan services, allocate political representation, and detect change. PSO-2.A in the CED stresses that absolute numbers alone are less analytically useful than density, composition, and rate-of-change measures.",
      cat.clues[0]
    )
  },
  {
    file: "games/ap-us-government/02 - Unit 2 Interactions Among Branches Jeopardy Review.html",
    catIndex: 1,
    replaceIndex: 0, // duplicate $300 Veto (q0 should be $100)
    make: (cat) => mkClue(
      100,
      "Article II head of the executive branch, elected for a four-year term.",
      "President",
      ["President", "the President", "U.S. President", "President of the United States", "POTUS"],
      "Article II vests the executive power of the United States in a single President, elected indirectly through the Electoral College to a four-year term (max two per the 22nd Amendment). AP Gov stresses the formal Article II powers (commander in chief, treaty negotiator, appointer of officials and judges, pardon authority) alongside the informal powers — executive orders, signing statements, the bully pulpit — that have expanded the office in the modern era (CON-4.A). Unit 2 frames the President as one player whose interactions with Congress and the courts define separation of powers.",
      cat.clues[0]
    )
  },
  {
    file: "games/ap-us-government/03 - Unit 3 Civil Liberties and Civil Rights Jeopardy Review.html",
    catIndex: 3,
    replaceIndex: 3, // duplicate $400 Voting Rights Act
    make: (cat) => mkClue(
      300,
      "1963 march where King delivered his 'I Have a Dream' speech to ~250,000 people.",
      "March on Washington",
      ["March on Washington", "1963 March on Washington", "March on Washington for Jobs and Freedom"],
      "On August 28 1963, civil rights organizations led by A. Philip Randolph and Bayard Rustin brought roughly 250,000 demonstrators to the Lincoln Memorial demanding jobs and federal civil rights legislation. Martin Luther King Jr.'s 'I Have a Dream' speech crystallized the moral case for the Civil Rights Act of 1964, which Congress passed the following summer. AP Gov uses the march as a textbook example of how social movements (PMI-5) translate mass mobilization into policy change, working alongside litigation (NAACP) and electoral pressure to dismantle Jim Crow.",
      cat.clues[0]
    )
  },
  {
    file: "games/ap-world-history/08 - Unit 8 Cold War and Decolonization Jeopardy Review.html",
    catIndex: 3,
    replaceIndex: 1, // duplicate $200 Nonalignment
    make: (cat) => mkClue(
      100,
      "1955 Indonesian conference where 29 African and Asian states pledged solidarity against colonialism.",
      "Bandung Conference",
      ["Bandung Conference", "Bandung 1955", "Asian-African Conference", "Bandung"],
      "Hosted by Indonesia in April 1955, the Bandung Conference gathered leaders from 29 newly independent or soon-to-be-independent African and Asian states — Nehru, Nasser, Zhou Enlai, Sukarno among them — to reject colonialism and Cold War bloc alignment. Bandung launched what would crystallize in 1961 as the Non-Aligned Movement and gave the so-called Third World a shared diplomatic voice. AP World Unit 8 (GOV-3, ECN-3) treats it as the symbolic opening act of postcolonial international solidarity.",
      cat.clues[0]
    )
  },
  {
    file: "games/global-9/07 - Ottoman and Ming Worlds Jeopardy Review.html",
    catIndex: 3,
    replaceIndex: 2, // duplicate $300 Jesuits
    make: (cat) => mkClue(
      200,
      "Ming-era treasure fleets of 1405-1433 that reached East Africa under a Muslim admiral.",
      "Zheng He's voyages",
      ["Zheng He's voyages", "Zheng He voyages", "Treasure Fleet", "Zheng He expeditions", "Ming treasure voyages"],
      "Between 1405 and 1433, the Ming Yongle emperor dispatched Muslim eunuch admiral Zheng He on seven enormous expeditions of up to 300 ships and 28,000 sailors that ranged from Southeast Asia to India, Arabia, and the East African coast. The voyages projected Ming wealth and demanded tribute but did not establish lasting colonies. Global 9 contrasts them with later European voyages — the Ming court suspended the fleets after 1433 to focus on land defense, an Enduring Issue debate over China's turn inward at the dawn of the Atlantic age.",
      cat.clues[0]
    )
  }
];

let fixed = 0;
for (const fx of FIXES) {
  const path = join(root, fx.file);
  const text = readFileSync(path, "utf8");
  const range = extractRange(text);
  const json = text.slice(range.start, range.end);
  const game = JSON.parse(json);
  const cat = game.categories[fx.catIndex];
  const newClue = fx.make(cat);
  cat.clues[fx.replaceIndex] = newClue;
  // Re-sort clues by value so the board renders 100..500 left to right
  cat.clues.sort((a, b) => a.value - b.value);
  // Verify integrity
  const vals = cat.clues.map(c => c.value);
  if (new Set(vals).size !== 5 || vals.length !== 5) {
    console.log(`  FAILED ${fx.file}: values ${vals}`);
    continue;
  }
  const newJson = JSON.stringify(game);
  const newText = text.slice(0, range.start) + newJson + text.slice(range.end);
  writeFileSync(path, newText, "utf8");
  fixed++;
  console.log(`  fixed ${fx.file}  cat[${fx.catIndex}] now ${vals.join("/")}`);
}
console.log(`\nFixed ${fixed}/${FIXES.length} boards.`);
