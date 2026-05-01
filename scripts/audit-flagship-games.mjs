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
  '["history-hunters", "archive-quest", "regents-practice-exam", "ap-practice-exam", "cold-war-invaders"]',
  '"play-lane"',
  '"history-hunters"',
  '"cold-war-invaders"',
  'if (game.id === "regents-rally-source-circuit") return 6',
  "assets/game-thumbnails/"
]);

requireText("games/archive-quest/game.js", [
  "maxAirJumps: 1",
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
  "body.playing .mobile-controls { display: grid; }",
  ".touch-btn.fire"
]);

requireText("games/history-hunters-2/game.js", [
  "trackHunterCompletion",
  "Review Contract",
  "Open-World RPG",
  "game_complete"
]);
requireText("games/history-hunters-2/index.html", [
  "viewport-fit=cover",
  'id="pad"',
  'id="questSource"'
]);

for (const id of ["history-hunters", "archive-quest", "cold-war-invaders", "regents-practice-exam"]) {
  requireAsset(`assets/game-thumbnails/${id}.webp`, 1024);
}
requireAsset("games/cold-war-invaders/assets/cold-war-invaders-atari-sheet.png", 10000);
requireAsset("assets/archive-quest/background.png", 10000);
requireAsset("assets/history-hunters/overworld-map.png", 10000);

if (errors.length) {
  console.error(`Flagship game audit failed (${errors.length} issues):`);
  errors.forEach((error) => console.error("-", error));
  process.exit(1);
}

console.log("OK: flagship game audit passed.");
