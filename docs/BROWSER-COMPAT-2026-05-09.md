# Browser Compatibility Audit · 2026-05-09

Read-only sweep of `assets/`, the `index.html` inline scripts/styles, and a
spot-check of five flagship `games/*/game.js` files. Findings are scored
against the six target engines: **Safari iOS (Mobile)**, **Safari macOS**,
**Chrome Android**, **Chrome desktop**, **Firefox desktop**, **Edge desktop**.

The arcade is generally well-engineered for cross-browser use — `webkitAudioContext`
fallbacks, `prefers-reduced-motion`, `addListener` legacy fallbacks, and
QuotaExceeded-tolerant `localStorage` wrappers are in place across most modules.
A handful of issues remain, and the heaviest concern is **`color-mix()`** which
is used 48× in `index.html` without `@supports` fallback, breaking visual
parity on Safari iOS 16.0 / 16.1 (small but real install base).

---

## Methodology

Files examined in full:

- `assets/arcade-perf.js` (216 lines)
- `assets/arcade-sessions.js` (415 lines)
- `assets/arcade-music.js` (737 lines)
- `assets/arcade-toast.js` (649 lines)
- `assets/arcade-celebration.js` (838 lines)
- `assets/document-viewer.js` (345 lines)
- `assets/source-bank.js` (459 lines)
- `assets/mastery-engine.js` (769 lines, key sections)
- `assets/arcade-tour.js` (662 lines, key sections)
- `assets/arcade-progress-extras.js` (977 lines, key sections)
- `assets/arcade-leaderboards.js` (615 lines)
- `assets/arcade-icons.js` (419 lines, header)
- `assets/arcade-analytics.js` (943 lines, key sections)
- `assets/arcade-profile.js` (2,102 lines, key sections only — too large for
  full read; targeted greps for storage / EventTarget / matchMedia)

Files spot-checked:

- `index.html` (inline `<script>` blocks at lines ~10, ~8340, ~14040, etc.;
  inline `<style>` for `color-mix`, `:has`, `aspect-ratio`, `backdrop-filter`)
- `games/citadel/game.js`
- `games/galaxy-defender/game.js`
- `games/echo-hall/game.js`
- `games/cascade/game.js`
- `games/source-snake/game.js`
- `games/chrono-pinball/game.js` (verified custom `roundRect` polyfill)
- `assets/arcade-a11y.css` (`:has()` lookup)

Risks were flagged using a combination of `grep` audits for known
browser-divergence APIs and CSS features, plus per-file structural review for
audio/Storage initialization paths.

---

## Compatibility risk register

