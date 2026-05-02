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
  "games/global-10-units/01 - World in 1750 Jeopardy Review.html": [
    { name: "Land-Based Empires", answers: ["Ottoman Empire", "Mughal Empire", "Qing China", "Akbar", "Janissaries"] },
    { name: "Absolute Monarchs", answers: ["Absolutism", "Divine right", "Louis XIV", "Versailles", "Peter the Great"] },
    { name: "Tokugawa Japan", answers: ["Tokugawa Japan", "Shogun", "Samurai", "Daimyo", "Isolationism"] },
    { name: "Trade Networks", answers: ["Silk Road", "Indian Ocean trade", "Silver trade", "Commercial Revolution", "Joint-stock company"] },
    { name: "Empire + Mercantilism", answers: ["Land-based empires", "Maritime empires", "Mercantilism", "Bourbon France", "Suleiman the Magnificent"] }
  ],
  "games/us-history-units/04 - Civil War and Reconstruction Jeopardy Review.html": [
    { name: "War Causes + Sides", answers: ["Secession", "Confederacy", "Union", "Fort Sumter", "Jefferson Davis"] },
    { name: "Battles + Strategy", answers: ["Anaconda Plan", "Battle of Antietam", "Gettysburg", "Vicksburg", "Sherman's March"] },
    { name: "War Leaders + End", answers: ["Abraham Lincoln", "Ulysses S. Grant", "Robert E. Lee", "Appomattox", "Total war"] },
    { name: "Reconstruction Amendments", answers: ["13th Amendment", "14th Amendment", "15th Amendment", "Radical Republicans", "Military Reconstruction"] },
    { name: "Reconstruction Society", answers: ["Freedmen's Bureau", "Black Codes", "Sharecropping", "Compromise of 1877", "Emancipation Proclamation"] }
  ],
  "games/apush/04 - Period 4 1800-1848 Jeopardy Review.html": [
    { name: "Democracy + Federal Power", answers: ["Jeffersonian democracy", "Jacksonian democracy", "Marbury v. Madison", "Nullification crisis", "Bank War"] },
    { name: "Market Revolution", answers: ["Market Revolution", "Erie Canal", "Lowell system", "State centralization", "Bureaucracy"] },
    { name: "Reform Movements", answers: ["Seneca Falls Convention", "Temperance movement", "Second Great Awakening", "Transcendentalism", "Cult of domesticity"] },
    { name: "Expansion + Native Policy", answers: ["Louisiana Purchase", "Indian Removal Act", "Worcester v. Georgia", "Trail of Tears", "Manifest Destiny"] },
    { name: "Slavery + Sectionalism", answers: ["Missouri Compromise", "Cotton gin", "Nat Turner's rebellion", "Abolitionism", "Monroe Doctrine"] }
  ],
  "games/ap-world-history/01 - Unit 1 The Global Tapestry Jeopardy Review.html": [
    { name: "East Asian Statecraft", answers: ["Song China", "Song dynasty bureaucracy", "Champa rice", "Tributary system", "Scholar-gentry"] },
    { name: "Belief Systems", answers: ["Confucianism", "Neo-Confucianism", "Mahayana Buddhism", "Hinduism", "Syncretism"] },
    { name: "Trade + Cities", answers: ["Trans-Saharan trade", "Indian Ocean trade", "Swahili city-states", "Srivijaya Empire", "Mansa Musa"] },
    { name: "Islamic + African States", answers: ["Abbasid Caliphate", "Dar al-Islam", "Mali Empire", "Great Zimbabwe", "Delhi Sultanate"] },
    { name: "Social Hierarchies", answers: ["Foot binding", "Feudalism", "Feudal Japan", "Byzantine Empire", "Hindu kingdoms"] }
  ],
  "games/global-9/06 - Social and Cultural Conflict Jeopardy Review.html": [
    { name: "Islam + South Asia", answers: ["Sunni-Shia split", "Caliph", "Delhi Sultanate", "Guru Nanak", "Sikhism"] },
    { name: "Christian Schisms + Crusades", answers: ["East-West Schism", "Pope Urban II", "Holy Land", "Crusades", "Seljuk Turks"] },
    { name: "Black Death", answers: ["Black Death", "Bubonic plague", "Quarantine", "Population decline", "Labor shortages"] },
    { name: "Plague Effects", answers: ["Peasant wages", "Guild disruption", "Long-term impact of plague", "Flagellant movement", "Anti-Jewish violence"] },
    { name: "Conflict + Exchange", answers: ["Religious conflict", "Pilgrimage", "Trade routes", "Cultural blending", "Scapegoating"] }
  ],
  "games/global-9/07 - Ottoman and Ming Worlds Jeopardy Review.html": [
    { name: "Ottoman Conquest", answers: ["Ottoman Empire", "Mehmed II", "Fall of Constantinople", "Janissaries", "Istanbul"] },
    { name: "Ottoman Government", answers: ["Devshirme", "Millet system", "Gunpowder empire", "Suleiman the Magnificent", "Sharia"] },
    { name: "Ming China", answers: ["Hongwu Emperor", "Forbidden City", "Ming Dynasty", "Zheng He", "Treasure ships"] },
    { name: "Foreign Contact", answers: ["Macau", "Jesuits", "Jesuit missionaries", "Matteo Ricci", "Silver trade"] },
    { name: "Isolation + Tribute", answers: ["Canton trade system", "Ming isolationism", "Isolation", "Tribute system", "Bureaucracy"] }
  ],
  "games/global-10-units/06 - Cold War 1945-1991 Jeopardy Review.html": [
    { name: "Cold War Europe", answers: ["Cold War", "Satellite nations", "Iron Curtain", "NATO", "Warsaw Pact"] },
    { name: "U.S. Containment", answers: ["Berlin Blockade", "Truman Doctrine", "Marshall Plan", "Containment", "Superpowers"] },
    { name: "Proxy Wars + Nonalignment", answers: ["Proxy war", "Korean War", "Vietnam War", "Nonalignment", "Detente"] },
    { name: "Nuclear + Space Tensions", answers: ["Arms race", "Space race", "Cuban Missile Crisis", "Sputnik", "Nuclear deterrence"] },
    { name: "Communism + Collapse", answers: ["Communism", "Capitalism", "Mao Zedong", "Chinese Communist Revolution", "Glasnost and perestroika"] }
  ],
  "games/us-regents-sprint/Day 4 - Presidents Reformers Movements Review Game.html": [
    { name: "Presidents: Early Era", answers: ["George Washington", "Thomas Jefferson", "James Monroe", "Andrew Jackson", "James K. Polk"] },
    { name: "Presidential Leadership", answers: ["Abraham Lincoln", "Theodore Roosevelt", "Franklin D. Roosevelt", "Lyndon B. Johnson", "Donald Trump"] },
    { name: "Reformer Lineup", answers: ["Frederick Douglass", "Jane Addams", "Elizabeth Cady Stanton and Susan B. Anthony", "Samuel Gompers", "W.E.B. Du Bois"] },
    { name: "Movements", answers: ["Abolition movement", "Women's suffrage movement", "Temperance / Prohibition movement", "Labor movement", "Progressive movement"] },
    { name: "Civil Rights and Identity", answers: ["Rosa Parks", "Martin Luther King Jr.", "Thurgood Marshall", "LGBTQ+ rights movement", "Second-wave feminism / women's liberation"] }
  ],
  "games/apush/05 - Period 5 1844-1877 Jeopardy Review.html": [
    { name: "Expansion + Slavery", answers: ["Manifest Destiny", "California Gold Rush", "Mexican-American War", "Wilmot Proviso", "Compromise of 1850"] },
    { name: "Sectional Crisis", answers: ["Kansas-Nebraska Act", "Popular sovereignty", "Free Soil ideology", "Dred Scott decision", "Dred Scott v. Sandford"] },
    { name: "Road to Civil War", answers: ["Lincoln-Douglas debates", "Bleeding Kansas", "Election of 1860", "Secession", "Emancipation Proclamation"] },
    { name: "Reconstruction Law", answers: ["13th Amendment", "14th Amendment", "15th Amendment", "Reconstruction Acts", "Freedmen's Bureau"] },
    { name: "War + Reconstruction Society", answers: ["Gettysburg", "State centralization", "Bureaucracy", "Sharecropping", "Black Codes"] }
  ],
  "games/apush/08 - Period 8 1945-1980 Jeopardy Review.html": [
    { name: "Cold War", answers: ["Truman Doctrine", "Marshall Plan", "Containment", "Korean War", "McCarthyism"] },
    { name: "Civil Rights", answers: ["Brown v. Board of Education", "Civil Rights Act of 1964", "Voting Rights Act of 1965", "Civil rights", "Black Power"] },
    { name: "Postwar Society", answers: ["Baby boom", "Suburbanization", "Sun Belt", "Liberal consensus", "Great Society"] },
    { name: "Vietnam + Protest", answers: ["Vietnam War", "Vietnam War protests", "War Powers Act", "Roe v. Wade", "Watergate"] },
    { name: "Reform + Government", answers: ["Feminist movement", "Second-wave feminism", "State centralization", "Bureaucracy", "Legal code"] }
  ],
  "games/ap-world-history/08 - Unit 8 Cold War and Decolonization Jeopardy Review.html": [
    { name: "Cold War Blocs", answers: ["Cold War", "NATO", "Warsaw Pact", "Cuban Missile Crisis", "Nuclear arms race"] },
    { name: "Decolonization", answers: ["Partition of India", "Decolonization", "Indian independence", "India Partition", "Migration to metropoles"] },
    { name: "Communism + Capitalism", answers: ["Containment", "Communist revolution", "Chinese Communist Revolution", "Korean War", "Vietnam War"] },
    { name: "Nonalignment + New Nations", answers: ["Nonalignment", "Non-Aligned Movement", "Pan-Africanism", "Algerian War", "Neocolonialism"] },
    { name: "Global Change", answers: ["United Nations", "Green Revolution", "Cuban Revolution", "Proxy wars", "Détente"] }
  ],
  "games/ap-world-history/07 - Unit 7 Global Conflict Jeopardy Review.html": [
    { name: "World War I Causes", answers: ["World War I", "MAIN causes", "Militarism", "Total war", "Home front mobilization"] },
    { name: "Peace + Interwar Crisis", answers: ["Treaty of Versailles", "League of Nations", "Self-determination", "Mandate system", "Great Depression"] },
    { name: "Revolution + Authoritarianism", answers: ["Russian Revolution", "Communism", "War communism", "Stalinist state", "Totalitarianism"] },
    { name: "World War II", answers: ["Appeasement", "World War II", "Japanese militarism", "Atomic bomb", "Rationing"] },
    { name: "Genocide + Propaganda", answers: ["Fascism", "Nazi Germany", "Holocaust", "Armenian Genocide", "Mass propaganda"] }
  ],
  "games/ap-european-history/04 - Unit 4 Scientific, Philosophical, and Political Developments Jeopardy Review.html": [
    { name: "Scientific Revolution", answers: ["Copernicus", "Scientific Revolution", "Galileo", "Newton", "Scientific academies"] },
    { name: "Enlightenment Thinkers", answers: ["Locke", "Montesquieu", "Rousseau", "Voltaire", "Enlightenment"] },
    { name: "Political Ideas", answers: ["Separation of powers", "Empiricism", "Rationalism", "Natural rights", "Popular sovereignty"] },
    { name: "Enlightened Absolutism", answers: ["Catherine the Great", "Frederick the Great", "Joseph II", "Enlightened absolutism", "Salons"] },
    { name: "Public Sphere + Print", answers: ["Consumer revolution", "Coffeehouses", "Public sphere", "Print culture", "Encyclopédie"] }
  ],
  "games/ap-us-government/03 - Unit 3 Civil Liberties and Civil Rights Jeopardy Review.html": [
    { name: "First Amendment", answers: ["Establishment clause", "Free exercise clause", "Schenck v. United States", "Tinker v. Des Moines", "New York Times v. United States"] },
    { name: "Due Process + Incorporation", answers: ["Due process clause", "Selective incorporation", "Exclusionary rule", "Wisconsin v. Yoder", "Engel v. Vitale"] },
    { name: "Equal Protection", answers: ["Equal protection clause", "14th Amendment", "Rational basis review", "Intermediate scrutiny", "Strict scrutiny"] },
    { name: "Civil Rights", answers: ["Brown v. Board of Education", "Civil Rights Act of 1964", "Voting Rights Act of 1965", "Voting Rights Act", "NAACP litigation strategy"] },
    { name: "Movements + Liberties", answers: ["Civil disobedience", "Grassroots organizing", "Social movements", "Civil liberties", "Civil rights"] }
  ],
  "games/ap-us-government/04 - Unit 4 Political Ideologies and Beliefs Jeopardy Review.html": [
    { name: "Political Socialization", answers: ["Political socialization", "Political party identification", "Generational effect", "Gender gap", "Political efficacy"] },
    { name: "Public Opinion + Polling", answers: ["Public opinion", "Scientific polling", "Opinion polling", "Random sample", "Margin of error"] },
    { name: "Ideology", answers: ["Political ideology", "Liberal ideology", "Conservative ideology", "Libertarian ideology", "Individualism"] },
    { name: "Economic Beliefs", answers: ["Supply-side economics", "Keynesian economics", "Monetary policy", "Monetary policy debate", "Tax policy"] },
    { name: "Policy Views", answers: ["Healthcare policy", "Social welfare policy", "Environmental policy", "Civil liberties priorities", "Equal opportunity"] }
  ],
  "games/ap-us-government/05 - Unit 5 Political Participation Jeopardy Review.html": [
    { name: "Voting + Elections", answers: ["Voter turnout", "Primary election", "Caucus", "Electoral College", "Winner-take-all system"] },
    { name: "Parties + Realignment", answers: ["Political party", "Party realignment", "Linkage institutions", "Mass media", "Political action committee"] },
    { name: "Interest Groups", answers: ["Interest group", "Lobbying", "Interest group lobbying", "Citizens United v. FEC", "Campaign finance"] },
    { name: "Campaign Strategy", answers: ["Retrospective voting", "Prospective voting", "Voter mobilization", "Campaign volunteers", "Horse-race journalism"] },
    { name: "Participation Cases", answers: ["Voting Rights Act", "Gerrymandering", "Incumbency advantage", "Shaw v. Reno", "Agenda setting"] }
  ],
  "games/economics/05 - Government and Global Economy Jeopardy Review.html": [
    { name: "Public Goods + Taxes", answers: ["Taxation", "Progressive taxation", "Progressive tax", "Public goods", "Social safety net"] },
    { name: "Fiscal + Indicators", answers: ["Fiscal policy", "Budget deficit", "Inflation rate", "Unemployment rate", "Exchange rate graph"] },
    { name: "Regulation + Trade Policy", answers: ["Externality", "Externalities", "Regulation", "Protectionism", "Trade policy"] },
    { name: "Global Trade", answers: ["International trade", "Tariff diagram", "Tariff", "Balance of payments", "Trade deficit"] },
    { name: "Global Economic Policy", answers: ["Comparative advantage", "Free trade agreement", "Globalization", "Exchange rate", "Exchange rates"] }
  ],
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

