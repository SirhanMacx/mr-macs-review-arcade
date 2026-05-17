/* ===========================================================================
   Crossword Cabinet — Daily-style crossword puzzles · Mr. Mac's Review Arcade
   Vanilla JS · DOM grid · 12x12 · curated history/civics/science clue bank
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "crossword-cabinet";
  var GAME_TITLE = "Crossword Cabinet";

  var GRID_SIZE = 12;
  var BLACK = "#";

  // Scoring / lives
  var LIVES_INIT = 3;
  var FAIL_THRESHOLD = 500;          // puzzle counts as failed if score below
  var PUZZLE_BASE = 12 * 12;         // 144 base
  var MISTAKE_PENALTY = 10;
  var TIME_BONUS_PER_SEC_LEFT = 4;
  var HINT_COST = 50;
  var HINT_MAX = 5;
  var REVEAL_COST = 200;
  var REVEAL_MAX = 2;
  var SHARDS_CAP = 200;

  // Time per puzzle (seconds)
  var PUZZLE_TIME = 300;

  // Mistake limit — once per cell, hitting this count fails the puzzle.
  var MISTAKE_LIMIT = 3;

  // Scholar clue rewards
  var SCHOLAR_BONUS = 1500;
  var SCHOLAR_SHARDS = 12;

  // Power-ups
  var POWERUP_CAP = 3;

  // -- Inline review bank (28 entries · 8th grade NYS → AP) -----------------
  var INLINE_BANK = [
    // Grade 8 / NYS Civics
    { prompt: "The Bill of Rights refers to:", choices: ["The first ten amendments to the Constitution", "The Declaration of Independence", "The Articles of Confederation", "The Federalist Papers"], correctText: "The first ten amendments to the Constitution" },
    { prompt: "The Emancipation Proclamation (1863) declared:", choices: ["Slaves in Confederate states free", "All slaves free immediately", "An end to the Civil War", "Equal rights for women"], correctText: "Slaves in Confederate states free" },
    { prompt: "The principle of judicial review was established in:", choices: ["Marbury v. Madison (1803)", "McCulloch v. Maryland (1819)", "Dred Scott v. Sandford (1857)", "Plessy v. Ferguson (1896)"], correctText: "Marbury v. Madison (1803)" },
    { prompt: "The 'Trail of Tears' refers to the forced relocation of:", choices: ["Cherokee and other Southeast tribes", "Sioux of the Plains", "Navajo of the Southwest", "Inuit of Alaska"], correctText: "Cherokee and other Southeast tribes" },
    // Global / World History
    { prompt: "The Mongol Empire's most lasting impact on Eurasia was:", choices: ["Opening trade routes (Pax Mongolica)", "Spread of Buddhism", "Conquest of Western Europe", "Ending the Silk Road"], correctText: "Opening trade routes (Pax Mongolica)" },
    { prompt: "The Columbian Exchange most directly led to:", choices: ["Global transfer of crops and diseases", "European industrial revolution", "Decline of Asian trade", "End of the slave trade"], correctText: "Global transfer of crops and diseases" },
    { prompt: "The Meiji Restoration (1868) is best characterized by:", choices: ["Rapid Japanese modernization", "End of Japanese isolation only", "Restoration of feudal lords", "Defeat of the samurai"], correctText: "Rapid Japanese modernization" },
    { prompt: "The Treaty of Versailles (1919) is criticized for:", choices: ["Punishing Germany too harshly", "Creating the League of Nations", "Returning Alsace-Lorraine", "Ending colonialism"], correctText: "Punishing Germany too harshly" },
    { prompt: "Apartheid in South Africa primarily enforced:", choices: ["Racial segregation by law", "Religious uniformity", "Economic socialism", "Tribal monarchy"], correctText: "Racial segregation by law" },
    // U.S. History
    { prompt: "The Louisiana Purchase (1803):", choices: ["Doubled the size of the U.S.", "Annexed Texas", "Ended the War of 1812", "Founded the Oregon Trail"], correctText: "Doubled the size of the U.S." },
    { prompt: "The 14th Amendment (1868) most importantly:", choices: ["Granted citizenship and equal protection", "Banned alcohol", "Extended voting to women", "Ended segregation"], correctText: "Granted citizenship and equal protection" },
    { prompt: "FDR's 'court-packing' plan was a response to:", choices: ["Supreme Court striking down New Deal laws", "Wartime emergency", "Pearl Harbor", "The Dust Bowl"], correctText: "Supreme Court striking down New Deal laws" },
    { prompt: "The Truman Doctrine (1947) committed the U.S. to:", choices: ["Containing the spread of communism", "Disarmament", "Free trade in Asia", "European political union"], correctText: "Containing the spread of communism" },
    // AP World / Themes
    { prompt: "The 'Pax Romana' refers to:", choices: ["Roman peace and prosperity ~27 BCE-180 CE", "Roman defeat of Carthage", "Spread of Christianity", "Fall of the western empire"], correctText: "Roman peace and prosperity ~27 BCE-180 CE" },
    { prompt: "Confucian ideals most emphasize:", choices: ["Hierarchical social harmony", "Individual rights", "Religious purity", "Military conquest"], correctText: "Hierarchical social harmony" },
    { prompt: "The fall of Constantinople (1453) most accelerated:", choices: ["European search for sea routes to Asia", "The First Crusade", "Mongol expansion", "The Renaissance papacy"], correctText: "European search for sea routes to Asia" },
    // AP US Gov / AP US History
    { prompt: "Federalist No. 10 argues that a large republic best:", choices: ["Controls the effects of factions", "Eliminates political parties", "Prevents states from acting", "Concentrates power in Congress"], correctText: "Controls the effects of factions" },
    { prompt: "The 'separation of powers' divides authority among:", choices: ["Legislative, executive, judicial branches", "Federal and state governments", "Congress and the President only", "Executive and the people"], correctText: "Legislative, executive, judicial branches" },
    { prompt: "Korematsu v. United States (1944) involved:", choices: ["Japanese American internment", "Free speech in wartime", "Affirmative action", "Voting rights"], correctText: "Japanese American internment" },
    { prompt: "The Gilded Age was characterized by:", choices: ["Industrial growth and political corruption", "Westward exploration only", "Rural agricultural prosperity", "Social Darwinism rejected"], correctText: "Industrial growth and political corruption" },
    // AP Euro
    { prompt: "Martin Luther's primary objection in his 95 Theses was to:", choices: ["The sale of indulgences", "Papal infallibility", "The Latin Mass", "Marriage of clergy"], correctText: "The sale of indulgences" },
    { prompt: "The Glorious Revolution (1688) resulted in:", choices: ["Constitutional monarchy in England", "Restoration of Catholicism", "Absolute monarchy", "End of Parliament"], correctText: "Constitutional monarchy in England" },
    { prompt: "The Enlightenment most directly influenced:", choices: ["The American and French Revolutions", "The Reformation", "The Crusades", "The Industrial Revolution alone"], correctText: "The American and French Revolutions" },
    // AP Econ / Geography
    { prompt: "Comparative advantage explains why nations should:", choices: ["Specialize and trade", "Produce everything domestically", "Avoid international trade", "Subsidize all industries"], correctText: "Specialize and trade" },
    { prompt: "A trade deficit means a country:", choices: ["Imports more than it exports", "Exports more than it imports", "Has high inflation", "Owes the IMF"], correctText: "Imports more than it exports" },
    { prompt: "Demographic transition theory predicts that as nations develop:", choices: ["Birth and death rates fall", "Birth rates rise then fall", "Death rates rise", "Population always grows"], correctText: "Birth and death rates fall" },
    // AP Psych
    { prompt: "Operant conditioning was most associated with:", choices: ["B.F. Skinner", "Sigmund Freud", "Ivan Pavlov", "Albert Bandura"], correctText: "B.F. Skinner" },
    { prompt: "Confirmation bias is the tendency to:", choices: ["Seek information that supports existing beliefs", "Remember the first item in a list", "Conform to group consensus", "Overestimate one's abilities"], correctText: "Seek information that supports existing beliefs" }
  ];

  // -- Puzzle templates -----------------------------------------------------
  // Each puzzle defines a 12-row x 12-col string-grid where '.' = black and
  // A-Z = letter cells. Clues are looked up by "<num><A|D>" key derived from
  // the standard left-to-right, top-to-bottom numbering.
  // Built by /tmp/cw_generator.js (greedy intersect placement; verified).
  var PUZZLE_TEMPLATES = [
    {
      id: "p1",
      title: "Founding Documents",
      kicker: "Civics & Early Republic",
      grid: [
        "...F..CIVIL.",
        "VOTE..O.....",
        "I..D..N...D.",
        "C..E..STATES",
        "E..R..T...M.",
        "..WASHINGTON",
        "...L..T...C.",
        ".E.I.JURY.R.",
        ".R.S..T..JAY",
        ".ACT.BILL.C.",
        "......O.A.Y.",
        "MADISON.W..."
      ],
      clues: {
        "2A":  { clue: "____ rights — protections of personal freedom." },
        "3A":  { clue: "Civic act core to representative government." },
        "5A":  { clue: "The 50 of these make up the Union." },
        "6A":  { clue: "Commander of the Continental Army; first president." },
        "8A":  { clue: "Group that decides verdicts in a trial." },
        "9A":  { clue: "First Chief Justice (one of the Federalist authors)." },
        "10A": { clue: "Sugar ____ or Stamp ____ — colonial-era statute." },
        "11A": { clue: "Proposed law before passage." },
        "13A": { clue: "President called 'Father of the Constitution.'", scholar: true },
        "1D":  { clue: "Group of 85 essays defending the new Constitution." },
        "2D":  { clue: "1787 founding document, ratified 1788." },
        "3D":  { clue: "____ president, presides over the Senate." },
        "4D":  { clue: "Rule by the people, directly or indirectly." },
        "7D":  { clue: "Period — like 'Founding ____.'" },
        "12D": { clue: "What a bill becomes after the president signs it." }
      }
    },
    {
      id: "p2",
      title: "Ancient Civilizations",
      kicker: "Global Foundations",
      grid: [
        "M.PYRAMID..P",
        "Y.....E..U.L",
        "TOGA..SPARTA",
        "H..R..O..N.T",
        "...TEMPLE..O",
        "..N.G.O..T..",
        ".CITY.T..R..",
        "C.L.PHARAOH.",
        "HOE.T.M..Y..",
        "I.....I...G.",
        "N....BABYLON",
        "AGORA.....D."
      ],
      clues: {
        "2A":  { clue: "Triangular Egyptian tomb structure." },
        "6A":  { clue: "Roman draped garment." },
        "8A":  { clue: "Greek city-state of warrior culture." },
        "9A":  { clue: "Sacred building of ancient worship." },
        "13A": { clue: "Polis, in Greek terms." },
        "15A": { clue: "Title of an Egyptian king.", scholar: true },
        "16A": { clue: "Farming tool of ancient agriculture." },
        "18A": { clue: "Mesopotamian city of Hammurabi." },
        "19A": { clue: "Greek public marketplace and gathering spot." },
        "1D":  { clue: "Ancient story explaining the world." },
        "3D":  { clue: "'Land between rivers' — cradle of civilization." },
        "4D":  { clue: "Greek philosopher, student of Socrates." },
        "5D":  { clue: "Greek vessel often painted with myths." },
        "7D":  { clue: "What ancient artisans crafted." },
        "10D": { clue: "Civilization of the Nile and pyramids." },
        "11D": { clue: "Longest river in the world." },
        "12D": { clue: "Mythic city of Homer's 'Iliad.'" },
        "14D": { clue: "Civilization of the Yellow River and silk road." },
        "17D": { clue: "Zeus or Apollo, e.g." }
      }
    },
    {
      id: "p3",
      title: "American Wars",
      kicker: "U.S. Conflicts",
      grid: [
        ".ALLIES.P.R.",
        ".X....E.E.I.",
        "AIR...ALAMO.",
        ".S..H...R...",
        "...LINCOLN..",
        "....R.......",
        ".REVOLUTION.",
        ".E..S..R....",
        ".B..H..E....",
        ".E.VIETNAM..",
        ".L..M..C....",
        "..DDAY.H...."
      ],
      clues: {
        "1A":  { clue: "U.S., U.K., USSR — WWII coalition." },
        "5A":  { clue: "Where Air Force missions happen." },
        "6A":  { clue: "1836 Texas mission siege." },
        "8A":  { clue: "President during the Civil War." },
        "9A":  { clue: "1775-1783 American war for independence." },
        "11A": { clue: "War ending with the fall of Saigon (1975)." },
        "12A": { clue: "June 6, 1944 invasion of Normandy.", scholar: true },
        "1D":  { clue: "Germany-Italy-Japan WWII alliance." },
        "2D":  { clue: "Where the Navy operates." },
        "3D":  { clue: "Hawaiian harbor attacked Dec 7, 1941." },
        "4D":  { clue: "Grande, separating Texas and Mexico." },
        "7D":  { clue: "August 1945 atomic bomb target." },
        "9D":  { clue: "Confederate side member in slang." },
        "10D": { clue: "Long defensive ditch of WWI warfare." }
      }
    },
    {
      id: "p4",
      title: "World Geography",
      kicker: "Continents & Capitals",
      grid: [
        "..I.V..DELTA",
        "MOSCOW.....N",
        "..T.L.B.O..D",
        "..H.G.EUROPE",
        "DAM.A.I.E..S",
        "A.U...J..A..",
        "M.SEA.I..MAP",
        ".O..TUNDRA.E",
        "ICE.L.G..Z.R",
        ".E..A....O.U",
        "PARIS.RHINE.",
        ".N.........."
      ],
      clues: {
        "3A":  { clue: "Sediment landform at a river's mouth." },
        "5A":  { clue: "Capital of Russia." },
        "8A":  { clue: "Continent west of Asia." },
        "9A":  { clue: "Hoover ____, on the Colorado River." },
        "11A": { clue: "Mediterranean or Caspian, e.g." },
        "13A": { clue: "Bird's-eye view of a region." },
        "16A": { clue: "Treeless arctic biome with permafrost." },
        "17A": { clue: "Glacier substance." },
        "18A": { clue: "Capital of France." },
        "19A": { clue: "Major river through Germany." },
        "1D":  { clue: "Narrow land bridge between bodies of water." },
        "2D":  { clue: "Longest river in Europe." },
        "4D":  { clue: "South American mountain range." },
        "6D":  { clue: "Capital of China.", scholar: true },
        "7D":  { clue: "Mineral source mined and smelted." },
        "9D":  { clue: "Hoover ____, on the Colorado River (down clue echo)." },
        "10D": { clue: "Largest rainforest river of South America." },
        "12D": { clue: "Book of maps." },
        "14D": { clue: "Andean nation, capital Lima." },
        "15D": { clue: "Pacific or Atlantic, e.g." }
      }
    },
    {
      id: "p5",
      title: "Science & Discovery",
      kicker: "Pioneers of Science",
      grid: [
        "STAR.GRAVITY",
        "..I.C...A...",
        "FORCE.M.CELL",
        "....L.O.C...",
        ".G..L.L.ION.",
        ".EINSTEIN...",
        ".N.E..C.E...",
        ".O.U.SUN..L.",
        ".M.T..L.G.I.",
        ".E.R..ENERGY",
        "...O....N.H.",
        "PLANET.HEAT."
      ],
      clues: {
        "1A":  { clue: "Nuclear-fusion sphere like our Sun." },
        "3A":  { clue: "Force pulling objects toward Earth's center." },
        "6A":  { clue: "Push or pull; F=ma." },
        "8A":  { clue: "Smallest unit of life." },
        "10A": { clue: "Charged atom." },
        "11A": { clue: "Author of E=mc^2.", scholar: true },
        "13A": { clue: "Center of our solar system." },
        "16A": { clue: "Capacity to do work." },
        "17A": { clue: "Earth, Mars, or Saturn, e.g." },
        "18A": { clue: "Thermal energy transfer." },
        "2D":  { clue: "Mix of nitrogen, oxygen, and traces." },
        "4D":  { clue: "Pasteur's contribution to disease prevention." },
        "5D":  { clue: "Building blocks of life." },
        "7D":  { clue: "Two or more atoms bonded together." },
        "9D":  { clue: "Complete set of genetic material." },
        "12D": { clue: "Neutral subatomic particle in the nucleus." },
        "14D": { clue: "Electromagnetic radiation we can see." },
        "15D": { clue: "Unit of heredity on a chromosome." }
      }
    },
    {
      id: "p6",
      title: "Civil Rights Era",
      kicker: "Movements & Leaders",
      grid: [
        ".F....VOTE.R",
        "ERA......Q.I",
        ".E.G..M..U.D",
        ".E.R.WALLACE",
        ".D.E..L..L.R",
        ".O.E..C.S..S",
        ".MONTGOMERY.",
        "...S..L.L..R",
        "...B..M.M..O",
        ".BROWN.PARKS",
        "...R.......A",
        "..BOYCOTT..."
      ],
      clues: {
        "2A":  { clue: "Right secured by the 1965 Voting Act." },
        "5A":  { clue: "Period — like the Civil Rights ____." },
        "8A":  { clue: "Alabama governor blocking schoolhouse doors." },
        "10A": { clue: "Alabama city of the 1955 bus boycott." },
        "12A": { clue: "1954 case ending school segregation." },
        "13A": { clue: "Rosa who kept her bus seat." },
        "14A": { clue: "Refusal to buy, as in Montgomery 1955." },
        "1D":  { clue: "1964 'Summer' of voter registration in Mississippi." },
        "3D":  { clue: "What 'separate' isn't, per Brown v. Board." },
        "4D":  { clue: "Freedom ____ — 1961 interstate-bus protesters." },
        "6D":  { clue: "1960 sit-in city in North Carolina." },
        "7D":  { clue: "X — civil rights leader assassinated 1965.", scholar: true },
        "9D":  { clue: "Site of the 1965 Bloody Sunday march." },
        "11D": { clue: "Parks's first name." }
      }
    },
    {
      id: "p7",
      title: "Renaissance & Reformation",
      kicker: "Europe Reborn",
      grid: [
        ".ERA..R.....",
        "A..GUTENBERG",
        "ROME..N.....",
        "T.O..VATICAN",
        ".INK..I.....",
        "..K.MASS..P.",
        "M.....S...R.",
        "E..B.RAPHAEL",
        "DAVID.N...S.",
        "I..B..C...S.",
        "C.FLORENCE..",
        "I..E........"
      ],
      clues: {
        "1A":  { clue: "Period of cultural rebirth." },
        "5A":  { clue: "Inventor of the movable-type printing press." },
        "6A":  { clue: "Center of the Catholic Church." },
        "8A":  { clue: "Papal city-state in Rome." },
        "9A":  { clue: "Black liquid the press used." },
        "10A": { clue: "Catholic worship service." },
        "14A": { clue: "Painter of 'The School of Athens.'" },
        "15A": { clue: "Michelangelo's marble Biblical youth." },
        "16A": { clue: "Italian city of the Medici and Botticelli." },
        "2D":  { clue: "Era — like the ____ of Discovery." },
        "3D":  { clue: "European 'rebirth' of art and learning." },
        "4D":  { clue: "Painting or sculpture." },
        "7D":  { clue: "Religious figure like Luther of Wittenberg.", scholar: true },
        "11D": { clue: "Movable-type machine of Gutenberg." },
        "12D": { clue: "Banking family patrons of Florence's art." },
        "13D": { clue: "First book Gutenberg printed (1455)." }
      }
    },
    {
      id: "p8",
      title: "Cold War",
      kicker: "Superpower Standoff",
      grid: [
        "......C.O...",
        "S.R..SOVIET.",
        "P.E.M.N.L...",
        "USA.A.T..B..",
        "T.GORBACHEV.",
        "N.A.S.I..R..",
        "I.N.H.N.BLOC",
        "K...ARMS.I..",
        ".U..L.E..N..",
        ".STALIN.....",
        ".S....TRUMAN",
        "IRON........"
      ],
      clues: {
        "5A":  { clue: "Adjective describing the USSR." },
        "7A":  { clue: "Western superpower abbreviation." },
        "9A":  { clue: "Soviet leader of glasnost and perestroika." },
        "10A": { clue: "Eastern ____ — Warsaw Pact countries." },
        "11A": { clue: "Race for more nuclear weapons." },
        "13A": { clue: "Soviet leader through WWII and into the 1950s." },
        "14A": { clue: "President of the 1947 doctrine of containment." },
        "15A": { clue: "____ Curtain — Churchill's metaphor." },
        "1D":  { clue: "U.S. policy of stopping communist spread." },
        "2D":  { clue: "Energy resource at stake in the era." },
        "3D":  { clue: "1957 first artificial satellite." },
        "4D":  { clue: "U.S. president who urged 'tear down this wall.'" },
        "6D":  { clue: "1948 plan to rebuild Europe." },
        "8D":  { clue: "Divided German city of the Wall.", scholar: true },
        "12D": { clue: "Eastern superpower abbreviation." }
      }
    },
    {
      id: "p9",
      title: "Industrial Revolution",
      kicker: "Steam to Steel",
      grid: [
        "........F...",
        "........O.F.",
        "....RAILROAD",
        ".GAS..N.D.C.",
        "...T..D...T.",
        "COKE..U...O.",
        "...EDISON.R.",
        "COAL..T...Y.",
        "I.G.WORKER.O",
        "T.E.A.Y..A.I",
        "Y...T...MILL",
        ".TEXTILE.L.."
      ],
      clues: {
        "3A":  { clue: "Iron-track system that crossed continents." },
        "5A":  { clue: "Lamp fuel before electricity." },
        "7A":  { clue: "Coal byproduct used in steel-making." },
        "8A":  { clue: "Inventor of the practical light bulb." },
        "9A":  { clue: "Fuel of steam engines and ironworks." },
        "11A": { clue: "Person who labored in the new factories." },
        "14A": { clue: "Cotton or flour processing facility." },
        "15A": { clue: "Cloth industry that mechanized first." },
        "1D":  { clue: "Detroit assembly-line carmaker." },
        "2D":  { clue: "Where mass production was centralized." },
        "4D":  { clue: "Sector transformed by 18th-19th century inventions." },
        "6D":  { clue: "Bessemer-process metal of bridges and rails." },
        "9D":  { clue: "Urban center where factories rose." },
        "10D": { clue: "____ of Industry, broad era name." },
        "11D": { clue: "Steam-engine improver, unit of power.", scholar: true },
        "12D": { clue: "Track for trains." },
        "13D": { clue: "Lubricant — and emerging fuel — of the late 1800s." }
      }
    },
    {
      id: "p10",
      title: "Latin America",
      kicker: "Independence & Identity",
      grid: [
        ".AZTEC...I.C",
        "P....H.TANGO",
        "O....I...C.C",
        "BRAZIL..MAYA",
        "R.R..E..E...",
        "E.G.B.C.X.A.",
        ".REVOLUTION.",
        "..N.L.B.C.D.",
        "ART.I.A.ORE.",
        "..I.V.....S.",
        "..N.AMAZON..",
        "ERA.R......."
      ],
      clues: {
        "1A":  { clue: "Mesoamerican empire of Tenochtitlan." },
        "6A":  { clue: "Argentine ballroom dance." },
        "7A":  { clue: "Largest South American country." },
        "9A":  { clue: "Mesoamerican civilization of pyramids." },
        "13A": { clue: "Movement Bolivar led against Spain.", scholar: true },
        "14A": { clue: "Murals of Diego Rivera, e.g." },
        "15A": { clue: "Mineral wealth Spain extracted from the Americas." },
        "16A": { clue: "World's largest rainforest river basin." },
        "17A": { clue: "Long historical period." },
        "2D":  { clue: "Long Pacific-coast country." },
        "3D":  { clue: "Andean empire conquered by Pizarro." },
        "4D":  { clue: "Andean leaf and global beverage." },
        "5D":  { clue: "Spanish word for 'poor.'" },
        "8D":  { clue: "Land of pampas and tango." },
        "9D":  { clue: "Nation south of the U.S." },
        "10D": { clue: "'Liberator' who freed northern South America." },
        "11D": { clue: "Caribbean island of the 1959 revolution." },
        "12D": { clue: "South America's spine of mountains." }
      }
    }
  ];

  // -- DOM helpers -----------------------------------------------------------
  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // -- Audio (Web Audio simple SFX) -----------------------------------------
  var soundOn = true;
  var sfxCtx = null;
  function sfxInit() {
    if (sfxCtx || !soundOn) return sfxCtx;
    try { sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { sfxCtx = null; }
    return sfxCtx;
  }
  function tone(freq, duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var type = opts.type || "square";
    var vol = opts.volume == null ? 0.14 : opts.volume;
    var attack = opts.attack || 0.005;
    var decay = opts.decay == null ? duration : opts.decay;
    var now = ctxA.currentTime;
    try {
      var osc = ctxA.createOscillator();
      var gain = ctxA.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (opts.endFreq != null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain).connect(ctxA.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {}
  }
  function noise(duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var vol = opts.volume == null ? 0.12 : opts.volume;
    var bufferSize = Math.floor(ctxA.sampleRate * duration);
    try {
      var buffer = ctxA.createBuffer(1, bufferSize, ctxA.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      var src = ctxA.createBufferSource();
      src.buffer = buffer;
      var gain = ctxA.createGain();
      gain.gain.setValueAtTime(vol, ctxA.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctxA.currentTime + duration);
      var filter = ctxA.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = opts.cutoff || 1200;
      src.connect(filter).connect(gain).connect(ctxA.destination);
      src.start();
    } catch (e) {}
  }
  var sfx = {
    cell_select:    function () { tone(640, 0.05, { type: "sine", volume: 0.07 }); },
    letter_correct: function () { tone(880, 0.08, { type: "sine", volume: 0.10 }); },
    letter_wrong:   function () { tone(170, 0.18, { type: "sawtooth", volume: 0.13, endFreq: 100 }); noise(0.10, { volume: 0.06 }); },
    clue_solved:    function () { tone(660, 0.08, { type: "triangle", volume: 0.12 }); setTimeout(function () { tone(990, 0.12, { type: "triangle", volume: 0.13 }); }, 80); },
    hint:           function () { tone(540, 0.10, { type: "sine", volume: 0.12 }); setTimeout(function () { tone(720, 0.10, { type: "sine", volume: 0.10 }); }, 90); },
    reveal:         function () { tone(420, 0.18, { type: "triangle", volume: 0.13, endFreq: 240 }); },
    scholar_solved: function () { tone(750, 0.12, { type: "sine", volume: 0.13 }); setTimeout(function () { tone(1000, 0.14, { type: "sine", volume: 0.13 }); }, 110); },
    scholar_correct:function () { tone(880, 0.10, { type: "triangle", volume: 0.13 }); setTimeout(function () { tone(1320, 0.16, { type: "triangle", volume: 0.13 }); }, 100); setTimeout(function () { tone(1760, 0.20, { type: "sine", volume: 0.12 }); }, 220); },
    scholar_wrong:  function () { tone(220, 0.20, { type: "sawtooth", volume: 0.14, endFreq: 130 }); },
    puzzle_clear:   function () { tone(660, 0.10, { type: "triangle", volume: 0.14 }); setTimeout(function () { tone(880, 0.10, { type: "triangle", volume: 0.14 }); }, 100); setTimeout(function () { tone(1100, 0.18, { type: "triangle", volume: 0.14 }); }, 200); },
    life_lost:      function () { tone(180, 0.30, { type: "sawtooth", volume: 0.16, endFreq: 80 }); noise(0.18, { volume: 0.08 }); },
    gameOver:       function () { tone(220, 0.5, { type: "sawtooth", volume: 0.18, endFreq: 80 }); setTimeout(function () { tone(150, 0.6, { type: "sawtooth", volume: 0.16, endFreq: 60 }); }, 250); },
    powerup_pickup: function () { tone(720, 0.10, { type: "sine", volume: 0.13 }); setTimeout(function () { tone(960, 0.12, { type: "sine", volume: 0.13 }); }, 80); },
    powerup_use:    function () { tone(540, 0.08, { type: "triangle", volume: 0.13 }); setTimeout(function () { tone(810, 0.12, { type: "triangle", volume: 0.13 }); }, 70); }
  };

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        var theme = "archive-dusk";
        if (window.MrMacsArcadeMusic.themes && !window.MrMacsArcadeMusic.themes[theme]) {
          theme = "maze-cabinet";
        }
        window.MrMacsArcadeMusic.start(theme, { volume: 0.5 });
      }
    } catch (e) {}
  }
  function pauseMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck) window.MrMacsArcadeMusic.duck(0.1, 200); } catch (e) {}
  }
  function resumeMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore) window.MrMacsArcadeMusic.restore(200); } catch (e) {}
  }
  function stopMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop) window.MrMacsArcadeMusic.stop(); } catch (e) {}
  }

  // -- DOM refs --------------------------------------------------------------
  var dom = {};
  function cacheDom() {
    dom.app           = $("app");
    dom.gridBoard     = $("gridBoard");
    dom.acrossList    = $("acrossList");
    dom.downList      = $("downList");
    dom.activeClueTag = $("activeClueTag");
    dom.activeClueText= $("activeClueText");
    dom.miniKbd       = $("miniKbd");
    dom.popupOverlay  = $("popupOverlay");

    dom.hudScore      = $("hudScore");
    dom.hudLives      = $("hudLives");
    dom.hudPuzzle     = $("hudPuzzle");
    dom.hudTimer      = $("hudTimer");
    dom.hudTimerCell  = $("hudTimerCell");
    dom.hudFilled     = $("hudFilled");
    dom.hudBest       = $("hudBest");
    dom.hintCost      = $("hintCost");
    dom.revealCost    = $("revealCost");

    dom.brandSub      = $("brandSub");
    dom.goalName      = $("goalName");
    dom.goalMeta      = $("goalMeta");

    dom.hintBtn       = $("hintBtn");
    dom.revealBtn     = $("revealBtn");
    dom.checkBtn      = $("checkBtn");
    dom.pauseBtn      = $("pauseBtn");
    dom.exitBtn       = $("exitBtn");

    dom.setupScreen   = $("setupScreen");
    dom.startBtn      = $("startBtn");
    dom.soundBtn      = $("soundBtn");
    dom.fullscreenBtn = $("fullscreenBtn");
    dom.resumeCard    = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");

    dom.questionScreen= $("questionScreen");
    dom.questionMeta  = $("questionMeta");
    dom.questionPrompt= $("questionPrompt");
    dom.questionCloseBtn = $("questionCloseBtn");
    dom.choiceGrid    = $("choiceGrid");
    dom.explanation   = $("explanation");

    dom.pauseScreen   = $("pauseScreen");
    dom.resumeBtn     = $("resumeBtn");
    dom.restartBtn    = $("restartBtn");
    dom.pauseExitBtn  = $("pauseExitBtn");

    dom.clearScreen   = $("clearScreen");
    dom.clearKicker   = $("clearKicker");
    dom.clearTitle    = $("clearTitle");
    dom.clearGrid     = $("clearGrid");
    dom.clearTip      = $("clearTip");
    dom.clearExitBtn  = $("clearExitBtn");
    dom.nextPuzzleBtn = $("nextPuzzleBtn");

    dom.endScreen     = $("endScreen");
    dom.endKicker     = $("endKicker");
    dom.endTitle      = $("endTitle");
    dom.endGrid       = $("endGrid");
    dom.retryHint     = $("retryHint");
    dom.setupBtn      = $("setupBtn");
    dom.againBtn      = $("againBtn");

    dom.puSlots = [$("puSlot1"), $("puSlot2"), $("puSlot3")];
  }

  // -- State -----------------------------------------------------------------
  var phase = "setup";        // setup | playing | question | paused | clear | ended
  var prevPhase = null;
  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var activeQuestion = null;

  // Pending timeouts so we can cancel on puzzle reload / unload (memory leak fix)
  var pendingTimeouts = [];
  function scheduleTimeout(fn, ms) {
    var h = setTimeout(function () {
      // remove from pending list
      var i = pendingTimeouts.indexOf(h);
      if (i >= 0) pendingTimeouts.splice(i, 1);
      try { fn(); } catch (e) {}
    }, ms);
    pendingTimeouts.push(h);
    return h;
  }
  function clearPendingTimeouts() {
    for (var i = 0; i < pendingTimeouts.length; i++) {
      try { clearTimeout(pendingTimeouts[i]); } catch (e) {}
    }
    pendingTimeouts = [];
  }

  // Re-entry guard for hint to prevent double-charge on rapid clicks
  var hintInFlight = false;
  var revealInFlight = false;

  // -- Puzzle compilation: grid string + clues map -> structured puzzle ----
  // Input template:
  //   { id, title, kicker,
  //     grid: ["...A...B...", ...12 strings of 12 chars...],
  //     clues: { "<num><A|D>": { clue: "...", scholar?: true } }
  //   }
  function compilePuzzle(template) {
    var i, j;
    var rawGrid = template.grid;
    // Build a 2D array of letters (or null for black).
    var letters = [];
    for (i = 0; i < GRID_SIZE; i++) {
      var rowStr = (rawGrid[i] || "").toUpperCase();
      while (rowStr.length < GRID_SIZE) rowStr += ".";
      var row = [];
      for (j = 0; j < GRID_SIZE; j++) {
        var ch = rowStr.charAt(j);
        if (ch === ".") row.push(null);
        else if (/[A-Z]/.test(ch)) row.push(ch);
        else row.push(null);
      }
      letters.push(row);
    }

    // Build cells. Treat isolated letters (no horizontal AND no vertical
    // neighbour) as black so they can't trap the cursor on an unreachable cell.
    var cells = [];
    for (i = 0; i < GRID_SIZE; i++) {
      var rr = [];
      for (j = 0; j < GRID_SIZE; j++) {
        if (letters[i][j] == null) {
          rr.push(null);
        } else {
          var hasLeft  = j > 0 && letters[i][j - 1] != null;
          var hasRight = j + 1 < GRID_SIZE && letters[i][j + 1] != null;
          var hasUp    = i > 0 && letters[i - 1][j] != null;
          var hasDown  = i + 1 < GRID_SIZE && letters[i + 1][j] != null;
          if (!hasLeft && !hasRight && !hasUp && !hasDown) {
            // unreachable single-letter island → drop
            rr.push(null);
          } else {
            rr.push({ r: i, c: j, letter: letters[i][j], num: 0, scholar: false });
          }
        }
      }
      cells.push(rr);
    }

    // Number grid: cell is a number-start if it begins an Across or Down word
    // (across word = >=2 letters running right, down = >=2 letters running down).
    var nextNum = 1;
    var numByPos = {};
    var startsByNum = {};
    for (i = 0; i < GRID_SIZE; i++) {
      for (j = 0; j < GRID_SIZE; j++) {
        var c = cells[i][j];
        if (!c) continue;
        var leftBlack = (j === 0 || cells[i][j - 1] == null);
        var rightLetter = (j + 1 < GRID_SIZE && cells[i][j + 1] != null);
        var topBlack = (i === 0 || cells[i - 1][j] == null);
        var bottomLetter = (i + 1 < GRID_SIZE && cells[i + 1][j] != null);
        var startsAcross = leftBlack && rightLetter;
        var startsDown = topBlack && bottomLetter;
        if (startsAcross || startsDown) {
          c.num = nextNum;
          c.startsAcross = startsAcross;
          c.startsDown = startsDown;
          numByPos[i + ":" + j] = nextNum;
          startsByNum[nextNum] = { r: i, c: j };
          nextNum++;
        }
      }
    }

    // For each numbered start, derive the word's length and answer string.
    var across = [];
    var down = [];
    for (i = 0; i < GRID_SIZE; i++) {
      for (j = 0; j < GRID_SIZE; j++) {
        var c2 = cells[i][j];
        if (!c2 || !c2.num) continue;
        if (c2.startsAcross) {
          var aWord = "";
          var cc = j;
          while (cc < GRID_SIZE && cells[i][cc]) { aWord += cells[i][cc].letter; cc++; }
          if (aWord.length >= 2) {
            var key = c2.num + "A";
            var clueEntry = template.clues[key] || {};
            var entry = {
              num: c2.num,
              r: i, c: j,
              length: aWord.length,
              answer: aWord,
              clue: clueEntry.clue || ("Across word at " + c2.num),
              scholar: !!clueEntry.scholar
            };
            across.push(entry);
            if (entry.scholar) c2.scholar = true;
          }
        }
        if (c2.startsDown) {
          var dWord = "";
          var rr2 = i;
          while (rr2 < GRID_SIZE && cells[rr2][j]) { dWord += cells[rr2][j].letter; rr2++; }
          if (dWord.length >= 2) {
            var key2 = c2.num + "D";
            var clueEntry2 = template.clues[key2] || {};
            var entry2 = {
              num: c2.num,
              r: i, c: j,
              length: dWord.length,
              answer: dWord,
              clue: clueEntry2.clue || ("Down word at " + c2.num),
              scholar: !!clueEntry2.scholar
            };
            down.push(entry2);
            if (entry2.scholar) c2.scholar = true;
          }
        }
      }
    }

    across.sort(function (a, b) { return a.num - b.num; });
    down.sort(function (a, b) { return a.num - b.num; });

    return {
      id: template.id,
      title: template.title,
      kicker: template.kicker,
      cells: cells,
      across: across,
      down: down
    };
  }

  // -- Grid rendering --------------------------------------------------------
  // grid: cell DOM elements indexed [r][c]
  var cellEls = [];
  // user letters: [r][c] = char or null
  function emptyUserGrid() {
    var u = [];
    for (var i = 0; i < GRID_SIZE; i++) {
      var row = [];
      for (var j = 0; j < GRID_SIZE; j++) row.push(null);
      u.push(row);
    }
    return u;
  }

  function renderGrid() {
    cellEls = [];
    var html = "";
    var puz = state.puzzle;
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var cell = puz.cells[r][c];
        if (!cell) {
          html += '<div class="cell block" data-r="' + r + '" data-c="' + c + '" aria-hidden="true"></div>';
        } else {
          var classes = "cell";
          if (cell.scholar) classes += " scholar";
          var num = cell.num ? '<span class="num">' + cell.num + (cell.scholar ? '<span class="sd">*</span>' : "") + '</span>' : "";
          html += '<div class="' + classes + '" data-r="' + r + '" data-c="' + c + '" role="gridcell" tabindex="-1">' +
                  num +
                  '<span class="ltr"></span></div>';
        }
      }
    }
    dom.gridBoard.innerHTML = html;
    var nodes = dom.gridBoard.querySelectorAll(".cell");
    for (var ri = 0; ri < GRID_SIZE; ri++) cellEls.push([]);
    for (var n = 0; n < nodes.length; n++) {
      var el = nodes[n];
      var rrA = parseInt(el.getAttribute("data-r"), 10);
      var ccA = parseInt(el.getAttribute("data-c"), 10);
      cellEls[rrA][ccA] = el;
      if (!el.classList.contains("block")) {
        el.addEventListener("click", onCellClick);
      }
    }
  }

  function renderClueLists() {
    var puz = state.puzzle;
    var ah = "";
    for (var i = 0; i < puz.across.length; i++) {
      var w = puz.across[i];
      ah += '<li data-num="' + w.num + '" data-dir="A"' + (w.scholar ? ' class="scholar"' : '') + '>' +
            '<span class="num-tag mono">' + w.num + 'A</span><span class="clue-txt">' +
            escapeHtml(w.clue) + (w.scholar ? ' <span class="mono" style="color:var(--gold)">*</span>' : '') +
            ' <span class="mono" style="color:var(--muted);font-size:10px">(' + w.length + ')</span></span></li>';
    }
    dom.acrossList.innerHTML = ah;
    var dh = "";
    for (var j = 0; j < puz.down.length; j++) {
      var d = puz.down[j];
      dh += '<li data-num="' + d.num + '" data-dir="D"' + (d.scholar ? ' class="scholar"' : '') + '>' +
            '<span class="num-tag mono">' + d.num + 'D</span><span class="clue-txt">' +
            escapeHtml(d.clue) + (d.scholar ? ' <span class="mono" style="color:var(--gold)">*</span>' : '') +
            ' <span class="mono" style="color:var(--muted);font-size:10px">(' + d.length + ')</span></span></li>';
    }
    dom.downList.innerHTML = dh;

    var allLis = [].concat(
      Array.prototype.slice.call(dom.acrossList.querySelectorAll("li")),
      Array.prototype.slice.call(dom.downList.querySelectorAll("li"))
    );
    allLis.forEach(function (li) {
      li.addEventListener("click", function () {
        var num = parseInt(li.getAttribute("data-num"), 10);
        var dir = li.getAttribute("data-dir");
        focusClue(num, dir);
      });
    });
  }

  function renderMiniKbd() {
    // Wrap each row in its own flex container so they stack as proper
    // QWERTY rows on mobile (was 28 keys in flat flex-wrap → ugly wrapping
    // and overflow off-screen). May 10 2026.
    var rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    var html = "";
    for (var r = 0; r < rows.length; r++) {
      html += '<div class="kbd-row">';
      for (var i = 0; i < rows[r].length; i++) {
        html += '<button class="key" type="button" data-k="' + rows[r].charAt(i) + '">' + rows[r].charAt(i) + '</button>';
      }
      // Action keys joined to the bottom row
      if (r === rows.length - 1) {
        html += '<button class="key wide" type="button" data-k="BACKSPACE">DEL</button>';
        html += '<button class="key wide" type="button" data-k="TAB">TAB</button>';
      }
      html += '</div>';
    }
    dom.miniKbd.innerHTML = html;
    var btns = dom.miniKbd.querySelectorAll(".key");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-k");
        if (k === "BACKSPACE") handleBackspace();
        else if (k === "TAB") jumpToNextClue();
        else handleLetter(k);
      });
    });
  }

  // -- Selection / cursor ----------------------------------------------------
  function onCellClick(e) {
    if (phase !== "playing") return;
    var el = e.currentTarget;
    var r = parseInt(el.getAttribute("data-r"), 10);
    var c = parseInt(el.getAttribute("data-c"), 10);
    selectCell(r, c, true);
  }

  function selectCell(r, c, allowToggleDir) {
    var puz = state.puzzle;
    if (!puz.cells[r] || !puz.cells[r][c]) return;
    // Reject cells that aren't part of any clue (defensive — compile pass
    // already drops island cells, but keep this guard for malformed boards).
    if (!findClueAt(r, c, "A") && !findClueAt(r, c, "D")) return;
    // If clicking same cell, toggle direction
    if (allowToggleDir && state.cursor && state.cursor.r === r && state.cursor.c === c) {
      var flipped = state.cursor.dir === "A" ? "D" : "A";
      // Only flip if a clue exists in the other direction at this cell.
      if (findClueAt(r, c, flipped)) {
        state.cursor.dir = flipped;
      }
    } else {
      var preferred = state.cursor ? state.cursor.dir : "A";
      var prefClue = findClueAt(r, c, preferred);
      if (!prefClue) {
        preferred = preferred === "A" ? "D" : "A";
      }
      state.cursor = { r: r, c: c, dir: preferred };
    }
    sfx.cell_select();
    refreshHighlights();
  }

  // Find clue containing (r,c) in given direction; returns clue or null.
  function findClueAt(r, c, dir) {
    var arr = dir === "A" ? state.puzzle.across : state.puzzle.down;
    for (var i = 0; i < arr.length; i++) {
      var w = arr[i];
      if (dir === "A") {
        if (w.r === r && c >= w.c && c < w.c + w.length) return w;
      } else {
        if (w.c === c && r >= w.r && r < w.r + w.length) return w;
      }
    }
    return null;
  }

  function getActiveClue() {
    if (!state.cursor) return null;
    return findClueAt(state.cursor.r, state.cursor.c, state.cursor.dir);
  }

  function refreshHighlights() {
    // Clear all
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var el = cellEls[r][c];
        if (!el) continue;
        el.classList.remove("active", "in-row", "in-col");
      }
    }
    var clue = getActiveClue();
    if (!clue) {
      dom.activeClueTag.textContent = "--";
      dom.activeClueText.textContent = "Click a cell to start.";
      return;
    }
    // Highlight clue cells
    for (var k = 0; k < clue.length; k++) {
      var rr = state.cursor.dir === "D" ? clue.r + k : clue.r;
      var cc = state.cursor.dir === "A" ? clue.c + k : clue.c;
      var elx = cellEls[rr][cc];
      if (elx) elx.classList.add("in-row");
    }
    // Active cell
    var aEl = cellEls[state.cursor.r][state.cursor.c];
    if (aEl) aEl.classList.add("active");

    // Update active clue bar
    dom.activeClueTag.textContent = clue.num + (state.cursor.dir === "A" ? "A" : "D");
    dom.activeClueText.textContent = clue.clue + (clue.scholar ? "  ★" : "");

    // Highlight clue list active row
    var lis = dom.acrossList.querySelectorAll("li");
    lis.forEach(function (li) { li.classList.remove("active"); });
    var lis2 = dom.downList.querySelectorAll("li");
    lis2.forEach(function (li) { li.classList.remove("active"); });
    var listToUse = state.cursor.dir === "A" ? dom.acrossList : dom.downList;
    var match = listToUse.querySelector('li[data-num="' + clue.num + '"][data-dir="' + state.cursor.dir + '"]');
    if (match) {
      match.classList.add("active");
      try { match.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
    }
  }

  // toStart=true forces the cursor to the clue's first cell instead of the
  // first empty cell — used by Tab so the user always lands at the start.
  function focusClue(num, dir, toStart) {
    var clue = (dir === "A" ? state.puzzle.across : state.puzzle.down).filter(function (w) {
      return w.num === num;
    })[0];
    if (!clue) return;
    state.cursor = { r: clue.r, c: clue.c, dir: dir };
    if (!toStart) {
      // Move cursor to first empty letter in the clue if any
      for (var k = 0; k < clue.length; k++) {
        var rr = dir === "D" ? clue.r + k : clue.r;
        var cc = dir === "A" ? clue.c + k : clue.c;
        if (!state.userGrid[rr][cc]) {
          state.cursor.r = rr;
          state.cursor.c = cc;
          break;
        }
      }
    }
    refreshHighlights();
  }

  // -- Input handlers --------------------------------------------------------
  function handleLetter(L) {
    if (phase !== "playing" || !state.cursor) return;
    var letter = String(L).toUpperCase();
    if (!/^[A-Z]$/.test(letter)) return;
    var r = state.cursor.r;
    var c = state.cursor.c;
    var cell = state.puzzle.cells[r][c];
    if (!cell) return;
    if (state.revealedCells[r][c]) {
      // Don't overwrite revealed letters (they're locked correct)
      advanceCursor(1);
      return;
    }
    var solution = cell.letter;
    var prev = state.userGrid[r][c];
    state.userGrid[r][c] = letter;
    var letterEl = cellEls[r][c].querySelector(".ltr");
    if (letterEl) letterEl.textContent = letter;
    var cellEl = cellEls[r][c];
    cellEl.classList.remove("correct", "wrong-flash");

    if (letter === solution) {
      sfx.letter_correct();
      cellEl.classList.add("correct");
      // Check if any clue completed
      checkCluesAfterEdit(r, c);
    } else {
      sfx.letter_wrong();
      cellEl.classList.add("wrong-flash");
      // Track mistake — count once per cell per puzzle, not per wrong letter.
      if (!state.cellMistakeCounted[r][c]) {
        state.mistakes++;
        state.cellMistakeCounted[r][c] = true;
        // Optional 3-mistake-limit handling (lose a life if exceeded).
        if (typeof MISTAKE_LIMIT === "number" && state.mistakes >= MISTAKE_LIMIT) {
          // Defer to puzzle-complete flow with a fail.
          scheduleTimeout(function () { onPuzzleComplete(false); }, 700);
        }
      }
      // Capture (r,c) by closure, but use cellEls[r][c] resolution at fire
      // time so we still target the correct DOM node even if the grid
      // re-rendered (we'll bail if it has).
      var rr = r, cc = c;
      scheduleTimeout(function () {
        if (cellEls[rr] && cellEls[rr][cc] && cellEls[rr][cc] === cellEl) {
          cellEl.classList.remove("wrong-flash");
        }
      }, 600);
    }
    advanceCursor(1);
    updateHud();
    saveSnapshot();
  }

  function handleBackspace() {
    if (phase !== "playing" || !state.cursor) return;
    var r = state.cursor.r;
    var c = state.cursor.c;
    if (state.userGrid[r][c] && !state.revealedCells[r][c]) {
      state.userGrid[r][c] = null;
      var letterEl = cellEls[r][c].querySelector(".ltr");
      if (letterEl) letterEl.textContent = "";
      if (cellEls[r][c]) cellEls[r][c].classList.remove("correct", "wrong-flash");
    } else {
      advanceCursor(-1);
      var rr = state.cursor.r, cc = state.cursor.c;
      if (state.userGrid[rr] && state.userGrid[rr][cc] && !state.revealedCells[rr][cc]) {
        state.userGrid[rr][cc] = null;
        var le = cellEls[rr][cc] && cellEls[rr][cc].querySelector(".ltr");
        if (le) le.textContent = "";
        if (cellEls[rr][cc]) cellEls[rr][cc].classList.remove("correct", "wrong-flash");
      }
    }
    updateHud();
    saveSnapshot();
  }

  function advanceCursor(delta) {
    if (!state.cursor) return;
    var clue = getActiveClue();
    if (!clue) return;
    var idx = state.cursor.dir === "A"
      ? state.cursor.c - clue.c
      : state.cursor.r - clue.r;
    var newIdx = idx + delta;
    if (newIdx < 0) newIdx = 0;
    if (newIdx > clue.length - 1) newIdx = clue.length - 1;
    if (state.cursor.dir === "A") {
      state.cursor = { r: clue.r, c: clue.c + newIdx, dir: "A" };
    } else {
      state.cursor = { r: clue.r + newIdx, c: clue.c, dir: "D" };
    }
    refreshHighlights();
  }

  function jumpToNextClue() {
    if (phase !== "playing") return;
    var puz = state.puzzle;
    if (!puz || (puz.across.length === 0 && puz.down.length === 0)) return;
    var allClues = puz.across.map(function (w) { return { w: w, dir: "A" }; })
                  .concat(puz.down.map(function (w) { return { w: w, dir: "D" }; }));
    var current = getActiveClue();
    var curDir = state.cursor ? state.cursor.dir : "A";
    var idx = -1;
    for (var i = 0; i < allClues.length; i++) {
      if (current && allClues[i].w === current && allClues[i].dir === curDir) { idx = i; break; }
    }
    var nextIdx = (idx + 1) % allClues.length;
    // Skip already-solved clues; if all are solved, fall through to the
    // first wrap-around so we still advance.
    var attempts = 0;
    while (attempts < allClues.length &&
           state.solvedClues[allClues[nextIdx].dir + "_" + allClues[nextIdx].w.num]) {
      nextIdx = (nextIdx + 1) % allClues.length;
      attempts++;
    }
    var nextClue = allClues[nextIdx].w;
    var nextDir = allClues[nextIdx].dir;
    // Tab always lands at the clue's start cell.
    focusClue(nextClue.num, nextDir, true);
  }

  function arrowMove(dir) {
    if (phase !== "playing" || !state.cursor) return;
    var r = state.cursor.r;
    var c = state.cursor.c;
    var nr = r, nc = c;
    if (dir === "Left") nc = c - 1;
    else if (dir === "Right") nc = c + 1;
    else if (dir === "Up") nr = r - 1;
    else if (dir === "Down") nr = r + 1;
    if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return;
    if (!state.puzzle.cells[nr][nc]) return;
    // Auto-switch dir if pressing across with vertical cursor or vice versa.
    var newDir = state.cursor.dir;
    if (dir === "Left" || dir === "Right") newDir = "A";
    if (dir === "Up" || dir === "Down") newDir = "D";
    if (!findClueAt(nr, nc, newDir)) newDir = state.cursor.dir;
    state.cursor = { r: nr, c: nc, dir: newDir };
    refreshHighlights();
  }

  // -- Clue completion -------------------------------------------------------
  function checkCluesAfterEdit(r, c) {
    // Find clue(s) covering (r,c)
    var aClue = findClueAt(r, c, "A");
    var dClue = findClueAt(r, c, "D");
    if (aClue) maybeMarkClueSolved(aClue, "A");
    if (dClue) maybeMarkClueSolved(dClue, "D");
    // Check overall puzzle completion
    if (isPuzzleComplete()) onPuzzleComplete();
  }

  function isClueSolved(clue, dir) {
    for (var k = 0; k < clue.length; k++) {
      var rr = dir === "D" ? clue.r + k : clue.r;
      var cc = dir === "A" ? clue.c + k : clue.c;
      var u = state.userGrid[rr][cc];
      var s = state.puzzle.cells[rr][cc].letter;
      if (u !== s) return false;
    }
    return true;
  }

  function maybeMarkClueSolved(clue, dir) {
    var key = dir + "_" + clue.num;
    if (state.solvedClues[key]) return;
    if (!isClueSolved(clue, dir)) return;
    state.solvedClues[key] = true;
    sfx.clue_solved();
    pushPopup("CLUE!", null, null, "is-emerald");

    // Mark the clue list item as solved
    var listToUse = dir === "A" ? dom.acrossList : dom.downList;
    var li = listToUse.querySelector('li[data-num="' + clue.num + '"][data-dir="' + dir + '"]');
    if (li) li.classList.add("solved");

    // Scholar logic: trigger only if NO cell in this clue received a hint
    // or reveal (covers intersecting-clue assistance, which the prior
    // implementation missed).
    if (clue.scholar) {
      var assisted = !!state.revealedClueKeys[key] || !!state.hintedClueKeys[key];
      if (!assisted) {
        for (var k = 0; k < clue.length; k++) {
          var rr = dir === "D" ? clue.r + k : clue.r;
          var cc = dir === "A" ? clue.c + k : clue.c;
          if (state.hintedCells[rr][cc] || state.revealedCells[rr][cc]) {
            assisted = true;
            break;
          }
        }
      }
      if (!assisted) {
        sfx.scholar_solved();
        // Trigger optional review modal (cancellable)
        scheduleTimeout(function () { openScholarQuestion(clue); }, 380);
      }
    }
    updateGoalRibbon();
  }

  function isPuzzleComplete() {
    var puz = state.puzzle;
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var cell = puz.cells[r][c];
        if (!cell) continue;
        if (state.userGrid[r][c] !== cell.letter) return false;
      }
    }
    return true;
  }

  // -- Hint / Reveal ---------------------------------------------------------
  function useHint() {
    if (phase !== "playing") return;
    // Re-entry guard so rapid clicks (button + key) can't double-charge.
    if (hintInFlight) return;
    if (state.hintsUsed >= HINT_MAX) {
      pushPopup("No hints left", null, null, "is-rose");
      return;
    }
    var clue = getActiveClue();
    if (!clue) {
      pushPopup("Pick a clue first", null, null, "is-rose");
      return;
    }
    // Find first empty/wrong letter in clue
    var target = null;
    for (var k = 0; k < clue.length; k++) {
      var rr = state.cursor.dir === "D" ? clue.r + k : clue.r;
      var cc = state.cursor.dir === "A" ? clue.c + k : clue.c;
      if (state.revealedCells[rr][cc]) continue;
      var sol = state.puzzle.cells[rr][cc].letter;
      if (state.userGrid[rr][cc] !== sol) { target = { r: rr, c: cc, l: sol }; break; }
    }
    if (!target) {
      pushPopup("Clue is solved", null, null, "is-emerald");
      return;
    }
    hintInFlight = true;
    try {
      state.hintsUsed++;
      state.hintCost += HINT_COST;
      var key = state.cursor.dir + "_" + clue.num;
      state.hintedClueKeys[key] = true;
      // Mark the target cell as "had hint" so scholar detection knows the
      // intersecting clue at this cell got assistance too.
      state.hintedCells[target.r][target.c] = true;
      state.userGrid[target.r][target.c] = target.l;
      // Hint cells are correct; clear any wrong-flash and stale mistake-count.
      state.cellMistakeCounted[target.r][target.c] = true;
      var letterEl = cellEls[target.r][target.c].querySelector(".ltr");
      if (letterEl) letterEl.textContent = target.l;
      var hCell = cellEls[target.r][target.c];
      if (hCell) {
        hCell.classList.remove("wrong-flash");
        hCell.classList.add("correct");
      }
      sfx.hint();
      pushPopup("HINT -" + HINT_COST, null, null, "is-cyan");
      updateHud();
      refreshHighlights();
      checkCluesAfterEdit(target.r, target.c);
      saveSnapshot();
    } finally {
      hintInFlight = false;
    }
  }

  function useReveal() {
    if (phase !== "playing") return;
    if (revealInFlight) return;
    if (state.revealsUsed >= REVEAL_MAX) {
      pushPopup("No reveals left", null, null, "is-rose");
      return;
    }
    var clue = getActiveClue();
    if (!clue) {
      pushPopup("Pick a clue first", null, null, "is-rose");
      return;
    }
    revealInFlight = true;
    try {
      state.revealsUsed++;
      state.revealCost += REVEAL_COST;
      var key = state.cursor.dir + "_" + clue.num;
      state.revealedClueKeys[key] = true;
      for (var k = 0; k < clue.length; k++) {
        var rr = state.cursor.dir === "D" ? clue.r + k : clue.r;
        var cc = state.cursor.dir === "A" ? clue.c + k : clue.c;
        var sol = state.puzzle.cells[rr][cc].letter;
        state.userGrid[rr][cc] = sol;
        state.revealedCells[rr][cc] = true;
        // Reveal does NOT add mistakes — mark counted so any prior wrong
        // letter doesn't recount and so scholar detection sees assistance.
        state.cellMistakeCounted[rr][cc] = true;
        state.hintedCells[rr][cc] = true;
        var letterEl = cellEls[rr][cc].querySelector(".ltr");
        if (letterEl) letterEl.textContent = sol;
        var rCell = cellEls[rr][cc];
        if (rCell) {
          rCell.classList.remove("wrong-flash", "correct");
          rCell.classList.add("revealed");
        }
      }
      sfx.reveal();
      pushPopup("REVEAL -" + REVEAL_COST, null, null, "is-violet");
      state.solvedClues[key] = true;
      var listToUse = state.cursor.dir === "A" ? dom.acrossList : dom.downList;
      var li = listToUse.querySelector('li[data-num="' + clue.num + '"][data-dir="' + state.cursor.dir + '"]');
      if (li) li.classList.add("solved");
      // Check intersecting clues that may now be solved
      for (var k2 = 0; k2 < clue.length; k2++) {
        var rr2 = state.cursor.dir === "D" ? clue.r + k2 : clue.r;
        var cc2 = state.cursor.dir === "A" ? clue.c + k2 : clue.c;
        checkCluesAfterEdit(rr2, cc2);
      }
      updateHud();
      refreshHighlights();
      saveSnapshot();
    } finally {
      revealInFlight = false;
    }
  }

  // -- Check current cell ----------------------------------------------------
  function checkCurrentCell() {
    if (phase !== "playing" || !state.cursor) return;
    var r = state.cursor.r;
    var c = state.cursor.c;
    var u = state.userGrid[r][c];
    if (!u) {
      pushPopup("Empty", null, null, "is-rose");
      return;
    }
    var s = state.puzzle.cells[r][c].letter;
    var cEl = cellEls[r][c];
    if (u === s) {
      if (cEl) cEl.classList.add("correct");
      pushPopup("OK", null, null, "is-emerald");
    } else {
      if (cEl) cEl.classList.add("wrong-flash");
      sfx.letter_wrong();
      var rr = r, cc = c;
      scheduleTimeout(function () {
        if (cellEls[rr] && cellEls[rr][cc] && cellEls[rr][cc] === cEl) {
          cEl.classList.remove("wrong-flash");
        }
      }, 600);
    }
  }

  // -- Scholar review modal -------------------------------------------------
  function pickQuestion() {
    // Course-bank fallback
    // MRMAC_QUESTION_VALIDATOR_V1 — retry up to 15× for a valid bank question
    var __mrmacBank = (typeof window !== "undefined" && window.MrMacsPickValidQuestion)
      ? window.MrMacsPickValidQuestion(function () {
          var bank = window.DIAG_BANK_BY_COURSE;
          if (!bank || typeof bank !== "object") return null;
          var pool = [];
          for (var c in bank) {
            if (Array.isArray(bank[c])) pool = pool.concat(bank[c]);
          }
          if (!pool.length) return null;
          var q = pool[Math.floor(Math.random() * pool.length)];
          return normalizeBankQuestion(q);
        }, 15)
      : null;
    if (__mrmacBank) return __mrmacBank;
    // Inline-bank fallback — validate before returning so a malformed inline
    // question can't slip through either. If everything is broken, return the
    // first inline question as a last resort (game stays playable).
    var __mrmacInline = (typeof window !== "undefined" && window.MrMacsPickValidQuestion)
      ? window.MrMacsPickValidQuestion(function () {
          return INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
        }, 10)
      : null;
    if (__mrmacInline) return __mrmacInline;
    return INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)];
  }
  function normalizeBankQuestion(q) {
    if (!q) return null;
    if (q.prompt && q.choices && q.correctText) return q;
    if (q.question && q.options) {
      var ct = null;
      if (typeof q.answer === "number" && q.options[q.answer]) ct = q.options[q.answer];
      else if (typeof q.correct === "number" && q.options[q.correct]) ct = q.options[q.correct];
      else if (q.correctText) ct = q.correctText;
      if (!ct) return null;
      return { prompt: q.question, choices: q.options.slice(), correctText: ct };
    }
    return null;
  }

  function openScholarQuestion(clue) {
    activeQuestion = pickQuestion();
    state.pendingScholarClue = clue;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Clue · Optional · +" + SCHOLAR_BONUS + " + " + SCHOLAR_SHARDS + " shards";
    if (dom.questionCloseBtn) dom.questionCloseBtn.textContent = "Skip";
    renderQuestion();
    prevPhase = phase;
    phase = "question";
    pauseMusic();
    pauseTimer();
    showScreen("question");
    saveSnapshot();
  }
  function renderQuestion() {
    if (!activeQuestion) return;
    dom.questionPrompt.textContent = activeQuestion.prompt;
    dom.explanation.textContent = "";
    dom.explanation.className = "explanation";
    var letters = ["A", "B", "C", "D"];
    var choices = activeQuestion.choices.slice();
    for (var i = choices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = choices[i]; choices[i] = choices[j]; choices[j] = t;
    }
    var html = "";
    for (var k = 0; k < choices.length && k < 4; k++) {
      html += '<button class="choice-btn" data-text="' + escapeHtml(choices[k]) + '">' +
        '<span class="choice-letter">' + letters[k] + '</span>' +
        escapeHtml(choices[k]) + '</button>';
    }
    dom.choiceGrid.innerHTML = html;
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    for (var bi = 0; bi < btns.length; bi++) btns[bi].addEventListener("click", onChoiceClick);
  }
  function onChoiceClick(e) {
    var btn = e.currentTarget;
    var picked = btn.getAttribute("data-text");
    var correct = picked === activeQuestion.correctText;
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    btns.forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute("data-text") === activeQuestion.correctText) b.classList.add("is-correct");
      else if (b === btn) b.classList.add("is-wrong");
    });
    if (correct) {
      dom.explanation.textContent = "Decoded! +" + SCHOLAR_BONUS + " plus " + SCHOLAR_SHARDS + " shards.";
      dom.explanation.className = "explanation is-correct";
      state.questionsCorrect++;
      sfx.scholar_correct();
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText;
      dom.explanation.className = "explanation is-wrong";
      sfx.scholar_wrong();
    }
    state.questionsTotal++;
    setTimeout(function () { closeQuestion(correct); }, 1100);
  }
  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += SCHOLAR_BONUS;
      addShards(SCHOLAR_SHARDS, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCHOLAR_BONUS + " SCHOLAR", null, null, "is-bonus");
    }
    activeQuestion = null;
    state.pendingScholarClue = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    resumeTimer();
    updateHud();
    if (isPuzzleComplete()) onPuzzleComplete();
  }
  function skipQuestion() {
    activeQuestion = null;
    state.pendingScholarClue = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    resumeTimer();
    updateHud();
    if (isPuzzleComplete()) onPuzzleComplete();
  }

  // -- Timer / phase ---------------------------------------------------------
  var tickHandle = null;
  function startTimer() {
    stopTimer();
    state.lastTick = Date.now();
    tickHandle = setInterval(tick, 250);
  }
  function pauseTimer() {
    state.timerPaused = true;
  }
  function resumeTimer() {
    state.timerPaused = false;
    state.lastTick = Date.now();
  }
  function stopTimer() {
    if (tickHandle) { clearInterval(tickHandle); tickHandle = null; }
  }
  function tick() {
    if (phase !== "playing") return;
    if (state.timerPaused) { state.lastTick = Date.now(); return; }
    var now = Date.now();
    var dt = (now - state.lastTick) / 1000;
    state.lastTick = now;
    state.timeRemaining -= dt;
    if (state.timeRemaining <= 0) {
      state.timeRemaining = 0;
      onTimeUp();
    }
    updateHud();
  }
  function onTimeUp() {
    // Force a puzzle finalization
    onPuzzleComplete(true);
  }

  // -- Puzzle complete -------------------------------------------------------
  function onPuzzleComplete(timedOut) {
    if (phase === "clear") return;
    var puz = state.puzzle;
    var fullySolved = isPuzzleComplete();
    var mistakePenalty = state.mistakes * MISTAKE_PENALTY;
    var hintPenalty = state.hintsUsed * HINT_COST;
    var revealPenalty = state.revealsUsed * REVEAL_COST;
    var timeBonus = Math.max(0, Math.floor(state.timeRemaining * TIME_BONUS_PER_SEC_LEFT));
    if (!fullySolved) timeBonus = 0;
    var basePoints = fullySolved ? PUZZLE_BASE * 10 : Math.floor(countCorrectCells() * 8);
    var puzzleScore = basePoints - mistakePenalty - hintPenalty - revealPenalty + timeBonus;
    if (state.scoreMultiplierActive) {
      puzzleScore *= 2;
      state.scoreMultiplierActive = false;
    }
    state.score += puzzleScore;
    state.lastPuzzleScore = puzzleScore;
    state.lastPuzzleTimeBonus = timeBonus;
    state.lastPuzzleFullySolved = fullySolved;

    // Snapshot stats for end-of-run
    state.totalMistakes += state.mistakes;
    state.totalHints += state.hintsUsed;
    state.totalReveals += state.revealsUsed;

    // Perfect bonus power-up drop
    if (fullySolved && state.mistakes === 0 && state.hintsUsed === 0 && state.revealsUsed === 0) {
      pushPopup("PERFECT!", null, null, "is-legend");
      maybeDropPowerup(true);
    } else {
      maybeDropPowerup(false);
    }

    // Determine pass/fail
    var passed = fullySolved && puzzleScore >= FAIL_THRESHOLD;
    if (!passed) {
      state.lives = Math.max(0, state.lives - 1);
      sfx.life_lost();
      pushPopup("LIFE LOST", null, null, "is-danger");
    } else {
      sfx.puzzle_clear();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 36, palette: ["#f5c451", "#5de0f0", "#4dd49b", "#a991ff"] });
        }
      } catch (e) {}
    }

    pauseTimer();
    state.puzzlesPlayed++;
    if (passed) state.puzzlesPassed++;

    if (state.lives <= 0) {
      // Game over
      setTimeout(function () { onGameOver(); }, 800);
      return;
    }

    // Render clear screen
    renderClearScreen(passed, fullySolved, timedOut, puzzleScore, timeBonus, basePoints);
    phase = "clear";
    showScreen("clear");
    saveSnapshot();
  }

  function countCorrectCells() {
    var n = 0;
    for (var r = 0; r < GRID_SIZE; r++) {
      for (var c = 0; c < GRID_SIZE; c++) {
        var cell = state.puzzle.cells[r][c];
        if (!cell) continue;
        if (state.userGrid[r][c] === cell.letter) n++;
      }
    }
    return n;
  }

  function renderClearScreen(passed, fullySolved, timedOut, puzzleScore, timeBonus, basePoints) {
    if (passed) {
      dom.clearKicker.textContent = "Puzzle " + state.puzzleIndex + " solved";
      dom.clearTitle.textContent = "Filled the cabinet!";
      dom.clearTip.textContent = "Next: deeper grids, sharper clues. " + (state.scoreMultiplierActive ? "2x bonus active!" : "");
    } else {
      dom.clearKicker.textContent = "Puzzle " + state.puzzleIndex + (timedOut ? " timed out" : " incomplete");
      dom.clearTitle.textContent = fullySolved ? "Cabinet sealed" : "A few squares left blank";
      dom.clearTip.textContent = "You lost a life — " + state.lives + " remaining.";
    }
    var html = "";
    html += '<div class="end-cell"><div class="end-cell-label">Puzzle Score</div><div class="end-cell-value">' + puzzleScore + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Total Score</div><div class="end-cell-value">' + state.score + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Time Bonus</div><div class="end-cell-value">' + timeBonus + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Mistakes</div><div class="end-cell-value">' + state.mistakes + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Hints / Reveals</div><div class="end-cell-value">' + state.hintsUsed + ' / ' + state.revealsUsed + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Lives</div><div class="end-cell-value">' + state.lives + '</div></div>';
    dom.clearGrid.innerHTML = html;
  }

  // -- Game over -------------------------------------------------------------
  function onGameOver() {
    phase = "ended";
    sfx.gameOver();
    stopTimer();
    stopMusic();
    var prevBest = readBest();
    var newBest = state.score > prevBest;
    if (newBest) writeBest(state.score);
    submitLeaderboard();

    dom.endKicker.textContent = newBest ? "Cabinet record" : "Run ended";
    dom.endTitle.textContent = newBest ? "New best — " + state.score + "!" : "Crossword Cabinet · Run complete";
    var html = "";
    html += '<div class="end-cell"><div class="end-cell-label">Final Score</div><div class="end-cell-value">' + state.score + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Personal Best</div><div class="end-cell-value">' + Math.max(state.score, prevBest) + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Puzzles Solved</div><div class="end-cell-value">' + state.puzzlesPassed + ' / ' + state.puzzlesPlayed + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Scholar Hits</div><div class="end-cell-value">' + state.questionsCorrect + ' / ' + state.questionsTotal + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Total Mistakes</div><div class="end-cell-value">' + state.totalMistakes + '</div></div>';
    html += '<div class="end-cell"><div class="end-cell-label">Total Hints/Reveals</div><div class="end-cell-value">' + state.totalHints + ' / ' + state.totalReveals + '</div></div>';
    dom.endGrid.innerHTML = html;
    dom.retryHint.textContent = newBest ? "You set a new personal best — share the score!" : "Top your record on the next run.";
    showScreen("end");
    clearSnapshot();
  }

  // -- Power-ups -------------------------------------------------------------
  // 5 types: free hint, free reveal, 2x score next puzzle, +120s, auto-fill
  var POWERUP_TYPES = ["free_hint", "free_reveal", "score_2x", "extra_time", "auto_fill"];
  var POWERUP_META = {
    free_hint:    { glyph: "💡", label: "Free Hint",    desc: "One free letter, no score cost" },
    free_reveal:  { glyph: "🔍", label: "Free Reveal",  desc: "One free clue reveal, no score cost" },
    score_2x:     { glyph: "⭐", label: "2x Score",     desc: "Doubles next puzzle's final score" },
    extra_time:   { glyph: "⏱",  label: "+120s",       desc: "Add two minutes to this puzzle" },
    auto_fill:    { glyph: "🔄", label: "Auto-Fill",    desc: "Auto-fill one random correct letter" }
  };

  function maybeDropPowerup(perfect) {
    if (state.inventory.length >= POWERUP_CAP) return;
    var roll = Math.random();
    var threshold = perfect ? 1.0 : 0.55;
    if (roll < threshold) {
      var t = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      state.inventory.push(t);
      sfx.powerup_pickup();
      pushPopup("+" + POWERUP_META[t].label, null, null, "is-bonus");
      updatePowerupSlots();
    }
  }

  function usePowerup(slot) {
    if (phase !== "playing") return;
    var idx = slot - 1;
    if (idx < 0 || idx >= state.inventory.length) return;
    var type = state.inventory[idx];
    state.inventory.splice(idx, 1);
    sfx.powerup_use();
    if (type === "free_hint") {
      // Like a hint but no score cost
      var savedHints = state.hintsUsed;
      var savedHintCost = state.hintCost;
      // Temporarily allow exceeding cap by 1
      state.hintsUsed = Math.max(0, state.hintsUsed - 1);
      useHint();
      // Refund the score cost increment
      state.hintCost = savedHintCost; // exact undo
      // Roll back the increment that useHint added
      state.score += HINT_COST;
      pushPopup("FREE HINT", null, null, "is-emerald");
    } else if (type === "free_reveal") {
      var savedReveals = state.revealsUsed;
      var savedRevealCost = state.revealCost;
      state.revealsUsed = Math.max(0, state.revealsUsed - 1);
      useReveal();
      state.revealCost = savedRevealCost;
      state.score += REVEAL_COST;
      pushPopup("FREE REVEAL", null, null, "is-violet");
    } else if (type === "score_2x") {
      state.scoreMultiplierActive = true;
      pushPopup("2x SCORE NEXT", null, null, "is-bonus");
    } else if (type === "extra_time") {
      state.timeRemaining += 120;
      pushPopup("+120s", null, null, "is-emerald");
    } else if (type === "auto_fill") {
      // Find a random empty/wrong cell and fill it correctly
      var candidates = [];
      for (var r = 0; r < GRID_SIZE; r++) {
        for (var c = 0; c < GRID_SIZE; c++) {
          var cell = state.puzzle.cells[r][c];
          if (!cell) continue;
          if (state.userGrid[r][c] !== cell.letter && !state.revealedCells[r][c]) {
            candidates.push({ r: r, c: c, l: cell.letter });
          }
        }
      }
      if (candidates.length) {
        var pick = candidates[Math.floor(Math.random() * candidates.length)];
        state.userGrid[pick.r][pick.c] = pick.l;
        var letterEl = cellEls[pick.r][pick.c].querySelector(".ltr");
        if (letterEl) letterEl.textContent = pick.l;
        cellEls[pick.r][pick.c].classList.add("correct");
        pushPopup("AUTO-FILL", null, null, "is-cyan");
        checkCluesAfterEdit(pick.r, pick.c);
      } else {
        pushPopup("Nothing to fill", null, null, "is-rose");
      }
    }
    updatePowerupSlots();
    updateHud();
    saveSnapshot();
  }

  function updatePowerupSlots() {
    for (var i = 0; i < dom.puSlots.length; i++) {
      var slot = dom.puSlots[i];
      if (!slot) continue;
      var glyph = slot.querySelector(".pu-glyph");
      if (i < state.inventory.length) {
        var t = state.inventory[i];
        slot.classList.remove("empty");
        slot.classList.add("has");
        if (glyph) glyph.textContent = POWERUP_META[t].glyph;
        slot.setAttribute("title", POWERUP_META[t].label + " — " + POWERUP_META[t].desc);
        slot.setAttribute("aria-label", POWERUP_META[t].label + " — press " + (i + 1));
      } else {
        slot.classList.add("empty");
        slot.classList.remove("has");
        if (glyph) glyph.textContent = "·";
        slot.setAttribute("title", "Empty slot");
        slot.setAttribute("aria-label", "Empty power-up slot " + (i + 1));
      }
    }
  }

  // -- Popup helper ----------------------------------------------------------
  function pushPopup(text, x, y, cls) {
    if (!dom.popupOverlay) return;
    var rect = dom.popupOverlay.getBoundingClientRect();
    if (x == null) x = rect.width / 2;
    if (y == null) y = 80 + Math.random() * 40;
    var el = document.createElement("div");
    el.className = "popup " + (cls || "");
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    dom.popupOverlay.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, reducedMotion ? 600 : 1300);
  }

  // -- HUD updating ----------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = state.score;
    if (dom.hudLives) dom.hudLives.textContent = state.lives;
    if (dom.hudPuzzle) dom.hudPuzzle.textContent = state.puzzleIndex;
    if (dom.hudTimer) {
      var ts = Math.max(0, Math.ceil(state.timeRemaining));
      var mm = Math.floor(ts / 60);
      var ss = ts % 60;
      dom.hudTimer.textContent = mm + ":" + (ss < 10 ? "0" : "") + ss;
      if (dom.hudTimerCell) {
        dom.hudTimerCell.classList.remove("is-warning", "is-danger");
        if (ts <= 30) dom.hudTimerCell.classList.add("is-danger");
        else if (ts <= 60) dom.hudTimerCell.classList.add("is-warning");
      }
    }
    if (dom.hudFilled) {
      var filled = 0, total = 0;
      for (var r = 0; r < GRID_SIZE; r++) {
        for (var c = 0; c < GRID_SIZE; c++) {
          var cell = state.puzzle && state.puzzle.cells[r][c];
          if (!cell) continue;
          total++;
          if (state.userGrid[r][c]) filled++;
        }
      }
      dom.hudFilled.textContent = filled + "/" + total;
    }
    if (dom.hudBest) dom.hudBest.textContent = readBest();
    if (dom.hintCost) dom.hintCost.textContent = (HINT_MAX - state.hintsUsed);
    if (dom.revealCost) dom.revealCost.textContent = (REVEAL_MAX - state.revealsUsed);
    updateGoalRibbon();
  }

  function updateGoalRibbon() {
    if (!state || !dom.goalName) return;
    var puz = state.puzzle;
    if (!puz) return;
    dom.goalName.textContent = puz.title + " · " + puz.kicker;
    var ax = 0, ay = 0;
    for (var i = 0; i < puz.across.length; i++) {
      ay++;
      if (state.solvedClues["A_" + puz.across[i].num]) ax++;
    }
    var dx = 0, dy = 0;
    for (var j = 0; j < puz.down.length; j++) {
      dy++;
      if (state.solvedClues["D_" + puz.down[j].num]) dx++;
    }
    dom.goalMeta.textContent = "Across " + ax + "/" + ay + " · Down " + dx + "/" + dy;
  }

  // -- Screens ---------------------------------------------------------------
  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen, dom.clearScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
    else if (name === "clear") dom.clearScreen.classList.add("show");
  }

  // -- Hub integration -------------------------------------------------------
  function addShards(n, source) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, source || (GAME_ID + "-default"));
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          puzzle: state.puzzleIndex,
          puzzles: state.puzzlesPassed
        });
      }
    } catch (e) {}
  }
  function saveSnapshot() {
    if (!state || phase === "setup" || phase === "ended") return;
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.save) {
        window.MrMacsSessions.save(GAME_ID, {
          score: state.score,
          puzzleIndex: state.puzzleIndex,
          ts: Date.now()
        });
      }
    } catch (e) {}
  }
  function loadSnapshot() {
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.load) {
        return window.MrMacsSessions.load(GAME_ID);
      }
    } catch (e) {}
    return null;
  }
  function clearSnapshot() {
    try {
      if (window.MrMacsSessions && window.MrMacsSessions.clear) {
        window.MrMacsSessions.clear(GAME_ID);
      }
    } catch (e) {}
  }
  var runStartTs = 0;
  function recordPlayWithProfile() {
    runStartTs = Date.now();
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          gameId: GAME_ID,
          id: GAME_ID,
          title: GAME_TITLE,
          startedAt: runStartTs
        });
      }
    } catch (e) {}
  }

  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(GAME_ID + ":best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem(GAME_ID + ":best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Init / start a puzzle -------------------------------------------------
  function initRunState() {
    state = {
      score: 0,
      lives: LIVES_INIT,
      puzzleIndex: 0,
      puzzle: null,
      cursor: null,
      userGrid: emptyUserGrid(),
      revealedCells: emptyUserGrid(),
      solvedClues: {},
      revealedClueKeys: {},
      hintedClueKeys: {},
      hintsUsed: 0,
      revealsUsed: 0,
      hintCost: 0,
      revealCost: 0,
      mistakes: 0,
      timeRemaining: PUZZLE_TIME,
      timerPaused: false,
      lastTick: Date.now(),
      inventory: [],
      shardsAwarded: 0,
      questionsCorrect: 0,
      questionsTotal: 0,
      pendingScholarClue: null,
      scoreMultiplierActive: false,
      puzzlesPlayed: 0,
      puzzlesPassed: 0,
      totalMistakes: 0,
      totalHints: 0,
      totalReveals: 0,
      lastPuzzleScore: 0,
      lastPuzzleTimeBonus: 0,
      lastPuzzleFullySolved: false,
      best: readBest()
    };
  }

  function loadPuzzle(index) {
    var template = PUZZLE_TEMPLATES[index % PUZZLE_TEMPLATES.length];
    var puz = compilePuzzle(template);
    state.puzzle = puz;
    state.puzzleIndex = index + 1;
    state.userGrid = emptyUserGrid();
    state.revealedCells = emptyUserGrid();
    state.solvedClues = {};
    state.revealedClueKeys = {};
    state.hintedClueKeys = {};
    state.hintsUsed = 0;
    state.revealsUsed = 0;
    state.hintCost = 0;
    state.revealCost = 0;
    state.mistakes = 0;
    state.timeRemaining = PUZZLE_TIME;
    state.timerPaused = false;
    state.cursor = null;
    state.pendingScholarClue = null;

    renderGrid();
    renderClueLists();
    // Auto-select first across clue
    if (puz.across.length > 0) {
      focusClue(puz.across[0].num, "A");
    } else if (puz.down.length > 0) {
      focusClue(puz.down[0].num, "D");
    }
    updateHud();
    updateGoalRibbon();
    updatePowerupSlots();
  }

  function startGame() {
    initRunState();
    recordPlayWithProfile();
    loadPuzzle(0);
    phase = "playing";
    showScreen(null);
    startMusic();
    startTimer();
  }

  function nextPuzzle() {
    var nextIdx = state.puzzleIndex; // already next since puzzleIndex is 1-based
    if (nextIdx >= PUZZLE_TEMPLATES.length) {
      // Loop puzzles for endless play
      nextIdx = nextIdx % PUZZLE_TEMPLATES.length;
    }
    loadPuzzle(nextIdx);
    phase = "playing";
    showScreen(null);
    resumeMusic();
    state.timerPaused = false;
    state.lastTick = Date.now();
  }

  function restartRun() {
    stopTimer();
    stopMusic();
    initRunState();
    recordPlayWithProfile();
    loadPuzzle(0);
    phase = "playing";
    showScreen(null);
    startMusic();
    startTimer();
  }

  function togglePause() {
    if (phase === "playing") {
      prevPhase = phase;
      phase = "paused";
      pauseTimer();
      pauseMusic();
      showScreen("pause");
      renderPauseProgress();
    } else if (phase === "paused") {
      phase = "playing";
      resumeTimer();
      resumeMusic();
      showScreen(null);
    }
  }

  function exitToHub() {
    stopTimer();
    stopMusic();
    try {
      window.location.href = "../../index.html";
    } catch (e) {}
  }

  function exitToSetup() {
    stopTimer();
    stopMusic();
    phase = "setup";
    showScreen("setup");
  }

  // -- Bindings --------------------------------------------------------------
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (k === "Escape" || k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
        if (k === "Backspace") { handleBackspace(); e.preventDefault(); return; }
        if (k === "Tab") { jumpToNextClue(); e.preventDefault(); return; }
        if (k === "ArrowLeft") { arrowMove("Left"); e.preventDefault(); return; }
        if (k === "ArrowRight") { arrowMove("Right"); e.preventDefault(); return; }
        if (k === "ArrowUp") { arrowMove("Up"); e.preventDefault(); return; }
        if (k === "ArrowDown") { arrowMove("Down"); e.preventDefault(); return; }
        if (k === "h" || k === "H") { useHint(); e.preventDefault(); return; }
        if (k === "r" || k === "R") { useReveal(); e.preventDefault(); return; }
        if (k === "1") { usePowerup(1); e.preventDefault(); return; }
        if (k === "2") { usePowerup(2); e.preventDefault(); return; }
        if (k === "3") { usePowerup(3); e.preventDefault(); return; }
        if (k.length === 1 && /^[a-zA-Z]$/.test(k)) {
          handleLetter(k);
          e.preventDefault();
          return;
        }
      } else if (phase === "paused") {
        if (k === "Escape" || k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
      } else if (phase === "question") {
        if (k === "Escape") { skipQuestion(); e.preventDefault(); return; }
      }
    });

    if (dom.startBtn) dom.startBtn.addEventListener("click", function () {
      sfxInit();
      startGame();
    });
    if (dom.soundBtn) dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      try {
        if (window.MrMacsArcadeMusic) {
          if (!soundOn && window.MrMacsArcadeMusic.stop) window.MrMacsArcadeMusic.stop();
          else if (soundOn && phase === "playing") startMusic();
        }
      } catch (e) {}
    });
    if (dom.fullscreenBtn) dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) {
          (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen).call(document.documentElement);
        } else {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        }
      } catch (e) {}
    });
    if (dom.exitBtn) dom.exitBtn.addEventListener("click", exitToHub);

    if (dom.hintBtn) dom.hintBtn.addEventListener("click", useHint);
    if (dom.revealBtn) dom.revealBtn.addEventListener("click", useReveal);
    if (dom.checkBtn) dom.checkBtn.addEventListener("click", checkCurrentCell);
    if (dom.pauseBtn) dom.pauseBtn.addEventListener("click", togglePause);

    if (dom.resumeBtn) dom.resumeBtn.addEventListener("click", togglePause);
    if (dom.restartBtn) dom.restartBtn.addEventListener("click", restartRun);
    if (dom.pauseExitBtn) dom.pauseExitBtn.addEventListener("click", exitToHub);

    if (dom.questionCloseBtn) dom.questionCloseBtn.addEventListener("click", skipQuestion);

    if (dom.nextPuzzleBtn) dom.nextPuzzleBtn.addEventListener("click", function () {
      nextPuzzle();
    });
    if (dom.clearExitBtn) dom.clearExitBtn.addEventListener("click", exitToHub);

    if (dom.setupBtn) dom.setupBtn.addEventListener("click", exitToSetup);
    if (dom.againBtn) dom.againBtn.addEventListener("click", restartRun);

    for (var pi = 0; pi < dom.puSlots.length; pi++) {
      (function (slotIdx) {
        if (!dom.puSlots[slotIdx]) return;
        dom.puSlots[slotIdx].addEventListener("click", function () {
          usePowerup(slotIdx + 1);
        });
      })(pi);
    }

    window.addEventListener("blur", function () {
      if (phase === "playing") togglePause();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && phase === "playing") togglePause();
    });
  }

  // -- Boot ------------------------------------------------------------------
  function boot() {
    cacheDom();
    renderMiniKbd();
    bindInput();
    var best = readBest();
    if (dom.hudBest) dom.hudBest.textContent = best || "--";
    showScreen("setup");
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("crossword-cabinet");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "crossword-cabinet", { compact: false });
      }
    }
  } catch (e) {}


  // ── Sound toggle live label ────────────────────────────────
  try {
    var _soundBtn = document.getElementById("soundBtn");
    if (_soundBtn && window.MrMacsProfile && window.MrMacsProfile.getSettings) {
      var _snd = MrMacsProfile.getSettings().sound;
      _soundBtn.textContent = (_snd === "off") ? "Sound Off" : "Sound On";
    }
  } catch (e) {}

  // ── Help overlay ───────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      window.MrMacsHelpOverlay.register("crossword-cabinet", {
        title: "How to Play Crossword Cabinet",
        goal: "Fill every white square with the correct letter to complete the history and civics crossword.",
        controls: [
          { key: "Click / Tap", action: "Select a cell (click again to toggle direction)" },
          { key: "A – Z",       action: "Type a letter into the selected cell" },
          { key: "Backspace",   action: "Erase the current cell" },
          { key: "Tab",         action: "Jump to the next clue" },
          { key: "Arrow keys",  action: "Move the cursor one cell" }
        ],
        tips: [
          "Click a filled clue number in the Across/Down list to jump straight to that word.",
          "Scholar clues are marked with a star — answer them correctly for a shard bonus.",
          "Work the shorter words first to seed letters that unlock the longer answers."
        ],
        scholar: "One clue per puzzle is a Scholar clue (marked ★). Type the correct answer to earn bonus shards and a review note."
      });
      var _helpSetupActions = document.querySelector("#setupScreen .setup-actions");
      if (_helpSetupActions) window.MrMacsHelpOverlay.mountButton(_helpSetupActions, "crossword-cabinet");
    }
  } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  try {
    if (window.MrMacsA11yQuickToggle) {
      var hudControls = document.querySelector(".hud-controls") || document.querySelector(".top-hud");
      if (hudControls) MrMacsA11yQuickToggle.mount(hudControls);
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "crossword-cabinet";
    var candidates = ach.filter(function(a) {
      if (a.unlocked) return false;
      return a.id.indexOf(GAME_ID_LOCAL) !== -1 || a.id.indexOf("cross-") === 0;
    });
    if (!candidates.length) return;
    var pick = candidates[0];
    var el = document.getElementById("pauseProgress");
    var title = document.getElementById("pauseProgressTitle");
    var meta = document.getElementById("pauseProgressMeta");
    var fill = document.getElementById("pauseProgressFill");
    if (!el || !title || !meta || !fill) return;
    title.textContent = pick.def.title || pick.id;
    meta.textContent = pick.def.desc || "";
    var pct = 0;
    if (window.MrMacsProfile.computeAchievementProgress) {
      var p = MrMacsProfile.computeAchievementProgress(pick.def, MrMacsProfile.get());
      if (p && p.target) pct = Math.min(100, (p.current / p.target) * 100);
    }
    fill.style.width = pct + "%";
    el.hidden = false;
  } catch (e) {}
}
