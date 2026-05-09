/* ─────────────────────────────────────────────────────────────────────
   Mr. Mac's Arcade · monoline icon library
   ──────────────────────────────────────────────────────────────────────
   Drop-in replacement for color emojis used in arcade UI.
   Every icon is a 24×24 monoline SVG that inherits color via currentColor
   and scales via the .ic CSS class. No external assets, zero runtime cost.

   Usage:
     window.MrMacsIcons.svg("flame")        → <svg>…</svg> string
     window.MrMacsIcons.fromEmoji("🔥")      → same string
     window.MrMacsIcons.has("cap")           → boolean
     window.MrMacsIcons.list()               → array of names

   Design notes:
   - 1.6px stroke, square caps + miter joins, viewBox 0 0 24 24
   - Editorial glyph aesthetic — geometric, minimal, dignified
   - Pairs with Fraunces / Inter / JetBrains Mono ladder
   ─────────────────────────────────────────────────────────────────────── */
(function (root) {
  "use strict";
  if (root.MrMacsIcons) return;

  // Common open tag — closing tag appended in REGISTRY entries below
  var O = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var C = '</svg>';

  // ── Icon paths ───────────────────────────────────────────────────────
  // Each value is the inner path markup. `O + path + C` gives the full svg.
  var REGISTRY = {
    // Mortarboard (default scholar avatar)
    "cap": '<path d="M2.5 9 L12 4.5 L21.5 9 L12 13.5 Z"/><path d="M6 11 L6 16 C6 17.2 9 18 12 18 C15 18 18 17.2 18 16 L18 11"/><path d="M21.5 9 L21.5 14"/>',
    // Concentric crosshair (daily / target)
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    // Shuffle arrows (random)
    "shuffle": '<polyline points="16,3 21,3 21,8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21,16 21,21 16,21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
    // Trophy / chalice (achievements)
    "trophy": '<path d="M7 4 L17 4 L17 9 C17 12.5 14.7 14.5 12 14.5 C9.3 14.5 7 12.5 7 9 Z"/><path d="M7 6 L4 6 C4 9 5 11 7 11"/><path d="M17 6 L20 6 C20 9 19 11 17 11"/><line x1="12" y1="14.5" x2="12" y2="18"/><path d="M9 18 L15 18 L15 20.5 L9 20.5 Z"/>',
    // Faceted diamond (shards)
    "diamond": '<path d="M6.5 3 L17.5 3 L21.5 9 L12 21 L2.5 9 Z"/><line x1="2.5" y1="9" x2="21.5" y2="9"/><line x1="6.5" y1="3" x2="9" y2="9"/><line x1="9" y1="9" x2="12" y2="21"/><line x1="17.5" y1="3" x2="15" y2="9"/><line x1="15" y1="9" x2="12" y2="21"/>',
    // Vertical bars (mastery / chart)
    "bars": '<line x1="5" y1="20" x2="5" y2="13"/><line x1="12" y1="20" x2="12" y2="8"/><line x1="19" y1="20" x2="19" y2="4"/><line x1="3" y1="22" x2="21" y2="22"/>',
    // Map pin (location / recommendation)
    "pin": '<path d="M12 2.5 C7.6 2.5 4.2 5.9 4.2 10.3 C4.2 16 12 21.5 12 21.5 C12 21.5 19.8 16 19.8 10.3 C19.8 5.9 16.4 2.5 12 2.5 Z"/><circle cx="12" cy="10.3" r="2.6"/>',
    // Stacked books (library / cram)
    "books": '<rect x="3" y="6" width="5.5" height="14" rx="0.6"/><rect x="10" y="3" width="5.5" height="17" rx="0.6"/><path d="M17.5 7.5 L21 8.4 L18.5 21 L15.6 20.2 Z"/>',
    // Document with lines (memo / practice)
    "memo": '<path d="M5.5 3 H14 L18.5 7.5 V21 H5.5 Z"/><polyline points="13.5,3 13.5,8 18.5,8"/><line x1="8.5" y1="13" x2="15.5" y2="13"/><line x1="8.5" y1="17" x2="13" y2="17"/>',
    // Flame (streak / rush)
    "flame": '<path d="M12 21.5 C8.4 21.5 5.5 18.8 5.5 14.7 C5.5 11.5 8 9 8 6 C9.4 7.8 10.6 8.7 10.6 11.4 C11.6 9.6 12.6 8.2 13.5 6 C14.5 8 17.5 10.5 17.5 14.7 C17.5 18.8 15.4 21.5 12 21.5 Z"/><path d="M12 21.5 C10.5 20.7 9.3 19.1 9.3 17.3 C9.3 15.6 10.6 14.3 12 13 C13.4 14.3 14.7 15.6 14.7 17.3 C14.7 19.1 13.4 20.7 12 21.5 Z" fill="currentColor" fill-opacity="0.25" stroke="none"/>',
    // Mind / synapse (jeopardy / quiz)
    "mind": '<path d="M9 6 C7 6 5.5 7.5 5.5 9.5 C4.2 10 3.5 11 3.5 12.5 C3.5 13.8 4.3 14.7 4.8 15.2 C4.5 16.5 5 18.2 6.5 18.7 C7 20 8.5 20.7 10 20.5"/><path d="M15 6 C17 6 18.5 7.5 18.5 9.5 C19.8 10 20.5 11 20.5 12.5 C20.5 13.8 19.7 14.7 19.2 15.2 C19.5 16.5 19 18.2 17.5 18.7 C17 20 15.5 20.7 14 20.5"/><path d="M12 4 V20.5"/><path d="M12 9 H10"/><path d="M12 13 H9"/><path d="M12 9 H14"/><path d="M12 13 H15"/>',
    // Stethoscope ECG pulse (diagnostic)
    "pulse": '<polyline points="2.5,12 6.5,12 9,7 12,17 14.5,9.5 16.5,12 21.5,12"/>',
    // Lightning bolt (sprint / quick)
    "bolt": '<path d="M13 2 L4 13 L11 13 L11 22 L20 11 L13 11 Z"/>',
    // Crossed swords (gauntlet / battle)
    "swords": '<path d="M14.5 17.5 L20.5 11.5"/><path d="M9.5 17.5 L3.5 11.5"/><path d="M14.5 17.5 L13 16 L18 11 L20.5 11.5 L21 14 L16 19 Z"/><path d="M9.5 17.5 L11 16 L6 11 L3.5 11.5 L3 14 L8 19 Z"/><line x1="11.5" y1="20" x2="13.5" y2="22"/><line x1="12.5" y1="19" x2="14.5" y2="21"/>',
    // Compass / star spark (course portal)
    "spark": '<path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"/>',
    // Crown / queen (mastery)
    "crown": '<path d="M3.5 18 L20.5 18 L20.5 20 L3.5 20 Z"/><path d="M3.5 18 L5 7 L9 12 L12 5 L15 12 L19 7 L20.5 18"/><circle cx="5" cy="6.5" r="1.2"/><circle cx="12" cy="4.5" r="1.2"/><circle cx="19" cy="6.5" r="1.2"/>',
    // Lightning bolt arrow (rocket / launch)
    "rocket": '<path d="M9 14 L4 13 L7 9 L9 9.5 Z"/><path d="M14 4 C18 5 19 6 20 10 C16 14 11 17 8 17 C8 14 11 9 14 4 Z"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/><path d="M9 17 L7 21"/><path d="M11 19 L9 22"/>',
    // Library shelf
    "library": '<rect x="3" y="3" width="18" height="18" rx="1.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>',
    // Atom / scholar
    "atom": '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-60 12 12)"/>',
    // Microscope / explorer
    "explorer": '<circle cx="11" cy="6" r="3"/><path d="M11 9 V14"/><path d="M8 14 H14"/><path d="M9 14 L7 21 H15 L13 14"/><path d="M14 4 L17 1"/>',
    // Owl-style head (sage)
    "sage": '<path d="M5 5 C5 8 7 10 7 14 C7 18 9 20 12 20 C15 20 17 18 17 14 C17 10 19 8 19 5"/><circle cx="9" cy="11" r="1.4"/><circle cx="15" cy="11" r="1.4"/><path d="M11 14 L12 16 L13 14"/><path d="M5 5 L4 3"/><path d="M19 5 L20 3"/>',
    // Compass rose (navigator)
    "compass": '<circle cx="12" cy="12" r="9"/><polygon points="12,5 14,12 12,19 10,12" fill="currentColor" stroke="none" fill-opacity="0.85"/><line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/>',
    // Phoenix / wing (rebirth)
    "phoenix": '<path d="M12 21 C7 21 4 17 4 13 C4 9 6 6 9 4 C9 7 11 9 13 10 C12 7 13 4 16 3 C17 7 19 8 20 11 C20 16 16 21 12 21 Z"/><path d="M9 14 C10 13 11 13 12 14"/>',
    // Bookworm
    "bookworm": '<rect x="3" y="3" width="14" height="18" rx="1"/><line x1="3" y1="7" x2="17" y2="7"/><circle cx="7" cy="13" r="0.8" fill="currentColor"/><circle cx="9" cy="13" r="0.8" fill="currentColor"/><path d="M19 7 C21 7 22 8 22 10 C22 12 21 13 19 13 C21 13 22 14 22 16 C22 18 21 19 19 19"/>',
    // Rocket-launch (explorer alternate)
    "explorer-alt": '<path d="M9 11 C9 7 11 4 12 3 C13 4 15 7 15 11 V18 H9 Z"/><path d="M9 14 L6 16 L7 19 L9 18"/><path d="M15 14 L18 16 L17 19 L15 18"/><circle cx="12" cy="9" r="1.4"/>',
    // Pulse heart (clinic)
    "heart-pulse": '<path d="M3 12 H8 L10 8 L13 16 L15 12 H21"/>',
    // Question mark in circle
    "help": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9 C9.5 7 10.5 6 12 6 C13.5 6 14.5 7 14.5 8.5 C14.5 10 12 11 12 13"/><circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none"/>',
    // Close X (hub close button — keep ✕ but available if needed)
    "close": '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
    // Arrow right
    "arrow-right": '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14,6 20,12 14,18"/>',
    // Star (course glyph)
    "star": '<polygon points="12,3 14.5,9.5 21.5,10 16,14.5 18,21.5 12,17.5 6,21.5 8,14.5 2.5,10 9.5,9.5"/>',
    // Globe / world
    "globe": '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/>',
    // Calendar
    "calendar": '<rect x="3" y="5" width="18" height="16" rx="1.5"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
    // Scroll (scribe)
    "scroll": '<rect x="5" y="6" width="14" height="12" rx="0.5"/><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/><circle cx="5" cy="6" r="1.6"/><circle cx="19" cy="18" r="1.6"/>',
    // Wizard hat
    "wizard": '<path d="M12 3 L18 19 L6 19 Z"/><path d="M5 19 H19"/><circle cx="12" cy="10" r="0.7" fill="currentColor" stroke="none"/><circle cx="14.2" cy="14" r="0.7" fill="currentColor" stroke="none"/><circle cx="9.8" cy="15" r="0.7" fill="currentColor" stroke="none"/>',
    // Owl head
    "owl": '<circle cx="12" cy="13" r="7.5"/><path d="M5 9 L7.5 5 L9.5 9"/><path d="M19 9 L16.5 5 L14.5 9"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="12" r="0.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="0.5" fill="currentColor" stroke="none"/><path d="M10.5 16 L12 17.5 L13.5 16"/>',
    // Fox face (triangle ears)
    "fox": '<path d="M12 4.5 L8 7.5 L4 5.5 L5.5 11 L4 14 L8 14.5 L12 19 L16 14.5 L20 14 L18.5 11 L20 5.5 L16 7.5 Z"/><circle cx="10" cy="11" r="0.7" fill="currentColor" stroke="none"/><circle cx="14" cy="11" r="0.7" fill="currentColor" stroke="none"/><path d="M11 14 L12 15 L13 14"/>',
    // Lion (sun-rayed circle)
    "lion": '<circle cx="12" cy="12" r="5"/><line x1="12" y1="3" x2="12" y2="5.5"/><line x1="12" y1="18.5" x2="12" y2="21"/><line x1="3" y1="12" x2="5.5" y2="12"/><line x1="18.5" y1="12" x2="21" y2="12"/><line x1="5.5" y1="5.5" x2="7.5" y2="7.5"/><line x1="18.5" y1="5.5" x2="16.5" y2="7.5"/><line x1="5.5" y1="18.5" x2="7.5" y2="16.5"/><line x1="18.5" y1="18.5" x2="16.5" y2="16.5"/><circle cx="10.5" cy="11.5" r="0.5" fill="currentColor" stroke="none"/><circle cx="13.5" cy="11.5" r="0.5" fill="currentColor" stroke="none"/><path d="M10.5 13.5 L12 14.5 L13.5 13.5"/>',
    // Dragon — stylized S with horn
    "dragon": '<path d="M5 19 C5 14 9 13 11 13 C15 13 16 8 14 6 L16 4 L15 8 C18 9 19 13 16 16 C13 19 8 18.5 5 19 Z"/><circle cx="14.2" cy="8.5" r="0.7" fill="currentColor" stroke="none"/><path d="M14 4.5 L16 3 L17 5"/>',
    // Hero (cape silhouette)
    "hero": '<path d="M12 2.5 C9.5 2.5 8 4.5 8 7 V10 H16 V7 C16 4.5 14.5 2.5 12 2.5 Z"/><path d="M8 10 L4 19 L8 21 L12 11"/><path d="M16 10 L20 19 L16 21 L12 11"/><path d="M11 6 L13 8 M13 6 L11 8"/>',
    // Ninja (hooded eyes)
    "ninja": '<path d="M5 19 L5 12.5 C5 8.4 8.1 5 12 5 C15.9 5 19 8.4 19 12.5 L19 19"/><rect x="5" y="10.5" width="14" height="3.6" rx="0.5"/><circle cx="9.5" cy="12.3" r="0.8" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12.3" r="0.8" fill="currentColor" stroke="none"/>',
    // Telescope
    "telescope": '<path d="M3.5 9 L11 6.5 L13 12.2 L5.5 14.7 Z"/><path d="M11 6.5 L19.5 4.2 L20.5 7.2 L13 12.2"/><line x1="9" y1="14" x2="6.5" y2="21"/><line x1="11" y1="13.5" x2="13.5" y2="21"/>',
    // Trident
    "trident": '<line x1="12" y1="4" x2="12" y2="20"/><path d="M6.5 8 L6.5 4 L9.5 8"/><path d="M17.5 8 L17.5 4 L14.5 8"/><path d="M9.5 8 V4 L12 8 L14.5 4 V8"/><path d="M9.5 20 H14.5"/>',
    // Amphora
    "amphora": '<path d="M9 4.5 L15 4.5 L17 7.5 C17 12.5 16 14.5 13 14.5 H11 C8 14.5 7 12.5 7 7.5 Z"/><path d="M10.5 14.5 V20.5 H13.5 V14.5"/><path d="M9 7 C7 7 6 8 6 10 C6 12 7 13 9 13"/><path d="M15 7 C17 7 18 8 18 10 C18 12 17 13 15 13"/>',
    // Quill (feather)
    "quill": '<path d="M19.5 3.5 C16 3.5 7 7 4 14 C5.5 13 8.5 11 11.5 11 L13.5 13 L11.5 15 C12.5 12 13.5 10 14.5 9 L14.5 11 C18 8 20.5 6 19.5 3.5 Z"/><line x1="11.5" y1="11" x2="3" y2="20.5"/>',
    // Key (skeleton)
    "key": '<circle cx="7" cy="12" r="4"/><line x1="11" y1="12" x2="21" y2="12"/><line x1="17" y1="12" x2="17" y2="15.5"/><line x1="20" y1="12" x2="20" y2="15.5"/><circle cx="7" cy="12" r="1.4"/>',
    // Shield
    "shield": '<path d="M12 3 L20 6 V12 C20 17 16 20.5 12 22 C8 20.5 4 17 4 12 V6 Z"/><path d="M12 8 V16"/><path d="M8 11 H16"/>',
    // Sparkles
    "sparkles": '<path d="M12 4 L13 9.5 L18.5 11 L13 12.5 L12 18 L11 12.5 L5.5 11 L11 9.5 Z"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="19" r="0.8" fill="currentColor" stroke="none"/>'
  };

  // Emoji → registered name (for legacy emoji-keyed storage)
  var EMOJI_MAP = {
    // Hub UI icons
    "🎓": "cap",
    "🎯": "target",
    "🎲": "shuffle",
    "🏆": "trophy",
    "💎": "diamond",
    "📊": "bars",
    "📍": "pin",
    "📚": "books",
    "📝": "memo",
    "🔥": "flame",
    "🧠": "mind",
    "🩺": "pulse",
    "⚡": "bolt",
    "⚔": "swords",
    "✦": "spark",
    "📖": "library",
    "🌅": "phoenix",
    "🔬": "explorer",
    "🪲": "bookworm",
    "❤": "heart-pulse",
    "❓": "help",
    "✕": "close",
    "→": "arrow-right",
    "★": "star",
    "📅": "calendar",
    // Avatar set
    "🧭": "compass",
    "📜": "scroll",
    "🧙": "wizard",
    "🦉": "owl",
    "🦊": "fox",
    "🦁": "lion",
    "🐉": "dragon",
    "🦸": "hero",
    "🥷": "ninja",
    "🚀": "rocket",
    "🔭": "telescope",
    "🔱": "trident",
    "🏺": "amphora",
    "🪶": "quill",
    "🗝": "key",
    "👑": "crown",
    "🛡": "shield",
    "✨": "sparkles",
    "⚛": "atom",
    "🌍": "globe"
  };

  function svg(name) {
    var path = REGISTRY[name];
    if (!path) return "";
    return O + path + C;
  }

  function fromEmoji(emoji) {
    var name = EMOJI_MAP[emoji];
    if (!name) return null;
    return svg(name);
  }

  function has(name) { return Object.prototype.hasOwnProperty.call(REGISTRY, name); }
  function list() { return Object.keys(REGISTRY); }
  function listEmoji() { return Object.keys(EMOJI_MAP); }

  /* Convenience: walk a string and replace any emoji we know about with
     the corresponding SVG markup. Useful for HTML strings assembled in JS. */
  function expandEmojiInString(s) {
    if (!s || typeof s !== "string") return s;
    var emojis = listEmoji();
    var out = s;
    for (var i = 0; i < emojis.length; i++) {
      var e = emojis[i];
      if (out.indexOf(e) === -1) continue;
      out = out.split(e).join(fromEmoji(e));
    }
    return out;
  }

  root.MrMacsIcons = {
    svg: svg,
    fromEmoji: fromEmoji,
    has: has,
    list: list,
    listEmoji: listEmoji,
    expandEmojiInString: expandEmojiInString,
    REGISTRY: REGISTRY,
    EMOJI_MAP: EMOJI_MAP
  };
})(typeof window !== "undefined" ? window : this);
