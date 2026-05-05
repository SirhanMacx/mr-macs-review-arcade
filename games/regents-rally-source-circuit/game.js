const CHARACTERS = [
  {
    id: "cleopatra",
    name: "Cleopatra VII",
    shortName: "Cleopatra",
    role: "Nile Diplomat",
    vehicle: "Nile Barge Kart",
    accent: "#66e9ff",
    body: "#1592b6",
    spriteIndex: 0,
    stats: { speed: 7, handling: 9, boost: 6, weight: 5 },
    perk: "Longer clue timer",
    bio: "Uses diplomacy, trade, and sharp handling to control tight turns."
  },
  {
    id: "mansa-musa",
    name: "Mansa Musa",
    shortName: "Mansa",
    role: "Mali Grand Tourer",
    vehicle: "Gold Caravan Kart",
    accent: "#ffd15c",
    body: "#c38a1d",
    spriteIndex: 1,
    stats: { speed: 9, handling: 5, boost: 7, weight: 9 },
    perk: "High top speed",
    bio: "A heavy kart built for straightaways, wealth routes, and late-race pressure."
  },
  {
    id: "harriet-tubman",
    name: "Harriet Tubman",
    shortName: "Tubman",
    role: "Freedom Sprinter",
    vehicle: "Lantern Rail Kart",
    accent: "#64f0aa",
    body: "#2aa365",
    spriteIndex: 2,
    stats: { speed: 6, handling: 8, boost: 10, weight: 4 },
    perk: "Longer boost chains",
    bio: "Fast recovery and powerful boosts make every item answer matter."
  },
  {
    id: "toussaint",
    name: "Toussaint Louverture",
    shortName: "Toussaint",
    role: "Revolution Racer",
    vehicle: "Liberty Banner Kart",
    accent: "#ff5f9f",
    body: "#bd3b85",
    spriteIndex: 3,
    stats: { speed: 8, handling: 7, boost: 7, weight: 6 },
    perk: "Faster recovery",
    bio: "Balanced speed and grip with quick spin recovery after rival hits."
  },
  {
    id: "genghis-khan",
    name: "Genghis Khan",
    shortName: "Genghis",
    role: "Steppe Speedster",
    vehicle: "Yam Courier",
    accent: "#ff8a3d",
    body: "#b95c26",
    spriteIndex: 4,
    stats: { speed: 10, handling: 4, boost: 7, weight: 8 },
    perk: "Strong straightaways",
    bio: "Huge speed on open lanes, but the kart demands clean drift timing."
  },
  {
    id: "joan-of-arc",
    name: "Joan of Arc",
    shortName: "Joan",
    role: "Rally Captain",
    vehicle: "Orleans Arrow",
    accent: "#b892ff",
    body: "#6747bd",
    spriteIndex: 5,
    stats: { speed: 7, handling: 7, boost: 9, weight: 5 },
    perk: "Quick drift sparks",
    bio: "Drift sparks charge faster, rewarding aggressive cornering."
  },
  {
    id: "abraham-lincoln",
    name: "Abraham Lincoln",
    shortName: "Lincoln",
    role: "Union Power Driver",
    vehicle: "Rail-Splitter Engine",
    accent: "#8fb4ff",
    body: "#435d9f",
    spriteIndex: 6,
    stats: { speed: 8, handling: 6, boost: 6, weight: 8 },
    perk: "Better bump recovery",
    bio: "A sturdy rail kart that shrugs off bumps and holds its line."
  },
  {
    id: "sacagawea",
    name: "Sacagawea",
    shortName: "Sacagawea",
    role: "Trail Navigator",
    vehicle: "Compass Trail",
    accent: "#7dffb2",
    body: "#327a54",
    spriteIndex: 7,
    stats: { speed: 6, handling: 10, boost: 6, weight: 4 },
    perk: "Sharpest handling",
    bio: "The best choice for tight curves, shortcuts, and precise item lanes."
  }
];

const TRACKS = [
  {
    id: "regents",
    title: "Regents Raceway",
    subtitle: "A grand prix course built for mixed Global and U.S. review concepts.",
    accent: "#66e9ff",
    theme: "regents",
    pool: "all",
    sprite: "0% 0%",
    laps: 3
  },
  {
    id: "liberty",
    title: "Liberty Loop",
    subtitle: "Civics city streets with presidents, amendments, reformers, and court cases.",
    accent: "#ffd15c",
    theme: "liberty",
    pool: "us",
    sprite: "100% 0%",
    laps: 3
  },
  {
    id: "silk",
    title: "Silk Road Speedway",
    subtitle: "Global history switchbacks through maps, empires, revolutions, and trade routes.",
    accent: "#64f0aa",
    theme: "global",
    pool: "global",
    sprite: "0% 100%",
    laps: 3
  },
  {
    id: "apex",
    title: "AP Apex Grand Prix",
    subtitle: "A neon AP review circuit across psych, APUSH, world, Euro, gov, econ, and geo.",
    accent: "#ff5f9f",
    theme: "ap",
    pool: "ap",
    sprite: "100% 100%",
    laps: 3
  }
];

const TRACK_LAYOUTS = {
  regents: {
    length: 6200,
    props: 240,
    items: [560, 1180, 1860, 2520, 3240, 3960, 4680, 5380],
    segments: [
      { len: 520, curve: 0, hill: 0, width: 1.05, surface: "asphalt", name: "Starting straight" },
      { len: 620, curve: -125, hill: 34, width: 0.98, surface: "cobble", name: "Archive bend" },
      { len: 760, curve: -210, hill: -18, width: 0.94, surface: "asphalt", name: "Document switchback" },
      { len: 520, curve: 42, hill: -36, width: 1.10, surface: "bridge", name: "Source bridge" },
      { len: 820, curve: 230, hill: 28, width: 0.9, surface: "asphalt", name: "Evidence esses" },
      { len: 680, curve: 80, hill: 58, width: 0.86, surface: "cobble", name: "Rubric climb" },
      { len: 760, curve: -175, hill: 8, width: 1.0, surface: "asphalt", name: "Conversion curve" },
      { len: 760, curve: 0, hill: -24, width: 1.12, surface: "asphalt", name: "Finish sprint" }
    ]
  },
  liberty: {
    length: 6000,
    props: 220,
    items: [500, 1100, 1680, 2380, 3060, 3740, 4520, 5260],
    segments: [
      { len: 560, curve: 0, hill: 0, width: 1.08, surface: "asphalt", name: "Federal plaza" },
      { len: 620, curve: 185, hill: 14, width: 0.95, surface: "cobble", name: "Amendment avenue" },
      { len: 540, curve: 245, hill: -28, width: 0.86, surface: "cobble", name: "Court hairpin" },
      { len: 760, curve: -135, hill: 18, width: 1.0, surface: "bridge", name: "Checks bridge" },
      { len: 720, curve: -235, hill: 42, width: 0.9, surface: "asphalt", name: "Reform row" },
      { len: 690, curve: 80, hill: -36, width: 1.05, surface: "asphalt", name: "New Deal descent" },
      { len: 640, curve: 210, hill: 24, width: 0.92, surface: "cobble", name: "Civil rights chicane" },
      { len: 470, curve: 0, hill: 0, width: 1.15, surface: "asphalt", name: "Union straight" }
    ]
  },
  silk: {
    length: 6400,
    props: 250,
    items: [620, 1260, 1940, 2720, 3480, 4260, 5020, 5740],
    segments: [
      { len: 680, curve: -35, hill: 20, width: 1.03, surface: "dirt", name: "Caravan straight" },
      { len: 760, curve: -235, hill: 62, width: 0.84, surface: "dirt", name: "Mountain pass" },
      { len: 620, curve: 40, hill: -42, width: 0.92, surface: "sand", name: "Oasis drop" },
      { len: 780, curve: 255, hill: 18, width: 0.88, surface: "sand", name: "Desert sweep" },
      { len: 680, curve: 120, hill: 46, width: 1.0, surface: "bridge", name: "Canal bridge" },
      { len: 820, curve: -210, hill: -12, width: 0.9, surface: "dirt", name: "Empire esses" },
      { len: 700, curve: 70, hill: 38, width: 0.98, surface: "asphalt", name: "Revolution rise" },
      { len: 360, curve: 0, hill: 0, width: 1.13, surface: "asphalt", name: "Market sprint" }
    ]
  },
  apex: {
    length: 6600,
    props: 210,
    items: [540, 1220, 1880, 2660, 3420, 4180, 4980, 5860],
    segments: [
      { len: 620, curve: 0, hill: 0, width: 1.02, surface: "asphalt", name: "Launch lab" },
      { len: 740, curve: 220, hill: 40, width: 0.86, surface: "neon", name: "FRQ corkscrew" },
      { len: 660, curve: -55, hill: -30, width: 1.08, surface: "ice", name: "Evidence tunnel" },
      { len: 820, curve: -265, hill: 52, width: 0.82, surface: "neon", name: "DBQ bend" },
      { len: 760, curve: 150, hill: -18, width: 0.96, surface: "asphalt", name: "Stimulus slalom" },
      { len: 820, curve: 275, hill: 30, width: 0.84, surface: "neon", name: "Concept esses" },
      { len: 760, curve: -125, hill: 48, width: 1.0, surface: "ice", name: "Score ramp" },
      { len: 420, curve: 0, hill: 0, width: 1.16, surface: "asphalt", name: "Apex sprint" }
    ]
  }
};

const SURFACES = {
  asphalt: { grip: 1, drag: 0, colors: ["#111a30", "#18213a"], edge: "#66e9ff" },
  cobble: { grip: 0.92, drag: 18, colors: ["#19253f", "#202d48"], edge: "#ffd15c" },
  bridge: { grip: 0.96, drag: 8, colors: ["#26314b", "#1b253c"], edge: "#f8fbff" },
  dirt: { grip: 0.86, drag: 38, colors: ["#2b2430", "#3a2b34"], edge: "#ff8a3d" },
  sand: { grip: 0.78, drag: 58, colors: ["#42372f", "#514031"], edge: "#ffd15c" },
  neon: { grip: 1.04, drag: 0, colors: ["#141433", "#1a1841"], edge: "#ff5f9f" },
  ice: { grip: 0.72, drag: 4, colors: ["#152c45", "#173c59"], edge: "#66e9ff" }
};

const ITEMS = [
  {
    id: "scroll",
    name: "Archive Boost",
    short: "Boost",
    spriteIndex: 0,
    color: "#66e9ff",
    coach: "Correct. Archive Boost launched."
  },
  {
    id: "rocket",
    name: "Compass Rocket",
    short: "Rocket",
    spriteIndex: 1,
    color: "#ffd15c",
    coach: "Correct. Compass Rocket hit the racer ahead."
  },
  {
    id: "shield",
    name: "Citation Shield",
    short: "Shield",
    spriteIndex: 2,
    color: "#64f0aa",
    coach: "Correct. Citation Shield is active."
  },
  {
    id: "burst",
    name: "Debate Burst",
    short: "Burst",
    spriteIndex: 3,
    color: "#ff5f9f",
    coach: "Correct. Debate Burst slowed the field."
  }
];

const DRIFT_LABELS = ["", "MINI-TURBO", "SUPER MINI-TURBO", "ULTRA MINI-TURBO"];
const DRIFT_COLORS = ["", "#f8fbff", "#ffd15c", "#66e9ff"];
// Drift tier thresholds (seconds of drift hold)
const DRIFT_THRESHOLDS = [0, 0.62, 1.45, 2.35];
// Boost amounts per tier
const DRIFT_BOOSTS = [0, 0.9, 1.7, 2.55];

const GP_POINTS = [15, 12, 10, 8, 6, 5, 4, 3]; // points by finishing position

const ENGINE_CLASS = {
  "50cc":   { speedMult: 0.72, rivalAggression: 0.60, label: "50cc"  },
  "100cc":  { speedMult: 1.00, rivalAggression: 1.00, label: "100cc" },
  "150cc":  { speedMult: 1.28, rivalAggression: 1.35, label: "150cc" },
  "mirror": { speedMult: 1.28, rivalAggression: 1.40, label: "Mirror", mirror: true }
};

// Question gate positions per lap (fraction of lap length)
const QUESTION_GATE_FRACS = [0.28, 0.72];

const RACECRAFT_EMPTY = () => ({
  perfectStart: false,
  nearMisses: 0,
  draftSeconds: 0,
  rouletteHits: 0,
  lineBonus: 0
});

/* ═══════════════════════════════════════════════
   WEB AUDIO ENGINE
═══════════════════════════════════════════════ */
let audioCtx = null;
let engineNode = null;
let engineGain = null;
let engineFilter = null;
let muted = false;

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Master gain
    const master = audioCtx.createGain();
    master.gain.value = 0.22;
    master.connect(audioCtx.destination);

    // Engine drone: sawtooth -> lowpass filter -> gain
    engineNode = audioCtx.createOscillator();
    engineNode.type = "sawtooth";
    engineNode.frequency.value = 80;
    engineFilter = audioCtx.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 600;
    engineFilter.Q.value = 1.4;
    engineGain = audioCtx.createGain();
    engineGain.gain.value = 0;
    engineNode.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(master);
    engineNode.start();

    audioCtx.__master = master;
  } catch (e) {
    audioCtx = null;
  }
}

function updateEngineAudio(speed, boost, drift) {
  if (!audioCtx || muted) { if (engineGain) engineGain.gain.value = 0; return; }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  const now = audioCtx.currentTime;
  const normalised = clamp(speed / 700, 0, 1);
  const baseFreq = 70 + normalised * 160 + (boost > 0 ? 45 : 0) + (drift ? 20 : 0);
  engineNode.frequency.setTargetAtTime(baseFreq, now, 0.08);
  engineFilter.frequency.setTargetAtTime(300 + normalised * 1800 + (boost > 0 ? 600 : 0), now, 0.08);
  engineGain.gain.setTargetAtTime(0.28 + normalised * 0.18, now, 0.06);
}

function playTone(freq, type, duration, gainVal, attack = 0.01, decay = 0.12) {
  if (!audioCtx || muted) return;
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + attack + decay + duration);
    osc.connect(gain);
    gain.connect(audioCtx.__master || audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + attack + decay + duration + 0.05);
  } catch (e) { /* ignore */ }
}

function playNoise(duration, gainVal, filterFreq = 800, attack = 0.01) {
  if (!audioCtx || muted) return;
  try {
    const bufferSize = Math.ceil(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const filt = audioCtx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = filterFreq;
    filt.Q.value = 2.2;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(audioCtx.__master || audioCtx.destination);
    src.start();
    src.stop(audioCtx.currentTime + duration + 0.05);
  } catch (e) { /* ignore */ }
}

function sfxDriftTierUp(tier) {
  if (!audioCtx || muted) return;
  const freqs = [0, 280, 420, 620];
  playTone(freqs[tier] || 280, "square", 0.06, 0.14, 0.01, 0.12);
  playNoise(0.08, 0.06, 300 + tier * 120);
}

function sfxMiniTurbo(tier) {
  if (!audioCtx || muted) return;
  const freqs = [0, 340, 480, 680];
  playTone(freqs[tier] || 340, "square", 0.18, 0.22, 0.005, 0.22);
  playTone((freqs[tier] || 340) * 1.5, "sawtooth", 0.12, 0.1, 0.01, 0.16);
}

function sfxItemRoll() {
  playTone(660, "square", 0.04, 0.08, 0.005, 0.04);
}

function sfxItemUse() {
  playTone(880, "square", 0.06, 0.18, 0.005, 0.1);
  playNoise(0.14, 0.1, 1200);
}

function sfxQuestionCorrect() {
  playTone(880, "square", 0.06, 0.2, 0.005, 0.08);
  playTone(1108, "sine", 0.1, 0.16, 0.01, 0.14);
}

function sfxQuestionWrong() {
  playTone(180, "sawtooth", 0.18, 0.16, 0.01, 0.2);
}

function sfxLapComplete() {
  [0, 0.08, 0.18, 0.30].forEach((delay, i) => {
    const f = [523, 659, 784, 1046][i];
    setTimeout(() => playTone(f, "square", 0.14, 0.18, 0.005, 0.2), delay * 1000);
  });
}

function sfxFinalLap() {
  [0, 0.1, 0.22].forEach((delay, i) => {
    const f = [784, 988, 1175][i];
    setTimeout(() => playTone(f, "sawtooth", 0.2, 0.22, 0.01, 0.28), delay * 1000);
  });
}

function sfxHit() {
  playNoise(0.12, 0.18, 200);
  playTone(120, "sawtooth", 0.14, 0.14, 0.005, 0.18);
}

function sfxSlipstream() {
  playNoise(0.1, 0.08, 1600);
  playTone(440, "sine", 0.1, 0.1, 0.01, 0.1);
}

function toggleMute() {
  muted = !muted;
  if (engineGain) engineGain.gain.value = muted ? 0 : 0;
  const btn = document.getElementById("muteBtn");
  if (btn) btn.textContent = muted ? "🔇" : "🔊";
}

/* ═══════════════════════════════════════════════
   PERSISTENCE (localStorage)
═══════════════════════════════════════════════ */
const STORAGE_KEY = "rr64_v2";

function loadStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function saveStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function getBestLap(trackId) {
  const d = loadStorage();
  return d.bestLaps?.[trackId] ?? null;
}

function setBestLap(trackId, seconds) {
  const d = loadStorage();
  if (!d.bestLaps) d.bestLaps = {};
  const prev = d.bestLaps[trackId];
  if (prev == null || seconds < prev) {
    d.bestLaps[trackId] = seconds;
    saveStorage(d);
    return true; // new record
  }
  return false;
}

function getGPCompletions() {
  return loadStorage().gpCompletions || 0;
}

function incGPCompletions() {
  const d = loadStorage();
  d.gpCompletions = (d.gpCompletions || 0) + 1;
  saveStorage(d);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2).padStart(5, "0");
  return `${m}:${s}`;
}

/* ═══════════════════════════════════════════════
   GRAND PRIX STATE
═══════════════════════════════════════════════ */
const gpState = {
  active: false,
  raceIndex: 0,
  tracks: [],
  standings: {} // characterId -> points
};

