#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNIT_REVIEW_TYPES = new Set(["Unit Review", "Unit + AP Final", "Unit + Cumulative", "Unit + Final", "Regents Sprint"]);
const VALUE_SKILLS = {
  100: "identify key content",
  200: "match content to unit context",
  300: "explain cause, effect, or turning point",
  400: "connect evidence to a larger context",
  500: "synthesize a high-value exam pattern"
};

const CATEGORY_BLUEPRINTS = {
  "apush": {
    "01": ["Native Societies", "European Encounters", "Columbian Exchange", "Labor + Colonies", "Empire + Conflict"],
    "02": ["Colonial Regions", "Labor + Slavery", "Religion + Ideas", "Empire + Trade", "Conflict + Identity"],
    "03": ["Imperial Crisis", "Revolution", "Founding Documents", "Constitution", "Early Republic"],
    "04": ["Democracy + Parties", "Market Revolution", "Reform Movements", "Expansion + Native Policy", "Slavery + Sectionalism"],
    "05": ["Expansion + Slavery", "Sectional Crisis", "Civil War", "Reconstruction Amendments", "Reconstruction Society"],
    "06": ["Industrial Capitalism", "Labor + Immigration", "West + Native Policy", "Urban Reform", "Gilded Age Politics"],
    "07": ["Progressive Era", "Imperialism + World War I", "1920s Culture", "Depression + New Deal", "World War II"],
    "08": ["Cold War", "Civil Rights", "Postwar Society", "Vietnam + Protest", "Conservative Shift"],
    "09": ["Modern Conservatism", "Globalization", "Culture Wars", "Terrorism + Foreign Policy", "Demographic Change"],
    "99": ["Founding + Expansion", "Civil War + Reconstruction", "Industrial + Reform", "Wars + Depression", "Cold War + Modern America"]
  },
  "ap-world-history": {
    "01": ["State Building", "Belief Systems", "Trade + Cities", "East Asia", "Islamic + South Asian Worlds"],
    "02": ["Silk Roads", "Indian Ocean", "Trans-Saharan Routes", "Cultural Exchange", "Disease + Technology"],
    "03": ["Gunpowder Empires", "Land-Based Rule", "Bureaucracy + Military", "Religion + Legitimacy", "Eurasian Comparison"],
    "04": ["Exploration", "Columbian Exchange", "Maritime Empires", "Atlantic Economy", "Resistance + Labor"],
    "05": ["Enlightenment", "Atlantic Revolutions", "Nationalism + Liberalism", "Industrialization", "New Ideologies"],
    "06": ["Industrialization", "Imperialism", "Migration", "Resistance", "Global Economy"],
    "07": ["World War I", "Interwar Crisis", "World War II", "Genocide", "Global Conflict"],
    "08": ["Cold War", "Decolonization", "Communism + Capitalism", "Nonalignment", "Global Institutions"],
    "09": ["Globalization", "Technology + Trade", "Rights + Environment", "Migration + Culture", "Contemporary Challenges"],
    "99": ["State Building", "Trade Networks", "Revolutions", "Imperialism + Conflict", "Cold War + Globalization"]
  },
  "ap-european-history": {
    "01": ["Renaissance Ideas", "New Monarchies", "Exploration", "Atlantic Encounters", "Art + Science"],
    "02": ["Protestant Reform", "Catholic Reform", "Religious Wars", "State Power", "Social Change"],
    "03": ["Absolute Monarchy", "Constitutionalism", "State Building", "Balance of Power", "Empire + Economy"],
    "04": ["Scientific Revolution", "Enlightenment Thinkers", "Political Ideas", "Enlightened Absolutism", "Revolution Seeds"],
    "05": ["French Revolution", "Napoleon", "Congress of Vienna", "Conservatism + Liberalism", "1848 + Nationalism"],
    "06": ["Industrial Revolution", "Social Classes", "Urbanization", "Ideologies", "Reform + Labor"],
    "07": ["Nationalism", "Unification", "Imperialism", "Mass Politics", "Culture + Ideas"],
    "08": ["World War I", "Interwar Europe", "Totalitarianism", "World War II", "Holocaust + Genocide"],
    "09": ["Cold War Europe", "Decolonization", "European Integration", "Welfare + Society", "1989 + Modern Europe"],
    "99": ["Renaissance + Reformation", "State Power", "Revolutions", "Industrial + Nationalism", "World Wars + Cold War"]
  },
  "ap-human-geography": {
    "01": ["Geographic Tools", "Maps + Scale", "Spatial Concepts", "Data + Regions", "Human-Environment"],
    "02": ["Population Distribution", "Demographic Transition", "Migration", "Population Policy", "Population Challenges"],
    "03": ["Culture + Identity", "Language", "Religion", "Diffusion", "Cultural Landscapes"],
    "04": ["States + Sovereignty", "Boundaries", "Political Processes", "Devolution", "Supranationalism"],
    "05": ["Agriculture Origins", "Land-Use Models", "Food Production", "Rural Settlement", "Sustainability"],
    "06": ["Urbanization", "City Models", "Urban Land Use", "Infrastructure + Planning", "Urban Inequality"],
    "07": ["Development Measures", "Industrial Location", "Global Economy", "Trade + Outsourcing", "Sustainable Development"],
    "99": ["Spatial Thinking", "Population + Migration", "Political + Agriculture", "Urban + Development", "Global Patterns"]
  },
  "ap-us-government": {
    "01": ["Democratic Ideals", "The Constitution", "Federalism", "Founding Documents", "Models of Democracy"],
    "02": ["Congress", "Presidency", "Bureaucracy", "Judiciary", "Checks + Balances"],
    "03": ["First Amendment", "Due Process", "Equal Protection", "Civil Rights", "Supreme Court Cases"],
    "04": ["Political Socialization", "Public Opinion", "Ideology", "Polling", "Policy Views"],
    "05": ["Voting + Elections", "Parties", "Interest Groups", "Campaigns", "Media + Participation"],
    "99": ["Constitution", "Branches + Agencies", "Liberties + Rights", "Beliefs + Participation", "Policy + Elections"]
  },
  "civics-pig": {
    "01": ["Government Purposes", "Democratic Principles", "Constitutional Foundations", "Citizenship", "Civic Vocabulary"],
    "02": ["Federalism", "Legislative Branch", "Executive Branch", "Judicial Branch", "Checks + Balances"],
    "03": ["Bill of Rights", "Due Process", "Equal Protection", "Civil Rights", "Responsibilities"],
    "04": ["Voting", "Political Parties", "Campaigns + Media", "Public Opinion", "Citizen Participation"],
    "05": ["Public Policy", "Local Government", "Civic Action", "Interest Groups", "Rights in Practice"],
    "99": ["Foundations", "Constitutional Structure", "Rights + Responsibilities", "Elections + Participation", "Policy + Civic Action"]
  },
  "ap-macroeconomics": {
    "01": ["Macro Basics", "PPC + Growth", "Trade Foundations", "Economic Systems", "Market Foundations"],
    "02": ["GDP", "Inflation", "Unemployment", "Business Cycle", "Economic Indicators"],
    "03": ["Aggregate Demand", "Aggregate Supply", "Fiscal Policy", "Multipliers", "Inflation + Output"],
    "04": ["Money", "Banking", "Monetary Policy", "Interest Rates", "Loanable Funds"],
    "05": ["Phillips Curve", "Policy Effects", "Deficits + Debt", "Crowding Out", "Growth Policy"],
    "06": ["Balance of Payments", "Exchange Rates", "Trade", "Capital Flows", "Open-Economy Policy"],
    "99": ["Core Models", "Indicators", "Fiscal Policy", "Monetary Policy", "International Macro"]
  },
  "ap-microeconomics": {
    "01": ["Scarcity + Choice", "PPC + Trade", "Demand Basics", "Supply Basics", "Market Outcomes"],
    "02": ["Demand", "Supply", "Elasticity", "Surplus + Taxes", "Market Changes"],
    "03": ["Production", "Costs", "Perfect Competition", "Profit", "Long Run"],
    "04": ["Monopoly", "Oligopoly", "Monopolistic Competition", "Game Theory", "Price Discrimination"],
    "05": ["Factor Demand", "Labor Markets", "Marginal Product", "Income Distribution", "Monopsony"],
    "06": ["Externalities", "Public Goods", "Market Failure", "Taxes + Subsidies", "Government Policy"],
    "99": ["Demand + Supply", "Firm Behavior", "Market Structures", "Factor Markets", "Market Failure"]
  },
  "ap-economics-combined": {
    "01": ["Scarcity + Choice", "Models", "Comparative Advantage", "Demand + Supply", "Equilibrium"],
    "02": ["Elasticity", "Surplus", "Taxes", "Controls", "Market Shifts"],
    "03": ["Production + Costs", "Perfect Competition", "Monopoly", "Oligopoly", "Firm Strategy"],
    "04": ["Externalities", "Public Goods", "Market Failure", "Equity + Efficiency", "Government Action"],
    "05": ["GDP + Growth", "Inflation", "Unemployment", "AD-AS", "Business Cycle"],
    "06": ["Fiscal Policy", "Money + Banking", "Monetary Policy", "Phillips Curve", "Loanable Funds"],
    "07": ["Trade", "Exchange Rates", "Balance of Payments", "Growth", "International Policy"],
    "99": ["Micro Foundations", "Market Failure", "Macro Indicators", "Stabilization Policy", "International Economics"]
  },
  "economics": {
    "01": ["Scarcity", "Opportunity Cost", "Incentives", "Tradeoffs", "Decision Tools"],
    "02": ["Demand", "Supply", "Prices", "Competition", "Market Changes"],
    "03": ["Budgeting", "Saving + Credit", "Financial Choices", "Risk", "Consumer Skills"],
    "04": ["GDP + Growth", "Inflation", "Unemployment", "Fiscal + Monetary Policy", "Business Cycle"],
    "05": ["Public Goods", "Taxes + Spending", "Regulation", "Global Trade", "Economic Policy"],
    "99": ["Economic Choices", "Markets", "Personal Finance", "Macro Economy", "Government + Global Trade"]
  },
  "us-history-units": {
    "02": ["Founding Ideas", "Articles + Weaknesses", "Convention Compromises", "Constitutional Principles", "Federal Power"],
    "04": ["Civil War Causes", "Civil War Turning Points", "Reconstruction Amendments", "Reconstruction Politics", "Reconstruction Society"]
  },
  "grade-7": {
    "04": ["Articles Problems", "Convention Plans", "Constitutional Principles", "Ratification Debate", "Three Branches"]
  }
};

