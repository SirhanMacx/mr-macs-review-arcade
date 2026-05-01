import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const APUSH_DIR = join(ROOT, "games", "apush");
const BANK_PATH = join(ROOT, "data", "chrono-defense-bank.json");
const VERSION = "apush-rigor-v1-contextual-clues";
const BOARD_HARDENING_VERSION = "jeopardy-hardening-v4-natural-clues";
const EXPECTED_SKILLS = new Map([
  [100, "identify key content"],
  [200, "match content to unit context"],
  [300, "explain cause, effect, or turning point"],
  [400, "connect evidence to a larger context"],
  [500, "synthesize a high-value exam pattern"]
]);

const OVERRIDES = {
  "13th Amendment": "Reconstruction amendment that permanently ended slavery in the United States.",
  "Abolitionism": "Reform movement that made slavery a national moral and political crisis.",
  "Affordable Care Act": "Obama-era law that expanded health insurance access and intensified debate over federal power.",
  "American Federation of Labor": "Skilled-labor union that focused on wages, hours, and working conditions.",
  "Andrew Carnegie": "Steel magnate whose vertical integration helped define Gilded Age industrial capitalism.",
  "Anglicization": "Colonial process of adopting English law, consumer goods, politics, and cultural habits.",
  "Animism": "Belief system in which spiritual power is present in animals, plants, places, and natural forces.",
  "Atlantic World": "Interconnected arena linking Europe, Africa, and the Americas through empire, trade, slavery, and migration.",
  "Atlantic creoles": "Culturally mixed Atlantic intermediaries who navigated European, African, and American worlds.",
  "Atlantic slavery": "Coerced labor system that tied plantation production to Atlantic commerce and racial hierarchy.",
  "Bank War": "Jackson-era fight over the Second Bank that sharpened debates over democracy and federal power.",
  "Bill of Rights": "First ten amendments added to protect liberties and answer Anti-Federalist concerns.",
  "Black Codes": "Post-Civil War southern laws that tried to control freedpeople's labor and rights.",
  "Black Power": "Civil rights-era movement stressing racial pride, self-determination, and community control.",
  "Bureaucracy": "Administrative system of agencies and officials that expanded as government responsibilities grew.",
  "Chesapeake colonies": "Tobacco-growing Virginia and Maryland society marked by indentured labor and plantation expansion.",
  "Citizens United": "Supreme Court ruling that expanded independent political spending by corporations and unions.",
  "Civil Service Reform": "Gilded Age changes that weakened patronage by making federal hiring more merit-based.",
  "Civil rights": "Legal protections against unequal treatment that became central to postwar reform movements.",
  "Columbian Exchange": "Post-1492 transfer of crops, animals, diseases, people, and ideas between hemispheres.",
  "Common Sense": "Paine pamphlet that turned natural-rights language into a direct argument for independence.",
  "Compromise of 1850": "Sectional package that admitted California and strengthened the Fugitive Slave Act.",
  "Constitutional Convention": "1787 meeting that replaced the Articles with a stronger federal system.",
  "Consumer revolution": "Eighteenth-century expansion of imported goods that tied colonists more tightly to Atlantic markets.",
  "Cult of domesticity": "Nineteenth-century gender ideal placing white middle-class women in moral domestic roles.",
  "Cultural adaptation": "Adjustment of beliefs, practices, or technologies to meet new environmental or political pressures.",
  "Culture wars": "Late twentieth-century conflicts over religion, identity, education, sexuality, and public values.",
  "Dawes Act": "Assimilation law that divided tribal land into individual allotments.",
  "Declaration of Independence": "Natural-rights document that justified separation from Britain and republican self-government.",
  "Deregulation": "Policy shift reducing government rules on business, often linked to late twentieth-century conservatism.",
  "Dominion of New England": "James II's centralized colonial government that triggered resistance to imperial control.",
  "Dot-com economy": "1990s technology boom built around internet firms, investment, and new digital markets.",
  "Dust Bowl": "Great Plains environmental disaster caused by drought, poor farming practices, and economic crisis.",
  "Ellis Island": "New York immigration station that processed many southern and eastern European migrants.",
  "Emancipation Proclamation": "Lincoln order that made slavery's destruction a Union war aim.",
  "Encomienda system": "Spanish labor system that extracted Indigenous labor while claiming protection and Christianization.",
  "End of the Cold War": "Collapse of Soviet power that ended the main U.S.-Soviet rivalry.",
  "Erie Canal": "Canal that linked western farms to eastern markets and accelerated the market revolution.",
  "Espionage Act": "World War I law used to punish antiwar speech and limit dissent.",
  "European imperial rivalry": "Competition among European powers that shaped colonization, warfare, and trade in North America.",
  "Executive Order 9066": "Wartime order used to authorize Japanese American incarceration.",
  "Federalism": "Constitutional division of power between national and state governments.",
  "Free Soil ideology": "Belief that western territories should remain open to free labor, not slavery.",
  "Free Soil movement": "Antislavery political movement opposing slavery's expansion into western territories.",
  "Freedmen's Bureau": "Reconstruction agency that aided formerly enslaved people with schools, labor contracts, and relief.",
  "Gettysburg": "Union victory that became a military and symbolic turning point in the Civil War.",
  "Globalization": "Late twentieth-century growth of cross-border trade, production, migration, finance, and culture.",
  "Gospel of Wealth": "Carnegie's argument that the wealthy should use fortunes for public benefit.",
  "Granger laws": "State railroad regulations backed by farmers angry over shipping and storage rates.",
  "Great Awakening": "Eighteenth-century evangelical revival that challenged established churches and authority.",
  "Great Depression": "1930s economic crisis that expanded demands for federal relief and regulation.",
  "Great Recession": "2008 financial crisis that renewed debate over markets, regulation, and federal stimulus.",
  "Great Society": "Johnson reform agenda expanding federal action on poverty, education, health, and civil rights.",
  "Homeland Security": "Department created after September 11 to coordinate domestic security policy.",
  "Imperialism": "Policy of extending political, military, or economic control over other peoples and territories.",
  "Indentured servitude": "Labor contract system that supplied Chesapeake workers before slavery became dominant.",
  "Isolationism": "Preference for avoiding foreign political commitments, especially strong between the world wars.",
  "Jeffersonian democracy": "Political vision favoring republican agrarianism, limited government, and expanded white male participation.",
  "John D. Rockefeller": "Oil industrialist whose trusts and horizontal integration drew antimonopoly criticism.",
  "Joint-stock company": "Investor-funded company that spread the risk of colonization and overseas trade.",
  "Kansas-Nebraska Act": "1854 law that used popular sovereignty and reopened conflict over slavery's expansion.",
  "Korean War": "Cold War conflict that militarized containment in Asia.",
  "Korematsu v. United States": "Supreme Court case upholding Japanese American incarceration during World War II.",
  "Laissez-faire capitalism": "Gilded Age economic idea favoring limited regulation of private business.",
  "Legal code": "Written system of laws defining authority, rights, duties, and punishments.",
  "Liberal consensus": "Postwar agreement supporting containment, economic growth, and moderate welfare-state expansion.",
  "Louisiana Purchase": "1803 acquisition that doubled U.S. territory and raised constitutional questions.",
  "Loyalists": "Colonists who remained loyal to Britain during the American Revolution.",
  "Manifest Destiny": "Expansionist ideology claiming the United States was destined to spread across the continent.",
  "Market Revolution": "Early nineteenth-century shift toward wage labor, commercial farming, factories, canals, and national markets.",
  "Market integration": "Growing connection of regional economies through transportation, credit, trade, and specialization.",
  "Marshall Plan": "U.S. aid program that rebuilt Western Europe and supported containment.",
  "McCarthyism": "Cold War anti-communist investigations and accusations that chilled dissent.",
  "Mercantilism": "Imperial economic system using colonies to enrich and strengthen the mother country.",
  "Mexican-American War": "War that added western territory and intensified conflict over slavery's expansion.",
  "Middle Colonies diversity": "Religious, ethnic, and economic pluralism that distinguished Pennsylvania, New York, and nearby colonies.",
  "Middle colonies": "Colonial region known for grain farming, commerce, ethnic diversity, and religious pluralism.",
  "Monroe Doctrine": "Policy warning Europe against new colonization in the Western Hemisphere.",
  "Muckrakers": "Progressive journalists who exposed corruption, unsafe products, and abuses of corporate power.",
  "NAFTA": "Trade agreement linking the United States, Canada, and Mexico in a regional market.",
  "Nat Turner's rebellion": "1831 slave revolt that intensified southern repression and fear.",
  "Natural rights": "Enlightenment idea that people possess basic rights before government.",
  "Navigation Acts": "British trade laws designed to regulate colonial commerce for imperial benefit.",
  "Neoliberalism": "Policy turn toward deregulation, privatization, free trade, and market-based reform.",
  "New Deal": "FDR programs that expanded federal responsibility for relief, recovery, and reform.",
  "New Deal coalition": "Democratic voting alliance of labor, urban voters, immigrants, Black voters, and southern Democrats.",
  "New England colonies": "Puritan-influenced region with town meetings, mixed farming, commerce, and tight-knit communities.",
  "New immigration": "Late nineteenth-century immigration wave from southern and eastern Europe.",
  "No Child Left Behind": "Federal education law that tied accountability to testing and school performance.",
  "Patriot Act": "Post-September 11 law expanding surveillance and law-enforcement powers.",
  "Plantation economy": "Large-scale cash-crop system dependent on coerced labor and export markets.",
  "Plessy v. Ferguson": "Supreme Court decision that upheld legal segregation under separate but equal.",
  "Political machines": "Urban party organizations that exchanged services and jobs for votes.",
  "Popular sovereignty": "Principle that settlers or citizens decide political authority, including slavery in territories.",
  "Proclamation of 1763": "British line limiting westward settlement after the Seven Years' War.",
  "Pueblo communities": "Southwestern Indigenous societies known for settled agriculture and multiroom towns.",
  "Reaganomics": "Conservative economic program built around tax cuts, deregulation, and reduced domestic spending.",
  "Reciprocity": "Mutual exchange that structured social relationships in many Indigenous economies.",
  "Reconstruction Acts": "Congressional laws placing the South under military districts and requiring new state governments.",
  "Religious toleration": "Policy of allowing multiple faiths, important in colonies such as Pennsylvania and Maryland.",
  "Republican motherhood": "Post-Revolution ideal linking women's domestic roles to raising virtuous citizens.",
  "Robber barons": "Critical label for industrialists accused of exploiting labor and corrupting politics.",
  "Roosevelt Corollary": "Policy claiming U.S. police power in Latin America to protect regional stability.",
  "Salutary neglect": "Loose British enforcement that let colonial self-government and trade practices expand.",
  "Same-sex marriage": "Marriage-rights issue settled nationally by Obergefell v. Hodges.",
  "Scopes Trial": "1925 court fight that exposed conflict between modern science and religious traditionalism.",
  "Secession": "Withdrawal from the Union, used by southern states after Lincoln's election.",
  "Second Great Awakening": "Religious revival that energized reform movements including temperance and abolition.",
  "Second-wave feminism": "Movement seeking legal, workplace, reproductive, and social equality for women.",
  "Sharecropping": "Postwar farm-labor system that often trapped Black and white tenants in debt.",
  "Sherman Antitrust Act": "Federal law aimed at restraining monopolies and trusts.",
  "Smallpox epidemics": "Disease outbreaks after contact that devastated Indigenous populations.",
  "Social Security Act": "New Deal law creating old-age pensions and unemployment support.",
  "Social hierarchy": "Ranking of groups by wealth, race, gender, legal status, or power.",
  "Social media politics": "Digital campaigning and organizing that changed political communication.",
  "Spanish colonization": "Conquest-based empire using missions, resource extraction, racial hierarchy, and coerced labor.",
  "Spanish mission system": "Religious-colonial institutions used to convert, control, and reorganize Indigenous communities.",
  "Spanish-American War": "1898 conflict that turned the United States into an overseas imperial power.",
  "Stamp Act": "1765 printed-materials tax that helped unify colonial resistance to parliamentary taxation.",
  "State centralization": "Growth of stronger central authority over law, taxation, administration, or coercive power.",
  "Stock market crash": "1929 collapse in stock values that helped trigger the Great Depression.",
  "Stono Rebellion": "1739 South Carolina slave uprising that led to harsher slave codes.",
  "Sun Belt": "Postwar southern and western growth region shaped by defense spending, migration, and air conditioning.",
  "Supply-side economics": "Theory that tax cuts can encourage investment, production, and economic growth.",
  "Temperance movement": "Reform campaign against alcohol that linked morality, family life, and social order.",
  "Trail of Tears": "Forced Cherokee removal that revealed the human cost of Indian Removal policy.",
  "Transcendentalism": "Reform-era philosophy stressing individual conscience, nature, and spiritual intuition.",
  "Treaty of Tordesillas": "1494 agreement dividing Atlantic claims between Spain and Portugal.",
  "Triangular trade": "Atlantic trade pattern connecting goods, enslaved labor, and raw materials.",
  "Truman Doctrine": "Containment pledge to aid peoples resisting communist pressure.",
  "Vietnam War": "Cold War conflict that divided U.S. society and challenged containment assumptions.",
  "Vietnam War protests": "Antiwar movement challenging the draft, presidential power, and Cold War policy.",
  "Voting Rights Act of 1965": "Civil rights law banning racial discrimination in voting.",
  "Whiskey Rebellion": "1794 uprising that tested the new federal government's power to enforce law.",
  "Wilmot Proviso": "Proposal to ban slavery in territory gained from Mexico.",
  "World War I": "Global war that pulled the United States into debates over democracy and internationalism."
};

