import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function text(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function requireText(path, needles) {
  const source = text(path);
  for (const needle of needles) {
    if (!source.includes(needle)) errors.push(`${path}: missing ${needle}`);
  }
}

function requireAsset(path, minBytes = 2048) {
  const full = resolve(root, path);
  let size = 0;
  try {
    size = statSync(full).size;
  } catch {
    errors.push(`${path}: missing asset`);
    return;
  }
  if (size < minBytes) errors.push(`${path}: asset looks too small (${size} bytes)`);
}

requireText("index.html", [
  '["history-hunters", "archive-quest", "review-maze-chase", "cold-war-invaders", "regents-rally-source-circuit", "regents-practice-exam", "ap-practice-exam"]',
  "FEATURED_GAME_IDS",
  "featuredBadges",
  "featured-rank",
  "traffic-dashboard",
  "trafficTopGames",
  "trafficTrend",
  "mobile-lite",
  "slow-load",
  '"play-lane"',
  '"history-hunters"',
  '"cold-war-invaders"',
  'if (game.id === "regents-rally-source-circuit") return -4.4',
  "assets/game-thumbnails/"
]);

requireText("games/archive-quest/game.js", [
  "maxAirJumps: 1",
  "ground: -1110",
  "air: -1140",
  "Math.pow(.0038",
  "Math.pow(.010",
  "Double Ready",
  "ledgeAssist",
  "Review gate",
  "weakTopics: topMissedTargets"
]);
requireText("games/archive-quest/index.html", [
  'id="jumpBtn"',
  'id="dashBtn"',
  'id="jumpState"'
]);

requireText("games/cold-war-invaders/game.js", [
  "bindTouchButton",
  "playerBottomInset",
  "state.touch.fire",
  "Touch Intel Burst Armed",
  "weakTopics: accuracy < 70"
]);
requireText("games/cold-war-invaders/styles.css", [
  "touch-action: none",
  "width: min(460px",
  "body.playing .hud:hover",
  "body.playing .mobile-controls { display: grid; }",
  ".touch-btn.fire"
]);

requireText("games/history-hunters-2/game.js", [
  "trackHunterCompletion",
  "review quest",
  "Open-World RPG",
  "game_complete",
  "startMusic",
  "playSfx",
  "characterTechniques",
  "makeAttackFx",
  "drawMoveTrail",
  "battleFxSheet",
  "drawGeneratedFxSprite"
]);
requireText("games/history-hunters-2/index.html", [
  "viewport-fit=cover",
  'id="soundBtn"',
  'id="pad"',
  'id="questSource"'
]);

for (const id of ["history-hunters", "archive-quest", "review-maze-chase", "cold-war-invaders", "regents-practice-exam"]) {
  requireAsset(`assets/game-thumbnails/${id}.webp`, 1024);
}
requireAsset("games/cold-war-invaders/assets/cold-war-invaders-atari-sheet.webp", 10000);
requireAsset("assets/review-maze-chase/key-art.webp", 10000);
requireAsset("assets/review-maze-chase/player.png", 10000);
requireAsset("assets/archive-quest/background.webp", 10000);
requireAsset("assets/history-hunters/overworld-map.webp", 10000);
requireAsset("assets/history-hunters/generated/battle-fx-sheet-v2-clean.webp", 10000);

if (errors.length) {
  console.error(`Flagship game audit failed (${errors.length} issues):`);
  errors.forEach((error) => console.error("-", error));
  process.exit(1);
}

console.log("OK: flagship game audit passed.");