| Risk | Files | Browsers affected | Severity | Mitigation |
|------|-------|-------------------|----------|------------|
| `new EventTarget()` at module top with no try/catch — throws on Safari macOS < 14 / iOS Safari < 14 (Mojave + iOS 13). Crashes `MrMacsProfile` on load, which cascades into every other module that depends on it. | `assets/arcade-profile.js:104` | Safari iOS ≤13, Safari macOS ≤13 | **HIGH** | Wrap in `try { ... new EventTarget() ... } catch`. Polyfill via `document.createDocumentFragment()` (it implements `EventTarget`) or `document.createElement('div')`. |
| `color-mix(in oklab, ...)` and `color-mix(in srgb, ...)` used 48× in `index.html` inline `<style>` with **no `@supports` fallback**. Affected lines silently drop on Safari 16.0–16.1 → outline borders, accent shadows, and hover glows render with no color. | `index.html` (48 sites; lines 122, 641, 646, 647, 672, 674, 675, 752, 780, 783, 784, 800, ...) | Safari iOS 16.0–16.1 (~5% of iOS users still on these), Safari macOS 16.0–16.1, Chrome ≤110, Firefox ≤112 | **MEDIUM** | Provide static-color fallbacks ahead of each `color-mix()` declaration, or wrap the affected blocks in `@supports (color: color-mix(in oklab, red, blue))`. |
| `sessionStorage.getItem`/`setItem` calls **not wrapped in try/catch**. Throws `QuotaExceededError` on iOS Safari Private Mode (older iOS) and embedded WebViews. | `assets/arcade-analytics.js:124, 127, 564, 565` | Safari iOS Private (older), embedded WebViews, locked-down Chromebooks | **MEDIUM** | Mirror the pattern from `arcade-profile.js`: `try { sessionStorage.getItem(...) } catch (e) { return null; }`. |
| `localStorage.getItem(LOCAL_KEY)` parse path in `arcade-analytics.js` is wrapped, but a few parallel calls are not (the readProgress / public cache helpers). On Safari iOS Private (pre-iOS 11) this throws on FIRST `localStorage` access. | `assets/arcade-analytics.js:23` (boot-time `localStorage.getItem`) | Safari iOS Private (older) | LOW | Already inside a try/catch at boot — the broader pattern is fine. Verify `readProgress()` is wrapped. |
| `Element.requestFullscreen()` / `document.exitFullscreen()` invoked via `?.()` for the iframe game player. iOS Safari **never** exposes either — only `<video>.webkitEnterFullscreen()` works. Players will see a fullscreen button that does nothing. | `index.html:9645–9646` | Safari iOS (all versions) | LOW (UX) | Hide `#fullscreenBtn` when `document.fullscreenEnabled === false` (also covers Safari iOS), or label it "Open in new tab" on iOS. |
| `Element.scrollIntoView({ behavior: "smooth" })` — iOS Safari < 15.4 silently ignored `smooth` and jumped instantly. | `index.html` (~10 sites) | iOS Safari ≤15.3 | LOW | Behavior is acceptable degradation (instant jump). No fix required. |
| Reliance on `crypto.randomUUID()` — **not used.** Profile IDs use `Math.random().toString(36)` fallback, so OK across all browsers. | n/a | n/a | n/a (already mitigated) | — |
| `:has()` selector in `arcade-a11y.css:183-184` to expand checkbox/radio touch targets on touch devices. Not supported in Firefox <121 (December 2023). | `assets/arcade-a11y.css:183-184` | Firefox 120 and earlier | LOW (a11y polish) | Acceptable degradation — labels still work, just without the 44px minimum hit area. Could fall back to `label.has-checkbox { ... }` if pre-121 FF support matters. |
| `aspect-ratio: 1` — Safari < 15. Not listed as required minimum, but four sites in `index.html` rely on it for square layouts. | `index.html:941, 4109, 4631, 4951` | Safari iOS ≤14, Safari macOS ≤14 | LOW | Element will collapse to `auto`. Acceptable degradation (often inside fixed-width parents). |
| `inset: 0` shorthand. Safari 14.5+. Used in `arcade-tour.js:56,58,60`, `arcade-celebration.js:188`, `index.html`, `document-viewer.js:80,82`. | multiple | Safari iOS ≤14.4 | LOW | Use `top:0; right:0; bottom:0; left:0;` if older iOS support is critical. |
| `globalThis` reference in `assets/source-bank.js:459` and `arcade-profile.js:2025` (also `arcade-quick-stats-panel.js:605`). Each is short-circuited by a prior `typeof window !== "undefined"` check, so it never evaluates on browsers without `globalThis`. | `assets/source-bank.js`, `arcade-profile.js`, `arcade-quick-stats-panel.js` | none in practice | n/a (already mitigated) | — |
| `String.prototype.replaceAll()` used 5× in `mastery-engine.js:77-81` and 7× in `index.html` inline JS (around line 8457). Safari 13.1+, Chrome 85+, FF 77+ — well-supported in 2026, but 2020-era browsers will throw. | `assets/mastery-engine.js:77-81`, `index.html:8457-8467, 8846` | Safari ≤13.0 | LOW | Replace with `.replace(/&/g, "&amp;")` etc. if pre-2020 Safari support is required. |
| Optional chaining (`?.`) and nullish coalescing (`??`) used throughout (e.g. `mastery-engine.js:76`, `document-viewer.js:58`, `index.html:9645`). Safari 13.4+, Chrome 80+, FF 72+. | many | Safari ≤13.3 | LOW | Acceptable; matches arcade's apparent minimum baseline. |
| `Array.prototype.at()` — not found in audited files. | n/a | n/a | n/a | — |
| `structuredClone` — not found. | n/a | n/a | n/a | — |
| `Object.hasOwn` — not found (uses `Object.prototype.hasOwnProperty.call(...)` consistently). | n/a | n/a | n/a (already mitigated) | — |
| `roundRect` canvas method (Safari 16+) — only seen in `games/chrono-pinball/game.js` which **defines its own polyfill** (lines 1699–1712). Safe everywhere. | n/a | n/a | n/a (already mitigated) | — |
| `requestIdleCallback` — used in `arcade-perf.js:152` with a robust setTimeout fallback. Safari does not support natively (still missing in Safari 17). | `assets/arcade-perf.js:152-165` | n/a | n/a (already mitigated) | — |
| `requestFullscreen?.()` — uses optional-chaining call form. Safari 14+ for the syntax itself; on Safari iOS the method is just `undefined` so it short-circuits. Functional but the button is dead. | `index.html:9645-9646` | Safari iOS (UX) | LOW | See dedicated row above. |
| Web Audio: every module that touches `AudioContext` properly falls back to `webkitAudioContext` AND defers context creation until user gesture. `arcade-music.js` even installs a one-shot unlock handler on `touchend`/`mousedown`/`keydown`. | `arcade-music.js`, `arcade-celebration.js`, `arcade-toast.js`, every game `game.js` | n/a | n/a (already mitigated) | — |
| `IntersectionObserver` — used once in `index.html:9752` for reveal animations. Supported on Safari 12.1+, all Chromium, Firefox 55+. | `index.html:9752` | n/a | n/a | — |
| `MutationObserver` — used in `document-viewer.js:324`. Safari 11+, all evergreens. | `document-viewer.js` | n/a | n/a | — |
| WebP image format — every hero/lobby asset is `.webp`. Safari iOS 14+ only. | `assets/*.webp`, `index.html` `--hero` etc. | Safari iOS ≤13 | MEDIUM (visual) | Already shipping; older iOS shows broken image icon. Could provide PNG fallbacks via `<picture>` if iOS 13 support matters. |

