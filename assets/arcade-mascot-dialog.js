/* arcade-mascot-dialog.js — Context-aware dialog layer for Mr. Mac.
 *
 * Extends the existing mascot (arcade-mascot.js) with situational speech.
 * Does NOT modify arcade-mascot.js — purely additive.
 *
 * window.MrMacsMascotDialog = {
 *   start()                     — call once at hub init; subscribes to events
 *   stop()                      — tear down subscriptions / timers
 *   say(category, force=false)  — trigger a line from a named category
 *   registerLines(category, lines) — add/replace lines for a category
 *   mute() / unmute() / isMuted()
 *   on(event, handler) / off(event, handler)
 * }
 *
 * Categories: "first-visit" | "streak-3" | "streak-7" | "streak-30" |
 *             "shards-1k"   | "shards-10k" | "weekend"  | "morning"  |
 *             "afternoon"   | "late-night-warning" | "first-game" | "encouragement"
 *
 * Requires: arcade-mascot.js (MrMacsMascot) to be loaded first, or already
 * present when start() is called.  If the mascot loads after start() the
 * module defers via a short polling loop before giving up.
 *
 * Idempotent: second start() call is ignored until stop() is called.
 * No external dependencies.
 */
(function (root) {
  "use strict";

  if (root.MrMacsMascotDialog) return; // idempotent guard

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  var MUTE_KEY        = "mr-macs-arcade-mascot-mute";
  var COOLDOWN_MS     = 30 * 1000;          // 30 s between any two lines
  var LATE_NIGHT_HOUR = 22;                 // >= 22:00 local → late-night warning
  var MASCOT_WAIT_MS  = 5000;              // max time to wait for mascot to load
  var MASCOT_POLL_MS  = 200;               // poll interval while waiting

  // ---------------------------------------------------------------------------
  // Built-in lines  (15 per category; randomised on each say() call)
  // ---------------------------------------------------------------------------
  var BUILT_IN = {
    "first-visit": [
      "Welcome! Pick any cabinet — there are 219 to try.",
      "I'm Mr. Mac. Hop into anything — even a 5-min source sprint counts.",
      "First time here? Start anywhere. Every cabinet builds skills.",
      "219 cabinets, infinite second chances. Dive in.",
      "All review modes are unlocked from day one. Go wild.",
      "No wrong door. Pick the cabinet that looks fun and start there.",
      "Shards are how we keep score. Questions earn shards. Easy.",
      "Streaks reward daily play — even five minutes counts.",
      "You can switch courses anytime from your profile.",
      "The shop converts shards into boosts. Earn first, shop later.",
      "Every cabinet tracks your score history so you can see growth.",
      "Quick tip: play the same game two days in a row to build a streak.",
      "Leaderboards update live — your name could be up there today.",
      "There's a daily challenge waiting for you right now.",
      "Welcome to the arcade. The Regents won't know what hit it."
    ],
    "streak-3": [
      "Three days in a row. Habits are forming.",
      "Day 3. The streak is real now.",
      "Three consecutive days — neuroscience approves.",
      "A 3-day streak means your brain is starting to expect this.",
      "Three in a row. Keep the chain alive.",
      "Solid. Three days of consistent review beats one marathon.",
      "Day three. That's officially a pattern.",
      "3-day streak — you're ahead of most students already.",
      "Three days running. Don't stop now.",
      "The momentum is yours. Protect that streak.",
      "Day 3 complete. Research says it takes 21 days to build a habit.",
      "Three-day hunter. Looking good on the leaderboard.",
      "Consistency is the cheat code. Three days in.",
      "Streak alive at 3. The shop is watching.",
      "Three days means you're 10 % of the way to a week."
    ],
    "streak-7": [
      "A whole week. The Romans had a 7-day week too — they'd be proud.",
      "Seven days straight. That's a full week of reviewing.",
      "Week one complete. The discipline is showing.",
      "Seven-day streak. You're in rare company.",
      "One full week. Your memory is being reshaped right now.",
      "7 days. Hippocampus says thank you.",
      "A complete week of review. Spaced repetition is working.",
      "Seven days. Most students quit on day two.",
      "Week warrior status: confirmed.",
      "One week down. The Regents exam feels a little less scary, right?",
      "7-day streak — that's more review days than most entire study sessions.",
      "Full week. You've officially turned reviewing into a routine.",
      "Seven consecutive days. The streak shield was made for players like you.",
      "Week one cleared. Whatever you're doing — keep doing it.",
      "Seven days of showing up. That's the whole game."
    ],
    "streak-30": [
      "30-day streak. You are officially in the top 1% of consistent students.",
      "Thirty days. That's not a habit, that's a lifestyle.",
      "30 days straight. I've watched students ace exams on fewer study days total.",
      "A full month. The exam should be afraid of you.",
      "30-day streak. The leaderboard knows your name.",
      "One month of daily review. That's elite.",
      "Thirty days in a row. Your classmates are somewhere watching TV.",
      "30 days. The Roman legions trained for 30 days and conquered the world.",
      "A full month of showing up. That is extraordinary.",
      "30-day streak holder. You've earned permanent respect in this arcade.",
      "Thirty consecutive days. The Regents doesn't stand a chance.",
      "Day 30. Some teachers don't prep this consistently.",
      "A month of streaks. Your brain has been rewired for this exam.",
      "30 days. Whatever you scored on the diagnostic — it's higher now.",
      "Thirty days of review. Marathon Mind achievement is yours."
    ],
    "shards-1k": [
      "A thousand shards. Treat yourself in the shop.",
      "1,000 shards. That's real currency — go spend it.",
      "The 1k mark. Lucky Charm is looking affordable.",
      "One thousand shards earned. The shop unlocks some good stuff at this level.",
      "1,000 shards in the wallet. Well played.",
      "Crossed 1,000 shards. That's dedication turned into points.",
      "1k shards. The economy of studying is working in your favor.",
      "A thousand shards says you've answered a lot of questions correctly.",
      "One thousand. That's a lot of right answers.",
      "1,000 shards. First milestone hit. Many more to go.",
      "Hit the 1k mark. Time to browse the shop.",
      "1,000 shards earned lifetime. The Coin Doubler pays itself back fast.",
      "Shard count: 1,000. Achievement unlocked — now go spend some.",
      "A thousand shards is just the beginning.",
      "1k shards. You've officially moved past the tutorial phase."
    ],
    "shards-10k": [
      "Ten thousand shards. Are you sure you're not a teacher?",
      "10,000 shards. That's an absurd amount of correct answers.",
      "Ten thousand. The shop has nothing left to scare you.",
      "10k shards. You've answered more questions than some textbooks have pages.",
      "Ten thousand shards earned. Legendary-tier student behavior.",
      "10,000 shards. The leaderboard is just a formality at this point.",
      "You hit 10k shards. I don't know what else to say — that's incredible.",
      "Ten thousand. Whatever the exam asks, you've probably seen it.",
      "10k shards in the bank. Elite status confirmed.",
      "Ten thousand shards. Students who reach this usually ace the Regents.",
      "10,000 shards. Marathon Mind, Week Warrior, and now this.",
      "You've crossed 10k. The arcade has met its match.",
      "Ten thousand shards. Retirement plans? Just kidding. Keep going.",
      "10k shards. I've run out of history puns because I'm in awe.",
      "Ten thousand. I need to tell the principal."
    ],
    "weekend": [
      "Weekend review — the move that separates good from great.",
      "No school today, but the shards don't care.",
      "Weekend hustle. Your brain doesn't get days off.",
      "Most students sleep in. You're here. That's the difference.",
      "Weekend studying isn't punishment — it's a competitive edge.",
      "Even 15 minutes on a weekend compounds over a semester.",
      "It's the weekend. You could be anywhere. You're here. Respect.",
      "Weekend shards count double on the leaderboard — well, not really, but they should.",
      "Saturday or Sunday? Either way, you showed up.",
      "Weekend review. Future you is already grateful.",
      "No school, but the arcade is always open.",
      "Weekend warrior status loading…",
      "Taking the weekend off is fine. Studying on it is better.",
      "Weekend drop-in. Some habits can't be turned off.",
      "The exam doesn't care what day it is. Neither should you."
    ],
    "morning": [
      "Morning! What are we drilling first?",
      "Early bird. The brain is fresh — best time to absorb new material.",
      "Good morning. Coffee optional; review mandatory.",
      "Morning session. You're ahead of everyone still asleep.",
      "Up early and reviewing? That's future-exam energy.",
      "Morning review locks in retention better than night cramming.",
      "Good morning, scholar. Let's make these minutes count.",
      "Early study hits different. The material sticks.",
      "Morning crew. Pick a cabinet and let's go.",
      "Rise and review. The shards await.",
      "Morning check-in complete. Now let's earn some shards.",
      "First thing in the morning — your working memory is at peak capacity.",
      "Morning. Whatever you review now will consolidate while you sleep tonight.",
      "Early session. Strong move.",
      "Good morning. The exam isn't in the morning, but studying in the morning is still a power move."
    ],
    "afternoon": [
      "Afternoon studying — best time according to research.",
      "Afternoon. Reaction time peaks around now. Good call.",
      "Post-lunch review. Classic move.",
      "Afternoon session. Core body temperature is up, focus follows.",
      "Studies show afternoon is peak cognitive performance time. You chose well.",
      "Afternoon drop-in. Smart scheduling.",
      "The afternoon sweet spot. Grab a cabinet.",
      "Afternoon review means you'll sleep on it tonight. Perfect consolidation window.",
      "Mid-afternoon. Brain is warm, stakes are low. Ideal review conditions.",
      "Afternoon study session. This is how habits are built.",
      "After school grind. This is what separates June from regret.",
      "Afternoon is prime time. Let's not waste it.",
      "Post-lunch brain is humming. Put it to work.",
      "Afternoon session in. The leaderboard updates in real time.",
      "Good afternoon. The arcade has been waiting."
    ],
    "late-night-warning": [
      "It's late. Sleep is when your brain consolidates what you reviewed today. Maybe call it?",
      "Late-night review is a trap — tired brains store memories poorly. Rest up.",
      "Hey. It's past 10. The material will still be here tomorrow.",
      "Sleep consolidates memory. An extra hour of rest beats an extra hour of review.",
      "Late nights before an exam hurt more than they help. Log off soon.",
      "Your hippocampus does its best work during sleep. Give it material to work with.",
      "It's getting late. Seriously — sleep is part of studying.",
      "One more game is fine. But then close the tab and get some sleep.",
      "Late night arc. I see you. Just… don't sacrifice sleep for shards.",
      "The brain encodes during REM sleep. You need that more than more practice right now.",
      "Past 10 PM. Your future self wants you to sleep.",
      "Late-night grind noted. But performance on exam day depends on rest.",
      "The arcade appreciates the dedication. Your body needs rest though.",
      "It's late. Even Mr. Mac sleeps eventually.",
      "Solid session tonight. Now go sleep — that's when the magic happens."
    ],
    "first-game": [
      "You played your first game! What did you think?",
      "First game complete. That's the first of many.",
      "First play in the books. How'd it feel?",
      "You've broken the seal — first game done.",
      "First game logged. The streak clock has started.",
      "One game in. The leaderboard can see you now.",
      "First mission complete. Welcome to the roster.",
      "You played your first game. Achievement: First Mission — earned.",
      "First game done. The rest get easier from here.",
      "First play recorded. This is how it begins.",
      "Game one. The best players all started exactly where you are.",
      "You're officially in the arcade. First game logged.",
      "First game — and definitely not the last.",
      "You showed up and played. That's step one.",
      "First game in the log. What are you hitting next?"
    ],
    "encouragement": [
      "Keep going. The exam doesn't study itself.",
      "Every question answered is a rep for your brain.",
      "Wrong answer? That's just a gap identified. Fix it now.",
      "Progress isn't always visible, but it's happening.",
      "The Regents isn't hard — it's just unfamiliar. You're fixing that.",
      "You've got this. You're literally here.",
      "Struggling? Good. That's where learning actually happens.",
      "Shards don't lie. You've put in real work.",
      "The students who do this consistently are the ones who pass with confidence.",
      "One more question. Then one more after that.",
      "Every session moves the needle, even a five-minute sprint.",
      "You could be doing anything right now. You chose to review. That matters.",
      "Not every day will feel like progress. Keep showing up anyway.",
      "Correct answers feel great. Wrong ones are more valuable.",
      "The review arcade exists because you deserve to succeed."
    ]
  };

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------
  function safeLS(action, key, value) {
    try {
      if (action === "get") return localStorage.getItem(key);
      if (action === "set") { localStorage.setItem(key, value); return null; }
    } catch (_e) { return null; }
  }

  function pick(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function nowHour() {
    try { return new Date().getHours(); } catch (_e) { return 12; }
  }

  function isWeekend() {
    try { var d = new Date().getDay(); return d === 0 || d === 6; }
    catch (_e) { return false; }
  }

  function todayKey() {
    try {
      var d = new Date();
      return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
    } catch (_e) { return "unknown"; }
  }

  function getProfile() {
    try { return (typeof root.MrMacsProfile !== "undefined") ? root.MrMacsProfile : null; }
    catch (_e) { return null; }
  }

  function getMascot() {
    try { return (typeof root.MrMacsMascot !== "undefined") ? root.MrMacsMascot : null; }
    catch (_e) { return null; }
  }

  function isProfileFresh() {
    // "fresh" = no plays ever recorded and profile is very new
    try {
      var p = getProfile();
      if (!p) return true;
      var data = p.get();
      if (!data) return true;
      var recent = (data.recentGames || []);
      return recent.length === 0;
    } catch (_e) { return true; }
  }

  function totalShardsEarned() {
    try {
      var p = getProfile();
      if (!p) return 0;
      var data = p.get();
      return (data && typeof data.totalShardsEarned === "number") ? data.totalShardsEarned : 0;
    } catch (_e) { return 0; }
  }

  // ---------------------------------------------------------------------------
  // Module state
  // ---------------------------------------------------------------------------
  var _lines   = {};    // category -> [string]
  var _running = false;
  var _muted   = false;
  var _lastSpokenAt = 0;
  var _lateNightWarnedDate = null;
  var _shardsMilestones = { "1k": false, "10k": false };
  var _listeners = {};

  // Profile event unsub pairs: [[eventName, handler], ...]
  var _unsubs = [];
  // Timer handles
  var _timers = [];

  // ---------------------------------------------------------------------------
  // Event emitter
  // ---------------------------------------------------------------------------
  function emit(event, payload) {
    var arr = _listeners[event];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (_e) {}
    }
  }

  function on(event, handler) {
    if (typeof handler !== "function") return;
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(handler);
  }

  function off(event, handler) {
    var arr = _listeners[event];
    if (!arr) return;
    for (var i = arr.length - 1; i >= 0; i--) {
      if (arr[i] === handler) arr.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Core speak / cooldown
  // ---------------------------------------------------------------------------
  function resolveLines(category) {
    // Prefer custom registrations, fall back to built-ins
    return (_lines[category] && _lines[category].length)
      ? _lines[category]
      : (BUILT_IN[category] || null);
  }

  /**
   * Deliver a line for `category` via MrMacsMascot.setMessage.
   * Respects mute flag and 30-second cooldown unless force=true.
   * Will defer up to MASCOT_WAIT_MS if the mascot isn't loaded yet.
   */
  function say(category, force) {
    if (_muted && !force) return;
    var now = Date.now();
    if (!force && (now - _lastSpokenAt) < COOLDOWN_MS) return;

    var pool = resolveLines(category);
    if (!pool || !pool.length) return;

    var line = pick(pool);
    if (!line) return;

    _lastSpokenAt = now;
    emit("dialog:say", { category: category, line: line });

    // Attempt to deliver; if mascot not yet present, poll briefly
    var mascot = getMascot();
    if (mascot && typeof mascot.setMessage === "function") {
      try { mascot.setMessage(line); } catch (_e) {}
      return;
    }

    // Deferred delivery
    var waited = 0;
    var interval = setInterval(function () {
      waited += MASCOT_POLL_MS;
      var m = getMascot();
      if (m && typeof m.setMessage === "function") {
        clearInterval(interval);
        try { m.setMessage(line); } catch (_e) {}
        return;
      }
      if (waited >= MASCOT_WAIT_MS) {
        clearInterval(interval);
      }
    }, MASCOT_POLL_MS);
    _timers.push(interval);
  }

  // ---------------------------------------------------------------------------
  // Mute
  // ---------------------------------------------------------------------------
  function mute() {
    _muted = true;
    safeLS("set", MUTE_KEY, "1");
    emit("dialog:mute", {});
  }

  function unmute() {
    _muted = false;
    safeLS("set", MUTE_KEY, "0");
    emit("dialog:unmute", {});
  }

  function isMuted() { return _muted; }

  // ---------------------------------------------------------------------------
  // Custom line registration
  // ---------------------------------------------------------------------------
  function registerLines(category, lines) {
    if (typeof category !== "string" || !Array.isArray(lines)) return;
    _lines[category] = lines.slice();
  }

  // ---------------------------------------------------------------------------
  // Shard milestone tracking
  // ---------------------------------------------------------------------------
  function checkShardMilestones() {
    try {
      var total = totalShardsEarned();
      if (!_shardsMilestones["10k"] && total >= 10000) {
        _shardsMilestones["10k"] = true;
        _shardsMilestones["1k"]  = true; // also mark 1k so it doesn't fire
        say("shards-10k");
      } else if (!_shardsMilestones["1k"] && total >= 1000) {
        _shardsMilestones["1k"] = true;
        say("shards-1k");
      }
    } catch (_e) {}
  }

  // ---------------------------------------------------------------------------
  // Profile event handlers
  // ---------------------------------------------------------------------------
  function onStreakAdvance(ev) {
    try {
      var detail = ev && ev.detail;
      var days = detail && typeof detail.current === "number" ? detail.current : null;
      if (days === null) return;
      if (days >= 30)     say("streak-30");
      else if (days >= 7) say("streak-7");
      else if (days >= 3) say("streak-3");
    } catch (_e) {}
  }

  function onWalletChange(ev) {
    try {
      // wallet:change fires for both earning and spending; only check on earns
      var detail = ev && ev.detail;
      if (!detail || typeof detail.delta !== "number" || detail.delta <= 0) return;
      checkShardMilestones();
    } catch (_e) {}
  }

  // Track whether first game has been seen this session
  var _firstGameFired = false;

  function onRecordPlay(ev) {
    try {
      // recordPlay doesn't emit a custom event directly, so we intercept
      // via the profile's "streak:advance" or simply patch after start().
      // This handler is called from our own patched recordPlay wrapper.
      if (_firstGameFired) return;
      var p = getProfile();
      if (!p) return;
      var data = p.get();
      var recent = (data && data.recentGames) || [];
      // If only 1 game in history it's the very first
      if (recent.length === 1) {
        _firstGameFired = true;
        say("first-game");
      }
    } catch (_e) {}
  }

  // ---------------------------------------------------------------------------
  // Late-night warning (one-time per calendar day)
  // ---------------------------------------------------------------------------
  function checkLateNight() {
    try {
      var today = todayKey();
      if (_lateNightWarnedDate === today) return;
      if (nowHour() >= LATE_NIGHT_HOUR) {
        _lateNightWarnedDate = today;
        say("late-night-warning");
      }
    } catch (_e) {}
  }

  // ---------------------------------------------------------------------------
  // Periodic ambient checks (every 60 s while running)
  // ---------------------------------------------------------------------------
  function startAmbientLoop() {
    var interval = setInterval(function () {
      if (!_running) { clearInterval(interval); return; }
      checkLateNight();
    }, 60 * 1000);
    _timers.push(interval);
  }

  // ---------------------------------------------------------------------------
  // Patch MrMacsProfile.recordPlay to intercept first-play event
  // We use a thin non-destructive wrapper, removed on stop().
  // ---------------------------------------------------------------------------
  var _originalRecordPlay = null;

  function patchRecordPlay() {
    try {
      var p = getProfile();
      if (!p || typeof p.recordPlay !== "function") return;
      if (p.__dialogPatched) return;
      _originalRecordPlay = p.recordPlay.bind(p);
      p.recordPlay = function (meta) {
        var result = _originalRecordPlay(meta);
        try { onRecordPlay(null); } catch (_e) {}
        return result;
      };
      p.__dialogPatched = true;
    } catch (_e) {}
  }

  function unpatchRecordPlay() {
    try {
      var p = getProfile();
      if (!p || !p.__dialogPatched || !_originalRecordPlay) return;
      p.recordPlay = _originalRecordPlay;
      delete p.__dialogPatched;
      _originalRecordPlay = null;
    } catch (_e) {}
  }

  // ---------------------------------------------------------------------------
  // Subscribe to profile events
  // ---------------------------------------------------------------------------
  function subscribeProfile() {
    try {
      var p = getProfile();
      if (!p || typeof p.on !== "function") return;
      p.on("streak:advance", onStreakAdvance);
      _unsubs.push(["streak:advance", onStreakAdvance]);
      p.on("wallet:change", onWalletChange);
      _unsubs.push(["wallet:change", onWalletChange]);
    } catch (_e) {}
  }

  function unsubscribeProfile() {
    try {
      var p = getProfile();
      if (p && typeof p.off === "function") {
        for (var i = 0; i < _unsubs.length; i++) {
          try { p.off(_unsubs[i][0], _unsubs[i][1]); } catch (_e) {}
        }
      }
    } catch (_e) {}
    _unsubs = [];
  }

  // ---------------------------------------------------------------------------
  // start()
  // ---------------------------------------------------------------------------
  function start() {
    if (_running) return; // idempotent
    _running = true;

    // Restore mute preference
    _muted = safeLS("get", MUTE_KEY) === "1";

    // Seed known milestone state from profile so we don't re-fire old milestones
    try {
      var total = totalShardsEarned();
      if (total >= 10000) { _shardsMilestones["10k"] = true; _shardsMilestones["1k"] = true; }
      else if (total >= 1000) { _shardsMilestones["1k"] = true; }
    } catch (_e) {}

    // Subscribe to profile events
    subscribeProfile();

    // Patch recordPlay for first-game detection
    patchRecordPlay();

    // Opening line — defer slightly so the page/mascot can finish rendering
    var openTimer = setTimeout(function () {
      if (!_running) return;
      if (isProfileFresh()) {
        say("first-visit");
      } else {
        // Time-of-day greeting
        var hour = nowHour();
        if (hour >= LATE_NIGHT_HOUR) {
          // Late night — warn rather than greet
          var today = todayKey();
          if (_lateNightWarnedDate !== today) {
            _lateNightWarnedDate = today;
            say("late-night-warning");
          }
        } else if (isWeekend()) {
          say("weekend");
        } else if (hour >= 5 && hour < 12) {
          say("morning");
        } else {
          say("afternoon");
        }
      }
    }, 1200);
    _timers.push(openTimer);

    // Late-night ambient check
    checkLateNight();
    startAmbientLoop();

    emit("dialog:start", {});
  }

  // ---------------------------------------------------------------------------
  // stop()
  // ---------------------------------------------------------------------------
  function stop() {
    if (!_running) return;
    _running = false;

    // Clear all timers
    for (var i = 0; i < _timers.length; i++) {
      try { clearTimeout(_timers[i]); clearInterval(_timers[i]); } catch (_e) {}
    }
    _timers = [];

    unsubscribeProfile();
    unpatchRecordPlay();

    emit("dialog:stop", {});
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  root.MrMacsMascotDialog = {
    start:          start,
    stop:           stop,
    say:            say,
    registerLines:  registerLines,
    mute:           mute,
    unmute:         unmute,
    isMuted:        isMuted,
    on:             on,
    off:            off
  };

})(typeof window !== "undefined" ? window : this);
