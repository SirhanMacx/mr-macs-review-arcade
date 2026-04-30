#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HARDENING_VERSION = "jeopardy-hardening-v3-concise-clues";
const UNIT_REVIEW_TYPES = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final", "Regents Sprint"]);
const VALUE_SKILLS = {
  100: "identify key content",
  200: "match content to unit context",
  300: "explain cause, effect, or turning point",
  400: "connect evidence to a larger context",
  500: "synthesize a high-value exam pattern"
};

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isJeopardyManifestEntry(game) {
  const text = [game.title, game.originalFile, game.file, game.gameType].join(" ").toLowerCase();
  return text.includes("jeopardy") || text.includes("unit review") || UNIT_REVIEW_TYPES.has(game.gameType);
}

function extractGame(text, file) {
  const match = text.match(/const GAME = (\{[\s\S]*?\});\s*(?:const|let|var)\s+STORAGE_KEY/);
  if (!match) throw new Error(`Could not find GAME JSON in ${file}`);
  return JSON.parse(match[1]);
}

function replaceGame(text, game) {
  return text.replace(
    /const GAME = \{[\s\S]*?\};(?=\s*(?:const|let|var)\s+STORAGE_KEY)/,
    `const GAME = ${JSON.stringify(game)};`
  );
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

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function escRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function answerVariants(answer) {
  const raw = clean(answer);
  const compact = raw.replace(/[^A-Za-z0-9]+/g, " ").trim();
  const variants = new Set([raw, compact]);
  if (raw.endsWith("y")) variants.add(`${raw.slice(0, -1)}ies`);
  if (!raw.endsWith("s")) variants.add(`${raw}s`);
  if (raw.endsWith("ment")) variants.add(`${raw}ary`);
  return [...variants].filter((value) => value && value.length >= 5);
}

function removeAnswerLeak(text, answer, replacement = "the correct answer") {
  let output = clean(text);
  for (const variant of answerVariants(answer)) {
    output = output.replace(new RegExp(`\\b${escRegExp(variant)}\\b`, "gi"), replacement);
    const flexible = variant.split(/\s+/).map(escRegExp).join("\\W+");
    if (flexible !== escRegExp(variant)) {
      output = output.replace(new RegExp(`\\b${flexible}\\b`, "gi"), replacement);
    }
  }
  return clean(output)
    .replace(new RegExp(`\\b${escRegExp(replacement)}\\s+(?:and|or|\\+)\\s+${escRegExp(replacement)}\\b`, "gi"), replacement)
    .replace(new RegExp(`\\b${escRegExp(replacement)}\\s+${escRegExp(replacement)}\\b`, "gi"), replacement);
}

function sentence(value, fallback) {
  let text = clean(value || fallback || "");
  if (!text) text = "a course-relevant development students must connect to evidence";
  text = text.replace(/^([a-z])/, (match) => match.toUpperCase());
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function safeContext(value, answer, fallback) {
  let text = removeAnswerLeak(value, answer, "this topic");
  if (normalize(text).split(" ").filter(Boolean).length < 2) text = fallback;
  return clean(text || fallback);
}

function courseLane(meta, game) {
  const course = String(meta.course || game.exam || "");
  if (/AP Psychology/i.test(course)) return "ap-psych";
  if (/AP Human Geography/i.test(course)) return "ap-hug";
  if (/AP.*Government|Civics/i.test(course)) return "civics";
  if (/Economics|Microeconomics|Macroeconomics|AP Macro|AP Micro|Macro\/Micro/i.test(course)) return "economics";
  if (/AP.*History|AP World|AP European|AP United States/i.test(course)) return "ap-history";
  return "nys-history";
}

function alignmentFor(meta, game) {
  const lane = courseLane(meta, game);
  const course = meta.course || game.exam || "Social Studies";
  if (lane === "ap-psych") {
    return {
      course,
      standardSet: "AP Psychology course framework",
      examTarget: "AP concept application, research reasoning, and evidence-based explanation",
      shortCode: "AP Psych skill",
      finalFrame: "Answer one difficult psychology concept clue with one correct response"
    };
  }
  if (lane === "ap-hug") {
    return {
      course,
      standardSet: "AP Human Geography course framework",
      examTarget: "AP spatial reasoning, scale, pattern, process, and human-environment interaction",
      shortCode: "AP HUG skill",
      finalFrame: "Answer one difficult geography concept clue with one correct response"
    };
  }
  if (lane === "civics") {
    return {
      course,
      standardSet: /AP/i.test(course) ? "AP U.S. Government and Politics course framework" : "NYS Civic Participation standards",
      examTarget: "constitutional principles, civic participation, institutions, rights, and public-policy analysis",
      shortCode: "civic reasoning",
      finalFrame: "Answer one difficult civics concept clue with one correct response"
    };
  }
  if (lane === "economics") {
    return {
      course,
      standardSet: /AP/i.test(course) ? "AP Economics course framework" : "NYS Economics and Economic Systems standards",
      examTarget: "economic reasoning with incentives, models, markets, policy, and tradeoffs",
      shortCode: "economic reasoning",
      finalFrame: "Answer one difficult economics concept clue with one correct response"
    };
  }
  if (lane === "ap-history") {
    return {
      course,
      standardSet: "AP history course framework",
      examTarget: "AP historical reasoning: developments/processes, contextualization, comparison, causation, continuity/change, and argumentation",
      shortCode: "AP historical reasoning",
      finalFrame: "Answer one difficult historical reasoning concept clue with one correct response"
    };
  }
  return {
    course,
    standardSet: "NYS K-12 Social Studies Framework",
    examTarget: "NYS Social Studies Practices and Regents-style reasoning: evidence, chronology/causation, comparison/context, geography, economics, and civic participation",
    shortCode: "Regents skill",
    finalFrame: "Answer one difficult social studies concept clue with one correct response"
  };
}

function concept(lanes, tags, category, answer, clue, explanation, aliases = []) {
  return { lanes, tags, category, answer, clue, explanation, aliases };
}

const FINAL_CONCEPTS = [
  concept(["ap-psych"], ["research", "methods", "final"], "Research Methods", "Operational definition", "In research, this is the exact way a variable is measured or manipulated so another investigator could repeat the study.", "An operational definition turns an abstract variable into a measurable procedure.", ["operationalization"]),
  concept(["ap-psych"], ["research", "methods"], "Research Methods", "Random assignment", "This procedure places participants into conditions by chance so preexisting differences are more evenly spread across groups.", "Random assignment protects experiments by making comparison groups more equivalent before treatment begins."),
  concept(["ap-psych"], ["research", "methods"], "Research Methods", "Confounding variable", "This outside factor changes along with the independent variable and can make a cause-and-effect conclusion untrustworthy.", "A confounding variable gives researchers a competing explanation for the result."),
  concept(["ap-psych"], ["research", "methods"], "Research Methods", "Validity", "This quality asks whether a test or study actually measures what it claims to measure.", "Validity is about accuracy of measurement, not just consistency."),
  concept(["ap-psych"], ["research", "methods"], "Research Methods", "Reliability", "This quality means a test or measure gives consistent results across time, items, or observers.", "Reliability means the measure is dependable enough to use again."),
  concept(["ap-psych"], ["biological", "bases", "neuro"], "Biological Bases", "Neurotransmitter", "This chemical messenger crosses a synapse and helps one neuron communicate with another.", "Neurotransmitters are central to biological explanations of behavior and mental processes."),
  concept(["ap-psych"], ["biological", "bases", "neuro"], "Biological Bases", "Neuroplasticity", "This capacity allows the brain to reorganize pathways after experience, learning, injury, or repeated practice.", "Neuroplasticity explains how the nervous system can change over time."),
  concept(["ap-psych"], ["cognition", "memory"], "Cognition", "Working memory", "This active memory system briefly holds and manipulates information while a person is solving a problem.", "Working memory is the mental workspace used during thinking and comprehension."),
  concept(["ap-psych"], ["cognition", "memory"], "Cognition", "Schema", "This mental framework organizes prior knowledge and shapes how new information is interpreted.", "A schema helps people process information but can also bias interpretation."),
  concept(["ap-psych"], ["development", "learning"], "Development", "Accommodation", "In Piaget's theory, this process changes an existing mental framework when new information does not fit.", "Accommodation revises a schema to handle a new experience."),
  concept(["ap-psych"], ["development", "learning"], "Development", "Assimilation", "In Piaget's theory, this process places new information into an existing mental framework.", "Assimilation uses an existing schema to understand something new."),
  concept(["ap-psych"], ["development", "learning"], "Learning", "Observational learning", "This kind of learning occurs when a person changes behavior after watching a model.", "Observational learning is learning through modeling rather than direct reinforcement alone."),
  concept(["ap-psych"], ["social", "personality"], "Social Psychology", "Cognitive dissonance", "This uncomfortable tension occurs when a person's attitudes and actions conflict.", "Cognitive dissonance can push people to change beliefs or justify behavior."),
  concept(["ap-psych"], ["social", "personality"], "Social Psychology", "Fundamental attribution error", "This bias overemphasizes personality and underestimates the situation when explaining another person's behavior.", "The fundamental attribution error is a core social psychology concept."),
  concept(["ap-psych"], ["clinical", "positive"], "Clinical Psychology", "Biopsychosocial model", "This approach explains behavior and disorders through biological, psychological, and social influences together.", "The biopsychosocial model avoids reducing mental health to only one cause."),
  concept(["ap-psych"], [], "Psychology Concepts", "Attachment", "This close emotional bond between a child and caregiver is central to early social development.", "Attachment is a major developmental concept tied to security, caregiving, and later relationships."),

  concept(["ap-hug"], ["thinking", "geographic", "tools"], "Geographic Thinking", "Scale", "This concept identifies the level of analysis, such as local, regional, national, or global.", "Scale changes what patterns a geographer can see and explain."),
  concept(["ap-hug"], ["thinking", "geographic", "tools"], "Geographic Thinking", "Spatial association", "This relationship exists when two patterns are located in similar places and may be connected.", "Spatial association is used to compare distributions and possible relationships."),
  concept(["ap-hug"], ["thinking", "geographic", "tools"], "Geographic Thinking", "Cultural landscape", "This visible imprint of human activity on the earth includes buildings, roads, fields, and sacred spaces.", "The cultural landscape shows how people shape places over time."),
  concept(["ap-hug"], ["population", "migration"], "Population Geography", "Demographic transition model", "This model links population change to stages of industrialization, birth rates, and death rates.", "The demographic transition model helps explain long-term population patterns."),
  concept(["ap-hug"], ["population", "migration"], "Population Geography", "Dependency ratio", "This measure compares people usually outside the workforce with the working-age population.", "The dependency ratio shows pressure on workers and public services."),
  concept(["ap-hug"], ["culture", "language", "religion"], "Culture", "Stimulus diffusion", "This process spreads the underlying idea of a trait even when the original trait itself changes.", "Stimulus diffusion explains adaptation during cultural spread."),
  concept(["ap-hug"], ["culture", "language", "religion"], "Culture", "Relocation diffusion", "This process spreads a cultural trait when people physically move from one place to another.", "Relocation diffusion connects migration to cultural change."),
  concept(["ap-hug"], ["political", "unit"], "Political Geography", "Centripetal force", "This kind of force pulls people within a state together and strengthens unity.", "A centripetal force promotes national cohesion."),
  concept(["ap-hug"], ["political", "unit"], "Political Geography", "Gerrymandering", "This practice redraws electoral districts to give one political group an advantage.", "Gerrymandering manipulates political space for electoral gain."),
  concept(["ap-hug"], ["agriculture", "rural"], "Agriculture", "Carrying capacity", "This limit is the largest population an environment can support without long-term damage.", "Carrying capacity connects population, resources, and sustainability."),
  concept(["ap-hug"], ["cities", "urban"], "Urban Geography", "Bid-rent theory", "This model explains how land values and land uses change with distance from the central business district.", "Bid-rent theory connects accessibility to urban land prices."),
  concept(["ap-hug"], ["cities", "urban"], "Urban Geography", "Gentrification", "This urban process brings wealthier residents and reinvestment into a lower-income neighborhood, often raising displacement concerns.", "Gentrification changes neighborhoods through reinvestment and rising costs."),
  concept(["ap-hug"], ["industry", "development"], "Development", "Commodity chain", "This network links extraction, production, distribution, and consumption of a product across places.", "A commodity chain traces the geography of a product from inputs to consumers."),
  concept(["ap-hug"], [], "Human Geography Concepts", "Time-space compression", "This concept describes how transportation and communication make distant places feel more connected.", "Time-space compression explains how technology changes perceived distance."),

  concept(["economics"], ["decision", "scarcity", "choice"], "Economic Reasoning", "Opportunity cost", "This is the next-best alternative given up when a choice is made.", "Opportunity cost is the core tradeoff behind economic decision-making."),
  concept(["economics"], ["decision", "scarcity", "choice"], "Economic Reasoning", "Marginal analysis", "This decision method compares extra benefits with extra expenses from one additional unit.", "Marginal analysis is the logic behind rational choices at the edge."),
  concept(["economics"], ["supply", "demand", "market"], "Markets", "Elasticity", "This measure tells how strongly quantity responds when price, income, or another factor changes.", "Elasticity measures responsiveness in economic models."),
  concept(["economics"], ["supply", "demand", "market"], "Markets", "Deadweight loss", "This lost surplus appears when a market outcome is inefficient compared with the competitive equilibrium.", "Deadweight loss measures the cost of inefficiency."),
  concept(["economics"], ["market", "failure", "policy"], "Market Failure", "Externality", "This occurs when a cost or benefit of an activity falls on someone outside the transaction.", "Externalities justify many debates about regulation and public policy."),
  concept(["economics"], ["market", "failure", "policy"], "Market Failure", "Price ceiling", "This legal maximum price can create shortages when set below equilibrium.", "A price ceiling caps the price buyers can legally be charged."),
  concept(["economics"], ["market", "failure", "policy"], "Market Failure", "Price floor", "This legal minimum price can create surpluses when set above equilibrium.", "A price floor prevents the market price from falling below a set level."),
  concept(["economics"], ["trade", "international"], "Trade", "Comparative advantage", "This principle says producers should specialize where their sacrifice of alternatives is lowest.", "Comparative advantage explains gains from specialization and trade."),
  concept(["economics"], ["macro", "policy", "stabilization"], "Macroeconomic Policy", "Fiscal policy", "This government tool uses taxes and spending to influence output, employment, and inflation.", "Fiscal policy is carried out by elected branches through budgets and taxes."),
  concept(["economics"], ["macro", "policy", "stabilization"], "Macroeconomic Policy", "Monetary policy", "This central bank tool changes money, credit, and interest rates to influence the economy.", "Monetary policy is carried out by the central bank."),
  concept(["economics"], ["macro", "money", "bank"], "Money and Banking", "Money multiplier", "This ratio estimates how much bank lending can expand the money supply from new reserves.", "The money multiplier links reserves to potential deposit creation."),
  concept(["economics"], ["macro", "money", "bank"], "Money and Banking", "Crowding out", "This can happen when government borrowing raises interest rates and reduces private investment.", "Crowding out is a possible side effect of deficit spending."),
  concept(["economics"], ["macro", "graphs", "inflation"], "Macroeconomic Models", "Phillips curve", "This model shows the short-run tradeoff between inflation and unemployment.", "The Phillips curve links price-level changes and labor-market conditions."),
  concept(["economics"], ["macro", "graphs", "inflation"], "Macroeconomic Models", "Stagflation", "This condition combines high inflation with high unemployment and weak growth.", "Stagflation is difficult because inflation and recession occur together."),
  concept(["economics"], ["micro", "competition", "firm"], "Firm Behavior", "Price discrimination", "This practice charges different buyers different prices for the same good when resale is difficult.", "Price discrimination is a strategy used by firms with market power."),
  concept(["economics"], ["micro", "game", "strategy"], "Strategic Behavior", "Nash equilibrium", "This outcome occurs when each player chooses the best response to the other player's strategy.", "Nash equilibrium is central to game theory."),
  concept(["economics"], [], "Economics Concepts", "Automatic stabilizer", "This budget feature changes with the business cycle without a new law from Congress.", "Automatic stabilizers soften recessions or inflationary pressure without new legislation."),

  concept(["civics"], ["constitutional", "foundations", "federalism"], "Constitutional Principles", "Federalism", "This principle divides governing authority between a national government and state governments.", "Federalism is a structural principle of the U.S. Constitution."),
  concept(["civics"], ["constitutional", "foundations", "branches"], "Constitutional Principles", "Separation of powers", "This principle assigns lawmaking, enforcing, and interpreting laws to different branches.", "Separation of powers prevents one branch from holding all governing power."),
  concept(["civics"], ["constitutional", "foundations", "branches"], "Constitutional Principles", "Checks and balances", "This system lets each branch limit actions of the other branches.", "Checks and balances force branches to share and contest power."),
  concept(["civics"], ["foundations", "democracy"], "Democratic Theory", "Pluralist democracy", "This model sees policy as the result of many groups competing for influence.", "Pluralist democracy is a major model of representative government."),
  concept(["civics"], ["foundations", "democracy"], "Democratic Theory", "Participatory democracy", "This model emphasizes broad, active involvement by ordinary citizens in public decision-making.", "Participatory democracy values direct civic action and engagement."),
  concept(["civics"], ["foundations", "democracy"], "Democratic Theory", "Elite democracy", "This model expects elected leaders and other highly informed people to make most political decisions.", "Elite democracy is one way political scientists describe representative rule."),
  concept(["civics"], ["foundations", "democracy"], "Democratic Theory", "Limited government", "This principle restricts public officials through laws, rights, institutions, and constitutional boundaries.", "Limited government prevents public power from becoming unlimited."),
  concept(["civics"], ["foundations", "democracy"], "Democratic Theory", "Factions", "These groups of citizens are united by shared interests that may threaten rights or the public good.", "Factions are central to Madison's argument in Federalist No. 10."),
  concept(["civics"], ["courts", "civil", "liberties"], "Courts and Rights", "Judicial review", "This power allows courts to strike down laws or actions that violate the Constitution.", "Judicial review makes constitutional limits enforceable."),
  concept(["civics"], ["interactions", "branches", "congress", "presidency"], "Branches", "Advice and consent", "This Senate power checks presidential appointments and treaties.", "Advice and consent is a constitutional check on executive power."),
  concept(["civics"], ["interactions", "branches", "congress", "bureaucracy"], "Branches", "Oversight", "This congressional function monitors how agencies and officials carry out laws.", "Oversight lets Congress investigate and supervise implementation."),
  concept(["civics"], ["courts", "civil", "liberties"], "Courts and Rights", "Selective incorporation", "This process applies many Bill of Rights protections to the states through the Fourteenth Amendment.", "Selective incorporation expanded federal protection for civil liberties."),
  concept(["civics"], ["liberties", "rights"], "Courts and Rights", "Prior restraint", "This government action blocks speech or publication before it occurs.", "Prior restraint is usually treated as a serious First Amendment problem."),
  concept(["civics"], ["liberties", "rights"], "Courts and Rights", "Symbolic speech", "This protected expression communicates a political message through conduct rather than spoken words.", "Symbolic speech connects civil liberties to protest."),
  concept(["civics"], ["liberties", "rights"], "Courts and Rights", "Establishment clause", "This First Amendment clause limits government support for religion.", "The establishment clause shapes church-state cases."),
  concept(["civics"], ["civil", "rights", "liberties"], "Rights and Liberties", "Due process", "This principle requires fair legal procedures before government may deprive a person of life, liberty, or property.", "Due process protects people from arbitrary government action."),
  concept(["civics"], ["civil", "rights", "liberties"], "Rights and Liberties", "Equal protection", "This Fourteenth Amendment principle requires government to treat similarly situated people fairly under the law.", "Equal protection is central to civil rights cases."),
  concept(["civics"], ["participation", "elections"], "Political Participation", "Political efficacy", "This belief means people think they can understand politics and influence government.", "Political efficacy affects voting, participation, and trust in democracy."),
  concept(["civics"], ["ideologies", "beliefs", "opinion"], "Political Beliefs", "Political socialization", "This process shapes a person's political values through family, school, media, events, and groups.", "Political socialization explains how political beliefs develop."),
  concept(["civics"], ["ideologies", "beliefs", "polling"], "Political Beliefs", "Sampling error", "This polling measure estimates how far survey results may differ from the true population value.", "Sampling error is central to interpreting public-opinion polls."),
  concept(["civics"], ["participation", "campaigns", "elections"], "Political Participation", "Incumbency advantage", "This electoral edge helps current officeholders because they already have name recognition and resources.", "Incumbency advantage is a major feature of congressional elections."),
  concept(["civics"], ["participation", "campaigns", "elections"], "Political Participation", "Realignment", "This major shift changes party coalitions and voting patterns for many elections.", "Realignment describes durable change in party politics."),
  concept(["civics"], ["institutions", "bureaucracy"], "Institutions", "Bureaucratic discretion", "This authority lets agencies decide how to carry out laws when statutes leave room for judgment.", "Bureaucratic discretion explains how agencies shape policy implementation."),
  concept(["civics"], ["interest", "groups", "policy"], "Interest Groups", "Free-rider problem", "This problem occurs when people benefit from a collective good without helping provide it.", "The free-rider problem makes collective action harder."),
  concept(["civics"], [], "Civics Concepts", "Popular sovereignty", "This principle says government's authority comes from the consent of the people.", "Popular sovereignty is a foundation of republican government."),
  concept(["civics"], [], "Civics Concepts", "Civil society", "This network of voluntary groups and associations connects people outside formal government.", "Civil society supports participation beyond elections and public office."),
  concept(["civics"], [], "Civics Concepts", "Civic virtue", "This idea says citizens should act for the common good, not only private interest.", "Civic virtue links citizenship to responsibility and public life."),
  concept(["civics"], [], "Courts and Rights", "Stare decisis", "This principle encourages courts to follow precedent when deciding similar cases.", "Stare decisis gives the legal system continuity and predictability."),

  concept(["ap-history", "nys-history"], ["civilization", "civilizations", "complex"], "Historical Concepts", "Social stratification", "This concept describes a ranked social structure with unequal status, wealth, or power.", "Social stratification is a key feature of many complex societies."),
  concept(["ap-history", "nys-history"], ["belief", "religion", "culture"], "Cultural History", "Syncretism", "This concept describes the blending of beliefs or practices from different traditions into a new form.", "Syncretism helps explain cultural change after contact."),
  concept(["ap-history", "nys-history"], ["trade", "networks", "interaction"], "Interaction", "Diaspora", "This term describes a scattered population living outside its ancestral homeland while maintaining cultural ties.", "Diaspora communities spread culture, commerce, and identity across regions."),
  concept(["ap-history", "nys-history"], ["classical", "empire", "government"], "State Building", "Bureaucracy", "This organized system of appointed officials helps rulers collect taxes, enforce laws, and manage territory.", "Bureaucracy helps large states govern beyond a single ruler's personal reach."),
  concept(["ap-history", "nys-history"], ["postclassical", "medieval", "feudal"], "Political Systems", "Feudalism", "This decentralized system ties landholding, loyalty, and military service together.", "Feudalism explains many political and social relationships in medieval societies."),
  concept(["ap-history", "nys-history"], ["ottoman", "ming", "china", "empire"], "State Legitimacy", "Legitimacy", "This concept means the accepted right of a ruler or government to exercise authority.", "Legitimacy helps explain why people obey governments and rulers."),
  concept(["ap-history", "nys-history"], ["africa", "americas", "pre-1600", "precolonial"], "Power and Exchange", "Tribute", "This payment of goods, labor, or money is given by a weaker group to a stronger power.", "Tribute systems helped states extract resources and signal hierarchy."),
  concept(["ap-history", "nys-history"], ["europe", "russia", "absolutism"], "State Power", "Absolutism", "This political idea claims a monarch should hold broad centralized authority over the state.", "Absolutism is used to explain royal power in early modern states."),
  concept(["ap-history", "nys-history"], ["enlightenment", "revolution", "atlantic"], "Revolutionary Ideas", "Natural rights", "This Enlightenment idea says people possess basic rights that governments should protect.", "Natural rights shaped Atlantic revolutions and constitutional government."),
  concept(["ap-history", "nys-history"], ["enlightenment", "revolution", "atlantic"], "Revolutionary Ideas", "Social contract", "This theory says government is based on an agreement between rulers and the governed.", "Social contract theory challenged divine-right monarchy."),
  concept(["ap-history", "nys-history"], ["industrial", "gilded", "market"], "Economic Change", "Urbanization", "This process increases the share of people living in cities.", "Urbanization often follows industrialization, migration, and economic change."),
  concept(["ap-history", "nys-history"], ["imperialism", "empire", "expansion"], "Imperialism", "Sphere of influence", "This area remains formally independent but is dominated by an outside power's economic or political control.", "Spheres of influence were common in imperial competition."),
  concept(["ap-history", "nys-history"], ["world war", "global conflict", "war"], "Global Conflict", "Total war", "This form of conflict mobilizes a society's economy, civilians, and government for military victory.", "Total war blurs the line between battlefield and home front."),
  concept(["ap-history", "nys-history"], ["world war", "global conflict", "appeasement"], "Global Conflict", "Appeasement", "This policy gives in to an aggressor's demands in hopes of avoiding a larger conflict.", "Appeasement is a key concept in the road to World War II."),
  concept(["ap-history", "nys-history"], ["cold war"], "Cold War", "Proxy war", "This conflict involves rival powers supporting opposing sides without directly fighting each other.", "Proxy wars were a major feature of superpower competition."),
  concept(["ap-history", "nys-history"], ["cold war"], "Cold War", "Detente", "This period of reduced tension featured negotiation and arms-control efforts between rival superpowers.", "Detente describes a thaw in Cold War relations."),
  concept(["ap-history", "nys-history"], ["cold war"], "Cold War", "Brinkmanship", "This risky strategy pushes a crisis close to open conflict to force the other side to back down.", "Brinkmanship describes high-stakes Cold War crisis behavior."),
  concept(["ap-history", "nys-history"], ["cold war"], "Cold War", "Mutually assured destruction", "This nuclear doctrine argued that war would be avoided because both sides could destroy each other.", "Mutually assured destruction shaped superpower strategy during the nuclear age.", ["MAD"]),
  concept(["ap-history", "nys-history"], ["cold war"], "Cold War", "Domino theory", "This idea claimed one country's fall to communism could cause nearby countries to fall too.", "Domino theory influenced U.S. intervention decisions during the Cold War."),
  concept(["ap-history", "nys-history"], ["decolonization", "nationalism"], "Decolonization", "Self-determination", "This principle says people should be able to choose their own political status or government.", "Self-determination shaped anti-imperial and nationalist movements."),
  concept(["ap-history", "nys-history"], ["decolonization", "nationalism"], "Decolonization", "Nonalignment", "This Cold War position avoided formal alliance with either superpower bloc.", "Nonalignment let newly independent states seek independence in foreign policy."),
  concept(["ap-history", "nys-history"], ["globalization", "modern"], "Globalization", "Interdependence", "This concept means countries, economies, and societies rely on one another.", "Interdependence is a core idea in globalization."),
  concept(["ap-history", "nys-history"], ["human rights", "genocide"], "Human Rights", "Crimes against humanity", "This legal category covers widespread or systematic attacks against civilians.", "Crimes against humanity is a key postwar human-rights concept."),
  concept(["ap-history", "nys-history"], ["constitutional", "foundations", "colonial", "revolution"], "U.S. Government", "Republicanism", "This principle favors elected representatives and civic virtue over direct rule by a monarch.", "Republicanism shaped American political thought and constitutional design."),
  concept(["ap-history", "nys-history"], ["constitutional", "foundations", "courts"], "U.S. Government", "Judicial review", "This power lets courts declare laws or government actions unconstitutional.", "Judicial review is a core constitutional principle in U.S. history."),
  concept(["ap-history", "nys-history"], ["constitutional", "foundations"], "U.S. Government", "Ratification", "This formal approval process was required before the Constitution could take effect.", "Ratification was the process that turned the proposed Constitution into the governing framework."),
  concept(["ap-history", "nys-history"], ["constitutional", "foundations"], "U.S. Government", "Consent of the governed", "This idea says the people are the source of legitimate government authority.", "Consent of the governed is a core principle of constitutional democracy."),
  concept(["ap-history", "nys-history"], ["constitutional", "foundations"], "U.S. Government", "Enumerated powers", "These are powers specifically listed for the national government in the Constitution.", "Enumerated powers define authority that the Constitution directly grants."),
  concept(["ap-history", "nys-history"], ["constitutional", "foundations"], "U.S. Government", "Reserved powers", "These are powers kept by the states or people because they are not granted to the national government.", "Reserved powers reflect the federal structure of the Constitution."),
  concept(["ap-history", "nys-history"], ["constitutional", "foundations"], "U.S. Government", "Federalist No. 10", "This essay argues that a large republic can control factions by multiplying interests.", "Federalist No. 10 is a key defense of the Constitution's republican structure."),
  concept(["ap-history", "nys-history"], ["expansion", "reform", "sectionalism"], "U.S. Expansion", "Sectionalism", "This loyalty to a region over the nation intensified conflict over slavery and economic interests.", "Sectionalism helps explain antebellum political conflict."),
  concept(["ap-history", "nys-history"], ["civil war", "reconstruction"], "Reconstruction", "Sharecropping", "This agricultural labor system tied many freedpeople and poor farmers to landowners through debt.", "Sharecropping limited economic independence after emancipation."),
  concept(["ap-history", "nys-history"], ["industrialization", "gilded"], "Industrial America", "Vertical integration", "This business strategy controls multiple stages of production and distribution in one company.", "Vertical integration was used by major industrial firms to reduce costs and control supply."),
  concept(["ap-history", "nys-history"], ["progressivism", "world war i", "imperialism"], "Reform and Empire", "Trust-busting", "This reform strategy used government power to break up or regulate monopolies.", "Trust-busting was associated with Progressive Era responses to corporate power."),
  concept(["ap-history", "nys-history"], ["depression", "new deal", "prosperity"], "New Deal", "Deficit spending", "This policy funds government activity by spending more than the government collects in revenue.", "Deficit spending became a major debate during economic crises."),
  concept(["ap-history", "nys-history"], ["world war ii"], "World War II", "Internment", "This wartime policy forcibly confined people, including Japanese Americans, away from their homes.", "Internment is a major civil liberties issue in U.S. history."),
  concept(["ap-history", "nys-history"], ["civil rights"], "Civil Rights", "Civil disobedience", "This protest strategy deliberately breaks an unjust law nonviolently to challenge injustice.", "Civil disobedience connects activism, rights, and democratic change."),
  concept(["ap-history", "nys-history"], ["modern", "era", "postwar"], "Modern U.S.", "Affirmative action", "This policy seeks to address past discrimination by considering race, gender, or other factors in opportunities.", "Affirmative action is a major modern civil rights debate."),
  concept(["ap-history", "nys-history"], ["1491", "1607"], "Colonial Encounters", "Encomienda system", "This Spanish labor system granted colonists control over Indigenous labor and tribute.", "The encomienda system is central to early Spanish colonization."),
  concept(["ap-history", "nys-history"], ["1607", "1754"], "Colonial America", "Salutary neglect", "This British approach loosely enforced imperial rules, allowing colonial self-government to grow.", "Salutary neglect helps explain colonial political development."),
  concept(["ap-history", "nys-history"], ["1754", "1800"], "Revolutionary America", "Republican motherhood", "This idea linked women's domestic roles to raising virtuous citizens for the republic.", "Republican motherhood connects gender roles to early national politics."),
  concept(["ap-history", "nys-history"], ["1800", "1848"], "Antebellum Reform", "Second Great Awakening", "This religious revival encouraged reform movements and emphasized individual moral responsibility.", "The Second Great Awakening fueled many antebellum reforms."),
  concept(["ap-history", "nys-history"], ["1844", "1877"], "Civil War Era", "Free Soil movement", "This movement opposed the expansion of slavery into western territories.", "The Free Soil movement sharpened sectional conflict before the Civil War."),
  concept(["ap-history", "nys-history"], ["1865", "1898"], "Gilded Age", "Gospel of Wealth", "This idea argued that the rich should use their fortunes to benefit society.", "The Gospel of Wealth justified philanthropy by industrial elites."),
  concept(["ap-history", "nys-history"], ["1890", "1945"], "Modern U.S.", "New Deal coalition", "This voting alliance joined labor, urban voters, immigrants, Black voters, and southern Democrats.", "The New Deal coalition reshaped twentieth-century U.S. politics."),
  concept(["ap-history", "nys-history"], ["1945", "1980"], "Postwar America", "Suburbanization", "This process moved many families and businesses from cities to surrounding residential communities.", "Suburbanization transformed postwar politics, society, and geography."),
  concept(["ap-history", "nys-history"], ["1980", "present"], "Modern U.S.", "Deregulation", "This policy reduces government rules on businesses and markets.", "Deregulation was central to late twentieth-century conservative economic policy."),
  concept(["ap-history", "nys-history"], ["global tapestry"], "AP World Concepts", "Mandate of Heaven", "This Chinese idea said rulers held authority only while they governed justly.", "The Mandate of Heaven helped legitimize dynastic rule in China."),
  concept(["ap-history", "nys-history"], ["networks of exchange"], "AP World Concepts", "Caravanserai", "This roadside inn supported merchants and animals along overland trade routes.", "Caravanserai helped sustain long-distance exchange across Afro-Eurasia."),
  concept(["ap-history", "nys-history"], ["land-based empires"], "AP World Concepts", "Gunpowder empire", "This term describes states that used firearms and artillery to expand and centralize power.", "Gunpowder empires show the military side of early modern state building."),
  concept(["ap-history", "nys-history"], ["transoceanic"], "AP World Concepts", "Mercantilism", "This economic system tried to increase state power by controlling trade and accumulating bullion.", "Mercantilism shaped European colonization and Atlantic commerce."),
  concept(["ap-history", "nys-history"], ["revolutions"], "AP World Concepts", "Liberalism", "This ideology emphasized individual rights, constitutional government, and limits on monarchy.", "Liberalism shaped many Atlantic and nineteenth-century revolutions."),
  concept(["ap-history", "nys-history"], ["consequences of industrialization"], "AP World Concepts", "Social Darwinism", "This ideology misapplied survival-of-the-fittest ideas to justify inequality and imperialism.", "Social Darwinism was used to defend hierarchy in the industrial age."),
  concept(["ap-history", "nys-history"], ["renaissance", "exploration"], "AP European Concepts", "Humanism", "This Renaissance movement emphasized classical learning and human potential.", "Humanism was central to Renaissance intellectual life."),
  concept(["ap-history", "nys-history"], ["reformation"], "AP European Concepts", "Predestination", "This doctrine teaches that salvation is determined by God's will rather than human action.", "Predestination was an important belief in Calvinist theology."),
  concept(["ap-history", "nys-history"], ["absolutism", "constitutionalism"], "AP European Concepts", "Divine right", "This idea claims monarchs receive their authority from God.", "Divine right was used to defend absolute monarchy."),
  concept(["ap-history", "nys-history"], ["absolutism", "constitutionalism"], "AP European Concepts", "Balance of power", "This diplomatic principle seeks to prevent any one state from becoming too dominant.", "Balance of power politics shaped early modern European diplomacy."),
  concept(["ap-history", "nys-history"], ["scientific", "philosophical", "political"], "AP European Concepts", "Empiricism", "This approach emphasizes observation and experience as sources of knowledge.", "Empiricism shaped scientific and Enlightenment thought."),
  concept(["ap-history", "nys-history"], ["conflict", "crisis", "reaction"], "AP European Concepts", "Conservatism", "This ideology defended tradition, hierarchy, and established institutions after revolutionary upheaval.", "Conservatism shaped post-Napoleonic European politics."),
  concept(["ap-history", "nys-history"], ["industrialization", "effects"], "AP European Concepts", "Proletariat", "This term refers to the industrial working class in Marxist analysis.", "The proletariat is central to nineteenth-century labor and socialist thought."),
  concept(["ap-history", "nys-history"], ["19th-century", "perspectives"], "AP European Concepts", "Realpolitik", "This approach pursues practical power politics instead of ideology or moral principle.", "Realpolitik is associated with nineteenth-century statecraft."),
  concept(["ap-history", "nys-history"], ["contemporary europe"], "AP European Concepts", "Welfare state", "This system uses government programs to provide social protections such as health care or pensions.", "The welfare state became important in modern European politics."),
  concept(["ap-history", "nys-history"], ["ap final", "yearlong", "cumulative"], "Historical Thinking", "Contextualization", "This reasoning skill explains how a development fits the larger conditions of its time and place.", "Contextualization is a core historical reasoning skill on AP and Regents-style exams."),
  concept(["ap-history", "nys-history"], ["grade 5", "grade 6", "grade 7", "grade 8"], "Social Studies Skills", "Primary source", "This kind of evidence comes from the time period or event being studied.", "A primary source gives students direct evidence from the historical period."),
  concept(["ap-history", "nys-history"], ["grade 5", "grade 6", "grade 7", "grade 8"], "Social Studies Skills", "Region", "This area is defined by shared physical, cultural, political, or economic features.", "Region is a core geography concept for organizing places."),
  concept(["ap-history", "nys-history"], ["early peoples"], "Social Studies Skills", "Adaptation", "This concept describes how people adjust to their environment to meet needs.", "Adaptation connects human choices to geography and resources."),
  concept(["ap-history", "nys-history"], ["government in the western hemisphere"], "Government Concepts", "Rule of law", "This principle means leaders and citizens must follow the same legal rules.", "Rule of law is a foundation of fair government."),
  concept(["ap-history", "nys-history"], ["neolithic"], "Early History", "Domestication", "This process tames plants or animals for human use.", "Domestication helped create farming societies."),
  concept(["ap-history", "nys-history"], ["neolithic"], "Early History", "Agricultural surplus", "This extra food supply lets some people specialize in jobs beyond farming.", "Agricultural surplus helped settlements become more complex."),
  concept(["ap-history", "nys-history"], ["river valley"], "Early Civilizations", "Irrigation", "This system moves water to crops when rainfall is not enough.", "Irrigation supported farming in early river valley civilizations."),
  concept(["ap-history", "nys-history"], ["religions"], "Belief Systems", "Monotheism", "This belief system centers on one God.", "Monotheism is a core concept in several world religions."),
  concept(["ap-history", "nys-history"], ["interactions across the eastern hemisphere"], "Interaction", "Cross-cultural exchange", "This process occurs when societies share goods, ideas, technologies, or practices through contact.", "Cross-cultural exchange explains change across connected regions."),
  concept(["ap-history", "nys-history"], ["independence"], "American Revolution", "Grievance", "This term means a formal complaint about unfair treatment or policy.", "Grievances against Britain shaped revolutionary arguments."),
  concept(["ap-history", "nys-history"], ["constitution in practice"], "Constitutional Concepts", "Cabinet", "This advisory group helps the president lead executive departments.", "The Cabinet shows how executive practice developed under the Constitution."),
  concept(["ap-history", "nys-history"], ["constitution in practice", "historical development of the constitution"], "Constitutional Concepts", "Amendment process", "This procedure allows formal changes to the Constitution.", "The amendment process balances flexibility with constitutional stability."),
  concept(["ap-history", "nys-history"], ["westward expansion"], "U.S. Expansion", "Annexation", "This process adds territory to an existing country or state.", "Annexation was central to U.S. territorial growth."),
  concept(["ap-history", "nys-history"], ["westward expansion"], "U.S. Expansion", "Reservation system", "This policy confined Native nations to specific lands controlled by the federal government.", "The reservation system shows the human cost of U.S. expansion."),
  concept(["ap-history", "nys-history"], ["reconstruction"], "Reconstruction", "Black Codes", "These state laws restricted the rights and freedoms of formerly enslaved people.", "Black Codes showed resistance to Reconstruction after the Civil War."),
  concept(["ap-history", "nys-history"], ["changing society"], "Industrial America", "Tenement", "This crowded urban apartment building often housed working-class immigrant families.", "Tenements reveal conditions created by immigration and urbanization."),
  concept(["ap-history", "nys-history"], ["foreign policy"], "Foreign Policy", "Isolationism", "This policy avoids involvement in other nations' political or military conflicts.", "Isolationism is a recurring idea in U.S. foreign-policy debates."),
  concept(["ap-history", "nys-history"], [], "Historical Thinking", "Causation", "This reasoning concept explains how one event, condition, or decision helps produce another.", "Causation is a core historical reasoning skill."),
  concept(["ap-history", "nys-history"], [], "Historical Thinking", "Continuity and change", "This reasoning concept asks what stayed similar and what shifted across a period of time.", "Continuity and change helps students track historical development over time."),
  concept(["ap-history", "nys-history"], [], "Political Concepts", "Sovereignty", "This concept means a state has independent authority over its territory and government.", "Sovereignty is central to state power, diplomacy, and nationalism.")
];

function finalContext(meta, game) {
  return normalize([
    meta.course,
    meta.gradeBand,
    meta.gameType,
    game.exam,
    game.title,
    game.day
  ].flat().join(" "));
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function tagWordCount(tag) {
  return normalize(tag).split(" ").filter(Boolean).length;
}

function conceptScore(candidate, lane, context) {
  if (!candidate.lanes.includes(lane)) return -1;
  if (candidate.tags.length === 0) return 1;
  const matchedTags = candidate.tags.filter((tag) => context.includes(normalize(tag)));
  if (!matchedTags.length) return -1;
  const tagWeight = matchedTags.reduce((sum, tag) => sum + tagWordCount(tag), 0);
  const completeMatchBonus = matchedTags.length === candidate.tags.length ? 12 : 0;
  return 100 + tagWeight * 10 + matchedTags.length + completeMatchBonus;
}

function hasAnswerLeak(text, answer) {
  const normalizedAnswer = normalize(answer);
  if (normalizedAnswer.length < 5) return false;
  const normalizedText = normalize(text);
  return normalizedText.includes(normalizedAnswer);
}

function usableFinalCandidate(candidate, answers) {
  const answerKey = normalize(candidate.answer);
  if (!answerKey || answers.has(answerKey)) return false;
  if (hasAnswerLeak(candidate.clue, candidate.answer)) return false;
  return true;
}

function signalFor(clue, answer, category, game) {
  const base = clue.sourceClue || clue.clue || clue.explanation || "";
  let signal = clean(base)
    .replace(/^identify(?: the)?\s+/i, "")
    .replace(/^which answer best (?:matches|names|explains)\s+/i, "")
    .replace(/^this clue asks for\s+/i, "");
  signal = removeAnswerLeak(signal, answer);
  if (normalize(signal).split(" ").filter(Boolean).length < 3) {
    const safeCategory = safeContext(category, answer, "this category");
    const safeUnit = safeContext(game.title, answer, "this unit");
    signal = `a specific development from ${safeCategory} that belongs in ${safeUnit}`;
  }
  return sentence(signal);
}

function conciseJeopardyClue(clue, answer, category, game) {
  const signal = signalFor(clue, answer, category, game)
    .replace(/^this is\s+/i, "");
  const stripped = removeAnswerLeak(signal, answer).replace(/^(a|an)\s+/i, "");
  if (normalize(stripped).split(" ").filter(Boolean).length < 3) {
    const safeCategory = safeContext(category, answer, "this category");
    const safeUnit = safeContext(game.title, answer, "this unit");
    return sentence(`This ${safeCategory} term belongs in ${safeUnit}`);
  }
  return sentence(stripped);
}

function conciseExplanation(clue, answer, category, game) {
  const source = clean(clue.sourceExplanation || "");
  if (source && !/fits this clue|Exam alignment|Review move|standards-aligned|course-level clue/i.test(source)) {
    return sentence(source);
  }
  return sentence(`${answer}: ${signalFor(clue, answer, category, game)}`);
}

function hardenClue(clue, categoryName, game, meta) {
  const value = Number(clue.value);
  const answer = clean(clue.answer);
  const alignment = alignmentFor(meta, game);
  const skill = VALUE_SKILLS[value] || "review key content";
  clue.sourceClue = clue.sourceClue || clue.clue;
  clue.sourceExplanation = clue.sourceExplanation || clue.explanation || "";
  clue.clue = conciseJeopardyClue(clue, answer, categoryName, game);
  clue.explanation = conciseExplanation(clue, answer, categoryName, game);
  clue.rigor = {
    value,
    skill,
    alignment: alignment.standardSet,
    examTarget: alignment.examTarget
  };
  return clue;
}

function finalFor(game, meta, answers) {
  const lane = courseLane(meta, game);
  const context = finalContext(meta, game);
  const alignment = alignmentFor(meta, game);
  const candidates = FINAL_CONCEPTS
    .map((candidate) => ({ candidate, score: conceptScore(candidate, lane, context) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return stableHash(`${context}|${a.candidate.answer}`) - stableHash(`${context}|${b.candidate.answer}`);
    })
    .map((entry) => entry.candidate);
  const picked = candidates.find((candidate) => usableFinalCandidate(candidate, answers));
  if (!picked) throw new Error(`No usable Final Jeopardy concept for ${meta.file || game.title}`);
  const aliases = (picked.aliases || []).filter((alias) => !answers.has(normalize(alias)));
  const explanation = sentence(picked.explanation);
  return {
    category: picked.category,
    clue: picked.clue,
    answer: picked.answer,
    aliases,
    explanation,
    rigor: {
      value: "Final",
      skill: "answer one difficult course concept with one correct response",
      alignment: alignment.standardSet,
      examTarget: alignment.examTarget
    }
  };
}

function hardenGame(game, meta) {
  const answers = new Set();
  for (const category of game.categories || []) {
    for (const clue of category.clues || []) answers.add(normalize(clue.answer));
  }
  for (const category of game.categories || []) {
    category.clues = (category.clues || []).map((clue) => hardenClue(clue, category.name, game, meta));
  }
  game.final = {
    sourceFinal: game.final && !game.final.sourceFinal ? { ...game.final } : game.final?.sourceFinal,
    ...finalFor(game, meta, answers)
  };
  game.alignment = {
    ...alignmentFor(meta, game),
    hardeningVersion: HARDENING_VERSION,
    boardShape: "5 categories x 5 clues, values 100-500, Final Jeopardy as one difficult concept-answer clue",
    difficultyLadder: VALUE_SKILLS
  };
  game.hardeningVersion = HARDENING_VERSION;
  return game;
}

function main() {
  const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
  const targets = games.filter(isJeopardyManifestEntry);
  const report = {
    version: HARDENING_VERSION,
    boardCount: 0,
    clueCount: 0,
    finalCount: 0,
    files: []
  };

  for (const meta of targets) {
    const file = resolve(root, decodePath(meta.file));
    if (!existsSync(file)) throw new Error(`Missing board file: ${meta.file}`);
    const html = readFileSync(file, "utf8");
    const game = extractGame(html, relative(root, file));
    const hardened = hardenGame(game, meta);
    writeFileSync(file, replaceGame(html, hardened));
    const clueCount = hardened.categories.reduce((sum, category) => sum + category.clues.length, 0);
    report.boardCount += 1;
    report.clueCount += clueCount;
    report.finalCount += hardened.final ? 1 : 0;
    report.files.push({
      file: relative(root, file),
      title: hardened.title,
      course: meta.course,
      clues: clueCount,
      final: hardened.final.category,
      alignment: hardened.alignment.standardSet
    });
  }

  writeFileSync(resolve(root, "data", "jeopardy-hardening-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Hardened ${report.boardCount} Jeopardy boards, ${report.clueCount} clues, and ${report.finalCount} finals.`);
}

main();
