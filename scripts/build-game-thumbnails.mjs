import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outDir = resolve(root, "assets/game-thumbnails");
const games = JSON.parse(readFileSync(resolve(root, "games.json"), "utf8"));
const WIDTH = 480;
const HEIGHT = 270;
const CANVAS_W = 585;
const CANVAS_H = 330;

mkdirSync(outDir, { recursive: true });

const JEOPARDY_ART = [
  "assets/jeopardy/arena.jpg",
  "assets/jeopardy/board-frame.jpg",
  "assets/jeopardy/clue-art.jpg",
  "assets/jeopardy/daily-art.jpg",
  "assets/jeopardy/final-art.jpg",
  "assets/jeopardy/panel-art.jpg",
  "assets/jeopardy/tile-art.jpg",
  "assets/jeopardy-stage-lite.jpg",
];

const GENERIC_ART = [
  "assets/portal-card.webp",
  "assets/arcade-lobby-80s.webp",
  "assets/arcade-stage-clean.webp",
  "assets/chrono-defense-road-map.webp",
  "assets/regents-gauntlet-arena.png",
  "assets/archive-cipher/archive-cipher-atlas-lite.jpg",
  "assets/boss-rush-arena-v2.webp",
  "assets/history-hunters/overworld-map.webp",
];

function hashText(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isJeopardy(game) {
  return /jeopardy/i.test([game.gameType, game.originalFile, game.file, game.collection].join(" "));
}

function baseArt(game) {
  const haystack = [game.id, game.title, game.gameType, game.collection, game.subject, game.file].join(" ").toLowerCase();
  if (haystack.includes("mastery-path")) return "assets/portal-card.webp";
  if (haystack.includes("source-lab")) return "assets/regents-gauntlet-arena.png";
  if (haystack.includes("writing-coach")) return "assets/regents-gauntlet-arena-lite.jpg";
  if (haystack.includes("regents-rally")) return "games/regents-rally-source-circuit/rally-64-key-art-v2.webp";
  if (haystack.includes("cold-war-invaders")) return "games/cold-war-invaders/assets/cold-war-invaders-atari-sheet.webp";
  if (haystack.includes("archive-quest")) return "assets/archive-quest/background.webp";
  if (haystack.includes("history-hunters")) return "assets/history-hunters/overworld-map.webp";
  if (haystack.includes("chrono-defense")) return "assets/chrono-defense-road-map.webp";
  if (haystack.includes("chrono-pinball")) return "assets/chrono-defense-game-pieces.webp";
  if (haystack.includes("boss-rush")) return "assets/boss-rush-arena-v2.webp";
  if (haystack.includes("archive-cipher")) return "assets/archive-cipher/archive-cipher-atlas-lite.jpg";
  if (haystack.includes("regents-practice") || haystack.includes("source-sprint") || haystack.includes("regents-gauntlet")) return "assets/regents-gauntlet-arena.png";
  if (haystack.includes("arcade-duel") || haystack.includes("time-rift")) return "assets/boss-energy-strike.webp";
  if (haystack.includes("timeline-runner") || haystack.includes("lightning-review") || haystack.includes("vocab-vault")) return "assets/portal-card.webp";
  if (haystack.includes("empire-ascendant")) return "assets/history-hunters/retro-tile-sprite-atlas.png";
  if (isJeopardy(game)) return JEOPARDY_ART[hashText(`${game.id}:jeopardy`) % JEOPARDY_ART.length];
  return GENERIC_ART[hashText(game.id) % GENERIC_ART.length];
}

function palette(game, index) {
  const h = hashText(`${game.id}:${game.course}:${index}`);
  const colors = [
    ["#7af0ff", "#ff4fd8"],
    ["#ffd166", "#7af0ff"],
    ["#ff5f7a", "#7dffb2"],
    ["#9d7aff", "#ffd166"],
    ["#46f4c8", "#ff8a3d"],
    ["#6aa9ff", "#ff4fd8"],
    ["#f6f7ff", "#7af0ff"],
  ];
  return colors[h % colors.length];
}

function drawPattern(accent, secondary, seed) {
  const commands = [];
  commands.push(`rectangle 0,0 ${WIDTH},8`);
  commands.push(`rectangle 0,262 ${WIDTH},${HEIGHT}`);
  commands.push(`rectangle 0,0 8,${HEIGHT}`);
  for (let i = 0; i < 12; i += 1) {
    const x = 20 + ((seed >>> (i % 20)) + i * 37) % 420;
    const y = 18 + ((seed >>> ((i + 7) % 20)) + i * 23) % 220;
    const size = 6 + ((seed >>> ((i + 11) % 20)) % 15);
    commands.push(`rectangle ${x},${y} ${x + size},${y + size}`);
  }
  for (let i = 0; i < 5; i += 1) {
    const x = 370 + ((seed >>> (i + 4)) % 64);
    const y = 28 + i * 29 + ((seed >>> (i + 12)) % 9);
    commands.push(`roundrectangle ${x},${y} ${x + 48},${y + 13} 5,5`);
  }
  return [
    "-fill", `${accent}a6`,
    "-draw", commands.slice(0, 3).join(" "),
    "-fill", `${secondary}4d`,
    "-draw", commands.slice(3).join(" "),
    "-stroke", `${accent}85`,
    "-strokewidth", "3",
    "-fill", "none",
    "-draw", `roundrectangle 10,10 ${WIDTH - 10},${HEIGHT - 10} 14,14`,
  ];
}

function buildThumb(game, index) {
  const seed = hashText(game.id);
  const source = resolve(root, baseArt(game));
  if (!existsSync(source)) throw new Error(`Missing source art for ${game.id}: ${source}`);

  const out = resolve(outDir, `${game.id}.webp`);
  const [accent, secondary] = palette(game, index);
  const x = seed % (CANVAS_W - WIDTH);
  const y = (seed >>> 8) % (CANVAS_H - HEIGHT);
  const brightness = 94 + (seed % 9);
  const saturation = 112 + ((seed >>> 5) % 22);

  const args = [
    source,
    "-auto-orient",
    "-background", "#090d18",
    "-alpha", "remove",
    "-alpha", "off",
    "-resize", `${CANVAS_W}x${CANVAS_H}^`,
    "-gravity", "center",
    "-extent", `${CANVAS_W}x${CANVAS_H}`,
    "-gravity", "NorthWest",
    "-crop", `${WIDTH}x${HEIGHT}+${x}+${y}`,
    "+repage",
    "-modulate", `${brightness},${saturation},100`,
    "-fill", "#03040acc",
    "-draw", `rectangle 0,188 ${WIDTH},${HEIGHT} rectangle 0,0 ${WIDTH},42`,
    ...drawPattern(accent, secondary, seed),
    "-quality", "72",
    out,
  ];

  const result = spawnSync("magick", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`magick failed for ${game.id}\n${result.stderr || result.stdout || ""}`);
  }
  return out;
}

let built = 0;
for (const [index, game] of games.entries()) {
  buildThumb(game, index);
  built += 1;
}

console.log(`Built ${built} game thumbnails in assets/game-thumbnails.`);
