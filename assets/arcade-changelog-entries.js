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
