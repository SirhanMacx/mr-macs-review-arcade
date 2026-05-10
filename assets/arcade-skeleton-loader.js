/**
 * arcade-skeleton-loader.js
 * Mr. Mac's Review Arcade — Skeleton Loader Utility
 *
 * Renders shimmering skeleton placeholders during loading states.
 * Builds on the `.is-loading` shimmer already defined in arcade-a11y.css
 * (§ P4 — the `arcade-skeleton-shimmer` keyframe and base styles).
 *
 * Usage:
 *   const handle = MrMacsSkeleton.render(container, { count: 4, shape: "card" });
 *   // later, when data arrives:
 *   handle.unmount();
 *   MrMacsSkeleton.replaceWith(handle, '<div class="game-card">…</div>');
 *
 *   // Quick helpers:
 *   const h = MrMacsSkeleton.cards(container, 6);
 *   const h = MrMacsSkeleton.rows(container, 10);
 *
 * Events emitted on window:
 *   mskel:rendered   → { container, count, shape }
 *   mskel:unmounted  → { container, count, shape }
 *   mskel:replaced   → { container }
 *
 * Namespace: window.MrMacsSkeleton
 * CSS prefix: mskel-
 * Self-contained, idempotent, defensive.
 */

;(function (root) {
  "use strict";

  /* ── Guard: only initialise once ────────────────────────────────────────── */
  if (root.MrMacsSkeleton) return;

  /* =========================================================================
     § 1 · Style injection
     Injects the mskel-* CSS once into <head>. Uses the arcade colour palette
     already established in arcade-a11y.css but with dedicated class names so
     this module works even without that stylesheet.
     ========================================================================= */

  var STYLE_ID = "mskel-styles";

  function _injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var css = [
      /* ── Base shimmer element ─────────────────────────────────────────── */
      ".mskel-shimmer {",
      "  position: relative;",
      "  overflow: hidden;",
      "  background: rgba(255,255,255,0.06);",
      "  border-radius: 6px;",
      "  color: transparent !important;",
      "  pointer-events: none;",
      "  user-select: none;",
      "  flex-shrink: 0;",
      "}",

      /* ── Sliding gradient overlay ─────────────────────────────────────── */
      ".mskel-shimmer::after {",
      "  content: '';",
      "  position: absolute;",
      "  inset: 0;",
      "  background: linear-gradient(",
      "    90deg,",
      "    transparent 0%,",
      "    rgba(245,196,81,0.06) 30%,",    /* gold tint at leading edge   */
      "    rgba(122,240,255,0.14) 50%,",   /* cyan peak                   */
      "    rgba(245,196,81,0.06) 70%,",    /* gold tint at trailing edge  */
      "    transparent 100%",
      "  );",
      "  background-size: 200% 100%;",
      "  animation: mskel-slide 1.5s linear infinite;",
      "}",

      /* ── Keyframe ─────────────────────────────────────────────────────── */
      "@keyframes mskel-slide {",
      "  0%   { background-position: 200% center; }",
      "  100% { background-position: -200% center; }",
      "}",

      /* ── Shape variants ───────────────────────────────────────────────── */
      /* card  — library grid, game cabinets */
      ".mskel-card {",
      "  width: 100%;",
      "  height: 120px;",
      "  border-radius: 10px;",
      "  margin-bottom: 8px;",
      "}",

      /* row   — leaderboard entries, activity feed lines */
      ".mskel-row {",
      "  width: 100%;",
      "  height: 36px;",
      "  border-radius: 6px;",
      "  margin-bottom: 6px;",
      "}",

      /* circle — avatars, token icons */
      ".mskel-circle {",
      "  width: 48px;",
      "  height: 48px;",
      "  border-radius: 50%;",
      "  margin-bottom: 6px;",
      "}",

      /* tile  — small thumbnails, category squares */
      ".mskel-tile {",
      "  width: 80px;",
      "  height: 80px;",
      "  border-radius: 8px;",
      "  margin-bottom: 6px;",
      "}",

      /* ── Fade-out transition used during unmount ──────────────────────── */
      ".mskel-shimmer.mskel-fading {",
      "  transition: opacity 200ms ease;",
      "  opacity: 0;",
      "}",

      /* ── Wrapper element injected by this module ──────────────────────── */
      ".mskel-wrapper {",
      "  display: contents;",   /* transparent in layout — children flow normally */
      "}",

      /* ── Reduced motion: static gray fill, no animation ──────────────── */
      "@media (prefers-reduced-motion: reduce) {",
      "  .mskel-shimmer::after {",
      "    animation: none !important;",
      "    background: rgba(255,255,255,0.08);",
      "  }",
      "}",

      /* ── Class / data-attr mirrors for arcade-a11y.css JS-driven flags ── */
      "body.arcade-reduced-motion .mskel-shimmer::after,",
      "body[data-motion='reduce'] .mskel-shimmer::after {",
      "  animation: none !important;",
      "  background: rgba(255,255,255,0.08);",
      "}",
    ].join("\n");

    var el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
  }

  /* =========================================================================
     § 2 · Internal helpers
     ========================================================================= */

  var VALID_SHAPES = { card: true, row: true, circle: true, tile: true };

  /** Normalise and validate options, returning a safe defaults object. */
  function _opts(userOpts) {
    var o = userOpts && typeof userOpts === "object" ? userOpts : {};
    var count = Math.max(1, parseInt(o.count, 10) || 3);
    var shape = VALID_SHAPES[o.shape] ? o.shape : "card";
    return { count: count, shape: shape };
  }

  /** Emit a custom event on window (no IE11 compat needed — arcade targets ES2020+). */
  function _emit(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: false }));
    } catch (_) { /* safety valve */ }
  }

  /* =========================================================================
     § 3 · Event emitter (on / off)
     Thin pub/sub backed by a Map of event → Set<handler>.
     ========================================================================= */

  var _listeners = Object.create(null); // { [eventName]: Set<Function> }

  function _on(event, handler) {
    if (typeof event !== "string" || typeof handler !== "function") return;
    if (!_listeners[event]) _listeners[event] = new Set();
    _listeners[event].add(handler);
  }

  function _off(event, handler) {
    if (!_listeners[event]) return;
    _listeners[event].delete(handler);
  }

  function _notify(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(function (fn) {
      try { fn(data); } catch (_) {}
    });
  }

  /* =========================================================================
     § 4 · render()
     Creates N skeleton divs inside a wrapper and appends to container.
     Returns a handle: { wrapper, count, shape, unmount }.
     ========================================================================= */

  /**
   * @param {Element} container  — target DOM element
   * @param {{ count?: number, shape?: "card"|"row"|"circle"|"tile" }} [opts]
   * @returns {{ unmount: function(fade?: boolean): void,
   *             wrapper: Element, count: number, shape: string }}
   */
  function render(container, opts) {
    if (!(container instanceof Element)) {
      console.warn("[MrMacsSkeleton] render() — invalid container:", container);
      return _noop_handle();
    }

    _injectStyles();

    var o = _opts(opts);
    var wrapper = document.createElement("div");
    wrapper.className = "mskel-wrapper";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.setAttribute("aria-busy", "true");
    wrapper.setAttribute("data-mskel-shape", o.shape);
    wrapper.setAttribute("data-mskel-count", String(o.count));

    for (var i = 0; i < o.count; i++) {
      var el = document.createElement("div");
      el.className = "mskel-shimmer mskel-" + o.shape;
      el.setAttribute("role", "presentation");
      wrapper.appendChild(el);
    }

    container.appendChild(wrapper);

    var detail = { container: container, count: o.count, shape: o.shape };
    _emit("mskel:rendered", detail);
    _notify("rendered", detail);

    var handle = {
      wrapper: wrapper,
      count: o.count,
      shape: o.shape,
      _container: container,

      /**
       * Remove skeleton placeholders.
       * @param {boolean} [fade=true]  — animate out before removal
       */
      unmount: function (fade) {
        _unmount(this, fade !== false);
      },
    };

    return handle;
  }

  /** Internal unmount logic shared by handle.unmount() and replaceWith(). */
  function _unmount(handle, fade) {
    var wrapper = handle.wrapper;
    if (!wrapper || !wrapper.parentNode) return; // already removed

    function _remove() {
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      var detail = {
        container: handle._container,
        count: handle.count,
        shape: handle.shape,
      };
      _emit("mskel:unmounted", detail);
      _notify("unmounted", detail);
    }

    if (fade) {
      /* Add fade class, wait for transition to finish (~220 ms), then remove. */
      var items = wrapper.querySelectorAll(".mskel-shimmer");
      items.forEach(function (el) { el.classList.add("mskel-fading"); });
      var tid = setTimeout(_remove, 250);
      /* If the tab is hidden / reduced-motion is on, skip the wait. */
      var prefersReduced =
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
        document.body.classList.contains("arcade-reduced-motion") ||
        document.body.dataset.motion === "reduce";
      if (prefersReduced || document.hidden) {
        clearTimeout(tid);
        _remove();
      }
    } else {
      _remove();
    }
  }

  /* =========================================================================
     § 5 · replaceWith()
     Removes the skeleton and injects HTML content in its place.
     ========================================================================= */

  /**
   * @param {{ wrapper: Element, _container: Element }} skeletonHandle
   * @param {string} contentHtml  — HTML string to inject after removal
   */
  function replaceWith(skeletonHandle, contentHtml) {
    if (!skeletonHandle || !(skeletonHandle.wrapper instanceof Element)) {
      console.warn("[MrMacsSkeleton] replaceWith() — invalid handle");
      return;
    }

    var container = skeletonHandle._container;
    var wrapper = skeletonHandle.wrapper;

    /* Insert content nodes immediately before the wrapper so they land in the
       right DOM position, then remove the skeleton. */
    if (container && wrapper.parentNode === container && typeof contentHtml === "string") {
      var tmp = document.createElement("template");
      tmp.innerHTML = contentHtml;
      var frag = tmp.content;
      container.insertBefore(frag, wrapper);
    }

    _unmount(skeletonHandle, false /* no fade — content is already there */);

    var detail = { container: container };
    _emit("mskel:replaced", detail);
    _notify("replaced", detail);
  }

  /* =========================================================================
     § 6 · Quick helpers
     ========================================================================= */

  /** @returns {{ unmount: function }} */
  function cards(container, count) {
    return render(container, { count: count, shape: "card" });
  }

  /** @returns {{ unmount: function }} */
  function rows(container, count) {
    return render(container, { count: count, shape: "row" });
  }

  /* =========================================================================
     § 7 · Noop handle (returned on bad input so callers never crash)
     ========================================================================= */

  function _noop_handle() {
    return {
      wrapper: null,
      count: 0,
      shape: "card",
      _container: null,
      unmount: function () {},
    };
  }

  /* =========================================================================
     § 8 · Public API
     ========================================================================= */

  root.MrMacsSkeleton = Object.freeze({
    /**
     * Render N skeleton placeholders into a container.
     * @param {Element} container
     * @param {{ count?: number, shape?: "card"|"row"|"circle"|"tile" }} [opts]
     * @returns {{ unmount: function, wrapper: Element, count: number, shape: string }}
     */
    render: render,

    /**
     * Replace skeleton with HTML content.
     * @param {object} skeletonHandle  — handle returned by render()
     * @param {string} contentHtml
     */
    replaceWith: replaceWith,

    /**
     * Shorthand: N card skeletons.
     * @param {Element} container
     * @param {number} [count=3]
     */
    cards: function (container, count) { return cards(container, count); },

    /**
     * Shorthand: N row skeletons.
     * @param {Element} container
     * @param {number} [count=5]
     */
    rows: function (container, count) { return rows(container, count); },

    /**
     * Subscribe to skeleton events.
     * Events: "rendered" | "unmounted" | "replaced"
     * @param {string} event
     * @param {function} handler
     */
    on: _on,

    /**
     * Unsubscribe from skeleton events.
     * @param {string} event
     * @param {function} handler
     */
    off: _off,
  });

}(typeof window !== "undefined" ? window : this));