Object.assign(CATEGORY_ASSIGNMENT_REPAIRS, {
  "games/ap-psychology/01 - Research Methods Jeopardy Review.html": [
    { name: "Variables + Theory", answers: ["Operational definition", "Hypothesis", "Theory", "Independent variable", "Dependent variable"] },
    { name: "Experimental Control", answers: ["Confounding variable", "Random assignment", "Placebo effect", "Double-blind procedure", "Replication"] },
    { name: "Research Designs", answers: ["Experiment", "Correlation", "Case study", "Naturalistic observation", "Survey"] },
    { name: "Sampling + Ethics", answers: ["Random sample", "Population", "Sample", "Informed consent", "Inferential statistics"] },
    { name: "Descriptive Statistics", answers: ["Descriptive statistics", "Mean", "Median", "Mode", "Standard deviation"] }
  ],
  "games/ap-psychology/03 - Cognition Jeopardy Review.html": [
    { name: "Perception + Attention", answers: ["Bottom-up processing", "Top-down processing", "Selective attention", "Inattentional blindness", "Schema"] },
    { name: "Thinking + Biases", answers: ["Prototype", "Heuristic", "Algorithm", "Confirmation bias", "Availability heuristic"] },
    { name: "Memory Processes", answers: ["Encoding", "Storage", "Retrieval", "Working memory", "Long-term memory"] },
    { name: "Memory Strategies", answers: ["Rehearsal", "Spacing effect", "Testing effect", "Chunking", "Ebbinghaus forgetting curve"] },
    { name: "Memory Errors", answers: ["Elizabeth Loftus", "Misinformation effect", "Proactive interference", "Retroactive interference", "Representativeness heuristic"] }
  ],
  "games/ap-psychology/06 - Clinical and Positive Psychology Jeopardy Review.html": [
    { name: "Disorder Categories", answers: ["DSM-5-TR", "Anxiety disorders", "OCD", "PTSD", "Major depressive disorder"] },
    { name: "Mood + Psychosis", answers: ["Bipolar disorder", "Schizophrenia", "Delusions", "Hallucinations", "Medical model"] },
    { name: "Anxiety + Dissociation", answers: ["Generalized anxiety disorder", "Panic disorder", "Phobia", "Dissociative disorders", "Substance-use disorder"] },
    { name: "Therapies", answers: ["Cognitive-behavioral therapy", "Exposure therapy", "Psychotherapy", "Psychoanalysis", "Humanistic therapy"] },
    { name: "Personality + Well-Being", answers: ["Personality disorders", "Antisocial personality disorder", "Positive psychology", "Biopsychosocial approach", "Antidepressants"] }
  ],
  "games/global-10-units/02 - Enlightenment and Atlantic Revolutions Jeopardy Review.html": [
    { name: "Enlightenment Thinkers", answers: ["John Locke", "Montesquieu", "Voltaire", "Rousseau", "Mary Wollstonecraft"] },
    { name: "Enlightenment Ideas", answers: ["Scientific Revolution", "Salons", "Encyclopedia", "Natural rights", "Social contract"] },
    { name: "Revolutionary Documents", answers: ["Declaration of Independence", "Declaration of the Rights of Man", "Consent of the governed", "Separation of powers", "Checks and balances"] },
    { name: "French Revolution", answers: ["Third Estate", "Estates-General", "Tennis Court Oath", "Reign of Terror", "Napoleon"] },
    { name: "Atlantic Revolutions", answers: ["French Revolution", "Haitian Revolution", "Toussaint Louverture", "Simon Bolivar", "Nationalism"] }
  ],
  "games/global-10-units/05 - Global Conflict World War I to World War II Jeopardy Review.html": [
    { name: "World War I Causes", answers: ["Archduke Franz Ferdinand", "MAIN causes", "Militarism", "Alliances", "Imperialism"] },
    { name: "WWI + Revolution", answers: ["Trench warfare", "Treaty of Versailles", "Russian Revolution", "Lenin", "League of Nations"] },
    { name: "Interwar Crisis", answers: ["Nationalism", "Great Depression", "Weimar Republic", "Fascism", "Appeasement"] },
    { name: "Totalitarian States", answers: ["Mussolini", "Hitler", "Stalin", "Totalitarianism", "Nazi Party"] },
    { name: "World War II + Genocide", answers: ["Total war", "Propaganda", "Holocaust", "Nuremberg Laws", "Atomic bomb"] }
  ],
  "games/global-10-units/10 - Human Rights Violations Jeopardy Review.html": [
    { name: "Human Rights Law", answers: ["Genocide", "Universal Declaration of Human Rights", "Genocide Convention", "International Criminal Court", "Crimes against humanity"] },
    { name: "Holocaust + Nuremberg", answers: ["Holocaust", "Nuremberg Trials", "War crimes", "Bystanders", "Ethnic cleansing"] },
    { name: "Cambodia + Rwanda", answers: ["Khmer Rouge", "Cambodian Genocide", "Pol Pot", "Killing Fields", "Rwandan Genocide"] },
    { name: "Modern Atrocities", answers: ["Srebrenica", "Darfur", "Rohingya", "Hutu extremists", "Tutsi"] },
    { name: "Apartheid + State Terror", answers: ["Apartheid", "Truth and Reconciliation Commission", "Armenian Genocide", "Stalin's purges", "Gulag"] }
  ],
  "games/us-history-units/01 - Colonial Foundations Jeopardy Review.html": [
    { name: "Settlements + Regions", answers: ["Jamestown", "Plymouth", "Puritans", "Quakers", "Religious toleration"] },
    { name: "Colonial Government", answers: ["Mayflower Compact", "Virginia House of Burgesses", "Colonial self-government", "Town meetings", "House of Burgesses"] },
    { name: "Trade + Labor", answers: ["Mercantilism", "Triangular trade", "Middle Passage", "Cash crops", "Headright system"] },
    { name: "British Control", answers: ["Navigation Acts", "Salutary neglect", "French and Indian War", "Proclamation of 1763", "Stamp Act"] },
    { name: "Road to Revolution", answers: ["Bacon's Rebellion", "Albany Plan of Union", "Sons of Liberty", "Boston Massacre", "Boston Tea Party"] }
  ],
  "games/us-history-units/03 - Expansion and Reform Jeopardy Review.html": [
    { name: "Western Expansion", answers: ["Louisiana Purchase", "Lewis and Clark", "Oregon Trail", "Manifest Destiny", "Mexican-American War"] },
    { name: "Native Peoples", answers: ["Andrew Jackson", "Indian Removal Act", "Trail of Tears", "Cherokee Nation v. Georgia", "Worcester v. Georgia"] },
    { name: "Reform Movements", answers: ["Abolition movement", "Seneca Falls Convention", "Temperance movement", "Public education reform", "Declaration of Sentiments"] },
    { name: "Slavery + Sectionalism", answers: ["Cotton gin", "Sectionalism", "Missouri Compromise", "Compromise of 1850", "Election of 1860"] },
    { name: "Territorial Politics", answers: ["Monroe Doctrine", "Nullification crisis", "Texas annexation", "Mexican Cession", "Gadsden Purchase"] }
  ],
  "games/us-history-units/05 - Industrialization and the Gilded Age Jeopardy Review.html": [
    { name: "Industry + Railroads", answers: ["Transcontinental Railroad", "Bessemer process", "Corporation", "Monopoly", "Trust"] },
    { name: "Business Leaders + Ideas", answers: ["Andrew Carnegie", "John D. Rockefeller", "Vertical integration", "Horizontal integration", "Gospel of Wealth"] },
    { name: "Labor Unions", answers: ["Knights of Labor", "American Federation of Labor", "Samuel Gompers", "Collective bargaining", "Homestead Strike"] },
    { name: "Immigration + Cities", answers: ["Ellis Island", "Tenements", "Political machines", "Haymarket Affair", "Pullman Strike"] },
    { name: "Regulation + Farmers", answers: ["Sherman Antitrust Act", "Interstate Commerce Act", "Populism", "Social Darwinism", "Laissez-faire"] }
  ],
  "games/us-history-units/10 - Civil Rights Jeopardy Review.html": [
    { name: "Courts + Segregation", answers: ["Brown v. Board of Education", "Little Rock Nine", "Jim Crow laws", "De jure segregation", "De facto segregation"] },
    { name: "Direct Action", answers: ["Montgomery Bus Boycott", "Sit-ins", "Freedom Riders", "Birmingham Campaign", "March on Washington"] },
    { name: "Civil Rights Leaders", answers: ["Martin Luther King Jr.", "Rosa Parks", "Thurgood Marshall", "NAACP", "SCLC"] },
    { name: "Voting + Federal Laws", answers: ["Civil Rights Act of 1964", "Voting Rights Act of 1965", "24th Amendment", "Freedom Summer", "Selma to Montgomery March"] },
    { name: "Movement Strategy", answers: ["Black Power", "SNCC", "CORE", "Civil disobedience", "Letter from Birmingham Jail"] }
  ],
  "games/us-regents-sprint/Day 2 - Amendments Documents Laws Review Game.html": [
    { name: "Amendment Match", answers: ["Bill of Rights", "13th Amendment", "14th Amendment", "15th Amendment", "16th, 17th, 18th, and 19th Amendments"] },
    { name: "Rights + Process", answers: ["Incorporation", "Equal Protection Clause", "24th Amendment", "26th Amendment", "Three-fourths of the states"] },
    { name: "Major Documents", answers: ["Declaration of Independence", "Federalist Papers", "Monroe Doctrine", "Emancipation Proclamation", "Letter from Birmingham Jail"] },
    { name: "Landmark Laws", answers: ["Homestead Act", "Alien and Sedition Acts", "Chinese Exclusion Act", "Sherman Antitrust Act", "Social Security Act"] },
    { name: "Modern Rights Laws", answers: ["Civil Rights Act of 1964", "Voting Rights Act of 1965", "Hart-Celler Immigration Act", "Americans with Disabilities Act", "Affordable Care Act"] }
  ],
  "games/us-regents-sprint/Day 3 - Foreign Policy Wars Review Game.html": [
    { name: "Doctrines", answers: ["Permanent alliances", "Monroe Doctrine", "Manifest Destiny", "Open Door Policy", "Big Stick diplomacy"] },
    { name: "Cold War Strategy", answers: ["Containment", "Truman Doctrine", "Marshall Plan", "NATO", "Detente"] },
    { name: "Cold War Flashpoints", answers: ["Berlin Blockade", "Cuban Missile Crisis", "Korean War", "INF Treaty", "United Nations"] },
    { name: "Wars: 1812 to WWI", answers: ["War of 1812", "Mexican-American War", "Spanish-American War", "World War I", "Emancipation Proclamation"] },
    { name: "Wars: WWII to Modern", answers: ["Pearl Harbor", "Gulf of Tonkin Resolution", "Gulf War", "War on Terror", "Korematsu v. United States"] }
  ],
  "games/apush/01 - Period 1 1491-1607 Jeopardy Review.html": [
    { name: "Native Societies", answers: ["Native American societies", "Mississippian culture", "Great Plains societies", "Pueblo communities", "Maize agriculture"] },
    { name: "Indigenous Culture", answers: ["Iroquois Confederacy", "Kinship networks", "Reciprocity", "Animism", "Cultural adaptation"] },
    { name: "European Encounters", answers: ["Smallpox", "Smallpox epidemics", "Treaty of Tordesillas", "European imperial rivalry", "Columbian Exchange"] },
    { name: "Labor + Colonies", answers: ["Mercantilism", "Encomienda system", "Atlantic slavery", "Joint-stock company", "Spanish colonization"] },
    { name: "Spanish Borderlands", answers: ["Pueblo Revolt", "Casta system", "Atlantic World", "Spanish mission system", "Maize cultivation"] }
  ],
  "games/apush/07 - Period 7 1890-1945 Jeopardy Review.html": [
    { name: "Progressive Era", answers: ["Muckrakers", "Muckraking", "Progressivism", "Federal Reserve Act", "State centralization"] },
    { name: "Imperialism + WWI", answers: ["Open Door Policy", "Imperialism", "Roosevelt Corollary", "Spanish-American War", "World War I"] },
    { name: "1920s Culture + Tensions", answers: ["Harlem Renaissance", "Great Migration", "Scopes Trial", "Red Scare", "Isolationism"] },
    { name: "Depression + New Deal", answers: ["Stock market crash", "Great Depression", "Dust Bowl", "New Deal", "Social Security Act"] },
    { name: "World Wars + Civil Liberties", answers: ["Pearl Harbor", "Executive Order 9066", "Korematsu v. United States", "Treaty of Versailles", "Espionage Act"] }
  ],
  "games/ap-world-history/02 - Unit 2 Networks of Exchange Jeopardy Review.html": [
    { name: "Silk Roads", answers: ["Silk Roads", "Silk Roads luxury trade", "Caravanserai", "Pax Mongolica", "Marco Polo"] },
    { name: "Indian Ocean", answers: ["Indian Ocean monsoon trade", "Indian Ocean trade", "Swahili city-states", "Diasporic communities", "Sufi missionaries"] },
    { name: "Trans-Saharan Routes", answers: ["Trans-Saharan trade", "Trans-Saharan gold-salt trade", "Mali Empire", "Delhi Sultanate", "Italian city-states"] },
    { name: "Mongol + Cultural Exchange", answers: ["Mongol Empire", "Yuan dynasty", "Khanates", "Cultural diffusion", "Syncretic culture"] },
    { name: "Disease + Technology", answers: ["Black Death", "Paper money", "Flying cash", "Credit systems", "Bills of exchange"] }
  ],
  "games/economics/02 - Markets and Prices Jeopardy Review.html": [
    { name: "Demand", answers: ["Demand", "Demand curve shift", "Substitute goods", "Complement goods", "Cross-price elasticity"] },
    { name: "Supply", answers: ["Supply", "Supply curve shift", "Elasticity", "Surplus", "Shortage"] },
    { name: "Prices + Equilibrium", answers: ["Equilibrium price", "Price ceiling", "Price floor", "Binding price ceiling", "Binding price floor"] },
    { name: "Competition + Policy", answers: ["Competition", "Monopoly", "Antitrust law", "Excise tax", "Subsidy"] },
    { name: "Elasticity + Choice", answers: ["Normal goods", "Inferior goods", "Consumer choice", "Elastic demand", "Inelastic demand"] }
  ],
  "games/global-regents-sprint/Day 4 - Current Issues Names 1-42 Review Game.html": [
    { name: "Current Global Issues", answers: ["Globalization", "Deforestation", "Pandemic", "Nuclear proliferation", "Nuclear-armed states"] },
    { name: "Global Responses", answers: ["Paris Agreement", "Mexico", "Nuclear Non-Proliferation Treaty", "European Union", "Belt and Road Initiative"] },
    { name: "Reformation + Enlightenment", answers: ["Martin Luther", "Galileo Galilei", "Louis XIV", "John Locke", "Montesquieu"] },
    { name: "Revolution + Reform", answers: ["Maximilien Robespierre", "Toussaint L'Ouverture", "Simon Bolivar", "Karl Marx", "Otto von Bismarck"] },
    { name: "20th-Century Leaders", answers: ["Mahatma Gandhi", "Joseph Stalin", "Deng Xiaoping", "Mao Zedong", "Nelson Mandela"] }
  ],
  "games/us-regents-sprint/Day 5 - Modern Issues Miscellaneous Review Game.html": [
    { name: "Modern Rights", answers: ["Affordable Care Act", "Obergefell v. Hodges", "Dobbs v. Jackson Women's Health Organization", "Students for Fair Admissions v. Harvard", "District of Columbia v. Heller"] },
    { name: "Immigration + Access", answers: ["Chinese Exclusion Act", "National Origins Quota Acts", "DACA", "Hart-Celler Act", "Americans with Disabilities Act"] },
    { name: "Industry + Regulation", answers: ["Cotton gin", "Horizontal integration", "Federal Reserve System", "Relief, Recovery, Reform", "Dodd-Frank Act"] },
    { name: "Government Structure", answers: ["Commander-in-chief", "Senate", "House of Representatives", "Unwritten Constitution", "Commerce Clause"] },
    { name: "Civil War + Reconstruction", answers: ["Missouri Compromise", "Compromise of 1850", "Kansas-Nebraska Act", "Compromise of 1877", "13th, 14th, and 15th Amendments"] }
  ]
});

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
  [/modern conflicts|global conflicts/, ["Partition of India", "Arab-Israeli conflict", "The Troubles", "Persian Gulf War", "Chechnya"]],
  [/immigration access|identity access|access/, ["Americans with Disabilities Act", "DACA", "Hart-Celler Act", "Chinese Exclusion Act", "National Origins Quota Acts", "disability rights", "access"]],
  [/colonization|colonial systems/, ["Colony", "New Spain", "New France", "Encomienda system", "Plantation", "colonial settlement"]],
  [/democratic systems/, ["Representative democracy", "Federal system", "Parliament", "President", "Separation of powers"]],
  [/early americas/, ["Migration", "Beringia", "Maize", "Civilization", "Aztec"]],
  [/population land use|population \+ land use/, ["Population density", "River valley", "Urban center", "Pastoralism", "Oasis"]],
  [/resources economies|resources \+ economies/, ["Natural resource", "Oil reserve", "Arable land", "Trade route", "Economic activity"]],
  [/neolithic change/, ["Neolithic Revolution", "Domestication", "Agriculture", "Permanent settlement", "Surplus food"]],
  [/conflict contact|conflict \+ contact/, ["Crusades", "Holy Land", "Pilgrimage", "Cultural blending", "Mediterranean trade"]],
  [/travel technology|travel \+ technology/, ["Caravan", "Camel saddle", "Monsoon winds", "Lateen sail", "Compass"]],
  [/imperial conflict/, ["French and Indian War", "Albany Plan of Union", "Treaty of Paris 1763", "Proclamation of 1763", "Pontiac Rebellion"]],
  [/early tests/, ["Washington precedent", "Hamilton financial plan", "Whiskey Rebellion", "Neutrality Proclamation", "Political parties"]],
  [/election secession|election \+ secession/, ["Abraham Lincoln", "Republican Party", "Secession", "Confederacy", "Fort Sumter"]],
  [/^effects$/, ["Total war", "Habeas corpus suspension", "13th Amendment", "Assassination of Lincoln", "Reconstruction"]],
  [/new territories/, ["Puerto Rico", "Guam", "Philippines", "Annexation of Hawaii", "Platt Amendment"]],
  [/pacific latin america|pacific \+ latin america/, ["Open Door Policy", "Panama Canal", "Roosevelt Corollary", "Dollar diplomacy", "Sphere of influence"]],
  [/u s entry|u\.s\. entry|us entry/, ["Neutrality", "Unrestricted submarine warfare", "Lusitania", "Zimmermann Telegram", "Declaration of war 1917"]],
  [/proxy conflicts/, ["Korean War", "Vietnam War", "Domino theory", "Cuban Missile Crisis", "Proxy war"]],
  [/voting equality|voting \+ equality/, ["Voting Rights Act of 1965", "24th Amendment", "Freedom Riders", "Little Rock Nine", "March on Washington"]],
  [/cold war change|cold war \+ change/, ["Cold War", "Containment", "Vietnam War", "Globalization", "Baby boom"]],
  [/civil war$/, ["Sectionalism", "Kansas-Nebraska Act", "Secession", "Gettysburg", "13th Amendment"]],
  [/absolute|absolut|monarch|ruler|bourbon|louis|versailles|divine right/, ["absolutism", "absolute monarchy", "divine right", "Louis XIV", "Versailles", "Bourbon France", "Peter the Great", "czar"]],
  [/land-based empire|gunpowder empire|ottoman|mughal|safavid/, ["Ottoman Empire", "Mughal Empire", "Safavid Empire", "Akbar", "Suleiman the Magnificent", "Janissaries", "land-based empires", "gunpowder empire"]],
  [/tokugawa|japan|shogun|samurai|daimyo/, ["Tokugawa Japan", "shogun", "samurai", "daimyo", "isolationism", "Japan"]],
  [/qing|china|ming|asian states|east asia/, ["Qing China", "Ming Dynasty", "Canton trade", "Mandate of Heaven", "China", "East Asia"]],
  [/colonies|mercantilism|mercantilist|joint-stock|atlantic economy/, ["mercantilism", "joint-stock company", "colonies", "maritime empires", "Atlantic economy", "Commercial Revolution", "raw materials", "colonial markets"]],
  [/trade networks|silk|indian ocean|trans-saharan|silver|global trade/, ["Silk Road", "Silk Roads", "Indian Ocean trade", "Trans-Saharan trade", "silver trade", "trade network", "caravan", "monsoon", "gold-salt trade"]],
  [/native policy|native nations|native societies|indigenous|removal|cherokee|iroquois|haudenosaunee|pueblo/, ["Native American", "Indigenous", "Iroquois Confederacy", "Haudenosaunee", "Pueblo", "Cherokee", "Indian Removal Act", "Trail of Tears", "Worcester v. Georgia", "Pueblo Revolt", "removal"]],
  [/democracy|parties|early republic|federal power|courts|judicial|constitutional principles/, ["Jeffersonian democracy", "Jacksonian democracy", "Marbury v. Madison", "Bank War", "political parties", "Federalists", "Democratic-Republicans", "judicial review", "nullification", "federal power"]],
  [/market revolution|market integration|transportation|industry|railroad|canal|factory|wage labor/, ["Market Revolution", "market integration", "Erie Canal", "Lowell system", "textile factory", "wage labor", "commercial farming", "canal", "railroad", "factory system"]],
  [/slavery|sectional|sectionalism|slave|free soil/, ["slavery", "Cotton gin", "Nat Turner's rebellion", "Missouri Compromise", "Compromise of 1850", "Fugitive Slave Act", "Kansas-Nebraska Act", "Dred Scott", "sectionalism", "popular sovereignty", "Free Soil"]],
  [/reform movements|reform roots|progressive reform|rights movements/, ["Seneca Falls Convention", "abolitionism", "temperance movement", "Second Great Awakening", "transcendentalism", "women's rights", "public education reform", "muckrakers", "settlement house"]],
  [/overseas expansion|imperial policies|imperialism|spanish-american|philippine|panama|open door|roosevelt corollary/, ["Spanish-American War", "yellow journalism", "Alfred Thayer Mahan", "Philippine-American War", "Panama Canal", "Roosevelt Corollary", "Open Door Policy", "Platt Amendment", "Dollar diplomacy", "Big Stick diplomacy"]],
  [/world war i|wwi|great war|zimmermann|lusitania|versailles|red scare|fourteen points/, ["World War I", "Lusitania", "Zimmermann Telegram", "Treaty of Versailles", "Fourteen Points", "League of Nations", "First Red Scare", "trench warfare"]],
  [/civil war causes|sectional crisis|election secession|slavery expansion crisis/, ["sectionalism", "states' rights", "Missouri Compromise", "Compromise of 1850", "Kansas-Nebraska Act", "Dred Scott", "John Brown", "Election of 1860", "secession"]],
  [/civil war turning points|major battles|war for independence|civil war(?!.*reconstruction)/, ["Fort Sumter", "Union", "Confederacy", "Emancipation Proclamation", "Antietam", "Gettysburg", "Vicksburg", "Appomattox", "Ulysses S. Grant", "Robert E. Lee", "Anaconda Plan", "total war"]],
  [/reconstruction amendments|reconstruction politics|reconstruction society|end of reconstruction|rebuilding plans/, ["13th Amendment", "14th Amendment", "15th Amendment", "Freedmen's Bureau", "Black Codes", "sharecropping", "Reconstruction Acts", "carpetbagger", "scalawag", "Compromise of 1877"]],
  [/cold war europe|origins|iron curtain|satellite|berlin/, ["Iron Curtain", "satellite nations", "Berlin Blockade", "Berlin Airlift", "NATO", "Warsaw Pact", "Marshall Plan", "Truman Doctrine"]],
  [/u\.s\. soviet|soviet policies|containment|doctrines|strategy/, ["containment", "Truman Doctrine", "Marshall Plan", "detente", "brinkmanship", "massive retaliation", "Cuban Missile Crisis", "superpowers"]],
  [/proxy wars|proxy conflicts|korea|vietnam|afghanistan|nonalignment/, ["Korean War", "Vietnam War", "Afghanistan", "proxy war", "Nonalignment", "Ho Chi Minh", "Korea", "Vietnam"]],
  [/nuclear|space race|arms race|sputnik|missile/, ["arms race", "nuclear weapons", "Cuban Missile Crisis", "Sputnik", "space race", "ICBM", "mutually assured destruction"]],
  [/digital|interdependence|internet|social media|multinational/, ["Globalization", "Internet", "social media", "interdependence", "multinational corporation", "digital", "communication technology"]],
  [/climate|environment|sustainable|greenhouse|kyoto|paris/, ["Climate change", "Paris Agreement", "greenhouse gases", "Kyoto Protocol", "sustainable development", "environment"]],
  [/constitutional changes|amendment match|ratification debate|articles problems/, ["16th Amendment", "17th Amendment", "18th Amendment", "19th Amendment", "referendum", "amendment process", "limited government", "republicanism", "checks and balances"]],
  [/campaign strategy|campaigns/, ["retrospective voting", "prospective voting", "voter mobilization", "campaign volunteers", "horse-race journalism", "campaign strategy"]],
  [/belief systems|religion concepts|belief \+ rule/, ["Neo-Confucianism", "Confucianism", "Hinduism", "Buddhism", "Mahayana Buddhism", "syncretism", "dharma", "karma"]],
  [/ideas \+ disease|ideas disease|diffusion|spread/, ["cultural diffusion", "Islam spread", "Buddhism spread", "monsoon winds", "pandemic", "Black Death", "spread"]],
  [/travelers \+ cities|travelers cities|travel \+ technology/, ["Timbuktu", "Great Zimbabwe", "Swahili Coast", "lateen sail", "compass", "Ibn Battuta", "Marco Polo", "caravan"]],
  [/global institutions|international cooperation|united nations/, ["United Nations", "NATO", "Warsaw Pact", "Non-Aligned Movement", "Green Revolution", "nuclear arms race", "global institutions"]],
  [/plague effects|black death/, ["Black Death", "bubonic plague", "labor shortages", "peasant wages", "guild disruption", "flagellant movement", "Anti-Jewish violence", "population decline", "quarantine"]],
  [/foreign contact|isolation tribute|isolation \+ tribute/, ["Macau", "Jesuits", "Jesuit missionaries", "Matteo Ricci", "Canton trade system", "Ming isolationism", "Isolation", "Tribute system", "Bureaucracy"]],
  [/u\.s\. containment|containment/, ["Berlin Blockade", "Truman Doctrine", "Marshall Plan", "Containment", "Superpowers", "Detente"]],
  [/communism collapse|communism capitalism|communism \+ collapse|communism \+ capitalism/, ["Communism", "Capitalism", "Mao Zedong", "Chinese Communist Revolution", "Glasnost and perestroika", "Korean War", "Vietnam War"]],
  [/road to civil war|war reconstruction society|war \+ reconstruction society/, ["Lincoln-Douglas debates", "Bleeding Kansas", "Election of 1860", "Secession", "Emancipation Proclamation", "Gettysburg", "state centralization", "bureaucracy"]],
  [/social hierarchies|social hierarchy/, ["Foot binding", "Feudalism", "Feudal Japan", "Hindu kingdoms", "Byzantine Empire", "caste system"]],
  [/nonalignment|new nations|global change/, ["Nonalignment", "Non-Aligned Movement", "Pan-Africanism", "Algerian War", "Neocolonialism", "Détente", "United Nations"]],
  [/political ideas|public sphere|print/, ["Separation of powers", "Empiricism", "Rationalism", "Natural rights", "Popular sovereignty", "Encyclopédie", "public sphere", "print culture", "coffeehouses"]],
  [/equal protection|movements liberties|movements \+ liberties/, ["Equal protection clause", "14th Amendment", "Rational basis review", "Intermediate scrutiny", "Strict scrutiny", "Civil disobedience", "Grassroots organizing", "Social movements", "Civil liberties", "Civil rights"]],
  [/landmark laws|major documents/, ["26th Amendment", "Civil Rights Act of 1964", "Americans with Disabilities Act", "Social Security Act", "Hart-Celler Immigration Act"]],
  [/externalities regulation|regulation trade policy|trade policy/, ["Externality", "Externalities", "Regulation", "Protectionism", "Trade policy", "market failure", "government policy"]],
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
  const signalWords = words(signal);
  const matched = parts.filter((part) => {
    if (signal.includes(part)) return true;
    if (part.length < 7) return false;
    const stem = part.replace(/(?:ism|ist|tion|sion|ment|ing|ed|al|ic|s)$/i, "").slice(0, 7);
    return stem.length >= 6 && signalWords.some((word) => word.length >= 6 && (word.startsWith(stem) || stem.startsWith(word.slice(0, 7))));
  }).length;
  return matched ? matched * 3 : 0;
}

