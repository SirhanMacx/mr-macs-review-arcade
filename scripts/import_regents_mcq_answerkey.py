#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any
from urllib.parse import unquote

import pdfplumber


@dataclass(frozen=True)
class ParsedQuestion:
    number: int
    stem: str
    choices: list[str]
    correct_label: str
    source: str
    stimulus_images: list[dict[str, str]]
    stimulus_required: bool


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


_WATERMARK_LINE_RE = re.compile(r"^[A-Z](?:\s+[A-Z])+$")
_OCR_WORD_RE = re.compile(r"\b[A-Za-z]*[a-z][A-Z][A-Za-z]*\b")
_OCR_TEXT_REPLACEMENTS = (
    (re.compile(r"Bill of RNights"), "Bill of Rights"),
    (re.compile(r"amendmenTt"), "amendment"),
    (re.compile(r"\brebombing of Tokyo\b"), "firebombing of Tokyo"),
    (re.compile(r"\bFree doms\b"), "Freedoms"),
    (re.compile(r"\bH What\b"), "What"),
    (re.compile(r"\bOn H e positive\b"), "One positive"),
    (re.compile(r"\bJune 20 16\b"), "June 2016"),
    (re.compile(r"\bAmerica O because\b"), "America because"),
    (re.compile(r"\(1896\)T\b"), "(1896)"),
    (re.compile(r"\bgov T ernment\b"), "government"),
    (re.compile(r"\bEThe\b"), "The"),
    (re.compile(r"\bE urope\b"), "Europe"),
    (re.compile(r"\bSecr D etary\b"), "Secretary"),
    (re.compile(r"\bFramework NRegents\b"), "Framework Regents"),
    (re.compile(r"\bCYivil\b"), "Civil"),
    (re.compile(r"\bTh H e\b"), "The"),
    (re.compile(r"\bWh H ich\b"), "Which"),
    (re.compile(r"\bTh H is\b"), "This"),
    (re.compile(r"\bDto\b"), "to"),
    (re.compile(r"\bTAmerican\b"), "American"),
    (re.compile(r"\both N er\b"), "other"),
    (re.compile(r"\bsame amount of R armaments\b"), "same amount of armaments"),
    (re.compile(r"\bba seball\b"), "baseball"),
    (re.compile(r"\bcivil [A-Z] rights\b"), "civil rights"),
    (re.compile(r"\bVPietnam\b"), "Vietnam"),
    (re.compile(r"\bLiterar y\b"), "Literary"),
    (re.compile(r"\bpoliticia O ns\b"), "politicians"),
    (re.compile(r"\bdemocrac N ies\b"), "democracies"),
    (re.compile(r"\bMarshall Plan N will\b"), "Marshall Plan will"),
    (re.compile(r"\benco urage\b"), "encourage"),
    (re.compile(r"\bUnited States O during\b"), "United States during"),
    (re.compile(r"\bAStates\b"), "States"),
    (re.compile(r"\bSNupreme\b"), "Supreme"),
    (re.compile(r"\bth e\b"), "the"),
    (re.compile(r"\bJ ohn\b"), "John"),
    (re.compile(r"\bPOresident\b"), "President"),
    (re.compile(r"\bTStates\b"), "States"),
    (re.compile(r"\blimitthepowerofthepresidentfrominvolving\b"), "limit the power of the president from involving"),
    (re.compile(r"\bsuspensionofhabeascorpus\(1861\),thespionage\b"), "suspension of habeas corpus (1861), the Espionage"),
    (re.compile(r"\bsufficient E quantities\b"), "sufficient quantities"),
    (re.compile(r"\bcivil right N s\b"), "civil rights"),
    (re.compile(r"\bcharacteristic A of\b"), "characteristic of"),
    (re.compile(r"\b(20\d)\s+(\d)\b"), r"\1\2"),
    (re.compile(r"\b(19\d)\s+(\d)\b"), r"\1\2"),
    (re.compile(r"\.{2,}"), "."),
)