const CATEGORY_ASSIGNMENT_REPAIRS = {
  "games/global-10-units/07 - Decolonization and Nationalism Jeopardy Review.html": [
    { name: "Independence Leaders", answers: ["Gandhi", "Nehru", "Jinnah", "Ho Chi Minh", "Kwame Nkrumah"] },
    { name: "India + Vietnam", answers: ["India Partition", "Muslim League", "Indian National Congress", "Vietnamese independence", "Dien Bien Phu"] },
    { name: "Communist China", answers: ["Mao Zedong", "Great Leap Forward", "Cultural Revolution", "Decolonization", "National self-determination"] },
    { name: "African Liberation", answers: ["FLN", "Algerian War", "Pan-Africanism", "Kenya Mau Mau", "African National Congress"] },
    { name: "Resistance + Apartheid", answers: ["Nelson Mandela", "Apartheid", "Civil disobedience", "Nonviolence", "Salt March"] }
  ],
  "games/global-10-units/08 - Modernization Tensions Jeopardy Review.html": [
    { name: "Turkey + Secularism", answers: ["Mustafa Kemal Ataturk", "Kemalism", "Secularism", "Westernization", "Modernization"] },
    { name: "Iranian Revolution", answers: ["Iranian Revolution", "Ayatollah Khomeini", "Shah of Iran", "Theocracy", "Islamic republic"] },
    { name: "China After Mao", answers: ["Deng Xiaoping", "Four Modernizations", "Special Economic Zones", "One-child policy", "Tiananmen Square"] },
    { name: "Rights + Authority", answers: ["Women's rights", "Authoritarianism", "Censorship", "Human rights", "Religious fundamentalism"] },
    { name: "Tradition + Technology", answers: ["Tradition", "Technology", "Cultural diffusion", "Economic liberalization", "Cultural identity"] }
  ],
  "games/global-10-units/09 - Globalization Jeopardy Review.html": [
    { name: "Trade + Organizations", answers: ["NAFTA", "WTO", "European Union", "Free trade", "Tariffs"] },
    { name: "Digital Interdependence", answers: ["Globalization", "Internet", "Social media", "Interdependence", "Multinational corporation"] },
    { name: "Global Health + Migration", answers: ["HIV/AIDS", "COVID-19", "Refugees", "Terrorism", "Arab Spring"] },
    { name: "Climate + Environment", answers: ["Climate change", "Paris Agreement", "Greenhouse gases", "Kyoto Protocol", "Sustainable development"] },
    { name: "Culture + Development", answers: ["Outsourcing", "Cultural diffusion", "McDonaldization", "Cultural homogenization", "Microfinance"] }
  ],
  "games/us-history-units/06 - Imperialism, Progressivism, and World War I Jeopardy Review.html": [
    { name: "Overseas Expansion", answers: ["Spanish-American War", "Yellow journalism", "Alfred Thayer Mahan", "Philippine-American War", "Panama Canal"] },
    { name: "Imperial Policies", answers: ["Roosevelt Corollary", "Open Door Policy", "Platt Amendment", "Dollar diplomacy", "Big Stick diplomacy"] },
    { name: "Progressive Reform", answers: ["Muckrakers", "Square Deal", "Meat Inspection Act", "Pure Food and Drug Act", "Initiative"] },
    { name: "Constitutional Changes", answers: ["16th Amendment", "17th Amendment", "18th Amendment", "19th Amendment", "Referendum"] },
    { name: "World War I + Aftermath", answers: ["Lusitania", "Zimmermann Telegram", "Treaty of Versailles", "First Red Scare", "Moral diplomacy"] }
  ],
  "games/us-history-units/07 - Prosperity and Depression Jeopardy Review.html": [
    { name: "1920s Culture", answers: ["Harlem Renaissance", "Prohibition", "Speakeasies", "Flappers", "Scopes Trial"] },
    { name: "Nativism + Tensions", answers: ["Red Scare", "Nativism", "Sacco and Vanzetti", "Quota Acts", "Great Migration"] },
    { name: "Crash Causes", answers: ["Consumer credit", "Overproduction", "Buying on margin", "Installment buying", "Speculation"] },
    { name: "Great Depression", answers: ["Stock market crash", "Dust Bowl", "Hoovervilles", "Bonus Army", "Bank runs"] },
    { name: "New Deal Programs", answers: ["New Deal", "Social Security Act", "FDIC", "Fireside chats", "Works Progress Administration"] }
  ],
  "games/ap-us-government/02 - Unit 2 Interactions Among Branches Jeopardy Review.html": [
    { name: "Congress", answers: ["Bicameralism", "Filibuster", "Committee hearings", "Constituent service", "Casework"] },
    { name: "Presidency", answers: ["Veto", "Executive order", "Veto power", "Pocket veto", "Signing statement"] },
    { name: "Bureaucracy", answers: ["Bureaucracy", "Iron triangle", "Bureaucratic rulemaking", "Congressional oversight", "Advice and consent"] },
    { name: "Judiciary", answers: ["Judicial review", "Stare decisis", "Marbury v. Madison", "Baker v. Carr", "Standing doctrine"] },
    { name: "Checks + Powers", answers: ["Enumerated powers", "Necessary and proper clause", "Federalist 70", "Federalist 78", "Cloture"] }
  ],
  "games/ap-us-government/05 - Unit 5 Political Participation Jeopardy Review.html": [
    { name: "Voting + Elections", answers: ["Voter turnout", "Primary election", "Caucus", "Electoral College", "Winner-take-all system"] },
    { name: "Parties + Realignment", answers: ["Political party", "Party realignment", "Linkage institutions", "Mass media", "Political action committee"] },
    { name: "Interest Groups", answers: ["Interest group", "Lobbying", "Interest group lobbying", "Citizens United v. FEC", "Campaign finance"] },
    { name: "Campaign Strategy", answers: ["Retrospective voting", "Prospective voting", "Voter mobilization", "Campaign volunteers", "Horse-race journalism"] },
    { name: "Participation Cases", answers: ["Voting Rights Act", "Gerrymandering", "Incumbency advantage", "Shaw v. Reno", "Agenda setting"] }
  ],
  "games/ap-human-geography/02 - Unit 2 Population and Migration Jeopardy Review.html": [
    { name: "Population Structure", answers: ["Population density", "Dependency ratio", "Total fertility rate", "Demographic transition model", "Population pyramid"] },
    { name: "Migration Forces", answers: ["Push factors", "Pull factors", "Voluntary migration", "Forced migration", "Remittances"] },
    { name: "Density + Capacity", answers: ["Carrying capacity", "Agricultural density", "Arithmetic density", "Physiological density", "Overpopulation"] },
    { name: "Urban Migration", answers: ["Urban migration", "Rural-to-urban migration", "Suburbanization", "Megacity growth", "Chain migration"] },
    { name: "Population Models", answers: ["Epidemiological transition model", "Malthusian theory", "Ravenstein's laws", "Intervening opportunity", "Step migration"] }
  ]
};

