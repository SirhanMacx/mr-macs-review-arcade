#!/usr/bin/env node
// Merges all data/manifest-shards/*.json files into games.json.
// Idempotent: existing entries with matching id are replaced; new ones appended.
// Always preserves entries from courses NOT in any shard (e.g. social studies).

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GAMES_JSON = join(ROOT, "games.json");
const SHARDS_DIR = join(ROOT, "data/manifest-shards");

if (!existsSync(SHARDS_DIR)) {
  console.log("No shards directory; nothing to merge.");
  process.exit(0);
}

const existing = JSON.parse(readFileSync(GAMES_JSON, "utf8"));
const byId = new Map(existing.map((e) => [e.id, e]));
let added = 0;
let replaced = 0;

for (const file of readdirSync(SHARDS_DIR)) {
  if (!file.endsWith(".json")) continue;
  const shardPath = join(SHARDS_DIR, file);
  const shard = JSON.parse(readFileSync(shardPath, "utf8"));
  for (const entry of shard) {
    if (!entry.id) continue;
    if (byId.has(entry.id)) {
      replaced += 1;
    } else {
      added += 1;
    }
    byId.set(entry.id, entry);
  }
  console.log(`merged: ${file} (${shard.length} entries)`);
}

const merged = [...byId.values()];
writeFileSync(GAMES_JSON, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`games.json updated: ${merged.length} total entries (+${added} new, ${replaced} replaced)`);
