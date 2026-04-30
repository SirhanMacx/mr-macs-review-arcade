#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import urlopen

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "regents-past-exam-catalog.json"

COURSES = {
    "Grade 10 Global History II": {
        "label": "Global History II",
        "sourcePage": "https://www.nysedregents.org/ghg2/",
    },
    "Grade 11 U.S. History": {
        "label": "U.S. History",
        "sourcePage": "https://www.nysedregents.org/us-history-govt/home.html",
    },
}

DATE_RE = re.compile(r"^(January|June|August)\s+\d{4}$")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def link_text(link) -> str:
    return clean(" ".join(link.stripped_strings))


def classify_links(base_url: str, li) -> dict:
    exam_url = ""
    large_type_url = ""
    scoring_key_pdf = ""
    scoring_key_excel = ""
    rating_guides: list[dict] = []
    conversion_chart_pdf = ""
    conversion_chart_excel = ""
    notices: list[dict] = []

    for link in li.find_all("a"):
      href = link.get("href") or ""
      if not href or href.startswith("#"):
          continue
      url = urljoin(base_url, href)
      href_l = href.lower()
      text_l = link_text(link).lower()
      title_l = clean(link.get("title") or "").lower()
      combined = f"{href_l} {text_l} {title_l}"
      entry = {"label": link_text(link) or clean(link.get("title") or "Official document"), "url": url}

      if "translated" in combined or "essay booklet" in combined or "information booklet" in combined or "policy-level" in combined or "map to framework" in combined:
          continue
      if "important notice" in combined or "notice to teachers" in combined or "scoring clarification" in combined:
          notices.append(entry)
          continue
      if "-exam-lt" in href_l or "large type" in combined or "largetype" in combined:
          large_type_url = url
          continue
      if "-exam" in href_l and href_l.endswith(".pdf"):
          exam_url = url
          continue
      if ("-sk" in href_l or "scoring key" in combined) and href_l.endswith(".pdf"):
          scoring_key_pdf = url
          continue
      if ("-sk" in href_l or "scoring key" in combined) and href_l.endswith(".xlsx"):
          scoring_key_excel = url
          continue
      if "-rg" in href_l or "rating guide" in combined:
          if href_l.endswith(".pdf"):
              rating_guides.append(entry)
          continue
      if ("-cc" in href_l or "conversion chart" in combined) and href_l.endswith(".pdf"):
          conversion_chart_pdf = url
          continue
      if ("-cc" in href_l or "conversion chart" in combined) and href_l.endswith(".xlsx"):
          conversion_chart_excel = url
          continue

    return {
        "examUrl": exam_url,
        "largeTypeExamUrl": large_type_url,
        "scoringKeyPdfUrl": scoring_key_pdf,
        "scoringKeyExcelUrl": scoring_key_excel,
        "ratingGuideUrls": rating_guides,
        "conversionChartPdfUrl": conversion_chart_pdf,
        "conversionChartExcelUrl": conversion_chart_excel,
        "noticeUrls": notices,
    }


def scrape_course(course: str, spec: dict) -> list[dict]:
    html = urlopen(spec["sourcePage"], timeout=45).read().decode("utf-8", "ignore")
    if "listexpander" not in html:
        raise RuntimeError(f"Could not find NYSED exam list for {course}")
    matches = list(re.finditer(r"<li>\s*((?:January|June|August)\s+\d{4})\b", html, flags=re.I))
    exams = []
    for index, match in enumerate(matches):
        first_text = clean(match.group(1))
        end = matches[index + 1].start() if index + 1 < len(matches) else len(html)
        segment = html[match.start():end]
        li = BeautifulSoup(segment, "html.parser")
        links = classify_links(spec["sourcePage"], li)
        if not links["examUrl"]:
            continue
        exam = {
            "id": f"{slug(course)}-{slug(first_text)}",
            "course": course,
            "administration": first_text,
            "label": first_text,
            "mode": "exact-released-form",
            "interactive": True,
            **links,
        }
        exams.append(exam)
    return exams


def main() -> int:
    courses = {}
    for course, spec in COURSES.items():
        exams = scrape_course(course, spec)
        courses[course] = {
            "label": spec["label"],
            "sourcePage": spec["sourcePage"],
            "randomMode": "official-past-exam",
            "exams": exams,
        }
    payload = {
        "version": "20260430-past-exam-catalog",
        "generatedAt": now_iso(),
        "note": "Official NYSED past-exam catalog. Entries are imported into interactive page-image practice forms with MCQ keys, writing rubrics, and conversion charts.",
        "courses": courses,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for course, data in courses.items():
        print(f"{course}: {len(data['exams'])} official past exams")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