export function categoryFitScore(clue, categoryName, originalIndex = -1, categoryIndex = -1) {
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

  const scoreMatrix = entries.map((entry) => categories.map((category, categoryIndex) =>
    categoryFitScore(entry.clue, category.name, entry.originalIndex, categoryIndex)
  ));
  const strongestScore = Math.max(...scoreMatrix.flat());
  if (strongestScore < 14) return false;

  let states = new Map([["0,0,0,0,0", { score: 0, picks: [] }]]);
  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const nextStates = new Map();
    for (const [key, state] of states) {
      const counts = key.split(",").map(Number);
      for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
        if (counts[categoryIndex] >= 5) continue;
        const nextCounts = counts.slice();
        nextCounts[categoryIndex] += 1;
        const nextKey = nextCounts.join(",");
        const nextScore = state.score + scoreMatrix[entryIndex][categoryIndex];
        const existing = nextStates.get(nextKey);
        if (!existing || nextScore > existing.score) {
          nextStates.set(nextKey, {
            score: nextScore,
            picks: [...state.picks, categoryIndex]
          });
        }
      }
    }
    states = nextStates;
  }

  const solution = states.get("5,5,5,5,5");
  if (!solution) return false;
  const nextBuckets = categories.map(() => []);
  solution.picks.forEach((categoryIndex, entryIndex) => {
    nextBuckets[categoryIndex].push(entries[entryIndex]);
  });

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