const GENERIC_CATEGORY_NAMES = [
  "People + Places",
  "Events + Laws",
  "Ideas + Vocabulary",
  "Government + Power",
  "Society + Economy",
  "Core Concepts",
  "Markets + Models",
  "Policy + Institutions",
  "Graphs + Indicators",
  "Applications",
  "Principles",
  "Institutions",
  "Rights + Cases",
  "Participation",
  "Policy + Power",
  "Spatial Patterns",
  "Population + Culture",
  "States + Land Use",
  "Cities + Development",
  "Models + Examples",
  "Scarcity + Choices",
  "Markets + Prices",
  "Models + Graphs",
  "Global + Applications",
  "Foundations",
  "Power + Government",
  "Economy + Society",
  "Conflict + Change",
  "Modern Connections",
  "Founding Principles",
  "Branches + Federalism",
  "Elections + Media",
  "Policy + Participation"
];

const GENERIC_CATEGORY_RE = new RegExp(`^(${GENERIC_CATEGORY_NAMES.map(escapeRegExp).join("|")})$`, "i");

const CATEGORY_HINTS = [
  [/native|indigenous|first peoples|early peoples/, ["Indigenous", "Native American", "Iroquois", "Haudenosaunee", "Algonquian", "Pueblo", "Maya", "Aztec", "Inca", "adaptation"]],
  [/exploration|encounter|columbian|transoceanic|atlantic/, ["Columbus", "Columbian Exchange", "smallpox", "encomienda", "conquistador", "plantation", "middle passage", "mercantilism", "triangular trade", "viceroy", "Tordesillas"]],
  [/colonial|colonies|regions/, ["Jamestown", "Virginia", "House of Burgesses", "New England", "Puritan", "salutary neglect", "Bacon", "slavery", "indentured", "mercantilism"]],
  [/imperial crisis|revolution|independence/, ["French and Indian War", "Proclamation of 1763", "Stamp Act", "Tea Act", "Boston Tea Party", "Common Sense", "Declaration of Independence", "Articles of Confederation", "Shays", "grievance"]],
  [/founding|constitution|early republic|federalism|democracy/, ["Constitution", "Federalist", "Anti-Federalist", "Bill of Rights", "ratification", "Washington", "Hamilton", "Jefferson", "federalism", "checks and balances", "separation of powers", "judicial review", "Cabinet"]],
  [/market revolution|antebellum|reform/, ["Market Revolution", "canal", "cotton gin", "Second Great Awakening", "abolition", "temperance", "women's rights", "Seneca Falls", "transcendentalism", "common school"]],
  [/expansion|slavery|free soil|manifest/, ["Manifest Destiny", "Mexican-American War", "Wilmot Proviso", "Compromise of 1850", "Fugitive Slave Act", "Kansas-Nebraska", "popular sovereignty", "Free Soil", "California Gold Rush"]],
  [/sectional|civil war crisis/, ["sectionalism", "Bleeding Kansas", "Dred Scott", "Lincoln-Douglas", "Election of 1860", "secession", "John Brown", "Fugitive Slave Act"]],
  [/civil war(?!.*reconstruction)/, ["Fort Sumter", "Union", "Confederacy", "Emancipation Proclamation", "Gettysburg", "Antietam", "Sherman", "Appomattox", "habeas corpus"]],
  [/reconstruction/, ["13th Amendment", "14th Amendment", "15th Amendment", "Freedmen", "Black Codes", "sharecropping", "Reconstruction Acts", "carpetbagger", "scalawag", "redeemer", "Compromise of 1877"]],
  [/industrial|gilded|business|capitalism/, ["industrialization", "factory", "railroad", "Carnegie", "Rockefeller", "trust", "monopoly", "vertical integration", "horizontal integration", "Gospel of Wealth", "Social Darwinism"]],
  [/labor|immigration|urban/, ["labor union", "Knights of Labor", "AFL", "Homestead Strike", "Pullman Strike", "Haymarket", "immigration", "tenement", "political machine", "settlement house"]],
  [/progressive|reform/, ["Progressive", "muckraker", "initiative", "referendum", "recall", "trust-busting", "Square Deal", "women's suffrage", "Meat Inspection", "Pure Food"]],
  [/imperialism|empire|world war i|reform and empire/, ["imperialism", "Spanish-American War", "Philippines", "Open Door", "Roosevelt Corollary", "World War I", "Zimmermann", "League of Nations", "Fourteen Points"]],
  [/1920|depression|new deal|prosperity/, ["Roaring Twenties", "Harlem Renaissance", "Red Scare", "Great Depression", "New Deal", "Social Security", "deficit spending", "Dust Bowl", "court packing"]],
  [/world war ii|global conflict|holocaust|genocide/, ["World War II", "Pearl Harbor", "D-Day", "Holocaust", "Nazi", "fascism", "appeasement", "internment", "Manhattan Project", "United Nations"]],
  [/cold war|postwar|foreign policy/, ["Cold War", "containment", "Truman Doctrine", "Marshall Plan", "NATO", "Warsaw Pact", "Korean War", "Vietnam War", "Cuban Missile Crisis", "detente", "Soviet"]],
  [/civil rights|rights movement/, ["civil rights", "Brown v. Board", "Montgomery Bus Boycott", "Martin Luther King", "SNCC", "Civil Rights Act", "Voting Rights Act", "nonviolent", "Black Power"]],
  [/modern|conservative|globalization|terrorism|demographic/, ["Reagan", "conservatism", "deregulation", "Moral Majority", "globalization", "NAFTA", "9/11", "War on Terror", "deindustrialization", "immigration"]],

  [/civilization|river valley|mesopotamia|egypt|indus|china|shang|nile|yellow river/, ["civilization", "irrigation", "city-state", "Mesopotamia", "Tigris", "Euphrates", "Sumer", "cuneiform", "Hammurabi", "Nile", "pharaoh", "pyramid", "hieroglyphics", "afterlife", "Indus", "Harappa", "Mohenjo-Daro", "Yellow River", "Shang", "Mandate of Heaven"]],
  [/belief|religion|religious|islam|christian|buddhist|hindu|judaism/, ["monotheism", "polytheism", "Hinduism", "Buddhism", "Judaism", "Christianity", "Islam", "karma", "dharma", "nirvana", "Quran", "Bible", "Torah"]],
  [/trade|network|silk|indian ocean|trans-saharan|exchange/, ["Silk Roads", "Indian Ocean", "Trans-Saharan", "caravanserai", "camel", "monsoon", "diaspora", "Marco Polo", "Mansa Musa", "cultural diffusion"]],
  [/land-based|gunpowder|ottoman|safavid|mughal|ming|qing/, ["Ottoman", "Safavid", "Mughal", "Ming", "Qing", "gunpowder empire", "janissary", "millet", "zamindar", "bureaucracy", "tribute"]],
  [/enlightenment|thinkers/, ["Enlightenment", "John Locke", "Rousseau", "Montesquieu", "Voltaire", "Mary Wollstonecraft", "salon", "Encyclopedia", "natural rights", "social contract", "separation of powers", "consent of the governed"]],
  [/rights|social contract/, ["natural rights", "social contract", "consent of the governed", "Declaration of Independence", "Declaration of the Rights of Man", "Bill of Rights", "separation of powers", "checks and balances"]],
  [/american.*french|atlantic revolution|revolutions/, ["American Revolution", "French Revolution", "Haitian Revolution", "Latin American revolutions", "Estates-General", "Third Estate", "Tennis Court Oath", "Reign of Terror", "Bastille", "Declaration of the Rights of Man"]],
  [/napoleon|haiti/, ["Napoleon", "Napoleonic Code", "Haitian Revolution", "Toussaint Louverture", "Haiti", "Saint-Domingue", "Congress of Vienna"]],
  [/latin american|bolivar|nationalism/, ["Simon Bolivar", "Latin American independence", "creole", "peninsulares", "Miguel Hidalgo", "Jose de San Martin", "nationalism"]],
  [/industrial revolution|industrialization|new ideologies|working class|socialism|liberalism/, ["Industrial Revolution", "factory system", "steam power", "textile mills", "working class", "urbanization", "capitalism", "socialism", "liberalism", "communism", "Marx"]],
  [/imperialism|decolonization|nationalism/, ["imperialism", "Social Darwinism", "Berlin Conference", "British Raj", "Sepoy", "Opium War", "Boxer Rebellion", "nationalism", "decolonization", "Gandhi", "Nehru", "Nkrumah"]],
  [/globalization|technology|environment|human rights/, ["globalization", "internet", "green revolution", "multinational corporation", "human rights", "climate change", "United Nations", "European Union", "World Trade Organization"]],

  [/renaissance|humanism|exploration/, ["Renaissance", "humanism", "printing press", "Machiavelli", "Leonardo", "Michelangelo", "New Monarchs", "Columbus"]],
  [/reformation|protestant|catholic/, ["Martin Luther", "95 Theses", "Protestant Reformation", "Calvin", "predestination", "Council of Trent", "Jesuits", "Peace of Augsburg"]],
  [/absolutism|constitutionalism|state building/, ["absolutism", "divine right", "Louis XIV", "Versailles", "Parliament", "English Civil War", "Glorious Revolution", "Bill of Rights", "balance of power"]],
  [/scientific|philosophical|political/, ["Scientific Revolution", "Copernicus", "Galileo", "Newton", "empiricism", "Enlightenment", "Voltaire", "Rousseau", "Locke"]],
  [/conflict|crisis|reaction|napoleon|vienna|1848/, ["French Revolution", "Napoleon", "Congress of Vienna", "conservatism", "liberalism", "nationalism", "Revolutions of 1848"]],
  [/european integration|welfare|1989|contemporary europe/, ["Cold War", "European Union", "NATO", "welfare state", "Berlin Wall", "1989", "decolonization", "European integration"]],

  [/geographic|maps|scale|spatial|region/, ["scale", "projection", "GIS", "spatial association", "absolute location", "relative location", "region", "site", "situation"]],
  [/population|migration|demographic/, ["population pyramid", "demographic transition", "dependency ratio", "migration", "push factor", "pull factor", "refugee", "Ravenstein"]],
  [/culture|language|religion|diffusion|landscape/, ["culture", "language family", "dialect", "religion", "diffusion", "stimulus diffusion", "relocation diffusion", "cultural landscape"]],
  [/political|states|sovereignty|boundaries|devolution/, ["state", "sovereignty", "nation-state", "boundary", "gerrymandering", "devolution", "centripetal", "centrifugal", "supranationalism"]],
  [/agriculture|rural|food|land-use/, ["agriculture", "domestication", "subsistence", "commercial agriculture", "von Thunen", "Green Revolution", "carrying capacity"]],
  [/urban|cities|city|land use/, ["urbanization", "CBD", "bid-rent", "Burgess", "Hoyt", "edge city", "gentrification", "infrastructure"]],
  [/development|industrial|economic development/, ["GDP", "GNI", "HDI", "commodity chain", "outsourcing", "dependency theory", "sustainable development"]],

  [/scarcity|choice|tradeoff|opportunity/, ["scarcity", "opportunity cost", "tradeoff", "incentive", "marginal analysis", "production possibilities", "comparative advantage"]],
  [/demand|supply|market|equilibrium|elasticity/, ["demand", "supply", "equilibrium", "shortage", "surplus", "elasticity", "price ceiling", "price floor", "tax"]],
  [/production|cost|firm|competition|monopoly|oligopoly/, ["production", "cost", "marginal product", "perfect competition", "monopoly", "oligopoly", "game theory", "price discrimination"]],
  [/externalities|public goods|market failure|government action/, ["externality", "public good", "free rider", "deadweight loss", "tax", "subsidy", "regulation", "market failure"]],
  [/gdp|inflation|unemployment|business cycle|ad-as|macro/, ["GDP", "inflation", "unemployment", "business cycle", "aggregate demand", "aggregate supply", "recession", "stagflation"]],
  [/fiscal|monetary|money|banking|loanable|phillips/, ["fiscal policy", "monetary policy", "Federal Reserve", "money multiplier", "interest rate", "loanable funds", "Phillips curve", "crowding out"]],
  [/trade|exchange rates|balance of payments|international/, ["comparative advantage", "tariff", "quota", "exchange rate", "balance of payments", "capital flows", "exports", "imports"]],

  [/democratic ideals|principles|constitution|federalism|models of democracy/, ["limited government", "natural rights", "popular sovereignty", "republicanism", "federalism", "separation of powers", "checks and balances", "Federalist No. 10", "Brutus"]],
  [/congress|presidency|bureaucracy|judiciary|branches/, ["Congress", "president", "bureaucracy", "judiciary", "oversight", "advice and consent", "veto", "judicial review", "bureaucratic discretion"]],
  [/first amendment|due process|equal protection|civil rights|supreme court|liberties/, ["First Amendment", "prior restraint", "symbolic speech", "establishment clause", "due process", "equal protection", "selective incorporation", "Brown v. Board"]],
  [/political socialization|public opinion|ideology|polling|beliefs/, ["political socialization", "public opinion", "ideology", "sampling error", "liberal", "conservative", "political efficacy"]],
  [/voting|elections|parties|interest groups|campaigns|media|participation/, ["voting", "party", "interest group", "campaign", "media", "incumbency advantage", "realignment", "free-rider problem", "political action committee"]]
];

