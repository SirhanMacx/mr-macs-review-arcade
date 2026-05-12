import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const result = spawnSync("python3", ["scripts/generate_arcade_assets.py"], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});

process.exit(result.status || 0);