export function dailyDoublePosition(game, meta = {}) {
  const key = `${game.slug || ""}|${meta.file || game.file || ""}|${game.title || ""}`;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const values = [300, 400, 500];
  return {
    categoryIndex: Math.abs(hash) % 5,
    value: values[Math.abs(hash >>> 8) % values.length]
  };
}

function assignDailyDouble(game, meta) {
  if (!Array.isArray(game.categories) || game.categories.length !== 5) return false;
  const target = dailyDoublePosition(game, meta);
  let changed = false;
  for (let categoryIndex = 0; categoryIndex < game.categories.length; categoryIndex += 1) {
    for (const clue of game.categories[categoryIndex].clues || []) {
      const shouldBeDaily = categoryIndex === target.categoryIndex && Number(clue.value) === target.value;
      if (Boolean(clue.daily) !== shouldBeDaily) {
        if (shouldBeDaily) clue.daily = true;
        else delete clue.daily;
        changed = true;
      }
    }
  }
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

function clueLookupByAnswer(game) {
  const clueByAnswer = new Map();
  for (const category of game.categories || []) {
    for (const clue of category.clues || []) {
      for (const answer of [clue.answer, ...(clue.aliases || [])]) {
        const key = normalize(answer);
        if (key && !clueByAnswer.has(key)) clueByAnswer.set(key, clue);
      }
    }
  }
  return clueByAnswer;
}

function manifestAssignmentPlan(meta, game) {
  const categories = (meta.categories || (game.categories || []).map((category) => category.name)).filter(Boolean);
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  if (categories.length !== 5 || tags.length < 25) return null;
  if (categories.some((name) => GENERIC_CATEGORY_RE.test(name))) return null;

  const normalizedTags = tags.map(normalize);
  const categoryIndexes = categories.map((name) => normalizedTags.indexOf(normalize(name)));
  if (categoryIndexes.some((index) => index < 0)) return null;
  for (let index = 1; index < categoryIndexes.length; index += 1) {
    if (categoryIndexes[index] <= categoryIndexes[index - 1]) return null;
  }

  const clueByAnswer = clueLookupByAnswer(game);
  const used = new Set();
  const plan = [];
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
    const start = categoryIndexes[categoryIndex] + 1;
    const end = categoryIndex < categories.length - 1 ? categoryIndexes[categoryIndex + 1] : tags.length;
    const answers = [];
    for (const tag of tags.slice(start, end)) {
      const clue = clueByAnswer.get(normalize(tag));
      const key = normalize(clue?.answer);
      if (!clue || used.has(key)) continue;
      answers.push(clue.answer);
      used.add(key);
    }
    if (answers.length !== 5) return null;
    plan.push({ name: categories[categoryIndex], answers, source: "manifest-tags" });
  }
  return plan;
}