const CAPITAL_FIXES = [
  ["nazi", "Nazi"],
  ["soviet", "Soviet"],
  ["u.s.", "U.S."],
  ["french", "French"],
  ["german", "German"],
  ["japanese", "Japanese"],
  ["chinese", "Chinese"],
  ["sumerian", "Sumerian"],
  ["egyptian", "Egyptian"],
  ["mesopotamian", "Mesopotamian"],
  ["bolshevik", "Bolshevik"],
  ["islamic", "Islamic"],
  ["christian", "Christian"],
  ["buddhist", "Buddhist"],
  ["hindu", "Hindu"],
  ["roman", "Roman"],
  ["greek", "Greek"],
  ["european", "European"],
  ["african", "African"],
  ["arab", "Arab"],
  ["indian", "Indian"],
  ["west african", "West African"],
  ["cold War", "Cold War"]
];

const ANSWER_REPAIRS = new Map([
  ["steam engine", {
    clue: "Machine that turned heat and water power into factory and railroad power.",
    explanation: "Steam engine: It powered mines, textile factories, railroads, and steamships during industrialization."
  }],
  ["headright system", {
    clue: "Virginia land policy giving acres to settlers who paid for passage.",
    explanation: "Headright system: It encouraged colonial settlement by rewarding passage with land."
  }],
  ["indentured servitude", {
    clue: "Labor system in which migrants worked for years in exchange for passage.",
    explanation: "Indentured servitude: Workers exchanged years of labor for transportation and opportunity."
  }],
  ["rationalism", {
    clue: "Enlightenment approach that trusted reason as a path to knowledge.",
    explanation: "Rationalism: It emphasized reason and logic as sources of reliable knowledge."
  }],
  ["oasis", {
    clue: "Fertile desert area where underground water supports settlement.",
    explanation: "Oasis: Reliable water can support people, farming, and trade routes in arid regions."
  }],
  ["citizens united v fec", {
    clue: "Supreme Court case allowing independent election spending by corporations and unions.",
    explanation: "Citizens United v. FEC: The ruling treated independent political spending as protected speech."
  }],
  ["mode", {
    clue: "Most frequently occurring score in a data set.",
    explanation: "Mode: It is the value that appears most often."
  }],
  ["hippocampus", {
    clue: "Brain structure central to forming new long-term memories.",
    explanation: "Hippocampus: It helps encode new long-term memories."
  }]
]);

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

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function boardFolder(file) {
  const parts = file.split(/[\\/]/);
  return parts[1] || "";
}