const FINAL_BY_FILE = {
  "01 - Period 1 1491-1607 Jeopardy Review.html": {
    category: "APUSH Turning Point",
    clue: "Andean forced-labor draft adapted by Spain for silver mining.",
    answer: "Mita system",
    aliases: ["mita"],
    explanation: "The mita system was an Indigenous labor draft adapted by Spain for colonial mining."
  },
  "02 - Period 2 1607-1754 Jeopardy Review.html": {
    category: "Colonial Crisis",
    clue: "Puritan church compromise that reflected declining full membership.",
    answer: "Half-Way Covenant",
    aliases: ["Half Way Covenant"],
    explanation: "The Half-Way Covenant showed religious adaptation as Puritan church membership declined."
  },
  "03 - Period 3 1754-1800 Jeopardy Review.html": {
    category: "Founding Weakness",
    clue: "1787 law organizing western territories and banning slavery there.",
    answer: "Northwest Ordinance",
    aliases: [],
    explanation: "The Northwest Ordinance created a process for territorial government and banned slavery in the Northwest Territory."
  },
  "04 - Period 4 1800-1848 Jeopardy Review.html": {
    category: "National Economy",
    clue: "Henry Clay program linking tariffs, a national bank, and internal improvements.",
    answer: "American System",
    aliases: ["Clay's American System"],
    explanation: "The American System promoted economic nationalism through tariffs, banking, and internal improvements."
  },
  "05 - Period 5 1844-1877 Jeopardy Review.html": {
    category: "Sectional Crisis",
    clue: "Political bargain that ended federal military Reconstruction in the South.",
    answer: "Compromise of 1877",
    aliases: [],
    explanation: "The Compromise of 1877 ended federal military enforcement of Reconstruction in the South."
  },
  "06 - Period 6 1865-1898 Jeopardy Review.html": {
    category: "Gilded Age Ideology",
    clue: "Law creating merit-based federal jobs after Garfield's assassination.",
    answer: "Pendleton Act",
    aliases: ["Pendleton Civil Service Act"],
    explanation: "The Pendleton Act expanded merit-based civil service and weakened patronage."
  },
  "07 - Period 7 1890-1945 Jeopardy Review.html": {
    category: "World War I",
    clue: "Wilson's peace plan calling for self-determination, open diplomacy, and a League of Nations.",
    answer: "Fourteen Points",
    aliases: ["14 Points"],
    explanation: "The Fourteen Points expressed Wilsonian internationalism after World War I."
  },
  "08 - Period 8 1945-1980 Jeopardy Review.html": {
    category: "Cold War Escalation",
    clue: "Congressional resolution that gave Johnson broad authority to expand the Vietnam War.",
    answer: "Gulf of Tonkin Resolution",
    aliases: [],
    explanation: "The Gulf of Tonkin Resolution expanded presidential war-making power in Vietnam."
  },
  "09 - Period 9 1980-Present Jeopardy Review.html": {
    category: "New Right",
    clue: "Conservative Christian political movement that helped mobilize voters around social issues.",
    answer: "Moral Majority",
    aliases: [],
    explanation: "The Moral Majority reflected the rise of the religious right in late twentieth-century politics."
  },
  "99 - Cumulative Yearlong Jeopardy Review.html": {
    category: "Historical Thinking",
    clue: "Reasoning skill that explains why one historical development produced another.",
    answer: "Causation",
    aliases: ["cause and effect", "historical causation"],
    explanation: "Causation asks students to explain relationships between causes, events, and effects."
  }
};

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function replacementFor(answer, currentClue) {
  const clue = OVERRIDES[answer];
  if (clue) return clue;
  return clean(currentClue)
    .replace(/^A course-relevant development students must connect to evidence\.$/i, "Course concept that must be tied to precise evidence and historical context.")
    .replace(/^System or place shaped by outside political control and resource extraction\.$/i, "Political and economic control over another people or region.");
}

