/* ─────────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · arcade-search-helpers.js
   ─────────────────────────────────────────────────────────────────────────
   Search-enhancement module: fuzzy scoring, "Did you mean…?" suggestions,
   and library quick-filter chip data.

   Public API: window.MrMacsSearchHelpers
     .fuzzyScore(query, target)           → number  0-100
     .levenshtein(a, b)                   → number
     .suggestCorrection(query, vocab)     → string | null
     .buildVocabulary(games)              → string[]
     .filters.unplayed(game, profile)     → bool
     .filters.hasScholarPrompts(game)     → bool
     .filters.mobileFriendly(game)        → bool
     .filters.quickPlay(game)             → bool
     .mountDidYouMean(searchEl, container, vocab) → { unmount }
     .on(event, handler)
     .off(event, handler)

   Self-contained CSS — all class names prefixed "msh-".
   Works without window.GAMES.
   Idempotent: safe to load multiple times on the same page.
   ───────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";

  if (root.MrMacsSearchHelpers) return; // idempotent

  // ─── Constants ────────────────────────────────────────────────────────────

  var LEVENSHTEIN_CAP = 50;       // cap string length to prevent O(n²) blowup
  var SUGGEST_MAX_DIST = 3;       // max edit distance for "did you mean"
  var DYM_DEBOUNCE_MS  = 300;     // ms after last keystroke before suggesting
  var DYM_MIN_LENGTH   = 2;       // minimum query length to trigger suggestion

  // Quick-filter chip metadata (order determines display order)
  var CHIP_DATA = [
    { id: "unplayed",       label: "Unplayed",           icon: "🕹",  filterId: "unplayed"       },
    { id: "scholar",        label: "Has Scholar Prompts", icon: "📜",  filterId: "hasScholarPrompts" },
    { id: "mobile",         label: "Mobile Friendly",    icon: "📱",  filterId: "mobileFriendly" },
    { id: "quick",          label: "Quick Play",         icon: "⚡",  filterId: "quickPlay"      }
  ];

  // Mobile-friendly fallback game types (when no tag is present)
  var MOBILE_TYPES = ["Arcade", "Quick Play", "Practice"];

  // ─── Event emitter ────────────────────────────────────────────────────────

  var listeners = {};

  function on(event, handler) {
    if (typeof handler !== "function") return;
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }

  function off(event, handler) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (fn) { return fn !== handler; });
  }

  function emit(event, detail) {
    var fns = listeners[event] || [];
    var payload = { type: event, detail: detail || {} };
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](payload); } catch (e) { /* isolate bad handlers */ }
    }
  }

  // ─── CSS injection ────────────────────────────────────────────────────────

  var STYLE_ID = "msh-styles";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = [
      ".msh-dym-wrapper {",
      "  margin-top: 6px;",
      "  font-size: 13px;",
      "  line-height: 1.4;",
      "  color: #a0aabe;",
      "}",
      ".msh-dym-wrapper.msh-hidden { display: none; }",
      ".msh-dym-link {",
      "  color: #f5c451;",
      "  cursor: pointer;",
      "  text-decoration: underline;",
      "  text-underline-offset: 2px;",
      "  background: none;",
      "  border: none;",
      "  padding: 0;",
      "  font: inherit;",
      "  font-weight: 600;",
      "}",
      ".msh-dym-link:hover, .msh-dym-link:focus-visible {",
      "  color: #ffd884;",
      "  outline: none;",
      "}"
    ].join("\n");
    var head = document.head || document.getElementsByTagName("head")[0];
    if (head) head.appendChild(el);
  }

  // ─── Fuzzy scoring ────────────────────────────────────────────────────────

  /**
   * Returns a score 0-100 measuring how well `query` matches `target`.
   *
   * Tiers:
   *   90-100  exact substring match (case-insensitive)
   *   50-89   all query characters appear in order inside target
   *   1-49    Levenshtein-based proximity (lower distance → higher score)
   *   0       no usable match
   *
   * @param {string} query
   * @param {string} target
   * @returns {number}
   */
  function fuzzyScore(query, target) {
    if (!query || !target) return 0;
    var q = String(query).toLowerCase().trim();
    var t = String(target).toLowerCase().trim();
    if (!q || !t) return 0;

    // Tier 1: exact substring
    if (t.indexOf(q) !== -1) {
      // Bonus if it starts at the beginning
      var pos = t.indexOf(q);
      return pos === 0 ? 100 : 90;
    }

    // Tier 2: characters present in order
    var qi = 0;
    var consecutive = 0;
    var maxConsecutive = 0;
    for (var ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) {
        qi++;
        consecutive++;
        if (consecutive > maxConsecutive) maxConsecutive = consecutive;
      } else {
        consecutive = 0;
      }
    }
    if (qi === q.length) {
      // All characters matched in order
      var coverage = q.length / t.length;          // 0-1
      var seqBonus  = maxConsecutive / q.length;    // reward consecutive runs
      // Map to 50-89 range
      var raw = coverage * 0.5 + seqBonus * 0.5;
      return Math.round(50 + raw * 39);
    }

    // Tier 3: Levenshtein-based fallback
    var dist = levenshtein(q, t);
    var maxLen = Math.max(q.length, t.length);
    if (dist >= maxLen) return 0;                   // completely dissimilar
    // Map distance proportion to 1-49 range (smaller dist → higher score)
    return Math.max(1, Math.round((1 - dist / maxLen) * 49));
  }

  // ─── Levenshtein distance ─────────────────────────────────────────────────

  /**
   * Classic DP Levenshtein. Inputs are capped at LEVENSHTEIN_CAP chars.
   *
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  function levenshtein(a, b) {
    a = String(a).toLowerCase().slice(0, LEVENSHTEIN_CAP);
    b = String(b).toLowerCase().slice(0, LEVENSHTEIN_CAP);

    var aLen = a.length;
    var bLen = b.length;

    if (aLen === 0) return bLen;
    if (bLen === 0) return aLen;

    // Two-row rolling array to keep memory O(n)
    var prev = new Array(bLen + 1);
    var curr = new Array(bLen + 1);

    for (var j = 0; j <= bLen; j++) prev[j] = j;

    for (var i = 1; i <= aLen; i++) {
      curr[0] = i;
      for (j = 1; j <= bLen; j++) {
        var cost = (a[i - 1] === b[j - 1]) ? 0 : 1;
        curr[j] = Math.min(
          prev[j]     + 1,        // deletion
          curr[j - 1] + 1,        // insertion
          prev[j - 1] + cost      // substitution
        );
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[bLen];
  }

  // ─── "Did you mean" suggestion ────────────────────────────────────────────

  /**
   * Returns the vocab word closest to `query` by Levenshtein distance,
   * but only if that distance is ≤ SUGGEST_MAX_DIST. Returns null otherwise.
   *
   * @param {string} query
   * @param {string[]} vocab
   * @returns {string|null}
   */
  function suggestCorrection(query, vocab) {
    if (!query || !Array.isArray(vocab) || vocab.length === 0) return null;
    var q = String(query).toLowerCase().trim();
    if (!q) return null;

    var bestWord = null;
    var bestDist = Infinity;

    for (var i = 0; i < vocab.length; i++) {
      var word = String(vocab[i]);
      if (!word) continue;
      // Skip words that are identical or already substrings (no need to suggest)
      if (word.toLowerCase().indexOf(q) !== -1) return null;
      var d = levenshtein(q, word);
      if (d < bestDist) {
        bestDist = d;
        bestWord = word;
      }
    }

    if (bestDist <= SUGGEST_MAX_DIST && bestWord !== null) {
      return bestWord;
    }
    return null;
  }

  // ─── Vocabulary builder ───────────────────────────────────────────────────

  /**
   * Extracts a deduplicated word list from game titles, tags, and categories
   * for use as the `vocab` argument to suggestCorrection.
   *
   * @param {Array<Object>} games  Array of game objects
   * @returns {string[]}
   */
  function buildVocabulary(games) {
    if (!Array.isArray(games)) return [];
    var seen = {};
    var vocab = [];

    function add(str) {
      if (!str) return;
      var words = String(str).toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/);
      for (var w = 0; w < words.length; w++) {
        var word = words[w];
        if (word.length >= 3 && !seen[word]) {
          seen[word] = true;
          vocab.push(word);
        }
      }
    }

    for (var i = 0; i < games.length; i++) {
      var g = games[i];
      if (!g) continue;
      add(g.title || g.name);
      add(g.collection);
      if (Array.isArray(g.tags)) {
        for (var t = 0; t < g.tags.length; t++) add(g.tags[t]);
      }
      if (Array.isArray(g.categories)) {
        for (var c = 0; c < g.categories.length; c++) add(g.categories[c]);
      }
    }

    return vocab;
  }

  // ─── Quick-filter predicates ──────────────────────────────────────────────

  function _hasSomeTag(game, tagList) {
    if (!game) return false;
    var tags       = Array.isArray(game.tags)       ? game.tags       : [];
    var categories = Array.isArray(game.categories) ? game.categories : [];
    var combined   = tags.concat(categories);
    for (var i = 0; i < combined.length; i++) {
      var v = String(combined[i]).toLowerCase();
      for (var j = 0; j < tagList.length; j++) {
        if (v.indexOf(tagList[j]) !== -1) return true;
      }
    }
    return false;
  }

  var filters = {
    /**
     * True if the player has never played this game (0 plays or no record).
     * @param {Object} game
     * @param {Object} profile   MrMacsProfile-shaped object
     * @returns {boolean}
     */
    unplayed: function (game, profile) {
      if (!game) return false;
      if (!profile || typeof profile !== "object") return true;
      var stats = profile.perGameStats;
      if (!stats || typeof stats !== "object") return true;
      var rec = stats[game.id];
      if (rec === undefined || rec === null) return true;
      return (rec.plays || rec.playCount || 0) === 0;
    },

    /**
     * True if the game is tagged or categorised as "scholar".
     * @param {Object} game
     * @returns {boolean}
     */
    hasScholarPrompts: function (game) {
      return _hasSomeTag(game, ["scholar"]);
    },

    /**
     * True if the game has a "touch" or "mobile" tag, or its gameType is
     * one of the broadly mobile-compatible types.
     * @param {Object} game
     * @returns {boolean}
     */
    mobileFriendly: function (game) {
      if (!game) return false;
      if (_hasSomeTag(game, ["touch", "mobile"])) return true;
      var type = String(game.gameType || game.type || "").trim();
      for (var i = 0; i < MOBILE_TYPES.length; i++) {
        if (type === MOBILE_TYPES[i]) return true;
      }
      return false;
    },

    /**
     * True if the game belongs to the "quick-play" collection or is tagged
     * "quick".
     * @param {Object} game
     * @returns {boolean}
     */
    quickPlay: function (game) {
      if (!game) return false;
      if (String(game.collection || "").toLowerCase() === "quick-play") return true;
      return _hasSomeTag(game, ["quick"]);
    }
  };

  // ─── mountDidYouMean ──────────────────────────────────────────────────────

  /**
   * Attaches a "Did you mean…?" helper to a search input.
   *
   * The suggestion div is inserted as a sibling directly after `container`
   * (or appended inside it if insertAfter is not possible). After a 300 ms
   * debounce, if the query length > DYM_MIN_LENGTH and no game in the
   * global GAMES array has a fuzzyScore > 0, it looks for a correction.
   *
   * Clicking the suggestion applies it to the input and dispatches both
   * an "input" event and a custom "msh:apply-suggestion" event.
   *
   * @param {HTMLElement} searchEl    The <input> element
   * @param {HTMLElement} container   The element below which to insert the hint
   * @param {string[]}    vocab       Pre-built vocabulary array
   * @returns {{ unmount: function }}
   */
  function mountDidYouMean(searchEl, container, vocab) {
    if (typeof document === "undefined") return { unmount: function () {} };
    injectStyles();

    var wrapper = document.createElement("div");
    wrapper.className = "msh-wrapper msh-hidden";
    wrapper.setAttribute("aria-live", "polite");
    wrapper.setAttribute("aria-atomic", "true");
    wrapper.setAttribute("role", "status");

    if (container && container.parentNode) {
      container.parentNode.insertBefore(wrapper, container.nextSibling);
    } else if (container) {
      container.appendChild(wrapper);
    }

    var timer = null;
    var lastSuggestion = null;

    function hideSuggestion() {
      wrapper.className = "msh-wrapper msh-hidden";
      wrapper.innerHTML = "";
      lastSuggestion = null;
    }

    function showSuggestion(word) {
      if (lastSuggestion === word) return;
      lastSuggestion = word;

      wrapper.innerHTML = "";
      var text = document.createTextNode("Did you mean ");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "msh-dym-link";
      btn.textContent = word;
      btn.setAttribute("aria-label", "Search for " + word + " instead");

      btn.addEventListener("click", function () {
        if (searchEl) {
          searchEl.value = word;
          // Fire both a native input event and a custom event
          var evt = document.createEvent("Event");
          evt.initEvent("input", true, true);
          searchEl.dispatchEvent(evt);
          searchEl.dispatchEvent(
            new CustomEvent("msh:apply-suggestion", { detail: { suggestion: word }, bubbles: true })
          );
        }
        hideSuggestion();
        emit("suggestion-applied", { suggestion: word });
      });

      var question = document.createTextNode("?");
      wrapper.appendChild(text);
      wrapper.appendChild(btn);
      wrapper.appendChild(question);
      wrapper.className = "msh-wrapper msh-dym-wrapper";
    }

    function onInput() {
      clearTimeout(timer);
      var q = searchEl ? String(searchEl.value || "").trim() : "";
      if (q.length <= DYM_MIN_LENGTH) { hideSuggestion(); return; }

      timer = setTimeout(function () {
        // Check if any game matches
        var games = Array.isArray(root.GAMES) ? root.GAMES : [];
        var hasMatch = false;
        for (var i = 0; i < games.length; i++) {
          var title = String(games[i].title || games[i].name || "");
          if (fuzzyScore(q, title) > 0) { hasMatch = true; break; }
        }
        if (hasMatch) { hideSuggestion(); return; }

        var suggestion = suggestCorrection(q, vocab);
        if (suggestion) {
          showSuggestion(suggestion);
          emit("did-you-mean", { query: q, suggestion: suggestion });
        } else {
          hideSuggestion();
        }
      }, DYM_DEBOUNCE_MS);
    }

    if (searchEl) {
      searchEl.addEventListener("input", onInput);
      searchEl.addEventListener("keydown", function (e) {
        // Clear on Escape or clear on empty
        if (e.key === "Escape") hideSuggestion();
      });
    }

    function unmount() {
      clearTimeout(timer);
      if (searchEl) searchEl.removeEventListener("input", onInput);
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      emit("dym-unmounted", {});
    }

    return { unmount: unmount };
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  root.MrMacsSearchHelpers = {
    fuzzyScore:        fuzzyScore,
    levenshtein:       levenshtein,
    suggestCorrection: suggestCorrection,
    buildVocabulary:   buildVocabulary,

    /** Quick-filter predicate functions */
    filters:           filters,

    /** Chip metadata for library quick-filter UI (read-only copy) */
    CHIP_DATA:         CHIP_DATA.slice(),

    mountDidYouMean:   mountDidYouMean,

    on:  on,
    off: off
  };

  emit("ready", {});

}(typeof window !== "undefined" ? window : this));