def _clean_ocr_artifacts(text: str) -> str:
    cleaned = text or ""
    for pattern, replacement in _OCR_TEXT_REPLACEMENTS:
        cleaned = pattern.sub(replacement, cleaned)

    def clean_word(match: re.Match[str]) -> str:
        word = match.group(0)
        if re.match(r"^(?:Mc|Mac)[A-Z]", word):
            return word
        if re.match(r"^[a-z]AACP$", word):
            return "NAACP"
        return re.sub(r"([a-z])([A-Z])", r"\1", word)

    cleaned = _OCR_WORD_RE.sub(clean_word, cleaned)
    cleaned = re.sub(r"\s+([,.;:?])", r"\1", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


def _clean_line(raw: str) -> str:
    line = (raw or "").replace("\u00a0", " ").strip()
    if not line:
        return ""
    if len(line) == 1 and line.isalpha() and line.isupper():
        return ""
    if _WATERMARK_LINE_RE.match(line):
        return ""
    line = re.sub(r"^\s*(?:[A-Z]\s+)+(?=\d{1,2}\.)", "", line)
    line = re.sub(r"^\s*(?:[A-Z]\s+)+(?=\()", "", line)
    line = re.sub(r"^\s*(?:[A-Z]\s+)+(?=SOURCE:)", "", line, flags=re.IGNORECASE)
    line = re.sub(r"^\s*(?:[A-Z]\s+)+(?=✓)", "", line)
    # Strip common trailing watermark tokens (e.g., "... tea T", "... king B").
    line = re.sub(r"(?:\s+[A-Z]){1,4}$", "", line).strip()
    return _clean_ocr_artifacts(line)


def _normalize_key(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (text or "").lower())


def _guess_stimulus_required(stem: str) -> bool:
    trigger = (
        "based on",
        "reflected in",
        "shown in",
        "shown on",
        "cartoon",
        "poster",
        "map",
        "graph",
        "table",
        "photo",
        "photograph",
        "excerpt",
        "passage",
        "these",
        "this",
    )
    s = (stem or "").lower()
    if "based on" in s:
        return True
    return any(k in s for k in trigger)


def _extract_question_tops(page: pdfplumber.page.Page) -> dict[int, float]:
    tops: dict[int, float] = {}
    for word in page.extract_words() or []:
        text = (word.get("text") or "").strip()
        m = re.match(r"^(\d{1,2})\.$", text)
        if not m:
            continue
        number = int(m.group(1))
        top = float(word.get("top", 0.0))
        if number not in tops or top < tops[number]:
            tops[number] = top
    return tops


def _page_image_index(page: pdfplumber.page.Page) -> list[dict[str, Any]]:
    images = []
    for im in page.images or []:
        try:
            images.append(
                {
                    "x0": float(im["x0"]),
                    "x1": float(im["x1"]),
                    "top": float(im["top"]),
                    "bottom": float(im["bottom"]),
                    "width": float(im.get("width", im["x1"] - im["x0"])),
                    "height": float(im.get("height", im["bottom"] - im["top"])),
                }
            )
        except Exception:
            continue
    images.sort(key=lambda im: (im["top"], im["x0"]))
    return images


def _assign_images_to_questions(
    question_tops: dict[int, float],
    images: list[dict[str, Any]],
) -> dict[int, list[int]]:
    if not images or not question_tops:
        return {}
    sorted_questions = sorted(question_tops.items(), key=lambda kv: kv[1])
    assigned: dict[int, list[int]] = {qnum: [] for qnum, _ in sorted_questions}
    for image_index, im in enumerate(images, start=1):
        center = (im["top"] + im["bottom"]) / 2.0
        target_qnum = None
        for qnum, qtop in sorted_questions:
            if qtop > center:
                target_qnum = qnum
                break
        if target_qnum is None:
            continue
        assigned[target_qnum].append(image_index)
    return {q: idxs for q, idxs in assigned.items() if idxs}


def _save_stimulus_crops(
    page: pdfplumber.page.Page,
    page_number: int,
    images: list[dict[str, Any]],
    out_dir: Path,
    jpeg_quality: int,
    resolution: int,
) -> list[dict[str, str]]:
    saved: list[dict[str, str]] = []
    if not images:
        return saved
    out_dir.mkdir(parents=True, exist_ok=True)
    page_code = f"{page_number:02d}"
    manifest_path = out_dir / f"stimulus-{page_code}.json"
    manifest = []
    for idx, im in enumerate(images, start=1):
        img_code = f"{idx:02d}"
        filename = f"stimulus-{page_code}-{img_code}.jpg"
        out_path = out_dir / filename
        if not out_path.exists():
            crop = page.crop((im["x0"], im["top"], im["x1"], im["bottom"]))
            pil = crop.to_image(resolution=resolution).original.convert("RGB")
            pil.save(out_path, format="JPEG", quality=jpeg_quality, optimize=True, progressive=True)
        label = f"Source stimulus {page_number}.{idx}"
        saved.append({"src": filename, "label": label})
        manifest.append({"name": filename, "label": label, "centerRatio": 0.5})
    if not manifest_path.exists():
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return saved


def _parse_questions_from_page_text(text: str) -> list[dict[str, Any]]:
    raw_lines = (text or "").splitlines()
    lines = [ln for ln in (_clean_line(l) for l in raw_lines) if ln]
    if not lines:
        return []

    # find question starts
    starts: list[tuple[int, int]] = []
    for i, line in enumerate(lines):
        m = re.match(r"^(\d{1,2})\.", line)
        if m:
            starts.append((int(m.group(1)), i))
    if not starts:
        return []

    blocks = []
    for idx, (qnum, start_i) in enumerate(starts):
        end_i = starts[idx + 1][1] if idx + 1 < len(starts) else len(lines)
        blocks.append((qnum, lines[start_i:end_i]))
    return [{"number": qnum, "lines": block_lines} for qnum, block_lines in blocks]


def _parse_question_block(block: dict[str, Any]) -> dict[str, Any] | None:
    qnum = int(block["number"])
    lines: list[str] = block["lines"]

    source = ""
    rationale_text = ""
    for i, line in enumerate(lines):
        if re.search(r"\bSOURCE:\s*", line, flags=re.IGNORECASE):
            source = _clean_ocr_artifacts(re.sub(r"^.*?\bSOURCE:\s*", "", line, flags=re.IGNORECASE).strip())
            lines = lines[:i]
            break

    rationale_start = None
    for i, line in enumerate(lines):
        if "Rationale." in line:
            rationale_start = i
            break

    content_only = lines if rationale_start is None else lines[:rationale_start]
    rationale_only = [] if rationale_start is None else lines[rationale_start:]

    # Extract the quoted correct response from the rationale line(s)
    rationale_joined = " ".join(rationale_only)
    m = re.search(r'Rationale\.\s*[\"“](.+?)[\"”]', rationale_joined, flags=re.IGNORECASE)
    if m:
        rationale_text = _clean_ocr_artifacts(m.group(1).strip())

    content_lines = [l for l in content_only if "TEACHER COPY" not in l and not l.startswith("Exam:")]

    stem_parts: list[str] = []
    choices: dict[str, list[str]] = {"1": [], "2": [], "3": [], "4": []}
    current_choice: str | None = None
    for i, line in enumerate(content_lines):
        # optionally capture stem text that may appear on the same line as "12."
        if i == 0:
            first = line
            m0 = re.match(r"^\d{1,2}\.\s*(.+)$", first)
            if m0:
                remainder = m0.group(1).strip()
                if remainder and not _WATERMARK_LINE_RE.match(remainder):
                    stem_parts.append(remainder)
                continue
            continue

        m_choice = re.search(r"\(\s*([1-4])\s*\)\s*(.*)$", line)
        if m_choice:
            current_choice = m_choice.group(1)
            rest = (m_choice.group(2) or "").strip()
            if rest:
                choices[current_choice].append(rest)
            continue

        if current_choice is None:
            stem_parts.append(line)
        else:
            # wrapped choice line
            choices[current_choice].append(line)

    stem = _clean_ocr_artifacts(re.sub(r"\s+", " ", " ".join(stem_parts)).strip())
    choice_texts = []
    for label in ("1", "2", "3", "4"):
        text = _clean_ocr_artifacts(re.sub(r"\s+", " ", " ".join(choices[label])).strip())
        if not text:
            return None
        choice_texts.append(text)

    correct_label = ""
    if rationale_text:
        key = _normalize_key(rationale_text)
        best_idx = None
        best_ratio = 0.0
        for idx, ctext in enumerate(choice_texts, start=1):
            ratio = SequenceMatcher(None, _normalize_key(ctext), key).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_idx = idx
        if best_idx is not None and best_ratio >= 0.74:
            correct_label = str(best_idx)
    if not correct_label:
        # fallback: attempt exact match (less strict)
        for idx, ctext in enumerate(choice_texts, start=1):
            if rationale_text and rationale_text.lower() in ctext.lower():
                correct_label = str(idx)
                break
    if not correct_label:
        return None

    return {
        "number": qnum,
        "stem": stem,
        "choices": choice_texts,
        "correct": correct_label,
        "source": source,
        "correct_text": choice_texts[int(correct_label) - 1],
    }


def parse_answer_key_pdf(
    pdf_path: Path,
    stimulus_dir: Path,
    jpeg_quality: int,
    resolution: int,
) -> dict[int, dict[str, Any]]:
    parsed: dict[int, dict[str, Any]] = {}
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            text = (page.extract_text() or "").replace("\u00a0", " ")
            blocks = _parse_questions_from_page_text(text)
            if not blocks:
                continue

            question_tops = _extract_question_tops(page)
            images = _page_image_index(page)
            image_assignment = _assign_images_to_questions(question_tops, images)

            # Export images for this page once, so questions can reference them.
            saved_images = _save_stimulus_crops(
                page=page,
                page_number=page_index,
                images=images,
                out_dir=stimulus_dir,
                jpeg_quality=jpeg_quality,
                resolution=resolution,
            )

            for block in blocks:
                qnum = int(block["number"])
                parsed_block = _parse_question_block(block)
                if not parsed_block:
                    continue
                img_indices = image_assignment.get(qnum, [])
                stimulus_images = []
                for img_idx in img_indices:
                    if 1 <= img_idx <= len(saved_images):
                        stimulus_images.append(saved_images[img_idx - 1])
                parsed[qnum] = {
                    "number": qnum,
                    "stem": parsed_block["stem"],
                    "choices": parsed_block["choices"],
                    "correct": parsed_block["correct"],
                    "source": parsed_block["source"],
                    "stimulusImages": stimulus_images,
                    "stimulusRequired": bool(stimulus_images) and _guess_stimulus_required(parsed_block["stem"]),
                    "correctText": parsed_block["correct_text"],
                }
    return parsed


def load_bank(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_bank(path: Path, bank: dict[str, Any]) -> None:
    path.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Import Regents MCQ Answer Key PDFs into data/regents-gauntlet-bank.json.")
    parser.add_argument("--bank", default="data/regents-gauntlet-bank.json")
    parser.add_argument("--pdf", required=True, help="Path to the *Answer Key* PDF.")
    parser.add_argument("--course", required=True)
    parser.add_argument("--subject", required=True)
    parser.add_argument("--day", required=True, help='Bank day label, e.g. \"Day 1\"')
    parser.add_argument("--set", required=True, dest="set_name", help="Set name, e.g. \"Colonial + Constitution + Supreme Court\"")
    parser.add_argument("--id-prefix", required=True, help="e.g. us-day1")
    parser.add_argument("--stimulus-dir", required=True, help="Directory under assets/ for crops, e.g. assets/regents-gauntlet-stimuli/us-day1")
    parser.add_argument("--jpeg-quality", type=int, default=80)
    parser.add_argument("--resolution", type=int, default=144)
    args = parser.parse_args()

    bank_path = Path(args.bank)
    pdf_path = Path(args.pdf)
    stimulus_dir = Path(args.stimulus_dir)
    if not bank_path.exists():
        raise SystemExit(f"Bank not found: {bank_path}")
    if not pdf_path.exists():
        raise SystemExit(f"PDF not found: {pdf_path}")

    bank = load_bank(bank_path)
    existing_ids = {q["id"] for q in bank.get("questions", [])}

    parsed = parse_answer_key_pdf(
        pdf_path=pdf_path,
        stimulus_dir=stimulus_dir,
        jpeg_quality=max(40, min(95, args.jpeg_quality)),
        resolution=max(96, min(220, args.resolution)),
    )

    added = 0
    for qnum in sorted(parsed.keys()):
        qid = f"{args.id_prefix}-{qnum}"
        if qid in existing_ids:
            continue
        q = parsed[qnum]
        bank.setdefault("questions", []).append(
            {
                "id": qid,
                "course": args.course,
                "subject": args.subject,
                "day": args.day,
                "set": args.set_name,
                "number": str(qnum),
                "stem": q["stem"],
                "choices": [{"label": str(i), "text": text} for i, text in enumerate(q["choices"], start=1)],
                "correct": q["correct"],
                "explanation": f"Correct answer: {q['correctText']}.",
                "source": q["source"] or "Unknown source",
                "stimulusRequired": bool(q["stimulusRequired"]),
                "stimulusImages": [
                    {
                        "src": "../../" + str((stimulus_dir / img["src"]).as_posix()),
                        "label": img["label"],
                    }
                    for img in q["stimulusImages"]
                ],
                "tags": [args.set_name, args.day],
            }
        )
        added += 1

    bank["generatedAt"] = _now_iso()
    # `sourceCount` tracks distinct Regents sources (not every question id).
    sources = set()
    for q in bank.get("questions", []):
        src = (q.get("source") or "").strip()
        if not src:
            continue
        sources.add(src.split("·", 1)[0].strip())
    bank["sourceCount"] = len(sources)
    bank.setdefault("summary", {})
    bank["summary"]["totalQuestions"] = len(bank.get("questions", []))

    write_bank(bank_path, bank)
    print(f"Added {added} questions from {pdf_path.name}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