const POWERUP_CLUE_FALLBACKS = [
  { course: "Global", prompt: "Empire whose capital was Tenochtitlan.", answer: "Aztec Empire", explanation: "Tenochtitlan was the Aztec capital." },
  { course: "Global", prompt: "Trade route that linked China, Central Asia, and Europe.", answer: "Silk Road", explanation: "The Silk Road moved goods and ideas across Eurasia." },
  { course: "Global", prompt: "Belief system founded by Siddhartha Gautama.", answer: "Buddhism", explanation: "Siddhartha Gautama is the Buddha." },
  { course: "Global", prompt: "Islamic pilgrimage to Mecca.", answer: "hajj", explanation: "The hajj is one of the Five Pillars of Islam." },
  { course: "Global", prompt: "Mali ruler famous for his pilgrimage and wealth.", answer: "Mansa Musa", explanation: "Mansa Musa's hajj showed Mali's wealth." },
  { course: "Global", prompt: "Revolution that began in France in 1789.", answer: "French Revolution", explanation: "The French Revolution challenged absolute monarchy." },
  { course: "Global", prompt: "Policy of extending control over another region.", answer: "imperialism", explanation: "Imperialism is control over another people or territory." },
  { course: "Global", prompt: "Economic system based on private ownership and profit.", answer: "capitalism", explanation: "Capitalism relies on private enterprise." },
  { course: "Global", prompt: "Economic system where the state controls major resources.", answer: "communism", explanation: "Communism calls for collective or state control." },
  { course: "Global", prompt: "Cold War alliance led by the Soviet Union.", answer: "Warsaw Pact", explanation: "The Warsaw Pact was the Soviet-led military alliance." },
  { course: "Global", prompt: "Cold War alliance led by the United States.", answer: "NATO", explanation: "NATO united the U.S. and Western allies." },
  { course: "Global", prompt: "South African system of legal racial segregation.", answer: "apartheid", explanation: "Apartheid separated people by race in South Africa." },
  { course: "Global", prompt: "Indian independence leader who used nonviolence.", answer: "Mohandas Gandhi", explanation: "Gandhi used civil disobedience and nonviolence." },
  { course: "Global", prompt: "Chinese dynastic cycle idea based on heavenly approval.", answer: "Mandate of Heaven", explanation: "The mandate justified dynastic rule and rebellion." },
  { course: "Global", prompt: "Era that emphasized reason and natural rights.", answer: "Enlightenment", explanation: "Enlightenment thinkers argued for rights and reason." },
  { course: "Global", prompt: "Factory-based shift from hand labor to machines.", answer: "Industrial Revolution", explanation: "Industrialization transformed production and cities." },
  { course: "U.S.", prompt: "Document that declared independence in 1776.", answer: "Declaration of Independence", explanation: "The Declaration announced separation from Britain." },
  { course: "U.S.", prompt: "First ten amendments to the Constitution.", answer: "Bill of Rights", explanation: "The Bill of Rights protects individual liberties." },
  { course: "U.S.", prompt: "Principle that divides power among three branches.", answer: "separation of powers", explanation: "Separation of powers prevents one branch from dominating." },
  { course: "U.S.", prompt: "System where branches limit each other.", answer: "checks and balances", explanation: "Checks and balances restrain government power." },
  { course: "U.S.", prompt: "Supreme Court case that created judicial review.", answer: "Marbury v. Madison", explanation: "Marbury v. Madison established judicial review." },
  { course: "U.S.", prompt: "Movement to end slavery.", answer: "abolitionism", explanation: "Abolitionists worked to end slavery." },
  { course: "U.S.", prompt: "Network used to help enslaved people escape.", answer: "Underground Railroad", explanation: "The Underground Railroad helped people reach freedom." },
  { course: "U.S.", prompt: "President who issued the Emancipation Proclamation.", answer: "Abraham Lincoln", explanation: "Lincoln issued it during the Civil War." },
  { course: "U.S.", prompt: "Era after the Civil War focused on rebuilding the South.", answer: "Reconstruction", explanation: "Reconstruction tried to rebuild and redefine citizenship." },
  { course: "U.S.", prompt: "Amendment that ended slavery.", answer: "13th Amendment", explanation: "The 13th Amendment abolished slavery." },
  { course: "U.S.", prompt: "Amendment that guarantees equal protection.", answer: "14th Amendment", explanation: "The 14th Amendment protects citizenship and equality." },
  { course: "U.S.", prompt: "Amendment that protected Black male voting rights.", answer: "15th Amendment", explanation: "The 15th Amendment barred race-based voting denial." },
  { course: "U.S.", prompt: "Reform movement against alcohol.", answer: "temperance movement", explanation: "Temperance reformers pushed to reduce or ban alcohol." },
  { course: "U.S.", prompt: "1920s era of Black cultural achievement.", answer: "Harlem Renaissance", explanation: "The Harlem Renaissance centered Black art and literature." },
  { course: "U.S.", prompt: "New Deal program that created retirement benefits.", answer: "Social Security", explanation: "Social Security began during the New Deal." },
  { course: "U.S.", prompt: "Cold War policy to stop communism from spreading.", answer: "containment", explanation: "Containment guided U.S. Cold War strategy." },
  { course: "U.S.", prompt: "1954 school segregation case.", answer: "Brown v. Board of Education", explanation: "Brown ruled school segregation unconstitutional." },
  { course: "U.S.", prompt: "Law that banned segregation in public places.", answer: "Civil Rights Act of 1964", explanation: "The act outlawed major forms of discrimination." },
  { course: "U.S.", prompt: "Law that protected voting after Selma.", answer: "Voting Rights Act of 1965", explanation: "The act targeted barriers to voting." },
  { course: "AP", prompt: "APUSH term for Jackson-era expansion of voting by white men.", answer: "Jacksonian democracy", explanation: "Jacksonian democracy widened white male suffrage." },
  { course: "AP", prompt: "AP Gov principle that power comes from the people.", answer: "popular sovereignty", explanation: "Popular sovereignty means the people are the source of power." },
  { course: "AP", prompt: "AP Psych memory loss for events before trauma.", answer: "retrograde amnesia", explanation: "Retrograde amnesia affects older memories." },
  { course: "AP", prompt: "AP Macro measure of total output in an economy.", answer: "GDP", explanation: "GDP measures goods and services produced." },
  { course: "AP", prompt: "AP Human Geo spread of ideas through contact.", answer: "contagious diffusion", explanation: "Contagious diffusion spreads person to person." },
  { course: "AP", prompt: "AP World empire that used devshirme and janissaries.", answer: "Ottoman Empire", explanation: "The Ottomans used devshirme to staff elite service." },
  { course: "AP", prompt: "AP Euro treaty that ended the Thirty Years' War.", answer: "Peace of Westphalia", explanation: "Westphalia ended the Thirty Years' War in 1648." },
  { course: "AP", prompt: "AP Econ market structure with one seller.", answer: "monopoly", explanation: "A monopoly has a single seller." }
];

const els = {
  characterGrid: document.querySelector("#characterGrid"),
  trackGrid: document.querySelector("#trackGrid"),
  driverPreview: document.querySelector("#driverPreview"),
  chooseDriverBtn: document.querySelector("#chooseDriverBtn"),
  characterScreen: document.querySelector("#characterScreen"),
  trackScreen: document.querySelector("#trackScreen"),
  raceScreen: document.querySelector("#raceScreen"),
  resultsScreen: document.querySelector("#resultsScreen"),
  topStats: document.querySelector("#topStats"),
  canvas: document.querySelector("#raceCanvas"),
  hudRacer: document.querySelector("#hudRacer"),
  hudLap: document.querySelector("#hudLap"),
  hudPlace: document.querySelector("#hudPlace"),
  hudScore: document.querySelector("#hudScore"),
  hudItem: document.querySelector("#hudItem"),
  itemThumb: document.querySelector("#itemThumb"),
  itemBtn: document.querySelector("#itemBtn"),
  speedBar: document.querySelector("#speedBar"),
  speedNum: document.querySelector("#speedNum"),
  boostBar: document.querySelector("#boostBar"),
  questionCard: document.querySelector("#questionCard"),
  questionMeta: document.querySelector("#questionMeta"),
  questionText: document.querySelector("#questionText"),
  timerBar: document.querySelector("#timerBar"),
  feedback: document.querySelector("#feedback"),
  answerDock: document.querySelector("#answerDock"),
  skipBtn: document.querySelector("#skipBtn"),
  pauseBtn: document.querySelector("#pauseBtn"),
  muteBtn: document.querySelector("#muteBtn"),
  quitBtn: document.querySelector("#quitBtn"),
  resultTitle: document.querySelector("#resultTitle"),
  resultKicker: document.querySelector("#resultKicker"),
  resultGrid: document.querySelector("#resultGrid"),
  bestLapBanner: document.querySelector("#bestLapBanner"),
  coachText: document.querySelector("#coachText"),
  againBtn: document.querySelector("#againBtn"),
  backToCharacters: document.querySelector("#backToCharacters"),
  placeDelta: document.querySelector("#placeDelta"),
  lapTimesList: document.querySelector("#lapTimesList"),
  gpStandingsWrap: document.querySelector("#gpStandingsWrap"),
  gpStandings: document.querySelector("#gpStandings"),
  enginePills: document.querySelector("#enginePills"),
  formatPills: document.querySelector("#formatPills")
};

const ctx = els.canvas.getContext("2d");
const keys = new Set();
let drivePointerId = null;
const params = new URLSearchParams(location.search);
const perfLite = params.get("perf") === "lite" || params.get("fx") === "lite" || matchMedia("(pointer: coarse)").matches || innerWidth < 760;
const TRACK_LENGTH = 5400;
const VISIBLE_RANGE = 1150;
const COUNTDOWN_SECONDS = 3.15;

// Engine class + format (set by UI pills)
let engineClass = "100cc";
let raceFormat = "single";

function keySpriteSheet(image, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const spriteCtx = canvas.getContext("2d", { willReadFrequently: true });
  if (!spriteCtx) return null;
  spriteCtx.drawImage(image, 0, 0);
  const frame = spriteCtx.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const blueBias = b - Math.max(r, g);
    const navyBackdrop = b > 30 && r < 64 && g < 78 && blueBias > (options.soft ? 4 : 8);
    const purpleBackdrop = b > 38 && r < 78 && g < 62 && b > r + 5 && b > g + 8;
    if (navyBackdrop || purpleBackdrop) {
      data[index + 3] = 0;
    }
  }
  spriteCtx.putImageData(frame, 0, 0);
  return canvas;
}

function loadAsset(src, options = {}) {
  const image = new Image();
  if (options.keyBackdrop) {
    image.addEventListener("load", () => {
      image.keyed = keySpriteSheet(image, options);
    }, { once: true });
  }
  image.src = src;
  return image;
}

const ASSETS = {
  keyArt: loadAsset("rally-64-key-art-v2.webp"),
  racers: loadAsset("rally-64-racers-v2.webp", { keyBackdrop: true, soft: true }),
  gameplayKarts: loadAsset("rally-64-gameplay-karts-v2.webp", { keyBackdrop: true }),
  tracks: loadAsset("rally-64-tracks.webp"),
  items: loadAsset("rally-items-v2.webp", { keyBackdrop: true, soft: true }),
  itemCubes: loadAsset("../../assets/regents-rally/generated/rally-item-cubes.webp", { keyBackdrop: true, soft: true }),
  driftSparks: loadAsset("../../assets/regents-rally/generated/rally-drift-sparks.webp", { keyBackdrop: true, soft: true }),
  turboFlames: loadAsset("../../assets/regents-rally/generated/rally-turbo-flames.webp", { keyBackdrop: true, soft: true }),
  speedPads: loadAsset("../../assets/regents-rally/generated/rally-speed-pads.webp", { keyBackdrop: true, soft: true }),
  lowpolyKarts: loadAsset("../../assets/regents-rally/generated/rally-lowpoly-karts.webp", { keyBackdrop: true, soft: true })
};
const spriteBoundsCache = new WeakMap();

function trackLayout(track = state?.track || TRACKS[0]) {
  return TRACK_LAYOUTS[track.theme] || TRACK_LAYOUTS.regents;
}

function trackLength(track = state?.track || TRACKS[0]) {
  return Number(trackLayout(track).length || TRACK_LENGTH);
}

function raceDistance() {
  return trackLength() * state.track.laps;
}

function layoutSegments(layout = trackLayout()) {
  if (layout._computedSegments) return layout._computedSegments;
  const raw = layout.segments || TRACK_LAYOUTS.regents.segments;
  const rawLength = raw.reduce((sum, segment) => sum + Number(segment.len || 0), 0) || layout.length || TRACK_LENGTH;
  let start = 0;
  layout._computedSegments = raw.map((segment, index) => {
    const span = (Number(segment.len || 1) / rawLength) * trackLength({ theme: Object.keys(TRACK_LAYOUTS).find((key) => TRACK_LAYOUTS[key] === layout) || "regents" });
    const entry = { segment, index, start, end: start + span };
    start += span;
    return entry;
  });
  const scale = Number(layout.length || TRACK_LENGTH) / Math.max(start, 1);
  layout._computedSegments.forEach((entry) => {
    entry.start *= scale;
    entry.end *= scale;
  });
  return layout._computedSegments;
}

function smoothStep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function trackLocalDistance(distance) {
  const length = trackLength();
  return ((distance % length) + length) % length;
}

function trackSample(distance) {
  const layout = trackLayout();
  const local = trackLocalDistance(distance);
  const entries = layoutSegments(layout);
  const entry = entries.find((candidate) => local >= candidate.start && local < candidate.end) || entries[entries.length - 1];
  const next = entries[(entry.index + 1) % entries.length] || entry;
  const span = Math.max(1, entry.end - entry.start);
  const t = smoothStep((local - entry.start) / span);
  const seg = entry.segment;
  const nextSeg = next.segment || seg;
  const lapPct = local / trackLength();
  const micro = Math.sin(lapPct * Math.PI * 10 + trackPhase()) * 14 + Math.sin(distance * 0.006 + trackPhase() * 1.8) * 7;
  return {
    curve: lerp(Number(seg.curve || 0), Number(nextSeg.curve || 0), t) + micro,
    hill: lerp(Number(seg.hill || 0), Number(nextSeg.hill || 0), t) + Math.sin(lapPct * Math.PI * 8 + trackPhase()) * 9,
    width: lerp(Number(seg.width || 1), Number(nextSeg.width || 1), t),
    surface: seg.surface || "asphalt",
    name: seg.name || "track"
  };
}

function surfaceAt(distance) {
  return SURFACES[trackSample(distance).surface] || SURFACES.asphalt;
}

