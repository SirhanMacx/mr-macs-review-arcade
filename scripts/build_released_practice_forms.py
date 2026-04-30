#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen

import fitz

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "regents-released-practice-exams.json"
ASSET_ROOT = ROOT / "assets" / "regents-released-forms"
TMP = ROOT / ".tmp" / "regents-2026"

PDFS = {
    "global": {
        "url": "https://www.nysedregents.org/ghg2/126/glhg2-12026-exam.pdf",
        "path": TMP / "glhg2-12026-exam.pdf",
    },
    "us": {
        "url": "https://www.nysedregents.org/us-history-govt/126/ushg-12026-exam.pdf",
        "path": TMP / "ushg-12026-exam.pdf",
    },
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def ensure_pdf(kind: str) -> Path:
    spec = PDFS[kind]
    path = spec["path"]
    if path.exists():
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(spec["url"], timeout=45) as response:
        path.write_bytes(response.read())
    return path


def page_asset(kind: str, slug: str, page_number: int, label: str) -> dict:
    pdf = ensure_pdf(kind)
    out_dir = ASSET_ROOT / ("global-jan2026" if kind == "global" else "us-jan2026")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.jpg"
    if not out_path.exists():
        doc = fitz.open(pdf)
        page = doc[page_number - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.85, 1.85), clip=page.rect, alpha=False)
        pix.save(out_path)
        doc.close()
    return {
        "src": "../../" + out_path.relative_to(ROOT).as_posix(),
        "label": label,
        "officialPage": page_number,
    }


def doc(kind: str, number: int, slug: str, page: int, source: str, keywords: list[str]) -> dict:
    return {
        "docNumber": number,
        "source": source,
        "keywords": keywords,
        "stimulusImages": [page_asset(kind, slug, page, f"January 2026 released exam document {number}")],
    }


GLOBAL_CRQ_1 = [
    doc("global", 1, "global-crq-set1-doc1", 18, "Jan 2026 Global II CRQ Set 1 Document 1", ["Stalin", "collective farms", "collectivization", "Ukraine", "kulak", "Soviet Union"]),
    doc("global", 2, "global-crq-set1-doc2", 19, "Jan 2026 Global II CRQ Set 1 Document 2", ["Ukrainian Famine", "Holodomor", "testimony", "survivor", "Congress", "Soviet"]),
]
GLOBAL_CRQ_2 = [
    doc("global", 3, "global-crq-set2-doc1", 21, "Jan 2026 Global II CRQ Set 2 Document 1", ["World War I", "Europe", "borders", "empires", "Treaty of Versailles", "geography"]),
    doc("global", 4, "global-crq-set2-doc2", 22, "Jan 2026 Global II CRQ Set 2 Document 2", ["Wilson", "Fourteen Points", "self-determination", "autonomy", "Europe", "peace"]),
]
GLOBAL_ESSAY_DOCS = [
    doc("global", 1, "global-eie-doc1", 25, "Jan 2026 Global II Enduring Issues Document 1", ["Haiti", "Saint Domingue", "slavery", "inequality", "colonialism"]),
    doc("global", 2, "global-eie-doc2", 26, "Jan 2026 Global II Enduring Issues Document 2", ["Amritsar", "India", "imperialism", "violence", "British Empire"]),
    doc("global", 3, "global-eie-doc3", 27, "Jan 2026 Global II Enduring Issues Document 3", ["Khmer Rouge", "Cambodia", "human rights", "forced labor", "genocide"]),
    doc("global", 4, "global-eie-doc4", 28, "Jan 2026 Global II Enduring Issues Document 4", ["apartheid", "South Africa", "pass laws", "racism", "ANC"]),
    doc("global", 5, "global-eie-doc5", 29, "Jan 2026 Global II Enduring Issues Document 5", ["Tiananmen Square", "China", "censorship", "protest", "human rights"]),
]