function hardenGame(game, file) {
  for (const category of game.categories || []) {
    for (const clue of category.clues || []) {
      const answer = clean(clue.answer);
      const next = replacementFor(answer, clue.clue);
      if (next && (next !== clue.clue || clue.rigor?.apushRigorVersion !== VERSION)) {
        clue.sourceClue = clue.sourceClue || clue.clue;
        clue.clue = next;
        clue.explanation = `${answer}: ${next}`;
        clue.sourceExplanation = clue.sourceExplanation || clue.explanation;
        clue.rigor = {
          ...(clue.rigor || {}),
          value: Number(clue.value),
          skill: EXPECTED_SKILLS.get(Number(clue.value)) || clue.rigor?.skill || "identify key content",
          alignment: clue.rigor?.alignment || "AP history course framework",
          hardeningVersion: BOARD_HARDENING_VERSION,
          apushRigorVersion: VERSION
        };
      }
    }
  }
  if (FINAL_BY_FILE[file]) {
    game.final = {
      ...(game.final || {}),
      ...FINAL_BY_FILE[file],
      rigor: {
        value: "Final",
        skill: "answer one difficult APUSH concept with one correct response",
        alignment: "AP U.S. History course framework",
        hardeningVersion: BOARD_HARDENING_VERSION,
        apushRigorVersion: VERSION
      }
    };
  }
  game.alignment = {
    ...(game.alignment || {}),
    standardSet: game.alignment?.standardSet || "AP history course framework",
    examTarget: game.alignment?.examTarget || "AP historical reasoning: developments/processes, contextualization, comparison, causation, continuity/change, and argumentation",
    hardeningVersion: BOARD_HARDENING_VERSION,
    apushRigorVersion: VERSION,
    boardShape: "5 categories x 5 clues, values 100-500, Final Jeopardy as one difficult one-answer APUSH concept"
  };
}

