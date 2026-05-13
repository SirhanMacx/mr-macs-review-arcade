/* Mr. Mac's Review Arcade · student-safe public names
   Shared policy for local leaderboards, multiplayer rooms, and optional
   global leaderboard submissions. The goal is classroom-safe display text:
   short handles, no PII-looking strings, no profanity/slurs, no leet bypasses.
*/
(function (root) {
  "use strict";

  if (root.MrMacsNameSafety) return;

  var CUSTOM_KEY = "arcade.nameSafety.customBlocklist.v1";
  var HANDLE_KEY = "arcade.globalLeaderboard.publicHandle.v1";
  var DEFAULT_NAME = "PLAYER";
  var DEFAULT_HANDLE = "PLAYER-000";

  var BLOCKED_STEMS = [
    "fuck","fck","fuk","shit","sht","piss","cunt","cnt","dick","cock","cok",
    "pussy","pusy","penis","vagina","boob","tit","tts","anal","anus","ass",
    "arse","sex","porn","prn","cum","jizz","slut","whore","hoe","bitch",
    "btch","bastrd","bastard","blowjob","handjob","jerk","wank","masturb",
    "nigg","ngr","fag","fgt","retard","retrd","rtrd","spic","chink","kike",
    "wetback","trann","tranny","gook","jap","beaner","cracker","honky",
    "dyke","queer","homo","kill","hitler","heil","nazi","isis","kkk",
    "lynch","rape","rpe","jihad","azz","azs","biotch","b1tch","b!tch"
  ];

  var LEET_MAP = {
    "0":"o","1":"i","!":"i","|":"i","3":"e","4":"a","@":"a",
    "5":"s","$":"s","7":"t","+":"t","8":"b","9":"g"
  };

  function loadCustomTerms() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(CUSTOM_KEY);
      var terms = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(terms)) return;
      terms.forEach(function (term) {
        var norm = normalizeForFilter(term);
        if (norm && BLOCKED_STEMS.indexOf(norm) === -1) BLOCKED_STEMS.push(norm);
      });
    } catch (e) {}
  }

  function saveCustomTerm(term) {
    try {
      var raw = root.localStorage && root.localStorage.getItem(CUSTOM_KEY);
      var terms = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(terms)) terms = [];
      if (terms.indexOf(term) === -1) terms.push(term);
      root.localStorage.setItem(CUSTOM_KEY, JSON.stringify(terms.slice(-200)));
    } catch (e) {}
  }

  function normalizeForFilter(value) {
    var input = String(value == null ? "" : value).toLowerCase();
    var out = "";
    for (var i = 0; i < input.length; i++) {
      var ch = input[i];
      if (LEET_MAP[ch]) {
        out += LEET_MAP[ch];
      } else if (ch >= "a" && ch <= "z") {
        out += ch;
      }
    }
    return out;
  }

  function hasPiiShape(value) {
    var s = String(value == null ? "" : value).trim();
    if (!s) return false;
    if (/@/.test(s)) return true;
    if (/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(s)) return true;
    if (/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(s)) return true;
    if (/\b(?:19|20)\d{2}\b/.test(s)) return true;
    if (/\b(?:snap|tiktok|insta|discord|gmail|email|phone|address)\b/i.test(s)) return true;
    return false;
  }

  function isBlockedName(value) {
    var norm = normalizeForFilter(value);
    if (!norm) return false;
    for (var i = 0; i < BLOCKED_STEMS.length; i++) {
      if (norm.indexOf(BLOCKED_STEMS[i]) !== -1) return true;
    }
    return hasPiiShape(value);
  }

  function scrubVisible(value, maxLen) {
    var cleaned = String(value == null ? "" : value)
      .replace(/[^\w .'-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLen || 24);
    return cleaned;
  }

  function sanitizeDisplayName(value, fallback) {
    if (isBlockedName(value)) return fallback || DEFAULT_NAME;
    var cleaned = scrubVisible(value, 24);
    if (!cleaned || isBlockedName(cleaned)) return fallback || DEFAULT_NAME;
    return cleaned;
  }

  function sanitizeInitials(value, fallback) {
    var raw = String(value == null ? "" : value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (!raw || isBlockedName(raw)) return fallback || "PLR";
    return raw;
  }

  function sanitizeHandle(value, fallback) {
    if (isBlockedName(value)) return fallback || DEFAULT_HANDLE;
    var raw = String(value == null ? "" : value)
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 14);
    if (raw.length < 3 || !/\d/.test(raw) || isBlockedName(raw)) return fallback || DEFAULT_HANDLE;
    return raw;
  }

  function hashString(value) {
    var h = 2166136261;
    var s = String(value == null ? "" : value);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function generatedHandle(seed) {
    var words = ["NOVA","PIXEL","QUEST","ATLAS","ORBIT","LASER","TURBO","VOLT","COMET","NEON","VECTOR","ARCADE"];
    var h = hashString(seed || (Date.now() + ":" + Math.random()));
    var word = words[h % words.length];
    var num = String((h % 900) + 100);
    return sanitizeHandle(word + "-" + num, DEFAULT_HANDLE);
  }

  function readStoredHandle() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(HANDLE_KEY);
      return raw ? sanitizeHandle(raw, "") : "";
    } catch (e) {
      return "";
    }
  }

  function writeStoredHandle(handle) {
    var clean = sanitizeHandle(handle, "");
    if (!clean) return "";
    try { root.localStorage.setItem(HANDLE_KEY, clean); } catch (e) {}
    return clean;
  }

  function profileSeed() {
    try {
      if (root.MrMacsProfile && root.MrMacsProfile.get) {
        var p = root.MrMacsProfile.get();
        if (p && p.id) return "profile:" + p.id;
      }
    } catch (e) {}
    try {
      if (root.MrMacsProfile && root.MrMacsProfile.roster &&
          typeof root.MrMacsProfile.roster.getActiveId === "function") {
        var id = root.MrMacsProfile.roster.getActiveId();
        if (id) return "profile:" + id;
      }
    } catch (e) {}
    try {
      var sid = root.localStorage && root.localStorage.getItem("arcade.nameSafety.seed");
      if (!sid) {
        sid = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
        root.localStorage.setItem("arcade.nameSafety.seed", sid);
      }
      return "browser:" + sid;
    } catch (e) {}
    return "session:" + Math.random();
  }

  function publicHandle() {
    var stored = readStoredHandle();
    if (stored) return stored;
    return writeStoredHandle(generatedHandle(profileSeed())) || DEFAULT_HANDLE;
  }

  function publicClientId() {
    return "c" + hashString(profileSeed() + ":public-leaderboard").toString(36);
  }

  function addBlockedTerm(term) {
    var norm = normalizeForFilter(term);
    if (!norm || BLOCKED_STEMS.indexOf(norm) !== -1) return false;
    BLOCKED_STEMS.push(norm);
    saveCustomTerm(norm);
    return true;
  }

  loadCustomTerms();

  root.MrMacsNameSafety = {
    normalizeForFilter: normalizeForFilter,
    isBlockedName: isBlockedName,
    sanitizeDisplayName: sanitizeDisplayName,
    sanitizeInitials: sanitizeInitials,
    sanitizeHandle: sanitizeHandle,
    generatedHandle: generatedHandle,
    publicHandle: publicHandle,
    publicClientId: publicClientId,
    setPublicHandle: writeStoredHandle,
    addBlockedTerm: addBlockedTerm,
    hasPiiShape: hasPiiShape
  };
})(typeof window !== "undefined" ? window : globalThis);