US_SEQ_1 = [
    doc("us", 1, "us-seq-set1-doc1", 18, "Jan 2026 U.S. History Short Essay Set 1 Document 1", ["Great Depression", "unemployment", "bank failures", "income", "spending"]),
    doc("us", 2, "us-seq-set1-doc2", 19, "Jan 2026 U.S. History Short Essay Set 1 Document 2", ["Franklin Roosevelt", "First Inaugural", "New Deal", "banking", "unemployment"]),
]
US_SEQ_2 = [
    doc("us", 3, "us-seq-set2-doc1", 22, "Jan 2026 U.S. History Short Essay Set 2 Document 1", ["Erie Canal", "commerce", "westward expansion", "market", "transportation"]),
    doc("us", 4, "us-seq-set2-doc2", 23, "Jan 2026 U.S. History Short Essay Set 2 Document 2", ["Great Lakes", "shipping", "manufacturing", "coal", "iron ore", "grain"]),
]
US_CIVIC_DOCS = [
    doc("us", 1, "us-civic-doc1", 25, "Jan 2026 U.S. History Civic Literacy Document 1", ["temperance", "prohibition", "drunkenness", "social reform", "Maine"]),
    doc("us", 2, "us-civic-doc2", 26, "Jan 2026 U.S. History Civic Literacy Document 2", ["Anti-Saloon League", "poster", "election", "prohibition", "1919"]),
    doc("us", 3, "us-civic-doc3", 27, "Jan 2026 U.S. History Civic Literacy Document 3", ["Hoover", "Five and Ten Law", "enforcement", "repeal", "18th Amendment"]),
    doc("us", 4, "us-civic-doc4", 28, "Jan 2026 U.S. History Civic Literacy Document 4", ["WONPR", "Pauline Sabin", "women voters", "repeal", "political campaign"]),
    doc("us", 5, "us-civic-doc5", 29, "Jan 2026 U.S. History Civic Literacy Document 5", ["Prohibition", "repeal", "moral reform", "government regulation", "failure"]),
    doc("us", 6, "us-civic-doc6", 30, "Jan 2026 U.S. History Civic Literacy Document 6", ["Franklin Roosevelt", "repeal", "saloons", "21st Amendment", "impact"]),
]