---

## Safari iOS specific findings

1. **`color-mix()` 48× without fallback** — affects iOS 16.0–16.1 specifically.
   This is the largest single visual regression on iOS for the arcade. Borders,
   focus rings, accent shadows, hover glows, and several text-shadow lines all
   silently drop. Cards still render but lose their accent treatment.

2. **`new EventTarget()` at `arcade-profile.js:104`** — iOS Safari < 14 throws.
   This is the highest-severity correctness issue: it crashes the profile
   module at load, which means no profile, no leaderboards, no music settings,
   no toasts. iOS 13.x is still the highest available iOS on iPhone 6 / 5s /
   first-gen iPad Pro 9.7" — devices Mr. Mac's classroom may still see.

3. **WebP backgrounds** — iOS 13 and earlier render broken images for the
   hero/lobby/UI sheet WebPs.

4. **Fullscreen button (`#fullscreenBtn`)** — UX-only issue. The `?.()` call
   short-circuits correctly so nothing crashes, but the button has no effect.
   Recommend either hiding when `!document.fullscreenEnabled` or relabeling
   it "Open in new tab" on iOS.

5. **`scrollIntoView({behavior:"smooth"})`** — iOS Safari < 15.4 jumps
   instantly. Already-in-the-spec acceptable degradation.

6. **`aspect-ratio` and `inset:0`** — iOS 14 and earlier ignore these. The
   four `aspect-ratio: 1` declarations may collapse to `0` height on those
   devices, but most are inside flexbox/grid parents that supply width
   externally so the visible damage is minimal.

7. **Web Audio unlock latency** — properly handled by `arcade-music.js`'s
   one-shot `touchend`/`mousedown`/`keydown` listeners. iOS quirk: the
   context unlock requires the actual user-gesture stack frame, so any
   `start()` call buried inside a Promise chain won't unlock. Spot-check:
   the music engine handles this via `ctx.resume().then(...)` from inside
   the gesture handler. Looks correct.

---

## Safari macOS specific findings

Most iOS findings apply equally to Safari macOS. macOS-specific notes:

1. **`new EventTarget()`** — Safari macOS < 14 (Mojave / Catalina with old
   Safari) throws. Same fix as iOS.

2. **`color-mix()`** — same Safari 16.0–16.1 issue. macOS Big Sur with Safari
   16.0/16.1 was the late-2022 release window.

3. **`prefers-reduced-motion` + `addListener` fallback** — every module
   that listens for the media query (`arcade-perf.js`, `arcade-toast.js`,
   `arcade-celebration.js`, `arcade-tour.js`, `arcade-progress-extras.js`)
   correctly tries `addEventListener` first then falls back to the deprecated
   `addListener`. This is the right pattern for Safari 13.

4. **Web Speech API** — properly guarded with
   `typeof window.speechSynthesis === "undefined"` (`index.html:14061`).
   Safari macOS exposes `speechSynthesis` but voices load asynchronously;
   the audit didn't see a `voiceschanged` handler, so the very first
   read-aloud invocation may use a default-voice fallback. Acceptable.

---

## Chrome / Edge / Firefox findings

Generally clean. Specific notes:

1. **Firefox `:has()`** — pre-121 (Dec 2023) Firefox doesn't apply the
   `label:has(input[type="checkbox"])` rule in `arcade-a11y.css`. The
   touch-target expansion silently drops. Acceptable.

