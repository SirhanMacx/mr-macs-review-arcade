/* ===========================================================================
   Anagram Atlas — Anagram unscramble · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 720x600 logical · 200+ word bank · scholar terms
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "anagram-atlas";
  var GAME_TITLE = "Anagram Atlas";

  var LOGICAL_W = 720;
  var LOGICAL_H = 600;

  var LIVES_INIT = 3;
  var BASE_TIMER = 30;          // seconds at round 1
  var MIN_TIMER = 12;           // floor
  var TIMER_DECREMENT = 1;      // -1s per round
  var HINT_COST = 50;
  var HINTS_PER_ROUND = 3;
  var SCHOLAR_FREQ = 6;         // 1 in N rounds
  var SCHOLAR_REWARD_SCORE = 1500;
  var SCHOLAR_REWARD_SHARDS = 12;
  var STREAK_FOR_LIFE = 5;
  var MAX_MULT = 5;
  var MULT_STEP = 0.5;
  var POWERUP_INV_MAX = 3;
  var POWERUP_PERFECT_DROP_RATE = 0.55; // perfect = no hints, no skip, full timer >= 60%
  var SHARDS_CAP = 200;
  var FEEDBACK_MS = 1500;

  // Tile geometry (logical) — shrinks for longer words to fit canvas
  var TILE_GAP = 8;
  var RACK_TOP = 220;
  var SLOTS_TOP = 360;
  var TILE_W = 56;       // mutable per-round
  var TILE_H = 64;       // mutable per-round
  function fitTileGeometry(n) {
    // Fit n tiles in canvas width with margin
    var margin = 60;
    var available = LOGICAL_W - margin;
    var fitW = Math.floor((available - (n - 1) * TILE_GAP) / n);
    TILE_W = Math.max(34, Math.min(56, fitW));
    TILE_H = Math.round(TILE_W * (64 / 56));
  }

  // -- Word bank (200+) ------------------------------------------------------
  // Each: { word (uppercase, no spaces), hint, category }
  var TERMS = [
    // ---- HISTORY · world (40) ---------------------------------------------
    { word: "REVOLUTION",  hint: "A major change in government or society",                       category: "history" },
    { word: "IMPERIALISM", hint: "Policy of extending a country's power by colonization",          category: "history" },
    { word: "RENAISSANCE", hint: "European cultural rebirth, 14th-17th century",                   category: "history" },
    { word: "REFORMATION", hint: "16th-century split that produced Protestant churches",           category: "history" },
    { word: "FEUDALISM",   hint: "Medieval system of lords, vassals, and serfs",                   category: "history" },
    { word: "MERCANTILISM",hint: "Economic system focused on hoarding gold and trade surplus",     category: "history" },
    { word: "ENLIGHTENMENT",hint: "18th-century movement of reason and natural rights",            category: "history" },
    { word: "CRUSADES",    hint: "Medieval Christian military expeditions to the Holy Land",       category: "history" },
    { word: "INQUISITION", hint: "Catholic tribunal that prosecuted heretics",                     category: "history" },
    { word: "ABSOLUTISM",  hint: "System where a monarch holds total power",                       category: "history" },
    { word: "NATIONALISM", hint: "Devotion to one's nation, often above other nations",            category: "history" },
    { word: "FASCISM",     hint: "Authoritarian ultranationalist ideology",                        category: "history" },
    { word: "COMMUNISM",   hint: "Classless society with collective ownership",                    category: "history" },
    { word: "SOCIALISM",   hint: "System of collective or state-owned production",                 category: "history" },
    { word: "CAPITALISM",  hint: "Private ownership of production for profit",                     category: "history" },
    { word: "GENOCIDE",    hint: "Deliberate destruction of an ethnic or national group",          category: "history" },
    { word: "HOLOCAUST",   hint: "Nazi Germany's genocide of European Jews",                       category: "history" },
    { word: "APARTHEID",   hint: "South Africa's system of legalized racial separation",           category: "history" },
    { word: "DECOLONIZATION",hint: "Process of colonies winning independence",                     category: "history" },
    { word: "INDUSTRIAL",  hint: "Adjective for the era of factories and machines",                category: "history" },
    { word: "REPUBLIC",    hint: "State without a monarch, governed by elected officials",         category: "history" },
    { word: "MONARCHY",    hint: "Government with a king or queen as head of state",               category: "history" },
    { word: "DICTATOR",    hint: "Ruler with absolute power, often seized",                        category: "history" },
    { word: "PROPAGANDA",  hint: "Information used to promote a political cause",                  category: "history" },
    { word: "ARMISTICE",   hint: "Agreement to halt fighting in a war",                            category: "history" },
    { word: "TREATY",      hint: "Formal agreement between states",                                category: "history" },
    { word: "DIPLOMACY",   hint: "Conducting relations between countries",                         category: "history" },
    { word: "BLITZKRIEG",  hint: "German lightning-war tactic of WWII",                            category: "history" },
    { word: "APPEASEMENT", hint: "Giving in to aggressors to avoid conflict",                      category: "history" },
    { word: "CONTAINMENT", hint: "Cold War policy to stop the spread of communism",                category: "history" },
    { word: "DETENTE",     hint: "Easing of Cold War tensions in the 1970s",                       category: "history" },
    { word: "PERESTROIKA", hint: "Gorbachev's Soviet economic restructuring",                      category: "history" },
    { word: "GLASNOST",    hint: "Gorbachev's policy of openness",                                 category: "history" },
    { word: "GLOBALIZATION",hint: "Worldwide integration of markets and cultures",                 category: "history" },
    { word: "URBANIZATION",hint: "Movement of people from rural to city areas",                    category: "history" },
    { word: "MIGRATION",   hint: "Movement of people from one place to another",                   category: "history" },
    { word: "REVOLUTIONARY",hint: "Adjective for radical political change",                        category: "history" },
    { word: "MEDIEVAL",    hint: "Of or relating to the Middle Ages",                              category: "history" },
    { word: "ANCIENT",     hint: "Belonging to the very distant past",                             category: "history" },
    { word: "DYNASTY",     hint: "Line of hereditary rulers",                                      category: "history" },

    // ---- HISTORY · documents and events (35) -------------------------------
    { word: "MAGNACARTA",  hint: "1215 English charter limiting royal power",                      category: "history" },
    { word: "MAYFLOWER",   hint: "1620 ship that carried the Pilgrims to America",                 category: "history" },
    { word: "GETTYSBURG",  hint: "1863 turning-point Civil War battle",                            category: "history" },
    { word: "VERSAILLES",  hint: "Palace and 1919 treaty that ended WWI",                          category: "history" },
    { word: "HIROSHIMA",   hint: "Japanese city struck by atomic bomb in 1945",                    category: "history" },
    { word: "STALINGRAD",  hint: "1942-43 Eastern Front battle that turned WWII",                  category: "history" },
    { word: "WATERLOO",    hint: "1815 battle ending Napoleon's reign",                            category: "history" },
    { word: "TRAFALGAR",   hint: "1805 naval victory by Lord Nelson",                              category: "history" },
    { word: "BASTILLE",    hint: "Paris fortress stormed in 1789",                                 category: "history" },
    { word: "MARATHON",    hint: "490 BC Greek victory over Persia",                               category: "history" },
    { word: "THERMOPYLAE", hint: "Pass where 300 Spartans held off Persia",                        category: "history" },
    { word: "PEARLHARBOR", hint: "1941 attack drawing the U.S. into WWII",                         category: "history" },
    { word: "WATERGATE",   hint: "Scandal that ended Nixon's presidency",                          category: "history" },
    { word: "SPUTNIK",     hint: "1957 first artificial satellite",                                category: "history" },
    { word: "YORKTOWN",    hint: "1781 American Revolutionary victory",                            category: "history" },
    { word: "EMANCIPATION",hint: "Lincoln's 1863 proclamation freed enslaved people",              category: "history" },
    { word: "RECONSTRUCTION",hint: "Post-Civil War rebuilding of the South",                       category: "history" },
    { word: "PROHIBITION", hint: "1920s ban on alcohol in the U.S.",                               category: "history" },
    { word: "DEPRESSION",  hint: "1930s global economic collapse",                                 category: "history" },
    { word: "NEWDEAL",     hint: "FDR's depression-era reform program",                            category: "history" },
    { word: "MARSHALL",    hint: "Plan that rebuilt postwar Western Europe",                       category: "history" },
    { word: "TRUMAN",      hint: "Doctrine to support nations resisting communism",                category: "history" },
    { word: "INDEPENDENCE",hint: "Freedom from outside rule; 1776 declaration",                    category: "history" },
    { word: "CONSTITUTION",hint: "Founding U.S. document drafted in 1787",                         category: "history" },
    { word: "ABOLITION",   hint: "Movement to end slavery",                                        category: "history" },
    { word: "SUFFRAGE",    hint: "The right to vote",                                              category: "history" },
    { word: "SEGREGATION", hint: "Forced separation of racial groups",                             category: "history" },
    { word: "INTEGRATION", hint: "Bringing separated groups together",                             category: "history" },
    { word: "CHIVALRY",    hint: "Knightly code of honor",                                         category: "history" },
    { word: "SAMURAI",     hint: "Hereditary Japanese warrior class",                              category: "history" },
    { word: "SHOGUNATE",   hint: "Japanese feudal military government",                            category: "history" },
    { word: "PHARAOH",     hint: "Title for ancient Egyptian rulers",                              category: "history" },
    { word: "PYRAMID",     hint: "Massive Egyptian or Mesoamerican monument",                      category: "history" },
    { word: "AQUEDUCT",    hint: "Roman channel for transporting water",                           category: "history" },
    { word: "COLOSSEUM",   hint: "Roman amphitheater for gladiator games",                         category: "history" },

    // ---- SCIENCE · biology / chemistry / physics (45) ----------------------
    { word: "MITOCHONDRIA",hint: "Cell organelle that produces ATP energy",                        category: "science" },
    { word: "PHOTOSYNTHESIS",hint: "How plants convert sunlight into food",                        category: "science" },
    { word: "EVOLUTION",   hint: "Change in species over generations",                             category: "science" },
    { word: "GRAVITY",     hint: "Force pulling masses toward each other",                         category: "science" },
    { word: "MAGNETISM",   hint: "Force from moving charges; iron attracts",                       category: "science" },
    { word: "ELECTRON",    hint: "Negatively charged subatomic particle",                          category: "science" },
    { word: "PROTON",      hint: "Positively charged particle in the nucleus",                     category: "science" },
    { word: "NEUTRON",     hint: "Neutral particle in the nucleus",                                category: "science" },
    { word: "MOLECULE",    hint: "Two or more atoms bonded together",                              category: "science" },
    { word: "ELEMENT",     hint: "Pure substance on the periodic table",                           category: "science" },
    { word: "COMPOUND",    hint: "Substance of two or more elements bonded chemically",            category: "science" },
    { word: "MIXTURE",     hint: "Two or more substances physically combined",                     category: "science" },
    { word: "ECOSYSTEM",   hint: "Community of organisms and their environment",                   category: "science" },
    { word: "BIODIVERSITY",hint: "Variety of life in a habitat",                                   category: "science" },
    { word: "PHOTON",      hint: "Particle of light",                                              category: "science" },
    { word: "QUANTUM",     hint: "Smallest possible discrete unit",                                category: "science" },
    { word: "ENTROPY",     hint: "Measure of disorder in a system",                                category: "science" },
    { word: "KINETIC",     hint: "Energy of motion",                                               category: "science" },
    { word: "POTENTIAL",   hint: "Stored energy due to position or state",                         category: "science" },
    { word: "RESPIRATION", hint: "Process by which cells make energy from glucose",                category: "science" },
    { word: "MITOSIS",     hint: "Cell division producing two identical daughters",                category: "science" },
    { word: "MEIOSIS",     hint: "Cell division producing four sex cells",                         category: "science" },
    { word: "OSMOSIS",     hint: "Diffusion of water across a membrane",                           category: "science" },
    { word: "DIFFUSION",   hint: "Movement from high to low concentration",                        category: "science" },
    { word: "GENOME",      hint: "Complete set of an organism's DNA",                              category: "science" },
    { word: "CHROMOSOME",  hint: "Threadlike structure carrying genes",                            category: "science" },
    { word: "RIBOSOME",    hint: "Cell structure that builds proteins",                            category: "science" },
    { word: "ENZYME",      hint: "Protein that speeds up chemical reactions",                      category: "science" },
    { word: "BACTERIA",    hint: "Single-celled prokaryotic microorganisms",                       category: "science" },
    { word: "VIRUS",       hint: "Tiny infectious agent that needs a host cell",                   category: "science" },
    { word: "ANTIBODY",    hint: "Protein the immune system uses to fight invaders",               category: "science" },
    { word: "VACCINE",     hint: "Substance that trains immunity to a pathogen",                   category: "science" },
    { word: "PANDEMIC",    hint: "Worldwide outbreak of disease",                                  category: "science" },
    { word: "VOLCANO",     hint: "Vent in Earth's crust that erupts magma",                        category: "science" },
    { word: "EARTHQUAKE",  hint: "Sudden shaking of the ground from tectonic motion",              category: "science" },
    { word: "TSUNAMI",     hint: "Giant ocean wave triggered by a quake",                          category: "science" },
    { word: "EROSION",     hint: "Wearing away of rock by wind or water",                          category: "science" },
    { word: "TECTONIC",    hint: "Adjective for plates that build mountains",                      category: "science" },
    { word: "EQUINOX",     hint: "Day and night of equal length, twice a year",                    category: "science" },
    { word: "SOLSTICE",    hint: "Longest or shortest day of the year",                            category: "science" },
    { word: "GALAXY",      hint: "Vast system of stars, gas, and dust",                            category: "science" },
    { word: "NEBULA",      hint: "Cloud of gas and dust in space",                                 category: "science" },
    { word: "ATMOSPHERE",  hint: "Layer of gases surrounding a planet",                            category: "science" },
    { word: "HYDROGEN",    hint: "Element 1, lightest gas in the universe",                        category: "science" },
    { word: "OXYGEN",      hint: "Element you breathe; #8 on the table",                           category: "science" },

    // ---- GEOGRAPHY (30) ----------------------------------------------------
    { word: "ARCHIPELAGO", hint: "Group or chain of islands",                                      category: "geography" },
    { word: "PENINSULA",   hint: "Land surrounded by water on three sides",                        category: "geography" },
    { word: "ISTHMUS",     hint: "Narrow strip of land joining two larger areas",                  category: "geography" },
    { word: "PLATEAU",     hint: "High flat tableland",                                            category: "geography" },
    { word: "TUNDRA",      hint: "Treeless arctic plain",                                          category: "geography" },
    { word: "SAVANNA",     hint: "Tropical grassland with scattered trees",                        category: "geography" },
    { word: "RAINFOREST",  hint: "Dense, wet forest near the equator",                             category: "geography" },
    { word: "DESERT",      hint: "Region of very low rainfall",                                    category: "geography" },
    { word: "PRAIRIE",     hint: "North American grassland",                                       category: "geography" },
    { word: "STEPPE",      hint: "Eurasian grassy plain",                                          category: "geography" },
    { word: "TAIGA",       hint: "Northern coniferous forest belt",                                category: "geography" },
    { word: "TROPICAL",    hint: "Adjective for warm, humid equatorial regions",                  category: "geography" },
    { word: "MONSOON",     hint: "Seasonal wind bringing heavy rain in South Asia",                category: "geography" },
    { word: "TYPHOON",     hint: "Pacific tropical cyclone",                                       category: "geography" },
    { word: "HURRICANE",   hint: "Atlantic tropical cyclone",                                      category: "geography" },
    { word: "EQUATOR",     hint: "Imaginary line at 0 degrees latitude",                           category: "geography" },
    { word: "MERIDIAN",    hint: "Imaginary line of longitude",                                    category: "geography" },
    { word: "LATITUDE",    hint: "Distance north or south of the equator",                        category: "geography" },
    { word: "LONGITUDE",   hint: "Distance east or west of the prime meridian",                   category: "geography" },
    { word: "CONTINENT",   hint: "One of seven major landmasses",                                  category: "geography" },
    { word: "OCEANIA",     hint: "Region including Australia and Pacific islands",                category: "geography" },
    { word: "MEDITERRANEAN",hint: "Sea between Europe and Africa",                                 category: "geography" },
    { word: "HIMALAYAS",   hint: "Mountain range home to Mount Everest",                           category: "geography" },
    { word: "AMAZON",      hint: "World's largest rainforest and second-longest river",            category: "geography" },
    { word: "SAHARA",      hint: "Largest hot desert, in North Africa",                            category: "geography" },
    { word: "GANGES",      hint: "Sacred river of northern India",                                 category: "geography" },
    { word: "MEKONG",      hint: "Major Southeast Asian river",                                    category: "geography" },
    { word: "BALKANS",     hint: "Southeastern European peninsula",                                category: "geography" },
    { word: "URBAN",       hint: "Adjective for densely built city areas",                         category: "geography" },
    { word: "RURAL",       hint: "Adjective for countryside areas",                                category: "geography" },

    // ---- CIVICS / GOV (30) -------------------------------------------------
    { word: "BICAMERAL",   hint: "Legislature with two chambers",                                  category: "civics" },
    { word: "UNICAMERAL",  hint: "Legislature with one chamber",                                   category: "civics" },
    { word: "FEDERALISM",  hint: "Power split between national and state governments",             category: "civics" },
    { word: "CONFEDERATION",hint: "Loose union of states",                                         category: "civics" },
    { word: "RATIFICATION",hint: "Formal approval of a treaty or amendment",                       category: "civics" },
    { word: "AMENDMENT",   hint: "Change to a constitution",                                       category: "civics" },
    { word: "JUDICIARY",   hint: "Branch of government with the courts",                           category: "civics" },
    { word: "EXECUTIVE",   hint: "Branch headed by the president",                                 category: "civics" },
    { word: "LEGISLATIVE", hint: "Branch that makes laws",                                         category: "civics" },
    { word: "VETO",        hint: "President's rejection of a bill",                                category: "civics" },
    { word: "FILIBUSTER",  hint: "Senate stalling tactic to block a vote",                         category: "civics" },
    { word: "GERRYMANDER", hint: "Drawing district lines for partisan advantage",                  category: "civics" },
    { word: "IMPEACHMENT", hint: "Formal charge against a high official",                          category: "civics" },
    { word: "JURISDICTION",hint: "A court's authority over a case",                                category: "civics" },
    { word: "LITIGATION",  hint: "Process of taking legal action in court",                        category: "civics" },
    { word: "LIBERTY",     hint: "Freedom from arbitrary government control",                      category: "civics" },
    { word: "JUSTICE",     hint: "Fair treatment under the law",                                   category: "civics" },
    { word: "DEMOCRACY",   hint: "Government by the people",                                       category: "civics" },
    { word: "OLIGARCHY",   hint: "Rule by a small elite",                                          category: "civics" },
    { word: "AUTHORITY",   hint: "Legitimate power to make decisions",                             category: "civics" },
    { word: "JURY",        hint: "Citizens who deliver a verdict in court",                        category: "civics" },
    { word: "DEFENDANT",   hint: "Person accused in a court case",                                 category: "civics" },
    { word: "PLAINTIFF",   hint: "Person bringing a civil lawsuit",                                category: "civics" },
    { word: "TESTIMONY",   hint: "Statement under oath in court",                                  category: "civics" },
    { word: "VERDICT",     hint: "Final decision of a jury",                                       category: "civics" },
    { word: "TARIFF",      hint: "Tax on imported goods",                                          category: "civics" },
    { word: "EMBARGO",     hint: "Official ban on trade with a country",                           category: "civics" },
    { word: "TREASON",     hint: "Betraying one's own country",                                    category: "civics" },
    { word: "CITIZEN",     hint: "Member of a state with rights and duties",                       category: "civics" },
    { word: "BUREAUCRACY", hint: "System of government agencies and officials",                    category: "civics" },

    // ---- ECONOMICS (15) ----------------------------------------------------
    { word: "INFLATION",   hint: "General rise in prices over time",                               category: "economics" },
    { word: "DEFLATION",   hint: "General fall in prices over time",                               category: "economics" },
    { word: "RECESSION",   hint: "Period of significant economic decline",                         category: "economics" },
    { word: "MONOPOLY",    hint: "Single seller dominating a market",                              category: "economics" },
    { word: "OLIGOPOLY",   hint: "Market dominated by a few large firms",                          category: "economics" },
    { word: "DEMAND",      hint: "Quantity buyers want at a given price",                          category: "economics" },
    { word: "SUPPLY",      hint: "Quantity sellers offer at a given price",                        category: "economics" },
    { word: "EQUILIBRIUM", hint: "Market state where supply meets demand",                         category: "economics" },
    { word: "SCARCITY",    hint: "Limited resources versus unlimited wants",                       category: "economics" },
    { word: "ENTREPRENEUR",hint: "Person who starts and runs a business",                          category: "economics" },
    { word: "INTEREST",    hint: "Cost of borrowing money",                                        category: "economics" },
    { word: "DIVIDEND",    hint: "Share of profits paid to stockholders",                          category: "economics" },
    { word: "BUDGET",      hint: "Plan for income and expenditure",                                category: "economics" },
    { word: "DEFICIT",     hint: "When spending exceeds revenue",                                  category: "economics" },
    { word: "SURPLUS",     hint: "When revenue exceeds spending",                                  category: "economics" },

    // ---- ART / HUMANITIES (15) --------------------------------------------
    { word: "CHIAROSCURO", hint: "Strong contrast of light and shadow in art",                     category: "art" },
    { word: "ROCOCO",      hint: "Ornate 18th-century French style",                               category: "art" },
    { word: "BAROQUE",     hint: "Dramatic 17th-century European art and music style",             category: "art" },
    { word: "GOTHIC",      hint: "Pointed-arch medieval cathedral style",                          category: "art" },
    { word: "ROMANESQUE",  hint: "Round-arched medieval architectural style",                      category: "art" },
    { word: "IMPRESSIONISM",hint: "Movement of light, color, and brief brushstrokes",              category: "art" },
    { word: "CUBISM",      hint: "Movement breaking forms into geometric planes",                  category: "art" },
    { word: "REALISM",     hint: "Style depicting subjects truthfully",                            category: "art" },
    { word: "ROMANTICISM", hint: "Movement of emotion, nature, and the sublime",                   category: "art" },
    { word: "SURREALISM",  hint: "Art of dreamlike, illogical scenes",                             category: "art" },
    { word: "MURAL",       hint: "Painting applied directly to a wall",                            category: "art" },
    { word: "FRESCO",      hint: "Painting on fresh wet plaster",                                  category: "art" },
    { word: "MOSAIC",      hint: "Image made from small tiles or stones",                          category: "art" },
    { word: "CALLIGRAPHY", hint: "Art of decorative handwriting",                                  category: "art" },
    { word: "SYMPHONY",    hint: "Long musical work for full orchestra",                           category: "art" },

    // ---- LIT / RHETORIC (10) ----------------------------------------------
    { word: "METAPHOR",    hint: "Implicit comparison without 'like' or 'as'",                     category: "art" },
    { word: "ALLEGORY",    hint: "Story with a hidden moral or political meaning",                 category: "art" },
    { word: "SOLILOQUY",   hint: "Character speaking thoughts aloud, alone on stage",              category: "art" },
    { word: "TRAGEDY",     hint: "Drama in which the protagonist meets ruin",                      category: "art" },
    { word: "COMEDY",      hint: "Drama with a happy ending and humor",                            category: "art" },
    { word: "EPIC",        hint: "Long narrative poem about heroic deeds",                         category: "art" },
    { word: "SONNET",      hint: "Fourteen-line rhymed poem",                                      category: "art" },
    { word: "RHETORIC",    hint: "Art of persuasive speaking or writing",                          category: "art" },
    { word: "SATIRE",      hint: "Mocking criticism of society or politics",                       category: "art" },
    { word: "PARABLE",     hint: "Short story illustrating a moral lesson",                        category: "art" }
  ];

  // -- Scholar question pool (28 inline) -------------------------------------
  // Each row: termWord (uppercase no spaces, must match a TERMS entry) + question + 4 choices + correctIndex + explanation.
  var SCHOLAR_BANK = [
    {
      termWord: "REVOLUTION",
      prompt: "Which event is most often cited as the start of the modern political idea of revolution?",
      choices: [
        "American Revolution (1776) and French Revolution (1789)",
        "The Crusades (1096-1291)",
        "The Hundred Years' War (1337-1453)",
        "The Reformation (1517)"
      ],
      correctIndex: 0,
      explanation: "Both revolutions enshrined natural rights and popular sovereignty as foundations for legitimate government."
    },
    {
      termWord: "IMPERIALISM",
      prompt: "Late-19th-century European imperialism in Africa was formalized at:",
      choices: [
        "The Berlin Conference (1884-1885)",
        "The Treaty of Westphalia (1648)",
        "The Congress of Vienna (1815)",
        "The Treaty of Tordesillas (1494)"
      ],
      correctIndex: 0,
      explanation: "European powers met in Berlin to set rules for partitioning African territory without African input."
    },
    {
      termWord: "RENAISSANCE",
      prompt: "The Renaissance most directly led to:",
      choices: [
        "Renewed interest in classical Greek and Roman ideas",
        "The fall of the Roman Empire",
        "The medieval feudal system",
        "The Mongol conquests"
      ],
      correctIndex: 0,
      explanation: "Humanists revived classical texts, fueling new art, science, and political thought."
    },
    {
      termWord: "REFORMATION",
      prompt: "The Protestant Reformation began in 1517 when Martin Luther:",
      choices: [
        "Posted the 95 Theses challenging indulgences",
        "Crowned himself Holy Roman Emperor",
        "Translated the Quran into Latin",
        "Founded the Society of Jesus"
      ],
      correctIndex: 0,
      explanation: "Luther's challenge to Catholic practices launched a schism that produced Protestant denominations."
    },
    {
      termWord: "FEUDALISM",
      prompt: "In medieval European feudalism, vassals owed their lords primarily:",
      choices: [
        "Military service in exchange for land",
        "Cash payments in gold",
        "Religious tithes only",
        "Trade goods from overseas"
      ],
      correctIndex: 0,
      explanation: "The land-for-service exchange (a fief) was the core economic and political bond."
    },
    {
      termWord: "MAGNACARTA",
      prompt: "The Magna Carta (1215) is significant because it:",
      choices: [
        "Limited the power of the English king",
        "Established Parliament",
        "Ended the Hundred Years' War",
        "Created common law from scratch"
      ],
      correctIndex: 0,
      explanation: "It introduced the principle that the monarch was bound by law, influencing later constitutions."
    },
    {
      termWord: "MERCANTILISM",
      prompt: "Mercantilist economic policy emphasized:",
      choices: [
        "Accumulating gold and a favorable trade balance",
        "Free trade between all nations",
        "Industrial workers' rights",
        "Public ownership of factories"
      ],
      correctIndex: 0,
      explanation: "Colonies were managed to enrich the mother country through controlled trade and bullion."
    },
    {
      termWord: "ENLIGHTENMENT",
      prompt: "Enlightenment thinkers like Locke and Rousseau argued that legitimate government requires:",
      choices: [
        "Consent of the governed",
        "Divine right of kings",
        "Hereditary aristocracy",
        "Religious uniformity"
      ],
      correctIndex: 0,
      explanation: "Social-contract theory underpinned modern democratic constitutions."
    },
    {
      termWord: "NATIONALISM",
      prompt: "Nationalism contributed to the unification of which two countries in the 1860s-70s?",
      choices: [
        "Italy and Germany",
        "England and Scotland",
        "Spain and Portugal",
        "Russia and Poland"
      ],
      correctIndex: 0,
      explanation: "Bismarck unified Germany (1871); Cavour and Garibaldi unified Italy (1861-1870)."
    },
    {
      termWord: "GENOCIDE",
      prompt: "Which 20th-century event is the namesake for the legal definition of genocide?",
      choices: [
        "The Holocaust during WWII",
        "The 1918 flu pandemic",
        "The Boer War",
        "The Russo-Japanese War"
      ],
      correctIndex: 0,
      explanation: "Raphael Lemkin coined the term in 1944 in response to Nazi mass murder of Jews and others."
    },
    {
      termWord: "CONTAINMENT",
      prompt: "U.S. containment policy during the Cold War was first articulated by:",
      choices: [
        "George Kennan in his 1947 'Long Telegram'",
        "Theodore Roosevelt's Big Stick",
        "Woodrow Wilson's 14 Points",
        "Calvin Coolidge"
      ],
      correctIndex: 0,
      explanation: "Kennan argued for patient, firm resistance to Soviet expansion, shaping U.S. doctrine for decades."
    },
    {
      termWord: "VERSAILLES",
      prompt: "The Treaty of Versailles (1919) most directly:",
      choices: [
        "Imposed harsh terms on Germany after WWI",
        "Ended the American Civil War",
        "Created the European Union",
        "Founded the Catholic Church"
      ],
      correctIndex: 0,
      explanation: "War-guilt and reparations clauses fueled German resentment and helped fuel the rise of fascism."
    },
    {
      termWord: "PEARLHARBOR",
      prompt: "The 1941 attack on Pearl Harbor led directly to:",
      choices: [
        "U.S. entry into World War II",
        "The end of WWII",
        "The Marshall Plan",
        "Founding of the UN"
      ],
      correctIndex: 0,
      explanation: "Congress declared war on Japan the next day; Germany then declared war on the U.S."
    },
    {
      termWord: "EMANCIPATION",
      prompt: "Lincoln's Emancipation Proclamation (1863):",
      choices: [
        "Freed enslaved people in Confederate-held areas",
        "Ended segregation nationwide",
        "Gave Black men the vote",
        "Abolished slavery in border states"
      ],
      correctIndex: 0,
      explanation: "Universal abolition came with the 13th Amendment (1865)."
    },
    {
      termWord: "SUFFRAGE",
      prompt: "The 19th Amendment (1920) guaranteed:",
      choices: [
        "Women's right to vote in federal elections",
        "The right of 18-year-olds to vote",
        "Voting rights for non-citizens",
        "An end to the Electoral College"
      ],
      correctIndex: 0,
      explanation: "It capped a 70+ year fight by suffragists like Stanton, Anthony, and Wells."
    },
    {
      termWord: "ABOLITION",
      prompt: "Frederick Douglass and William Lloyd Garrison are most associated with:",
      choices: [
        "The abolition movement against slavery",
        "The temperance movement",
        "The progressive labor movement",
        "Women's suffrage exclusively"
      ],
      correctIndex: 0,
      explanation: "Both used speech, writing, and journalism to galvanize antislavery opinion in the U.S. North."
    },
    {
      termWord: "MITOCHONDRIA",
      prompt: "Mitochondria are nicknamed the 'powerhouse of the cell' because they:",
      choices: [
        "Produce ATP through cellular respiration",
        "Synthesize proteins from mRNA",
        "Store the cell's genetic blueprint",
        "Filter waste from the cytoplasm"
      ],
      correctIndex: 0,
      explanation: "ATP is the chemical currency cells use to power processes; mitochondria are the major site of its production."
    },
    {
      termWord: "PHOTOSYNTHESIS",
      prompt: "The overall reaction of photosynthesis converts:",
      choices: [
        "Carbon dioxide and water into glucose and oxygen",
        "Glucose and oxygen into carbon dioxide and water",
        "Nitrogen into ammonia",
        "Methane into carbon dioxide"
      ],
      correctIndex: 0,
      explanation: "Sunlight powers chloroplasts to fix CO2 into sugar, releasing O2 as a byproduct."
    },
    {
      termWord: "EVOLUTION",
      prompt: "Charles Darwin's main mechanism for evolution was:",
      choices: [
        "Natural selection acting on heritable variation",
        "Conscious design by individuals",
        "Sudden divine creation events",
        "Heat-driven mutations only"
      ],
      correctIndex: 0,
      explanation: "Variation + differential reproduction across generations leads to adaptation."
    },
    {
      termWord: "GRAVITY",
      prompt: "Newton's law of universal gravitation states the force between masses is:",
      choices: [
        "Proportional to product of masses, inverse square of distance",
        "Constant regardless of distance",
        "Proportional to distance squared",
        "Independent of either mass"
      ],
      correctIndex: 0,
      explanation: "F = G m1 m2 / r^2 — the inverse-square law explains orbits and falling apples alike."
    },
    {
      termWord: "ARCHIPELAGO",
      prompt: "Which country is itself a major archipelago in Southeast Asia?",
      choices: [
        "Indonesia",
        "Mongolia",
        "Switzerland",
        "Bolivia"
      ],
      correctIndex: 0,
      explanation: "Indonesia comprises more than 17,000 islands across the equator."
    },
    {
      termWord: "PENINSULA",
      prompt: "The Korean Peninsula is shared by:",
      choices: [
        "North Korea and South Korea",
        "China and Japan",
        "Vietnam and Laos",
        "Mongolia and Kazakhstan"
      ],
      correctIndex: 0,
      explanation: "It juts south from East Asia, divided since 1948 along the 38th parallel."
    },
    {
      termWord: "MONSOON",
      prompt: "The South Asian monsoon brings most of its rain in which months?",
      choices: [
        "June through September",
        "December through February",
        "March through April only",
        "October through November"
      ],
      correctIndex: 0,
      explanation: "The summer monsoon delivers about 80% of India's annual rainfall and is vital for agriculture."
    },
    {
      termWord: "BICAMERAL",
      prompt: "The U.S. Congress is bicameral, meaning it has:",
      choices: [
        "Two chambers: the Senate and the House of Representatives",
        "One chamber",
        "Three chambers including the Cabinet",
        "Only an executive council"
      ],
      correctIndex: 0,
      explanation: "Bicameralism was the Connecticut Compromise: equal Senate, population-based House."
    },
    {
      termWord: "FEDERALISM",
      prompt: "Federalism in the U.S. Constitution divides power between:",
      choices: [
        "The federal government and the states",
        "The president and Supreme Court",
        "The Senate and the House only",
        "Citizens and the press"
      ],
      correctIndex: 0,
      explanation: "Article VI's supremacy clause and the 10th Amendment together draw the federal-state line."
    },
    {
      termWord: "AMENDMENT",
      prompt: "How many amendments does the U.S. Constitution have today?",
      choices: [
        "Twenty-seven",
        "Ten",
        "Fifty",
        "One hundred"
      ],
      correctIndex: 0,
      explanation: "The Bill of Rights (10) plus 17 more, ending with the 27th (1992) on congressional pay."
    },
    {
      termWord: "GERRYMANDER",
      prompt: "Gerrymandering refers to:",
      choices: [
        "Drawing district lines to favor a political party",
        "Counting electoral college votes",
        "Naturalizing new citizens",
        "Censoring campaign ads"
      ],
      correctIndex: 0,
      explanation: "Named for Massachusetts Governor Elbridge Gerry's salamander-shaped 1812 district."
    },
    {
      termWord: "INFLATION",
      prompt: "Inflation is best described as:",
      choices: [
        "A general rise in the price level over time",
        "A drop in the unemployment rate",
        "An increase in factory output",
        "A trade-deficit reduction"
      ],
      correctIndex: 0,
      explanation: "Central banks (like the Federal Reserve) target moderate inflation, often around 2% per year."
    }
  ];

  // -- Powerup metadata ------------------------------------------------------
  var POWERUP_META = {
    hint:     { glyph: "💡", color: "#f5c451", glow: "#f5c451", label: "FREE HINT",   key: "1", desc: "Reveal a letter, no cost" },
    time:     { glyph: "⏱",        color: "#5de0f0", glow: "#5de0f0", label: "+10s",        key: "2", desc: "Add 10 seconds to timer" },
    autosolve:{ glyph: "🔍", color: "#a991ff", glow: "#a991ff", label: "AUTO-SOLVE",  key: "3", desc: "Solve current term, save a life" },
    multx2:   { glyph: "⭐",        color: "#fff8c4", glow: "#f0a800", label: "x2 MULT",     key: "4", desc: "Next 5 correct double-score" },
    shuffle:  { glyph: "🔄", color: "#6dc18f", glow: "#6dc18f", label: "RE-SHUFFLE",   key: "5", desc: "Re-scramble current letters" }
  };
  var POWERUP_TYPES = ["hint", "time", "autosolve", "multx2", "shuffle"];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | feedback
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var soundOn = true;
  var startTimeMs = 0;

  // -- SFX (Web Audio) -------------------------------------------------------
  var sfxCtx = null;
  function sfxInit() {
    if (sfxCtx || !soundOn) return sfxCtx;
    try { sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { sfxCtx = null; }
    return sfxCtx;
  }
  function sfxTone(freq, duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var type = opts.type || "square";
    var vol = opts.volume == null ? 0.16 : opts.volume;
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
  function sfxNoise(duration, opts) {
    if (!soundOn) return;
    var ctxA = sfxInit();
    if (!ctxA) return;
    opts = opts || {};
    var vol = opts.volume == null ? 0.16 : opts.volume;
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
    tilePick:  function () { sfxTone(740, 0.05, { type: "triangle", volume: 0.10 }); },
    tilePlace: function () { sfxTone(540, 0.06, { type: "square", volume: 0.10, endFreq: 660 }); },
    tileBack:  function () { sfxTone(380, 0.06, { type: "triangle", volume: 0.09, endFreq: 280 }); },
    hint: function () {
      [880, 1175].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.14 }); }, i * 70);
      });
    },
    submitCorrect: function () {
      [659, 988, 1318, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.13, { type: "triangle", volume: 0.16 }); }, i * 60);
      });
    },
    submitWrong: function () {
      sfxNoise(0.18, { volume: 0.14, cutoff: 700 });
      sfxTone(330, 0.22, { type: "sawtooth", volume: 0.14, endFreq: 110 });
    },
    scholarAppear: function () {
      [523, 784, 988].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.15, { type: "triangle", volume: 0.16 }); }, i * 80);
      });
    },
    scholarCorrect: function () {
      [659, 988, 1318, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.18, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholarWrong: function () {
      sfxTone(440, 0.3, { type: "sawtooth", volume: 0.14, endFreq: 110 });
    },
    lifeLost: function () {
      sfxNoise(0.4, { volume: 0.18, cutoff: 600 });
      sfxTone(330, 0.4, { type: "sawtooth", volume: 0.16, endFreq: 50 });
    },
    levelUp: function () {
      [523, 659, 784, 988, 1175, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.16 }); }, i * 70);
      });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    },
    powerupPickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerupUse: function () {
      [988, 1318, 1568].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 50);
      });
    },
    multBreak: function () {
      sfxTone(220, 0.25, { type: "sawtooth", volume: 0.14, endFreq: 90 });
      sfxNoise(0.12, { volume: 0.10, cutoff: 800 });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }
  function setupDom() {
    canvas = $("atlasCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudMult = $("hudMult");
    dom.hudTimer = $("hudTimer");
    dom.hudTimerCell = $("hudTimerCell");
    dom.hudStreak = $("hudStreak");
    dom.hudBest = $("hudBest");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
    dom.waveRibbon = $("waveRibbon");
    dom.popupOverlay = $("popupOverlay");
    dom.setupScreen = $("setupScreen");
    dom.questionScreen = $("questionScreen");
    dom.pauseScreen = $("pauseScreen");
    dom.endScreen = $("endScreen");
    dom.questionPrompt = $("questionPrompt");
    dom.choiceGrid = $("choiceGrid");
    dom.questionMeta = $("questionMeta");
    dom.questionCloseBtn = $("questionCloseBtn");
    dom.explanation = $("explanation");
    dom.startBtn = $("startBtn");
    dom.soundBtn = $("soundBtn");
    dom.fullscreenBtn = $("fullscreenBtn");
    dom.resumeBtn = $("resumeBtn");
    dom.restartBtn = $("restartBtn");
    dom.pauseExitBtn = $("pauseExitBtn");
    dom.exitBtn = $("exitBtn");
    dom.pauseBtn = $("pauseBtn");
    dom.setupBtn = $("setupBtn");
    dom.againBtn = $("againBtn");
    dom.endTitle = $("endTitle");
    dom.endKicker = $("endKicker");
    dom.endGrid = $("endGrid");
    dom.retryHint = $("retryHint");
    dom.resumeCard = $("resumeCard");
    dom.leaderboardPanel = $("leaderboardPanel");
    dom.hintBtn = $("hintBtn");
    dom.shuffleBtn = $("shuffleBtn");
    dom.skipBtn = $("skipBtn");
    dom.roundControls = $("roundControls");
    dom.powerupTray = $("powerupTray");
  }

  // -- Word selection / scrambling -------------------------------------------
  function pickTerm(round) {
    // Round 1: shorter terms (5-7); ramp up over time. Bank is 5..14; UI handles long words.
    var MAX_PICK_LEN = 14;
    var minLen = 5;
    var maxLen = Math.min(MAX_PICK_LEN, 5 + Math.floor(round / 2));
    if (maxLen < minLen + 2) maxLen = minLen + 2;
    var pool = TERMS.filter(function (t) { return t.word.length >= minLen && t.word.length <= maxLen; });
    if (pool.length === 0) pool = TERMS;
    // Avoid recent terms
    if (state && state.recentTerms && state.recentTerms.length) {
      var fresh = pool.filter(function (t) { return state.recentTerms.indexOf(t.word) < 0; });
      if (fresh.length > 0) pool = fresh;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function isScholarRound(round) {
    // 1 in SCHOLAR_FREQ rounds (skip first round so player learns mechanic)
    if (round < 2) return false;
    return Math.random() < (1 / SCHOLAR_FREQ);
  }
  function scrambleLetters(word) {
    var arr = word.split("");
    // Re-roll until result differs from original (for short words sometimes equal)
    for (var attempt = 0; attempt < 10; attempt++) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      if (arr.join("") !== word) break;
    }
    return arr;
  }

  // -- Round state -----------------------------------------------------------
  function startRound(opts) {
    opts = opts || {};
    var term = opts.forceTerm || pickTerm(state.round);
    var scholar = opts.forceScholar != null ? opts.forceScholar : isScholarRound(state.round);
    // If scholar, prefer a term that has a SCHOLAR_BANK entry
    if (scholar) {
      var scholarPool = TERMS.filter(function (t) {
        return SCHOLAR_BANK.some(function (b) { return b.termWord === t.word; });
      });
      if (scholarPool.length > 0) {
        // Avoid scholars we already saw this run
        var fresh = scholarPool.filter(function (t) { return state.scholarSeen.indexOf(t.word) < 0; });
        var src = fresh.length ? fresh : scholarPool;
        term = src[Math.floor(Math.random() * src.length)];
      }
    }
    var letters = scrambleLetters(term.word);
    fitTileGeometry(letters.length);
    // Scrambled rack: each tile = { letter, slotIndex (-1 if in rack), id, animT, fromX, fromY }
    var tiles = [];
    for (var i = 0; i < letters.length; i++) {
      tiles.push({ id: i, letter: letters[i], slotIndex: -1, animT: 0, fromX: 0, fromY: 0, toX: 0, toY: 0 });
    }
    var roundTimer = Math.max(MIN_TIMER, BASE_TIMER - (state.round - 1) * TIMER_DECREMENT);
    state.currentRound = {
      term: term,
      tiles: tiles,
      slotsFilled: new Array(term.word.length).fill(null),  // tile id at each slot or null
      slotsRevealed: new Array(term.word.length).fill(false), // hint pre-fills
      scholar: scholar,
      timeRemaining: roundTimer,
      timerInitial: roundTimer,
      hintsUsed: 0,
      shuffles: 0,
      autoSolved: false,
      hintScoreCost: 0,
      submittedAt: 0,
      result: null,    // null | "correct" | "wrong" | "skipped" | "timeout" | "autosolve"
      feedbackT: 0,
      shake: 0,
      revealed: false,
      perfect: false
    };
    state.recentTerms.push(term.word);
    if (state.recentTerms.length > 12) state.recentTerms.shift();
    if (scholar) {
      state.scholarSeen.push(term.word);
      sfx.scholarAppear();
      pushPopup("SCHOLAR TERM", LOGICAL_W / 2, 200, "is-tetris");
    }
    layoutRound();
    if (dom.waveRibbon) {
      dom.waveRibbon.classList.toggle("is-scholar", !!scholar);
    }
    if (dom.roundControls) dom.roundControls.classList.add("show");
    updateHud();
    updateRibbon();
  }

  function layoutRound() {
    var r = state.currentRound;
    if (!r) return;
    var n = r.tiles.length;
    var totalRackW = n * TILE_W + (n - 1) * TILE_GAP;
    var rackStartX = (LOGICAL_W - totalRackW) / 2;
    var slotsStartX = rackStartX;
    for (var i = 0; i < n; i++) {
      var tile = r.tiles[i];
      tile.rackX = rackStartX + i * (TILE_W + TILE_GAP);
      tile.rackY = RACK_TOP;
      // current x,y depending on slotIndex
      if (tile.slotIndex < 0) {
        tile.x = tile.rackX;
        tile.y = tile.rackY;
      } else {
        tile.x = slotsStartX + tile.slotIndex * (TILE_W + TILE_GAP);
        tile.y = SLOTS_TOP;
      }
    }
  }

  // -- Tile movement ---------------------------------------------------------
  function rackTiles() {
    var r = state.currentRound;
    var out = [];
    for (var i = 0; i < r.tiles.length; i++) if (r.tiles[i].slotIndex < 0) out.push(r.tiles[i]);
    return out;
  }
  function nextEmptySlot() {
    var r = state.currentRound;
    for (var i = 0; i < r.slotsFilled.length; i++) {
      if (r.slotsFilled[i] == null) return i;
    }
    return -1;
  }
  function placeTile(tile) {
    var r = state.currentRound;
    if (!r || r.result) return;
    if (tile.slotIndex >= 0) return;
    // skip slots that are revealed (locked)
    var slot = -1;
    for (var i = 0; i < r.slotsFilled.length; i++) {
      if (r.slotsFilled[i] == null && !r.slotsRevealed[i]) { slot = i; break; }
    }
    if (slot < 0) return;
    var n = r.tiles.length;
    var totalRackW = n * TILE_W + (n - 1) * TILE_GAP;
    var slotsStartX = (LOGICAL_W - totalRackW) / 2;
    tile.fromX = tile.x; tile.fromY = tile.y;
    tile.toX = slotsStartX + slot * (TILE_W + TILE_GAP);
    tile.toY = SLOTS_TOP;
    tile.animT = 0.0001;
    tile.slotIndex = slot;
    r.slotsFilled[slot] = tile.id;
    sfx.tilePlace();
    tryAutoSubmit();
  }
  function returnTileFromSlot(slotIndex) {
    var r = state.currentRound;
    if (!r || r.result) return;
    if (r.slotsRevealed[slotIndex]) return; // can't return a hint-locked letter
    var tileId = r.slotsFilled[slotIndex];
    if (tileId == null) return;
    var tile = findTile(tileId);
    if (!tile) return;
    // Clear and re-pack: shift later tiles? Simpler: just remove this slot.
    r.slotsFilled[slotIndex] = null;
    tile.fromX = tile.x; tile.fromY = tile.y;
    tile.slotIndex = -1;
    tile.toX = tile.rackX; tile.toY = tile.rackY;
    tile.animT = 0.0001;
    sfx.tileBack();
  }
  function returnLastFromSlot() {
    var r = state.currentRound;
    if (!r || r.result) return;
    for (var i = r.slotsFilled.length - 1; i >= 0; i--) {
      if (r.slotsFilled[i] != null && !r.slotsRevealed[i]) {
        returnTileFromSlot(i);
        return true;
      }
    }
    return false;
  }
  function findTile(id) {
    var r = state.currentRound;
    for (var i = 0; i < r.tiles.length; i++) if (r.tiles[i].id === id) return r.tiles[i];
    return null;
  }
  function placeLetterFromKeyboard(letter) {
    var r = state.currentRound;
    if (!r || r.result) return false;
    var L = letter.toUpperCase();
    // Find a rack tile with that letter
    for (var i = 0; i < r.tiles.length; i++) {
      var t = r.tiles[i];
      if (t.slotIndex < 0 && t.letter === L) {
        placeTile(t);
        return true;
      }
    }
    return false;
  }

  // -- Submit logic ----------------------------------------------------------
  function tryAutoSubmit() {
    var r = state.currentRound;
    if (!r || r.result) return;
    // All slots filled?
    for (var i = 0; i < r.slotsFilled.length; i++) if (r.slotsFilled[i] == null) return;
    submitAnswer();
  }
  function readSubmittedWord() {
    var r = state.currentRound;
    var out = "";
    for (var i = 0; i < r.slotsFilled.length; i++) {
      var id = r.slotsFilled[i];
      if (id == null) return null;
      var t = findTile(id);
      out += t ? t.letter : "?";
    }
    return out;
  }
  function submitAnswer() {
    var r = state.currentRound;
    if (!r || r.result) return;
    var attempt = readSubmittedWord();
    if (attempt == null) return;
    var correct = attempt === r.term.word;
    r.submittedAt = state.time;
    r.result = correct ? "correct" : "wrong";
    r.feedbackT = FEEDBACK_MS / 1000;
    if (correct) onCorrect();
    else onWrong();
  }
  function onCorrect() {
    var r = state.currentRound;
    var pct = Math.max(0, Math.min(1, r.timeRemaining / r.timerInitial));
    var perfect = (r.hintsUsed === 0 && pct >= 0.6);
    r.perfect = perfect;
    if (r.term && r.term.word && r.term.word.length >= 12) {
      try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("anagram-atlas", "anagram-perfect"); } catch (e) {}
    }
    if (r.hintsUsed === 0) {
      state.consecutiveCorrectNoHint = (state.consecutiveCorrectNoHint || 0) + 1;
      if (state.consecutiveCorrectNoHint >= 10) {
        try { window.MrMacsProfile && window.MrMacsProfile.unlockGameAchievement && window.MrMacsProfile.unlockGameAchievement("anagram-atlas", "anagram-no-hint"); } catch (e) {}
      }
    } else {
      state.consecutiveCorrectNoHint = 0;
    }
    // Multiplier boost: only on correct
    var earnedScore = computeScore(r, perfect);
    state.score += earnedScore - r.hintScoreCost; // hint cost already accounted? No — handle here
    // (hintScoreCost was computed at hint time but we don't subtract until correct/skipped resolve)
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.correctTotal += 1;
    bumpMultiplier();
    if (state.streak > 0 && state.streak % STREAK_FOR_LIFE === 0) {
      state.lives += 1;
      pushPopup("EXTRA LIFE", LOGICAL_W / 2, 280, "is-bonus");
      sfx.levelUp();
      try { if (window.MrMacsCelebration && !reducedMotion) window.MrMacsCelebration.burst({ count: 18, palette: ["#f5c451", "#5de0f0"] }); } catch (e) {}
    }
    // Powerup drop chance (perfect rounds)
    if (perfect && state.powerups.length < POWERUP_INV_MAX && Math.random() < POWERUP_PERFECT_DROP_RATE) {
      grantRandomPowerup();
    }
    sfx.submitCorrect();
    burstAt(LOGICAL_W / 2, SLOTS_TOP + TILE_H / 2, "#f5c451", 26);
    pushPopup("+" + Math.max(0, earnedScore - r.hintScoreCost), LOGICAL_W / 2, SLOTS_TOP - 20, "is-score");
    if (state.streak >= 3) pushPopup("STREAK x" + state.streak, LOGICAL_W / 2, SLOTS_TOP - 56, "is-bonus");
    recordAnswerHook(true);
    saveSnapshot();
    if (r.scholar) {
      // Trigger scholar question after feedback delay
      r.feedbackT = 0.6;
    }
  }
  function onWrong() {
    state.streak = 0;
    state.consecutiveCorrectNoHint = 0;
    state.lives -= 1;
    state.wrongTotal += 1;
    breakMultiplier();
    sfx.submitWrong();
    state.shake = { x: 0, y: 0, intensity: 8, life: 0.45, totalLife: 0.45 };
    state.currentRound.shake = 0.45;
    pushPopup("WRONG", LOGICAL_W / 2, SLOTS_TOP - 20, "is-warn");
    var correctWord = state.currentRound.term.word;
    pushPopup(correctWord, LOGICAL_W / 2, SLOTS_TOP + 90, "is-cyan");
    recordAnswerHook(false);
    sfx.lifeLost();
    saveSnapshot();
  }
  function computeScore(r, perfect) {
    var pct = Math.max(0, Math.min(1, r.timeRemaining / r.timerInitial));
    var base = r.term.word.length * 100 * pct;
    var bonus = perfect ? 200 : 0;
    var mult = state.multiplier;
    var x2 = state.x2RoundsLeft > 0 ? 2 : 1;
    if (state.x2RoundsLeft > 0) state.x2RoundsLeft -= 1;
    return Math.round((base + bonus) * mult * x2);
  }
  function bumpMultiplier() {
    state.multiplier = Math.min(MAX_MULT, +(state.multiplier + MULT_STEP).toFixed(2));
  }
  function breakMultiplier() {
    if (state.multiplier > 1) sfx.multBreak();
    state.multiplier = 1;
  }

  // -- Skip / hint / shuffle -------------------------------------------------
  function useHint() {
    var r = state.currentRound;
    if (!r || r.result) return;
    if (r.hintsUsed >= HINTS_PER_ROUND) return;
    // Pick the next unrevealed slot (in left-to-right order)
    var slotIdx = -1;
    for (var i = 0; i < r.slotsRevealed.length; i++) {
      if (!r.slotsRevealed[i]) { slotIdx = i; break; }
    }
    if (slotIdx < 0) return;
    var letter = r.term.word.charAt(slotIdx);
    // If a tile is currently in this slot, return it first
    if (r.slotsFilled[slotIdx] != null) {
      // Auto-return whatever is here, find the proper letter tile, swap in
      var prevId = r.slotsFilled[slotIdx];
      var prevTile = findTile(prevId);
      if (prevTile && prevTile.letter !== letter) returnTileFromSlot(slotIdx);
      else { // already correct letter — just lock it
        r.slotsRevealed[slotIdx] = true;
        r.hintsUsed += 1;
        r.hintScoreCost += HINT_COST;
        state.score = Math.max(0, state.score - HINT_COST);
        sfx.hint();
        updateHud();
        updateRibbon();
        return;
      }
    }
    // Find a rack tile with that letter
    for (var k = 0; k < r.tiles.length; k++) {
      var t = r.tiles[k];
      if (t.slotIndex < 0 && t.letter === letter) {
        // Place it specifically into slotIdx (overriding the next-empty rule)
        var n = r.tiles.length;
        var totalRackW = n * TILE_W + (n - 1) * TILE_GAP;
        var slotsStartX = (LOGICAL_W - totalRackW) / 2;
        t.fromX = t.x; t.fromY = t.y;
        t.toX = slotsStartX + slotIdx * (TILE_W + TILE_GAP);
        t.toY = SLOTS_TOP;
        t.animT = 0.0001;
        t.slotIndex = slotIdx;
        r.slotsFilled[slotIdx] = t.id;
        r.slotsRevealed[slotIdx] = true;
        r.hintsUsed += 1;
        r.hintScoreCost += HINT_COST;
        state.score = Math.max(0, state.score - HINT_COST);
        sfx.hint();
        updateHud();
        updateRibbon();
        // Try auto-submit if all filled
        var allFilled = true;
        for (var j = 0; j < r.slotsFilled.length; j++) if (r.slotsFilled[j] == null) { allFilled = false; break; }
        if (allFilled) tryAutoSubmit();
        return;
      }
    }
  }
  function useShuffle(noCost) {
    var r = state.currentRound;
    if (!r || r.result) return;
    // Move all rack tiles to new positions
    var rack = [];
    for (var i = 0; i < r.tiles.length; i++) if (r.tiles[i].slotIndex < 0) rack.push(r.tiles[i]);
    // Shuffle the rack array
    for (var i2 = rack.length - 1; i2 > 0; i2--) {
      var j2 = Math.floor(Math.random() * (i2 + 1));
      var tmp2 = rack[i2]; rack[i2] = rack[j2]; rack[j2] = tmp2;
    }
    // Compute new rack positions for ALL tiles (rack-only positions remain consecutive)
    // The rack lays out at left-most rack slots based on rack-tile order
    var n = r.tiles.length;
    var totalRackW = n * TILE_W + (n - 1) * TILE_GAP;
    var rackStartX = (LOGICAL_W - totalRackW) / 2;
    // Easy approach: place rack tiles into the FIRST K rack-slot positions (where K = # rack tiles)
    for (var k = 0; k < rack.length; k++) {
      var t = rack[k];
      t.fromX = t.x; t.fromY = t.y;
      t.toX = rackStartX + k * (TILE_W + TILE_GAP);
      t.toY = RACK_TOP;
      t.animT = 0.0001;
      t.rackX = t.toX;
      t.rackY = t.toY;
    }
    r.shuffles += 1;
    sfx.tilePick();
    if (!noCost) {
      // Free shuffle (no cost) — the button is always free for usability
    }
  }
  function useSkip() {
    var r = state.currentRound;
    if (!r || r.result) return;
    r.result = "skipped";
    r.feedbackT = FEEDBACK_MS / 1000;
    state.streak = 0;
    state.lives -= 1;
    state.skipTotal += 1;
    breakMultiplier();
    sfx.submitWrong();
    pushPopup("SKIP", LOGICAL_W / 2, SLOTS_TOP - 20, "is-warn");
    pushPopup(r.term.word, LOGICAL_W / 2, SLOTS_TOP + 90, "is-cyan");
    recordAnswerHook(false);
    sfx.lifeLost();
    saveSnapshot();
  }
  function timeoutRound() {
    var r = state.currentRound;
    if (!r || r.result) return;
    r.result = "timeout";
    r.feedbackT = FEEDBACK_MS / 1000;
    state.streak = 0;
    state.lives -= 1;
    state.timeoutTotal += 1;
    breakMultiplier();
    sfx.submitWrong();
    pushPopup("TIME UP", LOGICAL_W / 2, SLOTS_TOP - 20, "is-warn");
    pushPopup(r.term.word, LOGICAL_W / 2, SLOTS_TOP + 90, "is-cyan");
    recordAnswerHook(false);
    sfx.lifeLost();
    state.shake = { x: 0, y: 0, intensity: 6, life: 0.4, totalLife: 0.4 };
    saveSnapshot();
  }

  // -- Powerups --------------------------------------------------------------
  function grantRandomPowerup() {
    if (state.powerups.length >= POWERUP_INV_MAX) return;
    var type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    state.powerups.push({ type: type });
    sfx.powerupPickup();
    pushPopup(POWERUP_META[type].label + " GAINED", LOGICAL_W / 2, 320, "is-bonus");
    renderPowerupTray();
  }
  function usePowerup(idxOrType) {
    if (phase !== "playing") return;
    var r = state.currentRound;
    if (!r || r.result) return;
    var idx = -1;
    if (typeof idxOrType === "number") idx = idxOrType;
    else {
      for (var i = 0; i < state.powerups.length; i++) if (state.powerups[i].type === idxOrType) { idx = i; break; }
    }
    if (idx < 0 || idx >= state.powerups.length) return;
    var p = state.powerups[idx];
    state.powerups.splice(idx, 1);
    sfx.powerupUse();
    if (p.type === "hint") {
      // free hint
      var beforeScore = state.score;
      var beforeCost = r.hintScoreCost;
      useHint();
      // Refund the deducted points (free version)
      var deducted = (beforeCost === r.hintScoreCost) ? 0 : (r.hintScoreCost - beforeCost);
      if (deducted > 0) {
        state.score = beforeScore;
        r.hintScoreCost = beforeCost;
      }
    } else if (p.type === "time") {
      r.timeRemaining = Math.min(r.timerInitial + 30, r.timeRemaining + 10);
      pushPopup("+10s", LOGICAL_W / 2, 320, "is-cyan");
    } else if (p.type === "autosolve") {
      r.autoSolved = true;
      // Place all unrevealed letters into their correct slots and lock them.
      for (var s = 0; s < r.slotsRevealed.length; s++) {
        if (r.slotsRevealed[s]) continue;
        var letter = r.term.word.charAt(s);
        // If something is in this slot but wrong, return first
        if (r.slotsFilled[s] != null) {
          var existing = findTile(r.slotsFilled[s]);
          if (existing && existing.letter === letter) {
            r.slotsRevealed[s] = true;
            continue;
          } else {
            returnTileFromSlot(s);
          }
        }
        // Find rack tile with letter
        for (var rt = 0; rt < r.tiles.length; rt++) {
          var t = r.tiles[rt];
          if (t.slotIndex < 0 && t.letter === letter) {
            var n = r.tiles.length;
            var totalRackW = n * TILE_W + (n - 1) * TILE_GAP;
            var slotsStartX = (LOGICAL_W - totalRackW) / 2;
            t.fromX = t.x; t.fromY = t.y;
            t.toX = slotsStartX + s * (TILE_W + TILE_GAP);
            t.toY = SLOTS_TOP;
            t.animT = 0.0001;
            t.slotIndex = s;
            r.slotsFilled[s] = t.id;
            r.slotsRevealed[s] = true;
            break;
          }
        }
      }
      // Mark as auto-solved → end round with no scoring & no life lost & no streak boost
      r.result = "autosolve";
      r.feedbackT = FEEDBACK_MS / 1000;
      pushPopup("AUTO-SOLVED", LOGICAL_W / 2, SLOTS_TOP - 20, "is-bonus");
      // Don't break mult, don't change streak
    } else if (p.type === "multx2") {
      state.x2RoundsLeft = 5;
      pushPopup("x2 NEXT 5", LOGICAL_W / 2, 320, "is-tetris");
    } else if (p.type === "shuffle") {
      useShuffle(true);
      pushPopup("RE-SHUFFLED", LOGICAL_W / 2, 320, "is-cyan");
    }
    renderPowerupTray();
    updateHud();
    updateRibbon();
  }

  function renderPowerupTray() {
    if (!dom.powerupTray) return;
    var html = "";
    for (var i = 0; i < state.powerups.length; i++) {
      var p = state.powerups[i];
      var meta = POWERUP_META[p.type];
      html +=
        '<button type="button" class="powerup-slot" data-pidx="' + i + '" aria-label="Use ' + meta.label + '">' +
          '<span class="powerup-glyph" aria-hidden="true">' + meta.glyph + '</span>' +
          '<span class="powerup-meta">' +
            '<span class="powerup-name">' + meta.label + '</span>' +
            '<span class="powerup-key">' + meta.key + '</span>' +
          '</span>' +
        '</button>';
    }
    if (state.x2RoundsLeft > 0) {
      html +=
        '<div class="powerup-slot is-active" aria-label="2x multiplier active">' +
          '<span class="powerup-glyph" aria-hidden="true">✨</span>' +
          '<span class="powerup-meta">' +
            '<span class="powerup-name">x2 ACTIVE</span>' +
            '<span class="powerup-key">' + state.x2RoundsLeft + ' rounds</span>' +
          '</span>' +
        '</div>';
    }
    dom.powerupTray.innerHTML = html;
    // Bind clicks
    var slots = dom.powerupTray.querySelectorAll("[data-pidx]");
    for (var s = 0; s < slots.length; s++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var idx = parseInt(btn.getAttribute("data-pidx"), 10);
          usePowerup(idx);
        });
      })(slots[s]);
    }
  }

  // -- Scholar question UI ---------------------------------------------------
  function findScholarEntry(termWord) {
    for (var i = 0; i < SCHOLAR_BANK.length; i++) {
      if (SCHOLAR_BANK[i].termWord === termWord) return SCHOLAR_BANK[i];
    }
    return null;
  }
  function openScholarQuestion() {
    var r = state.currentRound;
    if (!r || !r.scholar) return;
    var entry = findScholarEntry(r.term.word);
    if (!entry) {
      finishScholar(false);
      return;
    }
    state.scholarEntry = entry;
    prevPhase = phase;
    phase = "question";
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Term · " + r.term.word;
    if (dom.questionPrompt) dom.questionPrompt.textContent = entry.prompt;
    if (dom.explanation) {
      dom.explanation.textContent = "";
      dom.explanation.classList.remove("is-correct", "is-wrong");
    }
    var html = "";
    var letters = ["A", "B", "C", "D"];
    // Randomize choice order, track new index of correct
    var order = [0, 1, 2, 3];
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
    var newCorrect = order.indexOf(entry.correctIndex);
    state.scholarChoiceOrder = order;
    state.scholarNewCorrect = newCorrect;
    for (var c = 0; c < order.length; c++) {
      var orig = order[c];
      html +=
        '<button type="button" class="choice-btn" data-cidx="' + c + '" data-orig="' + orig + '">' +
          '<span class="choice-letter">' + letters[c] + '</span>' +
          escapeHtml(entry.choices[orig]) +
        '</button>';
    }
    if (dom.choiceGrid) {
      dom.choiceGrid.innerHTML = html;
      var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
      for (var b = 0; b < btns.length; b++) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var cidx = parseInt(btn.getAttribute("data-cidx"), 10);
            answerScholar(cidx, btn);
          });
        })(btns[b]);
      }
    }
    if (dom.questionScreen) dom.questionScreen.classList.add("show");
    duckMusic();
  }
  function answerScholar(cidx, btn) {
    var entry = state.scholarEntry;
    if (!entry) return;
    var correct = (cidx === state.scholarNewCorrect);
    if (btn) btn.classList.add(correct ? "is-correct" : "is-wrong");
    // Mark correct one too
    if (!correct) {
      var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
      for (var i = 0; i < btns.length; i++) {
        var ci = parseInt(btns[i].getAttribute("data-cidx"), 10);
        if (ci === state.scholarNewCorrect) btns[i].classList.add("is-correct");
      }
    }
    if (dom.explanation) {
      dom.explanation.textContent = entry.explanation;
      dom.explanation.classList.add(correct ? "is-correct" : "is-wrong");
    }
    if (correct) {
      state.score += SCHOLAR_REWARD_SCORE;
      addShards(SCHOLAR_REWARD_SHARDS);
      state.scholarCorrect += 1;
      sfx.scholarCorrect();
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 32, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      pushPopup("+" + SCHOLAR_REWARD_SCORE, LOGICAL_W / 2, 260, "is-tetris");
    } else {
      sfx.scholarWrong();
    }
    // Record scholar answer
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordAnswer) {
        window.MrMacsProfile.recordAnswer({
          course: "All Courses",
          set: "anagram-atlas-scholar",
          gameId: GAME_ID,
          correct: correct,
          prompt: entry.prompt,
          answer: entry.choices[entry.correctIndex]
        });
      }
    } catch (e) {}
    setTimeout(function () { finishScholar(correct); }, 1400);
  }
  function skipScholar() {
    if (phase !== "question") return;
    finishScholar(false);
  }
  function finishScholar(correct) {
    if (dom.questionScreen) dom.questionScreen.classList.remove("show");
    state.scholarEntry = null;
    restoreMusic();
    phase = prevPhase || "playing";
    prevPhase = null;
    // Move to next round shortly
    state.scholarResolveT = 0.5;
    updateHud();
    updateRibbon();
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // -- recordAnswer hook (every term) ----------------------------------------
  function recordAnswerHook(correct) {
    var r = state.currentRound;
    if (!r) return;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordAnswer) {
        window.MrMacsProfile.recordAnswer({
          course: "All Courses",
          set: "anagram-atlas",
          gameId: GAME_ID,
          correct: !!correct,
          prompt: r.term.hint,
          answer: r.term.word
        });
      }
    } catch (e) {}
  }

  // -- Particles / popups ----------------------------------------------------
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    if (!state) return;
    count = count || 8;
    color = color || "#f5c451";
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 80 + Math.random() * 180;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 60,
        life: 0.6 + Math.random() * 0.6,
        totalLife: 0.6 + Math.random() * 0.6,
        size: 2 + Math.random() * 3,
        color: color,
        gravity: 220
      });
    }
  }
  function pushPopup(text, x, y, cls) {
    if (!dom.popupOverlay) return;
    var div = document.createElement("div");
    div.className = "popup-text " + (cls || "");
    div.textContent = text;
    div.style.left = ((x / LOGICAL_W) * 100) + "%";
    div.style.top = ((y / LOGICAL_H) * 100) + "%";
    dom.popupOverlay.appendChild(div);
    setTimeout(function () { try { div.remove(); } catch (e) {} }, 1200);
  }

  // -- HUD / ribbon ----------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = String(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudStreak) dom.hudStreak.textContent = String(state.streak);
    if (dom.hudBest) dom.hudBest.textContent = String(state.best);
    if (dom.hudMult) {
      var totalMult = state.multiplier * (state.x2RoundsLeft > 0 ? 2 : 1);
      dom.hudMult.textContent = (totalMult % 1 === 0 ? totalMult : totalMult.toFixed(1)) + "x";
      dom.hudMult.parentElement.classList.toggle("is-mult", totalMult > 1 && totalMult <= 2);
      dom.hudMult.parentElement.classList.toggle("is-mult-big", totalMult > 2);
    }
    if (dom.hudTimer && state.currentRound) {
      var t = Math.max(0, state.currentRound.timeRemaining);
      dom.hudTimer.textContent = t.toFixed(t < 10 ? 1 : 0);
      var cell = dom.hudTimerCell;
      if (cell) {
        cell.classList.toggle("is-warning", t > 5 && t <= 10);
        cell.classList.toggle("is-danger", t <= 5);
      }
    }
  }
  function updateRibbon() {
    if (!state || !state.currentRound) return;
    var r = state.currentRound;
    if (dom.goalName) {
      dom.goalName.textContent = r.scholar
        ? "Scholar term · “" + r.term.hint + "”"
        : r.term.hint;
    }
    if (dom.goalMeta) {
      var pHints = (HINTS_PER_ROUND - r.hintsUsed);
      dom.goalMeta.textContent =
        "Round " + state.round +
        " · Hints " + pHints + "/" + HINTS_PER_ROUND +
        " · Powerups " + state.powerups.length +
        (r.scholar ? " · ✨ Scholar" : "");
    }
    if (dom.hintBtn) {
      dom.hintBtn.disabled = (r.hintsUsed >= HINTS_PER_ROUND) || !!r.result;
    }
    if (dom.shuffleBtn) dom.shuffleBtn.disabled = !!r.result;
    if (dom.skipBtn) dom.skipBtn.disabled = !!r.result;
  }

  // -- Drawing ---------------------------------------------------------------
  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    var sx = rect.width / LOGICAL_W;
    var sy = rect.height / LOGICAL_H;
    scale = Math.min(sx, sy);
    offsetX = (rect.width - LOGICAL_W * scale) / 2;
    offsetY = (rect.height - LOGICAL_H * scale) / 2;
  }
  function drawBackground() {
    var w = canvas.width, h = canvas.height;
    var grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, "#0e1a30");
    grad.addColorStop(0.6, "#08101e");
    grad.addColorStop(1, "#04060f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Atlas-paper texture: faint horizontal cross-hatching
    if (state && state.bgStars) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      for (var i = 0; i < state.bgStars.length; i++) {
        var s = state.bgStars[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        var tw = 0.55 + 0.45 * Math.sin(state.time * s.twinkleSpeed + s.twinkle);
        ctx.fillStyle = "rgba(245,196,81," + (0.18 * tw).toFixed(3) + ")";
        ctx.fill();
      }
      ctx.restore();
    }
  }
  function drawTitleScroll() {
    if (!state || !state.currentRound) return;
    var r = state.currentRound;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    // Title scroll banner top center: parchment ribbon containing "ARCHIVE · round N"
    var bannerY = 130;
    var bw = 360, bh = 56;
    var bx = (LOGICAL_W - bw) / 2;
    drawScrollBanner(bx, bannerY, bw, bh, r.scholar);
    ctx.fillStyle = "#2a1c0a";
    ctx.font = "italic 700 18px Fraunces, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var label = r.scholar ? "SCHOLAR · ARCHIVE" : "ARCHIVE FRAGMENT";
    ctx.fillText(label, LOGICAL_W / 2, bannerY + bh / 2 - 10);
    ctx.fillStyle = "#5a3e1a";
    ctx.font = "600 11px JetBrains Mono, monospace";
    ctx.fillText("ROUND " + state.round + " · " + r.term.category.toUpperCase(), LOGICAL_W / 2, bannerY + bh / 2 + 10);
    ctx.restore();
  }
  function drawScrollBanner(x, y, w, h, gold) {
    // Two ribbon ends + body
    var bodyX = x + 24, bodyY = y, bodyW = w - 48, bodyH = h;
    // Body parchment
    var grad = ctx.createLinearGradient(bodyX, bodyY, bodyX, bodyY + bodyH);
    grad.addColorStop(0, "#ecd9b1");
    grad.addColorStop(0.5, "#d2b986");
    grad.addColorStop(1, "#b89762");
    ctx.fillStyle = grad;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
    // Ribbon ends (triangle notches)
    ctx.fillStyle = gold ? "#c8922a" : "#a96e3d";
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(bodyX, y); ctx.lineTo(bodyX, y + bodyH); ctx.lineTo(x, y + bodyH);
    ctx.lineTo(x + 12, y + bodyH / 2); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w, y); ctx.lineTo(x + w - 24, y); ctx.lineTo(x + w - 24, y + bodyH); ctx.lineTo(x + w, y + bodyH);
    ctx.lineTo(x + w - 12, y + bodyH / 2); ctx.closePath();
    ctx.fill();
    // Border
    ctx.strokeStyle = gold ? "#f5c451" : "#7a4f23";
    ctx.lineWidth = gold ? 2 : 1.4;
    ctx.strokeRect(bodyX, bodyY, bodyW, bodyH);
    if (gold) {
      // Gold glow
      ctx.shadowColor = "rgba(245,196,81,0.55)";
      ctx.shadowBlur = 14;
      ctx.strokeRect(bodyX, bodyY, bodyW, bodyH);
      ctx.shadowBlur = 0;
    }
  }
  function drawTile(tile, opts) {
    opts = opts || {};
    var x = tile.x, y = tile.y;
    var w = TILE_W, h = TILE_H;
    var revealed = opts.revealed;
    var gold = opts.gold;
    var locked = opts.locked;
    var wrong = opts.wrong;
    var dim = opts.dim;
    // Shake offset for wrong feedback
    if (opts.shakeX) x += opts.shakeX;
    // Drop shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 3, y + 4, w, h);
    // Parchment fragment: gradient + dark ink wash
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    if (revealed) {
      // Hint-locked tile: emerald tint
      grad.addColorStop(0, "#a8edcb");
      grad.addColorStop(0.5, "#5fcb96");
      grad.addColorStop(1, "#2c8b62");
    } else if (gold) {
      grad.addColorStop(0, "#fbe09a");
      grad.addColorStop(0.5, "#e6b738");
      grad.addColorStop(1, "#a8821c");
    } else {
      grad.addColorStop(0, "#ecd9b1");
      grad.addColorStop(0.5, "#d2b986");
      grad.addColorStop(1, "#a8895c");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    // Inner darker frame for depth
    ctx.strokeStyle = wrong ? "rgba(208, 72, 96, 0.85)" : (gold ? "rgba(168, 130, 28, 0.65)" : "rgba(120, 84, 36, 0.55)");
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    // Speckles / ink wash
    if (!dim) {
      ctx.save();
      ctx.fillStyle = "rgba(60, 38, 12, 0.18)";
      var seed = (tile.id * 7919) % 9973;
      for (var s = 0; s < 8; s++) {
        seed = (seed * 1103515245 + 12345) % 2147483647;
        var sx = x + 3 + (seed % (w - 6));
        seed = (seed * 1103515245 + 12345) % 2147483647;
        var sy = y + 3 + (seed % (h - 6));
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    // Top highlight
    var hi = ctx.createLinearGradient(x, y, x, y + 8);
    hi.addColorStop(0, "rgba(255,255,255,0.45)");
    hi.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hi;
    ctx.fillRect(x + 1, y + 1, w - 2, 8);
    // Outer border
    ctx.strokeStyle = gold ? "#f5c451" : "#7a4f23";
    ctx.lineWidth = gold ? 2 : 1.5;
    ctx.strokeRect(x, y, w, h);
    if (gold) {
      ctx.save();
      ctx.shadowColor = "rgba(245,196,81,0.7)";
      ctx.shadowBlur = 14;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
    if (revealed) {
      ctx.save();
      ctx.shadowColor = "rgba(77,212,155,0.6)";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#4dd49b";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
    // Letter — font scales with tile width
    ctx.fillStyle = wrong ? "#7a1b29" : "#2a1c0a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var fontSize = Math.round(w * 0.62);
    ctx.font = "900 " + fontSize + "px Fraunces, serif";
    ctx.fillText(tile.letter, x + w / 2, y + h / 2 + 2);
    // Lock icon if revealed
    if (revealed) {
      ctx.fillStyle = "rgba(15, 70, 50, 0.85)";
      ctx.font = "800 12px JetBrains Mono, monospace";
      ctx.fillText("◈", x + w - 9, y + 11);
    }
  }
  function drawSlot(idx, x, y, filled, revealed, term) {
    var w = TILE_W, h = TILE_H;
    // Slot outline
    ctx.save();
    ctx.fillStyle = "rgba(8, 14, 28, 0.45)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = revealed ? "rgba(77,212,155,0.85)" : (filled ? "rgba(245,196,81,0.55)" : "rgba(245,196,81,0.30)");
    ctx.lineWidth = 1.6;
    ctx.setLineDash(filled ? [] : [4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    // Slot index dot below
    ctx.fillStyle = "rgba(245,196,81,0.45)";
    ctx.font = "700 10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(idx + 1), x + w / 2, y + h + 14);
    ctx.restore();
  }
  function drawSlotsAndTiles() {
    if (!state || !state.currentRound) return;
    var r = state.currentRound;
    var n = r.tiles.length;
    var totalRackW = n * TILE_W + (n - 1) * TILE_GAP;
    var slotsStartX = (LOGICAL_W - totalRackW) / 2;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    // Apply screen shake
    if (state.shake.life > 0) {
      var sk = state.shake.intensity * (state.shake.life / state.shake.totalLife);
      ctx.translate((Math.random() - 0.5) * sk, (Math.random() - 0.5) * sk);
    }
    // Title banner
    ctx.restore();
    drawTitleScroll();
    // Now draw rack labels
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(245,196,81,0.65)";
    ctx.font = "800 11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("— SCRAMBLED FRAGMENTS —", LOGICAL_W / 2, RACK_TOP - 16);
    ctx.fillStyle = "rgba(245,196,81,0.55)";
    ctx.fillText("— ANSWER —", LOGICAL_W / 2, SLOTS_TOP - 16);
    // Slots
    for (var i = 0; i < r.slotsFilled.length; i++) {
      drawSlot(i, slotsStartX + i * (TILE_W + TILE_GAP), SLOTS_TOP, r.slotsFilled[i] != null, r.slotsRevealed[i], r.term);
    }
    // Tiles (rack and placed) — draw placed tiles on top
    var shakeX = 0;
    if (r.result === "wrong" && r.feedbackT > 0) {
      var t01 = 1 - (r.feedbackT / (FEEDBACK_MS / 1000));
      shakeX = Math.sin(t01 * 30) * 6 * (1 - t01);
    }
    // Rack tiles first (so placed appear on top during animation)
    for (var k = 0; k < r.tiles.length; k++) {
      var tile = r.tiles[k];
      if (tile.slotIndex < 0) {
        drawTile(tile, {
          gold: r.scholar,
          dim: !!r.result,
          wrong: r.result === "wrong"
        });
      }
    }
    // Placed tiles
    for (var m = 0; m < r.tiles.length; m++) {
      var t2 = r.tiles[m];
      if (t2.slotIndex >= 0) {
        var revealed = r.slotsRevealed[t2.slotIndex];
        drawTile(t2, {
          revealed: revealed,
          gold: r.scholar && !revealed,
          wrong: r.result === "wrong",
          shakeX: shakeX
        });
      }
    }
    // Feedback overlay (correct flash)
    if (r.result === "correct" && r.feedbackT > 0) {
      var pct = r.feedbackT / (FEEDBACK_MS / 1000);
      ctx.fillStyle = "rgba(77,212,155," + (0.18 * pct).toFixed(3) + ")";
      ctx.fillRect(0, SLOTS_TOP - 18, LOGICAL_W, TILE_H + 36);
    } else if (r.result === "wrong" && r.feedbackT > 0) {
      var pct2 = r.feedbackT / (FEEDBACK_MS / 1000);
      ctx.fillStyle = "rgba(240,72,96," + (0.18 * pct2).toFixed(3) + ")";
      ctx.fillRect(0, SLOTS_TOP - 18, LOGICAL_W, TILE_H + 36);
    } else if (r.result === "skipped" || r.result === "timeout") {
      var pct3 = r.feedbackT / (FEEDBACK_MS / 1000);
      ctx.fillStyle = "rgba(160,140,80," + (0.10 * pct3).toFixed(3) + ")";
      ctx.fillRect(0, SLOTS_TOP - 18, LOGICAL_W, TILE_H + 36);
    } else if (r.result === "autosolve") {
      var pct4 = r.feedbackT / (FEEDBACK_MS / 1000);
      ctx.fillStyle = "rgba(169,145,255," + (0.18 * pct4).toFixed(3) + ")";
      ctx.fillRect(0, SLOTS_TOP - 18, LOGICAL_W, TILE_H + 36);
    }
    // Term hint subtitle
    ctx.fillStyle = "rgba(208, 217, 244, 0.85)";
    ctx.font = "italic 16px Fraunces, serif";
    ctx.textAlign = "center";
    var hintLines = wrapText(ctx, "“" + r.term.hint + "”", LOGICAL_W - 80);
    for (var hl = 0; hl < hintLines.length; hl++) {
      ctx.fillText(hintLines[hl], LOGICAL_W / 2, SLOTS_TOP + TILE_H + 44 + hl * 22);
    }
    ctx.restore();
  }
  function wrapText(c, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var line = "";
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (c.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function drawParticles() {
    if (!state || !state.particles.length) return;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var a = Math.max(0, p.life / p.totalLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  function drawTimerArc() {
    if (!state || !state.currentRound) return;
    var r = state.currentRound;
    var pct = Math.max(0, Math.min(1, r.timeRemaining / r.timerInitial));
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    // Big horizontal timer bar across top
    var barX = 60, barY = 110, barW = LOGICAL_W - 120, barH = 6;
    ctx.fillStyle = "rgba(8,14,28,0.55)";
    ctx.fillRect(barX, barY, barW, barH);
    var col = pct > 0.4 ? "#f5c451" : (pct > 0.2 ? "#f0a800" : "#f04860");
    ctx.fillStyle = col;
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.strokeStyle = "rgba(245,196,81,0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.restore();
  }

  // -- Animation tick --------------------------------------------------------
  function update(dt) {
    if (!state) return;
    state.time += dt;
    // Tile anims
    if (state.currentRound) {
      var r = state.currentRound;
      for (var i = 0; i < r.tiles.length; i++) {
        var t = r.tiles[i];
        if (t.animT > 0) {
          t.animT = Math.min(1, t.animT + dt / 0.22);
          var ease = easeOutCubic(t.animT);
          t.x = t.fromX + (t.toX - t.fromX) * ease;
          t.y = t.fromY + (t.toY - t.fromY) * ease;
          if (t.animT >= 1) { t.x = t.toX; t.y = t.toY; t.animT = 0; }
        }
      }
      // Timer
      if (!r.result && phase === "playing") {
        r.timeRemaining -= dt;
        if (r.timeRemaining <= 0) {
          r.timeRemaining = 0;
          timeoutRound();
        }
      }
      // Feedback timer + advance
      if (r.result && r.feedbackT > 0) {
        r.feedbackT -= dt;
        if (r.feedbackT <= 0) {
          r.feedbackT = 0;
          if (r.result === "correct" && r.scholar && phase === "playing") {
            openScholarQuestion();
          } else {
            advanceToNextRound();
          }
        }
      }
    }
    if (state.scholarResolveT > 0) {
      state.scholarResolveT -= dt;
      if (state.scholarResolveT <= 0) advanceToNextRound();
    }
    // Particles
    for (var p = state.particles.length - 1; p >= 0; p--) {
      var pa = state.particles[p];
      pa.life -= dt;
      pa.x += pa.vx * dt;
      pa.y += pa.vy * dt;
      pa.vy += pa.gravity * dt;
      if (pa.life <= 0) state.particles.splice(p, 1);
    }
    // Shake decay
    if (state.shake.life > 0) {
      state.shake.life = Math.max(0, state.shake.life - dt);
    }
    // Periodic snapshot save (every 10s)
    if (phase === "playing" && state.time - lastSnapshotTs > 10) {
      lastSnapshotTs = state.time;
      saveSnapshot();
    }
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function advanceToNextRound() {
    if (state.lives <= 0) {
      gameOver();
      return;
    }
    state.round += 1;
    startRound();
  }
  function gameOver() {
    phase = "ended";
    if (dom.roundControls) dom.roundControls.classList.remove("show");
    sfx.gameOver();
    state.endReason = "Out of lives";
    finalizeRun();
    showEndScreen();
    stopMusic();
    clearSnapshot();
  }
  function finalizeRun() {
    // Best score persistence
    if (state.score > state.best) {
      state.best = state.score;
      writeBest(state.best);
    }
    // Submit leaderboard
    submitLeaderboard();
  }

  // -- Render frame ----------------------------------------------------------
  function frame(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.1, (ts - lastFrame) / 1000);
    lastFrame = ts;
    if (phase === "playing") update(dt);
    else if (phase === "feedback") update(dt);
    drawBackground();
    if (state && state.currentRound) {
      drawTimerArc();
      drawSlotsAndTiles();
      drawParticles();
    } else {
      // No round yet — draw idle
    }
    updateHud();
    rafHandle = requestAnimationFrame(frame);
  }

  // -- Input -----------------------------------------------------------------
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
        if (e.repeat && (k.length !== 1 || !/[a-zA-Z]/.test(k))) return;
        // Letter keys
        if (k.length === 1 && /[a-zA-Z]/.test(k)) {
          if (placeLetterFromKeyboard(k)) e.preventDefault();
          return;
        }
        if (k === "Backspace" || k === "Delete") {
          if (returnLastFromSlot()) e.preventDefault();
          return;
        }
        if (k === "Enter") {
          // Try submit if all filled
          var r = state.currentRound;
          if (r && !r.result) {
            var allFilled = true;
            for (var i = 0; i < r.slotsFilled.length; i++) if (r.slotsFilled[i] == null) { allFilled = false; break; }
            if (allFilled) submitAnswer();
          }
          e.preventDefault();
          return;
        }
        if (k === "1") { usePowerupByKey("1"); e.preventDefault(); return; }
        if (k === "2") { usePowerupByKey("2"); e.preventDefault(); return; }
        if (k === "3") { usePowerupByKey("3"); e.preventDefault(); return; }
        if (k === "4") { usePowerupByKey("4"); e.preventDefault(); return; }
        if (k === "5") { usePowerupByKey("5"); e.preventDefault(); return; }
        if (k === "p" || k === "P") { if (!e.repeat) togglePause(); e.preventDefault(); return; }
        if (k === "h" || k === "H") { useHint(); e.preventDefault(); return; }
        if (k === "s" || k === "S") { useShuffle(); e.preventDefault(); return; }
      }
      if (phase === "paused" && (k === "p" || k === "P" || k === " ")) {
        togglePause();
        e.preventDefault();
        return;
      }
      if (k === "Escape" || k === "Esc") {
        if (phase === "playing" || phase === "paused") togglePause();
        else if (phase === "question") skipScholar();
        e.preventDefault();
      }
    });
    bindCanvasClick();
  }
  function usePowerupByKey(key) {
    // First powerup whose meta key matches
    for (var i = 0; i < state.powerups.length; i++) {
      var meta = POWERUP_META[state.powerups[i].type];
      if (meta && meta.key === key) {
        usePowerup(i);
        return;
      }
    }
  }
  function bindCanvasClick() {
    function handle(ev) {
      if (phase !== "playing") return;
      var r = state.currentRound;
      if (!r || r.result) return;
      var rect = canvas.getBoundingClientRect();
      var px, py;
      if (ev.touches && ev.touches.length) {
        px = ev.touches[0].clientX - rect.left;
        py = ev.touches[0].clientY - rect.top;
      } else if (ev.changedTouches && ev.changedTouches.length) {
        px = ev.changedTouches[0].clientX - rect.left;
        py = ev.changedTouches[0].clientY - rect.top;
      } else {
        px = ev.clientX - rect.left;
        py = ev.clientY - rect.top;
      }
      // Convert to logical coords
      var lx = (px - offsetX) / scale;
      var ly = (py - offsetY) / scale;
      // Check rack tiles first
      for (var i = 0; i < r.tiles.length; i++) {
        var t = r.tiles[i];
        if (t.slotIndex >= 0) continue;
        if (lx >= t.x && lx <= t.x + TILE_W && ly >= t.y && ly <= t.y + TILE_H) {
          sfx.tilePick();
          placeTile(t);
          return;
        }
      }
      // Check placed tiles
      for (var k = 0; k < r.tiles.length; k++) {
        var pt = r.tiles[k];
        if (pt.slotIndex < 0) continue;
        if (r.slotsRevealed[pt.slotIndex]) continue;
        if (lx >= pt.x && lx <= pt.x + TILE_W && ly >= pt.y && ly <= pt.y + TILE_H) {
          returnTileFromSlot(pt.slotIndex);
          return;
        }
      }
    }
    canvas.addEventListener("click", handle);
    canvas.addEventListener("touchstart", function (e) {
      handle(e);
      // Prevent emulated mouse click
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
  }

  // -- Lifecycle / phases ----------------------------------------------------
  function startGame(opts) {
    opts = opts || {};
    initState(opts);
    phase = "playing";
    if (dom.setupScreen) dom.setupScreen.classList.remove("show");
    if (dom.endScreen) dom.endScreen.classList.remove("show");
    if (dom.pauseScreen) dom.pauseScreen.classList.remove("show");
    if (dom.questionScreen) dom.questionScreen.classList.remove("show");
    startTimeMs = performance.now();
    startMusic();
    startRound();
    renderPowerupTray();
    updateHud();
    updateRibbon();
    recordPlayWithProfile();
  }
  function togglePause() {
    if (phase === "playing") {
      phase = "paused";
      if (dom.pauseScreen) dom.pauseScreen.classList.add("show");
      duckMusic();
    } else if (phase === "paused") {
      phase = "playing";
      if (dom.pauseScreen) dom.pauseScreen.classList.remove("show");
      restoreMusic();
    }
  }
  function showEndScreen() {
    if (!dom.endScreen || !dom.endGrid) return;
    var html = "";
    function cell(label, value) {
      return '<div class="end-cell"><div class="end-cell-label">' + label + '</div><div class="end-cell-value mono">' + value + '</div></div>';
    }
    html += cell("Final Score", state.score);
    html += cell("Best", state.best);
    html += cell("Round Reached", state.round);
    html += cell("Correct", state.correctTotal);
    html += cell("Wrong", state.wrongTotal);
    html += cell("Skipped", state.skipTotal);
    html += cell("Best Streak", state.maxStreak);
    html += cell("Scholars", state.scholarCorrect);
    dom.endGrid.innerHTML = html;
    if (dom.endTitle) dom.endTitle.textContent = "Anagram Atlas · " + (state.endReason || "Run complete");
    if (dom.endKicker) dom.endKicker.textContent = state.score >= state.best ? "New Best Run" : "Run Ended";
    if (dom.retryHint) {
      dom.retryHint.textContent = state.score >= 5000
        ? "The scriptorium calls. Sharper still next run."
        : "Lengthen your streak — multipliers carry the score.";
    }
    if (dom.leaderboardPanel && window.MrMacsLeaderboards && window.MrMacsLeaderboards.top) {
      try {
        var top = window.MrMacsLeaderboards.top(GAME_ID, 5);
        if (top && top.length) {
          var lhtml = '<div class="leaderboard-title">Top runs</div>';
          for (var i = 0; i < top.length; i++) {
            var row = top[i];
            lhtml += '<div class="leaderboard-row"><span class="lb-rank">#' + (i + 1) + '</span><span class="lb-name">' + (row.name || "anonymous") + '</span><span class="lb-score">' + (row.score || 0) + '</span></div>';
          }
          dom.leaderboardPanel.innerHTML = lhtml;
          dom.leaderboardPanel.hidden = false;
        }
      } catch (e) {}
    }
    dom.endScreen.classList.add("show");
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    state = {
      round: opts.round || 1,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      streak: opts.streak || 0,
      maxStreak: opts.maxStreak || 0,
      multiplier: opts.multiplier || 1,
      x2RoundsLeft: opts.x2RoundsLeft || 0,
      powerups: opts.powerups || [],
      currentRound: null,
      time: 0,
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      particles: [],
      best: opts.best || readBest(),
      bgStars: opts.bgStars || generateStars(),
      recentTerms: [],
      scholarSeen: [],
      correctTotal: 0,
      wrongTotal: 0,
      skipTotal: 0,
      timeoutTotal: 0,
      scholarCorrect: 0,
      scholarResolveT: 0,
      scholarEntry: null,
      scholarChoiceOrder: null,
      scholarNewCorrect: -1,
      shardsAwarded: 0,
      endReason: ""
    };
  }
  function generateStars() {
    var stars = [];
    for (var i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * LOGICAL_W,
        y: Math.random() * LOGICAL_H,
        r: 0.5 + Math.random() * 1.5,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.0
      });
    }
    return stars;
  }

  // -- Hub integration -------------------------------------------------------
  function addShards(n) {
    if (n <= 0) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, "anagram-atlas-scholar-correct");
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          round: state.round,
          correct: state.correctTotal,
          scholars: state.scholarCorrect
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
          round: state.round,
          lives: state.lives,
          streak: state.streak,
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
  function recordPlayWithProfile() {
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.recordPlay) {
        window.MrMacsProfile.recordPlay({
          gameId: GAME_ID,
          score: state.score,
          durationMs: performance.now() - startTimeMs,
          level: state.round
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("anagram-atlas:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("anagram-atlas:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("cold-war-mission", { volume: 0.5 });
      }
    } catch (e) {}
  }
  function duckMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.duck) window.MrMacsArcadeMusic.duck(0.1, 200); } catch (e) {}
  }
  function restoreMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.restore) window.MrMacsArcadeMusic.restore(200); } catch (e) {}
  }
  function stopMusic() {
    try { if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.stop) window.MrMacsArcadeMusic.stop(); } catch (e) {}
  }

  // -- Misc UI bindings ------------------------------------------------------
  function bindUI() {
    if (dom.startBtn) dom.startBtn.addEventListener("click", function () { startGame(); });
    if (dom.againBtn) dom.againBtn.addEventListener("click", function () {
      if (dom.endScreen) dom.endScreen.classList.remove("show");
      startGame();
      recordPlayWithProfile();
    });
    if (dom.setupBtn) dom.setupBtn.addEventListener("click", function () {
      if (dom.endScreen) dom.endScreen.classList.remove("show");
      if (dom.setupScreen) dom.setupScreen.classList.add("show");
      phase = "setup";
      stopMusic();
    });
    if (dom.resumeBtn) dom.resumeBtn.addEventListener("click", function () { togglePause(); });
    if (dom.restartBtn) dom.restartBtn.addEventListener("click", function () {
      if (dom.pauseScreen) dom.pauseScreen.classList.remove("show");
      clearSnapshot();
      startGame();
    });
    if (dom.pauseExitBtn) dom.pauseExitBtn.addEventListener("click", function () {
      window.location.href = "../../index.html";
    });
    if (dom.exitBtn) dom.exitBtn.addEventListener("click", function () {
      window.location.href = "../../index.html";
    });
    if (dom.pauseBtn) dom.pauseBtn.addEventListener("click", function () { togglePause(); });
    if (dom.soundBtn) dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) stopMusic();
      else if (phase === "playing") startMusic();
    });
    if (dom.fullscreenBtn) dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      } catch (e) {}
    });
    if (dom.hintBtn) dom.hintBtn.addEventListener("click", function () { useHint(); });
    if (dom.shuffleBtn) dom.shuffleBtn.addEventListener("click", function () { useShuffle(); });
    if (dom.skipBtn) dom.skipBtn.addEventListener("click", function () { useSkip(); });
    if (dom.questionCloseBtn) dom.questionCloseBtn.addEventListener("click", skipScholar);
    // Resume card
    var snap = loadSnapshot();
    if (snap && dom.resumeCard) {
      var ago = Math.floor((Date.now() - (snap.ts || Date.now())) / 60000);
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume saved run?</div>' +
        '<div class="resume-card-meta">Score ' + (snap.score || 0) + ' · round ' + (snap.round || 1) + ' · ' + ago + ' min ago</div>' +
        '<div class="resume-actions">' +
        '<button class="btn glass-pill" id="resumeRunBtn" type="button">Resume</button>' +
        '<button class="btn glass-pill" id="discardRunBtn" type="button">Discard</button>' +
        '</div>';
      dom.resumeCard.hidden = false;
      var rRun = $("resumeRunBtn");
      var dRun = $("discardRunBtn");
      if (rRun) rRun.addEventListener("click", function () {
        startGame({ score: snap.score || 0, round: snap.round || 1, lives: snap.lives, streak: snap.streak });
      });
      if (dRun) dRun.addEventListener("click", function () {
        clearSnapshot();
        dom.resumeCard.hidden = true;
      });
    }
  }

  // -- Boot ------------------------------------------------------------------
  function boot() {
    setupDom();
    bindUI();
    bindInput();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    // Initial idle background only
    initState();
    state.currentRound = null;
    if (dom.hudBest) dom.hudBest.textContent = String(state.best);
    rafHandle = requestAnimationFrame(frame);
    // Save on visibility changes
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) saveSnapshot();
    });
    window.addEventListener("beforeunload", function () { saveSnapshot(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