const state = {
  banks: null,
  character: CHARACTERS[0],
  track: TRACKS[0],
  pool: [],
  cursor: 0,
  current: null,
  running: false,
  paused: false,
  quizOpen: false,
  resolved: false,
  distance: 0,
  speed: 0,
  lane: 0,
  laneVel: 0,
  yaw: 0,
  gripSlip: 0,
  driftTier: 0,
  driftCharge: 0,
  drifting: false,
  boost: 0,
  boostMeter: 0,          // 0-1 visual boost meter
  shield: 0,
  spin: 0,
  bump: 0,
  hop: 0,
  trickBoost: 0,          // air-trick boost on landing
  skipPenalty: 0,         // handling penalty after skipping question
  slipPenalty: 0,         // handling pen from wrong answer
  countdown: 0,
  raceReleased: false,
  finishPulse: 0,
  hitFlash: 0,
  cameraShake: 0,
  skid: 0,
  item: null,
  itemRoulette: null,
  draft: 0,
  draftBoost: 0,
  nearMissCooldown: 0,
  racecraft: RACECRAFT_EMPTY(),
  itemBoxes: [],
  questionGates: [],      // question pad positions
  questionGateHit: new Set(), // indices already triggered this lap
  rivals: [],
  particles: [],
  roadBursts: [],
  sparkParticles: [],     // drift spark particles on canvas
  score: 0,
  correct: 0,
  attempts: 0,
  streak: 0,
  maxStreak: 0,
  place: CHARACTERS.length,
  prevPlace: CHARACTERS.length,
  lap: 1,
  lapStartTime: 0,
  lapTimes: [],
  lapBest: null,
  selected: 0,
  answerSeconds: 16,
  deadline: 0,
  finishTime: 0,
  startedAt: 0,
  lastFrame: 0,
  toast: "",
  toastTime: 0,
  positionBanner: "",
  positionBannerTime: 0,
  positionBannerGained: true,
  finalLapFlash: false,
  fov: 1,                 // fish-eye at high speed
  offroad: 0,             // current offroad dust amount
  touch: { steer: 0, gas: false, brake: false, drift: false, jump: false },
  dpr: 1
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffle(values) {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function colorAlpha(hex, alpha) {
  const value = String(hex || "#ffffff").replace("#", "");
  const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value.padEnd(6, "f").slice(0, 6);
  const number = Number.parseInt(full, 16);
  if (!Number.isFinite(number)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${alpha})`;
}

function frameEase(rate, dt) {
  return 1 - Math.exp(-rate * dt);
}

function ordinal(value) {
  const suffix = value === 1 ? "st" : value === 2 ? "nd" : value === 3 ? "rd" : "th";
  return `${value}${suffix}`;
}

function cleanPrompt(prompt) {
  return String(prompt || "Choose the best answer.")
    .replace(/^Final wager:\s*/i, "")
    .replace(/^Final clue for ([^:]+):\s*/i, "");
}

function showScreen(screen) {
  [els.characterScreen, els.trackScreen, els.raceScreen, els.resultsScreen].forEach((el) => el.classList.remove("active"));
  screen.classList.add("active");
  scrollTo({ top: 0, behavior: "auto" });
}

function setToast(text, seconds = 1.5) {
  state.toast = text;
  state.toastTime = seconds;
}

function spritePosition(index, columns = 4, rows = 2) {
  const col = index % columns;
  const row = Math.floor(index / columns) % rows;
  const x = columns === 1 ? 0 : (col / (columns - 1)) * 100;
  const y = rows === 1 ? 0 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
}

function renderDriverPreview() {
  const racer = state.character;
  els.driverPreview.style.setProperty("--accent", racer.accent);
  els.driverPreview.style.setProperty("--sprite", spritePosition(racer.spriteIndex, 4, 2));
  els.driverPreview.innerHTML = `
    <div class="preview-kart" aria-hidden="true"></div>
    <div class="preview-copy">
      <h2>${escapeHtml(racer.shortName)}</h2>
      <p><strong>${escapeHtml(racer.vehicle)}</strong> · ${escapeHtml(racer.role)}<br>${escapeHtml(racer.bio || racer.perk)}</p>
      <span class="perk-pill">${escapeHtml(racer.perk)}</span>
      <div class="stat-grid">
        <div class="stat" style="--value:${racer.stats.speed * 10}%"><b>${racer.stats.speed}</b><span>Speed</span><i></i></div>
        <div class="stat" style="--value:${racer.stats.handling * 10}%"><b>${racer.stats.handling}</b><span>Grip</span><i></i></div>
        <div class="stat" style="--value:${racer.stats.boost * 10}%"><b>${racer.stats.boost}</b><span>Boost</span><i></i></div>
      </div>
    </div>
  `;
  els.chooseDriverBtn.textContent = `Race as ${racer.shortName}`;
}

function renderCharacters() {
  els.characterGrid.innerHTML = CHARACTERS.map((racer) => `
    <button class="racer-card${racer.id === state.character.id ? " selected" : ""}" type="button" aria-pressed="${racer.id === state.character.id}" style="--accent:${racer.accent};--sprite:${spritePosition(racer.spriteIndex, 4, 2)}" data-id="${racer.id}">
      <div class="portrait" aria-hidden="true"></div>
      <h3>${escapeHtml(racer.name)}</h3>
      <p><strong>${escapeHtml(racer.role)}</strong><br>${escapeHtml(racer.vehicle)} · ${escapeHtml(racer.perk)}</p>
      <div class="stat-grid">
        <div class="stat" style="--value:${racer.stats.speed * 10}%"><b>${racer.stats.speed}</b><span>Speed</span><i></i></div>
        <div class="stat" style="--value:${racer.stats.handling * 10}%"><b>${racer.stats.handling}</b><span>Grip</span><i></i></div>
        <div class="stat" style="--value:${racer.stats.boost * 10}%"><b>${racer.stats.boost}</b><span>Boost</span><i></i></div>
      </div>
    </button>
  `).join("");
  els.characterGrid.querySelectorAll(".racer-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.character = CHARACTERS.find((racer) => racer.id === button.dataset.id) || CHARACTERS[0];
      renderCharacters();
      renderDriverPreview();
      updateTopStats();
    });
  });
  renderDriverPreview();
}

function renderTracks() {
  els.trackGrid.innerHTML = TRACKS.map((track) => `
    <button class="track-card" type="button" style="--accent:${track.accent};--track-sprite:${track.sprite}" data-id="${track.id}">
      <div class="track-art" aria-hidden="true"></div>
      <h3>${escapeHtml(track.title)}</h3>
      <p>${escapeHtml(track.subtitle)}</p>
      <div class="stat-grid">
        <div class="stat"><b>${track.laps}</b><span>Laps</span></div>
        <div class="stat"><b>Item</b><span>Questions</span></div>
        <div class="stat"><b>8</b><span>Racers</span></div>
      </div>
    </button>
  `).join("");
  els.trackGrid.querySelectorAll(".track-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.track = TRACKS.find((track) => track.id === button.dataset.id) || TRACKS[0];
      if (raceFormat === "gp") {
        startGrandPrix();
      } else {
        startRace();
      }
    });
  });
}

function updateTopStats() {
  els.topStats.innerHTML = [
    state.character ? state.character.name : "Choose racer",
    state.track ? state.track.title : "Choose track",
    state.banks ? "Powerup clues loaded" : "Loading clues"
  ].map((text) => `<span>${escapeHtml(text)}</span>`).join("");
}

function setupModeUI() {
  els.enginePills?.querySelectorAll(".mode-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      engineClass = pill.dataset.class || "100cc";
      els.enginePills.querySelectorAll(".mode-pill").forEach((p) => p.classList.toggle("active", p === pill));
    });
  });
  els.formatPills?.querySelectorAll(".mode-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      raceFormat = pill.dataset.format || "single";
      els.formatPills.querySelectorAll(".mode-pill").forEach((p) => p.classList.toggle("active", p === pill));
    });
  });
}

async function loadBanks() {
  const chrono = await fetch("../../data/chrono-defense-bank.json?v=20260502-source-contract").then((r) => r.json());
  state.banks = { chrono };
  updateTopStats();
}

function SourceBank() {
  return window.MrMacsSourceBank || null;
}

function courseMatch(pool) {
  if (pool === "us") return /U\.S\.|United States|Civics|Government|Grade 7|Grade 8|Grade 11|APUSH|AP U\.S\./i;
  if (pool === "global") return /Global|World|European|Human Geography|Geography|Eastern|Western|Grade 5|Grade 6|Grade 9|Grade 10/i;
  if (pool === "ap") return /^AP\b|AP |Advanced Placement/i;
  return /./;
}

function hasSourceLanguage(question) {
  const bank = SourceBank();
  if (bank?.sourceBased(question)) return true;
  const text = [
    question.prompt,
    question.stem,
    question.category,
    question.set,
    question.day
  ].filter(Boolean).join(" ");
  return Boolean(
    question.stimulusRequired ||
    (question.stimulusImages && question.stimulusImages.length) ||
    question.stimulus ||
    question.document ||
    question.image ||
    question.imageUrl ||
    /\b(according to|based on|using the|as shown|shown above|shown below|shown in|in the excerpt|this excerpt|the excerpt|the passage|this passage|the cartoon|the map|the graph|the chart|the photograph|the image|the source|the document|source\s+\d+|document\s+\d+|primary source|political cartoon|data table)\b/i.test(text)
  );
}

function normalizePowerupClue(question, rawPool, answerPool) {
  const bank = SourceBank();
  if (bank && (!bank.playableSharedPrompt(question) || (bank.sourceBased(question) && !bank.usableRegentsQuestion(question)))) return null;
  const prompt = cleanPrompt(question.prompt || question.stem || "");
  const answer = String(question.answer || "").trim();
  if (!prompt || !answer) return null;
  if (hasSourceLanguage(question)) return null;
  if (prompt.length > 145 || answer.length > 46) return null;
  if (/[?]/.test(prompt) && prompt.length > 95) return null;
  const sameCourse = rawPool
    .filter((item) => item.answer && item.answer !== answer && item.course === question.course)
    .map((item) => String(item.answer).trim());
  const distractors = uniq(shuffle((sameCourse.length >= 3 ? sameCourse : answerPool).filter((choice) => choice && choice !== answer && choice.length <= 46))).slice(0, 3);
  if (distractors.length < 3) return null;
  const choices = shuffle([answer, ...distractors]);
  return {
    prompt,
    answer,
    choices,
    correctIndex: choices.findIndex((choice) => choice === answer),
    explanation: question.explanation || `Correct answer: ${answer}`,
    course: question.course || "Review Arcade",
    set: question.category || question.day || "Powerup Clue"
  };
}

function poolForTrack(track) {
  const bank = SourceBank();
  const chronoRaw = (state.banks?.chrono?.questions || [])
    .filter((q) => q.answer && q.prompt && (!bank || bank.playableSharedPrompt(q)) && !hasSourceLanguage(q));
  const fallbackRaw = POWERUP_CLUE_FALLBACKS.map((q) => ({ ...q, category: "Powerup Clue" }));
  const raw = [...chronoRaw, ...fallbackRaw];
  const regex = courseMatch(track.pool);
  const filtered = raw.filter((q) => regex.test(q.course || "") || track.pool === "all");
  const answerPool = uniq(raw.map((q) => String(q.answer || "").trim()).filter((answer) => answer.length <= 46));
  const pool = filtered
    .map((q) => normalizePowerupClue(q, filtered, answerPool))
    .filter(Boolean);
  return shuffle(pool.length >= 20 ? pool : fallbackRaw.map((q) => normalizePowerupClue(q, fallbackRaw, answerPool)).filter(Boolean));
}

function startRace(trackOverride) {
  if (!state.banks) {
    els.topStats.innerHTML = "<span>Still loading question banks...</span>";
    return;
  }
  if (trackOverride) state.track = trackOverride;
  state.pool = poolForTrack(state.track);
  if (!state.pool.length) return;

  // Init audio on first race start (requires user gesture)
  initAudio();

  state.cursor = 0;
  state.current = null;
  state.running = true;
  state.paused = false;
  state.quizOpen = false;
  state.resolved = false;
  state.distance = 0;
  state.speed = 0;
  state.lane = 0;
  state.laneVel = 0;
  state.yaw = 0;
  state.gripSlip = 0;
  state.driftTier = 0;
  state.driftCharge = 0;
  state.drifting = false;
  state.boost = 0;
  state.boostMeter = 0;
  state.shield = 0;
  state.spin = 0;
  state.bump = 0;
  state.hop = 0;
  state.trickBoost = 0;
  state.skipPenalty = 0;
  state.slipPenalty = 0;
  state.countdown = COUNTDOWN_SECONDS;
  state.raceReleased = false;
  state.finishPulse = 0;
  state.hitFlash = 0;
  state.cameraShake = 0;
  state.skid = 0;
  state.item = null;
  state.itemRoulette = null;
  state.draft = 0;
  state.draftBoost = 0;
  state.nearMissCooldown = 0;
  state.racecraft = RACECRAFT_EMPTY();
  state.score = 0;
  state.correct = 0;
  state.attempts = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.place = CHARACTERS.length;
  state.prevPlace = CHARACTERS.length;
  state.lap = 1;
  state.lapStartTime = 0; // set when countdown ends
  state.lapTimes = [];
  state.lapBest = null;
  state.finishTime = 0;
  state.startedAt = performance.now();
  state.positionBanner = "";
  state.positionBannerTime = 0;
  state.finalLapFlash = false;
  state.fov = 1;
  state.offroad = 0;
  state.itemBoxes = buildItemBoxes();
  state.questionGates = buildQuestionGates();
  state.questionGateHit = new Set();
  state.rivals = buildRivals();
  state.particles = [];
  state.sparkParticles = [];
  state.roadBursts = [];
  showScreen(els.raceScreen);
  resizeCanvas();
  updateItemHud();
  updateHud();
  updateTopStats();
  setToast("3", 0.9);
  state.lastFrame = performance.now();
  requestAnimationFrame(tick);
}

function buildQuestionGates() {
  const gates = [];
  const length = trackLength();
  for (let lap = 0; lap < state.track.laps; lap++) {
    QUESTION_GATE_FRACS.forEach((frac, i) => {
      gates.push({
        id: lap * 10 + i,
        distance: lap * length + frac * length,
        triggered: false
      });
    });
  }
  return gates;
}

function startGrandPrix() {
  gpState.active = true;
  gpState.raceIndex = 0;
  gpState.tracks = shuffle(TRACKS.slice());
  gpState.standings = {};
  CHARACTERS.forEach((c) => { gpState.standings[c.id] = 0; });
  startRace(gpState.tracks[0]);
}

function buildItemBoxes() {
  const boxes = [];
  const lanes = [-0.68, 0, 0.68];
  const layout = trackLayout();
  const itemMarks = layout.items?.length ? layout.items : [520, 1040, 1560, 2080, 2600, 3120, 3640, 4160, 4680];
  const length = trackLength();
  let id = 0;
  for (let lap = 0; lap < state.track.laps; lap += 1) {
    itemMarks.forEach((mark, index) => {
      const distance = lap * length + Math.min(mark, length - 260);
      const offset = (index + lap) % lanes.length;
      boxes.push({ id: id += 1, distance, lane: lanes[offset], item: ITEMS[id % ITEMS.length], taken: false });
      boxes.push({ id: id += 1, distance: distance + 64, lane: lanes[(offset + 2) % lanes.length], item: ITEMS[id % ITEMS.length], taken: false });
    });
  }
  return boxes;
}

function buildRivals() {
  const lanes = [-0.78, -0.42, -0.12, 0.18, 0.46, 0.72, 0.02];
  const cls = ENGINE_CLASS[engineClass] || ENGINE_CLASS["100cc"];
  const mirror = cls.mirror || false;
  return CHARACTERS
    .filter((racer) => racer.id !== state.character.id)
    .map((racer, index) => ({
      racer,
      distance: 150 + index * 112,
      lane: (mirror ? -1 : 1) * (lanes[index] ?? 0),
      desiredLane: (mirror ? -1 : 1) * (lanes[index] ?? 0),
      base: (392 + racer.stats.speed * 17 + index * 7) * cls.speedMult,
      speed: (380 + index * 17) * cls.speedMult,
      hit: 0,
      boost: 0,
      attackFlash: 0,
      bumpGuard: 0,
      aggression: (0.55 + ((index % 3) * 0.16)) * cls.rivalAggression,
      itemCooldown: 4 + index * 1.2 + Math.random() * 2,
      wobble: Math.random() * Math.PI * 2,
      lap: 1,
      lastLapDist: 0
    }));
}

function nextQuestion() {
  if (state.cursor >= state.pool.length) {
    state.pool = shuffle(state.pool);
    state.cursor = 0;
  }
  state.current = state.pool[state.cursor];
  state.cursor += 1;
  return state.current;
}

function openQuestion(source = "item") {
  if (!state.running || state.paused || state.quizOpen) return;
  if (state.itemRoulette) {
    setToast("ITEM STILL ROLLING", 0.55);
    return;
  }
  if (source === "item" && !state.item) return;
  const question = nextQuestion();
  state.quizOpen = true;
  state.resolved = false;
  state.selected = 0;
  // Cleopatra perk: 1.4× answer time
  const baseTime = source === "gate" ? 10 : 6;
  const perkMult = state.character.id === "cleopatra" ? 1.4 : 1;
  state.answerSeconds = baseTime * perkMult;
  state.deadline = Date.now() + state.answerSeconds * 1000;
  state.questionSource = source;
  renderQuestion(source);
  els.questionCard.classList.remove("hidden");
  els.questionCard.classList.add("active");
  if (els.skipBtn) els.skipBtn.style.display = source === "gate" ? "block" : "none";
  setToast(source === "gate" ? "QUESTION GATE" : "POWERUP CLUE", 0.8);
  sfxItemUse();
}

function openItemQuestion() {
  openQuestion("item");
}

function skipQuestion() {
  if (!state.quizOpen || state.resolved) return;
  state.skipPenalty = 3; // 3s handling penalty
  state.resolved = true;
  state.quizOpen = false;
  els.questionCard.classList.add("hidden");
  updateItemHud();
  setToast("SKIP – handling penalty", 1.0);
  sfxQuestionWrong();
}

function closeItemQuestion() {
  state.quizOpen = false;
  state.current = null;
  els.questionCard.classList.add("hidden");
  els.questionCard.classList.remove("active");
  updateItemHud();
}

function renderQuestion(source = "item") {
  const q = state.current;
  const label = source === "gate" ? "QUESTION GATE" : (state.item?.name || "Powerup Clue");
  els.questionMeta.textContent = [label, q.course, q.set].filter(Boolean).join(" · ");
  els.questionText.textContent = q.prompt;
  els.feedback.className = "feedback";
  els.feedback.textContent = source === "gate"
    ? "Correct = boost + green trail. Wrong = slowdown."
    : "Pick the answer to fire this item.";
  els.answerDock.innerHTML = q.choices.map((choice, index) => `
    <button class="answer-btn" type="button" data-index="${index}">
      <b>${String.fromCharCode(65 + index)}</b>
      ${escapeHtml(choice)}
    </button>
  `).join("");
  els.answerDock.querySelectorAll(".answer-btn").forEach((button) => {
    button.addEventListener("click", () => gradeAnswer(Number(button.dataset.index)));
  });
  refreshAnswers();
}

function refreshAnswers() {
  els.answerDock.querySelectorAll(".answer-btn").forEach((button, index) => {
    button.classList.toggle("selected", index === state.selected && !state.resolved);
  });
}

function gradeAnswer(index, timedOut = false) {
  if (state.resolved || !state.current) return;
  state.resolved = true;
  const correct = index === state.current.correctIndex;
  const isGate = state.questionSource === "gate";
  state.attempts += 1;
  if (correct) {
    state.correct += 1;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.score += 750 + state.streak * 120;
    sfxQuestionCorrect();
    if (isGate) {
      // Gate correct: instant additive boost + green spark trail
      const gateBoost = 2.2 + state.character.stats.boost * 0.12;
      state.boost = Math.max(state.boost, state.boost + gateBoost * 0.5);
      state.boostMeter = Math.min(1, state.boostMeter + 0.55);
      state.cameraShake = Math.max(state.cameraShake, 0.2);
      burstParticles(state.lane, "#64f0aa", 32);
      setToast("CORRECT +BOOST", 1.1);
      els.feedback.className = "feedback good";
      els.feedback.innerHTML = `<strong>+Boost!</strong> ${escapeHtml(state.current.explanation || "")}`;
    } else {
      applyItem(state.item);
      els.feedback.className = "feedback good";
      els.feedback.innerHTML = `<strong>${escapeHtml(state.item?.coach || "Correct!")}</strong> ${escapeHtml(state.current.explanation || "")}`;
      setToast(state.item?.short?.toUpperCase() || "CORRECT", 1.2);
    }
  } else {
    state.streak = 0;
    state.score = Math.max(0, state.score - 150);
    sfxQuestionWrong();
    if (isGate) {
      // Gate wrong: slowdown + red HUD flash
      state.slipPenalty = 2.5;
      state.speed *= 0.72;
      state.hitFlash = 0.55;
      state.cameraShake = Math.max(state.cameraShake, 0.2);
      setToast(timedOut ? "TIMEOUT" : "WRONG!", 1.2);
      els.feedback.className = "feedback bad";
      const lead = timedOut ? "Time ran out." : "Wrong answer.";
      els.feedback.innerHTML = `<strong>${lead}</strong> Correct: ${String.fromCharCode(65 + state.current.correctIndex)}. ${escapeHtml(state.current.explanation || "")}`;
    } else {
      if (state.shield > 0) {
        state.shield = Math.max(0, state.shield - 1.2);
        setToast("SHIELD SAVED IT", 1.1);
      } else {
        state.spin = state.character.id === "toussaint" ? 0.55 : 0.95;
        state.speed *= 0.58;
        setToast(timedOut ? "TIMEOUT" : "MISFIRE", 1.2);
        sfxHit();
      }
      els.feedback.className = "feedback bad";
      const lead = timedOut ? "Time ran out." : "Item fizzled.";
      els.feedback.innerHTML = `<strong>${lead}</strong> Correct answer: ${String.fromCharCode(65 + state.current.correctIndex)}. ${escapeHtml(state.current.explanation || "")}`;
    }
  }
  els.answerDock.querySelectorAll(".answer-btn").forEach((button, i) => {
    button.classList.toggle("correct", i === state.current.correctIndex);
    button.classList.toggle("wrong", i === index && !correct);
  });
  if (!isGate) state.item = null;
  setTimeout(() => {
    if (state.running) closeItemQuestion();
  }, correct ? 1250 : 2100);
}

function applyItem(item) {
  if (!item) return;
  if (item.id === "scroll") {
    state.boost = Math.max(state.boost, 3.3 + state.character.stats.boost * 0.14);
    state.cameraShake = Math.max(state.cameraShake, 0.22);
    burstParticles(state.lane, state.character.accent, 24);
  } else if (item.id === "rocket") {
    const ahead = state.rivals
      .filter((rival) => rival.distance > state.distance - 40)
      .sort((a, b) => a.distance - b.distance)[0] || state.rivals[0];
    if (ahead) {
      ahead.hit = 2.9;
      ahead.speed *= 0.48;
      ahead.distance = Math.max(0, ahead.distance - 130);
      state.cameraShake = Math.max(state.cameraShake, 0.26);
      burstParticles(ahead.lane, item.color, 28);
    }
  } else if (item.id === "shield") {
    state.shield = 8.5;
    burstParticles(state.lane, item.color, 20);
  } else if (item.id === "burst") {
    state.rivals.forEach((rival) => {
      rival.hit = Math.max(rival.hit, 2.2);
      rival.speed *= 0.62;
    });
    state.cameraShake = Math.max(state.cameraShake, 0.34);
    burstParticles(0, item.color, 38);
  }
}

function collectItem(box) {
  if (box.taken || state.item || state.itemRoulette || state.quizOpen) return;
  box.taken = true;
  state.score += 120;
  state.itemRoulette = {
    timer: 0.78,
    total: 0.78,
    seed: Math.random() * ITEMS.length,
    fallback: box.item
  };
  updateItemHud();
  setToast("ITEM ROULETTE", 0.75);
  burstParticles(box.lane, box.item.color, 16);
}

function pickRouletteItem() {
  const place = state.place || CHARACTERS.length;
  const comeback = place >= 5;
  const frontRun = place <= 2;
  const pool = comeback
    ? ["scroll", "scroll", "rocket", "burst", "shield", "burst"]
    : frontRun
      ? ["shield", "shield", "scroll", "rocket"]
      : ["scroll", "rocket", "shield", "burst", "scroll"];
  const id = pool[Math.floor(Math.random() * pool.length)];
  return ITEMS.find((item) => item.id === id) || state.itemRoulette?.fallback || ITEMS[0];
}

function updateItemRoulette(dt) {
  if (!state.itemRoulette) return;
  const before = state.itemRoulette.timer;
  state.itemRoulette.timer = Math.max(0, state.itemRoulette.timer - dt);
  state.itemRoulette.seed += dt * 16;
  sfxItemRoll();
  if (before > 0 && state.itemRoulette.timer <= 0) {
    state.item = pickRouletteItem();
    state.racecraft.rouletteHits += 1;
    state.itemRoulette = null;
    state.score += 160;
    updateItemHud();
    setToast(`${state.item.short.toUpperCase()} READY`, 0.9);
    sfxItemUse();
    burstParticles(state.lane, state.item.color, 20);
  } else {
    updateItemHud();
  }
}

function updateItemHud() {
  if (state.itemRoulette) {
    const rolling = ITEMS[Math.floor(state.itemRoulette.seed) % ITEMS.length];
    els.hudItem.textContent = "Rolling...";
    els.itemThumb.style.backgroundImage = "url('rally-items-v2.webp')";
    els.itemThumb.style.backgroundPosition = spritePosition(rolling.spriteIndex, 2, 2);
    els.itemThumb.classList.add("ready");
    els.itemBtn.disabled = true;
  } else if (state.item) {
    els.hudItem.textContent = state.item.name;
    els.itemThumb.style.backgroundImage = "url('rally-items-v2.webp')";
    els.itemThumb.style.backgroundPosition = spritePosition(state.item.spriteIndex, 2, 2);
    els.itemThumb.classList.add("ready");
    els.itemBtn.disabled = false;
  } else {
    els.hudItem.textContent = "Empty";
    els.itemThumb.style.backgroundImage = "";
    els.itemThumb.style.backgroundPosition = "";
    els.itemThumb.classList.remove("ready");
    els.itemBtn.disabled = true;
  }
}

function updateHud() {
  const total = raceDistance();
  const newLap = Math.min(state.track.laps, Math.floor(state.distance / trackLength()) + 1);

  // Lap completion detection
  if (newLap > state.lap && state.raceReleased) {
    const now = performance.now();
    const lapTime = (now - state.lapStartTime) / 1000;
    state.lapTimes.push(lapTime);
    state.lapStartTime = now;

    // Check personal best lap
    const isBest = state.lapBest === null || lapTime < state.lapBest;
    if (isBest) state.lapBest = lapTime;
    const globalBest = getBestLap(state.track.id);
    const newRecord = setBestLap(state.track.id, lapTime);

    sfxLapComplete();
    if (newLap === state.track.laps) {
      // Final lap flash + stinger
      state.finalLapFlash = true;
      setTimeout(() => { state.finalLapFlash = false; }, 600);
      sfxFinalLap();
      setToast("FINAL LAP!", 2.0);
    } else {
      setToast(newRecord ? `LAP ${newLap - 1} — NEW BEST!` : `LAP ${newLap - 1} — ${formatTime(lapTime)}`, 1.8);
    }
    // Update lap times display
    updateLapTimesHud();

    // Reset question gate hits for new lap
    state.questionGateHit = new Set();
  }
  state.lap = newLap;

  const newPlace = 1 + state.rivals.filter((rival) => rival.distance > state.distance).length;
  // Position change banner
  if (newPlace !== state.prevPlace && state.raceReleased && !state.countdown) {
    const gained = newPlace < state.prevPlace;
    showPositionBanner(gained
      ? `PASSED → ${ordinal(newPlace)}`
      : `DROPPED → ${ordinal(newPlace)}`, gained);
    state.prevPlace = newPlace;
  }
  state.place = newPlace;

  els.hudRacer.textContent = state.character.shortName || state.character.name;
  els.hudLap.textContent = `${state.lap}/${state.track.laps}`;
  els.hudPlace.textContent = ordinal(state.place);
  els.hudScore.textContent = String(Math.max(0, Math.round(state.score)));

  const speedFrac = clamp(state.speed / 620, 0, 1);
  els.speedBar.style.transform = `scaleX(${speedFrac})`;
  if (els.speedNum) els.speedNum.textContent = Math.round(state.speed / 6.2);

  // Boost meter
  const boostFrac = clamp(state.boostMeter, 0, 1);
  if (els.boostBar) els.boostBar.style.transform = `scaleX(${boostFrac})`;

  if (state.quizOpen && !state.resolved && state.current) {
    const left = Math.max(0, state.deadline - Date.now());
    els.timerBar.style.transform = `scaleX(${left / (state.answerSeconds * 1000)})`;
    if (left <= 0) gradeAnswer(-1, true);
  }
  if (state.distance >= total) finishRace();
}

function showPositionBanner(text, gained) {
  state.positionBanner = text;
  state.positionBannerTime = 2.0;
  state.positionBannerGained = gained;
  // Also update the small HUD delta arrow
  if (els.placeDelta) {
    els.placeDelta.textContent = gained ? "▲" : "▼";
    els.placeDelta.className = "place-delta " + (gained ? "up" : "down");
    clearTimeout(els.placeDelta._timer);
    els.placeDelta._timer = setTimeout(() => {
      if (els.placeDelta) els.placeDelta.className = "place-delta";
    }, 2000);
  }
}

function updateLapTimesHud() {
  if (!els.lapTimesList) return;
  const bestLap = state.lapBest;
  els.lapTimesList.innerHTML = state.lapTimes.map((t, i) => {
    const isBest = t === bestLap;
    return `<div class="${isBest ? "best-lap" : ""}"><span>Lap ${i + 1}</span><span>${formatTime(t)}</span></div>`;
  }).join("");
  // Show best from previous sessions if exists
  const globalBest = getBestLap(state.track.id);
  if (globalBest) {
    const bestEl = document.createElement("div");
    bestEl.style.cssText = "color:var(--gold);font-size:10px;margin-top:4px;border-top:1px solid rgba(255,209,92,.25);padding-top:3px";
    bestEl.textContent = `PB: ${formatTime(globalBest)}`;
    els.lapTimesList.appendChild(bestEl);
  }
}

function finishRace() {
  if (!state.running) return;
  state.running = false;

  // Record final lap time
  if (state.lapTimes.length < state.track.laps && state.lapStartTime > 0) {
    const finalLap = (performance.now() - state.lapStartTime) / 1000;
    state.lapTimes.push(finalLap);
    if (state.lapBest === null || finalLap < state.lapBest) state.lapBest = finalLap;
  }

  state.finishTime = (performance.now() - state.startedAt) / 1000;
  const accuracy = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0;
  const title = state.place === 1 ? "First Place" : state.place <= 3 ? "Podium Finish" : "Race Finished";

  // Best lap check
  const newBestLap = state.lapBest !== null && setBestLap(state.track.id, state.lapBest);
  if (els.bestLapBanner) {
    if (state.lapBest !== null) {
      els.bestLapBanner.style.display = "block";
      els.bestLapBanner.textContent = newBestLap
        ? `NEW BEST LAP: ${formatTime(state.lapBest)}`
        : `Best Lap: ${formatTime(state.lapBest)}`;
    } else {
      els.bestLapBanner.style.display = "none";
    }
  }

  // GP mode
  if (gpState.active) {
    const pts = GP_POINTS[Math.min(state.place - 1, GP_POINTS.length - 1)] || 0;
    gpState.standings[state.character.id] = (gpState.standings[state.character.id] || 0) + pts;
    // Also give points to AI rivals by their finish position
    const sorted = state.rivals.slice().sort((a, b) => b.distance - a.distance);
    sorted.forEach((rival, idx) => {
      const rivalPlace = idx + (state.place <= idx + 1 ? 2 : 1);
      const rPts = GP_POINTS[Math.min(rivalPlace - 1, GP_POINTS.length - 1)] || 0;
      gpState.standings[rival.racer.id] = (gpState.standings[rival.racer.id] || 0) + rPts;
    });

    gpState.raceIndex += 1;
    if (els.resultKicker) els.resultKicker.textContent = `Grand Prix — Race ${gpState.raceIndex}/${gpState.tracks.length}`;
  } else {
    if (els.resultKicker) els.resultKicker.textContent = "Race Complete";
  }

  if (els.resultTitle) els.resultTitle.textContent = title;
  if (els.resultGrid) {
    els.resultGrid.innerHTML = [
      [ordinal(state.place), "place"],
      [`${state.finishTime.toFixed(1)}s`, "time"],
      [state.lapBest ? formatTime(state.lapBest) : "--", "best lap"],
      [`${state.correct}/${state.attempts}`, "items"],
      [`${accuracy}%`, "accuracy"],
      [String(state.racecraft.nearMisses), "near misses"],
      [`${state.racecraft.draftSeconds.toFixed(1)}s`, "draft"]
    ].map(([big, label]) => `<div><strong>${escapeHtml(big)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  }
  if (els.coachText) {
    els.coachText.textContent = accuracy >= 85
      ? "Strong item control. Keep racing Rally 64, then move into a full practice exam."
      : accuracy >= 60
        ? "Good racing base. The next jump is faster recall before firing items."
        : "Replay one cup and use fewer panic items. Correct powerup clues matter more than raw speed.";
  }

  // Show GP standings
  if (gpState.active && els.gpStandingsWrap) {
    els.gpStandingsWrap.style.display = "block";
    const sorted = Object.entries(gpState.standings)
      .sort(([, a], [, b]) => b - a)
      .map(([id, pts], i) => {
        const racer = CHARACTERS.find((c) => c.id === id);
        return `<div style="--accent:${racer?.accent || "#fff"}">
          <span class="gp-pos">${ordinal(i + 1)}</span>
          <span style="color:${racer?.accent || '#fff'}">${escapeHtml(racer?.name || id)}</span>
          <span class="gp-pts">${pts} pts</span>
        </div>`;
      }).join("");
    if (els.gpStandings) els.gpStandings.innerHTML = sorted;

    // If more races: change again button text
    if (gpState.raceIndex < gpState.tracks.length) {
      if (els.againBtn) els.againBtn.textContent = `Next Race (${gpState.raceIndex + 1}/${gpState.tracks.length})`;
    } else {
      // GP complete
      incGPCompletions();
      gpState.active = false;
      if (els.againBtn) els.againBtn.textContent = "New Grand Prix";
    }
  } else {
    if (els.gpStandingsWrap) els.gpStandingsWrap.style.display = "none";
    if (els.againBtn) els.againBtn.textContent = "Race Again";
  }

  window.MrMacsAnalytics?.track("game_complete", {
    gameId: "regents-rally-source-circuit",
    title: "Regents Rally 64",
    score: accuracy,
    questions: state.attempts
  }, { counter: "game-completions" });
  showScreen(els.resultsScreen);
}

function resizeCanvas() {
  const rect = els.canvas.getBoundingClientRect();
  state.dpr = Math.min(window.devicePixelRatio || 1, perfLite ? 1.25 : 2);
  els.canvas.width = Math.max(1, Math.floor(rect.width * state.dpr));
  els.canvas.height = Math.max(1, Math.floor(rect.height * state.dpr));
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function tick(now) {
  if (!state.running) return;
  const dt = Math.min(48, now - state.lastFrame) / 1000;
  state.lastFrame = now;
  if (!state.paused) {
    updateRace(state.quizOpen ? dt * 0.18 : dt);
  }
  updateHud();
  drawRace(now, dt);
  requestAnimationFrame(tick);
}

function updateRace(dt) {
  if (state.countdown > 0) {
    const before = Math.ceil(state.countdown);
    state.countdown = Math.max(0, state.countdown - dt);
    const after = Math.ceil(state.countdown);
    if (before !== after && after > 0) setToast(String(after), 0.85);
    if (!state.countdown && !state.raceReleased) {
      state.raceReleased = true;
      state.lapStartTime = performance.now();
      const launchHeld = keys.has("ArrowUp") || keys.has("w") || state.touch.gas;
      state.racecraft.perfectStart = launchHeld;
      state.boost = launchHeld ? 1.85 : 0;
      if (state.boost > 0) {
        state.boostMeter = Math.min(1, state.boostMeter + 0.4);
        state.score += 140;
        state.cameraShake = Math.max(state.cameraShake, 0.2);
        burstParticles(state.lane, state.character.accent, 22);
      }
      setToast(state.boost > 0 ? "PERFECT START" : "GO", 0.95);
    }
    state.toastTime = Math.max(0, state.toastTime - dt);
    updateRivals(dt * 0.08);
    updateParticles(dt);
    return;
  }

  const digitalSteer = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  const touchSteer = Math.abs(state.touch.steer) > 0.08 ? state.touch.steer : 0;
  const steer = clamp(touchSteer || digitalSteer, -1, 1);
  const accelerate = keys.has("ArrowUp") || keys.has("w") || state.touch.gas;
  const brake = keys.has("ArrowDown") || keys.has("s") || state.touch.brake;
  // Drift: X key (new), or Space (legacy), or touch drift
  const driftKey = keys.has("x") || keys.has(" ") || state.touch.drift;
  const drift = driftKey && Math.abs(steer) > 0.18 && state.speed > 245;
  // Jump: J key or touch jump
  const jumpPressed = (keys.has("j") || state.touch.jump) && !state._prevJump;
  state._prevJump = keys.has("j") || state.touch.jump;

  if (jumpPressed && state.hop <= 0) {
    state.hop = 0.22;
    state.trickBoost = 0; // will be applied on landing
    state._jumping = true;
  }
  // Trick boost on landing
  if (state._jumping && state.hop <= 0.04) {
    state._jumping = false;
    state.trickBoost = 0.55;
    state.boostMeter = Math.min(1, state.boostMeter + 0.15);
    setToast("TRICK!", 0.6);
    burstParticles(state.lane, state.character.accent, 12);
  }

  const sample = trackSample(state.distance + Math.max(60, state.speed * 0.24));
  const surface = surfaceAt(state.distance + Math.max(80, state.speed * 0.3));
  const laneLimit = 0.9 + sample.width * 0.18;
  const offroadAmt = Math.max(0, Math.abs(state.lane) - laneLimit);
  state.offroad = offroadAmt;

  const weight = state.character.stats.weight || 6;
  const cls = ENGINE_CLASS[engineClass] || ENGINE_CLASS["100cc"];
  const speedMult = cls.speedMult;
  const statSpeed = (410 + state.character.stats.speed * 27 + weight * 2) * speedMult;
  const naturalRoll = (126 + state.character.stats.speed * 9) * speedMult;
  const boostSpeed = state.boost > 0 ? (250 + state.character.stats.boost * 17) * speedMult : 0;
  const trickBs = state.trickBoost > 0 ? 80 * speedMult : 0;
  const draftSpeed = state.draftBoost > 0 ? 92 + state.character.stats.handling * 4 : 0;
  const brakeDrag = brake ? 305 + state.character.stats.handling * 6 : 0;
  // Handling penalties
  const skipDrag = state.skipPenalty > 0 ? 60 : 0;
  const slipDrag = state.slipPenalty > 0 ? 80 : 0;
  const targetSpeed = clamp(
    (accelerate ? statSpeed : naturalRoll) + boostSpeed + trickBs + draftSpeed
      - brakeDrag - offroadAmt * 295 - surface.drag - state.spin * 300 - state.bump * 120 - skipDrag - slipDrag,
    0, 835 * speedMult
  );
  const launchTorque = accelerate && state.speed < 260 ? (88 + state.character.stats.boost * 4 - weight * 2.5) * dt : 0;
  const brakeBite = brake ? (165 + state.character.stats.handling * 8) * dt : 0;
  const accelRate = accelerate || state.boost > 0 ? 10.2 + state.character.stats.boost * 0.12 - weight * 0.07 : 4.25;
  state.speed += (targetSpeed - state.speed) * frameEase(brake ? 16.8 : accelRate, dt) + launchTorque;
  if (brake) state.speed = Math.max(0, state.speed - brakeBite);

  // Handling: skip & slip penalties reduce turning effectiveness
  const handlingMult = 1 - (state.skipPenalty > 0 ? 0.35 : 0) - (state.slipPenalty > 0 ? 0.18 : 0);
  const speedFactor = clamp(state.speed / 465, 0.32, 1.32);
  const grip = (1.2 + state.character.stats.handling * 0.18 - weight * 0.018) * surface.grip * handlingMult;
  const driftGrip = drift ? 0.48 : brake && steer ? 0.8 : 1;
  const brakeTurn = brake && steer ? 1.32 : 1;
  const curveAssist = roadCurveAt(state.distance + state.speed * 0.75, 0.6) * 0.00000055 * state.speed;
  const curvePull = curveAssist * (drift ? 0.68 : 1);
  state.laneVel += (steer * grip * driftGrip * brakeTurn - curvePull) * speedFactor * dt;
  if (drift) state.laneVel += steer * 0.052 * dt * clamp(state.speed / 360, 0.55, 1.55);
  state.laneVel = clamp(state.laneVel, -0.14, 0.14);
  state.laneVel *= Math.pow(drift ? 0.988 : brake ? 0.84 : 0.84, dt * 60);
  state.lane += state.laneVel * (0.9 + state.speed / 620) * dt * 60;
  const hardEdge = laneLimit + 0.24;
  if (Math.abs(state.lane) > hardEdge) {
    state.lane = clamp(state.lane, -hardEdge, hardEdge);
    state.laneVel *= -0.35;
    state.speed *= 0.965;
    state.cameraShake = Math.max(state.cameraShake, 0.12);
    sfxHit();
  }
  state.gripSlip = clamp(Math.abs(state.laneVel) * clamp(state.speed / 430, 0, 1.45) + offroadAmt * 0.65 + (drift ? 0.32 : 0), 0, 1);
  state.yaw += (steer * (drift ? 0.42 : 0.24) + state.laneVel * 1.75 - state.yaw) * frameEase(drift ? 7.6 : 5.2, dt);
  state.skid = Math.max(0, state.gripSlip);

  // Dust particles on offroad
  if (offroadAmt > 0.05 && Math.random() < 0.42) {
    burstParticles(state.lane, "#8b98b6", 1);
  }

  // Drift system with tier spark audio
  if (drift) {
    if (!state.drifting) state.hop = Math.min(state.hop, 0.18);
    const sparkBonus = state.character.id === "joan-of-arc" ? 0.24 : 0;
    const prevTier = state.driftTier;
    state.driftCharge = Math.min(3.4, state.driftCharge + dt * (1.18 + sparkBonus + Math.abs(steer) * 0.72 + state.gripSlip * 0.28));
    state.driftTier = state.driftCharge > DRIFT_THRESHOLDS[3] ? 3 : state.driftCharge > DRIFT_THRESHOLDS[2] ? 2 : state.driftCharge > DRIFT_THRESHOLDS[1] ? 1 : 0;
    state.drifting = true;
    // Tier-up SFX
    if (state.driftTier > prevTier) sfxDriftTierUp(state.driftTier);
    const spark = state.driftTier >= 3 ? "#66e9ff" : state.driftTier >= 2 ? "#ffd15c" : state.character.accent;
    if (Math.random() < 0.86) {
      burstParticles(state.lane - steer * 0.2, spark, state.driftTier >= 2 ? 2 : 1);
      // Canvas spark particle at wheel positions
      addSparkParticle(state.lane - steer * 0.22, spark);
    }
  } else if (state.drifting) {
    if (state.driftCharge > 0.45) {
      const tier = state.driftCharge > DRIFT_THRESHOLDS[3] ? 3 : state.driftCharge > DRIFT_THRESHOLDS[2] ? 2 : 1;
      const boostAmt = DRIFT_BOOSTS[tier] + state.driftCharge * 0.42;
      state.boost = Math.max(state.boost, boostAmt);
      state.boostMeter = Math.min(1, state.boostMeter + [0, 0.2, 0.4, 0.65][tier]);
      state.cameraShake = Math.max(state.cameraShake, [0, 0.1, 0.18, 0.26][tier]);
      state.score += Math.round([0, 75, 145, 240][tier] * state.driftCharge);
      setToast(DRIFT_LABELS[tier], 0.8);
      sfxMiniTurbo(tier);
      burstParticles(state.lane, tier === 1 ? state.character.accent : DRIFT_COLORS[tier], [0, 16, 28, 42][tier]);
    }
    state.driftCharge = 0;
    state.driftTier = 0;
    state.drifting = false;
  }

  const beforeDistance = state.distance;
  state.distance += state.speed * dt;
  triggerSpeedPad(beforeDistance, state.distance);
  updateQuestionGates();

  // Decay
  state.boost = Math.max(0, state.boost - dt * 0.85);
  state.trickBoost = Math.max(0, state.trickBoost - dt);
  state.draftBoost = Math.max(0, state.draftBoost - dt);
  state.shield = Math.max(0, state.shield - dt);
  state.spin = Math.max(0, state.spin - dt * (state.character.id === "toussaint" ? 2.35 : 1.7));
  state.bump = Math.max(0, state.bump - dt * (state.character.id === "abraham-lincoln" ? 4.0 : 2.8));
  state.hop = Math.max(0, state.hop - dt * 2.8);
  state.finishPulse = Math.max(0, state.finishPulse - dt);
  state.hitFlash = Math.max(0, state.hitFlash - dt);
  state.cameraShake = Math.max(0, state.cameraShake - dt * 1.9);
  state.toastTime = Math.max(0, state.toastTime - dt);
  state.nearMissCooldown = Math.max(0, state.nearMissCooldown - dt);
  state.skipPenalty = Math.max(0, state.skipPenalty - dt);
  state.slipPenalty = Math.max(0, state.slipPenalty - dt);
  state.positionBannerTime = Math.max(0, state.positionBannerTime - dt);
  // Boost meter naturally decays when not boosting
  if (state.boost <= 0) state.boostMeter = Math.max(0, state.boostMeter - dt * 0.18);

  // FOV fish-eye at high speed
  const targetFov = 1 + clamp((state.speed / 700) - 0.6, 0, 0.28);
  state.fov += (targetFov - state.fov) * frameEase(3, dt);

  // Engine audio
  updateEngineAudio(state.speed, state.boost, state.drifting);

  updateRivals(dt);
  updateRacecraft(dt);
  updateKartCollisions();
  updateItemBoxes();
  updateItemRoulette(dt);
  updateParticles(dt);
  updateSparkParticles(dt);
  updateRoadBursts(dt);
  state.score += dt * Math.max(3, state.speed / 34);
}

function addSparkParticle(lane, color) {
  state.sparkParticles.push({
    lane,
    ahead: -12, // just behind kart
    vx: (Math.random() - 0.5) * 0.06,
    vy: 0.04 + Math.random() * 0.06,
    life: 0.3 + Math.random() * 0.25,
    max: 0.5,
    color,
    size: 3 + Math.random() * 4
  });
}

function updateSparkParticles(dt) {
  state.sparkParticles.forEach((p) => {
    p.ahead -= state.speed * dt * 0.92;
    p.lane += p.vx;
    p.life -= dt;
  });
  state.sparkParticles = state.sparkParticles.filter((p) => p.life > 0 && p.ahead > -VISIBLE_RANGE);
}

function updateQuestionGates() {
  if (state.quizOpen) return;
  state.questionGates.forEach((gate, idx) => {
    if (gate.triggered) return;
    if (state.questionGateHit.has(gate.id)) return;
    const ahead = gate.distance - state.distance;
    if (ahead > -90 && ahead < 60) {
      gate.triggered = true;
      state.questionGateHit.add(gate.id);
      openQuestion("gate");
    }
  });
  // Reset triggered flags if lap reset
  const lapDist = trackLocalDistance(state.distance);
  state.questionGates.forEach((gate) => {
    const gateLapDist = trackLocalDistance(gate.distance);
    if (Math.abs(lapDist - gateLapDist) > trackLength() * 0.5) {
      gate.triggered = false;
    }
  });
}

function speedPadLane(distance) {
  return Math.floor(distance / 720) % 2 ? -0.42 : 0.42;
}

function triggerSpeedPad(beforeDistance, afterDistance) {
  const nextPad = Math.floor(afterDistance / 720) * 720 + 240;
  if (nextPad <= beforeDistance || nextPad > afterDistance + 28) return;
  if (Math.abs(state.lane - speedPadLane(nextPad)) > 0.32) return;
  state.boost = Math.max(state.boost, 1.15);
  state.speed = Math.min(835, state.speed + 64);
  state.cameraShake = Math.max(state.cameraShake, 0.15);
  state.score += 90;
  setToast("SPEED PAD", 0.55);
  burstParticles(state.lane, "#66e9ff", 22);
}

function updateRacecraft(dt) {
  const nearby = state.rivals
    .map((rival) => ({
      rival,
      gap: rival.distance - state.distance,
      laneGap: Math.abs(rival.lane - state.lane)
    }))
    .filter((item) => item.gap > -82 && item.gap < 310)
    .sort((a, b) => Math.abs(a.gap) - Math.abs(b.gap));
  const draftTarget = nearby.find((item) => item.gap > 32 && item.gap < 285 && item.laneGap < 0.28);
  if (draftTarget && state.speed > 285 && !state.quizOpen) {
    state.draft = clamp(state.draft + dt * (0.72 + state.speed / 720), 0, 1);
    state.racecraft.draftSeconds += dt;
    if (state.draft >= 1) {
      state.draft = 0.18;
      state.draftBoost = Math.max(state.draftBoost, 1.35);
      state.boostMeter = Math.min(1, state.boostMeter + 0.22);
      state.score += 180;
      state.cameraShake = Math.max(state.cameraShake, 0.13);
      setToast("SLIPSTREAM", 0.62);
      sfxSlipstream();
      burstParticles(state.lane, "#66e9ff", 18);
    }
  } else {
    state.draft = Math.max(0, state.draft - dt * 0.9);
  }
  const nearMiss = nearby.find((item) => Math.abs(item.gap) < 72 && item.laneGap >= 0.27 && item.laneGap < 0.48);
  if (nearMiss && state.speed > 340 && state.nearMissCooldown <= 0 && !state.quizOpen) {
    state.nearMissCooldown = 0.86;
    state.racecraft.nearMisses += 1;
    state.racecraft.lineBonus += 1;
    state.score += 220 + state.racecraft.nearMisses * 18;
    state.boost = Math.max(state.boost, 0.42);
    state.cameraShake = Math.max(state.cameraShake, 0.08);
    setToast("NEAR MISS +BOOST", 0.56);
    burstParticles(state.lane, "#f8fbff", 14);
  }
}

function updateKartCollisions() {
  if (state.distance < 360) return;
  state.rivals.forEach((rival) => {
    const gap = rival.distance - state.distance;
    const laneGap = rival.lane - state.lane;
    if (Math.abs(gap) > 54 || Math.abs(laneGap) > 0.26 || state.spin > 0.1) return;
    const playerWeight = state.character.stats.weight || 6;
    const rivalWeight = rival.racer.stats.weight || 6;
    const weightEdge = clamp((playerWeight - rivalWeight) / 10, -0.28, 0.28);
    state.bump = Math.max(0.28, 0.55 - weightEdge);
    state.cameraShake = Math.max(state.cameraShake, state.shield > 0 ? 0.18 : 0.32);
    state.speed *= state.shield > 0 ? 0.97 : 0.84 + weightEdge * 0.28;
    state.laneVel -= Math.sign(laneGap || 1) * (0.07 + rivalWeight * 0.004);
    rival.speed *= 0.86 - weightEdge * 0.18;
    rival.hit = Math.max(rival.hit, 0.32 + weightEdge * 0.4);
    burstParticles(state.lane, state.shield > 0 ? "#64f0aa" : "#ffffff", state.shield > 0 ? 10 : 16);
    if (state.toastTime < 0.2) setToast(state.shield > 0 ? "SHIELD BUMP" : "BUMP", 0.45);
  });
}

function updateRivals(dt) {
  const cls = ENGINE_CLASS[engineClass] || ENGINE_CLASS["100cc"];
  state.rivals.forEach((rival, index) => {
    rival.hit = Math.max(0, rival.hit - dt);
    rival.boost = Math.max(0, rival.boost - dt);
    rival.attackFlash = Math.max(0, rival.attackFlash - dt);
    rival.bumpGuard = Math.max(0, rival.bumpGuard - dt);
    rival.itemCooldown = Math.max(0, rival.itemCooldown - dt);

    const gap = rival.distance - state.distance;
    const lookahead = 170 + racerHandling(rival.racer) * 8; // high-handling = tighter look-ahead
    const sample = trackSample(rival.distance + lookahead);
    const surface = surfaceAt(rival.distance + 120);

    // Stat-driven line: high handling → tighter apex
    const handlingFactor = racerHandling(rival.racer) / 10;
    const raceLine = clamp(-sample.curve / (280 + (1 - handlingFactor) * 120), -0.72, 0.72);
    const curve = raceLine + Math.sin(rival.distance * 0.0044 + index * 2.2 + rival.wobble) * (0.28 - handlingFactor * 0.12);

    const avoidPlayer = Math.abs(gap) < 150 ? Math.sign(rival.lane - state.lane || (index % 2 ? 1 : -1)) * 0.24 : 0;
    const blockPlayer = gap > 8 && gap < 145 && Math.abs(rival.lane - state.lane) < 0.45 ? state.lane * 0.7 : 0;
    const chaseItemLane = Math.abs(gap) < 520 && rival.itemCooldown < 2.4
      ? nearestItemLane(rival.distance, rival.lane) * 0.28 : 0;
    rival.desiredLane = clamp(curve * 0.76 + avoidPlayer + blockPlayer + chaseItemLane, -0.92, 0.92);

    // Lane change speed scales with handling stat
    const laneRate = 1.55 + handlingFactor * 0.08;
    rival.lane += (rival.desiredLane - rival.lane) * frameEase(laneRate, dt);

    // Rubber-banding: ±5% only
    const rubberBand = rival.distance < state.distance - 360 ? rival.base * 0.05 : rival.distance > state.distance + 620 ? -rival.base * 0.05 : 0;
    const draftBonus = gap > -165 && gap < -42 && Math.abs(rival.lane - state.lane) < 0.34 ? 58 : 0;
    const hitDrag = rival.hit > 0 ? 175 : 0;
    const boostBonus = rival.boost > 0 ? 158 * cls.speedMult : 0;
    const curveDrag = Math.abs(sample.curve) * (0.08 + (1 - handlingFactor) * 0.04); // low-handling rivals slow more on curves

    // High-speed characters get a straight-line bonus (Mansa Musa "High top speed" perk)
    const speedPerk = rival.racer.id === "mansa-musa" ? 30 : 0;
    // On long straights, high-speed rivals push harder
    const straightBonus = Math.abs(sample.curve) < 40 && rival.racer.stats.speed >= 9 ? 40 : 0;

    const target = rival.base + rubberBand + draftBonus + boostBonus + speedPerk + straightBonus - hitDrag - surface.drag * 0.6 - curveDrag;
    rival.speed += (target - rival.speed) * frameEase(3.2, dt);
    rival.distance += rival.speed * dt;

    // Lap tracking for minimap
    const length = trackLength();
    if (rival.distance - rival.lastLapDist >= length) {
      rival.lap = (rival.lap || 1) + 1;
      rival.lastLapDist += length;
    }

    if (rival.itemCooldown <= 0 && Math.abs(gap) < 640) {
      rival.itemCooldown = 5.2 + Math.random() * 5.4 - rival.aggression;
      if (gap < -115 || (gap < 0 && Math.random() < 0.62)) {
        rival.boost = 2.35 + rival.aggression * 0.35;
        rival.attackFlash = 0.65;
        burstParticles(rival.lane, rival.racer.accent, 16);
        if (Math.abs(gap) < 360 && state.toastTime < 0.25) setToast(`${rival.racer.shortName || rival.racer.name} boosts`, 0.7);
      } else if (gap > 35 && gap < 430 && Math.abs(rival.lane - state.lane) < 0.46) {
        rival.attackFlash = 0.95;
        if (state.shield > 0) {
          state.shield = Math.max(0, state.shield - 1.5);
          state.cameraShake = Math.max(state.cameraShake, 0.16);
          setToast("SHIELD BLOCK", 0.8);
        } else {
          state.spin = Math.max(state.spin, state.character.id === "toussaint" ? 0.44 : 0.74);
          state.speed *= 0.79;
          state.cameraShake = Math.max(state.cameraShake, 0.28);
          state.hitFlash = 0.42;
          sfxHit();
          setToast(`${rival.racer.shortName || rival.racer.name} fired Burst`, 0.85);
        }
        burstParticles(state.lane, "#ff5f9f", 18);
      } else if (Math.abs(gap) < 155 && Math.abs(rival.lane - state.lane) < 0.34 && rival.bumpGuard <= 0) {
        rival.bumpGuard = 1.1;
        rival.desiredLane = clamp(state.lane + (index % 2 ? 0.38 : -0.38), -0.92, 0.92);
        state.bump = Math.max(state.bump, 0.32);
        state.cameraShake = Math.max(state.cameraShake, 0.18);
        setToast(`${rival.racer.shortName || rival.racer.name} blocks`, 0.62);
      }
    }
  });
}

function nearestItemLane(distance, lane) {
  const next = state.itemBoxes
    .filter((box) => !box.taken && box.distance > distance + 40 && box.distance < distance + 430)
    .sort((a, b) => Math.abs(a.lane - lane) - Math.abs(b.lane - lane))[0];
  return next ? next.lane : 0;
}

function racerHandling(racer) {
  return racer?.stats?.handling || 7;
}

function updateItemBoxes() {
  state.itemBoxes.forEach((box) => {
    const ahead = box.distance - state.distance;
    if (!box.taken && ahead > -95 && ahead < 90 && Math.abs(box.lane - state.lane) < 0.5) {
      collectItem(box);
    }
  });
}

function burstParticles(lane, color, count) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      lane: lane + (Math.random() - 0.5) * 0.35,
      ahead: 60 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 80,
      vy: -40 - Math.random() * 80,
      life: 0.45 + Math.random() * 0.5,
      max: 0.8,
      color
    });
  }
}