function boardNumber(file) {
  return file.match(/\/(\d{2})\s+-\s+/)?.[1] || "99";
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function words(value) {
  return normalize(value).split(" ").filter(Boolean);
}

function importantWords(value) {
  return words(value).filter((word) => word.length >= 4 && !/^(unit|review|jeopardy|history|global|course|grade|period)$/i.test(word));
}

function hintTermsForCategory(categoryName) {
  const key = normalize(categoryName);
  const hints = new Set(importantWords(categoryName));
  for (const [matcher, terms] of CATEGORY_HINTS) {
    if (matcher.test(key)) {
      terms.forEach((term) => hints.add(term));
    }
  }
  return [...hints].filter(Boolean);
}

function clueSignal(clue) {
  return normalize([
    clue.answer,
    ...(clue.aliases || []),
    clue.clue,
    clue.explanation,
    clue.sourceClue,
    clue.sourceExplanation
  ].join(" "));
}

function termScore(signal, term) {
  const key = normalize(term);
  if (!key) return 0;
  if (signal.includes(key)) return Math.min(36, 8 + words(key).length * 6);
  const parts = words(key).filter((part) => part.length >= 5);
  if (!parts.length) return 0;
  const matched = parts.filter((part) => signal.includes(part)).length;
  return matched ? matched * 3 : 0;
}

function categoryFitScore(clue, categoryName, originalIndex, categoryIndex) {
  const signal = clueSignal(clue);
  let score = originalIndex === categoryIndex ? 2 : 0;
  for (const term of hintTermsForCategory(categoryName)) {
    score += termScore(signal, term);
  }
  return score;
}

function rebalanceCluesByCategory(game) {
  const categories = game.categories || [];
  if (categories.length !== 5 || categories.some((category) => !Array.isArray(category.clues))) return false;

  const entries = [];
  categories.forEach((category, originalIndex) => {
    (category.clues || []).forEach((clue, order) => entries.push({ clue, originalIndex, order }));
  });
  if (entries.length !== 25) return false;

  const pairs = [];
  entries.forEach((entry, entryIndex) => {
    categories.forEach((category, categoryIndex) => {
      pairs.push({
        entryIndex,
        categoryIndex,
        score: categoryFitScore(entry.clue, category.name, entry.originalIndex, categoryIndex)
      });
    });
  });
  const strongestScore = Math.max(...pairs.map((pair) => pair.score));
  if (strongestScore < 14) return false;

  const assignedEntries = new Set();
  const nextBuckets = categories.map(() => []);
  pairs.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aOriginal = entries[a.entryIndex].originalIndex === a.categoryIndex ? 1 : 0;
    const bOriginal = entries[b.entryIndex].originalIndex === b.categoryIndex ? 1 : 0;
    if (bOriginal !== aOriginal) return bOriginal - aOriginal;
    return entries[a.entryIndex].order - entries[b.entryIndex].order;
  });

  for (const pair of pairs) {
    if (assignedEntries.has(pair.entryIndex) || nextBuckets[pair.categoryIndex].length >= 5) continue;
    assignedEntries.add(pair.entryIndex);
    nextBuckets[pair.categoryIndex].push(entries[pair.entryIndex]);
  }

  for (const entry of entries) {
    const entryIndex = entries.indexOf(entry);
    if (assignedEntries.has(entryIndex)) continue;
    const originalBucket = nextBuckets[entry.originalIndex];
    const targetIndex = originalBucket.length < 5
      ? entry.originalIndex
      : nextBuckets.findIndex((bucket) => bucket.length < 5);
    if (targetIndex >= 0) {
      assignedEntries.add(entryIndex);
      nextBuckets[targetIndex].push(entry);
    }
  }

  let changed = false;
  const values = [100, 200, 300, 400, 500];
  nextBuckets.forEach((bucket, categoryIndex) => {
    bucket.sort((a, b) => {
      const valueDiff = Number(a.clue.value || 0) - Number(b.clue.value || 0);
      if (valueDiff !== 0) return valueDiff;
      return a.originalIndex - b.originalIndex || a.order - b.order;
    });
    const nextClues = bucket.map((entry, clueIndex) => {
      if (entry.originalIndex !== categoryIndex) changed = true;
      entry.clue.value = values[clueIndex];
      if (entry.clue.rigor) {
        entry.clue.rigor.value = values[clueIndex];
        entry.clue.rigor.skill = VALUE_SKILLS[values[clueIndex]];
      }
      return entry.clue;
    });
    categories[categoryIndex].clues = nextClues;
  });
  return changed;
}

