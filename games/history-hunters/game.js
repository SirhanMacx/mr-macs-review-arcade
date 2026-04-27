(() => {
  "use strict";

  const STORAGE_KEY = "mr-macs-history-hunters-v1";
  const WORLD_W = 2600;
  const WORLD_H = 1600;
  const $ = (id) => document.getElementById(id);

  const els = {
    canvas: $("world"),
    level: $("level"),
    rosterCount: $("rosterCount"),
    shards: $("shards"),
    streak: $("streak"),
    courseFilter: $("courseFilter"),
    setFilter: $("setFilter"),
    huntBtn: $("huntBtn"),
    mapBtn: $("mapBtn"),
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
    startStats: $("startStats")
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

  const palettes = [
    ["#70f2ff", "#ffd66e", "#2f68ff"],
    ["#77f0af", "#fff0a8", "#168a6a"],
    ["#ff789d", "#ffd66e", "#7139ff"],
    ["#c9a0ff", "#70f2ff", "#362066"],
    ["#ffb15f", "#fff0a8", "#5f3318"],
    ["#8fb4ff", "#77f0af", "#172f75"]
  ];

  const typeData = {
    Civic: { color: "#70f2ff", strong: ["Conflict", "Reform"], weak: ["Economy"], flavor: "rules, rights, institutions" },
    Reform: { color: "#77f0af", strong: ["Civic", "Culture"], weak: ["Conflict"], flavor: "movements, rights, change" },
    Conflict: { color: "#ff789d", strong: ["Economy", "Geography"], weak: ["Civic"], flavor: "wars, revolutions, power struggles" },
    Economy: { color: "#ffd66e", strong: ["Geography", "Science"], weak: ["Reform"], flavor: "markets, scarcity, production" },
    Geography: { color: "#8fb4ff", strong: ["Culture", "Economy"], weak: ["Science"], flavor: "maps, migration, environment" },
    Ideas: { color: "#c9a0ff", strong: ["Civic", "Science"], weak: ["Culture"], flavor: "beliefs, philosophies, ideologies" },
    Science: { color: "#69f0d2", strong: ["Geography", "Psychology"], weak: ["Ideas"], flavor: "technology, research, innovation" },
    Culture: { color: "#ffb15f", strong: ["Ideas", "Psychology"], weak: ["Geography"], flavor: "society, art, identity" },
    Source: { color: "#fff0a8", strong: ["Ideas", "Civic"], weak: ["Conflict"], flavor: "documents, maps, cartoons, evidence" },
    Psychology: { color: "#f39cff", strong: ["Culture", "Reform"], weak: ["Source"], flavor: "behavior, cognition, learning" }
  };
  const typeOrder = Object.keys(typeData);
  const familyRows = [
    {
      type: "Civic",
      archetype: "Civic Guardian",
      names: ["Clause Cub", "Billwarden", "Constitution Sentinel"],
      line: "Built for rights, laws, institutions, courts, founding principles, and citizenship questions."
    },
    {
      type: "Reform",
      archetype: "Reform Speaker",
      names: ["Petition Sprite", "Rally Herald", "Movement Maestro"],
      line: "Grows stronger around change-makers, organizing, justice movements, and reform eras."
    },
    {
      type: "Conflict",
      archetype: "Strategy Marshal",
      names: ["Skirmish Scout", "Turning-Point Captain", "Treaty Titan"],
      line: "Handles revolutions, wars, diplomacy, imperialism, nationalism, and global power struggles."
    },
    {
      type: "Economy",
      archetype: "Market Tactician",
      names: ["Coin Clerk", "Trade Baron", "Policy Magnate"],
      line: "Tracks trade, scarcity, industrialization, taxes, markets, labor, and economic systems."
    },
    {
      type: "Geography",
      archetype: "Geo Navigator",
      names: ["Compass Kid", "Route Ranger", "Worldpath Admiral"],
      line: "Reads maps, migration, environments, human geography, regions, and spatial patterns."
    },
    {
      type: "Ideas",
      archetype: "Idea Keeper",
      names: ["Lightbulb Scribe", "Thesis Sage", "Philosophy Oracle"],
      line: "Connects beliefs, religions, ideologies, philosophies, revolutions in thought, and worldviews."
    },
    {
      type: "Science",
      archetype: "Innovation Builder",
      names: ["Gear Rookie", "Workshop Adept", "Invention Prime"],
      line: "Covers science, technology, inventions, industrial growth, medicine, and research breakthroughs."
    },
    {
      type: "Culture",
      archetype: "Culture Curator",
      names: ["Artifact Imp", "Museum Mystic", "Civilization Muse"],
      line: "Specializes in art, culture, social patterns, belief systems, identity, and civilization traits."
    },
    {
      type: "Source",
      archetype: "Source Archivist",
      names: ["Document Darter", "Evidence Sleuth", "Archive Luminary"],
      line: "Powers up from stimulus questions, documents, excerpts, maps, charts, images, and sourcing."
    },
    {
      type: "Psychology",
      archetype: "Mind Scholar",
      names: ["Neuron Note", "Cognition Crafter", "Mind Palace Sage"],
      line: "Built for AP Psychology: cognition, learning, development, memory, behavior, and research."
    }
  ];
  const familyByType = familyRows.reduce((acc, family, index) => {
    acc[family.type] = Object.assign({ row: index }, family);
    return acc;
  }, {});

  const fallbackMoves = [
    { name: "Primary Source Side-Eye", type: "Source", power: 25, flavor: "Uses evidence so hard the archive blinks first." },
    { name: "Context Clutch", type: "Ideas", power: 22, flavor: "Adds the missing background at the worst possible time." },
    { name: "Map Trap", type: "Geography", power: 20, flavor: "Weaponized location. Surprisingly legal." },
    { name: "Thesis Bonk", type: "Civic", power: 18, flavor: "A concise argument with unreasonable confidence." }
  ];

  const state = {
    bank: null,
    filtered: [],
    queue: [],
    nodes: [],
    selectedNode: null,
    running: false,
    encounterOpen: false,
    locked: false,
    currentQuestion: null,
    currentAlly: null,
    battle: null,
    capture: 0,
    trial: 0,
    player: { x: WORLD_W * .5, y: WORLD_H * .52, tx: WORLD_W * .5, ty: WORLD_H * .52, speed: 420 },
    camera: { x: 0, y: 0 },
    keys: {},
    particles: [],
    terrain: null,
    pulse: 0,
    last: 0,
    stats: readSave()
  };

  const sensitiveRe = /(holocaust|genocide|enslaved|enslavement|slavery|slave trade|massacre|terrorism|ethnic cleansing|aids|pandemic|famine|atrocit|segregation|apartheid)/i;
  const sourcePromptRe = /(\bthis\s+(amendment|document|letter|speech|excerpt|passage|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\bthese\s+(issues|documents|statements|headlines|conditions|changes|questions|figures)\b|\b(shown|pictured|illustrated|above|below|accompanying)\b|\bthe\s+(excerpt|letter|cartoon|map|chart|graph|image|photograph|photo|poster|source|timeline|painting|newspaper|headline)\b|\baccording\s+to\s+(the|this)\b|\bbased\s+on\s+(the|this)\b|similar\s+to\s+this)/i;

  function readSave() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return Object.assign({ rank: 1, shards: 0, streak: 0, bestStreak: 0, roster: [], missions: 0 }, saved);
    } catch {
      return { rank: 1, shards: 0, streak: 0, bestStreak: 0, roster: [], missions: 0 };
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

  function archetypeFor(q) {
    const blob = normalize([q.course, q.subject, q.set, q.category, q.prompt, q.answer, (q.tags || []).join(" ")].join(" "));
    if (/psych|cognition|brain|behavior|learning|personality/.test(blob)) return "Mind Scholar";
    if (/econom|market|supply|demand|money|trade|finance|price/.test(blob)) return "Market Strategist";
    if (/constitution|court|rights|amendment|law|government|civic|congress/.test(blob)) return "Civic Guardian";
    if (/war|revolution|conflict|cold war|imperialism|military/.test(blob)) return "Conflict Analyst";
    if (/migration|population|culture|geography|urban|agriculture/.test(blob)) return "Geo Navigator";
    if (/renaissance|reformation|enlightenment|philosoph|belief|religion/.test(blob)) return "Idea Keeper";
    if (/industrial|technology|innovation|development/.test(blob)) return "Innovation Builder";
    return "Chronicle Ally";
  }

  function typeFor(q) {
    const blob = normalize([q.course, q.subject, q.set, q.category, q.prompt, q.answer, (q.tags || []).join(" ")].join(" "));
    if (/source|document|excerpt|cartoon|map|graph|photograph|poster|passage|stimulus/.test(blob) || q.stimulusRequired) return "Source";
    if (/psych|cognition|brain|behavior|learning|personality|memory|development/.test(blob)) return "Psychology";
    if (/constitution|court|rights|amendment|law|government|civic|congress|federalism|election/.test(blob)) return "Civic";
    if (/reform|movement|suffrage|civil rights|abolition|labor|protest/.test(blob)) return "Reform";
    if (/war|revolution|conflict|cold war|military|imperialism|nationalism|totalitarian/.test(blob)) return "Conflict";
    if (/econom|market|supply|demand|money|trade|finance|price|scarcity|tariff|tax|gdp|inflation/.test(blob)) return "Economy";
    if (/geography|migration|population|urban|agriculture|environment|river|mountain|region|culture hearth/.test(blob)) return "Geography";
    if (/science|technology|industrial|innovation|research|invention|printing press|steam/.test(blob)) return "Science";
    if (/culture|religion|belief|renaissance|reformation|islam|hindu|buddh|christian|judaism|art|language/.test(blob)) return "Culture";
    return "Ideas";
  }

  function typeEffect(moveType, targetType) {
    const type = typeData[moveType] || typeData.Ideas;
    if ((type.strong || []).includes(targetType)) return 1.6;
    if ((type.weak || []).includes(targetType)) return .65;
    return 1;
  }

  function effectLabel(multiplier) {
    if (multiplier > 1.2) return "Super effective";
    if (multiplier < .8) return "Not very effective";
    return "Effective";
  }

  function move(name, type, power, flavor) {
    return { name, type, power, flavor };
  }

  function movesFor(q, archetype) {
    const blob = normalize([q.course, q.subject, q.set, q.category, q.prompt, q.answer, (q.tags || []).join(" ")].join(" "));
    const moves = [];
    if (/constitution|court|rights|amendment|law|government|civic|congress/.test(blob)) moves.push(move("Checks-and-Balances Bash", "Civic", 29, "No branch gets to act too smug."));
    if (/war|revolution|conflict|cold war|military|imperialism/.test(blob)) moves.push(move("Turning Point Tackle", "Conflict", 31, "A dramatic shift with a very serious hat."));
    if (/trade|market|econom|supply|demand|money|price|scarcity/.test(blob)) moves.push(move("Tariff Tickle", "Economy", 27, "It sounds harmless until prices change."));
    if (/psych|brain|behavior|learning|cognition|memory/.test(blob)) moves.push(move("Cognitive Combo", "Psychology", 28, "Hits twice if you remembered why."));
    if (/geography|migration|population|urban|agriculture|culture/.test(blob)) moves.push(move("Map Trap", "Geography", 26, "The x-axis had this coming."));
    if (/source|document|excerpt|cartoon|map|graph|photograph/.test(blob) || q.stimulusRequired) moves.push(move("Primary Source Side-Eye", "Source", 32, "The document gets read closely and feels judged."));
    if (/reform|rights|movement|suffrage|civil/.test(blob)) moves.push(move("Reform Rally", "Reform", 29, "Grassroots energy, now with extra clipboard."));
    if (/science|technology|industrial|innovation|research|invention/.test(blob)) moves.push(move("Innovation Spark", "Science", 27, "A new idea with suspiciously good timing."));
    if (/belief|religion|renaissance|reformation|philosoph|enlightenment|culture/.test(blob)) moves.push(move("Big Idea Beam", "Ideas", 28, "A thesis statement learned martial arts."));
    moves.push(move("Archive Pulse", "Source", 23, "Evidence, but make it dramatic."));
    moves.push(move(`${archetype} Flex`, typeFor(q), 24, "Historically grounded confidence."));
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
    const name = allyNameFor(q);
    const archetype = archetypeFor(q);
    const palette = paletteFor(name + (q.course || ""));
    const sensitive = isSensitive(q);
    const type = typeFor(q);
    const family = familyByType[type] || familyByType.Ideas;
    const stage = sensitive ? 0 : stageForAlly({ rarity: rarityFor(q) });
    return {
      id: compactKey((q.course || "") + "|" + (q.set || "") + "|" + name).slice(0, 80),
      name: sensitive ? "Archive Memory" : name,
      actualName: name,
      archetype,
      type,
      family: family.archetype,
      species: family.names[stage] || family.names[0],
      role: sensitive
        ? "A respect-first archive mission. Complete the review trial to preserve context and earn shards."
        : `${family.names[stage]} line: ${archetype} from ${cleanText(q.set || q.course || "the archive")}.`,
      course: q.course || "Social Studies",
      set: q.set || "Review",
      rarity: sensitive ? "Memory Mission" : rarityFor(q),
      moves: movesFor(q, archetype),
      palette,
      sensitive
    };
  }

  function spritePosition(ally) {
    const family = familyByType[(ally && ally.type) || "Ideas"] || familyByType.Ideas;
    const stage = stageForAlly(ally);
    const col = 1 + stage;
    const row = family.row;
    return {
      x: `${col * 33.333}%`,
      y: `${row * 11.111}%`
    };
  }

  function typeEffectOffset(type) {
    const index = Math.max(0, typeOrder.indexOf(type));
    return `${index * 11.111}%`;
  }

  function buildNodes() {
    const course = els.courseFilter.value;
    const items = course === "All Courses"
      ? state.bank.courses.slice()
      : (state.bank.setsByCourse[course] || []).slice();
    const count = Math.max(1, items.length);
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const ring = i % 2 ? 520 : 760;
      const angle = (Math.PI * 2 * i / count) - Math.PI / 2;
      const x = WORLD_W / 2 + Math.cos(angle) * ring + Math.sin(i * 1.7) * 90;
      const y = WORLD_H / 2 + Math.sin(angle) * ring * .62 + Math.cos(i * 1.1) * 70;
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
    els.activeRegion.textContent = label || "Open Archive";
    els.questText.textContent = `${state.filtered.length.toLocaleString()} prompts available. Move across the map, pick a region, and start hunts to recruit allies or complete archive missions.`;
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
    els.portrait.style.setProperty("--sprite-x", sprite.x);
    els.portrait.style.setProperty("--sprite-y", sprite.y);
    els.portraitMark.textContent = initials(ally.sensitive ? ally.actualName : ally.name);
    els.moves.innerHTML = ally.moves.map((move) => (
      `<div class="move-chip"><span>${escapeHtml(move.name)}</span><small>${escapeHtml(move.type)}</small></div>`
    )).join("");
  }

  function renderCodex() {
    els.codexFamilies.innerHTML = familyRows.map((family, row) => {
      const stages = family.names.map((name, stage) => {
        const sprite = {
          x: `${(stage + 1) * 33.333}%`,
          y: `${row * 11.111}%`
        };
        return `<div class="codex-stage">` +
          `<div class="codex-sprite" style="--sprite-x:${sprite.x};--sprite-y:${sprite.y}" role="img" aria-label="${escapeHtml(name)}"></div>` +
          `<em>${escapeHtml(name)}</em>` +
        `</div>`;
      }).join("");
      return `<article class="codex-family" style="--type:${escapeHtml((typeData[family.type] || typeData.Ideas).color)}">` +
        `<header><strong>${escapeHtml(family.type)} Type</strong><span>${escapeHtml(family.archetype)}</span></header>` +
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
        type: first.type || "Source",
        moves: first.moves && first.moves.length ? first.moves : fallbackMoves,
        palette: first.palette || paletteFor(first.name)
      };
    }
    return {
      name: "Field Researcher",
      type: "Source",
      moves: fallbackMoves,
      palette: palettes[0]
    };
  }

  function renderBattle() {
    const battle = state.battle || { heroHp: 100, enemyHp: 100 };
    const hero = heroAlly();
    const enemy = state.currentAlly || { name: "Archive Echo", type: "Ideas" };
    els.heroName.textContent = hero.name;
    els.heroType.textContent = hero.type;
    els.enemyName.textContent = enemy.name;
    els.enemyType.textContent = enemy.type || "Ideas";
    els.heroHp.style.width = `${clamp(battle.heroHp, 0, 100)}%`;
    els.enemyHp.style.width = `${clamp(battle.enemyHp, 0, 100)}%`;
  }

  function renderMoveButtons() {
    const hero = heroAlly();
    els.moveButtons.classList.remove("answering");
    els.moveButtons.innerHTML = hero.moves.map((item, index) => {
      const data = typeData[item.type] || typeData.Ideas;
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
    if (state.battle) state.battle.awaitingAnswer = true;
    els.moveButtons.classList.add("answering");
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
    if (innerHeight < 560) {
      setTimeout(() => els.questionText.scrollIntoView({ block: "center", inline: "nearest" }), 40);
    }
  }

  function clearQuestionArea(message) {
    state.currentQuestion = null;
    els.moveButtons.classList.remove("answering");
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
    state.queue = shuffle(pool);
    const q = nextQuestion();
    const ally = makeAlly(q);
    state.currentAlly = ally;
    state.currentQuestion = q;
    state.battle = { heroHp: 100, enemyHp: 100, pendingMove: null, awaitingAnswer: false };
    state.capture = 0;
    state.trial = 0;
    state.encounterOpen = true;
    renderAlly(ally);
    renderBattle();
    renderMoveButtons();
    els.encounter.hidden = false;
    els.encounter.classList.add("pulse");
    setTimeout(() => els.encounter.classList.remove("pulse"), 650);
    clearQuestionArea(ally.sensitive ? "Archive mission loaded. Pick a move and answer carefully to preserve context." : "Pick a move. Correct answers power attacks and build recruitment trust.");
    setBattleLog(`${ally.name} entered the field. Type: ${ally.type}. ${typeData[ally.type]?.flavor || "review energy"}.`);
  }

  function closeEncounter() {
    state.encounterOpen = false;
    state.locked = false;
    state.battle = null;
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
    const enemy = state.currentAlly || { type: "Ideas" };
    const multiplier = typeEffect(selected.type, enemy.type || "Ideas");
    setBattleLog(`${selected.name}. ${effectLabel(multiplier)} against ${enemy.type}. Answer to power it.`);
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
    const multiplier = typeEffect(moveUsed.type, ally.type || "Ideas");
    if (correct) {
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(state.stats.bestStreak || 0, state.stats.streak);
      const damage = Math.round((moveUsed.power || 22) * multiplier + Math.min(14, state.stats.streak * 2));
      battle.enemyHp = clamp(battle.enemyHp - damage, 0, 100);
      const gain = q.stimulusRequired ? 34 : 27;
      state.capture = clamp(state.capture + gain + Math.min(13, state.stats.streak) + (multiplier > 1 ? 8 : 0), 0, 100);
      state.stats.shards += 12 + Math.min(18, state.stats.streak * 2);
      state.pulse = 1;
      burst(state.player.x, state.player.y, ally.palette[0], 22);
      setBattleLog(`${moveUsed.name} landed for ${damage}. ${effectLabel(multiplier)}.`);
      setFeedback(`Correct. ${q.explanation || "That answer strengthens the bond."}`, "good");
    } else {
      state.stats.streak = 0;
      const counter = ally.sensitive ? 12 : 16 + Math.floor(Math.random() * 10);
      battle.heroHp = clamp(battle.heroHp - counter, 0, 100);
      state.capture = clamp(state.capture - 10, 0, 100);
      burst(state.player.x, state.player.y, "#ff789d", 12);
      setBattleLog(`${ally.name} countered for ${counter}. The archive demands receipts.`);
      setFeedback(`Not quite. Answer: ${expected}. ${q.explanation || ""}`, "bad");
    }
    battle.pendingMove = null;
    battle.awaitingAnswer = false;
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
      clearQuestionArea("Choose the next move. The answer will power it.");
      renderMoveButtons();
      setBattleLog(`${ally.name} is still in the field. Capture trust: ${state.capture}%.`);
    }, correct ? 1250 : 1900);
  }

  function retreatEncounter() {
    state.stats.streak = 0;
    writeSave();
    updateHud();
    setFeedback("Retreat. The roster regroups and keeps the study notes. Try another hunt.", "bad");
    setBattleLog("The field team needs a reset.");
    setTimeout(closeEncounter, 1500);
  }

  function completeEncounter() {
    const ally = state.currentAlly;
    if (!ally) return;
    if (ally.sensitive) {
      state.stats.missions += 1;
      state.stats.shards += 45;
      setFeedback(`Archive mission complete: ${ally.actualName}. Context preserved. +45 shards.`, "done");
    } else {
      const exists = state.stats.roster.some((item) => item.id === ally.id);
      if (!exists) {
        state.stats.roster.unshift({
          id: ally.id,
          name: ally.name,
          archetype: ally.archetype,
          type: ally.type,
          course: ally.course,
          set: ally.set,
          rarity: ally.rarity,
          moves: ally.moves,
          palette: ally.palette,
          level: 1
        });
        state.stats.roster = state.stats.roster.slice(0, 96);
        setFeedback(`${ally.name} joined your Chronicle team.`, "done");
      } else {
        const rosterAlly = state.stats.roster.find((item) => item.id === ally.id);
        if (rosterAlly) rosterAlly.level = Math.min(3, Number(rosterAlly.level || 1) + 1);
        state.stats.shards += 35;
        setFeedback(`${ally.name} bond strengthened. Evolution stage ${rosterAlly ? rosterAlly.level : 2}. +35 shards.`, "done");
      }
    }
    state.stats.rank = 1 + Math.floor((state.stats.roster.length + state.stats.missions) / 5);
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
      const family = familyByType[ally.type || "Ideas"] || familyByType.Ideas;
      const species = family.names[stageForAlly(ally)] || family.names[0];
      return `<div class="roster-item">` +
        `<div class="mini-portrait" style="--sprite-x:${escapeHtml(sprite.x)};--sprite-y:${escapeHtml(sprite.y)};--ally-a:${escapeHtml(palette[0])};--ally-b:${escapeHtml(palette[1])}" role="img" aria-label="${escapeHtml(species)}"></div>` +
        `<div><strong>${escapeHtml(ally.name)}</strong><span>${escapeHtml(ally.type || "Source")} type / ${escapeHtml(species)} / Stage ${escapeHtml(String(ally.level || 1))} / ${escapeHtml(ally.course)}</span></div>` +
        `<em>${escapeHtml(ally.rarity)}</em>` +
      `</div>`;
    }).join("");
  }

  function updateHud() {
    els.level.textContent = state.stats.rank || 1;
    els.rosterCount.textContent = (state.stats.roster || []).length;
    els.shards.textContent = state.stats.shards || 0;
    els.streak.textContent = state.stats.streak || 0;
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

  function initControls() {
    addEventListener("resize", resize);
    addEventListener("keydown", (event) => {
      state.keys[event.key.toLowerCase()] = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(event.key.toLowerCase())) event.preventDefault();
      if (event.key === " " && !state.encounterOpen) openEncounter();
    });
    addEventListener("keyup", (event) => {
      state.keys[event.key.toLowerCase()] = false;
    });
    els.canvas.addEventListener("pointerdown", (event) => {
      if (state.encounterOpen) return;
      const point = canvasPoint(event);
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
    });
    els.setFilter.addEventListener("change", applyFilters);
    els.huntBtn.addEventListener("click", openEncounter);
    els.mapBtn.addEventListener("click", () => {
      state.player.tx = WORLD_W / 2;
      state.player.ty = WORLD_H / 2;
    });
    els.rosterBtn.addEventListener("click", () => els.rosterPanel.classList.add("show"));
    els.closeRoster.addEventListener("click", () => els.rosterPanel.classList.remove("show"));
    els.codexBtn.addEventListener("click", () => els.codexPanel.classList.add("show"));
    els.closeCodex.addEventListener("click", () => els.codexPanel.classList.remove("show"));
    els.closeEncounter.addEventListener("click", closeEncounter);
    els.beginBtn.addEventListener("click", () => {
      state.running = true;
      els.startScreen.classList.add("hide");
    });
    els.typedForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAnswer(els.typedAnswer.value);
    });
  }

  function update(dt) {
    const p = state.player;
    let dx = 0;
    let dy = 0;
    if (state.keys.w || state.keys.arrowup) dy -= 1;
    if (state.keys.s || state.keys.arrowdown) dy += 1;
    if (state.keys.a || state.keys.arrowleft) dx -= 1;
    if (state.keys.d || state.keys.arrowright) dx += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      p.tx = p.x + dx / len * 80;
      p.ty = p.y + dy / len * 80;
    }
    const vx = p.tx - p.x;
    const vy = p.ty - p.y;
    const dist = Math.hypot(vx, vy);
    if (dist > 3 && !state.encounterOpen) {
      const step = Math.min(dist, p.speed * dt);
      p.x = clamp(p.x + vx / dist * step, 70, WORLD_W - 70);
      p.y = clamp(p.y + vy / dist * step, 70, WORLD_H - 70);
    }
    const near = nearestNode({ x: p.x, y: p.y });
    if (near && state.selectedNode !== near) {
      state.selectedNode = near;
      updateQuest();
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
        const edge = x < 140 || y < 120 || x > WORLD_W - 230 || y > WORLD_H - 180;
        const value = hash(`${x}|${y}|terrain`);
        const tile = edge && value % 4 === 0
          ? (value % 2 ? "waterA" : "waterB")
          : value % 7 === 0 ? "grassC" : value % 3 === 0 ? "grassB" : "grassA";
        drawAtlas(context, tile, x, y, TILE_SIZE, TILE_SIZE);
      }
    }
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
    strokeRoute(context, 58, GB.ink);
    strokeRoute(context, 46, "#d5ec65");
    strokeRoute(context, 30, "#b7d643");
    context.save();
    context.strokeStyle = "rgba(48,98,48,.42)";
    context.lineWidth = 4;
    context.setLineDash([18, 18]);
    strokeRoute(context, 4, "rgba(15,56,15,.44)");
    context.restore();
    drawAtlas(context, "gate", WORLD_W / 2 - 86, WORLD_H / 2 - 116, 172, 132);
  }

  function drawRetroLandmarks(context) {
    const trees = [
      [230, 270, "treeA"], [360, 1180, "treeB"], [2050, 300, "treeA"], [2300, 1260, "treeB"],
      [1160, 220, "treeA"], [1460, 1380, "treeB"], [980, 1260, "treeA"], [1840, 1320, "treeA"]
    ];
    trees.forEach(([x, y, key]) => drawAtlas(context, key, x, y, 116, 126));
    [[530, 450, "mountainA"], [1880, 560, "mountainB"], [2100, 1000, "mountainA"]]
      .forEach(([x, y, key]) => drawAtlas(context, key, x, y, 150, 126));
    drawAtlas(context, "school", 306, 682, 184, 138);
    drawAtlas(context, "portal", 2060, 716, 172, 136);
    drawAtlas(context, "chest", 588, 1210, 100, 98);
    drawAtlas(context, "arch", 1784, 1204, 150, 124);
    drawPixelBox(context, 1110, 630, 380, 92, "MR MACS REVIEW ARCADE", "START FIELD HUNT");
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
    const sprite = movingY > movingX && p.ty < p.y ? "playerBack" : movingX > 10 && p.tx > p.x ? "playerSideAlt" : movingX > 10 ? "playerSide" : "playerFront";
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
    renderCodex();
    await Promise.all([
      loadImage("retroTiles", "../../assets/history-hunters/retro-tile-sprite-atlas.png"),
      loadImage("retroSheet", "../../assets/history-hunters/retro-title-battle-sheet.png")
    ]);
    const response = await fetch("../../data/chrono-defense-bank.json", { cache: "no-store" });
    state.bank = await response.json();
    els.startStats.innerHTML = [
      `${state.bank.questions.length.toLocaleString()} prompts`,
      `${state.bank.courses.length} course lanes`,
      `${familyRows.length} evolution families`
    ].map((item) => `<span>${escapeHtml(item)}</span>`).join("");
    fillFilters();
    applyFilters();
    requestAnimationFrame(loop);
  }

  init().catch((error) => {
    console.error(error);
    els.questText.textContent = "The archive failed to load. Refresh the page and try again.";
  });
})();