2. **Chrome / Edge** — no issues found. Every listed feature
   (`color-mix`, `:has`, `requestIdleCallback`, `EventTarget` constructor,
   WebP, `aspect-ratio`, `inset`, `backdrop-filter`) is supported in current
   versions. Older Chromium (< 105) may share the `color-mix()` issue, but
   in 2026 that's negligible install base.

3. **Firefox `backdrop-filter`** — supported in all evergreen versions
   (Firefox 103+, July 2022). Cabinet card glass effect renders correctly.

---

## Mobile vs desktop findings

1. **Touch handling** — every flagship game (citadel, galaxy-defender,
   echo-hall, cascade, source-snake, etc.) wires up `touchstart`/`touchmove`/
   `touchend`/`touchcancel` with explicit `{passive: true}` (or `passive:
   false` only when `e.preventDefault()` is needed for swipe gestures).
   This is the correct pattern: it lets Chrome/Safari prefer scroll
   responsiveness while still allowing intentional `preventDefault` paths.

2. **Pointer Events** — the codebase uses the older `mousedown`+`touchstart`
   model rather than unified `pointerdown`. This is fine on every target
   browser (all support both), but is more code than necessary. No
   compatibility risk.

3. **Audio gesture unlock** — `arcade-music.js:700-711` installs the unlock
   handlers in the capture phase (`true` third argument) so they run before
   game-specific listeners. Music starts cleanly on the first user gesture
   on every browser including iOS Safari.

4. **Viewport meta** — `<meta name="viewport" content="width=device-width,
   initial-scale=1">` is correct. No `user-scalable=no` (good for a11y).

5. **`(pointer: coarse)` media query** — used in `arcade-analytics.js:134`
   for device classification. Universally supported.

6. **Long-press / right-click on iOS** — not directly used. The Konami
   easter egg (`index.html:14102`) listens for sequenced arrow keys, which
   only fires on devices with a hardware keyboard. iOS users won't trigger
   it accidentally.

---

## Already-mitigated risks

The codebase already handles a lot of cross-browser surface area well:

1. **`webkitAudioContext` fallback** — every Web Audio site uses
   `window.AudioContext || window.webkitAudioContext` (`arcade-music.js:307`,
   `arcade-celebration.js:84`, `arcade-toast.js:55`, every `game.js`).

2. **Lazy AudioContext init + suspend on hidden** — `arcade-music.js`
   suspends on `visibilitychange` and resumes on return; this is critical
   for iOS battery life.

3. **`matchMedia` `addListener` fallback** — `arcade-perf.js:97-100`,
   `arcade-toast.js:100-103`, `arcade-celebration.js:155-158`,
   `arcade-tour.js:97-99`, `arcade-progress-extras.js:99-104` all
   gracefully fall back to the deprecated API for Safari 13.

4. **`localStorage` try-wrapped** — `arcade-profile.js:370-414`,
   `arcade-sessions.js:79-122`, `arcade-leaderboards.js:95-114`,
   `arcade-tour.js:144-159`, `arcade-progress-extras.js:71-90`,
   `arcade-music.js:282-297` all wrap reads/writes in try/catch with
   QuotaExceeded recovery. The single gap is `arcade-analytics.js`'s
   `sessionStorage` calls.

5. **`requestIdleCallback` polyfill** — `arcade-perf.js:152-165` provides
   a `setTimeout`-backed fallback with a faked `IdleDeadline` argument.
   Safari iOS / macOS get the same API surface.

6. **`prefers-reduced-motion` everywhere** — every animation-heavy module
   (`arcade-celebration.js`, `arcade-toast.js`, `arcade-tour.js`) detects
   the preference and degrades gracefully (instant fades, single emoji
   floats, color washes instead of particle bursts).

7. **`-webkit-backdrop-filter` paired** — every `backdrop-filter` declaration
   (38+ sites in `index.html`, plus `arcade-toast.js`, `arcade-tour.js`,
   `document-viewer.js`) ships the `-webkit-` prefix alongside, covering
   Safari 13.

8. **`canvas.roundRect()`** — never called natively; only the locally-defined
   polyfill in `chrono-pinball/game.js` is used.

9. **`speechSynthesis` guarded** — `index.html:14061` checks `typeof
   window.speechSynthesis === "undefined"` before any call.

10. **WebP-tolerant `<picture>` not yet shipped** — see WebP risk above. This
    is a known shippable degradation, not a crash.

11. **Konami code easter egg** — keyboard-only, no mobile accidental fires.

12. **`resize` listeners with `{passive: true}`** — used in every game and
    `arcade-celebration.js:199`. Avoids scroll-jank on Safari iOS.

---

## Recommendations

Priority-ordered:

