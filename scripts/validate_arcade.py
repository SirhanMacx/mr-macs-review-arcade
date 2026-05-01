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
            course = str(q.get("course", ""))
            if "U.S. History" in course and "/us-day" not in src:
                errors.append(f"Course/stimulus mismatch for {q.get('id')}: U.S. question uses {src}")
            if "Global History" in course and "/global-day" not in src:
                errors.append(f"Course/stimulus mismatch for {q.get('id')}: Global question uses {src}")
    return errors


def _extract_js_array(text: str, name: str):
    marker = f"const {name}="
    start = text.find(marker)
    if start < 0:
        raise ValueError(f"missing {name}")
    bracket = text.find("[", start)
    if bracket < 0:
        raise ValueError(f"missing opening bracket for {name}")
    depth = 0
    for index in range(bracket, len(text)):
        if text[index] == "[":
            depth += 1
        elif text[index] == "]":
            depth -= 1
            if depth == 0:
                raw = re.sub(r"(?<=\[)\.5", "0.5", text[bracket : index + 1])
                raw = re.sub(r"(?<=,)\.5", "0.5", raw)
                return json.loads(raw)
    raise ValueError(f"unterminated {name}")


def check_regents_practice_exam() -> list[str]:
    errors: list[str] = []
    text = (ROOT / "games" / "regents-practice-exam" / "game.js").read_text(encoding="utf-8")
    required = [
        "NYSED January 2026 Global History and Geography II",
        "NYSED January 2026 United States History and Government",
        "scaffoldTitle",
        "scaffoldPrompts",
        "essayDocMinimum:3",
        "essayDocMinimum:4",
        "Part IIIA",
        "Part IIIB",
        "docGroupKey",
        "writingDocAudit",
        "duplicateWritingDocs",
        "mcqWritingOverlap",
        "missingWritingImages",
        "courseStimulusMismatches",
        "mergedWritingSources",
        "unknownWritingSources",
        "requiredDocCountsOk",
        "writingIntegrityOk",
        "skillReport",
        "nextPracticePlan",
        "weakTopicLabels",
        "Practice estimate, not official scoring",
        "Civic SAQ accuracy",
        "same six-document Civic Literacy set",
        "STIMULUS_VISUAL_FAMILY_GROUPS",
        "docStemGuardKey",
        "Random graded official exam",
        "selectedReleasedForm",
        "exact-released-form",
        "formsByCourse",
        "conversionTable",
        "regents-past-exam-catalog.json",
        "guidePositionNote",
    ]
    for needle in required:
        if needle not in text:
            errors.append(f"Regents practice exam missing required shape marker: {needle}")
    try:
        columns = _extract_js_array(text, "ESSAY_COLUMNS")
        global_chart = _extract_js_array(text, "GLOBAL_CONVERSION")
        us_chart = _extract_js_array(text, "US_CONVERSION")
    except Exception as exc:
        errors.append(f"Could not parse conversion chart constants: {exc}")
        return errors
    if columns != [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]:
        errors.append("Essay conversion columns must include 0.5-point steps from 0 to 5.")
    if len(global_chart) != 36 or any(len(row) != 11 for row in global_chart):
        errors.append("Global II conversion chart must be 36 rows by 11 essay columns.")
    if len(us_chart) != 45 or any(len(row) != 11 for row in us_chart):
        errors.append("U.S. History conversion chart must be 45 rows by 11 essay columns.")
    if global_chart and global_chart[-1][-1] != 100:
        errors.append("Global II conversion chart top cell should be 100.")
    if us_chart and us_chart[-1][-1] != 100:
        errors.append("U.S. History conversion chart top cell should be 100.")
    bank = load_json(ROOT / "data" / "regents-gauntlet-bank.json")
    required_groups = {
        "Grade 10 Global History II": 9,
        "Grade 11 U.S. History": 10,
    }
    for course, writing_needed in required_groups.items():
        groups: set[str] = set()
        for q in bank.get("questions", []):
            if q.get("course") != course:
                continue
            images = [img for img in q.get("stimulusImages") or [] if (img or {}).get("src")]
            if not images:
                continue
            src = images[0]["src"]
            match = re.search(r"regents-gauntlet-stimuli/([^/]+)/(stimulus-\d+(?:-\d+)?)", src)
            bundle = f"{match.group(1)}/{match.group(2)}" if match else re.sub(r"-\d+(\.[a-z0-9]+)$", r"\1", src, flags=re.I)
            groups.add(f"{course}|{bundle}|{_norm_text(q.get('source') or q.get('id'))}")
        if len(groups) < 28 + writing_needed:
            errors.append(
                f"{course} practice bank needs at least {28 + writing_needed} unique image-backed source groups "
                f"to keep MCQs separate from writing; found {len(groups)}."
            )
    return errors