FORMS = {
    "Grade 10 Global History II": {
        "course": "Grade 10 Global History II",
        "profileId": "global-history-ii",
        "administration": "January 2026",
        "mode": "exact-released-form",
        "officialExamUrl": "https://www.nysedregents.org/ghg2/126/glhg2-12026-exam.pdf",
        "scoringKeyUrl": "https://www.nysedregents.org/ghg2/126/glhg2-12026-sk.pdf",
        "ratingGuideUrl": "https://www.nysedregents.org/ghg2/126/glhg2-12026-rg.pdf",
        "conversionChartUrl": "https://www.nysedregents.org/ghg2/126/glhg2-12026-cc.pdf",
        "mcqNumbers": list(range(1, 29)),
        "shortTasks": [
            {
                "id": "short-1",
                "title": "CRQ Set 1",
                "points": 3,
                "docs": GLOBAL_CRQ_1,
                "prompts": [
                    "29. Explain the historical circumstances that led to the creation of collective farms in the Soviet Union in the late 1920s.",
                    "30. Based on Document 2, explain how the intended audience affects what Tatiana Pawlichka includes in her testimony.",
                    "31. Identify and explain a cause-and-effect relationship between the events or ideas found in Documents 1 and 2. Use evidence from both documents.",
                ],
                "answerKey": [
                    "Stalin consolidated power, pursued industrialization through the Five-Year Plans, and used collectivization to end private farming and control agricultural production.",
                    "Because she was testifying to a U.S. commission studying the Ukrainian famine, she includes vivid details of Soviet seizure of grain, starvation, arrests, and death to show Soviet responsibility and win public attention.",
                    "Forced collectivization and dekulakization caused the famine and suffering described by Pawlichka; Document 1 explains the policy and Document 2 shows the human results.",
                ],
                "modelAnswer": "Stalin's rise and the Soviet push to industrialize led the government to force peasants into collective farms and end private landholding. In Document 2, Pawlichka speaks to a U.S. commission, so she emphasizes concrete memories of grain seizures, starvation, arrests, and death to show the Soviet role in the famine. A clear cause-and-effect relationship is that Stalin's collectivization policy in Document 1 caused the hunger and suffering described in Document 2.",
            },
            {
                "id": "short-2",
                "title": "CRQ Set 2",
                "points": 4,
                "docs": GLOBAL_CRQ_2,
                "prompts": [
                    "32. Explain the geographic context for the shift in borders between the 1914 map and the 1923 map.",
                    "33. Based on Document 2, explain President Wilson's point of view about what should happen in Europe.",
                    "34a. Identify a turning point directly associated with the historical developments found in Documents 1 and 2.",
                    "34b. Explain how that turning point created significant change, using evidence from both documents.",
                ],
                "answerKey": [
                    "World War I and the peace settlements broke up or weakened empires and redrew borders in Europe and the Middle East.",
                    "Wilson supported self-determination, autonomy for national groups, fair treatment, and a peace settlement meant to prevent future wars.",
                    "World War I and the Treaty of Versailles/Paris Peace Conference are valid turning points.",
                    "The war and peace settlement created new borders and countries, weakened empires, and connected to Wilson's ideas about autonomy and national self-determination.",
                ],
                "modelAnswer": "World War I changed the geography of Europe because empires such as Austria-Hungary, Russia, Germany, and the Ottoman Empire lost territory or collapsed. Wilson's point of view was that peace should be based on justice and self-determination, with national groups given autonomy. A major turning point was World War I and the peace settlement that followed. It created significant change by redrawing borders on the map and by making Wilson's ideas about autonomy and independent development central to the postwar debate.",
            },
        ],
        "essay": {
            "id": "essay",
            "title": "Part III: Document-Based Enduring Issues Essay",
            "points": 5,
            "docMinimum": 3,
            "docs": GLOBAL_ESSAY_DOCS,
            "prompt": "Identify and explain an enduring issue raised by this set of documents. Argue why the issue is significant and how it has endured across time. Use evidence from at least three of the five documents and outside information.",
            "answerKey": "Strong essays can argue enduring issues such as human rights violations, inequality, abuse of power, oppression, imperialism, censorship, or resistance. They must define the issue, use at least three documents, explain significance, show endurance or change over time, and include accurate outside information.",
            "modelEssay": "One enduring issue shown in the documents is human rights violations caused by unequal or abusive power. This issue is significant because governments and empires can deny people basic safety, freedom, and dignity, and it has endured in many regions and time periods. In Saint Domingue, enslaved people made up the overwhelming majority of the population, showing a colonial society built on racial and economic inequality. In India, the Amritsar massacre showed British imperial power being used violently against unarmed protesters, helping fuel resistance to imperial rule. In Cambodia, the Khmer Rouge forced people into labor camps, banned normal parts of life, and caused starvation and terror. South Africa's pass laws also violated rights by controlling where Black South Africans could live, work, and attend school. These examples show that human rights violations are not limited to one place or century. Outside the documents, the Holocaust under Nazi Germany is another example of a government using state power to persecute and murder targeted groups. The issue has endured because powerful states and groups often try to control populations, but people also resist through protest, revolution, international pressure, and demands for justice.",
        },
    },
    "Grade 11 U.S. History": {
        "course": "Grade 11 U.S. History",
        "profileId": "us-history",
        "administration": "January 2026",
        "mode": "exact-released-form",
        "officialExamUrl": "https://www.nysedregents.org/us-history-govt/126/ushg-12026-exam.pdf",
        "scoringKeyUrl": "https://www.nysedregents.org/us-history-govt/126/ushg-12026-sk.pdf",
        "ratingGuideUrl": "https://www.nysedregents.org/us-history-govt/126/ushg-12026-rg.pdf",
        "conversionChartUrl": "https://www.nysedregents.org/us-history-govt/126/ushg-12026-cc.pdf",
        "mcqNumbers": list(range(1, 29)),
        "shortTasks": [
            {
                "id": "short-1",
                "title": "Short Essay 1",
                "points": 5,
                "docs": US_SEQ_1,
                "prompts": [
                    "Describe the historical context surrounding Documents 1 and 2.",
                    "Identify and explain the relationship between the events or ideas found in these documents.",
                ],
                "answerKey": [
                    "The Great Depression caused unemployment, bank failures, falling income, and economic insecurity.",
                    "The crisis shown in Document 1 helps explain Roosevelt's call in Document 2 for federal action, banking supervision, and putting people to work.",
                ],
                "modelAnswer": "The historical context is the Great Depression. Document 1 shows falling income and consumer spending, rising unemployment, and bank failures between 1929 and 1933. Document 2 is Franklin Roosevelt's First Inaugural Address, delivered as the country faced these problems. The relationship is cause and effect: the economic collapse helped cause Roosevelt to call for action such as putting people to work, supervising banks, and ending reckless speculation.",
            },
            {
                "id": "short-2",
                "title": "Short Essay 2",
                "points": 5,
                "docs": US_SEQ_2,
                "prompts": [
                    "Describe the historical context surrounding Documents 1 and 2.",
                    "Analyze Document 1 and explain how audience, purpose, bias, or point of view affects its use as reliable evidence.",
                ],
                "answerKey": [
                    "Transportation improvements such as canals and Great Lakes shipping connected western resources and farms to eastern markets and helped national economic growth.",
                    "Document 1 is useful because a Treasury secretary reported to Congress about the economy, but its purpose may emphasize the canal's benefits and understate costs or negative effects.",
                ],
                "modelAnswer": "The historical context is the growth of transportation networks and national markets during the 1800s. The Erie Canal and Great Lakes shipping linked western farms, grain, iron ore, coal, and manufacturing centers to eastern markets. Document 1 is useful because James Guthrie was a Treasury secretary reporting to Congress, so he had reason to discuss the canal's economic impact seriously. However, his purpose and point of view may lead him to stress the canal's benefits for commerce and settlement more than costs, conflicts, or limits.",
            },
        ],
        "scaffoldTasks": [
            {"id": "scaffold-1", "title": "Scaffold 31", "points": 1, "docs": [US_CIVIC_DOCS[0]], "prompt": "According to L. Ames Brown, what is one historical circumstance surrounding the issue of Prohibition?", "modelAnswer": "Heavy liquor use and widespread drunkenness created social problems, including crime and poverty, that helped fuel support for Prohibition."},
            {"id": "scaffold-2", "title": "Scaffold 32", "points": 1, "docs": [US_CIVIC_DOCS[1]], "prompt": "According to this poster, what is one historical circumstance surrounding the issue of Prohibition?", "modelAnswer": "The Anti-Saloon League connected Prohibition to elections and urged voters to support candidates who would fight saloons and alcohol."},
            {"id": "scaffold-3", "title": "Scaffold 33", "points": 1, "docs": [US_CIVIC_DOCS[2]], "prompt": "Based on this document, what was one effort to address the issue of Prohibition?", "modelAnswer": "The government increased enforcement, including the Five and Ten Law, more jail sentences, fines, padlocking, and confiscations."},
            {"id": "scaffold-4", "title": "Scaffold 34", "points": 1, "docs": [US_CIVIC_DOCS[3]], "prompt": "Based on this document, what was one effort to address the issue of Prohibition?", "modelAnswer": "The Women's Organization for National Prohibition Reform organized speeches, rallies, door-to-door recruiting, radio messages, lobbying, and publicity events to support repeal."},
            {"id": "scaffold-5", "title": "Scaffold 35", "points": 1, "docs": [US_CIVIC_DOCS[4]], "prompt": "According to Michael A. Lerner, what has been one impact of the efforts to address Prohibition?", "modelAnswer": "Prohibition failed to change behavior or eliminate alcohol abuse and exposed limits of using federal law to impose one moral standard."},
            {"id": "scaffold-6", "title": "Scaffold 36", "points": 1, "docs": [US_CIVIC_DOCS[5]], "prompt": "Based on this document, what is one impact of the efforts to address Prohibition?", "modelAnswer": "Repeal ended national Prohibition, but Roosevelt still wanted limits on saloons, bars, and taverns."},
        ],
        "essay": {
            "id": "essay",
            "title": "Part IIIB: Civic Literacy Essay",
            "points": 5,
            "docMinimum": 4,
            "docs": US_CIVIC_DOCS,
            "prompt": "Using the documents and your knowledge of U.S. History, write an essay about Prohibition. Describe the historical circumstances, explain at least two efforts to address the issue, and discuss the impact of those efforts on the United States or American society. Use evidence from at least four documents and outside information.",
            "answerKey": "Strong essays identify Prohibition as a civic issue over the government's power to regulate alcohol and public morality. They explain historical circumstances, at least two efforts such as the temperance movement, the Eighteenth Amendment, enforcement, repeal activism, and the Twenty-first Amendment, and discuss impact with at least four documents plus outside information.",
            "modelEssay": "The constitutional and civic issue of Prohibition centered on whether government should use law to ban alcohol in order to improve society. The movement grew from temperance reform and concern over drunkenness, poverty, crime, and family problems. Document 1 shows reformers arguing that alcohol consumption caused serious social consequences. Document 2 shows the Anti-Saloon League using political pressure to elect officials who would fight saloons. One major effort was the Eighteenth Amendment and federal enforcement. Document 3 shows Hoover strengthening enforcement with felony penalties, jail sentences, fines, and confiscations. Another effort was repeal activism. Document 4 shows the WONPR organizing women voters, rallies, radio messages, lobbying, and publicity against Prohibition. The impact was mixed. Prohibition showed that reformers could change the Constitution, but it also created enforcement problems and public backlash. Document 5 argues that Prohibition failed to change behavior or eliminate alcohol abuse. Document 6 shows that after repeal, Roosevelt still wanted limits on saloons, proving the debate did not simply disappear. Outside the documents, the Twenty-first Amendment repealed national Prohibition in 1933, while organized crime and speakeasies during the 1920s showed the difficulty of enforcing the ban. Overall, Prohibition was only partly successful because it reduced legal alcohol sales but failed to win lasting public support or solve the social problems reformers targeted.",
        },
    },
}


def main() -> int:
    data = {
        "version": "20260430-exact-jan2026",
        "generatedAt": now_iso(),
        "sourceNote": "Practice-only fixed released forms built from NYSED January 2026 materials.",
        "forms": FORMS,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} and cropped released-form document assets.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
