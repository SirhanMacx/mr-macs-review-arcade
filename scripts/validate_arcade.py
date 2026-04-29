#!/usr/bin/env python3
from __future__ import annotations

import json
import re
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


def _norm_text(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower().replace("&", " and ")).strip()


def check_jeopardy_boards() -> list[str]:
    errors: list[str] = []
    bad_text = re.compile(
        r"tighten the most tested|precise vocabulary|state one limitation|policy reasoning|"
        r"labor policy reference|receipts and outlays|current population survey|"
        r"sop\s*(?:\u2014|-)|economic data graph|\bconcept \d$|focus \d|"
        r"VOCABULARY Term Definition|Front-Load|CLASS DEMOGRAPHICS|key content for|"
        r"find the policy move|monetary policy source|competition policy guide|"
        r"Key term students should use|Final Content|specific cause, effect, or evidence point|"
        r"This (?:foundational|higher-level|challenge-level) review term belongs to|"
        r"\bbelongs to\b.*\btested in\b|anchor for|Connect it to the unit|"
        r"This content term describes|"
        r"it matters for .*? because it helps explain a larger pattern or turning point|"
        r"Exchange network that moved goods, people, technology, and ideas across regions",
        re.IGNORECASE,
    )
    for path in sorted(ROOT.glob("games/**/*.html")):
        if not re.search(r"(Jeopardy Review|Review Game|Comprehensive Review)\.html$", path.name):
            continue
        text = path.read_text(encoding="utf-8")
        match = re.search(r"const GAME = (\{[\s\S]*?\});\n", text)
        if not match:
            continue
        try:
            game = json.loads(match.group(1))
        except json.JSONDecodeError as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid GAME JSON ({exc})")
            continue
        seen_answers: set[str] = set()
        seen_prompts: set[str] = set()
        for category in game.get("categories", []):
            for clue in category.get("clues", []):
                answer = _norm_text(clue.get("answer"))
                prompt = _norm_text(clue.get("clue"))
                if answer in seen_answers:
                    errors.append(f"{path.relative_to(ROOT)}: repeated board answer {clue.get('answer')!r}")
                if prompt in seen_prompts:
                    errors.append(f"{path.relative_to(ROOT)}: repeated board clue {clue.get('clue')!r}")
                seen_answers.add(answer)
                seen_prompts.add(prompt)
                combined = " ".join(str(clue.get(field, "")) for field in ("answer", "clue", "explanation"))
                if bad_text.search(combined):
                    errors.append(f"{path.relative_to(ROOT)}: generated filler leaked into clue {clue.get('answer')!r}")
        final = game.get("final") or {}
        final_combined = " ".join(str(final.get(field, "")) for field in ("category", "clue", "explanation"))
        if bad_text.search(final_combined):
            errors.append(f"{path.relative_to(ROOT)}: generated filler leaked into final wager {final.get('answer')!r}")
    bank_path = ROOT / "data" / "chrono-defense-bank.json"
    bank = load_json(bank_path)
    for question in bank.get("questions", []):
        if not str(question.get("type", "")).startswith("jeopardy"):
            continue
        combined = " ".join(str(question.get(field, "")) for field in ("category", "prompt", "explanation"))
        if bad_text.search(combined):
            errors.append(f"data/chrono-defense-bank.json: generated filler leaked into bank item {question.get('id')!r}")
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
        ("jeopardy board quality", check_jeopardy_boards),
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