function fallbackCategoryName(category, game, index) {
  const text = `${game.title} ${(category.clues || []).map((clue) => `${clue.answer} ${clue.clue}`).join(" ")}`.toLowerCase();
  const tests = [
    [/war|conflict|military|revolution|battle|crisis|genocide|holocaust/, "Conflict + Change"],
    [/constitution|amendment|court|law|government|federal|rights|policy|congress|president/, "Government + Law"],
    [/trade|market|econom|industrial|labor|capital|supply|demand|bank|money/, "Economy + Trade"],
    [/religion|culture|belief|language|social|society|identity|psychology|behavior/, "Society + Culture"],
    [/map|region|geography|urban|migration|population|city|land|environment/, "Geography + Place"],
    [/empire|king|queen|leader|president|thinker|reformer|people|person/, "People + Power"]
  ];
  for (const [regex, label] of tests) {
    if (regex.test(text)) return label;
  }
  return ["Foundations", "Turning Points", "Key Ideas", "Power + Change", "Course Connections"][index] || `Category ${index + 1}`;
}

function categoryBlueprint(meta, game) {
  const file = decodePath(meta.file || game.file || "");
  const folder = boardFolder(file);
  const number = boardNumber(file);
  return CATEGORY_BLUEPRINTS[folder]?.[number] || null;
}

function assignmentRepair(meta, game) {
  const file = decodePath(meta.file || game.file || "");
  return CATEGORY_ASSIGNMENT_REPAIRS[file] || null;
}

function applyAssignmentRepair(game, repair) {
  if (!repair) return false;
  const clueByAnswer = new Map();
  for (const category of game.categories || []) {
    for (const clue of category.clues || []) {
      clueByAnswer.set(normalize(clue.answer), clue);
    }
  }
  const values = [100, 200, 300, 400, 500];
  const nextCategories = repair.map((spec, categoryIndex) => {
    const previous = game.categories?.[categoryIndex] || {};
    const clues = spec.answers.map((answer, clueIndex) => {
      const clue = clueByAnswer.get(normalize(answer));
      if (!clue) throw new Error(`${game.title || game.slug}: missing Jeopardy repair answer "${answer}"`);
      clue.value = values[clueIndex];
      if (clue.rigor) {
        clue.rigor.value = values[clueIndex];
        clue.rigor.skill = VALUE_SKILLS[values[clueIndex]];
      }
      return clue;
    });
    return {
      ...previous,
      name: spec.name,
      sourceName: previous.sourceName || previous.name || "",
      clues
    };
  });
  game.categories = nextCategories;
  return true;
}

