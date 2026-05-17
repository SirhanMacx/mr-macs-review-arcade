/* ===========================================================================
   Snake Pit — slither.io battle royale · Mr. Mac's Review Arcade
   Vanilla JS · Canvas · 1800x1800 continuous arena · 5-8 AI snakes
   Player serpent + AI rivals · scholar orbs · 3 lives · power-ups
   =========================================================================== */
(function () {
  "use strict";

  // -- Config ----------------------------------------------------------------
  var GAME_ID = "snake-pit";
  var GAME_TITLE = "Snake Pit";

  // Logical canvas (camera viewport size in world units)
  var VIEW_W = 960;
  var VIEW_H = 720;

  // World (continuous arena)
  var ARENA_W = 1800;
  var ARENA_H = 1800;
  var ARENA_PAD = 40;        // soft margin for spawn

  // Snake mechanics
  var SEG_RADIUS = 9;        // base body radius
  var SEG_SPACING = 7.5;     // distance between consecutive segments
  var BASE_SPEED = 150;      // px/sec (cruise)
  var BOOST_SPEED_MULT = 1.7;
  var TURN_RATE = 4.0;       // radians/sec
  var TURN_RATE_BOOST = 4.6;
  var PLAYER_INITIAL_LEN = 12;
  var AI_INITIAL_LEN_MIN = 12;
  var AI_INITIAL_LEN_MAX = 28;
  var GROWTH_METER_REFERENCE_LEN = 360;
  var MIN_LEN = 5;
  var TRAIL_POINT_MIN_DIST = 2.4;
  var TRAIL_POINT_MAX_KEEP = 18000;
  var SNAKE_DRAW_TARGET_SEGMENTS = 260;
  var SNAKE_COLLISION_TARGET_SEGMENTS = 240;
  var MAX_DEATH_ORBS = 180;
  var HUD_UPDATE_INTERVAL = 0.12;
  var BOOST_DRAIN_INTERVAL = 0.5;     // seconds per segment lost while boosting
  var KILL_BOOST_RESERVE_TIME = 4.0;  // free boost time when "Boost Reserve" pickup grabbed

  // Orb mechanics
  var ORB_RADIUS = 6;
  var ORB_VALUE_PTS = 50;
  var ORB_DEAD_RADIUS = 9;            // dead snake leftover orbs
  var ORB_DEAD_VALUE_PTS = 75;
  var ORB_BASE_COUNT = 240;           // baseline orb count in arena
  var SCHOLAR_ORB_RADIUS = 11;
  var SCHOLAR_ORB_INITIAL_COUNT = 4;
  var SCHOLAR_ORB_MAX_ACTIVE = 4;
  var SCHOLAR_ORB_RESPAWN_S = 8.0;   // frequent review prompts without interrupting every orb chain

  // AI snakes
  var AI_COUNT_MIN = 5;
  var AI_COUNT_MAX = 8;
  var AI_RESPAWN_DELAY = 3.5;
  var AI_BOOST_PROB = 0.005;          // per frame chance to start boosting
  var AI_BOOST_MIN_S = 0.6;
  var AI_BOOST_MAX_S = 2.4;

  // Power-ups
  var POWERUP_SPAWN_BASE_S = 18;       // average spawn cadence
  var POWERUP_LIFETIME = 26;           // seconds before despawn
  var POWERUP_MAX_ACTIVE = 4;

  // Lives + scoring
  var LIVES_INIT = 3;
  var SHARDS_CAP = 200;
  var BONUS_SHARDS_PER_KILL = 4;
  var KILL_STREAK_THRESHOLD = 3;       // streak length for celebration burst

  // SFX & misc
  var DEATH_DELAY_MS = 1700;
  var GAMEOVER_DELAY_MS = 900;

  // -- Inline review bank (28 questions, grade 8 → AP) -----------------------
  var INLINE_BANK = [
    // Grade 8 → US foundations
    { prompt: "The Declaration of Independence (1776) primarily justified separation by appealing to:", choices: ["Natural rights and consent of the governed", "The divine right of monarchs", "British parliamentary tradition", "Calvinist theology"], correctText: "Natural rights and consent of the governed" },
    { prompt: "The U.S. Constitution's system of checks and balances primarily aims to:", choices: ["Prevent any single branch from dominating", "Make federal courts subordinate to states", "Centralize power in the executive", "Eliminate judicial review"], correctText: "Prevent any single branch from dominating" },
    { prompt: "The Three-Fifths Compromise at the Constitutional Convention dealt with:", choices: ["How enslaved persons would be counted for representation and taxation", "The size of the standing army", "Western land sales", "Bank chartering"], correctText: "How enslaved persons would be counted for representation and taxation" },
    // Grade 9-10 — Global I + II
    { prompt: "The Neolithic Revolution refers to:", choices: ["The shift from hunting-and-gathering to settled agriculture", "The rise of industrial cities", "The fall of Rome", "The unification of Germany"], correctText: "The shift from hunting-and-gathering to settled agriculture" },
    { prompt: "The Mongol conquests under Genghis Khan most directly facilitated:", choices: ["Expanded Silk Road exchange across Eurasia", "European maritime empires in the Atlantic", "The Atlantic slave trade", "The Industrial Revolution"], correctText: "Expanded Silk Road exchange across Eurasia" },
    { prompt: "The Renaissance is best described as:", choices: ["A revival of classical learning, art, and humanism in Italy", "A military alliance against the Ottomans", "A movement for women's suffrage", "A scientific reaction to the Enlightenment"], correctText: "A revival of classical learning, art, and humanism in Italy" },
    { prompt: "The Columbian Exchange transferred between hemispheres mainly:", choices: ["Crops, animals, peoples, and pathogens", "Just gold and silver", "Only enslaved laborers", "Only military technology"], correctText: "Crops, animals, peoples, and pathogens" },
    { prompt: "The Treaty of Versailles (1919) was significant because it:", choices: ["Imposed reparations and war guilt on Germany", "Created the United Nations", "Ended the Cold War", "Partitioned the Ottoman Empire alone"], correctText: "Imposed reparations and war guilt on Germany" },
    { prompt: "A central goal of the Marshall Plan (1948) was to:", choices: ["Stabilize Western Europe to resist Soviet influence", "Forgive German war debts", "Create a single European currency", "Disband NATO"], correctText: "Stabilize Western Europe to resist Soviet influence" },
    // US History
    { prompt: "Which Supreme Court decision established judicial review?", choices: ["Marbury v. Madison (1803)", "McCulloch v. Maryland (1819)", "Brown v. Board (1954)", "Plessy v. Ferguson (1896)"], correctText: "Marbury v. Madison (1803)" },
    { prompt: "The Emancipation Proclamation (1863) primarily:", choices: ["Declared enslaved persons in Confederate-held areas free", "Abolished slavery nationwide", "Granted voting rights to freedmen", "Ended the Civil War"], correctText: "Declared enslaved persons in Confederate-held areas free" },
    { prompt: "Progressive Era reformers most directly addressed:", choices: ["Industrial labor abuses, monopolies, and political corruption", "Civil rights for African Americans", "Soviet expansion", "Independence for the Philippines"], correctText: "Industrial labor abuses, monopolies, and political corruption" },
    { prompt: "The New Deal (1933-1939) responded to the Great Depression by:", choices: ["Expanding federal regulation, relief, and reform", "Returning to laissez-faire economics", "Adopting communism", "Ending the gold standard alone"], correctText: "Expanding federal regulation, relief, and reform" },
    { prompt: "Brown v. Board of Education (1954) ruled that:", choices: ["Segregated public schools were unconstitutional", "Affirmative action was required nationwide", "Busing was unconstitutional", "States could nullify federal law"], correctText: "Segregated public schools were unconstitutional" },
    // AP Government / Civics
    { prompt: "Federalist No. 10 argues that a large republic is best for:", choices: ["Controlling factions through diversity of interests", "Encouraging direct democracy", "Centralizing all power in Congress", "Restricting religious belief"], correctText: "Controlling factions through diversity of interests" },
    { prompt: "Which clause has been the principal basis for federal regulation of the economy?", choices: ["The Commerce Clause", "The Establishment Clause", "The Privileges and Immunities Clause", "The Tenth Amendment alone"], correctText: "The Commerce Clause" },
    { prompt: "Stare decisis is the principle that:", choices: ["Courts generally follow prior precedent", "Treaties override the Constitution", "Federal law preempts all state law", "Statutes must be plain-meaning"], correctText: "Courts generally follow prior precedent" },
    // AP Economics
    { prompt: "If the demand curve shifts right while supply is unchanged, equilibrium price and quantity will:", choices: ["Both rise", "Both fall", "Price falls, quantity rises", "Price rises, quantity falls"], correctText: "Both rise" },
    { prompt: "The opportunity cost of choosing option A is:", choices: ["The value of the next-best alternative forgone", "The market price of A", "The sum of all alternatives", "The fixed cost of A"], correctText: "The value of the next-best alternative forgone" },
    { prompt: "Expansionary monetary policy typically involves:", choices: ["Lowering interest rates and increasing the money supply", "Raising taxes and cutting spending", "Selling Treasury bonds aggressively", "Pegging the currency to gold"], correctText: "Lowering interest rates and increasing the money supply" },
    // AP World / European
    { prompt: "The 1789 storming of the Bastille is most associated with:", choices: ["The opening of the French Revolution", "The Napoleonic Wars", "The Congress of Vienna", "The Reign of Terror's end"], correctText: "The opening of the French Revolution" },
    { prompt: "The Meiji Restoration (1868) marked Japan's:", choices: ["Rapid industrialization and modernization", "Adoption of a Confucian state", "Defeat in WWII", "Conversion to Christianity"], correctText: "Rapid industrialization and modernization" },
    { prompt: "Decolonization in Africa and Asia after 1945 was driven primarily by:", choices: ["Nationalism, weakened European powers, and Cold War pressures", "U.S. invasion of Europe", "Soviet annexation campaigns", "League of Nations decrees"], correctText: "Nationalism, weakened European powers, and Cold War pressures" },
    // AP Psychology
    { prompt: "Operant conditioning (Skinner) primarily concerns learning by:", choices: ["Consequences of voluntary behavior", "Reflex pairings of stimuli", "Imitation of models", "Innate biological drives"], correctText: "Consequences of voluntary behavior" },
    { prompt: "The placebo effect demonstrates that:", choices: ["Expectations can produce real psychological or physiological change", "All medical treatments are equivalent", "Subjects must be deceived for treatment to work", "Mind has no influence on body"], correctText: "Expectations can produce real psychological or physiological change" },
    // Civic / current
    { prompt: "The Universal Declaration of Human Rights (1948) was adopted by:", choices: ["The United Nations General Assembly", "NATO", "The European Court of Human Rights", "The League of Nations"], correctText: "The United Nations General Assembly" },
    { prompt: "Which of the following is the BEST example of a primary source for the Civil Rights movement?", choices: ["Martin Luther King Jr.'s 'Letter from Birmingham Jail' (1963)", "A 2010 high school textbook chapter on civil rights", "An encyclopedia entry on Selma", "A modern documentary film about King"], correctText: "Martin Luther King Jr.'s 'Letter from Birmingham Jail' (1963)" }
  ];

  var SNAKE_PIT_REVIEW_BANK = [
    { prompt: "Which development most helped early river valley civilizations create surplus food?", choices: ["Irrigation and organized farming", "The printing press", "Steam-powered factories", "Joint-stock companies"], correctText: "Irrigation and organized farming" },
    { prompt: "Hammurabi's Code is historically important because it:", choices: ["Written legal code linking laws to social order", "Created democracy in Athens", "Ended feudalism in Europe", "Established Buddhism in India"], correctText: "Written legal code linking laws to social order" },
    { prompt: "The caste system in classical India mainly organized society by:", choices: ["Hereditary social and occupational status", "Elected political parties", "Military rank only", "Free market competition"], correctText: "Hereditary social and occupational status" },
    { prompt: "Confucianism emphasized which value for social harmony?", choices: ["Filial piety and proper relationships", "Individual salvation through faith alone", "Permanent social revolution", "Separation of church and state"], correctText: "Filial piety and proper relationships" },
    { prompt: "The Five Pillars of Islam include:", choices: ["Prayer, fasting, charity, pilgrimage, and profession of faith", "Caste, karma, dharma, moksha, reincarnation", "Filial piety, mandate, rites, exams, ancestor worship", "Indulgences, sacraments, predestination, tithes, pilgrimage"], correctText: "Prayer, fasting, charity, pilgrimage, and profession of faith" },
    { prompt: "The Byzantine Empire preserved Roman and Greek traditions mainly through:", choices: ["Law codes, Orthodox Christianity, and classical learning", "Atlantic plantation agriculture", "Feudal parliaments", "Industrial capitalism"], correctText: "Law codes, Orthodox Christianity, and classical learning" },
    { prompt: "The Crusades helped increase European interest in:", choices: ["Trade with the eastern Mediterranean and Asia", "Isolation from all foreign goods", "Abolishing monarchies", "Ending urban growth"], correctText: "Trade with the eastern Mediterranean and Asia" },
    { prompt: "The Black Death contributed to the decline of feudalism by:", choices: ["Creating labor shortages that weakened manor obligations", "Strengthening serfdom everywhere", "Ending all trade in Europe permanently", "Uniting Europe under one emperor"], correctText: "Creating labor shortages that weakened manor obligations" },
    { prompt: "Martin Luther's Ninety-Five Theses criticized:", choices: ["The sale of indulgences and church abuses", "The scientific method", "The Magna Carta", "The Berlin Conference"], correctText: "The sale of indulgences and church abuses" },
    { prompt: "A major effect of the printing press was:", choices: ["Faster spread of religious, scientific, and political ideas", "Immediate end of monarchies", "Decline of literacy", "Isolation of European states"], correctText: "Faster spread of religious, scientific, and political ideas" },
    { prompt: "Mercantilism held that colonies should:", choices: ["Provide raw materials and markets for the mother country", "Elect representatives to rule Europe", "Remain economically independent", "Avoid all trade with Europe"], correctText: "Provide raw materials and markets for the mother country" },
    { prompt: "Enlightenment thinkers most directly influenced revolutions by arguing for:", choices: ["Natural rights, consent, and limits on government", "Absolute monarchy and divine right", "Mercantilist monopolies", "Feudal obligations"], correctText: "Natural rights, consent, and limits on government" },
    { prompt: "The Industrial Revolution began in Britain partly because Britain had:", choices: ["Coal, capital, labor, and stable institutions", "No overseas trade", "A ban on inventions", "No agricultural changes"], correctText: "Coal, capital, labor, and stable institutions" },
    { prompt: "Karl Marx argued that history was shaped mainly by:", choices: ["Class struggle over control of production", "Divine right monarchy", "Geographic isolation", "Individual voting behavior only"], correctText: "Class struggle over control of production" },
    { prompt: "The Berlin Conference of 1884-85 is associated with:", choices: ["European partition of Africa", "Unification of Germany", "Creation of the United Nations", "Japanese modernization"], correctText: "European partition of Africa" },
    { prompt: "Nationalism in the 19th century contributed to:", choices: ["Unification movements in Italy and Germany", "Permanent peace in Europe", "The end of all ethnic conflict", "The fall of industrial capitalism"], correctText: "Unification movements in Italy and Germany" },
    { prompt: "The Schlieffen Plan was Germany's strategy to:", choices: ["Defeat France quickly before turning east toward Russia", "Blockade Japan", "Invade Britain by sea first", "Withdraw from Belgium"], correctText: "Defeat France quickly before turning east toward Russia" },
    { prompt: "The Russian Revolution of 1917 resulted in:", choices: ["Bolshevik seizure of power and communist rule", "A stronger czarist monarchy", "Immediate democracy under NATO", "Unification with Germany"], correctText: "Bolshevik seizure of power and communist rule" },
    { prompt: "Appeasement in the 1930s refers to:", choices: ["Granting concessions to aggressive powers to avoid war", "The Allied invasion of Normandy", "The Soviet blockade of Berlin", "U.S. containment in Korea"], correctText: "Granting concessions to aggressive powers to avoid war" },
    { prompt: "The Cold War was primarily a conflict between:", choices: ["U.S.-led capitalism and Soviet-led communism", "Britain and France over colonies", "China and Japan over Korea", "Rome and Carthage over trade"], correctText: "U.S.-led capitalism and Soviet-led communism" },
    { prompt: "Containment was a U.S. policy designed to:", choices: ["Stop the spread of communism", "Promote isolationism", "End NATO", "Expand Soviet influence"], correctText: "Stop the spread of communism" },
    { prompt: "The Green Revolution increased food production through:", choices: ["High-yield seeds, fertilizers, irrigation, and technology", "Medieval crop rotation only", "Ending all global trade", "Returning to hunting and gathering"], correctText: "High-yield seeds, fertilizers, irrigation, and technology" },
    { prompt: "The Articles of Confederation created a national government that was:", choices: ["Too weak to tax or regulate interstate commerce effectively", "A powerful monarchy", "A strong centralized federal system", "A direct democracy with no states"], correctText: "Too weak to tax or regulate interstate commerce effectively" },
    { prompt: "The Great Compromise created:", choices: ["A bicameral Congress with House representation by population and equal Senate representation", "A national bank", "The Bill of Rights", "Judicial review"], correctText: "A bicameral Congress with House representation by population and equal Senate representation" },
    { prompt: "The Bill of Rights was added mainly to:", choices: ["Protect individual liberties and ease Anti-Federalist concerns", "Expand presidential war powers", "End slavery immediately", "Create political parties"], correctText: "Protect individual liberties and ease Anti-Federalist concerns" },
    { prompt: "Washington's Farewell Address warned against:", choices: ["Permanent alliances and political factionalism", "The creation of a cabinet", "Neutrality in foreign affairs", "The use of executive power"], correctText: "Permanent alliances and political factionalism" },
    { prompt: "The Monroe Doctrine asserted that:", choices: ["European powers should not colonize or interfere in the Americas", "The U.S. would join European wars", "Slavery would expand westward", "The Supreme Court could review laws"], correctText: "European powers should not colonize or interfere in the Americas" },
    { prompt: "Manifest Destiny was the belief that:", choices: ["The United States was destined to expand westward across North America", "States could nullify federal law", "Industrial laborers should unionize", "The U.S. should avoid expansion"], correctText: "The United States was destined to expand westward across North America" },
    { prompt: "The Kansas-Nebraska Act intensified sectional conflict because it:", choices: ["Allowed popular sovereignty over slavery in new territories", "Ended the plantation economy", "Abolished slavery nationwide", "Created the Republican tariff"], correctText: "Allowed popular sovereignty over slavery in new territories" },
    { prompt: "Reconstruction amendments did which of the following?", choices: ["Ended slavery, defined citizenship, and protected voting rights for Black men", "Created Social Security", "Declared war on Spain", "Established the Federal Reserve"], correctText: "Ended slavery, defined citizenship, and protected voting rights for Black men" },
    { prompt: "The Populist movement supported:", choices: ["Farmers' economic reforms such as currency expansion and railroad regulation", "Laissez-faire monopolies", "Imperial control of Cuba", "Strict limits on voting rights"], correctText: "Farmers' economic reforms such as currency expansion and railroad regulation" },
    { prompt: "Muckrakers contributed to Progressive reform by:", choices: ["Exposing corruption and unsafe conditions", "Defending monopolies", "Opposing all regulation", "Ending immigration"], correctText: "Exposing corruption and unsafe conditions" },
    { prompt: "The Harlem Renaissance was:", choices: ["A flowering of African American art, music, and literature", "A military campaign in Europe", "A New Deal banking program", "A Supreme Court doctrine"], correctText: "A flowering of African American art, music, and literature" },
    { prompt: "The Federal Reserve was created to:", choices: ["Stabilize banking and manage the money supply", "Run public schools", "Command the army", "Regulate immigration quotas"], correctText: "Stabilize banking and manage the money supply" },
    { prompt: "The Fair Deal and Great Society are both examples of:", choices: ["Federal domestic reform programs expanding social welfare", "Isolationist foreign policy", "Gilded Age laissez-faire", "Reconstruction military occupation"], correctText: "Federal domestic reform programs expanding social welfare" },
    { prompt: "The War Powers Resolution tried to:", choices: ["Limit presidential ability to commit troops without Congress", "Expand the Supreme Court", "End judicial review", "Create NATO"], correctText: "Limit presidential ability to commit troops without Congress" }
  ];

  // -- Snake colors ----------------------------------------------------------
  var PLAYER_COLORS = {
    body: "#4dd49b", bodyHi: "#9ff0c8", bodyLo: "#1f8d68",
    head: "#5de0f0", headHi: "#b8f7ff", trail: "rgba(93,224,240,0.55)"
  };
  // AI roster: each entry pairs a palette with a historic name + a default
  // personality. The personality is overridden by the round's difficulty
  // distribution in makeAiSnake() — but a snake's name + colors stay stable
  // across runs so the leaderboard reads consistently.
  // Personalities:
  //   "hunter"  → aggressive: targets the player, lunges, boost-heavy
  //   "greedy"  → orb-focused: ignores fights, beelines for orb clusters
  //   "cautious" → defensive: orbits danger, big lookahead, rarely boosts
  //   "default" → balanced (current behavior)
  var AI_PALETTES = [
    { body: "#a991ff", bodyHi: "#dccaff", bodyLo: "#6c4fc8", head: "#a991ff", headHi: "#e2d6ff", name: "Caesar",      personality: "hunter" },
    { body: "#f07bb8", bodyHi: "#ffd5ec", bodyLo: "#a14080", head: "#f07bb8", headHi: "#ffe2f2", name: "Cleopatra",   personality: "greedy" },
    { body: "#ff8838", bodyHi: "#ffd2a3", bodyLo: "#a44d10", head: "#ff8838", headHi: "#ffe5cc", name: "Napoleon",    personality: "hunter" },
    { body: "#5de0f0", bodyHi: "#bef5fb", bodyLo: "#2ba0b6", head: "#5de0f0", headHi: "#cefafd", name: "Tubman",      personality: "cautious" },
    { body: "#f5c451", bodyHi: "#ffe9a8", bodyLo: "#a8821c", head: "#f5c451", headHi: "#fff0c8", name: "Mansa Musa",  personality: "greedy" },
    { body: "#d04848", bodyHi: "#ffb0b0", bodyLo: "#7a1c1c", head: "#d04848", headHi: "#ffd2d2", name: "Genghis",     personality: "hunter" },
    { body: "#9ee08c", bodyHi: "#dcf5d0", bodyLo: "#3a7029", head: "#9ee08c", headHi: "#e2f5d8", name: "Gandhi",      personality: "cautious" },
    { body: "#c8d0e0", bodyHi: "#f0f5ff", bodyLo: "#5a667c", head: "#c8d0e0", headHi: "#fafcff", name: "Hammurabi",   personality: "default" },
    { body: "#e8b84b", bodyHi: "#fff0a0", bodyLo: "#a07820", head: "#e8b84b", headHi: "#fff8c4", name: "Catherine",   personality: "greedy" },
    { body: "#7c5fdb", bodyHi: "#c8b0ff", bodyLo: "#4030a0", head: "#7c5fdb", headHi: "#dcc8ff", name: "Mandela",     personality: "cautious" },
    { body: "#5dd4a0", bodyHi: "#a8f0d0", bodyLo: "#208058", head: "#5dd4a0", headHi: "#c8f5e0", name: "Tut",         personality: "default" },
    { body: "#f0a060", bodyHi: "#ffd8b0", bodyLo: "#a05828", head: "#f0a060", headHi: "#ffe8c8", name: "Joan",        personality: "hunter" }
  ];
  // Boss snake — appears every 90s when no boss is alive. Massive, fast,
  // worth 500pts on kill. Visually distinct: gold + crimson palette.
  var BOSS_PALETTE = {
    body: "#ffd060", bodyHi: "#fff5a0", bodyLo: "#a06820",
    head: "#ff8040", headHi: "#ffe2c8",
    trail: "rgba(255,160,60,0.55)",
    name: "Leviathan",
    personality: "hunter"
  };
  var BOSS_INTERVAL_S = 90;        // attempt to spawn every N seconds
  var BOSS_INITIAL_LEN = 60;        // way longer than normal snakes
  var BOSS_SCORE_REWARD = 500;
  var BOSS_SHARDS_REWARD = 20;

  // Power-ups — expanded from 5 → 7. SHIELD prevents next death (auto-pop).
  // SUPERNOVA kills the nearest non-boss snake (huge tactical option).
  var POWERUP_TYPES = ["boostReserve", "phase", "mass2x", "magnet", "burst", "shield", "supernova"];
  var POWERUP_META = {
    boostReserve: { glyph: "⚡", color: "#fff8c4", glow: "#f5c451", label: "BOOST RESERVE", desc: "Free boost 4s" },
    phase:        { glyph: "⛡", color: "#a8e8ff", glow: "#5de0f0", label: "PHASE",         desc: "Next collision passes through" },
    mass2x:       { glyph: "★", color: "#ffe488", glow: "#f5c451", label: "2x MASS",        desc: "Next 10 orbs double" },
    magnet:       { glyph: "⏺", color: "#dccaff", glow: "#a991ff", label: "MAGNET",         desc: "Orbs pull in 4s" },
    burst:        { glyph: "✸", color: "#ffd2d2", glow: "#d04848", label: "BURST",          desc: "Stuns 5 nearest snakes" },
    shield:       { glyph: "◈", color: "#bef5fb", glow: "#5de0f0", label: "SHIELD",         desc: "Auto-blocks next death" },
    supernova:    { glyph: "✺", color: "#ffd2a3", glow: "#ff8838", label: "SUPERNOVA",      desc: "Instantly KO nearest rival" }
  };

  // Combo system — chaining orb pickups within a 2.5s window builds a
  // multiplier. Tier thresholds:
  //   3 in window → 2x
  //   6 in window → 3x
  //  12 in window → 5x  (max)
  var COMBO_WINDOW_S = 2.5;
  var COMBO_TIERS = [
    { hits: 3,  mult: 2, label: "STREAK x2",    color: "#5de0f0" },
    { hits: 6,  mult: 3, label: "STREAK x3",    color: "#a991ff" },
    { hits: 12, mult: 5, label: "FRENZY x5",    color: "#f5c451" }
  ];

  // -- Canvas/state ----------------------------------------------------------
  var canvas, ctx;
  var dpr = 1;
  var scale = 1, offsetX = 0, offsetY = 0;

  var phase = "setup"; // setup | playing | question | paused | ended | dying
  var prevPhase = null;
  var rafHandle = null;
  var lastFrame = 0;
  var lastSnapshotTs = 0;

  var state = null;
  var reducedMotion = false;
  try {
    var _rmm = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = _rmm.matches;
    var _rmListener = function () { try { reducedMotion = _rmm.matches; } catch (e) {} };
    if (_rmm.addEventListener) _rmm.addEventListener("change", _rmListener);
    else if (_rmm.addListener) _rmm.addListener(_rmListener);
  } catch (e) {}

  var soundOn = true;
  var selectedDifficulty = "normal";   // overwritten in bindUi by saved pref

  // Tracked timeouts so we can cancel on restart/exit (prevents stale callbacks)
  var pendingTimeouts = [];
  function trackTimeout(fn, ms) {
    var id = setTimeout(function () {
      // self-remove on fire
      var idx = pendingTimeouts.indexOf(id);
      if (idx !== -1) pendingTimeouts.splice(idx, 1);
      try { fn(); } catch (e) {}
    }, ms);
    pendingTimeouts.push(id);
    return id;
  }
  function clearAllTimeouts() {
    for (var i = 0; i < pendingTimeouts.length; i++) {
      try { clearTimeout(pendingTimeouts[i]); } catch (e) {}
    }
    pendingTimeouts.length = 0;
  }

  // Mouse / input
  var mouseX = VIEW_W / 2, mouseY = VIEW_H / 2;
  var hasMouse = false;
  var keysHeld = { left: false, right: false, up: false, down: false, boost: false };
  var touchSteer = null;     // { dx, dy } from joystick (-1..1)
  var touchBoosting = false;

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
    eat:        function () { sfxTone(720, 0.045, { type: "triangle", volume: 0.10, endFreq: 1080 }); },
    eat_scholar: function () {
      [880, 1320, 1760].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.10, { type: "triangle", volume: 0.16 }); }, i * 50);
      });
    },
    boost_start: function () {
      sfxTone(280, 0.10, { type: "sawtooth", volume: 0.10, endFreq: 540 });
      sfxNoise(0.07, { volume: 0.06, cutoff: 1400 });
    },
    boost_end: function () { sfxTone(440, 0.08, { type: "triangle", volume: 0.08, endFreq: 220 }); },
    crash_die: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 800 });
      sfxTone(420, 0.34, { type: "sawtooth", volume: 0.16, endFreq: 80 });
    },
    scholar_correct: function () {
      [784, 1175, 1568, 1865].forEach(function (n, i) {
        setTimeout(function () { sfxTone(n, 0.16, { type: "triangle", volume: 0.18 }); }, i * 70);
      });
    },
    scholar_wrong: function () {
      sfxTone(330, 0.18, { type: "sawtooth", volume: 0.13, endFreq: 220 });
      sfxNoise(0.10, { volume: 0.06, cutoff: 600 });
    },
    kill: function () {
      sfxNoise(0.18, { volume: 0.18, cutoff: 1200 });
      sfxTone(660, 0.16, { type: "square", volume: 0.14, endFreq: 1320 });
    },
    powerup_pickup: function () {
      sfxTone(880, 0.10, { type: "triangle", volume: 0.16 });
      setTimeout(function () { sfxTone(1320, 0.14, { type: "triangle", volume: 0.16 }); }, 80);
    },
    powerup_use: function () {
      sfxTone(1320, 0.10, { type: "square", volume: 0.10 });
      setTimeout(function () { sfxTone(1760, 0.10, { type: "square", volume: 0.10 }); }, 60);
    },
    life_lost: function () {
      sfxTone(330, 0.30, { type: "sawtooth", volume: 0.16, endFreq: 110 });
    },
    gameOver: function () {
      sfxNoise(0.5, { volume: 0.22, cutoff: 700 });
      sfxTone(330, 0.6, { type: "sawtooth", volume: 0.18, endFreq: 50 });
    }
  };

  // -- DOM -------------------------------------------------------------------
  var dom = {};
  function $(id) { return document.getElementById(id); }

  function setupDom() {
    canvas = $("snakepitCanvas");
    ctx = canvas.getContext("2d");
    dom.hudScore = $("hudScore");
    dom.hudLives = $("hudLives");
    dom.hudLength = $("hudLength");
    dom.hudKills = $("hudKills");
    dom.hudBest = $("hudBest");
    dom.goalName = $("goalName");
    dom.goalMeta = $("goalMeta");
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
    dom.tcStick = $("tcStick");
    dom.tcStickKnob = $("tcStickKnob");
    dom.tcBoost = $("tcBoost");
    // Build-out additions
    dom.hudLeader = $("hudLeader");
    dom.diffButtons = document.querySelectorAll("#setupScreen .sp-diff-btn");
    dom.bossWarn = $("bossWarn");
  }

  // -- Geometry helpers ------------------------------------------------------
  function clampWorld(x, y) {
    if (x < ARENA_PAD) x = ARENA_PAD;
    if (y < ARENA_PAD) y = ARENA_PAD;
    if (x > ARENA_W - ARENA_PAD) x = ARENA_W - ARENA_PAD;
    if (y > ARENA_H - ARENA_PAD) y = ARENA_H - ARENA_PAD;
    return { x: x, y: y };
  }
  function dist2(ax, ay, bx, by) {
    var dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randi(min, max) { return Math.floor(rand(min, max + 1)); }
  function angWrap(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // -- Snake creation --------------------------------------------------------
  function makeSnake(opts) {
    opts = opts || {};
    var x = opts.x;
    var y = opts.y;
    if (x == null) x = rand(ARENA_PAD * 4, ARENA_W - ARENA_PAD * 4);
    if (y == null) y = rand(ARENA_PAD * 4, ARENA_H - ARENA_PAD * 4);
    var heading = opts.heading != null ? opts.heading : rand(0, Math.PI * 2);
    var len = opts.len || PLAYER_INITIAL_LEN;
    var seg = [];
    for (var i = 0; i < len; i++) {
      seg.push({
        x: x - Math.cos(heading) * SEG_SPACING * i,
        y: y - Math.sin(heading) * SEG_SPACING * i
      });
    }
    return {
      isPlayer: !!opts.isPlayer,
      isBoss: !!opts.isBoss,
      name: opts.name || "Rival",
      palette: opts.palette || AI_PALETTES[0],
      heading: heading,
      desiredHeading: heading,
      x: x, y: y,
      segments: seg,
      trail: seg.map(function (point) { return { x: point.x, y: point.y }; }),
      targetLen: len,             // smooth growth via interpolation
      pendingGrowth: 0,           // segment count waiting to be appended
      speed: BASE_SPEED,
      boosting: false,
      boostReserveT: 0,           // seconds of free boost remaining
      phaseT: 0,                  // seconds of phase invulnerability (passes through next snake)
      magnetT: 0,                 // seconds of orb-magnet
      multCount: 0,               // 2x mass orbs remaining (counts down per orb consumed)
      burstStunT: 0,              // seconds of stun (can't turn / loses control)
      drainTimer: 0,              // timer for boost segment drain
      ai: opts.ai || null,
      personality: opts.personality || "default", // hunter | greedy | cautious | default
      shieldArmed: false,         // SHIELD powerup armed (auto-blocks next death)
      dead: false,
      deadT: 0,
      lastBoostState: false,
      // AI bookkeeping
      _boostUntil: 0,
      _wanderTarget: null,
      _wanderRefresh: 0,
      _avoidUntil: 0,
      _intentTimer: 0,
      score: 0,
      kills: 0,
      lastHudUpdate: 0,
      // Combo (player only — AIs don't combo)
      comboCount: 0,
      comboT: 0,                  // time remaining before combo resets
      comboTier: 0                // 0/1/2/3 → 1x/2x/3x/5x
    };
  }

  function makePlayerSnake() {
    var s = makeSnake({
      x: ARENA_W / 2,
      y: ARENA_H / 2,
      heading: rand(0, Math.PI * 2),
      len: PLAYER_INITIAL_LEN,
      isPlayer: true,
      name: "You",
      palette: PLAYER_COLORS
    });
    return s;
  }

  function makeAiSnake(usedPalettes) {
    var paletteIdx = -1;
    for (var i = 0; i < AI_PALETTES.length; i++) {
      if (usedPalettes.indexOf(i) === -1) { paletteIdx = i; break; }
    }
    if (paletteIdx === -1) paletteIdx = randi(0, AI_PALETTES.length - 1);
    usedPalettes.push(paletteIdx);
    var palette = AI_PALETTES[paletteIdx];
    // spawn at safe distance from player
    var sx, sy, tries = 0;
    do {
      sx = rand(ARENA_PAD * 4, ARENA_W - ARENA_PAD * 4);
      sy = rand(ARENA_PAD * 4, ARENA_H - ARENA_PAD * 4);
      tries++;
    } while (state && state.player && dist2(sx, sy, state.player.x, state.player.y) < 600 * 600 && tries < 10);
    return makeSnake({
      x: sx, y: sy,
      heading: rand(0, Math.PI * 2),
      len: randi(AI_INITIAL_LEN_MIN, AI_INITIAL_LEN_MAX),
      isPlayer: false,
      name: palette.name || ("Rival " + (paletteIdx + 1)),
      palette: palette,
      personality: palette.personality || "default",
      ai: { kind: palette.personality || "default" }
    });
  }

  // Spawn the periodic boss snake at the far side of the arena.
  function makeBossSnake() {
    var p = state ? state.player : null;
    var sx, sy, tries = 0;
    do {
      sx = rand(ARENA_PAD * 4, ARENA_W - ARENA_PAD * 4);
      sy = rand(ARENA_PAD * 4, ARENA_H - ARENA_PAD * 4);
      tries++;
    } while (p && dist2(sx, sy, p.x, p.y) < 700 * 700 && tries < 12);
    return makeSnake({
      x: sx, y: sy,
      heading: rand(0, Math.PI * 2),
      len: BOSS_INITIAL_LEN,
      isPlayer: false,
      isBoss: true,
      name: BOSS_PALETTE.name,
      palette: BOSS_PALETTE,
      personality: BOSS_PALETTE.personality,
      ai: { kind: BOSS_PALETTE.personality }
    });
  }

  // -- Difficulty ------------------------------------------------------------
  // Each difficulty tier picks the AI count + boss interval + AI aggression.
  // Stored on state so the AI loop can reference live tuning.
  var DIFFICULTIES = {
    easy:      { label: "Reading Room",  aiCount: 4,  bossInterval: 120, boostProbMul: 0.6, lookAheadMul: 0.85 },
    normal:    { label: "The Stacks",    aiCount: 7,  bossInterval: 90,  boostProbMul: 1.0, lookAheadMul: 1.0 },
    hard:      { label: "Archive Dive",  aiCount: 10, bossInterval: 70,  boostProbMul: 1.3, lookAheadMul: 1.15 },
    nightmare: { label: "Coliseum",      aiCount: 13, bossInterval: 50,  boostProbMul: 1.6, lookAheadMul: 1.30 }
  };
  function currentDifficulty() {
    var d = (state && state.difficulty) || "normal";
    return DIFFICULTIES[d] || DIFFICULTIES.normal;
  }

  // -- State init ------------------------------------------------------------
  function initState(opts) {
    opts = opts || {};
    var carry = !!opts.carry;
    var difficulty = opts.difficulty || (state && state.difficulty) || "normal";
    var diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
    var palettesUsed = [];
    var newState = {
      player: makePlayerSnake(),
      ais: [],
      orbs: [],
      scholarOrbs: [],
      powerups: [],
      particles: [],
      popups: [],
      shake: { x: 0, y: 0, intensity: 0, life: 0, totalLife: 0 },
      time: 0,
      score: opts.score || 0,
      lives: opts.lives != null ? opts.lives : LIVES_INIT,
      best: opts.best || readBest(),
      kills: opts.kills || 0,
      orbsEaten: opts.orbsEaten || 0,
      shardsAwarded: opts.shardsAwarded || 0,
      questionsAnsweredCorrect: opts.questionsAnsweredCorrect || 0,
      questionsAnsweredTotal: opts.questionsAnsweredTotal || 0,
      maxLength: opts.maxLength || PLAYER_INITIAL_LEN,
      camX: ARENA_W / 2 - VIEW_W / 2,
      camY: ARENA_H / 2 - VIEW_H / 2,
      bgGrid: opts.bgGrid || generateBackgroundGrid(),
      powerupSpawnTimer: 6,
      scholarSpawnTimer: SCHOLAR_ORB_RESPAWN_S * 0.4,
      currentKillStreak: 0,
      maxKillStreak: opts.maxKillStreak || 0,
      respawnQueue: [], // [{ delay, palette? }]
      endReason: "",
      // Build-out additions:
      difficulty: difficulty,
      bossTimer: diff.bossInterval * 0.6,    // first boss appears a bit before the full interval
      bossAlive: false,
      bossesKilled: 0,
      leaderboard: [],                         // top-5 snakes by length, updated each frame
      lastLeaderboardUpdate: 0,
      lastHudUpdate: 0
    };
    state = newState;
    for (var i = 0; i < diff.aiCount; i++) {
      var ai = makeAiSnake(palettesUsed);
      state.ais.push(ai);
    }
    seedOrbs(ORB_BASE_COUNT);
    for (var si = 0; si < SCHOLAR_ORB_INITIAL_COUNT; si++) spawnScholarOrb();
  }

  function generateBackgroundGrid() {
    // pre-cache nothing; we draw the grid procedurally each frame from state.time
    // but we precompute decorative dots
    var dots = [];
    for (var i = 0; i < 130; i++) {
      dots.push({
        x: rand(0, ARENA_W),
        y: rand(0, ARENA_H),
        r: rand(0.4, 1.5),
        twinkle: rand(0, Math.PI * 2)
      });
    }
    return { dots: dots };
  }

  function seedOrbs(count) {
    for (var i = 0; i < count; i++) {
      state.orbs.push(makeOrb());
    }
  }
  function makeOrb(opts) {
    opts = opts || {};
    return {
      x: opts.x != null ? opts.x : rand(ARENA_PAD, ARENA_W - ARENA_PAD),
      y: opts.y != null ? opts.y : rand(ARENA_PAD, ARENA_H - ARENA_PAD),
      r: opts.r || ORB_RADIUS,
      hue: opts.hue || rand(160, 240),
      pulse: rand(0, Math.PI * 2),
      isDead: !!opts.isDead,
      pts: opts.pts || (opts.isDead ? ORB_DEAD_VALUE_PTS : ORB_VALUE_PTS),
      growth: opts.growth || 1
    };
  }
  function spawnScholarOrb() {
    var sx, sy, tries = 0;
    do {
      sx = rand(ARENA_PAD * 4, ARENA_W - ARENA_PAD * 4);
      sy = rand(ARENA_PAD * 4, ARENA_H - ARENA_PAD * 4);
      tries++;
    } while (state.player && dist2(sx, sy, state.player.x, state.player.y) < 400 * 400 && tries < 8);
    state.scholarOrbs.push({
      x: sx, y: sy, r: SCHOLAR_ORB_RADIUS,
      pulse: rand(0, Math.PI * 2),
      rot: 0,
      life: 80   // remains until eaten, but visual lifetime cap
    });
  }

  // -- Input map → desired heading ------------------------------------------
  function updatePlayerInput(dt) {
    var p = state.player;
    if (p.dead) return;
    if (p.burstStunT > 0) { p.burstStunT -= dt; return; } // can't steer while stunned

    var desired = p.desiredHeading;
    if (touchSteer && (Math.abs(touchSteer.dx) > 0.04 || Math.abs(touchSteer.dy) > 0.04)) {
      desired = Math.atan2(touchSteer.dy, touchSteer.dx);
    } else if (hasMouse) {
      // mouseX/mouseY are in screen px; convert to world coords relative to player position via camera
      var rect = canvas.getBoundingClientRect();
      var sx = (mouseX - rect.left - offsetX) / scale;
      var sy = (mouseY - rect.top - offsetY) / scale;
      // sx,sy are in view-space; desired heading from player center (which is centered in view)
      var dxv = sx - VIEW_W / 2;
      var dyv = sy - VIEW_H / 2;
      if (dxv * dxv + dyv * dyv > 16) {
        desired = Math.atan2(dyv, dxv);
      }
    } else if (keysHeld.left || keysHeld.right || keysHeld.up || keysHeld.down) {
      var kx = (keysHeld.right ? 1 : 0) - (keysHeld.left ? 1 : 0);
      var ky = (keysHeld.down ? 1 : 0) - (keysHeld.up ? 1 : 0);
      if (kx !== 0 || ky !== 0) desired = Math.atan2(ky, kx);
    }
    p.desiredHeading = desired;

    // Boost intent
    var wantBoost = !!keysHeld.boost || !!touchBoosting;
    setBoost(p, wantBoost);
  }

  function setBoost(s, want) {
    if (s.dead) { s.boosting = false; return; }
    if (want && s.segments.length <= MIN_LEN + 1 && s.boostReserveT <= 0) {
      // can't boost at minimum length
      want = false;
    }
    if (want !== s.boosting) {
      s.boosting = want;
      if (want && s.isPlayer) sfx.boost_start();
      else if (!want && s.isPlayer) sfx.boost_end();
      if (dom.tcBoost) dom.tcBoost.classList.toggle("is-active", !!want && s.isPlayer);
      s.drainTimer = 0;
    }
    s.lastBoostState = want;
  }

  // -- Per-snake step --------------------------------------------------------
  function turnSnake(s, dt) {
    var diff = angWrap(s.desiredHeading - s.heading);
    var rate = s.boosting ? TURN_RATE_BOOST : TURN_RATE;
    var maxTurn = rate * dt;
    if (diff > maxTurn) diff = maxTurn;
    else if (diff < -maxTurn) diff = -maxTurn;
    s.heading = angWrap(s.heading + diff);
  }

  function ensureSnakeTrail(s) {
    if (!Array.isArray(s.trail) || s.trail.length === 0) {
      s.trail = (s.segments && s.segments.length ? s.segments : [{ x: s.x, y: s.y }])
        .map(function (point) { return { x: point.x, y: point.y }; });
    }
    if (!s.trail.length) s.trail.push({ x: s.x, y: s.y });
  }

  function trimTrailToDistance(trail, maxDistance) {
    if (!trail.length) return;
    var travelled = 0;
    for (var i = 1; i < trail.length; i++) {
      var prev = trail[i - 1];
      var curr = trail[i];
      var dx = curr.x - prev.x;
      var dy = curr.y - prev.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (travelled + d >= maxDistance) {
        var remain = Math.max(0, maxDistance - travelled);
        var t = d > 0 ? remain / d : 0;
        trail[i] = {
          x: prev.x + dx * t,
          y: prev.y + dy * t
        };
        trail.length = i + 1;
        return;
      }
      travelled += d;
    }
  }

  function resampleTrailSegments(trail, targetLen) {
    var out = [];
    if (!trail.length || targetLen <= 0) return out;
    var nextDistance = 0;
    var travelled = 0;
    var maxPoints = Math.max(MIN_LEN, Math.floor(targetLen));
    out.push({ x: trail[0].x, y: trail[0].y });
    nextDistance += SEG_SPACING;
    for (var i = 1; i < trail.length && out.length < maxPoints; i++) {
      var prev = trail[i - 1];
      var curr = trail[i];
      var dx = curr.x - prev.x;
      var dy = curr.y - prev.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 0.0001) continue;
      while (travelled + d >= nextDistance && out.length < maxPoints) {
        var t = (nextDistance - travelled) / d;
        out.push({
          x: prev.x + dx * t,
          y: prev.y + dy * t
        });
        nextDistance += SEG_SPACING;
      }
      travelled += d;
    }
    while (out.length < maxPoints) {
      var tail = trail[trail.length - 1] || trail[0];
      out.push({ x: tail.x, y: tail.y });
    }
    return out;
  }

  function updateSnakeTrail(s) {
    ensureSnakeTrail(s);
    var head = s.trail[0];
    var dx = s.x - head.x;
    var dy = s.y - head.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d >= TRAIL_POINT_MIN_DIST) {
      s.trail.unshift({ x: s.x, y: s.y });
    } else {
      head.x = s.x;
      head.y = s.y;
    }
    if (s.trail.length > TRAIL_POINT_MAX_KEEP) s.trail.length = TRAIL_POINT_MAX_KEEP;
    var desiredLen = Math.max(MIN_LEN, Math.floor(s.targetLen || MIN_LEN));
    trimTrailToDistance(s.trail, Math.max(SEG_SPACING, (desiredLen - 1) * SEG_SPACING));
    s.segments = resampleTrailSegments(s.trail, desiredLen);
  }

  function moveSnake(s, dt) {
    if (s.dead) return;
    // NaN/finite guard — recover gracefully if positions or heading went bad
    if (!isFinite(s.x) || !isFinite(s.y)) { s.x = ARENA_W / 2; s.y = ARENA_H / 2; }
    if (!isFinite(s.heading)) s.heading = 0;
    if (!isFinite(s.desiredHeading)) s.desiredHeading = s.heading;
    // Stunned snakes move at reduced speed (so burst actually has effect)
    var stunFactor = (s.burstStunT > 0) ? 0.45 : 1;
    var spd = (s.boosting ? BASE_SPEED * BOOST_SPEED_MULT : BASE_SPEED) * stunFactor;
    s.speed = spd;
    var nx = s.x + Math.cos(s.heading) * spd * dt;
    var ny = s.y + Math.sin(s.heading) * spd * dt;
    // Soft wall: clamp + nudge heading inward
    var clamped = false;
    if (nx < ARENA_PAD) { nx = ARENA_PAD; clamped = true; }
    if (ny < ARENA_PAD) { ny = ARENA_PAD; clamped = true; }
    if (nx > ARENA_W - ARENA_PAD) { nx = ARENA_W - ARENA_PAD; clamped = true; }
    if (ny > ARENA_H - ARENA_PAD) { ny = ARENA_H - ARENA_PAD; clamped = true; }
    s.x = nx; s.y = ny;
    if (clamped) {
      // bias heading toward arena center
      var toCenter = Math.atan2(ARENA_H / 2 - s.y, ARENA_W / 2 - s.x);
      s.desiredHeading = toCenter;
    }

    // Boost drain (segment loss every BOOST_DRAIN_INTERVAL while moving)
    if (s.boosting) {
      if (s.boostReserveT > 0) {
        s.boostReserveT -= dt;
        if (s.boostReserveT < 0) s.boostReserveT = 0;
      } else {
        s.drainTimer += dt;
        while (s.drainTimer >= BOOST_DRAIN_INTERVAL) {
          s.drainTimer -= BOOST_DRAIN_INTERVAL;
          if (s.segments.length > MIN_LEN + 1) {
            var tail = s.segments[s.segments.length - 1];
            s.targetLen = Math.max(MIN_LEN, s.targetLen - 1);
            // drop a tiny orb where the dropped tail was
            if (tail) {
              if (Math.random() < 0.55) {
                var dropPt = clampWorld(tail.x + rand(-6, 6), tail.y + rand(-6, 6));
                state.orbs.push(makeOrb({
                  x: dropPt.x,
                  y: dropPt.y,
                  r: ORB_RADIUS - 1,
                  pts: 25,
                  hue: 200
                }));
              }
            }
          } else {
            // out of mass — stop boosting
            setBoost(s, false);
            break;
          }
        }
      }
    }

    // pendingGrowth folds in over time so growth is smooth.
    // While boosting (without reserve), pause growth so boost actually shrinks.
    var boostShrinking = s.boosting && s.boostReserveT <= 0;
    if (s.pendingGrowth > 0 && !boostShrinking) {
      var maxGrowThisFrame = Math.min(s.pendingGrowth, 3);
      s.targetLen += maxGrowThisFrame;
      s.pendingGrowth -= maxGrowThisFrame;
    }
    updateSnakeTrail(s);

    // Power-up timers (phase persists until consumed by collision; only magnet/stun decay)
    if (s.magnetT > 0) { s.magnetT -= dt; if (s.magnetT < 0) s.magnetT = 0; }
    if (s.burstStunT > 0) {
      // player-driven decay also happens in updatePlayerInput; this catches AI/dying frames
      // (No-op here for player to avoid double-decrement; player branch handles it.)
    }
  }

  function growSnake(s, n) {
    if (!n) return;
    s.pendingGrowth += n;
  }

  function segmentStride(length, targetSegments) {
    if (!length || length <= targetSegments) return 1;
    return Math.max(1, Math.ceil(length / targetSegments));
  }

  function collisionStride(s) {
    return segmentStride(s && s.segments ? s.segments.length : 0, SNAKE_COLLISION_TARGET_SEGMENTS);
  }

  function getDrawableSegments(s) {
    var segs = s.segments || [];
    if (!segs.length) return [];
    if (segs.length <= SNAKE_DRAW_TARGET_SEGMENTS) return segs;
    var stride = segmentStride(segs.length, SNAKE_DRAW_TARGET_SEGMENTS);
    var out = [];
    for (var i = 0; i < segs.length; i += stride) out.push(segs[i]);
    var tail = segs[segs.length - 1];
    if (out[out.length - 1] !== tail) out.push(tail);
    return out;
  }

  // -- Orb collection --------------------------------------------------------
  var MAGNET_RADIUS = 90; // px — magnet pull-in radius (also drawn in head ring)
  function tryEatOrbs(s, dt) {
    if (s.dead) return;
    if (typeof dt !== "number" || !isFinite(dt) || dt < 0) dt = 0.016;
    var headR = SEG_RADIUS + 2;
    // Magnet: pull orbs within MAGNET_RADIUS toward head (frame-rate independent)
    var magnetActive = s.magnetT > 0;
    var magnetR2 = MAGNET_RADIUS * MAGNET_RADIUS;
    for (var i = state.orbs.length - 1; i >= 0; i--) {
      var o = state.orbs[i];
      var d2 = dist2(s.x, s.y, o.x, o.y);
      if (magnetActive && d2 < magnetR2) {
        // move orb toward head
        var dxM = s.x - o.x, dyM = s.y - o.y;
        var dM = Math.sqrt(d2);
        if (dM > 1) {
          var pull = 220 * (1 - dM / MAGNET_RADIUS);
          if (pull > 0) {
            o.x += (dxM / dM) * pull * dt;
            o.y += (dyM / dM) * pull * dt;
          }
        }
      }
      var rr = (headR + o.r);
      if (d2 < rr * rr) {
        // Eaten!
        consumeOrb(s, o);
        state.orbs.splice(i, 1);
      }
    }
    // Scholar orbs
    for (var k = state.scholarOrbs.length - 1; k >= 0; k--) {
      var so = state.scholarOrbs[k];
      var rd = headR + so.r + 2;
      if (dist2(s.x, s.y, so.x, so.y) < rd * rd) {
        if (s.isPlayer) {
          // open scholar question
          state.scholarOrbs.splice(k, 1);
          openScholarQuestion(so);
          return;
        } else {
          // AI eats: just gives growth + score
          state.scholarOrbs.splice(k, 1);
          growSnake(s, 4);
          s.score += 200;
          burstAt(so.x, so.y, "#f5c451", 12);
        }
      }
    }
  }

  function consumeOrb(s, o) {
    var pts = o.pts || ORB_VALUE_PTS;
    var grow = o.growth || 1;
    if (s.multCount > 0) {
      pts *= 2;
      grow *= 2;
      s.multCount--;
    }
    // Combo multiplier — only the player builds + uses combo
    var comboMult = 1;
    if (s.isPlayer) {
      bumpCombo();
      comboMult = currentComboMult();
      pts = pts * comboMult;
    }
    growSnake(s, grow);
    if (s.isPlayer) {
      state.score += pts;
      state.orbsEaten++;
      sfx.eat();
      var label = comboMult > 1 ? ("+" + pts + " ×" + comboMult) : ("+" + pts);
      pushPopupWorld(label, o.x, o.y - 12, "is-score");
      if (s.targetLen > state.maxLength) state.maxLength = s.targetLen;
    } else {
      s.score += pts;
    }
    burstAt(o.x, o.y, o.isDead ? "#a991ff" : "#5de0f0", o.isDead ? 8 : 4);
  }

  // -- Power-ups -------------------------------------------------------------
  function spawnPowerup() {
    if (state.powerups.length >= POWERUP_MAX_ACTIVE) return;
    var type = POWERUP_TYPES[randi(0, POWERUP_TYPES.length - 1)];
    var sx, sy, tries = 0;
    do {
      sx = rand(ARENA_PAD * 2, ARENA_W - ARENA_PAD * 2);
      sy = rand(ARENA_PAD * 2, ARENA_H - ARENA_PAD * 2);
      tries++;
    } while (state.player && dist2(sx, sy, state.player.x, state.player.y) < 220 * 220 && tries < 6);
    state.powerups.push({
      type: type,
      x: sx, y: sy,
      life: POWERUP_LIFETIME,
      bob: rand(0, Math.PI * 2),
      rot: 0,
      r: 14
    });
  }

  function tryPickupPowerup(s) {
    if (s.dead || !s.isPlayer) return; // only player picks up power-ups
    var headR = SEG_RADIUS + 4;
    for (var i = state.powerups.length - 1; i >= 0; i--) {
      var pu = state.powerups[i];
      var rr = headR + pu.r;
      if (dist2(s.x, s.y, pu.x, pu.y) < rr * rr) {
        applyPowerup(pu);
        state.powerups.splice(i, 1);
      }
    }
  }

  function applyPowerup(pu) {
    var meta = POWERUP_META[pu.type];
    sfx.powerup_pickup();
    pushPopupWorld(meta.label, pu.x, pu.y - 18, "is-bonus");
    var p = state.player;
    if (pu.type === "boostReserve") {
      p.boostReserveT = Math.max(p.boostReserveT, KILL_BOOST_RESERVE_TIME);
    } else if (pu.type === "phase") {
      p.phaseT = 999; // consumed by next collision
    } else if (pu.type === "mass2x") {
      p.multCount = Math.max(p.multCount, 10);
    } else if (pu.type === "magnet") {
      p.magnetT = Math.max(p.magnetT, 4.0);
    } else if (pu.type === "burst") {
      // Stuns 5 nearest snakes briefly
      sfx.powerup_use();
      var pool = state.ais.slice();
      pool.sort(function (a, b) {
        return dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y);
      });
      var n = Math.min(5, pool.length);
      for (var i = 0; i < n; i++) {
        var ai = pool[i];
        if (ai.dead) continue;
        ai.burstStunT = 1.4;
        // throw their heading off
        ai.desiredHeading = ai.heading + rand(-Math.PI, Math.PI);
        burstAt(ai.x, ai.y, "#d04848", 14);
      }
      pushPopupWorld("BURST!", p.x, p.y - 28, "is-tetris");
      addShake(8, 0.4);
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 24, palette: ["#d04848", "#ff8838", "#f5c451"] });
        }
      } catch (e2) {}
    } else if (pu.type === "shield") {
      // Arm a shield that auto-pops on the next fatal collision. Visual ring
      // is drawn on the head while armed (see drawSnake / shield halo).
      p.shieldArmed = true;
      sfx.powerup_use();
      pushPopupWorld("SHIELD UP", p.x, p.y - 28, "is-bonus");
    } else if (pu.type === "supernova") {
      // Instantly KO the closest non-boss AI snake. Massive tactical clear.
      sfx.powerup_use();
      var bestAi = null, bestD = 1e18;
      for (var si = 0; si < state.ais.length; si++) {
        var cand = state.ais[si];
        if (cand.dead || cand.isBoss) continue;
        var d = dist2(p.x, p.y, cand.x, cand.y);
        if (d < bestD) { bestD = d; bestAi = cand; }
      }
      if (bestAi) {
        // Big burst at the target
        burstAt(bestAi.x, bestAi.y, "#ff8838", 28);
        addShake(14, 0.6);
        killSnake(bestAi, p);
        pushPopupWorld("SUPERNOVA → " + bestAi.name, p.x, p.y - 28, "is-tetris");
        try {
          if (window.MrMacsCelebration && !reducedMotion) {
            window.MrMacsCelebration.burst({ count: 36, palette: ["#ff8838", "#f5c451", "#fff0a0"] });
          }
        } catch (e3) {}
      } else {
        pushPopupWorld("NO TARGET", p.x, p.y - 28, "is-warn");
      }
    }
  }

  // Pop the SHIELD powerup: blocks the next death entirely, with a visible
  // explosion + brief invulnerability afterward (phase grace).
  function popShield(s, atX, atY) {
    if (!s.shieldArmed) return false;
    s.shieldArmed = false;
    s.phaseT = 1.5; // 1.5s post-shield grace so the player can disengage
    burstAt(atX, atY, "#bef5fb", 36);
    addShake(10, 0.4);
    pushPopupWorld("SHIELD!", atX, atY - 28, "is-bonus");
    try { sfx.powerup_use && sfx.powerup_use(); } catch (e) {}
    return true;
  }

  // -- Collision: head into bodies ------------------------------------------
  function checkSnakeCollisions(s) {
    if (s.dead) return false;
    var headR = SEG_RADIUS;
    var headX = s.x, headY = s.y;
    // Phase: skip first collision
    var phased = s.phaseT > 0;
    // self-collision skipped (slither.io style); only check against other snakes
    var others = [];
    if (s.isPlayer) others = state.ais;
    else {
      others = [state.player];
      for (var i = 0; i < state.ais.length; i++) {
        if (state.ais[i] !== s) others.push(state.ais[i]);
      }
    }
    for (var k = 0; k < others.length; k++) {
      var o = others[k];
      if (o.dead) continue;
      // Check head-vs-segments (skip head segment of other to avoid double-jeopardy at perfect head-on)
      // Head-on: both die.
      var oHeadR = SEG_RADIUS;
      // If heads collide tightly → both die (no credit to either; it's mutual)
      if (dist2(headX, headY, o.x, o.y) < (headR + oHeadR - 2) * (headR + oHeadR - 2)) {
        if (phased) {
          s.phaseT = 0;
          phased = false;
          burstAt(headX, headY, "#5de0f0", 18);
          return false;
        }
        // Player shield blocks a head-on too (saves the player but the other still dies)
        if (s.isPlayer && popShield(s, headX, headY)) {
          killSnake(o, s);
          return false;
        }
        if (o.isPlayer && popShield(o, headX, headY)) {
          killSnake(s, o);
          return true;
        }
        // both die — pass null killer for both so neither gets credit
        killSnake(o, null);
        killSnake(s, null);
        return true;
      }
      // segment hit
      var step = collisionStride(o);
      for (var j = 1; j < o.segments.length; j += step) {
        var seg = o.segments[j];
        var rr = headR + SEG_RADIUS - 1;
        if (dist2(headX, headY, seg.x, seg.y) < rr * rr) {
          if (phased) {
            s.phaseT = 0;
            phased = false;
            burstAt(headX, headY, "#5de0f0", 18);
            return false; // phase consumed; no death
          }
          // Shield: blocks segment-collision death too
          if (s.isPlayer && popShield(s, headX, headY)) {
            return false;
          }
          killSnake(s, o);
          return true;
        }
      }
    }
    return false;
  }

  // -- Death + scatter -------------------------------------------------------
  function killSnake(s, killer) {
    if (s.dead) return;
    s.dead = true;
    s.deadT = 0;
    // Scatter orbs along body (clamped inside arena so leftover orbs never spawn out of bounds)
    var seg = s.segments;
    var stride = Math.max(1, Math.ceil(seg.length / MAX_DEATH_ORBS));
    for (var i = 0; i < seg.length; i += stride) {
      var sg = seg[i];
      if (i === 0 || Math.random() < 0.65) {
        var pt = clampWorld(sg.x + rand(-4, 4), sg.y + rand(-4, 4));
        state.orbs.push(makeOrb({
          x: pt.x,
          y: pt.y,
          r: ORB_DEAD_RADIUS,
          isDead: true,
          pts: ORB_DEAD_VALUE_PTS,
          growth: 2,
          hue: rand(20, 60)
        }));
      }
    }
    burstAt(s.x, s.y, s.palette.body, 28);
    // SFX
    if (s.isPlayer) {
      sfx.crash_die();
    } else {
      sfx.kill();
      // If killer was player — credit
      if (killer === state.player) {
        state.kills++;
        state.currentKillStreak++;
        if (state.currentKillStreak > state.maxKillStreak) state.maxKillStreak = state.currentKillStreak;
        var killPts = 400 + Math.floor(s.segments.length * 5);
        // Boss bonus
        if (s.isBoss) {
          killPts = BOSS_SCORE_REWARD + Math.floor(s.segments.length * 8);
          state.bossesKilled = (state.bossesKilled || 0) + 1;
          addShards(BOSS_SHARDS_REWARD, GAME_ID + "-boss");
          pushPopup({
            text: "★ LEVIATHAN SLAIN ★",
            sub: "+" + killPts + " · +" + BOSS_SHARDS_REWARD + " shards",
            color: "#fff0a0",
            life: 3.0,
            big: true
          });
          try {
            if (window.MrMacsCelebration && !reducedMotion) {
              window.MrMacsCelebration.burst({ count: 60, palette: ["#fff0a0", "#ff8040", "#f5c451", "#ffd060"] });
            }
          } catch (eb) {}
          // Drop a scholar orb at boss death site as the reward
          if (state.scholarOrbs.length < 3) {
            state.scholarOrbs.push({
              x: s.x, y: s.y,
              r: SCHOLAR_ORB_RADIUS,
              pulse: 0,
              ttl: 90
            });
          }
          addShake(18, 0.8);
        }
        state.score += killPts;
        addShards(BONUS_SHARDS_PER_KILL, GAME_ID + "-kill");
        pushPopupWorld(s.name + " DOWN +" + killPts, s.x, s.y - 26, "is-kill");
        if (state.currentKillStreak >= KILL_STREAK_THRESHOLD) {
          var streakPts = 500 * state.currentKillStreak;
          state.score += streakPts;
          pushPopupWorld(state.currentKillStreak + "X STREAK +" + streakPts, state.player.x, state.player.y - 50, "is-tetris");
          try {
            if (window.MrMacsCelebration && !reducedMotion) {
              window.MrMacsCelebration.burst({ count: 30, palette: ["#ff8838", "#f5c451", "#d04848", "#a991ff"] });
            }
          } catch (e2) {}
        }
        addShake(6, 0.35);
      }
    }
    // Schedule respawn for AI
    if (!s.isPlayer) {
      state.respawnQueue.push({ delay: AI_RESPAWN_DELAY });
    } else {
      state.currentKillStreak = 0;
      onPlayerDied();
    }
  }

  function onPlayerDied() {
    if (phase === "ended") return;
    var p = state.player;
    p.boosting = false;
    state.lives--;
    sfx.life_lost();
    if (state.lives <= 0) {
      phase = "dying";
      trackTimeout(function () {
        if (phase !== "dying") return; // canceled by restart/exit
        gameOver();
      }, GAMEOVER_DELAY_MS);
    } else {
      phase = "dying";
      trackTimeout(function () {
        if (phase !== "dying") return; // canceled by restart/exit
        respawnPlayer();
        phase = "playing";
      }, DEATH_DELAY_MS);
    }
  }

  function respawnPlayer() {
    state.player = makePlayerSnake();
    state.player.phaseT = 1.6; // brief invuln on respawn
    // Snap camera to player so respawn doesn't leave them off-screen
    state.camX = state.player.x - VIEW_W / 2;
    state.camY = state.player.y - VIEW_H / 2;
    if (state.camX < 0) state.camX = 0;
    if (state.camY < 0) state.camY = 0;
    if (state.camX > ARENA_W - VIEW_W) state.camX = ARENA_W - VIEW_W;
    if (state.camY > ARENA_H - VIEW_H) state.camY = ARENA_H - VIEW_H;
  }

  // -- Update AI snakes ------------------------------------------------------
  function updateAis(dt) {
    // Process respawns
    for (var i = state.respawnQueue.length - 1; i >= 0; i--) {
      state.respawnQueue[i].delay -= dt;
      if (state.respawnQueue[i].delay <= 0) {
        // re-add
        var palettesUsed = [];
        for (var j = 0; j < state.ais.length; j++) {
          if (!state.ais[j].dead) {
            for (var pi = 0; pi < AI_PALETTES.length; pi++) {
              if (AI_PALETTES[pi] === state.ais[j].palette) palettesUsed.push(pi);
            }
          }
        }
        var fresh = makeAiSnake(palettesUsed);
        // Replace any fully-dead snake slot
        var replaced = false;
        for (var k = 0; k < state.ais.length; k++) {
          if (state.ais[k].dead && state.ais[k].deadT >= 1) {
            state.ais[k] = fresh;
            replaced = true;
            break;
          }
        }
        if (!replaced) state.ais.push(fresh);
        state.respawnQueue.splice(i, 1);
      }
    }
    // Run AI behavior
    for (var idx = 0; idx < state.ais.length; idx++) {
      var ai = state.ais[idx];
      if (ai.dead) {
        ai.deadT += dt * 1.3;
        continue;
      }
      runAi(ai, dt);
      turnSnake(ai, dt);
      moveSnake(ai, dt);
      tryEatOrbs(ai, dt);
      if (checkSnakeCollisions(ai)) continue;
    }
    // Cull fully-faded dead AIs (their slots will be replaced via respawn queue)
    for (var d = state.ais.length - 1; d >= 0; d--) {
      if (state.ais[d].dead && state.ais[d].deadT >= 1) {
        // hold the slot until respawn fills it; just clear segments to free memory
        if (state.ais[d].segments.length > 0) state.ais[d].segments = [];
        if (state.ais[d].trail && state.ais[d].trail.length > 0) state.ais[d].trail = [];
      }
    }
  }

  function runAi(ai, dt) {
    if (ai.burstStunT > 0) {
      ai.burstStunT -= dt;
      ai.desiredHeading = ai.heading + rand(-0.05, 0.05);
      ai.boosting = false;
      return;
    }
    ai._intentTimer -= dt;

    var p = state.player;
    var diff = currentDifficulty();
    var personality = ai.personality || "default";
    var isBoss = !!ai.isBoss;

    // ── Personality-driven tuning ──
    // Hunters target the player aggressively; greedy snakes single-mindedly
    // chase orb clusters; cautious snakes prioritize survival with extra
    // lookahead and conservative boosting. Default keeps the original logic.
    var lookAheadBase, threatRadius, boostMul, wanderRange, orbReach, playerLungeChance;
    if (personality === "hunter") {
      lookAheadBase = 70; threatRadius = 56; boostMul = 1.8;
      wanderRange = 220; orbReach = 200 * 200; playerLungeChance = 0.10;
    } else if (personality === "greedy") {
      lookAheadBase = 80; threatRadius = 60; boostMul = 0.9;
      wanderRange = 380; orbReach = 360 * 360; playerLungeChance = 0.01;
    } else if (personality === "cautious") {
      lookAheadBase = 130; threatRadius = 95; boostMul = 0.5;
      wanderRange = 280; orbReach = 220 * 220; playerLungeChance = 0.02;
    } else {
      lookAheadBase = 90; threatRadius = 70; boostMul = 1.0;
      wanderRange = 300; orbReach = 240 * 240; playerLungeChance = 0.04;
    }
    // Bosses are colossal and intense
    if (isBoss) {
      lookAheadBase = 110; threatRadius = 100; boostMul = 1.5;
      orbReach = 400 * 400; playerLungeChance = 0.18;
    }
    // Difficulty scaling
    lookAheadBase *= diff.lookAheadMul;
    boostMul *= diff.boostProbMul;

    var nearestOrb = null, nearestOrbD = 1e9;
    var sampleN = Math.min(state.orbs.length, 40);
    var stepO = Math.max(1, Math.floor(state.orbs.length / sampleN));
    for (var i = 0; i < state.orbs.length; i += stepO) {
      var o = state.orbs[i];
      var d2 = dist2(ai.x, ai.y, o.x, o.y);
      if (d2 < nearestOrbD) { nearestOrbD = d2; nearestOrb = o; }
    }
    // Scholar orb attractor — greedy snakes weight scholar orbs heavily
    var scholarWeight = personality === "greedy" ? 1.8 : 1.4;
    for (var s2 = 0; s2 < state.scholarOrbs.length; s2++) {
      var so = state.scholarOrbs[s2];
      var sd = dist2(ai.x, ai.y, so.x, so.y);
      if (sd < nearestOrbD * scholarWeight) { nearestOrbD = sd; nearestOrb = so; }
    }

    // ── Avoidance check ──
    var lookAhead = lookAheadBase + ai.speed * 0.15;
    var ahx = ai.x + Math.cos(ai.heading) * lookAhead;
    var ahy = ai.y + Math.sin(ai.heading) * lookAhead;
    var avoidVec = { dx: 0, dy: 0 };
    var avoidActive = false;
    var threatSq = threatRadius * threatRadius;

    function checkAgainst(other) {
      if (other === ai) return;
      if (other.dead) return;
      var stepS = Math.max(1, Math.floor(other.segments.length / 10));
      for (var k = 0; k < other.segments.length; k += stepS) {
        var sg = other.segments[k];
        var dd = dist2(ahx, ahy, sg.x, sg.y);
        if (dd < threatSq) {
          var dx = ai.x - sg.x;
          var dy = ai.y - sg.y;
          var dl = Math.sqrt(dist2(ai.x, ai.y, sg.x, sg.y));
          if (dl > 1) {
            avoidVec.dx += dx / dl;
            avoidVec.dy += dy / dl;
            avoidActive = true;
          }
        }
      }
    }
    checkAgainst(p);
    for (var aii = 0; aii < state.ais.length; aii++) {
      if (state.ais[aii] !== ai) checkAgainst(state.ais[aii]);
    }

    // Wall avoidance — cautious snakes pull in earlier
    var wallM = personality === "cautious" ? 110 : 80;
    if (ai.x < wallM) { avoidVec.dx += 1; avoidActive = true; }
    if (ai.x > ARENA_W - wallM) { avoidVec.dx -= 1; avoidActive = true; }
    if (ai.y < wallM) { avoidVec.dy += 1; avoidActive = true; }
    if (ai.y > ARENA_H - wallM) { avoidVec.dy -= 1; avoidActive = true; }

    var desired;
    if (avoidActive) {
      var alen = Math.sqrt(avoidVec.dx * avoidVec.dx + avoidVec.dy * avoidVec.dy);
      if (alen > 0.001) {
        desired = Math.atan2(avoidVec.dy / alen, avoidVec.dx / alen);
      } else {
        desired = ai.heading;
      }
      ai._avoidUntil = 0.5;
    } else if (personality === "hunter" && p && !p.dead && dist2(ai.x, ai.y, p.x, p.y) < 500 * 500) {
      // Hunters lock onto the player when in range
      desired = Math.atan2(p.y - ai.y, p.x - ai.x);
    } else if (nearestOrb && nearestOrbD < orbReach) {
      desired = Math.atan2(nearestOrb.y - ai.y, nearestOrb.x - ai.x);
    } else {
      ai._wanderRefresh -= dt;
      if (!ai._wanderTarget || ai._wanderRefresh <= 0) {
        ai._wanderTarget = {
          x: rand(ARENA_PAD * 4, ARENA_W - ARENA_PAD * 4),
          y: rand(ARENA_PAD * 4, ARENA_H - ARENA_PAD * 4)
        };
        ai._wanderRefresh = rand(3, 6);
      }
      desired = Math.atan2(ai._wanderTarget.y - ai.y, ai._wanderTarget.x - ai.x);
    }

    // Lunge at player when we have mass advantage (personality-modulated)
    if (!avoidActive && p && !p.dead) {
      var dPlayer2 = dist2(ai.x, ai.y, p.x, p.y);
      var massAdv = ai.segments.length > p.segments.length + (isBoss ? 0 : 8);
      var lungeRange = isBoss ? 480 * 480 : 360 * 360;
      if (massAdv && dPlayer2 < lungeRange && Math.random() < playerLungeChance) {
        desired = Math.atan2(p.y - ai.y, p.x - ai.x);
        if (Math.random() < 0.5) {
          setBoost(ai, true);
          ai._boostUntil = state.time + rand(AI_BOOST_MIN_S, AI_BOOST_MAX_S);
        }
      }
    }

    ai.desiredHeading = desired;

    // Boost behavior — scaled by personality + difficulty
    if (ai.boosting) {
      if (state.time >= ai._boostUntil || ai.segments.length <= MIN_LEN + 2) {
        setBoost(ai, false);
      }
    } else {
      var boostP = AI_BOOST_PROB * boostMul;
      if (Math.random() < boostP && ai.segments.length > MIN_LEN + 6) {
        setBoost(ai, true);
        ai._boostUntil = state.time + rand(AI_BOOST_MIN_S, AI_BOOST_MAX_S);
      }
    }
  }

  // -- Particles + popups ----------------------------------------------------
  function burstAt(x, y, color, count) {
    if (reducedMotion) return;
    count = count || 10;
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 60 + Math.random() * 140;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.7,
        totalLife: 0.7,
        color: color,
        size: 2 + Math.random() * 3
      });
    }
  }
  function updateParticles(dt) {
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - dt * 0.8);
      p.vy *= (1 - dt * 0.8);
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }
  function pushPopupWorld(text, wx, wy, kls) {
    // Convert world → screen
    var sx = (wx - state.camX);
    var sy = (wy - state.camY);
    if (sx < -40 || sx > VIEW_W + 40 || sy < -40 || sy > VIEW_H + 40) return;
    var div = document.createElement("div");
    div.className = "popup-text " + (kls || "");
    div.textContent = text;
    var rect = canvas.getBoundingClientRect();
    var px = rect.left + offsetX + sx * scale;
    var py = rect.top + offsetY + sy * scale;
    div.style.left = px + "px";
    div.style.top = py + "px";
    dom.popupOverlay.appendChild(div);
    setTimeout(function () { try { div.remove(); } catch (e) {} }, 1200);
  }
  function pushPopupScreen(text, sx, sy, kls) {
    var div = document.createElement("div");
    div.className = "popup-text " + (kls || "");
    div.textContent = text;
    var rect = canvas.getBoundingClientRect();
    var px = rect.left + offsetX + sx * scale;
    var py = rect.top + offsetY + sy * scale;
    div.style.left = px + "px";
    div.style.top = py + "px";
    dom.popupOverlay.appendChild(div);
    setTimeout(function () { try { div.remove(); } catch (e) {} }, 1200);
  }
  // Big centered banner for headline events (boss spawn, boss death, frenzy)
  function pushPopup(opts) {
    opts = opts || {};
    var div = document.createElement("div");
    div.className = "snake-pit-banner" + (opts.big ? " is-big" : "");
    var color = opts.color || "#5de0f0";
    div.style.color = color;
    div.style.borderColor = color;
    div.style.boxShadow = "0 0 24px " + color + "55, inset 0 0 16px " + color + "22";
    div.innerHTML = "<strong>" + (opts.text || "") + "</strong>" +
      (opts.sub ? '<span class="banner-sub">' + opts.sub + "</span>" : "");
    if (dom.popupOverlay) dom.popupOverlay.appendChild(div);
    var life = (opts.life != null ? opts.life : 2.2) * 1000;
    setTimeout(function () { try { div.classList.add("is-out"); } catch (e) {} }, life - 400);
    setTimeout(function () { try { div.remove(); } catch (e) {} }, life);
  }
  function addShake(intensity, life) {
    if (reducedMotion) return;
    state.shake.intensity = Math.max(state.shake.intensity, intensity);
    state.shake.life = Math.max(state.shake.life, life);
    state.shake.totalLife = Math.max(state.shake.totalLife, life);
  }
  function updateShake(dt) {
    if (state.shake.life > 0) {
      state.shake.life -= dt;
      var t = state.shake.life / state.shake.totalLife;
      var i = state.shake.intensity * Math.max(0, t);
      state.shake.x = (Math.random() - 0.5) * 2 * i;
      state.shake.y = (Math.random() - 0.5) * 2 * i;
    } else {
      state.shake.x = 0;
      state.shake.y = 0;
    }
  }

  // -- Power-up tick + scholar respawn --------------------------------------
  function updatePowerups(dt) {
    for (var i = state.powerups.length - 1; i >= 0; i--) {
      var pu = state.powerups[i];
      pu.life -= dt;
      pu.bob += dt * 3;
      pu.rot += dt * 1.4;
      if (pu.life <= 0) state.powerups.splice(i, 1);
    }
    state.powerupSpawnTimer -= dt;
    if (state.powerupSpawnTimer <= 0 && state.powerups.length < POWERUP_MAX_ACTIVE) {
      spawnPowerup();
      state.powerupSpawnTimer = POWERUP_SPAWN_BASE_S + rand(-4, 6);
    }
    state.scholarSpawnTimer -= dt;
    if (state.scholarSpawnTimer <= 0 && state.scholarOrbs.length < SCHOLAR_ORB_MAX_ACTIVE) {
      spawnScholarOrb();
      state.scholarSpawnTimer = SCHOLAR_ORB_RESPAWN_S + rand(-4, 8);
    }
    // refill orbs to baseline (keep arena stocked)
    if (state.orbs.length < ORB_BASE_COUNT) {
      var need = Math.min(3, ORB_BASE_COUNT - state.orbs.length);
      for (var n = 0; n < need; n++) state.orbs.push(makeOrb());
    }

    // ── Boss snake spawn ──
    // Check whether the current boss is still alive (if any). Boss is the
    // first AI with isBoss=true that isn't dead.
    state.bossAlive = false;
    for (var bi = 0; bi < state.ais.length; bi++) {
      if (state.ais[bi].isBoss && !state.ais[bi].dead) { state.bossAlive = true; break; }
    }
    state.bossTimer -= dt;
    if (!state.bossAlive && state.bossTimer <= 0) {
      var boss = makeBossSnake();
      state.ais.push(boss);
      state.bossAlive = true;
      state.bossTimer = currentDifficulty().bossInterval;
      // Big announcement
      pushPopup({
        text: "⚠ LEVIATHAN SURFACES ⚠",
        sub: "Take it down for +" + BOSS_SCORE_REWARD + " score",
        color: "#ff8040",
        life: 3.2,
        big: true
      });
      try { sfx.crash_die && sfx.crash_die(); } catch (e) {}
    }
  }

  // ── Combo / leaderboard ──
  function tickCombo(dt) {
    var p = state.player;
    if (!p || p.dead) return;
    if (p.comboT > 0) {
      p.comboT -= dt;
      if (p.comboT <= 0) {
        // Combo expired — silently reset. Player can see this in the HUD
        // multiplier disappearing; no need for a centered banner that
        // covers gameplay.
        p.comboCount = 0;
        p.comboTier = 0;
      }
    }
  }
  function bumpCombo() {
    var p = state.player;
    if (!p || p.dead) return;
    p.comboCount += 1;
    p.comboT = COMBO_WINDOW_S;
    // Find highest tier the count qualifies for
    var newTier = 0;
    for (var t = 0; t < COMBO_TIERS.length; t++) {
      if (p.comboCount >= COMBO_TIERS[t].hits) newTier = t + 1;
    }
    if (newTier > p.comboTier) {
      p.comboTier = newTier;
      var tierMeta = COMBO_TIERS[newTier - 1];
      // Tier-up: brief corner pill (top-right under leaderboard), not a
      // centered banner — players need to keep watching their snake.
      // The HUD goal-meta also shows the multiplier persistently.
      pushComboPill(tierMeta);
    }
  }
  // Flash a small corner pill announcing a new combo tier. Lives in the
  // upper-left area so it doesn't fight the leaderboard or block the
  // playfield. Animates in/out quickly so it never lingers.
  function pushComboPill(tier) {
    if (!dom.popupOverlay) return;
    var div = document.createElement("div");
    div.className = "snake-pit-combo-pill";
    div.style.color = tier.color;
    div.style.borderColor = tier.color;
    div.style.boxShadow = "0 0 14px " + tier.color + "55";
    div.innerHTML = '<strong>' + tier.label + '</strong>' +
      '<span class="cp-sub">×' + tier.mult + ' for ' + COMBO_WINDOW_S + 's</span>';
    dom.popupOverlay.appendChild(div);
    setTimeout(function () { try { div.classList.add("is-out"); } catch (e) {} }, 900);
    setTimeout(function () { try { div.remove(); } catch (e) {} }, 1300);
  }
  function currentComboMult() {
    var p = state.player;
    if (!p || !p.comboTier) return 1;
    return COMBO_TIERS[p.comboTier - 1].mult;
  }

  // Build the live top-5 leaderboard sorted by segment count (length).
  // Updated every 0.4s to avoid per-frame sort thrash; players see updates
  // smoothly via animated HUD repaint.
  function updateLeaderboard() {
    if (state.time - state.lastLeaderboardUpdate < 0.4) return;
    state.lastLeaderboardUpdate = state.time;
    var rows = [];
    if (state.player && !state.player.dead) {
      rows.push({
        name: "YOU",
        len: state.player.segments.length,
        color: PLAYER_COLORS.head,
        isPlayer: true,
        isBoss: false
      });
    }
    for (var i = 0; i < state.ais.length; i++) {
      var ai = state.ais[i];
      if (ai.dead) continue;
      rows.push({
        name: ai.name,
        len: ai.segments.length,
        color: ai.palette.head || ai.palette.body,
        isPlayer: false,
        isBoss: !!ai.isBoss
      });
    }
    rows.sort(function (a, b) { return b.len - a.len; });
    state.leaderboard = rows.slice(0, 5);
  }

  // -- Camera ----------------------------------------------------------------
  function updateCamera(dt) {
    var p = state.player;
    var targetX = p.x - VIEW_W / 2;
    var targetY = p.y - VIEW_H / 2;
    // Smooth lerp
    var k = Math.min(1, dt * 6);
    state.camX += (targetX - state.camX) * k;
    state.camY += (targetY - state.camY) * k;
    // Clamp camera within arena (keep view inside)
    if (state.camX < 0) state.camX = 0;
    if (state.camY < 0) state.camY = 0;
    if (state.camX > ARENA_W - VIEW_W) state.camX = ARENA_W - VIEW_W;
    if (state.camY > ARENA_H - VIEW_H) state.camY = ARENA_H - VIEW_H;
  }

  // -- Render ----------------------------------------------------------------
  function render() {
    var W = canvas.width, H = canvas.height;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(offsetX * dpr, offsetY * dpr);
    ctx.scale(scale * dpr, scale * dpr);
    ctx.translate(state.shake.x, state.shake.y);

    // World transform: shift by -cam
    ctx.save();
    ctx.translate(-state.camX, -state.camY);
    drawBackground();
    drawArenaBoundary();
    drawOrbs();
    drawScholarOrbs();
    drawPowerups();
    drawSnakes();
    drawParticles();
    ctx.restore();

    // HUD-anchored overlays drawn directly in view space:
    drawMinimap();
    drawBoostMeter();

    ctx.restore();
  }

  function drawBackground() {
    // Letterbox void inside the arena rect
    ctx.fillStyle = "#070b1a";
    ctx.fillRect(0, 0, ARENA_W, ARENA_H);
    // Soft radial glow at center
    var glow = ctx.createRadialGradient(ARENA_W / 2, ARENA_H / 2, 60, ARENA_W / 2, ARENA_H / 2, ARENA_W * 0.6);
    glow.addColorStop(0, "rgba(93,224,240,0.08)");
    glow.addColorStop(0.5, "rgba(20,40,80,0.10)");
    glow.addColorStop(1, "rgba(4,6,15,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, ARENA_W, ARENA_H);
    // Hex/grid overlay (fades at distance from camera center)
    drawGrid();
    // Decorative dots
    if (state.bgGrid && state.bgGrid.dots) {
      for (var i = 0; i < state.bgGrid.dots.length; i++) {
        var d = state.bgGrid.dots[i];
        var tw = reducedMotion ? 1 : (0.6 + 0.4 * Math.abs(Math.sin(state.time * 0.6 + d.twinkle)));
        ctx.fillStyle = "rgba(200,220,255," + (0.18 * tw) + ")";
        ctx.fillRect(d.x - d.r / 2, d.y - d.r / 2, d.r, d.r);
      }
    }
  }

  function drawGrid() {
    // Only draw within the visible camera area
    var step = 60;
    var startX = Math.floor(state.camX / step) * step;
    var startY = Math.floor(state.camY / step) * step;
    var endX = state.camX + VIEW_W + step;
    var endY = state.camY + VIEW_H + step;
    var camCx = state.camX + VIEW_W / 2;
    var camCy = state.camY + VIEW_H / 2;
    // baseline grid
    ctx.lineWidth = 1;
    for (var x = startX; x <= endX; x += step) {
      var dxc = Math.abs(x - camCx);
      var alpha = Math.max(0.04, 0.18 - dxc / (VIEW_W * 1.4));
      ctx.strokeStyle = "rgba(120,180,220," + alpha + ")";
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (var y = startY; y <= endY; y += step) {
      var dyc = Math.abs(y - camCy);
      var alphaY = Math.max(0.04, 0.18 - dyc / (VIEW_H * 1.4));
      ctx.strokeStyle = "rgba(120,180,220," + alphaY + ")";
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  function drawArenaBoundary() {
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(93,224,240,0.55)";
    if (!reducedMotion) {
      ctx.shadowColor = "rgba(93,224,240,0.6)";
      ctx.shadowBlur = 18;
    }
    ctx.strokeRect(0.5, 0.5, ARENA_W - 1, ARENA_H - 1);
    // inner soft pad
    ctx.strokeStyle = "rgba(169,145,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.strokeRect(ARENA_PAD, ARENA_PAD, ARENA_W - 2 * ARENA_PAD, ARENA_H - 2 * ARENA_PAD);
    ctx.restore();
  }

  function drawOrbs() {
    // Cull to camera + small margin
    var cx0 = state.camX - 30, cy0 = state.camY - 30;
    var cx1 = state.camX + VIEW_W + 30, cy1 = state.camY + VIEW_H + 30;
    for (var i = 0; i < state.orbs.length; i++) {
      var o = state.orbs[i];
      if (o.x < cx0 || o.x > cx1 || o.y < cy0 || o.y > cy1) continue;
      o.pulse += 0.06;
      drawOrb(o);
    }
  }
  function drawOrb(o) {
    var r = o.r;
    var pulse = reducedMotion ? 1 : (0.85 + 0.15 * Math.sin(o.pulse));
    var scaledR = r * pulse;
    if (!reducedMotion) {
      var glow = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, scaledR * 2.4);
      glow.addColorStop(0, o.isDead ? "rgba(255,200,120,0.55)" : "rgba(93,224,240,0.42)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(o.x, o.y, scaledR * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = o.isDead ? "#ffd2a3" : "#cefafd";
    ctx.beginPath();
    ctx.arc(o.x, o.y, scaledR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = o.isDead ? "#a14d10" : "#2ba0b6";
    ctx.beginPath();
    ctx.arc(o.x - scaledR * 0.3, o.y - scaledR * 0.3, scaledR * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawScholarOrbs() {
    for (var i = 0; i < state.scholarOrbs.length; i++) {
      var o = state.scholarOrbs[i];
      o.pulse += 0.05;
      o.rot += reducedMotion ? 0 : 0.04;
      var pulse = reducedMotion ? 1 : (0.85 + 0.15 * Math.sin(o.pulse));
      var r = o.r * pulse;
      // Outer halo
      if (!reducedMotion) {
        var glow = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r * 3.5);
        glow.addColorStop(0, "rgba(245,196,81,0.55)");
        glow.addColorStop(0.5, "rgba(245,196,81,0.18)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(o.x, o.y, r * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Body (white-gold core)
      var body = ctx.createRadialGradient(o.x - r * 0.3, o.y - r * 0.3, 1, o.x, o.y, r);
      body.addColorStop(0, "#fff8c4");
      body.addColorStop(0.7, "#f5c451");
      body.addColorStop(1, "#a8821c");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
      ctx.fill();
      // Gold rim
      ctx.strokeStyle = "#f5c451";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(o.x, o.y, r + 1, 0, Math.PI * 2);
      ctx.stroke();
      // Rotating "?" glyph
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      ctx.fillStyle = "#1a1208";
      ctx.font = "bold " + Math.floor(r * 1.35) + "px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", 0, 1);
      ctx.restore();
    }
  }

  function drawPowerups() {
    for (var i = 0; i < state.powerups.length; i++) {
      var pu = state.powerups[i];
      var meta = POWERUP_META[pu.type];
      var bob = reducedMotion ? 0 : Math.sin(pu.bob) * 4;
      var px = pu.x;
      var py = pu.y + bob;
      // halo
      if (!reducedMotion) {
        var glow = ctx.createRadialGradient(px, py, 0, px, py, pu.r * 2.4);
        glow.addColorStop(0, hexA(meta.glow, 0.55));
        glow.addColorStop(1, hexA(meta.glow, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, pu.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // disc
      ctx.fillStyle = "rgba(4,8,18,0.85)";
      ctx.beginPath();
      ctx.arc(px, py, pu.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = meta.glow;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(px, py, pu.r, 0, Math.PI * 2);
      ctx.stroke();
      // glyph
      ctx.fillStyle = meta.color;
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.glyph, px, py + 1);
      // expiry pulse if life < 4s
      if (pu.life < 4 && !reducedMotion) {
        ctx.strokeStyle = "rgba(255,255,255," + (0.35 + 0.4 * Math.sin(pu.life * 8)) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, pu.r + 4 + Math.sin(pu.life * 8) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawSnakes() {
    // Draw player last for emphasis
    var allSnakes = state.ais.concat([state.player]);
    for (var i = 0; i < allSnakes.length; i++) {
      var s = allSnakes[i];
      if (s.dead && s.deadT >= 1) continue;
      drawSnake(s);
    }
  }

  function drawSnake(s) {
    if (!s.segments || s.segments.length === 0) return;
    var drawSegments = getDrawableSegments(s);
    if (!drawSegments.length) return;
    var pal = s.palette;
    var alpha = s.dead ? Math.max(0, 1 - s.deadT) : 1;
    // Phase glow
    var phaseGlow = (s.phaseT > 0 && !reducedMotion);
    var boosting = s.boosting;
    // Outer glow trail (boosting only)
    if (boosting && !reducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.35 * alpha;
      ctx.strokeStyle = pal.headHi || "#fff";
      ctx.lineWidth = SEG_RADIUS * 2.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(drawSegments[0].x, drawSegments[0].y);
      for (var ig = 1; ig < Math.min(8, drawSegments.length); ig++) {
        ctx.lineTo(drawSegments[ig].x, drawSegments[ig].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Body — draw as a rounded path with gradient stripe
    ctx.save();
    if (phaseGlow) {
      ctx.shadowColor = "#5de0f0";
      ctx.shadowBlur = 16;
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = pal.bodyLo || "#1f8d68";
    ctx.lineWidth = SEG_RADIUS * 2.05;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(drawSegments[0].x, drawSegments[0].y);
    for (var i = 1; i < drawSegments.length; i++) {
      ctx.lineTo(drawSegments[i].x, drawSegments[i].y);
    }
    ctx.stroke();
    // inner body
    ctx.strokeStyle = pal.body || "#4dd49b";
    ctx.lineWidth = SEG_RADIUS * 1.6;
    ctx.beginPath();
    ctx.moveTo(drawSegments[0].x, drawSegments[0].y);
    for (var k = 1; k < drawSegments.length; k++) {
      ctx.lineTo(drawSegments[k].x, drawSegments[k].y);
    }
    ctx.stroke();
    // highlight stripe
    ctx.strokeStyle = pal.bodyHi || "#9ff0c8";
    ctx.lineWidth = SEG_RADIUS * 0.6;
    ctx.beginPath();
    ctx.moveTo(drawSegments[0].x, drawSegments[0].y);
    for (var m = 1; m < drawSegments.length; m++) {
      ctx.lineTo(drawSegments[m].x, drawSegments[m].y);
    }
    ctx.stroke();
    ctx.restore();

    // Segment scale bumps (every Nth)
    if (!reducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.55 * alpha;
      ctx.fillStyle = pal.bodyHi || "#9ff0c8";
      var bumpStep = 3;
      for (var b = 0; b < drawSegments.length; b += bumpStep) {
        var sg = drawSegments[b];
        ctx.beginPath();
        ctx.arc(sg.x, sg.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Head
    drawSnakeHead(s, alpha);

    // Name + length tag (only AIs + player when zoomed)
    if (!s.dead) {
      drawSnakeNameTag(s, alpha);
    }
  }

  function drawSnakeHead(s, alpha) {
    var pal = s.palette;
    var hx = s.x, hy = s.y;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(hx, hy);
    ctx.rotate(s.heading);
    // base disc
    var grad = ctx.createRadialGradient(-2, -3, 1, 0, 0, SEG_RADIUS + 4);
    grad.addColorStop(0, pal.headHi || "#fff");
    grad.addColorStop(0.6, pal.head || pal.body);
    grad.addColorStop(1, pal.bodyLo || "#1f8d68");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, SEG_RADIUS + 2, 0, Math.PI * 2);
    ctx.fill();
    // eyes (offset along heading)
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(3, -4, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, 4, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a0a20";
    ctx.beginPath();
    ctx.arc(4.2, -4, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4.2, 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // tongue if boosting
    if (s.boosting && !s.dead) {
      ctx.fillStyle = "#d04848";
      ctx.beginPath();
      ctx.moveTo(SEG_RADIUS + 2, 0);
      ctx.lineTo(SEG_RADIUS + 8, -1.6);
      ctx.lineTo(SEG_RADIUS + 10, 0);
      ctx.lineTo(SEG_RADIUS + 8, 1.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Magnet ring
    if (s.magnetT > 0 && !reducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.35 * alpha;
      ctx.strokeStyle = "#a991ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(hx, hy, MAGNET_RADIUS + Math.sin(state.time * 5) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Shield halo — bright cyan ring with pulsing inner glow
    if (s.shieldArmed && !reducedMotion) {
      ctx.save();
      var pulse = 0.7 + 0.3 * Math.sin(state.time * 5);
      ctx.globalAlpha = 0.85 * alpha;
      ctx.strokeStyle = "#bef5fb";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#5de0f0";
      ctx.shadowBlur = 18 * pulse;
      ctx.beginPath();
      ctx.arc(hx, hy, SEG_RADIUS + 6 + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();
      // Inner faint ring
      ctx.globalAlpha = 0.35 * alpha;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(hx, hy, SEG_RADIUS + 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Boss crown halo — pulsing gold ring around the head + crown name
    if (s.isBoss && !s.dead && !reducedMotion) {
      ctx.save();
      var bpulse = 0.6 + 0.4 * Math.sin(state.time * 3);
      ctx.globalAlpha = 0.7 * alpha;
      ctx.strokeStyle = "#ffd060";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ff8040";
      ctx.shadowBlur = 22 * bpulse;
      ctx.beginPath();
      ctx.arc(hx, hy, SEG_RADIUS + 16 + bpulse * 3, 0, Math.PI * 2);
      ctx.stroke();
      // Outer chase ring
      ctx.globalAlpha = 0.4 * alpha;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(hx, hy, SEG_RADIUS + 26 + bpulse * 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // 2x mass aura
    if (s.multCount > 0 && !reducedMotion) {
      ctx.save();
      ctx.globalAlpha = 0.4 * alpha;
      var rg = ctx.createRadialGradient(hx, hy, SEG_RADIUS, hx, hy, SEG_RADIUS + 14);
      rg.addColorStop(0, "rgba(245,196,81,0.5)");
      rg.addColorStop(1, "rgba(245,196,81,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(hx, hy, SEG_RADIUS + 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawSnakeNameTag(s, alpha) {
    if (s.isPlayer) return; // skip self-tag (player always centered)
    var hx = s.x, hy = s.y - SEG_RADIUS - 14;
    var label = s.name + " · " + s.segments.length;
    ctx.save();
    ctx.globalAlpha = 0.85 * alpha;
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var w = ctx.measureText(label).width + 10;
    ctx.fillStyle = "rgba(4,8,18,0.55)";
    ctx.fillRect(hx - w / 2, hy - 8, w, 14);
    ctx.fillStyle = s.palette.bodyHi || s.palette.body;
    ctx.fillText(label, hx, hy);
    ctx.restore();
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var a = Math.max(0, p.life / p.totalLife);
      ctx.fillStyle = hexA(p.color || "#fff", a);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  // Mini-map (top-right, view-space coords inside .scale)
  function drawMinimap() {
    var pad = 14;
    var size = 130;
    var x0 = VIEW_W - size - pad;
    var y0 = pad;
    ctx.save();
    ctx.fillStyle = "rgba(4,8,18,0.65)";
    ctx.strokeStyle = "rgba(93,224,240,0.35)";
    ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, size, size);
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, size - 1, size - 1);
    var sx = size / ARENA_W, sy = size / ARENA_H;
    // Camera viewport rect
    var cvx = x0 + state.camX * sx;
    var cvy = y0 + state.camY * sy;
    var cvw = VIEW_W * sx;
    var cvh = VIEW_H * sy;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.strokeRect(cvx, cvy, cvw, cvh);
    // AIs
    for (var i = 0; i < state.ais.length; i++) {
      var a = state.ais[i];
      if (a.dead) continue;
      ctx.fillStyle = a.palette.body;
      ctx.beginPath();
      ctx.arc(x0 + a.x * sx, y0 + a.y * sy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Player
    var p = state.player;
    if (!p.dead) {
      ctx.fillStyle = "#5de0f0";
      ctx.beginPath();
      ctx.arc(x0 + p.x * sx, y0 + p.y * sy, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Scholar orbs
    for (var k = 0; k < state.scholarOrbs.length; k++) {
      var so = state.scholarOrbs[k];
      ctx.fillStyle = "#f5c451";
      ctx.beginPath();
      ctx.arc(x0 + so.x * sx, y0 + so.y * sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBoostMeter() {
    var p = state.player;
    if (!p) return;
    var pad = 14;
    var w = 140, h = 8;
    var x0 = pad;
    var y0 = VIEW_H - pad - h;
    var lenFrac = Math.min(1, Math.max(0, (p.segments.length - MIN_LEN) / (GROWTH_METER_REFERENCE_LEN - MIN_LEN)));
    ctx.save();
    ctx.fillStyle = "rgba(4,8,18,0.6)";
    ctx.strokeStyle = "rgba(93,224,240,0.35)";
    ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
    // segment fill (cyan)
    ctx.fillStyle = p.boostReserveT > 0 ? "#f5c451" : "#5de0f0";
    ctx.fillRect(x0 + 1, y0 + 1, (w - 2) * lenFrac, h - 2);
    ctx.font = "bold 10px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#cefafd";
    var label = "LEN " + p.segments.length + (p.boostReserveT > 0 ? " · RESERVE " + p.boostReserveT.toFixed(1) + "s" : "");
    ctx.fillText(label, x0, y0 - 2);
    // active power-up timers
    var bits = [];
    if (p.phaseT > 0) bits.push("PHASE");
    if (p.magnetT > 0) bits.push("MAGNET " + p.magnetT.toFixed(1) + "s");
    if (p.multCount > 0) bits.push("2x x" + p.multCount);
    if (p.boostReserveT > 0) bits.push("BOOST RES");
    if (bits.length) {
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.fillStyle = "#dccaff";
      ctx.fillText(bits.join("  "), x0, y0 - 16);
    }
    ctx.restore();
  }

  // -- Color helpers ---------------------------------------------------------
  function hexA(hex, a) {
    if (!hex) return "rgba(255,255,255," + a + ")";
    if (hex.charAt(0) !== "#") return hex;
    var h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  // -- HUD update ------------------------------------------------------------
  function updateHud() {
    if (!state) return;
    if (dom.hudScore) dom.hudScore.textContent = formatNumber(state.score);
    if (dom.hudLives) dom.hudLives.textContent = String(state.lives);
    if (dom.hudLength) dom.hudLength.textContent = String(state.player ? state.player.segments.length : 0);
    if (dom.hudKills) dom.hudKills.textContent = String(state.kills);
    if (dom.hudBest) dom.hudBest.textContent = formatNumber(Math.max(state.best || 0, state.score));
    if (dom.goalName) {
      // rank by length
      var p = state.player;
      var sorted = state.ais.slice().concat([p]);
      sorted = sorted.filter(function (s) { return !s.dead; });
      sorted.sort(function (a, b) { return b.segments.length - a.segments.length; });
      var rank = sorted.indexOf(p) + 1;
      var total = sorted.length;
      dom.goalName.textContent = "Length " + (p ? p.segments.length : 0) + " · Rank " + rank + " of " + total;
    }
    if (dom.goalMeta) {
      var bits = [];
      var p2 = state.player;
      if (p2) {
        if (p2.boosting) bits.push(p2.boostReserveT > 0 ? "Reserve Boost " + p2.boostReserveT.toFixed(1) + "s" : "Boost");
        if (p2.phaseT > 0) bits.push("Phase ready");
        if (p2.magnetT > 0) bits.push("Magnet " + p2.magnetT.toFixed(1) + "s");
        if (p2.multCount > 0) bits.push("2x x" + p2.multCount);
        if (p2.shieldArmed) bits.push("◈ Shield");
        if (p2.comboTier > 0) bits.push("Combo ×" + currentComboMult());
      }
      if (state.currentKillStreak >= 2) bits.push("Streak x" + state.currentKillStreak);
      if (state.bossAlive) bits.push("⚠ Leviathan");
      if (bits.length === 0) bits.push("Powerups · 0 active");
      dom.goalMeta.textContent = bits.join(" · ");
    }
    // boost cell flash
    if (dom.hudLength && dom.hudLength.parentElement) {
      var cell = dom.hudLength.parentElement;
      cell.classList.toggle("is-boost", !!(state.player && state.player.boosting));
      cell.classList.toggle("is-warning", state.player && state.player.segments.length <= 8);
    }
    // Real-time leaderboard
    renderHudLeaderboard();
  }

  // Render the top-5 leaderboard panel from state.leaderboard.
  function renderHudLeaderboard() {
    var el = dom.hudLeader;
    if (!el || !state || !state.leaderboard) return;
    if (state.leaderboard.length === 0) { el.innerHTML = ""; return; }
    var html = '<div class="lb-title">Live Pit</div><ol class="lb-list">';
    for (var i = 0; i < state.leaderboard.length; i++) {
      var row = state.leaderboard[i];
      var cls = "lb-row";
      if (row.isPlayer) cls += " is-player";
      if (row.isBoss) cls += " is-boss";
      html += '<li class="' + cls + '">' +
        '<span class="lb-rank">' + (i + 1) + '</span>' +
        '<span class="lb-dot" style="background:' + row.color + '"></span>' +
        '<span class="lb-name">' + escapeHtml(row.name) + '</span>' +
        '<span class="lb-len">' + row.len + '</span>' +
      '</li>';
    }
    html += "</ol>";
    el.innerHTML = html;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatNumber(n) {
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // -- Scholar / review modal -----------------------------------------------
  var activeQuestion = null;
  var pendingScholarOrb = null;
  var questionSeen = [];
  var questionSeenSet = {};

  function pickQuestion() {
    // _MMRM_PATCHED_ — review-mix resurfaces wrong-answer queue
    try {
      var __mmrm = window.MrMacsReviewMix && window.MrMacsReviewMix.maybeDue();
      if (__mmrm) return __mmrm;
    } catch (e) {}

    // MRMAC_QUESTION_VALIDATOR_V1 — validate every candidate before returning
    var __mrmacIsValid = (typeof window !== "undefined" && window.MrMacsValidQuestion) || function () { return true; };
    var pool = SNAKE_PIT_REVIEW_BANK.slice();
    try {
      var bank = window.DIAG_BANK_BY_COURSE;
      if (bank && typeof bank === "object") {
        for (var c in bank) {
          if (Array.isArray(bank[c])) pool = pool.concat(bank[c]);
        }
      }
    } catch (e) {}
    pool = pool.concat(INLINE_BANK);
    var tries = Math.min(40, pool.length);
    for (var i = 0; i < tries; i++) {
      var q = pool[Math.floor(Math.random() * pool.length)];
      var norm = normalizeBankQuestion(q);
      if (!norm || !__mrmacIsValid(norm)) continue;
      var key = questionKey(norm);
      if (!questionSeenSet[key] || questionSeen.length > Math.max(80, Math.floor(pool.length * 0.7))) {
        markQuestionSeen(key);
        return norm;
      }
    }
    // Fallback: search the whole pool for ANY valid question before giving up.
    for (var fi = 0; fi < pool.length; fi++) {
      var fnorm = normalizeBankQuestion(pool[fi]);
      if (fnorm && __mrmacIsValid(fnorm)) {
        markQuestionSeen(questionKey(fnorm));
        return fnorm;
      }
    }
    // Absolute last resort — return an inline question (game stays playable).
    var fallback = normalizeBankQuestion(INLINE_BANK[Math.floor(Math.random() * INLINE_BANK.length)]) || INLINE_BANK[0];
    markQuestionSeen(questionKey(fallback));
    return fallback;
  }
  function normalizeBankQuestion(q) {
    if (!q) return null;
    if (q.prompt && q.choices && q.correctText) {
      return {
        prompt: q.prompt,
        choices: q.choices.slice ? q.choices.slice(0, 4) : q.choices,
        correctText: q.correctText,
        topic: q.topic,
        course: q.course
      };
    }
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
  function questionKey(q) {
    return String(q && (q.id || q.prompt || q.correctText) || "").slice(0, 180);
  }
  function markQuestionSeen(key) {
    if (!key) return;
    questionSeen.push(key);
    questionSeenSet[key] = true;
    while (questionSeen.length > 160) {
      var old = questionSeen.shift();
      delete questionSeenSet[old];
    }
  }

  function openScholarQuestion(orb) {
    sfx.eat_scholar();
    try {
      if (window.MrMacsCelebration && !reducedMotion) {
        window.MrMacsCelebration.burst({ count: 22, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
      }
    } catch (e) {}
    activeQuestion = pickQuestion();
    pendingScholarOrb = orb;
    if (dom.questionMeta) dom.questionMeta.textContent = "Scholar Orb · Optional · +1500 + 12 shards";
    if (dom.questionCloseBtn) dom.questionCloseBtn.textContent = "Skip";
    renderQuestion();
    prevPhase = phase;
    phase = "question";
    pauseMusic();
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
    for (var b = 0; b < btns.length; b++) btns[b].addEventListener("click", onChoiceClick);
  }

  function onChoiceClick(e) {
    var btn = e.currentTarget;
    var picked = btn.getAttribute("data-text");
    var correct = picked === activeQuestion.correctText;

    // _MMRM_GRADED_ — feed result to spaced-repetition Leitner system

    try { if (window.MrMacsReviewMix) window.MrMacsReviewMix.gradeIfResurfaced(activeQuestion, correct); } catch (e) {}
    var btns = dom.choiceGrid.querySelectorAll(".choice-btn");
    btns.forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute("data-text") === activeQuestion.correctText) b.classList.add("is-correct");
      else if (b === btn) b.classList.add("is-wrong");
    });
    if (correct) {
      dom.explanation.textContent = "Decoded! +1500 plus a shower of orbs in the pit.";
      dom.explanation.className = "explanation is-correct";
      state.questionsAnsweredCorrect++;
      sfx.scholar_correct();
    } else {
      dom.explanation.textContent = "Answer: " + activeQuestion.correctText;
      dom.explanation.className = "explanation is-wrong";
      sfx.scholar_wrong();
    }
    state.questionsAnsweredTotal++;
    trackTimeout(function () {
      // Skip if user already navigated away (e.g., restart/exit while modal open)
      if (phase !== "question" || activeQuestion == null) return;
      closeQuestion(correct);
    }, 1100);
  }

  function closeQuestion(wasCorrect) {
    if (wasCorrect) {
      state.score += 1500;
      addShards(12, GAME_ID + "-scholar-correct");
      try {
        if (window.MrMacsCelebration && !reducedMotion) {
          window.MrMacsCelebration.burst({ count: 28, palette: ["#f5c451", "#5de0f0", "#a991ff"] });
        }
      } catch (e) {}
      // shower 12 dead orbs near player (clamped to arena)
      var p = state.player;
      if (p) {
        for (var n = 0; n < 12; n++) {
          var ang = rand(0, Math.PI * 2);
          var dist = rand(60, 180);
          var pt = clampWorld(p.x + Math.cos(ang) * dist, p.y + Math.sin(ang) * dist);
          state.orbs.push(makeOrb({
            x: pt.x,
            y: pt.y,
            isDead: true,
            r: ORB_DEAD_RADIUS,
            pts: 75,
            growth: 1
          }));
        }
      }
      pushPopupScreen("+1500 SCHOLAR", VIEW_W / 2, 100, "is-bonus");
    }
    activeQuestion = null;
    pendingScholarOrb = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function skipQuestion() {
    activeQuestion = null;
    pendingScholarOrb = null;
    phase = prevPhase || "playing";
    prevPhase = null;
    showScreen(null);
    resumeMusic();
    updateHud();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // -- Game over -------------------------------------------------------------
  function gameOver() {
    if (phase === "ended") return;
    sfx.gameOver();
    addShake(8, 0.5);
    phase = "ended";
    var prevBest = readBest();
    if (state.score > prevBest) writeBest(state.score);
    saveSnapshot();
    trackTimeout(showEndScreen, 700);
  }

  function showEndScreen() {
    if (phase !== "ended") return;
    var shardsToAdd = Math.min(SHARDS_CAP - state.shardsAwarded, Math.floor(state.score / 250));
    if (shardsToAdd > 0) addShards(shardsToAdd);
    submitLeaderboard();
    if (dom.endKicker) dom.endKicker.textContent = state.lives <= 0 ? "Devoured by the Pit" : "Run Ended";
    if (dom.endTitle) dom.endTitle.textContent = "Snake Pit · Run complete";
    if (dom.endGrid) {
      dom.endGrid.innerHTML = [
        '<div class="end-cell"><div class="end-cell-label">Score</div><div class="end-cell-value">' + formatNumber(state.score) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Max Length</div><div class="end-cell-value">' + state.maxLength + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Snakes Killed</div><div class="end-cell-value">' + state.kills + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Top Streak</div><div class="end-cell-value">' + state.maxKillStreak + 'x</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Orbs Eaten</div><div class="end-cell-value">' + formatNumber(state.orbsEaten) + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Scholars Decoded</div><div class="end-cell-value">' + state.questionsAnsweredCorrect + '/' + state.questionsAnsweredTotal + '</div></div>',
        '<div class="end-cell"><div class="end-cell-label">Best</div><div class="end-cell-value">' + formatNumber(Math.max(state.best || 0, state.score)) + '</div></div>'
      ].join("");
    }
    if (dom.retryHint) dom.retryHint.textContent = "Shards earned: " + state.shardsAwarded + " (max " + SHARDS_CAP + " per run)";
    showScreen("end");
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.listAchievements) {
        var _ach = window.MrMacsProfile.listAchievements();
        var _startSet = {};
        (state.achievementsAtRunStart || []).forEach(function (id) { _startSet[id] = true; });
        var _newly = _ach.filter(function (a) { return a.unlocked && !_startSet[a.id]; });
        if (_newly.length > 0) {
          var _recapEl = document.getElementById("endRecap");
          if (!_recapEl) {
            _recapEl = document.createElement("div");
            _recapEl.id = "endRecap";
            _recapEl.className = "end-recap";
            var _endGrid = document.getElementById("endGrid");
            if (_endGrid && _endGrid.parentNode) { _endGrid.parentNode.insertBefore(_recapEl, _endGrid); }
          }
          _recapEl.innerHTML = '<h3 class="end-recap-title">🏆 Unlocked This Run</h3>' +
            '<ul class="end-recap-list">' +
            _newly.slice(0, 5).map(function (a) {
              return '<li class="end-recap-item" data-tier="' + ((a.def && a.def.tier) || "bronze") + '">' +
                '<span class="end-recap-icon">' + ((a.def && a.def.icon) || "🏆") + '</span>' +
                '<span class="end-recap-name">' + ((a.def && a.def.title) || a.id) + '</span>' +
                '</li>';
            }).join('') +
            '</ul>';
          _recapEl.hidden = false;
        }
      }
    } catch (e) {}
    stopMusic();
  }

  // -- Screens ---------------------------------------------------------------
  function showScreen(name) {
    [dom.setupScreen, dom.questionScreen, dom.pauseScreen, dom.endScreen].forEach(function (el) {
      if (el) el.classList.remove("show");
    });
    if (name === "setup") dom.setupScreen.classList.add("show");
    else if (name === "question") dom.questionScreen.classList.add("show");
    else if (name === "pause") dom.pauseScreen.classList.add("show");
    else if (name === "end") dom.endScreen.classList.add("show");
  }

  // -- Resize / scaling ------------------------------------------------------
  function resize() {
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    var sx = rect.width / VIEW_W;
    var sy = rect.height / VIEW_H;
    scale = Math.min(sx, sy);
    offsetX = (rect.width - VIEW_W * scale) / 2;
    offsetY = (rect.height - VIEW_H * scale) / 2;
  }

  // -- Hub integration -------------------------------------------------------
  function addShards(n, source) {
    if (n <= 0 || !state) return;
    var capped = Math.max(0, Math.min(n, SHARDS_CAP - state.shardsAwarded));
    if (capped <= 0) return;
    state.shardsAwarded += capped;
    try {
      if (window.MrMacsProfile && window.MrMacsProfile.addShards) {
        window.MrMacsProfile.addShards(capped, source || GAME_ID);
      }
    } catch (e) {}
  }
  function submitLeaderboard() {
    try {
      if (window.MrMacsLeaderboards && window.MrMacsLeaderboards.submit) {
        window.MrMacsLeaderboards.submit(GAME_ID, state.score, {
          length: state.maxLength,
          kills: state.kills,
          streak: state.maxKillStreak
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
          length: state.player ? state.player.segments.length : 0,
          kills: state.kills,
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
          id: GAME_ID,
          title: GAME_TITLE,
          course: "All Courses",
          file: "games/snake-pit/index.html"
        });
      }
    } catch (e) {}
  }
  function readBest() {
    try {
      var raw = window.localStorage && window.localStorage.getItem("snake-pit:best");
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) { return 0; }
  }
  function writeBest(v) {
    try {
      if (window.localStorage) window.localStorage.setItem("snake-pit:best", String(Math.floor(v)));
    } catch (e) {}
  }

  // -- Music -----------------------------------------------------------------
  function startMusic() {
    if (!soundOn) return;
    try {
      if (window.MrMacsArcadeMusic && window.MrMacsArcadeMusic.start) {
        window.MrMacsArcadeMusic.start("runner-synthwave", { volume: 0.5 });
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

  // -- Input -----------------------------------------------------------------
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if (phase === "playing") {
        if (k === "ArrowLeft" || k === "a" || k === "A") { keysHeld.left = true; e.preventDefault(); return; }
        if (k === "ArrowRight" || k === "d" || k === "D") { keysHeld.right = true; e.preventDefault(); return; }
        if (k === "ArrowUp" || k === "w" || k === "W") { keysHeld.up = true; e.preventDefault(); return; }
        if (k === "ArrowDown" || k === "s" || k === "S") { keysHeld.down = true; e.preventDefault(); return; }
        if (k === "Shift" || k === " ") {
          keysHeld.boost = true;
          e.preventDefault();
          return;
        }
        if (k === "p" || k === "P") {
          if (e.repeat) return;
          togglePause();
          e.preventDefault();
          return;
        }
      }
      if (phase === "paused" && (k === "p" || k === "P")) {
        togglePause();
        e.preventDefault();
        return;
      }
      if (k === "Escape" || k === "Esc") {
        if (phase === "playing" || phase === "paused") togglePause();
        else if (phase === "question") skipQuestion();
        e.preventDefault();
      }
    });
    document.addEventListener("keyup", function (e) {
      var k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") { keysHeld.left = false; }
      if (k === "ArrowRight" || k === "d" || k === "D") { keysHeld.right = false; }
      if (k === "ArrowUp" || k === "w" || k === "W") { keysHeld.up = false; }
      if (k === "ArrowDown" || k === "s" || k === "S") { keysHeld.down = false; }
      if (k === "Shift" || k === " ") { keysHeld.boost = false; }
    });
    canvas.addEventListener("mousemove", function (e) {
      hasMouse = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    canvas.addEventListener("mousedown", function (e) {
      if (phase !== "playing") return;
      if (e.button === 0) {
        keysHeld.boost = true;
      }
    });
    canvas.addEventListener("mouseup", function (e) {
      if (e.button === 0) keysHeld.boost = false;
    });
    canvas.addEventListener("mouseleave", function () {
      keysHeld.boost = false;
    });
    bindTouchControls();
  }

  function bindTouchControls() {
    if (!dom.tcStick) return;
    var stickRect = null;
    function onStart(e) {
      hasMouse = false;
      var rect = dom.tcStick.getBoundingClientRect();
      stickRect = rect;
      var t = e.touches ? e.touches[0] : e;
      onMove(e);
      e.preventDefault();
    }
    function onMove(e) {
      if (!stickRect) return;
      var t = e.touches ? e.touches[0] : e;
      if (!t) return;
      var cx = stickRect.left + stickRect.width / 2;
      var cy = stickRect.top + stickRect.height / 2;
      var dx = t.clientX - cx;
      var dy = t.clientY - cy;
      var maxR = stickRect.width / 2;
      var d = Math.sqrt(dx * dx + dy * dy);
      var nx = dx / Math.max(1, maxR);
      var ny = dy / Math.max(1, maxR);
      if (d > maxR) {
        nx = dx / d;
        ny = dy / d;
      } else {
        nx = dx / maxR;
        ny = dy / maxR;
      }
      touchSteer = { dx: nx, dy: ny };
      // Move knob
      var kx = nx * (maxR * 0.7);
      var ky = ny * (maxR * 0.7);
      if (dom.tcStickKnob) {
        dom.tcStickKnob.style.transform = "translate(" + kx + "px," + ky + "px)";
      }
      e.preventDefault();
    }
    function onEnd(e) {
      stickRect = null;
      touchSteer = null;
      if (dom.tcStickKnob) dom.tcStickKnob.style.transform = "translate(0px,0px)";
      if (e) e.preventDefault();
    }
    dom.tcStick.addEventListener("touchstart", onStart, { passive: false });
    dom.tcStick.addEventListener("touchmove", onMove, { passive: false });
    dom.tcStick.addEventListener("touchend", onEnd, { passive: false });
    dom.tcStick.addEventListener("touchcancel", onEnd, { passive: false });
    // mouse fallback for desktop touch sims
    dom.tcStick.addEventListener("mousedown", onStart);
    dom.tcStick.addEventListener("mousemove", function (e) { if (stickRect) onMove(e); });
    dom.tcStick.addEventListener("mouseup", onEnd);
    dom.tcStick.addEventListener("mouseleave", onEnd);
    // boost button
    if (dom.tcBoost) {
      var startBoost = function (e) { touchBoosting = true; if (e) e.preventDefault(); };
      var endBoost = function (e) { touchBoosting = false; if (e) e.preventDefault(); };
      dom.tcBoost.addEventListener("touchstart", startBoost, { passive: false });
      dom.tcBoost.addEventListener("touchend", endBoost, { passive: false });
      dom.tcBoost.addEventListener("touchcancel", endBoost, { passive: false });
      dom.tcBoost.addEventListener("mousedown", startBoost);
      dom.tcBoost.addEventListener("mouseup", endBoost);
      dom.tcBoost.addEventListener("mouseleave", endBoost);
    }
    // Tap-and-hold on canvas → boost (slither.io style)
    var canvasHoldTimer = null;
    canvas.addEventListener("touchstart", function (e) {
      if (phase !== "playing") return;
      // Don't override stick area
      if (e.target === dom.tcStick || e.target === dom.tcStickKnob || e.target === dom.tcBoost) return;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        // steer toward this point
        var sx = (t.clientX - rect.left - offsetX) / scale;
        var sy = (t.clientY - rect.top - offsetY) / scale;
        var dxv = sx - VIEW_W / 2;
        var dyv = sy - VIEW_H / 2;
        if (dxv * dxv + dyv * dyv > 16) {
          touchSteer = { dx: dxv, dy: dyv };
        }
        // boost on tap-hold
        canvasHoldTimer = setTimeout(function () { touchBoosting = true; }, 180);
      }
    }, { passive: true });
    canvas.addEventListener("touchmove", function (e) {
      if (phase !== "playing") return;
      if (e.target === dom.tcStick || e.target === dom.tcStickKnob || e.target === dom.tcBoost) return;
      if (e.touches && e.touches.length === 1) {
        var t = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        var sx = (t.clientX - rect.left - offsetX) / scale;
        var sy = (t.clientY - rect.top - offsetY) / scale;
        var dxv = sx - VIEW_W / 2;
        var dyv = sy - VIEW_H / 2;
        if (dxv * dxv + dyv * dyv > 16) {
          touchSteer = { dx: dxv, dy: dyv };
        }
      }
    }, { passive: true });
    canvas.addEventListener("touchend", function (e) {
      if (canvasHoldTimer) { clearTimeout(canvasHoldTimer); canvasHoldTimer = null; }
      touchBoosting = false;
      // don't kill steer immediately to keep last heading
    }, { passive: true });
    canvas.addEventListener("touchcancel", function (e) {
      if (canvasHoldTimer) { clearTimeout(canvasHoldTimer); canvasHoldTimer = null; }
      touchBoosting = false;
      touchSteer = null;
    }, { passive: true });
  }

  // -- Pause -----------------------------------------------------------------
  function togglePause() {
    if (phase === "playing") {
      prevPhase = "playing";
      phase = "paused";
      pauseMusic();
      saveSnapshot();
      showScreen("pause");
      renderPauseProgress();
    } else if (phase === "paused") {
      phase = "playing";
      showScreen(null);
      resumeMusic();
    }
  }

  // -- UI bindings -----------------------------------------------------------
  function bindUi() {
    dom.startBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.resumeBtn.addEventListener("click", togglePause);
    dom.restartBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.pauseExitBtn.addEventListener("click", exitToArcade);
    dom.exitBtn.addEventListener("click", exitToArcade);
    dom.pauseBtn.addEventListener("click", togglePause);
    dom.setupBtn.addEventListener("click", function () {
      clearSnapshot();
      phase = "setup";
      stopMusic();
      showScreen("setup");
      renderSetupExtras();
    });
    dom.againBtn.addEventListener("click", function () { clearSnapshot(); newRun(); });
    dom.questionCloseBtn.addEventListener("click", skipQuestion);
    dom.soundBtn.addEventListener("click", function () {
      soundOn = !soundOn;
      dom.soundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
      if (!soundOn) stopMusic();
      else if (phase === "playing") startMusic();
    });
    dom.fullscreenBtn.addEventListener("click", function () {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      } catch (e) {}
    });
    // Custom difficulty selector on the setup screen — local to snake-pit.
    // Persists selection to localStorage so it survives reloads. The Mr Mac's
    // shared MrMacsDifficulty system below registers the game but its own
    // selector is hidden via CSS (our buttons replace it for clarity).
    var savedDiff = "normal";
    try {
      var s = localStorage.getItem("snakePit.difficulty");
      if (s && DIFFICULTIES[s]) savedDiff = s;
    } catch (e) {}
    selectedDifficulty = savedDiff;
    function syncDiffButtons() {
      if (!dom.diffButtons) return;
      for (var i = 0; i < dom.diffButtons.length; i++) {
        var btn = dom.diffButtons[i];
        btn.classList.toggle("is-selected", btn.getAttribute("data-diff") === selectedDifficulty);
      }
    }
    syncDiffButtons();
    if (dom.diffButtons) {
      for (var bi = 0; bi < dom.diffButtons.length; bi++) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var d = btn.getAttribute("data-diff");
            if (!DIFFICULTIES[d]) return;
            selectedDifficulty = d;
            try { localStorage.setItem("snakePit.difficulty", d); } catch (e) {}
            syncDiffButtons();
          });
        })(dom.diffButtons[bi]);
      }
    }
  
  
  // ── Difficulty selector ────────────────────────────────────────
  try {
    if (window.MrMacsDifficulty) {
      MrMacsDifficulty.register("snake-pit");
      var _diffSetupCard = document.querySelector("#setupScreen .setup-card");
      if (_diffSetupCard) {
        var _diffHost = document.createElement("div");
        _diffHost.className = "difficulty-host";
        _diffHost.style.cssText = "margin: 12px 0 6px;";
        var _diffActions = _diffSetupCard.querySelector(".setup-actions");
        if (_diffActions) _diffSetupCard.insertBefore(_diffHost, _diffActions);
        else _diffSetupCard.appendChild(_diffHost);
        MrMacsDifficulty.mountSelector(_diffHost, "snake-pit", { compact: false });
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
  }

  function exitToArcade() {
    stopMusic();
    saveSnapshot();
    window.location.href = "../../index.html";
  }

  function newRun() {
    var _achAtStart = [];
    try {
      var _p = window.MrMacsProfile && window.MrMacsProfile.get();
      _achAtStart = _p && _p.achievements ? Object.keys(_p.achievements) : [];
    } catch (e) {}
    initState({ difficulty: selectedDifficulty });
    state.achievementsAtRunStart = _achAtStart;
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function resumeRun(snap) {
    var s = snap.state || {};
    initState({
      score: s.score || 0,
      kills: s.kills || 0,
      best: readBest(),
      difficulty: s.difficulty || selectedDifficulty
    });
    showScreen(null);
    phase = "playing";
    startMusic();
    updateHud();
    recordPlayWithProfile();
  }

  function renderSetupExtras() {
    var snap = loadSnapshot();
    if (snap && snap.state && (snap.state.score || snap.state.kills) && dom.resumeCard) {
      dom.resumeCard.hidden = false;
      dom.resumeCard.innerHTML =
        '<div class="resume-card-title">Resume in progress</div>' +
        '<div class="resume-card-meta">Score ' + formatNumber(snap.state.score || 0) +
        ' &middot; Length ' + (snap.state.length || 0) +
        ' &middot; Kills ' + (snap.state.kills || 0) + '</div>' +
        '<div class="resume-actions">' +
          '<button class="btn glass-pill" id="resumeRunBtn">Resume Run</button>' +
          '<button class="btn glass-pill" id="discardRunBtn">New Run</button>' +
        '</div>';
      var rb = $("resumeRunBtn");
      if (rb) rb.addEventListener("click", function () { resumeRun(snap); });
      var db = $("discardRunBtn");
      if (db) db.addEventListener("click", function () { clearSnapshot(); newRun(); });
    } else if (dom.resumeCard) {
      dom.resumeCard.hidden = true;
      dom.resumeCard.innerHTML = "";
    }
    if (dom.leaderboardPanel && window.MrMacsLeaderboards && window.MrMacsLeaderboards.top) {
      try {
        var top = window.MrMacsLeaderboards.top(GAME_ID, 5);
        if (top && top.length) {
          var html = '<div class="leaderboard-title">Top 5 Snake Pit Scores</div>';
          for (var r = 0; r < top.length; r++) {
            html += '<div class="leaderboard-row"><span class="lb-rank">' + (r + 1) + '</span>' +
              '<span class="lb-name">' + escapeHtml(top[r].name || "Unknown") + '</span>' +
              '<span class="lb-score">' + formatNumber(top[r].score) + '</span></div>';
          }
          dom.leaderboardPanel.hidden = false;
          dom.leaderboardPanel.innerHTML = html;
        } else {
          dom.leaderboardPanel.hidden = true;
        }
      } catch (e) {
        dom.leaderboardPanel.hidden = true;
      }
    }
  }

  // -- Main loop -------------------------------------------------------------
  function loop(ts) {
    if (!lastFrame) lastFrame = ts;
    var dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    if (state) {
      state.time += dt;
      if (phase === "playing") {
        if (ts - lastSnapshotTs > 10000) {
          saveSnapshot();
          lastSnapshotTs = ts;
        }
      }
    }
    if (phase === "playing") {
      updatePlayerInput(dt);
      var p = state.player;
      if (!p.dead) {
        if (p.burstStunT <= 0) {
          turnSnake(p, dt);
          moveSnake(p, dt);
        } else {
          // stunned: still move forward but no turn
          moveSnake(p, dt);
        }
        tryEatOrbs(p, dt);
        tryPickupPowerup(p);
        checkSnakeCollisions(p);
      }
      updateAis(dt);
      updatePowerups(dt);
      updateCamera(dt);
    }
    if (phase === "dying") {
      // animate dead bodies fading
      if (state) {
        for (var di = 0; di < state.ais.length; di++) {
          var a = state.ais[di];
          if (a.dead) a.deadT += dt * 1.3;
        }
        if (state.player && state.player.dead) state.player.deadT += dt * 1.3;
      }
    }
    if (state) {
      updateParticles(dt);
      updateShake(dt);
      if (phase === "playing") {
        tickCombo(dt);
        updateLeaderboard();
      }
    }
    if (state) render();
    if (state && (phase === "playing" || phase === "dying" || phase === "paused") && state.time - state.lastHudUpdate >= HUD_UPDATE_INTERVAL) {
      state.lastHudUpdate = state.time;
      updateHud();
    }
    rafHandle = requestAnimationFrame(loop);
  }

  // -- Boot ------------------------------------------------------------------
  function boot() {
    setupDom();
    initState({});
    resize();
    window.addEventListener("resize", resize, { passive: true });
    bindInput();
    bindUi();
    showScreen("setup");
    renderSetupExtras();
    rafHandle = requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("pagehide", function () {
    if (state && phase === "playing") saveSnapshot();
  });

  try {
    if (window.MrMacsA11yQuickToggle) {
      var hudControls = document.querySelector(".hud-controls") || document.querySelector(".top-hud");
      if (hudControls) MrMacsA11yQuickToggle.mount(hudControls);
    }
  } catch (e) {}

  // ── Help overlay ───────────────────────────────────────────────────────────
  try {
    if (window.MrMacsHelpOverlay) {
      MrMacsHelpOverlay.register("snake-pit", {
        title: "How to Play Snake Pit",
        goal: "Grow your luminous serpent by devouring energy orbs without crashing into another snake's body.",
        controls: [
          { key: "↑ / W", action: "Turn up" },
          { key: "↓ / S", action: "Turn down" },
          { key: "← / A", action: "Turn left" },
          { key: "→ / D", action: "Turn right" },
          { key: "Hold Boost (Shift / B)", action: "Surge ahead (costs one segment)" },
          { key: "Esc / P", action: "Pause" }
        ],
        tips: [
          "Crashing into your own body ends the run — give yourself room when turning near your tail.",
          "Boost costs one segment per half-second — use it to escape tight spots, not to chase orbs.",
          "Phase power-up lets you briefly pass through bodies; save it for desperate moments.",
          "2x Mass doubles your length instantly — great for score, but makes maneuvering harder.",
          "Magnet pulls orbs toward your head, reducing risky dives into crowded areas."
        ],
        scholar: "Scholar orbs shimmer gold in the pit. Eating one pauses the action and opens an optional review prompt worth +1500 points and 12 bonus shards."
      });
      var setupActions = document.querySelector("#setupScreen .setup-actions");
      if (setupActions) MrMacsHelpOverlay.mountButton(setupActions, "snake-pit");
    }
  } catch (e) {}

  })();


function renderPauseProgress() {
  try {
    if (!window.MrMacsProfile || !MrMacsProfile.listAchievements) return;
    var ach = MrMacsProfile.listAchievements();
    var GAME_ID_LOCAL = "snake-pit";
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