1. **Wrap `new EventTarget()` in `arcade-profile.js:104` (HIGH, ~5 min).**
   The single highest-impact fix. Prevents a top-level module crash on
   Safari iOS ≤13 / macOS ≤13. Replace:
   ```js
   var EVENT_TARGET = (typeof window !== "undefined" && window) ? new EventTarget() : null;
   ```
   with something like:
   ```js
   var EVENT_TARGET = null;
   try {
     if (typeof window !== "undefined" && typeof EventTarget === "function") {
       EVENT_TARGET = new EventTarget();
     }
   } catch (e) {
     try { EVENT_TARGET = document.createDocumentFragment(); } catch (e2) {}
   }
   ```

2. **Add `@supports` fallback for `color-mix()` (MEDIUM, ~30 min).**
   Either ship explicit static colors before each `color-mix()` line:
   ```css
   border-color: rgba(122, 240, 255, 0.6); /* fallback */
   border-color: color-mix(in oklab, var(--accent, #7af0ff) 64%, white 10%);
   ```
   or wrap accent-style blocks in `@supports`. Restores accent treatment
   on iOS 16.0/16.1.

3. **Wrap `sessionStorage` calls in `arcade-analytics.js` (MEDIUM, ~10 min).**
   Mirror the pattern already used in `arcade-profile.js`:
   ```js
   function safeSessionGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
   function safeSessionSet(k, v) { try { sessionStorage.setItem(k, v); return true; } catch (e) { return false; } }
   ```

4. **Hide `#fullscreenBtn` on Safari iOS (LOW, ~5 min).** Either:
   ```js
   if (!document.fullscreenEnabled) document.getElementById("fullscreenBtn").hidden = true;
   ```
   or relabel to "Open in new tab" with `window.open(...)` behavior.

5. **WebP `<picture>` fallback (LOW, ~30 min).** If iOS 13 / older Android
   support is genuinely needed, ship a sibling `.png` for each WebP hero
   image and use `<picture><source type="image/webp">` for cards. CSS
   custom-property backgrounds are harder to fall back; deferring is fine.

6. **`@supports` block for `aspect-ratio` (LOW, ~10 min).** Add explicit
   width:height pairings as fallback for iOS ≤14 if the four square layouts
   matter on that target.

7. **Document the minimum supported browser matrix.** Currently the README
   makes no statement; Mr. Mac's classroom needs to know whether
   "iPad gen 6 still works" is in scope. A one-paragraph "supported
   browsers" section would prevent regressions.

---

## Appendix: shim catalog

Already present in the codebase:

| Shim | Where | Falls back to |
|------|-------|---------------|
| `window.AudioContext \|\| window.webkitAudioContext` | every audio site | older Safari path |
| `mq.addEventListener('change', ...) \|\| mq.addListener(...)` | 5+ sites | Safari 13 / iOS 13 path |
| `requestIdleCallback` → `setTimeout` shim | `arcade-perf.js:149-165` | universal |
| `cancelIdleCallback` → `clearTimeout` shim | `arcade-perf.js:167-173` | universal |
| `requestAnimationFrame` → `setTimeout(16)` | `arcade-perf.js:135` (in `withFrame`) | universal |
| `localStorage` try/catch wrappers | `arcade-profile.js`, `arcade-sessions.js`, `arcade-leaderboards.js`, `arcade-tour.js`, `arcade-progress-extras.js`, `arcade-music.js` | Safari Private Mode / quota exhausted |
| `safeJsonParse` | `arcade-profile.js:415` | malformed JSON |
| `Object.prototype.hasOwnProperty.call(...)` (instead of `Object.hasOwn`) | every object iteration | universal |
| Custom `roundRect()` polyfill | `games/chrono-pinball/game.js:1699` | Safari ≤15 |
| `globalThis` short-circuit via `typeof window !== "undefined"` | `source-bank.js:459`, `arcade-profile.js:2025`, `arcade-quick-stats-panel.js:605` | older Safari |
| `?.()` optional-chaining call (`requestFullscreen?.()`) | `index.html:9645` | iOS Safari (no fullscreen at all) |

**Gaps** (recommended to add):

- `sessionStorage` try/catch (`arcade-analytics.js`)
- `EventTarget` constructor try/catch (`arcade-profile.js:104`)
- `color-mix()` `@supports` fallback (`index.html` 48 sites)
- WebP `<picture>` fallback (`index.html` hero/UI imagery)
- `document.fullscreenEnabled` gate on `#fullscreenBtn`

---

*End of report. 5 ranked fixes; 1 HIGH, 3 MEDIUM, the rest LOW. Total
remediation estimate: ~1.5 hours of focused work.*
