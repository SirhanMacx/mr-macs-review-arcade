/* Mr. Mac's Arcade — Player Profile Module
 *
 * 100% local-only. Reads + writes localStorage on the player's device.
 * No telemetry, no remote sync, no network calls.
 *
 * Exposes a single global: window.MrMacsProfile
 *
 *   MrMacsProfile.get()                        -> deep-clone of full profile
 *   MrMacsProfile.set(partial)                 -> shallow-merges + emits "profile:update"
 *   MrMacsProfile.exists()                     -> boolean (has the player set up?)
 *   MrMacsProfile.reset()                      -> wipe + emit
 *
 *   MrMacsProfile.getName() / setName(str)
 *   MrMacsProfile.getAvatar() / setAvatar(charOrUrl, kind)
 *
 *   MrMacsProfile.getShards()                  -> int
 *   MrMacsProfile.addShards(n, source)         -> new total; emits "wallet:change"
 *
 *   MrMacsProfile.unlock(id, [extra])          -> {alreadyUnlocked, newAchievement} ; emits "achievement:unlock"
 *   MrMacsProfile.hasAchievement(id)           -> boolean
 *   MrMacsProfile.listAchievements()           -> [{id, def, unlockedAt, count}]
 *   MrMacsProfile.bumpAchievement(id, by)      -> count (for "play 10 of X" style)
 *
 *   MrMacsProfile.recordPlay(meta)             -> updates recentGames + lastVisit + streak
 *   MrMacsProfile.recordCompletion(gameId, score) -> updates perGameStats
 *
 *   MrMacsProfile.getSettings()                -> { motion, sound, musicVolume, sfxVolume, fontFamily, colorblind, contrast }
 *   MrMacsProfile.setSettings(partial)         -> emits "settings:change"
 *
 *   MrMacsProfile.getStreak()                  -> { current, best, lastDay }
 *   MrMacsProfile.touchStreak()                -> internal; called by recordPlay
 *
 *   MrMacsProfile.on(event, handler) / off(event, handler)
 *   MrMacsProfile.AVATARS  -> array of suggested avatar choices
 *   MrMacsProfile.ACHIEVEMENTS -> array of achievement definitions
 *
 * Events:
 *   "profile:update"      detail: { profile }
 *   "profile:create"      detail: { profile }     (first-time setup)
 *   "wallet:change"       detail: { delta, total, source }
 *   "achievement:unlock"  detail: { id, def, unlockedAt }
 *   "settings:change"     detail: { settings }
 *   "streak:advance"      detail: { current, best }
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mr-macs-arcade-profile-v1";
  var EVENT_TARGET = (typeof window !== "undefined" && window) ? new EventTarget() : null;

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

    // ---- Cross-arcade ----
    { id: "cross-3-genres",    title: "Genre-Hopper",          desc: "Play 3 different flagship games.",                 tier: "silver",    icon: "🎲" },
    { id: "cross-shards-1k",   title: "Shard Hoarder",         desc: "Earn 1,000 lifetime shards.",                      tier: "gold",      icon: "💎" },
    { id: "cross-shards-10k",  title: "Treasure Vault",        desc: "Earn 10,000 lifetime shards.",                     tier: "legendary", icon: "💰" },
    { id: "cross-cram",        title: "Cram Sesh",             desc: "Complete a 4-game Cram Mode playlist.",            tier: "gold",      icon: "📚" }
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

  function defaultProfile() {
    return {
      version: 2,
      name: "",
      avatar: "🎓",
      avatarKind: "emoji",
      // The student's primary enrolled course. Set during welcome
      // setup; editable from the profile drawer. Drives diagnostic
      // question selection, daily challenge weighting, library +
      // jeopardy default filters, etc. Empty string = "all courses".
      course: "",
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
      // Phase 3 — tour bookkeeping
      tourSeen: {},        // gameId -> timestamp
      // Phase 7 — completed cram playlists / diagnostic results
      cramHistory: [],     // [{ course, completedAt, results: {...} }]
      diagnostic: null,    // { takenAt, results: {course: weakUnits[]}, recommendation }
      shards: 0,
      totalShardsEarned: 0,
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

  function read() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return defaultProfile(); }
    if (!raw) return defaultProfile();
    try {
      var parsed = JSON.parse(raw);
      // Migration: ensure all expected keys exist
      var p = defaultProfile();
      if (parsed && typeof parsed === "object") {
        Object.keys(p).forEach(function (k) {
          if (parsed[k] !== undefined) p[k] = parsed[k];
        });
        // Settings deep-merge
        p.settings = Object.assign({}, DEFAULT_SETTINGS, parsed.settings || {});
        // Streak deep-merge
        p.streak = Object.assign({ current: 0, best: 0, lastDay: "" }, parsed.streak || {});
      }
      return p;
    } catch (e) { return defaultProfile(); }
  }

  function write(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
    catch (e) {}
  }

  function emit(name, detail) {
    if (!EVENT_TARGET) return;
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

  // ============== Public API ==============

  var API = {
    AVATARS: AVATARS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,

    get: function () { return clone(read()); },

    exists: function () {
      var p = read();
      return !!(p.name && p.createdAt);
    },

    set: function (partial) {
      var p = read();
      Object.keys(partial || {}).forEach(function (k) { p[k] = partial[k]; });
      write(p);
      emit("profile:update", { profile: clone(p) });
      return clone(p);
    },

    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      var p = defaultProfile();
      emit("profile:update", { profile: clone(p) });
      return clone(p);
    },

    getName: function () { return read().name || ""; },
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

    getAvatar: function () { return { value: read().avatar, kind: read().avatarKind }; },
    setAvatar: function (value, kind) {
      var p = read();
      p.avatar = value;
      p.avatarKind = kind || "emoji";
      write(p);
      emit("profile:update", { profile: clone(p) });
      return p.avatar;
    },

    getCourse: function () { return read().course || ""; },
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

    // ---- Wallet ----
    getShards: function () { return read().shards || 0; },
    addShards: function (n, source) {
      n = Number(n) || 0;
      if (!n) return read().shards;
      var p = read();
      p.shards = Math.max(0, (p.shards || 0) + n);
      if (n > 0) p.totalShardsEarned = (p.totalShardsEarned || 0) + n;
      write(p);
      emit("wallet:change", { delta: n, total: p.shards, source: source || "unknown" });
      // Cross-arcade shard milestones
      if (p.totalShardsEarned >= 10000) API.unlock("cross-shards-10k");
      else if (p.totalShardsEarned >= 1000) API.unlock("cross-shards-1k");
      return p.shards;
    },
    spendShards: function (n, source) {
      n = Math.abs(Number(n) || 0);
      var p = read();
      if (p.shards < n) return false;
      p.shards -= n;
      write(p);
      emit("wallet:change", { delta: -n, total: p.shards, source: source || "spend" });
      return true;
    },

    // ---- Achievements ----
    unlock: function (id, extra) {
      var def = ACHIEVEMENT_INDEX[id];
      if (!def) return { alreadyUnlocked: false, newAchievement: false };
      var p = read();
      p.achievements = p.achievements || {};
      if (p.achievements[id]) {
        // Already unlocked; possibly bump count
        if (extra && extra.bump) p.achievements[id].count = (p.achievements[id].count || 1) + 1;
        write(p);
        return { alreadyUnlocked: true, newAchievement: false };
      }
      p.achievements[id] = { unlockedAt: Date.now(), count: 1 };
      write(p);
      emit("achievement:unlock", { id: id, def: def, unlockedAt: p.achievements[id].unlockedAt });
      return { alreadyUnlocked: false, newAchievement: true };
    },
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
    hasAchievement: function (id) {
      var p = read();
      return !!(p.achievements && p.achievements[id]);
    },
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
        if (gap === 1) {
          p.streak.current = (p.streak.current || 0) + 1;
        } else if (gap > 1 || !p.streak.lastDay) {
          p.streak.current = 1;
        }
        p.streak.lastDay = today;
        p.streak.best = Math.max(p.streak.best || 0, p.streak.current);
        emit("streak:advance", { current: p.streak.current, best: p.streak.best });
        // Streak achievements
        if (p.streak.current >= 30) API.unlock("streak-30");
        else if (p.streak.current >= 7) API.unlock("streak-7");
        else if (p.streak.current >= 3) API.unlock("streak-3");
      }
      // Per-game stats
      p.perGameStats = p.perGameStats || {};
      var gs = p.perGameStats[entry.id] || { plays: 0, bestScore: 0, lastPlayed: 0, completions: 0 };
      gs.plays = (gs.plays || 0) + 1;
      gs.lastPlayed = now;
      p.perGameStats[entry.id] = gs;
      // Cross-arcade: 3 different genres
      var distinctGenres = Object.keys(p.perGameStats).length;
      if (distinctGenres >= 3) API.unlock("cross-3-genres");
      write(p);
      // First-play achievement
      if (gs.plays === 1 && Object.keys(p.perGameStats).length === 1) API.unlock("first-play");
      emit("profile:update", { profile: clone(p) });
      return clone(entry);
    },

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

    getRecent: function (limit) {
      var p = read();
      var n = Number(limit) || 4;
      return (p.recentGames || []).slice(0, n);
    },

    getStreak: function () { return clone(read().streak); },

    // ---- Phase 7: topic stats + wrong-answer queue ----
    // Call once per Q answered. correct = boolean. course/set are course folder + unit/topic name.
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
      // Wrong-answer ring buffer (cap 80)
      if (!meta.correct) {
        p.wrongAnswers = p.wrongAnswers || [];
        p.wrongAnswers.unshift({
          prompt: String(meta.prompt || "").slice(0, 220),
          answer: String(meta.answer || "").slice(0, 80),
          course: course, set: set,
          gameId: String(meta.gameId || ""),
          ts: Date.now()
        });
        if (p.wrongAnswers.length > 80) p.wrongAnswers.length = 80;
      }
      write(p);
      // Don't emit profile:update on every answer (too chatty); emit a cheaper event
      emit("answer:record", { course: course, set: set, correct: !!meta.correct });
      return { correct: bucket.correct, total: bucket.total };
    },
    getTopicStats: function (course) {
      var p = read();
      var ts = p.topicStats || {};
      return course ? clone(ts[course] || {}) : clone(ts);
    },
    getWrongQueue: function (limit) {
      var p = read();
      var n = Number(limit) || 10;
      return (p.wrongAnswers || []).slice(0, n);
    },
    clearWrongQueue: function () {
      var p = read();
      p.wrongAnswers = [];
      write(p);
      emit("profile:update", { profile: clone(p) });
    },

    // ---- Phase 3: first-run tour ----
    hasSeenTour: function (gameId) {
      var p = read();
      return !!(p.tourSeen && p.tourSeen[gameId]);
    },
    markTourSeen: function (gameId) {
      var p = read();
      p.tourSeen = p.tourSeen || {};
      p.tourSeen[gameId] = Date.now();
      write(p);
      return true;
    },
    resetTour: function (gameId) {
      var p = read();
      p.tourSeen = p.tourSeen || {};
      if (gameId) delete p.tourSeen[gameId];
      else p.tourSeen = {};
      write(p);
    },

    // ---- Phase 7: cram history + diagnostic ----
    recordCramRun: function (entry) {
      var p = read();
      p.cramHistory = p.cramHistory || [];
      p.cramHistory.unshift(Object.assign({ completedAt: Date.now() }, entry || {}));
      if (p.cramHistory.length > 24) p.cramHistory.length = 24;
      write(p);
      emit("profile:update", { profile: clone(p) });
    },
    getCramHistory: function () { return clone(read().cramHistory || []); },
    setDiagnostic: function (results) {
      var p = read();
      p.diagnostic = Object.assign({ takenAt: Date.now() }, results || {});
      write(p);
      emit("profile:update", { profile: clone(p) });
    },
    getDiagnostic: function () { return clone(read().diagnostic || null); },

    // ---- Settings ----
    getSettings: function () { return clone(read().settings || DEFAULT_SETTINGS); },
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
    on: function (name, handler) {
      if (!EVENT_TARGET) return;
      EVENT_TARGET.addEventListener(name, handler);
    },
    off: function (name, handler) {
      if (!EVENT_TARGET) return;
      EVENT_TARGET.removeEventListener(name, handler);
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
})();
