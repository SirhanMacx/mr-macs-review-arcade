(() => {
  "use strict";

  const STORAGE_KEY = "mr-macs-history-hunters-2-v1";
  const TILE = 32;
  const WORLD_W = 160;
  const WORLD_H = 120;
  const PLAYER_TITLE = "ATLAS RANGER";
  const params = new URLSearchParams(window.location.search);
  const FX_LITE = params.get("fx") === "lite" || params.get("fx") === "low";
  const PREFERS_REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const view = { w: 960, h: 540, dpr: 1 };

  const els = {
    game: $("game"),
    canvas: $("screen"),
    exitBtn: $("exitBtn"),
    boot: $("boot"),
    startBtn: $("startBtn"),
    zoneName: $("zoneName"),
    partyHud: $("partyHud"),
    shardHud: $("shardHud"),
    courseHud: $("courseHud"),
    dialogue: $("dialogue"),
    dialogueKicker: $("dialogueKicker"),
    dialogueTitle: $("dialogueTitle"),
    dialogueText: $("dialogueText"),
    dialogueActions: $("dialogueActions"),
    menu: $("menu"),
    closeMenu: $("closeMenu"),
    courseSelect: $("courseSelect"),
    setSelect: $("setSelect"),
    huntBtn: $("huntBtn"),
    questBtn: $("questBtn"),
    partyBtn: $("partyBtn"),
    bagBtn: $("bagBtn"),
    saveBtn: $("saveBtn"),
    menuList: $("menuList"),
    battleUi: $("battleUi"),
    battleLog: $("battleLog"),
    battleActions: $("battleActions"),
    quest: $("quest"),
    questKicker: $("questKicker"),
    questMeta: $("questMeta"),
    questPrompt: $("questPrompt"),
    questSource: $("questSource"),
    questChoices: $("questChoices"),
    questForm: $("questForm"),
    questInput: $("questInput"),
    questFeedback: $("questFeedback"),
    aBtn: $("aBtn"),
    bBtn: $("bBtn"),
    startMenuBtn: $("startMenuBtn")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const tileAtlas = loadImage("../../assets/history-hunters/keyed/retro-tile-sprite-atlas-keyed.png");
  const playerBack = loadImage("../../assets/history-hunters/keyed/player-back-keyed.png");
  const decorSheet = loadImage("../../assets/history-hunters/generated/overworld-decor-sheet-v3.png");
  const trainerSheet = loadImage("../../assets/history-hunters/generated/trainer-sprite-sheet-v1.png");
  const landmarkSheet = loadImage("../../assets/history-hunters/generated/landmark-sprite-sheet-v1.png");
  const companionSheets = [
    loadImage("../../assets/history-hunters/generated/battle-companion-sheet-v1.png"),
    loadImage("../../assets/history-hunters/generated/battle-companion-sheet-v2.png"),
    loadImage("../../assets/history-hunters/generated/battle-companion-sheet-v3.png")
  ];
  const figureAtlases = Array.from({ length: 10 }, (_, i) => loadImage(`../../assets/history-hunters/keyed/battle-figure-atlas-${i + 1}-keyed.png`));

  const atlas = {
    grassA: [41, 36, 104, 104],
    grassB: [154, 36, 100, 104],
    grassC: [265, 36, 100, 104],
    pathA: [391, 36, 101, 106],
    pathB: [514, 36, 110, 105],
    waterA: [652, 36, 101, 103],
    waterB: [762, 36, 92, 104],
    treeA: [42, 384, 103, 112],
    treeB: [153, 384, 96, 116],
    mountainA: [525, 392, 116, 105],
    school: [42, 709, 142, 105],
    gate: [455, 712, 132, 103],
    arch: [291, 713, 124, 102],
    portal: [608, 710, 130, 106],
    sign: [802, 729, 74, 83],
    chest: [889, 717, 91, 89],
    playerFront: [231, 857, 96, 118],
    playerSide: [345, 857, 94, 118],
    playerBack: [455, 857, 94, 118],
    playerSideAlt: [569, 857, 94, 118],
    scholar: [64, 1266, 181, 154]
  };

  const typeRules = [
    { name: "AP Econ", cluster: "economics", color: "#f3cf61", match: /AP Economics Combined/i, move: "Incentive Shift" },
    { name: "AP Macro", cluster: "economics", color: "#f3cf61", match: /AP Macroeconomics/i, move: "Policy Shock" },
    { name: "AP Micro", cluster: "economics", color: "#f3cf61", match: /AP Microeconomics/i, move: "Market Pressure" },
    { name: "Economics", cluster: "economics", color: "#f3cf61", match: /Economics Course/i, move: "Scarcity Strike" },
    { name: "AP Gov", cluster: "civics", color: "#75f4ff", match: /AP U\.S\. Government/i, move: "Checks Balance" },
    { name: "Civics", cluster: "civics", color: "#75f4ff", match: /Civics|PIG/i, move: "Civic Action" },
    { name: "APUSH", cluster: "us", color: "#77f0af", match: /AP U\.S\. History/i, move: "Republic Rally" },
    { name: "US Regents", cluster: "us", color: "#77f0af", match: /Grade 11|NYS U\.S\. History/i, move: "Federal Focus" },
    { name: "Grade 5", cluster: "foundations", color: "#ffb15f", match: /Grade 5/i, move: "Hemisphere Hop" },
    { name: "Grade 6", cluster: "global", color: "#c9a0ff", match: /Grade 6/i, move: "Civilization Spark" },
    { name: "Grade 7", cluster: "us", color: "#77f0af", match: /Grade 7/i, move: "Republic Rush" },
    { name: "Grade 8", cluster: "us", color: "#77f0af", match: /Grade 8/i, move: "Reform Relay" },
    { name: "Global 9", cluster: "global", color: "#c9a0ff", match: /Grade 9/i, move: "Empire Echo" },
    { name: "Global 10", cluster: "global", color: "#c9a0ff", match: /Grade 10/i, move: "Revolution Wave" },
    { name: "Global Regents", cluster: "global", color: "#c9a0ff", match: /NYS Global/i, move: "Enduring Issue" },
    { name: "AP World", cluster: "global", color: "#c9a0ff", match: /AP World/i, move: "World System" },
    { name: "AP Euro", cluster: "global", color: "#c9a0ff", match: /AP European/i, move: "Reform Spark" },
    { name: "Human Geo", cluster: "geography", color: "#8ee6ff", match: /AP Human Geography/i, move: "Spatial Shift" },
    { name: "AP Psych", cluster: "psychology", color: "#ff9bd2", match: /AP Psychology/i, move: "Behavior Loop" },
    { name: "Review", cluster: "review", color: "#edf987", match: /All Courses|Review/i, move: "Archive Pulse" }
  ];

  const clusterEffects = {
    economics: { strong: ["civics", "geography"], weak: ["psychology"] },
    civics: { strong: ["us", "economics"], weak: ["global"] },
    us: { strong: ["civics", "foundations"], weak: ["global"] },
    global: { strong: ["geography", "us"], weak: ["economics"] },
    geography: { strong: ["global", "economics"], weak: ["civics"] },
    psychology: { strong: ["civics", "economics"], weak: ["geography"] },
    foundations: { strong: ["global", "geography"], weak: ["economics"] },
    review: { strong: [], weak: [] }
  };

  const familiesByType = {
    "AP Econ": [["Adam Smith", ["Kirkcaldy Thinker", "Market Smith", "Invisible-Hand Sage"], "Explains incentives, specialization, trade, and market logic."], ["John Maynard Keynes", ["Cambridge Debater", "Demand Doctor", "Policy Stormcaller"], "Powers up on recessions, stabilization, and demand."], ["Elinor Ostrom", ["Commons Scout", "Institution Builder", "Collective-Action Legend"], "Handles public goods, incentives, and shared resources."]],
    "AP Macro": [["John Maynard Keynes", ["Cambridge Debater", "Demand Doctor", "Policy Stormcaller"], "Battles recessions, unemployment, inflation, and fiscal policy."], ["Janet Yellen", ["Data Reader", "Fed Chair", "Soft-Landing Strategist"], "Tracks labor markets, inflation, and monetary policy."], ["Paul Volcker", ["Rate Rookie", "Inflation Breaker", "Central Bank Titan"], "Specializes in money, interest rates, and inflation."]],
    "AP Micro": [["Alfred Marshall", ["Supply Sketcher", "Demand Mapper", "Equilibrium Master"], "Works through supply, demand, elasticity, and market models."], ["Joan Robinson", ["Firm Analyst", "Imperfect Competitor", "Market Power Maven"], "Handles monopoly, competition, costs, and market structures."], ["Elinor Ostrom", ["Commons Scout", "Institution Builder", "Collective-Action Legend"], "Powers up around externalities and public goods."]],
    "Economics": [["Adam Smith", ["Kirkcaldy Thinker", "Market Smith", "Invisible-Hand Sage"], "Covers scarcity, trade, specialization, and markets."], ["John Maynard Keynes", ["Cambridge Debater", "Demand Doctor", "Policy Stormcaller"], "Connects government policy, downturns, and money."], ["Milton Friedman", ["Money Mapper", "Monetarist Mentor", "Inflation Hawk"], "Focuses on money supply, markets, and inflation."]],
    "AP Gov": [["James Madison", ["Virginia Note-Taker", "Federalist Framer", "Constitution Architect"], "Built for federalism, factions, checks and balances."], ["Thurgood Marshall", ["Courtroom Advocate", "Equal-Protection Champion", "Justice Sentinel"], "Specializes in rights, courts, and civil liberties."], ["Barbara Jordan", ["Debate Captain", "Constitution Voice", "Civic Standard-Bearer"], "Powers up with representation and political principles."]],
    "Civics": [["James Madison", ["Virginia Note-Taker", "Federalist Framer", "Constitution Architect"], "Anchors checks and balances, federalism, factions, and rights."], ["Ida B. Wells", ["Memphis Journalist", "Truth Campaigner", "Justice Watchdog"], "Powers up through civic courage and reform."], ["Eleanor Roosevelt", ["Newspaper Voice", "UN Delegate", "Human Rights Herald"], "Connects citizenship, rights, and public service."]],
    "APUSH": [["George Washington", ["Mount Vernon Scout", "Continental Commander", "Republic Founder"], "Covers founding, precedent, early republic, and leadership."], ["Frederick Douglass", ["Baltimore Reader", "Abolition Orator", "Freedom Editor"], "Handles abolition, reform, citizenship, and rights."], ["Franklin D. Roosevelt", ["Hyde Park Organizer", "New Deal Captain", "Four Freedoms Strategist"], "Connects depression, reform, wartime leadership, and federal power."]],
    "US Regents": [["Abraham Lincoln", ["Frontier Reader", "Union President", "Emancipation Statesman"], "Covers Union, constitutional crisis, emancipation, and Reconstruction."], ["Harriet Tubman", ["Maryland Scout", "Freedom Conductor", "Union Spy"], "Specializes in abolition, resistance, and freedom networks."], ["Martin Luther King Jr.", ["Atlanta Orator", "Montgomery Organizer", "Dream Keeper"], "Handles civil rights, protest, and reform."]],
    "Grade 5": [["Sacagawea", ["River Guide", "Trail Interpreter", "Western Route Legend"], "Connects geography, exploration, and communication."], ["Pachacuti", ["Cusco Builder", "Andes Organizer", "Inca Roadmaker"], "Handles Andes geography, empire, roads, and government."], ["Moctezuma II", ["Tenochtitlan Prince", "Triple-Alliance Ruler", "Mexica Memory"], "Connects Mesoamerica, cities, tribute, and encounter."]],
    "Grade 6": [["Hammurabi", ["Babylon Judge", "Law Code Keeper", "Justice Stele Guardian"], "Built for laws, ancient river valleys, power, and order."], ["Confucius", ["Lu Student", "Ethics Teacher", "Harmony Master"], "Handles belief systems, family, government, and values."], ["Mansa Musa", ["Niani Prince", "Gold Road Ruler", "Mali World Connector"], "Connects West Africa, trade, Islam, and wealth."]],
    "Grade 7": [["George Washington", ["Mount Vernon Scout", "Continental Commander", "Republic Founder"], "Covers Revolution, precedent, early republic, and leadership."], ["Alexander Hamilton", ["Caribbean Clerk", "Treasury Builder", "Federalist Financier"], "Handles Constitution, finance, federal power, and parties."], ["Tecumseh", ["Shawnee Speaker", "Confederacy Builder", "Resistance Strategist"], "Connects Native resistance, land, and expansion."]],
    "Grade 8": [["Abraham Lincoln", ["Frontier Reader", "Union President", "Emancipation Statesman"], "Covers Civil War, constitutional crisis, and Reconstruction."], ["Susan B. Anthony", ["Petition Carrier", "Suffrage Organizer", "Vote-Rights Veteran"], "Powers up on reform, suffrage, and citizenship."], ["Theodore Roosevelt", ["Rough Rider", "Trust-Buster", "Square Deal Ranger"], "Handles progressivism, conservation, and regulation."]],
    "Global 9": [["Hammurabi", ["Babylon Judge", "Law Code Keeper", "Justice Stele Guardian"], "Covers river valleys, law, social order, and authority."], ["Pericles", ["Agora Speaker", "Athenian Strategist", "Democracy Patron"], "Handles Greek democracy, citizenship, culture, and empire."], ["Ibn Battuta", ["Route Walker", "World Traveler", "Network Navigator"], "Reads exchange, travel, Islam, and trade."]],
    "Global 10": [["Mohandas Gandhi", ["Law Student", "Salt March Organizer", "Nonviolence Strategist"], "Works through imperialism, nationalism, civil disobedience, and independence."], ["Nelson Mandela", ["Johannesburg Advocate", "Freedom Negotiator", "Reconciliation President"], "Handles apartheid, resistance, justice, and democracy."], ["Toussaint Louverture", ["Plantation Coachman", "Revolution General", "Haitian Liberator"], "Connects Atlantic revolutions, freedom, and colonialism."]],
    "Global Regents": [["Mohandas Gandhi", ["Law Student", "Salt March Organizer", "Nonviolence Strategist"], "Works through imperialism, nationalism, and civil disobedience."], ["Nelson Mandela", ["Johannesburg Advocate", "Freedom Negotiator", "Reconciliation President"], "Handles apartheid, resistance, and democratic transition."], ["Mansa Musa", ["Niani Prince", "Gold Road Ruler", "Mali World Connector"], "Connects trade, Islam, wealth, empire, and geography."]],
    "AP World": [["Mansa Musa", ["Niani Prince", "Gold Road Ruler", "Mali World Connector"], "Specializes in trade, Islam, wealth, and trans-Saharan networks."], ["Zheng He", ["Harbor Cadet", "Treasure Fleet Admiral", "Indian Ocean Navigator"], "Powers up on maritime trade and Ming China."], ["Mohandas Gandhi", ["Law Student", "Salt March Organizer", "Nonviolence Strategist"], "Handles nationalism, imperialism, and decolonization."]],
    "AP Euro": [["Leonardo da Vinci", ["Workshop Sketcher", "Renaissance Maker", "Universal Genius"], "Thrives on Renaissance, humanism, art, science, and patronage."], ["Martin Luther", ["Wittenberg Monk", "Reformation Spark", "Printing-Press Reformer"], "Powers up around religion, reform, and printing."], ["Napoleon Bonaparte", ["Corsican Cadet", "Consulate Commander", "Code Emperor"], "Connects revolution, nationalism, law, and empire."]],
    "Human Geo": [["Ibn Battuta", ["Route Walker", "World Traveler", "Network Navigator"], "Reads movement, diffusion, trade routes, and connection."], ["Jane Jacobs", ["Block Observer", "City Critic", "Urban Vitality Guardian"], "Specializes in cities, land use, and neighborhoods."], ["Carl Sauer", ["Landscape Reader", "Culture Mapper", "Human-Environment Sage"], "Handles cultural landscapes and regions."]],
    "AP Psych": [["Wilhelm Wundt", ["Lab Listener", "Introspection Founder", "Psychology Pioneer"], "Starts strong on research methods and experimental psychology."], ["B. F. Skinner", ["Box Builder", "Reinforcement Trainer", "Behavior Master"], "Powers up on learning, conditioning, and behavior."], ["Jean Piaget", ["Schema Sorter", "Stage Builder", "Development Sage"], "Handles development, cognition, and schemas."]],
    "Review": [["Archive Keeper", ["Shelf Scout", "Index Captain", "Chronicle Guardian"], "A flexible companion for mixed review runs."], ["Source Sleuth", ["Clue Reader", "Evidence Tracker", "Document Master"], "Handles maps, excerpts, charts, cartoons, and documents."], ["Context Coach", ["Background Buddy", "Era Expert", "Big-Picture Boss"], "Connects causes, effects, context, and review patterns."]]
  };

  const familyAtlasOrder = ["AP Econ", "AP Macro", "AP Micro", "Economics", "AP Euro", "Human Geo", "AP Psych", "AP Gov", "APUSH", "AP World", "Civics", "Global 10", "US Regents", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Global 9", "Global Regents", "Review"];
  const allFamilies = familyAtlasOrder.flatMap((type) => (familiesByType[type] || familiesByType.Review).map((row) => ({ type, historicalName: row[0], names: row[1], line: row[2] })))
    .map((family, index) => Object.assign(family, { id: compactKey(`${family.type}-${family.historicalName}`), atlas: Math.floor(index / 6), row: index % 6 }));
  const familyById = allFamilies.reduce((acc, family) => (acc[family.id] = family, acc), {});

  const places = [
    { id: "center", name: "Chronicle Center", kind: "center", gx: 20, gy: 18, icon: "school", text: "Restore party health and save your field log." },
    { id: "mart", name: "Archive Supply", kind: "shop", gx: 27, gy: 18, icon: "chest", text: "Buy capsules, field notes, and restoration tea with shards." },
    { id: "lab", name: "Professor Mac's Lab", kind: "lab", gx: 20, gy: 12, icon: "gate", text: "Choose a starter, learn the route system, and check progress." },
    { id: "museum", name: "Source Museum", kind: "quest", gx: 43, gy: 26, icon: "arch", text: "Take source and review contracts for XP, shards, and items." },
    { id: "harbor", name: "Exchange Harbor", kind: "quest", gx: 61, gy: 37, icon: "portal", text: "Trade-route contracts and the Harbor Gym test exchange, migration, and global routes.", gym: { id: "harbor", leader: "Pilot Santos", badge: "Exchange Badge", type: "AP World", roster: ["Zheng He", "Mansa Musa", "Ibn Battuta"], intro: "Pilot Santos lowers the harbor flags. Trade winds are up." } },
    { id: "capitol", name: "Civic Capitol", kind: "quest", gx: 86, gy: 18, icon: "school", text: "Government, rights, court cases, civic participation, and the Capitol Gym.", gym: { id: "capitol", leader: "Organizer Noor", badge: "Federalism Badge", type: "AP Gov", roster: ["James Madison", "Thurgood Marshall", "Barbara Jordan"], intro: "Organizer Noor calls the chamber to order." } },
    { id: "ruins", name: "Ancient Ruins", kind: "quest", gx: 16, gy: 49, icon: "arch", text: "River valleys, empires, belief systems, and the Ancient Gym live on this route.", gym: { id: "ancient", leader: "Keeper Imani", badge: "River Valley Badge", type: "Grade 6", roster: ["Hammurabi", "Confucius", "Mansa Musa"], intro: "Keeper Imani raises the clay seal. Ancient law enters the arena." } },
    { id: "reform", name: "Reform Station", kind: "quest", gx: 74, gy: 57, icon: "gate", text: "Revolution, rights, reform, civil war, industrial change, and the Reform Gym.", gym: { id: "reform", leader: "Curator Rivera", badge: "Reform Badge", type: "Grade 8", roster: ["Abraham Lincoln", "Susan B. Anthony", "Theodore Roosevelt"], intro: "Curator Rivera opens the reform ledger. Every turn changes the timeline." } },
    { id: "psych", name: "Mind Lab", kind: "quest", gx: 104, gy: 31, icon: "school", text: "AP Psychology contracts and the Mind Gym: methods, learning, cognition, and development.", gym: { id: "mind", leader: "Professor Vale", badge: "Cognition Badge", type: "AP Psych", roster: ["Wilhelm Wundt", "B. F. Skinner", "Jean Piaget"], intro: "Professor Vale dims the lab lights. The experiment begins." } },
    { id: "bazaar", name: "Market Bazaar", kind: "quest", gx: 49, gy: 74, icon: "chest", text: "Economics contracts and the Market Gym: scarcity, markets, macro policy, trade, and incentives.", gym: { id: "market", leader: "Analyst Vega", badge: "Incentive Badge", type: "Economics", roster: ["Adam Smith", "John Maynard Keynes", "Milton Friedman"], intro: "Analyst Vega rings the market bell. Supply meets demand." } },
    { id: "summit", name: "Atlas Summit", kind: "summit", gx: 111, gy: 72, icon: "portal", text: "The late-game summit arena for mixed review and champion route battles.", gym: { id: "summit", leader: "Captain Ellis", badge: "Atlas Badge", type: "Review", roster: ["Archive Keeper", "Mohandas Gandhi", "Nelson Mandela", "Abraham Lincoln"], intro: "Captain Ellis opens the Atlas Gate. This is a champion route." } },
    { id: "frontier", name: "Frontier Outpost", kind: "quest", gx: 137, gy: 92, icon: "gate", text: "A long-route U.S. history station with a frontier gym for Grade 7, Grade 8, APUSH, and Regents.", gym: { id: "frontier", leader: "Marshal Reed", badge: "Republic Badge", type: "US Regents", roster: ["George Washington", "Harriet Tubman", "Martin Luther King Jr."], intro: "Marshal Reed taps the badge. The republic route is not gentle." } },
    { id: "observatory", name: "World Observatory", kind: "quest", gx: 133, gy: 23, icon: "arch", text: "Global, AP World, AP Euro, Human Geography, and the Observatory Gym meet here.", gym: { id: "world", leader: "Scribe Hana", badge: "World Systems Badge", type: "Global 10", roster: ["Mohandas Gandhi", "Toussaint Louverture", "Nelson Mandela"], intro: "Scribe Hana turns the star map. Revolutions align." } },
    { id: "rights", name: "Rights Court", kind: "quest", gx: 96, gy: 96, icon: "school", text: "Civic action, rights, constitutions, court cases, reform movements, and the Rights Gym.", gym: { id: "rights", leader: "Advocate Samira", badge: "Justice Badge", type: "Civics", roster: ["Ida B. Wells", "Eleanor Roosevelt", "Thurgood Marshall"], intro: "Advocate Samira calls the court to session. Rights are on the line." } },
    { id: "liberty", name: "Liberty Town", kind: "quest", gx: 151, gy: 18, icon: "school", text: "A U.S. history town route for founding, abolition, civil rights, and constitutional change.", battle: true },
    { id: "renaissance", name: "Renaissance Gallery", kind: "quest", gx: 154, gy: 56, icon: "arch", text: "AP European and Global review route: Renaissance, Reformation, revolution, and nationalism.", battle: true },
    { id: "andes", name: "Andes Trail", kind: "quest", gx: 54, gy: 105, icon: "gate", text: "A Grade 5 and ancient Americas route for geography, trade, empire, and encounter.", battle: true },
    { id: "urban", name: "Urban Grid", kind: "quest", gx: 29, gy: 104, icon: "portal", text: "Human Geography route: cities, regions, diffusion, migration, and cultural landscapes.", battle: true },
    { id: "press", name: "Press Row", kind: "quest", gx: 151, gy: 115, icon: "school", text: "A civics and reform side route for public opinion, rights campaigns, and media.", battle: true },
    { id: "industry", name: "Industrial Yard", kind: "quest", gx: 119, gy: 112, icon: "chest", text: "Economics and industrialization route: labor, markets, regulation, and policy choices.", battle: true }
  ];

  const npcs = [
    { id: "guide", name: "Guide Maya", type: "Route Guide", gx: 18, gy: 14, text: "Tall grass starts historical ally battles. Buildings post review contracts. START, M, or P opens pause, filters, party, bag, and save.", starter: true },
    { id: "rival", name: "Ranger Carter", type: "Rival", gx: 26, gy: 14, text: "A real roster wins routes. Level allies with battles, then use contracts to earn shards and field items.", battle: true },
    { id: "curator", name: "Curator Rivera", type: "Source Coach", gx: 41, gy: 24, text: "Contracts are where review questions belong. Battle for fun. Study for rewards.", quest: true },
    { id: "organizer", name: "Organizer Noor", type: "Civic Coach", gx: 84, gy: 16, text: "Rights, reform, and government routes are strongest when you know people, laws, and turning points.", quest: true },
    { id: "pilot", name: "Pilot Santos", type: "Route Pilot", gx: 60, gy: 39, text: "Harbor routes pull allies from trade, migration, exchange, geography, and global history.", quest: true },
    { id: "keeper", name: "Keeper Imani", type: "Ancient Coach", gx: 14, gy: 47, text: "Ancient allies reward careful review of geography, law, belief systems, and power.", quest: true },
    { id: "analyst", name: "Analyst Vega", type: "Market Coach", gx: 51, gy: 72, text: "The Market Bazaar favors economics and government moves. Watch your PP before long route battles.", quest: true },
    { id: "captain", name: "Captain Ellis", type: "Summit Rival", gx: 109, gy: 70, text: "A full party with restored PP matters before the Atlas Summit.", battle: true },
    { id: "scribe", name: "Scribe Hana", type: "Archive Scout", gx: 132, gy: 21, text: "Trade routes, belief systems, and geography are easier when you know where ideas traveled.", quest: true },
    { id: "marshal", name: "Marshal Reed", type: "Frontier Rival", gx: 135, gy: 89, text: "The western route is long. Bring tea, capsules, and a party that can handle U.S. history eras.", battle: true },
    { id: "advocate", name: "Advocate Samira", type: "Rights Coach", gx: 95, gy: 93, text: "Civil rights, human rights, and constitutional rights all reward precise evidence.", quest: true },
    { id: "quartermaster", name: "Quartermaster Jo", type: "Supply Clerk", gx: 30, gy: 21, text: "Check the bag before boss routes. Capsules recruit allies; tea keeps your party standing.", quest: true },
    { id: "gymGuide", name: "Badge Coach Vale", type: "Gym Coach", gx: 18, gy: 51, sprite: "gymLeader", text: "Major landmarks hold badge battles. Beat every roster to unlock tougher rematches.", battle: true },
    { id: "worldTraveler", name: "Traveler Mina", type: "World Trainer", gx: 123, gy: 25, sprite: "traveler", text: "A route team should understand trade, belief systems, diffusion, and geography.", battle: true },
    { id: "shopkeeper", name: "Shopkeeper Ren", type: "Route Trainer", gx: 47, gy: 77, sprite: "shopkeeper", text: "Markets are not just money. Scarcity, incentives, and choices decide battles.", battle: true },
    { id: "professor", name: "Professor Vale", type: "Mind Trainer", gx: 107, gy: 34, sprite: "professor", text: "Learning sticks when a move has context. Reinforcement helps too.", battle: true },
    { id: "badgemaster", name: "Badge Master Arun", type: "Summit Trainer", gx: 113, gy: 75, sprite: "gymLeader", text: "The Atlas Summit checks whether your whole party can survive a full trainer roster.", battle: true },
    { id: "libertyRival", name: "Rival Ellis", type: "Liberty Trainer", gx: 149, gy: 16, sprite: "rival", text: "Liberty Town battles reward parties that can connect founding ideals to later reform movements.", battle: true },
    { id: "renaissanceGuide", name: "Curator Lucia", type: "Gallery Trainer", gx: 152, gy: 58, sprite: "curator", text: "Renaissance, Reformation, revolution, nationalism: this gallery route is built around turning points.", battle: true },
    { id: "andesScout", name: "Scout Amaru", type: "Andes Trainer", gx: 56, gy: 103, sprite: "traveler", text: "Geography is the boss here. Mountains, roads, trade, and empire all shape the fight.", battle: true },
    { id: "urbanPlanner", name: "Planner Jae", type: "Urban Trainer", gx: 27, gy: 102, sprite: "professor", text: "Cities have patterns. Learn the grid, then challenge migration, region, and diffusion battles.", battle: true },
    { id: "pressEditor", name: "Editor Wells", type: "Press Trainer", gx: 149, gy: 113, sprite: "advocate", text: "Public pressure can move history. Press Row checks reform, rights, and civic voice.", battle: true },
    { id: "yardForeman", name: "Foreman Kai", type: "Industry Trainer", gx: 117, gy: 110, sprite: "analyst", text: "Industrial Yard battles hit with labor, capital, markets, regulation, and reform.", battle: true }
  ];

  const decor = [
    { type: "milestone", gx: 15, gy: 18, w: 56, h: 62 },
    { type: "fountain", gx: 23, gy: 21, w: 70, h: 64 },
    { type: "lamp", gx: 28, gy: 16, w: 48, h: 76 },
    { type: "flowers", gx: 32, gy: 20, w: 70, h: 48 },
    { type: "bulletin", gx: 18, gy: 10, w: 64, h: 48 },
    { type: "banner", gx: 31, gy: 17, w: 64, h: 78 },
    { type: "obelisk", gx: 37, gy: 26, w: 54, h: 86 },
    { type: "statue", gx: 45, gy: 22, w: 74, h: 82 },
    { type: "crate", gx: 48, gy: 31, w: 58, h: 56 },
    { type: "column", gx: 17, gy: 45, w: 58, h: 64 },
    { type: "tent", gx: 19, gy: 53, w: 84, h: 70 },
    { type: "bridge", gx: 61, gy: 35, w: 98, h: 54 },
    { type: "market", gx: 52, gy: 74, w: 92, h: 72 },
    { type: "scroll", gx: 73, gy: 55, w: 66, h: 72 },
    { type: "milestone", gx: 101, gy: 32, w: 56, h: 62 },
    { type: "portal", gx: 111, gy: 70, w: 88, h: 88 },
    { type: "lamp", gx: 83, gy: 20, w: 48, h: 76 },
    { type: "flowers", gx: 96, gy: 27, w: 70, h: 48 },
    { type: "milestone", gx: 48, gy: 69, w: 56, h: 62 },
    { type: "obelisk", gx: 116, gy: 76, w: 54, h: 86 },
    { type: "bridge", gx: 126, gy: 42, w: 98, h: 54 },
    { type: "lamp", gx: 130, gy: 20, w: 48, h: 76 },
    { type: "scroll", gx: 136, gy: 24, w: 66, h: 72 },
    { type: "statue", gx: 96, gy: 91, w: 74, h: 82 },
    { type: "banner2", gx: 101, gy: 96, w: 64, h: 78 },
    { type: "market", gx: 134, gy: 91, w: 92, h: 72 },
    { type: "crate", gx: 141, gy: 93, w: 58, h: 56 },
    { type: "tent", gx: 124, gy: 87, w: 84, h: 70 },
    { type: "portal", gx: 147, gy: 104, w: 88, h: 88 },
    { type: "flowers", gx: 75, gy: 88, w: 70, h: 48 },
    { type: "bulletin", gx: 114, gy: 62, w: 74, h: 58 },
    { type: "banner", gx: 149, gy: 18, w: 64, h: 78 },
    { type: "statue", gx: 154, gy: 20, w: 74, h: 82 },
    { type: "scroll", gx: 152, gy: 54, w: 66, h: 72 },
    { type: "column", gx: 156, gy: 59, w: 58, h: 64 },
    { type: "tent", gx: 52, gy: 108, w: 84, h: 70 },
    { type: "map", gx: 31, gy: 107, w: 70, h: 72 },
    { type: "crate", gx: 121, gy: 113, w: 58, h: 56 },
    { type: "bulletin", gx: 148, gy: 116, w: 74, h: 58 }
  ];

  const decorCells = {
    banner: 0,
    lamp: 1,
    statue: 2,
    monument: 2,
    obelisk: 3,
    market: 4,
    fountain: 5,
    tent: 6,
    bridge: 7,
    milestone: 8,
    sign: 8,
    bulletin: 9,
    flowers: 10,
    scroll: 11,
    map: 11,
    portal: 12,
    column: 13,
    crate: 14,
    banner2: 15
  };

  const landmarkCells = {
    center: 0,
    mart: 1,
    lab: 2,
    museum: 3,
    harbor: 4,
    capitol: 5,
    ruins: 6,
    reform: 7,
    psych: 8,
    bazaar: 9,
    summit: 10,
    frontier: 11,
    observatory: 12,
    rights: 13,
    liberty: 13,
    renaissance: 3,
    andes: 11,
    urban: 12,
    press: 14,
    industry: 9,
    sign: 14,
    badge: 15
  };

  const trainerCells = {
    guide: 0,
    rival: 1,
    curator: 2,
    organizer: 3,
    pilot: 4,
    keeper: 5,
    analyst: 6,
    captain: 7,
    scribe: 8,
    marshal: 9,
    advocate: 10,
    quartermaster: 11,
    gymLeader: 12,
    professor: 13,
    shopkeeper: 14,
    traveler: 15
  };

  const companionCells = {
    "Hammurabi": [0, 0],
    "Confucius": [0, 1],
    "Mansa Musa": [0, 2],
    "Mohandas Gandhi": [0, 3],
    "Nelson Mandela": [0, 4],
    "Abraham Lincoln": [0, 5],
    "Harriet Tubman": [0, 6],
    "Martin Luther King Jr.": [0, 7],
    "George Washington": [0, 8],
    "Adam Smith": [0, 9],
    "John Maynard Keynes": [0, 10],
    "James Madison": [0, 11],
    "Theodore Roosevelt": [0, 12],
    "B. F. Skinner": [0, 13],
    "Jean Piaget": [0, 14],
    "Zheng He": [0, 15],
    "Elinor Ostrom": [1, 0],
    "Janet Yellen": [1, 1],
    "Paul Volcker": [1, 2],
    "Alfred Marshall": [1, 3],
    "Joan Robinson": [1, 4],
    "Milton Friedman": [1, 5],
    "Thurgood Marshall": [1, 6],
    "Barbara Jordan": [1, 7],
    "Ida B. Wells": [1, 8],
    "Eleanor Roosevelt": [1, 9],
    "Frederick Douglass": [1, 10],
    "Franklin D. Roosevelt": [1, 11],
    "Sacagawea": [1, 12],
    "Pachacuti": [1, 13],
    "Moctezuma II": [1, 14],
    "Alexander Hamilton": [1, 15],
    "Tecumseh": [2, 0],
    "Susan B. Anthony": [2, 1],
    "Pericles": [2, 2],
    "Ibn Battuta": [2, 3],
    "Toussaint Louverture": [2, 4],
    "Leonardo da Vinci": [2, 5],
    "Martin Luther": [2, 6],
    "Napoleon Bonaparte": [2, 7],
    "Jane Jacobs": [2, 8],
    "Carl Sauer": [2, 9],
    "Wilhelm Wundt": [2, 10],
    "Archive Keeper": [2, 11],
    "Source Sleuth": [2, 12],
    "Context Coach": [2, 13],
    "Route Messenger": [2, 14],
    "Map Guardian": [2, 15]
  };

  const dirs = {
    up: { x: 0, y: -1, key: "playerBack" },
    down: { x: 0, y: 1, key: "playerFront" },
    left: { x: -1, y: 0, key: "playerSide" },
    right: { x: 1, y: 0, key: "playerSideAlt" }
  };
  const sourcePromptRe = /(\bthis\s+(letter|speech|excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthese\s+(documents|statements|headlines|sources|passages|figures|maps|graphs|charts|cartoons)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author)\b|\bbased\s+on\s+this\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article)\b|similar\s+to\s+this)/i;

  const state = {
    mode: "boot",
    bank: { courses: [], setsByCourse: {}, questions: [] },
    filtered: [],
    queue: [],
    tileMap: [],
    blocked: new Set(),
    grass: new Set(),
    player: { gx: 17, gy: 16, x: 17 * TILE, y: 16 * TILE, dir: "down", moving: false, step: 0, fromX: 0, fromY: 0, toX: 0, toY: 0 },
    camera: { x: 0, y: 0 },
    keys: new Set(),
    last: 0,
    dialogTarget: null,
    battle: null,
    quest: null,
    inputCooldown: 0,
    stats: readSave()
  };

  function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  function resizeCanvas() {
    const viewport = window.visualViewport;
    view.w = Math.max(320, Math.floor((viewport && viewport.width) || window.innerWidth || 960));
    view.h = Math.max(320, Math.floor((viewport && viewport.height) || window.innerHeight || 540));
    document.documentElement.style.setProperty("--game-height", `${view.h}px`);
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const rawDpr = window.devicePixelRatio || 1;
    view.dpr = FX_LITE || coarse || view.w <= 780 ? 1 : Math.min(1.5, rawDpr);
    els.canvas.width = Math.floor(view.w * view.dpr);
    els.canvas.height = Math.floor(view.h * view.dpr);
    els.canvas.style.width = `${view.w}px`;
    els.canvas.style.height = `${view.h}px`;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function defaultStats() {
    return {
      shards: 40,
      xp: 0,
      rank: 1,
      hp: 100,
      maxHp: 100,
      active: 0,
      party: [],
      items: { capsule: 5, fieldNote: 2, tea: 1 },
      course: "All Courses",
      set: "All Sets",
      flags: {}
    };
  }

  function readSave() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const base = defaultStats();
      const stats = Object.assign(base, saved || {});
      stats.items = Object.assign(base.items, saved.items || {});
      stats.flags = Object.assign({}, saved.flags || {});
      stats.party = Array.isArray(saved.party) ? saved.party : [];
      stats.party.forEach(normalizeAlly);
      stats.active = clamp(Number(stats.active || 0), 0, Math.max(0, stats.party.length - 1));
      stats.maxHp = Math.max(100, Number(stats.maxHp || 100));
      stats.hp = clamp(Number(stats.hp || stats.maxHp), 0, stats.maxHp);
      return stats;
    } catch {
      return defaultStats();
    }
  }

  function writeSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
  }

  function compactKey(value) {
    return normalize(value).replace(/\s+/g, "");
  }

  function hash(value) {
    let h = 2166136261;
    const text = String(value || "");
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function courseTypeFor(course) {
    return typeRules.find((rule) => rule.match.test(course || "Review")) || typeRules[typeRules.length - 1];
  }

  function familiesForType(type) {
    return familiesByType[type] || familiesByType.Review;
  }

  function familyForQuestion(q, lane) {
    const rows = familiesForType(lane.name);
    const raw = rows[hash([q.course, q.set, q.category, q.answer, q.id].join("|")) % rows.length] || rows[0];
    return familyById[compactKey(`${lane.name}-${raw[0]}`)] || allFamilies[0];
  }

  function stageFor(ally) {
    return clamp(Math.floor(Number(ally.level || 1) / 4), 0, 2);
  }

  function move(name, type, power, flavor) {
    const maxPp = power >= 34 ? 8 : power >= 29 ? 12 : 18;
    return { name, type, power, flavor, pp: maxPp, maxPp };
  }

  const signatureMoves = {
    "Adam Smith": "Invisible Hand",
    "John Maynard Keynes": "Demand Surge",
    "Elinor Ostrom": "Commons Pact",
    "Janet Yellen": "Fed Signal",
    "Paul Volcker": "Rate Hike",
    "Alfred Marshall": "Supply-Demand Curve",
    "Joan Robinson": "Market Power",
    "Milton Friedman": "Money Supply",
    "James Madison": "Federalist Frame",
    "Thurgood Marshall": "Equal Protection",
    "Barbara Jordan": "Constitution Voice",
    "Ida B. Wells": "Investigative Press",
    "Eleanor Roosevelt": "Human Rights Charter",
    "George Washington": "Continental Command",
    "Frederick Douglass": "Abolition Oratory",
    "Franklin D. Roosevelt": "New Deal",
    "Abraham Lincoln": "Emancipation",
    "Harriet Tubman": "Freedom Line",
    "Martin Luther King Jr.": "Dream Speech",
    "Sacagawea": "River Guide",
    "Pachacuti": "Inca Road",
    "Moctezuma II": "Tribute Network",
    "Hammurabi": "Law Code",
    "Confucius": "Filial Harmony",
    "Mansa Musa": "Gold Caravan",
    "Alexander Hamilton": "Treasury Plan",
    "Tecumseh": "Confederacy Call",
    "Susan B. Anthony": "Suffrage Petition",
    "Theodore Roosevelt": "Trust Bust",
    "Pericles": "Assembly Speech",
    "Ibn Battuta": "Route Network",
    "Mohandas Gandhi": "Salt March",
    "Nelson Mandela": "Reconciliation",
    "Toussaint Louverture": "Liberation Revolt",
    "Zheng He": "Treasure Fleet",
    "Leonardo da Vinci": "Renaissance Sketch",
    "Martin Luther": "Ninety-Five Theses",
    "Napoleon Bonaparte": "Civil Code",
    "Jane Jacobs": "Street Life",
    "Carl Sauer": "Cultural Landscape",
    "Wilhelm Wundt": "Lab Method",
    "B. F. Skinner": "Reinforcement",
    "Jean Piaget": "Schema Shift",
    "Archive Keeper": "Archive Pulse",
    "Source Sleuth": "Source Scan",
    "Context Coach": "Context Check"
  };

  function movesFor(family, lane, q) {
    const blob = normalize([q && q.prompt, q && q.answer, family.line].join(" "));
    const moves = [
      move(signatureFor(family), lane.name, 34, family.line),
      move(lane.move, lane.name, 29, `A ${lane.name} course move.`),
      move("Context Check", lane.name, 23, "Uses background knowledge to sharpen the hit.")
    ];
    if (/source|document|map|chart|graph|cartoon|image|photo|excerpt/.test(blob)) {
      moves.splice(1, 0, move("Source Scan", lane.name, 31, "Reads the evidence before striking."));
    } else if (/war|revolution|rights|reform|trade|belief|migration|court|constitution|market/.test(blob)) {
      moves.splice(1, 0, move("Timeline Combo", lane.name, 28, "Links the turning point to the change after it."));
    } else {
      moves.splice(1, 0, move("Recall Dash", lane.name, 25, "Fast content recall pressure."));
    }
    return moves.slice(0, 4);
  }

  function signatureFor(family) {
    const last = family.historicalName.split(/\s+/).slice(-1)[0];
    if (signatureMoves[family.historicalName]) return signatureMoves[family.historicalName];
    if (/Gandhi/.test(family.historicalName)) return "Salt March";
    if (/Washington/.test(family.historicalName)) return "Continental Command";
    if (/Hammurabi/.test(family.historicalName)) return "Law Code";
    if (/Mandela/.test(family.historicalName)) return "Reconciliation";
    if (/Mansa/.test(family.historicalName)) return "Gold Road";
    if (/Skinner/.test(family.historicalName)) return "Reinforcement";
    if (/Madison/.test(family.historicalName)) return "Federalist Frame";
    return `${last} Strike`;
  }

  function makeAlly(q, starterType) {
    const lane = starterType ? (typeRules.find((rule) => rule.name === starterType) || courseTypeFor(starterType)) : courseTypeFor(q && q.course);
    const family = starterType
      ? familyById[compactKey(`${lane.name}-${familiesForType(lane.name)[0][0]}`)] || allFamilies[0]
      : familyForQuestion(q || {}, lane);
    const level = starterType ? 1 : 1 + Math.floor(Math.random() * 4) + Math.floor((state.stats.rank || 1) / 3);
    return makeFamilyAlly(family, lane, level, q || { prompt: family.line, answer: family.historicalName });
  }

  function makeFamilyAlly(family, lane, level, q) {
    const stage = clamp(Math.floor((level - 1) / 4), 0, 2);
    const id = compactKey(`${lane.name}|${family.historicalName}`).slice(0, 80);
    return {
      id,
      name: family.names[stage] || family.names[0],
      actualName: family.historicalName,
      type: lane.name,
      familyId: family.id,
      atlas: family.atlas,
      row: family.row,
      level,
      xp: 0,
      maxHp: 72 + level * 7,
      hp: 72 + level * 7,
      color: lane.color,
      line: family.line,
      moves: movesFor(family, lane, q || { prompt: family.line, answer: family.historicalName })
    };
  }

  function makeDifferentAlly(hero) {
    const pool = allFamilies.filter((family) => compactKey(`${family.type}|${family.historicalName}`).slice(0, 80) !== hero.id);
    const family = pool[Math.floor(Math.random() * pool.length)] || allFamilies[0];
    const lane = typeRules.find((rule) => rule.name === family.type) || typeRules[typeRules.length - 1];
    const level = 1 + Math.floor(Math.random() * 4) + Math.floor((state.stats.rank || 1) / 3);
    return makeFamilyAlly(family, lane, level, { prompt: family.line, answer: family.historicalName });
  }

  function familyByHistoricalName(name, preferredType) {
    const exact = allFamilies.find((family) => family.historicalName === name && (!preferredType || family.type === preferredType));
    if (exact) return exact;
    const looseKey = compactKey(name);
    return allFamilies.find((family) => compactKey(family.historicalName) === looseKey)
      || allFamilies.find((family) => compactKey(family.historicalName).includes(looseKey) || looseKey.includes(compactKey(family.historicalName)))
      || allFamilies[0];
  }

  function makeRosterAlly(name, preferredType, level, prompt) {
    const family = familyByHistoricalName(name, preferredType);
    const lane = typeRules.find((rule) => rule.name === family.type)
      || typeRules.find((rule) => rule.name === preferredType)
      || typeRules[typeRules.length - 1];
    return makeFamilyAlly(family, lane, level, { prompt: prompt || family.line, answer: family.historicalName });
  }

  function badgeFlag(id) {
    return `badge:${id}`;
  }

  function earnedBadges() {
    return places.filter((place) => place.gym && state.stats.flags[badgeFlag(place.gym.id)]).map((place) => place.gym);
  }

  function openGymBattle(place) {
    if (!place || !place.gym) return;
    const gym = place.gym;
    const alreadyWon = Boolean(state.stats.flags[badgeFlag(gym.id)]);
    const baseLevel = Math.max(3, 2 + earnedBadges().length + Math.floor((state.stats.rank || 1) / 2));
    const roster = (gym.roster || []).map((name, index) => makeRosterAlly(name, gym.type, baseLevel + index + (alreadyWon ? 2 : 0), `${gym.leader} gym battle: ${gym.intro}`));
    if (!roster.length) return;
    openBattle(roster[0], true, {
      trainerName: gym.leader,
      opening: gym.intro,
      gym: {
        id: gym.id,
        leader: gym.leader,
        badge: gym.badge,
        roster,
        index: 0,
        rematch: alreadyWon
      }
    });
  }

  function normalizeAlly(ally) {
    if (!ally) return ally;
    const family = familyById[ally.familyId] || allFamilies.find((item) => item.historicalName === ally.actualName) || allFamilies[0];
    const lane = typeRules.find((rule) => rule.name === ally.type) || typeRules[typeRules.length - 1];
    const defaults = movesFor(family, lane, { prompt: ally.line || family.line, answer: ally.actualName });
    ally.moves = defaults.map((base, index) => {
      const saved = Array.isArray(ally.moves) ? ally.moves[index] : null;
      const maxPp = Number(saved && saved.maxPp) || base.maxPp;
      const pp = saved && Number.isFinite(Number(saved.pp)) ? Number(saved.pp) : maxPp;
      return Object.assign({}, base, saved || {}, { maxPp, pp: clamp(pp, 0, maxPp) });
    });
    ally.maxHp = Math.max(60, Number(ally.maxHp || 72 + Number(ally.level || 1) * 7));
    ally.hp = clamp(Number(ally.hp == null ? ally.maxHp : ally.hp), 0, ally.maxHp);
    return ally;
  }

  function ensureStarter() {
    if (state.stats.party.length) return;
    state.stats.party = [makeAlly(null, "Global 9")];
    state.stats.active = 0;
    state.stats.flags.starter = true;
    writeSave();
  }

  function activeAlly() {
    ensureStarter();
    state.stats.active = clamp(state.stats.active || 0, 0, state.stats.party.length - 1);
    return normalizeAlly(state.stats.party[state.stats.active]);
  }

  function buildWorld() {
    state.tileMap = [];
    state.blocked = new Set();
    state.grass = new Set();
    for (let y = 0; y < WORLD_H; y += 1) state.tileMap.push(Array(WORLD_W).fill("grass"));

    const setTile = (x, y, tile) => {
      if (x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H) state.tileMap[y][x] = tile;
    };
    const paintRect = (x1, y1, x2, y2, tile) => {
      for (let y = y1; y <= y2; y += 1) for (let x = x1; x <= x2; x += 1) setTile(x, y, tile);
    };
    const paintEllipse = (cx, cy, rx, ry, tile) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
          if (((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2) <= 1) setTile(x, y, tile);
        }
      }
    };
    const carveRoad = (x1, y1, x2, y2, width = 1) => {
      const dx = Math.sign(x2 - x1);
      const dy = Math.sign(y2 - y1);
      let x = x1;
      let y = y1;
      while (x !== x2) {
        for (let oy = -width; oy <= width; oy += 1) setTile(x, y + oy, "path");
        x += dx;
      }
      while (y !== y2) {
        for (let ox = -width; ox <= width; ox += 1) setTile(x + ox, y, "path");
        y += dy;
      }
      for (let oy = -width; oy <= width; oy += 1) for (let ox = -width; ox <= width; ox += 1) setTile(x + ox, y + oy, "path");
    };

    paintRect(0, 0, WORLD_W - 1, 2, "tree");
    paintRect(0, WORLD_H - 3, WORLD_W - 1, WORLD_H - 1, "tree");
    paintRect(0, 0, 2, WORLD_H - 1, "tree");
    paintRect(WORLD_W - 3, 0, WORLD_W - 1, WORLD_H - 1, "tree");

    paintEllipse(9, 51, 8, 10, "water");
    paintEllipse(111, 14, 13, 8, "water");
    paintEllipse(101, 82, 17, 7, "water");
    paintEllipse(139, 39, 13, 9, "water");
    paintEllipse(128, 106, 16, 8, "water");
    paintRect(3, 62, 18, 69, "water");
    paintRect(55, 6, 70, 12, "water");
    paintRect(124, 38, 143, 44, "water");
    paintRect(135, 103, 151, 110, "water");

    paintEllipse(39, 10, 13, 7, "tree");
    paintEllipse(93, 49, 16, 10, "tree");
    paintEllipse(31, 83, 18, 9, "tree");
    paintEllipse(116, 51, 7, 22, "tree");
    paintEllipse(133, 21, 18, 8, "tree");
    paintEllipse(139, 91, 15, 11, "tree");
    paintEllipse(76, 94, 14, 10, "tree");

    paintRect(66, 6, 82, 14, "mountain");
    paintRect(100, 52, 121, 63, "mountain");
    paintRect(6, 74, 17, 86, "mountain");
    paintRect(132, 72, 151, 82, "mountain");
    paintRect(72, 100, 90, 113, "mountain");

    paintRect(10, 38, 24, 51, "grass2");
    paintRect(34, 18, 51, 30, "grass2");
    paintRect(55, 44, 79, 62, "grass2");
    paintRect(91, 24, 111, 38, "grass2");
    paintRect(39, 67, 60, 82, "grass2");
    paintRect(103, 67, 119, 78, "grass2");
    paintRect(121, 17, 143, 30, "grass2");
    paintRect(88, 88, 110, 103, "grass2");
    paintRect(127, 86, 148, 101, "grass2");
    paintRect(69, 78, 82, 92, "grass2");
    paintRect(142, 12, 156, 25, "grass2");
    paintRect(145, 50, 157, 66, "grass2");
    paintRect(20, 98, 37, 113, "grass2");
    paintRect(47, 99, 61, 113, "grass2");
    paintRect(112, 104, 126, 116, "grass2");
    paintRect(143, 108, 156, 116, "grass2");

    carveRoad(12, 18, 32, 18, 1);
    carveRoad(24, 9, 24, 33, 1);
    carveRoad(24, 33, 61, 33, 1);
    carveRoad(61, 33, 61, 57, 1);
    carveRoad(61, 57, 111, 57, 1);
    carveRoad(111, 57, 111, 72, 1);
    carveRoad(24, 33, 16, 49, 1);
    carveRoad(32, 18, 86, 18, 1);
    carveRoad(86, 18, 104, 31, 1);
    carveRoad(43, 26, 49, 74, 1);
    carveRoad(49, 74, 111, 72, 1);
    carveRoad(104, 31, 133, 23, 1);
    carveRoad(111, 72, 137, 92, 1);
    carveRoad(74, 57, 96, 96, 1);
    carveRoad(96, 96, 137, 92, 1);
    carveRoad(137, 92, 147, 104, 1);
    carveRoad(133, 23, 151, 18, 1);
    carveRoad(151, 18, 154, 56, 1);
    carveRoad(154, 56, 151, 115, 1);
    carveRoad(137, 92, 151, 115, 1);
    carveRoad(96, 96, 54, 105, 1);
    carveRoad(54, 105, 29, 104, 1);
    carveRoad(119, 112, 96, 96, 1);

    places.forEach((place) => paintRect(place.gx - 3, place.gy - 2, place.gx + 3, place.gy + 3, "path"));

    for (let y = 0; y < WORLD_H; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        const tile = tileAt(x, y);
        if (tile === "tree" || tile === "water" || tile === "mountain") state.blocked.add(key(x, y));
        if (tile === "grass2") state.grass.add(key(x, y));
      }
    }
    places.forEach((place) => {
      for (let yy = place.gy - 1; yy <= place.gy + 1; yy += 1) {
        for (let xx = place.gx - 1; xx <= place.gx + 1; xx += 1) {
          state.blocked.add(key(xx, yy));
        }
      }
      state.blocked.delete(key(place.gx, place.gy + 2));
    });
    npcs.forEach((npc) => state.blocked.add(key(npc.gx, npc.gy)));
    state.blocked.delete(key(state.player.gx, state.player.gy));
  }

  function key(x, y) {
    return `${x},${y}`;
  }

  function drawAtlas(name, x, y, w, h, flip) {
    const item = atlas[name];
    if (!item || !tileAtlas.complete) return;
    ctx.save();
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(tileAtlas, item[0], item[1], item[2], item[3], 0, 0, w, h);
    } else {
      ctx.drawImage(tileAtlas, item[0], item[1], item[2], item[3], x, y, w, h);
    }
    ctx.restore();
  }

  function drawSheetCell(img, index, cols, rows, x, y, w, h, flip) {
    if (!img.complete || index == null) return false;
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    if (!naturalW || !naturalH) return false;
    const cellW = naturalW / cols;
    const cellH = naturalH / rows;
    const sx = (index % cols) * cellW;
    const sy = Math.floor(index / cols) * cellH;
    ctx.save();
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, cellW, cellH, 0, 0, w, h);
    } else {
      ctx.drawImage(img, sx, sy, cellW, cellH, x, y, w, h);
    }
    ctx.restore();
    return true;
  }

  function drawFigure(ally, x, y, w, h, flip) {
    const family = familyById[ally.familyId] || allFamilies[0];
    const companionRef = companionCells[family.historicalName] || companionCells[ally.actualName] || fallbackCompanionRef(family.historicalName || ally.actualName);
    const companionSheet = companionSheets[companionRef[0]];
    if (companionSheet && companionSheet.complete) {
      ctx.save();
      ctx.shadowColor = ally.color || "#edf987";
      ctx.shadowBlur = Math.max(6, Math.floor(w * .09));
      drawSheetCell(companionSheet, companionRef[1], 4, 4, x, y - h * .22, w, h * 1.22, flip);
      ctx.restore();
      return;
    }
    const img = figureAtlases[family.atlas] || figureAtlases[0];
    if (!img.complete) return;
    const cellW = 1024 / 3;
    const cellH = 1536 / 6;
    const col = stageFor(ally);
    const sx = col * cellW;
    const sy = family.row * cellH;
    ctx.save();
    ctx.shadowColor = ally.color || "#edf987";
    ctx.shadowBlur = Math.max(6, Math.floor(w * .08));
    ctx.filter = `sepia(.65) brightness(1.35) saturate(2.35) contrast(1.08) hue-rotate(${(hash(ally.type || ally.actualName) % 80) - 30}deg)`;
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, cellW, cellH, 0, 0, w, h);
    } else {
      ctx.drawImage(img, sx, sy, cellW, cellH, x, y, w, h);
    }
    ctx.restore();
  }

  function fallbackCompanionRef(name) {
    const sheet = Math.abs(hash(name || "review")) % companionSheets.length;
    const index = Math.floor(Math.abs(hash(`${name}:sprite`)) % 16);
    return [sheet, index];
  }

  function drawDecor(item) {
    if (!decorSheet.complete) return;
    const index = decorCells[item.type];
    if (index == null) return;
    const cell = 256;
    const sx = (index % 4) * cell;
    const sy = Math.floor(index / 4) * cell;
    let x = item.gx * TILE - state.camera.x - item.w / 2 + TILE / 2;
    let y = item.gy * TILE - state.camera.y - item.h + TILE;
    const t = FX_LITE || PREFERS_REDUCED ? 0 : performance.now() / 1000 + (hash(`${item.type}:${item.gx}:${item.gy}`) % 100) / 19;
    const pulse = .5 + Math.sin(t * 2.2) * .5;

    ctx.save();
    if (item.type === "banner" || item.type === "flowers") {
      ctx.translate(x + item.w / 2, y + item.h);
      ctx.rotate(Math.sin(t * 2.4) * .035);
      x = -item.w / 2;
      y = -item.h;
    }
    if (item.type === "portal" || item.type === "fountain") {
      y += Math.sin(t * 2) * 2;
    }
    if (item.type === "lamp" || item.type === "portal" || item.type === "fountain") {
      ctx.globalAlpha = item.type === "lamp" ? .24 + pulse * .18 : .13 + pulse * .14;
      ctx.fillStyle = item.type === "lamp" ? "#edf987" : "#75f4ff";
      ctx.beginPath();
      ctx.ellipse(x + item.w / 2, y + item.h * .55, item.w * .7, item.h * .45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(decorSheet, sx, sy, cell, cell, x, y, item.w, item.h);
    if (item.type === "fountain" || item.type === "portal") {
      ctx.fillStyle = item.type === "portal" ? "#edf987" : "#75f4ff";
      for (let i = 0; i < 4; i += 1) {
        const sparkle = (t * 1.7 + i * .31) % 1;
        ctx.globalAlpha = .7 * (1 - sparkle);
        ctx.fillRect(x + item.w * (.28 + i * .13), y + item.h * (.34 - sparkle * .22), 3, 3);
      }
    }
    ctx.restore();
  }

  function tileAt(x, y) {
    if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return "tree";
    return state.tileMap[y][x];
  }

  function isBlocked(x, y) {
    return x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H || state.blocked.has(key(x, y));
  }

  function nearestInteraction() {
    const dir = dirs[state.player.dir] || dirs.down;
    const tx = state.player.gx + dir.x;
    const ty = state.player.gy + dir.y;
    return npcs.find((npc) => npc.gx === tx && npc.gy === ty) || places.find((place) => Math.abs(place.gx - tx) <= 1 && Math.abs(place.gy - ty) <= 1);
  }

  function openDialogue(target) {
    state.mode = "dialogue";
    state.dialogTarget = target;
    els.game.classList.add("in-dialogue");
    els.dialogueKicker.textContent = target.type || "Location";
    els.dialogueTitle.textContent = target.name;
    els.dialogueText.textContent = target.text || "The route is quiet.";
    const actions = [];
    if (target.starter && !state.stats.flags.guideGift) actions.push(["starter", "Take Starter"]);
    if (target.kind === "center") actions.push(["heal", "Heal"]);
    if (target.kind === "shop") actions.push(["shop", "Shop"]);
    if (target.quest || target.kind === "quest" || target.kind === "summit") actions.push(["quest", "Contract"]);
    if (target.gym) actions.push(["gym", state.stats.flags[badgeFlag(target.gym.id)] ? "Rematch" : "Gym Battle"]);
    if (target.battle) actions.push(["battle", "Battle"]);
    actions.push(["close", "Close"]);
    els.dialogueActions.innerHTML = actions.map(([id, label]) => `<button type="button" data-action="${id}">${escapeHtml(label)}</button>`).join("");
    [...els.dialogueActions.querySelectorAll("button")].forEach((button) => button.addEventListener("click", () => handleDialogueAction(button.dataset.action)));
    els.dialogue.hidden = false;
  }

  function closeDialogue() {
    state.mode = "overworld";
    state.dialogTarget = null;
    els.dialogue.hidden = true;
    els.game.classList.remove("in-dialogue");
  }

  function handleDialogueAction(action) {
    const target = state.dialogTarget;
    if (action === "close") return closeDialogue();
    if (action === "starter") {
      ensureStarter();
      state.stats.items.capsule += 3;
      state.stats.items.fieldNote += 2;
      state.stats.flags.guideGift = true;
      writeSave();
      updateHud();
      els.dialogueText.textContent = `${activeAlly().actualName} joined your party. You also received 3 Archive Capsules and 2 Field Notes.`;
      return;
    }
    if (action === "heal") {
      healParty();
      els.dialogueText.textContent = "Your party is fully restored. Field log saved.";
      return;
    }
    if (action === "shop") {
      state.stats.items.capsule += 2;
      state.stats.items.tea += 1;
      state.stats.shards = Math.max(0, state.stats.shards - 20);
      writeSave();
      updateHud();
      els.dialogueText.textContent = "Bought 2 Archive Capsules and 1 Restoration Tea for 20 shards.";
      return;
    }
    if (action === "quest") {
      closeDialogue();
      openQuest(target && target.name);
      return;
    }
    if (action === "gym") {
      closeDialogue();
      openGymBattle(target);
      return;
    }
    if (action === "battle") {
      closeDialogue();
      openBattle(makeAlly(nextQuestion()), true, { trainerName: target && target.name });
    }
  }

  function openMenu(tab) {
    if (state.mode === "battle" || state.mode === "quest") return;
    if (state.mode === "dialogue") closeDialogue();
    state.mode = "menu";
    els.game.classList.add("in-menu");
    els.menu.hidden = false;
    renderMenu(tab || "party");
  }

  function closeMenu() {
    state.mode = "overworld";
    els.menu.hidden = true;
    els.game.classList.remove("in-menu");
  }

  function renderMenu(tab) {
    const party = state.stats.party;
    if (tab === "bag") {
      els.menuList.innerHTML = `
        <div class="menu-card"><strong>Archive Capsules</strong>x${state.stats.items.capsule || 0} - recruit weakened allies in battle.</div>
        <div class="menu-card"><strong>Field Notes</strong>x${state.stats.items.fieldNote || 0} - improve contract rewards.</div>
        <div class="menu-card"><strong>Restoration Tea</strong>x${state.stats.items.tea || 0} - restore party HP in battle.</div>`;
      return;
    }
    const controls = `
      <div class="menu-card">
        <strong>Pause Controls</strong>
        Keyboard: M or P pauses. Arrow keys / WASD move. Enter, Space, or E talks. Escape or B cancels.<br>
        Touch: PAUSE opens this field menu. A talks. B closes.
      </div>`;
    const badges = earnedBadges();
    const badgeCard = `
      <div class="menu-card">
        <strong>Gym Badges ${badges.length}/10</strong>
        ${badges.length ? badges.map((gym) => escapeHtml(gym.badge)).join(" · ") : "No badges yet. Challenge gyms at major landmarks."}
      </div>`;
    els.menuList.innerHTML = controls + badgeCard + (party.length ? party.map((ally, index) => `
      <div class="menu-card">
        <strong>${escapeHtml(index === state.stats.active ? "▶ " : "")}${escapeHtml(ally.actualName)}</strong>
        ${escapeHtml(ally.name)} / ${escapeHtml(ally.type)} / Lv ${ally.level} / HP ${Math.round(ally.hp)}/${ally.maxHp}<br>
        ${(ally.moves || []).map((item) => `${escapeHtml(item.name)} ${item.pp}/${item.maxPp}`).join(" · ")}
      </div>`).join("") : `<div class="menu-card"><strong>No party yet</strong>Talk to Guide Maya near the lab for a starter.</div>`);
  }

  function fillFilters() {
    const courses = ["All Courses"].concat(state.bank.courses || []);
    els.courseSelect.innerHTML = courses.map((course) => `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`).join("");
    els.courseSelect.value = courses.includes(state.stats.course) ? state.stats.course : "All Courses";
    fillSets();
  }

  function fillSets() {
    const course = els.courseSelect.value;
    const sets = course === "All Courses" ? [] : (state.bank.setsByCourse[course] || []);
    els.setSelect.innerHTML = ["All Sets"].concat(sets).map((set) => `<option value="${escapeHtml(set)}">${escapeHtml(set)}</option>`).join("");
    els.setSelect.value = sets.includes(state.stats.set) ? state.stats.set : "All Sets";
  }

  function applyFilters() {
    state.stats.course = els.courseSelect.value || "All Courses";
    state.stats.set = els.setSelect.value || "All Sets";
    state.filtered = state.bank.questions.filter((q) => {
      if (!isUsableQuestion(q)) return false;
      if (state.stats.course !== "All Courses" && q.course !== state.stats.course) return false;
      if (state.stats.set !== "All Sets" && q.set !== state.stats.set) return false;
      return true;
    });
    if (!state.filtered.length) state.filtered = state.bank.questions.filter(isUsableQuestion);
    state.queue = shuffle(state.filtered);
    writeSave();
    updateHud();
  }

  function nextQuestion() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    const fallback = state.bank.questions.filter(isUsableQuestion);
    return state.queue.pop() || fallback[Math.floor(Math.random() * fallback.length)] || null;
  }

  function promptNeedsStimulus(q) {
    return sourcePromptRe.test(String((q && (q.prompt || q.stem)) || ""));
  }

  function stimulusTextFor(q) {
    if (!q) return "";
    const text = [
      q.stimulusText,
      q.sourceText,
      q.passage,
      q.excerpt,
      typeof q.stimulus === "string" ? q.stimulus : ""
    ].find((item) => String(item || "").trim());
    return String(text || "").trim();
  }

  function stimulusImagesFor(q) {
    if (!q) return [];
    const list = Array.isArray(q.stimulusImages) ? q.stimulusImages : [];
    const images = list.length ? list : (q.stimulusImage ? [{ src: q.stimulusImage, label: "Source stimulus" }] : []);
    return images.filter((image) => image && image.src);
  }

  function hasReliableStimulus(q) {
    return Boolean(stimulusTextFor(q) || (q && q.stimulusHtml) || stimulusImagesFor(q).length);
  }

  function sourceTextFor(q) {
    return stimulusTextFor(q);
  }

  function isUsableQuestion(q) {
    if (!q || !q.prompt || !q.answer) return false;
    if (q.stimulusRequired === true) return hasReliableStimulus(q);
    if (promptNeedsStimulus(q) && !hasReliableStimulus(q)) return false;
    return true;
  }

  function answerLabel(q) {
    if (!q) return "";
    if (q.type === "mcq" && q.choices) {
      const match = q.choices.find((choice) => String(choice.label) === String(q.correct));
      return match ? match.text : q.answer;
    }
    return q.answer;
  }

  function typedMatches(raw, answers) {
    const guess = normalize(raw);
    return answers.some((answer) => {
      const target = normalize(answer);
      if (!guess || !target) return false;
      if (guess === target || target.includes(guess) && guess.length >= 4 || guess.includes(target) && target.length >= 4) return true;
      return levenshtein(guess, target) <= Math.max(1, Math.floor(target.length * 0.16));
    });
  }

  function levenshtein(a, b) {
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    const curr = Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i += 1) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
    }
    return prev[b.length];
  }

  function openQuest(origin) {
    const q = nextQuestion();
    if (!q) return;
    state.mode = "quest";
    state.quest = { q, origin: origin || "Route Contract" };
    els.game.classList.add("in-quest");
    els.quest.classList.toggle("is-mcq", q.type === "mcq" && q.choices && q.choices.length);
    els.questKicker.textContent = origin || "Review Contract";
    els.questMeta.textContent = `${q.course || "Social Studies"} / ${q.set || "Review"}`;
    els.questPrompt.textContent = q.prompt;
    renderQuestStimulus(q);
    els.questFeedback.textContent = "";
    els.questInput.value = "";
    if (q.type === "mcq" && q.choices && q.choices.length) {
      els.questForm.hidden = true;
      els.questChoices.hidden = false;
      els.questChoices.innerHTML = q.choices.map((choice) => `<button type="button" data-choice="${escapeHtml(choice.label)}"><strong>${escapeHtml(choice.label)}.</strong> ${escapeHtml(choice.text)}</button>`).join("");
      [...els.questChoices.querySelectorAll("button")].forEach((button) => button.addEventListener("click", () => submitQuest(button.dataset.choice)));
    } else {
      els.questChoices.hidden = true;
      els.questChoices.innerHTML = "";
      els.questForm.hidden = false;
      setTimeout(() => els.questInput.focus({ preventScroll: true }), 50);
    }
    els.quest.hidden = false;
  }

  function renderQuestStimulus(q) {
    const sourceText = sourceTextFor(q);
    const images = stimulusImagesFor(q);
    if (!sourceText && !images.length) {
      els.questSource.hidden = true;
      els.questSource.innerHTML = "";
      els.quest.classList.remove("has-source");
      return;
    }
    const textBlock = sourceText ? `<p>${escapeHtml(sourceText)}</p>` : "";
    const imageBlock = images.map((image, index) => {
      const label = image.label || `Source stimulus ${index + 1}`;
      return `<figure>
        <img src="${escapeHtml(image.src)}" alt="${escapeHtml(label)}" loading="eager">
        <figcaption>${escapeHtml(label)}</figcaption>
      </figure>`;
    }).join("");
    els.questSource.hidden = false;
    els.questSource.innerHTML = textBlock + imageBlock;
    els.quest.classList.add("has-source");
  }

  function trackHunterCompletion(mode, score, accuracy, weakTopics = []) {
    if (!window.MrMacsAnalytics || typeof window.MrMacsAnalytics.track !== "function") return;
    window.MrMacsAnalytics.track("game_complete", {
      gameId: "history-hunters",
      title: "History Hunters 2: Atlas Quest",
      course: state.stats.course || "All Courses",
      gameType: "Open-World RPG",
      mode,
      score,
      accuracy,
      questions: mode === "Review Contract" ? 1 : 0,
      weakTopics
    }, { counter: "game-completions" });
  }

  function submitQuest(raw) {
    const q = state.quest && state.quest.q;
    if (!q) return;
    const correct = q.type === "mcq" ? String(raw) === String(q.correct) : typedMatches(raw, [q.answer].concat(q.aliases || []));
    const reward = correct ? 38 : 10;
    state.stats.shards += reward;
    state.stats.xp += correct ? 30 : 8;
    state.stats.items.fieldNote += correct ? 1 : 0;
    if (correct) {
      els.questFeedback.textContent = `Correct. +${reward} shards, +XP, +1 Field Note. ${q.explanation || ""}`;
    } else {
      els.questFeedback.textContent = `Not quite. Answer: ${answerLabel(q)}. +${reward} study shards. ${q.explanation || ""}`;
    }
    writeSave();
    updateHud();
    trackHunterCompletion("Review Contract", correct ? 100 : 35, correct ? 100 : 0, correct ? [] : [q.course || state.stats.course || "All Courses", q.set || q.category || q.answer || "Review Contract"]);
    setTimeout(closeQuest, correct ? 1500 : 2600);
  }

  function closeQuest() {
    state.mode = "overworld";
    state.quest = null;
    els.quest.hidden = true;
    els.quest.classList.remove("is-mcq");
    els.quest.classList.remove("has-source");
    els.game.classList.remove("in-quest");
  }

  function openBattle(enemy, trainer, options = {}) {
    const hero = normalizeAlly(activeAlly());
    let foe = normalizeAlly(enemy || makeAlly(nextQuestion()));
    for (let i = 0; foe && foe.id === hero.id && i < 6; i += 1) {
      foe = normalizeAlly(makeAlly(nextQuestion()));
    }
    if (!foe || foe.id === hero.id) foe = normalizeAlly(makeDifferentAlly(hero));
    if (window.MrMacsAnalytics && typeof window.MrMacsAnalytics.track === "function") {
      window.MrMacsAnalytics.track("game_play", {
        gameId: "history-hunters",
        title: "History Hunters 2: Atlas Quest",
        course: state.stats.course || "All Courses",
        gameType: "Open-World RPG"
      }, { counter: "game-plays", onceKey: "game-play:history-hunters:" + location.pathname });
    }
    state.mode = "battle";
    els.game.classList.add("in-battle");
    const battle = {
      enemy: foe,
      hero,
      heroHp: hero.hp,
      enemyHp: foe ? foe.hp : 90,
      enemyMax: foe ? foe.maxHp : 90,
      trainerName: options.trainerName || (trainer ? "Route Trainer" : ""),
      opening: options.opening || "",
      gym: options.gym || null,
      menu: "root",
      log: options.opening || (trainer ? `${(options.trainerName || "Route Trainer").toUpperCase()} challenged your route team!` : `Wild ${foe.actualName.toUpperCase()} appeared!`),
      locked: true,
      fx: null,
      fxTime: 0,
      capture: 0
    };
    state.battle = battle;
    els.battleUi.hidden = false;
    renderBattleActions();
    setBattleLog(battle.log);
    setTimeout(() => {
      if (state.battle === battle) {
        const foeLine = battle.trainerName ? `${battle.trainerName.toUpperCase()} threw out ${battle.enemy.actualName.toUpperCase()}! ` : "";
        setBattleLog(`${foeLine}${PLAYER_TITLE} threw out ${battle.hero.actualName.toUpperCase()}!`);
      }
    }, 650);
    setTimeout(() => {
      if (state.battle === battle) {
        battle.locked = false;
        setBattleLog(`What will ${battle.hero.actualName.toUpperCase()} do?`);
        renderBattleActions();
      }
    }, 1420);
  }

  function setBattleLog(text) {
    if (!state.battle) return;
    state.battle.log = text;
    els.battleLog.textContent = text;
  }

  function renderBattleActions() {
    const battle = state.battle;
    if (!battle) return;
    if (battle.locked) {
      els.battleActions.innerHTML = "";
      return;
    }
    if (battle.menu === "fight") {
      els.battleActions.innerHTML = battle.hero.moves.map((item, index) => `<button type="button" data-move="${index}" ${item.pp <= 0 ? "disabled" : ""}><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.type)} / ${item.power} / ${item.pp}/${item.maxPp} PP</small></button>`).join("");
      [...els.battleActions.querySelectorAll("button")].forEach((button) => button.addEventListener("click", () => useMove(Number(button.dataset.move))));
      return;
    }
    if (battle.menu === "bag") {
      els.battleActions.innerHTML = [
        ["capsule", "Capsule", `x${state.stats.items.capsule || 0}`],
        ["tea", "Tea", `x${state.stats.items.tea || 0}`],
        ["fieldNote", "Notes", `x${state.stats.items.fieldNote || 0}`],
        ["back", "Back", "menu"]
      ].map(([id, label, detail]) => `<button type="button" data-item="${id}"><strong>${label}</strong><small>${detail}</small></button>`).join("");
      [...els.battleActions.querySelectorAll("button")].forEach((button) => button.addEventListener("click", () => useItem(button.dataset.item)));
      return;
    }
    els.battleActions.innerHTML = [
      ["fight", "Fight", "moves"],
      ["bag", "Bag", "items"],
      ["party", "Party", "switch"],
      ["run", "Run", "escape"]
    ].map(([id, label, detail]) => `<button type="button" data-action="${id}"><strong>${label}</strong><small>${detail}</small></button>`).join("");
    [...els.battleActions.querySelectorAll("button")].forEach((button) => button.addEventListener("click", () => battleAction(button.dataset.action)));
  }

  function battleAction(action) {
    const battle = state.battle;
    if (!battle || battle.locked) return;
    if (action === "fight") {
      battle.menu = "fight";
      setBattleLog("Choose a move.");
      renderBattleActions();
    } else if (action === "bag") {
      battle.menu = "bag";
      setBattleLog("Open the field bag.");
      renderBattleActions();
    } else if (action === "party") {
      let next = (state.stats.active + 1) % state.stats.party.length;
      for (let i = 0; i < state.stats.party.length; i += 1) {
        const candidate = (state.stats.active + 1 + i) % state.stats.party.length;
        if (normalizeAlly(state.stats.party[candidate]).hp > 0) {
          next = candidate;
          break;
        }
      }
      state.stats.active = next;
      battle.hero = normalizeAlly(activeAlly());
      battle.heroHp = battle.hero.hp;
      setBattleLog(`${PLAYER_TITLE} threw out ${battle.hero.actualName.toUpperCase()}!`);
      battle.menu = "root";
      writeSave();
      renderBattleActions();
    } else if (action === "run") {
      closeBattle("Got away safely.");
    }
  }

  function typeMultiplier(moveType, targetType) {
    const moveTypeData = typeRules.find((rule) => rule.name === moveType) || typeRules[typeRules.length - 1];
    const targetTypeData = typeRules.find((rule) => rule.name === targetType) || typeRules[typeRules.length - 1];
    const chart = clusterEffects[moveTypeData.cluster] || clusterEffects.review;
    if (moveType === targetType) return 1.22;
    if (chart.strong.includes(targetTypeData.cluster)) return 1.55;
    if (chart.weak.includes(targetTypeData.cluster)) return .72;
    return 1;
  }

  function effectSentence(multiplier) {
    if (multiplier > 1.2) return "It's super effective!";
    if (multiplier < .8) return "It's not very effective.";
    return "It connected.";
  }

  async function useMove(index) {
    const battle = state.battle;
    if (!battle || battle.locked) return;
    const selected = battle.hero.moves[index] || battle.hero.moves[0];
    if (!selected || selected.pp <= 0) {
      setBattleLog("That move is out of PP. Pick another move or visit the Chronicle Center.");
      return;
    }
    selected.pp -= 1;
    battle.locked = true;
    battle.menu = "root";
    renderBattleActions();
    setBattleLog(`${battle.hero.actualName.toUpperCase()} used ${selected.name.toUpperCase()}!`);
    battle.fx = { kind: "hero", t: 0, color: battle.hero.color };
    await wait(720);
    if (state.battle !== battle) return;
    const mult = typeMultiplier(selected.type, battle.enemy.type);
    const damage = Math.max(6, Math.round((selected.power + battle.hero.level * 2) * mult * (.86 + Math.random() * .24)));
    battle.enemyHp = clamp(battle.enemyHp - damage, 0, battle.enemyMax);
    battle.capture = clamp(battle.capture + 12 + damage * .34, 0, 100);
    battle.fx = { kind: "enemyHit", t: 0, color: selected.color || battle.hero.color };
    setBattleLog(`${effectSentence(mult)} ${battle.enemy.actualName.toUpperCase()} lost ${damage} HP.`);
    writeSave();
    await wait(880);
    if (state.battle !== battle) return;
    if (battle.enemyHp <= 0) {
      await winBattle(false);
      return;
    }
    await enemyTurn();
  }

  async function enemyTurn() {
    const battle = state.battle;
    if (!battle) return;
    const available = battle.enemy.moves.filter((item) => item.pp > 0);
    const moveUsed = available[Math.floor(Math.random() * available.length)] || battle.enemy.moves[0];
    if (moveUsed && moveUsed.pp > 0) moveUsed.pp -= 1;
    setBattleLog(`${battle.enemy.actualName.toUpperCase()} used ${moveUsed.name.toUpperCase()}!`);
    battle.fx = { kind: "enemy", t: 0, color: battle.enemy.color };
    await wait(720);
    if (state.battle !== battle) return;
    const mult = typeMultiplier(moveUsed.type, battle.hero.type);
    const damage = Math.max(5, Math.round((moveUsed.power + battle.enemy.level) * mult * (.72 + Math.random() * .2)));
    battle.heroHp = clamp(battle.heroHp - damage, 0, battle.hero.maxHp);
    battle.hero.hp = battle.heroHp;
    battle.fx = { kind: "heroHit", t: 0, color: battle.enemy.color };
    setBattleLog(`${effectSentence(mult)} ${battle.hero.actualName.toUpperCase()} lost ${damage} HP.`);
    writeSave();
    updateHud();
    await wait(880);
    if (state.battle !== battle) return;
    if (battle.heroHp <= 0) {
      const nextIndex = state.stats.party.findIndex((ally, index) => index !== state.stats.active && normalizeAlly(ally).hp > 0);
      if (nextIndex >= 0) {
        state.stats.active = nextIndex;
        battle.hero = normalizeAlly(activeAlly());
        battle.heroHp = battle.hero.hp;
        battle.fx = { kind: "hero", t: 0, color: battle.hero.color };
        setBattleLog(`${battle.hero.actualName.toUpperCase()} stepped in for the party!`);
        writeSave();
        updateHud();
        await wait(900);
        if (state.battle !== battle) return;
        battle.locked = false;
        battle.fx = null;
        setBattleLog(`What will ${battle.hero.actualName.toUpperCase()} do?`);
        renderBattleActions();
        return;
      }
      closeBattle("Your party needs the Chronicle Center.");
      return;
    }
    battle.locked = false;
    battle.fx = null;
    setBattleLog(`What will ${battle.hero.actualName.toUpperCase()} do?`);
    renderBattleActions();
  }

  async function useItem(id) {
    const battle = state.battle;
    if (!battle || battle.locked) return;
    if (id === "back") {
      battle.menu = "root";
      setBattleLog(`What will ${battle.hero.actualName.toUpperCase()} do?`);
      renderBattleActions();
      return;
    }
    if (!state.stats.items[id]) {
      setBattleLog("That pocket is empty.");
      return;
    }
    battle.locked = true;
    battle.menu = "root";
    renderBattleActions();
    if (id === "tea") {
      state.stats.items.tea -= 1;
      battle.heroHp = clamp(battle.heroHp + 45, 0, battle.hero.maxHp);
      battle.hero.hp = battle.heroHp;
      setBattleLog("Restoration Tea restored HP.");
      writeSave();
      updateHud();
      await wait(800);
      await enemyTurn();
      return;
    }
    if (id === "fieldNote") {
      state.stats.items.fieldNote -= 1;
      battle.capture = clamp(battle.capture + 18, 0, 100);
      setBattleLog(`Field Notes raised trust to ${Math.round(battle.capture)}%.`);
      writeSave();
      updateHud();
      await wait(800);
      battle.locked = false;
      renderBattleActions();
      return;
    }
    if (id === "capsule") {
      if (battle.gym) {
        setBattleLog("Gym opponents respect the match, not capsules. Win the badge battle.");
        battle.locked = false;
        renderBattleActions();
        return;
      }
      state.stats.items.capsule -= 1;
      const missing = 1 - battle.enemyHp / battle.enemyMax;
      const chance = clamp(18 + missing * 52 + battle.capture * .42, 12, 90);
      battle.fx = { kind: "capsule", t: 0, color: "#f3cf61" };
      setBattleLog("ATLAS RANGER threw an ARCHIVE CAPSULE!");
      writeSave();
      updateHud();
      await wait(1150);
      if (Math.random() * 100 < chance) {
        await winBattle(true);
      } else {
        setBattleLog(`${battle.enemy.actualName.toUpperCase()} broke free!`);
        await wait(800);
        await enemyTurn();
      }
    }
  }

  async function winBattle(captured) {
    const battle = state.battle;
    if (!battle) return;
    battle.fx = { kind: "victory", t: 0, color: battle.hero.color };
    const xp = 34 + battle.enemy.level * 8;
    battle.hero.xp = (battle.hero.xp || 0) + xp;
    if (battle.hero.xp >= battle.hero.level * 45) {
      battle.hero.xp = 0;
      battle.hero.level += 1;
      battle.hero.maxHp += 7;
      battle.hero.hp = battle.hero.maxHp;
      battle.heroHp = battle.hero.hp;
    }
    state.stats.shards += 25 + battle.enemy.level * 3;
    if (battle.gym) {
      const gym = battle.gym;
      writeSave();
      updateHud();
      setBattleLog(`${battle.enemy.actualName.toUpperCase()} fainted. +${xp} XP.`);
      await wait(1050);
      if (state.battle !== battle) return;
      if (gym.index + 1 < gym.roster.length) {
        gym.index += 1;
        const next = normalizeAlly(gym.roster[gym.index]);
        battle.enemy = next;
        battle.enemyHp = next.hp;
        battle.enemyMax = next.maxHp;
        battle.capture = 0;
        battle.menu = "root";
        battle.fx = { kind: "enemy", t: 0, color: next.color };
        setBattleLog(`${gym.leader.toUpperCase()} threw out ${next.actualName.toUpperCase()}!`);
        await wait(980);
        if (state.battle !== battle) return;
        battle.locked = false;
        battle.fx = null;
        setBattleLog(`What will ${battle.hero.actualName.toUpperCase()} do?`);
        renderBattleActions();
        return;
      }
      const flag = badgeFlag(gym.id);
      const firstClear = !state.stats.flags[flag];
      if (firstClear) {
        state.stats.flags[flag] = true;
        state.stats.shards += 80;
        state.stats.items.fieldNote += 2;
        state.stats.rank = Math.max(Number(state.stats.rank || 1), earnedBadges().length + 1);
      } else {
        state.stats.shards += 35;
      }
      writeSave();
      updateHud();
      const reward = firstClear ? `awarded the ${gym.badge.toUpperCase()}! +80 shards, +2 Field Notes.` : `paid a rematch purse. +35 shards.`;
      setBattleLog(`${gym.leader.toUpperCase()} ${reward}`);
      await wait(1700);
      trackHunterCompletion("Gym Battle", firstClear ? 100 : 88, 100, []);
      closeBattle(firstClear ? `${gym.badge} earned.` : `${gym.leader} rematch cleared.`);
      return;
    }
    let joined = false;
    if (captured || state.stats.party.length < 2) {
      const exists = state.stats.party.some((ally) => ally.id === battle.enemy.id);
      if (!exists && state.stats.party.length < 6) {
        state.stats.party.push(battle.enemy);
        joined = true;
      }
    }
    writeSave();
    updateHud();
    setBattleLog(`${battle.enemy.actualName.toUpperCase()} fainted. +${xp} XP.${joined ? " It joined the roster." : ""}`);
    await wait(1300);
    trackHunterCompletion("Battle", joined ? 95 : 85, 100, []);
    closeBattle(joined ? `${battle.enemy.actualName} joined your roster.` : `${battle.enemy.actualName} fainted.`);
  }

  function closeBattle(message) {
    if (message) {
      state.stats.lastMessage = message;
      writeSave();
    }
    state.mode = "overworld";
    state.battle = null;
    els.battleUi.hidden = true;
    els.game.classList.remove("in-battle");
    renderBattleActions();
  }

  function healParty() {
    state.stats.party.forEach((ally) => {
      normalizeAlly(ally);
      ally.hp = ally.maxHp;
      ally.moves.forEach((item) => {
        item.pp = item.maxPp;
      });
    });
    state.stats.hp = state.stats.maxHp;
    writeSave();
    updateHud();
  }

  function updateHud() {
    ensureStarter();
    els.zoneName.textContent = zoneName();
    els.partyHud.textContent = `Party ${state.stats.party.length}`;
    els.shardHud.textContent = `${state.stats.shards || 0} Shards`;
    els.courseHud.textContent = state.stats.course === "All Courses" ? "All Courses" : courseTypeFor(state.stats.course).name;
  }

  function zoneName() {
    const p = state.player;
    const nearest = places.slice().sort((a, b) => Math.hypot(a.gx - p.gx, a.gy - p.gy) - Math.hypot(b.gx - p.gx, b.gy - p.gy))[0];
    return nearest && Math.hypot(nearest.gx - p.gx, nearest.gy - p.gy) < 9 ? nearest.name : "Atlas Route";
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function update(dt) {
    if (state.mode !== "overworld") return;
    state.inputCooldown = Math.max(0, state.inputCooldown - dt);
    const p = state.player;
    if (p.moving) {
      p.step = Math.min(1, p.step + dt / 135);
      const ease = p.step < .5 ? 2 * p.step * p.step : 1 - Math.pow(-2 * p.step + 2, 2) / 2;
      p.x = p.fromX + (p.toX - p.fromX) * ease;
      p.y = p.fromY + (p.toY - p.fromY) * ease;
      if (p.step >= 1) {
        p.moving = false;
        p.gx = Math.round(p.x / TILE);
        p.gy = Math.round(p.y / TILE);
        if (state.grass.has(key(p.gx, p.gy)) && Math.random() < .095) openBattle(makeAlly(nextQuestion()), false);
      }
      return;
    }
    const dir = ["up", "down", "left", "right"].find((name) => state.keys.has(name));
    if (dir) tryMove(dir);
  }

  function tryMove(dirName) {
    const dir = dirs[dirName];
    const p = state.player;
    p.dir = dirName;
    const nx = p.gx + dir.x;
    const ny = p.gy + dir.y;
    if (isBlocked(nx, ny)) return;
    p.moving = true;
    p.step = 0;
    p.fromX = p.gx * TILE;
    p.fromY = p.gy * TILE;
    p.toX = nx * TILE;
    p.toY = ny * TILE;
  }

  function render() {
    ctx.clearRect(0, 0, view.w, view.h);
    if (state.mode === "battle") renderBattle();
    else renderWorld();
    requestAnimationFrame(loop);
  }

  function loop(now) {
    const dt = Math.min(60, now - (state.last || now));
    state.last = now;
    update(dt);
    renderFrame();
  }

  function renderFrame() {
    ctx.clearRect(0, 0, view.w, view.h);
    if (state.mode === "battle") renderBattle();
    else renderWorld();
    requestAnimationFrame(loop);
  }

  function renderWorld() {
    const p = state.player;
    state.camera.x = clamp(p.x - view.w / 2, 0, WORLD_W * TILE - view.w);
    state.camera.y = clamp(p.y - view.h / 2, 0, WORLD_H * TILE - view.h);
    const sx = Math.floor(state.camera.x / TILE) - 2;
    const sy = Math.floor(state.camera.y / TILE) - 2;
    const ex = Math.ceil((state.camera.x + view.w) / TILE) + 2;
    const ey = Math.ceil((state.camera.y + view.h) / TILE) + 2;
    for (let y = sy; y <= ey; y += 1) {
      for (let x = sx; x <= ex; x += 1) {
        const tile = tileAt(x, y);
        const dx = x * TILE - state.camera.x;
        const dy = y * TILE - state.camera.y;
        drawTile(tile, dx, dy, x, y);
      }
    }
    drawRouteAtmosphere();
    places.forEach(drawPlace);
    decor.forEach(drawDecor);
    npcs.forEach(drawNpc);
    drawFollower();
    drawPlayer();
    drawWorldOverlay();
  }

  function drawTile(tile, x, y, gx, gy) {
    const t = performance.now() / 1000;
    const jitter = (hash(`${gx},${gy}`) % 8) - 4;
    const base = tile === "path" ? "#d4b45d"
      : tile === "water" ? "#3da7b8"
      : tile === "tree" ? "#2f702b"
      : tile === "mountain" ? "#8c8d78"
      : tile === "grass2" ? "#75b928"
      : "#9fd43c";
    ctx.fillStyle = base;
    ctx.fillRect(x, y, TILE + 1, TILE + 1);
    ctx.fillStyle = tile === "path" ? "rgba(96, 61, 20, .16)"
      : tile === "water" ? "rgba(237, 249, 135, .22)"
      : "rgba(237, 249, 135, .12)";
    if (tile === "path") {
      ctx.fillRect(x + 2, y + 8 + ((gx + gy) % 3), 10, 3);
      ctx.fillRect(x + 18, y + 21 + jitter * .2, 12, 3);
      ctx.strokeStyle = "rgba(77, 48, 15, .22)";
      ctx.strokeRect(x + .5, y + .5, TILE, TILE);
    } else if (tile === "water") {
      const wave = Math.sin(t * 2.4 + gx * .7 + gy * .3) * 2;
      ctx.fillRect(x + 3, y + 10 + ((gx + gy) % 5) + wave, 24, 3);
      ctx.fillRect(x + 9, y + 22 - wave * .4, 16, 2);
      ctx.fillStyle = "rgba(117, 244, 255, .18)";
      ctx.fillRect(x + 1, y + TILE - 5, TILE - 2, 2);
    } else if (tile === "mountain") {
      drawAtlas("mountainA", x - 4, y - 10, 42, 40);
    } else {
      ctx.fillRect(x + 5, y + 6 + jitter * .25, 4, 9);
      ctx.fillRect(x + 18, y + 16 - jitter * .2, 3, 10);
      ctx.fillStyle = "rgba(6, 42, 17, .12)";
      ctx.fillRect(x, y + TILE - 4, TILE + 1, 4);
    }
    if (tile === "grass2") {
      const sway = Math.sin(t * 4 + gx * .8 + gy * .5);
      ctx.fillStyle = "rgba(6, 42, 17, .34)";
      for (let i = 0; i < 6; i += 1) ctx.fillRect(x + 3 + i * 5 + sway * (i % 2 ? 1 : -1), y + 17 - (i % 2) * 5, 3, 13);
    }
    if (tile === "tree") {
      ctx.fillStyle = "#1b551d";
      ctx.fillRect(x, y, TILE + 1, TILE + 1);
      drawAtlas((gx + gy) % 2 ? "treeA" : "treeB", x - 8, y - 20, 48, 54);
    }
  }

  function drawRouteAtmosphere() {
    if (FX_LITE || PREFERS_REDUCED || view.w < 680 && view.h < 680) return;
    const t = performance.now() / 1000;
    const startX = Math.floor(state.camera.x / TILE);
    const startY = Math.floor(state.camera.y / TILE);
    const count = Math.min(34, Math.floor(view.w * view.h / 32000));
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const seed = hash(`${startX + i * 7}:${startY + i * 11}:route`);
      const wx = ((seed % (WORLD_W * TILE)) + Math.sin(t * .23 + i) * 18) % (WORLD_W * TILE);
      const wy = ((Math.floor(seed / 97) % (WORLD_H * TILE)) + t * (5 + (seed % 4))) % (WORLD_H * TILE);
      const x = wx - state.camera.x;
      const y = wy - state.camera.y;
      if (x < -20 || y < -20 || x > view.w + 20 || y > view.h + 20) continue;
      ctx.globalAlpha = .22 + ((seed % 9) / 30);
      ctx.fillStyle = seed % 3 ? "#edf987" : "#75f4ff";
      ctx.fillRect(x, y, 3 + (seed % 2), 3 + (seed % 2));
    }
    ctx.restore();
  }

  function drawPlace(place) {
    const gymScale = place.gym ? 1.08 : 1;
    const w = (place.gym ? 116 : 104) * gymScale;
    const h = (place.gym ? 92 : 82) * gymScale;
    const x = place.gx * TILE - state.camera.x - w / 2 + TILE / 2;
    const y = place.gy * TILE - state.camera.y - h + TILE;
    ctx.fillStyle = place.gym ? "rgba(243, 207, 97, .28)" : "rgba(7, 21, 12, .22)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 6, w * .42, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!drawSheetCell(landmarkSheet, landmarkCells[place.id], 4, 4, x, y, w, h)) drawAtlas(place.icon, x + 6, y + 8, 94, 72);
    if (place.gym) {
      const pulse = .45 + Math.sin(performance.now() / 1000 * 2.4 + hash(place.id)) * .25;
      ctx.strokeStyle = `rgba(237, 249, 135, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
    }
    label(place.name, x - 4, y - 13, Math.min(132, w + 20));
  }

  function drawNpc(npc) {
    const x = npc.gx * TILE - state.camera.x;
    const y = npc.gy * TILE - state.camera.y;
    const bob = Math.sin(performance.now() / 1000 * 2 + hash(npc.id) % 8) * 2;
    const hue = (hash(npc.type) % 360);
    ctx.fillStyle = `hsla(${hue}, 70%, 58%, .28)`;
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 19, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!drawSheetCell(trainerSheet, trainerCells[npc.sprite || npc.id] ?? trainerCells.traveler, 4, 4, x - 16, y - 38 + bob, 52, 58)) {
      drawAtlas("scholar", x - 11, y - 25 + bob, 50, 48);
      ctx.fillStyle = `hsl(${hue}, 78%, 62%)`;
      ctx.fillRect(x + 1, y - 24 + bob, 18, 3);
    }
    label(npc.name.split(" ")[0], x - 14, y - 36, 72);
  }

  function drawFollower() {
    if (state.stats.party.length < 1 || state.mode !== "overworld") return;
    const p = state.player;
    const dir = dirs[p.dir] || dirs.down;
    const ally = activeAlly();
    const x = p.x - dir.x * TILE - state.camera.x;
    const y = p.y - dir.y * TILE - state.camera.y;
    const bob = Math.sin((p.step || 0) * Math.PI * 4 + Math.PI) * (p.moving ? 2 : 1);
    ctx.save();
    ctx.globalAlpha = .95;
    ctx.fillStyle = "rgba(7, 21, 12, .34)";
    ctx.beginPath();
    ctx.ellipse(x + 5, y + 17, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    drawFigure(ally, x - 18, y - 24 + bob, 42, 42, p.dir === "right");
    ctx.restore();
  }

  function drawPlayer() {
    const p = state.player;
    const x = p.x - state.camera.x;
    const y = p.y - state.camera.y;
    const bob = p.moving ? Math.sin(p.step * Math.PI * 4) * 2 : 0;
    if (p.dir === "up" && playerBack.complete) {
      ctx.drawImage(playerBack, x - 13, y - 28 + bob, 42, 54);
      return;
    }
    const keyName = dirs[p.dir] ? dirs[p.dir].key : "playerFront";
    drawAtlas(keyName, x - 13, y - 28 + bob, 42, 54);
  }

  function label(text, x, y, width) {
    ctx.fillStyle = "rgba(7, 21, 12, .82)";
    ctx.fillRect(x, y, width, 15);
    ctx.fillStyle = "#edf987";
    ctx.font = "9px Courier New";
    ctx.fillText(text.toUpperCase().slice(0, 18), x + 4, y + 11);
  }

  function drawWorldOverlay() {
    if (state.mode !== "overworld") return;
    const touch = view.w <= 780 || (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    if (!touch && view.w >= 900) drawMiniMap();
    const promptY = touch ? 56 : view.h - 58;
    const target = nearestInteraction();
    if (target) {
      ctx.fillStyle = "rgba(7, 21, 12, .86)";
      ctx.fillRect(view.w / 2 - 94, promptY, 188, 26);
      ctx.strokeStyle = "#c9ef41";
      ctx.strokeRect(view.w / 2 - 94, promptY, 188, 26);
      ctx.fillStyle = "#edf987";
      ctx.font = "12px Courier New";
      ctx.fillText("A: TALK / ENTER", view.w / 2 - 70, promptY + 18);
    } else if (!touch) {
      const text = "START / M / P: PAUSE";
      ctx.fillStyle = "rgba(7, 21, 12, .78)";
      ctx.fillRect(view.w / 2 - 96, promptY, 192, 24);
      ctx.strokeStyle = "rgba(201, 239, 65, .65)";
      ctx.strokeRect(view.w / 2 - 96, promptY, 192, 24);
      ctx.fillStyle = "#edf987";
      ctx.font = "11px Courier New";
      ctx.fillText(text, view.w / 2 - 74, promptY + 16);
    }
  }

  function drawMiniMap() {
    const w = 142;
    const h = 104;
    const x = view.w - w - 18;
    const y = 64;
    ctx.save();
    ctx.fillStyle = "rgba(7, 21, 12, .76)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(237, 249, 135, .72)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(201, 239, 65, .08)";
    for (let i = 0; i < 6; i += 1) ctx.fillRect(x + i * 24, y, 1, h);
    for (let i = 0; i < 5; i += 1) ctx.fillRect(x, y + i * 24, w, 1);
    places.forEach((place) => {
      const px = x + 6 + place.gx / WORLD_W * (w - 12);
      const py = y + 6 + place.gy / WORLD_H * (h - 12);
      const won = place.gym && state.stats.flags[badgeFlag(place.gym.id)];
      ctx.fillStyle = place.kind === "center" ? "#75f4ff" : won ? "#77f0af" : place.gym || place.kind === "summit" ? "#f3cf61" : "#edf987";
      ctx.fillRect(px - (place.gym ? 3 : 2), py - (place.gym ? 3 : 2), place.gym ? 6 : 4, place.gym ? 6 : 4);
    });
    const p = state.player;
    const px = x + 6 + p.gx / WORLD_W * (w - 12);
    const py = y + 6 + p.gy / WORLD_H * (h - 12);
    ctx.fillStyle = "#ff6a8d";
    ctx.fillRect(px - 3, py - 3, 6, 6);
    ctx.fillStyle = "#edf987";
    ctx.font = "9px Courier New";
    ctx.fillText("ATLAS", x + 8, y + h - 8);
    ctx.restore();
  }

  function renderBattle() {
    const battle = state.battle;
    if (!battle) return;
    const t = performance.now() / 1000;
    const w = view.w;
    const h = view.h;
    const portrait = h > w;
    const compactLandscape = !portrait && h <= 520;
    const uiReserve = portrait ? Math.min(250, h * .31) : compactLandscape ? Math.min(154, Math.max(126, h * .35)) : Math.min(170, h * .24);
    const minFieldH = compactLandscape ? Math.max(210, h - 170) : 270;
    const fieldH = Math.max(minFieldH, h - uiReserve);
    const skyH = Math.max(118, fieldH * .42);
    const heroBaseX = portrait ? w * .28 : w * .25;
    const heroBaseY = portrait ? fieldH * .68 : compactLandscape ? fieldH * .56 : fieldH * .66;
    const enemyBaseX = portrait ? w * .72 : w * .72;
    const enemyBaseY = portrait ? fieldH * .30 : fieldH * .32;
    const heroW = clamp(w * (portrait ? .26 : compactLandscape ? .15 : .18), 82, 216);
    const enemyW = clamp(w * (portrait ? .28 : compactLandscape ? .15 : .18), 92, 224);
    const cardW = clamp(w * (portrait ? .33 : .28), 122, 270);
    const cardH = portrait ? 78 : 62;
    battle.layout = { heroX: heroBaseX, heroY: heroBaseY, enemyX: enemyBaseX, enemyY: enemyBaseY };
    const sky = ctx.createLinearGradient(0, 0, 0, skyH);
    sky.addColorStop(0, battle.gym ? "#e9f7ff" : "#dff8ff");
    sky.addColorStop(.56, battle.gym ? "#bcefff" : "#a6e8ff");
    sky.addColorStop(1, battle.gym ? "#f3cf61" : "#d8f06a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, skyH);
    if (!FX_LITE && !PREFERS_REDUCED) {
      ctx.save();
      ctx.globalAlpha = battle.gym ? .22 : .16;
      for (let i = 0; i < 5; i += 1) {
        const x = ((t * 18 + i * w * .24) % (w + 160)) - 80;
        const beam = ctx.createLinearGradient(x, 0, x + 120, skyH);
        beam.addColorStop(0, "rgba(117,244,255,0)");
        beam.addColorStop(.5, battle.gym ? "rgba(255,209,92,.42)" : "rgba(117,244,255,.36)");
        beam.addColorStop(1, "rgba(117,244,255,0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 84, 0);
        ctx.lineTo(x + 180, skyH);
        ctx.lineTo(x + 28, skyH);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.fillStyle = battle.gym ? "rgba(243, 207, 97, .24)" : "rgba(117, 244, 255, .16)";
    ctx.beginPath();
    ctx.arc(w * .16, skyH * .38, Math.min(80, w * .08), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = battle.gym ? "rgba(89, 60, 24, .18)" : "rgba(31, 76, 29, .25)";
    for (let i = -1; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * w * .22, skyH);
      ctx.lineTo(i * w * .22 + w * .16, skyH * .45);
      ctx.lineTo(i * w * .22 + w * .34, skyH);
      ctx.closePath();
      ctx.fill();
    }
    const field = ctx.createLinearGradient(0, skyH, 0, fieldH);
    field.addColorStop(0, battle.gym ? "#d0b65d" : "#8dc957");
    field.addColorStop(.52, battle.gym ? "#8ca556" : "#5e9c4e");
    field.addColorStop(1, battle.gym ? "#dbe86e" : "#c7e65a");
    ctx.fillStyle = field;
    ctx.fillRect(0, skyH, w, fieldH - skyH);
    ctx.fillStyle = "rgba(7, 21, 12, .08)";
    for (let y = skyH + 28; y < fieldH; y += 34) ctx.fillRect(0, y, w, 2);
    if (battle.gym) {
      ctx.fillStyle = "rgba(7, 21, 12, .72)";
      ctx.fillRect(w / 2 - 138, 12, 276, 30);
      ctx.strokeStyle = "#f3cf61";
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 138, 12, 276, 30);
      ctx.fillStyle = "#edf987";
      ctx.font = "12px Courier New";
      ctx.fillText(`${battle.gym.badge.toUpperCase()} ${battle.gym.index + 1}/${battle.gym.roster.length}`, w / 2 - 112, 32);
    }
    ctx.fillStyle = battle.hero.color || "rgba(15,56,15,.24)";
    ctx.globalAlpha = .24;
    ctx.beginPath();
    ctx.ellipse(heroBaseX, heroBaseY + heroW * .46, heroW * .9, heroW * .22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = .16;
    ctx.fillStyle = battle.enemy.color || "#07150c";
    ctx.beginPath();
    ctx.ellipse(enemyBaseX, enemyBaseY + enemyW * .58, enemyW * .82, enemyW * .2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawBattleCard(battle.enemy, Math.max(12, w * .06), portrait ? 56 : 45, battle.enemyHp, battle.enemyMax, false, cardW, cardH);
    drawBattleCard(battle.hero, Math.min(w - cardW - 14, w * (portrait ? .55 : .64)), Math.max(150, fieldH - cardH - 14), battle.heroHp, battle.hero.maxHp, true, cardW, cardH);
    const enemyShake = battle.fx && battle.fx.kind === "enemyHit" ? Math.sin(t * 70) * 8 : 0;
    const heroShake = battle.fx && battle.fx.kind === "heroHit" ? Math.sin(t * 70) * 8 : 0;
    drawFigure(battle.enemy, enemyBaseX - enemyW * .48 + enemyShake, enemyBaseY - enemyW * .34, enemyW, enemyW * .75, false);
    drawFigure(battle.hero, heroBaseX - heroW * .5 + heroShake, heroBaseY - heroW * .36, heroW, heroW * .75, true);
    drawBattleFx(battle);
  }

  function drawBattleCard(ally, x, y, hp, maxHp, player, width = 260, height = 62) {
    ctx.fillStyle = player ? "rgba(229, 250, 246, .96)" : "rgba(255, 241, 171, .96)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "#07150c";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = ally.color || "#f3cf61";
    ctx.fillRect(x + 4, y + 4, 6, height - 8);
    ctx.fillStyle = "#07150c";
    ctx.font = `${width < 160 ? 7 : 9}px Courier New`;
    ctx.fillText(ally.type.toUpperCase(), x + 16, y + 16);
    ctx.font = `${width < 160 ? 13 : 18}px Courier New`;
    ctx.fillText(ally.actualName.toUpperCase(), x + 16, y + (height > 65 ? 43 : 38), width - 26);
    ctx.fillStyle = "#1f4c1d";
    const barY = y + height - 16;
    const barW = width - 30;
    ctx.fillRect(x + 16, barY, barW, 8);
    ctx.fillStyle = hp / maxHp < .3 ? "#ff6a8d" : player ? "#75f4ff" : "#07150c";
    ctx.fillRect(x + 16, barY, Math.max(0, barW * hp / maxHp), 8);
  }

  function drawBattleFx(battle) {
    if (!battle.fx) return;
    const t = (performance.now() % 900) / 900;
    const color = battle.fx.color || "#edf987";
    const layout = battle.layout || { heroX: view.w * .25, heroY: view.h * .58, enemyX: view.w * .72, enemyY: view.h * .3 };
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#07150c";
    ctx.lineWidth = 4;
    if (battle.fx.kind === "hero") {
      const x = layout.heroX + t * (layout.enemyX - layout.heroX);
      const y = layout.heroY + t * (layout.enemyY - layout.heroY);
      ctx.beginPath();
      ctx.arc(x, y, 18 + Math.sin(t * Math.PI) * 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (battle.fx.kind === "enemy") {
      const x = layout.enemyX + t * (layout.heroX - layout.enemyX);
      const y = layout.enemyY + t * (layout.heroY - layout.enemyY);
      ctx.beginPath();
      ctx.arc(x, y, 18 + Math.sin(t * Math.PI) * 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (/Hit/.test(battle.fx.kind)) {
      const x = battle.fx.kind === "enemyHit" ? layout.enemyX : layout.heroX;
      const y = battle.fx.kind === "enemyHit" ? layout.enemyY : layout.heroY;
      for (let i = 0; i < 10; i += 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((Math.PI * 2 / 10) * i);
        ctx.fillRect(10, -3, 42 * (1 - t), 6);
        ctx.restore();
      }
    } else if (battle.fx.kind === "capsule" || battle.fx.kind === "victory") {
      ctx.beginPath();
      ctx.arc(layout.enemyX, layout.enemyY, 18 + t * 82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(layout.enemyX, layout.enemyY, 40 + t * 90, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function actionButton() {
    if (state.mode === "overworld") {
      const target = nearestInteraction();
      if (target) openDialogue(target);
    } else if (state.mode === "dialogue") {
      const first = els.dialogueActions.querySelector("button");
      if (first) first.click();
    }
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = String(target.tagName || "").toLowerCase();
    return target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select";
  }

  function cancelButton() {
    if (state.mode === "dialogue") closeDialogue();
    else if (state.mode === "menu") closeMenu();
    else if (state.mode === "quest") closeQuest();
    else if (state.mode === "battle" && state.battle && !state.battle.locked) {
      state.battle.menu = "root";
      renderBattleActions();
    }
  }

  function goToArcade() {
    writeSave();
    window.location.assign(new URL("../../", window.location.href).href);
  }

  function bindEvents() {
    window.addEventListener("keydown", (event) => {
      if (isTypingTarget(event.target)) {
        if (event.key === "Escape") {
          cancelButton();
          event.preventDefault();
        }
        return;
      }
      const map = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
      if (map[event.key]) {
        state.player.dir = map[event.key];
        state.keys.add(map[event.key]);
        event.preventDefault();
      } else if (event.key === " " || event.key === "Enter" || event.key === "e" || event.key === "E") {
        actionButton();
        event.preventDefault();
      } else if (event.key === "Escape" || event.key === "Backspace") {
        cancelButton();
        event.preventDefault();
      } else if (event.key.toLowerCase() === "m" || event.key.toLowerCase() === "p") {
        state.mode === "menu" ? closeMenu() : openMenu();
      }
    });
    window.addEventListener("keyup", (event) => {
      const map = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
      if (map[event.key]) state.keys.delete(map[event.key]);
    });
    document.querySelectorAll("[data-dir]").forEach((button) => {
      const dir = button.dataset.dir;
      const start = (event) => { event.preventDefault(); state.player.dir = dir; state.keys.add(dir); };
      const end = (event) => { event.preventDefault(); state.keys.delete(dir); };
      button.addEventListener("pointerdown", start);
      button.addEventListener("pointerup", end);
      button.addEventListener("pointercancel", end);
      button.addEventListener("pointerleave", end);
    });
    els.aBtn.addEventListener("click", actionButton);
    els.bBtn.addEventListener("click", cancelButton);
    els.startMenuBtn.addEventListener("click", () => state.mode === "menu" ? closeMenu() : openMenu());
    els.exitBtn.addEventListener("click", goToArcade);
    els.startBtn.addEventListener("click", () => {
      els.boot.hidden = true;
      state.mode = "overworld";
      ensureStarter();
      updateHud();
      writeSave();
    });
    els.closeMenu.addEventListener("click", closeMenu);
    els.huntBtn.addEventListener("click", () => { closeMenu(); openBattle(makeAlly(nextQuestion()), false); });
    els.questBtn.addEventListener("click", () => { closeMenu(); openQuest("Field Menu"); });
    els.partyBtn.addEventListener("click", () => renderMenu("party"));
    els.bagBtn.addEventListener("click", () => renderMenu("bag"));
    els.saveBtn.addEventListener("click", () => { writeSave(); renderMenu("party"); });
    els.courseSelect.addEventListener("change", () => { fillSets(); applyFilters(); });
    els.setSelect.addEventListener("change", applyFilters);
    els.questForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitQuest(els.questInput.value);
    });
  }

  async function init() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 80));
    buildWorld();
    bindEvents();
    try {
      const res = await fetch("../../data/chrono-defense-bank.json", { cache: "no-store" });
      state.bank = await res.json();
    } catch {
      state.bank = { courses: ["All Courses"], setsByCourse: {}, questions: [] };
    }
    fillFilters();
    applyFilters();
    ensureStarter();
    updateHud();
    state.mode = "boot";
    requestAnimationFrame(loop);
  }

  init();
})();