function boardFocus(meta, game) {
  const file = decodePath(meta.file || game.file || "");
  const folder = boardFolder(file);
  const number = boardNumber(file);
  const focusByFolder = {
    "apush": {
      "01": "Period 1",
      "02": "Period 2",
      "03": "Period 3",
      "04": "Period 4",
      "05": "Period 5",
      "06": "Period 6",
      "07": "Period 7",
      "08": "Period 8",
      "09": "Period 9",
      "99": "APUSH"
    },
    "ap-world-history": {
      "01": "Global Tapestry",
      "02": "Exchange Networks",
      "03": "Land Empires",
      "04": "Maritime Empires",
      "05": "Revolutions",
      "06": "Industrial Imperialism",
      "07": "Global Conflict",
      "08": "Cold War",
      "09": "Globalization",
      "99": "AP World"
    },
    "ap-european-history": {
      "01": "Renaissance",
      "02": "Reformation",
      "03": "State Power",
      "04": "Enlightenment",
      "05": "Revolution",
      "06": "Industrial Europe",
      "07": "Nationalism",
      "08": "World Wars",
      "09": "Modern Europe",
      "99": "AP Euro"
    },
    "ap-human-geography": {
      "01": "Geography Tools",
      "02": "Population",
      "03": "Culture",
      "04": "Political Geography",
      "05": "Agriculture",
      "06": "Cities",
      "07": "Development",
      "99": "Human Geography"
    },
    "ap-us-government": {
      "01": "Foundations",
      "02": "Branches",
      "03": "Civic Rights",
      "04": "Beliefs",
      "05": "Participation",
      "99": "AP Gov"
    },
    "ap-macroeconomics": {
      "01": "Macro Basics",
      "02": "Indicators",
      "03": "AD-AS",
      "04": "Financial Sector",
      "05": "Stabilization",
      "06": "Open Economy",
      "99": "Macro"
    },
    "ap-microeconomics": {
      "01": "Micro Basics",
      "02": "Supply + Demand",
      "03": "Firms",
      "04": "Market Structures",
      "05": "Factor Markets",
      "06": "Market Failure",
      "99": "Micro"
    },
    "ap-economics-combined": {
      "01": "Econ Foundations",
      "02": "Micro Markets",
      "03": "Econ Firms",
      "04": "Econ Market Failure",
      "05": "Macro Indicators",
      "06": "Econ Stabilization",
      "07": "International Econ",
      "99": "AP Economics"
    },
    "economics": {
      "01": "Decision Making",
      "02": "Markets",
      "03": "Personal Finance",
      "04": "Macroeconomics",
      "05": "Government Economy",
      "99": "Economics Course"
    },
    "civics-pig": {
      "01": "Government",
      "02": "Constitution",
      "03": "Rights",
      "04": "Elections",
      "05": "Public Policy",
      "99": "Civics"
    }
  };
  const mapped = focusByFolder[folder]?.[number];
  if (mapped) return mapped;
  const raw = clean(game.title || meta.title || meta.day || "Review")
    .replace(/\b(?:Jeopardy|Review|Unit|Cumulative|Yearlong|Final|Exam|Comprehensive)\b/gi, "")
    .replace(/\b\d{1,2}\b/g, "")
    .replace(/\s*[:\-–—]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = raw.split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
  return words || "Review";
}

function sourceSlotCategoryName(oldName, meta, game, index) {
  const key = normalize(oldName);
  const focus = boardFocus(meta, game);
  const shortFocus = focus.length > 22 ? focus.split(/\s+/).slice(0, 2).join(" ") : focus;
  const slotMap = new Map([
    ["people places", "People"],
    ["events laws", "Events"],
    ["ideas vocabulary", "Ideas"],
    ["government power", "Power"],
    ["society economy", "Society"],
    ["core concepts", "Core"],
    ["markets models", "Models"],
    ["policy institutions", "Institutions"],
    ["graphs indicators", "Data"],
    ["applications", "Practice"],
    ["principles", "Principles"],
    ["institutions", "Institutions"],
    ["rights cases", "Cases"],
    ["participation", "Practice"],
    ["policy power", "Policy"],
    ["spatial patterns", "Patterns"],
    ["population culture", "Population"],
    ["states land use", "Land Use"],
    ["cities development", "Cities"],
    ["models examples", "Models"],
    ["scarcity choices", "Choices"],
    ["markets prices", "Markets"],
    ["models graphs", "Graphs"],
    ["global applications", "Global"],
    ["foundations", "Foundations"],
    ["power government", "Power"],
    ["economy society", "Society"],
    ["conflict change", "Conflict"],
    ["modern connections", "Modern"],
    ["founding principles", "Principles"],
    ["branches federalism", "Branches"],
    ["elections media", "Elections"],
    ["policy participation", "Participation"]
  ]);
  let suffix = slotMap.get(key);
  if (!suffix) return "";
  const focusKey = normalize(shortFocus);
  if (normalize(suffix) === focusKey || focusKey.endsWith(` ${normalize(suffix)}`)) {
    suffix = {
      "power": "Authority",
      "population": "Structure",
      "cities": "Urban Form",
      "policy": "Action",
      "markets": "Prices",
      "models": "Examples",
      "institutions": "Systems",
      "principles": "Foundations"
    }[normalize(suffix)] || "Concepts";
  }
  const label = `${shortFocus} ${suffix}`.replace(/\s+/g, " ").trim();
  if (label.length <= 32) return label;
  const compact = `${shortFocus.split(/\s+/)[0]} ${suffix}`.replace(/\s+/g, " ").trim();
  return compact.length <= 32 ? compact : `${suffix} ${index + 1}`;
}

function shouldRenameCategories(game, meta) {
  const names = (game.categories || []).map((category) => category.name || "");
  if (names.some((name) => GENERIC_CATEGORY_RE.test(name))) return true;
  if (new Set(names.map(normalize)).size !== names.length) return true;
  const signature = names.map(normalize).join("|");
  return signature.includes("people places|events laws|ideas vocabulary");
}

function answerRepair(clue) {
  const answerKey = normalize(clue.answer);
  return ANSWER_REPAIRS.get(answerKey) || null;
}

function needsAnswerRepair(clue) {
  const text = `${clue.clue || ""} ${clue.explanation || ""}`;
  return /course-relevant development students must connect to evidence|Landmark case shaping rights, representation, or institutional power|Court case used to define constitutional meaning, rights, or government power/i.test(text);
}

function stripKnownLabelPrefixes(value, labels) {
  let output = clean(value);
  const cleanLabels = [...new Set([...labels, ...GENERIC_CATEGORY_NAMES].filter(Boolean).map(clean).filter((label) => label.length >= 3))];
  for (let pass = 0; pass < 4; pass += 1) {
    const before = output;
    for (const label of cleanLabels) {
      output = output.replace(new RegExp(`^${escapeRegExp(label)}\\s*[:\\-–—]\\s*`, "i"), "");
      output = output.replace(new RegExp(`^([^:]{1,90}:\\s*)${escapeRegExp(label)}\\s*:\\s*`, "i"), "$1");
    }
    if (before === output) break;
  }
  return clean(output);
}

function polishSentence(value, oldCategory, newCategory, extraLabels = []) {
  const labels = [oldCategory, newCategory, ...extraLabels].filter(Boolean);
  let output = clean(value);
  output = stripKnownLabelPrefixes(output, labels);
  output = output
    .replace(/,\s*tied to state power, exchange, or conflict/gi, "")
    .replace(/,\s*applied to behavior, research, or evidence/gi, "")
    .replace(/,\s*tied to institutions, rights, or policy outcomes/gi, "")
    .replace(/,\s*used to predict incentives, shifts, or welfare effects/gi, "")
    .replace(/,\s*used to explain spatial patterns across scale/gi, "")
    .replace(/,\s*tied to turning points or comparisons/gi, "")
    .replace(/,\s*used to analyze scenario-based behavior/gi, "")
    .replace(/,\s*used to connect rules and power/gi, "")
    .replace(/\s+tied to state power, exchange, or conflict/gi, "")
    .replace(/\s+applied to behavior, research, or evidence/gi, "")
    .replace(/\s+tied to institutions, rights, or policy outcomes/gi, "")
    .replace(/\s+used to predict incentives, shifts, or welfare effects/gi, "")
    .replace(/\s+used to explain spatial patterns across scale/gi, "")
    .replace(/\s+tied to turning points or comparisons/gi, "")
    .replace(/\s+used to analyze scenario-based behavior/gi, "")
    .replace(/\s+used to connect rules and power/gi, "")
    .replace(/\buse one specific example to explain why it matters\b/gi, "high-value review concept")
    .replace(/\bstate power, exchange, or conflict\b/gi, "historical change")
    .replace(/\s+/g, " ")
    .trim();
  output = stripKnownLabelPrefixes(output, labels);
  for (const [from, to] of CAPITAL_FIXES) {
    output = output.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "gi"), to);
  }
  output = output.replace(/^([a-z])/, (letter) => letter.toUpperCase());
  return /[.!?]$/.test(output) ? output : `${output}.`;
}