export function expectedCategoryAnswerPlan(meta, game) {
  const explicitRepair = assignmentRepair(meta, game);
  if (explicitRepair) {
    return explicitRepair.map((spec) => ({ ...spec, source: "explicit-repair" }));
  }
  return manifestAssignmentPlan(meta, game);
}

function applyAssignmentRepair(game, repair) {
  if (!repair) return false;
  const clueByAnswer = clueLookupByAnswer(game);
  const values = [100, 200, 300, 400, 500];
  const nextCategories = repair.map((spec, categoryIndex) => {
    const { sourceName, ...previous } = game.categories?.[categoryIndex] || {};
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
  const assignmentPlan = expectedCategoryAnswerPlan(meta, game);
  const rename = Boolean(blueprint) || shouldRenameCategories(game, meta);
  let changed = false;
  if (applyAssignmentRepair(game, assignmentPlan)) {
    changed = true;
  }
  (game.categories || []).forEach((category, index) => {
    const oldName = category.name || "";
    const slotName = sourceSlotCategoryName(category.sourceName || oldName, meta, game, index);
    const newName = assignmentPlan?.[index]?.name || (rename ? (blueprint?.[index] || slotName || fallbackCategoryName(category, game, index)) : oldName);
    if (newName && newName !== oldName) {
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
    if ("sourceName" in category) {
      delete category.sourceName;
      changed = true;
    }
  });
  if (!assignmentPlan && rebalanceCluesByCategory(game)) {
    changed = true;
  }
  if (assignDailyDouble(game, meta)) {
    changed = true;
  }
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

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  main();
}