def check_select_option_contrast() -> list[str]:
    errors: list[str] = []
    paths = [ROOT / "index.html", *sorted(ROOT.glob("games/*/styles.css")), ROOT / "games" / "boss-rush" / "index.html"]
    for path in paths:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        if "select" in text and "select option" in text and "background: #f8fbff" not in text:
            errors.append(f"{path.relative_to(ROOT)}: select options need a light background for readable dropdown menus.")
    return errors


def check_regents_practice_runtime() -> list[str]:
    result = subprocess.run(
        ["node", "scripts/audit-regents-practice.mjs"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        return []
    detail = (result.stderr or result.stdout or "runtime audit failed").strip()
    return [detail]


def check_regents_source_integrity() -> list[str]:
    result = subprocess.run(
        ["node", "scripts/validate-regents-source-integrity.mjs"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        return []
    detail = (result.stderr or result.stdout or "Regents source integrity validation failed").strip()
    return [detail]


def check_shared_source_bank() -> list[str]:
    result = subprocess.run(
        ["node", "scripts/validate-shared-source-bank.mjs"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        return []
    detail = (result.stderr or result.stdout or "shared source bank validation failed").strip()
    return [detail]


def check_archive_cipher_source_lock() -> list[str]:
    result = subprocess.run(
        ["node", "scripts/validate-archive-cipher-source-lock.mjs"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        return []
    detail = (result.stderr or result.stdout or "Archive Cipher source-lock validation failed").strip()
    return [detail]


def check_released_practice_forms() -> list[str]:
    errors: list[str] = []
    for script in ["scripts/validate-released-practice-forms.mjs", "scripts/validate-regents-past-exam-catalog.mjs"]:
        result = subprocess.run(
            ["node", script],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            errors.append((result.stderr or result.stdout or f"{script} failed").strip())
    return errors


def check_flagship_game_audit() -> list[str]:
    result = subprocess.run(
        ["node", "scripts/audit-flagship-games.mjs"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode == 0:
        return []
    detail = (result.stderr or result.stdout or "flagship game audit failed").strip()
    return [detail]


def check_index_uses_games_json() -> list[str]:
    errors: list[str] = []
    index_path = ROOT / "index.html"
    text = index_path.read_text(encoding="utf-8")
    if "const GAMES = [" in text:
        errors.append("index.html still embeds the full GAMES array; expected runtime load from games.json.")
    if "fetch(\"games.json\"" not in text and "fetch('games.json'" not in text:
        errors.append("index.html does not appear to load games.json via fetch().")
    return errors


def check_game_thumbnails() -> list[str]:
    errors: list[str] = []
    games = load_json(ROOT / "games.json")
    index_text = (ROOT / "index.html").read_text(encoding="utf-8")
    if "assets/game-thumbnails/" not in index_text:
        errors.append("index.html is not wired to the generated game thumbnail directory.")
    for game in games:
        game_id = game.get("id")
        if not game_id:
            continue
        thumb = ROOT / "assets" / "game-thumbnails" / f"{game_id}.webp"
        if not thumb.exists():
            errors.append(f"Missing game thumbnail: {thumb.relative_to(ROOT)}")
        elif thumb.stat().st_size < 1024:
            errors.append(f"Game thumbnail looks empty or corrupt: {thumb.relative_to(ROOT)}")
    return errors


def check_mastery_platform() -> list[str]:
    errors: list[str] = []
    games = load_json(ROOT / "games.json")
    by_id = {game.get("id"): game for game in games}
    required_games = {
        "mastery-path": ["Diagnostic", "Course Dashboard", "Recommended Practice"],
        "source-lab": ["Stimulus MCQ", "Source Inspection", "Regents Skills"],
        "writing-coach": ["CRQ", "Enduring Issues Essay", "Civic Literacy Essay"],
    }
    for game_id, categories in required_games.items():
        game = by_id.get(game_id)
        if not game:
            errors.append(f"Missing mastery platform game in games.json: {game_id}")
            continue
        target = ROOT / unquote(game.get("file", ""))
        if not target.exists():
            errors.append(f"Missing mastery platform file: {game_id} -> {game.get('file')}")
        category_text = " ".join(game.get("categories") or [])
        for category in categories:
            if category not in category_text:
                errors.append(f"{game_id} missing category marker: {category}")
    engine = ROOT / "assets" / "mastery-engine.js"
    if not engine.exists():
        errors.append("Missing shared mastery engine: assets/mastery-engine.js")
    else:
        text = engine.read_text(encoding="utf-8")
        for marker in ["buildDiagnostic", "sourceLabQuestions", "writingDocs", "setHints", "recordSession", "courseSummary"]:
            if marker not in text:
                errors.append(f"mastery-engine.js missing required platform function: {marker}")
    writing_text = (ROOT / "games" / "writing-coach" / "game.js").read_text(encoding="utf-8")
    for marker in ["global-eie", "us-cle", "setHints", "state.task.docs", "state.task.setHints", "doc.images.map"]:
        if marker not in writing_text:
            errors.append(f"writing-coach missing document-matching marker: {marker}")
    index_text = (ROOT / "index.html").read_text(encoding="utf-8")
    for marker in ["id=\"mastery\"", "renderMasteryModes", "assets/mastery-engine.js", "mastery-path", "source-lab", "writing-coach"]:
        if marker not in index_text:
            errors.append(f"index.html missing mastery platform marker: {marker}")
    return errors


def check_ap_practice_exam() -> list[str]:
    errors: list[str] = []
    games = load_json(ROOT / "games.json")
    by_id = {game.get("id"): game for game in games}
    game = by_id.get("ap-practice-exam")
    if not game:
        return ["Missing AP practice exam game in games.json: ap-practice-exam"]
    if game.get("file") != "games/ap-practice-exam/index.html":
        errors.append("ap-practice-exam manifest file must point to games/ap-practice-exam/index.html")
    for rel in [
        "games/ap-practice-exam/index.html",
        "games/ap-practice-exam/styles.css",
        "games/ap-practice-exam/game.js",
        "data/ap-official-practice-exams.json",
        "assets/ap-released-forms",
        "assets/game-thumbnails/ap-practice-exam.webp",
    ]:
        if not (ROOT / rel).exists():
            errors.append(f"Missing AP practice exam asset: {rel}")
    html = (ROOT / "games" / "ap-practice-exam" / "index.html").read_text(encoding="utf-8")
    js = (ROOT / "games" / "ap-practice-exam" / "game.js").read_text(encoding="utf-8")
    css = (ROOT / "games" / "ap-practice-exam" / "styles.css").read_text(encoding="utf-8")
    required_markers = [
        "Practice estimate only",
        "not an official College Board score",
        "DATA_VERSION",
        "OFFICIAL_URL",
        "Released AP Exam Practice",
        "Released AP exam",
        "Digital Question",
        "Rendered",
        "officialPdf",
        "officialPages",
        "questionPageRanges",
        "writingPages",
        "questionPageFor",
        "writingPageFor",
        "questionPagesFor",
        "writingPagesFor",
        "renderOfficialPage",
        "renderOfficialMcq",
        "answerMapHtml",
        "released-page-runner",
        "official-page-stack",
        "official-page-image",
        "officialPageImage",
        "ap-released-forms",
        "answer-map",
        "Open PDF",
        "official worksheet composite",
        "ap-official-practice-exams.json",
        "scoreWritingTask",
        "scoreComposite",
        "scoreFromRanges",
        "select option",
        "background: #f8fbff",
    ]
    combined = "\n".join([html, js, css])
    for marker in required_markers:
        if marker not in combined:
            errors.append(f"AP practice exam missing required rigor marker: {marker}")
    forbidden_markers = ["Typed AP Practice Bank", "bank::", "modeSelect", "Typed Question", "Fully Typed AP Practice"]
    for marker in forbidden_markers:
        if marker in combined:
            errors.append(f"AP practice exam should be released-PDF-only; remove marker: {marker}")
    official = load_json(ROOT / "data" / "ap-official-practice-exams.json")
    forms = official.get("forms", [])
    if len(forms) < 6:
        errors.append("Official AP practice manifest should include at least six verified public full-practice PDFs.")
    expected_forms = {
        "apush-2017-ced-practice": 55,
        "ap-world-ced-practice": 55,
        "ap-euro-ced-practice": 55,
        "ap-psych-2012-practice": 100,
        "ap-macro-2012-practice": 60,
        "ap-micro-2012-practice": 60,
    }
    by_form = {form.get("id"): form for form in forms}
    for form_id, mcq_count in expected_forms.items():
        form = by_form.get(form_id)
        if not form:
            errors.append(f"Missing official AP public practice form: {form_id}")
            continue
        pdf_url = str(form.get("pdfUrl", ""))
        if not (pdf_url.startswith("https://apcentral.collegeboard.org/") or pdf_url.startswith("https://secure-media.collegeboard.org/")):
            errors.append(f"{form_id} must point to an official College Board PDF URL.")
        if len(str(form.get("answerKey", ""))) != mcq_count:
            errors.append(f"{form_id} answer key length must match {mcq_count} MCQs.")
        if int(form.get("mcqCount") or 0) != mcq_count:
            errors.append(f"{form_id} mcqCount must be {mcq_count}.")
        if not form.get("writingTasks"):
            errors.append(f"{form_id} needs writing tasks for AP practice scoring.")
        if not form.get("scoring", {}).get("ranges"):
            errors.append(f"{form_id} needs AP score conversion ranges.")
        if not form.get("questionPageRanges"):
            errors.append(f"{form_id} needs official MCQ question page ranges for the guided runner.")
        else:
            covered: set[int] = set()
            for start, end, page in form.get("questionPageRanges", []):
                if int(page or 0) <= 0:
                    errors.append(f"{form_id} has an invalid official source page in questionPageRanges.")
                covered.update(range(int(start), int(end) + 1))
            missing = [number for number in range(1, mcq_count + 1) if number not in covered]
            if missing:
                errors.append(f"{form_id} questionPageRanges do not cover every MCQ; first missing question is {missing[0]}.")
        if not form.get("writingPages"):
            errors.append(f"{form_id} needs writing prompt/scoring page anchors for the guided runner.")
        else:
            writing_ids = {task.get("id") for task in form.get("writingTasks", [])}
            missing_pages = [task_id for task_id in writing_ids if task_id not in form.get("writingPages", {})]
            if missing_pages:
                errors.append(f"{form_id} writingPages missing anchors for: {', '.join(sorted(missing_pages))}.")
        required_pages: set[int] = set()
        ranges = form.get("questionPageRanges", [])
        writing_pages = {key: int(value) for key, value in (form.get("writingPages") or {}).items()}
        first_writing = min(writing_pages.values()) if writing_pages else None
        for index, range_values in enumerate(ranges):
            start_page = int(range_values[2])
            next_page = int(ranges[index + 1][2]) if index + 1 < len(ranges) else first_writing
            end_page = max(start_page, (next_page or start_page + 1) - 1)
            required_pages.update(range(start_page, end_page + 1))
        ordered_writing = sorted(writing_pages.items(), key=lambda item: item[1])
        for index, (_task_id, start_page) in enumerate(ordered_writing):
            next_page = ordered_writing[index + 1][1] if index + 1 < len(ordered_writing) else start_page + 1
            end_page = max(start_page, min(next_page - 1, start_page + 5))
            required_pages.update(range(start_page, end_page + 1))
        for page in sorted(required_pages):
            asset = ROOT / "assets" / "ap-released-forms" / str(form_id) / f"page-{page:03d}.webp"
            if not asset.exists():
                errors.append(f"{form_id} missing rendered official PDF page image: {asset.relative_to(ROOT)}")
    frq_pages = official.get("officialFrqPages", [])
    for course in ["AP World History: Modern", "AP European History", "AP Human Geography", "AP U.S. Government and Politics"]:
        if not any(page.get("course") == course and str(page.get("url", "")).startswith("https://apcentral.collegeboard.org/") for page in frq_pages):
            errors.append(f"Missing official AP released-FRQ page marker for {course}.")
    index_text = (ROOT / "index.html").read_text(encoding="utf-8")
    for marker in ["Practice Exams", "ap-practice-exam", "Regents + AP"]:
        if marker not in index_text:
            errors.append(f"index.html missing AP practice launch marker: {marker}")
    return errors


def _norm_text(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower().replace("&", " and ")).strip()


def check_jeopardy_boards() -> list[str]:
    errors: list[str] = []
    result = subprocess.run(
        ["node", "scripts/validate-jeopardy-boards.mjs"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "Jeopardy board hardening validation failed").strip()
        errors.append(detail)
    bad_text = re.compile(
        r"tighten the most tested|precise vocabulary|state one limitation|policy reasoning|"
        r"labor policy reference|receipts and outlays|current population survey|"
        r"sop\s*(?:\u2014|-)|economic data graph|\bconcept \d$|focus \d|"
        r"VOCABULARY Term Definition|Front-Load|CLASS DEMOGRAPHICS|key content for|"
        r"find the policy move|monetary policy source|competition policy guide|"
        r"Key term students should use|Final Content|specific cause, effect, or evidence point|"
        r"specific development from|belongs in|Final wager|Final clue for|"
        r"explain why this idea matters across the course|Correct answer:|"
        r":\s+this\s+(?:is|was|were|are|describes|explains|identifies|names|means|refers to)|"
        r"\b(?:resulting from|contained in the|during the)\.|"
        r"^(?:which|based on|according to)\b|"
        r"This (?:foundational|higher-level|challenge-level) review term belongs to|"
        r"\bbelongs to\b.*\btested in\b|anchor for|Connect it to the unit|"
        r"This content term describes|"
        r"it matters for .*? because it helps explain a larger pattern or turning point|"
        r"Exchange network that moved goods, people, technology, and ideas across regions",
        re.IGNORECASE,
    )
    bad_final_text = re.compile(
        r"Final Synthesis|at least two specific examples|evidence-based synthesis|"
        r"standards-aligned argument|Teacher judgment|score the synthesis|"
        r"instead of defining one isolated term",
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
        final_combined = " ".join(str(final.get(field, "")) for field in ("category", "clue", "answer", "aliases", "explanation"))
        if bad_text.search(final_combined):
            errors.append(f"{path.relative_to(ROOT)}: generated filler leaked into final wager {final.get('answer')!r}")
        if bad_final_text.search(final_combined) or _norm_text(final.get("category")) == "final synthesis":
            errors.append(f"{path.relative_to(ROOT)}: final wager is still an open-ended synthesis prompt")
        if _norm_text(final.get("answer")) in seen_answers:
            errors.append(f"{path.relative_to(ROOT)}: final answer repeats a board answer {final.get('answer')!r}")
        for alias in final.get("aliases") or []:
            if _norm_text(alias) in seen_answers:
                errors.append(f"{path.relative_to(ROOT)}: final alias repeats a board answer {alias!r}")
    bank_path = ROOT / "data" / "chrono-defense-bank.json"
    bank = load_json(bank_path)
    questions = bank.get("questions", [])
    summary = bank.get("summary") or {}
    actual_summary = {
        "totalQuestions": len(questions),
        "courses": len({question.get("course") for question in questions if question.get("course")}),
        "jeopardy": sum(1 for question in questions if str(question.get("type", "")).startswith("jeopardy")),
        "mcq": sum(1 for question in questions if question.get("type") == "mcq"),
    }
    for key, actual in actual_summary.items():
        if key in summary and summary.get(key) != actual:
            errors.append(f"data/chrono-defense-bank.json: summary.{key} is {summary.get(key)!r}, expected {actual!r}")
    for question in questions:
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
        ("regents source-question integrity", check_regents_source_integrity),
        ("shared source bank integrity", check_shared_source_bank),
        ("archive cipher source lock", check_archive_cipher_source_lock),
        ("regents practice exam shape", check_regents_practice_exam),
        ("released Regents practice forms", check_released_practice_forms),
        ("regents practice assembly", check_regents_practice_runtime),
        ("flagship game audit", check_flagship_game_audit),
        ("dropdown option contrast", check_select_option_contrast),
        ("index.html games load", check_index_uses_games_json),
        ("game thumbnails", check_game_thumbnails),
        ("mastery platform", check_mastery_platform),
        ("ap practice exam", check_ap_practice_exam),
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
