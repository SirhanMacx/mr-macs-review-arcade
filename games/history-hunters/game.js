(() => {
  "use strict";

  const STORAGE_KEY = "mr-macs-history-hunters-v1";
  const WORLD_W = 5200;
  const WORLD_H = 3400;
  const $ = (id) => document.getElementById(id);
  const SourceBank = typeof window !== "undefined" ? window.MrMacsSourceBank : null;

  const els = {
    canvas: $("world"),
    level: $("level"),
    partyHp: $("partyHp"),
    rosterCount: $("rosterCount"),
    shards: $("shards"),
    streak: $("streak"),
    courseFilter: $("courseFilter"),
    setFilter: $("setFilter"),
    huntBtn: $("huntBtn"),
    questBtn: $("questBtn"),
    actionBtn: $("actionBtn"),
    mapBtn: $("mapBtn"),
    bagBtn: $("bagBtn"),
    rosterBtn: $("rosterBtn"),
    codexBtn: $("codexBtn"),
    saveBtn: $("saveBtn"),
    activeRegion: $("activeRegion"),
    questText: $("questText"),
    codexPanel: $("codexPanel"),
    closeCodex: $("closeCodex"),
    codexFamilies: $("codexFamilies"),
    rosterPanel: $("rosterPanel"),
    closeRoster: $("closeRoster"),
    rosterList: $("rosterList"),
    bagPanel: $("bagPanel"),
    closeBag: $("closeBag"),
    bagList: $("bagList"),
    dialoguePanel: $("dialoguePanel"),
    dialogueKicker: $("dialogueKicker"),
    dialogueTitle: $("dialogueTitle"),
    dialogueText: $("dialogueText"),
    dialogueActions: $("dialogueActions"),
    closeDialogue: $("closeDialogue"),
    buildingPanel: $("buildingPanel"),
    buildingRoom: $("buildingRoom"),
    buildingKicker: $("buildingKicker"),
    buildingTitle: $("buildingTitle"),
    buildingText: $("buildingText"),
    buildingActions: $("buildingActions"),
    encounter: $("encounter"),
    portrait: $("portrait"),
    portraitMark: $("portraitMark"),
    rarity: $("rarity"),
    allyName: $("allyName"),
    allyRole: $("allyRole"),
    enemyType: $("enemyType"),
    enemyName: $("enemyName"),
    enemyHp: $("enemyHp"),
    heroType: $("heroType"),
    heroName: $("heroName"),
    heroHp: $("heroHp"),
    moves: $("moves"),
    trialKicker: $("trialKicker"),
    trialMeta: $("trialMeta"),
    captureBar: $("captureBar"),
    battleLog: $("battleLog"),
    battleActions: $("battleActions"),
    moveButtons: $("moveButtons"),
    sourcePanel: $("sourcePanel"),
    questionText: $("questionText"),
    choices: $("choices"),
    typedForm: $("typedForm"),
    typedAnswer: $("typedAnswer"),
    feedback: $("feedback"),
    closeEncounter: $("closeEncounter"),
    startScreen: $("startScreen"),
    beginBtn: $("beginBtn"),
    startStats: $("startStats"),
    handheldControls: $("handheldControls"),
    aBtn: $("aBtn"),
    bBtn: $("bBtn"),
    startMenuBtn: $("startMenuBtn"),
    fieldHint: $("fieldHint")
  };

  const ctx = els.canvas.getContext("2d", { alpha: false });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const images = {};
  const GB = {
    ink: "#0f380f",
    dark: "#306230",
    mid: "#8bac0f",
    light: "#9bbc0f",
    glow: "#d6ee63"
  };
  const TILE_SIZE = 96;
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
    mountainB: [641, 389, 132, 107],
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
    scholar: [64, 1266, 181, 154],
    archiveBurst: [489, 1280, 305, 166]
  };
  const openWorldSpots = [
    [330, 310], [680, 300], [1080, 300], [1540, 300], [2070, 310], [2600, 330], [3150, 360],
    [300, 650], [690, 650], [1110, 640], [1560, 650], [2070, 660], [2590, 670], [3120, 690],
    [330, 1060], [720, 1070], [1160, 1060], [1600, 1070], [2070, 1080], [2600, 1090], [3120, 1110],
    [390, 1480], [800, 1490], [1240, 1500], [1710, 1490], [2140, 1510], [2630, 1510], [3100, 1500],
    [450, 1900], [910, 1900], [1370, 1905], [1830, 1900], [2290, 1910], [2750, 1900], [3180, 1880]
  ];
  const tallGrassZones = [
    [160, 180, 560, 250], [880, 160, 420, 260], [1840, 170, 580, 260], [2860, 180, 520, 270],
    [180, 520, 420, 270], [890, 520, 360, 250], [1840, 520, 430, 260], [2840, 550, 500, 270],
    [250, 1200, 520, 300], [880, 1200, 470, 280], [1830, 1200, 590, 290], [2820, 1180, 540, 300],
    [280, 1740, 560, 300], [1060, 1760, 520, 300], [1900, 1760, 560, 300], [2740, 1720, 540, 310],
    [3650, 260, 620, 300], [4380, 330, 520, 310], [3660, 920, 560, 310], [4400, 1080, 520, 330],
    [3450, 1710, 610, 330], [4290, 1870, 600, 330], [3350, 2490, 650, 330], [4260, 2700, 620, 350]
  ];

  const worldPlaces = [
    {
      id: "center",
      kind: "center",
      name: "Chronicle Center",
      x: 1180,
      y: 1110,
      icon: "school",
      text: "Nurse Archive restores your party health and saves the expedition log."
    },
    {
      id: "mart",
      kind: "shop",
      name: "Archive Supply",
      x: 1510,
      y: 1110,
      icon: "chest",
      text: "Buy field items with shards: capsules, notes, lenses, and emergency restores."
    },
    {
      id: "lab",
      kind: "story",
      name: "Professor Mac's Lab",
      x: 1320,
      y: 820,
      icon: "gate",
      text: "Professor Mac tracks your route badge progress and unlocks the next chapter."
    },
    {
      id: "museum",
      kind: "story",
      name: "Source Museum",
      x: 2230,
      y: 1260,
      icon: "arch",
      text: "The museum curator teaches source-based battles and rewards careful evidence reading."
    },
    {
      id: "harbor",
      kind: "story",
      name: "Exchange Harbor",
      x: 3040,
      y: 1720,
      icon: "portal",
      text: "A route hub for global networks, trade, migration, and empire encounters."
    },
    {
      id: "capitol",
      kind: "story",
      name: "Civic Capitol",
      x: 3900,
      y: 720,
      icon: "school",
      text: "A rights-and-government district for civics, constitutional principles, courts, and public action."
    },
    {
      id: "forge",
      kind: "story",
      name: "Industrial Forge",
      x: 4540,
      y: 1370,
      icon: "gate",
      text: "Factory routes connect industrialization, labor, capitalism, socialism, reform, and migration."
    },
    {
      id: "psychLab",
      kind: "story",
      name: "Mind Lab",
      x: 3820,
      y: 2200,
      icon: "arch",
      text: "A research wing for psychology, behavior, cognition, learning, and experiments."
    },
    {
      id: "summit",
      kind: "story",
      name: "Regents Summit",
      x: 4620,
      y: 2860,
      icon: "portal",
      text: "The high route mixes cumulative review, final bosses, source work, and endurance quests."
    }
  ];

  const npcs = [
    {
      id: "guide",
      name: "Guide Maya",
      x: 1250,
      y: 930,
      type: "Guide",
      text: "Walk into tall grass to trigger wild figure battles. Use Talk near buildings and people for quests, items, and lore.",
      grant: "starter"
    },
    {
      id: "rival",
      name: "Rival Carter",
      x: 1710,
      y: 920,
      type: "Route Rival",
      text: "I am clearing the archive routes with a full roster. Bring real moves, items, and type matchups if you want to pass me.",
      action: "battle"
    },
    {
      id: "curator",
      name: "Curator Rivera",
      x: 2295,
      y: 1410,
      type: "Source Coach",
      text: "The museum posts source quests. Read the map, cartoon, chart, or excerpt first, then collect XP and shards.",
      grant: "lens"
    },
    {
      id: "captain",
      name: "Captain Zora",
      x: 3080,
      y: 1870,
      type: "Harbor Captain",
      text: "Global routes connect goods, ideas, disease, technologies, people, and power. That is how you win the long game.",
      action: "battle"
    },
    {
      id: "justice",
      name: "Justice Vega",
      x: 3970,
      y: 900,
      type: "Civic Rival",
      text: "A court case is a battle over principles. Bring a civics-type ally and watch federalism, rights, and precedent interact.",
      action: "battle"
    },
    {
      id: "organizer",
      name: "Organizer Noor",
      x: 4560,
      y: 1540,
      type: "Labor Organizer",
      text: "Industrial routes hit hard: factories, urbanization, labor systems, reform movements, and new ideologies all stack together.",
      grant: "forgeNote"
    },
    {
      id: "researcher",
      name: "Dr. Sato",
      x: 3740,
      y: 2360,
      type: "Research Coach",
      text: "In the Mind Lab, every claim needs a method. Experiments, ethics, learning, memory, and bias all have battle effects.",
      grant: "labNote"
    },
    {
      id: "champion",
      name: "Summit Champion Ari",
      x: 4610,
      y: 3060,
      type: "Summit Champion",
      text: "You do not clear the summit with one good answer. You need a party, items, type matchups, and real historical range.",
      action: "battle"
    }
  ];

  const storyChapters = [
    "Chapter 1: Get your first historical ally.",
    "Chapter 2: Build a three-ally party across course types.",
    "Chapter 3: Clear five review missions and visit the Source Museum.",
    "Chapter 4: Reach the harbor with a level 5 roster leader.",
    "Chapter 5: Cross the eastern routes and test civics, industry, psychology, and global review.",
    "Chapter 6: Summit mode unlocked. Build a complete party and clear cumulative quests."
  ];

  const itemCatalog = {
    capsule: {
      label: "Archive Capsule",
      price: 24,
      description: "Attempts a recruitment capture during battle. Best after lowering HP.",
      battle: true
    },
    fieldNote: {
      label: "Field Notes",
      price: 18,
      description: "Boosts your next battle move and helps a figure trust you.",
      battle: true
    },
    sourceLens: {
      label: "Source Lens",
      price: 32,
      description: "Shows a source-reading hint during review quests.",
      battle: true
    },
    healKit: {
      label: "Restoration Tea",
      price: 20,
      description: "Restores 35 party HP anywhere.",
      battle: true
    },
    treatyPass: {
      label: "Treaty Pass",
      price: 45,
      description: "Safely exits a battle while keeping current streak.",
      battle: true
    }
  };

  const palettes = [
    ["#70f2ff", "#ffd66e", "#2f68ff"],
    ["#77f0af", "#fff0a8", "#168a6a"],
    ["#ff789d", "#ffd66e", "#7139ff"],
    ["#c9a0ff", "#70f2ff", "#362066"],
    ["#ffb15f", "#fff0a8", "#5f3318"],
    ["#8fb4ff", "#77f0af", "#172f75"]
  ];

  const courseTypeRules = [
    { name: "AP Econ", cluster: "economics", color: "#ffd66e", match: /AP Economics Combined/i, flavor: "graphs, incentives, markets, policy", move: "Model Breaker" },
    { name: "AP Macro", cluster: "economics", color: "#ffd66e", match: /AP Macroeconomics/i, flavor: "GDP, inflation, money, stabilization", move: "Aggregate Shock" },
    { name: "AP Micro", cluster: "economics", color: "#ffd66e", match: /AP Microeconomics/i, flavor: "firms, costs, markets, externalities", move: "Marginal Strike" },
    { name: "Economics", cluster: "economics", color: "#ffd66e", match: /^Economics Course/i, flavor: "scarcity, choices, markets, systems", move: "Scarcity Spark" },
    { name: "AP Euro", cluster: "global", color: "#c9a0ff", match: /AP European History/i, flavor: "Europe, revolutions, ideas, states", move: "Congress Combo" },
    { name: "Human Geo", cluster: "geography", color: "#8fb4ff", match: /AP Human Geography/i, flavor: "population, culture, space, land use", move: "Spatial Shift" },
    { name: "AP Psych", cluster: "psychology", color: "#f39cff", match: /AP Psychology/i, flavor: "behavior, cognition, learning, research", move: "Cognition Burst" },
    { name: "AP Gov", cluster: "civics", color: "#70f2ff", match: /AP U\.S\. Government|AP US Government/i, flavor: "institutions, rights, elections, policy", move: "Federalism Feint" },
    { name: "APUSH", cluster: "us", color: "#77f0af", match: /AP U\.S\. History|AP US History/i, flavor: "periods, documents, reform, conflict", move: "Primary Source Rush" },
    { name: "AP World", cluster: "global", color: "#c9a0ff", match: /AP World History/i, flavor: "networks, empires, revolutions, modernity", move: "Global Network" },
    { name: "Civics", cluster: "civics", color: "#70f2ff", match: /Civics and PIG/i, flavor: "participation, rights, government, action", move: "Civic Charge" },
    { name: "Global 10", cluster: "global", color: "#c9a0ff", match: /Grade 10 Global/i, flavor: "modern global history and turning points", move: "Turning Point" },
    { name: "US Regents", cluster: "us", color: "#77f0af", match: /Grade 11 U\.S\. History|NYS U\.S\. History/i, flavor: "United States history, civics, documents", move: "Regents Rally" },
    { name: "Grade 5", cluster: "foundations", color: "#ffb15f", match: /Grade 5/i, flavor: "Western Hemisphere peoples, geography, culture", move: "Hemisphere Hop" },
    { name: "Grade 6", cluster: "global", color: "#c9a0ff", match: /Grade 6/i, flavor: "Eastern Hemisphere civilizations and belief systems", move: "Civilization Spark" },
    { name: "Grade 7", cluster: "us", color: "#77f0af", match: /Grade 7/i, flavor: "early United States history and government", move: "Republic Rush" },
    { name: "Grade 8", cluster: "us", color: "#77f0af", match: /Grade 8/i, flavor: "modern United States history and reform", move: "Reform Relay" },
    { name: "Global 9", cluster: "global", color: "#c9a0ff", match: /Grade 9 Global/i, flavor: "early world history, civilizations, exchange", move: "Empire Echo" },
    { name: "Global Regents", cluster: "global", color: "#c9a0ff", match: /NYS Global History/i, flavor: "Regents global history, geography, documents", move: "Enduring Issue" },
    { name: "Review", cluster: "review", color: "#fff0a8", match: /All Courses|Review/i, flavor: "mixed arcade review energy", move: "Archive Pulse" }
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

  const typeData = courseTypeRules.reduce((acc, lane) => {
    acc[lane.name] = { color: lane.color, cluster: lane.cluster, flavor: lane.flavor, move: lane.move };
    return acc;
  }, {});
  const typeOrder = courseTypeRules.map((lane) => lane.name);

  const figureFamiliesByType = {
    "AP Econ": [
      ["Adam Smith", ["Kirkcaldy Thinker", "Market Smith", "Invisible-Hand Sage"], "Explains incentives, specialization, trade, and market logic."],
      ["John Maynard Keynes", ["Cambridge Debater", "Demand Doctor", "Policy Stormcaller"], "Powers up on spending, recessions, stabilization, and aggregate demand."],
      ["Elinor Ostrom", ["Commons Scout", "Institution Builder", "Collective-Action Legend"], "Handles public goods, cooperation, incentives, and resource management."]
    ],
    "AP Macro": [
      ["John Maynard Keynes", ["Cambridge Debater", "Demand Doctor", "Policy Stormcaller"], "Battles recessions, unemployment, inflation, and fiscal policy."],
      ["Janet Yellen", ["Data Reader", "Fed Chair", "Soft-Landing Strategist"], "Tracks labor markets, inflation signals, and monetary policy decisions."],
      ["Paul Volcker", ["Rate Rookie", "Inflation Breaker", "Central Bank Titan"], "Specializes in money, interest rates, inflation, and policy trade-offs."]
    ],
    "AP Micro": [
      ["Alfred Marshall", ["Supply Sketcher", "Demand Mapper", "Equilibrium Master"], "Works through supply, demand, elasticity, and market models."],
      ["Joan Robinson", ["Firm Analyst", "Imperfect Competitor", "Market Power Maven"], "Handles monopoly, competition, costs, and market structures."],
      ["Elinor Ostrom", ["Commons Scout", "Institution Builder", "Collective-Action Legend"], "Powers up around externalities, public goods, and shared resources."]
    ],
    "Economics": [
      ["Adam Smith", ["Kirkcaldy Thinker", "Market Smith", "Invisible-Hand Sage"], "Covers scarcity, trade, specialization, and market systems."],
      ["John Maynard Keynes", ["Cambridge Debater", "Demand Doctor", "Policy Stormcaller"], "Connects government policy, downturns, demand, and money."],
      ["Milton Friedman", ["Money Mapper", "Monetarist Mentor", "Inflation Hawk"], "Focuses on money supply, markets, inflation, and policy limits."]
    ],
    "AP Euro": [
      ["Leonardo da Vinci", ["Workshop Sketcher", "Renaissance Maker", "Universal Genius"], "Thrives on Renaissance, humanism, art, science, and patronage."],
      ["Martin Luther", ["Wittenberg Monk", "Reformation Spark", "Printing-Press Reformer"], "Powers up around religion, reform, printing, and authority."],
      ["Napoleon Bonaparte", ["Corsican Cadet", "Consulate Commander", "Code Emperor"], "Connects revolution, nationalism, law, empire, and reaction."]
    ],
    "Human Geo": [
      ["Ibn Battuta", ["Route Walker", "World Traveler", "Network Navigator"], "Reads movement, diffusion, trade routes, and cultural connection."],
      ["Jane Jacobs", ["Block Observer", "City Critic", "Urban Vitality Guardian"], "Specializes in cities, land use, neighborhoods, and planning."],
      ["Carl Sauer", ["Landscape Reader", "Culture Mapper", "Human-Environment Sage"], "Handles cultural landscapes, regions, environment, and place."]
    ],
    "AP Psych": [
      ["Wilhelm Wundt", ["Lab Listener", "Introspection Founder", "Psychology Pioneer"], "Starts strong on research methods, history, and experimental psychology."],
      ["B. F. Skinner", ["Box Builder", "Reinforcement Trainer", "Behavior Master"], "Powers up on learning, conditioning, rewards, and behavior."],
      ["Jean Piaget", ["Schema Sorter", "Stage Builder", "Development Sage"], "Handles development, cognition, schemas, and childhood thinking."]
    ],
    "AP Gov": [
      ["James Madison", ["Virginia Note-Taker", "Federalist Framer", "Constitution Architect"], "Built for federalism, factions, checks and balances, and founding documents."],
      ["Thurgood Marshall", ["Courtroom Advocate", "Equal-Protection Champion", "Justice Sentinel"], "Specializes in rights, courts, civil liberties, and civil rights."],
      ["Barbara Jordan", ["Debate Captain", "Constitution Voice", "Civic Standard-Bearer"], "Powers up with representation, oversight, political principles, and participation."]
    ],
    "APUSH": [
      ["George Washington", ["Mount Vernon Scout", "Continental Commander", "Republic Founder"], "Covers founding, precedent, early republic, and leadership."],
      ["Frederick Douglass", ["Baltimore Reader", "Abolition Orator", "Freedom Editor"], "Handles abolition, reform, citizenship, rights, and political voice."],
      ["Franklin D. Roosevelt", ["Hyde Park Organizer", "New Deal Captain", "Four Freedoms Strategist"], "Connects depression, reform, wartime leadership, and federal power."]
    ],
    "AP World": [
      ["Mansa Musa", ["Niani Prince", "Gold Road Ruler", "Mali World Connector"], "Specializes in trade, Islam, wealth, empires, and trans-Saharan networks."],
      ["Zheng He", ["Harbor Cadet", "Treasure Fleet Admiral", "Indian Ocean Navigator"], "Powers up on maritime trade, Ming China, and exchange networks."],
      ["Mohandas Gandhi", ["Law Student", "Salt March Organizer", "Nonviolence Strategist"], "Handles nationalism, imperialism, resistance, and decolonization."]
    ],
    "Civics": [
      ["James Madison", ["Virginia Note-Taker", "Federalist Framer", "Constitution Architect"], "Anchors checks and balances, federalism, factions, and rights."],
      ["Ida B. Wells", ["Memphis Journalist", "Truth Campaigner", "Justice Watchdog"], "Powers up through civic courage, reform, speech, and accountability."],
      ["Eleanor Roosevelt", ["Newspaper Voice", "UN Delegate", "Human Rights Herald"], "Connects citizenship, rights, global responsibility, and public service."]
    ],
    "Global 10": [
      ["Mohandas Gandhi", ["Law Student", "Salt March Organizer", "Nonviolence Strategist"], "Works through imperialism, nationalism, civil disobedience, and independence."],
      ["Nelson Mandela", ["Johannesburg Advocate", "Freedom Negotiator", "Reconciliation President"], "Handles apartheid, resistance, justice, and democratic transition."],
      ["Toussaint Louverture", ["Plantation Coachman", "Revolution General", "Haitian Liberator"], "Connects Atlantic revolutions, freedom, colonialism, and independence."]
    ],
    "US Regents": [
      ["Abraham Lincoln", ["Frontier Reader", "Union President", "Emancipation Statesman"], "Covers Union, constitutional crisis, emancipation, and Reconstruction."],
      ["Harriet Tubman", ["Maryland Scout", "Freedom Conductor", "Union Spy"], "Specializes in abolition, resistance, Civil War, and freedom networks."],
      ["Martin Luther King Jr.", ["Atlanta Orator", "Montgomery Organizer", "Dream Keeper"], "Handles civil rights, nonviolent protest, federal action, and reform."]
    ],
    "Grade 5": [
      ["Sacagawea", ["River Guide", "Trail Interpreter", "Western Route Legend"], "Connects geography, exploration, communication, and western routes."],
      ["Pachacuti", ["Cusco Builder", "Andes Organizer", "Inca Roadmaker"], "Handles Andes geography, empire, roads, labor, and government."],
      ["Moctezuma II", ["Tenochtitlan Prince", "Triple-Alliance Ruler", "Mexica Memory"], "Connects Mesoamerica, cities, tribute, culture, and encounter."]
    ],
    "Grade 6": [
      ["Hammurabi", ["Babylon Judge", "Law Code Keeper", "Justice Stele Guardian"], "Built for laws, ancient river valleys, power, and order."],
      ["Confucius", ["Lu Student", "Ethics Teacher", "Harmony Master"], "Handles belief systems, family, government, order, and values."],
      ["Mansa Musa", ["Niani Prince", "Gold Road Ruler", "Mali World Connector"], "Connects West Africa, trade, Islam, pilgrimage, and wealth."]
    ],
    "Grade 7": [
      ["George Washington", ["Mount Vernon Scout", "Continental Commander", "Republic Founder"], "Covers Revolution, precedent, early republic, and leadership."],
      ["Alexander Hamilton", ["Caribbean Clerk", "Treasury Builder", "Federalist Financier"], "Handles Constitution, finance, federal power, and political parties."],
      ["Tecumseh", ["Shawnee Speaker", "Confederacy Builder", "Resistance Strategist"], "Connects Native resistance, land, expansion, and early republic conflict."]
    ],
    "Grade 8": [
      ["Abraham Lincoln", ["Frontier Reader", "Union President", "Emancipation Statesman"], "Covers Civil War, constitutional crisis, emancipation, and Reconstruction."],
      ["Susan B. Anthony", ["Petition Carrier", "Suffrage Organizer", "Vote-Rights Veteran"], "Powers up on reform, suffrage, citizenship, and rights movements."],
      ["Theodore Roosevelt", ["Rough Rider", "Trust-Buster", "Square Deal Ranger"], "Handles progressivism, conservation, regulation, and expanding federal power."]
    ],
    "Global 9": [
      ["Hammurabi", ["Babylon Judge", "Law Code Keeper", "Justice Stele Guardian"], "Covers river valleys, law, social order, and authority."],
      ["Pericles", ["Agora Speaker", "Athenian Strategist", "Democracy Patron"], "Handles Greek democracy, citizenship, culture, and empire."],
      ["Ibn Battuta", ["Route Walker", "World Traveler", "Network Navigator"], "Reads exchange, travel, Islam, trade, and cultural diffusion."]
    ],
    "Global Regents": [
      ["Mohandas Gandhi", ["Law Student", "Salt March Organizer", "Nonviolence Strategist"], "Works through imperialism, nationalism, civil disobedience, and independence."],
      ["Nelson Mandela", ["Johannesburg Advocate", "Freedom Negotiator", "Reconciliation President"], "Handles apartheid, resistance, justice, and democratic transition."],
      ["Mansa Musa", ["Niani Prince", "Gold Road Ruler", "Mali World Connector"], "Connects trade, Islam, wealth, empire, and geography."]
    ],
    "Review": [
      ["Archive Keeper", ["Shelf Scout", "Index Captain", "Chronicle Guardian"], "A flexible arcade companion for mixed review runs."],
      ["Source Sleuth", ["Clue Reader", "Evidence Tracker", "Document Master"], "Handles maps, excerpts, charts, cartoons, and documents."],
      ["Context Coach", ["Background Buddy", "Era Expert", "Big-Picture Boss"], "Connects causes, effects, context, and big review patterns."]
    ]
  };

  const figureAtlasFiles = [
    "../../assets/history-hunters/keyed/battle-figure-atlas-1-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-2-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-3-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-4-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-5-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-6-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-7-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-8-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-9-keyed.webp",
    "../../assets/history-hunters/keyed/battle-figure-atlas-10-keyed.webp"
  ];
  const allFigureFamilies = Object.entries(figureFamiliesByType).flatMap(([type, rows]) => (
    rows.map((row) => ({
      id: compactKey(`${type}-${row[0]}`),
      type,
      historicalName: row[0],
      names: row[1],
      line: row[2],
      archetype: `${type} Figure`
    }))
  )).map((family, index) => Object.assign(family, {
    atlas: Math.floor(index / 6) + 1,
    row: index % 6,
    globalIndex: index
  }));
  const familiesById = allFigureFamilies.reduce((acc, family) => {
    acc[family.id] = family;
    return acc;
  }, {});

  const fallbackMoves = [
    { name: "Archive Pulse", type: "Review", power: 24, flavor: "A reliable study hit from the whole arcade." },
    { name: "Source Scan", type: "Review", power: 22, flavor: "Reads the evidence before swinging." },
    { name: "Context Check", type: "Review", power: 20, flavor: "Adds background and makes the answer less slippery." },
    { name: "Recall Rush", type: "Review", power: 18, flavor: "Fast, simple, and powered by knowing the term." }
  ];

  const signatureMoves = {
    "Abraham Lincoln": ["Emancipation Proclamation", "A Union strike powered by constitutional crisis, emancipation, and wartime leadership."],
    "Adam Smith": ["Invisible Hand", "Turns incentives, specialization, and trade into market pressure."],
    "Alexander Hamilton": ["Treasury Plan", "Converts debt, credit, and federal power into a financial combo."],
    "Alfred Marshall": ["Supply Curve", "Plots price, quantity, and equilibrium before landing the hit."],
    "Archive Keeper": ["Archive Pulse", "Uses the whole review archive to stabilize the timeline."],
    "B. F. Skinner": ["Reinforcement Loop", "Rewards the correct response and strengthens the behavior."],
    "Barbara Jordan": ["Constitution Voice", "Uses civic principle and public accountability as a clean hit."],
    "Carl Sauer": ["Cultural Landscape", "Reads the human marks on place, region, and environment."],
    "Confucius": ["Harmony Lesson", "Uses order, ethics, family, and government to steady the field."],
    "Context Coach": ["Big-Picture Link", "Connects cause, context, and consequence before the strike."],
    "Eleanor Roosevelt": ["Human Rights Charter", "Turns rights, citizenship, and global responsibility into pressure."],
    "Elinor Ostrom": ["Commons Pact", "Solves the shared-resource problem through cooperation and rules."],
    "Franklin D. Roosevelt": ["New Deal", "Answers depression pressure with reform, relief, and federal action."],
    "Frederick Douglass": ["Abolition Press", "Uses speech, print, and citizenship claims to break injustice."],
    "George Washington": ["Continental Command", "Uses founding precedent and revolutionary leadership."],
    "Hammurabi": ["Law Code", "Carves order, power, and social hierarchy into the record."],
    "Harriet Tubman": ["Underground Route", "Moves through resistance networks with courage and precision."],
    "Ibn Battuta": ["Trade Route", "Crosses networks of exchange, Islam, and cultural diffusion."],
    "Ida B. Wells": ["Truth Campaign", "Uses evidence, journalism, and reform pressure."],
    "James Madison": ["Federalist Papers", "Uses factions, federalism, and checks and balances."],
    "Jane Jacobs": ["Sidewalk Ballet", "Turns city life, neighborhoods, and planning into urban energy."],
    "Janet Yellen": ["Soft Landing", "Reads labor, inflation, and monetary policy signals."],
    "Jean Piaget": ["Schema Shift", "Rebuilds thinking through stages, schemas, and development."],
    "Joan Robinson": ["Market Power", "Breaks down monopoly, competition, cost, and firm behavior."],
    "John Maynard Keynes": ["Demand Surge", "Answers recession pressure with spending and stabilization."],
    "Leonardo da Vinci": ["Renaissance Sketch", "Combines art, science, humanism, and invention."],
    "Mansa Musa": ["Gold Caravan", "Connects wealth, Islam, pilgrimage, and trans-Saharan trade."],
    "Martin Luther": ["Ninety-Five Theses", "Uses printing, reform, and religious challenge."],
    "Martin Luther King Jr.": ["Nonviolent March", "Uses civil disobedience, federal action, and moral pressure."],
    "Milton Friedman": ["Money Supply", "Uses inflation, markets, and policy limits as the attack pattern."],
    "Mohandas Gandhi": ["Salt March", "Uses civil disobedience, nationalism, and anti-imperial pressure."],
    "Moctezuma II": ["Tribute Network", "Channels city power, tribute, and Mesoamerican empire."],
    "Napoleon Bonaparte": ["Code Napoleon", "Combines revolution, law, nationalism, and empire."],
    "Nelson Mandela": ["Reconciliation", "Turns resistance, justice, and democratic transition into power."],
    "Pachacuti": ["Inca Road", "Uses mountain geography, labor systems, and imperial organization."],
    "Paul Volcker": ["Rate Hike", "Pushes back against inflation with central bank force."],
    "Pericles": ["Agora Speech", "Uses citizenship, democracy, culture, and public debate."],
    "Sacagawea": ["River Guide", "Reads geography, communication, and western routes."],
    "Source Sleuth": ["Source Scan", "Reads maps, excerpts, charts, cartoons, and documents."],
    "Susan B. Anthony": ["Suffrage Petition", "Uses reform organizing, citizenship, and voting rights."],
    "Tecumseh": ["Confederacy Call", "Uses Native resistance, land defense, and alliance building."],
    "Theodore Roosevelt": ["Trust Bust", "Uses regulation, conservation, and progressive reform."],
    "Thurgood Marshall": ["Equal Protection", "Uses courts, rights, and constitutional law."],
    "Toussaint Louverture": ["Revolution General", "Uses Atlantic revolution, freedom, and anti-colonial strategy."],
    "Wilhelm Wundt": ["Lab Introspection", "Starts psychology with research, history, and experiment."],
    "Zheng He": ["Treasure Fleet", "Uses maritime trade, Ming power, and Indian Ocean exchange."]
  };

  const historicalOpponents = {
    "Abraham Lincoln": "the Confederacy",
    "Adam Smith": "mercantilism",
    "Alexander Hamilton": "the debt crisis",
    "Alfred Marshall": "market confusion",
    "Archive Keeper": "the missing timeline",
    "B. F. Skinner": "the bad habit loop",
    "Barbara Jordan": "the constitutional crisis",
    "Carl Sauer": "the blank map",
    "Confucius": "social chaos",
    "Context Coach": "the context gap",
    "Eleanor Roosevelt": "rights denial",
    "Elinor Ostrom": "the tragedy trap",
    "Franklin D. Roosevelt": "the Great Depression",
    "Frederick Douglass": "Slave Power",
    "George Washington": "the imperial army",
    "Hammurabi": "disorder",
    "Harriet Tubman": "the Fugitive Slave System",
    "Ibn Battuta": "distance barriers",
    "Ida B. Wells": "the false record",
    "James Madison": "faction chaos",
    "Jane Jacobs": "urban decay",
    "Janet Yellen": "inflation shock",
    "Jean Piaget": "the schema puzzle",
    "Joan Robinson": "monopoly power",
    "John Maynard Keynes": "the depression spiral",
    "Leonardo da Vinci": "closed-minded limits",
    "Mansa Musa": "the scarcity myth",
    "Martin Luther": "the indulgence system",
    "Martin Luther King Jr.": "Jim Crow",
    "Milton Friedman": "runaway inflation",
    "Mohandas Gandhi": "the British Empire",
    "Moctezuma II": "tribute crisis",
    "Napoleon Bonaparte": "the Old Regime coalition",
    "Nelson Mandela": "the apartheid state",
    "Pachacuti": "the mountain barrier",
    "Paul Volcker": "inflation surge",
    "Pericles": "tyranny",
    "Sacagawea": "the unknown trail",
    "Source Sleuth": "the missing stimulus",
    "Susan B. Anthony": "vote denial",
    "Tecumseh": "the land grab",
    "Theodore Roosevelt": "the trust monopoly",
    "Thurgood Marshall": "segregation precedent",
    "Toussaint Louverture": "French colonial forces",
    "Wilhelm Wundt": "guesswork",
    "Zheng He": "maritime isolation"
  };

  const state = {
    bank: null,
    filtered: [],
    queue: [],
    nodes: [],
    selectedNode: null,
    nearInteraction: null,
    activeInteraction: null,
    running: false,
    encounterOpen: false,
    questActive: null,
    locked: false,
    currentQuestion: null,
    currentAlly: null,
    battle: null,
    capture: 0,
    trial: 0,
    wildSteps: 0,
    wildCooldown: 0,
    player: { x: 1320, y: 1040, tx: 1320, ty: 1040, speed: 310, facing: "down" },
    camera: { x: 0, y: 0 },
    keys: {},
    lastAxis: "y",
    particles: [],
    terrain: null,
    pulse: 0,
    last: 0,
    stats: readSave()
  };

  const sensitiveRe = /(holocaust|genocide|enslaved|enslavement|slavery|slave trade|massacre|terrorism|ethnic cleansing|aids|pandemic|famine|atrocit|segregation|apartheid)/i;
  const sourcePromptRe = /(\bthis\s+(excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(documents|statements|headlines|sources|passages|figures|maps|graphs|charts|cartoons)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|similar\s+to\s+this)/i;

  function defaultStats() {
    return {
      rank: 1,
      shards: 0,
      streak: 0,
      bestStreak: 0,
      roster: [],
      missions: 0,
      xp: 0,
      activeAlly: 0,
      playerHp: 100,
      maxHp: 100,
      storyStep: 0,
      flags: {},
      items: { capsule: 3, fieldNote: 2, sourceLens: 1, healKit: 1, treatyPass: 0 }
    };
  }

  function starterAllyFor(typeName) {
    const starterType = typeName === "Review" ? "Global 9" : typeName;
    const lane = courseTypeRules.find((item) => item.name === starterType) || courseTypeFor(starterType);
    const families = familiesForType(lane.name);
    const raw = families[0] || figureFamiliesByType.Review[0];
    const family = familiesById[compactKey(`${lane.name}-${raw[0]}`)] || allFigureFamilies[0];
    const starterQuestion = {
      course: lane.name,
      subject: lane.flavor,
      set: "Starter Roster",
      category: `${lane.name} starter`,
      prompt: family.line,
      answer: family.historicalName,
      tags: ["starter", lane.cluster]
    };
    const palette = [lane.color, GB.glow, GB.dark];
    return {
      id: compactKey(`starter|${lane.name}|${family.historicalName}`).slice(0, 80),
      name: family.names[0],
      actualName: family.historicalName,
      archetype: family.archetype,
      type: lane.name,
      family: family.historicalName,
      familyId: family.id,
      spriteRow: family.row,
      atlas: family.atlas,
      species: family.names[0],
      level: 1,
      role: `${family.historicalName} line: ${family.line}`,
      course: lane.name,
      set: "Starter Roster",
      rarity: "Starter Ally",
      moves: movesFor(starterQuestion, family, lane),
      palette,
      starter: true
    };
  }

  function ensureStarterAlly(typeName) {
    if (state.stats.roster && state.stats.roster.length) return state.stats.roster[0];
    const starter = starterAllyFor(typeName || courseTypeFor(els.courseFilter.value).name);
    state.stats.roster = [starter];
    state.stats.activeAlly = 0;
    state.stats.flags.starterAlly = true;
    writeSave();
    updateHud();
    renderRoster();
    return starter;
  }

  function normalizeStats(saved) {
    const base = defaultStats();
    const stats = Object.assign(base, saved || {});
    stats.roster = Array.isArray(stats.roster) ? stats.roster : [];
    stats.items = Object.assign(base.items, saved && saved.items || {});
    stats.flags = Object.assign({}, saved && saved.flags || {});
    stats.maxHp = Math.max(100, Number(stats.maxHp || 100));
    stats.playerHp = clamp(Number(stats.playerHp || stats.maxHp), 0, stats.maxHp);
    stats.xp = Math.max(0, Number(stats.xp || 0));
    stats.activeAlly = clamp(Number(stats.activeAlly || 0), 0, Math.max(0, stats.roster.length - 1));
    stats.storyStep = clamp(Number(stats.storyStep || 0), 0, storyChapters.length - 1);
    return stats;
  }

  function readSave() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return normalizeStats(saved);
    } catch {
      return defaultStats();
    }
  }

  function writeSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\bcon\s+icts\b/gi, "conflicts")
      .replace(/\bu\.s\.\b/gi, "U.S.")
      .replace(/\bunited states\b/gi, "United States")
      .trim();
  }

  function displayPrompt(q) {
    if (SourceBank && SourceBank.displayPrompt) return SourceBank.displayPrompt(q);
    const raw = cleanText(q && q.prompt);
    const cleaned = raw
      .replace(/^final\s+clue(?:\s+for\s+[^:]+)?:\s*/i, "")
      .replace(/^name\s+this\s+content\s+item:\s*/i, "")
      .replace(/^this\s+is\s+his\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+her\s+/i, "Identify the person whose ")
      .replace(/^this\s+is\s+/i, "Identify: ")
      .replace(/^these\s+are\s+/i, "Identify: ")
      .trim();
    return cleaned || raw;
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\b(the|a|an)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function compactKey(value) {
    return normalize(value).replace(/\s+/g, "");
  }

  function editDistance(a, b) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    const curr = Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
  }

  function typoClose(a, b) {
    const left = compactKey(a);
    const right = compactKey(b);
    if (!left || !right) return false;
    if (left === right) return true;
    const longer = Math.max(left.length, right.length);
    const allowed = longer <= 5 ? 1 : longer <= 10 ? 2 : Math.max(2, Math.floor(longer * .16));
    return editDistance(left, right) <= allowed;
  }

  function significantTokens(value) {
    const stop = { and: true, or: true, of: true, in: true, to: true, for: true, with: true, on: true, by: true, from: true, as: true, at: true, is: true, are: true, was: true, were: true };
    return normalize(value).split(" ").filter((token) => token.length > 1 && !stop[token]);
  }

  function typedMatches(raw, accepted) {
    const answer = normalize(raw);
    if (!answer) return false;
    return accepted.some((item) => {
      const expected = normalize(item);
      if (!expected) return false;
      if (answer === expected || compactKey(answer) === compactKey(expected)) return true;
      if ((expected.length > 5 && answer.includes(expected)) || (answer.length > 5 && expected.includes(answer))) return true;
      if (typoClose(answer, expected)) return true;
      const responseTokens = significantTokens(answer);
      const expectedTokens = significantTokens(expected);
      if (!responseTokens.length || !expectedTokens.length) return false;
      const matched = expectedTokens.filter((token) => responseTokens.some((guess) => typoClose(guess, token))).length;
      return expectedTokens.length <= 3 ? matched === expectedTokens.length : matched / expectedTokens.length >= .72;
    });
  }

  function shuffle(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hash(value) {
    let h = 2166136261;
    const text = String(value || "");
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function paletteFor(value) {
    return palettes[hash(value) % palettes.length];
  }

  function isSensitive(q) {
    const text = [q && q.answer, q && q.prompt, q && q.set, q && q.category, q && (q.tags || []).join(" ")].join(" ");
    return sensitiveRe.test(text);
  }

  function stimulusImagesFor(q) {
    if (SourceBank) return SourceBank.stimulusImages(q);
    if (!q) return [];
    const images = Array.isArray(q.stimulusImages) ? q.stimulusImages.filter((image) => image && image.src) : [];
    if (!images.length) return [];
    if (q.stimulusRequired === true) return images;
    if (q.stimulusRequired === false) return [];
    return sourcePromptRe.test(String(q.prompt || "")) ? images : [];
  }

  function stimulusLabel(q, image, index) {
    if (SourceBank && SourceBank.displayStimulusLabel) return SourceBank.displayStimulusLabel(q, image);
    return cleanText((image && image.label) || (q && q.source) || `Source ${index + 1}`);
  }

  function sourceTextFor(q) {
    if (!q) return "";
    if (q.stimulusText) return cleanText(q.stimulusText);
    if (typeof q.stimulus === "string") return cleanText(q.stimulus);
    return "";
  }

  function isUsableQuestion(q) {
    if (!q || !q.prompt || !q.answer) return false;
    if (SourceBank && !SourceBank.playableSharedPrompt(q)) return false;
    if (SourceBank && SourceBank.sourceBased(q)) {
      if (!stimulusImagesFor(q).length && !sourceTextFor(q)) return false;
      // Bug fix: add trust/course-match check so quarantined or mismatched
      // source questions never enter the pool.
      if (SourceBank.verifiedSourceQuestion && stimulusImagesFor(q).length && !SourceBank.verifiedSourceQuestion(q)) return false;
      if (q.type === "mcq") return SourceBank.usableRegentsQuestion(q);
      return true;
    }
    if (q.type === "mcq" && sourcePromptRe.test(String(q.prompt || "")) && !stimulusImagesFor(q).length && !sourceTextFor(q)) return false;
    return true;
  }

  function answerLabel(q) {
    if (!q) return "";
    if (q.type === "mcq") {
      const match = (q.choices || []).find((choice) => String(choice.label) === String(q.correct));
      return cleanText(match ? match.text : q.answer);
    }
    return cleanText(q.answer);
  }

  function allyNameFor(q) {
    const answer = answerLabel(q);
    if (!answer) return "Archive Echo";
    if (answer.length > 38 || /[.;:]/.test(answer)) {
      const tag = (q.tags || []).find((item) => !/^day\s+\d+/i.test(item) && !/regents|review|exam|framework|source/i.test(item));
      return cleanText(tag || q.category || q.set || "Archive Echo").slice(0, 38);
    }
    return answer;
  }

  function courseTypeFor(course) {
    const text = course || "Review";
    return courseTypeRules.find((lane) => lane.match.test(text)) || courseTypeRules[courseTypeRules.length - 1];
  }

  function familiesForType(type) {
    return figureFamiliesByType[type] || figureFamiliesByType.Review;
  }

  function figureFamilyFor(q, lane) {
    const families = familiesForType(lane.name);
    const index = hash([q.course, q.set, q.category, q.answer, q.id].join("|")) % families.length;
    const raw = families[index];
    const id = compactKey(`${lane.name}-${raw[0]}`);
    return familiesById[id] || allFigureFamilies.find((family) => family.id === id) || allFigureFamilies[0];
  }

  function typeFor(q) {
    return courseTypeFor(q && q.course).name;
  }

  function typeEffect(moveType, targetType) {
    const move = typeData[moveType] || typeData.Review;
    const target = typeData[targetType] || typeData.Review;
    if (moveType === targetType) return 1.25;
    const chart = clusterEffects[move.cluster] || clusterEffects.review;
    if ((chart.strong || []).includes(target.cluster)) return 1.55;
    if ((chart.weak || []).includes(target.cluster)) return .7;
    return 1;
  }

  function effectLabel(multiplier) {
    if (multiplier > 1.2) return "Super effective";
    if (multiplier < .8) return "Not very effective";
    return "Effective";
  }

  function effectSentence(multiplier) {
    if (multiplier > 1.2) return "It's super effective!";
    if (multiplier < .8) return "It's not very effective.";
    return "It connected.";
  }

  function move(name, type, power, flavor) {
    return { name, type, power, flavor };
  }

  function signatureMoveFor(family, type) {
    const signature = signatureMoves[family.historicalName];
    if (!signature) return move(`${family.historicalName.split(" ").slice(-1)[0]} Combo`, type, 29, "A figure-line move tied to the content theme.");
    return move(signature[0], type, 33, signature[1]);
  }

  function opponentFor(ally) {
    const family = familiesById[ally && ally.familyId] || null;
    const name = (ally && ally.actualName) || (family && family.historicalName) || "";
    return historicalOpponents[name] || "the review obstacle";
  }

  function playerTitle() {
    return "Atlas Ranger";
  }

  function shout(text) {
    return cleanText(text || "").toUpperCase();
  }

  function moveActorName() {
    const hero = heroAlly();
    return hero.actualName || hero.name || playerTitle();
  }

  function opponentMoveFor(ally) {
    const target = opponentFor(ally).toLowerCase();
    if (/british empire|imperial/.test(target)) return "Imperial Pressure";
    if (/confederacy|secession/.test(target)) return "Secession Surge";
    if (/depression|panic|inflation/.test(target)) return "Economic Shock";
    if (/jim crow|segregation|apartheid/.test(target)) return "Barrier Wall";
    if (/old regime|coalition|monopoly|mercantilism/.test(target)) return "Status Quo";
    if (/chaos|crisis|disorder/.test(target)) return "Crisis Spiral";
    if (/colonial|empire|land grab/.test(target)) return "Power Grab";
    if (/blank map|distance|route|trail/.test(target)) return "Fog of History";
    return "Context Counter";
  }

  function loreLineFor(ally, mode) {
    const family = familiesById[ally && ally.familyId] || null;
    const name = ally && ally.actualName || family && family.historicalName || ally && ally.name || "This figure";
    const target = opponentFor(ally);
    const type = ally && ally.type || "Review";
    if (mode === "intro") return `${name}'s ${type} echo is tangled with ${target}. ${cleanText(family && family.line || ally && ally.role || "Win the battle to bring the story back into focus.")}`;
    if (mode === "parley") return `${name}: "${cleanText(family && family.line || ally && ally.role || "History is stronger when you know the context.")}"`;
    if (mode === "capture") return `${name} watches your choices. Lower HP, build trust, then use an Archive Capsule.`;
    if (mode === "victory") return `${name}'s context stabilized. ${shout(target)} faded from the route.`;
    return cleanText(ally && ally.role || `${name} enters the route.`);
  }

  function attackDamage(moveUsed, attackerType, defenderType, level, boost) {
    const multiplier = typeEffect(attackerType || moveUsed.type, defenderType || "Review");
    const base = Number(moveUsed.power || 22);
    const rankBonus = Math.min(18, Number(level || 1) * 2);
    const variance = 0.9 + Math.random() * 0.18;
    return {
      amount: Math.max(5, Math.round((base + rankBonus + (boost ? 10 : 0)) * multiplier * variance)),
      multiplier
    };
  }

  function movesFor(q, family, lane) {
    const blob = normalize([q.course, q.subject, q.set, q.category, q.prompt, q.answer, (q.tags || []).join(" ")].join(" "));
    const type = lane.name;
    const laneMove = lane.move || "Archive Pulse";
    const moves = [
      signatureMoveFor(family, type),
      move(laneMove, type, 29, `A ${type} type move powered by this course lane.`),
      move("Context Check", type, 22, "Uses broader historical context as battle pressure.")
    ];
    if (/source|document|excerpt|cartoon|map|graph|photograph|poster|passage|stimulus/.test(blob) || q.stimulusRequired) {
      moves.splice(1, 0, move("Source Scan", type, 32, "Reads the stimulus before the attack lands."));
    } else if (/war|revolution|conflict|movement|rights|reform|trade|market|constitution|court|belief|religion|migration|culture/.test(blob)) {
      moves.splice(1, 0, move("Timeline Combo", type, 27, "Links the turning point to the change that followed."));
    } else {
      moves.splice(1, 0, move("Notebook Jab", type, 25, "A clean study-note strike."));
    }
    return moves.slice(0, 4);
  }

  function rarityFor(q) {
    if (q && q.stimulusRequired) return "Source-Rare";
    const value = Number(q && q.value || 0);
    if (value >= 500) return "Epic Echo";
    if (value >= 300) return "Rare Echo";
    return "Common Echo";
  }

  function stageForAlly(ally) {
    if (ally && Number(ally.level || 0) > 1) return clamp(Number(ally.level) - 1, 0, 2);
    if (ally && (ally.rarity === "Epic Echo" || ally.rarity === "Source-Rare")) return 2;
    if (ally && ally.rarity === "Rare Echo") return 1;
    return 0;
  }

  function makeAlly(q) {
    const lane = courseTypeFor(q.course);
    const family = figureFamilyFor(q, lane);
    const palette = [lane.color, GB.glow, GB.dark];
    const sensitive = isSensitive(q);
    const id = compactKey(`${lane.name}|${family.historicalName}`).slice(0, 80);
    const existing = (state.stats.roster || []).find((item) => item.id === id);
    const stage = sensitive ? 0 : stageForAlly(existing || { level: 1 });
    const stageName = family.names[stage] || family.names[0];
    return {
      id,
      name: sensitive ? "Archive Memory" : stageName,
      actualName: family.historicalName,
      archetype: family.archetype,
      type: lane.name,
      family: family.historicalName,
      familyId: family.id,
      spriteRow: family.row,
      atlas: family.atlas,
      species: stageName,
      level: stage + 1,
      role: sensitive
        ? "A respect-first archive mission. Complete the review trial to preserve context and earn shards."
        : `${family.historicalName} line: ${family.line}`,
      course: q.course || "Social Studies",
      set: q.set || "Review",
      rarity: sensitive ? "Memory Mission" : rarityFor(q),
      moves: movesFor(q, family, lane),
      palette,
      sensitive
    };
  }

  function spritePosition(ally) {
    const family = ally && ally.familyId ? familiesById[ally.familyId] : null;
    const stage = stageForAlly(ally);
    const col = clamp(stage, 0, 2);
    const row = family ? family.row : Number(ally && ally.spriteRow || 0);
    const atlasIndex = family ? family.atlas : Number(ally && ally.atlas || 1);
    return {
      image: `url(${figureAtlasFiles[clamp(atlasIndex - 1, 0, figureAtlasFiles.length - 1)]})`,
      x: `${col * 50}%`,
      y: `${(row % 6) * 20}%`
    };
  }

  function typeEffectOffset(type) {
    const index = Math.max(0, typeOrder.indexOf(type));
    return `${(index % 10) * 11.111}%`;
  }

  function buildNodes() {
    state.nodes = [];
    state.selectedNode = null;
    state.terrain = null;
  }

  function nextQuestion() {
    if (!state.queue.length) state.queue = shuffle(state.filtered);
    return state.queue.pop() || null;
  }

  function filteredForNode() {
    const course = els.courseFilter.value;
    const set = els.setFilter.value;
    let questions = state.bank.questions.filter((q) => {
      if (!isUsableQuestion(q)) return false;
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && q.set !== set) return false;
      return true;
    });
    if (!questions.length) questions = state.filtered.slice();
    return questions;
  }

  function applyFilters() {
    const course = els.courseFilter.value;
    const set = els.setFilter.value;
    state.filtered = state.bank.questions.filter((q) => {
      if (!isUsableQuestion(q)) return false;
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && q.set !== set) return false;
      return true;
    });
    state.queue = shuffle(state.filtered);
    buildNodes();
    updateQuest();
  }

  function updateQuest() {
    const course = els.courseFilter.value;
    const set = els.setFilter.value;
    const label = state.selectedNode ? state.selectedNode.label : (set !== "All Sets" ? set : course);
    const chapter = storyChapters[state.stats.storyStep || 0] || storyChapters[0];
    els.activeRegion.textContent = label || "Open Archive";
    els.questText.textContent = `${chapter} ${state.filtered.length.toLocaleString()} review quests available. Hunt figures in tall grass, then take side quests for XP, shards, and items.`;
  }

  function fillFilters() {
    els.courseFilter.innerHTML = ["All Courses"].concat(state.bank.courses || []).map((course) => `<option>${escapeHtml(course)}</option>`).join("");
    fillSets();
  }

  function fillSets() {
    const course = els.courseFilter.value;
    const sets = course === "All Courses" ? [] : (state.bank.setsByCourse[course] || []);
    els.setFilter.innerHTML = ["All Sets"].concat(sets).map((set) => `<option>${escapeHtml(set)}</option>`).join("");
  }

  function setFeedback(text, cls) {
    els.feedback.textContent = text;
    els.feedback.className = "feedback" + (cls ? " " + cls : "");
  }

  function renderSource(q) {
    // Bug fix: use sourceLock trust pipeline so quarantined/course-mismatched
    // images are blocked. Raw stimulusImagesFor() bypasses those checks.
    const lock = SourceBank && SourceBank.sourceLock
      ? SourceBank.sourceLock(q)
      : { ok: !!(q.stimulusImages && q.stimulusImages.length), images: q.stimulusImages || [] };
    const images = lock.ok ? lock.images : [];
    const text = sourceTextFor(q);
    if (!images.length && !text) {
      els.sourcePanel.hidden = true;
      els.sourcePanel.innerHTML = "";
      return;
    }
    const textBlock = text ? `<p>${escapeHtml(text)}</p>` : "";
    const imageBlock = images.slice(0, 2).map((image, index) => (
      `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(stimulusLabel(q, image, index))}">`
    )).join("");
    els.sourcePanel.innerHTML = `<strong>Source</strong>${textBlock}${imageBlock}`;
    els.sourcePanel.hidden = false;
  }

  function renderAlly(ally) {
    els.allyName.textContent = ally.name;
    els.allyRole.textContent = ally.role;
    els.rarity.textContent = ally.rarity;
    els.portrait.style.setProperty("--ally-a", ally.palette[0]);
    els.portrait.style.setProperty("--ally-b", ally.palette[1]);
    const sprite = spritePosition(ally);
    els.portrait.style.setProperty("--sprite-image", sprite.image);
    els.portrait.style.setProperty("--sprite-x", sprite.x);
    els.portrait.style.setProperty("--sprite-y", sprite.y);
    els.portraitMark.textContent = initials(ally.sensitive ? ally.actualName : ally.name);
    els.moves.innerHTML = ally.moves.map((move) => (
      `<div class="move-chip"><span>${escapeHtml(move.name)}</span><small>${escapeHtml(move.type)}</small></div>`
    )).join("");
  }

  function renderCodex() {
    const availableTypes = state.bank
      ? Array.from(new Set((state.bank.courses || []).map((course) => courseTypeFor(course).name)))
      : typeOrder;
    const families = allFigureFamilies.filter((family) => availableTypes.includes(family.type));
    els.codexFamilies.innerHTML = families.map((family) => {
      const stages = family.names.map((name, stage) => {
        const sprite = {
          image: `url(${figureAtlasFiles[clamp((family.atlas || 1) - 1, 0, figureAtlasFiles.length - 1)]})`,
          x: `${stage * 50}%`,
          y: `${(family.row % 6) * 20}%`
        };
        return `<div class="codex-stage">` +
          `<div class="codex-sprite" style="--sprite-image:${sprite.image};--sprite-x:${sprite.x};--sprite-y:${sprite.y}" role="img" aria-label="${escapeHtml(name)}"></div>` +
          `<em>${escapeHtml(name)}</em>` +
        `</div>`;
      }).join("");
      return `<article class="codex-family" style="--type:${escapeHtml((typeData[family.type] || typeData.Review).color)}">` +
        `<header><strong>${escapeHtml(family.type)} Type</strong><span>${escapeHtml(family.historicalName)}</span></header>` +
        `<p>${escapeHtml(family.line)}</p>` +
        `<div class="codex-evolutions">${stages}</div>` +
      `</article>`;
    }).join("");
  }

  function heroAlly() {
    const roster = state.stats.roster || [];
    const activeIndex = clamp(Number(state.stats.activeAlly || 0), 0, Math.max(0, roster.length - 1));
    const active = roster[activeIndex];
    if (active) {
      return Object.assign({}, active, {
        name: active.actualName || active.name,
        actualName: active.actualName || active.name,
        type: active.type || "Review",
        moves: active.moves && active.moves.length ? active.moves : fallbackMoves,
        palette: active.palette || paletteFor(active.name),
        rosterIndex: activeIndex,
        isPartyMember: true
      });
    }
    const lane = state.currentAlly
      ? (typeData[state.currentAlly.type] ? { name: state.currentAlly.type, move: typeData[state.currentAlly.type].move || "Archive Pulse" } : courseTypeFor(state.currentAlly.course))
      : courseTypeFor(els.courseFilter.value);
    return {
      name: playerTitle(),
      type: lane.name,
      moves: [
        move(lane.move || "Archive Pulse", lane.name, 25, "Starter course-type pressure."),
        move("Source Scan", lane.name, 22, "Reads the evidence trail and finds a weak point."),
        move("Context Check", lane.name, 20, "Adds the missing background before the strike."),
        move("Recall Rush", lane.name, 18, "Fast historical recall pressure.")
      ],
      palette: palettes[0],
      isTrainer: true
    };
  }

  function renderBattle() {
    const battle = state.battle || { heroHp: 100, enemyHp: 100 };
    const hero = heroAlly();
    const enemy = state.currentAlly || { name: "Archive Echo", type: "Review" };
    els.encounter.classList.toggle("has-party-hero", !!hero.isPartyMember);
    els.encounter.classList.toggle("trainer-fallback", !hero.isPartyMember);
    if (hero.isPartyMember) {
      const sprite = spritePosition(hero);
      els.encounter.style.setProperty("--hero-sprite-image", sprite.image);
      els.encounter.style.setProperty("--hero-sprite-x", sprite.x);
      els.encounter.style.setProperty("--hero-sprite-y", sprite.y);
      els.encounter.style.setProperty("--hero-a", (hero.palette || palettes[0])[0]);
      els.encounter.style.setProperty("--hero-b", (hero.palette || palettes[0])[1]);
    }
    els.heroName.textContent = hero.name;
    els.heroType.textContent = hero.type;
    els.enemyName.textContent = enemy.name;
    els.enemyType.textContent = enemy.type || "Review";
    els.heroHp.style.width = `${clamp((battle.heroHp / (state.stats.maxHp || 100)) * 100, 0, 100)}%`;
    els.enemyHp.style.width = `${clamp(battle.enemyHp, 0, 100)}%`;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isCurrentBattle(battle) {
    return state.encounterOpen && state.battle && state.battle === battle;
  }

  function setEncounterPhase(phase) {
    ["intro", "sendout", "command", "move", "item", "party", "windup", "question", "resolve", "faint", "capture"].forEach((name) => {
      els.encounter.classList.toggle(`phase-${name}`, phase === name);
    });
    if (state.battle) state.battle.phase = phase;
  }

  function flashBattleFx(className, duration = 520) {
    // Phase 5 — lite: halve shake animation duration on low-end devices
    const d = (className === "fx-field-shake" && window.MrMacsArcadePerf && window.MrMacsArcadePerf.isLite()) ? Math.round(duration * 0.5) : duration;
    els.encounter.classList.add(className);
    setTimeout(() => els.encounter.classList.remove(className), d);
  }

  function battleAccent(type) {
    return (typeData[type] && typeData[type].color) || GB.glow;
  }

  async function playBattleFx(className, duration = 520, vars) {
    if (!els.encounter) return;
    Object.entries(vars || {}).forEach(([key, value]) => {
      els.encounter.style.setProperty(key, value);
    });
    els.encounter.classList.add(className);
    await wait(duration);
    els.encounter.classList.remove(className);
  }

  async function runHeroMoveBeat(battle, selected, result, ally) {
    const actor = moveActorName();
    const target = opponentFor(ally);
    const color = battleAccent(selected.type);
    setEncounterPhase("windup");
    els.moveButtons.classList.remove("open");
    setBattleLog(`${shout(actor)} readied ${shout(selected.name)}.`);
    await playBattleFx("fx-hero-charge", 360, { "--move-color": color });
    if (!isCurrentBattle(battle)) return false;
    setBattleLog(`${shout(actor)} used ${shout(selected.name)}!`);
    await playBattleFx("fx-hero-attack", 420, { "--move-color": color });
    if (!isCurrentBattle(battle)) return false;
    await playBattleFx("fx-move-shot", 360, { "--move-color": color });
    if (!isCurrentBattle(battle)) return false;
    battle.enemyHp = clamp(battle.enemyHp - result.amount, 0, 100);
    const trustGain = Math.round(8 + result.amount * .28 + (battle.studyBoost ? 8 : 0) + (result.multiplier > 1.2 ? 6 : 0));
    state.capture = clamp(state.capture + trustGain, 0, 100);
    els.captureBar.style.width = `${state.capture}%`;
    renderBattle();
    await playBattleFx("fx-impact", 230, { "--move-color": color });
    if (!isCurrentBattle(battle)) return false;
    flashBattleFx("fx-enemy-hit", 480);
    flashBattleFx("fx-field-shake", 380);
    await showBattleMessage(`${effectSentence(result.multiplier)} ${shout(target)} took ${result.amount} damage.`, 720);
    return isCurrentBattle(battle);
  }

  async function showBattleMessage(text, ms = 800) {
    setBattleLog(text);
    await wait(ms);
  }

  function prepareCommand(message) {
    if (!state.battle) return;
    state.locked = false;
    state.battle.awaitingAnswer = false;
    state.battle.pendingMove = null;
    setEncounterPhase("command");
    clearQuestionArea(message || `What will ${shout(heroAlly().name)} do?`);
    renderBattleActions();
    renderMoveButtons();
    setBattleLog(message || `What will ${shout(heroAlly().name)} do?`);
  }

  function renderBattleActions() {
    if (!els.battleActions) return;
    els.battleActions.classList.remove("answering");
    els.battleActions.innerHTML = [
      ["fight", "Fight", "choose a move"],
      ["item", "Bag", "items"],
      ["party", "Party", "switch ally"],
      ["run", "Run", "leave safely"]
    ].map(([action, label, detail]) => (
      `<button type="button" data-action="${action}" class="${action}"><strong>${label}</strong><small>${detail}</small></button>`
    )).join("");
    Array.prototype.forEach.call(els.battleActions.querySelectorAll("button"), (button) => {
      button.addEventListener("click", () => chooseAction(button.dataset.action));
    });
  }

  async function chooseAction(action) {
    if (!state.battle || state.battle.awaitingAnswer || state.locked) return;
    if (action === "run") {
      state.locked = true;
      setEncounterPhase("resolve");
      setBattleLog("Got away safely. The route stays open.");
      setFeedback("Retreated from the encounter.", "bad");
      setTimeout(closeEncounter, 650);
      return;
    }
    if (action === "item") {
      setEncounterPhase("item");
      renderBattleItems();
      els.moveButtons.classList.add("open");
      setBattleLog("Open the field bag. Items use your turn.");
      return;
    }
    if (action === "party") {
      setEncounterPhase("party");
      renderBattleParty();
      els.moveButtons.classList.add("open");
      setBattleLog("Choose a Chronicle Ally to send out.");
      return;
    }
    setEncounterPhase("move");
    renderMoveButtons();
    els.moveButtons.classList.add("open");
    setBattleLog(`Choose a move for ${shout(heroAlly().name)}.`);
  }

  function renderBattleItems() {
    const items = [
      ["fieldNote", "Field Notes", `x${state.stats.items.fieldNote || 0}`, "next move + trust"],
      ["capsule", "Archive Capsule", `x${state.stats.items.capsule || 0}`, "try to recruit"],
      ["healKit", "Restoration Tea", `x${state.stats.items.healKit || 0}`, "restore 35 HP"],
      ["treatyPass", "Treaty Pass", `x${state.stats.items.treatyPass || 0}`, "safe exit"]
    ];
    els.moveButtons.classList.remove("answering", "open");
    els.moveButtons.innerHTML = items.map(([id, label, count, detail]) => (
      `<button type="button" data-item="${id}"${Number(state.stats.items[id] || 0) <= 0 ? " disabled" : ""}>` +
        `<strong>${escapeHtml(label)} ${escapeHtml(count)}</strong>` +
        `<small>${escapeHtml(detail)}</small>` +
      `</button>`
    )).join("");
    Array.prototype.forEach.call(els.moveButtons.querySelectorAll("button[data-item]"), (button) => {
      button.addEventListener("click", () => chooseBattleItem(button.dataset.item));
    });
  }

  function renderBattleParty() {
    const roster = state.stats.roster || [];
    els.moveButtons.classList.remove("answering", "open");
    if (!roster.length) {
      els.moveButtons.innerHTML = `<button type="button" data-party="-1"><strong>No Allies Yet</strong><small>back to commands</small></button>`;
    } else {
      const activeIndex = clamp(Number(state.stats.activeAlly || 0), 0, Math.max(0, roster.length - 1));
      els.moveButtons.innerHTML = roster.slice(0, 6).map((ally, index) => {
        const data = typeData[ally.type] || typeData.Review;
        const active = index === activeIndex ? " / active" : "";
        return `<button type="button" data-party="${index}" style="--type:${data.color};--effect-y:${typeEffectOffset(ally.type)}">` +
          `<strong>${escapeHtml(ally.actualName || ally.name)}${active}</strong>` +
          `<small>${escapeHtml(ally.type || "Review")} / stage ${escapeHtml(String(ally.level || 1))}</small>` +
        `</button>`;
      }).join("");
    }
    Array.prototype.forEach.call(els.moveButtons.querySelectorAll("button[data-party]"), (button) => {
      button.addEventListener("click", () => choosePartyAlly(Number(button.dataset.party)));
    });
  }

  function renderMoveButtons() {
    const hero = heroAlly();
    els.moveButtons.classList.remove("answering", "open");
    els.moveButtons.innerHTML = hero.moves.map((item, index) => {
      const data = typeData[item.type] || typeData.Review;
      return `<button type="button" data-move="${index}" style="--type:${data.color};--effect-y:${typeEffectOffset(item.type)}">` +
        `<strong>${escapeHtml(item.name)}</strong>` +
        `<small>${escapeHtml(item.type)} / ${item.power} power</small>` +
      `</button>`;
    }).join("");
    Array.prototype.forEach.call(els.moveButtons.querySelectorAll("button"), (button) => {
      button.addEventListener("click", () => chooseMove(Number(button.dataset.move)));
    });
  }

  function setBattleLog(text) {
    els.battleLog.textContent = text;
  }

  async function enemyCounterTurn(reason) {
    const battle = state.battle;
    const ally = state.currentAlly;
    if (!battle || !ally || battle.enemyHp <= 0) return;
    state.locked = true;
    const hero = heroAlly();
    const counterMove = opponentMoveFor(ally);
    const enemyLevel = Math.max(1, Number(ally.level || 1));
    const result = attackDamage({ name: counterMove, type: ally.type, power: reason === "switch" ? 14 : reason === "parley" ? 13 : 17 }, ally.type, hero.type, enemyLevel, false);
    setEncounterPhase("resolve");
    await showBattleMessage(`${shout(opponentFor(ally))} steadied itself.`, 360);
    if (!isCurrentBattle(battle)) return;
    await playBattleFx("fx-enemy-charge", 330, { "--move-color": battleAccent(ally.type) });
    if (!isCurrentBattle(battle)) return;
    await showBattleMessage(`${shout(opponentFor(ally))} used ${shout(counterMove)} against ${shout(hero.name)}!`, 520);
    if (!isCurrentBattle(battle)) return;
    await playBattleFx("fx-enemy-shot", 360, { "--move-color": battleAccent(ally.type) });
    if (!isCurrentBattle(battle)) return;
    battle.heroHp = clamp(battle.heroHp - result.amount, 0, state.stats.maxHp || 100);
    state.stats.playerHp = battle.heroHp;
    renderBattle();
    flashBattleFx("fx-field-shake", 380);
    await playBattleFx("fx-hero-impact", 220, { "--move-color": battleAccent(ally.type) });
    if (!isCurrentBattle(battle)) return;
    flashBattleFx("fx-hero-hit", 520);
    await showBattleMessage(`${effectSentence(result.multiplier)} ${shout(hero.name)} lost ${result.amount} HP.`, 720);
    if (!isCurrentBattle(battle)) return;
    updateHud();
    writeSave();
    if (battle.heroHp <= 0) {
      retreatEncounter();
    }
  }

  async function parleyTurn() {
    const battle = state.battle;
    const ally = state.currentAlly;
    if (!battle || !ally) return;
    state.locked = true;
    setEncounterPhase("resolve");
    flashBattleFx("fx-study", 650);
    const trust = ally.sensitive ? 18 : 12 + Math.floor(Math.random() * 9);
    state.capture = clamp(state.capture + trust, 0, 100);
    els.captureBar.style.width = `${state.capture}%`;
    await showBattleMessage(loreLineFor(ally, "parley"), 1150);
    if (!isCurrentBattle(battle)) return;
    await showBattleMessage(`Trust rose to ${state.capture}%.`, 600);
    if (!isCurrentBattle(battle)) return;
    if (Math.random() < .62 && battle.enemyHp > 0) {
      await enemyCounterTurn("parley");
      if (!isCurrentBattle(battle) || battle.heroHp <= 0) return;
    }
    prepareCommand(`What will ${shout(heroAlly().name)} do?`);
  }

  async function chooseBattleItem(id) {
    if (!state.battle || state.locked) return;
    const battle = state.battle;
    const ally = state.currentAlly;
    if (!id || !state.stats.items[id]) {
      setBattleLog("That pocket is empty.");
      return;
    }
    els.bagPanel.classList.remove("show");
    state.locked = true;
    setEncounterPhase("windup");
    els.moveButtons.classList.remove("open");
    if (id === "fieldNote") {
      spendItem(id);
      battle.studyBoost = true;
      state.capture = clamp(state.capture + 12, 0, 100);
      els.captureBar.style.width = `${state.capture}%`;
      flashBattleFx("fx-study", 700);
      await showBattleMessage("Field Notes opened. Your next move gets a research boost.", 760);
      if (!isCurrentBattle(battle)) return;
      prepareCommand(`Trust rose to ${state.capture}%.`);
      return;
    }
    if (id === "healKit") {
      spendItem(id);
      healParty(35);
      flashBattleFx("fx-study", 600);
      await showBattleMessage("Restoration Tea restored 35 HP.", 700);
      if (!isCurrentBattle(battle)) return;
      await enemyCounterTurn("item");
      if (!isCurrentBattle(battle) || battle.heroHp <= 0) return;
      prepareCommand(`What will ${shout(heroAlly().name)} do?`);
      return;
    }
    if (id === "treatyPass") {
      spendItem(id);
      await showBattleMessage("Treaty Pass used. You withdrew safely and kept your streak.", 700);
      if (isCurrentBattle(battle)) closeEncounter();
      return;
    }
    if (id === "capsule") {
      spendItem(id);
      const missingHp = 100 - clamp(battle.enemyHp, 0, 100);
      const baseChance = 18 + missingHp * .48 + state.capture * .44 + (battle.studyBoost ? 9 : 0);
      const chance = ally && ally.sensitive ? 0 : clamp(baseChance, 12, 92);
      flashBattleFx("fx-capsule", 900);
      await showBattleMessage(`${shout(playerTitle())} threw an ARCHIVE CAPSULE!`, 680);
      if (!isCurrentBattle(battle)) return;
      await showBattleMessage("Shake... shake...", 760);
      if (!isCurrentBattle(battle)) return;
      if (Math.random() * 100 <= chance) {
        state.capture = 100;
        els.captureBar.style.width = "100%";
        setEncounterPhase("capture");
        await showBattleMessage(`${shout(ally.actualName || ally.name)} joined the Chronicle Roster!`, 880);
        if (isCurrentBattle(battle)) completeEncounter("capture");
        return;
      }
      state.capture = clamp(state.capture + 8, 0, 100);
      els.captureBar.style.width = `${state.capture}%`;
      await showBattleMessage(`${shout(ally.name)} broke free! It is watching you more closely.`, 760);
      if (!isCurrentBattle(battle)) return;
      await enemyCounterTurn("item");
      if (!isCurrentBattle(battle) || battle.heroHp <= 0) return;
      battle.studyBoost = false;
      prepareCommand(`Capture chance improves after damage, Field Notes, and low HP. Trust: ${state.capture}%.`);
    }
  }

  async function choosePartyAlly(index) {
    const battle = state.battle;
    const roster = state.stats.roster || [];
    if (!battle || state.locked) return;
    if (!roster.length || index < 0 || !roster[index]) {
      prepareCommand(`No Chronicle Allies are ready yet. ${shout(playerTitle())} stays in.`);
      return;
    }
    const current = clamp(Number(state.stats.activeAlly || 0), 0, Math.max(0, roster.length - 1));
    const selected = roster[index];
    if (index === current) {
      prepareCommand(`${shout(selected.actualName || selected.name)} is already out front.`);
      return;
    }
    state.locked = true;
    setEncounterPhase("resolve");
    const previous = roster[current];
    renderBattle();
    await showBattleMessage(`Come back, ${shout(previous.actualName || previous.name)}!`, 560);
    if (!isCurrentBattle(battle)) return;
    state.stats.activeAlly = index;
    writeSave();
    renderBattle();
    setEncounterPhase("sendout");
    flashBattleFx("fx-sendout", 700);
    await showBattleMessage(`${shout(playerTitle())} sent out ${shout(selected.actualName || selected.name)}!`, 700);
    if (!isCurrentBattle(battle)) return;
    await enemyCounterTurn("switch");
    if (!isCurrentBattle(battle) || battle.heroHp <= 0) return;
    prepareCommand(`What will ${shout(heroAlly().name)} do?`);
  }

  function initials(name) {
    const words = cleanText(name).split(/\s+/).filter(Boolean);
    return (words[0] && words[1] ? words[0][0] + words[1][0] : (words[0] || "HH").slice(0, 2)).toUpperCase();
  }

  function renderQuestion(q) {
    state.currentQuestion = q;
    state.locked = false;
    setEncounterPhase("question");
    els.encounter.classList.add("answering");
    if (state.battle) state.battle.awaitingAnswer = true;
    els.moveButtons.classList.add("answering");
    if (els.battleActions) els.battleActions.classList.add("answering");
    els.questionText.style.display = "block";
    els.questionText.textContent = displayPrompt(q);
    els.trialMeta.textContent = `${cleanText(q.course || "Social Studies")} / ${cleanText(q.set || "Review")}`;
    els.trialKicker.textContent = state.questActive
      ? "Side Quest Contract"
      : state.currentAlly && state.currentAlly.sensitive ? "Archive Mission" : "Route Battle";
    if (state.questActive) {
      setBattleLog(state.questActive.log || "Complete the checkpoint to earn XP, shards, and field items.");
      state.capture = 0;
    }
    renderSource(q);
    setFeedback("", "");
    els.captureBar.style.width = `${state.capture}%`;
    els.choices.innerHTML = "";
    els.typedAnswer.value = "";
    if (q.type === "mcq" && q.choices && q.choices.length) {
      els.typedForm.style.display = "none";
      els.choices.style.display = "grid";
      els.choices.innerHTML = q.choices.map((choice) => (
        `<button type="button" data-choice="${escapeHtml(choice.label)}"><strong>${escapeHtml(choice.label)}.</strong> ${escapeHtml(choice.text)}</button>`
      )).join("");
      Array.prototype.forEach.call(els.choices.querySelectorAll("button"), (button) => {
        button.addEventListener("click", () => submitAnswer(button.dataset.choice));
      });
    } else {
      els.choices.style.display = "none";
      els.typedForm.style.display = "grid";
      setTimeout(() => els.typedAnswer.focus({ preventScroll: true }), 50);
    }
    if (innerHeight < 760 || innerWidth < 740) {
      setTimeout(() => els.questionText.scrollIntoView({ block: "center", inline: "nearest" }), 40);
    }
  }

  function clearQuestionArea(message) {
    state.currentQuestion = null;
    els.encounter.classList.remove("answering");
    els.moveButtons.classList.remove("answering", "open");
    if (els.battleActions) els.battleActions.classList.remove("answering");
    els.questionText.textContent = message;
    els.questionText.style.display = "none";
    els.choices.innerHTML = "";
    els.choices.style.display = "none";
    els.typedForm.style.display = "none";
    els.sourcePanel.hidden = true;
    els.sourcePanel.innerHTML = "";
  }

  async function runBattleIntro(battle, ally) {
    state.locked = true;
    setEncounterPhase("intro");
    clearQuestionArea("");
    await showBattleMessage(`Wild ${shout(ally.name)} appeared!`, 900);
    if (!isCurrentBattle(battle)) return;
    await showBattleMessage(loreLineFor(ally, "intro"), 1150);
    if (!isCurrentBattle(battle)) return;
    setEncounterPhase("sendout");
    flashBattleFx("fx-sendout", 780);
    const hero = heroAlly();
    if (hero.isPartyMember) {
      await showBattleMessage(`${shout(playerTitle())} sent out ${shout(hero.name)}!`, 820);
    } else {
      await showBattleMessage(`${shout(playerTitle())} has no roster ally yet and steps in personally.`, 900);
    }
    if (!isCurrentBattle(battle)) return;
    prepareCommand(`What will ${shout(heroAlly().name)} do?`);
  }

  function openEncounter() {
    const pool = filteredForNode();
    if (!pool.length) return;
    ensureStarterAlly(courseTypeFor(els.courseFilter.value).name);
    if ((state.stats.playerHp || 0) <= 0) {
      setDialogue("Party Health", "Party Exhausted", "Visit the Chronicle Center or use Restoration Tea before starting another battle.", [
        { action: "close", label: "Close" }
      ]);
      return;
    }
    els.encounter.classList.remove("answering");
    state.queue = shuffle(pool);
    const q = nextQuestion();
    const ally = makeAlly(q);
    state.currentAlly = ally;
    state.currentQuestion = null;
    state.questActive = null;
    state.battle = { heroHp: state.stats.playerHp || state.stats.maxHp || 100, enemyHp: 100, pendingMove: null, awaitingAnswer: false, phase: "intro" };
    state.capture = 0;
    state.trial = 0;
    state.encounterOpen = true;
    els.encounter.classList.remove("quest-mode");
    document.body.classList.add("encounter-open");
    document.body.classList.remove("menu-open");
    renderAlly(ally);
    renderBattle();
    renderBattleActions();
    renderMoveButtons();
    els.trialKicker.textContent = "Route Battle";
    els.trialMeta.textContent = `${cleanText(ally.course || "Social Studies")} / ${cleanText(ally.type || "Review")} type`;
    els.captureBar.style.width = "0%";
    els.encounter.hidden = false;
    els.encounter.classList.add("pulse");
    setTimeout(() => els.encounter.classList.remove("pulse"), 650);
    clearQuestionArea("");
    runBattleIntro(state.battle, ally);
  }

  function closeEncounter() {
    state.encounterOpen = false;
    state.questActive = null;
    state.locked = false;
    state.battle = null;
    state.wildCooldown = 4;
    els.encounter.classList.remove("answering");
    els.encounter.classList.remove("quest-mode");
    setEncounterPhase("");
    document.body.classList.remove("encounter-open");
    els.encounter.hidden = true;
  }

  function questRewardFor(q) {
    const sourceHeavy = !!(q && (q.stimulusRequired || stimulusImagesFor(q).length || sourceTextFor(q)));
    const value = Number(q && q.value || 200);
    return {
      xp: sourceHeavy ? 34 : 24 + Math.min(16, Math.round(value / 60)),
      shards: sourceHeavy ? 34 : 20 + Math.min(18, Math.round(value / 40)),
      item: sourceHeavy ? "sourceLens" : Math.random() < .45 ? "fieldNote" : "capsule"
    };
  }

  function openReviewQuest(origin) {
    const pool = filteredForNode();
    const questPool = pool.filter((q) => q && q.prompt && q.answer);
    const q = shuffle(questPool)[0] || nextQuestion();
    if (!q) {
      setDialogue("Side Quest", "No Quests", "No review quests are available for the current course filter.", [
        { action: "close", label: "Close" }
      ]);
      return;
    }
    const reward = questRewardFor(q);
    state.questActive = {
      origin: origin || "Route Contract",
      q,
      reward,
      log: `Side quest: clear this ${cleanText(q.course || "social studies")} checkpoint for ${reward.xp} XP, ${reward.shards} shards, and a field item.`
    };
    state.battle = null;
    state.currentAlly = makeAlly(q);
    state.currentQuestion = q;
    state.capture = 0;
    state.trial = 0;
    state.encounterOpen = true;
    state.locked = false;
    document.body.classList.add("encounter-open");
    document.body.classList.remove("menu-open");
    els.encounter.classList.add("quest-mode");
    renderAlly(state.currentAlly);
    renderBattle();
    renderBattleActions();
    renderMoveButtons();
    els.encounter.hidden = false;
    renderQuestion(q);
  }

  async function chooseMove(index) {
    if (!state.battle || state.battle.awaitingAnswer || state.locked) return;
    const hero = heroAlly();
    const selected = hero.moves[index] || hero.moves[0] || fallbackMoves[0];
    const battle = state.battle;
    const ally = state.currentAlly || { type: "Review", name: "Archive Echo" };
    state.locked = true;
    state.battle.pendingMove = selected;
    const result = attackDamage(selected, selected.type, ally.type || "Review", state.stats.rank || 1, battle.studyBoost);
    const moveLanded = await runHeroMoveBeat(battle, selected, result, ally);
    if (!moveLanded) return;
    battle.studyBoost = false;
    battle.pendingMove = null;
    if (battle.enemyHp <= 0) {
      if (window.MrMacsProfile) window.MrMacsProfile.addShards(10, "history-hunters");
      setEncounterPhase("faint");
      await playBattleFx("fx-faint", 720, { "--move-color": battleAccent(selected.type) });
      if (!isCurrentBattle(battle)) return;
      await showBattleMessage(`${shout(opponentFor(ally))} fainted!`, 680);
      await playBattleFx("fx-victory", 520, { "--move-color": battleAccent(hero.type) });
      if (isCurrentBattle(battle)) completeEncounter("defeat");
      return;
    }
    if (state.capture >= 100) {
      setEncounterPhase("capture");
      await playBattleFx("fx-victory", 520, { "--move-color": battleAccent(hero.type) });
      if (!isCurrentBattle(battle)) return;
      await showBattleMessage(`${shout(ally.actualName || ally.name)} trusts your team and joins the roster!`, 780);
      if (isCurrentBattle(battle)) completeEncounter("capture");
      return;
    }
    await enemyCounterTurn("attack");
    if (!isCurrentBattle(battle) || battle.heroHp <= 0) return;
    prepareCommand(`${ally.name} is still in the fight. Trust: ${state.capture}%.`);
  }

  function checkAnswer(q, raw) {
    if (q.type === "mcq") return String(raw) === String(q.correct);
    return typedMatches(raw, [q.answer].concat(q.aliases || []));
  }

  async function submitQuestAnswer(raw) {
    if (state.locked) return;
    const quest = state.questActive;
    const q = quest && quest.q || state.currentQuestion;
    if (!quest || !q) return;
    state.locked = true;
    const correct = checkAnswer(q, raw);
    // recordAnswer hook (Phase 1)
    if (window.MrMacsProfile) window.MrMacsProfile.recordAnswer({ course: q.course || "Unknown", set: q.set || q.unit || "Field Battle", correct, prompt: q.prompt || q.stem, answer: q.answer, gameId: "history-hunters" });
    const expected = answerLabel(q);
    els.choices.style.display = "none";
    els.typedForm.style.display = "none";
    setEncounterPhase("resolve");
    if (correct) {
      const reward = quest.reward || questRewardFor(q);
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak || 0, state.stats.streak);
      state.stats.missions += 1;
      state.stats.shards += reward.shards;
      state.stats.items[reward.item] = Number(state.stats.items[reward.item] || 0) + 1;
      addXp(reward.xp);
      setFeedback(`Correct. +${reward.xp} XP, +${reward.shards} shards, +1 ${itemCatalog[reward.item].label}. ${q.explanation || ""}`, "good");
      setBattleLog(`Contract clear! ${itemCatalog[reward.item].label} added to your bag.`);
      flashBattleFx("fx-study", 750);
    } else {
      state.stats.streak = 0;
      const consolation = 6;
      state.stats.shards += consolation;
      setFeedback(`Not quite. Answer: ${expected}. ${q.explanation || ""}`, "bad");
      setBattleLog(`Quest logged for retry. You still found ${consolation} shards while studying the route.`);
    }
    writeSave();
    updateHud();
    renderBag();
    await wait(correct ? 1450 : 2200);
    if (state.questActive === quest) closeEncounter();
  }

  async function submitAnswer(raw) {
    if (state.locked) return;
    if (state.questActive) {
      await submitQuestAnswer(raw);
      return;
    }
    const q = state.currentQuestion;
    const ally = state.currentAlly;
    const battle = state.battle;
    if (!q || !ally || !battle || !battle.pendingMove) return;
    state.locked = true;
    const correct = checkAnswer(q, raw);
    // recordAnswer hook (Phase 1)
    if (window.MrMacsProfile) window.MrMacsProfile.recordAnswer({ course: q.course || (ally && ally.course) || "Unknown", set: q.set || q.unit || (ally && ally.set) || "Field Battle", correct, prompt: q.prompt || q.stem, answer: q.answer, gameId: "history-hunters" });
    state.trial += 1;
    const expected = answerLabel(q);
    const moveUsed = battle.pendingMove;
    const multiplier = typeEffect(moveUsed.type, ally.type || "Review");
    const actor = moveActorName();
    const target = opponentFor(ally);
    els.choices.style.display = "none";
    els.typedForm.style.display = "none";
    els.encounter.classList.remove("answering");
    setEncounterPhase("resolve");
    if (correct) {
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak || 0, state.stats.streak);
      const studyBonus = battle.studyBoost ? 10 : 0;
      const damage = Math.round((moveUsed.power || 22) * multiplier + Math.min(14, state.stats.streak * 2) + studyBonus);
      battle.enemyHp = clamp(battle.enemyHp - damage, 0, 100);
      const fainted = battle.enemyHp <= 0;
      const gain = (moveUsed.captureBoost ? 46 : q.stimulusRequired ? 34 : 27);
      state.capture = clamp(state.capture + gain + Math.min(13, state.stats.streak) + (multiplier > 1 ? 8 : 0) + (battle.studyBoost ? 8 : 0), 0, 100);
      state.stats.shards += 12 + Math.min(18, state.stats.streak * 2);
      addXp(18 + Math.round(damage / 3));
      battle.heroHp = state.stats.playerHp;
      state.pulse = 1;
      burst(state.player.x, state.player.y, ally.palette[0], 22);
      if (moveUsed.captureBoost) {
        setBattleLog("Correct!");
        setFeedback(`Correct. ${q.explanation || "That answer strengthens the bond."}`, "good");
        flashBattleFx("fx-capsule", 900);
        await wait(650);
        if (!isCurrentBattle(battle)) return;
        setBattleLog(`ARCHIVE CAPSULE clicked shut! Trust rose to ${state.capture}%.`);
      } else {
        setBattleLog("Correct!");
        setFeedback(`Correct. ${q.explanation || "That answer strengthens the bond."}`, "good");
        await wait(520);
        if (!isCurrentBattle(battle)) return;
        flashBattleFx("fx-enemy-hit", 620);
        setBattleLog(`${shout(actor)}'s ${shout(moveUsed.name)} hit ${target}!`);
        renderBattle();
        await wait(820);
        if (!isCurrentBattle(battle)) return;
        if (fainted) setBattleLog(`${shout(target)} fainted!`);
        else setBattleLog(`${effectSentence(multiplier)} Trust rose to ${state.capture}%.`);
      }
    } else {
      state.stats.streak = 0;
      const counter = ally.sensitive ? 12 : 16 + Math.floor(Math.random() * 10);
      battle.heroHp = clamp(battle.heroHp - counter, 0, state.stats.maxHp || 100);
      state.stats.playerHp = battle.heroHp;
      state.capture = clamp(state.capture - (moveUsed.captureBoost ? 16 : 10), 0, 100);
      burst(state.player.x, state.player.y, "#ff789d", 12);
      setBattleLog("Not quite!");
      setFeedback(`Not quite. Answer: ${expected}. ${q.explanation || ""}`, "bad");
      await wait(1050);
      if (!isCurrentBattle(battle)) return;
      flashBattleFx("fx-hero-hit", 620);
      setBattleLog(moveUsed.captureBoost ? `${ally.name} broke out and countered for ${counter}.` : `${shout(target)} countered for ${counter}.`);
      renderBattle();
      await wait(860);
      if (!isCurrentBattle(battle)) return;
    }
    battle.pendingMove = null;
    battle.awaitingAnswer = false;
    battle.studyBoost = false;
    state.stats.playerHp = battle.heroHp;
    els.captureBar.style.width = `${state.capture}%`;
    renderBattle();
    updateHud();
    writeSave();
    if (state.capture >= 100 || battle.enemyHp <= 0) {
      setEncounterPhase(battle.enemyHp <= 0 ? "faint" : "capture");
      await wait(760);
      if (isCurrentBattle(battle)) completeEncounter();
      return;
    }
    if (battle.heroHp <= 0) {
      await wait(500);
      if (isCurrentBattle(battle)) retreatEncounter();
      return;
    }
    await wait(correct ? 760 : 420);
    if (!isCurrentBattle(battle)) return;
    state.currentQuestion = nextQuestion() || nextQuestion();
    prepareCommand(`${ally.name} is watching carefully. Capture trust: ${state.capture}%.`);
  }

  function retreatEncounter() {
    state.stats.streak = 0;
    state.stats.playerHp = Math.max(0, state.battle ? state.battle.heroHp : state.stats.playerHp);
    writeSave();
    updateHud();
    setFeedback("Retreat. Visit Chronicle Center or use Restoration Tea if HP is low.", "bad");
    setBattleLog("The field team needs a reset at Chronicle Center.");
    setTimeout(closeEncounter, 1500);
  }

  function completeEncounter() {
    const ally = state.currentAlly;
    if (!ally) return;
    if (ally.sensitive) {
      state.stats.missions += 1;
      state.stats.shards += 45;
      addXp(45);
      setFeedback(`Archive mission complete: ${ally.actualName}. Context preserved. +45 shards.`, "done");
      setBattleLog("Archive memory preserved. Context restored without turning harm into a trophy.");
    } else {
      const exists = state.stats.roster.some((item) => item.id === ally.id);
      if (!exists) {
        state.stats.roster.unshift({
          id: ally.id,
          name: ally.name,
          actualName: ally.actualName,
          archetype: ally.archetype,
          type: ally.type,
          family: ally.family,
          familyId: ally.familyId,
          species: ally.species,
          spriteRow: ally.spriteRow,
          atlas: ally.atlas,
          course: ally.course,
          set: ally.set,
          rarity: ally.rarity,
          moves: ally.moves,
          palette: ally.palette,
          level: 1
        });
        state.stats.activeAlly = 0;
        state.stats.roster = state.stats.roster.slice(0, 96);
        state.stats.shards += 40;
        addXp(60);
        setFeedback(`${ally.name} joined your party. +40 shards.`, "done");
        setBattleLog(loreLineFor(ally, "victory") + ` ${ally.actualName} joined your roster.`);
      } else {
        const rosterAlly = state.stats.roster.find((item) => item.id === ally.id);
        if (rosterAlly) {
          rosterAlly.level = Math.min(3, Number(rosterAlly.level || 1) + 1);
          const family = familiesById[rosterAlly.familyId] || familiesById[ally.familyId];
          if (family) {
            rosterAlly.name = family.names[stageForAlly(rosterAlly)] || rosterAlly.name;
            rosterAlly.species = rosterAlly.name;
            rosterAlly.moves = ally.moves;
          }
        }
        state.stats.shards += 35;
        addXp(45);
        setFeedback(`${rosterAlly ? rosterAlly.name : ally.name} evolved to stage ${rosterAlly ? rosterAlly.level : 2}. +35 shards.`, "done");
        setBattleLog(`${ally.actualName} leveled up through the timeline. Evolution recorded.`);
      }
    }
    state.stats.rank = Math.max(state.stats.rank || 1, 1 + Math.floor((state.stats.roster.length + state.stats.missions) / 5));
    writeSave();
    updateHud();
    renderRoster();
    if (window.MrMacsProfile) {
      window.MrMacsProfile.addShards(50, "history-hunters");
      window.MrMacsProfile.unlock("hh-first-catch");
      try {
        var roster = (state && state.stats && state.stats.roster) || [];
        if (roster.length >= 6) window.MrMacsProfile.unlock("hh-roster-6");
      } catch (e) {}
      try {
        if (state.currentAlly && state.currentAlly.isRare) window.MrMacsProfile.unlock("hh-rare");
      } catch (e) {}
    }
    if (window.MrMacsProgress && typeof window.MrMacsProgress.recordEvent === "function") {
      window.MrMacsProgress.recordEvent("game_complete", {
        gameId: "history-hunters",
        title: "History Hunters",
        score: state.stats.shards,
        allies: state.stats.roster.length,
        course: els.courseFilter.value
      });
    }
    setTimeout(closeEncounter, 1700);
  }

  function renderRoster() {
    const roster = state.stats.roster || [];
    if (!roster.length) {
      els.rosterList.innerHTML = `<div class="roster-empty">No allies yet. Win a figure battle, lower HP, build trust, and use an Archive Capsule to recruit your first Chronicle Ally.</div>`;
      return;
    }
    const activeIndex = clamp(Number(state.stats.activeAlly || 0), 0, Math.max(0, roster.length - 1));
    els.rosterList.innerHTML = roster.map((ally, index) => {
      const palette = ally.palette || paletteFor(ally.name);
      const sprite = spritePosition(ally);
      const family = familiesById[ally.familyId] || figureFamilyFor({ course: ally.course, answer: ally.name }, courseTypeFor(ally.course));
      const species = ally.species || family.names[stageForAlly(ally)] || family.names[0];
      return `<div class="roster-item${index === activeIndex ? " active" : ""}">` +
        `<div class="mini-portrait" style="--sprite-image:${escapeHtml(sprite.image)};--sprite-x:${escapeHtml(sprite.x)};--sprite-y:${escapeHtml(sprite.y)};--ally-a:${escapeHtml(palette[0])};--ally-b:${escapeHtml(palette[1])}" role="img" aria-label="${escapeHtml(species)}"></div>` +
        `<div><strong>${escapeHtml(ally.name)}</strong><span>${escapeHtml(ally.type || "Review")} type / ${escapeHtml(family.historicalName || species)} line / Stage ${escapeHtml(String(ally.level || 1))} / ${escapeHtml(ally.course)}</span></div>` +
        `<em>${index === activeIndex ? "Active" : escapeHtml(ally.rarity)}</em>` +
      `</div>`;
    }).join("");
  }

  function updateHud() {
    els.level.textContent = state.stats.rank || 1;
    if (els.partyHp) els.partyHp.textContent = `${Math.round(state.stats.playerHp || 0)}/${Math.round(state.stats.maxHp || 100)}`;
    els.rosterCount.textContent = (state.stats.roster || []).length;
    els.shards.textContent = state.stats.shards || 0;
    els.streak.textContent = state.stats.streak || 0;
    if (els.actionBtn) {
      const near = state.nearInteraction;
      els.actionBtn.textContent = near ? (near.interactionType === "place" ? "Enter" : "Talk") : "Talk";
    }
  }

  function burst(x, y, color, count) {
    // Phase 5 — lite: shorten particle lifespan on low-end devices
    const liteMode = window.MrMacsArcadePerf && window.MrMacsArcadePerf.isLite();
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - .5) * 360,
        vy: (Math.random() - .5) * 360,
        life: liteMode ? (.28 + Math.random() * .22) : (.55 + Math.random() * .45),
        max: 1,
        color
      });
    }
  }

  function loadImage(name, src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        images[name] = image;
        resolve(image);
      };
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function resize() {
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    els.canvas.width = Math.floor(innerWidth * scale);
    els.canvas.height = Math.floor(innerHeight * scale);
    els.canvas.style.width = innerWidth + "px";
    els.canvas.style.height = innerHeight + "px";
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function canvasPoint(event) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left + state.camera.x,
      y: event.clientY - rect.top + state.camera.y
    };
  }

  function nearestNode(point) {
    let best = null;
    let bestDist = Infinity;
    state.nodes.forEach((node) => {
      const d = Math.hypot(node.x - point.x, node.y - point.y);
      if (d < bestDist) {
        best = node;
        bestDist = d;
      }
    });
    return bestDist < 145 ? best : null;
  }

  function isTallGrass(x, y) {
    return tallGrassZones.some(([gx, gy, gw, gh]) => x >= gx && x <= gx + gw && y >= gy && y <= gy + gh);
  }

  function facingVector() {
    const facing = state.player.facing || "down";
    if (facing === "up") return { x: 0, y: -1 };
    if (facing === "down") return { x: 0, y: 1 };
    if (facing === "left") return { x: -1, y: 0 };
    return { x: 1, y: 0 };
  }

  function facingPoint(distance = 86) {
    const vec = facingVector();
    return {
      x: state.player.x + vec.x * distance,
      y: state.player.y + vec.y * distance
    };
  }

  function placeRect(place, pad = 0) {
    const wide = place && place.kind === "shop" ? 104 : 142;
    const tall = place && place.kind === "shop" ? 104 : 132;
    return {
      x: (place ? place.x : 0) - wide / 2 - pad,
      y: (place ? place.y : 0) - tall / 2 - pad,
      w: wide + pad * 2,
      h: tall + pad * 2
    };
  }

  function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function canWalkTo(x, y) {
    const feet = { x, y: y + 22 };
    if (x < 96 || y < 96 || x > WORLD_W - 96 || y > WORLD_H - 96) return false;
    if (x > WORLD_W - 230 || (y > WORLD_H - 180 && x > 1120) || (x < 145 && y > 900)) return false;
    return !worldPlaces.some((place) => pointInRect(feet, placeRect(place, 18)));
  }

  function allInteractions() {
    return worldPlaces.map((place) => Object.assign({ interactionType: "place" }, place))
      .concat(npcs.map((npc) => Object.assign({ interactionType: "npc" }, npc)));
  }

  function interactionInFront() {
    const look = facingPoint(92);
    const place = worldPlaces.find((item) => pointInRect(look, placeRect(item, 34)));
    if (place) return Object.assign({ interactionType: "place" }, place);
    let best = null;
    let bestDist = Infinity;
    npcs.forEach((npc) => {
      const d = Math.hypot(npc.x - look.x, npc.y - look.y);
      if (d < bestDist) {
        best = npc;
        bestDist = d;
      }
    });
    return bestDist <= 104 && best ? Object.assign({ interactionType: "npc" }, best) : null;
  }

  function nearestInteraction(point, radius = 150) {
    let best = null;
    let bestDist = Infinity;
    allInteractions().forEach((item) => {
      const d = Math.hypot(item.x - point.x, item.y - point.y);
      if (d < bestDist) {
        best = item;
        bestDist = d;
      }
    });
    return bestDist <= radius ? best : null;
  }

  function setDialogue(kicker, title, text, actions) {
    els.dialogueKicker.textContent = kicker;
    els.dialogueTitle.textContent = title;
    els.dialogueText.textContent = text;
    els.dialogueActions.innerHTML = (actions || []).map((action) => (
      `<button type="button" data-action="${escapeHtml(action.action)}" data-item="${escapeHtml(action.item || "")}">${escapeHtml(action.label)}</button>`
    )).join("");
    Array.prototype.forEach.call(els.dialogueActions.querySelectorAll("button"), (button) => {
      button.addEventListener("click", () => handleDialogueAction(button.dataset.action, button.dataset.item));
    });
    els.dialoguePanel.hidden = false;
  }

  function openInteraction(item) {
    const target = item || state.nearInteraction || nearestInteraction(state.player);
    if (!target) {
      setDialogue("Field", "Open Route", "Tap a building, NPC, or route marker to interact. Tall grass starts wild figure battles; towns and NPCs post review quests.", [
        { action: "quest", label: "Side Quest" },
        { action: "hunt", label: "Start Hunt" },
        { action: "close", label: "Keep Walking" }
      ]);
      return;
    }
    state.activeInteraction = target;
    const actions = [];
    if (target.interactionType === "place") actions.push({ action: "enter", label: "Enter" });
    if (target.grant && !state.stats.flags[target.grant]) actions.push({ action: "grant", label: "Take Help" });
    if (target.action === "battle") actions.push({ action: "battle", label: "Challenge" });
    actions.push({ action: "quest", label: "Side Quest" }, { action: "hunt", label: "Start Hunt" }, { action: "close", label: "Close" });
    setDialogue(target.interactionType === "npc" ? target.type : "Location", target.name, target.text, actions);
  }

  function handleDialogueAction(action, itemId) {
    if (action === "close") {
      els.dialoguePanel.hidden = true;
      return;
    }
    if (action === "hunt") {
      els.dialoguePanel.hidden = true;
      openEncounter();
      return;
    }
    if (action === "quest") {
      const source = state.activeInteraction ? state.activeInteraction.name : "Route Contract";
      els.dialoguePanel.hidden = true;
      openReviewQuest(source);
      return;
    }
    if (action === "battle") {
      els.dialoguePanel.hidden = true;
      openEncounter();
      return;
    }
    if (action === "enter") {
      els.dialoguePanel.hidden = true;
      enterBuilding(state.activeInteraction);
      return;
    }
    if (action === "heal") {
      healParty();
      setDialogue("Chronicle Center", "Party Restored", "Your party health is full. Expedition log saved.", [
        { action: "close", label: "Back to Route" }
      ]);
      return;
    }
    if (action === "shop") {
      renderShop();
      return;
    }
    if (action === "buy") {
      buyItem(itemId);
      renderShop();
      return;
    }
    if (action === "grant") {
      grantNpcHelp(state.activeInteraction);
      return;
    }
    if (action === "chapter") {
      advanceStory();
      const chapter = storyChapters[state.stats.storyStep] || storyChapters[storyChapters.length - 1];
      setDialogue("Story", "Professor Mac's Lab", chapter, [
        { action: "hunt", label: "Train on Route" },
        { action: "close", label: "Back to Map" }
      ]);
    }
  }

  function buildingCopy(place) {
    if (!place) {
      return {
        kicker: "Route",
        title: "Open Route",
        text: "The field route continues ahead.",
        actions: [{ action: "leave", label: "Leave" }]
      };
    }
    if (place.kind === "center") {
      return {
        kicker: "Chronicle Center",
        title: "Party restored",
        text: "The archive nurse restores party HP and records your expedition log.",
        actions: [
          { action: "heal", label: "Heal Party" },
          { action: "quest", label: "Nurse's Errand" },
          { action: "leave", label: "Leave" }
        ]
      };
    }
    if (place.kind === "shop") {
      return {
        kicker: "Archive Supply",
        title: "Field counter",
        text: `Shards: ${state.stats.shards || 0}. Buy only what helps your next review route.`,
        actions: Object.entries(itemCatalog).map(([id, item]) => ({
          action: "buy",
          item: id,
          label: `${item.label} ${item.price}`
        })).concat([{ action: "quest", label: "Delivery Quest" }, { action: "leave", label: "Leave" }])
      };
    }
    if (place.id === "lab") {
      return {
        kicker: "Professor Mac's Lab",
        title: "Route assignment",
        text: storyChapters[state.stats.storyStep || 0] || storyChapters[0],
        actions: [
          { action: "chapter", label: "Check Story" },
          { action: "quest", label: "Research Contract" },
          { action: "hunt", label: "Train" },
          { action: "leave", label: "Leave" }
        ]
      };
    }
    if (place.id === "museum") {
      return {
        kicker: "Source Museum",
        title: "Read the evidence",
        text: "Maps, charts, cartoons, excerpts, and photos come before the answer choices.",
        actions: [
          { action: "grant", label: state.stats.flags.lens ? "Review Tip" : "Take Lenses" },
          { action: "quest", label: "Source Quest" },
          { action: "hunt", label: "Figure Hunt" },
          { action: "leave", label: "Leave" }
        ]
      };
    }
    if (place.id === "capitol") {
      return {
        kicker: "Civic Capitol",
        title: "Rights docket",
        text: "The court route asks who has power, what limits it, and how rights claims become public action.",
        actions: [
          { action: "quest", label: "Civics Contract" },
          { action: "hunt", label: "Court Battle" },
          { action: "leave", label: "Leave" }
        ]
      };
    }
    if (place.id === "forge") {
      return {
        kicker: "Industrial Forge",
        title: "Factory floor",
        text: "Machines, labor, capital, urban growth, reform pressure, and ideology all collide on this route.",
        actions: [
          { action: "quest", label: "Factory Contract" },
          { action: "hunt", label: "Forge Battle" },
          { action: "leave", label: "Leave" }
        ]
      };
    }
    if (place.id === "psychLab") {
      return {
        kicker: "Mind Lab",
        title: "Research wing",
        text: "Behavior, cognition, memory, learning, development, and research design all need precise evidence.",
        actions: [
          { action: "quest", label: "Research Quest" },
          { action: "hunt", label: "Lab Battle" },
          { action: "leave", label: "Leave" }
        ]
      };
    }
    if (place.id === "summit") {
      return {
        kicker: "Regents Summit",
        title: "Cumulative route",
        text: "The summit mixes units, courses, documents, and historical figures. Bring a real party before you climb.",
        actions: [
          { action: "quest", label: "Summit Contract" },
          { action: "hunt", label: "Summit Battle" },
          { action: "leave", label: "Leave" }
        ]
      };
    }
    return {
      kicker: place.name,
      title: "Route hub",
      text: place.text || "This route connects figure battles and review quests.",
      actions: [
        { action: "quest", label: "Side Quest" },
        { action: "hunt", label: "Start Route" },
        { action: "leave", label: "Leave" }
      ]
    };
  }

  function enterBuilding(place) {
    const copy = buildingCopy(place);
    state.activeInteraction = place || state.activeInteraction;
    closePanels();
    document.body.classList.remove("menu-open");
    els.buildingPanel.hidden = false;
    els.buildingRoom.dataset.kind = place && place.kind || "route";
    els.buildingKicker.textContent = copy.kicker;
    els.buildingTitle.textContent = copy.title;
    els.buildingText.textContent = copy.text;
    els.buildingActions.innerHTML = copy.actions.map((action) => (
      `<button type="button" data-action="${escapeHtml(action.action)}" data-item="${escapeHtml(action.item || "")}">${escapeHtml(action.label)}</button>`
    )).join("");
    Array.prototype.forEach.call(els.buildingActions.querySelectorAll("button"), (button) => {
      button.addEventListener("click", () => handleBuildingAction(button.dataset.action, button.dataset.item));
    });
  }

  function handleBuildingAction(action, itemId) {
    if (action === "leave") {
      els.buildingPanel.hidden = true;
      return;
    }
    if (action === "heal") {
      healParty();
      els.buildingText.textContent = "Full restore complete. Your party is ready for the next route.";
      updateHud();
      return;
    }
    if (action === "buy") {
      buyItem(itemId);
      const item = itemCatalog[itemId];
      els.buildingText.textContent = item
        ? `${item.label}: x${state.stats.items[itemId] || 0}. Shards left: ${state.stats.shards || 0}.`
        : `Shards left: ${state.stats.shards || 0}.`;
      return;
    }
    if (action === "chapter") {
      advanceStory();
      els.buildingText.textContent = storyChapters[state.stats.storyStep] || storyChapters[storyChapters.length - 1];
      return;
    }
    if (action === "quest") {
      const source = state.activeInteraction ? state.activeInteraction.name : "Town Contract";
      els.buildingPanel.hidden = true;
      openReviewQuest(source);
      return;
    }
    if (action === "grant") {
      if (!state.stats.flags.lens) {
        state.stats.items.sourceLens += 2;
        state.stats.flags.lens = true;
        writeSave();
        updateHud();
        renderBag();
      }
      els.buildingText.textContent = "Source Lenses are in your bag. Use them during source-based review quests.";
      return;
    }
    if (action === "hunt") {
      els.buildingPanel.hidden = true;
      openEncounter();
    }
  }

  function renderShop() {
    const actions = Object.entries(itemCatalog).map(([id, item]) => ({
      action: "buy",
      item: id,
      label: `${item.label} - ${item.price} shards`
    })).concat([{ action: "close", label: "Leave Shop" }]);
    setDialogue("Archive Supply", "Buy Field Items", `Shards: ${state.stats.shards}. Battle items help in encounters. Review quests are now side quests for XP, shards, and supplies.`, actions);
  }

  function buyItem(id) {
    const item = itemCatalog[id];
    if (!item) return;
    if ((state.stats.shards || 0) < item.price) {
      els.dialogueText.textContent = `Not enough shards for ${item.label}. Win review battles to earn more.`;
      return;
    }
    state.stats.shards -= item.price;
    state.stats.items[id] = Number(state.stats.items[id] || 0) + 1;
    writeSave();
    updateHud();
    renderBag();
  }

  function grantNpcHelp(npc) {
    if (!npc || !npc.grant || state.stats.flags[npc.grant]) return;
    if (npc.grant === "starter") {
      const hadRoster = !!(state.stats.roster && state.stats.roster.length);
      const starter = ensureStarterAlly(courseTypeFor(els.courseFilter.value).name);
      state.stats.items.capsule += 2;
      state.stats.items.fieldNote += 2;
      state.stats.shards += 20;
      state.stats.flags.starter = true;
      const starterText = hadRoster
        ? "Starter kit added: 2 Archive Capsules, 2 Field Notes, and 20 shards."
        : `${starter.actualName} joined your party as a starter ally. Starter kit added: 2 Archive Capsules, 2 Field Notes, and 20 shards.`;
      setDialogue("Guide", npc.name, starterText, [
        { action: "hunt", label: "Start Hunt" },
        { action: "close", label: "Thanks" }
      ]);
    } else if (npc.grant === "lens") {
      state.stats.items.sourceLens += 2;
      state.stats.flags.lens = true;
      setDialogue("Source Coach", npc.name, "Two Source Lenses added. Use them on side quests that depend on a map, chart, excerpt, cartoon, or image.", [
        { action: "close", label: "Got It" }
      ]);
    } else if (npc.grant === "forgeNote") {
      state.stats.items.fieldNote += 2;
      state.stats.shards += 25;
      state.stats.flags.forgeNote = true;
      setDialogue("Labor Organizer", npc.name, "Two Field Notes and 25 shards added. Industrial routes reward cause-and-effect thinking about labor, capital, and reform.", [
        { action: "quest", label: "Factory Contract" },
        { action: "close", label: "Back" }
      ]);
    } else if (npc.grant === "labNote") {
      state.stats.items.sourceLens += 1;
      state.stats.items.healKit += 1;
      state.stats.flags.labNote = true;
      setDialogue("Research Coach", npc.name, "One Source Lens and one Restoration Tea added. The Mind Lab rewards clean evidence, method, and careful claims.", [
        { action: "quest", label: "Research Quest" },
        { action: "close", label: "Back" }
      ]);
    }
    writeSave();
    updateHud();
    renderBag();
  }

  function healParty(amount) {
    const heal = amount || state.stats.maxHp;
    state.stats.playerHp = clamp(Number(state.stats.playerHp || 0) + heal, 0, state.stats.maxHp);
    if (state.battle) {
      state.battle.heroHp = state.stats.playerHp;
      renderBattle();
    }
    writeSave();
    updateHud();
  }

  function addXp(amount) {
    state.stats.xp = Math.max(0, Number(state.stats.xp || 0) + amount);
    const newRank = 1 + Math.floor(state.stats.xp / 120);
    if (newRank > (state.stats.rank || 1)) {
      state.stats.rank = newRank;
      state.stats.maxHp = 100 + (newRank - 1) * 8;
      state.stats.playerHp = state.stats.maxHp;
      setFeedback(`Level up. Rank ${newRank}. Party health restored.`, "done");
    }
    advanceStory();
  }

  function advanceStory() {
    const rosterCount = (state.stats.roster || []).length;
    const missions = Number(state.stats.missions || 0);
    const rank = Number(state.stats.rank || 1);
    let step = 0;
    if (rosterCount >= 1) step = 1;
    if (rosterCount >= 3) step = 2;
    if (missions >= 5 || state.stats.flags.lens) step = 3;
    if (rank >= 5) step = 4;
    if (rank >= 8 && rosterCount >= 6) step = 5;
    state.stats.storyStep = Math.max(Number(state.stats.storyStep || 0), step);
    writeSave();
    updateHud();
  }

  function renderBag() {
    const entries = Object.entries(itemCatalog);
    els.bagList.innerHTML = entries.map(([id, item]) => {
      const count = Number(state.stats.items[id] || 0);
      return `<article class="bag-item">` +
        `<div><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.description)}</p></div>` +
        `<span>x${count}</span>` +
        `<button type="button" data-item="${escapeHtml(id)}"${count <= 0 ? " disabled" : ""}>Use</button>` +
      `</article>`;
    }).join("");
    Array.prototype.forEach.call(els.bagList.querySelectorAll("button[data-item]"), (button) => {
      button.addEventListener("click", () => useItem(button.dataset.item));
    });
  }

  function openBag() {
    renderBag();
    els.bagPanel.classList.add("show");
  }

  function spendItem(id) {
    if (!state.stats.items[id]) return false;
    state.stats.items[id] -= 1;
    writeSave();
    renderBag();
    updateHud();
    return true;
  }

  function useItem(id) {
    const item = itemCatalog[id];
    if (!item || !state.stats.items[id]) return;
    if (state.battle && ["healKit", "fieldNote", "capsule", "treatyPass"].includes(id)) {
      chooseBattleItem(id);
      return;
    }
    if (id === "healKit") {
      if (spendItem(id)) {
        healParty(35);
        setFeedback("Restoration Tea restored 35 party HP.", "good");
      }
      return;
    }
    if (id === "fieldNote") {
      if (!state.battle) {
        setDialogue("Field Bag", item.label, "Field Notes work during battle. Start an encounter first.", [{ action: "close", label: "Close" }]);
        return;
      }
      if (spendItem(id)) {
        state.battle.studyBoost = true;
        state.capture = clamp(state.capture + 12, 0, 100);
        els.captureBar.style.width = `${state.capture}%`;
        setBattleLog("Field Notes prepared. The next move gets a power and trust boost.");
      }
      return;
    }
    if (id === "sourceLens") {
      if (!state.currentQuestion) {
        setDialogue("Field Bag", item.label, "Source Lens works during review side quests with source or stimulus prompts.", [{ action: "close", label: "Close" }]);
        return;
      }
      if (spendItem(id)) {
        setFeedback(sourceTextFor(state.currentQuestion) ? "Lens hint: cite the stimulus first, then connect it to the answer choices." : `Lens hint: focus on ${cleanText(state.currentQuestion.category || state.currentQuestion.set || "the core term")}.`, "good");
      }
      return;
    }
    if (id === "capsule") {
      if (!state.battle) {
        setDialogue("Field Bag", item.label, "Archive Capsules work during battle after you build trust.", [{ action: "close", label: "Close" }]);
        return;
      }
      chooseBattleItem("capsule");
      return;
    }
    if (id === "treatyPass") {
      if (spendItem(id)) {
        setBattleLog("Treaty Pass used. You withdrew safely and kept your streak.");
        setTimeout(closeEncounter, 450);
      }
    }
  }

  function isTextEntryTarget(target) {
    if (!target) return false;
    const tag = String(target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
  }

  function closePanels() {
    els.rosterPanel.classList.remove("show");
    els.codexPanel.classList.remove("show");
    els.bagPanel.classList.remove("show");
    els.dialoguePanel.hidden = true;
  }

  function toggleMenu(force) {
    if (state.encounterOpen || !state.running) return;
    const open = typeof force === "boolean" ? force : !document.body.classList.contains("menu-open");
    closePanels();
    els.buildingPanel.hidden = true;
    document.body.classList.toggle("menu-open", open);
  }

  function performAction() {
    if (!state.running) {
      startField();
      return;
    }
    if (!els.buildingPanel.hidden) return;
    if (state.encounterOpen) {
      if (state.currentQuestion && els.typedForm.style.display !== "none") {
        els.typedAnswer.focus({ preventScroll: true });
      }
      return;
    }
    if (document.body.classList.contains("menu-open")) {
      toggleMenu(false);
      return;
    }
    const interaction = interactionInFront();
    if (interaction) {
      openInteraction(interaction);
      return;
    }
    if (isTallGrass(state.player.x, state.player.y)) {
      setDialogue("Route", "Tall Grass", "The grass rustles. Keep walking and a review encounter may appear.", [
        { action: "quest", label: "Study Contract" },
        { action: "hunt", label: "Search" },
        { action: "close", label: "Close" }
      ]);
    } else {
      setDialogue("Field", "Nothing here", "Face a person, door, sign, or patch of tall grass, then press A.", [
        { action: "close", label: "Close" }
      ]);
    }
  }

  function performCancel() {
    if (!els.buildingPanel.hidden) {
      els.buildingPanel.hidden = true;
      return;
    }
    if (!els.dialoguePanel.hidden) {
      els.dialoguePanel.hidden = true;
      return;
    }
    if (document.body.classList.contains("menu-open")) {
      toggleMenu(false);
      return;
    }
    if (els.bagPanel.classList.contains("show") || els.rosterPanel.classList.contains("show") || els.codexPanel.classList.contains("show")) {
      closePanels();
      return;
    }
    if (state.encounterOpen && !state.currentQuestion) closeEncounter();
  }

  function startField() {
    state.running = true;
    document.body.classList.add("field-mode");
    document.body.classList.remove("menu-open");
    els.startScreen.classList.add("hide");
    state.camera.x = clamp(state.player.x - innerWidth * .45, 0, WORLD_W - innerWidth);
    state.camera.y = clamp(state.player.y - innerHeight * .55, 0, WORLD_H - innerHeight);
    if (els.fieldHint) els.fieldHint.textContent = "A: talk / inspect · B: cancel · START: menu";
    // Phase 3 — first-run tour (fires once after first walk on map)
    if (window.MrMacsArcadeTour) {
      setTimeout(() => {
        MrMacsArcadeTour.start("history-hunters", [
          { target: "#world", title: "Walk and battle", body: "Move with the D-pad or arrow keys. Routes are full of historical figures to capture." },
          { target: "#battleActions", title: "Type matchups matter", body: "Each figure has a type (Political, Cultural, Economic, etc.). Super-effective hits do double damage." },
          { target: "#rosterBtn", title: "Build your party", body: "Caught figures join your roster. Swap actives any time from the field menu or mid-battle." }
        ]);
      }, 800);
    }
  }

  function setDirection(dir, pressed) {
    const map = {
      up: "arrowup",
      down: "arrowdown",
      left: "arrowleft",
      right: "arrowright"
    };
    if (map[dir]) state.keys[map[dir]] = pressed;
  }

  function initControls() {
    addEventListener("resize", resize);
    addEventListener("keydown", (event) => {
      const key = event.key;
      const lower = key.toLowerCase();
      if (isTextEntryTarget(event.target)) return;
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(lower)) {
        event.preventDefault();
        state.keys[lower] = true;
        return;
      }
      if (lower === "e" || key === " " || lower === "enter") {
        event.preventDefault();
        performAction();
        return;
      }
      if (lower === "b" || lower === "escape") {
        event.preventDefault();
        performCancel();
        return;
      }
      if (lower === "m" || lower === "tab") {
        event.preventDefault();
        toggleMenu();
      }
    });
    addEventListener("keyup", (event) => {
      state.keys[event.key.toLowerCase()] = false;
    });
    els.canvas.addEventListener("pointerdown", (event) => {
      if (state.encounterOpen) return;
      const point = canvasPoint(event);
      const interaction = nearestInteraction(point);
      if (interaction) {
        state.player.tx = interaction.x;
        state.player.ty = interaction.y + (interaction.interactionType === "place" ? 108 : 74);
        state.player.facing = "up";
        return;
      }
      const node = nearestNode(point);
      if (node) {
        state.selectedNode = node;
        state.player.tx = node.x;
        state.player.ty = node.y;
        updateQuest();
      } else {
        const dx = point.x - state.player.x;
        const dy = point.y - state.player.y;
        state.player.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
        state.player.tx = clamp(point.x, 50, WORLD_W - 50);
        state.player.ty = clamp(point.y, 50, WORLD_H - 50);
      }
    });
    els.courseFilter.addEventListener("change", () => {
      fillSets();
      applyFilters();
      toggleMenu(false);
    });
    els.setFilter.addEventListener("change", () => {
      applyFilters();
      toggleMenu(false);
    });
    els.huntBtn.addEventListener("click", () => {
      toggleMenu(false);
      openEncounter();
    });
    if (els.questBtn) {
      els.questBtn.addEventListener("click", () => {
        toggleMenu(false);
        openReviewQuest("Route Contract");
      });
    }
    els.actionBtn.addEventListener("click", performAction);
    els.mapBtn.addEventListener("click", () => {
      toggleMenu(false);
      state.player.tx = worldPlaces[0].x;
      state.player.ty = worldPlaces[0].y + 118;
      state.player.facing = "up";
    });
    els.bagBtn.addEventListener("click", () => {
      toggleMenu(false);
      openBag();
    });
    els.closeBag.addEventListener("click", () => els.bagPanel.classList.remove("show"));
    els.rosterBtn.addEventListener("click", () => {
      toggleMenu(false);
      els.rosterPanel.classList.add("show");
    });
    els.closeRoster.addEventListener("click", () => els.rosterPanel.classList.remove("show"));
    els.codexBtn.addEventListener("click", () => {
      toggleMenu(false);
      els.codexPanel.classList.add("show");
    });
    if (els.saveBtn) {
      els.saveBtn.addEventListener("click", () => {
        writeSave();
        toggleMenu(false);
        setDialogue("Save", "Progress Saved", "Your History Hunters progress was saved on this device.", [
          { action: "close", label: "OK" }
        ]);
      });
    }
    els.closeCodex.addEventListener("click", () => els.codexPanel.classList.remove("show"));
    els.closeDialogue.addEventListener("click", () => els.dialoguePanel.hidden = true);
    els.closeEncounter.addEventListener("click", closeEncounter);
    els.beginBtn.addEventListener("click", startField);
    els.typedForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAnswer(els.typedAnswer.value);
    });
    if (els.aBtn) els.aBtn.addEventListener("click", performAction);
    if (els.bBtn) els.bBtn.addEventListener("click", performCancel);
    if (els.startMenuBtn) els.startMenuBtn.addEventListener("click", () => toggleMenu());
    document.querySelectorAll("[data-dir]").forEach((button) => {
      const dir = button.dataset.dir;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        setDirection(dir, true);
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener("pointerup", () => setDirection(dir, false));
      button.addEventListener("pointercancel", () => setDirection(dir, false));
      button.addEventListener("lostpointercapture", () => setDirection(dir, false));
    });
  }

  function update(dt) {
    const p = state.player;
    let dx = 0;
    let dy = 0;
    let movedThisFrame = false;
    const canMove = !state.encounterOpen
      && els.buildingPanel.hidden
      && els.dialoguePanel.hidden
      && !document.body.classList.contains("menu-open")
      && !els.bagPanel.classList.contains("show")
      && !els.rosterPanel.classList.contains("show")
      && !els.codexPanel.classList.contains("show");
    const pendingX = p.tx - p.x;
    const pendingY = p.ty - p.y;
    const pendingDist = Math.hypot(pendingX, pendingY);
    if (pendingDist <= 3) {
      p.x = p.tx;
      p.y = p.ty;
    }
    if (canMove && pendingDist <= 3) {
      if (state.keys.w || state.keys.arrowup) dy -= 1;
      if (state.keys.s || state.keys.arrowdown) dy += 1;
      if (state.keys.a || state.keys.arrowleft) dx -= 1;
      if (state.keys.d || state.keys.arrowright) dx += 1;
    }
    if (dx && dy) {
      if (state.lastAxis === "x") dy = 0;
      else dx = 0;
    }
    if (dx || dy) {
      state.lastAxis = dx ? "x" : "y";
      p.facing = dy < 0 ? "up" : dy > 0 ? "down" : dx < 0 ? "left" : "right";
      const nextX = p.x + dx * 72;
      const nextY = p.y + dy * 72;
      if (canWalkTo(nextX, nextY)) {
        p.tx = nextX;
        p.ty = nextY;
      } else {
        p.tx = p.x;
        p.ty = p.y;
      }
    }
    const vx = p.tx - p.x;
    const vy = p.ty - p.y;
    const dist = Math.hypot(vx, vy);
    if (dist > 3 && canMove) {
      const step = Math.min(dist, p.speed * dt);
      p.x = clamp(p.x + vx / dist * step, 70, WORLD_W - 70);
      p.y = clamp(p.y + vy / dist * step, 70, WORLD_H - 70);
      movedThisFrame = step > 0;
      state.wildCooldown = Math.max(0, state.wildCooldown - dt);
      if (isTallGrass(p.x, p.y)) {
        state.wildSteps += step;
        if (!reduceMotion && Math.random() < dt * 7) {
          state.particles.push({
            x: p.x + (Math.random() - .5) * 46,
            y: p.y + 34 + (Math.random() - .5) * 18,
            vx: (Math.random() - .5) * 42,
            vy: -30 - Math.random() * 28,
            life: .28 + Math.random() * .22,
            max: 1,
            color: GB.glow
          });
        }
        if (state.running && state.wildCooldown <= 0 && state.wildSteps > 360 && Math.random() < dt * .38) {
          state.wildSteps = 0;
          state.wildCooldown = 8;
          openEncounter();
        }
      } else {
        state.wildSteps = Math.max(0, state.wildSteps - step * .5);
      }
    } else {
      state.wildCooldown = Math.max(0, state.wildCooldown - dt);
    }
    const interaction = interactionInFront() || nearestInteraction({ x: p.x, y: p.y }, 118);
    if ((interaction && (!state.nearInteraction || interaction.id !== state.nearInteraction.id)) || (!interaction && state.nearInteraction)) {
      state.nearInteraction = interaction;
      updateHud();
      if (els.fieldHint) els.fieldHint.textContent = interaction
        ? `A: ${interaction.interactionType === "place" ? "enter " : "talk to "}${interaction.name}`
        : (isTallGrass(p.x, p.y) ? "Tall grass: walk for encounters · START: menu" : "A: inspect · START: menu");
      if (interaction) {
        els.activeRegion.textContent = interaction.name;
        els.questText.textContent = interaction.kind === "center"
          ? "Chronicle Center nearby. Heal party health and save progress."
          : interaction.kind === "shop"
            ? "Archive Supply nearby. Buy items with shards."
            : `${interaction.name} nearby. Talk to continue the story, battle, or start a contract.`;
      } else {
        updateQuest();
      }
    } else if (!interaction && movedThisFrame && els.fieldHint) {
      els.fieldHint.textContent = isTallGrass(p.x, p.y) ? "Tall grass: walk for encounters · START: menu" : "A: inspect · START: menu";
    }
    state.camera.x += (clamp(p.x - innerWidth * .45, 0, WORLD_W - innerWidth) - state.camera.x) * Math.min(1, dt * 5);
    state.camera.y += (clamp(p.y - innerHeight * .55, 0, WORLD_H - innerHeight) - state.camera.y) * Math.min(1, dt * 5);
    state.pulse = Math.max(0, state.pulse - dt * 1.8);
    state.particles = state.particles.filter((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= .96;
      particle.vy *= .96;
      return particle.life > 0;
    });
  }

  function draw(now) {
    const w = innerWidth;
    const h = innerHeight;
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);
    drawWorld(now);
    drawWorldInteractions(now);
    drawNodes(now);
    drawPlayer(now);
    drawParticles();
    ctx.restore();
  }

  function drawWorld(now) {
    if (!state.terrain) state.terrain = buildTerrainLayer();
    const sx = clamp(Math.floor(state.camera.x) - 120, 0, Math.max(0, WORLD_W - 1));
    const sy = clamp(Math.floor(state.camera.y) - 120, 0, Math.max(0, WORLD_H - 1));
    const sw = Math.min(WORLD_W - sx, innerWidth + 240);
    const sh = Math.min(WORLD_H - sy, innerHeight + 240);
    ctx.drawImage(state.terrain, sx, sy, sw, sh, sx, sy, sw, sh);
    drawRetroAmbient(now);
  }

  function buildTerrainLayer() {
    const layer = typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(WORLD_W, WORLD_H)
      : document.createElement("canvas");
    layer.width = WORLD_W;
    layer.height = WORLD_H;
    const layerCtx = layer.getContext("2d", { alpha: false });
    layerCtx.imageSmoothingEnabled = false;
    drawRetroGround(layerCtx);
    drawRetroRoads(layerCtx);
    drawRetroLandmarks(layerCtx);
    drawRetroBorder(layerCtx);
    return layer;
  }

  function drawAtlas(context, name, x, y, w, h, alpha = 1) {
    const source = atlas[name];
    const image = images.retroTiles;
    if (!source || !image) {
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = name && name.includes("water") ? GB.dark : name && name.includes("path") ? "#c4dc52" : GB.mid;
      context.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
      context.restore();
      return;
    }
    context.save();
    context.globalAlpha = alpha;
    context.imageSmoothingEnabled = false;
    context.drawImage(image, source[0], source[1], source[2], source[3], Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    context.restore();
  }

  function drawRetroGround(context) {
    context.fillStyle = GB.light;
    context.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let y = 0; y < WORLD_H + TILE_SIZE; y += TILE_SIZE) {
      for (let x = 0; x < WORLD_W + TILE_SIZE; x += TILE_SIZE) {
        const water = x > WORLD_W - 250 || (y > WORLD_H - 205 && x > 1160) || (x < 160 && y > 920);
        const value = hash(`${x}|${y}|terrain`);
        const tile = water
          ? (value % 2 ? "waterA" : "waterB")
          : value % 7 === 0 ? "grassC" : value % 3 === 0 ? "grassB" : "grassA";
        drawAtlas(context, tile, x, y, TILE_SIZE, TILE_SIZE);
      }
    }
    tallGrassZones.forEach(([gx, gy, gw, gh], patchIndex) => {
      for (let y = gy; y < gy + gh; y += 72) {
        for (let x = gx; x < gx + gw; x += 72) {
          const tile = (hash(`${patchIndex}-${x}-${y}`) % 2) ? "grassB" : "grassC";
          drawAtlas(context, tile, x, y, 78, 78, .94);
        }
      }
      context.strokeStyle = "rgba(15,56,15,.45)";
      context.lineWidth = 4;
      context.strokeRect(gx, gy, gw, gh);
    });
    context.fillStyle = "rgba(15,56,15,.13)";
    for (let y = 0; y < WORLD_H; y += 24) {
      for (let x = (y / 24) % 2 ? 12 : 0; x < WORLD_W; x += 48) {
        if (hash(`${x}-${y}`) % 9 === 0) context.fillRect(x, y, 6, 6);
      }
    }
  }

  function strokeRoute(context, width, color) {
    if (!state.nodes.length) return;
    context.save();
    context.lineCap = "square";
    context.lineJoin = "bevel";
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(WORLD_W / 2, WORLD_H / 2);
    state.nodes.forEach((node, index) => {
      const elbowX = index % 2 ? node.x : WORLD_W / 2;
      context.lineTo(elbowX, node.y);
      context.lineTo(node.x, node.y);
    });
    context.stroke();
    context.restore();
  }

  function drawRetroRoads(context) {
    const roads = [
      [120, 740, 3360, 118], [1250, 150, 124, 1940], [2460, 230, 124, 1840],
      [3280, 740, 1620, 118], [3820, 520, 124, 2380], [4480, 980, 124, 1960],
      [420, 410, 1120, 92], [1600, 410, 1120, 92], [2840, 430, 440, 92],
      [3560, 430, 840, 92], [4260, 650, 630, 92],
      [360, 1010, 1120, 92], [1540, 1010, 1120, 92], [2800, 1030, 440, 92],
      [3440, 1230, 1340, 92], [290, 1440, 3000, 92], [3380, 1560, 1380, 92], [380, 1880, 2820, 92],
      [3210, 2040, 1580, 92], [3320, 2520, 1560, 92], [3640, 3000, 1180, 92],
      [240, 570, 470, 82], [1880, 610, 420, 82], [2850, 650, 440, 82],
      [2140, 1260, 330, 82], [2930, 1640, 330, 82], [3720, 850, 440, 82],
      [4340, 1440, 450, 82], [3610, 2290, 420, 82], [4460, 2770, 360, 82]
    ];
    roads.forEach(([x, y, w, h]) => drawRoadBlock(context, x, y, w, h));
    drawRoadBlock(context, 1040, 770, 620, 430, true);
    drawRoadBlock(context, 2260, 1140, 430, 320, true);
    drawRoadBlock(context, 2860, 1540, 420, 320, true);
    drawRoadBlock(context, 3680, 570, 450, 320, true);
    drawRoadBlock(context, 4310, 1240, 460, 320, true);
    drawRoadBlock(context, 3600, 2070, 450, 320, true);
    drawRoadBlock(context, 4410, 2700, 420, 330, true);
    drawAtlas(context, "gate", 1320 - 86, 820 - 152, 172, 132);
  }

  function drawRoadBlock(context, x, y, w, h, plaza = false) {
    context.save();
    context.fillStyle = GB.ink;
    context.fillRect(x - 8, y - 8, w + 16, h + 16);
    context.fillStyle = "#d5ec65";
    context.fillRect(x, y, w, h);
    context.fillStyle = "#b7d643";
    context.fillRect(x + 10, y + 10, w - 20, h - 20);
    context.fillStyle = "rgba(15,56,15,.28)";
    const gap = plaza ? 38 : 46;
    for (let yy = y + 22; yy < y + h - 10; yy += gap) {
      for (let xx = x + 22; xx < x + w - 10; xx += 86) {
        context.fillRect(xx, yy, 38, 5);
      }
    }
    context.restore();
  }

  function drawRetroLandmarks(context) {
    const trees = [
      [230, 270, "treeA"], [360, 1180, "treeB"], [2050, 300, "treeA"], [2300, 1260, "treeB"],
      [1160, 220, "treeA"], [1460, 1380, "treeB"], [980, 1260, "treeA"], [1840, 1320, "treeA"],
      [3050, 300, "treeA"], [3300, 1340, "treeB"], [3120, 2060, "treeA"], [640, 2050, "treeB"],
      [1660, 2050, "treeA"], [2600, 1980, "treeB"], [3660, 280, "treeA"], [4120, 360, "treeB"],
      [4890, 520, "treeA"], [3440, 1180, "treeB"], [4260, 1040, "treeA"], [4920, 1330, "treeB"],
      [3320, 1840, "treeA"], [4070, 1750, "treeB"], [4920, 2070, "treeA"], [3340, 2720, "treeB"],
      [4150, 2600, "treeA"], [4980, 2940, "treeB"]
    ];
    trees.forEach(([x, y, key]) => drawAtlas(context, key, x, y, 116, 126));
    [[530, 450, "mountainA"], [1880, 560, "mountainB"], [2100, 1000, "mountainA"], [3060, 950, "mountainB"], [820, 1660, "mountainA"],
      [3520, 620, "mountainA"], [4700, 880, "mountainB"], [4100, 1780, "mountainA"], [3500, 2860, "mountainB"]]
      .forEach(([x, y, key]) => drawAtlas(context, key, x, y, 150, 126));
    drawPixelBox(context, 1110, 620, 420, 92, "MR MACS REVIEW ARCADE", "STORY ROUTE 01");
    drawPixelBox(context, 2580, 960, 350, 86, "SOURCE ROUTE", "READ FIRST");
    drawPixelBox(context, 2860, 1500, 410, 86, "EXCHANGE HARBOR", "GLOBAL NETWORKS");
    drawPixelBox(context, 3630, 430, 420, 86, "CIVIC CAPITOL", "RIGHTS + POWER");
    drawPixelBox(context, 4250, 1170, 460, 86, "INDUSTRIAL FORGE", "LABOR + CAPITAL");
    drawPixelBox(context, 3530, 1990, 410, 86, "MIND LAB", "METHOD + MEMORY");
    drawPixelBox(context, 4310, 2580, 470, 86, "REGENTS SUMMIT", "CUMULATIVE ROUTE");
  }

  function drawRetroBorder(context) {
    context.save();
    context.strokeStyle = "rgba(15,56,15,.62)";
    context.lineWidth = 14;
    context.strokeRect(7, 7, WORLD_W - 14, WORLD_H - 14);
    context.strokeStyle = "rgba(155,188,15,.55)";
    context.lineWidth = 4;
    context.strokeRect(28, 28, WORLD_W - 56, WORLD_H - 56);
    context.restore();
  }

  function drawRetroAmbient(now) {
    if (reduceMotion) return;
    ctx.save();
    ctx.globalAlpha = .22;
    ctx.fillStyle = GB.ink;
    for (let i = 0; i < 36; i++) {
      const x = 140 + (i * 431) % (WORLD_W - 280);
      const y = 170 + (i * 277) % (WORLD_H - 340);
      const drift = Math.round(Math.sin(now * 1.8 + i) * 6);
      if (isTallGrass(x, y)) ctx.fillRect(x + drift, y, 18, 4);
    }
    ctx.globalAlpha = .32;
    ctx.fillStyle = GB.glow;
    for (let i = 0; i < 18; i++) {
      const x = WORLD_W - 220 + Math.round(Math.sin(now * 1.5 + i) * 18);
      const y = 180 + i * 104;
      ctx.fillRect(x, y, 32, 5);
    }
    ctx.globalAlpha = .55 + Math.sin(now * 2.8) * .18;
    ctx.fillStyle = GB.glow;
    const selected = state.selectedNode;
    if (selected) {
      for (let i = 0; i < 5; i++) {
        const angle = now * 1.6 + i * Math.PI * .4;
        ctx.fillRect(
          Math.round(selected.x + Math.cos(angle) * 58),
          Math.round(selected.y + Math.sin(angle) * 34 - 50),
          6,
          6
        );
      }
    }
    ctx.restore();
  }

  function drawPixelBox(context, x, y, w, h, title, subtitle) {
    context.save();
    context.fillStyle = GB.ink;
    context.fillRect(x, y, w, h);
    context.fillStyle = GB.light;
    context.fillRect(x + 8, y + 8, w - 16, h - 16);
    context.strokeStyle = GB.ink;
    context.lineWidth = 4;
    context.strokeRect(x + 16, y + 16, w - 32, h - 32);
    context.fillStyle = GB.ink;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "900 22px 'Courier New', monospace";
    context.fillText(title, x + w / 2, y + 36);
    context.font = "900 15px 'Courier New', monospace";
    context.fillText(subtitle, x + w / 2, y + 62);
    context.restore();
  }

  function drawWorldInteractions(now) {
    worldPlaces.forEach((place) => {
      const near = state.nearInteraction && state.nearInteraction.id === place.id;
      const bob = near && !reduceMotion ? Math.round(Math.sin(now * 7) * 4) : 0;
      const size = place.kind === "center" || place.kind === "story" ? 124 : 96;
      ctx.save();
      ctx.translate(Math.round(place.x), Math.round(place.y + bob));
      ctx.fillStyle = "rgba(15,56,15,.34)";
      ctx.fillRect(-64, 48, 128, 16);
      if (near) drawSelectionFrame(ctx, -84, -84, 168, 154);
      drawAtlas(ctx, place.icon, -size / 2, -size / 2, size, size);
      if (near) drawMapLabel(ctx, place.name, 0, size / 2 + 24, 210);
      ctx.restore();
    });
    npcs.forEach((npc) => {
      const near = state.nearInteraction && state.nearInteraction.id === npc.id;
      const bob = near && !reduceMotion ? Math.round(Math.sin(now * 8) * 5) : 0;
      ctx.save();
      ctx.translate(Math.round(npc.x), Math.round(npc.y + bob));
      ctx.fillStyle = "rgba(15,56,15,.36)";
      ctx.fillRect(-34, 34, 68, 12);
      if (near) drawSelectionFrame(ctx, -54, -76, 108, 126);
      drawAtlas(ctx, npc.action === "battle" ? "playerSideAlt" : "scholar", npc.action === "battle" ? -32 : -44, npc.action === "battle" ? -62 : -70, npc.action === "battle" ? 64 : 88, npc.action === "battle" ? 84 : 76);
      if (near) drawMapLabel(ctx, npc.name, 0, 62, 190);
      ctx.restore();
    });
  }

  function drawSelectionFrame(context, x, y, w, h) {
    context.fillStyle = GB.ink;
    context.fillRect(x, y, w, 8);
    context.fillRect(x, y + h - 8, w, 8);
    context.fillRect(x, y, 8, h);
    context.fillRect(x + w - 8, y, 8, h);
    context.fillStyle = GB.glow;
    context.fillRect(x + 12, y + 12, w - 24, 5);
    context.fillRect(x + 12, y + h - 17, w - 24, 5);
  }

  function drawMapLabel(context, label, x, y, width) {
    context.fillStyle = GB.ink;
    context.fillRect(x - width / 2, y, width, 36);
    context.fillStyle = GB.light;
    context.fillRect(x - width / 2 + 6, y + 6, width - 12, 24);
    context.fillStyle = GB.ink;
    context.font = "900 12px 'Courier New', monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(cleanText(label).slice(0, 24), x, y + 18);
  }

  function drawNodes(now) {
    // Review content is selected through the START menu; the field stays visually clean.
  }

  function wrapCanvasText(text, x, y, maxWidth, lineHeight, maxLines) {
    const words = cleanText(text).split(/\s+/);
    let line = "";
    let lineNo = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y + lineNo * lineHeight);
        line = words[i];
        lineNo += 1;
        if (lineNo >= maxLines) return;
      } else {
        line = test;
      }
    }
    if (lineNo < maxLines) ctx.fillText(line, x, y + lineNo * lineHeight);
  }

  function drawPlayer(now) {
    const p = state.player;
    const sprite = p.facing === "up" ? "playerBack" : p.facing === "right" ? "playerSideAlt" : p.facing === "left" ? "playerSide" : "playerFront";
    const walking = Math.hypot(p.tx - p.x, p.ty - p.y) > 4;
    const bob = walking && !reduceMotion ? Math.round(Math.sin(now * 18) * 3) : 0;
    const sway = walking && !reduceMotion ? Math.round(Math.sin(now * 9) * 2) : 0;
    ctx.save();
    ctx.translate(Math.round(p.x + sway), Math.round(p.y + bob));
    const pulse = 1 + state.pulse * .15;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(15,56,15,.42)";
    ctx.fillRect(-34, 38, 68, 12);
    drawAtlas(ctx, sprite, -36, -70, 72, 92);
    if (walking && !reduceMotion) {
      ctx.fillStyle = GB.ink;
      ctx.globalAlpha = .38;
      ctx.fillRect(-26, 47, 14, 5);
      ctx.fillRect(12, 47, 14, 5);
      ctx.globalAlpha = 1;
    }
    if (state.pulse > 0) {
      ctx.strokeStyle = GB.glow;
      ctx.lineWidth = 5;
      ctx.strokeRect(-48, -78, 96, 110);
    }
    ctx.restore();
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color || GB.ink;
      const size = Math.max(4, Math.round(5 + particle.life * 7));
      ctx.fillRect(Math.round(particle.x), Math.round(particle.y), size, size);
    });
    ctx.globalAlpha = 1;
  }

  function roundRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function loop(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min(.05, now - (state.last || now));
    state.last = now;
    if (state.running && !reduceMotion && !state.encounterOpen) update(dt);
    if (!state.encounterOpen) draw(now);
    requestAnimationFrame(loop);
  }

  async function init() {
    if (window.MrMacsProfile) {
      window.MrMacsProfile.recordPlay({
        id: "history-hunters",
        title: "History Hunters",
        course: "All Courses",
        file: "games/history-hunters/index.html"
      });
      if (window.MrMacsProfile.getSettings().sound === "off") {
        // no internal audio variable present in this build — no-op
      }
    }
    // Phase 6 — a11y: set missing aria attributes once on boot
    if (els.canvas && !els.canvas.getAttribute("aria-label")) els.canvas.setAttribute("aria-label", "History Hunters open world");
    if (els.battleLog) els.battleLog.setAttribute("aria-live", "polite");
    if (els.battleActions) { els.battleActions.setAttribute("role", "group"); els.battleActions.setAttribute("aria-label", "Battle commands"); }
    resize();
    initControls();
    updateHud();
    renderRoster();
    renderBag();
    await Promise.all([
      loadImage("retroTiles", "../../assets/history-hunters/retro-tile-sprite-atlas.webp"),
      loadImage("retroSheet", "../../assets/history-hunters/retro-title-battle-sheet.webp"),
      loadImage("retroItems", "../../assets/history-hunters/retro-items-actions-sheet.webp")
    ]);
    const response = await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract");
    state.bank = await response.json();
    state.bank.questions = (state.bank.questions || []).filter(isUsableQuestion);
    const visibleTypes = new Set(state.bank.questions.map((q) => courseTypeFor(q.course).name));
    const visibleFamilies = allFigureFamilies.filter((family) => visibleTypes.has(family.type)).length;
    els.startStats.innerHTML = [
      `${state.bank.questions.length.toLocaleString()} prompts`,
      `${visibleTypes.size} course types`,
      `${visibleFamilies} figure lines`
    ].map((item) => `<span>${escapeHtml(item)}</span>`).join("");
    renderCodex();
    fillFilters();
    applyFilters();
    requestAnimationFrame(loop);
  }

  init().catch((error) => {
    console.error(error);
    els.questText.textContent = "The archive failed to load. Refresh the page and try again.";
  });
})();
