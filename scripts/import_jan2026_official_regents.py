#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from urllib.request import urlopen
from datetime import datetime, timezone
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / "data" / "regents-gauntlet-bank.json"
US_PDF_URL = "https://www.nysedregents.org/us-history-govt/126/ushg-12026-exam.pdf"
GLOBAL_PDF_URL = "https://www.nysedregents.org/ghg2/126/glhg2-12026-exam.pdf"
US_PDF = ROOT / ".tmp/regents-2026/ushg-12026-exam.pdf"
GLOBAL_PDF = ROOT / ".tmp/regents-2026/glhg2-12026-exam.pdf"
US_DIR = ROOT / "assets/regents-gauntlet-stimuli/us-day6"
GLOBAL_DIR = ROOT / "assets/regents-gauntlet-stimuli/global-day6"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def norm_source(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def crop_source(pdf_path: Path, out_dir: Path, filename: str, page_number: int, rect: tuple[float, float, float, float]) -> str:
    if not pdf_path.exists():
        raise SystemExit(f"Missing official PDF: {pdf_path}")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    if not out_path.exists():
        doc = fitz.open(pdf_path)
        page = doc[page_number - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(2.2, 2.2), clip=fitz.Rect(*rect), alpha=False)
        pix.save(out_path)
        doc.close()
    rel = out_path.relative_to(ROOT).as_posix()
    return "../../" + rel


def choice_text(item: dict, label: str) -> str:
    index = int(label) - 1
    return item["choices"][index]


def make_question(item: dict, pdf_path: Path, out_dir: Path, prefix: str, course: str, source_label: str) -> dict:
    qnum = item["number"]
    src = crop_source(pdf_path, out_dir, f"{prefix}-q{qnum:02d}.jpg", item["page"], item["rect"])
    correct = str(item["correct"])
    return {
        "id": item["id"],
        "course": course,
        "subject": "Regents Review",
        "day": "January 2026 Official",
        "set": "January 2026 Official MCQ",
        "number": str(qnum),
        "stem": item["stem"],
        "choices": [{"label": str(i), "text": text} for i, text in enumerate(item["choices"], start=1)],
        "correct": correct,
        "explanation": "Correct answer: " + choice_text(item, correct) + ".",
        "source": f"{source_label} · Q{qnum}",
        "stimulusRequired": True,
        "stimulusImages": [{"src": src, "label": f"January 2026 official source for question {qnum}"}],
        "sourceIntegrity": "trusted-official-jan2026-import",
        "sourceIssue": "",
        "officialExam": source_label,
        "officialQuestionNumber": qnum,
        "officialPdf": US_PDF_URL if course == "Grade 11 U.S. History" else GLOBAL_PDF_URL,
        "tags": ["Jan 2026", "Official NYSED", "Regents MCQ", course],
    }


US_ITEMS = [
    {"id": "us-jan2026-q01", "number": 1, "page": 2, "rect": (88, 86, 524, 303), "stem": "Based on this excerpt, what is the author's point of view about the role of government in the Plymouth Colony?", "choices": ["Separate leaders for church and state should be elected.", "People have the right to rebel against the government.", "The power to govern belongs to the people.", "Rulers must be given absolute authority to govern."], "correct": 3},
    {"id": "us-jan2026-q02", "number": 2, "page": 2, "rect": (88, 86, 524, 303), "stem": "Which document most closely reflects the ideas about government expressed by John Robinson in this address?", "choices": ["Mayflower Compact", "Maryland Toleration Act", "Stamp Act", "Townshend Acts"], "correct": 1},
    {"id": "us-jan2026-q03", "number": 3, "page": 3, "rect": (72, 58, 548, 367), "stem": "This passage was written during the", "choices": ["debate over the adoption of the Articles of Confederation", "ratification of the United States Constitution", "nullification crisis in Virginia and Kentucky", "controversy over the War of 1812"], "correct": 2},
    {"id": "us-jan2026-q04", "number": 4, "page": 3, "rect": (72, 58, 548, 367), "stem": "Which claim about the proposed United States Constitution is being made by the author of this passage?", "choices": ["The new Constitution gave the states enough power to avoid tyranny.", "The elastic clause would give too much power to Congress.", "The system of federalism is best for the new nation.", "The two-party system would lead to rebellion in the future."], "correct": 2},
    {"id": "us-jan2026-q05", "number": 5, "page": 4, "rect": (72, 66, 548, 312), "stem": "Which statement best describes the claims made by President Andrew Jackson in this passage?", "choices": ["The United States government must obey past treaties made with Native Americans.", "White settlers must work harder to get along with Native Americans.", "Native Americans had agreed to assimilate into American society.", "The relocation of Native Americans will assist both them and white settlers."], "correct": 4},
    {"id": "us-jan2026-q06", "number": 6, "page": 4, "rect": (72, 66, 548, 312), "stem": "What was one result of President Jackson's message to Congress?", "choices": ["Trail of Tears", "annexation of Texas", "Dred Scott decision", "Grange Movement"], "correct": 1},
    {"id": "us-jan2026-q07", "number": 7, "page": 5, "rect": (98, 60, 514, 365), "stem": "This certificate supports a national commitment to what policy?", "choices": ["Monroe Doctrine", "isolationism", "Manifest Destiny", "detente"], "correct": 3},
    {"id": "us-jan2026-q08", "number": 8, "page": 5, "rect": (98, 60, 514, 365), "stem": "What area of the United States was most affected by the program described in this document?", "choices": ["the Southwest deserts", "the Great Plains", "the Hudson Valley", "the Pacific Northwest"], "correct": 2},
    {"id": "us-jan2026-q09", "number": 9, "page": 6, "rect": (76, 68, 536, 242), "stem": "Which phrase is most closely associated with the ideas expressed in this excerpt?", "choices": ["separate but equal", "clear and present danger", "all men are created equal", "necessary and proper"], "correct": 1},
    {"id": "us-jan2026-q10", "number": 10, "page": 6, "rect": (76, 68, 536, 242), "stem": "What was an effect of the Supreme Court's decision in Plessy v. Ferguson?", "choices": ["The Freedmen's Bureau was established.", "The Underground Railroad was formed.", "The practice of segregation was reinforced.", "Voting rights were enhanced by grandfather clauses."], "correct": 3},
    {"id": "us-jan2026-q11", "number": 11, "page": 6, "rect": (128, 318, 486, 590), "stem": "The purpose of this photograph was to", "choices": ["raise public awareness for conditions in the tenements", "support unrestricted immigration", "expose the unsafe working conditions in factories", "promote the use of child labor"], "correct": 1},
    {"id": "us-jan2026-q12", "number": 12, "page": 6, "rect": (128, 318, 486, 590), "stem": "Individuals who were influenced by the work of Jacob Riis would most likely agree that", "choices": ["federal income taxes should be eliminated", "monopolistic business practices should be encouraged", "labor unions should be banned", "social and economic reforms should be addressed by the government"], "correct": 4},
    {"id": "us-jan2026-q13", "number": 13, "page": 7, "rect": (30, 76, 574, 320), "stem": "Photographs such as these were often published to", "choices": ["increase newspaper sales", "discourage investigative journalists", "support restrictions on the freedom of the press", "pressure reporters to reveal their sources"], "correct": 1},
    {"id": "us-jan2026-q14", "number": 14, "page": 7, "rect": (30, 76, 574, 320), "stem": "What was one outcome of the destruction of the USS Maine?", "choices": ["Spanish officials responsible for the destruction were put on trial.", "Spain strengthened its control over Cuba.", "Public support for a declaration of war against Spain increased.", "Spain paid to rebuild the ship and compensate the victims."], "correct": 3},
    {"id": "us-jan2026-q15", "number": 15, "page": 8, "rect": (72, 66, 548, 344), "stem": "Which constitutional provision supports President Theodore Roosevelt's view regarding large corporations?", "choices": ["reserved powers of the states", "presidential veto", "eminent domain", "congressional power to regulate interstate commerce"], "correct": 4},
    {"id": "us-jan2026-q16", "number": 16, "page": 8, "rect": (72, 66, 548, 344), "stem": "Which United States economic policy did President Roosevelt's message challenge?", "choices": ["mercantilism", "laissez-faire", "protectionism", "supply-side"], "correct": 2},
    {"id": "us-jan2026-q17", "number": 17, "page": 9, "rect": (72, 66, 548, 337), "stem": "In this address, why does President Woodrow Wilson conclude that neutrality is no longer a practical United States policy?", "choices": ["The German government has invaded United States territory.", "United States ships and citizens are being attacked by German submarines.", "The Allies have committed several acts of war.", "Germany broke a series of peace treaties."], "correct": 2},
    {"id": "us-jan2026-q18", "number": 18, "page": 9, "rect": (72, 66, 548, 337), "stem": "How did Congress respond to President Wilson's 1917 address?", "choices": ["They sent negotiators to meet with representatives.", "They voted to declare war against Germany.", "They placed an embargo on all goods shipped to and from Germany.", "They asked the League of Nations to stop Germany's use of submarine warfare."], "correct": 2},
    {"id": "us-jan2026-q19", "number": 19, "page": 10, "rect": (146, 62, 466, 516), "stem": "The purpose of this 1936 poster was to encourage Americans to", "choices": ["sign up for government jobs", "receive low-cost medical insurance", "enroll in a national retirement system", "exercise their right to vote in national elections"], "correct": 3},
    {"id": "us-jan2026-q20", "number": 20, "page": 11, "rect": (72, 58, 548, 354), "stem": "The purpose of the Nuremberg Trials referred to in this passage was to", "choices": ["force Germany to pay war reparations", "punish Germany for the blitzkrieg military campaign through Europe", "warn the German people about the Nazi party", "hold German leaders accountable for crimes against humanity"], "correct": 4},
    {"id": "us-jan2026-q21", "number": 21, "page": 11, "rect": (106, 366, 516, 612), "stem": "What was the United States response to the situation shown on this map?", "choices": ["providing financial aid to Western European nations", "immediate military action against the Soviet Union", "a call for the United Nations to send forces to Eastern Europe", "withdrawal of financial support for the North Atlantic Treaty Organization (NATO)"], "correct": 1},
    {"id": "us-jan2026-q22", "number": 22, "page": 12, "rect": (72, 60, 548, 514), "stem": "A historian would find these excerpts useful for studying the", "choices": ["impact of the Red Scare on civil liberties", "opposition to New Deal reforms", "debates over international affairs", "concerns over executive cabinet appointments"], "correct": 1},
    {"id": "us-jan2026-q23", "number": 23, "page": 13, "rect": (88, 62, 526, 360), "stem": "This cartoonist is criticizing President Dwight D. Eisenhower for failing to", "choices": ["provide government support for public housing", "promote equality for African Americans", "address natural disasters in the South", "enforce strict public safety measures"], "correct": 2},
    {"id": "us-jan2026-q24", "number": 24, "page": 13, "rect": (88, 62, 526, 360), "stem": "In 1957, President Eisenhower dealt with a civil rights crisis in Little Rock, Arkansas, by sending troops to", "choices": ["enforce a Supreme Court decision on school integration", "protect freedom riders on interstate buses", "arrest leaders of the Ku Klux Klan", "stop the violence during voter registration drives"], "correct": 1},
    {"id": "us-jan2026-q25", "number": 25, "page": 14, "rect": (72, 66, 548, 328), "stem": "What was one outcome associated with the Watergate affair?", "choices": ["The Vietnam War continued to expand.", "Trade with China expanded rapidly.", "Support for immigration reform increased.", "President Nixon eventually resigned from the presidency."], "correct": 4},
    {"id": "us-jan2026-q26", "number": 26, "page": 15, "rect": (106, 58, 536, 510), "stem": "Which statement is best supported by the idea expressed in this cartoon?", "choices": ["War powers are divided equally between the executive and legislative branches.", "The legislative branch has refused to exercise its war powers.", "The war powers of the executive branch have expanded.", "The war powers of the executive branch are often checked by the judicial branch."], "correct": 3},
    {"id": "us-jan2026-q27", "number": 27, "page": 16, "rect": (96, 58, 518, 360), "stem": "Which problem is represented in this cartoon?", "choices": ["Americans were confused by the wording of the new law.", "The Patriot Act did not apply to enough people in the United States.", "The Patriot Act, while keeping the nation safe, would violate the rights of individuals.", "Individuals were concerned that the Patriot Act did not make the nation safe enough."], "correct": 3},
    {"id": "us-jan2026-q28", "number": 28, "page": 16, "rect": (96, 58, 518, 360), "stem": "Which event most directly led to the passage of the Patriot Act?", "choices": ["Iraq's invasion of Kuwait", "end of the Cold War", "Soviet launching of Sputnik", "terrorist attacks on the United States on September 11, 2001"], "correct": 4},
]


GLOBAL_MISSING_ITEMS = [
    {"id": "global-jan2026-q03", "number": 3, "page": 2, "rect": (66, 340, 548, 548), "stem": "Which statement best describes this author's point of view?", "choices": ["The king holds ultimate power.", "Citizens only vote on the laws with which they agree.", "There are no limits on the power of the state.", "Individual power is limited by the majority."], "correct": 4},
    {"id": "global-jan2026-q04", "number": 4, "page": 3, "rect": (92, 70, 514, 374), "stem": "Which claim is best supported by this cartoon?", "choices": ["The people of France were tolerant of different religions.", "France had entered a radical period of the revolution.", "The ideas and values of the Enlightenment were upheld in France.", "France had created a limited constitutional monarchy."], "correct": 2},
    {"id": "global-jan2026-q07", "number": 7, "page": 4, "rect": (66, 270, 548, 568), "stem": "Which action was a result of the situation described in this passage?", "choices": ["Britain initiated new policies that supported food aid programs for the Irish.", "Efforts to regulate food prices resulted in an improved standard of living in Ireland.", "The Irish began to emigrate overseas in order to escape starvation.", "British citizens emigrated to Ireland to regulate the export of Irish-grown grains."], "correct": 3},
    {"id": "global-jan2026-q09", "number": 9, "page": 5, "rect": (86, 58, 526, 322), "stem": "What led to the situation depicted in this cartoon?", "choices": ["the establishment of labor unions", "the decrease of maritime trade", "prolonged warfare and civil strife", "industrialization and urbanization"], "correct": 4},
    {"id": "global-jan2026-q10", "number": 10, "page": 5, "rect": (86, 58, 526, 322), "stem": "How did the British government attempt to improve the situation depicted in this cartoon?", "choices": ["It began efforts to improve sanitation.", "It recommended a return to agrarian society.", "It evacuated the land around the river.", "It built factories along the river bank."], "correct": 1},
    {"id": "global-jan2026-q11", "number": 11, "page": 6, "rect": (66, 70, 548, 360), "stem": "Which claim is best supported by this passage?", "choices": ["Great Britain and India became equal trading partners.", "Robert Clive was a central figure in expanding British influence in India.", "The Mughal emperor successfully controlled most profitable provinces.", "The East India Company became a trading organization run by the Mughals."], "correct": 2},
    {"id": "global-jan2026-q12", "number": 12, "page": 6, "rect": (66, 70, 548, 360), "stem": "The appointment of the English East India Company as revenue collector can be considered a turning point in Indian history because it", "choices": ["created an Indian National Congress", "led to a long period of British dominance in this region", "guaranteed the independence of Indian provinces", "immediately transformed the provinces of Bihar and Bengal into wealthy urban centers"], "correct": 2},
    {"id": "global-jan2026-q13", "number": 13, "page": 7, "rect": (66, 70, 548, 328), "stem": "This passage can best be used to understand", "choices": ["how the Nazi party indoctrinated German children", "why Nazi Germany invaded neighboring countries", "the purpose of Nazi censorship laws in Germany", "the steps the Nazi party took to improve the German economy"], "correct": 1},
    {"id": "global-jan2026-q15", "number": 15, "page": 9, "rect": (86, 58, 526, 380), "stem": "This cartoon can be used to demonstrate the", "choices": ["threat posed by Japan to other territories of Asia", "military technologies Japan possessed", "geographic barriers that protected China from foreign influence", "alliances that were formed in East Asia"], "correct": 1},
    {"id": "global-jan2026-q22", "number": 22, "page": 13, "rect": (66, 70, 548, 392), "stem": "Which statement best describes this author's point of view?", "choices": ["Democracy will lead to fewer rights.", "Tribal distinctions encourage democracy.", "Voting is an important process in European colonization.", "Achieving the right to vote is the first step in developing a democracy."], "correct": 4},
    {"id": "global-jan2026-q28", "number": 28, "page": 16, "rect": (66, 58, 548, 426), "stem": "Which response is being taken to address the problem discussed in this article?", "choices": ["utilizing international cooperation", "developing new technologies to meet local needs", "relying on traditional methods of assessing the problem", "increasing access to medication"], "correct": 2},
]


def update_summary(bank: dict) -> None:
    questions = bank.get("questions", [])
    sources = set()
    quarantined = 0
    missing = 0
    duplicate = 0
    for q in questions:
        source = (q.get("source") or "").strip()
        if source:
            sources.add(source.split("·", 1)[0].strip())
        integrity = str(q.get("sourceIntegrity") or "")
        if integrity.startswith("quarantined"):
            quarantined += 1
            if "missing" in integrity:
                missing += 1
            if "duplicate" in integrity:
                duplicate += 1
    bank["generatedAt"] = now_iso()
    bank["sourceCount"] = len(sources)
    bank.setdefault("summary", {})
    bank["summary"]["totalQuestions"] = len(questions)
    bank["summary"]["quarantinedMissingStimulusQuestions"] = missing
    bank["summary"]["quarantinedStimulusQuestions"] = duplicate
    bank["summary"]["totalQuarantinedSourceQuestions"] = quarantined


def upsert(bank: dict, questions: list[dict]) -> int:
    by_id = {q.get("id"): index for index, q in enumerate(bank.setdefault("questions", []))}
    added = 0
    for q in questions:
        if q["id"] in by_id:
            bank["questions"][by_id[q["id"]]] = q
        else:
            bank["questions"].append(q)
            added += 1
    return added


def ensure_pdf(url: str, path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading official NYSED PDF: {url}")
    with urlopen(url, timeout=30) as response:
        path.write_bytes(response.read())


def main() -> int:
    ensure_pdf(GLOBAL_PDF_URL, GLOBAL_PDF)
    ensure_pdf(US_PDF_URL, US_PDF)
    bank = json.loads(BANK_PATH.read_text(encoding="utf-8"))
    existing_global_jan2026 = {
        int(match.group(1))
        for q in bank.get("questions", [])
        if q.get("course") == "Grade 10 Global History II"
        for match in [re.search(r"Jan(?:uary)? 2026.*?Q(\d{1,2})", q.get("source") or "", flags=re.I)]
        if match and not str(q.get("sourceIntegrity") or "").startswith("quarantined")
    }
    global_questions = [
        make_question(item, GLOBAL_PDF, GLOBAL_DIR, item["id"], "Grade 10 Global History II", "Jan 2026 NYSED Regents")
        for item in GLOBAL_MISSING_ITEMS
        if item["number"] not in existing_global_jan2026
    ]
    us_questions = [
        make_question(item, US_PDF, US_DIR, item["id"], "Grade 11 U.S. History", "Jan 2026 NYSED Framework Regents")
        for item in US_ITEMS
    ]
    added = upsert(bank, global_questions + us_questions)
    update_summary(bank)
    BANK_PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported or refreshed {len(global_questions) + len(us_questions)} January 2026 official questions; added {added}.")
    print(f"Global missing official questions added: {[q['officialQuestionNumber'] for q in global_questions]}")
    print("U.S. official questions covered: 1-28")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
