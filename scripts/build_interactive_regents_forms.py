#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen

import fitz
import openpyxl
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "regents-past-exam-catalog.json"
OUT = ROOT / "data" / "regents-released-practice-exams.json"
ASSET_ROOT = ROOT / "assets" / "regents-released-forms"
TMP = ROOT / ".tmp" / "interactive-regents-forms"

ESSAY_COLUMNS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
COMMON = set(
    "the a an and or but if then this that these those with from into onto about above below because while "
    "where when which what who whom whose are was were been being have has had will would could should may "
    "might can cannot one two three four five six document source passage excerpt cartoon map graph chart table "
    "author shows shown based according question answer choice directions write explain identify describe".split()
)

COURSE_META = {
    "Grade 10 Global History II": {
        "profileId": "global-history-ii",
        "assetPrefix": "global",
        "label": "Global History II",
        "shortTitle": "Part II: Document-Based CRQs",
        "essayTitle": "Part III: Document-Based Enduring Issues Essay",
        "essayPrompt": "Identify and explain an enduring issue raised by this set of documents. Argue why the issue is significant and how it has endured across time. Use evidence from at least three of the five documents and outside information.",
        "essayDocMinimum": 3,
    },
    "Grade 11 U.S. History": {
        "profileId": "us-history",
        "assetPrefix": "us",
        "label": "U.S. History",
        "shortTitle": "Part II: Document-Based Short Essays",
        "scaffoldTitle": "Part IIIA: Civic Literacy Scaffold Questions",
        "essayTitle": "Part IIIB: Civic Literacy Essay",
        "essayPrompt": "Identify the constitutional or civic issue raised by the documents. Explain the historical circumstances surrounding the issue, describe efforts by people or government to address it, and discuss the extent to which those efforts were successful. Use evidence from the documents and outside information.",
        "essayDocMinimum": 4,
    },
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def numeric(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        text = value.strip()
        if re.fullmatch(r"\d+(?:\.5)?", text):
            return float(text) if "." in text else int(text)
    return None


def download(url: str, dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(url, timeout=60) as response:
        dest.write_bytes(response.read())
    return dest


def url_filename(url: str, fallback: str) -> str:
    name = Path(urlparse(url).path).name
    return name or fallback


def extract_scoring_key(path: Path) -> dict[int, str]:
    wb = openpyxl.load_workbook(path, data_only=True)
    keys: dict[int, str] = {}
    for ws in wb.worksheets:
        for row in ws.iter_rows(values_only=True):
            values = list(row)
            for index in range(len(values) - 1):
                q = numeric(values[index])
                key = numeric(values[index + 1])
                if q is None or key is None:
                    continue
                if float(q).is_integer() and 1 <= int(q) <= 28 and int(key) in {1, 2, 3, 4}:
                    keys.setdefault(int(q), str(int(key)))
    missing = [n for n in range(1, 29) if n not in keys]
    if missing:
        raise RuntimeError(f"{path.name}: missing MCQ scoring keys {missing}")
    return keys


def extract_conversion_chart(path: Path) -> dict:
    wb = openpyxl.load_workbook(path, data_only=True)
    for ws in wb.worksheets:
        header_row = None
        header_cols: list[int] = []
        headers: list[float] = []
        for row_index in range(1, ws.max_row + 1):
            nums = []
            for col_index in range(1, ws.max_column + 1):
                value = numeric(ws.cell(row_index, col_index).value)
                if value in ESSAY_COLUMNS:
                    nums.append((col_index, float(value)))
            if len(nums) >= 10 and nums[0][1] == 0 and nums[-1][1] == 5:
                header_row = row_index
                header_cols = [col for col, _ in nums[:11]]
                headers = [value for _, value in nums[:11]]
                break
        if not header_row:
            continue

        rows: dict[str, list[int]] = {}
        empty_streak = 0
        first_header_col = min(header_cols)
        for row_index in range(header_row + 1, ws.max_row + 1):
            base = None
            for col_index in range(first_header_col - 1, 0, -1):
                value = numeric(ws.cell(row_index, col_index).value)
                if value is not None and float(value).is_integer():
                    base = int(value)
                    break
            if base is None:
                if rows:
                    empty_streak += 1
                    if empty_streak >= 3:
                        break
                continue
            values = []
            for col_index in header_cols:
                value = numeric(ws.cell(row_index, col_index).value)
                values.append(None if value is None else int(value))
            if len(values) == len(headers) and all(value is not None for value in values):
                rows[str(base)] = values
                empty_streak = 0

        if rows:
            return {
                "sourceFile": path.name,
                "essayColumns": headers,
                "rows": rows,
            }
    raise RuntimeError(f"{path.name}: could not parse conversion chart")


def page_asset(pdf: fitz.Document, out_dir: Path, page_number: int, label: str) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"page-{page_number:02d}.jpg"
    if not out_path.exists():
        page = pdf[page_number - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.65, 1.65), alpha=False)
        image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        image.save(out_path, "JPEG", quality=72, optimize=True, progressive=True)
    return {
        "src": "../../" + out_path.relative_to(ROOT).as_posix(),
        "label": label,
        "officialPage": page_number,
    }


def page_texts(pdf: fitz.Document) -> list[str]:
    return [page.get_text("text") for page in pdf]


def find_page(texts: list[str], patterns: list[str], start: int = 1, end: int | None = None) -> int | None:
    end = end or len(texts)
    for page_number in range(max(1, start), min(end, len(texts)) + 1):
        text = texts[page_number - 1]
        if all(re.search(pattern, text, re.I) for pattern in patterns):
            return page_number
    return None


def has_doc_marker(text: str) -> bool:
    return bool(re.search(r"\bDocument\s+\d", text, re.I))


def doc_pages(texts: list[str], start: int | None, end: int | None, count: int) -> list[int]:
    start = start or 1
    end = end or len(texts) + 1
    candidates = [page for page in range(start, min(end, len(texts) + 1)) if has_doc_marker(texts[page - 1])]
    picked = candidates[:count]
    page = start
    while len(picked) < count and page < min(end, len(texts) + 1):
        if page not in picked:
            picked.append(page)
        page += 1
    return picked[:count]


def keywords(text: str, limit: int = 10) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z'-]{3,}", text.lower())
    counts: dict[str, int] = {}
    for word in words:
        if word in COMMON or len(word) < 5:
            continue
        counts[word] = counts.get(word, 0) + 1
    return [word for word, _ in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:limit]]


def make_doc(course: str, administration: str, section: str, doc_number: int, page_number: int, asset: dict, text: str) -> dict:
    return {
        "docNumber": doc_number,
        "source": f"{administration} {section} Document {doc_number} (official page {page_number})",
        "keywords": keywords(text),
        "stimulusImages": [asset],
    }


def question_page_map(texts: list[str], part_two_page: int | None) -> dict[int, int]:
    search_end = (part_two_page or min(len(texts), 18)) - 1
    pages = list(range(2, max(2, search_end) + 1))
    mapping: dict[int, int] = {}
    for qnum in range(1, 29):
        pattern = re.compile(rf"(?m)^\s*{qnum}\s+", re.I)
        for page_number in pages:
            if pattern.search(texts[page_number - 1]):
                mapping[qnum] = page_number
                break
        if qnum not in mapping:
            fallback_index = round((qnum - 1) * (len(pages) - 1) / 27) if len(pages) > 1 else 0
            mapping[qnum] = pages[min(fallback_index, len(pages) - 1)]
    return mapping


def build_mcq(course: str, administration: str, form_id: str, pdf: fitz.Document, texts: list[str], out_dir: Path, keys: dict[int, str], part_two_page: int | None) -> list[dict]:
    pages = question_page_map(texts, part_two_page)
    items = []
    for number in range(1, 29):
        page_number = pages[number]
        asset = page_asset(pdf, out_dir, page_number, f"{administration} official exam page {page_number}")
        items.append(
            {
                "id": f"{form_id}-mcq-{number:02d}",
                "course": course,
                "set": f"{administration} Official Released Exam",
                "day": administration,
                "number": number,
                "officialQuestionNumber": number,
                "source": f"{administration} official exam page {page_number}",
                "stem": f"Question {number} - read the official NYSED exam page image.",
                "choices": [{"label": str(choice), "text": f"Choice {choice}"} for choice in range(1, 5)],
                "correct": keys[number],
                "explanation": f"The official NYSED scoring key lists choice {keys[number]} for question {number}.",
                "stimulusRequired": True,
                "sourceIntegrity": "trusted-official-page-image",
                "stimulusImages": [asset],
                "tags": ["official released exam", administration, COURSE_META[course]["label"]],
            }
        )
    return items


def generic_global_writing(course: str, administration: str, pdf: fitz.Document, texts: list[str], out_dir: Path) -> tuple[list[dict], list[dict], dict]:
    crq1 = find_page(texts, [r"CRQ\s+Set\s+1"], start=2) or find_page(texts, [r"Part\s+II", r"SHORT-ANSWER"], start=2) or 18
    crq2 = find_page(texts, [r"CRQ\s+Set\s+2"], crq1 + 1) or crq1 + 3
    essay_start = find_page(texts, [r"ENDURING\s+ISSUES\s+ESSAY"], crq2 + 1) or find_page(texts, [r"Part\s+III"], crq2 + 1) or crq2 + 3
    planning = find_page(texts, [r"OPTIONAL\s+PLANNING\s+PAGE"], essay_start + 1) or len(texts) + 1
    crq1_pages = doc_pages(texts, crq1, crq2, 2)
    crq2_pages = doc_pages(texts, crq2, essay_start, 2)
    essay_pages = doc_pages(texts, essay_start, planning, 5)

    def docs_for(section: str, pages: list[int], start_number: int) -> list[dict]:
        docs = []
        for offset, page_number in enumerate(pages):
            number = start_number + offset
            asset = page_asset(pdf, out_dir, page_number, f"{administration} {section} official page {page_number}")
            docs.append(make_doc(course, administration, section, number, page_number, asset, texts[page_number - 1]))
        return docs

    short_tasks = [
        {
            "id": "short-1",
            "title": "CRQ Set 1",
            "points": 3,
            "docs": docs_for("CRQ Set 1", crq1_pages, 1),
            "prompts": ["Answer questions 29-31 exactly as shown on the official CRQ Set 1 pages."],
            "answerKey": ["Use the official rating guide for this administration. A supported response must answer each prompt and use the attached document evidence."],
            "modelAnswer": "A top practice response states the correct historical context, explains the sourcing skill when asked, and names a document-supported relationship using evidence from both CRQ Set 1 documents.",
        },
        {
            "id": "short-2",
            "title": "CRQ Set 2",
            "points": 4,
            "docs": docs_for("CRQ Set 2", crq2_pages, 3),
            "prompts": ["Answer questions 32-34b exactly as shown on the official CRQ Set 2 pages."],
            "answerKey": ["Use the official rating guide for this administration. Credit comes from specific context, relationship or turning-point analysis, and evidence from the attached documents."],
            "modelAnswer": "A top practice response explains the setting for each document, identifies the required relationship or turning point, and uses evidence from both CRQ Set 2 documents to explain significance.",
        },
    ]
    essay_docs = docs_for("Enduring Issues Essay", essay_pages, 1)
    essay = {
        "id": "essay",
        "title": "Part III: Document-Based Enduring Issues Essay",
        "points": 5,
        "docMinimum": 3,
        "docs": essay_docs,
        "prompt": COURSE_META[course]["essayPrompt"],
        "answerKey": "Strong essays identify one enduring issue, define it, use at least three of the five official documents, explain significance, show endurance or change over time, and add outside information.",
        "modelEssay": "A top practice essay makes a clear enduring-issue claim, develops at least three document examples with explanation, connects the issue across time or place, adds accurate outside information, and stays organized around the same issue.",
    }
    return short_tasks, [], essay


def generic_us_writing(course: str, administration: str, pdf: fitz.Document, texts: list[str], out_dir: Path) -> tuple[list[dict], list[dict], dict]:
    seq_start = find_page(texts, [r"SHORT-ESSAY\s+QUESTIONS|SHORT ESSAY QUESTIONS|SEQs"], start=2) or 17
    seq2 = find_page(texts, [r"Set\s+2"], seq_start + 1) or seq_start + 3
    civic = find_page(texts, [r"CIVIC\s+LITERACY\s+ESSAY"], seq2 + 1) or seq2 + 3
    part_b = find_page(texts, [r"Part\s+B", r"Civic\s+Literacy\s+Essay\s+Question"], civic + 1) or len(texts) + 1
    seq1_pages = doc_pages(texts, seq_start, seq2, 2)
    seq2_pages = doc_pages(texts, seq2, civic, 2)
    civic_pages = doc_pages(texts, civic, part_b, 6)

    def docs_for(section: str, pages: list[int], start_number: int) -> list[dict]:
        docs = []
        for offset, page_number in enumerate(pages):
            number = start_number + offset
            asset = page_asset(pdf, out_dir, page_number, f"{administration} {section} official page {page_number}")
            docs.append(make_doc(course, administration, section, number, page_number, asset, texts[page_number - 1]))
        return docs

    seq1_docs = docs_for("Short Essay Set 1", seq1_pages, 1)
    seq2_docs = docs_for("Short Essay Set 2", seq2_pages, 3)
    civic_docs = docs_for("Civic Literacy", civic_pages, 1)
    short_tasks = [
        {
            "id": "short-1",
            "title": "Short Essay 1",
            "points": 5,
            "docs": seq1_docs,
            "prompts": ["Write Short Essay Question 29 exactly as shown on the official Set 1 pages."],
            "answerKey": ["Use the official rating guide for this administration. A strong response explains historical context, document relationship, evidence, and outside information."],
            "modelAnswer": "A top practice short essay explains the historical context, states the required relationship between the two documents, supports it with evidence from both documents, and includes accurate outside information.",
        },
        {
            "id": "short-2",
            "title": "Short Essay 2",
            "points": 5,
            "docs": seq2_docs,
            "prompts": ["Write Short Essay Question 30 exactly as shown on the official Set 2 pages."],
            "answerKey": ["Use the official rating guide for this administration. A strong response answers the exact skill prompt shown on the page and uses both documents."],
            "modelAnswer": "A top practice short essay answers the exact Set 2 prompt, uses both official documents, explains rather than summarizes, and adds an accurate U.S. History detail beyond the documents.",
        },
    ]
    scaffold_tasks = []
    for index, doc in enumerate(civic_docs, start=1):
        scaffold_tasks.append(
            {
                "id": f"scaffold-{index}",
                "title": f"Scaffold {30 + index}",
                "points": 1,
                "docs": [doc],
                "prompt": f"Answer scaffold question {30 + index} exactly as shown on the official Civic Literacy document page.",
                "answerKey": ["One specific, accurate answer supported by this document earns the practice point."],
                "modelAnswer": "A credited practice response gives one specific fact from the document and connects it to the civic issue.",
            }
        )
    essay = {
        "id": "essay",
        "title": "Part IIIB: Civic Literacy Essay",
        "points": 5,
        "docMinimum": 4,
        "docs": civic_docs,
        "prompt": COURSE_META[course]["essayPrompt"],
        "answerKey": "Strong essays identify the civic or constitutional issue, explain historical circumstances, describe efforts to address the issue, discuss the extent of success, use at least four documents, and add outside information.",
        "modelEssay": "A top practice civic literacy essay states the civic issue, explains the historical circumstances, develops at least two efforts to address the issue, evaluates success or limits, uses at least four official documents, and includes accurate outside information.",
    }
    return short_tasks, scaffold_tasks, essay


def load_existing_rich_forms() -> dict[tuple[str, str], dict]:
    if not OUT.exists():
        return {}
    try:
        existing = json.loads(OUT.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    rich = {}
    for course, form in (existing.get("forms") or {}).items():
        administration = form.get("administration")
        if administration:
            rich[(course, administration)] = form
    return rich


def build_form(course: str, exam: dict, rich_forms: dict[tuple[str, str], dict]) -> dict:
    meta = COURSE_META[course]
    form_id = exam["id"]
    administration = exam["administration"]
    form_slug = f"{meta['assetPrefix']}-{slug(administration)}"
    out_dir = ASSET_ROOT / form_slug
    pdf_path = download(exam["examUrl"], TMP / form_slug / url_filename(exam["examUrl"], f"{form_slug}-exam.pdf"))
    key_path = download(exam["scoringKeyExcelUrl"], TMP / form_slug / url_filename(exam["scoringKeyExcelUrl"], f"{form_slug}-sk.xlsx"))
    chart_path = download(exam["conversionChartExcelUrl"], TMP / form_slug / url_filename(exam["conversionChartExcelUrl"], f"{form_slug}-cc.xlsx"))

    keys = extract_scoring_key(key_path)
    conversion = extract_conversion_chart(chart_path)
    pdf = fitz.open(pdf_path)
    texts = page_texts(pdf)
    part_two_page = find_page(texts, [r"Part\s+II", r"SHORT-ANSWER|SHORT-ESSAY|SHORT ESSAY|SEQs"], start=2)
    mcq = build_mcq(course, administration, form_id, pdf, texts, out_dir, keys, part_two_page)

    if meta["profileId"] == "global-history-ii":
        short_tasks, scaffold_tasks, essay = generic_global_writing(course, administration, pdf, texts, out_dir)
    else:
        short_tasks, scaffold_tasks, essay = generic_us_writing(course, administration, pdf, texts, out_dir)

    rich = rich_forms.get((course, administration))
    if rich and administration == "January 2026":
        short_tasks = rich.get("shortTasks") or short_tasks
        scaffold_tasks = rich.get("scaffoldTasks") or scaffold_tasks
        essay = rich.get("essay") or essay

    pdf.close()
    return {
        "id": form_id,
        "course": course,
        "profileId": meta["profileId"],
        "administration": administration,
        "mode": "exact-released-form",
        "officialExamUrl": exam["examUrl"],
        "largeTypeExamUrl": exam.get("largeTypeExamUrl", ""),
        "scoringKeyUrl": exam.get("scoringKeyPdfUrl") or exam.get("scoringKeyExcelUrl"),
        "ratingGuideUrl": (exam.get("ratingGuideUrls") or [{}])[0].get("url", ""),
        "ratingGuideUrls": exam.get("ratingGuideUrls") or [],
        "conversionChartUrl": exam.get("conversionChartPdfUrl") or exam.get("conversionChartExcelUrl"),
        "conversionChartExcelUrl": exam.get("conversionChartExcelUrl", ""),
        "conversionTable": conversion,
        "mcqNumbers": list(range(1, 29)),
        "mcq": mcq,
        "shortTasks": short_tasks,
        "scaffoldTasks": scaffold_tasks,
        "essay": essay,
    }


def main() -> int:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    rich_forms = load_existing_rich_forms()
    forms_by_course: dict[str, list[dict]] = {}
    for course, data in catalog["courses"].items():
        forms = []
        for exam in data.get("exams", []):
            if not (exam.get("examUrl") and exam.get("scoringKeyExcelUrl") and exam.get("conversionChartExcelUrl")):
                continue
            print(f"Importing {course} {exam['administration']}")
            forms.append(build_form(course, exam, rich_forms))
        forms_by_course[course] = forms

    latest_forms = {course: forms[0] for course, forms in forms_by_course.items() if forms}
    payload = {
        "version": "20260430-interactive-past-regents-bank",
        "generatedAt": now_iso(),
        "sourceNote": "Practice-only interactive released forms built from official NYSED past examinations, scoring-key Excel files, rating guides, and conversion charts. MCQ pages are exact official page images; writing is graded by a local practice rubric and labeled as an estimate.",
        "forms": latest_forms,
        "formsByCourse": forms_by_course,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for course, forms in forms_by_course.items():
        print(f"{course}: {len(forms)} interactive forms")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
