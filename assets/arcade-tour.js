/* Mr. Mac's Arcade — Shared First-Run Tour Engine
 *
 * Local-only. Reads MrMacsProfile.hasSeenTour / markTourSeen.
 * Each game calls MrMacsArcadeTour.start(gameId, steps) once on boot.
 * If the user has seen this gameId's tour before (or has prefers-reduced-
 * motion), the call is a no-op.
 *
 *   steps = [
 *     {
 *       target: "#elementId" | DOMElement | null (null = centered modal),
 *       title: "Heading",
 *       body: "1-2 sentence explanation",
 *       placement: "auto" | "top" | "bottom" | "left" | "right" | "center"
 *     },
 *     ...
 *   ]
 *
 *   MrMacsArcadeTour.start(gameId, steps, { force: true })
 *     -> overrides hasSeenTour check (used by "Replay tour" buttons)
 *
 * Skip and X dismiss the tour and mark it as seen.
 * "Got it / Next" advance.
 * On final step, button reads "Finish" and marks the tour seen.
 */
(function () {
  "use strict";

  var STYLE_ID = "mr-macs-tour-styles";
  var STYLE_CONTENT =
    ".mt-overlay{position:fixed;inset:0;z-index:9700;pointer-events:none;}\n" +
    ".mt-overlay.is-open{pointer-events:auto;}\n" +
    ".mt-scrim{position:absolute;inset:0;background:rgba(6,8,15,.62);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);opacity:0;transition:opacity .25s ease-out;}\n" +
    ".mt-overlay.is-open .mt-scrim{opacity:1;}\n" +
    ".mt-spotlight{position:absolute;border-radius:14px;box-shadow:0 0 0 9999px rgba(6,8,15,.66);transition:all .35s cubic-bezier(.16,1,.3,1);pointer-events:none;}\n" +
    ".mt-card{position:absolute;width:min(360px,calc(100vw - 28px));padding:18px 20px;background:linear-gradient(180deg,rgba(13,17,27,.96),rgba(8,11,20,.98));color:#f6f4ee;border:1px solid rgba(255,255,255,.14);border-radius:16px;box-shadow:0 28px 70px rgba(0,0,0,.55),0 1px 0 rgba(255,255,255,.06) inset;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .25s;}\n" +
    ".mt-card[hidden]{display:none;}\n" +
    ".mt-card .mt-step{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#7af0ff;margin-bottom:6px;}\n" +
    ".mt-card .mt-title{margin:0 0 6px;font-family:'Fraunces',serif;font-weight:540;font-size:20px;line-height:1.15;letter-spacing:-.012em;}\n" +
    ".mt-card .mt-body{margin:0 0 16px;font-family:'Inter',sans-serif;font-size:14px;line-height:1.5;color:#e2e6ee;}\n" +
    ".mt-card .mt-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;}\n" +
    ".mt-card .mt-skip{background:none;border:0;color:#9aa3bb;font:600 12px/1 'Inter',sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;padding:8px 0;}\n" +
    ".mt-card .mt-skip:hover{color:#f6f4ee;}\n" +
    ".mt-card .mt-next{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;background:linear-gradient(135deg,#f5c451,#ffd884);color:#14100a;border:1px solid rgba(245,196,81,.55);border-radius:999px;font:800 12.5px/1 'Inter',sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;box-shadow:0 12px 28px rgba(245,196,81,.22),0 1px 0 rgba(255,255,255,.45) inset;transition:transform .2s,box-shadow .2s;}\n" +
    ".mt-card .mt-next:hover{transform:translateY(-2px);}\n" +
    ".mt-card .mt-progress{display:inline-flex;gap:4px;}\n" +
    ".mt-card .mt-progress-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.18);}\n" +
    ".mt-card .mt-progress-dot.is-active{background:#f5c451;width:18px;}\n" +
    "@media (prefers-reduced-motion: reduce){.mt-card,.mt-spotlight,.mt-scrim{transition:none;}}\n";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = STYLE_CONTENT;
    document.head.appendChild(s);
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function getRect(target) {
    if (!target) return null;
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el || !el.getBoundingClientRect) return null;
    var r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, el: el };
  }

  function api() {
    var profile = window.MrMacsProfile;
    var state = null;

    function close(markSeen) {
      if (!state) return;
      if (markSeen && profile && state.gameId) profile.markTourSeen(state.gameId);
      try {
        if (state.overlay && state.overlay.parentNode) state.overlay.parentNode.removeChild(state.overlay);
      } catch (e) {}
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      state = null;
    }
    function onKey(e) {
      if (!state) return;
      if (e.key === "Escape") close(true);
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); }
    }
    function onResize() { if (state) renderStep(); }
    function next() {
      if (!state) return;
      if (state.idx >= state.steps.length - 1) close(true);
      else { state.idx++; renderStep(); }
    }

    function renderStep() {
      if (!state) return;
      var step = state.steps[state.idx];
      var rect = step ? getRect(step.target) : null;
      var spotlight = state.spotlight;
      var card = state.card;
      var pad = 10;
      var vw = window.innerWidth, vh = window.innerHeight;
      // Spotlight position
      if (rect) {
        spotlight.style.left = (rect.left - pad) + "px";
        spotlight.style.top = (rect.top - pad) + "px";
        spotlight.style.width = (rect.width + pad * 2) + "px";
        spotlight.style.height = (rect.height + pad * 2) + "px";
        spotlight.hidden = false;
      } else {
        spotlight.hidden = true;
      }
      // Card content
      var stepLabel = "Step " + (state.idx + 1) + " of " + state.steps.length;
      var dots = state.steps.map(function (_, i) {
        return '<span class="mt-progress-dot' + (i === state.idx ? ' is-active' : '') + '"></span>';
      }).join("");
      var nextLabel = state.idx >= state.steps.length - 1 ? "Finish" : "Next →";
      card.innerHTML =
        '<div class="mt-step">' + stepLabel + '</div>' +
        '<h3 class="mt-title">' + (step.title || "") + '</h3>' +
        '<p class="mt-body">' + (step.body || "") + '</p>' +
        '<div class="mt-actions">' +
          '<button type="button" class="mt-skip" data-mt-action="skip">Skip tour</button>' +
          '<div class="mt-progress">' + dots + '</div>' +
          '<button type="button" class="mt-next" data-mt-action="next">' + nextLabel + '</button>' +
        '</div>';
      card.querySelector('[data-mt-action="skip"]').addEventListener("click", function () { close(true); });
      card.querySelector('[data-mt-action="next"]').addEventListener("click", next);
      // Card position
      var cardW = Math.min(360, vw - 28);
      var cardH = card.offsetHeight || 200;
      var cx, cy;
      if (!rect || step.placement === "center") {
        cx = (vw - cardW) / 2;
        cy = (vh - cardH) / 2;
      } else {
        var place = step.placement || "auto";
        if (place === "auto") {
          // Pick the side with the most room
          var rooms = {
            bottom: vh - (rect.top + rect.height + pad),
            top: rect.top - pad,
            right: vw - (rect.left + rect.width + pad),
            left: rect.left - pad
          };
          place = Object.keys(rooms).reduce(function (best, k) {
            return rooms[k] > rooms[best] ? k : best;
          }, "bottom");
        }
        if (place === "bottom") {
          cx = clamp(rect.left + rect.width / 2 - cardW / 2, 14, vw - cardW - 14);
          cy = clamp(rect.top + rect.height + 18, 14, vh - cardH - 14);
        } else if (place === "top") {
          cx = clamp(rect.left + rect.width / 2 - cardW / 2, 14, vw - cardW - 14);
          cy = clamp(rect.top - cardH - 18, 14, vh - cardH - 14);
        } else if (place === "right") {
          cx = clamp(rect.left + rect.width + 18, 14, vw - cardW - 14);
          cy = clamp(rect.top + rect.height / 2 - cardH / 2, 14, vh - cardH - 14);
        } else {
          cx = clamp(rect.left - cardW - 18, 14, vw - cardW - 14);
          cy = clamp(rect.top + rect.height / 2 - cardH / 2, 14, vh - cardH - 14);
        }
      }
      card.style.left = cx + "px";
      card.style.top = cy + "px";
    }

    function start(gameId, steps, opts) {
      opts = opts || {};
      if (state) close(false); // close existing first
      injectStyles();
      if (!Array.isArray(steps) || !steps.length) return false;
      var force = !!opts.force;
      if (!force && profile && profile.hasSeenTour && profile.hasSeenTour(gameId)) return false;
      // Respect prefers-reduced-motion: still render but kill animations (CSS already handles)
      var overlay = document.createElement("div");
      overlay.className = "mt-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Game tour");
      var scrim = document.createElement("div");
      scrim.className = "mt-scrim";
      scrim.addEventListener("click", function () { close(true); });
      var spotlight = document.createElement("div");
      spotlight.className = "mt-spotlight";
      spotlight.hidden = true;
      var card = document.createElement("div");
      card.className = "mt-card";
      overlay.appendChild(scrim);
      overlay.appendChild(spotlight);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      // Trigger transition
      requestAnimationFrame(function () { overlay.classList.add("is-open"); });
      state = { gameId: gameId, steps: steps, idx: 0, overlay: overlay, scrim: scrim, spotlight: spotlight, card: card };
      window.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize, { passive: true });
      renderStep();
      return true;
    }

    function offerReplay(gameId, steps) {
      // Returns a function the host can call from a "Help" or "Replay tour" button
      return function () { start(gameId, steps, { force: true }); };
    }

    return { start: start, close: close, offerReplay: offerReplay };
  }

  if (typeof window !== "undefined") {
    window.MrMacsArcadeTour = api();
  }
})();
