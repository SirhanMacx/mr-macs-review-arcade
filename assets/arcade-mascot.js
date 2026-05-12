/* arcade-mascot.js — Mr. Mac arcade mascot (animated SVG character).
 * window.MrMacsMascot: mount(container, opts) -> { unmount, hide, show, say };
 * setMessage(text, durationMs); setMood(mood); isVisible(); on/off(event, handler).
 * Moods: "idle" | "cheering" | "thinking" | "celebrating".
 * Idempotent. CSS scoped to .mm-mascot-*.
 */
(function (root) {
  "use strict";
  if (root.MrMacsMascot) return;

  var STYLE_ID = "arcade-mascot-styles";
  var ROOT_CLASS = "mm-mascot-root";
  var BUBBLE_CLASS = "mm-mascot-bubble";
  var SVG_CLASS = "mm-mascot-svg";
  var MIN_MOBILE_WIDTH = 480;
  var BUBBLE_DEFAULT_MS = 4000;
  var BLINK_MIN_MS = 3000;
  var BLINK_MAX_MS = 5000;
  var BOB_PERIOD_MS = 3000;
  var BOB_AMPLITUDE_PX = 4;
  var TRIPLE_CLICK_WINDOW_MS = 600;
  var SHARDS_MILESTONE = 1000;
  var STREAK_MILESTONE = 5;

  var COLOR_BRONZE = "#b8722a";
  var COLOR_BRONZE_LIGHT = "#d99a4f";
  var COLOR_CYAN = "#1e9aa7";
  var COLOR_CYAN_LIGHT = "#3fc4d4";
  var COLOR_SKIN = "#f4d6b3";
  var COLOR_SKIN_SHADE = "#d9b58c";
  var COLOR_DARK = "#1f2330";
  var COLOR_QUILL = "#f6efd8";

  var TUTORIAL_HINTS = [
    "Welcome to the arcade! I'm Mr. Mac.",
    "Tap a cabinet to start a review session.",
    "Earn shards by answering questions right.",
    "Build streaks for bonus rewards!",
    "Visit the shop to spend your shards."
  ];
  var ENCOURAGEMENT = [
    "Nice work, scholar!", "On a roll today!", "Knowledge is power!",
    "Keep that streak alive!", "You've got this!", "Sharp as a tack!"
  ];

  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function safeCall(fn) { try { return typeof fn === "function" ? fn() : undefined; } catch (_e) { return undefined; } }
  function prefersReducedMotion() {
    try { return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch (_e) { return false; }
  }
  function viewportWidth() {
    try { return root.innerWidth || (root.document && root.document.documentElement && root.document.documentElement.clientWidth) || 1024; }
    catch (_e) { return 1024; }
  }
  function getProfile() { return root.MrMacsProfile || null; }
  function getCelebration() { return root.MrMacsCelebration || null; }

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------
  function injectStyles(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    var R = "." + ROOT_CLASS, S = " ." + SVG_CLASS, B = "." + BUBBLE_CLASS;
    var css =
      R + "{position:fixed;right:16px;bottom:16px;width:64px;height:80px;z-index:9000;pointer-events:auto;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;filter:drop-shadow(0 4px 8px rgba(0,0,0,.25));transition:opacity 220ms ease,transform 220ms ease}" +
      R + ".mm-mascot-hidden{opacity:0;pointer-events:none;transform:translateY(20px)}" +
      R + S + "{width:100%;height:100%;display:block;transform-origin:50% 90%}" +
      R + ".mm-mood-idle" + S + "{animation:mm-bob " + BOB_PERIOD_MS + "ms ease-in-out infinite}" +
      R + ".mm-mood-thinking" + S + "{animation:mm-bob " + (BOB_PERIOD_MS + 800) + "ms ease-in-out infinite}" +
      R + ".mm-mood-cheering" + S + "{animation:mm-cheer 600ms ease-in-out 3}" +
      R + ".mm-mood-celebrating" + S + "{animation:mm-hop 420ms ease-out 4}" +
      R + " .mm-mascot-arm-l," + R + " .mm-mascot-arm-r{transform-origin:50% 30%;transition:transform 200ms ease}" +
      R + ".mm-mood-cheering .mm-mascot-arm-l{animation:mm-arm-l-pump 400ms ease-in-out 4}" +
      R + ".mm-mood-cheering .mm-mascot-arm-r{animation:mm-arm-r-pump 400ms ease-in-out 4}" +
      R + " .mm-eye{transition:transform 160ms ease}" +
      R + " .mm-eyelid{transform:scaleY(0);transform-origin:50% 50%;transition:transform 90ms ease}" +
      R + ".mm-blink .mm-eyelid{transform:scaleY(1)}" +
      R + ".mm-mood-thinking .mm-eye{transform:translateY(-1.2px)}" +
      B + "{position:absolute;right:calc(100% + 8px);bottom:50%;background:#fff8e7;color:" + COLOR_DARK + ";border:2px solid " + COLOR_BRONZE + ";border-radius:10px;padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:500;line-height:1.35;max-width:220px;min-width:80px;white-space:normal;word-wrap:break-word;pointer-events:auto;cursor:pointer;opacity:0;transform-origin:100% 70%;transform:translateY(35%) scale(.85);transition:opacity 200ms ease,transform 200ms ease;z-index:1}" +
      B + ".mm-bubble-show{opacity:1;transform:translateY(35%) scale(1)}" +
      B + "::after{content:'';position:absolute;right:-10px;bottom:12px;width:0;height:0;border-style:solid;border-width:8px 0 8px 10px;border-color:transparent transparent transparent " + COLOR_BRONZE + "}" +
      B + "::before{content:'';position:absolute;right:-6px;bottom:14px;width:0;height:0;border-style:solid;border-width:6px 0 6px 8px;border-color:transparent transparent transparent #fff8e7;z-index:1}" +
      "@keyframes mm-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-" + BOB_AMPLITUDE_PX + "px)}}" +
      "@keyframes mm-cheer{0%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-6px) scale(1.04)}60%{transform:translateY(-3px) scale(1.02)}}" +
      "@keyframes mm-hop{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-12px) scale(1.05,.95)}70%{transform:translateY(0) scale(.98,1.02)}100%{transform:translateY(0) scale(1)}}" +
      "@keyframes mm-arm-l-pump{0%,100%{transform:rotate(0)}50%{transform:rotate(-50deg)}}" +
      "@keyframes mm-arm-r-pump{0%,100%{transform:rotate(0)}50%{transform:rotate(50deg)}}" +
      "@media (prefers-reduced-motion: reduce){" + R + S + "," + R + " .mm-mascot-arm-l," + R + " .mm-mascot-arm-r{animation:none !important}}";
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.appendChild(doc.createTextNode(css));
    (doc.head || doc.documentElement).appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // SVG construction
  // ---------------------------------------------------------------------------
  function buildSvg(doc) {
    var SVG_NS = "http://www.w3.org/2000/svg";
    var svg = doc.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", SVG_CLASS);
    svg.setAttribute("viewBox", "0 0 64 80");
    svg.setAttribute("aria-label", "Mr. Mac mascot");
    svg.setAttribute("role", "img");

    function el(name, attrs) {
      var n = doc.createElementNS(SVG_NS, name);
      if (attrs) {
        for (var k in attrs) {
          if (Object.prototype.hasOwnProperty.call(attrs, k)) {
            n.setAttribute(k, attrs[k]);
          }
        }
      }
      return n;
    }

    // Robe (bronze body, cyan trim)
    var robe = el("path", {
      d: "M14 50 Q14 44 22 42 L42 42 Q50 44 50 50 L52 78 L12 78 Z",
      fill: COLOR_BRONZE,
      stroke: COLOR_DARK,
      "stroke-width": "1.2"
    });
    svg.appendChild(robe);

    // Cyan robe trim down center
    var trim = el("path", {
      d: "M30 42 L30 78 L34 78 L34 42 Z",
      fill: COLOR_CYAN
    });
    svg.appendChild(trim);

    // Cyan robe shoulder accent
    var shoulder = el("path", {
      d: "M14 50 Q22 46 32 46 Q42 46 50 50 L48 54 Q40 50 32 50 Q24 50 16 54 Z",
      fill: COLOR_CYAN_LIGHT,
      opacity: "0.85"
    });
    svg.appendChild(shoulder);

    // Left arm (group, rotates around shoulder)
    var armL = el("g", { class: "mm-mascot-arm-l" });
    armL.appendChild(el("path", {
      d: "M14 50 Q10 56 12 64 L18 62 Q18 56 20 50 Z",
      fill: COLOR_BRONZE,
      stroke: COLOR_DARK,
      "stroke-width": "1"
    }));
    // Left hand (skin tone)
    armL.appendChild(el("circle", { cx: "13", cy: "64", r: "3.2", fill: COLOR_SKIN, stroke: COLOR_DARK, "stroke-width": "0.8" }));
    // Quill in left hand
    armL.appendChild(el("path", {
      d: "M11 64 L8 56 Q7 54 9 53 Q11 54 11 56 Z",
      fill: COLOR_QUILL,
      stroke: COLOR_DARK,
      "stroke-width": "0.6"
    }));
    armL.appendChild(el("line", { x1: "11", y1: "64", x2: "9", y2: "55", stroke: COLOR_DARK, "stroke-width": "0.5" }));
    svg.appendChild(armL);

    // Right arm (group)
    var armR = el("g", { class: "mm-mascot-arm-r" });
    armR.appendChild(el("path", {
      d: "M50 50 Q54 56 52 64 L46 62 Q46 56 44 50 Z",
      fill: COLOR_BRONZE,
      stroke: COLOR_DARK,
      "stroke-width": "1"
    }));
    armR.appendChild(el("circle", { cx: "51", cy: "64", r: "3.2", fill: COLOR_SKIN, stroke: COLOR_DARK, "stroke-width": "0.8" }));
    // Scroll in right hand
    armR.appendChild(el("rect", {
      x: "48", y: "60", width: "8", height: "5", rx: "1.2", ry: "1.2",
      fill: COLOR_QUILL, stroke: COLOR_DARK, "stroke-width": "0.6"
    }));
    armR.appendChild(el("line", { x1: "49", y1: "62", x2: "55", y2: "62", stroke: COLOR_DARK, "stroke-width": "0.4" }));
    armR.appendChild(el("line", { x1: "49", y1: "63.5", x2: "54", y2: "63.5", stroke: COLOR_DARK, "stroke-width": "0.4" }));
    svg.appendChild(armR);

    // Neck shadow
    svg.appendChild(el("path", {
      d: "M28 40 L36 40 L35 44 L29 44 Z",
      fill: COLOR_SKIN_SHADE
    }));

    // Head (round)
    svg.appendChild(el("circle", {
      cx: "32", cy: "30", r: "13",
      fill: COLOR_SKIN, stroke: COLOR_DARK, "stroke-width": "1.2"
    }));

    // Cheeks
    svg.appendChild(el("circle", { cx: "25", cy: "33", r: "1.6", fill: "#e89b7a", opacity: "0.55" }));
    svg.appendChild(el("circle", { cx: "39", cy: "33", r: "1.6", fill: "#e89b7a", opacity: "0.55" }));

    // Eyes (group with class for thinking transform)
    var eyesG = el("g", {});
    // Eye whites
    eyesG.appendChild(el("circle", { class: "mm-eye", cx: "27", cy: "29", r: "2.2", fill: "#fff", stroke: COLOR_DARK, "stroke-width": "0.6" }));
    eyesG.appendChild(el("circle", { class: "mm-eye", cx: "37", cy: "29", r: "2.2", fill: "#fff", stroke: COLOR_DARK, "stroke-width": "0.6" }));
    // Pupils
    eyesG.appendChild(el("circle", { class: "mm-eye mm-pupil-l", cx: "27", cy: "29.4", r: "1.1", fill: COLOR_DARK }));
    eyesG.appendChild(el("circle", { class: "mm-eye mm-pupil-r", cx: "37", cy: "29.4", r: "1.1", fill: COLOR_DARK }));
    // Eyelids (for blinking)
    eyesG.appendChild(el("rect", { class: "mm-eyelid", x: "24.6", y: "27", width: "4.8", height: "4.4", fill: COLOR_SKIN, rx: "1.4" }));
    eyesG.appendChild(el("rect", { class: "mm-eyelid", x: "34.6", y: "27", width: "4.8", height: "4.4", fill: COLOR_SKIN, rx: "1.4" }));
    svg.appendChild(eyesG);

    // Smile
    svg.appendChild(el("path", {
      d: "M28 35 Q32 38 36 35",
      fill: "none", stroke: COLOR_DARK, "stroke-width": "1.2", "stroke-linecap": "round"
    }));

    // Mortarboard cap base (under board)
    svg.appendChild(el("path", {
      d: "M22 22 Q22 17 32 16 Q42 17 42 22 L42 24 L22 24 Z",
      fill: COLOR_DARK
    }));

    // Mortarboard board (square top)
    svg.appendChild(el("path", {
      d: "M14 20 L32 14 L50 20 L32 26 Z",
      fill: COLOR_DARK,
      stroke: COLOR_BRONZE_LIGHT,
      "stroke-width": "0.8"
    }));

    // Tassel
    svg.appendChild(el("line", { x1: "44", y1: "21", x2: "48", y2: "29", stroke: COLOR_BRONZE_LIGHT, "stroke-width": "1.2" }));
    svg.appendChild(el("circle", { cx: "48", cy: "30", r: "1.6", fill: COLOR_BRONZE_LIGHT }));

    // Cap button
    svg.appendChild(el("circle", { cx: "32", cy: "20", r: "1.1", fill: COLOR_BRONZE_LIGHT }));

    return svg;
  }

  // ---------------------------------------------------------------------------
  // Mascot instance
  // ---------------------------------------------------------------------------
  function createMascot(container, opts) {
    opts = opts || {};
    var doc = (container && container.ownerDocument) || root.document;
    if (!doc) {
      return {
        unmount: function () {},
        hide: function () {},
        show: function () {},
        say: function () {}
      };
    }
    injectStyles(doc);

    // Settings: respect MrMacsProfile.getSettings().mascot if present
    var profile = getProfile();
    var settings = null;
    if (profile && typeof profile.getSettings === "function") {
      settings = safeCall(function () { return profile.getSettings(); }) || null;
    }
    if (settings && settings.mascot === false) {
      // User has opted out; return a no-op handle.
      return {
        unmount: function () {},
        hide: function () {},
        show: function () {},
        say: function () {}
      };
    }

    // Hide on small screens unless opt-in
    if (!opts.mobile && viewportWidth() < MIN_MOBILE_WIDTH) {
      return {
        unmount: function () {},
        hide: function () {},
        show: function () {},
        say: function () {}
      };
    }

    // Build root element
    var rootEl = doc.createElement("div");
    rootEl.className = ROOT_CLASS + " mm-mood-idle";
    rootEl.setAttribute("role", "button");
    rootEl.setAttribute("tabindex", "0");
    rootEl.setAttribute("aria-label", "Mr. Mac mascot — click to celebrate");

    var svg = buildSvg(doc);
    rootEl.appendChild(svg);

    var bubble = doc.createElement("div");
    bubble.className = BUBBLE_CLASS;
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    rootEl.appendChild(bubble);

    var mountTarget = container || doc.body;
    if (mountTarget && mountTarget.appendChild) {
      mountTarget.appendChild(rootEl);
    } else {
      doc.body.appendChild(rootEl);
    }

    // State
    var state = {
      mood: "idle",
      visible: true,
      destroyed: false,
      blinkTimer: null,
      bubbleTimer: null,
      tutorialTimer: null,
      tutorialIndex: 0,
      clickTimes: [],
      reduced: prefersReducedMotion(),
      profileUnsubs: []
    };

    var listeners = {}; // event -> [handlers]

    function emit(event, payload) {
      var arr = listeners[event];
      if (!arr) return;
      for (var i = 0; i < arr.length; i++) {
        try { arr[i](payload); } catch (_e) {}
      }
    }

    function on(event, handler) {
      if (typeof handler !== "function") return;
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }

    function off(event, handler) {
      var arr = listeners[event];
      if (!arr) return;
      for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i] === handler) arr.splice(i, 1);
      }
    }

    // Blinking loop
    function scheduleBlink() {
      if (state.destroyed) return;
      var delay = rand(BLINK_MIN_MS, BLINK_MAX_MS);
      state.blinkTimer = setTimeout(function blinkOnce() {
        if (state.destroyed) return;
        rootEl.classList.add("mm-blink");
        setTimeout(function () {
          if (state.destroyed) return;
          rootEl.classList.remove("mm-blink");
          scheduleBlink();
        }, 130);
      }, delay);
    }

    // Mood control
    function setMood(mood) {
      if (!mood) return;
      var valid = { idle: 1, cheering: 1, thinking: 1, celebrating: 1 };
      if (!valid[mood]) return;
      // Remove any existing mood class
      var classes = rootEl.className.split(/\s+/).filter(function (c) {
        return c.indexOf("mm-mood-") !== 0;
      });
      classes.push("mm-mood-" + mood);
      rootEl.className = classes.join(" ");
      state.mood = mood;
      emit("mood:change", mood);

      if (mood === "celebrating") {
        burstParticles();
        // Auto-revert to idle after the hop animation completes
        setTimeout(function () {
          if (state.destroyed) return;
          if (state.mood === "celebrating") setMood("idle");
        }, 1700);
      } else if (mood === "cheering") {
        setTimeout(function () {
          if (state.destroyed) return;
          if (state.mood === "cheering") setMood("idle");
        }, 1900);
      }
    }

    // Speech bubble
    function setMessage(text, durationMs) {
      if (state.destroyed) return;
      if (!text) {
        hideBubble();
        return;
      }
      bubble.textContent = String(text);
      bubble.classList.add("mm-bubble-show");
      if (state.bubbleTimer) {
        clearTimeout(state.bubbleTimer);
        state.bubbleTimer = null;
      }
      var ms = typeof durationMs === "number" && durationMs > 0 ? durationMs : BUBBLE_DEFAULT_MS;
      state.bubbleTimer = setTimeout(function () {
        hideBubble();
      }, ms);
      emit("message", String(text));
    }

    function hideBubble() {
      bubble.classList.remove("mm-bubble-show");
      if (state.bubbleTimer) {
        clearTimeout(state.bubbleTimer);
        state.bubbleTimer = null;
      }
    }

    // Particle burst (uses MrMacsCelebration if available; else lightweight CSS)
    function burstParticles() {
      var celebration = getCelebration();
      if (celebration && typeof celebration.burstFromElement === "function") {
        try { celebration.burstFromElement(rootEl); return; } catch (_e) {}
      }
      // Fallback: tiny inline confetti dots (defensive, no external CSS)
      var rect = rootEl.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 3;
      for (var i = 0; i < 8; i++) {
        var dot = doc.createElement("div");
        dot.style.position = "fixed";
        dot.style.left = cx + "px";
        dot.style.top = cy + "px";
        dot.style.width = "6px";
        dot.style.height = "6px";
        dot.style.borderRadius = "50%";
        dot.style.background = i % 2 === 0 ? COLOR_BRONZE_LIGHT : COLOR_CYAN_LIGHT;
        dot.style.zIndex = "9100";
        dot.style.pointerEvents = "none";
        dot.style.transition = "transform 700ms ease-out, opacity 700ms ease-out";
        doc.body.appendChild(dot);
        var angle = (i / 8) * Math.PI * 2;
        var dist = 40 + Math.random() * 30;
        (function (d, a, ds) {
          requestAnimationFrame(function () {
            d.style.transform = "translate(" + Math.cos(a) * ds + "px," + Math.sin(a) * ds + "px)";
            d.style.opacity = "0";
          });
          setTimeout(function () {
            if (d.parentNode) d.parentNode.removeChild(d);
          }, 750);
        })(dot, angle, dist);
      }
    }

    // Click handling (single + triple-click easter egg)
    function handleClick() {
      if (state.destroyed) return;
      var now = Date.now();
      state.clickTimes.push(now);
      // Keep only clicks within window
      state.clickTimes = state.clickTimes.filter(function (t) {
        return now - t <= TRIPLE_CLICK_WINDOW_MS;
      });

      if (state.clickTimes.length >= 3) {
        state.clickTimes = [];
        triggerEasterEgg();
        return;
      }

      // Single-click: celebrate
      setMood("celebrating");
      emit("click", { times: 1 });
    }

    function triggerEasterEgg() {
      setMessage("You found the click-whisperer secret!", 5000);
      setMood("celebrating");
      var p = getProfile();
      if (p && typeof p.unlock === "function") {
        safeCall(function () { return p.unlock("click-whisperer"); });
      }
      emit("easteregg", { id: "click-whisperer" });
    }

    function handleKey(e) {
      if (e && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        handleClick();
      }
    }

    function handleBubbleClick(e) {
      e.stopPropagation();
      hideBubble();
    }

    rootEl.addEventListener("click", handleClick);
    rootEl.addEventListener("keydown", handleKey);
    bubble.addEventListener("click", handleBubbleClick);

    // First-time tutorial rotation
    function maybeRunTutorial() {
      // Keep the lobby visually clear on load. The mascot stays clickable,
      // but it should not cover the launch deck with automatic hints.
      return;
      var p = getProfile();
      var shouldRun = true;
      if (p) {
        // Defensive: profile may expose a "first-visit" flag in various ways.
        if (typeof p.isFirstVisit === "function") {
          shouldRun = !!safeCall(function () { return p.isFirstVisit(); });
        } else if (typeof p.getMeta === "function") {
          var meta = safeCall(function () { return p.getMeta(); });
          if (meta && meta.firstVisit === false) shouldRun = false;
        }
      }
      if (!shouldRun) return;

      // Rotate through hints over the first session
      var idx = 0;
      function next() {
        if (state.destroyed) return;
        if (idx >= TUTORIAL_HINTS.length) return;
        setMessage(TUTORIAL_HINTS[idx], 4500);
        idx++;
        state.tutorialTimer = setTimeout(next, 9000);
      }
      // Delay first hint slightly so the page can settle
      state.tutorialTimer = setTimeout(next, 1500);
    }

    // Profile event subscriptions
    function subscribeProfile() {
      var p = getProfile();
      if (!p || typeof p.on !== "function") return;

      function onAchievement(payload) {
        if (state.destroyed) return;
        setMood("cheering");
        var name = (payload && (payload.name || payload.title || payload.id)) || "achievement";
        setMessage("Achievement unlocked: " + name + "!", 4500);
      }
      function onShardsMilestone(payload) {
        if (state.destroyed) return;
        var total = payload && typeof payload.total === "number" ? payload.total : null;
        if (total !== null && total > 0 && total % SHARDS_MILESTONE === 0) {
          setMessage(pick(ENCOURAGEMENT) + " " + total + " shards!", 4000);
        }
      }
      function onStreak(payload) {
        if (state.destroyed) return;
        var days = payload && typeof payload.days === "number" ? payload.days : null;
        if (days !== null && days > 0 && days % STREAK_MILESTONE === 0) {
          setMood("cheering");
          setMessage(days + "-day streak! " + pick(ENCOURAGEMENT), 4500);
        }
      }
      function onPurchase() {
        if (state.destroyed) return;
        setMood("celebrating");
        setMessage("Nice pickup!", 3500);
      }

      try { p.on("achievement:unlock", onAchievement); state.profileUnsubs.push(["achievement:unlock", onAchievement]); } catch (_e) {}
      try { p.on("shards:earned", onShardsMilestone); state.profileUnsubs.push(["shards:earned", onShardsMilestone]); } catch (_e) {}
      try { p.on("streak:update", onStreak); state.profileUnsubs.push(["streak:update", onStreak]); } catch (_e) {}
      try { p.on("shop:purchase", onPurchase); state.profileUnsubs.push(["shop:purchase", onPurchase]); } catch (_e) {}
    }

    function unsubscribeProfile() {
      var p = getProfile();
      if (!p || typeof p.off !== "function") {
        state.profileUnsubs = [];
        return;
      }
      for (var i = 0; i < state.profileUnsubs.length; i++) {
        var pair = state.profileUnsubs[i];
        try { p.off(pair[0], pair[1]); } catch (_e) {}
      }
      state.profileUnsubs = [];
    }

    // Detect "thinking" context: opt-in via opts.context, or default heuristic
    function maybeSetInitialMood() {
      var ctx = opts.context || null;
      if (ctx === "welcome" || ctx === "setup") {
        setMood("thinking");
        setMessage("Hmm... let me show you around.", 4500);
      }
    }

    // Public methods on handle
    function show() {
      if (state.destroyed) return;
      rootEl.classList.remove("mm-mascot-hidden");
      state.visible = true;
    }
    function hide() {
      if (state.destroyed) return;
      rootEl.classList.add("mm-mascot-hidden");
      state.visible = false;
      hideBubble();
    }

    function unmount() {
      if (state.destroyed) return;
      state.destroyed = true;
      if (state.blinkTimer) clearTimeout(state.blinkTimer);
      if (state.bubbleTimer) clearTimeout(state.bubbleTimer);
      if (state.tutorialTimer) clearTimeout(state.tutorialTimer);
      try { rootEl.removeEventListener("click", handleClick); } catch (_e) {}
      try { rootEl.removeEventListener("keydown", handleKey); } catch (_e) {}
      try { bubble.removeEventListener("click", handleBubbleClick); } catch (_e) {}
      unsubscribeProfile();
      if (rootEl.parentNode) {
        try { rootEl.parentNode.removeChild(rootEl); } catch (_e) {}
      }
      listeners = {};
    }

    // Kick off
    if (!state.reduced) scheduleBlink();
    subscribeProfile();
    maybeRunTutorial();
    maybeSetInitialMood();

    return {
      unmount: unmount,
      hide: hide,
      show: show,
      say: function (text) { setMessage(text); },
      _setMood: setMood,
      _setMessage: setMessage,
      _isVisible: function () { return state.visible && !state.destroyed; },
      _on: on,
      _off: off
    };
  }

  // ---------------------------------------------------------------------------
  // Public singleton API
  // ---------------------------------------------------------------------------
  var activeHandle = null;

  function mount(container, opts) {
    if (activeHandle && typeof activeHandle.unmount === "function") {
      // Replace any existing instance
      try { activeHandle.unmount(); } catch (_e) {}
      activeHandle = null;
    }
    var handle = createMascot(container, opts || {});
    activeHandle = handle;
    return {
      unmount: function () {
        try { handle.unmount(); } catch (_e) {}
        if (activeHandle === handle) activeHandle = null;
      },
      hide: function () { try { handle.hide(); } catch (_e) {} },
      show: function () { try { handle.show(); } catch (_e) {} },
      say: function (text) { try { handle.say(text); } catch (_e) {} }
    };
  }

  function setMessage(text, durationMs) {
    if (activeHandle && typeof activeHandle._setMessage === "function") {
      activeHandle._setMessage(text, durationMs);
    }
  }

  function setMood(mood) {
    if (activeHandle && typeof activeHandle._setMood === "function") {
      activeHandle._setMood(mood);
    }
  }

  function isVisible() {
    if (activeHandle && typeof activeHandle._isVisible === "function") {
      return !!activeHandle._isVisible();
    }
    return false;
  }

  function on(event, handler) {
    if (activeHandle && typeof activeHandle._on === "function") {
      activeHandle._on(event, handler);
    }
  }

  function off(event, handler) {
    if (activeHandle && typeof activeHandle._off === "function") {
      activeHandle._off(event, handler);
    }
  }

  root.MrMacsMascot = {
    mount: mount,
    setMessage: setMessage,
    setMood: setMood,
    isVisible: isVisible,
    on: on,
    off: off
  };
})(typeof window !== "undefined" ? window : this);