function rebuildBoard(game, meta) {
  const blueprint = categoryBlueprint(meta, game);
  const repair = assignmentRepair(meta, game);
  const rename = Boolean(blueprint) || shouldRenameCategories(game, meta);
  let changed = false;
  if (applyAssignmentRepair(game, repair)) {
    changed = true;
  }
  (game.categories || []).forEach((category, index) => {
    const oldName = category.name || "";
    const slotName = sourceSlotCategoryName(category.sourceName || oldName, meta, game, index);
    const newName = repair?.[index]?.name || (rename ? (blueprint?.[index] || slotName || fallbackCategoryName(category, game, index)) : oldName);
    if (newName && newName !== oldName) {
      category.sourceName = category.sourceName || oldName;
      category.name = newName;
      changed = true;
    }
    const labels = [oldName, category.name, category.sourceName, game.title, game.day, game.exam, meta.title, meta.course];
    for (const clue of category.clues || []) {
      const repair = answerRepair(clue);
      const rawClue = repair && needsAnswerRepair(clue) ? repair.clue : clue.clue;
      const rawExplanation = repair && (needsAnswerRepair(clue) || !clue.explanation) ? repair.explanation : (clue.explanation || `${clue.answer}: ${rawClue}`);
      const nextClue = polishSentence(rawClue, oldName, category.name, labels);
      const nextExplanation = polishSentence(rawExplanation, oldName, category.name, labels);
      if (nextClue !== clue.clue) {
        clue.clue = nextClue;
        changed = true;
      }
      if (nextExplanation !== clue.explanation) {
        clue.explanation = nextExplanation;
        changed = true;
      }
      if (clue.rigor) {
        const value = Number(clue.value);
        const nextSkill = VALUE_SKILLS[value] || clue.rigor.skill;
        if (clue.rigor.value !== value || clue.rigor.skill !== nextSkill || clue.rigor.categoryQuality !== "board-specific-category-v1") {
          clue.rigor.value = value;
          clue.rigor.skill = nextSkill;
          clue.rigor.categoryQuality = "board-specific-category-v1";
          changed = true;
        }
      }
    }
  });
  if (game.final) {
    const finalLabels = [game.title, game.day, game.exam, meta.title, meta.course];
    const finalCategory = polishSentence(game.final.category || "", "", "", finalLabels).replace(/[.!?]$/, "");
    const finalClue = polishSentence(game.final.clue || "", "", "", finalLabels);
    const finalExplanation = polishSentence(game.final.explanation || `${game.final.answer}: ${finalClue}`, "", "", finalLabels);
    if (finalCategory && finalCategory !== game.final.category) {
      game.final.category = finalCategory;
      changed = true;
    }
    if (finalClue !== game.final.clue) {
      game.final.clue = finalClue;
      changed = true;
    }
    if (finalExplanation !== game.final.explanation) {
      game.final.explanation = finalExplanation;
      changed = true;
    }
  }
  game.categoryHardeningVersion = "board-specific-categories-v1";
  return changed;
}

function main() {
  const gamesFile = resolve(root, "games.json");
  const games = JSON.parse(readFileSync(gamesFile, "utf8"));
  let boardCount = 0;
  let changedCount = 0;
  let manifestChanged = false;
  for (const meta of games.filter(isJeopardyManifestEntry)) {
    const file = resolve(root, decodePath(meta.file));
    if (!existsSync(file)) throw new Error(`Missing board file: ${meta.file}`);
    const original = readFileSync(file, "utf8");
    const game = extractGame(original, relative(root, file));
    boardCount += 1;
    const changed = rebuildBoard(game, meta);
    if (changed) {
      writeFileSync(file, replaceGame(original, game));
      changedCount += 1;
    }
    const categories = (game.categories || []).map((category) => category.name || "Review");
    if (JSON.stringify(meta.categories || []) !== JSON.stringify(categories)) {
      meta.categories = categories;
      manifestChanged = true;
    }
  }
  if (manifestChanged) {
    writeFileSync(gamesFile, `${JSON.stringify(games, null, 2)}\n`);
  }
  console.log(`Rebuilt Jeopardy categories/clue language on ${changedCount}/${boardCount} boards.`);
}

main();