function updateParticles(dt) {
  state.particles.forEach((p) => {
    p.ahead += p.vy * dt;
    p.lane += p.vx * dt / 460;
    p.life -= dt;
  });
  state.particles = state.particles.filter((p) => p.life > 0);
}

function updateRoadBursts(dt) {
  if (state.speed > 360 && Math.random() < clamp(state.speed / 880, 0.08, 0.74)) {
    state.roadBursts.push({
      lane: (Math.random() - 0.5) * 2.2,
      ahead: 120 + Math.random() * 720,
      life: 0.22 + Math.random() * 0.24,
      max: 0.42,
      color: Math.random() < 0.5 ? state.character.accent : "#f8fbff"
    });
  }
  state.roadBursts.forEach((burst) => {
    burst.ahead -= state.speed * dt * 0.95;
    burst.life -= dt;
  });
  state.roadBursts = state.roadBursts.filter((burst) => burst.life > 0 && burst.ahead > -80);
}

function drawRace(now) {
  const w = els.canvas.clientWidth;
  const h = els.canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  // Fish-eye / FOV widening at high speed: slight radial stretch
  if (state.fov > 1.01) {
    const scale = state.fov;
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, 1 + (scale - 1) * 0.4);
    ctx.translate(-w / 2, -h / 2);
  }

  if (state.cameraShake > 0) {
    const amount = state.cameraShake * 18;
    ctx.translate(Math.sin(now * 0.067) * amount, Math.cos(now * 0.051) * amount * 0.62);
  }
  drawEnvironment(w, h, now);
  drawRoad(w, h);
  drawRoadMotion(w, h, now);
  drawSpeedPads(w, h, now);
  drawQuestionGatePads(w, h, now);
  drawTracksideProps(w, h, now);
  drawVisibleItems(w, h, now);
  drawVisibleRivals(w, h);
  drawPlayerKart(w, h);
  drawParticles(w, h);
  drawSparkParticles(w, h);
  ctx.restore();
  drawMinimap(w, h);
  drawRaceOverlay(w, h);
  drawPositionBanner(w, h);
  drawToast(w, h);
  if (state.finalLapFlash) {
    ctx.save();
    ctx.fillStyle = "rgba(255,209,92,.18)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.hitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = state.hitFlash * 0.35;
    ctx.fillStyle = "#ff5f9f";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.paused) {
    ctx.fillStyle = "rgba(5,8,22,.62)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f8fbff";
    ctx.font = "900 42px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSED", w / 2, h / 2);
  }
}

