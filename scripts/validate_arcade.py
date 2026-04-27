#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def check_games_manifest() -> list[str]:
    errors: list[str] = []
    games_path = ROOT / "games.json"
    games = load_json(games_path)
    for game in games:
        raw = game.get("file", "")
        decoded = unquote(raw)
        target = ROOT / decoded
        if not target.exists():
            errors.append(f"Missing game file: {game.get('id')} -> {raw} (decoded: {decoded})")
    return errors


def check_regents_stimuli() -> list[str]:
    errors: list[str] = []
    bank_path = ROOT / "data" / "regents-gauntlet-bank.json"
    bank = load_json(bank_path)
    base = ROOT / "games" / "regents-gauntlet"
    for q in bank.get("questions", []):
        for img in q.get("stimulusImages") or []:
            src = (img or {}).get("src")
            if not src:
                continue
            # src is relative to games/regents-gauntlet
            resolved = (base / unquote(src)).resolve()
            if not resolved.exists():
                errors.append(f"Missing stimulus image for {q.get('id')}: {src} -> {resolved}")
    return errors


def check_index_uses_games_json() -> list[str]:
    errors: list[str] = []
    index_path = ROOT / "index.html"
    text = index_path.read_text(encoding="utf-8")
    if "const GAMES = [" in text:
        errors.append("index.html still embeds the full GAMES array; expected runtime load from games.json.")
    if "fetch(\"games.json\"" not in text and "fetch('games.json'" not in text:
        errors.append("index.html does not appear to load games.json via fetch().")
    return errors


def check_javascript_syntax() -> list[str]:
    errors: list[str] = []
    js_files = sorted([*ROOT.glob("games/**/*.js"), *ROOT.glob("assets/**/*.js")])
    for path in js_files:
        result = subprocess.run(
            ["node", "--check", str(path)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            message = (result.stderr or result.stdout).strip().splitlines()
            detail = message[0] if message else "syntax check failed"
            errors.append(f"{path.relative_to(ROOT)}: {detail}")
    return errors


def main() -> int:
    checks = [
        ("games.json file paths", check_games_manifest),
        ("regents stimuli assets", check_regents_stimuli),
        ("index.html games load", check_index_uses_games_json),
        ("javascript syntax", check_javascript_syntax),
    ]
    all_errors: list[str] = []
    for label, fn in checks:
        errs = fn()
        if errs:
            all_errors.append(f"== {label} ==")
            all_errors.extend(errs)
            all_errors.append("")
    if all_errors:
        print("\n".join(all_errors).rstrip())
        return 1
    print("OK: arcade validation checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
