/* Mr. Mac's Arcade — Player Profile Module
 *
 * 100% local-only. Reads + writes localStorage on the player's device.
 * No telemetry, no remote sync, no network calls.
 *
 * Exposes a single global: window.MrMacsProfile
 *
 * ============================================================================
 * localStorage keys used by this module
 * ============================================================================
 *   "mr-macs-arcade-roster-v1" — full roster: { activeId, profiles: { [id]: profile } }
 *   "mr-macs-arcade-profile-v1" — legacy single-profile blob (read-only after migration)
 *
 * ============================================================================
 * Public API surface (see JSDoc on each method for full contract)
 * ============================================================================
 *   Core
 *     get(), exists(), set(partial), reset()
 *     getName() / setName(str)
 *     getAvatar() / setAvatar(charOrUrl, kind)
 *     getCourse() / setCourse(name)
 *     getTestPrep() / setTestPrep({ date, name })
 *
 *   Wallet + shop
 *     getShards(), addShards(n, source), spendShards(n, source)
 *     getInventory()
 *     SHOP_ITEMS, getShopSpec(itemId)
 *     buyItem(itemId), consumeItem(itemId)
 *     extendBuff(itemId, ms), dispelBuff(itemId)
 *     getActiveBuffs()
 *
 *   Achievements
 *     unlock(id, [extra]), bumpAchievement(id, by)
 *     hasAchievement(id), listAchievements()
 *     unlockGameAchievement(gameId, achievementId)
 *
 *   Plays + streak
 *     recordPlay(meta), recordCompletion(gameId, score)
 *     getRecent(limit), getStreak()
 *
 *   Daily challenge
 *     getDailyChallengeState(), claimDailyChallenge(meta)
 *     getDailyChallengeStreak(), getDailyChallengeMissed()
 *
 *   Topic stats + spaced repetition
 *     recordAnswer(meta), recordScholarCorrect(gameId)
 *     getTopicStats(course), getWrongQueue(limit)
 *     removeWrongAnswer(prompt), gradeWrongAnswer(prompt, recall)
 *     getMasteredCards(limit), getDueWrongAnswers(limit), clearWrongQueue()
 *
 *   Cram + diagnostic + mock exam
 *     recordCramRun(entry), getCramHistory()
 *     setDiagnostic(results), getDiagnostic()
 *     recordMockExam(meta), getMockExamHistory(limit)
 *
 *   Tour
 *     hasSeenTour(gameId), markTourSeen(gameId), resetTour(gameId)
 *
 *   Settings
 *     getSettings(), setSettings(partial)
 *
 *   Events
 *     on(event, handler), off(event, handler), once(event, handler)
 *     eventNames()
 *
 *   Lifetime stats / export / import
 *     getLifetimeStats(), getTopGames(n)
 *     exportProfile(), importProfile(jsonStr)
 *     resetProfile({ confirm: true })
 *
 *   Multi-profile roster
 *     roster.list(), roster.getActiveId()
 *     roster.create(opts), roster.switch(id), roster.remove(id), roster.rename(id, name)
 *     roster.count()
 *
 *   Constants
 *     AVATARS, ACHIEVEMENTS, DEFAULT_SETTINGS
 *
 * ============================================================================
 * Events emitted (CustomEvent.detail shape)
 * ============================================================================
 *   "profile:update"      { profile }
 *   "profile:create"      { profile }                    (first-time setup)
 *   "wallet:change"       { delta, total, source, lucky?, doubler? }
 *   "achievement:unlock"  { id, def, unlockedAt }
 *   "settings:change"     { settings }
 *   "streak:advance"      { current, best, shieldUsed? }
 *   "course:change"       { course, previous }
 *   "testprep:change"     { date, name }
 *   "inventory:change"    { item?, source, inventory }
 *   "answer:record"       { course, set, correct }
 *   "daily:claim"         { gameId, payout, doubled }
 *   "roster:change"       { activeId, list }
 *   "profile:import"      { profile }
 *   "profile:wipe"        {}
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mr-macs-arcade-profile-v1";  // legacy single-profile key (read-only after migration)
  var ROSTER_KEY = "mr-macs-arcade-roster-v1";    // roster: { activeId, profiles: { [id]: profile } }
  var DEFAULT_PROFILE_ID = "p_default";
  var CURRENT_VERSION = 3;
  var EVENT_TARGET = (typeof window !== "undefined" && window) ? new EventTarget() : null;

  // Track which event names we've ever seen via on/once for eventNames() debug helper
  var KNOWN_EVENTS = {
    "profile:update": true, "profile:create": true, "profile:import": true, "profile:wipe": true,
    "wallet:change": true, "achievement:unlock": true, "settings:change": true,
    "streak:advance": true, "course:change": true, "testprep:change": true,
    "inventory:change": true, "answer:record": true, "daily:claim": true, "roster:change": true
  };

  // ============== Achievement registry (seeded; each game adds via unlock()) ==============

  var ACHIEVEMENTS = [
    // ---- Onboarding ----
    { id: "first-name",        title: "Welcome, Hunter",     desc: "Set up your trainer profile.",                     tier: "bronze",    icon: "🎓" },
    { id: "first-play",        title: "First Mission",       desc: "Open your first game.",                            tier: "bronze",    icon: "🎮" },
    { id: "first-correct",     title: "First Strike",        desc: "Answer your first question correctly.",            tier: "bronze",    icon: "✅" },
    { id: "settings-tuned",    title: "Tuned In",             desc: "Open the settings drawer.",                        tier: "bronze",    icon: "⚙" },

    // ---- Streaks ----
    { id: "streak-3",          title: "Three-Day Hunt",       desc: "Play 3 days in a row.",                            tier: "silver",    icon: "🔥" },
    { id: "streak-7",          title: "Week Warrior",         desc: "Play 7 days in a row.",                            tier: "gold",      icon: "🔥" },
    { id: "streak-30",         title: "Marathon Mind",        desc: "Play 30 days in a row.",                           tier: "legendary", icon: "🏆" },

    // ---- Jeopardy ----
    { id: "jeopardy-clear",    title: "Board Wipe",            desc: "Answer every clue on a board.",                    tier: "silver",    icon: "🧠" },
    { id: "jeopardy-final",    title: "Final Answer",          desc: "Win Final Jeopardy.",                              tier: "silver",    icon: "💡" },
    { id: "jeopardy-streak-10",title: "Hot Hand",              desc: "Get 10 Jeopardy answers correct in a row.",        tier: "gold",      icon: "🔥" },
    { id: "jeopardy-master",   title: "Quizmaster",            desc: "Clear 25 Jeopardy boards.",                        tier: "legendary", icon: "🏆" },

    // ---- Boss Rush ----
    { id: "boss-first",        title: "First Boss Down",       desc: "Defeat any boss in Boss Rush.",                    tier: "silver",    icon: "💥" },
    { id: "boss-perfect",      title: "Untouched Sage",        desc: "Defeat a boss without taking damage.",             tier: "gold",      icon: "🛡" },
    { id: "boss-final-form",   title: "Final Form",            desc: "Beat Boss Rush on Final Form difficulty.",         tier: "legendary", icon: "👑" },

    // ---- Pacman / Maze Chase ----
    { id: "maze-level-5",      title: "Pellet Pilgrim",        desc: "Reach level 5 in Review Maze Chase.",              tier: "silver",    icon: "👻" },
    { id: "maze-fruit-king",   title: "Fruit King",            desc: "Eat 10 fruit in a single run.",                    tier: "gold",      icon: "🍒" },

    // ---- Mario Kart / Regents Rally ----
    { id: "rally-podium",      title: "On the Podium",         desc: "Finish 1st in any Rally race.",                    tier: "silver",    icon: "🥇" },
    { id: "rally-gp-150",      title: "150cc Champion",        desc: "Win a Grand Prix at 150cc.",                       tier: "gold",      icon: "🏁" },
    { id: "rally-mirror",      title: "Mirror Master",         desc: "Win a Grand Prix in Mirror mode.",                 tier: "legendary", icon: "🪞" },

    // ---- Pokemon / History Hunters ----
    { id: "hh-first-catch",    title: "First Capture",         desc: "Catch your first historical figure.",              tier: "bronze",    icon: "⚱" },
    { id: "hh-roster-6",       title: "Full Party",            desc: "Build a roster of 6 figures.",                     tier: "silver",    icon: "🎴" },
    { id: "hh-rare",           title: "Legendary Encounter",   desc: "Catch a rare figure.",                             tier: "gold",      icon: "✨" },
    { id: "hh-codex-complete", title: "Codex Complete",        desc: "Catch every figure in your region.",               tier: "legendary", icon: "📖" },

    // ---- Space Invaders / Cold War Invaders ----
    { id: "cwi-mission-clear", title: "Mission Cleared",       desc: "Clear a 5-wave mission.",                          tier: "silver",    icon: "🛸" },
    { id: "cwi-no-shield",     title: "Shieldless Run",        desc: "Beat a mission without rebuilding bunkers.",       tier: "gold",      icon: "🚀" },

    // ---- Tower Defense / Chrono Defense ----
    { id: "td-wave-30",        title: "Last Wave Standing",    desc: "Survive wave 30 on any map.",                      tier: "gold",      icon: "🛕" },
    { id: "td-perfect-base",   title: "Untouched Base",        desc: "Beat a map without losing base HP.",               tier: "legendary", icon: "🏰" },

    // ---- Pinball / Chrono Pinball ----
    { id: "pinball-multiball", title: "Multiball Mayhem",      desc: "Trigger multiball.",                               tier: "silver",    icon: "🎱" },
    { id: "pinball-wizard",    title: "Wizard Mode",            desc: "Reach Wizard Mode.",                               tier: "legendary", icon: "🧙" },

    // ---- 4X / Empire Ascendant ----
    { id: "empire-found",      title: "First Settlement",      desc: "Found your first city.",                           tier: "bronze",    icon: "🏛" },
    { id: "empire-victory",    title: "Era Conqueror",         desc: "Win an Empire Ascendant game (any victory).",      tier: "gold",      icon: "👑" },

    // ---- Endless Runner / Timeline Runner ----
    { id: "tr-distance-5km",   title: "Five Klick Sprint",     desc: "Run 5 km in a single run.",                        tier: "silver",    icon: "🏃" },
    { id: "tr-all-eras",       title: "Across the Eras",       desc: "Collect all 5 era keys in one run.",               tier: "gold",      icon: "🗝" },

    // ---- Vampire Survivors / Time Rift ----
    { id: "tr-survivor-15",    title: "Quarter Hour Survivor", desc: "Survive 15 minutes in Time Rift.",                 tier: "gold",      icon: "⏳" },
    { id: "tr-evolution",      title: "Weapon Evolved",        desc: "Evolve a weapon.",                                 tier: "silver",    icon: "⚔" },

    // ---- Battle Game / Arcade Duel ----
    { id: "duel-flawless",     title: "Flawless Round",        desc: "Win a round without taking damage.",               tier: "silver",    icon: "🥊" },
    { id: "duel-ladder",       title: "Era Ladder Climb",      desc: "Defeat all 7 ladder opponents.",                   tier: "legendary", icon: "🏆" },

    // ---- New flagship arcade games (May 2026 sweep) ----
    { id: "brickoria-clear",   title: "Wall Breaker",          desc: "Clear an era stage in Brickoria.",                 tier: "silver",    icon: "🧱" },
    { id: "stellar-mothership",title: "Mothership Down",       desc: "Defeat the Misconception Mothership in Stellar Drift.", tier: "gold",  icon: "🛸" },
    { id: "snake-tail-50",     title: "Long Tail",             desc: "Grow Source Snake to 50 segments.",                tier: "silver",    icon: "🐍" },
    { id: "chronoblocks-tetris",title: "Chronostack",          desc: "Clear four lines at once in Chronoblocks.",        tier: "gold",      icon: "🟦" },
    { id: "cascade-rainbow",   title: "Spectral Drop",         desc: "Pop a rainbow wildcard cluster in Cascade.",       tier: "silver",    icon: "🌈" },
    { id: "chronohop-pads",    title: "Lily Pad Five",         desc: "Fill all five lily pads in Chronohop.",            tier: "gold",      icon: "🐸" },
    { id: "step-pyramid-clear",title: "Pyramid Cleared",       desc: "Clear an entire pyramid in Step Pyramid.",         tier: "silver",    icon: "🔺" },
    { id: "step-pyramid-lured",title: "Lured Coily",           desc: "Trick Coily off the pyramid in Step Pyramid.",     tier: "gold",      icon: "🌀" },
    { id: "citadel-cascade",   title: "Mega Cascade",          desc: "Trigger a 4x cascade in Citadel.",                 tier: "gold",      icon: "💎" },
    { id: "rumor-fact-spare",  title: "Truth Sentinel",        desc: "Spare 25 verified facts in Rumor Whack.",          tier: "silver",    icon: "🛡" },
    { id: "scholar-decoder",   title: "Scholar Decoder",       desc: "Answer 50 scholar prompts correctly across all games.", tier: "gold", icon: "🎓" },

    // ---- Per-flagship depth (round-2 achievements) ----
    // Brickoria depth
    { id: "brickoria-boss",       title: "Scholar Boss Down",     desc: "Defeat a scholar boss in Brickoria.",                tier: "gold",      icon: "🧱" },
    // Stellar Drift depth
    { id: "stellar-no-hyperspace",title: "Pure Pilot",            desc: "Clear 5 waves without using hyperspace in Stellar Drift.", tier: "gold", icon: "🚀" },
    // Source Snake depth
    { id: "snake-no-power",       title: "Bare Fang",             desc: "Reach 30 segments without picking up any power-up.", tier: "gold",      icon: "🐍" },
    // Chronoblocks depth
    { id: "chronoblocks-100-lines",title: "Centurion Stacker",    desc: "Clear 100 lines in a single Chronoblocks run.",      tier: "legendary", icon: "🟦" },
    // Cascade depth
    { id: "cascade-pressure-zero",title: "Pressure Released",     desc: "Pop a cluster while under final-row pressure in Cascade.", tier: "gold", icon: "🫧" },
    // Chronohop depth
    { id: "chronohop-no-shield",  title: "Naked Hop",             desc: "Fill all 5 lily pads without using a shield in Chronohop.", tier: "gold", icon: "🐸" },
    // Step Pyramid extra
    { id: "step-pyramid-disc-double", title: "Twin Disc",         desc: "Use both discs in a single Step Pyramid level.",     tier: "silver",    icon: "🌀" },
    // Citadel depth
    { id: "citadel-codex",        title: "Codex Forged",          desc: "Forge a Codex (5-match line) in Citadel.",           tier: "gold",      icon: "📖" },
    // Rumor Whack depth
    { id: "rumor-50-streak",      title: "Truth Streak",          desc: "Hit a 50-rumor combo in Rumor Whack.",               tier: "legendary", icon: "🔨" },
    // Galaxy Defender depth
    { id: "galaxy-mothership",    title: "Mothership Down (GD)",  desc: "Defeat the Misinfo Mothership in Galaxy Defender.",  tier: "gold",      icon: "🛸" },
    { id: "galaxy-no-shield",     title: "Bare Cockpit",          desc: "Clear stage 5 without picking up a shield in Galaxy Defender.", tier: "gold", icon: "🚀" },
    // Echo Hall depth
    { id: "echo-hard-mode",       title: "Echo Master",           desc: "Reach hard mode (round 8) in Echo Hall.",            tier: "silver",    icon: "🎶" },
    { id: "echo-reverse-clear",   title: "Reverse Echo",          desc: "Complete a reverse round in Echo Hall.",             tier: "silver",    icon: "⏪" },
    // Sokoban Scribe depth
    { id: "sokoban-l10",          title: "Scribe Initiate",       desc: "Clear level 10 in Sokoban Scribe.",                  tier: "silver",    icon: "🧱" },
    { id: "sokoban-no-undo",      title: "First Try Scribe",      desc: "Clear any level without undoing in Sokoban Scribe.", tier: "gold",      icon: "📜" },
    // Centiquill depth
    { id: "centiquill-page-flip", title: "Page Flipper",          desc: "Use a Page Flip power-up in Centiquill.",            tier: "silver",    icon: "📄" },
    { id: "centiquill-stage-5",   title: "Editor's Edge",         desc: "Clear stage 5 in Centiquill.",                       tier: "gold",      icon: "✒" },
    // Anagram Atlas depth
    { id: "anagram-perfect",      title: "Perfect Anagram",       desc: "Solve a 12+ letter term in Anagram Atlas.",          tier: "gold",      icon: "🔤" },
    { id: "anagram-no-hint",      title: "Pure Mind",             desc: "Solve 10 terms in a row without using a hint in Anagram Atlas.", tier: "gold", icon: "🧠" },

    // ---- Cross-arcade ----
    { id: "cross-3-genres",    title: "Genre-Hopper",          desc: "Play 3 different flagship games.",                 tier: "silver",    icon: "🎲" },
    { id: "cross-7-genres",    title: "Cabinet Curator",       desc: "Play 7 different flagship games.",                 tier: "gold",      icon: "🕹" },
    { id: "cross-12-genres",   title: "Arcade Polymath",       desc: "Play 12 different flagship games.",                tier: "legendary", icon: "🏛" },
    { id: "cross-15-genres",   title: "Cabinet Master",        desc: "Play 15 different flagship games.",                tier: "legendary", icon: "🏛" },
    { id: "cross-shards-1k",   title: "Shard Hoarder",         desc: "Earn 1,000 lifetime shards.",                      tier: "gold",      icon: "💎" },
    { id: "cross-shards-10k",  title: "Treasure Vault",        desc: "Earn 10,000 lifetime shards.",                     tier: "legendary", icon: "💰" },
    { id: "cross-cram",        title: "Cram Sesh",             desc: "Complete a 4-game Cram Mode playlist.",            tier: "gold",      icon: "📚" },
    { id: "cross-100-plays",   title: "Centurion",             desc: "Log 100 total plays across the arcade.",           tier: "gold",      icon: "💯" },
    { id: "cross-daily-7",     title: "Daily Dispatch",        desc: "Complete the Daily Challenge 7 days.",             tier: "gold",      icon: "📰" },
    { id: "cross-daily-30",    title: "Daily Disciple",        desc: "Complete the Daily Challenge 30 days.",            tier: "legendary", icon: "🗞" },
    { id: "cross-shop-spender",title: "Shop Patron",           desc: "Spend 1,000 shards in the power-up shop.",         tier: "silver",    icon: "🛒" },

    // ---- Hidden / Easter eggs ----
    { id: "code-master",       title: "Code Master",            desc: "Discovered the secret konami sequence.",           tier: "gold",      icon: "🎮" },
    { id: "click-whisperer",   title: "Click Whisperer",        desc: "Clicked the brand mark seven times in five seconds.", tier: "silver", icon: "🪄" },
    { id: "fortune-seeker",    title: "Fortune Seeker",         desc: "Read 30 different daily fortunes.",                tier: "silver",    icon: "🔮" },
    { id: "early-bird",        title: "Early Bird",             desc: "Played a game between 5 AM and 7 AM.",             tier: "silver",    icon: "🌅" },
    { id: "weekend-warrior",   title: "Weekend Warrior",        desc: "Played on both Saturday and Sunday in one week.",  tier: "silver",    icon: "🛡" }
  ];

  var ACHIEVEMENT_INDEX = {};
  ACHIEVEMENTS.forEach(function (a) { ACHIEVEMENT_INDEX[a.id] = a; });

  var AVATARS = [
    { id: "scholar",  emoji: "🎓", label: "Scholar"  },
    { id: "explorer", emoji: "🧭", label: "Explorer" },
    { id: "scribe",   emoji: "📜", label: "Scribe"   },
    { id: "wizard",   emoji: "🧙", label: "Wizard"   },
    { id: "owl",      emoji: "🦉", label: "Owl"      },
    { id: "fox",      emoji: "🦊", label: "Fox"      },
    { id: "lion",     emoji: "🦁", label: "Lion"     },
    { id: "dragon",   emoji: "🐉", label: "Dragon"   },
    { id: "phoenix",  emoji: "🔥", label: "Phoenix"  },
    { id: "compass",  emoji: "🧭", label: "Pathfinder" },
    { id: "bookworm", emoji: "📚", label: "Bookworm" },
    { id: "atom",     emoji: "⚛",  label: "Atom"     },
    { id: "globe",    emoji: "🌍", label: "Globe"    },
    { id: "hero",     emoji: "🦸", label: "Hero"     },
    { id: "ninja",    emoji: "🥷", label: "Ninja"    },
    { id: "rocket",   emoji: "🚀", label: "Rocket"   },
    { id: "telescope",emoji: "🔭", label: "Stargazer" },
    { id: "amulet",   emoji: "🔱", label: "Trident"  },
    { id: "amphora",  emoji: "🏺", label: "Amphora"  },
    { id: "scroll",   emoji: "🪶", label: "Quill"    },
    { id: "key",      emoji: "🗝",  label: "Keykeeper"},
    { id: "crown",    emoji: "👑", label: "Sovereign"},
    { id: "shield",   emoji: "🛡",  label: "Defender" },
    { id: "spark",    emoji: "✨", label: "Spark"    }
  ];

  var DEFAULT_SETTINGS = {
    motion: "auto",
    sound: "on",
    musicVolume: 0.55,
    sfxVolume: 0.75,
    fontFamily: "default",
    colorblind: "off",
    contrast: "normal"
  };

  // Items whose "inventory" entry is a timestamp deadline rather than a count.
  // Buffs are extended (cumulative) rather than stacked.
  var TIMED_BUFFS = {
    luckyCharm:  { field: "luckyCharmExpiresAt",  durationMs: 24 * 3600 * 1000, label: "Lucky Charm",  effect: "2x shards" },
    coinDoubler: { field: "coinDoublerExpiresAt", durationMs: 4  * 3600 * 1000, label: "Coin Doubler", effect: "2x shards" }
  };

  function defaultProfile() {
    return {
      version: CURRENT_VERSION,
      name: "",
      avatar: "🎓",
      avatarKind: "emoji",
      // The student's primary enrolled course. Set during welcome
      // setup; editable from the profile drawer. Drives diagnostic
      // question selection, daily challenge weighting, library +
      // jeopardy default filters, etc. Empty string = "all courses".
      course: "",
      // Test-prep target. testDate is an ISO 'YYYY-MM-DD' string in
      // the student's local time; testName is a short human label
      // (e.g., "Global Regents" or "AP Psych exam"). Both empty by
      // default — the countdown widget hides itself when unset.
      testDate: "",
      testName: "",
      createdAt: 0,
      lastVisit: 0,
      // Phase 7 — content routing
      topicStats: {},      // course -> set -> { correct, total, lastSeen }
      wrongAnswers: [],    // ring buffer of {prompt, answer, course, set, gameId, ts}
      // Diagnostic ring buffer of recently-asked question IDs (cap 24,
      // roughly 3 sessions worth). New questions are appended; older
      // entries fall off the front. Used by pickDiagnosticSet to avoid
      // repeating the same questions session-to-session.
      diagHistory: [],
      // Rolling 90-day buffer of ISO 'YYYY-MM-DD' strings — every day
      // the student played at least one game. Drives the streak
      // calendar grid in the drawer. Deduped + sorted on every write.
      playDays: [],
      // Per-day shard / question counters keyed by ISO date string,
      // capped at 60 days. Drives the Weekly Stats card.
      dailyShards: {},   // { "YYYY-MM-DD": shardsEarnedThatDay }
      dailyAnswers: {},  // { "YYYY-MM-DD": { correct: N, total: N } }
      // Cards retired from the spaced-repetition queue at box-5. Used
      // for the "Mastered cards" archive view in the drawer. Capped
      // at 200 entries so the profile blob stays modest.
      masteredCards: [],
      // Power-up shop inventory. Counts of consumable items + a
      // timestamp for the time-limited lucky-charm boost.
      inventory: {
        streakShield: 0,        // saves a missed-day streak break
        hintTokens: 0,          // reveal one wrong choice in a quiz
        timeBoosts: 0,          // +30s in mock exam
        luckyCharmExpiresAt: 0  // ms timestamp when 2x shards boost ends
      },
      // Phase 3 — tour bookkeeping
      tourSeen: {},        // gameId -> timestamp
      // Phase 7 — completed cram playlists / diagnostic results
      cramHistory: [],     // [{ course, completedAt, results: {...} }]
      diagnostic: null,    // { takenAt, results: {course: weakUnits[]}, recommendation }
      // Phase 7 — full-length Mock Exam history (cap 10). Each entry:
      // { course, total, correct, count, durationMs, takenAt, weakUnits: [...] }
      mockExams: [],
      shards: 0,
      totalShardsEarned: 0,
      lifetimeShopSpend: 0,
      scholarCorrect: 0,
      dailyChallenge: { lastClaimedDay: "", completedCount: 0, claimDays: [] },
      achievements: {},
      recentGames: [],
      streak: { current: 0, best: 0, lastDay: "" },
      perGameStats: {},
      settings: Object.assign({}, DEFAULT_SETTINGS)
    };
  }

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (e) { return value; }
  }

  // Safe localStorage wrappers — Safari private mode + quota-exceeded throw.
  function safeGetItem(key) {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function safeSetItem(key, value) {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      // Quota-exceeded or Safari private mode. Try one shrink-and-retry by
      // dropping the oldest dailyShards / dailyAnswers entries on the
      // active profile if this is a roster write.
      if (key === ROSTER_KEY && value && value.length > 50000) {
        try {
          var roster = JSON.parse(value);
          if (roster && roster.profiles && roster.activeId && roster.profiles[roster.activeId]) {
            var p = roster.profiles[roster.activeId];
            // Aggressively prune rolling buffers
            pruneRollingMap(p, "dailyShards", 14);
            pruneRollingMap(p, "dailyAnswers", 14);
            if (Array.isArray(p.wrongAnswers) && p.wrongAnswers.length > 40) p.wrongAnswers.length = 40;
            if (Array.isArray(p.masteredCards) && p.masteredCards.length > 100) p.masteredCards.length = 100;
            if (Array.isArray(p.mockExams) && p.mockExams.length > 5) p.mockExams.length = 5;
            if (Array.isArray(p.cramHistory) && p.cramHistory.length > 12) p.cramHistory.length = 12;
            localStorage.setItem(key, JSON.stringify(roster));
            return true;
          }
        } catch (e2) { /* shrink-retry failed, give up gracefully */ }
      }
      return false;
    }
  }
  function safeRemoveItem(key) {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.removeItem(key);
      return true;
    } catch (e) { return false; }
  }
  function safeJsonParse(str) {
    if (typeof str !== "string" || !str) return null;
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  // Generate a small URL-safe profile id. Local-only, collision risk
  // is irrelevant given typical profile counts (1-10).
  function generateProfileId() {
    return "p_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  // ============== Migration ==============

  // Migrate a hydrated profile through schema versions. Idempotent —
  // safe to re-run on already-current profiles (no-ops). Each step
  // bumps the version in lockstep with the data backfill.
  function migrateProfile(p) {
    if (!p || typeof p !== "object") return p;
    var v = Number(p.version) || 1;
    // v1 → v2: covered implicitly by hydrateProfile (additive defaults)
    if (v < 2) {
      v = 2;
      p.version = 2;
    }
    // v2 → v3 (May 2026):
    //   - Backfill lifetimeShopSpend (best-effort; 0 if no signal).
    //     We can't reconstruct exactly without per-purchase logs, but
    //     if Shop Patron is already unlocked we know it's >=1000.
    //   - Backfill scholarCorrect (heuristic — leave 0 if unsure).
    //   - Backfill dailyChallenge.completedCount from any legacy
    //     "mr-macs-arcade-daily-v1" key the old hub may have written.
    // NOTE: hydrateProfile() seeds these fields with 0 from the
    // defaultProfile() before we run, so we backfill *upward* from
    // the unlocked-achievement signal regardless of current value.
    // (A non-zero existing value just means a more accurate signal
    // wins. We never overwrite higher values with smaller ones.)
    if (v < 3) {
      var hasShopPatron = !!(p.achievements && p.achievements["cross-shop-spender"]);
      if (hasShopPatron) {
        p.lifetimeShopSpend = Math.max(p.lifetimeShopSpend || 0, 1000);
      } else if (typeof p.lifetimeShopSpend !== "number") {
        p.lifetimeShopSpend = 0;
      }
      // Heuristic: if Scholar Decoder is unlocked, the player had >=50.
      // Otherwise we have no reliable signal — leave at 0 / current.
      var hasScholar = !!(p.achievements && p.achievements["scholar-decoder"]);
      if (hasScholar) {
        p.scholarCorrect = Math.max(p.scholarCorrect || 0, 50);
      } else if (typeof p.scholarCorrect !== "number") {
        p.scholarCorrect = 0;
      }
      if (!p.dailyChallenge || typeof p.dailyChallenge !== "object") {
        p.dailyChallenge = { lastClaimedDay: "", completedCount: 0, claimDays: [] };
      } else {
        if (!p.dailyChallenge.claimDays) p.dailyChallenge.claimDays = [];
        if (typeof p.dailyChallenge.completedCount !== "number") p.dailyChallenge.completedCount = 0;
      }
      // Try to pull legacy daily-completion history if the old hub stashed it
      var legacyDaily = safeGetItem("mr-macs-arcade-daily-v1");
      if (legacyDaily) {
        var parsed = safeJsonParse(legacyDaily);
        if (parsed && Array.isArray(parsed.completedDays)) {
          var prevCount = p.dailyChallenge.completedCount;
          p.dailyChallenge.completedCount = Math.max(prevCount, parsed.completedDays.length);
          // Seed claimDays from legacy if empty
          if (!p.dailyChallenge.claimDays.length) {
            p.dailyChallenge.claimDays = parsed.completedDays.slice(-30);
          }
        }
      }
      v = 3;
      p.version = 3;
    }
    return p;
  }

  // Hydrate a raw profile blob into a full default-shaped profile so
  // older saves still expose every key the current code expects.
  // Then run migrations to bring it to the current schema version.
  function hydrateProfile(parsed) {
    var p = defaultProfile();
    if (parsed && typeof parsed === "object") {
      Object.keys(p).forEach(function (k) {
        if (parsed[k] !== undefined) p[k] = parsed[k];
      });
      p.settings = Object.assign({}, DEFAULT_SETTINGS, parsed.settings || {});
      p.streak = Object.assign({ current: 0, best: 0, lastDay: "" }, parsed.streak || {});
      p.inventory = Object.assign({}, defaultProfile().inventory, parsed.inventory || {});
      if (!p.dailyChallenge || typeof p.dailyChallenge !== "object") {
        p.dailyChallenge = { lastClaimedDay: "", completedCount: 0, claimDays: [] };
      }
    }
    p = migrateProfile(p);
    return p;
  }

  // ============== Read/write with single-tick cache + write coalescing ==============

  // Cache the parsed roster within a single tick so chained reads
  // (addShards → recordPlay → unlock) don't re-parse JSON each time.
  // Cleared on every write and on microtask boundary.
  var _rosterCache = null;
  var _rosterCacheTickScheduled = false;
  function _scheduleCacheClear() {
    if (_rosterCacheTickScheduled) return;
    _rosterCacheTickScheduled = true;
    var clearFn = function () {
      _rosterCache = null;
      _rosterCacheTickScheduled = false;
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(clearFn);
    } else if (typeof Promise !== "undefined") {
      Promise.resolve().then(clearFn);
    } else {
      setTimeout(clearFn, 0);
    }
  }

  // Read the full roster (with active-profile pointer + all profile
  // slots) from localStorage. Migrates the legacy single-profile key
  // on first read post-multi-profile rollout. Returns a fresh
  // single-default roster if nothing's stored yet.
  function readRoster() {
    if (_rosterCache) return _rosterCache;
    var raw = safeGetItem(ROSTER_KEY);
    if (raw) {
      var parsed = safeJsonParse(raw);
      if (parsed && typeof parsed === "object" && parsed.profiles) {
        // Hydrate every profile slot through the migration path
        Object.keys(parsed.profiles).forEach(function (id) {
          parsed.profiles[id] = hydrateProfile(parsed.profiles[id]);
        });
        if (!parsed.activeId || !parsed.profiles[parsed.activeId]) {
          parsed.activeId = Object.keys(parsed.profiles)[0] || DEFAULT_PROFILE_ID;
        }
        _rosterCache = parsed;
        _scheduleCacheClear();
        return parsed;
      }
    }
    // No roster stored — try to migrate from the legacy single-key
    var legacy = safeGetItem(STORAGE_KEY);
    var roster;
    if (legacy) {
      var legacyParsed = safeJsonParse(legacy);
      if (legacyParsed) {
        var legacyProfile = hydrateProfile(legacyParsed);
        roster = {
          activeId: DEFAULT_PROFILE_ID,
          profiles: {}
        };
        roster.profiles[DEFAULT_PROFILE_ID] = legacyProfile;
        // Persist the migrated roster so subsequent reads skip this path
        safeSetItem(ROSTER_KEY, JSON.stringify(roster));
        _rosterCache = roster;
        _scheduleCacheClear();
        return roster;
      }
    }
    // Truly fresh device — start with a single empty profile slot
    roster = { activeId: DEFAULT_PROFILE_ID, profiles: {} };
    roster.profiles[DEFAULT_PROFILE_ID] = defaultProfile();
    _rosterCache = roster;
    _scheduleCacheClear();
    return roster;
  }

  // Coalesce rapid-fire writes within a single tick. Multiple writes
  // in the same microtask collapse to one localStorage.setItem call.
  var _pendingWrite = null;
  var _flushScheduled = false;
  function _flushWrite() {
    _flushScheduled = false;
    if (_pendingWrite) {
      try { safeSetItem(ROSTER_KEY, JSON.stringify(_pendingWrite)); } catch (e) {}
      _pendingWrite = null;
    }
  }
  function writeRoster(roster, opts) {
    // Always update the in-memory cache synchronously so subsequent
    // read()s in the same tick see the new state.
    _rosterCache = roster;
    if (opts && opts.immediate) {
      // Bypass coalescing — caller wants the write to hit storage now.
      _pendingWrite = null;
      safeSetItem(ROSTER_KEY, JSON.stringify(roster));
      return;
    }
    _pendingWrite = roster;
    if (_flushScheduled) return;
    _flushScheduled = true;
    if (typeof queueMicrotask === "function") {
      queueMicrotask(_flushWrite);
    } else if (typeof Promise !== "undefined") {
      Promise.resolve().then(_flushWrite);
    } else {
      setTimeout(_flushWrite, 0);
    }
  }

  // Read the ACTIVE profile. Existing API methods all flow through
  // this so the multi-profile refactor is transparent — every method
  // operates on the active slot.
  // Note: pre-flush any pending write so reads always see latest state.
  function read() {
    if (_pendingWrite) {
      // We have pending data; serve from in-memory roster.
      var rosterPending = _pendingWrite;
      return clone(rosterPending.profiles[rosterPending.activeId] || defaultProfile());
    }
    var roster = readRoster();
    return clone(roster.profiles[roster.activeId] || defaultProfile());
  }

  // Write the ACTIVE profile back to its roster slot. Race-safe across
  // multiple tabs because we re-read the roster, mutate the active
  // slot only, and write back — other-tab profile slots are preserved.
  function write(p) {
    var roster = readRoster();
    roster.profiles[roster.activeId] = p;
    writeRoster(roster);
  }

  function emit(name, detail) {
    if (!EVENT_TARGET) return;
    KNOWN_EVENTS[name] = true;
    try {
      EVENT_TARGET.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (e) {}
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }

  function daysBetween(a, b) {
    if (!a || !b) return Infinity;
    var pa = a.split("-").map(Number);
    var pb = b.split("-").map(Number);
    var da = Date.UTC(pa[0], pa[1] - 1, pa[2]);
    var db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
    return Math.round((db - da) / 86400000);
  }

  // Prune a date-keyed rolling map to its N most-recent entries.
  // Used by dailyShards / dailyAnswers (and any future per-day buffer)
  // so the profile blob stays small. Early-exits if no prune needed.
  function pruneRollingMap(p, key, days) {
    if (!p[key] || typeof p[key] !== "object") return;
    var keys = Object.keys(p[key]);
    if (keys.length <= days) return; // common case: skip the sort
    keys.sort();
    var keep = keys.slice(-days);
    var fresh = {};
    keep.forEach(function (k) { fresh[k] = p[key][k]; });
    p[key] = fresh;
  }

  // ============== Public API ==============

  var API = {
    AVATARS: AVATARS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,

    /**
     * Returns a deep clone of the active profile.
     * @returns {Object}
     */
    get: function () { return clone(read()); },

    /**
     * Has the player completed first-time setup (set a name)?
     * @returns {boolean}
     */
    exists: function () {
      var p = read();
      return !!(p.name && p.createdAt);
    },

    /**
     * Shallow-merge `partial` onto the active profile and persist.
     * Emits "profile:update".
     * @param {Object} partial
     * @returns {Object} the new full profile (clone)
     */
    set: function (partial) {
      var p = read();
      Object.keys(partial || {}).forEach(function (k) { p[k] = partial[k]; });
      write(p);
      emit("profile:update", { profile: clone(p) });
      return clone(p);
    },

    /**
     * Wipe ONLY the legacy single-profile key (does NOT touch the
     * roster). Kept for backward compatibility — for full-profile
     * wipe use `resetProfile({ confirm: true })`.
     * @returns {Object} a fresh default profile (clone)
     */
    reset: function () {
      safeRemoveItem(STORAGE_KEY);
      var p = defaultProfile();
      emit("profile:update", { profile: clone(p) });
      return clone(p);
    },

    /** @returns {string} */
    getName: function () { return read().name || ""; },
    /**
     * Set the player's display name (max 24 chars). On first set,
     * stamps createdAt + emits "profile:create" + unlocks "first-name".
     * @param {string} name
     * @returns {string} the stored name
     */
    setName: function (name) {
      var p = read();
      var was = !p.createdAt;
      p.name = String(name || "").trim().slice(0, 24);
      if (was && p.name) {
        p.createdAt = Date.now();
        write(p);
        emit("profile:create", { profile: clone(p) });
        // First-name achievement
        API.unlock("first-name");
      } else {
        write(p);
        emit("profile:update", { profile: clone(p) });
      }
      return p.name;
    },

    /** @returns {{value: string, kind: string}} */
    getAvatar: function () {
      var p = read();
      return { value: p.avatar, kind: p.avatarKind };
    },
    /**
     * Set the avatar value + kind ("emoji" | "url"). Emits "profile:update".
     * @param {string} value
     * @param {string} [kind="emoji"]
     * @returns {string}
     */
    setAvatar: function (value, kind) {
      var p = read();
      p.avatar = value;
      p.avatarKind = kind || "emoji";
      write(p);
      emit("profile:update", { profile: clone(p) });
      return p.avatar;
    },

    /** @returns {string} */
    getCourse: function () { return read().course || ""; },
    /**
     * Set the player's primary course; emits "profile:update" + "course:change".
     * @param {string} courseName
     * @returns {string}
     */
    setCourse: function (courseName) {
      var p = read();
      var prev = p.course || "";
      var next = String(courseName || "").trim();
      if (prev === next) return next;
      p.course = next;
      write(p);
      emit("profile:update", { profile: clone(p) });
      emit("course:change", { course: next, previous: prev });
      return p.course;
    },

    /** @returns {{date: string, name: string}} */
    getTestPrep: function () {
      var p = read();
      return { date: p.testDate || "", name: p.testName || "" };
    },
    /**
     * @param {{date?: string, name?: string}} opts
     * @returns {{date: string, name: string}}
     */
    setTestPrep: function (opts) {
      var p = read();
      opts = opts || {};
      if (typeof opts.date === "string") p.testDate = opts.date.trim();
      if (typeof opts.name === "string") p.testName = opts.name.trim().slice(0, 60);
      write(p);
      emit("profile:update", { profile: clone(p) });
      emit("testprep:change", { date: p.testDate, name: p.testName });
      return { date: p.testDate, name: p.testName };
    },

    // ---- Wallet ----
    /** @returns {number} */
    getShards: function () { return read().shards || 0; },
    /**
     * Add (or subtract) shards. Positive deltas may be doubled by
     * Lucky Charm / Coin Doubler buffs. Emits "wallet:change".
     * @param {number} n  delta (can be negative)
     * @param {string} [source="unknown"]  free-form attribution string
     * @returns {number} new total
     */
    addShards: function (n, source) {
      n = Number(n) || 0;
      if (!n) return read().shards;
      var p = read();
      var actualSource = source || "unknown";
      // Lucky Charm: 2x positive shards if the boost is active. We
      // skip the multiplier on shop purchases and on the boost itself
      // to prevent infinite loops.
      var luckyApplied = false;
      var doublerApplied = false;
      if (n > 0 && actualSource !== "shop" && actualSource !== "lucky-charm-boost" && actualSource !== "coin-doubler-boost") {
        var inv = p.inventory || {};
        var nowTs = Date.now();
        if (inv.luckyCharmExpiresAt && inv.luckyCharmExpiresAt > nowTs) {
          n = n * 2;
          luckyApplied = true;
          actualSource = actualSource + " · ✨2x";
        }
        if (inv.coinDoublerExpiresAt && inv.coinDoublerExpiresAt > nowTs) {
          n = n * 2;
          doublerApplied = true;
          actualSource = actualSource + " · 🪙2x";
        }
      }
      p.shards = Math.max(0, (p.shards || 0) + n);
      if (n > 0) p.totalShardsEarned = (p.totalShardsEarned || 0) + n;
      // Per-day shard counter (last 60 days) — drives Weekly Stats
      var today = todayKey();
      p.dailyShards = p.dailyShards || {};
      p.dailyShards[today] = (p.dailyShards[today] || 0) + n;
      pruneRollingMap(p, "dailyShards", 60);
      // Auto-detect scholar-correct events from any game without
      // requiring per-game wiring. Sources matching "*-scholar-correct"
      // or "*scholar*correct*" bump the cross-game scholar counter.
      var srcRaw = String(source || "").toLowerCase();
      if (n > 0 && (srcRaw.indexOf("scholar") >= 0 && srcRaw.indexOf("correct") >= 0)) {
        p.scholarCorrect = (p.scholarCorrect || 0) + 1;
      }
      write(p);
      emit("wallet:change", { delta: n, total: p.shards, source: actualSource, lucky: luckyApplied, doubler: doublerApplied });
      // Cross-arcade shard milestones
      if (p.totalShardsEarned >= 10000) API.unlock("cross-shards-10k");
      else if (p.totalShardsEarned >= 1000) API.unlock("cross-shards-1k");
      // Scholar Decoder cross-game milestone
      if ((p.scholarCorrect || 0) >= 50) API.unlock("scholar-decoder");
      return p.shards;
    },
    /**
     * Spend shards (no buff multiplier applied). Returns false if
     * insufficient balance. Emits "wallet:change" on success.
     * @param {number} n  positive amount to spend
     * @param {string} [source="spend"]
     * @returns {boolean}
     */
    spendShards: function (n, source) {
      n = Math.abs(Number(n) || 0);
      var p = read();
      if (p.shards < n) return false;
      p.shards -= n;
      write(p);
      emit("wallet:change", { delta: -n, total: p.shards, source: source || "spend" });
      return true;
    },

    // ---- Power-up shop inventory ----
    /**
     * Snapshot of current shop inventory + buff state.
     * @returns {{streakShield:number, hintTokens:number, timeBoosts:number,
     *   fortuneRefresh:number, dailyDouble:number,
     *   luckyCharmExpiresAt:number, luckyCharmActive:boolean,
     *   coinDoublerExpiresAt:number, coinDoublerActive:boolean}}
     */
    getInventory: function () {
      var inv = read().inventory || {};
      var now = Date.now();
      return {
        streakShield: inv.streakShield || 0,
        hintTokens: inv.hintTokens || 0,
        timeBoosts: inv.timeBoosts || 0,
        fortuneRefresh: inv.fortuneRefresh || 0,
        dailyDouble: inv.dailyDouble || 0,
        luckyCharmExpiresAt: inv.luckyCharmExpiresAt || 0,
        luckyCharmActive: !!(inv.luckyCharmExpiresAt && inv.luckyCharmExpiresAt > now),
        coinDoublerExpiresAt: inv.coinDoublerExpiresAt || 0,
        coinDoublerActive: !!(inv.coinDoublerExpiresAt && inv.coinDoublerExpiresAt > now)
      };
    },
    /**
     * Catalog of buyable items. Each entry: { cost, label, icon, desc }.
     */
    SHOP_ITEMS: {
      streakShield:  { cost: 200, label: "Streak Shield",  icon: "🛡", desc: "Saves your streak if you miss a day. Auto-consumed on the next gap." },
      hintTokens:    { cost: 50,  label: "Hint Token",     icon: "💡", desc: "Eliminates one wrong choice on any quiz question. One per question." },
      timeBoosts:    { cost: 75,  label: "Time Boost",     icon: "⏱", desc: "Adds 30 seconds to your timer in any timed mock exam. One use per boost." },
      luckyCharm:    { cost: 350, label: "Lucky Charm",    icon: "✨", desc: "Doubles every shard you earn for 24 hours." },
      fortuneRefresh:{ cost: 25,  label: "Fortune Refresh", icon: "🔮", desc: "Reroll today's daily fortune. One reroll per purchase." },
      dailyDouble:   { cost: 150, label: "Daily Double",   icon: "📰", desc: "Doubles your shard payout on the next Daily Challenge completion." },
      coinDoubler:   { cost: 500, label: "Coin Doubler",   icon: "🪙", desc: "Doubles every shard you earn for 4 hours. Stacks with Lucky Charm." }
    },
    /**
     * Look up the spec for a shop item id.
     * @param {string} itemId
     * @returns {Object|null}
     */
    getShopSpec: function (itemId) {
      return API.SHOP_ITEMS[itemId] ? clone(API.SHOP_ITEMS[itemId]) : null;
    },
    /**
     * Buy a shop item by id. Costs are defined in SHOP_ITEMS.
     * @param {string} itemId
     * @returns {{ok: boolean, reason?: string, needed?: number, inventory?: Object}}
     */
    buyItem: function (itemId) {
      var spec = API.SHOP_ITEMS[itemId];
      if (!spec) return { ok: false, reason: "unknown-item" };
      var p = read();
      if ((p.shards || 0) < spec.cost) return { ok: false, reason: "not-enough-shards", needed: spec.cost - (p.shards || 0) };
      // Deduct shards (don't go through addShards/spendShards path
      // because this needs to bypass lucky-charm doubling)
      p.shards = (p.shards || 0) - spec.cost;
      p.inventory = p.inventory || {};
      // Lifetime shop spend (drives Shop Patron achievement)
      p.lifetimeShopSpend = (p.lifetimeShopSpend || 0) + spec.cost;
      // Timed buffs are not stackable as counts — they extend a deadline.
      var buffSpec = TIMED_BUFFS[itemId];
      if (buffSpec) {
        var current = p.inventory[buffSpec.field] || 0;
        var nowTs = Date.now();
        var base = current > nowTs ? current : nowTs;
        p.inventory[buffSpec.field] = base + buffSpec.durationMs;
      } else {
        p.inventory[itemId] = (p.inventory[itemId] || 0) + 1;
      }
      write(p);
      if (p.lifetimeShopSpend >= 1000) API.unlock("cross-shop-spender");
      emit("wallet:change", { delta: -spec.cost, total: p.shards, source: "shop" });
      emit("inventory:change", { item: itemId, source: "purchase", inventory: API.getInventory() });
      return { ok: true, inventory: API.getInventory() };
    },
    /**
     * Decrement an inventory count.
     * @param {string} itemId
     * @returns {number} new count (0 if nothing to consume)
     */
    consumeItem: function (itemId) {
      var p = read();
      p.inventory = p.inventory || {};
      if (!(p.inventory[itemId] || 0)) return 0;
      p.inventory[itemId] = Math.max(0, p.inventory[itemId] - 1);
      write(p);
      emit("inventory:change", { item: itemId, source: "consume", inventory: API.getInventory() });
      return p.inventory[itemId];
    },
    /**
     * Extend (or kick off) a timed buff by `ms` milliseconds. If the
     * buff is already active, the new deadline is current + ms;
     * otherwise it's now + ms. Emits "inventory:change".
     * @param {string} itemId  must reference a TIMED_BUFFS entry
     * @param {number} ms
     * @returns {{ok: boolean, expiresAt?: number, reason?: string}}
     */
    extendBuff: function (itemId, ms) {
      var buffSpec = TIMED_BUFFS[itemId];
      if (!buffSpec) return { ok: false, reason: "not-a-buff" };
      ms = Math.max(0, Number(ms) || 0);
      if (!ms) return { ok: false, reason: "no-duration" };
      var p = read();
      p.inventory = p.inventory || {};
      var nowTs = Date.now();
      var current = p.inventory[buffSpec.field] || 0;
      var base = current > nowTs ? current : nowTs;
      p.inventory[buffSpec.field] = base + ms;
      write(p);
      emit("inventory:change", { item: itemId, source: "extend-buff", inventory: API.getInventory() });
      return { ok: true, expiresAt: p.inventory[buffSpec.field] };
    },
    /**
     * Cancel a timed buff (sets expiry to 0). Useful for testing/admin.
     * @param {string} itemId
     * @returns {boolean} true if a buff was dispelled
     */
    dispelBuff: function (itemId) {
      var buffSpec = TIMED_BUFFS[itemId];
      if (!buffSpec) return false;
      var p = read();
      p.inventory = p.inventory || {};
      if (!p.inventory[buffSpec.field]) return false;
      p.inventory[buffSpec.field] = 0;
      write(p);
      emit("inventory:change", { item: itemId, source: "dispel", inventory: API.getInventory() });
      return true;
    },
    /**
     * Snapshot of currently-active timed buffs.
     * @returns {Array<{id:string, label:string, expiresAt:number, msRemaining:number, effect:string}>}
     */
    getActiveBuffs: function () {
      var inv = read().inventory || {};
      var now = Date.now();
      var out = [];
      Object.keys(TIMED_BUFFS).forEach(function (id) {
        var spec = TIMED_BUFFS[id];
        var expiresAt = inv[spec.field] || 0;
        if (expiresAt && expiresAt > now) {
          out.push({
            id: id,
            label: spec.label,
            expiresAt: expiresAt,
            msRemaining: expiresAt - now,
            effect: spec.effect
          });
        }
      });
      return out;
    },

    // ---- Achievements ----
    /**
     * Unlock an achievement by id. Idempotent — repeat calls return
     * { alreadyUnlocked: true, newAchievement: false }. Pass
     * `{ bump: true }` to increment the count on already-unlocked entries.
     * @param {string} id
     * @param {{bump?: boolean}} [extra]
     * @returns {{alreadyUnlocked: boolean, newAchievement: boolean}}
     */
    unlock: function (id, extra) {
      var def = ACHIEVEMENT_INDEX[id];
      if (!def) return { alreadyUnlocked: false, newAchievement: false };
      var p = read();
      p.achievements = p.achievements || {};
      if (p.achievements[id]) {
        // Already unlocked; possibly bump count
        if (extra && extra.bump) {
          p.achievements[id].count = (p.achievements[id].count || 1) + 1;
          write(p);
        }
        return { alreadyUnlocked: true, newAchievement: false };
      }
      p.achievements[id] = { unlockedAt: Date.now(), count: 1 };
      write(p);
      emit("achievement:unlock", { id: id, def: def, unlockedAt: p.achievements[id].unlockedAt });
      return { alreadyUnlocked: false, newAchievement: true };
    },
    /**
     * Defensive wrapper for game-side achievement unlocks. Swallows
     * errors so a bad call from a game never crashes the page. Logs
     * to console in development. Use this from game files instead of
     * calling unlock() directly.
     * @param {string} gameId  free-form id (used for diagnostic logs only)
     * @param {string} achievementId
     * @returns {{ok: boolean, alreadyUnlocked?: boolean, newAchievement?: boolean, reason?: string}}
     */
    unlockGameAchievement: function (gameId, achievementId) {
      try {
        if (!achievementId || typeof achievementId !== "string") {
          return { ok: false, reason: "invalid-id" };
        }
        if (!ACHIEVEMENT_INDEX[achievementId]) {
          return { ok: false, reason: "unknown-achievement" };
        }
        var result = API.unlock(achievementId);
        return Object.assign({ ok: true }, result);
      } catch (e) {
        try {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("[arcade-profile] unlockGameAchievement failed:", gameId, achievementId, e);
          }
        } catch (e2) {}
        return { ok: false, reason: "exception" };
      }
    },
    /**
     * @param {string} id
     * @param {number} [by=1]
     * @returns {number} new count
     */
    bumpAchievement: function (id, by) {
      var p = read();
      p.achievements = p.achievements || {};
      if (!p.achievements[id]) {
        p.achievements[id] = { unlockedAt: Date.now(), count: 0 };
      }
      p.achievements[id].count = (p.achievements[id].count || 0) + (by || 1);
      write(p);
      return p.achievements[id].count;
    },
    /** @param {string} id @returns {boolean} */
    hasAchievement: function (id) {
      var p = read();
      return !!(p.achievements && p.achievements[id]);
    },
    /**
     * Full enumerated list (matches ACHIEVEMENTS order).
     * @returns {Array<{id:string, def:Object, unlocked:boolean, unlockedAt:number, count:number}>}
     */
    listAchievements: function () {
      var p = read();
      return ACHIEVEMENTS.map(function (def) {
        var entry = p.achievements && p.achievements[def.id];
        return {
          id: def.id,
          def: def,
          unlocked: !!entry,
          unlockedAt: entry ? entry.unlockedAt : 0,
          count: entry ? (entry.count || 1) : 0
        };
      });
    },

    // ---- Recent games + streak ----
    /**
     * Record that the player just opened a game. Updates recentGames,
     * streak, playDays, perGameStats, and fires several derived
     * achievements (cross-genre tiers, lifetime plays, time-of-day).
     * Multi-tab safe: re-reads the roster, mutates only the active
     * profile, writes back.
     * @param {{id?:string, title?:string, course?:string, file?:string}} meta
     * @returns {Object} the recent-games entry just added (clone)
     */
    recordPlay: function (meta) {
      meta = meta || {};
      var p = read();
      var now = Date.now();
      p.lastVisit = now;
      // Recent games (max 8)
      var entry = {
        id: meta.id || "unknown",
        title: meta.title || meta.id || "Game",
        course: meta.course || "",
        file: meta.file || "",
        ts: now
      };
      p.recentGames = (p.recentGames || []).filter(function (g) { return g.id !== entry.id; });
      p.recentGames.unshift(entry);
      if (p.recentGames.length > 8) p.recentGames.length = 8;
      // Streak
      var today = todayKey();
      if (p.streak.lastDay !== today) {
        var gap = daysBetween(p.streak.lastDay, today);
        var shieldUsed = false;
        if (gap === 1) {
          p.streak.current = (p.streak.current || 0) + 1;
        } else if (gap > 1) {
          // Streak would break. Consume a Streak Shield if we have
          // one in inventory — keeps the streak alive at its current
          // count + 1 (so today still counts as a play day).
          p.inventory = p.inventory || {};
          if ((p.inventory.streakShield || 0) > 0) {
            p.inventory.streakShield = p.inventory.streakShield - 1;
            p.streak.current = (p.streak.current || 0) + 1;
            shieldUsed = true;
          } else {
            p.streak.current = 1;
          }
        } else if (!p.streak.lastDay) {
          p.streak.current = 1;
        }
        p.streak.lastDay = today;
        p.streak.best = Math.max(p.streak.best || 0, p.streak.current);
        emit("streak:advance", { current: p.streak.current, best: p.streak.best, shieldUsed: shieldUsed });
        if (shieldUsed) {
          emit("inventory:change", { streakShield: p.inventory.streakShield, source: "shield-consumed" });
        }
        // Streak achievements
        if (p.streak.current >= 30) API.unlock("streak-30");
        else if (p.streak.current >= 7) API.unlock("streak-7");
        else if (p.streak.current >= 3) API.unlock("streak-3");
      }
      // Rolling 90-day playDays buffer (ISO 'YYYY-MM-DD' strings).
      // Drives the streak calendar grid in the profile drawer. We
      // dedupe + sort + cap on every write so the buffer stays clean.
      p.playDays = p.playDays || [];
      if (p.playDays.indexOf(today) === -1) p.playDays.push(today);
      // Keep only the last 90 distinct days
      p.playDays = p.playDays
        .filter(function (d, i, arr) { return arr.indexOf(d) === i; })
        .sort()
        .slice(-90);
      // Per-game stats
      p.perGameStats = p.perGameStats || {};
      var gs = p.perGameStats[entry.id] || { plays: 0, bestScore: 0, lastPlayed: 0, completions: 0 };
      gs.plays = (gs.plays || 0) + 1;
      gs.lastPlayed = now;
      p.perGameStats[entry.id] = gs;
      // Cross-arcade: distinct-genre tiers
      var distinctGenres = Object.keys(p.perGameStats).length;
      if (distinctGenres >= 3)  API.unlock("cross-3-genres");
      if (distinctGenres >= 7)  API.unlock("cross-7-genres");
      if (distinctGenres >= 12) API.unlock("cross-12-genres");
      if (distinctGenres >= 15) API.unlock("cross-15-genres");
      // Cross-arcade: 100 lifetime plays
      var totalPlays = 0;
      Object.keys(p.perGameStats).forEach(function (k) {
        totalPlays += (p.perGameStats[k].plays || 0);
      });
      if (totalPlays >= 100) API.unlock("cross-100-plays");
      // Time-of-day achievement: only Early Bird is rewarded.
      // Late-night play is intentionally NOT incentivized — students
      // need sleep, especially before exams.
      var hr = new Date(now).getHours();
      if (hr >= 5 && hr < 7) API.unlock("early-bird");
      // Weekend warrior — track sat + sun played in current ISO week
      var dayOfWeek = new Date(now).getDay(); // 0=Sun, 6=Sat
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        p.weekendDays = p.weekendDays || {};
        // Use ISO week as the bucket key
        var year = new Date(now).getFullYear();
        var weekNum = (function () {
          var d = new Date(now);
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + 4 - (d.getDay() || 7));
          var yearStart = new Date(d.getFullYear(), 0, 1);
          return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        })();
        var weekKey = year + "-W" + weekNum;
        p.weekendDays[weekKey] = p.weekendDays[weekKey] || { sat: false, sun: false };
        if (dayOfWeek === 6) p.weekendDays[weekKey].sat = true;
        if (dayOfWeek === 0) p.weekendDays[weekKey].sun = true;
        if (p.weekendDays[weekKey].sat && p.weekendDays[weekKey].sun) {
          API.unlock("weekend-warrior");
        }
        // Cap to last 12 weeks
        var weeks = Object.keys(p.weekendDays).sort();
        if (weeks.length > 12) {
          var fresh = {};
          weeks.slice(-12).forEach(function (k) { fresh[k] = p.weekendDays[k]; });
          p.weekendDays = fresh;
        }
      }
      write(p);
      // First-play achievement
      if (gs.plays === 1 && Object.keys(p.perGameStats).length === 1) API.unlock("first-play");
      emit("profile:update", { profile: clone(p) });
      return clone(entry);
    },

    /**
     * Record a completion (game over with score). Bumps completions
     * and bestScore on the per-game stats entry.
     * @param {string} gameId
     * @param {number} [score=0]
     * @returns {Object} updated per-game stats entry (clone)
     */
    recordCompletion: function (gameId, score) {
      var p = read();
      p.perGameStats = p.perGameStats || {};
      var gs = p.perGameStats[gameId] || { plays: 0, bestScore: 0, lastPlayed: 0, completions: 0 };
      gs.completions = (gs.completions || 0) + 1;
      gs.bestScore = Math.max(gs.bestScore || 0, Number(score) || 0);
      gs.lastPlayed = Date.now();
      p.perGameStats[gameId] = gs;
      write(p);
      emit("profile:update", { profile: clone(p) });
      return clone(gs);
    },

    /** @param {number} [limit=4] @returns {Array} */
    getRecent: function (limit) {
      var p = read();
      var n = Number(limit) || 4;
      return (p.recentGames || []).slice(0, n);
    },

    /** @returns {{current:number, best:number, lastDay:string}} */
    getStreak: function () { return clone(read().streak); },

    // ---- Daily Challenge ----
    // The hub picks a featured game per day (deterministic per date) and
    // grants a bonus payout the first time the player completes it that
    // day. We track the date they last claimed + a rolling completion
    // count for the Daily Dispatch achievements.
    /**
     * @returns {{lastClaimedDay:string, completedCount:number, claimedToday:boolean}}
     */
    getDailyChallengeState: function () {
      var p = read();
      var dc = p.dailyChallenge || { lastClaimedDay: "", completedCount: 0 };
      return {
        lastClaimedDay: dc.lastClaimedDay || "",
        completedCount: dc.completedCount || 0,
        claimedToday: (dc.lastClaimedDay === todayKey())
      };
    },
    /**
     * Claim the daily challenge bonus. Returns { ok: false, reason: "already-claimed" }
     * if already claimed today.
     * @param {{gameId?:string, payout?:number}} [meta]
     * @returns {{ok:boolean, reason?:string, payout?:number, doubled?:boolean, completedCount?:number}}
     */
    claimDailyChallenge: function (meta) {
      var today = todayKey();
      var p = read();
      p.dailyChallenge = p.dailyChallenge || { lastClaimedDay: "", completedCount: 0, claimDays: [] };
      if (!Array.isArray(p.dailyChallenge.claimDays)) p.dailyChallenge.claimDays = [];
      if (p.dailyChallenge.lastClaimedDay === today) {
        return { ok: false, reason: "already-claimed" };
      }
      // Daily Double inventory item, if held, doubles the payout once.
      var basePayout = Number(meta && meta.payout) || 60;
      var doubled = false;
      p.inventory = p.inventory || {};
      if ((p.inventory.dailyDouble || 0) > 0) {
        p.inventory.dailyDouble -= 1;
        basePayout *= 2;
        doubled = true;
      }
      p.dailyChallenge.lastClaimedDay = today;
      p.dailyChallenge.completedCount = (p.dailyChallenge.completedCount || 0) + 1;
      // Track claim days for streak / missed-day calculations.
      // Dedupe + cap to last 60 days.
      if (p.dailyChallenge.claimDays.indexOf(today) === -1) {
        p.dailyChallenge.claimDays.push(today);
      }
      p.dailyChallenge.claimDays = p.dailyChallenge.claimDays
        .filter(function (d, i, arr) { return arr.indexOf(d) === i; })
        .sort()
        .slice(-60);
      write(p);
      // Pay out via addShards (so lucky charm + coin doubler stack on top)
      API.addShards(basePayout, "daily-challenge");
      // Daily Dispatch achievements
      if (p.dailyChallenge.completedCount >= 30) API.unlock("cross-daily-30");
      else if (p.dailyChallenge.completedCount >= 7) API.unlock("cross-daily-7");
      emit("daily:claim", { gameId: meta && meta.gameId, payout: basePayout, doubled: doubled });
      return { ok: true, payout: basePayout, doubled: doubled, completedCount: p.dailyChallenge.completedCount };
    },
    /**
     * Number of consecutive days (ending today or yesterday) the
     * player has claimed the daily challenge. Different from
     * completedCount (lifetime total).
     * @returns {number}
     */
    getDailyChallengeStreak: function () {
      var p = read();
      var dc = p.dailyChallenge || {};
      var days = Array.isArray(dc.claimDays) ? dc.claimDays.slice() : [];
      if (!days.length) return 0;
      days.sort();
      var today = todayKey();
      // Compute yesterday for streak grace (a streak doesn't break
      // until you've missed the day fully)
      var yesterday = (function () {
        var d = new Date();
        d.setDate(d.getDate() - 1);
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
      })();
      var last = days[days.length - 1];
      // Streak is broken if last claim is older than yesterday
      if (last !== today && last !== yesterday) return 0;
      // Walk backwards from last counting consecutive days
      var streak = 1;
      for (var i = days.length - 2; i >= 0; i--) {
        var gap = daysBetween(days[i], days[i + 1]);
        if (gap === 1) streak++;
        else break;
      }
      return streak;
    },
    /**
     * Days in the last 7 the player did NOT claim. Returns ISO date
     * strings sorted oldest-first. Empty array means 7-for-7.
     * @returns {string[]}
     */
    getDailyChallengeMissed: function () {
      var p = read();
      var dc = p.dailyChallenge || {};
      var claimed = Array.isArray(dc.claimDays) ? dc.claimDays : [];
      var claimedSet = {};
      claimed.forEach(function (d) { claimedSet[d] = true; });
      var missed = [];
      var d = new Date();
      // Walk last 7 days (today inclusive). Today doesn't count as
      // missed if not yet claimed — only past days count.
      for (var i = 6; i >= 1; i--) {
        var dt = new Date();
        dt.setDate(d.getDate() - i);
        var key = dt.getFullYear() + "-" +
                  String(dt.getMonth() + 1).padStart(2, "0") + "-" +
                  String(dt.getDate()).padStart(2, "0");
        if (!claimedSet[key]) missed.push(key);
      }
      return missed;
    },

    // ---- Scholar prompt counter (drives Scholar Decoder achievement) ----
    /**
     * Record one scholar-prompt correct answer. Auto-unlocks the
     * Scholar Decoder achievement at 50.
     * @param {string} [gameId]  free-form attribution
     * @returns {number} new total
     */
    recordScholarCorrect: function (gameId) {
      var p = read();
      p.scholarCorrect = (p.scholarCorrect || 0) + 1;
      write(p);
      if (p.scholarCorrect >= 50) API.unlock("scholar-decoder");
      return p.scholarCorrect;
    },

    // ---- Phase 7: topic stats + wrong-answer queue ----
    // Call once per Q answered. correct = boolean. course/set are course folder + unit/topic name.
    /**
     * Record a single answered question. Updates topic stats, daily
     * answer counters, and (for misses) the spaced-repetition queue.
     * Emits "answer:record".
     * @param {{course?:string, set?:string, unit?:string, correct?:boolean,
     *   prompt?:string, answer?:string, gameId?:string}} meta
     * @returns {{correct:number, total:number}} this bucket's counts
     */
    recordAnswer: function (meta) {
      meta = meta || {};
      var course = String(meta.course || "Unknown");
      var set = String(meta.set || meta.unit || "General");
      var p = read();
      p.topicStats = p.topicStats || {};
      p.topicStats[course] = p.topicStats[course] || {};
      var bucket = p.topicStats[course][set] = p.topicStats[course][set] || { correct: 0, total: 0, lastSeen: 0 };
      bucket.total = (bucket.total || 0) + 1;
      if (meta.correct) bucket.correct = (bucket.correct || 0) + 1;
      bucket.lastSeen = Date.now();
      // Per-day answer counter (last 60 days) — drives Weekly Stats
      var todayK = todayKey();
      p.dailyAnswers = p.dailyAnswers || {};
      var day = p.dailyAnswers[todayK] = p.dailyAnswers[todayK] || { correct: 0, total: 0 };
      day.total = (day.total || 0) + 1;
      if (meta.correct) day.correct = (day.correct || 0) + 1;
      pruneRollingMap(p, "dailyAnswers", 60);
      // Wrong-answer ring buffer (cap 80) with spaced-repetition fields
      if (!meta.correct) {
        p.wrongAnswers = p.wrongAnswers || [];
        var nowTs = Date.now();
        p.wrongAnswers.unshift({
          prompt: String(meta.prompt || "").slice(0, 220),
          answer: String(meta.answer || "").slice(0, 80),
          course: course, set: set,
          gameId: String(meta.gameId || ""),
          ts: nowTs,
          // SR fields: when to next surface this card + box level
          // (1=show daily, 2=3 days, 3=7 days, 4=14 days, 5=mastered)
          nextShowAt: nowTs + 24 * 3600 * 1000, // tomorrow
          boxLevel: 1,
          lapses: 0
        });
        if (p.wrongAnswers.length > 80) p.wrongAnswers.length = 80;
      }
      write(p);
      // Don't emit profile:update on every answer (too chatty); emit a cheaper event
      emit("answer:record", { course: course, set: set, correct: !!meta.correct });
      // Fire the "First Strike" achievement on the player's first
      // correct answer ever. Subsequent answers are no-ops for the
      // unlock (alreadyUnlocked path).
      if (meta.correct) {
        try { API.unlock("first-correct"); } catch (e) {}
      }
      return { correct: bucket.correct, total: bucket.total };
    },
    /**
     * @param {string} [course]  if given, returns just that course's map
     * @returns {Object}
     */
    getTopicStats: function (course) {
      var p = read();
      var ts = p.topicStats || {};
      return course ? clone(ts[course] || {}) : clone(ts);
    },
    /** @param {number} [limit=10] @returns {Array} */
    getWrongQueue: function (limit) {
      var p = read();
      var n = Number(limit) || 10;
      return (p.wrongAnswers || []).slice(0, n);
    },
    /**
     * Remove a single entry from the wrong-answer queue, identified by
     * its prompt text (stable enough since the queue caps at 80). Used
     * by the drill mode to retire mastered questions.
     * @param {string} prompt
     * @returns {number} new queue length
     */
    removeWrongAnswer: function (prompt) {
      var p = read();
      var key = String(prompt || "").trim();
      if (!key) return (p.wrongAnswers || []).length;
      p.wrongAnswers = (p.wrongAnswers || []).filter(function (w) {
        return String(w.prompt || "").trim() !== key;
      });
      write(p);
      emit("profile:update", { profile: clone(p) });
      return p.wrongAnswers.length;
    },

    /**
     * Spaced-repetition: bump or reset a wrong-answer card's box level.
     * recall = true   → advance box (1→2→3→4→5=mastered, then retire)
     * recall = false  → reset box to 1, increment lapses, schedule for tomorrow
     * Box → next-show interval map: 1=1d, 2=3d, 3=7d, 4=14d, 5=mastered
     * @param {string} prompt
     * @param {boolean} recall
     * @returns {{boxLevel:number, retired:boolean, lapses:number}|null}
     */
    gradeWrongAnswer: function (prompt, recall) {
      var BOX_INTERVALS = [null, 1, 3, 7, 14, null]; // index = boxLevel
      var p = read();
      var key = String(prompt || "").trim();
      if (!key) return null;
      var found = null;
      var msPerDay = 24 * 3600 * 1000;
      var nowTs = Date.now();
      p.wrongAnswers = (p.wrongAnswers || []).reduce(function (acc, w) {
        if (String(w.prompt || "").trim() !== key) {
          acc.push(w);
          return acc;
        }
        // Match — apply grading and either keep or retire
        var box = Math.max(1, w.boxLevel || 1);
        var lapses = w.lapses || 0;
        if (recall) {
          box = Math.min(5, box + 1);
          if (box >= 5) {
            // Mastered — retire from queue and append to the
            // mastered-cards archive (cap 200, oldest dropped).
            p.masteredCards = p.masteredCards || [];
            p.masteredCards.unshift({
              prompt: w.prompt,
              answer: w.answer,
              course: w.course,
              set: w.set,
              masteredAt: nowTs,
              lapses: lapses,
              firstMissedAt: w.ts || nowTs
            });
            if (p.masteredCards.length > 200) p.masteredCards.length = 200;
            found = { boxLevel: 5, retired: true, lapses: lapses };
            return acc;
          }
        } else {
          box = 1;
          lapses += 1;
        }
        var interval = BOX_INTERVALS[box] || 1;
        w.boxLevel = box;
        w.lapses = lapses;
        w.nextShowAt = nowTs + (interval * msPerDay);
        w.lastGradedAt = nowTs;
        found = { boxLevel: box, retired: false, lapses: lapses };
        acc.push(w);
        return acc;
      }, []);
      write(p);
      emit("profile:update", { profile: clone(p) });
      return found;
    },

    /** @param {number} [limit=50] @returns {Array} */
    getMasteredCards: function (limit) {
      var p = read();
      var n = Number(limit) || 50;
      return (p.masteredCards || []).slice(0, n);
    },

    /**
     * Returns ONLY wrong-queue cards whose nextShowAt is in the past
     * (or who have no nextShowAt — legacy entries created pre-SR).
     * Limit defaults to 10. Sorts most-overdue first.
     * @param {number} [limit=10]
     * @returns {Array}
     */
    getDueWrongAnswers: function (limit) {
      var p = read();
      var n = Number(limit) || 10;
      var nowTs = Date.now();
      var all = (p.wrongAnswers || []);
      var due = all.filter(function (w) {
        if (typeof w.nextShowAt !== "number") return true; // legacy: always due
        return w.nextShowAt <= nowTs;
      });
      // Sort: oldest-due first (longest overdue), then most recently missed
      due.sort(function (a, b) {
        var ad = (typeof a.nextShowAt === "number") ? a.nextShowAt : 0;
        var bd = (typeof b.nextShowAt === "number") ? b.nextShowAt : 0;
        if (ad !== bd) return ad - bd;
        return (b.ts || 0) - (a.ts || 0);
      });
      return due.slice(0, n);
    },
    /** Empty the wrong-answer queue. */
    clearWrongQueue: function () {
      var p = read();
      p.wrongAnswers = [];
      write(p);
      emit("profile:update", { profile: clone(p) });
    },

    // ---- Phase 3: first-run tour ----
    /** @param {string} gameId @returns {boolean} */
    hasSeenTour: function (gameId) {
      var p = read();
      return !!(p.tourSeen && p.tourSeen[gameId]);
    },
    /** @param {string} gameId @returns {boolean} */
    markTourSeen: function (gameId) {
      var p = read();
      p.tourSeen = p.tourSeen || {};
      p.tourSeen[gameId] = Date.now();
      write(p);
      return true;
    },
    /** @param {string} [gameId]  if absent, resets all tours */
    resetTour: function (gameId) {
      var p = read();
      p.tourSeen = p.tourSeen || {};
      if (gameId) delete p.tourSeen[gameId];
      else p.tourSeen = {};
      write(p);
    },

    // ---- Phase 7: cram history + diagnostic ----
    /** @param {Object} entry */
    recordCramRun: function (entry) {
      var p = read();
      p.cramHistory = p.cramHistory || [];
      p.cramHistory.unshift(Object.assign({ completedAt: Date.now() }, entry || {}));
      if (p.cramHistory.length > 24) p.cramHistory.length = 24;
      write(p);
      emit("profile:update", { profile: clone(p) });
    },
    /** @returns {Array} */
    getCramHistory: function () { return clone(read().cramHistory || []); },
    /** @param {Object} results */
    setDiagnostic: function (results) {
      var p = read();
      p.diagnostic = Object.assign({ takenAt: Date.now() }, results || {});
      write(p);
      emit("profile:update", { profile: clone(p) });
    },
    /** @returns {Object|null} */
    getDiagnostic: function () { return clone(read().diagnostic || null); },

    // ---- Phase 7: Mock Exam history ----
    /**
     * recordMockExam(meta) — append a completed full-length exam.
     * Expected meta keys: course, total, correct, count, durationMs,
     * takenAt, weakUnits. Caps the buffer at the last 10 runs so the
     * profile blob stays small; oldest entries fall off the end.
     * @param {Object} meta
     * @returns {Object} the appended entry (clone)
     */
    recordMockExam: function (meta) {
      var p = read();
      p.mockExams = p.mockExams || [];
      var entry = Object.assign({ takenAt: Date.now() }, meta || {});
      p.mockExams.unshift(entry);
      if (p.mockExams.length > 10) p.mockExams.length = 10;
      write(p);
      emit("profile:update", { profile: clone(p) });
      return clone(entry);
    },
    /** @param {number} [limit=10] @returns {Array} */
    getMockExamHistory: function (limit) {
      var p = read();
      var n = Number(limit) || 10;
      return clone((p.mockExams || []).slice(0, n));
    },

    // ---- Settings ----
    /** @returns {Object} */
    getSettings: function () { return clone(read().settings || DEFAULT_SETTINGS); },
    /**
     * @param {Object} partial  shallow-merged onto current settings
     * @returns {Object} the new full settings (clone)
     */
    setSettings: function (partial) {
      var p = read();
      p.settings = Object.assign({}, DEFAULT_SETTINGS, p.settings || {}, partial || {});
      write(p);
      emit("settings:change", { settings: clone(p.settings) });
      // First-time settings open achievement
      API.unlock("settings-tuned");
      return clone(p.settings);
    },

    // ---- Events ----
    /**
     * Subscribe to a profile event. See the file header for the
     * full list of event names + detail shapes.
     * @param {string} name
     * @param {Function} handler
     */
    on: function (name, handler) {
      if (!EVENT_TARGET || typeof handler !== "function") return;
      KNOWN_EVENTS[name] = true;
      EVENT_TARGET.addEventListener(name, handler);
    },
    /**
     * Unsubscribe a handler previously registered via on() or once().
     * Safe to call with handlers that were never registered.
     * @param {string} name
     * @param {Function} handler
     */
    off: function (name, handler) {
      if (!EVENT_TARGET || typeof handler !== "function") return;
      EVENT_TARGET.removeEventListener(name, handler);
    },
    /**
     * Subscribe to a single emission. Auto-unsubscribes after firing.
     * Returns an unsubscribe function for early cancellation.
     * @param {string} name
     * @param {Function} handler
     * @returns {Function} unsubscribe
     */
    once: function (name, handler) {
      if (!EVENT_TARGET || typeof handler !== "function") return function () {};
      KNOWN_EVENTS[name] = true;
      var wrapped = function (ev) {
        try { EVENT_TARGET.removeEventListener(name, wrapped); } catch (e) {}
        try { handler(ev); } catch (e2) {}
      };
      EVENT_TARGET.addEventListener(name, wrapped);
      return function () {
        try { EVENT_TARGET.removeEventListener(name, wrapped); } catch (e) {}
      };
    },
    /**
     * Sorted list of every event name this module is known to emit
     * (or has been subscribed to). Useful for debugging.
     * @returns {string[]}
     */
    eventNames: function () {
      return Object.keys(KNOWN_EVENTS).sort();
    },

    // ---- Lifetime stats / export / import ----
    /**
     * Snapshot of cumulative metrics across the player's lifetime.
     * Cheap to call; safe for hub dashboards.
     * @returns {{totalPlays:number, totalShards:number, distinctGenres:number,
     *   achievementsUnlocked:number, lifetimeShopSpend:number,
     *   scholarCorrect:number, dailyChallengesCompleted:number}}
     */
    getLifetimeStats: function () {
      var p = read();
      var pgs = p.perGameStats || {};
      var totalPlays = 0;
      Object.keys(pgs).forEach(function (k) {
        totalPlays += (pgs[k].plays || 0);
      });
      var dc = p.dailyChallenge || {};
      return {
        totalPlays: totalPlays,
        totalShards: p.totalShardsEarned || 0,
        distinctGenres: Object.keys(pgs).length,
        achievementsUnlocked: Object.keys(p.achievements || {}).length,
        lifetimeShopSpend: p.lifetimeShopSpend || 0,
        scholarCorrect: p.scholarCorrect || 0,
        dailyChallengesCompleted: dc.completedCount || 0
      };
    },
    /**
     * Top N games by play count, with ties broken by recency.
     * @param {number} [n=5]
     * @returns {Array<{gameId:string, plays:number, bestScore:number, lastPlayed:number, completions:number}>}
     */
    getTopGames: function (n) {
      var p = read();
      var pgs = p.perGameStats || {};
      var limit = Math.max(1, Number(n) || 5);
      var rows = Object.keys(pgs).map(function (id) {
        var gs = pgs[id] || {};
        return {
          gameId: id,
          plays: gs.plays || 0,
          bestScore: gs.bestScore || 0,
          lastPlayed: gs.lastPlayed || 0,
          completions: gs.completions || 0
        };
      });
      rows.sort(function (a, b) {
        if (b.plays !== a.plays) return b.plays - a.plays;
        return b.lastPlayed - a.lastPlayed;
      });
      return rows.slice(0, limit);
    },
    /**
     * Serialize the active profile to a JSON string for backup/share.
     * Includes a wrapping envelope with version + exportedAt timestamp.
     * @returns {string}
     */
    exportProfile: function () {
      var p = read();
      var payload = {
        kind: "mr-macs-arcade-profile-export",
        exportVersion: 1,
        schemaVersion: p.version || CURRENT_VERSION,
        exportedAt: Date.now(),
        profile: p
      };
      try {
        return JSON.stringify(payload);
      } catch (e) {
        return JSON.stringify({
          kind: "mr-macs-arcade-profile-export",
          exportVersion: 1,
          exportedAt: Date.now(),
          error: "serialization-failed"
        });
      }
    },
    /**
     * Restore a profile from an exportProfile() string. Validates the
     * envelope, hydrates + migrates, then writes to the active slot.
     * @param {string} jsonStr
     * @returns {{ok:boolean, reason?:string, profile?:Object}}
     */
    importProfile: function (jsonStr) {
      if (typeof jsonStr !== "string" || !jsonStr) {
        return { ok: false, reason: "invalid-input" };
      }
      var parsed = safeJsonParse(jsonStr);
      if (!parsed || typeof parsed !== "object") {
        return { ok: false, reason: "parse-error" };
      }
      // Accept either { kind, profile } envelope OR a raw profile blob
      var raw = null;
      if (parsed.kind === "mr-macs-arcade-profile-export" && parsed.profile) {
        raw = parsed.profile;
      } else if (parsed.version !== undefined || parsed.shards !== undefined || parsed.achievements !== undefined) {
        raw = parsed;
      }
      if (!raw || typeof raw !== "object") {
        return { ok: false, reason: "no-profile-payload" };
      }
      // Hydrate + migrate to current schema
      var hydrated = hydrateProfile(raw);
      if (!hydrated || typeof hydrated !== "object") {
        return { ok: false, reason: "hydration-failed" };
      }
      // Persist to the active slot
      try {
        write(hydrated);
      } catch (e) {
        return { ok: false, reason: "write-failed" };
      }
      emit("profile:import", { profile: clone(hydrated) });
      emit("profile:update", { profile: clone(hydrated) });
      return { ok: true, profile: clone(hydrated) };
    },
    /**
     * Wipe the active profile to a fresh default. Requires an explicit
     * confirm flag to prevent accidental data loss.
     * @param {{confirm: boolean}} opts
     * @returns {{ok:boolean, reason?:string, profile?:Object}}
     */
    resetProfile: function (opts) {
      if (!opts || opts.confirm !== true) {
        return { ok: false, reason: "confirmation-required" };
      }
      var fresh = defaultProfile();
      try {
        write(fresh);
      } catch (e) {
        return { ok: false, reason: "write-failed" };
      }
      emit("profile:wipe", {});
      emit("profile:update", { profile: clone(fresh) });
      return { ok: true, profile: clone(fresh) };
    },

    // ---- Multi-profile roster (May 2026) ----
    // Supports multiple students sharing a single device. Each profile
    // is fully isolated (own shards / achievements / settings / course
    // / streak / etc.) — every existing API method operates on the
    // ACTIVE profile. The roster pointer + profile slots all live in
    // a single localStorage key so switching is atomic.
    roster: {
      /**
       * List all profiles as compact summaries. Sorts active first.
       * @returns {Array<{id:string, isActive:boolean, name:string, avatar:string,
       *   avatarKind:string, course:string, shards:number, streak:number,
       *   lastVisit:number, createdAt:number}>}
       */
      list: function () {
        var roster = readRoster();
        var ids = Object.keys(roster.profiles);
        return ids.map(function (id) {
          var prof = roster.profiles[id];
          return {
            id: id,
            isActive: id === roster.activeId,
            name: prof.name || "(unnamed)",
            avatar: prof.avatar || "🎓",
            avatarKind: prof.avatarKind || "emoji",
            course: prof.course || "",
            shards: prof.shards || 0,
            streak: (prof.streak && prof.streak.current) || 0,
            lastVisit: prof.lastVisit || 0,
            createdAt: prof.createdAt || 0
          };
        }).sort(function (a, b) {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return (b.lastVisit || 0) - (a.lastVisit || 0);
        });
      },
      /** @returns {string} */
      getActiveId: function () { return readRoster().activeId; },
      /**
       * Create a new empty profile and switch to it.
       * @param {{name?:string, avatar?:string, course?:string}} [opts]
       * @returns {string} the new profile id
       */
      create: function (opts) {
        opts = opts || {};
        var roster = readRoster();
        var id = generateProfileId();
        var fresh = defaultProfile();
        if (opts.name) fresh.name = String(opts.name).trim().slice(0, 24);
        if (opts.avatar) fresh.avatar = opts.avatar;
        if (opts.course) fresh.course = String(opts.course).trim();
        // If a name was provided, treat this as a real created profile
        if (fresh.name) fresh.createdAt = Date.now();
        roster.profiles[id] = fresh;
        roster.activeId = id;
        writeRoster(roster, { immediate: true });
        emit("roster:change", { activeId: id, list: API.roster.list() });
        emit("profile:update", { profile: clone(fresh) });
        return id;
      },
      /**
       * Switch the active profile.
       * @param {string} id
       * @returns {boolean} true on success
       */
      switch: function (id) {
        var roster = readRoster();
        if (!roster.profiles[id]) return false;
        if (roster.activeId === id) return true;
        roster.activeId = id;
        writeRoster(roster, { immediate: true });
        emit("roster:change", { activeId: id, list: API.roster.list() });
        emit("profile:update", { profile: clone(roster.profiles[id]) });
        return true;
      },
      /**
       * Remove a profile slot. Refuses to delete the active one (caller
       * must switch first).
       * @param {string} id
       * @returns {boolean} true on success
       */
      remove: function (id) {
        var roster = readRoster();
        if (!roster.profiles[id]) return false;
        if (roster.activeId === id) return false; // can't delete active
        delete roster.profiles[id];
        writeRoster(roster, { immediate: true });
        emit("roster:change", { activeId: roster.activeId, list: API.roster.list() });
        return true;
      },
      /**
       * Rename a profile (used by drawer name editor — operates on any
       * slot, not just active).
       * @param {string} id
       * @param {string} newName
       * @returns {boolean} true on success
       */
      rename: function (id, newName) {
        var roster = readRoster();
        if (!roster.profiles[id]) return false;
        roster.profiles[id].name = String(newName || "").trim().slice(0, 24);
        writeRoster(roster, { immediate: true });
        emit("roster:change", { activeId: roster.activeId, list: API.roster.list() });
        if (id === roster.activeId) {
          emit("profile:update", { profile: clone(roster.profiles[id]) });
        }
        return true;
      },
      /** @returns {number} total profile count */
      count: function () {
        return Object.keys(readRoster().profiles).length;
      }
    }
  };

  // Touch streak / lastVisit on every page load
  try {
    var p = read();
    if (p.createdAt) {
      // existing player just visited — bump lastVisit but DON'T touch streak unless they actually play
      p.lastVisit = Date.now();
      write(p);
    }
  } catch (e) {}

  if (typeof window !== "undefined") {
    window.MrMacsProfile = API;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }

  // ============== Dev-only self-check ==============
  // Runs only when loaded from localhost. Verifies that every public
  // API method named in the file header is actually present + callable,
  // and that every achievement id in the registry is reachable. Throws
  // loudly in dev to catch regressions; silent in production.
  try {
    if (typeof globalThis !== "undefined" &&
        globalThis.location &&
        /localhost|127\.0\.0\.1/.test(globalThis.location.host || "")) {
      var REQUIRED_TOP_LEVEL = [
        "AVATARS", "ACHIEVEMENTS", "DEFAULT_SETTINGS", "SHOP_ITEMS",
        "get", "exists", "set", "reset",
        "getName", "setName", "getAvatar", "setAvatar",
        "getCourse", "setCourse", "getTestPrep", "setTestPrep",
        "getShards", "addShards", "spendShards",
        "getInventory", "getShopSpec", "buyItem", "consumeItem",
        "extendBuff", "dispelBuff", "getActiveBuffs",
        "unlock", "unlockGameAchievement", "bumpAchievement",
        "hasAchievement", "listAchievements",
        "recordPlay", "recordCompletion", "getRecent", "getStreak",
        "getDailyChallengeState", "claimDailyChallenge",
        "getDailyChallengeStreak", "getDailyChallengeMissed",
        "recordScholarCorrect", "recordAnswer",
        "getTopicStats", "getWrongQueue", "removeWrongAnswer",
        "gradeWrongAnswer", "getMasteredCards", "getDueWrongAnswers", "clearWrongQueue",
        "hasSeenTour", "markTourSeen", "resetTour",
        "recordCramRun", "getCramHistory",
        "setDiagnostic", "getDiagnostic",
        "recordMockExam", "getMockExamHistory",
        "getSettings", "setSettings",
        "on", "off", "once", "eventNames",
        "getLifetimeStats", "getTopGames",
        "exportProfile", "importProfile", "resetProfile",
        "roster"
      ];
      var REQUIRED_ROSTER = ["list", "getActiveId", "create", "switch", "remove", "rename", "count"];
      var missing = [];
      REQUIRED_TOP_LEVEL.forEach(function (k) {
        if (API[k] === undefined) missing.push("MrMacsProfile." + k);
      });
      REQUIRED_ROSTER.forEach(function (k) {
        if (!API.roster || typeof API.roster[k] !== "function") {
          missing.push("MrMacsProfile.roster." + k);
        }
      });
      if (missing.length) {
        throw new Error("[arcade-profile dev-check] missing API: " + missing.join(", "));
      }
      // Achievement-registry coverage check: every id should be
      // looked up in some unlock path. We can't statically prove every
      // game wires correctly, but we verify the registry index is
      // self-consistent and that flagship game ids are present.
      var FLAGSHIP_GAME_ACHIEVEMENTS = [
        "brickoria-clear", "stellar-mothership", "snake-tail-50",
        "chronoblocks-tetris", "cascade-rainbow", "chronohop-pads",
        "step-pyramid-clear", "step-pyramid-lured",
        "citadel-cascade", "rumor-fact-spare"
      ];
      var orphaned = FLAGSHIP_GAME_ACHIEVEMENTS.filter(function (id) {
        return !ACHIEVEMENT_INDEX[id];
      });
      if (orphaned.length) {
        throw new Error("[arcade-profile dev-check] achievement registry missing flagship ids: " + orphaned.join(", "));
      }
      // Sanity-check that unlock+hasAchievement are idempotent
      var devProbeId = "first-name";
      try {
        var first = API.unlock(devProbeId);
        var second = API.unlock(devProbeId);
        if (!first || !second || (first.newAchievement && second.newAchievement)) {
          throw new Error("[arcade-profile dev-check] unlock() is not idempotent");
        }
      } catch (e) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn(e && e.message ? e.message : e);
        }
      }
    }
  } catch (e) {
    if (typeof console !== "undefined" && console.error) {
      console.error(e);
    }
  }
})();