function drawQuestionGatePads(w, h, now) {
  state.questionGates.forEach((gate) => {
    if (gate.triggered) return;
    const ahead = gate.distance - state.distance;
    if (ahead < -60 || ahead > VISIBLE_RANGE) return;
    for (let l = -1; l <= 1; l++) {
      const p = objectPoint(ahead, l * 0.55, w, h);
      if (!p) continue;
      const size = 80 * p.scale;
      ctx.save();
      ctx.translate(p.x, p.y - 6 * p.scale);
      ctx.globalAlpha = clamp(0.3 + p.n * 0.65, 0.3, 0.95);
      const pulse = 1 + Math.sin(now / 220 + gate.id) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "rgba(100,240,170,.22)";
      ctx.strokeStyle = "#64f0aa";
      ctx.lineWidth = Math.max(2, 3 * p.scale);
      ctx.beginPath();
      ctx.moveTo(-size / 2, 0);
      ctx.lineTo(size / 2, 0);
      ctx.lineTo(size * 0.4, -size * 0.5);
      ctx.lineTo(-size * 0.4, -size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // "?" marker
      ctx.fillStyle = "#64f0aa";
      ctx.font = `900 ${Math.max(10, 16 * p.scale)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", 0, -size * 0.25);
      ctx.restore();
    }
  });
}

function drawSparkParticles(w, h) {
  state.sparkParticles.forEach((p) => {
    const point = objectPoint(p.ahead, p.lane, w, h);
    if (!point) return;
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1;
    const s = Math.max(1.5, point.scale * p.size);
    // Star-shaped spark
    ctx.beginPath();
    ctx.moveTo(point.x, point.y - s);
    ctx.lineTo(point.x + s * 0.3, point.y - s * 0.3);
    ctx.lineTo(point.x + s, point.y);
    ctx.lineTo(point.x + s * 0.3, point.y + s * 0.3);
    ctx.lineTo(point.x, point.y + s);
    ctx.lineTo(point.x - s * 0.3, point.y + s * 0.3);
    ctx.lineTo(point.x - s, point.y);
    ctx.lineTo(point.x - s * 0.3, point.y - s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawPositionBanner(w, h) {
  if (!state.positionBannerTime || !state.positionBanner) return;
  const alpha = clamp(state.positionBannerTime, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.font = "950 22px Inter, sans-serif";
  const textW = ctx.measureText(state.positionBanner).width;
  const bw = textW + 44;
  const bh = 44;
  const bx = w / 2 - bw / 2;
  const by = 118;
  ctx.fillStyle = state.positionBannerGained ? "rgba(100,240,170,.18)" : "rgba(255,95,159,.14)";
  ctx.strokeStyle = state.positionBannerGained ? "rgba(100,240,170,.6)" : "rgba(255,95,159,.5)";
  ctx.lineWidth = 1.5;
  roundRect(bx, by, bw, bh, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = state.positionBannerGained ? "#64f0aa" : "#ff5f9f";
  ctx.textBaseline = "middle";
  ctx.fillText(state.positionBanner, w / 2, by + bh / 2);
  ctx.restore();
}

function themeColors() {
  const base = {
    regents: ["#081324", "#16306c", "#66e9ff"],
    liberty: ["#14152d", "#4b3317", "#ffd15c"],
    global: ["#061d22", "#16583d", "#64f0aa"],
    ap: ["#170b30", "#45205d", "#ff5f9f"]
  };
  return base[state.track.theme] || base.regents;
}

function drawEnvironment(w, h, now) {
  const [top, mid, accent] = themeColors();
  const horizon = h * 0.39;
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, top);
  sky.addColorStop(0.58, mid);
  sky.addColorStop(1, "#050816");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  drawSunDisc(w, h, now, accent);
  drawPixelClouds(w, h, now, accent);
  drawHorizonLayer(w, horizon, 0.08, 120, "rgba(2,5,16,.46)", accent, now);
  drawHorizonLayer(w, horizon + 20, 0.18, 88, "rgba(5,10,26,.72)", accent, now + 1400);
  drawGrandstands(w, h, now, accent);
  drawGroundPlane(w, h, accent);
  drawCourseLights(w, h, now, accent);
  drawSpeedLines(w, h, accent);
}

function drawSunDisc(w, h, now, accent) {
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.19, 125 + Math.sin(now / 800) * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.19, 150 + i * 26 + Math.sin(now / 700 + i) * 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawPixelClouds(w, h, now, accent) {
  ctx.save();
  const drift = state.distance * 0.035 + now * 0.012;
  for (let i = 0; i < 8; i += 1) {
    const width = 78 + (i % 3) * 28;
    const x = ((i * 211 - drift) % (w + 220) + w + 220) % (w + 220) - 120;
    const y = h * (0.08 + (i % 4) * 0.055) + Math.sin(now / 950 + i) * 4;
    ctx.globalAlpha = 0.18 + (i % 2) * 0.08;
    ctx.fillStyle = i % 3 ? "#f8fbff" : accent;
    ctx.fillRect(Math.round(x), Math.round(y), width * 0.52, 14);
    ctx.fillRect(Math.round(x + width * 0.2), Math.round(y - 14), width * 0.5, 18);
    ctx.fillRect(Math.round(x + width * 0.48), Math.round(y + 2), width * 0.44, 12);
  }
  ctx.restore();
}

function drawHorizonLayer(w, baseY, speed, height, color, accent, now) {
  const tile = 230;
  const offset = ((state.distance * speed) % tile + tile) % tile;
  ctx.save();
  for (let x = -tile - offset; x < w + tile; x += tile) {
    drawThemeSilhouette(x, baseY, tile, height, color, accent, now);
  }
  ctx.restore();
}

function drawThemeSilhouette(x, baseY, width, height, color, accent, now) {
  const theme = state.track.theme;
  ctx.fillStyle = color;
  if (theme === "liberty") {
    ctx.fillRect(x + width * 0.08, baseY - height * 0.62, width * 0.18, height * 0.62);
    ctx.fillRect(x + width * 0.34, baseY - height * 0.88, width * 0.2, height * 0.88);
    ctx.fillRect(x + width * 0.66, baseY - height * 0.54, width * 0.2, height * 0.54);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.34;
    ctx.fillRect(x + width * 0.38, baseY - height * 1.02, width * 0.02, height * 0.2);
    ctx.fillRect(x + width * 0.4, baseY - height * 1.02, width * 0.13, height * 0.07);
  } else if (theme === "global") {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + width * 0.22, baseY - height * 0.48);
    ctx.lineTo(x + width * 0.38, baseY);
    ctx.lineTo(x + width * 0.58, baseY - height * 0.75);
    ctx.lineTo(x + width * 0.86, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = accent;
    ctx.fillRect(x + width * 0.1, baseY - height * 0.2, width * 0.74, 6);
  } else if (theme === "ap") {
    for (let i = 0; i < 4; i += 1) {
      const towerX = x + width * (0.1 + i * 0.22);
      const towerH = height * (0.42 + ((i + 1) % 3) * 0.22);
      ctx.fillRect(towerX, baseY - towerH, width * 0.1, towerH);
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.18 + Math.sin(now / 260 + i) * 0.06;
      ctx.fillRect(towerX + width * 0.025, baseY - towerH + 14, width * 0.05, towerH * 0.55);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
    }
  } else {
    ctx.fillRect(x + width * 0.08, baseY - height * 0.48, width * 0.18, height * 0.48);
    ctx.fillRect(x + width * 0.37, baseY - height * 0.7, width * 0.26, height * 0.7);
    ctx.fillRect(x + width * 0.72, baseY - height * 0.43, width * 0.18, height * 0.43);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 4; i += 1) {
      ctx.fillRect(x + width * (0.4 + i * 0.045), baseY - height * 0.61, width * 0.014, height * 0.44);
    }
  }
  ctx.globalAlpha = 1;
}

function drawGrandstands(w, h, now, accent) {
  const y = h * 0.36;
  const shift = -((state.distance * 0.32) % 168);
  ctx.save();
  for (let x = shift - 168; x < w + 168; x += 168) {
    ctx.fillStyle = "rgba(3,7,20,.82)";
    ctx.beginPath();
    ctx.moveTo(x, y + 52);
    ctx.lineTo(x + 132, y + 36);
    ctx.lineTo(x + 160, y + 76);
    ctx.lineTo(x + 18, y + 94);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.2 + Math.sin(now / 180 + x) * 0.04;
    ctx.fillRect(x + 18, y + 48, 118, 8);
    ctx.globalAlpha = 0.78;
    for (let i = 0; i < 16; i += 1) {
      ctx.fillStyle = ["#66e9ff", "#ffd15c", "#64f0aa", "#ff5f9f"][i % 4];
      ctx.fillRect(x + 22 + i * 7, y + 64 + (i % 2) * 9 + Math.sin(now / 140 + i) * 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawGroundPlane(w, h, accent) {
  const horizon = h * 0.39;
  const palette = {
    regents: ["#071628", "#092137", "#0d2c43"],
    liberty: ["#22170f", "#2a211a", "#3a2e1f"],
    global: ["#092318", "#123326", "#17442f"],
    ap: ["#160b2c", "#21133d", "#2b174d"]
  }[state.track.theme] || ["#071628", "#092137", "#0d2c43"];
  for (let i = 0; i < 16; i += 1) {
    const n1 = i / 16;
    const n2 = (i + 1) / 16;
    const y1 = horizon + Math.pow(n1, 1.45) * (h - horizon + 80);
    const y2 = horizon + Math.pow(n2, 1.45) * (h - horizon + 80);
    const shift = roadCurveAt(state.distance + i * 48, n2) * 0.18;
    ctx.fillStyle = palette[(i + Math.floor(state.distance / 150)) % palette.length];
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(w, y1);
    ctx.lineTo(w + shift * 1.6, y2);
    ctx.lineTo(shift * -1.6, y2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 2;
  const gridShift = (state.distance * 0.42) % 80;
  for (let y = horizon + gridShift; y < h + 80; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + roadCurveAt(state.distance + y, 1) * 0.06);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCourseLights(w, h, now, accent) {
  ctx.save();
  const beat = 0.24 + Math.sin(now / 190) * 0.08;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = beat;
  ctx.lineWidth = 2;
  for (let side of [-1, 1]) {
    ctx.beginPath();
    for (let i = 0; i < 7; i += 1) {
      const n = 0.26 + i * 0.1;
      const p = roadPoint(n, w, h);
      const x = p.x + side * p.roadWidth * (0.58 + i * 0.025);
      const y = p.y - 26 * n;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpeedLines(w, h, accent) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = clamp(state.speed / 2100, 0.08, 0.34);
  ctx.lineWidth = 2;
  for (let i = 0; i < 15; i += 1) {
    const y = h * 0.26 + i * h * 0.038;
    const drift = (state.distance * (0.35 + i * 0.04)) % (w + 260);
    ctx.beginPath();
    ctx.moveTo(-180 + drift, y);
    ctx.lineTo(-20 + drift, y - 10);
    ctx.stroke();
  }
  ctx.restore();
}

function trackPhase() {
  return { regents: 0.1, liberty: 1.25, global: 2.4, ap: 3.55 }[state.track.theme] || 0;
}

function roadCurveAt(distance, n = 0) {
  const sample = trackSample(distance);
  return sample.curve + Math.sin(distance * 0.0038 + n * 2.7 + trackPhase()) * 12 * (1 - n);
}

function roadHillAt(distance, n = 0) {
  const sample = trackSample(distance);
  return sample.hill + Math.sin(distance * 0.002 + trackPhase() + n * 3.1) * 10 * (1 - n);
}

function roadPoint(n, w, h) {
  const horizon = h * 0.385 + Math.sin(state.distance * 0.0008 + trackPhase()) * 11;
  const depth = n * n;
  const ahead = 1 - n;
  const distance = state.distance + ahead * VISIBLE_RANGE * 1.04;
  const sample = trackSample(distance);
  const hill = roadHillAt(distance, n) * (1 - n * 0.42);
  const y = horizon + depth * (h - horizon + 120) - hill;
  const roadWidth = (100 + depth * w * 1.16) * sample.width;
  const curve = roadCurveAt(distance, n) * (0.38 + ahead * 0.72);
  return { x: w / 2 + curve, y, roadWidth };
}

function drawRoad(w, h) {
  const segments = 42;
  for (let i = 0; i < segments; i += 1) {
    const n1 = i / segments;
    const n2 = (i + 1) / segments;
    const p1 = roadPoint(n1, w, h);
    const p2 = roadPoint(n2, w, h);
    const stripe = Math.floor((i + state.distance * 0.036) / 2) % 2;
    const surface = surfaceAt(state.distance + (1 - n1) * VISIBLE_RANGE * 1.04);
    ctx.fillStyle = surface.colors[stripe ? 1 : 0];
    ctx.beginPath();
    ctx.moveTo(p1.x - p1.roadWidth / 2, p1.y);
    ctx.lineTo(p1.x + p1.roadWidth / 2, p1.y);
    ctx.lineTo(p2.x + p2.roadWidth / 2, p2.y);
    ctx.lineTo(p2.x - p2.roadWidth / 2, p2.y);
    ctx.closePath();
    ctx.fill();
    drawRoadEdge(p1, p2, stripe, surface);
  }
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,.36)";
  for (let lane = 1; lane <= 3; lane += 1) {
    for (let i = 6; i < segments - 1; i += 2) {
      const dash = Math.floor(i + state.distance * 0.045) % 5;
      if (dash === 0 || dash === 4) continue;
      const n1 = i / segments;
      const n2 = (i + 1) / segments;
      const p1 = roadPoint(n1, w, h);
      const p2 = roadPoint(n2, w, h);
      const x1 = p1.x - p1.roadWidth / 2 + p1.roadWidth * (lane / 4);
      const x2 = p2.x - p2.roadWidth / 2 + p2.roadWidth * (lane / 4);
      ctx.beginPath();
      ctx.moveTo(x1, p1.y);
      ctx.lineTo(x2, p2.y);
      ctx.stroke();
    }
  }
}

function drawRoadMotion(w, h, now) {
  const speedAlpha = clamp((state.speed - 170) / 650, 0, 0.78);
  if (speedAlpha <= 0.02) return;
  ctx.save();
  ctx.lineCap = "square";
  ctx.globalAlpha = speedAlpha;
  for (let i = 0; i < 18; i += 1) {
    const n = 0.24 + i * 0.044;
    const p = roadPoint(n, w, h);
    const side = i % 2 ? -1 : 1;
    const lane = side * (0.18 + (i % 4) * 0.18);
    const drift = ((state.distance * (0.02 + i * 0.002) + now * 0.03 + i * 41) % 1) - 0.5;
    const x = p.x + (lane + drift * 0.1) * p.roadWidth * 0.28;
    const len = (18 + n * 90) * clamp(state.speed / 610, 0.35, 1.28);
    ctx.strokeStyle = i % 3 === 0 ? state.character.accent : "rgba(248,251,255,.82)";
    ctx.lineWidth = Math.max(1, 2 + n * 5);
    ctx.beginPath();
    ctx.moveTo(x, p.y - len * 0.26);
    ctx.lineTo(x + roadCurveAt(state.distance + i * 35, n) * 0.035, p.y + len);
    ctx.stroke();
  }
  state.roadBursts.forEach((burst) => {
    const p = objectPoint(burst.ahead, burst.lane, w, h);
    if (!p) return;
    ctx.globalAlpha = clamp(burst.life / burst.max, 0, 1) * speedAlpha;
    ctx.strokeStyle = burst.color;
    ctx.lineWidth = Math.max(2, 7 * p.scale);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 28 * p.scale);
    ctx.lineTo(p.x - state.laneVel * 60, p.y + 76 * p.scale);
    ctx.stroke();
  });
  ctx.restore();
}

function drawSpeedPads(w, h, now) {
  const base = Math.floor((state.distance - 260) / 720) * 720 + 240;
  for (let d = base; d < state.distance + VISIBLE_RANGE; d += 720) {
    if (d < state.distance - 40) continue;
    const p = objectPoint(d - state.distance, speedPadLane(d), w, h);
    if (!p) continue;
    const width = 150 * p.scale;
    const height = 72 * p.scale;
    ctx.save();
    ctx.translate(p.x, p.y - 10 * p.scale);
    ctx.globalAlpha = clamp(0.22 + p.n * 0.78, 0.22, 0.96);
    if (ASSETS.speedPads.complete && ASSETS.speedPads.naturalWidth) {
      ctx.rotate(Math.sin(now / 240 + d) * 0.035);
      ctx.drawImage(ASSETS.speedPads, -width / 2, -height / 2, width, height);
    } else {
      ctx.fillStyle = "rgba(102,233,255,.46)";
      ctx.strokeStyle = "#ffd15c";
      ctx.lineWidth = Math.max(1, 3 * p.scale);
      ctx.beginPath();
      ctx.moveTo(-width / 2, height / 2);
      ctx.lineTo(-width * .28, -height / 2);
      ctx.lineTo(width * .28, -height / 2);
      ctx.lineTo(width / 2, height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawTracksideProps(w, h, now) {
  const total = raceDistance();
  const spacing = trackLayout().props || 240;
  const base = Math.floor(state.distance / spacing) * spacing;
  for (let d = base + spacing; d < state.distance + VISIBLE_RANGE; d += spacing) {
    const sample = trackSample(d);
    const side = Math.floor(d / spacing) % 2 ? -1 : 1;
    const lane = side * (1.22 + sample.width * 0.28 + (Math.floor(d / (spacing * 2)) % 2) * 0.16);
    const p = objectPoint(d - state.distance, lane, w, h);
    if (!p) continue;
    const theme = state.track.theme;
    const scale = p.scale;
    if (Math.floor(d / spacing) % 3 === 0) {
      drawBillboard(p.x, p.y - 82 * scale, 96 * scale, 56 * scale, theme, side, now + d);
    } else {
      drawLowPolyTree(p.x, p.y - 48 * scale, 44 * scale, theme);
    }
  }
  const nextFinish = Math.ceil((state.distance + 120) / trackLength()) * trackLength();
  if (nextFinish < total + 20 && nextFinish - state.distance < VISIBLE_RANGE) {
    const p = objectPoint(nextFinish - state.distance, 0, w, h);
    if (p) drawFinishGate(p.x, p.y - 150 * p.scale, p.scale);
  }
}

function drawBillboard(x, y, width, height, theme, side, seed) {
  const accent = themeColors()[2];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side < 0 ? -1 : 1, 1);
  ctx.fillStyle = "rgba(0,0,0,.38)";
  ctx.fillRect(-width * 0.08, height * 0.45, width * 0.16, height * 0.95);
  ctx.fillStyle = "#17315d";
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1.5, width * 0.04);
  roundRect(-width / 2, -height / 2, width, height, height * 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.84)";
  ctx.globalAlpha = 0.88;
  const icon = Math.floor(seed / 260) % 4;
  if (icon === 0) {
    ctx.fillRect(-width * 0.18, -height * 0.18, width * 0.36, height * 0.08);
    ctx.fillRect(-width * 0.18, 0, width * 0.36, height * 0.08);
    ctx.fillRect(-width * 0.18, height * 0.18, width * 0.28, height * 0.08);
  } else if (icon === 1) {
    ctx.beginPath();
    ctx.arc(0, 0, height * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.26);
    ctx.lineTo(0, height * 0.26);
    ctx.moveTo(-height * 0.26, 0);
    ctx.lineTo(height * 0.26, 0);
    ctx.stroke();
  } else if (icon === 2) {
    ctx.beginPath();
    ctx.moveTo(-width * 0.22, height * 0.2);
    ctx.lineTo(0, -height * 0.26);
    ctx.lineTo(width * 0.22, height * 0.2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-width * 0.24, -height * 0.2, width * 0.48, height * 0.36);
    ctx.fillStyle = "#17315d";
    ctx.fillRect(-width * 0.16, -height * 0.12, width * 0.32, height * 0.06);
  }
  ctx.restore();
}

function drawLowPolyTree(x, y, size, theme) {
  const accent = themeColors()[2];
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6d4a24";
  ctx.fillRect(-size * 0.08, size * 0.02, size * 0.16, size * 0.62);
  ctx.fillStyle = theme === "ap" ? "#2c5aa0" : theme === "liberty" ? "#4d7c36" : "#2f8b49";
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.58);
  ctx.lineTo(size * 0.56, size * 0.15);
  ctx.lineTo(0, size * 0.36);
  ctx.lineTo(-size * 0.56, size * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.58);
  ctx.lineTo(size * 0.56, size * 0.15);
  ctx.lineTo(0, size * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFinishGate(x, y, scale) {
  const width = 420 * scale;
  const height = 190 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,.38)";
  ctx.fillRect(-width * 0.52, 0, width * 0.08, height);
  ctx.fillRect(width * 0.44, 0, width * 0.08, height);
  for (let i = 0; i < 10; i += 1) {
    ctx.fillStyle = i % 2 ? "#f8fbff" : "#111827";
    ctx.fillRect(-width * 0.44 + i * width * 0.088, 0, width * 0.088, height * 0.23);
  }
  ctx.strokeStyle = "#ffd15c";
  ctx.lineWidth = Math.max(2, 5 * scale);
  ctx.strokeRect(-width * 0.45, -height * 0.02, width * 0.9, height * 0.27);
  ctx.restore();
}

function drawRoadEdge(p1, p2, stripe, surface = SURFACES.asphalt) {
  ctx.fillStyle = stripe ? colorAlpha(surface.edge, 0.52) : colorAlpha(state.track.accent || surface.edge, 0.42);
  ctx.beginPath();
  ctx.moveTo(p1.x - p1.roadWidth / 2 - 16, p1.y);
  ctx.lineTo(p1.x - p1.roadWidth / 2, p1.y);
  ctx.lineTo(p2.x - p2.roadWidth / 2, p2.y);
  ctx.lineTo(p2.x - p2.roadWidth / 2 - 34, p2.y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(p1.x + p1.roadWidth / 2 + 16, p1.y);
  ctx.lineTo(p1.x + p1.roadWidth / 2, p1.y);
  ctx.lineTo(p2.x + p2.roadWidth / 2, p2.y);
  ctx.lineTo(p2.x + p2.roadWidth / 2 + 34, p2.y);
  ctx.closePath();
  ctx.fill();
}

function objectPoint(ahead, lane, w, h) {
  if (ahead <= -45 || ahead > VISIBLE_RANGE) return null;
  const n = clamp(1 - ahead / VISIBLE_RANGE, 0.04, 1.02);
  const p = roadPoint(n, w, h);
  return {
    x: p.x + lane * p.roadWidth * 0.29,
    y: p.y,
    scale: 0.18 + n * 0.92,
    n
  };
}

function drawVisibleItems(w, h, now) {
  const visible = state.itemBoxes
    .filter((box) => !box.taken && box.distance > state.distance - 40 && box.distance < state.distance + VISIBLE_RANGE)
    .sort((a, b) => b.distance - a.distance);
  visible.forEach((box) => {
    const p = objectPoint(box.distance - state.distance, box.lane, w, h);
    if (!p) return;
    drawItemBox(p.x, p.y - 28 * p.scale, 54 * p.scale, box.item, now + box.id * 200);
  });
}

function drawVisibleRivals(w, h) {
  const total = raceDistance();
  state.rivals
    .filter((rival) => rival.distance < total + 300)
    .map((rival) => ({ rival, ahead: rival.distance - state.distance }))
    .filter((entry) => entry.ahead > 44 && entry.ahead < VISIBLE_RANGE)
    .sort((a, b) => b.ahead - a.ahead)
    .forEach(({ rival, ahead }) => {
      const p = objectPoint(ahead, rival.lane, w, h);
      if (!p || p.y > h - 124) return;
      drawKartSprite(rival.racer, p.x, p.y, p.scale * 0.74, { rival });
    });
}

function drawPlayerKart(w, h) {
  const rumble = state.speed > 300 ? Math.sin(performance.now() / 32) * clamp(state.speed / 760, 0, 1) * 2.5 : 0;
  const baseY = w < 520 ? h - 235 : h - 176;
  const y = baseY - state.hop * 95 + rumble;
  const cameraLean = clamp(roadCurveAt(state.distance + Math.max(120, state.speed * .42), .72) / 260, -1, 1) * Math.min(28, w * .028);
  const roadCenter = roadPoint(1, w, h).x + cameraLean;
  const x = roadCenter + state.lane * Math.min(250, w * 0.24) + Math.sin(state.spin * 22) * state.spin * 18 + Math.sin(state.bump * 26) * state.bump * 16;
  const scale = w < 520 ? Math.max(0.58, Math.min(0.72, w / 640)) : Math.max(0.82, Math.min(1.18, w / 1160));
  if (state.boost > 0) {
    ctx.save();
    if (ASSETS.turboFlames.complete && ASSETS.turboFlames.naturalWidth) {
      ctx.globalAlpha = clamp(0.36 + state.boost * 0.18, 0.42, 0.86);
      ctx.drawImage(ASSETS.turboFlames, x - 160 * scale, y + 38 * scale, 320 * scale, 158 * scale);
    } else {
      ctx.strokeStyle = state.character.accent;
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 10;
      for (let i = 0; i < 6; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x - 105 + i * 42, y + 62);
        ctx.lineTo(x - 170 + i * 28, y + 185);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  if (state.drifting || state.skid > 0.035) {
    ctx.save();
    const spark = state.driftTier >= 3 ? "#66e9ff" : state.driftTier >= 2 ? "#ffd15c" : state.character.accent;
    ctx.globalAlpha = clamp(0.18 + state.skid * 2.4, 0.2, 0.78);
    if (ASSETS.driftSparks.complete && ASSETS.driftSparks.naturalWidth) {
      for (let side of [-1, 1]) {
        ctx.save();
        ctx.translate(x + side * 60 * scale, y + 86 * scale);
        ctx.scale(side, 1);
        ctx.drawImage(ASSETS.driftSparks, -16 * scale, -16 * scale, 92 * scale, 54 * scale);
        ctx.restore();
      }
    } else {
      ctx.strokeStyle = spark;
      ctx.lineWidth = 4;
      for (let side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + side * 48 * scale, y + 86 * scale);
        ctx.lineTo(x + side * (95 + Math.abs(state.laneVel) * 160) * scale, y + (145 + Math.sin(performance.now() / 55) * 10) * scale);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  drawKartSprite(state.character, x, y, scale, { player: true });
  if (state.shield > 0) {
    ctx.save();
    ctx.strokeStyle = "#64f0aa";
    ctx.globalAlpha = 0.42 + Math.sin(performance.now() / 90) * 0.14;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(x, y - 12, 142 * scale, 98 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawKartSprite(racer, x, y, scale, options = {}) {
  const width = (options.player ? 250 : 152) * scale;
  const height = (options.player ? 176 : 108) * scale;
  ctx.save();
  ctx.translate(x, y);
  const lean = options.player ? clamp(state.yaw * 0.58 + state.laneVel * 0.16, -0.34, 0.34) : 0;
  if (options.player) ctx.rotate(lean + Math.sin(state.spin * 28) * state.spin * 0.22);
  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.beginPath();
  ctx.ellipse(0, height * 0.35, width * 0.48, height * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  if (options.rival?.hit > 0) {
    ctx.globalAlpha = 0.68;
    ctx.fillStyle = "rgba(255,255,255,.3)";
    ctx.beginPath();
    ctx.arc(0, -height * 0.15, width * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (options.rival?.boost > 0 || options.rival?.attackFlash > 0) {
    ctx.globalAlpha = options.rival.attackFlash > 0 ? 0.62 : 0.42;
    ctx.strokeStyle = options.rival.attackFlash > 0 ? "#ff5f9f" : racer.accent;
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.beginPath();
    ctx.moveTo(-width * 0.36, height * 0.22);
    ctx.lineTo(-width * 0.72, height * 0.62);
    ctx.moveTo(width * 0.36, height * 0.22);
    ctx.lineTo(width * 0.72, height * 0.62);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  drawGameplayKartSprite(racer, -width * 0.64, -height * 1.02, width * 1.28, height * 1.5);
  if (options.rival && scale > 0.42) {
    const name = racer.name.split(" ").pop().toUpperCase();
    ctx.font = `${Math.max(8, 12 * scale)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    const labelW = Math.min(width, ctx.measureText(name).width + 16 * scale);
    ctx.fillStyle = "rgba(5,8,22,.72)";
    roundRect(-labelW / 2, -height * 1.22, labelW, 18 * scale, 6 * scale);
    ctx.fill();
    ctx.fillStyle = racer.accent;
    ctx.fillText(name, 0, -height * 1.08);
  }
  if (options.player && state.drifting) {
    ctx.strokeStyle = state.driftTier >= 3 ? "#66e9ff" : state.driftTier >= 2 ? "#ffd15c" : racer.accent;
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(-width * 0.42, height * 0.18);
    ctx.lineTo(-width * 0.62, height * 0.46);
    ctx.moveTo(width * 0.42, height * 0.18);
    ctx.lineTo(width * 0.62, height * 0.46);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = racer.accent;
  ctx.globalAlpha = options.player ? 0.45 : 0.28;
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.beginPath();
  ctx.ellipse(0, height * 0.2, width * 0.48, height * 0.16, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawItemBox(x, y, size, item, now) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(now / 280) * 0.16);
  const pulse = 1 + Math.sin(now / 180) * 0.05;
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.62, size * 0.62, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.strokeStyle = item.color;
  ctx.lineWidth = Math.max(2, size * 0.08);
  roundRect(-size / 2, -size / 2, size, size, size * 0.18);
  ctx.fill();
  ctx.stroke();
  if (ASSETS.itemCubes.complete && ASSETS.itemCubes.naturalWidth) {
    ctx.save();
    ctx.globalAlpha = 0.94;
    drawSpriteCover(ASSETS.itemCubes, item.spriteIndex || 0, -size * 0.58, -size * 0.58, size * 1.16, size * 1.16, 4, 2);
    ctx.restore();
  } else {
    drawItemSprite(item, -size * 0.42, -size * 0.42, size * 0.84, size * 0.84, size * 0.12);
  }
  ctx.restore();
}

function drawParticles(w, h) {
  state.particles.forEach((p) => {
    const point = objectPoint(p.ahead, p.lane, w, h);
    if (!point) return;
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(2, point.scale * 7), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawMinimap(w, h) {
  const x = w - 130;
  const y = h - 206;
  const height = 156;
  const width = 86;
  const total = raceDistance();
  const length = trackLength();
  ctx.save();
  ctx.fillStyle = "rgba(5,8,22,.58)";
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 1;
  roundRect(x - width / 2 - 10, y - 12, width + 20, height + 24, 18);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = colorAlpha(state.track.accent || "#66e9ff", 0.76);
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 72; i += 1) {
    const pct = i / 72;
    const sample = trackSample(pct * length);
    const px = x + clamp(sample.curve / 330, -1, 1) * width * 0.36;
    const py = y + height - pct * height;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const drawDot = (distance, color, radius) => {
    const pct = clamp(distance / total, 0, 1);
    const localPct = (trackLocalDistance(distance) / length);
    const sample = trackSample(localPct * length);
    const px = x + clamp(sample.curve / 330, -1, 1) * width * 0.36;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, y + height - pct * height, radius, 0, Math.PI * 2);
    ctx.fill();
  };
  // Draw question gate markers on minimap
  state.questionGates.forEach((gate) => {
    if (gate.triggered) return;
    const gPct = clamp(gate.distance / total, 0, 1);
    const gLocal = trackLocalDistance(gate.distance) / length;
    const gSample = trackSample(gLocal * length);
    const gpx = x + clamp(gSample.curve / 330, -1, 1) * width * 0.36;
    ctx.fillStyle = "#64f0aa";
    ctx.fillRect(gpx - 2, y + height - gPct * height - 2, 4, 4);
  });
  state.rivals.forEach((rival) => drawDot(rival.distance, rival.racer.accent, 4));
  drawDot(state.distance, "#ffffff", 6);
  ctx.restore();
}

function drawRaceOverlay(w, h) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#000";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  // Offroad dust vignette
  if (state.offroad > 0.05) {
    const dustAlpha = clamp(state.offroad * 0.55, 0, 0.32);
    ctx.globalAlpha = dustAlpha;
    const dustGrad = ctx.createRadialGradient(w / 2, h * 0.75, Math.min(w, h) * 0.15, w / 2, h * 0.75, Math.max(w, h) * 0.55);
    dustGrad.addColorStop(0, "rgba(0,0,0,0)");
    dustGrad.addColorStop(1, "rgba(139,152,182,.88)");
    ctx.fillStyle = dustGrad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = 0.18;
  const vignette = ctx.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.18, w / 2, h * 0.55, Math.max(w, h) * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.75)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  if (state.driftCharge > 0) {
    const charge = clamp(state.driftCharge / 1.8, 0, 1);
    ctx.globalAlpha = 0.32 + charge * 0.18;
    ctx.strokeStyle = state.driftCharge > 1.35 ? "#ffd15c" : state.character.accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(72, h - 92, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
    ctx.stroke();
  }
  if (state.countdown > 0) {
    const label = Math.ceil(state.countdown);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(5,8,22,.42)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f8fbff";
    ctx.strokeStyle = state.character.accent;
    ctx.lineWidth = 5;
    ctx.font = "950 108px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(String(label), w / 2, h * 0.44);
    ctx.fillText(String(label), w / 2, h * 0.44);
  }
  ctx.restore();
  drawRacecraftOverlay(w, h);
}

function drawMeter(x, y, width, height, pct, color, label, value) {
  ctx.save();
  ctx.fillStyle = "rgba(5,8,22,.66)";
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 1;
  roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  roundRect(x + 4, y + height - 8, Math.max(3, (width - 8) * clamp(pct, 0, 1)), 4, 3);
  ctx.fill();
  ctx.fillStyle = "#8b98b6";
  ctx.font = "850 9px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + 8, y + 7);
  ctx.fillStyle = "#f8fbff";
  ctx.font = "950 15px Inter, sans-serif";
  ctx.fillText(value, x + 8, y + 20);
  ctx.restore();
}

function drawRacecraftOverlay(w, h) {
  if (!state.running) return;
  const compact = w < 680;
  const panelX = compact ? 10 : 18;
  const panelY = compact ? 150 : 108;
  const sample = trackSample(state.distance + Math.max(420, state.speed * 0.86));
  const curve = clamp(sample.curve / 280, -1, 1);
  const surface = surfaceAt(state.distance + Math.max(140, state.speed * 0.44));
  ctx.save();
  ctx.globalAlpha = state.countdown > 0 ? 0.54 : 0.92;
  ctx.fillStyle = "rgba(5,8,22,.68)";
  ctx.strokeStyle = colorAlpha(state.track.accent, 0.55);
  ctx.lineWidth = 2;
  roundRect(panelX, panelY, compact ? 190 : 238, compact ? 76 : 88, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = state.track.accent || "#66e9ff";
  ctx.font = "950 10px Inter, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("COURSE READ", panelX + 12, panelY + 10);
  ctx.fillStyle = "#f8fbff";
  ctx.font = `950 ${compact ? 15 : 18}px Inter, sans-serif`;
  const arrow = Math.abs(curve) < 0.18 ? "▲" : curve < 0 ? "◀" : "▶";
  ctx.fillText(`${arrow} ${sample.name.toUpperCase().slice(0, compact ? 16 : 22)}`, panelX + 12, panelY + 28);
  ctx.fillStyle = "#8b98b6";
  ctx.font = "850 10px Inter, sans-serif";
  ctx.fillText(`${sample.surface.toUpperCase()} GRIP ${(surface.grip * 100).toFixed(0)}%`, panelX + 12, panelY + (compact ? 53 : 58));
  ctx.strokeStyle = colorAlpha(state.track.accent, 0.82);
  ctx.lineWidth = 4;
  ctx.beginPath();
  const guideY = panelY + (compact ? 66 : 76);
  ctx.moveTo(panelX + 128, guideY);
  ctx.quadraticCurveTo(panelX + 168 + curve * 42, guideY - 34, panelX + (compact ? 180 : 224), guideY - 6);
  ctx.stroke();
  ctx.restore();

  const meterY = compact ? panelY + 84 : panelY + 98;
  drawMeter(panelX, meterY, compact ? 92 : 112, 42, state.draft, "#66e9ff", "DRAFT", state.draftBoost > 0 ? "BOOST" : `${Math.round(state.draft * 100)}%`);
  const driftPct = state.driftCharge ? clamp(state.driftCharge / 3.4, 0, 1) : 0;
  drawMeter(panelX + (compact ? 100 : 120), meterY, compact ? 92 : 124, 42, driftPct, state.driftTier >= 2 ? DRIFT_COLORS[state.driftTier] : state.character.accent, "DRIFT", DRIFT_LABELS[state.driftTier] || "READY");

  if (state.itemRoulette) {
    const rolling = ITEMS[Math.floor(state.itemRoulette.seed) % ITEMS.length];
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.translate(w / 2, compact ? h * 0.37 : h * 0.28);
    ctx.rotate(Math.sin(performance.now() / 80) * 0.08);
    ctx.fillStyle = "rgba(5,8,22,.78)";
    ctx.strokeStyle = rolling.color;
    ctx.lineWidth = 3;
    roundRect(-92, -30, 184, 60, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f8fbff";
    ctx.font = "950 17px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`ROLLING ${rolling.short.toUpperCase()}`, 0, 0);
    ctx.restore();
  }
}

function drawToast(w, h) {
  if (!state.toastTime) return;
  ctx.save();
  ctx.globalAlpha = clamp(state.toastTime, 0, 1);
  ctx.fillStyle = "rgba(5,8,22,.72)";
  ctx.strokeStyle = state.character.accent;
  ctx.lineWidth = 2;
  const text = state.toast;
  ctx.font = "950 34px Inter, sans-serif";
  ctx.textAlign = "center";
  const width = Math.min(w - 40, ctx.measureText(text).width + 54);
  roundRect(w / 2 - width / 2, h * 0.18, width, 58, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f8fbff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h * 0.18 + 30);
  ctx.restore();
}

function spriteRect(image, sprite, columns = 2, rows = 2) {
  const source = image.keyed || image;
  const naturalWidth = source.naturalWidth || source.width;
  const naturalHeight = source.naturalHeight || source.height;
  if (!naturalWidth || !naturalHeight) return null;
  if (typeof sprite === "number") {
    const cellW = naturalWidth / columns;
    const cellH = naturalHeight / rows;
    const col = sprite % columns;
    const row = Math.floor(sprite / columns) % rows;
    return { source, sx: col * cellW, sy: row * cellH, sw: cellW, sh: cellH };
  }
  const halfW = naturalWidth / 2;
  const halfH = naturalHeight / 2;
  const col = String(sprite).startsWith("100") ? 1 : 0;
  const row = String(sprite).endsWith("100%") ? 1 : 0;
  return { source, sx: col * halfW, sy: row * halfH, sw: halfW, sh: halfH };
}

function drawSpriteCover(image, sprite, x, y, width, height, columns = 2, rows = 2) {
  const rect = spriteRect(image, sprite, columns, rows);
  if (!rect) return false;
  const sourceRatio = rect.sw / rect.sh;
  const targetRatio = width / height;
  let sx = rect.sx;
  let sy = rect.sy;
  let sw = rect.sw;
  let sh = rect.sh;
  if (sourceRatio > targetRatio) {
    sw = sh * targetRatio;
    sx += (rect.sw - sw) / 2;
  } else {
    sh = sw / targetRatio;
    sy += (rect.sh - sh) / 2;
  }
  ctx.drawImage(rect.source, sx, sy, sw, sh, x, y, width, height);
  return true;
}

function drawSpriteStretch(image, sprite, x, y, width, height, columns = 2, rows = 2) {
  const rect = spriteRect(image, sprite, columns, rows);
  if (!rect) return false;
  ctx.drawImage(rect.source, rect.sx, rect.sy, rect.sw, rect.sh, x, y, width, height);
  return true;
}

function drawGameplayKartSprite(racer, x, y, width, height) {
  if (hasCompleteKartSheet(ASSETS.lowpolyKarts)) {
    drawSpriteContain(ASSETS.lowpolyKarts, racer.spriteIndex, x, y, width, height, 4, 2);
    return;
  }
  if (ASSETS.gameplayKarts.complete && ASSETS.gameplayKarts.naturalWidth) {
    drawSpriteContain(ASSETS.gameplayKarts, racer.spriteIndex, x, y, width, height, 4, 2);
    return;
  }
  drawRacerSprite(racer, x, y, width, height, height * 0.14);
}

function hasCompleteKartSheet(image) {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) return false;
  return image.naturalWidth / image.naturalHeight < 2;
}

function drawRacerSprite(racer, x, y, width, height, radius) {
  if (!ASSETS.racers.complete || !ASSETS.racers.naturalWidth) return;
  ctx.save();
  roundRect(x, y, width, height, radius);
  ctx.clip();
  drawSpriteCover(ASSETS.racers, racer.spriteIndex, x, y, width, height, 4, 2);
  const shine = ctx.createLinearGradient(x, y, x + width, y + height);
  shine.addColorStop(0, "rgba(255,255,255,.18)");
  shine.addColorStop(0.5, "rgba(255,255,255,0)");
  shine.addColorStop(1, "rgba(0,0,0,.28)");
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

function drawSpriteContain(image, sprite, x, y, width, height, columns = 2, rows = 2) {
  const rect = spriteContentRect(image, sprite, columns, rows);
  if (!rect) return false;
  const sourceRatio = rect.sw / rect.sh;
  const targetRatio = width / height;
  const drawWidth = sourceRatio > targetRatio ? width : height * sourceRatio;
  const drawHeight = sourceRatio > targetRatio ? width / sourceRatio : height;
  ctx.drawImage(rect.source, rect.sx, rect.sy, rect.sw, rect.sh, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  return true;
}

function spriteContentRect(image, sprite, columns = 2, rows = 2) {
  const rect = spriteRect(image, sprite, columns, rows);
  if (!rect || typeof rect.source.getContext !== "function") return rect;
  let cache = spriteBoundsCache.get(rect.source);
  if (!cache) {
    cache = new Map();
    spriteBoundsCache.set(rect.source, cache);
  }
  const cacheKey = `${rect.sx}:${rect.sy}:${rect.sw}:${rect.sh}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const sourceContext = rect.source.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) return rect;
  const sx = Math.floor(rect.sx);
  const sy = Math.floor(rect.sy);
  const sw = Math.floor(rect.sw);
  const sh = Math.floor(rect.sh);
  let minX = sw;
  let minY = sh;
  let maxX = 0;
  let maxY = 0;
  try {
    const data = sourceContext.getImageData(sx, sy, sw, sh).data;
    for (let pixelY = 0; pixelY < sh; pixelY += 1) {
      for (let pixelX = 0; pixelX < sw; pixelX += 1) {
        const alpha = data[(pixelY * sw + pixelX) * 4 + 3];
        if (alpha <= 18) continue;
        minX = Math.min(minX, pixelX);
        minY = Math.min(minY, pixelY);
        maxX = Math.max(maxX, pixelX);
        maxY = Math.max(maxY, pixelY);
      }
    }
  } catch {
    cache.set(cacheKey, rect);
    return rect;
  }
  if (maxX <= minX || maxY <= minY) {
    cache.set(cacheKey, rect);
    return rect;
  }
  const pad = Math.max(8, Math.round(Math.max(sw, sh) * .035));
  const contentMinX = Math.max(0, minX - pad);
  const contentMinY = Math.max(0, minY - pad);
  const contentMaxX = Math.min(sw, maxX + pad);
  const contentMaxY = Math.min(sh, maxY + pad);
  const content = {
    source: rect.source,
    sx: sx + contentMinX,
    sy: sy + contentMinY,
    sw: contentMaxX - contentMinX,
    sh: contentMaxY - contentMinY
  };
  cache.set(cacheKey, content);
  return content;
}

function drawItemSprite(item, x, y, width, height, radius) {
  if (!ASSETS.items.complete || !ASSETS.items.naturalWidth) return;
  ctx.save();
  roundRect(x, y, width, height, radius);
  ctx.clip();
  drawSpriteCover(ASSETS.items, item.spriteIndex, x, y, width, height, 2, 2);
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

document.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.add(key);
  if (state.quizOpen) {
    if (/^[abcd]$/i.test(event.key)) {
      gradeAnswer(event.key.toUpperCase().charCodeAt(0) - 65);
      event.preventDefault();
    } else if (event.key === "ArrowLeft") {
      state.selected = Math.max(0, state.selected - 1);
      refreshAnswers();
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      state.selected = Math.min(3, state.selected + 1);
      refreshAnswers();
      event.preventDefault();
    } else if (event.key === "Enter" || event.key === " ") {
      gradeAnswer(state.selected);
      event.preventDefault();
    } else if (event.key === "Escape" || event.key === "Tab") {
      skipQuestion();
      event.preventDefault();
    }
    return;
  }
  if (!els.raceScreen.classList.contains("active")) return;
  if (event.key === "c" || event.key === "C" || event.key === "Shift") {
    openItemQuestion();
    event.preventDefault();
  } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "x", "X", "j", "J"].includes(event.key)) {
    event.preventDefault();
  } else if (event.key === "m" || event.key === "M") {
    toggleMute();
    event.preventDefault();
  } else if (event.key === "Escape") {
    state.paused = !state.paused;
    els.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
  }
});

document.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

function updateDrivePointer(event) {
  const rect = els.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const steer = clamp((x / rect.width - 0.5) * 2.6, -1, 1);
  state.touch.steer = Math.abs(steer) < 0.1 ? 0 : steer;
  state.touch.gas = true;
  state.touch.brake = y > rect.height * 0.82;
  state.touch.drift = y > rect.height * 0.58 && Math.abs(steer) > 0.28;
  keys.add("ArrowUp");
  keys.delete("ArrowLeft");
  keys.delete("ArrowRight");
  keys.delete(" ");
  if (x < rect.width * 0.44) keys.add("ArrowLeft");
  else if (x > rect.width * 0.56) keys.add("ArrowRight");
  if (y > rect.height * 0.58 && (x < rect.width * 0.38 || x > rect.width * 0.62)) keys.add(" ");
}

function clearDrivePointer() {
  drivePointerId = null;
  state.touch.steer = 0;
  state.touch.gas = false;
  state.touch.brake = false;
  state.touch.drift = false;
  keys.delete("ArrowLeft");
  keys.delete("ArrowRight");
  keys.delete("ArrowUp");
  keys.delete(" ");
}

els.canvas.addEventListener("pointerdown", (event) => {
  if (!state.running || state.quizOpen) return;
  const rect = els.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  if (x > rect.width * 0.43 && x < rect.width * 0.57 && state.item) {
    openItemQuestion();
    return;
  }
  drivePointerId = event.pointerId;
  els.canvas.setPointerCapture?.(event.pointerId);
  updateDrivePointer(event);
});

els.canvas.addEventListener("pointermove", (event) => {
  if (drivePointerId !== event.pointerId || !state.running || state.quizOpen) return;
  updateDrivePointer(event);
});

els.canvas.addEventListener("pointerup", () => {
  clearDrivePointer();
});
els.canvas.addEventListener("pointercancel", () => {
  clearDrivePointer();
});

document.querySelectorAll("[data-hold-key]").forEach((button) => {
  const key = button.dataset.holdKey === "space" ? " " : button.dataset.holdKey;
  const syncTouch = () => {
    state.touch.steer = (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
    state.touch.gas = keys.has("ArrowUp");
    state.touch.brake = keys.has("ArrowDown");
    state.touch.drift = keys.has("x") || keys.has(" ");
    state.touch.jump = keys.has("j");
  };
  const press = (event) => {
    event.preventDefault();
    keys.add(key);
    syncTouch();
    button.classList.add("active");
  };
  const release = (event) => {
    event.preventDefault();
    keys.delete(key);
    syncTouch();
    button.classList.remove("active");
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

document.querySelector("[data-tap-item]")?.addEventListener("click", (event) => {
  event.preventDefault();
  openItemQuestion();
});

els.itemBtn.addEventListener("click", openItemQuestion);
els.skipBtn?.addEventListener("click", skipQuestion);
els.muteBtn?.addEventListener("click", toggleMute);
els.chooseDriverBtn.addEventListener("click", () => {
  showScreen(els.trackScreen);
  updateTopStats();
});
els.pauseBtn.addEventListener("click", () => {
  state.paused = !state.paused;
  els.pauseBtn.textContent = state.paused ? "Resume" : "Pause";
});
els.quitBtn.addEventListener("click", () => {
  state.running = false;
  gpState.active = false;
  closeItemQuestion();
  showScreen(els.trackScreen);
  if (engineGain) engineGain.gain.value = 0;
});
els.againBtn.addEventListener("click", () => {
  // If GP active and more races remain
  if (gpState.active && gpState.raceIndex < gpState.tracks.length) {
    startRace(gpState.tracks[gpState.raceIndex]);
  } else if (raceFormat === "gp" && !gpState.active) {
    startGrandPrix();
  } else {
    showScreen(els.trackScreen);
  }
});
els.backToCharacters.addEventListener("click", () => showScreen(els.characterScreen));
addEventListener("resize", resizeCanvas, { passive: true });

if (params.get("debug") === "1") {
  window.__RegentsRally64 = {
    state,
    startRace,
    triggerItemClue() {
      if (!state.running) startRace();
      state.item = ITEMS[0];
      updateItemHud();
      openItemQuestion();
    },
    metrics() {
      return {
        running: state.running,
        speed: Math.round(state.speed),
        place: state.place,
        draft: Number(state.draft.toFixed(2)),
        draftBoost: Number(state.draftBoost.toFixed(2)),
        nearMisses: state.racecraft.nearMisses,
        roulette: Boolean(state.itemRoulette),
        item: state.item?.id || null
      };
    }
  };
}

renderCharacters();
renderTracks();
setupModeUI();
loadBanks().catch(() => {
  els.topStats.innerHTML = "<span>Powerup clues failed to load</span>";
});