function updateHtmlFile(file) {
  const path = join(APUSH_DIR, file);
  const text = readFileSync(path, "utf8");
  const match = text.match(/const GAME = (\{[\s\S]*?\});\n/);
  if (!match) return false;
  const game = JSON.parse(match[1]);
  hardenGame(game, file);
  const next = text.replace(match[0], `const GAME = ${JSON.stringify(game)};\n`);
  if (next !== text) writeFileSync(path, next);
  return next !== text;
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

function updateBank() {
  const bank = JSON.parse(readFileSync(BANK_PATH, "utf8"));
  for (const question of bank.questions || []) {
    if (question.course !== "AP U.S. History Exam Review") continue;
    const answer = clean(question.answer);
    const next = replacementFor(answer, question.prompt);
    if (next && (next !== question.prompt || question.hardeningVersion !== VERSION)) {
      question.prompt = next;
      question.explanation = `${answer}: ${next}`;
      question.hardeningVersion = VERSION;
      question.search = searchable(question);
    }
    const final = Object.values(FINAL_BY_FILE).find((item) => item.answer === answer);
    if (final && String(question.type || "").includes("final")) {
      question.prompt = final.clue;
      question.explanation = final.explanation;
      question.aliases = final.aliases || [];
      question.hardeningVersion = VERSION;
      question.search = searchable(question);
    }
  }
  writeFileSync(BANK_PATH, `${JSON.stringify(bank, null, 2)}\n`);
}

const changed = readdirSync(APUSH_DIR)
  .filter((file) => file.endsWith(".html"))
  .sort()
  .filter(updateHtmlFile);
updateBank();
console.log(`APUSH Jeopardy rigor hardening applied to ${changed.length} boards.`);
