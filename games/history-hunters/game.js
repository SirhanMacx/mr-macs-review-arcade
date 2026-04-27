(() => {
  "use strict";

  const STORAGE_KEY = "mr-macs-history-hunters-v1";
  const WORLD_W = 3600;
  const WORLD_H = 2300;
  const $ = (id) => document.getElementById(id);

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
    actionBtn: $("actionBtn"),
    mapBtn: $("mapBtn"),
    bagBtn: $("bagBtn"),
    rosterBtn: $("rosterBtn"),
    codexBtn: $("codexBtn"),
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
    [280, 1740, 560, 300], [1060, 1760, 520, 300], [1900, 1760, 560, 300], [2740, 1720, 540, 310]
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
    }
  ];

  const npcs = [
    {
      id: "guide",
      name: "Guide Maya",
      x: 1250,
      y: 930,
      type: "Guide",
      text: "Walk into tall grass to trigger wild review encounters. Use Talk / Use near buildings and people.",
      grant: "starter"
    },
    {
      id: "rival",
      name: "Rival Carter",
      x: 1710,
      y: 920,
      type: "Route Rival",
      text: "I am clearing the archive routes with a full roster. Beat my checkpoint questions and prove your party is ready.",
      action: "battle"
    },
    {
      id: "curator",
      name: "Curator Rivera",
      x: 2295,
      y: 1410,
      type: "Source Coach",
      text: "Stimulus questions are not bonus flavor. Read the map, cartoon, chart, or excerpt first, then attack.",
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
    }
  ];

  const storyChapters = [
    "Chapter 1: Get your first historical ally.",
    "Chapter 2: Build a three-ally party across course types.",
    "Chapter 3: Clear five review missions and visit the Source Museum.",
    "Chapter 4: Reach the harbor with a level 5 roster leader.",
    "Chapter 5: Master mode unlocked. Keep collecting figure lines across every course."
  ];

  const itemCatalog = {
    capsule: {
      label: "Archive Capsule",
      price: 24,
      description: "Starts a capture check during battle. Best after a correct answer.",
      battle: true
    },
    fieldNote: {
      label: "Field Notes",
      price: 18,
      description: "Boosts the next correct answer and capture trust.",
      battle: true
    },
    sourceLens: {
      label: "Source Lens",
      price: 32,
      description: "Shows a source-reading hint and boosts stimulus questions.",
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
    "../../assets/history-hunters/figure-evolution-atlas-1.png",
    "../../assets/history-hunters/figure-evolution-atlas-2.png",
    "../../assets/history-hunters/figure-evolution-atlas-3.png",
    "../../assets/history-hunters/figure-evolution-atlas-4.png",
    "../../assets/history-hunters/figure-evolution-atlas-5.png",
    "../../assets/history-hunters/figure-evolution-atlas-6.png",
    "../../assets/history-hunters/figure-evolution-atlas-7.png",
    "../../assets/history-hunters/figure-evolution-atlas-8.png",
    "../../assets/history-hunters/figure-evolution-atlas-9.png",
    "../../assets/history-hunters/figure-evolution-atlas-10.png"
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
  const sourcePromptRe = /(\bthis\s+(amendment|document|letter|speech|excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(issues|documents|statements|headlines|conditions|changes|questions|figures)\b|\b(shown|pictured|illustrated|above|below|accompanying)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\b|\bbased\s+on\s+(the|this)\b|similar\s+to\s+this)/i;

  function defaultStats() {
    return {
      rank: 1,
      shards: 0,
      streak: 0,
      bestStreak: 0,
      roster: [],
      missions: 0,
      xp: 0,
      playerHp: 100,
      maxHp: 100,
      storyStep: 0,
      flags: {},
      items: { capsule: 3, fieldNote: 2, sourceLens: 1, healKit: 1, treatyPass: 0 }
    };
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
    if (!q) return [];
    const images = Array.isArray(q.stimulusImages) ? q.stimulusImages.filter((image) => image && image.src) : [];
    if (!images.length) return [];
    if (q.stimulusRequired === true) return images;
    if (q.stimulusRequired === false) return [];
    return sourcePromptRe.test(String(q.prompt || "")) ? images : [];
  }

  function sourceTextFor(q) {
    if (!q) return "";
    if (q.stimulusText) return cleanText(q.stimulusText);
    if (typeof q.stimulus === "string") return cleanText(q.stimulus);
    return "";
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

  function shout(text) {
    return cleanText(text || "").toUpperCase();
  }

  function moveActorName() {
    const first = (state.stats.roster || [])[0];
    if (first) return first.actualName || first.name || "Field Team";
    if (state.currentAlly && state.currentAlly.actualName) return state.currentAlly.actualName;
    return "Field Team";
  }

  function movesFor(q, family, lane) {
    const blob = normalize([q.course, q.subject, q.set, q.category, q.prompt, q.answer, (q.tags || []).join(" ")].join(" "));
    const type = lane.name;
    const laneMove = lane.move || "Archive Pulse";
    const moves = [
      signatureMoveFor(family, type),
      move(laneMove, type, 29, `A ${type} type move powered by this course lane.`),
      move("Context Check", type, 22, "Sets up the question with broader historical context.")
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
    const course = els.courseFilter.value;
    const items = course === "All Courses"
      ? state.bank.courses.slice()
      : (state.bank.setsByCourse[course] || []).slice();
    const count = Math.max(1, items.length);
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const spot = openWorldSpots[i % openWorldSpots.length];
      const lap = Math.floor(i / openWorldSpots.length);
      const x = spot[0] + (lap ? (lap % 2 ? 78 : -78) : 0);
      const y = spot[1] + (lap ? lap * 54 : 0);
      const label = items[i];
      nodes.push({
        label,
        x: clamp(x, 220, WORLD_W - 220),
        y: clamp(y, 180, WORLD_H - 180),
        palette: paletteFor(label),
        count: state.filtered.filter((q) => course === "All Courses" ? q.course === label : q.set === label).length
      });
    }
    state.nodes = nodes;
    state.selectedNode = nodes[0] || null;
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
      if (!q || !q.prompt || !q.answer) return false;
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && q.set !== set) return false;
      if (state.selectedNode) {
        if (course === "All Courses" && q.course !== state.selectedNode.label) return false;
        if (course !== "All Courses" && set === "All Sets" && q.set !== state.selectedNode.label) return false;
      }
      if (q.type === "mcq" && sourcePromptRe.test(String(q.prompt || "")) && !stimulusImagesFor(q).length && !sourceTextFor(q)) return false;
      return true;
    });
    if (!questions.length) questions = state.filtered.slice();
    return questions;
  }

  function applyFilters() {
    const course = els.courseFilter.value;
    const set = els.setFilter.value;
    state.filtered = state.bank.questions.filter((q) => {
      if (!q || !q.prompt || !q.answer) return false;
      if (course !== "All Courses" && q.course !== course) return false;
      if (set !== "All Sets" && q.set !== set) return false;
      if (q.type === "mcq" && sourcePromptRe.test(String(q.prompt || "")) && !stimulusImagesFor(q).length && !sourceTextFor(q)) return false;
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
    els.questText.textContent = `${chapter} ${state.filtered.length.toLocaleString()} prompts available. Walk routes, talk to NPCs, heal at Chronicle Center, and hunt in tall grass.`;
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
    const images = stimulusImagesFor(q);
    const text = sourceTextFor(q);
    if (!images.length && !text) {
      els.sourcePanel.hidden = true;
      els.sourcePanel.innerHTML = "";
      return;
    }
    const textBlock = text ? `<p>${escapeHtml(text)}</p>` : "";
    const imageBlock = images.slice(0, 2).map((image, index) => (
      `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.label || `Source stimulus ${index + 1}`)}">`
    )).join("");
    els.sourcePanel.innerHTML = `<strong>Source Stimulus</strong>${textBlock}${imageBlock}`;
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
    const first = (state.stats.roster || [])[0];
    if (first) {
      return {
        name: first.name,
        actualName: first.actualName || first.name,
        type: first.type || "Review",
        moves: first.moves && first.moves.length ? first.moves : fallbackMoves,
        palette: first.palette || paletteFor(first.name)
      };
    }
    if (state.currentAlly && state.currentAlly.moves && state.currentAlly.moves.length) {
      return {
        name: "Field Researcher",
        actualName: state.currentAlly.actualName || state.currentAlly.name,
        type: state.currentAlly.type || "Review",
        moves: state.currentAlly.moves,
        palette: state.currentAlly.palette || palettes[0]
      };
    }
    const lane = state.currentAlly
      ? (typeData[state.currentAlly.type] ? { name: state.currentAlly.type, move: typeData[state.currentAlly.type].move || "Archive Pulse" } : courseTypeFor(state.currentAlly.course))
      : courseTypeFor(els.courseFilter.value);
    return {
      name: "Field Researcher",
      type: lane.name,
      moves: [
        move(lane.move || "Archive Pulse", lane.name, 25, "Starter course-type pressure."),
        move("Source Scan", lane.name, 22, "Read the evidence before answering."),
        move("Context Check", lane.name, 20, "Add the missing background."),
        move("Recall Rush", lane.name, 18, "Fast review recall.")
      ],
      palette: palettes[0]
    };
  }

  function renderBattle() {
    const battle = state.battle || { heroHp: 100, enemyHp: 100 };
    const hero = heroAlly();
    const enemy = state.currentAlly || { name: "Archive Echo", type: "Review" };
    els.heroName.textContent = hero.name;
    els.heroType.textContent = hero.type;
    els.enemyName.textContent = enemy.name;
    els.enemyType.textContent = enemy.type || "Review";
    els.heroHp.style.width = `${clamp((battle.heroHp / (state.stats.maxHp || 100)) * 100, 0, 100)}%`;
    els.enemyHp.style.width = `${clamp(battle.enemyHp, 0, 100)}%`;
  }

  function renderBattleActions() {
    if (!els.battleActions) return;
    els.battleActions.classList.remove("answering");
    els.battleActions.innerHTML = [
      ["fight", "Fight", "choose a move"],
      ["study", "Study", `notes x${state.stats.items.fieldNote || 0}`],
      ["capsule", "Capsule", `capsules x${state.stats.items.capsule || 0}`],
      ["run", "Run", "leave safely"]
    ].map(([action, label, detail]) => (
      `<button type="button" data-action="${action}" class="${action}"><strong>${label}</strong><small>${detail}</small></button>`
    )).join("");
    Array.prototype.forEach.call(els.battleActions.querySelectorAll("button"), (button) => {
      button.addEventListener("click", () => chooseAction(button.dataset.action));
    });
  }

  function chooseAction(action) {
    if (!state.battle || state.battle.awaitingAnswer || state.locked) return;
    if (action === "run") {
      setBattleLog("Got away safely. The route stays open.");
      setFeedback("Retreated from the encounter.", "bad");
      setTimeout(closeEncounter, 650);
      return;
    }
    if (action === "study") {
      if (!spendItem("fieldNote")) {
        setBattleLog("No Field Notes left. Visit Archive Supply or choose a move.");
        return;
      }
      state.battle.studyBoost = true;
      state.capture = clamp(state.capture + 14, 0, 100);
      els.captureBar.style.width = `${state.capture}%`;
      setBattleLog("Field Notes prepared. The next correct answer gets a power and capture boost.");
      clearQuestionArea("Choose Fight or throw an Archive Capsule when ready.");
      return;
    }
    if (action === "capsule") {
      if (!state.stats.items.capsule) {
        setBattleLog("No Archive Capsules left. Visit Archive Supply or keep fighting.");
        return;
      }
      if (state.capture < 35 && state.battle.enemyHp > 70) {
        setBattleLog("The echo broke free. Build trust with an answer first.");
        return;
      }
      const q = state.currentQuestion || nextQuestion();
      if (!q) {
        setBattleLog("No checkpoint questions are available in this region.");
        return;
      }
      const hero = heroAlly();
      spendItem("capsule");
      state.battle.pendingMove = { name: "Archive Capsule", type: hero.type, power: 12, captureBoost: true };
      setBattleLog("Archive Capsule armed. Answer the checkpoint to seal the recruit.");
      renderQuestion(q);
      return;
    }
    els.moveButtons.classList.add("open");
    setBattleLog("Choose a course-type move. The question will power the attack.");
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

  function initials(name) {
    const words = cleanText(name).split(/\s+/).filter(Boolean);
    return (words[0] && words[1] ? words[0][0] + words[1][0] : (words[0] || "HH").slice(0, 2)).toUpperCase();
  }

  function renderQuestion(q) {
    state.currentQuestion = q;
    state.locked = false;
    els.encounter.classList.add("answering");
    if (state.battle) state.battle.awaitingAnswer = true;
    els.moveButtons.classList.add("answering");
    if (els.battleActions) els.battleActions.classList.add("answering");
    els.questionText.textContent = displayPrompt(q);
    els.trialMeta.textContent = `${cleanText(q.course || "Social Studies")} / ${cleanText(q.set || "Review")}`;
    els.trialKicker.textContent = state.currentAlly && state.currentAlly.sensitive ? "Archive Mission" : "Recruitment Trial";
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
    els.choices.innerHTML = "";
    els.choices.style.display = "none";
    els.typedForm.style.display = "none";
    els.sourcePanel.hidden = true;
    els.sourcePanel.innerHTML = "";
  }

  function openEncounter() {
    const pool = filteredForNode();
    if (!pool.length) return;
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
    state.currentQuestion = q;
    state.battle = { heroHp: state.stats.playerHp || state.stats.maxHp || 100, enemyHp: 100, pendingMove: null, awaitingAnswer: false };
    state.capture = 0;
    state.trial = 0;
    state.encounterOpen = true;
    document.body.classList.add("encounter-open");
    document.body.classList.remove("menu-open");
    renderAlly(ally);
    renderBattle();
    renderBattleActions();
    renderMoveButtons();
    els.encounter.hidden = false;
    els.encounter.classList.add("pulse");
    setTimeout(() => els.encounter.classList.remove("pulse"), 650);
    clearQuestionArea(ally.sensitive ? "Archive mission loaded. Answer carefully to preserve context." : "What will the field team do?");
    setBattleLog(`${ally.name} appeared. ${ally.type} type. ${typeData[ally.type]?.flavor || "review energy"}.`);
  }

  function closeEncounter() {
    state.encounterOpen = false;
    state.locked = false;
    state.battle = null;
    state.wildCooldown = 4;
    els.encounter.classList.remove("answering");
    document.body.classList.remove("encounter-open");
    els.encounter.hidden = true;
  }

  function chooseMove(index) {
    if (!state.battle || state.battle.awaitingAnswer || state.locked) return;
    const hero = heroAlly();
    const selected = hero.moves[index] || hero.moves[0] || fallbackMoves[0];
    state.battle.pendingMove = selected;
    const q = state.currentQuestion || nextQuestion();
    if (!q) {
      setBattleLog("No questions are available in this region. Change course or unit.");
      state.battle.pendingMove = null;
      return;
    }
    const enemy = state.currentAlly || { type: "Review" };
    const multiplier = typeEffect(selected.type, enemy.type || "Review");
    setBattleLog(`${shout(moveActorName())} used ${shout(selected.name)}! ${effectSentence(multiplier)} Answer to power the move against ${opponentFor(enemy)}.`);
    renderQuestion(q);
  }

  function checkAnswer(q, raw) {
    if (q.type === "mcq") return String(raw) === String(q.correct);
    return typedMatches(raw, [q.answer].concat(q.aliases || []));
  }

  function submitAnswer(raw) {
    if (state.locked) return;
    const q = state.currentQuestion;
    const ally = state.currentAlly;
    const battle = state.battle;
    if (!q || !ally || !battle || !battle.pendingMove) return;
    state.locked = true;
    const correct = checkAnswer(q, raw);
    state.trial += 1;
    const expected = answerLabel(q);
    const moveUsed = battle.pendingMove;
    const multiplier = typeEffect(moveUsed.type, ally.type || "Review");
    const actor = moveActorName();
    const target = opponentFor(ally);
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
        setBattleLog(`ARCHIVE CAPSULE clicked shut! Trust rose to ${state.capture}%.`);
      } else {
        setBattleLog(`${shout(actor)} used ${shout(moveUsed.name)}! ${effectSentence(multiplier)} ${target} took ${damage} damage.${fainted ? ` ${shout(target)} fainted!` : ""}`);
      }
      setFeedback(`Correct. ${q.explanation || "That answer strengthens the bond."}`, "good");
    } else {
      state.stats.streak = 0;
      const counter = ally.sensitive ? 12 : 16 + Math.floor(Math.random() * 10);
      battle.heroHp = clamp(battle.heroHp - counter, 0, state.stats.maxHp || 100);
      state.stats.playerHp = battle.heroHp;
      state.capture = clamp(state.capture - (moveUsed.captureBoost ? 16 : 10), 0, 100);
      burst(state.player.x, state.player.y, "#ff789d", 12);
      setBattleLog(moveUsed.captureBoost ? `${ally.name} broke out of the capsule and countered for ${counter}.` : `${shout(target)} countered for ${counter}. ${shout(actor)} needs better evidence.`);
      setFeedback(`Not quite. Answer: ${expected}. ${q.explanation || ""}`, "bad");
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
      setTimeout(completeEncounter, 650);
      return;
    }
    if (battle.heroHp <= 0) {
      setTimeout(retreatEncounter, 900);
      return;
    }
    setTimeout(() => {
      const next = nextQuestion();
      state.currentQuestion = next || nextQuestion();
      state.locked = false;
      clearQuestionArea("What will the field team do next?");
      renderBattleActions();
      renderMoveButtons();
      setBattleLog(`${ally.name} is watching carefully. Capture trust: ${state.capture}%.`);
    }, correct ? 1250 : 1900);
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
        state.stats.roster = state.stats.roster.slice(0, 96);
        addXp(60);
        setFeedback(`${ally.name} joined your party.`, "done");
        setBattleLog(`${shout(opponentFor(ally))} fainted! ${ally.actualName} joined your roster.`);
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
    if (window.MrMacsAnalytics && typeof window.MrMacsAnalytics.track === "function") {
      window.MrMacsAnalytics.track("game_complete", {
        gameId: "history-hunters",
        title: "History Hunters",
        score: state.stats.shards,
        allies: state.stats.roster.length,
        course: els.courseFilter.value
      }, { counter: "game-completions" });
    }
    setTimeout(closeEncounter, 1700);
  }

  function renderRoster() {
    const roster = state.stats.roster || [];
    if (!roster.length) {
      els.rosterList.innerHTML = `<div class="roster-empty">No allies yet. Start a hunt and answer review questions to recruit your first Chronicle Ally.</div>`;
      return;
    }
    els.rosterList.innerHTML = roster.map((ally) => {
      const palette = ally.palette || paletteFor(ally.name);
      const sprite = spritePosition(ally);
      const family = familiesById[ally.familyId] || figureFamilyFor({ course: ally.course, answer: ally.name }, courseTypeFor(ally.course));
      const species = ally.species || family.names[stageForAlly(ally)] || family.names[0];
      return `<div class="roster-item">` +
        `<div class="mini-portrait" style="--sprite-image:${escapeHtml(sprite.image)};--sprite-x:${escapeHtml(sprite.x)};--sprite-y:${escapeHtml(sprite.y)};--ally-a:${escapeHtml(palette[0])};--ally-b:${escapeHtml(palette[1])}" role="img" aria-label="${escapeHtml(species)}"></div>` +
        `<div><strong>${escapeHtml(ally.name)}</strong><span>${escapeHtml(ally.type || "Review")} type / ${escapeHtml(family.historicalName || species)} line / Stage ${escapeHtml(String(ally.level || 1))} / ${escapeHtml(ally.course)}</span></div>` +
        `<em>${escapeHtml(ally.rarity)}</em>` +
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
      els.actionBtn.textContent = near ? (near.kind === "shop" ? "Shop" : near.kind === "center" ? "Heal" : "Talk") : "Talk / Use";
    }
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - .5) * 360,
        vy: (Math.random() - .5) * 360,
        life: .55 + Math.random() * .45,
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

  function allInteractions() {
    return worldPlaces.map((place) => Object.assign({ interactionType: "place" }, place))
      .concat(npcs.map((npc) => Object.assign({ interactionType: "npc" }, npc)));
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
      setDialogue("Field", "Open Route", "Tap a building, NPC, or route marker to interact. Tall grass starts wild review encounters.", [
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
    actions.push({ action: "hunt", label: "Start Hunt" }, { action: "close", label: "Close" });
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
        })).concat([{ action: "leave", label: "Leave" }])
      };
    }
    if (place.id === "lab") {
      return {
        kicker: "Professor Mac's Lab",
        title: "Route assignment",
        text: storyChapters[state.stats.storyStep || 0] || storyChapters[0],
        actions: [
          { action: "chapter", label: "Check Story" },
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
          { action: "hunt", label: "Source Trial" },
          { action: "leave", label: "Leave" }
        ]
      };
    }
    return {
      kicker: place.name,
      title: "Route hub",
      text: place.text || "This route connects new review encounters.",
      actions: [
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
    if (action === "grant") {
      if (!state.stats.flags.lens) {
        state.stats.items.sourceLens += 2;
        state.stats.flags.lens = true;
        writeSave();
        updateHud();
        renderBag();
      }
      els.buildingText.textContent = "Source Lenses are in your bag. Use them when a question depends on a stimulus.";
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
    setDialogue("Archive Supply", "Buy Field Items", `Shards: ${state.stats.shards}. Items help during battles but review answers still power every major action.`, actions);
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
      state.stats.items.capsule += 2;
      state.stats.items.fieldNote += 2;
      state.stats.shards += 20;
      state.stats.flags.starter = true;
      setDialogue("Guide", npc.name, "Starter kit added: 2 Archive Capsules, 2 Field Notes, and 20 shards. Go catch a first figure line.", [
        { action: "hunt", label: "Start Hunt" },
        { action: "close", label: "Thanks" }
      ]);
    } else if (npc.grant === "lens") {
      state.stats.items.sourceLens += 2;
      state.stats.flags.lens = true;
      setDialogue("Source Coach", npc.name, "Two Source Lenses added. Use them when a question depends on a map, chart, excerpt, cartoon, or image.", [
        { action: "close", label: "Got It" }
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
        setBattleLog("Field Notes prepared. The next correct answer gets a power and capture boost.");
      }
      return;
    }
    if (id === "sourceLens") {
      if (!state.currentQuestion) {
        setDialogue("Field Bag", item.label, "Source Lens works after a battle question appears.", [{ action: "close", label: "Close" }]);
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
      chooseAction("capsule");
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
    const interaction = state.nearInteraction || nearestInteraction(state.player);
    if (interaction) {
      openInteraction(interaction);
      return;
    }
    if (isTallGrass(state.player.x, state.player.y) || state.selectedNode) {
      openEncounter();
    } else {
      setDialogue("Field", "Nothing here", "Move near a person, building, sign, or tall grass, then press A.", [
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
    if (els.fieldHint) els.fieldHint.textContent = "A: talk / inspect · B: cancel · START: menu";
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
        state.player.ty = interaction.y + 38;
        if (Math.hypot(state.player.x - interaction.x, state.player.y - interaction.y) < 170) openInteraction(interaction);
        return;
      }
      const node = nearestNode(point);
      if (node) {
        state.selectedNode = node;
        state.player.tx = node.x;
        state.player.ty = node.y;
        updateQuest();
      } else {
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
    els.actionBtn.addEventListener("click", performAction);
    els.mapBtn.addEventListener("click", () => {
      toggleMenu(false);
      state.player.tx = worldPlaces[0].x;
      state.player.ty = worldPlaces[0].y + 80;
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
    const canMove = !state.encounterOpen
      && els.buildingPanel.hidden
      && els.dialoguePanel.hidden
      && !document.body.classList.contains("menu-open")
      && !els.bagPanel.classList.contains("show")
      && !els.rosterPanel.classList.contains("show")
      && !els.codexPanel.classList.contains("show");
    if (canMove) {
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
      p.tx = p.x + dx * 72;
      p.ty = p.y + dy * 72;
    }
    const vx = p.tx - p.x;
    const vy = p.ty - p.y;
    const dist = Math.hypot(vx, vy);
    if (dist > 3 && canMove) {
      const step = Math.min(dist, p.speed * dt);
      p.x = clamp(p.x + vx / dist * step, 70, WORLD_W - 70);
      p.y = clamp(p.y + vy / dist * step, 70, WORLD_H - 70);
      state.wildCooldown = Math.max(0, state.wildCooldown - dt);
      if (isTallGrass(p.x, p.y)) {
        state.wildSteps += step;
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
    const near = nearestNode({ x: p.x, y: p.y });
    if (near && state.selectedNode !== near) {
      state.selectedNode = near;
      updateQuest();
    }
    const interaction = nearestInteraction({ x: p.x, y: p.y }, 175);
    if ((interaction && (!state.nearInteraction || interaction.id !== state.nearInteraction.id)) || (!interaction && state.nearInteraction)) {
      state.nearInteraction = interaction;
      updateHud();
      if (els.fieldHint) els.fieldHint.textContent = interaction
        ? `A: ${interaction.interactionType === "place" ? "enter " : "talk to "}${interaction.name}`
        : "A: inspect route · START: menu";
      if (interaction) {
        els.activeRegion.textContent = interaction.name;
        els.questText.textContent = interaction.kind === "center"
          ? "Chronicle Center nearby. Heal party health and save progress."
          : interaction.kind === "shop"
            ? "Archive Supply nearby. Buy items with shards."
            : `${interaction.name} nearby. Talk to continue the story or start a checkpoint.`;
      } else {
        updateQuest();
      }
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
    ctx.drawImage(state.terrain, 0, 0);
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
      [420, 410, 1120, 92], [1600, 410, 1120, 92], [2840, 430, 440, 92],
      [360, 1010, 1120, 92], [1540, 1010, 1120, 92], [2800, 1030, 440, 92],
      [290, 1440, 3000, 92], [380, 1880, 2820, 92],
      [240, 570, 470, 82], [1880, 610, 420, 82], [2850, 650, 440, 82],
      [2140, 1260, 330, 82], [2930, 1640, 330, 82]
    ];
    roads.forEach(([x, y, w, h]) => drawRoadBlock(context, x, y, w, h));
    drawRoadBlock(context, 1040, 770, 620, 430, true);
    drawRoadBlock(context, 2260, 1140, 430, 320, true);
    drawRoadBlock(context, 2860, 1540, 420, 320, true);
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
      [1660, 2050, "treeA"], [2600, 1980, "treeB"]
    ];
    trees.forEach(([x, y, key]) => drawAtlas(context, key, x, y, 116, 126));
    [[530, 450, "mountainA"], [1880, 560, "mountainB"], [2100, 1000, "mountainA"], [3060, 950, "mountainB"], [820, 1660, "mountainA"]]
      .forEach(([x, y, key]) => drawAtlas(context, key, x, y, 150, 126));
    drawPixelBox(context, 1110, 620, 420, 92, "MR MACS REVIEW ARCADE", "STORY ROUTE 01");
    drawPixelBox(context, 2580, 960, 350, 86, "SOURCE ROUTE", "READ FIRST");
    drawPixelBox(context, 2860, 1500, 410, 86, "EXCHANGE HARBOR", "GLOBAL NETWORKS");
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
      drawMapLabel(ctx, place.name, 0, size / 2 + 24, 210);
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
      drawMapLabel(ctx, npc.name, 0, 62, 190);
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
    state.nodes.forEach((node, index) => {
      const selected = state.selectedNode === node;
      const bob = selected && !reduceMotion ? Math.round(Math.sin(now * 7) * 5) : 0;
      const icon = index % 5 === 0 ? "portal" : index % 4 === 0 ? "chest" : index % 3 === 0 ? "arch" : "sign";
      const size = selected ? 88 : 68;
      ctx.save();
      ctx.translate(Math.round(node.x), Math.round(node.y + bob));
      ctx.fillStyle = "rgba(15,56,15,.35)";
      ctx.fillRect(-46, 36, 92, 14);
      if (selected) {
        ctx.fillStyle = GB.ink;
        ctx.fillRect(-54, -68, 108, 10);
        ctx.fillRect(-54, 46, 108, 10);
        ctx.fillRect(-64, -58, 10, 104);
        ctx.fillRect(54, -58, 10, 104);
        ctx.fillStyle = GB.glow;
        ctx.fillRect(-44, -58, 88, 6);
        ctx.fillRect(-44, 40, 88, 6);
      }
      drawAtlas(ctx, icon, -size / 2, -size / 2, size, size);
      ctx.fillStyle = GB.ink;
      ctx.font = "900 14px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(node.count || 0), 0, selected ? -60 : -48);
      ctx.fillStyle = GB.ink;
      ctx.fillRect(-118, size / 2 + 18, 236, 50);
      ctx.fillStyle = GB.light;
      ctx.fillRect(-112, size / 2 + 24, 224, 38);
      ctx.fillStyle = GB.ink;
      ctx.font = "900 12px 'Courier New', monospace";
      wrapCanvasText(node.label, 0, size / 2 + 38, 204, 14, 2);
      ctx.restore();
    });
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
    const movingX = Math.abs(p.tx - p.x);
    const movingY = Math.abs(p.ty - p.y);
    if (movingY > movingX && p.ty < p.y) p.facing = "up";
    else if (movingY > movingX && p.ty > p.y) p.facing = "down";
    else if (movingX > 10 && p.tx > p.x) p.facing = "right";
    else if (movingX > 10 && p.tx < p.x) p.facing = "left";
    const sprite = p.facing === "up" ? "playerBack" : p.facing === "right" ? "playerSideAlt" : p.facing === "left" ? "playerSide" : "playerFront";
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    const pulse = 1 + state.pulse * .15;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(15,56,15,.42)";
    ctx.fillRect(-34, 38, 68, 12);
    drawAtlas(ctx, sprite, -36, -70, 72, 92);
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
    if (state.running && !reduceMotion) update(dt);
    draw(now);
    requestAnimationFrame(loop);
  }

  async function init() {
    resize();
    initControls();
    updateHud();
    renderRoster();
    renderBag();
    await Promise.all([
      loadImage("retroTiles", "../../assets/history-hunters/retro-tile-sprite-atlas.png"),
      loadImage("retroSheet", "../../assets/history-hunters/retro-title-battle-sheet.png"),
      loadImage("retroItems", "../../assets/history-hunters/retro-items-actions-sheet.png")
    ]);
    const response = await fetch("../../data/chrono-defense-bank.json", { cache: "no-store" });
    state.bank = await response.json();
    const visibleTypes = new Set((state.bank.courses || []).map((course) => courseTypeFor(course).name));
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
