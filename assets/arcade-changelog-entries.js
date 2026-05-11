/* Mr. Mac's Arcade — Changelog entries seed
 *
 * Registers recent ships with the in-app changelog widget so the
 * "What's New" panel shows accurate, fresh content the moment a player
 * loads the hub. Entries are reverse-chronological inside the widget.
 *
 * Add a new entry at the TOP of the register() call when you ship a
 * meaningful update.
 */
(function () {
  "use strict";
  // Wait until the widget is available, then register.
  function go() {
    if (!window.MrMacsChangelog || typeof window.MrMacsChangelog.register !== "function") return;
    window.MrMacsChangelog.register([
      {
        date: "2026-05-11",
        version: "v6.9",
        headline: "Teacher superpowers — Daily Leaderboard + Friday Practice + Live Multiplayer",
        items: [
          { kind: "new", text: "Daily Challenge global leaderboard — top 5 scores per day's auto-picked challenge render directly inside the daily-band. New entries appear live; admin can surgically delete via the red × button on each row when /?admin=mrmac-arcade-admin-2026 unlocks admin mode." },
          { kind: "new", text: "Content-filter on display names — 60-stem curated blocklist + leet-speak normalization (B1tch / 5h1t / Fück all caught). Blocked submissions post as 'PLAYER' so the score still counts; only the name gets scrubbed. Teachers can extend via MrMacsLeaderboards.addBlockedTerm('xxx')." },
          { kind: "new", text: "Friday Practice — one-click print/PDF export of the student's wrong-answer queue. Lives in the profile drawer. Three formats: full worksheet (questions + answer key), student-copy only, or answer-key only. Generates a classroom-ready handout grouped by course with name/period/score writing lines." },
          { kind: "new", text: "Live Multiplayer rooms — WebRTC via PeerJS. Teachers host a 6-letter coded room from the floating 🎮 button; up to 16 students join from their phones with 3-char initials (content-filtered). Bidirectional message protocol (buzz, score-sync, clue-select, game-over) is gameplay-agnostic and ready for per-game integration." },
          { kind: "fix", text: "Mobile portrait polish: hid the cabinet status ribbon on viewports ≤ 520px (was overlapping the bottom of every game's canvas + touch controls). Slimmed the per-game marquee from 41px (two-line wrap) to 16px (single-line nowrap). Saved ~75px of canvas room on every mobile game." },
          { kind: "fix", text: "Regents Rally kart racer unblocked. The first-run tutorial overlay was firing 1.8s into the user's very first race, pointing at the now-hidden character-select grid and covering the entire race canvas. Disabled auto-fire of the in-race tour; the manual 'Tour' button in the race HUD still works for opt-in." },
          { kind: "new", text: "12 games got tighter review-question intervals: Snake Pit 22s→13s scholar spawn, Atlas-2048 12-26→6-14 merges, Step Pyramid 14s→9s disc respawn, Cascade 30→18 pops, Chronoblocks 25→14 pieces, Knight's Quest 1→2 relics/floor, plus six others. More review opportunities without changing any mechanics." },
          { kind: "fix", text: "Jeopardy card descriptions now show the course AND unit (e.g., 'AP European History · Unit 1 — Fast recall, vocabulary, and exam-style concepts.') instead of the same generic line on every card. Yearlong / Cumulative / Final exam variants use the right label." },
          { kind: "fix", text: "Hub first-run tour now waits for the CRT boot to finish (~3000ms) before firing on returning users. Was overlapping the boot animation with a tutorial card visible simultaneously." },
          { kind: "perf", text: "Long-standing bug: arcade-progress-extras.js was unconditionally overwriting MrMacsLeaderboards with a 6-method stub, silently stripping the canonical module's full API. Now guarded — the canonical module's submit/top/deleteEntry/admin/filter surface stays intact." }
        ]
      },
      {
        date: "2026-05-11",
        version: "v6.8",
        headline: "1989 arcade cabinet feel — full UI overhaul (Tier 1–4)",
        items: [
          { kind: "new", text: "Procedural 8-bit SFX library: hover/click/coin/start/success/error cues synthesized via Web Audio. Auto-wires to game cards, INSERT COIN, primary buttons. SFX toggle pill in topnav persists choice." },
          { kind: "new", text: "Top-of-cabinet marquee on every page: chasing dot-lights, neon-gold MR. MAC'S brand, pulsing coin slots. Per-game marquee strip ties hub and games together visually." },
          { kind: "new", text: "CRT power-on sequence — 3-phase scan/brand/coin animation on first session load, sessionStorage-gated so it plays once. Skip with any key/click. Auto-disabled under prefers-reduced-motion." },
          { kind: "new", text: "Attract-mode carousel on hub above the hero — auto-cycles 18 flagship/featured games every 3.6s with fading title swap, animated arrow, glowing border. Click jumps to that game." },
          { kind: "new", text: "PLAYER 1 READY banner flashes when starting any game; GAME OVER stinger with 9→0 CONTINUE countdown auto-mounts when end-screens become visible; +NN coin-pop labels float up from score elements on every tick." },
          { kind: "new", text: "Cabinet status ribbon at the bottom of every game page: POWER (pulsing green LED) · CREDITS 99 · 1P · v6.7. Joystick + 4-button cluster control-hint chip in every game topbar." },
          { kind: "new", text: "Pixel-coin shower drops 12 spinning coins from the top of the hub on first session load — timed to land as the CRT boot fades. Session-once so it doesn't replay on every nav." },
          { kind: "new", text: "CRT scanline intensity dial in the topnav (0–100%) — lets users tune the retro effect to taste. Persists to localStorage. Multiplies into the existing scanline overlay opacity." },
          { kind: "new", text: "Chunky arcade buttons with triple-stacked shadows + bezel rims, cartridge-label game cards with marquee strips, 7-segment LCD HUD numerics, cabinet side-bezel inset shadows along body edges." },
          { kind: "perf", text: "Service worker bumped to v3 cache, precaches new SFX + cabinet-fx modules. Headless Chromium smoke confirms 78/78 games pass with marquee, status ribbon, cabfx, sfx all mounted and zero JS errors." }
        ]
      },
      {
        date: "2026-05-11",
        version: "v6.7",
        headline: "78/78 games professional — overhaul complete",
        items: [
          { kind: "perf", text: "Headless smoke test confirms every game in the arcade is a professional playable surface — 58 games start cleanly with state transition + 0 console errors, 20 course landing pages serve as polished navigation shells" },
          { kind: "new", text: "Hub library now defaults to 12 desktop / 6 mobile curated cards instead of dumping all 219 — Show All button persists choice across sessions" },
          { kind: "new", text: "Help-overlay 'How to Play' button on 8 more games: Atlas 2048, Sokoban Scribe, Sudoku Scribe, Knight's Quest, Galaxy Defender, Empire Ascendant, Snake Pit (end-recap)" },
          { kind: "fix", text: "Solitaire Hall portrait nudge: rotate-to-landscape overlay on iPhone (was 37% viewport fill — fundamentally a landscape game)" },
          { kind: "new", text: "Persistent 'What's New' badge in hub topbar — visitors can always reach the changelog drawer" }
        ]
      },
      {
        date: "2026-05-11",
        version: "v6.6",
        headline: "Platform overhaul — PWA, 20 new course pages, mobile keyboards",
        items: [
          { kind: "new", text: "Installable Progressive Web App — register service worker, link manifest, offline-cache for static assets and the question bank" },
          { kind: "new", text: "20 new course landing pages — every AP, Regents, and grade-level course shell (Grade 5/6/7/8, Global 9/10, AP World/Euro/HuG/Macro/Micro/Gov/Psych/Econ/APUSH, Civics PiG, Econ, Sprint, US History) now has a polished entry surface with course-themed accent colors. 158 Jeopardy boards now discoverable." },
          { kind: "new", text: "Anagram Atlas mobile QWERTY keyboard — 28 tappable keys, 44px targets, Backspace + Submit on the bottom row. Same proven pattern as Word Bridge." },
          { kind: "perf", text: "Defensive shared-bank wire-up across 31 more games (57/78 total) — future-proofs games against bank integration drift" },
          { kind: "fix", text: "Manifest start_url + icon paths fixed to relative (PWA install now resolves correctly on GitHub Pages subpath)" }
        ]
      },
      {
        date: "2026-05-10",
        version: "v6.5",
        headline: "Snake Pit goes battle royale",
        items: [
          { kind: "new", text: "12 named historic rivals (Caesar, Cleopatra, Napoleon, Tubman, Mansa Musa, Genghis, Gandhi, Hammurabi, Catherine, Mandela, Tut, Joan) each with hunter / greedy / cautious personality" },
          { kind: "new", text: "Leviathan boss snake surfaces every 90s — kill it for +500 score, +20 shards, free scholar orb" },
          { kind: "new", text: "Combo system: chain orbs in 2.5s for ×2 → ×3 → ×5 FRENZY multipliers" },
          { kind: "new", text: "Live top-5 leaderboard panel updates 2.5× per second" },
          { kind: "new", text: "Two new powerups: ◈ Shield (auto-blocks next death) + ✺ Supernova (instant KO nearest rival)" },
          { kind: "new", text: "Four difficulty modes: Reading Room (4 rivals) → Coliseum (13 rivals + 50s boss timer)" }
        ]
      },
      {
        date: "2026-05-10",
        version: "v6.4",
        headline: "Shared question bank — 1,937 questions across 16 courses",
        items: [
          { kind: "new", text: "Grade 5 / 6 / 7 / 8 social studies (320 questions)" },
          { kind: "new", text: "Global History 9 + 10 NY Regents prose (485 questions across Ancient → Modern)" },
          { kind: "new", text: "US History — Founding to present (300 questions)" },
          { kind: "new", text: "US Government & Civics (100), Economics (100)" },
          { kind: "new", text: "AP courses — World, US, European, Human Geo, Gov, Macro, Micro (632 questions)" },
          { kind: "perf", text: "26 arcade games now pull from the shared pool — no more recycled tiny banks" }
        ]
      },
      {
        date: "2026-05-10",
        version: "v6.3",
        headline: "Brickoria — 20-era global+US arc",
        items: [
          { kind: "new", text: "Expanded from 8 → 20 eras: Ancient Civilizations → Boss Stage" },
          { kind: "new", text: "213-question Regents-aligned bank with era-matched picks" },
          { kind: "new", text: "No-repeat tracker — same prompt won't show twice in one run" },
          { kind: "new", text: "Each era ships its own palette, gradient, brick + gold-boss colors" }
        ]
      },
      {
        date: "2026-05-10",
        version: "v6.2",
        headline: "Mobile touch overhaul",
        items: [
          { kind: "fix", text: "Word Bridge: real HTML QWERTY keyboard on iPhone (canvas keyboard was unreadable at 8.6px font)" },
          { kind: "fix", text: "Source Snake: on-screen D-pad + 14px swipe-on-touchmove (was 24px swipe-on-touchend)" },
          { kind: "new", text: "Stellar Drift: 90×90 thrust/fire buttons with text labels + amplified glow on press" },
          { kind: "new", text: "Stellar Drift: nebula clouds backdrop + asteroid inner fills with crater highlights" }
        ]
      },
      {
        date: "2026-05-08",
        version: "v6.1",
        headline: "Hub streamline + retro arcade theme",
        items: [
          { kind: "new", text: "80s/90s 8-bit retro theme via Press Start 2P + VT323 fonts" },
          { kind: "new", text: "Streamlined hub — killed scroller, daily-challenge bloat, 9+ floating bands" },
          { kind: "new", text: "Ambient shards notifications (corner pill, pixel font, 1.4s fade)" },
          { kind: "fix", text: "2-column compact game-card grid on mobile, 180px fixed card height" }
        ]
      }
    ]);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", go);
  } else {
    go();
  }
})();
